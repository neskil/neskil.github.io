// Terrain kit, part 0: procedural data textures shared by the terrain and rock materials.
//   makeDetailTexture  tileable fbm (height + gradient + veins) with a companion cellular texture (pebbles + cracks)
//   makeStrata         a 1D table of rock beds (colour + hardness) as a LUT texture and as data for terrace()/canyon()
import * as THREE from 'three';
import { clamp, lerp, makeRng } from '../core.js';

export const rngOf = (o) => (o && o.rng) || makeRng(1);
const col = (c) => (c && c.isColor ? c.clone() : new THREE.Color(c));

function finish(data, N, M, aniso = 2) {
  const tex = new THREE.DataTexture(data, N, M, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = aniso; tex.needsUpdate = true;
  return tex;
}

// tileable value-noise layer accumulated into `out`
function layer(rng, out, N, period, amp) {
  const P = period, lat = new Float32Array(P * P);
  for (let i = 0; i < P * P; i++) lat[i] = rng();
  const i0 = new Int32Array(N), i1 = new Int32Array(N), w = new Float32Array(N);
  for (let x = 0; x < N; x++) { const f = (x / N) * P, i = Math.floor(f), t = f - i; i0[x] = i % P; i1[x] = (i + 1) % P; w[x] = t * t * (3 - 2 * t); }
  for (let y = 0; y < N; y++) {
    const r0 = i0[y] * P, r1 = i1[y] * P, wy = w[y], o = y * N;
    for (let x = 0; x < N; x++) {
      const a = lat[r0 + i0[x]], b = lat[r0 + i1[x]], c = lat[r1 + i0[x]], d = lat[r1 + i1[x]], wx = w[x];
      out[o + x] += (a + (b - a) * wx + (c + (d - c) * wx - a - (b - a) * wx) * wy) * amp;
    }
  }
}

// height (Float32Array N*N, tileable) -> RGBA8 with R = height, G/B = d/du, d/dv (0.5 = flat), A = alpha array
function pack(H, A, N, gclip = 0.6) {
  const data = new Uint8Array(N * N * 4), G = new Float32Array(N * N * 2); let gmax = 1e-6;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, gx = H[y * N + (x + 1) % N] - H[y * N + (x + N - 1) % N], gy = H[((y + 1) % N) * N + x] - H[((y + N - 1) % N) * N + x];
    G[i * 2] = gx; G[i * 2 + 1] = gy; const m = Math.max(Math.abs(gx), Math.abs(gy)); if (m > gmax) gmax = m;
  }
  gmax *= gclip;   // a little clipping buys precision for the common small slopes
  for (let i = 0; i < N * N; i++) {
    data[i * 4] = Math.round(clamp(H[i], 0, 1) * 255);
    data[i * 4 + 1] = Math.round(clamp(0.5 + 0.5 * G[i * 2] / gmax, 0, 1) * 255);
    data[i * 4 + 2] = Math.round(clamp(0.5 + 0.5 * G[i * 2 + 1] / gmax, 0, 1) * 255);
    data[i * 4 + 3] = Math.round(clamp(A[i], 0, 1) * 255);
  }
  return data;
}

// Cellular companion: R = pebble / stone height (crisp domes of many sizes, 0 between them), G/B = its gradient,
// A = distance to the nearest plate boundary of a coarse Voronoi net (0 on the crack, 1 in the middle of a plate).
function* cellSteps(rng, N = 256) {
  const H = new Float32Array(N * N), A = new Float32Array(N * N);
  const stones = (P, fill, rLo, rHi, amp) => {
    const px = new Float32Array(P * P), py = new Float32Array(P * P), pr = new Float32Array(P * P), ph = new Float32Array(P * P), pe = new Float32Array(P * P), pa = new Float32Array(P * P), pb = new Float32Array(P * P);
    for (let i = 0; i < P * P; i++) { px[i] = rng(); py[i] = rng(); pr[i] = rng() < fill ? lerp(rLo, rHi, Math.pow(rng(), 1.6)) : 0; ph[i] = amp * (0.55 + 0.45 * rng()); pe[i] = 0.7 + 0.6 * rng(); const an = rng() * Math.PI; pa[i] = Math.cos(an); pb[i] = Math.sin(an); pr[i] = pr[i] ? 1 / (pr[i] * pr[i]) : 0; }
    const c = N / P;                                   // splat each stone into its own bounding box (tileable)
    for (let j = 0; j < P; j++) for (let i = 0; i < P; i++) {
      const k = j * P + i, r = pr[k]; if (r === 0) continue;
      const cx = (i + px[k]) * c, cy = (j + py[k]) * c, R = Math.ceil(c / Math.sqrt(r) * 1.45), ca = pa[k], sa = pb[k], e = pe[k], hh = ph[k];
      for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
        const dx = (x - cx) / c, dy = (y - cy) / c, ex = (dx * ca + dy * sa) * e, ey = (-dx * sa + dy * ca) / e, q = (ex * ex + ey * ey) * r;
        if (q < 1) { const o = ((y % N + N) % N) * N + (x % N + N) % N, v = hh * Math.sqrt(Math.sqrt(1 - q * q)); if (v > H[o]) H[o] = v; }
      }
    }
  };
  stones(11, 0.55, 0.3, 0.62, 1); yield; stones(23, 0.7, 0.22, 0.6, 0.8); yield; stones(53, 0.75, 0.25, 0.62, 0.55); yield;
  { // crack net: F2 - F1 of a warped jittered grid
    const P = 7, px = new Float32Array(P * P), py = new Float32Array(P * P), W1 = new Float32Array(N * N), W2 = new Float32Array(N * N);
    for (let i = 0; i < P * P; i++) { px[i] = 0.15 + 0.7 * rng(); py[i] = 0.15 + 0.7 * rng(); }
    layer(rng, W1, N, 9, 1); layer(rng, W2, N, 9, 1); layer(rng, W1, N, 31, 0.3); layer(rng, W2, N, 31, 0.3); yield;
    const s = P / N;
    for (let y = 0; y < N; y++) { if ((y & 63) === 63) yield; for (let x = 0; x < N; x++) {
      const i = y * N + x, fx = x * s + (W1[i] - 0.65) * 0.45, fy = y * s + (W2[i] - 0.65) * 0.45, ci = Math.floor(fx), cj = Math.floor(fy);
      let f1 = 9, f2 = 9;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const k = (((cj + dj) % P + P) % P) * P + ((ci + di) % P + P) % P, dx = ci + di + px[k] - fx, dy = cj + dj + py[k] - fy, d = dx * dx + dy * dy;
        if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
      }
      A[i] = clamp((Math.sqrt(f2) - Math.sqrt(f1)) * 2.2, 0, 1);
    } }
  }
  yield;
  return finish(pack(H, A, N, 0.8), N, N);
}
const drain = (it) => { let r; while (!(r = it.next()).done); return r.value; };
const makeCellTexture = (rng, N) => drain(cellSteps(rng, N));

