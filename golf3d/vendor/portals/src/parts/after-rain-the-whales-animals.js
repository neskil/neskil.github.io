// after-rain-the-whales, THE ANIMALS: every whale and dolphin of the world and what they do to the air
// (wake leaves, soft short trails of mist, soft whale shaped shadows and street images for the city's shaders).
// Our own drawing from public facts on whale anatomy. Built on the kit's vertex builder (Geo); no line brought in.
// update(dt, time, camera): WHERE every animal is on its course follows the lens's place (the film time opts.timeAt
// gives for the lens's place on the route, read by z from the camera's world place); HOW it moves (tail beats,
// sculling, roll, bobbing, leaves) runs on `time`, the world's clock. The moving anchors take (film time, clock).
// opts: path, timeAt, env; and, when the world has them, trees (the city's list
// [x, ground y, z, height, kind]) and arch (its measures); without them the city's typed places stand.
import * as THREE from 'three';
import { Geo } from '../kit/fauna.js';

const mix = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const C3 = (r, g, b) => new THREE.Color(r, g, b);

// Outline rows of each kind: [z/L, dorsal y/L, ventral y/L, half width/L, top exponent, side exponent]. Nose first (+Z).
const PROFILES = {
  humpback: [
    [0.497, 0.010, -0.022, 0.022, 0.6], [0.475, 0.020, -0.050, 0.050, 0.6], [0.44, 0.028, -0.074, 0.068, 0.62],
    [0.39, 0.036, -0.096, 0.082, 0.66], [0.33, 0.047, -0.112, 0.094, 0.72], [0.26, 0.062, -0.122, 0.104, 0.8],
    [0.18, 0.080, -0.126, 0.111, 0.9], [0.10, 0.095, -0.121, 0.113, 0.95], [0.01, 0.105, -0.111, 0.108, 1.0],
    [-0.07, 0.109, -0.097, 0.096, 1.0], [-0.14, 0.113, -0.079, 0.078, 1.05], [-0.21, 0.097, -0.062, 0.058, 1.1],
    [-0.28, 0.081, -0.050, 0.040, 1.15], [-0.35, 0.067, -0.042, 0.026, 1.2], [-0.41, 0.055, -0.037, 0.017, 1.2],
    [-0.45, 0.042, -0.031, 0.013, 1.2], [-0.48, 0.024, -0.017, 0.013, 1.0], [-0.5, 0.008, -0.005, 0.007, 1.0]],
  blue: [
    [0.498, 0.006, -0.012, 0.016, 0.55], [0.48, 0.012, -0.030, 0.036, 0.55], [0.45, 0.018, -0.046, 0.050, 0.55],
    [0.40, 0.025, -0.060, 0.060, 0.6], [0.33, 0.034, -0.071, 0.067, 0.68], [0.25, 0.044, -0.077, 0.071, 0.8],
    [0.15, 0.054, -0.078, 0.072, 0.9], [0.05, 0.060, -0.074, 0.070, 1.0], [-0.05, 0.062, -0.067, 0.064, 1.0],
    [-0.15, 0.060, -0.057, 0.054, 1.05], [-0.25, 0.054, -0.046, 0.041, 1.1], [-0.33, 0.046, -0.037, 0.029, 1.15],
    [-0.40, 0.038, -0.030, 0.019, 1.2], [-0.45, 0.030, -0.024, 0.012, 1.2], [-0.48, 0.018, -0.014, 0.011, 1.0],
    [-0.5, 0.006, -0.004, 0.006, 1.0]],
  sperm: [
    [0.5, 0.046, -0.030, 0.040, 0.5, 0.5], [0.492, 0.074, -0.050, 0.062, 0.45, 0.45], [0.47, 0.088, -0.062, 0.072, 0.42, 0.42],
    [0.42, 0.094, -0.070, 0.077, 0.45, 0.45], [0.34, 0.099, -0.078, 0.081, 0.5, 0.5], [0.26, 0.102, -0.087, 0.086, 0.6, 0.6],
    [0.17, 0.104, -0.095, 0.090, 0.7, 0.7], [0.07, 0.103, -0.097, 0.090, 0.8, 0.8], [-0.03, 0.099, -0.093, 0.084, 0.9],
    [-0.12, 0.094, -0.083, 0.072, 1.0], [-0.2, 0.099, -0.069, 0.058, 1.05], [-0.27, 0.080, -0.056, 0.044, 1.1],
    [-0.34, 0.066, -0.046, 0.031, 1.15], [-0.40, 0.054, -0.039, 0.021, 1.2], [-0.45, 0.041, -0.031, 0.014, 1.2],
    [-0.48, 0.024, -0.017, 0.012, 1.0], [-0.5, 0.008, -0.005, 0.007, 1.0]],
  orca: [
    [0.5, 0.010, -0.016, 0.018, 0.9], [0.48, 0.034, -0.040, 0.044, 0.9], [0.44, 0.058, -0.064, 0.068, 0.9],
    [0.38, 0.078, -0.086, 0.088, 0.95], [0.30, 0.094, -0.104, 0.104, 1.0], [0.20, 0.106, -0.116, 0.114, 1.0],
    [0.10, 0.112, -0.120, 0.118, 1.0], [0.0, 0.112, -0.116, 0.114, 1.0], [-0.10, 0.106, -0.104, 0.102, 1.0],
    [-0.20, 0.094, -0.086, 0.084, 1.05], [-0.29, 0.078, -0.066, 0.062, 1.1], [-0.37, 0.060, -0.048, 0.040, 1.15],
    [-0.43, 0.044, -0.036, 0.024, 1.2], [-0.47, 0.030, -0.024, 0.015, 1.1], [-0.5, 0.010, -0.008, 0.008, 1.0]],
  dolphin: [
    [0.5, 0.004, -0.012, 0.012, 1.0], [0.46, 0.012, -0.024, 0.022, 1.0], [0.425, 0.022, -0.034, 0.030, 1.0],
    [0.405, 0.052, -0.046, 0.046, 0.9], [0.36, 0.074, -0.062, 0.064, 0.95], [0.28, 0.090, -0.082, 0.082, 1.0],
    [0.18, 0.100, -0.096, 0.094, 1.0], [0.06, 0.104, -0.100, 0.098, 1.0], [-0.06, 0.098, -0.092, 0.090, 1.0],
    [-0.18, 0.084, -0.076, 0.072, 1.05], [-0.28, 0.066, -0.058, 0.052, 1.1], [-0.37, 0.048, -0.042, 0.032, 1.15],
    [-0.44, 0.034, -0.030, 0.018, 1.2], [-0.48, 0.022, -0.020, 0.012, 1.1], [-0.5, 0.008, -0.006, 0.006, 1.0]],
};

// one outline row at a fraction f of the control rows (Catmull-Rom over the rows, ends held)
function rowAt(P, f) {
  const n = P.length, x = clamp(f, 0, 1) * (n - 1), i = Math.min(n - 2, Math.floor(x)), t = x - i;
  const a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(n - 1, i + 2)], out = [];
  for (let k = 0; k < 6; k++) {
    const p0 = a[k] ?? 0.88, p1 = b[k] ?? 0.88, p2 = c[k] ?? 0.88, p3 = d[k] ?? 0.88;
    out.push(0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t));
  }
  return out;
}
// the outline at a station zn (linear search over a fine table): [top, bottom, half width]
function outlineAt(P, zn) {
  let lo = 0, hi = 1;
  for (let k = 0; k < 22; k++) { const m = (lo + hi) * 0.5; if (rowAt(P, m)[0] > zn) lo = m; else hi = m; }
  const r = rowAt(P, (lo + hi) * 0.5);
  return [r[1], r[2], r[3]];
}

// Lofts a body. o.yc(zn) height share of the widest point, o.eb belly exponent, o.paint(zn, y, cs, x, c) fills the
// packed colour (r shade, g belly weight, b part), o.push(zn, th) extra radial swell.
function loftBody(g, P, L, nz, sides, o = {}) {
  const c = { r: 1, g: 0, b: 0 }, rows = [], start = g.n, eb = o.eb ?? 0.92;
  for (let i = 0; i < nz; i++) {
    const [zn, top, bot, w, et, ex] = rowAt(P, i / (nz - 1));
    const yc = mix(bot, top, o.yc ? o.yc(zn) : 0.5), row = [];
    for (let j = 0; j < sides; j++) {
      const th = (j / sides) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th), sw = 1 + (o.push ? o.push(zn, th) : 0);
      const x = w * sw * Math.sign(sn) * Math.pow(Math.abs(sn), cs > 0 ? ex : Math.min(0.95, ex + 0.1));
      const y = cs > 0 ? yc + (top - yc) * sw * Math.pow(cs, et) : yc - (yc - bot) * sw * Math.pow(-cs, eb);
      if (o.paint) o.paint(zn, y, cs, x, c);
      row.push(g.v(x * L, y * L, zn * L, c));
    }
    rows.push(row);
  }
  const f = rowAt(P, 0), l = rowAt(P, 1);
  if (o.paint) o.paint(f[0], (f[1] + f[2]) * 0.5, 0, 0, c);
  const nose = g.v(0, (f[1] + f[2]) * 0.5 * L, (f[0] + f[3] * (o.noseOut ?? 0.3)) * L, c);
  if (o.paint) o.paint(l[0], (l[1] + l[2]) * 0.5, 0, 0, c);
  const tail = g.v(0, (l[1] + l[2]) * 0.5 * L, (l[0] - l[3]) * L, c);
  for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; g.tri(rows[0][j], nose, rows[0][j1]); g.tri(tail, rows[nz - 1][j], rows[nz - 1][j1]); }
  for (let i = 0; i < nz - 1; i++) for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; g.quad(rows[i + 1][j], rows[i][j], rows[i][j1], rows[i + 1][j1]); }
  return [start, g.n];
}

// A foil (flipper, fluke lobe, fin): stations from root to tip, each { c, ch (unit, to the leading edge), th (unit,
// across the blade), chord, thick, k (0 root .. 1 tip) }; a lens section of m points; the tip closes on a point.
function foil(g, st, m, col, tipOut = 0.5) {
  const start = g.n, rows = [], c = { r: 1, g: 0, b: 0 };
  for (const s of st) {
    const row = [];
    for (let j = 0; j < m; j++) {
      const a = (j / m) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const u = ca * s.chord * 0.5 + (s.shift || 0), t = sa * s.thick * 0.5 * (0.7 + 0.3 * ca);
      col(s.k, ca, sa, c);
      row.push(g.v(s.c.x + s.ch.x * u + s.th.x * t, s.c.y + s.ch.y * u + s.th.y * t, s.c.z + s.ch.z * u + s.th.z * t, c));
    }
    rows.push(row);
  }
  const n = st.length, l = st[n - 1], p = st[n - 2];
  col(1, 0, 0, c);
  const tip = g.v(l.c.x + (l.c.x - p.c.x) * tipOut, l.c.y + (l.c.y - p.c.y) * tipOut, l.c.z + (l.c.z - p.c.z) * tipOut, c);
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < m; j++) { const j1 = (j + 1) % m; g.quad(rows[i][j], rows[i + 1][j], rows[i + 1][j1], rows[i][j1]); }
  for (let j = 0; j < m; j++) g.tri(rows[n - 1][j], tip, rows[n - 1][(j + 1) % m]);
  return [start, g.n];
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// a pair of flukes: o { z0 (hinge z/L), y0, span/L, lead/L (leading edge run), sweep/L, chord/L root chord, notch/L,
// rag (ragged trailing edge), n, m }. Marks vertices kind 2 with the fluke weight; pivot at the hinge.
function flukes(g, L, o, rngv) {
  const st = [], n = o.n || 12, hz = o.z0 * L, hy = o.y0 * L;
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = (0.004 + t * o.span) * L;
    const le = hz + (o.lead - o.sweep * Math.pow(t, o.pw || 1.25)) * L;
    let te = hz - (o.chord - o.lead) * L - o.back * L * Math.sin(Math.min(1, t * 1.12) * Math.PI * 0.5) + o.notch * L * Math.exp(-t * 9);
    if (o.rag) te += o.rag * L * (rngv[i % rngv.length] - 0.5) * (0.4 + t);
    const chord = Math.max(0.006 * L, (le - te) * (1 - 0.82 * Math.pow(t, 3)));
    st.push({ c: V(x, hy + 0.004 * L * (1 - t), le - chord * 0.5), ch: V(0, 0, 1), th: V(0, 1, 0), chord, thick: Math.max(0.0035 * L, 0.02 * L * (1 - t * 0.85) * Math.min(1, chord / (0.05 * L))), k: t });
  }
  const r = foil(g, st, o.m || 8, (k, ca, sa, c) => { c.r = 0.82 + 0.18 * sa; c.g = sa < 0 ? 1 : 0; c.b = 0.4; }, 0.35);
  g.anim(r, (x, y, z) => [Math.min(1, Math.abs(x) / (o.span * L)), 0, 2, Math.max(0, (hz + o.lead * L - z) / L)]);
  g.pivot(r, 0, hy, hz + o.lead * L);
  const r2 = g.mirror(r, 0);
  return [r[0], r2[1]];
}

// a pair of flippers: root [x,y,z]/L, droop and sweep in degrees, len/L, chord/L, knobs (bumps on the leading edge)
function flippers(g, L, o) {
  const dr = o.droop * Math.PI / 180, sw = o.sweep * Math.PI / 180, PL = o.len * L, n = o.n || 14;
  const d = V(Math.cos(dr) * Math.cos(sw), -Math.sin(dr), -Math.cos(dr) * Math.sin(sw));
  const ch = V(0, 0, 1); ch.addScaledVector(d, -ch.dot(d)).normalize();
  const th = new THREE.Vector3().crossVectors(d, ch).normalize();
  const root = V(o.root[0] * L, o.root[1] * L, o.root[2] * L), st = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, shape = o.shape ? o.shape(t) : (0.6 + 0.4 * Math.sin(Math.min(1, t * 1.1 + 0.12) * Math.PI)) * (1 - 0.6 * t * t * t);
    const kn = o.knobs ? 1 + 0.16 * Math.pow(Math.abs(Math.sin(t * Math.PI * o.knobs + 0.5)), 1.5) * (0.5 + t) : 1;
    const chord = o.chord * L * shape, q = root.clone().addScaledVector(d, (t - 0.06) * PL).addScaledVector(ch, -t * t * (o.rake ?? 0.035) * L);
    st.push({ c: q, ch, th, chord: chord * (0.5 + 0.5 * kn), shift: chord * 0.25 * (kn - 1), thick: Math.max(0.004 * L, o.thick * L * shape * (1 - 0.6 * t)), k: t });
  }
  const r = foil(g, st, o.m || 10, (k, ca, sa, c) => { c.r = 0.84 + 0.16 * sa; c.g = sa < 0 ? 1 : (o.white ?? 0); c.b = 0.2; }, 0.3);
  const q = new THREE.Vector3();
  g.anim(r, (x, y, z) => [clamp(q.set(x, y, z).sub(root).dot(d) / PL, 0, 1), 1, 1, 0]);
  g.pivot(r, root.x, root.y, root.z);
  const r2 = g.mirror(r);
  return [r[0], r2[1]];
}

