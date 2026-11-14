// Terrain kit, part 2: height function builders. Each takes { noise (core.makeNoise object) or rng, ...opts }
// and returns a plain function (x, z) => height in metres. They are cheap to build and cost 0.2-1 us per call.
import { clamp, lerp, smoothstep, makeNoise, makeRng } from '../core.js';

// BROUGHT IN: smin and smax follow the polynomial smooth minimum as Inigo Quilez publishes it
// (https://iquilezles.org/articles/smin/), MIT License. The notice ships with the site in THIRD-PARTY-NOTICES.txt.
export const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
export const smax = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * 0.25; };
const noiseOf = (o) => o.noise || makeNoise(o.rng ? o.rng.int(1, 2147483646) : 1);
const seedOf = (noise) => Math.floor((noise.n2(12.345, 67.891) + 1) * 5e5);
function hash2(i, j, s) {
  let h = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; h = Math.imul(h, 2246822519); return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

// Derivative-damped value-noise fbm ("eroded" look: rough crests, smooth dendritic valleys). Returns ~0..1.
// `erosion` 0 = plain fbm, 1 = strongly eroded. `ridge` blends the first octaves toward sharp ridged crests.
function makeEroded(seed) {
  const rnd = makeRng(seed), tab = new Float32Array(65536);
  for (let i = 0; i < 65536; i++) tab[i] = rnd();
  return (x, y, octaves = 7, erosion = 1, ridge = 0, gain = 0.5) => {
    let a = 0, b = 1, dx = 0, dy = 0, norm = 0;
    for (let o = 0; o < octaves; o++) {
      const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
      const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10), uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
      const vx = 30 * fx * fx * (fx * (fx - 2) + 1), vy = 30 * fy * fy * (fy * (fy - 2) + 1);
      const r0 = (j & 255) << 8, r1 = ((j + 1) & 255) << 8, c0 = i & 255, c1 = (i + 1) & 255;
      const p = tab[r0 | c0], q = tab[r0 | c1], r = tab[r1 | c0], t = tab[r1 | c1], k1 = q - p, k2 = r - p, k4 = p - q - r + t;
      let v = p + k1 * ux + k2 * uy + k4 * ux * uy, gx = vx * (k1 + k4 * uy), gy = vy * (k2 + k4 * ux);
      // ridged crests on the two largest octaves only (wavelengths the mesh can carry); the erosion term keeps the
      // plain gradient, so the roughness of the smaller octaves does not flip across a crest (no needles)
      if (ridge > 0 && o < 2) { const e = v * 2 - 1, ae = Math.sqrt(e * e + 0.03); v = lerp(v, 1.16 - ae, o ? ridge * 0.5 : ridge); }
      dx += gx * erosion; dy += gy * erosion;
      a += b * v / (1 + dx * dx + dy * dy); norm += b; b *= gain;
      const nx = (0.8 * x - 0.6 * y) * 2.02 + 17.1; y = (0.6 * x + 0.8 * y) * 2.02 - 9.3; x = nx;
    }
    return a / norm;
  };
}

// Faster path.nearestXZ (two-level search over our own samples): returns a shared { dist, y, u } object.
export function pathNearest(path, N = 320) {
  const sx = new Float32Array(N + 1), sy = new Float32Array(N + 1), sz = new Float32Array(N + 1), out = { dist: 0, y: 0, u: 0 };
  for (let i = 0; i <= N; i++) { const p = path.pointAt(i / N); sx[i] = p.x; sy[i] = p.y; sz[i] = p.z; }
  const step = 8;
  return (x, z) => {
    let b1 = Infinity, i1 = 0, b2 = Infinity, i2 = 0;
    for (let i = 0; i <= N; i += step) { const dx = sx[i] - x, dz = sz[i] - z, d = dx * dx + dz * dz; if (d < b1) { b2 = b1; i2 = i1; b1 = d; i1 = i; } else if (d < b2) { b2 = d; i2 = i; } }
    let best = b1, bi = i1;
    for (let k = 0; k < 2; k++) { const c = k ? i2 : i1, lo = Math.max(0, c - step + 1), hi = Math.min(N, c + step - 1);
      for (let i = lo; i <= hi; i++) { const dx = sx[i] - x, dz = sz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } } }
    out.dist = Math.sqrt(best); out.y = sy[bi]; out.u = bi / N; return out;
  };
}

