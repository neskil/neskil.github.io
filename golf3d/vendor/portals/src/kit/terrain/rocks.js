// Terrain kit, part 4: rocks, stacks, arches, crystals, basalt, cliffs, scattering and instancing.
// Every *Geometry() returns a non-indexed BufferGeometry with position, normal and linear-RGB color.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeNoise } from '../core.js';
import { makeRockMaterial } from './material.js';
import { rngOf } from './textures.js';

const C = (c) => (c && c.isColor ? c : new THREE.Color(c));
const noiseOf = (o) => o.noise || makeNoise(o.rng ? o.rng.int(1, 2147483646) : 3);
const SMALL = (g) => g.attributes.position.count / 3;

// Builds the final geometry from unique vertices + triangle indices. Normals are averaged only across
// faces that meet at less than `crease` radians: 0 = faceted, PI = fully smooth, ~0.7 = chiselled rock.
export function buildCreased(pos, col, idx, crease = 0.7) {
  const nT = idx.length / 3, nV = pos.length / 3, fn = new Float32Array(nT * 3);
  const cnt = new Uint32Array(nV + 1);
  for (let t = 0; t < nT; t++) {
    const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    fn[t * 3] = uy * vz - uz * vy; fn[t * 3 + 1] = uz * vx - ux * vz; fn[t * 3 + 2] = ux * vy - uy * vx;   // area weighted
    cnt[idx[t * 3] + 1]++; cnt[idx[t * 3 + 1] + 1]++; cnt[idx[t * 3 + 2] + 1]++;
  }
  for (let i = 0; i < nV; i++) cnt[i + 1] += cnt[i];
  const fill = new Uint32Array(nV), adj = new Uint32Array(nT * 3);
  for (let t = 0; t < nT; t++) for (let k = 0; k < 3; k++) { const v = idx[t * 3 + k]; adj[cnt[v] + fill[v]++] = t; }
  const P = new Float32Array(nT * 9), N = new Float32Array(nT * 9), K = new Float32Array(nT * 9), cc = Math.cos(crease);
  for (let t = 0; t < nT; t++) {
    const fx = fn[t * 3], fy = fn[t * 3 + 1], fz = fn[t * 3 + 2], fl = Math.hypot(fx, fy, fz) || 1;
    for (let k = 0; k < 3; k++) {
      const v = idx[t * 3 + k], o = t * 9 + k * 3; let nx = 0, ny = 0, nz = 0;
      if (crease <= 0) { nx = fx; ny = fy; nz = fz; }
      else for (let j = cnt[v]; j < cnt[v + 1]; j++) {
        const q = adj[j] * 3, gx = fn[q], gy = fn[q + 1], gz = fn[q + 2], gl = Math.hypot(gx, gy, gz) || 1;
        if ((fx * gx + fy * gy + fz * gz) / (fl * gl) >= cc) { nx += gx; ny += gy; nz += gz; }
      }
      const l = Math.hypot(nx, ny, nz) || 1;
      N[o] = nx / l; N[o + 1] = ny / l; N[o + 2] = nz / l;
      P[o] = pos[v * 3]; P[o + 1] = pos[v * 3 + 1]; P[o + 2] = pos[v * 3 + 2];
      K[o] = col[v * 3]; K[o + 1] = col[v * 3 + 1]; K[o + 2] = col[v * 3 + 2];
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('color', new THREE.BufferAttribute(K, 3));
  g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}

function icosphere(detail) {
  const t = (1 + Math.sqrt(5)) / 2, s = 1 / Math.hypot(1, t);
  let pos = [-1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, 0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1].map((v) => v * s);
  let idx = [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1];
  for (let d = 0; d < detail; d++) {
    const cache = new Map(), out = [];
    const mid = (a, b) => {
      const key = a < b ? a * 65536 + b : b * 65536 + a; let m = cache.get(key); if (m !== undefined) return m;
      const x = pos[a * 3] + pos[b * 3], y = pos[a * 3 + 1] + pos[b * 3 + 1], z = pos[a * 3 + 2] + pos[b * 3 + 2], l = Math.hypot(x, y, z);
      m = pos.length / 3; pos.push(x / l, y / l, z / l); cache.set(key, m); return m;
    };
    for (let i = 0; i < idx.length; i += 3) { const a = idx[i], b = idx[i + 1], c = idx[i + 2], ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); out.push(a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca); }
    idx = out;
  }
  return { pos, idx };
}

const ROCK_KINDS = {
  rock: { cuts: 7, roughness: 0.15, lumps: 0.26, squash: [1, 0.74, 0.9], crease: 0.7, taper: 0 },
  boulder: { cuts: 3, roughness: 0.09, lumps: 0.3, squash: [1, 0.84, 0.96], crease: 1.0, taper: 0 },
  slab: { cuts: 8, roughness: 0.1, lumps: 0.18, squash: [1.35, 0.36, 1], crease: 0.6, taper: 0 },
  shard: { cuts: 9, roughness: 0.12, lumps: 0.2, squash: [0.6, 1.9, 0.55], crease: 0.55, taper: 0.7, cutDepth: [0.5, 0.86] },
  pebble: { cuts: 0, roughness: 0.05, lumps: 0.22, squash: [1, 0.6, 0.85], crease: 3.2, taper: 0, detail: 1 },
};

// Displaced, plane-cut icosphere. Triangles: 20 * 4^detail (detail 1: 80, 2: 320, 3: 1280).
// opts: rng, kind 'rock'|'boulder'|'slab'|'shard'|'pebble', radius 1, detail 2, cuts, cutDepth [0.6,0.92], roughness,
// lumps, squash [x,y,z], taper, crease, color '#7b756c', colorB '#57524b', noise
export function rockGeometry(opts = {}) {
  const o = { ...ROCK_KINDS[opts.kind || 'rock'], ...opts }, rng = rngOf(o), noise = noiseOf(o);
  const { radius = 1, detail = 2, cuts, cutDepth = [0.6, 0.92], roughness, lumps, squash, taper, crease } = o;
  const ca = C(o.color ?? '#7b756c'), cb = C(o.colorB ?? '#57524b');
  const { pos, idx } = icosphere(detail), n = pos.length / 3, col = new Float32Array(n * 3);
  const planes = [];
  for (let i = 0; i < cuts; i++) { let x = rng.gauss(), y = rng.gauss() * 0.8 + 0.25, z = rng.gauss(); const l = Math.hypot(x, y, z) || 1; planes.push(x / l, y / l, z / l, rng.range(cutDepth[0], cutDepth[1])); }
  const ox = rng.range(-40, 40), oy = rng.range(-40, 40), oz = rng.range(-40, 40);
  const sx = squash[0] * rng.range(0.88, 1.12), sy = squash[1] * rng.range(0.88, 1.12), sz = squash[2] * rng.range(0.88, 1.12);
  for (let i = 0; i < n; i++) {
    let x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const l = 1 + lumps * noise.n3(x * 0.9 + ox, y * 0.9 + oy, z * 0.9 + oz); x *= l; y *= l; z *= l;
    let cut = 0;
    for (let k = 0; k < planes.length; k += 4) { const d = x * planes[k] + y * planes[k + 1] + z * planes[k + 2] - planes[k + 3]; if (d > 0) { x -= planes[k] * d * 0.94; y -= planes[k + 1] * d * 0.94; z -= planes[k + 2] * d * 0.94; cut = 1; } }
    const f = noise.fbm3(x * 2.4 + oz, y * 2.4 + ox, z * 2.4 + oy, 3), r = 1 + roughness * f * (cut ? 0.45 : 1); x *= r; y *= r; z *= r;
    if (taper) { const tp = 1 - taper * smoothstep(-0.3, 1.05, y); x *= tp; z *= tp; }
    const v = smoothstep(-0.45, 0.45, noise.fbm3(x * 1.3 + oy, y * 2.2 + oz, z * 1.3 + ox, 2));
    const sh = (0.8 + 0.2 * smoothstep(-0.9, 0.1, y)) * (1 + 0.9 * roughness * f) * (cut ? 1.06 : 0.97) * (0.9 + 0.2 * (l - 1) / (lumps + 1e-6) * 0.5 + 0.1);
    col[i * 3] = lerp(ca.r, cb.r, v) * sh; col[i * 3 + 1] = lerp(ca.g, cb.g, v) * sh; col[i * 3 + 2] = lerp(ca.b, cb.b, v) * sh;
    pos[i * 3] = x * sx * radius; pos[i * 3 + 1] = y * sy * radius; pos[i * 3 + 2] = z * sz * radius;
  }
  return buildCreased(pos, col, idx, crease);
}

const grid = (nu, nv, wrap) => { const idx = [], w = nu + (wrap ? 0 : 1);
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * w + i, b = j * w + (wrap ? (i + 1) % nu : i + 1), c = a + w, d = b + w; idx.push(a, b, d, a, d, c); }
  return idx; };