// a dorsal fin on the back: z/L of its middle, height/L, base/L, rake (how far the tip trails)/L, hook 0..1
function dorsal(g, P, L, o) {
  const st = [], n = o.n || 6, yb = outlineAt(P, o.z)[0] * L - 0.004 * L;
  for (let i = 0; i <= n; i++) {
    const t = i / n, chord = o.base * L * Math.pow(1 - t, o.taper ?? 0.8) * (1 - 0.25 * t) + 0.004 * L;
    const back = o.rake * L * Math.pow(t, 1.5) + o.hook * o.base * L * t * t * 0.6;
    st.push({ c: V(0, yb + t * o.h * L, o.z * L - back + (o.base * L - chord) * 0.5 * (o.lean ?? 0.6)), ch: V(0, 0, 1), th: V(1, 0, 0), chord, thick: Math.max(0.003 * L, o.thick * L * (1 - 0.8 * t)), k: t });
  }
  const r = foil(g, st, 8, (k, ca, sa, c) => { c.r = 0.9; c.g = 0; c.b = 0.6; }, 0.25);
  g.anim(r, (x, y, z) => [clamp((y - yb) / (o.h * L), 0, 1), 0, 3, 0]);
  g.pivot(r, 0, yb, o.z * L);
  return r;
}

// a point of the lofted skin at station zn and angle th from the top (the loft's own rule), in metres
function skinPoint(P, L, zn, th, ycf = 0.5, eb = 0.92) {
  let lo = 0, hi = 1;
  for (let k = 0; k < 22; k++) { const m = (lo + hi) * 0.5; if (rowAt(P, m)[0] > zn) lo = m; else hi = m; }
  const [, top, bot, w, et, ex] = rowAt(P, (lo + hi) * 0.5), yc = mix(bot, top, ycf), cs = Math.cos(th), sn = Math.sin(th);
  const x = w * Math.sign(sn) * Math.pow(Math.abs(sn), cs > 0 ? ex : Math.min(0.95, ex + 0.1));
  const y = cs > 0 ? yc + (top - yc) * Math.pow(cs, et) : yc - (yc - bot) * Math.pow(-cs, eb);
  return [x * L, y * L, zn * L];
}
// a low knob sitting on the skin (tubercle, knuckle, barnacle): packed colour part 0.8, belly weight `pale`
function knob(g, p, r, pale = 0, shade = 0.86, flat = 0.75) {
  const rg = g.blob(p[0], p[1], p[2], r, r * flat, r * 1.15, C3(shade, pale, 0.8), null, 5, 3);
  g.anim(rg, () => [0, 0, 0, 0]);
  return rg;
}
function eyes(g, P, L, zn, th, r, ycf) {
  const p = skinPoint(P, L, zn, th, ycf);
  for (const sx of [-1, 1]) { const e = g.blob(sx * (p[0] - r * 0.25), p[1], p[2], r * 0.55, r, r * 1.25, C3(0.5, 0, 1), null, 6, 4); g.anim(e, () => [0, 0, 0, 0]); }
  return [p[0] / L, p[1] / L, p[2] / L];
}

function humpbackGeo(rng) {
  const g = new Geo(), L = 14, P = PROFILES.humpback, ycf = (zn) => (zn > 0.2 ? 0.52 : 0.46);
  const line = (zn) => -0.056 + 0.036 * sstep(0.1, -0.35, zn) - 0.012 * sstep(0.3, 0.5, zn);
  loftBody(g, P, L, 56, 32, { yc: ycf, paint: (zn, y, cs, x, c) => { c.r = 0.84 + 0.16 * Math.max(0, cs); c.g = sstep(line(zn) + 0.03, line(zn) - 0.03, y); c.b = 0; } });
  g.anim([0, g.n], () => [0, 0, 0, 0]);
  // tubercles: a middle row and two rows each side on the rostrum, a row along each lip, a cluster on the chin
  const kr = 0.0068 * L;
  for (let i = 0; i < 8; i++) {
    const zn = 0.478 - i * 0.026 - rng() * 0.004;
    knob(g, skinPoint(P, L, zn, 0, ycf(zn)), kr * (0.85 + 0.3 * rng()));
    if (i > 0) for (const s of [-1, 1]) {
      knob(g, skinPoint(P, L, zn + 0.012, s * (0.55 + 0.1 * rng()), ycf(zn)), kr * (0.8 + 0.3 * rng()));
      if (i > 1 && i < 7) knob(g, skinPoint(P, L, zn - 0.004, s * (1.02 + 0.08 * rng()), ycf(zn)), kr * (0.7 + 0.3 * rng()));
    }
  }
  for (let i = 0; i < 7; i++) {
    const zn = 0.482 - i * 0.03 - rng() * 0.005;
    for (const s of [-1, 1]) knob(g, skinPoint(P, L, zn, s * (1.72 + 0.1 * rng()), ycf(zn)), kr * (0.9 + 0.3 * rng()), 0.14);
  }
  for (let i = 0; i < 5; i++) knob(g, skinPoint(P, L, 0.47 - rng() * 0.05, (rng() - 0.5) * 0.9 + Math.PI, ycf(0.45)), kr * (0.9 + 0.5 * rng()), 0.8);
  // the raised guard and the two blowholes behind the head's flat top
  knob(g, skinPoint(P, L, 0.315, 0, ycf(0.315)), 0.02 * L, 0, 0.92, 0.5);
  for (const s of [-1, 1]) knob(g, skinPoint(P, L, 0.292, s * 0.12, ycf(0.29)), 0.011 * L, 0, 0.5, 0.45);
  // the small fin on its hump, knuckles down the tail stock
  dorsal(g, P, L, { z: -0.168, h: 0.03, base: 0.085, rake: 0.03, hook: 0.5, thick: 0.012, n: 5 });
  for (let i = 0; i < 7; i++) { const zn = -0.245 - i * 0.03; knob(g, skinPoint(P, L, zn, 0, 0.5), (0.0085 - i * 0.0007) * L, 0, 0.9, 0.6); }
  // barnacle patches: pale clumps on the chin, the throat and behind the fin
  for (let i = 0; i < 14; i++) {
    const zn = i < 9 ? 0.2 + rng() * 0.27 : -0.1 - rng() * 0.2, th = i < 9 ? Math.PI + (rng() - 0.5) * 1.6 : (rng() - 0.5) * 1.2;
    const p = skinPoint(P, L, zn, th, ycf(zn));
    for (let k = 0; k < 2; k++) knob(g, [p[0] + (rng() - 0.5) * 0.25, p[1] + (rng() - 0.5) * 0.12, p[2] + (rng() - 0.5) * 0.3], (0.0035 + 0.003 * rng()) * L, 1, 1, 0.9);
  }
  const rag = []; for (let i = 0; i < 16; i++) rag.push(rng());
  flukes(g, L, { z0: -0.462, y0: 0.008, span: 0.168, lead: 0.07, sweep: 0.19, chord: 0.128, back: 0.085, notch: 0.034, rag: 0.014, n: 13, m: 8 }, rag);
  const fw = outlineAt(P, 0.2)[2];
  flippers(g, L, { root: [fw * 0.84, -0.086, 0.2], droop: 36, sweep: 30, len: 0.315, chord: 0.094, thick: 0.024, knobs: 5, white: 0.66, n: 16, m: 10 });
  const eye = eyes(g, P, L, 0.262, 1.62, 0.0078 * L, ycf(0.262));
  return { geo: g.build(), L, eye, tris: g.triangles, rb: 0.115, fl: 0.168, fp: 0.27, pz: 0.2 };
}

function blueGeo(rng) {
  const g = new Geo(), L = 26, P = PROFILES.blue, ycf = (zn) => (zn > 0.2 ? 0.55 : 0.48);
  const line = (zn) => -0.045 + 0.03 * sstep(0.1, -0.4, zn);
  loftBody(g, P, L, 68, 34, { yc: ycf, paint: (zn, y, cs, x, c) => { c.r = 0.85 + 0.15 * Math.max(0, cs); c.g = sstep(line(zn) + 0.03, line(zn) - 0.03, y) * 0.55; c.b = 0; } });
  g.anim([0, g.n], () => [0, 0, 0, 0]);
  // the single ridge down the flat head to the blowholes, and the raised guard before them
  for (let i = 0; i < 9; i++) { const zn = 0.47 - i * 0.022; knob(g, skinPoint(P, L, zn, 0, ycf(zn)), (0.0035 + 0.0012 * i) * L, 0, 0.92, 0.55); }
  dorsal(g, P, L, { z: -0.262, h: 0.013, base: 0.03, rake: 0.016, hook: 0.7, thick: 0.006, n: 4 });
  flukes(g, L, { z0: -0.468, y0: 0.006, span: 0.118, lead: 0.045, sweep: 0.105, chord: 0.085, back: 0.03, notch: 0.016, n: 11, m: 8 }, [0.5]);
  const fw = outlineAt(P, 0.24)[2];
  flippers(g, L, { root: [fw * 0.86, -0.058, 0.24], droop: 30, sweep: 48, len: 0.135, chord: 0.036, thick: 0.01, white: 0, n: 10, m: 8,
    shape: (t) => (0.75 + 0.25 * Math.sin(Math.min(1, t * 1.2 + 0.1) * Math.PI)) * (1 - 0.75 * t * t * t) });
  const eye = eyes(g, P, L, 0.298, 1.68, 0.0038 * L, ycf(0.3));
  return { geo: g.build(), L, eye, tris: g.triangles, rb: 0.072, fl: 0.118, fp: 0.1, pz: 0.24 };
}

function spermGeo(rng) {
  const g = new Geo(), L = 14, P = PROFILES.sperm, ycf = (zn) => (zn > 0.15 ? 0.5 : 0.5);
  loftBody(g, P, L, 54, 30, { yc: ycf, eb: 0.75, noseOut: 0.12, paint: (zn, y, cs, x, c) => { c.r = 0.84 + 0.16 * Math.max(0, cs); c.g = sstep(-0.05, -0.1, y) * sstep(-0.1, 0.2, zn) * 0.35; c.b = 0; } });
  g.anim([0, g.n], () => [0, 0, 0, 0]);
  // the narrow lower jaw, slung under the head and a little open, pale
  const jaw = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8, zn = 0.455 - t * 0.27, bot = outlineAt(P, zn)[1]; jaw.push({ z: zn * L, y: (bot - 0.004 - 0.02 * (1 - t) * (1 - t)) * L, rx: i === 0 ? 0 : (0.009 + 0.02 * t) * L, ry: i === 0 ? 0 : (0.008 + 0.01 * t) * L }); }
  const jr = g.loft(jaw, { sides: 8, top: C3(0.9, 1, 0), belly: C3(0.8, 1, 0) });
  g.anim(jr, () => [0, 0, 0, 0]);
  // knuckles behind the hump
  for (let i = 0; i < 6; i++) { const zn = -0.25 - i * 0.032; knob(g, skinPoint(P, L, zn, 0, 0.5), (0.009 - i * 0.0009) * L, 0, 0.9, 0.6); }
  flukes(g, L, { z0: -0.462, y0: 0.006, span: 0.15, lead: 0.055, sweep: 0.125, chord: 0.108, back: 0.012, notch: 0.03, pw: 1.05, n: 10, m: 8 }, [0.5]);
  const fw = outlineAt(P, 0.13)[2];
  flippers(g, L, { root: [fw * 0.9, -0.07, 0.13], droop: 42, sweep: 38, len: 0.1, chord: 0.056, thick: 0.014, white: 0, n: 8, m: 8,
    shape: (t) => (0.7 + 0.3 * Math.sin(Math.min(1, t * 1.2 + 0.15) * Math.PI)) * (1 - 0.5 * t * t * t) });
  const eye = eyes(g, P, L, 0.185, 1.95, 0.0055 * L, 0.5);
  return { geo: g.build(), L, eye, tris: g.triangles, rb: 0.1, fl: 0.15, fp: 0.09, pz: 0.13 };
}

function orcaGeo(rng) {
  const g = new Geo(), L = 6.5, P = PROFILES.orca;
  loftBody(g, P, L, 36, 24, { paint: (zn, y, cs, x, c) => { c.r = 0.85 + 0.15 * Math.max(0, cs); c.g = 0; c.b = 0; } });
  g.anim([0, g.n], () => [0, 0, 0, 0]);
  dorsal(g, P, L, { z: 0.04, h: 0.15, base: 0.135, rake: 0.075, hook: 0.55, thick: 0.02, n: 8, taper: 0.9 });
  flukes(g, L, { z0: -0.465, y0: 0.006, span: 0.145, lead: 0.06, sweep: 0.13, chord: 0.108, back: 0.04, notch: 0.022, n: 8, m: 8 }, [0.5]);
  const fw = outlineAt(P, 0.2)[2];
  flippers(g, L, { root: [fw * 0.85, -0.085, 0.2], droop: 40, sweep: 32, len: 0.17, chord: 0.092, thick: 0.02, white: 0, n: 8, m: 8, rake: 0.01,
    shape: (t) => Math.pow(Math.sin(Math.min(1, t * 0.9 + 0.12) * Math.PI), 0.6) * (1 - 0.25 * t * t) });
  const eye = eyes(g, P, L, 0.4, 1.78, 0.007 * L, 0.5);
  return { geo: g.build(), L, eye, tris: g.triangles, rb: 0.118, fl: 0.145, fp: 0.15, pz: 0.2 };
}

function dolphinGeo(rng) {
  const g = new Geo(), L = 2.7, P = PROFILES.dolphin;
  const line = (zn) => -0.03 + 0.02 * sstep(0.2, -0.4, zn);
  loftBody(g, P, L, 26, 14, { paint: (zn, y, cs, x, c) => { c.r = 0.84 + 0.16 * Math.max(0, cs); c.g = sstep(line(zn) + 0.035, line(zn) - 0.035, y); c.b = 0; } });
  g.anim([0, g.n], () => [0, 0, 0, 0]);
  dorsal(g, P, L, { z: 0.03, h: 0.105, base: 0.125, rake: 0.075, hook: 0.9, thick: 0.014, n: 5, taper: 0.85 });
  flukes(g, L, { z0: -0.465, y0: 0.004, span: 0.12, lead: 0.05, sweep: 0.11, chord: 0.088, back: 0.03, notch: 0.02, n: 5, m: 6 }, [0.5]);
  const fw = outlineAt(P, 0.23)[2];
  flippers(g, L, { root: [fw * 0.85, -0.062, 0.23], droop: 42, sweep: 40, len: 0.155, chord: 0.055, thick: 0.012, white: 0, n: 5, m: 6 });
  const eye = eyes(g, P, L, 0.385, 1.7, 0.007 * L, 0.5);
  return { geo: g.build(), L, eye, tris: g.triangles, rb: 0.1, fl: 0.12, fp: 0.13, pz: 0.23 };
}