// Ridged alpine ranges with massifs and passes. Peaks reach about base + height.
// opts: height 260, scale 520 (m between major ridges), octaves 7, warp 0.2, sharpness 1.4, erosion 0.9 (0 = plain fbm), ridge 0.35 (0..1: sharp aretes on the main ridges),
// base 0, foothills 0.2, offset [0,0]
export function mountains(opts = {}) {
  const noise = noiseOf(opts), { height = 260, scale = 520, octaves = 7, warp = 0.2, sharpness = 1.4, base = 0, foothills = 0.2, erosion = 0.9, ridge = 0.35, offset = [0, 0] } = opts;
  const f = 1 / scale, eroded = makeEroded(seedOf(noise) + 77);
  return (x, z) => {
    let px = (x + offset[0]) * f, pz = (z + offset[1]) * f;
    const m = smoothstep(-0.55, 0.5, noise.fbm2(px * 0.33 + 11.3, pz * 0.33 - 5.7, 2));
    const low = 0.5 + 0.5 * noise.n2(px * 1.1 - 7, pz * 1.1 + 13);
    px += warp * noise.n2(px * 0.6 + 3.1, pz * 0.6 - 1.7); pz += warp * noise.n2(px * 0.6 - 8.3, pz * 0.6 + 4.2);
    const r = clamp(eroded(px * 1.25 + 31.7, pz * 1.25 + 5.3, octaves, erosion, ridge) * (2.15 - 0.5 * ridge) - 0.12, 0, 1.2);
    return base + height * (Math.pow(r, sharpness) * (0.3 + 0.7 * m) * (1 - foothills) + foothills * low * (0.4 + 0.6 * m));
  };
}

// Soft rolling hills. opts: height 42, scale 280, octaves 3, base 0, roughness 0.36, offset
export function hills(opts = {}) {
  const noise = noiseOf(opts), { height = 42, scale = 280, octaves = 3, base = 0, roughness = 0.36, offset = [0, 0] } = opts;
  const f = 1 / scale;
  return (x, z) => {
    const px = (x + offset[0]) * f, pz = (z + offset[1]) * f;
    const a = noise.fbm2(px + 0.25 * noise.n2(px * 0.5 + 4, pz * 0.5), pz + 0.25 * noise.n2(px * 0.5, pz * 0.5 + 9), octaves, 2, roughness);
    const b = noise.n2(px * 0.37 + 9.1, pz * 0.37 - 3.3);
    const v = clamp(0.5 + 0.62 * a, 0, 1);
    return base + height * (v * v * (3 - 2 * v) * (0.72 + 0.28 * b) + 0.14 * b + 0.14);
  };
}

// Dune field with sharp brinks and steep slip faces. opts: height 24, scale 120 (crest spacing), wind 0.5 (radians,
// direction the wind blows toward), windward 0.7, wander 1, ripples 0.14, base 0
export function dunes(opts = {}) {
  const noise = noiseOf(opts), { height = 24, scale = 120, wind = 0.5, windward = 0.7, wander = 1, ripples = 0.14, base = 0 } = opts;
  const cw = Math.cos(wind), sw = Math.sin(wind);
  const prof = (t, a) => { t -= Math.floor(t); if (t < a) { const q = t / a; return q * q * (3 - 2 * q); } const r = (1 - t) / (1 - a); return Math.pow(r, 1.35); };
  return (x, z) => {
    const u = (x * cw + z * sw) / scale, v = (-x * sw + z * cw) / scale;
    const w = wander * (noise.fbm2(u * 0.22 + 2.3, v * 0.13, 2) * 0.75 + noise.n2(u * 0.6, v * 0.31 + 7) * 0.1);
    const amp = 0.4 + 0.6 * smoothstep(-0.7, 0.5, noise.n2(u * 0.21 + 31, v * 0.17 - 17));
    const along = 0.74 + 0.26 * noise.n2(u * 0.4 - 5, v * 0.45 + 3);
    let h = prof(u + w, windward) * amp * along;
    const u2 = (x * (cw * 0.8 - sw * 0.6) + z * (sw * 0.8 + cw * 0.6)) / (scale * 0.29), v2 = (-x * (sw * 0.8 + cw * 0.6) + z * (cw * 0.8 - sw * 0.6)) / (scale * 0.29);
    h += ripples * prof(u2 + noise.n2(u2 * 0.2, v2 * 0.12) * 0.5 + w * 1.5, 0.66) * (0.25 + 0.75 * amp) * smoothstep(0.75, 0.2, h);
    h += 0.45 * (0.5 + 0.5 * noise.fbm2(u * 0.16 - 9, v * 0.16 + 4, 2));
    return base + height * h;
  };
}

