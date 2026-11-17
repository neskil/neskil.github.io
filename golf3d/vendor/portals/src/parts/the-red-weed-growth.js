// THE RED WEED, the growth itself: the standing weed (fleshy branched stems of swollen lobed pads and joints: every
// pad of the larger kinds is a closed body with a top and an underside, never a single flat card), the great water
// fronds, the low clumps on the mats, the curtains that hang from every parapet and eave, the flakes the dead
// growth sheds, and the small things of the dry ground where the weed has died (tussocks, stones, dead stems, flowers).
//
//   makeGrowth(ctx, U, o)      async. o: { plants: [{ x, y, z, v, s, rot, sick, seed }], chunkZ, cull, ring, shapes }  -> { object, uniforms, triangles, shapes, update(camera) }
//                              v: 0 tall candelabra, 1 thicket, 2 water fronds, 3 low clump, 4 far thicket (cheap)
//   makeCurtains(U, hangs, o)  hangs: [[x, y, z, length, nx, nz, width, sick]] -> { object, uniforms, triangles }
//   makeCrumble(U, plants, o)  flakes leaving each plant given and going down the wind. o: { per, wind: [x, z], heights } -> { object, uniforms, triangles }
//   makeLitter(ctx, U, items)  async. items: [{ x, y, z, k, s, rot, seed, col, col2 }] -> { object, triangles }; one mesh, one call
// One material draws all standing growth (baked into a few meshes along the valley, so it costs a few calls);
// every vertex knows its plant's foot, so plants sway from the foot, ride the ring waves with the mat they stand
// in, and sink into it far from the eye.
import * as THREE from 'three';
import { RW_GLSL, withShared, clamp, lerp } from './the-red-weed-common.js';