// ---------- the swimmers' shaders ----------
// Per body, written by update(): uPos (place of the middle, beat phase), uRot (yaw, pitch, roll, sideways bend per m),
// uMisc (haze fade, swim strength, flipper phase, size).
const VERT = /* glsl */`
uniform vec4 uPos[NB]; uniform vec4 uRot[NB]; uniform vec4 uMisc[NB];
uniform float uLen, uFlk, uFinTall; uniform vec4 uSwim, uFin;
attribute vec4 aAnim; attribute vec3 aPivot; attribute vec4 iA;
varying vec3 vLocal, vWorld, vN, vCol; varying vec4 vInst;
vec2 rot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
vec3 place(vec3 v, vec4 R){
  v.xy = rot(v.xy, R.z);
  float c = cos(R.y), s = sin(R.y); v = vec3(v.x, v.y * c + v.z * s, -v.y * s + v.z * c);
  c = cos(R.x); s = sin(R.x); return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c);
}
void main(){
  int id = int(iA.x + .5);
  vec4 P = uPos[id], R = uRot[id], M = uMisc[id];
  vec3 p = position, n = normal;
  vLocal = position / uLen; vCol = color; vInst = vec4(iA.y, iA.z, M.x, iA.w);
  float kind = aAnim.z;
  // a tall fin for the male (variant 1)
  if(kind > 2.5){ float tall = iA.z * uFinTall; p.y = aPivot.y + (p.y - aPivot.y) * (1. + tall); p.z += aAnim.x * tall * .035 * uLen; }
  // flippers scull about their roots: a slow flap about the long axis with the tip trailing, and a slower sweep
  if(kind > .5 && kind < 1.5){
    vec3 d = p - aPivot; float k = aAnim.x, side = aAnim.y, ft = M.z + side * .7;
    float ang = (uFin.y + uFin.x * sin(ft - k * uFin.z)) * side;
    d.xy = rot(d.xy, ang); n.xy = rot(n.xy, ang);
    float sw = uFin.w * sin(ft * .5 + 1.3 - k * .8) * side;
    d.xz = rot(d.xz, sw); n.xz = rot(n.xz, sw);
    p = aPivot + d;
  }
  // the body's wave travels from the shoulders to the flukes and grows on the way
  float amp = uSwim.y * uLen * M.y, kz = uSwim.z;
  if(kind > 1.5 && kind < 2.5){
    float hz = aPivot.z / uLen, wh = clamp(uSwim.w - hz, 0., 1.2), ah = hz * kz + P.w;
    float slope = amp * (wh * wh * kz * cos(ah) - 2. * wh * sin(ah)) / uLen;
    float fa = -atan(slope) + uFlk * M.y * sin(ah - 1.1);
    vec3 d = p - aPivot; d.yz = rot(d.yz, fa); n.yz = rot(n.yz, fa);
    d.y += aAnim.x * aAnim.x * uLen * .03 * M.y * sin(ah - 1.9);
    p = aPivot + d; p.y += amp * wh * wh * sin(ah);
  } else {
    float zn = p.z / uLen, w = clamp(uSwim.w - zn, 0., 1.2), a = zn * kz + P.w;
    float slope = amp * (w * w * kz * cos(a) - 2. * w * sin(a)) / uLen;
    p.y += amp * w * w * sin(a);
    n = normalize(vec3(n.x, n.y - slope * n.z, n.z + slope * n.y));
  }
  // a small counter nod of the head, and the sideways bend of a turning body
  p.y += amp * .1 * sin(P.w - 1.2) * (.3 + p.z / uLen);
  p.x += .5 * R.w * p.z * p.z;
  p *= M.w;
  vec3 w3 = P.xyz + place(p, R);
  vWorld = w3; vN = place(n, R);
  gl_Position = projectionMatrix * viewMatrix * vec4(w3, 1.);
}
`;

const FRAG_HEAD = /* glsl */`
uniform vec3 uSun, uSunCol, uSkyCol, uGroundCol, uFogCol, uTop, uBel, uEye;
uniform vec2 uFog; uniform float uLen, uWet, uRare, uTime; uniform vec4 uBlk[8];
varying vec3 vLocal, vWorld, vN, vCol; varying vec4 vInst;
float h3(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1., 0., 0.)), f.x), mix(h3(i + vec3(0., 1., 0.)), h3(i + vec3(1., 1., 0.)), f.x), f.y),
             mix(mix(h3(i + vec3(0., 0., 1.)), h3(i + vec3(1., 0., 1.)), f.x), mix(h3(i + vec3(0., 1., 1.)), h3(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
float fbm(vec3 p){ return .5 * vn(p) + .25 * vn(p * 2.03 + 7.) + .125 * vn(p * 4.1 + 13.) + .0625 * vn(p * 8.2 + 21.); }
// the low sun reaches a place only through the gaps between the towers of the sun's side (by place, from the plan)
float sunAt(vec3 wp){
  float lit = 1., sx = abs(uSun.x) < .02 ? .02 : uSun.x;
  for(int i = 0; i < 8; i++){
    vec4 b = uBlk[i]; float t = (b.z - wp.x) / sx, zh = wp.z + uSun.z * t, yh = wp.y + uSun.y * t;
    float occ = smoothstep(b.x - 3., b.x + 3., zh) * (1. - smoothstep(b.y - 3., b.y + 3., zh)) * (1. - smoothstep(b.w - 6., b.w + 2., yh));
    lit *= 1. - occ * step(0., t);
  }
  return lit;
}
// thin pale scratches running mostly along the body
float scars(vec3 q, float dens){
  float a = vn(vec3(q.x * 260., q.y * 260. + q.z * 40., q.z * 11.)), b = vn(vec3(q.x * 30. + q.z * 190., q.y * 200., q.z * 17.) + 9.);
  return (smoothstep(1. - dens, 1. - dens * .5, a) + smoothstep(1. - dens * .6, 1. - dens * .3, b)) * .6;
}
`;

const SKIN = {};
// humpback: slate black above, a ragged white throat and belly with long pleats, white knobbed flippers,
// fluke undersides with each animal's own black and white, scars and barnacle marks
SKIN.humpback = /* glsl */`
vec3 skin(vec3 q, float part, out float h){
  vec3 qs = q + vInst.x * 17.3; h = 0.;
  float n1 = fbm(qs * vec3(30., 30., 16.)), n2 = vn(qs * vec3(150., 150., 44.) + 5.), n3 = vn(qs * vec3(9., 9., 5.) + 2.);
  float fw = clamp(length(fwidth(q)) * 60., 0., 1.);
  vec3 top = uTop * (.7 + .6 * n1), bel = uBel * (.84 + .2 * n1), c;
  top *= .8 + .45 * n3;
  float rv = vn(qs * vec3(120., 120., 52.) + 4.), rings = smoothstep(.84, .89, rv) * (1. - .8 * smoothstep(.92, .96, rv));
  top = mix(top, uBel * .62, clamp(scars(qs, .07) * (1. - fw) + smoothstep(.84, .95, n2) * .3 + rings * .45 * (1. - fw), 0., 1.) * .65);
  float rk = smoothstep(.78, .84, vn(qs * vec3(9., 9., 4.) + 9.)) * (1. - smoothstep(.05, .16, abs(fract((q.y * .55 + q.z + q.x * .2) * 60. + n3 * 1.5) - .5))) * (1. - fw);
  top = mix(top, uBel * .7, rk * .42);
  h += ((n1 - .5) * .03 + (n2 - .5) * .008 + rings * .02 - rk * .012) * (1. - fw);
  if(part < .1){
    float k = smoothstep(.36, .64, vCol.g + (n3 - .5) * .75 + (n1 - .5) * .3);
    float tb = atan(q.x + 1e-6, -(q.y + .012));
    float pz = smoothstep(-.06, .05, q.z) * (1. - smoothstep(.455, .495, q.z)) * (1. - smoothstep(1.0, 1.5, abs(tb)));
    float gr = 1. - smoothstep(0., .55, abs(sin(tb * 15.)));
    gr *= pz * (1. - smoothstep(.25, .9, fwidth(tb * 15.)));
    h -= gr * .085;
    bel *= 1. - .72 * gr;
    bel = mix(bel, uTop, smoothstep(.7, .8, n1 + n2 * .3) * .5);
    c = mix(top, bel, k);
    float ym = -.008 - .04 * (1. - smoothstep(.27, .5, q.z));
    float ml = (1. - smoothstep(.0012, .0045, abs(q.y - ym))) * step(.262, q.z) * (1. - fw);
    c *= 1. - .7 * ml; h -= ml * .03;
    vec3 e = vec3(abs(q.x), q.y, q.z) - uEye; float ed = length(e * vec3(1., 1., .6));
    c *= 1. - .5 * (1. - smoothstep(.007, .02, ed)); h += .02 * (1. - smoothstep(.012, .022, ed));
  } else if(part < .3){
    float k = smoothstep(.3, .62, vCol.g + (n3 - .5) * .9 + (n1 - .5) * .35);
    c = mix(top, bel * (.9 + .1 * n2), k);
  } else if(part < .5){
    float edge = smoothstep(.0, .5, vInst.x + n3 - .35);
    float k = vCol.g * smoothstep(.38, .6, n3 * .8 + vn(qs * vec3(22., 4., 22.)) * .5 - .12 + vInst.w * .3) * edge;
    c = mix(top, bel, k);
  } else if(part < .7){
    c = top;
  } else if(part < .9){
    c = mix(top * 1.5 + .025, vec3(.8, .76, .66) * (.7 + .5 * n2), vCol.g);
    h += (n2 - .5) * .035 * (1. - fw);
  } else { c = vec3(.012); }
  return mix(c, mix(c, vec3(.72, .7, .68) * (.58 + .25 * n1 + .2 * vCol.g + .14 * n3), .82), uRare * step(.5, vInst.y) * step(part, .9));
}
`;
// blue whale: mottled blue-grey all over, paler blotches, a long pleated underside
SKIN.blue = /* glsl */`
vec3 skin(vec3 q, float part, out float h){
  vec3 qs = q + vInst.x * 11.7; h = 0.;
  float n1 = fbm(qs * vec3(44., 44., 20.)), n2 = vn(qs * vec3(170., 170., 60.) + 5.), n3 = fbm(qs * vec3(13., 13., 7.) + 3.);
  float fw = clamp(length(fwidth(q)) * 60., 0., 1.);
  float blot = smoothstep(.5, .72, n1) * (1. - smoothstep(-.1, .42, q.z)) + smoothstep(.62, .8, n1) * .5;
  vec3 c = uTop * (.72 + .5 * n3);
  c = mix(c, uBel * (.8 + .3 * n2), clamp(blot * .55 + smoothstep(.8, .95, n2) * .15, 0., 1.));
  c = mix(c, uTop * .5, (1. - smoothstep(.1, .3, n1)) * .35);
  if(part < .1){
    float tb = atan(q.x + 1e-6, -(q.y + .008));
    float pz = smoothstep(-.1, .0, q.z) * (1. - smoothstep(.46, .495, q.z)) * (1. - smoothstep(1.1, 1.6, abs(tb)));
    float gr = (1. - smoothstep(0., .55, abs(sin(tb * 30.)))) * pz * (1. - smoothstep(.25, .9, fwidth(tb * 30.)));
    h -= gr * .03; c *= 1. - .3 * gr;
    c = mix(c, uBel * (.85 + .2 * n1), vCol.g * .55);
    float ym = -.004 - .03 * (1. - smoothstep(.3, .5, q.z));
    float ml = (1. - smoothstep(.001, .0035, abs(q.y - ym))) * step(.3, q.z) * (1. - fw);
    c *= 1. - .6 * ml; h -= ml * .03;
    vec3 e = vec3(abs(q.x), q.y, q.z) - uEye; float ed = length(e * vec3(1., 1., .6));
    c *= 1. - .5 * (1. - smoothstep(.004, .011, ed));
  } else if(part > .9){ c = vec3(.012); }
  else { c = mix(c, uBel * .9, vCol.g * .3); }
  c = mix(c, uBel * .8, scars(qs, .035) * (1. - fw) * .4);
  return c;
}
`;
// sperm whale: dark grey-brown, corrugated behind the smooth scarred head, pale about the jaw and under the belly.
// Its marks are of sizes that read from 60 m off: the wrinkles' ridges 18 round the girth (about half a metre each on
// a 14 m animal), pale crests and dark furrows; pale blotches a metre and more across on flank and belly; the head's
// long scars a hand broad beside the fine ones.
SKIN.sperm = /* glsl */`
vec3 skin(vec3 q, float part, out float h){
  vec3 qs = q + vInst.x * 13.1; h = 0.;
  float n1 = fbm(qs * vec3(28., 28., 14.)), n2 = vn(qs * vec3(150., 150., 50.) + 5.), n3 = vn(qs * vec3(8., 8., 4.) + 2.);
  float n4 = fbm(qs * vec3(10., 10., 5.) + 17.);
  float fw = clamp(length(fwidth(q)) * 60., 0., 1.);
  vec3 c = uTop * (.6 + .8 * n1);
  if(part < .1){
    float th = atan(q.x + 1e-6, q.y), ph = th * 18. + 4. * vn(qs * vec3(6., 6., 9.)) + 2. * sin(q.z * 40.);
    float wk = (1. - smoothstep(.07, .2, q.z)) * smoothstep(-.44, -.3, q.z) * (1. - smoothstep(.4, 1.3, fwidth(ph))) * smoothstep(-.75, -.15, q.y / (length(q.xy) + 1e-5));
    float wr = sin(ph);
    h += wr * .1 * wk; c *= 1. + wk * (.5 * smoothstep(.1, .9, wr) - .55 * (1. - smoothstep(-.7, .3, wr)));
    float hd = smoothstep(.08, .28, q.z);
    c = mix(c, uBel * .6, hd * (.12 + .3 * smoothstep(.45, .8, n3)));
    float broad = smoothstep(.8, .87, vn(vec3(qs.x * 44., qs.y * 44. + qs.z * 8., qs.z * 5.) + 3.)) + smoothstep(.84, .9, vn(vec3(qs.x * 9. + qs.z * 38., qs.y * 40., qs.z * 6.) + 11.));
    c = mix(c, uBel * .85, clamp((scars(qs, .08) * .85 + scars(qs * 1.7 + 3., .05) * .6) * hd * (1. - fw) + broad * hd * .5 + smoothstep(.9, .97, n2) * hd * .5, 0., 1.));
    float blot = smoothstep(.55, .68, n4) * (.3 + .4 * (1. - smoothstep(-.06, .05, q.y))) * (1. - .6 * hd);
    c = mix(c, uBel * (.5 + .3 * n1), blot);
    float jaw = (1. - smoothstep(-.07, -.045, q.y)) * smoothstep(.14, .3, q.z) * (1. - smoothstep(.015, .05, abs(q.x)));
    c = mix(c, uBel * (.75 + .3 * n3), clamp(jaw * (.35 + .4 * n1) + vCol.g * 1.3, 0., 1.));
    vec3 e = vec3(abs(q.x), q.y, q.z) - uEye; float ed = length(e * vec3(1., 1., .6));
    c *= 1. - .5 * (1. - smoothstep(.006, .016, ed));
  } else if(part > .9){ c = vec3(.012); }
  else { c = mix(c, uBel * .7, clamp(scars(qs, .05) * .5 + smoothstep(.58, .72, n4) * .3, 0., 1.)); }
  return c;
}
`;
// orca: black with a white oval behind the eye, white chin and belly with a lobe up the flank, a grey saddle
SKIN.orca = /* glsl */`
vec3 skin(vec3 q, float part, out float h){
  vec3 qs = q + vInst.x * 7.7; h = 0.;
  float n1 = fbm(qs * vec3(30., 30., 16.)), n3 = vn(qs * vec3(10., 10., 6.) + 2.), w = 0.;
  vec3 blk = uTop * (.75 + .5 * n1), wht = uBel * (.88 + .14 * n1), c;
  if(part < .1){
    float line = -.05 + .06 * smoothstep(.36, .47, q.z) - .03 * (1. - smoothstep(.14, .3, q.z)) * smoothstep(-.02, .12, q.z)
      + .09 * (1. - smoothstep(-.15, -.03, q.z)) * smoothstep(-.36, -.2, q.z) - .02 * (1. - smoothstep(-.45, -.3, q.z));
    w = 1. - smoothstep(line - .005, line + .005, q.y + (n3 - .5) * .008);
    vec2 e = (vec2(q.y, q.z) - vec2(uEye.y + .036, uEye.z - .042)) / vec2(.021, .058);
    w = max(w, (1. - smoothstep(.8, 1.05, length(e))) * step(.03, abs(q.x)));
    float sd = (1. - smoothstep(-.07, -.035, q.z)) * smoothstep(-.22, -.12, q.z) * smoothstep(.035, .07, q.y);
    c = mix(mix(blk, vec3(.5, .53, .58) * (.8 + .3 * n1), sd * .92), wht, w);
    vec3 e3 = vec3(abs(q.x), q.y, q.z) - uEye; c *= 1. - .6 * (1. - smoothstep(.006, .014, length(e3)));
  } else if(part > .9){ c = vec3(.012); }
  else if(part > .3 && part < .5){ c = mix(blk, wht, vCol.g * smoothstep(.02, .06, abs(q.x))); }
  else { c = blk; }
  return mix(c, wht * .8, scars(qs, .03) * .3 * (1. - w));
}
`;
// dolphin: a dark cape, grey flanks, a pale belly, a darker line from eye to flipper
SKIN.dolphin = /* glsl */`
vec3 skin(vec3 q, float part, out float h){
  vec3 qs = q + vInst.x * 3.9; h = 0.;
  float n1 = fbm(qs * vec3(26., 26., 14.)), n3 = vn(qs * vec3(8., 8., 5.) + 2.);
  vec3 cape = uTop * (.58 + .22 * n1), flank = uTop * (1.14 + .22 * n1), c;
  if(part < .1){
    float cl = .045 - .05 * (1. - smoothstep(-.35, .1, q.z)) + (n3 - .5) * .012;
    c = mix(flank, cape, smoothstep(cl - .012, cl + .012, q.y));
    c = mix(c, uBel * (.88 + .14 * n1), smoothstep(.42, .82, vCol.g + (n3 - .5) * .3));
    vec3 e = vec3(abs(q.x), q.y, q.z) - uEye; c *= 1. - .5 * (1. - smoothstep(.008, .02, length(e)));
    float ym = -.022; c *= 1. - .5 * (1. - smoothstep(.002, .006, abs(q.y - ym))) * step(.4, q.z);
  } else if(part > .9){ c = vec3(.012); }
  else { c = cape * 1.1; }
  return c;
}
`;

