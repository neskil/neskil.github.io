// valley-inside-the-works: THE PIPES' IRON (the world builder's): one merged mesh of everything of metal on the
// seven glass pipes and everything that carries them. THE FITTINGS, of bare steel, which join the straight glass
// lengths (the glass is never bent): the mitred elbow that turns each riser into its run, the dog-leg that brings
// each of the three outermost down to its port; a bolted flange wherever glass meets steel. THE FEET: each riser's
// painted iron shoe and (the one thing in this mesh that is not metal) the stone pad it stands on in the pool, made
// in …-pipes-feet.js; the great pipe's iron, made in …-pipes-great.js. ON THE GLASS: a flanged joint (two bolted
// rings) every 6 m. THE GANTRY, painted: a
// riveted lattice cross-beam at every column row from z -20 to z -220 (springing on a bracket from the column at
// x = 14, hung at its far end in a stirrup of two rods from the roof's girder), and on each beam, for each pipe, a
// steel saddle clamp on an iron post of the pipe's own height (the rank is stepped), the posts' heads joined by one
// raking tie (at the first beam, which the risers pass behind, each riser is clamped to the beam's back instead).
// No walkway, no valve wheels, no gauges, nothing lettered.
// Every vertex carries: position, normal, colour, and aPaint (u, v, kind): what the shader paints on that face
//   kind 0 plain   kind 1 a flange's rim (u: -1..1 across the pair; the dark seam between the two rings)
//   kind 2 a flange's face (u, v: place on the face in flange radii; the ring of bolts)
//   kind 3 and over: a riveted plate (u: metres along; v: metres across; kind - 3 is how far either side of the
//   middle line the two rows of rivets run, 0 for one row down the middle)
//   kind -1 dressed stone (the pads under the pipes' shoes): no paint to chip, no gloss
// colours are linear (they go straight into the vertex colours): a worn sage green, its shadowed tone, the bright
// bare steel of the clamps' straps, and the duller bare steel of the fittings (elbows, dog-legs: `plate`)
// (the sage is set to come out as the green of the shed's columns do, so that a beam and the column it
// springs from are one ironwork; the shed's own paint number is deeper, as its shader adds a bounce light to it)
export const IRON = { sage: [0.44, 0.55, 0.45], sageDark: [0.33, 0.43, 0.35], steel: [0.7, 0.73, 0.75], plate: [0.4, 0.42, 0.44] };

