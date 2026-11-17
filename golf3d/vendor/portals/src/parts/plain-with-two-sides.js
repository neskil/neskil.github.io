// HERO SET PIECE for "plain-with-two-sides" (from Don Quixote): a pair that does not agree.
//
// WHAT IT IS
//   A whitewashed La Mancha windmill (round tapering tower, conical cap, four lattice sails with canvas, tail pole)
//   and, built from the same skeleton of proportions (SK below), a giant: a robed and armoured figure whose helm is
//   the mill's cap, whose mantle's train is the tail pole and whose four long armoured arms are the four sails. One
//   rotation (uniform uSpin) turns every sail and every arm in the world together; a pair shares its phase.
//   The same module builds the other pairs of the world the same way: an inn and a castle on one footprint (YARD),
//   and the small living things (horse / charger, donkey / palfrey, sheep, soldiers, shepherds, pigs, swans).
//
// LOCAL SPACE   every piece: origin at the base centre, +Y up, front facing +Z. The mill's sails and the giant's arms
//   turn in the plane z = SK.hubZ about the point (0, SK.hubY).
//
// MATERIALS     makeKit(ctx) returns one family of MeshLambertMaterials (scene lights, fog and the shadow map apply)
//   with a small injected shader: vertex colours are the albedo, a material id per vertex picks the surface (whitewash,
//   timber, tiles, masonry, brocade, steel, gold, cloth, canvas, wool), cloth moves in one wind, sails and arms turn,
//   limbs swing. Back-light is added on top: rim, light through cloth, sky in metal.
//
// buildHero(ctx, opts) -> the first pair standing either side of a strip of road, for the set-piece viewer and as a
//   reference of use. The world itself instances the geometries from makeKit.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mulc = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

// surface ids understood by the shader (aFx.z)
export const MAT = { PLAIN: 0, CLOTH: 1, STEEL: 2, GOLD: 3, CANVAS: 4, GLOW: 5, BROCADE: 6, TILE: 7, STONE: 8, PLANK: 9, WOOL: 10, GLASS: 11, LAMP: 12 };

// the shared skeleton of the mill and the giant (metres)
export const SK = { H: 15.2, rBase: 4.3, rTop: 3.7, capH: 5.6, capR: 4.25, hubY: 15.0, hubZ: 4.3, sailR: 13.6, sailW: 2.7, sail0: 1.9, tailY: 16.4, tailZ: -14.5, elbow: 6.4 };
// the shared footprint of the inn and the castle (metres; front and gate on +Z)
export const YARD = { W: 36, D: 30, gate: 5.2, mainW: 26, mainD: 8.6, moat: 7.5 };
// (the inn's gate piers: a metre square, four metres high; a lamp's light on one lies on its face only)
export const INN_PIER = { w: 1.0, h: 4.0 };

export const PAL = {
  dust: lin('#d8c08a'), stubble: lin('#b08a52'), white: lin('#f2efe6'), olive: lin('#7f8a5a'), timber: lin('#6b5a45'),
  ultra: lin('#2b3f9e'), verm: lin('#c8202a'), gold: lin('#f1c232'), green: lin('#2f9e57'), pearl: lin('#f6f1e1'),
  sun: lin('#ffb45e'), road: lin('#f4e9d2'), steel: lin('#b4bfd6'), dark: lin('#2a241f'), tile: lin('#b9764a'), stone: lin('#9a927f'),
  canvas: lin('#e9dfc4'), silver: lin('#dfe6f2'), slate: lin('#33479a'),
};

// ---------------------------------------------------------------- geometry accumulator
// position, normal, colour (linear albedo), uv (pattern coordinates, metres), aFx = (turn, wind, surface id, arm index),
// aLimb = (pivot y, pivot z, swing amplitude, phase + 10 x rate class) for creatures.
export class Geo {
  constructor() {
    this.p = []; this.n = []; this.c = []; this.uv = []; this.fx = []; this.lb = []; this.idx = []; this.count = 0;
    this.col = [1, 1, 1]; this.mat = 0; this.spin = 0; this.wind = 0; this.arm = 0; this.limb = null; this.M = null; this.stack = [];
  }
  color(c, k = 1) { this.col = [c[0] * k, c[1] * k, c[2] * k]; return this; }
  surf(id) { this.mat = id; return this; }
  push(m) { this.stack.push(this.M); this.M = this.M ? this.M.clone().multiply(m) : m.clone(); return this; }
  pop() { this.M = this.stack.pop() || null; return this; }
  at(x, y, z, ry = 0, s = 1) { return this.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(s, s, s))); }
  rotZ(a, cx = 0, cy = 0) { return this.push(new THREE.Matrix4().makeTranslation(cx, cy, 0).multiply(new THREE.Matrix4().makeRotationZ(a)).multiply(new THREE.Matrix4().makeTranslation(-cx, -cy, 0))); }
  v(x, y, z, nx, ny, nz, u = 0, w = 0, wind = this.wind, col = this.col) {
    if (this.M) {
      const e = this.M.elements, px = e[0] * x + e[4] * y + e[8] * z + e[12], py = e[1] * x + e[5] * y + e[9] * z + e[13], pz = e[2] * x + e[6] * y + e[10] * z + e[14];
      const qx = e[0] * nx + e[4] * ny + e[8] * nz, qy = e[1] * nx + e[5] * ny + e[9] * nz, qz = e[2] * nx + e[6] * ny + e[10] * nz, l = Math.hypot(qx, qy, qz) || 1;
      x = px; y = py; z = pz; nx = qx / l; ny = qy / l; nz = qz / l;
    }
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(col[0], col[1], col[2]); this.uv.push(u, w);
    this.fx.push(this.spin, wind, this.mat, this.arm);
    const L = this.limb; if (L) this.lb.push(L[0], L[1], L[2], L[3]); else this.lb.push(0, 0, 0, 0);
    return this.count++;
  }
  // flat quad, corners counter-clockwise seen from outside; uv in metres from A. both: also the back face.
  quad(A, B, C, D, o = {}) {
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = D[0] - A[0], vy = D[1] - A[1], vz = D[2] - A[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const lu = Math.hypot(ux, uy, uz), lv = Math.hypot(vx, vy, vz), uo = o.u ?? 0, vo = o.v ?? 0, w = o.w || [this.wind, this.wind, this.wind, this.wind], cs = o.cols || [this.col, this.col, this.col, this.col];
    const a = this.v(A[0], A[1], A[2], nx, ny, nz, uo, vo, w[0], cs[0]), b = this.v(B[0], B[1], B[2], nx, ny, nz, uo + lu, vo, w[1], cs[1]);
    const c = this.v(C[0], C[1], C[2], nx, ny, nz, uo + lu, vo + lv, w[2], cs[2]), d = this.v(D[0], D[1], D[2], nx, ny, nz, uo, vo + lv, w[3], cs[3]);
    this.idx.push(a, b, c, a, c, d);
    if (o.both) {
      const a2 = this.v(A[0], A[1], A[2], -nx, -ny, -nz, uo, vo, w[0], cs[0]), b2 = this.v(B[0], B[1], B[2], -nx, -ny, -nz, uo + lu, vo, w[1], cs[1]);
      const c2 = this.v(C[0], C[1], C[2], -nx, -ny, -nz, uo + lu, vo + lv, w[2], cs[2]), d2 = this.v(D[0], D[1], D[2], -nx, -ny, -nz, uo, vo + lv, w[3], cs[3]);
      this.idx.push(a2, c2, b2, a2, d2, c2);
    }
    return this;
  }
  tri(A, B, C, o = {}) {
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const w = o.w || [this.wind, this.wind, this.wind];
    const a = this.v(A[0], A[1], A[2], nx, ny, nz, 0, 0, w[0]), b = this.v(B[0], B[1], B[2], nx, ny, nz, 1, 0, w[1]), c = this.v(C[0], C[1], C[2], nx, ny, nz, 0.5, 1, w[2]);
    this.idx.push(a, b, c);
    if (o.both) { const a2 = this.v(A[0], A[1], A[2], -nx, -ny, -nz, 0, 0, w[0]), b2 = this.v(B[0], B[1], B[2], -nx, -ny, -nz, 1, 0, w[1]), c2 = this.v(C[0], C[1], C[2], -nx, -ny, -nz, 0.5, 1, w[2]); this.idx.push(a2, c2, b2); }
    return this;
  }
  // axis-aligned box
  box(x0, y0, z0, x1, y1, z1, o = {}) {
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], o); this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], o);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], o); this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], o);
    if (o.top !== false) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], o);
    if (o.bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], o);
    return this;
  }
  cbox(cx, y0, cz, sx, sy, sz, o = {}) { return this.box(cx - sx / 2, y0, cz - sz / 2, cx + sx / 2, y0 + sy, cz + sz / 2, o); }
  // rectangular beam from A to B, section w (sideways) x h
  beam(A, B, w, h, o = {}) {
    let tx = B[0] - A[0], ty = B[1] - A[1], tz = B[2] - A[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    const up = o.up || (Math.abs(ty) > 0.9 ? [0, 0, 1] : [0, 1, 0]);
    let sx = ty * up[2] - tz * up[1], sy = tz * up[0] - tx * up[2], sz = tx * up[1] - ty * up[0]; const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
    const ux = sy * tz - sz * ty, uy = sz * tx - sx * tz, uz = sx * ty - sy * tx, hw = w / 2, hh = h / 2, w1 = (o.taper ?? 1);
    const P = (E, a, b, k) => [E[0] + (sx * a * hw + ux * b * hh) * k, E[1] + (sy * a * hw + uy * b * hh) * k, E[2] + (sz * a * hw + uz * b * hh) * k];
    const c = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    for (let i = 0; i < 4; i++) { const p = c[i], q = c[(i + 1) % 4]; this.quad(P(A, p[0], p[1], 1), P(B, p[0], p[1], w1), P(B, q[0], q[1], w1), P(A, q[0], q[1], 1), o); }
    if (o.caps !== false) { this.quad(P(B, 1, 1, w1), P(B, 1, -1, w1), P(B, -1, -1, w1), P(B, -1, 1, w1), o); this.quad(P(A, 1, 1, 1), P(A, -1, 1, 1), P(A, -1, -1, 1), P(A, 1, -1, 1), o); }
    return this;
  }
  // smooth parametric patch f(u,v) -> [x,y,z, wind?, colour?]; normals from the patch; both: back face as well
  grid(nu, nv, f, o = {}) {
    const W = nu + 1, H = nv + 1, P = new Array(W * H), su = o.su ?? 1, sv = o.sv ?? 1, wrap = !!o.wrap;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) P[j * W + i] = f(i / nu, j / nv);
    const emit = (flip) => {
      const base = this.count;
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const il = i > 0 ? i - 1 : (wrap ? nu - 1 : 0), ir = i < nu ? i + 1 : (wrap ? 1 : nu);
        const a = P[j * W + il], b = P[j * W + ir], c = P[Math.max(j - 1, 0) * W + i], d = P[Math.min(j + 1, nv) * W + i];
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - c[0], vy = d[1] - c[1], vz = d[2] - c[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz);
        if (l < 1e-9) { nx = 0; ny = 1; nz = 0; } else { nx /= l; ny /= l; nz /= l; }
        if (flip) { nx = -nx; ny = -ny; nz = -nz; }
        const q = P[j * W + i];
        this.v(q[0], q[1], q[2], nx, ny, nz, (i / nu) * su, (j / nv) * sv, q[3] ?? this.wind, q[4] || this.col);
      }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const a = base + j * W + i, b = a + 1, c = a + W + 1, d = a + W;
        if (flip) this.idx.push(a, c, b, a, d, c); else this.idx.push(a, b, c, a, c, d);
      }
    };
    emit(!!o.flip); if (o.both) emit(!o.flip);
    return this;
  }
  // surface of revolution about the vertical through (cx, cz). prof = [[r, y, colour?], ...] bottom to top.
  // o: segs, sx, sz (ellipse), a0, a1 (arc, radians; 0 = +Z, quarter turn = +X), rFn(a, k) radius factor, wFn(y) wind, flat
  lathe(prof, o = {}) {
    const segs = o.segs ?? 16, cx = o.cx ?? 0, cz = o.cz ?? 0, sx = o.sx ?? 1, sz = o.sz ?? 1, a0 = o.a0 ?? 0, a1 = o.a1 ?? TAU, n = prof.length - 1, full = Math.abs(a1 - a0 - TAU) < 1e-6;
    const f = (u, v) => {
      const k = Math.round(v * n), q = prof[k], a = a0 + u * (a1 - a0), r = q[0] * (o.rFn ? o.rFn(a, k) : 1);
      return [cx + Math.sin(a) * r * sx, q[1], cz + Math.cos(a) * r * sz, o.wFn ? o.wFn(q[1]) : this.wind, q[2] || this.col];
    };
    if (o.flat) { for (let k = 0; k < n; k++) { const pk = [prof[k], prof[k + 1]]; this.lathe(pk, { ...o, flat: false }); } return this; }
    return this.grid(segs, n, f, { wrap: full, su: o.su ?? segs, sv: o.sv ?? n, both: o.both, flip: o.flip });
  }
  // round tube along a polyline, radius per point; smooth
  tube(pts, radii, o = {}) {
    const segs = o.segs ?? 8, n = pts.length, F = [];
    let px = 0, py = 0, pz = 1;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      if (i === 0) { const up = o.up || (Math.abs(tz) > 0.9 ? [1, 0, 0] : [0, 0, 1]); px = up[0]; py = up[1]; pz = up[2]; }
      const d = px * tx + py * ty + pz * tz; px -= d * tx; py -= d * ty; pz -= d * tz; const pl = Math.hypot(px, py, pz) || 1; px /= pl; py /= pl; pz /= pl;
      F.push([tx, ty, tz, px, py, pz, ty * pz - tz * py, tz * px - tx * pz, tx * py - ty * px]);
    }
    return this.grid(segs, n - 1, (u, v) => {
      const k = Math.round(v * (n - 1)), fr = F[k], a = u * TAU, r = Array.isArray(radii) ? radii[k] : radii, ca = Math.cos(a) * r, sa = Math.sin(a) * r, p = pts[k];
      return [p[0] + fr[3] * ca + fr[6] * sa, p[1] + fr[4] * ca + fr[7] * sa, p[2] + fr[5] * ca + fr[8] * sa, p[3] ?? this.wind];
    }, { wrap: true, su: segs, sv: n - 1 });
  }
  // ellipsoid (v0..v1 of the latitude range, 0 = bottom pole, 1 = top pole)
  ball(cx, cy, cz, rx, ry, rz, o = {}) {
    const nu = o.nu ?? 10, nv = o.nv ?? 6, v0 = o.v0 ?? 0, v1 = o.v1 ?? 1;
    return this.grid(nu, nv, (u, v) => { const t = (v0 + (v1 - v0) * v) * Math.PI, a = u * TAU, s = Math.sin(t); return [cx + Math.sin(a) * s * rx, cy - Math.cos(t) * ry, cz + Math.cos(a) * s * rz]; }, { wrap: true, su: nu, sv: nv });
  }
  disc(cx, y, cz, r, segs = 12, o = {}) {
    const c = this.v(cx, y, cz, 0, 1, 0, 0, 0), ring = [];
    for (let i = 0; i < segs; i++) { const a = i / segs * TAU; ring.push(this.v(cx + Math.sin(a) * r * (o.sx ?? 1), y, cz + Math.cos(a) * r, 0, 1, 0, Math.sin(a) * r, Math.cos(a) * r)); }
    for (let i = 0; i < segs; i++) this.idx.push(c, ring[i], ring[(i + 1) % segs]);
    return this;
  }
  get triangles() { return this.idx.length / 3; }
  toGeometry(o = {}) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aFx', new THREE.Float32BufferAttribute(this.fx, 4));
    if (o.limb) g.setAttribute('aLimb', new THREE.Float32BufferAttribute(this.lb, 4));
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere(); if (o.pad) g.boundingSphere.radius += o.pad;
    g.userData.triangles = this.idx.length / 3;
    return g;
  }
}

// ---------------------------------------------------------------- the material family
const V_PARS = /* glsl */`
attribute vec4 aFx;
uniform float uTime; uniform vec4 uWind;
varying vec3 vWPos; varying float vSurf; varying vec2 vPuv;
#ifdef PW_SPIN
attribute vec4 aPair;
uniform float uSpin, uLock, uElbow; uniform vec3 uHub;
vec2 pwRot(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
#endif
#ifdef PW_LIMB
attribute vec4 aLimb; attribute vec4 aGo;
#endif
`;
// the one rotation: aPair = (phase, +1 mill sense / -1 mirrored, held pose amount, spare)
// (the thing's own place in the world: its origin, as its matrix sets it)
const V_ORIGIN = /* glsl */`
#ifdef USE_INSTANCING
mat4 pwM = modelMatrix * instanceMatrix;
#else
mat4 pwM = modelMatrix;
#endif
vec3 pwO = pwM[3].xyz;
`;
const V_ANGLE = /* glsl */`
#ifdef PW_SPIN
float pwA = mix(uSpin + aPair.x, uLock, aPair.z); pwA = aPair.y > 0. ? pwA : 3.14159265 - pwA;
float pwB = (aFx.w - 1.) * 1.5707963;
float pwF = (0.14 * sin(pwA + pwB) + 0.1) * (aPair.y > 0. ? 1. : -1.);
#endif
`;
const V_NORMAL = /* glsl */`
#ifdef PW_SPIN
if (aFx.x > 1.5) objectNormal.xy = pwRot(objectNormal.xy, pwF);
if (aFx.x > 0.5) objectNormal.xy = pwRot(objectNormal.xy, pwA);
#endif
`;
const V_POS = /* glsl */`
#ifdef PW_SPIN
if (aFx.x > 1.5) { vec2 pwP = uHub.xy + uElbow * vec2(cos(pwB), sin(pwB)); transformed.xy = pwP + pwRot(transformed.xy - pwP, pwF); }
if (aFx.x > 0.5) transformed.xy = uHub.xy + pwRot(transformed.xy - uHub.xy, pwA);
#endif
#ifdef PW_LIMB
{
  float pwCls = floor(aLimb.w * 0.1 + 0.01), pwPh = aLimb.w - pwCls * 10.;
  // (a leg swings by the world clock, aGo.y its rate: for a creature that goes a round on that clock, 6.28 times its speed over its stride)
  float pwGo = uTime;
  float pwAng = pwCls < 0.5 ? aLimb.z * aGo.z * sin(pwGo * aGo.y + aGo.x + pwPh * 6.2831853)
                            : aLimb.z * (0.6 + 0.4 * sin(uTime * 0.55 + aGo.x * 3.1 + pwPh * 6.2831853)) * aGo.w;
  vec2 pwQ = transformed.yz - aLimb.xy; float pwC = cos(pwAng), pwS = sin(pwAng);
  transformed.yz = aLimb.xy + vec2(pwC * pwQ.x - pwS * pwQ.y, pwS * pwQ.x + pwC * pwQ.y);
  transformed.y += 0.035 * aGo.z * abs(sin(pwGo * aGo.y + aGo.x));
}
#endif
`;
const V_PROJECT = /* glsl */`
vec4 mvPosition = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
mvPosition = instanceMatrix * mvPosition;
#endif
vec4 pwW = modelMatrix * mvPosition;
if (aFx.y > 0.) {
  float pwT = dot(pwW.xz, uWind.xy) * 0.42 - uTime * uWind.w * 3.1 + pwW.y * 0.3;
  float pwG = 0.62 + 0.38 * sin(uTime * 0.41 + pwW.x * 0.021 + pwW.z * 0.017);
  vec3 pwD = vec3(uWind.x, 0.22, uWind.y) * (sin(pwT) * 0.5 + sin(pwT * 2.3 + 1.7) * 0.22 + 0.3)
           + vec3(-uWind.y, 0.4, uWind.x) * sin(pwT * 1.63 + pwW.y * 0.9) * 0.34;
  pwW.xyz += pwD * aFx.y * uWind.z * pwG;
}
vWPos = pwW.xyz; vSurf = aFx.z; vPuv = uv;
if (aFx.z > 11.5) vPuv.x = fract(uv.x + fract(sin(dot(pwO.xz, vec2(12.9898, 78.233))) * 43758.5453));   // a lamp's own hour: its window's draw and its house's place
mvPosition = viewMatrix * pwW;
gl_Position = projectionMatrix * mvPosition;
`;
const F_PARS = /* glsl */`
uniform float uTime, uNight, uDusk; uniform vec3 uSunDir, uSunCol, uSkyCol, uHorCol, uGndCol, uShade, uGoldCol;
varying vec3 vWPos; varying float vSurf; varying vec2 vPuv;
float pwH(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float pwN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(pwH(i), pwH(i + vec2(1., 0.)), f.x), mix(pwH(i + vec2(0., 1.)), pwH(i + vec2(1., 1.)), f.x), f.y); }
// the brocade's figure: a lattice of ogees, a quatrefoil in each, a boss at its heart (1 on the gold thread)
float pwBro(vec2 p){
  vec2 c = fract(p * 0.8) - 0.5; float d = abs(c.x) + abs(c.y), r = length(c);
  float lat = smoothstep(0.03, 0.0, abs(d - 0.4) - 0.014);
  float pet = smoothstep(0.03, 0.0, abs(r - 0.17 - 0.06 * cos(4. * atan(c.y, c.x + 1e-5))) - 0.014);
  return clamp(lat + pet + smoothstep(0.075, 0.05, r), 0., 1.);
}
`;
// surface detail: changes the albedo by surface id
const F_SURFACE = /* glsl */`
float pwId = floor(vSurf + 0.5);
float pwEmit = 0., pwThread = 0.;
{
  vec3 a = diffuseColor.rgb; vec2 p = vPuv;
  float pwFw = fwidth(p.x) + fwidth(p.y), pwFine = clamp(1. - pwFw * 9., 0., 1.);
  if (pwId < 0.5) { a *= 0.84 + 0.2 * pwN(p * 0.8 + 3.) + 0.09 * pwN(p * 7.) + 0.1 * (pwN(p * 37.) - 0.5) * pwFine; }
  else if (pwId < 1.5) { a *= (0.93 + 0.07 * sin(p.x * 46.) * sin(p.y * 46.) * pwFine) * (0.9 + 0.14 * pwN(vec2(p.x * 2.6, p.y * 0.4))); }
  else if (pwId < 3.5) {
    a *= 0.9 + 0.14 * pwN(vec2(p.x * 1.5, p.y * 14.));
    if (pwId < 2.5) {                                                  // plate: lames lapping at each ring, a row of rivets under each lap
      float ly = fract(p.y), lap = smoothstep(0.1, 0.0, ly) + smoothstep(0.94, 1.0, ly);
      float rv = smoothstep(0.075, 0.04, length(vec2(fract(p.x * 2.) - 0.5, (ly - 0.2) * 2.)));
      a *= (1. - 0.38 * lap * pwFine) * (0.92 + 0.12 * ly); a = mix(a, a * 1.5 + 0.05, rv * pwFine);
    }
  }
  else if (pwId < 4.5) { float seam = smoothstep(0.03, 0.0, abs(fract(p.x / 0.95) - 0.5) - 0.47); a *= (0.92 + 0.08 * sin(p.y * 60.)) * (1. - 0.3 * seam); }
  else if (pwId < 5.5) { pwEmit = 1.; }
  else if (pwId < 6.5) {
    float g = pwBro(p), g2 = pwBro(p + vec2(0.035, 0.05));             // the figure stands in relief: lit on its upper edge, shaded under it
    float weave = 0.5 + 0.5 * sin(p.x * 70.) * sin(p.y * 70.);
    a *= (0.8 + 0.3 * pwN(p * 0.6)) * (0.9 + 0.14 * pwN(vec2(p.x * 2.2, p.y * 0.35))) * (0.9 + 0.16 * weave * pwFine);
    // the gold figure is fine work inside the field: there when we are near enough to read it, and the one calm colour of the field from further off
    float bro = clamp(1.3 - pwFw * 7., 0., 1.);
    a *= 1. - 0.45 * clamp(g2 - g, 0., 1.) * pwFine;
    a = mix(a, uGoldCol * (0.8 + 0.5 * clamp(g - g2, 0., 1.)), g * 0.85 * bro); pwThread = g * bro; pwEmit = g * 0.12 * bro;
  }
  else if (pwId < 7.5) {
    float row = p.y / 0.42, r0 = floor(row), fy = fract(row), fx = fract(p.x / 0.3 + 0.5 * mod(r0, 2.));
    float t = pwH(vec2(floor(p.x / 0.3 + 0.5 * mod(r0, 2.)), r0));
    a *= (0.7 + 0.3 * smoothstep(0.0, 0.5, fy)) * (0.82 + 0.3 * t) * (0.86 + 0.14 * sin(fx * 3.14159));
  }
  else if (pwId < 8.5) {
    float row = p.y / 0.62, r0 = floor(row), bx = p.x / 1.25 + 0.5 * mod(r0, 2.);
    float t = pwH(vec2(floor(bx), r0)), ex = abs(fract(bx) - 0.5), ey = abs(fract(row) - 0.5);
    float mortar = max(smoothstep(0.46, 0.49, ex), smoothstep(0.43, 0.48, ey));
    a *= (0.84 + 0.26 * t) * (1. - 0.3 * mortar) * (0.94 + 0.1 * pwN(p * 5.));
  }
  else if (pwId < 9.5) { float pl = p.y / 0.26, t = pwH(vec2(floor(pl), 3.)); a *= (0.78 + 0.3 * t) * (1. - 0.35 * smoothstep(0.42, 0.5, abs(fract(pl) - 0.5))) * (0.9 + 0.16 * pwN(vec2(p.x * 1.2, p.y * 30.))); }
  else if (pwId < 10.5) { a *= 0.8 + 0.3 * pwN(p * 9.) ; }
  else if (pwId < 11.5) {
    vec2 c = p / vec2(0.5, 0.62); vec2 i = floor(c), f = abs(fract(c) - 0.5); float t = pwH(i + 11.);
    vec3 pane = t < 0.3 ? vec3(0.03, 0.06, 0.4) : t < 0.55 ? vec3(0.55, 0.02, 0.03) : t < 0.8 ? vec3(0.87, 0.54, 0.03) : vec3(0.03, 0.34, 0.1);
    float lead = max(smoothstep(0.4, 0.46, f.x), smoothstep(0.42, 0.47, f.y));
    float gl = clamp(1.3 - pwFw * 5., 0., 1.);                          // (from far off a window is one deep blue light, not a scatter of panes)
    a = mix(vec3(0.1, 0.14, 0.5), mix(pane, vec3(0.02), lead), gl); pwEmit = mix(0.6, (1. - lead) * 0.7, gl);
  }
  else {                                                               // a window: dark glass where the visit's hour (uDusk, a standing value) is short of this window's own hour, lamplight where it is past it
    float on = smoothstep(p.x * 0.9, p.x * 0.9 + 0.03, uDusk);
    a = mix(vec3(0.03, 0.035, 0.05), a, on); pwEmit = on * 1.3;
  }
  diffuseColor.rgb = a;
}
`;
// back-light and metal, added to the emissive term (world-space)
const F_LIGHT = /* glsl */`
{
  vec3 wN = normalize((vec4(normal, 0.) * viewMatrix).xyz);
  vec3 wV = normalize(cameraPosition - vWPos);
  float ndv = clamp(dot(wN, wV), 0., 1.), fres = pow(clamp(1. - ndv, 0., 1.), 3.);
  float toSun = clamp(dot(-wV, uSunDir) * 0.5 + 0.5, 0., 1.);
  float side = smoothstep(-3., 3., vWPos.x);
  vec3 rim = uSunCol * fres * (0.2 + 0.8 * toSun * toSun) * 0.5 * clamp(wN.y * 0.5 + 0.75, 0., 1.);
  totalEmissiveRadiance += rim * mix(diffuseColor.rgb, vec3(1.), 0.3);
  float nl = dot(wN, uSunDir);
  if ((pwId > 0.5 && pwId < 1.5) || (pwId > 3.5 && pwId < 4.5)) totalEmissiveRadiance += uSunCol * diffuseColor.rgb * clamp(-nl, 0., 1.) * 0.4;
  if (pwId > 1.5 && pwId < 3.5) {
    vec3 R = reflect(-wV, wN);
    vec3 env = mix(uGndCol, uHorCol, smoothstep(-0.35, 0.04, R.y)); env = mix(env, uSkyCol, smoothstep(0.04, 0.75, R.y));
    float sd = clamp(dot(R, uSunDir), 0., 1.);
    env += uSunCol * (pow(clamp(sd, 0., 1.), 28.) * 1.5 + pow(clamp(sd, 0., 1.), 4.) * 0.3);
    totalEmissiveRadiance += env * diffuseColor.rgb * (pwId > 2.5 ? 1.0 : 0.72);
    if (pwId < 2.5) totalEmissiveRadiance += uSunCol * (pow(clamp(sd, 0., 1.), 16.) * 0.5 + fres * 0.12 * toSun);   // dark steel keeps a sheen of its own that catches the low sun
    diffuseColor.rgb *= 0.35;
  }
  if (pwId > 5.5 && pwId < 6.5) {                                      // brocade: a sheen along the nap, the gold thread catching the low sun
    vec3 R = reflect(-wV, wN); float sd = clamp(dot(R, uSunDir), 0., 1.);
    totalEmissiveRadiance += diffuseColor.rgb * uSunCol * (0.22 * fres + pwThread * (0.5 * pow(clamp(sd, 0., 1.), 6.) + 0.12));
  }
  if (pwId > 9.5 && pwId < 10.5) {                                    // wool, straw, leaves: shade under the mass, the low sun through its edge
    diffuseColor.rgb *= mix(0.5, 1., smoothstep(-0.7, 0.25, wN.y));
    totalEmissiveRadiance += uSunCol * diffuseColor.rgb * (0.3 * clamp(-nl, 0., 1.) + 0.5 * fres * toSun);
  }
  totalEmissiveRadiance += diffuseColor.rgb * pwEmit * (1.6 + 2.6 * uNight);
  totalEmissiveRadiance += diffuseColor.rgb * uNight * 0.35 * side;
}
`;
const F_SHADE = /* glsl */`
reflectedLight.indirectDiffuse += diffuseColor.rgb * uShade * smoothstep(-3., 3., vWPos.x);
`;

// THE WIND BLOWS IN GUSTS OF ITS OWN ON THE WORLD CLOCK: one function of the clock, right at any second, the same for a visitor who
// stands still. at(time) is its strength: 1 between gusts to 1.9 in one (two slow swells, of 37 and of 13.7 seconds). spin(time) is
// the turn the sails have made since the clock's nought, in seconds of turning at the mean wind: its rate goes with the wind, a third
// faster at the gust's height and a third slower in the lull (the swells' own integrals, so nothing is latched). WHERE EACH SWELL IS AT
// THE CLOCK'S NOUGHT IS DRAWN FOR THE VISIT, on the stream the world hands in (two draws, anywhere round): a visit may begin in a lull
// or in a gust. (With no stream handed in, as for the hero, the two phases are 0.6 and 2.1.)
export const WIND = { mean: 1.45, a: [0.33, 0.12], w: [0.17, 0.46], spin: 0.33 };
export const makeWindOf = (rng) => {
  const ph = rng ? [rng() * TAU, rng() * TAU] : [0.6, 2.1];
  return { ph,
    at: (t) => WIND.mean + WIND.a[0] * Math.sin(WIND.w[0] * t + ph[0]) + WIND.a[1] * Math.sin(WIND.w[1] * t + ph[1]),
    spin: (t) => { let k = 0; for (let i = 0; i < 2; i++) k += WIND.a[i] / WIND.w[i] * (Math.cos(ph[i]) - Math.cos(WIND.w[i] * t + ph[i])); return t + WIND.spin / (WIND.a[0] + WIND.a[1]) * k; } };
};

export function makeUniforms() {
  return {
    uTime: { value: 0 }, uSpin: { value: 0 }, uLock: { value: 0.35 }, uElbow: { value: SK.elbow }, uHub: { value: new THREE.Vector3(0, SK.hubY, SK.hubZ) },
    uWind: { value: new THREE.Vector4(0.94, -0.34, 1, 1) }, uNight: { value: 0 }, uDusk: { value: 0 }, uLamp: { value: 1 },
    uSunDir: { value: new THREE.Vector3(0, 0.16, -1).normalize() }, uSunCol: { value: new THREE.Color(1.0, 0.72, 0.42) },
    uSkyCol: { value: new THREE.Color(0.2, 0.34, 0.7) }, uHorCol: { value: new THREE.Color(0.95, 0.7, 0.42) }, uGndCol: { value: new THREE.Color(0.3, 0.25, 0.16) },
    uShade: { value: new THREE.Color(0.03, 0.05, 0.2) }, uGoldCol: { value: new THREE.Color(PAL.gold[0], PAL.gold[1], PAL.gold[2]) },
  };
}

// o: { spin, limb, double }. One program per combination; all share the uniform objects in U.
export function makeMannerMaterial(U, o = {}) {
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: o.double ? THREE.DoubleSide : THREE.FrontSide });
  mat.defines = {}; if (o.spin) mat.defines.PW_SPIN = ''; if (o.limb) mat.defines.PW_LIMB = '';
  mat.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\n' + V_PARS)
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n' + V_ORIGIN + V_ANGLE + V_NORMAL)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + V_POS)
      .replace('#include <project_vertex>', V_PROJECT);
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\n' + F_PARS)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + F_SURFACE)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + F_LIGHT)
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + F_SHADE);
  };
  mat.customProgramCacheKey = () => 'pw2s-manner' + (o.spin ? 's' : '') + (o.limb ? 'l' : '') + (o.double ? 'd' : '');
  return mat;
}
// depth materials for the shadow map: the sails' and arms' shadows turn with them. o.spin: for the pairs.
export function makeDepthMaterial(U, o = {}) {
  const mat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  mat.defines = {}; if (o.spin) mat.defines.PW_SPIN = '';
  mat.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\n#ifdef PW_SPIN\nattribute vec4 aFx; attribute vec4 aPair; uniform float uSpin, uLock, uElbow; uniform vec3 uHub;\nvec2 pwRot(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }\n#endif\n')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + V_ANGLE + V_POS.replace(/#ifdef PW_LIMB[\s\S]*?#endif/, ''));
  };
  mat.customProgramCacheKey = () => 'pw2s-depth' + (o.spin ? '-spin' : '');
  return mat;
}
export const makeSpinDepthMaterial = (U) => makeDepthMaterial(U, { spin: true });

// ---------------------------------------------------------------- the windmill and the giant (one skeleton)
// a small panel lying on a round wall: centre angle a (0 = +Z), radius r
function wallQuad(g, a, r, y0, y1, w, o) {
  const cx = Math.sin(a) * r, cz = Math.cos(a) * r, tx = Math.cos(a) * w / 2, tz = -Math.sin(a) * w / 2;
  return g.quad([cx - tx, y0, cz - tz], [cx + tx, y0, cz + tz], [cx + tx, y1, cz + tz], [cx - tx, y1, cz - tz], o);
}

// (built in steps like the giant: a pause after the tower, after the cap and tail, after the sails, so that no stretch of the build is long)
export function millGeometry(o = {}) { const it = millSteps(o); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
export function* millSteps(o = {}) {
  const d = o.detail ?? 1, g = new Geo(), S = SK, P = PAL, segs = d ? 22 : 8, zs = S.hubZ + 0.45;
  const rAt = (y) => lerp(S.rBase, S.rTop, clamp(y / S.H, 0, 1));
  const white = mulc(P.white, 0.84), stain = mixc(white, mulc(P.dust, 0.8), 0.55), timber = mulc(P.timber, 0.75), dark = [0.035, 0.03, 0.026];
  // stone plinth, whitewashed tower stained by dust toward its foot
  g.surf(MAT.STONE).color(P.stone, 0.75).lathe([[S.rBase + 0.42, 0], [S.rBase + 0.34, 1.0], [S.rBase + 0.02, 1.08]], { segs, su: 26, sv: 1.2 });
  g.surf(MAT.PLAIN).lathe([[rAt(1), 1.0, stain], [rAt(3.2), 3.2, mixc(stain, white, 0.6)], [rAt(8), 8, white], [S.rTop, S.H, white], [S.rTop + 0.12, S.H + 0.05, mulc(white, 0.9)]], { segs, su: 24, sv: 14 });
  // door toward +X, little windows under the cap
  g.surf(MAT.STONE).color(P.stone, 0.62); wallQuad(g, Math.PI / 2, rAt(2) + 0.05, 0.9, 3.9, 2.3);
  g.surf(MAT.PLANK).color(timber, 0.9); wallQuad(g, Math.PI / 2, rAt(2) + 0.09, 1.0, 3.6, 1.7);
  g.surf(MAT.PLAIN).color(dark);
  for (let i = 0, n = d ? 8 : 4; i < n; i++) wallQuad(g, (i + 0.5) / n * TAU, rAt(S.H - 1.5) + 0.04, S.H - 2.1, S.H - 1.3, 0.62);
  if (d) { wallQuad(g, 0.5, rAt(7) + 0.04, 6.4, 7.5, 0.7); wallQuad(g, -1.9, rAt(5) + 0.04, 4.6, 5.6, 0.7); }
  if (d) {
    g.surf(MAT.STONE).color(P.stone, 0.7).box(rAt(1) + 0.1, 0, -1.3, rAt(1) + 1.5, 0.5, 1.3).box(rAt(1) + 0.1, 0.5, -1.1, rAt(1) + 0.85, 0.95, 1.1);
    const yG = 9.3, rG = rAt(yG), a0 = 1.02, a1 = TAU - 1.02, plank = mulc(timber, 0.95);
    g.surf(MAT.PLANK).color(plank).lathe([[rG + 0.02, yG], [rG + 1.15, yG], [rG + 1.15, yG + 0.14], [rG + 0.02, yG + 0.14]], { segs: 18, a0, a1, flat: true, su: 20, sv: 1 });
    g.lathe([[rG + 1.15, yG - 0.12], [rG + 0.02, yG - 0.12]], { segs: 18, a0, a1, su: 20, sv: 1 });
    g.color(timber, 0.8).lathe([[rG + 1.1, yG + 1.0], [rG + 1.18, yG + 1.0], [rG + 1.18, yG + 1.12], [rG + 1.1, yG + 1.12]], { segs: 18, a0, a1, flat: true, su: 20, sv: 0.3 });
    for (let i = 0; i <= 14; i++) { const a = lerp(a0, a1, i / 14), sx = Math.sin(a), cz = Math.cos(a); g.beam([sx * (rG + 1.12), yG + 0.1, cz * (rG + 1.12)], [sx * (rG + 1.12), yG + 1.05, cz * (rG + 1.12)], 0.1, 0.1, { caps: false }); if (i % 2 === 0) g.beam([sx * (rAt(yG - 1.5) + 0.02), yG - 1.5, cz * (rAt(yG - 1.5) + 0.02)], [sx * (rG + 1.0), yG - 0.1, cz * (rG + 1.0)], 0.13, 0.13, { caps: false }); }
    const L0 = [-4.9, 0, -5.6], L1 = [-Math.sin(2.3) * (rG + 1.2), yG + 0.9, Math.cos(2.3) * (rG + 1.2)];        // the ladder, from the ground behind the tower (the side away from the door) up to the gallery
    for (const o of [-0.34, 0.34]) g.beam([L0[0] + o * 0.75, L0[1], L0[2] - o * 0.66], [L1[0] + o * 0.75, L1[1], L1[2] - o * 0.66], 0.1, 0.12, { caps: false });
    for (let i = 1; i < 15; i++) { const t = i / 15, x = lerp(L0[0], L1[0], t), y = lerp(L0[1], L1[1], t), z = lerp(L0[2], L1[2], t); g.beam([x - 0.255, y, z + 0.224], [x + 0.255, y, z - 0.224], 0.07, 0.07, { caps: false }); }
  }
  yield;
  // the cap: dark boards, a small dormer where the windshaft comes out
  g.surf(MAT.PLANK).color(timber, 0.62).lathe([[S.capR + 0.3, S.H - 0.1], [S.capR * 0.62, S.H + S.capH * 0.42], [S.capR * 0.3, S.H + S.capH * 0.76], [0.1, S.H + S.capH]], { segs, su: 26, sv: 7 });
  g.color(timber, 0.7).box(-1.0, S.hubY - 1.0, 2.2, 1.0, S.hubY + 0.95, S.hubZ - 0.4);
  if (d) { g.surf(MAT.STEEL).color(P.steel, 0.5).beam([0, S.H + S.capH - 0.1, 0], [0, S.H + S.capH + 1.3, 0], 0.09, 0.09); g.tri([0, S.H + S.capH + 1.25, 0], [0, S.H + S.capH + 0.75, -0.9], [0, S.H + S.capH + 0.6, 0], { both: true }); }
  // tail pole from the back of the cap to the ground, two stays, a post
  g.surf(MAT.PLANK).color(timber, 0.85).beam([0, S.tailY, -2.6], [0, 0.45, S.tailZ], 0.36, 0.36);
  for (const sx of [-1, 1]) g.beam([sx * 2.7, S.H + 0.5, -2.0], [0, 8.4, -7.6], 0.16, 0.16, { caps: false });
  g.color(P.stone, 0.7).surf(MAT.STONE).cbox(0, 0, S.tailZ - 0.3, 0.6, 1.0, 0.6);
  yield;
  // windshaft, hub and four sails (turning)
  g.spin = 1;
  g.surf(MAT.PLANK).color(timber, 0.8).beam([0, S.hubY, S.hubZ - 1.4], [0, S.hubY, zs + 0.5], 0.62, 0.62);
  g.color(timber, 0.6).cbox(0, S.hubY - 0.55, zs, 1.1, 1.1, 0.5);
  const cover = [1, 0.62, 1, 0.8], nb = d ? 13 : 0, canvas = mulc(P.canvas, 0.86);
  for (let k = 0; k < 4; k++) {
    g.rotZ(k * Math.PI / 2, 0, S.hubY);
    const y0 = S.hubY - S.sailW / 2, y1 = S.hubY + S.sailW / 2;
    g.surf(MAT.PLANK).color(timber, 0.8).beam([0.3, S.hubY, zs], [S.sailR, S.hubY, zs], 0.26, 0.24, { taper: 0.6 });
    g.color(timber, 0.95);
    g.beam([S.sail0, y0, zs], [S.sailR - 0.1, y0, zs], 0.11, 0.11, { caps: false }); g.beam([S.sail0, y1, zs], [S.sailR - 0.1, y1, zs], 0.11, 0.11, { caps: false });
    g.beam([S.sail0, y0, zs], [S.sail0, y1, zs], 0.11, 0.11, { caps: false }); g.beam([S.sailR - 0.1, y0, zs], [S.sailR - 0.1, y1, zs], 0.11, 0.11, { caps: false });
    for (let i = 1; i < nb; i++) { const x = lerp(S.sail0, S.sailR - 0.1, i / nb); g.beam([x, y0, zs], [x, y1, zs], 0.07, 0.07, { caps: false }); }
    if (d) { g.beam([S.sail0, S.hubY - S.sailW * 0.25, zs], [S.sailR - 0.1, S.hubY - S.sailW * 0.25, zs], 0.06, 0.06, { caps: false }); g.beam([S.sail0, S.hubY + S.sailW * 0.25, zs], [S.sailR - 0.1, S.hubY + S.sailW * 0.25, zs], 0.06, 0.06, { caps: false }); }
    // canvas set on the lattice, a little furled on two of the sails
    const xa = lerp(S.sailR - 0.3, S.sail0 + 0.2, cover[k]), xb = S.sailR - 0.3, nq = d ? 5 : 2;
    g.surf(MAT.CANVAS).color(canvas);
    g.grid(nq, 2, (u, v) => [lerp(xa, xb, u), lerp(y0 + 0.1, lerp(y0, y1, 0.68), v), zs + 0.16 + 0.2 * Math.sin(u * Math.PI) * Math.sin(v * Math.PI), 0.18 * Math.sin(v * Math.PI)], { both: true, su: xb - xa, sv: S.sailW });
    g.pop();
    if (k === 1) yield;
  }
  g.spin = 0;
  yield;
  return g.toGeometry({ pad: 2 });
}

// The giant: built on the mill's skeleton and exactly as tall (helm's crest at the cap's point, an upraised hand at the sail's tip), but with the build of
// something vast: a small helmed head (an eighth of its standing height), long legs planted apart, a deep chest, and four long slender arms that taper
// like sails and turn with them. Plate that laps, dark steel, gold only as trim, a deep blue surcoat to the calves and a dull red cloak whose train is
// the mill's tail pole; dust on the legs; a face in the helm's shadow.
// (built in steps: a pause after the legs, the trunk, the cloak, each arm and before the geometry is packed, so that no stretch of the build is long)
// The STRIDING make (o.stride) is the same giant on the same skeleton, caught in mid-stride: its left leg trails far behind, knee bent, the heel up
// and the toe still on the ground; the surcoat is swept back between the legs and the cloak is lifted and flies.
// THE WHEEL OF ARMS TURNS CLEAR OF THE BODY AT EVERY PHASE: it turns in the plane WHEEL_Z before the giant's axis (7.2 m: 2.9 m before the hub on
// his breast), on an axle that comes out through a round shield he wears on the breast; nothing of his body, his armour or his cloth (with
// the most the wind carries it) comes within three tenths of a metre of that plane's arms and of what they hold, whichever way they stand: clearOfWheel(geometry) measures it.
export const WHEEL_Z = SK.hubZ + 2.9;
export function clearOfWheel(geometry, rings = 2) {
  // (the wind carries a vertex of cloth as far as two and a half times its own weight, body and wheel the same way at one time: the least gap
  // is taken with the wind full toward the wheel and full away from it; the axle, within 1.3 m of the hub, comes through the shield)
  // The wheel sweeps rings about the hub: what is compared is the body's foremost point and the wheel's hindmost within the same half metre
  // of radius from the hub and the rings either side of it: two for the giant (a forearm folds in the wheel's own plane by as much as a quarter
  // of a radian about its elbow: what hangs from it changes its radius by under a metre and keeps its depth), one for a mill, whose sails are stiff.
  const p = geometry.attributes.position, fx = geometry.attributes.aFx, N = 40; let gap = 1e9;
  for (const d of [-2.5, 2.5]) { const body = new Float32Array(N).fill(-1e9), wheel = new Float32Array(N).fill(1e9);
    for (let i = 0; i < p.count; i++) { const k = fx.getX(i), z = p.getZ(i) + d * fx.getY(i), r = Math.hypot(p.getX(i), p.getY(i) - SK.hubY), b = Math.min(N - 1, Math.floor(r * 2));
      if (k < 0.5) body[b] = Math.max(body[b], z); else if (r > 1.3) wheel[b] = Math.min(wheel[b], z); }
    for (let b = 0; b < N; b++) for (let c = Math.max(b - rings, 0); c <= Math.min(b + rings, N - 1); c++) gap = Math.min(gap, wheel[b] - body[c]); }
  return gap;
}
export function* giantSteps(o = {}) {
  const d = o.detail ?? 1, g = new Geo(), S = SK, P = PAL, zs = WHEEL_Z, as = d ? 8 : 4, seg = d ? 14 : 6, z0 = 2.6, st = o.stride ? 1 : 0;
  const steel = mulc(mixc(P.steel, [0.3, 0.34, 0.46], 0.5), 0.62), steelD = mulc(steel, 0.72), steelL = mulc(P.silver, 0.7), gold = mulc(P.gold, 0.8);
  const blue = mixc(mulc(P.ultra, 0.62), [0.05, 0.07, 0.16], 0.35), red = mulc(P.verm, 0.55), dark = [0.012, 0.012, 0.03], dustc = mulc(P.dust, 0.5);
  const dusty = (c, k) => mixc(c, dustc, k);
  // legs: cuisse, knee, greave, sabaton; the dust of the plain to above the knee
  for (const sx of [-1, 1]) {
    const back = st > 0 && sx < 0;
    const Hp = [sx * 1.6, 10.7, z0], K = back ? [sx * 2.3, 6.4, z0 - 2.4] : [sx * 2.55, 5.8, z0 + 0.6], A = back ? [sx * 2.6, 2.4, z0 - 5.2] : [sx * 3.1, 1.0, z0 - 0.1];
    g.surf(MAT.STEEL).color(dusty(steel, 0.12)).tube([Hp, back ? [lerp(Hp[0], K[0], 0.5), 8.7, z0 - 0.9] : [lerp(Hp[0], K[0], 0.5), 8.3, z0 + 0.45], K], [1.5, 1.34, 1.0], { segs: as });
    g.color(dusty(steelL, 0.3)).ball(K[0], K[1], K[2] + 0.25, 1.08, 1.15, 1.1, { nu: as, nv: d ? 4 : 2 });
    g.color(dusty(steel, 0.42)).tube([K, back ? [lerp(K[0], A[0], 0.45), 4.7, z0 - 3.5] : [lerp(K[0], A[0], 0.45), 3.7, z0 + 0.05], A], [0.98, 1.06, 0.62], { segs: as });
    if (back) g.color(dusty(steelD, 0.6)).tube([A, [sx * 2.7, 1.3, z0 - 5.1], [sx * 2.75, 0.27, z0 - 4.3]], [0.66, 0.8, 0.42], { segs: as });
    else g.color(dusty(steelD, 0.6)).ball(sx * 3.15, 0.15, z0 + 0.95, 0.9, 0.62, 2.0, { nu: as, nv: d ? 4 : 2, v0: 0.42 });
    if (d) { g.surf(MAT.GOLD).color(dusty(gold, 0.3)).tube([[K[0], K[1] - 0.95, K[2] + 0.1], [K[0], K[1] - 0.75, K[2] + 0.1]], [1.04, 1.06], { segs: as }); }
  }
  yield;
  // the fauld: three lames that lap downward over the hips; the belt a line of gold
  for (let i = 0; i < 3; i++) { const yt = 11.7 - i * 0.78, rt = 2.3 + 0.2 * i; g.surf(MAT.STEEL).color(i % 2 ? steelD : steel).lathe([[rt + 0.34, yt - 1.0], [rt, yt]], { segs: seg, cz: z0 + 0.15, sx: 1.32, sz: 0.98, su: 12, sv: 0.9 }); }
  g.surf(MAT.GOLD).color(gold).lathe([[2.36, 11.6], [2.42, 11.82], [2.3, 12.0]], { segs: seg, cz: z0 + 0.15, sx: 1.3, sz: 0.96 });
  // the surcoat: two long panels of deep blue from the belt to the calves, open at the sides over the legs; they move in the wind
  // (the front panel hangs close and moves little: the wheel of arms turns before it; the back one flies)
  for (const [zf, sgn] of [[z0 + 2.2, 1], [z0 - 2.25, -1]]) {
    const fl = sgn > 0 ? 0.3 : 0.75, rip = sgn > 0 ? 0.2 : 0.35;
    g.surf(MAT.CLOTH).grid(d ? 5 : 2, d ? 7 : 3, (u, v) => [(u - 0.5) * lerp(3.5, 5.0, v) * (sgn > 0 ? 1 : -1), lerp(11.5, 3.5 + 1.2 * st, v) + 0.25 * Math.abs(u - 0.5) * v, zf + sgn * (fl * v + rip * Math.sin(u * 9.4) * v) - st * (sgn > 0 ? 2.6 : 3.4) * v * v, sgn > 0 ? 0.08 * v + 0.12 * v * v : 0.15 * v + 1.0 * v * v, v > 0.9 ? gold : blue], { both: true, su: 4, sv: 8 });
  }
  yield;
  // cuirass: a deep chest, plates lapping from the waist up; a plackart over its lower half; gorget
  const cu = { segs: seg, cz: z0 + 0.3, sx: 1.3, sz: 0.95 };
  g.surf(MAT.STEEL).color(steel).lathe([[2.25, 11.5], [2.5, 12.5], [2.98, 13.8], [3.12, 15.0], [2.9, 16.0], [2.1, 16.85], [1.05, 17.35]], { ...cu, su: 12, sv: 6 });
  if (d) g.color(steelD).lathe([[2.32, 11.45], [2.6, 12.5], [3.0, 13.4]], { ...cu, su: 12, sv: 2 });
  g.surf(MAT.GOLD).color(gold).lathe([[1.08, 17.3], [1.24, 17.55]], { segs: seg, cz: z0 + 0.3 });
  // pauldrons: lames lapping down the shoulder
  for (const sx of [-1, 1]) for (let i = d ? 2 : 1; i >= 0; i--) g.surf(MAT.STEEL).color(i % 2 ? steel : steelL).ball(sx * (3.7 + 0.22 * i), 16.45 - 0.62 * i, z0 + 0.25, 1.7 + 0.16 * i, 1.05, 1.95 + 0.12 * i, { nu: d ? 10 : 5, nv: d ? 4 : 2, v0: 0.4 });
  // the helm: a barbute open in front, a face inside it in shadow; a comb and a plume that streams behind (the helm's crest is at the cap's point)
  const hz = z0 + 0.4, hopen = 0.52;
  g.surf(MAT.STEEL).color(steelL).lathe([[1.0, 17.35], [1.2, 17.9], [1.28, 18.75]], { segs: d ? 10 : 5, a0: hopen, a1: TAU - hopen, cz: hz, sz: 1.08, su: 6, sv: 1.4 });
  g.lathe([[1.28, 18.75], [1.2, 19.3], [0.74, 19.9], [0.1, 20.2]], { segs: d ? 10 : 5, cz: hz, sz: 1.08, su: 6, sv: 1.5 });
  g.surf(MAT.PLAIN).color([0.05, 0.035, 0.028]).ball(0, 18.1, hz + 0.3, 0.86, 0.95, 0.8, { nu: d ? 8 : 4, nv: d ? 5 : 3 });
  if (d) {
    g.color([0.075, 0.05, 0.04]).beam([0, 18.42, hz + 1.02], [0, 17.98, hz + 1.2], 0.2, 0.2, { taper: 1.4 });               // a nose, a brow, in the dark of the helm
    g.color([0.03, 0.022, 0.02]).box(-0.5, 18.42, hz + 0.9, 0.5, 18.56, hz + 1.1);
    g.surf(MAT.GOLD).color(gold).beam([0, 18.8, hz + 1.36], [0, 20.25, hz + 0.1], 0.12, 0.16);
    g.lathe([[1.3, 18.68], [1.33, 18.84]], { segs: 10, cz: hz, sz: 1.08 });
  }
  g.surf(MAT.CLOTH).color(red, 1.25).grid(d ? 6 : 3, 2, (u, v) => [(v - 0.5) * (0.3 + 1.5 * Math.sin(u * 2.6)), 20.1 + 1.5 * Math.sin(u * 2.4) - 2.2 * u * u + (S.H + S.capH - 20.6) * Math.sin(u * 3.1), hz - 0.3 - 5.6 * u, 0.2 + 1.3 * u], { both: true, su: 5, sv: 1.5 });
  yield;
  // the cloak: from the shoulders down the back and away behind in the wind to the ground where the mill's tail pole stands
  const cl = (u, v, off) => {
    const w = lerp(6.6, 3.0, smoothstep(0.1, 0.95, v)), x = (u - 0.5) * w, e = Math.abs(u - 0.5) * 2;
    const fold = d ? 0.4 * Math.sin(u * TAU * 3.5) * (0.25 + 0.75 * v) * (1 - 0.6 * smoothstep(0.85, 1, v)) : 0;
    const lift = st * (6.2 + 1.5 * Math.sin(v * 7.5 + u * 1.6) * v);
    return [x, 0.14 + lift * smoothstep(0, 0.5, v) + (16.5 - lift) * Math.pow(1 - v, 1.9 - 0.6 * st) - off * (1 - v) + 0.12 * fold * v, z0 - 2.0 - (Math.abs(S.tailZ) + z0 - 2.0) * Math.pow(v, 2.2) + 1.8 * e * e * (1 - v) + off + fold, (0.1 + 0.9 * v) * (1 - 0.7 * smoothstep(0.82, 1, v))];
  };
  g.surf(MAT.CLOTH).color(red).grid(d ? 12 : 2, d ? 10 : 4, (u, v) => cl(u, v, 0), { su: 9, sv: 20 });
  g.color(red, 0.55).grid(d ? 12 : 1, d ? 10 : 3, (u, v) => cl(u, v, 0.06), { flip: true, su: 9, sv: 20 });
  if (d) g.surf(MAT.GOLD).color(gold).grid(12, 1, (u, v) => { const q = cl(u, 0.97 + 0.03 * v, 0.03); return [q[0], q[1] + 0.02, q[2], q[3]]; }, { both: true, su: 9, sv: 0.4 });
  yield;
  // ------------------------------------------------ the wheel of arms (the mill's sails): a boss on the breast and four long arms, slender, tapering
  // THE SHIELD on his breast: a round targe 5.4 m across, quartered blue and red, rimmed and bossed with gold; it does not turn. The axle of
  // the wheel comes out through its boss.
  { const zsh = S.hubZ + 1.5, R = 2.7, nq = d ? 6 : 3;
    g.push(new THREE.Matrix4().makeTranslation(0, S.hubY, zsh).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)));
    for (let q = 0; q < 4; q++) g.surf(MAT.BROCADE).color(q % 2 ? red : blue, 1.3).lathe([[R, -0.12], [R * 0.6, 0.12], [0.9, 0.2]], { segs: nq, a0: q * TAU / 4, a1: (q + 1) * TAU / 4, su: 4, sv: 3 });
    g.surf(MAT.GOLD).color(gold).lathe([[R, -0.3], [R + 0.16, -0.12], [R, 0.0], [R - 0.2, -0.06]], { segs: nq * 4 });
    g.surf(MAT.STEEL).color(steelD).lathe([[1.6, -1.4], [R, -0.3]], { segs: nq * 4 });
    g.pop(); }
  g.spin = 1;
  // (the axle and its boss: they turn with the arms)
  g.push(new THREE.Matrix4().makeTranslation(0, S.hubY, 0).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)));
  g.surf(MAT.STEEL).color(steelD).lathe([[0.95, S.hubZ + 1.6], [0.8, zs - 0.5]], { segs: d ? 10 : 5 });
  g.pop();
  g.surf(MAT.GOLD).color(gold).ball(0, S.hubY, zs, 1.3, 1.3, 1.0, { nu: d ? 12 : 6, nv: d ? 5 : 3 });
  if (d) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beam([Math.cos(a) * 1.1, S.hubY + Math.sin(a) * 1.1, zs + 0.5], [Math.cos(a) * 1.9, S.hubY + Math.sin(a) * 1.9, zs + 0.5], 0.42, 0.2, { taper: 0.1, up: [0, 0, 1] }); }
  for (let k = 0; k < 4; k++) {
    g.rotZ(k * Math.PI / 2, 0, S.hubY); g.arm = k + 1;
    const Y = S.hubY, far = 12.2;
    g.spin = 1;
    g.surf(MAT.STEEL).color(steel).tube(d ? [[0.9, Y, zs], [2.6, Y + 0.14, zs], [4.6, Y + 0.12, zs], [S.elbow, Y, zs]] : [[0.9, Y, zs], [3.6, Y + 0.14, zs], [S.elbow, Y, zs]], d ? [0.98, 0.9, 0.78, 0.66] : [0.98, 0.86, 0.66], { segs: as });
    g.color(steelL).ball(S.elbow, Y, zs, 0.84, 0.84, 0.84, { nu: d ? as : 4, nv: d ? 4 : 2 });
    if (d) {
      g.surf(MAT.GOLD).color(gold).tube([[2.0, Y + 0.1, zs], [2.2, Y + 0.12, zs]], [0.97, 0.96], { segs: as });
      for (const s of [-1, 1]) g.surf(MAT.CLOTH).grid(1, 3, (u, v) => [S.elbow - 0.25 + u * 0.5 + s * 0.2, Y - 0.7 - 2.6 * v, zs + 0.35 + s * 0.25, 0.15 + 0.3 * v, s > 0 ? blue : red], { both: true, su: 0.5, sv: 2.6 });
    }
    g.spin = 2;
    g.surf(MAT.STEEL).color(steel).tube(d ? [[S.elbow, Y, zs], [8.2, Y - 0.1, zs], [10.2, Y - 0.08, zs], [far - 0.6, Y, zs]] : [[S.elbow, Y, zs], [9.0, Y - 0.1, zs], [far - 0.6, Y, zs]], d ? [0.64, 0.7, 0.56, 0.44] : [0.64, 0.66, 0.44], { segs: as });
    g.color(steelL).tube([[far - 0.9, Y, zs], [far - 0.2, Y, zs]], [0.5, 0.74], { segs: as });
    if (d) g.surf(MAT.GOLD).color(gold).tube([[far - 1.05, Y, zs], [far - 0.9, Y, zs]], [0.52, 0.52], { segs: as });
    if (k === 0) {                                                    // an open hand, reaching
      g.surf(MAT.STEEL).color(steelL).box(far - 0.3, Y - 0.62, zs - 0.3, far + 0.6, Y + 0.62, zs + 0.3, { bottom: true });
      for (let f = 0; f < 4; f++) { const fy = Y - 0.48 + f * 0.32; g.beam([far + 0.55, fy, zs], [S.sailR, fy + (f - 1.5) * 0.24, zs + 0.45], 0.28, 0.26, { taper: 0.6 }); }
      g.beam([far, Y + 0.6, zs], [far + 0.8, Y + 1.35, zs + 0.25], 0.3, 0.28, { taper: 0.65 });
    } else {
      g.surf(MAT.STEEL).color(steelL).ball(far + 0.25, Y, zs, 0.7, 0.66, 0.66, { nu: d ? as : 4, nv: d ? 4 : 2 });
      if (k === 1) {                                                  // a sword
        g.surf(MAT.GOLD).color(gold).beam([far + 0.25, Y - 1.2, zs], [far + 0.25, Y + 0.8, zs], 0.24, 0.24);
        g.beam([far - 0.85, Y + 0.85, zs], [far + 1.35, Y + 0.85, zs], 0.26, 0.26);
        g.surf(MAT.STEEL).color(steelL).beam([far + 0.25, Y + 0.95, zs], [far + 0.25, Y + 7.4, zs], 0.62, 0.12, { taper: 0.12, up: [0, 0, 1] });
      } else if (k === 2) {                                           // a mace
        g.surf(MAT.PLANK).color(PAL.timber, 0.6).beam([far + 0.25, Y - 1.2, zs], [far + 0.25, Y + 4.6, zs], 0.26, 0.26);
        g.surf(MAT.STEEL).color(steelD).ball(far + 0.25, Y + 5.1, zs, 0.9, 0.9, 0.9, { nu: d ? as : 4, nv: d ? 4 : 2 });
        if (d) for (let f = 0; f < 6; f++) { const a = f / 6 * TAU; g.color(steelL).beam([far + 0.25 + Math.cos(a) * 0.7, Y + 5.1, zs + Math.sin(a) * 0.7], [far + 0.25 + Math.cos(a) * 1.4, Y + 5.1, zs + Math.sin(a) * 1.4], 0.26, 0.7, { taper: 0.2 }); }
      } else {                                                        // a banner on a staff
        g.surf(MAT.PLANK).color(PAL.timber, 0.7).beam([far + 0.25, Y - 1.4, zs], [far + 0.25, Y + 7.6, zs], 0.36, 0.36, { taper: 0.6 });
        if (d) g.surf(MAT.GOLD).color(gold).ball(far + 0.25, Y + 7.8, zs, 0.24, 0.36, 0.24, { nu: 5, nv: 3 });
        g.surf(MAT.CLOTH);
        g.grid(d ? 6 : 2, 2, (u, v) => [far + 0.15 - 5.2 * u, Y + 3.8 + 3.6 * v - (v - 0.5) * 1.4 * u * u, zs + 0.5 + 0.3 * Math.sin(u * 5), 0.4 * u, v < 0.5 ? red : blue], { both: true, su: 5, sv: 3.6 });
      }
    }
    g.arm = 0; g.spin = 1; g.pop();
    yield;
  }
  g.spin = 0;
  yield;
  return g.toGeometry({ pad: 2 });
}
export function giantGeometry(o = {}) { const it = giantSteps(o); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
// THE PLAINEST MAKES, for the pairs of the plain that stand far from every place of our line (the world says how far): the same skeleton, the
// same heights, the same turning sails and arms on the same hub, in the fewest faces that keep the outline. A mill: tower, cap, tail pole, four
// sails each a stock and its cloth. A giant: two legs, the surcoat's front, the trunk, shoulders, helm and plume, the cloak, four arms of two
// lengths with what each hand holds.
export function farMillGeometry() {
  const g = new Geo(), S = SK, P = PAL, zs = S.hubZ + 0.45, white = mulc(P.white, 0.84), stain = mixc(white, mulc(P.dust, 0.8), 0.55), timber = mulc(P.timber, 0.75);
  g.surf(MAT.PLAIN).lathe([[S.rBase + 0.3, 0, stain], [lerp(S.rBase, S.rTop, 0.25), 0.25 * S.H, mixc(stain, white, 0.7)], [S.rTop, S.H, white]], { segs: 6 });
  g.surf(MAT.PLANK).color(timber, 0.62).lathe([[S.capR + 0.3, S.H - 0.1], [S.capR * 0.5, S.H + S.capH * 0.55], [0.1, S.H + S.capH]], { segs: 6 });
  g.color(timber, 0.85).beam([0, S.tailY, -2.6], [0, 0.45, S.tailZ], 0.4, 0.4, { caps: false });
  g.spin = 1;
  const cover = [1, 0.62, 1, 0.8], y0 = S.hubY - S.sailW / 2, y1 = S.hubY + S.sailW / 2;
  for (let k = 0; k < 4; k++) {
    g.rotZ(k * Math.PI / 2, 0, S.hubY);
    g.surf(MAT.PLANK).color(timber, 0.8).beam([0.3, S.hubY, zs], [S.sailR, S.hubY, zs], 0.3, 0.28, { caps: false });
    const xa = lerp(S.sailR - 0.3, S.sail0 + 0.2, cover[k]), xb = S.sailR - 0.3;
    g.surf(MAT.CANVAS).color(mulc(P.canvas, 0.8)).grid(1, 1, (u, v) => [lerp(xa, xb, u), lerp(y0 + 0.1, y1 - 0.5, v), zs + 0.16, 0.1], { both: true, su: xb - xa, sv: S.sailW });
    g.pop();
  }
  g.spin = 0;
  return g.toGeometry({ pad: 2 });
}
export function farGiantGeometry() {
  const g = new Geo(), S = SK, P = PAL, zs = WHEEL_Z, z0 = 2.6, hz = z0 + 0.4, Y = S.hubY, far = 12.2;
  const steel = mulc(mixc(P.steel, [0.3, 0.34, 0.46], 0.5), 0.62), steelL = mulc(P.silver, 0.7), gold = mulc(P.gold, 0.8), dustc = mulc(P.dust, 0.5);
  const blue = mixc(mulc(P.ultra, 0.62), [0.05, 0.07, 0.16], 0.35), red = mulc(P.verm, 0.55);
  for (const sx of [-1, 1]) g.surf(MAT.STEEL).color(mixc(steel, dustc, 0.3)).tube([[sx * 1.6, 10.7, z0], [sx * 2.55, 5.8, z0 + 0.6], [sx * 3.1, 0.5, z0 + 0.3]], [1.5, 1.05, 0.85], { segs: 3 });
  g.surf(MAT.CLOTH).grid(1, 2, (u, v) => [(u - 0.5) * lerp(3.5, 5.0, v), lerp(11.5, 3.5, v), z0 + 2.2 + 0.3 * v, 0.08 * v + 0.12 * v * v, blue], { both: true, su: 4, sv: 8 });
  g.surf(MAT.STEEL).color(steel).lathe([[2.5, 11.0], [3.1, 14.8], [2.2, 16.8], [1.05, 17.35]], { segs: 5, cz: z0 + 0.3, sx: 1.3, sz: 0.95 });
  for (const sx of [-1, 1]) g.color(steelL).ball(sx * 3.8, 16.2, z0 + 0.25, 1.8, 1.1, 2.0, { nu: 4, nv: 2, v0: 0.4 });
  g.color(steelL).lathe([[1.1, 17.35], [1.28, 18.75], [0.1, 20.2]], { segs: 4, cz: hz, sz: 1.08 });
  g.surf(MAT.CLOTH).color(red, 1.25).grid(2, 1, (u, v) => [(v - 0.5) * (0.3 + 1.5 * Math.sin(u * 2.6)), 20.1 + 1.5 * Math.sin(u * 2.4) - 2.2 * u * u + (S.H + S.capH - 20.6) * Math.sin(u * 3.1), hz - 0.3 - 5.6 * u, 0.2 + 1.3 * u], { both: true, su: 5, sv: 1.5 });
  g.color(red).grid(1, 3, (u, v) => [(u - 0.5) * lerp(6.6, 3.0, smoothstep(0.1, 0.95, v)), 0.14 + 16.5 * Math.pow(1 - v, 1.9), z0 - 2.0 - (Math.abs(S.tailZ) + z0 - 2.0) * Math.pow(v, 2.2), (0.1 + 0.9 * v) * (1 - 0.7 * smoothstep(0.82, 1, v))], { both: true, su: 9, sv: 20 });
  // (the shield on his breast, quartered; the axle's boss before it)
  g.push(new THREE.Matrix4().makeTranslation(0, Y, S.hubZ + 1.5).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)));
  for (let q = 0; q < 4; q++) g.surf(MAT.BROCADE).color(q % 2 ? red : blue, 1.3).lathe([[2.8, -0.2], [0.9, 0.2]], { segs: 2, a0: q * TAU / 4, a1: (q + 1) * TAU / 4 });
  g.pop();
  g.spin = 1;
  g.surf(MAT.GOLD).color(gold).ball(0, Y, zs - 0.3, 1.3, 1.3, 1.2, { nu: 4, nv: 2 });
  for (let k = 0; k < 4; k++) {
    g.rotZ(k * Math.PI / 2, 0, Y); g.arm = k + 1; g.spin = 1;
    g.surf(MAT.STEEL).color(steel).tube([[0.9, Y, zs], [S.elbow, Y, zs]], [0.95, 0.7], { segs: 3 });
    g.spin = 2;
    g.tube([[S.elbow, Y, zs], [far + 0.3, Y, zs]], [0.66, 0.5], { segs: 3 });
    if (k === 0) g.color(steelL).beam([far + 0.2, Y, zs], [S.sailR, Y, zs + 0.3], 1.1, 0.4, { taper: 0.6 });
    else if (k === 1) g.color(steelL).beam([far + 0.25, Y - 1.0, zs], [far + 0.25, Y + 7.4, zs], 0.62, 0.14, { taper: 0.15, up: [0, 0, 1] });
    else if (k === 2) { g.surf(MAT.PLANK).color(PAL.timber, 0.6).beam([far + 0.25, Y - 1.2, zs], [far + 0.25, Y + 4.6, zs], 0.28, 0.28, { caps: false }); g.surf(MAT.STEEL).color(mulc(steel, 0.72)).ball(far + 0.25, Y + 5.1, zs, 1.0, 1.0, 1.0, { nu: 4, nv: 2 }); }
    else { g.surf(MAT.PLANK).color(PAL.timber, 0.7).beam([far + 0.25, Y - 1.4, zs], [far + 0.25, Y + 7.6, zs], 0.2, 0.2, { caps: false });
      g.surf(MAT.CLOTH).grid(1, 2, (u, v) => [far + 0.15 - 5.2 * u, Y + 3.8 + 3.6 * v - (v - 0.5) * 1.4 * u * u, zs + 0.5 + 0.2 * u, 0.4 * u, v < 0.5 ? red : blue], { both: true, su: 5, sv: 3.6 }); }
    g.arm = 0; g.spin = 1; g.pop();
  }
  g.spin = 0;
  return g.toGeometry({ pad: 2 });
}
// the farthest any part of a mill or a giant comes from its own axis, in plan, whatever its sails or arms are doing: a turning vertex by its distance
// from the hub (an arm's far half by the elbow's distance and its own from the elbow, so the elbow's bend is inside the bound) and its depth; a
// standing vertex by its own distance from the axis
export function reachOf(geometry) {
  const p = geometry.attributes.position, fx = geometry.attributes.aFx; let reach = 0;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = fx ? fx.getX(i) : 0, w = fx ? 2 * fx.getY(i) : 0;   // (w: how far the full wind carries a vertex of cloth)
    if (k < 0.5) { reach = Math.max(reach, Math.hypot(x, z) + w); continue; }
    let r = Math.hypot(x, y - SK.hubY);
    if (k > 1.5) { const b = (fx.getW(i) - 1) * Math.PI / 2, ex = SK.elbow * Math.cos(b), ey = SK.hubY + SK.elbow * Math.sin(b); r = Math.max(r, SK.elbow + Math.hypot(x - ex, y - ey)); }
    reach = Math.max(reach, Math.hypot(r, z) + w);
  }
  return reach;
}

// ---------------------------------------------------------------- the inn and the castle (one footprint: YARD)
// Both stand on the rectangle W (along x) by D (along z), gate in the middle of the +Z side, the big block along the back.
// mir = -1 builds the mirror image in x, so the two can face each other across the road feature for feature.
const tileRoof = (g, x0, x1, z0, z1, yEave, yRidge, over = 0.6) => {     // gable roof, ridge along x
  const zm = (z0 + z1) / 2;
  g.quad([x0 - over, yEave, z1 + over], [x1 + over, yEave, z1 + over], [x1 + over, yRidge, zm], [x0 - over, yRidge, zm]);
  g.quad([x1 + over, yEave, z0 - over], [x0 - over, yEave, z0 - over], [x0 - over, yRidge, zm], [x1 + over, yRidge, zm]);
};
const coneRoof = (g, cx, cz, r, y0, y1, segs = 12) => g.lathe([[r, y0], [r * 0.5, lerp(y0, y1, 0.42)], [r * 0.16, lerp(y0, y1, 0.8)], [0.03, y1]], { cx, cz, segs, su: 2 * Math.PI * r, sv: y1 - y0 });
const merlons = (g, x0, z0, x1, z1, y, w = 1.3, h = 1.2, t = 0.55) => {    // a row of merlons along a straight parapet
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / (w * 2))), dx = (x1 - x0) / len, dz = (z1 - z0) / len;
  for (let i = 0; i < n; i++) {
    const c = (i + 0.5) / n * len, cx = x0 + dx * c, cz = z0 + dz * c;
    if (Math.abs(dx) > 0.5) g.box(cx - w / 2, y, cz - t / 2, cx + w / 2, y + h, cz + t / 2); else g.box(cx - t / 2, y, cz - w / 2, cx + t / 2, y + h, cz + w / 2);
  }
};

// (the inn is built in steps: the generator hands back between its parts, so that no one step of the build is the whole house)
export function innGeometry(o = {}) { const it = innSteps(o); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
export function* innSteps(o = {}) {
  const g = o.g || new Geo(), Y = YARD, P = PAL, mir = o.mir ?? 1, hw = Y.W / 2, hd = Y.D / 2, mw = Y.mainW / 2, zb = -hd, zf = -hd + Y.mainD;
  const white = mulc(P.white, 0.84), stain = mixc(white, mulc(P.dust, 0.8), 0.6), timber = mulc(P.timber, 0.75), tile = mulc(P.tile, 0.8), dark = [0.03, 0.026, 0.022], stone = mulc(P.stone, 0.75);
  const X = (x) => x * mir;
  const bx = (x0, y0, z0, x1, y1, z1, oo) => g.box(Math.min(X(x0), X(x1)), y0, z0, Math.max(X(x0), X(x1)), y1, z1, oo);
  // yard walls with tile copings; the gate between two piers under a little roof
  const wall = (x0, z0, x1, z1, h) => {
    const t = 0.28, a0 = Math.min(x0, x1) - t, a1 = Math.max(x0, x1) + t, b0 = Math.min(z0, z1) - t, b1 = Math.max(z0, z1) + t;
    g.surf(MAT.PLAIN).color(stain).box(a0, 0, b0, a1, 0.9, b1, { top: false }); g.color(white).box(a0, 0.9, b0, a1, h, b1, { top: false });
    g.surf(MAT.TILE).color(tile).box(a0 - 0.14, h, b0 - 0.14, a1 + 0.14, h + 0.2, b1 + 0.14);
  };
  wall(-hw, zf, -hw, hd, 2.7); wall(hw, zf, hw, hd, 2.7); wall(-hw, hd, -Y.gate / 2 - 0.5, hd, 2.7); wall(Y.gate / 2 + 0.5, hd, hw, hd, 2.7);
  for (const sx of [-1, 1]) { g.surf(MAT.PLAIN).color(white).cbox(sx * (Y.gate / 2 + 0.45), 0, hd, INN_PIER.w, INN_PIER.h, INN_PIER.w); }
  g.surf(MAT.PLANK).color(timber).beam([-Y.gate / 2 - 1.1, 4.1, hd], [Y.gate / 2 + 1.1, 4.1, hd], 0.4, 0.34);
  g.surf(MAT.TILE).color(tile); tileRoof(g, -Y.gate / 2 - 1.0, Y.gate / 2 + 1.0, hd - 0.9, hd + 0.9, 4.3, 5.2, 0.3);
  g.surf(MAT.PLANK).color(timber, 0.85);
  for (const sx of [-1, 1]) g.quad([sx * Y.gate / 2, 0.1, hd], [sx * (Y.gate / 2 - 1.2), 0.1, hd - 2.1], [sx * (Y.gate / 2 - 1.2), 3.4, hd - 2.1], [sx * Y.gate / 2, 3.4, hd], { both: true });
  g.surf(MAT.PLANK).color(timber).beam([X(Y.gate / 2 + 0.45), 4.0, hd + 0.4], [X(Y.gate / 2 + 0.45), 5.6, hd + 1.9], 0.1, 0.1);   // the bush that says "inn"
  g.surf(MAT.WOOL).color(P.olive, 0.7).ball(X(Y.gate / 2 + 0.45), 5.4, hd + 2.0, 0.75, 0.7, 0.75, { nu: 7, nv: 4 });
  yield;
  // the main block: two storeys, whitewash stained at the foot, a tiled gable roof, a chimney
  g.surf(MAT.PLAIN).color(stain).box(-mw, 0, zb, mw, 1.1, zf, { top: false }); g.color(white).box(-mw, 1.1, zb, mw, 6.6, zf, { top: false });
  for (const sx of [-1, 1]) g.tri([sx * mw, 6.6, sx > 0 ? zf : zb], [sx * mw, 6.6, sx > 0 ? zb : zf], [sx * mw, 9.5, (zb + zf) / 2]);
  g.surf(MAT.TILE).color(tile); tileRoof(g, -mw, mw, zb, zf, 6.5, 9.6, 0.7);
  g.surf(MAT.PLAIN).color(white); bx(7.4, 8.0, zb + 2.4, 8.8, 11.0, zb + 3.8); g.surf(MAT.TILE).color(tile); bx(7.2, 11.0, zb + 2.2, 9.0, 11.25, zb + 4.0);
  // the gallery across the front: posts, a deck, a rail, a lean-to roof
  g.surf(MAT.PLANK).color(timber);
  g.box(-mw, 3.25, zf, mw, 3.45, zf + 2.2);
  for (let i = 0; i <= 8; i++) { const x = lerp(-mw + 0.2, mw - 0.2, i / 8); g.beam([x, 0, zf + 2.05], [x, 6.0, zf + 2.05], 0.24, 0.24, { caps: false }); if (i < 8) g.beam([x, 4.35, zf + 2.05], [x + (mw * 2 - 0.4) / 8, 4.35, zf + 2.05], 0.1, 0.12, { caps: false }); }
  g.surf(MAT.TILE).color(tile, 0.95).quad([-mw - 0.3, 5.75, zf + 2.6], [mw + 0.3, 5.75, zf + 2.6], [mw + 0.3, 6.5, zf], [-mw - 0.3, 6.5, zf], { both: true });
  yield;
  // doors, windows, shutters
  const zq = zf + 0.03;
  g.surf(MAT.PLANK).color(timber, 0.9).quad([-1.2, 0, zq], [1.2, 0, zq], [1.2, 2.9, zq], [-1.2, 2.9, zq]);
  for (let i = 0; i < 6; i++) {
    const x = lerp(-mw + 2.2, mw - 2.2, i / 5);
    g.surf(MAT.PLAIN).color(dark).quad([x - 0.5, 4.3, zq], [x + 0.5, 4.3, zq], [x + 0.5, 5.6, zq], [x - 0.5, 5.6, zq]);
    g.surf(MAT.PLANK).color(mixc(timber, P.olive, 0.35)); for (const s of [-1, 1]) g.quad([x + s * 0.5, 4.3, zq + 0.02], [x + s * 1.0, 4.3, zq + 0.3], [x + s * 1.0, 5.6, zq + 0.3], [x + s * 0.5, 5.6, zq + 0.02], { both: true });
    if (i !== 2 && i !== 3) { g.surf(MAT.PLAIN).color(dark).quad([x - 0.45, 1.3, zq], [x + 0.45, 1.3, zq], [x + 0.45, 2.3, zq], [x - 0.45, 2.3, zq]); }
  }
  // the swineherd's horn hung by the door
  g.surf(MAT.GOLD).color(mulc(P.gold, 0.6));
  { const pts = [], rr = []; for (let i = 0; i <= 6; i++) { const a = -0.5 + i * 0.36; pts.push([X(2.0 + Math.cos(a) * 0.55), 1.75 + Math.sin(a) * 0.55, zq + 0.12]); rr.push(0.04 + 0.03 * i); } g.tube(pts, rr, { segs: 5 }); }
  yield;
  // a lean-to stable along one side wall, a round dovecote in the other back corner
  g.surf(MAT.PLAIN).color(white); bx(-hw, 2.7, zf, -hw + 0.4, 4.3, 7);
  g.surf(MAT.TILE).color(tile); { const a = X(-hw - 0.3), b = X(-hw + 6.2); g.quad([Math.min(a, b), a < b ? 4.4 : 3.0, 7.4], [Math.max(a, b), a < b ? 3.0 : 4.4, 7.4], [Math.max(a, b), a < b ? 3.0 : 4.4, zf], [Math.min(a, b), a < b ? 4.4 : 3.0, zf], { both: true }); }
  g.surf(MAT.PLANK).color(timber); for (let i = 0; i < 5; i++) { const z = lerp(zf + 0.3, 7.1, i / 4); g.beam([X(-hw + 5.9), 0, z], [X(-hw + 5.9), 3.05, z], 0.22, 0.22, { caps: false }); }
  g.surf(MAT.WOOL).color(P.stubble, 0.8).ball(X(-hw + 3), 0.5, 3.5, 1.9, 1.5, 2.3, { nu: 8, nv: 4, v0: 0.3 });
  g.surf(MAT.PLAIN).color(white).lathe([[2.4, 0, stain], [2.35, 1.0, stain], [2.3, 1.05, white], [2.2, 7.4, white]], { cx: X(hw - 2.6), cz: zb + 2.6, segs: 12, su: 14, sv: 7 });
  g.surf(MAT.TILE).color(tile); coneRoof(g, X(hw - 2.6), zb + 2.6, 2.75, 7.3, 10.4);
  g.surf(MAT.PLAIN).color(dark); for (let i = 0; i < 6; i++) { g.at(X(hw - 2.6), 0, zb + 2.6); wallQuad(g, i / 6 * TAU + 0.3, 2.28, 5.9, 6.4, 0.4); g.pop(); }
  yield;
  // the well (its wheel is a separate turning piece), a trough, big jars, a cart, the washing line
  const wx = X(7.5), wz = 4.2;
  g.surf(MAT.STONE).color(stone).lathe([[1.25, 0], [1.25, 0.95], [0.95, 0.95]], { cx: wx, cz: wz, segs: 12, flat: true, su: 8, sv: 1 });
  g.surf(MAT.PLAIN).color([0.02, 0.03, 0.035]).disc(wx, 0.7, wz, 0.96, 12);
  g.surf(MAT.PLANK).color(timber); for (const sx of [-1, 1]) g.beam([wx + sx * 1.35, 0, wz], [wx + sx * 1.35, 3.1, wz], 0.2, 0.2); g.beam([wx - 1.6, 3.15, wz], [wx + 1.6, 3.15, wz], 0.2, 0.2);
  g.surf(MAT.STONE).color(stone); bx(9.6, 0, 3.2, 10.6, 0.6, 5.6);
  for (const [jx, jz, js] of [[-mw + 1.4, zf + 3.4, 1], [-mw + 3.0, zf + 3.2, 0.8], [mw - 1.6, zf + 3.3, 0.9]]) g.surf(MAT.PLAIN).color(mulc(P.tile, 0.7)).lathe([[0.25 * js, 0], [0.62 * js, 0.7 * js], [0.6 * js, 1.3 * js], [0.3 * js, 1.75 * js], [0.36 * js, 1.9 * js]], { cx: X(jx), cz: jz, segs: 8 });
  { const cx = X(-4.5), cz = -0.5;                                    // a two-wheeled cart, shafts down
    g.surf(MAT.PLANK).color(timber, 0.9).box(cx - 1.0, 0.95, cz - 1.9, cx + 1.0, 1.15, cz + 1.9); g.box(cx - 1.0, 1.15, cz - 1.9, cx - 0.9, 1.75, cz + 1.9); g.box(cx + 0.9, 1.15, cz - 1.9, cx + 1.0, 1.75, cz + 1.9);
    for (const sx of [-1, 1]) { g.beam([cx + sx * 0.8, 1.0, cz + 1.9], [cx + sx * 0.7, 0.1, cz + 4.6], 0.1, 0.1); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, b = (i + 1) / 8 * TAU; g.beam([cx + sx * 1.15, 0.85 + Math.sin(a) * 0.85, cz + Math.cos(a) * 0.85], [cx + sx * 1.15, 0.85 + Math.sin(b) * 0.85, cz + Math.cos(b) * 0.85], 0.1, 0.12, { caps: false }); if (i % 2 === 0) g.beam([cx + sx * 1.15, 0.85, cz], [cx + sx * 1.15, 0.85 + Math.sin(a) * 0.85, cz + Math.cos(a) * 0.85], 0.07, 0.07, { caps: false }); } } }
  const la = [X(-2.5), 2.75, 9.2], lb = [X(-13.5), 2.75, 6.6];
  g.surf(MAT.PLANK).color(timber); g.beam([la[0], 0, la[2]], la, 0.14, 0.14); g.beam([lb[0], 0, lb[2]], lb, 0.14, 0.14); g.beam([la[0], 2.7, la[2]], [lb[0], 2.7, lb[2]], 0.06, 0.06, { caps: false });
  const wash = [mulc(P.white, 0.82), mulc(P.canvas, 0.8), mulc(P.verm, 0.6), mulc(P.white, 0.8), mulc(P.olive, 0.8), mulc(P.white, 0.84), mulc(P.dust, 0.8)];
  for (let i = 0; i < 7; i++) {
    const t0 = 0.06 + i * 0.13, t1 = t0 + 0.085 + (i % 3) * 0.012, hh = 1.0 + (i * 7 % 4) * 0.22;
    const A = [lerp(la[0], lb[0], t0), 2.68, lerp(la[2], lb[2], t0)], B = [lerp(la[0], lb[0], t1), 2.68, lerp(la[2], lb[2], t1)];
    g.surf(MAT.CLOTH).color(wash[i]).grid(1, 3, (u, v) => [lerp(A[0], B[0], u), 2.68 - hh * v, lerp(A[2], B[2], u), 0.75 * v * v + 0.1 * v], { both: true, su: 1, sv: hh });
  }
  return o.g ? g : g.toGeometry({ pad: 1 });
}
// the well's wheel: turns about its local x axis (place it at innAnchors().well)
export function wellWheelGeometry() {
  const g = new Geo(); g.surf(MAT.PLANK).color(PAL.timber, 0.85);
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, b = (i + 1) / 10 * TAU; g.beam([0, Math.sin(a) * 0.8, Math.cos(a) * 0.8], [0, Math.sin(b) * 0.8, Math.cos(b) * 0.8], 0.12, 0.1, { caps: false }); if (i % 2 === 0) g.beam([0, 0, 0], [0, Math.sin(a) * 0.8, Math.cos(a) * 0.8], 0.07, 0.07, { caps: false }); }
  g.beam([-0.5, 0, 0], [0.5, 0, 0], 0.16, 0.16);
  return g.toGeometry();
}
export const innAnchors = (mir = 1) => ({ well: [7.5 * mir, 2.45, 4.2], chimney: [8.1 * mir, 11.3, -YARD.D / 2 + 3.1], pen: [-9 * mir, 0, 9.5], door: [0, 0, -YARD.D / 2 + YARD.mainD] });

// THE CASTLE'S TOWERS, IN RANKS THAT RISE FROM THE GATE TO THE DONJON (each [x, z, radius, height of its wall, height of its roof]; the
// castle's own frame, its gate toward +z): the gate's two turrets; the two front corners; the two towers at the hall's ends; the two back
// corners; then the donjon out of the hall, its bartizans and its spire. castleTips gives the point of every roof (the world lays a glint
// on each), from these same numbers.
const CASTLE = { gate: [4.3, 0.3, 2.3, 12.4, 6.2], front: [3.7, 17.5, 9.5], hall: [3.1, 25.5, 10.5], back: [3.7, 30.5, 11.5], donjon: 36, spire: 51 };
// (what of the castle stands in or over the moat's front arm, in plan: a gate turret and a front corner tower as [metres along the front
// from the gate's middle, metres before the front wall's line, radius], and the half width of the gatehouse and its drawbridge)
export const CASTLE_FRONT = { turret: [CASTLE.gate[0], CASTLE.gate[1], CASTLE.gate[2]], corner: [YARD.W / 2, 0, CASTLE.front[0]], bridge: 2.7 };
export const castleTips = () => { const Y = YARD, hw = Y.W / 2, hd = Y.D / 2, mw = Y.mainW / 2, zb = -hd, zf = -hd + Y.mainD, C = CASTLE, t = [];
  for (const sx of [-1, 1]) { t.push([sx * C.gate[0], C.gate[3] + C.gate[4], hd + C.gate[1]], [sx * hw, C.front[1] + C.front[2], hd], [sx * (mw - 1.2), C.hall[1] + C.hall[2], (zb + zf) / 2], [sx * hw, C.back[1] + C.back[2], -hd]); }
  t.push([0, C.spire, (zb + zf) / 2]);
  return t; };
export function castleGeometry(o = {}) { const it = castleSteps(o); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
export function* castleSteps(o = {}) {
  const g = o.g || new Geo(), Y = YARD, P = PAL, mir = o.mir ?? 1, hw = Y.W / 2, hd = Y.D / 2, mw = Y.mainW / 2, zb = -hd, zf = -hd + Y.mainD, B = -2.4, C = CASTLE, DJ = C.donjon - 25;
  const pearl = mulc(mixc(P.pearl, P.stone, 0.22), 0.8), pearlD = mulc(pearl, 0.82), silver = mulc(P.silver, 0.86), gold = mulc(P.gold, 0.85), ultra = mulc(P.ultra, 0.85), verm = mulc(P.verm, 0.88), slate = mulc(P.slate, 0.8), dark = [0.02, 0.02, 0.035], timber = mulc(P.timber, 0.7);
  const X = (x) => x * mir;
  const pennon = (x, y, z, len, hgt, c1, c2) => {                      // a pole with a streaming pennon
    g.surf(MAT.PLANK).color(timber).beam([x, y, z], [x, y + hgt + 1.5, z], 0.22, 0.22, { taper: 0.6 });
    g.surf(MAT.GOLD).color(gold).ball(x, y + hgt + 1.6, z, 0.22, 0.3, 0.22, { nu: 5, nv: 3 });
    g.surf(MAT.CLOTH).grid(5, 2, (u, v) => [x + len * u, y + 1.4 + hgt * (v * (1 - 0.45 * u) + 0.22 * u), z + 0.25 * Math.sin(u * 5), 1.6 * u, v < 0.5 ? c1 : c2], { both: true, su: len, sv: hgt });
  };
  const tower = (cx, cz, r, h, roofH, segs, k) => {
    g.surf(MAT.STONE).color(pearl).lathe([[r * 1.2, B, pearlD], [r * 1.04, 1.5, pearlD], [r, 3.5, pearl], [r, h - 1.0, pearl]], { cx, cz, segs, su: 2 * Math.PI * r, sv: h - B });
    g.lathe([[r, h - 1.0, pearl], [r * 1.16, h - 0.2, pearl], [r * 1.16, h + 0.9, pearl]], { cx, cz, segs, flat: true, su: 2 * Math.PI * r, sv: 2 });
    g.color(pearl); for (let i = 0; i < segs / 2; i++) { const a = (i + 0.25) / (segs / 2) * TAU; g.at(cx, 0, cz, a); g.box(-0.62, h + 0.9, r * 1.16 - 0.5, 0.62, h + 2.0, r * 1.16); g.pop(); }
    g.surf(MAT.STEEL).color(silver); coneRoof(g, cx, cz, r * 1.05, h + 0.9, h + roofH, segs);
    g.surf(MAT.GOLD).color(gold).lathe([[r * 1.09, h + 0.85], [r * 1.02, h + 1.25]], { cx, cz, segs });
    g.surf(MAT.PLAIN).color(dark); g.at(cx, 0, cz); for (let i = 0; i < 4; i++) wallQuad(g, i * 1.57 + 0.6 + k, r + 0.04, h * 0.38, h * 0.38 + 1.7, 0.3); g.pop();
    // (each arrow loop has depth: jambs, lintel and sill of paler stone stand seventeen centimetres proud of the wall about the dark slit)
    g.surf(MAT.STONE).color(mulc(pearl, 1.08)); for (let i = 0; i < 4; i++) { const y0 = h * 0.38, y1 = y0 + 1.7; g.at(cx, 0, cz, i * 1.57 + 0.6 + k);
      for (const sx of [-1, 1]) g.box(Math.min(sx * 0.15, sx * 0.34), y0 - 0.14, r - 0.06, Math.max(sx * 0.15, sx * 0.34), y1 + 0.14, r + 0.17);
      g.box(-0.15, y1, r - 0.06, 0.15, y1 + 0.14, r + 0.17); g.box(-0.15, y0 - 0.14, r - 0.06, 0.15, y0, r + 0.17); g.pop(); }
    g.surf(MAT.GLASS).color([1, 1, 1]); g.at(cx, 0, cz); for (let i = 0; i < 3; i++) wallQuad(g, i * 2.1 + 1.2 + k, r + 0.05, h * 0.62, h * 0.62 + 2.5, 0.95); g.pop();
    pennon(cx, h + roofH - 0.3, cz, 3.6, 1.3, k % 2 > 0.5 ? verm : gold, k % 2 > 0.5 ? gold : ultra);
  };
  // curtain walls, a string course, merlons. ON A CURTAIN'S OUTER FACE (out: which way it faces), between the towers that stand at its
  // ends: flat buttresses to the string course with weathered heads, five metres apart or so; an arrow loop in every bay between them,
  // at one of two heights turn about (a dark slit between jambs, lintel and sill of paler stone); and in the middle bay a pole on the
  // wall, a hand thick and rising outward, with a long banner hanging from it that moves in the wind.
  const curtain = (x0, z0, x1, z1, out, k) => {
    const t = 0.9, a0 = Math.min(x0, x1) - t, a1 = Math.max(x0, x1) + t, b0 = Math.min(z0, z1) - t, b1 = Math.max(z0, z1) + t;
    g.surf(MAT.STONE).color(pearlD).box(a0, B, b0, a1, 2.2, b1, { top: false }); g.color(pearl).box(a0, 2.2, b0, a1, 9.0, b1);
    g.color(mulc(pearl, 1.06)).box(a0 - 0.14, 7.7, b0 - 0.14, a1 + 0.14, 8.05, b1 + 0.14);
    // (the face's own frame: u along it from its left end as seen from outside, z out of it)
    const L = out[0] ? b1 - b0 : a1 - a0, END = 4.4, Lu = L - 2 * END, nb = Math.max(1, Math.round(Lu / 5)), bay = Lu / nb, mid = Math.floor(nb / 2);
    if (out[0] > 0) g.at(a1, 0, b1, Math.PI / 2); else if (out[0] < 0) g.at(a0, 0, b0, -Math.PI / 2); else if (out[1] > 0) g.at(a0, 0, b1, 0); else g.at(a1, 0, b0, Math.PI);
    const loop = (u, y0) => { const y1 = y0 + 1.7;
      g.surf(MAT.PLAIN).color(dark).quad([u - 0.15, y0, 0.04], [u + 0.15, y0, 0.04], [u + 0.15, y1, 0.04], [u - 0.15, y1, 0.04]);
      g.surf(MAT.STONE).color(mulc(pearl, 1.08)); for (const sx of [-1, 1]) g.box(u + Math.min(sx * 0.15, sx * 0.34), y0 - 0.14, 0, u + Math.max(sx * 0.15, sx * 0.34), y1 + 0.14, 0.17);
      g.box(u - 0.15, y1, 0, u + 0.15, y1 + 0.14, 0.17).box(u - 0.15, y0 - 0.14, 0, u + 0.15, y0, 0.17); };
    for (let i = 1; i < nb; i++) { const u = END + i * bay;
      g.surf(MAT.STONE).color(mulc(pearl, 0.95)).box(u - 0.6, B, 0, u + 0.6, 6.7, 0.42, { top: false });
      g.color(mulc(pearl, 1.1)).quad([u - 0.6, 6.7, 0.42], [u + 0.6, 6.7, 0.42], [u + 0.6, 7.6, 0], [u - 0.6, 7.6, 0]);
      g.tri([u + 0.6, 6.7, 0.42], [u + 0.6, 6.7, 0], [u + 0.6, 7.6, 0]).tri([u - 0.6, 6.7, 0], [u - 0.6, 6.7, 0.42], [u - 0.6, 7.6, 0]); }
    for (let i = 0; i < nb; i++) { const u = END + (i + 0.5) * bay;
      if (i !== mid) { loop(u, i % 2 ? 4.9 : 3.5); continue; }
      if (nb === 1) { loop(u - 2.3, 3.5); loop(u + 2.3, 4.9); }
      const y0 = 8.25, y1 = 8.75, zo = 2.3, c1 = k % 2 ? verm : ultra;
      g.surf(MAT.PLANK).color(timber).beam([u, y0, -0.1], [u, y1, zo], 0.16, 0.16); g.beam([u, y0 - 1.3, 0], [u, y0 + 0.28, 1.25], 0.1, 0.1, { caps: false });
      g.surf(MAT.GOLD).color(gold).ball(u, y1 + 0.03, zo + 0.12, 0.2, 0.2, 0.2, { nu: 5, nv: 3 });
      // (the banner hangs from the pole's outer two thirds, three and a half metres long, swallow-tailed; its foot moves most)
      g.surf(MAT.CLOTH).grid(2, 5, (a, b) => { const z = lerp(0.55, zo - 0.1, a), drop = 3.5 * b * (1 - 0.18 * Math.abs(a - 0.5) * 2 * (b > 0.9 ? -1.2 : 0));
        return [u + 0.1 * Math.sin(b * 4 + a), lerp(y0, y1, z / zo) - 0.1 - drop, z, 0.5 * b, b < 0.18 ? gold : a < 0.5 ? c1 : mulc(c1, 0.82)]; }, { both: true, su: zo, sv: 3.5 }); }
    g.pop();
  };
  curtain(-hw, zb, -hw, hd, [-1, 0], 0); curtain(hw, zb, hw, hd, [1, 0], 1); curtain(-hw, hd, -4.4, hd, [0, 1], 1); curtain(4.4, hd, hw, hd, [0, 1], 0); curtain(-hw, zb, hw, zb, [0, -1], 1);
  g.surf(MAT.STONE).color(pearl);
  merlons(g, -hw + 4, hd + 0.62, -6.5, hd + 0.62, 9.0); merlons(g, 6.5, hd + 0.62, hw - 4, hd + 0.62, 9.0);
  for (const sx of [-1, 1]) merlons(g, sx * (hw + 0.62), zb + 4, sx * (hw + 0.62), hd - 4, 9.0);
  merlons(g, -hw + 4, zb - 0.62, hw - 4, zb - 0.62, 9.0);
  // four corner towers with silver pinnacles, the back pair the taller; a tower at either end of the hall, taller than the front corners
  yield;
  let k = 0; for (const sx of [-1, 1]) { for (const sz of [-1, 1]) { const T = sz > 0 ? C.front : C.back; tower(sx * hw, sz * hd, T[0], T[1], T[2], 14, k++ * 0.9); } yield; }
  for (const sx of [-1, 1]) tower(sx * (mw - 1.2), (zb + zf) / 2, C.hall[0], C.hall[1], C.hall[2], 12, 3.1 + sx);
  yield;
  // the gatehouse: two turrets, the gate, a raised portcullis, a drawbridge down over the moat on its chains
  for (const sx of [-1, 1]) tower(sx * C.gate[0], hd + C.gate[1], C.gate[2], C.gate[3], C.gate[4], 10, 2.2 + sx);
  yield;
  g.surf(MAT.STONE).color(pearl).box(-CASTLE_FRONT.bridge, B, hd - 1.2, CASTLE_FRONT.bridge, 11.2, hd + 1.3);
  merlons(g, -2.6, hd + 1.05, 2.6, hd + 1.05, 11.2, 0.9, 1.0, 0.5);
  g.surf(MAT.PLAIN).color(dark).quad([-2.1, 0.2, hd + 1.34], [2.1, 0.2, hd + 1.34], [2.1, 4.6, hd + 1.34], [-2.1, 4.6, hd + 1.34]); g.tri([-2.1, 4.6, hd + 1.34], [2.1, 4.6, hd + 1.34], [0, 6.6, hd + 1.34]);
  g.surf(MAT.STEEL).color(P.steel, 0.5); for (let i = -2; i <= 2; i++) g.beam([i * 0.8, 3.7, hd + 1.4], [i * 0.8, 6.0 - Math.abs(i) * 0.45, hd + 1.4], 0.1, 0.1, { caps: false }); for (const y of [4.1, 4.9]) g.beam([-2.0, y, hd + 1.4], [2.0, y, hd + 1.4], 0.1, 0.1, { caps: false });
  g.surf(MAT.GLASS).color([1, 1, 1]).quad([-1.0, 7.4, hd + 1.34], [1.0, 7.4, hd + 1.34], [1.0, 10.0, hd + 1.34], [-1.0, 10.0, hd + 1.34]);
  const zo = hd + Y.moat + 1.2;
  g.surf(MAT.PLANK).color(timber, 1.1).box(-2.5, 0.0, hd + 1.3, 2.5, 0.3, zo, { bottom: true });
  for (const sx of [-1, 1]) {
    g.surf(MAT.PLANK).color(timber).cbox(sx * 2.4, 0.3, zo - 0.4, 0.3, 1.1, 0.3);
    const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([sx * 2.35, lerp(8.6, 1.3, t) - 1.3 * Math.sin(t * Math.PI), lerp(hd + 1.5, zo - 0.4, t), 0.35 * Math.sin(t * Math.PI)]); }
    g.surf(MAT.STEEL).color(P.steel, 0.45).tube(pts, 0.085, { segs: 4 });
  }
  // long gonfalons either side of the gate; the herald's trumpet on the parapet
  for (const sx of [-1, 1]) g.surf(MAT.CLOTH).grid(2, 4, (u, v) => [sx * 10.5 + (u - 0.5) * 2.2, 8.4 - 5.6 * v - (v > 0.99 ? Math.abs(u - 0.5) * -1.2 : 0), hd + 1.05 + 0.25 * v, 0.5 * v * v, u < 0.34 || u > 0.66 ? (sx > 0 ? ultra : verm) : gold], { both: true, su: 2.2, sv: 5.6 });
  g.surf(MAT.GOLD).color(gold).beam([X(3.4), 13.9, hd + 1.6], [X(3.9), 14.6, hd + 4.6], 0.12, 0.12, { taper: 3.2 });
  g.surf(MAT.CLOTH).color(verm).grid(1, 2, (u, v) => [X(3.5 + 0.35 * u), 13.9 + 0.5 * u - 1.3 * v, hd + 2.2 + 1.6 * u, 0.5 * v], { both: true });
  yield;
  // the great hall along the back: tall lancets of coloured glass, buttresses, a blue roof with a gold crest
  g.surf(MAT.STONE).color(pearl).box(-mw, 0, zb + 0.3, mw, 15, zf, { top: false });
  for (const sx of [-1, 1]) { g.tri([sx * mw, 15, sx > 0 ? zf : zb + 0.3], [sx * mw, 15, sx > 0 ? zb + 0.3 : zf], [sx * mw, 21.6, (zb + 0.3 + zf) / 2]); }
  g.surf(MAT.TILE).color(slate); tileRoof(g, -mw, mw, zb + 0.3, zf, 14.9, 21.7, 0.5);
  g.surf(MAT.GOLD).color(gold).beam([-mw - 0.4, 21.85, (zb + 0.3 + zf) / 2], [mw + 0.4, 21.85, (zb + 0.3 + zf) / 2], 0.22, 0.4);
  for (let i = 0; i < 7; i++) {
    const x = lerp(-mw + 1.9, mw - 1.9, i / 6);
    if (i % 1 === 0 && i !== 3) { g.surf(MAT.GLASS).color([1, 1, 1]).quad([x - 0.8, 9.6, zf + 0.04], [x + 0.8, 9.6, zf + 0.04], [x + 0.8, 13.2, zf + 0.04], [x - 0.8, 13.2, zf + 0.04]); g.tri([x - 0.8, 13.2, zf + 0.04], [x + 0.8, 13.2, zf + 0.04], [x, 14.4, zf + 0.04]); }
    if (i < 6) { const xb = x + (mw * 2 - 3.8) / 12; g.surf(MAT.STONE).color(pearl).box(xb - 0.35, 0, zf, xb + 0.35, 14.2, zf + 0.7); }
  }
  yield;
  // the donjon rising out of the hall, four bartizans, a silver spire, the great banner
  // (the donjon stands DJ higher than the hall's ridge asks: over every tower of the castle; a string course and a second light at mid height)
  g.surf(MAT.STONE).color(pearl).box(-4.2, 14, zb + 0.6, 4.2, 25 + DJ, zf - 0.6);
  g.color(mulc(pearl, 1.06)).box(-4.34, 24.6, zb + 0.46, 4.34, 24.95, zf - 0.46);
  merlons(g, -4.0, zf - 0.85, 4.0, zf - 0.85, 25 + DJ, 1.0, 1.1, 0.5); merlons(g, -4.0, zb + 0.85, 4.0, zb + 0.85, 25 + DJ, 1.0, 1.1, 0.5);
  for (const sx of [-1, 1]) merlons(g, sx * 3.95, zb + 1.6, sx * 3.95, zf - 1.6, 25 + DJ, 1.0, 1.1, 0.5);
  for (const up of [0, DJ]) { g.surf(MAT.GLASS).color([1, 1, 1]).quad([-1.1, 17.5 + up, zf - 0.56], [1.1, 17.5 + up, zf - 0.56], [1.1, 21.6 + up, zf - 0.56], [-1.1, 21.6 + up, zf - 0.56]); g.tri([-1.1, 21.6 + up, zf - 0.56], [1.1, 21.6 + up, zf - 0.56], [0, 23.2 + up, zf - 0.56]); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const cx = sx * 4.2, cz = sz > 0 ? zf - 0.6 : zb + 0.6;
    g.surf(MAT.STONE).color(pearl).lathe([[0.3, 20.6 + DJ], [1.25, 22.2 + DJ], [1.25, 26.2 + DJ]], { cx, cz, segs: 8, su: 8, sv: 6 });
    g.surf(MAT.STEEL).color(silver); coneRoof(g, cx, cz, 1.4, 26.1 + DJ, 30.2 + DJ, 8);
    g.surf(MAT.GOLD).color(gold).ball(cx, 30.3 + DJ, cz, 0.2, 0.3, 0.2, { nu: 5, nv: 3 });
  }
  g.surf(MAT.STEEL).color(silver).lathe([[3.3, 25.2 + DJ], [1.9, 29.5 + DJ], [0.8, 0.5 * (29.5 + DJ + C.spire)], [0.05, C.spire]], { cx: 0, cz: (zb + zf) / 2, segs: 12, su: 20, sv: 14 });
  pennon(0, C.spire - 0.9, (zb + zf) / 2, 7.5, 3.0, verm, gold);
  return o.g ? g : g.toGeometry({ pad: 2 });
}

// ---------------------------------------------------------------- living things (limbs swing in the shader: see aLimb)
// All face +Z, stand on y = 0. Gait limbs are class 0 (they follow the instance's own rate); slow nods are class 1.
// o: h (withers), len, girth, neck, graze (true: head at the ground), head, leg, col, col2 (legs, muzzle), mane, tail, ears,
//    barding { a, b, trim } (a cloth housing to the knees), plume, saddle 'war' | 'pack' | null, gait (swing), nod
function quadruped(g, o) {
  const h = o.h, L = o.len, r = o.girth, zF = L * 0.36, zH = -L * 0.36, yb = h - r * 0.95, lt = o.leg ?? r * 0.3, gait = o.gait ?? 0.5, seg = o.seg ?? 8;
  g.surf(o.wool ? MAT.WOOL : MAT.PLAIN).color(o.col).limb = null;
  g.ball(0, yb, 0, r, r * (o.deep ?? 1), L / 2, { nu: seg, nv: o.wool ? 4 : 5 });
  // neck and head: grazing reaches down to the ground, otherwise carried high
  const nb = [0, h - r * 0.25, zF * 0.95], hd = o.graze ? [0, h * 0.2, zF + o.neck * 0.92] : [0, h + o.neck * (o.carry ?? 0.6), zF + o.neck * 0.75];
  const dir = [hd[0] - nb[0], hd[1] - nb[1], hd[2] - nb[2]], dl = Math.hypot(...dir), dn = dir.map((v) => v / dl), tip = [hd[0] + dn[0] * o.head * 0.4, hd[1] + (o.graze ? -0.1 : -0.25) * o.head, hd[2] + (o.graze ? 0.75 : 0.9) * o.head];
  g.limb = [nb[1], nb[2], o.nod ?? 0.1, 10 + (o.nodPhase ?? 0)];
  g.tube([nb, [lerp(nb[0], hd[0], 0.5), lerp(nb[1], hd[1], 0.5) + (o.graze ? 0.06 * h : 0), lerp(nb[2], hd[2], 0.5)], hd, tip], [r * 0.62, r * 0.42, r * (o.jowl ?? 0.4), r * 0.24], { segs: Math.max(5, seg - 2), up: [1, 0, 0] });
  g.color(o.col2 || o.col).ball(tip[0], tip[1], tip[2], r * 0.25, r * 0.23, r * 0.27, { nu: 5, nv: 3 });
  const el = o.ears ?? 0.2;
  g.color(o.col); for (const sx of [-1, 1]) g.tri([sx * r * 0.14, hd[1] + r * 0.3, hd[2] - 0.02], [sx * r * 0.42, hd[1] + r * 0.3 + el * (o.graze ? 0.4 : 1), hd[2] - el * (o.graze ? 0.9 : 0.2)], [sx * r * 0.38, hd[1] + r * 0.12, hd[2] + 0.06], { both: true });
  if (o.mane) { g.color(o.mane); g.quad([0, nb[1] + r * 0.5, nb[2] - 0.1], [0, hd[1] + r * 0.42, hd[2] - 0.1], [0, hd[1] + r * 0.05, hd[2] - 0.05], [0, nb[1] + r * 0.1, nb[2]], { both: true, w: [0.05, 0.12, 0, 0] }); }
  if (o.plume) { g.surf(MAT.CLOTH).color(o.plume); g.grid(2, 1, (u, v) => [(v - 0.5) * 0.3, hd[1] + r * 0.4 + u * 0.75, hd[2] - u * 0.45, 0.15 + 0.5 * u], { both: true }); g.surf(MAT.PLAIN); }
  // legs: diagonal pairs move together
  g.color(o.col2 || o.col);
  for (const [sx, z, ph] of [[1, zF, 0], [-1, zF, 0.5], [1, zH, 0.5], [-1, zH, 0]]) {
    g.limb = [yb, z, gait, ph];
    g.beam([sx * r * 0.55, yb, z], [sx * r * 0.5, 0, z + (z > 0 ? 0.02 : -0.04) * h], lt, lt * 1.1, { caps: false, taper: 0.7 });
  }
  g.limb = null;
  if (o.tail) { g.color(o.mane || o.col); g.grid(1, 3, (u, v) => [(u - 0.5) * r * 0.3, yb + r * 0.6 - o.tail * v, -L / 2 - 0.04 - 0.18 * o.tail * Math.sin(v * 1.6), 0.35 * v], { both: true }); }
  if (o.barding) {                                                    // the housing: cloth to the knees, quartered in two colours, a gold hem
    const B = o.barding, y1 = yb + r * 1.02, y0 = h * 0.36;
    g.surf(MAT.CLOTH).grid(10, 3, (u, v) => { const a = u * TAU, fl = 1.12 + 0.2 * v; return [Math.sin(a) * r * fl, lerp(y1, y0, v) - (Math.abs(Math.cos(a)) > 0.92 ? 0 : 0), Math.cos(a) * L * 0.56 * (1 + 0.06 * v), 0.3 * v * v, v > 0.86 ? B.trim : ((u * 4 | 0) % 2 ? B.a : B.b)]; }, { wrap: true, su: 6, sv: 1.2 });
    g.surf(MAT.PLAIN);
  }
  if (o.saddle === 'war') { g.surf(MAT.PLANK).color(mulc(PAL.timber, 0.6)).box(-r * 0.6, yb + r * 0.95, -L * 0.14, r * 0.6, yb + r * 1.22, L * 0.14); g.box(-r * 0.5, yb + r * 1.2, -L * 0.17, r * 0.5, yb + r * 1.62, -L * 0.11); g.box(-r * 0.4, yb + r * 1.2, L * 0.1, r * 0.4, yb + r * 1.5, L * 0.15); g.surf(MAT.PLAIN); }
  if (o.saddle === 'pack') { g.surf(MAT.CLOTH).color(mulc(PAL.canvas, 0.7)).box(-r * 0.75, yb + r * 0.9, -L * 0.18, r * 0.75, yb + r * 1.25, L * 0.18); for (const sx of [-1, 1]) g.color(mulc(PAL.stubble, 0.75)).box(sx * r * 1.0 - 0.14, yb - r * 0.25, -L * 0.15, sx * r * 1.0 + 0.14, yb + r * 0.95, L * 0.15, { bottom: true }); g.surf(MAT.PLAIN); }
  return g;
}
const PEARL = mulc(PAL.pearl, 0.82), GOLD = mulc(PAL.gold, 0.85);
// A horse or a donkey grazing, facing +Z: one skeleton, plain (lean, bare, a worn saddle) or fine (full, caparisoned, plumed).
// o: h (withers), len, r (barrel), lean 0..1, col, col2 (legs, muzzle), mane, tail, ears, saddle 'war' | 'pack', cloth { a, b, trim }, plume, gold
function equine(g, o) {
  const h = o.h, L = o.len, r = o.r, lean = o.lean ?? 0, zC = L / 2, zR = -L / 2, zF = zC - 0.14 * L, zH = zR + 0.2 * L, yS = h - r * 0.95, seg = 8;
  g.surf(MAT.PLAIN).color(o.col).limb = null;
  // trunk from rump to breast; the lean one has a hollow back and a tucked belly
  g.tube([[0, yS + 0.02, zR - 0.02], [0, yS + 0.06, zR + 0.16 * L], [0, yS - 0.07 * lean * h * 0.4, -0.06 * L], [0, yS - 0.03, 0.22 * L], [0, yS - 0.1 * r, zC - 0.06 * L], [0, yS - 0.32 * r, zC + 0.05 * L]],
    [0.5 * r, 0.96 * r, (0.92 - 0.14 * lean) * r, 1.0 * r, 0.88 * r, 0.46 * r], { segs: seg, up: [0, 1, 0] });
  for (const sx of [-1, 1]) {
    g.ball(sx * 0.5 * r, yS + 0.02, zH + 0.02 * L, 0.56 * r, 0.9 * r, 0.25 * L, { nu: 6, nv: 4 });     // haunch
    g.ball(sx * 0.46 * r, yS - 0.12 * r, zF, 0.46 * r, 0.86 * r, 0.19 * L, { nu: 6, nv: 4 });           // shoulder
    if (lean > 0.3) g.ball(sx * 0.62 * r, yS + 0.62 * r, zH + 0.1 * L, 0.16 * r, 0.14 * r, 0.2 * r, { nu: 5, nv: 3 });   // the hip bone shows
  }
  // legs: forearm and cannon, gaskin and hock, dark hoofs
  const yE = yS - 0.78 * r, hoof = [0.05, 0.04, 0.035];
  for (const [sx, front, ph] of [[1, 1, 0], [-1, 1, 0.5], [1, 0, 0.5], [-1, 0, 0]]) {
    const x = sx * 0.42 * r, z0 = front ? zF + 0.01 : zH - 0.02, zk = front ? z0 + 0.01 : z0 - 0.1 * L, z1 = front ? z0 + 0.0 : z0 - 0.045 * L, yk = yE * (front ? 0.5 : 0.56);
    g.limb = [yE + 0.2 * r, z0, o.gait ?? 0.03, ph]; g.color(o.col);
    g.beam([x, yE + 0.25 * r, z0], [x, yk, zk], (front ? 0.36 : 0.5) * r, (front ? 0.44 : 0.62) * r, { caps: false, taper: front ? 0.52 : 0.44 });
    g.color(o.col2 || o.col).beam([x, yk + 0.02, zk], [x, 0.07 * h, z1], 0.2 * r, 0.22 * r, { caps: false, taper: 0.85 });
    g.color(hoof).box(x - 0.13 * r, 0, z1 - 0.12 * r, x + 0.13 * r, 0.075 * h, z1 + 0.17 * r);
  }
  // neck and head down to the grass; they nod together from the withers
  const N0 = [0, yS + 0.45 * r, zC - 0.1 * L], P = [0, 0.36 * h, zC + 0.36 * h], M = [0, 0.045 * h, zC + 0.47 * h], hs = o.head ?? 1;
  g.limb = [N0[1], N0[2], o.nod ?? 0.07, 10 + (o.nodPhase ?? 0)]; g.color(o.col);
  g.tube([[0, yS + 0.1 * r, zC - 0.2 * L], N0, [0, lerp(N0[1], P[1], 0.55) + 0.05 * h, lerp(N0[2], P[2], 0.6)], P], [0.8 * r, 0.72 * r, 0.47 * r, 0.36 * r], { segs: seg, up: [1, 0, 0] });
  g.tube([[P[0], P[1] + 0.03 * h, P[2] - 0.02 * h], [0, lerp(P[1], M[1], 0.5), lerp(P[2], M[2], 0.5) - 0.02 * h], M, [0, M[1] - 0.012 * h, M[2] + 0.02 * h]], [0.3 * r * hs, 0.4 * r * hs, 0.25 * r * hs, 0.17 * r * hs], { segs: 6, up: [1, 0, 0] });
  g.color(o.col2 || o.col).ball(0, M[1] + 0.01 * h, M[2] + 0.01 * h, 0.2 * r * hs, 0.17 * r * hs, 0.2 * r * hs, { nu: 5, nv: 3 });
  const el = o.ears ?? 0.16;
  g.color(o.col); for (const sx of [-1, 1]) g.tri([sx * 0.1 * r, P[1] + 0.1 * r, P[2] - 0.2 * r], [sx * 0.34 * r, P[1] + 0.2 * r + el * 0.5, P[2] - 0.34 * r - el * 0.85], [sx * 0.34 * r, P[1] - 0.04 * r, P[2] - 0.3 * r], { both: true });
  if (o.mane) {                                                       // the mane falls to one side of the crest; a forelock
    g.color(o.mane); const q = (t) => [0.03, lerp(N0[1], P[1], t) + 0.05 * h * Math.sin(t * 2.6) + (0.72 - 0.38 * t) * r, lerp(N0[2], P[2], t) - (0.2 - 0.5 * t) * r];
    g.grid(4, 1, (u, v) => { const c = q(u); return [c[0] + 0.5 * r * v * (0.75 - 0.3 * u), c[1] - (o.maneLen ?? 0.2) * v, c[2], 0.12 * v]; }, { both: true });
    g.tri([-0.1 * r, P[1] + 0.2 * r, P[2] - 0.1 * r], [0.1 * r, P[1] + 0.2 * r, P[2] - 0.1 * r], [0, P[1] - 0.14 * h, P[2] + 0.2 * r], { both: true });
  }
  if (o.plume) { g.surf(MAT.CLOTH).color(o.plume); g.grid(3, 1, (u, v) => [(v - 0.5) * 0.14, P[1] + 0.2 * r + 0.36 * Math.sin(u * 2.2), P[2] - 0.3 * r - 0.5 * u, 0.1 + 0.5 * u], { both: true }); g.surf(MAT.PLAIN); }
  g.limb = null;
  // tail: strands from the dock, hanging and moved by the wind
  g.color(o.mane || o.col2 || o.col);
  g.grid(2, 4, (u, v) => [(u - 0.5) * r * (0.34 + 0.3 * Math.sin(v * 2.4)), yS + 0.4 * r - o.tail * v, zR - 0.06 - 0.24 * o.tail * Math.sin(v * 1.9), 0.4 * v * v], { both: true });
  // the cloth: a caparison to the knees, quartered, trimmed; or nothing but the saddle's girth
  const yTop = yS + 0.98 * r;
  if (o.cloth) {
    const C = o.cloth, yHem = 0.3 * h;
    for (const sx of [-1, 1]) g.surf(MAT.CLOTH).grid(6, 3, (u, v) => {
      const z = lerp(zR - 0.04 * L, zC + 0.06 * L, u), bulge = 1 + 0.12 * Math.sin(u * Math.PI);
      return [sx * (0.08 + (r * 1.08 * bulge) * Math.sin(Math.min(1, v * 1.6) * 1.5708) + 0.1 * v * v), lerp(yTop + 0.02, yHem, v) + 0.04 * Math.sin(u * 9) * v, z, 0.32 * v * v, v > 0.85 ? C.trim : ((u < 0.5) === (sx > 0) ? C.a : C.b)];
    }, { both: true, su: L, sv: 1.2, flip: sx < 0 });
    g.surf(MAT.GOLD).color(C.trim).beam([0, yTop + 0.03, zR - 0.02 * L], [0, yTop + 0.03, zC + 0.02 * L], 0.07, 0.05);
    g.surf(MAT.PLAIN);
  } else {
    g.surf(MAT.PLANK).color(mulc(PAL.timber, 0.55)); g.lathe([[r * 1.02, 0], [r * 1.02, 0.09]], { segs: 8, cx: 0, cz: 0 });
    g.surf(MAT.PLAIN);
  }
  if (o.saddle === 'war') {                                           // a high-backed saddle
    g.surf(MAT.PLANK).color(o.gold ? GOLD : mulc(PAL.timber, 0.6));
    g.box(-0.5 * r, yTop - 0.02, -0.02 * L, 0.5 * r, yTop + 0.1, 0.2 * L); g.box(-0.46 * r, yTop + 0.08, -0.05 * L, 0.46 * r, yTop + 0.4, 0.0); g.box(-0.3 * r, yTop + 0.08, 0.17 * L, 0.3 * r, yTop + 0.3, 0.21 * L);
    if (!o.cloth) for (const sx of [-1, 1]) { g.surf(MAT.PLANK).color(mulc(PAL.timber, 0.5)).beam([sx * r * 0.98, yTop - 0.3 * r, 0.1 * L], [sx * r * 1.02, yS - 1.1 * r, 0.1 * L], 0.03, 0.05, { caps: false }); g.surf(MAT.STEEL).color(mulc(PAL.steel, 0.6)).box(sx * r * 1.02 - 0.05, yS - 1.22 * r, 0.1 * L - 0.07, sx * r * 1.02 + 0.05, yS - 1.1 * r, 0.1 * L + 0.07, { bottom: true }); }
    g.surf(MAT.PLAIN);
  }
  if (o.saddle === 'pack') {                                          // a pack saddle with two panniers and a rolled blanket
    g.surf(MAT.CLOTH).color(mulc(PAL.canvas, 0.7)).box(-0.6 * r, yTop - 0.03, -0.14 * L, 0.6 * r, yTop + 0.1, 0.2 * L);
    g.surf(MAT.WOOL).color(mulc(lin('#8a4a3a'), 0.7)); g.push(new THREE.Matrix4().makeTranslation(0, yTop + 0.2, 0.03 * L).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2))); g.lathe([[0.02, -0.7 * r], [0.11, -0.66 * r], [0.11, 0.66 * r], [0.02, 0.7 * r]], { segs: 6 }); g.pop();
    for (const sx of [-1, 1]) g.surf(MAT.PLANK).color(mulc(PAL.stubble, 0.7)).lathe([[0.14, yS - 0.5 * r], [0.2, yS - 0.2 * r], [0.21, yS + 0.55 * r]], { segs: 7, cx: sx * (r + 0.13), cz: 0.03 * L, sz: 1.5, su: 6, sv: 3 });
    g.surf(MAT.PLAIN);
  }
  return g;
}
export function creatureGeometry(kind) {
  const g = new Geo(), P = PAL;
  if (kind === 'horse') equine(g, { h: 1.6, len: 1.75, r: 0.27, lean: 1, col: mulc(lin('#b3a892'), 0.72), col2: mulc(lin('#75695c'), 0.72), mane: mulc(lin('#4a4238'), 0.8), maneLen: 0.16, tail: 0.95, ears: 0.15, saddle: 'war' });
  else if (kind === 'charger') equine(g, { h: 1.6, len: 1.75, r: 0.32, lean: 0, col: PEARL, col2: PEARL, mane: GOLD, maneLen: 0.3, tail: 1.05, ears: 0.15, saddle: 'war', gold: true, plume: mulc(P.verm, 0.9), cloth: { a: mulc(P.verm, 0.88), b: mulc(P.ultra, 0.85), trim: GOLD } });
  else if (kind === 'donkey') equine(g, { h: 1.08, len: 1.22, r: 0.27, lean: 0, head: 1.25, col: mulc(lin('#8d8985'), 0.75), col2: mulc(lin('#d0c8ba'), 0.75), mane: mulc(lin('#3a3632'), 0.9), maneLen: 0.07, tail: 0.6, ears: 0.34, saddle: 'pack', nod: 0.09, nodPhase: 0.4 });
  else if (kind === 'palfrey') equine(g, { h: 1.08, len: 1.22, r: 0.27, lean: 0, head: 1.25, col: mulc(P.pearl, 0.74), col2: PEARL, mane: mulc(P.silver, 0.8), maneLen: 0.2, tail: 0.7, ears: 0.34, saddle: 'war', gold: true, plume: mulc(P.gold, 0.9), cloth: { a: mulc(P.green, 0.85), b: GOLD, trim: mulc(P.verm, 0.9) }, nod: 0.09, nodPhase: 0.4 });
  else if (kind === 'sheep' || kind === 'sheepB') { const dk = kind === 'sheepB';     // a ewe: a round fleece, a dark face and legs, ears; a few of the flock are black
    quadruped(g, { h: 0.78, len: 1.05, girth: 0.3, deep: 1.0, neck: 0.3, carry: 0.25, head: 0.26, leg: 0.06, col: dk ? [0.035, 0.03, 0.028] : mulc(lin('#e6dcc6'), 0.78), col2: dk ? [0.02, 0.018, 0.016] : mulc(lin('#3a332c'), 1), tail: 0, ears: 0.12, wool: true, seg: 8, gait: 0.5, nod: 0.05, jowl: 0.36 }); }
  else if (kind === 'dog') quadruped(g, { h: 0.62, len: 0.95, girth: 0.17, neck: 0.3, carry: 0.5, head: 0.26, leg: 0.05, col: mulc(lin('#7a5c3c'), 0.8), col2: mulc(lin('#d8c8a8'), 0.8), tail: 0.3, ears: 0.12, seg: 6, gait: 0.7, nod: 0.04 });
  else if (kind === 'hound') quadruped(g, { h: 0.7, len: 1.05, girth: 0.16, neck: 0.36, carry: 0.6, head: 0.28, leg: 0.05, col: PEARL, col2: PEARL, mane: null, tail: 0.36, ears: 0.12, seg: 6, gait: 0.7, nod: 0.04, plume: GOLD });
  else if (kind === 'pig') quadruped(g, { h: 0.62, len: 1.2, girth: 0.3, deep: 0.95, neck: 0.3, graze: true, head: 0.3, leg: 0.075, col: mulc(lin('#b98a7c'), 0.75), col2: mulc(lin('#8a6258'), 0.75), tail: 0, ears: 0.14, seg: 7, gait: 0.04, nod: 0.16, jowl: 0.6 });
  else if (kind === 'ram') {
    // the flock's rams: heavier than the ewes, dark-faced, horns curled back beside the head (they nod with it)
    const h = 0.9, r = 0.34, zF = 1.2 * 0.36;
    quadruped(g, { h, len: 1.2, girth: r, deep: 1.0, neck: 0.34, carry: 0.35, head: 0.3, leg: 0.075, col: mulc(lin('#d9ceb6'), 0.74), col2: mulc(lin('#2e2822'), 1), tail: 0, ears: 0.1, wool: true, seg: 7, gait: 0.5, nod: 0.05, jowl: 0.42 });
    const hy = h + 0.34 * 0.35 + 0.1, hz = zF + 0.34 * 0.75 - 0.02;
    g.limb = [h - r * 0.25, zF * 0.95, 0.05, 10]; g.surf(MAT.PLAIN).color(mulc(lin('#8a7a5e'), 0.8));
    for (const sx of [-1, 1]) { const pts = [], rad = []; for (let k = 0; k <= 7; k++) { const t = 0.5 + k * 0.62; pts.push([sx * (0.1 + 0.03 * k), hy + 0.13 * Math.cos(t) - 0.05, hz - 0.15 * Math.sin(t) - 0.03]); rad.push(0.06 - 0.006 * k); } g.tube(pts, rad, { segs: 5, up: [1, 0, 0] }); }
    g.limb = null;
  } else if (kind === 'knight') {
    // a man-at-arms on a barded horse: helm, shield, a long lance carried forward with its pennon (no face)
    const h = 1.6, r = 0.37, verm = mulc(P.verm, 0.88), ultra = mulc(P.ultra, 0.85), steel = mulc(P.steel, 0.8), silver = mulc(P.silver, 0.86);
    quadruped(g, { h, len: 2.05, girth: r, deep: 1.0, neck: 0.75, carry: 0.8, head: 0.5, leg: 0.12, col: PEARL, col2: PEARL, mane: GOLD, tail: 0.95, ears: 0.14, seg: 8, gait: 0.14, nod: 0.05, jowl: 0.34, plume: verm, barding: { a: verm, b: ultra, trim: GOLD }, saddle: 'war' });
    const ys = h + r * 0.28;
    g.surf(MAT.STEEL).color(steel); for (const sx of [-1, 1]) { g.beam([sx * 0.26, ys + 0.1, 0.02], [sx * 0.47, ys - 0.5, 0.2], 0.2, 0.22, { caps: false }); g.beam([sx * 0.47, ys - 0.5, 0.2], [sx * 0.45, ys - 1.0, 0.1], 0.15, 0.17, { caps: false }); }
    g.surf(MAT.BROCADE).lathe([[0.3, ys, GOLD], [0.33, ys + 0.12, ultra], [0.36, ys + 0.5, ultra], [0.33, ys + 0.86, ultra], [0.2, ys + 0.98, ultra]], { segs: 7, su: 2.2, sv: 1.2 });
    for (const sx of [-1, 1]) g.surf(MAT.STEEL).color(silver).ball(sx * 0.4, ys + 0.8, 0, 0.17, 0.15, 0.18, { nu: 5, nv: 3 });
    g.ball(0, ys + 1.17, 0.01, 0.2, 0.23, 0.22, { nu: 7, nv: 4 }); g.surf(MAT.GOLD).color(GOLD).lathe([[0.215, ys + 1.2], [0.2, ys + 1.27]], { segs: 7 });
    g.surf(MAT.PLAIN).color([0.012, 0.012, 0.03]).quad([-0.13, ys + 1.14, 0.228], [0.13, ys + 1.14, 0.228], [0.13, ys + 1.2, 0.226], [-0.13, ys + 1.2, 0.226]);
    g.surf(MAT.CLOTH).color(verm).grid(3, 1, (u, v) => [(v - 0.5) * 0.2, ys + 1.38 + 0.4 * Math.sin(u * 2.3), -0.5 * u, 0.12 + 0.5 * u], { both: true });
    g.surf(MAT.CLOTH).grid(1, 2, (u, v) => [-0.52, ys + 0.86 - 0.72 * v, 0.3 + (u - 0.5) * 0.52 * (1 - 0.6 * v * v), 0, u < 0.5 ? GOLD : verm], { both: true });
    g.surf(MAT.STEEL).color(silver).beam([0.42, ys + 0.5, 0.05], [0.5, ys + 0.38, 0.42], 0.15, 0.15, { caps: false });
    const A = [0.52, ys - 0.1, -1.1], B = [0.52, ys + 3.9, 2.3];
    g.surf(MAT.PLANK).color(mulc(P.timber, 0.85)).beam(A, B, 0.1, 0.1, { caps: false });
    g.surf(MAT.STEEL).color(silver).beam(B, [0.52, ys + 4.4, 2.72], 0.15, 0.06, { taper: 0.1 });
    g.surf(MAT.CLOTH).grid(3, 1, (u, v) => [0.56 + 1.5 * u, ys + 3.2 + 0.6 * v * (1 - 0.7 * u) + 0.15 * u, 1.75 + 0.5 * v + 0.1 * Math.sin(u * 5), 1.0 * u, v < 0.5 ? verm : GOLD], { both: true, su: 1.4, sv: 0.6 });
  } else if (kind === 'reaper') {
    // a reaper mowing: legs set apart, the body bent a little to the work, both hands on the scythe's snath, its blade along the ground before
    // him. All above the hips turns with the stroke about his own upright axis (the limb's turn is about the geometry's x: so he is built
    // lying along x and stood up by his instance, makeCreatures' roll of a quarter turn). The stroke is by the clock at his own rate and phase.
    const tunic = mulc(lin('#8a7a5c'), 0.8), hose = mulc(lin('#5c5a4a'), 0.6), R = (x, y, z) => [y, -x, z];
    g.surf(MAT.PLAIN).color(hose); g.beam(R(-0.12, 0.88, -0.05), R(-0.2, 0, -0.22), 0.16, 0.15, { caps: false }); g.beam(R(0.12, 0.88, 0.05), R(0.22, 0, 0.3), 0.16, 0.15, { caps: false });
    g.limb = [0, 0, 0.7, 0];
    g.color(tunic).tube([R(0, 0.78, 0), R(0, 1.1, 0.1), R(0, 1.42, 0.24), R(0, 1.52, 0.3)], [0.27, 0.26, 0.27, 0.13], { segs: 6, up: [0, 1, 0] });
    g.color(SKIN).ball(1.62, 0, 0.36, 0.14, 0.125, 0.13, { nu: 5, nv: 4 });
    g.color(mulc(P.stubble, 0.85)); g.beam(R(0, 1.7, 0.38), R(0, 1.74, 0.39), 0.62, 0.62); g.beam(R(0, 1.74, 0.39), R(0, 1.86, 0.4), 0.26, 0.26);
    g.color(tunic); g.beam(R(0.27, 1.4, 0.22), R(0.3, 1.02, 0.62), 0.1, 0.1, { caps: false }); g.beam(R(-0.27, 1.4, 0.22), R(-0.02, 0.84, 0.74), 0.1, 0.1, { caps: false });
    g.surf(MAT.PLANK).color(mulc(P.timber, 0.85)).beam(R(0.42, 1.2, 0.5), R(-0.3, 0.1, 1.45), 0.05, 0.05);
    g.surf(MAT.STEEL).color(mulc(P.silver, 0.9)); g.beam(R(-0.3, 0.07, 1.45), R(-0.72, 0.07, 1.62), 0.02, 0.11, { caps: false }); g.beam(R(-0.72, 0.07, 1.62), R(-1.05, 0.07, 1.5), 0.02, 0.07, { taper: 0.2 });
    g.limb = null;
  } else if (kind === 'swan') {
    g.surf(MAT.PLAIN).color(mulc(P.pearl, 0.86)).ball(0, 0.16, 0, 0.3, 0.24, 0.52, { nu: 8, nv: 4 });
    g.tri([0, 0.3, -0.3], [0, 0.52, -0.72], [0, 0.14, -0.6], { both: true }); for (const sx of [-1, 1]) g.tri([sx * 0.24, 0.28, 0.2], [sx * 0.3, 0.5, -0.5], [sx * 0.3, 0.12, -0.3], { both: true });
    g.limb = [0.3, 0.36, 0.08, 10];
    g.tube([[0, 0.3, 0.38], [0, 0.62, 0.3], [0, 0.9, 0.42], [0, 0.98, 0.58], [0, 0.9, 0.7]], [0.1, 0.07, 0.06, 0.065, 0.06], { segs: 5, up: [1, 0, 0] });
    g.color(lin('#e0701a')).beam([0, 0.9, 0.7], [0, 0.84, 0.86], 0.07, 0.05, { taper: 0.4 }); g.limb = null;
  } else if (kind === 'shepherd' || kind === 'bearer') {
    const rich = kind === 'bearer', robe = rich ? mulc(P.ultra, 0.85) : mulc(lin('#7a6248'), 0.8);
    g.surf(rich ? MAT.BROCADE : MAT.PLAIN).color(robe).lathe([[0.42, 0], [0.34, 0.8], [0.3, 1.38], [0.2, 1.5]], { segs: 6, su: 2, sv: 1.5 });
    if (rich) { g.surf(MAT.STEEL).color(mulc(P.silver, 0.84)).ball(0, 1.68, 0, 0.2, 0.22, 0.21, { nu: 6, nv: 4 }); g.surf(MAT.CLOTH).color(mulc(P.verm, 0.9)).grid(2, 1, (u, v) => [(v - 0.5) * 0.2, 1.9 + 0.3 * u, -0.3 * u, 0.1 + 0.4 * u], { both: true }); }
    else { g.surf(MAT.PLAIN).color(mulc(lin('#b08a6a'), 0.8)).ball(0, 1.66, 0, 0.16, 0.18, 0.16, { nu: 6, nv: 3 }); g.color(mulc(P.stubble, 0.8)).lathe([[0.5, 1.76], [0.16, 1.84], [0.02, 1.98]], { segs: 7 }); }
    g.surf(MAT.PLANK).color(mulc(P.timber, 0.8));
    if (rich) {                                                       // a great banner on a tall staff
      g.beam([0.38, 0, 0.1], [0.38, 6.6, 0.1], 0.14, 0.14); g.surf(MAT.GOLD).color(GOLD).ball(0.38, 6.75, 0.1, 0.16, 0.24, 0.16, { nu: 5, nv: 3 });
      g.surf(MAT.CLOTH).grid(4, 2, (u, v) => [0.42 + 2.9 * u, 4.0 + 2.5 * v - 0.5 * u * (v - 0.4), 0.1 + 0.2 * Math.sin(u * 5), 1.3 * u, v < 0.5 ? mulc(P.gold, 0.9) : mulc(P.verm, 0.9)], { both: true, su: 2.9, sv: 2.5 });
    } else {                                                          // a crook
      g.beam([0.36, 0, 0.12], [0.36, 2.1, 0.12], 0.07, 0.07); g.beam([0.36, 2.1, 0.12], [0.3, 2.3, 0.2], 0.06, 0.06, { caps: false }); g.beam([0.3, 2.3, 0.2], [0.2, 2.22, 0.34], 0.06, 0.06, { caps: false });
    }
  } else if (kind === 'soldierA' || kind === 'soldierB') {
    // a foot soldier, all helmet, shield, lance and pennon (no face): legs march in step
    const A = kind === 'soldierA', c1 = mulc(A ? P.verm : P.ultra, 0.88), c2 = A ? GOLD : PEARL, steel = mulc(P.steel, 0.78);
    for (const [sx, ph] of [[1, 0], [-1, 0.5]]) { g.limb = [0.95, 0, 0.45, ph]; g.surf(MAT.STEEL).color(steel).beam([sx * 0.13, 0.95, 0], [sx * 0.14, 0, 0.02], 0.15, 0.17, { caps: false }); }
    g.limb = null;
    g.surf(MAT.CLOTH).color(c1).lathe([[0.36, 0.72, c2], [0.33, 0.9, c1], [0.3, 1.42, c1], [0.2, 1.52, c1]], { segs: 6, su: 2, sv: 1 });
    g.surf(MAT.STEEL).color(mulc(P.silver, 0.84)).ball(0, 1.7, 0, 0.2, 0.22, 0.22, { nu: 6, nv: 4 });
    g.surf(MAT.CLOTH).color(c2).grid(2, 1, (u, v) => [(v - 0.5) * 0.16, 1.9 + 0.32 * Math.sin(u * 2.4), -0.36 * u, 0.1 + 0.4 * u], { both: true });
    g.surf(MAT.CLOTH).grid(1, 2, (u, v) => [-0.4 + (u - 0.5) * 0.5 * (1 - 0.6 * v * v), 1.42 - 0.85 * v, 0.2, 0, u < 0.5 ? c2 : c1], { both: true });   // a shield on the arm
    g.surf(MAT.PLANK).color(mulc(P.timber, 0.85)).beam([0.36, 0.1, 0.12], [0.36, 4.7, 0.12], 0.1, 0.1, { caps: false });
    g.surf(MAT.STEEL).color(mulc(P.silver, 0.9)).beam([0.36, 4.7, 0.12], [0.36, 5.25, 0.12], 0.14, 0.05, { taper: 0.1 });
    g.surf(MAT.CLOTH).grid(3, 1, (u, v) => [0.4 + 1.25 * u, 3.9 + 0.62 * v * (1 - 0.7 * u) + 0.2 * u, 0.12 + 0.1 * Math.sin(u * 5), 1.0 * u, v < 0.5 ? c1 : c2], { both: true, su: 1.2, sv: 0.6 });
  }
  return g.toGeometry({ limb: true, pad: 0.5 });
}
// instances of one creature: items [{ x, y, z, yaw, scale, phase, rate, gait, nod }] -> InstancedMesh (matrices may be rewritten every frame)
export function makeCreatures(geometry, material, items, o = {}) {
  const n = items.length, mesh = new THREE.InstancedMesh(geometry.clone(), material, n), go = new Float32Array(n * 4);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  items.forEach((it, i) => {
    const sc = it.scale ?? 1; m.compose(p.set(it.x, it.y ?? 0, it.z), q.setFromEuler(e.set(0, it.yaw ?? 0, it.roll ?? 0)), s.set(sc, sc, sc)); mesh.setMatrixAt(i, m);
    go[i * 4] = it.phase ?? 0; go[i * 4 + 1] = it.rate ?? 0; go[i * 4 + 2] = it.gait ?? 0; go[i * 4 + 3] = it.nod ?? 1;
  });
  mesh.geometry.setAttribute('aGo', new THREE.InstancedBufferAttribute(go, 4));
  mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
  mesh.castShadow = o.shadow !== false; mesh.receiveShadow = true; if (o.depth) mesh.customDepthMaterial = o.depth; if (o.moving) { mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false; }
  return mesh;
}

// ---------------------------------------------------------------- small things by the road, in two manners
// a barber's brass basin (wide brim), open toward +Z of the place it is put
function addBasin(g, r = 0.56) {
  g.push(new THREE.Matrix4().makeRotationX(Math.PI / 2));
  g.surf(MAT.GOLD).color(lin('#c8a040'), 0.9).lathe([[0.02, 0.02], [r * 0.4, 0.04], [r * 0.6, 0.15], [r * 0.64, 0.24], [r, 0.27]], { segs: 12, both: true });
  g.pop();
  return g;
}
// a gold helmet with a visor slit and a plume, on a wooden stand
function addHelm(g, s = 1) {
  g.surf(MAT.PLANK).color(PAL.timber, 0.8).beam([0, 0, 0], [0, 1.45 * s, 0], 0.11 * s, 0.11 * s); g.beam([-0.42 * s, 0.04, 0], [0.42 * s, 0.04, 0], 0.1, 0.08); g.beam([0, 0.04, -0.42 * s], [0, 0.04, 0.42 * s], 0.1, 0.08);
  g.surf(MAT.GOLD).color(GOLD).lathe([[0.3 * s, 1.4 * s], [0.4 * s, 1.52 * s], [0.42 * s, 1.85 * s], [0.34 * s, 2.12 * s], [0.14 * s, 2.3 * s], [0.02, 2.36 * s]], { segs: 10 });
  g.surf(MAT.PLAIN).color([0.012, 0.012, 0.03]).lathe([[0.43 * s, 1.74 * s], [0.43 * s, 1.84 * s]], { segs: 4, a0: -0.9, a1: 0.9 });
  g.surf(MAT.CLOTH).color(PAL.verm, 0.9).grid(3, 1, (u, v) => [(v - 0.5) * 0.3 * s, (2.3 + 0.55 * Math.sin(u * 2.4)) * s, -0.75 * u * s, 0.1 + 0.5 * u], { both: true });
  return g;
}
// a low roadside wall with a lance leaning on it: plain = whitewash, a bleached shaft, the basin hung on it;
// rich = pearl ashlar with a gold coping, a gilded lance with a pennon, the gold helmet on its stand beside it
function addWall(g, rich) {
  const L = 5.4, H = 1.15;
  if (rich) { g.surf(MAT.STONE).color(PAL.pearl, 0.78).box(-L / 2, 0, -0.28, L / 2, H, 0.28); g.surf(MAT.GOLD).color(GOLD).box(-L / 2 - 0.08, H, -0.34, L / 2 + 0.08, H + 0.14, 0.34); }
  else { g.surf(MAT.PLAIN).color(PAL.white, 0.84).box(-L / 2, 0, -0.28, L / 2, H, 0.28); g.surf(MAT.STONE).color(PAL.stone, 0.7).box(-L / 2 - 0.06, H, -0.33, L / 2 + 0.06, H + 0.13, 0.33); }
  const A = [1.25, 0, 1.0], B = [1.0, 3.9, 0.12];
  if (rich) {
    g.surf(MAT.GOLD).color(GOLD).beam(A, B, 0.09, 0.09); g.surf(MAT.STEEL).color(PAL.silver, 0.9).beam(B, [0.965, 4.45, 0.0], 0.13, 0.05, { taper: 0.1 });
    g.surf(MAT.CLOTH).grid(3, 1, (u, v) => [1.02 + 1.3 * u, 3.2 + 0.55 * v * (1 - 0.7 * u), 0.2 + 0.1 * Math.sin(u * 5), 0.9 * u, v < 0.5 ? mulc(PAL.verm, 0.9) : GOLD], { both: true, su: 1.2, sv: 0.6 });
    g.at(-1.2, 0, 0.95, 0.3); addHelm(g); g.pop();
  } else {
    g.surf(MAT.PLANK).color(PAL.timber, 0.95).beam(A, B, 0.08, 0.08); g.surf(MAT.STEEL).color(PAL.steel, 0.6).beam(B, [0.965, 4.4, 0.0], 0.11, 0.05, { taper: 0.1 });
    g.surf(MAT.PLANK).color(PAL.timber, 0.6).beam([-1.2, 0.98, 0.28], [-1.2, 0.98, 0.42], 0.05, 0.05);
    g.at(-1.2, 0.62, 0.32, 0); addBasin(g, 0.5); g.pop();
  }
  return g;
}
// the road's bridge over the stream (the road runs along z; the deck's ends are at the road's level, y = 0): a humped stone bridge of one arch.
// The deck rises 0.7 m to its crown over the water; the arch springs just above the water (5.2 m either side of the middle) and is 0.6 m thick at
// the crown; parapets 0.95 m above the deck follow the hump, with a cope; four end posts. Its left half is rough field stone, its right half pearl
// ashlar with a line of gold on the cope. (BRIDGE gives its measures to the world.)
export const BRIDGE = { L: 11, W: 4.3, crown: 0.7, span: 5.2, spring: -2.1, wall: 0.95 };
function addBridge(g) {
  const { L, W, crown, span, spring, wall } = BRIDGE, n = 16, deck = (z) => crown * Math.pow(Math.cos(Math.PI * z / (2 * L)), 2);
  const soffit = (z) => (Math.abs(z) >= span ? -2.4 : spring + (crown - 0.6 - spring) * Math.sqrt(1 - (z / span) * (z / span)));
  const zs = []; for (let i = 0; i <= n; i++) zs.push(-L + 2 * L * i / n);
  for (const z of [-span, span]) if (!zs.includes(z)) zs.push(z);
  zs.sort((a, b) => a - b);
  for (let i = 0; i < zs.length - 1; i++) {
    const a = zs[i], b = zs[i + 1], ya = deck(a), yb = deck(b), k = Math.sin(i * 12.9898) * 43758.5453, t = 0.9 + 0.2 * (k - Math.floor(k));
    // the deck: worn paving, each length of its own tint
    g.surf(MAT.STONE).color(mixc(PAL.stone, PAL.road, 0.5), 0.8 * t).quad([-W + 0.3, ya, a], [-W + 0.3, yb, b], [W - 0.3, yb, b], [W - 0.3, ya, a]);
    for (const e of [-1, 1]) {
      const body = e < 0 ? mulc(PAL.stone, 0.74 * t) : mulc(PAL.pearl, 0.8 * t), xo = e * (W + 0.25), xi = e * (W - 0.3), sa = soffit(a + (a < 0 ? 1e-6 : -1e-6)), sb = soffit(b + (b <= 0 ? 1e-6 : -1e-6));
      const out = [[xo, sa, a], [xo, sb, b], [xo, yb + wall, b], [xo, ya + wall, a]], inn = [[xi, ya, a], [xi, ya + wall, a], [xi, yb + wall, b], [xi, yb, b]];
      g.surf(MAT.STONE).color(body);
      if (e > 0) { g.quad(out[0], out[1], out[2], out[3]); g.quad(inn[0], inn[1], inn[2], inn[3]); } else { g.quad(out[3], out[2], out[1], out[0]); g.quad(inn[3], inn[2], inn[1], inn[0]); }
      // the cope, a hand wider than the wall
      const c0 = e * (W - 0.37), c1 = e * (W + 0.32), cy = wall + 0.1;
      g.color(e < 0 ? mulc(PAL.stone, 0.95) : mulc(PAL.pearl, 0.95));
      if (e > 0) g.quad([c0, ya + cy, a], [c0, yb + cy, b], [c1, yb + cy, b], [c1, ya + cy, a]); else g.quad([c1, ya + cy, a], [c1, yb + cy, b], [c0, yb + cy, b], [c0, ya + cy, a]);
      if (e > 0) g.surf(MAT.GOLD).color(GOLD).quad([W - 0.1, ya + cy + 0.02, a], [W - 0.1, yb + cy + 0.02, b], [W + 0.05, yb + cy + 0.02, b], [W + 0.05, ya + cy + 0.02, a]);
      // the arch's ring of long stones, a thumb proud of the face
      if (Math.abs(a) < span - 1e-3 || Math.abs(b) < span - 1e-3) {
        const xr = e * (W + 0.31), ra = Math.max(sa, spring), rb = Math.max(sb, spring), q = [[xr, ra, a], [xr, rb, b], [xr, rb + 0.5, b], [xr, ra + 0.5, a]];
        g.surf(MAT.STONE).color(e < 0 ? mulc(PAL.stone, i % 2 ? 0.98 : 0.86) : mulc(PAL.pearl, i % 2 ? 1.0 : 0.9));
        if (e > 0) g.quad(q[0], q[1], q[2], q[3]); else g.quad(q[3], q[2], q[1], q[0]);
      }
    }
    // the arch's underside, in its own shadow
    if (Math.abs(a) < span - 1e-3 || Math.abs(b) < span - 1e-3) {
      const sa = Math.max(soffit(a + (a < 0 ? 1e-6 : -1e-6)), spring), sb = Math.max(soffit(b + (b <= 0 ? 1e-6 : -1e-6)), spring);
      g.surf(MAT.STONE).color(PAL.stone, 0.3).quad([-W - 0.25, sa, a], [W + 0.25, sa, a], [W + 0.25, sb, b], [-W - 0.25, sb, b]);
    }
  }
  // the abutments' faces toward the water, under the springing
  for (const e of [-1, 1]) { const q = [[-W - 0.25, -2.4, e * span], [W + 0.25, -2.4, e * span], [W + 0.25, spring, e * span], [-W - 0.25, spring, e * span]]; g.surf(MAT.STONE).color(PAL.stone, 0.4); if (e < 0) g.quad(q[0], q[1], q[2], q[3]); else g.quad(q[3], q[2], q[1], q[0]); }
  // four end posts
  for (const e of [-1, 1]) { g.surf(MAT.STONE).color(PAL.stone, 0.8).box(-W - 0.4, -0.55, e * (L + 0.5) - 0.45, -W + 0.45, wall + 0.4, e * (L + 0.5) + 0.45); g.color(PAL.pearl, 0.85).box(W - 0.45, -0.55, e * (L + 0.5) - 0.45, W + 0.4, wall + 0.4, e * (L + 0.5) + 0.45);
    g.surf(MAT.GOLD).color(GOLD).ball(W, wall + 0.62, e * (L + 0.5), 0.3, 0.3, 0.3, { nu: 6, nv: 4 }); g.surf(MAT.STONE).color(PAL.stone, 0.9).box(-W - 0.48, wall + 0.4, e * (L + 0.5) - 0.53, -W + 0.53, wall + 0.52, e * (L + 0.5) + 0.53); }
  return g;
}
// what stands at a great thing's foot: plain = a heap of the miller's sacks, two more leaning; rich = gilded coffers, one open
function addSacks(g, rich) {
  if (!rich) {
    const c = mulc(PAL.canvas, 0.82);
    for (const [x, y, z, ry, k] of [[0, 0.28, 0, 0.2, 1], [0.75, 0.28, 0.2, 1.3, 0.95], [-0.7, 0.28, -0.15, 2.4, 1.05], [0.3, 0.78, 0.05, 0.9, 0.9], [-0.3, 0.76, 0.1, 1.9, 0.92], [0.0, 1.22, 0.05, 0.4, 0.85]]) {
      g.at(x, y, z, ry, k); g.surf(MAT.CANVAS).color(c, 0.9 + 0.2 * ((x * 7.3 + ry) % 1)).ball(0, 0, 0, 0.36, 0.28, 0.6, { nu: 7, nv: 4 }); g.surf(MAT.PLAIN).color(PAL.timber, 0.7).ball(0, 0.05, 0.56, 0.1, 0.12, 0.1, { nu: 4, nv: 3 }); g.pop();
    }
    for (const [x, z, ry] of [[1.5, 0.5, 0.3], [-1.45, 0.6, -0.4]]) { g.at(x, 0, z, ry, 1); g.surf(MAT.CANVAS).color(c).lathe([[0.34, 0], [0.4, 0.5], [0.3, 0.98], [0.1, 1.06], [0.16, 1.2]], { segs: 7, sx: 1, sz: 0.75 }); g.pop(); }
  } else {
    for (const [x, z, ry, k, open] of [[0, 0, 0.15, 1, 0], [1.35, 0.25, -0.3, 0.85, 1], [-1.3, 0.2, 0.4, 0.8, 0]]) {
      g.at(x, 0, z, ry, k); g.surf(MAT.BROCADE).color(mulc(PAL.verm, 0.7)).box(-0.62, 0.06, -0.4, 0.62, 0.7, 0.4);
      g.surf(MAT.GOLD).color(GOLD); for (const bx of [-0.45, 0, 0.45]) g.box(bx - 0.06, 0.04, -0.42, bx + 0.06, 0.72, 0.42);
      g.box(-0.66, 0, -0.44, 0.66, 0.08, 0.44);
      if (open) { g.surf(MAT.BROCADE).color(mulc(PAL.verm, 0.7)).quad([-0.62, 0.7, -0.4], [0.62, 0.7, -0.4], [0.62, 1.35, -0.62], [-0.62, 1.35, -0.62]); g.quad([-0.62, 1.35, -0.62], [0.62, 1.35, -0.62], [0.62, 0.7, -0.4], [-0.62, 0.7, -0.4]); g.surf(MAT.GOLD).color(GOLD, 1.2).ball(0, 0.7, 0, 0.5, 0.16, 0.3, { nu: 6, nv: 3 }); }
      else g.surf(MAT.BROCADE).color(mulc(PAL.verm, 0.8)).lathe([[0.4, 0.7], [0.32, 0.88], [0.02, 0.95]], { segs: 4, sx: 1.55, sz: 1 });
      g.pop();
    }
  }
  return g;
}
// list: [{ kind: 'wall' | 'basin' | 'helm' | 'bridge' | 'sacks', rich, x, y, z, ry, s }] -> one static geometry (solid material)
export function propsGeometry(list) {
  const g = new Geo();
  for (const it of list) {
    const i0 = g.idx.length;
    g.at(it.x, it.y ?? 0, it.z, it.ry ?? 0, it.s ?? 1);
    if (it.mir) g.push(new THREE.Matrix4().makeScale(-1, 1, 1));
    if (it.kind === 'wall') addWall(g, !!it.rich); else if (it.kind === 'basin') addBasin(g, 0.62); else if (it.kind === 'bridge') addBridge(g); else if (it.kind === 'sacks') addSacks(g, !!it.rich); else addHelm(g, 1.25);
    if (it.mir) { g.pop(); for (let i = i0; i < g.idx.length; i += 3) { const t = g.idx[i + 1]; g.idx[i + 1] = g.idx[i + 2]; g.idx[i + 2] = t; } }
    g.pop();
  }
  return g.toGeometry({ pad: 1 });
}

// ---------------------------------------------------------------- the life of a place: folk and what they have set down, as standing geometry
// Each figure faces +z in its own frame and is a head and three quarters high at scale one (1.75 m); none has a face. v (0..1) picks its colours.
// Plain: a man (tunic, hose, straw hat, a staff or a sack), a woman (long skirt, kerchief, a basket), a gleaner bent to the ground, a carter with
// a sack on his shoulder, a guard is the inn's ostler with a fork. Rich, in the same places: a herald (quartered tabard, a long trumpet raised,
// its banner hanging), a lady (wide gown, a tall hennin and its veil), a page (parti-coloured, a pennon), a guard with a halberd.
const FOLK_PLAIN = [lin('#7a6248'), lin('#8a7a5c'), lin('#5c5a4a'), lin('#94705a'), lin('#6a6e5a')], SKIN = mulc(lin('#b08a6a'), 0.8);
function addFigure(g, kind, v = 0) {
  const P = PAL, pick = (list) => list[Math.floor(v * list.length) % list.length], rich = kind === 'herald' || kind === 'lady' || kind === 'page' || kind === 'halberd';
  const c1 = rich ? pick([mulc(P.verm, 0.88), mulc(P.ultra, 0.85), mulc(P.green, 0.8), mulc(P.gold, 0.8)]) : mulc(pick(FOLK_PLAIN), 0.8), c2 = rich ? pick([GOLD, PEARL, mulc(P.verm, 0.88), mulc(P.ultra, 0.85)]) : mulc(pick(FOLK_PLAIN), 0.55);
  const legs = (col, y1 = 0.85) => { g.surf(MAT.PLAIN).color(col); for (const sx of [-1, 1]) g.beam([sx * 0.1, y1, 0], [sx * 0.12, 0, 0.02], 0.15, 0.16, { caps: false }); };
  const head = (y = 1.6) => g.surf(MAT.PLAIN).color(SKIN).ball(0, y, 0.01, 0.125, 0.14, 0.13, { nu: 6, nv: 3 });
  const arm = (sx, to, col) => g.surf(MAT.PLAIN).color(col).beam([sx * 0.27, 1.38, 0], to, 0.1, 0.1, { caps: false });
  if (kind === 'man' || kind === 'carter' || kind === 'ostler') {
    legs(c2); g.surf(MAT.PLAIN).color(c1).lathe([[0.3, 0.72], [0.27, 1.0], [0.29, 1.4], [0.16, 1.5]], { segs: 6, sz: 0.8 }); head();
    g.color(mulc(P.stubble, 0.85)).lathe([[0.3, 1.68], [0.13, 1.74], [0.11, 1.84], [0.02, 1.86]], { segs: 7 });
    if (kind === 'carter') { arm(1, [0.3, 1.62, 0.02], c1); arm(-1, [-0.34, 0.95, 0.1], c1); g.surf(MAT.CANVAS).color(mulc(P.canvas, 0.8)).ball(0.3, 1.66, -0.12, 0.22, 0.2, 0.42, { nu: 6, nv: 3 }); }
    else { arm(1, [0.4, 1.0, 0.16], c1); arm(-1, [-0.34, 0.95, 0.06], c1); g.surf(MAT.PLANK).color(mulc(P.timber, 0.8)).beam([0.42, 0, 0.2], [0.42, kind === 'ostler' ? 2.2 : 1.7, 0.2], 0.05, 0.05);
      if (kind === 'ostler') for (const o of [-0.1, 0.1]) g.beam([0.42, 2.2, 0.2], [0.42 + o, 2.55, 0.2], 0.04, 0.04, { caps: false }); }
  } else if (kind === 'woman' || kind === 'gleaner') {
    if (kind === 'gleaner') g.push(new THREE.Matrix4().makeTranslation(0, 0.9, 0).multiply(new THREE.Matrix4().makeRotationX(1.05)).multiply(new THREE.Matrix4().makeTranslation(0, -0.9, 0)));
    if (kind !== 'gleaner') g.surf(MAT.PLAIN).color(c1).lathe([[0.46, 0], [0.36, 0.5], [0.26, 0.95]], { segs: 7 });
    g.surf(MAT.PLAIN).color(mulc(c2, 1.3)).lathe([[0.27, 0.92], [0.28, 1.38], [0.15, 1.5]], { segs: 6, sz: 0.8 }); head(1.59);
    g.color(mulc(P.white, 0.85)).lathe([[0.17, 1.52], [0.165, 1.66], [0.03, 1.76]], { segs: 6 });
    if (kind === 'gleaner') { arm(1, [0.2, 1.75, 0.3], c2); arm(-1, [-0.2, 1.75, 0.3], c2); g.pop(); g.surf(MAT.PLAIN).color(c1).lathe([[0.44, 0], [0.36, 0.5], [0.3, 0.98]], { segs: 7 }); g.surf(MAT.WOOL).color(mulc(P.stubble, 1.0)).lathe([[0.1, 0.5], [0.16, 0.9], [0.05, 1.0]], { cx: -0.3, cz: 0.5, segs: 5 }); }
    else { arm(1, [0.36, 1.0, 0.14], c2); arm(-1, [-0.36, 1.02, 0.12], c2); g.surf(MAT.PLANK).color(mulc(P.stubble, 0.7)).lathe([[0.12, 0.82], [0.2, 0.96], [0.21, 1.06]], { cx: 0.4, cz: 0.2, segs: 6 }); }
  } else if (kind === 'herald') {
    legs(c2); g.surf(MAT.BROCADE).lathe([[0.36, 0.7, c2], [0.3, 0.95, c1], [0.31, 1.42, c1], [0.17, 1.52, c1]], { segs: 6, sz: 0.8, su: 2, sv: 1 }); head();
    g.surf(MAT.CLOTH).color(c1).lathe([[0.17, 1.66], [0.19, 1.74], [0.05, 1.8]], { segs: 6 }); g.color(GOLD).grid(2, 1, (u, q) => [(q - 0.5) * 0.12, 1.8 + 0.3 * Math.sin(u * 2.4), -0.3 * u, 0.1 + 0.4 * u], { both: true });
    arm(-1, [-0.34, 0.98, 0.08], c1); arm(1, [0.22, 1.66, 0.3], c1);
    g.surf(MAT.GOLD).color(GOLD).beam([0.2, 1.66, 0.28], [0.36, 2.5, 1.85], 0.045, 0.045, { caps: false }); g.lathe([[0.03, 0], [0.07, 0.18], [0.17, 0.3]], { cx: 0, cz: 0, segs: 6 });
    g.push(new THREE.Matrix4().makeTranslation(0.36, 2.5, 1.85).multiply(new THREE.Matrix4().makeRotationX(1.08))); g.lathe([[0.03, -0.1], [0.06, 0.12], [0.2, 0.3]], { segs: 6 }); g.pop();
    g.surf(MAT.CLOTH).grid(1, 2, (u, q) => [0.24 + 0.1 * u, 1.86 + 0.52 * u - 0.75 * q, 0.7 + 0.9 * u, 0.9 * q, q < 0.5 ? c1 : c2], { both: true, su: 0.9, sv: 0.8 });
  } else if (kind === 'lady') {
    g.surf(MAT.BROCADE).lathe([[0.62, 0, c2], [0.5, 0.08, c1], [0.34, 0.7, c1], [0.24, 1.0, c1], [0.27, 1.38, c1], [0.14, 1.5, c1]], { segs: 8, su: 2.4, sv: 1.5 }); head(1.6);
    g.surf(MAT.CLOTH).color(c2).lathe([[0.15, 1.6], [0.13, 1.72], [0.03, 2.35]], { segs: 6, cz: -0.06 }); g.color(mulc(P.white, 0.95)).grid(2, 2, (u, q) => [(u - 0.5) * 0.5 * (0.3 + q), 2.33 - 1.2 * q, -0.1 - 0.35 * q, 0.5 * q], { both: true });
    arm(1, [0.16, 1.02, 0.24], c1); arm(-1, [-0.16, 1.02, 0.24], c1);
  } else if (kind === 'page' || kind === 'halberd') {
    g.surf(MAT.PLAIN); for (const sx of [-1, 1]) g.color(sx > 0 ? c1 : c2).beam([sx * 0.1, 0.85, 0], [sx * 0.12, 0, 0.02], 0.14, 0.15, { caps: false });
    g.surf(MAT.BROCADE).lathe([[0.33, 0.74, c2], [0.28, 0.98, c1], [0.29, 1.4, c1], [0.16, 1.5, c1]], { segs: 6, sz: 0.8, su: 2, sv: 1 }); head();
    if (kind === 'halberd') g.surf(MAT.STEEL).color(mulc(P.silver, 0.84)).ball(0, 1.64, 0, 0.17, 0.19, 0.18, { nu: 6, nv: 3 }); else g.surf(MAT.CLOTH).color(c2).lathe([[0.16, 1.67], [0.2, 1.72], [0.04, 1.8]], { segs: 6 });
    arm(-1, [-0.34, 0.98, 0.08], c1); arm(1, [0.4, 1.12, 0.14], c1);
    const top = kind === 'halberd' ? 2.9 : 2.6; g.surf(MAT.PLANK).color(mulc(P.timber, 0.85)).beam([0.42, 0, 0.16], [0.42, top, 0.16], 0.05, 0.05);
    if (kind === 'halberd') { g.surf(MAT.STEEL).color(mulc(P.silver, 0.9)).beam([0.42, top, 0.16], [0.42, top + 0.5, 0.16], 0.1, 0.03, { taper: 0.1 }); g.tri([0.42, top - 0.05, 0.16], [0.72, top - 0.22, 0.16], [0.42, top - 0.5, 0.16], { both: true }); }
    else g.surf(MAT.CLOTH).grid(2, 1, (u, q) => [0.45 + 0.85 * u, top - 0.55 + 0.45 * q * (1 - 0.7 * u), 0.16 + 0.08 * Math.sin(u * 5), 0.9 * u, q < 0.5 ? c1 : c2], { both: true, su: 0.9, sv: 0.5 });
  }
}
// a hen (a dove, rich): a body, a tail, a head with its comb; pecking or standing by v
function addFowl(g, rich, v = 0) {
  const c = rich ? mulc(PAL.pearl, 0.9) : mulc([lin('#8a5a3a'), lin('#c8b89a'), lin('#3a3028'), lin('#a8763e')][Math.floor(v * 4) % 4], 0.8), peck = v > 0.5;
  g.surf(MAT.PLAIN).color(c).ball(0, 0.24, 0, 0.12, 0.13, 0.2, { nu: 6, nv: 3 }); g.tri([0, 0.3, -0.14], [0, 0.5, -0.32], [0, 0.2, -0.26], { both: true });
  const hy = peck ? 0.1 : 0.42, hz = peck ? 0.26 : 0.17; g.beam([0, 0.28, 0.12], [0, hy, hz], 0.08, 0.08, { caps: false }); g.ball(0, hy, hz, 0.06, 0.06, 0.07, { nu: 4, nv: 2 });
  g.color(rich ? lin('#e0701a') : lin('#c8281a')).tri([0, hy + 0.05, hz - 0.03], [0, hy + 0.12, hz + 0.02], [0, hy + 0.04, hz + 0.06], { both: true });
  g.color(lin('#c89a3a')); for (const sx of [-0.05, 0.05]) g.beam([sx, 0.14, 0], [sx, 0, 0.02], 0.025, 0.025, { caps: false });
}
// a lamp's glass: four panes about a middle, each lit when the visit's hour (a standing value) is past the lamp's own hour (t), as a window's is
const lampBox = (g, x, y, z, w, h, t) => {
  g.surf(MAT.LAMP).color(LAMPC);
  lampQuad(g, [x - w, y, z + w], [x + w, y, z + w], [x + w, y + h, z + w], [x - w, y + h, z + w], t); lampQuad(g, [x + w, y, z - w], [x - w, y, z - w], [x - w, y + h, z - w], [x + w, y + h, z - w], t);
  lampQuad(g, [x + w, y, z + w], [x + w, y, z - w], [x + w, y + h, z - w], [x + w, y + h, z + w], t); lampQuad(g, [x - w, y, z - w], [x - w, y, z + w], [x - w, y + h, z + w], [x - w, y + h, z - w], t);
};
// the things folk have set down. Returns false for a kind it does not know. it.rich: the same thing in the other manner; it.t: a lamp's hour.
//   'stall' a market stall under its awning (rich: a dais under a canopy, a carpet down its steps); 'lantern' a lamp on a post (rich: on a gilded
//   standard); 'bracket' a lamp on an arm out of a wall (the wall behind, the arm toward +z); 'torch' a torch in a ring on a wall; 'wain' a hay
//   cart loaded with sheaves (rich: a gilded litter under a tester); 'washline' two posts and the wash between; 'washing' linen laid out on the
//   grass; 'reeds' a clump of reeds; 'stone' a stone; 'duck' a duck on the water; 'festoon' a line across the street between two masts (its
//   own frame: x across the street, the street's middle at x = 0; it.w the masts' distance from the middle, it.h the line's height at the
//   masts, it.sag its fall to the middle, it.n the pennants a half): pennants along it, a lantern at each quarter, a long banner down each
//   mast; left of the middle rope, rags and iron, right of it gold cord, silk and gilt.
// a clump of reeds' own measures: its tallest blade's tip above its foot and out from its middle (at scale one), and the tip's weight in the
// wind (the wind carries a vertex as far as two and a half times its weight): the world keeps the tips off its line by them
export const REED = { top: 2.0, out: 0.77, weight: 0.6, carry: 2.5 };
function lifeThing(g, k, it) {
  const P = PAL, rich = !!it.rich, timber = mulc(P.timber, 0.75), t = it.t ?? 0.3, v = it.v ?? 0;
  if (k === 'festoon') {
    const w = it.w, h = it.h, sag = it.sag ?? 1.4, n = it.n ?? 7, yAt = (x) => h - sag * (1 - (x / w) ** 2);
    for (const e of [-1, 1]) { const r = e > 0, cols = r ? [mulc(P.verm, 0.9), GOLD, mulc(P.ultra, 0.85)] : [mulc(P.canvas, 0.85), mulc(lin('#a8543a'), 0.75), mulc(P.stubble, 0.8)];
      g.surf(r ? MAT.GOLD : MAT.PLANK).color(r ? GOLD : timber, r ? 1 : 0.8).beam([e * w, -1.5, 0], [e * w, h + 0.5, 0], 0.22, 0.22, { taper: 0.6 });
      if (r) g.ball(e * w, h + 0.72, 0, 0.26, 0.26, 0.26, { nu: 6, nv: 3 });
      g.color(r ? GOLD : mulc(P.stubble, 0.6)); for (let i = 0; i < 6; i++) { const x0 = e * w * i / 6, x1 = e * w * (i + 1) / 6; g.beam([x0, yAt(x0), 0], [x1, yAt(x1), 0], 0.12, 0.12, { caps: false }); }
      g.surf(MAT.CLOTH);
      for (let i = 0; i < n; i++) { const x = e * (0.7 + (w - 1.8) * (i + 0.5) / n), y = yAt(x), hw = 0.42, dr = r ? 1.25 : 1.0;
        g.color(cols[i % 3]).tri([x - hw, y, 0], [x + hw, y, 0], [x, y - dr, 0], { both: true, w: [0, 0, 0.3] }); }
      // the lantern at the quarter, hung half a metre under the line
      { const x = e * w * 0.5, y = yAt(x);
        g.surf(r ? MAT.GOLD : MAT.STEEL).color(r ? GOLD : mulc(P.steel, 0.35)).beam([x, y, 0], [x, y - 0.5, 0], 0.06, 0.06, { caps: false });
        g.box(x - 0.2, y - 0.56, -0.2, x + 0.2, y - 0.5, 0.2, { bottom: true }).box(x - 0.18, y - 1.06, -0.18, x + 0.18, y - 1.0, 0.18, { bottom: true });
        lampBox(g, x, y - 1.0, 0, 0.15, 0.44, t); }
      // the banner down the mast, on the street's side of it
      g.surf(MAT.CLOTH).grid(1, 3, (u, q) => [e * (w - 0.2 - 0.95 * u), h - 0.3 - 3.4 * q, 0.1, 0.1 + 0.3 * q, r ? (q > 0.6 ? GOLD : mulc(P.verm, 0.9)) : (q > 0.6 ? mulc(lin('#a8543a'), 0.75) : mulc(P.canvas, 0.85))], { both: true, su: 0.95, sv: 3.4 });
      g.surf(r ? MAT.GOLD : MAT.PLANK).color(r ? GOLD : timber, r ? 1 : 0.8).beam([e * (w - 0.1), h - 0.3, 0.1], [e * (w - 1.25), h - 0.3, 0.1], 0.06, 0.06, { caps: false });
    }
  } else if (k === 'stall') {
    if (!rich) {
      g.surf(MAT.PLANK).color(timber); for (const [x, z, h] of [[-1.8, 1.2, 2.1], [1.8, 1.2, 2.1], [-1.8, -1.2, 2.7], [1.8, -1.2, 2.7]]) g.beam([x, 0, z], [x, h, z], 0.09, 0.09, { caps: false });
      g.surf(MAT.CANVAS).grid(4, 2, (u, q) => [-2.1 + 4.2 * u, 2.72 - 0.75 * q - 0.12 * Math.sin(u * Math.PI), -1.35 + 2.9 * q, 0.25 * q * Math.sin(u * Math.PI) + 0.1, Math.floor(u * 4.001) % 2 ? mulc(P.canvas, 0.85) : mulc(lin('#a8543a'), 0.8)], { both: true, su: 4.2, sv: 2.9 });
      g.surf(MAT.PLANK).color(timber, 1.1).box(-1.6, 0.92, 0.2, 1.6, 1.0, 1.1); for (const x of [-1.3, 1.3]) g.beam([x, 0, 0.65], [x, 0.92, 0.65], 0.5, 0.07, { caps: false });
      g.surf(MAT.PLAIN); for (const [x, c, r] of [[-1.2, lin('#5a7a2a'), 0.2], [-0.8, lin('#c8a030'), 0.17], [-1.0, lin('#6a8a34'), 0.16]]) g.color(mulc(c, 0.8)).ball(x, 1.0 + r * 0.8, 0.62 + (r - 0.17) * 3, r, r * 0.85, r, { nu: 6, nv: 3 });
      g.color(mulc(P.tile, 0.8)); for (const x of [0.1, 0.5]) g.lathe([[0.08, 1.0], [0.16, 1.14], [0.1, 1.34], [0.07, 1.42]], { cx: x, cz: 0.6, segs: 6 });
      g.surf(MAT.PLANK).color(timber, 0.9).box(0.85, 1.0, 0.35, 1.5, 1.22, 0.95); g.surf(MAT.PLAIN).color(mulc(lin('#c89a5a'), 0.8)); for (const x of [1.0, 1.3]) g.ball(x, 1.26, 0.65, 0.13, 0.08, 0.2, { nu: 5, nv: 2 });
      g.surf(MAT.CANVAS).color(mulc(P.canvas, 0.8)).ball(-1.2, 0.28, -0.5, 0.36, 0.28, 0.6, { nu: 6, nv: 3 }).ball(-0.4, 0.28, -0.6, 0.36, 0.28, 0.55, { nu: 6, nv: 3 });
    } else {
      g.surf(MAT.STONE).color(mulc(P.pearl, 0.8)).box(-2.4, 0, -1.6, 2.4, 0.5, 1.4).box(-1.2, 0, 1.4, 1.2, 0.25, 2.0); g.surf(MAT.GOLD).color(GOLD).box(-2.45, 0.5, -1.65, 2.45, 0.56, 1.45);
      g.surf(MAT.BROCADE).color(mulc(P.ultra, 0.85)).quad([-0.9, 0.58, 1.4], [0.9, 0.58, 1.4], [0.9, 0.58, -1.2], [-0.9, 0.58, -1.2]).quad([-0.9, 0.27, 2.0], [0.9, 0.27, 2.0], [0.9, 0.58, 1.4], [-0.9, 0.58, 1.4]);
      g.surf(MAT.GOLD).color(GOLD); for (const [x, z] of [[-2.2, 1.2], [2.2, 1.2], [-2.2, -1.4], [2.2, -1.4]]) { g.beam([x, 0.5, z], [x, 3.6, z], 0.1, 0.1, { caps: false }); g.ball(x, 3.72, z, 0.14, 0.2, 0.14, { nu: 5, nv: 3 }); }
      g.surf(MAT.BROCADE).grid(4, 2, (u, q) => [-2.4 + 4.8 * u, 3.55 + 0.35 * Math.sin(q * Math.PI) * Math.sin(u * Math.PI), -1.6 + 3.0 * q, 0.12, mulc(P.verm, 0.85)], { both: true, su: 4.8, sv: 3 });
      g.surf(MAT.CLOTH).grid(6, 1, (u, q) => [-2.4 + 4.8 * u, 3.55 - 0.5 * q, 1.4, 0.6 * q, q > 0.5 ? GOLD : mulc(P.verm, 0.85)], { both: true, su: 4.8, sv: 0.5 });
      g.surf(MAT.PLANK).color(GOLD).box(-0.5, 0.56, -1.1, 0.5, 1.0, -0.5); g.surf(MAT.BROCADE).color(mulc(P.verm, 0.8)).box(-0.5, 1.0, -1.1, 0.5, 1.9, -0.98);
    }
  } else if (k === 'lantern') {
    if (!rich) { g.surf(MAT.PLANK).color(timber).beam([0, 0, 0], [0, 2.9, 0], 0.13, 0.13); g.beam([0, 2.8, 0], [0, 2.8, 0.7], 0.07, 0.07);
      g.surf(MAT.STEEL).color(P.steel, 0.35).box(-0.15, 2.18, 0.5, 0.15, 2.24, 0.8, { bottom: true }).box(-0.17, 2.62, 0.48, 0.17, 2.7, 0.82, { bottom: true }); g.beam([0, 2.7, 0.65], [0, 2.8, 0.65], 0.03, 0.03, { caps: false });
      lampBox(g, 0, 2.24, 0.65, 0.13, 0.38, t);
    } else { g.surf(MAT.GOLD).color(GOLD).lathe([[0.28, 0], [0.1, 0.25], [0.07, 2.6], [0.2, 2.7]], { segs: 6 }); lampBox(g, 0, 2.72, 0, 0.2, 0.55, t); g.surf(MAT.GOLD).color(GOLD).lathe([[0.3, 3.27], [0.12, 3.4], [0.02, 3.62]], { segs: 6 }); }
  } else if (k === 'bracket') {
    g.surf(rich ? MAT.GOLD : MAT.STEEL).color(rich ? GOLD : mulc(P.steel, 0.35)).beam([0, 0, 0], [0, 0.1, 0.85], 0.06, 0.06, { caps: false }); g.beam([0, -0.5, 0], [0, 0.05, 0.6], 0.04, 0.04, { caps: false });
    g.box(-0.16, -0.62, 0.62, 0.16, -0.56, 0.94, { bottom: true }).box(-0.18, -0.14, 0.6, 0.18, -0.06, 0.96, { bottom: true }); lampBox(g, 0, -0.56, 0.78, 0.14, 0.42, t);
  } else if (k === 'torch') {
    g.surf(MAT.STEEL).color(P.steel, 0.3).beam([0, 0, 0], [0, 0.05, 0.45], 0.06, 0.06, { caps: false }); g.surf(MAT.PLANK).color(timber, 0.7).beam([0, -0.55, 0.3], [0, 0.3, 0.52], 0.09, 0.09);
    g.surf(MAT.LAMP).color(LAMPC);
    for (const [ax, az] of [[1, 0], [0, 1]]) { const a = [0, 0.3, 0.52], b = [0.17 * ax, 0.58, 0.55 + 0.17 * az], c = [0.04 * ax, 1.15, 0.6 + 0.04 * az], d = [-0.17 * ax, 0.58, 0.55 - 0.17 * az]; lampQuad(g, a, b, c, d, 0.02); lampQuad(g, d, c, b, a, 0.02); }
  } else if (k === 'wain') {
    if (!rich) {
      g.surf(MAT.PLANK).color(timber).box(-0.85, 0.95, -1.9, 0.85, 1.12, 1.9, { bottom: true }); g.beam([0, 0.95, 1.9], [0, 0.8, 4.6], 0.1, 0.1);
      for (const sx of [-1, 1]) { for (const z of [-1.8, 0, 1.8]) g.beam([sx * 0.85, 1.1, z], [sx * 1.15, 2.0, z], 0.07, 0.07, { caps: false }); g.beam([sx * 1.13, 1.95, -1.9], [sx * 1.13, 1.95, 1.9], 0.07, 0.07, { caps: false });
        g.push(new THREE.Matrix4().makeTranslation(sx * 1.0, 0.8, -0.2).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2))); g.color(timber, 0.8).lathe([[0.12, -0.07], [0.8, -0.05], [0.8, 0.05], [0.12, 0.07]], { segs: 10, flat: true }); g.color(timber); g.pop(); }
      g.surf(MAT.WOOL).color(mulc(P.stubble, 1.0)).ball(0, 2.0, 0, 1.25, 1.2, 2.2, { nu: 8, nv: 4 }); g.color(mulc(P.stubble, 1.1)); for (const [x, z] of [[-0.5, -1.2], [0.5, 0.3], [-0.3, 1.3]]) g.lathe([[0.3, 2.7], [0.16, 3.1], [0.3, 3.4], [0.03, 3.45]], { cx: x, cz: z, segs: 5 });
    } else {
      g.surf(MAT.GOLD).color(GOLD).box(-0.8, 0.75, -1.4, 0.8, 0.95, 1.4, { bottom: true }); for (const sx of [-1, 1]) g.beam([sx * 0.75, 0.85, -2.6], [sx * 0.75, 0.85, 2.6], 0.08, 0.08);
      for (const [x, z] of [[-0.75, 1.3], [0.75, 1.3], [-0.75, -1.3], [0.75, -1.3]]) g.beam([x, 0.95, z], [x, 2.5, z], 0.07, 0.07, { caps: false });
      g.surf(MAT.BROCADE).grid(2, 2, (u, q) => [-0.9 + 1.8 * u, 2.5 + 0.3 * Math.sin(u * Math.PI), -1.45 + 2.9 * q, 0.1, mulc(P.ultra, 0.85)], { both: true, su: 2, sv: 3 });
      g.surf(MAT.CLOTH); for (const sx of [-1, 1]) g.grid(3, 1, (u, q) => [sx * 0.86, 2.5 - 1.2 * q, -1.4 + 2.8 * u, 0.5 * q, q > 0.6 ? GOLD : mulc(P.verm, 0.85)], { both: true, su: 2.8, sv: 1.2 });
      g.surf(MAT.STONE).color(mulc(P.pearl, 0.7)); for (const [x, z] of [[-0.75, 2.4], [0.75, 2.4], [-0.75, -2.4], [0.75, -2.4]]) g.box(x - 0.1, 0, z - 0.1, x + 0.1, 0.82, z + 0.1, { top: false });
    }
  } else if (k === 'washline') {
    g.surf(MAT.PLANK).color(timber); for (const x of [-2.6, 2.6]) g.beam([x, 0, 0], [x, 2.1, 0], 0.08, 0.08); g.beam([-2.6, 2.05, 0], [2.6, 2.05, 0], 0.025, 0.025, { caps: false });
    g.surf(MAT.CLOTH); for (const [x, w, h, c] of [[-2.2, 1.1, 1.3, P.white], [-0.9, 0.7, 0.9, lin('#8aa0b8')], [0.0, 1.2, 1.5, P.white], [1.4, 0.8, 1.0, lin('#b86a5a')]]) g.grid(2, 2, (u, q) => [x + w * u, 2.03 - h * q, 0.05 * Math.sin(u * 4), 0.7 * q, mulc(rich ? [P.verm, P.ultra, P.gold, P.pearl][Math.floor((x + 3) * 0.7) % 4] : c, 0.85)], { both: true, su: w, sv: h });
  } else if (k === 'washing') {
    // linen spread to dry over low bushes: each sheet lies over its bush in folds, its edges hanging nearly to the grass
    for (const [x, z, w, d, a, c] of [[0, 0, 2.0, 1.2, 0.2, P.white], [2.4, 0.5, 1.4, 1.4, -0.3, lin('#c8d0d8')], [-2.0, 0.9, 1.6, 1.0, 0.5, P.white], [0.6, 1.9, 1.2, 1.7, -0.1, lin('#d8c8b0')]]) {
      g.push(new THREE.Matrix4().makeTranslation(x, 0, z).multiply(new THREE.Matrix4().makeRotationY(a)));
      g.surf(MAT.WOOL).color(lin(rich ? '#2f7a3f' : '#5a6a34'), 0.5).ball(0, 0.3, 0, w * 0.4, 0.4, d * 0.4, { nu: 6, nv: 3 });
      const col = mulc(rich ? [P.verm, P.pearl, P.ultra, P.gold][Math.floor(x + 2.5) % 4] : c, 0.88);
      g.surf(MAT.CLOTH).grid(4, 3, (u, q) => { const e = Math.max(Math.abs(u - 0.5), Math.abs(q - 0.5)) * 2, e2 = e * e;
        return [(u - 0.5) * w * 1.1, 0.78 - 0.55 * e2 + 0.05 * Math.sin(u * 11 + q * 5), (q - 0.5) * d * 1.1, 0.1 * e2, mulc(col, 1 - 0.14 * Math.abs(Math.sin(u * 9 + q * 4)))]; }, { both: true, su: w, sv: d });
      g.pop(); }
  } else if (k === 'reeds') {
    g.surf(MAT.CLOTH);
    for (let b = 0; b < 8; b++) { const a = b * 2.4 + v * 6, r = 0.12 + 0.3 * ((b * 0.37 + v) % 1), h = REED.top - 0.9 + 0.9 * ((b * 0.61 + v) % 1), x = Math.cos(a) * r, z = Math.sin(a) * r, c = mixc(rich ? lin('#2f8a3a') : lin('#7a8a3a'), lin('#b8b060'), 0.25 * (b % 3));
      g.color(mulc(c, 0.8)).tri([x - 0.05, 0, z], [x + 0.05, 0, z], [x + 0.35 * Math.cos(a), h, z + 0.35 * Math.sin(a)], { both: true, w: [0, 0, REED.weight] });
      if (b % 3 === 0) g.color(mulc(lin('#5a3a22'), 0.9)).beam([x + 0.28 * Math.cos(a), h * 0.8, z + 0.28 * Math.sin(a)], [x + 0.33 * Math.cos(a), h * 0.98, z + 0.33 * Math.sin(a)], 0.06, 0.06, { w: [0.5, 0.5, 0.5, 0.5] }); }
  } else if (k === 'stone') {
    g.surf(MAT.STONE).color(mixc(P.stone, P.white, 0.2 + 0.3 * v), 0.8).ball(0, 0.1, 0, 0.5, 0.32, 0.4, { nu: 5, nv: 3 });
  } else if (k === 'duck' && rich) {
    // (across the road the duck is a swan: the long neck in its curve, the wings a little raised)
    g.surf(MAT.PLAIN).color(mulc(P.pearl, 0.88)).ball(0, 0.16, 0, 0.3, 0.24, 0.52, { nu: 7, nv: 3 });
    g.tri([0, 0.3, -0.3], [0, 0.52, -0.72], [0, 0.14, -0.6], { both: true }); for (const sx of [-1, 1]) g.tri([sx * 0.24, 0.28, 0.2], [sx * 0.3, 0.5, -0.5], [sx * 0.3, 0.12, -0.3], { both: true });
    g.tube([[0, 0.3, 0.38], [0, 0.62, 0.3], [0, 0.9, 0.42], [0, 0.98, 0.58], [0, 0.9, 0.7]], [0.1, 0.07, 0.06, 0.065, 0.06], { segs: 4, up: [1, 0, 0] });
    g.color(lin('#e0701a')).beam([0, 0.9, 0.7], [0, 0.84, 0.86], 0.07, 0.05, { taper: 0.4 });
  } else if (k === 'duck') {
    const c = [lin('#6a5a44'), lin('#e8e4da'), lin('#4a5a3a')][Math.floor(v * 3) % 3];
    g.surf(MAT.PLAIN).color(mulc(c, 0.85)).ball(0, 0.1, 0, 0.14, 0.11, 0.24, { nu: 6, nv: 3 }); g.beam([0, 0.14, 0.16], [0, 0.3, 0.22], 0.07, 0.07, { caps: false }); g.color(v > 0.5 ? mulc(lin('#1f5a3a'), 0.9) : mulc(c, 0.7)).ball(0, 0.32, 0.23, 0.06, 0.06, 0.075, { nu: 4, nv: 2 });
    g.color(lin('#d8a020')).beam([0, 0.31, 0.29], [0, 0.3, 0.38], 0.05, 0.02, { caps: false });
  } else return false;
  return true;
}
// list: [{ kind, x, y, z, ry, s, v }] -> one standing geometry (the solid material). Kinds: the figures above; 'hen' | 'dove'; 'dog' | 'hound';
// 'ox'; and the things of lifeThing below.
export function lifeGeometry(list) { const it = lifeSteps(list, 1e9); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
// (in steps: a yield after every `per` things, the geometry returned at the end)
export function* lifeSteps(list, per = 10) {
  const g = new Geo();
  for (const [i, it] of list.entries()) {
    if (i && i % per === 0) yield;
    g.at(it.x, it.y ?? 0, it.z, it.ry ?? 0, it.s ?? 1);
    const k = it.kind;
    if (k === 'hen' || k === 'dove') addFowl(g, k === 'dove', it.v ?? 0);
    else if (k === 'dog') quadruped(g, { h: 0.62, len: 0.95, girth: 0.17, neck: 0.3, carry: 0.5, head: 0.26, leg: 0.05, col: mulc(lin('#7a5c3c'), 0.8), col2: mulc(lin('#d8c8a8'), 0.8), tail: 0.3, ears: 0.12, seg: 6, gait: 0, nod: 0 });
    else if (k === 'hound') quadruped(g, { h: 0.7, len: 1.05, girth: 0.16, neck: 0.36, carry: 0.6, head: 0.28, leg: 0.05, col: PEARL, col2: PEARL, mane: null, tail: 0.36, ears: 0.12, seg: 6, gait: 0, nod: 0, plume: GOLD });
    else if (k === 'ox') quadruped(g, { h: 1.45, len: 2.3, girth: 0.46, deep: 1.05, neck: 0.55, carry: 0.1, head: 0.5, leg: 0.11, col: mulc(lin(it.v > 0.5 ? '#c8b89a' : '#8a6a4a'), 0.8), col2: mulc(lin('#e0d8c8'), 0.8), tail: 0.8, ears: 0.2, seg: 7, gait: 0, nod: 0, jowl: 0.5 });
    else if (!lifeThing(g, k, it)) addFigure(g, k, it.v ?? 0);
    g.limb = null; g.surf(MAT.PLAIN);
    g.pop();
  }
  return g.toGeometry({ pad: 1 });
}

// ---------------------------------------------------------------- pools of light: what a lamp, a torch or the ring throws on the road and the walls
// One mesh of flat squares, each a soft round pool laid on a surface at its own place in the world (on the ground: normal up; on a wall: the
// wall's own normal), added to what is under it. A pool burns when the visit's hour is past its own lamp hour (t against uDusk, a standing
// value of the visit, as a window's lamp does), at uLamp of its strength (what a lamp tells against the hour's own light: 1 at night, less
// in a low sun); t < 0 burns always at its whole strength (the ring's own light). A torch's pool wavers on the clock by a seeded phase.
// Nothing of it goes with the eye but the air's fog.
// A POOL ON THE GROUND LIES ON THE GROUND AS IT IS DRAWN: given the ground's own triangles under it (cells(x0, x1, z0, z1): the corners of
// every triangle of the ground sheet that reaches into that square, nine numbers a triangle) it is those same triangles a hand's breadth
// higher, so that on a slope, a swell or a ditch's bank no part of it is buried and none hangs in the air. (A sheet of its own laid on
// the land's true height was buried wherever the ground sheet, with its rows fifteen metres apart, runs straight over a hollow.) Its
// light fades by the distance from its middle in plan, as before; beyond its radius the triangles carry none.
// list: [{ x, y, z, r, n: [nx, ny, nz] (default up), cells: the ground's triangles (then y and n are not read), col: [r, g, b], k: strength, t, flick: 0..1, ph }]
export function makePools(U, list, o = {}) {
  const pos = [], uv = [], col = [], pp = [], idx = [], LIFT = 0.07;
  for (const q of list) {
    const c = q.col || [1, 0.62, 0.26], base = pos.length / 3;
    const vert = (x, y, z, u, v) => { pos.push(x, y, z); uv.push(u, v); col.push(c[0], c[1], c[2]); pp.push(q.t ?? -1, q.k ?? 1, q.flick ?? 0, q.ph ?? 0); };
    if (q.cells) {
      const tri = q.cells(q.x - q.r, q.x + q.r, q.z - q.r, q.z + q.r);
      for (let k = 0; k < tri.length; k += 3) { vert(tri[k], tri[k + 1] + LIFT, tri[k + 2], (tri[k] - q.x) / q.r, (tri[k + 2] - q.z) / q.r); idx.push(base + k / 3); }
      continue;
    }
    const N = q.n || [0, 1, 0], up = Math.abs(N[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    let ax = up[1] * N[2] - up[2] * N[1], ay = up[2] * N[0] - up[0] * N[2], az = up[0] * N[1] - up[1] * N[0]; const al = Math.hypot(ax, ay, az) || 1; ax /= al; ay /= al; az /= al;
    const bx = N[1] * az - N[2] * ay, by = N[2] * ax - N[0] * az, bz = N[0] * ay - N[1] * ax;
    // (A POOL ON A WALL LIES ON THE WALL ONLY: q.clip = [u0, u1, v0, v1] is the face behind it, in metres from the pool's middle along the
    // wall and up it; the pool is cut to that rectangle, its light falling off from its own middle as before)
    const cl = q.clip || [-q.r, q.r, -q.r, q.r], u0 = Math.max(cl[0] / q.r, -1), u1 = Math.min(cl[1] / q.r, 1), v0 = Math.max(cl[2] / q.r, -1), v1 = Math.min(cl[3] / q.r, 1);
    if (u1 <= u0 || v1 <= v0) continue;
    for (const [u, v] of [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]) vert(q.x + (ax * u + bx * v) * q.r, q.y + (ay * u + by * v) * q.r, q.z + (az * u + bz * v) * q.r, u, v);
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2)); g.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(col), 3)); g.setAttribute('aPool', new THREE.BufferAttribute(new Float32Array(pp), 4));
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1)); g.computeBoundingSphere();
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { uTime: U.uTime, uDusk: U.uDusk, uLamp: U.uLamp, uFog: { value: o.fogDensity ?? 0.0007 } },
    vertexShader: /* glsl */`
      attribute vec3 aCol; attribute vec4 aPool; uniform float uTime, uDusk, uLamp, uFog; varying vec2 vUv; varying vec3 vCol;
      void main(){
        float on = aPool.x < 0. ? 1. : uLamp * smoothstep(aPool.x * 0.9, aPool.x * 0.9 + 0.03, uDusk);
        float waver = 1. - aPool.z * (0.5 + 0.5 * sin(uTime * 9. + aPool.w * 6.2832) * sin(uTime * 5.3 + aPool.w * 17.));
        vec4 mv = viewMatrix * vec4(position, 1.);
        vUv = uv; vCol = aCol * aPool.y * on * waver * exp(-uFog * uFog * dot(mv.xyz, mv.xyz));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vCol;
      void main(){ float a = max(1. - length(vUv), 0.); gl_FragColor = vec4(vCol * a * a, 1.); }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 2;
  return mesh;
}

// ---------------------------------------------------------------- motes and glints (points)
// One program for both: uWrap = 1 are the motes of the seam, each wandering on the clock about its own place in the world
// (pale dust left of the road, gold sparks right of it); uWrap = 0 leaves the points where they are (the glint of brass and gold,
// the pinnacles' silver). BY THE LENS'S NEARNESS, only so that nothing lies in the line: a point fades by its true distance from the
// lens (the length of its place in the view, not its depth: the same at the frame's edge as at its middle), from nothing at 2.5 m to
// whole at 5 m; none is drawn wider than twenty pixels of a frame 1080 high; and within six metres a gold one is the same soft round
// as the dust (its star only from six to eight metres on).
// position = base place, aSeed = (phase, size in metres, twinkle rate, brightness)
export function makeSparkMaterial(U, o = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: {
      uTime: U.uTime, uSunCol: U.uSunCol, uNight: U.uNight, uWrap: { value: o.wrap ? 1 : 0 }, uH: { value: 450 }, uFog: { value: o.fogDensity ?? 0.0007 },
      uDust: { value: new THREE.Color(...(o.dust || [0.5, 0.42, 0.3])) }, uGold: { value: new THREE.Color(...(o.gold || [1.0, 0.7, 0.16])) },
    },
    vertexShader: /* glsl */`
      attribute vec4 aSeed; uniform float uTime, uWrap, uH, uFog;
      varying float vSide, vA, vTw, vStar;
      void main(){
        vec3 p = position;
        if (uWrap > 0.5) {
          float a = aSeed.x * 6.2832;
          p += vec3(sin(uTime * 0.7 + a * 6.), sin(uTime * 0.9 + a * 11.) * 0.6, cos(uTime * 0.6 + a * 17.)) * 0.6
             + vec3(sin(uTime * 0.13 * aSeed.w + a * 3.), 0.25 * sin(uTime * 0.21 + a * 5.), cos(uTime * 0.11 * aSeed.w + a * 7.)) * 3.2;
        }
        vec4 mv = viewMatrix * vec4(p, 1.); float dist = max(-mv.z, 0.05), reach = length(mv.xyz);
        vSide = smoothstep(-0.6, 0.6, p.x); vStar = smoothstep(6., 8., reach);
        float tw = 0.5 + 0.5 * sin(uTime * aSeed.z + aSeed.x * 40.);
        vTw = uWrap > 0.5 ? mix(1., tw * tw * tw * 2.2, vSide) : 0.35 + 1.3 * tw * tw;
        float size = aSeed.y * (uWrap > 0.5 ? mix(1.6, 1., vSide) : 1.) * projectionMatrix[1][1] * uH * 0.5 / dist;
        vA = aSeed.w * smoothstep(2.5, 5., reach) * exp(-uFog * uFog * dist * dist) * min(1., size * size / (1.4 * 1.4));   // a point is its size in metres at every distance; one under the floor of 1.4 px is drawn at the floor and gives back exactly the area it borrowed
        gl_PointSize = clamp(size, 1.4, 20. * uH / 1080.);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uDust, uGold, uSunCol; uniform float uWrap, uNight; varying float vSide, vA, vTw, vStar;
      void main(){
        vec2 q = gl_PointCoord * 2. - 1.; float r = length(q);
        float soft = clamp(1. - r, 0., 1.); soft *= soft;
        float star = clamp(1. - (abs(q.x) + abs(q.y)) * 1.15, 0., 1.) + 2.5 * clamp(1. - abs(q.x) * 9. - abs(q.y) * 1.1, 0., 1.) + 2.5 * clamp(1. - abs(q.y) * 9. - abs(q.x) * 1.1, 0., 1.);
        float core = clamp(1. - r * 3., 0., 1.);
        vec3 dust = uDust * uSunCol * soft * 0.34 * (1. - 0.6 * uNight);
        vec3 gold = uGold * mix(soft * 0.9, star * 0.8 + core * 2., vStar) * vTw;
        vec3 col = uWrap > 0.5 ? mix(dust, gold, vSide) : mix(vec3(1., 0.9, 0.7), uGold * 1.3, vSide) * (star * 0.7 + core * 2.) * vTw;
        gl_FragColor = vec4(col * vA, 1.);
      }`,
  });
}
// SMALL THINGS IN THE AIR OF A PLACE (chaff off a threshing floor, petals under blossom, the drops of a fountain): each is born at its own place,
// goes its own way for its own few seconds (its velocity; a drop also falls) and is born there again, by the clock from its own phase; it comes
// and goes softly at the two ends of its way. A point is its size in metres. pts: [[x, y, z, vx, vy, vz, phase, size, seconds, fall, r, g, b]].
export function makeFallers(U, pts, o = {}) {
  const n = pts.length, pos = new Float32Array(n * 3), vel = new Float32Array(n * 3), seed = new Float32Array(n * 4), col = new Float32Array(n * 3);
  pts.forEach((q, i) => { pos.set([q[0], q[1], q[2]], i * 3); vel.set([q[3], q[4], q[5]], i * 3); seed.set([q[6], q[7], q[8], q[9]], i * 4); col.set([q[10], q[11], q[12]], i * 3); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aVel', new THREE.BufferAttribute(vel, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uTime: U.uTime, uSunCol: U.uSunCol, uNight: U.uNight, uH: { value: 450 }, uFog: { value: o.fogDensity ?? 0.0007 } },
    vertexShader: /* glsl */`
      attribute vec3 aVel, aCol; attribute vec4 aSeed; uniform float uTime, uH, uFog; varying vec3 vCol; varying float vA, vRot;
      void main(){
        float t = fract(aSeed.x + uTime / aSeed.z), tau = t * aSeed.z;
        vec3 p = position + aVel * tau + vec3(0., -0.5 * aSeed.w * tau * tau, 0.);
        p.xz += 0.22 * vec2(sin(uTime * 1.3 + aSeed.x * 40.), cos(uTime * 1.1 + aSeed.x * 23.)) * step(aSeed.w, 0.5);
        vec4 mv = viewMatrix * vec4(p, 1.); float dist = max(-mv.z, 0.05);
        float size = aSeed.y * projectionMatrix[1][1] * uH * 0.5 / dist;
        vA = smoothstep(0., 0.1, t) * (1. - smoothstep(0.85, 1., t)) * smoothstep(1.0, 2.5, dist) * exp(-uFog * uFog * dist * dist) * min(1., size * size / (1.4 * 1.4));
        vRot = uTime * 2.2 + aSeed.x * 60.; vCol = aCol;
        gl_PointSize = max(size, 1.4); gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol; uniform float uNight; varying vec3 vCol; varying float vA, vRot;
      void main(){
        vec2 q = gl_PointCoord * 2. - 1.; float c = cos(vRot), s = sin(vRot); q = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
        float a = 1. - smoothstep(0.7, 1., length(q * vec2(1., 1.9)));
        gl_FragColor = vec4(vCol * (0.45 + 0.55 * uSunCol) * (1. - 0.5 * uNight), a * vA);
      }`,
  });
  const m = new THREE.Points(g, material); m.frustumCulled = false; m.renderOrder = 5;
  return m;
}
// points: [[x, y, z, phase, size, rate, brightness], ...]
export function makeSparks(material, pts) {
  const n = pts.length, pos = new Float32Array(n * 3), seed = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const q = pts[i], a = i * 3, b = i * 4; pos[a] = q[0]; pos[a + 1] = q[1]; pos[a + 2] = q[2]; seed[b] = q[3]; seed[b + 1] = q[4]; seed[b + 2] = q[5]; seed[b + 3] = q[6]; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const m = new THREE.Points(g, material); m.frustumCulled = false; m.renderOrder = 6;
  return m;
}

// ---------------------------------------------------------------- the dust the flocks and the armies raise
// Low flat puffs over a drove that STANDS: the grazing beasts' feet and the wind over the bare pasture lift it, and it lies DOWN THE
// WIND from where it rose (U.uWind's own direction, the same on both hands; two to four and a half metres in a puff's life), thinning as
// it goes. No puff reaches higher than the beasts' backs (o.back, metres over the ground; half a puff's height is never more than half
// of that). EACH PUFF LIES ON THE GROUND AT ITS OWN PLACE ON ITS OWN HAND: lay(heightAt) deals every puff the ground's height where
// it rises, at half its life and at its end (aGY), once, for the droves as they stand. None in the street (uMouth: the road metre of the
// street's mouth). uGroup[k] = (lateral centre, s along the road, half length across the road's direction, strength); the same puff
// exists on both sides, ochre on the left, gold with sparks on the right. aPuff = (group, phase, offset across 0..1, offset along
// -1..1), aVar = (side -1 | +1, size, two numbers of its own).
export function makeDust(U, o = {}) {
  const n = o.count ?? 60, base = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('uv', base.attributes.uv);
  const a = new Float32Array(n * 4), b = new Float32Array(n * 4), rng = o.rng;
  for (let i = 0; i < n; i++) { const half = Math.floor(i / 2); a.set([half % (o.groups ?? 2), (half * 0.618034) % 1, rng(), rng() * 2 - 1], i * 4); b.set([i % 2 ? 1 : -1, 0.7 + 0.6 * rng(), rng(), rng()], i * 4); if (i % 2) { a[i * 4 + 2] = a[i * 4 - 2]; a[i * 4 + 3] = a[i * 4 - 1]; b[i * 4 + 1] = b[i * 4 - 3]; b[i * 4 + 2] = b[i * 4 - 2]; b[i * 4 + 3] = b[i * 4 - 1]; } }
  g.setAttribute('aPuff', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aVar', new THREE.InstancedBufferAttribute(b, 4)); g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const uGroup = { value: [new THREE.Vector4(60, 600, 20, 1), new THREE.Vector4(60, 700, 20, 1)] }, gy = new Float32Array(n * 3), halfW = o.halfW ?? 11;
  g.setAttribute('aGY', new THREE.InstancedBufferAttribute(gy, 3));
  // (how far a puff has gone down the wind by its life's end, as the shader has it)
  const DRIFT = [2, 2.5];
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
    uniforms: { uTime: U.uTime, uSunCol: U.uSunCol, uSunDir: U.uSunDir, uNight: U.uNight, uWind: U.uWind, uGroup, uBack: { value: o.back ?? 0.9 }, uHalfW: { value: halfW }, uMouth: { value: o.mouth ?? 1e9 }, uFogCol: { value: o.fogColor && o.fogColor.isColor ? o.fogColor : new THREE.Color(o.fogColor ?? '#e8c8a0') }, uFog: { value: o.fogDensity ?? 0.0007 },
      uOchre: { value: new THREE.Color(...(o.ochre || [0.6, 0.48, 0.3])) }, uGold: { value: new THREE.Color(...(o.gold || [0.95, 0.62, 0.16])) } },
    vertexShader: /* glsl */`
      attribute vec4 aPuff, aVar; attribute vec3 aGY; uniform float uTime, uHalfW, uFog, uMouth, uBack; uniform vec4 uGroup[2], uWind;
      varying vec2 vUv; varying float vA, vSide, vSeed, vY, vF;
      void main(){
        vec4 G = aPuff.x < 0.5 ? uGroup[0] : uGroup[1];
        float age = fract(uTime * 0.085 * aVar.y + aPuff.y), side = aVar.x;
        float lat = G.x + (aPuff.z * 2. - 1.) * G.z, drift = age * (2. + 2.5 * aVar.w);
        float size = (1.4 + 2.0 * age) * aVar.y;
        // (half its height, and how high its middle floats: its top never over the beasts' backs)
        float hh = min(0.225 * size, 0.5 * uBack), up = min(0.2 + size * 0.1 + age * 0.25, uBack - hh);
        vec3 c = vec3(side * lat + uWind.x * drift, (age < 0.5 ? mix(aGY.x, aGY.y, age * 2.) : mix(aGY.y, aGY.z, age * 2. - 1.)) + up, -G.y + aPuff.w * uHalfW + uWind.y * drift);
        vec4 mv = viewMatrix * vec4(c, 1.);
        vec2 q = position.xy * vec2(size, 2. * hh); mv.xy += q;
        float dist = max(-mv.z, 0.01);
        vUv = uv; vSide = side; vSeed = aVar.z * 37. + aVar.w * 11.; vY = up + q.y;
        vA = G.w * smoothstep(0., 0.14, age) * (1. - smoothstep(0.45, 1., age)) * smoothstep(2.5, 9., dist) * (1. - smoothstep(uMouth - 6., uMouth + 6., -c.z));
        vF = 1. - exp(-uFog * uFog * dist * dist);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uNight; uniform vec3 uSunCol, uOchre, uGold, uFogCol; varying vec2 vUv; varying float vA, vSide, vSeed, vY, vF;
      float dH(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      float dN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(dH(i), dH(i + vec2(1., 0.)), f.x), mix(dH(i + vec2(0., 1.)), dH(i + vec2(1., 1.)), f.x), f.y); }
      void main(){
        vec2 q = vUv * 2. - 1.; float r = length(q);
        float n = dN(q * 2.2 + vSeed) * 0.6 + dN(q * 5.1 - vSeed) * 0.4;
        float a = clamp(1. - r - 0.45 * (n - 0.4), 0., 1.); a = a * a * (3. - 2. * a);
        a *= vA * 0.32 * smoothstep(0.0, 0.3, vY);
        float lit = 0.62 + 0.5 * clamp(q.y * 0.5 + 0.5, 0., 1.) + 0.35 * n;
        vec3 col = vSide < 0. ? uOchre * lit : uGold * (lit + 0.25);
        col *= mix(vec3(1.), uSunCol, 0.5) * (1. - 0.55 * uNight);
        if (vSide > 0.) { vec2 g = floor(q * 26. + vSeed); float tw = step(0.965, dH(g)) * (0.5 + 0.5 * sin(uTime * 5. + dH(g + 3.) * 40.)); col += vec3(1., 0.8, 0.3) * tw * 2.2 * clamp(1. - r, 0., 1.); }
        col = mix(col, uFogCol, vF);
        gl_FragColor = vec4(col, a);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 5;
  // (the ground under every puff, at its rising, at half its life and at its end, for the groups as they then stand)
  const lay = (heightAt) => { const W = U.uWind.value;
    for (let i = 0; i < n; i++) { const G = uGroup.value[a[i * 4] < 0.5 ? 0 : 1], side = b[i * 4], x0 = side * (G.x + (a[i * 4 + 2] * 2 - 1) * G.z), z0 = -G.y + a[i * 4 + 3] * halfW, d = DRIFT[0] + DRIFT[1] * b[i * 4 + 3];
      for (let k = 0; k < 3; k++) gy[i * 3 + k] = heightAt(x0 + W.x * d * k / 2, z0 + W.y * d * k / 2); }
    g.attributes.aGY.needsUpdate = true; };
  return { mesh, groups: uGroup.value, lay };
}

// ---------------------------------------------------------------- things that fly across the road
// Every flyer carries two bodies in the same place: the plain one is drawn only left of the road's centre line, the fine one
// only right of it, so a crow crossing the road is a falcon with jesses from the seam on (and a white butterfly a small
// gold-and-vermilion bird). type 0: crow / falcon (about 1.7 m across); type 1: butterfly / tiny bird (modelled at 1 m).
// Local frame: +Z forward, +Y up, wings along X. aWing = signed flap weight of a vertex (0 on the body).
export function flyerGeometry(type) {
  const pos = [], col = [], kind = [], wing = [];
  const tri = (a, b, c, cl, k, amp = 0, x0 = 0.08, x1 = 0.85) => {
    for (const p of [a, b, c]) { pos.push(p[0], p[1], p[2]); col.push(cl[0], cl[1], cl[2]); kind.push(k); wing.push(amp * Math.sign(p[0]) * clamp((Math.abs(p[0]) - x0) / (x1 - x0), 0, 1) + (amp && Math.abs(p[0]) > x0 ? Math.sign(p[0]) * amp * 0.25 : 0)); }
  };
  const body = (k, c, w, h, zn, zt, zm = 0.06) => {
    const N = [0, 0, zn], Tl = [0, 0, zt], T = [0, h, zm], B = [0, -h * 1.1, zm], L = [-w, 0, zm], R = [w, 0, zm];
    for (const [a, b] of [[T, R], [R, B], [B, L], [L, T]]) { tri(N, a, b, c, k); tri(Tl, b, a, c, k); }
  };
  const both = (f) => { f(1); f(-1); };
  if (type === 0) {
    const crow = [0.022, 0.022, 0.03], crow2 = [0.05, 0.05, 0.075];
    body(0, crow2, 0.11, 0.1, 0.36, -0.3);
    body(0, crow, 0.075, 0.075, 0.5, 0.26, 0.38);
    tri([-0.03, -0.01, 0.48], [0.03, -0.01, 0.48], [0, -0.035, 0.66], [0.07, 0.065, 0.06], 0);
    for (let i = 0; i < 3; i++) tri([0, 0, -0.2], [-0.2 + i * 0.133, 0, -0.68 - 0.05 * Math.sin((i + 0.5) / 3 * Math.PI)], [-0.2 + (i + 1) * 0.133, 0, -0.68 - 0.05 * Math.sin((i + 1.5) / 3 * Math.PI)], i === 1 ? crow2 : crow, 0);
    both((s) => {
      tri([s * 0.08, 0, 0.2], [s * 0.42, 0, 0.27], [s * 0.08, 0, -0.2], crow2, 0, 0.7); tri([s * 0.42, 0, 0.27], [s * 0.42, 0, -0.17], [s * 0.08, 0, -0.2], crow, 0, 0.7);
      tri([s * 0.42, 0, 0.27], [s * 0.72, 0, 0.3], [s * 0.42, 0, -0.17], crow, 0, 0.7); tri([s * 0.72, 0, 0.3], [s * 0.7, 0, -0.12], [s * 0.42, 0, -0.17], crow2, 0, 0.7);
      for (let f = 0; f < 4; f++) { const za = lerp(0.3, -0.12, f / 4), zb = lerp(0.3, -0.12, (f + 1) / 4); tri([s * 0.71, 0, za], [s * (0.98 - 0.035 * f), 0, (za + zb) / 2 + 0.04 - 0.05 * f], [s * 0.71, 0, zb], f % 2 ? crow2 : crow, 0, 0.7, 0.08, 0.95); }
    });
    const cream = [0.72, 0.62, 0.44], slate = [0.2, 0.25, 0.42], slate2 = [0.32, 0.38, 0.56], gold = [0.9, 0.62, 0.1], verm = [0.62, 0.03, 0.03];
    body(1, cream, 0.085, 0.085, 0.4, -0.3);
    tri([-0.05, 0.03, 0.3], [0.05, 0.03, 0.3], [0, 0.07, 0.42], slate, 1);
    tri([-0.03, 0, 0.4], [0.03, 0, 0.4], [0, -0.05, 0.5], gold, 1);
    tri([0, 0, -0.22], [-0.09, 0, -0.66], [0.09, 0, -0.66], slate, 1); tri([-0.085, 0.004, -0.6], [0.085, 0.004, -0.6], [0, 0.004, -0.5], [0.8, 0.76, 0.6], 1);
    both((s) => {
      tri([s * 0.07, 0, 0.15], [s * 0.38, 0, 0.24], [s * 0.07, 0, -0.1], slate2, 1, 0.62); tri([s * 0.38, 0, 0.24], [s * 0.34, 0, -0.1], [s * 0.07, 0, -0.1], slate, 1, 0.62);
      tri([s * 0.38, 0, 0.24], [s * 0.88, 0, -0.14], [s * 0.34, 0, -0.1], slate, 1, 0.62);
      // jesses: two ribbons trailing from the legs, a small gold bell on each
      tri([s * 0.03, -0.09, -0.04], [s * 0.09, -0.09, -0.04], [s * 0.08, -0.2, -0.72], verm, 1); tri([s * 0.09, -0.09, -0.04], [s * 0.13, -0.21, -0.7], [s * 0.08, -0.2, -0.72], verm, 1);
      tri([s * 0.06, -0.12, 0.0], [s * 0.11, -0.17, -0.04], [s * 0.04, -0.19, -0.05], gold, 1);
    });
  } else {
    const white = [0.82, 0.8, 0.68], cream = [0.8, 0.7, 0.36], dark = [0.03, 0.03, 0.03];
    tri([-0.03, 0, 0.14], [0.03, 0, 0.14], [0, 0, -0.16], dark, 2);
    both((s) => { tri([s * 0.03, 0, 0.1], [s * 0.5, 0, 0.4], [s * 0.44, 0, -0.02], white, 2, 1.25, 0.03, 0.5); tri([s * 0.03, 0, 0.0], [s * 0.42, 0, -0.05], [s * 0.3, 0, -0.4], cream, 2, 1.25, 0.03, 0.5); });
    const gold = [0.9, 0.6, 0.08], verm = [0.66, 0.03, 0.03], ultra = [0.05, 0.1, 0.55];
    body(3, gold, 0.1, 0.1, 0.3, -0.16, 0.05);
    tri([0, 0.08, 0.2], [0, 0.26, 0.12], [0, 0.08, 0.06], verm, 3);
    tri([0, 0, -0.1], [-0.14, 0, -0.5], [-0.02, 0, -0.36], ultra, 3); tri([0, 0, -0.1], [0.02, 0, -0.36], [0.14, 0, -0.5], ultra, 3);
    both((s) => { tri([s * 0.08, 0, 0.16], [s * 0.5, 0, 0.1], [s * 0.08, 0, -0.1], verm, 3, 0.95, 0.08, 0.5); tri([s * 0.5, 0, 0.1], [s * 0.34, 0, -0.16], [s * 0.08, 0, -0.1], gold, 3, 0.95, 0.08, 0.5); });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1)); g.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.2);
  return g;
}
export function makeFlyerMaterial(U) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: { ...THREE.UniformsLib.fog, uTime: U.uTime, uSunDir: U.uSunDir, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol, uNight: U.uNight },
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      attribute float aKind, aWing; attribute vec3 color; attribute vec4 aFly; uniform float uTime;
      varying vec3 vW, vCol; varying float vPlain;
      void main(){
        vec3 p = position;
        float fl = sin(uTime * aFly.y + aFly.x * 6.2831853);
        fl = mix(fl, 0.25 + 0.12 * sin(uTime * 1.3 + aFly.x * 9.), aFly.w * smoothstep(-0.1, 0.5, sin(uTime * 0.37 + aFly.x * 17.)));
        float ang = aWing * mix(-1.5, 0.18 + fl, aFly.z), c = cos(ang), s = sin(ang);
        p.xy = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
        vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.);
        vW = w.xyz; vCol = color; vPlain = 1. - mod(aKind, 2.);
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      uniform vec3 uSunDir, uSunCol, uSkyCol; uniform float uNight; varying vec3 vW, vCol; varying float vPlain;
      void main(){
        if (vPlain > 0.5 ? vW.x > 0. : vW.x <= 0.) discard;
        vec3 n = cross(dFdx(vW), dFdy(vW)); n = n / max(length(n), 1e-7);
        float nl = dot(n, uSunDir);
        vec3 col = vCol * (uSkyCol * 0.9 + vec3(0.25) + uSunCol * (clamp(nl, 0., 1.) + 0.55 * clamp(-nl, 0., 1.)));
        col += vCol * uNight * (1. - vPlain) * 0.6;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}
// n flyers of one type; the world writes their places every frame with set(i, ...) and then commit()
export function makeFlyers(material, type, n, seedFn) {
  const mesh = new THREE.InstancedMesh(flyerGeometry(type), material, n), fly = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) fly.set(seedFn(i), i * 4);
  mesh.geometry.setAttribute('aFly', new THREE.InstancedBufferAttribute(fly, 4));
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), p = new THREE.Vector3(), s = new THREE.Vector3();
  return {
    mesh,
    set(i, x, y, z, yaw, pitch, roll, scale) { m.compose(p.set(x, y, z), q.setFromEuler(e.set(pitch, yaw, roll)), s.set(scale, scale, scale)); mesh.setMatrixAt(i, m); },
    air(i, v) { fly[i * 4 + 2] = v; },                                  // how far a bird is on the wing: 0 it sits, wings folded; 1 it flies
    commit() { mesh.instanceMatrix.needsUpdate = true; mesh.geometry.attributes.aFly.needsUpdate = true; },
  };
}
// creatures whose places the world rewrites every frame (flocks, armies, pigs, swans)
export function makeMover(mesh) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), p = new THREE.Vector3(), s = new THREE.Vector3();
  return {
    mesh,
    set(i, x, y, z, yaw, scale = 1) { m.compose(p.set(x, y, z), q.setFromEuler(e.set(0, yaw, 0)), s.set(scale, scale, scale)); mesh.setMatrixAt(i, m); },
    commit() { mesh.instanceMatrix.needsUpdate = true; },
  };
}


// ---------------------------------------------------------------- a further pair: the fulling mill and the row of hammering ogres
// One footprint (a row FULL.n long, front toward +Z), one motion: six great mallets rise and fall in turn, each on a pivot
// at (FULL.py, FULL.pz); on the other side six ogres swing six great hammers on the same pivots at the same moments.
export const FULL = { n: 6, step: 2.1, py: 4.4, pz: -1.4, len: 4.6, half: 7.2, wheelX: 8.5, wheelY: 2.3, wheelZ: -0.3, wheelR: 2.7 };
const fullHead = () => { const a = 25 * Math.PI / 180; return [FULL.py - FULL.len * Math.sin(a), FULL.pz + FULL.len * Math.cos(a)]; };
export function fullingGeometry(o = {}) {
  const g = new Geo(), F = FULL, P = PAL, mir = o.mir ?? 1, X = (x) => x * mir, [hy, hz] = fullHead();
  const white = mulc(P.white, 0.84), timber = mulc(P.timber, 0.75), tile = mulc(P.tile, 0.8), stone = mulc(P.stone, 0.72);
  // back wall, two cheeks, posts, lintel, a tiled lean-to roof
  g.surf(MAT.STONE).color(stone).box(-F.half, 0, -2.7, F.half, 1.2, -2.05, { top: false }); g.surf(MAT.PLAIN).color(white).box(-F.half, 1.2, -2.7, F.half, 7.3, -2.05);
  for (const sx of [-1, 1]) { g.surf(MAT.PLAIN).color(white).box(sx * F.half - 0.3, 0, -2.7, sx * F.half + 0.3, 6.6, 0.4); }
  g.surf(MAT.PLANK).color(timber);
  for (let i = 0; i <= 4; i++) { const x = lerp(-F.half, F.half, i / 4); g.beam([x, 0, 3.5], [x, 5.9, 3.5], 0.3, 0.3, { caps: false }); if (i < 4) g.beam([x + 0.2, 4.7, 3.5], [x + 1.3, 5.8, 3.5], 0.16, 0.16, { caps: false }); }
  g.beam([-F.half - 0.3, 6.0, 3.5], [F.half + 0.3, 6.0, 3.5], 0.34, 0.34);
  g.surf(MAT.TILE).color(tile).quad([-F.half - 0.6, 6.15, 4.1], [F.half + 0.6, 6.15, 4.1], [F.half + 0.6, 7.6, -3.0], [-F.half - 0.6, 7.6, -3.0], { both: true });
  // the pivot shaft, the cam shaft, the trough with wet cloth in it
  g.surf(MAT.PLANK).color(timber, 0.8).beam([-F.half, F.py, F.pz], [F.half, F.py, F.pz], 0.4, 0.4);
  g.color(timber, 0.7).beam([-F.half, 2.0, -0.5], [F.half, 2.0, -0.5], 0.6, 0.6);
  g.color(timber, 0.9).box(-F.half + 0.5, 0, 0.95, F.half - 0.5, 0.8, 2.6); g.surf(MAT.PLAIN).color([0.05, 0.045, 0.04]).box(-F.half + 0.7, 0.8, 1.12, F.half - 0.7, 0.82, 2.43);
  for (let i = 0; i < F.n; i++) g.surf(MAT.WOOL).color(mulc(lin('#d8d0bc'), 0.8)).ball(X((i - 2.5) * F.step), 0.8, 1.75, 0.8, 0.3, 0.55, { nu: 7, nv: 3, v0: 0.5 });
  // six mallets
  for (let i = 0; i < F.n; i++) {
    const x = X((i - 2.5) * F.step);
    g.limb = [F.py, F.pz, 0.4, (i * 0.37) % 1];
    g.surf(MAT.PLANK).color(timber, 0.95).beam([x, F.py, F.pz], [x, hy, hz], 0.3, 0.3);
    g.color(timber, 0.6).cbox(x, hy - 0.62, hz, 0.8, 1.15, 0.85, { bottom: true });
    g.surf(MAT.STEEL).color(P.steel, 0.5).cbox(x, hy - 0.2, hz, 0.86, 0.16, 0.91, { bottom: true });
  }
  g.limb = null;
  // the wheel's frame at the end of the row
  g.surf(MAT.PLANK).color(timber, 0.85); for (const dx of [-0.75, 0.75]) { g.beam([X(F.wheelX + dx), 0, F.wheelZ - 1.2], [X(F.wheelX + dx), F.wheelY, F.wheelZ], 0.26, 0.26, { caps: false }); g.beam([X(F.wheelX + dx), 0, F.wheelZ + 1.2], [X(F.wheelX + dx), F.wheelY, F.wheelZ], 0.26, 0.26, { caps: false }); }
  return g.toGeometry({ limb: true, pad: 1 });
}
export function ogresGeometry(o = {}) {
  const g = new Geo(), F = FULL, P = PAL, mir = o.mir ?? 1, X = (x) => x * mir, [hy, hz] = fullHead();
  const verm = mulc(P.verm, 0.88), ultra = mulc(P.ultra, 0.85), green = mulc(P.green, 0.85), pearl = mulc(P.pearl, 0.8), silver = mulc(P.silver, 0.84), dark = [0.012, 0.012, 0.03];
  // a striped screen behind, a brocade canopy on gilded poles with a scalloped valance
  g.surf(MAT.CLOTH).grid(14, 3, (u, v) => [lerp(-F.half, F.half, u), lerp(0.3, 7.3, v), -2.3 + 0.12 * Math.sin(u * 30), 0.25 * Math.sin(v * Math.PI), (u * 14 | 0) % 2 ? verm : GOLD], { both: true, su: 14, sv: 7 });
  g.surf(MAT.BROCADE).color(ultra).grid(8, 3, (u, v) => [lerp(-F.half - 0.6, F.half + 0.6, u), lerp(7.6, 6.15, v) + 0.25 * Math.sin(u * Math.PI * 4) * Math.sin(v * Math.PI), lerp(-3.0, 4.1, v), 0.2 * Math.sin(v * Math.PI)], { both: true, su: 15, sv: 7 });
  g.surf(MAT.CLOTH).grid(16, 1, (u, v) => [lerp(-F.half - 0.6, F.half + 0.6, u), 6.15 - v * (0.55 + 0.35 * Math.abs(Math.sin(u * Math.PI * 8))), 4.1, 0.5 * v, (u * 16 | 0) % 2 ? pearl : verm], { both: true });
  for (let i = 0; i <= 4; i++) { const x = lerp(-F.half, F.half, i / 4); g.surf(MAT.GOLD).color(GOLD).beam([x, 0, 3.5], [x, 6.6, 3.5], 0.2, 0.2, { caps: false }); g.ball(x, 6.7, 3.5, 0.26, 0.34, 0.26, { nu: 5, nv: 3 }); }
  // what they work on: a long anvil, a bar that glows
  g.surf(MAT.STEEL).color(P.steel, 0.5).box(-F.half + 0.5, 0, 0.95, F.half - 0.5, 0.8, 2.6); g.surf(MAT.GOLD).color(GOLD).box(-F.half + 0.45, 0.8, 0.9, F.half - 0.45, 0.9, 2.65);
  g.surf(MAT.GLOW).color([1.0, 0.42, 0.1]).box(-F.half + 0.9, 0.9, 1.5, F.half - 0.9, 1.06, 2.0);
  // six ogres: robed, belted, pot-helmed and horned, no faces; arms and hammer swing from the shoulders
  for (let i = 0; i < F.n; i++) {
    const x = X((i - 2.5) * F.step), robe = [verm, green, ultra][i % 3], z = F.pz;
    g.limb = null;
    g.surf(MAT.BROCADE).color(robe).lathe([[1.02, 0], [0.86, 1.4], [0.92, 2.6], [1.05, 3.6], [0.95, 4.3], [0.5, 4.7]], { cx: x, cz: z, segs: 8, su: 6, sv: 4.5 });
    g.surf(MAT.GOLD).color(GOLD).lathe([[0.95, 2.45], [0.99, 2.75]], { cx: x, cz: z, segs: 8 });
    g.surf(MAT.STEEL).color(silver).lathe([[0.56, 4.6], [0.62, 5.1], [0.5, 5.55], [0.06, 5.8]], { cx: x, cz: z, segs: 8 });
    g.surf(MAT.PLAIN).color(dark).lathe([[0.64, 5.0], [0.64, 5.18]], { cx: x, cz: z, segs: 3, a0: -0.8, a1: 0.8 });
    for (const sx of [-1, 1]) g.surf(MAT.GOLD).color(GOLD).beam([x + sx * 0.5, 5.3, z], [x + sx * 1.0, 6.05, z + 0.1], 0.2, 0.2, { taper: 0.15 });
    g.limb = [F.py, F.pz, 0.4, (i * 0.37) % 1];
    const gy = lerp(F.py, hy, 0.42), gz = lerp(F.pz, hz, 0.42);
    for (const sx of [-1, 1]) g.surf(MAT.BROCADE).color(robe).tube([[x + sx * 0.92, F.py - 0.3, F.pz], [x + sx * 0.7, lerp(F.py, gy, 0.6), lerp(F.pz, gz, 0.55)], [x + sx * 0.2, gy, gz]], [0.42, 0.36, 0.26], { segs: 6 });
    g.surf(MAT.GOLD).color(GOLD).beam([x, lerp(F.py, hy, 0.3), lerp(F.pz, hz, 0.3)], [x, hy, hz], 0.22, 0.22);
    g.surf(MAT.STEEL).color(silver).cbox(x, hy - 0.62, hz, 0.8, 1.15, 0.85, { bottom: true });
    g.surf(MAT.GOLD).color(GOLD).cbox(x, hy - 0.2, hz, 0.86, 0.16, 0.91, { bottom: true });
  }
  g.limb = null;
  for (const dx of [-0.75, 0.75]) { g.surf(MAT.GOLD).color(GOLD).beam([X(F.wheelX + dx), 0, F.wheelZ - 1.2], [X(F.wheelX + dx), F.wheelY, F.wheelZ], 0.22, 0.22, { caps: false }); g.beam([X(F.wheelX + dx), 0, F.wheelZ + 1.2], [X(F.wheelX + dx), F.wheelY, F.wheelZ], 0.22, 0.22, { caps: false }); }
  return g.toGeometry({ limb: true, pad: 1 });
}
// the wheel at the row's end, turning about its own X axis: a water wheel with paddles, or a gilded wheel with vermilion spokes
export function fullWheelGeometry(rich) {
  const g = new Geo(), R = FULL.wheelR, n = 12, rim = rich ? GOLD : mulc(PAL.timber, 0.7), spoke = rich ? mulc(PAL.verm, 0.9) : mulc(PAL.timber, 0.85);
  g.surf(rich ? MAT.GOLD : MAT.PLANK);
  for (let i = 0; i < n; i++) {
    const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, p0 = [Math.cos(a0) * R, Math.sin(a0) * R], p1 = [Math.cos(a1) * R, Math.sin(a1) * R];
    for (const x of [-0.5, 0.5]) g.color(rim).beam([x, p0[0], p0[1]], [x, p1[0], p1[1]], 0.14, 0.3, { caps: false, up: [1, 0, 0] });
    g.color(rich ? mulc(PAL.ultra, 0.85) : mulc(PAL.timber, 0.6)).quad([-0.5, p0[0], p0[1]], [0.5, p0[0], p0[1]], [0.5, p0[0] * 0.8, p0[1] * 0.8], [-0.5, p0[0] * 0.8, p0[1] * 0.8], { both: true });
    if (i % 2 === 0) g.color(spoke).beam([0, 0, 0], [0, p0[0], p0[1]], 0.16, 0.16, { caps: false });
  }
  g.color(rim).beam([-0.9, 0, 0], [0.9, 0, 0], 0.4, 0.4);
  return g.toGeometry({ pad: 0.5 });
}

// ---------------------------------------------------------------- the kit the world builds with
// items: [{ x, y, z, yaw, scale, phase, sign, lock }] -> one InstancedMesh whose sails / arms turn together
export function makePairMesh(geometry, material, depthMaterial, items) {
  const mesh = new THREE.InstancedMesh(geometry, material, items.length), pair = new Float32Array(items.length * 4);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  items.forEach((it, i) => {
    const sc = it.scale ?? 1;
    m.compose(p.set(it.x, it.y ?? 0, it.z), q.setFromEuler(e.set(0, it.yaw ?? 0, 0)), s.set(sc, sc, sc)); mesh.setMatrixAt(i, m);
    pair[i * 4] = it.phase ?? 0; pair[i * 4 + 1] = it.sign ?? 1; pair[i * 4 + 2] = it.lock ?? 0; pair[i * 4 + 3] = 0;
  });
  mesh.geometry = geometry.clone(); mesh.geometry.setAttribute('aPair', new THREE.InstancedBufferAttribute(pair, 4));
  mesh.geometry.boundingSphere = geometry.boundingSphere.clone();
  mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
  if (depthMaterial) { mesh.customDepthMaterial = depthMaterial; mesh.castShadow = true; }
  mesh.receiveShadow = true;
  return mesh;
}

export function makeKit(ctx, o = {}) {
  const U = makeUniforms(), wind = makeWindOf(o.windRng);
  const mats = { solid: makeMannerMaterial(U, {}), spin: makeMannerMaterial(U, { spin: true }), limb: makeMannerMaterial(U, { limb: true }), depthSpin: makeSpinDepthMaterial(U), depth: makeDepthMaterial(U) };
  const state = { rate: 0.34 };
  return {
    U, mats, state, wind,
    // the one rotation of the world: every sail and every arm turns for the whole visit, by the wind's own way on the world clock (wind.spin:
    // state.rate at the wind's mean, a third faster in a gust, a third slower between); the held pose of a pair that makes an arch
    // breathes a little
    update(time) { U.uTime.value = time; U.uSpin.value = wind.spin(time) * state.rate; U.uLock.value = 0.24 + 0.05 * Math.sin(time * 0.43) + 0.02 * Math.sin(time * 1.1 + 1.3); },
  };
}

export async function buildHero(ctx, opts = {}) {
  const kit = opts.kit || makeKit(ctx), object = new THREE.Group(), half = opts.half ?? 17;
  const mill = makePairMesh(millGeometry({ detail: 1 }), kit.mats.spin, kit.mats.depthSpin, [{ x: -half, z: 0, yaw: 0.3, phase: 0.5, sign: 1 }]);
  await ctx.yield();
  const giant = makePairMesh(giantGeometry({ detail: 1 }), kit.mats.spin, kit.mats.depthSpin, [{ x: half, z: 0, yaw: -0.3, phase: 0.5, sign: -1 }]);
  object.add(mill, giant);
  if (opts.road !== false) {
    const g = new Geo(); g.surf(MAT.PLAIN).color(PAL.road, 0.8).quad([-4, 0.03, 60], [4, 0.03, 60], [4, 0.03, -60], [-4, 0.03, -60]);
    const road = new THREE.Mesh(g.toGeometry(), kit.mats.solid); road.receiveShadow = true; object.add(road);
  }
  return {
    object, radius: 26, height: 30, center: new THREE.Vector3(0, 13, 0), kit,
    anchors: { mill: new THREE.Vector3(-half, 0, 0), giant: new THREE.Vector3(half, 0, 0), hub: new THREE.Vector3(0, SK.hubY, SK.hubZ) },
    update(dt, time) { kit.update(time); },
    dispose() {}, ground: true, groundY: 0,
  };
}

// ---------------------------------------------------------------- flowers that stand: each on its stem, in clumps, the same plants in two manners
// One flower is a stem and a head. Its place in the world, its height and its size are its own and are baked here (nothing of it follows the eye); the
// way its head is tilted is seeded (each head leans its own way, and none turns to the eye). The world deals them; all of them are drawn always.
// A flower whose ninth number is 0 is its head alone (two triangles): the world gives that to the flowers too far from its line for a stem to show.
// Left of the road they are the plain's own (poppies in their season, else thistles and dry camomile), right of it the meadow's enamel four.
// o: { flowers [[x, y, z, height, tint, phase, size, lean, stem 1 | 0], ...], season 0..2, fogDensity, fogColor }
export function makeMeadow(U, o = {}) {
  const list = o.flowers || [], n = list.length;
  // (filled straight into typed arrays of the final size: eight corners a flower; its head two triangles and its stem, where it has one, a
  // single blade that tapers to the head: three centimetres wide at the ground)
  const pos = new Float32Array(n * 24), uv = new Float32Array(n * 16), cell = new Float32Array(n * 32), tint = new Float32Array(n * 32), idx = new Uint32Array(n * 12);
  const CORNERS = [[-1, 0, 0, 0, 0], [1, 0, 0, 0, 0], [0, 1, 0, 0, 0], [0, 1, 0, 0, 0], [-1, -1, 1, -1, -1], [1, -1, 1, 1, -1], [1, 1, 1, 1, 1], [-1, 1, 1, -1, 1]];
  // (o.defer: the world fills the arrays itself, a stretch of flowers at a time, with fill(from, to) before the first frame)
  let ni = 0;
  const fill = (f0, f1) => { for (let f = f0; f < f1; f++) {
    const F = list[f], base = f * 8;
    // stem: a thin blade from the ground to the head (corner = side, height, part 0); head: a square about the stem's top (corner = uv, part 1)
    for (let q = 0; q < 8; q++) {
      const C = CORNERS[q], v = base + q;
      pos[v * 3] = C[0]; pos[v * 3 + 1] = C[1]; pos[v * 3 + 2] = C[2]; uv[v * 2] = C[3]; uv[v * 2 + 1] = C[4];
      cell[v * 4] = F[0]; cell[v * 4 + 1] = F[1]; cell[v * 4 + 2] = F[2]; cell[v * 4 + 3] = F[3]; tint[v * 4] = F[4]; tint[v * 4 + 1] = F[5]; tint[v * 4 + 2] = F[6]; tint[v * 4 + 3] = F[7];
    }
    if (F[8] !== 0) { idx.set([base, base + 1, base + 2], ni); ni += 3; }
    idx.set([base + 4, base + 5, base + 6, base + 4, base + 6, base + 7], ni); ni += 6;
  } g.setDrawRange(0, ni); };
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aCell', new THREE.BufferAttribute(cell, 4)); g.setAttribute('aTint', new THREE.BufferAttribute(tint, 4));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  if (!o.defer) fill(0, n);
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      uTime: U.uTime, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol, uNight: U.uNight, uWind: U.uWind,
      uSeason: { value: o.season ?? 0 }, uFogCol: { value: o.fogColor && o.fogColor.isColor ? o.fogColor : new THREE.Color(o.fogColor ?? '#e8c8a0') }, uFog: { value: o.fogDensity ?? 0.0007 },
    },
    vertexShader: /* glsl */`
      attribute vec4 aCell; attribute vec4 aTint;
      uniform float uTime, uSeason, uFog; uniform vec4 uWind;
      varying vec2 vUv; varying vec3 vCol, vHeart; varying float vPart, vFog, vPetals;
      void main(){
        vec2 w = aCell.xz;
        float right = step(0., w.x), t = aTint.x;
        // every flower keeps its place and its true size, wherever the eye is
        float H = aCell.w * (0.75 + 0.5 * right), size = aTint.z * (0.9 + 0.35 * right);
        vec3 petal, heart; float petals;
        if (right > 0.5) {                                             // the meadow's four: pearl, gold, vermilion, blue
          petal = t < 0.36 ? vec3(0.9, 0.86, 0.74) : t < 0.6 ? vec3(0.9, 0.55, 0.03) : t < 0.8 ? vec3(0.74, 0.03, 0.04) : vec3(0.1, 0.2, 0.9);
          heart = t < 0.36 ? vec3(0.85, 0.5, 0.03) : t < 0.6 ? vec3(0.45, 0.16, 0.02) : t < 0.8 ? vec3(0.9, 0.6, 0.05) : vec3(0.92, 0.88, 0.7); petals = t < 0.36 ? 8. : t < 0.6 ? 6. : 5.;
        } else if (uSeason > 1.5) {                                    // poppies, a few white camomile among them
          petal = t < 0.8 ? vec3(0.72, 0.045, 0.02) : vec3(0.82, 0.8, 0.7); heart = t < 0.8 ? vec3(0.02, 0.015, 0.02) : vec3(0.8, 0.55, 0.05); petals = t < 0.8 ? 4. : 9.; size *= t < 0.8 ? 1.25 : 0.8;
        } else {                                                       // thistles and dry heads
          petal = t < 0.45 ? vec3(0.42, 0.2, 0.5) : t < 0.75 ? vec3(0.66, 0.56, 0.3) : vec3(0.8, 0.78, 0.66); heart = t < 0.45 ? vec3(0.22, 0.26, 0.14) : vec3(0.45, 0.32, 0.1); petals = t < 0.45 ? 13. : 9.; H *= 1.15;
        }
        // (a tone above one is a field poppy on either hand and in every season: the lanes' edges)
        if (t > 1.) { petal = vec3(0.74, 0.045, 0.02); heart = vec3(0.02, 0.015, 0.02); petals = 4.; size *= 1.2; }
        float sway = (sin(dot(w, uWind.xy) * 0.42 - uTime * uWind.w * 3.1 + aTint.y * 6.28) * 0.5 + 0.3) * 0.16 * uWind.z;
        vec3 foot = vec3(w.x, aCell.y, w.y), top = foot + vec3(uWind.x * sway + aTint.w * 0.3, 1., uWind.y * sway) * H;
        // the head's own tilt: its face leans from the sky by a seeded angle toward a seeded side; the stem's blade lies across another seeded side
        float az = fract(aTint.y * 7.31 + t * 3.7) * 6.2832, tilt = mix(0.45, 1.1, fract(aTint.y * 13.7 + t * 5.1)), saz = az + 1.3;
        vec3 nrm = vec3(sin(tilt) * cos(az), cos(tilt), sin(tilt) * sin(az)), sideV = vec3(-sin(az), 0., cos(az)), upV = cross(sideV, nrm);
        vec3 P;
        if (position.z < 0.5) P = mix(foot, top, position.y) + vec3(cos(saz), 0., sin(saz)) * position.x * 0.03;
        else P = top + (sideV * position.x + upV * position.y) * size * 1.2 + nrm * 0.03;
        vPart = position.z; vUv = uv; vCol = position.z < 0.5 ? mix(vec3(0.16, 0.2, 0.07), vec3(0.05, 0.22, 0.05), right) * (0.6 + 0.6 * position.y) : petal; vHeart = heart; vPetals = petals;
        vec4 mv = viewMatrix * vec4(P, 1.); vFog = 1. - exp(-uFog * uFog * dot(mv.xyz, mv.xyz));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uSkyCol, uFogCol; uniform float uNight;
      varying vec2 vUv; varying vec3 vCol, vHeart; varying float vPart, vFog, vPetals;
      void main(){
        vec3 col = vCol;
        if (vPart > 0.5) {
          float r = length(vUv), a = atan(vUv.y, vUv.x + 1e-5), edge = vPetals < 4.5 ? 0.82 + 0.14 * cos(vPetals * a) : 0.66 + 0.3 * cos(vPetals * a);
          if (r > edge) discard;
          col = mix(vHeart, vCol * (0.72 + 0.4 * r), smoothstep(0.16, 0.24, r)) * (0.9 + 0.1 * cos(vPetals * a));
        }
        col *= uSkyCol * 0.8 + uSunCol * 0.52 + 0.2;                   // back-lit by the low sun: petals glow
        col = mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2))) * vec3(0.7, 0.8, 1.1), uNight * 0.6);
        gl_FragColor = vec4(mix(col, uFogCol, clamp(vFog, 0., 1.)), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return { mesh, material: mat, get triangles() { return ni / 3; }, fill };
}

// ---------------------------------------------------------------- the far layer: a white village about its church tower; in the same place across the road, a city of spires
// One plan (a seeded scatter of blocks about a tall one, about 190 by 130 m), two manners. Built large, to stand a long way off.
export const farTownPlan = (rng, n = 26) => { const plan = []; for (let i = 0; i < n; i++) { const a = rng() * TAU, r = 16 + 60 * Math.sqrt(rng()); plan.push([Math.cos(a) * r * 1.4, Math.sin(a) * r * 0.9, 6 + 5 * rng(), 5 + 4.5 * rng(), rng(), rng()]); } return plan; };
export function farTownGeometry(plan, rich) {
  const g = new Geo(), P = PAL;
  const white = mulc(P.white, 0.84), tile = mulc(P.tile, 0.78), stone = mulc(P.pearl, 0.72), slate = mulc(P.slate, 0.85), gold = mulc(P.gold, 0.85), silver = mulc(P.silver, 0.84), dark = [0.03, 0.03, 0.035];
  const house = (x, z, w, d, h) => {
    g.surf(MAT.PLAIN).color(white).box(x - w, -5, z - d, x + w, h, z + d, { top: false });
    g.surf(MAT.TILE).color(tile).quad([x - w - 0.5, h - 0.3, z + d + 0.5], [x + w + 0.5, h - 0.3, z + d + 0.5], [x + w + 0.5, h + d * 0.6, z], [x - w - 0.5, h + d * 0.6, z]).quad([x + w + 0.5, h - 0.3, z - d - 0.5], [x - w - 0.5, h - 0.3, z - d - 0.5], [x - w - 0.5, h + d * 0.6, z], [x + w + 0.5, h + d * 0.6, z]);
    g.surf(MAT.PLAIN).color(white).tri([x - w, h, z + d], [x - w, h, z - d], [x - w, h + d * 0.58, z], { both: true }).tri([x + w, h, z - d], [x + w, h, z + d], [x + w, h + d * 0.58, z], { both: true });
  };
  const spire = (x, z, R, H, cap, flag) => {
    g.surf(MAT.STONE).color(stone).lathe([[R, -5], [R * 0.94, H], [R * 1.14, H + 0.8], [R * 1.14, H + 2.4]], { segs: 5, cx: x, cz: z, su: 12, sv: H / 3 });
    g.surf(MAT.STEEL).color(cap).lathe([[R * 1.22, H + 2.2], [R * 0.5, H + R * 2.4], [0.1, H + R * 5.6]], { segs: 5, cx: x, cz: z });
    if (flag) { g.surf(MAT.PLANK).color(mulc(P.timber, 0.8)).beam([x, H + R * 5.5, z], [x, H + R * 5.5 + 7, z], 0.4, 0.4, { caps: false }); g.surf(MAT.CLOTH).grid(3, 1, (u, v) => [x + 0.3 + 9 * u, H + R * 5.5 + 3.2 + 3.4 * v, z + 0.5 * Math.sin(u * 5), 2.2 * u, v < 0.5 ? gold : mulc(P.verm, 0.9)], { both: true, su: 9, sv: 3.4 }); }
  };
  if (rich) {
    g.surf(MAT.STONE).color(stone).lathe([[92, -5], [92, 10], [90.5, 10]], { segs: 22, sx: 1.4, sz: 0.9, su: 320, sv: 10 });      // the city's wall
    for (let i = 0; i < 11; i++) { const a = i / 11 * TAU; spire(Math.sin(a) * 92 * 1.4, Math.cos(a) * 92 * 0.9, 4.2, 15, i % 2 ? slate : silver, false); }
    for (const [x, z, w, h, r1, r2] of plan) spire(x, z, w * 0.55, h * (2.0 + 2.4 * r2), r1 < 0.5 ? silver : slate, r1 > 0.72);
    spire(0, 0, 8, 46, silver, true); g.surf(MAT.GOLD).color(gold).ball(0, 46 + 8 * 5.6, 0, 1.6, 1.6, 1.6, { nu: 6, nv: 4 });
  } else {
    for (const [x, z, w, h, r1] of plan) house(x, z, w, w * (0.6 + 0.4 * r1), h);
    house(-13, 0, 15, 7.5, 13);                                        // the church: a nave and a square tower, a tiled cap, the bell openings dark
    g.surf(MAT.PLAIN).color(white).box(2, -5, -5, 12, 36, 5, { top: false });
    g.surf(MAT.TILE).color(tile); for (let k = 0; k < 4; k++) { const c = [[2, -5], [12, -5], [12, 5], [2, 5]], a = c[k], b = c[(k + 3) % 4]; g.tri([a[0] + (a[0] < 7 ? -0.6 : 0.6), 35.6, a[1] + (a[1] < 0 ? -0.6 : 0.6)], [b[0] + (b[0] < 7 ? -0.6 : 0.6), 35.6, b[1] + (b[1] < 0 ? -0.6 : 0.6)], [7, 43, 0], { both: true }); }
    g.surf(MAT.PLAIN).color(dark); for (const [a, b] of [[[4.5, 28, 5.06], [9.5, 28, 5.06]], [[9.5, 28, -5.06], [4.5, 28, -5.06]]]) g.quad(a, b, [b[0], 33, b[2]], [a[0], 33, a[2]]);
    for (const [a, b] of [[[12.06, 28, 2.5], [12.06, 28, -2.5]], [[1.94, 28, -2.5], [1.94, 28, 2.5]]]) g.quad(a, b, [b[0], 33, b[2]], [a[0], 33, a[2]]);
  }
  return g.toGeometry();
}

// ---------------------------------------------------------------- a field's edge: a dry-stone wall on the left; in the same place on the right, a clipped hedge in flower
// along +X from 0 to len (metres), about 1.1 m high
// A DRY STONE WALL built stone by stone, to be passed at three and a half metres: four courses of stones of drawn lengths (a third of a metre to
// five sixths), each a little in or out of line and of its own tone, some dark, some grey-green with lichen; a cope of stones set on edge
// across it, leaning as they were set; one place in its middle half where it has fallen to its lowest course, the fallen stones lying at its
// foot on both sides; dry weeds at its foot. it.h(x) is the ground under it x metres along.
function dryWall(g, it, rng) {
  const P = PAL, len = it.len, T = 0.26, base = mulc(mixc(P.stone, P.white, 0.3), 0.85), lich = [0.4, 0.42, 0.2], dark = mulc(P.stone, 0.68), H = 1.09;
  const yAt = (x) => (it.h ? it.h(x) - (it.y ?? 0) : 0);
  // (it.gone(x): where, x metres along it, the wall gives way to a thing that stands there; every stone is drawn for all the same)
  const gone = it.gone || (() => false);
  const gapAt = lerp(0.25, 0.75, rng()) * len, gapW = 1.5;
  const top = (x) => { const d = Math.abs(x - gapAt); return d < gapW ? 0.34 + (H - 0.34) * smoothstep(0.2, gapW, d) : H; };
  g.surf(MAT.WOOL);
  let y = 0;
  for (let c = 0; c < 4; c++) {
    const ch = [0.3, 0.28, 0.26, 0.25][c];
    for (let x = -rng() * 0.3; x < len;) {
      const w = 0.34 + 0.5 * rng(), xm = clamp(x + w / 2, 0, len), k = rng(), dz = (rng() - 0.5) * 0.07, dy = (rng() - 0.5) * 0.03, tone = 0.78 + 0.34 * rng();
      if (y + ch * 0.6 < top(xm) && !gone(xm)) {
        g.color(k > 0.84 ? mixc(base, lich, 0.55) : k < 0.12 ? dark : base, tone);
        g.box(Math.max(x + 0.015, 0), yAt(xm) + y + dy - (c ? 0 : 0.4), dz - T, Math.min(x + w - 0.015, len), yAt(xm) + y + ch + dy, dz + T, { top: c === 3 || y + ch * 1.6 >= top(xm) });
      }
      x += w;
    }
    y += ch;
  }
  for (let x = 0.04; x < len - 0.1;) {
    const w = 0.16 + 0.18 * rng(), hgt = 0.24 + 0.14 * rng(), lean = (rng() - 0.5) * 0.5, k = rng(), tone = 0.8 + 0.35 * rng(), xm = x + w / 2;
    if (top(xm) > H - 0.04 && !gone(xm)) { g.color(k > 0.8 ? mixc(base, lich, 0.5) : base, tone); g.rotZ(lean, xm, yAt(xm) + H).box(x, yAt(xm) + H - 0.03, -T - 0.05, x + w, yAt(xm) + H + hgt, T + 0.05); g.pop(); }
    x += w + 0.02;
  }
  for (let i = 0; i < 10; i++) {
    const x = clamp(gapAt + (rng() - 0.5) * 2.8, 0.3, len - 0.3), z = (i % 2 ? 1 : -1) * (0.45 + 0.9 * rng()), w = 0.3 + 0.3 * rng(), hgt = 0.14 + 0.12 * rng();
    const tone = 0.75 + 0.35 * rng(), turn = rng() * 3;
    if (gone(x)) continue;
    g.color(base, tone); g.push(new THREE.Matrix4().makeTranslation(x, yAt(x), z).multiply(new THREE.Matrix4().makeRotationY(turn))); g.box(-w / 2, -0.06, -0.16, w / 2, hgt, 0.16); g.pop();
  }
  g.surf(MAT.CLOTH);
  for (let x = 0.4; x < len; x += 0.6 + 1.2 * rng()) {
    const z = (rng() < 0.5 ? -1 : 1) * (T + 0.07), hgt = 0.3 + 0.5 * rng(), y0 = yAt(x), c = mixc(mulc(P.stubble, 0.9), mulc(P.olive, 0.7), rng());
    if (!gone(x)) for (let b = -1; b <= 1; b++) g.color(c, 0.8 + 0.15 * b).tri([x + b * 0.07 - 0.03, y0, z], [x + b * 0.07 + 0.03, y0, z], [x + b * 0.2, y0 + hgt * (1 - 0.2 * Math.abs(b)), z * (1.2 + 0.25 * Math.abs(b))], { both: true, w: [0, 0, 0.5] });
  }
}
// THE DRY WALL'S TWIN, passed as close: a clipped hedge of roses with a rounded top that rises and falls a little along its length, growing
// over a dressed parapet with a gold cope; roses stand out of its leaves on both faces and its top (five to every 1.3 m), each a small
// round head, vermilion, pearl or gold.
function roseHedge(g, it, rng) {
  const P = PAL, len = it.len, n = Math.max(3, Math.round(len / 1.3)), leaf = [0.03, 0.2, 0.06], cols = [mulc(P.verm, 0.95), mulc(P.pearl, 0.9), mulc(P.gold, 0.9)];
  const yAt = (x) => (it.h ? it.h(x) - (it.y ?? 0) : 0), hs = []; for (let i = 0; i <= n; i++) hs.push(1.25 + 0.3 * rng());
  // (it.gone(x): where the hedge gives way to a thing that stands there, a length at a time; its roses are drawn for all the same)
  const gone = it.gone || (() => false), away = []; for (let i = 0; i < n; i++) away.push(gone((i + 0.5) / n * len));
  const prof = [[-0.6, 0.5], [-0.66, 1.0], [-0.4, 1.0], [0, 1.0], [0.4, 1.0], [0.66, 1.0], [0.6, 0.5]], top = [0, 0, 0.82, 1, 0.82, 0, 0];
  for (let i = 0; i < n; i++) { const x0 = i / n * len, x1 = (i + 1) / n * len, y = yAt((x0 + x1) / 2); if (away[i]) continue;
    g.surf(MAT.STONE).color(mulc(P.pearl, 0.82)).box(x0, y - 0.5, -0.62, x1, y + 0.46, 0.62, { top: false }); g.surf(MAT.GOLD).color(GOLD).box(x0, y + 0.46, -0.7, x1, y + 0.54, 0.7); }
  // (the hedge's sheet, one for every run of lengths that stand: the whole hedge where none gives way)
  for (let i0 = 0; i0 < n;) { if (away[i0]) { i0++; continue; } let i1 = i0; while (i1 < n && !away[i1]) i1++; const m = i1 - i0, a0 = i0;
    g.surf(MAT.WOOL).grid(m, 6, (u, v) => { const i = a0 + Math.round(u * m), k = Math.round(v * 6), p = prof[k], x = i / n * len, hh = hs[i];
      return [x, yAt(x) + (top[k] ? lerp(p[1], hh, top[k]) : p[1]), p[0], 0, mulc(leaf, 0.75 + 0.5 * ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1)]; }, { su: len * m / n, sv: 3, flip: true });
    i0 = i1; }
  for (let i = 0; i < n; i++) for (let j = 0; j < 5; j++) {
    const x = (i + rng()) / n * len, a = rng(), c = cols[Math.floor(rng() * 3)], hh = lerp(hs[i], hs[i + 1], x * n / len - i), r = 0.09 + 0.05 * rng(), face = a < 0.4 ? -1 : a < 0.8 ? 1 : 0, yy = rng();
    const z = face ? face * 0.66 : (yy - 0.5) * 0.7, y = yAt(x) + (face ? 0.62 + 0.4 * yy : 1.0 + (hh - 1.0) * (1 - Math.abs(z) / 0.6) + 0.02);
    if (!away[Math.min(i, n - 1)]) g.surf(MAT.GLOW).color(c, 0.5).ball(x, y - r * 0.4, z, r, r, r, { nu: 3, nv: 2 });
  }
}
// (a builder, so that the page can be handed back between one wall and the next: add(it) lays one edge, geometry() ends it)
export function fieldEdgeBuilder(rich, rng) { const g = new Geo(); return { add: (it) => fieldEdge(g, it, rich, rng), geometry: () => g.toGeometry() }; }
export function fieldEdgeGeometry(list, rich, rng) { const b = fieldEdgeBuilder(rich, rng); for (const it of list) b.add(it); return b.geometry(); }
// THE OPENING'S FIELDS: what stands in them, in one geometry a hand of the road (the plain make, or across the road the golden one).
//   wall(it)                 a field's wall (a far edge of fieldEdge: rough blocks / a clipped hedge with its roses), it as fieldEdge takes it
//   rick(x, y, z, ry, s)     a haystack round its pole, with a ladder leaning on it (4.7 m; pole 5.6 m)  /  a tall round tent, striped, with its pennon (6.2 m)
//   sweep(x, y, z, ry, s)    a well with its sweep: kerb, forked post, the long pole with its stone and its bucket (6 m)  /  a gilded fountain (5 m)
//   stake(x, y, z, h)        a vine's stake  /  a rose's gilded stake
//   furrow(x, z, len, h)     one ridge of a ploughed field, from (x, z) up the road (toward -z) for len metres: a bank of turned earth 0.56 m
//                            wide and 0.24 m high in six-metre lengths that follow the ground (h(t) = the ground's height t metres along)
// (The world reads each thing's height and reach off the geometry as built.)
export function fieldThingsBuilder(rich, rng) {
  const g = new Geo(), P = PAL, straw = mulc(P.stubble, 1.0), stone = mulc(P.stone, 0.72), pearl = mulc(P.pearl, 0.8), timber = mulc(P.timber, 0.75);
  return {
    wall: (it) => fieldEdge(g, it, rich, rng),
    rick(x, y, z, ry, s = 1) {
      g.at(x, y, z, ry, s);
      if (!rich) {
        // (the stack: straw laid in courses, each a little darker under the next one's eave; a thatched cap; the pole it is built round)
        g.surf(MAT.WOOL).color(straw).lathe([[2.6, -0.3, mulc(straw, 0.7)], [2.9, 1.3, mulc(straw, 0.95)], [2.75, 1.45, mulc(straw, 0.6)], [2.8, 2.6, straw], [2.5, 2.75, mulc(straw, 0.62)], [1.5, 3.9, mulc(straw, 1.1)], [0.2, 4.7, mulc(straw, 0.85)]], { segs: 9 });
        g.surf(MAT.PLANK).color(timber).beam([0, 4.5, 0], [0, 5.6, 0], 0.14, 0.14);
        for (const sx of [-0.3, 0.3]) g.beam([sx, -0.2, 3.9], [sx, 3.6, 2.0], 0.07, 0.07, { caps: false });
        for (let i = 0; i < 5; i++) { const t = (i + 0.7) / 5.6; g.beam([-0.3, lerp(-0.2, 3.6, t), lerp(3.9, 2.0, t)], [0.3, lerp(-0.2, 3.6, t), lerp(3.9, 2.0, t)], 0.05, 0.05, { caps: false }); }
      } else {
        for (let i = 0; i < 8; i++) g.surf(MAT.CANVAS).color(i % 2 ? mulc(P.verm, 0.85) : mulc(P.gold, 0.85)).lathe([[2.6, -0.3], [2.6, 2.3], [2.85, 2.5], [0.06, 6.2]], { segs: 1, a0: i * TAU / 8, a1: (i + 1) * TAU / 8 });
        g.surf(MAT.GOLD).color(GOLD).lathe([[2.9, 2.2], [2.9, 2.5]], { segs: 8, both: true }); g.ball(0, 6.35, 0, 0.2, 0.26, 0.2, { nu: 5, nv: 3 });
        g.surf(MAT.PLAIN).color([0.03, 0.026, 0.03]).quad([-0.7, -0.3, 2.62], [0.7, -0.3, 2.62], [0.45, 2.0, 2.62], [-0.45, 2.0, 2.62]);
        g.surf(MAT.PLANK).color(timber).beam([0, 6.2, 0], [0, 7.25, 0], 0.1, 0.1);
        g.surf(MAT.CLOTH).grid(2, 1, (u, q) => [1.8 * u, 6.6 + 0.5 * q * (1 - 0.6 * u), 0.12 * Math.sin(u * 4), 1.2 * u, mulc(P.ultra, 0.9)], { both: true, su: 1.8, sv: 0.5 });
      }
      g.pop();
    },
    sweep(x, y, z, ry, s = 1) {
      g.at(x, y, z, ry, s);
      if (!rich) {
        g.surf(MAT.STONE).color(stone).lathe([[1.3, -0.3], [1.3, 0.9], [0.95, 0.9], [0.95, 0.2]], { segs: 9, flat: true });
        // (the forked post, the sweep across its fork with a stone lashed to its butt, the rod and its bucket over the well's mouth)
        g.surf(MAT.PLANK).color(timber).beam([-2.4, -0.3, 0], [-2.4, 3.6, 0], 0.22, 0.22); g.beam([-2.4, 3.6, 0], [-2.4, 4.2, 0.28], 0.1, 0.1); g.beam([-2.4, 3.6, 0], [-2.4, 4.2, -0.28], 0.1, 0.1);
        g.color(timber, 1.15).beam([-5.4, 1.5, 0], [0, 6.0, 0], 0.16, 0.16, { taper: 0.6 });
        g.surf(MAT.STONE).color(stone, 0.8).cbox(-5.2, 1.1, 0, 0.7, 0.6, 0.6);
        g.surf(MAT.PLANK).color(timber, 0.9).beam([0, 6.0, 0], [0, 2.0, 0], 0.045, 0.045, { caps: false }); g.color(timber, 0.7).lathe([[0.2, 1.5], [0.26, 2.0]], { segs: 6, both: true });
        g.surf(MAT.STONE).color(stone, 0.85).box(1.9, -0.3, -0.5, 4.6, 0.5, 0.5); g.surf(MAT.PLAIN).color([0.2, 0.3, 0.36]).quad([2.04, 0.51, 0.38], [4.46, 0.51, 0.38], [4.46, 0.51, -0.38], [2.04, 0.51, -0.38]);
      } else {
        g.surf(MAT.STONE).color(pearl).lathe([[2.4, -0.3], [2.4, 0.8], [2.1, 0.8], [0.4, 0.5]], { segs: 12 }); g.surf(MAT.GLASS).color([0.5, 0.7, 0.9]).disc(0, 0.68, 0, 2.1, 12);
        g.surf(MAT.GOLD).color(GOLD).lathe([[0.3, 0.5], [0.24, 1.9], [1.3, 2.2], [1.35, 2.4], [0.25, 2.3], [0.2, 3.3], [0.8, 3.5], [0.85, 3.7], [0.15, 3.6], [0.12, 4.3], [0.4, 4.5], [0.02, 5.0]], { segs: 10 });
      }
      g.pop();
    },
    furrow(x, z, len, h) {
      const n = Math.max(1, Math.round(len / 6)), lit = rich ? [0.2, 0.15, 0.1] : [0.26, 0.18, 0.11], dark = rich ? [0.09, 0.065, 0.05] : [0.12, 0.08, 0.05];
      g.surf(MAT.PLAIN);
      for (let i = 0; i < n; i++) { const t0 = i / n * len, t1 = (i + 1) / n * len, y0 = h(t0), y1 = h(t1), k = 0.85 + 0.3 * (((Math.sin((x + i) * 12.9898) * 43758.5453) % 1 + 1) % 1);
        g.color(lit, k).quad([x - 0.28, y0 - 0.05, z - t0], [x, y0 + 0.24, z - t0], [x, y1 + 0.24, z - t1], [x - 0.28, y1 - 0.05, z - t1]);
        g.color(dark, k).quad([x, y0 + 0.24, z - t0], [x + 0.28, y0 - 0.05, z - t0], [x + 0.28, y1 - 0.05, z - t1], [x, y1 + 0.24, z - t1]); }
    },
    stake(x, y, z, h) { g.surf(rich ? MAT.GOLD : MAT.PLANK).color(rich ? GOLD : timber, rich ? 1 : 0.9).beam([x, y - 0.3, z], [x, y + h, z], 0.07, 0.07, { caps: false }); },
    geometry: () => g.toGeometry(),
  };
}
function fieldEdge(g, it, rich, rng) {
  const P = PAL;
  {
  const len = it.len, n = Math.max(3, Math.round(len / (it.seg ?? 2.6)));
  g.at(it.x, it.y ?? 0, it.z, it.ry);
  const lift = (x) => g.push(new THREE.Matrix4().makeTranslation(0, it.h ? it.h(x) - (it.y ?? 0) : 0, 0));
  if (!rich && !it.far) dryWall(g, it, rng);
  else if (!it.far) roseHedge(g, it, rng);
  else if (!rich) {
    const stone = mulc(mixc(P.stone, P.white, 0.3), 0.85);             // (a plot's wall, far off: pale field stone in eight-metre lengths)
    for (let i = 0; i < n; i++) {                                      // courses of rough blocks, each a little out of line; some fallen
      const x0 = i / n * len, x1 = (i + 1) / n * len, h = 0.85 + 0.4 * rng(), dz = (rng() - 0.5) * 0.3, t = 0.34 + 0.1 * rng();
      lift((x0 + x1) / 2);
      if (rng() < 0.07) { g.surf(MAT.STONE).color(stone, 0.9).cbox((x0 + x1) / 2, 0, dz + 0.9, 0.9, 0.35, 0.7); g.pop(); continue; }
      g.surf(MAT.STONE).color(stone, 0.85 + 0.3 * rng()).box(x0, -0.5, dz - t, x1, h, dz + t);
      g.color(stone, 1.05).box(x0 + 0.1, h, dz - t * 0.7, x1 - 0.15, h + 0.16, dz + t * 0.7);
      g.pop();
    }
  } else {
    // A FIELD'S HEDGE, far off: ONE CLIPPED HEDGE the length of the run, its top rounded, rising and falling a little along it, its
    // ends rounded down, its leaves of several greens; a rose is one flat head on its face; here and there a clipped ball stands on it.
    // (Every length draws its numbers as a hedge built in lengths would: its height, its place across, its tone, its roses, its ball.)
    const leaf = [0.05, 0.21, 0.07], leaf2 = [0.14, 0.31, 0.08], cols = [mulc(P.verm, 0.95), mulc(P.pearl, 0.9), mulc(P.gold, 0.9)];
    const yAt = (x) => (it.h ? it.h(x) - (it.y ?? 0) : 0), hs = [], dzs = [], tones = [], roses = [], balls = [];
    for (let i = 0; i < n; i++) {
      const x0 = i / n * len, x1 = (i + 1) / n * len, h = 1.0 + 0.3 * rng(), dz = (rng() - 0.5) * 0.2; hs.push(h); dzs.push(dz); tones.push(0.8 + 0.4 * rng());
      for (let k = 0, nk = it.bare ? 0 : 2; k < nk; k++) { const c = cols[Math.floor(rng() * 3)], x = lerp(x0, x1, rng()), y = 0.25 + (h - 0.3) * rng(), sgn = rng() < 0.5 ? -1 : 1; roses.push([c, x, y, sgn, i]); }
      if (rng() < 0.3 && !it.bare) balls.push(i);
    }
    // (at a joint of two lengths the hedge has the mean of their heights and places; an end stands at three fifths of its height and width)
    const at = (a, i) => (a[Math.max(i - 1, 0)] + a[Math.min(i, n - 1)]) / 2, end = (i) => (i === 0 || i === n ? 0.6 : 1);
    const prof = [[-0.5, -0.5, 0], [-0.56, 0.55, 1], [-0.4, 0.86, 1], [0, 1, 1], [0.4, 0.86, 1], [0.56, 0.55, 1], [0.5, -0.5, 0]];
    const pt = (i, k) => { const p = prof[k], x = i / n * len, e = end(i); return [x, yAt(x) + (p[2] ? p[1] * at(hs, i) * e : p[1]), at(dzs, i) + p[0] * e]; };
    g.surf(MAT.WOOL).grid(n, 6, (u, v) => { const i = Math.round(u * n), k = Math.round(v * 6), q = pt(i, k), f = ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
      return [q[0], q[1], q[2], 0, mulc(mixc(leaf, leaf2, f), at(tones, i) * (0.85 + 0.25 * prof[k][2] * prof[k][1]))]; }, { su: len, sv: 3, flip: true });
    for (const i of [0, n]) { g.color(mixc(leaf, leaf2, 0.4), 0.9); for (let k = 1; k < 6; k++) g.tri(pt(i, 0), pt(i, k), pt(i, k + 1), { both: true }); }
    // (how wide the hedge is at a height, as its section has it)
    const halfAt = (y, hh) => (y < 0.55 * hh ? lerp(0.5, 0.56, clamp((y + 0.5) / (0.55 * hh + 0.5), 0, 1)) : y < 0.86 * hh ? lerp(0.56, 0.4, (y - 0.55 * hh) / (0.31 * hh)) : 0.4);
    g.surf(MAT.GLOW); for (const [c, x, y0, sgn, i] of roses) { const hh = hs[i], y = Math.min(y0, 0.84 * hh), z = lerp(at(dzs, i), at(dzs, i + 1), x * n / len - i) + sgn * (halfAt(y, hh) + 0.05), yy = yAt(x) + y;
      g.color(c, 0.5).quad([x - sgn * 0.1, yy, z], [x + sgn * 0.1, yy, z], [x + sgn * 0.1, yy + 0.2, z], [x - sgn * 0.1, yy + 0.2, z]); }
    g.surf(MAT.WOOL); for (const i of balls) { const xm = (i + 0.5) / n * len; g.color(mixc(leaf, leaf2, 0.5), 1.05).ball(xm, yAt(xm) + hs[i] + 0.1, dzs[i], 0.75, 0.6, 0.6, { nu: 6, nv: 3 }); }
  }
  g.pop();
  }
}

// ---------------------------------------------------------------- the village at the road's end: one street, two manners
// A pane that is lit when the visit's hour (a standing value) is past its own share (uv.x = that share, the same over the whole pane; the
// material adds a seeded part for every house, so that no two houses light alike)
const lampQuad = (g, A, B, C, D, t) => {
  const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = D[0] - A[0], vy = D[1] - A[1], vz = D[2] - A[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  const a = g.v(A[0], A[1], A[2], nx, ny, nz, t, 0), b = g.v(B[0], B[1], B[2], nx, ny, nz, t, 0), c = g.v(C[0], C[1], C[2], nx, ny, nz, t, 1), d = g.v(D[0], D[1], D[2], nx, ny, nz, t, 1);
  g.idx.push(a, b, c, a, c, d);
};
const LAMPC = [1.0, 0.6, 0.2];
// a window on the wall z = zf facing +z (dir 1) or on the wall x = xf facing +-x (dir 2, -2)
const pane = (g, dir, at, f, y0, w, h, t) => {
  g.surf(MAT.LAMP).color(LAMPC);
  if (dir === 1) lampQuad(g, [at - w / 2, y0, f], [at + w / 2, y0, f], [at + w / 2, y0 + h, f], [at - w / 2, y0 + h, f], t);
  else if (dir === 2) lampQuad(g, [f, y0, at + w / 2], [f, y0, at - w / 2], [f, y0 + h, at - w / 2], [f, y0 + h, at + w / 2], t);
  else lampQuad(g, [f, y0, at - w / 2], [f, y0, at + w / 2], [f, y0 + h, at + w / 2], [f, y0 + h, at - w / 2], t);
};
// a house of the street, its front on z = 0 facing +z, x along the street; v = 0 a low house, 1 a house of two floors, 2 a barn with a wide door.
// rich: a hall of the shining city in the same place: pearl, taller by half, a steep blue or red roof with a gold ridge, tall lit windows, a banner.
// (its three makes' widths along the street and depths behind the front, at scale one)
const STREET_HOUSE = { w: [9, 7.6, 11], d: [6.5, 7, 8] };
// (a street house's front wall, to its eaves, at its own size: one floor, two floors, the wide one; half as tall again across the road)
export const STREET_H = (v, rich) => (v === 1 ? 5.9 : v === 2 ? 4.4 : 3.3) * (rich ? 1.5 : 1);
export function streetHouseGeometry(v = 0, rich = false) {
  const g = new Geo(), P = PAL, w = STREET_HOUSE.w[v], d = STREET_HOUSE.d[v], fl = [1, 2, 1][v];
  const hw = w / 2, k = rich ? 1.5 : 1, h = STREET_H(v, rich), rh = (rich ? 4.6 : 2.3) * (v === 2 ? 1.2 : 1);
  const wall = rich ? mulc(P.pearl, 0.8) : mulc(P.white, 0.84), foot = rich ? mulc(P.pearl, 0.62) : mixc(mulc(P.white, 0.84), mulc(P.dust, 0.8), 0.6);
  const roof = rich ? (v === 1 ? mulc(P.verm, 0.8) : mulc(P.slate, 0.9)) : mulc(P.tile, v === 1 ? 0.72 : 0.82), timber = mulc(P.timber, 0.7);
  g.surf(rich ? MAT.STONE : MAT.PLAIN).color(foot).box(-hw, 0, -d, hw, 1.0 * k, 0, { top: false }); g.color(wall).box(-hw, 1.0 * k, -d, hw, h, 0, { top: false });
  for (const sx of [-1, 1]) g.tri([sx * hw, h, sx > 0 ? 0 : -d], [sx * hw, h, sx > 0 ? -d : 0], [sx * hw, h + rh, -d / 2]);
  g.surf(MAT.TILE).color(roof); tileRoof(g, -hw, hw, -d, 0, h - 0.1, h + rh + 0.1, 0.5);
  if (rich) { g.surf(MAT.GOLD).color(GOLD).beam([-hw - 0.5, h + rh + 0.15, -d / 2], [hw + 0.5, h + rh + 0.15, -d / 2], 0.22, 0.22); g.box(-hw - 0.04, h - 0.5, 0, hw + 0.04, h - 0.25, 0.08); }
  else { g.surf(MAT.PLAIN).color(wall).cbox(hw - 1.6, h + 0.6, -d * 0.7, 0.9, rh + 0.9, 0.9); g.surf(MAT.TILE).color(roof).cbox(hw - 1.6, h + rh + 1.5, -d * 0.7, 1.15, 0.16, 1.15); }
  // the door, and the windows of each floor: on the front and on both gable ends
  const dw = v === 2 ? 3.2 : 1.3, dh = (v === 2 ? 3.3 : 2.2) * (rich ? 1.3 : 1), dx = v === 1 ? -hw + 1.7 : 0.3;
  g.surf(MAT.PLANK).color(rich ? mulc(P.ultra, 0.5) : timber, 0.8).quad([dx - dw / 2, 0, 0.05], [dx + dw / 2, 0, 0.05], [dx + dw / 2, dh, 0.05], [dx - dw / 2, dh, 0.05]);
  if (rich) g.surf(MAT.GOLD).color(GOLD).box(dx - dw / 2 - 0.12, dh, 0, dx + dw / 2 + 0.12, dh + 0.2, 0.12);
  const ww = rich ? 0.85 : 0.95, wh = rich ? 2.3 : 1.15, n = v === 1 ? 2 : 3;
  for (let f = 0; f < (rich ? fl + 1 : fl); f++) {
    const y0 = (rich ? 1.9 : 1.35) + f * (rich ? 3.7 : 2.7); if (y0 + wh > h - 0.3) break;
    for (let i = 0; i < n; i++) {
      const x = lerp(-hw + 1.4, hw - 1.4, n > 1 ? i / (n - 1) : 0.5); if (f === 0 && Math.abs(x - dx) < dw / 2 + 0.8) continue;
      pane(g, 1, x, 0.05, y0, ww, wh, 0.07 + 0.86 * ((i * 0.37 + f * 0.53 + v * 0.21) % 1));
      if (!rich) { g.surf(MAT.PLANK).color(timber); for (const e of [-1, 1]) g.quad([x + e * (ww / 2 + 0.3) - 0.28, y0, 0.07], [x + e * (ww / 2 + 0.3) + 0.28, y0, 0.07], [x + e * (ww / 2 + 0.3) + 0.28, y0 + wh, 0.07], [x + e * (ww / 2 + 0.3) - 0.28, y0 + wh, 0.07]); }
    }
    for (const sx of [-1, 1]) pane(g, 2 * sx, -d / 2, sx * (hw + 0.05), y0, ww, wh, 0.07 + 0.86 * ((0.61 + sx * 0.17 + f * 0.29 + v * 0.13) % 1));
  }
  if (rich) {                                                        // a banner from the gable's point
    const c1 = v === 1 ? GOLD : mulc(P.verm, 0.9), y = h + rh;
    g.surf(MAT.PLANK).color(timber).beam([hw, y, -d / 2], [hw, y + 3.4, -d / 2], 0.2, 0.2, { taper: 0.6 });
    g.surf(MAT.CLOTH).grid(4, 1, (u, q) => [hw + 3.2 * u, y + 2.0 + 1.3 * q * (1 - 0.5 * u), -d / 2 + 0.2 * Math.sin(u * 5), 1.4 * u, q < 0.5 ? c1 : mulc(P.ultra, 0.9)], { both: true, su: 3.2, sv: 1.3 });
  }
  return g.toGeometry({ pad: 1 });
}
// a tower of the shining city (round, pearl, a blue cone with a gold ball, lit windows up its height, a pennon); k = 0, 1: two heights.
// plain: what stands there on the left: a square dovecote tower of rubble with a tiled cap, a third as high
export function streetTowerGeometry(k = 0, rich = true) {
  const g = new Geo(), P = PAL;
  if (!rich) {
    const h = 8.5 + 2 * k, r = 2.1;
    g.surf(MAT.PLAIN).color(mixc(mulc(P.white, 0.84), mulc(P.dust, 0.8), 0.5)).box(-r, 0, -r, r, 1.2, r, { top: false }); g.color(P.white, 0.84).box(-r, 1.2, -r, r, h, r, { top: false });
    g.surf(MAT.TILE).color(P.tile, 0.8); for (let i = 0; i < 4; i++) { g.at(0, 0, 0, i * Math.PI / 2); g.tri([-r - 0.4, h, r + 0.4], [r + 0.4, h, r + 0.4], [0, h + 2.2, 0]); g.pop(); }
    pane(g, 1, 0, r + 0.04, h * 0.55, 0.8, 1.0, 0.5 + 0.2 * k);
    g.surf(MAT.PLAIN).color([0.03, 0.026, 0.022]); for (let i = 0; i < 3; i++) g.quad([-0.9 + i * 0.7, h - 1.3, r + 0.04], [-0.5 + i * 0.7, h - 1.3, r + 0.04], [-0.5 + i * 0.7, h - 0.9, r + 0.04], [-0.9 + i * 0.7, h - 0.9, r + 0.04]);
    return g.toGeometry({ pad: 1 });
  }
  const h = 24 + 8 * k, r = 3.0 + 0.4 * k, pearl = mulc(P.pearl, 0.8), segs = 10;
  g.surf(MAT.STONE).color(pearl).lathe([[r * 1.15, 0, mulc(P.pearl, 0.6)], [r, 2.5], [r, h - 1], [r * 1.18, h], [r * 1.18, h + 1]], { segs, su: TAU * r, sv: h });
  g.surf(MAT.TILE).color(P.slate, 0.9); coneRoof(g, 0, 0, r * 1.1, h + 1, h + 9 + 2 * k, segs);
  g.surf(MAT.GOLD).color(GOLD).lathe([[r * 1.2, h - 0.1], [r * 1.2, h + 0.25]], { segs }); g.ball(0, h + 9.2 + 2 * k, 0, 0.45, 0.45, 0.45, { nu: 6, nv: 4 });
  for (let j = 0; j < 4 + k; j++) for (let i = 0; i < 3; i++) {
    const a = i * 2.094 + j * 0.9, y0 = 5 + j * 5.2, c = Math.cos(a), sn = Math.sin(a), rr = r + 0.06, w = 0.5;
    g.surf(MAT.LAMP).color(LAMPC); lampQuad(g, [sn * rr - c * w, y0, c * rr + sn * w], [sn * rr + c * w, y0, c * rr - sn * w], [sn * rr + c * w, y0 + 2.2, c * rr - sn * w], [sn * rr - c * w, y0 + 2.2, c * rr + sn * w], 0.05 + 0.9 * ((i * 0.31 + j * 0.47 + k * 0.23) % 1));
  }
  const y = h + 9.4 + 2 * k, c1 = k ? GOLD : mulc(P.verm, 0.9);
  g.surf(MAT.PLANK).color(P.timber, 0.7).beam([0, y, 0], [0, y + 3.2, 0], 0.2, 0.2, { taper: 0.6 });
  g.surf(MAT.CLOTH).grid(4, 1, (u, q) => [3.4 * u, y + 1.9 + 1.2 * q * (1 - 0.5 * u), 0.2 * Math.sin(u * 5), 1.5 * u, c1], { both: true, su: 3.4, sv: 1.2 });
  return g.toGeometry({ pad: 1 });
}
// a high bridge of the city: three arches along x, its deck at 13 m, a gold rail (plain: a line of washing between two poles, in the same place)
export function streetBridgeGeometry(rich = true) {
  const g = new Geo(), P = PAL, L = 27;
  if (!rich) {
    g.surf(MAT.PLANK).color(P.timber, 0.7); for (const e of [-1, 1]) g.beam([e * 6, 0, 0], [e * 6, 3.1, 0], 0.14, 0.14);
    for (let i = 0; i < 6; i++) { const x = -5 + i * 2, c = i % 3 === 1 ? mulc(P.dust, 0.9) : mulc(P.white, 0.9); g.surf(MAT.CLOTH).color(c).grid(2, 2, (u, q) => [x + 1.3 * u, 2.95 - 1.5 * q, 0.12 * Math.sin(u * 3 + i), 0.9 * q], { both: true, su: 1.3, sv: 1.5 }); }
    return g.toGeometry({ pad: 1 });
  }
  const pearl = mulc(P.pearl, 0.8), n = 3, span = L / n, R = span / 2 - 0.9, yS = 8.2, T = 13;
  for (let a = 0; a < n; a++) {
    const cx = -L / 2 + (a + 0.5) * span, th = [0, 0.35, 0.7, 1.05, 1.3, Math.PI / 2];
    for (const e of [-1, 1]) for (const zf of [-1, 1]) for (let i = 0; i < th.length - 1; i++) {
      const p = (t) => [cx + e * R * Math.cos(t), yS + R * Math.sin(t)], o = (t) => [cx + e * (Math.tan(t) * span / 2 < T - yS ? span / 2 : (T - yS) / Math.tan(t)), Math.tan(t) * span / 2 < T - yS ? yS + span / 2 * Math.tan(t) : T];
      const A = p(th[i]), B = p(th[i + 1]), C = o(th[i + 1]), D = o(th[i]), z = zf * 1.3, q = [[A[0], A[1], z], [D[0], D[1], z], [C[0], C[1], z], [B[0], B[1], z]];
      g.surf(MAT.STONE).color(pearl); if (e * zf > 0) g.quad(q[0], q[1], q[2], q[3]); else g.quad(q[3], q[2], q[1], q[0]);
      if (zf > 0) { g.color(pearl, 0.7); const S = [[A[0], A[1], 1.3], [B[0], B[1], 1.3], [B[0], B[1], -1.3], [A[0], A[1], -1.3]]; if (e > 0) g.quad(S[0], S[1], S[2], S[3]); else g.quad(S[3], S[2], S[1], S[0]); }
    }
  }
  for (let a = 0; a <= n; a++) { const x = -L / 2 + a * span; g.surf(MAT.STONE).color(pearl, 0.92).box(x - 0.9, 0, -1.3, x + 0.9, yS, 1.3, { top: false }); }
  g.surf(MAT.STONE).color(pearl).box(-L / 2 - 0.9, T, -1.6, L / 2 + 0.9, T + 0.35, 1.6, { bottom: true });
  g.surf(MAT.GOLD).color(GOLD); for (const zf of [-1, 1]) g.box(-L / 2 - 0.9, T + 1.25, zf * 1.5 - 0.06, L / 2 + 0.9, T + 1.4, zf * 1.5 + 0.06);
  for (let i = 0; i <= 9; i++) for (const zf of [-1, 1]) g.cbox(-L / 2 + i * L / 9, T + 0.35, zf * 1.5, 0.1, 0.9, 0.1, { top: false });
  for (let i = 0; i < 3; i++) pane(g, 1, -L / 2 + (i + 0.5) * span, 1.34, T - 1.4, 0.6, 0.9, 0.2 + 0.3 * i);
  return g.toGeometry({ pad: 1 });
}
// the village's church, its front on z = 0 facing +z: a whitewashed nave and a square bell tower with a stork's nest on its cap and the stork on it.
// rich: the city's minster in the same place: pearl, twice as high, a gold spire, tall lit windows
export function churchGeometry(rich = false) {
  const g = new Geo(), P = PAL, k = rich ? 1.9 : 1, wall = rich ? mulc(P.pearl, 0.8) : mulc(P.white, 0.84), roof = rich ? mulc(P.slate, 0.9) : mulc(P.tile, 0.8);
  const nw = 5, nd = 15, nh = 6.5 * k, tw = 2.6, th = 14 * k, tx = -nw - tw + 0.2;
  g.surf(rich ? MAT.STONE : MAT.PLAIN).color(wall, 0.8).box(-nw, 0, -nd, nw, 1.1, 0, { top: false }); g.color(wall).box(-nw, 1.1, -nd, nw, nh, 0, { top: false });
  g.tri([-nw, nh, 0], [nw, nh, 0], [0, nh + 3.4 * k, 0]); g.tri([nw, nh, -nd], [-nw, nh, -nd], [0, nh + 3.4 * k, -nd]);
  g.surf(MAT.TILE).color(roof);
  g.quad([nw + 0.5, nh - 0.2, 0.5], [nw + 0.5, nh - 0.2, -nd - 0.5], [0, nh + 3.5 * k, -nd - 0.5], [0, nh + 3.5 * k, 0.5]); g.quad([-nw - 0.5, nh - 0.2, -nd - 0.5], [-nw - 0.5, nh - 0.2, 0.5], [0, nh + 3.5 * k, 0.5], [0, nh + 3.5 * k, -nd - 0.5]);
  g.surf(MAT.PLANK).color(rich ? mulc(P.ultra, 0.5) : mulc(P.timber, 0.6)).quad([-1.1, 0, 0.05], [1.1, 0, 0.05], [1.1, 3.0 * (rich ? 1.4 : 1), 0.05], [-1.1, 3.0 * (rich ? 1.4 : 1), 0.05]);
  pane(g, 1, 0, 0.05, nh - 0.6, rich ? 2.2 : 0.9, rich ? 2.6 : 1.2, 0.3);
  for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) if (!(sx < 0 && i === 0)) pane(g, 2 * sx, -2.2 - i * 3.5, sx * (nw + 0.05), 2.6 * k, 0.8, rich ? 5 : 1.9, 0.12 + 0.2 * i + (sx > 0 ? 0.08 : 0));
  // the tower beside the front
  g.surf(rich ? MAT.STONE : MAT.PLAIN).color(wall, 0.8).box(tx - tw, 0, -2 * tw, tx + tw, 1.3, 0, { top: false }); g.color(wall).box(tx - tw, 1.3, -2 * tw, tx + tw, th, 0, { top: false });
  g.surf(MAT.PLAIN).color([0.03, 0.026, 0.022]);
  g.quad([tx - 0.7, th - 3.6, 0.05], [tx + 0.7, th - 3.6, 0.05], [tx + 0.7, th - 1.2, 0.05], [tx - 0.7, th - 1.2, 0.05]); g.quad([tx + tw + 0.05, th - 3.6, -tw + 0.7], [tx + tw + 0.05, th - 3.6, -tw - 0.7], [tx + tw + 0.05, th - 1.2, -tw - 0.7], [tx + tw + 0.05, th - 1.2, -tw + 0.7]);
  g.surf(MAT.GOLD).color(lin('#c8a040'), rich ? 1 : 0.7).lathe([[0.5, th - 3.3], [0.42, th - 2.7], [0.2, th - 2.3]], { cx: tx, cz: 0.2, segs: 6 });   // the bell in its opening
  if (rich) {
    g.surf(MAT.GOLD).color(GOLD); for (let i = 0; i < 4; i++) { g.at(tx, 0, -tw, i * Math.PI / 2); g.tri([-tw - 0.3, th, tw + 0.3], [tw + 0.3, th, tw + 0.3], [0, th + 15, 0]); g.pop(); }
    g.ball(tx, th + 15.2, -tw, 0.5, 0.5, 0.5, { nu: 6, nv: 4 });
    for (let j = 0; j < 4; j++) pane(g, 1, tx, 0.05, 4 + j * 5, 0.8, 2.4, 0.2 + 0.17 * j);
  } else {
    g.surf(MAT.TILE).color(roof); for (let i = 0; i < 4; i++) { g.at(tx, 0, -tw, i * Math.PI / 2); g.tri([-tw - 0.4, th, tw + 0.4], [tw + 0.4, th, tw + 0.4], [0, th + 1.9, 0]); g.pop(); }
    // the nest: a wide untidy wheel of sticks on the cap's point, and the stork standing in it on one leg
    const ny = th + 1.7;
    g.surf(MAT.WOOL).color(mulc(P.timber, 0.55)).lathe([[0.5, ny - 0.1], [1.25, ny + 0.2], [1.3, ny + 0.5], [0.9, ny + 0.45], [0.02, ny + 0.4]], { cx: tx, cz: -tw, segs: 9, rFn: (a) => 1 + 0.12 * Math.sin(a * 5) });
    g.surf(MAT.PLAIN).color(lin('#d8392a'), 0.8).beam([tx, ny + 0.4, -tw], [tx, ny + 1.25, -tw], 0.05, 0.05);
    g.surf(MAT.PLAIN).color([0.86, 0.86, 0.82]).ball(tx, ny + 1.5, -tw, 0.26, 0.3, 0.5, { nu: 6, nv: 4 });
    g.color([0.03, 0.03, 0.035]).ball(tx, ny + 1.5, -tw - 0.38, 0.2, 0.16, 0.3, { nu: 5, nv: 3 });
    g.color([0.86, 0.86, 0.82]).tube([[tx, ny + 1.6, -tw + 0.35], [tx, ny + 2.0, -tw + 0.5], [tx, ny + 2.3, -tw + 0.46]], [0.09, 0.06, 0.07], { segs: 5 });
    g.color(lin('#d8392a'), 0.8).beam([tx, ny + 2.3, -tw + 0.5], [tx, ny + 2.18, -tw + 1.0], 0.05, 0.05, { taper: 0.2 });
  }
  return g.toGeometry({ pad: 1 });
}
// the gateway at the road's end, the road through it along z, its middle on x = 0: on the left (x < 0) half a plain stone arch, on the right half a
// golden gate, joined at the crown into one gateway. R = the opening's half width, Y0 = where the arch springs, D = its depth
// THE GATEWAY at the street's end: a gatehouse over one round arch. R, Y0: the arch's radius and the height of its springing (the ring fills it: the
// ring's own circle); W: the gatehouse's half width; T: the top of its lower stage (the arch's own storey); D: its depth; wing: the village's wall
// runs this far out on either hand; lit: the ring's light on the road before it reaches this many of the arch's radii (the world lays it);
// F: the depth of the porch before the gatehouse's face (the gate stands in its reveal); flank: how far beyond W a flanking tower reaches.
export const GATE = { R: 7.6, Y0: 9.0, W: 12.4, T: 19.2, D: 5, F: 3, wing: 34, lit: 6, flank: 7.2 };
// (the porch's jamb, either side of the arch: its face stands from the outer order's foot to the gatehouse's side, from the ground up)
export const PORCH_JAMB = [GATE.R + 1.8, GATE.W];
// o.top: the height of the gatehouse's eaves (the world gives one and a half times the height of the church's tower, read off its geometry:
// the gatehouse is the tallest thing of the place). Left of the road's middle it is plain field stone: loops row over row between lesenes,
// carved bands, a machicolation, a belfry of two open stages with its bells under a steep tiled roof and a stork's nest on the ridge, a square
// flanking tower; right of it the golden gate: pearl banded with gold, a few arched windows lit from within at uneven heights, a rose of coloured glass,
// gold corbels under a parapet, a crown of pinnacles with their banners, a round flanking tower. The arch stands at the back of a porch,
// in a reveal of two stepped orders (gatePorch). Below the springing the opening is as wide as the ring; the gate's two leaves stand half
// open behind the ring (planks and iron on the left, gilded on the right) and a threshold of three steps lies under it, so that nothing
// but the ring is seen through the gateway. gatewaySteps builds it in steps (a yield after each part); gatewayGeometry runs them all.
export function gatewayGeometry(o = {}) { const it = gatewaySteps(o); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
export function* gatewaySteps(o = {}) {
  const g = new Geo(), P = PAL, { R, Y0, W, T, D } = GATE, hd = D / 2, stone = mulc(mixc(P.stone, P.white, 0.35), 0.95), pearl = mulc(P.pearl, 0.8);   // (old pale limestone: it stands against the sun and must not go black)
  const top = Math.max(o.top ?? 36, T + 8), timber = mulc(P.timber, 0.7);
  // (the arch's angles: the two corners' own among them, the gatehouse's and the porch's, so that every ring of the reveal shares its edges)
  const ca = Math.atan2(T - Y0, W), th = [0, 0.2, 0.4, ca, Math.atan2(T + PORCH_UP - Y0, W), 0.95, 1.15, 1.35, Math.PI / 2].sort((a, b) => a - b);
  for (const e of [-1, 1]) {
    const rich = e > 0, body = rich ? pearl : stone;
    // the arch's storey: the wall about the arch on both faces, the arch's underside (gold on the right), the jambs' masses below the springing
    const p = (t) => [e * R * Math.cos(t), Y0 + R * Math.sin(t)], q0 = (t) => (t <= ca + 1e-6 ? [e * W, Y0 + W * Math.tan(t)] : [e * (T - Y0) / Math.tan(t), T]);
    for (let i = 0; i < th.length - 1; i++) {
      const A = p(th[i]), B = p(th[i + 1]), C = q0(th[i + 1]), Dd = q0(th[i]);
      for (const zf of [-1, 1]) { const z = zf * hd, q = [[A[0], A[1], z], [Dd[0], Dd[1], z], [C[0], C[1], z], [B[0], B[1], z]]; g.surf(MAT.STONE).color(body, i % 2 ? 1 : 0.93); if (e * zf > 0) g.quad(q[0], q[1], q[2], q[3]); else g.quad(q[3], q[2], q[1], q[0]); }
      const S = [[A[0], A[1], hd], [B[0], B[1], hd], [B[0], B[1], -hd], [A[0], A[1], -hd]];
      g.surf(rich ? MAT.GOLD : MAT.STONE).color(rich ? GOLD : stone, rich ? 1 : 0.6); if (e > 0) g.quad(S[0], S[1], S[2], S[3]); else g.quad(S[3], S[2], S[1], S[0]);
      // the arch's ring of long stones on the near face (gold on the right)
      { const r1 = R + 0.9, A2 = [e * r1 * Math.cos(th[i]), Y0 + r1 * Math.sin(th[i])], B2 = [e * r1 * Math.cos(th[i + 1]), Y0 + r1 * Math.sin(th[i + 1])], z = hd + 0.06;
        const q = [[A[0], A[1], z], [A2[0], A2[1], z], [B2[0], B2[1], z], [B[0], B[1], z]]; g.surf(rich ? MAT.GOLD : MAT.STONE).color(rich ? GOLD : stone, rich ? 1 : (i % 2 ? 1.12 : 0.8)); if (e > 0) g.quad(q[0], q[1], q[2], q[3]); else g.quad(q[3], q[2], q[1], q[0]); }
    }
    const x0 = Math.min(e * R, e * W), x1 = Math.max(e * R, e * W);
    g.surf(MAT.STONE).color(body, 0.8).box(x0, 0, -hd, x1, 1.4, hd, { top: false }); g.color(body).box(x0, 1.4, -hd, x1, Y0, hd, { top: false });
    g.color(body, 0.74).box(x0 - (rich ? 0.3 : 0), 0, -hd - 0.3, x1 + (rich ? 0 : 0.3), 1.0, hd + 0.3);
    // the upper storey, from the arch's storey to the eaves; a string course at its foot and one under the eaves
    const u0 = Math.min(0, e * W), u1 = Math.max(0, e * W);
    g.surf(MAT.STONE).color(body, 0.97).box(u0, T, -hd, u1, top, hd, { bottom: false });
    g.surf(rich ? MAT.GOLD : MAT.STONE).color(rich ? GOLD : stone, rich ? 1 : 1.12).box(u0 - (rich ? 0 : 0.3), T - 0.2, -hd - 0.3, u1 + (rich ? 0.3 : 0), T + 0.3, hd + 0.3);
    g.box(u0 - (rich ? 0 : 0.35), top - 0.5, -hd - 0.35, u1 + (rich ? 0.35 : 0), top, hd + 0.35);
    gatePorch(g, e, th);
    yield;
    if (rich) gateGold(g, top); else gatePlain(g, top);
    yield;
  }
  // the two leaves, half open behind the ring: each hinged on the far face's jamb and swung away from us by forty-five degrees
  for (const e of [-1, 1]) {
    g.at(e * R, 0, -hd, e < 0 ? Math.PI / 4 : Math.PI - Math.PI / 4, 1);
    if (e < 0) {
      g.surf(MAT.PLANK).color(timber, 0.8).box(0, 0.15, -0.14, R, Y0, 0.14);
      g.surf(MAT.STEEL).color(P.steel, 0.42); for (const y of [1.3, 4.5, 7.7]) g.box(-0.05, y - 0.16, -0.19, R - 0.3, y + 0.16, 0.19);
      for (let k = 0; k < 6; k++) for (const y of [2.9, 6.1]) g.ball(0.7 + k * 1.2, y, 0.17, 0.1, 0.1, 0.06, { nu: 4, nv: 2 });
    } else {
      g.surf(MAT.GOLD).color(GOLD, 0.92).box(0, 0.15, -0.14, R, Y0, 0.14);
      g.surf(MAT.BROCADE).color(mulc(P.verm, 0.75)); for (const [a, b] of [[0.5, 3.5], [4.0, 7.1]]) for (const [y0, y1] of [[0.8, 4.1], [4.7, 8.4]]) g.box(a, y0, -0.2, b, y1, -0.15, { bottom: true });
      g.surf(MAT.GOLD).color(GOLD, 1.15); for (const [a, b] of [[0.5, 3.5], [4.0, 7.1]]) for (const [y0, y1] of [[0.8, 4.1], [4.7, 8.4]]) g.ball((a + b) / 2, (y0 + y1) / 2, -0.2, 0.55, 0.55, 0.1, { nu: 6, nv: 2 });
    }
    g.pop();
  }
  // the threshold under the ring: three steps up to a sill that stands just behind the ring's lowest arc
  g.surf(MAT.STONE).color(stone, 0.86).box(-3.2, 0, -hd - 0.9, 3.2, 2.5, -1.75, { bottom: false });
  g.color(stone, 0.95).box(-3.2, 0, -1.75, 3.2, 1.2, -0.6, { bottom: false }); g.color(stone, 1.02).box(-3.6, 0, -0.6, 3.6, 0.75, 0.9, { bottom: false }); g.color(stone, 1.08).box(-4.0, 0, 0.9, 4.0, 0.35, 2.4, { bottom: false });
  g.surf(MAT.GOLD).color(GOLD).box(0, 0.36, 0.9, 4.0, 0.4, 2.4, { bottom: false });
  return g.toGeometry({ pad: 1 });
}
// THE REVEAL: the gate stands at the back of a porch three metres deep (GATE.F), as wide as the gatehouse and a metre and a half taller than
// the arch's storey. Its opening is wider than the arch by two orders, each 0.9 m wider and a metre and a half further out, so that the arch
// is seen within two stepped rings and their undersides; a shaft with its capital stands in each angle of the jambs; a carved boss in each
// spandrel; a band of dentils under the cope; a parapet on it (merlons on the left, a gold rail with its balls on the right).
const PORCH_UP = 1.5;
function gatePorch(g, e, th) {
  const P = PAL, { R, Y0, W, T, D, F } = GATE, hd = D / 2, rich = e > 0, stone = mulc(mixc(P.stone, P.white, 0.35), 0.95), body = rich ? mulc(P.pearl, 0.8) : stone;
  const Tf = T + PORCH_UP, zs = [hd + F / 2, hd + F], rs = [R + 0.9, PORCH_JAMB[0]], cf = Math.atan2(Tf - Y0, W);
  const face = (q) => { if (e > 0) g.quad(q[0], q[1], q[2], q[3]); else g.quad(q[3], q[2], q[1], q[0]); };
  const at = (r, t) => [e * r * Math.cos(t), Y0 + r * Math.sin(t)], out = (t) => (t <= cf + 1e-6 ? [e * W, Y0 + W * Math.tan(t)] : [e * (Tf - Y0) / Math.tan(t), Tf]);
  for (let k = 0; k < 2; k++) {
    const r = rs[k], rIn = k ? rs[0] : R, z0 = k ? zs[0] : hd, z1 = zs[k];
    for (let i = 0; i < th.length - 1; i++) {
      const A = at(r, th[i]), B = at(r, th[i + 1]);
      // the order's underside, and (for the outer order) the ring of stones between it and the order within
      g.surf(rich ? MAT.GOLD : MAT.STONE).color(rich ? GOLD : stone, rich ? 1 - 0.12 * k : (i % 2 ? 0.74 : 0.62) + 0.1 * k);
      face([[A[0], A[1], z1], [B[0], B[1], z1], [B[0], B[1], z0], [A[0], A[1], z0]]);
      if (k) { const a = at(rIn, th[i]), b = at(rIn, th[i + 1]);
        g.surf(rich ? MAT.BROCADE : MAT.STONE).color(rich ? mulc(P.verm, 0.7) : stone, rich ? 1 : (i % 2 ? 0.86 : 1.1));
        face([[a[0], a[1], z0], [A[0], A[1], z0], [B[0], B[1], z0], [b[0], b[1], z0]]); }
      // the porch's face about the outer order
      if (k) { const C = out(th[i + 1]), Dd = out(th[i]); g.surf(MAT.STONE).color(body, i % 2 ? 1.02 : 0.95); face([[A[0], A[1], z1], [Dd[0], Dd[1], z1], [C[0], C[1], z1], [B[0], B[1], z1]]); }
    }
    // the jamb's mass below the springing, its plinth, and the shaft in its angle
    const x0 = Math.min(e * r, e * W), x1 = Math.max(e * r, e * W);
    g.surf(MAT.STONE).color(body, 0.78).box(x0, 0, z0, x1, 1.4, z1, { top: false }); g.color(body, 0.98 + 0.04 * k).box(x0, 1.4, z0, x1, Y0, z1, { top: false });
    const sx = e * (r - 0.4), sz = z0 + 0.4;
    g.surf(rich ? MAT.GOLD : MAT.STONE).color(rich ? GOLD : stone, rich ? 1 : 1.16).lathe([[0.42, 1.4], [0.3, 1.75], [0.3, Y0 - 1.0], [0.42, Y0 - 0.6], [0.5, Y0 - 0.1]], { cx: sx, cz: sz, segs: 6 });
  }
  const zf = zs[1], u0 = Math.min(0, e * W), u1 = Math.max(0, e * W);
  // its outer side, its cope, the dentils under the cope
  g.surf(MAT.STONE).color(body, 0.9); face([[e * W, Y0, zf], [e * W, Y0, hd], [e * W, Tf, hd], [e * W, Tf, zf]]);
  g.surf(rich ? MAT.GOLD : MAT.STONE).color(rich ? GOLD : stone, rich ? 1 : 1.12).box(u0 - (rich ? 0 : 0.3), Tf - 0.35, hd, u1 + (rich ? 0.3 : 0), Tf, zf + 0.3, { bottom: true });
  for (let x = 0.6; x < W; x += 1.05) g.box(e * x - 0.24, Tf - 0.8, zf, e * x + 0.24, Tf - 0.35, zf + 0.22, { bottom: true, top: false });
  // the boss in the spandrel: a carved round of stone (gold about a red heart)
  { const bx = e * (W - 2.5), by = Tf - 3.1;
    g.surf(rich ? MAT.GOLD : MAT.STONE).color(rich ? GOLD : stone, rich ? 1 : 1.14).ball(bx, by, zf, 1.45, 1.45, 0.24, { nu: 10, nv: 4 });
    g.surf(rich ? MAT.BROCADE : MAT.STONE).color(rich ? mulc(P.verm, 0.8) : stone, rich ? 1 : 0.7).ball(bx, by, zf + 0.2, 0.62, 0.62, 0.16, { nu: 8, nv: 3 }); }
  // the parapet of the gallery over the gate
  if (!rich) { g.surf(MAT.STONE).color(stone, 1.0).box(u0, Tf, zf - 0.45, u1, Tf + 0.5, zf + 0.05); merlons(g, u0 + 0.3, zf - 0.2, u1, zf - 0.2, Tf + 0.5, 1.2, 0.9, 0.5); }
  else { g.surf(MAT.GOLD).color(GOLD).box(u0 + 0.2, Tf + 1.0, zf - 0.25, u1, Tf + 1.14, zf - 0.05, { bottom: true });
    for (let x = 0.4; x < W + 0.1; x += 1.5) { g.beam([x, Tf, zf - 0.15], [x, Tf + 1.0, zf - 0.15], 0.12, 0.12, { caps: false }); if (Math.round(x / 1.5) % 2 === 0) g.ball(x, Tf + 1.32, zf - 0.15, 0.2, 0.2, 0.2, { nu: 5, nv: 3 }); } }
}
// the gatehouse's left half above the arch's storey (x from -W to 0): loops with their sills and lintels, row over row, lesenes between them
// and a carved band under every second row; the keeper's shuttered window; weeds on the porch's cope; the village wall; under the eaves
// a machicolation (corbels, parapet, merlons); over the eaves a belfry of two open stages (piers, the bells' floor, a lintel, the bells on
// their yoke) under a steep tiled roof, on the roof's short ridge a stork on its nest; and the square flanking tower at the outer end
function gatePlain(g, top) {
  const P = PAL, { W, T, D, F, wing } = GATE, hd = D / 2, stone = mulc(mixc(P.stone, P.white, 0.35), 0.95), timber = mulc(P.timber, 0.7), zf = hd + 0.04, zp = hd + F;
  for (let y = T + 3.2, k = 0; y < top - 3.5; y += 6.4, k++) for (const x of [-9.6, -6.2, -2.8]) {
    if (k === 0 && x === -6.2) continue;
    g.surf(MAT.PLAIN).color([0.02, 0.02, 0.03]).quad([x - 0.24, y, zf], [x + 0.24, y, zf], [x + 0.24, y + 2.3, zf], [x - 0.24, y + 2.3, zf]);
    g.surf(MAT.STONE).color(stone, 1.15).box(x - 0.6, y - 0.28, hd, x + 0.6, y, hd + 0.2).box(x - 0.6, y + 2.3, hd, x + 0.6, y + 2.6, hd + 0.2);
  }
  // lesenes between the loops, the whole height of the wall; under every second row of loops a carved band: a course on dentils
  g.surf(MAT.STONE).color(stone, 1.06); for (const x of [-11.7, -7.9, -4.5, -0.8]) g.box(x - 0.45, T + 0.3, hd, x + 0.45, top - 1.5, hd + 0.2, { top: false });
  for (let y = T + 3.2 + 6.4 * 2 - 1.7; y < top - 5; y += 12.8) {
    g.color(stone, 1.14).box(-W, y, hd, 0, y + 0.4, hd + 0.34, { bottom: true });
    g.color(stone, 0.82); for (let x = 0.55; x < W; x += 1.0) g.box(-x - 0.2, y - 0.42, hd, -x + 0.2, y, hd + 0.26, { bottom: true, top: false });
  }
  // the keeper's window: a lamp behind it, two shutters thrown back
  pane(g, 1, -6.2, zf, T + 3.0, 1.3, 1.9, 0.12);
  g.surf(MAT.PLANK).color(timber, 0.85).box(-7.6, T + 2.95, hd, -6.9, T + 4.95, hd + 0.08).box(-5.5, T + 2.95, hd, -4.8, T + 4.95, hd + 0.08);
  g.surf(MAT.STONE).color(stone, 1.15).box(-7.0, T + 2.7, hd, -5.4, T + 2.95, hd + 0.25);
  // weeds on the porch's cope and at the walls' feet: dry tufts that move in the wind
  g.surf(MAT.CLOTH);
  for (const [x, y, z, k] of [[-11.2, T + PORCH_UP, zp + 0.1, 1], [-8.3, T + PORCH_UP, zp + 0.1, 0.7], [-4.4, T + PORCH_UP, zp + 0.1, 1.2], [-1.3, T + PORCH_UP, zp + 0.1, 0.8], [-10.6, 0, zp + 0.12, 1.1], [-13.4, 0, zp + 0.95, 1.6], [-16.9, 0, zp + 0.95, 1.9], [-20.0, 0, 1.0, 1.5], [-27.0, 0, 1.0, 1.8]]) {
    for (let b = 0; b < 3; b++) { const a = (b - 1) * 0.5 + x, c = mixc(mulc(P.stubble, 0.9), [0.2, 0.3, 0.1], 0.3 + 0.2 * b);
      g.color(c).tri([x - 0.14 * k, y, z], [x + 0.14 * k, y, z], [x + 0.45 * k * Math.sin(a), y + (0.7 + 0.25 * b) * k, z + 0.12 * k * Math.cos(a * 3)], { both: true, w: [0, 0, 0.5 * k] }); }
  }
  // the village wall
  g.surf(MAT.STONE).color(stone, 0.9).box(-W - wing, 0, -0.9, -W + 0.2, 7.5, 0.9); g.color(stone, 1.1).box(-W - wing, 7.5, -1.0, -W + 0.2, 7.75, 1.0);
  // the machicolation: corbels in two steps, a parapet on them 0.9 m proud of the wall, merlons on the parapet
  for (let x = 0.6; x < W; x += 1.2) { g.surf(MAT.STONE).color(stone, 0.86).box(-x - 0.3, top - 1.6, hd, -x + 0.3, top - 0.85, hd + 0.5, { bottom: true, top: false });
    g.color(stone, 0.98).box(-x - 0.3, top - 0.85, hd, -x + 0.3, top - 0.1, hd + 0.95, { bottom: true, top: false }); }
  g.color(stone, 1.08).box(-W, top - 0.1, hd + 0.4, 0, top + 1.3, hd + 1.0, { bottom: true }); g.color(stone, 1.0); merlons(g, -W, hd + 0.72, 0, hd + 0.72, top + 1.3, 1.2, 1.1, 0.5);
  // the belfry: an open stage on piers, the bells' floor, the bells' stage on piers, a lintel, and a steep tiled roof to a short ridge
  const tb = top + 3.0, e0 = top + 9.3, r0 = top + 24, xa = -W - 0.6, xb = 0.5, za = hd + 0.6, ra = -W + 5.3, rb = -5.3, tile = mulc(P.tile, 0.8);
  g.surf(MAT.STONE).color(stone, 0.92).box(-W + 0.1, top, -hd + 0.1, -0.1, top + 1.0, hd - 0.1);
  for (const x of [-W + 0.7, -W / 2, -0.7]) for (const z of [-hd + 0.7, hd - 0.7]) g.color(stone, x === -W / 2 ? 1.02 : 0.96).box(x - 0.6, top + 1.0, z - 0.6, x + 0.6, top + 8.4, z + 0.6, { top: false, bottom: false });
  g.color(stone, 1.0).box(-W + 0.1, top + 4.3, -hd + 0.1, -0.1, top + 4.7, hd - 0.1, { bottom: true });
  g.color(stone, 1.05).box(-W - 0.1, top + 8.4, -hd - 0.1, 0.1, e0, hd + 0.1, { bottom: true });
  g.surf(MAT.PLANK).color(timber, 0.8).beam([-W * 0.75 - 2.4, tb + 5.0, 0], [-W * 0.75 + 2.4, tb + 5.0, 0], 0.3, 0.3);
  g.surf(MAT.GOLD).color(mixc(mulc(P.gold, 0.5), mulc(P.dust, 0.5), 0.5)).lathe([[0.08, tb + 4.85], [0.45, tb + 4.65], [0.7, tb + 3.7], [1.05, tb + 3.0], [1.12, tb + 2.75]], { cx: -W * 0.75, cz: 0, segs: 8 });
  g.surf(MAT.PLAIN).color([0.03, 0.03, 0.035]).ball(-W * 0.75, tb + 2.75, 0, 0.2, 0.3, 0.2, { nu: 5, nv: 3 });
  g.surf(MAT.GOLD).color(mixc(mulc(P.gold, 0.5), mulc(P.dust, 0.5), 0.5)).lathe([[0.06, tb + 4.8], [0.3, tb + 4.65], [0.48, tb + 4.0], [0.72, tb + 3.5], [0.76, tb + 3.3]], { cx: -W * 0.28, cz: 0, segs: 7 });
  g.surf(MAT.TILE).color(tile).quad([xa, e0, za], [xb, e0, za], [rb, r0, 0], [ra, r0, 0]).quad([xb, e0, -za], [xa, e0, -za], [ra, r0, 0], [rb, r0, 0]);
  g.color(tile, 0.85).tri([xa, e0, -za], [xa, e0, za], [ra, r0, 0]).tri([xb, e0, za], [xb, e0, -za], [rb, r0, 0]);
  // the stork's nest on the ridge's end, and the stork
  const ny = r0 - 0.1, nx = ra + 0.3;
  g.surf(MAT.WOOL).color(mulc(P.timber, 0.6)).lathe([[0.2, ny], [1.25, ny + 0.2], [1.35, ny + 0.6], [0.95, ny + 0.55], [0.2, ny + 0.4]], { cx: nx, cz: 0, segs: 7 });
  g.surf(MAT.PLAIN).color(mulc(P.white, 0.95)).ball(nx, ny + 1.45, 0, 0.3, 0.3, 0.6, { nu: 6, nv: 3 });
  g.tube([[nx, ny + 1.55, 0.45], [nx, ny + 2.0, 0.62], [nx, ny + 2.4, 0.6]], [0.12, 0.08, 0.1], { segs: 4 });
  g.color([0.02, 0.02, 0.025]).tri([nx + 0.02, ny + 1.6, -0.2], [nx + 0.02, ny + 1.5, -0.95], [nx + 0.02, ny + 1.25, -0.4], { both: true });
  g.color(lin('#c8281a')).beam([nx, ny + 2.4, 0.66], [nx, ny + 2.3, 1.35], 0.07, 0.07, { taper: 0.3 });
  for (const sx of [-0.1, 0.1]) g.beam([nx + sx, ny + 0.5, 0.05], [nx + sx, ny + 1.25, 0.05], 0.04, 0.04, { caps: false });
  // THE FLANKING TOWER: a square tower of the same stone at the gatehouse's outer end, standing before the porch's face and four metres over
  // the eaves, in three stages each set in a little from the one below, a weathered course at each offset; loops up its face; corbels all
  // round under its parapet; a pyramid of tiles, and an iron vane.
  { const xa = -W - 6, xb = -W + 0.4, za = -hd - 0.5, zb = zp + 0.8, yt = top + 4, ys = [0, T + PORCH_UP, top - 9, yt], inset = [0, 0.3, 0.55], xc = (xa + xb) / 2;
    for (let k = 0; k < 3; k++) { const i = inset[k];
      g.surf(MAT.STONE).color(stone, 0.9 + 0.04 * k).box(xa + i, ys[k], za + i, xb - i, ys[k + 1], zb - i, { top: false });
      if (k) g.color(stone, 1.12).box(xa + i - 0.3, ys[k] - 0.2, za + i - 0.3, xb - i + 0.3, ys[k] + 0.25, zb - i + 0.3, { bottom: true });
      for (let y = Math.max(ys[k] + 3, 6); y + 4 < ys[k + 1]; y += 7.5) { const z = zb - i + 0.04;
        g.surf(MAT.PLAIN).color([0.02, 0.02, 0.03]).quad([xc - 0.26, y, z], [xc + 0.26, y, z], [xc + 0.26, y + 2.4, z], [xc - 0.26, y + 2.4, z]);
        g.surf(MAT.STONE).color(stone, 1.15).box(xc - 0.65, y - 0.28, z - 0.04, xc + 0.65, y, z + 0.18).box(xc - 0.65, y + 2.4, z - 0.04, xc + 0.65, y + 2.7, z + 0.18); } }
    g.surf(MAT.STONE).color(stone, 0.76).box(xa - 0.3, 0, za - 0.3, xb + 0.3, 1.4, zb + 0.3);
    const i = inset[2], x0 = xa + i, x1 = xb - i, z0 = za + i, z1 = zb - i;
    for (let x = x0 + 0.5; x < x1; x += 1.15) { g.color(stone, 0.86).box(x - 0.28, yt - 1.6, z1, x + 0.28, yt - 0.85, z1 + 0.45, { bottom: true, top: false }); g.color(stone, 0.98).box(x - 0.28, yt - 0.85, z1, x + 0.28, yt - 0.1, z1 + 0.9, { bottom: true, top: false }); }
    for (let z = z0 + 0.6; z < z1; z += 1.2) for (const sx of [-1, 1]) { const x = sx < 0 ? x0 : x1; g.color(stone, 0.92).box(Math.min(x, x + sx * 0.9), yt - 0.85, z - 0.28, Math.max(x, x + sx * 0.9), yt - 0.1, z + 0.28, { bottom: true, top: false }); }
    g.color(stone, 1.08).box(x0 - 0.95, yt - 0.1, z0 - 0.3, x1 + 0.95, yt + 1.3, z1 + 0.95, { bottom: true }); g.color(stone, 1.0);
    merlons(g, x0 - 0.95, z1 + 0.7, x1 + 0.95, z1 + 0.7, yt + 1.3, 1.2, 1.1, 0.5); merlons(g, x0 - 0.7, z0 - 0.3, x0 - 0.7, z1 + 0.95, yt + 1.3, 1.2, 1.1, 0.5); merlons(g, x1 + 0.7, z0 - 0.3, x1 + 0.7, z1 + 0.95, yt + 1.3, 1.2, 1.1, 0.5);
    const zc = (z0 + z1) / 2, yr = yt + 1.3, tipY = yt + 10.5;
    g.surf(MAT.TILE).color(tile); for (const [A, B, k] of [[[x0, z1], [x1, z1], 1], [[x1, z1], [x1, z0], 0.82], [[x1, z0], [x0, z0], 0.9], [[x0, z0], [x0, z1], 0.95]]) g.color(tile, k).tri([A[0], yr, A[1]], [B[0], yr, B[1]], [xc, tipY, zc]);
    g.surf(MAT.STEEL).color(P.steel, 0.3).beam([xc, tipY - 0.3, zc], [xc, tipY + 2.2, zc], 0.1, 0.1); g.tri([xc, tipY + 2.1, zc], [xc + 1.3, tipY + 1.75, zc], [xc, tipY + 1.4, zc], { both: true }); }
}
// the gatehouse's right half above the arch's storey (x from 0 to W): the golden gate. Gold pilasters; between them a few arched windows at
// uneven heights, lit warm from within, each in a gold frame; two gold string courses; a rose of coloured glass under the eaves; gold corbels, a parapet with merlons and
// gold pinnacles; a crown of three great pinnacles and the round flanking tower, each with its roof, its gold ball and a banner that moves;
// the city's wall with its gold cope
function gateGold(g, top) {
  const P = PAL, { W, T, D, F, wing } = GATE, hd = D / 2, pearl = mulc(P.pearl, 0.8), zf = hd + 0.05, yRose = top - 5.4, zp = hd + F, XW = 11.6;
  g.surf(MAT.GOLD).color(GOLD); for (const x of [0.3, 4.2, 8.4]) g.box(x - 0.28, T + 0.3, hd, x + 0.28, top - 0.5, hd + 0.16, { bottom: false });
  // A FEW ARCHED WINDOWS AT UNEVEN HEIGHTS, lit warm from within (no two at one height, no two of one size): each a tall light under
  // a round head, in a gold frame (a sill, two jambs, the arch's hood), its own lamp hour; three dark slits between them; two gold
  // string courses across the face where no window stands. [x, its share of the height between the arch's storey and the rose,
  // width, height to the springing, lamp hour]
  { const S0 = T + 2.0, S1 = yRose - 4.5, lights = [[2.25, 0.05, 1.3, 3.0, 0.2], [10.35, 0.2, 1.1, 2.6, 0.35], [6.3, 0.36, 1.6, 3.8, 0.1], [2.25, 0.62, 1.1, 2.6, 0.45], [10.35, 0.8, 1.3, 3.0, 0.25]];
    const foot = (q) => lerp(S0, S1 - q[3] - q[2] / 2, q[1]), head = (q) => foot(q) + q[3] + q[2] / 2;
    for (const q of lights) { const [x, , w, h, t] = q, y = foot(q), r = w / 2, ys = y + h, A = [0, 0.7, 1.22, Math.PI / 2];
      pane(g, 1, x, zf, y, w, h, t);
      for (let k = 0; k < 3; k++) { const a = A[k], b = A[k + 1]; lampQuad(g, [x - r * Math.cos(a), ys + r * Math.sin(a), zf], [x + r * Math.cos(a), ys + r * Math.sin(a), zf], [x + r * Math.cos(b), ys + r * Math.sin(b), zf], [x - r * Math.cos(b), ys + r * Math.sin(b), zf], t); }
      g.surf(MAT.GOLD).color(GOLD).box(x - r - 0.3, y - 0.3, hd, x + r + 0.3, y, hd + 0.24);
      for (const sx of [-1, 1]) g.box(Math.min(sx * r, sx * (r + 0.18)) + x, y, hd, Math.max(sx * r, sx * (r + 0.18)) + x, ys, hd + 0.16, { bottom: false, top: false });
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI, b = (k + 1) / 6 * Math.PI, rr = r + 0.09; g.beam([x + rr * Math.cos(a), ys + rr * Math.sin(a), hd + 0.08], [x + rr * Math.cos(b), ys + rr * Math.sin(b), hd + 0.08], 0.16, 0.18, { caps: false }); }
      g.ball(x, ys + r + 0.42, hd + 0.2, 0.22, 0.22, 0.14, { nu: 5, nv: 3 }); }
    for (const [x, f] of [[6.3, 0.07], [2.25, 0.34], [6.3, 0.72]]) { const y = lerp(S0, S1 - 1.6, f);
      g.surf(MAT.PLAIN).color([0.02, 0.02, 0.035]).quad([x - 0.17, y, zf], [x + 0.17, y, zf], [x + 0.17, y + 1.6, zf], [x - 0.17, y + 1.6, zf]);
      g.surf(MAT.GOLD).color(GOLD, 0.9).box(x - 0.4, y - 0.18, hd, x + 0.4, y, hd + 0.18); }
    for (const y of [(head(lights[2]) + foot(lights[3])) / 2, (head(lights[4]) + yRose - 3.0) / 2]) g.surf(MAT.GOLD).color(GOLD, 0.92).box(0, y - 0.16, hd, XW, y + 0.16, hd + 0.24, { bottom: true }); }
  // the rose: twelve lights of coloured glass in a gold ring
  { const cx = 6.3, r = 2.5, n = 12; g.surf(MAT.GLASS).color([1, 1, 1]);
    for (let i = 0; i < n; i++) { const a = i / n * TAU, b = (i + 1) / n * TAU; g.tri([cx, yRose, zf], [cx + r * Math.cos(a), yRose + r * Math.sin(a), zf], [cx + r * Math.cos(b), yRose + r * Math.sin(b), zf]); }
    g.surf(MAT.GOLD).color(GOLD);
    for (let i = 0; i < n; i++) { const a = i / n * TAU, b = (i + 1) / n * TAU, r1 = r + 0.45, z = zf + 0.04; g.quad([cx + r * Math.cos(a), yRose + r * Math.sin(a), z], [cx + r1 * Math.cos(a), yRose + r1 * Math.sin(a), z], [cx + r1 * Math.cos(b), yRose + r1 * Math.sin(b), z], [cx + r * Math.cos(b), yRose + r * Math.sin(b), z]); } }
  // the machicolation: gold corbels in two steps, a pearl parapet on them with a gold cope, merlons; a gold pinnacle at each third of it
  for (let x = 0.6; x < XW - 0.2; x += 1.2) { g.surf(MAT.GOLD).color(GOLD, 0.8).box(x - 0.3, top - 1.6, hd, x + 0.3, top - 0.85, hd + 0.5, { bottom: true, top: false });
    g.color(GOLD).box(x - 0.3, top - 0.85, hd, x + 0.3, top - 0.1, hd + 0.95, { bottom: true, top: false }); }
  g.surf(MAT.STONE).color(pearl, 1.02).box(0, top - 0.1, hd + 0.4, XW, top + 1.3, hd + 1.0, { bottom: true }); g.surf(MAT.GOLD).color(GOLD).box(0, top + 1.3, hd + 0.36, XW, top + 1.42, hd + 1.04);
  g.surf(MAT.STONE).color(pearl); merlons(g, 0.9, hd + 0.72, XW, hd + 0.72, top + 1.42, 1.2, 1.2, 0.5); merlons(g, 0.9, -hd + 0.3, W, -hd + 0.3, top, 1.2, 1.3, 0.6);
  for (const x of [0.45, 4.2, 8.2]) { g.surf(MAT.GOLD).color(GOLD).lathe([[0.34, top + 1.42], [0.26, top + 4.4], [0.5, top + 4.7], [0.05, top + 7.4]], { cx: x, cz: hd + 0.72, segs: 5 }); g.ball(x, top + 7.55, hd + 0.72, 0.2, 0.2, 0.2, { nu: 5, nv: 3 }); }
  // THE CROWN: pinnacles, each a shaft, a steep roof, a gold ball, a staff and its banner (the banner as long as `flag`, two fifths as deep)
  const spire = (x, z, r, y0, y1, yTip, flag) => {
    g.surf(MAT.STONE).color(pearl).lathe([[r, y0], [r, y1 - 0.5], [r * 1.2, y1 - 0.2], [r * 1.2, y1]], { cx: x, cz: z, segs: 8 });
    g.surf(MAT.GOLD).color(GOLD).lathe([[r * 1.22, y1 - 0.22], [r * 1.24, y1 + 0.02]], { cx: x, cz: z, segs: 8 });
    g.surf(MAT.TILE).color(P.slate, 0.9); coneRoof(g, x, z, r * 1.28, y1, yTip, 8); g.surf(MAT.GOLD).color(GOLD).ball(x, yTip + 0.2, z, 0.4, 0.4, 0.4, { nu: 6, nv: 4 });
    g.surf(MAT.PLANK).color(P.timber, 0.7).beam([x, yTip + 0.2, z], [x, yTip + flag + 0.2, z], 0.07 * flag, 0.07 * flag, { taper: 0.6 });
    const fh = 0.42 * flag;
    g.surf(MAT.CLOTH).grid(4, 1, (u, q) => [x + flag * u, yTip + flag - fh + fh * q * (1 - 0.5 * u), z + 0.2 * Math.sin(u * 5), 0.36 * flag * u, q < 0.5 ? mulc(P.verm, 0.9) : GOLD], { both: true, su: flag, sv: fh });
  };
  spire(6.2, 0, 1.6, top, top + 9, top + 23.5, 5.0); spire(2.2, 0, 0.95, top, top + 5, top + 13.5, 3.4); spire(10.0, 0, 0.95, top, top + 5, top + 13.5, 3.4);
  // (the middle pinnacle's shaft: a tall lit light in its face, in a gold frame)
  for (const [dx, dz, dir] of [[0, 1.62, 1]]) { pane(g, dir, 6.2 + dx, dz, top + 2.6, 0.9, 4.2, 0.5); g.surf(MAT.GOLD).color(GOLD).box(6.2 - 0.62, top + 2.3, dz - 0.05, 6.2 + 0.62, top + 2.6, dz + 0.12).box(6.2 - 0.62, top + 6.8, dz - 0.05, 6.2 + 0.62, top + 7.1, dz + 0.12); }
  // THE FLANKING TOWER: a round tower of pearl at the gatehouse's outer end, standing before the porch's face and four metres over the eaves:
  // a battered foot, gold bands at the porch's cope and nine metres under the eaves, lit windows up its face at uneven steps, a flared wall-walk on a gold
  // ring with merlons round it, and within the walk a drum with its steep roof, ball, staff and banner
  { const cx = W + 3.2, cz = zp - 2.6, r = 4.0, yt = top + 4, yb = [T + PORCH_UP, top - 9];
    g.surf(MAT.STONE).color(pearl, 0.96).lathe([[r + 0.4, 0], [r + 0.3, 1.4], [r, 1.7], [r, yb[0]], [r - 0.12, yb[0] + 0.5], [r - 0.12, yb[1]], [r - 0.22, yb[1] + 0.5], [r - 0.22, yt - 2.2], [r + 0.75, yt - 0.3], [r + 0.75, yt + 1.3], [r + 0.25, yt + 1.3]], { cx, cz, segs: 12, flat: true });
    g.surf(MAT.GOLD).color(GOLD); for (const y of yb) g.lathe([[r + 0.08, y - 0.1], [r + 0.2, y], [r + 0.2, y + 0.4], [r - 0.1, y + 0.55]], { cx, cz, segs: 12, flat: true });
    g.lathe([[r + 0.2, yt - 1.5], [r + 0.8, yt - 0.3], [r + 0.8, yt]], { cx, cz, segs: 12, flat: true });
    g.surf(MAT.STONE).color(pearl); for (let i = 0; i < 8; i++) g.lathe([[r + 0.75, yt + 1.3], [r + 0.75, yt + 2.5], [r + 0.25, yt + 2.5], [r + 0.25, yt + 1.3]], { cx, cz, a0: i * TAU / 8, a1: i * TAU / 8 + 0.42, segs: 2, flat: true });
    spire(cx, cz, r - 0.7, yt + 1.2, yt + 4.4, yt + 16, 4.4);
    for (let y = 6, j = 0; y + 2.4 < yt - 3; y += [8.5, 5.5, 11][j % 3], j++) { const z = cz + (y < yb[0] ? r : r - 0.2) + 0.04; pane(g, 1, cx, z, y, 0.8, 2.2, clamp(0.15 + 0.09 * j, 0, 0.9));
      g.surf(MAT.GOLD).color(GOLD).box(cx - 0.6, y - 0.22, z - 0.3, cx + 0.6, y, z + 0.1).box(cx - 0.6, y + 2.2, z - 0.3, cx + 0.6, y + 2.42, z + 0.1); } }
  // the city's wall
  g.surf(MAT.STONE).color(pearl, 0.95).box(W + 1.5, 0, -1.0, W + wing, 9.0, 1.0); g.surf(MAT.GOLD).color(GOLD).box(W + 1.5, 9.0, -1.1, W + wing, 9.2, 1.1);
  g.surf(MAT.STONE).color(pearl); merlons(g, W + 1.5, 0.7, W + wing, 0.7, 9.2, 1.2, 1.2, 0.5);
}
// the outer yards of the two houses, in the house's own frame (x along the road, the road side on z = +D/2): one before the house (beyond the moat's
// arm, out long) and one after it. plain: low whitewashed walls; a cart, a haystack, a line of washing, hens, a trough | a kitchen garden, hives, a woodpile,
// a vine on posts. rich: a pearl parapet with gold coping and corner turrets; a striped pavilion, a fountain, banners | the tilt rail, a quintain, a
// smaller pavilion, rose trees; the turrets stand on the back corners only, away from the road. (The pages' horses and the inn's beasts are creatures of the world, tethered here.)
// a house and its outer yards in one geometry (they share an origin and stand and go together: one draw, not two)
// (houseSteps builds it in three steps, a yield after the house and one after its yards; houseGeometry runs them all)
export function* houseSteps(o = {}) { const g = new Geo(); yield* (o.rich ? castleSteps : innSteps)({ ...o, g }); yield; outerYardGeometry({ ...o, g }); yield; return g.toGeometry({ pad: 2 }); }
export function houseGeometry(o = {}) { const it = houseSteps(o); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
export function outerYardGeometry(o = {}) {
  const g = o.g || new Geo(), Y = YARD, P = PAL, mir = o.mir ?? 1, rich = !!o.rich, out = o.out ?? 20.8, hw = Y.W / 2, hd = Y.D / 2, X = (x) => x * mir;
  const bx = (x0, y0, z0, x1, y1, z1, oo) => g.box(Math.min(X(x0), X(x1)), y0, z0, Math.max(X(x0), X(x1)), y1, z1, oo);
  const white = mulc(P.white, 0.84), tile = mulc(P.tile, 0.8), timber = mulc(P.timber, 0.75), pearl = mulc(P.pearl, 0.8), straw = mulc(P.stubble, 0.9);
  const wall = (x0, z0, x1, z1) => {
    const t = rich ? 0.4 : 0.26, h = rich ? 1.9 : 1.5, a0 = Math.min(x0, x1) - t, a1 = Math.max(x0, x1) + t, b0 = Math.min(z0, z1) - t, b1 = Math.max(z0, z1) + t;
    if (rich) {
      // (a garden wall of dressed stone: a darker plinth course, a string course at breast height, the gold cope; a pier with its cap to
      // every five metres or so, and in every bay, on either face, a clipped bush with a rose on it)
      g.surf(MAT.STONE).color(pearl); bx(a0, 0, b0, a1, h, b1, { top: false }); g.color(pearl, 0.78); bx(a0 - 0.07, 0, b0 - 0.07, a1 + 0.07, 0.38, b1 + 0.07);
      g.color(pearl, 1.1); bx(a0 - 0.045, 1.12, b0 - 0.045, a1 + 0.045, 1.27, b1 + 0.045);
      g.surf(MAT.GOLD).color(GOLD); bx(a0 - 0.08, h, b0 - 0.08, a1 + 0.08, h + 0.16, b1 + 0.08);
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 5.2)), ux = (x1 - x0) / L, uz = (z1 - z0) / L;
      for (let i = 0; i <= n; i++) { const px = x0 + ux * L * i / n, pz = z0 + uz * L * i / n;
        g.surf(MAT.STONE).color(pearl, 0.93); bx(px - 0.56, 0, pz - 0.56, px + 0.56, h + 0.3, pz + 0.56, { top: false });
        g.surf(MAT.GOLD).color(GOLD); for (const [A, B] of [[[-1, 1], [1, 1]], [[1, 1], [1, -1]], [[1, -1], [-1, -1]], [[-1, -1], [-1, 1]]]) { const P0 = [X(px + 0.6 * A[0]), h + 0.3, pz + 0.6 * A[1]], P1 = [X(px + 0.6 * B[0]), h + 0.3, pz + 0.6 * B[1]], T = [X(px), h + 0.95, pz]; if (mir > 0) g.tri(P0, P1, T); else g.tri(P1, P0, T); } }
      for (let i = 0; i < n; i++) for (const sd of [-1, 1]) { const t = (i + 0.5) / n, px = x0 + ux * L * t - uz * sd * 0.85, pz = z0 + uz * L * t + ux * sd * 0.85;
        g.surf(MAT.WOOL).color(lin('#2f7a3f'), 0.55).ball(X(px), 0.42, pz, 0.6, 0.5, 0.6, { nu: 5, nv: 2 });
        g.surf(MAT.GLOW).color(i % 2 ? mulc(P.verm, 0.95) : mulc(P.pearl, 0.9), 0.5).cbox(X(px) + 0.18, 0.86, pz + 0.12 * sd, 0.22, 0.2, 0.22); }
    }
    else { g.surf(MAT.PLAIN).color(white); bx(a0, 0, b0, a1, h, b1, { top: false }); g.surf(MAT.TILE).color(tile); bx(a0 - 0.1, h, b0 - 0.1, a1 + 0.1, h + 0.16, b1 + 0.1); }
  };
  const pole = (x, z, h, c1, len = 3.0, hg = 1.2) => {
    g.surf(MAT.PLANK).color(timber).beam([X(x), 0, z], [X(x), h, z], 0.13, 0.13);
    g.surf(MAT.CLOTH).grid(4, 1, (u, q) => [X(x) + len * u, h - 0.2 - hg * (1 - q) * (1 - 0.5 * u), z + 0.2 * Math.sin(u * 5), 1.4 * u, q < 0.5 ? c1 : (rich ? GOLD : white)], { both: true, su: len, sv: hg });
  };
  const tent = (x, z, r, h) => {
    for (let i = 0; i < 8; i++) g.surf(MAT.CANVAS).color(i % 2 ? mulc(P.verm, 0.85) : mulc(P.pearl, 0.9)).lathe([[r, 0], [r, h * 0.42], [0.05, h]], { cx: X(x), cz: z, segs: 2, a0: i * TAU / 8, a1: (i + 1) * TAU / 8 });
    g.surf(MAT.GOLD).color(GOLD).ball(X(x), h + 0.2, z, 0.25, 0.3, 0.25, { nu: 5, nv: 3 }); pole(x, z, h + 2.6, mulc(P.ultra, 0.9), 2.2, 0.8);
  };
  for (const e of [-1, 1]) {                                         // e = -1 the yard before the house, 1 the yard after it
    const xa = e * (hw + Y.moat), xb = e * (hw + Y.moat + out), xm = (xa + xb) / 2, gate = xm - e * 3;   // (the moat's arm, or the inn's lane, lies between the house and its outer yard)
    wall(xb, -hd, xb, hd); wall(xa, -hd, xa, hd); wall(xa, hd, gate - 1.6, hd); wall(gate + 1.6, hd, xb, hd); wall(xa, -hd, xb, -hd);
    if (rich) {
      for (const z of [-hd]) { g.surf(MAT.STONE).color(pearl).lathe([[1.15, 0], [1.05, 4.4], [1.3, 4.8], [1.3, 5.4]], { cx: X(xb), cz: z, segs: 8 }); g.surf(MAT.TILE).color(P.slate, 0.9); coneRoof(g, X(xb), z, 1.4, 5.4, 8.6, 8); }
      for (let i = 0; i < 3; i++) pole(xa + e * (3.5 + i * 6), hd - 0.9, 6.2, i % 2 ? mulc(P.ultra, 0.9) : mulc(P.verm, 0.9), 2.6, 1.5);
      if (e < 0) {
        tent(xm - 2, -2, 3.3, 5.6);
        g.surf(MAT.STONE).color(pearl).lathe([[2.3, 0], [2.3, 0.7], [2.0, 0.7], [1.9, 0.4]], { cx: X(xm + 3), cz: 8, segs: 12 }); g.lathe([[0.3, 0.3], [0.24, 1.9], [1.05, 2.2], [1.1, 2.4], [0.2, 2.3]], { cx: X(xm + 3), cz: 8, segs: 10 });
        g.surf(MAT.GLASS).color([0.5, 0.7, 0.9]).disc(X(xm + 3), 0.55, 8, 2.0, 12); g.surf(MAT.GOLD).color(GOLD).lathe([[0.14, 2.3], [0.2, 2.9], [0.02, 3.4]], { cx: X(xm + 3), cz: 8, segs: 6 });
      } else {
        for (let i = 0; i < 7; i++) { g.surf(MAT.PLANK).color(i % 2 ? mulc(P.verm, 0.85) : mulc(P.pearl, 0.9)); bx(xa + 2.5 + i * 2.2, 0.75, 5.9, xa + 4.7 + i * 2.2, 1.25, 6.05); if (i % 2 === 0) bx(xa + 2.5 + i * 2.2, 0, 5.9, xa + 2.7 + i * 2.2, 0.75, 6.05); }
        g.surf(MAT.PLANK).color(timber).beam([X(xm + 4), 0, -3], [X(xm + 4), 3.3, -3], 0.2, 0.2); g.beam([X(xm + 4), 3.1, -4.5], [X(xm + 4), 3.1, -1.5], 0.12, 0.12);
        g.surf(MAT.GOLD).color(GOLD).cbox(X(xm + 4), 2.3, -1.5, 0.12, 0.9, 0.7); g.surf(MAT.WOOL).color(P.dust, 0.6).ball(X(xm + 4), 2.5, -4.5, 0.3, 0.45, 0.3, { nu: 6, nv: 4 });
        tent(xm - 4, -8, 2.5, 4.4);
        for (let i = 0; i < 4; i++) { const x = xa + 3 + i * 4.6; g.surf(MAT.PLANK).color(timber).beam([X(x), 0, 11], [X(x), 1.5, 11], 0.09, 0.09); g.surf(MAT.WOOL).color(lin('#2f7a3f'), 0.6).ball(X(x), 2.0, 11, 0.75, 0.7, 0.75, { nu: 7, nv: 4 }); g.color(P.verm, 0.9).ball(X(x) + 0.3, 2.3, 11.4, 0.22, 0.22, 0.22, { nu: 4, nv: 3 }); g.ball(X(x) - 0.4, 1.9, 11.5, 0.2, 0.2, 0.2, { nu: 4, nv: 3 }); }
      }
    } else if (e < 0) {
      g.surf(MAT.PLANK).color(timber); bx(xm - 3.4, 0.85, 1.0, xm - 0.6, 1.25, 2.6); g.beam([X(xm - 0.6), 1.0, 1.4], [X(xm + 1.8), 0.25, 1.4], 0.1, 0.1); g.beam([X(xm - 0.6), 1.0, 2.2], [X(xm + 1.8), 0.25, 2.2], 0.1, 0.1);
      for (const z of [0.85, 2.75]) { g.push(new THREE.Matrix4().makeTranslation(X(xm - 2), 0.78, z).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))); g.lathe([[0.78, -0.07], [0.78, 0.07]], { segs: 10 }); g.disc(0, 0.07, 0, 0.78, 10); g.pop(); }
      g.surf(MAT.WOOL).color(straw).lathe([[2.3, 0], [2.1, 1.5], [1.2, 2.9], [0.05, 3.5]], { cx: X(xm + 3), cz: -7, segs: 10 });
      g.surf(MAT.PLANK).color(timber); for (const x of [xm - 7, xm + 6]) g.beam([X(x), 0, 10.5], [X(x), 3.1, 10.5], 0.13, 0.13);
      for (let i = 0; i < 7; i++) { const x = xm - 6.4 + i * 1.8, c = i % 3 === 1 ? mulc(P.dust, 0.9) : i % 3 === 2 ? mulc(P.ultra, 0.45) : mulc(P.white, 0.92); g.surf(MAT.CLOTH).color(c).grid(2, 2, (u, q) => [X(x + 1.3 * u), 2.95 - 1.6 * q, 10.5 + 0.1 * Math.sin(u * 3 + i), 0.9 * q], { both: true, su: 1.3, sv: 1.6 }); }
      for (let i = 0; i < 8; i++) { const x = X(xm - 5 + ((i * 3.7) % 9)), z = 4 + ((i * 2.3) % 5), c = i % 3 ? [0.8, 0.78, 0.7] : mulc(P.tile, 0.6); g.surf(MAT.PLAIN).color(c).ball(x, 0.2, z, 0.13, 0.15, 0.2, { nu: 5, nv: 3 }); g.ball(x, 0.38, z + 0.14, 0.07, 0.08, 0.08, { nu: 4, nv: 3 }); g.color(P.verm, 0.9).cbox(x, 0.44, z + 0.14, 0.03, 0.07, 0.08); }
      g.surf(MAT.STONE).color(P.stone, 0.7); bx(xa - 3.6, 0, -11.5, xa - 1.0, 0.6, -10.6);
    } else {
      for (let i = 0; i < 6; i++) { g.surf(MAT.WOOL).color(i % 2 ? lin('#3f6a2a') : lin('#5a7a34'), 0.6); bx(xa + 2.5, 0, -11 + i * 2.1, xa + 11.5, 0.45, -10.1 + i * 2.1); }
      for (let i = 0; i < 4; i++) g.surf(MAT.WOOL).color(straw, 0.9).lathe([[0.42, 0], [0.45, 0.45], [0.3, 0.8], [0.03, 0.95]], { cx: X(xa + 14.5 + (i % 2) * 1.3), cz: -9 + i * 1.2, segs: 7 });
      g.surf(MAT.PLANK).color(timber, 0.8); bx(xa + 13.5, 0, 2.5, xa + 17.5, 1.6, 3.8);
      g.surf(MAT.PLANK).color(timber); for (const x of [xa + 3, xa + 9]) for (const z of [7, 11.5]) g.beam([X(x), 0, z], [X(x), 2.6, z], 0.14, 0.14);
      g.surf(MAT.WOOL).color(lin('#4a7a2c'), 0.65); bx(xa + 2.5, 2.6, 6.5, xa + 9.5, 2.95, 12);
    }
  }
  return o.g ? g : g.toGeometry({ pad: 1 });
}
// what a holding holds, each about its own middle, front toward +z. kind: 'stook' (a stook of sheaves | a small striped pavilion), 'floor' (a threshing
// floor of beaten earth with its kerb, a heap of straw and the sledge | a tiled round with a fountain), 'hut' (a shepherd's round hut with its pen |
// a hermit's chapel with a gilt bell), 'well' (a well with its wheel and trough | a gilded fountain of three bowls), 'boat' (a stranded hull | a
// painted boat with a canopy)
// the threshing floor's own measures: its radius to the kerb's inner face, and the round its beast treads (on the spread straw's outer
// slope, 1.4 m inside the kerb): the world reads them
export const FLOOR = { R: 9, walk: 9 - 1.4 };
export function holdingGeometry(kind, rich = false) {
  const g = new Geo(), P = PAL, straw = mulc(P.stubble, 1.0), stone = mulc(P.stone, 0.72), pearl = mulc(P.pearl, 0.8), timber = mulc(P.timber, 0.75);
  if (kind === 'farStook') {
    // (a stook or a pavilion as it is seen from forty metres and more: one plain shape of the same height and width)
    if (!rich) g.surf(MAT.WOOL).color(straw).lathe([[1.0, 0], [0.5, 1.25], [0.05, 2.0]], { segs: 5 });
    else for (let i = 0; i < 6; i++) g.surf(MAT.CANVAS).color(i % 2 ? mulc(P.ultra, 0.8) : mulc(P.pearl, 0.9)).lathe([[1.7, 0], [1.7, 1.5], [0.05, 3.3]], { segs: 1, a0: i * TAU / 6, a1: (i + 1) * TAU / 6 });
  } else if (kind === 'stook' || kind === 'sheaves') {
    // ('sheaves': a stook as it is seen near: six bound sheaves leaning together, each with its dark band and its paler ears; 'stook': the same
    // seen across the fields, one shape. Across the road both are the pavilion.)
    if (!rich && kind === 'sheaves') {
      const ear = mulc(straw, 1.22), band = mulc(straw, 0.5);
      g.surf(MAT.WOOL);
      for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + 0.3;
        g.push(new THREE.Matrix4().makeTranslation(0.66 * Math.cos(a), 0, 0.66 * Math.sin(a)).multiply(new THREE.Matrix4().makeRotationY(-a)).multiply(new THREE.Matrix4().makeRotationZ(0.3 + 0.06 * (i % 2))));
        g.color(straw).lathe([[0.27, 0, mulc(straw, 0.78)], [0.13, 1.02, band], [0.31, 1.62, ear], [0.07, 1.8, ear]], { segs: 5 }); g.pop(); }
    }
    else if (!rich) { g.surf(MAT.WOOL).color(straw).lathe([[1.0, 0], [0.55, 1.1], [0.3, 1.5], [0.6, 1.95], [0.05, 2.0]], { segs: 7 }); }
    else {
      for (let i = 0; i < 6; i++) g.surf(MAT.CANVAS).color(i % 2 ? mulc(P.ultra, 0.8) : mulc(P.pearl, 0.9)).lathe([[1.7, 0], [1.7, 1.5], [0.05, 3.3]], { segs: 2, a0: i * TAU / 6, a1: (i + 1) * TAU / 6 });
      g.surf(MAT.GOLD).color(GOLD).ball(0, 3.45, 0, 0.18, 0.22, 0.18, { nu: 5, nv: 3 });
      g.surf(MAT.PLANK).color(timber).beam([0, 3.3, 0], [0, 4.5, 0], 0.08, 0.08);
      g.surf(MAT.CLOTH).grid(2, 1, (u, q) => [1.5 * u, 3.9 + 0.5 * q * (1 - 0.6 * u), 0.1 * Math.sin(u * 4), 1.2 * u, mulc(P.verm, 0.9)], { both: true, su: 1.5, sv: 0.5 });
    }
  } else if (kind === 'floor') {
    const R = FLOOR.R;
    if (!rich) {
      g.surf(MAT.PLAIN).color(mulc(P.dust, 0.95)).disc(0, 0.12, 0, R, 20); g.surf(MAT.STONE).color(stone).lathe([[R, 0], [R, 0.45], [R + 0.5, 0.45], [R + 0.5, 0]], { segs: 20, flat: true });
      g.surf(MAT.WOOL).color(straw, 1.05).lathe([[2.6, 0.1], [2.0, 1.2], [0.05, 1.9]], { cx: 3.5, cz: -2.5, segs: 9 }); g.lathe([[R - 0.6, 0.13], [R - 2.8, 0.3], [R - 4.6, 0.13]], { segs: 20, a0: 0.5, a1: 3.4 });
      g.surf(MAT.PLANK).color(timber).box(-4.6, 0.14, 2.2, -2.8, 0.3, 3.6); g.beam([-2.8, 0.3, 2.9], [-0.9, 0.9, 2.9], 0.08, 0.08);
    } else {
      for (let i = 0; i < 5; i++) g.surf(MAT.TILE).color(i % 2 ? mulc(P.ultra, 0.7) : pearl).lathe([[R * (1 - i / 5), 0.12 + i * 0.005], [R * (1 - (i + 1) / 5) + 0.01, 0.12 + i * 0.005]], { segs: 20 });
      g.surf(MAT.GOLD).color(GOLD).lathe([[R, 0], [R, 0.4], [R + 0.4, 0.4], [R + 0.4, 0]], { segs: 20, flat: true });
      g.surf(MAT.STONE).color(pearl).lathe([[1.9, 0.1], [1.9, 0.8], [1.6, 0.8], [0.3, 0.5], [0.24, 2.2], [0.9, 2.5], [0.95, 2.7], [0.15, 2.6]], { segs: 10 });
      g.surf(MAT.GLASS).color([0.5, 0.7, 0.9]).disc(0, 0.68, 0, 1.6, 10); g.surf(MAT.GOLD).color(GOLD).lathe([[0.12, 2.6], [0.2, 3.2], [0.02, 3.7]], { segs: 6 });
    }
  } else if (kind === 'hut') {
    if (!rich) {
      g.surf(MAT.STONE).color(stone).lathe([[2.4, 0], [2.3, 2.0]], { segs: 10 }); g.surf(MAT.WOOL).color(straw, 0.8).lathe([[2.9, 1.8], [1.5, 3.4], [0.05, 4.6]], { segs: 10 });
      g.surf(MAT.PLAIN).color([0.03, 0.026, 0.022]).quad([-0.5, 0, 2.42], [0.5, 0, 2.42], [0.5, 1.6, 2.36], [-0.5, 1.6, 2.36]);
      g.surf(MAT.STONE).color(stone, 0.9).lathe([[5.5, 0], [5.5, 0.9], [5.9, 0.9], [5.9, 0]], { cx: 8, cz: 0, segs: 12, flat: true, a0: 0.5, a1: 6.0 });
    } else {
      g.surf(MAT.STONE).color(pearl).box(-2.2, 0, -5, 2.2, 4.2, 0, { top: false }); g.tri([-2.2, 4.2, 0], [2.2, 4.2, 0], [0, 6.4, 0]); g.tri([2.2, 4.2, -5], [-2.2, 4.2, -5], [0, 6.4, -5]);
      g.surf(MAT.TILE).color(P.slate, 0.9); g.quad([2.6, 4.0, 0.4], [2.6, 4.0, -5.4], [0, 6.5, -5.4], [0, 6.5, 0.4]); g.quad([-2.6, 4.0, -5.4], [-2.6, 4.0, 0.4], [0, 6.5, 0.4], [0, 6.5, -5.4]);
      g.surf(MAT.STONE).color(pearl); for (const sx of [-1, 1]) g.cbox(sx * 0.7, 6.3, 0, 0.3, 2.4, 0.5); g.box(-0.85, 8.7, -0.25, 0.85, 9.0, 0.25);
      g.surf(MAT.GOLD).color(GOLD).lathe([[0.42, 7.1], [0.36, 7.7], [0.15, 8.1]], { segs: 7 }); g.ball(0, 9.3, 0, 0.2, 0.3, 0.2, { nu: 5, nv: 3 });
      g.surf(MAT.PLANK).color(mulc(P.ultra, 0.5)).quad([-0.7, 0, 0.05], [0.7, 0, 0.05], [0.7, 2.4, 0.05], [-0.7, 2.4, 0.05]); pane(g, 1, 0, 0.05, 2.9, 0.7, 0.9, 0.35);
    }
  } else if (kind === 'well') {
    if (!rich) {
      g.surf(MAT.STONE).color(stone).lathe([[1.3, 0], [1.3, 1.0], [0.95, 1.0], [0.95, 0.2]], { segs: 10, flat: true });
      g.surf(MAT.PLANK).color(timber); for (const sx of [-1, 1]) g.beam([sx * 1.5, 0, 0], [sx * 1.5, 3.0, 0], 0.18, 0.18); g.beam([-1.7, 3.0, 0], [1.7, 3.0, 0], 0.16, 0.16);
      g.push(new THREE.Matrix4().makeTranslation(0, 2.3, 0).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2))); g.lathe([[1.0, -0.1], [1.0, 0.1]], { segs: 10, both: true }); for (let i = 0; i < 4; i++) g.beam([Math.sin(i * 0.785) * 1.0, 0, Math.cos(i * 0.785) * 1.0], [-Math.sin(i * 0.785) * 1.0, 0, -Math.cos(i * 0.785) * 1.0], 0.07, 0.07); g.pop();
      // (the trough: a stone box with water standing in it)
      g.surf(MAT.STONE).color(stone, 0.85).box(2.2, 0, -0.5, 5.0, 0.55, 0.5); g.surf(MAT.PLAIN).color([0.2, 0.3, 0.36]).quad([2.34, 0.56, 0.38], [4.86, 0.56, 0.38], [4.86, 0.56, -0.38], [2.34, 0.56, -0.38]);
    } else {
      g.surf(MAT.STONE).color(pearl).lathe([[2.4, 0], [2.4, 0.8], [2.1, 0.8], [0.4, 0.5]], { segs: 12 }); g.surf(MAT.GLASS).color([0.5, 0.7, 0.9]).disc(0, 0.68, 0, 2.1, 12);
      g.surf(MAT.GOLD).color(GOLD).lathe([[0.3, 0.5], [0.24, 1.9], [1.3, 2.2], [1.35, 2.4], [0.25, 2.3], [0.2, 3.3], [0.8, 3.5], [0.85, 3.7], [0.15, 3.6], [0.12, 4.3], [0.4, 4.5], [0.02, 5.0]], { segs: 10 });
    }
  } else {
    const hull = (c) => g.surf(MAT.PLANK).color(c).grid(6, 3, (u, q) => { const t = u * 2 - 1, w = 0.95 * (1 - t * t * 0.85), a = (q - 0.5) * 2.6; return [Math.sin(a) * w, 0.75 - Math.cos(a) * 0.75 * (1 - 0.3 * t * t), t * 3.2]; }, { both: true });
    if (!rich) { g.push(new THREE.Matrix4().makeRotationZ(0.5)); hull(mulc(P.timber, 0.6)); g.pop(); }
    else {
      hull(mulc(P.verm, 0.8)); g.surf(MAT.GOLD).color(GOLD).beam([0, 0.8, 3.1], [0, 1.9, 3.5], 0.1, 0.1);
      g.surf(MAT.PLANK).color(timber); for (const sx of [-1, 1]) for (const z of [-1.2, 1.2]) g.beam([sx * 0.75, 0.7, z], [sx * 0.75, 2.3, z], 0.06, 0.06);
      g.surf(MAT.CLOTH).grid(2, 2, (u, q) => [(u - 0.5) * 1.7, 2.3 + 0.25 * Math.sin(u * Math.PI), -1.3 + 2.6 * q, 0.3, q < 0.5 ? mulc(P.ultra, 0.9) : GOLD], { both: true });
    }
  }
  return g.toGeometry({ pad: 1 });
}
// the first stars: points of the sky (directions; the world hangs them in the sky kit's own dome, which the kit carries). dirs = [[x, y, z, size, phase], ...],
// size in pixels of a frame 1080 high (a star's angle is the same in every frame: uH is the drawing buffer's height); uK = how far they are out (0..1)
export function makeStars(U, dirs, radius = 3000) {
  const n = dirs.length, pos = new Float32Array(n * 3), seed = new Float32Array(n * 2);
  dirs.forEach((q, i) => { const l = Math.hypot(q[0], q[1], q[2]) || 1; pos.set([q[0] / l * radius, q[1] / l * radius, q[2] / l * radius], i * 3); seed.set([q[3], q[4]], i * 2); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 2));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius * 1.1);
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uTime: U.uTime, uH: { value: 1080 }, uK: { value: 0 } },
    vertexShader: /* glsl */`
      attribute vec2 aSeed; uniform float uTime, uH, uK; varying float vA;
      void main(){
        // each comes out at its own share of the evening (the brightest first), and twinkles on the clock
        float out1 = smoothstep(aSeed.y * 0.7, aSeed.y * 0.7 + 0.3, uK), size = aSeed.x * uH / 1080.;
        vA = out1 * (0.75 + 0.25 * sin(uTime * (1.3 + 3. * aSeed.y) + aSeed.y * 40.)) * min(1., size * size / (1.5 * 1.5));
        gl_PointSize = max(size, 1.5); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying float vA;
      void main(){ vec2 q = gl_PointCoord * 2. - 1.; float r = length(q), s = clamp(1. - r, 0., 1.); gl_FragColor = vec4(vec3(1., 0.95, 0.86) * (s * s + 2. * clamp(1. - r * 3., 0., 1.)) * vA, 1.); }`,
  });
  const points = new THREE.Points(g, material); points.frustumCulled = false; points.renderOrder = 0;
  return { points, material };
}