// light: the low sun through the gaps (warm, one side), the sky from above, the bright wet street from below,
// a wet sheen that mirrors the sky, a warm rim toward the sun; haze by distance (scene fog's own numbers).
// ONE LAW OF LIGHT FOR EVERY KIND, AT EVERY HOUR:
// THE FILL: no part of a skin is lit less than a floor of the city that the sky alone lights (the city's own figure
// for its paving in shade: the sky's colour times 1.31, 1.36, 1.56). The sky's cool light fills it from above, the
// wet paving's warm bounce from below (the paving's colour, and the low sun it throws back where the sun reaches).
// THE RIM: wet skin seen at a low angle mirrors the sky that lies behind it; where that sky is the bright sky about
// the low sun (the mirrored ray within a broad lobe of the sun's bearing) it is a warm band round the whole outline
// of head, flank and flukes, broad enough to read on a flank 60 m off (it falls off with the 1.5th power of the
// angle); weaker where a tower hides the sun. Beside it the skin's own rim toward the sun stands.
// THE SHOULDER (uCap): a kind's skin keeps its own value up to 0.55 of its cap and never reaches the cap (the white
// whale's: cream, under full white; the other kinds' caps lie far over anything they are lit to).
const FRAG_MAIN = /* glsl */`
uniform vec3 uCap;
vec3 under(vec3 x, vec3 c){ vec3 t = c * .55, d = c - t; return mix(x, t + d * (1. - exp(-max(x - t, 0.) / d)), step(t, x)); }
void main(){
  vec3 N = normalize(vN); if(!gl_FrontFacing) N = -N;
  vec3 toEye = cameraPosition - vWorld; float fd = length(toEye); vec3 Vv = toEye / max(fd, 1e-3);
  float h; vec3 alb = skin(vLocal, vCol.b, h);
  vec3 dpx = dFdx(vWorld), dpy = dFdy(vWorld); float hx = dFdx(h), hy = dFdy(h);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  vec3 Nb = abs(det) * N - sign(det) * (hx * r1 + hy * r2);
  N = normalize(Nb + N * 1e-7);
  float eyeK = step(.9, vCol.b);
  float sv = sunAt(vWorld);
  float ndl = dot(N, uSun), dif = clamp(ndl * .72 + .28, 0., 1.); dif *= dif;
  float up = clamp(N.y * .5 + .5, 0., 1.);
  float lit = sv * clamp(ndl * 1.6 + .2, 0., 1.);
  vec3 skyFill = uSkyCol * vec3(1.31, 1.36, 1.56), paveFill = uGroundCol + uSunCol * (.03 + .07 * sv);
  vec3 amb = mix(paveFill, skyFill * (1. - .6 * lit), up * up * (3. - 2. * up));
  vec3 col = alb * (amb * (.6 + .4 * vCol.r) + uSunCol * dif * sv * vCol.r * .8);
  float fr0 = 1. - clamp(dot(N, Vv), 0., 1.), fr2 = fr0 * fr0, fr = fr2 * fr2;
  vec3 Rv = reflect(-Vv, N);
  float toSun = clamp(dot(Rv, uSun), 0., 1.), ts2 = toSun * toSun, ts8 = ts2 * ts2 * ts2 * ts2;
  // the wet film mirrors the sky; where the low sun lights the skin directly the sky's image gives way and the sun
  // shows as one narrow highlight; its key and its warm sheen work on the skin's own colour (black stays black)
  vec3 skyR = mix(uGroundCol, uSkyCol, smoothstep(-.25, .35, Rv.y)) * (1. - .6 * lit) + uSunCol * .5 * ts8 * ts8 * sv;
  float wv = sin(vLocal.z * 26. - uTime * .5 + vLocal.x * 8. + vInst.x * 20.);
  float sheen = up * up * (.3 + .7 * smoothstep(-.2, .9, wv));
  col += alb * uGroundCol * clamp(-N.y, 0., 1.) * .4 * vCol.r;
  col += alb * uSunCol * sheen * lit * .45;
  col += skyR * (.022 + .24 * fr + .085 * sheen) * uWet * (1. + eyeK * 4.);
  float gl = ts8 * ts8 * ts8 * ts8; gl *= gl * gl;
  col += uSunCol * gl * (.7 + eyeK * 4.) * sv * uWet;
  float knobK = step(.7, vCol.b) * step(vCol.b, .9);
  col += uSunCol * (.02 + alb) * fr2 * clamp(ndl + .45, 0., 1.) * sv * .72 * (1. + 1.6 * knobK);
  col += uSunCol * (.17 + .25 * alb) * pow(fr0, 1.5) * ts2 * toSun * (.3 + .7 * sv);
  col = under(col, uCap);
  float fog = smoothstep(uFog.x, uFog.y, fd);
  col = mix(col, uFogCol, clamp(fog * .92 + (1. - vInst.z), 0., 1.));
  gl_FragColor = vec4(col, 1.);
}
`;

// colours and motion of each kind. swim: [-, amplitude share of the length, wave number, where the wave starts];
// fin: [flap amplitude, bias, tip lag, sweep]; hz the tail beat in beats a second; flk extra fluke pitch;
// cap: the value the kind's lit skin stays under (the shoulder of the light's law), none for the dark kinds
const KINDS = {
  humpback: { geo: humpbackGeo, top: '#3d454f', bel: '#e9e6df', swim: [0, 0.062, 3.6, 0.22], fin: [0.2, 0.1, 1.5, 0.12], hz: 0.19, fhz: 0.105, flk: 0.3, wet: 1 },
  blue: { geo: blueGeo, top: '#5a7186', bel: '#aebbc4', swim: [0, 0.04, 3.4, 0.2], fin: [0.07, 0.05, 1.0, 0.05], hz: 0.13, fhz: 0.07, flk: 0.26, wet: 1 },
  sperm: { geo: spermGeo, top: '#6b625a', bel: '#cfc8bd', swim: [0, 0.035, 3.2, 0.15], fin: [0.12, 0.1, 1.0, 0.1], hz: 0.07, fhz: 0.06, flk: 0.2, wet: 0.9 },
  orca: { geo: orcaGeo, top: '#16181c', bel: '#f1f0ea', swim: [0, 0.055, 3.8, 0.22], fin: [0.1, 0.1, 1.0, 0.08], hz: 0.45, fhz: 0.2, flk: 0.3, wet: 1.2 },
  dolphin: { geo: dolphinGeo, top: '#555e69', bel: '#ddd6cc', swim: [0, 0.075, 4.2, 0.24], fin: [0.08, 0.1, 1.0, 0.06], hz: 1.25, fhz: 0.5, flk: 0.36, wet: 1 },
};
const ORDER = ['humpback', 'blue', 'sperm', 'orca', 'dolphin'];

// ---------- the courses: pure functions of the clock ----------
// A table of the route (place and the clock at which the lens is there), read by z: the flight goes north.
function routeTable(path, timeAt) {
  const N = 480, zs = [], xs = [], ys = [], ts = [], v = new THREE.Vector3();
  const pt = (u) => (path.getPointAt ? path.getPointAt(u, v) : path.pointAt(u, v));
  for (let i = 0; i <= N; i++) { const u = i / N; pt(u); zs.push(v.z); xs.push(v.x); ys.push(v.y); ts.push(timeAt ? timeAt(u) : u * 48); }
  const find = (z) => { let lo = 0, hi = N; if (z >= zs[0]) return [0, 0]; if (z <= zs[N]) return [N - 1, 1]; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (zs[m] > z) lo = m; else hi = m; } return [lo, (zs[lo] - z) / Math.max(1e-6, zs[lo] - zs[lo + 1])]; };
  const rd = (a, z) => { const [i, f] = find(z); return mix(a[i], a[i + 1], f); };
  const vEnd = (zs[N - 8] - zs[N]) / Math.max(1e-3, ts[N] - ts[N - 8]), v0 = (zs[0] - zs[8]) / Math.max(1e-3, ts[8] - ts[0]);
  const ms = [0]; for (let i = 1; i <= N; i++) ms.push(ms[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1], zs[i] - zs[i - 1]));
  return {
    N, zs, xs, ys, ts, z0: zs[0], z1: zs[N],
    // the metres of route flown at z (carried straight on beyond both ends)
    m: (z) => (z > zs[0] ? zs[0] - z : z < zs[N] ? ms[N] + zs[N] - z : rd(ms, z)),
    // the z at which the lens is at the clock t (carried on at the end speeds beyond both ends)
    zAt: (t) => {
      if (t <= ts[0]) return zs[0] + (ts[0] - t) * v0;
      if (t >= ts[N]) return zs[N] - (t - ts[N]) * vEnd;
      let lo = 0, hi = N; while (hi - lo > 1) { const k = (lo + hi) >> 1; if (ts[k] <= t) lo = k; else hi = k; }
      return mix(zs[lo], zs[hi], (t - ts[lo]) / Math.max(1e-6, ts[hi] - ts[lo]));
    },
    // the route's point at m metres (its last point beyond its end)
    at: (m, out) => {
      let lo = 0, hi = N; while (hi - lo > 1) { const k = (lo + hi) >> 1; if (ms[k] <= m) lo = k; else hi = k; }
      const f = clamp((m - ms[lo]) / Math.max(1e-6, ms[hi] - ms[lo]), 0, 1);
      out[0] = mix(xs[lo], xs[hi], f); out[1] = mix(ys[lo], ys[hi], f); out[2] = mix(zs[lo], zs[hi], f); return out;
    },
    x: (z) => rd(xs, z), y: (z) => rd(ys, z),
    // the clock at which the lens is at z (carried on at the end speeds beyond both ends)
    t: (z) => (z > zs[0] ? ts[0] - (z - zs[0]) / v0 : z < zs[N] ? ts[N] + (zs[N] - z) / vEnd : rd(ts, z)),
    // distance of a point from the route's line (its whole length)
    dist: (x, y, z) => { let b = 1e9; for (let i = 0; i <= N; i++) { const dx = xs[i] - x, dy = ys[i] - y, dz = zs[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; } return Math.sqrt(b); },
  };
}
const wrap = (x, lo, hi) => lo + ((((x - lo) % (hi - lo)) + (hi - lo)) % (hi - lo));
const TAU = Math.PI * 2;