// ---------------------------------------------------------------- the plants' shapes
class PlantGeo {
  constructor() { this.p = []; this.n = []; this.f = []; this.i = []; this.count = 0; }
  v(P, N, thin, seed, tone) { this.p.push(P.x, P.y, P.z); this.n.push(N.x, N.y, N.z); this.f.push(thin, 0, seed, tone); return this.count++; }
  done() {
    let H = 0.001; for (let k = 1; k < this.p.length; k += 3) H = Math.max(H, this.p[k]);
    for (let k = 0; k < this.count; k++) this.f[k * 4 + 1] = Math.pow(clamp(this.p[k * 3 + 1] / H, 0, 1), 1.4);
    return { p: new Float32Array(this.p), n: new Float32Array(this.n), f: new Float32Array(this.f), i: new Uint16Array(this.i), count: this.count, H };
  }
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _q = new THREE.Quaternion();
// one lobed pad growing from `base` along `dir` in the plane whose normal is `nrm`; returns its rim points.
// thick > 0: a swollen body (a top and an underside meeting at a rounded rim, `thick` x its width through the
// middle); thick = 0: a small cupped pad (one skin, domed), for the low clumps of which there are thousands.
// The first number each vertex carries is how far light comes through there: nothing through the middle, a
// little at the rim.
function pad(g, rng, base, dir, nrm, len, wid, N = 7, thick = 0.2) {
  const side = new THREE.Vector3().crossVectors(dir, nrm).normalize(), seed = rng(), tone = rng.range(0.72, 1.22), lob = rng.range(0, 6.28), rim = [];
  const cen = new THREE.Vector3().copy(base).addScaledVector(dir, len * 0.56), th = wid * (thick > 0 ? thick : 0.2);
  const ci = g.v(_a.copy(cen).addScaledVector(nrm, th), nrm, 0.0, seed, tone), first = g.count;
  for (let k = 0; k < N; k++) {
    const ph = ((k + 0.5) / N) * Math.PI * 2, t = (1 - Math.cos(ph)) / 2, rr = 1 + 0.13 * Math.sin(3 * ph + lob);
    const u = len * t * (0.92 + 0.08 * rr), w = (wid / 2) * Math.sin(ph) * (0.7 + 0.42 * t) * rr;
    const P = new THREE.Vector3().copy(base).addScaledVector(dir, u).addScaledVector(side, w);
    _a.copy(P).sub(cen).normalize(); if (!(thick > 0)) _a.multiplyScalar(0.9).addScaledVector(nrm, 0.45).normalize();
    g.v(P, _a, 1.0, seed, tone); rim.push(P);
  }
  for (let k = 0; k < N; k++) g.i.push(ci, first + k, first + ((k + 1) % N));
  if (thick > 0) { _b.copy(nrm).negate(); const cb = g.v(_a.copy(cen).addScaledVector(nrm, -th * 0.75), _b, 0.0, seed, tone * 0.8); for (let k = 0; k < N; k++) g.i.push(cb, first + ((k + 1) % N), first + k); }
  return { rim, side, cen };
}
// a swollen joint (or, with bud = 2, a bud: it swells and shrinks on the clock)
function knot(g, rng, at, r, bud = 0) {
  const seed = rng() + bud, tone = bud ? 1.25 : 0.8, b = g.count, a0 = rng() * 6.28;
  _a.set(0, 1, 0); _b.copy(at).addScaledVector(_a, r * 1.3); g.v(_b, _a, bud ? 0.7 : 0.12, seed, tone);
  _a.set(0, -1, 0); _b.copy(at).addScaledVector(_a, r * 1.3); g.v(_b, _a, bud ? 0.7 : 0.12, seed, tone);
  for (let k = 0; k < 3; k++) { _a.set(Math.cos(a0 + k * 2.094), 0, Math.sin(a0 + k * 2.094)); _b.copy(at).addScaledVector(_a, r); g.v(_b, _a, bud ? 0.7 : 0.12, seed, tone); }
  for (let k = 0; k < 3; k++) { const i = b + 2 + k, j = b + 2 + ((k + 1) % 3); g.i.push(b, j, i, b + 1, i, j); }
}
function grow(g, rng, base, dir, nrm, len, wid, depth, o) {
  if (o.knot !== 0) knot(g, rng, base, wid * (o.knot ?? 0.15));
  const P = pad(g, rng, base, dir, nrm, len, wid, o.N ?? 7, o.thick ?? 0.2);
  if (depth <= 0) { if (rng() < (o.buds ?? 0.5)) knot(g, rng, P.rim[Math.floor((o.N ?? 7) / 2)], wid * 0.11, 2); return; }
  const kids = rng() < (o.fork ?? 0.55) ? 2 : 1;
  for (let c = 0; c < kids; c++) {
    const sgn = kids === 2 ? (c ? 1 : -1) : (rng() < 0.5 ? 1 : -1), N = o.N ?? 7;
    const at = P.rim[clamp(Math.floor(N / 2) + sgn * (kids === 2 ? 1 : 0), 0, N - 1)].clone().lerp(P.cen, 0.22);
    const d2 = dir.clone().applyAxisAngle(nrm, -sgn * rng.range(0.3, 0.85)).lerp(_c.set(0, 1, 0), o.up ?? 0.3).normalize();
    const n2 = nrm.clone().applyAxisAngle(d2, sgn * rng.range(0.3, 1.1)); n2.addScaledVector(d2, -n2.dot(d2)).normalize();
    grow(g, rng, at, d2, n2, len * rng.range(0.74, 0.95), wid * rng.range(0.78, 0.96), depth - 1, o);
  }
}
function buildVariants(rng) {
  const V = [], up = new THREE.Vector3(0, 1, 0);
  const stem = (g, az, lean, len, wid, depth, o) => {
    const d = new THREE.Vector3(Math.sin(lean) * Math.cos(az), Math.cos(lean), Math.sin(lean) * Math.sin(az));
    const n = new THREE.Vector3(Math.cos(az + 1.3), 0.15, Math.sin(az + 1.3)); n.addScaledVector(d, -n.dot(d)).normalize();
    grow(g, rng, new THREE.Vector3(Math.cos(az) * 0.12, -0.15, Math.sin(az) * 0.12), d, n, len, wid, depth, o);
  };
  // 0: tall candelabra, about 4 m
  { const g = new PlantGeo(); stem(g, rng.range(0, 6.28), 0.1, 1.5, 1.08, 3, { fork: 0.45, up: 0.42, N: 6, buds: 0.4 }); stem(g, rng.range(0, 6.28), 0.55, 1.1, 0.9, 1, { fork: 0.2, N: 6, buds: 0.3 }); V.push(g.done()); }
  // 1: a thicket, broad, about 2.6 m
  { const g = new PlantGeo(); for (let k = 0; k < 3; k++) stem(g, k * 2.1 + rng.range(-0.4, 0.4), rng.range(0.25, 0.65), rng.range(0.95, 1.2), rng.range(0.85, 1.05), k === 0 ? 2 : 1, { fork: 0.5, up: 0.3, N: 6, buds: 0.35 }); V.push(g.done()); }
  // 2: the great water fronds, lying out over the water, a stem standing among them
  { const g = new PlantGeo();
    for (let k = 0; k < 5; k++) { const az = k * 1.2566 + rng.range(-0.3, 0.3), el = rng.range(0.14, 0.4);
      const d = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)), n = up.clone().addScaledVector(d, -up.dot(d)).normalize().applyAxisAngle(d, rng.range(-0.35, 0.35));
      grow(g, rng, new THREE.Vector3(Math.cos(az) * 0.2, 0.0, Math.sin(az) * 0.2), d, n, rng.range(2.0, 3.0), rng.range(1.5, 2.0), k % 2, { fork: 0.15, up: 0.05, N: 8, buds: 0.2, knot: k ? 0 : 0.1, thick: 0.13 }); }
    stem(g, 1.0, 0.2, 1.1, 0.9, 1, { fork: 0.3, N: 6 }); V.push(g.done()); }
  // 3: a low clump (no joints, no buds: it is small and there are thousands)
  { const g = new PlantGeo(); for (let k = 0; k < 4; k++) stem(g, k * 1.5708 + rng.range(-0.5, 0.5), rng.range(0.3, 1.0), rng.range(0.6, 1.1), rng.range(0.6, 0.85), 0, { buds: 0, N: 6, knot: 0, thick: 0 }); V.push(g.done()); }
  // 4: a thicket seen far off: few large pads with the same outline
  { const g = new PlantGeo(); for (let k = 0; k < 2; k++) stem(g, k * 3.1 + rng.range(-0.4, 0.4), rng.range(0.15, 0.45), rng.range(1.5, 1.8), rng.range(1.2, 1.4), 1, { fork: 0.5, up: 0.35, N: 5, buds: 0, knot: 0 }); V.push(g.done()); }
  return V;
}

