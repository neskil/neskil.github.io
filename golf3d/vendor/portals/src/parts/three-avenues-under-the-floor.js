// HERO SET PIECE for "three-avenues-under-the-floor": the lit palace across the black lake, and the jewel-tree maker.
//
// buildHero(ctx, opts)  the palace: a plinth rising out of the water, a broad water stair up to a landing and a great
//   arched doorway (the portal seat), a central block with two tiers of tall arched windows, a set-back upper block,
//   a windowed drum and dome, long wings with roof terraces, end pavilions and two slim towers. Every window is drawn
//   in the shader: warm light, glazing bars and the soft turning shadows of dancers. Lantern strings run along the
//   terraces and the stair and pulse to a drum beat. A y-mirrored copy lies under the waterline (the lake is black
//   glass); its window pattern ripples.
//   LOCAL SPACE  origin on the waterline under the middle of the front, +Y up, the front faces +Z (the lake).
//   OPTS  water: true (default) draws a black water disc for the stand-alone viewer; lanterns: [hex, hex, hex];
//         festive: 0..1 (how many strings are lit and how hard they pulse).
//   ANCHORS  portal (centre of the doorway), sill (foot of the doorway), stairFoot, gaze.
//
// makeJewelKit(ctx)  shared uniforms, the three leaf metals, bark, the glow-point maker; jewelTreeGeometry(rng, o)
//   builds one tree (trunk, roots, boughs; leaves as folded kites with a tremble and a travelling glitter).
//   All materials are self-lit ShaderMaterials: the place has no sun, light comes from the leaves and the palace.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const GLSL_COMMON = /* glsl */`
float h11(float p){ p = fract(p*.1031); p *= p+33.33; p *= p+p; return fract(p); }
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec2 h22(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3 += dot(p3, p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
float vn2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
float fbm2(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vn2(p); p=p*2.03+vec2(17.1,9.2); a*=.5; } return s; }
vec3 hue(float h){ return clamp(abs(fract(h+vec3(0.,.6667,.3333))*6.-3.)-1., 0., 1.); }
uniform vec3 uFogCol; uniform float uFogDen;
vec3 fogged(vec3 c, float d, float k){ float f = 1.-exp(-max(d,0.)*uFogDen*k); return mix(c, uFogCol, clamp(f,0.,1.)); }
`;

// ---------------------------------------------------------------- geometry accumulators
// Tubes for wood: position, normal, uv (metres round, metres along).
class Tubes {
  constructor() { this.p = []; this.n = []; this.uv = []; this.idx = []; this.count = 0; }
  tube(pts, sides, vOff = 0) {
    const n = pts.length; let N = null, dist = vOff; const rows = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)], q = pts[i];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      if (!N) N = Math.abs(ty) > 0.9 ? [1, 0, 0] : [0, 1, 0];
      const d = N[0] * tx + N[1] * ty + N[2] * tz; let nx = N[0] - tx * d, ny = N[1] - ty * d, nz = N[2] - tz * d; const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl; ny /= nl; nz /= nl; N = [nx, ny, nz];
      const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
      if (i > 0) { const pr = pts[i - 1]; dist += Math.hypot(q[0] - pr[0], q[1] - pr[1], q[2] - pr[2]); }
      const row = this.count, r = q[3];
      for (let k = 0; k <= sides; k++) {
        const an = k / sides * TAU, c = Math.cos(an), s = Math.sin(an), ox = nx * c + bx * s, oy = ny * c + by * s, oz = nz * c + bz * s;
        this.p.push(q[0] + ox * r, q[1] + oy * r, q[2] + oz * r); this.n.push(ox, oy, oz); this.uv.push(k / sides * TAU * Math.max(r, 0.2), dist); this.count++;
      }
      rows.push(row);
    }
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) {
      const a = rows[i] + k, b = a + 1, c = rows[i + 1] + k + 1, d = rows[i + 1] + k;
      this.idx.push(a, d, c, a, c, b);
    }
  }
  toGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setIndex(this.idx);
    return g;
  }
  get triangles() { return this.idx.length / 3; }
}

// Leaves: each a folded kite of two triangles (six vertices). position = the stem point for all six; the shader builds the blade.
const LEAF_K = [[1, 0, 0], [1, 0.4, 1], [1, 1, 0], [-1, 0, 0], [-1, 1, 0], [-1, 0.4, 1]];
export class Leaves {
  // the four attributes are kept in typed arrays that double when full (no garbage for the collector while a world is being built)
  constructor(cap = 512) { this.cap = cap; this.p = new Float32Array(cap * 18); this.n = new Float32Array(cap * 18); this.ax = new Float32Array(cap * 18); this.cr = new Float32Array(cap * 24); this.count = 0; }
  // c: stem point, ax: unit direction stem -> tip, nrm: unit blade normal, len: metres, ph: 0..1
  add(c, ax, nrm, len, ph) {
    if (this.count === this.cap) {
      this.cap *= 2;
      for (const k of ['p', 'n', 'ax', 'cr']) { const a = new Float32Array(this.cap * (k === 'cr' ? 24 : 18)); a.set(this[k]); this[k] = a; }
    }
    const o = this.count * 18, q = this.count * 24, P = this.p, N = this.n, A = this.ax, C = this.cr;
    for (let i = 0; i < 6; i++) {
      const j = o + i * 3, k = q + i * 4, K = LEAF_K[i];
      P[j] = c[0]; P[j + 1] = c[1]; P[j + 2] = c[2]; N[j] = nrm[0]; N[j + 1] = nrm[1]; N[j + 2] = nrm[2]; A[j] = ax[0] * len; A[j + 1] = ax[1] * len; A[j + 2] = ax[2] * len;
      C[k] = K[0]; C[k + 1] = K[1]; C[k + 2] = ph; C[k + 3] = K[2];
    }
    this.count++;
  }
  toGeometry() {
    const g = new THREE.BufferGeometry(), n = this.count;
    g.setAttribute('position', new THREE.BufferAttribute(this.p.slice(0, n * 18), 3)); g.setAttribute('normal', new THREE.BufferAttribute(this.n.slice(0, n * 18), 3));
    g.setAttribute('aAx', new THREE.BufferAttribute(this.ax.slice(0, n * 18), 3)); g.setAttribute('aCr', new THREE.BufferAttribute(this.cr.slice(0, n * 24), 4));
    return g;
  }
}
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// ---------------------------------------------------------------- one jewel tree
// Returns { wood, leaves, height, radius, crown: [x,y,z] } in tree space (root at the origin, +Y up).
// o: height 28, spread 10, leaves 1800, leafLen 0.62, sides 8, clearY 10 (nothing hangs below this), detail 1 | 0
// One tree is made in pieces (a generator: it gives the page back between pieces when the caller asks it to), so that a
// world can build its trees without holding the page; the draws from rng come in the same order either way.
function* treeSteps(rng, o) {
  const H = o.height ?? 28, spread = o.spread ?? 10, nLeaf = o.leaves ?? 1800, leafLen = o.leafLen ?? 0.62, sides = o.sides ?? 8;
  const clearY = o.clearY ?? 10, detail = o.detail ?? 1, R0 = o.trunk ?? 1.15;
  const W = new Tubes(), clusters = [];
  const trunkH = H * rng.range(0.4, 0.46), lean = [rng.range(-0.8, 0.8), rng.range(-0.8, 0.8)], ph = rng.range(0, TAU);
  const trunkAt = (t) => [lean[0] * t * t + 0.3 * Math.sin(t * 5 + ph) * t, -1.2 + (trunkH + 1.2) * t, lean[1] * t * t + 0.3 * Math.cos(t * 4 + ph) * t];
  const tp = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12, q = trunkAt(t); tp.push([q[0], q[1], q[2], R0 * (1 + 0.9 * Math.pow(1 - t, 6)) * (1 - 0.34 * t) * (1 + 0.07 * Math.sin(t * 19 + ph) * Math.min(1, t * 4))]); }
  W.tube(tp, sides);
  // roots gripping the ground
  const nR = detail ? rng.int(5, 7) : 4, ra = rng.range(0, TAU);
  for (let i = 0; i < nR; i++) {
    const az = ra + i / nR * TAU + rng.range(-0.3, 0.3), L = rng.range(2.6, 4.4) * R0, cx = Math.cos(az), cz = Math.sin(az), wig = rng.range(-0.5, 0.5), pts = [];
    for (let k = 0; k <= 5; k++) {
      const t = k / 5, d = R0 * 0.55 + L * t, y = 1.9 * Math.pow(1 - t, 2.2) - 0.25 - 0.3 * t;
      pts.push([cx * d - cz * wig * t * t * 1.4, y, cz * d + cx * wig * t * t * 1.4, R0 * (0.5 * Math.pow(1 - t, 1.3) + 0.09)]);
    }
    W.tube(pts, detail ? 5 : 4);
  }
  yield;
  // boughs: out and up, then levelling, so that two ranks meet overhead
  const limb = (start, az, el, L, r0, depth) => {
    const cx = Math.cos(az), cz = Math.sin(az), pts = [], n = depth === 0 ? 6 : 4, bend = rng.range(-0.35, 0.35), sag = depth === 0 ? rng.range(0.15, 0.4) : rng.range(0, 0.3);
    for (let k = 0; k <= n; k++) {
      const t = k / n, h = L * Math.cos(el) * t, v = L * Math.sin(el) * (t - sag * t * t), sw = bend * L * t * t * 0.5;
      pts.push([start[0] + cx * h - cz * sw, start[1] + v, start[2] + cz * h + cx * sw, r0 * Math.pow(1 - t, 0.75) * 0.94 + r0 * 0.06 + 0.035]);
    }
    W.tube(pts, depth === 0 ? Math.max(4, sides - 2) : (detail ? 4 : 3));
    return pts;
  };
  const nL = detail ? rng.int(6, 8) : 5, a0 = rng.range(0, TAU);
  const crownR = (y) => spread * (0.35 + 0.65 * Math.sin(Math.PI * clamp((y - clearY) / (H - clearY), 0.02, 0.98)) ** 0.7);
  for (let i = 0; i < nL; i++) {
    const az = a0 + i / nL * TAU + rng.range(-0.25, 0.25), up = i % 2 === 0, t0 = up ? rng.range(0.8, 1) : rng.range(0.66, 0.84);
    const el = up ? rng.range(0.75, 1.15) : rng.range(0.3, 0.6), L = (up ? (H - trunkH) * rng.range(0.7, 0.92) : spread * rng.range(0.85, 1.12));
    const pts = limb(trunkAt(t0), az, el, L, R0 * (up ? 0.42 : 0.36), 0);
    for (const tk of detail ? [0.38, 0.6, 0.8, 1] : [0.5, 1]) {
      const k = tk * 6, i0 = Math.min(5, Math.floor(k)), f = k - i0, a = pts[i0], b = pts[i0 + 1];
      const q = [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
      if (tk < 1) {
        const sp = limb(q, az + rng.pick([-1, 1]) * rng.range(0.5, 1.2), rng.range(0.1, 0.9), spread * rng.range(0.32, 0.55), R0 * 0.15, 1), e = sp[sp.length - 1], m = sp[2];
        clusters.push([e[0], e[1], e[2], rng.range(2.3, 3.5)]);
        if (detail) clusters.push([m[0], m[1], m[2], rng.range(1.8, 2.7)]);
      } else clusters.push([q[0], q[1], q[2], rng.range(2.8, 3.9)]);
      if (detail && tk > 0.5) clusters.push([q[0] + rng.range(-1.5, 1.5), q[1] + rng.range(0.5, 2.2), q[2] + rng.range(-1.5, 1.5), rng.range(2.0, 3.0)]);
    }
    if (i % 2 === 1) yield;
  }
  // the crown: clusters filling the dome so the canopy is a mass, not a few balls
  for (let i = 0, n = detail ? 14 : 6; i < n; i++) {
    const y = lerp(clearY + 3.5, H - 2.5, Math.pow(rng(), 0.7)), az = rng.range(0, TAU), rr = crownR(y) * Math.sqrt(rng()) * 0.9;
    clusters.push([lean[0] + Math.cos(az) * rr, y, lean[1] + Math.sin(az) * rr, rng.range(2.4, 3.6)]);
  }
  // leaves: hung on the outside of every cluster, tips drooping
  const Lf = new Leaves(), per = Math.max(4, Math.round(nLeaf / clusters.length)); let done = 0;
  for (const c of clusters) {
    if (++done % 6 === 0) yield;
    const out0 = norm([c[0] - lean[0], (c[1] - (clearY + H) * 0.5) * 0.6, c[2] - lean[1]]);
    for (let k = 0; k < per; k++) {
      let dx = rng.gauss(), dy = rng.gauss() * 0.75, dz = rng.gauss(); const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
      const rr = c[3] * (0.55 + 0.45 * Math.cbrt(rng())), len = leafLen * rng.range(0.7, 1.35);
      const px = c[0] + dx * rr, py = Math.max(c[1] + dy * rr, clearY + len), pz = c[2] + dz * rr;
      const ax = norm([dx * 0.55 + out0[0] * 0.25 + rng.range(-0.35, 0.35), -0.95 + dy * 0.4 + rng.range(-0.3, 0.3), dz * 0.55 + out0[2] * 0.25 + rng.range(-0.35, 0.35)]);
      const nr = norm(cross(ax, norm([rng.range(-1, 1), rng.range(-0.3, 0.3), rng.range(-1, 1)])));
      Lf.add([px, py, pz], ax, nr, len, rng());
    }
  }
  yield;
  const wood = W.toGeometry();
  yield;
  const leaves = Lf.toGeometry();
  yield;
  wood.computeBoundingSphere(); leaves.computeBoundingSphere();
  yield;
  return { wood, leaves, height: H, radius: spread + 3, trunkTop: trunkAt(1), leafCount: Lf.count, woodTriangles: W.triangles, clusters };
}
export function jewelTreeGeometry(rng, o = {}) { const it = treeSteps(rng, o); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
// the same tree, with pause() awaited between its pieces (a world passes ctx.yield)
export async function jewelTreePaced(rng, o, pause) { const it = treeSteps(rng, o); let r = it.next(); while (!r.done) { await pause(); r = it.next(); } return r.value; }

// ---------------------------------------------------------------- a great bough that has come down
// Returns { wood, leaves } in its own space: the torn end at the origin, the bough lying along +X on the ground (y = 0), some
// of its branches flat on the floor and some standing up into the air, every leaf still on it.
// o: length 14, radius 0.8, leaves 520, leafLen 0.62, keep(x, y, z) -> false for a place (in the bough's own space) where no leaf may hang
export function jewelBoughGeometry(rng, o = {}) {
  const L = o.length ?? 14, R0 = o.radius ?? 0.8, nLeaf = o.leaves ?? 520, leafLen = o.leafLen ?? 0.62;
  const W = new Tubes(), Lf = new Leaves(), clusters = [], wob = rng.range(0, TAU), main = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10, r = R0 * (1 - 0.82 * t) + 0.06; main.push([L * t, r * 0.8 + 0.5 * Math.sin(t * 3.1) * t + 0.9 * t * t, 0.9 * Math.sin(t * 4 + wob) * t, r]); }
  W.tube(main, 8);
  // the torn end: long splinters
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU + rng.range(-0.3, 0.3), l = rng.range(0.8, 1.7), cy = R0 * 0.8, sy = Math.sin(a) * R0, sz = Math.cos(a) * R0;
    W.tube([[0.15, cy + sy * 0.6, sz * 0.6, 0.22], [-l * 0.5, cy + sy * 0.75, sz * 0.75, 0.13], [-l, cy + sy * 0.9 + rng.range(-0.1, 0.25), sz * 0.9, 0.02]], 4);
  }
  const nB = 7;
  for (let i = 0; i < nB; i++) {
    const t0 = 0.22 + 0.7 * i / (nB - 1), a = main[Math.round(t0 * 10)], side = i % 2 ? 1 : -1, up = rng.range(0.15, 1.05), len = rng.range(3.2, 5.6) * (1 - 0.3 * t0), fw = rng.range(0.3, 0.8), pts = [];
    for (let k = 0; k <= 4; k++) { const t = k / 4; pts.push([a[0] + fw * len * t, Math.max(a[1] + Math.sin(up) * len * t * (1 - 0.25 * t), 0.12), a[2] + side * Math.cos(up) * len * t, a[3] * 0.55 * (1 - 0.8 * t) + 0.04]); }
    W.tube(pts, 5);
    const e = pts[4], m = pts[2];
    clusters.push([e[0], e[1], e[2], rng.range(1.5, 2.3)], [m[0], m[1], m[2], rng.range(1.1, 1.7)]);
  }
  clusters.push([main[10][0], main[10][1], main[10][2], 2.2], [main[8][0], main[8][1], main[8][2], 1.6]);
  const per = Math.max(4, Math.round(nLeaf / clusters.length));
  for (const c of clusters) for (let k = 0; k < per; k++) {
    let dx = rng.gauss(), dy = rng.gauss() * 0.6, dz = rng.gauss(); const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
    const rr = c[3] * (0.4 + 0.6 * Math.cbrt(rng())), len = leafLen * rng.range(0.7, 1.3), py = Math.max(c[1] + dy * rr, 0.1);
    let ax = norm([dx * 0.6 + rng.range(-0.4, 0.4), -0.5 + dy * 0.5 + rng.range(-0.4, 0.4), dz * 0.6 + rng.range(-0.4, 0.4)]);
    if (py < len) ax = norm([ax[0], 0.05, ax[2]]);
    const nr = norm(cross(ax, norm([rng.range(-1, 1), rng.range(-0.3, 0.3), rng.range(-1, 1)])));
    const ph = rng();
    if (!o.keep || o.keep(c[0] + dx * rr, py, c[2] + dz * rr)) Lf.add([c[0] + dx * rr, py, c[2] + dz * rr], ax, nr, len, ph);
  }
  return { wood: W.toGeometry(), leaves: Lf.toGeometry(), length: L, leafCount: Lf.count };
}

// ---------------------------------------------------------------- the kit: uniforms, leaf metals, bark, glow points
// the leaf shower after a twig cracks: falling speeds (m/s, slowest and fastest leaf), drag (1/s) and the longest delay (s) before a leaf lets go
export const BURST = { fall: [4.4, 7.4], drag: 1.4, delay: 1.3 };
export const GLSL_SPECTRA = /* glsl */`
// small sliding spectra, as thrown by cut stones: q in metres, each cell may hold one short smear of pure hues
vec3 spectra(vec2 q, float t){
  q += vec2(t*.11, -t*.07);
  vec2 i = floor(q), f = fract(q); vec2 o = h22(i)*.5+.25;
  vec2 d = f-o; float a = h21(i+3.7)*6.2832; d = vec2(d.x*cos(a)+d.y*sin(a), -d.x*sin(a)+d.y*cos(a));
  float on = step(.5, h21(i+11.3))*(.6+.4*sin(t*1.3+h21(i)*40.));
  float m = (1.-smoothstep(0., .2, abs(d.x)))*(1.-smoothstep(0., .07, abs(d.y)));
  return hue(.62 - d.x*2.2 + h21(i)*.2)*m*on;
}`;

const LEAF_PARS_VERT = /* glsl */`
attribute vec3 aAx; attribute vec4 aCr;
uniform float uTime, uTremble, uWidth;
varying vec3 vN, vWp, vCr;
vec3 rotAbout(vec3 v, vec3 k, float a){ float c = cos(a), s = sin(a); return v*c + cross(k, v)*s + k*dot(k, v)*(1.-c); }
// blade(): the kite, built at stem point c from its axis (unit axn, length len) and normal n, rolled by ang about the axis
vec3 blade(vec3 c, vec3 axn, float len, vec3 n, float ang, out vec3 nOut){
  vec3 sd = cross(n, axn); float ca = cos(ang), sa = sin(ang);
  vec3 s2 = sd*ca + n*sa, n2 = n*ca - sd*sa;
  nOut = normalize(n2 - s2*aCr.x*.55);
  return c + axn*(aCr.y*len) + s2*(aCr.x*aCr.w*len*uWidth);
}`;
const LEAF_FRAG = /* glsl */`
uniform vec3 uLeaf, uShade; uniform float uKind, uTime, uGain; uniform vec4 uWave, uRing; uniform vec3 uRingO, uRingD; uniform vec2 uFar;
varying vec3 vN, vWp, vCr;
void main(){
  vec3 v = cameraPosition - vWp; float dist = length(v); v /= max(dist, 1e-4);
  if (dist > uFar.x && h21(gl_FragCoord.xy) < (dist - uFar.x)/max(uFar.y - uFar.x, 1.)) discard;
  vec3 n = normalize(vN + vec3(1e-5)); if (dot(n, v) < 0.) n = -n;
  float ndv = clamp(dot(n, v), 0., 1.), ph = vCr.z;
  vec3 r = reflect(-v, n);
  float e = .5+.5*sin(dot(r, vec3(2.3,1.1,2.9))*2.6 + ph*40.);
  float e2 = .5+.5*sin(dot(r, vec3(-1.7,2.6,1.3))*4.1 + ph*91. + uTime*.9);
  float lum = smoothstep(.15, .95, e*.65+e2*.35);
  float glint = clamp(e*e2, 0., 1.); glint = glint*glint*glint; glint *= glint;
  float wave = smoothstep(.5, 1., sin(dot(vWp, uWave.xyz) - uTime*uWave.w + sin(vWp.y*.21)*1.3));
  float rs = dot(vWp - uRingO, uRingD), rq = (rs - uRing.x)/max(uRing.z, 1.);
  float ring = exp(-min(rq*rq, 40.))*uRing.y;
  float rib = smoothstep(0., .14, abs(vCr.x));
  vec3 col;
  float deep = step(.62, h11(ph*57.3));
  if (uKind < 1.5) {
    col = mix(uShade*.1, uLeaf*.82, lum*lum)*(.55+.45*rib)*(1.-.6*deep) + uLeaf*glint*(2.4+3.*wave) + uLeaf*wave*.16;
  } else {
    vec3 sp = hue(ph*3.7 + dot(r, vec3(.9,.4,.7))*.9 + uTime*.04);
    float clear = .1 + .9*(1.-ndv)*(1.-ndv);
    col = uShade*.07 + uLeaf*clear*lum*.5*(1.-.5*deep) + mix(uLeaf, sp, .8)*glint*(3.4+4.*wave) + sp*(1.-rib)*.42*(.4+.6*lum) + uLeaf*wave*.14;
    col += hue(rs*.012 + ph*.3)*ring*(.3 + 1.5*lum*lum) + uLeaf*ring*.1;
  }
  gl_FragColor = vec4(fogged(col*uGain, dist, .55), 1.);
}`;

export function makeJewelKit(ctx, o = {}) {
  const U = {
    uTime: { value: 0 }, uFogCol: { value: new THREE.Color(o.fog ?? '#070a18') }, uFogDen: { value: o.fogDensity ?? 0.0021 },
    uRing: { value: new THREE.Vector4(-1e5, 0, 26, 0) }, uRingO: { value: new THREE.Vector3() }, uRingD: { value: new THREE.Vector3(0, 0, -1) },
    uMinAng: { value: 0.003 }, uFar: { value: new THREE.Vector2(o.farA ?? 250, o.farB ?? 300) },
  };
  const METALS = {
    silver: { leaf: new THREE.Color('#cfd8ff'), shade: new THREE.Color('#8fa0d8'), kind: 0, gain: 1.0 },
    gold: { leaf: new THREE.Color('#ffcc55'), shade: new THREE.Color('#b8791c'), kind: 1, gain: 0.8 },
    diamond: { leaf: new THREE.Color('#f3fbff'), shade: new THREE.Color('#9fc8ee'), kind: 2, gain: 1.0 },
  };
  const leafUniforms = (m, t, extra = {}) => ({
    uTime: U.uTime, uFogCol: U.uFogCol, uFogDen: U.uFogDen, uRing: U.uRing, uRingO: U.uRingO, uRingD: U.uRingD, uFar: U.uFar,
    uLeaf: { value: METALS[m].leaf }, uShade: { value: METALS[m].shade }, uKind: { value: METALS[m].kind }, uGain: { value: METALS[m].gain * (t.gain ?? 1) },
    uTremble: { value: t.tremble ?? 1 }, uWidth: { value: t.width ?? 0.42 },
    uWave: { value: new THREE.Vector4(...(t.wave ?? [0.05, 0.11, -0.085, 1.5])) }, ...extra,
  });
  // canopy and litter leaves (instanced or not)
  const leafMaterial = (metal, t = {}) => new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: leafUniforms(metal, t),
    vertexShader: LEAF_PARS_VERT + /* glsl */`
void main(){
  #ifdef USE_INSTANCING
    mat4 mm = modelMatrix*instanceMatrix;
  #else
    mat4 mm = modelMatrix;
  #endif
  float len = length(aAx); vec3 axn = aAx/max(len, 1e-4); float ph = aCr.z*6.2832;
  vec3 wc = (mm*vec4(position, 1.)).xyz;
  float ang = (sin(uTime*(2.+3.2*aCr.z) + ph*7. + wc.x*.31 + wc.z*.27)*.6 + sin(uTime*7.3 + ph*13.)*.2)*uTremble;
  vec3 nn; vec3 p = blade(position, axn, len, normal, ang, nn);
  vec4 wp = mm*vec4(p, 1.);
  vN = normalize(mat3(mm)*nn); vWp = wp.xyz; vCr = vec3(aCr.x*aCr.w, aCr.y, aCr.z);
  gl_Position = projectionMatrix*viewMatrix*wp;
}`,
    fragmentShader: GLSL_COMMON + LEAF_FRAG,
  });
  // leaves that fall for ever inside a column: position = (x, top y, z) in world, they drop uFall metres and start again
  const fallingMaterial = (metal, t = {}) => new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: leafUniforms(metal, t, { uFall: { value: t.fall ?? 22 }, uFloor: { value: t.floor ?? 0 }, uAmount: { value: 1 } }),
    vertexShader: GLSL_COMMON.split('uniform vec3 uFogCol')[0] + LEAF_PARS_VERT + /* glsl */`
uniform float uFall, uFloor, uAmount;
void main(){
  float pz = aCr.z, sp = mix(1.0, 2.3, h11(pz*71.3)), ph = pz*6.2832;
  float drop = mod(uTime*sp + pz*uFall*7., uFall);
  vec3 c = position; c.y -= drop;
  c.x += sin(uTime*.8 + ph*5.)*1.3 + sin(uTime*.33 + ph*11.)*.8; c.z += cos(uTime*.66 + ph*7.)*1.3;
  float len = length(aAx); vec3 axn = aAx/max(len, 1e-4);
  vec3 k = normalize(vec3(h11(pz*13.1)-.5, .35, h11(pz*29.7)-.5));
  float a = uTime*(1.1+1.6*h11(pz*5.3)) + ph*3.;
  axn = rotAbout(axn, k, a); vec3 n = rotAbout(normal, k, a);
  float show = smoothstep(0., 1.5, drop)*smoothstep(uFloor, uFloor+.8, c.y)*step(h11(pz*91.7), uAmount);
  vec3 nn; vec3 p = blade(c, axn, len*show, n, sin(uTime*3.+ph)*.5, nn);
  vN = nn; vWp = p; vCr = vec3(aCr.x*aCr.w, aCr.y, pz);
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
}`,
    fragmentShader: GLSL_COMMON + LEAF_FRAG,
  });
  // the shower after the twig cracks: position = where the twig was, aAx.xyz*len as usual, normal = blade normal;
  // uBurst = seconds since the crack (keyed to the flight's progress by the world), below 0 nothing shows
  const burstMaterial = (metal, t = {}) => new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: leafUniforms(metal, t, { uBurst: { value: -1 }, uFloor: { value: t.floor ?? 0 } }),
    vertexShader: GLSL_COMMON.split('uniform vec3 uFogCol')[0] + LEAF_PARS_VERT + /* glsl */`
uniform float uBurst, uFloor;
void main(){
  float pz = aCr.z, ph = pz*6.2832, tau = uBurst - h11(pz*37.1)*${BURST.delay.toFixed(2)};
  float tt = max(tau, 0.), kd = ${BURST.drag.toFixed(2)}, glide = (1.-exp(-tt*kd))/kd;
  vec3 vel = vec3(h11(pz*17.3)-.5, h11(pz*23.9)*.5, h11(pz*41.1)-.5)*vec3(4., 5., 4.);
  vec3 c = position + vel*glide; c.y -= mix(${BURST.fall[0].toFixed(2)}, ${BURST.fall[1].toFixed(2)}, h11(pz*7.7))*(tt - glide);
  c.x += sin(tt*1.7 + ph*5.)*.25*min(tt, 2.); c.z += cos(tt*1.3 + ph*9.)*.25*min(tt, 2.);
  float rest = step(c.y, uFloor + .06); c.y = max(c.y, uFloor + .06);
  float len = length(aAx); vec3 axn = aAx/max(len, 1e-4);
  vec3 k = normalize(vec3(h11(pz*13.1)-.5, .35, h11(pz*29.7)-.5));
  float a = (tt*(2.+2.*h11(pz*5.3)) + ph*3.)*(1.-rest);
  axn = rotAbout(axn, k, a); vec3 n = rotAbout(normal, k, a);
  axn = normalize(mix(axn, normalize(vec3(axn.x, 0., axn.z) + vec3(1e-4)), rest)); n = normalize(mix(n, vec3(0., 1., 0.), rest*.9));
  float show = step(0., tau);
  vec3 nn; vec3 p = blade(c, axn, len*show, n, 0., nn);
  vN = nn; vWp = p; vCr = vec3(aCr.x*aCr.w, aCr.y, pz);
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
}`,
    fragmentShader: GLSL_COMMON + LEAF_FRAG,
  });
  // bark: dark and old, lit from the leaves above and by what the leaf litter throws back
  const woodMaterial = (metal, t = {}) => new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uFogCol: U.uFogCol, uFogDen: U.uFogDen, uFar: U.uFar, uGlow: { value: METALS[metal].leaf }, uSpectra: { value: metal === 'diamond' ? 1 : 0 }, uCanopy: { value: t.canopy ?? 12 }, uLift: { value: t.lift ?? 1 } },
    vertexShader: /* glsl */`
varying vec3 vN, vWp; varying vec2 vUv; varying float vY;
void main(){
  #ifdef USE_INSTANCING
    mat4 mm = modelMatrix*instanceMatrix;
  #else
    mat4 mm = modelMatrix;
  #endif
  vec4 wp = mm*vec4(position, 1.); vN = normalize(mat3(mm)*normal); vWp = wp.xyz; vUv = uv; vY = position.y;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`,
    fragmentShader: GLSL_COMMON + GLSL_SPECTRA + /* glsl */`
uniform vec3 uGlow; uniform float uTime, uSpectra, uCanopy, uLift; uniform vec2 uFar;
varying vec3 vN, vWp; varying vec2 vUv; varying float vY;
void main(){
  vec3 v = cameraPosition - vWp; float dist = length(v); v /= max(dist, 1e-4);
  if (dist > uFar.x && h21(gl_FragCoord.xy) < (dist - uFar.x)/max(uFar.y - uFar.x, 1.)) discard;
  vec3 n = normalize(vN + vec3(1e-5));
  float rg = fbm2(vec2(vUv.x*2.4, vUv.y*.3));
  // old bark: deep furrows running up the stem and thick plates between them. The furrow's slope round the stem tilts the
  // normal, so the plates take the light on one flank and stand in their own shade on the other
  float fur = vn2(vec2(vUv.x*3.6 + rg*1.6, vUv.y*.24)), fur2 = vn2(vec2((vUv.x + .09)*3.6 + rg*1.6, vUv.y*.24)), fine = vn2(vec2(vUv.x*12., vUv.y*1. + rg*3.));
  float furrow = smoothstep(.26, .62, fur)*(.62+.38*fine), furrow2 = smoothstep(.26, .62, fur2)*(.62+.38*fine);
  float knots = smoothstep(.62, .8, vn2(vec2(vUv.x*.9 + 7., vUv.y*.55)));
  n = normalize(n - normalize(cross(vec3(0., 1., 0.), n) + vec3(1e-4))*(furrow2 - furrow)*5.);
  vec3 bark = mix(vec3(.016,.014,.02), vec3(.13,.105,.1), rg)*(.12+.88*furrow)*(1.-.5*knots);
  float top = clamp(n.y*.5+.5, 0., 1.), hgt = smoothstep(1., uCanopy, vY), low = 1.-smoothstep(-.5, 4., vY);
  float form = .5 + .75*clamp(dot(n, normalize(v + vec3(0., .9, 0.))), 0., 1.);
  vec3 light = uGlow*(.22 + .95*hgt*(.3+.7*top) + .5*low*(1.-.6*top))*form;
  float rim = 1.-clamp(dot(n, v), 0., 1.); rim = rim*rim*rim;
  vec3 col = bark*light*1.6*uLift + uGlow*rim*(.035+.11*hgt)*uLift*(.35+.65*furrow);
  col += spectra(vWp.xz*.6 + vWp.y*.45, uTime)*uSpectra*(.35+.65*top)*.5;
  gl_FragColor = vec4(fogged(col, dist, 1.), 1.);
}`,
  });

  // glow points: list of { p, c, size, ph, kind, s, mirror }   kind 0 lamp, 1 string bulb (pulses run along s), 2 twinkling glint
  const makeSparks = (list, t = {}) => {
    const n = list.length, g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    const P = new Float32Array(n * 3), C = new Float32Array(n * 3), A = new Float32Array(n * 4), M = new Float32Array(n);
    list.forEach((q, i) => {
      P.set(q.p, i * 3); C.set(q.c, i * 3); A.set([q.size ?? 1, q.ph ?? 0, q.kind ?? 0, q.s ?? 0], i * 4); M[i] = q.mirror ? 1 : 0;
    });
    const aP = new THREE.InstancedBufferAttribute(P, 3);
    g.setAttribute('iPos', aP); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(C, 3));
    g.setAttribute('iPar', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iM', new THREE.InstancedBufferAttribute(M, 1));
    g.instanceCount = n;
    const uniforms = { uTime: U.uTime, uFogCol: U.uFogCol, uFogDen: U.uFogDen, uMinAng: U.uMinAng, uBeat: { value: t.beat ?? 1.6 }, uPulse: { value: t.pulse ?? 0.7 }, uGain: { value: t.gain ?? 1 }, uFogK: { value: t.fogK ?? 0.35 } };
    const m = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
attribute vec3 iPos, iCol; attribute vec4 iPar; attribute float iM;
uniform float uTime, uMinAng, uBeat, uPulse, uGain, uFogK, uFogDen;
varying vec2 vQ; varying vec3 vC; varying float vK;
float hs(float p){ p = fract(p*.1031); p *= p+33.33; p *= p+p; return fract(p); }
void main(){
  vec4 mv = viewMatrix*modelMatrix*vec4(iPos, 1.);
  float d = max(-mv.z, .01), sz = iPar.x, s = max(sz, d*uMinAng), k = (sz*sz)/(s*s);
  float ph = iPar.y, a = 1.;
  if (iPar.z < .5) a = .82 + .18*sin(uTime*(5.+4.*hs(ph)) + ph*30.)*sin(uTime*2.3 + ph*11.);
  else if (iPar.z < 1.5) { float b = .5+.5*sin(6.2832*(uTime*uBeat - iPar.w*.11)); b *= b; b *= b; a = (1.-uPulse*.6) + uPulse*1.9*b; }
  else { float tw = .5+.5*sin(uTime*(.7+1.6*hs(ph*3.)) + ph*50.); tw *= tw; tw *= tw; a = .12 + 1.5*tw*tw; }
  vec2 q = position.xy; vQ = q; vK = iM;
  mv.xy += q*s*vec2(1., 1.+iM*1.1);
  float deep = mix(1., exp(clamp((modelMatrix*vec4(iPos, 1.)).y, -400., 0.)*.02), iM);
  vC = iCol*a*k*uGain*exp(-d*uFogDen*uFogK)*(1.-iM*.6)*deep;
  gl_Position = projectionMatrix*mv;
}`,
      fragmentShader: /* glsl */`
varying vec2 vQ; varying vec3 vC; varying float vK;
void main(){
  float r2 = dot(vQ, vQ); float g = exp(-r2*5.5) + .35*exp(-r2*1.7); g *= clamp(1.-r2, 0., 1.);
  gl_FragColor = vec4(vC*g, 1.);
}`,
    });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = t.renderOrder ?? 6;
    return { mesh, uniforms, positions: P, attribute: aP, count: n };
  };

  const update = (time, camera, renderer) => {
    U.uTime.value = time;
    if (camera && renderer) { const sz = renderer.getDrawingBufferSize(_sz); U.uMinAng.value = 1.7 * 2 * Math.tan((camera.fov || 60) * Math.PI / 360) / Math.max(sz.y, 1); }
  };
  return { U, METALS, leafMaterial, fallingMaterial, burstMaterial, woodMaterial, makeSparks, update };
}
const _sz = new THREE.Vector2();

