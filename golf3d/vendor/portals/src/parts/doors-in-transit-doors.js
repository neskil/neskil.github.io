// BROUGHT IN: the hashes dh11 and fh12 follow "Hash without Sine", Copyright (c)2014 David Hoskins, MIT License (shadertoy.com, view 4djSRW), the same form as the kit's fx.js.
// doors-in-transit: THE DOORS (the joiner's part). Real kinds of door from round the world, drawn by type: each one a
// framed unit (jambs, head, sill, leaf, hardware) merged into ONE geometry in the door's own space: origin at the middle
// of the sill, x across, y up, the two faces toward +z and -z, inside the plan's DOOR box. One material serves every
// kind: it is lit by the scene's own lights, takes the paint from instanceColor, keeps the colours of what is not painted
// (frame, iron, glass, paper) from the vertex colour, and draws the leak of light round the leaf itself from two
// instanced attributes: aLeak (the leak's colour) and aLife (the kind of life, a phase).
// Nothing here reads the lens: the shader only filters its fine pattern by the pixel's footprint.
// THE MARKED DOOR (the one the film follows) is the courtyard kind in two pieces with a material of its own
// (DOOR_MARKED): painted white all over, leaf and frame, with hand-painted pink flowers on both faces of the leaf
// (dealt once at build from a stream of their own, dealFlowers), a little wear, and brass for what the hand takes.
// Its wood and iron are the courtyard kind's own, number for number; only its paint differs.
//
// Vertex attributes of a door (beside position, normal, color):
//   aDoor (paint 0..1, spill 0..1, emit 0..1, roughness + 1 if iron)    spill and emit are weights of the leak's light
//   aEdge (sx, sy, hx, hy)   surface coordinates in metres about the middle of the leaf, and the leaf's half size: the
//                            leak is the thin band just inside the leaf's outline (hx < 0: a round-headed leaf, sy from
//                            the springing, hy = the height under the springing; hx = 0: no leak on this face)
//   aTex  (gx, gy, pitch, grain)   unit vector ACROSS the boards, the boards' width (0 = none), the grain's strength
//                            (grain + 4 on the painted faces of a studded kind, b.strong: its paint is never pale)
//   aMark (the marked door's two pieces only): what the white paint does with this vertex: 0 its own colour (the
//                            yoke, the sill, the keyhole's slot), 1 painted over with the leaf (planks, ledges, braces,
//                            studs, straps: they carry the flowers), 2 a brass plate, 3 brass that the hand takes
import { DOOR, MARKED } from './doors-in-transit-plan.js';
import { SHED_SUN_GLSL, shedSunUniform, shedBarsUniform } from './doors-in-transit-shed-sun.js';

const HALF_D = DOOR.depth / 2;          // the door's box: nothing stands past z = +-0.25 (the sill reaches it)
const FZ = 0.22;                        // the frame's faces stand at z = +-0.22
const LEAF_Z = 0.085;                   // a leaf's faces stand at z = +-0.085

// ---- a small mesh builder: flat-shaded quads with the door's attributes -------------------------------------------------
function makeBuilder() {
  const P = [], N = [], C = [], D = [], E = [], T = [], M = [], I = [];
  const st = { col: [1, 1, 1], paint: 1, spill: 0, emit: 0, rough: 0.55, metal: 0, hx: 0, hy: 0, ox: 0, oy: 0, gx: 1, gy: 0, pitch: 0, grain: 1, mk: 0 };
  const b = {
    st,
    set(o) { Object.assign(st, o); return b; },
    // one vertex with the state's attributes; s = this vertex's own spill weight (default: the state's)
    vert(p, n, s) {
      P.push(p[0], p[1], Math.max(-HALF_D, Math.min(HALF_D, p[2]))); N.push(n[0], n[1], n[2]); C.push(st.col[0], st.col[1], st.col[2]);
      D.push(st.paint, s === undefined ? st.spill : s, st.emit, Math.min(0.95, Math.max(0.05, st.rough)) + (st.metal ? 1 : 0));
      E.push(p[0] - st.ox, p[1] - st.oy, st.hx, st.hy); T.push(st.gx, st.gy, st.pitch, st.grain + (b.strong && st.paint > 0.5 ? 4 : 0)); M.push(st.mk);
      return P.length / 3 - 1;
    },
    // a flat polygon (3 or more corners, counter-clockwise seen from outside), as a fan; sp = spill weight per corner
    poly(pts, sp) {
      const a = pts[0], c = pts[1], d = pts[2];
      let nx = (c[1] - a[1]) * (d[2] - a[2]) - (c[2] - a[2]) * (d[1] - a[1]);
      let ny = (c[2] - a[2]) * (d[0] - a[0]) - (c[0] - a[0]) * (d[2] - a[2]);
      let nz = (c[0] - a[0]) * (d[1] - a[1]) - (c[1] - a[1]) * (d[0] - a[0]);
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const i0 = P.length / 3;
      for (let i = 0; i < pts.length; i++) b.vert(pts[i], [nx, ny, nz], sp ? sp[i] : undefined);
      for (let i = 1; i < pts.length - 1; i++) I.push(i0, i0 + i, i0 + i + 1);
      return b;
    },
    quad(p0, p1, p2, p3, sp) { return b.poly([p0, p1, p2, p3], sp); },
    // a face in the plane z, seen from the side dir (+1: +z, -1: -z); corners given as for dir = +1
    face(x0, x1, y0, y1, z, dir, sp) {
      if (dir > 0) return b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], sp);
      return b.quad([x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z], sp ? [sp[1], sp[0], sp[3], sp[2]] : undefined);
    },
    // a box; skip = letters of the faces left out: l (-x) r (+x) d (-y) u (+y) f (+z) k (-z)
    box(x0, x1, y0, y1, z0, z1, skip = '') {
      if (!skip.includes('f')) b.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
      if (!skip.includes('k')) b.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
      if (!skip.includes('r')) b.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
      if (!skip.includes('l')) b.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
      if (!skip.includes('u')) b.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]);
      if (!skip.includes('d')) b.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
      return b;
    },
    triangles() { return I.length / 3; },
    // the box [x0, x1, y0, y1] round every vertex of a class over `over` on the side dir of the leaf (the marked door's brass)
    classBox(dir, over) {
      const o = [1e9, -1e9, 1e9, -1e9];
      for (let i = 0; i < M.length; i++) if (M[i] > over && P[i * 3 + 2] * dir > 0) {
        o[0] = Math.min(o[0], P[i * 3]); o[1] = Math.max(o[1], P[i * 3]); o[2] = Math.min(o[2], P[i * 3 + 1]); o[3] = Math.max(o[3], P[i * 3 + 1]);
      }
      return o;
    },
    geometry(THREE) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aDoor', new THREE.Float32BufferAttribute(D, 4));
      g.setAttribute('aEdge', new THREE.Float32BufferAttribute(E, 4));
      g.setAttribute('aTex', new THREE.Float32BufferAttribute(T, 4));
      if (b.marks) g.setAttribute('aMark', new THREE.Float32BufferAttribute(M, 1));      // (the marked door's two pieces only)
      g.setIndex(P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
      g.computeBoundingBox(); g.computeBoundingSphere();
      return g;
    },
  };
  return b;
}

// linear colour of a hex string, as an array
function lin(THREE, hex) { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; }
// ---- joinery helpers -----------------------------------------------------------------------------------------------------
// a quad given as seen from +z; for dir < 0 it is turned over so that it faces -z
function fq(b, dir, p0, p1, p2, p3, sp) {
  if (dir > 0) return b.quad(p0, p1, p2, p3, sp);
  return b.quad(p3, p2, p1, p0, sp ? [sp[3], sp[2], sp[1], sp[0]] : undefined);
}
// a face in the plane x, looking toward dir (+1: +x); spill sa at z = za, sb at z = zb
function xface(b, x, y0, y1, za, zb, dir, sa, sb) {
  const lo = Math.min(za, zb), hi = Math.max(za, zb), slo = za < zb ? sa : sb, shi = za < zb ? sb : sa;
  if (dir < 0) return b.quad([x, y0, lo], [x, y0, hi], [x, y1, hi], [x, y1, lo], [slo, shi, shi, slo]);
  return b.quad([x, y0, hi], [x, y0, lo], [x, y1, lo], [x, y1, hi], [shi, slo, slo, shi]);
}
// a face in the plane y, looking toward dir (+1: up); spill sa at z = za, sb at z = zb
function yface(b, y, x0, x1, za, zb, dir, sa, sb) {
  const lo = Math.min(za, zb), hi = Math.max(za, zb), slo = za < zb ? sa : sb, shi = za < zb ? sb : sa;
  if (dir > 0) return b.quad([x0, y, hi], [x1, y, hi], [x1, y, lo], [x0, y, lo], [shi, shi, slo, slo]);
  return b.quad([x0, y, lo], [x1, y, lo], [x1, y, hi], [x0, y, hi], [slo, slo, shi, shi]);
}
// the leak's box for a rectangular leaf, or for a round-headed one (springing at ys, radius r)
function leafBox(b, x0, x1, y0, y1) { return b.set({ ox: (x0 + x1) / 2, oy: (y0 + y1) / 2, hx: (x1 - x0) / 2, hy: (y1 - y0) / 2 }); }
function leafArch(b, cx, y0, ys, r) { return b.set({ ox: cx, oy: ys, hx: -r, hy: ys - y0 }); }
function noLeak(b) { return b.set({ hx: 0, hy: 0, ox: 0, oy: 0 }); }

// one sunk panel in a leaf's face (the face stands in the plane z and looks toward dir). style: 'field' (raised and
// fielded), 'flat' (sunk and flat). m = the moulding's width.
function panel(b, x0, x1, y0, y1, z, dir, depth, style, m = 0.1) {
  const zi = z - dir * depth, keep = b.st.col;
  const ring = (ax0, ax1, ay0, ay1, az, bx0, bx1, by0, by1, bz) => {
    fq(b, dir, [ax0, ay0, az], [ax1, ay0, az], [bx1, by0, bz], [bx0, by0, bz]);
    fq(b, dir, [ax1, ay0, az], [ax1, ay1, az], [bx1, by1, bz], [bx1, by0, bz]);
    fq(b, dir, [ax1, ay1, az], [ax0, ay1, az], [bx0, by1, bz], [bx1, by1, bz]);
    fq(b, dir, [ax0, ay1, az], [ax0, ay0, az], [bx0, by0, bz], [bx0, by1, bz]);
  };
  ring(x0, x1, y0, y1, z, x0 + m, x1 - m, y0 + m, y1 - m, zi);
  if (style === 'field' && x1 - x0 > 5 * m && y1 - y0 > 5 * m) {
    const f = m * 2.3, zf = zi + dir * depth * 0.7;
    b.set({ col: [keep[0] * 0.9, keep[1] * 0.9, keep[2] * 0.9] });
    ring(x0 + m, x1 - m, y0 + m, y1 - m, zi, x0 + f, x1 - f, y0 + f, y1 - f, zf);
    b.set({ col: keep });
    b.face(x0 + f, x1 - f, y0 + f, y1 - f, zf, dir);
  } else {
    b.set({ col: [keep[0] * 0.88, keep[1] * 0.88, keep[2] * 0.88] });
    b.face(x0 + m, x1 - m, y0 + m, y1 - m, zi, dir);
    b.set({ col: keep });
  }
}
// the face of a framed leaf: stiles and rails flat in the plane z, panels sunk between them. X and Y hold the edges
// across and up in pairs: [edge, panel start, panel end, ..., edge]
function panelFace(b, X, Y, z, dir, depth, style, m) {
  const nx = X.length, ny = Y.length;
  b.set({ gx: 1, gy: 0 });
  for (let i = 0; i < nx - 1; i += 2) b.face(X[i], X[i + 1], Y[0], Y[ny - 1], z, dir);
  b.set({ gx: 0, gy: 1 });
  for (let i = 1; i < nx - 1; i += 2) for (let j = 0; j < ny - 1; j += 2) b.face(X[i], X[i + 1], Y[j], Y[j + 1], z, dir);
  b.set({ gx: 1, gy: 0 });
  for (let i = 1; i < nx - 1; i += 2) for (let j = 1; j < ny - 1; j += 2) panel(b, X[i], X[i + 1], Y[j], Y[j + 1], z, dir, depth, style, m);
}

