// Terrain kit, part 3: the adaptive heightfield mesh and the biome ramps.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeNoise } from '../core.js';
import { makeTerrainMaterial } from './material.js';
import { detailTextureSteps, makeStrata, rngOf } from './textures.js';
import { mountains, withCorridor } from './heights.js';

// Each biome: ramp = ground colour by normalised height (0 = low/water level, 1 = highest ground),
// alt = second ground colour blended in by low-frequency noise, shore/bed = colours at and below waterLevel,
// the rest are makeTerrainMaterial options (snowLine, snowBlend, snowNoise, glowLevel, glowRange are normalised here).
// Albedos are calibrated for a sun of ~3 with a hemisphere fill of ~1-1.4 (see docs): ground 0.15-0.4, snow ~0.72.
export const BIOMES = {
  alpine: { ramp: [[0, '#6c8444'], [0.25, '#788a48'], [0.5, '#8a9058'], [0.72, '#948c70'], [1, '#a39c90']], alt: '#9a9458', altAmount: 0.5, shore: '#b0a47e', bed: '#4a5a4c',
    rock: '#8e867c', rockB: '#716b64', rockSlope: [0.62, 0.82], strata: 0.45, strataScale: 9, snow: '#d6dde9', snowLine: 0.66, snowBlend: 0.035, snowNoise: 0.14, patch: '#d8cc98', patchAmount: 0.35,
    tufts: 0.9, pebbles: 0.45, cracks: 0, clouds: 0.35 },
  meadow: { ramp: [[0, '#6a8442'], [0.5, '#7a8c4a'], [1, '#8c9058']], alt: '#9a9c5c', altAmount: 0.45, shore: '#b8ae84', bed: '#46584a',
    rock: '#938b7a', rockB: '#766e60', rockSlope: [0.55, 0.76], strata: 0.35, strataScale: 8, patch: '#d0d096', patchAmount: 0.35, tufts: 1, pebbles: 0.25, cracks: 0, clouds: 0.4 },
  desert: { ramp: [[0, '#c89862'], [0.5, '#d2a46c'], [1, '#dcb27a']], alt: '#b9814e', altAmount: 0.3, shore: '#a07e56', bed: '#7a6850',
    rock: '#a2664a', rockB: '#b07a5c', rockSlope: [0.3, 0.5], strata: 0.7, strataScale: 6, patch: '#f0d2a4', patchAmount: 0.3, detail: 0.35, bump: 0.7,
    ripples: 1, pebbles: 0.2, cracks: 0, lee: 0.55, drift: 0.6, sparkle: 0.5, clouds: 0.25, sharpNormals: true },
  canyon: { ramp: [[0, '#b9805a'], [0.4, '#c08a62'], [1, '#c99a70']], alt: '#a39a66', altAmount: 0.25, shore: '#9a7a5a', bed: '#6a584a',
    rock: '#9c5c40', rockB: '#b27458', rockSlope: [0.7, 0.9], strata: 0.8, strataScale: 6, strataWarp: 4, patch: '#e6c098', patchAmount: 0.3,
    pebbles: 0.7, cracks: 0.6, ripples: 0.35, clouds: 0.3 },
  tundra: { ramp: [[0, '#78784e'], [0.4, '#8a8458'], [0.8, '#938d80'], [1, '#a19e98']], alt: '#96643e', altAmount: 0.55, shore: '#858072', bed: '#4a5258',
    rock: '#7a7c84', rockB: '#5f6168', rockSlope: [0.6, 0.8], strata: 0.4, strataScale: 12, snow: '#d6dde9', snowLine: 0.5, snowBlend: 0.05, snowNoise: 0.4, patch: '#c4bb94', patchAmount: 0.4,
    tufts: 0.7, pebbles: 0.7, cracks: 0.15, clouds: 0.35 },
  volcanic: { ramp: [[0, '#504a4c'], [0.5, '#5c5254'], [0.85, '#6c5e58'], [1, '#8a7c74']], alt: '#6e4a3a', altAmount: 0.4, shore: '#3a3638', bed: '#232124',
    rock: '#5e595f', rockB: '#77605a', rockSlope: [0.6, 0.82], strata: 0.5, strataScale: 9, patch: '#7a6a64', patchAmount: 0.35, glow: '#ff5a1a', glowLevel: 0.2, glowRange: 0.12, glowIntensity: 3, roughness: 0.85,
    pebbles: 0.6, cracks: 1, clouds: 0 },
  alien: { ramp: [[0, '#3a868c'], [0.35, '#4ca896'], [0.7, '#9a6cba'], [1, '#d8aee2']], alt: '#d47ea6', altAmount: 0.4, shore: '#2c5a62', bed: '#16323a',
    rock: '#5c4a8c', rockB: '#7e62b4', rockSlope: [0.6, 0.82], strata: 0.6, strataScale: 8, patch: '#a8e6d0', patchAmount: 0.35, glow: '#3dffc8', glowLevel: 0.12, glowRange: 0.1, glowIntensity: 2.2,
    pebbles: 0.4, cracks: 0.6, tufts: 0.5, clouds: 0.3 },
  tropical: { ramp: [[0, '#d2c294'], [0.05, '#aaa870'], [0.12, '#627c40'], [0.5, '#587438'], [1, '#4f6a34']], alt: '#7c8a4c', altAmount: 0.4, shore: '#dccca0', bed: '#5a8a82',
    rock: '#8c897f', rockB: '#726f67', rockSlope: [0.5, 0.74], strata: 0.35, strataScale: 12, patch: '#d6dc94', patchAmount: 0.3, tufts: 1, pebbles: 0.2, cracks: 0, clouds: 0.4 },
  arctic: { ramp: [[0, '#93a0b0'], [1, '#bcc8d8']], alt: '#7f92a8', altAmount: 0.4, shore: '#8c98a8', bed: '#4a6078',
    rock: '#666e7a', rockB: '#7f98b0', rockSlope: [0.55, 0.78], strata: 0.4, strataScale: 12, snow: '#d6dde9', snowLine: 0.04, snowBlend: 0.05, snowNoise: 0.1, snowSlope: [0.5, 0.75], patch: '#ffffff', patchAmount: 0.1,
    ripples: 0.7, rippleLength: 2.4, pebbles: 0.15, cracks: 0, sparkle: 0.8, drift: 0.7, lee: 0.35, clouds: 0.3 },
  lunar: { ramp: [[0, '#6e6e70'], [0.6, '#868482'], [1, '#9a9896']], alt: '#5a595c', altAmount: 0.5, shore: '#6e6e70', bed: '#4a4a4c',
    rock: '#7c7a78', rockB: '#646260', rockSlope: [0.55, 0.8], strata: 0.25, strataScale: 15, patch: '#bcbab6', patchAmount: 0.3, pebbles: 1, cracks: 0.3, clouds: 0 },
};
const MAT_KEYS = ['rockSlope', 'strata', 'strataWarp', 'strataBeds', 'strataAccent', 'varnish', 'bedRelief', 'joints', 'snowSlope', 'patch', 'patchAmount', 'glowIntensity', 'detail', 'bump', 'streaks', 'roughness',
  'wet', 'wetTint', 'wetRange', 'pebbles', 'cracks', 'ripples', 'tufts', 'rippleLength', 'sparkle', 'wind', 'lee', 'drift', 'clouds', 'cloudSize', 'cloudSpeed', 'scale'];

