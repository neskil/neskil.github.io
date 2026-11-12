// Kit module "interior": rooms, halls, window light, furniture and domestic props.
// Everything is procedural. See docs/kit/interior.md for the API reference.
//
// Lighting model in one paragraph: an interior has no sky, so every surface made here uses
// interiorMaterial(), a MeshStandardMaterial with an injected "light rig". The rig describes the
// room's windows as periodic rows; the shader projects the sun through them analytically (sharp
// light pools with mullion shadows, coloured if the glass is stained), adds soft sky fill from
// every window, warm bounce from every pool, a hemisphere ambient, analytic corner occlusion,
// up to 8 lamp lights and 8 blob occluders. No shadow maps, no scene lights required.
import * as THREE from 'three';
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';
import { clamp, lerp, smoothstep, makeRng, makeNoise } from './core.js';

const V3 = THREE.Vector3, M4 = THREE.Matrix4;
const PI = Math.PI, TAU = Math.PI * 2;
const col = (c) => (c && c.isColor ? c : new THREE.Color(c));
const _m = new M4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new V3(), _s = new V3(), _c = new THREE.Color();
const need = (o, name) => { if (!o || typeof o.rng !== 'function') throw new Error('interior.' + name + ': opts.rng is required'); return o.rng; };

// surf attribute = (materialId + gloss, metalness, emissive, 1 - sway).
// materialId: 0 plain, 1 wood (solid grain), 2 fabric (weave + fuzz), 3 stone (speckle).
// emissive < 0 marks vertices that ignore InstancedMesh instanceColor (book pages, gilding).
export const SURF = { PLAIN: 0, WOOD: 1, FABRIC: 2, STONE: 3 };
export function surf(mat = 0, gloss = 0.2, metal = 0, emissive = 0, sway = 0) {
  return [mat + 0.02 + clamp(gloss, 0, 1) * 0.95, metal, emissive, 1 - sway];
}
const S_WOOD = surf(1, 0.38), S_WOODM = surf(1, 0.18), S_FAB = surf(2, 0.04), S_PLAIN = surf(0, 0.25), S_MATTE = surf(0, 0.06);
const S_CER = surf(0, 0.86), S_BRASS = surf(0, 0.78, 1), S_IRON = surf(0, 0.45, 0.85), S_STONE = surf(3, 0.12), S_GLOSS = surf(0, 0.7);

// ---------------------------------------------------------------------------------------------
// geometry builder: collects coloured parts into one BufferGeometry (position, normal, color, surf)
// ---------------------------------------------------------------------------------------------
export function makeBuilder() {
  // growable typed arrays (much cheaper than pushing numbers into plain arrays)
  let cap = 2048, icap = 4096, n = 0, ni = 0;
  let P = new Float32Array(cap * 3), N = new Float32Array(cap * 3), C = new Float32Array(cap * 3), S = new Float32Array(cap * 4), I = new Uint32Array(icap);
  const grown = (a, len) => { const x = new a.constructor(len); x.set(a); return x; };
  const reserve = (nv, nix) => {
    if (n + nv > cap) { while (n + nv > cap) cap *= 2; P = grown(P, cap * 3); N = grown(N, cap * 3); C = grown(C, cap * 3); S = grown(S, cap * 4); }
    if (ni + nix > icap) { while (ni + nix > icap) icap *= 2; I = grown(I, icap); }
  };
  const geometry = (p, nn, cc, ss, ii, nv) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nn, 3));
    g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); g.setAttribute('surf', new THREE.BufferAttribute(ss, 4));
    g.setIndex(new THREE.BufferAttribute(nv > 65535 ? ii : new Uint16Array(ii), 1)); g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  };
  const b = {
    get vertexCount() { return n; },
    // geo: BufferGeometry (consumed). o: { p:[x,y,z], r:[rx,ry,rz], s:number|[x,y,z], m:Matrix4, c:colour, surf:[4],
    //   grad:[y0,y1,k0,k1] (multiply colour by lerp(k0,k1) over builder-space height), tint(x,y,z,out),
    //   sway:[y0,y1,w0,w1] (per-vertex sway weight ramp over height) }
    add(geo, o = {}) {
      const m = _m;
      if (o.m) m.copy(o.m); else {
        const p = o.p || [0, 0, 0], r = o.r || [0, 0, 0], s = o.s ?? 1;
        _e.set(r[0], r[1], r[2], 'YXZ'); _q.setFromEuler(_e); _p.set(p[0], p[1], p[2]);
        if (typeof s === 'number') _s.set(s, s, s); else _s.set(s[0], s[1], s[2]);
        m.compose(_p, _q, _s);
      }
      if (o.pre) m.multiplyMatrices(o.pre, m.clone());
      const e = m.elements, pa = geo.attributes.position, na = geo.attributes.normal, ca = geo.attributes.color, sa = o.surf ? null : geo.attributes.surf;
      const e0 = e[0], e1 = e[1], e2 = e[2], e4 = e[4], e5 = e[5], e6 = e[6], e8 = e[8], e9 = e[9], e10 = e[10], e12 = e[12], e13 = e[13], e14 = e[14];
      // normal matrix (inverse transpose of upper 3x3) for non-uniform scale
      const A = e5 * e10 - e6 * e9, B = e6 * e8 - e4 * e10, Cc = e4 * e9 - e5 * e8, D = e2 * e9 - e1 * e10, E = e0 * e10 - e2 * e8, F = e1 * e8 - e0 * e9, G = e1 * e6 - e2 * e5, H = e2 * e4 - e0 * e6, K = e0 * e5 - e1 * e4;
      const det = e0 * A + e1 * B + e2 * Cc, flip = det < 0, fs = flip ? -1 : 1;
      const cc = o.c != null ? col(o.c) : null, sf = o.surf || S_PLAIN, gr = o.grad, tint = o.tint, sw = o.sway, swf = typeof sw === 'function';
      const cr = cc ? cc.r : 1, cg = cc ? cc.g : 1, cb = cc ? cc.b : 1, s0 = sf[0], s1 = sf[1], s2 = sf[2], s3 = sf[3];
      const cnt = pa.count, base = n, ix = geo.index, nix = ix ? ix.count - ix.count % 3 : cnt - cnt % 3;
      reserve(cnt, nix);
      const ps = pa.array, ns = na.array, cs = ca ? ca.array : null, ss = sa ? sa.array : null, cst = ca ? ca.itemSize : 3;
      for (let v = 0, q = base * 3, w = base * 4; v < cnt; v++, q += 3, w += 4) {
        const x = ps[v * 3], y = ps[v * 3 + 1], z = ps[v * 3 + 2];
        const X = e0 * x + e4 * y + e8 * z + e12, Y = e1 * x + e5 * y + e9 * z + e13, Z = e2 * x + e6 * y + e10 * z + e14;
        P[q] = X; P[q + 1] = Y; P[q + 2] = Z;
        const nx = ns[v * 3], ny = ns[v * 3 + 1], nz = ns[v * 3 + 2];
        const NX = A * nx + B * ny + Cc * nz, NY = D * nx + E * ny + F * nz, NZ = G * nx + H * ny + K * nz;
        const l = fs / (Math.sqrt(NX * NX + NY * NY + NZ * NZ) || 1);
        N[q] = NX * l; N[q + 1] = NY * l; N[q + 2] = NZ * l;
        let r = cr, gg = cg, bl = cb;
        if (cs) { r *= cs[v * cst]; gg *= cs[v * cst + 1]; bl *= cs[v * cst + 2]; }
        if (gr) { const k = lerp(gr[2], gr[3], smoothstep(gr[0], gr[1], Y)); r *= k; gg *= k; bl *= k; }
        if (tint) { _c.setRGB(r, gg, bl); tint(X, Y, Z, _c, x, y, z); r = _c.r; gg = _c.g; bl = _c.b; }
        C[q] = r; C[q + 1] = gg; C[q + 2] = bl;
        if (ss) { S[w] = ss[v * 4]; S[w + 1] = ss[v * 4 + 1]; S[w + 2] = ss[v * 4 + 2]; S[w + 3] = ss[v * 4 + 3]; }
        else { S[w] = s0; S[w + 1] = s1; S[w + 2] = s2; S[w + 3] = sw ? 1 - (swf ? sw(X, Y, Z) : lerp(sw[2], sw[3], clamp((Y - sw[0]) / (sw[1] - sw[0]), 0, 1))) : s3; }
      }
      const f1 = flip ? 2 : 1, f2 = flip ? 1 : 2;
      if (ix) { const arr = ix.array; for (let t = 0; t < nix; t += 3) { I[ni + t] = base + arr[t]; I[ni + t + 1] = base + arr[t + f1]; I[ni + t + 2] = base + arr[t + f2]; } }
      else for (let t = 0; t < nix; t += 3) { I[ni + t] = base + t; I[ni + t + 1] = base + t + f1; I[ni + t + 2] = base + t + f2; }
      n += cnt; ni += nix;
      return b;
    },
    // raw quad a-b-c-d (counter-clockwise seen from the normal side), flat normal
    quad(pa, pb, pc, pd, c, sf = S_PLAIN) {
      const ux = pb[0] - pa[0], uy = pb[1] - pa[1], uz = pb[2] - pa[2], vx = pd[0] - pa[0], vy = pd[1] - pa[1], vz = pd[2] - pa[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = 1 / (Math.hypot(nx, ny, nz) || 1); nx *= l; ny *= l; nz *= l;
      const cc = col(c); reserve(4, 6);
      const q4 = [pa, pb, pc, pd];
      for (let k = 0; k < 4; k++) { const p = q4[k], q = (n + k) * 3, w = (n + k) * 4; P[q] = p[0]; P[q + 1] = p[1]; P[q + 2] = p[2]; N[q] = nx; N[q + 1] = ny; N[q + 2] = nz; C[q] = cc.r; C[q + 1] = cc.g; C[q + 2] = cc.b; S[w] = sf[0]; S[w + 1] = sf[1]; S[w + 2] = sf[2]; S[w + 3] = sf[3]; }
      I[ni] = n; I[ni + 1] = n + 1; I[ni + 2] = n + 2; I[ni + 3] = n; I[ni + 4] = n + 2; I[ni + 5] = n + 3; n += 4; ni += 6; return b;
    },
    get triangles() { return ni / 3; },
    // Splits the result into `n` geometries by triangle centroid along -z (0..-len). Drawn as separate
    // meshes they sort front to back, so hidden bays of a long hall are rejected by the depth test.
    buildChunks(nc, len) {
      if (nc <= 1) return [b.build()];
      const out = [], nt = ni / 3, map = new Int32Array(n), cid = new Uint8Array(nt), count = new Uint32Array(nc);
      for (let t = 0; t < nt; t++) { const z = (P[I[t * 3] * 3 + 2] + P[I[t * 3 + 1] * 3 + 2] + P[I[t * 3 + 2] * 3 + 2]) / 3; count[cid[t] = clamp(Math.floor(-z / len * nc), 0, nc - 1)]++; }
      for (let c = 0; c < nc; c++) {
        if (!count[c]) continue;
        const mv = Math.min(n, count[c] * 3), p = new Float32Array(mv * 3), nn = new Float32Array(mv * 3), cc = new Float32Array(mv * 3), ss = new Float32Array(mv * 4), ii = new Uint32Array(count[c] * 3);
        map.fill(-1); let m = 0, k = 0;
        for (let t = 0; t < nt; t++) { if (cid[t] !== c) continue;
          for (let e = 0; e < 3; e++) { const v = I[t * 3 + e]; let w = map[v];
            if (w < 0) { w = map[v] = m++; const a = w * 3, s = v * 3; p[a] = P[s]; p[a + 1] = P[s + 1]; p[a + 2] = P[s + 2]; nn[a] = N[s]; nn[a + 1] = N[s + 1]; nn[a + 2] = N[s + 2]; cc[a] = C[s]; cc[a + 1] = C[s + 1]; cc[a + 2] = C[s + 2];
              ss[w * 4] = S[v * 4]; ss[w * 4 + 1] = S[v * 4 + 1]; ss[w * 4 + 2] = S[v * 4 + 2]; ss[w * 4 + 3] = S[v * 4 + 3]; }
            ii[k++] = w; } }
        out.push(geometry(p.slice(0, m * 3), nn.slice(0, m * 3), cc.slice(0, m * 3), ss.slice(0, m * 4), ii, m));
      }
      return out;
    },
    // buildChunks in steps, for the stepped builds (makeRoomAsync, makeFurnitureAsync): a generator that pauses (a bare `yield`)
    // after each geometry and returns the same array. Add nothing to the builder until it has finished. The per-triangle loops
    // are those of buildChunks, kept in plain functions (sortAll, chunk) rather than in the generator's own body.
    *buildChunkSteps(nc, len) {
      if (nc <= 1) { const one = [b.build()]; yield; return one; }
      const out = [], nt = ni / 3, map = new Int32Array(n), cid = new Uint8Array(nt), count = new Uint32Array(nc);
      const sortAll = () => { for (let t = 0; t < nt; t++) { const z = (P[I[t * 3] * 3 + 2] + P[I[t * 3 + 1] * 3 + 2] + P[I[t * 3 + 2] * 3 + 2]) / 3; count[cid[t] = clamp(Math.floor(-z / len * nc), 0, nc - 1)]++; } };
      const chunk = (c) => {
        const mv = Math.min(n, count[c] * 3), p = new Float32Array(mv * 3), nn = new Float32Array(mv * 3), cc = new Float32Array(mv * 3), ss = new Float32Array(mv * 4), ii = new Uint32Array(count[c] * 3);
        map.fill(-1); let m = 0, k = 0;
        for (let t = 0; t < nt; t++) { if (cid[t] !== c) continue;
          for (let e = 0; e < 3; e++) { const v = I[t * 3 + e]; let w = map[v];
            if (w < 0) { w = map[v] = m++; const a = w * 3, s = v * 3; p[a] = P[s]; p[a + 1] = P[s + 1]; p[a + 2] = P[s + 2]; nn[a] = N[s]; nn[a + 1] = N[s + 1]; nn[a + 2] = N[s + 2]; cc[a] = C[s]; cc[a + 1] = C[s + 1]; cc[a + 2] = C[s + 2];
              ss[w * 4] = S[v * 4]; ss[w * 4 + 1] = S[v * 4 + 1]; ss[w * 4 + 2] = S[v * 4 + 2]; ss[w * 4 + 3] = S[v * 4 + 3]; }
            ii[k++] = w; } }
        return geometry(p.slice(0, m * 3), nn.slice(0, m * 3), cc.slice(0, m * 3), ss.slice(0, m * 4), ii, m);
      };
      sortAll();
      for (let c = 0; c < nc; c++) { if (!count[c]) continue; out.push(chunk(c)); yield; }
      return out;
    },
    // Splits every triangle edge longer than maxEdge (longest edge first, at its midpoint) until none is left. The light
    // rig evaluates its smooth window fill per vertex, so large flat faces (floors, walls, ceilings) need a few vertices
    // across them. Both triangles at an edge split it at the same points, so no cracks open. Triangles narrower than
    // minWidth (bars, rails, mouldings) are left alone.
    tessellate(maxEdge, minWidth = 0) {
      const m2 = maxEdge * maxEdge, mids = new Map(), out = [], st = [];
      const len2 = (a, c) => { const x = P[a * 3] - P[c * 3], y = P[a * 3 + 1] - P[c * 3 + 1], z = P[a * 3 + 2] - P[c * 3 + 2]; return x * x + y * y + z * z; };
      const mid = (a, c) => {
        const lo = a < c ? a : c, hi = a < c ? c : a, key = lo * 67108864 + hi; let v = mids.get(key);
        if (v !== undefined) return v;
        reserve(1, 0); v = n++;
        for (let k = 0; k < 3; k++) { P[v * 3 + k] = (P[a * 3 + k] + P[c * 3 + k]) / 2; C[v * 3 + k] = (C[a * 3 + k] + C[c * 3 + k]) / 2; }
        const nx = N[a * 3] + N[c * 3], ny = N[a * 3 + 1] + N[c * 3 + 1], nz = N[a * 3 + 2] + N[c * 3 + 2], l = 1 / (Math.sqrt(nx * nx + ny * ny + nz * nz) || 1);
        N[v * 3] = nx * l; N[v * 3 + 1] = ny * l; N[v * 3 + 2] = nz * l;
        for (let k = 0; k < 4; k++) S[v * 4 + k] = (S[a * 4 + k] + S[c * 4 + k]) / 2;
        mids.set(key, v); return v;
      };
      for (let t = 0; t < ni; t += 3) {
        if (minWidth > 0) {
          const a = I[t] * 3, c = I[t + 1] * 3, d = I[t + 2] * 3, ux = P[c] - P[a], uy = P[c + 1] - P[a + 1], uz = P[c + 2] - P[a + 2], vx = P[d] - P[a], vy = P[d + 1] - P[a + 1], vz = P[d + 2] - P[a + 2];
          const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx, wx = vx - ux, wy = vy - uy, wz = vz - uz;
          const longest = Math.sqrt(Math.max(ux * ux + uy * uy + uz * uz, vx * vx + vy * vy + vz * vz, wx * wx + wy * wy + wz * wz));
          if (Math.sqrt(cx * cx + cy * cy + cz * cz) < minWidth * longest) { out.push(I[t], I[t + 1], I[t + 2]); continue; }
        }
        st.push(I[t], I[t + 1], I[t + 2]);
        while (st.length) {
          const c = st.pop(), bb = st.pop(), a = st.pop(), ab = len2(a, bb), bc = len2(bb, c), ca = len2(c, a), mx = Math.max(ab, bc, ca);
          if (!(mx > m2)) { out.push(a, bb, c); continue; }
          if (mx === ab) { const m = mid(a, bb); st.push(a, m, c, m, bb, c); }
          else if (mx === bc) { const m = mid(bb, c); st.push(a, bb, m, a, m, c); }
          else { const m = mid(c, a); st.push(a, bb, m, m, bb, c); }
        }
      }
      ni = out.length; if (ni > icap) { while (ni > icap) icap *= 2; } I = new Uint32Array(icap); I.set(out);
      return b;
    },
    // tessellate in steps (see buildChunkSteps): a generator that pauses each time at least 2048 more triangles have been written,
    // and returns the builder. Same splits in the same order, so the same vertices and triangles.
    *tessellateSteps(maxEdge, minWidth = 0) {
      const m2 = maxEdge * maxEdge, mids = new Map(), out = [], st = [];
      const len2 = (a, c) => { const x = P[a * 3] - P[c * 3], y = P[a * 3 + 1] - P[c * 3 + 1], z = P[a * 3 + 2] - P[c * 3 + 2]; return x * x + y * y + z * z; };
      const mid = (a, c) => {
        const lo = a < c ? a : c, hi = a < c ? c : a, key = lo * 67108864 + hi; let v = mids.get(key);
        if (v !== undefined) return v;
        reserve(1, 0); v = n++;
        for (let k = 0; k < 3; k++) { P[v * 3 + k] = (P[a * 3 + k] + P[c * 3 + k]) / 2; C[v * 3 + k] = (C[a * 3 + k] + C[c * 3 + k]) / 2; }
        const nx = N[a * 3] + N[c * 3], ny = N[a * 3 + 1] + N[c * 3 + 1], nz = N[a * 3 + 2] + N[c * 3 + 2], l = 1 / (Math.sqrt(nx * nx + ny * ny + nz * nz) || 1);
        N[v * 3] = nx * l; N[v * 3 + 1] = ny * l; N[v * 3 + 2] = nz * l;
        for (let k = 0; k < 4; k++) S[v * 4 + k] = (S[a * 4 + k] + S[c * 4 + k]) / 2;
        mids.set(key, v); return v;
      };
      // the loop of tessellate from index t on, until at least 2048 more triangles are written; returns the index it stopped at
      const some = (t) => {
        for (const stop = out.length + 6144; t < ni && out.length < stop; t += 3) {
          if (minWidth > 0) {
            const a = I[t] * 3, c = I[t + 1] * 3, d = I[t + 2] * 3, ux = P[c] - P[a], uy = P[c + 1] - P[a + 1], uz = P[c + 2] - P[a + 2], vx = P[d] - P[a], vy = P[d + 1] - P[a + 1], vz = P[d + 2] - P[a + 2];
            const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx, wx = vx - ux, wy = vy - uy, wz = vz - uz;
            const longest = Math.sqrt(Math.max(ux * ux + uy * uy + uz * uz, vx * vx + vy * vy + vz * vz, wx * wx + wy * wy + wz * wz));
            if (Math.sqrt(cx * cx + cy * cy + cz * cz) < minWidth * longest) { out.push(I[t], I[t + 1], I[t + 2]); continue; }
          }
          st.push(I[t], I[t + 1], I[t + 2]);
          while (st.length) {
            const c = st.pop(), bb = st.pop(), a = st.pop(), ab = len2(a, bb), bc = len2(bb, c), ca = len2(c, a), mx = Math.max(ab, bc, ca);
            if (!(mx > m2)) { out.push(a, bb, c); continue; }
            if (mx === ab) { const m = mid(a, bb); st.push(a, m, c, m, bb, c); }
            else if (mx === bc) { const m = mid(bb, c); st.push(a, bb, m, a, m, c); }
            else { const m = mid(c, a); st.push(a, bb, m, m, bb, c); }
          }
        }
        return t;
      };
      for (let t = 0; t < ni;) { t = some(t); yield; }
      ni = out.length; if (ni > icap) { while (ni > icap) icap *= 2; } I = new Uint32Array(icap); I.set(out);
      return b;
    },
    // Reorders the triangles by descending z. Rooms are entered at z = 0 and flown towards -z, so this draws the
    // triangles of a merged mesh roughly front to back and lets the depth test reject hidden surfaces early.
    sortByDepth() {
      const nt = ni / 3; if (nt < 2) return b;
      const key = new Float64Array(nt);
      let zmin = Infinity, zmax = -Infinity; for (let v = 2; v < n * 3; v += 3) { if (P[v] < zmin) zmin = P[v]; if (P[v] > zmax) zmax = P[v]; }
      const sc = 1048575 / Math.max(zmax - zmin, 1e-9);
      for (let t = 0; t < nt; t++) { const z = (P[I[t * 3] * 3 + 2] + P[I[t * 3 + 1] * 3 + 2] + P[I[t * 3 + 2] * 3 + 2]) / 3; key[t] = Math.floor((zmax - z) * sc) * 4194304 + t; }
      key.sort();
      const J = new Uint32Array(icap);
      for (let k = 0; k < nt; k++) { const t = key[k] % 4194304; J[k * 3] = I[t * 3]; J[k * 3 + 1] = I[t * 3 + 1]; J[k * 3 + 2] = I[t * 3 + 2]; }
      I = J;
      return b;
    },
    // sortByDepth in steps (see buildChunkSteps): a generator that pauses once the keys are worked out and again once they are
    // sorted, and returns the builder. The triangle order it leaves is the same.
    *sortByDepthSteps() {
      const nt = ni / 3; if (nt < 2) return b;
      const key = new Float64Array(nt);
      const keys = () => {
        let zmin = Infinity, zmax = -Infinity; for (let v = 2; v < n * 3; v += 3) { if (P[v] < zmin) zmin = P[v]; if (P[v] > zmax) zmax = P[v]; }
        const sc = 1048575 / Math.max(zmax - zmin, 1e-9);
        for (let t = 0; t < nt; t++) { const z = (P[I[t * 3] * 3 + 2] + P[I[t * 3 + 1] * 3 + 2] + P[I[t * 3 + 2] * 3 + 2]) / 3; key[t] = Math.floor((zmax - z) * sc) * 4194304 + t; }
      };
      const reorder = () => {
        const J = new Uint32Array(icap);
        for (let k = 0; k < nt; k++) { const t = key[k] % 4194304; J[k * 3] = I[t * 3]; J[k * 3 + 1] = I[t * 3 + 1]; J[k * 3 + 2] = I[t * 3 + 2]; }
        I = J;
      };
      keys(); yield; key.sort(); yield; reorder();
      return b;
    },
    build() { return geometry(P.slice(0, n * 3), N.slice(0, n * 3), C.slice(0, n * 3), S.slice(0, n * 4), I.slice(0, ni), n); },
  };
  return b;
}

// ---------- primitive shapes (plain BufferGeometry with position + normal) ----------
// Box with bevelled edges whose normals blend between faces: reads as rounded in 44 triangles.
function bevelBox(w, h, d, r = 0.02) {
  const hh = [w / 2, h / 2, d / 2]; r = Math.min(r, hh[0] * 0.98, hh[1] * 0.98, hh[2] * 0.98);
  const P = [], N = [], I = [];
  const id = (ax, s, sj, sk) => ax * 8 + (s > 0 ? 4 : 0) + (sj > 0 ? 2 : 0) + (sk > 0 ? 1 : 0);
  for (let ax = 0; ax < 3; ax++) for (const s of [-1, 1]) for (const sj of [-1, 1]) for (const sk of [-1, 1]) {
    const j = (ax + 1) % 3, k = (ax + 2) % 3, p = [0, 0, 0], nn = [0, 0, 0];
    p[ax] = s * hh[ax]; p[j] = sj * (hh[j] - r); p[k] = sk * (hh[k] - r); nn[ax] = s;
    const o = id(ax, s, sj, sk) * 3; P[o] = p[0]; P[o + 1] = p[1]; P[o + 2] = p[2]; N[o] = nn[0]; N[o + 1] = nn[1]; N[o + 2] = nn[2];
  }
  const tri = (a, b, c) => {
    const ax = P[b * 3] - P[a * 3], ay = P[b * 3 + 1] - P[a * 3 + 1], az = P[b * 3 + 2] - P[a * 3 + 2], bx = P[c * 3] - P[a * 3], by = P[c * 3 + 1] - P[a * 3 + 1], bz = P[c * 3 + 2] - P[a * 3 + 2];
    const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    const cx = P[a * 3] + P[b * 3] + P[c * 3], cy = P[a * 3 + 1] + P[b * 3 + 1] + P[c * 3 + 1], cz = P[a * 3 + 2] + P[b * 3 + 2] + P[c * 3 + 2];
    if (nx * cx + ny * cy + nz * cz >= 0) I.push(a, b, c); else I.push(a, c, b);
  };
  const quad = (a, b, c, d2) => { tri(a, b, c); tri(a, c, d2); };
  for (let ax = 0; ax < 3; ax++) for (const s of [-1, 1]) quad(id(ax, s, -1, -1), id(ax, s, 1, -1), id(ax, s, 1, 1), id(ax, s, -1, 1));
  // edges: between face (ax,s) and face (j,sj), running along k
  for (let ax = 0; ax < 3; ax++) { const j = (ax + 1) % 3; for (const s of [-1, 1]) for (const sj of [-1, 1]) {
    // on face ax: (sj, sk=-1/+1); on face j (its own j'=k, k'=ax): (sk, s)
    quad(id(ax, s, sj, -1), id(ax, s, sj, 1), id(j, sj, 1, s), id(j, sj, -1, s));
  } }
  for (const s0 of [-1, 1]) for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) tri(id(0, s0, s1, s2), id(1, s1, s2, s0), id(2, s2, s0, s1));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
  return g;
}
const spow = (x, e) => Math.sign(x) * Math.pow(Math.abs(x), e);
// Superellipsoid cushion / pillow. e < 1 is boxier. 2*seg*seg triangles.
function cushion(w, h, d, e = 0.55, seg = 10, pinch = 0) {
  const P = [], N = [], I = [], cols = seg * 2, rows = seg;
  for (let r = 0; r <= rows; r++) { const th = (r / rows) * PI, st = Math.sin(th), ct = Math.cos(th);
    for (let c = 0; c <= cols; c++) { const ph = (c / cols) * TAU, x = st * Math.cos(ph), y = ct, z = st * Math.sin(ph);
      let px = spow(x, e) * w / 2, py = spow(y, e) * h / 2, pz = spow(z, e) * d / 2;
      if (pinch) { const cr = Math.abs(spow(x, e) * spow(z, e)); py *= 1 - pinch * cr * cr; }
      P.push(px, py, pz);
      const nx = spow(x, 2 - e) / w, ny = spow(y, 2 - e) / h, nz = spow(z, 2 - e) / d, l = 1 / (Math.hypot(nx, ny, nz) || 1);
      N.push(nx * l, ny * l, nz * l);
    } }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const a = r * (cols + 1) + c, b2 = a + cols + 1; I.push(a, a + 1, b2, a + 1, b2 + 1, b2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
  return g;
}
// Parametric sheet: fn(u,v,out[3]) for u,v in 0..1. Smooth normals. `both` duplicates the back side.
function sheet(nu, nv, fn, both = false) {
  const P = [], I = [], o = [0, 0, 0];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { fn(i / nu, j / nv, o); P.push(o[0], o[1], o[2]); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b2 = a + nu + 1; I.push(a, b2, a + 1, a + 1, b2, b2 + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  if (!both) return g;
  const n = P.length / 3, pa = g.attributes.position.array, na = g.attributes.normal.array;
  const P2 = new Float32Array(n * 6), N2 = new Float32Array(n * 6); P2.set(pa); P2.set(pa, n * 3); N2.set(na);
  for (let k = 0; k < n * 3; k++) N2[n * 3 + k] = -na[k];
  const I2 = I.slice(); for (let t = 0; t < I.length; t += 3) I2.push(I[t] + n, I[t + 2] + n, I[t + 1] + n);
  const g2 = new THREE.BufferGeometry();
  g2.setAttribute('position', new THREE.BufferAttribute(P2, 3)); g2.setAttribute('normal', new THREE.BufferAttribute(N2, 3)); g2.setIndex(I2);
  return g2;
}
// duplicates a surface with flipped winding and normals so it shows from both sides with FrontSide materials
function twoSided(g) {
  const pa = g.attributes.position.array, na = g.attributes.normal.array, n = pa.length / 3, ix = g.index ? Array.from(g.index.array) : Array.from({ length: n }, (_, i) => i);
  const P2 = new Float32Array(n * 6), N2 = new Float32Array(n * 6); P2.set(pa); P2.set(pa, n * 3); N2.set(na); for (let k = 0; k < n * 3; k++) N2[n * 3 + k] = -na[k];
  const I2 = ix.slice(); for (let t = 0; t < ix.length; t += 3) I2.push(ix[t] + n, ix[t + 2] + n, ix[t + 1] + n);
  const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.BufferAttribute(P2, 3)); o.setAttribute('normal', new THREE.BufferAttribute(N2, 3)); o.setIndex(I2); return o;
}
// reverses winding and normals in place (turns a closed shape inside out, e.g. the inside of a firebox)
function flipped(g) {
  const na = g.attributes.normal.array; for (let k = 0; k < na.length; k++) na[k] = -na[k];
  if (!g.index) g.setIndex(Array.from({ length: g.attributes.position.count }, (_, i) => i));
  const ix = g.index.array; for (let t = 0; t < ix.length; t += 3) { const q = ix[t + 1]; ix[t + 1] = ix[t + 2]; ix[t + 2] = q; }
  return g;
}
const lathe = (pts, seg = 16) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(Math.max(p[0], 1e-4), p[1])), seg);
const cyl = (rt, rb, h, seg = 12, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
const sph = (r, ws = 12, hs = 8) => new THREE.SphereGeometry(r, ws, hs);
const tube = (pts, r, seg = 12, rad = 6, closed = false) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new V3(p[0], p[1], p[2])), closed, 'catmullrom', 0.5), seg, r, rad, closed);
// turned leg profile (lathe) from y=0 to y=h
function turnedLeg(h, r, seg = 8) {
  return lathe([[r * 0.55, 0], [r * 0.75, h * 0.03], [r * 0.5, h * 0.08], [r * 0.62, h * 0.3], [r * 0.9, h * 0.55], [r * 0.6, h * 0.68], [r * 1.0, h * 0.74], [r * 1.0, h]], seg);
}
// shade a colour: h shift, s and l multipliers; returns a new THREE.Color
function tone(c, dl = 0, ds = 0, dh = 0) { const o = col(c).clone(), hsl = {}; o.getHSL(hsl); o.setHSL((hsl.h + dh + 1) % 1, clamp(hsl.s + ds, 0, 1), clamp(hsl.l + dl, 0, 1)); return o; }
const mix = (a, b, t) => col(a).clone().lerp(col(b), t);

// ---------------------------------------------------------------------------------------------
// GLSL: shared noise, window shapes, stained glass
// ---------------------------------------------------------------------------------------------
const MAX_ROWS = 6, MAX_PTS = 8, MAX_OCC = 8;

// BROUGHT IN: i_box below is the exact distance to a box in the plane as Inigo Quilez publishes it (sdBox,
// https://iquilezles.org/articles/distfunctions2d/), MIT License. The notice ships with the site in THIRD-PARTY-NOTICES.txt.
const GLSL_NOISE = /* glsl */`
float i_h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float i_h31(vec3 p){ p=fract(p*.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float i_n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(i_h21(i),i_h21(i+vec2(1.,0.)),f.x), mix(i_h21(i+vec2(0.,1.)),i_h21(i+vec2(1.,1.)),f.x), f.y); }
float i_n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(i_h31(i),i_h31(i+vec3(1.,0.,0.)),f.x), mix(i_h31(i+vec3(0.,1.,0.)),i_h31(i+vec3(1.,1.,0.)),f.x), f.y),
             mix(mix(i_h31(i+vec3(0.,0.,1.)),i_h31(i+vec3(1.,0.,1.)),f.x), mix(i_h31(i+vec3(0.,1.,1.)),i_h31(i+vec3(1.,1.,1.)),f.x), f.y), f.z); }
float i_fbm2(vec2 p){ float s=0., a=.5; for(int k=0;k<3;k++){ s+=a*i_n2(p); p=p*2.03+7.1; a*=.5; } return s/.875; }
// 1 away from a line, 0 on it; d = distance to the line centre, w = half width, fw = pixel footprint
float i_line(float d, float w, float fw){ float c=clamp(2.*w/max(fw,1e-5),0.,1.); return 1.-c*(1.-smoothstep(w-fw*.5, w+fw*.5+1e-5, d)); }
float i_box(vec2 p, vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.))+min(max(d.x,d.y),0.); }
// moving leaf / cloud shade over a window plane: p = position in the plane, d = (amount, 1 / blob size, speed); 1 = lit
float i_dapple(vec2 p, float t, vec3 d){ vec2 q=p*d.y; float w=t*d.z;
  q+=.24*vec2(sin(w*1.1+q.y*1.7),cos(w*.83+q.x*1.3));
  float n=i_n2(q+vec2(w*.11,0.))*.62+i_n2(q*2.7+vec2(3.1-w*.23,w*.17))*.38;
  return 1.-d.x*smoothstep(.38,.66,n); }
`;

// window outline: arch 0 rectangle, 1 round head, 2 pointed (gothic) head, 3 circle (rose)
const GLSL_WINDOW = /* glsl */`
float i_winSdf(vec2 p, vec2 hs, float arch){
  if(arch>2.5) return length(p)-hs.x;
  if(arch<.5) return i_box(p,hs);
  float y0, d;
  if(arch<1.5){ y0=hs.y-hs.x; if(p.y>y0) return length(vec2(p.x,p.y-y0))-hs.x; }
  else { float R=hs.x*1.7, c=R-hs.x; y0=hs.y-sqrt(R*R-c*c); if(p.y>y0) return length(vec2(abs(p.x)+c,p.y-y0))-R; }
  return max(abs(p.x)-hs.x, -hs.y-p.y);
}
`;

// cheap stand-in for the stained design, used where its light lands (pools on floors and walls): quarries of palette colours
const GLSL_STAIN_LITE = /* glsl */`
uniform vec3 uStainPal[5];
vec4 i_stainLite(vec2 p, vec2 hs, float seed){
  float cs=hs.x*.34; vec2 q=vec2(p.x+p.y,p.x-p.y)/cs; vec2 ci=floor(q), f=abs(fract(q)-.5);
  float h=i_h21(ci+seed*1.7), x=h*h*5.;
  vec3 c=mix(mix(mix(mix(uStainPal[0],uStainPal[1],step(1.2,x)),uStainPal[2],step(2.4,x)),uStainPal[3],step(3.3,x)),uStainPal[4],step(4.2,x));
  return vec4(c*(.5+fract(h*13.7)), smoothstep(.5,.4,max(f.x,f.y)));
}
`;

const GLSL_STAINED = /* glsl */`
uniform vec3 uStainPal[5];
vec3 i_stainPick(float h, float accent){
  // background quarries favour the first two colours; accents use the rest
  float x=h*mix(2.2,5.,accent);
  int k=int(clamp(x,0.,4.));
  return uStainPal[k];
}
// rgb = transmitted colour, a = 1 on glass, 0 on lead / stone tracery
vec4 i_stained(vec2 p, vec2 hs, float arch, float seed){
  float d=i_winSdf(p,hs,arch), W=hs.x*2., ld=1e3; vec3 c; float idh;
  float bw=W*.085;
  if(arch>2.5){
    // rose: centre boss, petals, outer ring of roundels
    float r=length(p)/hs.x, a=atan(p.y,p.x)/6.28318+.5;
    float n1=12., ring=r<.2?0.:(r<.56?1.:(r<.84?2.:3.));
    float sec=ring<.5?1.:(ring<1.5?n1:(ring<2.5?n1*2.:n1*2.));
    float sa=a*sec; float si=floor(sa); float fa=abs(fract(sa)-.5);
    idh=i_h21(vec2(si+ring*17.,seed+ring));
    c=i_stainPick(idh, ring<.5?1.:(ring<1.5?.75:(ring<2.5?.15:.9)));
    if(ring<.5) c=uStainPal[2]*1.3;
    float rb=ring<.5?.2:(ring<1.5?.56:(ring<2.5?.84:1.)), ra=ring<.5?0.:(ring<1.5?.2:(ring<2.5?.56:.84));
    ld=min(min(rb-r,r-ra)*hs.x, (.5-fa)/sec*6.28318*r*hs.x);
    if(ring>1.5 && ring<2.5){ // roundels between the spokes
      vec2 q=vec2((fract(sa)-.5)/sec*6.28318*r, r-.7)*hs.x; float rr=length(q)-hs.x*.085;
      if(rr<0.){ c=uStainPal[int(mod(si,3.))+2]; ld=min(ld,-rr); idh=fract(idh*7.3); } else ld=min(ld,rr);
    }
  } else if(d>-bw){
    // border band, segmented along the perimeter
    float s=(abs(p.x)>hs.x-bw*1.3 && p.y<hs.y-hs.x*1.2)?p.y:p.x*1.4+p.y*.3;
    float seg=s/(bw*1.9), si=floor(seg);
    idh=i_h21(vec2(si,seed*3.1));
    c=mod(si,2.)<.5?uStainPal[1]:uStainPal[2];
    ld=min(min(-d,d+bw), (.5-abs(fract(seg)-.5))*bw*1.9);
  } else {
    float mh=W*1.3, my=p.y+hs.y-W*.2; float mi=floor(my/mh);
    vec2 mp=vec2(p.x, (fract(my/mh)-.5)*mh); float mr=W*.34, r=length(mp);
    if(r<mr){
      float a=atan(mp.y,mp.x)/6.28318+.5, rn=r/mr;
      float ring=rn<.38?0.:1., sec=ring<.5?4.:8.;
      float sa=a*sec+mi*.25, si=floor(sa);
      idh=i_h21(vec2(si+ring*9.+mi*31.,seed));
      c=ring<.5?uStainPal[int(mod(si+mi,2.))+2]:i_stainPick(idh,.8);
      ld=min(min(mr-r, abs(rn-.38)*mr), (.5-abs(fract(sa)-.5))/sec*6.28318*r);
    } else {
      float cs=W*.17; vec2 q=vec2(p.x+p.y,p.x-p.y)/cs; vec2 ci=floor(q), f=fract(q);
      idh=i_h21(ci+seed*1.7);
      c=i_stainPick(idh, step(.86,i_h21(ci.yx+seed)));
      ld=min(min(min(f.x,1.-f.x),min(f.y,1.-f.y))*cs*.707, min(r-mr, -d-bw));
    }
  }
  float lw=W*.011;
  c*=.5+1.0*fract(idh*13.7);
  return vec4(c, smoothstep(lw*.5,lw*1.3,ld)*step(d,0.));
}
`;

// ---------------------------------------------------------------------------------------------
// GLSL: surface patterns. INT_PATTERN 0 prop (vertex colour + surf), 1 floor, 2 wall, 3 picture / rug
// ---------------------------------------------------------------------------------------------
const GLSL_PATTERN_PARS = /* glsl */`
uniform float uPatScale, uMode, uEmissiveGain; uniform vec4 uPatA, uPatB; uniform vec3 uColA, uColB, uColC, uColD;
vec3 i_woodCol(vec2 q, float id, vec3 ca, vec3 cb, float fw){
  float n=i_fbm2(vec2(q.x*24.+id*31., q.y*1.2+id*17.));
  float fade=clamp(1.-fw*70.,0.,1.);
  float rings=sin(q.x*230.+n*10.+id*40.)*.5+.5;
  vec3 c=mix(ca,cb,clamp(id*.8+n*.5-.15,0.,1.));
  c*=1.-.2*fade*rings*(.4+.6*n);
  c*=.86+.26*i_n2(vec2(q.x*3.+id*9., q.y*.3+id*5.));
  return c;
}
vec3 i_hue(float h){ return clamp(abs(fract(h+vec3(0.,.6667,.3333))*6.-3.)-1.,0.,1.); }
vec3 i_bump(vec3 N, vec3 vp, float h, float k){
  vec3 dpx=dFdx(vp), dpy=dFdy(vp); float hx=dFdx(h), hy=dFdy(h);
  vec3 r1=cross(dpy,N), r2=cross(N,dpx); float det=dot(dpx,r1);
  vec3 g=sign(det)*(hx*r1+hy*r2);
  vec3 r=abs(det)*N-k*g; float l2=dot(r,r);
  return (l2>1e-24 && l2<1e24) ? r*inversesqrt(l2) : N;
}
#if INT_PATTERN == 3 && INT_MODE == 0
vec3 i_painting(vec2 uv, float seed, float aspect, out float h){
  float s1=i_h21(vec2(seed,1.3)), s2=i_h21(vec2(seed,7.7)), s3=i_h21(vec2(seed,13.1));
  float h0=s1; vec3 c1=pow(i_hue(h0),vec3(2.))*.42+.02;
  vec3 c2=mix(vec3(.62,.5,.34), i_hue(h0+.42+s2*.16), .5)*.62;
  vec3 c3=vec3(.72,.66,.52), c4=vec3(.025,.025,.04);
  vec2 p=vec2(uv.x*aspect, uv.y); vec3 c; float st=floor(s3*4.);
  float br=i_fbm2(p*vec2(9.,34.)+seed*5.);
  if(st<.5){ // colour field
    c=mix(c1*.55,c4,.25);
    float e=(i_fbm2(p*6.+seed)-.5)*.05;
    float m1=smoothstep(.0,.035,min(min(uv.x-.1,.9-uv.x),min(uv.y-.52,.9-uv.y))+e);
    float m2=smoothstep(.0,.035,min(min(uv.x-.1,.9-uv.x),min(uv.y-.1,.44-uv.y))+e);
    c=mix(c,c2*(.8+.4*br),m1); c=mix(c,mix(c3,c1,.35+.3*s2)*(.8+.4*br),m2);
  } else if(st<1.5){ // marbled flow
    vec2 q=p*2.4+seed*3.; q+=.9*vec2(i_fbm2(q+1.7),i_fbm2(q+5.3)); q+=.4*vec2(i_fbm2(q*2.+3.1),i_fbm2(q*2.+9.2));
    float t=i_fbm2(q*1.2), t2=fract(t*5.);
    c=mix(c1,c2,smoothstep(.25,.75,t)); c=mix(c,c3,smoothstep(.55,.95,t2)*.55); c=mix(c,c4,smoothstep(.12,.0,t2)*.7);
  } else if(st<2.5){ // circles and bars
    c=c3*(.72+.2*br);
    for(int k=0;k<5;k++){ float fk=float(k);
      vec2 cc=vec2(i_h21(vec2(seed+fk,2.1))*aspect, i_h21(vec2(seed+fk,4.9))); float rr=.08+.2*i_h21(vec2(seed+fk,8.3));
      float dd=length(p-cc)-rr; vec3 kc=k==0?c1:(k==1?c2:(k==2?c4:(k==3?c1*1.6:c2*.6)));
      c=mix(c,kc,smoothstep(.006,0.,dd)*.92); c=mix(c,c4,smoothstep(.006,0.,abs(dd)-.004)*.6);
    }
    float bl=abs((p.x-aspect*.5)*(.5+s2)+(p.y-.5)*(1.2-s2)-.05)-.012; c=mix(c,c4,smoothstep(.004,0.,bl));
  } else { // landscape
    float hz=.42+.15*s2; c=mix(mix(c2*1.5,vec3(.9,.7,.45),.4), c1*.9+.03, smoothstep(hz-.05,1.,uv.y));
    vec2 sp=vec2(aspect*(.3+.4*s1),hz+.16); c=mix(c,vec3(1.3,1.05,.7),smoothstep(.055,.045,length(p-sp)));
    c+=vec3(.5,.3,.1)*exp(-length(p-sp)*5.)*.6;
    for(int k=0;k<4;k++){ float fk=float(k); float hh=hz-.09*fk+.1*(i_fbm2(vec2(p.x*(1.5+fk)+seed*9.+fk*13.,fk))-.5)*(1.+fk*.4);
      c=mix(c,mix(c1*.7,c4,fk/3.5),smoothstep(.004,-.004,uv.y-hh)); }
  }
  c*=.84+.3*br; h=br*.0015;
  return c;
}
#endif
#if INT_PATTERN == 3 && INT_MODE == 1
vec3 i_rug(vec2 uv, float seed, float aspect, out float h){
  float K=70.; vec2 hf=vec2(aspect,1.)*.5; vec2 p=(uv-.5)*vec2(aspect,1.);
  if(abs(p.x)>hf.x){ float th=abs(fract(p.y*K*1.6)-.5); h=th*.002; return vec3(.6,.54,.4)*(.55+.9*th); } // fringe
  vec2 pk=(floor(p*K)+.5)/K; vec2 ap=abs(pk);
  float e=min(hf.x-ap.x, hf.y-ap.y); // distance in from the edge
  vec3 A=uColA, B=uColB, C=uColC, D=uColD, c;
  float along=(hf.x-ap.x<hf.y-ap.y)?pk.y:pk.x;
  if(e<.018) c=B*.6;
  else if(e<.045){ float m=abs(fract(along*14.)-.5)*2.; c=mix(C,A,step(.5,m)); }
  else if(e<.13){ float t=fract(along*5.5)-.5; float dd=abs(t)+abs((e-.0875)*5.5); c=B; c=mix(c,D,step(dd,.34)); c=mix(c,A,step(dd,.2)); c=mix(c,C,step(dd,.08)); }
  else if(e<.152) c=D;
  else if(e<.166) c=B*.6;
  else {
    c=A; vec2 fh=hf-.166;
    // lattice
    vec2 lq=pk*7.5; vec2 lf=abs(fract(lq)-.5); float ld=lf.x+lf.y; float par=mod(floor(lq.x)+floor(lq.y),2.);
    c=mix(c,mix(D,B,par)*.9,step(ld,.2)*.75); c=mix(c,C,step(ld,.07));
    // medallion
    float m=ap.x/(fh.x*.62)+ap.y/(fh.y*.8);
    if(m<1.){ float rg=floor(m*5.); c=rg<.5?D:(rg<1.5?B:(rg<2.5?C:(rg<3.5?A*1.25:B)));
      float st=abs(fract(m*5.)-.5); c=mix(c,B*.5,step(.42,st)*.6);
      if(rg>2.5&&rg<3.5){ float pe=abs(fract((pk.x+pk.y)*9.)-.5)+abs(fract((pk.x-pk.y)*9.)-.5); c=mix(c,D,step(pe,.3)); } }
    // corner spandrels
    vec2 cq=(fh-ap); float sm=cq.x/(fh.x*.42)+cq.y/(fh.y*.42);
    if(sm<1.){ float rg=floor(sm*4.); c=rg<.5?D:(rg<1.5?B:(rg<2.5?C:B)); }
  }
  vec2 kf=fract(p*K)-.5; float knot=1.-.22*dot(kf,kf)*4.;
  float pile=i_n2(p*40.+seed)*.5+i_n2(p*9.+seed*3.)*.5;
  c*=knot*(.78+.36*pile); h=pile*.004;
  return c;
}
#endif
`;

// runs right after <color_fragment>; defines iGloss, iMetal, iH (bump height in pattern metres), iEmis, iMat.
// Modes are compile-time (INT_MODE) so that only the code of the chosen pattern exists in the program.
const GLSL_PATTERN_MAIN = /* glsl */`
float iGloss=.2, iMetal=0., iH=0., iMat=0., iBumpK=1.; vec3 iEmis=vec3(0.);
#if INT_PATTERN == 0
{
  float sx=vSurf.x; iMat=floor(sx); iGloss=clamp((sx-iMat-.02)/.95,0.,1.); iMetal=vSurf.y;
  iEmis=diffuseColor.rgb*max(vSurf.z,0.)*uEmissiveGain;
  vec3 p=vObjPos/uPatScale; float fw=length(fwidth(p)); iBumpK=clamp(1.-fw*40.,0.,1.);
  float n1=i_n3(p*6.), n2=i_n2(p.xy*vec2(1.1,3.)+p.z*vec2(.7,3.)+uPatB.w);
  float isWood=step(.5,iMat)*step(iMat,1.5), isFab=step(1.5,iMat)*step(iMat,2.5), isStone=step(2.5,iMat);
  // solid wood: rings around the x axis with a long figure along x
  vec3 wp=p*vec3(.35,1.,1.)+uPatB.w;
  float r=length(wp.yz+vec2(.37,.11))*26.+n2*5.;
  float ring=smoothstep(0.,.75,abs(fract(r)-.5)*2.);
  float fadeW=clamp(1.-fw*45.,0.,1.);
  float wood=mix(1.,.86+.2*ring,fadeW)*(.9+.2*n2);
  // fabric weave
  vec3 q=p*380.; float wv=sin(q.x)*sin(q.y+q.z)+sin(q.z*.97+1.)*sin(q.y*1.03);
  float fadeF=clamp(1.-fw*320.,0.,1.);
  float fab=(1.+.1*wv*fadeF)*(.9+.2*n1);
  // stone
  float ns=n1*.6+n2*.4; float vein=pow(1.-abs(sin(p.x*5.+p.y*3.+p.z*4.+ns*7.)),10.);
  float sto=.8+.4*ns-.18*vein*clamp(1.-fw*30.,0.,1.);
  float plain=.94+.12*n1;
  diffuseColor.rgb*=mix(mix(mix(plain,wood,isWood),fab,isFab),sto,isStone);
  iGloss*=mix(mix(1.,.8+.3*ring*fadeW,isWood),.7+.5*ns,isStone);
  iH=isWood*ring*.0006*fadeW+isFab*wv*.00025*fadeF+isStone*ns*.002;
}
#elif INT_PATTERN == 1
{
  vec2 p=vObjPos.xz/uPatScale; float fw=length(fwidth(p)); float edge=1., id=.5, cell=.14; vec2 q=p; vec3 base;
  #if INT_MODE == 0
    float bw=uPatA.x, bl=uPatA.y; float row=floor(p.x/bw); float off=i_h21(vec2(row,7.3))*bl; float seg=floor((p.y+off)/bl);
    id=i_h21(vec2(row,seg)+.5); float fx=fract(p.x/bw)*bw, fy=fract((p.y+off)/bl)*bl;
    edge=min(i_line(min(fx,bw-fx),.0016,fw), i_line(min(fy,bl-fy),.0016,fw)); q=vec2(p.x,p.y+off); cell=bw;
  #elif INT_MODE == 1
    float bw=uPatA.x, cw=bw*4.6; float ci=floor(p.x/cw); float fx=fract(p.x/cw)*cw; float dir=mod(ci,2.)<.5?1.:-1.;
    float v=p.y+dir*(fx-cw*.5); float bi=floor(v/(bw*1.4142)); id=i_h21(vec2(ci,bi)+.7); float fv=fract(v/(bw*1.4142))*bw;
    edge=min(i_line(min(fx,cw-fx),.0015,fw), i_line(min(fv,bw-fv),.0015,fw));
    q=vec2(fv+bi*bw, (p.x-dir*p.y)*.7071+ci*3.); cell=bw;
  #elif INT_MODE == 2
    float bw=uPatA.x, bs=bw*5.; vec2 c=floor(p/bs), f=fract(p/bs)*bs; float o=mod(c.x+c.y,2.);
    vec2 g=o<.5?f:f.yx; float si=floor(g.x/bw); id=i_h21(c*7.+si+.3); float fs=fract(g.x/bw)*bw;
    edge=min(i_line(min(fs,bw-fs),.0014,fw), i_line(min(min(f.x,bs-f.x),min(f.y,bs-f.y)),.0018,fw));
    q=vec2(g.x+c.x*bs, g.y+c.y*bs*1.7+si); cell=bw;
  #endif
  #if INT_MODE < 3
    id=mix(.5,id,clamp(1.6-fw/cell,0.,1.));
    base=i_woodCol(q,id,uColA,uColB,fw)*mix(.2,1.,edge);
    iH=edge*.0012;
  #elif INT_MODE == 3
    // tiles (optionally diagonal, checker, veined)
    float ts=uPatA.x; vec2 tp=p; if(uPatA.z>.5) tp=vec2(p.x+p.y,p.x-p.y)*.7071;
    vec2 c=floor(tp/ts), f=fract(tp/ts)*ts; id=i_h21(c+3.7); float chk=mod(c.x+c.y,2.);
    float d=min(min(f.x,ts-f.x),min(f.y,ts-f.y)); edge=i_line(d,uPatA.y,fw);
    float lod=clamp(1.3-fw/ts*1.6,0.,1.);
    vec3 ca=mix(uColA,uColB,mix(.5,chk,lod)*uPatA.w);
    float v=i_fbm2(tp*1.3+id*20.); float vein=pow(1.-abs(sin(tp.x*2.1+tp.y*1.3+v*7.+id*6.)),14.);
    base=ca*(.86+.2*v+.12*(id-.5)*lod); base=mix(base,uColC,vein*uPatB.y*clamp(1.-fw*25.,0.,1.));
    base=mix(uColD,base,edge); iH=smoothstep(0.,uPatA.y*3.,d)*.0015;
  #else
    // flagstones
    float rh=uPatA.x; float row=floor(p.y/rh); float sw=rh*mix(1.1,2.2,i_h21(vec2(row,1.7))); float off=i_h21(vec2(row,9.1))*sw;
    float cx=floor((p.x+off)/sw); id=i_h21(vec2(cx,row)+1.3);
    float fx=fract((p.x+off)/sw)*sw, fy=fract(p.y/rh)*rh; float wob=(i_n2(p*9.)-.5)*.014;
    float d=min(min(fx,sw-fx),min(fy,rh-fy))+wob; edge=i_line(d,uPatA.y,fw);
    float v=i_fbm2(p*2.3+id*11.); id=mix(.5,id,clamp(1.6-fw/rh,0.,1.));
    base=mix(uColA,uColB,id)*(.76+.36*v); base*=.88+.16*smoothstep(0.,.12,d);
    base=mix(uColD,base,edge); iH=smoothstep(0.,.02,d)*.004+v*.003;
  #endif
  diffuseColor.rgb=base;
  iGloss=uPatB.x*(.55+.45*i_n2(p*.8+3.))*edge;
  iBumpK=clamp(1.-fw*20.,0.,1.);
}
#elif INT_PATTERN == 2
{
  vec3 nn=normalize(vObjN); vec2 p; bool flat_=abs(nn.y)>.7;
  if(flat_) p=vObjPos.xz; else { vec3 tg=normalize(vec3(nn.z,0.,-nn.x)); p=vec2(dot(vObjPos,tg), vObjPos.y); }
  p/=uPatScale; p.y-=uPatB.z; float fw=length(fwidth(p)); vec3 base; iGloss=uPatB.x;
  #if INT_MODE == 0
    { float n=i_fbm2(p*1.6)+.3*i_n2(p*14.); base=uColA*(.9+.14*n); iH=n*.0012; }
  #elif INT_MODE == 1
    { // damask wallpaper
      vec2 cs=vec2(.46,.62)*uPatA.z; vec2 q=p/cs; q.y+=.5*mod(floor(q.x),2.); vec2 f=fract(q)-.5;
      float r=length(f*vec2(1.,.8)), a=atan(f.x,f.y);
      float m=smoothstep(.02,0.,r-(.2+.1*cos(a*4.)));
      m=max(m, smoothstep(.02,0.,abs(r-.4)-.014)*(.5+.5*cos(a*10.)));
      m*=smoothstep(.03,.06,r); m=max(m, smoothstep(.022,0.,abs(r-.035)-.01));
      vec2 fc=.5-abs(f); m=max(m, smoothstep(.02,0.,fc.x+fc.y*.8-.1));
      m*=clamp(1.5-fw*14./uPatA.z,0.,1.);
      float pap=i_n2(p*vec2(160.,30.))*.06+i_n2(p*2.)*.1;
      base=mix(uColA,uColB,m*.85)*(.9+pap); iGloss=uPatB.x+m*.3; iH=m*.0006; }
  #elif INT_MODE == 2
    { float sw=.14*uPatA.z; float f=abs(fract(p.x/sw)-.5); float m=smoothstep(.2,.2+fw/sw+.005,f);
      float thin=1.-i_line(abs(f-.12),.012,fw/sw);
      base=mix(uColA,uColB,max(m,thin*.6))*(.92+.1*i_n2(p*2.)+.04*i_n2(p*vec2(180.,20.))); }
  #elif INT_MODE == 3 || INT_MODE == 4
    { // ashlar (3) or brick (4)
      #if INT_MODE == 3
        vec2 bs=vec2(.92,.44)*uPatA.z; float mw=.006; float jit=.2;
      #else
        vec2 bs=vec2(.23,.075)*uPatA.z; float mw=.005; float jit=0.;
      #endif
      float row=floor(p.y/bs.y);
      float xo=p.x+mod(row,2.)*bs.x*.5+i_h21(vec2(row,3.))*jit; vec2 c=vec2(floor(xo/bs.x),row);
      float id=i_h21(c+2.2); float fx=fract(xo/bs.x)*bs.x, fy=fract(p.y/bs.y)*bs.y;
      float d=min(min(fx,bs.x-fx),min(fy,bs.y-fy)); float edge=i_line(d,mw,fw);
      float v=i_fbm2(p*3.+id*17.); id=mix(.5,id,clamp(1.6-fw/bs.y,0.,1.));
      base=mix(uColA,uColB,id)*(.78+.34*v); base=mix(uColD,base,edge);
      iH=smoothstep(0.,mw*2.5,d)*.004+v*.002; iGloss*=.4+.6*v; }
  #else
    { // rows of books behind the shelves of a library wall, plain wall above uPatA.w
      float sh=.37*uPatA.z; float row=floor(p.y/sh); float fy=fract(p.y/sh)*sh;
      float w0=.085*uPatA.z; float ci=floor(p.x/w0); float r1=i_h21(vec2(ci,row)+.9);
      float split=.3+.4*r1; float fx=fract(p.x/w0); float sub=step(split,fx); float id=i_h21(vec2(ci*2.+sub,row*3.1)+4.4);
      float bx=sub<.5?fx/split:(fx-split)/(1.-split); float bwid=(sub<.5?split:1.-split)*w0;
      float top=sh*(.66+.26*id);
      float lod=clamp(1.5-fw/(w0*.4),0.,1.);
      vec3 bc=id<.3?uColA:(id<.55?uColB:(id<.8?uColC:mix(uColA,uColD,.5)));
      bc*=.5+.9*fract(id*7.7);
      float gap=i_line(min(bx,1.-bx)*bwid,.0016,fw);
      float gilt=(1.-i_line(abs(fy-top*.78),.004,fw))+(1.-i_line(abs(fy-top*.2),.006,fw))*step(.5,fract(id*3.3));
      bc=mix(bc,uColD*1.6,clamp(gilt,0.,1.)*.8*lod);
      float isBook=step(fy,top)*step(.025*uPatA.z,fy);
      bc*=mix(.35,1.,gap)*(.75+.25*sin(bx*3.1416));
      base=mix(vec3(.012,.009,.007), mix(mix(uColA,uColC,.5)*.55,bc,lod), isBook);
      base=mix(base,uColD*.16,step(fy,.025*uPatA.z));
      iGloss=mix(.1,.42,isBook)+gilt*.4*lod; iMetal=clamp(gilt,0.,1.)*.7*lod*isBook;
      iH=isBook*(.012*sin(bx*3.1416))*lod;
      float above=(uPatA.w>0.&&p.y>uPatA.w)?1.:0.;
      float n=i_n2(p*1.6)+.3*i_n2(p*14.);
      base=mix(base,vec3(.5,.44,.34)*(.9+.14*n),above); iGloss=mix(iGloss,uPatB.x,above); iMetal*=1.-above; iH*=1.-above; }
  #endif
  #ifdef INT_WAINSCOT
  { // raised wood panels below the chair rail
    float wh=uPatA.x, pw=uPatA.y, sw=.085; float fu=fract(p.x/pw)*pw; float ci=floor(p.x/pw);
    float d=i_box(vec2(fu-pw*.5, p.y-wh*.5), vec2(pw*.5-sw, wh*.5-sw));
    float groove=i_line(abs(d),.004,fw);
    vec3 wc=uColC*(.92+.1*i_n2(vec2(p.x*2.+ci,p.y*30.)))*mix(.55,1.,groove)*(d<0.?1.05:.96);
    float on=(p.y<wh&&!flat_)?1.:0.;
    base=mix(base,wc,on); iGloss=mix(iGloss,uPatB.y,on);
    iH=mix(iH,smoothstep(-.035,-.005,d)*-.006+smoothstep(-.004,.004,d)*.004,on);
  }
  #endif
  diffuseColor.rgb=base*I_VCOL;
  iBumpK=clamp(1.-fw*20.,0.,1.);
}
#else
{
  float seed=floor(I_VCOL.r*997.+.5)*.37; float asp=max(floor(I_VCOL.g*400.+.5)*.01,.05);
  #if INT_MODE == 0
    diffuseColor.rgb=i_painting(vIntUv,seed,asp,iH); iGloss=.34;
  #else
    diffuseColor.rgb=i_rug(vIntUv,seed,asp,iH); iGloss=.02; iMat=2.;
  #endif
  iBumpK=clamp(1.-length(fwidth(vIntUv))*40.,0.,1.);
}
#endif
`;

// ---------------------------------------------------------------------------------------------
// GLSL: the light rig (runs after <lights_fragment_end>, everything in rig space = room local space)
// I_AR / I_AP / I_AO are replaced by the rig's row, light and occluder array sizes when the program compiles.
// ---------------------------------------------------------------------------------------------
const GLSL_RIG_PARS = /* glsl */`
uniform mat4 uRigInv; uniform float uTime;
uniform vec3 uSunDir, uSunCol, uAmbSky, uAmbGround, uRoomMin, uRoomMax; uniform vec3 uAo, uDapple; uniform float uEnvBoost;
uniform vec3 uRowO[I_AR]; uniform vec4 uRowA[I_AR], uRowU[I_AR], uRowN[I_AR], uRowS[I_AR], uRowF[I_AR], uRowB[I_AR], uRowT[I_AR], uRowL[I_AR], uRowM[I_AR], uRowK[I_AR];
uniform vec4 uPt[I_AP]; uniform vec3 uPtC[I_AP]; uniform vec4 uOcc[I_AO];
varying vec3 vRigPos, vObjPos, vObjN; varying vec4 vSurf; varying vec2 vIntUv; varying vec3 vIrr;
#ifdef DOUBLE_SIDED
varying vec3 vIrrB;
#endif
`;

// window outlines with the shape fixed at compile time (one per arch type)
const GLSL_WIN_FIXED = /* glsl */`
float i_win0(vec2 p, vec2 hs){ return max(abs(p.x)-hs.x,abs(p.y)-hs.y); }
float i_win1(vec2 p, vec2 hs){ float y0=hs.y-hs.x; return p.y>y0 ? length(vec2(p.x,p.y-y0))-hs.x : max(abs(p.x)-hs.x,-hs.y-p.y); }
float i_win2(vec2 p, vec2 hs){ float R=hs.x*1.7, c=R-hs.x, y0=hs.y-sqrt(R*R-c*c); return p.y>y0 ? length(vec2(abs(p.x)+c,p.y-y0))-R : max(abs(p.x)-hs.x,-hs.y-p.y); }
float i_win3(vec2 p, vec2 hs){ return length(p)-hs.x; }
`;

// The rig's shader code is generated per material: every window row, lamp and occluder gets its own straight-line
// block with constant uniform indices, and each row block only contains what that row needs (a sun test only when the
// sun can shine through it, the stained-glass path only for stained rows). Software renderers execute every branch of
// a shader, so this is several times faster than a generic loop.
// The smooth part of the window light (sky fill and the warm bounce off the sunlit floor) is evaluated per vertex.
// rows: [{ arch, sun, stained, refl }]
function rigVertGLSL(rows) {
  let s = /* glsl */`
{ vec3 iP=vRigPos, iN=normalize(mat3(uRigInv)*inverseTransformDirection(transformedNormal, viewMatrix));
  vec3 irr=vec3(0.), irrB=vec3(0.);
`;
  rows.forEach((r, i) => {
    s += /* glsl */`
  { vec3 Nw=uRowN[${i}].xyz, A=uRowA[${i}].xyz, U=uRowU[${i}].xyz, rel=iP-uRowO[${i}];
    float dp=dot(rel,Nw), dpp=max(dp,0.), sp=uRowA[${i}].w, cnt=uRowU[${i}].w, a=dot(rel,A), b=dot(rel,U), ext=(cnt-1.)*sp;
    // sky fill: the row acts as a strip of windows; the point sees the part of it straight across
    vec2 hs=uRowS[${i}].xy; float ae=a-clamp(a,0.,ext), area=4.*hs.x*hs.y, d2=dpp*dpp+b*b+ae*ae, id=inversesqrt(d2+1e-6);
    vec3 dir=-(Nw*dpp+U*b+A*ae)*id; float om=area*dpp*id/(d2+area)*min(1.+1.25*dpp/sp,cnt), nd=dot(iN,dir);
    irr+=uRowF[${i}].rgb*(om*max((.35+nd)/1.35,0.));
    #ifdef DOUBLE_SIDED
    irrB+=uRowF[${i}].rgb*(om*max((.35-nd)/1.35,0.));
    #endif
`;
    if (r.sun) s += /* glsl */`
    { // warm bounce from this row's light pools on the floor (uRowBO = pool offset in row coordinates, area)
      float apf=a-uRowBO[${i}].x, ape=apf-clamp(apf,0.,ext);
      vec3 bv=-A*ape+U*(uRowBO[${i}].y-b)+Nw*(uRowBO[${i}].z-dp); float b2=dot(bv,bv); vec3 bd=bv*inversesqrt(b2+1e-6);
      float ba=uRowBO[${i}].w, bk=ba*(.25+.75*max(-bd.y,0.))/(b2+ba*2.+1e-4), bn=dot(iN,bd);
      irr+=uRowB[${i}].rgb*(bk*max((.5+bn)/1.5,0.));
      #ifdef DOUBLE_SIDED
      irrB+=uRowB[${i}].rgb*(bk*max((.5-bn)/1.5,0.));
      #endif
    }
`;
    s += `  }\n`;
  });
  return s + /* glsl */`
  vIrr=irr;
  #ifdef DOUBLE_SIDED
  vIrrB=irrB;
  #endif
}
`;
}
// rows as above, np lights, no occluders, refl = window / lamp highlights on glossy surfaces
function rigMainGLSL(rows, np, no, refl, dap) {
  const anyStained = rows.some((r) => r.sun && r.stained);
  let s = /* glsl */`
{
  mat3 iRot=mat3(uRigInv);
  vec3 iN=normalize(iRot*inverseTransformDirection(normal, viewMatrix));
  vec3 iV=normalize(iRot*inverseTransformDirection(geometryViewDir, viewMatrix));
  vec3 iP=vRigPos, iR=reflect(-iV,iN);
  float al=material.roughness*material.roughness; float sn=clamp(2./(al*al+1e-4)-2.,1.,900.);
  float ndv=max(dot(iN,iV),0.); float glossF=step(material.roughness,.72);
  float snP=sn*.25+.75, specK=glossF*(snP+2.)*.0398; // Phong lobe around the reflection vector, Schlick's pow approximation
  // corner occlusion from the room box
  vec3 o1=1.-clamp((iP-uRoomMin)/uAo.x,0.,1.), o2=1.-clamp((uRoomMax-iP)/uAo.x,0.,1.); o1*=o1; o2*=o2;
  float occ=dot(o1,.5-.5*iN)+dot(o2,.5+.5*iN);
  float ao=1./(1.+uAo.y*occ*(.6+occ));
  float sunSh=1.;
  vec3 sunAcc=vec3(0.), refl=vec3(0.);
  #ifdef DOUBLE_SIDED
  vec3 irr=gl_FrontFacing?vIrr:vIrrB;
  #else
  vec3 irr=vIrr;
  #endif
`;
  // blob occluders: contact darkening + soft cast shadow in the sun
  for (let i = 0; i < no; i++) s += /* glsl */`
  { vec3 c=uOcc[${i}].xyz-iP; float r=uOcc[${i}].w, l2=dot(c,c), il=inversesqrt(l2+1e-6), l=l2*il;
    float k=clamp((r*1.5-l)/(r*1.25),0.,1.); ao*=1.-.62*k*k*clamp(dot(iN,c)*il*.6+.4,0.,1.);
    float pr=dot(c,uSunDir); float perp=sqrt(max(l2-pr*pr,0.));
    sunSh*=1.-(1.-clamp((perp-r*.55)/(r*.5+pr*.02),0.,1.))*clamp((l-r*.8)/(r*.35),0.,1.)*step(0.,pr); }
`;
  if (anyStained) s += `  vec4 stHit=vec4(0.,0.,1.,1.); vec3 stPar=vec3(0.), stTint=vec3(0.); float stM=0.;\n`;
  rows.forEach((r, i) => {
    const hl = refl && r.refl;
    if (!r.sun && !hl) return;
    s += /* glsl */`
  { vec3 Nw=uRowN[${i}].xyz, A=uRowA[${i}].xyz, U=uRowU[${i}].xyz, rel=iP-uRowO[${i}]; float dp=dot(rel,Nw);
    float sp=uRowA[${i}].w, cnt=uRowU[${i}].w; vec2 hs=uRowS[${i}].xy; float a=dot(rel,A), b=dot(rel,U);
`;
    if (r.sun) {
      s += /* glsl */`
    { // sunlight through this row: project the point along the sun direction onto the window plane
      float t=dp*uRowL[${i}].z;
      float ha=a+uRowL[${i}].x*t, hb=b+uRowL[${i}].y*t;${dap ? `
      float dpl=i_dapple(vec2(ha,hb),uTime,uDapple);` : ''}
      float k=clamp(floor(ha*uRowK[${i}].x+.5),0.,cnt-1.); ha-=k*sp;
      float soft=t*.011+.004*uPatScale, isf=.5/soft;
      float m=clamp(.5-i_win${r.arch}(vec2(ha,hb),hs)*isf,0.,1.)*clamp((1.-t*uRowL[${i}].w)*6.67,0.,1.)*step(0.,dp)${dap ? '*dpl' : ''};
`;
      if (r.stained) s += `      if(m>stM){ stM=m; stHit=vec4(ha,hb,hs); stPar=vec3(${r.arch}.,uRowB[${i}].w+k*3.7,soft); stTint=uRowT[${i}].rgb; }\n    }\n`;
      else s += /* glsl */`
      vec2 dl=(.5-abs(fract(vec2(ha,hb)*uRowM[${i}].xy+.5*uRowS[${i}].zw)-.5))*uRowM[${i}].zw; float bw=uRowF[${i}].w;
      float bar=clamp((min(dl.x,dl.y)-bw)*isf+.5,0.,1.); bar=mix(bar,.9,clamp((soft-bw*1.5)*uRowK[${i}].y,0.,1.));
      sunAcc=max(sunAcc,uRowT[${i}].rgb*(m*bar));
    }
`;
    }
    if (hl) s += /* glsl */`
    { // the nearest window of the row, mirrored in glossy surfaces
      float dpp=max(dp,0.), af=a-clamp(floor(a*uRowK[${i}].x+.5),0.,cnt-1.)*sp, area=4.*hs.x*hs.y, d2=dpp*dpp+b*b+af*af, id=inversesqrt(d2+1e-6);
      vec3 dir=-(Nw*dpp+U*b+A*af)*id; float om=area*dpp*id/(d2+area);
      float ne=min(sn,6.283/max(om,.002)), rd=max(dot(iR,dir),0.); refl+=uRowF[${i}].rgb*(glossF*min(1.,om*(ne+2.)/6.283)*rd/(ne-ne*rd+rd)); }
`;
    s += `  }\n`;
  });
  if (anyStained) s += /* glsl */`
  { // the stained design is evaluated once, for the strongest stained-glass hit found above
    vec4 sg=i_stainLite(stHit.xy,stHit.zw,stPar.y);
    float blur=smoothstep(stHit.z*.02,stHit.z*.25,stPar.z);
    sunAcc=max(sunAcc,stTint*(stM*1.6)*mix(sg.rgb*mix(.15,1.,sg.a),vec3(.5,.42,.46),blur*.6)); }
`;
  s += /* glsl */`
  vec3 dirD, dirS; float aoL=.5+.5*ao;
  { float ndl=max(dot(iN,uSunDir),0.); vec3 E=uSunCol*sunAcc*(ndl*sunSh);
    dirD=E; float rl=max(dot(iR,uSunDir),0.);
    dirS=E*((snP+2.)*.0398*rl/(snP-snP*rl+rl)); }
`;
  for (let i = 0; i < np; i++) {
    s += /* glsl */`
  { vec3 dv=uPt[${i}].xyz-iP; float d2=dot(dv,dv), x=min(d2*uPt[${i}].w,1.), y=1.-x, il=inversesqrt(d2+1e-6);
    vec3 E=uPtC[${i}]*(y*y/(1.+x*33.3)*max(dot(iN,dv)*il*.8+.2,0.)*aoL);
    dirD+=E;
`;
    if (refl) s += `    { float rl=max(dot(iR,dv)*il,0.); dirS+=E*(specK*rl/(snP-snP*rl+rl)); }\n`;
    s += `  }\n`;
  }
  s += /* glsl */`
  vec3 amb=mix(uAmbGround,uAmbSky,iN.y*.5+.5);
  vec3 lam=BRDF_Lambert(material.diffuseColor);
  float fz=1.-ndv; vec3 fuzz=(iMat>1.5&&iMat<2.5)?vec3(fz*fz*fz*.9):vec3(0.);
  reflectedLight.indirectDiffuse+=(amb+irr)*ao*lam*(1.+fuzz);
  reflectedLight.directDiffuse+=dirD*lam*(1.+fuzz*.6);
  float f5=fz*fz; f5=f5*f5*fz;
  vec3 F=material.specularColor+(1.-material.specularColor)*f5*(1.-material.roughness);
  reflectedLight.directSpecular+=dirS*F;
  vec3 env=mix(uAmbGround*1.3,uAmbSky,smoothstep(-.5,.6,iR.y))*RECIPROCAL_PI*uEnvBoost+refl;
  reflectedLight.indirectSpecular+=env*ao*EnvironmentBRDF(geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness);
}
`;
  return s;
}

const GLSL_VERT_PARS = /* glsl */`
#ifdef INT_UNIFORM_SURF
uniform vec4 uSurf;
#define surf uSurf
#else
attribute vec4 surf;
#endif
uniform mat4 uRigInv; uniform float uTime; uniform vec4 uSway; uniform float uSwayK;
uniform vec3 uRowO[I_AR]; uniform vec4 uRowA[I_AR], uRowU[I_AR], uRowN[I_AR], uRowS[I_AR], uRowF[I_AR], uRowB[I_AR], uRowBO[I_AR];
varying vec3 vRigPos, vObjPos, vObjN; varying vec4 vSurf; varying vec2 vIntUv; varying vec3 vIrr;
#ifdef DOUBLE_SIDED
varying vec3 vIrrB;
#endif
`;
const GLSL_VERT_COLOR = /* glsl */`
#if defined( USE_INSTANCING_COLOR )
  if(surf.z<-.5) vColor.rgb=color.rgb;
#endif
`;
const GLSL_VERT_BEGIN = /* glsl */`
vSurf=surf; vObjPos=position; vObjN=normal; vIntUv=uv;
{ float sw=1.-surf.w;
  if(sw>.001){ float ph=uTime*uSway.w+dot(position,vec3(1.3,.7,1.1))*uSwayK;
    transformed+=uSway.xyz*(sw*(sin(ph)+.45*sin(ph*2.3+1.7)+.25*sin(ph*4.1+.4))); } }
`;
const GLSL_VERT_END = /* glsl */`
{ vec4 iw=vec4(transformed,1.);
  #ifdef USE_INSTANCING
    iw=instanceMatrix*iw;
  #endif
  vRigPos=(uRigInv*(modelMatrix*iw)).xyz; }
`;

// ---------------------------------------------------------------------------------------------
// light rig
// ---------------------------------------------------------------------------------------------
const toV3 = (p) => (p && p.isVector3 ? p.clone() : new V3(p[0], p[1], p[2]));
const arr = (n, f) => Array.from({ length: n }, f);

export function makeLightRig(o = {}) {
  const scale = o.scale ?? 1;
  const state = {
    sunDir: (o.sunDir ? toV3(o.sunDir) : new V3(-0.5, 0.62, 0.3)).normalize(),
    sunColor: col(o.sunColor ?? '#ffe0b8').clone(), sunIntensity: o.sunIntensity ?? 16,
    bounceColor: col(o.bounceColor ?? '#9a6a40').clone(), bounce: o.bounce ?? 4.5,
    floorY: o.floorY ?? 0, fill: o.fill ?? 1, dapple: 0,
  };
  const dp0 = typeof o.dapple === 'object' && o.dapple ? o.dapple : { amount: o.dapple || 0 };
  const u = {
    uRigInv: { value: new M4() }, uTime: { value: 0 },
    uSunDir: { value: state.sunDir.clone() }, uSunCol: { value: new V3() },
    uAmbSky: { value: new V3() }, uAmbGround: { value: new V3() },
    uRoomMin: { value: new V3(-1e6, -1e6, -1e6) }, uRoomMax: { value: new V3(1e6, 1e6, 1e6) },
    uAo: { value: new V3((o.aoRadius ?? 1.1) * scale, o.aoStrength ?? 1.0, 0) }, uEnvBoost: { value: o.envBoost ?? 1.5 }, uDapple: { value: new V3(0, 1, 1) },
    uRowO: { value: arr(MAX_ROWS, () => new V3()) },
    uRowA: { value: arr(MAX_ROWS, () => new THREE.Vector4(1, 0, 0, 1)) }, uRowU: { value: arr(MAX_ROWS, () => new THREE.Vector4(0, 1, 0, 1)) },
    uRowN: { value: arr(MAX_ROWS, () => new THREE.Vector4(0, 0, 1, 0)) }, uRowS: { value: arr(MAX_ROWS, () => new THREE.Vector4(1, 1, 1, 1)) },
    uRowF: { value: arr(MAX_ROWS, () => new THREE.Vector4()) }, uRowB: { value: arr(MAX_ROWS, () => new THREE.Vector4()) },
    uRowT: { value: arr(MAX_ROWS, () => new THREE.Vector4(1, 1, 1, 1)) }, uRowL: { value: arr(MAX_ROWS, () => new THREE.Vector4(0, 0, 1, 0)) }, uRowM: { value: arr(MAX_ROWS, () => new THREE.Vector4(1, 1, 1, 1)) }, uRowK: { value: arr(MAX_ROWS, () => new THREE.Vector4(1, 1, 0, 0)) }, uRowBO: { value: arr(MAX_ROWS, () => new THREE.Vector4(0, 0, 0, 1)) },
    uPt: { value: arr(MAX_PTS, () => new THREE.Vector4(0, 0, 0, 1)) }, uPtC: { value: arr(MAX_PTS, () => new V3()) },
    uOcc: { value: arr(MAX_OCC, () => new THREE.Vector4(0, 0, 0, 1)) },
    uStainPal: { value: (o.stainPalette || ['#10389c', '#0d6b8f', '#c0121c', '#e8a013', '#1c8a3c']).map((c) => { const k = col(c); return new V3(k.r, k.g, k.b); }) },
  };
  const rows = [], lights = [], occluders = [], mats = new Set();
  const dirty = () => { for (const m of mats) m.needsUpdate = true; };
  const setAmbient = (sky, ground, k = 1) => {
    const s = col(sky), g = col(ground);
    u.uAmbSky.value.set(s.r, s.g, s.b).multiplyScalar(k); u.uAmbGround.value.set(g.r, g.g, g.b).multiplyScalar(k);
  };
  setAmbient(o.ambientSky ?? '#9db4dc', o.ambientGround ?? '#c2ab90', o.ambient ?? 1.0);

  const rig = {
    uniforms: u, rows, lights, occluders, scale, state, materials: mats,
    setAmbient,
    setBounds(min, max, floorY) { u.uRoomMin.value.copy(toV3(min)); u.uRoomMax.value.copy(toV3(max)); if (floorY != null) state.floorY = floorY; rig.refresh(); return rig; },
    setSun(dir, color, intensity) { if (dir) state.sunDir.copy(toV3(dir)).normalize(); if (color != null) state.sunColor.set(color); if (intensity != null) state.sunIntensity = intensity; dirty(); rig.refresh(); return rig; },
    // Moving leaf / cloud shade in the sunlight (pools, shafts): amount 0..1 (0 = off), size = blob size in metres x scale
    // (default 0.55), speed (default 1). Switching it on or off after the first render recompiles the materials.
    setDapple(amount = 0, size, speed) {
      const on = amount > 0; if (on !== state.dapple > 0) dirty();
      state.dapple = amount; if (size != null) state.dappleSize = size; if (speed != null) state.dappleSpeed = speed;
      u.uDapple.value.set(amount, 1 / Math.max((state.dappleSize ?? 0.55) * scale, 1e-4), state.dappleSpeed ?? 1); return rig;
    },
    // does direct sunlight enter through this row? (decides which shader code the row gets)
    rowSun(r) { const L = state.sunDir; return !!(r.sun && state.sunIntensity > 0 && L.dot(r.normal) < -0.03 && L.y > 0.05); },
    // A periodic row of identical windows. origin = centre of the first window, axis = unit direction to
    // the next one, normal = unit direction into the room. Returns the row (or null when all 6 are used).
    addWindowRow(r) {
      if (rows.length >= MAX_ROWS) return null;
      const row = {
        index: rows.length, origin: toV3(r.origin), axis: toV3(r.axis).normalize(), normal: toV3(r.normal).normalize(), up: r.up ? toV3(r.up).normalize() : new V3(0, 1, 0),
        width: r.width, height: r.height, spacing: (r.count || 1) > 1 ? r.spacing : 1e5, count: r.count || 1, arch: r.arch || 0,
        mullions: r.mullions || [2, 3], bar: r.bar ?? 0.022 * scale, sky: col(r.sky ?? '#bcd4ff').clone(), skyIntensity: r.skyIntensity ?? 5,
        tint: col(r.tint ?? '#ffffff').clone(), stained: r.stained || 0, sun: r.sun !== false, maxReach: r.maxReach ?? 1e6,
      };
      rows.push(row); dirty(); rig.refresh(); return row;
    },
    // Lamp / fire light. Returned object is live: change position, intensity, color; flicker 0..1.
    addLight(l = {}) {
      if (lights.length >= MAX_PTS) return null;
      const L = { position: toV3(l.position || [0, 0, 0]), color: col(l.color ?? '#ffb060').clone(), intensity: l.intensity ?? 6, range: l.range ?? 8 * scale, flicker: l.flicker ?? 0, phase: lights.length * 2.39 };
      lights.push(L); dirty(); return L;
    },
    addOccluder(position, radius) { if (occluders.length >= MAX_OCC) return null; const oc = { position: toV3(position), radius }; occluders.push(oc); dirty(); return oc; },
    refresh() {
      const L = state.sunDir; u.uSunDir.value.copy(L);
      u.uSunCol.value.set(state.sunColor.r, state.sunColor.g, state.sunColor.b).multiplyScalar(state.sunIntensity);
      rows.forEach((r, i) => {
        u.uRowO.value[i].copy(r.origin);
        u.uRowA.value[i].set(r.axis.x, r.axis.y, r.axis.z, r.spacing);
        u.uRowU.value[i].set(r.up.x, r.up.y, r.up.z, r.count);
        u.uRowN.value[i].set(r.normal.x, r.normal.y, r.normal.z, r.arch);
        u.uRowS.value[i].set(r.width / 2, r.height / 2, r.mullions[0], r.mullions[1]);
        const f = r.skyIntensity * state.fill;
        u.uRowF.value[i].set(r.sky.r * f, r.sky.g * f, r.sky.b * f, r.bar);
        u.uRowT.value[i].set(r.tint.r, r.tint.g, r.tint.b, r.sun ? r.maxReach : 0);
        const dn = L.dot(r.normal);
        // reciprocals the shader would otherwise compute per pixel (glazing-bar grid, spacing, bar softening)
        u.uRowM.value[i].set(r.mullions[0] / r.width, r.mullions[1] / r.height, r.width / r.mullions[0], r.height / r.mullions[1]);
        u.uRowK.value[i].set(1 / r.spacing, 1 / Math.max(r.bar * 4.5, 1e-6), 0, 0);
        // the sun direction in row coordinates: along the axis, along up, 1 / depth, 1 / reach
        u.uRowL.value[i].set(L.dot(r.axis), L.dot(r.up), -1 / Math.min(dn, -0.03), 1 / Math.max(r.maxReach, 1e-6));
        if (rig.rowSun(r)) {
          // where the middle of this window's beam lands on the floor
          let t = (r.origin.y - state.floorY) / L.y;
          const mn = u.uRoomMin.value, mx = u.uRoomMax.value;
          let bx = r.origin.x - L.x * t, bz = r.origin.z - L.z * t;
          const cx = clamp(bx, mn.x, mx.x), cz = clamp(bz, mn.z, mx.z);
          const area = Math.min(r.width * r.height * (-dn) / L.y, r.width * r.height * 4);
          const k = state.sunIntensity * L.y / PI * state.bounce * (r.stained ? 0.45 : 1);
          const ox = cx - r.origin.x, oy = state.floorY - r.origin.y, oz = cz - r.origin.z;
          u.uRowBO.value[i].set(ox * r.axis.x + oy * r.axis.y + oz * r.axis.z, ox * r.up.x + oy * r.up.y + oz * r.up.z, ox * r.normal.x + oy * r.normal.y + oz * r.normal.z, area);
          const bc = state.bounceColor, lum = (bc.r + bc.g + bc.b) / 3, br = lerp(lum, bc.r, 0.45), bg = lerp(lum, bc.g, 0.45), bb = lerp(lum, bc.b, 0.45);
          u.uRowB.value[i].set(state.sunColor.r * br * r.tint.r * k, state.sunColor.g * bg * r.tint.g * k, state.sunColor.b * bb * r.tint.b * k, r.stained);
        } else { u.uRowBO.value[i].set(0, 0, 0, 0); u.uRowB.value[i].set(0, 0, 0, r.stained); }
      });
      return rig;
    },
    // Call every frame. `object` = the Object3D whose local space the rig lives in (the room).
    update(time, object) {
      u.uTime.value = time;
      if (object) { object.updateWorldMatrix(true, false); u.uRigInv.value.copy(object.matrixWorld).invert(); }
      for (let i = 0; i < lights.length; i++) {
        const l = lights[i]; let k = l.intensity;
        if (l.flicker) { const p = l.phase; k *= 1 + l.flicker * (0.22 * Math.sin(time * 11.3 + p) + 0.16 * Math.sin(time * 17.7 + p * 2.1) + 0.12 * Math.sin(time * 31.1 + p * 3.3) + 0.14 * Math.sin(time * 4.3 + p)); }
        u.uPt.value[i].set(l.position.x, l.position.y, l.position.z, 1 / Math.max(l.range * l.range, 1e-6)); u.uPtC.value[i].set(l.color.r * k, l.color.g * k, l.color.b * k);
      }
      for (let i = 0; i < occluders.length; i++) { const oc = occluders[i]; u.uOcc.value[i].set(oc.position.x, oc.position.y, oc.position.z, oc.radius); }
    },
  };
  rig.setDapple(dp0.amount ?? 0, dp0.size, dp0.speed);
  rig.refresh();
  return rig;
}

// ---------------------------------------------------------------------------------------------
// materials
// ---------------------------------------------------------------------------------------------
const PATTERN_ID = { prop: 0, floor: 1, wall: 2, picture: 3 };
const FLOOR_MODE = { planks: 0, chevron: 1, parquet: 2, tile: 3, stone: 4 };
const WALL_MODE = { plaster: 0, wallpaper: 1, damask: 1, stripes: 2, ashlar: 3, stone: 3, brick: 4, books: 5 };

// The one material behind every surface of this module. o: { rig, pattern:'prop'|'floor'|'wall'|'picture', mode,
//   colors:[A,B,C,D], patA:[4], patB:[4], scale, color, surf:[4] (uniform surf for geometry without the attribute),
//   vertexColors, side, emissiveGain, sway:{dir:[x,y,z], amp, freq, k}, glass, opacity }
export function interiorMaterial(o = {}) {
  const rig = o.rig || makeLightRig({ ambient: 0.18, sunIntensity: 0 });
  const scale = o.scale ?? rig.scale ?? 1;
  const hasSurf = !!o.surf;
  const mat = new THREE.MeshStandardMaterial({
    color: col(o.color ?? '#ffffff'), vertexColors: o.vertexColors ?? !hasSurf, roughness: 1, metalness: 0, side: o.side ?? THREE.FrontSide,
    transparent: !!o.glass || o.opacity != null, opacity: o.opacity ?? (o.glass ? 0.16 : 1), depthWrite: !o.glass,
  });
  const pid = PATTERN_ID[o.pattern || 'prop'] ?? 0;
  mat.defines = { ...mat.defines, INT_PATTERN: pid, INT_MODE: Math.round(o.mode ?? 0) };
  if (pid === 2 && o.patA && o.patA[0] > 0) mat.defines.INT_WAINSCOT = '';
  if (hasSurf) mat.defines.INT_UNIFORM_SURF = '';
  if (o.glass) mat.defines.INT_GLASS = '';
  const C = (o.colors || []).map((c) => { const k = col(c); return new V3(k.r, k.g, k.b); });
  while (C.length < 4) C.push(new V3(0.5, 0.5, 0.5));
  const sw = o.sway || {}, sd = sw.dir || [1, 0, 0.35], amp = (sw.amp ?? 0.012) * scale;
  const own = {
    uPatScale: { value: scale }, uMode: { value: o.mode ?? 0 }, uEmissiveGain: { value: o.emissiveGain ?? 1 },
    uPatA: { value: new THREE.Vector4(...(o.patA || [0.14, 1.8, 0, 0])) }, uPatB: { value: new THREE.Vector4(...(o.patB || [0.4, 0, 0, 0])) },
    uColA: { value: C[0] }, uColB: { value: C[1] }, uColC: { value: C[2] }, uColD: { value: C[3] },
    uSway: { value: new THREE.Vector4(sd[0] * amp, sd[1] * amp, sd[2] * amp, sw.freq ?? 1.1) }, uSwayK: { value: (sw.k ?? 1.2) / scale },
    uSurf: { value: new THREE.Vector4(...(o.surf || S_PLAIN)) },
  };
  mat.userData.uniforms = own; mat.userData.rig = rig; rig.materials.add(mat);
  const refl = o.highlights ?? pid !== 2; // walls skip window / lamp highlights
  // per-row shader variants; only the most important rows are mirrored in glossy surfaces (two for floors, one for props)
  const rowFlags = () => {
    const w = rig.rows.map((r) => r.skyIntensity * r.width * r.height * Math.min(r.count, 3) * (rig.rowSun(r) ? 2 : 1));
    const top = w.map((x, i) => i).sort((a, b) => w[b] - w[a]).slice(0, pid === 1 ? 2 : 1);
    return rig.rows.map((r, i) => ({ arch: Math.round(r.arch), sun: rig.rowSun(r), stained: !!r.stained, refl: refl && top.includes(i) }));
  };
  mat.customProgramCacheKey = () => 'interior:' + pid + ':' + rowFlags().map((r) => '' + r.arch + (r.sun ? 's' : '-') + (r.stained ? 't' : '-') + (r.refl ? 'r' : '-')).join('') + ':' + (refl ? 1 : 0) + ':' + rig.lights.length + ':' + rig.occluders.length + (rig.state.dapple > 0 ? ':d' : '');
  mat.onBeforeCompile = (shader) => {
    const rf = rowFlags(), nr = rf.length, np = rig.lights.length, no = rig.occluders.length;
    Object.assign(shader.uniforms, rig.uniforms, own);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + GLSL_VERT_PARS)
      .replace('#include <color_vertex>', '#include <color_vertex>\n' + GLSL_VERT_COLOR)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + GLSL_VERT_BEGIN)
      .replace('#include <project_vertex>', GLSL_VERT_END + rigVertGLSL(rf) + '\n#include <project_vertex>');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n#ifdef USE_COLOR\n#define I_VCOL vColor.rgb\n#else\n#define I_VCOL vec3(1.)\n#endif\n' + GLSL_RIG_PARS + GLSL_NOISE + GLSL_WINDOW + GLSL_WIN_FIXED + GLSL_STAIN_LITE + GLSL_PATTERN_PARS)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + GLSL_PATTERN_MAIN)
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nroughnessFactor=clamp(mix(.96,.05,iGloss),.04,1.); metalnessFactor=clamp(iMetal,0.,1.);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nif(iBumpK>0.&&iH!=0.) normal=i_bump(normal,-vViewPosition,iH*uPatScale,iBumpK);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=iEmis;')
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + rigMainGLSL(rf, np, no, refl, rig.state.dapple > 0))
      .replace('#include <opaque_fragment>', '#ifdef INT_GLASS\ndiffuseColor.a=clamp(diffuseColor.a+dot(totalSpecular,vec3(.4)),0.,1.);\n#endif\nif(any(isnan(outgoingLight))||any(isinf(outgoingLight))) outgoingLight=vec3(0.);\n#include <opaque_fragment>');
    shader.fragmentShader = shader.fragmentShader.replace(/I_AR/g, Math.max(nr, 1)).replace(/I_AP/g, Math.max(np, 1)).replace(/I_AO/g, Math.max(no, 1));
    shader.vertexShader = shader.vertexShader.replace(/I_AR/g, Math.max(nr, 1));
  };
  return mat;
}

// Material helpers for your own geometry (no vertex colours / surf attribute needed). All take
// { rig, color, gloss, scale, side } and return a MeshStandardMaterial lit by the rig and by scene lights.
export const woodMaterial = (o = {}) => interiorMaterial({ ...o, color: o.color ?? '#6b4226', surf: surf(SURF.WOOD, o.gloss ?? 0.4) });
export const fabricMaterial = (o = {}) => interiorMaterial({ ...o, color: o.color ?? '#7a2f3a', surf: surf(SURF.FABRIC, o.gloss ?? 0.04, 0, 0, o.swayWeight ?? 0) });
export const ceramicMaterial = (o = {}) => interiorMaterial({ ...o, color: o.color ?? '#e8e2d4', surf: surf(SURF.PLAIN, o.gloss ?? 0.88) });
export const brassMaterial = (o = {}) => interiorMaterial({ ...o, color: o.color ?? '#c9973a', surf: surf(SURF.PLAIN, o.gloss ?? 0.78, 1) });
export const stoneMaterial = (o = {}) => interiorMaterial({ ...o, color: o.color ?? '#9a9084', surf: surf(SURF.STONE, o.gloss ?? 0.12) });
export const glassMaterial = (o = {}) => interiorMaterial({ ...o, color: o.color ?? '#cfe6ee', surf: surf(SURF.PLAIN, o.gloss ?? 0.97), glass: true, opacity: o.opacity ?? 0.14 });
// vertex-coloured props (anything built by the *Geometry generators below)
export const propMaterial = (o = {}) => interiorMaterial({ ...o, pattern: 'prop' });

// ---------------------------------------------------------------------------------------------
// window light: glowing panes, volumetric shafts, dust motes
// ---------------------------------------------------------------------------------------------
const FOG_ADD = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float ff=1.-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
    float ff=smoothstep(fogNear,fogFar,vFogDepth);
  #endif
  col*=1.-ff;
#endif
`;
const fogUniforms = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

function rowWindowCentre(r, k, out = new V3()) { return out.copy(r.origin).addScaledVector(r.axis, k * r.spacing); }

// One mesh with every pane of every row. The glass shows an impression of the outdoors at infinity
// (sky gradient, clouds, a tree line, the sun's glare) or a stained-glass design.
function makePanes(rig, o) {
  const P = [], AB = [], HS = [], PAR = [], SKY = [], BAR = [], NRM = [], I = [];
  let n = 0;
  for (const r of rig.rows) {
    if (r.noPane) continue;
    const depth = r.depth ?? 0;
    for (let k = 0; k < r.count; k++) {
      const c = rowWindowCentre(r, k).addScaledVector(r.normal, -depth);
      const hw = r.width / 2, hh = r.height / 2;
      for (const [sa, sb] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        P.push(c.x + r.axis.x * sa * hw + r.up.x * sb * hh, c.y + r.axis.y * sa * hw + r.up.y * sb * hh, c.z + r.axis.z * sa * hw + r.up.z * sb * hh);
        AB.push(sa * hw, sb * hh); HS.push(hw, hh); PAR.push(r.arch, r.mullions[0], r.mullions[1], r.stained ? r.stained + k * 3.7 : 0);
        const g = r.skyIntensity * (r.paneGain ?? o.paneGain ?? 0.5); SKY.push(r.sky.r * g, r.sky.g * g, r.sky.b * g); BAR.push(r.bar); NRM.push(r.normal.x, r.normal.y, r.normal.z);
      }
      // wind so the front face looks into the room: axis x up must equal normal for that
      const flip = new V3().crossVectors(r.axis, r.up).dot(r.normal) < 0;
      if (flip) I.push(n, n + 2, n + 1, n, n + 3, n + 2); else I.push(n, n + 1, n + 2, n, n + 2, n + 3);
      n += 4;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aAB', new THREE.Float32BufferAttribute(AB, 2));
  g.setAttribute('aHs', new THREE.Float32BufferAttribute(HS, 2)); g.setAttribute('aPar', new THREE.Float32BufferAttribute(PAR, 4));
  g.setAttribute('aSky', new THREE.Float32BufferAttribute(SKY, 3)); g.setAttribute('aBar', new THREE.Float32BufferAttribute(BAR, 1));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(NRM, 3)); g.setIndex(I);
  const od = o.outdoor || {};
  const cv = (c) => { const k = col(c); return new V3(k.r, k.g, k.b); };
  const uniforms = {
    ...fogUniforms(), uRigInv: rig.uniforms.uRigInv, uTime: rig.uniforms.uTime, uSunDir: rig.uniforms.uSunDir, uSunCol: rig.uniforms.uSunCol, uStainPal: rig.uniforms.uStainPal,
    uZenith: { value: cv(od.zenith ?? '#5d8fd6') }, uHorizon: { value: cv(od.horizon ?? '#e9eef2') }, uGround: { value: cv(od.ground ?? '#4d6b3a') }, uCloud: { value: cv(od.cloud ?? '#ffffff') },
    uFrost: { value: o.frost ?? 0.3 }, uScroll: { value: o.scroll ?? 0 }, uGlare: { value: o.glare ?? 1 }, uStainGain: { value: o.stainGain ?? 1 },
    uFrame: { value: cv(o.frameColor ?? '#0c0906') }, uTravel: { value: o.travel ?? 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: true, side: THREE.DoubleSide, defines: o.travel ? { PANE_TRAVEL: '' } : {},
    vertexShader: /* glsl */`
      attribute vec2 aAB, aHs; attribute vec4 aPar; attribute vec3 aSky; attribute float aBar;
      varying vec2 vAB; flat varying vec2 vHs; flat varying vec4 vPar; flat varying vec3 vSky; flat varying float vBar; varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){ vAB=aAB; vHs=aHs; vPar=aPar; vSky=aSky; vBar=aBar;
        vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vec4 mvPosition=viewMatrix*w; gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`precision highp float;
      uniform mat4 uRigInv; uniform float uTime, uFrost, uScroll, uGlare, uStainGain, uTravel; uniform vec3 uSunDir, uSunCol, uZenith, uHorizon, uGround, uCloud, uFrame;
      varying vec2 vAB; flat varying vec2 vHs; flat varying vec4 vPar; flat varying vec3 vSky; flat varying float vBar; varying vec3 vW;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}${GLSL_WINDOW}${GLSL_STAINED}
      void main(){
        vec3 rd=normalize(mat3(uRigInv)*normalize(vW-cameraPosition));
        float sd=max(dot(rd,uSunDir),0.); vec3 col;
        float fw=length(fwidth(vAB));
        #ifdef PANE_TRAVEL
        float tAx=max(abs(rd.x),.1), tTz=rd.z/tAx, tEy=rd.y/tAx, tFe=fwidth(tEy)+1e-4, tFz=fwidth(tTz)*3.+1e-4;
        #endif
        if(vPar.w>.5){
          vec4 sg=i_stained(vAB,vHs,vPar.x,vPar.w);
          float lum=dot(vSky,vec3(.33));
          float tex=.75+.5*i_n2(vAB/vHs.x*9.+vPar.w);
          col=sg.rgb*sg.a*lum*uStainGain*tex*(.75+.5*smoothstep(-vHs.y,vHs.y,vAB.y));
          float s10=sd*sd; s10=s10*s10*sd; s10*=s10; float s60=s10*s10*s10; s60*=s60;
          col+=sg.rgb*sg.a*uSunCol*(s10*.12+s60*.3)*uGlare;
          col+=uFrame*.3*(1.-sg.a);
        } else {
          float el=rd.y; float az=atan(rd.x,rd.z)+uTime*uScroll;
          vec3 sky=mix(uHorizon,uZenith,smoothstep(0.,.65,el));
          vec2 cq=vec2(az*2.2,el*5.)+vec2(uTime*.006,0.); float cl=i_n2(cq)*.62+i_n2(cq*2.3+3.7)*.38;
          sky=mix(sky,uCloud,smoothstep(.5,.8,cl)*smoothstep(-.02,.25,el)*.55);
          float hz=.03+.09*i_n2(vec2(az*7.,3.))+.02*sin(az*40.);
          vec3 gr=uGround*(.7+.3*sin(az*24.+el*30.));
          col=mix(gr,sky,smoothstep(hz-.012,hz+.012,el));
          #ifdef PANE_TRAVEL
          { // the view from a vehicle travelling towards -z along an embankment: a hedged valley floor 4 below the eye, a line
            // of trees, hills and a far ridge, each sliding past at its own parallax speed; telegraph poles beside the track
            float tz=tTz, ey=tEy, s=uTime*uTravel*4., fe=tFe;
            vec3 haze=mix(uHorizon,uZenith,.18), gA=uGround*1.05, gB=mix(uGround,vec3(.45,.32,.1),.7)*.85;
            col=sky;
            float z1=tz*320.-s, h1=8.+52.*i_n2(vec2(z1*.0022,1.7))+12.*i_n2(vec2(z1*.009,8.3));
            col=mix(col,mix(gA*.7,haze,.34),smoothstep(-fe*320.,fe*320.,h1-ey*320.));
            float z2=tz*120.-s, y2=ey*120., h2=-2.+20.*i_n2(vec2(z2*.006,4.1))+5.*i_n2(vec2(z2*.024,2.2));
            float fld=i_h21(vec2(floor(z2*.02+i_n2(vec2(y2*.2,3.))*.6),floor(y2*.13-z2*.004)));
            col=mix(col,mix(mix(gA,gB,step(.6,fld))*(.75+.4*fld),haze,.1),smoothstep(-fe*120.,fe*120.,h2-y2));
            // two overlapping rows of round crowns at the far edge of the valley floor
            float z3=tz*40.-s, y3=ey*40.+4.;
            float ca=floor(z3/3.1), fa=fract(z3/3.1)*2.-1., ha=i_h21(vec2(ca,5.)), cb=floor(z3/4.3+.4), fb=fract(z3/4.3+.4)*2.-1., hb=i_h21(vec2(cb,9.));
            float ta=step(.3,ha)*(1.5+3.8*ha)*sqrt(max(1.-fa*fa,0.)), tb=step(.45,hb)*(2.5+5.5*hb)*sqrt(max(1.-fb*fb,0.));
            vec3 c3=uGround*(ta>tb?(.42+.3*ha)*(.85+.3*fa):(.3+.3*hb)*(.85+.3*fb));
            col=mix(col,mix(c3,haze,.02),smoothstep(-fe*40.,fe*40.,.9+max(ta,tb)-y3));
            if(ey<-.05){
              float gd=4./(-ey), zg=tz*gd-s, fgd=gd*fe/(-ey), fzg=gd*tFz*.34+abs(tz)*fgd;
              float wob=.5*i_n2(vec2(gd*.05,1.)), ux=zg/18.+wob, pt=i_h21(vec2(floor(ux),floor(gd/13.)));
              vec3 gc=mix(gA,gB,smoothstep(.56,.6,pt))*(.8+.35*fract(pt*7.3))*(.86+.28*i_n2(vec2(zg*.35,gd*.35)));
              float dx=(.5-abs(fract(ux)-.5))*18., dz=(.5-abs(fract(gd/13.)-.5))*13.;
              float hedge=max(1.-smoothstep(.45,.45+fzg,dx),1.-smoothstep(.4,.4+fgd,dz));
              gc=mix(gc,uGround*.3,hedge*.85);
              col=mix(col,mix(gc,haze,clamp(gd*.0016,0.,.06)),smoothstep(44.,38.,gd)); }
            { float zp=tz*4.-s, f=fract(zp/7.)-.5, yp=ey*4., fz=tFz*1.34;
              float pole=(1.-smoothstep(.06,.06+fz,abs(f)*7.))*step(yp,3.1);
              float xb=(1.-smoothstep(.5,.5+fz,abs(f)*7.))*(1.-smoothstep(.035,.035+fe*4.,abs(yp-2.9)));
              float wy=2.9-.45*(1.-4.*f*f), wire=(1.-smoothstep(0.,fe*4.+.014,abs(yp-wy)))*.8;
              col=mix(col,vec3(.07,.055,.045),max(max(pole,xb),wire)); }
          }
          #endif
          vec3 avg=mix(uHorizon,uZenith,.35);
          #ifdef PANE_TRAVEL
          col=mix(col,avg,uFrost)*dot(vSky,vec3(.3333));
          #else
          col=mix(col,avg,uFrost)*vSky;
          #endif
          float s5=sd*sd; s5=s5*s5*sd; float s40=s5*s5; s40*=s40; s40*=s40; float s640=s40*s40; s640*=s640; s640*=s640; s640*=s640;
          col+=uSunCol*(s640*6.+s40*.22+s5*.035)*uGlare;
          vec2 q=(vAB/(2.*vHs)+.5)*vPar.yz; vec2 dl=(.5-abs(fract(q)-.5))*2.*vHs/vPar.yz;
          float bar=i_line(min(dl.x,dl.y),vBar,fw);
          col=mix(uFrame*(1.+2.*dot(vSky,vec3(.03))),col,bar);
        }
        gl_FragColor=vec4(col,1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'interior-panes';
  return { mesh, uniforms };
}

// Volumetric shafts for one row: a box per window, sheared along the sun direction. The fragment
// shader intersects the view ray with the sheared box analytically, so the glow has true thickness,
// soft silhouettes, and keeps working while the camera flies through the beam.
function makeShaftRow(rig, r, o) {
  const L = rig.state.sunDir, D = L.clone().negate();
  const mn = rig.uniforms.uRoomMin.value, mx = rig.uniforms.uRoomMax.value, fy = rig.state.floorY;
  const top = r.origin.y + Math.abs(r.up.y) * r.height / 2 + Math.abs(r.axis.y) * r.width / 2;
  const span = Math.hypot(Math.min(mx.x - mn.x, 1e5), Math.min(mx.z - mn.z, 1e5));
  const T = Math.min((top - fy) / Math.max(L.y, 0.08), isFinite(span) ? span * 1.2 : 1e4, r.maxReach ?? 1e6);
  const P = [], K = [], I = []; let n = 0;
  const hw = r.width / 2, hh = r.height / 2, c = new V3();
  for (let k = 0; k < r.count; k++) {
    rowWindowCentre(r, k, c);
    for (let i = 0; i < 8; i++) {
      const sa = i & 1 ? 1 : -1, sb = i & 2 ? 1 : -1, t = i & 4 ? T : 0;
      P.push(c.x + r.axis.x * sa * hw + r.up.x * sb * hh + D.x * t, c.y + r.axis.y * sa * hw + r.up.y * sb * hh + D.y * t, c.z + r.axis.z * sa * hw + r.up.z * sb * hh + D.z * t);
      K.push(k);
    }
    for (const f of [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]]) I.push(n + f[0], n + f[1], n + f[2], n + f[0], n + f[2], n + f[3]);
    n += 8;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 1)); g.setIndex(I);
  // make outward-facing triangles front faces whatever the handedness of (axis, up, D)
  const handed = new V3().crossVectors(r.axis, r.up).dot(D);
  const inv = new THREE.Matrix3().set(r.axis.x, r.up.x, D.x, r.axis.y, r.up.y, D.y, r.axis.z, r.up.z, D.z).invert();
  const tint = r.tint;
  const uniforms = {
    ...fogUniforms(), uRigInv: rig.uniforms.uRigInv, uTime: rig.uniforms.uTime, uSunDir: rig.uniforms.uSunDir, uSunCol: rig.uniforms.uSunCol, uStainPal: rig.uniforms.uStainPal,
    uRoomMin: rig.uniforms.uRoomMin, uRoomMax: rig.uniforms.uRoomMax, uDapple: rig.uniforms.uDapple || { value: new V3(0, 1, 1) },
    uO: { value: r.origin.clone() }, uA: { value: r.axis.clone() }, uInv: { value: inv }, uHs: { value: new THREE.Vector2(hw, hh) },
    uSp: { value: r.spacing }, uT: { value: T }, uTint: { value: new V3(tint.r, tint.g, tint.b) },
    uDens: { value: (o.shaftDensity ?? 0.06) / rig.scale }, uGain: { value: (o.shaftGain ?? 0.16) * (r.shaftGain ?? 1) * (r.stained ? 0.8 : 1) }, uFloor: { value: fy },
    uPar: { value: new THREE.Vector4(r.arch, r.stained || 0, 1 / rig.scale, handed > 0 ? -1 : 1) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute float aK; flat varying float vK; varying vec3 vW; varying float vZ; flat varying float vNear;
      #include <fog_pars_vertex>
      void main(){ vK=aK; vNear=projectionMatrix[3][2]/(projectionMatrix[2][2]-1.); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vec4 mvPosition=viewMatrix*w; vZ=-mvPosition.z; gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`precision highp float;
      uniform mat4 uRigInv; uniform mat3 uInv; uniform float uTime, uSp, uT, uDens, uGain, uFloor; uniform vec2 uHs; uniform vec4 uPar;
      uniform vec3 uSunDir, uSunCol, uO, uA, uTint, uRoomMin, uRoomMax, uDapple;
      flat varying float vK; varying vec3 vW; varying float vZ; flat varying float vNear;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      uniform vec3 uStainPal[5];
      void main(){
        vec3 ro=(uRigInv*vec4(cameraPosition,1.)).xyz, pf=(uRigInv*vec4(vW,1.)).xyz;
        vec3 rv=pf-ro; float sF=length(rv); vec3 rd=rv/sF;
        vec3 oc=uO+uA*(vK*uSp);
        vec3 so=uInv*(ro-oc), sd=uInv*rd; sd+=step(abs(sd),vec3(1e-6))*1e-6;
        vec3 t0=(vec3(-uHs,0.)-so)/sd, t1=(vec3(uHs,uT)-so)/sd; vec3 tn=min(t0,t1), tf=max(t0,t1);
        float sIn=max(max(tn.x,tn.y),tn.z), s1=min(min(tf.x,tf.y),tf.z);
        // only one of the two faces under this pixel draws: the front face normally, the back face when
        // the front one is behind the near plane (the camera is inside the beam)
        float s0=max(sIn,0.);
        vec3 rdd=rd+step(abs(rd),vec3(1e-6))*1e-6;
        vec3 r0=(uRoomMin-ro)/rdd, r1=(uRoomMax-ro)/rdd; vec3 rn=min(r0,r1), rf=max(r0,r1);
        s0=max(s0,max(max(rn.x,rn.y),rn.z)); s1=min(s1,min(min(rf.x,rf.y),rf.z));
        float len=s1-s0; if(len<=0.) discard;
        float sm=(s0+s1)*.5; vec3 mid=so+sd*sm; vec3 mp=ro+rd*sm;
        vec2 e=1.-abs(mid.xy)/uHs; float edge=smoothstep(0.,.35,min(e.x,e.y));
        float fall=exp(-mid.z/uT*1.6)*smoothstep(0.,uT*.03,mid.z+uT*.02);
        float streak=.55+.9*i_n2(vec2(mid.x/uHs.x*2.5+vK*7.3,mid.y/uHs.y*3.5));
        float dust=.82+.36*sin(dot(mp,vec3(.31,.43,.27))*uPar.z*3.+uTime*.12);
        float cs=dot(rd,uSunDir), cf=max(cs,0.), cb=max(-cs,0.); float ph=.3+1.7*cf*cf*cf+.25*cb*cb;
        vec3 tint=uTint;
        #ifdef SHAFT_STAINED
        { float hh=i_n2(mid.xy/(uHs.x*.55)+vK*3.1+uPar.y)*3.99; int hi=int(hh); tint*=mix(vec3(.62,.55,.6), mix(uStainPal[hi],uStainPal[hi+1],fract(hh))*2.2, .55); }
        #endif
        vec3 col=uSunCol*tint*(uGain*(1.-exp(-len*uDens))*fall*streak*dust*ph*(.25+.75*edge));
        #ifdef SHAFT_DAPPLE
        col*=mix(1.,i_dapple(vec2(mid.x+vK*uSp,mid.y),uTime,uDapple),.8);
        #endif
        ${FOG_ADD}
        gl_FragColor=vec4(col,1.);
      }`,
  });
  mat.defines = { ...(r.stained ? { SHAFT_STAINED: '' } : null), ...(rig.state.dapple > 0 ? { SHAFT_DAPPLE: '' } : null) };
  // Each pixel of a beam is shaded once: outward faces normally; while the camera is inside a beam of this row the
  // inward faces are drawn instead (without depth test, since the far side may lie under the floor).
  const flip = handed > 0;
  mat.side = flip ? THREE.BackSide : THREE.FrontSide;
  const matIn = mat.clone(); matIn.uniforms = uniforms; matIn.side = flip ? THREE.FrontSide : THREE.BackSide; matIn.depthTest = false;
  const mesh = new THREE.Group(); mesh.name = 'interior-shafts';
  const mOut = new THREE.Mesh(g, mat), mIn = new THREE.Mesh(g, matIn);
  for (const m of [mOut, mIn]) { m.frustumCulled = false; m.renderOrder = 3; mesh.add(m); }
  mIn.visible = false;
  const so = new V3(), margin = 0.9;
  // p = camera position in rig space
  const setCamera = (p) => {
    so.copy(p).sub(r.origin); const a = so.dot(r.axis), k = clamp(Math.round(a / r.spacing), 0, r.count - 1);
    so.addScaledVector(r.axis, -k * r.spacing).applyMatrix3(inv);
    const inside = Math.abs(so.x) < hw + margin && Math.abs(so.y) < hh + margin && so.z > -margin && so.z < T + margin;
    mIn.visible = inside; mOut.visible = !inside;
  };
  return { mesh, uniforms, T, setCamera };
}

// Dust motes drifting inside the beams of one row: instanced camera-facing sparkles.
function makeMoteRow(rig, r, o, rng, T) {
  const count = Math.min(o.motesPerWindow ?? 110, Math.floor((o.maxMotes ?? 900) / r.count)) * r.count;
  const base = new THREE.PlaneGeometry(2, 2);
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.attributes.position);
  const seed = new Float32Array(count * 4), kk = new Float32Array(count);
  for (let i = 0; i < count; i++) { seed[i * 4] = rng(); seed[i * 4 + 1] = rng(); seed[i * 4 + 2] = Math.pow(rng(), 1.3); seed[i * 4 + 3] = rng(); kk[i] = i % r.count; }
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(kk, 1));
  g.instanceCount = count;
  const D = rig.state.sunDir.clone().negate(), tint = r.tint;
  const uniforms = {
    ...fogUniforms(), uTime: rig.uniforms.uTime, uSunCol: rig.uniforms.uSunCol, uRoomMin: rig.uniforms.uRoomMin, uRoomMax: rig.uniforms.uRoomMax, uStainPal: rig.uniforms.uStainPal,
    uO: { value: r.origin.clone() }, uA: { value: r.axis.clone() }, uU: { value: r.up.clone() }, uD: { value: D }, uHs: { value: new THREE.Vector2(r.width / 2, r.height / 2) },
    uSp: { value: r.spacing }, uT: { value: T }, uTint: { value: new V3(tint.r, tint.g, tint.b) },
    uSize: { value: (o.moteSize ?? 0.011) * rig.scale }, uDrift: { value: (o.moteDrift ?? 0.22) * rig.scale }, uGain: { value: o.moteGain ?? 0.5 },
    uPar: { value: new THREE.Vector4(r.arch, r.stained || 0, 0, 0) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec4 aSeed; attribute float aK;
      uniform float uTime, uSp, uT, uSize, uDrift, uGain; uniform vec3 uO, uA, uU, uD, uRoomMin, uRoomMax, uSunCol, uTint; uniform vec2 uHs; uniform vec4 uPar;
      varying vec2 vC; varying vec3 vCol;
      #include <fog_pars_vertex>
      ${GLSL_NOISE}${GLSL_WINDOW}${GLSL_STAINED}
      void main(){
        float ph=aSeed.w*6.2832; vec2 ab=(aSeed.xy*2.-1.)*uHs*.94; float t=aSeed.z*uT;
        float tt=uTime*(.25+.5*fract(aSeed.w*7.13));
        vec3 dr=vec3(sin(tt*.31+ph)+.5*sin(tt*.83+ph*3.), sin(tt*.27+ph*2.)*.7-.3*sin(tt*.11+ph), cos(tt*.29+ph*1.7)+.5*cos(tt*.71+ph*5.))*uDrift;
        vec3 p=uO+uA*(aK*uSp+ab.x)+uU*ab.y+uD*t+dr;
        vec3 inb=step(uRoomMin,p)*step(p,uRoomMax); float vis=inb.x*inb.y*inb.z;
        float tw=pow(.5+.5*sin(uTime*(1.3+3.*fract(aSeed.w*3.7))+ph*9.),7.);
        float bright=(.18+2.6*tw)*exp(-t/uT*1.2);
        vec3 tint=uTint; if(uPar.y>.5) tint*=mix(vec3(.6),i_stained(ab,uHs,uPar.x,uPar.y+aK*3.7).rgb*1.6,.7);
        vec4 mvPosition=modelViewMatrix*vec4(p,1.);
        vec4 clip=projectionMatrix*mvPosition;
        float sz=uSize*(.5+fract(aSeed.w*11.3));
        float ndc=sz*projectionMatrix[1][1]/max(clip.w,1e-3); float mn=.0021; float k=max(ndc,mn);
        bright*=min(1.,ndc/mn*1.5+.15);
        clip.xy+=position.xy*k*clip.w*vec2(projectionMatrix[0][0]/projectionMatrix[1][1],1.);
        if(vis<.5) clip=vec4(2.,2.,2.,1.);
        gl_Position=clip; vC=position.xy; vCol=uSunCol*tint*(bright*uGain*.08);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`precision highp float;
      varying vec2 vC; varying vec3 vCol;
      #include <fog_pars_fragment>
      void main(){ float r=dot(vC,vC); if(r>1.) discard; vec3 col=vCol*(1.-r)*(1.-r);
        ${FOG_ADD}
        gl_FragColor=vec4(col,1.); }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4; mesh.name = 'interior-motes';
  return { mesh, uniforms, count };
}

// Panes + shafts + motes for every window row currently in the rig.
// o: { rig, rng, panes:true, shafts:true, motes:true, shaftGain, shaftDensity, motesPerWindow, maxMotes, moteSize, moteDrift, moteGain,
//      paneGain, outdoor:{zenith,horizon,ground,cloud}, frost, scroll, travel, glare, stainGain, frameColor }
export function makeWindowLight(o = {}) {
  const rng = need(o, 'makeWindowLight'), rig = o.rig;
  if (!rig) throw new Error('interior.makeWindowLight: opts.rig is required');
  const group = new THREE.Group(); group.name = 'interior-window-light';
  const cp = new V3();
  const out = { object: group, uniforms: {}, shafts: [], motes: [], triangles: 0,
    update(dt, time, camera) { if (!camera || !out.shafts.length) return; cp.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(rig.uniforms.uRigInv.value); for (const s of out.shafts) s.setCamera(cp); } };
  if (o.panes !== false && rig.rows.some((r) => !r.noPane)) { const p = makePanes(rig, o); group.add(p.mesh); out.uniforms.panes = p.uniforms; out.panes = p.mesh; out.triangles += p.mesh.geometry.index.count / 3; }
  const L = rig.state.sunDir;
  for (const r of rig.rows) {
    if (!r.sun || r.noShaft || L.dot(r.normal) > -0.03 || L.y < 0.05 || rig.state.sunIntensity <= 0) continue;
    let T = 0;
    if (o.shafts !== false) { const s = makeShaftRow(rig, r, o); group.add(s.mesh); out.shafts.push(s); T = s.T; out.triangles += r.count * 12; }
    if (o.motes !== false) {
      if (!T) T = (r.origin.y + r.height / 2 - rig.state.floorY) / Math.max(L.y, 0.08);
      const m = makeMoteRow(rig, r, o, rng.fork('motes' + r.index), T); group.add(m.mesh); out.motes.push(m); out.triangles += m.count * 2;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// room construction helpers
// ---------------------------------------------------------------------------------------------
const UP = new V3(0, 1, 0);

// A wall running from (ax,az) to (bx,bz); the room is on the side of axis x up.
function wallFrame(ax, az, bx, bz) {
  const len = Math.hypot(bx - ax, bz - az), axis = new V3((bx - ax) / len, 0, (bz - az) / len), n = new V3().crossVectors(axis, UP);
  const m = new M4().makeBasis(axis, UP, n).setPosition(ax, 0, az);
  return { len, axis, n, m, ax, az, pt: (u, y, d = 0) => [ax + axis.x * u + n.x * d, y, az + axis.z * u + n.z * d], v3: (u, y, d = 0) => new V3(ax + axis.x * u + n.x * d, y, az + axis.z * u + n.z * d) };
}
// profile of an arch across a normalised span s in [-1,1]: 0 at the springing, 1 at the crown
function archProfile(kind, s) {
  s = Math.min(1, Math.abs(s));
  if (kind === 'pointed') { const R = 1.7, c = R - 1; return Math.sqrt(Math.max(0, R * R - (s + c) * (s + c))) / Math.sqrt(R * R - c * c); }
  if (kind === 'segmental') { const R = 1.5, b = Math.sqrt(R * R - 1); return (Math.sqrt(R * R - s * s) - b) / (R - b); }
  return Math.sqrt(1 - s * s);
}
// counter-clockwise outline of an opening { u, y, w, h, arch } in wall coordinates, starting bottom-left
function openingOutline(op, seg = 12) {
  const hw = op.w / 2, u = op.u, y = op.y, pts = [];
  if (op.arch === 3) { const cy = y + op.h / 2; for (let i = 0; i < seg * 3; i++) { const a = -PI / 2 + (i / (seg * 3)) * TAU; pts.push([u + Math.cos(a) * hw, cy + Math.sin(a) * hw]); } return pts; }
  pts.push([u - hw, y], [u + hw, y]);
  if (!op.arch) { pts.push([u + hw, y + op.h], [u - hw, y + op.h]); return pts; }
  if (op.arch === 1) { const y0 = y + op.h - hw; for (let i = 0; i <= seg * 2; i++) { const a = (i / (seg * 2)) * PI; pts.push([u + Math.cos(a) * hw, y0 + Math.sin(a) * hw]); } return pts; }
  const R = hw * 1.7, c = R - hw, y0 = y + op.h - Math.sqrt(R * R - c * c), ta = Math.acos(c / R);
  for (let i = 0; i <= seg; i++) { const a = (i / seg) * ta; pts.push([u - c + Math.cos(a) * R, y0 + Math.sin(a) * R]); }
  for (let i = 1; i <= seg; i++) { const a = PI - ta + (i / seg) * ta; pts.push([u + c + Math.cos(a) * R, y0 + Math.sin(a) * R]); }
  return pts;
}
// Wall face with openings (windows are holes; openings with door:true cut up from the bottom edge).
// wb receives the face, tb the reveals (jambs) of depth `th` going out of the room.
function addWall(wb, tb, f, y0, y1, openings = [], o = {}) {
  const th = o.thickness ?? 0.3, rc = o.revealColor ?? '#b8ad9a', rs = o.revealSurf ?? S_MATTE;
  const segs = o.split && !o.top ? Math.max(1, Math.round(f.len / o.split)) : 1;
  for (let sg = 0; sg < segs; sg++) {
    const u0 = f.len * sg / segs, u1 = f.len * (sg + 1) / segs, mine = openings.filter((p) => p.u >= u0 && (p.u < u1 || sg === segs - 1));
    const doors = mine.filter((p) => p.door).sort((a, b) => a.u - b.u), holes = mine.filter((p) => !p.door);
    const out = [new THREE.Vector2(u0, y0)];
    for (const d of doors) { const pts = openingOutline({ ...d, y: y0 }); out.push(new THREE.Vector2(pts[0][0], pts[0][1])); for (let i = pts.length - 1; i >= 1; i--) out.push(new THREE.Vector2(pts[i][0], pts[i][1])); }
    out.push(new THREE.Vector2(u1, y0));
    if (o.top) for (const t of o.top) out.push(new THREE.Vector2(t[0], t[1])); else out.push(new THREE.Vector2(u1, y1), new THREE.Vector2(u0, y1));
    const shape = new THREE.Shape(out);
    for (const h of holes) shape.holes.push(new THREE.Path(openingOutline(h).map((p) => new THREE.Vector2(p[0], p[1]))));
    wb.add(new THREE.ShapeGeometry(shape), { m: f.m, c: o.color ?? '#ffffff', surf: o.surf ?? S_MATTE });
  }
  if (th > 0 && o.reveals !== false) for (const op of openings) {
    const pts = openingOutline(op.door ? { ...op, y: y0 } : op), n = pts.length;
    const t = op.th ?? th; if (t <= 0) continue;
    for (let i = op.door ? 1 : 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; tb.quad(f.pt(a[0], a[1]), f.pt(b[0], b[1]), f.pt(b[0], b[1], -t), f.pt(a[0], a[1], -t), rc, rs); }
  }
}
// Moulding that follows an opening outline (casing / architrave), built from short bevelled boxes.
function addCasing(tb, f, op, o = {}) {
  const w = o.width ?? 0.08, proud = o.proud ?? 0.03, c = o.color ?? '#e9e2d0', sf = o.surf ?? S_PLAIN, y0 = op.y;
  const out = openingOutline(op, o.seg ?? 9), n = out.length;
  // one moulding profile swept along the outline with mitred joints (a door's outline is open at the floor)
  const pts = op.door ? out.slice(1).concat([out[0]]) : out, m = pts.length, closed = !op.door, nrm = [];
  const segN = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; }; // outward = right of travel
  for (let i = 0; i < m; i++) {
    const prev = closed || i > 0 ? segN(pts[(i - 1 + m) % m], pts[i]) : null, next = closed || i < m - 1 ? segN(pts[i], pts[(i + 1) % m]) : null;
    const a = prev || next, b = next || prev; let x = a[0] + b[0], y = a[1] + b[1]; const l = Math.hypot(x, y) || 1; x /= l; y /= l;
    const k = 1 / Math.max(x * a[0] + y * a[1], 0.5); nrm.push([x * k, y * k]);
  }
  const prof = [[0, 0], [0, proud * 0.75], [w * 0.14, proud], [w * 0.86, proud], [w, proud * 0.62], [w, 0]];
  const P = (i, q) => f.pt(pts[i][0] + nrm[i][0] * q[0], pts[i][1] + nrm[i][1] * q[0], q[1]);
  for (let i = 0; i < (closed ? m : m - 1); i++) { const i2 = (i + 1) % m; for (let k = 0; k < prof.length - 1; k++) tb.quad(P(i, prof[k]), P(i, prof[k + 1]), P(i2, prof[k + 1]), P(i2, prof[k]), c, sf); }
  if (o.sill && !op.door && op.arch !== 3) tb.add(bevelBox(op.w + w * 3, w * 0.7, o.sill * 2, w * 0.2), { p: [op.u, y0 - w * 0.35, 0], pre: f.m, c, surf: sf });
}
// Horizontal moulding along a wall (skirting, chair rail, cornice), skipping door openings.
function addRail(tb, f, y, h, d, doors = [], o = {}) {
  const c = o.color ?? '#e9e2d0', sf = o.surf ?? S_PLAIN, gaps = doors.map((p) => [p.u - p.w / 2 - (o.gap ?? 0), p.u + p.w / 2 + (o.gap ?? 0)]).sort((a, b) => a[0] - b[0]);
  let u = 0; const runs = [];
  for (const g of gaps) { if (g[0] > u + 1e-3) runs.push([u, g[0]]); u = Math.max(u, g[1]); }
  if (u < f.len - 1e-3) runs.push([u, f.len]);
  for (const r of runs) tb.add(bevelBox(r[1] - r[0], h, d * 2, Math.min(h, d) * 0.3), { p: [(r[0] + r[1]) / 2, y + h / 2, 0], pre: f.m, c, surf: sf });
}
// Vault over the rectangle x0..x1, z0..z1 (z1 < z0). kind: arch profile. cross: groin vault (the bay
// also arches along z, leaving lunettes for clerestory windows). Adds the web, and ribs if o.ribs.
function addVault(tb, x0, x1, z0, z1, hs, rise, o = {}) {
  const kind = o.kind || 'round', cross = !!o.cross, N = o.seg ?? 12, M = cross ? N : 1;
  const cx = (x0 + x1) / 2, hx = (x1 - x0) / 2, cz = (z0 + z1) / 2, hz = (z0 - z1) / 2;
  const web = col(o.color ?? '#b9ad98'), ribC = o.ribColor ?? '#8d8272', ribS = o.ribSurf ?? S_STONE;
  const sAt = (i, n) => -Math.cos((i / n) * PI);
  const hAt = (s, t) => hs + rise * Math.max(archProfile(kind, s), cross ? archProfile(kind, t) : 0);
  const P = [], I = [], C = [];
  for (let j = 0; j <= M; j++) for (let i = 0; i <= N; i++) {
    const s = sAt(i, N), t = cross ? sAt(j, M) : (j === 0 ? -1 : 1), y = hAt(s, t);
    P.push(cx + s * hx, y, cz - t * hz);
    const k = 0.62 + 0.38 * smoothstep(hs, hs + rise, y); C.push(web.r * k, web.g * k, web.b * k);
  }
  for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
    const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
    // split along the groin so the crease is clean; winding makes normals face down into the room
    const diag = cross ? ((i < N / 2) === (j < M / 2)) : true;
    if (diag) I.push(a, d, b, a, c, d); else I.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals();
  tb.add(g, { surf: o.surf ?? S_MATTE });
  if (o.ribs === false) return;
  const rr = o.ribRadius ?? 0.16, rs = o.ribSeg ?? 10, drop = rr * 0.5;
  const rib = (fn, r = rr) => { const pts = []; for (let i = 0; i <= rs; i++) { const p = fn(i / rs); pts.push([p[0], p[1] - drop, p[2]]); } tb.add(tube(pts, r, rs * 2, 5), { c: ribC, surf: ribS }); };
  const tv = (t, dz = 0) => (q) => { const s = sAt(q * N, N); return [cx + s * hx, hAt(s, cross ? t : -1), cz - t * hz + dz]; };
  // startInset keeps the first rib of a hall inside its open end
  if (o.transverse !== false) { rib(tv(-1, o.startInset ? -rr * 1.4 : 0), rr * 1.35); if (o.closeEnd) rib(tv(1), rr * 1.35); }
  if (cross) {
    rib((q) => { const s = sAt(q * N, N); return [cx + s * hx, hAt(s, s), cz - s * hz]; });
    rib((q) => { const s = sAt(q * N, N); return [cx + s * hx, hAt(s, -s), cz + s * hz]; });
    if (o.wallRibs !== false) for (const sx of [-1, 1]) rib((q) => { const t = sAt(q * N, N); return [cx + sx * hx * 0.995, hAt(sx, t), cz - t * hz]; }, rr * 0.8);
    tb.add(sph(rr * 2.4, 8, 6), { p: [cx, hs + rise - drop * 2, cz], s: [1, 0.7, 1], c: o.bossColor ?? '#c9a24a', surf: S_BRASS });
  } else if (o.longRibs) {
    for (let k = 0; k <= o.longRibs; k++) { const s = sAt((k + 0.5) * N / (o.longRibs + 1), N) * 0.98, y = hAt(s, -1) - drop; tb.add(bevelBox(rr * 1.6, rr * 1.6, z0 - z1, rr * 0.3), { p: [cx + s * hx, y, cz], r: [0, 0, 0], c: ribC, surf: ribS }); }
  }
}
// Column: base, shaft with entasis, capital. Optional attached shafts make a clustered gothic pier.
function addColumn(tb, x, z, h, r, o = {}) {
  const c = o.color ?? '#a99f8d', sf = o.surf ?? S_STONE, seg = o.seg ?? 12;
  const prof = [[r * 1.45, 0], [r * 1.45, h * 0.025], [r * 1.25, h * 0.04], [r * 1.3, h * 0.055], [r * 1.05, h * 0.075], [r, h * 0.09], [r * 0.97, h * 0.5], [r * 0.93, h * 0.9],
    [r * 1.02, h * 0.915], [r * 0.95, h * 0.93], [r * 1.2, h * 0.965], [r * 1.42, h * 0.985], [r * 1.42, h]];
  tb.add(lathe(prof, seg), { p: [x, 0, z], c, surf: sf, grad: [0, h * 0.2, 0.72, 1] });
  if (o.cluster) for (let i = 0; i < 4; i++) { const a = i * PI / 2 + (o.clusterTurn ?? 0), cr = r * 0.3;
    tb.add(cyl(cr, cr, h * 0.9, 6, true), { p: [x + Math.cos(a) * r * 1.02, h * 0.5, z + Math.sin(a) * r * 1.02], c: tone(c, 0.03), surf: sf }); }
}
// simple quad floor / ceiling in its own builder
function addSlab(b, x0, x1, z0, z1, y, up, c = '#ffffff', sf = S_MATTE) {
  if (up) b.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], c, sf); else b.quad([x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0], c, sf);
}

// ---------------------------------------------------------------------------------------------
// makeRoom
// ---------------------------------------------------------------------------------------------
// All sizes in the style tables are real-life metres; everything is multiplied by `scale`.
const ROOM_STYLES = {
  room: { scale: 10, width: 6.4, bay: 3.2, bays: 3, wallH: 3.1, thickness: 0.32, ceiling: { type: 'beams' }, floor: 'planks', wall: 'wallpaper', wainscot: 1.0,
    win: { w: 1.25, h: 1.85, sill: 0.8, arch: 0, mull: [2, 3], sides: 1 }, exit: { w: 1.0, h: 2.15, arch: 0 },
    light: { sunIntensity: 12, ambient: 2.4, sky: 6 },
    pal: { floorA: '#8f5d36', floorB: '#603b21', floorC: '#3a2414', floorD: '#20140c', wallA: '#587565', wallB: '#8aa48f', wainscot: '#e4dac4', wallD: '#6c6458',
      trim: '#ece4d2', ceiling: '#e6decd', beam: '#4b2f1c', frame: '#efe8d8', reveal: '#d8cfbc', door: '#5a3a22' } },
  gallery: { scale: 1.6, width: 9.5, bay: 6.5, bays: 9, wallH: 8, thickness: 0.7, ceiling: { type: 'vault', kind: 'segmental', rise: 2.4, longRibs: 3, seg: 14 }, floor: 'chevron', wall: 'damask', wainscot: 1.15,
    win: { w: 3.0, h: 6.3, sill: 0.75, arch: 1, mull: [3, 6], sides: 1 }, exit: { w: 4.7, h: 7.4, arch: 1 },
    light: { sunIntensity: 12, ambient: 2.2, sky: 6 }, windowLight: { shaftGain: 0.12, moteSize: 0.018, moteGain: 0.9 },
    pal: { floorA: '#a06f3c', floorB: '#714926', floorC: '#3a2414', floorD: '#20140c', wallA: '#6a1d28', wallB: '#a2413f', wainscot: '#e8dec6', wallD: '#6c6458',
      trim: '#c9a148', trimSurf: 'brass', ceiling: '#e3d8c0', beam: '#c9a148', frame: '#e9dfc8', reveal: '#dcd2bc', door: '#5a3a22', rib: '#c9a148' } },
  library: { scale: 1.5, width: 14, bay: 7.5, bays: 8, wallH: 11.2, thickness: 0.8, ceiling: { type: 'vault', kind: 'round', rise: 6.2, cross: true, seg: 12 }, floor: 'parquet', wall: 'books', wainscot: 0,
    win: { w: 4.0, h: 4.9, sill: 11.7, arch: 1, mull: [3, 4], sides: 2 }, exit: { w: 5.0, h: 8.4, arch: 1 },
    light: { sunIntensity: 13, ambient: 1.9, sky: 6 }, windowLight: { shaftGain: 0.09, moteSize: 0.018, moteGain: 0.9 },
    pal: { floorA: '#7d5231', floorB: '#4f321d', floorC: '#3a2414', floorD: '#20140c', wallA: '#6b1f1f', wallB: '#1f3a5a', wainscot: '#2f4a2a', wallD: '#c9a24a',
      trim: '#4a2c18', trimSurf: 'wood', ceiling: '#d6c9ab', beam: '#4a2c18', frame: '#3a2314', reveal: '#cfc3a6', door: '#3a2314', rib: '#b0935a' } },
  nave: { scale: 1, width: 13, bay: 11, bays: 7, wallH: 23, thickness: 1.3, ceiling: { type: 'vault', kind: 'pointed', rise: 9.5, cross: true, seg: 12 }, floor: 'tile', wall: 'ashlar', wainscot: 0,
    win: { w: 4.4, h: 9, sill: 20, arch: 2, mull: [2, 5], sides: 2, stained: true }, exit: { w: 7.8, h: 12.6, arch: 1 },
    aisle: { width: 6.6, wallH: 11, rise: 5.2, win: { w: 3.0, h: 9.6, sill: 3.6 } },
    light: { sunIntensity: 16, ambient: 2.0, sky: 6 }, windowLight: { moteSize: 0.02, moteGain: 0.9 },
    pal: { floorA: '#b3aa98', floorB: '#4e4a46', floorC: '#d8d0c0', floorD: '#34302c', wallA: '#b3a892', wallB: '#8f8572', wainscot: '#9a9080', wallD: '#6c6458',
      trim: '#a79c88', trimSurf: 'stone', ceiling: '#c4b9a3', beam: '#8d8272', frame: '#8d8272', reveal: '#a59a86', door: '#3a2314', rib: '#8a7f6e' } },
  greenhouse: { scale: 1.2, width: 16, bay: 6, bays: 10, wallH: 6.5, thickness: 0.12, ceiling: { type: 'glass', rise: 5.2 }, floor: 'tile', wall: 'brick', wainscot: 0,
    win: { w: 5.5, h: 5.4, sill: 0.95, arch: 0, mull: [4, 5], sides: 2 }, exit: { w: 6.4, h: 9.6, arch: 1 },
    light: { sunIntensity: 11, ambient: 1.2, sky: 1.5, dapple: { amount: 0.55, size: 0.9 } }, windowLight: { frameColor: '#b9c4b6' },
    pal: { floorA: '#8f4a2e', floorB: '#b9a583', floorC: '#8a4630', floorD: '#5a5148', wallA: '#93492f', wallB: '#703624', wainscot: '#93492f', wallD: '#c4baa6',
      trim: '#e4ebe0', trimSurf: 'iron', ceiling: '#e4ebe0', beam: '#e4ebe0', frame: '#e4ebe0', reveal: '#e4ebe0', door: '#e4ebe0', rib: '#e4ebe0' } },
  carriage: { scale: 9, width: 2.9, bay: 1.95, bays: 10, wallH: 2.05, thickness: 0.09, ceiling: { type: 'vault', kind: 'segmental', rise: 0.38, longRibs: 0, seg: 10, ribRadius: 0.035 }, floor: 'planks', wall: 'plaster', wainscot: 0.92,
    win: { w: 1.3, h: 0.86, sill: 0.98, arch: 0, mull: [1, 1], sides: 2 }, exit: { w: 0.86, h: 1.96, arch: 0 },
    light: { sunIntensity: 12, ambient: 2.0, sky: 4.2 }, windowLight: { shafts: false, travel: 1, frost: 0.03, paneGain: 0.4 },
    pal: { floorA: '#5a3822', floorB: '#3a2314', floorC: '#3a2414', floorD: '#180e08', wallA: '#cfc4a4', wallB: '#b9ad8c', wainscot: '#6e3f22', wallD: '#6c6458',
      trim: '#6e3f22', trimSurf: 'wood', ceiling: '#b3a888', beam: '#c9a148', frame: '#5a321a', reveal: '#5a321a', door: '#5a321a', rib: '#c9a148' } },
};
const TRIM_SURF = { brass: S_BRASS, wood: S_WOOD, stone: S_STONE, iron: surf(0, 0.5, 0.3) };
const WALLPAPERS = [['#8fae9a', '#c3d6c2'], ['#8aa6c4', '#bcd0e2'], ['#d2ae62', '#ecd79a'], ['#b8686c', '#dba39c'], ['#7d9c8e', '#e0d2ac']];

export const ROOM_STYLE_NAMES = Object.keys(ROOM_STYLES);
// A copy of a style's default table (scale, width, bay, bays, wallH, win, exit, light, pal ...), e.g. to learn a room's scale
// or door size before building it.
export function roomStyle(name = 'room') { return JSON.parse(JSON.stringify(ROOM_STYLES[name] || ROOM_STYLES.room)); }

function roomContext(o) {
  const rng = need(o, 'makeRoom');
  const style = ROOM_STYLES[o.style] ? o.style : 'room', st = ROOM_STYLES[style];
  const S = o.scale ?? st.scale, bays = o.bays ?? st.bays;
  const L = o.length != null ? o.length * S : bays * (o.bay ?? st.bay) * S, bay = L / bays;
  const W = (o.width ?? st.width) * S, wallH = (o.height ?? st.wallH) * S;
  const pal = { ...st.pal };
  if (style === 'room' && !(o.palette && o.palette.wallA)) { const wp = rng.pick(WALLPAPERS); pal.wallA = wp[0]; pal.wallB = wp[1]; }
  Object.assign(pal, o.palette || {});
  const sun = o.sun || {}, side = sun.side ?? rng.sign();
  const el = (sun.elevation ?? rng.range(34, 48)) * PI / 180, ah = (sun.ahead ?? rng.range(0.25, 0.6));
  const sunDir = new V3(side * Math.cos(el) * Math.sqrt(1 - ah * ah), Math.sin(el), -Math.cos(el) * ah).normalize();
  const lt = { ...st.light, ...(o.light || {}) };
  const rig = o.rig || makeLightRig({ scale: S, sunDir, sunColor: sun.color ?? '#ffe0b8', sunIntensity: sun.intensity ?? lt.sunIntensity, ambient: lt.ambient,
    ambientSky: lt.ambientSky, ambientGround: lt.ambientGround, bounceColor: mix(pal.floorA, pal.floorB, 0.5), aoRadius: lt.aoRadius, aoStrength: lt.aoStrength, stainPalette: o.stainPalette, dapple: lt.dapple });
  const c = {
    o, rng, style, st, S, W, L, X: W / 2, bay, bays, wallH, pal, side, rig, lt, th: (o.thickness ?? st.thickness) * S,
    fb: makeBuilder(), wb: makeBuilder(), tb: makeBuilder(), top: wallH, xOut: W / 2, anchors: {}, slots: [], lamps: [],
    trimSurf: TRIM_SURF[pal.trimSurf] || S_PLAIN, win: o.windows === false ? null : { ...st.win, ...(o.windows || {}) },
    exit: { ...st.exit, ...(o.exit || {}) }, entry: o.entry ?? 'open',
    sky: o.skyColor ?? '#c4d8ff',
  };
  // cuts a row of windows into wall frame f: registers the rig row and returns the openings (in metres * S)
  c.windowRow = (f, r) => {
    const row = rig.addWindowRow({ origin: f.v3(r.u0, r.y + (r.arch === 3 ? r.w : r.h) / 2), axis: f.axis, normal: f.n, width: r.w, height: r.arch === 3 ? r.w : r.h, spacing: r.spacing, count: r.count, maxReach: r.maxReach,
      arch: r.arch, mullions: r.mull, stained: r.stained ? 1 + Math.floor(rng() * 90) : 0, sky: r.sky ?? c.sky, skyIntensity: r.skyIntensity ?? lt.sky, tint: r.tint, bar: (r.bar ?? 0.022) * S });
    if (!row) return [];
    row.depth = r.depth ?? c.th; row.frame = f; row.noShaft = !!r.noShaft; row.paneGain = r.paneGain;
    const ops = []; for (let k = 0; k < r.count; k++) ops.push({ u: r.u0 + k * r.spacing, y: r.y, w: r.w, h: r.arch === 3 ? r.w : r.h, arch: r.arch });
    return ops;
  };
  return c;
}

// The style builders below (buildHall, buildNave, buildGreenhouse, libraryExtras, carriageExtras) are generators: each bare `yield`
// stands between two whole pieces of work, where makeRoomAsync may hand the page back. makeRoom runs them straight through.

// rectangular hall shared by the room, gallery, library and carriage styles
function* buildHall(c) {
  const { S, X, L, bay, bays, wallH, st, pal, tb, wb, fb, th, win, exit } = c;
  const cl = { ...st.ceiling, ...(c.o.ceiling || {}) }, cross = cl.type === 'vault' && cl.cross, rise = (cl.rise || 0) * S;
  const top = wallH + rise, sideTop = cross ? top : wallH; c.top = top;
  const fL = wallFrame(-X, 0, -X, -L), fR = wallFrame(X, -L, X, 0), fB = wallFrame(-X, -L, X, -L), fF = wallFrame(X, 0, -X, 0);
  c.frames = { left: fL, right: fR, back: fB, front: fF };
  const wo = { thickness: th, revealColor: pal.reveal, revealSurf: c.trimSurf === S_BRASS ? S_PLAIN : c.trimSurf, split: bay };
  const cas = { width: (c.style === 'carriage' ? 0.05 : 0.09) * S * (c.style === 'room' ? 1 : 1.6), proud: 0.03 * S, color: pal.frame, surf: c.trimSurf, sill: 0.07 * S };
  const sides = [[fL, c.side < 0], [fR, c.side > 0]];
  const doorsOf = { left: [], right: [], back: [], front: [] };
  for (const [f, sunny] of sides) {
    let ops = [];
    if (win && (win.sides === 2 || sunny)) {
      const ev = win.every || 1, cnt = Math.floor((bays + ev - 1) / ev);
      ops = c.windowRow(f, { u0: bay * 0.5, spacing: bay * ev, count: cnt, y: win.sill * S, w: win.w * S, h: win.h * S, arch: win.arch, mull: win.mull, stained: win.stained });
      for (const op of ops) { addCasing(tb, f, op, cas); yield; }
    }
    addWall(wb, tb, f, 0, sideTop, ops, wo);
    f.ops = ops;
    yield;
  }
  // exit wall with its doorway (the portal sits in it)
  const door = { u: X, y: 0, w: exit.w * S, h: exit.h * S, arch: exit.arch, door: true };
  addWall(wb, tb, fB, 0, top, [door], { ...wo, split: 0 }); addCasing(tb, fB, door, { ...cas, width: cas.width * 1.5, proud: cas.proud * 1.6 }); doorsOf.back.push(door);
  if (c.entry !== 'open') {
    const e = c.entry === 'wall' ? null : { u: X, y: 0, w: (c.entry.w ?? exit.w) * S, h: (c.entry.h ?? exit.h) * S, arch: c.entry.arch ?? exit.arch, door: true };
    addWall(wb, tb, fF, 0, top, e ? [e] : [], { ...wo, split: 0 }); if (e) { addCasing(tb, fF, e, { ...cas, width: cas.width * 1.5 }); doorsOf.front.push(e); }
  }
  // mouldings
  const sk = 0.15 * S, wains = (c.o.wainscot ?? st.wainscot) * S;
  for (const [name, f] of [['left', fL], ['right', fR], ['back', fB], ['front', fF]]) {
    if (name === 'front' && c.entry === 'open') continue;
    if (c.style !== 'library') addRail(tb, f, 0, sk, 0.022 * S, doorsOf[name], { color: pal.trim, surf: c.trimSurf, gap: cas.width * 1.4 });
    if (wains > 0) addRail(tb, f, wains, 0.05 * S, 0.03 * S, doorsOf[name], { color: pal.trim, surf: c.trimSurf, gap: cas.width * 1.4 });
    if (cl.type !== 'glass' && !(cross && (name === 'left' || name === 'right'))) addRail(tb, f, (name === 'left' || name === 'right' ? wallH : top) - 0.16 * S, 0.16 * S, 0.07 * S, [], { color: pal.trim, surf: c.trimSurf });
  }
  addSlab(fb, -X, X, 0, -L, 0, true);
  yield;
  // ceiling
  if (cl.type === 'vault') {
    for (let k = 0; k < bays; k++) { addVault(tb, -X, X, -k * bay, -(k + 1) * bay, wallH, rise, { startInset: k === 0, kind: cl.kind, cross, seg: cl.seg, color: pal.ceiling, ribColor: pal.rib, ribSurf: c.trimSurf === S_BRASS ? S_BRASS : S_STONE,
      ribRadius: (cl.ribRadius ?? 0.11) * S * (cross ? 1.3 : 1), longRibs: cl.longRibs, closeEnd: k === bays - 1, ribs: cl.ribs }); yield; }
  } else if (cl.type !== 'glass') {
    addSlab(tb, -X, X, 0, -L, wallH, false, pal.ceiling, S_MATTE);
    if (cl.type === 'beams') {
      const n = Math.max(2, Math.round(L / (1.15 * S))), bh = 0.2 * S, bw = 0.15 * S;
      for (let i = 0; i < n; i++) tb.add(bevelBox(X * 2, bh, bw, 0.012 * S), { p: [0, wallH - bh / 2, -(i + 0.5) * L / n], c: pal.beam, surf: S_WOODM });
      tb.add(bevelBox(0.24 * S, 0.3 * S, L, 0.015 * S), { p: [0, wallH - 0.15 * S, -L / 2], c: tone(pal.beam, -0.02), surf: S_WOODM });
    }
  }
  c.sideTop = sideTop;
}

// ---- cathedral nave: arcades, aisles, clerestory, ribbed vaults, rose window ----
function* buildNave(c) {
  const { S, X, L, bay, bays, wallH, st, pal, tb, wb, fb, th, win, exit, o } = c;
  const a = { ...st.aisle, ...(o.aisle || {}) }, aw = 1.25 * S, Wa = a.width * S, Xi = X + aw, Xo = Xi + Wa;
  const rise = st.ceiling.rise * S, top = wallH + rise, aH = a.wallH * S, aRise = a.rise * S, aTop = aH + aRise;
  c.top = top; c.xOut = Xo; c.aisle = { inner: Xi, outer: Xo, height: aTop };
  const stone = { thickness: th, revealColor: pal.reveal, revealSurf: S_STONE, split: bay };
  const cas = { width: 0.22 * S, proud: 0.1 * S, color: pal.frame, surf: S_STONE };
  const fL = wallFrame(-Xo, 0, -Xo, -L), fR = wallFrame(Xo, -L, Xo, 0), fB = wallFrame(-Xo, -L, Xo, -L), fF = wallFrame(Xo, 0, -Xo, 0);
  c.frames = { left: fL, right: fR, back: fB, front: fF };
  const stainedOn = !win || win.stained !== false;
  // aisle walls: tall stained lancets
  for (const f of [fL, fR]) {
    const ops = c.windowRow(f, { u0: bay * 0.5, spacing: bay, count: bays, y: a.win.sill * S, w: a.win.w * S, h: a.win.h * S, arch: 2, mull: [2, 5], stained: stainedOn, depth: th * 0.6, bar: 0.05, maxReach: (Xo + X) / Math.max(0.2, Math.abs(c.rig.state.sunDir.x)) });
    for (const op of ops) op.th = th * 0.6;
    addWall(wb, tb, f, 0, aTop, ops, stone);
    yield;
    for (const op of ops) { addCasing(tb, f, op, cas); yield; }
    addRail(tb, f, a.win.sill * S - 0.5 * S, 0.3 * S, 0.12 * S, [], { color: pal.trim, surf: S_STONE });
    f.ops = ops;
    yield;
  }
  // arcade walls (two faces each) with clerestory windows above
  const arcW = bay - 2.5 * S, arcH = aH + 0.44 * (aTop - aH) + 0.1 * S;
  for (const sx of [-1, 1]) {
    const fn = sx < 0 ? wallFrame(-X, 0, -X, -L) : wallFrame(X, -L, X, 0);       // faces the nave
    const fa = sx < 0 ? wallFrame(-Xi, -L, -Xi, 0) : wallFrame(Xi, 0, Xi, -L);    // faces the aisle
    const arches = [], archesA = [];
    for (let k = 0; k < bays; k++) { arches.push({ u: bay * (k + 0.5), y: 0, w: arcW, h: arcH, arch: 2, door: true, th: aw }); archesA.push({ u: bay * (k + 0.5), y: 0, w: arcW, h: arcH, arch: 2, door: true, th: 0 }); }
    let cler = [];
    if (win) { cler = c.windowRow(fn, { u0: bay * 0.5, spacing: bay, count: bays, y: win.sill * S, w: win.w * S, h: win.h * S, arch: 2, mull: win.mull, stained: o.clerestoryStained ? true : false, depth: th * 0.5, bar: 0.06, tint: '#fff1dc', maxReach: (2 * X + 0.5 * S) / Math.max(0.2, Math.abs(c.rig.state.sunDir.x)) });
      for (const op of cler) { op.th = th * 0.5; addCasing(tb, fn, op, { ...cas, width: 0.16 * S, proud: 0.06 * S }); } }
    yield;
    addWall(wb, tb, fn, 0, top, arches.concat(cler), stone);
    yield;
    addWall(wb, tb, fa, 0, aTop, archesA, { ...stone, reveals: false });
    for (const op of arches) addCasing(tb, fn, op, { ...cas, width: 0.3 * S, proud: 0.12 * S });
    yield;
    // string courses under the triforium and the clerestory
    addRail(tb, fn, aTop + 0.6 * S, 0.3 * S, 0.14 * S, [], { color: pal.trim, surf: S_STONE });
    if (win) addRail(tb, fn, win.sill * S - 0.7 * S, 0.3 * S, 0.14 * S, [], { color: pal.trim, surf: S_STONE });
    // blind triforium arcade: little colonnettes between the string courses
    const ty0 = aTop + 0.9 * S, ty1 = (win ? win.sill * S : wallH) - 0.7 * S;
    if (ty1 - ty0 > 0.8 * S) for (let k = 0; k < bays; k++) for (let j = 0; j < 5; j++) {
      const u = bay * k + bay * (0.18 + 0.16 * j); tb.add(cyl(0.11 * S, 0.11 * S, ty1 - ty0, 6, true), { p: fn.pt(u, (ty0 + ty1) / 2, 0.16 * S), c: tone(pal.trim, -0.06), surf: S_STONE });
    }
    yield;
    // piers + vaulting shafts
    for (let k = 0; k <= bays; k++) {
      const z = -k * bay, px = sx * (X + aw / 2), capH = arcH - Math.sqrt(Math.pow(arcW * 0.85, 2) - Math.pow(arcW * 0.35, 2)) + 0.5 * S;
      addColumn(tb, px, z, capH, 0.98 * S, { cluster: true, color: pal.trim, seg: 12 });
      tb.add(cyl(0.27 * S, 0.27 * S, wallH - capH + 0.3 * S, 7, true), { p: [sx * (X - 0.12 * S), (wallH + capH) / 2, z], c: tone(pal.trim, 0.02), surf: S_STONE });
      tb.add(lathe([[0.24 * S, 0], [0.5 * S, 0.5 * S], [0.5 * S, 0.62 * S]], 7), { p: [sx * (X - 0.12 * S), wallH - 0.3 * S, z], c: pal.trim, surf: S_STONE });
      // respond on the aisle wall
      tb.add(cyl(0.3 * S, 0.34 * S, aH, 7, true), { p: [sx * (Xo - 0.1 * S), aH / 2, z], c: pal.trim, surf: S_STONE, grad: [0, aH * 0.2, 0.75, 1] });
    }
    yield;
    for (let k = 0; k < bays; k++) { addVault(tb, sx < 0 ? -Xo : Xi, sx < 0 ? -Xi : Xo, -k * bay, -(k + 1) * bay, aH, aRise, { startInset: k === 0, kind: 'pointed', cross: true, seg: 8, color: pal.ceiling, ribColor: pal.rib, ribRadius: 0.13 * S, ribSeg: 8, closeEnd: k === bays - 1 }); yield; }
  }
  for (let k = 0; k < bays; k++) { addVault(tb, -X, X, -k * bay, -(k + 1) * bay, wallH, rise, { startInset: k === 0, kind: 'pointed', cross: true, seg: st.ceiling.seg, color: pal.ceiling, ribColor: pal.rib, ribRadius: 0.2 * S, ribSeg: 12, closeEnd: k === bays - 1 }); yield; }
  // end wall: doorway for the portal and a rose window over it
  const door = { u: Xo, y: 0, w: exit.w * S, h: exit.h * S, arch: exit.arch, door: true };
  const roseR = Math.min(X * 0.62, (top - door.h) * 0.36), roseY = door.h + (wallH + rise * 0.55 - door.h) * 0.5 - roseR * 0.1;
  const rose = o.rose === false ? [] : c.windowRow(fB, { u0: Xo, spacing: 1, count: 1, y: roseY - roseR, w: roseR * 2, arch: 3, stained: stainedOn, depth: th * 0.6, mull: [1, 1], skyIntensity: c.lt.sky * 1.25 });
  for (const op of rose) { op.th = th * 0.6; addCasing(tb, fB, op, { ...cas, width: 0.35 * S, proud: 0.14 * S }); }
  addWall(wb, tb, fB, 0, top, [door].concat(rose), { ...stone, split: 0 }); addCasing(tb, fB, door, { ...cas, width: 0.45 * S, proud: 0.2 * S });
  if (c.entry !== 'open') { const e = c.entry === 'wall' ? [] : [{ u: Xo, y: 0, w: (c.entry.w ?? exit.w) * S, h: (c.entry.h ?? exit.h) * S, arch: c.entry.arch ?? exit.arch, door: true }]; addWall(wb, tb, fF, 0, top, e, { ...stone, split: 0 }); }
  addSlab(fb, -Xo, Xo, 0, -L, 0, true);
  c.sideTop = aTop;
}

// ---- greenhouse: brick plinth, glass walls, gabled glass roof on iron ribs ----
function* buildGreenhouse(c) {
  const { S, X, L, bay, bays, wallH, st, pal, tb, wb, fb, win, exit, o, rig } = c;
  const rise = (o.ceiling?.rise ?? st.ceiling.rise) * S, top = wallH + rise, sill = win.sill * S; c.top = top;
  const fL = wallFrame(-X, 0, -X, -L), fR = wallFrame(X, -L, X, 0), fB = wallFrame(-X, -L, X, -L), fF = wallFrame(X, 0, -X, 0);
  c.frames = { left: fL, right: fR, back: fB, front: fF };
  const iron = c.trimSurf, ic = pal.trim, post = 0.2 * S;
  for (const f of [fL, fR]) {
    addWall(wb, tb, f, 0, sill, [], { reveals: false, split: bay });
    addRail(tb, f, sill - 0.09 * S, 0.12 * S, 0.14 * S, [], { color: '#cfc6b4', surf: S_STONE });
    const row = rig.addWindowRow({ origin: f.v3(bay / 2, (sill + wallH) / 2), axis: f.axis, normal: f.n, width: bay, height: wallH - sill, spacing: bay, count: bays, mullions: win.mull, bar: 0.03 * S, sky: c.sky, skyIntensity: c.lt.sky });
    if (row) { row.depth = 0; row.noShaft = true; row.frame = f; row.paneGain = 0.85; row.noCurtain = true; }
    for (let k = 0; k <= bays; k++) tb.add(bevelBox(post, wallH, post, 0.02 * S), { p: f.pt(k * bay, wallH / 2, 0.02 * S), c: ic, surf: iron });
    tb.add(bevelBox(L, 0.3 * S, 0.24 * S, 0.02 * S), { p: [0, wallH, 0], pre: new M4().copy(f.m).multiply(new M4().makeTranslation(L / 2, 0, 0)), c: ic, surf: iron });
    yield;
  }
  // roof
  const sl = Math.hypot(X, rise), ang = Math.atan2(rise, X);
  for (const sx of [-1, 1]) {
    const up = new V3(-sx * X, rise, 0).normalize(), n = new V3(-sx * rise, -X, 0).normalize();
    const row = rig.addWindowRow({ origin: new V3(sx * X / 2, wallH + rise / 2, -bay / 2), axis: new V3(0, 0, -1), up, normal: n, width: bay, height: sl, spacing: bay, count: bays, mullions: [win.mull[0], 6], bar: 0.07 * S, sky: c.sky, skyIntensity: c.lt.sky });
    if (row) { row.depth = 0; row.noShaft = true; row.paneGain = 0.85; }
    for (let k = 0; k <= bays; k++) {
      tb.add(bevelBox(sl + 0.1 * S, 0.26 * S, 0.14 * S, 0.02 * S), { p: [sx * X / 2, wallH + rise / 2 - 0.05 * S, -k * bay], r: [0, 0, -sx * ang], c: ic, surf: iron });
      // curved bracket between post and rafter
      const R = 1.5 * S, pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8, ph = t * PI / 2, dx = R * (1 - Math.cos(ph)); pts.push([sx * (X - 0.1 * S - dx), wallH - R + R * Math.sin(ph) + dx * Math.tan(ang) * t - 0.12 * S, -k * bay]); }
      tb.add(tube(pts, 0.045 * S, 10, 5), { c: ic, surf: iron });
      yield;
    }
    for (const q of [0.34, 0.67]) tb.add(bevelBox(0.1 * S, 0.14 * S, L, 0.015 * S), { p: [sx * X * (1 - q), wallH + rise * q - 0.08 * S, -L / 2], r: [0, 0, -sx * ang], c: ic, surf: iron });
    yield;
  }
  tb.add(bevelBox(0.26 * S, 0.34 * S, L, 0.02 * S), { p: [0, top - 0.14 * S, -L / 2], c: ic, surf: iron });
  for (let k = 0; k <= bays; k++) tb.add(cyl(0.03 * S, 0.03 * S, X * 2, 5, true), { p: [0, wallH + 0.1 * S, -k * bay], r: [0, 0, PI / 2], c: ic, surf: iron });
  // gable end with the doorway
  const door = { u: X, y: 0, w: exit.w * S, h: exit.h * S, arch: exit.arch, door: true };
  const gable = [[X * 2, wallH], [X, top], [0, wallH]];
  addWall(wb, tb, fB, 0, wallH, [door], { thickness: 0.4 * S, revealColor: '#d9d2c2', top: gable });
  addCasing(tb, fB, door, { width: 0.3 * S, proud: 0.1 * S, color: ic, surf: iron });
  if (c.entry !== 'open') { const e = c.entry === 'wall' ? [] : [{ u: X, y: 0, w: (c.entry.w ?? exit.w) * S, h: (c.entry.h ?? exit.h) * S, arch: c.entry.arch ?? exit.arch, door: true }]; addWall(wb, tb, fF, 0, wallH, e, { thickness: 0.4 * S, top: gable }); }
  addSlab(fb, -X, X, 0, -L, 0, true);
  // raised planting beds along both sides
  if (o.beds !== false) {
    const bw = Math.min(3.1 * S, X * 0.38), bh = 0.62 * S; c.beds = { width: bw, height: bh, x: X - bw / 2 - 0.25 * S };
    for (const sx of [-1, 1]) {
      tb.add(bevelBox(bw, bh, L - 0.6 * S, 0.03 * S), { p: [sx * c.beds.x, bh / 2, -L / 2], c: '#8a4a34', surf: S_STONE, grad: [0, bh, 0.7, 1] });
      tb.add(bevelBox(bw - 0.3 * S, 0.06 * S, L - 0.9 * S, 0.01 * S), { p: [sx * c.beds.x, bh + 0.005 * S, -L / 2], c: '#2a1c12', surf: S_MATTE });
    }
  }
  c.sideTop = wallH;
}

// ---- library: pilasters, shelf uprights, gallery balconies with brass rails, ladders ----
function* libraryExtras(c) {
  const { S, X, L, bay, bays, wallH, pal, tb, rng } = c;
  const t1 = 5.0 * S, t2 = 10.3 * S, wood = pal.trim, brass = '#c9a148', bal = 1.55 * S;
  c.tiers = { t1, t2, balcony: bal };
  for (const [f, sx] of [[c.frames.left, -1], [c.frames.right, 1]]) {
    for (let k = 0; k <= bays; k++) {
      tb.add(bevelBox(0.62 * S, wallH, 0.5 * S, 0.03 * S), { p: f.pt(k * bay, wallH / 2, 0.12 * S), c: wood, surf: S_WOOD, grad: [0, wallH * 0.15, 0.7, 1] });
      tb.add(bevelBox(0.8 * S, 0.5 * S, 0.66 * S, 0.04 * S), { p: f.pt(k * bay, wallH - 0.25 * S, 0.14 * S), c: tone(wood, 0.03), surf: S_WOOD });
      tb.add(bevelBox(0.3 * S, 0.9 * S, bal * 0.9, 0.05 * S), { p: f.pt(k * bay, t1 - 0.4 * S, bal * 0.45), c: wood, surf: S_WOOD });
      if (k < bays) for (let j = 1; j < 4; j++) tb.add(bevelBox(0.09 * S, t2, 0.26 * S, 0.01 * S), { p: f.pt(k * bay + bay * j / 4, t2 / 2, 0.02 * S), c: tone(wood, -0.02), surf: S_WOODM });
      yield;
    }
    for (const y of [0, t1 + 0.42 * S, t2]) tb.add(bevelBox(L, 0.3 * S, 0.5 * S, 0.03 * S), { p: [L / 2, y + 0.15 * S, 0.1 * S], pre: f.m, c: wood, surf: S_WOOD });
    // balcony slab and railing
    tb.add(bevelBox(L, 0.24 * S, bal, 0.03 * S), { p: [L / 2, t1 + 0.12 * S, bal / 2], pre: f.m, c: tone(wood, 0.02), surf: S_WOOD });
    const ry = t1 + 0.24 * S, rh = 1.05 * S, n = bays * 6;
    for (let i = 0; i <= n; i++) tb.add(cyl(0.022 * S, 0.022 * S, rh, 5, true), { p: f.pt(i * L / n, ry + rh / 2, bal - 0.08 * S), c: brass, surf: S_BRASS });
    for (const [yy, r] of [[rh, 0.04], [rh * 0.5, 0.02], [rh * 0.12, 0.02]]) tb.add(cyl(r * S, r * S, L, 6, true), { p: f.pt(L / 2, ry + yy, bal - 0.08 * S), r: [PI / 2, 0, 0], c: brass, surf: S_BRASS });
    // rolling ladders
    for (let i = 0; i < 2; i++) {
      const u = (rng.int(0, bays - 1) + rng.range(0.25, 0.75)) * bay, lean = 1.25 * S, len = Math.hypot(t1 * 0.94, lean), tilt = Math.atan2(lean, t1 * 0.94);
      const lm = new M4().copy(f.m).multiply(new M4().makeTranslation(u, 0, 0.3 * S + lean)).multiply(new M4().makeRotationX(-tilt));
      for (const dx of [-0.24, 0.24]) tb.add(bevelBox(0.05 * S, len, 0.07 * S, 0.01 * S), { p: [dx * S, len / 2, 0], pre: lm, c: '#7a4a26', surf: S_WOOD });
      for (let q = 1; q < 14; q++) tb.add(cyl(0.018 * S, 0.018 * S, 0.48 * S, 5, true), { p: [0, q * len / 14, 0], r: [0, 0, PI / 2], pre: lm, c: '#8a5a30', surf: S_WOOD });
    }
    yield;
  }
}

// ---- train carriage: luggage racks, ceiling lamps, window pillars ----
function* carriageExtras(c) {
  const { S, X, L, bay, bays, wallH, tb } = c, brass = '#c9a148';
  for (const f of [c.frames.left, c.frames.right]) {
    const y = wallH - 0.1 * S;
    for (const d of [0.1, 0.24, 0.38]) tb.add(cyl(0.012 * S, 0.012 * S, L, 5, true), { p: f.pt(L / 2, y - (d > 0.3 ? -0.05 * S : 0), d * S), r: [PI / 2, 0, 0], c: brass, surf: S_BRASS });
    for (let k = 0; k <= bays; k++) {
      const pts = [f.pt(k * bay, y - 0.16 * S, 0.01 * S), f.pt(k * bay, y - 0.06 * S, 0.12 * S), f.pt(k * bay, y - 0.01 * S, 0.26 * S), f.pt(k * bay, y + 0.05 * S, 0.39 * S)];
      tb.add(tube(pts, 0.014 * S, 6, 5), { c: brass, surf: S_BRASS });
      tb.add(bevelBox(0.16 * S, wallH, 0.05 * S, 0.012 * S), { p: f.pt(k * bay, wallH / 2, 0.012 * S), c: c.pal.trim, surf: S_WOOD });
      yield;
    }
  }
  const n = Math.max(2, Math.round(bays / 3));
  for (let i = 0; i < n; i++) {
    const z = -(i + 0.5) * L / n, y = c.top - 0.07 * S;
    tb.add(cyl(0.09 * S, 0.11 * S, 0.035 * S, 12), { p: [0, y, z], c: brass, surf: S_BRASS });
    tb.add(sph(0.085 * S, 12, 8), { p: [0, y - 0.07 * S, z], s: [1, 0.8, 1], c: '#ffd9a0', surf: surf(0, 0.6, 0, 5) });
    if (i < 4) c.lamps.push({ position: [0, y - 0.12 * S, z], color: '#ffc27a', intensity: 3.2, range: 3.6 * S });
  }
}

const FLOOR_DEFAULTS = {
  planks: { patA: [0.15, 2.1, 0, 0], patB: [0.55, 0, 0, 0] }, chevron: { patA: [0.11, 0, 0, 0], patB: [0.7, 0, 0, 0] }, parquet: { patA: [0.09, 0, 0, 0], patB: [0.68, 0, 0, 0] },
  tile: { patA: [0.62, 0.004, 1, 1], patB: [0.78, 0.5, 0, 0] }, stone: { patA: [0.55, 0.008, 0, 0], patB: [0.25, 0, 0, 0] },
};

// Stepped builds. makeRoom and makeFurniture are generators underneath (roomSteps, furnitureSteps): a bare `yield` marks a place
// between two whole pieces of work where the page may be handed back; nothing is left in the module's scratch objects there.
// runSteps runs such a generator to its end in one piece. runStepsAsync does the same, but at a yield it awaits yieldFn() once
// `slice` ms have passed since the last hand-back (slice 0: at every yield; no yieldFn: never). The clock is read only at yields.
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : 0);
const runSteps = (it) => { let r; while (!(r = it.next()).done); return r.value; };
async function runStepsAsync(it, yieldFn, slice) {
  let r, t = nowMs();
  while (!(r = it.next()).done) { if (yieldFn && nowMs() - t >= slice) { await yieldFn(); t = nowMs(); } }
  return r.value;
}

// makeRoom(opts) -> { object, rig, update(dt,time,camera), ... }   (see docs/kit/interior.md)
// makeRoomAsync(opts, ctx.yield) is the same room built in short steps that hand the page back in between
// (same result, same random draws): `const room = await INT.makeRoomAsync({ ... }, ctx.yield);`
// Await it before anything else uses the same rng or rig: both are being drawn from and filled until it resolves.
export function makeRoom(o = {}) { return runSteps(roomSteps(o)); }
export async function makeRoomAsync(o = {}, yieldFn, slice = 8) { return runStepsAsync(roomSteps(o), yieldFn, slice); }
function* roomSteps(o = {}) {
  const c = roomContext(o), { rig, pal, S, st } = c; yield;
  if (c.style === 'nave') yield* buildNave(c); else if (c.style === 'greenhouse') yield* buildGreenhouse(c); else yield* buildHall(c);
  if (c.style === 'library') yield* libraryExtras(c);
  if (c.style === 'carriage') yield* carriageExtras(c);
  rig.setBounds([-c.xOut, 0, -c.L], [c.xOut, c.top, c.entry === 'open' ? 1e6 : 0], 0);
  yield;

  const floorType = FLOOR_MODE[o.floor] != null ? o.floor : st.floor, fd = FLOOR_DEFAULTS[floorType];
  const patA = (o.floorPattern || fd.patA).slice(); if (c.style === 'nave' && !o.floorPattern) { patA[0] = 1.15; patA[1] = 0.006; }
  if (c.style === 'greenhouse' && !o.floorPattern) { patA[0] = 0.42; patA[2] = 0; }
  const floorMat = interiorMaterial({ rig, pattern: 'floor', mode: FLOOR_MODE[floorType], colors: [pal.floorA, pal.floorB, pal.floorC, pal.floorD], patA, patB: [o.floorGloss ?? fd.patB[0], fd.patB[1], 0, 0] });
  const wallType = WALL_MODE[o.wall] != null ? o.wall : st.wall, wains = o.wainscot ?? st.wainscot;
  const wallMat = interiorMaterial({ rig, pattern: 'wall', mode: WALL_MODE[wallType], colors: [pal.wallA, pal.wallB, pal.wainscot, pal.wallD],
    patA: [wains, c.style === 'carriage' ? 0.5 : 0.66, o.wallPatternScale ?? (c.style === 'nave' ? 1.6 : 1), c.tiers ? c.tiers.t2 / S : 0], patB: [o.wallGloss ?? 0.1, c.style === 'carriage' ? 0.5 : 0.3, 0, 0] });
  const propMat = propMaterial({ rig, highlights: c.style !== 'nave' });

  const group = new THREE.Group(); group.name = 'interior-room-' + c.style;
  // the rig's sky fill is per vertex: give the big flat faces a few vertices across
  const edge = o.maxEdge ?? Math.min(c.bay, c.wallH, c.W) / 2.5;
  yield* c.fb.tessellateSteps(edge); yield* c.wb.tessellateSteps(edge); yield* c.tb.tessellateSteps(edge * 1.5, edge * 0.4);
  const floor = new THREE.Mesh(c.fb.build(), floorMat); floor.name = 'floor'; group.add(floor); yield;
  // walls and trim are cut into chunks along the hall so they draw front to back and cull behind the camera
  const nc = o.chunks ?? Math.min(c.bays, 10); let chunks = 0;
  yield* c.wb.sortByDepthSteps(); yield; yield* c.tb.sortByDepthSteps(); yield;
  for (const g of yield* c.wb.buildChunkSteps(nc, c.L)) { const m = new THREE.Mesh(g, wallMat); m.name = 'walls'; group.add(m); chunks++; }
  for (const g of yield* c.tb.buildChunkSteps(nc, c.L)) { const m = new THREE.Mesh(g, propMat); m.name = 'trim'; group.add(m); chunks++; }
  let triangles = c.fb.triangles + c.wb.triangles + c.tb.triangles;
  const wl = makeWindowLight({ rig, rng: c.rng.fork('light'), ...(st.windowLight || {}), ...(o.windowLight || {}) });
  group.add(wl.object); triangles += wl.triangles;
  for (const l of c.lamps) rig.addLight(l);

  const ex = c.exit, ew = ex.w * S, eh = ex.h * S;
  const portal = ex.arch === 1 ? { shape: 'arch', width: ew * 0.96, height: eh * 0.98 } : ex.arch === 2 ? { shape: 'arch', width: ew * 0.8, height: eh * 0.9 } : { shape: 'rect', width: ew * 0.96, height: eh * 0.98 };
  const room = {
    object: group, rig, style: c.style, scale: S, uniforms: rig.uniforms, triangles, drawCalls: 1 + chunks + (wl.panes ? 1 : 0) + wl.shafts.length + wl.motes.length,
    size: { width: c.W, length: c.L, height: c.top, wallHeight: c.wallH, outerWidth: c.xOut * 2, bay: c.bay, bays: c.bays },
    sunSide: c.side, features: { tiers: c.tiers || null, beds: c.beds || null }, windows: rig.rows, frames: c.frames, slots: c.slots, anchors: c.anchors, palette: pal,
    materials: { floor: floorMat, wall: wallMat, prop: propMat }, light: wl,
    // exit doorway: put the last path point at exit.position (room-local) and use exit.portal as the world's portal spec
    exit: { position: new V3(0, portal.height / 2 + 0.02 * S, -c.L), width: ew, height: eh, depth: c.style === 'greenhouse' ? 0.4 * S : c.th, portal },
    entry: { position: new V3(0, Math.min(eh * 0.5, c.top * 0.45), 0), depth: c.entry === 'open' ? 0 : (c.style === 'greenhouse' ? 0.4 * S : c.th) },
    // room-local point -> world (after you have placed room.object)
    toWorld(x, y, z, out = new V3()) { group.updateWorldMatrix(true, false); return out.set(x, y, z).applyMatrix4(group.matrixWorld); },
    update(dt, time, camera) { rig.update(time, group); wl.update(dt, time, camera); },
  };
  return room;
}

// ---------------------------------------------------------------------------------------------
// furniture and props: geometry generators.
// Every generator takes { rng, scale = 1, ...colours } and returns a BufferGeometry with position,
// normal, color (linear RGB) and surf. Origin: centre of the footprint on the floor, +Y up, front = +Z.
// Sizes are real-life metres multiplied by `scale`. geometry.userData holds size and anchors
// (already scaled): size [w,h,d], top (height of the usable surface), flames [[x,y,z,size]],
// light [x,y,z], fire {...}, runs [...].
// ---------------------------------------------------------------------------------------------
const WOOD = { oak: '#8a5a30', walnut: '#4e2f1a', mahogany: '#5e2415', pine: '#b88a52', ebony: '#15100c', cherry: '#7a3a1e' };
const prng = (o) => (o && typeof o.rng === 'function' ? o.rng : makeRng(7));

function fin(b, o = {}, info = {}) {
  const g = b.build(), s = o.scale ?? 1;
  if (s !== 1) { g.scale(s, s, s); g.computeBoundingSphere(); g.computeBoundingBox(); }
  const sc = (v) => (typeof v === 'number' ? v * s : Array.isArray(v) ? v.map(sc) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, sc(x)])) : v);
  g.userData = sc(info); g.userData.triangles = b.triangles;
  return g;
}

// Table. o: { width, depth, height, round, legs:'turned'|'square'|'pedestal', color, drawers }
export function tableGeometry(o = {}) {
  const w = o.width ?? 1.6, d = o.depth ?? 0.9, h = o.height ?? 0.76, c = o.color ?? WOOD.walnut, b = makeBuilder();
  const dark = tone(c, -0.04), round = !!o.round, legs = o.legs || (round ? 'pedestal' : 'turned');
  if (round) {
    const r = w / 2;
    b.add(lathe([[0.001, h - 0.045], [r - 0.03, h - 0.045], [r, h - 0.03], [r, h - 0.012], [r - 0.012, h], [0.001, h]], 32), { c, surf: surf(1, 0.55) });
    b.add(cyl(r * 0.82, r * 0.82, 0.07, 24, true), { p: [0, h - 0.08, 0], c: dark, surf: S_WOOD });
  } else {
    b.add(bevelBox(w, 0.045, d, 0.012), { p: [0, h - 0.0225, 0], c, surf: surf(1, 0.55) });
    const ax = w - 0.16, az = d - 0.16, ah = o.drawers ? 0.16 : 0.09;
    for (const s of [-1, 1]) {
      b.add(bevelBox(ax, ah, 0.025, 0.005), { p: [0, h - 0.045 - ah / 2, s * az / 2], c: dark, surf: S_WOOD });
      b.add(bevelBox(0.025, ah, az, 0.005), { p: [s * ax / 2, h - 0.045 - ah / 2, 0], c: dark, surf: S_WOOD });
    }
    if (o.drawers) for (let i = 0; i < o.drawers; i++) { const dw = ax / o.drawers, x = -ax / 2 + dw * (i + 0.5);
      b.add(bevelBox(dw - 0.04, ah - 0.04, 0.02, 0.006), { p: [x, h - 0.045 - ah / 2, az / 2 + 0.012], c: tone(c, 0.02), surf: S_WOOD });
      b.add(sph(0.016, 8, 6), { p: [x, h - 0.045 - ah / 2, az / 2 + 0.03], c: '#c9a148', surf: S_BRASS }); }
  }
  if (legs === 'pedestal') {
    const r = Math.min(w, d) * 0.5;
    b.add(lathe([[r * 0.5, 0], [r * 0.52, 0.03], [r * 0.2, 0.07], [0.07, 0.14], [0.05, 0.3], [0.085, 0.42], [0.06, 0.55], [0.11, h - 0.09], [0.16, h - 0.045]], 14), { c: dark, surf: S_WOOD, grad: [0, 0.2, 0.7, 1] });
  } else {
    const ix = w / 2 - 0.085, iz = d / 2 - 0.085, lh = h - 0.045;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      if (legs === 'square') b.add(bevelBox(0.065, lh, 0.065, 0.008), { p: [sx * ix, lh / 2, sz * iz], s: [1, 1, 1], c: dark, surf: S_WOOD, grad: [0, 0.2, 0.7, 1] });
      else b.add(turnedLeg(lh, 0.042, 8), { p: [sx * ix, 0, sz * iz], c: dark, surf: S_WOOD, grad: [0, 0.2, 0.7, 1] });
    }
  }
  return fin(b, o, { size: [w, h, d], top: h });
}

// Chair. o: { style:'dining'|'arm'|'stool', color, seatColor, rng }
export function chairGeometry(o = {}) {
  const st = o.style || 'dining', c = o.color ?? WOOD.walnut, sc = o.seatColor ?? '#7a2f3a', b = makeBuilder();
  if (st === 'arm') {
    // upholstered wing chair
    const w = 0.82, d = 0.85, fab = S_FAB, c2 = tone(sc, -0.03);
    b.add(bevelBox(w, 0.28, d, 0.06), { p: [0, 0.27, 0], c: c2, surf: fab });
    b.add(cushion(w - 0.26, 0.17, d - 0.2, 0.5, 7), { p: [0, 0.47, 0.06], c: sc, surf: fab });
    b.add(cushion(w - 0.2, 0.72, 0.2, 0.5, 7), { p: [0, 0.78, -d / 2 + 0.14], r: [-0.14, 0, 0], c: sc, surf: fab });
    for (const s of [-1, 1]) {
      b.add(cushion(0.17, 0.36, d - 0.08, 0.45, 6), { p: [s * (w / 2 - 0.085), 0.55, 0.02], c: c2, surf: fab });
      b.add(cushion(0.13, 0.42, 0.26, 0.5, 5), { p: [s * (w / 2 - 0.1), 0.95, -d / 2 + 0.22], r: [0, s * 0.35, 0], c: c2, surf: fab });
      for (const z of [-1, 1]) b.add(turnedLeg(0.14, 0.03, 6), { p: [s * (w / 2 - 0.08), 0, z * (d / 2 - 0.08)], c, surf: S_WOOD });
    }
    return fin(b, o, { size: [w, 1.14, d], top: 0.5 });
  }
  if (st === 'stool') {
    b.add(lathe([[0.001, 0.44], [0.16, 0.44], [0.175, 0.455], [0.175, 0.475], [0.16, 0.49], [0.001, 0.495]], 16), { c, surf: S_WOOD });
    for (let i = 0; i < 3; i++) { const a = i * TAU / 3; b.add(turnedLeg(0.45, 0.022, 6), { p: [Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13], r: [Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12], c, surf: S_WOOD }); }
    return fin(b, o, { size: [0.36, 0.5, 0.36], top: 0.495 });
  }
  const w = 0.45, d = 0.44, sh = 0.46, bh = 0.98;
  b.add(bevelBox(w, 0.035, d, 0.01), { p: [0, sh - 0.0175, 0], c, surf: S_WOOD });
  b.add(cushion(w - 0.05, 0.06, d - 0.06, 0.45, 5), { p: [0, sh + 0.018, 0.005], c: sc, surf: S_FAB });
  for (const s of [-1, 1]) {
    b.add(turnedLeg(sh - 0.035, 0.024, 6), { p: [s * (w / 2 - 0.035), 0, d / 2 - 0.035], c, surf: S_WOOD, grad: [0, 0.15, 0.7, 1] });
    // back leg runs up into the back post with a slight rake
    b.add(bevelBox(0.036, bh, 0.036, 0.006), { p: [s * (w / 2 - 0.03), bh / 2, -d / 2 + 0.03 - 0.03], r: [-0.07, 0, 0], c, surf: S_WOOD, grad: [0, 0.15, 0.7, 1] });
    b.add(new THREE.BoxGeometry(0.02, 0.03, d - 0.08), { p: [s * (w / 2 - 0.035), 0.2, 0], c, surf: S_WOOD });
  }
  b.add(bevelBox(w - 0.02, 0.085, 0.03, 0.01), { p: [0, bh - 0.05, -d / 2 - 0.035], r: [-0.07, 0, 0], c, surf: S_WOOD });
  b.add(bevelBox(w - 0.06, 0.04, 0.022, 0.006), { p: [0, sh + 0.12, -d / 2 - 0.003], r: [-0.07, 0, 0], c, surf: S_WOOD });
  for (let i = 0; i < 4; i++) b.add(new THREE.BoxGeometry(0.03, bh - sh - 0.2, 0.014), { p: [(i - 1.5) * 0.085, sh + 0.12 + (bh - sh - 0.2) / 2, -d / 2 - 0.018], r: [-0.07, 0, 0], c, surf: S_WOOD });
  b.add(new THREE.BoxGeometry(w - 0.08, 0.025, 0.02), { p: [0, 0.2, d / 2 - 0.035], c, surf: S_WOOD });
  return fin(b, o, { size: [w, bh, d], top: sh + 0.04 });
}

// Sofa. o: { width, seats, color, pillowColors:[...], rng }
export function sofaGeometry(o = {}) {
  const rng = prng(o), w = o.width ?? 2.1, d = 0.92, n = o.seats ?? 3, c = o.color ?? '#3f5d54', c2 = tone(c, -0.04), b = makeBuilder();
  const arm = 0.2, iw = w - arm * 2;
  b.add(bevelBox(w, 0.24, d, 0.05), { p: [0, 0.26, 0], c: c2, surf: S_FAB });
  b.add(bevelBox(w, 0.5, 0.2, 0.06), { p: [0, 0.6, -d / 2 + 0.1], r: [-0.1, 0, 0], c: c2, surf: S_FAB });
  for (const s of [-1, 1]) {
    b.add(bevelBox(arm, 0.34, d, 0.05), { p: [s * (w / 2 - arm / 2), 0.46, 0], c: c2, surf: S_FAB });
    b.add(cyl(0.125, 0.125, d * 0.98, 12), { p: [s * (w / 2 - arm / 2), 0.63, 0], r: [PI / 2, 0, 0], c, surf: S_FAB });
    for (const z of [-1, 1]) b.add(turnedLeg(0.14, 0.035, 6), { p: [s * (w / 2 - 0.1), 0, z * (d / 2 - 0.1)], c: WOOD.walnut, surf: S_WOOD });
  }
  for (let i = 0; i < n; i++) {
    const x = -iw / 2 + iw / n * (i + 0.5);
    b.add(cushion(iw / n - 0.015, 0.17, d - 0.26, 0.42, 8), { p: [x, 0.46, 0.09], c: tone(c, rng.range(-0.01, 0.02)), surf: S_FAB });
    b.add(cushion(iw / n - 0.02, 0.46, 0.2, 0.45, 8), { p: [x, 0.74, -d / 2 + 0.27], r: [-0.2, 0, 0], c: tone(c, rng.range(-0.01, 0.02)), surf: S_FAB });
  }
  const pc = o.pillowColors || ['#c98a3a', '#d8cdb4', '#8a2f3a'];
  for (let i = 0; i < 2; i++) { const s = i ? 1 : -1;
    b.add(cushion(0.4, 0.4, 0.14, 0.6, 7, 0.5), { p: [s * (iw / 2 - 0.17), 0.7, 0.02], r: [-0.35, s * -0.5, s * rng.range(-0.25, 0.1)], c: rng.pick(pc), surf: S_FAB }); }
  return fin(b, o, { size: [w, 0.98, d], top: 0.55 });
}

// Bed with pillows and a rumpled blanket. o: { width, length, color (blanket), sheetColor, frameColor, rng }
export function bedGeometry(o = {}) {
  const rng = prng(o), w = o.width ?? 1.5, L = o.length ?? 2.05, c = o.color ?? '#3d5a80', fc = o.frameColor ?? WOOD.cherry, sheetC = o.sheetColor ?? '#e9e3d6', b = makeBuilder();
  const top = 0.62, ph = rng() * 6;
  for (const s of [-1, 1]) {
    b.add(bevelBox(0.04, 0.2, L, 0.01), { p: [s * (w / 2 + 0.02), 0.32, 0], c: fc, surf: S_WOOD });
    b.add(lathe([[0.04, 0], [0.05, 0.03], [0.035, 0.08], [0.045, 0.3], [0.045, 1.02], [0.03, 1.05], [0.055, 1.11], [0.03, 1.17], [0.001, 1.19]], 8), { p: [s * (w / 2 + 0.02), 0, -L / 2], c: fc, surf: S_WOOD });
    b.add(lathe([[0.04, 0], [0.05, 0.03], [0.035, 0.08], [0.045, 0.3], [0.045, 0.62], [0.03, 0.65], [0.05, 0.7], [0.001, 0.76]], 8), { p: [s * (w / 2 + 0.02), 0, L / 2], c: fc, surf: S_WOOD });
  }
  b.add(bevelBox(w, 0.72, 0.045, 0.015), { p: [0, 0.62, -L / 2], c: fc, surf: S_WOOD });
  b.add(cyl(0.035, 0.035, w + 0.02, 8), { p: [0, 1.0, -L / 2], r: [0, 0, PI / 2], c: tone(fc, 0.02), surf: S_WOOD });
  b.add(bevelBox(w, 0.36, 0.04, 0.012), { p: [0, 0.44, L / 2], c: fc, surf: S_WOOD });
  b.add(cushion(w, 0.26, L - 0.06, 0.3, 8), { p: [0, top - 0.13, 0], c: sheetC, surf: S_FAB });
  for (const s of [-1, 1]) b.add(cushion(w * 0.44, 0.15, 0.4, 0.6, 7, 0.45), { p: [s * w * 0.24, top + 0.06, -L / 2 + 0.28], r: [0.22, s * rng.range(-0.1, 0.1), 0], c: tone(sheetC, 0.02), surf: S_FAB });
  // blanket: lies over the lower part of the mattress and hangs over both sides and the foot
  const z0 = -L / 2 + 0.6, Lb = L / 2 - 0.03 - z0, drop = 0.3, cc = col(c), fold = col(sheetC);
  const g = sheet(26, 20, (u, v, out) => {
    const s = (u - 0.5) * (w + 2 * drop), t = v * (Lb + drop);
    let x = clamp(s, -w / 2, w / 2), y = top + 0.012, z = z0 + Math.min(t, Lb);
    const hx = Math.max(0, Math.abs(s) - w / 2), hz = Math.max(0, t - Lb);
    y += 0.014 * Math.sin(x * 8 + z * 5 + ph) * Math.sin(z * 6.3 + ph * 2) + 0.012 * Math.sin((x - z) * 4.6 + ph) + 0.02 * Math.exp(-Math.pow((t - 0.07) / 0.05, 2));
    if (hx > 0) { const k = Math.min(1, hx / 0.06); x += Math.sign(s) * (0.02 * k + 0.014 * Math.sin(z * 21 + ph) * k); y -= hx; }
    if (hz > 0) { const k = Math.min(1, hz / 0.06); z += 0.02 * k + 0.014 * Math.sin(x * 19 + ph) * k; y -= hz; }
    out[0] = x; out[1] = y; out[2] = z;
  }, true);
  b.add(g, { c: '#ffffff', surf: S_FAB, tint: (X, Y, Z, k) => { const f = smoothstep(z0 + 0.14, z0 + 0.1, Z); k.setRGB(lerp(cc.r, fold.r, f), lerp(cc.g, fold.g, f), lerp(cc.b, fold.b, f)); const sh = 0.86 + 0.14 * smoothstep(top - 0.3, top, Y); k.multiplyScalar(sh); } });
  return fin(b, o, { size: [w + 0.12, 1.19, L + 0.1], top });
}

const BOOK_COLORS = ['#6b1f1f', '#7a2a1a', '#1f3a5a', '#22405a', '#2f4a2a', '#3a4a22', '#4a2f1a', '#5a4022', '#b89a62', '#15120f', '#3a1f3a', '#8a6a2a', '#274a4a', '#7a1f2f'];
// a row of standing books into builder b: fills x0..x1 on a shelf at height y, spines facing +z
function bookRow(b, rng, x0, x1, y, zFront, depth, clear, pal = BOOK_COLORS, m = null) {
  let x = x0 + rng.range(0, 0.01);
  while (x < x1 - 0.02) {
    if (rng.chance(0.07)) { x += rng.range(0.03, 0.12); continue; }
    const t = Math.min(rng.range(0.018, 0.052), x1 - x), hb = clear * rng.range(0.6, 0.94), db = depth * rng.range(0.7, 0.94);
    const c = tone(rng.pick(pal), rng.range(-0.03, 0.05), rng.range(-0.1, 0.05));
    if (rng.chance(0.06) && x + hb * 0.9 < x1) { // a little pile lying flat
      let yy = y; const n = rng.int(2, 4), wl = hb * rng.range(0.8, 0.95);
      for (let i = 0; i < n; i++) { const tt = rng.range(0.02, 0.045); b.add(new THREE.BoxGeometry(wl * rng.range(0.85, 1), tt, db), { p: [x + wl / 2, yy + tt / 2, zFront - db / 2], pre: m, c: tone(rng.pick(pal), rng.range(-0.03, 0.05)), surf: surf(0, 0.3) }); yy += tt; }
      x += wl + 0.004; continue;
    }
    const lean = rng.chance(0.05) ? rng.range(0.12, 0.3) : 0;
    b.add(new THREE.BoxGeometry(t, hb, db), { p: [x + t / 2 + lean * hb * 0.5, y + hb / 2 * Math.cos(lean), zFront - db / 2], r: [0, 0, -lean], pre: m, c, surf: surf(0, 0.32) });
    if (!lean && rng.chance(0.55)) { // gilt band or paper label on the spine
      const yb = y + hb * rng.range(0.55, 0.8), bh = hb * rng.range(0.04, 0.14), gold = rng.chance(0.6), z = zFront + 0.0006;
      const q = [[x + t * 0.08, yb, z], [x + t * 0.92, yb, z], [x + t * 0.92, yb + bh, z], [x + t * 0.08, yb + bh, z]].map((p) => (m ? new V3(p[0], p[1], p[2]).applyMatrix4(m).toArray() : p));
      b.quad(q[0], q[1], q[2], q[3], gold ? '#d8b25a' : '#e6dcc0', gold ? S_BRASS : S_MATTE);
    }
    x += t + rng.range(0, 0.002);
  }
}

// Bookcase. o: { width, height, depth, shelves, color, books:true, bookColors, rng }. userData.runs lists the shelf spaces.
export function bookshelfGeometry(o = {}) {
  const rng = prng(o), w = o.width ?? 1.0, h = o.height ?? 2.05, d = o.depth ?? 0.32, n = o.shelves ?? 5, c = o.color ?? WOOD.walnut, b = makeBuilder();
  const t = 0.028, base = 0.1, crown = 0.07, inner = h - base - crown, gap = inner / n, runs = [];
  for (const s of [-1, 1]) b.add(bevelBox(t, h, d, 0.005), { p: [s * (w / 2 - t / 2), h / 2, 0], c, surf: S_WOOD, grad: [0, 0.3, 0.75, 1] });
  b.add(bevelBox(w, base, d - 0.02, 0.008), { p: [0, base / 2, -0.01], c: tone(c, -0.03), surf: S_WOOD });
  b.add(bevelBox(w + 0.05, crown, d + 0.03, 0.015), { p: [0, h - crown / 2, 0.005], c: tone(c, 0.01), surf: S_WOOD });
  b.add(bevelBox(w - 0.01, h - 0.02, 0.012, 0.002), { p: [0, h / 2, -d / 2 + 0.008], c: tone(c, -0.08), surf: S_WOODM });
  for (let i = 0; i < n; i++) {
    const y = base + i * gap;
    b.add(bevelBox(w - t * 2, 0.022, d - 0.03, 0.004), { p: [0, y + 0.011, 0.002], c, surf: S_WOOD });
    const run = { x0: -w / 2 + t + 0.004, x1: w / 2 - t - 0.004, y: y + 0.022, z: d / 2 - 0.03, depth: d - 0.07, height: gap - 0.035 };
    runs.push(run);
    if (o.books !== false) bookRow(b, rng, run.x0, run.x1, run.y, run.z, run.depth, run.height, o.bookColors);
  }
  return fin(b, o, { size: [w, h, d], top: h, runs });
}

// A pile of books lying flat. o: { count, rng }
export function bookStackGeometry(o = {}) {
  const rng = prng(o), n = o.count ?? 5, b = makeBuilder(); let y = 0, mw = 0;
  for (let i = 0; i < n; i++) {
    const w = rng.range(0.16, 0.24), d = rng.range(0.22, 0.3), t = rng.range(0.022, 0.055), a = rng.range(-0.35, 0.35), c = tone(rng.pick(BOOK_COLORS), rng.range(-0.02, 0.05));
    b.add(bevelBox(w, t, d, 0.003), { p: [0, y + t / 2, 0], r: [0, a, 0], c, surf: surf(0, 0.3) });
    b.add(new THREE.BoxGeometry(w - 0.012, t - 0.008, d - 0.008), { p: [Math.cos(a) * 0.005, y + t / 2, -Math.sin(a) * 0.005], r: [0, a, 0], c: '#e4dcc4', surf: S_MATTE });
    y += t; mw = Math.max(mw, w, d);
  }
  return fin(b, o, { size: [mw, y, mw], top: y });
}

// Lamps. o: { kind:'table'|'desk'|'floor'|'pendant', color (base), shadeColor, glow, cord (pendant drop) }.
// userData.light = bulb position for rig.addLight. A pendant's origin is its ceiling fixing; it hangs down and sways.
export function lampGeometry(o = {}) {
  const kind = o.kind || 'table', b = makeBuilder(), glow = o.glow ?? 1, brass = '#c9a148', warm = '#ffd49a';
  let light, size;
  if (kind === 'pendant') {
    const cl = o.cord ?? 0.9, sc = o.shadeColor ?? '#1f4a3a', sw = [0, -cl - 0.25, 0, 1];
    b.add(cyl(0.05, 0.06, 0.025, 12), { p: [0, -0.0125, 0], c: brass, surf: S_BRASS });
    b.add(cyl(0.004, 0.004, cl, 5, true), { p: [0, -cl / 2, 0], c: '#1a1612', surf: S_MATTE, sway: sw });
    b.add(cyl(0.022, 0.03, 0.06, 8), { p: [0, -cl - 0.02, 0], c: brass, surf: S_BRASS, sway: sw });
    const prof = [[0.24, -cl - 0.225], [0.235, -cl - 0.215], [0.19, -cl - 0.15], [0.07, -cl - 0.065], [0.03, -cl - 0.04]];
    b.add(lathe(prof, 20), { c: sc, surf: surf(0, 0.75), sway: sw });
    b.add(flipped(lathe(prof.map((p) => [p[0] - 0.004, p[1] - 0.003]), 20)), { c: '#ffe2b0', surf: surf(0, 0.3, 0, 1.5 * glow), sway: sw });
    b.add(sph(0.045, 10, 8), { p: [0, -cl - 0.13, 0], s: [1, 1.25, 1], c: warm, surf: surf(0, 0.5, 0, 9 * glow), sway: sw });
    light = [0, -cl - 0.2, 0]; size = [0.48, cl + 0.23, 0.48];
  } else if (kind === 'desk') {
    const sc = o.shadeColor ?? '#1c7a48';
    b.add(cyl(0.085, 0.095, 0.018, 16), { p: [0, 0.009, 0], s: [1.35, 1, 1], c: brass, surf: S_BRASS });
    b.add(tube([[0, 0.018, -0.02], [0, 0.2, -0.05], [0, 0.33, -0.03], [0, 0.365, 0.03]], 0.009, 10, 6), { c: brass, surf: S_BRASS });
    const sh = new THREE.CylinderGeometry(0.058, 0.058, 0.27, 12, 1, true, 0, PI); sh.rotateZ(PI / 2); sh.rotateX(-PI / 2);
    b.add(twoSided(sh), { p: [0, 0.345, 0.05], c: sc, surf: surf(0, 0.85, 0, 1.3 * glow) });
    for (const s of [-1, 1]) b.add(new THREE.CircleGeometry(0.058, 8, 0, PI), { p: [s * 0.135, 0.345, 0.05], r: [0, s * PI / 2, 0], c: sc, surf: surf(0, 0.85, 0, 1.0 * glow) });
    b.add(cyl(0.014, 0.014, 0.2, 6), { p: [0, 0.362, 0.05], r: [0, 0, PI / 2], c: warm, surf: surf(0, 0.4, 0, 8 * glow) });
    light = [0, 0.3, 0.06]; size = [0.3, 0.41, 0.2];
  } else {
    const floor = kind === 'floor', hBase = floor ? 1.3 : 0.33, sc = o.shadeColor ?? '#efc98c', c = o.color ?? (floor ? brass : '#2c5a68');
    if (floor) {
      b.add(lathe([[0.16, 0], [0.17, 0.02], [0.05, 0.05], [0.018, 0.09], [0.015, hBase]], 14), { c, surf: S_BRASS });
    } else b.add(lathe([[0.065, 0], [0.085, 0.015], [0.1, 0.1], [0.08, 0.2], [0.032, 0.29], [0.02, hBase]], 16), { c, surf: S_CER });
    b.add(cyl(0.008, 0.008, 0.14, 6), { p: [0, hBase + 0.07, 0], c: brass, surf: S_BRASS });
    const r0 = floor ? 0.25 : 0.2, r1 = floor ? 0.17 : 0.13, sh0 = hBase + 0.05, sh1 = sh0 + (floor ? 0.3 : 0.24);
    b.add(twoSided(lathe([[r0, sh0], [r1, sh1]], 20)), { c: sc, surf: surf(2, 0.05, 0, 1.25 * glow), grad: [sh0, sh1, 1.2, 0.75] });
    for (const [r, y] of [[r0, sh0], [r1, sh1]]) b.add(new THREE.TorusGeometry(r, 0.004, 4, 20), { p: [0, y, 0], r: [PI / 2, 0, 0], c: brass, surf: S_BRASS });
    b.add(sph(0.04, 10, 8), { p: [0, sh0 + 0.1, 0], s: [1, 1.3, 1], c: warm, surf: surf(0, 0.5, 0, 6 * glow) });
    light = [0, sh0 + 0.1, 0]; size = [r0 * 2, sh1, r0 * 2];
  }
  return fin(b, o, { size, light, top: size[1] });
}

// Candles. o: { holder:'stick'|'plate'|'candelabra', height, count, rng }. userData.flames = [[x,y,z,size],...]
export function candleGeometry(o = {}) {
  const rng = prng(o), holder = o.holder || 'stick', b = makeBuilder(), brass = '#c9a148', flames = [];
  const candle = (x, y, z, h, r = 0.011) => {
    b.add(cyl(r * 0.92, r, h, 8), { p: [x, y + h / 2, z], c: '#efe5cb', surf: surf(0, 0.5, 0, 0.12), grad: [y, y + h, 0.8, 1.25] });
    b.add(cyl(0.0012, 0.0012, 0.012, 4), { p: [x, y + h + 0.006, z], c: '#1a1410', surf: S_MATTE });
    flames.push([x, y + h + 0.009, z, 0.05]);
  };
  let hh = 0.3;
  if (holder === 'plate') {
    b.add(lathe([[0.001, 0], [0.05, 0], [0.06, 0.012], [0.058, 0.016], [0.02, 0.008], [0.001, 0.008]], 14), { c: brass, surf: S_BRASS });
    const n = o.count ?? 1; for (let i = 0; i < n; i++) { const a = i * TAU / n, r = n > 1 ? 0.028 : 0, h = (o.height ?? 0.12) * rng.range(0.6, 1); candle(Math.cos(a) * r, 0.008, Math.sin(a) * r, h, 0.016); hh = Math.max(hh, h); }
    hh = 0.16;
  } else if (holder === 'candelabra') {
    const n = o.count ?? 3, H = 0.34;
    b.add(lathe([[0.07, 0], [0.075, 0.012], [0.03, 0.03], [0.014, 0.06], [0.022, 0.1], [0.012, 0.14], [0.012, H - 0.06], [0.02, H - 0.04], [0.012, H]], 12), { c: brass, surf: S_BRASS });
    for (let i = 0; i < n; i++) {
      const centre = n % 2 === 1 && i === (n - 1) / 2, x = (i - (n - 1) / 2) * 0.11, top = centre ? H + 0.03 : H - 0.03;
      if (!centre) b.add(tube([[0, H - 0.1, 0], [x * 0.5, H - 0.14, 0], [x, H - 0.1, 0], [x, top - 0.01, 0]], 0.006, 10, 5), { c: brass, surf: S_BRASS });
      b.add(lathe([[0.008, top - 0.02], [0.022, top - 0.006], [0.024, top], [0.012, top], [0.012, top + 0.012]], 8), { p: [x, 0, 0], c: brass, surf: S_BRASS });
      candle(x, top + 0.004, 0, (o.height ?? 0.16) * rng.range(0.75, 1));
    }
    hh = H + 0.22;
  } else {
    const H = 0.15;
    b.add(lathe([[0.045, 0], [0.05, 0.01], [0.02, 0.025], [0.011, 0.05], [0.019, 0.08], [0.01, 0.11], [0.024, H - 0.008], [0.026, H], [0.013, H], [0.013, H + 0.012]], 12), { c: brass, surf: S_BRASS });
    candle(0, H + 0.002, 0, o.height ?? 0.2); hh = H + (o.height ?? 0.2);
  }
  return fin(b, o, { size: [0.12, hh, 0.12], flames, top: hh });
}

// Fireplace: stone surround, mantel shelf, sooty firebox, logs, andirons, hearth slab.
// o: { width, color, hearthColor, breast (height of chimney breast above the mantel), breastColor }
// userData.fire = { position, width, height } for makeFlames, userData.light, userData.top = mantel shelf height.
export function fireplaceGeometry(o = {}) {
  const b = makeBuilder(), ow = (o.width ?? 1.75) - 0.8, jw = 0.4, W = ow + jw * 2, oh = 0.88, mh = 1.34, dp = 0.44, c = o.color ?? '#cfc6b4', st = surf(3, 0.42);
  const dk = tone(c, -0.05);
  for (const s of [-1, 1]) {
    const x = s * (ow / 2 + jw / 2);
    b.add(bevelBox(jw, mh - 0.1, dp, 0.015), { p: [x, (mh - 0.1) / 2, 0], c, surf: st, grad: [0, 0.4, 0.8, 1] });
    b.add(bevelBox(jw + 0.05, 0.16, dp + 0.04, 0.02), { p: [x, 0.08, 0.01], c: dk, surf: st });
    b.add(bevelBox(jw + 0.04, 0.09, dp + 0.04, 0.02), { p: [x, oh + 0.03, 0.01], c: dk, surf: st });
    for (let i = -1; i <= 1; i++) b.add(cyl(0.028, 0.028, oh - 0.3, 8), { p: [x + i * 0.09, 0.16 + (oh - 0.3) / 2, dp / 2 - 0.004], c: tone(c, 0.03), surf: st });
  }
  b.add(bevelBox(W, mh - 0.1 - oh, dp, 0.015), { p: [0, oh + (mh - 0.1 - oh) / 2, 0], c, surf: st });
  b.add(bevelBox(ow * 0.5, (mh - oh) * 0.42, 0.03, 0.012), { p: [0, oh + (mh - 0.1 - oh) / 2 + 0.01, dp / 2 + 0.008], c: tone(c, 0.04), surf: st });
  b.add(bevelBox(W + 0.1, 0.07, dp + 0.07, 0.02), { p: [0, mh - 0.1, 0.03], c: dk, surf: st });
  b.add(bevelBox(W + 0.26, 0.065, dp + 0.16, 0.018), { p: [0, mh - 0.0325, 0.07], c: tone(c, 0.03), surf: surf(3, 0.55) });
  b.add(bevelBox(W + 0.36, 0.05, dp + 0.62, 0.012), { p: [0, 0.025, 0.24], c: o.hearthColor ?? '#2c2a2c', surf: surf(3, 0.5) });
  // firebox (seen from inside) with a brick-dark gradient
  b.add(flipped(new THREE.BoxGeometry(ow, oh, dp + 0.2)), { p: [0, oh / 2 + 0.05, -0.105], c: '#2a1d16', surf: S_MATTE, grad: [0.05, oh, 1.5, 0.35] });
  // grate, logs, ember bed
  for (const s of [-1, 1]) {
    b.add(bevelBox(0.03, 0.03, 0.42, 0.006), { p: [s * ow * 0.26, 0.16, -0.02], c: '#18181a', surf: S_IRON });
    b.add(bevelBox(0.03, 0.3, 0.03, 0.006), { p: [s * ow * 0.26, 0.2, 0.18], c: '#18181a', surf: S_IRON });
    b.add(sph(0.035, 10, 8), { p: [s * ow * 0.26, 0.375, 0.18], c: '#c9a148', surf: S_BRASS });
    for (const z of [-0.2, 0.14]) b.add(bevelBox(0.025, 0.11, 0.025, 0.005), { p: [s * ow * 0.26, 0.105, z], c: '#18181a', surf: S_IRON });
  }
  b.add(cushion(ow * 0.62, 0.07, 0.3, 0.7, 6), { p: [0, 0.2, -0.04], c: '#ff5a18', surf: surf(0, 0.1, 0, 3.2) });
  const logs = [[-0.02, 0.215, -0.1, 0.16, 0.055], [0.03, 0.22, 0.03, -0.12, 0.05], [-0.01, 0.29, -0.04, 0.45, 0.045]];
  for (const [x, y, z, a, r] of logs) {
    b.add(cyl(r, r * 1.08, ow * 0.74, 9), { p: [x, y, z], r: [0, a, PI / 2], c: '#2b1a10', surf: surf(1, 0.1, 0, 0.5), tint: (X, Y, Z, k) => { const t = smoothstep(y + r * 0.2, y - r, Y); k.setRGB(lerp(k.r, 0.5, t), lerp(k.g, 0.12, t), lerp(k.b, 0.02, t)); } });
  }
  if (o.breast) b.add(bevelBox(W + 0.04, o.breast, dp * 0.7, 0.01), { p: [0, mh + o.breast / 2, -dp * 0.15], c: o.breastColor ?? '#d9cfba', surf: S_MATTE });
  return fin(b, o, { size: [W + 0.26, mh, dp + 0.16], top: mh, fire: { position: [0, 0.2, -0.04], width: ow * 0.6, height: oh * 0.72 }, light: [0, 0.5, 0.3], opening: [ow, oh] });
}

// --- plants ---
// a leaf / frond blade that leaves `base` in direction az, arching from elevation e0 to e1 (radians) over its length
function leafBlade(b, base, az, len, width, e0, e1, o = {}) {
  const nv = o.nv ?? 7, nu = o.nu ?? 2, pts = []; let x = 0, y = 0;
  for (let i = 0; i <= nv; i++) { pts.push([x, y]); const e = lerp(e0, e1, (i + 0.5) / nv); x += Math.cos(e) * len / nv; y += Math.sin(e) * len / nv; }
  const ca = Math.cos(az), sa = Math.sin(az), tw = o.twist ?? 0, fold = o.fold ?? 0.35, sh = o.shape ?? 0.8;
  const g = sheet(nu, nv, (u, v, out) => {
    const f = v * nv, i = Math.min(nv - 1, Math.floor(f)), t = f - i, r = lerp(pts[i][0], pts[i + 1][0], t), h = lerp(pts[i][1], pts[i + 1][1], t);
    const w = width * Math.pow(Math.sin(PI * Math.pow(clamp(v * 0.96 + 0.04, 0, 1), sh)), 0.7), s = (u - 0.5) * w, a2 = az + tw * v;
    out[0] = base[0] + ca * r - Math.sin(a2) * s; out[1] = base[1] + h + Math.abs(u - 0.5) * w * fold; out[2] = base[2] + sa * r + Math.cos(a2) * s;
  }, true);
  const c0 = col(o.c0), c1 = col(o.c1), top = base[1] + Math.max(0.05, y, ...pts.map((p) => p[1]));
  b.add(g, { c: '#ffffff', surf: o.surf || surf(0, 0.42), sway: [base[1], base[1] + len, 0, o.sway ?? 1],
    tint: (X, Y, Z, k) => { const t = clamp(Math.hypot(X - base[0], Y - base[1], Z - base[2]) / len, 0, 1); k.setRGB(lerp(c0.r, c1.r, t), lerp(c0.g, c1.g, t), lerp(c0.b, c1.b, t)); } });
  return top;
}
// a pinnate palm frond: an arching rachis with rows of narrow leaflets (two-sided quads)
function palmFrond(b, base, az, len, e0, e1, c0, c1, rng, n = 11) {
  const nv = 8, pts = []; let x = 0, y = 0;
  for (let i = 0; i <= nv; i++) { pts.push([x, y]); const e = lerp(e0, e1, (i + 0.5) / nv); x += Math.cos(e) * len / nv; y += Math.sin(e) * len / nv; }
  const ca = Math.cos(az), sa = Math.sin(az), at3 = (t) => { const f = t * nv, i = Math.min(nv - 1, Math.floor(f)), k = f - i, r = lerp(pts[i][0], pts[i + 1][0], k), h = lerp(pts[i][1], pts[i + 1][1], k); return [base[0] + ca * r, base[1] + h, base[2] + sa * r]; };
  b.add(tube(pts.map((p) => [base[0] + ca * p[0], base[1] + p[1], base[2] + sa * p[0]]), len * 0.012, 6, 3), { c: '#6a7a34', surf: surf(0, 0.4), sway: [base[1], base[1] + len, 0, 0.8] });
  const k0 = col(c0), k1 = col(c1), kk = new THREE.Color(); let top = base[1];
  for (let i = 0; i < n; i++) {
    const t = 0.2 + 0.8 * (i + 0.5) / n, p = at3(t), q = at3(Math.min(1, t + 0.04)), fx = q[0] - p[0], fy = q[1] - p[1], fz = q[2] - p[2], fl = Math.hypot(fx, fy, fz) || 1;
    const ll = len * 0.36 * Math.pow(Math.sin(PI * Math.pow(t, 0.8)), 0.6) + len * 0.05, wd = ll * 0.11, sw = clamp(t, 0, 1) * 0.9, sf = surf(0, 0.5, 0, 0, sw);
    kk.copy(k0).lerp(k1, t * 0.8 + rng.range(-0.1, 0.1)); top = Math.max(top, p[1]);
    for (const s of [-1, 1]) {
      const dx = -sa * s * 0.8 + fx / fl * 0.55, dz = ca * s * 0.8 + fz / fl * 0.55, dy = fy / fl * 0.4 - 0.3 + rng.range(-0.1, 0.1);
      const tip = [p[0] + dx * ll, p[1] + dy * ll, p[2] + dz * ll], mid = [p[0] + dx * ll * 0.45, p[1] + dy * ll * 0.3 + ll * 0.04, p[2] + dz * ll * 0.45];
      const a1 = [mid[0] + fx / fl * wd, mid[1] + fy / fl * wd + wd * 0.3, mid[2] + fz / fl * wd], a2 = [mid[0] - fx / fl * wd, mid[1] - fy / fl * wd + wd * 0.3, mid[2] - fz / fl * wd];
      b.quad(p, a1, tip, a2, kk, sf); b.quad(p, a2, tip, a1, kk, sf);
    }
  }
  return top + len * 0.1;
}
function flowerPot(b, r, h, c, sf) {
  b.add(lathe([[0.001, 0], [r * 0.7, 0], [r * 0.74, 0.01], [r * 0.95, h * 0.84], [r * 1.06, h * 0.86], [r * 1.06, h], [r * 0.94, h], [r * 0.9, h * 0.93], [0.001, h * 0.93]], 16), { c, surf: sf || surf(0, 0.22), grad: [0, h, 0.82, 1.05] });
  b.add(new THREE.CircleGeometry(r * 0.9, 12), { p: [0, h * 0.935, 0], r: [-PI / 2, 0, 0], c: '#241810', surf: S_MATTE });
}
const POT_COLORS = ['#b5653a', '#a85a34', '#e6dfd0', '#2f4f5e', '#3d5a40', '#c9b28a'];
// Potted plant. o: { kind:'fern'|'palm'|'ficus'|'snake'|'fig', height, potColor, leafColor, rng }
export function plantGeometry(o = {}) {
  const rng = prng(o), kind = o.kind || rng.pick(['fern', 'palm', 'ficus', 'snake', 'fig']), b = makeBuilder();
  const lc = col(o.leafColor ?? rng.pick(['#235c22', '#2c6a26', '#1f5a2a', '#3a6e1e'])), pc = o.potColor ?? rng.pick(POT_COLORS), glz = pc !== POT_COLORS[0] && pc !== POT_COLORS[1];
  const leaf = (dl = 0, dh = 0) => tone(lc, dl + rng.range(-0.03, 0.03), rng.range(-0.08, 0.05), dh + rng.range(-0.02, 0.02));
  let H = o.height, top = 0, R = 0.3;
  if (kind === 'fern') {
    H = H ?? 0.75; const pr = 0.15, ph = 0.24, n = 18; flowerPot(b, pr, ph, pc, glz && S_CER); R = H * 0.75;
    for (let i = 0; i < n; i++) { const a = i * 2.39996 + rng.range(-0.2, 0.2), inner = i / n, len = H * lerp(1.0, 0.6, inner) * rng.range(0.85, 1.1);
      top = Math.max(top, leafBlade(b, [Math.cos(a) * 0.03, ph * 0.93, Math.sin(a) * 0.03], a, len, len * 0.2, lerp(1.0, 1.4, inner), lerp(-0.9, 0.1, inner) + rng.range(-0.2, 0.2), { c0: leaf(-0.06), c1: leaf(0.06, 0.02), nv: 6, fold: 0.25, shape: 0.62 })); }
  } else if (kind === 'palm') {
    H = H ?? 1.8; const pr = 0.2, ph = 0.34, n = 11; flowerPot(b, pr, ph, pc, glz && S_CER); R = H * 0.5;
    for (let i = 0; i < n; i++) { const a = i * 2.39996 + rng.range(-0.3, 0.3), len = H * rng.range(0.7, 1.0), e0 = rng.range(1.05, 1.45), bx = [Math.cos(a) * 0.04, ph * 0.93, Math.sin(a) * 0.04];
      top = Math.max(top, palmFrond(b, bx, a, len, e0, rng.range(-0.9, -0.2), leaf(-0.05), leaf(0.06, 0.02), rng)); }
  } else if (kind === 'snake') {
    H = H ?? 0.9; const pr = 0.14, ph = 0.2, n = 11; flowerPot(b, pr, ph, pc, glz && S_CER); R = 0.25;
    for (let i = 0; i < n; i++) { const a = rng.range(0, TAU), r = rng.range(0, 0.07), len = H * rng.range(0.55, 1);
      top = Math.max(top, leafBlade(b, [Math.cos(a) * r, ph * 0.93, Math.sin(a) * r], a, len, 0.085, rng.range(1.38, 1.52), rng.range(1.3, 1.6), { c0: leaf(-0.08), c1: mix(leaf(0.04), '#b8b05a', 0.25), nv: 5, fold: 0.5, twist: rng.range(-1.2, 1.2), shape: 0.55, sway: 0.25, surf: surf(0, 0.6) })); }
  } else {
    // small tree: ficus (many small leaves) or fiddle-leaf fig (few big ones)
    const fig = kind === 'fig'; H = H ?? (fig ? 1.7 : 1.9); const pr = 0.21, ph = 0.36; flowerPot(b, pr, ph, pc, glz && S_CER); R = H * 0.3;
    const trunkTop = H * (fig ? 0.5 : 0.52), bend = rng.range(-0.06, 0.06);
    b.add(tube([[0, ph * 0.9, 0], [bend, ph + trunkTop * 0.35, bend * 0.5], [-bend * 0.6, ph + trunkTop * 0.7, bend], [0, ph + trunkTop, 0]], 0.022, 8, 6), { c: '#6a5038', surf: S_WOODM, sway: [ph, H, 0, 0.3] });
    const cy = ph + trunkTop + (H - ph - trunkTop) * 0.42, cr = (H - ph - trunkTop) * 0.62, nl = fig ? 24 : 110;
    for (let i = 0; i < (fig ? 4 : 6); i++) { const a = i * 2.4, e = rng.range(0.4, 1.2), l = cr * rng.range(0.7, 1.1);
      b.add(tube([[0, ph + trunkTop - 0.05, 0], [Math.cos(a) * l * 0.4 * Math.cos(e), ph + trunkTop + l * 0.4 * Math.sin(e), Math.sin(a) * l * 0.4 * Math.cos(e)], [Math.cos(a) * l * Math.cos(e), ph + trunkTop + l * Math.sin(e), Math.sin(a) * l * Math.cos(e)]], 0.009, 4, 4), { c: '#6a5038', surf: S_WOODM, sway: [ph, H, 0, 0.6] }); }
    for (let i = 0; i < nl; i++) {
      const u = rng() * 2 - 1, a = rng() * TAU, rr = cr * Math.cbrt(rng.range(0.25, 1)), sq = Math.sqrt(1 - u * u);
      const p = [Math.cos(a) * sq * rr * 0.85, cy + u * rr * 1.05, Math.sin(a) * sq * rr * 0.85], len = fig ? rng.range(0.26, 0.38) : rng.range(0.14, 0.22);
      top = Math.max(top, leafBlade(b, p, a + rng.range(-0.8, 0.8), len, len * (fig ? 0.62 : 0.5), rng.range(-0.2, 0.7), rng.range(-1.0, -0.2), { c0: leaf(-0.05), c1: leaf(0.05, 0.01), nv: fig ? 4 : 2, nu: fig ? 2 : 1, fold: fig ? 0.3 : 0, shape: 1, surf: surf(0, 0.6) }));
    }
  }
  return fin(b, o, { size: [R * 2, top, R * 2], top });
}

const FLOWER_COLORS = ['#d8344a', '#f0b429', '#f4f0e6', '#e86a9a', '#7a4fc0', '#f07a2a', '#e8d24a'];
// Vase with a bunch of flowers. o: { color, height, flowers, flowerColors, rng }
export function vaseGeometry(o = {}) {
  const rng = prng(o), h = o.height ?? 0.3, c = o.color ?? rng.pick(['#2c5a8a', '#e8e2d4', '#1f6a5a', '#8a2a3a', '#d8b25a']), b = makeBuilder(), n = o.flowers ?? 9, fc = o.flowerColors || FLOWER_COLORS;
  const r = h * 0.3;
  b.add(lathe([[0.001, 0], [r * 0.5, 0], [r * 0.56, h * 0.03], [r * 0.95, h * 0.3], [r, h * 0.45], [r * 0.7, h * 0.72], [r * 0.42, h * 0.88], [r * 0.56, h], [r * 0.48, h], [r * 0.34, h * 0.9], [0.001, h * 0.88]], 18), { c, surf: S_CER, grad: [0, h, 0.85, 1.1] });
  let top = h;
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996 + rng.range(-0.3, 0.3), spread = (i === 0 ? 0 : rng.range(0.25, 0.75)), len = h * rng.range(0.75, 1.25), tx = Math.cos(a) * spread * len * 0.6, tz = Math.sin(a) * spread * len * 0.6, ty = h * 0.9 + len * Math.sqrt(1 - spread * spread * 0.36);
    b.add(tube([[0, h * 0.5, 0], [tx * 0.35, h * 0.95 + len * 0.3, tz * 0.35], [tx, ty, tz]], 0.0035, 5, 4), { c: '#3a6a2c', surf: S_PLAIN, sway: [h, h + len, 0, 0.5] });
    if (i % 2 === 0) leafBlade(b, [tx * 0.3, h * 0.95 + len * 0.22, tz * 0.3], a + rng.range(-1, 1), len * 0.45, len * 0.12, rng.range(0.3, 0.9), -0.5, { c0: '#2f6a2c', c1: '#4a8a3a', nv: 3, sway: 0.4 });
    const fcol = col(rng.pick(fc)), pr = h * rng.range(0.1, 0.16), np = rng.int(6, 9), tilt = spread * 0.9, sw = [h, h + len, 0, 0.5];
    const m = new M4().makeTranslation(tx, ty, tz).multiply(new M4().makeRotationY(-a)).multiply(new M4().makeRotationZ(-tilt));
    b.add(sph(pr * 0.3, 8, 6), { s: [1, 0.6, 1], pre: m, c: '#e8b020', surf: S_MATTE, sway: sw });
    if (rng.chance(0.3)) { // tulip-like cup
      b.add(lathe([[pr * 0.1, 0], [pr * 0.55, pr * 0.3], [pr * 0.62, pr * 0.9], [pr * 0.45, pr * 1.3]], 8), { pre: m, p: [0, -pr * 0.2, 0], c: fcol, surf: surf(0, 0.3), sway: sw });
      b.add(flipped(lathe([[pr * 0.1, 0.004], [pr * 0.53, pr * 0.3], [pr * 0.6, pr * 0.9], [pr * 0.44, pr * 1.3]], 8)), { pre: m, p: [0, -pr * 0.2, 0], c: tone(fcol, -0.08), surf: surf(0, 0.3), sway: sw });
    } else for (let k = 0; k < np; k++) {
      const pa = k * TAU / np, g = sheet(1, 2, (u, v, out) => { const w = pr * 0.42 * Math.sin(PI * (v * 0.8 + 0.1)); out[0] = pr * (0.2 + v * 0.85); out[1] = pr * (0.12 + 0.25 * v - 0.3 * v * v); out[2] = (u - 0.5) * w; }, true);
      b.add(g, { pre: m, r: [0, pa, 0], c: tone(fcol, rng.range(-0.03, 0.03)), surf: surf(0, 0.3), sway: sw });
    }
    top = Math.max(top, ty + pr);
  }
  return fin(b, o, { size: [h * 1.4, top, h * 1.4], top });
}

// --- tableware ---
function teapotInto(b, m, h, c, seg = 4) {
  const g = new TeapotGeometry(1, seg, true, true, true, true, true); g.computeBoundingBox(); const bb = g.boundingBox, k = h / (bb.max.y - bb.min.y);
  g.translate(0, -bb.min.y, 0); g.scale(k, k, k);
  for (const a of Object.keys(g.attributes)) if (a !== 'position' && a !== 'normal') g.deleteAttribute(a);
  b.add(g, { pre: m, c, surf: S_CER }); return k;
}
function cupInto(b, m, c, s = 1, tea = '#7a3d14') {
  b.add(lathe([[0.001, 0.004], [0.02, 0.004], [0.022, 0], [0.027, 0.002], [0.039, 0.03], [0.043, 0.062], [0.0415, 0.063], [0.037, 0.03], [0.026, 0.008], [0.001, 0.007]], 10), { pre: m, s, p: [0, 0.012 * s, 0], c, surf: S_CER });
  if (tea) b.add(new THREE.CircleGeometry(0.039, 12), { pre: m, s, p: [0, 0.062 * s, 0], r: [-PI / 2, 0, 0], c: tea, surf: surf(0, 0.95) });
  b.add(new THREE.TorusGeometry(0.016, 0.0035, 5, 8, PI), { pre: m, s, p: [0.04 * s, 0.047 * s, 0], r: [0, 0, -PI / 2], c, surf: S_CER });
  b.add(lathe([[0.001, 0], [0.034, 0], [0.068, 0.011], [0.07, 0.013], [0.068, 0.015], [0.034, 0.006], [0.001, 0.006]], 12), { pre: m, s, c, surf: S_CER });
}
function plateInto(b, m, r, c, band) {
  b.add(lathe([[0.001, 0], [r * 0.5, 0], [r * 0.6, 0.004], [r, 0.02], [r * 1.01, 0.023], [r, 0.026], [r * 0.6, 0.009], [r * 0.5, 0.006], [0.001, 0.006]], 20), { pre: m, c, surf: S_CER });
  if (band) b.add(lathe([[r * 0.97, 0.0262], [r * 0.86, 0.0214]], 20), { pre: m, c: band, surf: S_CER });
}
const at = (x, y, z, ry = 0) => new M4().makeTranslation(x, y, z).multiply(new M4().makeRotationY(ry));
// Teapot (the Utah one, of course). o: { height, color }
export function teapotGeometry(o = {}) { const b = makeBuilder(), h = o.height ?? 0.16; teapotInto(b, null, h, o.color ?? '#e9e4d8'); return fin(b, o, { size: [h * 2, h, h * 1.3], top: h }); }
// Cup and saucer. o: { color, tea }
export function cupGeometry(o = {}) { const b = makeBuilder(); cupInto(b, null, o.color ?? '#e9e4d8', 1, o.tea); return fin(b, o, { size: [0.14, 0.075, 0.14], top: 0.075 }); }
// Plate. o: { radius, color, band }
export function plateGeometry(o = {}) { const b = makeBuilder(), r = o.radius ?? 0.13; plateInto(b, null, r, o.color ?? '#e9e4d8', o.band ?? '#2c5a8a'); return fin(b, o, { size: [r * 2, 0.026, r * 2], top: 0.01 }); }
// Bowl of fruit. o: { color, rng }
export function fruitBowlGeometry(o = {}) {
  const rng = prng(o), b = makeBuilder(), c = o.color ?? '#e9e4d8', R = 0.17;
  b.add(lathe([[0.001, 0], [0.06, 0], [0.065, 0.012], [0.05, 0.02], [0.1, 0.045], [R, 0.1], [R + 0.004, 0.104], [R - 0.004, 0.106], [0.095, 0.055], [0.001, 0.035]], 20), { c, surf: S_CER });
  b.add(lathe([[R - 0.004, 0.097], [R + 0.002, 0.102]], 20), { c: '#2c5a8a', surf: S_CER });
  const fruits = [['#b8201c', 0.04, 0.9], ['#e87a12', 0.042, 1], ['#8aa82c', 0.039, 0.92], ['#c8301c', 0.04, 0.9], ['#e8961a', 0.041, 1], ['#d8b82a', 0.036, 1.25]];
  for (let i = 0; i < 6; i++) {
    const f = fruits[i], a = i * TAU / 5 + rng.range(-0.2, 0.2), rr = i === 5 ? 0 : 0.085, y = (i === 5 ? 0.125 : 0.085) + rng.range(0, 0.008), x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    b.add(sph(f[1], 12, 9), { p: [x, y, z], s: [1, f[2], 1], r: [rng.range(-0.3, 0.3), 0, rng.range(-0.3, 0.3)], c: f[0], surf: surf(0, 0.6), grad: [y - f[1], y + f[1], 0.8, 1.12] });
    b.add(cyl(0.0018, 0.0018, 0.014, 4), { p: [x, y + f[1] * f[2], z], c: '#3a2a14', surf: S_MATTE });
  }
  b.add(tube([[-0.14, 0.11, 0.02], [-0.07, 0.155, 0.06], [0.03, 0.165, 0.08], [0.11, 0.135, 0.06]], 0.016, 8, 6), { c: '#e8c62a', surf: surf(0, 0.4) });
  b.add(tube([[-0.13, 0.115, -0.02], [-0.06, 0.16, 0.025], [0.04, 0.17, 0.045], [0.12, 0.14, 0.03]], 0.016, 8, 6), { c: '#dcb824', surf: surf(0, 0.4) });
  for (let i = 0; i < 16; i++) { const a = rng() * TAU, t = i / 16; b.add(sph(0.012, 6, 5), { p: [0.1 + Math.cos(a) * 0.025 * (1 - t * 0.6) + t * 0.07, 0.12 - t * 0.06 + rng.range(0, 0.012), -0.07 + Math.sin(a) * 0.025 - t * 0.03], c: tone('#4a1f5a', rng.range(-0.04, 0.06)), surf: surf(0, 0.75) }); }
  return fin(b, o, { size: [R * 2, 0.18, R * 2], top: 0.18 });
}
// Tea set on a tray. o: { cups, color, rng }
export function teaSetGeometry(o = {}) {
  const rng = prng(o), b = makeBuilder(), c = o.color ?? '#ece6d8', n = o.cups ?? 3, tw = 0.56, td = 0.36;
  b.add(bevelBox(tw, 0.012, td, 0.005), { p: [0, 0.006, 0], c: '#b9a068', surf: S_BRASS });
  for (const s of [-1, 1]) { b.add(bevelBox(tw, 0.02, 0.012, 0.004), { p: [0, 0.018, s * td / 2], c: '#c9a148', surf: S_BRASS }); b.add(bevelBox(0.012, 0.02, td, 0.004), { p: [s * tw / 2, 0.018, 0], c: '#c9a148', surf: S_BRASS });
    b.add(new THREE.TorusGeometry(0.04, 0.005, 5, 10, PI), { p: [s * (tw / 2 + 0.004), 0.025, 0], r: [-PI / 2 + 0.5 * 0, 0, s * -PI / 2], c: '#c9a148', surf: S_BRASS }); }
  teapotInto(b, at(-0.12, 0.012, -0.04, 0.5), 0.15, c, 3);
  for (let i = 0; i < n; i++) { const a = -0.5 + i * 0.95; cupInto(b, at(0.09 + Math.cos(a) * 0.1 * (i ? 1 : 0.3), 0.012, 0.07 - Math.sin(a) * 0.14 + (i === 0 ? 0.03 : 0), rng.range(-2, 2)), c, 0.92); }
  b.add(lathe([[0.001, 0], [0.025, 0], [0.04, 0.02], [0.04, 0.045], [0.028, 0.055], [0.008, 0.06], [0.01, 0.072], [0.001, 0.075]], 12), { p: [0.2, 0.012, -0.11], c, surf: S_CER });
  b.add(lathe([[0.001, 0], [0.022, 0], [0.03, 0.025], [0.024, 0.06], [0.03, 0.08], [0.027, 0.08], [0.02, 0.06], [0.001, 0.02]], 12), { p: [0.04, 0.012, -0.12], c, surf: S_CER });
  return fin(b, o, { size: [tw + 0.09, 0.17, td], top: 0.17 });
}

// Kitchen counter with cupboards, a cast-iron range, copper pots and a hanging rail.
// o: { width, color, topColor, rail:true, range:true, rng }
export function kitchenCounterGeometry(o = {}) {
  const rng = prng(o), b = makeBuilder(), w = o.width ?? 2.8, d = 0.62, h = 0.9, c = o.color ?? '#5f7d6c', copper = '#c0683a', cu = surf(0, 0.8, 1);
  const rw = o.range === false ? 0 : 0.95, cw = w - rw, x0 = -w / 2;
  b.add(bevelBox(cw, h - 0.14, d - 0.04, 0.008), { p: [x0 + cw / 2, 0.1 + (h - 0.14) / 2, -0.02], c, surf: surf(0, 0.35) });
  b.add(bevelBox(cw - 0.02, 0.1, d - 0.12, 0.004), { p: [x0 + cw / 2, 0.05, -0.04], c: '#1c1a18', surf: S_MATTE });
  const nd = Math.max(1, Math.round(cw / 0.55)), dw = cw / nd;
  for (let i = 0; i < nd; i++) { const x = x0 + dw * (i + 0.5), zf = d / 2 - 0.04;
    b.add(bevelBox(dw - 0.03, 0.14, 0.022, 0.008), { p: [x, h - 0.13, zf], c: tone(c, 0.02), surf: surf(0, 0.4) });
    b.add(bevelBox(dw - 0.03, h - 0.37, 0.022, 0.008), { p: [x, 0.13 + (h - 0.37) / 2, zf], c: tone(c, 0.02), surf: surf(0, 0.4) });
    b.add(bevelBox(dw - 0.15, h - 0.5, 0.012, 0.005), { p: [x, 0.13 + (h - 0.37) / 2, zf + 0.012], c: tone(c, -0.02), surf: surf(0, 0.4) });
    b.add(sph(0.016, 8, 6), { p: [x, h - 0.13, zf + 0.024], c: '#c9a148', surf: S_BRASS });
    b.add(sph(0.016, 8, 6), { p: [x + (i % 2 ? -1 : 1) * (dw / 2 - 0.06), h - 0.3, zf + 0.024], c: '#c9a148', surf: S_BRASS }); }
  b.add(bevelBox(cw + 0.03, 0.045, d + 0.03, 0.012), { p: [x0 + cw / 2 - 0.005, h - 0.0225 + 0.005, 0], c: o.topColor ?? '#a8763e', surf: surf(1, 0.5) });
  const pot = (x, z, r, ph, lid) => { const y = h + 0.006 + (x > x0 + cw ? 0.012 : 0);
    b.add(lathe([[0.001, 0], [r * 0.96, 0], [r, 0.008], [r, ph], [r * 1.05, ph + 0.004], [r * 0.97, ph + 0.004], [r * 0.95, 0.012], [0.001, 0.01]], 18), { p: [x, y, z], c: copper, surf: cu });
    for (const s of [-1, 1]) b.add(new THREE.TorusGeometry(r * 0.28, 0.006, 5, 8, PI), { p: [x + s * r, y + ph * 0.78, z], r: [PI / 2, 0, s > 0 ? -PI / 2 : PI / 2], c: '#c9a148', surf: S_BRASS });
    if (lid) { b.add(lathe([[r * 1.02, ph + 0.004], [r * 0.8, ph + 0.03], [r * 0.3, ph + 0.05], [0.001, ph + 0.053]], 18), { p: [x, y, z], c: copper, surf: cu }); b.add(sph(0.016, 8, 6), { p: [x, y + ph + 0.062, z], c: '#c9a148', surf: S_BRASS }); } };
  if (rw) { const rx = x0 + cw + rw / 2;
    b.add(bevelBox(rw, h + 0.01, d, 0.012), { p: [rx, (h + 0.01) / 2, 0], c: '#161618', surf: S_IRON });
    b.add(bevelBox(rw * 0.62, 0.42, 0.02, 0.01), { p: [rx - rw * 0.12, 0.42, d / 2 + 0.008], c: '#202024', surf: S_IRON });
    b.add(cyl(0.011, 0.011, rw * 0.5, 6), { p: [rx - rw * 0.12, 0.69, d / 2 + 0.05], r: [0, 0, PI / 2], c: '#c9a148', surf: S_BRASS });
    b.add(cyl(0.011, 0.011, rw * 0.9, 6), { p: [rx, h - 0.06, d / 2 + 0.06], r: [0, 0, PI / 2], c: '#c9a148', surf: S_BRASS });
    for (const s of [-1, 1]) { b.add(cyl(0.13, 0.13, 0.012, 16), { p: [rx + s * rw * 0.24, h + 0.012, 0.02], c: '#0c0c0e', surf: S_IRON }); b.add(cyl(0.011, 0.011, 0.07, 5), { p: [rx + s * rw * 0.43, h - 0.06, d / 2 + 0.03], r: [PI / 2, 0, 0], c: '#c9a148', surf: S_BRASS }); }
    b.add(bevelBox(rw * 0.2, 0.2, 0.02, 0.008), { p: [rx + rw * 0.33, 0.5, d / 2 + 0.008], c: '#202024', surf: S_IRON });
    b.add(bevelBox(rw * 0.16, 0.1, 0.012, 0.004), { p: [rx + rw * 0.33, 0.5, d / 2 + 0.02], c: '#ff7a24', surf: surf(0, 0.2, 0, 3) });
    pot(rx - rw * 0.24, 0.02, 0.125, 0.19, true); pot(rx + rw * 0.24, 0.02, 0.095, 0.1, false);
    b.add(bevelBox(0.2, 0.014, 0.024, 0.005), { p: [rx + rw * 0.24 + 0.17, h + 0.1, 0.12], r: [0, -0.6, 0.1], c: '#c9a148', surf: S_BRASS });
  }
  // things on the worktop
  let x = x0 + 0.16;
  for (let i = 0; i < 3 && x < x0 + cw - 0.9; i++) { const r = 0.055 - i * 0.006, jh = 0.2 - i * 0.03;
    b.add(lathe([[0.001, 0], [r, 0], [r, jh], [r * 0.8, jh + 0.02], [r * 0.8, jh + 0.035], [0.001, jh + 0.035]], 12), { p: [x, h + 0.006, -0.15], c: ['#e6dfd0', '#2f4f5e', '#e6dfd0'][i], surf: S_CER });
    b.add(cyl(r * 0.78, r * 0.72, 0.03, 10), { p: [x, h + jh + 0.05, -0.15], c: '#b08a5a', surf: S_MATTE }); x += r * 2 + 0.04; }
  const bx = x0 + cw * 0.5;
  b.add(bevelBox(0.42, 0.022, 0.28, 0.008), { p: [bx, h + 0.017, 0.06], r: [0, 0.15, 0], c: '#b98a52', surf: S_WOODM });
  b.add(cushion(0.26, 0.11, 0.13, 0.75, 7), { p: [bx - 0.02, h + 0.075, 0.05], r: [0, 0.3, 0], c: '#b0763a', surf: surf(0, 0.12), grad: [h + 0.03, h + 0.13, 0.75, 1.1] });
  const ux = x0 + cw - 0.2;
  b.add(lathe([[0.001, 0], [0.06, 0], [0.066, 0.01], [0.062, 0.16], [0.056, 0.16], [0.056, 0.02], [0.001, 0.015]], 12), { p: [ux, h + 0.006, -0.14], c: '#e6dfd0', surf: S_CER });
  for (let i = 0; i < 4; i++) { const a = i * 1.7; b.add(cyl(0.006, 0.006, 0.3, 5), { p: [ux + Math.cos(a) * 0.03, h + 0.2, -0.14 + Math.sin(a) * 0.03], r: [Math.sin(a) * 0.14, 0, -Math.cos(a) * 0.14], c: '#a8763e', surf: S_WOODM });
    b.add(sph(0.022, 7, 5), { p: [ux + Math.cos(a) * 0.052, h + 0.35, -0.14 + Math.sin(a) * 0.052], s: [1, 1.5, 0.5], r: [0, -a, 0], c: '#a8763e', surf: S_WOODM }); }
  let top = h + 0.3;
  if (o.rail !== false) { const ry = 1.72, rz = -d / 2 + 0.07;
    b.add(cyl(0.011, 0.011, w - 0.2, 6), { p: [0, ry, rz], r: [0, 0, PI / 2], c: '#c9a148', surf: S_BRASS });
    for (const s of [-1, 1]) b.add(tube([[s * (w / 2 - 0.12), ry, rz], [s * (w / 2 - 0.12), ry + 0.02, rz - 0.04], [s * (w / 2 - 0.12), ry, rz - 0.07]], 0.009, 4, 5), { c: '#c9a148', surf: S_BRASS });
    const np = Math.max(3, Math.floor((w - 0.5) / 0.36));
    for (let i = 0; i < np; i++) { const px = -w / 2 + 0.3 + i * ((w - 0.6) / (np - 1)), r = rng.range(0.09, 0.14), hl = rng.range(0.16, 0.24), sw = [ry - hl - r * 2, ry, 0.5, 0], m = at(px, ry, rz + 0.012, rng.range(-0.15, 0.15));
      b.add(new THREE.TorusGeometry(0.014, 0.003, 4, 8, PI * 1.4), { pre: m, p: [0, -0.012, 0], r: [0, PI / 2, 0], c: '#c9a148', surf: S_BRASS });
      b.add(bevelBox(0.018, hl, 0.006, 0.002), { pre: m, p: [0, -0.03 - hl / 2, 0], c: i % 3 === 2 ? '#18181a' : '#c9a148', surf: i % 3 === 2 ? S_IRON : S_BRASS, sway: sw });
      const pan = lathe([[0.001, 0], [r * 0.9, 0], [r, 0.035 + (i % 2) * 0.04], [r * 1.03, 0.038 + (i % 2) * 0.04], [r * 0.96, 0.036 + (i % 2) * 0.04], [r * 0.87, 0.006], [0.001, 0.005]], 16);
      b.add(pan, { pre: m, p: [0, -0.03 - hl - r, -0.004], r: [PI / 2, 0, 0], c: i % 3 === 2 ? '#141416' : copper, surf: i % 3 === 2 ? S_IRON : cu, sway: sw }); }
    top = ry + 0.03;
  }
  return fin(b, o, { size: [w, top, d + 0.1], top: h });
}

const extrudeUp = (shape, depth, bevel = 0.006, cs = 10) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: cs }); g.deleteAttribute('uv'); g.rotateX(-PI / 2); return g; };
const rod = (b, p0, p1, r, c, sf, seg = 6, extra = {}) => { const d = new V3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]), l = d.length(); const m = new M4().compose(new V3((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2), new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d.normalize()), new V3(1, 1, 1)); b.add(cyl(r, r, l, seg), { m, c, surf: sf, ...extra }); };

// Grand piano with a propped lid and a bench. o: { color, bench:true }. Keyboard faces +z.
export function pianoGeometry(o = {}) {
  const b = makeBuilder(), c = o.color ?? '#0b0b0d', lac = surf(0, 0.93), y0 = 0.62, ch = 0.3;
  const outline = (k) => { const s = new THREE.Shape(); s.moveTo(-0.75 * k, -0.3); s.lineTo(-0.75 * k, 1.3 * k); s.bezierCurveTo(-0.75 * k, 1.64 * k, -0.2 * k, 1.74 * k, 0.05 * k, 1.5 * k); s.bezierCurveTo(0.3 * k, 1.28 * k, 0.3 * k, 0.85 * k, 0.55 * k, 0.62 * k); s.bezierCurveTo(0.7 * k, 0.5 * k, 0.75 * k, 0.4 * k, 0.75 * k, 0.2 * k); s.lineTo(0.75 * k, -0.3); s.lineTo(-0.75 * k, -0.3); return s; };
  b.add(extrudeUp(outline(1), ch, 0.008, 12), { p: [0, y0, 0], c, surf: lac });
  b.add(extrudeUp(outline(0.94), 0.01, 0, 12), { p: [0, y0 + ch + 0.002, -0.02], c: '#b38a36', surf: surf(0, 0.6, 1) });
  for (let i = 0; i < 5; i++) rod(b, [-0.55 + i * 0.22, y0 + ch + 0.02, 0.2], [-0.5 + i * 0.12, y0 + ch + 0.02, -1.25 + Math.abs(i - 1) * 0.22], 0.012, '#8a6a2a', S_BRASS, 5);
  const th = 0.48, lid = new M4().makeTranslation(-0.75, y0 + ch + 0.02, 0).multiply(new M4().makeRotationZ(th)).multiply(new M4().makeTranslation(0.75, 0, 0));
  b.add(extrudeUp(outline(1.01), 0.022, 0.005, 12), { m: lid.clone().multiply(new M4().makeTranslation(0, 0, 0)), c, surf: lac });
  const sx = 0.5, lp = new V3(sx, 0, -0.25).applyMatrix4(lid);
  rod(b, [0.62, y0 + ch, -0.25], [lp.x, lp.y, lp.z], 0.01, c, lac, 6);
  // keyboard
  b.add(bevelBox(1.5, 0.07, 0.26, 0.01), { p: [0, y0 + 0.035, 0.42], c, surf: lac });
  for (const s of [-1, 1]) b.add(bevelBox(0.1, 0.12, 0.26, 0.012), { p: [s * 0.7, y0 + 0.11, 0.42], c, surf: lac });
  b.add(bevelBox(1.3, 0.13, 0.025, 0.006), { p: [0, y0 + 0.16, 0.3], c, surf: lac });
  b.add(bevelBox(0.5, 0.008, 0.03, 0.002), { p: [0, y0 + 0.17, 0.314], c: '#d8b25a', surf: S_BRASS });
  const kw = 1.3 / 52;
  for (let i = 0; i < 52; i++) b.add(new THREE.BoxGeometry(kw * 0.9, 0.02, 0.15), { p: [-0.65 + kw * (i + 0.5), y0 + 0.08, 0.4], c: '#ede8da', surf: S_GLOSS });
  for (let i = 0; i < 51; i++) { const k = (i + 5) % 7; if (k === 2 || k === 6) continue; b.add(new THREE.BoxGeometry(kw * 0.55, 0.014, 0.095), { p: [-0.65 + kw * (i + 1), y0 + 0.097, 0.372], c: '#0a0a0c', surf: S_GLOSS }); }
  b.add(bevelBox(0.72, 0.26, 0.012, 0.004), { p: [0, y0 + ch + 0.17, 0.2], r: [-0.3, 0, 0], c, surf: lac });
  b.add(bevelBox(0.44, 0.3, 0.004, 0.001), { p: [0.02, y0 + ch + 0.19, 0.21], r: [-0.3, 0, 0.03], c: '#efe9d8', surf: S_MATTE });
  for (const [x, z] of [[-0.62, 0.32], [0.62, 0.32], [-0.2, -1.4]]) {
    b.add(lathe([[0.03, 0.05], [0.035, 0.08], [0.05, 0.12], [0.058, y0 - 0.12], [0.075, y0 - 0.08], [0.075, y0]], 10), { p: [x, 0, z], c, surf: lac });
    b.add(sph(0.028, 8, 6), { p: [x, 0.028, z], c: '#c9a148', surf: S_BRASS });
  }
  b.add(bevelBox(0.26, 0.05, 0.1, 0.01), { p: [0, 0.2, 0.22], c, surf: lac });
  for (const s of [-1, 1]) rod(b, [s * 0.1, 0.22, 0.22], [s * 0.1, y0, 0.25], 0.014, c, lac, 6);
  for (let i = -1; i <= 1; i++) b.add(bevelBox(0.035, 0.012, 0.11, 0.004), { p: [i * 0.075, 0.19, 0.31], r: [0.12, 0, 0], c: '#c9a148', surf: S_BRASS });
  if (o.bench !== false) {
    b.add(cushion(0.78, 0.08, 0.36, 0.35, 6), { p: [0, 0.5, 1.0], c: '#1a1416', surf: surf(0, 0.5) });
    b.add(bevelBox(0.74, 0.05, 0.33, 0.01), { p: [0, 0.445, 1.0], c, surf: lac });
    for (const sx2 of [-1, 1]) for (const sz of [-1, 1]) b.add(lathe([[0.016, 0], [0.02, 0.03], [0.028, 0.42]], 8), { p: [sx2 * 0.33, 0, 1.0 + sz * 0.13], c, surf: lac });
  }
  return fin(b, o, { size: [1.52, 1.75, 2.9], top: y0 + ch });
}

const TOY_COLORS = ['#c8302a', '#2a5aa8', '#e8b82a', '#3a8a4a', '#d8b07a', '#e87a2a', '#7a4aa8'];
// A heap and a tower of wooden toy blocks. o: { count, size, rng }
export function toyBlocksGeometry(o = {}) {
  const rng = prng(o), b = makeBuilder(), s = o.size ?? 0.05, n = o.count ?? 22, sf = surf(0, 0.55);
  const blk = (x, y, z, ry, kind, c) => {
    if (kind === 1) b.add(cyl(s / 2, s / 2, s, 12), { p: [x, y + s / 2, z], r: [0, ry, 0], c, surf: sf });
    else if (kind === 2) { const g = new THREE.CylinderGeometry(s * 0.62, s * 0.62, s, 3); g.rotateX(PI / 2); g.rotateZ(PI / 2 * 0 + PI / 6 * 0); b.add(g, { p: [x, y + s * 0.31, z], r: [0, ry, PI / 2 * 0], c, surf: sf }); }
    else if (kind === 3) b.add(bevelBox(s * 2, s, s, s * 0.08), { p: [x, y + s / 2, z], r: [0, ry, 0], c, surf: sf });
    else b.add(bevelBox(s, s, s, s * 0.08), { p: [x, y + s / 2, z], r: [0, ry, 0], c, surf: sf });
  };
  // tower with a roof
  for (let i = 0; i < 4; i++) blk(-s * 1.4, i * s, 0, rng.range(-0.15, 0.15), i === 2 ? 1 : 0, rng.pick(TOY_COLORS));
  blk(-s * 1.4, 4 * s, 0, 0.1, 2, TOY_COLORS[0]);
  // gate
  blk(s * 0.9, 0, -s, 0, 0, TOY_COLORS[1]); blk(s * 2.9, 0, -s, 0, 0, TOY_COLORS[2]); blk(s * 1.9, s, -s, 0, 3, TOY_COLORS[3]); blk(s * 1.9, 2 * s, -s, 0.05, 2, TOY_COLORS[5]);
  for (let i = 0; i < n - 9; i++) { const a = rng() * TAU, r = s * rng.range(2.5, 6.5); blk(Math.cos(a) * r, 0, Math.sin(a) * r * 0.8 + s, rng() * TAU, rng.pick([0, 0, 0, 1, 3]), rng.pick(TOY_COLORS)); }
  return fin(b, o, { size: [s * 13, s * 5, s * 11], top: s * 5 });
}
// Wooden toy train: engine and wagons along +x. o: { wagons, rng }
export function toyTrainGeometry(o = {}) {
  const rng = prng(o), b = makeBuilder(), nw = o.wagons ?? 3, sf = surf(0, 0.6), wr = 0.028;
  const wheels = (x0, x1, n, r = wr) => { for (let i = 0; i < n; i++) for (const s of [-1, 1]) { const x = n > 1 ? lerp(x0, x1, i / (n - 1)) : (x0 + x1) / 2;
    b.add(cyl(r, r, 0.014, 10), { p: [x, r, s * 0.047], r: [PI / 2, 0, 0], c: '#1c1a18', surf: sf }); b.add(cyl(r * 0.45, r * 0.45, 0.018, 6), { p: [x, r, s * 0.049], r: [PI / 2, 0, 0], c: '#e8b82a', surf: sf }); } };
  const L = 0.22; let x = (nw * 0.17 + L) / 2 - L / 2;
  b.add(bevelBox(L, 0.02, 0.08, 0.005), { p: [x, 0.045, 0], c: '#1c1a18', surf: sf });
  b.add(cyl(0.036, 0.036, 0.13, 14), { p: [x + 0.035, 0.09, 0], r: [0, 0, PI / 2], c: '#c8302a', surf: sf });
  b.add(cyl(0.038, 0.038, 0.012, 14), { p: [x + 0.104, 0.09, 0], r: [0, 0, PI / 2], c: '#e8b82a', surf: sf });
  b.add(bevelBox(0.07, 0.1, 0.08, 0.006), { p: [x - 0.07, 0.105, 0], c: '#2a5aa8', surf: sf });
  b.add(bevelBox(0.09, 0.012, 0.094, 0.004), { p: [x - 0.07, 0.161, 0], c: '#1c1a18', surf: sf });
  b.add(lathe([[0.011, 0], [0.011, 0.04], [0.02, 0.06], [0.02, 0.066], [0.001, 0.066]], 10), { p: [x + 0.075, 0.122, 0], c: '#1c1a18', surf: sf });
  b.add(sph(0.016, 10, 6), { p: [x + 0.025, 0.124, 0], c: '#e8b82a', surf: S_BRASS });
  { const g = new THREE.CylinderGeometry(0.04, 0.04, 0.075, 3); g.rotateX(PI / 2); b.add(g, { p: [x + 0.125, 0.035, 0], s: [0.6, 0.7, 1], c: '#e8b82a', surf: sf }); }
  wheels(x - 0.075, x + 0.075, 3);
  for (let i = 0; i < nw; i++) { const cx = x - L / 2 - 0.02 - 0.075 - i * 0.17, wc = TOY_COLORS[(i * 3 + 3) % TOY_COLORS.length];
    b.add(bevelBox(0.15, 0.018, 0.08, 0.004), { p: [cx, 0.045, 0], c: '#1c1a18', surf: sf });
    rod(b, [cx + 0.075, 0.045, 0], [cx + 0.095, 0.045, 0], 0.005, '#c9a148', S_BRASS, 5);
    if (i === nw - 1) { b.add(bevelBox(0.13, 0.085, 0.078, 0.006), { p: [cx, 0.097, 0], c: wc, surf: sf }); b.add(cyl(0.045, 0.045, 0.145, 12, false), { p: [cx, 0.128, 0], r: [0, 0, PI / 2], s: [1, 1, 0.92], c: TOY_COLORS[0], surf: sf }); }
    else { for (const s of [-1, 1]) { b.add(bevelBox(0.15, 0.05, 0.008, 0.002), { p: [cx, 0.079, s * 0.036], c: wc, surf: sf }); b.add(bevelBox(0.008, 0.05, 0.08, 0.002), { p: [cx + s * 0.071, 0.079, 0], c: wc, surf: sf }); }
      if (i % 2 === 0) for (let k = 0; k < 3; k++) b.add(cyl(0.016, 0.016, 0.13, 8), { p: [cx, 0.072 + (k === 2 ? 0.027 : 0), (k === 2 ? 0 : (k - 0.5) * 0.034)], r: [0, 0, PI / 2], c: '#a8763e', surf: S_WOODM });
      else for (let k = 0; k < 4; k++) b.add(bevelBox(0.03, 0.03, 0.03, 0.003), { p: [cx - 0.045 + k * 0.03, 0.07 + (k % 2) * 0.02, rng.range(-0.012, 0.012)], r: [0, rng() * 2, 0], c: rng.pick(TOY_COLORS), surf: sf }); }
    wheels(cx - 0.045, cx + 0.045, 2); }
  const len = L + nw * 0.17 + 0.06;
  return fin(b, o, { size: [len, 0.19, 0.11], top: 0.19 });
}
// Rocking horse, head towards +x. o: { color, saddleColor }
export function rockingHorseGeometry(o = {}) {
  const b = makeBuilder(), c = o.color ?? '#d9d2c2', dk = '#3a2a1e', sc = o.saddleColor ?? '#b8302a', sf = surf(0, 0.55), R = 1.25;
  for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 8; i++) { const a = lerp(-0.56, 0.56, i / 8); pts.push([Math.sin(a) * R, R - Math.cos(a) * R + 0.025, s * 0.17]); }
    b.add(tube(pts, 0.024, 16, 6), { s: [1, 1.6, 1], p: [0, -0.015, 0], c: '#8a2a22', surf: sf }); }
  for (const x of [-0.42, 0.42]) b.add(bevelBox(0.07, 0.022, 0.4, 0.006), { p: [x, 0.13, 0], c: '#8a2a22', surf: sf });
  b.add(sph(0.5, 16, 12), { p: [0, 0.62, 0], s: [0.62, 0.3, 0.27], c, surf: sf, grad: [0.45, 0.8, 0.86, 1.05] });
  b.add(sph(0.5, 12, 8), { p: [0.24, 0.78, 0], s: [0.2, 0.36, 0.17], r: [0, 0, -0.55], c, surf: sf });
  b.add(sph(0.5, 12, 8), { p: [0.41, 0.94, 0], s: [0.3, 0.14, 0.13], r: [0, 0, -0.7], c, surf: sf });
  for (const s of [-1, 1]) { b.add(new THREE.ConeGeometry(0.022, 0.07, 6), { p: [0.34, 1.045, s * 0.035], r: [0, 0, 0.2], c, surf: sf }); b.add(sph(0.011, 6, 5), { p: [0.44, 0.955, s * 0.052], c: '#0a0808', surf: S_GLOSS }); }
  for (let i = 0; i < 7; i++) b.add(cushion(0.07, 0.1, 0.03, 0.7, 4), { p: [0.3 - i * 0.03, 1.0 - i * 0.05, 0], r: [0, 0, 0.9], c: dk, surf: S_FAB });
  b.add(tube([[-0.29, 0.68, 0], [-0.4, 0.7, 0], [-0.47, 0.56, 0], [-0.46, 0.4, 0]], 0.028, 8, 6), { c: dk, surf: S_FAB });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod(b, [sx * 0.2, 0.56, sz * 0.08], [sx * 0.42, 0.15, sz * 0.17], 0.03, c, sf, 8);
  b.add(cushion(0.26, 0.07, 0.3, 0.6, 6), { p: [-0.02, 0.775, 0], c: sc, surf: S_FAB });
  b.add(new THREE.TorusGeometry(0.135, 0.008, 5, 16), { p: [0.36, 0.9, 0], r: [0, PI / 2, -0.7], s: [1, 0.55, 1], c: sc, surf: sf });
  return fin(b, o, { size: [1.4, 1.08, 0.42], top: 1.08 });
}

// Staircase rising towards -z from its foot at the origin. o: { kind:'straight'|'spiral', height, width, steps, turns, color, carpet }
// userData.topPoint = where the top step arrives.
export function staircaseGeometry(o = {}) {
  const b = makeBuilder(), H = o.height ?? 3, w = o.width ?? 1.1, c = o.color ?? WOOD.walnut, n = o.steps ?? Math.round(H / 0.18), rise = H / n, carpet = o.carpet === undefined ? '#7a1f2a' : o.carpet;
  if (o.kind === 'spiral') {
    const turns = o.turns ?? 1.2, r0 = 0.09, r1 = w, da = turns * TAU / n, pts = [];
    b.add(cyl(r0, r0, H + 1.0, 12), { p: [0, (H + 1.0) / 2, 0], c: '#1a1a1c', surf: S_IRON }); b.add(sph(r0 * 1.5, 10, 8), { p: [0, H + 1.02, 0], c: '#c9a148', surf: S_BRASS });
    const sh = new THREE.Shape(); sh.moveTo(r0 * 0.8, -0.02); sh.lineTo(r1 * Math.cos(-da * 0.62), r1 * Math.sin(-da * 0.62)); sh.absarc(0, 0, r1, -da * 0.62, da * 0.62, false); sh.lineTo(r0 * 0.8, 0.02); sh.lineTo(r0 * 0.8, -0.02);
    for (let i = 0; i < n; i++) { const a = i * da, y = (i + 1) * rise;
      b.add(extrudeUp(sh, 0.035, 0.004, 4), { p: [0, y - 0.035, 0], r: [0, a, 0], c, surf: S_WOOD });
      const bx = Math.cos(a) * (r1 - 0.04), bz = -Math.sin(a) * (r1 - 0.04);
      rod(b, [bx, y, bz], [bx, y + 0.92, bz], 0.011, '#1a1a1c', S_IRON, 5); pts.push([bx, y + 0.92, bz]);
      rod(b, [Math.cos(a) * r0, y - 0.05, -Math.sin(a) * r0], [Math.cos(a) * (r1 - 0.05), y - 0.05, -Math.sin(a) * (r1 - 0.05)], 0.014, '#1a1a1c', S_IRON, 5); }
    b.add(tube(pts, 0.025, n * 3, 6), { c: '#c9a148', surf: S_BRASS });
    const at2 = pts[n - 1]; return fin(b, o, { size: [w * 2, H + 1.1, w * 2], top: H, topPoint: [at2[0], H, at2[2]] });
  }
  const going = o.going ?? 0.27, run = going * n, pitch = Math.atan2(H, run), sl = Math.hypot(H, run);
  for (let i = 0; i < n; i++) { const y = (i + 1) * rise, z = -(i + 0.5) * going;
    b.add(bevelBox(w, 0.04, going + 0.035, 0.008), { p: [0, y - 0.02, z + 0.012], c, surf: surf(1, 0.5) });
    b.add(new THREE.BoxGeometry(w - 0.02, rise - 0.04, 0.02), { p: [0, y - 0.04 - (rise - 0.04) / 2, z - going / 2 + 0.01], c: tone(c, -0.03), surf: S_WOOD });
    if (carpet) { b.add(new THREE.BoxGeometry(w * 0.6, 0.012, going + 0.04), { p: [0, y + 0.006, z + 0.014], c: carpet, surf: S_FAB }); b.add(new THREE.BoxGeometry(w * 0.6, rise, 0.012), { p: [0, y - rise / 2, z + going / 2 + 0.036], c: tone(carpet, -0.03), surf: S_FAB });
      rod(b, [-w * 0.33, y - rise + 0.012, z + going / 2 + 0.03], [w * 0.33, y - rise + 0.012, z + going / 2 + 0.03], 0.006, '#c9a148', S_BRASS, 5); }
    for (const s of [-1, 1]) b.add(turnedLeg(0.86 + rise * 0.5, 0.02, 6), { p: [s * (w / 2 - 0.05), y, z], c: tone(c, 0.02), surf: S_WOOD });
  }
  for (const s of [-1, 1]) {
    b.add(bevelBox(0.045, 0.3, sl + 0.1, 0.008), { p: [s * (w / 2 + 0.01), H / 2 - 0.02, -run / 2], r: [pitch, 0, 0], c: tone(c, -0.02), surf: S_WOOD });
    b.add(bevelBox(0.07, 0.055, sl + 0.25, 0.02), { p: [s * (w / 2 - 0.05), H / 2 + 0.93 + rise * 0.5, -run / 2], r: [pitch, 0, 0], c, surf: surf(1, 0.6) });
    for (const [z, y] of [[0.1, 0], [-run - 0.08, H]]) { b.add(bevelBox(0.11, 1.12, 0.11, 0.012), { p: [s * (w / 2 - 0.05), y + 0.56, z], c, surf: S_WOOD }); b.add(sph(0.07, 10, 8), { p: [s * (w / 2 - 0.05), y + 1.18, z], c, surf: surf(1, 0.6) }); }
  }
  // solid spandrel under the flight
  b.add(new THREE.BoxGeometry(w - 0.06, 0.05, sl), { p: [0, H / 2 - 0.2, -run / 2 - 0.02], r: [pitch, 0, 0], c: tone(c, -0.05), surf: S_WOODM });
  return fin(b, o, { size: [w + 0.1, H + 1.25, run + 0.3], top: H, topPoint: [0, H, -run] });
}

// Chandelier hanging from its origin (the ceiling rose). o: { arms, tiers, radius, drop, crystals:true, glow }
// userData.flames (candle tips), userData.light (centre of the glow).
export function chandelierGeometry(o = {}) {
  const b = makeBuilder(), arms = o.arms ?? 8, tiers = o.tiers ?? 2, R = o.radius ?? 0.6, drop = o.drop ?? 1.0, brass = '#c9a148', flames = [], glow = o.glow ?? 1;
  const bh = 0.5 + tiers * 0.22, yB = -drop - bh, sw = [yB - 0.2, 0, 0.3, 0], cry = surf(0, 0.97, 0, 0.3 * glow), ex = { sway: sw };
  b.add(lathe([[0.001, -0.05], [0.05, -0.045], [0.09, -0.012], [0.1, 0]], 14), { c: brass, surf: S_BRASS });
  b.add(cyl(0.007, 0.007, drop, 5), { p: [0, -drop / 2, 0], c: brass, surf: S_BRASS, ...ex });
  for (let i = 1; i < drop / 0.18; i++) b.add(new THREE.TorusGeometry(0.028, 0.006, 3, 6), { p: [0, -i * 0.18, 0], r: [0, i % 2 ? PI / 2 : 0, 0], s: [1, 1.5, 1], c: brass, surf: S_BRASS, ...ex });
  b.add(lathe([[0.001, yB - 0.13], [0.03, yB - 0.11], [0.045, yB - 0.07], [0.02, yB - 0.03], [0.05, yB], [0.11, yB + 0.06], [0.12, yB + 0.1], [0.05, yB + 0.16], [0.035, yB + bh * 0.5], [0.07, yB + bh * 0.62], [0.035, yB + bh * 0.75], [0.03, yB + bh - 0.06], [0.07, yB + bh - 0.02], [0.02, yB + bh]], 14), { c: brass, surf: S_BRASS, ...ex });
  if (o.crystals !== false) b.add(new THREE.OctahedronGeometry(0.05), { p: [0, yB - 0.19, 0], s: [1, 1.5, 1], c: '#eef6ff', surf: cry, ...ex });
  for (let t = 0; t < tiers; t++) {
    const n = Math.max(3, Math.round(arms * (1 - t * 0.4))), r = R * (1 - t * 0.36), y = yB + 0.08 + t * 0.3, off = t * PI / n;
    for (let i = 0; i < n; i++) { const a = off + i * TAU / n, cx = Math.cos(a), cz = Math.sin(a), yc = y + 0.12;
      b.add(tube([[cx * 0.06, y, cz * 0.06], [cx * r * 0.35, y - 0.1, cz * r * 0.35], [cx * r * 0.75, y - 0.09, cz * r * 0.75], [cx * r, y + 0.02, cz * r], [cx * r, yc, cz * r]], 0.011, 10, 5), { c: brass, surf: S_BRASS, ...ex });
      b.add(lathe([[0.012, yc - 0.01], [0.05, yc + 0.012], [0.052, yc + 0.018], [0.02, yc + 0.014], [0.017, yc + 0.035], [0.001, yc + 0.035]], 8), { p: [cx * r, 0, cz * r], c: brass, surf: S_BRASS, ...ex });
      b.add(cyl(0.012, 0.013, 0.11, 6), { p: [cx * r, yc + 0.09, cz * r], c: '#f0e6cc', surf: surf(0, 0.5, 0, 0.35 * glow), grad: [yc + 0.03, yc + 0.15, 0.8, 1.4], ...ex });
      flames.push([cx * r, yc + 0.152, cz * r, 0.055]);
      if (o.crystals !== false) { b.add(new THREE.OctahedronGeometry(0.022), { p: [cx * r, yc - 0.06, cz * r], s: [1, 1.7, 1], c: '#eef6ff', surf: cry, ...ex });
        const nx = Math.cos(a + TAU / n), nz = Math.sin(a + TAU / n);
        for (let k = 1; k < 6; k++) { const f = k / 6, sag = 0.1 * Math.sin(f * PI); b.add(new THREE.OctahedronGeometry(0.013), { p: [lerp(cx, nx, f) * r * (1 - 0.06 * Math.sin(f * PI)), yc - 0.01 - sag, lerp(cz, nz, f) * r * (1 - 0.06 * Math.sin(f * PI))], c: '#eef6ff', surf: cry, ...ex }); }
        for (let k = 1; k < 6; k++) { const f = k / 6, rr = lerp(0.07, r, f), yy = lerp(yB + bh - 0.03, yc, f) - 0.12 * Math.sin(f * PI) * (t === 0 ? 1 : 0.6); if (t === 0 || k < 5) b.add(new THREE.OctahedronGeometry(0.012), { p: [cx * rr, yy, cz * rr], c: '#eef6ff', surf: cry, ...ex }); } }
    }
  }
  return fin(b, o, { size: [R * 2 + 0.1, drop + bh + 0.25, R * 2 + 0.1], flames, light: [0, yB + 0.3, 0], top: 0 });
}

// Pipe organ: oak case, console with two manuals, towers and flats of tin pipes. o: { width, height, color, pipeColor, rng }
export function organGeometry(o = {}) {
  const rng = prng(o), b = makeBuilder(), W = o.width ?? 3.4, H = o.height ?? 5.2, D = 1.15, c = o.color ?? '#3b2415', pc = o.pipeColor ?? '#cdc6b2', tin = surf(0, 0.82, 1), bh = 1.55, gold = '#c9a148';
  b.add(bevelBox(W, bh, D, 0.02), { p: [0, bh / 2, 0], c, surf: S_WOOD, grad: [0, 0.5, 0.75, 1] });
  b.add(bevelBox(W + 0.12, 0.14, D + 0.1, 0.02), { p: [0, 0.07, 0.02], c: tone(c, -0.03), surf: S_WOOD });
  b.add(bevelBox(W + 0.24, 0.16, D + 0.2, 0.03), { p: [0, bh + 0.08, 0.04], c: tone(c, 0.02), surf: S_WOOD });
  b.add(new THREE.BoxGeometry(W - 0.1, H - bh - 0.5, 0.1), { p: [0, bh + (H - bh - 0.5) / 2, -D / 2 + 0.25], c: '#0e0906', surf: S_MATTE });
  for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const x = s * (0.62 + i * (W / 2 - 0.75) + (W / 2 - 0.75) / 2 - 0.1), pw = (W / 2 - 0.75) - 0.1;
    b.add(bevelBox(pw, bh - 0.5, 0.02, 0.01), { p: [x, bh / 2 + 0.05, D / 2 + 0.004], c: tone(c, 0.025), surf: S_WOOD }); b.add(bevelBox(pw - 0.14, bh - 0.66, 0.02, 0.01), { p: [x, bh / 2 + 0.05, D / 2 + 0.012], c: tone(c, -0.02), surf: S_WOOD }); }
  // console
  b.add(flipped(new THREE.BoxGeometry(1.1, 0.75, 0.3)), { p: [0, 1.05, D / 2 - 0.148], c: tone(c, -0.06), surf: S_WOODM });
  for (let m = 0; m < 2; m++) { const y = 0.78 + m * 0.07, z = D / 2 + 0.1 - m * 0.11;
    b.add(bevelBox(0.9, 0.03, 0.16, 0.004), { p: [0, y - 0.02, z], c, surf: S_WOOD });
    b.add(new THREE.BoxGeometry(0.84, 0.014, 0.12), { p: [0, y + 0.002, z + 0.012], c: '#ede8da', surf: S_GLOSS });
    for (let i = 0; i < 35; i++) { const k = i % 7; if (k === 2 || k === 6) continue; b.add(new THREE.BoxGeometry(0.012, 0.012, 0.07), { p: [-0.42 + 0.024 * (i + 1), y + 0.012, z - 0.012], c: '#0a0a0c', surf: S_GLOSS }); } }
  for (const s of [-1, 1]) for (let i = 0; i < 2; i++) for (let j = 0; j < 5; j++) b.add(sph(0.016, 8, 6), { p: [s * (0.62 + i * 0.07), 0.82 + j * 0.085, D / 2 + 0.012], s: [1, 1, 0.6], c: '#ede8da', surf: S_GLOSS });
  b.add(bevelBox(0.6, 0.3, 0.012, 0.004), { p: [0, 1.13, D / 2 - 0.1], r: [-0.25, 0, 0], c, surf: S_WOOD });
  b.add(bevelBox(0.4, 0.26, 0.004, 0.001), { p: [0, 1.14, D / 2 - 0.09], r: [-0.25, 0, 0], c: '#efe9d8', surf: S_MATTE });
  for (let i = 0; i < 13; i++) b.add(bevelBox(0.03, 0.03, 0.5, 0.006), { p: [(i - 6) * 0.062, 0.1, D / 2 + 0.3], c: i % 2 ? '#1a120c' : '#a8763e', surf: S_WOOD });
  b.add(bevelBox(0.95, 0.045, 0.3, 0.01), { p: [0, 0.6, D / 2 + 0.52], c, surf: S_WOOD });
  for (const s of [-1, 1]) b.add(bevelBox(0.04, 0.58, 0.28, 0.008), { p: [s * 0.43, 0.29, D / 2 + 0.52], c, surf: S_WOOD });
  // pipes
  const pipe = (x, z, r, top, y0) => {
    const fh = Math.min(r * 5, (top - y0) * 0.3);
    b.add(cyl(r, r * 0.3, fh, 7, true), { p: [x, y0 + fh / 2, z], c: pc, surf: tin });
    b.add(cyl(r, r, top - y0 - fh, 7, true), { p: [x, y0 + fh + (top - y0 - fh) / 2, z], c: pc, surf: tin, grad: [y0, top, 0.92, 1.08] });
    b.add(new THREE.BoxGeometry(r * 1.1, r * 0.45, r * 0.4), { p: [x, y0 + fh + r * 0.3, z + r * 0.88], c: '#100e0c', surf: S_MATTE });
    b.add(new THREE.BoxGeometry(r * 1.2, r * 0.9, r * 0.3), { p: [x, y0 + fh + r * 0.98, z + r * 0.9], r: [0.25, 0, 0], c: pc, surf: tin });
  };
  const y0 = bh + 0.16, zf = D / 2 - 0.12;
  const tower = (cx, tw, top, n) => {
    for (let i = 0; i < n; i++) { const t = n > 1 ? i / (n - 1) : 0.5, a = lerp(-1.25, 1.25, t), r = tw / (n * 2.15), mid = 1 - Math.abs(t - 0.5) * 2;
      pipe(cx + Math.sin(a) * tw * 0.47, zf - 0.02 + Math.cos(a) * tw * 0.32, r, top - 0.42 - (1 - mid) * (top - y0) * 0.16, y0 + 0.06); }
    b.add(cyl(tw * 0.6, tw * 0.5, 0.1, 16), { p: [cx, y0 + 0.02, zf], s: [1, 1, 0.75], c: tone(c, 0.02), surf: S_WOOD });
    b.add(cyl(tw * 0.52, tw * 0.6, 0.12, 16), { p: [cx, top - 0.36, zf], s: [1, 1, 0.75], c: tone(c, 0.02), surf: S_WOOD });
    b.add(cyl(tw * 0.55, tw * 0.55, 0.16, 16, true), { p: [cx, top - 0.5, zf], s: [1, 1, 0.75], c: gold, surf: S_BRASS });
    b.add(cyl(tw * 0.66, tw * 0.52, 0.1, 16), { p: [cx, top - 0.25, zf], s: [1, 1, 0.75], c, surf: S_WOOD });
    b.add(lathe([[tw * 0.5, 0], [tw * 0.3, 0.1], [tw * 0.12, 0.16], [0.03, 0.34], [0.06, 0.4], [0.001, 0.5]], 12), { p: [cx, top - 0.2, zf], s: [1, 1, 0.75], c, surf: S_WOOD });
    b.add(sph(0.05, 8, 6), { p: [cx, top + 0.3, zf], c: gold, surf: S_BRASS });
  };
  const flat = (x0, x1, lo, hi, n) => {
    const w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; pipe(x0 + w * (i + 0.5), zf - 0.1, w * 0.4, lerp(lo, hi, t) - 0.12, y0 + 0.02); }
    const mx = (x0 + x1) / 2, top = Math.max(lo, hi);
    b.add(bevelBox(Math.abs(x1 - x0), 0.12, 0.3, 0.02), { p: [mx, top + 0.1, zf - 0.08], c, surf: S_WOOD });
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, yt = lerp(lo, hi, t); b.add(bevelBox(Math.abs(w) * 0.96, top - yt + 0.2, 0.03, 0.005), { p: [x0 + w * (i + 0.5), top + 0.05 - (top - yt + 0.2) / 2, zf + 0.0], c: gold, surf: S_BRASS }); }
  };
  const tw = W * 0.2, cw = W * 0.24;
  tower(0, cw, H - 0.3, 7); tower(-W / 2 + tw / 2 + 0.03, tw, H * 0.9 - 0.3, 5); tower(W / 2 - tw / 2 - 0.03, tw, H * 0.9 - 0.3, 5);
  const fx0 = cw * 0.56, fx1 = W / 2 - tw - 0.0;
  flat(fx0, fx1, bh + (H - bh) * 0.68, bh + (H - bh) * 0.42, 8); flat(-fx0, -fx1, bh + (H - bh) * 0.68, bh + (H - bh) * 0.42, 8);
  return fin(b, o, { size: [W + 0.24, H, D + 1.0], top: H });
}

// Church pew. o: { width, color }
export function pewGeometry(o = {}) {
  const b = makeBuilder(), w = o.width ?? 3, c = o.color ?? '#5a3a20';
  b.add(bevelBox(w, 0.045, 0.42, 0.012), { p: [0, 0.44, 0.02], c, surf: surf(1, 0.5) });
  b.add(bevelBox(w, 0.56, 0.035, 0.008), { p: [0, 0.73, -0.215], r: [-0.1, 0, 0], c, surf: S_WOOD });
  b.add(bevelBox(w, 0.05, 0.085, 0.015), { p: [0, 1.02, -0.245], c: tone(c, 0.02), surf: surf(1, 0.5) });
  b.add(bevelBox(w, 0.3, 0.03, 0.006), { p: [0, 0.28, 0.2], c: tone(c, -0.02), surf: S_WOOD });
  b.add(bevelBox(w, 0.02, 0.11, 0.004), { p: [0, 0.78, -0.31], r: [0.25, 0, 0], c, surf: S_WOOD });
  b.add(bevelBox(w - 0.1, 0.035, 0.13, 0.01), { p: [0, 0.14, -0.42], c: '#6a1f2a', surf: S_FAB });
  const sh = new THREE.Shape(); sh.moveTo(-0.26, 0); sh.lineTo(0.3, 0); sh.lineTo(0.3, 0.86); sh.bezierCurveTo(0.3, 1.0, 0.18, 1.0, 0.18, 1.1); sh.absarc(0.26, 1.13, 0.085, PI, 0, true); sh.lineTo(0.345, 0.5); sh.bezierCurveTo(0.3, 0.5, 0.0, 0.62, -0.26, 0.56); sh.lineTo(-0.26, 0);
  for (const s of [-1, 1]) { const g = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false, curveSegments: 4 }); g.deleteAttribute('uv'); g.rotateY(PI / 2); g.translate(s * (w / 2) - 0.025, 0, 0); b.add(g, { c: tone(c, -0.01), surf: surf(1, 0.5), grad: [0, 0.3, 0.75, 1] }); }
  return fin(b, o, { size: [w + 0.06, 1.22, 0.7], top: 0.46 });
}

// Upholstered railway bench seat. o: { width, color, woodColor }
export function trainSeatGeometry(o = {}) {
  const b = makeBuilder(), w = o.width ?? 1.05, c = o.color ?? '#6a1f2a', wc = o.woodColor ?? '#5a321a';
  b.add(bevelBox(w, 0.3, 0.5, 0.015), { p: [0, 0.2, 0], c: wc, surf: S_WOOD });
  b.add(cushion(w - 0.03, 0.15, 0.52, 0.4, 6), { p: [0, 0.42, 0.02], c, surf: S_FAB });
  b.add(bevelBox(w, 1.2, 0.05, 0.012), { p: [0, 0.65, -0.26], c: wc, surf: S_WOOD });
  b.add(cushion(w - 0.04, 0.72, 0.15, 0.42, 6), { p: [0, 0.86, -0.17], r: [-0.07, 0, 0], c, surf: S_FAB });
  for (let i = 0; i < 2; i++) b.add(bevelBox(w * 0.3, 0.13, 0.012, 0.004), { p: [(i - 0.5) * w * 0.48, 1.16, -0.085], r: [-0.07, 0, 0], c: '#cfc6ae', surf: S_FAB });
  b.add(bevelBox(w + 0.04, 0.045, 0.09, 0.015), { p: [0, 1.27, -0.26], c: wc, surf: surf(1, 0.5) });
  for (const s of [-1, 1]) { b.add(bevelBox(0.045, 0.62, 0.56, 0.012), { p: [s * (w / 2 + 0.01), 0.36, 0.01], c: wc, surf: S_WOOD }); b.add(cushion(0.07, 0.05, 0.4, 0.5, 4), { p: [s * (w / 2 + 0.01), 0.69, 0.02], c, surf: S_FAB }); }
  b.add(new THREE.TorusGeometry(0.06, 0.008, 5, 10, PI), { p: [w / 2 + 0.01, 1.29, -0.26], r: [0, PI / 2, 0], c: '#c9a148', surf: S_BRASS });
  return fin(b, o, { size: [w + 0.1, 1.3, 0.6], top: 0.5 });
}

// Suitcase / trunk. o: { width, color, rng }
export function suitcaseGeometry(o = {}) {
  const rng = prng(o), b = makeBuilder(), w = o.width ?? rng.range(0.5, 0.75), h = w * 0.62, d = w * 0.3, c = o.color ?? rng.pick(['#6a3a1e', '#3a4a3a', '#7a5a2a', '#2a3550', '#5a2a22']);
  b.add(bevelBox(w, h, d, 0.02), { p: [0, h / 2, 0], c, surf: surf(0, 0.35) });
  for (const s of [-1, 1]) { b.add(bevelBox(0.035, h + 0.006, d + 0.006, 0.004), { p: [s * w * 0.27, h / 2, 0], c: tone(c, -0.08), surf: surf(0, 0.3) }); b.add(bevelBox(0.05, 0.035, 0.012, 0.004), { p: [s * w * 0.27, h * 0.82, d / 2 + 0.004], c: '#c9a148', surf: S_BRASS }); }
  for (const sx of [-1, 1]) for (const sy of [0, 1]) b.add(sph(0.022, 6, 5), { p: [sx * (w / 2 - 0.012), sy * (h - 0.024) + 0.012, d / 2 - 0.01], c: '#c9a148', surf: S_BRASS });
  b.add(new THREE.TorusGeometry(0.06, 0.009, 5, 8, PI), { p: [0, h, 0], c: tone(c, -0.1), surf: surf(0, 0.4) });
  return fin(b, o, { size: [w, h + 0.06, d], top: h });
}

// kind -> generator, used by makeProp / makeFurniture
export const PROP_GENERATORS = {
  table: tableGeometry, chair: chairGeometry, sofa: sofaGeometry, bed: bedGeometry, bookshelf: bookshelfGeometry, bookStack: bookStackGeometry,
  lamp: lampGeometry, candle: candleGeometry, fireplace: fireplaceGeometry, plant: plantGeometry, vase: vaseGeometry, teapot: teapotGeometry, cup: cupGeometry,
  plate: plateGeometry, fruitBowl: fruitBowlGeometry, teaSet: teaSetGeometry, kitchenCounter: kitchenCounterGeometry, piano: pianoGeometry, toyBlocks: toyBlocksGeometry,
  toyTrain: toyTrainGeometry, rockingHorse: rockingHorseGeometry, staircase: staircaseGeometry, chandelier: chandelierGeometry, organ: organGeometry, pew: pewGeometry, trainSeat: trainSeatGeometry, suitcase: suitcaseGeometry,
};
export const PROP_KINDS = Object.keys(PROP_GENERATORS);

// ---------------------------------------------------------------------------------------------
// flames: candle flames, fire tongues and rising embers as instanced billboards (one draw call)
// ---------------------------------------------------------------------------------------------
// o: { flames:[[x,y,z,size]...], fires:[{ position:[x,y,z], width, height }], rng, gain, embers (per fire) }
// Positions are in the returned object's local space. -> { object, uniforms, count, triangles, update(dt,time,camera) }
export function makeFlames(o = {}) {
  const rng = o.rng || makeRng(11), POS = [], PAR = [];
  for (const f of o.flames || []) { const p = f.position || f, s = f.size ?? f[3] ?? 0.05; POS.push(p[0], p[1], p[2], s); PAR.push(0, rng(), s * 0.5, s); }
  for (const f of o.fires || []) {
    const p = f.position, w = f.width ?? 0.5, h = f.height ?? 0.6, nt = f.tongues ?? 7, ne = f.embers ?? o.embers ?? 14;
    for (let i = 0; i < nt; i++) { const t = (i + 0.5) / nt - 0.5, k = 1 - Math.abs(t) * 1.1; POS.push(p[0] + t * w * 0.9, p[1] - h * 0.04, p[2] + rng.range(-0.25, 0.25) * w * 0.3, 1); PAR.push(1, rng(), w * rng.range(0.42, 0.6), h * k * rng.range(0.75, 1.1)); }
    for (let i = 0; i < ne; i++) { POS.push(p[0] + rng.range(-0.4, 0.4) * w, p[1] + h * 0.15, p[2] + rng.range(-0.1, 0.1) * w, h * rng.range(1.1, 2.0)); const s = h * rng.range(0.018, 0.035); PAR.push(2, rng(), s, s); }
  }
  const count = POS.length / 4, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(new Float32Array(POS), 4)); g.setAttribute('aPar', new THREE.InstancedBufferAttribute(new Float32Array(PAR), 4));
  g.instanceCount = count;
  const bs = new THREE.Sphere(); { const box = new THREE.Box3(); for (let i = 0; i < count; i++) box.expandByPoint(_p.set(POS[i * 4], POS[i * 4 + 1], POS[i * 4 + 2])); if (count) { box.getBoundingSphere(bs); bs.radius += 2 * Math.max(0.1, ...PAR.filter((_, i) => i % 4 === 3)) + (o.fires ? 3 * Math.max(...o.fires.map((f) => f.height ?? 0.6), 0) : 0); } }
  g.boundingSphere = bs;
  const uniforms = { ...fogUniforms(), uTime: { value: 0 }, uGain: { value: o.gain ?? 1 } };
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aPos, aPar; uniform float uTime; varying vec2 vUv; flat varying vec3 vK;
      #include <fog_pars_vertex>
      void main(){
        float kind=aPar.x, seed=aPar.y; vec3 c=aPos.xyz; vec2 sz=aPar.zw; vec2 q=position.xy; float fade=1.;
        if(kind>1.5){ float life=fract(uTime*(.22+.25*fract(seed*7.3))+seed*13.); c.y+=life*aPos.w; c.x+=sin(life*8.+seed*40.)*aPos.w*.1*life; c.z+=cos(life*6.+seed*23.)*aPos.w*.06*life; fade=(1.-life)*smoothstep(0.,.08,life); q.y-=.5; }
        else if(kind<.5){ float fl=sin(uTime*9.+seed*30.)*.5+sin(uTime*23.+seed*11.)*.3+sin(uTime*3.1+seed*5.)*.6; q.x+=q.y*q.y*fl*.16; sz.y*=1.+.1*sin(uTime*13.+seed*17.); fade=.9+.1*sin(uTime*19.+seed*9.); }
        else { sz.y*=.85+.25*sin(uTime*(5.+seed*4.)+seed*20.); q.x+=q.y*sin(uTime*4.+seed*31.)*.12; }
        vec3 up=(modelMatrix*vec4(0.,1.,0.,0.)).xyz; float ms=length(up); up/=ms;
        vec4 wc=modelMatrix*vec4(c,1.); vec3 toCam=normalize(cameraPosition-wc.xyz); vec3 right=normalize(cross(up,toCam));
        vec3 upv=kind>1.5?normalize(cross(toCam,right)):up;
        vec3 wp=wc.xyz+(right*q.x*sz.x+upv*q.y*sz.y)*ms;
        vec4 mvPosition=viewMatrix*vec4(wp,1.); gl_Position=projectionMatrix*mvPosition;
        vUv=vec2(position.x*2.,position.y); vK=vec3(kind,seed,fade);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`precision highp float;
      uniform float uTime, uGain; varying vec2 vUv; flat varying vec3 vK;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main(){
        vec2 p=vUv; float kind=vK.x, seed=vK.y; vec3 col;
        if(kind<.5){
          float w=1.8*pow(p.y,.45)*pow(1.-p.y,.75); float d=abs(p.x)/max(w,1e-3);
          float body=smoothstep(1.,.3,d); float core=smoothstep(.75,0.,d)*smoothstep(.02,.3,p.y);
          col=mix(vec3(1.,.36,.05),vec3(1.,.8,.42),core)*body;
          col=mix(col,vec3(.1,.22,.9)*body,smoothstep(.2,.02,p.y)*.85);
          col*=7.*vK.z;
        } else if(kind<1.5){
          float n=i_fbm2(vec2(p.x*1.4+seed*7.,p.y*2.-uTime*1.7-seed*3.));
          float n2=i_n2(vec2(p.x*3.5+seed*5.,p.y*4.-uTime*3.1));
          float m=(1.-p.y)*(1.-abs(p.x+(n2-.5)*.6*p.y)*1.15)+(n-.5)*.85-p.y*.3;
          m=smoothstep(0.,.45,m)*smoothstep(0.,.06,p.y)*smoothstep(1.,.7,abs(p.x));
          float heat=m*(1.-p.y*.55);
          col=mix(vec3(.85,.1,.01),vec3(1.,.5,.08),smoothstep(.15,.55,heat)); col=mix(col,vec3(1.,.88,.55),smoothstep(.6,1.,heat));
          col*=m*3.2;
        } else { float r=length(vec2(p.x,(p.y-.5)*2.)); col=vec3(1.,.48,.1)*smoothstep(1.,.15,r)*vK.z*7.; }
        col*=uGain;
        ${FOG_ADD}
        gl_FragColor=vec4(col,1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'interior-flames'; mesh.renderOrder = 6;
  return { object: mesh, uniforms, count, triangles: count * 2, update(dt, time) { uniforms.uTime.value = time; } };
}

// ---------------------------------------------------------------------------------------------
// animated / specially shaded props
// ---------------------------------------------------------------------------------------------
const propMat = (o) => o.material || propMaterial({ rig: o.rig, scale: o.scale, sway: o.sway });

// Clock with moving hands and a swinging pendulum. o: { rig, rng, kind:'longcase'|'wall'|'mantel', scale, color, hour, speed, material }
// speed = clock seconds per real second (default 120, so the minute hand visibly creeps). Dial faces +z, origin on the floor
// (longcase), at the wall fixing (wall) or on the shelf (mantel). -> { object, update, triangles, drawCalls, size }
export function makeClock(o = {}) {
  const rng = prng(o), kind = o.kind || 'longcase', S = o.scale ?? 1, c = o.color ?? WOOD.mahogany, b = makeBuilder(), brass = '#c9a148', mat = propMat(o);
  let dial, dr, pend = null, size;
  const face = (x, y, z, r) => {
    b.add(new THREE.CircleGeometry(r, 28), { p: [x, y, z], c: '#efe6cf', surf: surf(0, 0.5) });
    b.add(new THREE.TorusGeometry(r * 1.03, r * 0.07, 6, 28), { p: [x, y, z], c: brass, surf: S_BRASS });
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; b.add(new THREE.BoxGeometry(r * (i % 3 ? 0.035 : 0.07), r * 0.16, r * 0.01), { p: [x + Math.sin(a) * r * 0.82, y + Math.cos(a) * r * 0.82, z + r * 0.01], r: [0, 0, -a], c: '#1a1410', surf: S_MATTE }); }
    b.add(cyl(r * 0.06, r * 0.06, r * 0.09, 8), { p: [x, y, z + r * 0.04], r: [PI / 2, 0, 0], c: brass, surf: S_BRASS });
    dial = [x, y, z + r * 0.045]; dr = r;
  };
  if (kind === 'longcase') {
    b.add(bevelBox(0.5, 0.52, 0.28, 0.012), { p: [0, 0.26, 0], c, surf: S_WOOD, grad: [0, 0.3, 0.75, 1] }); b.add(bevelBox(0.56, 0.09, 0.32, 0.015), { p: [0, 0.045, 0], c: tone(c, -0.03), surf: S_WOOD });
    b.add(bevelBox(0.36, 0.3, 0.012, 0.004), { p: [0, 0.29, 0.142], c: tone(c, 0.03), surf: S_WOOD });
    b.add(bevelBox(0.54, 0.05, 0.31, 0.015), { p: [0, 0.545, 0], c: tone(c, 0.02), surf: S_WOOD });
    // trunk as an open frame so the pendulum shows
    for (const s of [-1, 1]) { b.add(bevelBox(0.05, 0.98, 0.2, 0.008), { p: [s * 0.145, 1.06, 0], c, surf: S_WOOD }); }
    b.add(bevelBox(0.34, 0.1, 0.2, 0.008), { p: [0, 0.62, 0], c, surf: S_WOOD }); b.add(bevelBox(0.34, 0.1, 0.2, 0.008), { p: [0, 1.5, 0], c, surf: S_WOOD });
    b.add(new THREE.BoxGeometry(0.26, 0.9, 0.012), { p: [0, 1.06, -0.09], c: '#0e0806', surf: S_MATTE });
    b.add(bevelBox(0.5, 0.05, 0.29, 0.015), { p: [0, 1.575, 0], c: tone(c, 0.02), surf: S_WOOD });
    b.add(bevelBox(0.46, 0.46, 0.26, 0.012), { p: [0, 1.83, 0], c, surf: S_WOOD });
    for (const s of [-1, 1]) b.add(cyl(0.02, 0.02, 0.42, 8), { p: [s * 0.215, 1.83, 0.125], c: tone(c, 0.03), surf: surf(1, 0.6) });
    b.add(bevelBox(0.54, 0.05, 0.3, 0.015), { p: [0, 2.085, 0], c: tone(c, 0.02), surf: S_WOOD });
    for (const s of [-1, 1]) { b.add(tube([[s * 0.25, 2.11, 0.1], [s * 0.13, 2.2, 0.1], [s * 0.05, 2.19, 0.1]], 0.022, 8, 6), { c, surf: S_WOOD }); b.add(sph(0.03, 8, 6), { p: [s * 0.045, 2.185, 0.1], c: brass, surf: S_BRASS }); }
    b.add(lathe([[0.03, 0], [0.012, 0.03], [0.03, 0.07], [0.001, 0.13]], 8), { p: [0, 2.11, 0.1], c: brass, surf: S_BRASS });
    face(0, 1.83, 0.132, 0.17); pend = { pivot: [0, 1.52, 0.0], len: 0.72, bob: 0.06 }; size = [0.56, 2.25, 0.32];
  } else if (kind === 'wall') {
    b.add(cyl(0.2, 0.2, 0.07, 28), { p: [0, 0, 0.035], r: [PI / 2, 0, 0], c, surf: S_WOOD });
    for (const s of [-1, 1]) b.add(bevelBox(0.03, 0.42, 0.09, 0.006), { p: [s * 0.085, -0.36, 0.045], c, surf: S_WOOD });
    b.add(new THREE.BoxGeometry(0.15, 0.4, 0.012), { p: [0, -0.36, 0.01], c: '#0e0806', surf: S_MATTE });
    b.add(lathe([[0.1, 0], [0.085, 0.03], [0.03, 0.06], [0.001, 0.09]], 4), { p: [0, -0.57, 0.045], r: [PI, PI / 4, 0], s: [1, 1, 0.64], c, surf: S_WOOD });
    face(0, 0, 0.072, 0.165); pend = { pivot: [0, -0.16, 0.045], len: 0.33, bob: 0.045 }; size = [0.42, 0.9, 0.1];
  } else {
    const sh = new THREE.Shape(); sh.moveTo(-0.15, 0); sh.lineTo(0.15, 0); sh.lineTo(0.15, 0.18); sh.absarc(0, 0.18, 0.15, 0, PI, false); sh.lineTo(-0.15, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1, curveSegments: 10 }); g.deleteAttribute('uv'); g.translate(0, 0.03, -0.05);
    b.add(g, { c, surf: surf(1, 0.6) }); b.add(bevelBox(0.36, 0.03, 0.14, 0.008), { p: [0, 0.015, 0], c: tone(c, -0.03), surf: S_WOOD });
    for (const s of [-1, 1]) b.add(sph(0.014, 8, 6), { p: [s * 0.15, -0.004, 0.05], c: brass, surf: S_BRASS });
    face(0, 0.2, 0.058, 0.105); size = [0.36, 0.37, 0.14];
  }
  const group = new THREE.Group(); group.name = 'interior-clock'; group.scale.setScalar(S);
  const body = new THREE.Mesh(b.build(), mat); group.add(body); let tris = b.triangles;
  const hand = (len, w, z) => { const hb = makeBuilder(); hb.add(bevelBox(w, len, dr * 0.02, w * 0.3), { p: [0, len * 0.38, 0], c: '#14100c', surf: S_GLOSS }); hb.add(cyl(w * 1.1, w * 1.1, dr * 0.03, 8), { r: [PI / 2, 0, 0], c: '#14100c', surf: S_GLOSS });
    const m = new THREE.Mesh(hb.build(), mat); m.position.set(dial[0], dial[1], dial[2] + z); group.add(m); tris += hb.triangles; return m; };
  const hh = hand(dr * 0.6, dr * 0.075, dr * 0.02), mh = hand(dr * 0.86, dr * 0.05, dr * 0.05);
  let pm = null;
  if (pend) { const pb = makeBuilder(); pb.add(cyl(0.004, 0.004, pend.len, 5), { p: [0, -pend.len / 2, 0], c: brass, surf: S_BRASS }); pb.add(cyl(pend.bob, pend.bob, 0.014, 20), { p: [0, -pend.len, 0], r: [PI / 2, 0, 0], c: brass, surf: S_BRASS });
    pm = new THREE.Mesh(pb.build(), mat); pm.position.set(pend.pivot[0], pend.pivot[1], pend.pivot[2]); group.add(pm); tris += pb.triangles; }
  const t0 = (o.hour ?? rng.range(0, 12)) * 3600, speed = o.speed ?? 120;
  const update = (dt, time) => { const t = t0 + time * speed; hh.rotation.z = -(t / 43200) * TAU; mh.rotation.z = -(t / 3600) * TAU; if (pm) pm.rotation.z = Math.sin(time * PI) * 0.11; };
  update(0, 0);
  return { object: group, update, triangles: tris, drawCalls: pm ? 4 : 3, size: size.map((v) => v * S), material: mat };
}

// Terrestrial globe on a brass stand, slowly turning. o: { rig, rng, scale, radius, spin (rad/s), seed, detail (segments round the equator, 96), material }
export function makeGlobe(o = {}) {
  const rng = prng(o), S = o.scale ?? 1, r = o.radius ?? 0.2, mat = propMat(o), b = makeBuilder(), brass = '#c9a148', tilt = 0.41, cy = 0.12 + r * 1.16;
  b.add(lathe([[0.001, 0], [r * 0.62, 0], [r * 0.66, 0.012], [r * 0.5, 0.03], [r * 0.16, 0.05], [r * 0.1, 0.085], [r * 0.16, 0.1], [r * 0.08, 0.12]], 16), { c: WOOD.walnut, surf: surf(1, 0.6) });
  const M = new M4().makeTranslation(0, cy, 0).multiply(new M4().makeRotationZ(-tilt));
  b.add(new THREE.TorusGeometry(r * 1.1, r * 0.035, 6, 36), { m: M, c: brass, surf: S_BRASS });
  for (const s of [-1, 1]) b.add(cyl(r * 0.03, r * 0.03, r * 0.14, 6), { m: M.clone().multiply(new M4().makeTranslation(0, s * r * 1.05, 0)), c: brass, surf: S_BRASS });
  b.add(new THREE.TorusGeometry(r * 1.1, r * 0.03, 5, 20, PI), { p: [0, cy, 0], r: [0, PI / 2, PI], c: brass, surf: S_BRASS });
  // the map is painted per vertex, so the ball is finely divided: crisp coasts, shallows, relief, a graticule
  const GW = o.detail ?? 96, GH = Math.round(GW * 0.64);
  const g = new THREE.SphereGeometry(r, GW, GH), n = makeNoise(Math.floor((o.seed ?? rng() * 1000))), pa = g.attributes.position, C = new Float32Array(pa.count * 3), SF = new Float32Array(pa.count * 4);
  const sea0 = col('#12305a'), sea1 = col('#3f7fa6'), shal = col('#8fc0c4'), l0 = col('#5f8a3e'), l1 = col('#c9aa62'), l2 = col('#8a5c36'), ice = col('#eef2f4'), ink = col('#2a2014'), k = new THREE.Color();
  const sGloss = surf(0, 0.74)[0], lGloss = surf(0, 0.3)[0];
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i) / r, y = pa.getY(i) / r, z = pa.getZ(i) / r, lat = Math.abs(y);
    const e = n.fbm3(x * 1.25 + 3, y * 1.25, z * 1.25, 3) * 0.8 + 0.2 * n.fbm3(x * 4.2, y * 4.2 + 7, z * 4.2, 4) + 0.07;
    let gl = sGloss;
    if (e > 0) {
      const t = clamp(e / 0.42, 0, 1), rel = n.n3(x * 9, y * 9, z * 9);
      k.copy(l0).lerp(l1, smoothstep(0.1, 0.55, t + (0.5 - lat) * 0.5 + rel * 0.12)).lerp(l2, smoothstep(0.55, 1, t + rel * 0.15)).multiplyScalar(0.92 + 0.16 * rel);
      k.lerp(ink, 0.55 * (1 - smoothstep(0, 0.035, e))); gl = lGloss;
    } else k.copy(shal).lerp(sea1, smoothstep(0, 0.07, -e)).lerp(sea0, smoothstep(0.05, 0.45, -e));
    if (lat + e * 0.3 > 0.87) { k.copy(ice).multiplyScalar(0.9 + 0.1 * n.n3(x * 7, y * 7, z * 7)); gl = lGloss; }
    // graticule: meridians every 30 degrees, parallels every 20 (drawn only as fine as the mesh can carry)
    const lon = Math.atan2(z, x) / (PI / 6), la = Math.asin(clamp(y, -1, 1)) / (PI / 9), cw = Math.max(0.2, Math.sqrt(1 - y * y));
    const dg = Math.min(Math.abs(lon - Math.round(lon)) * cw * (PI / 6), Math.abs(la - Math.round(la)) * (PI / 9));
    k.lerp(ink, 0.3 * (1 - smoothstep(0.012, 0.03, dg)));
    C[i * 3] = k.r; C[i * 3 + 1] = k.g; C[i * 3 + 2] = k.b; SF[i * 4] = gl; SF[i * 4 + 1] = 0; SF[i * 4 + 2] = 0; SF[i * 4 + 3] = 1;
  }
  g.deleteAttribute('uv'); g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setAttribute('surf', new THREE.BufferAttribute(SF, 4));
  const group = new THREE.Group(); group.name = 'interior-globe'; group.scale.setScalar(S);
  group.add(new THREE.Mesh(b.build(), mat));
  const axis = new THREE.Group(); axis.position.set(0, cy, 0); axis.rotation.z = -tilt; group.add(axis);
  const ball = new THREE.Mesh(g, mat); axis.add(ball);
  const spin = o.spin ?? 0.25;
  return { object: group, update(dt, time) { ball.rotation.y = time * spin; }, triangles: b.triangles + g.index.count / 3, drawCalls: 2, size: [r * 2.3 * S, (cy + r * 1.2) * S, r * 2.3 * S], material: mat };
}

// Curtains for the windows of a rig (one mesh per call). They hang at both sides of every window, tied back, and
// billow gently. o: { rig, rng, rows (default: every unstained wall row), color, scale, fullness, emissive, tie:true, length:'floor'|'sill' }
export function makeCurtains(o = {}) {
  const rig = o.rig, rng = prng(o), S = o.scale ?? rig.scale ?? 1, b = makeBuilder(), brass = '#c9a148';
  const rows = o.rows || rig.rows.filter((r) => !r.stained && r.arch < 3 && Math.abs(r.normal.y) < 0.3 && !r.noCurtain);
  const cc = col(o.color ?? rng.pick(['#7a1f2a', '#28486a', '#b8892e', '#3d5a40', '#8a3a52'])), lite = tone(cc, 0.1, -0.05), dark = tone(cc, -0.07);
  const floorY = rig.state.floorY, em = o.emissive ?? 0.1, seg = o.segments || [18, 12];
  for (const r of rows) {
    const hw = r.width / 2, top = r.origin.y + r.height / 2 + 0.16 * S, sill = r.origin.y - r.height / 2;
    const bottom = (o.length === 'sill' || sill - floorY > 1.3 * S) ? sill - 0.25 * S : floorY + 0.02 * S, Hc = top - bottom, off = 0.1 * S;
    for (let k = 0; k < r.count; k++) {
      const c0 = rowWindowCentre(r, k), P = (a, y, d) => [c0.x + r.axis.x * a + r.normal.x * d, y, c0.z + r.axis.z * a + r.normal.z * d];
      const rodHalf = hw + 0.34 * S; rod(b, P(-rodHalf, top + 0.03 * S, off), P(rodHalf, top + 0.03 * S, off), 0.016 * S, brass, S_BRASS, 6);
      for (const s of [-1, 1]) { const e = P(s * rodHalf, top + 0.03 * S, off); b.add(sph(0.034 * S, 6, 4), { p: e, c: brass, surf: S_BRASS }); const br = P(s * (hw + 0.26 * S), top + 0.03 * S, 0); rod(b, P(s * (hw + 0.26 * S), top + 0.03 * S, off), br, 0.01 * S, brass, S_BRASS, 5); }
      for (const s of [-1, 1]) {
        const outer = hw + 0.26 * S, innerTop = hw * (o.cover ?? 0.42), vt = 0.6, ph = rng() * 6, np = 5 + Math.round((o.fullness ?? 1) * 3), amp = 0.045 * S * (o.fullness ?? 1);
        const wf = (v) => (v < vt ? lerp(1, 0.26, Math.pow(smoothstep(0, 1, v / vt), 1.4)) : lerp(0.26, 0.4, smoothstep(0, 1, (v - vt) / (1 - vt))));
        const g = sheet(seg[0], seg[1], (u, v, out) => {
          const w = (outer - innerTop) * wf(v), a = s * (outer - u * w), y = top - v * Hc;
          const pl = Math.sin(u * np * TAU + ph + v * 1.3) * amp * (0.55 + 0.9 * (1 - wf(v))) * (0.4 + 0.6 * Math.min(1, v * 6));
          const p = P(a, y, off + pl + amp * 0.2); out[0] = p[0]; out[1] = p[1]; out[2] = p[2];
        }, true);
        b.add(g, { c: '#ffffff', surf: surf(2, 0.1, 0, em), sway: (X, Y) => { const v = (top - Y) / Hc; return clamp(v * 1.6, 0, 1) * (1 - 0.85 * Math.exp(-Math.pow((v - vt) / 0.13, 2))) * 0.9; },
          tint: (X, Y, Z, kk, lx, ly, lz) => { const v = (top - Y) / Hc, d = (X - c0.x) * r.normal.x + (Z - c0.z) * r.normal.z - off, f = clamp(d / amp * 0.5 + 0.5, 0, 1); kk.copy(dark).lerp(lite, f).multiplyScalar(lerp(1.0, 0.8, v)); } });
        if (o.tie !== false) { const ty = top - vt * Hc, ta = s * (outer - (outer - innerTop) * 0.13); b.add(new THREE.TorusGeometry(0.075 * S, 0.014 * S, 4, 7), { p: P(ta, ty, off + amp * 0.2), r: [PI / 2, 0, 0], s: [1.25, 1, 1], pre: null, c: '#d8b25a', surf: S_BRASS }); }
      }
    }
  }
  const mat = interiorMaterial({ rig, pattern: 'prop', scale: S, side: THREE.FrontSide, sway: { dir: o.swayDir || (rows[0] ? [Math.abs(rows[0].normal.x), 0, Math.abs(rows[0].normal.z)] : [1, 0, 0]), amp: o.swayAmp ?? 0.05, freq: o.swayFreq ?? 0.8, k: 0.5 } });
  const mesh = new THREE.Mesh(b.build(), mat); mesh.name = 'interior-curtains';
  return { object: mesh, uniforms: mat.userData.uniforms, triangles: b.triangles, drawCalls: 1, update() {} };
}

// Framed abstract paintings. o: { rig, rng, scale, pictures:[{ position:[x,y,z] (centre, on the wall), normal:[x,y,z], width, height, seed, frame }] }
// -> two draw calls (frames, canvases).
export function makePictures(o = {}) {
  const rig = o.rig, rng = prng(o), S = o.scale ?? (rig ? rig.scale : 1), fb = makeBuilder();
  const P = [], N = [], C = [], UV = [], I = []; let n = 0;
  for (const p of o.pictures || []) {
    const w = p.width, h = p.height, nn = toV3(p.normal || [0, 0, 1]).normalize(), ax = new V3(nn.z, 0, -nn.x).normalize(), c0 = toV3(p.position), seed = p.seed ?? rng(), fw = (p.frameWidth ?? 0.07) * S * clamp(Math.sqrt(w * h) / (1.0 * S), 0.6, 2.2), fd = fw * 0.75;
    const m = new M4().makeBasis(ax, new V3(0, 1, 0), nn).setPosition(c0), gilt = p.frame == null ? rng.chance(0.7) : p.frame === 'gilt', fc = gilt ? '#c9a148' : (p.frame && p.frame !== 'wood' ? p.frame : '#2a1a10'), fs = gilt ? S_BRASS : S_WOOD;
    for (const s of [-1, 1]) { fb.add(bevelBox(fw, h + fw * 2, fd, fw * 0.3), { pre: m, p: [s * (w / 2 + fw / 2), 0, fd / 2], c: fc, surf: fs }); fb.add(bevelBox(w + fw * 2, fw, fd, fw * 0.3), { pre: m, p: [0, s * (h / 2 + fw / 2), fd / 2], c: fc, surf: fs });
      fb.add(bevelBox(fw * 0.3, h + fw * 0.3, fd * 0.6, fw * 0.08), { pre: m, p: [s * (w / 2 + fw * 0.1), 0, fd * 0.4], c: gilt ? '#8a6a2a' : '#c9a148', surf: S_BRASS }); fb.add(bevelBox(w + fw * 0.3, fw * 0.3, fd * 0.6, fw * 0.08), { pre: m, p: [0, s * (h / 2 + fw * 0.1), fd * 0.4], c: gilt ? '#8a6a2a' : '#c9a148', surf: S_BRASS }); }
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const v = new V3(sx * w / 2, sy * h / 2, fd * 0.25).applyMatrix4(m); P.push(v.x, v.y, v.z); N.push(nn.x, nn.y, nn.z); C.push(seed, clamp(w / h / 4, 0.02, 1), 0); UV.push(sx * 0.5 + 0.5, sy * 0.5 + 0.5); }
    I.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
  const group = new THREE.Group(); group.name = 'interior-pictures';
  const cm = interiorMaterial({ rig, pattern: 'picture', mode: 0, scale: S, surf: S_PLAIN, vertexColors: true });
  group.add(new THREE.Mesh(g, cm)); group.add(new THREE.Mesh(fb.build(), propMat({ ...o, scale: S })));
  return { object: group, triangles: n / 2 + fb.triangles, drawCalls: 2, update() {} };
}

// Patterned rugs with fringes (one draw call). o: { rig, rng, scale, colors:[field, border, cream, gold], rugs:[{ position:[x,y,z], width, length, rotation, seed }] }
// length runs along local z before rotation; y is the floor height.
export function makeRugs(o = {}) {
  const rig = o.rig, rng = prng(o), S = o.scale ?? (rig ? rig.scale : 1), P = [], N = [], C = [], UV = [], I = []; let n = 0, tris = 0;
  for (const r of o.rugs || []) {
    const w = r.width, L = r.length, a = r.rotation ?? 0, ca = Math.cos(a), sa = Math.sin(a), seed = r.seed ?? rng(), fr = (r.fringe ?? 0.09 * S) / L, p0 = r.position, y = p0[1] + (r.lift ?? 0.012 * S);
    // a small grid, so the per-vertex window fill follows the floor underneath
    const nu = clamp(Math.ceil(L / (2.5 * S)), 1, 12), nv = clamp(Math.ceil(w / (2.5 * S)), 1, 6);
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const su = i / nu * 2 - 1, sv = j / nv * 2 - 1, lz = su * (L / 2 + fr * L), lx = sv * w / 2; P.push(p0[0] + lx * ca + lz * sa, y, p0[2] - lx * sa + lz * ca); N.push(0, 1, 0); C.push(seed, clamp(L / w / 4, 0.02, 1), 0); UV.push(su * (0.5 + fr) + 0.5, sv * 0.5 + 0.5); }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = n + i * (nv + 1) + j, b2 = a + nv + 1; I.push(a, b2, b2 + 1, a, b2 + 1, a + 1); }
    n += (nu + 1) * (nv + 1); tris += nu * nv * 2;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
  const mat = interiorMaterial({ rig, pattern: 'picture', mode: 1, scale: S, surf: S_FAB, vertexColors: true, colors: o.colors || ['#6e1a1c', '#141c36', '#d9c9a0', '#b0782c'], side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'interior-rugs';
  return { object: mesh, uniforms: mat.userData.uniforms, triangles: tris, drawCalls: 1, update() {} };
}

// Rows of books as one InstancedMesh with per-instance colours (the page block keeps its paper colour).
// o: { rig, rng, runs:[{ x0, x1, y, z, depth, height, matrix? }] (bookshelfGeometry({ books:false }).userData.runs), matrix (Matrix4 that
//      places the runs, e.g. the bookcase's; a run's own matrix wins), colors, pages:true, max:4000, material }
// -> { object, count, triangles (12-14 per book), drawCalls:1, update }
export function makeBooks(o = {}) {
  const rng = prng(o), b = makeBuilder(), pal = (o.colors || BOOK_COLORS).map((c) => col(c)), cs = surf(0, 0.32);
  // a unit book (x thickness, y height, z depth; spine at +z): cover box plus the paper block seen from above
  b.add(new THREE.BoxGeometry(1, 1, 1), { p: [0, 0.5, 0], c: '#ffffff', surf: cs });
  if (o.pages !== false) b.add(new THREE.PlaneGeometry(0.74, 0.9), { r: [-PI / 2, 0, 0], p: [0, 1.004, -0.035], c: '#e4dcc4', surf: [0.08, 0, -1, 1] });
  const geo = b.build(), list = [], base = o.matrix || new M4(), max = o.max ?? 4000;
  for (const r of o.runs || []) {
    let x = r.x0 + rng.range(0, r.height * 0.03);
    while (x < r.x1 - r.height * 0.06 && list.length < max) {
      if (rng.chance(0.06)) { x += r.height * rng.range(0.1, 0.4); continue; }
      const t = Math.min(r.height * rng.range(0.06, 0.17), r.x1 - x), hb = r.height * rng.range(0.6, 0.94), db = r.depth * rng.range(0.7, 0.94), lean = rng.chance(0.05) ? rng.range(0.1, 0.25) : 0;
      list.push({ b: r.matrix || base, m: new M4().compose(new V3(x + t / 2 + lean * hb * 0.5, r.y, r.z - db / 2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -lean)), new V3(t, hb, db)), c: tone(rng.pick(pal), rng.range(-0.03, 0.05), rng.range(-0.1, 0.05)) });
      x += t * (1 + lean * 2) + r.height * 0.004;
    }
  }
  const mesh = new THREE.InstancedMesh(geo, propMat(o), list.length); mesh.name = 'interior-books';
  list.forEach((it, i) => { mesh.setMatrixAt(i, _m.multiplyMatrices(it.b, it.m)); mesh.setColorAt(i, it.c); });
  mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return { object: mesh, count: list.length, triangles: list.length * b.triangles, drawCalls: 1, update() {} };
}

// ---------------------------------------------------------------------------------------------
// makeFurniture: many props merged into one draw call, with their flames, lamp lights and contact shadows
// ---------------------------------------------------------------------------------------------
const SHARED_KINDS = { table: 1, chair: 1, lamp: 1, pew: 1, trainSeat: 1, chandelier: 1, staircase: 1 };
const LIGHT_PRESETS = {
  fireplace: { color: '#ff8a3a', intensity: 10, range: 9, flicker: 0.55, priority: 10 }, chandelier: { color: '#ffc477', intensity: 7, range: 8, flicker: 0.12, priority: 8 },
  lamp: { color: '#ffc27a', intensity: 5.5, range: 5, flicker: 0, priority: 6 }, candle: { color: '#ffb060', intensity: 1.8, range: 2.4, flicker: 0.35, priority: 3 },
};
// o: { rig, rng, scale (default rig.scale), items:[{ kind, position:[x,y,z], rotation (about y), scale (multiplier), opts:{generator options},
//      light:false|{...}, occluder:false }], lights:true, occluders:true, maxLights, maxOccluders, chunks, length, material, flameGain,
//      instancedBooks:true, bookColors }
// kind is any key of PROP_GENERATORS, or 'clock' / 'globe' (animated, 2-4 extra draw calls each).
// -> { object, update(dt,time,camera), triangles, drawCalls, items:[{ kind, position, rotation, size, top, userData }], flames, lights, material }
// makeFurnitureAsync(options, ctx.yield) is the same furniture built in short steps that hand the page back in between
// (same result, same random draws): `const fur = await INT.makeFurnitureAsync({ ... }, ctx.yield);`
// Await it before anything else uses the same rng or rig (see makeRoomAsync).
export function makeFurniture(o = {}) { return runSteps(furnitureSteps(o)); }
export async function makeFurnitureAsync(o = {}, yieldFn, slice = 8) { return runStepsAsync(furnitureSteps(o), yieldFn, slice); }
function* furnitureSteps(o = {}) {
  const rng = need(o, 'makeFurniture'), rig = o.rig || null, S = o.scale ?? (rig ? rig.scale : 1), b = makeBuilder(), group = new THREE.Group(); group.name = 'interior-furniture';
  const mat = propMat({ ...o, scale: S }), flames = [], fires = [], cands = [], occ = [], dyn = [], placed = [], runs = [];
  let tris = 0, calls = 0, idx = 0;
  const shared = new Map();
  for (const it of o.items || []) {
    yield;
    const s = S * (it.scale ?? 1), pos = it.position || [0, 0, 0], ry = it.rotation ?? 0, r = rng.fork('item' + idx++);
    const m = new M4().makeRotationY(ry).setPosition(pos[0], pos[1], pos[2]);
    if (it.kind === 'clock' || it.kind === 'globe') {
      const d = (it.kind === 'clock' ? makeClock : makeGlobe)({ ...(it.opts || {}), rig, rng: r, scale: s, material: mat });
      d.object.position.set(pos[0], pos[1], pos[2]); d.object.rotation.y = ry; group.add(d.object); dyn.push(d); tris += d.triangles; calls += d.drawCalls;
      placed.push({ kind: it.kind, position: pos, rotation: ry, size: d.size, top: pos[1] + d.size[1], userData: {} }); continue;
    }
    const gen = PROP_GENERATORS[it.kind]; if (!gen) throw new Error('interior.makeFurniture: unknown prop kind "' + it.kind + '"');
    // bookcases get their books as instances (one extra draw call for all of them) unless opts.books says otherwise
    const inst = it.kind === 'bookshelf' && o.instancedBooks !== false && (!it.opts || it.opts.books === undefined);
    // generators that draw nothing from rng give the same result for the same options: build those once per call
    const key = SHARED_KINDS[it.kind] ? it.kind + '|' + s + '|' + JSON.stringify(it.opts || 0) : null;
    let g = key ? shared.get(key) : null;
    if (!g) { g = gen({ ...(it.opts || {}), ...(inst ? { books: false } : null), rng: r, scale: s }); if (key) shared.set(key, g); }
    yield;
    const ud = g.userData, T = (p) => _p.set(p[0], p[1], p[2]).applyMatrix4(m).toArray();
    b.add(g, { m });
    if (inst) for (const run of ud.runs) runs.push({ ...run, matrix: m });
    if (ud.flames) for (const f of ud.flames) flames.push([...T(f), f[3]]);
    if (ud.fire) fires.push({ position: T(ud.fire.position), width: ud.fire.width, height: ud.fire.height });
    const pre = LIGHT_PRESETS[it.kind];
    if (pre && ud.light && it.light !== false) {
      const k = it.kind === 'chandelier' ? clamp((ud.flames ? ud.flames.length : 8) / 10, 0.5, 1.6) : it.kind === 'candle' ? Math.sqrt(ud.flames.length) : 1;
      const lp = it.kind === 'candle' ? ud.flames[0] : ud.light;
      cands.push({ position: T(it.kind === 'candle' ? [lp[0], lp[1] + lp[3], lp[2]] : lp), color: pre.color, intensity: pre.intensity * k, range: pre.range * s * (it.kind === 'chandelier' ? k : 1), flicker: pre.flicker, priority: pre.priority, ...(it.light || {}) });
    } else if (it.kind === 'candle' && ud.flames && it.light !== false) { const f = ud.flames[0], pc = LIGHT_PRESETS.candle; cands.push({ position: T([f[0], f[1] + f[3], f[2]]), ...pc, intensity: pc.intensity * Math.sqrt(ud.flames.length), range: pc.range * s, ...(it.light || {}) }); }
    const sz = ud.size || [0, 0, 0], foot = Math.max(sz[0], sz[2]);
    if (it.occluder !== false && foot > 0.7 * S && sz[1] > 0.3 * S && it.kind !== 'chandelier' && it.kind !== 'staircase' && !(it.opts && it.opts.kind === 'pendant')) occ.push({ position: [pos[0], pos[1] + Math.min(sz[1] * 0.3, foot * 0.3), pos[2]], radius: foot * 0.5, w: foot * (it.occluder === true ? 10 : 1) });
    placed.push({ kind: it.kind, position: pos, rotation: ry, size: sz, top: pos[1] + (ud.top ?? sz[1]), userData: ud });
  }
  yield;
  yield* b.sortByDepthSteps(); yield;
  const geos = o.chunks > 1 ? yield* b.buildChunkSteps(o.chunks, o.length) : [b.build()]; yield;
  for (const g of geos) { const mesh = new THREE.Mesh(g, mat); mesh.name = 'furniture'; group.add(mesh); calls++; }
  tris += b.triangles;
  let books = null;
  if (runs.length) { books = makeBooks({ rig, rng: rng.fork('books'), runs, material: mat, colors: o.bookColors }); group.add(books.object); calls++; tris += books.triangles; }
  let fl = null;
  if (flames.length || fires.length) { fl = makeFlames({ flames, fires, rng: rng.fork('flames'), gain: o.flameGain }); group.add(fl.object); calls++; tris += fl.triangles; }
  const lights = [];
  if (rig && o.lights !== false) { cands.sort((a, c) => c.priority - a.priority); for (const c of cands.slice(0, o.maxLights ?? 8)) { const l = rig.addLight(c); if (!l) break; lights.push(l); } }
  if (rig && o.occluders !== false) { occ.sort((a, c) => c.w - a.w); for (const c of occ.slice(0, o.maxOccluders ?? 8)) if (!rig.addOccluder(c.position, c.radius)) break; }
  return { object: group, triangles: tris, drawCalls: calls, items: placed, flames: fl, books, lights, material: mat,
    update(dt, time, camera) { if (fl) fl.update(dt, time, camera); for (const d of dyn) d.update(dt, time, camera); } };
}
// One prop as a ready-made object: makeProp('piano', { rig, rng, scale, ...generator options }). Same return value as makeFurniture.
export function makeProp(kind, o = {}) {
  return makeFurniture({ rig: o.rig, rng: o.rng || makeRng(1), scale: o.scale, material: o.material, lights: o.lights, occluders: o.occluders ?? false, items: [{ kind, opts: o }] });
}

// ---------------------------------------------------------------------------------------------
// furnishRoom: a complete, style-appropriate arrangement for a room made by makeRoom
// ---------------------------------------------------------------------------------------------
const ROOM_ZONES = { 1: ['living'], 2: ['dining', 'living'], 3: ['dining', 'living', 'music'], 4: ['kitchen', 'living', 'music', 'bedroom'] };
const ZONE_CYCLE = ['kitchen', 'living', 'music', 'bedroom', 'dining', 'living'];
// o: { rng, zones:[...] ('room' style: one of 'living','dining','kitchen','music','bedroom' per bay), density 0..1, curtains, pictures, rugs,
//      rugColors, curtainColor, attach:true (adds the result to room.object) }
// -> { object, update(dt,time,camera), triangles, drawCalls, items, furniture, pictures, rugs, curtains }
export function furnishRoom(room, o = {}) {
  const rng = need(o, 'furnishRoom'), S = room.scale, rig = room.rig, sz = room.size, X = sz.width / S / 2, Lm = sz.length / S, Hm = sz.wallHeight / S, top = sz.height / S, bm = sz.bay / S, bays = sz.bays;
  const w = room.sunSide, d = -w, dens = o.density ?? 1, items = [], pics = [], rugs = [];
  const I = (kind, x, y, z, ry = 0, opts, extra) => { items.push({ kind, position: [x * S, y * S, z * S], rotation: ry, opts, ...(extra || {}) }); };
  const face = (dx, dz) => Math.atan2(dx, dz);
  const pic = (x, y, z, nx, nz, pw, ph, extra) => pics.push({ position: [x * S, y * S, z * S], normal: [nx, 0, nz], width: pw * S, height: ph * S, ...(extra || {}) });
  const rug = (x, z, rw, rl, rot = 0) => rugs.push({ position: [x * S, 0, z * S], width: rw * S, length: rl * S, rotation: rot });
  let curtainOpts = null, chunks = 1;
  const st = room.style;
  if (st === 'room') {
    const zones = o.zones || ROOM_ZONES[bays] || Array.from({ length: bays }, (_, i) => ZONE_CYCLE[i % ZONE_CYCLE.length]);
    zones.forEach((zone, k) => {
      const zc = -(k + 0.5) * bm;
      if (zone === 'living') {
        I('fireplace', d * (X - 0.22), 0, zc, face(w, 0), { breast: Hm - 1.34 });
        pic(d * (X - 0.325), 2.18, zc, w, 0, 1.15, 0.8, { frame: 'gilt' });
        I('clock', d * (X - 0.5), 1.34, zc, face(w, 0), { kind: 'mantel' });
        for (const s of [-1, 1]) I('candle', d * (X - 0.5), 1.34, zc + s * 0.62, 0, { holder: 'stick' });
        rug(d * 0.75, zc, 2.3, 2.9);
        I('sofa', w * 0.95, 0, zc, face(d, 0), {}, { occluder: true });
        I('chair', d * 1.0, 0, zc + 1.55, face(w * 0.25, -1), { style: 'arm', seatColor: rng.pick(['#7a2f3a', '#b8782c', '#33506a']) });
        I('table', d * 0.55, 0, zc - 0.1, PI / 2, { width: 1.1, depth: 0.6, height: 0.44, legs: 'square' });
        I('teaSet', d * 0.55, 0.44, zc + 0.1, 0.3); I('bookStack', d * 0.6, 0.44, zc - 0.45, 0.4, { count: 3 });
        I('toyBlocks', d * 1.2, 0.012, zc - 0.95, rng.range(0, 6)); I('toyTrain', d * 0.1, 0.012, zc - 1.25, rng.range(-0.5, 0.5));
        I('lamp', w * 1.25, 0, zc - 1.4, 0, { kind: 'floor' });
        I('chandelier', d * 0.4, Hm, zc, 0, { arms: 6, tiers: 1, radius: 0.42, drop: 0.3 });
      } else if (zone === 'dining' || zone === 'kitchen') {
        const tx = w * 1.15;
        I('table', tx, 0, zc, 0, { round: true, width: 1.25, color: WOOD.oak }, { occluder: true });
        for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 0.6; I('chair', tx + Math.cos(a) * 0.95, 0, zc + Math.sin(a) * 0.95, face(-Math.cos(a), -Math.sin(a)) + rng.range(-0.15, 0.15), { style: 'dining', seatColor: '#b8892e' }); }
        I('fruitBowl', tx - 0.05, 0.76, zc - 0.25, 0); I('vase', tx + 0.3, 0.76, zc + 0.2, 0, { height: 0.26 });
        if (zone === 'kitchen') { I('teapot', tx - 0.3, 0.76, zc + 0.28, 0.8); for (let i = 0; i < 2; i++) { const a = i * TAU / 4 + 0.6 + PI; I('plate', tx + Math.cos(a) * 0.42, 0.76, zc + Math.sin(a) * 0.42); I('cup', tx + Math.cos(a + 0.5) * 0.36, 0.76, zc + Math.sin(a + 0.5) * 0.36, a); } }
        else I('candle', tx - 0.3, 0.76, zc + 0.25, 0.4, { holder: 'candelabra' });
        I('lamp', tx, Hm, zc, 0, { kind: 'pendant', cord: 0.85, shadeColor: zone === 'kitchen' ? '#2c5a68' : '#1f4a3a' });
        if (zone === 'kitchen') { I('kitchenCounter', d * (X - 0.36), 0, zc, face(w, 0), { width: Math.min(2.9, bm - 0.3) }); I('clock', d * (X - 0.01), 2.5, zc - 0.8, face(w, 0), { kind: 'wall' }); }
        else { for (const s of [-1, 1]) I('bookshelf', d * (X - 0.17), 0, zc + s * 0.53, face(w, 0)); I('plant', d * (X - 0.4), 0, zc + 1.38, 0, { kind: 'fig' }); I('vase', d * (X - 0.17), 2.05, zc - 0.5, 0, { height: 0.24, flowers: 0 }); }
      } else if (zone === 'music') {
        I('piano', w * 0.75, 0, zc - 0.25, face(d * 0.45, 1), {}, { occluder: true });
        I('clock', d * (X - 0.19), 0, zc + 1.05, face(w, 0), { kind: 'longcase' });
        I('bookshelf', d * (X - 0.17), 0, zc - 0.25, face(w, 0)); I('plant', d * (X - 0.45), 0, zc - 1.2, 0, { kind: 'ficus' });
        I('table', d * 1.75, 0, zc + 0.35, 0, { round: true, width: 0.6, height: 0.62 }); I('globe', d * 1.75, 0.62, zc + 0.35, 0.5);
        I('plant', w * (X - 0.5), 0, zc - 1.45, 0, { kind: 'palm' });
        pic(d * (X - 0.012), 1.95, zc + 0.3, w, 0, 0.55, 0.7);
      } else if (zone === 'bedroom') {
        I('bed', d * (X - 1.1), 0, zc, face(w, 0), { color: rng.pick(['#3d5a80', '#7a3a48', '#3d6a5a']) }, { occluder: true });
        for (const s of [-1, 1]) { I('table', d * (X - 0.3), 0, zc + s * 1.08, 0, { width: 0.45, depth: 0.42, height: 0.56, legs: 'square', drawers: 1 }); if (s > 0) I('lamp', d * (X - 0.3), 0.56, zc + s * 1.08, 0, { kind: 'table' }); else { I('bookStack', d * (X - 0.32), 0.56, zc + s * 1.08, 0.3, { count: 3 }); I('candle', d * (X - 0.22), 0.56, zc + s * 1.2, 0, { holder: 'plate', count: 1 }); } }
        rug(d * (X - 2.75), zc, 1.3, 2.1);
        I('rockingHorse', w * 0.9, 0, zc + 0.5, face(-0.6, 0.8) - PI / 2); I('toyBlocks', d * (X - 2.7), 0.02, zc - 0.5, 1); I('toyTrain', d * (X - 2.8), 0.02, zc + 0.6, 2.2);
        pic(d * (X - 0.012), 1.9, zc, w, 0, 1.1, 0.75);
        I('plant', w * (X - 0.5), 0, zc + 1.4, 0, { kind: 'fern' });
      }
      if (k > 0 && zone !== 'living') pic(d * (X - 0.012), 1.85, zc + bm / 2, w, 0, 0.6, 0.8);
    });
    for (const s of [-1, 1]) pic(s * X * 0.62, 1.8, -Lm + 0.012, 0, 1, 0.9, 1.15);
    I('plant', w * (X - 0.45), 0, -Lm + 0.45, 0, { kind: 'snake' });
    curtainOpts = {};
  } else if (st === 'gallery') {
    for (let k = 0; k < bays; k++) {
      const zc = -(k + 0.5) * bm, big = k % 2 === 0;
      pic(d * (X - 0.012), big ? 4.5 : 4.9, zc, w, 0, big ? 3.9 : 2.5, big ? 2.7 : 3.3, { frame: 'gilt', frameWidth: 0.11 });
      if (!big) for (const s of [-1, 1]) pic(d * (X - 0.012), 4.4, zc + s * 2.15, w, 0, 1.0, 1.35, { frameWidth: 0.09 });
      if (k > 0) pic(w * (X - 0.012), 4.6, zc + bm / 2, d, 0, 1.25, 2.0, { frameWidth: 0.09 });
      const kind = k % 4;
      if (kind === 0) { I('table', d * (X - 0.4), 0, zc, PI / 2, { width: 2.0, depth: 0.55, height: 0.88, drawers: 3, color: WOOD.mahogany }, { scale: 1.25 }); I('vase', d * (X - 0.45), 1.1, zc, 0, { height: 0.5 }, { scale: 1.3 }); for (const s of [-1, 1]) I('candle', d * (X - 0.45), 1.1, zc + s * 0.85, 0, { holder: 'candelabra' }, { scale: 1.5, light: s > 0 && k % 8 === 0 ? {} : false }); }
      else if (kind === 1) I('sofa', d * (X - 0.75), 0, zc, face(w, 0), { width: 2.4, color: '#7a2f3a', pillowColors: ['#c9a148', '#e8dcc0'] }, { scale: 1.3 });
      else if (kind === 2) { for (const s of [-1, 1]) I('chair', d * (X - 0.8), 0, zc + s * 1.1, face(w, -s * 0.3), { style: 'arm', seatColor: '#2f5a4a' }, { scale: 1.3 }); I('table', d * (X - 0.7), 0, zc, 0, { round: true, width: 0.7, height: 0.6 }, { scale: 1.3 }); I('globe', d * (X - 0.7), 0.78, zc, 1, { radius: 0.22 }, { scale: 1.6 }); }
      else I('clock', d * (X - 0.33), 0, zc, face(w, 0), { kind: 'longcase' }, { scale: 1.7 });
      I('plant', d * (X - 0.7), 0, zc + bm / 2 - 0.2, 0, { kind: k % 2 ? 'palm' : 'fig' }, { scale: 1.7 });
      if (k % 2 === 1 && dens > 0.3) I('chandelier', 0, top - 0.25, zc, k, { arms: 10, tiers: 2, radius: 0.85, drop: 1.5 }, { scale: 1.75 });
      if (k % 2 === 0) rug(0, zc - bm / 2 + (k === bays - 1 ? bm / 2 : 0), 3.0, Math.min(10.5, bm * 1.6));
    }
    curtainOpts = { cover: 0.34, segments: [14, 10] }; chunks = Math.min(4, bays);
  } else if (st === 'library') {
    const t1 = room.features.tiers ? room.features.tiers.t1 / S : 5, bal = room.features.tiers ? room.features.tiers.balcony / S : 1.55;
    for (let k = 0; k < bays; k++) {
      const zc = -(k + 0.5) * bm;
      for (const s of [-1, 1]) {
        const tx = s * 3.3;
        I('table', tx, 0, zc, PI / 2, { width: 4.2, depth: 1.25, height: 0.78, legs: 'square', color: WOOD.oak }, { occluder: k < 2 });
        for (const e of [-1, 1]) I('lamp', tx, 0.78, zc + e * 1.1, s > 0 ? PI / 2 : -PI / 2, { kind: 'desk' }, { scale: 1.5, light: e > 0 && s === (k % 2 ? 1 : -1) && k % 2 === 0 ? { priority: 7, intensity: 4, range: 6 * S } : false });
        for (const q of [-1, 1]) for (const e of [-1, 1]) if (rng.chance(0.6 * dens)) I('chair', tx + q * 0.95, 0, zc + e * 1.15 + rng.range(-0.1, 0.1), face(-q, 0) + rng.range(-0.25, 0.25), { style: 'dining', seatColor: '#2f4a3a', color: WOOD.oak }, { scale: 1.1 });
        I('bookStack', tx + rng.range(-0.2, 0.2), 0.78, zc + rng.range(-0.5, 0.5), rng.range(0, 3), { count: rng.int(3, 7) }, { scale: 1.4 });
        if (rng.chance(0.6)) I('bookStack', tx + rng.range(-0.3, 0.3), 0.78, zc + rng.range(-1.8, -1.4), rng.range(0, 3), { count: rng.int(2, 5) }, { scale: 1.4 });
      }
      if (k % 3 === 1) I('staircase', (k % 2 ? 1 : -1) * (X - bal - 1.25), 0, zc + bm * 0.25, 0, { kind: 'spiral', height: t1 + 0.24, width: 1.15, turns: 1.6 });
      if (k % 2 === 0) rug(0, zc - bm / 2, 2.6, Math.min(10, bm * 1.5));
      if (k % 3 === 1 && dens > 0.3) I('chandelier', 0, top - 0.3, zc - bm / 2, k, { arms: 12, tiers: 2, radius: 0.9, drop: 2.2, crystals: false }, { scale: 2.6 });
    }
    for (const s of [-1, 1]) I('globe', s * 1.85, 0, -bm, s, { radius: 0.5 }, { scale: 1.6 });
    chunks = Math.min(4, bays);
  } else if (st === 'greenhouse') {
    const beds = room.features.beds;
    for (let k = 0; k < bays; k++) {
      const zc = -(k + 0.5) * bm;
      if (beds) for (const s of [-1, 1]) {
        const bx = beds.x / S, bw = beds.width / S, bh = beds.height / S, n = Math.round((k % 2 ? 3 : 2) * dens);
        for (let i = 0; i < n; i++) {
          const kind = rng.pick(['palm', 'palm', 'fern', 'fern', 'fig', 'ficus', 'snake']), sc = { palm: rng.range(2.0, 3.2), fern: rng.range(2.0, 3.0), fig: rng.range(1.6, 2.4), ficus: rng.range(1.6, 2.4), snake: rng.range(1.6, 2.3) }[kind];
          const ph = { palm: 0.34, fern: 0.24, fig: 0.36, ficus: 0.36, snake: 0.2 }[kind] * sc * 0.93;
          I('plant', s * (bx + rng.range(-0.3, 0.3) * bw), bh - ph + 0.05, zc + (i - (n - 1) / 2) * bm / n + rng.range(-0.5, 0.5), rng.range(0, 6), { kind, potColor: '#241810' }, { scale: sc, occluder: false });
        }
      }
      const px = (k % 2 ? 1 : -1) * 2.9;
      if (k % 3 === 1) { I('table', -px, 0, zc, 0, { round: true, width: 1.1 }, { scale: 1.2 }); I('teaSet', -px, 0.76 * 1.2, zc, 0.6, {}, { scale: 1.2 }); for (let i = 0; i < 2; i++) { const a = i * PI + 0.5; I('chair', -px + Math.cos(a) * 1.0, 0, zc + Math.sin(a) * 1.0, face(-Math.cos(a), -Math.sin(a)), { style: 'dining', color: '#e4ebe0', seatColor: '#5f8a6a' }, { scale: 1.2 }); } }
      else I('plant', px, 0, zc + rng.range(-1, 1), 0, { kind: rng.pick(['fern', 'snake', 'fig']), potColor: rng.pick(['#b5653a', '#e6dfd0', '#2f4f5e']) }, { scale: rng.range(1.2, 1.8) });
      if (k % 3 === 0) I('vase', px * 0.85, 0, zc - 2, 0, { height: 0.6, flowers: 8 }, { scale: 1.6 });
      if (k % 2 === 1) I('lamp', 0, Hm + 0.15, zc, 0, { kind: 'pendant', cord: 1.2, shadeColor: '#3f6e58', glow: 0.5 }, { scale: 2.2, light: k % 4 === 1 ? {} : false });
    }
    chunks = Math.min(5, bays);
  } else if (st === 'carriage') {
    const sx = X - 0.57;
    for (let k = 0; k <= bays; k++) {
      const zb = -k * bm;
      for (const s of [-1, 1]) {
        const col2 = k % 4 < 2 ? '#6a1f2a' : '#274a3c';
        if (k < bays) { I('trainSeat', s * sx, 0, zb - 0.31, PI, { color: col2, width: 0.92 }); if (rng.chance(0.3 * dens)) I('suitcase', s * sx + rng.range(-0.15, 0.15), 0.5, zb - 0.36, PI + rng.range(-0.3, 0.3), {}); }
        if (k > 0) I('trainSeat', s * sx, 0, zb + 0.31, 0, { color: col2, width: 0.92 });
        if (k < bays) { const zc = zb - bm / 2, tx = s * (X - 0.34);
          I('table', tx, 0, zc, 0, { width: 0.52, depth: 0.5, height: 0.72, legs: 'square', color: WOOD.mahogany });
          const r = rng();
          if ((k + (s > 0 ? 1 : 0)) % 2 === 0) I('lamp', tx + s * 0.08, 0.72, zc, 0, { kind: 'table', shadeColor: '#f0a890', color: '#c9a148' }, { scale: 0.62, light: k % 4 === 0 ? { intensity: 3, range: 3 * S } : false });
          else if (r < 0.5) { I('cup', tx - s * 0.05, 0.72, zc + 0.1, r * 9); I('plate', tx - s * 0.02, 0.72, zc - 0.1, 0, { radius: 0.09 }); }
          else if (r < 0.75) I('vase', tx, 0.72, zc, 0, { height: 0.16, flowers: 5 }); else I('bookStack', tx, 0.72, zc, r * 5, { count: 2 }); }
      }
    }
    for (let i = 0; i < Math.ceil(Lm / 7); i++) { const n = Math.ceil(Lm / 7), l = Lm / n; rug(0, -(i + 0.5) * l, 0.74, l - 0.25); }
    curtainOpts = { length: 'sill', segments: [10, 6], cover: 0.3, fullness: 0.7 }; chunks = Math.min(5, bays);
  } else if (st === 'nave') {
    const ps = 1.2, rowGap = 1.3, z0 = -5, z1 = -Lm + 15, pw = 4.3;
    for (let z = z0; z > z1; z -= rowGap) for (const s of [-1, 1]) I('pew', s * (1.75 + pw / 2), 0, z, PI, { width: pw / ps }, { scale: ps, occluder: false });
    const nr = Math.ceil((z0 - z1 + 6) / 9); for (let i = 0; i < nr; i++) rug(0, z0 + 3 - (i + 0.5) * 9, 2.5, 8.6);
    for (let k = 1; k < bays; k++) {
      const zb = -k * bm;
      for (const s of [-1, 1]) I('candle', s * (X - 1.35), 0, zb, 0, { holder: 'candelabra', count: 3, height: 0.2 }, { scale: 5.2, light: false });
      if (dens > 0.3) I('chandelier', 0, top - 0.4, zb + bm / 2, k, { arms: 10, tiers: 1, radius: 0.95, drop: 3.6, crystals: false }, { scale: 3.3 });
    }
    for (const s of [-1, 1]) I('organ', s * (X + 0.75), 0, -Lm + 5.5, -s * 0.32, { width: 3.4, height: 5.8 }, { scale: 2.0, occluder: false });
    chunks = Math.min(4, bays);
  }
  const group = new THREE.Group(); group.name = 'interior-furnishing';
  const f = makeFurniture({ rig, rng: rng.fork('furniture'), scale: S, items, chunks, length: sz.length, lights: o.lights, occluders: o.occluders, maxLights: o.maxLights ?? 6, maxOccluders: o.maxOccluders ?? 4,
    sway: o.sway ?? (S < 3 ? { amp: 0.05, freq: 0.9 } : undefined) }); group.add(f.object); // leaves need a bigger swing in the halls, whose plants are scaled up
  let tris = f.triangles, calls = f.drawCalls, pp = null, rr = null, cc = null;
  if (pics.length && o.pictures !== false) { pp = makePictures({ rig, rng: rng.fork('pictures'), scale: S, pictures: pics, material: f.material }); group.add(pp.object); tris += pp.triangles; calls += pp.drawCalls; }
  if (rugs.length && o.rugs !== false) { rr = makeRugs({ rig, rng: rng.fork('rugs'), scale: S, rugs, colors: o.rugColors }); group.add(rr.object); tris += rr.triangles; calls += rr.drawCalls; }
  if (curtainOpts && o.curtains !== false) { cc = makeCurtains({ rig, rng: rng.fork('curtains'), scale: S, color: o.curtainColor, ...curtainOpts }); group.add(cc.object); tris += cc.triangles; calls += cc.drawCalls; }
  if (o.attach !== false) room.object.add(group);
  return { object: group, triangles: tris, drawCalls: calls, items: f.items, furniture: f, pictures: pp, rugs: rr, curtains: cc, update(dt, time, camera) { f.update(dt, time, camera); } };
}