// rings from the engine's footfalls (the sheet uses the same function, so plants ride the mat they stand in)
export const RINGS_GLSL = /* glsl */`
uniform vec4 uRing[8];
vec3 rwRings(vec2 xz){
  float rh = 0.0; vec2 rg = vec2(0.0);
  for (int i = 0; i < 8; i++) {
    vec4 r = uRing[i]; vec2 dv = xz - r.xy; float d = length(dv) + 1e-3, age = max(r.z, 0.0);
    float r0 = 2.0 + 8.5*age, x = (d - r0)/3.2;
    float amp = step(0.0, r.z)*r.w*exp(-min(x*x, 40.0))*exp(-min(age*0.24, 40.0))*(1.0 - smoothstep(60.0, 110.0, d))*1.1/(1.0 + 0.03*max(d, 0.0));
    float ph = (d - r0)*1.15;
    rh += amp*cos(ph); rg += dv/d*(-amp*1.15*sin(ph));
  }
  return vec3(rh, rg);
}`;

const GROW_VS = /* glsl */`
${RW_GLSL}
${RINGS_GLSL}
uniform float uCull;
attribute vec4 aF;            // thin 0..1, sway weight, seed (+2 = a bud), tone
attribute vec4 aB;            // the plant's foot (xyz) and its sickness
varying vec3 vW, vN; varying vec4 vF; varying float vSick, vUp, vOut;
void main(){
  vec3 base = aB.xyz, off = position - base;
  float seed = fract(aF.z), bud = step(1.5, aF.z);
  off += normal*bud*0.07*(0.5 + 0.5*sin(uTime*0.9 + seed*40.0));                       // buds swell and split
  float ph = seed*2.0 + base.x*0.19 + base.z*0.13;
  float gust = 0.6 + 0.4*sin(uTime*0.33 - base.x*0.045 - base.z*0.03);
  vec2 sw = vec2(sin(uTime*0.78 + ph), sin(uTime*0.61 + ph*1.7 + 1.3))*gust + 0.35*vec2(sin(uTime*1.9 + ph*3.1 + off.y), cos(uTime*1.6 + ph*2.3 + off.y));
  float amt = aF.y*(0.05 + 0.065*max(off.y, 0.0))*(1.0 + 0.7*aB.w);                      // the dead growth is dry and light: it rocks more
  off.xz += sw*amt; off.y -= 0.35*amt*dot(sw, sw)*0.5;
  float fade = 1.0 - smoothstep(uCull*0.72, uCull, length(base - cameraPosition));
  vec3 rr = rwRings(base.xz);
  vec3 wp = base + off*fade; wp.y += rr.x*0.85; wp.xz -= rr.yz*max(off.y, 0.0)*0.5*fade;
  vW = wp; vN = normal; vF = aF; vSick = aB.w; vUp = off.y; vOut = length(off.xz);
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`;
const GROW_FS = /* glsl */`
${RW_GLSL}
varying vec3 vW, vN; varying vec4 vF; varying float vSick, vUp, vOut;
void main(){
  vec3 n = normalize(vN + vec3(0.0, 1e-5, 0.0)); if (!gl_FrontFacing) n = -n;
  vec3 vv = cameraPosition - vW; float dist = length(vv); vec3 v = vv/max(dist, 1e-3);
  float seed = fract(vF.z);
  float sick = smoothstep(0.46, 0.6, vSick + (seed - 0.5)*0.3);
  // dark in the plant's heart and near its foot, open at its tips; an underside or an inner face is darker still
  float ao = (0.38 + 0.62*smoothstep(-0.1, 1.3, vUp))*(0.62 + 0.38*smoothstep(0.1, 1.1, clamp(vOut, 0.0, 4.0)))*(gl_FrontFacing ? 1.0 : 0.7);
  // a pad is a thick body: no light comes through its middle, a little at its rim (the rim of afterglow)
  float thin = clamp(vF.x, 0.0, 1.0);
  vec3 col = rwWeed(n, v, thin*thin*thin*0.5 + 0.02, sick, ao)*mix(1.0, vF.w, 0.55);
  // lit from low ahead, with no sun: looked down on, or seen away from the glow, the growth is a deep wine like the
  // mat it stands in; it is carmine where the eye skims it toward the afterglow
  float toward = clamp(dot(-v, uKeyDir), 0.0, 1.0);
  col *= mix(1.0, mix(0.66, 0.8, sick), smoothstep(0.06, 0.42, clamp(v.y, 0.0, 1.0)))*mix(mix(0.7, 0.84, sick), 1.0, toward*toward);
  float fr = 1.0 - abs(dot(n, v));
  col += rwSky(reflect(-v, n))*(0.015 + 0.1*fr*fr*fr)*ao;
  gl_FragColor = vec4(rwAir(col, vW, cameraPosition), 1.0);
}`;