function rampLUT(ramp, n = 64) {
  const lut = new Float32Array(n * 3), a = new THREE.Color(), b = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1); let k = 0; while (k < ramp.length - 2 && t > ramp[k + 1][0]) k++;
    const u = clamp((t - ramp[k][0]) / Math.max(1e-6, ramp[k + 1][0] - ramp[k][0]), 0, 1);
    a.set(ramp[k][1]); b.set(ramp[k + 1][1]); a.lerp(b, u * u * (3 - 2 * u));
    lut[i * 3] = a.r; lut[i * 3 + 1] = a.g; lut[i * 3 + 2] = a.b;
  }
  return lut;
}

// Resolve a biome name / object into a full spec (palette overrides win).
export function resolveBiome(biome, overrides) {
  const b = typeof biome === 'string' ? BIOMES[biome] || BIOMES.alpine : (biome || BIOMES.alpine);
  return { altAmount: 0.4, alt: '#888888', shore: '#999999', bed: '#444444', rock: '#8e867c', rockB: '#716b64', ...b, ...(overrides || {}) };
}

// (x, z, h, ny, out, t) => out : the built-in ground colour for a biome. t = normalised height.
function biomeColorFn(B, noise, waterLevel, range) {
  const lut = rampLUT(B.ramp), alt = new THREE.Color(B.alt), shore = new THREE.Color(B.shore), bed = new THREE.Color(B.bed);
  const hasWater = waterLevel != null, sr = B.shoreRange ?? clamp(range * 0.012, 1.2, 3.2);
  return (x, z, h, ny, out, t) => {
    const f = clamp(t, 0, 1) * 63, i = Math.min(62, Math.floor(f)), u = f - i, i3 = i * 3;
    let r = lut[i3] + (lut[i3 + 3] - lut[i3]) * u, g = lut[i3 + 1] + (lut[i3 + 4] - lut[i3 + 1]) * u, b = lut[i3 + 2] + (lut[i3 + 5] - lut[i3 + 2]) * u;
    const n1 = noise.n2(x * 0.0041 + 17, z * 0.0041 - 9) + 0.5 * noise.n2(x * 0.013 - 3, z * 0.013 + 31);
    const m = smoothstep(-0.25, 0.75, n1) * B.altAmount;
    r += (alt.r - r) * m; g += (alt.g - g) * m; b += (alt.b - b) * m;
    const v = 1 + 0.14 * noise.n2(x * 0.031 + 5, z * 0.031 + 77);
    r *= v; g *= v; b *= v;
    if (hasWater) {
      const d = h - waterLevel + n1 * sr * 0.3;
      const s = 1 - smoothstep(sr * 0.35, sr, d);
      if (s > 0) { r += (shore.r - r) * s; g += (shore.g - g) * s; b += (shore.b - b) * s; }
      if (d < 0) { const k = 1 - Math.exp(d / (sr * 2.5)); r += (bed.r - r) * k; g += (bed.g - g) * k; b += (bed.b - b) * k; }
    }
    out.r = r; out.g = g; out.b = b; return out;
  };
}

const DIR8 = [1, 0, 0.7071, 0.7071, 0, 1, -0.7071, 0.7071, -1, 0, -0.7071, -0.7071, 0, -1, 0.7071, -0.7071];
const now = () => (typeof performance !== 'undefined' ? performance.now() : 0);