// ---------------------------------------------------------------- the palace: geometry
// Material ids: 0 stone, 1 wall with arched windows, 2 roof, 3 gilt trim, 4 steps and floors, 5 glow, 6 the hall behind the door
class PB {
  constructor() { this.p = []; this.n = []; this.uv = []; this.a = []; this.b = []; this.idx = []; this.count = 0; this.A = [0, 1, 0, 0]; this.B = [0, 0, 1, 0]; }
  mat(m, lit = 1) { this.A = [m, 1, 0, 0]; this.B = [0, 0, lit, 0]; return this; }
  win(cell, halfW, wb, wt, seed, lit = 1) { this.A = [1, cell, halfW, wb]; this.B = [wt, seed, lit, 0]; return this; }
  v(q, nx, ny, nz, u, v, cell) {
    this.p.push(q[0], q[1], q[2]); this.n.push(nx, ny, nz); this.uv.push(u, v);
    this.a.push(this.A[0], cell ?? this.A[1], this.A[2], this.A[3]); this.b.push(this.B[0], this.B[1], this.B[2], this.B[3]);
    return this.count++;
  }
  // corners counter-clockwise seen from outside; uv = [u0, v0, u1, v1] (default: metres from A)
  quad(A, B, C, D, uv, cell, nrm) {
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = D[0] - A[0], vy = D[1] - A[1], vz = D[2] - A[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const q = uv || [0, 0, Math.hypot(ux, uy, uz), Math.hypot(vx, vy, vz)], N = nrm || [[nx, ny, nz], [nx, ny, nz], [nx, ny, nz], [nx, ny, nz]];
    const a = this.v(A, N[0][0], N[0][1], N[0][2], q[0], q[1], cell), b = this.v(B, N[1][0], N[1][1], N[1][2], q[2], q[1], cell);
    const c = this.v(C, N[2][0], N[2][1], N[2][2], q[2], q[3], cell), d = this.v(D, N[3][0], N[3][1], N[3][2], q[0], q[3], cell);
    this.idx.push(a, b, c, a, c, d);
  }
  fit(width) { return this.A[0] === 1 ? width / Math.max(1, Math.round(width / this.A[1])) : undefined; }
  // wall in a plane z = const facing +Z (face 1) or -Z (face -1); windows are fitted to its width
  wallX(x0, x1, y0, y1, z, face = 1) {
    const w = x1 - x0, c = this.fit(w);
    if (face > 0) this.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, w, y1 - y0], c);
    else this.quad([x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z], [0, 0, w, y1 - y0], c);
  }
  // wall in a plane x = const facing +X (face 1) or -X
  wallZ(z0, z1, y0, y1, x, face = 1) {
    const w = z1 - z0, c = this.fit(w);
    if (face > 0) this.quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], [0, 0, w, y1 - y0], c);
    else this.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], [0, 0, w, y1 - y0], c);
  }
  top(x0, z0, x1, z1, y) { this.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [x0, z0, x1, z1]); }
  box(x0, y0, z0, x1, y1, z1, o = {}) {
    this.wallX(x0, x1, y0, y1, z1, 1); if (o.back !== false) this.wallX(x0, x1, y0, y1, z0, -1);
    this.wallZ(z0, z1, y0, y1, x1, 1); this.wallZ(z0, z1, y0, y1, x0, -1);
    if (o.top !== false) this.top(x0, z0, x1, z1, y1);
  }
  // surface of revolution; prof = [[r, y], ...] bottom to top; windows fit the circumference; flat: facet normals
  lathe(cx, cz, prof, seg, o = {}) {
    const rot = o.rot ?? 0;
    for (let j = 0; j < prof.length - 1; j++) {
      const [r0, y0] = prof[j], [r1, y1] = prof[j + 1], C = TAU * Math.max(r0, r1), cell = this.fit(C), sl = Math.hypot(r1 - r0, y1 - y0) || 1, ny = (r0 - r1) / sl, nr = (y1 - y0) / sl;
      for (let k = 0; k < seg; k++) {
        const a0 = rot + k / seg * TAU, a1 = rot + (k + 1) / seg * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const A = [cx + s0 * r0, y0, cz + c0 * r0], B = [cx + s1 * r0, y0, cz + c1 * r0], Cc = [cx + s1 * r1, y1, cz + c1 * r1], D = [cx + s0 * r1, y1, cz + c0 * r1];
        const n0 = [s0 * nr, ny, c0 * nr], n1 = [s1 * nr, ny, c1 * nr];
        const u0 = o.ribs ? k / seg * o.ribs : k / seg * C, u1 = o.ribs ? (k + 1) / seg * o.ribs : (k + 1) / seg * C;
        this.quad(A, B, Cc, D, [u0, o.v0 ?? (y0 - prof[0][1]), u1, o.v0 !== undefined ? o.v0 + sl : (y1 - prof[0][1])], cell, o.flat ? null : [n0, n1, n1, n0]);
      }
    }
  }
  toGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setAttribute('aA', new THREE.Float32BufferAttribute(this.a, 4)); g.setAttribute('aB', new THREE.Float32BufferAttribute(this.b, 4));
    g.setIndex(this.idx);
    return g;
  }
  get triangles() { return this.idx.length / 3; }
}

