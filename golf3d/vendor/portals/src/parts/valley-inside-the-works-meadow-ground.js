// BROUGHT IN: the hash turfHash follows "Hash without Sine", Copyright (c)2014 David Hoskins, MIT License, published on Shadertoy; the same form as the kit's fx.js.
// valley-inside-the-works, the meadow: THE GROUND. The plan's groundHeight from wall to wall as one sheet whose lines
// of vertices run ALONG THE RIVER'S TWO EDGES (so the bank is a clean line at every scale), fine where the flown line is
// near (about a metre), coarser toward the walls. Its paint: a hay-meadow turf from one map of the place (lusher by the
// river, drier and paler up the sides and in ragged patches of dry ground, the drifts of the planting in their own colours), the river's
// wet shore (the bed's slope above the liquid and the bank's first metre: dark wet earth and stones, stained with the
// liquid's brown at its line), and the scar's limestone where the plan steps. All of it through the plan's barMaterial.
import * as P from './valley-inside-the-works-plan.js';
import { X0, X1, Z0, Z1, STEP, NX, NZ, CH, routeAt, smooth } from './valley-inside-the-works-meadow-field.js';

const NL = 26, NR = 4;   // cells from a wall to the bank, cells across the river's bed
const F1 = (v) => v.toFixed(1);      // (a number of the field's own bounds, written into the shader)
function rowStep(z) { if (z > 150) return 2.5; if (z > 30) return 1; if (z > -34) return 2; if (z > -46) return 0.5; if (z > -204) return 3.5; if (z > -206) return 0.5; return 4; }
const ROW_EDGES = [150, 30, -34, -46, -204, -206];      // where the rows' fineness changes: a row of vertices stands on each
// the ground beside the river taken as dry land right up to the edge (the plan's own law with the bed left out)
export function dryHeight(x, z) {
  if (P.riverHalfWidth(z) > 0 && P.bankDistance(x, z) < 0.02) { const s = x < P.riverX(z) ? -1 : 1; return P.groundHeight(P.riverX(z) + s * (P.riverHalfWidth(z) + 0.02), z); }
  return P.groundHeight(x, z);
}
// N + 1 places from a to b, close together near the flown line (rx) and at the bank's end, wide toward the wall
function spread(a, b, N, rx, bankAtB, out) {
  const M = 96, cum = new Float32Array(M + 1);
  for (let k = 0; k < M; k++) {
    const x = a + (b - a) * (k + 0.5) / M, toBank = bankAtB ? b - x : x - a;
    let sp = Math.min(Math.max(0.9 + 0.085 * Math.max(Math.abs(x - rx) - 12, 0), 0.9), 6);
    sp = Math.min(sp, 0.55 + 0.3 * toBank);
    cum[k + 1] = cum[k] + 1 / sp;
  }
  let k = 0;
  for (let i = 0; i <= N; i++) {
    const want = cum[M] * i / N;
    while (k < M - 1 && cum[k + 1] < want) k++;
    const t = cum[k + 1] > cum[k] ? (want - cum[k]) / (cum[k + 1] - cum[k]) : 0;
    out[i] = a + (b - a) * (k + Math.min(Math.max(t, 0), 1)) / M;
  }
  out[0] = a; out[N] = b;
}

