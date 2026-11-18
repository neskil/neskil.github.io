// valley-inside-the-works, THE SHED: a small mesh builder. Flat polygons, boxes and turned shapes are gathered into one
// geometry. A vertex carries position, normal, colour (a tint) and aP = (u, v, kind, w): pattern coordinates in metres,
// the kind of surface inside its material, and one free number. A frame (an origin and three unit axes, which may
// mirror) lets one piece of drawing serve both long walls and the head wall.
export function makeMesh() {
  const P = [], N = [], A = [], C = [], I = [];
  const st = { kind: 0, w: 0, col: [1, 1, 1], O: [0, 0, 0], E: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], flip: false };
  const world = (p) => [
    st.O[0] + p[0] * st.E[0][0] + p[1] * st.E[1][0] + p[2] * st.E[2][0],
    st.O[1] + p[0] * st.E[0][1] + p[1] * st.E[1][1] + p[2] * st.E[2][1],
    st.O[2] + p[0] * st.E[0][2] + p[1] * st.E[1][2] + p[2] * st.E[2][2]];
  const dir = (n) => [
    n[0] * st.E[0][0] + n[1] * st.E[1][0] + n[2] * st.E[2][0],
    n[0] * st.E[0][1] + n[1] * st.E[1][1] + n[2] * st.E[2][1],
    n[0] * st.E[0][2] + n[1] * st.E[1][2] + n[2] * st.E[2][2]];
  const vert = (p, n, u, v, w) => {
    const q = world(p), d = dir(n);
    P.push(q[0], q[1], q[2]); N.push(d[0], d[1], d[2]); A.push(u, v, st.kind, w === undefined ? st.w : w); C.push(st.col[0], st.col[1], st.col[2]);
    return P.length / 3 - 1;
  };
  const tri = (a, b, c) => { if (st.flip) I.push(a, c, b); else I.push(a, b, c); };
  const m = {
    st, world,
    set(o) { Object.assign(st, o); return m; },
    // the frame: local (x, y, z) stands at O + x E1 + y E2 + z E3 (unit axes at right angles; a mirror is allowed)
    frame(O, E1, E2, E3) {
      if (!O) { st.O = [0, 0, 0]; st.E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; st.flip = false; return m; }
      st.O = O; st.E = [E1, E2, E3];
      const det = E1[0] * (E2[1] * E3[2] - E2[2] * E3[1]) - E1[1] * (E2[0] * E3[2] - E2[2] * E3[0]) + E1[2] * (E2[0] * E3[1] - E2[1] * E3[0]);
      st.flip = det < 0; return m;
    },
    // a flat polygon, counter-clockwise seen from outside (in local space); uv per corner or, left out, by the face's lie
    poly(pts, uv) {
      const a = pts[0], c = pts[1], d = pts[2];
      let nx = (c[1] - a[1]) * (d[2] - a[2]) - (c[2] - a[2]) * (d[1] - a[1]);
      let ny = (c[2] - a[2]) * (d[0] - a[0]) - (c[0] - a[0]) * (d[2] - a[2]);
      let nz = (c[0] - a[0]) * (d[1] - a[1]) - (c[1] - a[1]) * (d[0] - a[0]);
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz), ids = [];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        let u, v, w;
        if (uv) { u = uv[i][0]; v = uv[i][1]; w = uv[i].length > 2 ? uv[i][2] : undefined; }
        else if (ay > 0.7) { u = p[0]; v = p[2]; } else if (ax > az) { u = p[2]; v = p[1]; } else { u = p[0]; v = p[1]; }
        ids.push(vert(p, [nx, ny, nz], u, v, w));
      }
      for (let i = 1; i < pts.length - 1; i++) tri(ids[0], ids[i], ids[i + 1]);
      return m;
    },
    quad(p0, p1, p2, p3, uv) { return m.poly([p0, p1, p2, p3], uv); },
    // a box; skip = letters of the faces left out: l (-x) r (+x) d (-y) u (+y) f (+z) k (-z)
    box(x0, x1, y0, y1, z0, z1, skip = '') {
      if (!skip.includes('f')) m.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
      if (!skip.includes('k')) m.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
      if (!skip.includes('r')) m.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
      if (!skip.includes('l')) m.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
      if (!skip.includes('u')) m.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]);
      if (!skip.includes('d')) m.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
      return m;
    },
    // a bar between two points, w wide (across, along `side`) and h deep; four long faces, no ends; uv = (along, across)
    // and each face's own width goes into aP.w (the iron's rivet rows stand by it)
    bar(a, b, w, h, side = [1, 0, 0]) {
      const ax = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(ax[0], ax[1], ax[2]) || 1;
      const t = [ax[0] / l, ax[1] / l, ax[2] / l], s = side;
      const up = [t[1] * s[2] - t[2] * s[1], t[2] * s[0] - t[0] * s[2], t[0] * s[1] - t[1] * s[0]];
      const c = (p, i, j) => [p[0] + s[0] * i * w / 2 + up[0] * j * h / 2, p[1] + s[1] * i * w / 2 + up[1] * j * h / 2, p[2] + s[2] * i * w / 2 + up[2] * j * h / 2];
      const f = (i0, j0, i1, j1, wd) => m.quad(c(a, i0, j0), c(a, i1, j1), c(b, i1, j1), c(b, i0, j0), [[0, 0, wd], [0, wd, wd], [l, wd, wd], [l, 0, wd]]);
      f(1, -1, 1, 1, h); f(1, 1, -1, 1, w); f(-1, 1, -1, -1, h); f(-1, -1, 1, -1, w);
      return m;
    },
    // a turned shape about local axis k (0 x, 1 y, 2 z) through c: profile = [[radius, height], ...] going up the axis;
    // (a third number in a profile point is that ring's own w); flat along each piece of the profile, smooth round it. u runs 0..uPer round, v is the height. a0..a1 for a part turn.
    // o.lift: where the material raises each ring by its own w times a height (the columns' aTall), the normals are
    // worked out for the form so raised by o.lift (the stored heights of such a piece may run down; raised, they run up).
    lathe(c, k, profile, seg, o = {}) {
      const p = (k + 1) % 3, q = (k + 2) % 3, a0 = o.a0 === undefined ? 0 : o.a0, a1 = o.a1 === undefined ? Math.PI * 2 : o.a1, uPer = o.uPer || 1, lift = o.lift || 0;
      const at = (r, h, a) => { const v = [0, 0, 0]; v[p] = c[p] + r * Math.cos(a); v[q] = c[q] + r * Math.sin(a); v[k] = c[k] + h; return v; };
      for (let i = 0; i + 1 < profile.length; i++) {
        const [r0, h0] = profile[i], [r1, h1] = profile[i + 1], dr = r1 - r0, dh = h1 - h0 + ((profile[i + 1][2] || 0) - (profile[i][2] || 0)) * lift, l = Math.hypot(dr, dh) || 1;
        const nr = dh / l, nk = -dr / l, row = [];
        for (let j = 0; j <= seg; j++) {
          const a = a0 + (a1 - a0) * j / seg, n = [0, 0, 0];
          n[p] = nr * Math.cos(a); n[q] = nr * Math.sin(a); n[k] = nk;
          const u = j / seg * uPer;
          row.push([vert(at(r0, h0, a), n, u, h0, profile[i][2]), vert(at(r1, h1, a), n, u, h1, profile[i + 1][2])]);
        }
        for (let j = 0; j < seg; j++) { tri(row[j][0], row[j + 1][0], row[j + 1][1]); tri(row[j][0], row[j + 1][1], row[j][1]); }
      }
      const cap = (r, h, up) => {
        const pts = [];
        for (let j = 0; j < seg; j++) { const a = a0 + (a1 - a0) * (up ? j : seg - j) / seg; pts.push(at(r, h, a)); }
        m.poly(pts);
      };
      if (o.cap === 'top' || o.cap === 'both') cap(profile[profile.length - 1][0], profile[profile.length - 1][1], true);
      if (o.cap === 'bottom' || o.cap === 'both') cap(profile[0][0], profile[0][1], false);
      return m;
    },
    // a smooth skin over a grid of points: rows[i][j] = [x, y, z] (local). A vertex's normal is the cross of the grid's
    // two directions there, so the skin is smooth both ways. Which side is the outside: o.wrap joins each row's last
    // point to its first (a tube), and the outside is away from the middle row's own middle; else the outside is the
    // side that sees the point o.to. uv(i, j) gives [u, v] or [u, v, w].
    skin(rows, uv, o = {}) {
      const n = rows.length, k = rows[0].length, ids = [], nor = [];
      for (let i = 0; i < n; i++) {
        nor.push([]);
        for (let j = 0; j < k; j++) {
          const a0 = rows[i][o.wrap ? (j + k - 1) % k : Math.max(j - 1, 0)], a1 = rows[i][o.wrap ? (j + 1) % k : Math.min(j + 1, k - 1)];
          const b0 = rows[Math.max(i - 1, 0)][j], b1 = rows[Math.min(i + 1, n - 1)][j];
          const ax = a1[0] - a0[0], ay = a1[1] - a0[1], az = a1[2] - a0[2], bx = b1[0] - b0[0], by = b1[1] - b0[1], bz = b1[2] - b0[2];
          const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx, l = Math.hypot(nx, ny, nz) || 1;
          nor[i].push([nx / l, ny / l, nz / l]);
        }
      }
      const im = n >> 1, jm = o.wrap ? 0 : k >> 1, pm = rows[im][jm], nm = nor[im][jm];
      const to = o.wrap ? [0, 1, 2].map((c) => 2 * pm[c] - rows[im].reduce((sum, p) => sum + p[c], 0) / k) : o.to;
      const f = (to[0] - pm[0]) * nm[0] + (to[1] - pm[1]) * nm[1] + (to[2] - pm[2]) * nm[2] < 0 ? -1 : 1;
      for (let i = 0; i < n; i++) {
        ids.push([]);
        for (let j = 0; j < k; j++) { const q = uv ? uv(i, j) : [j, i], d = nor[i][j]; ids[i].push(vert(rows[i][j], [f * d[0], f * d[1], f * d[2]], q[0], q[1], q[2])); }
      }
      for (let i = 0; i + 1 < n; i++) for (let j = 0; j + (o.wrap ? 0 : 1) < k; j++) {
        const a = ids[i][j], b = ids[i][(j + 1) % k], c = ids[i + 1][(j + 1) % k], d = ids[i + 1][j];
        if (f < 0) { tri(a, c, b); tri(a, d, c); } else { tri(a, b, c); tri(a, c, d); }
      }
      return m;
    },
    // an upright prism over an outline of [x, z] corners (either way round), from y0 to y1; its sides, and its top if asked
    prism(outline, y0, y1, o = {}) {
      let area = 0;
      for (let i = 0; i < outline.length; i++) { const a = outline[i], b = outline[(i + 1) % outline.length]; area += a[0] * b[1] - b[0] * a[1]; }
      const pts = area > 0 ? outline : outline.slice().reverse();      // counter-clockwise in (x, z)
      let run = 0;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
        m.quad([b[0], y0, b[1]], [a[0], y0, a[1]], [a[0], y1, a[1]], [b[0], y1, b[1]], [[run + l, y0], [run, y0], [run, y1], [run + l, y1]]);
        run += l;
      }
      if (o.top !== false) m.poly(pts.slice().reverse().map((q) => [q[0], y1, q[1]]));
      if (o.bottom) m.poly(pts.map((q) => [q[0], y0, q[1]]));
      return m;
    },
    // put the triangles in the order of key(x, y, z) of their middles (blended lace is drawn far to near)
    sortBy(key) {
      const n = I.length / 3, k = new Float64Array(n), ord = [];
      for (let t = 0; t < n; t++) {
        const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
        k[t] = key((P[a] + P[b] + P[c]) / 3, (P[a + 1] + P[b + 1] + P[c + 1]) / 3, (P[a + 2] + P[b + 2] + P[c + 2]) / 3); ord.push(t);
      }
      ord.sort((x, y) => k[x] - k[y] || x - y);
      const J = I.slice();
      for (let t = 0; t < n; t++) { const s3 = ord[t] * 3; I[t * 3] = J[s3]; I[t * 3 + 1] = J[s3 + 1]; I[t * 3 + 2] = J[s3 + 2]; }
      return m;
    },
    get triangles() { return I.length / 3; },
    get vertices() { return P.length / 3; },
    // every vertex's place, for counting clear air: f(x, y, z)
    each(f, from = 0, to = P.length / 3) { for (let i = from * 3; i < Math.min(to * 3, P.length); i += 3) f(P[i], P[i + 1], P[i + 2]); },
    build(THREE) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aP', new THREE.Float32BufferAttribute(A, 4));
      g.setIndex(P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
      g.computeBoundingSphere(); g.computeBoundingBox();
      return g;
    },
    // the same geometry, made in steps with a breath (pause) after each of its lists, for a mesh of many vertices
    async buildInSteps(THREE, pause) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); await pause();
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); await pause();
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); await pause();
      g.setAttribute('aP', new THREE.Float32BufferAttribute(A, 4)); await pause();
      g.setIndex(P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1)); await pause();
      g.computeBoundingSphere(); g.computeBoundingBox();
      return g;
    },
  };
  return m;
}