// a rectangular frame, w by h outside, with a stepped architrave on both faces, lit reveals and a sill.
// Returns the opening { x0, x1, y0, y1 } the leaf fills.
function rectFrame(b, w, h, fw, fh, sh, col, sillCol) {
  const xo = w / 2, xi = xo - fw, xm = xo - fw * 0.5, yi = h - fh, ym = h - fh * 0.5, zs = 0.165;
  noLeak(b); b.set({ paint: b.fp === undefined ? 2 : b.fp, col, rough: 0.62, metal: 0, pitch: 0, grain: 0.8, emit: 0, spill: 0, gx: 1, gy: 0 });
  if (!b.noHalo) b.set({ ox: 0, oy: (sh + yi) / 2, hx: xi, hy: (yi - sh) / 2, spill: 2 });      // spill 2: the halo round the opening
  for (const s of [-1, 1]) {
    const x0 = Math.min(s * xo, s * xm), x1 = Math.max(s * xo, s * xm);
    b.box(x0, x1, 0, h, -FZ, FZ, 'd');                                             // the outer band, floor to top
    b.box(Math.min(s * xm, s * xi), Math.max(s * xm, s * xi), sh, ym, -zs, zs, 'lrud');   // the inner band (its two faces)
    xface(b, s * xi, sh, yi, LEAF_Z, zs, -s, 1, 0.12);                             // the reveal, lit by the leak
    xface(b, s * xi, sh, yi, -LEAF_Z, -zs, -s, 1, 0.12);
  }
  b.set({ gx: 0, gy: 1 });
  b.box(-xm, xm, ym, h, -FZ, FZ, 'lr');                                            // the head's outer band
  b.box(-xi, xi, yi, ym, -zs, zs, 'lrud');
  yface(b, yi, -xi, xi, LEAF_Z, zs, -1, 1, 0.12);
  yface(b, yi, -xi, xi, -LEAF_Z, -zs, -1, 1, 0.12);
  b.set({ paint: 0, col: sillCol || col, rough: 0.7 });                            // the sill: a worn threshold
  b.box(-xm, xm, 0, sh, -HALF_D, HALF_D, 'u');
  yface(b, sh, -xm, xm, LEAF_Z, HALF_D, 1, 1, 0.1);
  yface(b, sh, -xm, xm, -LEAF_Z, -HALF_D, 1, 1, 0.1);
  noLeak(b); b.set({ spill: 0 });
  return { x0: -xi, x1: xi, y0: sh, y1: yi };
}
function archPts(cx, cy, r, n, a0 = 0, a1 = Math.PI) {
  const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o;
}
// a round-headed frame: jambs to the springing and a half-round head. Returns the opening { r, y0, ys }.
function archFrame(b, w, h, fw, sh, col, sillCol, n = 10, yb = 0) {
  const ro = w / 2, ri = ro - fw, ys = h - ro, H = FZ, L = LEAF_Z;
  noLeak(b); b.set({ paint: b.fp === undefined ? 2 : b.fp, col, rough: 0.62, metal: 0, pitch: 0, grain: 0.8, emit: 0, spill: 0, gx: 1, gy: 0 });
  b.set({ ox: 0, oy: ys, hx: -ri, hy: ys - sh, spill: 2 });
  for (const s of [-1, 1]) {
    b.box(Math.min(s * ro, s * ri), Math.max(s * ro, s * ri), yb, ys, -H, H, 'u' + (s > 0 ? 'l' : 'r'));
    xface(b, s * ri, sh, ys, L, H, -s, 1, 0.12);
    xface(b, s * ri, sh, ys, -L, -H, -s, 1, 0.12);
  }
  const O = archPts(0, ys, ro, n), Q = archPts(0, ys, ri, n);
  b.set({ gx: 0, gy: 1 });
  for (let i = 0; i < n; i++) {
    const o0 = O[i], o1 = O[i + 1], i0 = Q[i], i1 = Q[i + 1];
    b.quad([i0[0], i0[1], H], [o0[0], o0[1], H], [o1[0], o1[1], H], [i1[0], i1[1], H]);
    b.quad([i1[0], i1[1], -H], [o1[0], o1[1], -H], [o0[0], o0[1], -H], [i0[0], i0[1], -H]);
    b.quad([o0[0], o0[1], H], [o0[0], o0[1], -H], [o1[0], o1[1], -H], [o1[0], o1[1], H]);
    b.quad([i0[0], i0[1], L], [i0[0], i0[1], H], [i1[0], i1[1], H], [i1[0], i1[1], L], [1, 0.12, 0.12, 1]);
    b.quad([i0[0], i0[1], -H], [i0[0], i0[1], -L], [i1[0], i1[1], -L], [i1[0], i1[1], -H], [0.12, 1, 1, 0.12]);
  }
  b.set({ paint: 0, col: sillCol || col, rough: 0.7, gx: 0, gy: 1 });
  b.box(-ri, ri, yb, sh, -HALF_D, HALF_D, 'u');
  yface(b, sh, -ri, ri, L, HALF_D, 1, 1, 0.1);
  yface(b, sh, -ri, ri, -L, -HALF_D, 1, 1, 0.1);
  noLeak(b); b.set({ spill: 0 });
  return { r: ri, y0: sh, ys };
}
// the face of a round-headed leaf, one flat piece (its boards are drawn by the material)
function archLeafFace(b, r, y0, ys, z, dir, n = 10) {
  const pts = [[-r, y0, z], [r, y0, z]]; for (const p of archPts(0, ys, r, n)) pts.push([p[0], p[1], z]);
  if (dir < 0) pts.reverse();
  return b.poly(pts);
}