export async function groundGeometry(ctx, THREE) {
  const zs = [];
  for (let z = Z1; z > Z0 + 1e-6;) { zs.push(z); let next = z - rowStep(z); for (const e of ROW_EDGES) if (z > e + 1e-6 && next < e) next = e; z = next; }
  zs.push(Z0);
  const NC = 2 * NL + NR + 1, rows = zs.length;
  const pos = new Float32Array(rows * NC * 3), nor = new Float32Array(rows * NC * 3), gg = new Float32Array(rows * NC * 2), col = new Float32Array(rows * NC * 3).fill(1);
  const left = new Float32Array(NL + 1), right = new Float32Array(NL + 1), xs = new Float32Array(NC), wet = new Uint8Array(NC);
  for (let r = 0; r < rows; r++) {
    // (zq: the row half a metre behind the fall's line keeps the pool's river, so that the bed's rise to the upper river stands behind the scar's rock)
    const z = zs[r], zq = z < P.FALL_Z - 0.01 && z > P.FALL_Z - 0.99 ? P.FALL_Z : z;
    const river = P.riverHalfWidth(zq) > 0, hw = river ? P.riverHalfWidth(zq) : 22, cx = P.riverX(zq), xl = cx - hw, xr = cx + hw, rx = routeAt(z)[0];
    spread(X0, xl, NL, rx, true, left); spread(xr, X1, NL, rx, false, right);
    for (let i = 0; i <= NL; i++) { xs[i] = left[i]; wet[i] = 0; xs[NL + NR + i] = right[i]; wet[NL + NR + i] = 0; }
    for (let i = 1; i < NR; i++) { xs[NL + i] = i === 1 ? xl + 0.55 : i === NR - 1 ? xr - 0.55 : xl + (xr - xl) * i / NR; wet[NL + i] = river ? 1 : 0; }
    const rock = smooth(-36.4, -37.4, z) * (1 - smooth(-43.4, -44.6, z));
    for (let i = 0; i < NC; i++) {
      const x = xs[i], o = (r * NC + i) * 3, o2 = (r * NC + i) * 2;
      // (in the notch of the fall the bank's very edge keeps the pool's level: the plan's ramp starts under the scar's rock)
      const inNotch = z < P.FALL_Z + 1.95 && z > P.FALL_Z - 0.6 && (i === NL || i === NL + NR);
      const y = wet[i] ? P.groundHeight(x, zq) : inNotch ? dryHeight(x, P.FALL_Z + 2) : dryHeight(x, z);
      pos[o] = x; pos[o + 1] = y; pos[o + 2] = z;
      if (wet[i]) { nor[o] = 0; nor[o + 1] = 1; nor[o + 2] = 0; }
      else {
        const e = 0.6, dx = (dryHeight(x + e, z) - dryHeight(x - e, z)) / (2 * e), dz = (dryHeight(x, z + e) - dryHeight(x, z - e)) / (2 * e), l = Math.hypot(dx, 1, dz);
        nor[o] = -dx / l; nor[o + 1] = 1 / l; nor[o + 2] = -dz / l;
      }
      gg[o2] = wet[i] ? -1.5 : Math.min(river ? P.bankDistance(x, z) : 8, 8); gg[o2 + 1] = wet[i] ? 0 : rock;      // (the river's bed is mud, never stone or moss)
    }
    if (r % 10 === 9) await ctx.yield();
  }
  await ctx.yield();
  const idx = new Uint32Array((rows - 1) * (NC - 1) * 6); let n = 0;
  for (let r = 0; r + 1 < rows; r++) for (let i = 0; i + 1 < NC; i++) {
    const a = r * NC + i, b = a + 1, c = a + NC, d = c + 1;
    idx[n++] = a; idx[n++] = b; idx[n++] = c; idx[n++] = b; idx[n++] = d; idx[n++] = c;
  }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aG', new THREE.BufferAttribute(gg, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
  g.userData.triangles = n / 3;
  // (splits: where in the index the rows from z 30 on and the rows above the fall's foot begin, for a part that draws the valley as three sheets)
  const at = (zc) => { let rs = 0; while (rs + 1 < rows && zs[rs] > zc + 0.001) rs++; return rs * (NC - 1) * 6; };
  g.userData.splits = [at(30), at(P.FALL_Z + 2)];
  return g;
}