export function ironMaker() {
  const pos = [], nor = [], col = [], paint = [], idx = [];
  const M = {
    pos, nor, col, paint, idx,
    v(p, n, c, u = 0, w = 0, k = 0) { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); col.push(c[0], c[1], c[2]); paint.push(u, w, k); return pos.length / 3 - 1; },
    // a flat four-cornered face a, b, c, d (counter-clockwise seen from its front), with paint coordinates per corner
    quad(a, b, c, d, n, colr, k = 0, uv = null) {
      const q = uv || [[0, 0], [0, 0], [0, 0], [0, 0]];
      const i0 = M.v(a, n, colr, q[0][0], q[0][1], k), i1 = M.v(b, n, colr, q[1][0], q[1][1], k), i2 = M.v(c, n, colr, q[2][0], q[2][1], k), i3 = M.v(d, n, colr, q[3][0], q[3][1], k);
      idx.push(i0, i1, i2, i0, i2, i3);
    },
    // a box about centre c with unit axes X, Y, Z and half sizes hx, hy, hz. faces: which of +x -x +y -y +z -z to make
    // (a string of the letters 'XxYyZz'). kind 3 paints rivets along X on the faces named in `riveted`.
    box(c, X, Y, Z, hx, hy, hz, colr, faces = 'XxYyZz', riveted = '') {
      const at = (sx, sy, sz) => [c[0] + sx * hx * X[0] + sy * hy * Y[0] + sz * hz * Z[0], c[1] + sx * hx * X[1] + sy * hy * Y[1] + sz * hz * Z[1], c[2] + sx * hx * X[2] + sy * hy * Y[2] + sz * hz * Z[2]];
      const neg = (a) => [-a[0], -a[1], -a[2]];
      const face = (name, n, a, b, cc, d, across, flip) => {
        if (!faces.includes(name)) return;
        if (!riveted.includes(name)) { M.quad(a, b, cc, d, n, colr, 0, null); return; }
        const u0 = flip ? hx : -hx, kind = 3 + (across > 0.2 ? across - 0.11 : 0);
        M.quad(a, b, cc, d, n, colr, kind, [[u0, -across], [-u0, -across], [-u0, across], [u0, across]]);
      };
      face('X', X, at(1, -1, 1), at(1, -1, -1), at(1, 1, -1), at(1, 1, 1), 0, false);
      face('x', neg(X), at(-1, -1, -1), at(-1, -1, 1), at(-1, 1, 1), at(-1, 1, -1), 0, false);
      face('Y', Y, at(-1, 1, 1), at(1, 1, 1), at(1, 1, -1), at(-1, 1, -1), hz, false);
      face('y', neg(Y), at(-1, -1, -1), at(1, -1, -1), at(1, -1, 1), at(-1, -1, 1), hz, false);
      face('Z', Z, at(-1, -1, 1), at(1, -1, 1), at(1, 1, 1), at(-1, 1, 1), hy, false);
      face('z', neg(Z), at(1, -1, -1), at(-1, -1, -1), at(-1, 1, -1), at(1, 1, -1), hy, true);
    },
    // a many-sided sleeve between two points a and b with radii ra, rb (open ended), smooth round its axis
    sleeve(a, b, ra, rb, sides, colr, k = 0) {
      const T = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(T[0], T[1], T[2]) || 1; T[0] /= len; T[1] /= len; T[2] /= len;
      const ref = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const E1 = unit(cross(ref, T)), E2 = cross(T, E1);
      const first = pos.length / 3;
      for (let j = 0; j <= sides; j++) {
        const f = (j / sides) * Math.PI * 2, cf = Math.cos(f), sf = Math.sin(f), n = [cf * E1[0] + sf * E2[0], cf * E1[1] + sf * E2[1], cf * E1[2] + sf * E2[2]];
        M.v([a[0] + ra * n[0], a[1] + ra * n[1], a[2] + ra * n[2]], n, colr, -1, j / sides, k);
        M.v([b[0] + rb * n[0], b[1] + rb * n[1], b[2] + rb * n[2]], n, colr, 1, j / sides, k);
      }
      for (let j = 0; j < sides; j++) { const q = first + j * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
    },
    // a flat ring (an annulus) about centre c, facing along T (unit), from radius r0 to r1; kind 2 paints bolts on it
    ring(c, T, r0, r1, sides, colr, k = 0, unitR = 1) {
      const ref = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const E1 = unit(cross(ref, T)), E2 = cross(T, E1), first = pos.length / 3;
      for (let j = 0; j <= sides; j++) {
        const f = (j / sides) * Math.PI * 2, cf = Math.cos(f), sf = Math.sin(f), d = [cf * E1[0] + sf * E2[0], cf * E1[1] + sf * E2[1], cf * E1[2] + sf * E2[2]];
        M.v([c[0] + r0 * d[0], c[1] + r0 * d[1], c[2] + r0 * d[2]], T, colr, cf * r0 / unitR, sf * r0 / unitR, k);
        M.v([c[0] + r1 * d[0], c[1] + r1 * d[1], c[2] + r1 * d[2]], T, colr, cf * r1 / unitR, sf * r1 / unitR, k);
      }
      for (let j = 0; j < sides; j++) { const q = first + j * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    },
    // a round pipe of radius r lying in the plane x = const, along the corners pts ([y, z] each): straight pieces
    // mitred into one another, each with its own normals, so that the welds between them show (a bend fabricated
    // of steel, as large steel elbows are). At a corner both pieces end on the same ring: the pipe's round as the
    // mitre plane cuts it, which is its circle stretched along that plane by 1 / cos(half the turn).
    mitred(x, pts, r, sides, colr) {
      const n = pts.length, dir = [];
      for (let j = 0; j + 1 < n; j++) { const dy = pts[j + 1][0] - pts[j][0], dz = pts[j + 1][1] - pts[j][1], l = Math.hypot(dy, dz) || 1; dir.push([dy / l, dz / l]); }
      const across = (j) => {                                    // the mitre ring's direction in the plane, at corner j
        const a = dir[Math.max(j - 1, 0)], b = dir[Math.min(j, n - 2)];
        let by = a[0] + b[0], bz = a[1] + b[1]; const l = Math.hypot(by, bz) || 1; by /= l; bz /= l;
        const c = Math.max(by * a[0] + bz * a[1], 0.3);
        return [bz / c, -by / c];
      };
      for (let j = 0; j + 1 < n; j++) {
        const A = across(j), B = across(j + 1), d = dir[j], first = pos.length / 3;
        for (let q = 0; q <= sides; q++) {
          const f = (q / sides) * Math.PI * 2, cf = Math.cos(f), sf = Math.sin(f), nrm = [cf, sf * d[1], -sf * d[0]];
          M.v([x + r * cf, pts[j][0] + r * sf * A[0], pts[j][1] + r * sf * A[1]], nrm, colr);
          M.v([x + r * cf, pts[j + 1][0] + r * sf * B[0], pts[j + 1][1] + r * sf * B[1]], nrm, colr);
        }
        for (let q = 0; q < sides; q++) { const k = first + q * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
      }
    },
  };
  return M;
}
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function unit(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

// A FLANGED JOINT: two bolted iron rings clasped together round the pipe at c, along the unit axis T.
export function addJoint(M, c, T, r0 = 0.465, rf = 0.8, half = 0.2, sides = 10, rimKind = 1, colr = IRON.sage) {
  const a = [c[0] - half * T[0], c[1] - half * T[1], c[2] - half * T[2]], b = [c[0] + half * T[0], c[1] + half * T[1], c[2] + half * T[2]];
  M.sleeve(a, b, rf, rf, sides, colr, rimKind);
  M.ring(b, T, r0, rf, sides, colr, 2, rf);
  M.ring(a, [-T[0], -T[1], -T[2]], r0, rf, sides, colr, 2, rf);
}

// THE FLANGE WHERE A GLASS LENGTH MEETS A STEEL FITTING, at c along the unit axis T: the same pair of rings as a
// joint, of the fitting's bare steel, with its eight bolts standing through both rings as square heads and nuts
// (at the places where the faces' painted bolts lie: the ring's own angles, every 45 degrees). A little smaller
// than a joint's rings, so that the fitting between two of them is seen for what it is.
export function addFitFlange(M, c, T, rf = 0.72, half = 0.2) {
  addJoint(M, c, T, 0.465, rf, half, 10, 1, IRON.plate);
  const ref = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], E1 = unit(cross(ref, T)), E2 = cross(T, E1), rc = 0.82 * rf;
  for (let k = 0; k < 8; k++) {
    const f = k * Math.PI / 4, cf = Math.cos(f), sf = Math.sin(f);
    const R = [cf * E1[0] + sf * E2[0], cf * E1[1] + sf * E2[1], cf * E1[2] + sf * E2[2]], S = cross(T, R);
    M.box([c[0] + rc * R[0], c[1] + rc * R[1], c[2] + rc * R[2]], T, R, S, half + 0.09, 0.075, 0.075, IRON.plate);
  }
}
// A STEEL BEND of the fittings' radius r in the plane x = const: its corners pts ([y, z] each) are those of the
// mitred pieces (see M.mitred), with a fitting's flange on every end named in `flanged` (a list of 0 for the first
// end and 1 for the last).
export function addBend(M, x, pts, r, flanged) {
  M.mitred(x, pts, r, 10, IRON.plate);
  for (const e of flanged) {
    const a = pts[e ? pts.length - 1 : 0], b = pts[e ? pts.length - 2 : 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    addFitFlange(M, [x, a[0], a[1]], [0, (b[0] - a[0]) / l, (b[1] - a[1]) / l]);
  }
}

// A SADDLE CLAMP on a level pipe (centre line at x, y, running along z) over a beam whose top is at yTop: a steel
// strap round the pipe with two bolted lugs, on an iron POST of the pipe's own height: riveted up its four faces,
// with a foot plate on the beam's top chord and a cap plate under the strap.
export function addSaddle(M, x, y, z, yTop, rp = 0.45) {
  const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1], Zn = [0, 0, -1], rs = rp + 0.07;
  M.sleeve([x, y, z + 0.17], [x, y, z - 0.17], rs, rs, 8, IRON.steel);
  const yCap = y - rs + 0.06, h = (yCap - yTop) / 2;
  M.box([x, yTop + h, z], Y, X, Zn, h, 0.15, 0.12, IRON.sage, 'YyZz', h > 0.7 ? 'YyZz' : '');   // (its long axis first: rivets run up it)
  M.box([x, yTop + 0.05, z], X, Y, Z, 0.3, 0.05, 0.24, IRON.sage, 'XxYZz');
  M.box([x, yCap - 0.05, z], X, Y, Z, 0.27, 0.05, 0.2, IRON.sage, 'XxyZz');
  M.box([x - rs - 0.07, y, z], X, Y, Z, 0.1, 0.075, 0.2, IRON.steel, 'xYyZz');
  M.box([x + rs + 0.07, y, z], X, Y, Z, 0.1, 0.075, 0.2, IRON.steel, 'XYyZz');
}
// THE RAKING TIE through the heads of a beam's posts: a flat bar on either face of the posts, from (xa, ya) down to
// (xb, yb) at the cross-beam z = zb. It holds the tall posts as one stepped frame.
export function addRake(M, zb, xa, ya, xb, yb) {
  const dx = xb - xa, dy = yb - ya, l = Math.hypot(dx, dy) || 1, px = (-dy / l) * 0.075, py = (dx / l) * 0.075;
  for (const sz of [1, -1]) {
    const z = zb + 0.13 * sz;
    const c = [[xa - px, ya - py, z], [xb - px, yb - py, z], [xb + px, yb + py, z], [xa + px, ya + py, z]], uv = [[0, -0.075], [l, -0.075], [l, 0.075], [0, 0.075]];
    if (sz < 0) { c.reverse(); uv.reverse(); }                 // (the back bar is wound the other way round)
    M.quad(c[0], c[1], c[2], c[3], [0, 0, sz], IRON.sageDark, 3, uv);
  }
}
// A CLAMP on a standing pipe (centre line at x, z, upright): the same steel strap and bolted lugs as a saddle's,
// held off a beam's back face at zFace by a short arm.
export function addRiserClamp(M, x, y, z, zFace, rp = 0.45) {
  const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1], rs = rp + 0.07;
  M.sleeve([x, y - 0.17, z], [x, y + 0.17, z], rs, rs, 8, IRON.steel);
  const z0 = z + rs - 0.05, hz = (zFace - z0) / 2;
  M.box([x, y, z0 + hz], X, Y, Z, 0.13, 0.11, hz, IRON.sage, 'XxYy');
  M.box([x - rs - 0.07, y, z], X, Y, Z, 0.1, 0.2, 0.075, IRON.steel, 'xYyZz');
  M.box([x + rs + 0.07, y, z], X, Y, Z, 0.1, 0.2, 0.075, IRON.steel, 'XYyZz');
}

// A RIVETED LATTICE CROSS-BEAM at the column row z = zb: two riveted chords (top at yTop) with a double lattice of
// flat lacing bars between them, from the column at x = xCol out to xEnd; a quadrant bracket with a ring in its
// spandrel springing from the column; and at the far end a stirrup: a pair of rods from the roof girder's foot.
export function addBeam(M, zb, yTop, xCol, xEnd, yGirder) {
  const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1], depth = 1.6, ch = 0.13, x0 = xCol + 0.3, xm = (x0 + xEnd) / 2, hx = (xEnd - x0) / 2;
  const yBot = yTop - depth;
  M.box([xm, yTop - ch, zb], X, Y, Z, hx, ch, 0.3, IRON.sage, 'XYyZz', 'YZz');
  M.box([xm, yBot + ch, zb], X, Y, Z, hx, ch, 0.3, IRON.sage, 'XYyZz', 'yZz');
  // the lacing: crossed flat bars in two planes, the back plane half a panel out of step with the front
  const y0 = yBot + 2 * ch, y1 = yTop - 2 * ch, lx0 = xCol + 0.95, n = Math.max(4, Math.round((xEnd - 0.2 - lx0) / (y1 - y0))), w = (xEnd - 0.2 - lx0) / n, bw = 0.07;
  const bar = (xa, ya, xb, yb, z, nz) => {
    const dx = xb - xa, dy = yb - ya, l = Math.hypot(dx, dy), px = (-dy / l) * bw, py = (dx / l) * bw;
    const c = [[xa - px, ya - py, z], [xb - px, yb - py, z], [xb + px, yb + py, z], [xa + px, ya + py, z]];
    if (nz < 0) c.reverse();                                   // (a back bar is wound the other way round: it faces -z)
    M.quad(c[0], c[1], c[2], c[3], [0, 0, nz], IRON.sageDark);
  };
  for (let i = 0; i < n; i++) {
    const xa = lx0 + i * w, xb = xa + w;
    bar(xa, y0, xb, y1, zb + 0.22, 1); bar(xa, y1, xb, y0, zb + 0.22, 1);
    const xc = Math.min(xEnd - 0.2, xa + w / 2), xd = Math.min(xEnd - 0.2, xc + w);
    bar(xc, y0, xd, y1, zb - 0.22, -1); bar(xc, y1, xd, y0, zb - 0.22, -1);
  }
  // the end post, and the gusset plate against the column
  M.box([xEnd - 0.15, (yTop + yBot) / 2, zb], X, Y, Z, 0.15, depth / 2 - ch, 0.3, IRON.sage, 'XxZz');
  M.box([xCol + 0.6, (yTop + yBot) / 2, zb], X, Y, Z, 0.36, depth / 2 - ch, 0.26, IRON.sage, 'XZz', 'Zz');
  // the bracket: a quadrant rib from the column up to the bottom chord, with a ring in the spandrel
  const cx = xCol + 6.6, cy = yBot - 4.5, rx = 5.95, ry = 4.5, segs = 6;
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI / 2, a1 = ((i + 1) / segs) * Math.PI / 2;
    const p0 = [cx - rx * Math.cos(a0), cy + ry * Math.sin(a0)], p1 = [cx - rx * Math.cos(a1), cy + ry * Math.sin(a1)];
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy), D = [dx / l, dy / l, 0], N = [-dy / l, dx / l, 0];
    M.box([(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, zb], D, N, Z, l / 2 + 0.04, 0.12, 0.2, IRON.sage, 'YyZz', 'Zz');
  }
  M.ring([xCol + 1.64, yBot - 0.89, zb], Z, 0.62, 0.86, 10, IRON.sage);
  // THE FAR END IS HUNG IN A STIRRUP: a pair of rods comes down from the roof girder past the beam's two faces to
  // a yoke under its bottom chord, in which the beam's end sits; each rod has a nut under the yoke and a sleeve nut
  // half way up, and at their heads a plate lies bolted under the girder's bottom chord (yGirder). Nothing stands
  // on the beam's top beyond the last pipe.
  const xr = xEnd - 0.3;
  M.box([xr, yBot - 0.09, zb], X, Y, Z, 0.2, 0.08, 0.64, IRON.sage);
  M.box([xr, yGirder - 0.16, zb], X, Y, Z, 0.24, 0.07, 0.68, IRON.sage);
  for (const s of [-1, 1]) {
    const zr = zb + 0.45 * s, ym = (yTop + yGirder) / 2;
    M.sleeve([xr, yBot - 0.36, zr], [xr, yGirder - 0.02, zr], 0.11, 0.11, 6, IRON.sageDark);
    M.sleeve([xr, yBot - 0.36, zr], [xr, yBot - 0.17, zr], 0.19, 0.19, 6, IRON.sage);
    M.sleeve([xr, ym - 0.5, zr], [xr, ym + 0.5, zr], 0.2, 0.2, 6, IRON.sage);
  }
}