export const PALACE = { sill: 6.3, doorHalf: 5.1, portalW: 9.4, portalH: 14, doorZ: 4, stairFootZ: 60, landZ: 20, width: 164, height: 92 };

async function palaceGeometry(rng, lanternCols, ctx) {
  const b = new PB(), L = [], yT = 6, sd = () => rng.range(0, 50);
  const gold = lin('#ffd9a0');
  const lamp = (x, y, z, size, c = gold, kind = 0) => L.push({ p: [x, y, z], c, size, kind, ph: rng() });
  // a string of bulbs from A to B with a sag; s0 = where it sits in the run of the music
  const string = (A, B, sag, s0, step = 1.5) => {
    const len = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), n = Math.max(2, Math.round(len / step));
    for (let k = 0; k <= n; k++) {
      const t = k / n, c = lanternCols[(Math.round(s0 / step) + k) % lanternCols.length];
      L.push({ p: [lerp(A[0], B[0], t), lerp(A[1], B[1], t) - sag * 4 * t * (1 - t), lerp(A[2], B[2], t)], c, size: 0.62, kind: 1, s: s0 + t * len, ph: rng() });
    }
    return s0 + len;
  };
  const post = (x, y, z, h, s = 1) => {
    b.mat(0, 0.8); b.box(x - 0.2 * s, y, z - 0.2 * s, x + 0.2 * s, y + h, z + 0.2 * s, { top: false });
    b.mat(5, 1); b.box(x - 0.42 * s, y + h, z - 0.42 * s, x + 0.42 * s, y + h + 0.95 * s, z + 0.42 * s);
    b.mat(2, 1); b.lathe(x, z, [[0.75 * s, y + h + 0.95 * s], [0.05, y + h + 1.7 * s]], 4, { rot: Math.PI / 4, flat: true });
    lamp(x, y + h + 0.5 * s, z, 1.5 * s);
  };

  // ---- central block
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? PALACE.doorHalf : -27, x1 = sx > 0 ? 27 : -PALACE.doorHalf;
    b.win(7.3, 2.1, 2.3, 13.6, sd(), 1.15); b.wallX(x0, x1, yT, 22, 4);
    b.win(6.8, 1.9, 2.3, 13.6, sd(), 0.9); b.wallZ(-30, 4, yT, 22, sx * 27, sx);
    b.win(6.8, 1.8, 2.0, 11.0, sd(), 0.8); b.wallZ(-30, 4, 22, 35, sx * 27, sx);
    b.mat(0, 0.7); b.wallZ(-30, 4, -2, yT, sx * 27, sx);
  }
  b.win(7.7, 2.0, 2.0, 11.0, sd(), 1.0); b.wallX(-27, 27, 22, 35, 4);
  b.mat(0, 0.5); b.wallX(-27, 27, -2, 35, -30, -1);
  // the doorway: spandrels over the arch, gilt archivolt, glowing reveal, and the lit hall behind
  const dh = PALACE.doorHalf, spring = PALACE.sill + PALACE.portalH - PALACE.portalW / 2 + 0.3, nA = 14;
  for (let i = 0; i < nA; i++) {
    const a0 = Math.PI * i / nA, a1 = Math.PI * (i + 1) / nA, p0 = [dh * Math.cos(a0), spring + dh * Math.sin(a0)], p1 = [dh * Math.cos(a1), spring + dh * Math.sin(a1)];
    b.mat(0, 1.25); b.quad([p1[0], p1[1], 4], [p0[0], p0[1], 4], [p0[0], 22, 4], [p1[0], 22, 4]);
    const q0 = [(dh + 1.0) * Math.cos(a0), spring + (dh + 1.0) * Math.sin(a0)], q1 = [(dh + 1.0) * Math.cos(a1), spring + (dh + 1.0) * Math.sin(a1)];
    b.mat(3, 1.5); b.quad([p1[0], p1[1], 4.2], [p0[0], p0[1], 4.2], [q0[0], q0[1], 4.2], [q1[0], q1[1], 4.2]);
    b.mat(5, 1.3); b.quad([p0[0], p0[1], 4.2], [p1[0], p1[1], 4.2], [p1[0], p1[1], -2], [p0[0], p0[1], -2]);
  }
  for (const sx of [-1, 1]) {
    b.mat(5, 1.3); b.wallZ(-2, 4.2, yT, spring, sx * dh, -sx);
    b.mat(3, 1.5); b.wallX(sx > 0 ? dh : -dh - 1, sx > 0 ? dh + 1 : -dh, yT, spring, 4.2);
  }
  b.mat(6, 1); b.wallX(-dh, dh, yT, spring + dh, -2);
  b.mat(5, 0.8); b.top(-dh, -2, dh, 4.2, yT + 0.02);
  // cornice, parapet, roof terrace
  b.mat(3, 0.9); b.box(-28, 35, -31, 28, 36.1, 5);
  b.mat(0, 0.75); b.box(-27.6, 36.1, 4.1, 27.6, 37.3, 4.6);
  for (const sx of [-1, 1]) b.box(sx > 0 ? 27.1 : -27.6, 36.1, -30.6, sx > 0 ? 27.6 : -27.1, 37.3, 4.6);
  await ctx.yield();
  // ---- upper block, drum, dome, lantern
  b.win(6.3, 1.8, 1.6, 11.2, sd(), 0.85); b.wallX(-19, 19, 36.1, 50, -3);
  for (const sx of [-1, 1]) { b.win(6.0, 1.7, 1.6, 11.2, sd(), 0.7); b.wallZ(-27, -3, 36.1, 50, sx * 19, sx); }
  b.mat(3, 0.8); b.box(-19.8, 50, -27.8, 19.8, 51, -2.2);
  b.win(6.3, 1.6, 1.2, 7.4, sd(), 0.8); b.lathe(0, -15, [[12, 51], [12, 59.5]], 36);
  b.mat(3, 0.8); b.lathe(0, -15, [[12, 59.5], [12.9, 59.9], [12.9, 60.7], [12.2, 61]], 36);
  const dome = []; for (let i = 0; i <= 9; i++) { const a = i / 9 * Math.PI / 2; dome.push([12.2 * Math.pow(Math.cos(a), 0.8) + 0.9 * Math.sin(a), 61 + 15.5 * Math.pow(Math.sin(a), 0.92)]); }
  b.mat(2, 1); b.lathe(0, -15, dome, 36, { ribs: 12 });
  b.win(2.9, 0.8, 0.8, 4.6, sd(), 1.4); b.lathe(0, -15, [[2.8, 76], [2.8, 81.5]], 12);
  b.mat(2, 1); b.lathe(0, -15, [[3.5, 81.5], [1.2, 85], [0.35, 87], [0.05, 92]], 12, { ribs: 6 });
  lamp(0, 79, -15, 7, mul3(gold, 1.3));
  await ctx.yield();
  // ---- wings, pavilions, slim towers, corner turrets
  for (const sx of [-1, 1]) {
    const X = (x) => sx * x, wx = (x0, x1, y0, y1, z, f = 1) => b.wallX(Math.min(X(x0), X(x1)), Math.max(X(x0), X(x1)), y0, y1, z, f);
    const bx = (x0, y0, z0, x1, y1, z1, o) => b.box(Math.min(X(x0), X(x1)), y0, z0, Math.max(X(x0), X(x1)), y1, z1, o);
    // plinth with water gates, promenade and its balustrade
    b.win(5.5, 1.45, 2.0, 5.9, sd(), 0.75); wx(16, 82.6, -2, yT, 10);
    b.mat(4, 1); b.top(Math.min(X(16), X(82.6)), -2, Math.max(X(16), X(82.6)), 10, yT);
    b.mat(0, 1.1); bx(16, yT, 9.55, 82.6, yT + 1.15, 10, {});
    b.mat(0, 0.7); b.wallZ(-14, 10, -2, yT, X(82.6), sx);
    // wing wall and roof terrace
    b.win(6.5, 1.9, 2.2, 15.6, sd(), 1.0); wx(27, 66, yT, 26, -2);
    b.mat(3, 0.85); bx(27, 26, -26.5, 66, 27, -1.4, {});
    b.mat(0, 0.7); bx(27, 27, -1.95, 66, 28.1, -1.5, {});
    b.mat(0, 0.4); wx(27, 66, -2, 27, -26, -1);
    // end pavilion
    b.win(5.33, 1.55, 2.2, 14.4, sd(), 1.1); wx(66, 82, yT, 24, 2);
    b.win(5.33, 1.45, 1.8, 10.8, sd(), 0.9); wx(66, 82, 24, 38, 2);
    b.win(5.33, 1.6, 2.2, 14.4, sd(), 0.8); b.wallZ(-14, 2, yT, 24, X(82), sx);
    b.win(5.33, 1.5, 1.8, 10.8, sd(), 0.7); b.wallZ(-14, 2, 24, 38, X(82), sx);
    b.win(5.33, 1.5, 1.8, 10.8, sd(), 0.7); b.wallZ(-14, 2, 24, 38, X(66), -sx);
    b.mat(0, 0.8); b.wallZ(-2, 2, yT, 24, X(66), -sx);
    b.mat(0, 0.4); wx(66, 82, -2, 38, -14, -1);
    b.mat(3, 0.85); bx(65.2, 38, -14.8, 82.8, 39, 2.8, {});
    b.mat(2, 1); b.lathe(X(74), -6, [[12.4, 39], [9.2, 43.5], [5.2, 49], [2.2, 54], [0.5, 58], [0.05, 63]], 4, { rot: Math.PI / 4, flat: true, ribs: 4 });
    lamp(X(74), 63.4, -6, 3.4, mul3(gold, 1.1));
    await ctx.yield();
    // slim tower behind
    for (let k = 0; k < 6; k++) { b.win(5.8, 1.0, 3.2, 8.6, sd() + k * 0.5, 0.75); b.lathe(X(42), -31, [[4.6, k * 11], [4.6, k * 11 + 11]], 14, { rot: k * 0.63 }); }
    b.mat(3, 0.7); b.lathe(X(42), -31, [[4.6, 66], [5.5, 66.6], [5.5, 67.6]], 14);
    b.mat(2, 1); b.lathe(X(42), -31, [[5.6, 67.6], [3.4, 73], [1.2, 80], [0.05, 87]], 14, { ribs: 7 });
    lamp(X(42), 87.3, -31, 3.0, mul3(gold, 1.1));
    // corner turret of the central block
    for (let k = 0; k < 4; k++) { b.win(5.4, 0.7, 2.6, 7.6, sd(), 0.9); b.lathe(X(27), 4, [[3.4, -2 + k * 11], [3.4, 9 + k * 11]], 12, { rot: k * 0.8 }); }
    b.mat(3, 0.8); b.lathe(X(27), 4, [[3.4, 42], [4.1, 42.5], [4.1, 43.3]], 12);
    b.mat(2, 1); b.lathe(X(27), 4, [[4.2, 43.3], [2.3, 47.5], [0.6, 52], [0.05, 56]], 12, { ribs: 6 });
    lamp(X(27), 56.3, 4, 2.6, mul3(gold, 1.1));
    await ctx.yield();
    // promenade posts and strings, wing roof strings, festoons
    let s = 0, prev = null;
    for (let x = 18.5; x <= 81; x += 10.4) { post(X(x), yT + 1.15, 9.78, 3.3); const q = [X(x), yT + 5.3, 9.78]; if (prev) s = string(prev, q, 1.0, s); prev = q; }
    s = 30; prev = null;
    for (let x = 28; x <= 66; x += 9.5) { const q = [X(x), 30.2, -1.7]; b.mat(0, 0.8); b.box(q[0] - 0.14, 28.1, q[2] - 0.14, q[0] + 0.14, 30.2, q[2] + 0.14, { top: false }); if (prev) s = string(prev, q, 0.8, s); prev = q; }
    string([X(27.3), 37.4, 4.4], [X(66), 39.2, 2.6], 5.2, 60);
    string([X(19), 51.2, -3], [X(2.6), 81.6, -15], 4.0, 90);
    string([X(19), 51.2, -27], [X(2.6), 81.6, -15], 4.0, 90);
    string([X(27.3), 37.5, 4.4], [X(27.3), 37.5, -30], 0.1, 20, 1.9);
    // stair cheeks stepping down to the water, a lamp post on each
    for (let k = 0; k < 4; k++) {
      const z0 = 20 + k * 10, yk = 6.9 - k * 1.9;
      b.mat(0, 1.15); bx(9, -2, z0, 11.6, yk, z0 + 10, {});
      post(X(10.3), yk, z0 + 8.6, 2.6);
      string([X(10.3), yk + 4.3 + (k ? 1.9 : 0.3), z0 - 1.4], [X(10.3), yk + 4.3, z0 + 8.6], 0.9, 100 + k * 10, 1.25);
    }
    b.mat(0, 1.1); bx(9, -2, 60, 12.4, 1.6, 63.4, {});
    post(X(10.7), 1.6, 61.7, 4.2, 1.7);
    // landing: side walls and balustrades
    b.mat(0, 0.9); b.wallZ(10, 20, -2, yT, X(16), sx); wx(11.6, 16, -2, yT, 20);
    b.mat(0, 1.1); bx(11.6, yT, 19.55, 16, yT + 1.15, 20, {}); bx(15.55, yT, 10, 16, yT + 1.15, 20, {});
    post(X(15.78), yT + 1.15, 19.78, 3.3);
  }
  string([-27.3, 37.5, 4.4], [27.3, 37.5, 4.4], 0.1, 0, 1.9);
  await ctx.yield();
  // ---- landing floor and the water stair
  b.mat(4, 1.2); b.top(-16, 4, 16, 20, yT);
  const nS = 21, rise = 0.37, run = 1.9;
  for (let i = 0; i < nS; i++) {
    const z0 = 20 + i * run, y = yT - (i + 1) * rise;
    b.mat(4, 1.2); b.quad([-9, y, z0], [9, y, z0], [9, y + rise, z0], [-9, y + rise, z0]);
    b.top(-9, z0, 9, z0 + run, y);
    b.mat(7, 1.2); b.quad([-3.2, y, z0 + 0.03], [3.2, y, z0 + 0.03], [3.2, y + rise + 0.03, z0 + 0.03], [-3.2, y + rise + 0.03, z0 + 0.03]);
    b.quad([-3.2, y + 0.03, z0 + run + 0.03], [3.2, y + 0.03, z0 + run + 0.03], [3.2, y + 0.03, z0 + 0.03], [-3.2, y + 0.03, z0 + 0.03]);
  }
  b.mat(7, 1.3); b.quad([-3.2, yT + 0.04, 20.03], [3.2, yT + 0.04, 20.03], [3.2, yT + 0.04, 4.2], [-3.2, yT + 0.04, 4.2]);
  await ctx.yield();
  const geometry = b.toGeometry();
  await ctx.yield();
  return { geometry, lights: L, triangles: b.triangles };
}

