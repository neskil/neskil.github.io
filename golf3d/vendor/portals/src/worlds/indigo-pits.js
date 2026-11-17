// THE BLUE YARD (indigo-pits): a five-hundred-year-old Hausa dye yard, built three times life size.
// Out of the cloth store's door into an open nave of mirror pits between two banks of hanging indigo, high
// over the honeycomb, then down to skim the liquor; up the face of the rising length (the hero,
// src/parts/indigo-pits.js) as it leaves the pit yellow-green and turns blue in the air, round its left
// side, out over the canyon of drying cloth looking straight down into its pits, and down to the gate.
// THE NAVE: down the hall the cloth hangs in banks either side (all eight tiers, near black at the foot,
// palest at the top) and leaves the middle 35 to 46 m open under a high canopy of the palest tiers, so the
// pits lie in the light and no mast stands nearer the flight than 17 m. In the evening look the sun side
// has been taken in for the night (every second frame struck, a low dark bank by the wall, a pale length left
// here and there) and the low sun rakes across the pits with the masts' shadows.
//
// Flight runs toward -Z, +X to its right, ground y = 0. Store z 60..0, yard z 0..-300 (x +-48), hero pit at
// (0, 0, -150), gate arch at z -290, portal at (0, 9, -294).
// No three.js lights except a sun + hemisphere pair for the two neem trees (kit flora material): every other
// surface uses one shared lighting chunk: the hero's sun/sky uniforms plus a SHADE MAP, a top-down texture of
// the sunlight that reaches the ground after crossing the hanging cloth (ray-traced on the CPU at build from
// the same cloth list the instances are made from), looked up at a fragment's position slid along the sun.
// Looks by seed (or ctx.vary.hour): dusty white noon, amber evening, cobalt morning after rain, moonlit night.
// Rare event (ctx.vary.rare): at u 0.64 a gust strips one line of the canyon and twenty cloths sail down it to the gate,
// settling across the forecourt pits by u 0.86.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import * as FL from '../kit/flora.js';
import { buildHero, Acc, addTube, addRope, addLashing, addStone, GLSL_COMMON } from '../parts/indigo-pits.js';

const PAL = ['#EDE6D6', '#C99A5A', '#10173A', '#27479A', '#A9C7EA', '#B6C23A', '#F26B1D'];
const DUR = 41, TAU = Math.PI * 2;
const HX = 0, HZ = -150, WELL_R = 27;                    // hero pit, radius of the clearing round it
const NAVE = 16.5;                                       // half-width the hall's banks keep clear (the nearest gap in the pit row beyond it takes the masts)
const FR_N = 41, FR_Z0 = -14, FR_DZ = 6.3;               // gantry frames (the last, at z -266, is the porch before the gate: tiers 2 and up only)
const T_Y0 = 8.7, T_DY = 4.4;                            // rope height of tier 0, tier pitch
const ROW_Z0 = -17.15, ROW_DZ = 12.6, ROW_N = 20;        // pit rows (midway between pairs of frames); the last lies in the forecourt, two pits either side of the way
const NEEM_X = 19.5, NEEM_Z = -281;                      // the two neems flank the gatehouse
const PIT_R = 4.5, PIT_LIP = 5.3, PIT_Y = -0.5;
const MAP_X0 = -50, MAP_W = 100, MAP_Z0 = -304, MAP_L = 368;
const frZ = (f) => FR_Z0 - FR_DZ * f, rowZ = (k) => ROW_Z0 - ROW_DZ * k;
const rowSix = (k) => (k % 2 === 1) || k === 0 || rowZ(k) < -170;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);

// sun (direction TO it), light colours [hex, gain], fog, grade. Night is only used when asked for.
const LOOKS = {
  noon: { sun: [-0.269, 0.883, -0.385], sunCol: ['#fff1d8', 2.6], sky: ['#8fa6d6', 0.40], gnd: ['#c99a5a', 0.20], haze: ['#f8e9cf', 1.06], zen: ['#5c88dc', 0.66], halo: 1, pearl: 0.88, disc: [-0.10, 0.72, -0.69], gate: 0.8,
    amb: [0.66, 0.76, 1.22], fog: ['#e6dcc8', 0.80], fogBlue: ['#6f8fd4', 0.52], dens: 0.0030, dust: 1, wet: 0, exposure: 0.98, sat: 1.1, tint: '#fffaf2', shadow: '#0c1230', store: ['#4e4a5c', 0.10],
    portal: '#ffd9a0', discGain: 2.2, kCan: 5, canOcc: 1, occ: 1, sparse: 0, naveOpen: 0.62 },
  evening: { sun: [0.55, 0.44, -0.71], sunCol: ['#ffcd92', 2.9], sky: ['#8f9ccc', 0.40], gnd: ['#a88a6a', 0.20], haze: ['#f3ceb0', 0.86], zen: ['#8d8cc8', 0.62],
    ambGain: 3.5, bladeK: 0.45, soft: 1, halo: 0, gate: 1.05, neemAmb: 2.5,
    amb: [0.82, 0.84, 1.1], fog: ['#dcc6c0', 0.72], fogBlue: ['#8f92c8', 0.58], dens: 0.0034, dust: 1.2, wet: 0, exposure: 1.06, sat: 1.12, tint: '#fff2e6', shadow: '#141636', store: ['#4c4c60', 0.10],
    portal: '#bcd4ff', discGain: 3.2, kCan: 6, canOcc: 0.3, occ: 0.16, sparse: 1, naveOpen: 0.92 },
  rain: { sun: [-0.3, 0.84, -0.45], sunCol: ['#fffaf0', 2.9], sky: ['#6a8fdc', 0.50], gnd: ['#8a6c4c', 0.22], haze: ['#9cc4f0', 0.80], zen: ['#2458c4', 0.80],
    amb: [0.8, 0.86, 1.12], fog: ['#a9c6ea', 0.62], fogBlue: ['#6f92d8', 0.55], dens: 0.0016, dust: 0.12, wet: 1, exposure: 1.1, sat: 1.18, tint: '#f8fbff', shadow: '#0a1238', store: ['#4c4c5c', 0.12],
    ambGain: 3.3, door: ['#e6ecf6', 0.9], halo: 0.35, gate: 0.85,
    portal: '#ffe2a8', discGain: 3.0, kCan: 6, canOcc: 1, occ: 1, sparse: 0, naveOpen: 0.82 },
  night: { sun: [-0.35, 0.80, -0.48], sunCol: ['#b8c8ff', 0.62], sky: ['#34478e', 0.24], gnd: ['#1c2244', 0.12], haze: ['#2a3666', 0.55], zen: ['#0b1130', 0.5],
    amb: [0.6, 0.72, 1.2], fog: ['#222c58', 0.5], fogBlue: ['#1a2452', 0.5], dens: 0.0030, dust: 0.3, wet: 0, exposure: 1.5, sat: 0.95, tint: '#eef2ff', shadow: '#040818', store: ['#20243a', 0.08],
    portal: '#ffd28a', discGain: 5.0, kCan: 6, canOcc: 0.6, occ: 1, sparse: 0, naveOpen: 0.8 },
};

// ---------------------------------------------------------------- the yard's plan (shared by JS and GLSL)
// masts stand in the gaps of the pit row their pair of frames straddles. bound = the inner edge of the banks:
// the nave down the hall, the clearing round the hero, the canyon's aisle. canopy: the hall's high tiers span the nave.
function framePlan(f) {
  const z = frZ(f), k = Math.floor(f / 2), six = rowSix(k), dz = Math.abs(z - HZ);
  const allowed = six ? [11.5, 23, 34.5, 46.5] : [17.25, 31, 46.5], std = six ? [11.5, 34.5, 46.5] : [17.25, 31, 46.5];
  const circ = dz < WELL_R ? Math.sqrt(WELL_R * WELL_R - dz * dz) : 0, canyon = z < HZ - 1;
  const need = Math.max(circ > 0 ? circ + 0.3 : 0, canyon ? 11 : NAVE), bound = allowed.find((a) => a >= need) ?? 46.5;
  const xs = std.filter((x) => x >= bound); if (!xs.includes(bound)) xs.unshift(bound);
  return { f, z, six, canyon, bound, xs, canopy: !canyon && circ === 0 };
}
// the lines of one frame: [from x, to x, 1 if it is the canopy over the nave]
function frameBays(P) {
  const bays = [];
  if (P.canopy) bays.push([-P.xs[0], P.xs[0], 1]);
  for (let i = 0; i + 1 < P.xs.length; i++) { bays.push([P.xs[i], P.xs[i + 1], 0]); bays.push([-P.xs[i + 1], -P.xs[i], 0]); }
  return bays;
}
// nearest pit to a ground point: [distance to its centre, cx, cz] (mirrored in GLSL as pitAt)
function pitNear(x, z) {
  const k = clamp(Math.round((ROW_Z0 - z) / ROW_DZ), 0, ROW_N), zr = rowZ(k), six = rowSix(k), xo = six ? 5.75 : 0;
  const far = k > 19, col = clamp(Math.round((x - xo) / 11.5), far ? -2 : six ? -3 : -2, far ? 1 : 2), cx = col * 11.5 + xo;
  if (Math.hypot(cx - HX, zr - HZ) < 14.8) return [1e3, cx, zr];
  return [Math.hypot(x - cx, z - zr), cx, zr];
}

// tier colour: near black with an ultramarine heart at the bottom, sky blue at the top
function tierColor(k, out, pal) {
  const t = clamp(k / 7, 0, 1);
  if (t < 0.45) out.copy(pal.deep).lerp(pal.blue, Math.pow(t / 0.45, 1.25)); else out.copy(pal.blue).lerp(pal.sky, Math.pow((t - 0.45) / 0.55, 0.85));
  return out;
}

// every hanging cloth in the yard: { x, w, yTop, drop, z, f, k, col, tr (sun transmission), seed, line }
// vary: whiteDay, kCan (lowest tier of the canopy), canOcc (how much of the canopy is hung), sparse (the side, -1 or 1,
// taken in for the night; 0 none), occ (what is left hanging there), away (the side whose first three frames stand
// bare so the sunlit wall shows from the store door)
async function layCloth(ctx, rng, pal, vary) {
  const list = [], buckets = new Array(FR_N * 8), c = new THREE.Color(), plans = [];
  for (let f = 0; f < FR_N; f++) {
    const P = framePlan(f); plans.push(P);
    const bays = frameBays(P);
    for (let k = 0; k < 8; k++) {
      const cream = vary.whiteDay && rng() < 0.3, lineDrop = rng.range(3.45, 3.95), pat = rng();
      const bucket = [];
      for (const [a, b, top] of bays) {
        if (top && (k < vary.kCan || (vary.sparse && (f & 1) === 1))) continue;
        if (f === FR_N - 1 && k < 2) continue;                              // the porch: nothing hangs below 13 m, the forecourt shows under it
        const side = Math.sign(a + b), outer = Math.min(Math.abs(a), Math.abs(b)) > 30;
        let occ = 0.965;
        if (top) occ *= vary.canOcc;
        else if (vary.sparse && side === vary.sparse && !P.canyon) occ *= (f & 1) ? 0 : (k <= 1 && outer) ? 1 : vary.occ * (k <= 1 ? 0.4 : 1);
        else if (!P.canyon && f < 3 && side === vary.away) occ = 0;
        const len = b - a - 1.3, n = Math.max(1, Math.round(len / rng.range(6.6, 8.6)));
        let x0 = a + 0.65;
        for (let i = 0; i < n; i++) {
          const wSlot = len / n, gap = rng.range(0.22, 0.6), w = wSlot - gap, x = x0 + wSlot / 2 + rng.range(-0.08, 0.08);
          x0 += wSlot;
          const keep = rng() < occ;                                       // a place on the line left empty
          tierColor(k + rng.range(-0.45, 0.45), c, pal);
          const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h + rng.range(-0.012, 0.012), clamp(hsl.s * rng.range(0.92, 1.1), 0, 1), hsl.l * rng.range(0.88, 1.12));
          if (cream) c.copy(pal.haze).multiplyScalar(rng.range(0.7, 0.82));
          const drop = clamp(lineDrop + rng.range(-0.75, 0.3), 2.7, 4.15), t = k / 7, seed = rng();
          if (!keep) continue;
          const tk = cream ? 0.5 : lerp(0.10, 0.5, t * t);
          const o = { x, w, yTop: T_Y0 + T_DY * k - 0.06, drop, z: P.z, f, k, col: c.clone(), seed, pat: cream ? 0.99 : pat, line: f * 8 + k,
            tr: [Math.pow(c.r, 0.7) * tk * 1.6, Math.pow(c.g, 0.7) * tk * 1.6, Math.pow(c.b, 0.7) * tk * 1.6].map((v) => Math.min(v, 0.85)) };
          list.push(o); bucket.push(x - w / 2, x + w / 2, o.yTop - drop, o.yTop, o.tr[0], o.tr[1], o.tr[2]);
        }
      }
      // the tracer looks a line's cloths up in x order
      const order = []; for (let i = 0; i < bucket.length; i += 7) order.push(i); order.sort((p, q) => bucket[p] - bucket[q]);
      const B = new Float32Array(bucket.length); order.forEach((src, j) => { for (let m = 0; m < 7; m++) B[j * 7 + m] = bucket[src + m]; });
      buckets[f * 8 + k] = B;
    }
    if ((f & 3) === 3) await ctx.yield?.();
  }
  return { list, buckets, plans };
}

// sunlight (rgb 0..1) reaching a point after the store, the cloth, the walls and the neems
function makeTracer(sun, buckets, noise) {
  const sx = sun.x, sy = sun.y, sz = Math.min(sun.z, -0.05), slitX = sx < 0 ? -15 : 15;
  const out = [0, 0, 0], none = () => { out[0] = out[1] = out[2] = 0; return out; };
  const sph = (x, y, z, cx, cy, cz, r) => { const ox = x - cx, oy = y - cy, oz = z - cz, b = ox * sx + oy * sy + oz * sz, cc = ox * ox + oy * oy + oz * oz - r * r; return b * b - cc > 0 && -b + Math.sqrt(b * b - cc) > 0; };
  return function trace(x, y, z) {
    let r = 1, g = 1, b = 1;
    if (z > 0.6) {
      if (Math.abs(x) >= 15 || z > 60) { out[0] = out[1] = out[2] = 1; return out; }
      const tw = Math.abs(sx) > 1e-4 ? (slitX - x) / sx : -1, tf = -z / sz;
      if (tw > 0 && tw < tf) {
        const yw = y + sy * tw, zw = z + sz * tw, zs = ((zw + 6) % 12 + 12) % 12 - 6;
        if (yw > 10.6 && yw < 13.6 && Math.abs(zs) < 0.55 && zw > 8 && zw < 54) { out[0] = out[1] = out[2] = 1; return out; }
        return none();
      }
      const yf = y + sy * tf, xf = x + sx * tf;
      if (yf > 13 || Math.abs(xf) > 8) return none();
      x = xf; y = yf; z = 0;
    }
    if (Math.abs(x) > 47.2 || z < -299) { out[0] = out[1] = out[2] = 1; return out; }
    for (let f = Math.max(0, Math.ceil((FR_Z0 - z) / FR_DZ + 1e-5)); f < FR_N; f++) {
      const t = (frZ(f) - z) / sz, yy = y + sy * t;
      if (yy > 39.6) break;
      const xx = x + sx * t; if (Math.abs(xx) > 47) break;
      const k = Math.floor((yy - 4.3) / T_DY); if (k < 0 || k > 7) continue;
      const B = buckets[f * 8 + k]; if (!B) continue;
      for (let i = 0; i < B.length; i += 7) if (xx >= B[i] && xx <= B[i + 1]) { if (yy >= B[i + 2] && yy <= B[i + 3]) { r *= B[i + 4]; g *= B[i + 5]; b *= B[i + 6]; } break; }
      if (r + g + b < 0.02) return none();
    }
    if (Math.abs(sx) > 1e-4) { const tw = ((sx > 0 ? 47.2 : -47.2) - x) / sx, yw = y + sy * tw, zw = z + sz * tw; if (zw > -299 && yw < 18.2) return none(); }
    { const tg = (-299 - z) / sz, yg = y + sy * tg; if (yg < 18.2) return none();
      const th = (-290 - z) / sz, yh = y + sy * th, xh = x + sx * th; if (th > 0 && Math.abs(xh) < 15 && yh < 26) return none(); }
    if (z < NEEM_Z + 80 && (sph(x, y, z, NEEM_X, 22.5, NEEM_Z, 9.5) || sph(x, y, z, -NEEM_X, 22.5, NEEM_Z, 9.5))) {
      const gx = x - sx * (y / sy), gz = z - sz * (y / sy), d = noise.n2(gx * 0.42 + 9, gz * 0.42) + 0.5 * noise.n2(gx * 1.3, gz * 1.3 + 4);
      const k = 0.16 + 0.84 * smoothstep(0.25, 0.55, d); r *= k; g *= k; b *= k * 0.96;
    }
    out[0] = r; out[1] = g; out[2] = b; return out;
  };
}