export async function makeGrowth(ctx, U, o) {
  // o.shapes: the shapes of an earlier makeGrowth, used again; else o.rng: the seeded stream the shapes are grown from
  const V = o.shapes || buildVariants(o.rng); await ctx.yield();
  const chunkZ = o.chunkZ ?? 90, chunks = new Map();
  for (const pl of o.plants) { const k = Math.floor(pl.z / chunkZ); if (!chunks.has(k)) chunks.set(k, []); chunks.get(k).push(pl); }
  const uniforms = withShared(U, { uRing: o.ring || { value: [0, 1, 2, 3, 4, 5, 6, 7].map(() => new THREE.Vector4(0, 0, -1, 0)) }, uCull: { value: o.cull ?? 280 } });
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: GROW_VS, fragmentShader: GROW_FS, side: THREE.DoubleSide });
  const group = new THREE.Group(), meshes = []; let triangles = 0;
  for (const [, list] of chunks) {
    let nv = 0, ni = 0; for (const pl of list) { nv += V[pl.v].count; ni += V[pl.v].i.length; }
    const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), F = new Float32Array(nv * 4), B = new Float32Array(nv * 4), I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let vo = 0, io = 0, cx = 0, cz = 0, done = 0;
    for (const pl of list) {
      const g = V[pl.v], c = Math.cos(pl.rot), s = Math.sin(pl.rot), sc = pl.s * (1 - 0.3 * pl.sick), sy = sc * (1 - 0.3 * pl.sick), lx = (pl.lean || 0) * Math.cos(pl.rot * 3.1), lz = (pl.lean || 0) * Math.sin(pl.rot * 3.1);
      for (let k = 0; k < g.count; k++) {
        const x = g.p[k * 3], y = g.p[k * 3 + 1], z = g.p[k * 3 + 2], nx = g.n[k * 3], ny = g.n[k * 3 + 1], nz = g.n[k * 3 + 2], q = (vo + k) * 3, q4 = (vo + k) * 4;
        P[q] = pl.x + (c * x + s * z) * sc + lx * y * sy; P[q + 1] = pl.y + y * sy; P[q + 2] = pl.z + (-s * x + c * z) * sc + lz * y * sy;
        N[q] = c * nx + s * nz; N[q + 1] = ny; N[q + 2] = -s * nx + c * nz;
        F[q4] = g.f[k * 4]; F[q4 + 1] = g.f[k * 4 + 1]; F[q4 + 2] = Math.floor(g.f[k * 4 + 2]) + ((g.f[k * 4 + 2] + pl.seed) % 1); F[q4 + 3] = g.f[k * 4 + 3] * (0.85 + 0.3 * pl.seed);
        B[q4] = pl.x; B[q4 + 1] = pl.y; B[q4 + 2] = pl.z; B[q4 + 3] = pl.sick;
      }
      for (let k = 0; k < g.i.length; k++) I[io + k] = g.i[k] + vo;
      vo += g.count; io += g.i.length; cx += pl.x; cz += pl.z;
      if (++done % 220 === 0) await ctx.yield();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(N, 3)); geo.setAttribute('aF', new THREE.BufferAttribute(F, 4)); geo.setAttribute('aB', new THREE.BufferAttribute(B, 4));
    geo.setIndex(new THREE.BufferAttribute(I, 1));
    cx /= list.length; cz /= list.length; let rad = 0; for (const pl of list) rad = Math.max(rad, Math.hypot(pl.x - cx, pl.z - cz));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, 2, cz), rad + 8);
    const mesh = new THREE.Mesh(geo, mat); group.add(mesh); meshes.push(mesh); triangles += ni / 3;
    await ctx.yield();
  }
  const cull = o.cull ?? 280;
  return { object: group, uniforms, triangles, meshes, shapes: V,
    update(camera) { const e = camera.matrixWorld.elements; for (const m of meshes) { const s = m.geometry.boundingSphere; m.visible = Math.hypot(s.center.x - e[12], s.center.z - e[14]) < cull + s.radius; } } };
}