const put = (arr, i, c, k) => { arr[i * 3] = c.r * k; arr[i * 3 + 1] = c.g * k; arr[i * 3 + 2] = c.b * k; };
const mix3 = (a, b, t, out) => { out.r = lerp(a.r, b.r, t); out.g = lerp(a.g, b.g, t); out.b = lerp(a.b, b.b, t); return out; };


// Sea stack / pillar / hoodoo built from stacked beds: hard beds stand proud, soft beds are undercut and fluted, the
// plan is lobed rather than round. Origin at the base centre, +Y up. Triangles: about segments * (5 * ledges + 6).
// opts: rng, height 44, radius 9, segments 12, ledges 7 (number of beds), undercut 0.22, flute 0.1, lobes 0.26, waist 0.28 (wave-cut
// notch near the base), lean 0.06, roughness 0.2, top 'flat' | 'spire' | 'cap' (hoodoo: a wide caprock on a thin neck), cap 1.3,
// sink 4, crease 0.75, color '#8a7b68' (hard beds), colorB '#6f6254' (soft beds), colorTop '#5d6b3a', wetBase 0.45
export function seaStackGeometry(opts = {}) {
  const rng = rngOf(opts), _c = new THREE.Color();
  const { height = 44, radius = 9, segments = 12, waist = 0.28, lean = 0.06, ledges = 7, roughness = 0.2, top = 'flat', sink = 4, crease = 0.75, wetBase = 0.45, undercut = 0.22, flute = 0.1, lobes = 0.26, cap = 1.3 } = opts;
  const noise = noiseOf(opts), ca = C(opts.color ?? '#8a7b68'), cb = C(opts.colorB ?? '#6f6254'), ct = C(opts.colorTop ?? '#5d6b3a');
  const nb = Math.max(2, Math.round(ledges)), th = []; let sum = 0;
  for (let i = 0; i < nb; i++) { const t = rng.range(0.4, 1) * (rng.chance(0.3) ? 2.2 : 1); th.push(t); sum += t; }
  const taper = (t) => (top === 'spire' ? lerp(1.2, 0.16, Math.pow(t, 1.25)) : lerp(1.18, 0.72, Math.pow(t, 0.8))) * (1 - waist * Math.exp(-Math.pow((t - 0.09) / 0.07, 2)));
  const rings = [{ y: -sink, k: taper(0) * 1.25, hard: 1, bed: 0 }];
  let hard = rng.chance(0.5), y = 0;
  for (let i = 0; i < nb; i++) {
    const h = th[i] / sum * height, last = i === nb - 1, neck = top === 'cap' && i === nb - 2;
    if (last && top !== 'spire') hard = true; if (neck) hard = false;
    let k = hard ? rng.range(0.96, 1.12) : 1 - undercut * rng.range(0.25, 1); if (last && top === 'cap') k = cap; if (neck) k = 1 - undercut * 1.5;
    const t0 = y / height, t1 = (y + h) / height, e = Math.min(h * 0.08, radius * 0.06);
    rings.push({ y: y + e, k: taper(t0) * k, hard, bed: i });
    if (!hard || h > radius) rings.push({ y: y + h * 0.5, k: taper((t0 + t1) / 2) * k * (hard ? 1.02 : 0.9), hard, bed: i });
    rings.push({ y: y + h - e, k: taper(t1) * k * (hard ? 1 : 1.04), hard, bed: i });
    y += h; hard = rng.chance(0.8) ? !hard : hard;
  }
  if (top !== 'spire') rings.push({ y: height + radius * 0.06, k: rings[rings.length - 1].k * 0.72, hard: 1, bed: nb - 1, crown: 1 });
  const nr = rings.length, n = segments * nr + 1, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const o1 = rng.range(0, 90), p2 = rng.range(0, 6.28), p3 = rng.range(0, 6.28), pf = rng.range(0, 6.28), la = rng.range(0, 6.28), nf = rng.int(5, 8);
  const box = [], boz = []; for (let i = 0; i < nb; i++) { box.push(rng.range(-1, 1) * radius * 0.07); boz.push(rng.range(-1, 1) * radius * 0.07); }
  for (let j = 0; j < nr; j++) {
    const R = rings[j], ty = clamp(R.y / height, 0, 1), cx = Math.cos(la) * lean * height * ty * ty + box[R.bed], cz = Math.sin(la) * lean * height * ty * ty + boz[R.bed];
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), k = j * segments + i;
      const f = noise.fbm3(c * 1.3 + o1, R.y / radius * 0.33, s * 1.3, 3), f2 = noise.n3(c * 3.1, R.y / radius * 1.7 + o1, s * 3.1);
      const plan = (1 + lobes * (0.6 * Math.cos(2 * a + p2 + ty * 0.8) + 0.4 * Math.cos(3 * a + p3 - ty * 0.6))) * (1 - flute * (R.hard ? 0.35 : 1) * Math.pow(Math.abs(Math.sin(a * nf * 0.5 + pf)), 0.7));
      const r = radius * R.k * plan * (1 + roughness * (f * 1.1 + f2 * 0.3) * (R.hard ? 0.7 : 1));
      pos[k * 3] = cx + c * r; pos[k * 3 + 1] = R.y + (R.crown ? radius * 0.1 * f2 : 0); pos[k * 3 + 2] = cz + s * r;
      mix3(R.hard ? ca : cb, R.hard ? cb : ca, 0.25 + 0.25 * f, _c);
      if (top === 'flat' && (R.crown || j === nr - 2)) mix3(_c, ct, R.crown ? 1 : 0.55, _c);
      put(col, k, _c, (1 + 0.3 * f) * (R.hard ? 1.04 : 0.9) * (1 - wetBase * (1 - smoothstep(0.02, 0.14, ty + f * 0.03))));
    }
  }
  const tip = n - 1, lr = rings[nr - 1]; pos[tip * 3] = Math.cos(la) * lean * height + box[nb - 1]; pos[tip * 3 + 1] = lr.y + radius * (top === 'spire' ? 0.3 : 0.07); pos[tip * 3 + 2] = Math.sin(la) * lean * height + boz[nb - 1];
  put(col, tip, top === 'flat' ? ct : ca, 1);
  const idx = grid(segments, nr - 1, true), capRow = (nr - 1) * segments;
  for (let t = 0; t < idx.length; t += 3) { const b = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = b; }
  for (let i = 0; i < segments; i++) idx.push(tip, capRow + (i + 1) % segments, capRow + i);
  return buildCreased(pos, col, idx, crease);
}