// The whole build as a generator, so makeTerrainAsync can hand frames back to the renderer between slices.
function* build(opts) {
  const o = opts, rng = rngOf(o), tStart = now(), ms = {}; let tPhase = tStart, hCalls = 0;
  const lap = (k) => { const t = now(); ms[k] = Math.round((t - tPhase) * 10) / 10; tPhase = t; };
  const noise = o.noise || makeNoise(rng.int(1, 2147483646));
  const path = o.path || null;
  // ----- bounds
  let x0, z0, x1, z1;
  if (o.bounds) [x0, z0, x1, z1] = o.bounds;
  else if (o.size || !path) { const s = o.size ?? 1600, w = Array.isArray(s) ? s[0] : s, d = Array.isArray(s) ? s[1] : s, c = o.center || [0, 0]; x0 = c[0] - w / 2; x1 = c[0] + w / 2; z0 = c[1] - d / 2; z1 = c[1] + d / 2; }
  else { x0 = z0 = Infinity; x1 = z1 = -Infinity; const m = o.margin ?? 500;
    for (let i = 0; i <= 32; i++) { const p = path.pointAt(i / 32); x0 = Math.min(x0, p.x - m); x1 = Math.max(x1, p.x + m); z0 = Math.min(z0, p.z - m); z1 = Math.max(z1, p.z + m); } }
  // ----- biome, strata, height (carved under the path)
  const waterLevel = o.waterLevel ?? null;
  const B = resolveBiome(o.biome, o.palette);
  const strata = o.strata || (o.material && o.material.strataTable) || makeStrata({ rng, rock: B.rock, rockB: B.rockB, accent: B.strataAccent, beds: B.strataBeds, thickness: B.strataScale ?? 7, base: waterLevel ?? 0 });
  const base = o.height || mountains({ noise, height: 170, scale: 460 });
  const carved = path && o.corridor !== false ? withCorridor(base, path, { noise, ...(o.corridor || {}) }) : base;
  const height = (x, z) => { hCalls++; return carved(x, z); };
  // ----- grid
  let cell = o.cell ?? 3, levels = o.levels ?? 5; const near = o.near ?? 36;
  const W0 = x1 - x0, D0 = z1 - z0;
  while (levels > 0 && cell * (1 << levels) > Math.min(W0, D0) / 2) levels--;
  while ((W0 / cell + 2) * (D0 / cell + 2) > 5e6) cell *= 2;
  const G = 1 << levels, RS = cell * G, nx = Math.max(1, Math.round(W0 / RS)), nz = Math.max(1, Math.round(D0 / RS));
  const X0 = (x0 + x1) / 2 - nx * RS / 2, Z0 = (z0 + z1) / 2 - nz * RS / 2, W = nx * RS, D = nz * RS;
  const GX = nx * G, GZ = nz * G, SX = GX + 1;
  // ----- level of detail distance: a chamfer distance field of the path (cheap), plus weighted focus points
  let lodDist; const uniformLod = typeof o.focus !== 'function' && !path && !o.focus;
  if (typeof o.focus === 'function') lodDist = o.focus;
  else if (uniformLod) { const flat = near * (1 << Math.min(levels, o.uniform ?? 2)); lodDist = () => flat; }   // nothing to focus on: one even resolution (cell * 2^uniform)
  else {
    const F = []; if (o.focus) for (const p of o.focus) F.push(p[0], p[1], 1 / ((p[2] ?? 1) * (p[2] ?? 1)));   // [x, z, coarseness]
    let field = null, gs = 1, dn = 0, DS = 0, dm = 0;
    if (path) {
      gs = Math.max(cell * 2, Math.max(W, D) / 360); dn = Math.ceil(W / gs); dm = Math.ceil(D / gs); DS = dn + 1; field = new Float32Array(DS * (dm + 1)).fill(1e9);
      const ns = Math.max(64, Math.ceil(path.length / gs * 2)), p = new THREE.Vector3();
      for (let i = 0; i <= ns; i++) { if ((i & 63) === 63) yield; path.pointAt(i / ns, p); const fi = (p.x - X0) / gs, fj = (p.z - Z0) / gs, ci = Math.floor(fi), cj = Math.floor(fj);
        for (let b = 0; b < 2; b++) for (let a = 0; a < 2; a++) { const ii = ci + a, jj = cj + b; if (ii < 0 || jj < 0 || ii > dn || jj > dm) continue; const d = Math.hypot(fi - ii, fj - jj), k = jj * DS + ii; if (d < field[k]) field[k] = d; } }
      yield;   // (the distance field is the maker's longest stretch before its first hand-back: it may be handed back after each of its three passes)
      for (let j = 0; j <= dm; j++) for (let i = 0; i <= dn; i++) { const k = j * DS + i; let d = field[k];
        if (i > 0 && field[k - 1] + 1 < d) d = field[k - 1] + 1;
        if (j > 0) { if (field[k - DS] + 1 < d) d = field[k - DS] + 1; if (i > 0 && field[k - DS - 1] + 1.4142 < d) d = field[k - DS - 1] + 1.4142; if (i < dn && field[k - DS + 1] + 1.4142 < d) d = field[k - DS + 1] + 1.4142; }
        field[k] = d; }
      yield;
      for (let j = dm; j >= 0; j--) for (let i = dn; i >= 0; i--) { const k = j * DS + i; let d = field[k];
        if (i < dn && field[k + 1] + 1 < d) d = field[k + 1] + 1;
        if (j < dm) { if (field[k + DS] + 1 < d) d = field[k + DS] + 1; if (i < dn && field[k + DS + 1] + 1.4142 < d) d = field[k + DS + 1] + 1.4142; if (i > 0 && field[k + DS - 1] + 1.4142 < d) d = field[k + DS - 1] + 1.4142; }
        field[k] = d; }
      yield;
    }
    lodDist = (x, z) => {
      let d2 = Infinity;
      if (field) { const fi = clamp((x - X0) / gs, 0, dn - 1e-3), fj = clamp((z - Z0) / gs, 0, dm - 1e-3), i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j, k = j * DS + i;
        const d = ((field[k] * (1 - u) + field[k + 1] * u) * (1 - v) + (field[k + DS] * (1 - u) + field[k + DS + 1] * u) * v) * gs; d2 = d * d; }
      for (let i = 0; i < F.length; i += 3) { const dx = F[i] - x, dz = F[i + 1] - z, d = (dx * dx + dz * dz) / F[i + 2]; if (d < d2) d2 = d; }
      return Math.sqrt(d2);
    };
  }
  // ----- vertices are created on demand (the quadtree looks at heights to decide where to refine)
  const vid = new Int32Array(SX * (GZ + 1));
  let capV = 8192, pos = new Float32Array(capV * 3), nv = 0;
  const getV = (ix, iz) => {
    const k = iz * SX + ix, v = vid[k]; if (v) return v - 1;
    if (nv >= capV) { capV *= 2; const p = new Float32Array(capV * 3); p.set(pos); pos = p; }
    const x = X0 + ix * cell, z = Z0 + iz * cell, n3 = nv * 3;
    pos[n3] = x; pos[n3 + 1] = height(x, z); pos[n3 + 2] = z; vid[k] = ++nv; return nv - 1;
  };
  // ----- quadtree: distance decides the size, then cells that hide a cliff or a sharp bend are split further
  const refine = o.refine ?? 2, tolC = o.refineTolerance ?? 0.1, tolR = 1.5, refineDist = o.refineDistance ?? 700;
  const wantSplit = (ix, iz, s) => { const hs = s * cell * 0.5; return s * near > lodDist(X0 + ix * cell + hs, Z0 + iz * cell + hs) - (uniformLod ? 0 : hs * 1.42); };
  const countLeaves = (ix, iz, s) => { if (s > 1 && wantSplit(ix, iz, s)) { const h = s >> 1; return countLeaves(ix, iz, h) + countLeaves(ix + h, iz, h) + countLeaves(ix, iz + h, h) + countLeaves(ix + h, iz + h, h); } return 1; };
  let budget = 0;   // error-driven splits still affordable: each adds 3 cells (~7 triangles) to the distance-only mesh
  if (refine > 0) { let n0 = 0; for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) n0 += countLeaves(i * G, j * G, G); budget = Math.max(0, ((o.maxTriangles ?? 110000) - n0 * 2.25) / 7); }
  yield;
  const nodes = new Array(nx * nz).fill(0), leaves = [];
  const sub = (ix, iz, s, ni, left) => {
    if (s > 1) {
      const size = s * cell, hs = size * 0.5, cx = X0 + ix * cell + hs, cz = Z0 + iz * cell + hs;
      let split = wantSplit(ix, iz, s), l2 = refine;
      if (!split && left > 0 && budget > 0) {
        const dist = lodDist(cx, cz);
        if (dist < refineDist) {
          const a = pos[getV(ix, iz) * 3 + 1], b = pos[getV(ix + s, iz) * 3 + 1], c = pos[getV(ix + s, iz + s) * 3 + 1], d = pos[getV(ix, iz + s) * 3 + 1], k = 1 + dist / 350;
          const bend = s >= 4 ? Math.abs(height(cx, cz) - (a + b + c + d) * 0.25) : Math.abs(a + c - b - d) * 0.3;   // big cells: look at the centre; small ones: twist of the corners
          if (bend > size * tolC * k || Math.max(a, b, c, d) - Math.min(a, b, c, d) > size * tolR * k) { split = true; l2 = left - 1; budget--; }
        }
      }
      if (split) { const k = nodes.length, h = s >> 1; nodes[ni] = k; nodes.push(0, 0, 0, 0); sub(ix, iz, h, k, l2); sub(ix + h, iz, h, k + 1, l2); sub(ix, iz + h, h, k + 2, l2); sub(ix + h, iz + h, h, k + 3, l2); return; }
    }
    nodes[ni] = -1 - leaves.length / 3; leaves.push(ix, iz, s);
  };
  // roots nearest the path first, so the refinement budget goes where the camera is
  const order = []; for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) order.push([lodDist(X0 + (i + 0.5) * RS, Z0 + (j + 0.5) * RS), i, j]);
  order.sort((a, b) => a[0] - b[0]);
  for (let q = 0; q < order.length; q++) { const i = order[q][1], j = order[q][2]; sub(i * G, j * G, G, j * nx + i, refine); if ((q & 15) === 15) yield; }
  const nLeaf = leaves.length / 3, skirt = o.skirt || 0;
  for (let l = 0; l < leaves.length; l += 3) { const ix = leaves[l], iz = leaves[l + 1], s = leaves[l + 2]; getV(ix, iz); getV(ix + s, iz); getV(ix + s, iz + s); getV(ix, iz + s); if ((l & 4095) === 0) yield; }
  lap('heights'); yield;
  // ----- triangles (coarse cells fan to the vertices of their finer neighbours: no cracks)
  const idx = [], ring = [], leafT0 = new Int32Array(nLeaf), leafTn = new Uint8Array(nLeaf); let ringWork = 0;
  const quad = (a, b, c, d) => {
    if (Math.abs(pos[a * 3 + 1] - pos[c * 3 + 1]) < Math.abs(pos[b * 3 + 1] - pos[d * 3 + 1])) idx.push(a, d, c, a, c, b); else idx.push(a, d, b, b, d, c);
  };
  for (let l = 0, li = 0; l < leaves.length; l += 3, li++) {
    const ix = leaves[l], iz = leaves[l + 1], s = leaves[l + 2]; leafT0[li] = idx.length;
    if (s === 1) quad(vid[iz * SX + ix] - 1, vid[iz * SX + ix + 1] - 1, vid[(iz + 1) * SX + ix + 1] - 1, vid[(iz + 1) * SX + ix] - 1);
    else {
      ring.length = 0; let v;
      for (let k = 0; k < s; k++) { v = vid[(iz + k) * SX + ix]; if (v) ring.push(v - 1); }
      for (let k = 0; k < s; k++) { v = vid[(iz + s) * SX + ix + k]; if (v) ring.push(v - 1); }
      for (let k = 0; k < s; k++) { v = vid[(iz + s - k) * SX + ix + s]; if (v) ring.push(v - 1); }
      for (let k = 0; k < s; k++) { v = vid[iz * SX + ix + s - k]; if (v) ring.push(v - 1); }
      if (ring.length === 4) quad(ring[0], ring[3], ring[2], ring[1]);
      else { const c = getV(ix + (s >> 1), iz + (s >> 1)), n = ring.length; for (let k = 0; k < n; k++) idx.push(c, ring[k], ring[(k + 1) % n]); }
    }
    leafTn[li] = Math.min(255, (idx.length - leafT0[li]) / 3);
    if ((ringWork += 4 * s + 8) > 50000) { ringWork = 0; yield; }
  }
  yield;
  return yield* finish({ o, rng, noise, B, strata, path, base, carved, height, waterLevel, cell, X0, Z0, W, D, GX, GZ, SX, nx, nz, G, vid, pos, nv, idx, leaves, nodes, leafT0, leafTn, skirt, ms, lap, tStart, lodDist, calls: () => hCalls });
}