// ---- hardware (black iron unless a colour is given) ----------------------------------------------------------------------
const IRON = [0.07, 0.07, 0.075];
const WHITE = [1, 1, 1], BRASS = [0.72, 0.5, 0.16], STONE = [0.42, 0.4, 0.35], OAK = [0.2, 0.13, 0.07], GLASS = [0.55, 0.6, 0.62];
function iron(b, col) { noLeak(b); return b.set({ paint: 0, col: col || IRON, rough: col ? 0.42 : 0.8, metal: col ? 1 : 0, pitch: 0, grain: 0, emit: 0, spill: 0 }); }
function tri(b, flip, p0, p1, p2) { return flip ? b.poly([p2, p1, p0]) : b.poly([p0, p1, p2]); }
// a stud: a low pyramid on a face; diamond = turned 45 degrees
function stud(b, x, y, z, dir, r, hgt, diamond) {
  const t = [x, y, z + dir * hgt];
  const q = diamond ? [[x, y - r, z], [x + r, y, z], [x, y + r, z], [x - r, y, z]] : [[x - r, y - r, z], [x + r, y - r, z], [x + r, y + r, z], [x - r, y + r, z]];
  for (let i = 0; i < 4; i++) tri(b, dir < 0, q[i], q[(i + 1) % 4], t);
}
// a strap hinge: a tapering strap from the hinge edge xh across the face (len < 0: toward -x), a knuckle on the edge
function strap(b, xh, y, len, z, dir, wid = 0.22) {
  const s = Math.sign(len), l = Math.abs(len), zf = z + dir * 0.035, flip = s * dir < 0;
  const X = (u) => xh + s * u;
  const pts = [[X(0), y - wid, zf], [X(l * 0.86), y - wid * 0.42, zf], [X(l), y, zf], [X(l * 0.86), y + wid * 0.42, zf], [X(0), y + wid, zf]];
  b.poly(flip ? pts.slice().reverse() : pts);
  const edge = (p, q) => { const a = [p[0], p[1], z], c = [q[0], q[1], z]; return flip ? b.quad(p, a, c, q) : b.quad(a, p, q, c); };
  edge(pts[1], pts[0]); edge(pts[2], pts[1]); edge(pts[3], pts[2]); edge(pts[4], pts[3]);
  b.box(Math.min(X(-0.16), X(0.02)), Math.max(X(-0.16), X(0.02)), y - wid * 1.25, y + wid * 1.25, dir > 0 ? z : z + dir * 0.1, dir > 0 ? z + dir * 0.1 : z, dir > 0 ? 'k' : 'f');
  stud(b, X(l * 0.2), y, zf, dir, 0.055, 0.04); stud(b, X(l * 0.55), y, zf, dir, 0.05, 0.04);
}
// a prism knob on a square rose
function knob(b, x, y, z, dir, r, sides = 6) {
  b.box(x - r * 1.25, x + r * 1.25, y - r * 1.25, y + r * 1.25, dir > 0 ? z : z - 0.03, dir > 0 ? z + 0.03 : z, dir > 0 ? 'k' : 'f');
  const z0 = z + dir * 0.03, z1 = z + dir * 0.14, ring = [];
  for (let i = 0; i < sides; i++) { const a = i / sides * Math.PI * 2; ring.push([x + r * Math.cos(a), y + r * Math.sin(a)]); }
  const cap = ring.map((p) => [p[0], p[1], z1]);
  b.poly(dir > 0 ? cap : cap.slice().reverse());
  for (let i = 0; i < sides; i++) {
    const p = ring[i], q = ring[(i + 1) % sides];
    fq(b, dir, [p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1]);
  }
}
// a ring pull hanging from a boss
function ringPull(b, x, y, z, dir, R) {
  stud(b, x, y + R, z, dir, R * 0.34, 0.09, true);
  const zf = z + dir * 0.06, n = 8;
  for (let i = 0; i < n; i++) {
    const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, r0 = R * 0.72;
    fq(b, dir, [x + r0 * Math.cos(a0), y + r0 * Math.sin(a0), zf], [x + R * Math.cos(a0), y + R * Math.sin(a0), zf],
      [x + R * Math.cos(a1), y + R * Math.sin(a1), zf], [x + r0 * Math.cos(a1), y + r0 * Math.sin(a1), zf]);
  }
}
// a keyhole: a small iron plate with a dark slot (nothing in it glints or glows)
function keyhole(b, x, y, z, dir) {
  iron(b); b.box(x - 0.1, x + 0.1, y - 0.2, y + 0.2, dir > 0 ? z : z - 0.025, dir > 0 ? z + 0.025 : z, dir > 0 ? 'k' : 'f');
  b.set({ col: [0.03, 0.03, 0.032], metal: 0, emit: 0, mk: 0 });
  b.face(x - 0.035, x + 0.035, y - 0.09, y + 0.06, z + dir * 0.03, dir);
}
// ---- the material -------------------------------------------------------------------------------------------------------
const DOOR_VERT_PARS = /* glsl */`
attribute vec4 aDoor; attribute vec4 aEdge; attribute vec4 aTex;
#ifdef DOOR_MARKED
attribute float aMark; uniform vec3 uMarkPaint; uniform vec3 uMarkLeak; uniform vec2 uMarkGeo; varying vec2 vMk;
#else
attribute vec3 aLeak; attribute vec2 aLife;
#endif
uniform float uTime; uniform vec3 uDoorSun;
varying vec3 vDWp; varying vec3 vSunL; varying float vRelief;
varying vec4 vDoor; varying vec4 vEdge; varying vec4 vTex; varying vec3 vLeak; varying float vSeed; varying float vStrong;
// dh11: hash11 of "Hash without Sine" (David Hoskins, MIT), brought in
float dh11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float dn1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(dh11(i), dh11(i + 1.), f); }
// the life of a leak: 0 steady, 1 a lamp's flicker, 2 a fire's flicker, 3 far lightning, 4 a slow turning beam, 5 drifting cloud
float doorLife(float kind, float ph, float t){
  float k = floor(kind + .5);
  if (k < .5) return 1.;
  if (k < 1.5) return .86 + .14 * dn1(t * 6. + ph * 31.);
  // (a fire: two slow terms, 1.9 and 3.5 knots a second, 5.4 together: a rim that breathes, never a shimmer)
  if (k < 2.5) { float a = dn1(t * 1.9 + ph * 17.), c = dn1(t * 3.5 + ph * 53.); return .48 + .5 * a * (.6 + .4 * c) + .12 * c; }
  if (k < 3.5) {                         // a dim glow and eased flashes: one double stroke at most in 1.6 s
    float tt = t / 1.6 + ph * 7.31, c = floor(tt), f = (tt - c) * 1.6;
    float on = step(.5, dh11(c * 1.37 + ph * 3.1)), d = f - (.1 + .4 * dh11(c * 2.71 + 1.3));
    float fl = smoothstep(0., .1, d) * exp(-max(d - .1, 0.) / .24);
    float d2 = d - .36; fl += .6 * smoothstep(0., .1, d2) * exp(-max(d2 - .1, 0.) / .2);
    return .3 + .95 * on * fl;
  }
  if (k < 4.5) { float s = .5 + .5 * sin(t * .8 + ph * 6.2832); s *= s; s *= s; return .25 + s * s; }
  return .5 + .55 * dn1(t * .22 + ph * 11.);
}
`;
const DOOR_VERT_COLOR = /* glsl */`
vDoor = aDoor; vEdge = aEdge; vTex = aTex;
float dStud = step(3.5, aTex.w); vTex.w -= 4. * dStud;      // (a studded kind's painted face carries grain + 4)
mat4 dM = modelMatrix;
#ifdef USE_INSTANCING
  dM = modelMatrix * instanceMatrix;
#endif
vDWp = (dM * vec4(position, 1.)).xyz;
// the sun in the door's own frame; what tilts toward it in the door's plane is lit, what tilts away is shaded
vSunL = vec3(dot(uDoorSun, normalize((dM * vec4(1., 0., 0., 0.)).xyz)), dot(uDoorSun, normalize((dM * vec4(0., 1., 0., 0.)).xyz)), dot(uDoorSun, normalize((dM * vec4(0., 0., 1., 0.)).xyz)));
vRelief = dot(normal.xy, vSunL.xy);
#ifdef DOOR_MARKED
  vec3 dPaint = uMarkPaint; vLeak = uMarkLeak; vSeed = .37; vStrong = 1.;
#else
  vec3 dPaint = vec3(1.);
  #ifdef USE_INSTANCING_COLOR
    dPaint = instanceColor.xyz;
  #endif
  vSeed = dh11(aLife.y * 91.7 + aLife.x * 13.1 + 1.7);
  float dS2 = dh11(aLife.y * 57.3 + aLife.x * 7.9 + 4.1), dS3 = dh11(aLife.y * 23.7 + 9.3);
  // every leak breathes slowly by the world's clock at its own pace; one door in eight (phase under 1/8) leaks strongly
  vStrong = step(aLife.y, .125);
  vLeak = aLeak * doorLife(aLife.x, aLife.y, uTime) * (.8 + .2 * sin(uTime * (.22 + .3 * dS3) + aLife.y * 37.)) * (1. + .9 * vStrong);
  float dMx = max(dPaint.r, max(dPaint.g, dPaint.b)), dMn = min(dPaint.r, min(dPaint.g, dPaint.b));
  // no black doors, and no door red or orange (the marked one is white). A paint darker than the darkest allowed, or a dark grey,
  // is dealt again as a deep green, a deep blue, a dark brown or a slate; a red, crimson, orange or orange-brown paint of
  // any depth is dealt again as a green, a blue, a teal or a slate of its own depth; then none is darker than a deep navy
  if (dMx < .085 || (dMx < .15 && dMx - dMn < .03)) dPaint = dS2 < .34 ? vec3(.035, .17, .085) : dS2 < .62 ? vec3(.05, .1, .3) : dS2 < .8 ? vec3(.15, .115, .08) : vec3(.15, .18, .21);
  else {
    if (dPaint.r > dPaint.g * 2.2 && dPaint.r > dPaint.b * 1.5)
      dPaint = (dS2 < .3 ? vec3(.07, .42, .2) : dS2 < .58 ? vec3(.1, .25, .68) : dS2 < .8 ? vec3(.06, .44, .42) : vec3(.36, .44, .52)) * clamp(dMx * 1.5, .34, 1.);
    dMx = max(dPaint.r, max(dPaint.g, dPaint.b));
    if (dMx < .26) dPaint = dPaint * (.26 / max(dMx, .03)) + .012;
  }
  // nothing violet or purple: a paint whose red and blue both stand over its green is dealt as a blue, and a blue keeps
  // its red well under its green (so that no shade and no fill can turn it violet)
  if (dPaint.r > dPaint.g * 1.1 && dPaint.b > dPaint.g * 1.1) dPaint = vec3(dPaint.g * .7, dPaint.g, max(dPaint.b, dPaint.r));
  if (dPaint.b > dPaint.g * 1.15 && dPaint.r > dPaint.g * .7) dPaint.r = dPaint.g * .7;
  else if (dPaint.b > dPaint.g * 1.02 && dPaint.r > dPaint.g * .9) dPaint.r = dPaint.g * .9;       // (a pale blue: never lilac)
  // a studded leaf (the courtyard, coast and wicket kinds) is never white, cream or pale: a paint that is light, pastel
  // or grey (in the hall's bright light such a paint washes out to white) becomes a strong paint or bare wood, and no
  // paint of such a leaf is lighter than a deep one
  dMx = max(dPaint.r, max(dPaint.g, dPaint.b)); dMn = min(dPaint.r, min(dPaint.g, dPaint.b));
  if (dStud > .5) {
    if (dMn > .1 || dMx - dMn < .75 * dMx)
      dPaint = dS2 < .22 ? vec3(.03, .17, .07) : dS2 < .44 ? vec3(.035, .11, .34) : dS2 < .62 ? vec3(.03, .2, .19) : dS2 < .82 ? vec3(.16, .085, .038) : vec3(.11, .062, .03);
    dPaint *= min(1., .32 / max(max(dPaint.r, max(dPaint.g, dPaint.b)), .03));
  }
#endif
// what is not painted: its own colour; the frame (aDoor.x = 2): white, cream, stone or wood, dealt door by door
vec3 dFrame = vSeed < .34 ? vec3(.60, .59, .55) : vSeed < .6 ? vec3(.56, .49, .33) : vSeed < .8 ? vec3(.36, .35, .32) : vec3(.22, .135, .07);
#ifdef DOOR_MARKED
  dFrame = uMarkPaint;                   // the marked door's frame: the leaf's own white, plain
#endif
vColor = color * (aDoor.x > 1.5 ? dFrame : mix(vec3(1.), dPaint, clamp(aDoor.x, 0., 1.)));
#ifdef DOOR_MARKED
  // the marked door's leaf is painted white all over, its studs, straps, ledges and braces with it (aMark 1: they
  // take the leaf's own coordinates, x from its middle and y from the springing, so that the flowers lie over them
  // too); what the hand takes is brass (aMark 3) on duller brass plates (aMark 2). vMk: the class, and 1 for the inner face
  vMk = vec2(aMark, step(position.z, 0.));
  if (aMark > 1.5) { vColor = vec3(${BRASS.join(', ')}) * (aMark > 2.5 ? 1. : .6); vDoor.w = 1.42; }
  else if (aMark > .5) {                 // (gloss on the flat wood; the painted iron keeps its dull face, so that no stud glints)
    vColor = uMarkPaint * (aDoor.x > .5 ? color : vec3(1.)); vDoor.w = aDoor.x > .5 ? .45 : .8; vDoor.x = 1.;
    vEdge.xy = vec2(position.x, position.y - uMarkGeo.y);
  }
#endif
`;
// the marked door's painted iron takes the light as the flat wood it stands on (no stud's facet catches the sun on the
// white paint); its form is left to the paint's own soft lit and shaded edges
const DOOR_VERT_NORMAL = /* glsl */`
  if (aMark > .5 && aMark < 1.5 && aDoor.x < .5) objectNormal = vec3(0., 0., position.z > 0. ? 1. : -1.);
`;
const DOOR_FRAG_PARS = /* glsl */`
varying vec4 vDoor; varying vec4 vEdge; varying vec4 vTex; varying vec3 vLeak; varying float vSeed; varying float vStrong;
uniform float uLeakGain; uniform vec3 uShade; uniform vec3 uDoorSun; uniform float uBars;
varying vec3 vDWp; varying vec3 vSunL; varying float vRelief;
#ifdef DOOR_MARKED
varying vec2 vMk; uniform vec2 uMarkGeo; uniform vec4 uMarkHand; uniform vec4 uFlowers[32];
#endif
` + SHED_SUN_GLSL + /* glsl */`
// fh12: hash12 of "Hash without Sine" (David Hoskins, MIT), brought in
float fh12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float fvn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(fh12(i), fh12(i + vec2(1., 0.)), f.x), mix(fh12(i + vec2(0., 1.)), fh12(i + vec2(1., 1.)), f.x), f.y); }
`;
// the paint: boards with their joints, every board its own tone, the grain of the brush, a slow mottling
const DOOR_FRAG_COLOR = /* glsl */`
{
  vec2 sc = vEdge.xy, gd = vTex.xy;
  float across = dot(sc, gd), along = dot(sc, vec2(-gd.y, gd.x)), fwA = fwidth(across) + 1e-5, tone = 1.;
  if (vTex.z > .001) {
    float c = across / vTex.z, id = floor(c + .5), e = abs(c - id), g = .016 / vTex.z, w = fwA / vTex.z;
    float groove = (1. - smoothstep(g, g + w + 1e-4, .5 - e)) * clamp(g / (w * .7 + 1e-4), 0., 1.);
#ifdef DOOR_MARKED
    tone *= (1. - .5 * groove) * (.95 + .1 * fh12(vec2(id, floor(vSeed * 64.))));      // (planks under one coat of white)
#else
    tone *= (1. - .6 * groove) * (.88 + .24 * fh12(vec2(id, floor(vSeed * 64.))));
#endif
  }
  float dGr = vTex.w > 1.5 ? vTex.w - 2. : vTex.w;
  if (dGr > .001) {
    vec2 q = vec2(across * 22., along * 1.3) + vSeed * 40.;
    float fade = clamp(.5 / (fwA * 22.) - .2, 0., 1.);
    float n = fvn(q) * .6 + fvn(q * vec2(2.7, 1.9) + 7.) * .4;
    tone *= 1. + dGr * (fade * (n - .5) * .36 + (fvn(sc * .9 + vSeed * 90.) - .5) * .18);
  }
  // joinery in the shading: a lit edge and a shaded edge by the sun's direction
#ifdef DOOR_MARKED
  // (white paint: a soft lit edge and a soft shaded one, so that no stud or moulding of it flares in the sun)
  tone *= vDoor.x > .5 ? clamp(1. + .6 * vRelief, .7, 1.1) : clamp(1. + 1.1 * vRelief, .5, 1.8);
#else
  tone *= clamp(1. + 1.1 * vRelief, .5, 1.8);
#endif
  // a flat leaf (the flush kind): stiles, rails and sunk panels drawn, each with its lit and shaded edge
  if (vTex.w > 1.5 && abs(vEdge.z) > .001 && vDoor.y < 1.5 && vDoor.x > .5 && vDoor.x < 1.5 && vTex.z < .001) {
    float hw = abs(vEdge.z), H = vEdge.z > 0. ? 2. * vEdge.w : vEdge.w;
    vec2 q = vec2(vEdge.x, vEdge.y + vEdge.w);
    float st = min(.38, hw * .34), px = max(fwidth(q.x), fwidth(q.y)) + 1e-5, xa = -hw + st, xb = hw - st, dx, sx, dy, sy;
    if (hw > 1.2) {
      if (q.x < 0.) { dx = min(q.x - xa, -.15 - q.x); sx = (q.x - xa) < (-.15 - q.x) ? 1. : -1.; }
      else { dx = min(q.x - .15, xb - q.x); sx = (q.x - .15) < (xb - q.x) ? 1. : -1.; }
    } else { dx = min(q.x - xa, xb - q.x); sx = (q.x - xa) < (xb - q.x) ? 1. : -1.; }
    float r0 = .55, r1 = .38 * H, r2 = r1 + .34, r3 = .76 * H, r4 = r3 + .3, r5 = H - st;
    float d1 = min(q.y - r0, r1 - q.y), d2 = min(q.y - r2, r3 - q.y), d3 = min(q.y - r4, r5 - q.y);
    if (d1 >= d2 && d1 >= d3) { dy = d1; sy = (q.y - r0) < (r1 - q.y) ? 1. : -1.; }
    else if (d2 >= d3) { dy = d2; sy = (q.y - r2) < (r3 - q.y) ? 1. : -1.; }
    else { dy = d3; sy = (q.y - r4) < (r5 - q.y) ? 1. : -1.; }
    float dp = min(dx, dy), bw = max(.11, 1.3 * px), inP = smoothstep(0., px, dp), bev = inP * (1. - smoothstep(bw, bw + px, dp));
    tone *= mix(1., .9, inP) * (1. + bev * clamp((dx < dy ? sx * vSunL.x : sy * vSunL.y) * 1.5, -.5, .7));
  }
#ifdef DOOR_MARKED
  // THE MARKED DOOR'S PAINT: white gloss over planks, ledges and iron alike, and on it hand-painted flowers: a round
  // heart with five or six fat petals, flat colour, a brush-soft edge, no outline. They are dealt once at build in
  // the leaf's own coordinates (uFlowers: centre x, y from the springing, radius; w: 1 for six petals + 2 for the
  // stronger of the two pinks + the turn as a share of one petal). The first sixteen lie on the outer face, the
  // others on the inner. Nothing here reads the lens or the clock: only the edge's softness is widened to a pixel.
  if (vMk.x > .5 && vMk.x < 1.5) {
    vec2 fq = vEdge.xy; vec3 pc = diffuseColor.rgb;
    float fpx = max(fwidth(fq.x), fwidth(fq.y)) + 1e-5, soft = max(.016, fpx);
    float wob = (fvn(fq * 6. + 31.) - .5) * .05;                              // the hand's wobble, in metres
    int f0 = vMk.y > .5 ? 16 : 0;
    for (int i = 0; i < 16; i++) {
      vec4 f = uFlowers[f0 + i];
      vec2 p = fq - f.xy; float rr = dot(p, p), R = f.z;
      if (rr < R * R * 1.3) {
        float code = floor(f.w), six = mod(code, 2.), seg = 6.2832 / (5. + six), rho = sqrt(rr + 1e-8);
        float th = atan(p.y, p.x + step(abs(p.x) + abs(p.y), 1e-6) * 1e-5) + fract(f.w) * seg + 6.2832;
        float a = mod(th, seg) - .5 * seg, a0 = (.59 + .05 * six) * R;      // one petal: a round dab, its middle a0 out
        vec2 pl = rho * vec2(cos(a), sin(a)) - vec2(a0, 0.);
        float sd = min(sqrt(dot(pl, pl) + 1e-8) - (R - a0), rho - a0) + wob;
        float m = 1. - smoothstep(-soft, soft, sd), md = 1. - smoothstep(-soft, soft, rho - .25 * R + .5 * wob);
        // a soft rose or a stronger pink, the heart a deep pink; each keeps its blue well under its red, so that the
        // hall's cool shade never turns it toward violet
        vec3 petal = mix(vec3(1., .5, .53), vec3(.98, .22, .34), step(1.5, code));
        pc = mix(pc, diffuseColor.rgb * mix(petal, vec3(.74, .07, .16), md), m);
      }
    }
    // a little wear: the paint rubbed thin to the wood along the leaf's foot and edges and round what the hand takes
    float mr = uMarkGeo.x, mh = uMarkGeo.y;
    float dq = fq.y > 0. ? mr - sqrt(dot(fq, fq) + 1e-8) : min(mr - abs(fq.x), fq.y + mh);
    vec2 hq = fq - (vMk.y > .5 ? uMarkHand.zw : uMarkHand.xy);
    float nz = fvn(fq * vec2(11., 2.5) + 3.) * .6 + fvn(fq * vec2(37., 6.) + 11.) * .4;       // streaks along the planks
    float edge = (1. - smoothstep(.04, .5, dq)) * (.55 + .45 * (1. - smoothstep(0., 2.2, fq.y + mh)));
    float hand = 1. - smoothstep(.3, .85, sqrt(dot(hq, hq) + 1e-8));
    float rub = max(edge, .8 * hand), worn = smoothstep(.8, .94, nz + .47 * rub);
    pc = mix(pc * (1. - .08 * rub), vec3(.3, .25, .19) * (.8 + .4 * nz), worn * .65);
    diffuseColor.rgb = pc;
  }
#endif
  // the low sun's bars: the roof's ribs lay their long shadows over the doors as over the floor
  float dLit = smoothstep(.5, .95, shedSunShade(vDWp, uDoorSun));
  diffuseColor.rgb *= tone * mix(vec3(1.), mix(vec3(.5, .56, .6), vec3(1.16, 1.08, .93), dLit), uBars);
}
`;
// the leak: a thin band of light just inside the leaf's outline, strongest at the sill; a spill on what faces it
const DOOR_FRAG_EMIT = /* glsl */`
{
  float hx = vEdge.z, hy = vEdge.w, line = 0., halo = 0.;
  if (abs(hx) > .001) {
    vec2 q = vEdge.xy; float r = abs(hx), db = q.y + hy;
    float d = hx > 0. ? min(r - abs(q.x), hy - abs(q.y)) : (q.y > 0. ? r - length(q) : min(r - abs(q.x), db));
    float aa = fwidth(d) + 1e-5, low = 1. - smoothstep(0., .6, db), sill = .75 + 1.05 * (1. - smoothstep(0., 1.6, db));
    if (vDoor.y > 1.5) {                                   // the frame and the sill: a soft halo round the opening
      halo = exp(-max(-d, 0.) * mix(9., 3.4, vStrong)) * mix(.1, .3, vStrong) * sill;
    } else {                                               // the leaf: the line just inside its outline, widest at the sill
      float di = max(d, 0.), wl = mix(.07, .2, low), w = max(wl, 1.5 * aa), k = wl / w;
      line = (1. - smoothstep(w - aa, w + aa, di)) * max(k * (2. - k), .55) * sill * step(-.03, d);
      halo = exp(-di * 12.) * .07 * sill * step(-.03, d);
    }
  }
  float spill = vDoor.y > 1.5 ? 0. : vDoor.y;
  totalEmissiveRadiance += vLeak * uLeakGain * (line + halo + vDoor.z + spill * spill * (.4 + .5 * vStrong));
  // the hall's own soft light where the sun does not fall: the warm floor's bounce from below, the bright roof above
  vec3 dWn = inverseTransformDirection(normal, viewMatrix);
  // (a blue's fill is even in all three, so that no blue leaf turns violet in shade)
  vec3 dFill = mix(uShade, vec3((uShade.r + uShade.g + uShade.b) / 3.), step(diffuseColor.g * 1.1, diffuseColor.b));
#ifdef DOOR_MARKED
  dFill = uShade;                        // (the marked door has no blue: its pinks take the hall's warm fill like its white)
#endif
  totalEmissiveRadiance += diffuseColor.rgb * dFill * (.7 - .3 * dWn.y);
}
`;
function makeDoorMaterial(THREE, U, marked) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0 });
  if (marked) m.defines = { DOOR_MARKED: 1 };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime; sh.uniforms.uLeakGain = U.uLeakGain; sh.uniforms.uShade = marked ? U.uMarkShade : U.uShade;
    sh.uniforms.uDoorSun = U.uDoorSun; sh.uniforms.uBars = U.uBars;
    if (marked) { sh.uniforms.uMarkPaint = U.uMarkPaint; sh.uniforms.uMarkLeak = U.uMarkLeak; sh.uniforms.uMarkGeo = U.uMarkGeo; sh.uniforms.uMarkHand = U.uMarkHand; sh.uniforms.uFlowers = U.uFlowers; }
    sh.vertexShader = sh.vertexShader.replace('#include <common>', DOOR_VERT_PARS + '\n#include <common>')
      .replace('#include <color_vertex>', DOOR_VERT_COLOR);
    if (marked) sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n' + DOOR_VERT_NORMAL);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', DOOR_FRAG_PARS + '\n#include <common>')
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + DOOR_FRAG_COLOR)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = fract(vDoor.w);')
      .replace('#include <metalnessmap_fragment>', 'float metalnessFactor = step(1., vDoor.w) * .7;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + DOOR_FRAG_EMIT);
  };
  m.customProgramCacheKey = () => 'doors-in-transit-door' + (marked ? '-marked' : '');
  return m;
}
// ---- the kinds -----------------------------------------------------------------------------------------------------------
function painted(b, o) { return b.set(Object.assign({ paint: 1, col: WHITE, rough: 0.5, metal: 0, emit: 0, spill: 0, pitch: 0, grain: 1, gx: 1, gy: 0 }, o || {})); }
function framed(b, o) { noLeak(b); return b.set(Object.assign({ paint: 2, col: WHITE, rough: 0.62, metal: 0, emit: 0, spill: 0, pitch: 0, grain: 0.8, gx: 1, gy: 0 }, o || {})); }