// Concatenate non-indexed geometries (position, normal, color), each with an optional Matrix4. Disposes nothing.
export function mergeRocks(parts) {
  let n = 0; for (const p of parts) n += (p.g || p).attributes.position.count;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), K = new Float32Array(n * 3), v = new THREE.Vector3(), nm = new THREE.Matrix3(); let o = 0;
  for (const p of parts) {
    const g = p.g || p, m = p.m || null, gp = g.attributes.position.array, gn = g.attributes.normal.array, c = gp.length / 3;
    if (m) nm.getNormalMatrix(m);
    for (let i = 0; i < c; i++) {
      v.fromArray(gp, i * 3); if (m) v.applyMatrix4(m); v.toArray(P, (o + i) * 3);
      v.fromArray(gn, i * 3); if (m) v.applyMatrix3(nm).normalize(); v.toArray(N, (o + i) * 3);
    }
    K.set(g.attributes.color.array, o * 3); o += c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('color', new THREE.BufferAttribute(K, 3));
  g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}

// Natural stone arch standing in the XY plane: fly through it along Z. Origin on the ground under the crown.
// A slab of bedded rock with a hole worn through it: boxy section with chamfered faces, a flat-ish bedded top, legs that
// flare into buttresses, ledges where hard beds stand proud, and rubble at the feet.
// Triangles: (segments + 3) * radial * 2 + rubble * 160. The clear opening is about (span - 0.9*thickness) wide and (height - 0.35*thickness) high.
// opts: rng, span 34, height 24, thickness 5.5, depth 1.35 (z thickness / in-plane thickness), segments 22, radial 10,
//   boxy 0.6 (0 = round hoop .. 1 = square-shouldered fin), ledge 0.16, cuts 6, roughness 0.2, sink 4, asym 0.25, crease 0.7,
//   strata 5 (m per bed), rubble 3 (blocks per foot), color '#a8683e', colorB '#7c4a30'
export function archGeometry(opts = {}) {
  const rng = rngOf(opts), _c = new THREE.Color();
  const { span = 34, height = 24, thickness = 5.5, depth = 1.35, segments = 22, radial = 10, roughness = 0.2, sink = 4, asym = 0.25, crease = 0.7, strata = 5, boxy = 0.6, ledge = 0.16, cuts = 6, rubble = 3 } = opts;
  const noise = noiseOf(opts), ca = C(opts.color ?? '#a8683e'), cb = C(opts.colorB ?? '#7c4a30');
  const o1 = rng.range(0, 90), side = rng.sign(), spow = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);
  const wi = span / 2 - thickness * 0.45, hi = height - thickness * 0.35, wo = span / 2 + thickness * 0.7, ho = height + thickness * 0.7;
  const ex = lerp(1, 0.42, boxy), ey = lerp(1, 0.36, boxy), CUT = [];
  for (let i = 0; i < cuts; i++) CUT.push(rng(), rng.range(0.08, 0.22), rng.range(-1.2, 1.2) + (rng.chance(0.5) ? 0 : Math.PI * 0.5 * rng.sign()), rng.range(0.55, 0.85));
  const rows = segments + 3, n = rows * radial, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let j = 0; j < rows; j++) {
    const foot = j === 0 || j === rows - 1, a = clamp((j - 1) / segments, 0, 1), cp = Math.cos(Math.PI * a), sp = Math.sin(Math.PI * a);
    const ix = -cp * wi, iy = Math.pow(sp, 0.85) * hi;
    const fl = 1 + 0.12 * Math.pow(1 - sp, 2) + (foot ? 0.06 : 0), tilt = 1 + asym * 0.22 * side * -cp;
    const ox = -spow(cp, ex) * wo * fl * (1 + asym * 0.18 * side * -cp), oy = Math.pow(sp, ey) * ho * tilt;
    let rx = ox - ix, ry = oy - iy; const rl = Math.hypot(rx, ry) || 1; rx /= rl; ry /= rl;
    const cx = (ix + ox) / 2, cy = (iy + oy) / 2 - (foot ? sink : 0), halfT = rl / 2 * (1 + 0.14 * noise.n2(a * 3.3 + o1, 2.2));
    const halfD = thickness * depth * 0.5 * (1 + 0.5 * Math.pow(1 - sp, 1.5) + (foot ? 0.15 : 0)) * (1 + 0.18 * noise.n2(a * 2.7 + o1, 5.1));
    for (let i = 0; i < radial; i++) {
      const th = ((i + 0.5) / radial) * Math.PI * 2, k = j * radial + i;
      let u = spow(Math.cos(th), 0.55), v = spow(Math.sin(th), 0.55);
      for (let q = 0; q < CUT.length; q += 4) {      // chamfers: flat faces cut along stretches of the arch
        const w = 1 - Math.abs(a - CUT[q]) / CUT[q + 1]; if (w <= 0) continue;
        const cq = Math.cos(CUT[q + 2]), sq = Math.sin(CUT[q + 2]), d = u * cq + v * sq - CUT[q + 3];
        if (d > 0) { const f = Math.min(1, w * 3) * 0.95; u -= cq * d * f; v -= sq * d * f; }
      }
      const bx = cx + rx * u * halfT, by = cy + ry * u * halfT, bz = v * halfD;
      const bi = Math.floor(by / strata + 0.35 * noise.n2(bx * 0.05 + o1, 3.3)), hb = noise.n2(bi * 7.31 + o1, 1.7);
      const m = 1 + ledge * hb * smoothstep(-0.5, 0.3, u);                                   // hard beds stand proud on the outside
      const f = noise.fbm3(bx * 0.11 + o1, by * 0.16, bz * 0.11, 3), f2 = noise.n3(bx * 0.33, by * 0.5 + o1, bz * 0.33), r = 1 + roughness * (f * 1.1 + f2 * 0.35);
      pos[k * 3] = cx + rx * u * halfT * r * (u > 0 ? m : 1); pos[k * 3 + 1] = cy + ry * u * halfT * r * (u > 0 ? m : 1); pos[k * 3 + 2] = bz * r * m;
      put(col, k, mix3(ca, cb, smoothstep(-0.5, 0.5, hb + 0.4 * f), _c), (1 + 0.35 * f) * (0.76 + 0.24 * smoothstep(-0.8, 0.2, u)) * (0.86 + 0.14 * smoothstep(0, thickness * 0.6, by)));
    }
  }
  const parts = [buildCreased(pos, col, grid(radial, rows - 1, true), crease)], mm = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3();
  for (let s = -1; s <= 1; s += 2) for (let i = 0; i < rubble; i++) {
    const rr = thickness * rng.range(0.22, 0.5), g = rockGeometry({ rng, noise, kind: rng.chance(0.5) ? 'rock' : 'slab', detail: 1, radius: rr, color: ca, colorB: cb });
    pv.set(s * (span / 2 + thickness * rng.range(-0.5, 1.5)), rr * rng.range(0.05, 0.3), rng.sign() * thickness * depth * rng.range(0.35, 1.1));
    mm.compose(pv, q.setFromEuler(e.set(rng.range(-0.3, 0.3), rng.range(0, 6.28), rng.range(-0.3, 0.3))), one); parts.push({ g, m: mm.clone() });
  }
  const out = mergeRocks(parts); for (const p of parts) (p.g || p).dispose();
  return out;
}