// Plateaus cut by winding canyons, with strata terraces. `mesa` is the share of land that is high:
// 0.2 gives isolated buttes on a plain, 0.75 a tableland with slot canyons.
// opts: height 150, scale 460, steps 5, floor 0, mesa 0.5, sharp 0.72 (0 ramp .. 0.95 vertical risers), talus 0.12, roughness 1,
//   beds (a makeStrata() result: ledges sit on its hard beds instead of `steps` even ones), offset
export function canyon(opts = {}) {
  const noise = noiseOf(opts), { height = 150, scale = 460, steps = 5, floor = 0, mesa = 0.5, sharp = 0.72, talus = 0.12, roughness = 1, offset = [0, 0], beds = null } = opts;
  const f = 1 / scale, seed = seedOf(noise), lo = 0.34 - (mesa - 0.5) * 0.62, hi = lo + 0.3;
  const bedStep = beds ? stepper({ beds, sharp, slope: talus }) : null, floorB = bedStep ? bedStep(floor + 0.01) : floor;
  return (x, z) => {
    const px = (x + offset[0]) * f, pz = (z + offset[1]) * f;
    const n = 0.5 + 0.5 * noise.warp2(px, pz, 0.55, 4);
    let t = clamp((n - lo) / (hi - lo), 0, 1); t = t * t * (3 - 2 * t);
    const fine = noise.fbm2(px * 5 + 3, pz * 5 - 8, 2), und = 0.006 * roughness * fine + 0.035 * noise.n2(px * 1.3 + 40, pz * 1.3);
    if (bedStep) return Math.max(floorB, bedStep(floor + height * (t + fine * 0.014 * roughness))) + height * und;
    const ts = clamp(t * steps + fine * 0.07 * roughness, 0, steps - 1e-4), i = Math.floor(ts), fr = ts - i;
    const e = sharp * (0.8 + 0.2 * hash2(i, 7, seed));
    const riser = smoothstep(e, 1, fr);
    const tread = (i + lerp(riser, fr, talus) + (hash2(i, 3, seed) - 0.5) * 0.3 * (i > 0 ? 1 : 0)) / steps;
    return floor + height * (tread + und);
  };
}
export const mesas = (opts = {}) => canyon({ mesa: 0.22, steps: 4, scale: 380, height: 170, ...opts });

