// THE HOUSE THAT OPENS TO THE SEA
// A long Malay timber house on stilts (four times life size) stands shut and dark on a white beach. The sea
// breeze arrives with us and every shutter, folding door and roof flap swings open one bay ahead of the camera
// (the hero, src/parts/house-opens-seaward.js), until the end wall falls onto the sand and the portal.
//
// Space = the brief's own (hero-local = world): we fly toward -z, +x is the sea side, sand y = 0 at the stair.
//
// Outline of this file
//   1  constants, colour helpers, PB (a merged-geometry builder: beams, lathes, tubes, sheets, with per-vertex
//      animation kind / pivot / surface kind)
//   2  the props shader: one ShaderMaterial lit by the hero's analytic light (hosShade), vertex animation for
//      cloth in the gust, spinning tops, hanging things, wings; and the sand shader
//   3  ground: sandH(), the sand mesh, sky, clouds, sea, light rig, palms
//   4  net shed, boat, swing, stair, landing (zone A)
//   5  the twelve bays of furniture and cloth (zones B, C, D), the verandah, the beach
//   6  creatures: doves and cages, hens, geckos, crabs, swallows, terns; particles, steam, sand burst, kites
//   7  path, pace, pois, post, update(), dispose()
//
// Scripted moments (u along this world's path; every one is keyed to the path's z, never to time). Since round three the
//   wave runs two bays ahead of us in the hall (86 m; 60 m on the verandah; 100 m down the tunnel), so the bay we look into
//   already stands open to the sea and the one beyond it is mid-swing:
//   0.04 hens scatter | 0.12-0.16 door | 0.26-0.30 the first cross screen folds two bays ahead | 0.29-0.38 the cages of bay 4
//   swing and the doves flutter in the roof shafts, seen through the doorway | 0.34-0.375 between the folded leaves, songket
//   on rails either side | 0.40-0.45 the cradle, whole, left of centre, the sea through the folding wall | 0.47-0.57 verandah
//   (blinds rolling up 57-95 m ahead, the shutters of bays 6 and 7 swinging out beside us, floats, fish, surf, terns) |
//   0.585 back in under the propped-up panels of bay 7 | 0.575-0.625 the two inner screens fold ahead of us, the line of
//   batik lifts | 0.64-0.88 the tunnel: the ring dead ahead in the moon gate, its colour down the boards | geckos dart as
//   their slab lands | 0.80-0.856 the end wall falls, 0.855-0.90 the sand fan (gone by 0.91), crabs run | 0.90-1 the beach.
//   Rare (ctx.vary.rare) 0.737-0.805: the wind drops and returns.
// Looks (ctx.vary.hour, else by seed): afternoon (cobalt and jade), morning (silver mist, pewter sea, six
//   sailing boats), copper (low sun, violet sea).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeCloudField, makeLightRig } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/house-opens-seaward.js';

const PALETTE = ['#24160E', '#6E4424', '#F3E9D2', '#2FA58A', '#3E7B3C', '#D8A12C', '#B5245C'];
const FLOOR = 16, HW = 32, SEA = -2;
const WIND = [-0.8, 0, -0.6];                         // the sea breeze: off the water and down the hall
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const C = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mulc = (a, f) => [a[0] * f, a[1] * f, a[2] * f];

// colours (linear)
const K = {
  dark: C('#24160E'), mid: C('#6E4424'), cream: C('#F3E9D2'), jade: C('#2FA58A'), green: C('#3E7B3C'), gold: C('#D8A12C'),
  magenta: C('#B5245C'), brass: C('#C9973A'), clay: C('#9A5A3A'), rope: C('#B79A6A'), rattan: C('#A8824E'), pandan: C('#B9B27A'),
  white: C('#EFE9DC'), red: C('#B8322A'), turq: C('#2FB5B0'), glass: C('#3FA07A'), iron: C('#2A2622'), indigo: C('#2A3A6E'),
  banana: C('#D9B93A'), leaf: C('#3F8A3A'), coconut: C('#6A4A2A'), fish: C('#B8B0A0'), sandal: C('#7A4A2A'), purple: C('#8A4AB0'),
};
const SURF = { wood: 0, cloth: 1, glaze: 2, brass: 3, leaf: 4, net: 5, rope: 6, feather: 7 };

// =====================================================================================================
// 1. PB: accumulates one merged geometry. Every vertex carries colour, an animation (kind, amp, phase, ref),
//    a pivot and a surface kind. Kinds: 0 still, 1 cloth in the wind, 2 spin about the pivot's upright axis,
//    3 pendulum about the pivot, 4 wing flapping about the pivot's fore-aft axis (ref = flap channel).
// =====================================================================================================
class PB {
  constructor() {
    this.cap = 16384; this.nv = 0;                    // typed arrays that double: no conversion from a JS array at the end
    this.p = new Float32Array(this.cap * 3); this.n = new Float32Array(this.cap * 3); this.c = new Float32Array(this.cap * 3); this.a = new Float32Array(this.cap * 4); this.v = new Float32Array(this.cap * 4);
    this.M = new THREE.Matrix4(); this.N = new THREE.Matrix3(); this._v = new THREE.Vector3(); this._e = new THREE.Euler();
    this._q = new THREE.Quaternion(); this._s = new THREE.Vector3();
    this.kind = 0; this.amp = 0; this.phase = 0; this.ref = 0; this.piv = [0, 0, 0]; this.surf = 0; this.tris = 0;
  }
  at(x = 0, y = 0, z = 0, ry = 0, s = 1, rx = 0, rz = 0) {
    this._q.setFromEuler(this._e.set(rx, ry, rz, 'YXZ'));
    this.M.compose(this._v.set(x, y, z), this._q, this._s.set(s, s, s)); this.N.getNormalMatrix(this.M);
    return this;
  }
  // animation of what follows; the pivot is given in the current local frame
  anim(kind = 0, amp = 0, phase = 0, ref = 0, pivot = null) {
    this.kind = kind; this.amp = amp; this.phase = phase; this.ref = ref;
    if (pivot) { this._v.set(pivot[0], pivot[1], pivot[2]).applyMatrix4(this.M); this.piv = [this._v.x, this._v.y, this._v.z]; }
    return this;
  }
  still() { this.kind = 0; this.amp = 0; return this; }
  mat(surf) { this.surf = surf; return this; }
  grow() {
    this.cap *= 2;
    for (const [k, sz] of [['p', 3], ['n', 3], ['c', 3], ['a', 4], ['v', 4]]) { const b = new Float32Array(this.cap * sz); b.set(this[k]); this[k] = b; }
  }
  vert(q, nx, ny, nz, col, w = 1) {
    if (this.nv === this.cap) this.grow();
    const e = this.M.elements, m = this.N.elements, i3 = this.nv * 3, i4 = this.nv * 4, P = this.p, Nr = this.n, Cc = this.c, A = this.a, V = this.v, x = q[0], y = q[1], z = q[2];
    P[i3] = e[0] * x + e[4] * y + e[8] * z + e[12]; P[i3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; P[i3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
    const a = m[0] * nx + m[3] * ny + m[6] * nz, b = m[1] * nx + m[4] * ny + m[7] * nz, c = m[2] * nx + m[5] * ny + m[8] * nz, l = 1 / (Math.sqrt(a * a + b * b + c * c) || 1);
    Nr[i3] = a * l; Nr[i3 + 1] = b * l; Nr[i3 + 2] = c * l;
    Cc[i3] = col[0]; Cc[i3 + 1] = col[1]; Cc[i3 + 2] = col[2];
    A[i4] = this.kind; A[i4 + 1] = this.amp * w; A[i4 + 2] = this.phase; A[i4 + 3] = this.ref;
    const pv = this.piv; V[i4] = pv[0]; V[i4 + 1] = pv[1]; V[i4 + 2] = pv[2]; V[i4 + 3] = this.surf;
    this.nv++;
  }
  // flat quad a,b,c,d; col = one colour or four; w = four weights for the animation amplitude
  quad(a, b, c, d, col, w = null) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const cs = Array.isArray(col[0]) ? col : [col, col, col, col], ws = w || [1, 1, 1, 1], q = [a, b, c, d];
    for (const i of [0, 1, 2, 0, 2, 3]) this.vert(q[i], nx, ny, nz, cs[i], ws[i]);
    this.tris += 2;
  }
  // chamfered timber from a to b, section w x h; shade = [end a, end b] brightness for a baked gradient
  beam(a, b, w, h, col, ch = 0.14, shade = null) {
    let ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2]; const len = Math.hypot(ax, ay, az) || 1; ax /= len; ay /= len; az /= len;
    const up = Math.abs(ay) > 0.9 ? [0, 0, 1] : [0, 1, 0];
    let sx = ay * up[2] - az * up[1], sy = az * up[0] - ax * up[2], sz = ax * up[1] - ay * up[0]; const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
    const ux = sy * az - sz * ay, uy = sz * ax - sx * az, uz = sx * ay - sy * ax;
    const ref0 = this.ref; if (this.kind === 0) this.ref = Math.abs(ay) >= Math.abs(ax) && Math.abs(ay) >= Math.abs(az) ? 0 : Math.abs(ax) >= Math.abs(az) ? 1 : 2;   // grain runs along the timber
    const hw = w / 2, hh = h / 2, c = Math.min(ch, hw * 0.45, hh * 0.45);
    const ring = [[-hw + c, -hh], [hw - c, -hh], [hw, -hh + c], [hw, hh - c], [hw - c, hh], [-hw + c, hh], [-hw, hh - c], [-hw, -hh + c]];
    const pt = (q, o) => [o[0] + sx * q[0] + ux * q[1], o[1] + sy * q[0] + uy * q[1], o[2] + sz * q[0] + uz * q[1]];
    const ca = shade ? mulc(col, shade[0]) : col, cb = shade ? mulc(col, shade[1]) : col;
    for (let i = 0; i < 8; i++) {
      const q0 = ring[i], q1 = ring[(i + 1) % 8];
      this.quad(pt(q0, a), pt(q0, b), pt(q1, b), pt(q1, a), [ca, cb, cb, ca]);
    }
    for (let e = 0; e < 2; e++) {
      const o = e ? b : a, cc = mulc(e ? cb : ca, 0.8), r = ring.map((q) => pt(q, o));
      for (let i = 1; i < 6; i += 2) { if (e) this.quad(r[0], r[i + 2 > 7 ? 0 : i + 2], r[i + 1], r[i], cc); else this.quad(r[0], r[i], r[i + 1], r[i + 2 > 7 ? 0 : i + 2], cc); }
    }
    this.ref = ref0;
  }
  box(cx, cy, cz, sx, sy, sz, col, ch = 0.14, shade = null) {
    if (sy >= sx && sy >= sz) this.beam([cx, cy - sy / 2, cz], [cx, cy + sy / 2, cz], sx, sz, col, ch, shade);
    else if (sx >= sz) this.beam([cx - sx / 2, cy, cz], [cx + sx / 2, cy, cz], sz, sy, col, ch, shade);
    else this.beam([cx, cy, cz - sz / 2], [cx, cy, cz + sz / 2], sx, sy, col, ch, shade);
  }
  // surface of revolution about the local y axis at (cx, cy, cz); prof = [[r, y], ...]; col = colour or (i, n) => colour
  lathe(prof, seg, col, cx = 0, cy = 0, cz = 0, ex = 1, ez = 1, wFn = null) {
    const n = prof.length, nr = [];
    for (let i = 0; i < n; i++) {
      const a = prof[Math.max(0, i - 1)], b = prof[Math.min(n - 1, i + 1)]; const dr = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dr, dy) || 1;
      nr.push([dy / l, -dr / l]);
    }
    const cf = typeof col === 'function' ? col : () => col;
    const cs = new Float64Array(seg + 1), sn = new Float64Array(seg + 1), t = [0, 0, 0];
    for (let j = 0; j <= seg; j++) { const an = (j / seg) * 6.2832; cs[j] = Math.cos(an); sn[j] = Math.sin(an); }
    const emit = (k, j, cc, ww) => { const r = prof[k][0]; t[0] = cx + cs[j] * r * ex; t[1] = cy + prof[k][1]; t[2] = cz + sn[j] * r * ez; this.vert(t, cs[j] * nr[k][0], nr[k][1], sn[j] * nr[k][0], cc, ww); };
    for (let i = 0; i + 1 < n; i++) {
      const c0 = cf(i, n), c1 = cf(i + 1, n), w0 = wFn ? wFn(i) : 1, w1 = wFn ? wFn(i + 1) : 1;
      for (let j = 0; j < seg; j++) {
        emit(i, j, c0, w0); emit(i + 1, j, c1, w1); emit(i + 1, j + 1, c1, w1); emit(i, j, c0, w0); emit(i + 1, j + 1, c1, w1); emit(i, j + 1, c0, w0);
        this.tris += 2;
      }
    }
  }
  // rope or rod through points; w = weight per point for the animation amplitude
  tube(pts, r, col, seg = 5, w = null) {
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1]; let ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2]; const l = Math.hypot(ax, ay, az) || 1; ax /= l; ay /= l; az /= l;
      const up = Math.abs(ay) > 0.9 ? [1, 0, 0] : [0, 1, 0];
      let sx = ay * up[2] - az * up[1], sy = az * up[0] - ax * up[2], sz = ax * up[1] - ay * up[0]; const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
      const ux = sy * az - sz * ay, uy = sz * ax - sx * az, uz = sx * ay - sy * ax, wa = w ? w[i] : 1, wb = w ? w[i + 1] : 1;
      for (let j = 0; j < seg; j++) {
        const q = [];
        for (const [o, jj, ww] of [[a, j, wa], [b, j, wb], [b, j + 1, wb], [a, j + 1, wa]]) {
          const an = (jj / seg) * 6.2832, cx = Math.cos(an), sn = Math.sin(an), nx = sx * cx + ux * sn, ny = sy * cx + uy * sn, nz = sz * cx + uz * sn;
          q.push([[o[0] + nx * r, o[1] + ny * r, o[2] + nz * r], nx, ny, nz, ww]);
        }
        for (const t of [0, 1, 2, 0, 2, 3]) this.vert(q[t][0], q[t][1], q[t][2], q[t][3], col, q[t][4]);
        this.tris += 2;
      }
    }
  }
  // a grid surface: P(u, v) -> [x, y, z], colour (u, v, i, j) per cell or per vertex, weight (u, v)
  sheet(P, nu, nv, colFn, wFn = null, perCell = true) {
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
      const cc = perCell ? colFn((u0 + u1) / 2, (v0 + v1) / 2, i, j) : [colFn(u0, v0), colFn(u1, v0), colFn(u1, v1), colFn(u0, v1)];
      this.quad(P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1), cc, wFn ? [wFn(u0, v0), wFn(u1, v0), wFn(u1, v1), wFn(u0, v1)] : null);
    }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    for (const [name, arr, n] of [['position', this.p, 3], ['normal', this.n, 3], ['color', this.c, 3], ['aAnim', this.a, 4], ['aPiv', this.v, 4]]) g.setAttribute(name, new THREE.BufferAttribute(arr.slice(0, this.nv * n), n));
    g.computeBoundingSphere(); g.boundingSphere.radius += 12;
    return g;
  }
  // the same, one attribute per step (a big zone is a few hundred thousand numbers to copy)
  async geometrySteps(y) {
    const g = new THREE.BufferGeometry();
    for (const [name, arr, n] of [['position', this.p, 3], ['normal', this.n, 3], ['color', this.c, 3], ['aAnim', this.a, 4], ['aPiv', this.v, 4]]) { g.setAttribute(name, new THREE.BufferAttribute(arr.slice(0, this.nv * n), n)); await y(); }
    g.computeBoundingSphere(); g.boundingSphere.radius += 12;
    return g;
  }
}
for (const k of ['quad', 'beam', 'box', 'lathe', 'tube', 'sheet']) { const f = PB.prototype[k]; PB.prototype[k] = function (...a) { f.apply(this, a); return this; }; }