// Cliff wall facing +Z with ledges, blocky fractures and a talus foot. Base runs along X, origin at its centre.
// Triangles: segments[0] * (segments[1] + 1) * 2. opts: rng, length 90, height 42, depth 7, segments [36, 14],
// bend 0 (radians; > 0 curves the ends toward +Z), ledges 5, roughness 1, ragged 0.3, taper 0.6 (ends drop),
// crease 0.75, color '#7d766c', colorB '#57514a', colorTop '#55622f', sink 3
export function cliffGeometry(opts = {}) {
  const _c = new THREE.Color();
  const rng = rngOf(opts), { length = 90, height = 42, depth = 7, segments = [36, 14], bend = 0, ledges = 5, roughness = 1, ragged = 0.3, taper = 0.6, crease = 0.75, sink = 3 } = opts;
  const noise = noiseOf(opts), ca = C(opts.color ?? '#7d766c'), cb = C(opts.colorB ?? '#57514a'), ct = C(opts.colorTop ?? '#55622f');
  const nu = segments[0], nv = segments[1] + 1, n = (nu + 1) * (nv + 1), pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const o1 = rng.range(0, 90), cols = Math.max(4, Math.round(length / (height * 0.3)));
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const u = i / nu, lip = j === nv, v = Math.min(1, j / (nv - 1)), k = j * (nu + 1) + i;
    const end = Math.pow(Math.sin(Math.PI * clamp(u, 0, 1)), 0.5);
    const top = height * (1 - ragged * (0.5 + 0.5 * noise.n2(u * 2.7 + o1, 0.3)) - ragged * 0.3 * noise.n2(u * 9 + o1, 4.4)) * lerp(1 - taper, 1, end);
    const y = -sink + (top + sink) * v, lv = (y / height) * ledges + 0.35 * noise.n2(u * 2.2 + o1, 9.1), li = Math.floor(lv), fr = lv - li;
    const blk = noise.n2(Math.round(u * cols + 0.4 * noise.n2(li * 3.3, u * 4)) * 7.31 + o1, li * 3.7);
    const f = noise.fbm3(u * length * 0.07 + o1, y * 0.09, 1.7, 3);
    let z = depth * (0.26 * fr * (0.6 + 0.4 * noise.n2(li * 9.1 + o1, 2.5)) + 0.3 * blk * roughness + 0.3 * f * roughness - 0.55 * v);
    z += depth * 1.1 * Math.pow(1 - smoothstep(0, 0.3, v), 2) + (y < 0 ? -y * 0.6 : 0);
    let yy = y; if (lip) { z -= depth * 1.6; yy += height * 0.02 + depth * 0.15 * f; }
    const th = (u - 0.5) * bend, R = bend ? length / bend : 0;
    const x0 = bend ? R * Math.sin(th) : (u - 0.5) * length, z0 = bend ? R * (1 - Math.cos(th)) : 0;
    pos[k * 3] = x0 - Math.sin(th) * z; pos[k * 3 + 1] = yy; pos[k * 3 + 2] = z0 + Math.cos(th) * z;
    const band = smoothstep(-0.3, 0.3, noise.n2(li * 4.7 + o1, 8.8) + 0.3 * f);
    mix3(ca, cb, band, _c); if (lip || v > 0.985) mix3(_c, ct, lip ? 1 : 0.5, _c);
    put(col, k, _c, (1 + 0.3 * f) * (0.8 + 0.3 * smoothstep(-0.5, 0.6, blk + fr - 0.5)));
  }
  return buildCreased(pos, col, grid(nu, nv, false), crease);
}