// THE TURF'S MAP: one picture of the whole valley floor, 0.4 m to a texel, painted from the field: the hay's own greens,
// the patches of dry ground, and each drift in the colour of its flower (fleck by fleck near, a soft drift far off as the mips take it).
const TW = 400, TH = 1100;
// (hash2: the short integer lattice hash, in the form that the kit's terrain/heights.js and many worlds' own files have it)
const hash2 = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export async function turfTexture(ctx, THREE, field, look) {
  const px = new Uint8Array(TW * TH * 4), put = (o, v) => { px[o] = Math.round(255 * Math.sqrt(Math.min(Math.max(v, 0), 1))); };
  for (let j = 0; j < TH; j++) {
    const z = Z0 + (j + 0.5) * (Z1 - Z0) / TH;
    for (let i = 0; i < TW; i++) {
      const x = X0 + (i + 0.5) * (X1 - X0) / TW, o = (j * TW + i) * 4;
      const lush = field.at(CH.lush, x, z), dryS = field.at(CH.dry, x, z), sh = field.at(CH.shade, x, z);
      const h = hash2(i, j), h2 = hash2(i + 911, j - 577);
      // the hay: deep and blue-green by the river, a fresh green over the floor, paler and drier up the sides
      const dry = 1 - lush, m = 0.5 + 0.5 * field.noise.n2(x / 11.3, z / 11.3);
      let r = 0.022 + 0.085 * dry * dry + 0.016 * m, g = 0.105 + 0.07 * dry + 0.03 * m, b = 0.016 + 0.03 * dry;
      const k = 0.85 + 0.3 * h; r *= k; g *= k; b *= k;
      // the flowers' drifts: each texel a plant's breadth, tinted by its own number, so a drift is a soft mass and never a scatter of dots
      const off = smooth(0.9, 1.2, P.bankDistance(x, z)), ta = off * field.at(CH.tall, x, z);      // (off: no painted head or flower within a metre of the bank line)
      const tint = (q, cr, cg, cb) => { q = Math.min(q, 0.9); r += (cr - r) * q; g += (cg - g) * q; b += (cb - b) * q; };
      tint(0.2 * ta * (0.3 + 1.4 * h2), 0.3, 0.25, 0.1);                 // the hay's pale gold heads, a breath of it
      // (the flowers themselves are drawn by the ground's shader from the drifts' own map: see groundMaterial)
      const fx = off * field.at(CH.fox, x, z), pick = hash2(i * 3 + 17, j * 5 - 29);
      if (pick > 0.6 && pick < 0.6 + 0.16 * fx) tint(0.8 * (0.25 + 0.75 * h * h), 0.42, 0.1, 0.33);    // foxgloves
      if (sh > 0.05) { const q = 0.5 * sh; r *= 1 - q; g *= 1 - 0.8 * q; b *= 1 - 0.6 * q; tint(0.3 * sh * off * (0.2 + 1.5 * h * h2), 0.1, 0.12, 0.42); }   // shade and bluebells
      if (dryS > 0) { const q = 0.5 * dryS * (0.7 + 0.6 * h); r += (0.12 - r) * q; g += (0.15 - g) * q; b += (0.05 - b) * q; }   // the dry ground: the same turf, paler and drier
      put(o, r); put(o + 1, g); put(o + 2, b); px[o + 3] = 255;
    }
    if (j % 3 === 2) await ctx.yield();
  }
  const t = new THREE.DataTexture(px, TW, TH, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true;
  return t;
}
// The drifts as the turf's shader reads them: daisy, clover, cow parsley, the hay's heads (2 m to a texel, smooth)
export function driftTexture(THREE, field, NX, NZ, NCH) {
  const px = new Uint8Array(NX * NZ * 4), ch = [CH.daisy, CH.clover, CH.parsley, CH.tall];
  for (let i = 0; i < NX * NZ; i++) for (let c = 0; c < 4; c++) px[i * 4 + c] = Math.round(255 * Math.min(Math.max(field.data[i * NCH + ch[c]], 0), 1));
  const t = new THREE.DataTexture(px, NX, NZ, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
}
// A small tiling picture of grain (three unlike layers in r, g, b), for the turf's blades, the earth and the stone
export async function grainTexture(ctx, THREE, rng) {
  const N = 256, px = new Uint8Array(N * N * 4), lat = [];
  for (let c = 0; c < 3; c++) { const oct = []; for (let k = 0; k < 4; k++) { const n = 8 << k, a = new Float32Array(n * n); for (let i = 0; i < n * n; i++) a[i] = rng(); oct.push([n, a]); } lat.push(oct); }
  const val = (c, u, v) => {
    let s = 0, w = 0, amp = 1;
    for (const [n, a] of lat[c]) {
      const fx = u * n, fy = v * n, i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const i0 = i % n, i1 = (i + 1) % n, j0 = j % n, j1 = (j + 1) % n;
      s += amp * ((a[j0 * n + i0] * (1 - sx) + a[j0 * n + i1] * sx) * (1 - sy) + (a[j1 * n + i0] * (1 - sx) + a[j1 * n + i1] * sx) * sy); w += amp; amp *= 0.6;
    }
    return s / w;
  };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (i === 0 && j % 8 === 7) await ctx.yield();
    const o = (j * N + i) * 4, u = i / N, v = j / N;
    px[o] = Math.round(255 * Math.min(Math.max((val(0, u, v) - 0.5) * 1.9 + 0.5, 0), 1)); px[o + 1] = Math.round(255 * Math.min(Math.max((val(1, u, v) - 0.5) * 1.9 + 0.5, 0), 1));
    px[o + 2] = Math.round(255 * Math.min(Math.max((val(2, u, v) - 0.5) * 1.9 + 0.5, 0), 1)); px[o + 3] = 255;
  }
  const t = new THREE.DataTexture(px, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true;
  return t;
}
// The turf's own grain: a thatch of blades seen from above, light blades over a dark understorey (one tile is 1.6 m)
export async function bladesTexture(ctx, THREE, rng) {
  const N = 256, lum = new Float32Array(N * N).fill(0.3), px = new Uint8Array(N * N * 4);
  for (let k = 0; k < 1500; k++) {
    if (k % 60 === 59) await ctx.yield();
    let x = rng() * N, y = rng() * N; const a = rng() * 6.2832, len = 22 + 46 * rng(), w = 1.3 + 2.2 * rng(), b = 0.5 + 0.9 * rng() * rng() + 0.25 * rng(), bend = (rng() - 0.5) * 0.03;
    let dx = Math.cos(a), dy = Math.sin(a);
    for (let t = 0; t < len; t++) {
      const ww = w * (1 - 0.85 * t / len), lv = b * (0.75 + 0.5 * t / len);
      for (let q = -Math.ceil(ww); q <= Math.ceil(ww); q++) {
        const fall = 1 - Math.abs(q) / (ww + 0.5); if (fall <= 0) continue;
        const ix = ((Math.round(x - dy * q) % N) + N) % N, iy = ((Math.round(y + dx * q) % N) + N) % N, v = lv * (0.6 + 0.4 * fall);
        if (v > lum[iy * N + ix]) lum[iy * N + ix] = v;
      }
      x += dx; y += dy; const c = Math.cos(bend), sn = Math.sin(bend), nx = dx * c - dy * sn; dy = dx * sn + dy * c; dx = nx;
    }
  }
  for (let i = 0; i < N * N; i++) { const v = Math.round(255 * Math.min(lum[i] / 1.6, 1)); px[i * 4] = v; px[i * 4 + 1] = v; px[i * 4 + 2] = v; px[i * 4 + 3] = 255; }
  const t = new THREE.DataTexture(px, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true;
  return t;
}

// THE SPLATTER (a passage of the limestone's paint; p: the place, q: the face's own lie, up: how level it is, c: its colour).
// Thick liquid falling fourteen metres into the pool throws a few blots on the rock beside it, low down: on the scar
// within three metres of the fall's two sides (the sheet reaches 8.45 m from the river's middle) and within two
// metres of the pool's surface (the plan's liquidY at the fall), thickest at the liquid's line and none higher (a
// thick liquid does not spray): glossy blots of the river's own brown, a few decimetres across, each with a short
// run down the face from it and one small glint. They lie in the face's own lie, one to a cell at most (fewer than
// one cell in two has one), the rows out of step.
const SPLATTER = `
          gSplat = 0.0;
          float sx = abs(p.x) - 8.45, sy = p.y - ${P.liquidY(P.FALL_Z).toFixed(2)};
          if (wild > 0.5 && sx > -0.5 && sx < 3.5 && sy < 2.6 && up < 0.7) {
            float aa = 0.7 * max(fwidth(q.x), fwidth(q.y)) + 0.004;
            for (int o = 0; o < 2; o++) {            // the blot of this cell, and the run of the one above it
              float row = floor(q.y) + float(o), colx = q.x / 0.9 + 0.37 * row, col = floor(colx);
              vec3 h = turfHash(vec2(col, row) + 17.0), h2 = turfHash(vec2(row, col) + 71.0);
              vec2 d = vec2((colx - col - 0.44 - 0.12 * h.x) * 0.9, q.y - row - 0.44 - 0.12 * h.y);       // metres from the blot's middle
              float bx = abs(p.x - d.x) - 8.45, by = sy - d.y;                                         // (where its middle is, near enough)
              float reach = (1.0 - smoothstep(0.3, 3.3, bx)) * (1.0 - smoothstep(0.9, 1.6, by)) * step(0.0, by);      // (a blot's middle 1.6 m up at most: its own edge, 2 m)
              if (h2.x > 0.45 * reach) continue;
              float r = 0.09 + 0.19 * h.z * h.z, len = 0.4 + 0.7 * h2.y, t = clamp(-d.y / len, 0.0, 1.0);
              float an = dot(d, d) > 1e-10 ? atan(d.y, d.x) : 0.0;      // (the way round the blot; at its exact middle there is none, and none is asked: nought)
              float rim = r * (1.0 + 0.26 * sin(3.0 * an + 40.0 * h.z) + 0.14 * sin(5.0 * an + 23.0 * h2.z));       // a splat's uneven edge
              float e = length(d * vec2(1.0, 0.88)), blob = 1.0 - smoothstep(rim - aa, rim + aa, e);
              vec2 d2 = d - r * vec2(1.25 * cos(6.2832 * h2.z), 1.1 * sin(6.2832 * h2.z));                               // a drop thrown off beside it
              blob = max(blob, 1.0 - smoothstep(0.26 * r - aa, 0.26 * r + aa, length(d2)));
              float rw = r * (0.36 - 0.24 * t);
              float run = (1.0 - smoothstep(rw - aa, rw + aa, abs(d.x - 0.4 * r * (h.x - 0.5)))) * step(d.y, 0.0) * (1.0 - smoothstep(len - 0.07, len, -d.y));
              float m = max(blob, run);
              vec3 body = choc * (0.7 + 0.6 * clamp(0.5 + d.y / (2.0 * r), 0.0, 1.0)) * (1.0 - 0.3 * smoothstep(0.55, 1.0, e / rim) * step(d.y, 0.0));     // thick: light above, shadowed under
              c = mix(c, body, m);
              vec2 dg = (d - vec2(-0.28, 0.34) * r) * vec2(1.0, 0.6);
              c = mix(c, vec3(0.85, 0.78, 0.66), 0.85 * blob * step(0.13, r) * (1.0 - smoothstep(0.05 * r, 0.13 * r + aa, length(dg))));              // its one small glint
              gSplat = max(gSplat, m);
            }
          }`;

// THE VALLEY'S OWN MATERIAL: turf, damp bank and limestone in one. aG.x: metres from the bank (9: a field wall's
// stone, 12: the scar's own); aG.y: how much is rock (and, on the scar, above 1: how wet the rock is).
// Lit by the scene's two lights; the sun's part is crossed by the plan's bars (barMaterial).
export function groundMaterial(THREE, turf, grain, blades, drift) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0 });
  m.userData.uniforms = { uTurf: { value: turf }, uGrain: { value: grain }, uBlades: { value: blades }, uDrift: { value: drift }, uDip: { value: 0 } };   // (uDip: the scar's beds' dip, set by the part)
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aG; varying vec2 vG; varying vec3 vGW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvG = aG; vGW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uTurf, uGrain, uBlades, uDrift; uniform float uDip; varying vec2 vG;
        // turfHash: BROUGHT IN, it follows "Hash without Sine" (c)2014 David Hoskins, MIT License; see the head of this file
        vec3 turfHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xxy + q.yzz) * q.zyx); } varying vec3 vGW; float gBank, gWet, gSplat, gDamp, gStain;
        const vec3 CHOC = vec3(0.12, 0.058, 0.034);      // the river's own brown: the chocolate part's body colour (its uBody, '#614434', as linear light)
        // a stone of the shore: a ball in a cell of space, so that it is as round on the slope as on the flat. Returns
        // its cover; t is its tone (its own paleness, and lighter on the side turned to the plan's light).
        float shoreStone(vec3 p, float cell, float keep, out float t) {
          vec3 sp = p / cell, si = floor(sp), sh = turfHash(si.xz + 57.0 * si.y + 91.0 * cell);
          vec3 sd = (sp - si - 0.5 - (sh - 0.5) * 0.36) * cell;
          float sr = cell * (0.14 + 0.18 * sh.z), sa = cell * max(max(fwidth(sp.x), fwidth(sp.y)), fwidth(sp.z)) + 0.003;
          t = (0.55 + 0.9 * sh.y) * (0.6 + 0.7 * clamp(0.5 + 0.5 * dot(sd, vec3(${P.LIGHT_DIR.map((v) => v.toFixed(3)).join(', ')})) / sr, 0.0, 1.0));
          return (1.0 - smoothstep(sr - sa, sr + sa, length(sd))) * step(fract(sh.x * 13.7 + sh.y * 5.3), keep);
        }
        // the limestone. wild: the scar's own weathered stone (its bedding dips with the beds and its seams lie at
        // uneven spacings; grey where the rain has weathered it). wet: behind and beside the fall, block by block: the
        // same stone dark and bare, thin runs of brown down it, small glints along a block's worn upper edge. And on
        // the scar within three metres of the fall's sides, thickest low down: the SPLATTER (see below).
        // (the paint is laid along the face: its lie is mirrored left and right of the river, so that it is never drawn out on a face that turns in toward the fall)
        vec3 valleyRock(vec3 p, vec3 n, float wild, float wet) {
          float up = clamp(n.y, 0.0, 1.0);
          vec2 q = vec2(p.x + 0.6 * p.z * clamp(p.x * 0.5, -1.0, 1.0), p.y - wild * uDip * p.x);
          float blot = texture2D(uGrain, q / 7.3).r, grain = texture2D(uGrain, q / 1.1).g, big = texture2D(uGrain, p.xz / 23.0).b;
          vec3 c = mix(vec3(0.61, 0.51, 0.37), vec3(0.87, 0.77, 0.58), blot) * (0.86 + 0.28 * grain);      // (a warm, honey-grey stone)
          float fy = fwidth(q.y) + 1e-4, lam = abs(fract(q.y / 0.46 + 0.6 * big) - 0.5) * 0.46;
          float line = (1.0 - smoothstep(0.012 + fy, 0.03 + 1.5 * fy, lam)) * (1.0 - smoothstep(0.12, 0.4, fy));
          c *= 1.0 - 0.3 * (1.0 - 0.85 * wild) * line * (1.0 - up) * smoothstep(0.45, 0.7, texture2D(uGrain, q / vec2(9.0, 3.1)).g);
          // the scar's seams: where one slow slice of the grain crosses its middle, so that no two lie the same way apart
          float sv = texture2D(uGrain, vec2(q.x / 67.0, q.y / 5.7)).g, sw = fwidth(sv) + 1e-4;
          float seam = (1.0 - smoothstep(0.6 * sw, 1.6 * sw + 0.004, abs(sv - 0.5))) * (1.0 - smoothstep(0.02, 0.07, sw));
          c *= 1.0 - 0.34 * wild * seam * (1.0 - up);
          c = mix(c, vec3(0.5, 0.51, 0.49) * (0.8 + 0.4 * grain), 0.45 * wild * smoothstep(0.35, 0.65, texture2D(uGrain, q / 17.0).b));
          float streak = texture2D(uGrain, vec2(q.x / 2.6, q.y / 24.0)).b;       // the rain's stains: tall and narrow, clean at the edge
          c *= 1.0 - (0.16 + 0.08 * wild) * smoothstep(0.66, 0.77, streak) * (1.0 - up);
          vec3 moss = vec3(0.085, 0.17, 0.045) * (0.6 + 0.8 * grain);
          c = mix(c, moss, (1.0 - wet) * smoothstep(0.7, 0.92, up) * smoothstep(0.28, 0.5, blot * 0.6 + grain * 0.5));
          vec3 choc = CHOC;
          vec3 dark = mix(c, vec3(dot(c, vec3(0.34))), 0.85) * vec3(0.44, 0.375, 0.32);
          dark = mix(dark, choc * 0.9, 0.5 * smoothstep(0.7, 0.76, texture2D(uGrain, vec2(q.x / 1.1, q.y / 9.0)).r) * (1.0 - up));
          float edge = smoothstep(0.3, 0.55, n.y) * (1.0 - smoothstep(0.8, 0.97, n.y));
          dark += vec3(0.9, 0.86, 0.78) * edge * smoothstep(0.7, 0.78, texture2D(uGrain, vec2(q.x / 0.37, p.z / 0.9)).g);
          c = mix(c, dark, wet);
${SPLATTER}
          return c;
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          vec3 turf = texture2D(uTurf, (vGW.xz - vec2(${F1(X0)}, ${F1(Z0)})) / vec2(${F1(X1 - X0)}, ${F1(Z1 - Z0)})).rgb; turf *= turf;
          float d1 = texture2D(uGrain, vGW.xz / 2.3).r, d2 = texture2D(uGrain, vGW.xz / 0.53).g, nb = texture2D(uGrain, vGW.xz / 5.1).b;
          float bl = texture2D(uBlades, vGW.xz / 1.6).r * 1.6, bl2 = texture2D(uBlades, vGW.zx / 4.7 + 0.37).r * 1.6;
          turf *= (0.25 + 0.95 * bl) * (0.7 + 0.45 * bl2) * (0.75 + 0.5 * d1);
          turf *= 0.74 + 0.52 * texture2D(uGrain, vGW.xz / 6.7).g;        // the hay stands in tussocks
          float bd = vG.x + 0.3 * (d2 - 0.5) + 0.25 * (d1 - 0.5);      // (the bare earth's edge is ragged at three scales)
          gBank = 1.0 - smoothstep(0.5 + 0.4 * nb, 0.85 + 0.5 * nb, bd);      // (bare earth: the bank's first metre, gone to turf by 1.6 m)
          {
            // THE DRIFTS FAR OFF: the same flowers the planting stands near the eye, here as heads seen from above: one to
            // a cell of 0.42 m, of the kind the field says, crisp while a head spans grains of the picture and gone to the
            // drift's own mean colour beyond. They come in where the planting's own forms give out (by the eye's distance).
            vec4 dr = texture2D(uDrift, (vGW.xz - vec2(${F1(X0 - 0.5 * STEP)}, ${F1(Z0 - 0.5 * STEP)})) / vec2(${F1(NX * STEP)}, ${F1(NZ * STEP)}));
            vec2 cp = vGW.xz / 0.42, ci = floor(cp); float fwp = max(fwidth(cp.x), fwidth(cp.y));
            vec3 hh = turfHash(ci); float dd = length(cp - (ci + 0.5 + (hh.xy - 0.5) * 0.5)) * 0.42, aa = 0.42 * fwp + 1e-4;
            float kD = 0.4 * dr.r, kC = kD + 0.34 * dr.g, kP = kC + 0.2 * dr.b, kT = kP + 0.28 * dr.a;
            vec3 fc = vec3(0.0); float rad = 0.0;
            if (hh.z < kD) { fc = dd < 0.055 ? vec3(0.6, 0.42, 0.04) : vec3(0.58, 0.58, 0.53); rad = 0.17; }
            else if (hh.z < kC) { fc = vec3(0.4, 0.11, 0.25); rad = 0.11; }
            else if (hh.z < kP) { fc = vec3(0.55, 0.57, 0.47) * (0.7 + 0.6 * d2); rad = 0.2; }
            else if (hh.z < kT) { fc = vec3(0.36, 0.27, 0.1); rad = 0.085; }
            float dotK = rad > 0.0 ? 1.0 - smoothstep(rad - aa, rad + aa, dd) : 0.0, fine = 1.0 - smoothstep(0.3, 0.85, fwp);
            vec3 meanC = turf + kD * 0.5 * (vec3(0.58, 0.58, 0.53) - turf) + (kC - kD) * 0.21 * (vec3(0.4, 0.11, 0.25) - turf) + (kP - kC) * 0.7 * (vec3(0.55, 0.57, 0.47) - turf) + (kT - kP) * 0.13 * (vec3(0.36, 0.27, 0.1) - turf);
            float amount = smoothstep(30.0, 44.0, distance(vGW, cameraPosition)) * smoothstep(0.9, 1.2, vG.x);      // (the planting's far forms stand out to some 40 m; no head within a metre of the bank line)
            turf = mix(turf, mix(meanC, mix(turf, fc, dotK), fine), amount);
          }
          // THE SHORE. Between the bank line and the liquid the bed's slope shows, and the bank's first metre is bare:
          // dark wet earth with stones in it, stained with the liquid's own brown at and just above its line, drying
          // to the bank's own earth and then to turf. (On the slope vG.x is minus the metres under the bank's level;
          // the liquid lies the plan's FREEBOARD under that level.)
          float damp = 1.0 - smoothstep(-0.25, 1.2, vG.x), over = vG.x + ${P.FREEBOARD.toFixed(2)};
          float dm = texture2D(uGrain, vec2(vGW.x + vGW.y, vGW.z) / 0.53).g;      // (the earth's grain, laid so that it is not drawn out down the slope)
          vec3 mud = vec3(0.115, 0.075, 0.047) * (0.65 + 0.7 * dm) * (1.0 - 0.5 * damp);
          // the stones, large and small: they lie on the slope and thin out across the bank; wet ones are darker
          float lie = 1.0 - smoothstep(0.3, 1.2, bd), st, st2;
          float stone = shoreStone(vGW, 0.42, 0.5 * lie, st), stone2 = shoreStone(vGW, 0.19, 0.6 * lie, st2);
          if (stone < stone2) { stone = stone2; st = st2; }
          vec3 sc = vec3(0.25, 0.23, 0.195) * st * (1.0 - 0.45 * damp);
          mud = mix(mud, sc, stone);
          gStain = (1.0 - smoothstep(0.03 + 0.12 * nb, 0.1 + 0.2 * nb, over)) * (1.0 - clamp(vG.y, 0.0, 1.0));
          mud = mix(mud, CHOC * (0.8 + 0.5 * dm), gStain);
          gDamp = damp * gBank * (1.0 - clamp(vG.y, 0.0, 1.0));
          vec3 c = mix(turf, mud, gBank);
          vec3 nW = normalize(inverseTransformDirection(normalize(vNormal), viewMatrix));
          float wild = smoothstep(10.0, 11.0, vG.x);
          gWet = smoothstep(1.3, 1.7, vG.y) * wild;     // (wet goes by the block: its edge is the block's own)
          c = mix(c, valleyRock(vGW, nW, wild, gWet), clamp(vG.y, 0.0, 1.0));
          diffuseColor.rgb *= c;
        }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(mix(mix(mix(roughnessFactor, 0.5, gBank * (1.0 - clamp(vG.y, 0.0, 1.0))), 0.34, gDamp), 0.3, gWet), 0.16, max(gSplat, gStain));');
  };
  m.customProgramCacheKey = () => 'valley-meadow-ground';
  return P.barMaterial(m);
}