// 1. a six-panel town door under a half-round fanlight
function kindTown() {
  const b = makeBuilder(), w = 4.3, h = 8.5, yt = 6.0;
  const op = archFrame(b, w, h, 0.36, 0.14, WHITE, STONE), r = op.r, y0 = op.y0, ys = op.ys;
  yoke(b, w, h + 0.1, w / 2, h - w / 2);
  framed(b, { gx: 0, gy: 1 });                                        // the transom between leaf and fanlight
  b.box(-r, r, yt, ys, -0.165, 0.165, 'lrd');
  yface(b, yt, -r, r, LEAF_Z, 0.165, -1, 1, 0.12); yface(b, yt, -r, r, -LEAF_Z, -0.165, -1, 1, 0.12);
  const X = [-r, -r + 0.42, -0.19, 0.19, r - 0.42, r], Y = [y0, y0 + 0.62, 2.0, 2.5, 4.55, 4.91, 5.6, yt];
  painted(b); leafBox(b, -r, r, y0, yt);
  panelFace(b, X, Y, LEAF_Z, 1, 0.06, 'field'); panelFace(b, X, Y, -LEAF_Z, -1, 0.045, 'flat');
  for (const dir of [1, -1]) {                                        // knob, keyhole, hinges
    iron(b, BRASS); b.set({ rough: 0.3 }); knob(b, r - 0.21, 2.25, dir * LEAF_Z, dir, 0.13);
    keyhole(b, r - 0.21, 1.72, dir * LEAF_Z, dir);
  }
  iron(b, BRASS); for (const y of [0.95, 3.3, 5.35]) b.box(-r - 0.02, -r + 0.07, y - 0.18, y + 0.18, LEAF_Z, LEAF_Z + 0.07, 'k');
  noLeak(b); b.set({ paint: 0, col: GLASS, rough: 0.3, metal: 0, emit: 0, grain: 0, pitch: 0 });      // the fanlight's frosted glass
  const fan = archPts(0, ys, r, 10);
  b.poly(fan.map((p) => [p[0], p[1], 0.04])); b.poly(fan.slice().reverse().map((p) => [p[0], p[1], -0.04]));
  framed(b);
  for (const dir of [1, -1]) {                                        // radiating bars and a hub
    for (let i = 1; i < 6; i++) {
      const a = i / 6 * Math.PI, c = Math.cos(a), sn = Math.sin(a), t = 0.045, z = dir * 0.07;
      fq(b, dir, [0.5 * c + t * sn, ys + 0.5 * sn - t * c, z], [r * c + t * sn, ys + r * sn - t * c, z], [r * c - t * sn, ys + r * sn + t * c, z], [0.5 * c - t * sn, ys + 0.5 * sn + t * c, z]);
    }
    const hub = archPts(0, ys, 0.52, 5).map((p) => [p[0], p[1], dir * 0.07]);
    b.poly(dir > 0 ? hub : hub.reverse());
  }
  return { name: 'town six-panel', b, width: w, height: h + 0.1, arched: true };
}