// Cluster of faceted crystals growing out of one point. Origin at the base. Triangles: count * sides * 3.
// opts: rng, count 9, height 7, radius 0.8, spread 2.4, sides 6, tilt 0.55, color '#3fb8ff', colorTip '#d8f6ff', colorBase '#10285a'
export function crystalClusterGeometry(opts = {}) {
  const rng = rngOf(opts), { count = 9, height = 7, radius = 0.8, spread = 2.4, sides = 6, tilt = 0.55 } = opts;
  const cm = C(opts.color ?? '#3fb8ff'), ct = C(opts.colorTip ?? '#d8f6ff'), cb = C(opts.colorBase ?? '#10285a');
  const per = sides * 2 + 1, pos = new Float32Array(count * per * 3), col = new Float32Array(count * per * 3), idx = [];
  const q = new THREE.Quaternion(), ax = new THREE.Vector3(), v = new THREE.Vector3();
  for (let n = 0; n < count; n++) {
    const main = n === 0, rr = main ? 0 : spread * Math.sqrt(rng.range(0.08, 1)), an = rng.range(0, Math.PI * 2);
    const h = height * (main ? 1 : rng.range(0.28, 0.78) * (1 - 0.35 * rr / spread)), rad = radius * (0.45 + 0.6 * h / height) * rng.range(0.8, 1.15);
    const ta = main ? rng.range(-0.08, 0.08) : tilt * (0.35 + rr / spread) * rng.range(0.6, 1.25);
    ax.set(-Math.sin(an), 0, Math.cos(an)); q.setFromAxisAngle(ax, -ta);
    const sh = h * rng.range(0.66, 0.86), tx = rad * rng.range(-0.3, 0.3), tz = rad * rng.range(-0.3, 0.3), rot = rng.range(0, 6.28), br = rng.range(0.8, 1.2), base = n * per;
    for (let i = 0; i < sides; i++) {
      const a = rot + (i / sides) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), rj = rng.range(0.88, 1.1);
      v.set(c * rad * 0.8 * rj, -h * 0.18, s * rad * 0.8 * rj).applyQuaternion(q); pos.set([v.x + Math.cos(an) * rr, v.y, v.z + Math.sin(an) * rr], (base + i) * 3); put(col, base + i, cb, br);
      v.set(c * rad * rj, sh + rng.range(-0.04, 0.04) * h, s * rad * rj).applyQuaternion(q); pos.set([v.x + Math.cos(an) * rr, v.y, v.z + Math.sin(an) * rr], (base + sides + i) * 3); put(col, base + sides + i, cm, br);
      const j = (i + 1) % sides;
      idx.push(base + i, base + sides + i, base + sides + j, base + i, base + sides + j, base + j, base + sides + i, base + per - 1, base + sides + j);
    }
    v.set(tx, h, tz).applyQuaternion(q); pos.set([v.x + Math.cos(an) * rr, v.y, v.z + Math.sin(an) * rr], (base + per - 1) * 3); put(col, base + per - 1, ct, br);
  }
  return buildCreased(pos, col, idx, 0);
}