// A lane swimmer: goes along z (dir -1 north, +1 south) at speed v on a lane laid by place; the lane's side offset
// from the route's line and height over it are numbers of the animal (or abs(z): a place of its own); the lane
// stands off the entry's axis behind the entry and passes outside the arch's feet (o.arch, from the arch's measures).
// o.out: the stretch of route along which it goes out round the arch's foot, where it is the swimmer's own.
// zMeet, tMeet: where it is when the lens is at one place. Without the world's clock (tb null: an anchor's plain
// place) the bob and the roll are left out.
function laneOf(R, o) {
  return (z, out) => {
    let x = R.x(z) + o.off, y = R.y(z) + o.dy;
    if (o.abs) { x = o.abs(z)[0]; y = o.abs(z)[1]; }
    const sg = o.off >= 0 ? 1 : -1;
    if (o.over) y = mix(y, Math.max(y, o.over[2]), sstep(o.over[0], o.over[1], z));
    x = mix(x, sg * Math.max(Math.abs(x), o.arch), sstep(o.out ? o.out[0] : -236, o.out ? o.out[1] : -268, z));
    x = mix(x, R.xs[0] + sg * Math.max(Math.abs(o.off), o.stand ?? 16.5), sstep(140, 178, z));
    // THE AIR OVER A TOP (o.tops: the city's tops on this lane's side; o.hang: how far the animal's lowest point
    // comes under its lane; o.span: how far it reaches along the street; o.near: the lane's distance from the axis
    // at which its flipper's tip comes within the tops' air beside the building line). Where a top lies under the
    // lane or within that air beside it, the lane keeps the animal's lowest point 6 m over the top: it rises over
    // 30 m of route before the top's face comes within its reach and comes down as gently behind it.
    if (o.tops) {
      const ax = Math.abs(x), y0 = y, side = sstep(o.near - 1.5, o.near, ax);
      if (side > 0) for (const tp of o.tops) {
        const w = side * sstep(tp[0] + o.span + 30, tp[0] + o.span, z) * sstep(tp[1] - o.span - 30, tp[1] - o.span, z);
        if (w > 0) y = Math.max(y, mix(y0, Math.max(y0, tp[2] + TOPS.air + o.hang), w));
      }
    }
    out[0] = x; out[1] = y;
  };
}
// o.lane: a lane given whole (the calf's: its mother's, moved)
function laneSwimmer(R, o) {
  const lane = o.lane || laneOf(R, o), a = [0, 0], b = [0, 0];
  return (t, tb, q) => {
    const c = tb ?? 0, kb = tb == null ? 0 : 1, z = wrap(o.zMeet + o.dir * o.v * (t - o.tMeet), -520, 420);
    lane(z, a); lane(z + 2, b);
    const dx = (b[0] - a[0]) / 2, dy = (b[1] - a[1]) / 2;
    q.x = a[0]; q.y = a[1] + kb * o.bob * Math.sin(c * 0.31 + o.ph * 9); q.z = z;
    q.yaw = Math.atan2(o.dir * dx, o.dir);
    q.pitch = Math.atan(o.dir * dy) * 0.8;
    q.roll = kb * o.rollA * Math.sin(c * o.rollW + o.ph * 5);
    q.curve = 0; q.swim = o.swim ?? 1;
    q.phase = TAU * (o.hz * c + o.ph); q.fphase = TAU * (o.fhz * c + o.ph * 1.7);
    q.fade = sstep(-520, -440, z) * sstep(420, 340, z);
  };
}
// The arch as the city lays it (its report): its plane, its feet either side of the axis, half a foot's breadth, the
// terrace it stands on, its crown's height over the terrace. The world may pass its own measures.
const ARCH = { z: -292, foot: 9.6, leg: 2.3, base: 5, rise: 27.5 };
// The city's stone as its plan lays it (its source; the city hands the animals no roofs and no walls): the building
// line of both sides stands 26 m from the avenue's axis; the last blocks stand on it from z -240 to z -262 (their
// north face is the foot of the steps); the steps rise from there to the terrace's edge (z -276), and the terrace
// (the arch's base) lies north of it. AIR: the clear air every body keeps from a wall, a roof and the terrace.
const STONE = { line: 26, south: -240, foot: -262, edge: -276, air: 4 };
// THE CITY'S TOPS ON THE BUILDING LINE, as its plan lays them (its source): the podiums and blocks that stand on the
// line of either side, each from its south face to its north face along the street, with the highest top its deal
// can give: [z south, z north, top]. AIR: the clear air an animal's lowest point (belly, flippers' tips, flukes)
// keeps over every top that lies under its course or within that air beside it in plan (beside: with 0.2 m over).
const TOPS = {
  west: [[330, 262, 10], [240, 150, 10], [115, 35, 10], [-8, -96, 8], [-240, -262, 24]],
  east: [[300, 150, 16], [150, 60, 14], [60, 22, 48], [-50, -96, 18], [-130, -222, 20], [-240, -262, 26]],
  air: 6, beside: 6.2,
};
// a humpback's measures for that law: its lowest point (the flippers' tips at the lowest of their scull) comes 0.3
// of its length under its lane, and its bob 0.35 m and a tenth more; it reaches 0.55 of its length along the street
// (and the air beside); its flipper's tip 0.36 of its length from its middle in plan (0.3 m for its roll)
const overTops = (L, sg) => ({ tops: sg < 0 ? TOPS.west : TOPS.east, hang: 0.3 * L + 0.45, span: TOPS.beside + 0.55 * L, near: STONE.line - TOPS.beside - 0.36 * L - 0.3 });

// Every animal's course. core: { makeRng, hashSeed }. o: { dolphins, arch, trees }.
// Returns { bodies: [{ kind, L, size, variant, seed, reach, home, at(t, tb, q) }], R }.
export function arwCourses(core, seed, path, timeAt, o = {}) {
  const mk = (name) => core.makeRng(core.hashSeed('arw-animals-' + name + ':' + seed));
  // every stream of this part, in one list
  const rH = mk('humpbacks'), rP = mk('pod'), rB = mk('blue'), rS = mk('sleepers'), rO = mk('orcas'), rD = mk('dolphins');
  const R = routeTable(path, timeAt), bodies = [], AR = o.arch || ARCH;
  const add = (kind, L, model, at, x = {}) => { bodies.push({ kind, L, size: L / model, variant: x.variant || 0, seed: x.seed ?? 0.5, reach: x.reach ?? L * 0.2, big: x.big ?? 1, lead: !!x.lead, home: x.home || null, pool: x.pool ?? null, at }); };
  // a humpback's lane passes the arch with 2.5 m of air between its flipper's tip and the arch's foot
  const past = (L) => AR.foot + AR.leg + 2.5 + 0.335 * L;
  // north of the avenue a humpback keeps above what hangs and swims there (west: the sleepers' heads, 34 m; east: the
  // orcas' band, 22 m; 1 m for their bobbing and 5.5 m for its own flippers and air): the pod's lanes climb to that
  // between the place where its last is overtaken and the square's south edge (z -135)
  const high = (sg) => (sg < 0 ? 34 : 22) + 6.5;
  // HUMPBACKS: THE POD STRUNG ALONG THE AVENUE, all heading north, each on a course and at a speed of its own. Seven
  // are overtaken one after another between the entry and cross street B: the mother (with the calf) where the brief
  // has her (the lens level with her eye at z 128), then six more.
  const zMo = 128, zSt = -113, span = zMo - (zSt + 13);
  {
    const ph = rH(), c = { ...overTops(14.2, 1), zMeet: zMo + 3.7, tMeet: R.t(zMo), off: 9.65, dy: 0.7, arch: past(14.2), over: [zSt + 13, -135, high(1)], v: 2.8, dir: -1, bob: 0.35, ph, rollA: 0.06, rollW: 0.21, hz: 0.19 * rH.range(0.92, 1.08), fhz: 0.1 };
    add('humpback', 14.2, 14, laneSwimmer(R, c), { seed: rH(), reach: 14.2 * 0.31 });
    // THE CALF (4.8 m: a young one, a third of her length) on the lens's side, beside and a little behind her west
    // flank and under it, beating faster. Its lane is HER lane moved by one fixed step, so the two keep one distance
    // on the whole course: 5 m to the west of her axis, 3.8 m lower, its middle 4.7 m behind hers. That puts its
    // nose behind her flipper's trailing edge and its back under the lowest reach of her flukes' tips, with 1.5 of
    // its own body widths (1.63 m) of clear air and more from her hull, from her flipper at every point of its
    // scull and from her flukes at every point of their beat (counted on the skins as drawn).
    const her = laneOf(R, c), CALF = { L: 4.8, west: 5, under: 3.8, behind: 4.7 };
    const cc = { ...c, lane: (z, out) => { her(z - CALF.behind, out); out[0] -= CALF.west; out[1] -= CALF.under; }, zMeet: c.zMeet + CALF.behind, ph: rH(), hz: 0.34, fhz: 0.2, bob: 0.25, rollA: 0.1, rollW: 0.37 };
    add('humpback', CALF.L, 14, laneSwimmer(R, cc), { seed: rH(), variant: 1, reach: CALF.L * 0.31, big: 0.5 });
  }
  // THE SIX: ONE RULE FOR EACH. Where the lens overtakes it is dealt by seeded gaps: the stretch from the mother's
  // place to 13 m of route short of street B's line is cut in six shares drawn from the pod's stream. They take
  // alternate sides from the mother's on (the design), so that two of one side are never neighbours in the row. Its
  // lane lies 10.4 to 12.5 m from the line in plan (dealt), its height within 5 m of the line's (dealt): any on the
  // west, the upper part on the east, where the dolphins have the air beneath. Speed 2.4 to 3.4 m/s and length,
  // its own; on each side the three dealt speeds are laid the faster ahead, so none of a side runs into another.
  // EVERY THIRD OF THE POD IS PASSED UNDERNEATH: of the row as the lens meets it (the mother, her calf, the six) the
  // third and the sixth, the first and the fourth of the six (the two leaders are never met: there is no ninth).
  // Such a one takes no side: its lane lies on the line's own plan, at the entry too, and its lowest point (belly,
  // flipper tips, flukes; the lowest of its beat and bob) keeps 4.5 to 6 m over the line (dealt, in place of the
  // height of a side lane; no distance from the line is dealt it), so that the lens sees it ahead and above and
  // passes under its belly. Of these two the one ahead is never the slower (their two speeds change places if so).
  const cut = [], vs = [], spd = [];
  for (let i = 0; i < 6; i++) { cut.push(rP.range(0.8, 1.2)); vs.push(rP.range(2.4, 3.4)); }
  const whole = cut.reduce((s, w) => s + w, 0);
  for (const e of [1, 0]) {
    const ix = [0, 1, 2, 3, 4, 5].filter((i) => i % 2 === e), v = ix.map((i) => vs[i]).sort((p, q) => p - q);
    ix.forEach((i, k) => { spd[i] = v[k]; });
  }
  const UNDER = { every: 3, low: 4.5, high: 6, hang: (L) => 0.3 * L + 0.45 };
  if (spd[0] > spd[UNDER.every]) { const v = spd[0]; spd[0] = spd[UNDER.every]; spd[UNDER.every] = v; }
  let zP = zMo;
  for (let i = 0; i < 6; i++) {
    zP -= span * cut[i] / whole;
    const under = i % UNDER.every === 0, east = i % 2 === 1, far = under ? 0 : rP.range(10.4, 12.5), hh = rP(), L = rP.range(12.4, 14.8), ph = rP();
    const c = { ...(under ? { stand: 0 } : overTops(L, east ? 1 : -1)), zMeet: zP, tMeet: R.t(zP), off: east ? far : -far, dy: under ? UNDER.hang(L) + mix(UNDER.low, UNDER.high, hh) : east ? mix(2.2, 4.4, hh) : mix(-3, 4, hh), arch: past(L), over: [zSt + 13, -135, high(east ? 1 : -1)], v: spd[i], dir: -1, bob: 0.35, ph, rollA: 0.06, rollW: 0.21, hz: 0.19 * rP.range(0.92, 1.08), fhz: 0.1 };
    add('humpback', L, 14, laneSwimmer(R, c), { seed: rP(), reach: L * 0.31 });
  }
  // THE TWO LEADERS, ahead of the lens the whole flight, go out either side of the arch: the middle of one is in the
  // arch's plane when the lens is over the foot of the steps (z -262), the other's when it is over the terrace's
  // edge (z -276); which goes first is dealt. Each passes with 2.5 m of air between its flipper and the arch's foot,
  // its middle 4 to 7 m under the arch's crown. On the way it keeps over the outer carriageway at the height the
  // pod keeps north of the avenue, and comes down between the last blocks' south face (z -240) and 10 m short of
  // the arch's plane.
  const eastFirst = rH() < 0.5;
  for (const sg of [1, -1]) {
    const L = rH.range(13, 14.6), v = rH.range(2.4, 3.4), yA = AR.base + AR.rise - rH.range(4, 7), far = rH.range(15.5, 17.5), ph = rH();
    // its flipper's tip (0.36 of its length from its middle at the widest of its scull, 0.3 m for its roll) keeps
    // the clear air from the building line all its way; beside the last blocks it keeps the tops' air (6 m) from
    // it, so that no block lies under its course or within that air beside it: it comes in to that between 16 m
    // and 2 m of route short of their south face, and goes out round the arch's foot only north of them. North of
    // street B, where a podium stands on its side of the line (east: top 20 m), it rides with its lowest point
    // 6 m over that top (there the avenue has no room for the tops' air beside it and the clear air from the line).
    const xL = sg * Math.min(far, STONE.line - STONE.air - 0.3 - 0.36 * L), xB = sg * Math.min(Math.abs(xL), STONE.line - TOPS.beside - 0.3 - 0.36 * L);
    const topN = Math.max(0, ...(sg < 0 ? TOPS.west : TOPS.east).filter((t) => t[0] < zSt && t[1] > STONE.south).map((t) => t[2]));
    const yT = Math.max(high(sg), topN ? topN + TOPS.air + 0.3 * L + 0.45 : 0), yz = (z) => mix(yA, yT, sstep(AR.z + 10, -240, z));
    const c = { zMeet: AR.z, tMeet: R.t((sg > 0) === eastFirst ? -262 : -276), off: xL, dy: 0, abs: (z) => [mix(xL, xB, sstep(STONE.south + 16, STONE.south + 2, z)), yz(z)], arch: past(L), out: [STONE.foot - 2, AR.z + 10], v, dir: -1, bob: 0.35, ph, rollA: 0.06, rollW: 0.2, hz: 0.19 * rH.range(0.92, 1.08), fhz: 0.1 };
    add('humpback', L, 14, laneSwimmer(R, c), { seed: rH(), reach: L * 0.31 });
  }
  // THE BLUE WHALE: side-on along cross street B from east to west, ahead of the lens; it is timed by a margin: its
  // tail (13 m behind its middle) is 15 m west of the line when the lens comes under its line
  {
    const ph = rB(), y0 = 34, v = 4.2, zB = zSt + rB.range(-1.5, 1.5), tB = R.t(zSt) - (26 - R.x(zSt)) / v;
    add('blue', 26, 26, (t, tb, q) => {
      const c = tb ?? 0, kb = tb == null ? 0 : 1, x = wrap(-2 - v * (t - tB), -330, 330);
      q.x = x; q.y = y0 + kb * 0.5 * Math.sin(c * 0.23 + ph * 9); q.z = zB; q.yaw = -Math.PI / 2; q.pitch = kb * 0.02 * Math.sin(c * 0.17 + ph);
      q.roll = kb * 0.04 * Math.sin(c * 0.19 + ph * 5); q.curve = 0; q.swim = 1; q.phase = TAU * (0.13 * c + ph); q.fphase = TAU * (0.07 * c + ph);
      q.fade = sstep(-330, -250, x) * sstep(330, 250, x);
    }, { seed: rB(), reach: 26 * 0.16 });
  }
  // SPERM WHALES ASLEEP, DEALT OVER THE SQUARE: upright, head up. The nearest hangs 13 to 15 m west of the line (the
  // design) at a place drawn along the design's stretch (z -140 to -210); the other five are scattered between 2 m
  // beyond it and the square's middle line (x -73) along the same stretch, no two nearer than 10 m in plan: forty
  // places are drawn and the first five that keep the spacing (and whose air, below, has room for a grown animal)
  // stand. Heads 28 to 34 m up (the design); lengths 11 to 16 m, held so that the flukes hang 13 m up and more.
  // THE AIR UNDER A SLEEPER, by the city's own list of trees (any list of that shape): its lowest point (the flukes'
  // edge at the lowest of its bobbing and its lean) hangs 10 m and more over the paving (street level) and 3.5 m and
  // more over the top of every tree whose crown can come under it or within 3 m of it in plan: 3 m of air and half
  // a metre for the crown's sway. A crown is taken to reach no further from its trunk than nine tenths of the tree's
  // height (the widest of the city's shapes at its widest dealt width keeps inside that); a sleeper reaches 3.8 m
  // from its place in plan (the longest one's half span of flukes, its lean, its sway). Where that floor stands over
  // the dealt hang, the head goes up to it (to 34 m, the design's top) and then the animal is the shorter. Without
  // a list the grove's crowns (12 m) are taken to stand under every place, and the median's planes by their law.
  const SQ = { xMid: -73, zS: -140, zN: -210, paving: 0 }, spots = [];
  const stand = o.trees || medianPlanes(R).map((t) => [t[0], 0, t[1], t[2], 0]);
  const floorAt = (x, z) => {
    let f = SQ.paving + (o.trees ? 10 : 12 + 3.5);
    for (const t of stand) if (Math.hypot(t[0] - x, t[2] - z) < 0.9 * t[3] + 3 + 3.8) f = Math.max(f, t[1] + t[3] + 3.5);
    return f;
  };
  // how far under its head's top a sleeper's lowest point comes: its length, the flukes' edge behind the tail's end
  // and the flukes' tips at its greatest lean (0.06 of the length together), 0.75 m of bobbing, a quarter metre over
  const hang = (L) => 1.06 * L + 1, fits = (f) => f + hang(11) <= 34;
  // THE SHADOW POOL under a sleeper (buildAnimals lays it) lies on open paving. The greatest pool (radius POOL.r:
  // 1.5 times the widest body, 0.2 of 16 m) keeps 1 m from every trunk of the list and 0.2 m from the square's
  // planters, benches and vents, the city's own places (its source): three rows across the square with a planter
  // or a pair of benches every 10 m along each [half across, half along], and two vents. A place whose pool would
  // not keep that is no sleeper's place: of the forty it is passed over; the nearest keeps its dealt distance from
  // the line and takes the open place nearest its dealt one along the stretch (half metre steps either way).
  const POOL = { r: 1.5 * 0.2 * 16, up: 0.03, trunk: 1, air: 0.2, rows: [-48, -72, -96], z0: -165, step: 10, planter: [0.8, 3], benches: [1.49, 1.3], vents: [[-66, -185], [-90, -165]], vent: 1.2 };
  const poolClear = (x, z) => {
    for (const t of stand) if (Math.hypot(t[0] - x, t[2] - z) < POOL.r + POOL.trunk) return false;
    const on = (cx, cz, hx, hz) => Math.hypot(Math.max(0, Math.abs(x - cx) - hx), Math.max(0, Math.abs(z - cz) - hz)) < POOL.r + POOL.air;
    for (const rx of POOL.rows) for (let k = 0; k < 5; k++) { const h = k % 2 ? POOL.benches : POOL.planter; if (on(rx, POOL.z0 - POOL.step * k, h[0], h[1])) return false; }
    for (const v of POOL.vents) if (on(v[0], v[1], POOL.vent, POOL.vent)) return false;
    return true;
  };
  {
    const z0 = rS.range(SQ.zN + 5, SQ.zS - 5), d = rS.range(13, 15);
    let z = z0;
    for (let k = 1; k < 120 && !poolClear(R.x(z) - d, z); k++) z = clamp(z0 + (k % 2 ? 0.5 : -0.5) * Math.ceil(k / 2), SQ.zN + 5, SQ.zS - 5);
    spots.push([R.x(z) - d, z, d]);
  }
  for (let i = 0; i < 40; i++) {
    const u = rS(), w = rS(), z = mix(SQ.zS - 3, SQ.zN + 3, w), x = mix(R.x(z) - spots[0][2] - 2, SQ.xMid, u);
    if (spots.length < 6 && spots.every((p) => Math.hypot(p[0] - x, p[1] - z) >= 10) && fits(floorAt(x, z)) && poolClear(x, z)) spots.push([x, z]);
  }
  spots.forEach((s) => {
    const x = s[0], z = s[1], f = floorAt(x, z), top0 = rS.range(28, 34), L0 = clamp(rS.range(11, 16), top0 - 19, top0 - 13);
    const L = Math.max(6, Math.min(L0, (34 - f - 1) / 1.06)), top = Math.max(top0, f + hang(L)), ym = top - L * 0.5;
    const ph = rS(), wb = rS.range(0.5, 0.8), wt = rS.range(0.18, 0.3), tilt = rS.range(0.03, 0.09), spin = rS.range(-Math.PI, Math.PI);
    add('sperm', L, 14, (t, tb, q) => {
      const c = tb ?? 0, kb = tb == null ? 0 : 1;
      q.x = x + kb * 0.3 * Math.sin(c * wt * 0.7 + ph * 4); q.y = ym + kb * 0.75 * Math.sin(c * wb + ph * 7); q.z = z + kb * 0.3 * Math.cos(c * wt * 0.6 + ph * 2);
      q.pitch = Math.PI / 2 - tilt * (1 + 0.5 * Math.sin(c * wb * 0.5 + ph)); q.yaw = ph * TAU + 0.5 * Math.sin(c * wt * 0.5 + ph * 3);
      q.roll = spin + (0.6 + 0.4 * ph) * Math.sin(c * wt + ph * 6); q.curve = 0; q.swim = 0.35; q.phase = TAU * (0.07 * c + ph); q.fphase = TAU * (0.05 * c + ph); q.fade = 1;
    }, { seed: rS(), reach: L * 0.17, home: [x, ym, z], pool: SQ.paving + POOL.up });
  });
  // ORCAS: five in line coming south down the east side, the tall finned male first, the young one last. Dealt: the
  // place where the lens meets the first (z -192 to -195; the last has passed about z -215), the air between each
  // and the one before it (1.2 to 3 m), the line's one speed, and for each its lane (7.8 to 9.6 m east of the line)
  // and its height (17 to 19.2 m up: with back and fin inside the design's band of 16 to 22 m, all along its
  // course: the dealt height is held so that the fin's tip, 0.45 of the length over the lane, and the bob stay
  // under 21.8 m, under the lowest top the last east block's deal gives, 22 m: it passes beside that wall, never
  // over its roof). Past the arch's foot with the clear air (4 m), going out to it along the lane's own stretch of
  // route: the last east block's wall stays 6 m and more off their skin.
  {
    const zO = rO.range(-195, -192), tO = R.t(zO), vO = rO.range(3.8, 4.6);
    let back = 0, before = 0;
    [[7.5, 1], [6, 0], [6, 0], [6, 0], [4.2, 0]].forEach((k, i) => {
      const f = rO.range(0.97, 1.05), air = rO.range(1.2, 3), L = i > 0 && i < 4 ? k[0] * f : k[0], side = rO.range(7.8, 9.6), y = Math.min(rO.range(17, 19.2), 21.8 - 0.2 - 0.45 * L);
      if (i) back += (before + L) / 2 + air;
      before = L;
      const c = { zMeet: zO - back, tMeet: tO, off: side, dy: 0, abs: (z) => [R.x(z) + side, y], arch: AR.foot + AR.leg + STONE.air + 0.25 * L, v: vO, dir: 1, bob: 0.2, ph: rO(), rollA: 0.07, rollW: 0.5, hz: (i === 4 ? 0.6 : 0.42) * rO.range(0.94, 1.06), fhz: 0.2 };
      add('orca', L, 6.5, laneSwimmer(R, c), { seed: rO(), variant: k[1], reach: L * 0.2, big: 0.6 });
    });
  }
  o.rngs = { rD }; o.add = add; o.R = R; o.AR = AR;
  layIdlers(o);
  return { bodies, R };
}