// Karst towers (Guilin / Ha Long): steep limestone pillars with rounded tops on a low plain or sea bed.
// opts: height 170, spacing 120, radius 0.36 (x spacing), density 0.7, base 0, ground 6 (undulation), jitter 0.85, ledges 0.45 (0 = smooth domes)
export function karst(opts = {}) {
  const noise = noiseOf(opts), { height = 170, spacing = 120, radius = 0.36, density = 0.7, base = 0, ground = 6, jitter = 0.85, ledges = 0.45 } = opts;
  const seed = seedOf(noise), inv = 1 / spacing;
  return (x, z) => {
    const gx = x * inv, gz = z * inv, ci = Math.floor(gx), cj = Math.floor(gz);
    const wob = 1 + 0.22 * noise.n2(x * 0.021, z * 0.021) + 0.08 * noise.n2(x * 0.07 + 5, z * 0.07);
    let h = 0;
    for (let j = cj - 1; j <= cj + 1; j++) for (let i = ci - 1; i <= ci + 1; i++) {
      if (hash2(i, j, seed) > density) continue;
      const cx = (i + 0.5 + (hash2(i, j, seed + 1) - 0.5) * jitter) * spacing, cz = (j + 0.5 + (hash2(i, j, seed + 2) - 0.5) * jitter) * spacing;
      const R = spacing * radius * (0.55 + 0.9 * hash2(i, j, seed + 3)), H = height * (0.35 + 0.65 * hash2(i, j, seed + 4));
      const ex = 0.75 + 0.5 * hash2(i, j, seed + 5), q = Math.hypot((x - cx) * ex, (z - cz) / ex) / (R * wob);
      if (q >= 1.12) continue;
      // vertical flutes (the outline is scalloped, deeper low down) and a few ledges up the tower
      const an = Math.atan2(z - cz, x - cx), fl = hash2(i, j, seed + 6) * 6.28;
      const flute = 0.05 * Math.abs(Math.sin(an * (3 + Math.floor(hash2(i, j, seed + 7) * 3)) + fl)) + 0.035 * Math.abs(Math.sin(an * 11 + fl * 3)) + 0.05 * noise.n2(x * 0.09 + i, z * 0.09 - j);
      const qq = q * (1 + flute); if (qq >= 1) continue;
      let p = Math.pow(1 - qq * qq * qq, 0.55);
      const nl = 3 + Math.floor(hash2(i, j, seed + 8) * 3), sp = p * nl + 0.3 * noise.n2(x * 0.03 - j, z * 0.03 + i), si = Math.floor(sp), sq = sp - si;
      p = lerp(p, clamp((si + smoothstep(0.55, 1, sq)) / nl, 0, 1), ledges) * H;
      h = h > 0 ? smax(h, p, H * 0.15) : p;
    }
    const g = ground * (noise.fbm2(x * 0.006, z * 0.006, 3) + 0.4);
    const rough = h > 0 ? noise.fbm2(x * 0.045, z * 0.045, 3) * Math.min(h, height * 0.07) : 0;
    return base + g + h + rough;
  };
}

// Volcanic cone with a crater, radial gullies and a rough apron. The returned function has .center, .rimRadius,
// .rimHeight and .craterFloor (handy for lava lakes and smoke).
// opts: height 340, radius 620, center [0,0], crater 0.15 (rim radius / radius), craterDepth 0.22 (x height),
// gullies 1, base 0, plain 10 (undulation of the surrounding land), breach 0 (0..1 lowers one side of the rim), breachAngle 0 (radians, direction of the breach)
export function volcano(opts = {}) {
  const noise = noiseOf(opts), { height = 340, radius = 620, center = [0, 0], crater = 0.15, craterDepth = 0.22, gullies = 1, base = 0, plain = 10, breach = 0, breachAngle = 0 } = opts;
  const prof0 = (r) => { const c = Math.max(0, 1 - r); return c * c * (0.25 + 0.75 * c); }, pk = 1 / prof0(crater);
  const prof = (r) => prof0(r) * pk, rimH = height;
  const fn = (x, z) => {
    const dx = x - center[0], dz = z - center[1], d = Math.hypot(dx, dz) + 1e-6, ux = dx / d, uz = dz / d;
    const wob = 1 + 0.1 * noise.n2(ux * 1.3 + 4, uz * 1.3) + 0.05 * noise.n2(dx / radius * 3, dz / radius * 3 + 9);
    const r = d / (radius * wob);
    let h = height * prof(r);
    const flank = smoothstep(crater * 0.9, crater * 2.2, r) * (1 - smoothstep(0.55, 1, r));
    const gu = Math.abs(noise.n2(ux * 2.6 + r * 0.5, uz * 2.6 - r * 0.5)) * 0.7 + Math.abs(noise.n2(ux * 6 + 8, uz * 6 + r * 1.2)) * 0.3;
    h -= gullies * height * 0.04 * flank * (1 - gu) * (1 - gu);
    h += noise.fbm2(x * 0.007, z * 0.007, 3, 2, 0.45) * height * 0.03 * (0.3 + smoothstep(0, 0.4, r));
    const br = breach * Math.pow(Math.max(0, ux * Math.cos(breachAngle) + uz * Math.sin(breachAngle)), 3);
    const cap = rimH * (1 + 0.07 * noise.n2(ux * 2.1, uz * 2.1 + 3) - 0.3 * br);
    if (r < crater * 2) {
      h = smin(h, cap, height * 0.06);
      h -= craterDepth * height * (1 - smoothstep(0.15, 1.02, r / crater)) * (1 - 0.5 * br);
    }
    const ground = plain * (noise.fbm2(x * 0.004 + 7, z * 0.004 - 2, 3, 2, 0.42) + 0.3);
    return base + h + ground;
  };
  fn.center = center; fn.rimRadius = crater * radius; fn.rimHeight = base + rimH; fn.craterFloor = base + rimH - craterDepth * height;
  return fn;
}