// Field of hexagonal basalt columns (Giant's Causeway, organ-pipe cliffs). Origin at the footprint centre, the tall
// side of a 'cliff' is at -Z. Only visible faces are built: about 8-12 triangles per column.
// opts: rng, width 44, depth 26, columnRadius 1.5, height 20, shape 'cliff'|'mound'|'causeway', heightFn (x,z,u,v)=>h,
// step 0.8, jitter 0.3, sink 2, color '#3d3e44', colorB '#25252a', colorTop '#5c5e5b'
export function basaltGeometry(opts = {}) {
  const rng = rngOf(opts), { width = 44, depth = 26, columnRadius: R = 1.5, height = 20, shape = 'cliff', step = 0.8, jitter = 0.3, sink = 2 } = opts;
  const noise = noiseOf(opts), ca = C(opts.color ?? '#3d3e44'), cb = C(opts.colorB ?? '#25252a'), ct = C(opts.colorTop ?? '#5c5e5b');
  const w = Math.sqrt(3) * R, ni = Math.max(1, Math.round(width / w)), nj = Math.max(1, Math.round(depth / (1.5 * R))), o1 = rng.range(0, 90);
  const fnH = opts.heightFn || ((x, z, u, v) => {
    const nn = 0.5 + 0.5 * noise.n2(x * 0.045 + o1, z * 0.045), r2 = Math.min(1, (u * 2 - 1) ** 2 + (v * 2 - 1) ** 2);
    if (shape === 'mound') return height * Math.pow(1 - r2, 0.7) * (0.6 + 0.4 * nn);
    if (shape === 'causeway') return height * 0.3 * (1 - r2) * (0.3 + 0.7 * nn) + step;
    return height * Math.pow(smoothstep(1.02, 0.1, v + 0.25 * (nn - 0.5)), 1.4) * (0.72 + 0.28 * nn) * Math.pow(Math.sin(Math.PI * clamp(u, 0.02, 0.98)), 0.6);
  });
  const H = new Float32Array(ni * nj), cx = (i, j) => (i + 0.5 * (j & 1) - (ni - 0.5) / 2) * w, cz = (j) => (j - (nj - 1) / 2) * 1.5 * R;
  for (let j = 0; j < nj; j++) for (let i = 0; i < ni; i++) {
    const x = cx(i, j), z = cz(j), h = fnH(x, z, (i + 0.5) / ni, (j + 0.5) / nj);
    H[j * ni + i] = h < step * 0.5 ? -1 : Math.round(h / step) * step + rng.range(-jitter, jitter);
  }
  const hAt = (i, j) => (i < 0 || j < 0 || i >= ni || j >= nj ? -1 : H[j * ni + i]);
  const pos = [], col = [], idx = [];
  const pv = (x, y, z, c, k) => { pos.push(x, y, z); col.push(c.r * k, c.g * k, c.b * k); return pos.length / 3 - 1; };
  for (let j = 0; j < nj; j++) for (let i = 0; i < ni; i++) {
    const h = H[j * ni + i]; if (h < 0) continue;
    const x = cx(i, j), z = cz(j), br = rng.range(0.78, 1.18), odd = j & 1, tiltx = rng.range(-0.06, 0.06) * R, tiltz = rng.range(-0.06, 0.06) * R;
    const nb = [hAt(i + odd, j + 1), hAt(i + odd - 1, j + 1), hAt(i - 1, j), hAt(i + odd - 1, j - 1), hAt(i + odd, j - 1), hAt(i + 1, j)];
    const c0 = pv(x, h + rng.range(-0.08, 0.1) * R, z, ct, br * 1.05), ring = [];
    for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; ring.push(pv(x + Math.cos(a) * R, h + Math.cos(a) * tiltx + Math.sin(a) * tiltz, z + Math.sin(a) * R, ct, br)); }
    for (let k = 0; k < 6; k++) idx.push(c0, ring[(k + 1) % 6], ring[k]);
    for (let k = 0; k < 6; k++) {
      const hn = nb[k]; if (hn >= h - 0.02) continue;
      const yb = hn < 0 ? -sink : hn - 0.3, a0 = Math.PI / 6 + k * Math.PI / 3, a1 = a0 + Math.PI / 3, dk = clamp(1 - (h - yb) / (height * 0.6), 0.35, 1);
      const t0 = pv(x + Math.cos(a0) * R, h + Math.cos(a0) * tiltx + Math.sin(a0) * tiltz, z + Math.sin(a0) * R, ca, br), t1 = pv(x + Math.cos(a1) * R, h + Math.cos(a1) * tiltx + Math.sin(a1) * tiltz, z + Math.sin(a1) * R, ca, br);
      const b0 = pv(x + Math.cos(a0) * R, yb, z + Math.sin(a0) * R, cb, br * dk), b1 = pv(x + Math.cos(a1) * R, yb, z + Math.sin(a1) * R, cb, br * dk);
      idx.push(t0, t1, b1, t0, b1, b0);
    }
  }
  return buildCreased(new Float32Array(pos), new Float32Array(col), idx, 0);
}