// 2. a two-leaf stable door: boarded upper and lower leaves, strap hinges, a drip ledge, ledges and braces behind
function kindStable() {
  const b = makeBuilder(), w = 4.6, h = 7.6, ym = 3.62, pitch = 0.49;
  const op = rectFrame(b, w, h, 0.34, 0.36, 0.14, WHITE, OAK);
  const leaves = [[op.y0, ym], [ym, op.y1]];
  for (const [ya, yb] of leaves) {
    painted(b, { pitch }); leafBox(b, op.x0, op.x1, ya, yb);
    b.face(op.x0, op.x1, ya, yb, LEAF_Z, 1); b.face(op.x0, op.x1, ya, yb, -LEAF_Z, -1);
    painted(b, { gx: 0, gy: 1, col: [0.9, 0.9, 0.9] }); noLeak(b);                       // ledges behind
    for (const y of [ya + 0.5, yb - 0.5]) b.box(op.x0 + 0.12, op.x1 - 0.12, y - 0.2, y + 0.2, -LEAF_Z - 0.07, -LEAF_Z, 'f');
    const zb = -LEAF_Z - 0.06, x0 = op.x0 + 0.2, x1 = op.x1 - 0.2, t = 0.3;             // a brace, rising from the hinge side
    b.set({ gx: 0.6, gy: -0.8 });
    b.quad([x1, yb - 0.7, zb], [x1, yb - 0.7 - t, zb], [x0, ya + 0.7, zb], [x0, ya + 0.7 + t, zb]);
    iron(b);
    strap(b, op.x0, ya + 0.5, 2.7, LEAF_Z, 1); strap(b, op.x0, yb - 0.5, 2.7, LEAF_Z, 1);
  }
  painted(b, { gx: 0, gy: 1, col: [0.92, 0.92, 0.92] }); noLeak(b);                       // the drip ledge on the lower leaf
  b.box(op.x0 + 0.04, op.x1 - 0.04, ym - 0.24, ym - 0.04, LEAF_Z, LEAF_Z + 0.13, 'k');
  iron(b); b.box(op.x1 - 0.75, op.x1 - 0.3, ym + 0.5, ym + 0.66, LEAF_Z, LEAF_Z + 0.07, 'k');  // a latch bar and its pull
  ringPull(b, op.x1 - 0.55, ym + 1.25, LEAF_Z, 1, 0.2);
  b.box(op.x1 - 1.1, op.x1 - 0.1, ym - 0.9, ym - 0.76, -LEAF_Z - 0.08, -LEAF_Z, 'f');    // a slide bolt behind
  keyhole(b, op.x1 - 0.5, ym - 1.3, LEAF_Z, 1);
  return { name: 'stable two-leaf', b, width: w, height: h, arched: false };
}
// the carrying yoke of a round-headed door: a flat iron bar over the crown on two short struts, so that the hangers
// find a level top at y = top anywhere within 0.36 of the width either side of the middle
function yoke(b, w, top, ro, ys) {
  iron(b); const x = w * 0.37, ya = ys + Math.sqrt(Math.max(0, ro * ro - x * x)) - 0.05;
  b.box(-x - 0.08, x + 0.08, top - 0.1, top, -0.09, 0.09);
  for (const s of [-1, 1]) b.box(s * x - 0.07, s * x + 0.07, ya, top - 0.1, -0.07, 0.07, 'ud');
}
// 3. an arched plank courtyard door: iron studs in rows, long strap hinges, a ring; ledges and braces behind.
// The marked door is this kind, larger, in two pieces (frame into bf, leaf into bl): the same wood and iron, and to
// every vertex of its leaf a class for its white paint (o.fine: 1 painted over, 2 a brass plate, 3 brass for the hand).
function courtyardInto(bf, bl, o) {
  const { r, y0, ys, pitch, n } = o, rows = [0.7, 2.15, 3.6, 5.05], mk = o.fine ? 1 : 0, plate = o.fine ? 2 : 0, hand = o.fine ? 3 : 0;
  bl.strong = 1;                                   // a studded leaf: strong paint or bare wood, never pale
  painted(bl, { pitch, mk }); leafArch(bl, 0, y0, ys, r);
  archLeafFace(bl, r, y0, ys, LEAF_Z, 1, n); archLeafFace(bl, r, y0, ys, -LEAF_Z, -1, n);
  iron(bl);
  for (const ry of rows.concat([ys - y0 + r * 0.42])) {
    const y = y0 + ry, half = y > ys ? Math.sqrt(Math.max(0, r * r - (y - ys) * (y - ys))) : r, nb = Math.floor((half - 0.24) / pitch);
    for (let i = -nb; i <= nb; i++) stud(bl, i * pitch, y, LEAF_Z, 1, 0.085, 0.075, true);
  }
  strap(bl, -r, y0 + 1.42, r * 1.5, LEAF_Z, 1, 0.24); strap(bl, -r, y0 + 4.32, r * 1.5, LEAF_Z, 1, 0.24);
  bl.set({ mk: plate });
  bl.box(r - 1.02, r - 0.48, y0 + 2.6, y0 + 3.3, LEAF_Z, LEAF_Z + 0.03, 'k');             // the ring's plate, the ring
  bl.set({ mk: hand }); ringPull(bl, r - 0.75, y0 + 2.9, LEAF_Z + 0.03, 1, 0.27);
  bl.set({ mk: plate }); keyhole(bl, r - 0.75, y0 + 1.42, LEAF_Z, 1);
  painted(bl, { gx: 0, gy: 1, col: [0.9, 0.9, 0.9], mk }); noLeak(bl);                     // behind: ledges and braces
  const back = o.fine ? [1.42, 2.87, 4.32, 5.77] : rows;                                    // the ledges (fine: under the straps)
  for (const ry of back) bl.box(-r + 0.14, r - 0.14, y0 + ry - 0.2, y0 + ry + 0.2, -LEAF_Z - 0.075, -LEAF_Z, 'f');
  const zb = -LEAF_Z - 0.06, x0 = -r + 0.2, x1 = r - 0.2, t = 0.3;
  bl.set({ gx: 0.5, gy: -0.86 });
  for (const [ra, rb] of [[back[0], back[1]], [back[2], back[3]]]) bl.quad([x1, y0 + rb - 0.2, zb], [x1, y0 + rb - 0.2 - t, zb], [x0, y0 + ra + 0.2, zb], [x0, y0 + ra + 0.2 + t, zb]);
  iron(bl);
  if (o.fine) {       // the inner face as handsome as the outer: strap hinges on two ledges, nail heads on the others, a latch
    const zl = -LEAF_Z - 0.075, yl = y0 + back[1];
    strap(bl, -r, y0 + back[0], r * 1.5, zl, -1, 0.2); strap(bl, -r, y0 + back[2], r * 1.5, zl, -1, 0.2);
    for (let i = -4; i <= 4; i++) { if (i < 2) stud(bl, i * 0.5, yl, zl, -1, 0.07, 0.06, true); stud(bl, i * 0.5, y0 + back[3], zl, -1, 0.07, 0.06, true); }
    bl.set({ mk: hand }); bl.box(r - 1.75, r - 0.06, yl - 0.075, yl + 0.075, zl - 0.035, zl, 'f');   // the latch bar, its keeper, its plate
    bl.set({ mk: plate }); bl.box(r - 0.5, r - 0.36, yl - 0.2, yl + 0.2, zl - 0.07, zl, 'f'); bl.box(r - 1.95, r - 1.65, yl - 0.17, yl + 0.17, zl - 0.05, zl, 'f');
  } else {
    bl.box(r - 1.5, r - 0.1, y0 + 2.8, y0 + 2.96, -LEAF_Z - 0.09, -LEAF_Z, 'f');           // a slide bolt behind
    keyhole(bl, r - 0.75, y0 + 1.42, -LEAF_Z, -1);
  }
  archFrame(bf, o.w, o.top, o.fw, y0, WHITE, STONE, n, o.yb);
  yoke(bf, o.w, o.top + 0.1, o.w / 2, o.top - o.w / 2);
}
function kindCourtyard() {
  const b = makeBuilder(), w = 4.7, h = 8.6, fw = 0.36, r = w / 2 - fw, top = h - 0.1;
  courtyardInto(b, b, { w, top, fw, r, y0: 0.14, ys: top - w / 2, pitch: 0.44, n: 10, yb: 0 });
  return { name: 'courtyard arched plank', b, width: w, height: h, arched: true };
}