function* finish(S) {
  const { o, rng, noise, B, strata, path, base, carved, height, waterLevel, cell, X0, Z0, W, D, GX, GZ, SX, nx, nz, G, vid, idx, leaves, nodes, leafT0, leafTn, skirt, ms, lap } = S;
  let { pos, nv } = S;
  // ----- normals: central differences over the local cell size (band-limited: independent of the triangulation,
  // so slope-driven shading and the rock mask do not saw-tooth along ledges); neighbours come from the grid where they exist
  const vs = new Uint16Array(nv).fill(65535);
  for (let l = 0; l < leaves.length; l += 3) {
    const ix = leaves[l], iz = leaves[l + 1], s = leaves[l + 2], a = vid[iz * SX + ix] - 1, b = vid[iz * SX + ix + s] - 1, c = vid[(iz + s) * SX + ix + s] - 1, d = vid[(iz + s) * SX + ix] - 1;
    if (s < vs[a]) vs[a] = s; if (s < vs[b]) vs[b] = s; if (s < vs[c]) vs[c] = s; if (s < vs[d]) vs[d] = s;
    if (s > 1) { const cv = vid[(iz + (s >> 1)) * SX + ix + (s >> 1)]; if (cv && (s >> 1) < vs[cv - 1]) vs[cv - 1] = s >> 1; }
  }
  const sharp = o.sharpNormals ?? B.sharpNormals ?? false;   // keep the steeper of the two one-sided slopes: crests (dune brinks) stay crisp
  const nor = new Float32Array(nv * 3 + 12); let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < nv; i++) {
    const i3 = i * 3, x = pos[i3], y = pos[i3 + 1], z = pos[i3 + 2]; let gx, gz;
    const sv = vs[i] === 65535 ? 1 : vs[i];
    const ix = Math.round((x - X0) / cell), iz = Math.round((z - Z0) / cell), k = iz * SX + ix, e = sv * cell; let v, sl = NaN, sr = NaN, sd = NaN, su = NaN;
    if (ix - sv >= 0 && (v = vid[k - sv])) sl = (y - pos[(v - 1) * 3 + 1]) / e;
    if (ix + sv <= GX && (v = vid[k + sv])) sr = (pos[(v - 1) * 3 + 1] - y) / e;
    if (iz - sv >= 0 && (v = vid[k - sv * SX])) sd = (y - pos[(v - 1) * 3 + 1]) / e;
    if (iz + sv <= GZ && (v = vid[k + sv * SX])) su = (pos[(v - 1) * 3 + 1] - y) / e;
    if (sl !== sl && sr !== sr) sr = (height(x + e, z) - y) / e;
    if (sd !== sd && su !== su) su = (height(x, z + e) - y) / e;
    if (sl !== sl) gx = sr; else if (sr !== sr) gx = sl; else gx = sharp ? (Math.abs(sl) > Math.abs(sr) ? sl : sr) : (sl + sr) * 0.5;
    if (sd !== sd) gz = su; else if (su !== su) gz = sd; else gz = sharp ? (Math.abs(sd) > Math.abs(su) ? sd : su) : (sd + su) * 0.5;
    const l = 1 / Math.sqrt(gx * gx + gz * gz + 1); nor[i3] = -gx * l; nor[i3 + 1] = l; nor[i3 + 2] = -gz * l;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if ((i & 8191) === 0) yield;
  }
  lap('normals');
  // ----- baked sun shadow, ambient occlusion and shadow height on a coarse grid of the mesh itself (no extra height() calls)
  const sunV = o.sunDir ? (o.sunDir.isVector3 ? o.sunDir.clone() : new THREE.Vector3().fromArray(o.sunDir)).normalize() : null;
  const aoK = o.ao ?? 0.45, shadowK = sunV && sunV.y > 0.01 ? (o.shadow ?? 0.85) : 0;
  const shade = new Float32Array(nv * 2 + 8).fill(1);
  const g = Math.max(cell * 2, Math.max(W, D) / 255), hnx = Math.floor(W / g), hnz = Math.floor(D / g), HS = hnx + 1, HN = HS * (hnz + 1);
  const HM = new Float32Array(HN), sunG = new Float32Array(HN).fill(1), aoG = new Float32Array(HN).fill(1), topG = new Float32Array(HN).fill(-1e4);
  for (let l = 0; l < leaves.length; l += 3) {
    const ix = leaves[l], iz = leaves[l + 1], s = leaves[l + 2], lx0 = ix * cell, lz0 = iz * cell, ls = s * cell;
    const ia = Math.ceil(lx0 / g), ib = Math.min(hnx, Math.floor((lx0 + ls) / g)), ja = Math.ceil(lz0 / g), jb = Math.min(hnz, Math.floor((lz0 + ls) / g));
    if (ib < ia || jb < ja) continue;
    const ya = pos[(vid[iz * SX + ix] - 1) * 3 + 1], yb = pos[(vid[iz * SX + ix + s] - 1) * 3 + 1], yc = pos[(vid[(iz + s) * SX + ix + s] - 1) * 3 + 1], yd = pos[(vid[(iz + s) * SX + ix] - 1) * 3 + 1];
    for (let j = ja; j <= jb; j++) { const fz = (j * g - lz0) / ls; for (let i = ia; i <= ib; i++) { const fx = (i * g - lx0) / ls; HM[j * HS + i] = lerp(lerp(ya, yb, fx), lerp(yd, yc, fx), fz); } }
  }
  yield;
  const bil = (A, x, z) => {
    const fx = clamp((x - X0) / g, 0, hnx - 1e-3), fz = clamp((z - Z0) / g, 0, hnz - 1e-3), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * HS + i;
    return (A[k] * (1 - u) + A[k + 1] * u) * (1 - v) + (A[k + HS] * (1 - u) + A[k + HS + 1] * u) * v;
  };
  if (aoK > 0 || shadowK > 0) {
    if (shadowK > 0) {
      // one sweep away from the sun: each node inherits the shadow ceiling of the node up-sun of it (O(nodes), soft with distance)
      const soft = o.shadowSoftness ?? 0.09, hl = Math.hypot(sunV.x, sunV.z) || 1e-6, dx = sunV.x / hl, dz = sunV.z / hl, tanE = sunV.y / hl;
      const xMajor = Math.abs(dx) >= Math.abs(dz), sg = (xMajor ? dx : dz) > 0 ? 1 : -1, sl = xMajor ? dz / Math.abs(dx) : dx / Math.abs(dz), dd = g * Math.sqrt(1 + sl * sl), drop = dd * tanE;
      const nA = xMajor ? hnx : hnz, nB = xMajor ? hnz : hnx, sA = xMajor ? 1 : HS, sB = xMajor ? HS : 1, dOcc = new Float32Array(HN);
      for (let q = 1; q <= nA; q++) {
        const a = sg > 0 ? nA - q : q, ap = a + sg;
        for (let b = 0; b <= nB; b++) {
          const fb = b + sl; if (fb < 0 || fb > nB) continue;
          const b0 = Math.min(nB - 1, Math.floor(fb)), u = fb - b0, k0 = ap * sA + b0 * sB, k1 = k0 + sB, k = a * sA + b * sB;
          const hUp = HM[k0] * (1 - u) + HM[k1] * u, tUp = topG[k0] * (1 - u) + topG[k1] * u;
          if (hUp >= tUp) { topG[k] = hUp - drop; dOcc[k] = dd; } else { topG[k] = tUp - drop; dOcc[k] = (dOcc[k0] * (1 - u) + dOcc[k1] * u) + dd; }
          let sh = clamp((HM[k] + 0.5 - topG[k]) / (dOcc[k] * soft) * 0.5 + 0.5, 0, 1); sh = sh * sh * (3 - 2 * sh);
          sunG[k] = 1 - shadowK * (1 - sh);
        }
        if ((q & 63) === 0) yield;
      }
      yield;
    }
    if (aoK > 0) {
      const OFF = [1, 0, 1, 1, 0, 1, -1, 1, -1, 0, -1, -1, 0, -1, 1, -1];
      for (let j = 0; j <= hnz; j++) { if ((j & 63) === 63) yield; for (let i = 0; i <= hnx; i++) {
        const k = j * HS + i, y = HM[k]; let occ = 0;
        for (let q = 0; q < 16; q += 2) {
          const m = (q & 2) ? 4 : 2, ii = clamp(i + OFF[q] * m, 0, hnx), jj = clamp(j + OFF[q + 1] * m, 0, hnz), d = HM[jj * HS + ii] - y;
          if (d > 0) occ += d / (g * m * ((q & 2) ? 1.4142 : 1));
        }
        aoG[k] = 1 - aoK * clamp(occ * 0.19, 0, 0.9);
      } }
      yield;
    }
    for (let i = 0; i < nv; i++) {
      const x = pos[i * 3], z = pos[i * 3 + 2];
      if (shadowK > 0) { const ndl = nor[i * 3] * sunV.x + nor[i * 3 + 1] * sunV.y + nor[i * 3 + 2] * sunV.z;
        shade[i * 2] = bil(sunG, x, z) * lerp(1, clamp((ndl + 0.05) / 0.2, 0, 1), shadowK); }   // second term: bumps on a slope facing away catch no sun
      if (aoK > 0) shade[i * 2 + 1] = bil(aoG, x, z);
      if ((i & 8191) === 8191) yield;
    }
  }
  lap('shade'); yield;
  // ----- colours
  const hr = o.heightRange || [waterLevel ?? minY, Math.max(maxY, (waterLevel ?? minY) + 1)], range = hr[1] - hr[0];
  const colorFn = o.color || biomeColorFn(B, noise, waterLevel, range);
  const colr = new Float32Array(nv * 3 + 12), tmp = new THREE.Color();
  for (let i = 0; i < nv; i++) {
    const i3 = i * 3, y = pos[i3 + 1];
    const c = colorFn(pos[i3], pos[i3 + 2], y, nor[i3 + 1], tmp, (y - hr[0]) / range) || tmp;
    colr[i3] = c.r; colr[i3 + 1] = c.g; colr[i3 + 2] = c.b;
    if ((i & 8191) === 0) yield;
  }
  lap('colours'); yield;
  const detailTexture = o.detailTexture || (o.materialInstance && o.materialInstance.detailMap) || (yield* detailTextureSteps({ rng }));
  lap('textures'); yield;
  return finish2({ ...S, detailTexture, pos, nv, nor, shade, colr, minY, maxY, hr, range, g, hnx, hnz, HS, HN, HM, sunG, aoG, topG, bil, sunV });
}