// A body on a closed loop of its own (a pure function of the clock): pos(a, out) gives the place at loop angle a.
function loopBody(pos, w, a0, k) {
  const p0 = [0, 0, 0], p1 = [0, 0, 0], p2 = [0, 0, 0], e = (k.e ?? 0.03) * Math.sign(w);
  return (t, tb, q) => {
    const a = a0 + w * t; pos(a, p0); pos(a + e, p1); pos(a + 2 * e, p2);
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], ex = p2[0] - p1[0], ez = p2[2] - p1[2];
    const ds = Math.max(1e-4, Math.hypot(dx, dz)), y0 = Math.atan2(dx, dz), y1 = Math.atan2(ex, ez);
    let dyaw = y1 - y0; if (dyaw > Math.PI) dyaw -= TAU; if (dyaw < -Math.PI) dyaw += TAU;
    const curv = clamp(dyaw / ds, -k.maxCurve, k.maxCurve);
    q.x = p0[0]; q.y = p0[1]; q.z = p0[2]; q.yaw = y0; q.pitch = clamp(Math.atan2(dy, ds) * k.pitch, -0.6, 0.6);
    q.curve = curv + (k.head || 0) * Math.sin(tb * (k.headW || 0) + a0 * 3); q.roll = -curv * k.bank + k.rollA * Math.sin(tb * 0.4 + a0 * 5);
    q.swim = k.swim; q.phase = TAU * (k.hz * tb + a0); q.fphase = TAU * (k.fhz * tb + a0 * 1.3); q.fade = 1;
  };
}
// The median's planes by the city's own law (its source): one every 6.6 m from z 297, in fours with three left out,
// none on the two crossings, alternate sides of the axis, the crown's top cut to 5.8 m under the line: [x, z, top].
function medianPlanes(R) {
  const out = [];
  for (let i = 0; i < 80; i++) {
    const z = 297 - i * 6.6;
    if (z < -217) break;
    if ((z > -13 && z < 27) || (z > -135 && z < -91) || i % 7 >= 4) continue;
    out.push([i % 2 ? 2.3 : -2.3, z, Math.min(16, R.y(z) - 5.8)]);
  }
  return out;
}
// A run among the crowns: two straights along the avenue (half length h) joined by two half turns of radius r;
// s metres along it; out [across, along]
function runAt(s, h, r, out) {
  const P = 4 * h + TAU * r;
  let u = ((s % P) + P) % P;
  if (u < 2 * h) { out[0] = r; out[1] = h - u; return; }
  u -= 2 * h;
  if (u < Math.PI * r) { out[0] = r * Math.cos(u / r); out[1] = -h - r * Math.sin(u / r); return; }
  u -= Math.PI * r;
  if (u < 2 * h) { out[0] = -r; out[1] = -h + u; return; }
  u -= 2 * h; out[0] = -r * Math.cos(u / r); out[1] = h + r * Math.sin(u / r);
}
function layIdlers(o) {
  const { rD } = o.rngs, add = o.add, R = o.R;
  // DOLPHINS, BY PLACE: groups of two and three along the design's stretch (z 70 to z -20). The stretch is cut in
  // five shares drawn from the dolphins' stream (14 to 22.7 m each): one group to a share, on a run of its own that
  // stays inside it; where the share holds crowns of the median's planes the run lies about those crowns' own
  // middle. Each group goes round its run in file at a speed of its own (3 to 5 m/s), from a place and in a sense
  // of its own, weaving up and down; 7.9 to 11.9 m to the right of the line (outside the calf's flipper, under the
  // east whales) and 4 to 7 m under it: the run's own height is 0.6 m over the share's highest crown, held between
  // 5.2 and 5.8 m under the line. Two of the five are threes (dealt). The lens overtakes each group and meets the
  // next. A pair turns over the stepped plaza.
  const n = o.dolphins ?? 14, zS = 70, zN = -20, cut = [], key = [], specs = [], thirds = [];
  const planes = o.trees ? o.trees.filter((t) => t[4] === 0 && Math.abs(t[0]) < 4.5).map((t) => [t[0], t[2], t[1] + t[3]]) : medianPlanes(R);
  for (let i = 0; i < 5; i++) { cut.push(rD.range(0.85, 1.15)); key.push(rD()); }
  const whole = cut.reduce((s, w) => s + w, 0), rank = key.map((k, i) => [k, i]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  let zHi = zS;
  for (let gi = 0; gi < 5; gi++) {
    const len = (zS - zN) * cut[gi] / whole, zLo = zHi - len, own = planes.filter((t) => t[1] <= zHi && t[1] >= zLo), m = rank.indexOf(gi) < 2 ? 3 : 2;
    const r = rD.range(1.5, 1.7), reach = (len / 2 - 1.2) * rD.range(0.7, 1), h = Math.max(0.5, reach - r), P = 4 * h + TAU * r;
    const mid = own.length ? own.reduce((s, t) => s + t[1], 0) / own.length : (zHi + zLo) / 2, zc = clamp(mid, zLo + reach + 1.2, zHi - reach - 1.2);
    const top = own.reduce((s, t) => Math.max(s, t[2]), -1e9), under = own.length ? clamp(R.y(zc) - top - 0.6, 5.2, 5.8) : 5.2;
    const cx = rD.range(9.85, 9.95), ay = rD.range(0.75, 0.95), nW = rD() < 0.5 ? 2 : 3, p2 = rD() * TAU, v = rD.range(3, 5), w = (rD() < 0.5 ? -1 : 1) * TAU * v / P, a00 = rD() * TAU;
    let lag = 0;
    for (let k = 0; k < 3; k++) {
      const L = rD.range(2.4, 3), sd = rD(), ox = (k % 2 ? -0.2 : 0.2), oy = (k % 2 ? 0.2 : -0.2), a0 = a00 - Math.sign(w) * lag * TAU / P, tmp = [0, 0];
      lag += L + 0.9;
      const pos = (a, p) => { runAt(a / TAU * P, h, r, tmp); p[2] = zc + tmp[1]; p[0] = R.x(p[2]) + cx + ox + tmp[0]; p[1] = R.y(p[2]) - under + oy + ay * Math.sin(a * nW + p2); };
      const body = ['dolphin', L, 2.7, loopBody(pos, w, a0, { size: L / 2.7, maxCurve: 0.3, pitch: 1, bank: 1.2, rollA: 0.12, swim: 1, hz: 1.2, fhz: 0.5, e: 0.12 }), { seed: sd, reach: L * 0.18, big: 0.3, lead: k === 0 }];
      if (k < 2) specs.push(body); else if (m === 3) thirds.push(body);
    }
    zHi = zLo;
  }
  {
    // over the stepped plaza: [z, x, y] of the pair's loop. No crown stands under it: this pair sheds no leaves.
    const g = [-29, 19.5, 11.5], cz = g[0] + rD.range(-3, 3), cx0 = g[1] + rD.range(0, 1), cy0 = g[2] + rD.range(-0.3, 0.5);
    const az = rD.range(7.5, 9), ax = rD.range(3.9, 4.4), ay = rD.range(1.5, 2.1), p2 = rD() * TAU, w = (rD() < 0.5 ? -1 : 1) * TAU / rD.range(6.6, 8.2), a00 = rD() * TAU;
    for (let k = 0; k < 2; k++) {
      const L = rD.range(2.4, 3), ox = k * rD.range(0.2, 0.4), oy = k * rD.range(0.2, 0.4), a0 = a00 - Math.sign(w) * k * rD.range(0.9, 1.05);
      const pos = (f, p) => { const a = f - 0.25 * Math.sin(2 * f); p[2] = cz + az * Math.sin(a); p[0] = cx0 + ox + ax * Math.cos(a); p[1] = cy0 + oy + ay * Math.sin(2 * a + p2); };
      specs.push(['dolphin', L, 2.7, loopBody(pos, w, a0, { size: L / 2.7, maxCurve: 0.3, pitch: 1, bank: 1.2, rollA: 0.12, swim: 1, hz: 1.2, fhz: 0.5 }), { seed: rD(), reach: L * 0.18, big: 0.3 }]);
    }
  }
  // every place is dealt whatever the number asked: the pairs first, then the plaza's pair, then the threes' thirds
  [...specs, ...thirds].slice(0, n).forEach((b) => add(...b));
}

// ---------- what the city's shaders may call ----------
// NC: the number of bodies that cast (every body of the kinds that cast, always, in one fixed order)
const arwGlsl = (NC) => /* glsl */`
uniform vec3 arwSun; uniform float arwDark;
uniform vec4 arwB0[${NC}]; uniform vec4 arwB1[${NC}]; uniform vec4 arwB2[${NC}]; uniform vec4 arwB3[${NC}]; uniform vec4 arwC[${NC}];
// soft cover (x) and distance along the ray (y) of one ellipsoid (centre c, unit axes d and r, half sizes s) for a ray p + v t
vec2 arwEll(vec3 p, vec3 v, vec3 c, vec3 d, vec3 r, vec3 s, float soft){
  vec3 q = p - c, u = cross(d, r);
  vec3 ql = vec3(dot(q, d), dot(q, r), dot(q, u)) / max(s, vec3(.01)), vl = vec3(dot(v, d), dot(v, r), dot(v, u)) / max(s, vec3(.01));
  float t = -dot(ql, vl) / max(dot(vl, vl), 1e-6);
  vec3 m = ql + vl * max(t, 0.);
  return vec2((1. - smoothstep(1. - soft, 1. + soft, sqrt(max(dot(m, m), 0.)))) * step(0., t), t);
}
float arwShade(vec3 wp){
  float sh = 1.;
  for(int i = 0; i < ${NC}; i++){
    vec4 b0 = arwB0[i], b1 = arwB1[i], b2 = arwB2[i], b3 = arwB3[i];
    vec3 q = b0.xyz - wp; float along = dot(q, arwSun); vec3 off = q - arwSun * along;
    float rr = b0.w * 1.4 + 3., near = step(0., along) * step(dot(off, off), rr * rr) * step(.001, b2.w);
    if(near < .5) continue;
    float soft = clamp(.2 + along * .004, .2, .6);
    vec3 u = cross(b1.xyz, b2.xyz);
    float k = arwEll(wp, arwSun, b0.xyz + b1.xyz * b0.w * .2, b1.xyz, b2.xyz, vec3(b0.w * .8, b1.w, b1.w), soft).x;
    k = max(k, arwEll(wp, arwSun, b0.xyz - b1.xyz * b0.w * .5, b1.xyz, b2.xyz, vec3(b0.w * .5, b1.w * .42, b1.w * .55), soft).x);
    k = max(k, arwEll(wp, arwSun, b0.xyz - b1.xyz * b0.w * .93, b1.xyz, b2.xyz, vec3(b0.w * .14, b3.x, b1.w * .4), soft).x);
    k = max(k, arwEll(wp, arwSun, b0.xyz + b1.xyz * b3.z - u * b1.w * .6, b1.xyz, b2.xyz, vec3(b0.w * .17, b3.y, b1.w * .45), soft).x);
    sh *= 1. - k * near * b2.w * arwDark;
  }
  return sh;
}
vec4 arwMirror(vec3 wp, vec3 rd){
  vec4 res = vec4(0.); float best = 1e9;
  for(int i = 0; i < ${NC}; i++){
    vec4 b0 = arwB0[i], b1 = arwB1[i], b2 = arwB2[i], b3 = arwB3[i], cc = arwC[i];
    vec3 qb = b0.xyz - wp; float tq = dot(qb, rd); vec3 ob = qb - rd * tq; float rq = b0.w * 1.3 + 1.;
    if(tq < 0. || dot(ob, ob) > rq * rq || b2.w < .001) continue;
    vec3 u = cross(b1.xyz, b2.xyz);
    vec2 k = arwEll(wp, rd, b0.xyz, b1.xyz, b2.xyz, vec3(b0.w, b1.w, b1.w), .32);
    vec2 f = arwEll(wp, rd, b0.xyz + b1.xyz * b3.z - u * b1.w * .6, b1.xyz, b2.xyz, vec3(b0.w * .17, b3.y, b1.w * .45), .32);
    float cov = max(k.x, f.x), take = step(k.y, best) * step(.02, cov) * step(.001, b2.w);
    vec3 col = mix(cc.rgb * cc.w, cc.rgb, k.x * k.x);
    res = mix(res, vec4(col, cov * b2.w), take); best = mix(best, k.y, take);
  }
  return res;
}
float arwStir(vec3 wp){
  float s = 0.;
  for(int i = 0; i < ${NC}; i++){
    vec4 b0 = arwB0[i], b1 = arwB1[i];
    vec3 q = wp - b0.xyz; float rs = b0.w * 5.5 + b1.w * 2.2 + 3.;
    if(dot(q, q) > rs * rs) continue;
    float al = clamp(-dot(q, b1.xyz), -b0.w, b0.w * 5.);
    vec3 off = q + b1.xyz * al; float rad = b1.w * 2.2 + 2.5 + max(al, 0.) * .25;
    float k = (1. - smoothstep(rad * .4, rad, length(off))) * (1. - smoothstep(b0.w * 2., b0.w * 5., al));
    s = max(s, k * arwB2[i].w * arwB3[i].w);
  }
  return clamp(s, 0., 1.);
}
`;
// ---------- wakes in air: leaves drawn along behind the large animals, and a soft short trail of mist ----------
const WAKE_PRE = /* glsl */`
uniform vec4 uE0[24]; uniform vec4 uE1[24]; uniform float uTime;
uniform vec3 uSun, uSunCol, uSkyCol, uFogCol; uniform vec2 uFog;
`;
const LEAF_VERT = WAKE_PRE + /* glsl */`
attribute vec4 aL; varying vec3 vC; varying vec3 vW;
void main(){
  int id = int(aL.x + .5); vec4 e0 = uE0[id], e1 = uE1[id];
  float calm = step(e1.w, 0.), wl = abs(e1.w);
  float life = fract(uTime * (.05 + .03 * aL.y) * (1. - .55 * calm) + aL.z), r7 = fract(aL.y * 7.3), r3 = fract(aL.y * 3.1);
  vec3 dir = e1.xyz, side = normalize(cross(dir, vec3(0., 1., 0.)) + vec3(1e-4, 0., 1e-4)), up = cross(side, dir);
  float ang = aL.y * 61. + (uTime * (.8 + aL.y) * (1. - .72 * calm) + life * 5.) * (r3 > .5 ? 1. : -1.);
  float rad = mix((.3 + .7 * r7) * (e0.w * .3 + 1.) * (.5 + life), e0.w * .22 + 1.2 + 2.6 * r7, calm);
  vec3 c = e0.xyz - dir * (e0.w * (.7 + .5 * r3) * (1. - calm) + (life - .5 * calm) * wl) + (side * cos(ang) + up * sin(ang)) * rad;
  c.y -= life * life * 2.6 * (1. - calm);
  float ta = uTime * (1.6 + 3. * aL.y) + aL.z * 40.;
  vec3 ax = normalize(vec3(sin(aL.y * 20.), .5, cos(aL.y * 31.)));
  vec3 lx = normalize(cross(ax, vec3(.1, 1., .2))), ly = cross(ax, lx), a1 = lx * cos(ta) + ly * sin(ta);
  float sc = aL.w * smoothstep(0., .08, life) * (1. - smoothstep(.82, 1., life)) * step(.01, e0.w);
  vec3 w = c + (a1 * position.x + ax * position.y) * sc;
  vec3 n = normalize(cross(a1, ax));
  vec3 leaf = mix(vec3(.1, .2, .05), vec3(.66, .44, .08), smoothstep(.3, .8, r7));
  vC = leaf * (uSkyCol * .9 + uSunCol * (.3 + .7 * abs(dot(n, uSun)))); vW = w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}
`;
const LEAF_FRAG = /* glsl */`
uniform vec3 uFogCol; uniform vec2 uFog; varying vec3 vC; varying vec3 vW;
void main(){ float fd = length(cameraPosition - vW); gl_FragColor = vec4(mix(vC, uFogCol, smoothstep(uFog.x, uFog.y, fd) * .9), 1.); }
`;
// THE TRAIL OF DISTURBED AIR behind the flukes of a grown humpback and of the blue whale: soft and short. It begins
// at the flukes and is gone nine tenths of a body length behind them (e0.w is half the length); it widens from a
// third to a whole half length across and wavers a little with the tail; two faint veils crossed on its middle
// line (one in the flukes' plane, one upright), each soft to both of its edges and to both of its ends, each
// shown by its facing as a thin veil of mist is (on edge it shows nothing: no line). No turn round the animal.
const MIST_VERT = WAKE_PRE + /* glsl */`
attribute vec4 aM; varying vec2 vUv; varying vec3 vW, vF; varying float vK;
void main(){
  int id = int(aM.x + .5); vec4 e0 = uE0[id], e1 = uE1[id];
  float s = position.x, hand = aM.y;
  vec3 dir = e1.xyz, side = normalize(cross(dir, vec3(0., 1., 0.)) + vec3(1e-4, 0., 1e-4)), up = cross(side, dir);
  vec3 across = hand < 0. ? side : up, facing = hand < 0. ? up : side;
  float wide = e0.w * (.16 + .34 * s);
  vec3 c = e0.xyz - dir * (e0.w * 1.02 + s * e0.w * 1.8) + facing * sin(s * 4. - uTime * .7 + aM.z) * e0.w * .07 * s;
  vec3 w = c + across * position.y * wide;
  vUv = vec2(s, position.y); vW = w; vF = facing; vK = step(.01, e0.w) * aM.w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}
`;
const MIST_FRAG = /* glsl */`
uniform vec3 uSkyCol, uSunCol, uFogCol; uniform vec2 uFog; uniform float uTime; varying vec2 vUv; varying vec3 vW, vF; varying float vK;
void main(){
  float y = clamp(abs(vUv.y), 0., 1.), e = 1. - y * y; e *= e;
  float along = smoothstep(0., .22, vUv.x) * (1. - smoothstep(.3, 1., vUv.x));
  float uneven = .62 + .38 * sin(vUv.x * 7. + vUv.y * 2.3 - uTime * .5 + vK * 9.);
  vec3 toEye = cameraPosition - vW; float fd = length(toEye), face = smoothstep(.06, .45, abs(dot(normalize(vF), toEye / max(fd, 1e-3))));
  float a = e * along * uneven * .13 * vK * face * (1. - smoothstep(uFog.x, uFog.y * .5, fd));
  gl_FragColor = vec4((uFogCol * .9 + uSkyCol * .35 + uSunCol * .1), a);
}
`;
// A sleeper's shadow pool: a flat patch on the paving, black at half strength in its middle (the stone at half its
// tone), fading to nothing at its rim. It reads no lens and no clock.
const POOL_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }
`;
const POOL_FRAG = /* glsl */`
varying vec2 vUv;
void main(){ gl_FragColor = vec4(0., 0., 0., .5 * (1. - smoothstep(0., 1., length(vUv)))); }
`;
const toColor = (c, d) => (c == null ? new THREE.Color(d) : c.isColor ? c.clone() : Array.isArray(c) ? new THREE.Color(c[0], c[1], c[2]) : new THREE.Color(c));
const toVec = (v, d) => (v == null ? new THREE.Vector3(d[0], d[1], d[2]) : v.isVector3 ? v.clone() : new THREE.Vector3(v[0] ?? v.x, v[1] ?? v.y, v[2] ?? v.z));

// the towers of the sun's side as [z from, z to, x of the face, height]: the low sun passes only between them
const WEST_BLOCKS = [[150, 240, -40, 160], [35, 115, -40, 130], [-96, -8, -40, 170], [-262, -240, -26, 22], [240, 700, -40, 120]];
const EAST_BLOCKS = [[150, 700, 26, 120], [60, 150, 26, 180], [22, 60, 26, 45], [-50, -8, 40, 150], [-96, -50, 26, 200], [-222, -130, 26, 20], [-262, -240, 26, 24]];

export async function buildAnimals(ctx, opts = {}) {
  const env = opts.env || {}, core = ctx.core, object = new THREE.Group();
  const rGeo = core.makeRng(core.hashSeed('arw-animals-skins:' + ctx.seed)), rLeaf = core.makeRng(core.hashSeed('arw-animals-leaves:' + ctx.seed)), rEddy = core.makeRng(core.hashSeed('arw-animals-eddy:' + ctx.seed));
  const sun = toVec(env.sunDir, [-0.608, 0.156, -0.778]).normalize();
  const detail = ctx.quality?.detail ?? 1, dens = ctx.vary?.density ?? 1;
  const dolphins = Math.max(8, Math.min(14, Math.round(12 * (0.6 + 0.4 * detail) * (0.85 + 0.3 * (typeof dens === 'number' ? dens : 1)))));
  const { bodies, R } = arwCourses(core, ctx.seed, opts.path, opts.timeAt, { dolphins, arch: opts.arch, trees: opts.trees });
  const blocks = (env.sunBlocks || (sun.x < 0 ? WEST_BLOCKS : EAST_BLOCKS)).slice(0, 8);
  const blk = []; for (let i = 0; i < 8; i++) { const b = blocks[i] || [0, 0, 0, -1e4]; blk.push(new THREE.Vector4(b[0], b[1], b[2], b[3])); }
  const shared = {
    uSun: { value: sun }, uSunCol: { value: toColor(env.sunColor, '#ffb070') }, uSkyCol: { value: toColor(env.skyColor, '#8fa3c8') },
    uGroundCol: { value: toColor(env.groundColor, '#8a7c74') }, uFogCol: { value: toColor(env.fogColor, '#b9a9a6') },
    uFog: { value: new THREE.Vector2(env.fogNear ?? 120, env.fogFar ?? 900) }, uBlk: { value: blk }, uRare: { value: ctx.vary?.rare ? 1 : 0 }, uTime: { value: 0 },
  };
  const meshes = [], groups = {}, shadowCasters = [];
  let triangles = 0, drawCalls = 0;
  for (let ki = 0; ki < ORDER.length; ki++) {
    const kind = ORDER[ki], K = KINDS[kind], list = bodies.filter((b) => b.kind === kind);
    if (!list.length) continue;
    await ctx.yield();
    const G = K.geo(rGeo), n = list.length, ig = new THREE.InstancedBufferGeometry();
    for (const k of ['position', 'normal', 'color', 'aAnim', 'aPivot']) ig.setAttribute(k, G.geo.attributes[k]);
    ig.setIndex(G.geo.index);
    const iA = new Float32Array(n * 4);
    // the body's own number on the skins' stream is the humpback's alone (its skin's white reads it): no other
    // kind takes one
    list.forEach((b, i) => { b.slot = i; b.G = G; iA.set([i, b.seed, b.variant, kind === 'humpback' ? rGeo() : 0], i * 4); });
    ig.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); ig.instanceCount = n;
    const mk = () => { const a = []; for (let i = 0; i < n; i++) a.push(new THREE.Vector4(0, -500, 0, 0)); return a; };
    const u = {
      ...shared, uPos: { value: mk() }, uRot: { value: mk() }, uMisc: { value: mk() }, uLen: { value: G.L }, uFlk: { value: K.flk },
      uFinTall: { value: kind === 'orca' ? 0.95 : 0 }, uSwim: { value: new THREE.Vector4(...K.swim) }, uFin: { value: new THREE.Vector4(...K.fin) },
      uTop: { value: new THREE.Color(K.top) }, uBel: { value: new THREE.Color(K.bel) }, uEye: { value: new THREE.Vector3(Math.abs(G.eye[0]), G.eye[1], G.eye[2]) }, uWet: { value: K.wet },
      uCap: { value: new THREE.Vector3(...(K.cap || [40, 40, 40])) },
    };
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG_HEAD + SKIN[kind] + FRAG_MAIN, defines: { NB: n }, side: THREE.DoubleSide, vertexColors: true });
    mat.extensions = { derivatives: true };
    const mesh = new THREE.Mesh(ig, mat); mesh.frustumCulled = false; mesh.name = 'arw-' + kind; object.add(mesh);
    meshes.push(mesh); groups[kind] = { list, u, G, K }; triangles += G.tris * n; drawCalls++;
  }
  await ctx.yield();
  // wakes: which bodies shed leaves (every grown humpback, the blue whale, the orcas' leader, the first dolphin of
  // each group among the crowns), then the sleepers
  const emit = [];
  bodies.forEach((b, i) => { if (emit.length < 16 && ((b.kind === 'humpback' && !b.variant) || b.kind === 'blue' || (b.kind === 'orca' && b.variant) || (b.kind === 'dolphin' && b.lead))) emit.push(i); });
  bodies.forEach((b, i) => { if (emit.length < 22 && b.kind === 'sperm') emit.push(i); });
  const wakeU = { ...shared, uE0: { value: Array.from({ length: 24 }, () => new THREE.Vector4(0, -900, 0, 0)) },
    uE1: { value: Array.from({ length: 24 }, () => new THREE.Vector4(0, 0, 1, 1)) }, uTime: { value: 0 } };
  // leaves turning in the air where the blue whale's street crosses the avenue (z -96 to -130): a slow eddy round the
  // chord of the line across the crossing, 4.5 to 7 m from it (slot 22); it is always there
  const dB = new THREE.Vector3(R.x(-130) - R.x(-96), R.y(-130) - R.y(-96), -34).normalize();
  wakeU.uE0.value[22].set((R.x(-130) + R.x(-96)) / 2, (R.y(-130) + R.y(-96)) / 2, -113, 15); wakeU.uE1.value[22].set(dB.x, dB.y, dB.z, -34);
  {
    const out = [[0, -0.5], [0.42, -0.18], [0.24, 0.05], [0.4, 0.34], [0.12, 0.26], [0, 0.55], [-0.12, 0.26], [-0.4, 0.34], [-0.24, 0.05], [-0.42, -0.18]], pos = [0, 0, 0], idx = [];
    out.forEach((q, i) => { pos.push(q[0], q[1], 0); idx.push(0, i + 1, ((i + 1) % out.length) + 1); });
    const lg = new THREE.InstancedBufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.setIndex(idx);
    const aL = [];
    emit.forEach((bi, k) => { const b = bodies[bi], n = Math.round((b.kind === 'blue' ? 40 : b.kind === 'humpback' ? 32 : b.kind === 'dolphin' ? 18 : b.kind === 'sperm' ? 30 : 14) * (0.5 + 0.5 * detail)); for (let j = 0; j < n; j++) aL.push(k, rLeaf(), rLeaf(), rLeaf.range(0.2, 0.33)); });
    for (let j = 0, nB = Math.round(120 * (0.5 + 0.5 * detail)); j < nB; j++) aL.push(22, rEddy(), rEddy(), rEddy.range(0.17, 0.27));
    lg.setAttribute('aL', new THREE.InstancedBufferAttribute(new Float32Array(aL), 4)); lg.instanceCount = aL.length / 4;
    const leaves = new THREE.Mesh(lg, new THREE.ShaderMaterial({ uniforms: wakeU, vertexShader: LEAF_VERT, fragmentShader: LEAF_FRAG, side: THREE.DoubleSide }));
    leaves.frustumCulled = false; leaves.name = 'arw-leaves'; object.add(leaves); triangles += out.length * lg.instanceCount; drawCalls++;
    const NS = 24, mp = [], mi = [];
    for (let i = 0; i <= NS; i++) { mp.push(i / NS, -1, 0, i / NS, 1, 0); if (i < NS) mi.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); }
    const mg = new THREE.InstancedBufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3)); mg.setIndex(mi);
    const aM = [];
    emit.forEach((bi, k) => { const b = bodies[bi]; if (b.kind === 'humpback' || b.kind === 'blue') for (const hand of [-1, 1]) aM.push(k, hand, rLeaf() * TAU, rLeaf.range(0.7, 1)); });
    mg.setAttribute('aM', new THREE.InstancedBufferAttribute(new Float32Array(aM), 4)); mg.instanceCount = aM.length / 4;
    const mist = new THREE.Mesh(mg, new THREE.ShaderMaterial({ uniforms: wakeU, vertexShader: MIST_VERT, fragmentShader: MIST_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false }));
    mist.frustumCulled = false; mist.renderOrder = 3; mist.name = 'arw-mist';
    object.add(mist); triangles += NS * 2 * mg.instanceCount; drawCalls++;
  }
  // THE SLEEPERS' SHADOW POOLS: under every sleeper one flat round patch on the paving right below its place, 0.03 m
  // over the stone, reaching 1.5 times the body's greatest width from its middle. One mesh, always drawn: a fact
  // of the place.
  {
    const pp = [], pu = [], pi = [];
    for (const b of bodies) {
      if (b.pool == null) continue;
      const r = 1.5 * 2 * b.G.rb * b.L, n = pp.length / 3;
      for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pp.push(b.home[0] + c[0] * r, b.pool, b.home[2] + c[1] * r); pu.push(c[0], c[1]); }
      pi.push(n, n + 2, n + 1, n, n + 3, n + 2);
    }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); pg.setAttribute('uv', new THREE.Float32BufferAttribute(pu, 2)); pg.setIndex(pi);
    const pools = new THREE.Mesh(pg, new THREE.ShaderMaterial({ vertexShader: POOL_VERT, fragmentShader: POOL_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    pools.renderOrder = -1; pools.name = 'arw-pools'; object.add(pools); triangles += pi.length / 3; drawCalls++;
  }
  // the city's uniforms: EVERY body that casts, always, in the order made, as soft ellipsoids. The whales cast
  // (humpbacks and calf, the blue whale, the sleepers, the orcas); the dolphins cast none: chosen by kind.
  const casters = bodies.map((b, i) => i).filter((i) => bodies[i].kind !== 'dolphin'), NC = casters.length;
  const v4s = () => { const a = []; for (let i = 0; i < NC; i++) a.push(new THREE.Vector4(0, -900, 0, 0)); return a; };
  const uniforms = { arwSun: { value: sun }, arwDark: { value: 0.62 }, arwB0: { value: v4s() }, arwB1: { value: v4s() }, arwB2: { value: v4s() }, arwB3: { value: v4s() }, arwC: { value: v4s() } };
  const ground = shared.uGroundCol.value, sky = shared.uSkyCol.value;
  const mirrorCol = {}; const DARK = { humpback: 0.22, blue: 0.6, sperm: 0.5, orca: 0.12, dolphin: 0.5 };
  for (const kind of ORDER) { const c = new THREE.Color(KINDS[kind].bel); mirrorCol[kind] = [c.r * (ground.r * 0.9 + sky.r * 0.25), c.g * (ground.g * 0.9 + sky.g * 0.25), c.b * (ground.b * 0.9 + sky.b * 0.25), DARK[kind]]; }
  const st = bodies.map(() => ({ x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, curve: 0, phase: 0, fphase: 0, swim: 1, fade: 1, d: 0 }));
  const cam = new THREE.Vector3();
  const fwd = new THREE.Vector3(), left = new THREE.Vector3();
  const axes = (q) => {
    const cy = Math.cos(q.yaw), sy = Math.sin(q.yaw), cp = Math.cos(q.pitch), sp = Math.sin(q.pitch), cr = Math.cos(q.roll), sr = Math.sin(q.roll);
    fwd.set(sy * cp, sp, cy * cp);
    // local +x (the left) rolled, pitched, turned
    const lx = cr, ly = sr; left.set(lx * cy + (-ly * sp) * sy, ly * cp, -lx * sy + (-ly * sp) * cy);
  };
  function update(dt, time, camera) {
    // WHERE each animal is on its course follows the lens's place: tF is the film time at which the lens is at its
    // place on the route (read by z: the route runs north). HOW it moves (beats, roll, bobbing, leaves) runs on the
    // world's clock, so the animals are alive when the lens stands.
    const tb = time;
    if (camera) camera.getWorldPosition(cam); else cam.set(R.xs[0], R.ys[0], R.zs[0]);
    const tF = R.t(cam.z);
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i], q = st[i], g = groups[b.kind];
      b.at(tF, tb, q);
      g.u.uPos.value[b.slot].set(q.x, q.y, q.z, q.phase); g.u.uRot.value[b.slot].set(q.yaw, q.pitch, q.roll, q.curve);
      g.u.uMisc.value[b.slot].set(q.fade, q.swim, q.fphase, b.size * (0.02 + 0.98 * sstep(0, 0.25, q.fade)));
    }
    wakeU.uTime.value = tb; shared.uTime.value = tb;
    for (let k = 0; k < emit.length; k++) {
      const b = bodies[emit[k]], q = st[emit[k]]; axes(q);
      wakeU.uE0.value[k].set(q.x, q.y, q.z, q.fade > 0.02 ? b.L * 0.5 : 0); wakeU.uE1.value[k].set(fwd.x, fwd.y, fwd.z, b.kind === 'dolphin' ? 5 : b.kind === 'sperm' ? -b.L * 0.9 : b.L * 1.5);
    }
    for (let k = 0; k < NC; k++) {
      const i = casters[k], b = bodies[i], q = st[i], a = b.L * 0.5, rb = b.G.rb * b.L;
      axes(q);
      uniforms.arwB0.value[k].set(q.x, q.y, q.z, a); uniforms.arwB1.value[k].set(fwd.x, fwd.y, fwd.z, rb);
      uniforms.arwB2.value[k].set(left.x, left.y, left.z, q.fade);
      uniforms.arwB3.value[k].set(b.G.fl * b.L, b.G.fp * b.L, b.G.pz * b.L, b.big);
      const mc = mirrorCol[b.kind]; uniforms.arwC.value[k].set(mc[0], mc[1], mc[2], mc[3]);
    }
  }
  const eyeOf = (b, q, out) => { axes(q); const e = b.G.eye, L = b.L; return [q.x + fwd.x * e[2] * L + left.x * Math.abs(e[0]) * L, q.y + e[1] * L + fwd.y * e[2] * L, q.z + fwd.z * e[2] * L + left.z * Math.abs(e[0]) * L]; };
  const tmp = { ...st[0] };
  // an anchor takes the film time of the lens's place and, as its second argument, the world's clock: the body as
  // it is drawn; without the clock, the body's place with its bob left out. The two fixed ones are plain places.
  const anchorOf = (i, eye) => (time, clock) => { bodies[i].at(time, clock ?? null, tmp); return eye ? eyeOf(bodies[i], tmp) : [tmp.x, tmp.y, tmp.z]; };
  const first = (kind) => bodies.findIndex((b) => b.kind === kind);
  const mean = (kind) => { const l = bodies.filter((b) => b.kind === kind), s = [0, 0, 0]; l.forEach((b) => { for (let k = 0; k < 3; k++) s[k] += b.home[k] / l.length; }); return s; };
  // THE POD AHEAD: the pod whale the lens is coming up to, as one place that never jumps: the mean of the pod
  // whales' middles as drawn, each weighed by how far ahead of the lens it swims along the route (taken up from 8
  // to 22 m ahead, let go from 45 to 75 m), with a small weight on the route's own point 60 m ahead of the lens.
  const AHEAD = { on: [8, 22], off: [45, 75], far: 60, rest: 0.05 }, pod = bodies.filter((b) => b.kind === 'humpback'), pa = [0, 0, 0];
  const podAhead = (time, clock) => {
    const m0 = R.m(R.zAt(time)); let W = AHEAD.rest;
    R.at(m0 + AHEAD.far, pa);
    const s = [pa[0] * W, pa[1] * W, pa[2] * W];
    for (const b of pod) {
      b.at(time, clock ?? null, tmp);
      const d = R.m(tmp.z) - m0, w = sstep(AHEAD.on[0], AHEAD.on[1], d) * (1 - sstep(AHEAD.off[0], AHEAD.off[1], d));
      s[0] += tmp.x * w; s[1] += tmp.y * w; s[2] += tmp.z * w; W += w;
    }
    return [s[0] / W, s[1] / W, s[2] / W];
  };
  const anchors = { mother: anchorOf(first('humpback'), true), blue: anchorOf(first('blue')), sleepers: mean('sperm'), orcas: anchorOf(first('orca')), podAhead };
  update(0, 0, null);
  return { object, glsl: arwGlsl(NC), uniforms, shadowCasters, anchors, update, dispose() {}, triangles, drawCalls, bodies, route: R };
}
