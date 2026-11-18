// hill-of-round-doors, the homes: a small accumulator of triangles. Every vertex carries a position, a normal, a
// linear colour, `surf` (the kind of surface, two pattern coordinates in metres, one parameter) and `sway` (metres
// the wind may move it). Shapes are given in the local space of the matrix on top of the stack; build() hands back
// one BufferGeometry in the space of the first matrix.
export const KIND = { PAINT: 0, BRICK: 1, STONE: 2, BOARDS: 3, TURF: 4, PLASTER: 5, GLASS: 6, BRASS: 7, LEAF: 8, FLAGS: 9, EARTH: 10, TILE: 11, RUG: 12, FLAME: 13 };

export function makeGeo(THREE) {
  const pos = [], nor = [], col = [], srf = [], swy = [], idx = [];
  const M = new THREE.Matrix4(), stack = [];
  const e = M.elements;
  let count = 0;
  const G = {
    THREE,
    lift: null,                                               // (x, z) of the world -> metres added to y: lays things on sloping ground
    get triangles() { return idx.length / 3; },
    get vertices() { return count; },
    push(m) { stack.push(M.clone()); M.multiply(m); return G; },
    pop() { M.copy(stack.pop()); return G; },
    // a yaw about y and a move, the common case: local +z turned toward (fx, fz)
    pushYaw(x, y, z, fx = 0, fz = 1, s = 1) {
      const m = new THREE.Matrix4().set(fz * s, 0, fx * s, x, 0, s, 0, y, -fx * s, 0, fz * s, z, 0, 0, 0, 1);
      return G.push(m);
    },
    // a flame's own phase (0 to 40) by where the local point stands in the world: no dice, so that no two lanterns
    // of two homes keep step with each other. (0.7548 and 0.5698 are the two constants of the R2 low-discrepancy
    // sequence: the plastic number's reciprocal and its square; Martin Roberts, 2018.)
    phase(x, y, z) {
      const wx = e[0] * x + e[4] * y + e[8] * z + e[12], wz = e[2] * x + e[6] * y + e[10] * z + e[14];
      const t = wx * 0.7548 + wz * 0.5698 + 0.5;
      return (t - Math.floor(t)) * 40;
    },
    vert(x, y, z, nx, ny, nz, c, kind = 0, u = 0, w = 0, par = 0, sway = 0) {
      const wx = e[0] * x + e[4] * y + e[8] * z + e[12], wz = e[2] * x + e[6] * y + e[10] * z + e[14];
      pos.push(wx, e[1] * x + e[5] * y + e[9] * z + e[13] + (G.lift ? G.lift(wx, wz) : 0), wz);
      let ax = e[0] * nx + e[4] * ny + e[8] * nz, ay = e[1] * nx + e[5] * ny + e[9] * nz, az = e[2] * nx + e[6] * ny + e[10] * nz;
      const l = Math.hypot(ax, ay, az) || 1; ax /= l; ay /= l; az /= l;
      nor.push(ax, ay, az); col.push(c[0], c[1], c[2]); srf.push(kind, u, w, par); swy.push(sway);
      return count++;
    },
    tri(a, b, c) { idx.push(a, b, c); },
    // a flat polygon (a fan), its corners counter-clockwise seen from its front (or o.out names the way it faces);
    // colours: one, or one for each corner
    poly(pts, c, kind = 0, par = 0, o = {}) {
      const a = pts[0], b = pts[1], d = pts[pts.length - 1];
      let nx = (b[1] - a[1]) * (d[2] - a[2]) - (b[2] - a[2]) * (d[1] - a[1]);
      let ny = (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]);
      let nz = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      if (o.out && nx * o.out[0] + ny * o.out[1] + nz * o.out[2] < 0) { nx = -nx; ny = -ny; nz = -nz; }      // o.out: a way the face must look
      // pattern axes: a level one and the one that climbs the face (floors and tops: x and z)
      let tx, ty, tz, bx, by, bz;
      if (Math.abs(ny) > 0.92) { tx = 1; ty = 0; tz = 0; bx = 0; by = 0; bz = -1; }
      else { const h = Math.hypot(nz, nx) || 1; tx = nz / h; ty = 0; tz = -nx / h; bx = ny * tz - nz * ty; by = nz * tx - nx * tz; bz = nx * ty - ny * tx; }
      const first = count, multi = Array.isArray(c[0]);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], uv = o.uv ? o.uv[i] : null;
        G.vert(p[0], p[1], p[2], nx, ny, nz, multi ? c[i] : c, kind, uv ? uv[0] : p[0] * tx + p[1] * ty + p[2] * tz + (o.du || 0),
          uv ? uv[1] : p[0] * bx + p[1] * by + p[2] * bz + (o.dv || 0), par, o.sway ? o.sway[i] : 0);
      }
      for (let i = 1; i < pts.length - 1; i++) idx.push(first, first + i, first + i + 1);
    },
    // a box between two corners; o.skip: faces left out ('b' bottom, 't' top, 'f' +z, 'k' -z, 'l' -x, 'r' +x); o.low: a
    // darker colour for the bottom corners of the sides (the shade where a thing meets the ground)
    box(x0, y0, z0, x1, y1, z1, c, kind = 0, par = 0, o = {}) {
      const s = o.skip || '', lo = o.low || c, cc = [lo, lo, c, c];
      if (!s.includes('f')) G.poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], cc, kind, par, o);
      if (!s.includes('k')) G.poly([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], cc, kind, par, o);
      if (!s.includes('r')) G.poly([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], cc, kind, par, o);
      if (!s.includes('l')) G.poly([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], cc, kind, par, o);
      if (!s.includes('t')) G.poly([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], c, kind, par, o);
      if (!s.includes('b')) G.poly([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], lo, kind, par, o);
    },
  };
  // a round bar or cone between two points (radii ra, rb), `seg` sides; o.caps: close the ends; pattern: round, along
  G.tube = (a, b, ra, rb, seg, c, kind = 0, par = 0, o = {}) => {
    let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const len = Math.hypot(dx, dy, dz) || 1; dx /= len; dy /= len; dz /= len;
    let ux = 0, uy = 1, uz = 0; if (Math.abs(dy) > 0.9) { ux = 1; uy = 0; }
    let px = uy * dz - uz * dy, py = uz * dx - ux * dz, pz = ux * dy - uy * dx; const pl = Math.hypot(px, py, pz); px /= pl; py /= pl; pz /= pl;
    const qx = dy * pz - dz * py, qy = dz * px - dx * pz, qz = dx * py - dy * px;
    const first = count, cb = o.cb || c, slope = (ra - rb) / len;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg * Math.PI * 2, cs = Math.cos(t), sn = Math.sin(t), rx = px * cs + qx * sn, ry = py * cs + qy * sn, rz = pz * cs + qz * sn;
      const nx = rx + dx * slope, ny = ry + dy * slope, nz = rz + dz * slope;
      G.vert(a[0] + rx * ra, a[1] + ry * ra, a[2] + rz * ra, nx, ny, nz, c, kind, t * Math.max(ra, rb), 0, par, o.swayA || 0);
      G.vert(b[0] + rx * rb, b[1] + ry * rb, b[2] + rz * rb, nx, ny, nz, cb, kind, t * Math.max(ra, rb), len, par, o.swayB || 0);
    }
    for (let i = 0; i < seg; i++) { const k = first + i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    if (o.caps) for (const [p, r, s, cc, sw] of [[a, ra, -1, c, o.swayA || 0], [b, rb, 1, cb, o.swayB || 0]]) {
      if (r <= 0) continue;
      const f = count; G.vert(p[0], p[1], p[2], dx * s, dy * s, dz * s, cc, kind, 0, 0, par, sw);
      for (let i = 0; i <= seg; i++) { const t = i / seg * Math.PI * 2, cs = Math.cos(t), sn = Math.sin(t); G.vert(p[0] + (px * cs + qx * sn) * r, p[1] + (py * cs + qy * sn) * r, p[2] + (pz * cs + qz * sn) * r, dx * s, dy * s, dz * s, cc, kind, cs * r, sn * r, par, sw); }
      for (let i = 0; i < seg; i++) idx.push(f, f + 1 + i, f + 2 + i);
    }
  };
  // a flat ring in the plane z, facing +z, round (cx, cy), from r0 to r1; colours inner and outer; pattern: across, round
  G.ring = (cx, cy, z, r0, r1, seg, c0, c1, kind = 0, par = 0, a0 = 0, a1 = Math.PI * 2) => {
    const first = count, rm = (r0 + r1) / 2;
    for (let i = 0; i <= seg; i++) {
      const t = a0 + (a1 - a0) * i / seg, cs = Math.cos(t), sn = Math.sin(t);
      G.vert(cx + cs * r0, cy + sn * r0, z, 0, 0, 1, c0, kind, 0, t * rm, par); G.vert(cx + cs * r1, cy + sn * r1, z, 0, 0, 1, c1, kind, r1 - r0, t * rm, par);
    }
    for (let i = 0; i < seg; i++) { const k = first + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  };
  // the wall of a round hole or of a round boss along z: radius r from z0 to z1; inward: normals toward the axis
  G.barrel = (cx, cy, r, z0, z1, seg, c0, c1, kind = 0, par = 0, inward = false, a0 = 0, a1 = Math.PI * 2) => {
    const first = count, s = inward ? -1 : 1;
    for (let i = 0; i <= seg; i++) {
      const t = a0 + (a1 - a0) * i / seg, cs = Math.cos(t), sn = Math.sin(t);
      G.vert(cx + cs * r, cy + sn * r, z0, cs * s, sn * s, 0, c0, kind, z0, t * r, par); G.vert(cx + cs * r, cy + sn * r, z1, cs * s, sn * s, 0, c1, kind, z1, t * r, par);
    }
    for (let i = 0; i < seg; i++) { const k = first + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  };
  // a ball (sx, sy, sz stretch it); `rows` bands from pole to pole
  G.ball = (cx, cy, cz, r, seg, rows, c, kind = 0, par = 0, sx = 1, sy = 1, sz = 1, cLow = null, sway = 0) => {
    const first = count;
    for (let j = 0; j <= rows; j++) {
      const ph = j / rows * Math.PI, y = Math.cos(ph), rr = Math.sin(ph), k = cLow ? (1 - y) / 2 : 0;
      const cc = cLow ? [c[0] + (cLow[0] - c[0]) * k, c[1] + (cLow[1] - c[1]) * k, c[2] + (cLow[2] - c[2]) * k] : c;
      for (let i = 0; i <= seg; i++) {
        const t = i / seg * Math.PI * 2, x = Math.cos(t) * rr, z = Math.sin(t) * rr;
        G.vert(cx + x * r * sx, cy + y * r * sy, cz + z * r * sz, x / sx, y / sy, z / sz, cc, kind, t * r, ph * r, par, sway);
      }
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) { const a = first + j * (seg + 1) + i, b = a + seg + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  };
  // a flat face in the plane z, facing +z: an outline with round or other holes cut out of it (lists of [x, y])
  G.face = (outline, holes, z, c, kind = 0, par = 0) => {
    const V2 = THREE.Vector2, con = outline.map((p) => new V2(p[0], p[1])), hs = holes.map((h) => h.map((p) => new V2(p[0], p[1])));
    if (THREE.ShapeUtils.isClockWise(con)) con.reverse();
    for (const h of hs) if (!THREE.ShapeUtils.isClockWise(h)) h.reverse();
    const faces = THREE.ShapeUtils.triangulateShape(con, hs), all = con.concat(...hs), first = count;
    for (const p of all) G.vert(p.x, p.y, z, 0, 0, 1, c, kind, p.x, p.y, par);
    for (const f of faces) idx.push(first + f[0], first + f[1], first + f[2]);
  };
  // the points of a circle, for an outline or a hole
  G.circle = (cx, cy, r, seg) => { const out = []; for (let i = 0; i < seg; i++) { const t = i / seg * Math.PI * 2; out.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]); } return out; };
  // one BufferGeometry of everything laid so far; every triangle is wound to agree with its own normals, so that a
  // two-sided material lights it from the right side
  G.build = () => {
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const d = nx * (nor[a] + nor[b] + nor[c]) + ny * (nor[a + 1] + nor[b + 1] + nor[c + 1]) + nz * (nor[a + 2] + nor[b + 2] + nor[c + 2]);
      if (d < 0) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('surf', new THREE.Float32BufferAttribute(srf, 4));
    g.setAttribute('sway', new THREE.Float32BufferAttribute(swy, 1));
    g.setIndex(count > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  };
  return G;
}

// linear [r, g, b] of a colour written as '#rrggbb', and small helpers on such triples
export function lin(THREE, hex) { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; }
export const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
