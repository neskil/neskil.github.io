// Hero for "Where Ships Go to Live": the liner as main street. 290 m of rust-red hull standing upright on the mud,
// cut clean through amidships by a round-headed arch (16 m wide, 16 m high) with the portal seat at mid-beam,
// terraces of banana and marigold above, lifeboat balconies, two smoking funnels, two dressed masts, zigzag stairs,
// and in the square before the south flank a 7 m bronze propeller turning in its basin.
// Frame: origin at the keel centre on the mud, bow +X (east), the south flank (the front) facing +Z.
import * as THREE from 'three';
import * as fx from '../kit/fx.js';

export const SUN = new THREE.Vector3(0.887, 0.292, 0.358).normalize();
const col = (h) => new THREE.Color(h);
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V1 = new THREE.Vector3(), V2 = new THREE.Vector3();
export const trs = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => M4.compose(V1.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), V2.set(sx, sy, sz));

// One block of memory for a world's merged geometry, handed out front to back and never taken back. The big bags draw their
// pieces and their finished arrays from it, so loading asks the browser for memory once instead of several thousand times:
// every new typed array counts toward the collector's budget, and that many of them set off a full collection every few megabytes,
// each one a pause in the world on screen. Fresh memory is zero and only becomes real as it is written. When the block cannot
// be had, or runs out, a piece is an ordinary array, exactly as before.
export function makeArena(bytes) {
  let buf = null, off = 0; try { buf = new ArrayBuffer(bytes); } catch (e) { buf = null; }
  return { f32(n) { const b = n * 4; if (buf && off + b <= bytes) { const a = new Float32Array(buf, off, n); off += b; return a; } return new Float32Array(n); },
    // an unbroken run of n numbers for one list that knows roughly how long it will get (null when the block cannot hold it)
    run(n) { const b = n * 4; if (buf && off + b <= bytes) { const a = new Float32Array(buf, off, n); off += b; return a; } return null; } };
}
// the same geometry as a bag's build(), filled a slice at a time with a yield between slices, so no long step while loading
async function fillSteps(ctx, list) {
  const g = new THREE.BufferGeometry();
  for (const [name, src, size] of list) {
    await ctx.yield();
    const w = src.whole(); if (w) { g.setAttribute(name, new THREE.BufferAttribute(w, size)); continue; }   // written in place in one run: it is the finished array, nothing to copy
    const a = src.alloc(src.length); let off = 0, k = 0;
    await ctx.yield();                                                          // the big array is made in a stretch of its own
    for (const ch of src.chunks()) { a.set(ch, off); off += ch.length; if (++k % 32 === 0) await ctx.yield(); }   // half a megabyte at a time
    g.setAttribute(name, new THREE.BufferAttribute(a, size)); await ctx.yield();
  }
  return g;
}
// a growing list of numbers kept in small typed pieces: a plain array of millions of numbers stalls the page each time it has to grow
// (pieces of 16 KB: a new piece is new memory, and a big one is a pause of its own where memory is slow to arrive)
// With a cap (and a block to take it from) the list is one unbroken run of the block, written front to back and handed over as it stands:
// the memory is touched once and never copied. Past the cap it carries on in pieces, as a list without a cap does from the start.
function nums(arena, cap = 0) {
  const CH = 4096, done = [], mk = arena ? (k) => arena.f32(k) : (k) => new Float32Array(k), run = arena && cap ? arena.run(cap) : null;
  let cur = run || mk(CH), lim = run ? cap : CH, n = 0, total = 0;
  const next = () => { done.push(cur.subarray(0, n)); total += n; cur = mk(CH); lim = CH; n = 0; };
  return {
    alloc: mk,
    whole() { return run && done.length === 0 ? run.subarray(0, n) : null; },
    push(a, b, c) { if (n + 3 > lim) next(); cur[n++] = a; if (b !== undefined) { cur[n++] = b; if (c !== undefined) cur[n++] = c; } },
    // for a loop that writes many numbers: fit(k) says how many groups of k numbers the piece in hand still takes (a new piece if none),
    // arr() and pos() are where to write them, took(m) says that m numbers were written
    fit(k) { if (n + k > lim) next(); return ((lim - n) / k) | 0; },
    arr() { return cur; }, pos() { return n; }, took(m) { n += m; },
    get length() { return total + n; },
    chunks() { return [...done, cur.subarray(0, n)]; },
    flat() { const w = this.whole(); if (w) return w; const a = new Float32Array(total + n); let off = 0; for (const ch of this.chunks()) { a.set(ch, off); off += ch.length; } return a; },
  };
}
// ---- merge helper: static geometry with vertex colours (and optional uv into a mural canvas) ----
export function makeBag(arena, nv = 0) {                                           // nv: about the most vertices it will hold (0: unknown)
  const P = nums(arena, nv * 3), N = nums(arena, nv * 3), C = nums(arena, nv * 3), U = nums(arena, nv * 2);
  const v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3();
  const plainAttr = (a) => a.isBufferAttribute === true && a.isInterleavedBufferAttribute !== true && !a.normalized;
  const put = (g, m, c, keepUv, i0, i1) => {
    const p = g.attributes.position, nn = g.attributes.normal, uu = g.attributes.uv, cc = g.attributes.color;
    nm.getNormalMatrix(m);
    if (plainAttr(p) && plainAttr(nn) && (!uu || plainAttr(uu)) && (!cc || plainAttr(cc))) {
      // the same sums as the loop below (Vector3.applyMatrix4, applyMatrix3, length), written out on the arrays themselves:
      // no call and no boxed number for each coordinate, and the same numbers to the last bit
      const e = m.elements, e0 = e[0], e1 = e[1], e2 = e[2], e3 = e[3], e4 = e[4], e5 = e[5], e6 = e[6], e7 = e[7], e8 = e[8], e9 = e[9], e10 = e[10], e11 = e[11], e12 = e[12], e13 = e[13], e14 = e[14], e15 = e[15];
      const r = nm.elements, r0 = r[0], r1 = r[1], r2 = r[2], r3 = r[3], r4 = r[4], r5 = r[5], r6 = r[6], r7 = r[7], r8 = r[8];
      const pa = p.array, ps = p.itemSize, na = nn.array, ns = nn.itemSize, ca = cc ? cc.array : null, cs = cc ? cc.itemSize : 0, useUv = !!(keepUv && uu), ua = useUv ? uu.array : null, us = useUv ? uu.itemSize : 0;
      const cr = c.r, cg = c.g, cb = c.b, kl = !!(keepUv && keepUv.length), k0 = kl ? keepUv[0] : 0, k1 = kl ? keepUv[1] : 0, k2 = kl ? keepUv[2] : 0, k3 = kl ? keepUv[3] : 0;
      let i = i0;
      while (i < i1) {
        const cnt = Math.min(i1 - i, P.fit(3), N.fit(3), C.fit(3), U.fit(2)), Pa = P.arr(), Na = N.arr(), Ca = C.arr(), Ua = U.arr();
        let po = P.pos(), no = N.pos(), co = C.pos(), uo = U.pos();
        for (let k = 0; k < cnt; k++, i++) {
          const x = pa[i * ps], y = pa[i * ps + 1], z = pa[i * ps + 2], w = 1 / (e3 * x + e7 * y + e11 * z + e15);
          Pa[po] = (e0 * x + e4 * y + e8 * z + e12) * w; Pa[po + 1] = (e1 * x + e5 * y + e9 * z + e13) * w; Pa[po + 2] = (e2 * x + e6 * y + e10 * z + e14) * w; po += 3;
          const a = na[i * ns], b = na[i * ns + 1], d = na[i * ns + 2], nx = r0 * a + r3 * b + r6 * d, ny = r1 * a + r4 * b + r7 * d, nz = r2 * a + r5 * b + r8 * d, l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
          Na[no] = nx / l; Na[no + 1] = ny / l; Na[no + 2] = nz / l; no += 3;
          if (ca) { Ca[co] = ca[i * cs] * cr; Ca[co + 1] = ca[i * cs + 1] * cg; Ca[co + 2] = ca[i * cs + 2] * cb; } else { Ca[co] = cr; Ca[co + 1] = cg; Ca[co + 2] = cb; } co += 3;
          if (useUv) { if (kl) { Ua[uo] = k0 + ua[i * us] * (k2 - k0); Ua[uo + 1] = k1 + ua[i * us + 1] * (k3 - k1); } else { Ua[uo] = ua[i * us]; Ua[uo + 1] = ua[i * us + 1]; } } else { Ua[uo] = 0.001; Ua[uo + 1] = 0.001; } uo += 2;
        }
        P.took(cnt * 3); N.took(cnt * 3); C.took(cnt * 3); U.took(cnt * 2);
      }
      return;
    }
    for (let i = i0; i < i1; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(m); P.push(v.x, v.y, v.z);
      n.fromBufferAttribute(nn, i).applyMatrix3(nm); const l = n.length() || 1; N.push(n.x / l, n.y / l, n.z / l);
      if (cc) C.push(cc.getX(i) * c.r, cc.getY(i) * c.g, cc.getZ(i) * c.b); else C.push(c.r, c.g, c.b);
      if (keepUv && uu) { if (keepUv.length) U.push(keepUv[0] + uu.getX(i) * (keepUv[2] - keepUv[0]), keepUv[1] + uu.getY(i) * (keepUv[3] - keepUv[1])); else U.push(uu.getX(i), uu.getY(i)); } else U.push(0.001, 0.001);
    }
  };
  return {
    add(geo, m, c, keepUv = false) {
      const g = geo.index ? geo.toNonIndexed() : geo;
      put(g, m, c, keepUv, 0, g.attributes.position.count);
      if (g !== geo) g.dispose();
    },
    // the same as add(), a slice of vertices at a time with a yield between slices (the big lofted hulls); the matrix is copied first
    async addSteps(ctx, geo, m0, c, keepUv = false, every = 200) {
      const m = m0.clone(), g = geo.index ? geo.toNonIndexed() : geo, cnt = g.attributes.position.count;
      await ctx.yield();
      for (let i = 0; i < cnt; i += every) { put(g, m, c, keepUv, i, Math.min(cnt, i + every)); await ctx.yield(); }
      if (g !== geo) g.dispose();
    },
    box(x, y, z, sx, sy, sz, c, rx = 0, ry = 0, rz = 0) { this.add(BOX, trs(x, y, z, rx, ry, rz, sx, sy, sz), c); },
    // a quad a-b-c-d given as points already in place, with one normal (planking laid over a lofted deck)
    quad(a, b, c2, d, n, c) { for (let k = 0; k < 6; k++) { const p = k === 0 ? a : k === 1 || k === 3 ? b : k === 4 ? c2 : d; P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(c.r, c.g, c.b); U.push(0.001, 0.001); } },
    get triangles() { return P.length / 9; },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P.flat(), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(N.flat(), 3));
      g.setAttribute('color', new THREE.BufferAttribute(C.flat(), 3));
      g.setAttribute('uv', new THREE.BufferAttribute(U.flat(), 2));
      return g;
    },
    buildSteps(ctx) { return fillSteps(ctx, [['position', P, 3], ['normal', N, 3], ['color', C, 3], ['uv', U, 2]]); },
  };
}
const BOX = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();   // expanded once (the bag would expand it at every box)