// ---------- detail texture ----------
// Tileable RGBA8 noise: R = fbm height (mean 0.5), G/B = its u/v gradient (0.5 = flat), A = thin vein lines.
// tex.userData.cell is the cellular companion (pebbles + cracks) used for the crisp near-field layer.
// Both are mip-mapped, so the detail they drive fades out by itself in the distance (no shimmer).
// opts: { rng, size 256, anisotropy 2 } (raise the anisotropy to 4-8 for crisper ground at grazing angles on fast GPUs).
// Cost: ~12 ms for the pair at 256x256. Share one between a terrain and its rock materials (opts.detailTexture / opts.terrain).
// detailTextureSteps is the same work as a generator that yields between its steps (the terrain builder runs it
// inside its own steps, so a world that builds its terrain with makeTerrainAsync never blocks on the textures).
export function* detailTextureSteps(opts = {}) {
  const rng = rngOf(opts), N = opts.size ?? 256, H = new Float32Array(N * N), V = new Float32Array(N * N);
  layer(rng, H, N, 4, 0.5); layer(rng, H, N, 8, 0.26); layer(rng, H, N, 16, 0.14); layer(rng, H, N, 32, 0.07); layer(rng, H, N, 64, 0.03); yield;
  { const A = new Float32Array(N * N), B = new Float32Array(N * N), W1 = new Float32Array(N * N), W2 = new Float32Array(N * N);
    layer(rng, A, N, 6, 1); layer(rng, B, N, 13, 1); layer(rng, W1, N, 4, 1); layer(rng, W2, N, 4, 1); yield;
    for (let y = 0; y < N; y++) { if ((y & 63) === 63) yield; for (let x = 0; x < N; x++) {
      const i = y * N + x, xs = (x + Math.round((W1[i] - 0.5) * N * 0.09) + N) % N, ys = (y + Math.round((W2[i] - 0.5) * N * 0.09) + N) % N, j = ys * N + xs;
      const d = Math.abs(A[j] * 2 - 1 + (B[i] - 0.5) * 0.22) / 0.13;
      V[i] = Math.exp(-d * d);
    } } }
  yield;
  let lo = 1e9, hi = -1e9, m = 0; for (let i = 0; i < H.length; i++) { const v = H[i]; if (v < lo) lo = v; if (v > hi) hi = v; m += v; } m /= H.length;
  const s = 0.5 / Math.max(m - lo, hi - m); for (let i = 0; i < H.length; i++) H[i] = 0.5 + (H[i] - m) * s;
  const tex = finish(pack(H, V, N), N, N, opts.anisotropy ?? 2); yield;
  tex.userData.cell = yield* cellSteps(rng, N); tex.userData.cell.anisotropy = tex.anisotropy;
  return tex;
}
export const makeDetailTexture = (opts = {}) => drain(detailTextureSteps(opts));
export const cellOf = (tex) => tex.userData.cell || (tex.userData.cell = makeCellTexture(makeRng(7), 256));