// ---------------------------------------------------------------- curtains
const CURT_VS = /* glsl */`
${RW_GLSL}
attribute vec4 aC;            // along 0..1, side -1..1, length, width
attribute vec4 aD;            // outward x, z, phase, sickness
varying vec3 vW, vN; varying vec4 vC; varying vec2 vD;
void main(){
  float s = aC.x, L = aC.z, ph = aD.z*40.0;
  vec3 o3 = vec3(aD.x, 0.0, aD.y), t3 = vec3(-aD.y, 0.0, aD.x);
  float lob = 0.42 + 0.58*abs(sin(s*L*1.45 + ph)) + 0.12*sin(s*L*4.1 + ph*3.0);
  float w = aC.w*lob*(1.0 - 0.85*s*s*s);
  float s2 = s*s;
  float swO = s2*L*(0.05*sin(uTime*0.72 + ph + s*2.2) + 0.022*sin(uTime*1.37 + ph*1.7 + s*5.0));
  float swT = s2*L*0.035*sin(uTime*0.53 + ph*0.6 + s*3.1);
  float tw = 0.9*sin(ph*2.3 + s*L*0.55) + 0.25*sin(uTime*0.4 + ph);                     // a frond turns a little down its length
  vec3 e3 = t3*cos(tw) + o3*sin(tw), f3 = o3*cos(tw) - t3*sin(tw);
  vec3 p = position + vec3(0.0, -1.0, 0.0)*s*L*(1.0 - 0.04*abs(swO)) + e3*(aC.y*w*0.5) + t3*(swT + 0.12*L*sin(ph*5.0)*s2) + o3*(swO + 0.05*L*s*(1.0 - s));
  vW = p; vN = normalize(f3 + e3*aC.y*0.55 + vec3(0.0, 0.25, 0.0)); vC = aC; vD = aD.zw;
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0);
}`;
const CURT_FS = /* glsl */`
${RW_GLSL}
varying vec3 vW, vN; varying vec4 vC; varying vec2 vD;
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 vv = cameraPosition - vW; float dist = length(vv); vec3 v = vv/max(dist, 1e-3);
  float s = vC.x, L = vC.z, lobe = floor(s*L*1.45/3.14159 + vD.x*7.0);
  float tone = 0.8 + 0.4*rwH(vec2(lobe, vD.x*91.0));
  float mid = 1.0 - abs(vC.y);
  float sick = smoothstep(0.46, 0.6, vD.y + (rwH(vec2(lobe, 3.0)) - 0.5)*0.35);
  // thick down the middle rib and where fronds overlap, thin toward the lobes' edges
  float layers = 0.55 + 0.45*rwN(vec2(vC.y*2.2 + vD.x*40.0, s*L*1.3));
  float ed = clamp(abs(vC.y), 0.0, 1.0);
  float thin = clamp((0.06 + 0.94*ed*ed)*layers, 0.0, 1.0);
  float rib = 0.72 + 0.28*smoothstep(0.02, 0.16, ed);
  vec3 col = rwWeed(n, v, thin, sick, 0.4 + 0.6*s)*tone*rib;
  gl_FragColor = vec4(rwAir(col, vW, cameraPosition), 1.0);
}`;
export function makeCurtains(U, hangs, o = {}) {
  const SEG = o.seg ?? 10, n = hangs.length, P = new Float32Array(n * (SEG + 1) * 2 * 3), Cc = new Float32Array(n * (SEG + 1) * 2 * 4), D = new Float32Array(n * (SEG + 1) * 2 * 4), I = [];
  let v = 0;
  for (let h = 0; h < n; h++) {
    const a = hangs[h], ph = (h * 0.6180339 + (o.phase || 0)) % 1, b = v;
    for (let k = 0; k <= SEG; k++) for (const sd of [-1, 1]) {
      P[v * 3] = a[0]; P[v * 3 + 1] = a[1]; P[v * 3 + 2] = a[2];
      Cc[v * 4] = k / SEG; Cc[v * 4 + 1] = sd; Cc[v * 4 + 2] = a[3]; Cc[v * 4 + 3] = a[6] ?? 0.8;
      D[v * 4] = a[4]; D[v * 4 + 1] = a[5]; D[v * 4 + 2] = ph; D[v * 4 + 3] = o.sick ?? 0; v++;
    }
    for (let k = 0; k < SEG; k++) { const q = b + k * 2; I.push(q, q + 1, q + 3, q, q + 3, q + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aC', new THREE.BufferAttribute(Cc, 4)); g.setAttribute('aD', new THREE.BufferAttribute(D, 4)); g.setIndex(I);
  g.computeBoundingSphere(); g.boundingSphere.radius += 10;
  const uniforms = withShared(U, {});
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: CURT_VS, fragmentShader: CURT_FS, side: THREE.DoubleSide }));
  return { object: mesh, uniforms, triangles: I.length / 3 };
}