const GLASS_STATE = { paint: 0, col: GLASS, rough: 0.3, emit: 0, grain: 0 };
// a frosted pane sunk in a leaf's face: a painted bevel, the glass behind it a plain matt grey-green (it does not glow)
function pane(b, x0, x1, y0, y1, z, dir, m = 0.07) {
  const zi = z - dir * 0.05, keep = Object.assign({}, b.st);
  fq(b, dir, [x0, y0, z], [x1, y0, z], [x1 - m, y0 + m, zi], [x0 + m, y0 + m, zi]);
  fq(b, dir, [x1, y0, z], [x1, y1, z], [x1 - m, y1 - m, zi], [x1 - m, y0 + m, zi]);
  fq(b, dir, [x1, y1, z], [x0, y1, z], [x0 + m, y1 - m, zi], [x1 - m, y1 - m, zi]);
  fq(b, dir, [x0, y1, z], [x0, y0, z], [x0 + m, y0 + m, zi], [x0 + m, y1 - m, zi]);
  b.set(GLASS_STATE); b.set({ pitch: 0 });
  b.face(x0 + m, x1 - m, y0 + m, y1 - m, zi, dir);
  b.set(keep);
}
// a lever handle on a long plate
function lever(b, x, y, z, dir, s) {
  b.box(x - 0.08, x + 0.08, y - 0.3, y + 0.3, dir > 0 ? z : z - 0.025, dir > 0 ? z + 0.025 : z, dir > 0 ? 'k' : 'f');
  const za = z + dir * 0.06, zb = z + dir * 0.12;
  b.box(Math.min(x, x + s * 0.5), Math.max(x, x + s * 0.5), y + 0.06, y + 0.14, Math.min(za, zb), Math.max(za, zb));
}

// 4. a carved coast door: a heavy lintel, a carved centre post, two leaves with rows of wood-brown bosses
function kindCoast() {
  const b = makeBuilder(), w = 4.7, h = 8.6, TEAK = [0.2, 0.115, 0.055], CARVE = [0.29, 0.175, 0.085];
  b.fp = 0; b.strong = 1;
  const op = rectFrame(b, w, h, 0.5, 1.0, 0.16, TEAK, TEAK), ya = op.y0, yb = op.y1, yc = (ya + yb) / 2;
  noLeak(b); b.set({ paint: 0, col: CARVE, rough: 0.6, metal: 0, grain: 0.6, pitch: 0 });
  for (const dir of [1, -1]) for (let i = -3; i <= 3; i++) stud(b, i * 0.6, h - 0.25, dir * FZ, dir, 0.2, 0.05, true);
  for (const s of [-1, 1]) for (let j = 0; j < 9; j++) stud(b, s * (w / 2 - 0.125), 0.62 + j * 0.8, FZ, 1, 0.1, 0.04, true);
  const rail = { pitch: 1.36, gx: 0, gy: 1 };
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? op.x0 : 0, x1 = s < 0 ? 0 : op.x1;
    painted(b, rail); leafBox(b, x0, x1, ya, yb); b.face(x0, x1, ya, yb, LEAF_Z, 1);
    painted(b, { pitch: 0.46 }); leafBox(b, x0, x1, ya, yb); b.face(x0, x1, ya, yb, -LEAF_Z, -1);
    iron(b, [0.2, 0.13, 0.055]); b.set({ metal: 0, rough: 0.7 });               // the bosses: wood-brown and matt
    for (let j = -2; j <= 2; j++) for (let i = 0; i < 3; i++) stud(b, s * (0.44 + i * 0.5), yc + j * 1.36, LEAF_Z, 1, 0.12, 0.15);
  }
  noLeak(b); b.set({ paint: 0, col: TEAK, rough: 0.6, metal: 0, grain: 0.7, pitch: 0, gx: 1, gy: 0, emit: 0, spill: 0 });
  b.box(-0.15, 0.15, ya, yb, LEAF_Z, LEAF_Z + 0.1, 'kud');                                   // the centre post
  b.set({ col: CARVE }); for (let j = 0; j < 7; j++) stud(b, 0, ya + 0.6 + j * 1.04, LEAF_Z + 0.1, 1, 0.11, 0.045, true);
  painted(b, { gx: 0, gy: 1, col: [0.9, 0.9, 0.9] }); noLeak(b);
  for (const y of [ya + 1.3, yb - 1.3]) b.box(op.x0 + 0.1, op.x1 - 0.1, y - 0.2, y + 0.2, -LEAF_Z - 0.07, -LEAF_Z, 'f');
  iron(b); b.box(-0.9, 0.9, yc - 0.08, yc + 0.08, -LEAF_Z - 0.09, -LEAF_Z, 'f');
  ringPull(b, 0.69, yc - 0.42, LEAF_Z, 1, 0.19); keyhole(b, 0.69, yc - 2.04, LEAF_Z, 1);
  return { name: 'coast carved', b, width: w, height: h, arched: false };
}

// 5. a paper screen: two panels of paper in a brown-black lattice (never red-brown: from afar it must not read pink), a painted kick board; the paper is plain and matt (it does not glow)
function kindPaper() {
  const b = makeBuilder(), w = 4.6, h = 7.4, DARK = [0.03, 0.027, 0.024], PAPER = [0.62, 0.56, 0.42], kick = 1.35, st = 0.17;
  b.fp = 0;
  const op = rectFrame(b, w, h, 0.26, 0.3, 0.12, DARK, DARK), ya = op.y0, yb = op.y1, paper = { paint: 0, col: PAPER, rough: 0.85, emit: 0, grain: 0.3 };
  for (const [x0, x1] of [[op.x0, 0], [0, op.x1]]) for (const dir of [1, -1]) {
    const z = dir * LEAF_Z, xa = x0 + st, xb = x1 - st, y0 = ya + kick, y1 = yb - st;
    painted(b, paper); leafBox(b, x0, x1, ya, yb); b.face(x0, x1, ya, yb, dir * 0.05, dir);
    b.set({ col: DARK, emit: 0, rough: 0.55, grain: 0.7, gx: 1, gy: 0 });
    b.face(x0, xa, ya, yb, z, dir); b.face(xb, x1, ya, yb, z, dir);
    b.set({ gx: 0, gy: 1 });
    b.face(xa, xb, y1, yb, z, dir); b.face(xa, xb, ya, ya + st, z, dir); b.face(xa, xb, y0 - 0.12, y0, z, dir);
    painted(b, { pitch: 0.34 }); leafBox(b, x0, x1, ya, yb); b.face(xa, xb, ya + st, y0 - 0.12, z - dir * 0.02, dir);
    noLeak(b); b.set({ paint: 0, col: DARK, rough: 0.55, grain: 0, pitch: 0 });
    for (let i = 1; i < 3; i++) { const x = xa + (xb - xa) * i / 3; b.face(x - 0.045, x + 0.045, y0, y1, dir * 0.07, dir); }
    for (let j = 1; j < 7; j++) { const y = y0 + (y1 - y0) * j / 7; b.face(xa, xb, y - 0.045, y + 0.045, dir * 0.07, dir); }
  }
  return { name: 'paper screen', b, width: w, height: h, arched: false };
}

// 6. a blue island door: two boarded leaves in a limewashed frame, iron studs set out in patterns, two bar pulls
function kindIsland() {
  const b = makeBuilder(), w = 4.4, h = 8.2, BLUE = [0.022, 0.13, 0.42], LIME = [0.6, 0.6, 0.57];
  b.fp = 0;
  const op = rectFrame(b, w, h, 0.34, 0.5, 0.14, LIME, STONE), ya = op.y0, yb = op.y1, blue = { paint: 0, col: BLUE, pitch: 0.465 };
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? op.x0 : 0, x1 = s < 0 ? 0 : op.x1, cx = (x0 + x1) / 2;
    painted(b, blue); leafBox(b, x0, x1, ya, yb);
    b.face(x0, x1, ya, yb, LEAF_Z, 1); b.face(x0, x1, ya, yb, -LEAF_Z, -1);
    iron(b);
    const S = (x, y, r = 0.075) => stud(b, cx + x, ya + y, LEAF_Z, 1, r, 0.07, true);
    for (let i = 0; i < 5; i++) { S(-0.6, 1.0 + i * 1.0); S(0.6, 1.0 + i * 1.0); }                  // two uprights
    for (let i = 1; i < 6; i++) { const a = i / 6 * Math.PI; S(-0.6 * Math.cos(a), 5.0 + 1.5 * Math.sin(a)); }   // an arch over them
    for (const y of [2.0, 3.3]) for (let i = -2; i <= 2; i++) S(i * 0.2, y - Math.abs(i) * 0.16, 0.06);  // chevrons between
    for (let i = -2; i <= 2; i++) S(i * 0.32, 0.4, 0.06);                                          // a row at the foot
    b.box(cx - s * 0.52 - 0.07, cx - s * 0.52 + 0.07, ya + 3.75, ya + 4.75, LEAF_Z, LEAF_Z + 0.03, 'k');      // an upright bar pull
    b.box(cx - s * 0.52 - 0.045, cx - s * 0.52 + 0.045, ya + 3.9, ya + 4.6, LEAF_Z + 0.08, LEAF_Z + 0.13);
    painted(b, { paint: 0, col: [BLUE[0] * 0.85, BLUE[1] * 0.85, BLUE[2] * 0.85], gx: 0, gy: 1 }); noLeak(b);
    for (const y of [ya + 0.9, ya + 3.8, yb - 0.9]) b.box(x0 + 0.1, x1 - 0.1, y - 0.2, y + 0.2, -LEAF_Z - 0.07, -LEAF_Z, 'f');
  }
  keyhole(b, 0.13, ya + 4.3, LEAF_Z, 1);
  return { name: 'island studded', b, width: w, height: h, arched: false };
}