// ---------------------------------------------------------------- the palace: material
function palaceMaterial(U, P, mirror) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: U.uTime, uFogCol: U.uFogCol, uFogDen: U.uFogDen, uMirror: { value: mirror ? 1 : 0 },
      uWin: { value: P.win }, uStone: { value: P.stone }, uRoof: { value: P.roof }, uGilt: { value: P.gilt }, uAmb: { value: P.amb }, uWarm: { value: P.warm }, uRose: { value: P.rose }, uFestive: P.festive,
    },
    vertexShader: /* glsl */`
attribute vec4 aA, aB;
varying vec2 vUv; varying vec4 vA, vB; varying vec3 vNo, vPo, vWp;
void main(){
  vUv = uv; vA = aA; vB = aB; vNo = normal; vPo = position;
  vec4 wp = modelMatrix*vec4(position, 1.); vWp = wp.xyz;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`,
    fragmentShader: GLSL_COMMON + /* glsl */`
uniform vec3 uWin, uStone, uRoof, uGilt, uAmb, uWarm, uRose; uniform float uTime, uMirror, uFestive;
varying vec2 vUv; varying vec4 vA, vB; varying vec3 vNo, vPo, vWp;
// the soft shadow of one dancer on the glass: p from the figure's axis and its feet, H its height, w how broad it stands, gown 0..1
float figure(vec2 p, float H, float w, float gown){
  float hy = p.y/max(H, .01);
  float skirt = mix(mix(.2, .36, gown), .07, smoothstep(0., .56, hy));
  float sho = .12*smoothstep(.56, .7, hy)*(1.-smoothstep(.8, .86, hy));
  float hfw = max(skirt, sho)*w*H;
  float d = abs(p.x) - hfw; d = max(d, p.y - .86*H);
  d = min(d, length(vec2(p.x, p.y - .925*H)) - .07*H);
  d = max(d, -p.y);
  return 1.-smoothstep(-.1*H*.2, .1*H*.2 + .06, d);
}
float dancers(vec2 q, float hw, float ci, float seed, float H){
  float sh = 0.;
  for (int k = 0; k < 2; k++) {
    float fk = float(k), h = h21(vec2(ci*1.7 + fk*13.1, seed + 2.3));
    float x0 = sin(uTime*(.2+.28*h) + h*6.2832 + fk*2.4)*hw*1.7;
    float th = uTime*(1.3+.9*h) + h*40.; float cs = cos(th), sn = sin(th);
    vec2 pa = vec2(q.x - x0 - cs*H*.12, q.y + H*.1), pb = vec2(q.x - x0 + cs*H*.12, q.y + H*.1);
    float a = figure(pa, H, .72+.28*abs(sn), 1.);
    float b = figure(pb, H*1.07, .7+.2*abs(cs), 0.);
    float arm = 1.-smoothstep(.0, .09*H, abs(q.y + H*.1 - H*.7 - abs(cs)*H*.05) + max(abs(q.x - x0) - abs(cs)*H*.12, 0.));
    sh = max(sh, max(max(a, b), arm)*step(h, .35+.6*uFestive));
  }
  return sh;
}
void main(){
  if (uMirror > .5 && vWp.y > -.03) discard;
  vec3 vv = cameraPosition - vWp; float dist = length(vv);
  float m = vA.x, lit = vB.z, aa = (fwidth(vUv.x) + fwidth(vUv.y))*.75 + 1e-4;
  vec2 uvv = vUv;
  if (uMirror > .5) uvv.x += sin(vWp.y*.55 + uTime*1.1 + vWp.x*.11)*.16*clamp(-vWp.y*.12, 0., 1.);
  float facing = .5 + .5*clamp(vNo.z, 0., 1.), low = exp(-max(vPo.y - 6., 0.)*.04);
  float blocks = step(.5, fract(uvv.y/1.25*.5));
  vec2 bq = vec2(uvv.x/2.5 + blocks*.5, uvv.y/1.25);
  float jd = min((.5-abs(fract(bq.x)-.5))*2.5, (.5-abs(fract(bq.y)-.5))*1.25);
  float joint = 1.-smoothstep(.02, .05+aa, jd);
  joint *= clamp(1.-aa*6., 0., 1.);
  vec3 stone = uStone*(.82+.18*vn2(uvv*.9))*(1.-.22*joint);
  vec3 col = stone*(uAmb + uWarm*lit*facing*(.13+.36*low));
  if (m > .5 && m < 1.5) {
    float cw = max(vA.y, .1), hw = vA.z, wb = vA.w, wt = vB.x, seed = vB.y;
    float cx = uvv.x/cw, ci = floor(cx), lx = (fract(cx)-.5)*cw, y = uvv.y, yc = wt - hw;
    float d = y > yc ? length(vec2(lx, y - yc)) - hw : abs(lx) - hw; d = max(d, wb - y);
    float inside = 1.-smoothstep(-aa, aa, d);
    float hsh = h21(vec2(ci, seed*7.3)), gy = clamp((y - wb)/max(wt - wb, .1), 0., 1.);
    float glowIn = mix(1.35, .75, gy)*(1.-.3*min(lx*lx/max(hw*hw, .01), 1.))*(.8+.45*hsh);
    float flick = .93+.07*sin(uTime*(2.+3.*hsh) + hsh*50.);
    float H = min((wt - wb)*.62, 6.5);
    float sh = dancers(vec2(lx, y - wb), hw, ci, seed, H);
    float bars = min(abs(lx), min(abs(abs(lx) - hw*.55), abs(fract((y - wb)/2.4) - .5)*2.4));
    float bar = 1.-smoothstep(.05, .09+aa, bars); bar *= clamp(1.-aa*3., 0., 1.);
    vec3 wc = uWin*glowIn*flick*(1.-.85*sh)*(1.-.75*bar)*1.18;
    col += uWin*.16*exp(-max(d, 0.)*.8)*lit;
    float frame = (1.-smoothstep(.22, .22+aa*2., d))*(1.-inside);
    col = mix(col, uGilt*(.3+.35*lit), frame*.85);
    col = mix(col, wc, inside);
  } else if (m > 1.5 && m < 2.5) {
    float rib = 1.-smoothstep(.012, .03+aa, abs(fract(vUv.x + .5) - .5));
    float sc = fract(vUv.y*.55 + floor(vUv.x*6.)*.5);
    col = uRoof*(.55+.45*clamp(vNo.y, 0., 1.))*(.8+.2*sc) + uWarm*.07*(1.-clamp(vNo.y, 0., 1.))*uRoof*4.;
    col = mix(col, uGilt*.8, rib*.8);
  } else if (m > 2.5 && m < 3.5) {
    col = uGilt*(.2 + .34*lit*facing) + uGilt*.12*vn2(vUv*3. + uTime*.2);
  } else if (m > 3.5 && m < 4.5) {
    float wet = 1.-smoothstep(.0, 1.6, vPo.y);
    col = stone*(uAmb + uWarm*lit*(.42+.3*low))*(1.-.45*wet) + uWin*wet*.06;
    float tile = 1.-smoothstep(.02, .05+aa, min(abs(fract(vUv.x/3.)-.5)*3., abs(fract(vUv.y/3.)-.5)*3.));
    col *= 1.-.2*tile*clamp(1.-aa*5., 0., 1.);
  } else if (m > 4.5 && m < 5.5) {
    col = uWin*(.95+.5*lit)*(.9+.1*sin(uTime*3.1 + vPo.x*.7 + vPo.y*.4));
  } else if (m > 6.5) {
    float edge = min(vUv.x, 6.4 - vUv.x);
    col = uRose*(uAmb*2. + uWarm*lit*(.3+.26*low))*(.8+.2*vn2(vUv*5.));
    col = mix(col, uGilt*(.35+.3*lit), (1.-smoothstep(.28, .34, edge))*step(.1, edge));
  } else if (m > 5.5) {
    vec2 q = vUv*vec2(.5, .5); vec2 ci2 = floor(q), f = fract(q) - .5;
    float ch = exp(-dot(f, f)*14.)*(.6+.4*sin(uTime*2.+h21(ci2)*20.));
    col = uWin*(1.2 + 1.5*ch)*(.75+.25*clamp(vUv.y/14., 0., 1.));
  }
  if (uMirror > .5) col *= .85*exp(clamp(vWp.y, -400., 0.)*.02);
  gl_FragColor = vec4(fogged(col, dist, .5), 1.);
}`,
  });
}