// ---------------------------------------------------------------- the dead growth breaks up
// Flakes leave each bleached plant, are taken by the wind, tumble and sink, and are gone: each flake's whole way is
// a function of the clock and of its plant, so the air downwind of a dead thicket is plainly that thicket's dust.
const CRUMB_VS = /* glsl */`
${RW_GLSL}
uniform vec2 uWind;
attribute vec4 aO;            // where it leaves the plant (xyz), its own number
attribute vec4 aQ;            // corner x, y; lifetime (s); size (m)
varying vec2 vUv; varying vec3 vW; varying float vA;
void main(){
  float seed = aO.w, life = max(aQ.z, 1.0), tt = uTime/life + seed*7.31, cyc = floor(tt), a = fract(tt), t = a*life;
  float r1 = rwH(vec2(seed*91.7, cyc)), r2 = rwH(vec2(cyc, seed*53.1));
  vec3 p = aO.xyz + vec3((r1 - 0.5)*0.9, (r2 - 0.5)*0.7, (r1*r2 - 0.25)*1.2);
  float taken = t*t/(t + 0.8);                                             // it lets go slowly, then the wind has it
  p += vec3(uWind.x, 0.0, uWind.y)*taken*(0.7 + 0.6*r2) + vec3(sin(t*2.3 + seed*20.0)*0.16*t, 0.22*sin(t*1.7 + seed*40.0) - 0.2*t, cos(t*1.9 + seed*33.0)*0.16*t);
  vec4 mv = viewMatrix*vec4(p, 1.0);
  float size = max(aQ.w*(1.0 - 0.45*a), 1.1*uPx*max(-mv.z, 0.1));
  float rot = t*(2.0 + 3.0*r1) + seed*50.0;
  vec2 c = vec2(aQ.x*cos(rot) - aQ.y*sin(rot), aQ.x*sin(rot) + aQ.y*cos(rot));
  mv.xy += c*size*vec2(1.0, 0.4 + 0.6*abs(sin(t*3.1 + seed*9.0)));          // a flat flake turning: broad, then edge on
  vUv = aQ.xy; vW = p; vA = smoothstep(0.0, 0.06, a)*(1.0 - smoothstep(0.72, 1.0, a));
  gl_Position = projectionMatrix*mv;
}`;
const CRUMB_FS = /* glsl */`
${RW_GLSL}
varying vec2 vUv; varying vec3 vW; varying float vA;
void main(){
  float r = max(abs(vUv.x), abs(vUv.y)) + 0.35*abs(vUv.x*vUv.y);
  float a = vA*(1.0 - smoothstep(0.7, 1.0, r));
  vec3 col = mix(uWeedSD, uWeedS, 0.8) + 0.25*uSkyRose*clamp(dot(normalize(vW - cameraPosition), uKeyDir), 0.0, 1.0);
  gl_FragColor = vec4(rwAir(col, vW, cameraPosition), a);
}`;
export function makeCrumble(U, plants, o = {}) {
  const per = o.per ?? 6, n = plants.length * per, P = new Float32Array(n * 12), O = new Float32Array(n * 16), Q = new Float32Array(n * 16), I = new Uint32Array(n * 6), H = o.heights || [4, 3, 2, 1.2, 3.4];
  const hash = (a) => { const s = Math.sin(a * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  for (let k = 0; k < n; k++) {
    const pl = plants[Math.floor(k / per)], seed = hash(k + pl.seed * 17), top = H[pl.v] * pl.s * (1 - 0.3 * pl.sick) * (1 - 0.3 * pl.sick), cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let c = 0; c < 4; c++) {
      const q = k * 4 + c; P[q * 3] = pl.x; P[q * 3 + 1] = pl.y; P[q * 3 + 2] = pl.z;
      O.set([pl.x, pl.y + top * (0.35 + 0.6 * hash(k * 3.7 + 1)), pl.z, seed], q * 4); Q.set([cs[c][0], cs[c][1], 4.5 + 5 * hash(k * 1.3 + 5), 0.035 + 0.075 * hash(k * 2.1 + 9)], q * 4);
    }
    I.set([k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3], k * 6);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aO', new THREE.BufferAttribute(O, 4)); g.setAttribute('aQ', new THREE.BufferAttribute(Q, 4)); g.setIndex(new THREE.BufferAttribute(I, 1));
  if (n) { g.computeBoundingSphere(); g.boundingSphere.radius += 30; } else g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);
  const uniforms = withShared(U, { uWind: { value: new THREE.Vector2(...(o.wind || [1.5, 0.45])) } });
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: CRUMB_VS, fragmentShader: CRUMB_FS, transparent: true, depthWrite: false }));
  mesh.renderOrder = 5;
  return { object: mesh, uniforms, triangles: n * 2 };
}