// ---- lofted ship hull: long axis X, bow +X, keel y 0, deck at D (plus sheer). Returns painted sides and a deck. ----
// Written straight into typed arrays and handed back already expanded (three vertices a triangle) with smooth normals: the same numbers
// as an indexed loft through computeVertexNormals and toNonIndexed, without the lists, the index and the copies those make.
let HG = { p: new Float32Array(4096), n: new Float32Array(4096), u: new Float32Array(4096), i: new Uint32Array(4096) };
const hgRoom = (nv, ni) => { if (HG.p.length < nv * 3) { HG.p = new Float32Array(nv * 3); HG.n = new Float32Array(nv * 3); HG.u = new Float32Array(nv * 2); } if (HG.i.length < ni) HG.i = new Uint32Array(ni); };
function hgExpand(nv, ni, withUv) {                                                 // normals summed over each vertex's triangles (in single precision, as three does), then one vertex per index
  const P = HG.p, N = HG.n, U = HG.u, I = HG.i; N.fill(0, 0, nv * 3);
  for (let k = 0; k < ni; k += 3) { const a = I[k] * 3, b = I[k + 1] * 3, c = I[k + 2] * 3;
    const cx = P[c] - P[b], cy = P[c + 1] - P[b + 1], cz = P[c + 2] - P[b + 2], ax = P[a] - P[b], ay = P[a + 1] - P[b + 1], az = P[a + 2] - P[b + 2];
    const x = cy * az - cz * ay, y = cz * ax - cx * az, z = cx * ay - cy * ax;
    N[a] += x; N[a + 1] += y; N[a + 2] += z; N[b] += x; N[b + 1] += y; N[b + 2] += z; N[c] += x; N[c + 1] += y; N[c + 2] += z; }
  for (let v = 0; v < nv * 3; v += 3) { const x = N[v], y = N[v + 1], z = N[v + 2], k = 1 / (Math.sqrt(x * x + y * y + z * z) || 1); N[v] = x * k; N[v + 1] = y * k; N[v + 2] = z * k; }
  const op = new Float32Array(ni * 3), on = new Float32Array(ni * 3), ou = withUv ? new Float32Array(ni * 2) : null;
  for (let k = 0; k < ni; k++) { const v = I[k], v3 = v * 3, k3 = k * 3; op[k3] = P[v3]; op[k3 + 1] = P[v3 + 1]; op[k3 + 2] = P[v3 + 2]; on[k3] = N[v3]; on[k3 + 1] = N[v3 + 1]; on[k3 + 2] = N[v3 + 2]; if (ou) { ou[k * 2] = U[v * 2]; ou[k * 2 + 1] = U[v * 2 + 1]; } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(op, 3)); g.setAttribute('normal', new THREE.BufferAttribute(on, 3)); if (ou) g.setAttribute('uv', new THREE.BufferAttribute(ou, 2));
  return g;
}
export function hullGeometry(o) {
  const { L, B, D, sheer = 0.05, x0 = -0.5, x1 = 0.5, stations = 20, ring = 8, box = 5, rake = 0.5, uv = [0, 0, 1, 1], capA = true, capB = false } = o;
  const row = ring + 1, caps = (capA ? 1 : 0) + (capB ? 1 : 0), nvS = 2 * (stations + 1) * row + caps * 2 * row, niS = 2 * stations * ring * 6 + caps * ring * 6;
  hgRoom(Math.max(nvS, 2 * (stations + 1)), Math.max(niS, stations * 6));
  let P = HG.p, U = HG.u, I = HG.i, np = 0, ni = 0;
  const half = (s, t) => {
    const bt = Math.min(1, Math.max(0, (s - 0.2) / 0.3)), st = Math.min(1, Math.max(0, (-s - 0.3) / 0.2));
    const w = Math.max(0.04, B / 2 * (1 - Math.pow(bt, 1.8)) * (1 - 0.45 * st * st));
    const n = Math.max(1.15, box - (box - 1.15) * Math.min(1, bt * 1.1) - (box - 2.2) * st);
    return w * Math.pow(Math.max(0, 1 - Math.pow(1 - t, n)), 1 / n);
  };
  const pt = (s, t, sg, capU = -1) => {
    const bt = Math.min(1, Math.max(0, (s - 0.2) / 0.3));
    const dk = D * (1 + sheer * 4 * s * s * (s > 0 ? 1.7 : 0.8));
    P[np * 3] = s * L + rake * D * bt * bt * (t - 0.25); P[np * 3 + 1] = dk * t; P[np * 3 + 2] = sg * half(s, t);
    U[np * 2] = uv[0] + (uv[2] - uv[0]) * (capU >= 0 ? capU : s + 0.5); U[np * 2 + 1] = uv[1] + (uv[3] - uv[1]) * t; np++;
  };
  for (let side = 0; side < 2; side++) {
    const base = np;
    if (!side) for (let i = 0; i <= stations; i++) for (let j = 0; j <= ring; j++) pt(x0 + (x1 - x0) * i / stations, Math.pow(j / ring, 1.7), 1);
    else for (let v = 0; v < base; v++) { P[np * 3] = P[v * 3]; P[np * 3 + 1] = P[v * 3 + 1]; P[np * 3 + 2] = -P[v * 3 + 2]; U[np * 2] = U[v * 2]; U[np * 2 + 1] = U[v * 2 + 1]; np++; }   // the other side is the first one mirrored
    for (let i = 0; i < stations; i++) for (let j = 0; j < ring; j++) { const a = base + i * row + j, b = a + row; I[ni++] = a; I[ni++] = b; I[ni++] = a + 1; I[ni++] = b; I[ni++] = b + 1; I[ni++] = a + 1; }
  }
  const cap = (s) => {
    const base = np;
    const cu = Math.min(0.12, B / L * 0.5);                                           // the transom carries a slice of the mural as wide as the beam, not one smeared column
    for (let j = 0; j <= ring; j++) { const t = Math.pow(j / ring, 1.7); pt(s, t, 1, s < 0 ? cu : 1 - cu); pt(s, t, -1, s < 0 ? 0.002 : 0.998); }
    for (let j = 0; j < ring; j++) { const a = base + j * 2; I[ni++] = a; I[ni++] = a + 1; I[ni++] = a + 2; I[ni++] = a + 1; I[ni++] = a + 3; I[ni++] = a + 2; }
  };
  if (capA) cap(x0);
  if (capB) cap(x1);
  const side = hgExpand(np, ni, true);
  np = 0; ni = 0;
  for (let i = 0; i <= stations; i++) {
    const s = x0 + (x1 - x0) * i / stations, bt = Math.min(1, Math.max(0, (s - 0.2) / 0.3));
    const dk = D * (1 + sheer * 4 * s * s * (s > 0 ? 1.7 : 0.8)) * 0.985, x = s * L + rake * D * bt * bt * 0.75, h = half(s, 1);
    P[np * 3] = x; P[np * 3 + 1] = dk; P[np * 3 + 2] = h; np++; P[np * 3] = x; P[np * 3 + 1] = dk; P[np * 3 + 2] = -h; np++;
    if (i < stations) { const a = i * 2; I[ni++] = a; I[ni++] = a + 2; I[ni++] = a + 1; I[ni++] = a + 1; I[ni++] = a + 2; I[ni++] = a + 3; }
  }
  const deck = hgExpand(np, ni, false);
  return { side, deck };
}

// ---- the air after the fog has torn: the haze that is left lies low over the mud (HAZE_TOP metres deep), and what stands above it is
// seen through clear air. A sight line is fogged by the share of its length that lies inside the low haze (and a quarter of the rest:
// the upper air is not empty). uClear is the fog's own state, 0 under the veil and 1 once it has torn; every material of the world
// scales its fog depth by hazeK(height of the point above the mud). ----
export const HAZE_GLSL = `uniform float uClear;
  float hazeK(float y){ float c = cameraPosition.y; return mix(1., 0.25 + 0.75*clamp((25. - min(c, y))/max(abs(c - y), 1e-3), 0., 1.), uClear); }`;
const HAZE_VERT = (y) => `
#ifdef USE_FOG
vFogDepth *= hazeK(${y});
#endif
`;
// the same rule for the built-in materials (plating, decks, cars): their fog depth is scaled where three.js sets it
export function airMaterial(m, clear) {
  m.onBeforeCompile = (sh) => { sh.uniforms.uClear = clear;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + HAZE_GLSL).replace('#include <fog_vertex>', `#include <fog_vertex>
#ifdef USE_FOG
{ vec4 hzW = vec4(transformed, 1.);
#ifdef USE_INSTANCING
hzW = instanceMatrix*hzW;
#endif
vFogDepth *= hazeK((modelMatrix*hzW).y); }
#endif
`); };
  m.customProgramCacheKey = () => 'ht-air'; return m;
}
// ---- ribbons: ropes, cables, stays, rails. Camera-facing, never thinner than about 1.5 px ----
export function makeRibbonMaterial() {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uLight: { value: new THREE.Color(1, 1, 1) }, uTime: { value: 0 }, uClear: { value: 0 } },
    vertexShader: `attribute vec3 aTan; attribute float aSide; attribute vec3 aCol; attribute vec2 aW; uniform float uTime; varying vec3 vC; ${fx.GLSL_FOG_PARS_VERT} ${HAZE_GLSL}
      void main(){ vec4 wp = modelMatrix*vec4(position,1.);
        float ph = aW.y + dot(position.xz, vec2(0.13, 0.09)), g = sin(uTime*1.9 + ph)*0.6 + sin(uTime*3.7 + ph*1.9)*0.3 + sin(uTime*0.6 + ph*0.3)*0.5;   // the same gusts as the cloth, so a kite keeps its string
        wp.xyz += vec3(-0.85, 0.12, 0.3)*g*aW.x + vec3(0., 0.25, 0.)*sin(uTime*5.3 + ph*2.3)*aW.x*0.3;
        vec3 toC = cameraPosition - wp.xyz; float d = length(toC);
        vec3 sd = cross(aTan, toC); float sl = length(sd); sd = sl > 1e-4 ? sd/sl : vec3(0.,1.,0.);
        wp.xyz += sd*sign(aSide)*max(abs(aSide), d*(abs(aSide) < 0.0115 ? 0.00055 : 0.0011)); vC = aCol;
        vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition; ${fx.GLSL_FOG_VERT} ${HAZE_VERT('wp.y')} }`,
    fragmentShader: `uniform vec3 uLight; varying vec3 vC; ${fx.GLSL_FOG_PARS_FRAG}
      void main(){ gl_FragColor = vec4(fxApplyFog(vC*uLight), 1.); }`,
  });
}
export function makeRibbonBag(arena, nv = 0) {
  const P = nums(arena, nv * 3), T = nums(arena, nv * 3), S = nums(arena, nv), C = nums(arena, nv * 3), W = nums(arena, nv * 2);
  return {
    add(pts, hw, c, sway) {                                                    // sway: [flex at the first point, flex at the last, phase]
      const n1 = pts.length - 1, cr = c.r, cg = c.g, cb = c.b, wp = sway ? sway[2] : 0;
      for (let i = 0; i < n1; i++) {
        const a = pts[i], b = pts[i + 1]; let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
        let wa = 0, wb = 0; if (sway) { const ta = i / n1, tb = (i + 1) / n1; wa = sway[0] + (sway[1] - sway[0]) * ta * ta; wb = sway[0] + (sway[1] - sway[0]) * tb * tb; }
        P.fit(18); T.fit(18); S.fit(6); C.fit(18); W.fit(12);                    // the six corners of the segment, written straight into the pieces in hand: a, b, a, b, b, a
        const Pa = P.arr(), Ta = T.arr(), Sa = S.arr(), Ca = C.arr(), Wa = W.arr(); let po = P.pos(), to = T.pos(), so = S.pos(), co = C.pos(), wo = W.pos();
        for (let k = 0; k < 6; k++) { const isA = k === 0 || k === 2 || k === 5, p = isA ? a : b;
          Pa[po] = p[0]; Pa[po + 1] = p[1]; Pa[po + 2] = p[2]; po += 3; Ta[to] = tx; Ta[to + 1] = ty; Ta[to + 2] = tz; to += 3; Sa[so++] = k === 2 || k === 4 || k === 5 ? hw : -hw;
          Ca[co] = cr; Ca[co + 1] = cg; Ca[co + 2] = cb; co += 3; Wa[wo] = isA ? wa : wb; Wa[wo + 1] = wp; wo += 2; }
        P.took(18); T.took(18); S.took(6); C.took(18); W.took(12);
      }
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P.flat(), 3)); g.setAttribute('aTan', new THREE.BufferAttribute(T.flat(), 3));
      g.setAttribute('aSide', new THREE.BufferAttribute(S.flat(), 1)); g.setAttribute('aCol', new THREE.BufferAttribute(C.flat(), 3)); g.setAttribute('aW', new THREE.BufferAttribute(W.flat(), 2));
      return g;
    },
    buildSteps(ctx) { return fillSteps(ctx, [['position', P, 3], ['aTan', T, 3], ['aSide', S, 1], ['aCol', C, 3], ['aW', W, 2]]); },
  };
}
export const sagLine = (a, b, sag, n = 10) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n; o.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t]); } return o; };

