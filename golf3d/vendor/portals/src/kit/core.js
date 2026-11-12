// Core kit: seeded randomness, noise, math helpers and the camera path.
import * as THREE from 'three';

// ---------- seeded RNG ----------
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Returns rng() in [0,1) with helpers attached.
export function makeRng(seed) {
  let a = (typeof seed === 'number' ? seed : hashSeed(seed)) >>> 0;
  const rng = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.range = (lo, hi) => lo + (hi - lo) * rng();
  rng.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * rng());
  rng.pick = (arr) => arr[Math.floor(rng() * arr.length)];
  rng.chance = (p) => rng() < p;
  rng.sign = () => (rng() < 0.5 ? -1 : 1);
  rng.gauss = () => { // approx normal(0,1)
    let u = 0, v = 0; while (u === 0) u = rng(); while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  rng.shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  rng.fork = (label) => makeRng(hashSeed(label + ':' + Math.floor(rng() * 1e9)));
  return rng;
}

// ---------- math ----------
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const saturate = (x) => clamp(x, 0, 1);
export const smoothstep = (a, b, x) => { const t = saturate((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const remap = (x, a, b, c, d) => c + (d - c) * saturate((x - a) / (b - a));
// 0 outside [a,b], rises over `fade` at each end, 1 in the middle
export const bell = (x, a, b, fade = 0.25) => { const w = (b - a) * fade; return smoothstep(a, a + w, x) * (1 - smoothstep(b - w, b, x)); };

// ---------- simplex noise (seeded) ----------
const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6, F3 = 1 / 3, G3 = 1 / 6;
const GRAD3 = new Float32Array([1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1]);

export function makeNoise(seed) {
  const rng = makeRng(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
  const perm = new Uint8Array(512), pm12 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; pm12[i] = perm[i] % 12; }

  function n2(x, y) {
    const s = (x + y) * F2, i = Math.floor(x + s), j = Math.floor(y + s), t = (i + j) * G2;
    const x0 = x - (i - t), y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n = 0, tt = 0.5 - x0 * x0 - y0 * y0, g;
    if (tt > 0) { g = pm12[ii + perm[jj]] * 3; tt *= tt; n += tt * tt * (GRAD3[g] * x0 + GRAD3[g + 1] * y0); }
    tt = 0.5 - x1 * x1 - y1 * y1;
    if (tt > 0) { g = pm12[ii + i1 + perm[jj + j1]] * 3; tt *= tt; n += tt * tt * (GRAD3[g] * x1 + GRAD3[g + 1] * y1); }
    tt = 0.5 - x2 * x2 - y2 * y2;
    if (tt > 0) { g = pm12[ii + 1 + perm[jj + 1]] * 3; tt *= tt; n += tt * tt * (GRAD3[g] * x2 + GRAD3[g + 1] * y2); }
    return 70 * n; // ~[-1,1]
  }

  function n3(x, y, z) {
    const s = (x + y + z) * F3, i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s), t = (i + j + k) * G3;
    const x0 = x - (i - t), y0 = y - (j - t), z0 = z - (k - t);
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 0.5, y3 = y0 - 1 + 0.5, z3 = z0 - 1 + 0.5;
    const ii = i & 255, jj = j & 255, kk = k & 255;
    let n = 0, tt, g;
    tt = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (tt > 0) { g = pm12[ii + perm[jj + perm[kk]]] * 3; tt *= tt; n += tt * tt * (GRAD3[g] * x0 + GRAD3[g + 1] * y0 + GRAD3[g + 2] * z0); }
    tt = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (tt > 0) { g = pm12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3; tt *= tt; n += tt * tt * (GRAD3[g] * x1 + GRAD3[g + 1] * y1 + GRAD3[g + 2] * z1); }
    tt = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (tt > 0) { g = pm12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3; tt *= tt; n += tt * tt * (GRAD3[g] * x2 + GRAD3[g + 1] * y2 + GRAD3[g + 2] * z2); }
    tt = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (tt > 0) { g = pm12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3; tt *= tt; n += tt * tt * (GRAD3[g] * x3 + GRAD3[g + 1] * y3 + GRAD3[g + 2] * z3); }
    return 32 * n; // ~[-1,1]
  }

  // fractal sums; return ~[-1,1]
  function fbm2(x, y, oct = 5, lac = 2, gain = 0.5) {
    let a = 1, f = 1, s = 0, n = 0;
    for (let o = 0; o < oct; o++) { s += a * n2(x * f, y * f); n += a; a *= gain; f *= lac; }
    return s / n;
  }
  function fbm3(x, y, z, oct = 4, lac = 2, gain = 0.5) {
    let a = 1, f = 1, s = 0, n = 0;
    for (let o = 0; o < oct; o++) { s += a * n3(x * f, y * f, z * f); n += a; a *= gain; f *= lac; }
    return s / n;
  }
  // ridged multifractal, returns [0,1] with sharp crests
  function ridged2(x, y, oct = 5, lac = 2.1, gain = 0.5) {
    let a = 0.5, f = 1, s = 0, prev = 1, n = 0;
    for (let o = 0; o < oct; o++) {
      let v = 1 - Math.abs(n2(x * f, y * f)); v *= v;
      s += v * a * prev; n += a; prev = v; a *= gain; f *= lac;
    }
    return s / n;
  }
  // domain-warped fbm, good for organic terrain and clouds
  function warp2(x, y, amt = 0.6, oct = 5) {
    const qx = fbm2(x + 5.2, y + 1.3, 3), qy = fbm2(x - 3.7, y + 8.1, 3);
    return fbm2(x + amt * qx, y + amt * qy, oct);
  }
  return { n2, n3, fbm2, fbm3, ridged2, warp2 };
}

// ---------- camera path ----------
// points: array of [x,y,z] or Vector3, world coordinates. The camera flies from the first
// point (entry) to the last point (the exit portal centre). Keep the first and last
// segments roughly level (not vertical).
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _mt = new THREE.Matrix4();

export function makePath(points, opts = {}) {
  const pts = points.map((p) => (p.isVector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2])));
  const curve = new THREE.CatmullRomCurve3(pts, false, opts.type || 'centripetal', opts.tension ?? 0.5);
  curve.arcLengthDivisions = Math.max(400, pts.length * 60);
  const length = curve.getLength();
  const N = opts.samples || 320;
  const sx = new Float32Array(N + 1), sy = new Float32Array(N + 1), sz = new Float32Array(N + 1);
  for (let i = 0; i <= N; i++) { curve.getPointAt(i / N, _v); sx[i] = _v.x; sy[i] = _v.y; sz[i] = _v.z; }
  const t0 = curve.getTangentAt(0, new THREE.Vector3()), t1 = curve.getTangentAt(1, new THREE.Vector3());
  const p0 = curve.getPointAt(0, new THREE.Vector3()), p1 = curve.getPointAt(1, new THREE.Vector3());

  const path = {
    curve, length, points: pts, start: p0, end: p1, startTangent: t0, endTangent: t1,
    // position at arc-length distance d (extrapolates in a straight line beyond both ends)
    posAtDist(d, out = new THREE.Vector3()) {
      if (d <= 0) return out.copy(p0).addScaledVector(t0, d);
      if (d >= length) return out.copy(p1).addScaledVector(t1, d - length);
      return curve.getPointAt(d / length, out);
    },
    tangentAtDist(d, out = new THREE.Vector3()) {
      if (d <= 0) return out.copy(t0);
      if (d >= length) return out.copy(t1);
      return curve.getTangentAt(d / length, out);
    },
    // u in [0,1] along arc length
    pointAt(u, out = new THREE.Vector3()) { return path.posAtDist(u * length, out); },
    tangentAt(u, out = new THREE.Vector3()) { return path.tangentAtDist(u * length, out); },
    // nearest sample on the path in the XZ plane: { dist, u, y } (y = path height there)
    nearestXZ(x, z) {
      let best = Infinity, bi = 0;
      for (let i = 0; i <= N; i++) { const dx = sx[i] - x, dz = sz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
      return { dist: Math.sqrt(best), u: bi / N, y: sy[bi] };
    },
    // nearest distance in 3D to the path
    distanceTo(x, y, z) {
      let best = Infinity;
      for (let i = 0; i <= N; i++) { const dx = sx[i] - x, dy = sy[i] - y, dz = sz[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; }
      return Math.sqrt(best);
    },
    // true when a sphere at (x,y,z) with this radius stays out of the camera corridor
    isClear(x, y, z, radius = 0, margin = 4) { return path.distanceTo(x, y, z) > radius + margin; },
    // frames at the two ends; -Z of the frame looks along the path. Level (yaw only) unless
    // tilt is set, in which case the frame also pitches with the path (at most 75 degrees)
    frameAt(end, out = new THREE.Matrix4(), tilt = false) {
      const p = end ? p1 : p0, t = end ? t1 : t0;
      const yaw = Math.atan2(-t.x, -t.z);
      out.makeRotationY(yaw);
      if (tilt) out.multiply(_mt.makeRotationX(Math.max(-1.31, Math.min(1.31, Math.asin(Math.max(-1, Math.min(1, t.y)))))));
      return out.setPosition(p);
    },
  };
  return path;
}

export { _v as tmpV, _v2 as tmpV2 };
