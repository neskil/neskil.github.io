// bridges-of-marigold, the city: a small accumulator of flat-faced triangles for everything that is not an instanced
// house. Each vertex carries position, normal, colour (linear) and aux = (kind of surface, a number for that kind,
// and for a sheet of cut paper its own two coordinates): the kinds are listed at the stone material (city-mat). Winding is counter-clockwise seen from outside.
export function makeGeo(THREE) {
  // (the vertices are kept in buffers of 32-bit floats that double when they are full: nothing for the page's
  // memory sweep to walk, and nothing to convert when the geometry is made)
  let cap = 4096, nv = 0, P = new Float32Array(cap * 3), N = new Float32Array(cap * 3), C = new Float32Array(cap * 3), A = new Float32Array(cap * 4);
  const more = (a, k) => { const b = new Float32Array(cap * k); b.set(a); return b; };
  const grow = () => { cap *= 2; P = more(P, 3); N = more(N, 3); C = more(C, 3); A = more(A, 4); };
  let col = [1, 1, 1], aux = [0, 0], bob = 0;
  const G = {
    triangles: 0,
    col(c) { col = c; return G; },
    aux(kind, v = 0) { aux = [kind, v]; return G; },
    // what is laid from here on rides the water: it rises and falls a little, by this phase (0: it stands still)
    bob(phase) { bob = phase; return G; },
    tri(a, b, c) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz);
      if (l < 1e-9) return G;
      nx /= l; ny /= l; nz /= l;
      if (nv + 3 > cap) grow();
      for (const p of [a, b, c]) {
        const i = nv * 3, j = nv * 4; nv++;
        P[i] = p[0]; P[i + 1] = p[1]; P[i + 2] = p[2]; N[i] = nx; N[i + 1] = ny; N[i + 2] = nz; C[i] = col[0]; C[i + 1] = col[1]; C[i + 2] = col[2];
        A[j] = aux[0]; A[j + 1] = aux[1]; A[j + 2] = bob; A[j + 3] = 0;
      }
      G.triangles++; return G;
    },
    quad(a, b, c, d) { G.tri(a, b, c); return G.tri(a, c, d); },
    // a triangle whose corners carry their own numbers (v: three of them) in place of the one set by aux()
    tri3(a, b, c, v) { const n0 = nv * 4; G.tri(a, b, c); if (nv * 4 > n0) { A[n0 + 1] = v[0]; A[n0 + 5] = v[1]; A[n0 + 9] = v[2]; } return G; },
    // a sheet with its own coordinates: a at (0, 0), b at (1, 0), c at (1, 1), d at (0, 1); `back` lays the other face
    // (its second coordinate is stored as 2 - t, by which the paper's shader knows the back and swings it the same way)
    sheet(a, b, c, d, back = false) {
      const n0 = nv * 4, uv = back ? [[1, 2], [0, 2], [0, 1], [1, 2], [0, 1], [1, 1]] : [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]];
      if (back) G.quad(b, a, d, c); else G.quad(a, b, c, d);
      if (nv * 4 === n0 + 24) for (let i = 0; i < 6; i++) { A[n0 + i * 4 + 2] = uv[i][0]; A[n0 + i * 4 + 3] = uv[i][1]; }
      return G;
    },
    // a block: middle of its base at (x, y, z), w along its own x, d along its own z, turned by yaw about y
    box(x, y, z, w, h, d, yaw = 0, bottom = true) {
      const s = Math.sin(yaw), c = Math.cos(yaw), hw = w / 2, hd = d / 2;
      const at = (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
      const p = [at(-hw, 0, -hd), at(hw, 0, -hd), at(hw, 0, hd), at(-hw, 0, hd), at(-hw, h, -hd), at(hw, h, -hd), at(hw, h, hd), at(-hw, h, hd)];
      G.quad(p[3], p[2], p[6], p[7]); G.quad(p[1], p[0], p[4], p[5]); G.quad(p[2], p[1], p[5], p[6]); G.quad(p[0], p[3], p[7], p[4]);
      G.quad(p[7], p[6], p[5], p[4]); if (bottom) G.quad(p[0], p[1], p[2], p[3]);
      return G;
    },
    // a ring of n flat sides between two heights (radius r0 at y0, r1 at y1), turned by rot; top and bottom lids on request
    prism(x, z, y0, y1, r0, r1, n, rot = 0, top = true, bottom = false) {
      const at = (i, r, y) => { const a = rot + i * Math.PI * 2 / n; return [x + r * Math.sin(a), y, z + r * Math.cos(a)]; };
      for (let i = 0; i < n; i++) {
        G.quad(at(i, r0, y0), at(i + 1, r0, y0), at(i + 1, r1, y1), at(i, r1, y1));
        if (top) G.tri([x, y1, z], at(i, r1, y1), at(i + 1, r1, y1));
        if (bottom) G.tri([x, y0, z], at(i + 1, r0, y0), at(i, r0, y0));
      }
      return G;
    },
    // a beam of square section t between two points (for posts, rails, poles, jibs)
    beam(a, b, t) {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-6) return G;
      const ax = [dx / L, dy / L, dz / L], up = Math.abs(ax[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
      let s = [ax[1] * up[2] - ax[2] * up[1], ax[2] * up[0] - ax[0] * up[2], ax[0] * up[1] - ax[1] * up[0]]; const sl = Math.hypot(s[0], s[1], s[2]); s = s.map((v) => v / sl * t / 2);
      const u = [ax[1] * s[2] - ax[2] * s[1], ax[2] * s[0] - ax[0] * s[2], ax[0] * s[1] - ax[1] * s[0]];
      const c = (p, i, j) => [p[0] + i * s[0] + j * u[0], p[1] + i * s[1] + j * u[1], p[2] + i * s[2] + j * u[2]];
      const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (let i = 0; i < 4; i++) { const m = q[i], n = q[(i + 1) % 4]; G.quad(c(a, m[0], m[1]), c(a, n[0], n[1]), c(b, n[0], n[1]), c(b, m[0], m[1])); }
      G.quad(c(b, -1, -1), c(b, 1, -1), c(b, 1, 1), c(b, -1, 1)); G.quad(c(a, -1, 1), c(a, 1, 1), c(a, 1, -1), c(a, -1, -1));
      return G;
    },
    // every vertex so far, for the count of what stands where: f(x, y, z)
    each(f) { for (let i = 0; i < nv * 3; i += 3) f(P[i], P[i + 1], P[i + 2]); },
    // the same geometry made an attribute a step, for the large accumulators: pause() is awaited between them
    async buildIn(pause) {
      const g = new THREE.BufferGeometry();
      for (const [name, arr, size] of [['position', P, 3], ['normal', N, 3], ['color', C, 3], ['aux', A, 4]]) { g.setAttribute(name, new THREE.BufferAttribute(arr.slice(0, nv * size), size)); await pause(); }
      g.computeBoundingSphere(); await pause();
      return g;
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P.slice(0, nv * 3), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(N.slice(0, nv * 3), 3));
      g.setAttribute('color', new THREE.BufferAttribute(C.slice(0, nv * 3), 3));
      g.setAttribute('aux', new THREE.BufferAttribute(A.slice(0, nv * 4), 4));
      g.computeBoundingSphere();
      return g;
    },
  };
  return G;
}