// ---- cloth and leaves: one wind shader for saris, bunting, banana leaves, awnings ----
export function makeWindMaterial() {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: { value: 0 }, uSun: { value: SUN.clone() },
      uSunCol: { value: new THREE.Color(1, 0.9, 0.75) }, uAmb: { value: new THREE.Color(0.5, 0.55, 0.62) }, uClear: { value: 0 } },
    vertexShader: `attribute vec3 aCol; attribute vec2 aW; attribute vec3 aNet; uniform float uTime; varying vec3 vC; varying vec3 vN; varying float vG; varying vec3 vNet; ${fx.GLSL_FOG_PARS_VERT} ${HAZE_GLSL}
      void main(){ vec3 p = position; float ph = aW.y + dot(position.xz, vec2(0.13, 0.09));
        float g = sin(uTime*1.9 + ph)*0.6 + sin(uTime*3.7 + ph*1.9)*0.3 + sin(uTime*0.6 + ph*0.3)*0.5;
        p += vec3(-0.85, 0.12, 0.3)*g*aW.x + vec3(0., 0.25, 0.)*sin(uTime*5.3 + ph*2.3)*aW.x*0.3;
        vC = aCol; vN = normal; vG = g*min(aW.x, 1.); vNet = aNet;
        vec4 mvPosition = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mvPosition; ${fx.GLSL_FOG_VERT} ${HAZE_VERT('(modelMatrix*vec4(p,1.)).y')} }`,
    fragmentShader: `uniform vec3 uSun, uSunCol, uAmb; varying vec3 vC; varying vec3 vN; varying float vG; varying vec3 vNet; ${fx.GLSL_FOG_PARS_FRAG}
      void main(){
        vec2 fw = fwidth(vNet.xy) + 1e-4;                                            // taken before any branch
        if (vNet.z > 0.5) {                                                          // a net: only the strands are there; far off, a thin even veil
          vec2 gd = 0.5 - abs(fract(vNet.xy) - 0.5);
          vec2 a = 1. - smoothstep(vec2(0.06), vec2(0.06) + fw, gd); a = mix(a, vec2(0.17), clamp(fw*3. - 0.4, 0., 1.));
          float dn = fract(52.9829189*fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
          if (a.x + a.y - a.x*a.y < dn*0.98 + 0.01) discard; }
        float nl = length(vN); vec3 n = nl > 1e-4 ? vN/nl : vec3(0.,1.,0.);
        float d = abs(dot(n, uSun))*0.75 + 0.25 + vG*0.12;
        gl_FragColor = vec4(fxApplyFog(vC*(uAmb + uSunCol*d)), 1.); }`,
  });
}
const QI = [0, 1, 3, 1, 2, 3];
export function makeWindBag(arena, nv = 0) {
  const P = nums(arena, nv * 3), N = nums(arena, nv * 3), C = nums(arena, nv * 3), W = nums(arena, nv * 2), X = nums(arena, nv * 3);
  return {
    // a hanging or standing sheet: origin o, across vector a, down/up vector d, nu x nv quads; flex grows along d
    sheet(o, a, d, nu, nv, c, flex, phase, c2, net) {                              // net: [meshes across, meshes down]
      const nx = a[1] * d[2] - a[2] * d[1], ny = a[2] * d[0] - a[0] * d[2], nz = a[0] * d[1] - a[1] * d[0], nl = Math.hypot(nx, ny, nz) || 1, n0 = nx / nl, n1 = ny / nl, n2 = nz / nl;
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        P.fit(18); N.fit(18); C.fit(18); W.fit(12); X.fit(18);
        const Pa = P.arr(), Na = N.arr(), Ca = C.arr(), Wa = W.arr(), Xa = X.arr(); let po = P.pos(), no = N.pos(), co = C.pos(), wo = W.pos(), xo = X.pos();
        for (let k = 0; k < 6; k++) { const ii = k === 1 || k === 3 || k === 4 ? i + 1 : i, jj = k === 2 || k === 4 || k === 5 ? j + 1 : j, u = ii / nu, v = jj / nv, cc = c2 && ((ii + jj) & 1) ? c2 : c;
          Pa[po] = o[0] + a[0] * u + d[0] * v; Pa[po + 1] = o[1] + a[1] * u + d[1] * v; Pa[po + 2] = o[2] + a[2] * u + d[2] * v; po += 3; Na[no] = n0; Na[no + 1] = n1; Na[no + 2] = n2; no += 3;
          Ca[co] = cc.r; Ca[co + 1] = cc.g; Ca[co + 2] = cc.b; co += 3; Wa[wo] = flex * v * v; Wa[wo + 1] = phase + u * 2.2; wo += 2; if (net) { Xa[xo] = u * net[0]; Xa[xo + 1] = v * net[1]; Xa[xo + 2] = 1; } xo += 3; }
        P.took(18); N.took(18); C.took(18); W.took(12); X.took(18);
      }
    },
    net(o, a, d, nu, nv, c, flex, phase, cu, cv) { this.sheet(o, a, d, nu, nv, c, flex, phase, null, [cu, cv]); },
    // a net hung in one bay from a sagging head rope (top: its points): gathered a fifth narrower at the foot, falling in shaded folds
    curtain(top, drop, c, flex, phase, cu, cv, nv = 4) {
      const n = top.length - 1, mx = (top[0][0] + top[n][0]) / 2, mz = (top[0][2] + top[n][2]) / 2;
      let tx = top[n][0] - top[0][0], tz = top[n][2] - top[0][2]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      const vtx = (i, j) => { const v = j / nv, p = top[i], k = 0.2 * v, a = i * 2.1 + phase, f = Math.cos(a) * 0.7, sh = 0.82 + 0.18 * Math.sin(a) * Math.min(1, v * 3);
        let nx = -tz + tx * f, nz = tx + tz * f; const nl = Math.hypot(nx, nz, 0.15) || 1;
        P.push(p[0] + (mx - p[0]) * k - tz * Math.sin(a) * 0.16 * v, p[1] - drop * v * (1 + 0.07 * Math.sin(i * 1.7 + phase)), p[2] + (mz - p[2]) * k + tx * Math.sin(a) * 0.16 * v);
        N.push(nx / nl, 0.15 / nl, nz / nl); C.push(c.r * sh, c.g * sh, c.b * sh); W.push(flex * v * v, phase + i * 0.35); X.push(i / n * cu, v * cv, 1); };
      for (let i = 0; i < n; i++) for (let j = 0; j < nv; j++) { vtx(i, j); vtx(i + 1, j); vtx(i, j + 1); vtx(i + 1, j); vtx(i + 1, j + 1); vtx(i, j + 1); }
    },
    tri(a, b, c, color, flex, phase) { this.tri9(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], color, flex, phase); },
    tri9(ax, ay, az, bx, by, bz, cx, cy, cz, color, flex, phase) {                 // the same from plain numbers: a flag of bunting allocates nothing
      const r = color.r, g = color.g, b = color.b;
      P.fit(9); N.fit(9); C.fit(9); W.fit(6); X.fit(9);
      const Pa = P.arr(), Na = N.arr(), Ca = C.arr(), Wa = W.arr(), po = P.pos(), no = N.pos(), co = C.pos(), wo = W.pos();
      Pa[po] = ax; Pa[po + 1] = ay; Pa[po + 2] = az; Pa[po + 3] = bx; Pa[po + 4] = by; Pa[po + 5] = bz; Pa[po + 6] = cx; Pa[po + 7] = cy; Pa[po + 8] = cz;
      for (let k = 0; k < 9; k += 3) { Na[no + k] = 0.3; Na[no + k + 1] = 0.3; Na[no + k + 2] = 0.9; Ca[co + k] = r; Ca[co + k + 1] = g; Ca[co + k + 2] = b; }
      Wa[wo] = 0; Wa[wo + 1] = phase; Wa[wo + 2] = 0; Wa[wo + 3] = phase; Wa[wo + 4] = flex; Wa[wo + 5] = phase;
      P.took(9); N.took(9); C.took(9); W.took(6); X.took(9);
    },
    // a free quad a-b-c-d with a flex at each corner and its own normal
    quad(a, b, c, d, color, fl, phase, nrm) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl; if (nrm) { nx = nrm[0]; ny = nrm[1]; nz = nrm[2]; }
      for (let i = 0; i < 6; i++) { const k = QI[i], p = k === 0 ? a : k === 1 ? b : k === 2 ? c : d; P.push(p[0], p[1], p[2]); N.push(nx, ny, nz); C.push(color.r, color.g, color.b); W.push(fl[k], phase); X.push(0, 0, 0); }
    },
    // a leaf blade: two rows of quads either side of a pale midrib, arching up then drooping at the tip
    leaf(base, dx, dz, len, w, rise, droop, cEdge, cRib, flex, phase, nv = 4) {
      for (let j = 0; j < nv; j++) for (let s0 = -1; s0 <= 0; s0++) {
        const t0 = j / nv, t1 = (j + 1) / nv;
        P.fit(18); N.fit(18); C.fit(18); W.fit(12); X.fit(18);
        const Pa = P.arr(), Na = N.arr(), Ca = C.arr(), Wa = W.arr(); let po = P.pos(), no = N.pos(), co = C.pos(), wo = W.pos();
        for (let k = 0; k < 6; k++) { const t = k === 2 || k === 4 || k === 5 ? t1 : t0, s = k === 1 || k === 3 || k === 4 ? s0 + 1 : s0;   // (t0,s0) (t0,s0+1) (t1,s0) (t0,s0+1) (t1,s0+1) (t1,s0)
          const wd = w * Math.sqrt(Math.sin(Math.PI * (0.06 + t * 0.9))), out = len * t * (1 - 0.16 * t), y = (rise * t - droop * t * t) * len - Math.abs(s) * wd * 0.22;
          const sl = rise - 2 * droop * t, c = s === 0 ? cRib : cEdge, kk = 0.72 + 0.28 * Math.sin(t * 9 + phase);
          let nx = -dx * sl - dz * s * 0.35, ny = 1, nz = -dz * sl + dx * s * 0.35; const nl = Math.hypot(nx, ny, nz);
          Pa[po] = base[0] + dx * out - dz * s * wd; Pa[po + 1] = base[1] + y; Pa[po + 2] = base[2] + dz * out + dx * s * wd; po += 3; Na[no] = nx / nl; Na[no + 1] = ny / nl; Na[no + 2] = nz / nl; no += 3;
          Ca[co] = c.r * kk; Ca[co + 1] = c.g * kk; Ca[co + 2] = c.b * kk; co += 3; Wa[wo] = flex * t * t; Wa[wo + 1] = phase + t; wo += 2; }
        P.took(18); N.took(18); C.took(18); W.took(12); X.took(18);
      }
    },
    get triangles() { return P.length / 9; },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P.flat(), 3)); g.setAttribute('normal', new THREE.BufferAttribute(N.flat(), 3));
      g.setAttribute('aCol', new THREE.BufferAttribute(C.flat(), 3)); g.setAttribute('aW', new THREE.BufferAttribute(W.flat(), 2)); g.setAttribute('aNet', new THREE.BufferAttribute(X.flat(), 3));
      return g;
    },
    buildSteps(ctx) { return fillSteps(ctx, [['position', P, 3], ['normal', N, 3], ['aCol', C, 3], ['aW', W, 2], ['aNet', X, 3]]); },
  };
}
// bunting along a line of points: little triangles, alternating colours
// (sink: a list that takes each flag again as nine numbers and its colour, for the image of the line in standing water)
export function addBunting(wind, pts, colors, step = 1, size = 0.7, phase = 0, sink = null) {
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(1, Math.floor(l / step));
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 0.7) / n, tm = (t0 + t1) / 2;
      wind.tri9(a[0] + dx * t0, a[1] + dy * t0, a[2] + dz * t0, a[0] + dx * t1, a[1] + dy * t1, a[2] + dz * t1, a[0] + dx * tm, a[1] + dy * tm - size, a[2] + dz * tm, colors[(i * 7 + k) % colors.length], 0.35, phase + i + k * 0.7);
      if (sink) sink.push(a[0] + dx * t0, a[1] + dy * t0, a[2] + dz * t0, a[0] + dx * t1, a[1] + dy * t1, a[2] + dz * t1, a[0] + dx * tm, a[1] + dy * tm - size, a[2] + dz * tm, colors[(i * 7 + k) % colors.length]);
    }
  }
}
// a banana clump: a sheathed stem, nine to twelve torn blades arching out, the newest a pale rolled spear
export function addBanana(wind, x, y, z, h, rng, leafA, leafB) {
  const n = 8 + Math.floor(rng() * 3), a0 = rng() * 6.283, top = y + h * 0.42;
  for (let k = 0; k < n; k++) {
    const a = a0 + k * 2.4 + rng() * 0.5, old = k / n, len = h * (0.5 + 0.38 * rng() + 0.12 * old), w = 0.3 + rng() * 0.18 + h * 0.035;
    wind.leaf([x + Math.cos(a) * 0.08, top - old * h * 0.08, z + Math.sin(a) * 0.08], Math.cos(a), Math.sin(a), len, w, 1.25 - old * 0.75 + rng() * 0.2, 0.55 + old * 0.75 + rng() * 0.2, rng() < 0.25 ? leafB : leafA, leafB, 0.5, rng() * 6, 3);
  }
  wind.leaf([x, top, z], 0.2, 0.1, h * 0.55, 0.09, 2.6, 0.5, leafB, leafB, 0.25, a0, 2);
  for (const r of [0, 1.57]) wind.sheet([x - Math.cos(r) * 0.14, y, z - Math.sin(r) * 0.14], [Math.cos(r) * 0.28, 0, Math.sin(r) * 0.28], [0, h * 0.46, 0], 1, 1, leafA, 0.03, 0);
}
// deck edge of a lofted hull at station s (-0.5 stern .. 0.5 bow), in the hull's own frame: [x, deck height, half beam]
export function deckEdge(o, s) {
  const { L, B, D, sheer = 0.05, rake = 0.5 } = o, bt = Math.min(1, Math.max(0, (s - 0.2) / 0.3)), st = Math.min(1, Math.max(0, (-s - 0.3) / 0.2));
  return [s * L + rake * D * bt * bt * 0.75, D * (1 + sheer * 4 * s * s * (s > 0 ? 1.7 : 0.8)), Math.max(0.04, B / 2 * (1 - Math.pow(bt, 1.8)) * (1 - 0.45 * st * st))];
}