// masts: [x, z] of every mast; their long thin shadows are drawn over the traced map (sun: direction to the sun)
async function buildShadeMap(ctx, trace, skyOpen, W, L, masts, sun) {
  const data = new Uint8Array(W * L * 4), cpu = new Float32Array(W * L), sky = new Float32Array(W * L);
  for (let j = 0; j < L; j++) {
    const z = MAP_Z0 + (j + 0.5) / L * MAP_L;
    for (let i = 0; i < W; i++) {
      const x = MAP_X0 + (i + 0.5) / W * MAP_W, o = trace(x, 0.02, z), p = (j * W + i) * 4;
      const so = skyOpen(x, z); sky[j * W + i] = so;
      data[p] = o[0] * 255; data[p + 1] = o[1] * 255; data[p + 2] = o[2] * 255; data[p + 3] = so * 255;
      cpu[j * W + i] = o[0] * 0.3 + o[1] * 0.5 + o[2] * 0.2;
    }
    if ((j & 3) === 3) await ctx.yield?.();
  }
  {
    const dark = new Float32Array(W * L), kx = -sun.x / Math.max(sun.y, 0.1), kz = -sun.z / Math.max(sun.y, 0.1), len = Math.hypot(kx, kz) * 42, n = Math.ceil(len / 0.3);
    for (let m = 0; m < masts.length; m++) {
      const [mx, mz] = masts[m];
      for (let q = 2; q <= n; q++) {
        const t = q / n, x = mx + kx * 42 * t, z = mz + kz * 42 * t;
        if (Math.abs(x) > 47 || z > -1 || z < -298) continue;
        const fi = (x - MAP_X0) / MAP_W * W - 0.5, fj = (z - MAP_Z0) / MAP_L * L - 0.5, i0 = Math.floor(fi), j0 = Math.floor(fj), a = 0.62 * (1 - 0.6 * t);
        for (let dj = 0; dj < 2; dj++) for (let di = 0; di < 2; di++) {
          const i = i0 + di, j = j0 + dj; if (i < 0 || i >= W || j < 0 || j >= L) continue;
          const w = a * (1 - Math.abs(fi - i)) * (1 - Math.abs(fj - j)) * 1.6, id = j * W + i; if (w > dark[id]) dark[id] = Math.min(w, 0.7);
        }
      }
      if ((m & 31) === 31) await ctx.yield?.();
    }
    for (let id = 0; id < W * L; id++) if (dark[id] > 0) { const k = 1 - dark[id], p = id * 4; data[p] *= k; data[p + 1] *= k; data[p + 2] *= k; cpu[id] *= k; }
  }
  const tex = new THREE.DataTexture(data, W, L, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.colorSpace = THREE.NoColorSpace; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  // openness (blurred light) at a point, for the fog colour round the camera
  const openAt = (x, z) => {
    let s = 0, n = 0;
    for (let dj = -8; dj <= 8; dj += 4) for (let di = -8; di <= 8; di += 4) {
      const i = Math.round((x - MAP_X0) / MAP_W * W) + di, j = Math.round((z - MAP_Z0) / MAP_L * L) + dj;
      if (i >= 0 && i < W && j >= 0 && j < L) { s += sky[j * W + i]; n++; }
    }
    return n ? s / n : 1;
  };
  return { tex, cpu, openAt, W, L };
}

// ---------------------------------------------------------------- the shared lighting chunk
// sunAt(p): filtered sunlight at a world point (the shade map at its ground footprint along the sun, trembling a
// little so slivers shimmer); ambAt(): sky/earth ambient, bluer and dimmer under cloth, brown and dim in the store.
const GLSL_YARD = GLSL_COMMON + /* glsl */`
  uniform sampler2D uShadeMap; uniform vec4 uShadeXf, uGateSun; uniform vec3 uAmbShade, uStoreAmb, uDoorCol, uFilt; uniform vec4 uGust; uniform float uWet, uAmbGain, uSoft;
  vec2 shadeUV(vec3 p){ vec2 g = p.xz - uSunDir.xz * (max(p.y, 0.) / max(uSunDir.y, .05));
    if (p.z < 0.) g = clamp(g, vec2(-46.5, -298.5), vec2(46.5, 100.));
    else if (abs(p.x) < 15.5) g = clamp(g, vec2(-14.7, -100.), vec2(14.7, 59.5));
    return (g - uShadeXf.xy) * uShadeXf.zw; }
  vec3 sunAt(vec3 p){
    vec2 uv = shadeUV(p);
    uv += vec2(sin(uTime * 1.9 + p.x * .31 + p.z * .07), sin(uTime * 2.6 + p.z * .23)) * uShadeXf.zw * .11 * step(p.z, 0.);
    vec3 s = texture2D(uShadeMap, uv).rgb; float hi = smoothstep(27., 41., p.y);
    float sf = uSoft * smoothstep(-258., -268., p.z); if (sf > 0.) s = mix(s, textureLod(uShadeMap, uv, 1.7).rgb, sf);
    return mix(s, vec3(1.), hi * hi * step(p.z, 0.));
  }
  float openAt(vec3 p){ return textureLod(uShadeMap, (p.xz - uShadeXf.xy) * uShadeXf.zw, 3.2).a; }
  vec3 ambAt(vec3 N, vec3 p){
    vec3 a = mix(uGndCol, uSkyCol, N.y * .5 + .5);
    float op = openAt(p);
    a *= mix(uAmbShade, vec3(1.), op) * uAmbGain;
    a += uGndCol * uSunCol * (.5 - .5 * N.y) * (.1 + .5 * op);        // sunlit earth thrown back up onto whatever stands over it
    float st = smoothstep(.2, 2.5, p.z);
    if (st > 0.) {
      vec3 dd = vec3(0., 6.5, -1.) - p; float d2 = dot(dd, dd);
      vec3 sp = uStoreAmb * (.55 + .45 * N.y) + uDoorCol * (max(dot(N, dd * inversesqrt(d2 + 1e-4)), 0.) * .8 + .2) * (700. / (700. + d2));
      a = mix(a, sp, st);
    }
    return a;
  }
  // THE GATE'S LIGHT. The gatehouse front faces away from the true sun, so it is given the same sun swung round until
  // it rakes across the face (uGateSun: direction to it, w = strength): through the arch onto the reveal, behind the
  // two buttresses their shadows, and over everything the neems' dapple, shifting as the crowns move.
  float gateZone(vec3 p){ return (1. - smoothstep(-287.4, -285.6, p.z)) * (1. - smoothstep(15.8, 16.8, abs(p.x))); }
  float gateLit(vec3 p){
    vec3 L = uGateSun.xyz; float lz = max(L.z, .05), dz = p.z + 290., lit = 1.;
    if (dz < -.06) {
      vec2 e = p.xy + L.xy * (-dz / lz);
      float sd = max(abs(e.x) - 8.5, e.y > 10.5 ? length(e - vec2(0., 10.5)) - 8.5 : -1.);
      lit = 1. - smoothstep(-.35, .35, sd);
    } else {
      float T = max(1.6 - dz, 0.) / lz, sx = L.x * T, lo = min(0., sx), hi = max(0., sx), on = smoothstep(0., .3, T * lz);
      float b0 = 12.6 - p.x, b1 = -12.6 - p.x;
      lit *= 1. - on * smoothstep(b0 - 1.5, b0 - 1.1, hi) * (1. - smoothstep(b0 + 1., b0 + 1.25, lo));
      lit *= 1. - on * smoothstep(b1 - 1.5, b1 - 1.1, hi) * (1. - smoothstep(b1 + 1., b1 + 1.25, lo));
    }
    float dap = fbm2(vec2(p.x + p.z * .7, p.y) * .3 + vec2(uTime * .045 + .12 * sin(uTime * .5 + p.y * .2), .1 * sin(uTime * .37 + p.x * .3)));
    lit *= mix(1., .22 + .78 * smoothstep(.36, .6, dap), .9 * smoothstep(3., 13., p.y));
    return lit * uGateSun.w;
  }
`;
const FOG_V = '#include <common>\n#include <fog_pars_vertex>\n', FOG_F = '#include <common>\n#include <fog_pars_fragment>\n';

// ---------------------------------------------------------------- hanging cloth (the whole world)
// One grid per instance, pinned along its rope: aO = centre x, rope y, z, width; aD = drop, phase, pattern,
// kind (0 hanging, 1 streamer turned edge-on to the aisle, 2 a wet length on a tripod, 3 a length hung on the gatehouse:
// lean 0 across its face, +-1 down a jamb of the arch and facing that way); aL = sunlight at the
// top and the hem (traced at build), lean (updraught) or bank side, line id; aC = colour.
function clothGeometry(nx, ny, items) {
  const pg = new THREE.PlaneGeometry(1, 1, nx, ny); pg.translate(0, -0.5, 0);
  const g = new THREE.InstancedBufferGeometry(); g.setIndex(pg.index); g.setAttribute('position', pg.attributes.position);
  const n = items.length, aO = new Float32Array(n * 4), aD = new Float32Array(n * 4), aL = new Float32Array(n * 4), aC = new Float32Array(n * 3);
  items.forEach((o, i) => {
    aO.set([o.x, o.yTop, o.z, o.w], i * 4); aD.set([o.drop, o.seed * 40, o.pat, o.kind || 0], i * 4);
    aL.set([o.lt ?? 1, o.lb ?? 1, o.lean || 0, o.line ?? -1], i * 4); aC.set([o.col.r, o.col.g, o.col.b], i * 3);
  });
  g.setAttribute('aO', new THREE.InstancedBufferAttribute(aO, 4)); g.setAttribute('aD', new THREE.InstancedBufferAttribute(aD, 4));
  g.setAttribute('aL', new THREE.InstancedBufferAttribute(aL, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 3));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(V3(0, 20, -150), 400);
  return g;
}

function clothMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: true, side: THREE.DoubleSide,
    vertexShader: FOG_V + GLSL_YARD + /* glsl */`
      attribute vec4 aO, aD, aL; attribute vec3 aC;
      uniform vec4 uStrip; uniform float uTripU;
      varying vec3 vW, vN, vCol; varying vec4 vQ; varying vec4 vI; varying vec2 vWH; varying float vSl;
      float gustAt(float z, float x){
        float q = fract((-z - 16. * uTime) / 144. + .08 * sin(x * .05));
        float g = q * q * q * q * smoothstep(1., .94, q);
        float d = z - uGust.x;
        return g + uGust.y * smoothstep(-5., 4., d) * exp(-max(d, 0.) / max(uGust.z, 1.));
      }
      float dispF(float s, float t, float H, float gust, float ph, float lean, float kind, float W){
        float wgt = pow(t + 1e-4, 1.3);
        float fl = sin(t * 5.1 - uTime * 3.1 + ph + s * 2.3) * .17 + sin(t * 11.3 - uTime * 5.3 + ph * 1.7 - s * 3.1) * .06 + sin(t * 2.2 - uTime * 1.3 + ph * .6) * .2;
        if (kind > .5 && kind < 1.5) {
          float sw = (sin(uTime * .8 + ph) * .9 + sin(uTime * 1.7 + ph * 2.) * .4) * (1. - clamp(gust * 1.6, 0., 1.));
          return (-sw * H * .11 + gust * H * .2 - fl * .4 - .5) * wgt;
        }
        float pleat = sin(s * W * 1.6 + ph * 3.) * .14 * smoothstep(0., .3, t) * (1. - .5 * clamp(gust, 0., 1.));
        if (kind > 2.5) {                 // on the wall: it bellies out from the mud and is slapped flat by the gust, ripples running down it
          float g = clamp(gust * 1.3, 0., 1.);
          float outw = (.34 + .24 * sin(uTime * .9 + ph) + .12 * sin(uTime * 2.1 + ph * 2.3 + t * 3.)) * H * .085 * (.6 + .4 * cos(s * 3.1416));
          return max(outw * (1. - .92 * g) + fl * (.5 + .7 * g) + .22 * g * sin(t * 9. - uTime * 7. + ph), -.14) * wgt + pleat * .6;
        }
        float belly = (.5 + .34 * sin(uTime * .5 + ph * 1.3) + 1.5 * gust) * H * .25 * (.72 + .28 * cos(s * 3.1416)) + (s * sin(ph * 5.) * .6 + .3 * sin(uTime * .37 + ph * 2.1)) * H * .09;
        // a wet length is heavy: a slow deep belly, little flutter
        if (kind > 1.5) return -(belly * .42 + fl * .3 + .16 * H * .1 * sin(uTime * .8 + ph + t * 2.)) * wgt + pleat * 1.5;
        return (-(belly + fl * (.7 + 1.1 * gust)) + lean) * wgt + pleat;
      }
      void main(){
        float s = position.x, t = -position.y, kind = aD.w, W = aO.w, H = aD.x, ph = aD.y;
        vec3 base = aO.xyz;
        bool str = kind > .5 && kind < 1.5, jamb = kind > 2.5 && abs(aL.z) > .5;
        vec3 ax = (str || jamb) ? vec3(0., 0., 1.) : vec3(1., 0., 0.);
        vec3 nz = (str || jamb) ? vec3(aL.z, 0., 0.) : vec3(0., 0., 1.);
        if (kind > 1.5 && kind < 2.5) base.y -= 6. * (aL.w < -1.5 ? uTripU : .62 + .38 * sin(uTime * .21 + ph));
        if (abs(aL.w - uStrip.x) < .5) H *= 1. - uStrip.y;
        float gust = gustAt(base.z, base.x), lean = (str || kind > 2.5) ? 0. : aL.z, e = .02;
        // no two lengths hang alike: a skewed, curved hem and a little turn on the rope
        float hang = kind < .5 ? 1. : kind > 1.5 ? .7 : 0., yaw = (kind < .5 ? 1. : 0.) * .16 * sin(ph * 3.3) * W;
        H *= 1. + .05 * sin(s * 5. + ph) + (.05 + .16 * hang) * s * sin(ph * 9.) + .11 * hang * cos(s * 6.2832) * sin(ph * 4.3);
        float f0 = dispF(s, t, H, gust, ph, lean, kind, W), fs = dispF(s + e, t, H, gust, ph, lean, kind, W), ft = dispF(s, t + e, H, gust, ph, lean, kind, W);
        float gath = (kind > 1.5 && kind < 2.5) ? 1. - .17 * t - .05 * sin(t * 5. + ph) * t : 1.;           // a wet length hangs gathered, narrower toward its hem
        vec3 p = base + ax * (s * W * gath * (1. - .03 * min(abs(f0), 1.5))) - vec3(0., t * H, 0.) + nz * (f0 + s * yaw * t);
        p.y += f0 * f0 / (2. * max(t * H, .6)) * .8 - .09 * abs(sin(s * W * 3.9 + ph)) * (1. - t);
        if (str) p.z -= gust * pow(t + 1e-4, 1.5) * 3.;
        vec3 dps = ax * W + nz * ((fs - f0) / e + yaw * t), dpt = vec3(0., -H, 0.) + nz * ((ft - f0) / e + s * yaw);
        vN = normalize(cross(dpt, dps) + vec3(0., 0., 1e-5));
        vW = p; vCol = aC; vQ = vec4(s * W, t * H, t, kind); vWH = vec2(W, H);
        vI = vec4(mix(aL.x, aL.y, t), ph, aD.z, (ft - f0) / e / max(H, .1)); vSl = (fs - f0) / e / max(W, .1);
        vec4 mvPosition = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F + GLSL_YARD + /* glsl */`
      uniform vec3 uPale, uTrip[5];
      varying vec3 vW, vN, vCol; varying vec4 vQ; varying vec4 vI; varying vec2 vWH; varying float vSl;
      void main(){
        vec3 N = normalize(vN + vec3(0., 0., 1e-5)); if (!gl_FrontFacing) N = -N;
        vec2 q = vQ.xy; float t = vQ.z, kind = vQ.w, W2 = vWH.x * .5, H = vWH.y, seed = vI.y, pt = vI.z;
        float fq = fwidth(q.y) + fwidth(q.x), aa = fq * 1.5;
        vec3 alb = vCol; float wet = 0., trip = (kind > 1.5 && kind < 2.5) ? 1. : 0., wall = kind > 2.5 ? 1. : 0.;
        if (trip > .5) {                   // out of the vat: green only in its lowest metres, teal, then blue as the air takes it
          float h = vW.y + .5 + (vn2(q * vec2(.9, .3) + seed) - .5) * 1.3;
          alb = mix(uTrip[0], uTrip[1], smoothstep(.2, 1.5, h)); alb = mix(alb, uTrip[2], smoothstep(1.3, 3.2, h)); alb = mix(alb, uTrip[3], smoothstep(2.8, 5.6, h)); alb = mix(alb, uTrip[4], smoothstep(5., 10., h));
          wet = 1. - smoothstep(3., 12., h); pt = .1;
          // liquor still running down it: dark streaks sliding, darker where the cloth is gathered
          float strk = vn2(vec2(q.x * 4.1 + seed, q.y * .32 - uTime * .22)) * .65 + vn2(vec2(q.x * 11. + seed * 3., q.y * .7 - uTime * .5)) * .35;
          alb *= .62 * mix(1., .5, smoothstep(.42, .72, strk) * (.45 + .55 * wet));
        }
        float mott = fbm2(q * 1.3 + seed * 3.7);
        alb *= .8 + .4 * mott;
        float res = 0.;
        if (pt < .14) {
          float sc = mix(1.3, 2.3, fract(seed * .37)); vec2 g = q / sc + seed; vec2 id = floor(g); g.x += .5 * mod(id.y, 2.); vec2 f = fract(g) - .5; float r = length(f) * 1.5 * (1. + .06 * sin(atan(f.y, f.x + 1e-5) * 5. + id.x * 5. + id.y));
          res = (1. - smoothstep(.5, .54 + aa, r)) * smoothstep(.2, .24 + aa, r) * (.55 + .45 * vn2(vec2(atan(f.y, f.x + 1e-5) * 5., r * 9.))) + (1. - smoothstep(.07, .1 + aa, r));
        } else if (pt < .24) {
          float sx = abs(fract(q.x / .9 + seed) - .5) * .9;
          res = (1. - smoothstep(.06, .08 + aa, sx)) * (.55 + .45 * step(.3, fract(q.y * 2.3 + vn2(q * 2.))));
        } else if (pt < .33) {
          vec2 g = q / .62; g.y += .5 * mod(floor(g.x), 2.); vec2 f = fract(g) - .5; float r = length(f) * .62;
          res = 1. - smoothstep(.1, .13 + aa, r);
        }
        res = clamp(res, 0., 1.) * (1. - smoothstep(.12, .5, fq)) * (.6 + .4 * mott);
        alb = mix(alb, mix(alb * 1.6, uPale, .34), res * .8);
        float wv = sin(q.x * 150.) * sin(q.y * 150.) * (1. - smoothstep(.004, .02, fq));
        float slub = vn2(vec2(q.x * 2.5, q.y * 50.)) * .5 + vn2(vec2(q.x * 50., q.y * 2.5)) * .5;
        alb *= 1. + .1 * wv + .18 * (slub - .5) * (1. - smoothstep(.05, .3, fq));
        float hem = smoothstep(H - .22, H - .15, q.y), sel = smoothstep(W2 - .1, W2 - .05, abs(q.x)), top = 1. - smoothstep(.12, .2, q.y);
        float dbl = max(max(hem, sel), top);
        alb *= 1. - .3 * dbl;
        float lum = dot(alb, vec3(.3, .5, .2));
        float thin = mix(.42, 1.15, smoothstep(.01, .35, lum)) * (1. - .5 * dbl) * mix(1., 1.25, res) * (1. - .76 * trip);
        float lt = pow(vI.x + 1e-3, .62);
        vec3 sunL = uSunCol * mix(uFilt, vec3(1.), smoothstep(.15, .9, lt)) * lt;
        if (wall > .5) sunL = uSunCol * gateLit(vW);
        vec3 Ls = wall > .5 ? uGateSun.xyz : uSunDir;
        float ndl = dot(N, Ls), front = max(ndl, 0.), back = max(-ndl, 0.) * (1. - wall);
        vec3 amb = mix(uGndCol, uSkyCol, N.y * .5 + .5) * mix(uAmbShade, vec3(1.), smoothstep(.1, .8, lt)) * uAmbGain * .62;
        vec3 tcol = pow(alb + 1e-4, vec3(.86)); float tl = dot(tcol, vec3(.3, .5, .2)); tcol = max(mix(vec3(tl), tcol, 1.75 - .6 * trip), 0.);
        // drapery: one broad fold that holds at any distance, finer ones near; a belly that is lighter than the gathered top
        float plf = 1. - smoothstep(.3, 1.5, fq);
        float pl = (cos(q.x * 1.7 + seed * 3.) * .6 + (cos(q.x * 4.7 - seed) * .4 + cos(q.x * 9.3 + seed * 2.) * .15) * plf) * smoothstep(0., 1.2, q.y);
        float foldSh = (1. - .5 * clamp(abs(vI.w) * 1.4, 0., .6)) * (1. + clamp(vSl * (1.7 + 1.6 * trip) + pl * (.4 + .3 * trip + .25 * wall), -.5, .5)) * (.74 + .4 * sin(t * 2.7 + .25));
        vec3 c = alb * (sunL * (front * .8 + .05) + amb) * foldSh + tcol * sunL * (pow(back + 1e-4, .55) * .8 + front * .2) * thin * (.6 + .4 * foldSh);
        vec3 V = normalize(cameraPosition - vW + vec3(1e-5)), Hh = normalize(Ls + V + vec3(1e-5));
        // the sun itself, seen through the cloth, is a soft burning patch
        float thru = max(dot(-V, uSunDir), 0.); thru *= thru; thru *= thru; thru *= thru;
        c += min(tcol, vec3(1.)) * sunL * thin * step(ndl, 0.) * (thru * .22 + thru * thru * thru * .7) * (1. - wall);
        // the last cloths before the gate, against a low sun: the hem and the selvages burn gold
        float gEdge = max(smoothstep(H - .42, H - .07, q.y), smoothstep(W2 - .26, W2 - .04, abs(q.x))) * smoothstep(-214., -246., vW.z) * (1. - smoothstep(.5, .75, uSunDir.y));
        c += uSunCol * vec3(1., .78, .46) * gEdge * (.3 + .7 * max(dot(-V, uSunDir), 0.)) * (.35 + .65 * lt) * .44 * (1. - wall) * (1. - trip);
        // on the gatehouse the raking light catches every fold's edge
        c += alb * sunL * wall * pow(clamp(1. - abs(dot(N, V)), 0., 1.), 3.) * .6;
        float glaze = (1. - smoothstep(.03, .12, lum)) * .25 + wet * 1.2;
        c += sunL * pow(max(dot(N, Hh), 0.), 60.) * glaze * step(0., ndl);
        gl_FragColor = vec4(max(c, 0.), 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- packed earth: stains, footpaths, runnels, puddles
const GLSL_PIT = /* glsl */`
  vec3 pitAt(vec2 p){
    float k = clamp(floor((${ROW_Z0.toFixed(2)} - p.y) / ${ROW_DZ.toFixed(1)} + .5), 0., ${ROW_N.toFixed(1)}), zr = ${ROW_Z0.toFixed(2)} - ${ROW_DZ.toFixed(1)} * k;
    float six = (mod(k, 2.) > .5 || zr < -170. || k < .5) ? 1. : 0., xo = six * 5.75;
    float col = clamp(floor((p.x - xo) / 11.5 + .5), k > 19.5 ? -2. : six > .5 ? -3. : -2., k > 19.5 ? 1. : 2.);
    vec2 c = vec2(col * 11.5 + xo, zr); float d = length(p - c);
    if (length(c - vec2(0., -150.)) < 14.8) d = 1e3;
    return vec3(d, c);
  }`;
function groundMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: true,
    vertexShader: FOG_V + /* glsl */`
      varying vec3 vW;
      void main(){ vW = position; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F + GLSL_YARD + GLSL_PIT + /* glsl */`
      uniform vec3 uEarth, uStain, uReed;
      varying vec3 vW;
      void main(){
        vec2 p = vW.xz; vec3 pi = pitAt(p); float d = pi.x, dh = length(p - vec2(0., -150.));
        // what needs the neighbouring pixels (the two widths, the shade map's level) is taken before the holes are cut: past a discard it is not defined
        float fpx = fwidth(p.x) + fwidth(p.y);
        float crv = abs(fbm2(p * .8 + 20.) - .5), crw = fwidth(crv) + 1e-4;
        vec3 P3 = vec3(p.x, 0., p.y), sunT = sunAt(P3);
        if (d < 5.08 || dh < 8.6) discard;
        float store = smoothstep(.3, 1.4, p.y), yard = step(p.y, 0.);
        float fine = 1. - smoothstep(.03, .22, fpx);
        float mo = fbm2(p * .33 + 4.), fi = mix(.5, vn2(p * 6.) * .6 + vn2(p * 19.) * .4, fine);
        float peb = smoothstep(.8, .9, vn2(p * 11. + 50.)) * fine;
        float cr = (1. - smoothstep(.6, 1.6, crv / crw)) * (1. - smoothstep(.01, .06, crw));
        vec3 alb = uEarth * (.72 + .4 * mo) * (.82 + .32 * fi);
        float rf = (${ROW_Z0.toFixed(2)} - p.y) / ${ROW_DZ.toFixed(1)}, lz = abs(fract(rf) - .5) * ${ROW_DZ.toFixed(1)}, rk = floor(rf);
        float inRows = step(p.y, -9.5) * step(-278.5, p.y);
        float path = (1. - smoothstep(.7, 2.3, lz + 1.4 * (vn2(p * .3) - .5))) * inRows * (1. - smoothstep(34., 44., abs(p.x)));
        path = max(path, (1. - smoothstep(2., 5., abs(p.x + 1.5 * sin(p.y * .11)))) * smoothstep(-13., -5., p.y));
        path = max(path, smoothstep(-275., -282., p.y) * (.35 + .65 * mo));
        path *= yard;
        alb = mix(alb, uEarth * 1.3 * (.9 + .12 * fi), path * (.45 + .4 * mo));
        alb *= 1. - .35 * cr * (1. - path); alb = mix(alb, alb * .55 + .03, peb * .6);
        // the forecourt: the trodden way to the arch, damp and dry patches, fallen neem leaflets up to the threshold
        float gz = smoothstep(-274., -281., p.y) * yard, wx = abs(p.x + 1.2 * sin(p.y * .21));
        float way = (1. - smoothstep(1.5, 6.5, wx + 4. * (mo - .5))) * gz;
        alb *= mix(1., .52 + .9 * smoothstep(.32, .62, fbm2(p * .22 + 31.)), gz);
        alb = mix(alb, uEarth * 1.55 * (.8 + .4 * fi), way * .7);
        alb = mix(alb, vec3(.6, .5, .1), smoothstep(.68, .76, vn2(p * 4.1 + 17.) * (.6 + .4 * vn2(p * .4))) * smoothstep(-268., -276., p.y) * (1. - smoothstep(.12, .7, fpx)) * .9);
        float lipD = min(d - 5.3, dh - 8.7);
        float halo = exp(-max(lipD, 0.) / .62) * (.5 + .8 * mo);
        float splash = .4 * smoothstep(.66, .95, vn2(p * 1.6 + 9.) * .7 + .3 * vn2(p * 4.7 + 2.) + .22 * exp(-max(lipD, 0.) / 3.));
        float st = clamp(halo + splash * .7, 0., 1.) * step(p.y, -6.) * step(-279., p.y);
        alb = mix(alb, uStain * (.6 + .5 * fi), st * .62);
        // run-off runnels trickling along some of the lanes
        float on = max(step(.3, h11(rk + 3.)), step(19.5, rk)) * inRows * smoothstep(13., 17., dh) * (1. - smoothstep(30., 36., abs(p.x)));
        float sgn = h11(rk + 9.) > .5 ? 1. : -1.;
        float ac = (fract(rf) - .5) * ${ROW_DZ.toFixed(1)} + 1.1 * sin(p.x * .37 + rk * 2.) + .3 * sin(p.x * 1.3 + rk);
        float rw = .13 + .12 * vn2(vec2(p.x * .7, rk));
        float run = (1. - smoothstep(rw, rw + .09, abs(ac))) * on, bank = (1. - smoothstep(rw, rw + .8, abs(ac))) * on;
        alb = mix(alb, alb * .55 + uStain * .25, bank * .7);
        float flow = vn2(vec2(p.x * 3. - uTime * 1.5 * sgn, ac * 9.)) * .6 + vn2(vec2(p.x * 9. - uTime * 3.2 * sgn, ac * 20.)) * .4;
        // the store: reed mats down the middle, darker trodden earth
        if (store > 0.) {
          vec2 m = vec2((p.x + 10.5) / 7., p.y / 9.4), mf = fract(m);
          float inMat = step(abs(p.x), 10.5) * step(.012, mf.x) * step(mf.x, .988) * step(.01, mf.y) * step(mf.y, .99);
          float wea = .5 + .5 * sin(p.x * 16. + floor(p.y * 5.) * 3.1416), band = step(.86, mf.y) + step(mf.y, .14);
          vec3 reed = uReed * (.62 + .38 * wea) * (.8 + .3 * h21(floor(m) + 3.)) * mix(1., .55, band * step(.5, fract(p.x * 1.4)));
          alb = mix(alb, mix(alb * .8, reed, inMat * (.82 + .18 * mo)), store);
        }
        float wetK = uWet * yard;
        float pud = smoothstep(.5, .64, fbm2(p * .2 + 77.) + .1 * path) * wetK * smoothstep(.3, 1.5, lipD);
        alb *= 1. - .34 * wetK;
        float contact = 1. - .45 * exp(-max(lipD, 0.) * 1.6);
        contact *= 1. - .5 * exp(-max(48. - abs(p.x), 0.) * .3) * yard;
        vec3 amb = ambAt(vec3(0., 1., 0.), P3);
        // the forecourt in the gatehouse's shade: open sky and the sunlit earth beyond fill it, cool and readable
        float gate = gz * (1. - smoothstep(.05, .5, dot(sunT, vec3(.333))));
        amb *= 1. + .55 * gate; amb += uGndCol * uSunCol * .32 * gate;
        vec3 c = alb * (uSunCol * uSunDir.y * sunT + amb * contact);
        float pool = smoothstep(.5, .66, fbm2(p * .17 + vec2(uTime * .02, 3.) + .1 * sin(uTime * .4 + p.x * .3))) * smoothstep(-268., -276., p.y) * yard * (1. - smoothstep(.3, .8, dot(sunT, vec3(.333))));
        c += alb * uSunCol * pool * .34 * uGateSun.w;
        float op = openAt(P3);
        vec3 V = normalize(cameraPosition - vW + vec3(1e-5));
        vec3 R = normalize(vec3(-V.x, abs(V.y) + .02, -V.z) + vec3(.06 * (flow - .5), 0., .06 * (fi - .5)));
        vec3 skyR = skyAt(R) * mix(uAmbShade * .35, vec3(1.), op);
        float fr = .25 + .75 * pow(1. - abs(V.y), 3.);
        c = mix(c, skyR * (.45 + .4 * flow) + uStain * .1 * amb + uSunCol * sunT * step(.93, flow) * 1.2, run * .9);
        c = mix(c, skyR * fr + alb * amb * .3 + uSunCol * sunT * pow(max(dot(R, uSunDir), 0.), 300.) * 6., pud * .9);
        gl_FragColor = vec4(max(c, 0.), 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- the pits: worn lip, blue-black mirror, bronze foam
function pitGeometry() {
  const prof = [[4.47, -0.95], [4.49, -0.1], [4.6, 0.09], [4.92, 0.14], [5.2, 0.08], [5.42, -0.08]].reverse().map((q) => new THREE.Vector2(q[0], q[1]));
  const lip = new THREE.LatheGeometry(prof, 24), disc = new THREE.CircleGeometry(PIT_R, 24); disc.rotateX(-Math.PI / 2); disc.translate(0, PIT_Y, 0);
  const nl = lip.attributes.position.count, nd = disc.attributes.position.count, P = new Float32Array((nl + nd) * 3), N = new Float32Array((nl + nd) * 3), A = new Float32Array(nl + nd), I = [];
  P.set(lip.attributes.position.array); P.set(disc.attributes.position.array, nl * 3); N.set(lip.attributes.normal.array); N.set(disc.attributes.normal.array, nl * 3);
  A.fill(1, nl);
  for (const i of lip.index.array) I.push(i); for (const i of disc.index.array) I.push(i + nl);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('aPart', new THREE.BufferAttribute(A, 1)); g.setIndex(I);
  lip.dispose(); disc.dispose();
  return g;
}
function pitMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: true,
    vertexShader: FOG_V + /* glsl */`
      attribute float aPart; attribute float aSeed; attribute vec3 aTrip;
      varying vec3 vW, vL, vN, vT; varying vec2 vP, vC;
      void main(){ vL = position; vN = normal; vP = vec2(aPart, aSeed); vT = aTrip; vC = instanceMatrix[3].xz; vec4 w = instanceMatrix * vec4(position, 1.); vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F + GLSL_YARD + /* glsl */`
      uniform vec3 uTier[8], uFoam, uLiquor, uCement, uStain, uFarRefl, uTrip[5]; uniform vec4 uPlan; uniform vec2 uPlanB; uniform float uTripU;
      varying vec3 vW, vL, vN, vT; varying vec2 vP, vC;
      // uPlan: nave half-width, lowest canopy tier, the side taken in (0 none), what still hangs there; uPlanB: canopy share
      vec4 clothAt(vec3 h, float f){
        float tk = (h.y - 4.3) / 4.4, k = floor(tk);
        if (k < 0. || k > 7.) return vec4(0.);
        float can = step(h.z, -151.), ax = abs(h.x), nave = (1. - can) * step(ax, uPlan.x);
        float cell = floor(h.x / 7.9 + h11(f * 7. + k)), hc = h11(cell * 3.7 + f * 1.3 + k * 5.1);
        float ok = step(.14, fract(tk)) * step(28., length(h.xz - vec2(0., -150.))) * step(ax, 46.5);
        ok *= mix(1., step(uPlan.y, k) * step(hc, uPlanB.x), nave);
        ok *= mix(1., step(11.8, ax), can);
        ok *= mix(1., step(hc, uPlan.w), step(.5, h.x * uPlan.z) * (1. - nave));
        ok *= step(.04, fract(h.x / 7.9 + h11(f * 7. + k))) * (1. - step(39.5, f) * (1. - step(2., k)));
        vec3 tc = uTier[int(k)] * (.8 + .4 * h11(cell + f * 3.1 + k));
        float lk = mix(.12, 1., k / 7.);
        vec3 tcol = pow(tc + 1e-4, vec3(.8));
        return vec4(tc * uSkyCol * 1.1 + tcol * uSunCol * lk * .42 * mix(.45, 1.1, smoothstep(.02, .35, tc.b)), ok);
      }
      vec3 hallRefl(vec3 P, vec3 R){
        vec3 sky = skyAt(R); float dz = abs(R.z) < 1e-3 ? -1e-3 : R.z;
        float f0 = (-14. - P.z) / 6.3, stepF = dz < 0. ? 1. : -1.;
        float fi = dz < 0. ? floor(f0) + 1. : ceil(f0) - 1.;
        vec3 acc = vec3(0.); float tr = 1., lastY = 0., lastX = P.x;
        for (int i = 0; i < 6; i++) {
          float ff = fi + stepF * float(i);
          if (ff < 0. || ff > 40.) { lastY = 99.; break; }
          vec3 h = P + R * ((-14. - 6.3 * ff - P.z) / dz); lastY = h.y; lastX = h.x;
          if (h.y > 39.6) break;
          vec4 c = clothAt(h, ff); acc += tr * c.a * c.rgb; tr *= 1. - c.a;
        }
        // what lies beyond the last row looked at: open sky down the nave and over the side taken in, far cloth elsewhere
        float open = max(step(abs(lastX), uPlan.x) * .9, step(.5, lastX * uPlan.z) * (1. - uPlan.w) * .85);
        vec3 far = mix(uFarRefl, sky, max(smoothstep(30., 39.6, lastY), open));
        return acc + tr * far;
      }
      float ringAt(vec2 p, vec2 c, float age){ float d = length(p - c), r = age * 1.6;
        return sin((d - r) * 14.) * exp(-abs(d - r) * 3.) * (1. - age) * smoothstep(0., .08, age); }
      float hgtAt(vec2 p, float seed){
        float h = 0.;
        for (int i = 0; i < 3; i++) {
          float fi = float(i), per = 2.2 + h11(seed * 7. + fi) * 2.4, tt = uTime / per + h11(seed * 3. + fi * 5.);
          vec2 c = (h22(vec2(fi + seed * 13., floor(tt))) - .5) * 6.;
          h += ringAt(p, c, fract(tt)) * .55;
        }
        return h + (fbm2(p * .8 + vec2(uTime * .07, -uTime * .05) + seed * 9.) - .5) * .45;
      }
      void main(){
        vec3 V = normalize(cameraPosition - vW + vec3(1e-5)); float seed = vP.y; vec2 p = vL.xz; float r = length(p);
        vec3 c;
        if (vP.x < .5) {
          vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
          float sp = vn3(vW * 7.) * .5 + vn3(vW * 23.) * .5, wear = fbm2(vW.xz * .5 + 9.);
          float an = atan(p.y, p.x + 1e-5), joint = smoothstep(.0, .02, abs(fract(an / 6.2832 * 7. + seed) - .5) * 2. * 3.1416 * r / 7. * .2);
          vec3 alb = uCement * (.78 + .36 * sp) * mix(.6, 1., joint);
          alb = mix(alb, alb * 1.12 + .02, smoothstep(.45, .7, wear) * .5);
          float st = smoothstep(4.95, 4.55, r) * (.55 + .45 * wear) + smoothstep(.55, .9, vn2(vec2(an * 9., seed * 5.))) * .22;
          if (vL.y < -.06) st = 1.;
          alb = mix(alb, uStain * .55, clamp(st, 0., 1.) * .86);
          if (vL.y < -.06) alb *= mix(.25, .7, smoothstep(-.9, -.06, vL.y));
          alb *= 1. - .4 * uWet;
          float ndl = max(dot(N, uSunDir), 0.);
          c = alb * (uSunCol * sunAt(vW) * ndl + ambAt(N, vW));
          c += uSunCol * sunAt(vW) * uWet * .15 * pow(max(dot(reflect(-V, N), uSunDir), 0.), 30.);
        } else {
          float h0 = hgtAt(p, seed), hx = hgtAt(p + vec2(.07, 0.), seed), hz = hgtAt(p + vec2(0., .07), seed);
          vec3 N = normalize(vec3(-(hx - h0) / .07 * .06, 1., -(hz - h0) / .07 * .06));
          vec3 R = reflect(-V, N); R.y = abs(R.y) + 1e-3; R = normalize(R);
          float fres = .13 + .87 * pow(clamp(1. - dot(N, V), 0., 1.), 3.4);
          vec3 sunT = sunAt(vW), refl = hallRefl(vW, R); vec4 tripC = vec4(0.);
          if (vT.x > 0.) {                 // the wet length on this pit's tripod, upside down in its own liquor
            float m = vT.z > .5 ? uTripU : .62 + .38 * sin(uTime * .21 + vT.y), top = 15. - 6. * m, bot = max(top - 12.5, -.5);
            float rz = abs(R.z) < 1e-3 ? 1e-3 : R.z, tz = (vC.y - vW.z) / rz;
            vec3 h = vW + R * max(tz, 0.);
            float on = step(0., tz) * (1. - smoothstep(vT.x - .12, vT.x + .12, abs(h.x - vC.x))) * smoothstep(bot - .15, bot + .15, h.y) * (1. - smoothstep(top - .2, top + .1, h.y));
            float hh = h.y + .5;
            vec3 tc = mix(uTrip[0], uTrip[1], smoothstep(.2, 1.5, hh)); tc = mix(tc, uTrip[2], smoothstep(1.3, 3.2, hh)); tc = mix(tc, uTrip[3], smoothstep(2.8, 5.6, hh)); tc = mix(tc, uTrip[4], smoothstep(5., 10., hh));
            tc *= .55 + .3 * vn2(vec2((h.x - vC.x) * 4.1, h.y * .32 - uTime * .22));
            tripC = vec4(tc * (uSkyCol * 1.5 + uSunCol * sunT * .3), on);
            refl = mix(refl, tripC.rgb, on * .92);
          }
          float sg = max(dot(R, uSunDir), 0.);
          refl += uSunCol * sunT * (pow(sg, 700.) * 12. + pow(sg, 90.) * .5);
          float ang = atan(p.y, p.x + 1e-5) + uTime * (.05 + .04 * h11(seed * 5.)) + r * .14;
          vec2 fp = vec2(cos(ang), sin(ang)) * r;
          float fo = fbm2(fp * .6 + seed * 31.) + .35 * vn2(fp * 2.3);
          float raft = smoothstep(.98, 1.08, fo + .2 * smoothstep(1.4, 3.2, r) - .15 * smoothstep(3.6, 4.4, r) + .1 * (vn2(fp * 6.) - .5));
          raft *= smoothstep(.7, 1.8, r);
          raft = max(raft, smoothstep(4.15, 4.45, r + (vn2(p * 3.) - .5) * .5) * .7 * smoothstep(.3, .6, vn2(fp * 1.7 + 4.)));
          float bub = vn2(fp * 14.) * .6 + vn2(fp * 37.) * .4;
          vec3 amb = ambAt(vec3(0., 1., 0.), vW) * 1.2;
          vec3 foamC = uFoam * (.3 + 1.1 * bub * bub) * (uSunCol * sunT * (max(dot(N, uSunDir), 0.) * .8 + .12) + amb);
          foamC += uSunCol * sunT * step(.86, bub) * .3 * vec3(1., .8, .5);
          // deep indigo liquor: it tints what it mirrors except at a glancing angle
          c = mix(uLiquor * (uSunCol * sunT * .3 + amb), refl * mix(vec3(.4, .5, 1.), vec3(1.), fres * fres), clamp(fres * .85 + .05, 0., 1.));
          c = mix(c, tripC.rgb * .8, tripC.a * .5);
          // the vat's copper skin: a thin metallic film drifting between the foam, copper to violet with the angle
          float skin = smoothstep(.56, .74, fbm2(fp * .8 + seed * 17. + 5.) + .12 * (vn2(fp * 5.) - .5)) * smoothstep(.4, 1.5, r) * (1. - raft);
          float ir = clamp(1. - dot(N, V), 0., 1.);
          vec3 film = mix(vec3(.92, .4, .13), vec3(.5, .22, .62), ir * ir) * (.75 + .5 * vn2(fp * 9. + 3.));
          c = mix(c, film * (refl * .5 + amb * .3 + uSunCol * sunT * (.1 + .5 * pow(sg, 60.))), skin * .8);
          c = mix(c, foamC + refl * .06, raft * .9);
        }
        gl_FragColor = vec4(max(c, 0.), 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- masts (instanced palm trunks) and tarred ropes (ribbons)
function mastGeometry() {
  const acc = new Acc(), col = new THREE.Color(1, 1, 1), cf = (t, a, out) => out.copy(col);
  addTube(acc, V3(0, -0.3, 0), V3(0, 42, 0), { rings: 6, radial: 7, radiusFn: (t) => lerp(0.56, 0.3, t) * (1 + 0.3 * Math.exp(-t * 40)), colorFn: cf });
  for (const s of [-1, 1]) addTube(acc, V3(0, 41.7, 0), V3(s * 0.55, 43.3, s * 0.2), { rings: 2, radial: 5, cap: true, radiusFn: (t) => lerp(0.24, 0.1, t), colorFn: cf });
  return acc.build();
}
function mastMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: true,
    vertexShader: FOG_V + /* glsl */`
      attribute vec4 aLt;
      varying vec3 vW, vN; varying vec2 vUv; varying float vId, vLt;
      void main(){ vUv = uv; vec4 w = instanceMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(instanceMatrix) * normal + vec3(0., 1e-5, 0.));
        float y = w.y; vLt = mix(mix(aLt.x, aLt.y, smoothstep(4., 14., y)), mix(aLt.z, aLt.w, smoothstep(24., 34., y)), smoothstep(14., 24., y)); vLt = mix(vLt, 1., smoothstep(36., 41., y));
        vId = instanceMatrix[3].x * .37 + instanceMatrix[3].z * .11;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F + GLSL_YARD + /* glsl */`
      uniform vec3 uTrunk, uRope, uStain;
      varying vec3 vW, vN; varying vec2 vUv; varying float vId, vLt;
      void main(){
        vec3 N = normalize(vN + vec3(1e-5, 0., 0.)); float y = vUv.y, fw = fwidth(y) + 1e-4;
        float j = vn2(vec2(vUv.x * 5., floor(y / .9) + vId)) * .35, ring = fract(y / .9 + j + .08 * sin(vUv.x * 6.2832));
        float scar = mix(.8, smoothstep(.0, .1 + fw, ring) * (1. - smoothstep(.82, .98, ring)), 1. - smoothstep(.2, .6, fw));
        float fib = vn2(vec2(vUv.x * 46., y * 1.3)) * .6 + vn2(vec2(vUv.x * 110., y * 3.)) * .4, mot = fbm2(vec2(vUv.x * 4. + vId, y * .6));
        vec3 alb = uTrunk * mix(.52, 1., scar) * (.74 + .42 * fib) * (.8 + .4 * mot) * mix(.6, 1., smoothstep(0., 22., y));
        // rope lashings where each tier's rope is made fast
        float ty = (y - 8.7) / 4.4, lash = (1. - smoothstep(.07, .09, abs(fract(ty + .5) - .5))) * step(-.2, ty) * step(ty, 7.2);
        float coil = .6 + .4 * sin(y * 70.) * (1. - smoothstep(.02, .1, fw));
        alb = mix(alb, uRope * coil, lash);
        alb = mix(alb, uStain * .5, (1. - smoothstep(.2, 3., y)) * (.4 + .3 * sin(vUv.x * 19. + vId)));
        float ndl = dot(N, uSunDir), dif = smoothstep(-.12, .5, ndl) * max(ndl * .85 + .15, 0.);
        vec3 V = normalize(cameraPosition - vW + vec3(1e-5));
        vec3 amb = ambAt(N, vW);
        vec3 sunL = uSunCol * mix(uFilt, vec3(1.), smoothstep(.15, .9, vLt)) * vLt;
        float fr = clamp(1. - dot(N, V), 0., 1.);
        vec3 c = alb * (sunL * dif + amb * 1.25) + alb * amb * fr * fr * fr * .5;
        // a rim of light down the sunward edge, strongest looking toward the sun
        c += (alb * 1.5 + .03) * sunL * fr * fr * (.25 + .75 * smoothstep(-.25, .45, ndl)) * (.45 + .55 * smoothstep(-.2, .7, dot(-V, uSunDir)));
        gl_FragColor = vec4(max(c, 0.), 1.);
        #include <fog_fragment>
      }`,
  });
}
// ribbons widened in view space so they never fall under ~1.5 px
function ribbonMesh(segs, U, color) {
  const n = segs.length, P = new Float32Array(n * 12), D = new Float32Array(n * 12), S = new Float32Array(n * 4), I = [];
  segs.forEach(([a, b], i) => {
    const d = b.clone().sub(a).normalize();
    for (let k = 0; k < 4; k++) { const q = k < 2 ? a : b; P.set([q.x, q.y, q.z], i * 12 + k * 3); D.set([d.x, d.y, d.z], i * 12 + k * 3); S[i * 4 + k] = k % 2 ? 1 : -1; }
    I.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 1, i * 4 + 3, i * 4 + 2);
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aDir', new THREE.BufferAttribute(D, 3)); g.setAttribute('aSide', new THREE.BufferAttribute(S, 1)); g.setIndex(I);
  const m = new THREE.ShaderMaterial({
    uniforms: { ...U, uRib: { value: color } }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: FOG_V + /* glsl */`
      attribute vec3 aDir; attribute float aSide; uniform vec2 uPx; varying float vA; varying vec3 vW;
      void main(){ vW = position; vec4 mvPosition = viewMatrix * vec4(position, 1.); vec3 tv = mat3(viewMatrix) * aDir;
        vec2 n2 = normalize(vec2(-tv.y, tv.x) + vec2(1e-5, 0.)); float w = max(.075, -mvPosition.z * uPx.y * .85);
        mvPosition.xy += n2 * aSide * w; vA = clamp(.075 / w * 1.6, .16, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F + GLSL_YARD + /* glsl */`
      uniform vec3 uRib; varying float vA; varying vec3 vW;
      void main(){ vec3 c = uRib * (uSunCol * sunAt(vW) * .5 + ambAt(vec3(0., 1., 0.), vW));
        gl_FragColor = vec4(max(c, 0.), vA);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 2;
  return mesh;
}

// drips from the wet lengths on the tripods: bright threads falling from the hem to the liquor (none while the hem is under it)
function dripMesh(tripods, U, rng) {
  const per = 18, n = tripods.length * per, P = new Float32Array(n * 12), A = new Float32Array(n * 16), B = new Float32Array(n * 8), I = [];
  tripods.forEach((p, ti) => { for (let j = 0; j < per; j++) {
    const i = ti * per + j, x = p.x + (rng() - 0.5) * p.tw * 0.62, z = p.z + rng.range(-0.3, 0.3), ph = rng(), sp = rng.range(0.55, 0.95);
    for (let k = 0; k < 4; k++) { P.set([x, 0, z], i * 12 + k * 3); A.set([ph, sp, p.tph * 40, ti === 0 ? 1 : 0], i * 16 + k * 4); B.set([k % 2 ? 1 : -1, k < 2 ? 0 : 1], i * 8 + k * 2); }
    I.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 1, i * 4 + 3, i * 4 + 2);
  } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aDr', new THREE.BufferAttribute(A, 4)); g.setAttribute('aCo', new THREE.BufferAttribute(B, 2)); g.setIndex(I);
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: GLSL_COMMON + /* glsl */`
      attribute vec4 aDr; attribute vec2 aCo; uniform vec2 uPx; uniform float uTripU; varying float vA;
      void main(){
        float m = aDr.w > .5 ? uTripU : .62 + .38 * sin(uTime * .21 + aDr.z), hem = 2.5 - 6. * m;
        float tt = fract(uTime * aDr.y * .8 + aDr.x * 7.), y = hem - tt * tt * (hem + .5), len = min(.3 + 1.2 * tt, max(hem - y, 0.) + .05);
        vec4 mv = viewMatrix * vec4(position.x, max(y + aCo.y * len, -.5), position.z, 1.);
        float w = max(.026, -mv.z * uPx.y * 1.1); mv.x += aCo.x * w;
        vA = smoothstep(.1, .5, hem) * smoothstep(0., .08, tt) * (1. - smoothstep(.92, 1., tt)) * clamp(.022 / w * 1.6, .25, 1.) * (.5 + 1.1 * aCo.y);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      varying float vA;
      void main(){ gl_FragColor = vec4(max((uSkyCol * 1.3 + uSunCol * .3) * vA, 0.), 1.); }`,
  }));
  mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}

// ---------------------------------------------------------------- the lid of haze
// discDir: where the sun's disc and halo are drawn. At noon that is lower and nearer the axis than the sun that lights the
// yard (which stands 62 degrees up, above every frame), so the white disc in its wide halo hangs behind the hero's drum.
function skyDome(U, disc, halo, discDir, pearl = 0) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...U, uDisc: { value: disc }, uHalo: { value: halo }, uPearl: { value: pearl }, uDiscDir: { value: discDir } }, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      uniform float uDisc, uHalo, uPearl; uniform vec3 uDiscDir; varying vec3 vD;
      void main(){ vec3 d = normalize(vD + vec3(0., 1e-5, 0.)); float s = max(dot(d, uDiscDir), 0.);
        vec3 c = skyAt(vec3(d.x, max(d.y, 0.), d.z));
        // noon: warm white where the dust lies along the walls, pearl blue by a third of the way up, deeper overhead
        float hy = clamp(d.y, 0., 1.);
        c = mix(c, mix(vec3(.30, .44, .80), vec3(.17, .31, .74), smoothstep(.3, .95, hy)), uPearl * smoothstep(.03, .3, hy));
        c *= .95 + .1 * fbm2(d.xz * 2.2 / (abs(d.y) + .35) + uTime * .004);
        c += uSunCol * (smoothstep(.99955, .99985, s) * uDisc + pow(s, 420.) * .5 + pow(s, 40.) * .07);
        c += uSunCol * uHalo * (s * s * s * s * s * s * .06 + pow(s, 22.) * .2 + pow(s, 120.) * .3);          // the wide white halo of a harmattan noon
        gl_FragColor = vec4(max(c, 0.), 1.); }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 12), m); mesh.frustumCulled = false; mesh.renderOrder = -1;
  return mesh;
}

// ---------------------------------------------------------------- everything built: walls, gate, store, props (one merged mesh)
// aAnim = (kind, phase, material). kinds: 1 hung thing swinging about aPiv, 2 top folds lifting in the draught,
// 3 stirring pole rocking, 4 dipper turning afloat, 5 perched crow bobbing.
// materials (the hero's ids, so its helpers can be used): 0 palm trunk / round timber, 1 rope, raffia and thatch,
// 2 cement, 3 clay and gourd, 4 stone, 5 planks, 6 folded cloth, 7 unlit (colour is light), 8 feathers and plain
// things, 9 mud wall.
function solidMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: true, vertexColors: true,
    vertexShader: FOG_V + GLSL_COMMON + /* glsl */`
      attribute vec3 aAnim, aPiv; uniform vec4 uGust;
      varying vec3 vN, vW, vCol; varying vec2 vUv; varying float vMat;
      vec2 rot(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(p.x * c - p.y * s, p.x * s + p.y * c); }
      void main(){
        vec3 p = position, n = normal; float k = aAnim.x, ph = aAnim.y;
        if (k > .5 && k < 1.5) { p -= aPiv; float a1 = .10 * sin(uTime * 1.1 + ph) + .05 * sin(uTime * 2.3 + ph * 1.7), a2 = .09 * sin(uTime * .8 + ph * 1.3);
          // the hanks pegged on the gatehouse are thrown sideways when the gust reaches it
          float gd = aPiv.z - uGust.x, gg = uGust.y * smoothstep(-5., 4., gd) * exp(-max(gd, 0.) / max(uGust.z, 1.)) * (1. - smoothstep(-287., -283., aPiv.z));
          a1 += gg * (.5 + .25 * sin(uTime * 6. + ph)) * (sin(ph * 3.) > 0. ? 1. : -1.); a2 = a2 * (1. + 2. * gg) - .12 * gg;
          p.xy = rot(p.xy, a1); n.xy = rot(n.xy, a1); p.yz = rot(p.yz, a2); n.yz = rot(n.yz, a2); p += aPiv; }
        else if (k > 1.5 && k < 2.5) { float w = max(p.y - aPiv.y, 0.), wave = max(sin(uTime * 1.5 + ph + p.x * .7 + p.z * .45), 0.);
          float edge = smoothstep(.3, 1.6, distance(p.xz, aPiv.xz)); p.y += w * wave * edge * 1.1; p.z -= w * wave * edge * .5; }
        else if (k > 2.5 && k < 3.5) { p -= aPiv; float a1 = .06 * sin(uTime * .9 + ph), a2 = .045 * sin(uTime * .67 + ph * 1.7);
          p.xy = rot(p.xy, a1); n.xy = rot(n.xy, a1); p.yz = rot(p.yz, a2); n.yz = rot(n.yz, a2); p += aPiv; }
        else if (k > 3.5 && k < 4.5) { p -= aPiv; float a = uTime * .22 + ph; p.xz = rot(p.xz, a); n.xz = rot(n.xz, a); p += aPiv;
          p.y += .035 * sin(uTime * 1.1 + ph); p.xz += vec2(cos(uTime * .09 + ph), sin(uTime * .09 + ph)) * .6; }
        else if (k > 4.5) { p -= aPiv; float a = .1 * sin(uTime * 1.7 + ph) + .5 * pow(max(sin(uTime * .55 + ph), 0.), 10.); p.yz = rot(p.yz, a); n.yz = rot(n.yz, a); p += aPiv; }
        vUv = uv; vMat = aAnim.z; vCol = color; vW = p; vN = n;
        vec4 mvPosition = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F + GLSL_YARD + /* glsl */`
      uniform vec3 uStain;
      varying vec3 vN, vW, vCol; varying vec2 vUv; varying float vMat;
      // the moulded relief of the mud walls, as a height: the interlace band, its frame, a row of lozenges; the
      // gatehouse (gate > 0) wears a second, larger interlace under its parapet
      float wallRelief(vec2 q, float gate){
        float by = (q.y - 12.4) / 1.1, s1 = abs(by - sin(q.x * 1.4)), s2 = abs(by + sin(q.x * 1.4));
        float inter = (1. - smoothstep(.12, .3, min(s1, s2))) * step(abs(by), 1.45);
        float frame = 1. - smoothstep(.0, .14, abs(abs(by) - 1.55));
        float lz = abs(fract(q.x / 2.2) - .5) * 2.2, lo = (q.y - 5.2) / 1.2;
        float loz = (1. - smoothstep(.0, .12, abs(abs(lz) / 1.1 + abs(lo) - .8))) * step(abs(lo), 1.);
        float r = max(max(inter, frame), loz * .8);
        float gy = (q.y - 21.25) / .86, g1 = abs(gy - sin(q.x * 1.05)), g2 = abs(gy + sin(q.x * 1.05));
        float gi = (1. - smoothstep(.15, .36, min(g1, g2))) * step(abs(gy), 1.5), gf = 1. - smoothstep(.0, .17, abs(abs(gy) - 1.6));
        return max(r, max(gi, gf) * gate);
      }
      void main(){
        vec3 N = normalize(vN + vec3(1e-5, 0., 0.)); if (!gl_FrontFacing) N = -N;
        vec3 alb = vCol; float m = vMat, bump = 0., gloss = 0., fw = fwidth(vUv.y) + 1e-4, rsh = 0.;
        if (m > 6.5 && m < 7.5) { gl_FragColor = vec4(vCol, 1.); return; }
        float gk = gateZone(vW); vec3 Ld = normalize(mix(uSunDir, uGateSun.xyz, gk));
        if (m > 8.5) {                      // mud wall: courses, moulded interlace band, rain streaks, indigo splash at the foot
          float al = abs(N.x) > abs(N.z) ? vW.z : vW.x; vec2 q = vec2(al, vW.y);
          float mo = fbm2(q * .22 + 3.), gr = vn2(q * 5.) * .6 + vn2(q * 17.) * .4;
          float course = smoothstep(.0, .12, abs(fract(q.y / .9 + .15 * vn2(vec2(q.x * .3, floor(q.y / .9)))) - .5));
          float streak = smoothstep(.5, .9, vn2(vec2(q.x * 1.7, q.y * .06 + 2.))) * smoothstep(1., 16., q.y);
          float wf = 1. - smoothstep(.06, .4, fwidth(q.x) + fwidth(q.y)), upr = step(abs(N.y), .5), rl0 = wallRelief(q, gk);
          float relief = rl0 * upr * wf; course = mix(1., course, wf); gr = mix(.5, gr, wf);
          // the shadow each moulding throws along the light: long when the sun rakes the wall
          float Ln = dot(N, Ld); vec2 l2 = abs(N.x) > abs(N.z) ? vec2(Ld.z, Ld.y) : vec2(Ld.x, Ld.y);
          if (Ln > .03) { vec2 d2 = l2 * clamp(.13 / Ln, .12, .8); rsh = clamp(max(wallRelief(q + d2, gk), wallRelief(q + d2 * .45, gk)) - rl0, 0., 1.) * upr * wf; }
          alb *= (.75 + .4 * mo) * (.85 + .3 * gr) * mix(.84, 1., course);
          alb = mix(alb, alb * vec3(.6, .58, .6), streak * (.55 + .45 * uWet));
          alb = mix(alb, uStain * .5, (1. - smoothstep(.0, 2.6, q.y + mo * 1.5)) * .45 * step(vW.z, 0.));
          alb *= 1. + .28 * relief; alb *= 1. - .25 * uWet;
          bump = (gr - .5) * .5 + relief * (1.3 + 1.3 * gk) + (course - 1.) * .4;
        } else if (m < .5) {                // palm trunk
          float j = vn2(vec2(vUv.x * 5., floor(vUv.y / .9))) * .35, ring = fract(vUv.y / .9 + j + .08 * sin(vUv.x * 6.2832));
          float scar = mix(.8, smoothstep(.0, .10 + fw, ring) * (1. - smoothstep(.82, .98, ring)), 1. - smoothstep(.2, .6, fw));
          float fib = vn2(vec2(vUv.x * 46., vUv.y * 1.3)) * .6 + vn2(vec2(vUv.x * 110., vUv.y * 3.)) * .4, mot = fbm2(vec2(vUv.x * 4., vUv.y * .6));
          alb *= mix(.52, 1., scar) * (.74 + .42 * fib) * (.8 + .4 * mot); bump = (scar - .5) * .5 + (fib - .5) * .3;
        } else if (m < 1.5) {               // rope, raffia, thatch: laid strands
          float tf = 1. - smoothstep(.12, .45, fw * 9.), tw = sin((vUv.x * 3. + vUv.y * 9.) * 6.2832) * tf, fib = vn2(vec2(vUv.x * 60., vUv.y * 30.));
          alb *= (.62 + .38 * smoothstep(-.6, .7, tw)) * (.8 + .35 * fib * tf); bump = tw * .4;
        } else if (m > 2.5 && m < 3.5) {    // clay, gourd: speckle, soot, a soft shine
          float sp = vn3(vW * 6.) * .5 + vn3(vW * 21.) * .5; alb *= .8 + .35 * sp; alb = mix(alb, alb * .5, smoothstep(.55, .8, vn3(vW * 1.7 + 5.)) * .5);
          bump = (sp - .5) * .25; gloss = .25;
        } else if (m > 5.5 && m < 6.5) {    // folded cloth: each slab one folded length, its fold lines down the sides, beaten glaze on the dark ones
          float side = step(abs(N.y), .7), fy = vUv.y, id = floor(fy), ff = fract(fy);
          float h = h11(id * 1.37 + floor(vCol.b * 97.));
          float lumA = dot(alb, vec3(.3, .5, .2));
          alb *= mix(1., .84 + .32 * h, side);
          float tf = 1. - smoothstep(.1, .5, fwidth(fy));
          float crease = mix(1., smoothstep(.0, .12, ff) * (1. - smoothstep(.88, 1., ff)), side);
          alb *= mix(1., mix(.74, 1., crease), tf); bump = crease * .6 * tf * side;
          float wq = vW.x * 40. + vW.z * 40., wf = 1. - smoothstep(.25, 1.1, fwidth(wq));
          float wv = mix(.5, vn2(vec2(wq, vW.y * 3.)), wf); alb *= (.9 + .2 * wv) * (.9 + .2 * vn2(vW.xz * 1.3 + vW.y));
          gloss = (1. - smoothstep(.02, .1, lumA)) * .9;
        } else if (m < 4.5) {               // stone, cement
          float sp = vn3(vW * 7.) * .6 + vn3(vW * 23.) * .4; alb *= .75 + .45 * sp; bump = (sp - .5) * .4;
        } else if (m < 5.5) {               // planks: grain along v, seams across u
          float seam = abs(fract(vUv.x * 6.) - .5), sm = smoothstep(.0, .05, seam), st = h11(floor(vUv.x * 6.) + 3.);
          float gr = vn2(vec2(vUv.x * 60., vUv.y * 1.6 + st * 9.)) * .6 + vn2(vec2(vUv.x * 20., vUv.y * .5)) * .4;
          alb *= mix(.4, 1., sm) * (.72 + .5 * gr) * (.82 + .3 * st); bump = (gr - .5) * .3 + (sm - 1.) * .6;
        } else { float sp = vn3(vW * 9.); alb *= .85 + .3 * sp; gloss = .2; }
        N = normalize(N + (dFdx(bump) * cross(N, vec3(0., 1., 0.)) + vec3(0., 1., 0.) * dFdy(bump)) * 2.5 + vec3(0., 1e-5, 0.));
        vec3 V = normalize(cameraPosition - vW + vec3(1e-5));
        float ndl = dot(N, Ld), dif = smoothstep(-.12, .5, ndl) * max(ndl * .85 + .15, 0.);
        vec3 sunT = sunAt(vW), amb = ambAt(N, vW);
        if (gk > 0.) sunT = mix(sunT, vec3(gateLit(vW)), gk);
        float ground = mix(.55, 1., smoothstep(0., 2.2, vW.y));          // contact darkening toward the earth
        vec3 c = alb * (uSunCol * sunT * dif * (1. - .88 * rsh) + amb * ground * (1. - .32 * rsh));
        float fr = clamp(1. - dot(N, V), 0., 1.);
        c += alb * amb * fr * fr * fr * .35;
        c += (alb * 1.4 + .02) * uSunCol * sunT * fr * fr * (.2 + .8 * smoothstep(-.25, .45, ndl)) * (.4 + .6 * smoothstep(-.2, .7, dot(-V, Ld))) * (m < .5 ? 1. : .35);
        vec3 Hh = normalize(Ld + V + vec3(1e-5));
        c += (uSunCol * sunT * step(0., ndl) + amb * 1.5) * pow(max(dot(N, Hh), 0.), 26.) * gloss;
        gl_FragColor = vec4(max(c, 0.), 1.);
        #include <fog_fragment>
      }`,
  });
}

const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
const xf = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(V3(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), V3(sx, sy, sz));
// a box with eased corners and a little wobble (mud, bales, stacks). o: colorFn | color, mat, round, wob, taper, noise, kind, piv, phase, seg
function addBlock(acc, cx, cy, cz, sx, sy, sz, o = {}) {
  const sg = o.seg || [3, 3, 3], g = new THREE.BoxGeometry(sx, sy, sz, sg[0], sg[1], sg[2]), pa = g.attributes.position;
  const rd = o.round ?? 0.12, wob = o.wob || 0, tp = o.taper ?? 1, n = o.noise;
  for (let i = 0; i < pa.count; i++) {
    let x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
    const ux = Math.abs(x) / (sx / 2), uy = Math.abs(y) / (sy / 2), uz = Math.abs(z) / (sz / 2);
    const corner = (ux > 0.99 ? 1 : 0) + (uy > 0.99 ? 1 : 0) + (uz > 0.99 ? 1 : 0);
    if (corner >= 2) { const k = rd * (corner - 1); if (ux > 0.99) x -= Math.sign(x) * k; if (uy > 0.99) y -= Math.sign(y) * k; if (uz > 0.99) z -= Math.sign(z) * k; }
    const ty = y / sy + 0.5, tk = lerp(1, tp, ty); x *= tk; z *= tk;
    if (wob && n) { const w = wob * n.n3((cx + x) * 0.35, (cy + y) * 0.35, (cz + z) * 0.35); x += w * (ux > 0.9 ? 1 : 0.3); z += w * (uz > 0.9 ? 1 : 0.3); if (uy > 0.9 && y > 0) y += w * 0.6; }
    pa.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  acc.add(g, xf(cx, cy, cz, 0, o.ry || 0, 0), o);
}
const lathe = (acc, prof, segs, m, o) => acc.add(new THREE.LatheGeometry(prof.map((q) => new THREE.Vector2(q[0], q[1])), segs), m, o);

export default {
  id: 'indigo-pits',
  name: 'The Blue Yard',
  category: 'interior',
  weirdness: 0.1,
  media: ['air', 'interior'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const busy = clamp(vary.density ?? 1, 0.7, 1.3);
    const hour = vary.hour || 'any';
    let lookName = hour === 'night' ? 'night' : hour === 'golden' ? 'evening' : hour === 'dawn' ? 'rain' : hour === 'day' ? 'noon' : null;
    if (!lookName) { const r = rng.fork('yard-look')(); lookName = r < 0.4 ? 'noon' : r < 0.72 ? 'evening' : 'rain'; }
    const L = LOOKS[lookName], castRng = rng.fork('cast');
    const whiteDay = castRng() < 0.3, egrets = castRng() < 0.35, rare = !!vary.rare;
    const pal = { haze: C(PAL[0]), ochre: C(PAL[1]), deep: C(PAL[2]), blue: C(PAL[3]), sky: C(PAL[4]), green: C(PAL[5]), orange: C(PAL[6]) };
    const lc = (p) => C(p[0], p[1]);
    const sun = V3(...L.sun).normalize();
    const scene = new THREE.Scene();
    const fogWarm = lc(L.fog), fogBlue = lc(L.fogBlue);
    scene.fog = new THREE.FogExp2(fogWarm.clone(), L.dens); scene.background = fogWarm.clone();

    // ---- the hero, on the axis in its well
    const hero = await buildHero(ctx, { palette: PAL, look: lookName, apron: true, cwSide: 1, apronCutGLSL: GLSL_PIT + 'float yardCut(vec2 p){ return step(pitAt(p).x, 5.1); }' });
    // The length faces front-left (50 degrees off the hall's axis) and is not twisted: from the store door and all the
    // way down the nave it is a broad band against the light from liquor to drum, and the flight, which comes in on
    // the axis and swings round its left side, crosses its face square-on (u 0.5 to 0.52) between the two side trunks.
    const HERO_RY = -50 * Math.PI / 180;
    hero.setTwist(0); hero.uniforms.uAmbK.value = 2.0;
    hero.object.position.set(HX, 0, HZ); hero.object.rotation.y = HERO_RY; hero.object.updateMatrixWorld(true); scene.add(hero.object);
    const HA = hero.anchors, HU = hero.uniforms, toW = (v) => v.clone().applyMatrix4(hero.object.matrixWorld);
    const legsW = HA.legs.map((l) => ({ foot: toW(l.foot), top: toW(l.top) }));
    await ctx.yield?.();

    // ---- the path: out of the store door over the honeycomb, left to pass close beside a wet length rising on its
    // tripod, down to skim one pit's mirror three metres up, in along the axis to the foot of the length, up across its
    // face and round its left side (pol: angle round the hero, radius, height), then out behind it into the canyon
    // and down to the gate
    const pol = (deg, r, y) => [HX + r * Math.cos(deg * Math.PI / 180), y, HZ - r * Math.sin(deg * Math.PI / 180)];
    const path = makePath([
      [0, 6, 18], [0, 6, 5], [0.4, 7.6, -9], [-0.6, 7.6, -21], [-1.9, 6.6, -32], [-1.6, 5.2, -44], [-0.6, 3.8, -55], [0.2, 3.0, -63], [0.8, 3.5, -74], [0.6, 5.0, -86], [-0.4, 5.6, -98], [0.5, 5.5, -111], [0.9, 5.9, -123],
      pol(272, 16.5, 6.6), pol(252, 14.2, 7.6), pol(228, 13.2, 9.0), pol(207, 14.4, 10.8), pol(189, 15.8, 12.8), pol(173, 16.8, 15), pol(158, 17.2, 17.2),
      pol(140, 17.2, 19.4), pol(122, 17.6, 21.3), pol(106, 20.2, 22.9), [-2.0, 23.7, -180.5], [-0.7, 23.8, -189.5], [0, 22.4, -198.5], [0, 15, -219], [0, 10.8, -234], [0, 9.3, -244], [0, 9, -256], [0, 9, -274], [0, 9, -294],
    ]);
    const PL = path.length;
    const samples = []; for (let i = 0; i <= 240; i++) samples.push(path.pointAt(i / 240));
    const distToPath = (x, y, z) => { let m = 1e9; for (const s of samples) { const d = (s.x - x) ** 2 + (s.y - y) ** 2 + (s.z - z) ** 2; if (d < m) m = d; } return Math.sqrt(m); };
    const uAtZ = (z, from = 0, to = 1) => { let best = from, bd = 1e9; for (let i = 0; i <= 240; i++) { const u = i / 240; if (u < from || u > to) continue; const d = Math.abs(samples[i].z - z); if (d < bd) { bd = d; best = u; } } return best; };
    const U_RISE0 = uAtZ(-133.5, 0.4, 0.5), U_RISE1 = uAtZ(-163.5, 0.5, 0.65);      // the climb beside the length

    // ---- cloth plan, sunlight tracer, shade map
    await ctx.yield?.();
    const sparse = L.sparse ? Math.sign(sun.x) || 1 : 0;
    const lay = await layCloth(ctx, rng.fork('cloth'), pal, { whiteDay, kCan: L.kCan, canOcc: L.canOcc, sparse, occ: L.occ, away: -(Math.sign(sun.x) || 1) });
    await ctx.yield?.();
    const trace = makeTracer(sun, lay.buckets, noise);
    const lum = (o) => o[0] * 0.3 + o[1] * 0.5 + o[2] * 0.2;
    const low = lookName === 'evening';
    const skyOpen = (x, z) => {
      if (z > 0.6) return Math.abs(x) < 15 && z < 60 ? 0 : 1;
      if (Math.abs(x) > 47 || z < -299) return 1;
      const ff = (FR_Z0 - z) / FR_DZ; if (ff < -0.7 || ff > FR_N - 0.3) return 1;
      const P = lay.plans[clamp(Math.round(ff), 0, FR_N - 1)], ax = Math.abs(x);
      if (ax < P.bound) return P.canopy ? L.naveOpen : 1;
      if (ax >= 46.5) return 1;
      return sparse && !P.canyon && x * sparse > 0 ? 0.75 : P.canyon ? 0.14 : 0.2;
    };
    const struck = (P, s) => sparse && s === sparse && !P.canyon && (P.f & 1) === 1;          // a frame taken down for the night
    const mastList = [];
    for (const P of lay.plans) for (const x of P.xs) for (const s of [-1, 1]) if (!struck(P, s)) mastList.push([s * x, P.z]);
    const shade = await buildShadeMap(ctx, trace, skyOpen, low ? 192 : 224, low ? 768 : 896, mastList, sun);
    for (const o of lay.list) { o.lt = lum(trace(o.x, o.yTop - 0.4, o.z - 0.05)); o.lb = lum(trace(o.x, o.yTop - o.drop + 0.3, o.z - 0.05)); }
    await ctx.yield?.();
    let yLit = -100, floorL = 1;
    { let first = null, lo = 0, n = 0; for (let y = 1; y <= 39; y += 1) { const l = lum(trace(HX, y, HZ - 0.2)); if (l > 0.5 && first === null) first = y; if (l <= 0.5) { lo += l; n++; } }
      if (first !== null && first > 1.5) { yLit = first; floorL = Math.max(0.05, n ? lo / n : 0.05); } else if (first === null) { yLit = 60; floorL = 0.08; } }
    const ambShade = new THREE.Vector3(...L.amb).multiplyScalar(0.9);
    const shadeXf = new THREE.Vector4(MAP_X0, MAP_Z0, 1 / MAP_W, 1 / MAP_L);
    // the length keeps a sun of its own, never left of the flight, so the face we pass is the one against the light
    const heroSun = sun.clone(); if (heroSun.x < 0.26) heroSun.x = 0.26; heroSun.normalize();
    hero.setLight({ sunDir: heroSun, sunColor: lc(L.sunCol), skyColor: lc(L.sky), groundColor: lc(L.gnd), hazeColor: lc(L.haze), zenithColor: lc(L.zen), shade: 1, wet: L.wet,
      shadeY: [yLit - 3, yLit + 2, floorL], yardShade: { map: shade.tex, xf: shadeXf, amb: ambShade } });

    // the gate's light: the sun at its own height, swung round until it rakes the gatehouse front from its own side
    const gateSun = (() => { const h = Math.sqrt(Math.max(1 - sun.y * sun.y, 0.01)); return V3((sun.x < 0 ? -1 : 1) * h * 0.955, sun.y, Math.max(h * 0.3, 0.2)).normalize(); })();
    const uTripU = { value: 0.5 };
    const YU = {
      fogColor: HU.fogColor, fogDensity: HU.fogDensity, fogNear: HU.fogNear, fogFar: HU.fogFar,
      uSunDir: { value: sun.clone() }, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uGndCol: HU.uGndCol, uHazeCol: HU.uHazeCol, uZenCol: HU.uZenCol,
      uTime: HU.uTime, uWet: HU.uWet, uPx: HU.uPx, uShade0: HU.uShade0, uShadeY: HU.uShadeY, uHaul: HU.uHaul, uWind: HU.uWind,
      uShadeMap: { value: shade.tex }, uShadeXf: { value: shadeXf }, uAmbShade: { value: ambShade },
      uStoreAmb: { value: lc(L.store).multiplyScalar(3.4) }, uDoorCol: { value: lc(L.door || L.haze).multiplyScalar(1.5) }, uAmbGain: { value: L.ambGain ?? 2.4 }, uSoft: { value: L.soft ?? 0 }, uFilt: { value: new THREE.Vector3(0.5, 0.66, 1.0) }, uGust: { value: new THREE.Vector4(1e4, 0, 30, 0) },
      uGateSun: { value: new THREE.Vector4(gateSun.x, gateSun.y, gateSun.z, L.gate ?? 0.8) },
    };
    const mkU = (extra = {}) => ({ ...YU, ...extra });
    const cEarth = pal.ochre.clone().lerp(pal.haze, 0.12).multiplyScalar(0.46), cStain = pal.blue.clone().lerp(pal.deep, 0.1).multiplyScalar(0.95);
    const cTrunk = C('#a8987a').lerp(pal.ochre, 0.18), cTrunkDark = C('#5d5140'), cRope = C('#b59c6c').lerp(pal.ochre, 0.2), cTar = C('#33281d');
    const cCement = C('#b8b1a0').lerp(pal.haze, 0.2).multiplyScalar(0.4), cStone = C('#8d8270'), cMud = pal.ochre.clone().lerp(pal.haze, 0.1).multiplyScalar(0.62);
    const cWood = C('#84684a'), cClay = C('#8a5a40').lerp(pal.ochre, 0.4), cGourd = pal.ochre.clone().lerp(pal.haze, 0.4).multiplyScalar(0.85), cThatch = C('#b9a06a').lerp(pal.haze, 0.2).multiplyScalar(0.7);

    // ---- sky and ground
    const sky = skyDome(mkU(), L.discGain, L.halo ?? 0, L.disc ? V3(...L.disc).normalize() : sun.clone(), L.pearl ?? 0); scene.add(sky);
    {
      const g = new THREE.PlaneGeometry(100, 374, 4, 16); g.rotateX(-Math.PI / 2); g.translate(0, 0, -125);
      const ground = new THREE.Mesh(g, groundMaterial(mkU({ uEarth: { value: cEarth }, uStain: { value: cStain }, uReed: { value: C('#b79a62').multiplyScalar(0.8) } })));
      ground.frustumCulled = false; scene.add(ground);
    }

    // ---- pits
    const pits = [];
    for (let k = 0; k <= ROW_N; k++) {
      const six = rowSix(k), zr = rowZ(k);
      for (let c = k > 19 ? -2 : six ? -3 : -2; c <= (k > 19 ? 1 : 2); c++) { const x = c * 11.5 + (six ? 5.75 : 0); if (Math.hypot(x - HX, zr - HZ) >= 14.8) pits.push({ x, z: zr, k, six, seed: rng() }); }
    }
    const tierU = []; for (let k = 0; k < 8; k++) tierU.push(tierColor(k, new THREE.Color(), pal));
    let pitMesh = null;
    {
      const g = pitGeometry(), seeds = new Float32Array(pits.length);
      const mat = pitMaterial(mkU({ uTier: { value: tierU }, uFoam: { value: C('#7c6a4c').lerp(pal.ochre, 0.18).multiplyScalar(0.72) }, uLiquor: { value: pal.deep.clone().lerp(pal.blue, 0.3).multiplyScalar(0.62) },
        uCement: { value: cCement }, uStain: { value: cStain }, uFarRefl: { value: fogBlue.clone().lerp(pal.blue, 0.45).multiplyScalar(0.55) },
        uPlan: { value: new THREE.Vector4(19.5, L.kCan, sparse, L.occ) }, uPlanB: { value: new THREE.Vector2(L.canOcc, 0) },
        uTrip: { value: [0, 1, 2, 3, 4].map((i) => HU.uRamp.value[i].clone()) }, uTripU }));
      pitMesh = { g, n: pits.length };
      const im = new THREE.InstancedMesh(g, mat, pits.length);
      pits.forEach((p, i) => { im.setMatrixAt(i, _m4.makeRotationY(p.seed * TAU).setPosition(p.x, 0, p.z)); seeds[i] = p.seed; });
      g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
      im.frustumCulled = false; scene.add(im);
    }
    await ctx.yield?.();

    // ---- masts and ropes
    const ropeSegs = [];
    for (const P of lay.plans) {
      for (const [a, b, top] of frameBays(P)) for (let k = top ? L.kCan : 0; k < 8; k++) {
        if (struck(P, top ? sparse : Math.sign(a + b))) continue;
        const y = T_Y0 + T_DY * k, sag = (b - a) * 0.006, n = top ? 8 : 4;
        for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n; ropeSegs.push([V3(lerp(a, b, t0), y - sag * 4 * t0 * (1 - t0), P.z), V3(lerp(a, b, t1), y - sag * 4 * t1 * (1 - t1), P.z)]); }
      }
    }
    {
      const im = new THREE.InstancedMesh(mastGeometry(), mastMaterial(mkU({ uTrunk: { value: cTrunk.clone().lerp(pal.ochre, 0.3).multiplyScalar(0.95) }, uRope: { value: cRope }, uStain: { value: cStain } })), mastList.length);
      const mr = rng.fork('masts'), aLt = new Float32Array(mastList.length * 4);
      for (let i = 0; i < mastList.length; i++) { const [x, z] = mastList[i]; for (let j = 0; j < 4; j++) aLt[i * 4 + j] = Math.max(lum(trace(x + (sun.x > 0 ? 0.6 : -0.6), 4 + 10 * j, z - 0.65)), lum(trace(x, 4 + 10 * j, z - 0.65))); if ((i & 63) === 63) await ctx.yield?.(); }
      im.geometry.setAttribute('aLt', new THREE.InstancedBufferAttribute(aLt, 4));
      mastList.forEach(([x, z], i) => im.setMatrixAt(i, xf(x, 0, z, mr.range(-0.012, 0.012), mr.range(0, TAU), mr.range(-0.012, 0.012), 0.74, mr.range(0.97, 1.03), 0.74)));
      im.frustumCulled = false; scene.add(im);
    }
    await ctx.yield?.();

    // ---- the cloth: every length, the canyon's streamers, the tripod lengths
    const tripods = [];
    { // rigs stand over pits of the nave, left and right in turn. The first is the one the flight passes close beside
      // (u 0.13 to 0.19, nine metres off) as its length is hauled up streaming; the others stand further from the flight.
      const tr = rng.fork('tripods'), cand = pits.filter((p) => p.z > -124 && Math.abs(p.x) > 10 && Math.abs(p.x) < 17.5 && distToPath(p.x, 8, p.z) > 7);
      for (const [k, x] of [[2, -11.5], [0, 17.25], [5, 17.25], [8, -11.5]]) { const q = cand.find((p) => p.k === k && Math.abs(p.x - x) < 0.1); if (q) tripods.push(q); }
      tr.shuffle(cand);
    }
    const extra = [];
    tripods.forEach((p, i) => { p.tw = i < 2 ? 4.4 : 3.6; p.tph = rng(); extra.push({ x: p.x, w: p.tw, yTop: 15, drop: 12.5, z: p.z, col: pal.blue, seed: p.tph, pat: 0.1, kind: 2, lt: 0, lb: 0, lean: 0, line: i === 0 ? -2 : -1, tripod: true }); });
    { // each rigged pit mirrors its own length
      const aTrip = new Float32Array(pitMesh.n * 3);
      tripods.forEach((p, i) => { const j = pits.indexOf(p); aTrip.set([p.tw / 2, p.tph * 40, i === 0 ? 1 : 0], j * 3); });
      pitMesh.g.setAttribute('aTrip', new THREE.InstancedBufferAttribute(aTrip, 3));
    }
    const sr = rng.fork('streamers');
    for (const P of lay.plans) if (P.z < -182 && P.z > -268) for (const s of [-1, 1]) {
      if (sr() < 0.3 && P.f < FR_N - 2) continue;
      const k = sr.int(3, 6), c = tierColor(k + sr.range(-0.5, 0.5), new THREE.Color(), pal), gone = struck(P, s);
      const w = sr.range(1.1, 1.6), drop = sr.range(11, 17), zz = P.z + sr.range(1.2, 5), sd = sr();
      if (gone) continue;
      extra.push({ x: s * 10.9, w, yTop: T_Y0 + T_DY * k - 0.5, drop, z: zz, col: c, seed: sd, pat: 0.7, kind: 1, lean: s, line: -1 });
    }
    { // the gatehouse dressed: two long lengths from a rail either side of the arch, one down each jamb of the reveal
      const gr = rng.fork('gate-cloth');
      for (const s of [-1, 1]) {
        [[10.25, 2.2, 16.2, 2.3, 0.1], [14.8, 2.05, 13.2, 4.7, 0.2]].forEach(([x, w, drop, tier, pat], j) => {
          extra.push({ x: s * x, w, yTop: 22.36, drop: drop + gr.range(-0.7, 0.7), z: -287.5, col: tierColor(tier + gr.range(-0.4, 0.4), new THREE.Color(), pal), seed: gr(), pat: s > 0 ? pat : (j ? 0.1 : 0.28), kind: 3, lean: 0, line: -1, gate: true });
        });
        extra.push({ x: s * 8.2, w: 3.0, yTop: 14.66, drop: gr.range(9.2, 10.4), z: -292.0, col: tierColor(s > 0 ? 5.3 : 3.7, new THREE.Color(), pal), seed: gr(), pat: s > 0 ? 0.3 : 0.1, kind: 3, lean: -s, line: -1, gate: true });
      }
    }
    for (const o of extra) { if (o.gate) { o.lt = o.lb = 1; continue; } const a = trace(o.x, o.yTop - 0.5, o.z - 0.1), b = trace(o.x, Math.max(o.yTop - o.drop + 0.5, 0.5), o.z - 0.1); o.lt = lum(a); o.lb = lum(b); }
    await ctx.yield?.();
    // hems round the well stream outward in its updraught
    for (const o of lay.list) { const d = Math.hypot(o.x - HX, o.z - HZ); if (d < 44) o.lean = Math.sign(o.z - HZ || 1) * 0.9 * (1 - smoothstep(30, 44, d)); o.dPath = distToPath(o.x, o.yTop - o.drop * 0.5, o.z); }
    await ctx.yield?.();
    lay.list.sort((a, b) => a.dPath - b.dPath);
    const nNear = Math.min(lay.list.length, Math.round(520 * (0.6 + 0.4 * detail)));
    const stripLine = (() => { const P = lay.plans.find((q) => q.z < -230 && q.z > -238); return P ? P.f * 8 + 5 : -100; })();
    const clothU = mkU({ uPale: { value: pal.haze.clone().multiplyScalar(0.8) }, uTrip: { value: [0, 1, 2, 3, 4].map((i) => HU.uRamp.value[i].clone()) },
      uStrip: { value: new THREE.Vector4(-100, 0, 0, 0) }, uTripU });
    const clothMat = clothMaterial(clothU);
    const clothNear = new THREE.Mesh(clothGeometry(8, 6, lay.list.slice(0, nNear).concat(extra)), clothMat);
    await ctx.yield?.();
    const clothFar = new THREE.Mesh(clothGeometry(6, 4, lay.list.slice(nNear)), clothMat);
    clothNear.frustumCulled = clothFar.frustumCulled = false; scene.add(clothNear, clothFar);
    if (tripods.length) scene.add(dripMesh(tripods, mkU({ uTripU }), rng.fork('trip-drips')));
    for (const o of extra) if (o.kind === 1) { const y = o.yTop; ropeSegs.push([V3(o.x, y, o.z - o.w / 2 - 0.3), V3(o.x, y, o.z + o.w / 2 + 0.3)]); }
    await ctx.yield?.();

    // ---- everything built: yard walls, buttresses, gatehouse, the store and what is kept in it
    const acc = new Acc(), br = rng.fork('built');
    const mud = (k = 1) => (x, y, z, c) => { c.copy(cMud).multiplyScalar(k * (0.86 + 0.2 * noise.n2(x * 0.07 + z * 0.07, y * 0.13))); };
    const flat = (c0, j = 0.12) => { const k = 1 + br.range(-j, j); return (x, y, z, c) => { c.copy(c0).multiplyScalar(k); }; };
    const tube = (A, B, r0, r1, c0, o = {}) => addTube(acc, A, B, { step: 2.5, radial: 7, mat: 0, cap: true, ...o, radiusFn: (t) => lerp(r0, r1, t), colorFn: o.colorFn || ((t, a, out) => out.copy(c0).multiplyScalar(0.85 + 0.15 * Math.sin(t * 37 + a))) });
    const horn = (x, y, z, s, k = 1) => {     // a horned pinnacle
      lathe(acc, [[0.02, 3.0], [0.34, 2.5], [0.62, 1.5], [0.95, 0.5], [1.15, 0]], 7, xf(x, y, z, 0, 0, 0, s), { colorFn: mud(1.08 * k), mat: 9 });
      for (const d of [-1, 1]) tube(V3(x, y + 2.3 * s, z + d * 0.25 * s), V3(x, y + 4.0 * s, z + d * 1.0 * s), 0.3 * s, 0.1 * s, cMud, { rings: 2, radial: 5, mat: 9, colorFn: (t, a, out) => out.copy(cMud).multiplyScalar(1.05 * k) });
    };
    for (const s of [-1, 1]) {
      addBlock(acc, s * 48.8, 9, -150, 1.6, 18, 301, { seg: [1, 5, 50], wob: 0.22, noise, round: 0.15, colorFn: mud(), mat: 9 });
      for (let i = 0; i < 25; i++) { const z = -8 - 12 * i; addBlock(acc, s * 47.4, 9.6, z, 2.4, 19.2, 3.2, { seg: [2, 4, 2], taper: 0.62, wob: 0.14, noise, round: 0.2, colorFn: mud(1.04), mat: 9 }); horn(s * 47.5, 19.2, z, 0.95); if (i % 6 === 5) await ctx.yield?.(); }
    }
    addBlock(acc, 0, 9, -301, 99, 18, 1.6, { seg: [20, 4, 1], wob: 0.2, noise, colorFn: mud(), mat: 9 });
    { // the wall the store opens through (z 0..1.6), with its doorway 16 by 13
      const sh = new THREE.Shape(); sh.moveTo(-49.6, 0); sh.lineTo(-49.6, 18); sh.lineTo(49.6, 18); sh.lineTo(49.6, 0); sh.lineTo(8, 0); sh.lineTo(8, 13); sh.lineTo(-8, 13); sh.lineTo(-8, 0); sh.closePath();
      acc.add(new THREE.ExtrudeGeometry(sh, { depth: 1.6, bevelEnabled: false }), xf(0, 0, 0), { colorFn: mud(), mat: 9 });
      tube(V3(-9.6, 13.35, 0.8), V3(9.6, 13.5, 0.8), 0.52, 0.46, cTrunk, { step: 1.5, radial: 9, v0: 3 });
      for (const s of [-1, 1]) { tube(V3(s * 8.25, 0, 0.8), V3(s * 8.3, 13, 0.8), 0.42, 0.36, cTrunk, { step: 1.5, radial: 8, v0: s }); for (const y of [2.5, 9.5]) addLashing(acc, V3(s * 8.27, y, 0.8), V3(0, 1, 0), 0.42, 0.7, 3, cRope, br); }
      for (let i = 0; i < 9; i++) horn(-44 + i * 11, 18, 0.8, 0.8);
    }
    await ctx.yield?.();
    { // the gatehouse: 30 wide, 26 tall, standing 10 m into the yard; round arch 17 wide and 19 high
      const sh = new THREE.Shape(); sh.moveTo(-15, 0); sh.lineTo(-15, 26); sh.lineTo(15, 26); sh.lineTo(15, 0); sh.lineTo(8.5, 0); sh.lineTo(8.5, 10.5); sh.absarc(0, 10.5, 8.5, 0, Math.PI, false); sh.lineTo(-8.5, 0); sh.closePath();
      acc.add(new THREE.ExtrudeGeometry(sh, { depth: 10, bevelEnabled: false, curveSegments: 22 }), xf(0, 0, -300), { colorFn: mud(1.02), mat: 9 });
      await ctx.yield?.();
      const cMould = cMud.clone().multiplyScalar(1.25), ap = [];
      for (let i = 0; i <= 26; i++) { const a = Math.PI * i / 26; ap.push(V3(Math.cos(a) * 9.15, 10.5 + Math.sin(a) * 9.15, -289.75)); }
      addRope(acc, [V3(9.15, 0.2, -289.75), V3(9.15, 5, -289.75), ...ap, V3(-9.15, 5, -289.75), V3(-9.15, 0.2, -289.75)], 0.42, { color: cMould, segs: 70, radial: 6 });
      for (const s of [-1, 1]) {
        addBlock(acc, s * 12.6, 13.2, -289.3, 2.6, 26.4, 1.8, { seg: [2, 6, 1], taper: 0.7, wob: 0.12, noise, round: 0.2, colorFn: mud(1.1), mat: 9 }); horn(s * 12.6, 26.2, -289.4, 1.25, 1.05);
        tube(V3(s * 10.4, 21.6, -289.9), V3(s * 10.6, 21.1, -287.2), 0.28, 0.22, cWood, { rings: 2, mat: 0 });
        addBlock(acc, s * 4.4, 9.4, -299.3, 8.6, 18.8, 0.5, { seg: [4, 4, 1], round: 0.05, colorFn: flat(cWood.clone().multiplyScalar(0.34)), mat: 5, ry: s * 0.02 });
      }
      await ctx.yield?.();
      for (let i = -2; i <= 2; i++) horn(i * 4.6, 26, -290.6, i === 0 ? 1.15 : 0.9, 1.05);
      addBlock(acc, 0, 23.3, -289.75, 21, 0.9, 0.7, { seg: [8, 1, 1], round: 0.2, wob: 0.06, noise, colorFn: mud(1.2), mat: 9 });
      // dressed like the rest of the yard: a rail of lashed poles either side of the arch for the long lengths, a pole
      // down each jamb of the reveal, and a row of pegged hanks drying above the arch
      for (const s of [-1, 1]) {
        tube(V3(s * 8.9, 22.5, -287.5), V3(s * 16.0, 22.62, -287.5), 0.17, 0.15, cTrunk, { step: 1.4, radial: 7, v0: s * 3 });
        for (const [x, z0] of [[9.5, -290.3], [12.6, -288.9], [15.25, -290.3]]) {
          tube(V3(s * x, 23.15, z0), V3(s * x, 22.45, -287.2), 0.14, 0.11, cWood, { rings: 2, radial: 6 });
          addLashing(acc, V3(s * x, 22.53, -287.5), V3(1, 0, 0), 0.17, 0.5, 3, cRope, br);
        }
        tube(V3(s * 8.28, 14.85, -290.15), V3(s * 8.28, 14.8, -293.85), 0.12, 0.11, cTrunk, { rings: 3, radial: 6 });
        for (const z of [-290.6, -293.4]) tube(V3(s * 8.62, 15.02, z), V3(s * 8.18, 14.82, z), 0.08, 0.07, cWood, { rings: 1, radial: 5 });
      }
      await ctx.yield?.();
      for (let i = 0; i < 6; i++) {
        const x = -6.9 + i * 2.76 + br.range(-0.3, 0.3), y = 22.25 + br.range(-0.25, 0.2), piv = [x, y, -289.15], ph = br.range(0, 6), len = br.range(2.1, 2.9);
        tube(V3(x, y, -290.1), V3(x, y + 0.1, -288.95), 0.09, 0.07, cWood, { rings: 2, radial: 5 });
        tube(V3(x, y, -289.15), V3(x + br.range(-0.15, 0.15), y - len, -289.1), 0.44, 0.27, tierColor(br.range(1.2, 6.6), new THREE.Color(), pal), { rings: 5, radial: 7, mat: 1, kind: 1, piv, phase: ph, bow: 0.2 });
      }
    }
    await ctx.yield?.();
    { // the store: side walls, rear wall, roof of palm beams under matting
      for (const s of [-1, 1]) addBlock(acc, s * 15.8, 8.2, 31, 1.6, 16.4, 61, { seg: [1, 4, 12], wob: 0.18, noise, colorFn: mud(0.9), mat: 9 });
      addBlock(acc, 0, 8.2, 60.8, 33, 16.4, 1.6, { seg: [8, 4, 1], wob: 0.18, noise, colorFn: mud(0.9), mat: 9 });
      addBlock(acc, 0, 17.1, 31, 33.4, 1.4, 62, { seg: [4, 1, 8], round: 0.2, colorFn: flat(cThatch.clone().multiplyScalar(0.5)), mat: 1 });
      for (let i = 0; i < 19; i++) tube(V3(-15.4, 15.75 + br.range(-0.1, 0.1), 3.6 + i * 3.05), V3(15.4, 15.75 + br.range(-0.1, 0.1), 3.6 + i * 3.05 + br.range(-0.3, 0.3)), 0.4, 0.33, cTrunkDark.clone().lerp(cTrunk, 0.35), { step: 4, radial: 7, v0: i * 3, cap: false });
      for (const x of [-7.5, 0, 7.5]) tube(V3(x, 15.1, 1.8), V3(x, 15.1, 59.8), 0.3, 0.3, cTrunkDark, { step: 8, radial: 6, cap: false });
      await ctx.yield?.();
      const slitX = sun.x < 0 ? -14.96 : 14.96, glow = lc(L.haze).multiplyScalar(lookName === 'night' ? 0.9 : 1.5);
      for (const z of [12, 24, 36, 48]) { const g = new THREE.PlaneGeometry(0.7, 3); acc.add(g, xf(slitX, 12.1, z, 0, slitX < 0 ? Math.PI / 2 : -Math.PI / 2, 0), { color: glow, mat: 7 });
        addBlock(acc, slitX + Math.sign(slitX) * 0.1, 10.3, z, 0.5, 0.4, 1.9, { seg: [1, 1, 1], round: 0.08, colorFn: mud(0.7), mat: 9 }); }
      // the rolled reed mat above the door and its tassels, swinging in the draught
      tube(V3(-8.6, 14.1, 2.4), V3(8.6, 14.1, 2.4), 0.62, 0.62, cThatch, { step: 1.2, radial: 10, mat: 1, v0: 1 });
      for (let i = 0; i < 9; i++) { const x = -8 + i * 2 + br.range(-0.3, 0.3), l = br.range(1.3, 2.3), piv = [x, 13.5, 2.4], ph = br.range(0, 6);
        tube(V3(x, 13.5, 2.4), V3(x, 13.5 - l, 2.4), 0.05, 0.05, cRope, { rings: 2, radial: 4, mat: 1, kind: 1, piv, phase: ph });
        tube(V3(x, 13.5 - l, 2.4), V3(x, 13.5 - l - 0.7, 2.4), 0.2, 0.09, i % 2 ? pal.blue : cThatch, { rings: 2, radial: 6, mat: 1, kind: 1, piv, phase: ph }); }
      // a hank hung from a beam
      for (const [x, z] of [[-5.2, 20], [6, 33]]) { const piv = [x, 15.3, z], ph = br.range(0, 6); tube(V3(x, 15.3, z), V3(x, 12.9, z), 0.05, 0.05, cRope, { rings: 2, radial: 4, mat: 1, kind: 1, piv, phase: ph });
        tube(V3(x, 13, z), V3(x + 0.2, 9.6, z), 0.42, 0.3, pal.blue.clone().lerp(pal.deep, 0.4), { rings: 5, radial: 8, mat: 1, kind: 1, piv, phase: ph, bow: 0.25 }); }
      await ctx.yield?.();
      // stacks of folded cloth graded from sky to black: every length its own slab laid a little askew on the one
      // below (a pinched edge between each pair), an odd colour here and there, the top folds lifting in the draught
      const st = rng.fork('stacks'), c = new THREE.Color();
      for (const s of [-1, 1]) for (let row = 0; row < 2; row++) for (let z = 5.5; z < 58; z += st.range(3.4, 4.6)) {
        if (st() < 0.14) continue;
        const sx = st.range(2.3, 3.3), sz = st.range(2.3, 3.2), h = row ? st.range(5, 10.5) : st.range(1.6, 6.2), x = s * (row ? 12.9 : st.range(8.9, 9.5));
        const tier = st.range(-0.5, 7.5), ry0 = st.range(-0.12, 0.12);
        for (let y = 0; y < h;) {
          const th = st.range(0.46, 0.76), last = y + th >= h, odd = st() < 0.16, k = st.range(0.9, 1.04);
          tierColor(odd ? st.range(-0.5, 7.5) : tier + st.range(-0.7, 0.7), c, pal); const cc = c.clone().multiplyScalar(st.range(0.8, 1.15));
          addBlock(acc, x + st.range(-0.1, 0.1), y + th / 2, z + st.range(-0.1, 0.1), sx * k, th * 1.02, sz * (odd ? st.range(0.82, 0.95) : k), { seg: [2, 1, 2], round: 0.035, mat: 6,
            ry: ry0 + st.range(-0.08, 0.08), uvScale: [1, st.int(2, 4)], kind: last ? 2 : 0, phase: st.range(0, 6), piv: [x, y + 0.02, z], colorFn: (px, py, pz, o) => o.copy(cc) });
          y += th;
        }
        await ctx.yield?.();
      }
      // four beating logs with mallets and a half-beaten cloth, bolts glazed blue-black, white cloth tied for dyeing
      for (const [x, z0] of [[-5.7, 11], [5.7, 13.5], [-5.6, 27.5], [5.8, 30]]) {
        tube(V3(x, 0.78, z0), V3(x + br.range(-0.2, 0.2), 0.8, z0 + 12), 0.8, 0.74, cTrunk, { step: 1.5, radial: 12, v0: z0,
          colorFn: (t, a, out) => out.copy(cTrunk).multiplyScalar(0.7 + 0.25 * Math.sin(a - 1.57)).lerp(pal.deep, 0.35 * (0.5 + 0.5 * Math.sin(t * 9 + x)) * Math.max(0, Math.sin(a - 0.2))) });
        addBlock(acc, x, 1.66, z0 + 5.2, 2.5, 0.2, 3.4, { seg: [4, 1, 4], round: 0.08, mat: 6, colorFn: (px, py, pz, o) => o.copy(pal.deep).lerp(pal.blue, 0.12).multiplyScalar(0.55) });
        for (let i = 0; i < 2; i++) { const z = z0 + 1.6 + i * 7.6 + br.range(-0.5, 0.5), ry = br.range(-0.6, 0.6), hx = Math.cos(ry), hz = Math.sin(ry);
          tube(V3(x - 0.45 * hx, 1.95, z - 0.45 * hz), V3(x + 0.45 * hx, 1.95, z + 0.45 * hz), 0.34, 0.34, cWood, { rings: 2, radial: 8 });
          tube(V3(x, 1.95, z), V3(x - hz * 1.9, 1.75, z + hx * 1.9), 0.09, 0.07, cTrunk, { rings: 2, radial: 5 }); }
      }
      await ctx.yield?.();
      for (let i = 0; i < 9; i++) { const x = 6.6 + (i % 3) * 0.95, y = 0.48 + Math.floor(i / 3) * 0.8, z = 45.5 + (i % 2) * 0.3; tube(V3(x, y, z), V3(x + 0.1, y, z + 3.3), 0.46, 0.46, pal.deep, { rings: 2, radial: 8, mat: 6, colorFn: (t, a, out) => out.copy(pal.deep).lerp(pal.blue, 0.1).multiplyScalar(0.5) }); }
      for (let i = 0; i < 9; i++) { const a = br.range(0, TAU), d = br.range(0, 1.7), r = br.range(0.6, 1.0); addStone(acc, -6.9 + Math.cos(a) * d, r * 0.55 + (i > 5 ? 0.8 : 0), 44.5 + Math.sin(a) * d * 1.6, r, r * 0.75, r, pal.haze.clone().multiplyScalar(0.62), br);
        if (i < 4) addLashing(acc, V3(-6.9 + Math.cos(a) * d, r * 0.55 + r * 0.6, 44.5 + Math.sin(a) * d * 1.6), V3(0, 1, 0), r * 0.3, 0.3, 3, cRope, br, { thick: 0.07 }); }
      await ctx.yield?.();
      // calabashes, coils of rope, sandals in a row, a kettle on three stones
      for (let i = 0; i < 7; i++) { const x = -7 + br.range(-1, 1), z = 4.4 + i * 0.95, s = br.range(0.7, 1.25); lathe(acc, [[0.02, 0], [0.5, 0.1], [0.72, 0.5], [0.6, 0.95], [0.22, 1.25], [0.16, 1.6], [0.02, 1.62]], 10, xf(x, 0, z, br.range(-0.2, 0.2), 0, br.range(-0.2, 0.2), s), { colorFn: flat(cGourd, 0.2), mat: 3 }); }
      for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) { const g = new THREE.TorusGeometry(1.0 - i * 0.05, 0.14, 6, 18); acc.add(g, xf(7.4 + j * 2.3, 0.16 + i * 0.27, 20.5 + j * 1.2, Math.PI / 2, 0, i * 0.4), { colorFn: flat(j ? cTar.clone().lerp(cRope, 0.3) : cRope, 0.1), mat: 1, uvScale: [14, 1] }); }
      for (let i = 0; i < 6; i++) addBlock(acc, 4.3 + i * 0.62 + (i % 2) * 0.1, 0.07, 2.9 + br.range(-0.08, 0.08), 0.42, 0.12, 1.0, { seg: [1, 1, 2], round: 0.05, colorFn: flat(cWood.clone().multiplyScalar(0.6), 0.2), mat: 5, ry: br.range(-0.15, 0.15) });
      for (let i = 0; i < 3; i++) addStone(acc, 7.0 + Math.cos(i * 2.1) * 0.75, 0.3, 7.4 + Math.sin(i * 2.1) * 0.75, 0.5, 0.42, 0.5, cStone, br);
      lathe(acc, [[0.02, 0], [0.55, 0.05], [0.82, 0.5], [0.7, 1.0], [0.36, 1.25], [0.4, 1.36], [0.02, 1.42]], 12, xf(7.0, 0.62, 7.4), { colorFn: flat(C('#3a3a40')), mat: 8 });
      tube(V3(7.65, 1.25, 7.4), V3(8.45, 1.85, 7.4), 0.14, 0.07, C('#3a3a40'), { rings: 2, radial: 6, mat: 8 });
    }
    await ctx.yield?.();

    // ---- lean-tos against the side walls: clay pots, ash, firewood, baskets of pressed indigo balls
    for (const [s, z] of [[-1, -7], [1, -7], [-1, -272], [1, -272], [-1, -284], [1, -263]]) {
      const x0 = s * 47.3, roof = new THREE.BoxGeometry(7.4, 0.5, 9.5, 5, 1, 6), pa = roof.attributes.position;
      for (let i = 0; i < pa.count; i++) pa.setY(i, pa.getY(i) + 0.22 * noise.n2(pa.getX(i) * 0.9 + z, pa.getZ(i) * 0.9) - 0.12 * Math.abs(pa.getX(i)) * 0.2);
      roof.computeVertexNormals();
      acc.add(roof, xf(x0 - s * 3.6, 6.3, z, 0, 0, s * 0.3), { colorFn: (x, y, zz, c) => c.copy(cThatch).multiplyScalar(0.8 + 0.3 * noise.n2(x * 2, zz * 0.3)), mat: 1, uvScale: [3, 6] });
      for (const dz of [-4, 4]) tube(V3(x0 - s * 6.6, 0, z + dz), V3(x0 - s * 6.5, 5.3, z + dz), 0.22, 0.18, cTrunk, { rings: 3, radial: 6 });
      tube(V3(x0 - s * 6.55, 5.25, z - 4.6), V3(x0 - s * 6.55, 5.3, z + 4.6), 0.17, 0.15, cTrunk, { rings: 3, radial: 6 });
      await ctx.yield?.();
      for (let i = 0; i < 4; i++) { const px = x0 - s * br.range(1.6, 5), pz = z + br.range(-3.6, 3.6), k = br.range(0.8, 1.5);
        lathe(acc, [[0.02, 0], [0.5, 0.06], [0.95, 0.7], [0.9, 1.2], [0.5, 1.6], [0.46, 1.85], [0.6, 1.95], [0.5, 1.98]], 10, xf(px, 0, pz, 0, 0, 0, k), { colorFn: flat(i % 2 ? cClay : cClay.clone().lerp(pal.deep, 0.5), 0.15), mat: 3 }); }
      addStone(acc, x0 - s * 4.6, 0.25, z + 3.9, 1.3, 0.5, 1.2, C('#8a8a88'), br);
      await ctx.yield?.();
      for (let i = 0; i < 6; i++) { const pz = z - 4.4 + br.range(-0.3, 0.3), py = 0.2 + Math.floor(i / 3) * 0.36; tube(V3(x0 - s * 1.3, py, pz + (i % 3) * 0.4), V3(x0 - s * 4.2, py + 0.1, pz + (i % 3) * 0.4 + br.range(-0.3, 0.3)), 0.17, 0.13, cTrunkDark.clone().lerp(cTrunk, br()), { rings: 2, radial: 5 }); }
      const bx = x0 - s * 7.8, bz = z + br.range(-1.5, 1.5);
      lathe(acc, [[0.02, 0], [0.7, 0.04], [0.98, 0.5], [1.05, 1.05], [0.94, 1.1], [0.88, 0.6]], 12, xf(bx, 0, bz), { colorFn: flat(cRope, 0.1), mat: 1, uvScale: [6, 2] });
      for (let i = 0; i < 9; i++) { const a = br.range(0, TAU), d = br.range(0, 0.6); addStone(acc, bx + Math.cos(a) * d, 0.95 + br.range(0, 0.3), bz + Math.sin(a) * d, 0.28, 0.26, 0.28, pal.deep.clone().lerp(pal.blue, 0.3).multiplyScalar(0.7), br); }
      await ctx.yield?.();
    }
    // pegged hanks drying on the forecourt walls, a calabash vine with pale gourds along the wall foot
    for (const s of [-1, 1]) {
      for (let i = 0; i < 5; i++) { const z = -263 - i * 5.3 + br.range(-1, 1), y = br.range(7, 11), piv = [s * 47.7, y, z], ph = br.range(0, 6);
        tube(V3(s * 48, y, z), V3(s * 47.4, y + 0.1, z), 0.09, 0.07, cWood, { rings: 2, radial: 5 });
        tube(V3(s * 47.6, y, z), V3(s * 47.5, y - br.range(2.4, 3.6), z + 0.1), 0.4, 0.26, tierColor(br.range(1, 7), new THREE.Color(), pal), { rings: 5, radial: 7, mat: 1, kind: 1, piv, phase: ph, bow: 0.2 }); }
      const vp = []; for (let i = 0; i <= 12; i++) vp.push(V3(s * (47.6 - 0.5 * Math.abs(Math.sin(i * 1.7))), 0.25 + 1.1 * Math.abs(Math.sin(i * 0.9)), -258 - i * 2.4));
      addRope(acc, vp, 0.07, { color: C('#5c6a3a'), segs: 36, radial: 4 });
      for (let i = 1; i < 12; i += 2) lathe(acc, [[0.02, 0], [0.4, 0.08], [0.55, 0.42], [0.36, 0.8], [0.12, 1.0], [0.02, 1.02]], 9, xf(vp[i].x - s * 0.5, 0, vp[i].z + 0.4, br.range(-0.5, 0.5), 0, br.range(-0.5, 0.5), br.range(0.8, 1.3)), { colorFn: flat(cGourd, 0.15), mat: 3 });
      await ctx.yield?.();
    }
    // twelve pulley tripods over pits; stirring poles left rocking, dippers turning on the liquor
    for (const p of tripods) {
      // one leg straight behind the length as the flight comes up to it, the other two wide of it either side: an A with the cloth in it
      const apex = V3(p.x, 16.3, p.z), cam0 = samples[Math.round(uAtZ(p.z + 13, 0, 0.45) * 240)], face = Math.atan2(cam0.z - p.z, cam0.x - p.x) + (p.seed - 0.5) * 0.12;
      for (let i = 0; i < 3; i++) { const a = face + Math.PI + (i === 0 ? 0 : i === 1 ? 2.2 : -2.2), d = V3(Math.cos(a) * 5.75, 0, Math.sin(a) * 5.75);
        tube(V3(p.x + d.x, 0, p.z + d.z), V3(p.x - d.x * 0.06, 17.3, p.z - d.z * 0.06), 0.34, 0.19, cTrunk, { step: 2.6, radial: 7, v0: i * 7,
          colorFn: (t, aa, out) => out.copy(cTrunkDark).lerp(cTrunk, 0.55 + 0.45 * t).lerp(pal.ochre, 0.2).lerp(cStain, 0.4 * (1 - smoothstep(0, 0.2, t))) }); }
      addLashing(acc, apex, V3(0, 1, 0), 0.38, 1.2, 5, cRope, br);
      tube(V3(p.x - 2.5, 15.25, p.z), V3(p.x + 2.5, 15.25, p.z), 0.15, 0.15, cWood, { rings: 2, radial: 6 });
      for (const sx of [-1.6, 1.6]) addRope(acc, [V3(p.x, 16.1, p.z), V3(p.x + sx, 15.35, p.z)], 0.07, { color: cTar, segs: 2, radial: 4 });
    }
    await ctx.yield?.();
    const poleRng = rng.fork('poles'), distXZ = (x, z) => { let m = 1e9; for (const q of samples) { const d = (q.x - x) ** 2 + (q.z - z) ** 2; if (d < m) m = d; } return Math.sqrt(m); },
      near = pits.filter((p) => distToPath(p.x, 1, p.z) < 26).sort((a, b) => a.seed - b.seed), dragonAt = [];
    near.forEach((p, i) => {
      if (tripods.includes(p)) return;
      if (i % 3 === 0 && distXZ(p.x, p.z) > 9) {
        const a = poleRng.range(0, TAU), ca = Math.cos(a), sa = Math.sin(a), ph = poleRng.range(0, 6);
        const B = V3(p.x + ca * 3.4, -2.2, p.z + sa * 3.4), Lp = V3(p.x + ca * 4.52, 0.1, p.z + sa * 4.52), d = Lp.clone().sub(B).normalize(), T = B.clone().addScaledVector(d, poleRng.range(6.2, 7.6)), piv = [Lp.x, Lp.y, Lp.z];
        tube(B, T, 0.15, 0.11, cTrunk, { step: 1.5, radial: 6, kind: 3, phase: ph, piv, bow: 0.1, bowDir: V3(-sa, 0, ca), colorFn: (t, aa, out, y) => out.copy(cTrunk).multiplyScalar(0.85).lerp(cStain, 1 - smoothstep(0.2, 2.4, y)) });
        tube(T.clone().addScaledVector(V3(-sa, 0, ca), -0.5), T.clone().addScaledVector(V3(-sa, 0, ca), 0.5), 0.07, 0.07, cTrunk, { rings: 2, radial: 5, kind: 3, phase: ph, piv });
      }
      if (i % 3 === 1) {
        const b = poleRng.range(0, TAU), cx = p.x + Math.cos(b) * 2.3, cz = p.z + Math.sin(b) * 2.3, piv = [cx, PIT_Y + 0.22, cz], ph = poleRng.range(0, 6);
        lathe(acc, [[0.02, -0.5], [0.36, -0.42], [0.56, -0.16], [0.62, 0.06], [0.57, 0.08], [0.51, -0.13], [0.31, -0.35], [0.02, -0.41]], 12, xf(cx, PIT_Y + 0.22, cz), { colorFn: flat(cGourd, 0.1), mat: 3, kind: 4, phase: ph, piv });
        tube(V3(cx + 0.55, PIT_Y + 0.25, cz), V3(cx + 1.25, PIT_Y + 0.5, cz + 0.1), 0.12, 0.07, cGourd, { rings: 2, radial: 5, mat: 3, kind: 4, phase: ph, piv });
      }
      if (i % 3 === 2 || i % 4 === 0) dragonAt.push([p.x + poleRng.range(-2, 2), 1.6 + poleRng.range(0, 1.4), p.z + poleRng.range(-2, 2)]);
    });
    await ctx.yield?.();
    // two pied crows perched on the hero's head beam
    HA.perches.slice(0, 2).forEach((pp, i) => {
      const P = toW(pp).add(V3(0, -0.05, 0)), piv = [P.x, P.y, P.z], ph = i * 2.4, ry = (i ? 2.6 : -0.5) + HERO_RY, blk = C('#16161c'), wht = C('#e9e6dc').multiplyScalar(0.8);
      const part = (g, m, c0) => acc.add(g, xf(P.x, P.y, P.z, 0, ry, 0).multiply(m), { color: c0, mat: 8, kind: 5, phase: ph, piv });
      part(new THREE.SphereGeometry(1, 9, 7), xf(0, 0.62, 0, -0.5, 0, 0, 0.36, 0.4, 0.66), blk);
      part(new THREE.SphereGeometry(1, 8, 6), xf(0, 0.6, 0.28, -0.4, 0, 0, 0.3, 0.3, 0.36), wht);
      part(new THREE.SphereGeometry(1, 8, 6), xf(0, 1.08, 0.5, 0, 0, 0, 0.24, 0.24, 0.27), blk);
      part(new THREE.ConeGeometry(0.1, 0.42, 6), xf(0, 1.06, 0.88, Math.PI / 2, 0, 0), C('#24242a'));
      part(new THREE.BoxGeometry(0.34, 0.06, 0.8, 2, 1, 2), xf(0, 0.3, -0.72, 0.5, 0, 0), blk);
      for (const sx of [-0.14, 0.14]) part(new THREE.CylinderGeometry(0.035, 0.035, 0.34, 4), xf(sx, 0.12, 0.05), C('#24242a'));
    });
    await ctx.yield?.();
    const solids = new THREE.Mesh(await acc.buildAsync(ctx), solidMaterial(mkU({ uStain: { value: cStain } })));
    solids.frustumCulled = false; scene.add(solids);
    await ctx.yield?.();
    const ropes = ribbonMesh(ropeSegs, YU, cTar.clone().lerp(cRope, 0.25).multiplyScalar(0.6)); scene.add(ropes);
    await ctx.yield?.();

    // ---- a thin veil of glare in the store's doorway (the yard itself must read through it from the first second);
    // it thins round the line of sight to the foot of the rising length, so that stays the clearest thing in the door.
    {
      const g = new THREE.PlaneGeometry(16, 13); g.translate(0, 6.5, 0.3);
      const glare = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { uGlare: { value: lc(L.door || L.haze).multiplyScalar(lookName === 'night' ? 0.1 : 0.13) } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
        vertexShader: /* glsl */`varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          uniform vec3 uGlare; varying vec3 vW;
          void main(){
            vec3 cp = cameraPosition; float inside = smoothstep(2.5, 22., cp.z);
            vec2 far = cp.xy + (vW.xy - cp.xy) * ((cp.z + 150.) / max(cp.z - vW.z, .5));
            float notch = (1. - smoothstep(2., 5.5, abs(far.x))) * smoothstep(-1.5, .5, far.y) * (1. - smoothstep(7., 12., far.y));
            float a = inside * (1. - .9 * notch) * (.75 + .25 * smoothstep(0., 13., vW.y));
            gl_FragColor = vec4(uGlare * a, 1.);
          }`,
      }));
      glare.frustumCulled = false; glare.renderOrder = 4; scene.add(glare);
    }

    // ---- agama lizards: one instanced creature, hashed push-ups, head bobs and metre-long darts.
    // aLz = phase, male, dart metres, flag (1 scatters up the gate at the end, -1 the scripted one on the hero's leg)
    const lizN = Math.max(24, Math.round(60 * Math.min(1, busy))) + 3;
    const lizU = mkU({ uPush: { value: 0 }, uScatter: { value: 0 } });
    const lizards = (() => {
      const la = new Acc(), ind = pal.deep.clone().lerp(pal.blue, 0.55), org = pal.orange.clone();
      addTube(la, V3(0, 0.07, -0.74), V3(0, 0.12, 0.47), { rings: 14, radial: 7, cap: true,
        radiusFn: (t) => t < 0.52 ? lerp(0.018, 0.075, Math.pow(t / 0.52, 0.8)) : t < 0.8 ? 0.075 + 0.05 * Math.sin((t - 0.52) / 0.28 * Math.PI) : t < 0.86 ? 0.07 : lerp(0.092, 0.03, Math.pow((t - 0.86) / 0.14, 1.6)),
        colorFn: (t, a, out) => { if (t > 0.8) out.copy(org); else if (t < 0.5) out.copy(Math.floor(t * 22) % 2 ? ind : ind.clone().lerp(pal.sky, 0.5)).lerp(ind, t < 0.2 ? 0 : 0.5); else out.copy(ind).lerp(pal.blue, 0.35 * Math.sin((t - 0.5) / 0.3 * Math.PI)); out.multiplyScalar(0.62 + 0.38 * Math.cos(a - Math.PI / 2)); } });
      for (const sx of [-1, 1]) for (const [z0, z1, c0] of [[0.2, 0.3, ind], [-0.1, -0.24, ind]]) {
        addTube(la, V3(sx * 0.07, 0.1, z0), V3(sx * 0.27, 0.14, (z0 + z1) / 2), { rings: 1, radial: 4, radiusFn: () => 0.044, colorFn: (t, a, out) => out.copy(c0).multiplyScalar(0.8) });
        addTube(la, V3(sx * 0.27, 0.14, (z0 + z1) / 2), V3(sx * 0.4, 0.0, z1), { rings: 1, radial: 4, cap: true, radiusFn: (t) => lerp(0.04, 0.026, t), colorFn: (t, a, out) => out.copy(c0).multiplyScalar(0.7) });
      }
      const g = la.build(), list = [], lr = rng.fork('lizards'), X = new THREE.Vector3(), m = new THREE.Matrix4();
      const put = (P, n, f, o = {}) => list.push({ P, n: n.clone().normalize(), f: f.clone().normalize(), ph: lr.range(0, 40), male: o.male ?? (lr() < 0.6 ? 1 : 0), dart: o.dart ?? lr.range(0.3, 1), flag: o.flag || 0, s: o.s ?? lr.range(0.85, 1.15), gate: o.gate || 0 });
      put(V3(0, 0, 0), V3(0, 0, 1), V3(0, 1, 0), { male: 1, dart: 0, flag: -1, s: 1.15 });                 // scripted, placed every frame
      legsW.forEach((lg, i) => { const y = [9, 17, 6][i], t = y / lg.top.y, P = lg.foot.clone().lerp(lg.top, t), ax = lg.top.clone().sub(lg.foot).normalize(), n = V3(i === 2 ? 1 : 0, 0, i === 2 ? 0.3 : 1).normalize();
        n.addScaledVector(ax, -n.dot(ax)).normalize(); put(P.addScaledVector(n, lerp(0.56, 0.3, t) + 0.02), n, ax, { dart: 0.5 }); });
      const up = V3(0, 1, 0);
      // on the gate they keep to the two buttress fronts (between the hung lengths) and the band under the parapet, each
      // heading its own way; a negative light value marks the ones lit by the gate's raking light
      const heading = (lo = -2.5, hi = 2.5) => { const a = lr.range(lo, hi); return V3(Math.sin(a), Math.cos(a), 0); };
      const butZ = (y) => -289.3 + 0.9 * lerp(1, 0.7, y / 26.4) + 0.07;
      for (let i = 0; i < 9; i++) { const s = i % 2 ? 1 : -1, y = 3 + (i >> 1) * 4.1 + lr.range(-1, 1); put(V3(s * (12.6 + lr.range(-0.6, 0.6)), y, butZ(y)), V3(0, 0.01, 1), heading(), { flag: 1, male: i < 6 ? 1 : 0, s: i < 3 ? 1.3 : lr.range(0.85, 1.1), gate: 1 }); }
      for (let i = 0; i < 4; i++) put(V3((i - 1.5) * 4.2 + lr.range(-1, 1), lr.range(24.2, 25.4), -289.95), V3(0, 0, 1), heading(-1.9, 1.9), { flag: 1, male: i % 2, gate: 1 });
      for (let i = 0; i < 4; i++) { const s = i % 2 ? 1 : -1; put(V3(s * (i < 2 ? lr.range(8.9, 9.6) : lr.range(10.5, 13.5)), i < 2 ? lr.range(4.5, 8.5) : lr.range(3, 11), 1.62), V3(0, 0, 1), heading(i < 2 ? -1.2 : -2.6, i < 2 ? 1.2 : 2.6), i < 2 ? { male: 1, s: 1.25, dart: 0.4 } : {}); }
      for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1, z = -260 - 12 * Math.floor(i / 2) - 0.1; put(V3(s * 46.15, lr.range(3, 14), z - 0.4), V3(-s, 0, 0), V3(0, 1, lr.range(-0.4, 0.4)), { flag: 1 }); }
      const ms = mastList.map(([x, z]) => ({ x, z, d: distToPath(x, 8, z) })).filter((q) => q.d < 30 && q.d > 6.5).sort((a, b) => a.d - b.d);
      for (let i = 0; list.length < lizN && i < ms.length * 2; i++) {
        const q = ms[(i * 3) % ms.length], cy = samples[Math.round(uAtZ(q.z, q.z < HZ ? 0.66 : 0, q.z < HZ ? 1 : 0.42) * 240)].y;
        const y = clamp(cy + lr.range(-3, 5), 2, 30), a = Math.atan2(-q.x, 0.4) + lr.range(-1.1, 1.1) + (q.z < HZ ? 0 : 0), n = V3(Math.sin(a), 0, Math.cos(a));
        put(V3(q.x + n.x * (lerp(0.56, 0.3, y / 42) * 0.74 + 0.03), y, q.z + n.z * (lerp(0.56, 0.3, y / 42) * 0.74 + 0.03)), n, V3(0, lr() < 0.75 ? 1 : -1, 0));
      }
      const im = new THREE.InstancedMesh(g, new THREE.ShaderMaterial({
        uniforms: lizU, fog: true, vertexColors: true,
        vertexShader: FOG_V + GLSL_COMMON + /* glsl */`
          attribute vec4 aLz; attribute float aLq; uniform float uPush, uScatter;
          varying vec3 vW, vN, vCol; varying float vMale, vLq, vH;
          void main(){
            vec3 p = position; float ph = aLz.x, cyc = uTime * .45 + ph, n = floor(cyc), fr = fract(cyc), act = h11(n * 1.3 + ph * 7.);
            vH = position.y;
            // no two lie alike: the body curves one way, the tail the other
            float bd = aLz.w < -.5 ? 0. : (h11(ph * 1.7 + 3.) - .5) * 1.6; p.x += bd * p.z * p.z * (p.z < 0. ? 1.5 : -.8);
            float push = act > .45 ? max(sin(fr * 37.7), 0.) * step(fr, .5) : 0.;
            if (aLz.w < -.5) push = uPush;
            p.y += push * .12 * smoothstep(-.25, .35, p.z);
            p.y += (act < .3 ? max(sin(fr * 50.), 0.) * step(fr, .3) : 0.) * .05 * smoothstep(.25, .45, p.z);
            p.x += sin(uTime * 2.3 + ph + p.z * 5.) * .07 * smoothstep(-.05, -.75, p.z);
            float dart = mix(h11(n - 1. + ph) - .5, h11(n + ph) - .5, smoothstep(.82, 1., fr)) * 2. * aLz.z;
            dart += uScatter * max(aLz.w, 0.) * (3. + 5. * h11(ph));
            p.x += sin(dart * 9.) * .04; p.z += dart;
            vec4 w = instanceMatrix * vec4(p, 1.); vW = w.xyz; vN = normalize(mat3(instanceMatrix) * normal + vec3(0., 1e-5, 0.)); vCol = color; vMale = aLz.y; vLq = aLq;
            vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: FOG_F + GLSL_YARD + /* glsl */`
          varying vec3 vW, vN, vCol; varying float vMale, vLq, vH;
          void main(){
            vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); float l = dot(vCol, vec3(.4, .4, .2));
            vec3 alb = mix(vec3(l) * vec3(1.5, 1.25, .95) + vec3(.06, .05, .04), vCol, vMale);
            alb *= .8 + .4 * vn3(vW * 60.);
            alb *= mix(.42, 1., smoothstep(.0, .1, vH));                    // the belly and the feet in the body's own shade
            float warm = smoothstep(.1, .4, vCol.r - vCol.b) * vMale;
            vec3 Ld = vLq < 0. ? uGateSun.xyz : uSunDir; float lq = abs(vLq);
            vec3 sunL = vLq < 0. ? uSunCol * gateLit(vW) : uSunCol * mix(uFilt, vec3(1.), smoothstep(.15, .9, lq)) * lq;
            float ndl = dot(N, Ld), dif = smoothstep(-.1, .5, ndl) * max(ndl * .85 + .15, 0.);
            vec3 amb = ambAt(N, vW);
            vec3 V = normalize(cameraPosition - vW + vec3(1e-5));
            vec3 c = alb * (sunL * dif + amb * 1.2) + alb * warm * (.2 + dot(amb, vec3(.5)));
            c += sunL * pow(max(dot(N, normalize(Ld + V + vec3(1e-5))), 0.), 24.) * .12 * step(0., ndl);
            gl_FragColor = vec4(max(c, 0.), 1.);
            #include <fog_fragment>
          }`,
      }), list.length);
      const aLz = new Float32Array(list.length * 4), aLq = new Float32Array(list.length);
      const setM = (i, P, n, f, s) => { X.crossVectors(n, f).normalize(); m.makeBasis(X, n, f).scale(V3(s, s, s)).setPosition(P); im.setMatrixAt(i, m); };
      list.forEach((o, i) => { o.f.addScaledVector(o.n, -o.f.dot(o.n)).normalize(); setM(i, o.P, o.n, o.f, o.s * 1.0); aLz.set([o.ph, o.male, o.dart, o.flag], i * 4); aLq[i] = i === 0 ? 1 : o.gate ? -1 : lum(trace(o.P.x + o.n.x * 0.4, o.P.y, o.P.z + o.n.z * 0.4 - 0.25)); });
      const lzAttr = new THREE.InstancedBufferAttribute(aLz, 4);
      g.setAttribute('aLz', lzAttr); g.setAttribute('aLq', new THREE.InstancedBufferAttribute(aLq, 1));
      im.frustumCulled = false; scene.add(im);
      { // a soft dark patch under each, moving with it, so it sits on its wall or trunk
        const sg = new THREE.PlaneGeometry(0.9, 1.75); sg.rotateX(-Math.PI / 2); sg.translate(0, 0.012, -0.1); sg.setAttribute('aLz', lzAttr);
        const sh = new THREE.InstancedMesh(sg, new THREE.ShaderMaterial({
          uniforms: lizU, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide, fog: false,
          vertexShader: GLSL_COMMON + /* glsl */`
            attribute vec4 aLz; uniform float uScatter; varying vec2 vS;
            void main(){
              vec3 p = position; float ph = aLz.x, cyc = uTime * .45 + ph, n = floor(cyc), fr = fract(cyc);
              float dart = mix(h11(n - 1. + ph) - .5, h11(n + ph) - .5, smoothstep(.82, 1., fr)) * 2. * aLz.z + uScatter * max(aLz.w, 0.) * (3. + 5. * h11(ph));
              p.z += dart; vS = uv * 2. - 1.;
              gl_Position = projectionMatrix * viewMatrix * instanceMatrix * vec4(p, 1.);
            }`,
          fragmentShader: /* glsl */`
            varying vec2 vS;
            void main(){ float r = length(vS * vec2(1., .92)), a = (1. - smoothstep(.25, 1., r)) * .5; gl_FragColor = vec4(0.02, 0.02, 0.05, a); }`,
        }), list.length);
        sh.instanceMatrix = im.instanceMatrix; sh.frustumCulled = false; sh.renderOrder = 1; scene.add(sh);
      }
      return { im, setM, list };
    })();
    // the scripted agama: on the hero's back trunk as the camera passes behind it
    const LIZ = (() => {
      let best = null;
      for (let u = 0.555; u <= 0.5551; u += 0.004) { const c = path.pointAt(u), g = V3(HX - c.x, 0, HZ - c.z).normalize(); for (const lg of legsW) { const y = c.y - 0.6, t = y / lg.top.y, P = lg.foot.clone().lerp(lg.top, t), d = P.distanceTo(c);
        const ang = Math.acos(clamp(V3(P.x - c.x, 0, P.z - c.z).normalize().dot(g), -1, 1)), sc = d * 0.3 + 26 * Math.max(0, ang - 0.1); if (d < 16 && (!best || sc < best.sc)) best = { d, u, lg, y, sc }; } }
      if (!best) best = { d: 9, u: 0.555, lg: legsW[1], y: path.pointAt(0.555).y - 0.6 };
      const ax = best.lg.top.clone().sub(best.lg.foot).normalize(), c = path.pointAt(best.u), t = best.y / best.lg.top.y, P0 = best.lg.foot.clone().lerp(best.lg.top, t);
      const n0 = c.clone().sub(P0); n0.addScaledVector(ax, -n0.dot(ax)).normalize();
      return { u: best.u, d: best.d, ax, P0, n0, r: lerp(0.56, 0.3, t) + 0.03, n: new THREE.Vector3(), P: new THREE.Vector3(), f: new THREE.Vector3() };
    })();

    // ---- laughing doves (or cattle egrets) walking the pit rims
    const walkers = (() => {
      const da = new Acc(), body = egrets ? C('#f1eee4').multiplyScalar(0.85) : C('#c9b0a8').multiplyScalar(0.8), dark = egrets ? C('#d8b060') : C('#6a5a60');
      const part = (g, m, c0) => da.add(g, m, { color: c0, mat: 8 });
      part(new THREE.SphereGeometry(1, 8, 6), xf(0, egrets ? 0.62 : 0.3, 0, -0.25, 0, 0, 0.19, egrets ? 0.24 : 0.2, 0.36), body);
      part(new THREE.SphereGeometry(1, 7, 5), xf(0, egrets ? 1.08 : 0.54, 0.3, 0, 0, 0, 0.11, 0.12, 0.13), body.clone().multiplyScalar(egrets ? 1 : 0.92));
      part(new THREE.ConeGeometry(0.04, egrets ? 0.3 : 0.15, 5), xf(0, egrets ? 1.06 : 0.53, egrets ? 0.56 : 0.47, Math.PI / 2, 0, 0), dark);
      part(new THREE.BoxGeometry(0.2, 0.04, 0.42, 1, 1, 2), xf(0, egrets ? 0.56 : 0.3, -0.42, 0.25, 0, 0), body.clone().multiplyScalar(0.75));
      if (egrets) { part(new THREE.CylinderGeometry(0.05, 0.07, 0.42, 5), xf(0, 0.86, 0.2, 0.5, 0, 0), body); for (const sx of [-0.07, 0.07]) part(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 4), xf(sx, 0.22, 0), dark); }
      const g = da.build(), n = Math.round(30 * Math.min(1.2, busy)), aDv = new Float32Array(n * 4), aDw = new Float32Array(n * 2), wr = rng.fork('walkers');
      const rims = pits.filter((p) => distToPath(p.x, 1, p.z) < 24 && !tripods.includes(p));
      for (let i = 0; i < n; i++) { const p = rims[(i * 7 + 3) % rims.length]; aDv.set([p.x, p.z, wr.range(0, TAU), wr.sign() * wr.range(0.5, 1)], i * 4); aDw.set([wr.range(0, 40), p.z < -84 && p.z > -112 ? 1 : 0], i * 2); }
      const ig = new THREE.InstancedBufferGeometry(); ig.setIndex(g.index); for (const k of ['position', 'normal', 'color']) ig.setAttribute(k, g.attributes[k]);
      ig.setAttribute('aDv', new THREE.InstancedBufferAttribute(aDv, 4)); ig.setAttribute('aDw', new THREE.InstancedBufferAttribute(aDw, 2)); ig.instanceCount = n;
      const U = mkU({ uGone: { value: 0 } });
      const mesh = new THREE.Mesh(ig, new THREE.ShaderMaterial({
        uniforms: U, fog: true, vertexColors: true,
        vertexShader: FOG_V + GLSL_COMMON + /* glsl */`
          attribute vec4 aDv; attribute vec2 aDw; uniform float uGone;
          varying vec3 vW, vN, vCol;
          void main(){
            float ph = aDw.x, tt = uTime * .5 + ph, walk = tt + sin(tt * 1.3) * .7;
            float ang = aDv.z + aDv.w * walk * .11, sp = aDv.w * (1. + .91 * cos(tt * 1.3));
            vec3 p = position; p.y += abs(sin(walk * 9.)) * .03 * step(.2, abs(sp));
            p.z += sin(walk * 18.) * .035 * smoothstep(.4, .5, position.y) * step(.2, abs(sp));
            p *= 1. - uGone * aDw.y;
            vec2 d = vec2(cos(ang), sin(ang)), tg = vec2(-d.y, d.x) * sign(aDv.w);
            vec3 w = vec3(aDv.x + d.x * 4.95, .12, aDv.y + d.y * 4.95) + vec3(tg.y * p.x + tg.x * p.z, p.y, -tg.x * p.x + tg.y * p.z);
            vN = vec3(tg.y * normal.x + tg.x * normal.z, normal.y, -tg.x * normal.x + tg.y * normal.z); vW = w; vCol = color;
            vec4 mvPosition = viewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: FOG_F + GLSL_YARD + /* glsl */`
          varying vec3 vW, vN, vCol;
          void main(){ vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); float ndl = dot(N, uSunDir);
            vec3 c = vCol * (uSunCol * sunAt(vW) * smoothstep(-.1, .5, ndl) * max(ndl * .85 + .15, 0.) + ambAt(N, vW) * 1.25) * mix(.6, 1., smoothstep(.1, .5, vW.y));
            gl_FragColor = vec4(max(c, 0.), 1.);
            #include <fog_fragment>
          }`,
      }));
      mesh.frustumCulled = false; scene.add(mesh); g.dispose();
      return { mesh, U };
    })();
    await ctx.yield?.();

    // ---- birds, dragonflies (kit fauna, lit with the yard's sun)
    const birdLight = { sunDir: sun.clone(), sunColor: L.sunCol[0], sunIntensity: L.sunCol[1] * 0.8, sky: L.sky[0], skyIntensity: L.sky[1] * 2.6, ground: PAL[1], groundIntensity: L.gnd[1] * 2.4 };
    const fauna = F.makeFauna(scene, { light: birdLight });
    const pied = { body: '#1d1d24', belly: '#eeeae0', wingC: '#1a1a22', trail: '#22222c', tip: '#111118', beak: '#2a2a30', head: '#1a1a20', neckC: '#eeeae0' };
    fauna.add(F.makeFlock({ rng: rng.fork('door-crow'), species: 'crows', count: 1, size: 3, speed: 10, spread: [0.1, 0.1, 0.1], wander: [0.6, 0.5, 0.6, 0.5], flap: 3.2, glide: 0.1,
      along: { path, side: 1.2, up: 2.4, lead: 14, from: 0.02, to: 0.21, drift: 2 }, ...pied }), { always: true });
    fauna.add(F.makeFlock({ rng: rng.fork('well-crows'), species: 'crows', count: 6, size: 3, speed: 9, center: [HX, 38.5, HZ], radius: 19, height: 2.5, spread: [4, 1.5, 16], wander: [1.5, 1, 1.5, 0.4], ...pied }));
    fauna.add(F.makeFlock({ rng: rng.fork('aisle-crows'), species: 'crows', count: 3, size: 3, speed: 10, spread: [5, 2, 9], cross: { path, u: 0.8, lead: 46, angle: 75, side: -1, height: 9, span: 110, duration: DUR }, ...pied }));
    const dovePal = egrets ? { body: '#f4f1e8', belly: '#ffffff', wingC: '#efece2', trail: '#f6f4ee', tip: '#e2ddd0', beak: '#d8a850', head: '#f3ead2' }
      : { body: '#c9b0a8', belly: '#e6d6cf', wingC: '#b7a2a0', trail: '#d8c8c4', tip: '#6e6066', beak: '#5a4a4c', head: '#d2b6b0' };
    const DOVE_U = 0.33;
    const doves = fauna.add(F.makeFlock({ rng: rng.fork('doves'), species: 'gulls', count: Math.round(16 * busy), size: egrets ? 1.25 : 0.9, speed: 13, form: 'loose', spread: [5, 1.6, 9], wander: [1.4, 0.9, 1.4, 0.9],
      flap: egrets ? 3.4 : 5.2, amp: 0.8, glide: 0.08, cross: { path, u: DOVE_U, lead: 13, angle: 24, side: 1, height: 0.5, rise: 8.5, span: 70, duration: DUR }, ...dovePal }), { always: true });
    if (dragonAt.length) fauna.add(F.makeDragonflies({ rng: rng.fork('dragonflies'), count: Math.min(dragonAt.length * 2, Math.round(26 * detail)), size: 5, positions: dragonAt, roam: [3.2, 0.8, 0.7, 0] }));
    await ctx.yield?.();

    // ---- air: dust, neem leaflets, a dust devil along the left wall, kettle steam
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    const dust = set.add(fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', time, count: Math.round(2400 * detail), colors: ['#fff4dc', '#dfe6ff', '#ffffff'], intensity: 0.9, opacity: 0.55 * Math.min(L.dust, 1.2) }));
    set.add(fx.makeParticles({ rng: rng.fork('leaflets'), preset: 'leaves', time, follow: false, center: [0, 13, -279], box: [62, 26, 26], count: Math.round(230 * detail * busy), colors: ['#c9b24a', '#a8a24a', '#d8c060'], size: [0.22, 0.46], lightDir: sun.toArray() }));
    const devil = L.wet ? null : set.add(fx.makeDustDevil({ rng: rng.fork('devil'), time, position: [-30, 0, -274], height: 12, radius: [0.5, 2.2], color: '#d8c6a6', colorTop: '#e8dcc6', opacity: 0.28, wander: 3, sunDir: sun.toArray(), sunColor: L.sunCol[0], count: 46, debris: 90 }));
    set.add(fx.makeSmokeColumn({ rng: rng.fork('steam'), time, position: [8.5, 1.95, 7.4], height: 6.5, radius: [0.12, 1.3], size: [0.5, 2.3], count: 26, color: '#c4cad8', colorTop: '#e4e6ee', shadowColor: '#6a7088', ambient: '#30344a', opacity: 0.42, rate: 0.16, wind: [0.15, 0, 0.5], sunDir: sun.toArray() }));
    await ctx.yield?.();

    // ---- blades of light standing in the dust: the store's slit shafts, the hall's slivers, the canyon's sun
    const blades = (() => {
      const Q = [], kx = sun.x / sun.y, kz = sun.z / sun.y, at = (x, z) => shade.cpu[clamp(Math.floor((z - MAP_Z0) / MAP_L * shade.L), 0, shade.L - 1) * shade.W + clamp(Math.floor((x - MAP_X0) / MAP_W * shade.W), 0, shade.W - 1)];
      const slitX = sun.x < 0 ? -15 : 15;
      for (const z of [12, 24, 36, 48]) Q.push({ a: V3(slitX, 14.4, z), b: V3(slitX, 9.8, z), c: V3(slitX - kx * 14.4, 0, z - kz * 14.4), d: V3(slitX - kx * 9.8, 0, z - kz * 9.8), k: 7 });
      for (const z of [12, 24, 36, 48]) Q.push({ a: V3(slitX, 12.1, z - 1.2), b: V3(slitX, 12.1, z + 1.2), c: V3(slitX - kx * 12.1, 0, z - 1.2 - kz * 12.1), d: V3(slitX - kx * 12.1, 0, z + 1.2 - kz * 12.1), k: 9 });
      const found = [];
      for (const x of [-7, 7, -1]) { let last = 1e9; for (let z = -16; z > -126; z -= 0.4) { const l = at(x, z); if (l > 0.42 && l >= at(x, z - 0.4) && l >= at(x, z + 0.4) && Math.abs(z - last) > 5 && Math.hypot(x - HX, z - HZ) > 34) { found.push({ x, z, l }); last = z; } } }
      found.sort((p, q) => q.l - p.l);
      for (const f of found.slice(0, Math.round(22 * detail))) { const h = 13.4, hw = 3; Q.push({ a: V3(f.x - hw + kx * h, h, f.z + kz * h), b: V3(f.x + hw + kx * h, h, f.z + kz * h), c: V3(f.x - hw, 0, f.z), d: V3(f.x + hw, 0, f.z), k: 0.5 + 0.5 * f.l }); }
      for (let z = -186; z > -258; z -= 12.6) for (const x of [-6, 6]) if (at(x, z) > 0.5 && at(x, z - 2) > 0.5) { const h = 26, hw = 5; Q.push({ a: V3(x - hw + kx * h, h, z + kz * h), b: V3(x + hw + kx * h, h, z + kz * h), c: V3(x - hw, 0, z), d: V3(x + hw, 0, z), k: 0.55 }); }
      const n = Q.length, P = new Float32Array(n * 12), T = new Float32Array(n * 12), I = [];
      Q.forEach((q, i) => { [q.a, q.b, q.c, q.d].forEach((v, j) => { P.set([v.x, v.y, v.z], i * 12 + j * 3); T.set([j % 2, j < 2 ? 1 : 0, q.k], i * 12 + j * 3); }); I.push(i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aT', new THREE.BufferAttribute(T, 3)); g.setIndex(I);
      const U = mkU({ uBlade: { value: 0.026 * (L.bladeK ?? 1) * Math.min(1.3, 0.35 + L.dust) * (lookName === 'night' ? 2 : 1) } });
      const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: U, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: FOG_V + /* glsl */`
          attribute vec3 aT; varying vec3 vT, vW;
          void main(){ vT = aT; vW = position; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: FOG_F + GLSL_COMMON + /* glsl */`
          uniform float uBlade; varying vec3 vT, vW;
          void main(){
            float e = smoothstep(0., .22, vT.x) * smoothstep(1., .78, vT.x) * smoothstep(0., .1, vT.y) * smoothstep(1., .8, vT.y);
            float n = fbm2(vec2(vW.x * .35 + vW.z * .2 + uTime * .12, vW.y * .25 - uTime * .07));
            float tr = .75 + .25 * sin(uTime * 2.1 + vW.z * .7);
            float d = distance(cameraPosition, vW);
            float a = e * (.35 + 1.1 * n) * tr * vT.z * uBlade * smoothstep(1.5, 9., d) * (1. - smoothstep(110., 190., d));
            gl_FragColor = vec4(max(uSunCol * a * (1. - fogFactorSafe()), 0.), 1.);
          }`.replace('fogFactorSafe()', '(1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth))'),
      }));
      mesh.frustumCulled = false; mesh.renderOrder = 5; scene.add(mesh);
      return { mesh, count: n };
    })();
    await ctx.yield?.();

    // ---- two old neems in the forecourt (kit flora; the only things lit by three.js lights)
    const wind = FL.makeWind({ direction: [0.1, -1], strength: 0.9 });
    if (FL.prepareLeafTexture) await FL.prepareLeafTexture({}, () => ctx.yield?.());      // the kit's leaf atlas, drawn a slice at a time
    // dusty olive, thin enough for the sun to come through: lit from inside against the light, a pale gold edge where it catches them
    const leafMat = FL.windMaterial({ wind, backlight: 0.62, backlightTint: '#e4dfa2', wrap: 0.8, leafAmbient: L.neemAmb ?? 1.9, ambient: 2.4, sheen: 0.3 });
    await ctx.yield?.();
    for (const s of [-1, 1]) {
      const g = FL.oakGeometry({ rng: rng.fork('neem' + s), height: 28, detail: 2, leaf: '#84966a', leafLight: '#b8c08a', leafDark: '#5c6c4c', bark: '#a89a8c', barkDark: '#6a6058' });
      const k = clamp(11.5 / Math.max(g.userData.radius || 12, 1), 0.7, 1.3), tree = new THREE.Mesh(g, leafMat);
      tree.position.set(s * NEEM_X, 0, NEEM_Z); tree.scale.set(k, 1, k); tree.rotation.y = rng.range(0, TAU); scene.add(tree);
      await ctx.yield?.();
    }
    const sunLight = new THREE.DirectionalLight(lc(L.sunCol).multiplyScalar(1 / L.sunCol[1]), L.sunCol[1] * 1.1); sunLight.position.copy(sun).multiplyScalar(100).add(V3(0, 0, NEEM_Z)); sunLight.target.position.set(0, 0, NEEM_Z);
    scene.add(sunLight, sunLight.target, new THREE.HemisphereLight(new THREE.Color(L.sky[0]).lerp(new THREE.Color('#b4aaa2'), 0.5), new THREE.Color('#8a7664'), L.sky[1] * 2.3));
    await ctx.yield?.();

    // ---- the rare event: a gust strips one line of the left bank and twenty cloths sail down the canyon to the gate
    const sails = (() => {
      const n = 20, g = new THREE.PlaneGeometry(8, 5.2, 14, 9), aSc = new Float32Array(n * 4), aCalm = new Float32Array(n), sr2 = rng.fork('sails'), c = new THREE.Color(), items = [];
      const stripZ = stripLine >= 0 ? frZ(Math.floor(stripLine / 8)) : -234, y0 = T_Y0 + T_DY * 5 - 2.3;
      const land = pits.filter((p) => Math.abs(p.x) > 12 && p.z < -262).sort((a, b) => a.x - b.x);       // the two settle on the outer pits of the forecourt, left and right of the way
      for (let i = 0; i < n; i++) {
        tierColor(3.4 + sr2.range(-1.3, 1.5), c, pal); aSc.set([c.r, c.g, c.b, sr2.range(0, 6)], i * 4);
        const settle = (i === 4 || i === 12) && land.length ? land[(i === 4 ? 0 : land.length - 1)] : null;
        // a settling cloth comes down across the aisle-side rim of its pit: half on the lip and the earth, half in the liquor
        items.push({ p0: V3(-13.5 - i * 1.6, y0, stripZ), p1: settle ? V3(settle.x - Math.sign(settle.x) * 3.5, 0.4, settle.z + sr2.range(-1.2, 1.2)) : V3(sr2.sign() * sr2.range(1.5, 7), sr2.range(4, 15), -297),
          u0: 0.644 + ((i * 7) % 20) * 0.0028, u1: settle ? 0.86 : 0.644 + ((i * 7) % 20) * 0.0028 + sr2.range(0.105, 0.135), settle: !!settle, sp: sr2.range(0.7, 1.3) * sr2.sign(), ph: sr2.range(0, 6) });
      }
      g.setAttribute('aSc', new THREE.InstancedBufferAttribute(aSc, 4));
      const calmAttr = new THREE.InstancedBufferAttribute(aCalm, 1); calmAttr.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aCalm', calmAttr);
      const im = new THREE.InstancedMesh(g, new THREE.ShaderMaterial({
        uniforms: mkU({ uStain: { value: cStain }, uPale: { value: pal.haze.clone().multiplyScalar(0.8) } }), fog: true, side: THREE.DoubleSide,
        vertexShader: FOG_V + GLSL_COMMON + GLSL_PIT + /* glsl */`
          attribute vec4 aSc; attribute float aCalm; varying vec3 vW, vN, vCol; varying vec3 vUv2;
          // a loose cloth in the wind: two fold axes turning against each other, a belly that fills and empties, one corner curling
          vec3 sailAt(vec2 uvc, float ph, float calm){
            vec2 q = uvc * vec2(8., 5.2); float tt = uTime;
            float a1 = ph + tt * .7, a2 = ph * 1.7 - tt * .5 + 1.9;
            float w1 = dot(q, vec2(cos(a1), sin(a1))) * .6 + tt * 2.3 + ph, w2 = dot(q, vec2(cos(a2), sin(a2))) * 1.2 - tt * 3.1 + ph * 2.;
            float belly = cos(uvc.x * 3.1416) * cos(uvc.y * 3.1416) * (1.3 + .9 * sin(tt * 1.3 + ph * 3.));
            vec2 cd = uvc - vec2(sin(ph * 7.) > 0. ? .5 : -.5, .5); float curl = 1. - smoothstep(0., .55, length(cd));
            float z = 1.15 * sin(w1) + .55 * sin(w2) + belly + 2.2 * curl * curl * sin(tt * 1.9 + ph);
            float k = 1. - .16 * (1. - calm);                                   // folds take up cloth
            return vec3(q.x * k, q.y * k, z * mix(1., .05, calm));
          }
          void main(){
            vec2 uvc = uv - .5; float ph = aSc.w, e = .02;
            vec3 p = sailAt(uvc, ph, aCalm), px = sailAt(uvc + vec2(e, 0.), ph, aCalm), py = sailAt(uvc + vec2(0., e), ph, aCalm);
            vec3 n = normalize(cross(px - p, py - p) + vec3(0., 0., 1e-6));
            vec4 w = instanceMatrix * vec4(p, 1.); vec3 wn = normalize(mat3(instanceMatrix) * n + vec3(0., 1e-5, 0.));
            float wet = 0.;
            if (aCalm > 0.) {                                                   // settled: draped over the rim, the rest sunk in the liquor
              float d = pitAt(w.xz).x, rim = smoothstep(4.15, 4.85, d);
              float lie = mix(mix(-.66, -.45, smoothstep(2.3, 3.7, d)), .21 - .15 * smoothstep(4.9, 5.6, d), rim);   // afloat by the rim, sinking further in
              float wr = sin(w.x * 2.3 + ph) * sin(w.z * 2.9 + ph * 2.) + .5 * sin(w.x * 5.1 - w.z * 4.3);
              lie += .07 * wr * rim;
              w.y = mix(w.y, lie, aCalm);
              wn = normalize(mix(wn, vec3(.16 * cos(w.x * 2.3 + ph), 1., .16 * cos(w.z * 2.9 + ph * 2.)), aCalm));
              wet = (1. - smoothstep(4.3, 5.5, d + .5 * wr)) * aCalm;
            }
            vW = w.xyz; vN = wn; vCol = aSc.rgb; vUv2 = vec3(uv, wet);
            vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: FOG_F + GLSL_YARD + /* glsl */`
          uniform vec3 uStain, uPale;
          varying vec3 vW, vN, vCol; varying vec3 vUv2;
          void main(){
            vec3 N = normalize(vN + vec3(0., 0., 1e-5)); if (!gl_FrontFacing) N = -N;
            vec2 q = vUv2.xy * vec2(8., 5.2); float wet = vUv2.z;
            vec3 alb = vCol * (.8 + .4 * fbm2(q * 1.3 + vCol.b * 30.));
            // the bank's own resist work: roundels on most, stitched stripes on some, a few left plain
            float fq = fwidth(q.x) + fwidth(q.y), aa = fq * 1.5, pt = fract(vCol.b * 37. + vCol.g * 53.), res = 0.;
            if (pt < .6) { vec2 g = q / 1.45 + pt * 9.; vec2 id = floor(g); g.x += .5 * mod(id.y, 2.); vec2 f = fract(g) - .5; float r = length(f) * 1.5;
              res = (1. - smoothstep(.5, .54 + aa, r)) * smoothstep(.2, .24 + aa, r) + (1. - smoothstep(.07, .1 + aa, r)); }
            else if (pt < .85) { float sx = abs(fract(q.x / .9 + pt) - .5) * .9; res = (1. - smoothstep(.06, .08 + aa, sx)) * (.55 + .45 * step(.3, fract(q.y * 2.3 + vn2(q * 2.)))); }
            alb = mix(alb, mix(alb * 1.6, uPale, .4), clamp(res, 0., 1.) * .8 * (1. - smoothstep(.12, .5, fq)));
            float slub = vn2(vec2(q.x * 2.5, q.y * 50.)) * .5 + vn2(vec2(q.x * 50., q.y * 2.5)) * .5; alb *= .92 + .16 * slub;
            vec2 e = min(vUv2.xy, 1. - vUv2.xy) * vec2(8., 5.2); alb *= 1. - .3 * (1. - smoothstep(.1, .18, min(e.x, e.y)));
            alb = mix(alb, alb * .34 + uStain * .05, wet);
            float ndl = dot(N, uSunDir); vec3 sunL = uSunCol * sunAt(vW);
            vec3 tcol = pow(alb + 1e-4, vec3(.86)); float tl = dot(tcol, vec3(.3, .5, .2)); tcol = max(mix(vec3(tl), tcol, 1.75), 0.);
            vec3 V = normalize(cameraPosition - vW + vec3(1e-5)); float nv = abs(dot(N, V));
            float fold = mix(.42, 1.06, smoothstep(.08, .8, nv));                 // folds turning away from us fall dark
            vec3 c = (alb * (sunL * (max(ndl, 0.) * .8 + .05) + ambAt(N, vW) * 1.15) + tcol * sunL * pow(max(-ndl, 0.) + 1e-4, .55) * .5 * (1. - wet)) * mix(fold, 1., wet);
            c += (alb * 2. + .03) * sunL * pow(1. - nv, 4.) * .55 * (1. - wet);     // and their edges catch the sun
            c += sunL * pow(max(dot(N, normalize(uSunDir + V + vec3(1e-5))), 0.), 50.) * wet * .9;
            gl_FragColor = vec4(max(c, 0.), 1.);
            #include <fog_fragment>
          }`,
      }), n);
      im.frustumCulled = false; im.visible = false; scene.add(im);
      const P = new THREE.Vector3(), S = new THREE.Vector3(), m = new THREE.Matrix4();
      const place = (u, t) => {
        for (let i = 0; i < n; i++) {
          const o = items[i], s = clamp((u - o.u0) / (o.u1 - o.u0), 0, 1), fl = 1 - s;
          P.set(lerp(o.p0.x, o.p1.x, smoothstep(0, 0.5, s)) + Math.sin(s * 9 + o.ph) * 2.6 * fl * Math.min(1, s * 5),
            lerp(o.p0.y, o.p1.y, smoothstep(0, o.settle ? 1 : 0.75, s)) + Math.sin(s * 13 + o.ph * 2) * 1.8 * fl * Math.min(1, s * 5),
            lerp(o.p0.z, o.p1.z, Math.pow(s, 1.12)));
          const k = s <= 0 ? 0 : (o.settle ? 1 : Math.min(1, s * 12) * (1 - smoothstep(0.86, 1, s))), calm = o.settle ? smoothstep(0.7, 1, s) : 0;
          _e.set(lerp(s * 5.5 * o.sp + 0.3 * Math.sin(t * 1.7 + o.ph), -Math.PI / 2, calm), lerp(s * 2.2 * o.sp + o.ph, 0, calm), lerp(Math.sin(s * 5 + o.ph) * 0.7, o.ph, calm));
          m.compose(P, _q.setFromEuler(_e), S.set(k, k, k)); im.setMatrixAt(i, m); aCalm[i] = calm;
        }
        im.instanceMatrix.needsUpdate = true; calmAttr.needsUpdate = true;
      };
      return { im, place };
    })();

    // ---- frame
    const camP = new THREE.Vector3(), tmp = new THREE.Vector3(), gaze = new THREE.Vector3(), fogC = new THREE.Color(), AX = new THREE.Vector3();
    const camY = (u) => path.pointAt(u, tmp).y, H0 = 2 * DUR * U_RISE0, Y_RISE0 = camY(U_RISE0), dRise = camY(U_RISE1) - Y_RISE0;
    const TRIP0 = tripods[0] || null;
    const U_GUST = 0.235, Z_GUST = path.pointAt(U_GUST, tmp).z, look = new THREE.Vector3(), ahead = new THREE.Vector3();
    let idle = 0;
    return {
      scene, path, duration: DUR, title: 'The Blue Yard', ride: 'none',
      // steady through the store and down the nave, slowest up the face of the length, quick again down the canyon
      pace: (u) => 1.12 - 0.56 * smoothstep(0.4, 0.47, u) * (1 - smoothstep(0.57, 0.64, u)),
      camera: { fov: 62, near: 0.3, far: 1400, lookAhead: 16, sway: 0.7, bank: 0.42 },
      pois: [
        // down the nave the gaze dips to the pits ahead, and during the skim (u 0.22 to 0.28) into the one mirror under us
        { at: (t, u) => { const sk = smoothstep(0.2, 0.235, u) * (1 - smoothstep(0.262, 0.295, u)); path.pointAt(Math.min(u + lerp(26, 12, sk) / PL, 1), look); look.y = lerp(-2, -5, sk); return look; }, from: 0.02, to: 0.31, weight: 0.46, fade: 0.16 },
        // the close pass: the wet length rising on the first tripod, left of the flight
        ...(TRIP0 ? [{ at: [TRIP0.x + 1.8, 5.2, TRIP0.z], from: 0.085, to: 0.192, weight: 0.6, fade: 0.3 }] : []),
        // then up to the hero, whole from liquor to drum, as the doves go up in front of it
        { at: [HX, 20, HZ], from: 0.275, to: 0.42, weight: 0.9, fade: 0.3 },
        // the length: whole from the mouth of the well, then level with the camera up its face; let go as we round its side
        { at: (t, u) => {
          gaze.set(HX, lerp(16, camY(u) + 3.5, smoothstep(0.43, 0.5, u)) - 5 * smoothstep(0.55, 0.6, u), HZ + 1.6 * smoothstep(0.525, 0.545, u) * (1 - smoothstep(0.56, 0.585, u)));
          return gaze.lerp(path.pointAt(Math.min(u + 16 / PL, 1), ahead), smoothstep(0.562, 0.6, u));
        }, from: 0.36, to: 0.61, weight: 0.95, fade: 0.2 },
        // over the canyon: down into the pits between the lanes, the aisle, the gate and the portal held in the top of the frame
        { at: (t, u) => { path.pointAt(Math.min(u + 30 / PL, 1), look); look.y = -7; return look; }, from: 0.645, to: 0.775, weight: 0.5, fade: 0.4 },
      ],
      portal: { shape: 'arch', width: 13, height: 16.5, color: L.portal, glow: 0.9, revealDistance: 170 },
      post: { exposure: L.exposure, bloom: { strength: 0.3, radius: 0.62, threshold: 1.08 },
        grade: { saturation: L.sat, contrast: 1.05, tint: L.tint, shadowTint: L.shadow, vignette: 0.3, grain: 0.022, aberration: 0 } },
      update(dt, t, camera, u) {
        time.value = t;
        camP.setFromMatrixPosition(camera.matrixWorld);
        // the length is hauled at 2 m/s; during the rise it keeps pace with the camera so one row of roundels stays level
        idle += dt * 2 * (1 - smoothstep(0, 0.02, u));
        const haul = u < U_RISE0 ? 2 * DUR * u : u < U_RISE1 ? H0 + (camY(u) - Y_RISE0) : H0 + dRise + 2 * DUR * (u - U_RISE1);
        hero.setHaul(haul + idle); hero.setWind(1 + 0.45 * Math.sin(t * 0.7) ** 2); hero.update(dt, t, camera);
        sky.position.copy(camP);
        // haze: blue under the hanging, warm pale dust in the open
        const open = camP.z > 1.5 ? 0.9 : Math.max(shade.openAt(camP.x, camP.z), smoothstep(13, 27, camP.y));
        fogC.copy(fogBlue).lerp(fogWarm, smoothstep(0.25, 0.8, open)); scene.fog.color.copy(fogC); scene.background.copy(fogC);
        // gusts: one overtakes the camera under the hall at u 0.26, one runs just ahead down the canyon
        const G = YU.uGust.value;
        if (u > U_GUST && u < 0.42) G.set(Z_GUST + 30 - 900 * (u - U_GUST), 1.15 * (1 - smoothstep(0.34, 0.42, u)), 36, 0);
        else if (u > 0.76) G.set(camP.z - lerp(16, 34, smoothstep(0.76, 1, u)), 1.05 * smoothstep(0.76, 0.86, u), 26, 0);
        else G.set(1e4, 0, 30, 0);
        clothU.uTripU.value = 1 - smoothstep(0.06, 0.17, u) * (0.82 + 0.1 * Math.sin(t * 0.4));
        clothU.uStrip.value.set(rare ? stripLine : -100, rare ? smoothstep(0.64, 0.66, u) : 0, 0, 0);
        sails.im.visible = rare && u > 0.637; if (sails.im.visible) sails.place(u, t);
        // the scripted agama: three push-ups, then it whips round the trunk and up
        const lu = LIZ.u, w = smoothstep(lu + 0.004, lu + 0.03, u), th = 3.5 * w, pu = (u - (lu - 0.03)) / 0.032;
        lizU.uPush.value = pu > 0 && pu < 1 ? Math.max(Math.sin(pu * 3 * TAU), 0) : 0;
        AX.crossVectors(LIZ.ax, LIZ.n0);
        LIZ.n.copy(LIZ.n0).multiplyScalar(Math.cos(th)).addScaledVector(AX, Math.sin(th));
        LIZ.P.copy(LIZ.P0).addScaledVector(LIZ.ax, 1.6 * w).addScaledVector(LIZ.n, LIZ.r);
        LIZ.f.crossVectors(LIZ.ax, LIZ.n).multiplyScalar(0.9 * Math.sin(Math.PI * w)).add(LIZ.ax).normalize();
        lizards.setM(0, LIZ.P, LIZ.n, LIZ.f, 1.7); lizards.im.instanceMatrix.needsUpdate = true;
        lizU.uScatter.value = smoothstep(0.86, 0.97, u);
        walkers.U.uGone.value = smoothstep(DOVE_U - 0.03, DOVE_U - 0.012, u);
        FL.updateWind(leafMat, t);
        fauna.update(dt, t, camera, u);
        set.update(dt, t, camera);
      },
      dispose() { hero.dispose?.(); },
    };
  },
};