// ---------- strata ----------
// A stack of rock beds of random thickness: colour from a small palette, thin dark seams, a hardness per bed.
// The LUT (512x1, rgb = sqrt(colour), a = hardness) is sampled by world height in the terrain and rock shaders; the
// same table drives terrace({ beds }) / canyon({ beds }) so ledges sit on top of the hard beds.
// opts: rng, rock '#8e6a52', rockB '#b08a6a' (the two main bed colours: keep them within ~25% luminance),
//   accent (pale colour used for one or two thin beds; default: rockB lightened), dark (default: rock darkened),
//   beds 16, thickness 7 (mean bed thickness, m), base 0 (world height of the bottom of the stack; it repeats above and below),
//   contrast 1 (0 = one colour), seams 0.6 (darkness of the seams between beds), hard 0.45 (share of hard, cliff-forming beds)
// Returns { texture, beds: [{ y0, y1, hard, color }], span (m), base, steps (ledge heights within one span), bedAt(y) }. Cost ~1 ms.
export function makeStrata(opts = {}) {
  const rng = rngOf(opts), nb = opts.beds ?? 16, mean = opts.thickness ?? 7, base = opts.base ?? 0, contrast = opts.contrast ?? 1, seams = opts.seams ?? 0.6, hardShare = opts.hard ?? 0.45;
  const rock = col(opts.rock ?? '#8e6a52'), rockB = col(opts.rockB ?? opts.rock ?? '#b08a6a');
  const accent = opts.accent ? col(opts.accent) : rockB.clone().lerp(new THREE.Color(1, 0.96, 0.88), 0.3);
  const dark = opts.dark ? col(opts.dark) : rock.clone().multiplyScalar(0.62);
  const mid = rock.clone().lerp(rockB, 0.5), beds = [];
  const nAcc = nb >= 10 ? 2 : 1, accAt = new Set(); while (accAt.size < nAcc) accAt.add(rng.int(1, nb - 1));
  let y = 0, wasHard = rng.chance(0.5);
  for (let i = 0; i < nb; i++) {
    const isAcc = accAt.has(i), hardBed = isAcc ? true : rng.chance(wasHard ? hardShare * 0.45 : Math.min(0.95, hardShare * 1.7));
    const t = mean * (isAcc ? rng.range(0.14, 0.3) : hardBed ? rng.range(0.45, 1.5) : rng.range(0.5, 2.2) * (rng.chance(0.25) ? 0.35 : 1));
    const c = new THREE.Color();
    if (isAcc) c.copy(accent);
    else { const r = rng(); if (r < 0.34) c.copy(rock); else if (r < 0.62) c.copy(rockB); else if (r < 0.84) c.copy(mid); else c.copy(dark).lerp(rock, 0.4);
      c.multiplyScalar(hardBed ? rng.range(0.98, 1.12) : rng.range(0.84, 0.98)); }
    c.lerp(mid, 1 - contrast);
    beds.push({ y0: y, y1: y + t, hard: hardBed ? rng.range(0.72, 1) : rng.range(0.05, 0.35), color: c }); y += t; wasHard = hardBed;
  }
  const span = y, N = 512, data = new Uint8Array(N * 4);
  let b = 0;
  for (let i = 0; i < N; i++) {
    const yy = (i + 0.5) / N * span; while (b < nb - 1 && yy >= beds[b].y1) b++;
    const bed = beds[b], f = (yy - bed.y0) / (bed.y1 - bed.y0), px = span / N;
    const edge = Math.min(yy - bed.y0, bed.y1 - yy) / px;                       // texels from the nearest bed boundary
    let k = 1 - seams * 0.42 * clamp(1.4 - edge, 0, 1) * (0.4 + 0.6 * Math.abs(Math.sin(b * 2.4 + 1)));                           // thin dark seam on the boundary
    k *= 1 + 0.07 * (rng() - 0.5) * (1.3 - bed.hard) + 0.05 * Math.sin(f * (5 + 9 * bed.hard) * Math.PI);   // laminations
    k *= bed.hard > 0.5 ? 1 - 0.1 * f : 0.94 + 0.1 * f;                           // hard beds: shadowed under the lip above
    data[i * 4] = Math.round(Math.sqrt(clamp(bed.color.r * k, 0, 1)) * 255); data[i * 4 + 1] = Math.round(Math.sqrt(clamp(bed.color.g * k, 0, 1)) * 255);
    data[i * 4 + 2] = Math.round(Math.sqrt(clamp(bed.color.b * k, 0, 1)) * 255); data[i * 4 + 3] = Math.round(bed.hard * 255);
  }
  const texture = finish(data, N, 1, 1);
  // ledges: the top of every run of hard beds
  const steps = [];
  for (let i = 0; i < nb; i++) if (beds[i].hard > 0.5 && !(beds[(i + 1) % nb].hard > 0.5)) steps.push(beds[i].y1);
  if (!steps.length) steps.push(span);
  const meanColor = new THREE.Color(0, 0, 0); for (const bd of beds) { const w = (bd.y1 - bd.y0) / span; meanColor.r += bd.color.r * w; meanColor.g += bd.color.g * w; meanColor.b += bd.color.b * w; }
  return { texture, beds, span, base, steps, meanColor,
    bedAt(yw) { let v = (yw - base) % span; if (v < 0) v += span; for (let i = 0; i < nb; i++) if (v < beds[i].y1) return beds[i]; return beds[nb - 1]; } };
}