// ---- the liner's paint: hull mural (lower half of the canvas, 290 m x 24 m) and deckhouse wall strip (upper half).
// Drawn in steps with a yield between them; a second, small canvas carries what glows (lit portholes, windows, doorways).
export const lcg = (seed) => { let s = (seed | 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) | 0; return (s >>> 0) / 4294967296; }; };   // a private stream: new paint never shifts the draws the layout uses
async function linerCanvas(ctx, rng, P, litFrac, shade) {
  const W = 4096, H = 1024, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), lit = [], wins = [];
  g.setTransform(W / 290, 0, 0, -(H / 2) / 24, W / 2, H);
  g.fillStyle = P.rust; g.fillRect(-145, 0, 290, 24);
  const rusts = ['#7c2c1c', '#b24a2c', '#8a3320', '#a8452a', '#6b2a1e', '#b5573a'];
  for (let i = 0; i < 620; i++) { g.globalAlpha = 0.12 + rng() * 0.2; g.fillStyle = rusts[i % 6]; g.beginPath(); g.ellipse(-145 + rng() * 290, rng() * 24, 1 + rng() * 6, 0.4 + rng() * 2.2, 0, 0, 6.3); g.fill(); if (i % 100 === 99) await ctx.yield(); }
  await ctx.yield();
  g.globalAlpha = 0.2; g.fillStyle = '#b7a58c'; g.fillRect(-145, 0, 290, 7.4);     // faded below the old waterline, a pale boot-topping line
  g.globalAlpha = 0.5; g.fillStyle = '#c8b9a0'; for (let x = -145; x < 145; x += 3) if (rng() > 0.3) g.fillRect(x, 7.3, 3.1, 0.28);
  const q = lcg((ctx.seed | 0) * 7919 + 1301), tarE = (x) => 15.5 + Math.sin(x * 0.11) * 1.6 + Math.sin(x * 0.37 + 2) * 0.9 + Math.sin(x * 1.3) * 0.35;
  g.globalAlpha = 0.95; g.fillStyle = '#565c66';                               // the old black topsides, sun-bleached to slate, scaled off along a ragged edge
  g.beginPath(); g.moveTo(-145, 24); for (let x = -145; x < 145; x += 0.75) { g.lineTo(x, tarE(x) + rng() * 0.6); g.lineTo(x + 0.3 + q() * 0.2, tarE(x + 0.4) + q() * 0.9 - 0.15); } g.lineTo(145, 24); g.closePath(); g.fill();
  await ctx.yield();
  for (let i = 0; i < 760; i++) rng();                                         // (the draws of the old scale ellipses, kept so the layout after them is unchanged)
  for (let i = 0; i < 340; i++) { const x = -145 + q() * 290, e = tarE(x) + 0.7, y = e + q() * (23.7 - e); g.globalAlpha = 0.22 + q() * 0.3; g.fillStyle = i % 3 ? (i % 3 === 1 ? '#3b4047' : '#6e757e') : '#7c838b';
    g.beginPath(); g.ellipse(x, y, 0.4 + q() * 2.2, 0.12 + q() * 0.5, 0, 0, 6.3); g.fill(); if (i % 110 === 109) await ctx.yield(); }
  g.globalAlpha = 0.5; g.fillStyle = '#7b828a'; for (let x = -145; x < 145; x += 0.4) if (q() < 0.5) g.fillRect(x, tarE(x) + 0.75 + q() * 6, 0.07, -(0.5 + q() * 2.2));   // streaks of weathered tar
  await ctx.yield();
  // red lead showing where the tar has scaled off: opaque islands with a ragged outline, a pale flaking rim and a dark lower edge
  const blob = (x, y, rx, ry, r) => { g.beginPath(); for (let k = 0; k < 12; k++) { const a = k / 12 * 6.2832, px = x + Math.cos(a) * rx * r[k], py = y + Math.sin(a) * ry * r[k]; if (k) g.lineTo(px, py); else g.moveTo(px, py); } g.closePath(); g.fill(); };
  for (let i = 0; i < 64; i++) { const x = i < 26 ? (q() - 0.5) * 112 : -145 + q() * 290, e = tarE(x), y = Math.min(23, e + 0.4 + q() * (22.6 - e)), rx = 1 + q() * 3.6, ry = Math.min(0.45 + q() * 1.1, (23.4 - y)), r = [];
    for (let k = 0; k < 12; k++) r.push(0.62 + q() * 0.5);
    g.globalAlpha = 0.9; g.fillStyle = '#c8b494'; blob(x, y, rx + 0.16, ry + 0.11, r);
    g.globalAlpha = 1; g.fillStyle = '#4a1c14'; blob(x, y - 0.08, rx, ry, r);
    g.fillStyle = rusts[i % 6]; blob(x, y + 0.03, rx, ry * 0.96, r);
    g.globalAlpha = 0.45; g.fillStyle = i % 2 ? '#c8643c' : '#7a2a1a'; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(x + (q() - 0.5) * rx, y + (q() - 0.5) * ry * 0.6, rx * (0.15 + q() * 0.25), ry * (0.15 + q() * 0.2), 0, 0, 6.3); g.fill(); }
    g.globalAlpha = 0.4; g.fillStyle = '#5a2414'; for (let k = 0; k < 2; k++) g.fillRect(x + (q() - 0.5) * rx * 1.2, y - ry * 0.6, 0.12 + q() * 0.14, -(0.8 + q() * 2.4));     // it weeps
    if (i % 16 === 15) await ctx.yield(); }
  await ctx.yield();
  g.globalAlpha = 0.85; g.fillStyle = P.pearl;                                 // white sheer line, broken
  for (let x = -145; x < 145; x += 4) if (rng() > 0.18) g.fillRect(x, 21.7, 4.1, 0.7);
  g.globalAlpha = 0.2; g.fillStyle = '#20100c';                                // plate laps and butts, staggered strake by strake
  for (let y = 1.8, r = 0; y < 24; y += 1.8, r++) { g.fillRect(-145, y, 290, 0.09); for (let x = -144 + (r % 2) * 3.5; x < 145; x += 7) g.fillRect(x, y - 1.8, 0.09, 1.8); }
  g.globalAlpha = 0.1; g.fillStyle = '#f0d0b0'; for (let y = 1.8; y < 24; y += 1.8) g.fillRect(-145, y - 0.1, 290, 0.08);
  await ctx.yield();
  for (let y = 1.8, r = 0; y < 24; y += 1.8, r++) {                             // rivet heads along every lap: a pale dot with its own little shadow
    g.globalAlpha = 0.34; g.fillStyle = '#f2d2b4'; for (let x = -145 + (r % 2) * 0.25; x < 145; x += 0.5) g.fillRect(x, y + 0.2, 0.14, 0.1);
    g.globalAlpha = 0.3; g.fillStyle = '#1a0c0a'; for (let x = -145 + (r % 2) * 0.25; x < 145; x += 0.5) g.fillRect(x + 0.02, y + 0.1, 0.14, 0.09);
    await ctx.yield(); }
  for (const y of [10.8, 16.2, 20.6]) for (const sg of [-1, 1]) { g.globalAlpha = 0.5; g.fillStyle = '#1a0c0a'; g.fillRect(sg > 0 ? 14 : -45, y - 0.3, 31, 0.24); g.globalAlpha = 0.25; g.fillStyle = '#f0d0b0'; g.fillRect(sg > 0 ? 14 : -45, y + 0.06, 31, 0.06); }   // the shade under the three proud laps by the cut
  for (let i = 0; i < 260; i++) {                                              // rust runs weeping down the plating
    const x = -145 + rng() * 290, y = 6 + rng() * 17, l = 1.5 + rng() * 6, gr = g.createLinearGradient(0, y, 0, y - l);
    gr.addColorStop(0, i % 3 ? 'rgba(96,36,20,0.55)' : 'rgba(190,120,70,0.4)'); gr.addColorStop(1, 'rgba(96,36,20,0)'); g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(x, y - l, 0.16 + rng() * 0.3, l);
    if (i % 65 === 64) await ctx.yield();
  }
  await ctx.yield();
  g.globalAlpha = 1;
  const paint = [P.teal, '#F2EFE6', P.pink, P.yellow];
  const fan = (x, y, r, n, c0) => { for (let k = 0; k < n; k++) { g.fillStyle = paint[(k + c0) % 4]; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, Math.PI * k / n, Math.PI * (k + 1) / n); g.closePath(); g.fill(); } g.fillStyle = P.orange; g.beginPath(); g.arc(x, y, r * 0.22, 0, Math.PI); g.fill(); };
  const lotus = (x, y, r) => { for (let k = -2; k <= 2; k++) { g.fillStyle = k % 2 ? '#F2EFE6' : P.pink; g.beginPath(); g.ellipse(x + Math.sin(k * 0.5) * r * 0.5, y + Math.cos(k * 0.5) * r * 0.55, r * 0.24, r * 0.6, -k * 0.5, 0, 6.3); g.fill(); } g.fillStyle = P.teal; g.beginPath(); g.ellipse(x, y - r * 0.05, r * 0.9, r * 0.14, 0, 0, 6.3); g.fill(); };
  const peacock = (x, y, r, flip) => { for (let ring = 3; ring >= 1; ring--) { g.fillStyle = [P.teal, '#1f6f8f', P.yellow][ring - 1]; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r * ring / 3, 0.25, Math.PI - 0.25); g.closePath(); g.fill(); }
    for (let k = 0; k < 7; k++) { const a = 0.45 + k * (Math.PI - 0.9) / 6; g.fillStyle = k % 2 ? P.orange : '#F2EFE6'; g.beginPath(); g.arc(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.085, 0, 6.3); g.fill(); g.fillStyle = '#1f6f8f'; g.beginPath(); g.arc(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.04, 0, 6.3); g.fill(); }
    g.fillStyle = '#1f6f8f'; g.beginPath(); g.ellipse(x + flip * r * 0.2, y + r * 0.12, r * 0.2, r * 0.34, flip * 0.5, 0, 6.3); g.fill(); g.beginPath(); g.arc(x + flip * r * 0.42, y + r * 0.5, r * 0.09, 0, 6.3); g.fill();
    g.fillStyle = P.yellow; g.beginPath(); g.moveTo(x + flip * r * 0.5, y + r * 0.5); g.lineTo(x + flip * r * 0.62, y + r * 0.47); g.lineTo(x + flip * r * 0.5, y + r * 0.44); g.fill(); };
  for (const sg of [-1, 1]) {                                                  // the 60 m frieze either side of the cut
    g.globalAlpha = 0.92;
    for (let k = 0; k < 6; k++) { const x = sg * (17 + k * 10.4); if (k % 3 === 0) peacock(x, 4.4, 4.6, -sg); else if (k % 3 === 1) lotus(x, 6.6, 4); else fan(x, 4.2, 4.4, 8, k); }
    for (let x = 10; x < 72; x += 1.6) { g.fillStyle = ((x / 1.6) | 0) % 2 ? P.teal : '#F2EFE6'; g.beginPath(); g.arc(sg * x, 12.6, 0.8, Math.PI, 0); g.fill(); g.beginPath(); g.arc(sg * x, 2.9, 0.8, 0, Math.PI); g.fill(); }
    for (let x = 10.8; x < 72; x += 3.2) { g.fillStyle = P.orange; g.beginPath(); g.arc(sg * x, 13.6, 0.28, 0, 6.3); g.fill(); }
    await ctx.yield();
  }
  g.globalAlpha = 1; g.lineWidth = 1.5; g.strokeStyle = P.teal;                 // the plated, scalloped rim of the arch
  g.beginPath(); g.moveTo(-8.8, 0); g.lineTo(-8.8, 8); g.arc(0, 8, 8.8, Math.PI, 0, true); g.lineTo(8.8, 0); g.stroke();
  for (let k = 0; k <= 40; k++) { const t = k / 40, a = Math.PI * (1 - (t - 0.2) / 0.6); const px = t < 0.2 ? -9.6 : t > 0.8 ? 9.6 : Math.cos(a) * 9.6, py = t < 0.2 ? t * 40 : t > 0.8 ? (1 - t) * 40 : 8 + Math.sin(a) * 9.6;
    g.fillStyle = k % 2 ? P.yellow : '#F2EFE6'; g.beginPath(); g.arc(px, py, 0.55, 0, 6.3); g.fill(); g.fillStyle = k % 2 ? P.orange : P.teal; g.beginPath(); g.arc(px, py, 0.2, 0, 6.3); g.fill(); }
  await ctx.yield();
  for (const y of [13.6, 18.2]) for (let x = -138; x < 140; x += 3.2) { if (Math.abs(x) < 12) continue; const on = rng() < litFrac;
    g.fillStyle = 'rgba(70,26,16,0.45)'; g.fillRect(x - 0.12, y - 2.6, 0.24, 2.4);
    g.fillStyle = '#c9c0ae'; g.beginPath(); g.arc(x, y, 0.42, 0, 6.3); g.fill(); g.fillStyle = on ? '#ffc070' : '#121418'; g.beginPath(); g.arc(x, y, 0.3, 0, 6.3); g.fill(); if (on) lit.push([x, y]); }
  await ctx.yield();
  for (let k = 0; k < 5; k++) for (const sg of [-1, 1]) { g.fillStyle = '#160f0e'; g.fillRect(sg * (28 + k * 22) - 1.4, 0.2, 2.8, 3.3); g.fillStyle = '#c9a36a'; g.fillRect(sg * (28 + k * 22) - 1.55, 3.5, 3.1, 0.18); }
  let gr = g.createLinearGradient(0, 0, 0, 2.6); gr.addColorStop(0, 'rgba(52,84,48,0.9)'); gr.addColorStop(0.5, 'rgba(150,150,128,0.45)'); gr.addColorStop(1, 'rgba(150,150,128,0)');
  g.fillStyle = gr; g.fillRect(-145, 0, 290, 2.6);
  gr = g.createLinearGradient(0, 24, 0, 21.8); gr.addColorStop(0, 'rgba(10,8,12,0.55)'); gr.addColorStop(1, 'rgba(10,8,12,0)'); g.fillStyle = gr; g.fillRect(-145, 21.8, 290, 2.2);   // shade under the deck edge
  await ctx.yield();
  if (shade) { const sx = shade.x, al = shade.a;                                // the low sun's shadows, painted where the map cannot reach: boats, stairs, awnings, pipes
    g.fillStyle = '#3A2A30';
    for (let i = 0; i < 14; i++) { const x = -96 + i * 14.6; g.globalAlpha = al; g.beginPath(); g.moveTo(x - 4.1, 24); g.lineTo(x + 4.1, 24); g.lineTo(x + 4.1 + sx * 5.2, 21.2); g.lineTo(x + 2 + sx * 6, 20.7); g.lineTo(x - 2 + sx * 6, 20.7); g.lineTo(x - 4.1 + sx * 5.2, 21.2); g.closePath(); g.fill();
      for (const dx of [-2.6, 2.6]) { g.globalAlpha = al * 0.8; g.beginPath(); g.moveTo(x + dx - 0.2, 24); g.lineTo(x + dx + 0.2, 24); g.lineTo(x + dx + 0.2 + sx * 7.4, 20.1); g.lineTo(x + dx - 0.2 + sx * 7.4, 20.1); g.closePath(); g.fill(); } }
    g.globalAlpha = al * 0.7; g.fillRect(-145, 22.9, 290, 1.1);
    for (const xs of [-84, -40, 40, 84]) for (let f = 0; f < 6; f++) { const d = f % 2 ? -1 : 1, y0 = f * 4 + 0.1; g.globalAlpha = al * 0.9;
      g.beginPath(); g.moveTo(xs - d * 3.6 + sx * 2.4, y0 - 0.95); g.lineTo(xs + d * 3.6 + sx * 2.4, y0 + 3.05); g.lineTo(xs + d * 3.6 + sx * 2.4, y0 + 3.9); g.lineTo(xs - d * 3.6 + sx * 2.4, y0 - 0.1); g.closePath(); g.fill(); }
    for (let k = 0; k < 5; k++) for (const sg of [-1, 1]) { const x = sg * (28 + k * 22); g.globalAlpha = al * 0.8; g.beginPath(); g.moveTo(x - 2.8, 4.3); g.lineTo(x + 2.8, 4.3); g.lineTo(x + 2.8 + sx * 3.4, 0); g.lineTo(x - 2.8 + sx * 3.4, 0); g.closePath(); g.fill(); }
    for (const x of [-21.5, 24.5]) { const gr2 = g.createLinearGradient(0, 21.6, 0, 13); gr2.addColorStop(0, 'rgba(120,52,24,0.75)'); gr2.addColorStop(1, 'rgba(120,52,24,0)'); g.globalAlpha = 1; g.fillStyle = gr2; g.fillRect(x - 0.22, 13, 0.44, 8.6); g.fillStyle = '#3A2A30';
      g.globalAlpha = al; g.beginPath(); g.moveTo(x - 0.25, 21.9); g.lineTo(x + 0.25, 21.9); g.lineTo(x + 0.25 + sx * 1.9, 21.2); g.lineTo(x - 0.25 + sx * 1.9, 21.2); g.closePath(); g.fill(); }
    g.globalAlpha = 1; await ctx.yield(); }
  // deckhouse strip: 3.5 m of weathered white wall with windows, doors and tin patches
  g.setTransform(W / 290, 0, 0, -(H / 2) / 3.5, W / 2, H / 2);
  g.fillStyle = '#cbc5b6'; g.fillRect(-145, 0, 290, 3.5);
  for (let i = 0; i < 420; i++) { g.globalAlpha = 0.25; g.fillStyle = i % 3 ? '#9a5a3a' : '#8d8a80'; const x = -145 + rng() * 290; g.fillRect(x, 0, 0.1 + rng() * 0.4, 1 + rng() * 2.5); }
  await ctx.yield();
  g.globalAlpha = 1;
  for (let x = -143; x < 143;) { const w = 3 + rng() * 6; if (rng() < 0.3) { g.fillStyle = [P.teal, P.pink, P.yellow, '#7fb0c8'][(rng() * 4) | 0]; g.fillRect(x, 0, w, 3.5); } x += w + rng() * 6; }
  for (let x = -143; x < 143; x += 2.7) { const d = rng();
    if (d < 0.12) { g.fillStyle = '#2a1c18'; g.fillRect(x, 0, 1, 2.2); g.fillStyle = '#8a7a66'; g.fillRect(x - 0.08, 2.2, 1.16, 0.1); }
    else { const on = d < 0.12 + (1 - 0.12) * Math.min(0.9, litFrac * 1.1); g.fillStyle = '#8f8778'; g.fillRect(x - 0.1, 1.2, 1.4, 1.3); g.fillStyle = on ? '#ffc070' : '#1c2026'; g.fillRect(x, 1.3, 1.2, 1.1); g.fillStyle = '#8f8778'; g.fillRect(x + 0.56, 1.3, 0.08, 1.1); if (on) wins.push(x); } }
  g.fillStyle = '#7a3a26'; g.fillRect(-145, 3.3, 290, 0.2); g.fillStyle = 'rgba(20,16,20,0.35)'; g.fillRect(-145, 3.0, 290, 0.3);
  await ctx.yield();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  await ctx.yield();
  const ev = document.createElement('canvas'); ev.width = 2048; ev.height = 512; const e = ev.getContext('2d');
  e.fillStyle = '#000'; e.fillRect(0, 0, 2048, 512);
  await ctx.yield();
  e.setTransform(2048 / 290, 0, 0, -256 / 24, 1024, 512);
  for (const [x, y] of lit) { const q = e.createRadialGradient(x, y, 0, x, y, 0.75); q.addColorStop(0, '#ffd08a'); q.addColorStop(0.45, '#c8802e'); q.addColorStop(1, 'rgba(0,0,0,0)'); e.fillStyle = q; e.fillRect(x - 0.8, y - 1.6, 1.6, 3.2); }
  for (let k = 0; k < 5; k++) for (const sg of [-1, 1]) { const x = sg * (28 + k * 22), q = e.createLinearGradient(0, 0.2, 0, 3.5); q.addColorStop(0, '#6a3a12'); q.addColorStop(1, '#e09a48'); e.fillStyle = q; e.fillRect(x - 1.3, 0.3, 2.6, 3.1); }
  await ctx.yield();
  e.setTransform(2048 / 290, 0, 0, -256 / 3.5, 1024, 256);
  e.fillStyle = '#ffbe6e'; for (const x of wins) e.fillRect(x, 1.3, 1.2, 1.1);
  const te = new THREE.CanvasTexture(ev); te.colorSpace = THREE.SRGBColorSpace; te.wrapS = te.wrapT = THREE.ClampToEdgeWrapping;
  return { tex: t, emi: te };
}
// a tiling grey relief of riveted, lapped plating: four strakes of two plates, used as the bump of every hull
export function plateBump(rng) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const g = cv.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) { g.globalAlpha = 0.1; g.fillStyle = i % 2 ? '#404040' : '#b0b0b0'; g.beginPath(); g.ellipse(rng() * 256, rng() * 256, 3 + rng() * 14, 2 + rng() * 6, 0, 0, 6.3); g.fill(); }
  g.globalAlpha = 1;
  for (let r = 0; r < 4; r++) { const y = r * 64;
    g.fillStyle = '#a4a4a4'; g.fillRect(0, y, 256, 3); g.fillStyle = '#4c4c4c'; g.fillRect(0, y + 3, 256, 3);
    for (const x of [(r % 2) * 64 + 20, (r % 2) * 64 + 148]) { g.fillStyle = '#585858'; g.fillRect(x, y + 6, 2, 58); g.fillStyle = '#9a9a9a'; g.fillRect(x + 2, y + 6, 2, 58); for (let q = y + 10; q < y + 62; q += 8) { g.fillStyle = '#b4b4b4'; g.fillRect(x + 6, q, 2, 2); } }
    for (let x = 4; x < 256; x += 8) { g.fillStyle = '#b4b4b4'; g.fillRect(x, y + 9, 2, 2); }
  }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