// 7. a painted farm door: two framed leaves, their fields of slanted boards meeting in chevrons; straps and a drop bar
function kindFarm() {
  const b = makeBuilder(), w = 4.7, h = 7.9, pitch = 0.4, st = 0.34;
  const op = rectFrame(b, w, h, 0.34, 0.36, 0.14, WHITE, OAK), ya = op.y0, yb = op.y1, ym = (ya + yb) / 2;
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? op.x0 : 0, x1 = s < 0 ? 0 : op.x1;
    for (const dir of [1, -1]) {
      const z = dir * LEAF_Z;
      painted(b); leafBox(b, x0, x1, ya, yb);
      b.face(x0, x0 + st, ya, yb, z, dir); b.face(x1 - st, x1, ya, yb, z, dir);
      b.set({ gx: 0, gy: 1 });
      for (const [y0, y1] of [[ya, ya + st], [ym - st / 2, ym + st / 2], [yb - st, yb]]) b.face(x0 + st, x1 - st, y0, y1, z, dir);
      let k = 0;
      for (const [y0, y1] of [[ya + st, ym - st / 2], [ym + st / 2, yb - st]]) {
        painted(b, { pitch, gx: 0.7071, gy: 0.7071 * (k++ === 0 ? 1 : -1) * s, col: [0.92, 0.92, 0.92] }); leafBox(b, x0, x1, ya, yb);
        panel(b, x0 + st, x1 - st, y0, y1, z, dir, 0.045, 'flat', 0.05);
      }
    }
    iron(b);
    strap(b, s < 0 ? op.x0 : op.x1, ya + st / 2, -s * 1.5, LEAF_Z, 1, 0.14); strap(b, s < 0 ? op.x0 : op.x1, yb - st / 2, -s * 1.5, LEAF_Z, 1, 0.14);
  }
  iron(b); b.box(-1.45, 1.45, ym - 0.08, ym + 0.08, LEAF_Z + 0.05, LEAF_Z + 0.12);              // the drop bar in two keeps
  for (const x of [-1.1, 1.1]) b.box(x - 0.09, x + 0.09, ym - 0.17, ym + 0.17, LEAF_Z, LEAF_Z + 0.15, 'k');
  return { name: 'farm slanted boards', b, width: w, height: h, arched: false };
}

// 8. a door with two tall frosted panes over two sunk panels; a lever, a keyhole, three hinges
function kindPanes() {
  const b = makeBuilder(), w = 4.1, h = 8.0;
  const op = rectFrame(b, w, h, 0.32, 0.34, 0.14, WHITE, STONE), x0 = op.x0, x1 = op.x1, ya = op.y0, yb = op.y1;
  const X = [x0, x0 + 0.46, -0.13, 0.13, x1 - 0.46, x1], yl = ya + 0.66, m0 = ya + 2.3, m1 = ya + 2.86, yt = yb - 0.5;
  for (const dir of [1, -1]) {
    const z = dir * LEAF_Z;
    painted(b); leafBox(b, x0, x1, ya, yb);
    panelFace(b, X, [ya, yl, m0, m1], z, dir, 0.05, dir > 0 ? 'field' : 'flat');
    for (let i = 0; i < 6; i += 2) b.face(X[i], X[i + 1], m1, yb, z, dir);
    b.set({ gx: 0, gy: 1 }); for (let i = 1; i < 5; i += 2) b.face(X[i], X[i + 1], yt, yb, z, dir);
    b.set({ gx: 1, gy: 0 }); for (let i = 1; i < 5; i += 2) pane(b, X[i], X[i + 1], m1, yt, z, dir);
    iron(b, BRASS); b.set({ rough: 0.3 }); lever(b, x1 - 0.23, m1 - 0.3, z, dir, -1);
    keyhole(b, x1 - 0.23, m0 - 0.5, z, dir);
  }
  iron(b); for (const y of [ya + 0.8, ya + 3.6, yb - 0.8]) b.box(x0 - 0.02, x0 + 0.07, y - 0.18, y + 0.18, LEAF_Z, LEAF_Z + 0.07, 'k');
  return { name: 'two frosted panes', b, width: w, height: h, arched: false };
}

// 9. a louvred door: two leaves, each with two fields of sloping slats; between the slats shows a backing in the door's own paint at half tone
function kindLouvred() {
  const b = makeBuilder(), w = 4.4, h = 8.3, st = 0.3, step = 0.25;
  const op = rectFrame(b, w, h, 0.32, 0.34, 0.14, WHITE, STONE), ya = op.y0, yb = op.y1, ym = ya + 3.0;
  const fields = [[ya + 0.5, ym - 0.18], [ym + 0.18, yb - 0.36]];
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? op.x0 : 0, x1 = s < 0 ? 0 : op.x1, xa = x0 + st, xb = x1 - st;
    for (const dir of [1, -1]) {
      const z = dir * LEAF_Z;
      painted(b); leafBox(b, x0, x1, ya, yb);
      b.face(x0, xa, ya, yb, z, dir); b.face(xb, x1, ya, yb, z, dir);
      b.set({ gx: 0, gy: 1 });
      b.face(xa, xb, ya, fields[0][0], z, dir); b.face(xa, xb, fields[0][1], fields[1][0], z, dir); b.face(xa, xb, fields[1][1], yb, z, dir);
    }
    for (const [y0, y1] of fields) {
      noLeak(b); b.set({ paint: 1, col: [0.5, 0.5, 0.5], rough: 0.9, metal: 0, emit: 0, grain: 0, pitch: 0 });
      b.face(xa, xb, y0, y1, 0.0, 1); b.face(xa, xb, y0, y1, 0.0, -1);                        // the backing between the slats: the door's own paint at half tone
      painted(b, { gx: 0, gy: 1, grain: 0.6 }); noLeak(b);
      const nsl = Math.floor((y1 - y0) / step);
      for (let i = 0; i < nsl; i++) {
        const yl = y0 + (y1 - y0) * i / nsl, yh = yl + (y1 - y0) / nsl + 0.03, zf = LEAF_Z - 0.015, zk = -LEAF_Z + 0.015;
        b.quad([xa, yl, zf], [xb, yl, zf], [xb, yh, zk], [xa, yh, zk]);                       // a slat: its upper side, its under side
        b.quad([xb, yl, zf], [xa, yl, zf], [xa, yh, zk], [xb, yh, zk]);
      }
    }
    iron(b, BRASS); b.set({ rough: 0.3 }); knob(b, s * 0.15, ym, LEAF_Z, 1, 0.085);
    iron(b); for (const y of [ya + 0.8, ym, yb - 0.8]) b.box(s < 0 ? x0 - 0.02 : x1 - 0.07, s < 0 ? x0 + 0.07 : x1 + 0.02, y - 0.18, y + 0.18, LEAF_Z, LEAF_Z + 0.07, 'k');
  }
  return { name: 'louvred', b, width: w, height: h, arched: false };
}

// 10. a ledged cottage door: boards, three ledges and a Z of braces on its face, T hinges, a thumb latch; a ring behind
function kindCottage() {
  const b = makeBuilder(), w = 3.9, h = 7.2, pitch = 0.41;
  const op = rectFrame(b, w, h, 0.3, 0.32, 0.14, WHITE, OAK), x0 = op.x0, x1 = op.x1, ya = op.y0, yb = op.y1, yc = (ya + yb) / 2;
  painted(b, { pitch }); leafBox(b, x0, x1, ya, yb);
  b.face(x0, x1, ya, yb, LEAF_Z, 1); b.face(x0, x1, ya, yb, -LEAF_Z, -1);
  const ledges = [ya + 0.75, yc, yb - 0.75], zl = LEAF_Z + 0.075, L = LEAF_Z;
  painted(b, { gx: 0, gy: 1, col: [0.92, 0.92, 0.92] }); noLeak(b);
  for (const y of ledges) b.box(x0 + 0.1, x1 - 0.1, y - 0.22, y + 0.22, L, zl, 'k');
  for (let i = 0; i < 2; i++) {
    const y0 = ledges[i] + 0.22, y1 = ledges[i + 1] - 0.22, xa = x0 + 0.2, xb = x1 - 0.2, t = 0.34, zf = L + 0.06;
    b.set({ gx: 0.55, gy: -0.83 });
    b.quad([xa, y0, zf], [xa + t, y0, zf], [xb, y1, zf], [xb - t, y1, zf]);
    b.quad([xa + t, y0, L], [xb, y1, L], [xb, y1, zf], [xa + t, y0, zf]);
    b.quad([xb - t, y1, L], [xa, y0, L], [xa, y0, zf], [xb - t, y1, zf]);
  }
  iron(b);
  strap(b, x0, ledges[0], 1.5, zl, 1, 0.13); strap(b, x0, ledges[2], 1.5, zl, 1, 0.13);
  b.box(x1 - 0.42, x1 - 0.28, yc + 0.5, yc + 1.2, L, L + 0.03, 'k');                         // a thumb latch
  b.box(x1 - 0.39, x1 - 0.31, yc + 0.62, yc + 1.08, L + 0.08, L + 0.13);
  b.box(x1 - 0.9, x1 - 0.05, yc + 0.8, yc + 0.92, -L - 0.06, -L, 'f');
  ringPull(b, x1 - 0.48, yc + 0.1, -L, -1, 0.2); keyhole(b, x1 - 0.48, yc - 0.7, -L, -1); keyhole(b, x1 - 0.35, yc - 0.7, L, 1);
  return { name: 'cottage ledged', b, width: w, height: h, arched: false };
}