// ---------------------------------------------------------------- the small things of dry ground
// Tussocks of dry grass, stones, dead stems of the weed, pale flowers: real shapes standing on the ground, each
// a few flat faces, so they are as sharp on a slope as on the level and from any side. The one pattern painted
// on them (a grain) is read from each point's own place in the world's metres on all three axes: nothing here is
// laid down from above. items: [{ x, y, z, k, s, rot, seed, col, col2 }], k 0 tussock, 1 stone, 2 dead stem,
// 3 flowers; col and col2 are daylight colours [r, g, b].
const LIT_VS = /* glsl */`
${RW_GLSL}
attribute vec3 aCol;
attribute vec4 aB;            // the thing's foot (xyz) and how far this corner rocks in the wind, m
varying vec3 vW, vN, vCol;
void main(){
  float ph = aB.x*0.19 + aB.z*0.13;
  float gust = 0.6 + 0.4*sin(uTime*0.33 - aB.x*0.045 - aB.z*0.03);
  vec2 sw = vec2(sin(uTime*0.78 + ph), sin(uTime*0.61 + ph*1.7 + 1.3))*gust;
  vec3 wp = position; wp.xz += sw*aB.w;
  vW = wp; vN = normal; vCol = aCol;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`;
const LIT_FS = /* glsl */`
${RW_GLSL}
varying vec3 vW, vN, vCol;
void main(){
  vec3 n = normalize(vN + vec3(0.0, 1e-5, 0.0));
  float dist = length(cameraPosition - vW);
  float grain = 0.5 + (rwN3(vW*4.3) - 0.5)*0.6 + (rwN3(vW*17.0 + 7.0) - 0.5)*0.4*(1.0 - smoothstep(4.0, 14.0, dist));
  vec3 col = vCol*(0.75 + 0.5*grain)*(uKeyCol*clamp(dot(n, uKeyDir)*0.8 + 0.2, 0.0, 1.0) + rwAmb(n)*1.5);
  gl_FragColor = vec4(rwAir(col, vW, cameraPosition), 1.0);
}`;
export async function makeLitter(ctx, U, items) {
  const P = [], N = [], Cc = [], B = [], V3 = () => new THREE.Vector3(), a = V3(), b = V3(), c = V3(), d = V3(), n = V3(), e = V3(), mid = V3();
  let it = null, done = 0;
  const hash = (i) => { const s = Math.sin((it.seed + 1) * 127.1 + i * 311.7) * 43758.5453; return s - Math.floor(s); };
  const put = (p, col, k, sway) => { P.push(it.x + p.x, it.y + p.y, it.z + p.z); N.push(n.x, n.y, n.z); Cc.push(col[0] * k, col[1] * k, col[2] * k); B.push(it.x, it.y, it.z, sway); };
  // one flat face. lit: 0 = by its own facing, turned outward from `mid`; 1 = `n` as given (a blade or a petal
  // is lit as the ground it stands on, the same from both sides)
  const face = (p0, p1, p2, col, k0, k1, k2, s2, lit) => {
    if (!lit) { n.subVectors(p1, p0).cross(e.subVectors(p2, p0)).normalize(); if (n.dot(e.copy(p0).add(p1).add(p2).multiplyScalar(1 / 3).sub(mid)) < 0) n.negate(); }
    put(p0, col, k0, 0); put(p1, col, k1, 0); put(p2, col, k2, s2);
  };
  for (it of items) {
    const s = it.s, rot = it.rot;
    if (it.k === 0) {
      const blades = 5 + Math.floor(hash(1) * 3);
      for (let i = 0; i < blades; i++) {
        const az = rot + i * 2.399 + hash(10 + i) * 0.8, lean = 0.2 + 0.75 * hash(20 + i), L = s * (0.55 + 0.6 * hash(30 + i)), w = 0.11 * s, ca = Math.cos(az), sa = Math.sin(az);
        a.set(ca * 0.07 * s - sa * w, -0.05, sa * 0.07 * s + ca * w); b.set(ca * 0.07 * s + sa * w, -0.05, sa * 0.07 * s - ca * w); c.set(ca * Math.sin(lean) * L, Math.cos(lean) * L, sa * Math.sin(lean) * L);
        n.set(ca * 0.45, 0.89, sa * 0.45); face(a, b, c, it.col, 0.4, 0.4, 0.95 + 0.25 * hash(40 + i), 0.05 * L, 1);
      }
    } else if (it.k === 1) {
      const hgt = s * (0.35 + 0.4 * hash(1)), ring = [], top = [];
      for (let i = 0; i < 4; i++) { const az = rot + i * 1.5708 + (hash(10 + i) - 0.5) * 0.7, rr = s * 0.5 * (0.7 + 0.6 * hash(20 + i));
        ring.push(V3().set(Math.cos(az) * rr, -0.07 * s, Math.sin(az) * rr)); top.push(V3().set(Math.cos(az + 0.3) * rr * 0.55, hgt * (0.7 + 0.3 * hash(30 + i)), Math.sin(az + 0.3) * rr * 0.55)); }
      mid.set(0, hgt * 0.3, 0);
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4, k = 0.78 + 0.4 * hash(40 + i); face(ring[i], ring[j], top[j], it.col, k * 0.8, k * 0.8, k, 0, 0); face(ring[i], top[j], top[i], it.col, k * 0.8, k, k, 0, 0); }
      face(top[0], top[1], top[2], it.col, 1.1, 1.1, 1.1, 0, 0); face(top[0], top[2], top[3], it.col, 1.1, 1.1, 1.1, 0, 0);
    } else if (it.k === 2) {
      const H = s * (0.8 + 0.7 * hash(1)), lean = 0.1 + 0.35 * hash(2), tx = Math.cos(rot) * Math.sin(lean) * H, ty = Math.cos(lean) * H, tz = Math.sin(rot) * Math.sin(lean) * H, w = 0.03 + 0.025 * s;
      for (let q = 0; q < 2; q++) { const ca = Math.cos(rot + q * 1.5708), sa = Math.sin(rot + q * 1.5708);
        a.set(-ca * w, -0.05, -sa * w); b.set(ca * w, -0.05, sa * w); c.set(tx, ty, tz); n.set(-sa * 0.6, 0.8, ca * 0.6); face(a, b, c, it.col, 0.5, 0.5, 0.8, 0.04 * H, 1); }
      for (let i = 0; i < 3; i++) { const t = [0.5, 0.78, 1][i] - 0.08 * hash(10 + i), az = rot + 1 + i * 2.2 + hash(20 + i), pw = s * (0.1 + 0.08 * hash(30 + i)), pl = s * (0.15 + 0.1 * hash(40 + i)), k = 0.85 + 0.3 * hash(50 + i), sw = 0.04 * H * t;
        mid.set(tx * t, ty * t, tz * t); e.set(Math.cos(az) * pw, 0, Math.sin(az) * pw); d.set(-Math.sin(az) * 0.5 * pl, 0.86 * pl, Math.cos(az) * 0.5 * pl);
        a.copy(mid).sub(e); b.copy(mid).add(d); c.copy(mid).add(e); n.set(Math.sin(az) * 0.6, 0.5, -Math.cos(az) * 0.6).normalize(); put(a, it.col2, k, sw); put(c, it.col2, k, sw); put(b, it.col2, k * 1.1, sw);
        b.copy(mid).sub(d); put(a, it.col2, k, sw); put(b, it.col2, k * 0.8, sw); put(c, it.col2, k, sw); }
    } else {
      for (let i = 0; i < 3; i++) { const az = rot + i * 2.1 + hash(10 + i), r0 = s * 0.2 * (0.3 + hash(20 + i)), H = s * (0.22 + 0.2 * hash(30 + i)), hx = Math.cos(az) * r0, hz = Math.sin(az) * r0, w = s * (0.06 + 0.03 * hash(40 + i)), sw = 0.05 * H;
        n.set(0, 1, 0); a.set(hx * 0.3 - 0.015, -0.04, hz * 0.3); b.set(hx * 0.3 + 0.015, -0.04, hz * 0.3); c.set(hx, H, hz); face(a, b, c, it.col2, 0.6, 0.6, 1, sw, 1);
        mid.set(hx, H, hz); e.set(Math.cos(az + 0.8) * w, 0.2 * w, Math.sin(az + 0.8) * w); d.set(-Math.sin(az + 0.8) * w, 0.2 * w, Math.cos(az + 0.8) * w);
        a.copy(mid).sub(e); b.copy(mid).add(d); c.copy(mid).add(e); put(a, it.col, 1, sw); put(b, it.col, 1, sw); put(c, it.col, 1, sw);
        b.copy(mid).sub(d); put(a, it.col, 1, sw); put(c, it.col, 1, sw); put(b, it.col, 1, sw); }
    }
    if (++done % 300 === 0) await ctx.yield();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(Cc), 3)); g.setAttribute('aB', new THREE.BufferAttribute(new Float32Array(B), 4));
  if (items.length) { g.computeBoundingSphere(); g.boundingSphere.radius += 1; } else g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);
  await ctx.yield();
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: withShared(U), vertexShader: LIT_VS, fragmentShader: LIT_FS, side: THREE.DoubleSide }));
  return { object: mesh, triangles: P.length / 9 };
}
