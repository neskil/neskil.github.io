// THE COLOUR RUN (blue-city-holi). Holi morning in the blue city under the fort: the camera runs at langur height
// across a kilometre of indigo and cobalt rooftops while plumes of powder stand up out of every lane into slanting
// sun; three clouds stand close beside the route (the camera brushes each one's flank: the haze takes a breath of its colour
// and the settling motes turn to it, but the city and the fort stay crisp); people on the roofs throw the powder; between
// s 60 and s 212 the camera drops into a lane (people pressed to its walls, saris hung down them, langurs running the parapets
// overhead), passes a crossing where a crowd throws colour round the first cloud's foot, and climbs out to the roofs; then the
// roofs fall away to the market square (the hero set piece) where everything goes up at once and the cloud parts to show the
// gate and the portal.
// World axes are the brief's: +X east, +Z south, heights above the floor of the market square. The camera heads north.
// Looks (ctx.vary.hour or seed): day 9 a.m. (default), dawn (first sun), golden (late afternoon, sun on the left),
// night (bonfire eve: smoke, sparks, oil lamps, moonlit fort). Weather by seed: still air, breeze or a stiff breeze.
// Cast by seed: three colours, a five-colour year, or a banded quarter; troop of 8-20; a wedding band's parasols;
// petals round the temples. Rare event: a dust devil walks into the square and winds the colours into one column.
// Far roofs carry one more instanced draw of stair hutches and tanks; the ring round the square has real parapets.
// Ranks of plumes stand across the whole bowl to the cliff foot (one at every tenth lane crossing of every tenth lane); four flocks
// of pigeons and a screech of parakeets wheel round plumes beside the route, on the world's clock. No paper kites: they are
// another world's subject. Where their stacks lay on the roofs stand bicycles leaned on parapets, brass water pots and clay lamps.
// The build yields inside every long loop (no rng draw order depends on it); extra dressing uses its own seeded rngs.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as flora from '../kit/flora.js';
import { buildHero, makeClothMaterial } from '../parts/blue-city-holi.js';

const TAU = Math.PI * 2;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const PALETTE = ['#27348B', '#3E6FD6', '#E8EEF7', '#C98F58', '#E6178A', '#FF9A1E', '#2FBF6B'];
const PITCH = 11, GN = 48;                      // house grid: pitch in metres, cells from -GN..GN

// ---------- looks ----------
const LOOKS = {
  day: {
    title: 'The Colour Run',
    sky: { preset: 'day', zenith: '#4F86D9', mid: '#79a5e6', horizon: '#EFE6D6', ground: '#cdbfa6', horizonPow: 3.2, midPow: 1.0, sunElevation: 32, sunAzimuth: 95,
      sunColor: '#fff4dc', sunSize: 0.8, sunIntensity: 12, scatterColor: '#fff0d0', scatter: 0.35, clouds: false,
      clouds2: { coverage: 0.3, stretch: 1, opacity: 0.24, scale: 0.7, haze: 0.6 },
      lightColor: '#ffeccf', lightIntensity: 3.6, ambientColor: '#86a8ee', groundLight: '#b89468', ambientIntensity: 1.7 },
    fog: '#E6DCCB', density: 0.00065, exposure: 1.0, lit: [1.75, 1.58, 1.3], shade: [0.33, 0.35, 0.5], gate: 0, fire: 0, night: 0, stain: 0.45,
    amb: [0.3, 0.36, 0.58], glow: 0.1, grade: { tint: '#fff9ef', shadowTint: '#0b1238', saturation: 1.1 }, portal: '#fff1d2', shadowRange: 75,
  },
  dawn: {
    title: 'The Colour Run: First Sun',
    sky: { preset: 'dawn', zenith: '#3a5fb4', mid: '#7388c6', horizon: '#e6b89c', ground: '#8f8aa0', horizonPow: 2.6, midPow: 1.2, sunElevation: 6.5, sunAzimuth: 95,
      sunColor: '#ffd9a0', sunSize: 0.9, sunIntensity: 12, scatterColor: '#ffb070', scatter: 0.8, scatterPow: 6, clouds: false,
      clouds2: { coverage: 0.34, stretch: 1, opacity: 0.45, scale: 0.7, lit: '#ffd2b0', shade: '#7f86b8', haze: 1.2 },
      lightColor: '#ffb478', lightIntensity: 2.2, ambientColor: '#6f8fe0', groundLight: '#8a84a8', ambientIntensity: 2.0, lightElevationMin: 6 },
    fog: '#b7b0cc', density: 0.0005, exposure: 1.12, lit: [2.0, 1.45, 1.0], shade: [0.3, 0.34, 0.56], gate: 7, fire: 0, night: 0, stain: 0.3, glowCol: [1.35, 0.85, 0.5],
    amb: [0.26, 0.33, 0.62], glow: 1.0, grade: { tint: '#fff4ea', shadowTint: '#0a1244', saturation: 1.1 }, portal: '#ffe6c0', shadowRange: 100,
  },
  golden: {
    title: 'The Colour Run: Gold Afternoon',
    sky: { preset: 'goldenHour', zenith: '#3f72c4', mid: '#8fb0e0', horizon: '#f7dcae', ground: '#c9b188', horizonPow: 3.6, midPow: 1.2, sunElevation: 22, sunAzimuth: 258,
      sunColor: '#ffd9a0', sunSize: 0.9, sunIntensity: 12, scatterColor: '#ffc480', scatter: 0.45, scatterPow: 5, clouds: false,
      clouds2: { coverage: 0.36, stretch: 1, opacity: 0.2, scale: 0.7, lit: '#ffe0b8', shade: '#8a93b4', haze: 0.3 },
      lightColor: '#ffd9a6', lightIntensity: 3.6, ambientColor: '#6f95f0', groundLight: '#b88a5c', ambientIntensity: 1.6 },
    fog: '#ecd3a6', density: 0.0009, exposure: 1.08, lit: [1.9, 1.5, 1.05], shade: [0.3, 0.34, 0.58], gate: 0, fire: 0, night: 0, stain: 0.6, pave: 0.45,
    amb: [0.32, 0.36, 0.55], glow: 0.3, grade: { tint: '#fff3de', shadowTint: '#0d1238', saturation: 1.12 }, portal: '#ffe9c4', shadowRange: 75,
  },
  night: {
    title: 'The Colour Run: Bonfire Eve',
    sky: { preset: 'night', zenith: '#070c22', mid: '#111c40', horizon: '#2a3a66', ground: '#0b0f1c', bodyOverrides: { 0: { elevation: 40, azimuth: 118, size: 2.4 } },
      clouds: false, clouds2: { coverage: 0.3, stretch: 1, opacity: 0.3, lit: '#52628c', shade: '#161d34', haze: 1.4 },
      lightColor: '#a9bcff', lightIntensity: 1.15, ambientColor: '#6276b8', groundLight: '#4a3426', ambientIntensity: 1.3 },
    fog: '#18203a', density: 0.0011, exposure: 1.18, lit: [0.34, 0.4, 0.62], shade: [0.2, 0.2, 0.26], gate: 0, fire: 1, night: 1, stain: 0.2, pave: 0.15,
    amb: [0.1, 0.12, 0.22], glow: 0.5, grade: { tint: '#f6f2ff', shadowTint: '#04060f', saturation: 1.08 }, portal: '#ffd9a0', shadowRange: 75,
  },
};

const GLSL_N = /* glsl */`
float hh21(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hh21(i), hh21(i + vec2(1., 0.)), f.x), mix(hh21(i + vec2(0., 1.)), hh21(i + vec2(1., 1.)), f.x), f.y); }
float fb2(vec2 p){ return vn2(p) * .5 + vn2(p * 2.07 + 11.3) * .3 + vn2(p * 4.3 + 37.1) * .2; }
`;

// ---------- a fast flat-shaded geometry accumulator (typed arrays; a local frame turned about Y) ----------
// aux = (mode, parameter) for the city material, or (wind amplitude, phase) for cloth
function makeGeo(cap) {
  const P = new Float32Array(cap * 3), N = new Float32Array(cap * 3), C = new Float32Array(cap * 3), A = new Float32Array(cap * 2);
  let n = 0, fx0 = 0, fy0 = 0, fz0 = 0, fc = 1, fs = 0;
  const G = { a0: 0, a1: 0 };
  const T = (p, o) => { o[0] = fx0 + p[0] * fc + p[2] * fs; o[1] = fy0 + p[1]; o[2] = fz0 - p[0] * fs + p[2] * fc; return o; };
  const t0 = [0, 0, 0], t1 = [0, 0, 0], t2 = [0, 0, 0], t3 = [0, 0, 0];
  const put = (p, nx, ny, nz, c) => {
    if (n >= cap) return;
    const i = n * 3; P[i] = p[0]; P[i + 1] = p[1]; P[i + 2] = p[2]; N[i] = nx; N[i + 1] = ny; N[i + 2] = nz; C[i] = c[0]; C[i + 1] = c[1]; C[i + 2] = c[2];
    A[n * 2] = G.a0; A[n * 2 + 1] = G.a1; n++;
  };
  G.frame = (x = 0, y = 0, z = 0, ry = 0) => { fx0 = x; fy0 = y; fz0 = z; fc = Math.cos(ry); fs = Math.sin(ry); };
  // quad a-b-c-d (counter-clockwise seen from outside), colours ca on a,b and cb on c,d; local points
  G.quad = (a, b, c, d, ca, cb = ca, two = false) => {
    T(a, t0); T(b, t1); T(c, t2); T(d, t3);
    let ux = t1[0] - t0[0], uy = t1[1] - t0[1], uz = t1[2] - t0[2]; const vx = t3[0] - t0[0], vy = t3[1] - t0[1], vz = t3[2] - t0[2];
    if (ux * ux + uy * uy + uz * uz < 1e-10) { ux = t2[0] - t0[0]; uy = t2[1] - t0[1]; uz = t2[2] - t0[2]; }
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    put(t0, nx, ny, nz, ca); put(t1, nx, ny, nz, ca); put(t2, nx, ny, nz, cb); put(t0, nx, ny, nz, ca); put(t2, nx, ny, nz, cb); put(t3, nx, ny, nz, cb);
    if (two) { put(t0, -nx, -ny, -nz, ca); put(t2, -nx, -ny, -nz, cb); put(t1, -nx, -ny, -nz, ca); put(t0, -nx, -ny, -nz, ca); put(t3, -nx, -ny, -nz, cb); put(t2, -nx, -ny, -nz, cb); }
  };
  // cloth quad (the cloth material draws both faces): a,b carry wind amplitude w0 and c,d carry w1 (aux.y = phase stays as set)
  G.quadW = (a, b, c, d, ca, cb, w0, w1) => {
    T(a, t0); T(b, t1); T(c, t2); T(d, t3);
    const ux = t1[0] - t0[0], uy = t1[1] - t0[1], uz = t1[2] - t0[2], vx = t3[0] - t0[0], vy = t3[1] - t0[1], vz = t3[2] - t0[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const k = G.a0;
    G.a0 = w0; put(t0, nx, ny, nz, ca); put(t1, nx, ny, nz, ca); G.a0 = w1; put(t2, nx, ny, nz, cb); G.a0 = w0; put(t0, nx, ny, nz, ca); G.a0 = w1; put(t2, nx, ny, nz, cb); put(t3, nx, ny, nz, cb);
    G.a0 = k;
  };
  G.tri = (a, b, c, ca, two = false) => {
    T(a, t0); T(b, t1); T(c, t2);
    const ux = t1[0] - t0[0], uy = t1[1] - t0[1], uz = t1[2] - t0[2], vx = t2[0] - t0[0], vy = t2[1] - t0[1], vz = t2[2] - t0[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    put(t0, nx, ny, nz, ca); put(t1, nx, ny, nz, ca); put(t2, nx, ny, nz, ca);
    if (two) { put(t0, -nx, -ny, -nz, ca); put(t2, -nx, -ny, -nz, ca); put(t1, -nx, -ny, -nz, ca); }
  };
  // box standing on y (local centre cx, cz; size sx, sy, sz); o: t taper of the top, ct top colour, g foot darkening, r own turn, nt no top,
  // ne no end faces (the two across its z axis, where it butts against something)
  G.box = (cx, y, cz, sx, sy, sz, col, o) => {
    const t = o?.t ?? 1, r = o?.r ?? 0, hx = sx / 2, hz = sz / 2, y1 = y + sy, c0 = o?.g ? mul(col, o.g) : col, ct = o?.ct ?? col;
    const cr = Math.cos(r), sr = Math.sin(r);
    const L = (lx, lz, yy) => [cx + lx * cr + lz * sr, yy, cz - lx * sr + lz * cr];
    const b0 = L(-hx, -hz, y), b1 = L(hx, -hz, y), b2 = L(hx, hz, y), b3 = L(-hx, hz, y);
    const u0 = L(-hx * t, -hz * t, y1), u1 = L(hx * t, -hz * t, y1), u2 = L(hx * t, hz * t, y1), u3 = L(-hx * t, hz * t, y1);
    if (!o?.ne) { G.quad(b3, b2, u2, u3, c0, col); G.quad(b1, b0, u0, u1, c0, col); }
    G.quad(b2, b1, u1, u2, c0, col); G.quad(b0, b3, u3, u0, c0, col);
    if (!o?.nt) G.quad(u3, u2, u1, u0, ct, ct);
  };
  // frustum / cylinder / cone about the local Y axis; ct = cap colour (null: open)
  G.cyl = (cx, y, cz, r0, r1, h, seg, col, ct = col, g = 1) => {
    const c0 = g === 1 ? col : mul(col, g);
    for (let k = 0; k < seg; k++) {
      const a0 = (k / seg) * TAU, a1 = ((k + 1) / seg) * TAU, s0 = Math.sin(a0), q0 = Math.cos(a0), s1 = Math.sin(a1), q1 = Math.cos(a1);
      const pa = [cx + r0 * s0, y, cz + r0 * q0], pb = [cx + r0 * s1, y, cz + r0 * q1], pc = [cx + r1 * s1, y + h, cz + r1 * q1], pd = [cx + r1 * s0, y + h, cz + r1 * q0];
      if (r1 > 1e-4) G.quad(pa, pb, pc, pd, c0, col); else G.tri(pa, pb, pc, col);
      if (ct && r1 > 1e-4) G.tri(pd, pc, [cx, y + h, cz], ct);
    }
  };
  G.count = () => n;
  const bounds = (g) => {
    let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;                    // a box's sphere: one cheap pass
    for (let i = 0, e = n * 3; i < e; i += 3) { const x = P[i], y = P[i + 1], z = P[i + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    if (!n) { x0 = y0 = z0 = x1 = y1 = z1 = 0; }
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), 0.5 * Math.hypot(x1 - x0, y1 - y0, z1 - z0));
    return g;
  };
  G.build = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P.slice(0, n * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(N.slice(0, n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(C.slice(0, n * 3), 3));
    g.setAttribute('aux', new THREE.BufferAttribute(A.slice(0, n * 2), 2));
    return bounds(g);
  };
  // the same, handing the page back between the attribute copies (the big merged meshes)
  G.buildSteps = async (brk) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P.slice(0, n * 3), 3)); await brk();
    g.setAttribute('normal', new THREE.BufferAttribute(N.slice(0, n * 3), 3)); await brk();
    g.setAttribute('color', new THREE.BufferAttribute(C.slice(0, n * 3), 3)); await brk();
    g.setAttribute('aux', new THREE.BufferAttribute(A.slice(0, n * 2), 2));
    bounds(g); await brk();
    return g;
  };
  return G;
}