// 11. a plain flush door: a smooth leaf, steel kick and push plates, a lever, a narrow frosted slit, a frosted light over it
function kindFlush() {
  const b = makeBuilder(), w = 3.9, h = 7.9, STEEL = [0.36, 0.37, 0.38], smooth = { grain: 2.35, rough: 0.42 };       // grain over 2: its panels are drawn by the material
  const op = rectFrame(b, w, h, 0.22, 0.24, 0.1, WHITE, STONE), x0 = op.x0, x1 = op.x1, ya = op.y0, yb = op.y1, yt = yb - 1.25;
  framed(b, { gx: 0, gy: 1 }); b.box(x0, x1, yt, yt + 0.2, -0.165, 0.165, 'lrd');             // the transom
  yface(b, yt, x0, x1, LEAF_Z, 0.165, -1, 1, 0.12); yface(b, yt, x0, x1, -LEAF_Z, -0.165, -1, 1, 0.12);
  noLeak(b); b.set(GLASS_STATE); b.set({ pitch: 0, spill: 0, metal: 0 });
  b.face(x0, x1, yt + 0.2, yb, 0.04, 1); b.face(x0, x1, yt + 0.2, yb, -0.04, -1);
  framed(b); for (const dir of [1, -1]) b.face(-0.04, 0.04, yt + 0.2, yb, dir * 0.07, dir);
  const sx0 = x1 - 0.95, sx1 = x1 - 0.62, sy0 = ya + 3.3, sy1 = ya + 5.5;
  for (const dir of [1, -1]) {
    const z = dir * LEAF_Z, pl = (xa, xb, y0, y1, t) => b.box(xa, xb, y0, y1, dir > 0 ? z : z - t, dir > 0 ? z + t : z, dir > 0 ? 'k' : 'f');
    painted(b, smooth); leafBox(b, x0, x1, ya, yt);
    b.face(x0, sx0, ya, yt, z, dir); b.face(sx1, x1, ya, yt, z, dir); b.face(sx0, sx1, ya, sy0, z, dir); b.face(sx0, sx1, sy1, yt, z, dir);
    pane(b, sx0, sx1, sy0, sy1, z, dir, 0.045);
    iron(b, STEEL); b.set({ rough: 0.35 });
    pl(x0 + 0.06, x1 - 0.06, ya + 0.05, ya + 0.85, 0.015); pl(x1 - 0.46, x1 - 0.12, ya + 3.6, ya + 4.6, 0.015);
    lever(b, x1 - 0.29, ya + 3.05, z, dir, -1);
  }
  iron(b, STEEL); for (const y of [ya + 0.9, ya + 3.3, yt - 0.9]) b.box(x0 - 0.02, x0 + 0.07, y - 0.2, y + 0.2, LEAF_Z, LEAF_Z + 0.07, 'k');
  return { name: 'flush plain', b, width: w, height: h, arched: false };
}

// 12. a low wicket in a wide board gate: the gate does not open; the light leaks round the wicket alone
function kindWicket() {
  const b = makeBuilder(), w = 4.7, h = 7.7, pitch = 0.47, POST = [0.15, 0.095, 0.05], L = LEAF_Z;
  b.fp = 0; b.strong = 1;
  b.noHalo = true;
  const op = rectFrame(b, w, h, 0.36, 0.4, 0.12, POST, POST), x0 = op.x0, x1 = op.x1, ya = op.y0, yb = op.y1;
  const wx0 = 0.12, wx1 = 1.74, wy1 = ya + 4.1, wick = { pitch, col: [0.94, 0.94, 0.94] };
  for (const dir of [1, -1]) {
    const z = dir * L;
    painted(b, { pitch }); noLeak(b);
    b.face(x0, wx0, ya, yb, z, dir); b.face(wx1, x1, ya, yb, z, dir); b.face(wx0, wx1, wy1, yb, z, dir);
    painted(b, wick); leafBox(b, wx0, wx1, ya, wy1); b.face(wx0, wx1, ya, wy1, z, dir);
  }
  painted(b, { col: [0.86, 0.86, 0.86] }); noLeak(b);                                         // the wicket's raised border
  b.box(wx0 - 0.15, wx0 - 0.03, ya, wy1 + 0.15, L, L + 0.05, 'k'); b.box(wx1 + 0.03, wx1 + 0.15, ya, wy1 + 0.15, L, L + 0.05, 'k');
  b.set({ gx: 0, gy: 1 }); b.box(wx0 - 0.03, wx1 + 0.03, wy1 + 0.03, wy1 + 0.15, L, L + 0.05, 'k');
  const rails = [[x0 + 0.1, x1 - 0.1, ya + 5.0], [x0 + 0.1, x1 - 0.1, ya + 6.55], [x0 + 0.1, wx0 - 0.25, ya + 1.5], [wx1 + 0.25, x1 - 0.1, ya + 1.5]];
  for (const [xa, xb, y] of rails) {                                                          // cross rails with studs, before and behind
    painted(b, { gx: 0, gy: 1, col: [0.9, 0.9, 0.9] }); noLeak(b);
    b.box(xa, xb, y - 0.22, y + 0.22, L, L + 0.08, 'k'); b.box(xa, xb, y - 0.2, y + 0.2, -L - 0.07, -L, 'f');
    iron(b); const ns = Math.max(1, Math.round((xb - xa) / 0.47));
    for (let i = 0; i < ns; i++) stud(b, xa + (xb - xa) * (i + 0.5) / ns, y, L + 0.08, 1, 0.07, 0.06, true);
  }
  iron(b);
  strap(b, x0, ya + 5.0, 2.0, L + 0.08, 1, 0.13); strap(b, x0, ya + 1.5, 1.2, L + 0.08, 1, 0.13);
  strap(b, wx1, ya + 0.75, -1.0, L, 1, 0.12); strap(b, wx1, ya + 3.35, -1.0, L, 1, 0.12);
  ringPull(b, wx0 + 0.36, ya + 2.15, L, 1, 0.17); keyhole(b, wx0 + 0.36, ya + 1.35, L, 1); keyhole(b, wx0 + 0.36, ya + 1.9, -L, -1);
  return { name: 'wicket in a gate', b, width: w, height: h, arched: false };
}

const KINDS = [kindTown, kindStable, kindCourtyard, kindCoast, kindPaper, kindIsland, kindFarm, kindPanes, kindLouvred, kindCottage, kindFlush, kindWicket];

// THE MARKED DOOR'S FLOWERS, dealt once from a stream of their own: on each face twelve to sixteen, each with a middle
// in the leaf's own coordinates (x from the leaf's middle, y from the springing), a radius of 0.25 to 0.45 m, five or
// six petals, one of two pinks and a turn. Each takes, out of a handful of dealt places, the one that stands farthest
// from the flowers already there (so they scatter loosely and evenly); none is cut by the leaf's edge, none touches
// another, none lies under the brass. r, ys: the leaf's radius and springing; keep: the brass's box on each face
// (y from the foot). Returns 32 fours [x, y, radius, code]: sixteen for the outer face, sixteen for the inner; a
// radius of 0 is no flower. code: 1 for six petals + 2 for the stronger pink + the turn as a share of one petal.
function dealFlowers(rnd, r, ys, keep) {
  const out = [];
  for (let face = 0; face < 2; face++) {
    const n = 12 + Math.floor(rnd() * 5), k = keep[face], placed = [];
    for (let i = 0; i < n; i++) {
      const R = 0.25 + 0.2 * rnd(), code = (rnd() < 0.5 ? 1 : 0) + (rnd() < 0.45 ? 2 : 0) + 0.98 * rnd();
      let best = null, room = 0.1;
      for (let c = 0; c < 60 && (c < 8 || !best); c++) {
        const x = (2 * rnd() - 1) * r, y = -ys + rnd() * (ys + r);
        const inside = y > 0 ? r - Math.hypot(x, y) : Math.min(r - Math.abs(x), y + ys);
        let clear = Math.min(inside - 0.15, Math.hypot(Math.max(k[0] - x, 0, x - k[1]), Math.max(k[2] - ys - y, 0, y - k[3] + ys)) - 0.1) - R;
        for (const f of placed) clear = Math.min(clear, Math.hypot(x - f[0], y - f[1]) - f[2] - R);
        if (clear > room) { room = clear; best = [x, y, R, code]; }
      }
      if (best) placed.push(best);
    }
    for (let i = 0; i < 16; i++) out.push(placed[i] || [0, 0, 0, 0]);
  }
  return out;
}
// ---- the join -----------------------------------------------------------------------------------------------------------
export async function makeDoorKinds(ctx, o) {
  const THREE = o.THREE;
  const U = { uTime: { value: 0 }, uLeakGain: { value: 2.5 },
    uMarkPaint: { value: new THREE.Color(0.55, 0.545, 0.52) }, uMarkLeak: { value: new THREE.Vector3(1.3, 1.2, 1.02) },      // (the white paint's own colour, as the light takes it)
    uMarkGeo: { value: new THREE.Vector2() }, uMarkHand: { value: new THREE.Vector4() }, uFlowers: { value: [] },
    uShade: { value: new THREE.Vector3(0.16, 0.14, 0.11) }, uMarkShade: { value: new THREE.Vector3(0.34, 0.3, 0.24) },
    uDoorSun: shedSunUniform, uBars: shedBarsUniform };
  if (!shedSunUniform.value) shedSunUniform.value = new THREE.Vector3(0.15, 0.5, -0.85).normalize();   // the shed sets it when it is built
  const material = makeDoorMaterial(THREE, U, false), markedMaterial = makeDoorMaterial(THREE, U, true);
  const kinds = [], made = [];
  for (const make of KINDS) {
    const k = make();
    const geometry = k.b.geometry(THREE); made.push(geometry);
    kinds.push({ name: k.name, geometry, material, width: k.width, height: k.height, arched: k.arched, triangles: k.b.triangles() });
    await ctx.yield();
  }
  // the marked door: the courtyard kind about the plan's opening (4.5 by 8.7, round-headed, its foot at y = 0), in two pieces
  const bf = makeBuilder(), bl = makeBuilder(), mr = MARKED.w / 2, mfw = 0.36, mw = MARKED.w + 2 * mfw, mys = MARKED.h - mr;
  courtyardInto(bf, bl, { w: mw, top: mys + mw / 2, fw: mfw, r: mr, y0: 0, ys: mys, pitch: 0.5, n: 14, yb: -0.22, fine: true });
  bf.marks = bl.marks = 1;
  const frameG = bf.geometry(THREE), leafG = bl.geometry(THREE); made.push(frameG, leafG);
  // its white paint: the leaf's radius and springing, the middle of what the hand takes on each face (in the leaf's
  // own coordinates), and the flowers dealt clear of the brass from a stream of their own
  const hand = [bl.classBox(1, 2.5), bl.classBox(-1, 2.5)], mid = (h) => [(h[0] + h[1]) / 2, (h[2] + h[3]) / 2 - mys];
  U.uMarkGeo.value.set(mr, mys); U.uMarkHand.value.set(...mid(hand[0]), ...mid(hand[1]));
  const rnd = o.rngFor ? o.rngFor('marked-flowers') : ((s) => () => (s = s * 16807 % 2147483647) / 2147483647)(20231);
  U.uFlowers.value = dealFlowers(rnd, mr, mys, [bl.classBox(1, 1.5), bl.classBox(-1, 1.5)]).map((f) => new THREE.Vector4(f[0], f[1], f[2], f[3]));
  await ctx.yield();
  return {
    kinds,
    marked: { frame: { geometry: frameG, material: markedMaterial }, leaf: { geometry: leafG, material: markedMaterial },
      hingeX: -mr, width: mw, height: mys + mw / 2 + 0.1, arched: true, triangles: bf.triangles() + bl.triangles() },
    leakUniforms: U,
    update(dt, time) { U.uTime.value = time; },
    dispose() { for (const g of made) g.dispose(); material.dispose(); markedMaterial.dispose(); },
  };
}