// Archipelago: land above seaLevel with flat beaches, shelving sea bed below it.
// opts: height 80, scale 420, seaLevel 0, coverage 0.42 (share of land), beach 6 (m, flatness of the shore),
// depth 28 (sea bed), center/radius (optional: beyond radius everything sinks to open sea), offset
export function islands(opts = {}) {
  const noise = noiseOf(opts), { height = 80, scale = 420, seaLevel = 0, coverage = 0.42, beach = 6, depth = 28, center = [0, 0], radius = 0, offset = [0, 0] } = opts;
  const f = 1 / scale, bias = (coverage - 0.5) * 1.5;
  return (x, z) => {
    const px = (x + offset[0]) * f, pz = (z + offset[1]) * f;
    let v = noise.warp2(px, pz, 0.3, 4) * 1.15 + bias;
    if (radius > 0) v -= 1.6 * smoothstep(radius * 0.55, radius, Math.hypot(x - center[0], z - center[1]));
    if (v <= 0) return seaLevel - depth * (1 - Math.exp(v * 3.5));
    const l = height * 1.9 * Math.pow(v, 1.2);
    const peaks = (0.5 + 0.5 * noise.fbm2(px * 3.1 + 5, pz * 3.1 - 3, 3, 2, 0.45)) * l * 0.5 * smoothstep(0.08, 0.45, v);
    const land = l + peaks;
    return seaLevel + land * land / (land + beach);
  };
}

// A river winding down a valley cut into any base height function. The function has .course(z) -> x and .waterLevel.
// opts: base (height fn, default hills), course ((z) => x) or path (then the river runs under the camera path),
// meander 70, wavelength 520, width 16 (channel half-width), valley 150 (half-width at the top), waterLevel 0,
// bed 3.5 (depth of the channel), bank 1.2 (floodplain above the water), terraces 0.5
export function riverValley(opts = {}) {
  const noise = noiseOf(opts), { meander = 70, wavelength = 520, width = 16, valley = 150, waterLevel = 0, bed = 3.5, bank = 1.2, terraces = 0.5, path = null } = opts;
  const base = opts.base || hills({ noise, height: 90, base: waterLevel + 4 });
  const near = path ? pathNearest(path) : null;
  const course = opts.course || ((z) => meander * (noise.n2(z / wavelength, 3.7) + 0.45 * noise.n2(z / wavelength * 2.3 + 9, 1.1)));
  const fn = (x, z) => {
    const d0 = near ? near(x, z).dist : Math.abs(x - course(z));
    const d = d0 * (1 + 0.18 * noise.n2(x * 0.011 + 3, z * 0.011));
    const b = Math.max(base(x, z), waterLevel + bank);
    let t = smoothstep(width * 1.1, valley, d);
    t = Math.pow(t, 1.5);
    if (terraces > 0) { const s = t * 3, i = Math.floor(s), q = s - i; t = lerp(t, (i + smoothstep(0.35, 0.95, q)) / 3, terraces * (1 - t)); }
    const flood = waterLevel + bank + 0.8 * noise.n2(x * 0.02, z * 0.02) * smoothstep(width, width * 3, d);
    let h = lerp(flood, b, t);
    const ch = smoothstep(width * 0.45, width * 1.15, d);
    h = lerp(waterLevel - bed * (0.75 + 0.25 * noise.n2(x * 0.04, z * 0.04)), h, ch);
    return h;
  };
  fn.course = course; fn.waterLevel = waterLevel;
  return fn;
}