// ---------- materials ----------
// U: { uTime, uSun, uPow (3 colours), uNight, uStain, uGlow, uLane }
// Houses: one instanced unit box. The shader lays out a roof (cement floor, coping, trodden powder, and for far roofs
// painted clutter and the parapet's shadow), walls (shuttered windows, blue doors, plinth, lime streaks, lane shade).
// iSeed = (seed, kind: 0 far / 1 dressed / 2 sandstone haveli (its terrace keeps the stone's colour), metres of wall buried below the lane, 1 on the lane the camera runs)
function makeHouseMaterial(U) {
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.93, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uSun: U.uSun, uPow: U.uPow, uNight: U.uNight, uStain: U.uStain, uLane: U.uLane, uTime: U.uTime });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 iSeed; uniform vec3 uSun; varying vec3 vHp, vHn; flat varying vec3 vHs, vSunL; flat varying vec4 vSeed;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vHp = position; vHn = normal; vSeed = iSeed;
        #ifdef USE_INSTANCING
          vec3 hax = instanceMatrix[0].xyz, haz = instanceMatrix[2].xyz;
          vHs = vec3(length(hax), length(instanceMatrix[1].xyz), length(haz));
          vSunL = vec3(dot(uSun, hax) / max(vHs.x, 1e-3), uSun.y, dot(uSun, haz) / max(vHs.z, 1e-3));
        #else
          vHs = vec3(1.); vSunL = uSun;
        #endif`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vHp, vHn; flat varying vec3 vHs, vSunL; flat varying vec4 vSeed; uniform vec3 uPow[3]; uniform float uNight, uStain, uLane, uTime;\n' + GLSL_N)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 hEmis = vec3(0.);
        {
          vec3 dc = diffuseColor.rgb; vec3 an = abs(vHn); vec3 m = vHp * vHs; float seed = vSeed.x, kind = vSeed.y;
          float topd = vHs.y - m.y;
          float sel = hh21(vec2(seed * 7., 3.)) * 3.;
          vec3 pc = sel < 1. ? uPow[0] : (sel < 2. ? uPow[1] : uPow[2]);
          if (an.y > .5) {
            vec2 q = m.xz, hf = vHs.xz * .5;
            float e = min(hf.x - abs(q.x), hf.y - abs(q.y));
            float fw = fwidth(q.x) + fwidth(q.y);
            float blot = fb2(q * .45 + seed * 37.);
            float far = 1. - step(.5, kind), nearK = 1. - far, faa = 1. / (1. + fw * 3.);
            vec3 fl = mix(dc, vec3(.72, .7, .66), kind > 1.5 ? .35 : mix(.68, .5, nearK)) * mix(.74 + .4 * blot, .6 + .7 * blot, nearK);
            fl *= 1. - .22 * smoothstep(.55, .8, vn2(q * 1.3 + seed * 11.));
            // dressed roofs: cement laid in 1.5 m slabs, a drain stain running to the spout, the parapet's foot in shade
            vec2 sq = q / 1.5 + seed * 3., sj = abs(fract(sq) - .5) * 1.5;
            fl *= 1. - .3 * nearK * (1. - smoothstep(.012, .045 + fw, min(sj.x, sj.y))) * faa;
            fl *= 1. + .16 * nearK * (hh21(floor(sq) + seed * 5.) - .5) * faa;
            float dsd = hh21(vec2(seed * 5., 9.)) < .5 ? -1. : 1., dx = hf.x - q.x * dsd;
            float dz0 = (hh21(vec2(seed * 11., 2.)) - .5) * vHs.z * .55 + .45 * sin(q.x * 1.1 + seed * 20.);
            float dwd = .16 + .1 * dx + .3 * vn2(vec2(q.x * 1.7, seed * 9.));
            fl *= 1. - .36 * nearK * (1. - smoothstep(dwd * .45, dwd, abs(q.y - dz0))) * (1. - smoothstep(hf.x * .9, hf.x * 1.7, dx)) * (.6 + .4 * vn2(q * 3.1));
            fl *= 1. - .36 * nearK * (1. - smoothstep(.2, .8, e));
            // powder trodden over the floor: scuffed drifts, with the prints of the feet that crossed them
            float st = smoothstep(.66 - .3 * uStain, .86, fb2(q * .35 + seed * 91.));
            vec2 fg = q * 2.5 + seed * 17., fi = floor(fg), fc = fract(fg) - .5; float fh = hh21(fi), fa = fh * 6.2831853;
            fc = vec2(fc.x * cos(fa) - fc.y * sin(fa), fc.x * sin(fa) + fc.y * cos(fa));
            float fp = step(.5, fract(fh * 7.3)) * (1. - smoothstep(.75, 1.05, length(fc * vec2(3.3, 8.)))) / (1. + fw * 6.);
            float scuff = .55 + .45 * smoothstep(.3, .7, vn2(q * 4.3 + seed * 3.));
            fl = mix(fl, pc * .75, st * mix(.3 + .45 * uStain, (.42 + .3 * uStain) * scuff * (1. - .8 * fp), nearK));
            vec2 cg = floor(q / 1.8), cf = fract(q / 1.8) - .5; float ch = hh21(cg + seed * 91.);
            float it = step(.68, ch) * step(abs(cf.x), .34) * step(abs(cf.y), .16 + .2 * fract(ch * 7.)) * step(1., e) * far / (1. + fw * .5);
            vec3 ic = ch < .79 ? vec3(.5, .06, .045) : (ch < .87 ? vec3(.035, .035, .045) : (ch < .94 ? vec3(.78, .76, .7) : pc));
            fl = mix(fl, ic, it);
            float sl = max(length(vSunL.xz), 1e-3);
            vec2 qs = q + (vSunL.xz / sl) * min(.9 * sl / max(vSunL.y, .1), 6.);
            float outd = max(abs(qs.x) - (hf.x - .26), abs(qs.y) - (hf.y - .26));
            fl *= mix(vec3(1.), vec3(.4, .46, .66), smoothstep(-.12, .12, outd) * far * uLane);
            fl *= 1. - .42 * far * (1. - smoothstep(.26, .52 + fw, e)) / (1. + fw * .6);
            float cop = 1. - smoothstep(.2, .28 + fw, e);
            dc = mix(fl, dc * 1.18 + .03, cop);
            float lu = (q.x + q.y) / 1.3;
            float lamp = step(.45, hh21(vec2(floor(lu), seed))) * (1. - smoothstep(0., .2 + fw, abs(fract(lu) - .5))) * cop;
            hEmis += vec3(2.8, 1.3, .36) * lamp * uNight * (.7 + .3 * sin(uTime * 9. + seed * 60. + floor(lu) * 3.));
          } else {
            bool xf = an.x > an.z;
            float wu = xf ? m.z : m.x, wl = xf ? vHs.z : vHs.x;
            float fw = fwidth(wu) + fwidth(m.y), aa = 1. / (1. + fw * 2.);
            dc *= .82 + .34 * fb2(vec2(wu + seed * 13., m.y) * .33);
            dc *= 1. - .2 * smoothstep(.5, .9, vn2(vec2(wu * 2.3 + seed * 5., m.y * .09)));
            // the lane's walls pass at arm's length: patches where the limewash has been laid over again, paler and newer
            dc = mix(dc, dc * 1.2 + .015, smoothstep(.5, .54 + fw, fb2(vec2(wu + seed * 31., m.y * 1.3) * .8)) * .55 * vSeed.w);
            float bays = max(1., floor(wl / 2.5)), bw = wl / bays, bu = (wu / wl + .5) * bays, fv = topd / 2.9 - .22;
            vec2 cell = vec2(floor(bu), floor(fv)), cf = vec2(fract(bu) - .5, fract(fv) - .5);
            float hw = hh21(cell + seed * 17. + (xf ? 3. : 0.));
            float wx = abs(cf.x) * bw, wy = abs(cf.y) * 2.9, has = step(.4, hw) * step(0., fv);
            float isWin = has * step(wx, .36) * step(wy, .52), frame = has * step(wx, .47) * step(wy, .64);
            vec3 shut = hw > .8 ? vec3(.05, .15, .19) : (hw > .6 ? vec3(.06, .08, .24) : vec3(.19, .11, .06));
            shut *= mix(1., .75 + .5 * step(.5, fract(wy / .13)), 1. / (1. + fw * 24.));
            dc = mix(dc, dc * 1.15 + .03, (1. - smoothstep(.03, .07 + fw, abs(fract(fv + .5) - .5) * 2.9)) * step(0., fv) * aa * .7);
            dc = mix(dc, mix(dc, vec3(.72, .78, .9), .8), frame * aa); dc = mix(dc, shut * .8, isWin * aa);
            float yg = m.y - vSeed.z;
            float door = step(hh21(vec2(cell.x, seed * 3. + (xf ? 1. : 2.))), .4) * step(wx, .55) * step(yg, 2.1) * step(0., yg);
            dc = mix(dc, vec3(.035, .075, .26), door * aa);
            dc = mix(dc, dc * 1.28 + .04, (1. - smoothstep(.5, .7, yg)) * (1. - door) * .8);
            float ws = smoothstep(.5, .78, fb2(vec2(wu, m.y) * .5 + seed * 9.)) * (1. - smoothstep(.3, 4.5, yg));
            dc = mix(dc, pc * .8, ws * (.3 + .3 * uStain));
            dc = mix(dc, dc * 1.2 + .03, 1. - smoothstep(.18, .3, topd));
            dc *= mix(vec3(1.), vec3(.5, .56, .76), smoothstep(.6, 5.5, topd) * uLane * (1. - .75 * vSeed.w));   // the lane the camera runs has real shadows
            hEmis += vec3(2.2, 1.2, .45) * isWin * step(.74, hh21(cell + seed * 5.)) * uNight * aa;
            hEmis += dc * vec3(1.2, .55, .2) * (1. - smoothstep(0., 7., yg)) * uNight * .5;
          }
          diffuseColor.rgb = dc;
        }`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += hEmis;');
  };
  mat.customProgramCacheKey = () => 'holi-house2';
  return mat;
}

// Everything merged (parapets, props, fort, cliff, ground): aux = (mode, parameter)
// 0 limewash  1 sandstone courses  2 brass  3 ground (0 lane, 1 desert, 2 talus)  4 cliff  5 fort wall with screened
// balconies (par = base of the windowed band)  6 cloth laid flat (0 plain, 1 chillies, 2 papad, 3 quilt)  7 flame  8 pierced stone screen
function makeCityMaterial(U) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uPow: U.uPow, uNight: U.uNight, uGlow: U.uGlow, uGlowCol: U.uGlowCol, uTime: U.uTime, uStain: U.uStain });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aux; varying vec3 vLp; varying vec3 vLn; varying vec2 vAux;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLp = (modelMatrix * vec4(position, 1.)).xyz; vLn = normal; vAux = aux;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLp; varying vec3 vLn; varying vec2 vAux; uniform vec3 uPow[3]; uniform vec3 uGlowCol; uniform float uNight, uGlow, uTime, uStain;\n' + GLSL_N)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float hBrass = 0.; vec3 hEmis = vec3(0.);
        {
          float md = vAux.x, par = vAux.y; vec3 lp = vLp; vec3 an = abs(vLn);
          float wallU = an.x > an.z ? lp.z : lp.x; vec2 wuv = vec2(wallU, lp.y);
          float vert = 1. - smoothstep(.55, .8, an.y);
          vec3 dc = diffuseColor.rgb;
          float fw = fwidth(lp.y) + fwidth(wallU);
          if (md < .5) {
            dc *= .82 + .32 * fb2(wuv * .4 + lp.zx * .13 + 3.1);
            dc *= 1. - .18 * smoothstep(.5, .9, vn2(vec2(wallU * 2.3, lp.y * .09 + 4.))) * vert;
          } else if (md < 1.5) {
            float course = lp.y / .5, row = floor(course);
            float bu = wallU / 1.1 + hh21(vec2(row, 7.));
            float dj = min(min(fract(course), 1. - fract(course)) * .5, min(fract(bu), 1. - fract(bu)) * 1.1);
            dc *= mix(1., .8, (1. - smoothstep(.01, .03 + fw, dj)) / (1. + fw * 14.) * vert);
            dc *= .8 + .4 * fb2(wuv * .33 + 3.1);
          } else if (md < 2.5) {
            float fine = vn2(wuv * 5.5 + lp.zx * 2.1);
            dc *= .8 + .4 * fine; hEmis = dc * (.3 + .8 * smoothstep(.72, .95, fine)) * (1. - uNight * .8); hBrass = 1.;
          } else if (md < 3.5) {
            vec2 g = lp.xz; float pf = fwidth(g.x) + fwidth(g.y);
            if (par < .5) {
              vec2 fq = g / vec2(.95, .62); fq.x += floor(fq.y) * .37; vec2 ff = fract(fq);
              float jd = min(min(ff.x, 1. - ff.x) * .95, min(ff.y, 1. - ff.y) * .62);
              float jn = (1. - smoothstep(.012, .045 + pf, jd)) / (1. + pf * 9.);
              dc *= (.78 + .36 * fb2(g * .21)) * (1. - .42 * jn) * (.88 + .24 * hh21(floor(fq)) / (1. + pf * 5.));
              float s0 = smoothstep(.5, .78, fb2(g * .09 + 1.7)), s1 = smoothstep(.55, .8, fb2(g * .1 + 31.3)), s2 = smoothstep(.55, .8, fb2(g * .095 + 77.1));
              float gr = (.55 + .45 * fb2(g * .9 + 5.)) * .8 * smoothstep(.15, .45, uStain);
              dc = mix(dc, uPow[0] * .8, s0 * .55 * gr); dc = mix(dc, uPow[1] * .8, s1 * .5 * gr); dc = mix(dc, uPow[2] * .8, s2 * .5 * gr);
            } else {
              dc *= .84 + .24 * fb2(g * .012) + .1 * vn2(g * .11) / (1. + pf);
              float scrub = smoothstep(.6, .7, vn2(g * .16 + 9.)) * smoothstep(.4, .7, vn2(g * .013 + 3.));
              dc = mix(dc, vec3(.2, .23, .12), scrub * (par > 1.5 ? .8 : .45) / (1. + pf * .3));
            }
          } else if (md < 4.5) {
            float y = lp.y + 6. * vn2(lp.xz * .02) + 3. * vn2(wuv * .05);
            dc *= .7 + .42 * vn2(vec2(y * .16, 3.)) + .16 * vn2(vec2(y * .55, 9.));
            dc = mix(dc, dc * vec3(1.14, .9, .76), smoothstep(.5, .8, vn2(vec2(y * .07, 5.))));
            dc *= 1. - .3 * smoothstep(.6, .7, vn2(vec2(lp.x * .11 + lp.z * .07, y * .012)));
            dc *= 1. - .26 * smoothstep(.45, .85, fb2(vec2(lp.x * .2, lp.y * .02)));
            hEmis = dc * uGlow * uGlowCol;
          } else if (md < 5.5) {
            dc *= .8 + .36 * fb2(wuv * .08 + 3.1);
            dc *= 1. - .2 * smoothstep(.5, .9, vn2(vec2(wallU * .5, lp.y * .02 + 4.))) * vert;
            float rows = (lp.y - par) / 8.5, cols = wallU / 6.4;
            vec2 cf = vec2(fract(cols) - .5, fract(rows) - .5);
            float on = step(0., rows) * step(.22, hh21(vec2(floor(cols), floor(rows)))) * vert;
            float win = on * step(abs(cf.x), .24) * step(abs(cf.y + .02), .3);
            float bal = on * step(abs(cf.x), .33) * step(abs(cf.y + .36), .07);
            dc = mix(dc, dc * .2, win / (1. + fw * .15)); dc = mix(dc, dc * 1.3, bal / (1. + fw * .5));
            hEmis = dc * uGlow * uGlowCol + vec3(2., 1.1, .4) * win * uNight * step(.8, hh21(vec2(floor(cols) + 3., floor(rows))));
          } else if (md < 6.5) {
            vec2 g = lp.xz;
            if (par > 2.5) dc *= .75 + .5 * step(.5, fract((g.x + g.y) / .3));
            else if (par > 1.5) { vec2 c = fract(g / .34) - .5; dc = mix(dc, vec3(.82, .72, .5), (1. - smoothstep(.3, .36, length(c))) * step(.2, hh21(floor(g / .34)))); }
            else if (par > .5) dc *= .65 + .7 * vn2(g * 14.);
          } else if (md < 7.5) {
            hEmis = dc * par * (.75 + .25 * sin(uTime * 11. + lp.x * 7. + lp.z * 5.)) * mix(.2, 1., uNight);
          } else {
            vec2 jc = fract(wuv / .15) - .5;
            float hole = 1. - smoothstep(.2, .3 + fw * 2., abs(jc.x) + abs(jc.y));
            dc = mix(dc * (.85 + .3 * fb2(wuv * .4 + 3.1)), dc * .14, hole / (1. + fw * 6.));
          }
          diffuseColor.rgb = dc;
        }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .34, hBrass);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, .45, hBrass);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += hEmis;');
  };
  mat.customProgramCacheKey = () => 'holi-city';
  return mat;
}

export default {
  id: 'blue-city-holi',
  name: 'The Colour Run',
  category: 'city',
  weirdness: 0.2,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    // ---- what kind of morning it is ----
    const vr = rng.fork('holi-look');
    const hourRoll = vr.pick(['day', 'day', 'day', 'dawn', 'golden', 'golden', 'night', 'night']);
    const weather = vr.pick(['still', 'breeze', 'breeze', 'breeze', 'stiff']);
    const leanRoll = [vr.range(0.02, 0.06), vr.range(0.16, 0.3), vr.range(0.56, 0.7)];        // a stiff breeze also blows 1.3 times harder (see uWind below)
    const castRoll = vr.pick(['three', 'three', 'five', 'banded', 'banded']);
    const troop = Math.round(vr.range(8, 20)), weddingRoll = vr.chance(0.4), petals = vr.chance(0.6);
    const hour = LOOKS[vary.hour] ? vary.hour : hourRoll, look = LOOKS[hour], night = look.night;
    const lean = leanRoll[weather === 'still' ? 0 : weather === 'stiff' ? 2 : 1];
    const cast = night ? 'three' : castRoll, wedding = weddingRoll && !night;
    const rare = !!vary.rare, density = vary.density ?? 1;
    const pal = PALETTE.map(lin), KW0 = mul(lin(PALETTE[2]), 0.82);
    const scene = new THREE.Scene();

    // ---- the route: laid first, the roofs are placed under it ----
    const yAt = (s) => 52 - 19 * Math.pow(s / 370, 1.2);
    const tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3();
    // The route over the roofs as the brief lays it (path0), then the same route with one long dip: from s 62 the camera sinks into
    // a lane (floor 4.1 m below it, roofs 5.7 m above), runs it past a crossing where the sun comes in and a crowd throws colour,
    // and climbs out again by s 212. Roofs, ground and everything else are laid to the undipped height (refY).
    const path0 = makePath([[-70, 52, 445], [-70, yAt(35), 410], [-70, yAt(70), 375], [-64.3, yAt(125), 320.4], [-47.5, yAt(180), 268.2], [-26, yAt(237), 215],
      [-10, yAt(290), 165], [-2, yAt(331), 125], [0, 33, 90], [0, 27.3, 54], [0, 21.6, 18], [0, 15.9, -18], [0, 11.2, -46], [0, 9, -60]]);
    await ctx.yield();
    const LANE0 = 60, LANE1 = 212, RAMP = 50, DIP = 8.3, CROSS = 150;
    const dipAt = (s) => sstep(LANE0, LANE0 + RAMP, s) * (1 - sstep(LANE1 - RAMP, LANE1, s));
    const laneK = (s) => sstep(LANE0 + 6, LANE0 + 34, s) * (1 - sstep(LANE1 - 34, LANE1 - 6, s));      // how far the lane's roofs have risen round the camera
    const pathPts = [];
    for (let i = 0; i < 25; i++) { const s = i * 13.24; path0.posAtDist(s, tmpP); pathPts.push([tmpP.x, tmpP.y - DIP * dipAt(s), tmpP.z]); }
    pathPts.push([-2, yAt(331), 125], [0, 33, 90], [0, 27.3, 54], [0, 21.6, 18], [0, 15.9, -18], [0, 11.2, -46], [0, 9, -60]);
    const path = makePath(pathPts);
    const L = path.length, duration = 44;
    const refY = (nr) => nr.y + DIP * dipAt(nr.u * L);
    await ctx.yield();
    const side = (s, lat, out) => { path.posAtDist(s, tmpP); path.tangentAtDist(s, tmpT); const l = Math.hypot(tmpT.x, tmpT.z) || 1; out[0] = tmpP.x - (tmpT.z / l) * lat; out[1] = tmpP.y; out[2] = tmpP.z + (tmpT.x / l) * lat; return out; };

    // ---- the bowl ----
    const bowl = (x, z) => {
      const hy = Math.hypot(x, z), dd = mix(Math.max(Math.abs(x), Math.abs(z)) * 1.06, hy, sstep(70, 200, hy));
      let h = 40 * Math.pow(sat((dd - 70) / 410), 0.45);
      if (dd > 500) h -= 9 * sstep(500, 760, dd);
      h += 26 * sstep(-395, -478, z) * (1 - sstep(520, 700, Math.abs(x)));
      h += 70 * Math.exp(-((x - 1050) ** 2 + (z + 150) ** 2) / 108900) + 55 * Math.exp(-((x + 1150) ** 2 + (z - 420) ** 2) / 90000);
      return h;
    };
    const ground = (x, z) => {
      const b = bowl(x, z), nr = path.nearestXZ(x, z);
      if (nr.dist > 95) return b;
      return mix(b, refY(nr) - 12.4, (1 - sstep(28, 95, nr.dist)) * (1 - sstep(352, 380, nr.u * L)));
    };
    const warp = (x, z, o) => { const k = sstep(90, 220, Math.hypot(x, z)) * 6.5; o[0] = x + k * noise.n2(x * 0.0045, z * 0.0045); o[1] = z + k * noise.n2(x * 0.0045 + 40, z * 0.0045 - 17); return o; };
    const W2 = 2 * GN + 1, cellHouse = new Int32Array(W2 * W2).fill(-1), cellState = new Uint8Array(W2 * W2);   // 1 courtyard, 2 tree court
    const cellOf = (x, z) => { const k = sstep(90, 220, Math.hypot(x, z)) * 6.5; const i = Math.round((x - k * noise.n2(x * 0.0045, z * 0.0045)) / PITCH), j = Math.round((z - k * noise.n2(x * 0.0045 + 40, z * 0.0045 - 17)) / PITCH); return [i, j]; };
    const cidx = (i, j) => (i + GN) * W2 + (j + GN);
    const w2 = [0, 0], v3 = [0, 0, 0];

    // ---- where the colour stands: three clouds hard by the route, ten beside it (six of them on roofs), the rest through the city ----
    const hr = rng.fork('houses'), pr = rng.fork('plumes');
    const plumes = [], bandCol = (x, z) => ((Math.floor((x * 0.8 + z * 0.6) / 95) % 3) + 3) % 3;
    const nCol = cast === 'five' ? 5 : 3;
    const colFor = (x, z, pref) => (cast === 'banded' ? bandCol(x, z) : pref ?? pr.int(0, nCol - 1));
    const routeOrder = cast === 'five' ? pr.shuffle([0, 1, 2, 3, 4]).slice(0, 3) : [0, 1, 2];
    const crossing = (x, z) => { const [i, j] = cellOf(x, z); const bx = (i + (x > i * PITCH ? 0.5 : -0.5)) * PITCH, bz = (j + (z > j * PITCH ? 0.5 : -0.5)) * PITCH; return warp(bx, bz, [0, 0]); };
    // The three clouds of the route stand beside it, left and right in turn (all to leeward in a stiff breeze), so the camera
    // brushes a sunlit flank and the city shows past it. The courtyard under the route at each one stays: a gap underfoot.
    const routeClouds = [150, 235, 320].map((s, i) => {
      path.posAtDist(s, tmpP); const [ci, cj] = cellOf(tmpP.x, tmpP.z); cellState[cidx(ci, cj)] = 1;
      const col = cast === 'banded' ? bandCol(tmpP.x, tmpP.z) : routeOrder[i], sgn = i % 2 ? 1 : -1;
      if (i === 0) { side(CROSS, -6.5, v3); return { s, x: v3[0], z: v3[2], col, y: 0 }; }      // the first stands in the cross street of the lane, to leeward
      const want = weather === 'stiff' && sgn > 0 ? 25 : 10.5;      // to windward a banner needs room to lie over without reaching the route
      let best = null, bd = 1e9;
      for (const lat of [want, want + 2.5, want - 2, want + 5, want + 8]) for (const ds of [0, 5, -5]) {
        side(s + ds, sgn * lat, v3); const c = crossing(v3[0], v3[2]), d = path.nearestXZ(c[0], c[1]).dist, score = Math.abs(d - want) + Math.abs(ds) * 0.1;
        if (d > want - 2.5 && score < bd) { bd = score; best = c; }
      }
      if (!best) { side(s, sgn * (want + 0.5), v3); best = [v3[0], v3[2]]; }
      return { s, x: best[0], z: best[1], col, y: 0 };
    });
    const farOK = (x, z, dmin) => plumes.every((p) => Math.hypot(p.x - x, p.z - z) > dmin) && routeClouds.every((p) => Math.hypot(p.x - x, p.z - z) > dmin + 8);
    const addPlume = (x, z, o = {}) => { const pd = path.nearestXZ(x, z).dist; plumes.push({ x, z, y: 0, height: o.height ?? pr.range(16, 30), radius: o.radius ?? pr.range(2.1, 3.6), color: colFor(x, z, o.col), count: o.count ?? (pd < 140 ? 110 : 80), bursts: pd > 150 ? 1 : 3, rs: !!o.rs }); };
    [30, 64, 96, 124, 182, 206, 266, 296, 334, 356].forEach((s, i) => {
      const sgn = i % 2 ? 1 : -1; side(s + pr.range(-6, 6), sgn * (i > 7 ? pr.range(34, 46) : pr.range(17, 36)), v3); const c = crossing(v3[0], v3[2]);
      if (path.nearestXZ(c[0], c[1]).dist > 12) addPlume(c[0], c[1], { col: cast === 'five' ? undefined : (i + 1) % 3, rs: i !== 2 && i !== 5 && i !== 7 && i !== 9 });
    });
    await ctx.yield();
    for (let i = 0, tries = 0; i < 16 && tries < 400; tries++) {
      side(pr.range(70, 400), pr.sign() * pr.range(46, 135), v3); const c = crossing(v3[0], v3[2]);
      if (Math.max(Math.abs(c[0]), Math.abs(c[1])) < 82 || !farOK(c[0], c[1], 34)) continue;
      addPlume(c[0], c[1]); i++;
    }
    await ctx.yield();
    for (let tries = 0; plumes.length < 57 && tries < 900; tries++) {
      if (tries % 120 === 119) await ctx.yield();
      const a = pr.range(0, TAU), r = Math.sqrt(pr.range(0.06, 0.9)) * 500; const c = crossing(Math.sin(a) * r, Math.cos(a) * r * 0.9 - 20);
      if (Math.max(Math.abs(c[0]), Math.abs(c[1])) < 82 || c[1] < -430 || path.nearestXZ(c[0], c[1]).dist < 40 || !farOK(c[0], c[1], 52)) continue;
      addPlume(c[0], c[1]);
    }
    for (const p of plumes) { p.y = ground(p.x, p.z) - 0.4; p.roofY = p.y + 8.6; }
    for (const c of routeClouds) { c.y = ground(c.x, c.z) - 0.4; plumes.push({ x: c.x, z: c.z, y: c.y, height: 19, radius: 3.2, color: c.col, roofY: c.y + (c.s === CROSS ? 3 : 8.2), count: Math.round(180 * Math.max(0.8, detail)), route: true }); }

    // ---- houses ----
    const H = [];                                                   // { x, z, w, d, r, top, gy, kind, col, pd, ps, seed }
    const inSquare = (x, z, m) => (Math.abs(x) < 60.5 + m && z > -64 - m && z < 59 + m) || (Math.abs(x) < 25 + m && z > -80 - m && z < -58) || (Math.abs(x) < 8 + m && z <= -80 && z > -150);
    const wallCol = () => {
      const r = hr();
      const base = r < 0.55 ? mixc(pal[0], pal[1], hr.range(0.2, 0.62)) : r < 0.85 ? mixc(pal[1], pal[2], hr.range(0, 0.3)) : mul(pal[2], hr.range(0.74, 0.86));
      return mul(mixc(base, [0.5, 0.56, 0.7], hr.range(0, 0.14)), hr.range(0.95, 1.2));
    };
    const stoneCol = () => mul(mixc(pal[3], [0.6, 0.47, 0.34], hr.range(0.2, 0.5)), hr.range(0.85, 1.05));
    const balconyS = 274, side0 = side(balconyS, 10.2, [0, 0, 0]), balCell = cellOf(side0[0], side0[2]);
    const crossP = side(CROSS, 0, [0, 0, 0]), crossT = [tmpT.x / (Math.hypot(tmpT.x, tmpT.z) || 1), tmpT.z / (Math.hypot(tmpT.x, tmpT.z) || 1)];
    await ctx.yield();
    for (let i = -GN; i <= GN; i++) { if ((i + GN) % 2 === 1) await ctx.yield(); for (let j = -GN; j <= GN; j++) {
      warp(i * PITCH, j * PITCH, w2);
      const x = w2[0] + hr.range(-0.5, 0.5), z = w2[1] + hr.range(-0.5, 0.5), d0 = Math.hypot(x, z);
      const rr = hr(), rw = hr.range(6.3, 8.7), rd = hr.range(6.3, 8.7), rh = hr(), rrot = hr.range(-0.07, 0.07), rcap = hr(), seed = hr();
      if (d0 > 506 || z < -452 || (x > -52 && x < 52 && z > 55 && z < 82)) continue;
      const st = cellState[cidx(i, j)];
      if (st === 1) continue;
      let w = rw, d = rd, kind = 0, hgt = 5 + 6 * Math.pow(rh, 1.6), col = wallCol();
      const big = rr > 0.95;
      if (big) { w = Math.min(9.2, w + 1.2); d = Math.min(9.2, d + 1.2); hgt += 3.5; if (hr() < 0.6) col = stoneCol(); }
      if (inSquare(x, z, Math.max(w, d) * 0.5 + 0.4)) continue;
      const nr = path.nearestXZ(x, z), ps = nr.u * L, pd = nr.dist;
      const isBal = i === balCell[0] && j === balCell[1];
      if (ps > LANE0 - 1 && ps < LANE1 - 3 && pd < 17.2) continue;                               // the lane and the row of houses down each side of it
      { const ax = x - crossP[0], az = z - crossP[2]; if (Math.abs(ax * crossT[0] + az * crossT[1]) < 9.5 && Math.abs(az * crossT[0] - ax * crossT[1]) < 46) continue; }   // its cross street
      if (rr < 0.062 && pd > 9 && !isBal) { cellState[cidx(i, j)] = rr < 0.03 ? 2 : 1; continue; }     // a courtyard, one in two with a tree
      const gy = ground(x, z);
      let top = gy + hgt;
      if (pd < 46 && ps < 400) {
        const drop = ps > 352 ? 5.2 : 4.5;
        top = Math.min(top, refY(nr) - mix(drop, -1.5, sstep(12, 40, pd)) - rcap * 0.8);
        if (pd < 30 && ps < 352) top = Math.max(top, refY(nr) - 7.4 - rcap);
      }
      if (isBal) { top = refY(nr) + 2.6; w = 8.6; d = 8.8; col = stoneCol(); kind = 2; }
      if (top - gy < 3) continue;
      if (pd < 52 && ps > 2 && ps < 470) kind = Math.max(kind, big && pd > 12 ? 2 : 1);
      cellHouse[cidx(i, j)] = H.length;
      H.push({ x, z, w, d, r: rrot, top, gy, kind, col, pd, ps, seed, big: big || isBal, bal: isBal, ring: kind === 0 && Math.max(Math.abs(x), Math.abs(z)) < 100 });
    } }
    // the lane: a row of houses down each side of the dip, broken at the crossing; a quarter of them sandstone with carved balconies
    const laneIdx = [];
    {
      const ln = ctx.core.makeRng(((ctx.seed >>> 0) ^ 0x1a9e77) >>> 0);
      for (const sg of [-1, 1]) for (const [a0, a1] of [[LANE0 + 4, CROSS - 6.5], [CROSS + 6.5, LANE1 - 8]]) {
        const n = Math.round((a1 - a0) / 7.7), cuts = [a0]; let prevStone = false;
        for (let k = 1; k < n; k++) cuts.push(a0 + (k / n) * (a1 - a0) + ln.range(-0.8, 0.8));
        cuts.push(a1);
        for (let k = 0; k < n; k++) {
          const sc = (cuts[k] + cuts[k + 1]) / 2, len = cuts[k + 1] - cuts[k] - 0.03, st0 = ln.chance(0.3), stoneH = st0 && !prevStone, dep = ln.range(7, 8.4), jit = ln.range(0, 0.6), rt = ln.range(-0.7, 0.8), seed = ln(), kr = ln(), t1 = ln(), t2 = ln.range(0, 0.14), t3 = ln.range(0.95, 1.2);
          const inner = stoneH ? 4.5 : 3.5 + jit, kk = laneK(sc); prevStone = stoneH;
          side(sc, sg * (inner + dep / 2), v3); const x = v3[0], z = v3[2], nr = path.nearestXZ(x, z);
          const base = stoneH ? mul(mixc(pal[3], [0.6, 0.47, 0.34], mix(0.2, 0.5, t1)), 0.95) : kr < 0.3 ? mixc(pal[0], pal[1], mix(0.45, 0.85, t1)) : kr < 0.78 ? mixc(pal[1], pal[2], t1 * 0.45) : mul(pal[2], mix(0.74, 0.86, t1));
          H.push({ x, z, w: dep, d: len, r: Math.atan2(tmpT.x, tmpT.z), top: refY(nr) - mix(4.6, 2.6, kk) + kk * rt, gy: ground(x, z), kind: stoneH ? 2 : 1, col: stoneH ? base : mul(mixc(base, [0.5, 0.56, 0.7], t2), t3),
            pd: nr.dist, ps: sc, seed, big: stoneH, lane: true, laneK: kk, inner, inX: sg });
          laneIdx.push(H.length - 1);
        }
      }
    }
    await ctx.yield();
    // the haveli that closes the south side of the square
    for (const [x0, x1, top] of [[-15, 15, 23], [-33, -15.6, 20], [15.6, 33, 20.4], [-50, -33.6, 17], [33.6, 50, 16.6]]) {
      const x = (x0 + x1) / 2, z = 69.5, nr = path.nearestXZ(x, z);
      H.push({ x, z, w: x1 - x0, d: 15, r: 0, top, gy: ground(x, z), kind: 2, col: stoneCol(), pd: nr.dist, ps: nr.u * L, seed: hr(), big: true, haveli: true });
    }
    await ctx.yield();
    // which roof (or lane) lies under a point: -1 in a lane, else the house index; edge = metres inside the roof's rim
    const hit = { i: -1, edge: 0 };
    const roofAt = (x, z) => {
      const c = cellOf(x, z); hit.i = -1; hit.edge = 0;
      for (let q = 0; q < laneIdx.length; q++) {
        const h = H[laneIdx[q]], dx = x - h.x, dz = z - h.z; if (dx * dx + dz * dz > 46) continue;
        const cr = Math.cos(h.r), sr = Math.sin(h.r), e = Math.min(h.w / 2 - Math.abs(dx * cr - dz * sr), h.d / 2 - Math.abs(dx * sr + dz * cr));
        if (e > 0) { hit.i = laneIdx[q]; hit.edge = e; return hit; }
      }
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const i = c[0] + a, j = c[1] + b; if (Math.abs(i) > GN || Math.abs(j) > GN) continue;
        const k = cellHouse[cidx(i, j)]; if (k < 0) continue;
        const h = H[k], cr = Math.cos(h.r), sr = Math.sin(h.r), dx = x - h.x, dz = z - h.z;
        const lx = dx * cr - dz * sr, lz = dx * sr + dz * cr, e = Math.min(h.w / 2 - Math.abs(lx), h.d / 2 - Math.abs(lz));
        if (e > 0) { hit.i = k; hit.edge = e; return hit; }
      }
      for (let k = H.length - 5; k < H.length; k++) { const h = H[k], e = Math.min(h.w / 2 - Math.abs(x - h.x), h.d / 2 - Math.abs(z - h.z)); if (e > 0) { hit.i = k; hit.edge = e; return hit; } }
      return hit;
    };

    // ---- people on the roofs, throwing: the colour has a source the viewer can see ----
    // Six of the plumes beside the route stand on a roof (their foot in the sun, three people round it); some twenty more roofs
    // carry two or three people at the parapet that faces the route, with a small emitter of thrown handfuls between them.
    const figures = [], roofBursts = [];
    {
      const fr = ctx.core.makeRng(((ctx.seed >>> 0) ^ 0x3c9a71) >>> 0), frac = (v) => v - Math.floor(v), used = new Set();
      const stainOf = (h) => {                                      // the house shader's own pick of the roof's powder colour
        let px = frac(h.seed * 7 * 123.34), py = frac(3 * 345.45); const d = px * (px + 34.345) + py * (py + 34.345); px += d; py += d;
        return Math.min(2, Math.floor(frac(px * py) * 3));
      };
      const place = (h, lx, lz, tx, tz, pose, ci) => {
        const cr = Math.cos(h.r), sr = Math.sin(h.r), x = h.x + lx * cr + lz * sr, z = h.z - lx * sr + lz * cr;
        figures.push({ x, y: h.top, z, ry: Math.atan2(tx - x, tz - z) + fr.range(-0.3, 0.3), s: fr.chance(0.2) ? fr.range(0.6, 0.75) : fr.range(0.94, 1.1), color: ci, pose });
        (h.fig || (h.fig = [])).push(lx, lz, 1.7);
      };
      const okRoof = (h, k) => h.kind >= 1 && !h.bal && !h.haveli && !used.has(k) && h.ps > 8 && h.ps < 392 && h.top - h.gy > 3.5;
      if (!night) for (const p of plumes) {
        if (!p.rs) continue;
        let best = -1, bd = 16;
        for (let k = 0; k < H.length; k++) { const h = H[k]; if (!okRoof(h, k) || h.pd < 13 || h.pd > 46) continue; const d = Math.hypot(h.x - p.x, h.z - p.z); if (d < bd) { bd = d; best = k; } }
        if (best < 0) continue;
        const h = H[best]; used.add(best);
        p.x = h.x; p.z = h.z; p.y = h.top; p.roofY = h.top - 1; p.height = fr.range(11, 16); p.radius = fr.range(1.7, 2.3); p.onRoof = true; p.handful = true;
        (h.fig || (h.fig = [])).push(0, 0, 2.3);
        path.posAtDist(h.ps, tmpP);
        const cr = Math.cos(h.r), sr = Math.sin(h.r), dx = tmpP.x - h.x, dz = tmpP.z - h.z, a0 = Math.atan2(dx * sr + dz * cr, dx * cr - dz * sr);
        for (let k = 0; k < 3; k++) {
          const a = a0 + (k - 1) * 1.25 + fr.range(-0.2, 0.2), lx = Math.max(-h.w / 2 + 0.9, Math.min(h.w / 2 - 0.9, Math.cos(a) * 2.0)), lz = Math.max(-h.d / 2 + 0.9, Math.min(h.d / 2 - 0.9, Math.sin(a) * 2.0));
          place(h, lx, lz, h.x, h.z, k === 1 ? 2 : 1, p.color % 3);
        }
      }
      await ctx.yield();
      for (let b = 0; b < 20; b++) {
        const s0 = 12 + b * 19, sgn = b % 2 ? 1 : -1; let best = -1, bd = 1e9;
        for (let k = 0; k < H.length; k++) {
          const h = H[k]; if (!okRoof(h, k) || h.pd < 12 || h.pd > 40 || Math.abs(h.ps - s0) > 9.5) continue;
          path.posAtDist(h.ps, tmpP); path.tangentAtDist(h.ps, tmpT);
          if (((h.x - tmpP.x) * -tmpT.z + (h.z - tmpP.z) * tmpT.x) * sgn < 0) continue;
          const sc = Math.abs(h.pd - 19) + (h.big ? 6 : 0);
          if (sc < bd) { bd = sc; best = k; }
        }
        if (best < 0) continue;
        const h = H[best]; used.add(best); path.posAtDist(h.ps, tmpP);
        const cr = Math.cos(h.r), sr = Math.sin(h.r), dx = tmpP.x - h.x, dz = tmpP.z - h.z, dl = Math.hypot(dx, dz) || 1;
        const lx = (dx * cr - dz * sr) / dl, lz = (dx * sr + dz * cr) / dl;
        const t = Math.min((h.w / 2 - 1.15) / Math.max(Math.abs(lx), 1e-3), (h.d / 2 - 1.15) / Math.max(Math.abs(lz), 1e-3));
        const ex = lx * t, ez = lz * t, onX = Math.abs(ex) > h.w / 2 - 1.2, n = b % 3 === 0 ? 3 : 2, ci = stainOf(h);
        if (!onX) h.figZ = Math.sign(ez);
        for (let k = 0; k < n; k++) {
          const o = (k - (n - 1) / 2) * 1.2 + fr.range(-0.15, 0.15);
          const px = Math.max(-h.w / 2 + 1, Math.min(h.w / 2 - 1, onX ? ex : ex + o)), pz = Math.max(-h.d / 2 + 1, Math.min(h.d / 2 - 1, onX ? ez + o : ez));
          place(h, px, pz, tmpP.x, tmpP.z, k === 0 ? 1 : fr.pick([0, 1, 1, 2]), ci);
        }
        roofBursts.push({ x: h.x + ex * cr + ez * sr + (dx / dl) * 0.4, y: h.top, z: h.z - ex * sr + ez * cr + (dz / dl) * 0.4, height: 5, radius: 0.8, color: ci, count: 0, bursts: 2, roofY: h.top - 2,
          burstS: h.pd < 25 ? Math.max(1, h.ps) : 0, handful: true });
      }
      await ctx.yield();
      // people in the lane and at its crossing, pressed to the walls and round the cloud's foot: the camera runs just over their heads.
      // More lean over the parapets above, throwing down into the lane.
      {
        const lf = ctx.core.makeRng(((ctx.seed >>> 0) ^ 0x5b2c13) >>> 0), cols5 = PALETTE.slice(4).concat(['#19B7C9', '#FFD91A']).map(lin);
        const colAt = (x, z) => (cast === 'banded' ? bandCol(x, z) : lf.int(0, nCol - 1));
        const person = (x, z, tx, tz, ci) => {
          const base = lf() < 0.7 ? [0.8, 0.8, 0.78] : lf.pick([mul(pal[1], 1.1), mixc(pal[0], [1, 1, 1], 0.3), [0.7, 0.55, 0.36]]), pr = lf(), kc = lf.range(0.25, 0.85), ry = lf.range(-0.5, 0.5), sz = lf.chance(0.18) ? lf.range(0.58, 0.74) : lf.range(0.92, 1.1);
          if (path.nearestXZ(x, z).dist < 2.2 || roofAt(x, z).i >= 0) return;
          figures.push({ x, y: ground(x, z) - 0.02, z, ry: Math.atan2(tx - x, tz - z) + ry, s: sz, c: mixc(base, cols5[ci % 5], night ? 0.12 : kc), pose: pr < 0.4 ? 1 : pr < 0.52 ? 2 : 0 });
        };
        const emit = (x, z, s, ci) => { const y = ground(x, z); roofBursts.push({ x, y, z, height: 6, radius: 0.9, color: ci, count: 0, bursts: 2, roofY: y + 6, burstS: Math.max(1, s), handful: true }); };
        for (let s = LANE0 + 30; s < LANE1 - 14; s += lf.range(2.6, 4.2)) {
          const sg = lf.sign(), n = lf.int(2, 4), em = lf.chance(0.34), lat0 = lf.range(2.72, 2.95);
          if (Math.abs(s - CROSS) < 9) continue;
          side(s, sg * 2.6, v3); const ci = colAt(v3[0], v3[2]); path.posAtDist(s - 7, tmpP); const tx = tmpP.x, tz = tmpP.z;
          for (let k = 0; k < n; k++) { side(s + (k - (n - 1) / 2) * 0.8, sg * (lat0 - (k % 2) * 0.42), v3); person(v3[0], v3[2], tx, tz, ci); }
          if (em) { side(s, sg * 2.3, v3); emit(v3[0], v3[2], s, ci); }
        }
        const c0 = routeClouds[0];                                  // the knot round the foot of the cloud in the cross street
        for (let k = 0; k < 30; k++) { const a = lf.range(0, TAU), r = 2.0 + Math.abs(lf.gauss()) * 2.3; person(c0.x + Math.cos(a) * r, c0.z + Math.sin(a) * r, c0.x, c0.z, c0.col); }
        for (let k = 0; k < 3; k++) { const a = lf.range(0, TAU); emit(c0.x + Math.cos(a) * 2.6, c0.z + Math.sin(a) * 2.6, CROSS - 4, c0.col); }
        side(CROSS + 1.5, 6.5, v3);                                 // and a second knot across the way, in the other mouth of the street
        { const ox = v3[0], oz = v3[2], oc = cast === 'banded' ? bandCol(ox, oz) : (c0.col + 1) % nCol;
          for (let k = 0; k < 18; k++) { const a = lf.range(0, TAU), r = 0.7 + Math.abs(lf.gauss()) * 2.4; person(ox + Math.cos(a) * r, oz + Math.sin(a) * r, ox, oz, oc); }
          emit(ox, oz, CROSS - 4, oc); emit(ox + 1.5, oz + 1, CROSS - 4, oc); }
        for (let q = 0; q < laneIdx.length; q++) {                    // on the lane's roofs, at the parapet over the lane
          const h = H[laneIdx[q]]; if (q % 3 !== 1 || h.laneK < 0.8) continue;
          const ci = colAt(h.x, h.z), lx = h.inX * (h.w / 2 - 0.5), cr = Math.cos(h.r), sr = Math.sin(h.r), ex = h.inX * (h.w / 2 - 0.15); path.posAtDist(h.ps, tmpP);
          for (let k = 0; k < 2; k++) place(h, lx, (k - 0.5) * 1.3, tmpP.x, tmpP.z, k ? 0 : 1, ci % 3);
          roofBursts.push({ x: h.x + ex * cr, y: h.top, z: h.z - ex * sr, height: 5, radius: 0.6, color: ci, count: 0, bursts: 2, roofY: h.top - 2, burstS: Math.max(1, h.ps), handful: true });
        }
      }
    }

    // ---- sky, light, fog ----
    await ctx.yield();
    const sky = makeSky({ rng, ...look.sky, bake: !!night, renderer: ctx.renderer });
    scene.add(sky.object);
    await ctx.yield();
    const fogBase = new THREE.Color(look.fog);
    scene.fog = new THREE.FogExp2(fogBase.clone(), look.density);
    const rig = makeLightRig(sky, { shadow: true, shadowSize: 2048, shadowRange: look.shadowRange, bounce: 0.2 });
    scene.add(rig.object);
    const SUN = sky.lightDirection.clone();
    await ctx.yield();

    // ---- the hero: the square, the gate, the clock tower and every plume in the city in one draw ----
    // the lane as the powder knows it: its centre line, and the height its walls (parapets and all) stand to
    const lanePts = [];
    for (let i = 0; i < 10; i++) { const s = LANE0 - 16 + i * 20, kk = laneK(s); path.posAtDist(s, tmpP); lanePts.push([tmpP.x, tmpP.z, s, tmpP.y + DIP * dipAt(s) - mix(4.6, 2.6, kk) + 0.8 * kk + 0.9]); }
    // Ranks of colour to the cliff. Across the whole bowl, from the cliff foot to the south rim, a plume stands at every tenth lane
    // crossing of every tenth lane (110 m apart both ways, alternate ranks set off by half that, each a lane or so out of line), its
    // foot in the shade of the lane and its top in the sun, 25 to 30 m tall (the tallest the town's plumes go: a rank reads as a rank
    // when its plumes stand to one height). None within 62 m of the route (that ground keeps the plumes it has), none in the square,
    // none where a plume already stands within 34 m. Drawn from a stream of its own; every station draws, kept or not.
    const rankPlumes = [];
    {
      const rk = ctx.core.makeRng(ctx.core.hashSeed('holi-rank-plumes:' + ctx.seed)), RANK = 10 * PITCH;
      for (let k = 0; -420 + k * RANK <= 480; k++) for (let m = -6; m <= 6; m++) {
        const jx = rk.int(-1, 1) * PITCH, height = rk.range(25, 30), radius = rk.range(2.1, 3.6), ci = rk.int(0, nCol - 1);
        const c = crossing((m + (k % 2 ? 0.5 : 0)) * RANK + jx, -420 + k * RANK);
        if (Math.hypot(c[0], c[1]) > 480 || c[1] < -430 || Math.max(Math.abs(c[0]), Math.abs(c[1])) < 82) continue;
        const pd = path.nearestXZ(c[0], c[1]).dist;
        if (pd < 62 || plumes.some((p) => Math.hypot(p.x - c[0], p.z - c[1]) < 34)) continue;
        const y = ground(c[0], c[1]) - 0.4;
        rankPlumes.push({ x: c[0], z: c[1], y, height, radius, color: cast === 'banded' ? bandCol(c[0], c[1]) : ci, roofY: y + 8.6, count: pd < 140 ? 110 : 80, pd });
      }
    }
    await ctx.yield();
    const hero = await buildHero(ctx, {
      lane: { pts: lanePts, cross: CROSS, half: 6.5, from: LANE0 + 4, to: LANE1 - 8 }, ranks: rankPlumes,
      palette: PALETTE, sunDir: [SUN.x, SUN.y, SUN.z], plumes: plumes.concat(roofBursts), figures, lean, parting: 0, crowd: Math.round(750 * Math.min(1.15, density)),
      extraColors: ['#19B7C9', '#FFD91A'], eruptFrom: 330 / L, eruptTo: 402 / L, partFrom: 352 / L, partTo: 430 / L,
    });
    scene.add(hero.object);
    const HU = hero.uniforms;
    HU.uLitCol.value.set(look.lit[0], look.lit[1], look.lit[2]); HU.uShadeCol.value.set(look.shade[0], look.shade[1], look.shade[2]);
    HU.uGate.value = look.gate; HU.uFire.value = look.fire; HU.uStainK.value = look.pave ?? 1;
    if (night) ['#6b6470', '#7a6f66', '#565a6a', '#6b6470', '#7a6f66'].forEach((c, i) => HU.uPow5.value[i].set(c));
    if (weather === 'stiff') { HU.uWind.value.x *= 1.3; HU.uWind.value.z *= 1.3; }    // banners of powder, bunting and washing standing out
    const U = { uTime: HU.uTime, uSun: HU.uSun, uPow: HU.uPow, uWind: HU.uWind, uNight: { value: night }, uStain: { value: look.stain }, uGlow: { value: look.glow }, uGlowCol: { value: new THREE.Vector3(...(look.glowCol || [1, 1, 1])) }, uLane: { value: night ? 0.4 : 0.8 } };
    const powCols = HU.uPow5.value;
    await ctx.yield();

    // ---- houses: two instanced draws (near ones cast shadows) ----
    const houseMat = makeHouseMaterial(U), cityMat = makeCityMaterial(U), clothMat = makeClothMaterial(HU);
    const boxGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    { const ix = Array.from(boxGeo.index.array); ix.splice(18, 6); boxGeo.setIndex(ix); boxGeo.clearGroups(); }
    {
      const near = H.filter((h) => h.pd < 125), far = H.filter((h) => h.pd >= 125);
      const stretch = [0, 1, 2, 3].map((q) => near.filter((h) => Math.min(3, Math.floor(h.ps / 132)) === q));   // shadow casters, culled by stretch of the route
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), YA = new THREE.Vector3(0, 1, 0), Pv = new THREE.Vector3(), Sv = new THREE.Vector3(), Cc = new THREE.Color();
      for (const [list, cast] of [[stretch[0], true], [stretch[1], true], [stretch[2], true], [stretch[3], true], [far, false]]) {
        if (!list.length) continue;
        const geo = boxGeo.clone(), seeds = new Float32Array(list.length * 4);
        if (!cast) { const ix = Array.from(geo.index.array); ix.splice(24, 6); geo.setIndex(ix); }   // far houses have no north wall: the camera never looks south
        const mesh = new THREE.InstancedMesh(geo, houseMat, list.length);
        list.forEach((h, k) => {
          M.compose(Pv.set(h.x, h.gy - 2.5, h.z), Q.setFromAxisAngle(YA, h.r), Sv.set(h.w, h.top - h.gy + 2.5, h.d)); mesh.setMatrixAt(k, M);
          mesh.setColorAt(k, Cc.setRGB(h.col[0], h.col[1], h.col[2]));
          seeds[k * 4] = h.seed; seeds[k * 4 + 1] = h.kind === 2 && h.big && h.col[0] > h.col[2] ? 2 : (h.kind > 0 || h.ring ? 1 : 0); seeds[k * 4 + 2] = 2.5; seeds[k * 4 + 3] = h.lane ? 1 : 0;
        });
        geo.setAttribute('iSeed', new THREE.InstancedBufferAttribute(seeds, 4));
        mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
        mesh.castShadow = cast; mesh.receiveShadow = true; mesh.computeBoundingSphere();
        scene.add(mesh);
        await ctx.yield();
      }
      await ctx.yield();
      // stair hutches and water tanks on the far roofs, so no roof in the middle distance is a bare box
      const cand = H.filter((h) => h.kind === 0 && !h.ring && !h.haveli && (h.pd < 260 || Math.max(Math.abs(h.x), Math.abs(h.z)) < 150));
      const central = cand.filter((h) => Math.max(Math.abs(h.x), Math.abs(h.z)) < 150).length, CAP = Math.round(680 * Math.max(0.7, detail));
      const pRest = Math.min(0.6, Math.max(0, CAP * 0.8 - central) / Math.max(1, cand.length - central));
      const boxes = [], fr = (v) => v - Math.floor(v);
      for (const h of cand) {
        const a = fr(h.seed * 977.13), b = fr(h.seed * 331.7), c = fr(h.seed * 61.93), mid = Math.max(Math.abs(h.x), Math.abs(h.z)) < 150;
        if (!mid && a > pRest) continue;
        const sx = b < 0.5 ? -1 : 1, sz = c < 0.5 ? -1 : 1, cr = Math.cos(h.r), sr = Math.sin(h.r);
        const at = (lx, lz) => [h.x + lx * cr + lz * sr, h.z - lx * sr + lz * cr];
        if (!mid || a < 0.85) { const q = at(sx * (h.w / 2 - 1.5), sz * (h.d / 2 - 1.55)); boxes.push([q[0], h.top, q[1], h.r, 2.0 + 0.5 * c, 2.0 + 0.5 * b, 2.2, fr(a * 7.7) < 0.5 ? mixc(h.col, KW0, 0.55) : KW0, 0, fr(h.seed * 13.7)]); }
        if (fr(a * 3.3) < (mid ? 0.6 : 0.4)) { const q = at(-sx * (h.w / 2 - 1.3) * fr(b * 5.1), -sz * (h.d / 2 - 1.3)); boxes.push([q[0], h.top, q[1], h.r, 1.15, 1.3, 1.15, fr(a * 11.1) < 0.6 ? [0.085, 0.095, 0.13] : KW0, -99, fr(h.seed * 29.3)]); }
        if (boxes.length >= CAP) break;
      }
      await ctx.yield();
      if (boxes.length) {
        const geo = boxGeo.clone(), seeds = new Float32Array(boxes.length * 4), mesh = new THREE.InstancedMesh(geo, houseMat, boxes.length);
        boxes.forEach((bx, k) => {
          M.compose(Pv.set(bx[0], bx[1] - 0.02, bx[2]), Q.setFromAxisAngle(YA, bx[3]), Sv.set(bx[4], bx[5], bx[6])); mesh.setMatrixAt(k, M);
          mesh.setColorAt(k, Cc.setRGB(bx[7][0], bx[7][1], bx[7][2])); seeds[k * 4] = bx[9]; seeds[k * 4 + 1] = 1; seeds[k * 4 + 2] = bx[8];
        });
        geo.setAttribute('iSeed', new THREE.InstancedBufferAttribute(seeds, 4));
        mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.castShadow = true; mesh.receiveShadow = true; mesh.computeBoundingSphere(); scene.add(mesh);
      }
      boxGeo.dispose();
    }
    await ctx.yield();

    // ---- the land: lane floors on the house grid, the rim and the desert beyond ----
    {
      const n = W2 + 1, pos = new Float32Array(n * n * 3), colr = new Float32Array(n * n * 3), aux = new Float32Array(n * n * 2), idx = [];
      const lane = mul(mixc(pal[3], [0.42, 0.44, 0.52], 0.6), 0.62), sand = mul(mixc(pal[3], [0.9, 0.82, 0.66], 0.72), 0.82);
      for (let a = 0; a < n; a++) { if (a % 4 === 3) await ctx.yield(); for (let b = 0; b < n; b++) {
        const x = (a - GN - 0.5) * PITCH, z = (b - GN - 0.5) * PITCH, k = a * n + b, d0 = Math.hypot(x, z);
        const inSq = Math.max(Math.abs(x), Math.abs(z)) < 64;
        pos[k * 3] = x; pos[k * 3 + 1] = inSq ? -0.6 : ground(x, z) - (z < -470 ? 4 : 0); pos[k * 3 + 2] = z;
        const t = Math.max(sstep(490, 520, d0), sstep(-400, -450, z)), c = mixc(lane, sand, t);
        colr[k * 3] = c[0]; colr[k * 3 + 1] = c[1]; colr[k * 3 + 2] = c[2]; aux[k * 2] = 3; aux[k * 2 + 1] = z < -425 ? 2 : t;
      } }
      await ctx.yield();
      for (let a = 0; a < n - 1; a++) for (let b = 0; b < n - 1; b++) {
        const x = (a - GN) * PITCH, z = (b - GN) * PITCH; if (Math.hypot(x, z) > 528 || z < -500) continue;
        const k = a * n + b; idx.push(k, k + 1, k + n + 1, k, k + n + 1, k + n);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(colr, 3)); g.setAttribute('aux', new THREE.BufferAttribute(aux, 2));
      g.setIndex(idx); await ctx.yield();
      {                                                             // a height field's normals by central differences (cheaper than the general pass)
        const nrm = new Float32Array(n * n * 3);
        for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
          const k = a * n + b, a0 = Math.max(0, a - 1), a1 = Math.min(n - 1, a + 1), b0 = Math.max(0, b - 1), b1 = Math.min(n - 1, b + 1);
          const dx = (pos[(a1 * n + b) * 3 + 1] - pos[(a0 * n + b) * 3 + 1]) / ((a1 - a0) * PITCH), dz = (pos[(a * n + b1) * 3 + 1] - pos[(a * n + b0) * 3 + 1]) / ((b1 - b0) * PITCH), l = Math.hypot(dx, 1, dz);
          nrm[k * 3] = -dx / l; nrm[k * 3 + 1] = 1 / l; nrm[k * 3 + 2] = -dz / l;
        }
        g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 780);
      }
      const m = new THREE.Mesh(g, cityMat); m.receiveShadow = true; scene.add(m);
      await ctx.yield();
      // the plain beyond the rim
      const rings = [500, 545, 610, 720, 900, 1250, 1900, 3300], SEC = 72, fg = makeGeo((rings.length - 1) * SEC * 6);
      fg.a0 = 3; fg.a1 = 1;
      for (let r = 0; r < rings.length - 1; r++) for (let k = 0; k < SEC; k++) {
        const a0 = (k / SEC) * TAU, a1 = ((k + 1) / SEC) * TAU, r0 = rings[r], r1 = rings[r + 1];
        const P = (rad, an) => { const x = Math.sin(an) * rad, z = Math.cos(an) * rad; return [x, bowl(x, z) - (rad < 560 ? 0.9 : 0) - (z < -470 ? 6 : 0), z]; };
        fg.quad(P(r0, a1), P(r0, a0), P(r1, a0), P(r1, a1), sand, mul(sand, 1.04));
      }
      const fm = new THREE.Mesh(fg.build(), cityMat); scene.add(fm);
    }
    await ctx.yield();

    // ---- far layer: the cliff, the fort on it, the zigzag ramp, the city wall on the rim ----
    const farCloth = makeGeo(1200);
    {
      const G = makeGeo(30000), fr = rng.fork('fort');
      const rock = mul(mixc(pal[3], [0.72, 0.5, 0.33], 0.4), 0.9), rockD = mul(rock, 0.72), stone = mul(mixc(pal[3], [0.8, 0.62, 0.42], 0.5), 0.95), stoneL = mixc(stone, [0.9, 0.8, 0.66], 0.4);
      const zc = (x) => -482 - 0.00032 * x * x - 14 * noise.n2(x * 0.006, 7.3);
      const topY = (x) => 40 + 122 * (1 - 0.58 * sstep(300, 700, Math.abs(x))) + 7 * noise.n2(x * 0.012, 2.1);
      const NX = 130, NY = 11, X0 = -780, X1 = 780;
      const face = (i, j) => {
        const x = X0 + (i / NX) * (X1 - X0), t = j / NY, ty = topY(x), y = mix(52, ty, Math.pow(t, 0.85));
        const but = Math.pow(Math.abs(Math.sin(x * 0.041 + 2 * noise.n2(x * 0.01, 5))), 1.6);
        return [x + 4 * noise.n2(x * 0.03, y * 0.04 + 9), y, zc(x) - t * 7 + 9 * but * (1 - t * 0.6) + 20 * (1 - t) * (1 - t) + 6 * noise.n2(x * 0.025 + 31, y * 0.035)];
      };
      {
        const nv = (NX + 1) * (NY + 1), cp = new Float32Array(nv * 3), cc = new Float32Array(nv * 3), ca = new Float32Array(nv * 2), ci = [];
        for (let i = 0; i <= NX; i++) for (let j = 0; j <= NY; j++) {
          const k = i * (NY + 1) + j, f = face(i, j), c = mixc(rockD, rock, j / NY); cp.set(f, k * 3); cc.set(c, k * 3); ca[k * 2] = 4;
          if (i < NX && j < NY) ci.push(k, k + NY + 1, k + NY + 2, k, k + NY + 2, k + 1);
        }
        const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cp, 3)); cg.setAttribute('color', new THREE.BufferAttribute(cc, 3)); cg.setAttribute('aux', new THREE.BufferAttribute(ca, 2));
        cg.setIndex(ci); await ctx.yield(); cg.computeVertexNormals(); scene.add(new THREE.Mesh(cg, cityMat));
      }
      await ctx.yield();
      G.a0 = 3; G.a1 = 1;
      for (let i = 0; i < NX; i++) { const a = face(i, NY), b = face(i + 1, NY); G.quad(a, b, [b[0], b[1] - 4, b[2] - 420], [a[0], a[1] - 4, a[2] - 420], mul(stoneL, 0.8)); }
      // curtain wall growing out of the rock, round bastions
      const wallAt = (x) => [x, topY(x), zc(x) - 9];
      G.a0 = 5; G.a1 = 9999;
      for (let x = -260; x < 260; x += 26) {
        const a = wallAt(x), b = wallAt(x + 26), yb = Math.min(a[1], b[1]) - 10, yt = Math.max(a[1], b[1]) + 21;
        G.quad([a[0], yb, a[2]], [b[0], yb, b[2]], [b[0], yt, b[2] - 1.5], [a[0], yt, a[2] - 1.5], mul(stone, 0.8), stone);
        G.quad([a[0], yt, a[2] - 1.5], [b[0], yt, b[2] - 1.5], [b[0], yt, b[2] - 7], [a[0], yt, a[2] - 7], stoneL);
      }
      const bastions = [-262, -176, -92, 96, 178, 262].map((x) => x + fr.range(-10, 10));
      for (const x of bastions) {
        const w = wallAt(x), r = fr.range(11, 14);
        G.cyl(x, w[1] - 34, w[2] + 3, r * 1.12, r, 60, 10, stone, null, 0.72); G.cyl(x, w[1] + 26, w[2] + 3, r * 1.06, r * 1.06, 3.2, 10, stoneL, stoneL);
      }
      // palace blocks pierced by rows of screened balconies, kiosks on their corners
      let px = -205;
      while (px < 190) {
        const w = fr.range(44, 70), cx = px + w / 2, base = wallAt(cx), h = fr.range(34, 50), dz = fr.range(26, 34), c = mul(mixc(stone, stoneL, fr()), fr.range(0.92, 1.06));
        G.a0 = 5; G.a1 = base[1] + 13;
        G.frame(cx, 0, base[2] - 6 - dz / 2, fr.range(-0.05, 0.05));
        G.box(0, base[1] + 8, 0, w, h, dz, c, { g: 0.82, ct: stoneL });
        const w2b = w * fr.range(0.4, 0.62), ox = fr.range(-0.2, 0.2) * w;
        G.a1 = base[1] + h + 9.5;
        G.box(ox, base[1] + 8 + h, 0, w2b, fr.range(9, 15), dz * 0.7, mul(c, 1.04), { ct: stoneL });
        G.a0 = 5; G.a1 = 9999;
        for (const sx of [-1, 1]) { G.cyl(sx * (w / 2 - 3), base[1] + 8 + h, dz / 2 - 3, 2.4, 2.4, 3.4, 6, mul(stone, 0.6), null); G.cyl(sx * (w / 2 - 3), base[1] + 11.4 + h, dz / 2 - 3, 3.3, 0.2, 3, 6, mul(pal[2], 0.86)); }
        // a flag on each block
        const fxp = ox, fy = base[1] + 8 + h + 15, pole = 9;
        G.box(fxp, fy - 1, 0, 0.5, pole, 0.5, mul(stone, 0.5));
        farCloth.frame(cx, 0, base[2] - 6 - dz / 2, 0); farCloth.a1 = fr.range(0, 6);
        for (let k = 0; k < 4; k++) farCloth.quadW([fxp - k * 2.2, fy + pole - 6, 0], [fxp - (k + 1) * 2.2, fy + pole - 6 + (k === 3 ? 2 : 0), 0], [fxp - (k + 1) * 2.2, fy + pole - 1 - (k === 3 ? 2 : 0), 0], [fxp - k * 2.2, fy + pole - 1, 0], mul(pal[5], 0.95), mul(pal[5], 0.85), k * 0.5, (k + 1) * 0.5);
        px += w + fr.range(-4, 9);
      }
      G.frame();
      await ctx.yield();
      // the zigzag ramp and its gates
      G.a0 = 5; G.a1 = 9999;
      const legs = [[-420, 66, -428], [-250, 96, zc(-250) + 30], [-372, 128, zc(-372) + 16], [-258, 158, zc(-258) + 2]];
      for (let k = 0; k < legs.length - 1; k++) {
        const a = legs[k], b = legs[k + 1], wd = 9;
        G.quad([a[0], a[1], a[2] + wd], [b[0], b[1], b[2] + wd], [b[0], b[1], b[2] - 2], [a[0], a[1], a[2] - 2], stoneL, stoneL, true);
        G.quad([a[0], a[1] - 16, a[2] + wd + 4], [b[0], b[1] - 16, b[2] + wd + 4], [b[0], b[1] + 1.6, b[2] + wd], [a[0], a[1] + 1.6, a[2] + wd], mul(stone, 0.7), stone, true);
        G.frame(b[0], b[1], b[2] + 3, fr.range(-0.3, 0.3)); G.box(0, -4, 0, 13, 15, 8, stone, { g: 0.8, ct: stoneL }); G.box(0, -4, 4.1, 5, 8, 0.3, mul(stone, 0.18)); G.frame();
      }
      // the city wall on the rim
      for (let k = 0; k < 34; k++) {
        const a = -2.5 + (k / 33) * 5.0, x = Math.sin(a) * 509, z = Math.cos(a) * 509, y = bowl(x, z) - 2;
        G.frame(x, y, z, a); G.box(0, 0, 0, 78, 8.5, 3, stone, { g: 0.8, ct: stoneL });
        if (k % 3 === 0) G.box(0, 0, 1, 9, 13, 9, mul(stone, 1.04), { g: 0.8, ct: stoneL });
      }
      G.frame();
      await ctx.yield();
      const fm = new THREE.Mesh(G.build(), cityMat); scene.add(fm);
    }
    await ctx.yield();

    // ---- the dressed roofs: parapets, stair hutches, tanks, charpoys, cloths, pots, dishes, tulsi, bicycles, clay lamps, washing ----
    const dr = rng.fork('dress');
    const rt = ctx.core.makeRng(ctx.core.hashSeed('holi-roof-things:' + ctx.seed));   // the bicycles, brass water pots and clay lamps: a stream of their own
    const NB = 12, BAND = 45, DG = []; for (let k = 0; k < NB; k++) DG.push(makeGeo(66000));   // room for the bicycles, pots and lamps (to 6,000 vertices more in a band)
    DG.push(makeGeo(80000));                                        // the haveli on the square has a mesh to itself   // short bands: the shadow pass draws only the two or three near the camera
    const CG = makeGeo(92000);
    const KW = mul(pal[2], 0.82);
    const K = {
      white: KW, cement: [0.46, 0.46, 0.47], tank: [0.06, 0.065, 0.085], brick: [0.4, 0.16, 0.09], wood: [0.28, 0.18, 0.1], chili: [0.56, 0.04, 0.03], dark: [0.07, 0.075, 0.12],
      brass: [0.8, 0.52, 0.14], clay: [0.5, 0.24, 0.13], green: [0.08, 0.27, 0.07], bamboo: [0.5, 0.4, 0.22], rope: [0.2, 0.17, 0.14], stone: mul(mixc(pal[3], [0.6, 0.47, 0.34], 0.3), 0.95),
      tin: [[0.08, 0.28, 0.32], [0.34, 0.17, 0.09], [0.1, 0.16, 0.42], [0.4, 0.42, 0.46]],
      // washing and roof bunting keep to white, blue and three faded dyes: the powder is the only loud colour in the city
      cloths: [KW, KW, KW, KW, mul(pal[0], 1.2), pal[1], [0.75, 0.52, 0.28], [0.62, 0.36, 0.4], [0.45, 0.5, 0.7]],
      borders: [mul(pal[0], 0.9), [0.6, 0.38, 0.16], [0.5, 0.2, 0.26], mul(pal[1], 0.8)],
      bright: [mul(pal[4], 0.9), mul(pal[5], 0.95), [0.04, 0.46, 0.52], KW, KW, KW, [0.7, 0.07, 0.07], [0.92, 0.76, 0.14], pal[1], [0.36, 0.08, 0.46], mul(pal[6], 0.9)],
      quilts: [[0.6, 0.1, 0.08], [0.1, 0.2, 0.5], [0.72, 0.5, 0.1], [0.12, 0.4, 0.3], [0.6, 0.15, 0.4]].map((c) => mixc(c, [0.5, 0.45, 0.4], 0.4)),
    };
    K.stoneL = mixc(K.stone, [0.86, 0.76, 0.62], 0.4);
    K.shut = [mul(pal[1], 0.9), mul(pal[0], 1.25), [0.05, 0.3, 0.34]];
    const lampPts = [], poleTops = [];
    // a string of triangular bunting (cloth) between two world points
    const bunting = (a, b, sag, ph, cols = K.cloths) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(6, Math.round(len / 0.62));
      const dx = (b[0] - a[0]) / len, dz = (b[2] - a[2]) / len;
      CG.frame(); CG.a1 = ph;
      const P = (t) => [mix(a[0], b[0], t), mix(a[1], b[1], t) - sag * 4 * t * (1 - t), mix(a[2], b[2], t)];
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n, p0 = P(t0), p1 = P(t1), w0 = 0.22 * Math.sin(Math.PI * t0), w1 = 0.22 * Math.sin(Math.PI * t1);
        CG.quadW(p0, p1, [p1[0], p1[1] + 0.05, p1[2]], [p0[0], p0[1] + 0.05, p0[2]], K.rope, K.rope, w0, w1);
        const c = cols[(k * 5 + Math.floor(ph * 3)) % cols.length], mx = (p0[0] + p1[0]) / 2, mz = (p0[2] + p1[2]) / 2, my = (p0[1] + p1[1]) / 2 - 0.5;
        CG.quadW([mx - dx * 0.03, my, mz - dz * 0.03], [mx + dx * 0.03, my, mz + dz * 0.03], [p1[0] - dx * 0.06, p1[1], p1[2] - dz * 0.06], [p0[0] + dx * 0.06, p0[1], p0[2] + dz * 0.06], mul(c, 0.9), c, w0 + 0.3, w0);
      }
    };
    // a three-ring dome with a brass finial (so caps read as domes, not tents)
    const dome = (G, x, y, z, sc, seg, col) => {
      G.a0 = 0; G.a1 = 0;
      G.cyl(x, y, z, 1.15 * sc, 0.95 * sc, 0.3 * sc, seg, mul(col, 0.86), null); G.cyl(x, y + 0.3 * sc, z, 0.95 * sc, 0.55 * sc, 0.3 * sc, seg, mul(col, 0.94), null);
      G.cyl(x, y + 0.6 * sc, z, 0.55 * sc, 0.03, 0.25 * sc, seg, col);
      G.a0 = 2; G.cyl(x, y + 0.85 * sc, z, 0.07, 0.01, 0.45, 4, K.brass); G.a0 = 0;
    };
    // a carved balcony on a wall face (the frame's +z points out of the wall): corbels, a pierced rail, a cusped arch between
    // slender posts, a drooping eave and a dome. rich = the full carving, for the havelis that pass close to the route
    const jharokha = (G, x, rich) => {
      G.a0 = 1; G.a1 = 0;
      if (rich) {
        for (const sx of [-0.62, 0.62]) { G.box(x + sx, -0.84, 0.14, 0.2, 0.32, 0.28, K.stone, { g: 0.7 }); G.box(x + sx, -0.52, 0.27, 0.24, 0.34, 0.54, K.stone, { g: 0.75 }); }
        G.box(x, -0.18, 0.42, 1.9, 0.18, 0.84, K.stone, { g: 0.8, nt: true });
      } else G.box(x, -0.55, 0.22, 1.5, 0.55, 0.44, K.stone, { g: 0.7 });
      G.box(x, 0, 0.46, 2.1, 0.2, 0.92, K.stoneL);
      G.a0 = 8; G.box(x, 0.2, 0.86, 2.0, 0.6, 0.07, K.stoneL, { g: 0.85, nt: true });
      if (rich) for (const sx of [-0.98, 0.98]) G.box(x + sx, 0.2, 0.44, 0.07, 0.6, 0.78, K.stoneL, { nt: true });
      G.a0 = 1; G.box(x, 0.8, 0.86, 2.14, 0.07, 0.14, K.stoneL);
      for (const sx of rich ? [-0.96, -0.33, 0.33, 0.96] : [-0.96, 0, 0.96]) G.box(x + sx, 0.87, 0.86, 0.1, 1.05, 0.1, K.stoneL);
      G.quad([x - 0.62, 0.25, 0.03], [x + 0.62, 0.25, 0.03], [x + 0.62, 1.9, 0.03], [x - 0.62, 1.9, 0.03], mul(K.dark, 0.6));
      if (rich) {
        for (const sx of [-0.7, 0.7]) G.box(x + sx, 0.2, 0.05, 0.14, 1.85, 0.1, K.stoneL); G.box(x, 1.9, 0.05, 1.54, 0.16, 0.1, K.stoneL);
        const sc = K.shut[Math.abs(Math.round(x * 3)) % K.shut.length], sg = Math.round(x) % 2 ? 1 : -1;
        G.a0 = 0; G.quad([x + sg * 0.62, 0.25, 0.06], [x + sg * 0.16, 0.25, 0.36], [x + sg * 0.16, 1.85, 0.36], [x + sg * 0.62, 1.85, 0.06], mul(sc, 0.8), sc, true);
        G.a0 = 1; G.box(x, 1.9, 0.86, 2.1, 0.14, 0.12, K.stoneL);    // lintel and the five-lobed arch head hung from it
        for (let i = 0; i <= 5; i++) { const xi = -0.9 + i * 0.36, dp = 0.13 + 0.36 * (xi / 0.9) * (xi / 0.9); G.tri([x + xi - 0.19, 1.9, 0.86], [x + xi + 0.19, 1.9, 0.86], [x + xi, 1.9 - dp, 0.86], K.stoneL, true); }
      }
      G.a0 = 1; G.quad([x - 1.3, 1.92, 1.36], [x + 1.3, 1.92, 1.36], [x + 1.15, 2.3, 0], [x - 1.15, 2.3, 0], mul(K.stone, 0.8), K.stoneL, true);
      dome(G, x, 2.03, 0.5, 0.75, rich ? 8 : 6, K.white);
    };
    // a domed kiosk on four posts with a drooping eave
    const kiosk = (G, lx, lz) => {
      G.a0 = 1; G.a1 = 0; for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) G.box(lx + sx * 0.85, 0, lz + sz * 0.85, 0.16, 2.2, 0.16, K.stoneL);
      G.box(lx, 2.2, lz, 2.3, 0.16, 2.3, K.stoneL, { g: 0.8 });
      for (const [ux, uz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const vx = -uz, vz = ux, e0 = 1.15, e1 = 1.72;
        G.quad([lx + ux * e1 - vx * e1, 2.1, lz + uz * e1 - vz * e1], [lx + ux * e1 + vx * e1, 2.1, lz + uz * e1 + vz * e1], [lx + ux * e0 + vx * e0, 2.37, lz + uz * e0 + vz * e0], [lx + ux * e0 - vx * e0, 2.37, lz + uz * e0 - vz * e0], K.stone, K.stoneL, true);
      }
      dome(G, lx, 2.36, lz, 1, 8, K.white);
    };
    const slotsBuf = [];
    const balDiag = (h) => { path.posAtDist(balconyS - 9, tmpP); const cr = Math.cos(h.r), sr = Math.sin(h.r), dx = tmpP.x - h.x, dz = tmpP.z - h.z; return (dx * cr - dz * sr) * (dx * sr + dz * cr) > 0 ? -1 : 1; };
    const dressRoof = (h, dr, lite) => {
      const G = h.haveli ? DG[NB] : DG[Math.min(NB - 1, Math.max(0, Math.floor(h.ps / BAND)))];
      const cr = Math.cos(h.r), sr = Math.sin(h.r), fy = h.top, ax = h.w / 2 - 0.3, az = h.d / 2 - 0.3;
      const at = (lx, lz) => [h.x + lx * cr + lz * sr, h.z - lx * sr + lz * cr];
      const prop = (lx, lz, r = 0) => { const p = at(lx, lz); G.frame(p[0], fy, p[1], h.r + r); return p; };
      const stoneW = h.kind === 2 && h.big, cop = mixc(h.col, [0.92, 0.92, 0.94], stoneW ? 0.25 : 0.4);
      const low = h.pd < 9.5 && !lite && !(h.laneK > 0.6), rich = h.haveli ? 2.2 : h.pd < 26 ? 1.45 : 1, tall = !low && (h.pd > 14 || h.ps < 352);
      const tallH = tall || !!h.haveli, wide = tall ? undefined : (q) => Math.abs(q[0]) > 6.5, must = (pr) => { const r = dr.chance(pr * rich); return r || !!h.haveli; };   // the centre haveli keeps its tall things off the route
      // parapet with a paler coping, drain spouts
      G.frame(h.x, fy, h.z, h.r); G.a0 = stoneW ? 1 : 0; G.a1 = 0;
      if (lite) {                                                   // far ring round the square: outer, top and inner faces only
        const X = h.w / 2, Z = h.d / 2, T = 0.24, Y = 0.9, ci = mul(h.col, 0.8);
        for (const [ax2, az2, bx2, bz2, nx2, nz2] of [[-X, Z, X, Z, 0, 1], [X, Z, X, -Z, 1, 0], [X, -Z, -X, -Z, 0, -1], [-X, -Z, -X, Z, -1, 0]]) {
          const ix = (v, nn) => v - Math.sign(v) * T * (nn === 0 ? 1 : 1), a2 = [ax2, 0, az2], b2 = [bx2, 0, bz2], a3 = [ix(ax2), 0, ix(az2)], b3 = [ix(bx2), 0, ix(bz2)];
          G.quad(a2, b2, [b2[0], Y, b2[2]], [a2[0], Y, a2[2]], h.col); G.quad([a2[0], Y, a2[2]], [b2[0], Y, b2[2]], [b3[0], Y, b3[2]], [a3[0], Y, a3[2]], cop);
          G.quad(b3, a3, [a3[0], Y, a3[2]], [b3[0], Y, b3[2]], ci);
        }
      } else {
      G.box(0, 0, h.d / 2 - 0.11, h.w, 0.9, 0.22, h.col, { ct: cop }); G.box(0, 0, -h.d / 2 + 0.11, h.w, 0.9, 0.22, h.col, { ct: cop });
      G.box(h.w / 2 - 0.11, 0, 0, 0.22, 0.9, h.d - 0.44, h.col, { ct: cop, ne: true }); G.box(-h.w / 2 + 0.11, 0, 0, 0.22, 0.9, h.d - 0.44, h.col, { ct: cop, ne: true });
      }
      if (h.pd < 17) {                                              // scalloped coping
        const nsc = Math.round(h.w / 1.5), nsd = Math.round(h.d / 1.5);
        for (let k = 0; k < nsc; k++) { const x = -h.w / 2 + (k + 0.5) * (h.w / nsc), b = h.w / nsc * 0.36; for (const sz of [-1, 1]) { const z = sz * (h.d / 2 - 0.11); G.quad([x - b, 0.9, z], [x + b, 0.9, z], [x + b * 0.5, 1.08, z], [x - b * 0.5, 1.08, z], cop, cop, true); } }
        for (let k = 0; k < nsd; k++) { const z = -h.d / 2 + (k + 0.5) * (h.d / nsd), b = h.d / nsd * 0.36; for (const sx of [-1, 1]) { const x = sx * (h.w / 2 - 0.11); G.quad([x, 0.9, z - b], [x, 0.9, z + b], [x, 1.08, z + b * 0.5], [x, 1.08, z - b * 0.5], cop, cop, true); } }
      }
      if (!lite) for (let k = 0; k < 2; k++) { const sx = dr.sign(), z = dr.range(-az, az) * 0.8; G.box(sx * (h.w / 2 + 0.2), 0.04, z, 0.5, 0.1, 0.16, K.cement); }
      if (night && h.pd < 32 && !lite) for (let k = 0, n = Math.round((h.w + h.d) / 1.1); k < n; k++) {
        const t = dr.range(-1, 1), e = dr.int(0, 3), p = at(e < 2 ? t * h.w / 2 : (e === 2 ? 1 : -1) * (h.w / 2 - 0.11), e < 2 ? (e ? 1 : -1) * (h.d / 2 - 0.11) : t * h.d / 2);
        lampPts.push([p[0], fy + 1.02, p[1]]);
      }
      // slots for things: a grid over the floor
      const nx = Math.max(3, Math.round((2 * ax) / 2.5)), nz = Math.max(3, Math.round((2 * az) / 2.5));
      slotsBuf.length = 0;
      for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) slotsBuf.push([-ax + (a + 0.5) * (2 * ax / nx), -az + (b + 0.5) * (2 * az / nz), a === 0 || b === 0 || a === nx - 1 || b === nz - 1]);
      if (h.fig) for (let k = slotsBuf.length - 1; k >= 0; k--) for (let f = 0; f < h.fig.length; f += 3) if (Math.hypot(slotsBuf[k][0] - h.fig[f], slotsBuf[k][1] - h.fig[f + 1]) < h.fig[f + 2]) { slotsBuf.splice(k, 1); break; }
      dr.shuffle(slotsBuf);
      const take = (edge, ok) => { for (let k = 0; k < slotsBuf.length; k++) if ((edge === undefined || slotsBuf[k][2] === edge) && (!ok || ok(slotsBuf[k]))) return slotsBuf.splice(k, 1)[0]; return ok ? undefined : slotsBuf.pop(); };
      const wash = (x0, x1, sz) => {
        G.frame(h.x, fy, h.z, h.r); G.a0 = 0; G.a1 = 0;
        if (lite) { for (const xp of [x0, x1]) G.quad([xp - 0.05, 0, sz], [xp + 0.05, 0, sz], [xp + 0.05, 2.15, sz], [xp - 0.05, 2.15, sz], K.bamboo, K.bamboo, true); }
        else { G.box(x0, 0, sz, 0.06, 2.15, 0.06, K.bamboo); G.box(x1, 0, sz, 0.06, 2.15, 0.06, K.bamboo); G.box((x0 + x1) / 2, 2.04, sz, x1 - x0, 0.03, 0.03, K.rope); }
        CG.frame(h.x, fy, h.z, h.r);
        for (let x = x0 + 0.3; x < x1 - 0.8;) {
          const wd = dr.range(0.6, 1.25), len = dr.chance(0.3) ? 1.75 : dr.range(0.8, 1.3), c = dr.pick(K.cloths), c2 = dr.chance(0.3) ? dr.pick(K.cloths) : c; CG.a1 = dr.range(0, 6);
          const bc = K.borders[Math.floor(CG.a1 * 7) % K.borders.length];
          for (let k = 0; k < 3; k++) {
            const y0 = 2.04 - len * (k + 1) / 3, y1 = 2.04 - len * k / 3, yb = k === 2 ? y0 + len * 0.12 : y0, wb = 0.16 * (k + 1) - (k === 2 ? 0.0576 : 0);
            CG.quadW([x, yb, sz], [x + wd, yb, sz], [x + wd, y1, sz], [x, y1, sz], k === 2 ? c2 : mul(c, 0.94), c, wb, 0.16 * k);
            if (k === 2) CG.quadW([x, y0, sz], [x + wd, y0, sz], [x + wd, yb, sz], [x, yb, sz], mul(bc, 0.85), bc, 0.48, wb);   // the sari's border
          }
          x += wd + dr.range(0.08, 0.5);
        }
      };
      // the roofs the camera all but touches get two helpings (six to nine things), always with a tank and a washing line or a quilt
      const near = h.pd < 22 && !lite && !h.haveli, reps = h.haveli ? Math.round(h.w * 0.3) : near ? 2 : 1, first = (rep) => near && rep === 0;
      let washed = 0;
      for (let rep = 0; rep < reps; rep++) {
        let sl;
        if (tallH && (rep === 0 || !!h.haveli) && dr.chance(0.7) && (sl = take(true, wide))) {   // stair hutch with a tin door, sometimes a tank on top
          prop(sl[0], sl[1], dr.int(0, 3) * Math.PI / 2); G.a0 = 0;
          const hh = dr.range(2.0, 2.4), wc = dr.chance(0.5) ? mixc(h.col, K.white, 0.5) : K.white;
          G.box(0, 0, 0, 2.1, hh, 2.2, wc, { g: 0.8, nt: true }); G.box(0, hh, 0, 2.4, 0.12, 2.5, mul(K.cement, 1.2));
          G.quad([-0.45, 0.02, 1.12], [0.45, 0.02, 1.12], [0.45, 1.8, 1.12], [-0.45, 1.8, 1.12], dr.pick(K.tin));
          if (!lite && dr.chance(0.4) && h.pd > 16) { G.a0 = 0; G.cyl(0.2, hh + 0.12, -0.2, 0.55, 0.55, 1.0, 8, K.tank, mul(K.tank, 2)); G.cyl(0.2, hh + 1.12, -0.2, 0.2, 0.2, 0.08, 6, K.tank); }
        }
        if (tallH && (dr.chance(0.55 * rich) || first(rep)) && (sl = take(undefined, wide))) {   // water tank on a brick stand: black plastic or whitewashed cement
          prop(sl[0], sl[1], dr.range(0, 1.5)); G.a0 = 0;
          G.box(0, 0, 0, 1.3, 0.55, 1.3, K.brick, { g: 0.8 });
          if (dr.chance(0.6)) { G.cyl(0, 0.55, 0, 0.56, 0.56, 1.05, lite ? 6 : 8, K.tank, mul(K.tank, 2.2)); if (!lite) G.cyl(0, 1.6, 0, 0.2, 0.2, 0.08, 6, K.tank); }
          else G.box(0, 0.55, 0, 1.2, 0.9, 1.2, K.white, { g: 0.85 });
        }
        if (!lite && (must(0.36) || (first(rep) && !tall)) && (sl = take())) {   // charpoy with a quilt airing
          prop(sl[0], sl[1], dr.range(-0.4, 0.4) + (dr.chance(0.5) ? Math.PI / 2 : 0)); G.a0 = 0;
          for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) G.box(sx * 0.88, 0, sz * 0.4, 0.07, 0.46, 0.07, K.wood, { nt: true });
          G.box(0, 0.4, 0, 1.9, 0.08, 0.92, mul(K.bamboo, 0.9));
          G.a0 = 6; G.a1 = 3; G.box(dr.range(-0.2, 0.2), 0.48, 0, 1.4, 0.09, 0.86, dr.pick(K.quilts)); G.a1 = 0;
        }
        if (must(0.42) && (sl = take())) {                         // a cloth spread with crimson chillies
          prop(sl[0], sl[1], dr.range(-0.3, 0.3)); G.a0 = 6; G.a1 = 0;
          G.quad([-1.05, 0.03, 0.8], [1.05, 0.03, 0.8], [1.05, 0.03, -0.8], [-1.05, 0.03, -0.8], mul(K.white, 0.9));
          G.a1 = 1; G.quad([-0.9, 0.05, 0.66], [0.9, 0.05, 0.66], [0.9, 0.05, -0.66], [-0.9, 0.05, -0.66], K.chili); G.a1 = 0;
        }
        if (must(0.25) && (sl = take())) {                         // papad drying
          prop(sl[0], sl[1], dr.range(-0.3, 0.3)); G.a0 = 6; G.a1 = 2;
          G.quad([-0.9, 0.03, 0.7], [0.9, 0.03, 0.7], [0.9, 0.03, -0.7], [-0.9, 0.03, -0.7], K.dark); G.a1 = 0;
        }
        if (!lite && must(0.4) && (sl = take())) {                // brass pots
          prop(sl[0], sl[1]); G.a0 = 2;
          for (let k = 0, n = dr.int(1, 3); k < n; k++) { const x = (k - 1) * 0.5 + dr.range(-0.1, 0.1), z = dr.range(-0.3, 0.3), s = dr.range(0.8, 1.2); G.cyl(x, 0, z, 0.13 * s, 0.25 * s, 0.2 * s, 6, K.brass, null, 0.7); G.cyl(x, 0.2 * s, z, 0.25 * s, 0.11 * s, 0.17 * s, 6, K.brass, mul(K.dark, 0.5)); }
        }
        if (!lite && tallH && dr.chance(0.24) && (sl = take(true, wide))) { // dish antenna
          prop(sl[0], sl[1], dr.range(0, TAU)); G.a0 = 0;
          G.box(0, 0, 0, 0.07, 1.3, 0.07, K.cement);
          const c = [0, 1.45, 0.1], R = 0.5;
          for (let k = 0; k < 7; k++) { const a0 = (k / 7) * TAU, a1 = ((k + 1) / 7) * TAU; G.tri(c, [Math.cos(a0) * R, 1.45 + Math.sin(a0) * R * 0.8, 0.3 + Math.sin(a0) * R * 0.6], [Math.cos(a1) * R, 1.45 + Math.sin(a1) * R * 0.8, 0.3 + Math.sin(a1) * R * 0.6], mul(K.white, 0.9), true); }
        }
        if (!lite && dr.chance(0.42 * rich) && (sl = take())) {    // tulsi in its planter
          prop(sl[0], sl[1], dr.range(0, 1)); G.a0 = 0;
          G.box(0, 0, 0, 0.5, 0.6, 0.5, K.white, { t: 0.8, g: 0.8 }); G.box(0, 0.3, 0, 0.47, 0.1, 0.47, [0.56, 0.17, 0.09], { nt: true }); G.cyl(0, 0.6, 0, 0.14, 0.2, 0.2, 6, K.clay, mul(K.dark, 0.6));
          // a rounded bush, wider than its pot: a faceted crown, dark underneath and pale across its top (never a point: it is no pine)
          const ts = 0.92 + 0.3 * Math.abs(Math.sin(sl[0] * 7.31 + sl[1] * 3.17));
          let ty = 0.74, tr = 0.08;
          for (const [r1, dh, bk] of [[0.3, 0.15, 0.78], [0.35, 0.16, 1.0], [0.29, 0.15, 1.22], [0.15, 0.1, 1.42]]) {
            G.cyl(0.02, ty, -0.01, tr * ts, r1 * ts, dh * ts, 6, mul(K.green, bk), bk > 1.4 ? mul(K.green, 1.5) : null, 0.8);
            ty += dh * ts; tr = r1;
          }
        }
        if (!lite && rt.chance(0.22 * rich) && (sl = take())) {    // a bicycle leaned on the parapet, brass water pots, or clay lamps set out on a board
          // a bicycle wants a parapet beside its slot, and stands clear of the route's corridor (nothing solid within 3.5 m under the camera:
          // the roofs within 9.5 m of the route lie 4.5 m under it and a bicycle is 1.05 m tall)
          const bikeOK = sl[2] && h.pd >= 9.5, roll = rt(), what = bikeOK ? (roll < 1 / 3 ? 0 : roll < 2 / 3 ? 1 : 2) : (roll < 0.5 ? 1 : 2);
          if (what === 0) {
            const onX = ax - Math.abs(sl[0]) < az - Math.abs(sl[1]), sg = (onX ? sl[0] : sl[1]) < 0 ? -1 : 1, q = onX ? (sg > 0 ? 1 : 3) : (sg > 0 ? 0 : 2);
            const wall = (onX ? h.w : h.d) / 2 - 0.22, room = Math.max(0, (onX ? h.d : h.w) / 2 - 1.25), t0 = q === 0 ? sl[0] : q === 1 ? -sl[1] : q === 2 ? -sl[0] : sl[1];
            const tx = Math.max(-room, Math.min(room, t0)), flip = rt.sign(), tilt = rt.range(0.26, 0.31), cl = Math.cos(tilt), sn = Math.sin(tilt);
            const paint = rt.pick([[0.03, 0.03, 0.035], [0.04, 0.1, 0.06], [0.2, 0.04, 0.04], [0.04, 0.07, 0.19]]), tyre = [0.05, 0.05, 0.055], steel = [0.5, 0.5, 0.53];
            G.frame(h.x, fy, h.z, h.r + q * Math.PI / 2); G.a0 = 0; G.a1 = 0;   // +z runs out through that parapet; the wheels stand 0.36 m inside its inner face
            const P = (p) => [tx + flip * p[0], p[1] * cl - p[2] * sn, wall - 0.36 + p[2] * cl + p[1] * sn];
            // a tube as two crossed strips; strip 1: only the one lying across the bicycle, 2: only the one standing in its plane
            const bar = (a, b, w, col, strip = 0) => {
              const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], flat = Math.abs(dz) > Math.hypot(dx, dy), l = (flat ? 1 : Math.hypot(dx, dy)) || 1;
              const o1 = flat ? [w / 2, 0, 0] : [0, 0, w / 2], o2 = flat ? [0, w / 2, 0] : [-dy / l * w / 2, dx / l * w / 2, 0];
              for (const o of strip === 1 ? [o1] : strip === 2 ? [o2] : [o1, o2]) G.quad(P([a[0] - o[0], a[1] - o[1], a[2] - o[2]]), P([a[0] + o[0], a[1] + o[1], a[2] + o[2]]), P([b[0] + o[0], b[1] + o[1], b[2] + o[2]]), P([b[0] - o[0], b[1] - o[1], b[2] - o[2]]), col, col, true);
            };
            for (const wx of [-0.53, 0.53]) for (let k = 0; k < 8; k++) {   // two wheels
              const a0 = (k / 8) * TAU, a1 = ((k + 1) / 8) * TAU, W = (a, r) => P([wx + Math.cos(a) * r, 0.33 + Math.sin(a) * r, 0]);
              G.quad(W(a0, 0.26), W(a1, 0.26), W(a1, 0.33), W(a0, 0.33), steel, tyre, true);   // a steel rim inside a dark tyre
            }
            bar([-0.08, 0.28, 0], [-0.2, 0.84, 0], 0.035, paint); bar([-0.2, 0.8, 0], [0.36, 0.84, 0], 0.035, paint); bar([-0.08, 0.28, 0], [0.38, 0.72, 0], 0.035, paint);
            bar([0.33, 1.0, 0], [0.53, 0.33, 0], 0.035, paint); bar([-0.08, 0.28, 0], [-0.53, 0.33, 0], 0.03, paint, 2); bar([-0.2, 0.8, 0], [-0.53, 0.33, 0], 0.03, paint, 2);
            bar([0.33, 1.0, -0.24], [0.33, 1.0, 0.24], 0.035, steel, 1);    // the handlebar, which rides over the coping
            bar([-0.2, 0.74, 0], [-0.74, 0.72, 0], 0.13, steel, 1);         // the carrier
            bar([-0.36, 0.88, 0], [-0.1, 0.9, 0], 0.14, [0.2, 0.1, 0.05], 1);   // the saddle
          } else if (what === 1) {                                  // brass water pots: two stacked mouth on mouth, one or two beside
            prop(sl[0], sl[1], rt.range(0, TAU)); G.a0 = 2; G.a1 = 0;
            const pot = (x, y, z, s) => { G.cyl(x, y, z, 0.13 * s, 0.25 * s, 0.2 * s, 5, K.brass, null, 0.7); G.cyl(x, y + 0.2 * s, z, 0.25 * s, 0.12 * s, 0.19 * s, 5, K.brass, mul(K.dark, 0.5)); return y + 0.39 * s; };
            const s0 = rt.range(1.2, 1.4), top = pot(-0.2, 0, 0, s0); pot(-0.2, top - 0.02, 0, s0 * rt.range(0.68, 0.8));
            for (let k = 0, n = rt.int(1, 2); k < n; k++) pot(0.38 + rt.range(-0.03, 0.03), 0, (k ? -0.31 : 0.31) + rt.range(-0.02, 0.02), rt.range(0.85, 1.1));
            G.a0 = 0;
          } else {                                                  // clay lamps set out on a low wooden board, each with its flame
            prop(sl[0], sl[1], rt.range(-0.4, 0.4) + (rt.chance(0.5) ? Math.PI / 2 : 0)); G.a0 = 0; G.a1 = 0;
            G.box(0, 0, 0, 1.2, 0.05, 0.62, K.wood, { g: 0.8 });
            for (let a = 0; a < 4; a++) for (let b = 0; b < 2; b++) {
              const on = rt.chance(0.82), x = (a - 1.5) * 0.27 + rt.range(-0.04, 0.04), z = (b - 0.5) * 0.28 + rt.range(-0.04, 0.04), fl = rt.range(0.07, 0.1);
              if (!on) continue;
              G.a0 = 0; G.a1 = 0; G.cyl(x, 0.05, z, 0.05, 0.085, 0.04, 4, K.clay, mul(K.dark, 0.7));
              G.a0 = 7; G.a1 = 2.2; G.tri([x - 0.022, 0.09, z], [x + 0.022, 0.09, z], [x, 0.09 + fl, z], [1, 0.62, 0.2], true);
            }
            G.a0 = 0; G.a1 = 0;
          }
        }
        if (!lite && dr.chance(0.34 * rich) && (sl = take())) {    // crates and sacks
          prop(sl[0], sl[1], dr.range(0, 1)); G.a0 = 0;
          const crate = (x, y, z, sx, sy, sz, col, r) => {          // slatted, with a dark open top
            const c = Math.cos(r), sn = Math.sin(r), q = (lx, lz) => [x + lx * c + lz * sn, y + sy + 0.004, z - lx * sn + lz * c], dk = mul(col, 0.42);
            G.box(x, y, z, sx, sy, sz, col, { g: 0.8, r }); G.quad(q(-sx * 0.41, sz * 0.39), q(sx * 0.41, sz * 0.39), q(sx * 0.41, -sz * 0.39), q(-sx * 0.41, -sz * 0.39), dk);
            G.box(x, y + sy * 0.45, z, sx + 0.024, 0.04, sz + 0.024, mul(col, 0.55), { r, nt: true });
          };
          crate(0, 0, 0, 0.7, 0.45, 0.5, K.wood, 0); if (dr.chance(0.6)) crate(0.08, 0.462, 0, 0.5, 0.35, 0.4, mul(K.wood, 1.3), 0.26);
          if (dr.chance(0.5)) { const sk = [0.46, 0.37, 0.23]; G.cyl(-0.64, 0, 0.16, 0.22, 0.3, 0.42, 6, sk, null, 0.75); G.cyl(-0.64, 0.42, 0.16, 0.3, 0.08, 0.2, 6, sk, null); G.cyl(-0.64, 0.6, 0.16, 0.08, 0.13, 0.1, 6, mul(sk, 1.15), mul(sk, 0.5)); }
        }
        if (tall && !h.haveli && (dr.chance(lite ? 0.22 : 0.45 * rich) || first(rep))) {   // washing line of saris and white dhotis, on the side the people are not
          const ws = dr.sign(), sg = washed ? -washed : (h.figZ ? -h.figZ : ws);
          wash(-ax + 0.25, ax - 0.25, sg * (az - 0.55)); washed = sg;
        }
      }
      if (h.haveli) for (const sz of [-0.34, 0.34]) {                // long lines down the terrace's long axis, clear of the route over the centre block
        if (low) { wash(-ax + 0.3, -5.2, sz * az); wash(5.2, ax - 0.3, sz * az); } else wash(-ax + 0.3, ax - 0.3, sz * az);
      }
      // carved balconies on the havelis, kiosks on the grandest
      if (stoneW) {
        const faces = h.haveli ? [0] : [Math.atan2(path.pointAt(h.ps / L, tmpP).x - h.x, tmpP.z - h.z)];
        for (const fa of faces) {
          const q = Math.round((fa - h.r) / (Math.PI / 2)), along = q % 2 === 0 ? h.w : h.d, out = q % 2 === 0 ? h.d / 2 : h.w / 2, ra = h.r + q * Math.PI / 2;
          const n = Math.max(1, Math.floor(along / 3.6)), fxc = h.x + Math.sin(ra) * out, fzc = h.z + Math.cos(ra) * out, hw = along / 2;
          for (const yy of h.haveli || h.top - h.gy > 9.6 ? [-3.6, -7.1] : [-3.6]) {
            G.frame(fxc, fy + yy, fzc, ra);
            for (let k = 0; k < n; k++) jharokha(G, (k - (n - 1) / 2) * (along / n), !h.haveli);
            G.a0 = 1; G.a1 = 0; G.box(0, -0.2, 0.05, along + 0.1, 0.2, 0.1, K.stoneL, { g: 0.85 });
          }
          G.frame(fxc, fy, fzc, ra); G.a0 = 1; G.a1 = 0;
          G.quad([-hw - 0.3, -0.06, 0.95], [hw + 0.3, -0.06, 0.95], [hw + 0.3, 0.3, 0], [-hw - 0.3, 0.3, 0], mul(K.stone, 0.85), K.stoneL, true);
          G.quad([-hw - 0.3, -0.18, 0.95], [hw + 0.3, -0.18, 0.95], [hw + 0.3, -0.06, 0.95], [-hw - 0.3, -0.06, 0.95], K.stone, K.stoneL);
          for (let k = 0, nb = Math.max(2, Math.round(along / 1.5)); k <= nb; k++) G.box(-hw + 0.15 + (k / nb) * (along - 0.3), -0.42, 0.26, 0.15, 0.5, 0.52, K.stone, { g: 0.7, nt: true });
        }
        if (h.haveli || h.bal) { const kd = h.bal ? balDiag(h) : 1; G.frame(h.x, fy + 0.9, h.z, h.r); for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) if (h.haveli || sx * sz * kd > 0) kiosk(G, sx * (h.w / 2 - 1.4), sz * (h.d / 2 - 1.4)); }
      }
    };
    { let nd = 0; for (const h of H) { if (h.kind < 1) continue; dressRoof(h, dr, false); if (++nd % 5 === 0) await ctx.yield(); } }
    await ctx.yield();
    {                                                               // the first ring round the square gets real parapets, hutches, tanks and washing
      const dr2 = ctx.core.makeRng(((ctx.seed >>> 0) ^ 0x2f6e2b1) >>> 0); let nd = 0;
      for (const h of H) { if (!h.ring) continue; dressRoof(h, dr2, true); if (++nd % 10 === 0) await ctx.yield(); }
    }
    await ctx.yield();

    // ---- set dressing placed by hand: bunting over the route, temple spires, a bougainvillea, roof-to-roof bunting ----
    const findRoof = (s, lat) => { for (let k = 0; k < 9; k++) { side(s + (k % 3 - 1) * 4, lat + Math.sign(lat) * Math.floor(k / 3) * 3, v3); if (roofAt(v3[0], v3[2]).i >= 0) return { h: H[hit.i], x: v3[0], z: v3[2] }; } return null; };
    const bandOf = (s) => DG[Math.min(NB - 1, Math.max(0, Math.floor(s / BAND)))];
    for (const s of [120, 205, 300]) {
      const a = findRoof(s, -dr.range(10.5, 13)), b = findRoof(s + dr.range(-5, 5), dr.range(10.5, 13)); if (!a || !b) continue;
      const yTop = Math.max(path.posAtDist(s, tmpP).y + 5.7, a.h.top + 1.3, b.h.top + 1.3), G = bandOf(s); G.a0 = 0; G.a1 = 0;
      for (const e of [a, b]) { G.frame(e.x, e.h.top, e.z, 0); G.box(0, 0, 0, 0.13, yTop - e.h.top, 0.13, K.bamboo); G.box(0, 0, 0, 0.5, 0.3, 0.5, K.cement); }
      bunting([a.x, yTop - 0.1, a.z], [b.x, yTop - 0.1, b.z], 1.0, dr.range(0, 6));
      poleTops.push([a.x, yTop, a.z]);
    }
    await ctx.yield();
    for (const h of H) {
      if (h.kind < 1 || h.pd < 15 || h.pd > 46 || h.haveli || !dr.chance(0.3)) continue;
      const dirx = dr.chance(0.5), ox = dirx ? dr.sign() * PITCH : 0, oz = dirx ? 0 : dr.sign() * PITCH;
      if (roofAt(h.x + ox, h.z + oz).i < 0) continue;
      const o = H[hit.i]; if (o === h || o.kind < 1 || o.pd < 15 || o.haveli) continue;
      const pa = [h.x + Math.sign(ox + oz) * (dirx ? h.w / 2 - 0.4 : dr.range(-2, 2)), h.top, h.z + Math.sign(ox + oz) * (dirx ? dr.range(-2, 2) : h.d / 2 - 0.4)];
      const pb = [o.x - Math.sign(ox + oz) * (dirx ? o.w / 2 - 0.4 : dr.range(-2, 2)), o.top, o.z - Math.sign(ox + oz) * (dirx ? dr.range(-2, 2) : o.d / 2 - 0.4)];
      const G = bandOf(h.ps), ya = Math.max(pa[1], pb[1]) + dr.range(2.3, 3.1); G.a0 = 0; G.a1 = 0;
      for (const e of [pa, pb]) { G.frame(e[0], e[1], e[2], 0); G.box(0, 0, 0, 0.08, ya - e[1], 0.08, K.bamboo); }
      bunting([pa[0], ya - 0.05, pa[2]], [pb[0], ya - 0.05, pb[2]], dr.range(0.3, 0.6), dr.range(0, 6));
    }
    await ctx.yield();
    for (const sx of [-1, 1]) bunting([sx * 13.6, 27.4, 63.4], [sx * 48.6, 17 + 3.4, 75.6], 1.6, dr.range(0, 6), K.bright);   // the square keeps its loud bunting
    {
      const hb = H.find((h) => h.bal);
      if (hb) { const e = findRoof(balconyS + 16, 12); if (e && e.h !== hb) { const G = bandOf(balconyS), ya = e.h.top + 3; G.a0 = 0; G.a1 = 0; G.frame(e.x, e.h.top, e.z, 0); G.box(0, 0, 0, 0.09, 3, 0.09, K.bamboo); bunting([hb.x - (hb.w / 2 - 1.4), hb.top + 4.4, hb.z - (hb.d / 2 - 1.4)], [e.x, ya, e.z], 1.2, dr.range(0, 6)); } }
    }
    await ctx.yield();
    // ---- the lane's walls and floor: plinths to sit on, awnings, saris hung down the walls from the roofs, bunting across, powder carts ----
    {
      const lw = ctx.core.makeRng(((ctx.seed >>> 0) ^ 0x6d3f09) >>> 0);
      const awn = [[KW, mul(pal[1], 0.9)], [KW, mul(pal[0], 1.25)], [[0.7, 0.6, 0.44], KW]];
      for (let q = 0; q < laneIdx.length; q++) {
        const h = H[laneIdx[q]], cr = Math.cos(h.r), sr = Math.sin(h.r), nx = h.inX * cr, nz = -h.inX * sr, ra = Math.atan2(nx, nz);
        const wx = h.x + nx * h.w / 2, wz = h.z + nz * h.w / 2, G = bandOf(h.ps), hgt = h.top - h.gy, stoneW = h.kind === 2;
        const r1 = lw(), r2 = lw(), r3 = lw(), r4 = lw(), r5 = lw(), r6 = lw();
        if (h.laneK < 0.3) continue;
        G.frame(wx, h.gy, wz, ra); G.a0 = stoneW ? 1 : 0; G.a1 = 0;
        if (h.inner > 3.8) {                                       // a plinth along the wall, a step, a brass pot or two
          const pc = mixc(h.col, K.white, 0.5);
          G.box(0, -0.4, 0.25, h.d - 0.4, 0.86, 0.5, pc, { g: 0.8 }); G.box((r1 - 0.5) * (h.d - 2.6), -0.4, 0.66, 1.1, 0.62, 0.34, mul(pc, 0.92), { g: 0.8 });
          G.a0 = 2;
          for (let k = 0, n = Math.floor(r2 * 3); k < n; k++) { const x = (r3 - 0.5) * (h.d - 2) + k * 0.5, sc = 0.9 + 0.3 * r4; G.cyl(x, 0.46, 0.25, 0.13 * sc, 0.25 * sc, 0.2 * sc, 6, K.brass, null, 0.7); G.cyl(x, 0.46 + 0.2 * sc, 0.25, 0.25 * sc, 0.11 * sc, 0.17 * sc, 6, K.brass, mul(K.dark, 0.5)); }
        }
        G.a0 = 0;
        if (r5 < 0.5 && !stoneW) {                                  // a striped cloth awning on two bamboo struts
          const ax0 = (r6 - 0.5) * (h.d - 3.4), wd = 2.6, cols = awn[Math.floor(r1 * 3) % 3];
          for (const sx of [-1, 1]) G.box(ax0 + sx * (wd / 2 - 0.05), 0, 1.06, 0.05, 2.3, 0.05, K.bamboo);
          CG.frame(wx, h.gy, wz, ra); CG.a1 = r2 * 6;
          for (let k = 0; k < 4; k++) { const x0 = ax0 - wd / 2 + k * wd / 4, x1 = x0 + wd / 4, c = cols[k % 2]; CG.quadW([x0, 2.3, 1.1], [x1, 2.3, 1.1], [x1, 2.8, 0.03], [x0, 2.8, 0.03], mul(c, 0.86), c, 0.06, 0); }
        }
        if (!stoneW && h.laneK > 0.9) for (let k = 0, n = 1 + Math.floor(r4 * 2); k < n; k++) {   // saris hung down the wall from a pole at the parapet
          const wd = 1.1, x0 = (r3 - 0.5) * (h.d - 4.6) + (k ? 1.9 : -0.6) - wd / 2, ln = Math.min(hgt - 3.2, 4 + 2.6 * (k ? r6 : r2)), yt = hgt + 0.82;
          const c = K.cloths[Math.floor((k ? r5 : r1) * K.cloths.length) % K.cloths.length], bc = K.borders[Math.floor((k ? r2 : r6) * 4) % 4];
          G.box(x0 + wd / 2, yt, 0.3, wd + 0.3, 0.04, 0.04, K.bamboo); for (const sx of [-0.1, wd + 0.1]) G.box(x0 + sx, yt, 0.13, 0.04, 0.04, 0.34, K.bamboo);
          CG.frame(wx, h.gy, wz, ra); CG.a1 = (k ? r3 : r5) * 6;
          for (let j = 0; j < 5; j++) {
            const y1 = yt - ln * j / 5, y0 = yt - ln * (j + 1) / 5, last = j === 4, yb = last ? y0 + ln * 0.07 : y0;
            CG.quadW([x0, yb, 0.3], [x0 + wd, yb, 0.3], [x0 + wd, y1, 0.3], [x0, y1, 0.3], mul(c, 0.92), j === 0 ? bc : c, 0.028 * (j + 1) - (last ? 0.01 : 0), 0.028 * j);
            if (last) CG.quadW([x0, y0, 0.3], [x0 + wd, y0, 0.3], [x0 + wd, yb, 0.3], [x0, yb, 0.3], mul(bc, 0.85), bc, 0.14, 0.13);
          }
        }
      }
      await ctx.yield();
      for (const s of [102, 135, 167]) {                       // bunting from parapet to parapet, five metres over the camera
        let a = null, b = null;
        for (let q = 0; q < laneIdx.length; q++) {
          const h = H[laneIdx[q]]; if (Math.abs(h.ps - s) > h.d / 2 - 0.4) continue;
          side(s, h.inX * (h.inner + 0.11), v3); const e = [v3[0], h.top + 0.98, v3[2]]; if (h.inX < 0) a = e; else b = e;
        }
        if (a && b) bunting(a, b, 0.5, lw.range(0, 6));
      }
      let cq = 0;
      for (const [s, sg] of [[112, 1], [CROSS + 11.5, -1], [187, 1]]) {   // handcarts heaped with cones of powder
        side(s, sg * 2.6, v3); const G = bandOf(s), gy = ground(v3[0], v3[2]);
        G.frame(v3[0], gy, v3[2], Math.atan2(tmpT.x, tmpT.z) + lw.range(-0.2, 0.2)); G.a0 = 0; G.a1 = 0;
        for (const [ox, oz] of [[-0.44, -0.6], [0.44, -0.6], [-0.44, 0.6], [0.44, 0.6]]) G.cyl(ox, 0.02, oz, 0.05, 0.05, 0.6, 5, K.dark, null);
        G.box(0, 0.6, 0, 0.9, 0.1, 1.8, K.wood, { g: 0.8 }); G.box(0, 0.7, 0, 0.84, 0.03, 1.7, mul(K.white, 0.9));
        for (let k = 0; k < 5; k++) { const pc = powCols[(k + cq) % nCol]; G.cyl(k % 2 ? 0.19 : -0.19, 0.73, -0.64 + k * 0.32, 0.2, 0.02, 0.36, 7, [pc.r * 0.85, pc.g * 0.85, pc.b * 0.85]); }
        cq++;
      }
    }
    await ctx.yield();
    const temples = [];
    for (const [s, lat] of [[112, 41], [296, -38]]) {
      const e = findRoof(s, lat); if (!e) continue;
      const h = e.h, G = bandOf(s), y = h.top; G.frame(h.x, y, h.z, h.r); G.a0 = 0; G.a1 = 0;
      G.box(0, 0, 0, 3.6, 1.3, 3.6, K.white, { g: 0.85 });
      G.cyl(0, 1.3, 0, 1.55, 1.28, 2.3, 8, K.white, null, 0.9); G.cyl(0, 3.6, 0, 1.28, 0.55, 2.7, 8, K.white, null); G.cyl(0, 6.3, 0, 0.82, 0.82, 0.3, 8, K.white, K.white);
      G.a0 = 2; G.cyl(0, 6.6, 0, 0.26, 0.02, 0.8, 6, K.brass); G.a0 = 0; G.box(0, 7.3, 0, 0.06, 2.4, 0.06, K.bamboo);
      CG.frame(h.x, y, h.z, 0); CG.a1 = dr.range(0, 6);
      for (let k = 0; k < 3; k++) CG.quadW([-k * 0.55, 8.6 + k * 0.16, 0], [-(k + 1) * 0.55, 8.6 + (k + 1) * 0.16, 0], [-(k + 1) * 0.55, 9.6 - (k + 1) * 0.16, 0], [-k * 0.55, 9.6 - k * 0.16, 0], mul(pal[5], 0.95), mul(pal[5], 0.85), k * 0.3, (k + 1) * 0.3);
      temples.push([h.x, y + 5, h.z]);
    }
    await ctx.yield();
    {                                                               // the bougainvillea that spills over a parapet in the opening
      const e = findRoof(24, 9.5);
      if (e) {
        const h = e.h, cr = Math.cos(h.r), sr = Math.sin(h.r); path.posAtDist(24, tmpP);
        const dx = tmpP.x - h.x, dz = tmpP.z - h.z, lx = Math.max(-h.w / 2, Math.min(h.w / 2, dx * cr - dz * sr)), lz = Math.max(-h.d / 2, Math.min(h.d / 2, dx * sr + dz * cr));
        const ex = h.x + lx * cr + lz * sr, ez = h.z - lx * sr + lz * cr, ox = (tmpP.x - ex), oz = (tmpP.z - ez), ol = Math.hypot(ox, oz) || 1;
        CG.frame();
        for (let k = 0; k < 110; k++) {
          const t = dr.range(-2.2, 2.2), out = dr.range(-0.3, 0.55), y = h.top + 1.25 - Math.pow(dr(), 1.4) * 2.8 * (out > 0 ? 1 : 0.3), s = dr.range(0.16, 0.3);
          const px = ex + (-oz / ol) * t + (ox / ol) * out, pz = ez + (ox / ol) * t + (oz / ol) * out, a = dr.range(0, TAU), ca = Math.cos(a) * s, sa = Math.sin(a) * s;
          const c = dr() < 0.72 ? mul(mixc(pal[4], [0.9, 0.2, 0.5], dr()), dr.range(0.7, 1.05)) : mul(K.green, dr.range(1, 1.8)); CG.a1 = dr.range(0, 6);
          CG.quadW([px - ca, y - s * 0.5, pz - sa], [px + ca, y - s * 0.5, pz + sa], [px + ca * 0.8, y + s * 0.5, pz + sa * 0.8 + 0.08], [px - ca * 0.8, y + s * 0.5, pz - sa * 0.8 + 0.08], c, mul(c, 1.15), 0.05, 0.08);
        }
      }
    }
    await ctx.yield();
    {                                                               // the opening: two big washing lines close beside the route, one airing a quilt
      const xr = ctx.core.makeRng(((ctx.seed >>> 0) ^ 0x51c3a7) >>> 0);
      for (const [sBase, sg, quilt] of [[21, -1, 0], [34, 1, 1], [52, -1, 1]]) {      // strung square to the route so they are seen face on
        let pa = null, pb = null, ta = 0, tb = 0;
        for (const ds of [0, 2.5, -2.5, 5, 7.5, 10]) {
          for (const far of [9.8, 8.6, 11]) {
            const a = side(sBase + ds, sg * 3.7, [0, 0, 0]), b = side(sBase + ds, sg * far, [0, 0, 0]);
            const ra = roofAt(a[0], a[2]).i, rb = roofAt(b[0], b[2]).i; if (ra < 0 || rb < 0 || sBase + ds < 18) continue;
            pa = a; pb = b; ta = H[ra].top; tb = H[rb].top; break;
          }
          if (pa) break;
        }
        if (!pa) continue;
        const yl = Math.min(pa[1], pb[1]) - 1.2, len = Math.hypot(pb[0] - pa[0], pb[2] - pa[2]), ry = Math.atan2(-(pb[2] - pa[2]), pb[0] - pa[0]), G = bandOf(sBase);
        G.a0 = 0; G.a1 = 0;
        G.frame(pa[0], ta, pa[2], ry); G.box(0, 0, 0, 0.1, yl - ta + 0.12, 0.1, K.bamboo); G.box(0, 0, 0, 0.45, 0.3, 0.45, K.cement);
        G.frame(pb[0], tb, pb[2], ry); G.box(0, 0, 0, 0.1, yl - tb + 0.12, 0.1, K.bamboo); G.box(0, 0, 0, 0.45, 0.3, 0.45, K.cement);
        G.frame(pa[0], yl, pa[2], ry); G.box(len / 2, 0, 0, len, 0.035, 0.035, K.rope);
        CG.frame(pa[0], yl, pa[2], ry);
        for (let x = 0.25; x < len - 0.9;) {
          const big = quilt && x < 1, wd = big ? 2.3 : xr.range(0.9, 1.45), ln = big ? 1.55 : (xr.chance(0.4) ? 1.95 : xr.range(1.1, 1.6)), c = big ? xr.pick(K.quilts) : xr.pick(K.cloths), c2 = big ? xr.pick(K.quilts) : (xr.chance(0.4) ? xr.pick(K.cloths) : c);
          CG.a1 = xr.range(0, 6); const amp = big ? 0.08 : 0.18;
          const bc = K.borders[Math.floor(CG.a1 * 7) % K.borders.length];
          for (let k = 0; k < 4; k++) {
            const y0 = -ln * (k + 1) / 4, y1 = -ln * k / 4, cut = k === 3 && !big, yb = cut ? y0 + ln * 0.12 : y0, wb = amp * (k + 1) - (cut ? amp * 0.48 : 0);
            CG.quadW([x, yb, 0], [x + wd, yb, 0], [x + wd, y1, 0], [x, y1, 0], (big ? k % 2 : k === 3) ? c2 : mul(c, 0.94), (big && k % 2) ? c2 : c, wb, amp * k);
            if (cut) CG.quadW([x, y0, 0], [x + wd, y0, 0], [x + wd, yb, 0], [x, yb, 0], mul(bc, 0.85), bc, amp * 4, wb);
          }
          x += wd + xr.range(0.1, 0.4);
        }
      }
    }
    await ctx.yield();
    // marigold garlands swagged on the parapets nearest the route
    for (const h of H) {
      if (h.kind < 1 || h.pd > 24 || h.haveli || !dr.chance(0.55)) continue;
      const cr = Math.cos(h.r), sr = Math.sin(h.r), q = dr.int(0, 3), along = q % 2 ? h.d : h.w, out = (q % 2 ? h.w : h.d) / 2 + 0.03, ra = h.r + q * Math.PI / 2;
      CG.frame(h.x + Math.sin(ra) * out, h.top + 0.72, h.z + Math.cos(ra) * out, ra); CG.a1 = dr.range(0, 6);
      const n = Math.max(2, Math.round(along / 2.2)), mar = mul(pal[5], 0.95);
      for (let k = 0; k < n; k++) for (let j = 0; j < 4; j++) {
        const t0 = j / 4, t1 = (j + 1) / 4, x0 = -along / 2 + (k + t0) * (along / n), x1 = -along / 2 + (k + t1) * (along / n), y0 = -0.5 * 4 * t0 * (1 - t0), y1 = -0.5 * 4 * t1 * (1 - t1);
        CG.quadW([x0, y0 - 0.13, 0.02], [x1, y1 - 0.13, 0.02], [x1, y1, 0.02], [x0, y0, 0.02], mul(mar, 0.8), j % 2 ? mar : mul(mar, 1.12), 0.05 * Math.sin(Math.PI * t0), 0.05 * Math.sin(Math.PI * t1));
      }
    }
    await ctx.yield();
    const bandMesh = [];
    for (let k = 0; k <= NB; k++) { if (!DG[k].count()) continue; const m = new THREE.Mesh(await DG[k].buildSteps(() => ctx.yield()), cityMat); m.castShadow = true; m.receiveShadow = true; scene.add(m); bandMesh[k] = m; await ctx.yield(); }
    {
      const m = new THREE.Mesh(await CG.buildSteps(() => ctx.yield()), clothMat); m.frustumCulled = false; scene.add(m);
      await ctx.yield();
      const m2 = new THREE.Mesh(farCloth.build(), clothMat); m2.frustumCulled = false; scene.add(m2);
    }
    await ctx.yield();

    // ---- neem and peepal in the courtyards ----
    const wind = flora.makeWind({ direction: [HU.uWind.value.x, HU.uWind.value.z], strength: weather === 'stiff' ? 1.6 : weather === 'still' ? 0.5 : 1 });
    await ctx.yield();
    const leafMap = await makeLeafAtlas(512, ctx.core.makeRng(0x1eaf5), () => ctx.yield());
    await ctx.yield();
    const leafMat = flora.windMaterial({ wind, map: leafMap });
    const leafDepth = flora.windDepthMaterial(leafMat);             // leaf-shaped shadows from the near trees
    {
      const tr = rng.fork('trees'), nearT = [], farT = [];
      for (let i = -GN; i <= GN; i++) for (let j = -GN; j <= GN; j++) {
        if (cellState[cidx(i, j)] !== 2) continue;
        warp(i * PITCH, j * PITCH, w2); const nr = path.nearestXZ(w2[0], w2[1]);
        if (nr.dist < 13 || Math.hypot(w2[0], w2[1]) > 500) continue;
        const gy = ground(w2[0], w2[1]), hgt = Math.min(tr.range(9.5, 13.5), nr.dist < 30 && nr.u * L < 380 ? refY(nr) - gy - 1.5 : 99);
        (nr.dist < 75 ? nearT : farT).push([w2[0], gy - 0.3, w2[1], hgt, tr.range(0, TAU), nr.dist]);
      }
      nearT.sort((a, b) => a[5] - b[5]); farT.unshift(...nearT.splice(7));
      const leaf = { leaf: '#4f7a2e', leafLight: '#8aa84c', leafDark: '#2a471d', bark: '#6e5a48' };
      const put = (list, geo, max, shadow) => {
        const n = Math.min(list.length, max); if (!n) { geo.dispose(); return; }
        const mesh = new THREE.InstancedMesh(geo, leafMat, n), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), YA = new THREE.Vector3(0, 1, 0);
        for (let k = 0; k < n; k++) { const t = list[k], s = t[3] / 11.5; M.compose(new THREE.Vector3(t[0], t[1], t[2]), Q.setFromAxisAngle(YA, t[4]), new THREE.Vector3(s * 1.15, s, s * 1.15)); mesh.setMatrixAt(k, M); }
        mesh.instanceMatrix.needsUpdate = true; mesh.receiveShadow = true; mesh.castShadow = !!shadow; if (shadow) { mesh.customDepthMaterial = leafDepth; mesh.frustumCulled = false; } mesh.computeBoundingSphere(); scene.add(mesh);
      };
      await ctx.yield();
      put(nearT, flora.oakGeometry({ rng: tr, detail: 1, height: 11.5, fullness: 1.1, ...leaf }), 7, true);
      await ctx.yield();
      put(farT, flora.oakGeometry({ rng: tr, detail: 0, height: 11.5, fullness: 1.15, ...leaf }), Math.round(33 * detail));
    }
    await ctx.yield();

    // ---- the troop: grey langurs bounding in two files beside the route, their tracks baked over roofs and gaps ----
    const lr = rng.fork('troop'), troopN = troop, DMAX = Math.ceil(L) + 12;
    const langGeo = langurGeometry(), iAnim = new Float32Array(troopN * 4);
    const iAnimAttr = new THREE.InstancedBufferAttribute(iAnim, 4); iAnimAttr.setUsage(THREE.DynamicDrawUsage); langGeo.setAttribute('iAnim', iAnimAttr);
    const langMesh = new THREE.InstancedMesh(langGeo, makeLangurMaterial(U), troopN);
    langMesh.frustumCulled = false; langMesh.receiveShadow = true; langMesh.castShadow = true; scene.add(langMesh);
    const blobGeo = new THREE.CircleGeometry(0.42, 10).rotateX(-Math.PI / 2);
    const blobMesh = new THREE.InstancedMesh(blobGeo, new THREE.MeshBasicMaterial({ color: '#070a18', transparent: true, opacity: night ? 0.12 : 0.2, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), troopN);
    blobMesh.frustumCulled = false; blobMesh.renderOrder = 1; scene.add(blobMesh);
    const lang = [];
    {
      const leads = []; for (let k = 0; k < troopN; k++) leads.push(8.5 + 18 * (k / Math.max(1, troopN - 1)));
      const cc = new THREE.Color();
      for (let k = 0; k < troopN; k++) {
        const lead = leads[k] + lr.range(-0.8, 0.8), sgn = k % 2 ? 1 : -1, lat = sgn * (2.6 + lead * 0.23 + lr.range(0, 1.6)), tgt = sgn * lr.range(33, 50);
        const yT = new Float32Array(DMAX + 2), aT = new Float32Array(DMAX + 2), oT = new Float32Array(DMAX + 2), xT = new Float32Array(DMAX + 2), zT = new Float32Array(DMAX + 2), hT = new Float32Array(DMAX + 2), latAt = (D) => mix(lat, tgt, sstep(386, 446, D));
        for (let D = 0; D <= DMAX; D++) {                           // they keep to the roofs: step sideways rather than run a lane
          const la = latAt(D), sg = Math.sign(la); let found = false;
          for (const pb of [0, 1.3, 2.6, 3.9, -1.3]) {
            if (pb < 0 && Math.abs(la) + pb < 3) continue;
            side(D, la + sg * pb, v3); const r = roofAt(v3[0], v3[2]);
            if (r.i >= 0) {
              const hh = H[r.i];
              if (hh.lane && hh.laneK > 0.5 && Math.abs(la) < hh.inner + 3.2) { yT[D] = hh.top + 0.9; oT[D] = sg * (hh.inner + 0.12) - la; }   // along the lane they run its parapets
              else { yT[D] = hh.top + (r.edge < 0.34 ? 0.9 : 0); oT[D] = sg * pb; }
              found = true; break;
            }
          }
          if (!found) { side(D, la, v3); yT[D] = Math.max(Math.abs(v3[0]), Math.abs(v3[2])) < 65 ? 0 : NaN; oT[D] = D > 0 ? oT[D - 1] : 0; }
          if (D % 140 === 139) await ctx.yield();
        }
        await ctx.yield();
        for (let pass = 0; pass < 4; pass++) { let prev = oT[0]; for (let D = 1; D < DMAX; D++) { const cur = oT[D]; oT[D] = (prev + cur * 2 + oT[D + 1]) / 4; prev = cur; } }
        for (let D = 0; D <= DMAX + 1; D++) {
          const q = Math.min(D, DMAX); side(q, latAt(q) + oT[q], v3); xT[D] = v3[0]; zT[D] = v3[2];
          hT[D] = Math.atan2(tmpT.x, tmpT.z) + (q > 386 && q < 446 ? Math.sign(tgt) * 0.5 * Math.sin(Math.PI * (q - 386) / 60) : 0);
          if (D % 180 === 179) await ctx.yield();
        }
        if (Number.isNaN(yT[0])) yT[0] = ground(side(0, lat, v3)[0], v3[2]) + 8;
        for (let D = 1; D <= DMAX; D++) {
          if (!Number.isNaN(yT[D])) continue;
          let e = D; while (e <= DMAX && Number.isNaN(yT[e])) e++;
          const y0 = yT[D - 1], y1 = e <= DMAX ? yT[e] : y0, len = e - D + 1;
          for (let q = D; q < e; q++) { const t = (q - D + 1) / len; yT[q] = mix(y0, y1, t) + 4 * t * (1 - t) * (0.5 + 0.13 * Math.min(len, 9)); aT[q] = 1; }
          D = e;
        }
        for (let D = 3; D < DMAX; D++) {                            // an upward step is a leap, not a climb up the wall
          const up = yT[D + 1] - yT[D]; if (up < 1.2 || aT[D] > 0.5 || aT[D + 1] > 0.5) continue;
          const y0 = yT[D - 3], y1 = yT[D + 1];
          for (let q = D - 2; q <= D; q++) { const t = (q - (D - 3)) / 4; yT[q] = Math.max(yT[q], mix(y0, y1, t) + 4 * t * (1 - t) * (0.5 + 0.22 * up)); aT[q] = 1; }
          D += 1;
        }
        for (let D = 1; D <= DMAX; D++) if (yT[D] < yT[D - 1] - 2.4) { yT[D] = yT[D - 1] - 2.4; aT[D] = 1; }
        for (let D = DMAX - 1; D >= 0; D--) if (yT[D] < yT[D + 1] - 1.6) { yT[D] = yT[D + 1] - 1.6; aT[D] = Math.max(aT[D], 0.6); }
        for (let pass = 0; pass < 2; pass++) { let prev = yT[0]; for (let D = 1; D < DMAX; D++) { const cur = yT[D]; yT[D] = (prev + cur * 2 + yT[D + 1]) / 4; prev = cur; } }
        for (let pass = 0; pass < 2; pass++) { let prev = aT[0]; for (let D = 1; D < DMAX; D++) { const cur = aT[D]; aT[D] = (prev + cur * 2 + aT[D + 1]) / 4; prev = cur; } }
        const infant = k % 5 === 2 && k < 15 ? 1 : 0, pink = k === 3 || k === 8;
        lang.push({ lead, lat, tgt, yT, aT, xT, zT, hT, seed: lr.range(0, 6), size: (infant ? 1.38 : lr.range(1.1, 1.36)), infant, stop: L - 5 - lr.range(0, 16) });
        langMesh.setColorAt(k, pink ? cc.setRGB(2.7, 0.8, 1.6) : (k === 5 && !night ? cc.setRGB(2.6, 1.8, 0.8) : cc.setRGB(1, 1, 1)));
        await ctx.yield();
      }
      langMesh.instanceColor.needsUpdate = true;
    }
    const LM = new THREE.Matrix4(), LQ = new THREE.Quaternion(), LE = new THREE.Euler(0, 0, 0, 'YXZ'), LP = new THREE.Vector3(), LS = new THREE.Vector3();
    // While the world is only seen through the previous portal (u exactly 0) the troop sits on the nearest roof to its place and
    // fidgets; it sets off over the first few metres of the flight.
    for (const g of lang) { let D = Math.round(g.lead + 2.2 * Math.sin(g.seed)); while (D > 1 && g.aT[D] > 0.04) D--; g.idleD = D; }
    const updateTroop = (s, u, time) => {
      const idle = u > 0 ? 0 : 1, go = sstep(0, 7, s);
      for (let k = 0; k < troopN; k++) {
        const g = lang[k];
        const D = Math.min(g.stop, Math.max(0, mix(g.idleD, s + g.lead + 2.2 * Math.sin(s * 0.021 + g.seed), go)));
        const i0 = Math.min(DMAX - 1, Math.floor(D)), f = D - i0, y = mix(g.yT[i0], g.yT[i0 + 1], f) + idle * 0.02 * Math.sin(time * 2.3 + g.seed * 5), air = (1 - idle) * mix(g.aT[i0], g.aT[i0 + 1], f);
        const slope = g.yT[i0 + 1] - g.yT[i0];
        v3[0] = mix(g.xT[i0], g.xT[i0 + 1], f); v3[2] = mix(g.zT[i0], g.zT[i0 + 1], f);
        const yaw = mix(g.hT[i0], g.hT[i0 + 1], f);
        LE.set(-Math.atan(Math.max(-1.2, Math.min(1.2, slope))) * 0.8, yaw, 0);
        LM.compose(LP.set(v3[0], y, v3[2]), LQ.setFromEuler(LE), LS.set(g.size, g.size, g.size)); langMesh.setMatrixAt(k, LM);
        iAnim[k * 4] = idle ? g.seed + 0.25 * Math.sin(time * 1.7 + g.seed) : D * (TAU / 1.9) + g.seed; iAnim[k * 4 + 1] = Math.min(1, air * 1.3); iAnim[k * 4 + 2] = g.seed; iAnim[k * 4 + 3] = g.infant;
        const sh = (1 - Math.min(1, air * 2.2)) * g.size;
        LE.set(0, yaw, 0); LM.compose(LP.set(v3[0] - SUN.x * 0.25, y + 0.03, v3[2] - SUN.z * 0.25), LQ.setFromEuler(LE), LS.set(sh * 0.8, 1, sh * 1.25)); blobMesh.setMatrixAt(k, LM);
      }
      langMesh.instanceMatrix.needsUpdate = true; blobMesh.instanceMatrix.needsUpdate = true; iAnimAttr.needsUpdate = true;
    };
    await ctx.yield();

    // ---- people in the lanes as powder-dusted specks; scooters, cows, arcs of thrown water ----
    {
      const sr2 = rng.fork('specks'), NS = Math.round(2500 * detail * Math.min(1.2, density)), iP = new Float32Array(NS * 4), iD = new Float32Array(NS * 4), iC = new Float32Array(NS * 4);
      const nearPl = plumes.filter((p) => path.nearestXZ(p.x, p.z).dist < 140);
      const laneSnap = (x, z, horiz) => { const k = sstep(90, 220, Math.hypot(x, z)) * 6.5, ox = k * noise.n2(x * 0.0045, z * 0.0045), oz = k * noise.n2(x * 0.0045 + 40, z * 0.0045 - 17); let ux = x - ox, uz = z - oz; if (horiz) uz = (Math.round(uz / PITCH - 0.5) + 0.5) * PITCH; else ux = (Math.round(ux / PITCH - 0.5) + 0.5) * PITCH; w2[0] = ux + ox; w2[1] = uz + oz; };
      let n = 0;
      for (let tries = 0; n < NS && tries < NS * 8; tries++) {
        if (tries % 150 === 149) await ctx.yield();
        const roll = sr2(), ph = sr2.range(0, 40); let x, z, dx = 1, dz = 0, amp = 1.5, spd = sr2.range(0.6, 1.6), kind = 0, c;
        const tint = () => { const pc = powCols[sr2.int(0, nCol - 1)]; return mixc(sr2() < 0.7 ? [0.82, 0.82, 0.8] : [0.5, 0.6, 0.85], [pc.r, pc.g, pc.b], night ? 0.1 : sr2.range(0.45, 0.95)); };
        if (roll < 0.34 && nearPl.length) {
          const p = sr2.pick(nearPl), a = sr2.range(0, TAU), r = 1.2 + Math.abs(sr2.gauss()) * 3.2; dx = Math.cos(a); dz = Math.sin(a); x = p.x + dx * r; z = p.z + dz * r; amp = sr2.range(0.6, 1.8); spd = sr2.range(1, 2.4);
          const pc = powCols[p.color]; c = mixc([0.82, 0.82, 0.8], [pc.r, pc.g, pc.b], night ? 0.1 : sr2.range(0.45, 0.95));
        } else {
          const horiz = sr2() < 0.5; side(sr2.range(-10, 400), sr2.range(-80, 80), v3); laneSnap(v3[0], v3[2], horiz); x = w2[0]; z = w2[1]; dx = horiz ? 1 : 0; dz = horiz ? 0 : 1; c = tint();
          if (roll > 0.985) { kind = 1; amp = sr2.range(8, 18); spd = sr2.range(3, 6); c = [0.05, 0.05, 0.06]; } else if (roll > 0.975) { kind = 2; c = sr2() < 0.5 ? [0.75, 0.72, 0.66] : [0.4, 0.28, 0.18]; }
          else if (roll > 0.95) { kind = 3; amp = sr2.range(3, 5); c = [0.75, 0.88, 1.0]; }
        }
        if (roofAt(x, z).i >= 0 || Math.max(Math.abs(x), Math.abs(z)) < 68) continue;
        { const pn = path.nearestXZ(x, z), sp = pn.u * L; if (pn.dist < 8 && sp > LANE0 && sp < LANE1) continue; }   // the lane has real figures
        const reps = kind === 3 ? Math.min(9, NS - n) : 1, gy = ground(x, z);
        for (let q = 0; q < reps; q++, n++) { iP.set([x, gy, z, kind === 3 ? ph + q / 9 : ph], n * 4); iD.set([dx, dz, amp, spd], n * 4); iC.set([c[0], c[1], c[2], kind], n * 4); }
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iD', new THREE.InstancedBufferAttribute(iD, 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4)); g.instanceCount = n;
      const mat = new THREE.ShaderMaterial({
        fog: true, uniforms: { ...fx.fogUniforms(), uTime: HU.uTime, uAmb: { value: new THREE.Vector3(look.amb[0], look.amb[1], look.amb[2]) } },
        vertexShader: /* glsl */`
          attribute vec4 iP, iD, iC; uniform float uTime; varying vec2 vUv; varying vec4 vC;
          #include <fog_pars_vertex>
          void main(){
            vec3 c = iP.xyz; float ph = iP.w, kind = iC.w; vec2 sz = vec2(.3, .85);
            if (kind < .5) { c.xz += iD.xy * iD.z * sin(uTime * iD.w + ph) + vec2(sin(uTime * 1.3 + ph * 7.), cos(uTime * 1.1 + ph * 5.)) * .35; c.y += abs(sin(uTime * (2.4 + fract(ph) * 2.) + ph)) * .22; }
            else if (kind < 1.5) { float tri = abs(fract(uTime * iD.w * .03 + ph) * 2. - 1.); c.xz += iD.xy * iD.z * (tri * 2. - 1.); sz = vec2(.75, .55); }
            else if (kind < 2.5) { sz = vec2(.95, .62); c.xz += iD.xy * sin(uTime * .25 + ph) * .5; }
            else { float t = fract(uTime * .8 + ph); c.xz += iD.xy * t * iD.z; c.y += 1.2 + 4.4 * t - 5.6 * t * t; sz = vec2(.1 + .12 * t); }
            vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
            vec3 wp = c + cr * position.x * sz.x + vec3(0., (position.y + 1.) * sz.y, 0.);
            vUv = position.xy; vC = iC;
            vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uAmb; varying vec2 vUv; varying vec4 vC;
          #include <fog_pars_fragment>
          void main(){
            float head = step(length(vUv - vec2(0., .7)), .3), body = step(abs(vUv.x), .5 - .22 * vUv.y) * step(vUv.y, .44) * step(.09 * step(vUv.y, -.3), abs(vUv.x));
            if (vC.w < .5 ? head + body < .5 : dot(vUv, vUv) > 1.) discard;
            vec3 c = vC.rgb * (vC.w < .5 && head > .5 && vUv.y > .72 ? .3 : 1.);
            if (vC.w < .5) c *= mix(.55, 1., smoothstep(-1., -.1, vUv.y));
            gl_FragColor = vec4(max(c * uAmb * (vC.w < .5 ? .9 + .3 * vUv.y : 1.4 + .4 * vUv.y), 0.) + (vC.w > 2.5 ? vec3(.25, .3, .36) : vec3(0.)), 1.);
            #include <fog_fragment>
          }`,
      });
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- the peacock on the haveli's parapet: train hung down the wall, then it drops off and flaps heavily away to the right ----
    const peacock = new THREE.Group(), peaPerch = new THREE.Vector3(), peaRight = new THREE.Vector3(), peaFwd = new THREE.Vector3(), peaTail = new THREE.Vector3();
    let peaWingL, peaWingR, peaTrain;
    {
      const hb = H.find((h) => h.bal);
      const G = makeGeo(900), blue = [0.02, 0.12, 0.62], teal = [0.02, 0.36, 0.36], grn = [0.05, 0.36, 0.12], gold = [0.78, 0.56, 0.08], brown = [0.33, 0.22, 0.13], buff = [0.72, 0.66, 0.56];
      G.a0 = 6; G.a1 = 0;
      G.box(0, 0.4, 0, 0.36, 0.34, 0.7, blue, { t: 0.7, g: 0.6 });
      G.cyl(0, 0.62, 0.28, 0.1, 0.055, 0.5, 6, blue, null, 0.8); G.cyl(0, 1.12, 0.28, 0.075, 0.045, 0.12, 5, blue, blue);
      G.tri([-0.03, 1.16, 0.3], [0.03, 1.16, 0.3], [0, 1.14, 0.42], [0.5, 0.45, 0.3], true);
      for (let k = -1; k <= 1; k++) G.tri([k * 0.03 - 0.012, 1.22, 0.25], [k * 0.03 + 0.012, 1.22, 0.25], [k * 0.05, 1.36, 0.22], teal, true);
      for (const sx of [-1, 1]) G.box(sx * 0.07, 0, 0.02, 0.03, 0.44, 0.03, [0.4, 0.34, 0.26]);
      peacock.add(new THREE.Mesh(G.build(), cityMat));
      // the train is its own mesh, hinged at the rump: it hangs when perched and streams in flight. A flat fan plus an upright keel of
      // plumes, so it has body from the side as well as from above; every plume ends in a gold eye with a blue heart
      const TG = makeGeo(2400); TG.a0 = 6; TG.a1 = 0;
      const lime = [0.2, 0.44, 0.1];
      const plume = (a, vert, len, yo, k) => {
        const sa = Math.sin(a), ca = Math.cos(a), W = vert ? [0, 1, 0] : [ca, 0, sa], Nn = vert ? [1, 0, 0] : [0, 1, 0];
        const P = (t) => (vert ? [0, yo + sa * len * t - 0.2 * t * t, -ca * len * t] : [sa * (0.06 + len * t), yo - 0.2 * t * t - 0.7 * sa * sa * len * t, -ca * len * t]);
        const off = (p, w, n = 0) => [p[0] + W[0] * w + Nn[0] * n, p[1] + W[1] * w + Nn[1] * n, p[2] + W[2] * w + Nn[2] * n];
        let p0 = P(0); const cA = k % 2 ? grn : lime;
        for (let j = 0; j < 3; j++) {
          const p1 = P((j + 1) / 3), w0 = 0.04 + 0.04 * j, w1 = 0.04 + 0.04 * (j + 1);
          TG.quad(off(p0, -w0), off(p0, w0), off(p1, w1), off(p1, -w1), j === 0 ? teal : cA, j === 2 ? mul(cA, 1.3) : cA, true);
          p0 = p1;
        }
        const e = 0.1, q = (w, dz, n) => { const o = off(p0, w, n); return [o[0], o[1], o[2] + dz]; };
        TG.quad(q(-e, e * 1.2, 0.006), q(e, e * 1.2, 0.006), q(e, -e * 0.8, 0.006), q(-e, -e * 0.8, 0.006), gold, gold, true);
        TG.quad(q(-e * 0.5, e * 0.7, 0.014), q(e * 0.5, e * 0.7, 0.014), q(e * 0.5, -e * 0.3, 0.014), q(-e * 0.5, -e * 0.3, 0.014), blue, blue, true);
        TG.quad(q(-e * 0.5, e * 0.7, -0.004), q(e * 0.5, e * 0.7, -0.004), q(e * 0.5, -e * 0.3, -0.004), q(-e * 0.5, -e * 0.3, -0.004), blue, blue, true);
      };
      for (let k = 0; k < 11; k++) plume((k - 5) * 0.046, false, 1.25 - Math.abs(k - 5) * 0.04, 0, k);
      for (let k = 0; k < 7; k++) plume((k - 3) * 0.06, false, 0.8 - Math.abs(k - 3) * 0.04, 0.04, k + 1);
      for (let k = 0; k < 5; k++) plume(-0.26 + k * 0.085, true, 1.2 - Math.abs(k - 2.5) * 0.05, 0.02, k);
      peaTrain = new THREE.Mesh(TG.build(), cityMat); peaTrain.position.set(0, 0.64, -0.27); peacock.add(peaTrain);
      const wing = (sx) => {
        const Wg = makeGeo(96); Wg.a0 = 6;
        const rust = [0.62, 0.3, 0.12];
        Wg.quad([0, 0.05, 0.32], [sx * 0.8, 0.08, 0.26], [sx * 0.8, 0, -0.1], [0, 0, -0.14], brown, buff, true);
        Wg.quad([sx * 0.8, 0.08, 0.26], [sx * 1.3, 0.03, 0.08], [sx * 1.22, -0.03, -0.2], [sx * 0.8, 0, -0.1], buff, rust, true);
        Wg.quad([0, 0, -0.14], [sx * 0.8, 0, -0.1], [sx * 0.78, -0.16, -0.5], [0, -0.12, -0.46], buff, brown, true);
        Wg.quad([sx * 0.8, 0, -0.1], [sx * 1.22, -0.03, -0.2], [sx * 1.1, -0.16, -0.52], [sx * 0.78, -0.16, -0.5], rust, brown, true);
        const m = new THREE.Mesh(Wg.build(), cityMat); m.position.set(sx * 0.14, 0.68, 0.02); return m;
      };
      peaWingL = wing(-1); peaWingR = wing(1); peacock.add(peaWingL, peaWingR); peacock.scale.setScalar(2.1);
      peacock.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
      path.tangentAtDist(balconyS, peaFwd); peaFwd.y = 0; peaFwd.normalize(); peaRight.set(-peaFwd.z, 0, peaFwd.x);
      path.posAtDist(balconyS - 9, tmpP);
      if (hb) {
        // the parapet that faces the route; stand clear of the corner kiosks, as near the approaching camera as that allows
        const kd = balDiag(hb), cr = Math.cos(hb.r), sr = Math.sin(hb.r), W = (lx, lz) => [hb.x + lx * cr + lz * sr, hb.z - lx * sr + lz * cr];
        path.posAtDist(balconyS - 9, tmpP);
        let best = null, bd = 1e9;
        for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const wn = [nx * cr + nz * sr, -nx * sr + nz * cr]; if (wn[0] * -peaRight.x + wn[1] * -peaRight.z < 0.6) continue;
          const half = nx ? hb.d / 2 : hb.w / 2;
          for (let t = -half + 0.3; t <= half - 0.3; t += 0.4) {
            const lx = nx ? nx * (hb.w / 2 - 0.11) : t, lz = nz ? nz * (hb.d / 2 - 0.11) : t;
            if (lx * lz * kd > 0 && Math.abs(lx) > hb.w / 2 - 3.1 && Math.abs(lz) > hb.d / 2 - 3.1) continue;
            const q = W(lx, lz), d = Math.hypot(q[0] - tmpP.x, q[1] - tmpP.z);
            if (d < bd) { bd = d; best = [q[0], q[1], wn[0], wn[1]]; }
          }
        }
        if (best) { peaPerch.set(best[0], hb.top + 0.9, best[1]); peaTail.set(best[2], 0, best[3]).addScaledVector(peaFwd, -0.45).normalize(); }
      }
      if (peaTail.lengthSq() < 0.5) { side(balconyS - 4, 6.2, v3); peaPerch.set(v3[0], v3[1] + 3.5, v3[2]); peaTail.copy(peaRight).multiplyScalar(-1).addScaledVector(peaFwd, -0.45).normalize(); }
      scene.add(peacock);
    }
    const peaStart = balconyS - 22, peaY0 = Math.atan2(-peaTail.x, -peaTail.z), peaY1 = Math.atan2(peaRight.x + peaFwd.x * 0.6, peaRight.z + peaFwd.z * 0.6);
    const peaTurn = Math.atan2(Math.sin(peaY1 - peaY0), Math.cos(peaY1 - peaY0));
    const updatePeacock = (s, time) => {
      const t = sat((s - peaStart) / 58), fly = sstep(0, 0.07, t), flap = Math.sin(time * 7.5);
      peacock.visible = t < 0.999;
      peacock.position.copy(peaPerch).addScaledVector(peaRight, 28 * sstep(0.3, 1, t) - 2.2 * Math.sin(Math.PI * Math.min(1, t / 0.25))).addScaledVector(peaFwd, t * 84);
      peacock.position.y += 0.6 * sstep(0, 0.04, t) - 6.2 * sstep(0.02, 0.2, t) + 3.4 * sstep(0.45, 1, t) + fly * 0.3 * flap;
      peacock.rotation.set(fly * 0.1, peaY0 + peaTurn * sstep(0, 0.1, t) + (1 - fly) * 0.18 * Math.sin(time * 0.7), -0.3 * sstep(0.02, 0.12, t) * (1 - sstep(0.3, 0.6, t)));
      peaWingL.rotation.z = mix(1.35, 0.05 - 0.6 * flap, fly); peaWingR.rotation.z = -peaWingL.rotation.z;
      peaTrain.rotation.x = mix(-1.08, -0.3, sstep(0, 0.1, t)) + 0.05 * Math.sin(time * 1.3) * (1 - fly) + fly * 0.07 * flap;
    };

    // ---- birds: four flocks of pigeons that burst as the troop arrives, parakeets, black kites over the cliff ----
    await ctx.yield();
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    const pigeon = { body: '#878e9b', belly: '#a7adb8', wingC: '#6d7482', tip: '#262a34', head: '#4f6072', tailC: '#59606c', beak: '#3a3a3a' };
    // (flock cure 1) every flock that can come near the flown line keeps 2.0 m of clear air from it, BY PLACE, bird by bird: its course stays
    // where it is laid, a bird whose own reach comes within 2 m of the line is moved by what it alone lacks (the kit's keepClear with each), the
    // deal is held at three scatters, and each has a small wander of its own written out so that the lane it leaves about the line stays narrow
    const clearOf = (from, to) => ({ path, dist: 2, each: true, from: Math.max(0, from), to: Math.min(1, to), step: 2 });
    {
      const flocks = [[18, 1, 4.5, 58, 20], [150, -1, 7.5, 75, 30], [240, 1, 6.5, 70, 30], [338, -1, 9, 80, 30]], CF = [[0, 0.16], [0.27, 0.48], [0.38, 0.6], [0.63, 0.84]];   // (CF: the stretch of the route each crossing's course comes within 45 m of)
      for (let i = 0; i < flocks.length; i++) {
        const [s, sd, hgt, ang, lead] = flocks[i];
        fauna.add(F.makeFlock({ rng: rng.fork('pigeons' + i), species: 'crows', lod: 'low', count: Math.round(64 * detail * Math.min(1.2, density)), size: 0.66, speed: 13, spread: [16, 5, 26], wander: [0.6, 0.4, 0.8, 0.4], maxSigma: 3, keepClear: clearOf(CF[i][0], CF[i][1]), ...pigeon,
          cross: { path, u: s / L, lead, angle: ang, side: sd, height: hgt, span: 240, rise: 14, duration } }));
        await ctx.yield();
      }
    }
    fauna.add(F.makeFlock({ rng: rng.fork('parakeets'), species: 'parrots', count: 14, size: 0.72, speed: 17, body: '#3fae3a', belly: '#8fd24a', wingC: '#2f9a3a', tip: '#1c5a8a', head: '#4fc04a', tailC: '#2f8a5a', wander: [2, 1.2, 2, 0.6], maxSigma: 3,
      cross: { path, u: 262 / L, lead: 46, angle: 84, side: -1, height: 13, span: 330, duration } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('kites'), species: 'eagles', count: 3, size: 1.5, center: [40, 196, -400], radius: 120, body: '#2a2019', belly: '#3a2c22', wingC: '#241b15', tip: '#120e0b', head: '#3a2e24', tailC: '#2a2019' }), { always: true });
    // Four flocks of pigeons and a screech of parakeets wheel over the roofs, each round a plume of the town that stands 62 to 110 m
    // from the route: the near edge of the ground the paper kites hung over, to one rank's spacing from the route (a pigeon is 0.66 m
    // across and is lost to the eye at some 150 to 200 m; the loop itself reaches 55 to 85 m farther out, and as far back over the
    // roofs the route runs on), and south of the gate's wall (24 to 29 m of stone: a flight 13 to 20 m over the roofs behind it is
    // hidden from the whole town). The first plume is drawn by chance and each next one is the plume farthest from those taken, so
    // the five keep as far apart as the town allows. A loop follows the lie of the roofs, as pigeons do: at each of its twelve
    // points it keeps 13 to 20 m (drawn once for the flock) over the highest roof under the flock's width from half-way to the point
    // before to half-way to the point after, with a swell of up to 5 m twice a lap: clear of the stair hutches, tanks and bunting
    // poles (to 6 m over a roof); and 6 m over the top of a temple spire, the clock tower or a gate kiosk it passes within 34 m of.
    // A flock is 70 birds (the design's 280 in four flocks) and keeps the shape of the town's other pigeon flocks (16 m across,
    // 26 m long): a pigeon is 0.66 m across, and strung out round a lap of 350 to 530 m the seventy read as dust, bunched they
    // read as a flock from as far as the eye can pick out a bird. They fly on the world's clock from a start drawn by each
    // flock's own stream, which also draws its loop's shape and which way round it flies.
    {
      const ws = ctx.core.makeRng(ctx.core.hashSeed('holi-wheel-sites:' + ctx.seed)), sites = [];
      const A = hero.anchors, band = plumes.filter((q) => !q.route && !q.onRoof).concat(rankPlumes).filter((q) => { const d = path.nearestXZ(q.x, q.z).dist; return d >= 62 && d <= 110 && q.z > A.gateCenter.z; });
      if (band.length) sites.push(ws.pick(band));
      while (sites.length < Math.min(5, band.length)) {
        let best = null, bd = -1;
        for (const p of band) { let d = 1e9; for (const q of sites) d = Math.min(d, Math.hypot(q.x - p.x, q.z - p.z)); if (d > bd) { bd = d; best = p; } }
        sites.push(best);
      }
      ws.shuffle(sites);                                              // which of the five places the parakeets take is drawn too
      const tall = [[A.clockTower.x, A.clockTower.z, 7, A.clockTower.y]];   // the tall things: x, z, half width, top
      for (const k of A.kiosks) tall.push([k.x, k.z, 9, k.y]);
      for (const t of temples) tall.push([t[0], t[2], 4, t[1] + 4.7]);
      const lineAt = (x, z) => (roofAt(x, z).i >= 0 ? H[hit.i].top : ground(x, z) + 8.6);   // the roofline at a point: the roof there, or the lane's roofline
      for (let i = 0; i < sites.length; i++) {
        const p = sites[i], R = ws.range(55, 85), clr = ws.range(13, 20), N = 12, pts = [];
        const fr = ctx.core.makeRng(ctx.core.hashSeed((i < 4 ? 'holi-wheel-pigeons' + i : 'holi-wheel-parakeets') + ':' + ctx.seed));
        const a0 = fr.range(0, TAU), dir = fr.sign(), ell = fr.range(0.7, 1), rot = fr.range(0, TAU), ph = fr.range(0, TAU), cr = Math.cos(rot), sr = Math.sin(rot);
        for (let k = 0; k < N; k++) { const a = a0 + dir * (k / N) * TAU, r = R * fr.range(0.84, 1.16), lx = Math.cos(a) * r, lz = Math.sin(a) * r * ell; pts.push([p.x + lx * cr - lz * sr, 0, p.z + lx * sr + lz * cr, a]); }
        for (let k = 0; k < N; k++) {
          const c = pts[k]; let top = -1e9;
          for (const j of [-1, 1]) for (const t of [0, 0.25, 0.5]) for (const w of [-16, 0, 16]) {
            const q = pts[(k + j + N) % N], x = c[0] + (q[0] - c[0]) * t, z = c[2] + (q[2] - c[2]) * t, d = Math.hypot(x - p.x, z - p.z) || 1;
            top = Math.max(top, lineAt(x + ((x - p.x) / d) * w, z + ((z - p.z) / d) * w));
          }
          c[1] = top + clr + 2.5 * (1 + Math.sin(c[3] * 2 + ph));
          for (const T of tall) if (Math.hypot(c[0] - T[0], c[2] - T[1]) < T[2] + 34) c[1] = Math.max(c[1], T[3] + 6);
        }
        const route = pts.map((c) => new THREE.Vector3(c[0], c[1], c[2]));
        // (flock cure 1) the stretch of the flown line this loop comes within 60 m of in plan (or, if it never does, the place it comes nearest), and 0.05 of the route to either end of it: there its birds are cleared
        let u0 = 2, u1 = -1, un = 0, dn = 1e9; for (let k = 0; k < N; k++) for (let t = 0; t < 1; t += 0.125) { const q = pts[(k + 1) % N], n = path.nearestXZ(pts[k][0] + (q[0] - pts[k][0]) * t, pts[k][2] + (q[2] - pts[k][2]) * t); if (n.dist < dn) { dn = n.dist; un = n.u; } if (n.dist < 60) { u0 = Math.min(u0, n.u); u1 = Math.max(u1, n.u); } }
        if (u1 < u0) u0 = u1 = un;
        const near = { keepClear: clearOf(u0 - 0.05, u1 + 0.05) };
        await ctx.yield();
        if (i < 4) fauna.add(F.makeFlock({ rng: fr, species: 'crows', lod: 'low', count: Math.round(70 * detail * Math.min(1.2, density)), size: 0.66, speed: 13, spread: [16, 5, 26], wander: [1.2, 0.8, 1.6, 0.4], maxSigma: 3, ...near, ...pigeon, route }));
        else fauna.add(F.makeFlock({ rng: fr, species: 'parrots', count: 14, size: 0.72, speed: 17, body: '#3fae3a', belly: '#8fd24a', wingC: '#2f9a3a', tip: '#1c5a8a', head: '#4fc04a', tailC: '#2f8a5a', wander: [1.2, 0.8, 1.6, 0.6], maxSigma: 3, ...near, route }));
        await ctx.yield();
      }
    }

    // ---- air: settling powder (sparks at night), petals round the temples, lamps and bonfires, the wedding band, the dust devil ----
    const set = fx.fxGroup(); scene.add(set.object);
    const windV = HU.uWind.value;
    let airDust = null;
    if (night) set.add(fx.makeParticles({ rng: rng.fork('air'), preset: 'embers', count: Math.round(1300 * detail), time: HU.uTime }));
    else set.add(airDust = fx.makeParticles({ rng: rng.fork('air'), preset: 'dust', count: Math.round(4200 * detail * density), box: [44, 26, 44], size: [0.04, 0.13], colors: [powCols[0], powCols[1], powCols[2]],
      velocity: [windV.x * 0.9, -0.42, windV.z * 0.9], time: HU.uTime }));
    await ctx.yield();
    if (petals) for (const t of temples) set.add(fx.makeParticles({ rng: rng.fork('petals'), preset: 'petals', follow: false, center: t, box: [28, 18, 28], count: Math.round(240 * detail), colors: ['#ff9a1e', '#e8457a', '#ffd24a'], time: HU.uTime }));
    if (night) {
      if (lampPts.length) set.add(fx.makeGlows({ rng: rng.fork('lamps'), positions: lampPts, color: '#ffb050', size: 0.6, intensity: 2.4, flicker: 0.5, time: HU.uTime }));
      const fires = plumes.filter((p) => !p.onRoof && path.nearestXZ(p.x, p.z).dist < 170).map((p) => [p.x, p.y + 1.6, p.z]);
      for (const f of hero.anchors.plumeFeet) if (f.square) fires.push([f.position.x, 1.5, f.position.z]);
      for (const p of rankPlumes) if (p.pd < 170) fires.push([p.x, p.y + 1.6, p.z]);
      set.add(fx.makeGlows({ rng: rng.fork('fires'), positions: fires.map((f) => [f[0], f[1] - 0.5, f[2]]), color: '#ff7420', size: 3, intensity: 3, flicker: 0.8, time: HU.uTime }));
      // the bonfires themselves: stacked logs, and flames as one instanced draw of upright billboards (five tongues a fire)
      const FG = makeGeo(fires.length * 100), fr2 = ctx.core.makeRng(((ctx.seed >>> 0) ^ 0x7f1e5) >>> 0);
      const NF = fires.length * 5, iF = new Float32Array(NF * 4), iS = new Float32Array(NF * 4); let nf = 0;
      for (const f of fires) {
        const y0 = f[1] - 1.5, sc = fr2.range(0.85, 1.25);
        FG.frame(f[0], y0, f[2], fr2.range(0, TAU)); FG.a0 = 0; FG.a1 = 0;
        for (let k = 0; k < 3; k++) FG.box(0, 0.02 + k * 0.16, 0, 1.7 * sc, 0.18, 0.2, [0.05, 0.03, 0.02], { r: k * 1.05 });
        for (let k = 0; k < 5; k++, nf++) {
          const a = fr2.range(0, TAU), r = k ? fr2.range(0.25, 0.6) * sc : 0, hk = k ? fr2.range(0.45, 0.8) : 1;
          iF.set([f[0] + Math.sin(a) * r, y0 + 0.12, f[2] + Math.cos(a) * r, fr2.range(0, 20)], nf * 4);
          iS.set([(k ? 0.68 : 1.1) * sc * fr2.range(0.85, 1.15), 3.1 * sc * hk, fr2.range(0.8, 1.3), k ? 1 : 1.25], nf * 4);
        }
      }
      const fgeo = new THREE.InstancedBufferGeometry();
      fgeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); fgeo.setIndex([0, 1, 2, 0, 2, 3]);
      fgeo.setAttribute('iF', new THREE.InstancedBufferAttribute(iF, 4)); fgeo.setAttribute('iS', new THREE.InstancedBufferAttribute(iS, 4)); fgeo.instanceCount = nf;
      const fmat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: HU.uTime },
        vertexShader: /* glsl */`
          attribute vec4 iF, iS; uniform float uTime; varying vec2 vUv; varying vec2 vPh;
          void main(){
            vec3 cr = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0]) + vec3(1e-5, 0., 0.));
            float y = position.y, sway = sin(uTime * 3.1 * iS.z + iF.w * 5. + y * 2.) * .1 + sin(uTime * 5.3 + iF.w * 9.) * .05;
            vec3 wp = iF.xyz + cr * (position.x * iS.x + sway * y * y * iS.y) + vec3(0., y * iS.y, 0.);
            vUv = vec2(position.x, y); vPh = vec2(iF.w, iS.w);
            gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
          }`,
        fragmentShader: GLSL_N + /* glsl */`
          uniform float uTime; varying vec2 vUv; varying vec2 vPh;
          void main(){
            float x = vUv.x, y = clamp(vUv.y, 0., 1.);
            float f = fb2(vec2(x * 1.7 + vPh.x * 13., y * 2.6 - uTime * 2.6 - vPh.x * 7.));
            float wd = pow(1. - y, .75) * (.5 + .5 * smoothstep(0., .22, y));
            float core = 1. - abs(x + (f - .5) * .5 * y) / max(wd, .04);
            float a = smoothstep(.02, .6, core * (.5 + 1.1 * f) - y * .22) * smoothstep(0., .05, y);
            vec3 col = mix(vec3(1., .17, .02), vec3(1., .6, .13), a * a) * 1.2 * a * vPh.y;
            gl_FragColor = vec4(max(col, 0.), 1.);
          }`,
      });
      const flames = new THREE.Mesh(fgeo, fmat); flames.frustumCulled = false; flames.renderOrder = 3; scene.add(flames);
      const fm = new THREE.Mesh(FG.build(), cityMat); fm.frustumCulled = false; scene.add(fm);
    }
    await ctx.yield();
    let band = null;
    if (wedding) {
      const G = makeGeo(600); G.a0 = 6; G.a1 = 0;
      G.cyl(0, 2.25, 0, 1.0, 0.04, 0.5, 8, [1, 1, 1]); G.a0 = 2; G.cyl(0, 2.75, 0, 0.06, 0.01, 0.25, 4, K.brass); G.a0 = 0; G.box(0, 0, 0, 0.05, 2.3, 0.05, K.bamboo); G.box(0, 0, 0.1, 0.4, 1.6, 0.3, mul(K.white, 0.9), { t: 0.7 });
      band = new THREE.InstancedMesh(G.build(), cityMat, 14); band.frustumCulled = false; band.castShadow = true;
      const cc = new THREE.Color(), cols = [[0.75, 0.06, 0.08], [0.9, 0.6, 0.1], [0.75, 0.06, 0.08], [0.85, 0.85, 0.82], [0.6, 0.05, 0.3]];
      for (let k = 0; k < 14; k++) { const c = cols[k % cols.length]; band.setColorAt(k, cc.setRGB(c[0], c[1], c[2])); }
      band.instanceColor.needsUpdate = true; scene.add(band);
    }
    const bandZ = -10 - (rng.range(18, 34) - 18) * 1.25, BM = new THREE.Matrix4();
    const devil = rare ? fx.makeDustDevil({ rng: rng.fork('devil'), time: HU.uTime, position: [-52, 0, 30], height: 80, radius: [2.4, 12], color: PALETTE[4], colorTop: PALETTE[6], shadowColor: '#b85a12', opacity: 0.75,
      count: 140, size: [4, 14], debris: 260, sunDir: SUN }) : null;
    if (devil) scene.add(devil.object);

    // ---- passing a cloud: the haze takes a breath of its colour and the settling motes turn to it and swell; nothing veils the city ----
    const tintC = new THREE.Color(), moteC = new THREE.Color(), tintClouds = hero.anchors.tintClouds, fogLuma = 0.2126 * fogBase.r + 0.7152 * fogBase.g + 0.0722 * fogBase.b;
    const camP = new THREE.Vector3(), airSize = airDust ? airDust.uniforms.uSize.value.clone() : null;
    const airCols = airDust ? ['uColorA', 'uColorB', 'uColorC'].map((k) => ({ u: airDust.uniforms[k].value, base: airDust.uniforms[k].value.clone() })) : [];
    const updateTint = (s, camera, u) => {
      camera.getWorldPosition(camP);
      let W = 0, r = 0, g = 0, b = 0;
      for (let i = 0; i < 3; i++) {
        const c = routeClouds[i], ds = s - c.s, w = sstep(-27, -9, ds) * (1 - sstep(4, 24, ds)); if (w <= 0) continue;
        const pc = powCols[c.col]; W += w; r += pc.r * w; g += pc.g * w; b += pc.b * w;
      }
      const Wr = Math.min(1, W), er = HU.uErupt.value * (1 - 0.75 * HU.uPart.value) * (u > 0 ? 1 : 0);
      let Ws = 0;
      for (let i = 0; i < tintClouds.length; i++) {
        const c = tintClouds[i], d = camP.distanceTo(c.center), w = (1 - sstep(c.radius * 0.5, c.radius * 1.2, d)) * 0.3 * er; if (w <= 0) continue;
        const pc = powCols[c.color]; W += w; Ws += w; r += pc.r * w; g += pc.g * w; b += pc.b * w;
      }
      Ws = Math.min(0.34, Ws);
      if (W > 0.002) {
        if (night) tintC.setRGB(0.085, 0.075, 0.10);                // bonfire eve: the smoke stays as dark as the sky behind it
        else {                                                      // a saturated tint, held darker than the haze so near shapes stay readable
          tintC.setRGB(r / W, g / W, b / W).lerp(fogBase, 0.15);
          const lu = 0.2126 * tintC.r + 0.7152 * tintC.g + 0.0722 * tintC.b; tintC.multiplyScalar(Math.min(1.4, (fogLuma * 0.7) / Math.max(lu, 0.02)));
        }
      }
      scene.fog.color.copy(fogBase).lerp(tintC, Math.min(0.12, Wr * 0.12 + Ws * 0.1)); scene.fog.density = look.density * (1 + 0.6 * Wr + 0.5 * Ws);
      if (airSize) {                                                // bigger motes at the start; inside a cloud's reach they swell again and take its colour
        const k = (1.3 - 0.3 * sstep(60, 100, s)) * (1 + 0.45 * Wr + 0.3 * Ws); airDust.uniforms.uSize.value.set(airSize.x * k, airSize.y * k);
        if (W > 0.002) moteC.setRGB(r / W, g / W, b / W);
        for (let i = 0; i < 3; i++) airCols[i].u.copy(airCols[i].base).lerp(night ? airCols[i].base : moteC, Math.min(0.8, Wr * 0.8 + Ws));
      }
    };

    // ---- every frame ----
    const update = (dt, time, camera, u) => {
      const s = u * L;
      hero.setProgress(u); hero.update(dt, time, camera); HU.uS.value = s; hero.setCrowd(sstep(270, 318, s));
      updateTroop(s, u, time); updatePeacock(s, time); updateTint(s, camera, u);
      // deep in the lane its walls hide the far roofs: their dressing (a few pixels each) is not drawn until the camera climbs out
      { const deep = dipAt(s) > 0.72; for (let k = 0; k < NB; k++) if (bandMesh[k]) bandMesh[k].visible = !(deep && k * BAND > s + 130); }
      if (band) for (let k = 0; k < 14; k++) {
        const x = -46 + ((time * 0.9 + k * 3.1) % 92), bob = Math.abs(Math.sin(time * 3 + k * 1.3)) * 0.12;
        BM.makeRotationY(Math.sin(time * 0.8 + k) * 0.3 + time * (k % 3 === 0 ? 1.4 : 0)); BM.setPosition(x, bob - 0.1, bandZ + Math.sin(x * 0.12 + k) * 1.5 + (k % 2) * 1.6); band.setMatrixAt(k, BM);
      }
      if (band) band.instanceMatrix.needsUpdate = true;
      if (devil) {
        const k = sstep(0.6, 0.9, u);                               // it ends left of the gate, inside the middle half of the frame, clear of the centre arch
        devil.uniforms.uBase.value.set(mix(-52, -20, k) + Math.sin(time * 0.4) * 1.5, 0, mix(30, -42, k) + Math.cos(time * 0.33) * 1.5);
        devil.update(dt, time, camera);
      }
      wind.update(time);
      sky.update(dt, time, camera); rig.update(dt, time, camera); fauna.update(dt, time, camera, u); set.update(dt, time, camera);
    };
    await ctx.yield();
    { const c0 = new THREE.PerspectiveCamera(62, ctx.aspect || 1.78, 0.3, 4000); path.pointAt(0, c0.position); c0.lookAt(0, 60, -400); c0.updateMatrixWorld(); update(0, 0, c0, 0); }
    await ctx.yield();
    // Shadow casters get depth materials of this world's own, one for each kind of caster (plain or instanced, with or
    // without instance colours, by the side its shadow is drawn with). The renderer's shared depth material picks its
    // program again whenever the kind of caster changes between two shadow draws, keyed by that caster's side and the
    // scene's lights; which casters follow which depends on what is inside the shadow box (and on the next world's
    // casters while it shows in the portal), so a new key could first come up in mid flight: a shader compiled in view.
    // A depth material used by one kind of caster only is compiled once, in the warm-up, and never looked up again.
    const depthMats = new Map();
    scene.traverse((o) => {
      if (!o.isMesh || !o.castShadow || o.customDepthMaterial) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      const kind = (o.isInstancedMesh ? (o.instanceColor ? 'ic' : 'i') : 'm') + (m.shadowSide ?? m.side);
      let d = depthMats.get(kind);
      if (!d) depthMats.set(kind, d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }));
      o.customDepthMaterial = d;
    });
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration,
      pace: (u) => 1 - 0.18 * sstep(96, 128, u * L) * (1 - sstep(162, 198, u * L)),      // a little slower through the lane's crossing
      title: look.title + (rare ? ' (Dust Devil)' : ''),
      ride: 'none',
      camera: { fov: 62, near: 0.3, far: 4200, lookAhead: 24, sway: 0.5, bank: 0.35 },
      pois: [
        { at: [routeClouds[0].x, routeClouds[0].y + 3.5, routeClouds[0].z], from: 96 / L, to: 147 / L, weight: 0.36, fade: 0.4 },
        { at: [0, 150, -520], from: 196 / L, to: 310 / L, weight: 0.4, fade: 0.3 },
        { at: [0, 13, -60], from: 325 / L, to: 1, weight: 0.6, fade: 0.2 },
      ],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 1.15, tilt: true, blendDistance: 30 },
      post: {
        exposure: look.exposure,
        bloom: { strength: night ? 0.5 : 0.28, radius: 0.6, threshold: 0.92 },
        grade: { saturation: look.grade.saturation, contrast: 1.05, tint: look.grade.tint, shadowTint: look.grade.shadowTint, vignette: 0.3, grain: 0.02, aberration: 0 },
      },
      update,
      dispose() { sky.dispose?.(); hero.dispose?.(); blobGeo.dispose(); leafMap.dispose(); leafDepth.dispose(); for (const d of depthMats.values()) d.dispose(); },
    };
  },
};

// ---------- the leaf atlas ----------
// The flora kit's atlas layout (4 x 2 cells; RGB = grey leaf shading, A = cut-out) with only what the oaks use: the broad-leaf
// cluster in cell (0, 0) and the solid cell for bark. Written straight into the pixels, in short steps, with mips that keep the
// fraction of texels passing the alpha test (the kit's own canvas version is a single 30 ms step).
async function makeLeafAtlas(S, rng, brk) {
  const h = S / 4, W = S, H = h * 2, k = h / 256, px = new Uint8Array(W * H * 4);
  for (let i = 0; i < px.length; i += 4) { px[i] = px[i + 1] = px[i + 2] = 186; }
  for (let i = 0; i < 46; i++) {
    const u = i / 46, a = rng() * TAU, r = h * 0.31 * Math.sqrt(0.08 + 0.92 * u), cx = h / 2 + Math.cos(a) * r, cy = h / 2 + Math.sin(a) * r;
    const dir = a + rng.range(-1, 1), len = h * rng.range(0.17, 0.25), wid = len * rng.range(0.36, 0.5) * 0.5, sh = 0.82 + 0.18 * u, v0 = rng.range(165, 200) * sh, v1 = rng.range(232, 255) * sh;
    const dx = Math.cos(dir), dy = Math.sin(dir), bx = cx - dx * len * 0.35, by = cy - dy * len * 0.35, ex = bx + dx * len, ey = by + dy * len;
    const x0 = Math.max(3, Math.floor(Math.min(bx, ex) - wid - 1)), x1 = Math.min(h - 4, Math.ceil(Math.max(bx, ex) + wid + 1)), y0 = Math.max(3, Math.floor(Math.min(by, ey) - wid - 1)), y1 = Math.min(h - 4, Math.ceil(Math.max(by, ey) + wid + 1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const qx = x + 0.5 - bx, qy = y + 0.5 - by, t = (qx * dx + qy * dy) / len; if (t <= 0 || t >= 1) continue;
      const w = Math.abs(qy * dx - qx * dy), hw = wid * Math.pow(4 * t * (1 - t), 0.7) * (1.2 - 0.4 * t); if (w > hw) continue;
      let v = v0 + (v1 - v0) * t; if (w > hw - 1.4 * k) v *= 0.72; else if (w < 0.7 * k && t < 0.85) v *= 0.84;
      const o = (y * W + x) * 4; px[o] = px[o + 1] = px[o + 2] = v; px[o + 3] = 255;
    }
  }
  for (let y = h; y < 2 * h; y++) for (let x = 3 * h; x < 4 * h; x++) { const o = (y * W + x) * 4; px[o] = px[o + 1] = px[o + 2] = px[o + 3] = 255; }
  await brk();
  const thr = 102, levels = [{ data: px, width: W, height: H }];
  let n0 = 0; for (let y = 0; y < h; y++) for (let x = 0; x < h; x++) if (px[(y * W + x) * 4 + 3] >= thr) n0++;
  const cov = n0 / (h * h), hist = new Uint32Array(256);
  let src = px, w = W, hg = H;
  while (w > 8) {
    const nw = w >> 1, nh = hg >> 1, dst = new Uint8Array(nw * nh * 4);
    for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
      const i0 = (y * 2 * w + x * 2) * 4, i1 = i0 + 4, i2 = i0 + w * 4, i3 = i2 + 4, q = (y * nw + x) * 4;
      const a0 = src[i0 + 3], a1 = src[i1 + 3], a2 = src[i2 + 3], a3 = src[i3 + 3], as = a0 + a1 + a2 + a3;
      const v = as > 0 ? (src[i0] * a0 + src[i1] * a1 + src[i2] * a2 + src[i3] * a3) / as : src[i0];
      dst[q] = dst[q + 1] = dst[q + 2] = v; dst[q + 3] = as >> 2;
    }
    levels.push({ data: dst, width: nw, height: nh }); src = dst; w = nw; hg = nh;
    if (levels.length === 2) await brk();
  }
  for (let l = 1; l < levels.length; l++) {                        // keep the cluster cell's coverage at every level
    const { data, width } = levels[l], lw = h >> l; hist.fill(0);
    for (let y = 0; y < lw; y++) for (let x = 0; x < lw; x++) hist[data[(y * width + x) * 4 + 3]]++;
    const need = cov * lw * lw; let acc = 0, a = 255; while (a > 1 && acc + hist[a] < need) { acc += hist[a]; a--; }
    const sc = thr / Math.max(a, 1); if (sc <= 1.001) continue;
    for (let y = 0; y < lw; y++) for (let x = 0; x < lw; x++) { const q = (y * width + x) * 4 + 3; data[q] = Math.min(255, Math.round(data[q] * sc)); }
  }
  const tex = new THREE.DataTexture(px, W, H, THREE.RGBAFormat);
  tex.mipmaps = levels; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.needsUpdate = true;
  return tex;
}

// ---------- the langur: grey body, black face and hands, a metre of tail carried in a hoop ----------
// aPivot = joint a limb swings about; aAnim = (swing sense, phase offset, kind: 0 body 1 leg 2 tail 3 infant, tail parameter)
function langurGeometry() {
  const P = [], N = [], C = [], PV = [], AN = [];
  let piv = [0, 0, 0], an = [0, 0, 0, 0];
  const v = (q, a = an) => { P.push(q.p[0], q.p[1], q.p[2]); N.push(q.n[0], q.n[1], q.n[2]); C.push(q.c[0], q.c[1], q.c[2]); PV.push(piv[0], piv[1], piv[2]); AN.push(a[0], a[1], a[2], a[3]); };
  const ell = (cx, cy, cz, rx, ry, rz, colF, seg = 6, rings = 4) => {
    const pt = (i, k) => { const th = (i / rings) * Math.PI, ph = (k / seg) * TAU, n = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)]; return { p: [cx + n[0] * rx, cy + n[1] * ry, cz + n[2] * rz], n, c: colF(n) }; };
    for (let i = 0; i < rings; i++) for (let k = 0; k < seg; k++) { const a = pt(i, k), b = pt(i, k + 1), c = pt(i + 1, k + 1), d = pt(i + 1, k); if (i > 0) { v(a); v(b); v(c); } if (i < rings - 1) { v(a); v(c); v(d); } }
  };
  const tube = (pts, rad, sides, colF, animF) => {
    const rings = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
      // B = T x X (X is never the tube's axis here), Nn = B x T
      let bx = 0, by = tz, bz = -ty; const bl = Math.hypot(by, bz) || 1; by /= bl; bz /= bl;
      const nx = by * tz - bz * ty, ny = bz * tx - bx * tz, nz = bx * ty - by * tx, ring = [];
      for (let k = 0; k < sides; k++) { const an2 = (k / sides) * TAU, cs = Math.cos(an2), sn = Math.sin(an2), n = [bx * cs + nx * sn, by * cs + ny * sn, bz * cs + nz * sn]; ring.push({ p: [pts[i][0] + n[0] * rad[i], pts[i][1] + n[1] * rad[i], pts[i][2] + n[2] * rad[i]], n, c: colF(i) }); }
      rings.push(ring);
    }
    for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < sides; k++) {
      const a = rings[i][k], b = rings[i][(k + 1) % sides], c = rings[i + 1][(k + 1) % sides], d = rings[i + 1][k], a0 = animF ? animF(i) : an, a1 = animF ? animF(i + 1) : an;
      v(a, a0); v(d, a1); v(c, a1); v(a, a0); v(c, a1); v(b, a0);
    }
  };
  // albedos are low on purpose: the sun here is strong, and a langur must stay grey beside whitewash, not bleach to cream
  const grey = [0.2, 0.2, 0.19], pale = [0.33, 0.32, 0.29], black = [0.012, 0.012, 0.014], cream = [0.46, 0.44, 0.38], dk = [0.1, 0.09, 0.08];
  ell(0, 0.5, -0.02, 0.12, 0.125, 0.31, (n) => (n[1] < -0.35 ? pale : grey), 6, 5);
  ell(0, 0.55, 0.2, 0.105, 0.115, 0.14, () => grey);
  ell(0, 0.665, 0.36, 0.115, 0.118, 0.07, () => cream);
  ell(0, 0.67, 0.385, 0.085, 0.09, 0.095, () => grey);
  ell(0, 0.655, 0.445, 0.075, 0.085, 0.05, () => black, 5, 3);
  for (const sx of [-1, 1]) {
    piv = [sx * 0.085, 0.5, 0.2]; an = [1, sx > 0 ? 0 : 0.45, 1, 0];
    tube([[sx * 0.085, 0.52, 0.2], [sx * 0.09, 0.27, 0.23], [sx * 0.09, 0.03, 0.2], [sx * 0.09, 0, 0.27]], [0.065, 0.044, 0.036, 0.026], 4, (i) => (i > 1 ? black : grey));
    piv = [sx * 0.09, 0.5, -0.22]; an = [1, sx > 0 ? 2.5 : 2.95, 1, 0];
    tube([[sx * 0.09, 0.52, -0.22], [sx * 0.1, 0.28, -0.15], [sx * 0.1, 0.03, -0.25], [sx * 0.1, 0, -0.17]], [0.088, 0.055, 0.039, 0.029], 4, (i) => (i > 1 ? black : grey));
  }
  piv = [0, 0.56, -0.32]; an = [0, 0, 2, 0];
  const tail = [], R = 0.3; for (let i = 0; i <= 7; i++) { const a = (i / 7) * 1.5 * Math.PI; tail.push([0, 0.56 + R * (1 - Math.cos(a)), -0.32 - R * Math.sin(a) * 0.75]); }
  tube(tail, tail.map((_, i) => 0.055 - i * 0.004), 4, (i) => (i > 5 ? dk : grey), (i) => [0, 0, 2, i / 7]);
  piv = [0, 0.4, 0.04]; an = [0, 0, 3, 0];
  ell(0, 0.37, 0.02, 0.07, 0.07, 0.15, () => dk, 5, 3); ell(0, 0.36, 0.18, 0.05, 0.05, 0.05, () => black, 5, 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('aPivot', new THREE.Float32BufferAttribute(PV, 3)); g.setAttribute('aAnim', new THREE.Float32BufferAttribute(AN, 4));
  return g;
}

function makeLangurMaterial(U) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aPivot; attribute vec4 aAnim; attribute vec4 iAnim; uniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          float ph = iAnim.x, air = iAnim.y, kind = aAnim.z;
          if (kind > .5 && kind < 1.5) {
            float a = mix(sin(ph + aAnim.y) * .85, aAnim.y > 1. ? .95 : -.95, air);
            vec3 q = transformed - aPivot; float c = cos(a), s = sin(a);
            transformed = aPivot + vec3(q.x, q.y * c - q.z * s, q.y * s + q.z * c);
          } else if (kind > 1.5 && kind < 2.5) {
            float t = aAnim.w;
            transformed.x += sin(uTime * 3.1 + t * 4. + iAnim.z) * .07 * t;
            transformed.z -= air * t * .4; transformed.y -= air * t * t * .32;
          } else if (kind > 2.5) {
            transformed = aPivot + (transformed - aPivot) * iAnim.w;
          }
          transformed.y += (.5 + .5 * sin(ph + 1.)) * .08 * (1. - air);
        }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * .1;');
  };
  mat.customProgramCacheKey = () => 'holi-langur';
  return mat;
}