function finish2(S) {
  const { o, rng, B, strata, base, carved, waterLevel, cell, X0, Z0, W, D, GX, GZ, SX, nx, G, vid, idx, nodes, leafT0, leafTn, skirt, ms, lap, hr, range, g, hnx, hnz, HS, HN, HM, sunG, aoG, topG, bil, minY, maxY } = S;
  let { pos, nv, nor, shade, colr } = S;
  const nTerrainIdx = idx.length;
  // ----- skirt: a wall hanging from the outer edge, so the mesh never shows a paper-thin rim
  if (skirt > 0) {
    const edge = [], out = [];
    for (let k = 0; k < GZ; k++) { const v = vid[k * SX]; if (v) { edge.push(v - 1); out.push(-1, 0); } }
    for (let k = 0; k < GX; k++) { const v = vid[GZ * SX + k]; if (v) { edge.push(v - 1); out.push(0, 1); } }
    for (let k = 0; k < GZ; k++) { const v = vid[(GZ - k) * SX + GX]; if (v) { edge.push(v - 1); out.push(1, 0); } }
    for (let k = 0; k < GX; k++) { const v = vid[GX - k]; if (v) { edge.push(v - 1); out.push(0, -1); } }
    const first = nv, n = edge.length, tot = nv + n * 2;
    const grow = (A, m) => { const R = new Float32Array(tot * m); R.set(A.subarray(0, nv * m)); return R; };
    pos = grow(pos, 3); nor = grow(nor, 3); colr = grow(colr, 3); shade = grow(shade, 2);
    for (let r = 0; r < 2; r++) for (let k = 0; k < n; k++) {      // r 0: copy of the rim with outward normals, r 1: the foot
      const a = edge[k] * 3, b = nv * 3, gy = r ? (colr[a] + colr[a + 1] + colr[a + 2]) * 0.12 : 0;
      pos[b] = pos[a]; pos[b + 1] = pos[a + 1] - (r ? skirt : 0); pos[b + 2] = pos[a + 2]; nor[b] = out[k * 2]; nor[b + 1] = 0.15; nor[b + 2] = out[k * 2 + 1];
      colr[b] = r ? gy : colr[a]; colr[b + 1] = r ? gy : colr[a + 1]; colr[b + 2] = r ? gy : colr[a + 2];
      shade[nv * 2] = shade[edge[k] * 2] * (r ? 0.6 : 1); shade[nv * 2 + 1] = shade[edge[k] * 2 + 1] * (r ? 0.45 : 1); nv++;
    }
    for (let k = 0; k < n; k++) { const k1 = (k + 1) % n; idx.push(first + k, first + n + k, first + k1, first + k1, first + n + k, first + n + k1); }
  }
  // ----- geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, nv * 3), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(nor.subarray(0, nv * 3), 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colr.subarray(0, nv * 3), 3));
  geometry.setAttribute('aShade', new THREE.BufferAttribute(shade.subarray(0, nv * 2), 2));
  geometry.setIndex(new THREE.BufferAttribute(nv > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), 1));
  geometry.boundingBox = new THREE.Box3(new THREE.Vector3(X0, minY - skirt, Z0), new THREE.Vector3(X0 + W, maxY, Z0 + D));
  geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(new THREE.Sphere());
  // ----- shade map for everything that stands on the terrain: R sun, G ao, B height above which the sun is visible, A ground height
  const sd = new Uint16Array(HN * 4), hf = THREE.DataUtils.toHalfFloat;
  for (let k = 0; k < HN; k++) { sd[k * 4] = hf(sunG[k]); sd[k * 4 + 1] = hf(aoG[k]); sd[k * 4 + 2] = hf(Math.max(topG[k], -6e4)); sd[k * 4 + 3] = hf(HM[k]); }
  const shadeMap = new THREE.DataTexture(sd, HS, hnz + 1, THREE.RGBAFormat, THREE.HalfFloatType);
  shadeMap.magFilter = shadeMap.minFilter = THREE.LinearFilter; shadeMap.wrapS = shadeMap.wrapT = THREE.ClampToEdgeWrapping; shadeMap.needsUpdate = true;
  const shadeBox = new THREE.Vector4(X0 - g * 0.5, Z0 - g * 0.5, 1 / (HS * g), 1 / ((hnz + 1) * g));   // texel centres sit on the grid nodes
  // ----- material
  const abs = (v, isLevel = 1) => (v == null ? undefined : (isLevel ? hr[0] : 0) + v * range);   // normalised biome value -> metres
  const detailTexture = S.detailTexture, mo = {}; for (const k of MAT_KEYS) if (B[k] !== undefined) mo[k] = B[k];
  const material = o.materialInstance || makeTerrainMaterial({
    rng, detailTexture, strataTable: strata, flat: o.flat, waterLevel: waterLevel ?? undefined, shade: true, rock: B.rock, rockB: B.rockB,
    snow: B.snow ?? null, snowLine: B.snow ? abs(B.snowLine) : undefined, snowBlend: abs(B.snowBlend, 0), snowNoise: abs(B.snowNoise, 0),
    glow: B.glow ?? null, glowLevel: abs(B.glowLevel), glowRange: abs(B.glowRange, 0), ...mo, ...(o.material || {}),
  });
  const object = new THREE.Mesh(geometry, material);
  object.name = 'terrain'; object.receiveShadow = !!o.receiveShadow; object.castShadow = !!o.castShadow;
  const uniforms = material.userData.uniforms || {};
  lap('assemble'); ms.total = Math.round((now() - S.tStart) * 10) / 10;
  // ----- queries
  const eps = Math.max(0.5, cell * 0.5), index = geometry.index.array, loc = { t: -1, a: 0, b: 0, c: 0 };
  const locate = (x, z) => {      // the triangle of the mesh under (x, z): fills loc with its first index and the barycentric weights
    const fx = (x - X0) / cell, fz = (z - Z0) / cell; if (!(fx >= 0 && fz >= 0 && fx <= GX && fz <= GZ)) return false;
    const ri = Math.min(nx - 1, Math.floor(fx / G)), rj = Math.min(S.nz - 1, Math.floor(fz / G)); let n = nodes[rj * nx + ri], ox = ri * G, oz = rj * G, s = G;
    while (n >= 0) { s >>= 1; const a = fx >= ox + s ? 1 : 0, b = fz >= oz + s ? 1 : 0; ox += a * s; oz += b * s; n = nodes[n + a + 2 * b]; }
    const li = -1 - n, t0 = leafT0[li], tn = leafTn[li]; let best = -1e9;
    for (let t = 0; t < tn; t++) {
      const i = t0 + t * 3, a = index[i] * 3, b = index[i + 1] * 3, c = index[i + 2] * 3, ax = pos[a], az = pos[a + 2], bx = pos[b], bz = pos[b + 2], cx = pos[c], cz = pos[c + 2];
      const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz); if (Math.abs(d) < 1e-9) continue;
      const w1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d, w2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d, w3 = 1 - w1 - w2, m = Math.min(w1, w2, w3);
      if (m > best) { best = m; loc.t = i; loc.a = w1; loc.b = w2; loc.c = w3; if (m >= 0) break; }
    }
    return best > -0.5;
  };
  const api = {
    object, geometry, material, uniforms, biome: B, strata, detailTexture, shadeMap, shadeBox,
    heightAt: carved, baseHeightAt: base,
    normalAt(x, z, out = new THREE.Vector3()) { return out.set(carved(x - eps, z) - carved(x + eps, z), 2 * eps, carved(x, z - eps) - carved(x, z + eps)).normalize(); },
    // height / normal of the rendered mesh (coarser than the function far from the path): use these to stand things on the ground
    surfaceAt(x, z) { if (!locate(x, z)) return carved(x, z); const i = loc.t; return pos[index[i] * 3 + 1] * loc.a + pos[index[i + 1] * 3 + 1] * loc.b + pos[index[i + 2] * 3 + 1] * loc.c; },
    surfaceNormalAt(x, z, out = new THREE.Vector3()) {
      if (!locate(x, z)) return api.normalAt(x, z, out);
      const i = loc.t, a = index[i] * 3, b = index[i + 1] * 3, c = index[i + 2] * 3;
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      out.set(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx).normalize(); return out.y < 0 ? out.negate() : out;
    },
    // baked light at a point on the ground: { sun 0..1 (direct light reaching it), ao 0..1, top (height above which the sun is visible) }
    shadeAt(x, z, out = {}) { out.sun = bil(sunG, x, z); out.ao = bil(aoG, x, z); out.top = bil(topG, x, z); return out; },
    // darken the ground around things standing on it (contact shadow baked into the vertices; for objects a few metres
    // across or more). items: a scatter() result or [[x, z, radius], ...]; opts: radius 1 (x item scale), reach 1.9, strength 0.5
    addContact(items, { radius = 1, reach = 1.9, strength = 0.5 } = {}) {
      const L = []; if (Array.isArray(items)) for (const it of items) L.push(it[0], it[1], (it[2] ?? 1) * reach);
      else for (let i = 0; i < items.count; i++) L.push(items.positions[i * 3], items.positions[i * 3 + 2], items.scales[i] * radius * reach);
      const sa = geometry.attributes.aShade, A = sa.array, n = A.length / 2;
      for (let i = 0; i < n; i++) { const x = pos[i * 3], z = pos[i * 3 + 2]; let k = 1;
        for (let q = 0; q < L.length; q += 3) { const dx = x - L[q], dz = z - L[q + 1], r = L[q + 2], d2 = dx * dx + dz * dz; if (d2 < r * r) { const t = 1 - Math.sqrt(d2) / r; k *= 1 - strength * t * t * (3 - 2 * t); } }
        if (k < 1) { A[i * 2] *= 0.5 + 0.5 * k; A[i * 2 + 1] *= k; } }
      sa.needsUpdate = true; return api;
    },
    bounds: { minX: X0, maxX: X0 + W, minZ: Z0, maxZ: Z0 + D, minY, maxY }, heightRange: hr, cell,
    triangles: idx.length / 3, vertices: nv, stats: { ms, heightCalls: S.calls(), surfaceTriangles: nTerrainIdx / 3 },
    update(dt, time) { if (material.userData.update) material.userData.update(time); },
    dispose() { geometry.dispose(); shadeMap.dispose(); if (material.userData.dispose) material.userData.dispose(); else material.dispose(); },
  };
  object.userData.shadeMap = shadeMap; material.shadeMapRef = shadeMap;   // reachable from the scene, so the engine frees it with the world
  return api;
}

// Heightfield mesh whose resolution follows the camera path (or focus points): `cell` metres within `near`
// of it, doubling each time the distance doubles, and refined again where a cell hides a cliff. Crack-free.
export function makeTerrain(opts = {}) { const it = build(opts); let r; while (!(r = it.next()).done); return r.value; }

// The same, but yields to the renderer about every `slice` ms: `const terrain = await makeTerrainAsync(opts, ctx.yield)`.
export async function makeTerrainAsync(opts = {}, yieldFn, slice = 8) {
  const it = build(opts); let r, t = now();
  while (!(r = it.next()).done) { if (yieldFn && now() - t > slice) { await yieldFn(); t = now(); } }
  return r.value;
}