// the back walls of the five sectioned decks inside the cut (34 m along the beam, 16 m high): painted cabin fronts, doors, lit windows
function cutCanvas(rng, P, emissive) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256; const g = cv.getContext('2d');
  g.setTransform(1024 / 34, 0, 0, -256 / 16, 0, 256);
  g.fillStyle = emissive ? '#000' : '#5a4034'; g.fillRect(0, 0, 34, 16);
  const cols = [P.teal, P.pink, P.yellow, '#d8d2c2', '#7fb0c8', '#b86a3a'];
  for (let k = 0; k < 5; k++) { const y = k * 3.2;
    for (let x = 0; x < 34;) { const w = 2.2 + rng() * 3.4, c = cols[(rng() * cols.length) | 0], kind = rng(), on = rng() < 0.7;
      if (!emissive) { g.globalAlpha = 0.85; g.fillStyle = c; g.fillRect(x + 0.06, y + 0.25, w - 0.12, 2.75); g.globalAlpha = 0.3; g.fillStyle = '#2a1a14'; g.fillRect(x + 0.06, y + 0.25, w - 0.12, 0.5); g.globalAlpha = 1; }
      if (kind < 0.45) { g.fillStyle = emissive ? (on ? '#ffb45a' : '#000') : (on ? '#ffd9a0' : '#20140f'); g.fillRect(x + w * 0.5 - 0.5, y + 0.25, 1, 2.1); if (!emissive) { g.fillStyle = cols[(rng() * 3) | 0]; g.globalAlpha = 0.8; g.fillRect(x + w * 0.5 - 0.5, y + 1.2, 0.55, 1.15); g.globalAlpha = 1; } else rng(); }
      else { g.fillStyle = emissive ? (on ? '#ffc070' : '#000') : (on ? '#ffe2b0' : '#1c2026'); g.fillRect(x + w * 0.5 - 0.55, y + 1.3, 1.1, 0.9); if (!emissive) { g.fillStyle = '#3a2a22'; g.fillRect(x + w * 0.5 - 0.03, y + 1.3, 0.06, 0.9); } }
      x += w; }
    if (!emissive) { g.fillStyle = '#2a1c18'; g.fillRect(0, y + 3.0, 34, 0.2); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, y + 2.5, 34, 0.5); }
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
// a flat pool of water: sky in it, rings spreading, a soft edge; uv runs -1..1 across each pool
export function makeWaterMaterial() {
  return new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: { value: 0 }, uA: { value: 0.92 }, uRing: { value: 0 }, uSky: { value: new THREE.Color(0.6, 0.7, 0.8) }, uDeep: { value: new THREE.Color(0.1, 0.11, 0.12) }, uSunCol: { value: new THREE.Color(1, 0.9, 0.7) }, uSun: { value: SUN.clone() } },
    vertexShader: `varying vec2 vUv; varying vec3 vW; ${fx.GLSL_FOG_PARS_VERT}
      void main(){ vUv = uv; vec4 wp = modelMatrix*vec4(position,1.); vW = wp.xyz; vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: `uniform float uTime, uA, uRing; uniform vec3 uSky, uDeep, uSunCol, uSun; varying vec2 vUv; varying vec3 vW; ${fx.GLSL_FOG_PARS_FRAG}
      void main(){ float r = length(vUv); vec3 toC = cameraPosition - vW; float d = max(length(toC), 1e-3); vec3 v = toC/d;
        float ph = vW.x*0.37 + vW.z*0.23;
        float w1 = sin(length(vUv - vec2(0.42, 0.12))*17. - uTime*3.1 + ph), w2 = sin(length(vUv + vec2(0.38, 0.22))*13. - uTime*2.3 + ph*1.7), w = (w1 + w2)*0.5*(1. - 0.6*r);
        vec3 n = normalize(vec3(w*0.16, 1., (w1 - w2)*0.1));
        float F = 0.06 + 0.94*pow(1. - clamp(dot(v, n), 0., 1.), 4.);
        vec3 rr = reflect(-v, n); float sp = pow(max(dot(rr, uSun), 0.), 90.);
        vec3 c = mix(uDeep, uSky*(0.92 + 0.16*w), clamp(0.3 + 0.7*F, 0., 1.)) + uSunCol*sp*2.5;
        gl_FragColor = vec4(fxApplyFog(c), smoothstep(1., mix(0.7, 0.2, uRing), r)*uA*mix(1., 0.06 + 0.94*smoothstep(0.25, 0.85, abs(w)), uRing)); }`,   // (uRing 1: only the crests of the rings, dying away outward, laid over a mirror drawn elsewhere)
  });
}
const archOutline = (N, r = 8) => { const o = []; for (let k = 0; k <= N; k++) { const t = k / N;
  if (t < 0.2) o.push([-r, r * t / 0.2]); else if (t > 0.8) o.push([r, r * (1 - t) / 0.2]); else { const a = Math.PI * (1 - (t - 0.2) / 0.6); o.push([Math.cos(a) * r, r + Math.sin(a) * r]); } } return o; };

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('liner');
  const P = { rust: '#9B3A26', pearl: '#E9E6DF', grey: '#5B544C', tar: '#1D2125', blue: '#86AAC6', teal: '#2E8C86', orange: '#F26A1B', pink: '#E58CA5', yellow: '#E8C04A', ...(opts.palette || {}) };
  const group = new THREE.Group(), I4 = new THREE.Matrix4(), white = col('#ffffff'), night = !!opts.night, T = opts.time || { value: 0 };
  await ctx.yield();
  const { tex, emi } = await linerCanvas(ctx, rng, P, night ? 0.72 : 0.24, { x: opts.shadeX ?? -1, a: night ? 0.22 : 0.46 }); await ctx.yield();
  const cutTex = cutCanvas(rng.fork('cut'), P, false); await ctx.yield(); const cutEmi = cutCanvas(rng.fork('cut'), P, true); await ctx.yield();
  const bump = plateBump(rng.fork('bump')); bump.repeat.set(20.7, 6.67); await ctx.yield();
  const hullMat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: emi, emissive: col('#ffb060'), emissiveIntensity: night ? 3.4 : 0.7, bumpMap: bump, bumpScale: 3, vertexColors: true, roughness: 0.74, metalness: 0.05, side: THREE.DoubleSide });
  const plainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide });
  const cutMat = new THREE.MeshStandardMaterial({ map: cutTex, emissiveMap: cutEmi, emissive: col('#ffb060'), emissiveIntensity: night ? 4.5 : 2.6, roughness: 0.9, side: THREE.DoubleSide });
  const litMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });
  if (opts.air) for (const m of [hullMat, plainMat, cutMat]) airMaterial(m, opts.air);                                   // the liner stands in the same air as the town
  await ctx.yield();
  const windMat = opts.windMat || makeWindMaterial(), ribMat = opts.ribbonMat || makeRibbonMaterial(), waterMat = makeWaterMaterial();
  const arena = opts.arena || null;                                             // the world's block of geometry memory, when it has one
  const painted = makeBag(arena, 110000), plain = makeBag(arena, 250000), wind = makeWindBag(arena, 110000), rib = makeRibbonBag(arena, 80000), lit = makeBag(), mcore = makeBag(arena, 60000);   // mcore: the big masses again, for the mirror in the mud
  const C = { deck: col('#6e5c4a'), white: col('#c9c3b4'), grey: col(P.grey), tar: col(P.tar), teal: col(P.teal), pink: col(P.pink), yellow: col(P.yellow), orange: col(P.orange).multiplyScalar(0.9),
    marigold: col('#f0901c'), leaf: col('#4f8a34'), leaf2: col('#9fbf4e'), rope: col('#3a3430'), pale: col('#b9b2a2'), stone: col('#8b8478'), plate: col('#857562'), timber: col('#7a5a3c'), dark: col('#3a2c28'), cream: col('#e8e4da') };
  const cloth = [C.teal, C.pink, C.yellow, col('#e8e4da'), C.orange, col('#3f6fb0'), col('#b03a4a')];
  const LAMP = new THREE.Color(5.2, 3.1, 1.2), lampG = new THREE.SphereGeometry(0.17, 6, 4);
  await ctx.yield();

  // the hull: two lofted halves either side of a flat plated panel that carries the arch
  const uv = [0, -0.025, 1, 0.5];
  for (const [a, b, capA, capB] of [[-0.5, -13 / 290, true, false], [13 / 290, 0.5, false, false]]) {
    const h = hullGeometry({ L: 290, B: 34, D: 25.2, sheer: 0.035, x0: a, x1: b, stations: 30, ring: 12, box: 9, rake: 0.45, uv, capA, capB });
    await ctx.yield();
    await painted.addSteps(ctx, h.side, trs(0, -1.2, 0), white, true); plain.add(h.deck, trs(0, -1.2, 0), C.deck); h.side.dispose(); h.deck.dispose();
    await ctx.yield();
  }
  const N = 30, inn = archOutline(N), ZF = 17.06;
  const out = []; for (let k = 0; k <= N; k++) { const t = k / N; out.push(t < 0.2 ? [-14, 24 * t / 0.2] : t > 0.8 ? [14, 24 * (1 - t) / 0.2] : [-14 + 28 * (t - 0.2) / 0.6, 24]); }
  for (const sg of [1, -1]) {
    const p = [], n = [], u = [];
    const vtx = (q) => { p.push(q[0], q[1], sg * ZF); n.push(0, 0, sg); u.push(q[0] / 290 + 0.5, q[1] / 48); };
    for (let k = 0; k < N; k++) { if (sg > 0) { vtx(inn[k]); vtx(inn[k + 1]); vtx(out[k]); vtx(out[k]); vtx(inn[k + 1]); vtx(out[k + 1]); } else { vtx(inn[k]); vtx(out[k]); vtx(inn[k + 1]); vtx(out[k]); vtx(out[k + 1]); vtx(inn[k + 1]); } }   // wound to face outward on both flanks
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
    painted.add(g, I4, white, true); g.dispose();
    for (const x of [-14, 14]) plain.box(x, 12, sg * 16.2, 0.5, 24, 1.8, C.teal);
    for (let k = 0; k < N; k++) { const a = inn[k], b = inn[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); plain.box((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, sg * 16.9, l + 0.05, 0.3, 0.5, k % 2 ? C.yellow : C.teal, 0, 0, Math.atan2(b[1] - a[1], b[0] - a[0])); }   // the plated rim of the arch
    await ctx.yield();
  }
  plain.box(0, 23.85, 0, 28, 0.3, 34, C.deck); plain.box(3.2, 19, 17.5, 0.5, 0.9, 0.9, C.grey);
  await ctx.yield();
  // real relief where the car comes close, either side of the cut on the south flank: three proud strake laps, a cast rim and an
  // eyebrow on every porthole, two scupper pipes, a marigold garland swagged round the arch, bunting out to poles in the square
  { const lap = col('#6e2a1c'), slate = col('#3a4048'), rimG = new THREE.TorusGeometry(0.42, 0.075, 4, 9), pg = new THREE.CylinderGeometry(0.17, 0.17, 0.8, 8);
    for (const sg of [-1, 1]) for (const y of [10.8, 16.2, 20.6]) plain.box(sg * 29.5, y, 17.06, 31, 0.12, 0.16, y > 18 ? slate : lap);
    await ctx.yield();
    for (const y of [13.6, 18.2]) { for (let x = -138; x < 140; x += 3.2) { if (Math.abs(x) < 12 || Math.abs(x) > 45.5) continue; plain.add(rimG, trs(x, y, 17.1), C.pale); plain.box(x, y + 0.58, 17.13, 1.1, 0.07, 0.22, C.pale); } await ctx.yield(); }
    for (const x of [-21.5, 24.5]) { plain.add(pg, trs(x, 21.9, 17.3, Math.PI / 2, 0, 0), C.grey); plain.box(x, 22.25, 17.1, 0.6, 0.12, 0.14, C.grey); }
    rimG.dispose(); pg.dispose();
    const hooks = []; for (let k = 0; k <= 6; k++) { const a = Math.PI * (0.9 - 0.8 * k / 6); hooks.push([Math.cos(a) * 10.7, 8 + Math.sin(a) * 10.7, 17.5]); }
    for (let k = 0; k < 6; k++) rib.add(sagLine(hooks[k], hooks[k + 1], 1.25, 10), 0.11, k % 2 ? C.marigold : col('#f6b23a'), [0.03, 0.03, k]);
    for (const hk of [hooks[0], hooks[6]]) { const tail = []; for (let i = 0; i <= 6; i++) tail.push([hk[0] + Math.sign(hk[0]) * 0.25 * Math.sin(i * 0.5), hk[1] - i * 1.05, hk[2] + 0.04]); rib.add(tail, 0.11, C.marigold, [0, 0.3, hk[0]]);
      plain.box(tail[6][0], tail[6][1] - 0.3, tail[6][2], 0.34, 0.6, 0.34, col('#f6b23a')); }
    for (const hk of hooks) plain.box(hk[0], hk[1] + 0.02, hk[2] - 0.2, 0.14, 0.14, 0.4, C.grey);
    await ctx.yield();
    for (const sg of [-1, 1]) { const top = [sg * 9.5, 24.6, 17.3], end = [sg * 31, 10.5, 63], l = sagLine(top, end, 2.4, 24);
      rib.add(l, 0.022, C.rope); addBunting(wind, l, cloth, 1.15, 1.0, sg * 5, opts.flagSink || null); plain.box(end[0], end[1] / 2, end[2], 0.28, end[1], 0.28, C.timber);
      rib.add([end, [end[0] + sg * 5, 0.2, end[2] + 4]], 0.016, C.rope); await ctx.yield(); } }
  await ctx.yield();
  // the cut itself: five decks in section, each a railed gallery of cabin fronts with lamps, washing and marigold garlands
  const archX = (y) => (y <= 8 ? 8 : Math.sqrt(Math.max(0, 64 - (y - 8) * (y - 8))));
  plain.box(0, 0.06, 0, 16.6, 0.12, 34.4, C.plate); plain.box(0, 16.13, 0, 25.4, 0.25, 34, C.dark);
  { const p = [], n = [], u = [];
    for (const sg of [1, -1]) for (const [z, y, uu, vv] of [[-17, 0, 0, 0], [17, 0, 1, 0], [-17, 16, 0, 1], [17, 0, 1, 0], [17, 16, 1, 1], [-17, 16, 0, 1]]) { p.push(sg * 12.6, y, z); n.push(-sg, 0, 0); u.push(sg > 0 ? uu : 1 - uu, vv); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
    const cut = new THREE.Mesh(g, cutMat); cut.receiveShadow = true; group.add(cut); }
  for (let k = 0; k < 5; k++) {
    const y = k * 3.2, e = archX(y);
    for (const sg of [1, -1]) {
      if (k > 0) {
        const x0 = e - 0.45, xr = sg * (x0 + 0.1);
        plain.box(sg * (x0 + 12.6) / 2, y - 0.125, 0, 12.6 - x0, 0.25, 34, C.deck); plain.box(sg * (x0 + 0.03), y - 0.14, 0, 0.1, 0.36, 34.04, k % 2 ? C.teal : C.yellow);
        rib.add([[xr, y + 1.05, -17], [xr, y + 1.05, 17]], 0.035, C.pale); rib.add([[xr, y + 0.55, -17], [xr, y + 0.55, 17]], 0.02, C.pale);
        for (let z = -16.5; z <= 16.6; z += 3) rib.add([[xr, y, z], [xr, y + 1.05, z]], 0.025, C.pale);
        const gl = []; for (let i = 0; i <= 68; i++) gl.push([xr - sg * 0.05, y + 1.0 - 0.3 * Math.abs(Math.sin(i * Math.PI / 4)), -17 + i * 0.5]);
        rib.add(gl, 0.05, C.marigold);
        await ctx.yield();
        for (let j = 0; j < 3; j++) { const z = -15.5 + j * 10 + rng() * 6; wind.sheet([xr - sg * 0.14, y + 1.04, z], [0, 0, 1.15], [0, -(k === 4 ? 1.1 : 1.8 + rng() * 0.6), 0], 2, 4, cloth[(rng() * cloth.length) | 0], 0.3, rng() * 6, rng() < 0.4 ? C.cream : null); }
      } else for (let j = 0; j < 3; j++) { const z = -11 + j * 11, c = cloth[(j * 2 + (sg > 0 ? 1 : 0)) % cloth.length];
        for (let q = 0; q < 5; q++) wind.sheet([sg * 8.05, 2.95, z - 1.75 + q * 0.7], [0, 0, 0.7], [-sg * 1.25, -0.55, 0], 1, 2, q % 2 ? C.cream : c, 0.1, j + q * 0.3);
        plain.box(sg * 8.6, 0.5, z, 1.0, 0.8, 2.6, C.timber); for (let q = 0; q < 4; q++) plain.box(sg * 8.5, 1.0, z - 0.9 + q * 0.6, 0.6, 0.24, 0.45, [C.marigold, C.yellow, C.leaf2, C.orange][q]); }
      for (let j = 0; j < 4; j++) plain.box(sg * (e + 0.5 + 12.6) / 2, y + 1.55, -12.6 + j * 8.4 + (rng() - 0.5) * 1.6, 12.1 - e, 2.9, 0.14, j % 2 ? C.dark : C.grey);
      for (let j = 0; j < 3; j++) { const z = -11 + j * 11 + (rng() - 0.5) * 3, x = sg * (e + 0.75); lit.add(lampG, trs(x, y + 2.5, z), LAMP); rib.add([[x, y + 2.95, z], [x, y + 2.62, z]], 0.012, C.rope); }
      await ctx.yield();
    }
    await ctx.yield();
  }

  // deckhouses stepped back in terraces: 24, 27.5, 31, 34.5 m
  const houses = [[-105, 112, 13, 24, 27.5], [-92, 100, 9, 27.5, 31], [-78, 88, 5.5, 31, 34.5], [50, 80, 4.5, 34.5, 38]];
  { const p = [], n = [], u = [];
    for (const [x0, x1, hw, y0, y1] of houses) {
      plain.box((x0 + x1) / 2, (y0 + y1) / 2, 0, x1 - x0, y1 - y0, hw * 2, C.white); mcore.box((x0 + x1) / 2, (y0 + y1) / 2, 0, x1 - x0, y1 - y0, hw * 2, C.white);
      plain.box((x0 + x1) / 2, y1 + 0.08, 0, x1 - x0 + 1.2, 0.16, hw * 2 + 1.2, C.deck);
      for (const sg of [1, -1]) { const z = sg * (hw + 0.03), q = [[x0, y0, 0.5], [x1, y0, 0.5], [x0, y1, 1], [x1, y0, 0.5], [x1, y1, 1], [x0, y1, 1]];
        for (const [x, y, v] of q) { p.push(x, y, z); n.push(0, 0, sg); u.push(x / 290 + 0.5, v); } }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
    painted.add(g, I4, white, true); g.dispose(); }
  { const tk = new THREE.CylinderGeometry(1, 1, 1, 9); for (const [x, y, z] of [[-70, 39.2, 0], [-20, 35.8, 2], [30, 35.8, -1.5], [64, 39.4, 0], [-96, 28.8, 6], [104, 28.8, -5]]) { plain.add(tk, trs(x, y + 0.6, z, 0, 0, 0, 1.3, 1.9, 1.3), z > 1 ? C.teal : C.pale); for (const dx of [-0.9, 0.9]) for (const dz of [-0.9, 0.9]) plain.box(x + dx, y - 0.7, z + dz, 0.12, 1.4, 0.12, C.grey); } tk.dispose(); }
  // terrace life: rails, marigold beds, tin cabins, banana clumps, gourd vines down the flank
  const edges = [[-140, 140, 16.6, 24], [-105, 112, 12.7, 27.5], [-92, 100, 8.7, 31], [-78, 88, 5.2, 34.5]];
  let nTer = 0;
  for (let e = 0; e < edges.length; e++) {
    const [x0, x1, ez, y] = edges[e], inner = houses[e][2];
    for (const sg of [1, -1]) {
      rib.add([[x0, y + 1.05, sg * ez], [x1, y + 1.05, sg * ez]], 0.04, C.pale); rib.add([[x0, y + 0.55, sg * ez], [x1, y + 0.55, sg * ez]], 0.022, C.pale);
      for (let x = x0; x <= x1; x += 2.8) rib.add([[x, y, sg * ez], [x, y + 1.05, sg * ez]], 0.025, C.pale);
      for (let x = x0 + 2; x < x1 - 6;) { const w = 4 + rng() * 9; if (rng() < 0.62) plain.box(x + w / 2, y + 0.35, sg * (ez - 0.5), w, 0.6, 0.7, rng() < 0.8 ? C.marigold : C.yellow); x += w + 1 + rng() * 5; }
      if (e < 3) for (let x = x0 + 4; x < x1 - 4; x += 5 + rng() * 9) {
        const z = sg * (inner + 0.8 + rng() * Math.max(0.5, ez - inner - 2.6));
        if (rng() < 0.3 && sg > 0) { const w = 2.6 + rng() * 2, c = [C.teal, C.pink, C.yellow][(rng() * 3) | 0]; plain.box(x, y + 1.25, sg * (inner + 1.3), w, 2.5, 2.2, c); plain.box(x, y + 2.6, sg * (inner + 1.5), w + 0.5, 0.1, 3, C.pale, sg * 0.12); plain.box(x - w * 0.2, y + 1.0, sg * (inner + 2.42), 0.8, 1.9, 0.06, C.dark); }
        else addBanana(wind, x, y, z, 3 + rng() * 2, rng, C.leaf, C.leaf2);
        if (++nTer % 6 === 0) await ctx.yield();
      }
      await ctx.yield();
    }
  }
  for (let i = 0; i < 16; i++) { const x = -128 + i * 17 + rng() * 6; if (Math.abs(x) < 16) continue; const l = 6 + rng() * 4, pts = [];
    for (let k = 0; k <= 6; k++) pts.push([x + Math.sin(k * 1.3 + i) * 0.5, 24.1 - l * k / 6, 17.25 + (k > 0 ? 0.12 : -0.4)]);
    rib.add(pts, 0.05, C.leaf);
    for (let k = 1; k <= 6; k++) wind.sheet([pts[k][0] - 0.45, pts[k][1] + 0.3, 17.42], [0.9, 0, 0], [0.1, -0.75, 0.1], 1, 1, k % 3 ? C.leaf : C.leaf2, 0.12, i + k);
    if (i % 2) plain.box(pts[4][0], pts[4][1], 17.6, 0.5, 0.42, 0.5, C.marigold);
    if (i % 4 === 3) await ctx.yield(); }
  await ctx.yield();
  // fourteen lifeboat balconies a side in their davits
  { const lb0 = hullGeometry({ L: 8, B: 2.8, D: 1.4, stations: 6, ring: 3, box: 2.6, rake: 0.3, capA: true }), lb = lb0;
    for (let i = 0; i < 14; i++) { await ctx.yield(); for (const sg of [1, -1]) { const x = -96 + i * 14.6;
      plain.add(lb.side, trs(x, 25.6, sg * 18.6), i % 5 === 2 ? C.white : C.orange); if (sg > 0) mcore.add(lb.side, trs(x, 25.6, sg * 18.6), i % 5 === 2 ? C.white : C.orange); plain.add(lb.deck, trs(x, 25.5, sg * 18.6), C.timber);
      for (const dx of [-2.6, 2.6]) { plain.box(x + dx, 26.6, sg * 17.7, 0.16, 3.6, 0.16, C.grey, sg * 0.5, 0, 0); rib.add([[x + dx, 28.1, sg * 18.55], [x + dx * 0.9, 27.0, sg * 18.6]], 0.015, C.rope); }
      plain.box(x + 1.6, 27.25, sg * 18.6, 0.5, 0.45, 0.5, C.marigold); plain.box(x - 1.2, 27.2, sg * 18.6, 0.4, 0.34, 0.4, C.leaf);
      if (i % 3 === 0) wind.sheet([x - 2, 27.6, sg * 18.6], [4, 0, 0], [0, -1.5, 0], 3, 2, cloth[i % cloth.length], 0.4, i); } }
    lb.side.dispose(); lb.deck.dispose(); }
  await ctx.yield();
  // funnels, masts, stays dressed with bunting
  const funnelTops = [];
  { const fg = new THREE.CylinderGeometry(3.1, 3.7, 20, 18, 6, true), pa = fg.attributes.position, cc = [];
    const c1 = col('#b0672c'), c2 = col('#d8d2c2'), c3 = col('#15161a');
    await ctx.yield();
    for (let i = 0; i < pa.count; i++) { const y = pa.getY(i), c = y > 6.5 ? c3 : y > 3 ? c2 : c1; cc.push(c.r, c.g, c.b); }
    fg.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3));
    const lip = new THREE.TorusGeometry(3.15, 0.22, 5, 18);
    for (const x of [18, -42]) { await ctx.yield(); plain.add(fg, trs(x, 46, 0, 0, 0, 0.14, 1.5, 1, 1), white); mcore.add(fg, trs(x, 46, 0, 0, 0, 0.14, 1.5, 1, 1), white); await ctx.yield(); plain.add(lip, trs(x - 1.4, 55.9, 0, Math.PI / 2 - 0, 0.14, 0, 1.5, 1, 1), c3); funnelTops.push(new THREE.Vector3(x - 1.4, 56.5, 0));
      for (const sg of [1, -1]) rib.add([[x - 1.2, 54, sg * 3], [x + 6 * sg * 0 - 9, 38.3, sg * 4.2]], 0.02, C.rope); }
    fg.dispose(); lip.dispose(); }
  await ctx.yield();
  const mastGeo = new THREE.CylinderGeometry(0.22, 0.6, 38, 6), mastheads = [];
  for (const x of [104, -98]) { plain.add(mastGeo, trs(x, 43, 0), C.pale); mcore.add(mastGeo, trs(x, 43, 0), C.pale); plain.box(x, 52, 0, 0.25, 0.25, 9, C.pale); plain.box(x, 57, 0, 0.2, 0.2, 5, C.pale); plain.box(x, 46, 0, 1.6, 0.2, 1.6, C.pale); mastheads.push(new THREE.Vector3(x, 62, 0)); }
  mastGeo.dispose();
  await ctx.yield();
  const stays = [sagLine([104, 62, 0], [152, 27.2, 0], 1.5, 12), sagLine([-98, 62, 0], [-145, 25.6, 0], 1.5, 12), sagLine([-98, 62, 0], [104, 62, 0], 9, 30),
    sagLine([104, 52, 4.4], [60, 38.2, 4.4], 0.6, 8), sagLine([-98, 52, 4.4], [-60, 34.7, 5], 0.6, 8)];
  for (let i = 0; i < stays.length; i++) { rib.add(stays[i], 0.035, C.rope); addBunting(wind, stays[i], cloth, 1.3, 0.95, i * 3, opts.flagSink || null); }
  await ctx.yield();
  // zigzag stairs up the south flank, awnings over the shell-door shopfronts
  for (const xs of [-84, -40, 40, 84]) { await ctx.yield(); for (let f = 0; f < 6; f++) {
    const d = f % 2 ? -1 : 1, y0 = f * 4 + 0.1, xa = xs - d * 3, xb = xs + d * 3, a = [xa, y0, 17.9], b = [xb, y0 + 4, 17.9];
    plain.box(xs, y0 + 2, 17.8, 7.25, 0.16, 1.1, C.pale, 0, 0, d * 0.588); plain.box(xb, y0 + 3.95, 17.8, 1.4, 0.14, 1.2, C.timber);
    rib.add([[a[0], a[1] + 1, 18.35], [b[0], b[1] + 1, 18.35]], 0.03, C.pale); rib.add([[a[0], a[1] + 0.5, 18.35], [b[0], b[1] + 0.5, 18.35]], 0.018, C.pale);
    for (let q = 0; q <= 3; q++) { const t = q / 3; rib.add([[a[0] + (b[0] - a[0]) * t, a[1] + 4 * t, 18.35], [a[0] + (b[0] - a[0]) * t, a[1] + 4 * t + 1, 18.35]], 0.02, C.pale); }
  } }
  await ctx.yield();
  for (let k = 0; k < 5; k++) for (const sg of [-1, 1]) { const x = sg * (28 + k * 22), c = cloth[(k * 2 + (sg > 0 ? 1 : 0)) % cloth.length];
    for (let q = 0; q < 6; q++) wind.sheet([x - 2.7 + q * 0.9, 4.3, 17.3], [0.9, 0, 0], [0, -1.1, 2.8], 1, 2, q % 2 ? C.cream : c, 0.12, k + q * 0.2);
    for (const dx of [-2.6, 2.6]) plain.box(x + dx, 1.6, 20, 0.1, 3.2, 0.1, C.timber);
    lit.add(lampG, trs(x, 3.3, 18.2, 0, 0, 0, 0.8, 0.8, 0.8), LAMP); if (sg > 0) await ctx.yield(); }
  await ctx.yield();
  // the square: market stalls under pitched striped awnings, and the propeller in its basin. Its deck-plate paving is drawn by the world,
  // in the same shader as the wet mud (plates, seams, standing water), so the flank, the gate's glow and the long shadows lie in it:
  // a slab of its own here hid the mirror and read as a raft over the flat.
  const PR = new THREE.Vector3(-17, 4.5, 50), stalls = [];
  await ctx.yield();
  { const heap = new THREE.SphereGeometry(1, 6, 3), goods = [C.marigold, C.yellow, col('#b8402a'), C.leaf2, col('#7a4a9a'), C.cream];
    for (let i = 0; i < 22; i++) {
      const x = (rng() < 0.5 ? -1 : 1) * (12 + rng() * 21), z = 23 + rng() * 42; if (Math.hypot(x - PR.x, z - PR.z) < 9.5) continue;
      const c = cloth[(rng() * cloth.length) | 0]; stalls.push([x, z]);
      plain.box(x, 0.45, z, 2.6, 0.9, 1.5, C.timber); plain.box(x, 0.93, z, 2.9, 0.06, 1.75, C.pale);
      for (const dx of [-1.55, 1.55]) for (const dz of [-1.2, 1.2]) plain.box(x + dx, 1.3, z + dz, 0.07, 2.6, 0.07, C.timber);
      for (let q = 0; q < 5; q++) for (const sz of [1, -1]) wind.sheet([x - 1.75 + q * 0.7, 3.3, z], [0.7, 0, 0], [0, -0.75, sz * 1.5], 1, 2, q % 2 ? C.cream : c, 0.07, i + q * 0.3);
      for (let j = 0; j < 4; j++) plain.add(heap, trs(x - 1 + j * 0.66, 0.98, z + (rng() - 0.5) * 0.5, 0, rng() * 3, 0, 0.27 + rng() * 0.1, 0.2 + rng() * 0.14, 0.27 + rng() * 0.1), goods[(rng() * goods.length) | 0]);
      lit.add(lampG, trs(x, 2.7, z, 0, 0, 0, 0.6, 0.6, 0.6), LAMP);
      if (i % 2 === 1) await ctx.yield();
    }
    heap.dispose(); }
  await ctx.yield();
  { const bw = new THREE.CylinderGeometry(6, 6.4, 0.9, 32, 1, true); plain.add(bw, trs(PR.x, 0.45, PR.z), C.stone); bw.dispose();
    const rimG = new THREE.TorusGeometry(6.02, 0.2, 5, 32); plain.add(rimG, trs(PR.x, 0.9, PR.z, Math.PI / 2, 0, 0), C.pale); rimG.dispose();
    const pl = new THREE.CylinderGeometry(0.5, 1.1, 4.5, 10); plain.add(pl, trs(PR.x, 2.25, PR.z - 1.1), C.stone); pl.dispose();
    plain.box(PR.x, 4.5, PR.z - 0.5, 0.6, 0.6, 1.6, C.stone); }
  await ctx.yield();
  { const wg = new THREE.CircleGeometry(5.95, 32), uva = wg.attributes.uv; for (let i = 0; i < uva.count; i++) uva.setXY(i, uva.getX(i) * 1.7 - 0.85, uva.getY(i) * 1.7 - 0.85);
    const water = new THREE.Mesh(wg, waterMat); water.rotation.x = -Math.PI / 2; water.position.set(PR.x, 0.72, PR.z); water.renderOrder = 0.6; group.add(water); }
  await ctx.yield();
  const prop = new THREE.Group(); prop.position.copy(PR);
  { const pb = makeBag(), bl = new THREE.SphereGeometry(1, 14, 10), pa = bl.attributes.position, cc = [], gold = col('#e0b04a'), green = col('#4f8f7a');
    for (let i = 0; i < pa.count; i++) { const e = Math.min(1, Math.hypot(pa.getX(i), pa.getY(i))), k = e * e * e, c = green.clone().lerp(gold, 0.25 + 0.75 * k); cc.push(c.r, c.g, c.b);
      const y = pa.getY(i), x = pa.getX(i); pa.setZ(i, pa.getZ(i) + x * (0.5 + y) * 1.6); pa.setX(i, x * (0.75 + 0.35 * y) - 0.18 * (1 - y * y)); }   // a skewed, twisted blade
    bl.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3)); bl.computeVertexNormals();
    await ctx.yield();
    const m = new THREE.Matrix4(), r = new THREE.Matrix4();
    for (let k = 0; k < 4; k++) { m.copy(trs(0, 2.0, 0, 0, 0.55, 0, 1.05, 1.55, 0.1)); r.makeRotationZ(k * Math.PI / 2); m.premultiply(r); pb.add(bl, m, white); await ctx.yield(); }
    pb.add(bl, trs(0, 0, 0.1, 0, 0, 0, 0.62, 0.62, 0.8), gold); bl.dispose();
    await ctx.yield();
    const pm = new THREE.Mesh(pb.build(), new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.45, roughness: 0.32, emissive: col('#6a4208'), emissiveIntensity: 0.55, side: THREE.DoubleSide }));
    pm.castShadow = true; prop.add(pm); }
  group.add(prop);
  // water sheeting off the blade tips: each strip is where the water shed over the last second and a quarter has fallen to
  const arcU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: T, uC: { value: PR.clone() }, uLight: { value: new THREE.Color(0.8, 0.86, 0.9) } };
  { const ap = [], NT = 14; for (let b = 0; b < 4; b++) for (let i = 0; i < NT; i++) for (const [di, zs] of [[0, -1], [1, -1], [0, 1], [1, -1], [1, 1], [0, 1]]) ap.push((i + di) / NT, b, zs);
    const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.Float32BufferAttribute(ap, 3));
    const arcs = new THREE.Mesh(ag, new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: arcU,
      vertexShader: `uniform float uTime; uniform vec3 uC; varying float vA; ${fx.GLSL_FOG_PARS_VERT}
        void main(){ float s = position.x, tt = 1.25*s, th = (uTime - tt)*0.6283 + 1.5708*(position.y + 1.);
          vec2 tip = 3.5*vec2(cos(th), sin(th)), vel = 2.2*vec2(-sin(th), cos(th));
          vec3 p = uC + vec3(tip + vel*tt, position.z*(0.25 + 0.5*s) + 0.15); p.y -= 4.9*tt*tt;
          vA = (1. - s)*(0.35 + 0.65*smoothstep(-0.5, 0.4, sin(th)))*smoothstep(0.6, 1.2, p.y);
          vec4 mvPosition = viewMatrix*vec4(p, 1.); gl_Position = projectionMatrix*mvPosition; ${fx.GLSL_FOG_VERT} }`,
      fragmentShader: `uniform vec3 uLight; varying float vA; ${fx.GLSL_FOG_PARS_FRAG} void main(){ gl_FragColor = vec4(fxApplyFog(uLight), vA*0.55); }` }));
    arcs.frustumCulled = false; arcs.renderOrder = 2; group.add(arcs); }
  await ctx.yield();
  const drops = fx.makeParticles({ rng: rng.fork('drops'), preset: 'rain', time: T, count: 220, follow: false, center: [PR.x, 3.6, PR.z], box: [8.4, 7, 2.2], velocity: [0, -7.5, 0], color: '#e4f0ff', opacity: 0.55, size: [0.02, 0.05] });
  group.add(drops.object);
  await ctx.yield();

  const paintedGeo = await painted.buildSteps(ctx), paintedMesh = new THREE.Mesh(paintedGeo, hullMat); await ctx.yield();
  const plainGeo = await plain.buildSteps(ctx), plainMesh = new THREE.Mesh(plainGeo, plainMat); await ctx.yield();
  for (const m of [paintedMesh, plainMesh]) { m.castShadow = m === paintedMesh; m.receiveShadow = true; group.add(m); }
  // the small dress casts no shadow of its own: the big masses (houses, funnels, masts) throw it through an unseen stand-in, which keeps the shadow pass light
  const coreGeo = mcore.build(), shadowMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }), caster = new THREE.Mesh(coreGeo, shadowMat); caster.castShadow = true; group.add(caster);
  await ctx.yield();
  const windMesh = new THREE.Mesh(await wind.buildSteps(ctx), windMat); await ctx.yield();
  const ribMesh = new THREE.Mesh(await rib.buildSteps(ctx), ribMat); await ctx.yield();
  windMesh.frustumCulled = false; ribMesh.frustumCulled = false; group.add(windMesh, ribMesh);
  const litMesh = new THREE.Mesh(lit.build(), litMat); group.add(litMesh); lampG.dispose();
  await ctx.yield();
  const cutLight = new THREE.PointLight('#ffb870', night ? 420 : 260, 48, 2); cutLight.position.set(0, 11, 0); group.add(cutLight);
  const emi0 = hullMat.emissiveIntensity, cut0 = cutMat.emissiveIntensity;

  return {
    object: group, radius: 150, height: 62, center: new THREE.Vector3(0, 26, 0),
    anchors: { portal: new THREE.Vector3(0, 8, 0), flyFrom: new THREE.Vector3(0, 8, 80), flyTo: new THREE.Vector3(0, 8, 0), funnelTops, mastheads, propeller: PR.clone(), archHalfWidth: 8, stalls },
    windMat, ribMat, waterMat, hullMat, texture: tex, cutLight, arcLight: arcU.uLight.value, mirror: { painted: paintedGeo, plain: coreGeo },
    update(dt, time) {
      prop.rotation.z = time * 0.6283;
      windMat.uniforms.uTime.value = time; ribMat.uniforms.uTime.value = time; waterMat.uniforms.uTime.value = time; if (!opts.time) T.value = time;
      const fl = 0.5 * Math.sin(time * 6.1) * Math.sin(time * 2.3);
      cutMat.emissiveIntensity = cut0 * (1 + 0.14 * fl); hullMat.emissiveIntensity = emi0 * (1 + 0.1 * Math.sin(time * 3.7) * Math.sin(time * 1.3)); litMat.color.setScalar(1 + 0.16 * fl);
    },
    dispose() {},
    ground: true, groundY: 0,
  };
}