// ---------------------------------------------------------------- buildHero
export async function buildHero(ctx, opts = {}) {
  const rng = (opts.rng || ctx.rng).fork('palace');
  const kit = opts.kit || makeJewelKit(ctx, {});
  const festive = opts.festive ?? rng.range(0.4, 1);
  const lanternSets = [['#ff8fa3', '#ffd9a0', '#ff8fa3', '#fff1d0'], ['#ff8fa3', '#ffd9a0'], ['#ffd9a0', '#ffb070', '#ff8fa3'], ['#ff8fa3', '#ffe2b0', '#b9c8ff']];
  const lanternCols = (opts.lanterns || rng.pick(lanternSets)).map((h) => mul3(lin(h), 1.5));
  const object = new THREE.Group();
  const geo = await palaceGeometry(rng, lanternCols, ctx);
  await ctx.yield();
  const warmth = rng.range(0, 1);
  const P = {
    win: new THREE.Color('#ffd9a0').lerp(new THREE.Color('#ffc078'), warmth * 0.5), stone: new THREE.Color('#9a8168'), roof: new THREE.Color('#1c2440'), gilt: new THREE.Color('#ffc86a'),
    amb: new THREE.Color('#141a34'), rose: new THREE.Color('#b8506e'), warm: new THREE.Color('#ffc58a').multiplyScalar(1.15), festive: { value: festive },
  };
  const mat = palaceMaterial(kit.U, P, false), matM = palaceMaterial(kit.U, P, true);
  const real = new THREE.Mesh(geo.geometry, mat); object.add(real);
  const mirror = new THREE.Mesh(geo.geometry, matM); mirror.scale.y = -1; mirror.renderOrder = -0.5; object.add(mirror);
  // lanterns, strings, and their images in the lake
  const list = [];
  for (const q of geo.lights) {
    if (q.kind === 1 && rng() > 0.55 + 0.45 * festive && q.p[1] > 30) continue;
    list.push(q); list.push({ ...q, p: [q.p[0], -q.p[1], q.p[2]], mirror: 1 });
  }
  await ctx.yield();
  const sparks = kit.makeSparks(list, { beat: 1.3 + 0.5 * festive, pulse: 0.45 + 0.5 * festive, gain: 1.25, renderOrder: 6 });
  object.add(sparks.mesh);
  let water = null;
  if (opts.water !== false) {
    water = new THREE.Mesh(new THREE.CircleGeometry(1400, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#03050c', transparent: true, opacity: 0.5, depthWrite: false }));
    water.position.y = 0.02; water.renderOrder = 2; object.add(water);
    const bed = new THREE.Mesh(new THREE.CircleGeometry(1400, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#02030a' }));
    bed.position.y = -100; bed.renderOrder = -1; object.add(bed);
  }
  const own = !opts.kit;
  return {
    object, radius: 86, height: 92, center: new THREE.Vector3(0, 30, 0), ground: false,
    anchors: {
      portal: new THREE.Vector3(0, PALACE.sill + PALACE.portalH / 2, 3.2), sill: new THREE.Vector3(0, PALACE.sill, PALACE.doorZ),
      stairFoot: new THREE.Vector3(0, 0, PALACE.stairFootZ), gaze: new THREE.Vector3(0, 30, 0),
    },
    info: { triangles: geo.triangles * 2, lights: list.length, festive },
    palette: P, sparks, real, mirror,
    update(dt, time, camera) { if (own) kit.update(time, camera, ctx.renderer); },
    dispose() {},
  };
}