// ---------- combinators ----------
// Quantise any height function into benches. opts: step 12 (m), sharp 0.6 (0 ramp .. 0.95 vertical risers), slope 0.15 (bench tilt),
// beds (a makeStrata() result: the ledges then sit on top of its hard beds, at uneven heights, and line up with the
// strata drawn by the terrain material that shares the table).
export function stepper({ step = 12, sharp = 0.6, slope = 0.15, beds = null } = {}) {
  if (!beds) return (h) => { const s = h / step, i = Math.floor(s), q = s - i; return step * (i + lerp(smoothstep(sharp, 1, q), q, slope)); };
  const L = beds.steps, n = L.length, span = beds.span, base = beds.base;
  return (h) => {
    const v = (h - base) / span, w = Math.floor(v), y = (v - w) * span;
    let lo = L[n - 1] - span, hi = L[0];
    for (let k = 0; k < n; k++) { if (y < L[k]) { hi = L[k]; break; } lo = L[k]; hi = k + 1 < n ? L[k + 1] : L[0] + span; }
    const q = (y - lo) / (hi - lo);
    return base + w * span + lo + (hi - lo) * lerp(smoothstep(sharp, 1, q), q, slope);
  };
}
export function terrace(height, opts = {}) { const f = stepper(opts); return (x, z) => f(height(x, z)); }
// Blend two height functions with a mask (x,z) => 0..1 (0 = a, 1 = b).
export function blend(a, b, mask) { return (x, z) => { const m = mask(x, z); return m <= 0 ? a(x, z) : m >= 1 ? b(x, z) : lerp(a(x, z), b(x, z), m); }; }

// Keep the land below the camera path: within `width` of the path the ground is at most path height - clearance,
// rising from there with `slope` and steepening with distance up to `maxSlope` (a U-shaped valley, never a trench).
// opts: clearance 7, width 12, slope 0.55, maxSlope 1.2, steepen 0.012 (how fast the walls reach maxSlope),
//   rough 0.35 (irregularity of the walls: an additive offset of about rough * 30 m), bench 0 (m: cut the walls into
//   benches of this height), smooth 8.
// Under peaks more than ~200 m above the path, widen the valley (width 30-60, slope 0.4) rather than raising maxSlope.
export function withCorridor(height, path, opts = {}) {
  const { clearance = 7, width = 12, slope = 0.55, smooth = 8, steepen = 0.012, rough = 0.35, maxSlope = 1.2, bench = 0 } = opts, wn = opts.noise || null;
  // coarse distance field so far-away points do not pay for the nearest-point search
  let minY = Infinity; const P = [];
  for (let i = 0; i <= 64; i++) { const p = path.pointAt(i / 64); P.push(p.x, p.z); if (p.y < minY) minY = p.y; }
  const coarse = (x, z) => { let b = Infinity; for (let i = 0; i < P.length; i += 2) { const dx = P[i] - x, dz = P[i + 1] - z, d = dx * dx + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
  const slack = path.length / 64 + 2, ra = rough * 30, top = Math.max(slope, maxSlope), L = 0.5 / Math.max(1e-4, steepen);
  const near = pathNearest(path), cut = bench > 0 ? stepper({ step: bench, sharp: 0.5, slope: 0.25 }) : null;
  const fn = (x, z) => {
    const h = height(x, z);
    const lower = minY - clearance - ra * 0.6 + Math.max(0, coarse(x, z) - slack - width) * slope;
    if (h < lower - smooth) return h;
    const n = near(x, z), e = Math.max(0, n.dist - width);
    let wall = slope * e + (top - slope) * (e - L * (1 - Math.exp(-e / L)));
    if (wn && rough) wall += ra * (wn.n2(x * 0.011 + 41, z * 0.011 - 7) + 0.45 * wn.n2(x * 0.037, z * 0.037 + 19) - 0.35) * Math.min(1, e / 30) + rough * 3 * (wn.n2(x * 0.03 + 3, z * 0.03 + 8) - 0.6);
    if (cut) wall = Math.max(0, cut(wall));
    return smin(h, n.y - clearance + Math.max(wall, -2), smooth);
  };
  fn.base = height;
  return fn;
}