// =====================================================================================================
// 2. Shaders. Everything of the world's own is lit by the hero's analytic light (hosShade), so furniture,
//    cloth, sand and creatures sit in the same slabs, sun coins, amber bounce and jade ripple as the house.
// =====================================================================================================
const PROP_VERT = /* glsl */`
attribute vec4 aAnim; attribute vec4 aPiv;
uniform float uWaveZ; uniform vec4 uHos; uniform vec4 uCalm; uniform vec4 uFlap; uniform vec3 uWind; uniform vec4 uGustAll;
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying vec3 vV; varying vec3 vO; varying float vSurf; varying float vAx;
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal, piv = aPiv.xyz;
  float kind = aAnim.x, amp = aAnim.y, ph = aAnim.z, ref = aAnim.w, t = uHos.x;
  mat4 mm = modelMatrix;
  #ifdef USE_INSTANCING
    mm = modelMatrix * instanceMatrix;
  #endif
  vO = position; vAx = kind < .5 ? ref : 0.;
  if (kind > .5) {
    float wz = (mm * vec4(piv, 1.)).z;
    float s = max((wz - uWaveZ) / 22., 0.);
    bool free = (kind > 3.5 && kind < 4.5) || (ref > .5 && kind < 4.5);     // outdoor things (ref 1) are always in the wind
    float on = free ? 1. : smoothstep(0., .7, s);
    float kick = free ? 0. : exp(-s * .5) * sin(s * 4.4) * smoothstep(0., .25, s);
    float lull = 1. - .9 * uCalm.x;
    float breeze = on * lull * (.5 + .3 * sin(t * 1.9 + ph) + .2 * sin(t * 3.3 + ph * 1.7 + position.y * .21)) * (1. + uGustAll.x);
    float idle = (1. - on) * .05 * sin(t * 1.1 + ph);
    if (kind < 1.5) {                                 // cloth: bellies down the wind and lifts
      float d = amp * (breeze + 1.5 * kick * lull + idle);
      p += uWind * d; p.y += abs(d) * .22;
      n = normalize(n - uWind * d * .12);
    } else if (kind < 2.5) {                          // spin about the pivot's upright axis (a wobble while it slows)
      float a = t * amp + ph, c = cos(a), sn = sin(a);
      vec3 r = p - piv; r.x += r.y * .05 * sin(t * 2.3 + ph);
      p = piv + vec3(c * r.x + sn * r.z, r.y, -sn * r.x + c * r.z);
      n = vec3(c * n.x + sn * n.z, n.y, -sn * n.x + c * n.z);
    } else if (kind < 3.5) {                          // pendulum: hangs from the pivot and swings down the wind
      float a = amp * (.42 * (breeze - .5 * on * lull) + .9 * kick * lull + idle), c = cos(a), sn = sin(a);
      vec3 r = p - piv; float al = dot(r, uWind), up = r.y; vec3 side = r - uWind * al - vec3(0., up, 0.);
      p = piv + side + uWind * (al * c - up * sn) + vec3(0., al * sn + up * c, 0.);
      float nl = dot(n, uWind), nu = n.y; vec3 ns = n - uWind * nl - vec3(0., nu, 0.);
      n = ns + uWind * (nl * c - nu * sn) + vec3(0., nl * sn + nu * c, 0.);
    } else if (kind < 4.5) {                          // wing: flaps about the fore-aft (local z) axis through the pivot
      float env = ref < .5 ? uFlap.x : ref < 1.5 ? uFlap.y : ref < 2.5 ? uFlap.z : uFlap.w;
      float a = amp * (.15 + env * sin(t * 24. + ph)), c = cos(a), sn = sin(a);
      vec3 r = p - piv; p = piv + vec3(c * r.x - sn * r.y, sn * r.x + c * r.y, r.z);
      n = vec3(c * n.x - sn * n.y, sn * n.x + c * n.y, n.z);
    } else {                                          // a blind: rolls up to its pole as the breeze arrives, then sways
      float roll = smoothstep(-2.3, -.6, (wz - uWaveZ - uGustAll.y) / 22.);    // 57 to 95 m ahead of us: seen rolling, clear by the time we are beside them
      float d = piv.y - p.y;
      p.y = piv.y - d * (1. - .87 * roll) ;
      p += uWind * amp * d * .012 * (breeze + kick * lull + idle);
    }
  }
  vec4 wp = mm * vec4(p, 1.);
  vP = wp.xyz; vN = mat3(mm) * n; vC = color; vSurf = aPiv.w;
  vV = cameraPosition - wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const propFrag = (lightGlsl) => /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying vec3 vV; varying vec3 vO; varying float vSurf; varying float vAx;
#include <fog_pars_fragment>
${lightGlsl}
void main(){
  vec3 N = vN / max(length(vN), 1e-4); if (!gl_FrontFacing) N = -N;
  vec3 V = vV / max(length(vV), 1e-3);
  vec3 alb = vC; float gloss = .5; float s = vSurf;
  vec3 fo = fwidth(vO); float px = max(fo.x, max(fo.y, fo.z));
  float fine = 1. - smoothstep(.08, .4, px);
  float n1 = hosNoise(vec2(vO.x * .8 + vO.z * .55, vO.y * .9 - vO.z * .35));
  float n2 = hosNoise(vec2(vO.x * 5.1 + vO.y * 3.3, vO.z * 5.3 - vO.y * 2.1));
  if (s < .5) {                                        // oiled wood: long grain, a dark check now and then
    float l = vAx < .5 ? vO.y : vAx < 1.5 ? vO.x : vO.z;
    vec2 cr = vAx < .5 ? vO.xz : vAx < 1.5 ? vO.yz : vO.xy;
    float g = hosNoise(vec2(l * .45 + cr.x * 2.1, (cr.x + cr.y) * 5.));
    float g2 = hosNoise(vec2(l * .12, (cr.x - cr.y) * 2.3 + 9.));
    alb *= .7 + .32 * g * fine + .24 * g2 + .08 * n1;
    alb *= 1. - .3 * smoothstep(.62, .72, hosNoise(vec2(l * .22 + 4., (cr.x + cr.y) * 9.))) * fine;   // dark streaks along the grain
    gloss = .8;
  } else if (s < 1.5) {                                // cloth and matting: a weave, soft folds, light wrapped round
    float wv = sin(vO.x * 9.) * sin(vO.y * 9. + vO.z * 9.);
    alb *= .84 + .13 * wv * fine + .16 * n1;
    N = normalize(N + uSun * .35); gloss = .15;
  } else if (s < 2.5) {                                // glazed jars: a drip line, crazing, a hard highlight
    alb *= .78 + .3 * n1; alb = mix(alb, alb * vec3(.55, .7, .62), smoothstep(.55, .75, n2) * .5 * fine);
    gloss = 2.6;
  } else if (s < 3.5) {                                // brass
    alb *= .82 + .24 * n2; gloss = 3.2;
    alb += vC * .25 * pow(1. - max(dot(N, V), 0.), 2.);
  } else if (s < 4.5) {                                // leaves and bracts: thin, lit through
    alb *= .75 + .4 * n2; N = normalize(N + uSun * .7); gloss = .5;
  } else if (s < 5.5) {                                // netting: knotted mesh, see-through
    vec2 g = vec2(vO.x + vO.z, vO.y) * 1.6; g = vec2(g.x + g.y, g.x - g.y);
    vec2 f = abs(fract(g) - .5);
    float cover = smoothstep(.25, 1.1, px * 1.6);
    float hole = step(.1 + px * .8, min(f.x, f.y));
    if (hole > .5 && hosHash(gl_FragCoord.xy) >= .22 + .5 * cover) discard;
    alb *= .8 + .4 * n2; N = normalize(N + uSun * .5); gloss = .1;
  } else if (s < 6.5) {                                // rope: a twist
    alb *= .7 + .3 * sin((vO.x + vO.y + vO.z) * 14.) * fine + .2 * n1; gloss = .2;
  } else if (s < 7.5) {                                // feathers, shell, scales: barred
    alb *= .72 + .28 * sin(vO.z * 16. + vO.y * 5.) * fine + .25 * n1; gloss = .6;
  } else if (s < 8.5) {                                // rattan basketwork: courses of weavers over stakes
    float bnd = floor(vO.y * 3.3), bf = fract(vO.y * 3.3);
    float st = sin((vO.x + vO.z) * 8. + bnd * 3.1416) * sin((vO.x - vO.z) * 8. + bnd * 3.1416);
    alb *= .7 + .3 * smoothstep(-.25, .25, st) * fine + .12 * n1;
    alb *= .8 + .2 * smoothstep(.06, .22, bf) * mix(1., .9, fine);
    gloss = .3;
  } else {                                             // figured cloth: 9 songket (gold lozenges woven in), 9.5 batik (pale waxed flowers)
    vec2 q = vec2(vO.x + vO.z * .7, vO.y);
    float pat; vec3 ink;
    if (s < 9.25) {
      vec2 d = abs(fract(q * 1.7) - .5) * 2.; float loz = d.x + d.y;
      pat = max(1. - smoothstep(.07, .17, abs(loz - 1.)), 1. - smoothstep(.2, .32, loz));
      pat = max(pat, 1. - smoothstep(.12, .22, 2. - loz));
      ink = vec3(.78, .44, .05);
    } else {
      vec2 g = q * .6; g.x += .5 * floor(g.y);
      vec2 c = fract(g) - .5; float r = length(c), th = hosAtan(c.y, c.x);
      pat = (1. - smoothstep(0., .04, r - .17 - .12 * cos(5. * th + floor(g.y) * 1.3))) * smoothstep(.04, .075, r);
      vec2 c2 = fract(g * 3. + .5) - .5; pat = max(pat, (1. - smoothstep(.05, .1, length(c2))) * step(.37, r));
      ink = vec3(.86, .8, .62);
    }
    alb = mix(alb, ink, pat * mix(.3, .92, fine));
    float wv = sin(vO.x * 9.) * sin(vO.y * 9. + vO.z * 9.);
    alb *= .86 + .1 * wv * fine + .14 * n1;
    N = normalize(N + uSun * .35); gloss = .15;
  }
  float mx = max(alb.r, max(alb.g, alb.b)); alb *= 1. / (1. + .5 * mx);               // keep colour in the palest things
  float outdoors = max(step(.3, vP.z), max(step(32.3, vP.x), step(vP.z, -480.3)));
  hosExtT = mix(.55, 1., outdoors);                                                    // indoors only the boards may bloom
  vec3 col = hosShade(alb, vP, N, V, gloss);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// sand: wind ripples, a wet margin, shell grit and sparkle; lit by the same light (so the net shed stripes it,
// the house shades it and the palms dapple it)
const SAND_VERT = /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec3 vV;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.);
  vP = wp.xyz; vN = normal; vV = cameraPosition - wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const sandFrag = (lightGlsl) => /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec3 vV;
uniform vec3 uSandA; uniform vec3 uSandB; uniform vec3 uWet; uniform float uSea;
#include <fog_pars_fragment>
${lightGlsl}
void main(){
  vec3 V = vV / max(length(vV), 1e-3);
  vec2 q = vP.xz;
  float px = length(fwidth(q));
  float fine = 1. - smoothstep(.15, .9, px), mid = 1. - smoothstep(1.2, 6., px);
  float warp = hosNoise(q * .05) * 6. + hosNoise(q * .013) * 14.;
  float rip = sin((q.x * .8 + q.y * .6) * 2.4 + warp);                       // wind ripples across the breeze
  float dune = hosNoise(q * .021 + 7.) * .6 + hosNoise(q * .11) * .4;
  vec3 N = normalize(vN + vec3(.8, 0., .6) * rip * .3 * fine);
  vec3 alb = mix(uSandB, uSandA, .35 + .65 * dune) * .43;
  alb *= .88 + .12 * rip * fine;
  alb *= .9 + .2 * hosNoise(q * .55) * mid;
  float grit = hosNoise(q * 5.);
  alb *= 1. - .2 * smoothstep(.78, .9, grit) * fine;                                 // shell and weed grit
  float tracks = smoothstep(.62, .7, hosNoise(q * vec2(.7, .16) + 3.)) * mid;  // scuffed lanes where feet go
  alb *= 1. - .1 * tracks;
  float wet = 1. - smoothstep(uSea + .35, uSea + 1.5, vP.y + .35 * hosNoise(q * .09 + uHos.x * .05));
  alb = mix(alb, uWet, wet * .8);
  float spark = step(.992, hosHash(floor(q * 9.) + floor(V.xz * 14.))) * fine;
  vec3 col = hosShade(alb, vP, N, V, .2 + wet * 2.2) * (1. + spark * 1.2);
  // the house floor's seams of light on the sand under it
  float under = step(vP.y, 15.) * step(abs(vP.x), 31.) * step(vP.z, -2.) * step(-478., vP.z);
  float seam = smoothstep(.42, .5, abs(fract(vP.x / 3.2) - .5)) * smoothstep(.3, .7, hosNoise(vec2(vP.x * 1.3, vP.z * .05)));
  col += under * seam * alb * uOutSun * .35;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// soft dark blobs under furniture (contact shadow) and the sand burst puffs
const BLOB_VERT = /* glsl */`
attribute float aA; varying float vA;
#include <fog_pars_vertex>
void main(){ vA = aA; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BLOB_FRAG = /* glsl */`
varying float vA; uniform vec3 uTint;
void main(){ float a = vA * vA * (3. - 2. * vA); gl_FragColor = vec4(uTint, a * .62); }`;
// the sand burst: a low fan of sunlit sand thrown out from under the edges of the fallen wall, never a cloud
const BURST_VERT = /* glsl */`
attribute vec4 aSeed; attribute vec2 aCorner;
uniform float uBurst; uniform vec4 uHos; uniform vec3 uOrigin;
varying vec2 vUv; varying float vA; varying float vSeed;
#include <fog_pars_vertex>
void main(){
  float s = max(uBurst - aSeed.w * .25, 0.);                      // seconds-ish since the wall landed
  float life = clamp(s / (.85 + aSeed.z * .7), 0., 1.);
  float e = aSeed.x * 2. - 1.;                                    // where along the panel's edge: the far lip, or one of its sides
  float sideK = step(.62, abs(e)), sg = sign(e);
  vec3 start = mix(vec3(e / .62 * 15., 0., 0.), vec3(sg * 15., .3, 2. + 12. * fract(aSeed.y * 7.)), sideK);
  vec3 dir = mix(vec3(e * .9, 0., -1.), vec3(sg, 0., -.25 + .3 * aSeed.z), sideK);
  dir = normalize(dir + vec3(0., .08 + .22 * aSeed.y * aSeed.y, 0.));
  float sp = 10. + 22. * aSeed.z;
  vec3 c = uOrigin + start + dir * sp * (1. - exp(-s * 1.7)) + vec3(-1.5, 0., -.4) * s * 4.5;
  c.y += .9 + 2.6 * aSeed.y * (1. - exp(-s * 2.)) - s * s * .6;
  float big = step(.84, fract(aSeed.w * 13.7)) * (1. - sideK);    // a few long streaks thrown off the lip
  float size = (1.4 + 3.2 * aSeed.z * aSeed.z) * (.5 + life * .9) * (1. + big * .8) * (1. - .25 * sideK);
  vA = step(.0001, s) * (1. - life * life) * smoothstep(0., .08, life);
  vUv = aCorner; vSeed = aSeed.x * 17. + aSeed.y * 5.;
  vec4 mvPosition = viewMatrix * vec4(c, 1.);
  mvPosition.xy += aCorner * size * vec2(2.3 + big * 1.7, .85);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BURST_FRAG = /* glsl */`
varying vec2 vUv; varying float vA; varying float vSeed; uniform vec3 uTint; uniform vec3 uShade;
#include <fog_pars_fragment>
float bh(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float bn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(bh(i), bh(i + vec2(1., 0.)), f.x), mix(bh(i + vec2(0., 1.)), bh(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  float r = length(vUv);
  float n = bn(vUv * vec2(5., 2.6) + vSeed) * .6 + bn(vUv * vec2(13., 6.) - vSeed) * .4;
  float grit = step(.7, bn(vUv * vec2(46., 20.) + vSeed * 3.));                   // grains, not cotton
  float a = vA * smoothstep(1., .2, r + (n - .5) * .9) * (.55 + .35 * grit);
  if (a < .004) discard;
  // sunlit on top, its own shade underneath: that is what lifts a spray of pale sand off a pale beach
  vec3 col = mix(uShade, uTint * (.85 + .4 * n), smoothstep(-.55, .35, vUv.y + (n - .5) * .7));
  gl_FragColor = vec4(col * a, a);
}`;

// the line of surf on the bar: a ribbon along the shore, 24 m out. A breaker's white edge runs in toward the beach,
// leaves lace behind it and fades, again and again, out of step along the shore
const SURF_VERT = /* glsl */`
attribute vec2 aUV; varying vec2 vUV;
#include <fog_pars_vertex>
void main(){ vUV = aUV; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SURF_FRAG = /* glsl */`
varying vec2 vUV; uniform vec3 uFoam; uniform vec4 uHos;
#include <fog_pars_fragment>
float sh(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float sn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(sh(i), sh(i + vec2(1., 0.)), f.x), mix(sh(i + vec2(0., 1.)), sh(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  float u = vUV.x, v = vUV.y, t = uHos.x;                                   // v: 0 toward the beach, 1 out to sea
  float ph = fract(t * .12 + sn(vec2(u * .011, 3.)) * 2.3), env = sin(3.1416 * ph);
  float c = .8 - .6 * ph + .05 * sin(u * .21 + t * .7);
  float line = 1. - smoothstep(.02, .11, abs(v - c));
  float lace = smoothstep(c, c + .05, v) * (1. - smoothstep(c + .12, c + .5, v)) * smoothstep(.42, .66, sn(vec2(u * .42, v * 5. - t * .25)));
  float still = (1. - smoothstep(.0, .08, abs(v - .26 - .05 * sin(u * .045 + t * .35)))) * (.35 + .4 * sn(vec2(u * .27 - t * .3, 1.)));
  float a = clamp(env * (line * (.65 + .35 * sn(vec2(u * .8, t * .6))) + lace * .6) + still, 0., 1.);
  a *= smoothstep(0., .08, v) * smoothstep(1., .9, v);
  if (a < .01) discard;
  gl_FragColor = vec4(uFoam, a * .92);
  #include <fog_fragment>
}`;
// silver morning: the low sun's glitter path on the pewter sea. A wedge that follows the eye and points at the sun;
// near, it breaks into dashes that crawl; far out it runs together into one bright band and sinks into the mist
const GLIT_VERT = /* glsl */`
attribute float aLat; varying float vLat; varying vec3 vW;
#include <fog_pars_vertex>
void main(){ vLat = aLat; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GLIT_FRAG = /* glsl */`
varying float vLat; varying vec3 vW; uniform vec3 uCol; uniform vec4 uHos;
#include <fog_pars_fragment>
float gh(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float gn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(gh(i), gh(i + vec2(1., 0.)), f.x), mix(gh(i + vec2(0., 1.)), gh(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  float d = length(vW.xz - cameraPosition.xz), t = uHos.x;
  float la = log(max(d, 1.)) * 15., lb = vLat * 9.;
  float pw = fwidth(la);
  float n1 = gn(vec2(lb + t * .25, la - t * .9)), n2 = gn(vec2(lb * 2.3 - t * .4, la * 2.1 + t * 1.3));
  float sp = smoothstep(.5, .62, n1) * .85 + smoothstep(.6, .7, n2) * .6;
  float g = mix(sp, .42, smoothstep(.35, 1.2, pw));
  float lat = exp(-vLat * vLat * 4.5) * (1. - vLat * vLat);
  vec3 col = uCol * (g * lat * smoothstep(40., 110., d));
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      col *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * .5);
    #else
      col *= 1. - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  gl_FragColor = vec4(col, 1.);
}`;

// =====================================================================================================
// 3. Looks, ground, sky, sea
// =====================================================================================================
const LOOKS = {
  afternoon: {
    sky: { preset: 'day', zenith: '#1747a8', mid: '#3f86d8', horizon: '#cfe4ee', ground: '#9fc4c0', horizonPow: 5, scatter: 0.22, sunIntensity: 11,
      clouds: false, clouds2: { coverage: 0.3, opacity: 0.45, stretch: 1 } },
    fog: '#bcd6e4', fogD: 0.00062, sea: { deep: '#0b5a4c', scatter: '#49d0a8', shallowColor: '#58e0c0', foamColor: '#f4f8f4' },
    sandA: '#f3ead4', sandB: '#d6c49c', wet: '#8f8468', exposure: 1.0, bloom: 0.42, tint: '#fffaf0', shadow: '#0a0c1c', sat: 1.1, contrast: 1.07,
    cloud: [[420, 150, -1700, 620], [1250, 170, -1000, 700], [-250, 190, -2100, 560]], dust: ['#ffe9c0', '#fff6e0', '#ffd9a0'], mist: 0,
  },
  morning: {     // pearl light: a low sun through thin mist on the left, a pewter sea with a silver path, warm timber, cool shade
    sky: { preset: 'dawn', zenith: '#4f7fc0', mid: '#9dbbd8', horizon: '#f3e2c8', ground: '#b4b0a8', horizonPow: 2.6, scatter: 0.6, scatterColor: '#ffd9a6', scatterPow: 2.4,
      scatterHigh: 0.3, sunIntensity: 3, sunSize: 2.3, sunGlow: 1.3, clouds: { coverage: 0.42, opacity: 0.72, softness: 0.4, lit: '#fff0d6', shade: '#8492b6' },
      clouds2: { coverage: 0.3, opacity: 0.45, stretch: 1, lit: '#fff1dc', shade: '#9fb0cc' } },
    skySun: [-0.549, 0.191, -0.814],     // the veiled sun the sky and the sea show: low over the water ahead and left, between the palms (the house is lit from its own side)
    fog: '#ecdfcc', fogD: 0.00078, sea: { deep: '#1a2b40', scatter: '#7fa6b8', shallowColor: '#9cc6c4', foamColor: '#fbf6ee', sunColor: '#fff0d8', sunIntensity: 2.2, glint: 1, glitter: 1, roughness: 0.045, reflectivity: 0.75,
      horizon: '#c9ccd0', mid: '#788a9e', zenith: '#42618c', scatter: 0.3 },     // the sea mirrors a greyer sky than the one we see: pewter under pearl
    glitter: [1.15, 1.05, 0.9],
    sandA: '#f7e8cc', sandB: '#dcc59c', wet: '#8c8474', exposure: 1.0, bloom: 0.5, tint: '#fff7ea', shadow: '#0a1230', sat: 1.14,
    cloud: [[-520, 230, -1900, 700], [900, 210, -1500, 600]], dust: ['#fff0d8', '#ffffff', '#ffe2b8'], mist: 1,
  },
  copper: {
    sky: { preset: 'goldenHour', zenith: '#31408e', mid: '#8a6aa8', horizon: '#f6a868', ground: '#7a5a8a', horizonPow: 3, scatter: 0.55, scatterColor: '#ff9a4a',
      sunIntensity: 11, clouds: false, clouds2: { coverage: 0.42, opacity: 0.6, stretch: 1, lit: '#ffc890', shade: '#7a5a98' } },
    fog: '#c98f86', fogD: 0.0007, sea: { deep: '#2c2468', scatter: '#b06a9a', shallowColor: '#c07a7a', foamColor: '#ffc89a' },
    sandA: '#f0dcc0', sandB: '#c9a888', wet: '#7a6470', exposure: 1.0, bloom: 0.46, tint: '#fff2e4', shadow: '#140a24', sat: 1.05,
    cloud: [[380, 140, -1600, 640], [1200, 160, -900, 720], [-300, 170, -2000, 520]], dust: ['#ffc070', '#ffd9a0', '#ff9a50'], mist: 0,
  },
};
const pickLook = (ctx) => {
  const h = ctx.vary?.hour || 'any';
  if (h === 'dawn') return 'morning';
  if (h === 'golden' || h === 'night') return 'copper';
  if (h === 'day') return 'afternoon';
  const s = Math.abs(ctx.seed | 0);
  return ['afternoon', 'morning', 'copper'][(s * 7 + (s >> 2)) % 3];
};

// sand height: flat by the stair, a bank where the end wall lands, a round dune on it that the portal stands on,
// falling to the water at z = -618 ahead and x = 190 on the right; low dunes under the grove on the left
function makeSandH(noise) {
  return (x, z) => {
    const a = z + 618, b = 190 - x, k = 60, hh = Math.max(k - Math.abs(a - b), 0) / k, t = Math.min(a, b) - hh * hh * k * 0.25;
    let h = t < 0 ? SEA + t * 0.085 : SEA + 2 * sm(0, 46, t);
    const corridor = sm(40, 110, Math.abs(x)) + sm(175, 260, z);
    h += (noise.fbm2(x * 0.011 + 3, z * 0.011, 3) * 1.6 + 0.4) * sm(30, 120, t) * Math.min(1, 0.12 + corridor);
    h += 3.2 * sm(-70, -330, x) * sm(0, 80, t);
    h += 6 * sm(-478, -506, z) * (1 - sm(-578, -612, z)) * (1 - sm(50, 130, Math.abs(x)));
    const mx = x / 40, mz = (z + 556) / 30;                                    // the dune the portal stands on (its foot at y = 11.5)
    h += 5.3 * Math.exp(-(mx * mx + mz * mz) * 1.6);
    return h;
  };
}

async function buildGround(ctx, scene, hero, look, sandH) {
  const U = hero.light.uniforms, fogU = () => THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
  const uni = { ...fogU(), uSandA: { value: new THREE.Color(look.sandA) }, uSandB: { value: new THREE.Color(look.sandB) }, uWet: { value: new THREE.Color(look.wet) }, uSea: { value: SEA } };
  for (const key in U) uni[key] = U[key];
  const mat = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: SAND_VERT, fragmentShader: sandFrag(hero.light.glsl), fog: true });
  const NX = 112, NZ = 150, pos = new Float32Array((NX + 1) * (NZ + 1) * 3), nor = new Float32Array((NX + 1) * (NZ + 1) * 3), idx = new Uint32Array(NX * NZ * 6);
  const xs = (i) => { const s = (i / NX) * 2 - 1; return 20 + 190 * s + 370 * s * s * s; };      // denser round the house and the beach
  const zs = (j) => 300 - (j / NZ) * 1100;
  for (let j = 0; j <= NZ; j++) {
    for (let i = 0; i <= NX; i++) {
      const x = xs(i), z = zs(j), o = (j * (NX + 1) + i) * 3, h = sandH(x, z);
      pos[o] = x; pos[o + 1] = h; pos[o + 2] = z;
      const dx = sandH(x + 2, z) - sandH(x - 2, z), dz = sandH(x, z + 2) - sandH(x, z - 2), l = Math.hypot(dx, 4, dz);
      nor[o] = -dx / l; nor[o + 1] = 4 / l; nor[o + 2] = -dz / l;
    }
    if ((j & 3) === 3) await ctx.yield();
  }
  await ctx.yield();
  for (let j = 0, n = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx[n++] = a; idx[n++] = b; idx[n++] = c; idx[n++] = b; idx[n++] = d; idx[n++] = c; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'sand'; scene.add(mesh);
  await ctx.yield();
  return mesh;
}

async function buildSkySea(ctx, scene, hero, look, lookName, sandH) {
  const rng = ctx.rng.fork('sky');
  const sky = makeSky({ rng, ...look.sky, sunDirection: look.skySun ? new THREE.Vector3(...look.skySun).normalize() : hero.anchors.sunDir.clone() });
  scene.add(sky.object);
  scene.fog = new THREE.FogExp2(new THREE.Color(look.fog), look.fogD);
  await ctx.yield();
  const rig = makeLightRig(sky, { bounce: 0.5 }); scene.add(rig.object);
  await ctx.yield();
  const clouds = makeCloudField({ rng, sky, at: look.cloud, count: look.cloud.length, puffs: 40, wind: [-4, 0, 0.6], opacity: lookName === 'morning' ? 0.5 : 0.85 });
  scene.add(clouds.object);
  await ctx.yield();
  const sea = Water.makeOcean({ rng: ctx.rng.fork('sea'), sky, level: SEA, preset: lookName === 'morning' ? 'calm' : 'breeze', rings: 96, segments: 128, radius: 3400, ...look.sea, depthAt: (x, z) => SEA - sandH(x, z), depthRect: [-560, -900, 760, 320], depthRes: 96, shoalDepth: 6, shoalWidth: 34, windAngle: 2.6 });
  scene.add(sea.object);
  await ctx.yield();
  return { sky, rig, clouds, sea };
}

// forty coconut palms: a grove on the left, two leaning out over the beach either side of the portal axis
async function buildPalms(ctx, scene, sandH, look, density) {
  const rng = ctx.rng.fork('palms'), detail = ctx.quality?.detail ?? 1;
  const wind = flora.makeWind({ direction: [WIND[0], WIND[2]], strength: 1.5, speed: 1.3, gustiness: 0.7 });
  const matOpts = { wind, backlight: 1.1, ambient: 2.4, leafAmbient: 2.1 };
  await ctx.yield();
  await flora.prepareLeafTexture(matOpts, ctx.yield);                           // the leaf atlas, drawn in short steps
  await ctx.yield();
  const mat = flora.windMaterial(matOpts);
  await ctx.yield();
  const variants = [];
  for (let i = 0; i < 3; i++) { variants.push(flora.palmGeometry({ rng, detail: 1, height: 13 + i, curve: 0.35 + 0.25 * i, fronds: 13, leaf: '#4f8a2c', bark: '#8a7458' })); await ctx.yield(); }
  const pts = [];
  const add = (x, z, s, rot, v) => pts.push({ x, y: sandH(x, z), z, s, rot, d: 100, u: 0, v });
  add(-36, -548, 4.1, 2.4, 2); add(42, -592, 4.4, -0.6, 2);
  const n = Math.round(38 * Math.min(1.2, density) * (detail < 1 ? 0.75 : 1));
  for (let i = 0; i < n; i++) {
    const z = lerp(190, -640, (i + rng()) / n), x = -62 - rng() * rng() * 190 - (rng.chance(0.3) ? 0 : 14);
    add(x, z, rng.range(3.5, 4.6), rng.range(0, 6.28), i % 3);
  }
  for (let i = 0; i < 5; i++) add(rng.range(80, 150), rng.range(120, 260), rng.range(3.4, 4.2), rng.range(0, 6.28), i % 3);     // a few behind us on the sea side
  const grove = flora.makeScatter({ rng, variants, points: pts, material: mat, tilt: 0.12, stretch: 0.2, tint: 0.14, sink: 0.01 });
  scene.add(grove.object);
  return grove;
}

// the shore's own distance function (as in makeSandH): > 0 on land, < 0 metres out to sea
const shoreT = (x, z) => { const a = z + 618, b = 190 - x, k = 60, hh = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - hh * hh * k * 0.25; };
function buildSurf(scene, U, look) {
  const OUT = 24, HALF = 9, pos = [], uv = [], idx = [];
  let x = 190 + OUT, z = 330, L = 0, n = 0, dx = 0, dz = -1;
  for (let i = 0; i < 420 && x > -520; i++) {
    const e = 1.5, gx = (shoreT(x + e, z) - shoreT(x - e, z)) / (2 * e), gz = (shoreT(x, z + e) - shoreT(x, z - e)) / (2 * e), gl = Math.hypot(gx, gz) || 1;
    const nx = gx / gl, nz = gz / gl, err = shoreT(x, z) + OUT;                  // (nx, nz) points toward the beach
    x -= nx * err; z -= nz * err;                                               // back onto the contour
    pos.push(x + nx * HALF, SEA + 0.75, z + nz * HALF, x - nx * HALF, SEA + 0.75, z - nz * HALF); uv.push(L, 0, L, 1);
    if (n > 0) { const a = (n - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    n++;
    let tx = -nz, tz = nx; if (tx * dx + tz * dz < 0) { tx = -tx; tz = -tz; }   // along the shore, the way we were going
    dx = tx; dz = tz; x += tx * 6; z += tz * 6; L += 6;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeBoundingSphere();
  const m = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uFoam: { value: new THREE.Color(look.sea.foamColor).multiplyScalar(look.surf ?? 1.1) }, uHos: U.uHos },
    vertexShader: SURF_VERT, fragmentShader: SURF_FRAG, transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'surf-line'; mesh.renderOrder = 3; scene.add(mesh);
  return mesh;
}
function buildGlitter(scene, U, look, sunDir) {
  const pos = [], lat = [], idx = [], R = 11;
  for (let j = 0; j <= R; j++) {
    const d = 40 * Math.pow(3200 / 40, j / R), hw = d * 0.12;
    for (let i = -1; i <= 1; i++) { pos.push(i * hw, 0, -d); lat.push(i); }
    if (j > 0) { const a = (j - 1) * 3; for (let i = 0; i < 2; i++) idx.push(a + i, a + i + 1, a + i + 3, a + i + 1, a + i + 4, a + i + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aLat', new THREE.Float32BufferAttribute(lat, 1)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uCol: { value: new THREE.Vector3(...look.glitter) }, uHos: U.uHos },
    vertexShader: GLIT_VERT, fragmentShader: GLIT_FRAG, transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'glitter-path'; mesh.renderOrder = 3; mesh.frustumCulled = false;
  mesh.rotation.y = Math.atan2(-sunDir.x, -sunDir.z); mesh.position.set(0, SEA + 0.6, 0);
  scene.add(mesh);
  return mesh;
}

// =====================================================================================================
// 4. Small things used everywhere, then zone A: the net shed, the boat, the swing, the stair, the landing
// =====================================================================================================
K.timber = [0.25, 0.165, 0.1]; K.drift = [0.34, 0.275, 0.2]; K.timberD = [0.13, 0.085, 0.052];
const TAU = Math.PI * 2;
const ball = (r, n = 6, y0 = 0) => { const p = []; for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI; p.push([Math.max(0.001, Math.cos(a) * r), y0 + r + Math.sin(a) * r]); } return p; };
// a glazed jar h tall (foot at y): shoulder, neck, rolled lip, a glaze band
function jar(pb, x, y, z, h, col, band = null, seg = 12) {
  const r = h * 0.36, prof = [[r * 0.5, 0], [r * 0.62, h * 0.04], [r * 0.9, h * 0.25], [r, h * 0.48], [r * 0.9, h * 0.7], [r * 0.55, h * 0.86], [r * 0.5, h * 0.93], [r * 0.62, h], [r * 0.5, h * 1.0], [r * 0.4, h * 0.94]];
  pb.mat(SURF.glaze).lathe(prof, seg, (i) => (band && (i === 4 || i === 5)) ? band : mulc(col, 0.75 + 0.07 * i), x, y, z);
  pb.mat(SURF.wood);
}
// a bush of bougainvillea: dark stems, leaves and magenta bracts that toss
function bougain(pb, rng, x, y, z, r, outdoors = 1) {
  pb.at(x, y, z).mat(SURF.rope).still();
  for (let i = 0; i < 5; i++) { const a = rng() * TAU, rr = r * 0.8; pb.tube([[0, 0, 0], [Math.cos(a) * rr * 0.3, r * 0.6, Math.sin(a) * rr * 0.3], [Math.cos(a) * rr, r * (0.9 + rng() * 0.5), Math.sin(a) * rr]], 0.09, K.timberD, 4); }
  pb.mat(SURF.leaf);
  for (let i = 0; i < 46; i++) {
    const a = rng() * TAU, e = rng() * 1.2 - 0.25, rr = r * (0.55 + 0.5 * rng()), cx = Math.cos(a) * Math.cos(e) * rr, cy = r * 0.95 + Math.sin(e) * rr * 0.8, cz = Math.sin(a) * Math.cos(e) * rr;
    const s = 0.34 + rng() * 0.4, t1 = [rng() - 0.5, rng() - 0.5, rng() - 0.5], t2 = [rng() - 0.5, rng() * 0.6, rng() - 0.5];
    const col = i % 4 === 0 ? mulc(K.leaf, 0.6 + rng() * 0.5) : mixc(K.magenta, [0.85, 0.2, 0.5], rng() * 0.6);
    pb.anim(1, 0.35 + rng() * 0.3, rng() * 6, outdoors, [cx, cy, cz]);
    pb.quad([cx - t1[0] * s, cy - t1[1] * s, cz - t1[2] * s], [cx + t2[0] * s, cy + t2[1] * s, cz + t2[2] * s], [cx + t1[0] * s, cy + t1[1] * s, cz + t1[2] * s], [cx - t2[0] * s, cy - t2[1] * s, cz - t2[2] * s], col);
  }
  pb.still().mat(SURF.wood).at();
}
// a turned post with rings and a finial (newels, bed posts, the loom)
function turned(pb, x, y, z, h, r, col) {
  const prof = [[r * 1.3, 0], [r * 1.3, h * 0.06], [r, h * 0.08], [r * 0.82, h * 0.3], [r * 1.05, h * 0.36], [r * 0.8, h * 0.42], [r * 0.78, h * 0.78], [r * 1.25, h * 0.82], [r * 1.25, h * 0.86], [r * 0.55, h * 0.89], [r * 0.95, h * 0.95], [r * 0.5, h * 0.99], [0.01, h]];
  pb.lathe(prof, 8, (i) => mulc(col, 0.8 + 0.3 * ((i * 7) % 3) / 2), x, y, z);
}
// a net hung between two points, bellying; glass floats along its foot
function netSwag(pb, a, b, drop, sag, phase, outdoors, floats = 5) {
  const P = (u, v) => { const s = Math.sin(Math.PI * u); return [lerp(a[0], b[0], u) + Math.sin(u * 9 + phase) * 0.25 * v, lerp(a[1], b[1], u) - sag * s - drop * v * (0.75 + 0.25 * s), lerp(a[2], b[2], u) + Math.sin(v * 2.5 + phase) * 0.5 * v]; };
  const piv = [(a[0] + b[0]) / 2, a[1], (a[2] + b[2]) / 2];
  pb.mat(SURF.net).anim(1, 1.5, phase, outdoors, piv);
  pb.sheet(P, 10, 4, (u, v) => mulc(mixc(K.rope, K.jade, 0.25 + 0.2 * Math.sin(u * 7 + phase)), 0.9 - 0.25 * v), (u, v) => v * (0.35 + 0.65 * Math.sin(Math.PI * u)) + 0.08 * Math.sin(Math.PI * u), false);
  pb.mat(SURF.rope).anim(1, 1.5, phase, outdoors, piv);
  const top = []; const tw = [];
  for (let i = 0; i <= 10; i++) { top.push(P(i / 10, 0)); tw.push(0.08 * Math.sin(Math.PI * i / 10)); }
  pb.tube(top, 0.16, K.rope, 4, tw);
  pb.mat(SURF.glaze);
  for (let i = 0; i < floats; i++) {
    const u = (i + 0.5) / floats, q = P(u, 1), w = 0.35 + 0.65 * Math.sin(Math.PI * u);
    pb.anim(1, 1.5 * w, phase, outdoors, piv);
    pb.lathe(ball(0.62, 5), 7, mulc(K.glass, 0.8 + 0.3 * (i % 2)), q[0], q[1] - 0.9, q[2]);
  }
  pb.still().mat(SURF.wood);
}

async function buildFront(pb, rng, blobs, y) {
  pb.at().still().mat(SURF.wood);
  await y();
  // ---- the net shed: posts, beams, joists, a slatted drying floor
  const rows = [94, 113, 132, 151, 170];
  for (const z of rows) {
    for (const x of [-27, -9, 9, 27]) {
      const tone = 0.85 + rng() * 0.3;
      pb.box(x, 7.4, z, 2.4, 16.8, 2.4, mulc(mixc(K.timber, K.drift, 0.3), tone), 0.34, [0.7, 1.05]);
      pb.box(x, 0.3, z, 3.6, 1.6, 3.6, mulc(K.timber, 0.7), 0.4);                                  // footing
      pb.box(x, 13.6, z, 3.2, 0.7, 3.2, mulc(K.timber, 0.9), 0.2);                                // collar
      for (const s of [-1, 1]) pb.beam([x + s * 1.1, 10.5, z], [x + s * 4.6, 14.6, z], 0.8, 0.9, mulc(K.timber, 0.9));   // knee braces
      blobs.push([x, 0.12, z, 4.2, 4.2, 0.8]);
      // rope lashings
      pb.mat(SURF.rope); for (let i = 0; i < 3; i++) pb.lathe([[1.42, 0], [1.5, 0.12], [1.42, 0.24]], 8, K.rope, x, 9.6 + i * 0.3, z, 1.2, 1.2); pb.mat(SURF.wood);
    }
    pb.beam([-30, 14.9, z], [30, 14.9, z], 1.5, 1.3, mulc(K.timber, 0.95), 0.2);
  }
  for (const x of [-27, -9, 9, 27]) pb.beam([x, 13.9, 172], [x, 13.9, 92], 1.1, 1.3, mulc(K.timber, 0.85), 0.2);
  for (let i = 0; i < 20; i++) { const x = -28.5 + 3 * i; pb.beam([x, 15.85, 171.5], [x, 15.85, 91.5], 1.8, 0.5, mulc(K.drift, 0.75 + 0.4 * rng()), 0.1); }
  await y();
  // ---- nets in swags with green glass floats, down the outer rows and across behind the lane
  for (let r = 0; r + 1 < rows.length; r++) {
    netSwag(pb, [-27, 13.2, rows[r] + 1.5], [-27, 13.2, rows[r + 1] - 1.5], 6.5, 2.2, r * 1.7, 1);
    if (r !== 1) netSwag(pb, [-9.6, 13.4, rows[r] + 1.5], [-9.6, 13.4, rows[r + 1] - 1.5], 3.2, 1.6, r * 2.3 + 1, 1, 4);
    if (r === 0 || r === 3) netSwag(pb, [27, 13.2, rows[r] + 1.5], [27, 13.2, rows[r + 1] - 1.5], 6, 2.4, r + 4, 1);
  }
  netSwag(pb, [-25.5, 13.4, 113], [-10.5, 13.4, 113], 5.5, 2, 5.1, 1);
  await y();
  // ---- the fishing boat on rollers, 14 m right of the lane: turquoise, white and red bands, a carved prow crook
  {
    const X = 18, Z0 = 148.5, L = 44;
    const hull = (u, v) => {
      const e = 2 * u - 1, b = 5.2 * Math.pow(Math.max(0, 1 - e * e), 0.55) + 0.05, gun = 6.6 + 3.2 * e * e + (e < 0 ? 1.2 * e * e : 0), keel = 1.4 + 3.4 * Math.pow(Math.abs(e), 3.2);
      const th = Math.PI * v, c = Math.cos(th), s = Math.sin(th);
      return [X - b * c * (0.55 + 0.45 * Math.abs(c)), lerp(gun, keel, Math.pow(s, 0.75)), Z0 - u * L];
    };
    const band = (u, v) => { const d = Math.min(v, 1 - v); return d < 0.07 ? K.turq : d < 0.105 ? K.white : d < 0.15 ? K.red : d < 0.3 ? mulc(K.turq, 0.75) : mulc(K.timber, 0.8); };
    pb.sheet(hull, 22, 16, (u, v) => mulc(band(u, v), 0.85 + 0.15 * Math.sin(u * 40)), null, true);
    for (let i = 1; i < 6; i++) { const u = i / 6, a = hull(u, 0.03), b = hull(u, 0.97); pb.beam([a[0], a[1] - 0.5, a[2]], [b[0], b[1] - 0.5, b[2]], 1.5, 0.45, mulc(K.timber, 1.1)); }   // thwarts
    for (const v of [0.012, 0.988]) { const g = []; for (let i = 0; i <= 14; i++) g.push(hull(i / 14, v)); pb.tube(g, 0.3, K.gold, 5); }   // gilt gunwale
    const bow = hull(1, 0.5), crook = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12, a = t * 4.4; crook.push([X, bow[1] + 3.6 + t * 4.5 + Math.sin(a) * (1.6 - t), bow[2] - 0.6 - Math.cos(a) * (1.6 - t) + 1.4]); }
    pb.tube([[X, bow[1] + 3, bow[2] + 0.4], crook[0]], 0.5, K.red, 6); pb.tube(crook, 0.42, K.gold, 6);
    const st = hull(0, 0.5); pb.beam([X, st[1] + 1.5, st[2] - 0.2], [X, st[1] + 6.5, st[2] + 1.2], 0.8, 1.1, K.red);
    for (let i = 0; i < 5; i++) { const z = Z0 - 6 - i * 8; pb.beam([X - 7, 0.75, z], [X + 7, 0.75, z], 1.5, 1.5, mulc(K.drift, 0.85), 0.5); }   // rollers
    blobs.push([X + 1.5, 0.14, Z0 - L / 2, 9.5, 25, 0.95]);
    pb.mat(SURF.rope).tube([[X - 3, 7.2, 126], [X - 6.5, 4, 127], [X - 8, 0.4, 131], [X - 7.6, 0.4, 136]], 0.2, K.rope, 5); pb.mat(SURF.wood);
    for (let i = 0; i < 3; i++) pb.beam([X + 5.6, 0.5, 112 + i * 0.9], [X + 8.8, 7.5, 124 + i * 0.6], 0.5, 0.5, mulc(K.drift, 1.1));               // oars leaning
  }
  await y();
  // ---- the rope swing, still moving
  pb.anim(3, 0.42, 1.3, 1, [-18, 14.4, 126]);
  pb.mat(SURF.rope); pb.tube([[-19.6, 14.4, 126], [-19.6, 4.2, 126]], 0.15, K.rope, 5); pb.tube([[-16.4, 14.4, 126], [-16.4, 4.2, 126]], 0.15, K.rope, 5);
  pb.mat(SURF.wood); pb.box(-18, 4, 126, 4.4, 0.4, 1.4, K.timber, 0.1); pb.still();
  blobs.push([-17, 0.13, 126, 3, 2, 0.5]);
  // baskets and a coil of rope by the lane, a stack of fish traps on the left
  for (const [x, z, s] of [[-13.5, 141, 1.2], [-15.5, 137.5, 0.9], [-13, 104, 1]]) {
    pb.mat(SURF.weave).lathe([[1.2 * s, 0], [1.65 * s, 0.6 * s], [1.9 * s, 1.3 * s], [1.94 * s, 1.8 * s], [1.78 * s, 2.2 * s], [1.84 * s, 2.34 * s], [1.66 * s, 2.34 * s], [1.5 * s, 0.3 * s]], 14, (i) => mulc(K.rattan, 0.72 + 0.05 * i), x, 0.1, z);
    blobs.push([x, 0.13, z, 3 * s, 3 * s, 0.7]);
  }
  pb.mat(SURF.rope); for (let i = 0; i < 4; i++) pb.lathe([[1.3, 0], [1.6, 0.2], [1.3, 0.4]], 10, mulc(K.rope, 0.8 + 0.1 * i), -12.5, 0.15 + i * 0.36, 122, 1 - i * 0.06, 1 - i * 0.06);
  pb.mat(SURF.wood);
  await y();
  // ---- the stair: sixteen open treads, stringers, carved newels, rails, balusters
  for (let i = 0; i < 16; i++) {
    const y = i + 1, z = 76 - 4 * i;
    pb.box(0, y - 0.32, z, 28, 0.64, 3.5, mulc(K.drift, 0.95 + 0.25 * rng()), 0.12);
    pb.box(0, y - 0.9, z + 1.2, 27, 0.5, 0.5, mulc(K.timber, 0.6), 0.1);
    for (const s of [-1, 1]) pb.box(s * 13.6, y + 2.4, z, 0.5, 4.8, 0.5, mulc(K.timber, 1.05), 0.1);
  }
  for (const s of [-1, 1]) {
    pb.beam([s * 13.2, -0.6, 79.5], [s * 13.2, 15.1, 15], 1.1, 2.2, mulc(K.timber, 0.8), 0.2);
    pb.beam([s * 4.5, -0.6, 79.5], [s * 4.5, 15.1, 15], 0.9, 1.8, mulc(K.timber, 0.6), 0.2);
    turned(pb, s * 14.6, 0, 79, 8.2, 0.85, K.timber); turned(pb, s * 14.6, 16, 14.6, 7.4, 0.8, K.timber);
    pb.beam([s * 13.6, 6.2, 78.6], [s * 13.6, 21.6, 15.2], 0.7, 0.8, mulc(K.timber, 1.15), 0.2);
    blobs.push([s * 14.6, 0.12, 79, 2.6, 2.6, 0.7]);
  }
  // a pair of sandals on the bottom step
  for (const [x, z, r] of [[5.2, 76.6, 0.12], [7.1, 76.2, -0.2]]) {
    pb.at(x, 1.02, z, r);
    pb.lathe([[0.01, 0.3], [0.9, 0.3], [1, 0.16], [0.9, 0], [0.01, 0]], 12, (i) => mulc(K.sandal, i < 2 ? 1.25 : 0.7), 0, 0, 0, 0.6, 1.5);
    pb.mat(SURF.cloth).tube([[-0.55, 0.3, -0.5], [-0.3, 0.75, -0.75], [0, 0.85, -0.85], [0.3, 0.75, -0.75], [0.55, 0.3, -0.5]], 0.11, K.magenta, 5);
    pb.tube([[0, 0.85, -0.85], [0, 0.4, -1.25]], 0.09, K.magenta, 5); pb.mat(SURF.wood).at();
  }
  await y();
  // ---- the landing: boards, a mat at the door, jars of bougainvillea shedding bracts
  for (let i = 0; i < 10; i++) pb.box(0, 15.66, 13.3 - i * 1.4, 30, 0.68, 1.36, mulc(K.timber, 0.85 + 0.3 * rng()), 0.08);
  for (const x of [-13, 13]) for (const z of [12.5, 2]) pb.box(x, 7.5, z, 1.4, 15.6, 1.4, mulc(K.timber, 0.7), 0.2, [0.6, 1]);
  pb.mat(SURF.cloth).sheet((u, v) => [-7 + 14 * u, 16.06, 10.5 - 6 * v], 14, 6, (u, v, i, j) => ((i + j) & 1) ? K.pandan : mulc(mixc(K.pandan, K.magenta, 0.55), 0.8));
  pb.mat(SURF.wood);
  for (const s of [-1, 1]) { jar(pb, s * 13.1, 16, 9.2, 3, s < 0 ? mulc(K.jade, 0.8) : K.indigo, K.gold); bougain(pb, rng, s * 13.1, 18.6, 9.2, 2.3, 1); }
}

// =====================================================================================================
// 5. The twelve bays. Floor y = 16; the path runs 7 m over it, so tall things keep 8 m or more to the side.
// =====================================================================================================
const pill = (r, h, n = 5) => { const p = []; for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI; p.push([Math.max(0.001, Math.cos(a) * r), h / 2 + Math.sin(a) * h / 2]); } return p; };
function matOn(pb, x0, x1, z0, z1, nx, nz, ca, cb, edge) {
  pb.mat(SURF.cloth).still();
  pb.sheet((u, v) => [lerp(x0, x1, u), FLOOR + 0.07 + 0.04 * Math.sin(u * 40) * Math.sin(v * 31), lerp(z0, z1, v)], nx, nz,
    (u, v, i, j) => (i === 0 || j === 0 || i === nx - 1 || j === nz - 1) ? edge : ((i + j) & 1) ? ca : mulc(cb, 0.85 + 0.3 * ((i * 7 + j * 3) % 5) / 5));
  pb.mat(SURF.wood);
}
function tray(pb, x, y, z, r, glasses, rng) {
  pb.mat(SURF.brass).lathe([[r * 0.3, 0], [r * 0.34, 0.5], [r * 0.2, 0.7], [r * 0.96, 0.9], [r * 1.06, 1.25], [r, 1.25], [r * 0.9, 1.02], [0.01, 1.02]], 16, (i) => mulc(K.brass, 0.8 + 0.06 * i), x, y, z);
  for (let i = 0; i < glasses; i++) {
    const a = (i / glasses) * TAU + 0.3, gx = x + Math.cos(a) * r * 0.58, gz = z + Math.sin(a) * r * 0.58;
    pb.mat(SURF.glaze).lathe([[0.2, 0], [0.26, 0.5], [0.3, 0.9], [0.27, 0.9], [0.01, 0.75]], 7, (k) => k > 2 ? [0.55, 0.22, 0.04] : [0.75, 0.6, 0.4], gx, y + 1.02, gz);
  }
  pb.mat(SURF.brass).lathe([[0.4, 0], [0.75, 0.35], [0.8, 0.8], [0.5, 1.25], [0.3, 1.35], [0.34, 1.5], [0.05, 1.7]], 10, K.brass, x, y + 1.02, z);       // the pot
  pb.tube([[x + 0.7, y + 1.6, z], [x + 1.25, y + 1.9, z], [x + 1.45, y + 2.4, z]], 0.09, K.brass, 5);
  pb.mat(SURF.wood);
}
function cushion(pb, x, z, r, col, rot = 0) {
  pb.at(x, FLOOR + 0.05, z, rot).mat(SURF.cloth);
  pb.lathe(pill(r, r * 0.55, 6), 10, (i) => (i === 3) ? K.gold : mulc(col, 0.75 + 0.1 * i), 0, 0, 0, 1.15, 0.9);
  pb.at().mat(SURF.wood);
}
// a moon kite (wau bulan): an oval wing over a crescent, on a bamboo spine; n = facing of its plane (+1 / -1 along x)
function moonKite(pb, cx, cy, cz, s, cols) {
  pb.mat(SURF.cloth);
  pb.sheet((u, v) => { const a = u * TAU, r = v * s; return [cx, cy + Math.sin(a) * r * 0.62, cz + Math.cos(a) * r * 1.25]; }, 18, 3,
    (u, v, i, j) => j === 2 ? cols[0] : ((i + j) & 1) ? cols[1] : cols[2], (u, v) => v);
  pb.sheet((u, v) => { const a = Math.PI * (1.12 + 0.76 * u), r = s * (0.62 + 0.34 * v * Math.sin(Math.PI * u)); return [cx, cy - s * 0.42 + Math.sin(a) * r * 0.9, cz + Math.cos(a) * r]; }, 14, 2,
    (u, v, i, j) => (i & 1) ? cols[0] : cols[2], (u, v) => 0.6 + 0.4 * v);
  pb.mat(SURF.wood).beam([cx, cy + s * 0.7, cz], [cx, cy - s * 1.25, cz], 0.14, 0.14, K.rattan, 0.03);
  pb.mat(SURF.cloth); for (const d of [-1, 1]) pb.quad([cx, cy + s * 0.62, cz], [cx, cy + s * 0.95, cz + d * s * 0.5], [cx, cy + s * 1.05, cz + d * s * 0.42], [cx, cy + s * 0.7, cz], cols[1]);
  pb.mat(SURF.wood);
}

async function buildBays1to5(pb, rng, blobs, hero, y) {
  pb.at().still().mat(SURF.wood);
  await y();
  // ---- 1 reception: checked pandan mats, a brass tray of tea glasses, cushions in the first slab
  matOn(pb, -13, 13, -7, -33, 13, 13, K.pandan, mixc(K.pandan, K.green, 0.6), mulc(K.magenta, 0.8));
  tray(pb, 7.5, FLOOR + 0.1, -19, 2.7, 7, rng); blobs.push([7.5, FLOOR + 0.1, -19, 4.2, 4.2, 0.7]);
  for (const [x, z, c, r] of [[-8, -14, K.magenta, 0.3], [-11.5, -19, K.gold, 1.2], [-7.5, -24.5, K.jade, 2], [12.5, -26, K.magenta, 0.7], [-10, -29, mixc(K.cream, K.gold, 0.3), 1.6]]) {
    cushion(pb, x, z, 1.9, c, r); blobs.push([x, FLOOR + 0.12, z, 3.2, 3, 0.6]);
  }
  pb.box(25, FLOOR + 1.3, -20, 5, 2.6, 22, mulc(K.timber, 0.9), 0.25); pb.box(25, FLOOR + 2.75, -20, 5.6, 0.4, 22.8, K.timber, 0.12);        // a long chest
  for (let i = 0; i < 5; i++) pb.box(22.45, FLOOR + 1.3, -29 + i * 4.5, 0.12, 1.5, 2.8, K.gold, 0.04);
  jar(pb, 25, FLOOR + 2.95, -13, 2.6, K.jade, K.gold); jar(pb, 25, FLOOR + 2.95, -27, 2, K.indigo, K.cream);
  pb.mat(SURF.leaf); for (let i = 0; i < 7; i++) { const a = i * 0.9; pb.quad([25, FLOOR + 5.4, -13], [25 + Math.cos(a) * 0.5, FLOOR + 8.4, -13 + Math.sin(a) * 0.5], [25 + Math.cos(a) * 1.6, FLOOR + 9.6, -13 + Math.sin(a) * 1.6], [25 + Math.cos(a + 0.5) * 0.7, FLOOR + 7.5, -13 + Math.sin(a + 0.5) * 0.7], mulc(K.leaf, 0.7 + 0.1 * i)); }   // pandan
  pb.mat(SURF.wood); blobs.push([25, FLOOR + 0.1, -20, 7, 25, 0.8]);
  await y();
  // ---- 2 play: two moon kites on the wall, tops still spinning on a board, a congkak board
  pb.anim(1, 0.5, 0.4, 0, [30, 34, -52]); moonKite(pb, 30.3, 34, -52, 5.2, [K.magenta, K.gold, K.indigo]);
  pb.anim(1, 0.5, 2.1, 0, [30, 33, -68]); moonKite(pb, 30.3, 32.5, -68, 4.4, [K.jade, K.cream, K.magenta]);
  pb.still();
  pb.box(-11, FLOOR + 0.3, -61, 11, 0.6, 8, mulc(K.timber, 1.15), 0.12); blobs.push([-11, FLOOR + 0.1, -61, 13, 10, 0.5]);
  const topProf = [[0.02, 0], [0.16, 0.25], [1.0, 1.1], [1.12, 1.45], [0.9, 1.7], [0.3, 1.82], [0.22, 2.4], [0.34, 2.5], [0.02, 2.56]];
  [[-13.5, -62.5, K.magenta, 15], [-9.5, -59.5, K.gold, 11], [-10.2, -63.6, K.jade, 19]].forEach(([x, z, c, w], i) => {
    pb.anim(2, w, i * 2.1, 0, [x, FLOOR + 0.6, z]);
    pb.lathe(topProf, 10, (k) => (k === 3) ? K.cream : (k === 2 || k === 4) ? c : mulc(K.timber, 1.4), x, FLOOR + 0.6, z);
    pb.quad([x + 0.3, FLOOR + 2.0, z], [x + 1.05, FLOOR + 2.0, z + 0.1], [x + 1.05, FLOOR + 2.3, z + 0.1], [x + 0.3, FLOOR + 2.3, z], K.cream);     // a painted fleck that shows the spin
  });
  pb.still().at(-7.8, FLOOR + 1.3, -57.5, 0.6, 1, 0, 1.25).lathe(topProf, 10, mulc(K.timber, 1.3), 0, 0, 0).at();
  pb.mat(SURF.rope).tube([[-7, FLOOR + 0.7, -58], [-6, FLOOR + 0.66, -60], [-7.5, FLOOR + 0.66, -62], [-6.4, FLOOR + 0.66, -64.5]], 0.09, K.cream, 4); pb.mat(SURF.wood);
  pb.at(11, FLOOR, -66, 0.35);
  pb.lathe([[0.01, 0], [1.0, 0.1], [1.25, 0.9], [1.1, 1.15], [0.01, 1.05]], 12, (i) => mulc(K.timber, 0.9 + 0.12 * i), 0, 0, 0, 1, 5.5);
  pb.mat(SURF.glaze); for (let i = 0; i < 7; i++) for (const s of [-1, 1]) pb.lathe(ball(0.22, 3), 6, i % 2 ? K.jade : K.cream, s * 0.45, 1.05, (i - 3) * 1.25);
  pb.mat(SURF.wood).at(); blobs.push([11, FLOOR + 0.1, -66, 4, 12, 0.6]);
  cushion(pb, 12, -74.5, 1.7, K.indigo, 0.5); cushion(pb, 13.5, -55, 1.7, K.gold, 2.2);
  await y();
  // ---- 3 loom: a songket loom with gold cloth half woven, hanks on a pole in the light
  {
    const X = 17, Z = -99;
    for (const sx of [-6, 6]) for (const sz of [-8, 8]) turned(pb, X + sx, FLOOR, Z + sz, 10, 0.55, K.timber);
    for (const sx of [-6, 6]) { pb.beam([X + sx, FLOOR + 9.3, Z - 8.6], [X + sx, FLOOR + 9.3, Z + 8.6], 0.7, 0.9, K.timber); pb.beam([X + sx, FLOOR + 3.6, Z - 8.4], [X + sx, FLOOR + 3.6, Z + 8.4], 0.6, 0.8, mulc(K.timber, 0.85)); }
    for (const sz of [-8, 8]) pb.beam([X - 6.6, FLOOR + 9.3, Z + sz], [X + 6.6, FLOOR + 9.3, Z + sz], 0.7, 0.9, K.timber);
    pb.beam([X - 6.4, FLOOR + 4.3, Z + 7.6], [X + 6.4, FLOOR + 4.3, Z + 7.6], 1.1, 1.1, mulc(K.timber, 1.2), 0.3); pb.beam([X - 6.4, FLOOR + 5, Z - 7.6], [X + 6.4, FLOOR + 5, Z - 7.6], 1.1, 1.1, mulc(K.timber, 1.2), 0.3);
    pb.mat(SURF.cloth);
    pb.sheet((u, v) => [X - 5 + 10 * u, FLOOR + 4.9 + 0.1 * v - 0.25 * Math.sin(Math.PI * v), Z + 7.6 - 7 * v], 20, 7, (u, v, i, j) => {      // the woven half: gold on magenta
      const d = Math.abs(((i + j) % 6) - 3) + Math.abs(((i - j + 60) % 6) - 3);
      return (j === 0 || d < 2) ? K.gold : (d === 3 ? mixc(K.gold, K.cream, 0.4) : K.magenta);
    });
    pb.sheet((u, v) => [X - 5 + 10 * u, FLOOR + 4.9 + 0.3 * v, Z + 0.6 - 8.2 * v], 40, 1, (u, v, i) => (i % 3 === 0) ? K.gold : (i % 3 === 1 ? mulc(K.magenta, 0.9) : mulc(K.cream, 0.8)));   // warp
    pb.mat(SURF.wood);
    for (const dz of [1.5, 3.2]) { pb.beam([X - 5.6, FLOOR + 6.3, Z + dz], [X + 5.6, FLOOR + 6.3, Z + dz], 0.3, 2.2, mulc(K.rattan, 0.9), 0.05); for (const s of [-4, 4]) pb.mat(SURF.rope).tube([[X + s, FLOOR + 7.4, Z + dz], [X + s, FLOOR + 9.2, Z + dz]], 0.07, K.rope, 4).mat(SURF.wood); }
    pb.box(X, FLOOR + 1.1, Z + 11, 9, 0.5, 2.4, mulc(K.timber, 1.1), 0.12); for (const s of [-3.6, 3.6]) pb.box(X + s, FLOOR + 0.45, Z + 11, 0.7, 0.9, 2, K.timber, 0.1);
    blobs.push([X, FLOOR + 0.1, Z, 15, 20, 0.85]); blobs.push([X, FLOOR + 0.1, Z + 11, 10, 3.5, 0.6]);
    // hanks on a pole
    const PX = -19;
    for (const z of [-88, -112]) { turned(pb, PX, FLOOR, z, 12.5, 0.5, K.timber); blobs.push([PX, FLOOR + 0.1, z, 2.4, 2.4, 0.7]); }
    pb.beam([PX, FLOOR + 11.6, -87], [PX, FLOOR + 11.6, -113], 0.5, 0.5, K.rattan, 0.12);
    const hues = [K.magenta, K.gold, K.jade, K.cream, K.indigo, K.magenta, K.gold, K.green];
    pb.mat(SURF.cloth);
    hues.forEach((c, i) => {
      const z = -90 - i * 2.9, L = 5.2 + (i % 3) * 0.9;
      pb.anim(3, 0.5, i * 1.3, 0, [PX, FLOOR + 11.6, z]);
      pb.lathe([[0.2, 0], [0.75, -0.9], [0.95, -L * 0.55], [0.7, -L * 0.85], [0.25, -L], [0.01, -L - 0.2]], 7, (k) => mulc(c, 1.05 - 0.09 * k), PX, FLOOR + 11.5, z, 1, 0.55);
    });
    pb.still().mat(SURF.wood);
  }
  await y();
  // ---- 4 doves: a long bench under the cages, feed baskets, a rattan mat
  pb.box(-21, FLOOR + 2.2, -140, 3.4, 0.5, 26, mulc(K.timber, 1.1), 0.12);
  for (const z of [-129, -140, -151]) { pb.box(-21, FLOOR + 1, z, 2.8, 2, 0.7, K.timber, 0.12); pb.beam([-22.2, FLOOR + 0.5, z - 3], [-22.2, FLOOR + 1.9, z], 0.4, 0.5, K.timber); }
  blobs.push([-21, FLOOR + 0.1, -140, 5, 28, 0.75]);
  for (const [x, z, s] of [[-20.5, -132, 1], [-21, -146, 0.8], [18, -150, 1.1], [21, -147, 0.8]]) {
    pb.mat(SURF.weave).lathe([[1.1 * s, 0], [1.55 * s, 0.5 * s], [1.8 * s, 1.1 * s], [1.86 * s, 1.6 * s], [1.7 * s, 2.0 * s], [1.76 * s, 2.14 * s], [1.6 * s, 2.14 * s], [1.5 * s, 1.5 * s], [1.3 * s, 0.4 * s]], 14, (i) => mulc(K.rattan, 0.72 + 0.05 * i), x, x < 0 ? FLOOR + 2.45 : FLOOR + 0.05, z);
    if (x > 0) blobs.push([x, FLOOR + 0.1, z, 3 * s, 3 * s, 0.6]);
  }
  matOn(pb, 9, 25, -128, -146, 8, 9, K.rattan, mulc(K.rattan, 0.7), mulc(K.timber, 0.8));
  await y();
  // ---- 5 sleeping: cone mosquito nets over rolled mattresses, the sarong cradle on its coil spring
  for (const [x, z, ph] of [[-17, -171, 0.5], [-15.5, -191, 2.4]]) {
    pb.mat(SURF.net).anim(1, 1.3, ph, 0, [x, FLOOR + 26, z]);
    pb.lathe([[0.25, 26], [0.5, 25], [2.2, 17], [4.6, 8], [6.2, 1.5], [6.6, 0.2]], 14, (i) => mulc(K.cream, 1.0 - 0.07 * i), x, FLOOR, z, 1, 1, (i) => [0, 0.05, 0.3, 0.7, 1, 0.8][i]);
    pb.still().mat(SURF.rope).tube([[x, FLOOR + 26, z], [x, 51.5, z]], 0.1, K.rope, 4);
    pb.mat(SURF.cloth).at(x - 1.5, FLOOR + 1.15, z, ph, 1, 0, Math.PI / 2);
    pb.lathe([[0.01, -3.6], [1.05, -3.5], [1.1, -1.2], [1.1, 1.2], [1.05, 3.5], [0.01, 3.6]], 10, (i) => (i === 2) ? K.magenta : mulc(K.cream, 0.9), 0, 0, 0);
    pb.at(); cushion(pb, x + 2.2, z + 1.5, 1.3, ph < 1 ? K.jade : K.gold, ph);
    matOn(pb, x - 5, x + 5, z + 5, z - 5, 6, 6, K.pandan, mulc(K.pandan, 0.75), mulc(K.green, 0.7));
    blobs.push([x, FLOOR + 0.12, z, 9, 9, 0.5]);
  }
  await y();
  {
    const c = hero.anchors.cradle, X = c.x, Z = c.z, top = [X, 50.2, Z];
    pb.still().mat(SURF.wood).beam([X, 51.2, -160.5], [X, 51.2, -199.5], 0.9, 1.1, K.timber, 0.2);
    pb.anim(3, 0.2, 0.9, 0, top);
    const coil = []; for (let i = 0; i <= 72; i++) { const a = (i / 72) * TAU * 9; coil.push([X + Math.cos(a) * 0.75, 50.4 - (i / 72) * 9.5, Z + Math.sin(a) * 0.75]); }
    pb.mat(SURF.brass).tube(coil, 0.14, mulc(K.iron, 3.2), 5);
    pb.lathe([[0.01, 0], [0.5, 0.2], [0.5, 0.6], [0.01, 0.8]], 8, K.brass, X, 40.1, Z);
    pb.mat(SURF.rope);
    const gather = 31, bot = c.y - 1.6;
    for (const e of [-1, 1]) { pb.tube([[X, 40.2, Z], [X + e * 5.3, gather, Z]], 0.13, K.rope, 5); }
    pb.mat(SURF.cloth);
    pb.sheet((u, v) => {                                                      // the sarong sling, its length across our way
      const e = 2 * u - 1, th = (v - 0.5) * 3.7, w = 2.7 * Math.pow(Math.max(0, 1 - e * e), 0.5) + 0.12, lift = Math.pow(Math.abs(e), 2.4);
      const y = bot + (1 - Math.cos(th)) * w * 1.25;
      return [X + e * 5.3, lerp(y, gather, lift), Z + Math.sin(th) * w];
    }, 40, 20, (u, v, i, j) => {                                               // songket: gold lozenges on magenta, indigo and cream borders
      if (j === 0 || j === 19) return K.gold; if (j === 1 || j === 18) return K.indigo; if (j === 2 || j === 17) return (i & 1) ? K.cream : K.gold;
      if (i < 2 || i > 37) return (j & 1) ? K.gold : mulc(K.magenta, 0.7);
      const d = Math.abs(((i + j) % 6) - 3) + Math.abs(((i - j + 72) % 6) - 3);
      return d <= 1 ? K.gold : d === 6 ? K.cream : d === 3 ? mulc(K.magenta, 0.72) : K.magenta;
    });
    for (let i = 0; i < 24; i++) { const u = (i + 0.5) / 24, e = 2 * u - 1, w = 2.7 * Math.pow(Math.max(0, 1 - e * e), 0.5) + 0.12, th = 1.85, y0 = lerp(bot + (1 - Math.cos(th)) * w * 1.25, gather, Math.pow(Math.abs(e), 2.4));   // a gold fringe
      for (const sg of [-1, 1]) pb.quad([X + e * 5.3 - 0.1, y0, Z + sg * Math.sin(th) * w], [X + e * 5.3 + 0.1, y0, Z + sg * Math.sin(th) * w], [X + e * 5.3 + 0.1, y0 - 0.7, Z + sg * (Math.sin(th) * w + 0.12)], [X + e * 5.3 - 0.1, y0 - 0.7, Z + sg * (Math.sin(th) * w + 0.12)], K.gold); }
    pb.lathe(pill(1.25, 1.5, 5), 8, mulc(K.cream, 0.95), X + 0.4, bot + 0.3, Z, 2.2, 1);           // the sleeper, bundled
    pb.mat(SURF.leaf); for (let i = 0; i < 14; i++) { const t = i / 13; pb.lathe(ball(0.2, 3), 5, K.white, X + 0.3 + t * 4.8, lerp(39.6, gather + 0.4, t), Z + Math.sin(t * 9) * 0.25); }   // jasmine on the rope
    pb.still().mat(SURF.wood);
    blobs.push([X - 1.5, FLOOR + 0.1, Z - 1, 12, 7, 0.6]);
    tray(pb, X - 7, FLOOR + 0.1, Z + 5, 2.1, 0, rng); blobs.push([X - 7, FLOOR + 0.1, Z + 5, 3.4, 3.4, 0.6]);
    pb.mat(SURF.leaf); for (let i = 0; i < 26; i++) { const a = rng() * TAU, r = Math.sqrt(rng()) * 1.6; pb.lathe(ball(0.19, 3), 5, K.white, X - 7 + Math.cos(a) * r, FLOOR + 1.15 + rng() * 0.25, Z + 5 + Math.sin(a) * r); }
    pb.mat(SURF.wood);
  }
}

function sarong(pb, a, b, L, ca, cb, phase, outdoors = 0) {
  pb.mat(SURF.cloth).anim(1, 2.2, phase, outdoors, [(a[0] + b[0]) / 2, a[1], (a[2] + b[2]) / 2]);
  pb.sheet((u, v) => [lerp(a[0], b[0], u) + 0.3 * Math.sin(u * 11 + phase) * v, a[1] - v * L, lerp(a[2], b[2], u) + 0.35 * Math.sin(u * 9 + phase * 2) * (0.3 + v)], 7, 9,
    (u, v, i, j) => (j === 0 || j === 8) ? K.gold : (j === 4 ? cb : ((i + j) % 3 === 0 ? mixc(ca, cb, 0.5) : mulc(ca, 0.85 + 0.15 * (i & 1)))), (u, v) => v * v);
  pb.still().mat(SURF.wood);
}
function basket(pb, x, y, z, s, blobs) {
  pb.mat(SURF.weave).lathe([[1.1 * s, 0], [1.55 * s, 0.5 * s], [1.8 * s, 1.1 * s], [1.86 * s, 1.6 * s], [1.7 * s, 2.0 * s], [1.76 * s, 2.14 * s], [1.6 * s, 2.14 * s], [1.5 * s, 1.5 * s], [1.3 * s, 0.4 * s]], 14, (i) => mulc(K.rattan, 0.72 + 0.05 * i), x, y, z).mat(SURF.wood);
  if (blobs) blobs.push([x, y + 0.06, z, 3.2 * s, 3.2 * s, 0.6]);
}

async function buildBays6to8(pb, rng, blobs, hero, y) {
  pb.at().still().mat(SURF.wood);
  await y();
  // ---- 6 sewing: a table, bolts of batik (seen through the shutters from the verandah)
  pb.box(20, FLOOR + 3.2, -220, 8, 0.5, 14, mulc(K.timber, 1.15), 0.12);
  for (const sx of [-3.2, 3.2]) for (const sz of [-6, 6]) turned(pb, 20 + sx, FLOOR, -220 + sz, 3, 0.4, K.timber);
  blobs.push([20, FLOOR + 0.1, -220, 10, 16, 0.75]);
  pb.mat(SURF.cloth);
  [[K.magenta, K.gold], [K.indigo, K.cream], [K.jade, K.gold], [K.gold, K.magenta], [K.cream, K.indigo]].forEach(([c, d], i) => {
    pb.at(20 + (i % 2) * 1.2 - 0.6, FLOOR + 4.2 + (i > 2 ? 1.3 : 0), -225 + (i % 3) * 4.2, 0.2 * i, 1, 0, Math.PI / 2);
    pb.lathe([[0.01, -3], [0.75, -2.9], [0.8, -1], [0.8, 1], [0.75, 2.9], [0.01, 3]], 9, (k) => (k === 2 ? d : c));
  });
  pb.at(); pb.sheet((u, v) => [16.2 + 5 * u, FLOOR + 3.5 - (u < 0.01 ? 2.6 : 0) * 0 - 2.6 * Math.max(0, 0.25 - u) * 4, -214 - 4 * v], 6, 4, (u, v, i, j) => ((i + j) & 1) ? K.magenta : K.gold);
  pb.mat(SURF.wood); cushion(pb, 11, -224, 1.8, K.jade, 0.4); blobs.push([11, FLOOR + 0.1, -224, 3, 3, 0.6]);
  matOn(pb, -22, -4, -208, -232, 9, 12, K.pandan, mixc(K.pandan, K.magenta, 0.4), mulc(K.green, 0.7));
  await y();
  // ---- 7 store: baskets and coconuts
  for (let i = 0; i < 7; i++) basket(pb, -11 - (i % 3) * 5.5, FLOOR + 0.05, -247 - Math.floor(i / 3) * 6 - (i % 2), 1 + 0.25 * (i % 3), blobs);
  pb.mat(SURF.rope);
  for (let i = 0; i < 16; i++) { const a = rng() * TAU, r = Math.sqrt(rng()) * 4; pb.lathe(ball(0.7, 4), 7, mulc(K.coconut, 0.8 + rng() * 0.6), 9 + Math.cos(a) * r, FLOOR + 0.05 + (r < 1.6 ? 1.1 : 0), -268 + Math.sin(a) * r, 1, 1.25); }
  blobs.push([9, FLOOR + 0.1, -268, 9, 9, 0.6]);
  pb.mat(SURF.wood);
  basket(pb, -24, FLOOR + 0.05, -270, 1.5, blobs); basket(pb, -19, FLOOR + 0.05, -275, 1.1, blobs);
  await y();
  // ---- 8 passage: glazed water jars with brass dippers, a line of sarongs
  for (let i = 0; i < 4; i++) {
    const x = -23 + (i % 2) * 3.5, z = -290 - i * 6.2;
    jar(pb, x, FLOOR + 0.05, z, 4.6 - (i % 2) * 0.8, [K.jade, K.indigo, mulc(K.clay, 1.2), K.jade][i], K.cream, 14); blobs.push([x, FLOOR + 0.1, z, 4.4, 4.4, 0.75]);
    pb.mat(SURF.brass).tube([[x + 0.6, FLOOR + 4.3, z], [x + 2.4, FLOOR + 6.2, z + 0.4]], 0.1, K.brass, 5).lathe([[0.01, 0], [0.55, 0.15], [0.6, 0.6], [0.5, 0.6], [0.01, 0.3]], 8, K.brass, x + 0.5, FLOOR + 3.9, z).mat(SURF.wood);
  }
  matOn(pb, -16, 6, -296, -314, 11, 9, K.rattan, mulc(K.rattan, 0.72), mulc(K.magenta, 0.7));
  await y();
  // ---- the verandah: rattan blinds that roll up, racks of drying fish, fish traps, bougainvillea along the rail
  const V = hero.anchors.verandah;
  for (let i = 0; i < 8; i++) {
    const z0 = -163 - i * 19.4, z1 = z0 - 17.6, top = 38.3, x = 63.4;
    pb.mat(SURF.cloth).anim(5, 1, i * 0.8, 0, [x, top, (z0 + z1) / 2]);
    pb.sheet((u, v) => [x + 0.15 * Math.sin(v * 50), top - v * 16.5, lerp(z0, z1, u)], 4, 22, (u, v, i2, j) => (j % 6 === 5) ? mulc(K.magenta, 0.7) : mulc(K.rattan, 0.85 + 0.25 * (j & 1)), null, true);
    pb.mat(SURF.wood);
    pb.still();
    pb.beam([x, top + 0.2, z0 + 0.6], [x, top + 0.2, z1 - 0.6], 0.6, 0.6, K.timber, 0.15);
  }
  for (const zc of [-200.5]) {                                                 // a drying rack against the wall, between the shutters
    for (const dz of [-5, 5]) { pb.beam([35.2, V.y, zc + dz], [35.2, V.y + 12, zc + dz], 0.6, 0.6, K.timber); pb.beam([37.8, V.y, zc + dz], [35.2, V.y + 9, zc + dz], 0.45, 0.45, K.timber); }
    for (let r = 0; r < 3; r++) {
      const y = V.y + 5 + r * 3.2; pb.beam([35.3, y, zc - 5.6], [35.3, y, zc + 5.6], 0.3, 0.3, K.rattan, 0.08);
      for (let i = 0; i < 7; i++) {
        const z = zc - 4.6 + i * 1.5 + (r & 1) * 0.6;
        fish(pb, 35.5, y, z, 0.8, i + r * 2.3, (i + r) % 4 === 0 ? 1 : 0, 0.5 * Math.sin(i * 2.1 + r));
      }
      pb.still().mat(SURF.wood);
    }
    blobs.push([36.5, V.y + 0.1, zc, 5, 13, 0.6]);
  }
  for (const [z, s] of [[-207, 1], [-246, 1.2], [-262, 0.9], [-300, 1.1]]) {                // fish traps by the rail
    pb.at(59.5, V.y + 1.5 * s, z, 0.3, s, 0, Math.PI / 2).mat(SURF.net);
    pb.lathe([[0.3, -3.2], [1.3, -2.6], [1.5, 0], [1.3, 2.2], [0.5, 3.2]], 10, (k) => mulc(K.rattan, 0.75 + 0.1 * k));
    pb.mat(SURF.wood); for (const y of [-2.6, 0, 2.2]) pb.lathe([[1.42, y - 0.12], [1.56, y], [1.42, y + 0.12]], 10, mulc(K.rattan, 0.7));
    pb.at(); blobs.push([59.5, V.y + 0.1, z, 4 * s, 7.5 * s, 0.55]);
  }
  for (const z of [-172, -226, -281, -314]) { jar(pb, 61.2, V.y + 0.05, z, 3, z % 4 ? K.indigo : mulc(K.jade, 0.8), K.gold); bougain(pb, rng, 61.2, V.y + 2.7, z, 2.5, 0); blobs.push([61.2, V.y + 0.1, z, 3.2, 3.2, 0.7]); }
  await y();
  // mats on the verandah boards (y = 15), round trays of chillies, anchovies, prawns and turmeric laid out to dry
  const vmat = (x0, x1, z0, z1, nx, nz, ca, cb, edge) => {
    pb.mat(SURF.cloth).still();
    pb.sheet((u, v) => [lerp(x0, x1, u), V.y + 0.08 + 0.04 * Math.sin(u * 40) * Math.sin(v * 31), lerp(z0, z1, v)], nx, nz,
      (u, v, i, j) => (i === 0 || j === 0 || i === nx - 1 || j === nz - 1) ? edge : ((i + j) & 1) ? ca : mulc(cb, 0.85 + 0.3 * ((i * 7 + j * 3) % 5) / 5));
    pb.mat(SURF.wood);
  };
  vmat(40, 56, -232, -250, 8, 9, K.pandan, mulc(K.pandan, 0.75), mulc(K.magenta, 0.75));
  vmat(41, 55, -276, -292, 7, 8, K.rattan, mixc(K.pandan, K.jade, 0.45), mulc(K.gold, 0.8));
  const nyiru = (x, z, r, fill, alt) => {
    pb.mat(SURF.cloth).still().lathe([[r, 0], [r * 1.04, 0.3], [r * 0.98, 0.34], [r * 0.93, 0.12], [0.01, 0.1]], 16, (i) => mulc(K.rattan, 0.75 + 0.1 * i), x, V.y + 0.05, z);
    pb.mat(SURF.glaze);
    pb.sheet((u, v) => { const a = u * TAU, rr = (0.05 + 0.95 * v) * r * 0.9; return [x + Math.cos(a) * rr, V.y + 0.22 + 0.05 * Math.sin(u * 60 + v * 23), z + Math.sin(a) * rr]; }, 18, 4,
      (u, v, i, j) => ((i * 5 + j * 3) % 7 < 2) ? alt : mulc(fill, 0.8 + 0.3 * ((i * 3 + j) % 4) / 4));
    pb.mat(SURF.wood); blobs.push([x, V.y + 0.1, z, r * 2.3, r * 2.3, 0.55]);
  };
  const prawn = [0.85, 0.42, 0.36], silver = [0.5, 0.52, 0.56];
  for (const [x, z, r, a, b] of [[44.5, -205, 2.7, K.red, mixc(K.red, K.magenta, 0.4)], [50.5, -208.5, 2.2, K.fish, silver], [45.5, -212.5, 2.0, K.gold, K.banana],
    [52.5, -263, 2.6, prawn, K.cream], [55.2, -257.5, 2.1, K.red, mixc(K.red, K.gold, 0.3)], [51.5, -269.5, 2.2, K.fish, silver],
    [44, -300, 2.6, K.gold, K.banana], [50, -304, 2.3, K.red, mixc(K.red, K.magenta, 0.4)], [55.5, -299.5, 2.0, prawn, K.cream], [46.5, -309, 2.1, K.fish, silver]]) nyiru(x, z, r, a, b);
  await y();
  // drying racks standing by the rail, lines of split fish under the eave, more jars of bougainvillea, baskets and a coil of rope
  for (const zc of [-228.5, -271]) {
    const x = 59;
    pb.still().mat(SURF.wood);
    for (const dz of [-5.4, 5.4]) for (const sx of [-1.7, 1.7]) pb.beam([x + sx, V.y, zc + dz], [x, V.y + 11.4, zc + dz], 0.5, 0.5, K.timber);
    pb.beam([x, V.y + 11.2, zc - 5.8], [x, V.y + 11.2, zc + 5.8], 0.4, 0.4, K.timber, 0.1);
    for (let r = 0; r < 3; r++) {
      const yy = V.y + 4.6 + r * 3.1; pb.still().mat(SURF.wood).beam([x, yy, zc - 5.8], [x, yy, zc + 5.8], 0.3, 0.3, K.rattan, 0.08);
      for (let i = 0; i < 8; i++) {
        const z = zc - 4.8 + i * 1.37 + (r & 1) * 0.5;
        fish(pb, x, yy, z, 0.85, i * 1.3 + r * 2.3, (i + r) % 4 === 0 ? 1 : 0, 0.5 * Math.sin(i * 1.7 + r * 2));
      }
    }
    pb.still().mat(SURF.wood); blobs.push([x, V.y + 0.1, zc, 5.5, 13, 0.6]);
  }
  await y();
  for (const za of [-181.5, -241.5, -301.5]) {
    pb.still().mat(SURF.wood).beam([61.6, 33.6, za], [61.6, 33.6, za - 17], 0.4, 0.4, K.rattan, 0.1);
    for (const z of [za - 0.5, za - 16.5]) pb.mat(SURF.rope).tube([[61.6, 33.6, z], [61.6, 39.2, z]], 0.09, K.rope, 4);
    for (let i = 0; i < 10; i++) {
      const z = za - 1.2 - i * 1.62;
      fish(pb, 61.6, 33.5, z, 1.2, i * 1.7 + za, i % 4 === 1 ? 1 : 0, 0.6 * Math.sin(i * 2.3 + za));
    }
    pb.still().mat(SURF.wood);
  }
  for (const z of [-199, -253, -307]) { jar(pb, 61.2, V.y + 0.05, z, 3.2, z === -253 ? mulc(K.clay, 1.2) : K.jade, K.gold); bougain(pb, rng, 61.2, V.y + 2.9, z, 2.8, 0); blobs.push([61.2, V.y + 0.1, z, 3.4, 3.4, 0.7]); }
  basket(pb, 60, V.y + 0.05, -247, 1.3, blobs); basket(pb, 60.6, V.y + 0.05, -250.6, 1.0, blobs); basket(pb, 36.2, V.y + 0.05, -279, 1.25, blobs); basket(pb, 37, V.y + 0.05, -282.6, 0.95, blobs);
  pb.mat(SURF.rope); for (let i = 0; i < 4; i++) pb.lathe([[1.3, 0], [1.6, 0.2], [1.3, 0.4]], 10, mulc(K.rope, 0.8 + 0.1 * i), 59.8, V.y + 0.1 + i * 0.36, -290, 1 - i * 0.06, 1 - i * 0.06);
  pb.mat(SURF.wood); blobs.push([59.8, V.y + 0.1, -290, 3.6, 3.6, 0.6]);
  pb.at();
}

// sea morning glory: runners creeping over the sand from a centre, goat's-foot leaves in pairs along them (folded
// on the midrib, held just off the sand), purple trumpets turned to the light and shaking in the wind
async function gloryMat(pb, rng, sandH, cx, cz, rx, rz, runners, hole, y) {
  const leafCols = [[0.07, 0.2, 0.05], [0.1, 0.27, 0.07], [0.14, 0.32, 0.08], [0.2, 0.36, 0.1], [0.3, 0.38, 0.12]];
  const stem = [0.2, 0.12, 0.09];
  for (let r = 0; r < runners; r++) {
    if ((r & 3) === 3) await y();
    let a = rng() * TAU, rad = hole + (1 - hole) * 0.5 * rng(), x = cx + Math.cos(a) * rad * rx, z = cz + Math.sin(a) * rad * rz;
    a += rng.range(-0.7, 0.7);
    const n = 6 + Math.floor(rng() * 6), pts = [], ph = rng() * 6;
    for (let i = 0; i <= n; i++) {
      pts.push([x, sandH(x, z) + 0.1, z]);
      a += rng.range(-0.45, 0.45); const st = 1.5 + rng() * 0.9; x += Math.cos(a) * st; z += Math.sin(a) * st;
    }
    pb.at().still().mat(SURF.rope).tube(pts, 0.085, stem, 4);
    for (let i = 0; i <= n; i++) {
      const q = pts[i], dir = Math.atan2(pts[Math.min(n, i + 1)][2] - pts[Math.max(0, i - 1)][2], pts[Math.min(n, i + 1)][0] - pts[Math.max(0, i - 1)][0]);
      for (const sd of [-1, 1]) {
        if (rng() < 0.12) continue;
        const la = dir + sd * (1.1 + rng() * 0.7), s = 0.6 + rng() * 0.5, tilt = 0.15 + rng() * 0.4, fold = 0.2 + rng() * 0.2;
        const c0 = leafCols[Math.floor(rng() * leafCols.length)], c1 = mulc(c0, 1.35), c2 = mulc(c0, 0.75);
        const ca = Math.cos(la), sa = Math.sin(la), lift = 0.22 + rng() * 0.25;
        // leaf-local (u along the leaf, v across, w up) -> world
        const P = (u, v) => { const w = lift + u * Math.sin(tilt) * 0.6 + Math.abs(v) * fold; const uu = 0.25 + u * Math.cos(tilt); return [q[0] + (ca * uu - sa * v) * s, q[1] + w * s, q[2] + (sa * uu + ca * v) * s]; };
        pb.mat(SURF.leaf).anim(1, 0.16, ph + i, 1, [q[0], q[1], q[2]]);
        for (const m of [-1, 1]) {
          const p0 = P(0, 0), p1 = P(0.32, m * 0.52), p2 = P(0.84, m * 0.6), p3 = P(1.06, m * 0.27), p4 = P(0.88, 0);
          if (m > 0) { pb.quad(p0, p4, p2, p1, [c2, c0, c1, c0]); pb.quad(p4, p3, p2, p2, [c0, c1, c1, c1]); }
          else { pb.quad(p0, p1, p2, p4, [c2, c0, c1, c0]); pb.quad(p4, p2, p3, p3, [c0, c1, c1, c1]); }
        }
        pb.mat(SURF.rope).tube([[q[0], q[1], q[2]], P(0, 0)], 0.05, stem, 3);
      }
      if ((i + r) % 3 === 1) {                                                   // a trumpet on a short stalk
        const s = 0.85 + rng() * 0.5, tx = q[0] + rng.range(-0.5, 0.5), tz = q[2] + rng.range(-0.5, 0.5);
        const deep = mixc(K.purple, K.magenta, rng() * 0.35);
        pb.mat(SURF.leaf).anim(1, 0.3, ph + i * 2, 1, [tx, q[1], tz]);
        pb.at(tx, q[1] + 0.25, tz, rng() * TAU, s, rng.range(-0.75, -0.2), rng.range(-0.3, 0.3));
        pb.lathe([[0.05, 0], [0.08, 0.38], [0.2, 0.62], [0.48, 0.8], [0.74, 0.86], [0.8, 0.82]], 8,
          (k) => (k < 1 ? mulc(K.leaf, 0.6) : k < 2 ? mulc(K.cream, 0.9) : k < 3 ? mixc(K.cream, deep, 0.6) : k < 5 ? mixc(deep, [0.78, 0.42, 0.95], 0.25) : mulc(deep, 1.2)));
        pb.lathe([[0.01, 0.5], [0.07, 0.72], [0.01, 0.9]], 5, [0.95, 0.85, 0.5]);                   // the pale heart
        pb.at();
      }
    }
  }
  pb.at().still().mat(SURF.wood);
}

async function buildBays9to12(pb, rng, blobs, sandH, y, pbBeach) {
  pb.at().still().mat(SURF.wood);
  await y();
  // ---- 9 dining: a low round table, dishes under cone food covers in magenta, green and gold
  {
    const X = -13, Z = -347, Y = FLOOR + 1.9;
    stripeMat(pb, X - 11, X + 11, Z + 11, Z - 11, 16, [K.magenta, K.pandan, K.green, K.pandan, K.gold, K.pandan]);
    pb.lathe([[2.4, 0], [2.6, 0.3], [1.2, 0.8], [1.2, 1.3], [6.6, 1.6], [6.8, 1.9], [6.6, 1.9], [0.01, 1.9]], 20, (i) => mulc(K.timber, 0.95 + 0.07 * i), X, FLOOR + 0.05, Z);
    blobs.push([X, FLOOR + 0.12, Z, 11, 11, 0.8]);
    [[0, 0, K.magenta, 2.5], [3.9, 2.5, K.green, 2.0], [-3.7, 2.9, K.gold, 2.0], [-2.6, -3.9, K.magenta, 1.8], [3.7, -3.0, K.gold, 1.9]].forEach(([dx, dz, c, r]) => {
      pb.mat(SURF.glaze).lathe([[0.01, 0], [r * 0.9, 0.06], [r * 1.05, 0.3], [r, 0.3], [0.01, 0.16]], 12, K.cream, X + dx, Y, Z + dz);
      pb.mat(SURF.cloth).lathe([[r * 0.98, 0.25], [r * 0.7, 0.25 + r * 0.42], [r * 0.4, 0.25 + r * 0.72], [r * 0.1, 0.25 + r * 0.95], [0.01, 0.25 + r * 1.05]], 14, (k) => (k === 1 ? K.cream : k === 3 ? K.gold : c), X + dx, Y, Z + dz);
    });
    pb.mat(SURF.wood);
    [[7.6, 3, K.jade], [-7, 4.6, K.magenta], [-8, -3.4, K.indigo], [4.4, -7.4, K.gold], [-1, 8.2, K.cream]].forEach(([dx, dz, c], i) => cushion(pb, X + dx, Z + dz, 1.6, c, i));
    jar(pb, 16, FLOOR + 0.05, -352, 3.6, mulc(K.clay, 1.2), K.cream); blobs.push([16, FLOOR + 0.1, -352, 3.6, 3.6, 0.7]);
    tray(pb, 21, FLOOR + 0.1, -344, 2.3, 5, rng); blobs.push([21, FLOOR + 0.1, -344, 3.6, 3.6, 0.6]);
  }
  // woven palm-leaf diamonds (ketupat) on cords from the tie beam, green and gold, turning in the gust
  for (let i = 0; i < 14; i++) {
    const sd = i & 1 ? 1 : -1, x = sd * (6.5 + (i >> 1) * 1.9), z = -358.6, L = 8 + ((i * 5) % 7) * 1.1, piv = [x, 51.4, z], r = 0.8 + ((i * 3) % 4) * 0.12;
    pb.anim(3, 0.6, i * 1.3, 0, piv).mat(SURF.rope).tube([piv, [x, 51.4 - L, z]], 0.07, K.rope, 4);
    const cA = i % 3 === 0 ? K.gold : mulc(K.leaf, 0.9 + 0.3 * (i % 2)), cB = i % 3 === 0 ? mulc(K.magenta, 0.9) : K.pandan;
    pb.mat(SURF.cloth).lathe([[0.02, 0], [r, -r], [0.02, -2 * r]], 4, (k) => (k === 1 ? cB : cA), x, 51.4 - L, z);
    for (const t of [-1, 1]) pb.quad([x + t * 0.12, 51.4 - L - 2 * r, z], [x + t * 0.3, 51.4 - L - 2 * r, z], [x + t * 0.5, 51.4 - L - 2 * r - 2.2, z + 0.2], [x + t * 0.2, 51.4 - L - 2 * r - 2.2, z + 0.2], cA);
  }
  pb.still().mat(SURF.wood);
  await y();
  // ---- 10 net store: hung nets and floats, oars against the wall, stacked baskets; two nets slung across the hall overhead
  netSwag(pb, [-17, 41, -372], [18, 41, -372], 4.6, 3.6, 1.9, 0, 9); netSwag(pb, [-17, 41, -391], [18, 41, -391], 3.8, 4.6, 3.7, 0, 9);
  pb.beam([-17, 41, -362], [-17, 41, -398], 0.5, 0.5, K.rattan, 0.12); pb.beam([18, 41, -362], [18, 41, -398], 0.5, 0.5, K.rattan, 0.12);
  for (const z of [-362, -398]) for (const x of [-17, 18]) pb.mat(SURF.rope).tube([[x, 41, z], [x, 52, z]], 0.1, K.rope, 4).mat(SURF.wood);
  netSwag(pb, [-17, 41, -363], [-17, 41, -380], 13, 2, 0.7, 0, 6); netSwag(pb, [-17, 41, -381], [-17, 41, -397], 10, 3, 2.9, 0, 5);
  netSwag(pb, [18, 41, -365], [18, 41, -396], 12, 4, 4.4, 0, 8);
  for (let i = 0; i < 5; i++) pb.beam([27.5 - i * 0.5, FLOOR, -368 - i * 2.2], [30.2, FLOOR + 17 - i, -370 - i * 2.2], 0.45, 0.45, mulc(K.drift, 0.9 + 0.1 * i), 0.1);
  for (let i = 0; i < 5; i++) pb.box(29.8, FLOOR + 16.6 - i, -370 - i * 2.2, 0.25, 3.6, 1.3, mulc(K.drift, 1.0), 0.08);
  for (let i = 0; i < 8; i++) basket(pb, -24 + (i % 2) * 4, FLOOR + 0.05 + Math.floor(i / 4) * 2.3, -366 - (i % 4) * 4.5, 1.1 + 0.1 * (i % 3), i < 4 ? blobs : null);
  pb.mat(SURF.glaze); for (let i = 0; i < 12; i++) { const a = i * 2.4, r = 1 + (i % 4) * 0.9; pb.lathe(ball(0.75, 5), 8, mulc(K.glass, 0.7 + 0.5 * ((i * 3) % 4) / 4), 22 + Math.cos(a) * r, FLOOR + 0.05 + (i > 8 ? 1.2 : 0), -388 + Math.sin(a) * r); }
  pb.mat(SURF.wood); blobs.push([22, FLOOR + 0.1, -388, 8, 8, 0.6]);
  await y();
  // ---- 11 kitchen: a clay hearth with a kettle, firewood, hanging pots and ladles
  {
    const X = -17, Z = -424;
    pb.box(X, FLOOR + 1.1, Z, 11, 2.2, 7, mulc(K.clay, 0.85), 0.5); pb.box(X, FLOOR + 2.35, Z, 9.4, 0.4, 5.6, [0.12, 0.11, 0.1], 0.1);       // ash bed
    for (const [dx, dz] of [[-1.2, -0.9], [1.2, -0.9], [0, 1.1]]) pb.lathe(pill(0.75, 1.1, 4), 7, mulc(K.clay, 0.5), X + dx, FLOOR + 2.5, Z + dz);
    pb.mat(SURF.glaze).lathe([[0.9, 0], [1.4, 0.16], [1.82, 0.5], [2.08, 1.0], [2.14, 1.5], [2.0, 2.0], [1.66, 2.42], [1.2, 2.7], [0.86, 2.84], [0.8, 2.98], [0.96, 3.08], [0.9, 3.16], [0.5, 3.22], [0.22, 3.3], [0.26, 3.52], [0.01, 3.58]], 22, (i) => mulc(K.clay, i < 2 ? 0.35 : i > 9 ? 0.6 : 0.78), X, FLOOR + 3.35, Z);
    pb.tube([[X + 1.8, FLOOR + 4.6, Z], [X + 2.6, FLOOR + 5.0, Z], [X + 3.0, FLOOR + 5.7, Z], [X + 3.15, FLOOR + 6.5, Z]], 0.24, mulc(K.clay, 0.7), 8);
    pb.tube([[X - 1.3, FLOOR + 6.2, Z], [X - 0.9, FLOOR + 7.6, Z], [X + 0.9, FLOOR + 7.6, Z], [X + 1.3, FLOOR + 6.2, Z]], 0.12, K.brass, 5);
    pb.mat(SURF.wood);
    for (let i = 0; i < 9; i++) pb.at(X - 8.5, FLOOR + 0.5 + Math.floor(i / 3) * 0.95, Z - 1.4 + (i % 3) * 1.1, 0.1 * (i % 2), 1, 0, 0).beam([-0.4, 0, -2.6], [0.4, 0, 2.6], 0.9, 0.9, mulc(K.drift, 0.7 + 0.2 * (i % 3)), 0.3);
    pb.at(); blobs.push([X - 1, FLOOR + 0.1, Z, 15, 9, 0.85]);
    pb.beam([20, 35, -406], [20, 35, -436], 0.5, 0.5, K.timber, 0.12);
    for (const z of [-406, -436]) pb.mat(SURF.rope).tube([[20, 35, z], [20, 52, z]], 0.1, K.rope, 4).mat(SURF.wood);
    for (let i = 0; i < 9; i++) {
      const z = -408 - i * 3.3, L = 3 + (i % 3) * 1.6, piv = [20, 35, z];
      pb.anim(3, 0.55, i * 1.7, 0, piv).mat(SURF.rope).tube([piv, [20, 35 - L, z]], 0.07, K.rope, 4).mat(SURF.brass);
      if (i % 3 === 2) { pb.tube([[20, 35 - L, z], [20, 35 - L - 3.4, z]], 0.12, K.brass, 5).lathe([[0.01, 0], [0.7, 0.2], [0.8, 0.7], [0.7, 0.7], [0.01, 0.4]], 8, K.brass, 20, 35 - L - 4, z); }   // a ladle
      else pb.lathe([[0.01, 0], [1.1, 0.3], [1.5, 1.2], [1.35, 2.1], [1.5, 2.2], [1.3, 2.2], [1.2, 1.2], [0.01, 0.5]], 10, (k) => mulc(i % 2 ? K.brass : [0.14, 0.12, 0.11], 0.8 + 0.1 * k), 20, 35 - L - 2.2, z);
    }
    pb.still().mat(SURF.wood);
    basket(pb, 22, FLOOR + 0.05, -416, 1.2, blobs); jar(pb, 24.5, FLOOR + 0.05, -428, 3.4, mulc(K.clay, 1.1), K.cream); blobs.push([24.5, FLOOR + 0.1, -428, 3.4, 3.4, 0.7]);
    // strings of chillies and garlic on a pole between the lane and the pots
    pb.beam([10.5, 41, -405], [10.5, 41, -437], 0.45, 0.45, K.rattan, 0.12);
    for (const z of [-405, -437]) pb.mat(SURF.rope).tube([[10.5, 41, z], [10.5, 52, z]], 0.1, K.rope, 4).mat(SURF.wood);
    for (let i = 0; i < 9; i++) {
      const z = -407.5 - i * 3.4, L = 5.5 + (i % 3) * 1.5, piv = [10.5, 41, z], red = i % 3 !== 1;
      pb.anim(3, 0.5, i * 2.1, 0, piv).mat(SURF.rope).tube([piv, [10.5, 41 - L, z]], 0.06, K.rope, 4);
      pb.mat(SURF.glaze);
      for (let j = 0; j < 7; j++) { const yy = 41 - 1.2 - j * (L - 1.2) / 7, an = j * 2.4 + i; pb.lathe(red ? [[0.02, 0], [0.26, -0.25], [0.2, -0.8], [0.03, -1.25]] : ball(0.34, 3, -0.7), 5, red ? mixc(K.red, K.magenta, 0.3 * (j % 2)) : mulc(K.cream, 0.95), 10.5 + Math.cos(an) * 0.3, yy, z + Math.sin(an) * 0.3); }
    }
    pb.still().mat(SURF.wood);
  }
  await y();
  // ---- 12 wet kitchen: water jars, a basin, a hand of bananas on a cord
  for (let i = 0; i < 3; i++) { const x = 19 + (i % 2) * 4.5, z = -450 - i * 7; jar(pb, x, FLOOR + 0.05, z, 5 - i * 0.6, [K.jade, mulc(K.clay, 1.2), K.indigo][i], K.cream, 14); blobs.push([x, FLOOR + 0.1, z, 4.6, 4.6, 0.75]); }
  pb.mat(SURF.brass).lathe([[1.6, 0], [3.2, 0.4], [3.6, 1.4], [3.4, 1.4], [3.0, 0.6], [0.01, 0.5]], 16, (i) => mulc(K.brass, 0.8 + 0.07 * i), -19, FLOOR + 0.05, -462).mat(SURF.wood); blobs.push([-19, FLOOR + 0.1, -462, 6, 6, 0.6]);
  {
    const piv = [-15, 52, -448], y0 = 33;
    pb.anim(3, 0.3, 2.2, 0, piv).mat(SURF.rope).tube([piv, [-15, y0, -448]], 0.1, K.rope, 4).mat(SURF.leaf);
    pb.tube([[-15, y0, -448], [-15, y0 - 4.2, -448]], 0.3, mulc(K.leaf, 0.7), 6);
    for (let t = 0; t < 3; t++) for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + t * 0.35, y = y0 - 0.8 - t * 1.25, c = Math.cos(a), s = Math.sin(a);
      pb.tube([[-15 + c * 0.35, y, -448 + s * 0.35], [-15 + c * 1.0, y - 0.35, -448 + s * 1.0], [-15 + c * 1.3, y - 1.1, -448 + s * 1.3], [-15 + c * 1.15, y - 1.9, -448 + s * 1.15]], 0.24, mulc(K.banana, 0.85 + 0.2 * ((i + t) % 3) / 2), 5);
    }
    pb.still().mat(SURF.wood);
  }
  // a line of sarongs across the hall, high over the lane: the last thing to lift before the wall goes
  pb.mat(SURF.rope).tube([[-30.5, 46.5, -455], [-15, 45.4, -455], [0, 45, -455], [15, 45.4, -455], [30.5, 46.5, -455]], 0.12, K.rope, 5).mat(SURF.wood);
  [[K.magenta, K.gold], [K.jade, K.cream], [K.gold, K.magenta], [K.indigo, K.gold], [K.cream, K.magenta], [K.magenta, K.jade], [K.gold, K.indigo], [K.jade, K.gold]].forEach(([c, d], i) => {
    const x0 = -27 + i * 6.9, yy = 45 + 1.3 * Math.pow(Math.abs(x0 + 2.6) / 28, 2);
    sarong(pb, [x0, yy, -455], [x0 + 5.2, yy, -455], 8.2 + (i % 3) * 0.9, c, d, i * 1.7);
  });
  await y();
  // ---- the beach (its own mesh): sea morning glory creeping over the dune the portal stands on and the bank where the ramp lands
  pb = pbBeach; pb.at().still().mat(SURF.wood);
  await gloryMat(pb, rng, sandH, 0, -556, 40, 27, 50, 0.16, y); await y();
  await gloryMat(pb, rng, sandH, -31, -513, 13, 17, 13, 0, y); await gloryMat(pb, rng, sandH, 31, -513, 13, 17, 13, 0, y); await y();
  pb.still().mat(SURF.wood).at();
  {                                                                            // a sampan hauled up and turned over, a float line beside it
    const bx = 39, bz = -533, by = sandH(bx, bz) + 3.1;
    pb.at(bx, by, bz, 0.5, 1, 0, Math.PI);
    pb.sheet((u, v) => { const e = 2 * u - 1, b = 3.2 * Math.pow(Math.max(0, 1 - e * e), 0.55) + 0.05, th = Math.PI * v; return [-b * Math.cos(th), lerp(3 + 1.2 * e * e, 0, Math.pow(Math.sin(th), 0.75)), 9 - u * 18]; }, 14, 10,
      (u, v) => { const d = Math.min(v, 1 - v); return mulc(d < 0.1 ? K.turq : d < 0.16 ? K.white : d < 0.24 ? K.red : mulc(K.timber, 1.2), 0.8 + 0.2 * Math.sin(u * 30)); });
    pb.at(); blobs.push([bx + 1, sandH(bx, bz) + 0.15, bz, 9, 18, 0.7]);
    pb.mat(SURF.rope).tube([[bx - 6, sandH(bx - 6, bz + 6) + 0.2, bz + 6], [bx - 9, sandH(bx - 9, bz) + 0.2, bz], [bx - 7, sandH(bx - 7, bz - 8) + 0.2, bz - 8], [bx - 11, sandH(bx - 11, bz - 14) + 0.2, bz - 14]], 0.14, K.rope, 5);
    pb.mat(SURF.glaze); for (let i = 0; i < 6; i++) { const t = i / 5, fx2 = bx - 6 - 5 * t + Math.sin(t * 7) * 1.5, fz = bz + 6 - 20 * t; pb.lathe(ball(0.6, 4), 7, mulc(K.glass, 0.8 + 0.3 * (i & 1)), fx2, sandH(fx2, fz) - 0.1, fz); }
    pb.mat(SURF.wood);
  }
  const lx = -23, lz = -527; pb.at(lx, sandH(lx, lz) + 0.7, lz, 0.6).beam([-8, 0, 0], [8, 0.5, 0], 1.5, 1.4, mulc(K.drift, 1.3), 0.5).beam([2, 0.4, 0], [5, 2.8, 1.5], 0.6, 0.6, mulc(K.drift, 1.2), 0.2).at();
  pb.mat(SURF.rope);
  for (let i = 0; i < 12; i++) { const x = (i < 6 ? -36 : 42) + rng.range(-7, 7), z = (i < 6 ? -548 : -592) + rng.range(-7, 7); pb.lathe(ball(0.8, 4), 7, mulc(i % 3 ? K.coconut : K.leaf, 0.9 + rng() * 0.4), x, sandH(x, z) - 0.2, z, 1, 1.25); }
  pb.mat(SURF.wood).at();
}

// =====================================================================================================
// 5b. One large coloured subject for each room (round three), so that no two rooms are the same picture:
//     2 play: three great painted drums and a striped mat | 3 loom: lengths of songket over rails by the screen |
//     verandah: bunches of green glass floats under the eave, rows of silver fish | 8 passage: a line of batik
//     sarongs in indigo, turquoise and red | 9 dining: a dyed-stripe mat, blue-and-white bowls | 10 net store: a heap
//     of floats and coiled rope by the seaward door | 11 kitchen: brass pots, trays of limes and chillies
// =====================================================================================================
K.cobalt = C('#2450A8'); K.lime = C('#86B82E'); K.chilli = C('#CC2A1C'); K.china = C('#E9EEF2'); K.glassB = [0.09, 0.5, 0.3];
SURF.weave = 8; SURF.songket = 9; SURF.batik = 9.5;
// a rebana ubi: a great painted drum on its side in a cradle, the skin toward local +z and tilted back a little
function rebana(pb, x, y, z, R, ry, cols, blobs) {
  const D = R * 1.2, rr = (t) => R * (0.78 + 0.3 * Math.sin(Math.PI * (0.1 + 0.8 * t))), Rs = rr(1);
  pb.at(x, y + R * 1.08 + 0.9, z, ry, 1, Math.PI / 2 - 0.24).still().mat(SURF.wood);
  pb.sheet((u, v) => { const a = u * TAU, r = rr(v); return [Math.cos(a) * r, (v - 0.5) * D, Math.sin(a) * r]; }, 24, 6,
    (u, v, i, j) => (j === 0 || j === 5) ? cols[2] : ((i + (j > 2 ? 1 : 0)) & 1) ? cols[0] : cols[1]);
  pb.mat(SURF.rope).lathe([[Rs + 0.04, D / 2 - 0.34], [Rs + 0.3, D / 2 - 0.17], [Rs + 0.04, D / 2]], 24, K.rattan);
  pb.lathe([[rr(0) + 0.04, -D / 2], [rr(0) + 0.26, -D / 2 + 0.17], [rr(0) + 0.04, -D / 2 + 0.34]], 24, mulc(K.rattan, 0.8));
  pb.mat(SURF.cloth).sheet((u, v) => { const a = u * TAU, r = (0.02 + 0.98 * v) * Rs; return [Math.cos(a) * r, D / 2 + 0.03 - 0.12 * (1 - v) * (1 - v), Math.sin(a) * r]; }, 24, 6,
    (u, v, i, j) => j === 5 ? cols[2] : j === 4 ? ((i & 1) ? cols[0] : K.cream) : j === 3 ? cols[1] : j === 2 ? (((i >> 1) & 1) ? cols[3] : cols[0]) : j === 1 ? K.cream : cols[1]);
  pb.mat(SURF.wood).sheet((u, v) => { const a = u * TAU, r = (0.02 + 0.98 * v) * rr(0); return [Math.cos(a) * r, -D / 2, Math.sin(a) * r]; }, 12, 1, () => mulc(K.timber, 0.6));
  pb.at(x, y, z, ry);
  for (const dz of [-D * 0.3, D * 0.3]) { pb.beam([-R * 0.95, 0.5, dz], [R * 0.95, 0.5, dz], 0.9, 1.0, mulc(K.timber, 1.1), 0.2); for (const s of [-1, 1]) pb.beam([s * R * 0.8, 0.9, dz], [s * R * 0.5, 2.1, dz], 0.8, 0.8, K.timber, 0.2); }
  pb.at(); blobs.push([x, y + 0.08, z, R * 2.3, R * 2.3, 0.75]);
}
// a mat of dyed stripes running across our way
function stripeMat(pb, x0, x1, z0, z1, nz, cols, y = FLOOR + 0.07) {
  pb.mat(SURF.cloth).still();
  pb.sheet((u, v) => [lerp(x0, x1, u), y + 0.04 * Math.sin(u * 40) * Math.sin(v * 31), lerp(z0, z1, v)], 8, nz,
    (u, v, i, j) => (j === 0 || j === nz - 1) ? K.gold : mulc(cols[j % cols.length], 0.86 + 0.24 * ((i * 5 + j * 3) % 4) / 4));
  pb.mat(SURF.wood);
}
// a blue-and-white bowl
function bowl(pb, x, y, z, r) {
  pb.mat(SURF.glaze).lathe([[r * 0.35, 0], [r * 0.4, r * 0.12], [r * 0.8, r * 0.4], [r, r * 0.75], [r * 0.94, r * 0.75], [r * 0.72, r * 0.42], [0.01, r * 0.3]], 12,
    (i) => [K.cobalt, K.china, K.cobalt, K.china, K.cobalt, K.china, K.china][i], x, y, z);
  pb.mat(SURF.wood);
}
// a length of songket hung over a rail: gold lozenges on a ground colour, bands at head and foot
function drape(pb, x0, x1, yTop, z, L, ground, accent, phase) {
  pb.mat(SURF.songket).anim(1, 0.8, phase, 0, [(x0 + x1) / 2, yTop, z]);
  pb.sheet((u, v) => [lerp(x0, x1, u), yTop - v * L, z + 0.3 + 0.28 * Math.sin(u * 7 + phase) * (0.25 + v)], 9, 12, (u, v, i, j) => {
    if (j === 0 || j === 11 || i === 0 || i === 8) return K.gold; if (j === 1 || j === 10) return accent;
    return (j === 2 || j === 9) ? mulc(ground, 0.6) : ground;
  }, (u, v) => v * v);
  pb.still().mat(SURF.wood);
}
// a batik sarong on a line from a to b: borders, a head panel of bamboo-shoot triangles, a body of flowers
function batik(pb, a, b, L, ground, motif, accent, phase) {
  pb.mat(SURF.batik).anim(1, 2.4, phase, 0, [(a[0] + b[0]) / 2, a[1], (a[2] + b[2]) / 2]);
  pb.sheet((u, v) => [lerp(a[0], b[0], u) + 0.3 * Math.sin(u * 9 + phase) * v, a[1] - v * L, lerp(a[2], b[2], u) + 0.45 * Math.sin(u * 8 + phase * 2) * (0.2 + v)], 12, 18, (u, v, i, j) => {
    if (j === 0 || j === 17) return accent; if (j === 1 || j === 16) return motif;
    if (i === 5 || i === 6) return ((j + i) & 1) ? motif : accent;
    if (i === 4 || i === 7) return motif;
    return (j === 2 || j === 15) ? mulc(ground, 0.62) : ground;
  }, (u, v) => v * v);
  pb.still().mat(SURF.wood);
}
// a silver fish hung by the head to dry: dark barred back, pale belly, forked tail, an eye
function fish(pb, x, y, z, s, ph, warm = 0, ry = 0) {
  const R = [0.05, 0.4, 0.62, 0.6, 0.46, 0.24, 0.12], L = 3.1 * s, back = mixc([0.1, 0.14, 0.2], K.clay, 0.5 * warm), mid = mixc([0.62, 0.64, 0.66], K.clay, 0.35 * warm), belly = [0.8, 0.78, 0.7];
  pb.at(x, y, z, ry).mat(SURF.feather).anim(3, 0.7, ph, 0, [0, 0, 0]); x = 0; y = 0; z = 0;
  pb.sheet((u, v) => { const a = v * TAU, r = R[Math.round(u * 6)] * s; return [x + Math.cos(a) * r * 0.3, y - 0.25 - u * L, z + Math.sin(a) * r]; }, 6, 6,
    (u, v, i, j) => (j === 1) ? mulc(back, (i & 1) ? 0.6 : 1.15) : (j === 0 || j === 2) ? mulc(mid, (i & 1) ? 0.8 : 1.1) : (j === 4) ? belly : mid);
  const yb = y - 0.25 - L;
  pb.quad([x, yb + 0.3 * s, z], [x, yb - 0.95 * s, z + 0.8 * s], [x, yb - 0.5 * s, z], [x, yb - 0.95 * s, z - 0.8 * s], mulc(back, 1.2));
  pb.mat(SURF.glaze); for (const sd of [-1, 1]) pb.lathe(ball(0.1 * s, 2), 4, [0.02, 0.02, 0.02], x + sd * 0.1 * s, y - 0.25 - L * 0.13 - 0.1 * s, z + 0.14 * s);
  pb.at().still().mat(SURF.wood);
}
// green glass floats in a net bag on a rope (under the verandah eave): they swing and take the light
function floatBunch(pb, rng, x, yHook, z, ph, outdoors = 1) {
  const top = yHook - 3.2, piv = [x, yHook, z];
  pb.anim(3, 0.45, ph, outdoors, piv).mat(SURF.rope).tube([piv, [x, top, z]], 0.12, K.rope, 4);
  pb.mat(SURF.glaze);
  for (let i = 0; i < 9; i++) {
    const t = i / 8, a = i * 2.4 + ph, r = (i === 8 ? 0 : 1.15) * Math.sin(Math.PI * (0.25 + 0.6 * t));
    pb.lathe(ball(0.98, 5), 9, mulc(i % 3 === 0 ? K.turq : K.glassB, 0.8 + 0.5 * rng()), x + Math.cos(a) * r, top - 1.9 - t * 4.2 - 0.98, z + Math.sin(a) * r);
  }
  pb.mat(SURF.net).lathe([[0.12, 0], [1.5, -1.3], [2.5, -3.4], [2.35, -5.4], [1.2, -6.9], [0.05, -7.4]], 12, (i) => mulc(K.rope, 1.0 - 0.06 * i), x, top, z);
  pb.still().mat(SURF.wood);
}
function brassPot(pb, x, y, z, r, col = K.brass) {
  pb.mat(SURF.brass).lathe([[r * 0.5, 0], [r * 0.85, r * 0.16], [r, r * 0.55], [r * 0.96, r * 0.95], [r * 0.74, r * 1.25], [r * 0.66, r * 1.42], [r * 0.8, r * 1.52], [r * 0.7, r * 1.52], [r * 0.58, r * 1.36], [0.01, r * 1.3]], 18, (i) => mulc(col, 0.82 + 0.05 * i), x, y, z);
  pb.mat(SURF.wood);
}
async function buildSubjects(pb, rng, blobs, hero, y) {
  pb.at().still().mat(SURF.wood);
  await y();
  // ---- 2 play: three rebana ubi on the sea side, turned to the door and the sun; a striped mat with bowls down the middle
  rebana(pb, 19, FLOOR, -51, 3.0, -0.8, [K.jade, K.gold, K.magenta, K.cobalt], blobs);
  rebana(pb, 21.5, FLOOR, -60, 3.5, -0.9, [K.magenta, K.gold, K.cobalt, K.jade], blobs);
  rebana(pb, 20, FLOOR, -69.5, 3.0, -1.0, [K.cobalt, K.cream, K.gold, K.magenta], blobs);
  await y();
  stripeMat(pb, -4.5, 8.5, -45, -75, 20, [K.indigo, K.cream, K.turq, K.cream, K.indigo, K.gold, K.magenta, K.gold]);
  for (const [x, z, r] of [[1.5, -49.5, 1.2], [4.2, -51.6, 0.9], [-0.8, -52.4, 0.8], [5.5, -71, 1.1], [2.8, -72.6, 0.8]]) { bowl(pb, x, FLOOR + 0.12, z, r); blobs.push([x, FLOOR + 0.14, z, r * 2.6, r * 2.6, 0.55]); }
  await y();
  // ---- 3 loom: finished lengths of songket over rails either side of the screen's doorway
  for (const s of [-1, 1]) {
    pb.still().mat(SURF.wood).beam([s * 12.9, 26.6, -118.5], [s * 29.6, 26.6, -118.5], 0.55, 0.55, K.rattan, 0.14);
    for (const x of [13.0, 29.5]) { turned(pb, s * x, FLOOR, -118.5, 10.9, 0.5, K.timber); blobs.push([s * x, FLOOR + 0.1, -118.2, 2.2, 2.2, 0.6]); }
    const sets = s > 0 ? [[K.magenta, K.cream], [K.indigo, K.turq], [K.turq, K.magenta], [K.red, K.cream]] : [[K.red, K.cream], [K.jade, K.magenta], [K.magenta, K.indigo], [K.indigo, K.cream]];
    sets.forEach(([g, a], i) => { const x0 = s * (13.5 + i * 4.0), x1 = s * (13.5 + i * 4.0 + 3.6); drape(pb, Math.min(x0, x1), Math.max(x0, x1), 26.9, -118.5, 8.2 + (i % 2) * 0.7, g, a, i * 1.7 + s); });
    blobs.push([s * 21.3, FLOOR + 0.1, -118, 18, 3, 0.5]);
  }
  await y();
  // ---- the verandah: bunches of green glass floats under the eave, on the sea side of our way
  for (const [x, z] of [[55.5, -226], [57, -243], [55, -277], [56.5, -292], [55, -308]]) floatBunch(pb, rng, x, 40.3 - 0.27 * (x - 55), z, z * 0.37, 1);
  await y();
  // ---- 8 passage: a line of batik sarongs right across the hall, high over our way, lifting as the breeze arrives
  {
    stripeMat(pb, -7, 17, -274, -293, 12, [K.chilli, K.cream, K.cobalt, K.cream, K.turq, K.cream]);
    for (const [x, z, r] of [[-2.5, -279, 1.2], [0.5, -282.5, 0.9], [12.5, -289, 1.0]]) { bowl(pb, x, FLOOR + 0.12, z, r); blobs.push([x, FLOOR + 0.14, z, r * 2.6, r * 2.6, 0.55]); }
    const A = [-29, 44.5, -298], B = [14, 44.5, -310], P = (t) => [lerp(A[0], B[0], t), A[1] - 0.9 * Math.sin(Math.PI * t), lerp(A[2], B[2], t)];
    const line = []; for (let i = 0; i <= 12; i++) line.push(P(i / 12));
    pb.still().mat(SURF.wood).tube(line, 0.2, K.rattan, 5);
    pb.mat(SURF.rope); for (const t of [0, 0.5, 1]) { const q = P(t); pb.tube([q, [q[0], 50.4 + 24 * (1 - Math.abs(q[0]) / 32), q[2]]], 0.1, K.rope, 4); }
    [[K.cobalt, K.cream, K.chilli], [K.turq, K.gold, K.cream], [K.chilli, K.cream, K.cobalt], [K.cobalt, K.turq, K.gold], [K.turq, K.cream, K.magenta], [K.chilli, K.gold, K.cream]].forEach(([g, m, a], k) => {
      const t0 = 0.03 + k * 0.16; batik(pb, P(t0), P(t0 + 0.14), 12.4 + (k % 2) * 1.4, g, m, a, k * 1.9);
    });
  }
  await y();
  // ---- 9 dining: blue-and-white bowls on the table and a second mat of them by the seaward vanes
  { const X = -13, Z = -347, Y = FLOOR + 1.95; for (const [dx, dz, r] of [[5.4, 0.4, 0.8], [-5.2, -0.6, 0.8], [0.6, 5.5, 0.7], [-0.6, -5.5, 0.75], [4.1, 4.3, 0.6]]) bowl(pb, X + dx, Y, Z + dz, r); }
  stripeMat(pb, 9, 25, -335, -357, 14, [K.turq, K.cream, K.cobalt, K.cream, K.jade, K.gold]);
  for (const [x, z, r, n] of [[12, -340.5, 1.3, 3], [15.5, -345.5, 1.0, 2], [11.5, -347.5, 1.1, 1], [19, -339, 0.9, 2], [13, -353, 0.9, 1]]) {
    for (let i = 0; i < n; i++) bowl(pb, x, FLOOR + 0.12 + i * r * 0.5, z, r * (1 - 0.06 * i));
    blobs.push([x, FLOOR + 0.14, z, r * 2.6, r * 2.6, 0.55]);
  }
  await y();
  // ---- 10 net store: a heap of glass floats and coiled rope by the seaward opening
  pb.mat(SURF.glaze);
  for (let i = 0; i < 18; i++) { const a = i * 2.4, r = 0.8 + (i % 5) * 0.95, up = i > 12 ? 1.5 : 0; pb.lathe(ball(1.0, 5), 9, mulc(i % 4 === 0 ? K.turq : K.glassB, 0.75 + 0.55 * rng()), 24.5 + Math.cos(a) * r, FLOOR + 0.05 + up, -379 + Math.sin(a) * r * 1.3); }
  pb.mat(SURF.rope);
  for (const [x, z, n] of [[17.5, -371, 6], [20.5, -366.5, 4]]) { for (let i = 0; i < n; i++) pb.lathe([[1.5, 0], [1.95, 0.24], [1.5, 0.48]], 12, mulc(K.rope, 0.8 + 0.08 * i), x, FLOOR + 0.1 + i * 0.44, z, 1 - i * 0.04, 1 - i * 0.04); blobs.push([x, FLOOR + 0.12, z, 4.4, 4.4, 0.6]); }
  pb.mat(SURF.wood); blobs.push([24.5, FLOOR + 0.1, -379, 11, 12, 0.6]);
  await y();
  // ---- 11 kitchen: brass pots on the hearth and the floor, a bench of trays: green limes, red chillies, turmeric
  brassPot(pb, -20.4, FLOOR + 2.55, -423.6, 1.25); brassPot(pb, -13.4, FLOOR + 2.55, -424.6, 1.05, mulc(K.brass, 0.8));
  brassPot(pb, 8.6, FLOOR + 0.05, -413.5, 1.7); blobs.push([8.6, FLOOR + 0.1, -413.5, 3.8, 3.8, 0.7]);
  brassPot(pb, 9.4, FLOOR + 0.05, -430, 1.35, mulc(K.brass, 0.85)); blobs.push([9.4, FLOOR + 0.1, -430, 3.1, 3.1, 0.7]);
  {
    const X = 15.6, Z = -421, Y = FLOOR + 1.95;
    pb.box(X, FLOOR + 1.7, Z, 6.6, 0.5, 21, mulc(K.timber, 1.2), 0.14);
    for (const dz of [-9.4, 0, 9.4]) for (const dx of [-2.6, 2.6]) pb.box(X + dx, FLOOR + 0.75, Z + dz, 0.7, 1.5, 0.7, K.timber, 0.14);
    blobs.push([X, FLOOR + 0.1, Z, 8.5, 23, 0.8]);
    [[-7, 0], [0, 1], [7, 2]].forEach(([dz, kind]) => {
      const cz = Z + dz, r = 2.7;
      pb.at().mat(SURF.weave).lathe([[r, 0], [r * 1.05, 0.34], [r * 0.99, 0.38], [r * 0.94, 0.14], [0.01, 0.1]], 18, (i) => mulc(K.rattan, 0.75 + 0.1 * i), X, Y, cz);
      for (let i = 0; i < 46; i++) {
        const a = i * 2.39996, rr = Math.sqrt((i + 0.5) / 46) * r * 0.86, px = X + Math.cos(a) * rr, pz = cz + Math.sin(a) * rr, lime = kind === 0 || (kind === 2 && i % 3 === 0);
        if (lime || kind === 2) pb.at().mat(SURF.glaze).lathe(ball(0.36, 3), 6, lime ? mulc(K.lime, 0.75 + 0.5 * rng()) : mulc(K.gold, 0.8 + 0.4 * rng()), px, Y + 0.12, pz);
        else pb.at(px, Y + 0.34, pz, rng() * TAU, 1, 0, Math.PI / 2).mat(SURF.glaze).lathe([[0.02, -0.75], [0.2, -0.5], [0.17, 0.3], [0.04, 0.75]], 5, i % 9 === 0 ? mulc(K.lime, 0.7) : mulc(K.chilli, 0.75 + 0.45 * rng()));
      }
      pb.at();
    });
    pb.still().mat(SURF.wood);
  }
  await y();
}
// =====================================================================================================
// 6. Creatures (their own small geometries, drawn instanced with the props shader and moved on the CPU)
// =====================================================================================================
function birdBody(pb, len, col, belly, wingCol, flapRef, comb = null) {
  // local frame: +z forward, y up, feet at y = 0
  const r = len * 0.3, cy = len * 0.5;
  pb.mat(SURF.feather).still();
  pb.at(0, cy, 0, 0, 1, Math.PI / 2 - 0.25).lathe([[0.01, -len * 0.5], [r * 0.6, -len * 0.38], [r, -len * 0.1], [r * 0.95, len * 0.15], [r * 0.6, len * 0.36], [0.01, len * 0.45]], 9, (i) => mixc(col, belly, i < 2 ? 0.2 : 0.5 * (i % 2)), 0, 0, 0, 1, 0.9);
  pb.at(0, cy + len * 0.34, len * 0.4).lathe(ball(r * 0.52, 5), 8, (i) => (comb && i > 3) ? comb : mulc(col, 1.1), 0, -r * 0.5, 0);
  pb.at().mat(SURF.brass).quad([-r * 0.14, cy + len * 0.36, len * 0.58], [r * 0.14, cy + len * 0.36, len * 0.58], [0, cy + len * 0.3, len * 0.78], [0, cy + len * 0.26, len * 0.6], K.gold);
  pb.mat(SURF.feather);
  pb.quad([-r * 0.5, cy + r * 0.3, -len * 0.3], [r * 0.5, cy + r * 0.3, -len * 0.3], [r * 0.8, cy + r * (comb ? 1.9 : 0.5), -len * (comb ? 0.62 : 0.85)], [-r * 0.8, cy + r * (comb ? 1.9 : 0.5), -len * (comb ? 0.62 : 0.85)], mulc(wingCol, 0.8));   // tail
  if (comb) for (const [a, w] of [[1.05, 0.34], [0.7, 0.28], [0.35, 0.22]]) pb.quad([-r * w, cy + r * 0.4, -len * 0.3], [r * w, cy + r * 0.4, -len * 0.3], [r * w * 0.5, cy + r * 0.4 + Math.sin(a) * len * 0.62, -len * 0.3 - Math.cos(a) * len * 0.62], [-r * w * 0.5, cy + r * 0.4 + Math.sin(a) * len * 0.62, -len * 0.3 - Math.cos(a) * len * 0.62], [mulc(wingCol, 0.9), mulc(wingCol, 0.9), [0.05, 0.16, 0.12], [0.05, 0.16, 0.12]]);
  for (const s of [-1, 1]) {
    pb.anim(4, s * 1.25, s > 0 ? 0 : 0.0, flapRef, [s * r * 0.8, cy + r * 0.45, 0]);
    pb.quad([s * r * 0.8, cy + r * 0.5, len * 0.25], [s * r * 0.8, cy + r * 0.5, -len * 0.3], [s * (r * 0.8 + len * 0.62), cy + r * 0.3, -len * 0.42], [s * (r * 0.8 + len * 0.5), cy + r * 0.4, len * 0.05], [wingCol, wingCol, mulc(wingCol, 0.6), belly]);
  }
  pb.still().mat(SURF.brass);
  for (const s of [-1, 1]) pb.tube([[s * r * 0.4, cy - r * 0.7, 0], [s * r * 0.45, 0.05, len * 0.05], [s * r * 0.45, 0.03, len * 0.22]], len * 0.035, K.gold, 4);
  pb.mat(SURF.wood);
}
function cageGeo(L) {
  // local frame: the hook under the tie beam at the origin; the cage hangs L below it on its cord
  const pb = new PB(), H = 4.2, R = 1.75;
  pb.mat(SURF.rope).tube([[0, 0, 0], [0, -L + 0.8, 0]], 0.08, K.rope, 4);
  pb.at(0, -L, 0).mat(SURF.wood);
  const bell = (t) => [R * Math.pow(Math.sin(Math.min(1, t * 1.15) * Math.PI / 2), 0.7) + 0.05, -t * H];
  for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU, pts = []; for (let k = 0; k <= 8; k++) { const b = bell(k / 8); pts.push([Math.cos(a) * b[0], b[1], Math.sin(a) * b[0]]); } pb.tube(pts, 0.055, K.rattan, 4); }
  for (const t of [0.3, 0.62, 1]) { const b = bell(t); pb.lathe([[b[0] - 0.06, b[1] - 0.09], [b[0] + 0.07, b[1]], [b[0] - 0.06, b[1] + 0.09]], 14, mulc(K.rattan, t === 1 ? 0.7 : 1)); }
  pb.lathe([[0.01, -H - 0.12], [R, -H - 0.1], [R, -H], [0.01, -H]], 14, mulc(K.timber, 1.2));                                   // tray
  pb.lathe([[0.01, 0.9], [0.14, 0.75], [0.3, 0.3], [0.12, 0], [0.5, -0.25], [0.01, -0.3]], 8, K.brass);                     // finial and hook
  for (const [x, y] of [[-0.7, -H + 1.3], [0.7, -H + 2.2]]) pb.beam([x, y, -R * 0.8], [x, y, R * 0.8], 0.12, 0.12, K.timber, 0.03);   // two perches
  pb.mat(SURF.cloth).lathe([[R * 0.99, -H * 0.05], [R * 0.4, 0.2], [0.02, 0.5]], 14, (i) => [K.magenta, K.gold, K.magenta][i]);     // a little cloth cap
  return pb.geometry();
}
function geckoGeo() {
  // flat on a face whose normal is +x, head up (+y); 3.6 m long
  const pb = new PB(); pb.mat(SURF.feather);
  const pale = [0.72, 0.66, 0.52], rust = [0.62, 0.25, 0.1];
  pb.lathe([[0.01, 1.85], [0.32, 1.7], [0.42, 1.35], [0.3, 1.1], [0.44, 0.7], [0.5, 0.1], [0.4, -0.4], [0.2, -0.9], [0.1, -1.4], [0.01, -1.8]], 8, (i) => (i % 2 ? rust : pale), 0.2, 0, 0, 0.45, 1);
  for (const [y, s, k] of [[0.95, 1, 0.5], [0.95, -1, 0.5], [-0.3, 1, -0.4], [-0.3, -1, -0.4]]) pb.tube([[0.15, y, s * 0.3], [0.2, y + k * 0.5, s * 0.85], [0.1, y + k * 1.3, s * 1.05]], 0.1, pale, 4);
  pb.mat(SURF.glaze); for (const s of [-1, 1]) pb.lathe(ball(0.09, 3), 5, [0.02, 0.02, 0.02], 0.38, 1.38, s * 0.26);
  return pb.geometry();
}
function crabGeo() {
  const pb = new PB(); pb.mat(SURF.feather);
  const shell = [0.78, 0.36, 0.2];
  pb.lathe(pill(0.8, 0.55, 4), 9, (i) => mulc(shell, 0.7 + 0.12 * i), 0, 0.35, 0, 1, 0.7);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) pb.tube([[s * 0.6, 0.5, -0.3 + i * 0.3], [s * 1.2, 0.75, -0.45 + i * 0.45], [s * 1.45, 0.02, -0.55 + i * 0.55]], 0.07, mulc(shell, 1.2), 4);
    pb.tube([[s * 0.5, 0.55, 0.45], [s * 0.85, 0.7, 0.95]], 0.12, shell, 4); pb.lathe(ball(0.2, 3), 5, mulc(K.cream, 0.9), s * 0.9, 0.55, 1.05);
    pb.tube([[s * 0.25, 0.8, 0.4], [s * 0.28, 1.2, 0.45]], 0.045, [0.05, 0.04, 0.04], 4);
  }
  return pb.geometry();
}
function blobMesh(blobs, tint) {
  const pos = [], al = [], N = 10;
  for (const [x, y, z, sx, sz, a] of blobs) for (let i = 0; i < N; i++) {
    const a0 = (i / N) * TAU, a1 = ((i + 1) / N) * TAU;
    pos.push(x, y, z, x + Math.cos(a1) * sx * 0.6, y, z + Math.sin(a1) * sz * 0.6, x + Math.cos(a0) * sx * 0.6, y, z + Math.sin(a0) * sz * 0.6); al.push(a, 0, 0);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(al, 1));
  const m = new THREE.ShaderMaterial({ uniforms: { uTint: { value: new THREE.Color(tint) } }, vertexShader: BLOB_VERT, fragmentShader: BLOB_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'contact-shadows'; mesh.renderOrder = 0.6; return mesh;
}
function burstMesh(n, tint, shade, origin) {
  const g = new THREE.InstancedBufferGeometry(), seed = new Float32Array(n * 4);
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 3));
  g.setAttribute('aCorner', new THREE.Float32BufferAttribute([-1, -1, 1, -1, 1, 1, -1, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
  let h = 7; const r = () => { h = (h * 16807) % 2147483647; return h / 2147483647; };
  for (let i = 0; i < n * 4; i++) seed[i] = r();
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.instanceCount = n;
  const uniforms = { uBurst: { value: 0 }, uHos: { value: new THREE.Vector4() }, uOrigin: { value: origin.clone() }, uTint: { value: new THREE.Color(tint) }, uShade: { value: new THREE.Color(shade) } };
  const m = new THREE.ShaderMaterial({ uniforms, vertexShader: BURST_VERT, fragmentShader: BURST_FRAG, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 6; mesh.name = 'sand-burst';
  return { mesh, uniforms };
}

// =====================================================================================================
// 7. The world
// =====================================================================================================
const ZT = [[0, 160], [0.10, 90], [0.21, 14], [0.37, -120], [0.46, -188], [0.61, -302], [0.70, -350], [0.88, -480], [1, -556]];
const briefU = (z) => { for (let i = 1; i < ZT.length; i++) if (z >= ZT[i][1]) { const a = ZT[i - 1], b = ZT[i]; return a[0] + (b[0] - a[0]) * (a[1] - z) / (a[1] - b[1]); } return 1; };
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _e = new THREE.Euler();
const SWING_AXIS = new THREE.Vector3(-0.6, 0, 0.8), UPV = new THREE.Vector3(0, 1, 0);

export default {
  id: 'house-opens-seaward',
  name: 'The House That Opens to the Sea',
  category: 'domestic',
  weirdness: 0.15,
  media: ['interior', 'air'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const lookName = pickLook(ctx), look = LOOKS[lookName], rare = !!ctx.vary?.rare, density = ctx.vary?.density ?? 1, detail = ctx.quality?.detail ?? 1;
    const rng = ctx.rng.fork('house-opens-seaward');
    const hero = await buildHero(ctx, { palette: PALETTE, look: lookName, rare });
    scene.add(hero.object);
    await ctx.yield();
    const A = hero.anchors, U = hero.light.uniforms, sandH = makeSandH(ctx.noise);
    const env = await buildSkySea(ctx, scene, hero, look, lookName, sandH);
    await buildGround(ctx, scene, hero, look, sandH);
    const palms = await buildPalms(ctx, scene, sandH, look, density);
    await ctx.yield();

    // ---- the props material (one program for still meshes, one for instanced creatures)
    const propU = { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uFlap: { value: new THREE.Vector4() }, uWind: { value: new THREE.Vector3(WIND[0], WIND[1], WIND[2]) }, uGustAll: { value: new THREE.Vector4() } };
    for (const key in U) propU[key] = U[key];
    const propMat = new THREE.ShaderMaterial({ uniforms: propU, vertexShader: PROP_VERT, fragmentShader: propFrag(hero.light.glsl), vertexColors: true, fog: true, side: THREE.DoubleSide });
    const blobs = [];
    const addZone = async (pb, name) => { const m = new THREE.Mesh(await pb.geometrySteps(ctx.yield), propMat); m.name = name; scene.add(m); return pb.tris; };
    let propTris = 0;
    { const pb = new PB(); await buildFront(pb, rng.fork('front'), blobs, ctx.yield); await ctx.yield(); propTris += await addZone(pb, 'front'); }
    await ctx.yield();
    { const pb = new PB(); await buildBays1to5(pb, rng.fork('b1'), blobs, hero, ctx.yield); await ctx.yield(); propTris += await addZone(pb, 'bays-1-5'); }
    await ctx.yield();
    { const pb = new PB(); await buildBays6to8(pb, rng.fork('b6'), blobs, hero, ctx.yield); await ctx.yield(); propTris += await addZone(pb, 'bays-6-8'); }
    await ctx.yield();
    { const pb = new PB(); await buildSubjects(pb, ctx.rng.fork('hos-subjects'), blobs, hero, ctx.yield); await ctx.yield(); propTris += await addZone(pb, 'subjects'); }
    await ctx.yield();
    { const pb = new PB(), pbB = new PB(); await buildBays9to12(pb, rng.fork('b9'), blobs, sandH, ctx.yield, pbB); await ctx.yield(); propTris += await addZone(pb, 'bays-9-12'); await ctx.yield(); propTris += await addZone(pbB, 'beach'); }
    await ctx.yield();
    // two moon kites riding high over the water on long strings, and (silver morning) six boats coming in under sail
    {
      const pb = new PB();
      // [x, y, z, size, colours, string anchor x, z, yaw]: each kite is turned to face where we see it from
      for (const [x, y, z, s, cols, ax, az, yaw] of [[218, 78, -500, 14, [K.magenta, K.gold, K.indigo], 172, -410, 1.0], [204, 60, -395, 12, [K.jade, K.cream, K.magenta], 160, -335, 0.85],
        [-56, 80, -706, 12.5, [K.gold, K.magenta, K.cream], -84, -596, Math.PI / 2], [66, 97, -772, 13.5, [K.magenta, K.cream, K.jade], 96, -598, Math.PI / 2]]) {
        const anchor = [ax, sandH(ax, az) + 0.5, az];
        pb.at().anim(3, 0.07, x * 0.1, 1, anchor);
        pb.at(x, y, z, yaw, 1, 0, 0.3); moonKite(pb, 0, 0, 0, s, cols);
        pb.mat(SURF.cloth); for (let k = 0; k < 2; k++) pb.sheet((u, v) => [0.5 * Math.sin(v * 8), -s * 1.2 - v * s * 1.6, (k ? 1 : -1) * s * (0.5 + 0.2 * v) + Math.sin(v * 6 + k) * 1.2], 1, 6, (u, v, i, j) => (j & 1) ? cols[0] : cols[1], (u, v) => 1 + v * 0.6);
        pb.at();
        const str = []; for (let i = 0; i <= 10; i++) { const t = i / 10; str.push([lerp(anchor[0], x, t), lerp(anchor[1], y - s * 0.4, t) - 14 * Math.sin(Math.PI * t) * (1 - t * 0.5), lerp(anchor[2], z, t)]); }
        pb.mat(SURF.rope).tube(str, 0.5, K.cream, 4);
      }
      pb.still().mat(SURF.wood); propTris += await addZone(pb, 'kites');
    }
    await ctx.yield();
    let boats = null;
    if (lookName === 'morning') {
      const pb = new PB(), br = rng.fork('boats');
      for (let i = 0; i < 8; i++) {                                              // six coming in ahead and right, two far out on the right that show from the stair
        const [bx0, bz0] = [[74, -696], [164, -771], [163, -706], [252, -781], [234, -716], [158, -861], [345, -330], [450, -540]][i];
        const x = bx0 + br.range(-6, 6), z = bz0 + br.range(-6, 6), s = br.range(0.9, 1.2), ry = br.range(1.3, 1.9);
        pb.at(x, SEA, z, ry, s).mat(SURF.wood).still();
        pb.sheet((u, v) => { const e = 2 * u - 1, b = 4 * Math.pow(Math.max(0, 1 - e * e), 0.55) + 0.05, th = Math.PI * v; return [-b * Math.cos(th), lerp(4.5 + 2.5 * e * e, -1, Math.pow(Math.sin(th), 0.75)), 17 - u * 34]; }, 10, 8,
          (u, v) => { const d = Math.min(v, 1 - v); return d < 0.12 ? [K.turq, K.red, K.jade][i % 3] : d < 0.2 ? K.white : mulc(K.timber, 0.7); });
        pb.beam([0, 2, 2], [0, 34, 2], 0.6, 0.6, K.timber, 0.15); pb.beam([0, 30, 12], [0, 8, -14], 0.4, 0.4, K.timber, 0.1);
        pb.mat(SURF.cloth).anim(1, 1.6, i * 1.4, 1, [0, 20, 0]);
        pb.sheet((u, v) => [2.2 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v), lerp(lerp(30, 8, u), 4.5, v * (0.35 + 0.65 * u)), lerp(12, -14, u) + v * 2], 6, 5, (u, v, a, b) => mulc(i % 2 ? mixc(K.cream, K.clay, 0.45) : K.cream, 0.82 + 0.18 * (a & 1)), (u, v) => Math.sin(Math.PI * u) * Math.sin(Math.PI * v));
      }
      pb.at().still().mat(SURF.wood);
      boats = new THREE.Mesh(pb.geometry(), propMat); boats.name = 'sailing-boats'; boats.frustumCulled = false; scene.add(boats); propTris += pb.tris;
    }
    scene.add(blobMesh(blobs, look.shadow));
    await ctx.yield();

    // ---- creatures
    const inst = (geo, n, name) => { const m = new THREE.InstancedMesh(geo, propMat, n); m.frustumCulled = false; m.name = name; scene.add(m); return m; };
    const hooks = A.cageHooks, cageL = [20, 16, 12, 16, 20];
    const cageMeshes = [inst(cageGeo(12), 1, 'cage-a'), inst(cageGeo(16), 2, 'cage-b'), inst(cageGeo(20), 2, 'cage-c')], cageSlot = [[2, 0], [1, 0], [0, 0], [1, 1], [2, 1]];
    await ctx.yield();
    const dovePB = new PB(); birdBody(dovePB, 1.7, [0.4, 0.33, 0.3], [0.78, 0.66, 0.6], [0.3, 0.26, 0.25], 0);
    const doves = inst(dovePB.geometry(), 5, 'doves');
    const henPB = new PB(); birdBody(henPB, 2.5, [0.5, 0.2, 0.07], [0.8, 0.62, 0.36], [0.16, 0.09, 0.05], 1, K.red);
    const hens = inst(henPB.geometry(), 3, 'hens');
    const HEN = [[5.6, 109, 15.5, 99.5], [7.2, 114, 21, 101.5], [4.4, 117.5, 12.6, 104]];
    const geckos = inst(geckoGeo(), 4, 'geckos'), GECKO = [1, 3, 9, 11];
    const NCRAB = Math.max(12, Math.round(30 * detail)), crabs = inst(crabGeo(), NCRAB, 'crabs'), crabRng = rng.fork('crabs'), CRAB = [];
    for (let i = 0; i < NCRAB; i++) { const s = i & 1 ? 1 : -1; CRAB.push({ x: s * crabRng.range(3, 19), z: -503 - crabRng.range(0, 30) - (i % 3 === 0 ? 26 : 0), dx: s * crabRng.range(0.75, 1), dz: -crabRng.range(0.1, 0.7), d: crabRng.range(14, 30), t0: 0.45 + crabRng.range(0, 0.035) * 16, ph: crabRng.range(0, 6) }); }
    await ctx.yield();
    const faunaLight = F.lightFrom(scene);
    const path = makePath(A.flyThrough.map((p) => p.clone()));
    const swallows = F.makeFlock({ rng: rng.fork('swallows'), species: 'swifts', count: 6, size: 4.2, light: faunaLight, spread: [9, 5, 16], body: '#1a2440', belly: '#f2e6d4', wingC: '#141c30',
      along: { path, side: -9, up: 4, lead: 34, from: 0.2, to: 0.93, drift: 10 } });
    scene.add(swallows.object);
    const terns = F.makeFlock({ rng: rng.fork('terns'), species: 'gulls', count: 7, size: 3.3, light: faunaLight, spread: [16, 7, 22], body: '#f6f4ee', belly: '#ffffff', wingC: '#e4e6ea', tip: '#30343c',
      along: { path, side: 30, up: 6, lead: 46, from: 0.43, to: 0.66, drift: 8 } });
    scene.add(terns.object);
    const terns2 = F.makeFlock({ rng: rng.fork('terns2'), species: 'gulls', count: 9, size: 3.6, light: faunaLight, center: [6, 52, -628], radius: 52, height: 14, body: '#f6f4ee', belly: '#ffffff', wingC: '#e4e6ea', tip: '#30343c' });
    scene.add(terns2.object);
    await ctx.yield();

    // ---- air: dust in the shafts, sand hissing over the boards, bracts down the wind, kettle steam, the sand burst
    const time = { value: 0 };
    const dust = fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', count: Math.round(2000 * detail * Math.min(1.2, density)), box: [64, 40, 84], colors: look.dust, intensity: 1.5, size: [0.06, 0.2], velocity: [WIND[0] * 1.4, 0.1, WIND[2] * 1.4], time });
    const hiss = fx.makeParticles({ rng: rng.fork('hiss'), preset: 'dust', count: Math.round(520 * detail), box: [70, 4, 90], follow: 'xz', center: [0, FLOOR + 2.6, 0], mode: 'streak', shape: 'streak', stretch: 0.07,
      velocity: [WIND[0] * 13, 0, WIND[2] * 13], velocityRandom: 0.35, colors: [look.sandB, look.sandB, look.sandA], size: [0.04, 0.1], intensity: 0.5, opacity: 0.6, twinkle: 0, time });
    const bracts = fx.makeParticles({ rng: rng.fork('bracts'), preset: 'petals', count: Math.round(260 * detail), box: [70, 34, 80], colors: ['#B5245C', '#d8407a', '#e06a9a'], size: [0.35, 0.7], velocity: [WIND[0] * 7, -0.8, WIND[2] * 7], time });
    scene.add(dust.object, hiss.object, bracts.object);
    await ctx.yield();
    const steam = fx.makeSmokeColumn({ rng: rng.fork('steam'), time, position: [-13.9, FLOOR + 6.6, -424], height: 13, radius: [0.12, 1.1], size: [0.5, 2.3], count: 44, color: '#f4f6f8', colorTop: '#ffffff', shadowColor: '#c2c8d2', ambient: '#8a9098',
      opacity: 0.2, rate: 0.3, wind: [WIND[0] * 5.5, 0, WIND[2] * 5.5], bend: 1.5, sunDir: A.sunDir.toArray() });
    scene.add(steam.object);
    await ctx.yield();
    const burstTint = new THREE.Color(look.sandA).multiply(new THREE.Color().setRGB(U.uOutSun.value.x, U.uOutSun.value.y, U.uOutSun.value.z)).multiplyScalar(0.62);
    const burstShade = new THREE.Color(look.sandB).multiply(new THREE.Color().setRGB(U.uOutAmb.value.x, U.uOutAmb.value.y, U.uOutAmb.value.z)).multiplyScalar(0.3);
    const burst = burstMesh(Math.round(420 * detail), burstTint, burstShade, new THREE.Vector3(A.rampTip.x, A.rampTip.y - 0.4, A.rampTip.z));
    const surf = buildSurf(scene, U, look);
    const glitter = look.glitter ? buildGlitter(scene, U, look, new THREE.Vector3(...look.skySun)) : null;
    scene.add(burst.mesh);
    await ctx.yield();
    await env.sky.prewarm(ctx.renderer, null, scene);

    const cradle = A.cradle, seaPoi = new THREE.Vector3(215, 26, -455);
    const portalCol = A.portalSeat.color;
    const pos = new THREE.Vector3(), cam = new THREE.Vector3();

    return {
      scene, path, duration: 36,
      pace: (u) => 0.65 + 0.25 * sm(0.08, 0.13, u) + 0.28 * sm(0.13, 0.22, u) - 0.15 * sm(0.62, 0.7, u) - 0.08 * sm(0.88, 0.93, u),   // a little slower down the tunnel toward the ring
      camera: { fov: 62, near: 0.5, far: 5200, lookAhead: 34, sway: 0.5, bank: 0.3 },
      pois: [
        { at: [cradle.x, cradle.y + 5, cradle.z], from: 0.33, to: 0.475, weight: 0.62, fade: 0.2 },
        { at: seaPoi, from: 0.46, to: 0.57, weight: 0.5 },
        { at: [15, 27, -318], from: 0.55, to: 0.665, weight: 0.6 },                // coming back in: the sarong line, the folded screen and the sea through the folding wall
        { at: A.portalSeat.position.clone(), from: 0.63, to: 0.8, weight: 0.7 },
      ],
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: portalCol, glow: 1.25, revealDistance: 330 },
      post: { exposure: look.exposure, bloom: { strength: look.bloom * 0.7, radius: 0.6, threshold: 1.0 },
        grade: { saturation: look.sat, contrast: look.contrast ?? 1.06, tint: look.tint, shadowTint: look.shadow, vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none',
      title: 'The House That Opens to the Sea',
      update(dt, time_, camera, u) {
        time.value = time_;
        path.pointAt(u, pos);
        const ub = u <= 0 ? 0 : Math.max(1e-4, briefU(pos.z));
        const wallU = u <= 0 ? -1 : (-405 - pos.z) / 42;                        // 0: the end wall starts to fall; 1: it lands
        hero.update(dt, time_, camera);
        hero.setProgress(ub, pos.z);
        const waveZ = U.uWaveZ.value, calm = U.uCalm.value.x, lull = 1 - 0.9 * calm;
        propU.uGustAll.value.y = hero.lead() - 44;                               // the blinds still roll 57 to 95 m ahead of us, whatever the wave's lead
        propU.uGustAll.value.x = rare ? 0.9 * sm(0.755, 0.775, ub) * (1 - sm(0.79, 0.84, ub)) : 0;
        camera.getWorldPosition(cam);
        // cages swing in the gust; the doves hop between their perches and flutter up as it arrives
        let flut = 0;
        for (let i = 0; i < 5; i++) {
          const h = hooks[i], s = Math.max((h.z - waveZ) / 22, 0), on = sm(0, 0.7, s), ph = i * 1.9;
          const kick = Math.exp(-s * 0.5) * Math.sin(s * 4.4) * sm(0, 0.25, s);
          const breeze = on * lull * (0.5 + 0.3 * Math.sin(time_ * 1.9 + ph) + 0.2 * Math.sin(time_ * 3.3 + ph * 1.7));
          const th = 0.36 * (0.42 * (breeze - 0.5 * on * lull) + 0.9 * kick * lull + (1 - on) * 0.05 * Math.sin(time_ * 1.1 + ph));
          _q.setFromAxisAngle(SWING_AXIS, -th);
          _m.compose(h, _q, _s);
          cageMeshes[cageSlot[i][0]].setMatrixAt(cageSlot[i][1], _m);
          const f = sm(0.05, 0.4, s) * (1 - sm(1.6, 3.4, s)); flut = Math.max(flut, f);
          const hop = (time_ * 0.31 + i * 0.37) % 1, t = hop < 0.42 ? 0 : hop < 0.5 ? (hop - 0.42) / 0.08 : hop < 0.92 ? 1 : 1 - (hop - 0.92) / 0.08, tt = t * t * (3 - 2 * t);
          const L = cageL[i], yb = -L - 4.2;
          _p.set(lerp(-0.7, 0.7, tt) + f * 0.3 * Math.sin(time_ * 9 + i), yb + lerp(1.36, 2.26, tt) + Math.sin(Math.PI * t) * 0.45 + f * (0.7 + 0.25 * Math.sin(time_ * 13 + i * 2)), f * 0.25 * Math.sin(time_ * 7 + i));
          _q2.setFromAxisAngle(UPV, (i * 1.3) + tt * 2.6 + f * Math.sin(time_ * 5 + i));
          _m2.compose(_p, _q2, _s); _m2.premultiply(_m);
          doves.setMatrixAt(i, _m2);
        }
        for (const c of cageMeshes) c.instanceMatrix.needsUpdate = true;
        doves.instanceMatrix.needsUpdate = true;
        // hens scratch in the striped shade and scatter as we come up the lane
        const hf = sm(0.03, 0.085, ub), hmove = sm(0, 0.12, hf) * (1 - sm(0.85, 1, hf));
        for (let i = 0; i < 3; i++) {
          const H = HEN[i], fi = sm(0, 1, Math.min(1, hf * (1.15 - i * 0.12))), x = lerp(H[0], H[2], fi), z = lerp(H[1], H[3], fi);
          const peck = (1 - hmove) * Math.max(0, Math.sin(time_ * 2.6 + i * 2.1)) * 0.55;
          const yaw = hmove > 0.02 ? Math.atan2(H[2] - H[0], H[3] - H[1]) + 0.3 * Math.sin(time_ * 11 + i) : i * 2.2 + 0.4 * Math.sin(time_ * 0.6 + i);
          _q.setFromEuler(_e.set(peck, yaw, 0, 'YXZ'));
          _p.set(x, sandH(x, z) + hmove * Math.abs(Math.sin(time_ * 9 + i * 1.7)) * 1.1, z);
          _m.compose(_p, _q, _s); hens.setMatrixAt(i, _m);
        }
        hens.instanceMatrix.needsUpdate = true;
        propU.uFlap.value.set(flut, hmove, 0, 0);
        // geckos flat on the sunny face of four posts: each darts six metres up as its slab of light lands
        for (let i = 0; i < 4; i++) {
          const k = GECKO[i], o = hero.bayOpen(k, -1), d = sm(0.35, 0.95, o), moving = d * (1 - d) * 4;
          _q.setFromEuler(_e.set(0, -Math.PI / 2, 0.25 * Math.sin(time_ * 14 + i) * moving + 0.06 * Math.sin(time_ * 0.8 + i), 'YXZ'));
          _p.set(-30.6 + 0.3 * (i & 1), 23.5 + i * 0.7 + 6 * d, -40 * k + 1.06);
          _m.compose(_p, _q, _s.set(1.15, 1.15, 1.15)); geckos.setMatrixAt(i, _m);
        }
        _s.set(1, 1, 1);
        geckos.instanceMatrix.needsUpdate = true;
        // ghost crabs run sideways from the falling ramp and stop
        for (let i = 0; i < NCRAB; i++) {
          const c = CRAB[i], f = sm(c.t0, c.t0 + 1.3, wallU), run = f * (1 - f) * 4, x = c.x + c.dx * c.d * f, z = c.z + c.dz * c.d * f;
          _q.setFromAxisAngle(UPV, Math.atan2(-c.dz, c.dx) + 0.2 * Math.sin(time_ * 1.3 + c.ph));
          _p.set(x, sandH(x, z) + 0.05 + run * 0.12 * Math.abs(Math.sin(time_ * 17 + c.ph)), z);
          _m.compose(_p, _q, _s.set(1.25, 1.25, 1.25)); crabs.setMatrixAt(i, _m);
        }
        _s.set(1, 1, 1);
        crabs.instanceMatrix.needsUpdate = true;
        // air
        const inHall = sm(8, -6, cam.z) * (1 - sm(-470, -492, cam.z));
        hiss.setOpacity((0.2 + 0.8 * inHall) * (1 - 0.8 * calm) * 0.6);
        bracts.setOpacity(0.3 + 0.7 * Math.max(sm(0.44, 0.48, ub) * (1 - sm(0.6, 0.66, ub)), sm(0.12, 0.16, ub) * (1 - sm(0.2, 0.24, ub))));
        burst.uniforms.uBurst.value = u <= 0 ? 0 : Math.max(0, (-444 - pos.z) / 22);
        if (glitter) { glitter.position.x = cam.x; glitter.position.z = cam.z; }
        if (boats) boats.position.set(-time_ * 0.7, 0.35 * Math.sin(time_ * 0.9), time_ * 0.25);
        dust.update(dt, time_, camera); hiss.update(dt, time_, camera); bracts.update(dt, time_, camera); steam.update(dt, time_, camera);
        env.sky.update(dt, time_, camera); env.rig.update(dt, time_, camera); env.clouds.update(dt, time_, camera); env.sea.update(dt, time_, camera);
        palms.update(dt, time_, camera);
        swallows.update(dt, time_, camera, u); terns.update(dt, time_, camera, u); terns2.update(dt, time_, camera, u);
      },
      dispose() { env.sky.dispose(); },
    };
  },
};