// Emissive faceted material for crystalClusterGeometry: vertex colour glows, with a brighter fresnel rim.
// opts: glow 1.4, rim 2.2, pulse 0.2, roughness 0.14, metalness 0. Call material.userData.update(time) each frame to pulse
// (makeRock().update and makeInstances().update do it for you).
export function makeCrystalMaterial(opts = {}) {
  const uniforms = { uCrystal: { value: new THREE.Vector4(opts.glow ?? 1.4, opts.rim ?? 2.2, opts.pulse ?? 0.2, 0) } };
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: opts.roughness ?? 0.14, metalness: opts.metalness ?? 0, color: C(opts.color ?? '#ffffff').clone() });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec4 uCrystal;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { float fr = pow(1. - saturate(dot(normal, normalize(vViewPosition))), 2.5);
          totalEmissiveRadiance += vColor.rgb * (uCrystal.x * (1. + uCrystal.z * sin(uCrystal.w * 1.3 + vViewPosition.z * .05)) + uCrystal.y * fr); }`);
  };
  m.customProgramCacheKey = () => 'kit-terrain-crystal';
  m.userData.uniforms = uniforms; m.userData.update = (time) => { uniforms.uCrystal.value.w = time; };
  return m;
}

const KIND_GEO = { stack: seaStackGeometry, arch: archGeometry, crystal: crystalClusterGeometry, basalt: basaltGeometry, cliff: cliffGeometry };
const BASED = { stack: 1, arch: 1, basalt: 1, cliff: 1 };   // kinds whose origin is at the base

// One rock as a ready mesh. opts: kind ('rock'|'boulder'|'slab'|'shard'|'pebble'|'stack'|'arch'|'crystal'|'basalt'|'cliff'),
// every option of that geometry, terrain (optional makeTerrain() result: the rock shares its textures, beds and baked light),
// and material: a Material, or options for makeRockMaterial / makeCrystalMaterial.
// Returns { object, geometry, material, triangles, update(dt, time), dispose() }.
export function makeRock(opts = {}) {
  const kind = opts.kind || 'rock', rng = rngOf(opts), geometry = (KIND_GEO[kind] || rockGeometry)({ ...opts, rng });
  const m = opts.material, own = !(m && m.isMaterial);
  const material = !own ? m : kind === 'crystal' ? makeCrystalMaterial(m || {})
    : makeRockMaterial({ rng, detailTexture: opts.detailTexture, terrain: opts.terrain, contact: BASED[kind] ? [Math.min(5, (opts.height ?? 30) * 0.14), 0.5, 0] : undefined, ...(m || {}) });
  const object = new THREE.Mesh(geometry, material); object.name = kind;
  return { object, geometry, material, triangles: SMALL(geometry), update(dt, time) { if (material.userData.update) material.userData.update(time); },
    dispose() { geometry.dispose(); if (own) { if (material.userData.dispose) material.userData.dispose(); else material.dispose(); } } };
}

function placementSet(n, mats, P, S, seeds, shades) {
  const set = { count: n, matrices: mats, positions: P, scales: S, seeds, shades,
    list() { const out = []; for (let i = 0; i < n; i++) out.push(new THREE.Matrix4().fromArray(mats, i * 16)); return out; },
    // two placement sets: those for which pred(i, x, y, z, scale) is true, and the rest (e.g. to give far items a cheaper geometry)
    split(pred) {
      const A = [], B = []; for (let i = 0; i < n; i++) (pred(i, P[i * 3], P[i * 3 + 1], P[i * 3 + 2], S[i]) ? A : B).push(i);
      const pick = (I) => { const m = I.length, a = new Float32Array(m * 16), p = new Float32Array(m * 3), s = new Float32Array(m), sd = new Float32Array(m), sh = new Float32Array(m * 2);
        I.forEach((i, k) => { a.set(mats.subarray(i * 16, i * 16 + 16), k * 16); p.set(P.subarray(i * 3, i * 3 + 3), k * 3); s[k] = S[i]; sd[k] = seeds[i]; sh[k * 2] = shades[i * 2]; sh[k * 2 + 1] = shades[i * 2 + 1]; });
        return placementSet(m, a, p, s, sd, sh); };
      return [pick(A), pick(B)];
    } };
  return set;
}

// Scatter placements over terrain. Returns { count, matrices (Float32Array 16/instance), positions (3/instance), scales,
// seeds (0..1 per instance), shades (sun, ao per instance from terrain.shadeAt), list() -> Matrix4[], split(pred) -> [set, set] }.
// opts: rng, count 200, terrain (makeTerrain result: items stand on its rendered mesh) or heightAt/normalAt/bounds [x0,z0,x1,z1],
//   density (x,z,h,ny) => 0..1 acceptance, path + clearance 8 (metres kept free around the camera path, plus the item radius),
//   band [d0,d1] (only this far from the path: concentrates items along the route), radius 1 (bounding radius of the item at scale 1),
//   height 0 (height of the item at scale 1; when set, the whole pillar is kept clear of the path, not only its foot),
//   scale [0.6,1.8], scalePower 2 (>1 favours small), stretch [1,1] (extra Y scale), sink 0.25 (x scaled radius pushed into the ground),
//   footprint 0.8 (sink further by this share of the height difference under the item, so nothing hangs off a slope),
//   align 0.5 (0 upright .. 1 follows the ground normal), tilt 0.15 (random lean, radians), yaw true (random heading),
//   slope [0.55,1] (allowed ground normal.y: default keeps items off cliffs), heights [lo,hi], spacing 0 (minimum gap in units
//   of item radius), attempts 12 (tries per item before giving up)
export function scatter(opts = {}) {
  const rng = rngOf(opts), { count = 200, terrain = null, density = null, path = null, clearance = 8, band = null, radius = 1, height = 0, scale = [0.6, 1.8], scalePower = 2,
    stretch = [1, 1], sink = 0.25, footprint = 0.8, align = 0.5, tilt = 0.15, yaw = true, slope = [0.55, 1], heights = null, spacing = 0, attempts = 12 } = opts;
  const heightAt = opts.heightAt || (terrain ? (terrain.surfaceAt || terrain.heightAt) : () => 0), normalAt = opts.normalAt || (terrain ? (terrain.surfaceNormalAt || terrain.normalAt) : null);
  const tb = terrain ? terrain.bounds : null, b = opts.bounds || (tb ? [tb.minX, tb.minZ, tb.maxX, tb.maxZ] : [-500, -500, 500, 500]);
  const mats = new Float32Array(count * 16), P = new Float32Array(count * 3), S = new Float32Array(count), seeds = new Float32Array(count), shades = new Float32Array(count * 2).fill(1);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), nrm = new THREE.Vector3(), pv = new THREE.Vector3(), sv = new THREE.Vector3(), e = new THREE.Euler();
  const cs = spacing > 0 ? spacing * radius * scale[1] * 2 : 0, hash = new Map(), tp = new THREE.Vector3(), tt = new THREE.Vector3(), sh = {};
  let n = 0;
  for (let a = 0; a < count * attempts && n < count; a++) {
    let x, z;
    if (band && path) {
      const u = rng(), d = lerp(band[0], band[1], Math.pow(rng(), 1.5)) * rng.sign(); path.pointAt(u, tp); path.tangentAt(u, tt);
      const tl = Math.hypot(tt.x, tt.z) || 1; x = tp.x - tt.z / tl * d; z = tp.z + tt.x / tl * d;
      if (x < b[0] || x > b[2] || z < b[1] || z > b[3]) continue;
    } else { x = rng.range(b[0], b[2]); z = rng.range(b[1], b[3]); }
    const s = lerp(scale[0], scale[1], Math.pow(rng(), scalePower)), sy = s * lerp(stretch[0], stretch[1], rng()), r = radius * s; let y = heightAt(x, z);
    if (heights && (y < heights[0] || y > heights[1])) continue;
    if (normalAt) normalAt(x, z, nrm); else nrm.set(0, 1, 0);
    if (nrm.y < slope[0] || nrm.y > slope[1]) continue;
    if (density && rng() > density(x, z, y, nrm.y)) continue;
    if (footprint > 0 && r > 0.4) { const k = r * 0.75; y -= (y - Math.min(y, heightAt(x + k, z), heightAt(x - k, z), heightAt(x, z + k), heightAt(x, z - k))) * footprint; }
    if (path) {
      if (band && path.nearestXZ(x, z).dist < band[0] * 0.9) continue;
      const top = height * sy, need = clearance + r;
      if (path.distanceTo(x, y + r * 0.5, z) < need || (top > r && (path.distanceTo(x, y + top * 0.5, z) < need || path.distanceTo(x, y + top, z) < need))) continue;
    }
    if (cs > 0) {
      const gi = Math.floor(x / cs), gj = Math.floor(z / cs); let ok = true;
      for (let j = gj - 1; j <= gj + 1 && ok; j++) for (let i = gi - 1; i <= gi + 1 && ok; i++) { const L = hash.get(i * 73856093 ^ j * 19349663); if (L) for (let k = 0; k < L.length; k += 3) { if (Math.hypot(L[k] - x, L[k + 1] - z) < (L[k + 2] + r) * spacing) { ok = false; break; } } }
      if (!ok) continue;
      const key = gi * 73856093 ^ gj * 19349663; let L = hash.get(key); if (!L) hash.set(key, L = []); L.push(x, z, r);
    }
    nrm.lerp(up, 1 - align).normalize(); q.setFromUnitVectors(up, nrm);
    e.set(rng.range(-tilt, tilt), yaw ? rng.range(0, Math.PI * 2) : 0, rng.range(-tilt, tilt), 'YXZ'); q.multiply(q2.setFromEuler(e));
    pv.set(x, y - sink * r, z); sv.set(s, sy, s);
    m.compose(pv, q, sv); m.toArray(mats, n * 16);
    if (terrain && terrain.shadeAt) { terrain.shadeAt(x, z, sh); shades[n * 2] = sh.sun; shades[n * 2 + 1] = sh.ao; }
    P[n * 3] = x; P[n * 3 + 1] = pv.y; P[n * 3 + 2] = z; S[n] = s; seeds[n] = rng(); n++;
  }
  return placementSet(n, mats.subarray(0, n * 16), P.subarray(0, n * 3), S.subarray(0, n), seeds.subarray(0, n), shades.subarray(0, n * 2));
}

// InstancedMesh from a geometry, a material and placements (a scatter() result or an array of Matrix4), with
// per-instance colour variation. Returns { object, mesh, meshes, count, triangles, update(dt, time) }.
// opts: brightness 0.22 (+-), tints ['#ffffff', ...] (each instance is tinted between two neighbouring entries),
//   lod (a cheaper geometry of the same rock, e.g. detail 1) + path: instances whose distance from the path exceeds
//   lodRatio (45) x their size use it instead (two draw calls; `object` is then a Group),
//   castShadow false, receiveShadow false, rng (only needed when placements is a Matrix4 array)
// Budget: keep all scattered rock in a world under ~40k triangles; with `lod` a field of 300 rocks costs 30-40k instead of 96k.
export function makeInstances(geometry, material, placements, opts = {}) {
  const { brightness = 0.22, tints = null, rng = null, lod = null, path = null, lodRatio = 45 } = opts;
  const arr = Array.isArray(placements), count = arr ? placements.length : placements.count;
  const tc = tints ? tints.map((t) => C(t)) : null, c = new THREE.Color(), mm = new THREE.Matrix4();
  const groups = [[], []];
  if (lod && path && !arr) {
    if (!geometry.boundingSphere) geometry.computeBoundingSphere(); const rad = geometry.boundingSphere.radius, P = placements.positions;
    for (let i = 0; i < count; i++) groups[path.nearestXZ(P[i * 3], P[i * 3 + 2]).dist > lodRatio * rad * placements.scales[i] ? 1 : 0].push(i);
  } else for (let i = 0; i < count; i++) groups[0].push(i);
  const meshes = []; let triangles = 0;
  for (let gi = 0; gi < 2; gi++) {
    const I = groups[gi], geo = gi ? lod : geometry; if (!I.length && (gi || lod)) continue;
    const mesh = new THREE.InstancedMesh(geo, material, Math.max(1, I.length)); mesh.count = I.length;
    for (let k = 0; k < I.length; k++) {
      const i = I[k]; if (arr) mesh.setMatrixAt(k, placements[i]); else mesh.setMatrixAt(k, mm.fromArray(placements.matrices, i * 16));
      const s = arr ? (rng ? rng() : (i * 0.61803398875) % 1) : placements.seeds[i], s2 = (s * 7.31) % 1;
      if (tc && tc.length > 1) { const f = s * (tc.length - 1), q = Math.min(tc.length - 2, Math.floor(f)); c.copy(tc[q]).lerp(tc[q + 1], f - q); } else if (tc) c.copy(tc[0]); else c.setRGB(1, 1, 1);
      c.multiplyScalar(1 + brightness * (s2 * 2 - 1)); mesh.setColorAt(k, c);
    }
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = !!opts.castShadow; mesh.receiveShadow = !!opts.receiveShadow;
    if (I.length) { mesh.computeBoundingSphere(); mesh.computeBoundingBox(); }
    triangles += I.length * SMALL(geo); meshes.push(mesh);
  }
  let object = meshes[0];
  if (meshes.length > 1) { object = new THREE.Group(); for (const me of meshes) object.add(me); }
  return { object, mesh: meshes[0], meshes, count, triangles, update(dt, time) { if (material.userData.update) material.userData.update(time); } };
}
