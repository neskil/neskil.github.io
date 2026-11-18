// Four Stone Kings Over the River: the hero set piece.
// A front cut back into a natural sandstone bluff: a face 62 m wide battered seven degrees, four seated kings 24 m
// high to the tops of their double crowns, on pedestals 2 m high (three whole, one broken at the breast with the
// pieces of him lying before him), small standing figures by their legs, a dark door 10.5 m high between the middle
// pair with a hawk-headed figure in the niche over it, a roll and a deep hollow cornice with a row of squatting
// baboons along the top and swallows' nests under it, bands of worn relief on the cut plane; before it the terrace
// with its drifted sand and a broken parapet with small hawks on its piers; nothing built goes down to the river:
// the terrace ends in the land's own bank (the world lays it). To either side the bluff goes on as the world lays it (opts.bend, opts.top): level beds with ledges, a
// rounded brow, a ravine with a drift of sand. Plain weathered stone: no sign of any script anywhere.
//
// Local frame: origin at the middle of the door's threshold, +X along the face to the right as seen from the river
// (the world's s), +Z out of the face over the river (the world's d), +Y up; the terrace is y = 0.
// Every carved thing is CUT STONE: a list of blocks, each bounded by planes, meshed face by face with one normal to
// a face (a carved edge is a crease, never a rounded blend). How open each corner lies is read from the blocks' own
// field and kept in the corners; the sun's shade is read from a map of the front drawn once, in build, as the sun
// sees it. The bluff's own face is a surface z = wallZ(x, y). One sandstone shader draws all of it. (The lions of
// the temple's way, which the world sets out, are still modelled as smooth worn solids: the field code is theirs.)
// THINGS PLACED BY HOW THEY ARE SEEN FROM THE WAY: the list stands at the world's head
// (src/worlds/four-stone-kings-over-the-river.js). What of it lives in this file: THE DOOR'S RING stands DOOR_IN
// = two thirds of the passage (10.7 m) inside the face, so deep that the jambs hide it from any eye more than
// some thirty degrees off the door's axis and its light shows from before the door only. THE RING'S PLACE reads
// no lens, no share of the flight and no seed (DOOR_IN is a typed share of the passage). THE WAY TO THE DOOR is
// left open: the parapet's gap (WAY_HALF), and no small figure on the side of a middle king that looks into the
// way (FIGS: typed places). And, not a placing: what no place before the front could see is not drawn (unseen,
// BACK: a typed slant, the same for every eye).
// WHAT THIS FILE DOES READ OF THE SEED AND OF THE EYE, so that this head is whole: the world's seed, to name its
// streams (buildHero: stream), and the seed's own noise, handed in with it, for the wander of rock, terrace
// and sand; and the eye's place, in the stone's shader (one line: dist, the metres from the eye), for what is
// drawn fine (the marks', the sand's ripples' and the river's net's fade by distance, a joint's breadth) and
// for how coarse the shade's edge is taken from afar. Neither places a thing for the way: the streams deal the
// kings' wear and their small figures' heights, the parapet's lengths and which pier bears a hawk, the lying
// pieces' places and lie, the baboons and the nests, as any seeded scatter, the noise the wander of rock,
// terrace and sand, and none of it reads the route or the lens.
import * as THREE from 'three';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const hyp = (a, b, c = 0) => Math.sqrt(a * a + b * b + c * c);
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- distance field solids
// each solid: { f(x, y, z) -> metres, c: [x, y, z] and r of a bounding ball, k: blend radius, cut: true to carve }
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const smax = (a, b, k) => -smin(-a, -b, k);
function box(cx, cy, cz, hx, hy, hz, r = 0.2, k = 0.3, ry = 0) {
  const c = Math.cos(ry), s = Math.sin(ry);
  return { c: [cx, cy, cz], r: hyp(hx, hy, hz) + r, k, f: (x, y, z) => {
    const px = x - cx, pz = z - cz, qx = Math.abs(c * px - s * pz) - hx + r, qy = Math.abs(y - cy) - hy + r, qz = Math.abs(s * px + c * pz) - hz + r;
    return hyp(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
  } };
}
function ell(cx, cy, cz, rx, ry, rz, k = 0.3) {
  const m = Math.min(rx, ry, rz);
  return { c: [cx, cy, cz], r: Math.max(rx, ry, rz), k, f: (x, y, z) => {
    const px = x - cx, py = y - cy, pz = z - cz, k0 = hyp(px / rx, py / ry, pz / rz), k1 = hyp(px / (rx * rx), py / (ry * ry), pz / (rz * rz));
    return k1 < 1e-6 ? -m : k0 * (k0 - 1) / k1;
  } };
}
function cap(ax, ay, az, bx, by, bz, ra, rb = ra, k = 0.3) {
  const dx = bx - ax, dy = by - ay, dz = bz - az, l2 = dx * dx + dy * dy + dz * dz || 1;
  return { c: [(ax + bx) / 2, (ay + by) / 2, (az + bz) / 2], r: Math.sqrt(l2) / 2 + Math.max(ra, rb), k, f: (x, y, z) => {
    const px = x - ax, py = y - ay, pz = z - az, t = clamp((px * dx + py * dy + pz * dz) / l2, 0, 1);
    return hyp(px - dx * t, py - dy * t, pz - dz * t) - lerp(ra, rb, t);
  } };
}
const cut = (p, k = 0.15) => ({ ...p, k, cut: true });
// a field from a list of solids, in order; solids marked cut carve what stands before them in the list. Inside the
// box b the solids are sorted into blocks of bs metres, each block keeping only the solids within its reach, and the
// field is true up to REACH metres from stone and says REACH beyond (all that meshing, shade and occlusion ask).
const REACH = 1.6, FIELD_REACH = REACH;
// (the occlusion's two nearest readings ask no further than this: 0.05 + 0.62 * 0.8)
const FIELD_MID = 0.56;
function fieldOf(list, b, bs = 1.5) {
  const n = list.length, F = list.map((p) => p.f), CX = list.map((p) => p.c[0]), CY = list.map((p) => p.c[1]), CZ = list.map((p) => p.c[2]);
  const R = list.map((p) => p.r), K = list.map((p) => p.k), CUT = list.map((p) => !!p.cut);
  const nbx = Math.max(1, Math.ceil((b[3] - b[0]) / bs)), nby = Math.max(1, Math.ceil((b[4] - b[1]) / bs)), nbz = Math.max(1, Math.ceil((b[5] - b[2]) / bs)), hd = bs * 0.87, blocks = [];
  for (let k = 0; k < nbz; k++) for (let j = 0; j < nby; j++) for (let i = 0; i < nbx; i++) {
    const x = b[0] + (i + 0.5) * bs, y = b[1] + (j + 0.5) * bs, z = b[2] + (k + 0.5) * bs, own = [];
    for (let q = 0; q < n; q++) { const lb = hyp(x - CX[q], y - CY[q], z - CZ[q]) - R[q]; if (lb < hd + K[q] + (CUT[q] ? 0 : REACH)) own.push(q); }
    blocks.push(own);
  }
  return (x, y, z) => {
    const i = clamp(Math.floor((x - b[0]) / bs), 0, nbx - 1), j = clamp(Math.floor((y - b[1]) / bs), 0, nby - 1), k = clamp(Math.floor((z - b[2]) / bs), 0, nbz - 1), own = blocks[i + nbx * (j + nby * k)];
    let d = REACH;
    for (let o = 0; o < own.length; o++) {
      const q = own[o], lb = hyp(x - CX[q], y - CY[q], z - CZ[q]) - R[q];
      if (CUT[q]) { if (lb < K[q]) d = smax(d, -F[q](x, y, z), K[q]); }
      else if (lb < d + K[q]) d = smin(d, F[q](x, y, z), K[q]);
    }
    return d;
  };
}

// ---------------------------------------------------------------- the build in pieces
// The page is handed back between pieces of this part's work, and a piece is sized by COUNTED work, never by a
// clock: every loop tells the hand-back what it has done since it last told (its own count times what one of that
// count costs here, in milliseconds: the table COST), and the page is handed back when about PIECE milliseconds'
// worth has gone by. The engine waits for the next frame after any piece of six milliseconds or more, so a build
// cut into pieces just over six fills little more than a third of each frame and takes twice the frames; pieces of
// about a frame's length fill them. One count runs through the whole part, so the small jobs add up to full pieces too.
// A count that says too much makes more and smaller pieces (and each piece of six milliseconds or more takes a
// frame of its own: a longer build); a count that says too little makes a long piece. So every entry of the table
// is what its work lasts, as near as that can be told, and work that runs for the first time (cold code: the
// first king's) is counted COLD times over and told in smaller lots. PIECE is twelve counted milliseconds.
const PIECE = 12, COLD = 2.5;
// (a field's blocks are sorted this many cells at a time)
const FIELD_WORK = 40000;
// (one reading of a small figure's field; one cell scanned; one corner of a mesh placed; one corner's slope read
// from a kept grid; one corner baked on the wall; one column of the wall; one corner
// turned and shifted, or put in the one mesh)
const COST = { figure: 0.0047, cell: 0.00018, corner: 0.00063, slope: 0.00058, bakeWall: 0.0019, column: 0.19, place: 0.00013, sink: 0.000033,
  // (one block cut, moved or chipped; one cell a block is asked at, as a field's blocks are sorted; one block asked which of its faces lie inside another;
  //  one corner of a block's mesh made; one corner's openness read from the blocks; one triangle asked whether it is ever seen;
  //  one cell of the sun's map; one triangle set into it; one cell of it packed)
  block: 0.039, field: 0.000033, hide: 0.049, mesh: 0.00062, bakeBlock: 0.0022, unseen: 0.0011, sunCell: 0.00001, sunTri: 0.00013, sunPack: 0.000012 };
export function pieces(ask) {
  if (!ask) return null;
  if (ask.counted) return ask;
  let acc = 0;
  const f = (ms = PIECE) => { acc += ms; if (acc < PIECE) return null; acc = 0; return ask(); };
  f.counted = true;
  return f;
}

// ---------------------------------------------------------------- the field on a grid, and surface nets
// The field f on a grid of h metres inside the box b = [x0, y0, z0, x1, y1, z1], kept so that a surface can be
// drawn from it and shade marched through it cheaply. Every second point first; then the points between, only in
// blocks the surface can pass through (the field is a distance: a block whose corners are all further than its
// own reach from the surface holds none of it); the rest are filled in between and marked 2.
async function gridOf(f, b, h, tick, cost = COST.figure) {
  const nx = 2 * Math.ceil((b[3] - b[0]) / (2 * h)) + 1, ny = 2 * Math.ceil((b[4] - b[1]) / (2 * h)) + 1, nz = 2 * Math.ceil((b[5] - b[2]) / (2 * h)) + 1;
  const g = new Float32Array(nx * ny * nz), done = new Uint8Array(nx * ny * nz), at = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k += 2) {
    for (let j = 0; j < ny; j += 2) {
      for (let i = 0; i < nx; i += 2) { const q = at(i, j, k); g[q] = f(b[0] + i * h, b[1] + j * h, b[2] + k * h); done[q] = 1; }
      if (tick) await tick(cost * (nx + 1) / 2);
    }
  }
  const lim = 2.2 * h, cv8 = new Float32Array(8);
  for (let k0 = 0; k0 < nz - 1; k0 += 2) for (let j0 = 0; j0 < ny - 1; j0 += 2) {
    let read = 0;
    for (let i0 = 0; i0 < nx - 1; i0 += 2) {
      let lo = 1e9, neg = 0;
      for (let c = 0; c < 8; c++) { const v = g[at(i0 + 2 * (c & 1), j0 + 2 * ((c >> 1) & 1), k0 + 2 * (c >> 2))]; cv8[c] = v; lo = Math.min(lo, Math.abs(v)); if (v < 0) neg++; }
      const active = lo < lim || (neg !== 0 && neg !== 8);
      for (let dk = 0; dk < 3; dk++) for (let dj = 0; dj < 3; dj++) for (let di = 0; di < 3; di++) {
        const q = at(i0 + di, j0 + dj, k0 + dk);
        if (done[q] === 1) continue;
        if (active) { g[q] = f(b[0] + (i0 + di) * h, b[1] + (j0 + dj) * h, b[2] + (k0 + dk) * h); done[q] = 1; read++; }
        else if (!done[q]) {
          const tx = di / 2, ty = dj / 2, tz = dk / 2;
          g[q] = lerp(lerp(lerp(cv8[0], cv8[1], tx), lerp(cv8[2], cv8[3], tx), ty), lerp(lerp(cv8[4], cv8[5], tx), lerp(cv8[6], cv8[7], tx), ty), tz); done[q] = 2;
        }
      }
    }
    if (tick) await tick(0.3 * cost * read + COST.cell * nx * 2);
  }
  return { g, done, nx, ny, nz, b, h };
}
// trilinear read of a kept grid (metres to the surface); outside the box: 1e3, or the nearest value inside when held
function gridSample(G, hold = false) {
  const { g, nx, ny, nz, b, h } = G, cx = nx - 1, cy = ny - 1, cz = nz - 1, nxy = nx * ny;
  return (x, y, z) => {
    let fx = (x - b[0]) / h, fy = (y - b[1]) / h, fz = (z - b[2]) / h;
    if (fx < 0 || fy < 0 || fz < 0 || fx >= cx || fy >= cy || fz >= cz) {
      if (!hold) return 1e3;
      fx = clamp(fx, 0, cx - 1e-3); fy = clamp(fy, 0, cy - 1e-3); fz = clamp(fz, 0, cz - 1e-3);
    }
    const i = fx | 0, j = fy | 0, k = fz | 0, tx = fx - i, ty = fy - j, tz = fz - k, o = i + nx * (j + ny * k), o2 = o + nxy;
    const a0 = lerp(lerp(g[o], g[o + 1], tx), lerp(g[o + nx], g[o + nx + 1], tx), ty), a1 = lerp(lerp(g[o2], g[o2 + 1], tx), lerp(g[o2 + nx], g[o2 + nx + 1], tx), ty);
    return lerp(a0, a1, tz);
  };
}
// The zero surface of a kept grid as a mesh (surface nets). Normals are the slope of fn, read eps metres apart:
// fn is the field itself for a small figure, or a read of the kept grids for a king.
async function netsOf(G, fn, eps, tick, slope = COST.slope) {
  const { g, done, nx, ny, nz, b, h } = G, at = (i, j, k) => i + nx * (j + ny * k);
  const cx = nx - 1, cy = ny - 1, cz = nz - 1, cellV = new Int32Array(cx * cy * cz).fill(-1), pos = [], idx = [], own = [];
  const E = [0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7], v = new Float32Array(8);
  for (let k = 0, had = 0; k < cz; k++) { if (tick) { await tick(COST.cell * cx * cy + COST.corner * (pos.length / 3 - had)); had = pos.length / 3; } for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
    if (done[at(i | 1, j | 1, k | 1)] === 2) continue;
    let mask = 0;
    for (let c = 0; c < 8; c++) { v[c] = g[(i + (c & 1)) + nx * ((j + ((c >> 1) & 1)) + ny * (k + (c >> 2)))]; if (v[c] < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, m = 0;
    for (let e = 0; e < 24; e += 2) {
      const a = E[e], c = E[e + 1];
      if ((v[a] < 0) === (v[c] < 0)) continue;
      const t = v[a] / (v[a] - v[c]);
      sx += (a & 1) + t * ((c & 1) - (a & 1)); sy += ((a >> 1) & 1) + t * (((c >> 1) & 1) - ((a >> 1) & 1)); sz += (a >> 2) + t * ((c >> 2) - (a >> 2)); m++;
    }
    cellV[i + cx * (j + cy * k)] = pos.length / 3; own.push(i, j, k);
    pos.push(b[0] + (i + sx / m) * h, b[1] + (j + sy / m) * h, b[2] + (k + sz / m) * h);
  } }
  // (a, c, d, e) run round the crossed edge; the triangles face out of the stone
  const quad = (a, c, d, e, flip) => { if (a < 0 || c < 0 || d < 0 || e < 0) return; if (flip) idx.push(a, c, d, a, d, e); else idx.push(a, d, c, a, e, d); };
  const cv = (i, j, k) => (i < 0 || j < 0 || k < 0 || i >= cx || j >= cy || k >= cz ? -1 : cellV[i + cx * (j + cy * k)]);
  // (an edge the surface crosses runs out of the low corner of a cell that holds a corner of the mesh: only those
  // cells are looked at, in the order they were found, which is the order of the grid)
  for (let q = 0; q < own.length; q += 3) {
    if (tick && q % 3000 === 0) await tick(COST.corner * 500);
    const i = own[q], j = own[q + 1], k = own[q + 2], a = g[i + nx * (j + ny * k)] < 0;
    if (a !== (g[i + 1 + nx * (j + ny * k)] < 0)) quad(cv(i, j - 1, k - 1), cv(i, j, k - 1), cv(i, j, k), cv(i, j - 1, k), a);
    if (a !== (g[i + nx * (j + 1 + ny * k)] < 0)) quad(cv(i - 1, j, k - 1), cv(i - 1, j, k), cv(i, j, k), cv(i, j, k - 1), a);
    if (a !== (g[i + nx * (j + ny * (k + 1))] < 0)) quad(cv(i - 1, j - 1, k), cv(i, j - 1, k), cv(i, j, k), cv(i - 1, j, k), a);
  }
  const nor = new Float32Array(pos.length);
  for (let q = 0; q < pos.length; q += 3) {
    if (tick && q % 300 === 0) await tick(slope * 100);
    const x = pos[q], y = pos[q + 1], z = pos[q + 2];
    // the slope of the field from four readings at the corners of a small tetrahedron
    const a = fn(x + eps, y - eps, z - eps), c = fn(x - eps, y - eps, z + eps), d = fn(x - eps, y + eps, z - eps), e = fn(x + eps, y + eps, z + eps);
    const gx = a - c - d + e, gy = -a - c + d + e, gz = -a + c - d + e, l = hyp(gx, gy, gz);
    // (a level spot of the field has no slope to read: such a corner looks straight up)
    if (l > 1e-9) { nor[q] = gx / l; nor[q + 1] = gy / l; nor[q + 2] = gz / l; } else nor[q + 1] = 1;
  }
  return { pos: new Float32Array(pos), nor, idx };
}
// a small figure in one go: the field on a grid, its surface, normals from the field itself
async function surfaceNets(f, b, h, eps, tick, cost = COST.figure) {
  const G = await gridOf(f, b, h, tick, cost), m = await netsOf(G, f, eps, tick, 0.6 * cost);
  return { ...m, sample: gridSample(G), box: b };
}

// ---------------------------------------------------------------- cut stone: blocks bounded by planes
// A carved figure is a list of BLOCKS. A block is a convex solid given by its faces: flat polygons whose normals
// look out of the stone. The one description gives everything: the mesh (each face drawn with its own normal, so
// every edge where two planes meet is a crisp arris), the field of distance (the largest of its planes' distances:
// exact inside, never too large outside), and the shade it casts (its faces, drawn into the sun's map).
// A face marked round (an axis: two points) is one facet of a turned form: its corners look out from the axis.
// t: what the block is (cloth: striped headcloth; h: the longest side a triangle of it may have).
const v3sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], v3dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const v3cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const v3unit = (a) => { const l = hyp(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const AX = [1, 0, 0], AY = [0, 1, 0], AZ = [0, 0, 1];
function faceOf(p, more) {
  let nx = 0, ny = 0, nz = 0;
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); }
  const l = hyp(nx, ny, nz);
  return { p, n: l > 1e-9 ? [nx / l, ny / l, nz / l] : [0, 0, 0], area: l / 2, ...more };
}
function blockOf(faceList, t) {
  const faces = faceList.filter((f) => f.area > 1e-6), planes = [];
  let cx = 0, cy = 0, cz = 0, n = 0, r = 0;
  for (const f of faces) for (const q of f.p) { cx += q[0]; cy += q[1]; cz += q[2]; n++; }
  const c = [cx / n, cy / n, cz / n];
  for (const f of faces) {
    if (v3dot(f.n, v3sub(f.p[0], c)) < 0) { f.p = f.p.slice().reverse(); f.n = [-f.n[0], -f.n[1], -f.n[2]]; }
    for (const q of f.p) r = Math.max(r, hyp(q[0] - c[0], q[1] - c[1], q[2] - c[2]));
    planes.push(f.n[0], f.n[1], f.n[2], v3dot(f.n, f.p[0]));
  }
  const P = new Float64Array(planes), np = P.length;
  const f = (x, y, z) => { let m = -1e9; for (let i = 0; i < np; i += 4) { const d = P[i] * x + P[i + 1] * y + P[i + 2] * z - P[i + 3]; if (d > m) m = d; } return m; };
  // (g: the same answer for an asker to whom lim and anything beyond it is all one: it stops at the first side that says so)
  const g = (x, y, z, lim) => { let m = -1e9; for (let i = 0; i < np; i += 4) { const d = P[i] * x + P[i + 1] * y + P[i + 2] * z - P[i + 3]; if (d > m) { if (d >= lim) return d; m = d; } } return m; };
  return { faces, c, r, k: 0.02, f, g, t: t || {} };
}
// a ring of corners about c in the plane of the unit vectors u and v, from an outline of [along u, along v]
const ringOf = (c, u, v, pts, sc = 1) => pts.map(([a, d]) => [c[0] + sc * (a * u[0] + d * v[0]), c[1] + sc * (a * u[1] + d * v[1]), c[2] + sc * (a * u[2] + d * v[2])]);
// outlines: a rectangle hw by hh with its corners cut by b; a many-sided round of radii r and rz
const rect = (hw, hh, b = 0) => (b > 0 ? [[-hw + b, -hh], [hw - b, -hh], [hw, -hh + b], [hw, hh - b], [hw - b, hh], [-hw + b, hh], [-hw, hh - b], [-hw, -hh + b]] : [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]);
// a rectangle worn round: each corner cut twice (twelve sides)
const worn = (hw, hh, b) => [[1, 1], [-1, 1], [-1, -1], [1, -1]].flatMap(([sx, sy]) => { const q = [[hw, hh - b], [hw - 0.3 * b, hh - 0.3 * b], [hw - b, hh]].map(([x, y]) => [sx * x, sy * y]); return sx * sy > 0 ? q : q.reverse(); });
const ngon = (r, n, rz = r) => Array.from({ length: n }, (_, i) => { const a = (i + 0.5) / n * Math.PI * 2; return [r * Math.cos(a), rz * Math.sin(a)]; });
// the block between two rings of as many corners (a slab, a frustum, a length of limb, one course of a turned form)
function loft(A, B, t, round) {
  const n = A.length, faces = [faceOf(A.slice()), faceOf(B.slice())];
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; faces.push(faceOf([A[i], A[j], B[j], B[i]], round ? { round } : null)); }
  return blockOf(faces, t);
}
// an upright block: its lower outline hx0 by hz0 about (cx, cz) at y0, its upper hx1 by hz1 at y1, shifted dz forward; corners cut by b
const blockY = (cx, cz, y0, y1, hx0, hz0, hx1 = hx0, hz1 = hz0, b = 0, dz = 0, t) => loft(ringOf([cx, y0, cz], AX, AZ, rect(hx0, hz0, b)), ringOf([cx, y1, cz + dz], AX, AZ, rect(hx1, hz1, b * Math.min(hx1 / hx0, hz1 / hz0))), t);
// a limb from a to c: its section wa (across) by ha at a and wc by hc at c, corners cut by b
function limb(a, c, wa, ha, wc = wa, hc = ha, b = 0, t, sec = rect) {
  const ax = v3unit(v3sub(c, a)), u = v3unit(v3cross(Math.abs(ax[1]) > 0.9 ? AZ : AY, ax)), v = v3cross(ax, u);
  return loft(ringOf(a, u, v, sec(wa, ha, b)), ringOf(c, u, v, sec(wc, hc, b * Math.min(wc / wa, hc / ha))), t);
}
// a plate: an outline in the plane of u and v about c, from depth d0 to d1 along w
const plate = (c, u, v, w, pts, d0, d1, t) => loft(ringOf([c[0] + w[0] * d0, c[1] + w[1] * d0, c[2] + w[2] * d0], u, v, pts), ringOf([c[0] + w[0] * d1, c[1] + w[1] * d1, c[2] + w[2] * d1], u, v, pts), t);
// a turned form about an upright axis through (cx, cz): courses between the levels [y, r], n-sided, each facet round
function turned(cx, cz, levels, n, t, squash = 1) {
  const out = [], axis = [[cx, levels[0][0], cz], [cx, levels[levels.length - 1][0], cz]];
  for (let i = 0; i < levels.length - 1; i++) out.push(loft(ringOf([cx, levels[i][0], cz], AX, AZ, ngon(levels[i][1], n, levels[i][1] * squash)), ringOf([cx, levels[i + 1][0], cz], AX, AZ, ngon(levels[i + 1][1], n, levels[i + 1][1] * squash)), t, axis));
  return out;
}
// what is left of a block on the inner side of a plane (n . p <= d): the cut is closed by a face of its own
function clipBlock(S, pl, capMore) {
  const a = pl[0], b = pl[1], c = pl[2], d = pl[3], out = [], cutPts = [];
  // (the two plain answers first, with nothing made: a block the plane does not reach is itself; one wholly beyond it is gone)
  let beyond = false, within = false;
  for (const f of S.faces) for (const A of f.p) { if (a * A[0] + b * A[1] + c * A[2] - d > 0) beyond = true; else within = true; }
  if (!beyond) return S;
  if (!within) return null;
  for (const f of S.faces) {
    const P = f.p, n = P.length, q = [];
    for (let i = 0; i < n; i++) {
      const A = P[i], B = P[(i + 1) % n], da = a * A[0] + b * A[1] + c * A[2] - d, db = a * B[0] + b * B[1] + c * B[2] - d;
      if (da <= 0) q.push(A);
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const s = da / (da - db), X = [A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s, A[2] + (B[2] - A[2]) * s]; q.push(X); cutPts.push(X); }
    }
    if (q.length >= 3) out.push(faceOf(q, { round: f.round, hide: f.hide }));
  }
  if (!out.length) return null;
  if (cutPts.length < 3) return S;
  // the cut's corners in order round their middle
  const m = [0, 0, 0]; for (const x of cutPts) { m[0] += x[0] / cutPts.length; m[1] += x[1] / cutPts.length; m[2] += x[2] / cutPts.length; }
  const nn = [a, b, c], u = v3unit(v3cross(Math.abs(b) > 0.9 ? AX : AY, nn)), v = v3cross(nn, u);
  const ang = (x) => Math.atan2(v3dot(v3sub(x, m), v), v3dot(v3sub(x, m), u));
  const ring = cutPts.map((x) => [ang(x), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]).filter((x, i, arr) => { const y = arr[(i + arr.length - 1) % arr.length]; return i === 0 || hyp(x[0] - y[0], x[1] - y[1], x[2] - y[2]) > 1e-5; });
  if (ring.length >= 3) out.push(faceOf(ring, capMore));
  return blockOf(out, S.t);
}
// a block carried by a map of points that keeps planes plane (a turn, a size, a shift)
const moved = (S, fn) => blockOf(S.faces.map((f) => faceOf(f.p.map(fn), { hide: f.hide, round: f.round && [fn(f.round[0]), fn(f.round[1])] })), S.t);

// ---------------------------------------------------------------- one seated king, cut in planes
// King frame (the carving's own measure): x across (0 on his middle), y up, z forward from the back of his seat.
// Base top 1.4, knees 10.0, face centre 18.4, crown top CROWN_TOP; shoulders 9.7 wide, legs 6.5 wide, toes to z 10.4.
// The whole king as he was cut: the base and its lower course, the block throne with a raised frame on either side,
// the slab at his back that ties him to the wall, the footstool; thighs, knees with their caps, shins, feet side by
// side with five toes each; the kilt's lap and its tab between the shins; waist, chest with the breast's lower edge,
// belt, the broad collar in two steps, round shoulders, ten-sided upper arms, forearms, hands flat on the knees
// (knuckles, four fingers in two joints, a thumb); neck, the head in six courses round in front, with the brows'
// ridges, lidded eyes, cheekbones, the nose and its wings, lips, chin, ears and the straight beard; the striped
// headcloth (a cap over the skull, a band round the brow, a wing to either side, two lappets on the breast, its
// stripes as shallow ridges); the tall double crown (a flaring round below with its tall back, a tall bulb in it).
// TWO SCALES OF FORM: the great blocks (a metre and more), and on heads, hands and feet pieces of 0.15 to 0.5 m.
// THE OLDEST EDGES ARE WORN: base, footstool, knees and shins carry a slanting plane or a round where the arris was.
const CROWN_TOP = 23.5, HEAD_H = 0.75, SUN_CELL = 0.1;
// (the headcloth's stripes: so far apart in the king's own measure; the stone's shader paints its grooves by the same)
const STRIPE = 0.4;
function kingBlocks(o) {
  const L = [], head = { h: HEAD_H }, cloth = { h: HEAD_H, cloth: 1 }, add = (...b) => { for (const q of b.flat()) if (q) L.push(q); };
  // (the base's upper course and the footstool: the oldest edges, worn back: a slanting plane where the arris was)
  add(blockY(0, 5.45, -0.56, 0.55, 5.15, 5.4), blockY(0, 5.3, 0.55, 1.14, 4.9, 5.2, 4.9, 5.2, 0.3), blockY(0, 5.3, 1.14, 1.4, 4.9, 5.2, 4.66, 4.96, 0.3));
  add(blockY(0, 2.9, 1.4, 7.6, 4.35, 2.7), blockY(0, 0.75, 7.6, 9.6, 4.35, 0.55), blockY(0, 0.3, 1.4, 17.6, 3.7, 0.65));
  add(blockY(0, 8.75, 1.4, 1.55, 3.6, 1.75, 3.6, 1.75, 0.25), blockY(0, 8.75, 1.55, 1.75, 3.6, 1.75, 3.4, 1.55, 0.25));
  for (const sg of [-1, 1]) {
    const lx = sg * 1.95, px = sg * 4.42;
    // the throne's side: a raised frame of four bars round a plain panel
    add(blockY(px, 2.9, 6.5, 7.2, 0.07, 2.4), blockY(px, 2.9, 1.9, 2.6, 0.07, 2.4), blockY(px, 4.95, 2.6, 6.5, 0.07, 0.35), blockY(px, 0.85, 2.6, 6.5, 0.07, 0.35));
    add(limb([lx, 8.75, 2.4], [lx, 8.7, 7.35], 1.32, 1.28, 1.3, 1.25, 0.42));
    // (the knee worn round: twelve sides and a blunt end where its square front was; its cap worn the same)
    add(limb([lx, 8.7, 7.35], [lx, 8.8, 8.78], 1.3, 1.25, 1.02, 0.9, 0.5, null, worn), limb([lx, 8.8, 8.78], [lx, 8.82, 9.08], 1.02, 0.9, 0.62, 0.5, 0.4, null, worn), limb([lx, 9.3, 8.1], [lx, 9.22, 8.98], 0.72, 0.6, 0.5, 0.42, 0.26, null, worn));
    // (the shin: its front edge, once sharp, worn to a narrow plane; ten sides)
    const shin = [[-0.2, 1.04], [0.2, 1.04], [0.7, 0.74], [0.98, 0.28], [0.92, -0.55], [0.62, -0.95], [-0.62, -0.95], [-0.92, -0.55], [-0.98, 0.28], [-0.7, 0.74]];
    add(loft(ringOf([lx, 8.3, 7.7], AX, AZ, shin), ringOf([lx, 2.7, 7.75], AX, AZ, shin, 0.78)));
    add(loft(ringOf([lx, 2.35, 7.2], AX, AY, rect(1.02, 0.6, 0.2)), ringOf([lx, 1.99, 10.38], AX, AY, rect(1.08, 0.24, 0.1))));
    // five toes on the footstool at each foot's end, the great toe inmost, each lower and shorter than the last
    for (let i = 0, tx = lx - sg * 1.04; i < 5; i++) { const hw = i ? 0.185 : 0.26; tx += sg * hw; add(blockY(tx, 10.08 - 0.03 * i, 1.75, 2.34 - 0.03 * i, hw - 0.015, 0.4 - 0.03 * i, hw - 0.045, 0.3 - 0.03 * i, 0.06)); tx += sg * hw; }
    // arm, forearm, the hand flat on the knee: a palm, four fingers, a thumb
    add(loft(ringOf([sg * 4.25, 11.3, 2.45], AX, AZ, ngon(0.95, 10, 1.05)), ringOf([sg * 4.2, 14.2, 2.45], AX, AZ, ngon(1.05, 10, 1.12))), limb([sg * 4.2, 11.15, 2.9], [sg * 2.35, 10.6, 6.4], 0.82, 0.62, 0.68, 0.46, 0.2));
    // (the back of the hand; a knuckle at each finger's root; each finger in two joints lying down the knee's
    // own slope, the further joint thinner, its tip low; the thumb in two joints beside the first finger)
    add(blockY(sg * 2.05, 6.75, 9.9, 10.46, 0.9, 0.62, 0.76, 0.5, 0.12, 0.08));
    const joint = (x0, y0, z0, x1, y1, z1, w0, h0, w1, h1) => loft(ringOf([x0, y0, z0], AX, AY, rect(w0, h0, 0.06)), ringOf([x1, y1, z1], AX, AY, rect(w1, h1, 0.05)));
    for (let i = 0; i < 4; i++) {
      const fx = sg * 2.05 + (i - 1.5) * 0.45;
      add(blockY(fx, 7.36, 9.9, 10.54, 0.2, 0.15, 0.16, 0.09, 0.05), joint(fx, 10.14, 7.4, fx, 10.02, 8.02, 0.2, 0.2, 0.19, 0.17), joint(fx, 10.02, 8.02, fx, 9.86, 8.62, 0.185, 0.17, 0.15, 0.1));
    }
    { const tx = sg * 2.05 - sg * 1.12; add(joint(tx, 10.12, 6.7, tx + sg * 0.05, 10.06, 7.28, 0.19, 0.19, 0.17, 0.16), joint(tx + sg * 0.05, 10.06, 7.28, tx + sg * 0.12, 9.94, 7.78, 0.165, 0.16, 0.13, 0.1)); }
    // headcloth: the wing beside the face, the lappet on the breast; the ear under the wing
    const wing = [[1.35, 20.15], [1.95, 19.95], [3.35, 17.0], [3.45, 16.1], [2.95, 15.7], [1.45, 15.95]].map(([x, y]) => [sg * x, y]);
    add(plate([0, 0, 0], AX, AY, AZ, wing, 1.75, 3.9, cloth));
    add(loft(ringOf([sg * 1.6, 16.7, 4.0], AX, AZ, rect(0.55, 0.32)), ringOf([sg * 1.62, 13.75, 4.5], AX, AZ, rect(0.62, 0.25)), cloth));
    // the headcloth's stripes as shallow ridges: one between every two of its painted grooves (STRIPE apart), a
    // hand proud of the wing's front and of the lappet's, each cut to the cloth's own outline at its height
    for (let y = STRIPE * (Math.ceil(13.8 / STRIPE) + 0.75); y < 20; y += STRIPE) {
      const y0 = y - STRIPE * 0.27, y1 = y + STRIPE * 0.27, xin = (q) => lerp(1.45, 1.35, (q - 15.95) / 4.2), xout = (q) => (q > 17 ? lerp(3.35, 1.95, (q - 17) / 2.95) : lerp(3.45, 3.35, (q - 16.1) / 0.9));
      if (y0 > 16.1 && y1 < 20.05) add(plate([0, 0, 0], AX, AY, AZ, [[xin(y0), y0], [xout(y0), y0], [xout(y1), y1], [xin(y1), y1]].map(([x, q]) => [sg * x, q]), 3.9, 3.99, cloth));
      if (y0 > 13.8 && y1 < 16.6) { const t = (16.7 - y) / 2.95; add(blockY(sg * lerp(1.6, 1.62, t), lerp(4.32, 4.75, t), y0, y1, lerp(0.55, 0.62, t) + 0.02, 0.085, lerp(0.55, 0.62, t) + 0.02, 0.085, 0, 0, cloth)); }
    }
    add(blockY(sg * 1.62, 3.3, 17.9, 18.8, 0.12, 0.3, 0.12, 0.3, 0, 0, head));
  }
  // the kilt: the cloth stretched between the thighs, its tab hanging between the shins; the belt
  add(blockY(0, 4.7, 7.6, 9.7, 3.25, 2.4), blockY(0, 7.35, 4.6, 9.2, 0.7, 0.2, 0.85, 0.22), blockY(0, 2.55, 9.6, 10.15, 2.85, 1.8, 2.85, 1.8, 0.5));
  // waist, chest, the breast's lower edge, shoulders, the collar in two steps
  add(loft(ringOf([0, 9.5, 2.55], AX, AZ, rect(2.75, 1.7, 0.5)), ringOf([0, 12.4, 2.5], AX, AZ, rect(2.55, 1.55, 0.5))));
  add(loft(ringOf([0, 12.4, 2.5], AX, AZ, rect(2.55, 1.55, 0.5)), ringOf([0, 15.2, 2.55], AX, AZ, rect(3.55, 1.75, 0.6))));
  add(loft(ringOf([0, 13.35, 3.35], AX, AZ, rect(2.5, 0.95, 0.3)), ringOf([0, 15.0, 3.35], AX, AZ, rect(3.0, 1.05, 0.3))));
  add(blockY(0, 2.4, 14.35, 15.75, 3.7, 1.15, 3.6, 1.05, 0.35));
  // (the shoulder itself: a round cap of twelve sides either end; from the neck the slope of the shoulders' top)
  for (const sg of [-1, 1]) add(turned(sg * 4.0, 2.45, [[13.6, 1.0], [14.4, 1.16], [15.2, 1.1], [15.7, 0.85], [15.95, 0.45]], 12));
  add(loft(ringOf([0, 15.6, 2.5], AX, AZ, rect(3.4, 0.95, 0.3)), ringOf([0, 16.35, 2.7], AX, AZ, rect(1.15, 0.85, 0.3))));
  const collar = [[-2.7, 15.3], [2.7, 15.3], [2.35, 14.2], [1.3, 13.62], [-1.3, 13.62], [-2.35, 14.2]];
  add(plate([0, 0, 0], AX, AY, AZ, collar, 3.6, 4.54), plate([0, 0, 0], AX, AY, AZ, collar.map(([x, y]) => [x * 0.72, 15.3 + (y - 15.3) * 0.7]), 3.6, 4.66));
  // neck and head. The head is laid in six courses from the chin to the brow; each course's outline is round in
  // front (ten corners on an arc from ear to ear: no plane of cheek, jaw or brow is wider than 0.6 m) and plain
  // behind, where the headcloth covers it. arcZ: how far forward such an outline stands at x across it; faceZ: the
  // face's own skin at a place (what the brows, the lids, the cheekbones and the lips are laid on).
  add(blockY(0, 2.85, 15.2, 17.0, 1.0, 0.95, 0.95, 0.9, 0.3));
  const ARC = [-90, -70, -50, -30, -10, 10, 30, 50, 70, 90].map((a) => a * Math.PI / 180), DEEP = 1.15;
  const arcZ = (hx, zf, x) => zf - DEEP * (1 - Math.sqrt(Math.max(0, 1 - x * x / (hx * hx))));
  const course = (y, hx, zf, zb) => ringOf([0, y, 0], AX, AZ, [...ARC.map((a) => [hx * Math.sin(a), zf - DEEP * (1 - Math.cos(a))]), [hx, zb + 0.6], [0.55 * hx, zb], [-0.55 * hx, zb], [-hx, zb + 0.6]]);
  const HEADS = [[16.75, 0.8, 4.45, 2.6], [17.1, 1.14, 4.68, 2.35], [17.5, 1.36, 4.82, 2.15], [18.0, 1.5, 4.9, 1.95], [18.55, 1.54, 4.9, 1.85], [19.1, 1.52, 4.82, 1.8], [19.75, 1.42, 4.55, 1.9]];
  for (let i = 0; i < HEADS.length - 1; i++) add(loft(course(...HEADS[i]), course(...HEADS[i + 1]), head));
  const faceZ = (x, y) => { let i = 0; while (i < HEADS.length - 2 && y > HEADS[i + 1][0]) i++; const A = HEADS[i], B = HEADS[i + 1], t = clamp((y - A[0]) / (B[0] - A[0]), 0, 1); return arcZ(lerp(A[1], B[1], t), lerp(A[2], B[2], t), x); };
  // a ridge laid across the face from place to place [x, y], its front `out` proud of the skin (dz deep, hy high: halves)
  const onFace = (pts, out, dz, hy, dz1 = dz, hy1 = hy) => pts.slice(1).map((p, i) => { const a = pts[i], n = pts.length - 1, f0 = i / n, f1 = (i + 1) / n;
    return limb([a[0], a[1], faceZ(a[0], a[1]) + out - lerp(dz, dz1, f0)], [p[0], p[1], faceZ(p[0], p[1]) + out - lerp(dz, dz1, f1)], lerp(dz, dz1, f0), lerp(hy, hy1, f0), lerp(dz, dz1, f1), lerp(hy, hy1, f1), 0, head); });
  for (const sg of [-1, 1]) {
    // the brow's ridge over each eye, arched and following the head round
    add(onFace([[sg * 0.1, 18.98], [sg * 0.55, 19.1], [sg * 1.0, 19.06], [sg * 1.38, 18.88]], 0.17, 0.15, 0.13, 0.12, 0.1));
    // the eye: a low almond boss turned as the face turns there; its upper lid a heavier ridge, its lower a light one
    const u = [0.925, 0, -0.38 * sg], w = [0.38 * sg, 0, 0.925], c = [sg * 0.7, 18.66, 4.7], P = (a, b, d) => [c[0] + a * u[0] + d * w[0], c[1] + b, c[2] + a * u[2] + d * w[2]];
    add(plate(c, u, AY, w, [[-0.45, 0], [-0.2, 0.15], [0.2, 0.15], [0.45, 0], [0.2, -0.13], [-0.2, -0.13]], -0.4, 0.12, head));
    const lid = (pts, d, dz, hy) => pts.slice(1).map((p, i) => limb(P(pts[i][0], pts[i][1], d), P(p[0], p[1], d), dz, hy, dz, hy, 0, head));
    add(lid([[-0.52, 0.02], [-0.2, 0.21], [0.2, 0.21], [0.52, 0.02]], 0.1, 0.08, 0.055), lid([[-0.46, -0.03], [-0.2, -0.18], [0.2, -0.18], [0.46, -0.03]], 0.08, 0.05, 0.035));
    // the cheekbone: a low eight-sided mound on the cheek's own slope
    const cu = [0.867, 0, -0.5 * sg], cw = [0.5 * sg, 0, 0.867], cc = [sg * 0.92, 18.0, faceZ(0.92, 18.0)];
    add(loft(ringOf([cc[0] - 0.12 * cw[0], cc[1], cc[2] - 0.12 * cw[2]], cu, AY, ngon(0.46, 8, 0.4)), ringOf([cc[0] + 0.15 * cw[0], cc[1], cc[2] + 0.15 * cw[2]], cu, AY, ngon(0.25, 8, 0.2)), head));
    // the nose's wing; the lips' outer halves, thinning back to the mouth's corners
    add(loft(ringOf([sg * 0.36, 17.95, 5.0], AX, AZ, rect(0.16, 0.2, 0.06)), ringOf([sg * 0.3, 18.32, 4.98], AX, AZ, rect(0.08, 0.12, 0.03)), head));
    add(onFace([[sg * 0.26, 17.6], [sg * 0.72, 17.55]], 0.16, 0.14, 0.1, 0.06, 0.05), onFace([[sg * 0.26, 17.33], [sg * 0.62, 17.41]], 0.13, 0.13, 0.1, 0.05, 0.04));
  }
  // the nose in two lengths, its ridge a narrow plane (one king has lost its tip); the lips' middles with the
  // mouth's line between them; the chin, rounded, under them
  const nsec = (y, w, r, tip) => [[-w, y, 4.8], [w, y, 4.8], [r, y, tip], [-r, y, tip]];
  const nose = [loft(nsec(18.95, 0.13, 0.05, 5.03), nsec(18.4, 0.24, 0.08, 5.27), head), loft(nsec(18.4, 0.24, 0.08, 5.27), nsec(17.95, 0.34, 0.12, 5.47), head)];
  add(o.nose ? nose.map((b) => clipBlock(b, [0, -0.5, 0.87, -0.5 * 18.3 + 0.87 * (5.22 - 0.12 * o.nose)])) : nose);
  add(blockY(0, 5.0, 17.5, 17.7, 0.3, 0.16, 0.24, 0.12, 0.05, 0, head), blockY(0, 4.97, 17.22, 17.44, 0.26, 0.15, 0.3, 0.16, 0.04, 0, head));
  add(loft(ringOf([0, 16.72, 4.42], AX, AZ, rect(0.42, 0.3, 0.14)), ringOf([0, 16.95, 4.5], AX, AZ, rect(0.6, 0.42, 0.2)), head), loft(ringOf([0, 16.95, 4.5], AX, AZ, rect(0.6, 0.42, 0.2)), ringOf([0, 17.2, 4.46], AX, AZ, rect(0.52, 0.36, 0.17)), head));
  // the straight beard from the chin to the breast (one king has lost his: a stub is left)
  if (o.beard) add(blockY(0, 4.55, 14.8, 16.8, 0.36, 0.3, 0.46, 0.34, 0.1, 0, head), blockY(0, 4.55, 14.5, 14.8, 0.5, 0.36, 0.44, 0.32, 0, 0, head));
  else add(clipBlock(blockY(0, 4.55, 16.1, 16.8, 0.42, 0.32, 0.46, 0.34, 0.1, 0, head), [0.2, -1, 0.3, -16.25 + 0.3 * 4.55]));
  // the headcloth's cap over the skull and its band on the brow
  add(loft(course(19.6, 1.72, 4.72, 1.35), course(20.35, 1.3, 4.1, 1.7), cloth));
  { const bx = [-1.62, -1.25, -0.68, 0, 0.68, 1.25, 1.62], bz = (x) => arcZ(1.72, 4.72, x) + 0.02; for (let i = 0; i < 6; i++) add(limb([bx[i], 19.58, bz(bx[i])], [bx[i + 1], 19.58, bz(bx[i + 1])], 0.1, 0.16, 0.1, 0.16, 0, head)); }
  // the double crown: the flaring round, its tall back, the bulb with its knob (one king has lost the top of his)
  const crown = [...turned(0, 2.75, [[20.2, 1.5], [21.7, 1.82]], 10, head, 0.96), blockY(0, 1.55, 21.7, CROWN_TOP - 0.1, 0.8, 0.3, 0.55, 0.22, 0, 0, head),
    ...turned(0, 2.85, [[21.7, 1.2], [22.5, 1.08], [23.0, 0.66], [23.25, 0.46], [CROWN_TOP, 0.34]], 10, head)];
  const lost = o.crown ? [0.25, 1, -0.2, 0.25 * 0 + 22.75 - 0.9 * o.crown - 0.2 * 2.75] : null;
  add(crown.map((b) => (lost ? clipBlock(b, lost) : b)));
  return L;
}
// what the ages took from a king's blocks: corners broken off. A chip is [which block (0..1), which corner (0..1),
// how deep in metres]: a plane across the corner, square to the line from the block's middle to it.
function chipped(L, chips, least = 1.2) {
  const big = L.map((b, i) => [b.r, i]).filter((q) => q[0] > least).map((q) => q[1]);
  for (const [wb, wc, deep] of chips) {
    const i = big[Math.min(big.length - 1, Math.floor(wb * big.length))], b = L[i], cs = [];
    for (const f of b.faces) for (const q of f.p) cs.push(q);
    const q = cs[Math.min(cs.length - 1, Math.floor(wc * cs.length))], n = v3unit(v3sub(q, b.c)), cut = clipBlock(b, [n[0], n[1], n[2], v3dot(n, q) - deep]);
    if (cut) L[i] = cut;
  }
  return L;
}
// the fourth king's break: everything above it is gone. Three slanting planes, one for the blocks of his right side,
// one for the middle, one for the left, a step between each: a stepped break at the breast, as stone parts along its beds
const BREAKS = [[-0.12, 1, 0.1, 12.9], [0.1, 1, -0.16, 11.75], [0.06, 1, 0.2, 13.1]];
const breakOf = (b) => BREAKS[b.c[0] < -1.3 ? 0 : b.c[0] > 1.3 ? 2 : 1];
// The break is old and its rim is worn back: every block the break passes through loses, besides, a slanting plane
// off its break's outer edge (outer: away from the king's own upright axis), WORN deep.
const WORN = 0.32;
const wornRim = (b, pl) => {
  const rx = b.c[0], rz = b.c[2] - 2.6, rl = hyp(rx, rz), out = rl > 0.6 ? [rx / rl, rz / rl] : [0, 1], n = v3unit([pl[0] + 0.9 * out[0], pl[1], pl[2] + 0.9 * out[1]]);
  let far = -1e9; for (const f of b.faces) for (const q of f.p) far = Math.max(far, v3dot(n, q));
  return clipBlock(b, [n[0], n[1], n[2], far - WORN], { broke: 1 }) || b;
};
const broken = (L) => L.map((b) => { const pl = breakOf(b), c = clipBlock(b, pl, { broke: 1 }); return c && c !== b ? wornRim(c, pl) : c; }).filter((b) => b);
// a small standing figure by a king's leg: a plinth, the legs in their long skirt, the trunk, two arms at the
// sides, a head in its heavy hair, a tall plain cap. H its height, (fx, fz) its place, y0 what it stands on
function statueBlocks(fx, fz, H, y0) {
  const s = H / 5, t = { h: 0.9 };
  return [blockY(fx, fz, y0, y0 + 0.22 * s, 0.66 * s, 0.6 * s, 0.66 * s, 0.6 * s, 0, 0, t), blockY(fx, fz, y0 + 0.2 * s, y0 + 2.35 * s, 0.5 * s, 0.4 * s, 0.44 * s, 0.34 * s, 0.1 * s, 0, t),
    blockY(fx, fz, y0 + 2.35 * s, y0 + 3.62 * s, 0.44 * s, 0.32 * s, 0.62 * s, 0.36 * s, 0.1 * s, 0, t), blockY(fx - 0.68 * s, fz, y0 + 1.9 * s, y0 + 3.5 * s, 0.13 * s, 0.2 * s, 0.13 * s, 0.2 * s, 0, 0, t),
    blockY(fx + 0.68 * s, fz, y0 + 1.9 * s, y0 + 3.5 * s, 0.13 * s, 0.2 * s, 0.13 * s, 0.2 * s, 0, 0, t), blockY(fx, fz + 0.04 * s, y0 + 3.6 * s, y0 + 4.3 * s, 0.3 * s, 0.3 * s, 0.27 * s, 0.27 * s, 0.08 * s, 0, t),
    blockY(fx, fz - 0.1 * s, y0 + 3.45 * s, y0 + 4.36 * s, 0.44 * s, 0.26 * s, 0.38 * s, 0.22 * s, 0, 0, t), blockY(fx, fz - 0.05 * s, y0 + 4.3 * s, y0 + 5 * s, 0.2 * s, 0.12 * s, 0.27 * s, 0.1 * s, 0, 0, t)];
}

// the hawk-headed figure of the niche, 5.3 m: a plinth, the legs in their long skirt, the trunk, arms at the sides,
// the heavy hair behind the head and down on the shoulders, the head with its hooked beak, the double crown
function hawkBlocks() {
  const t = { h: 0.9 }, L = [blockY(0, 0, 0, 0.25, 0.85, 0.6, 0.85, 0.6, 0, 0, t), blockY(0, 0, 0.25, 2.3, 0.55, 0.42, 0.5, 0.36, 0.12, 0, t), blockY(0, 0, 2.3, 3.45, 0.48, 0.34, 0.72, 0.4, 0.12, 0, t)];
  for (const sg of [-1, 1]) L.push(blockY(sg * 0.82, 0, 1.85, 3.4, 0.15, 0.22, 0.15, 0.22, 0, 0, t));
  L.push(blockY(0, -0.04, 3.3, 4.3, 0.52, 0.3, 0.42, 0.3, 0.1, 0, t), blockY(0, 0.1, 3.55, 4.25, 0.3, 0.34, 0.26, 0.3, 0.08, 0, t));
  L.push(loft([[-0.15, 4.04, 0.4], [0.15, 4.04, 0.4], [0.15, 3.76, 0.4], [-0.15, 3.76, 0.4]], [[-0.03, 3.82, 0.8], [0.03, 3.82, 0.8], [0.03, 3.7, 0.77], [-0.03, 3.7, 0.77]], t));
  L.push(...turned(0, 0.02, [[4.25, 0.3], [4.9, 0.4]], 8, t), ...turned(0, 0, [[4.3, 0.22], [5.0, 0.2], [5.3, 0.1]], 8, t));
  return L;
}
// a small figure of a hawk for a parapet's pier, 1.6 m, front toward +z: the feet's block, the upright breast, the
// folded wings and tail slanting down behind, the head, the hooked beak, a plain cap
function falconBlocks() {
  const t = { h: 1 };
  return [blockY(0, 0, 0, 0.14, 0.3, 0.42, 0.3, 0.42, 0, 0, t), loft(ringOf([0, 0.12, 0.04], AX, AZ, rect(0.24, 0.3, 0.08)), ringOf([0, 0.98, 0.1], AX, AZ, rect(0.31, 0.26, 0.08)), t),
    limb([0, 0.9, -0.12], [0, 0.06, -0.5], 0.25, 0.1, 0.14, 0.06, 0, t), blockY(0, 0.14, 0.95, 1.32, 0.2, 0.22, 0.16, 0.18, 0.06, 0, t),
    loft([[-0.07, 1.2, 0.34], [0.07, 1.2, 0.34], [0.07, 1.06, 0.34], [-0.07, 1.06, 0.34]], [[-0.02, 1.1, 0.5], [0.02, 1.1, 0.5], [0.02, 1.04, 0.48], [-0.02, 1.04, 0.48]], t), blockY(0, 0.1, 1.32, 1.6, 0.14, 0.14, 0.18, 0.12, 0, 0, t)];
}
// a squatting baboon 2.4 m high (the row along the cornice), front toward +z: a plinth, the haunches, the mantle
// of fur over the shoulders, the head with its long muzzle, two knees drawn up, two forearms laid on them; one in
// two has lost a corner
function baboonBlocks(r) {
  const w = r.range(0.92, 1.08), hz = r.range(-0.05, 0.08), chip = r.chance(0.5) ? [[r(), r(), r.range(0.12, 0.3)]] : [], t = { h: 1.2 };
  const L = [blockY(0, 0, 0, 0.24, 0.78, 0.72, 0.78, 0.72, 0, 0, t), blockY(0, -0.08, 0.24, 1.25, 0.66 * w, 0.58, 0.74 * w, 0.56, 0.2, 0, t), blockY(0, -0.05, 1.25, 1.95, 0.76 * w, 0.56, 0.5 * w, 0.42, 0.2, 0.06, t),
    blockY(0, 0.1 + hz, 1.75, 2.38, 0.36, 0.36, 0.3, 0.3, 0.1, 0, t), loft(ringOf([0, 2.0, 0.42 + hz], AX, AY, rect(0.22, 0.2, 0.06)), ringOf([0, 1.9, 0.78 + hz], AX, AY, rect(0.15, 0.13, 0.04)), t)];
  for (const sg of [-1, 1]) L.push(blockY(sg * 0.43, 0.42, 0.24, 1.15, 0.2, 0.3, 0.18, 0.24, 0.06, 0, t), limb([sg * 0.5, 1.45, 0.2], [sg * 0.43, 1.08, 0.62], 0.13, 0.13, 0.12, 0.12, 0.04, t));
  return chipped(L, chip, 0.6);
}
// how far a place is from the nearest of many blocks (true inside stone and close to it, never too large; REACH
// and no more beyond REACH; a field asked for with a reach of nought answers only whether a place lies inside
// stone, and is much the cheaper): the blocks are sorted into cells of bs metres, each cell keeping those within its reach
async function blockField(blocks, b, tick, bs = 1.5, REACH = FIELD_REACH) {
  const nbx = Math.max(1, Math.ceil((b[3] - b[0]) / bs)), nby = Math.max(1, Math.ceil((b[4] - b[1]) / bs)), nbz = Math.max(1, Math.ceil((b[5] - b[2]) / bs)), hd = bs * 0.87, cells = new Array(nbx * nby * nbz);
  // (tight: for each cell only the blocks that can hold a place of it: what a field of no reach would keep, sorted
  // out in the same pass; whoever only asks whether a place lies inside stone is answered from these)
  const tight = new Array(cells.length);
  // (mid: for each cell only the blocks that can come within FIELD_MID of a place of it, sorted out in the same pass
  // by the same two bounds: an asker to whom anything beyond FIELD_MID is all one is answered from these, and the
  // answer is the same number)
  const mid = new Array(cells.length);
  const n = blocks.length, F = blocks.map((p) => p.g || p.f), CX = new Float64Array(n), CY = new Float64Array(n), CZ = new Float64Array(n), R = new Float64Array(n);
  // (THE SORT'S FIRST PIECE IS COUNTED COLD TIMES OVER: the front has one field and its sort runs once; its first
  // piece runs on cold code and lasted 28 to 46 ms where a piece is meant to be twelve, the longest piece of the
  // build that is the part's own, and a long task of the browser's on a busy machine (72 ms once in 76 loads,
  // measured at p1m3); the pieces after it last what they are counted at. So until the sort has handed the page
  // back once its work is told in lots COLD times smaller, as the first king's is: ONE MORE HAND-BACK, nothing
  // made otherwise and nothing in another order)
  let work = 0, cold = COLD;
  for (let q = 0; q < n; q++) {
    const S = blocks[q], c = S.c, reach = S.r + hd + REACH;
    CX[q] = c[0]; CY[q] = c[1]; CZ[q] = c[2]; R[q] = S.r;
    const i0 = Math.max(0, Math.floor((c[0] - reach - b[0]) / bs)), i1 = Math.min(nbx - 1, Math.floor((c[0] + reach - b[0]) / bs)), j0 = Math.max(0, Math.floor((c[1] - reach - b[1]) / bs)), j1 = Math.min(nby - 1, Math.floor((c[1] + reach - b[1]) / bs));
    const k0 = Math.max(0, Math.floor((c[2] - reach - b[2]) / bs)), k1 = Math.min(nbz - 1, Math.floor((c[2] + reach - b[2]) / bs));
    // (a block is counted by the cells it is asked at, layer by layer, a cell within its reach eight times over: a
    // great block reaches many)
    for (let k = k0; k <= k1; k++) { for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const far = hyp(b[0] + (i + 0.5) * bs - c[0], b[1] + (j + 0.5) * bs - c[1], b[2] + (k + 0.5) * bs - c[2]);
      if (far > reach) continue;
      work += 8;
      // (a cell wholly outside one of the block's planes by more than REACH holds none of it)
      const out = S.f(b[0] + (i + 0.5) * bs, b[1] + (j + 0.5) * bs, b[2] + (k + 0.5) * bs);
      if (out > hd + REACH) continue;
      const o = i + nbx * (j + nby * k); (cells[o] || (cells[o] = [])).push(q);
      if (far <= S.r + hd + FIELD_MID && out <= hd + FIELD_MID) (mid[o] || (mid[o] = [])).push(q);
      if (far <= S.r + hd && out <= hd) (tight[o] || (tight[o] = [])).push(q);
    }
      work += (j1 - j0 + 1) * (i1 - i0 + 1);
      if (tick && work > FIELD_WORK) { const back = tick(COST.field * work * cold); work = 0; if (back) { cold = 1; await back; } }
    }
  }
  if (tick && work) await tick(COST.field * work);
  const none = [];
  // (stop: an asker who only wants to know whether the place lies deeper than that in stone is answered at the first block that says so)
  // (cap: an asker to whom any distance beyond cap is all one is told no more than cap: blocks further off are not asked)
  const at = (x, y, z, stop = -1e9, cap = REACH) => {
    const fi = Math.floor((x - b[0]) / bs), fj = Math.floor((y - b[1]) / bs), fk = Math.floor((z - b[2]) / bs), i = fi < 0 ? 0 : fi >= nbx ? nbx - 1 : fi, j = fj < 0 ? 0 : fj >= nby ? nby - 1 : fj, k = fk < 0 ? 0 : fk >= nbz ? nbz - 1 : fk;
    // (the short list only for a place inside the field's own box, where a cell's bounds hold)
    const own = (cap <= FIELD_MID && fi === i && fj === j && fk === k ? mid : cells)[i + nbx * (j + nby * k)] || none;
    let d = cap < REACH ? cap : REACH;
    for (let o = 0; o < own.length; o++) { const q = own[o], dx = x - CX[q], dy = y - CY[q], dz = z - CZ[q]; if (Math.sqrt(dx * dx + dy * dy + dz * dz) - R[q] < d) { const v = F[q](x, y, z, d); if (v < d) { d = v; if (d < stop) return d; } } }
    return d;
  };
  // how deep a place lies inside stone (nought where it lies in none); answered at the first block that says deeper than stop
  at.inside = (x, y, z, stop = -1e9) => {
    const fi = Math.floor((x - b[0]) / bs), fj = Math.floor((y - b[1]) / bs), fk = Math.floor((z - b[2]) / bs), i = fi < 0 ? 0 : fi >= nbx ? nbx - 1 : fi, j = fj < 0 ? 0 : fj >= nby ? nby - 1 : fj, k = fk < 0 ? 0 : fk >= nbz ? nbz - 1 : fk;
    const own = tight[i + nbx * (j + nby * k)] || none;
    let d = 0;
    for (let o = 0; o < own.length; o++) { const q = own[o], dx = x - CX[q], dy = y - CY[q], dz = z - CZ[q]; if (Math.sqrt(dx * dx + dy * dy + dz * dz) - R[q] < d) { const v = F[q](x, y, z, d); if (v < d) { d = v; if (d < stop) return d; } } }
    return d;
  };
  return at;
}

// the mesh of a list of blocks: every face in triangles with no side longer than h (a block's own t.h, else h0), so
// that what is baked per corner (how open the corner lies, the sand on it) has corners to lie on. A side is halved
// at its middle whatever face it belongs to, so two faces that share a side share its points. Every corner carries
// its face's normal (on a round face: the direction out from the form's axis). kind per corner: 1 striped cloth, 2 a break.
function meshOf(blocks, h0) {
  const pos = [], nor = [], kind = [], idx = [];
  for (const S of blocks) {
    const h = S.t.h || h0, k = S.t.cloth ? 1 : 0;
    for (const f of S.faces) {
      if (f.hide) continue;
      const V = f.p.slice(), tris = [], mids = new Map(), base = pos.length / 3;
      for (let i = 1; i < V.length - 1; i++) tris.push(0, i, i + 1);
      const len = (i, j) => hyp(V[i][0] - V[j][0], V[i][1] - V[j][1], V[i][2] - V[j][2]);
      const mid = (i, j) => { const key = i < j ? i * 65536 + j : j * 65536 + i; let m = mids.get(key); if (m === undefined) { m = V.length; V.push([(V[i][0] + V[j][0]) / 2, (V[i][1] + V[j][1]) / 2, (V[i][2] + V[j][2]) / 2]); mids.set(key, m); } return m; };
      for (let t = 0; t < tris.length; t += 3) {
        const a = tris[t], b = tris[t + 1], c = tris[t + 2], ab = len(a, b), bc = len(b, c), ca = len(c, a), m = Math.max(ab, bc, ca);
        if (m <= h) continue;
        if (m === ab) { const q = mid(a, b); tris[t + 1] = q; tris.push(q, b, c); } else if (m === bc) { const q = mid(b, c); tris[t + 2] = q; tris.push(a, q, c); } else { const q = mid(c, a); tris[t + 2] = q; tris.push(q, b, c); }
        t -= 3;
      }
      for (const q of V) {
        pos.push(q[0], q[1], q[2]); kind.push(f.broke ? 2 : k);
        if (f.round) {
          // out from the axis, leaned as the face leans
          const A = f.round[0], B = f.round[1], ax = v3unit(v3sub(B, A)), d = v3sub(q, A), s = v3dot(d, ax), out = v3unit([d[0] - ax[0] * s, d[1] - ax[1] * s, d[2] - ax[2] * s]), up = v3dot(f.n, ax), n = v3unit([out[0] + ax[0] * up, out[1] + ax[1] * up, out[2] + ax[2] * up]);
          nor.push(n[0], n[1], n[2]);
        } else nor.push(f.n[0], f.n[1], f.n[2]);
      }
      for (let t = 0; t < tris.length; t++) idx.push(base + tris[t]);
    }
  }
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), idx, kind };
}

// Before a figure's blocks are meshed, every face that lies wholly inside ONE other block of the figure is marked
// hidden (a face is flat and a block convex: where every corner of the face, a hand out along its normal, lies
// inside the block, the whole face does). Such a face is never meshed, placed, marked or baked.
// (a long list is gone through twenty blocks at a time, the page handed back between: the same marks)
async function hideInside(blocks, tick, cold = 1) {
  const n = blocks.length, E = 0.04, IN = -0.012, CX = new Float64Array(n), CY = new Float64Array(n), CZ = new Float64Array(n), R = new Float64Array(n);
  for (let j = 0; j < n; j++) { const B = blocks[j]; CX[j] = B.c[0]; CY[j] = B.c[1]; CZ[j] = B.c[2]; R[j] = B.r; }
  // (the first king's list runs cold: ten at a time)
  const each = cold > 1 ? 10 : 20;
  for (let i = 0; i < n; i++) { if (tick && i % each === each - 1) await tick(COST.hide * each * cold); for (const f of blocks[i].faces) {
    if (f.hide) continue;
    const P = f.p, ex = f.n[0] * E, ey = f.n[1] * E, ez = f.n[2] * E, q = P[0], qx = q[0], qy = q[1], qz = q[2];
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const ax = qx - CX[j], ay = qy - CY[j], az = qz - CZ[j];
      if (Math.sqrt(ax * ax + ay * ay + az * az) > R[j]) continue;
      const B = blocks[j];
      let all = true; for (let c = 0; c < P.length; c++) if (B.f(P[c][0] + ex, P[c][1] + ey, P[c][2] + ez) > IN) { all = false; break; }
      if (all) { f.hide = true; break; }
    }
  } }
}
// (a long list of blocks is meshed thirty at a time, the page handed back between: the same mesh)
async function meshOfPieces(blocks, h0, tick, cold = 1) {
  const parts = []; let n = 0;
  // (the first king's list runs cold: eight at a time, its first dozen three at a time)
  for (let i = 0, each; i < blocks.length; i += each) { each = cold > 1 ? (i < 12 ? 3 : 8) : 30; const m = meshOf(blocks.slice(i, i + each), h0); parts.push(m); n += m.pos.length / 3; await tick(COST.mesh * m.pos.length / 3 * cold); }
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), idx = [], kind = [];
  let at = 0;
  for (const m of parts) { pos.set(m.pos, at * 3); nor.set(m.nor, at * 3); for (let i = 0; i < m.idx.length; i++) idx.push(m.idx[i] + at); for (let i = 0; i < m.kind.length; i++) kind.push(m.kind[i]); at += m.pos.length / 3; }
  // (the pieces put together: a tenth again of the meshing)
  await tick(COST.mesh * 0.1 * n * cold);
  return { pos, nor, idx, kind };
}

// ---------------------------------------------------------------- the sun's map: what stands between a point and the sun
// The front's cast shade is drawn once, in build, into a map seen from the sun: for every cell of the map, how near
// the sun the stone that fills it comes (depth along the sun's own direction). A point of stone is in shade where
// the map holds stone nearer the sun than the point. Blocks are drawn by their faces that look AWAY from the sun
// (a lit face then never shades itself, and what lies behind a block is shaded from the block's far skin on);
// a skin with no far side (the bluff's face) is drawn by its lit side, set back by `back` metres.
// frame: { U, V, W (W toward the sun), u0, v0, cell, nx, ny }; depth is kept in metres along W.
// (more: a second box the map holds as well, laid on the FIRST box's own cells: the map grows by whole cells, so
// every cell the first box alone would have lies where it lay and holds what it held)
function sunFrame(sunL, box, cell, more = null) {
  const W = v3unit([sunL.x, sunL.y, sunL.z]), U = v3unit(v3cross(AY, W)), V = v3cross(W, U);
  const span = (b) => {
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9, w0 = 1e9, w1 = -1e9;
    for (let c = 0; c < 8; c++) { const p = [b[c & 1 ? 3 : 0], b[c & 2 ? 4 : 1], b[c & 4 ? 5 : 2]], u = v3dot(p, U), v = v3dot(p, V), w = v3dot(p, W); u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); w0 = Math.min(w0, w); w1 = Math.max(w1, w); }
    return [u0, u1, v0, v1, w0, w1];
  };
  let [u0, u1, v0, v1, w0, w1] = span(box);
  if (more) {
    const q = span(more);
    if (q[0] < u0) u0 -= cell * Math.ceil((u0 - q[0]) / cell);
    if (q[2] < v0) v0 -= cell * Math.ceil((v0 - q[2]) / cell);
    u1 = Math.max(u1, q[1]); v1 = Math.max(v1, q[3]); w0 = Math.min(w0, q[4]); w1 = Math.max(w1, q[5]);
  }
  const nx = Math.ceil((u1 - u0) / cell), ny = Math.ceil((v1 - v0) / cell);
  return { U, V, W, u0, v0, w0: w0 - 1, w1: w1 + 1, cell, nx, ny, depth: new Float32Array(nx * ny).fill(-1e9) };
}
// one triangle into the map (the largest depth wins)
function sunTri(F, a, b, c, back) {
  const { U, V, W, u0, v0, cell, nx, ny, depth } = F;
  const ax = (v3dot(a, U) - u0) / cell, ay = (v3dot(a, V) - v0) / cell, az = v3dot(a, W) - back, bx = (v3dot(b, U) - u0) / cell, by = (v3dot(b, V) - v0) / cell, bz = v3dot(b, W) - back, cx = (v3dot(c, U) - u0) / cell, cy = (v3dot(c, V) - v0) / cell, cz = v3dot(c, W) - back;
  const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  if (Math.abs(area) < 1e-9) return 0;
  const i0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), i1 = Math.min(nx - 1, Math.ceil(Math.max(ax, bx, cx))), j0 = Math.max(0, Math.floor(Math.min(ay, by, cy))), j1 = Math.min(ny - 1, Math.ceil(Math.max(ay, by, cy)));
  const e = 0.5 / Math.abs(area), ia = 1 / area, da = (by - cy) * ia, db = (cy - ay) * ia;
  for (let j = j0; j <= j1; j++) {
    // (the three weights run straight along a row of cells: one sum each from cell to cell)
    const py = j + 0.5, px = i0 + 0.5;
    let wa = ((bx - px) * (cy - py) - (by - py) * (cx - px)) * ia, wb = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) * ia;
    for (let i = i0, o = j * nx + i0; i <= i1; i++, o++, wa += da, wb += db) {
      const wc = 1 - wa - wb;
      // (a cell is taken when its middle lies in the triangle or within half a cell of its sides)
      if (wa < -e || wb < -e || wc < -e) continue;
      const d = wa * az + wb * bz + wc * cz;
      if (d > depth[o]) depth[o] = d;
    }
  }
  // (the count of cells gone over, for the build's hand-backs: a triangle wholly off the map has gone over none)
  return Math.max(0, i1 - i0 + 1) * Math.max(0, j1 - j0 + 1);
}
// cells o0 to o1 of the map packed into two bytes each (a small function of its own: a loop over half a million
// cells runs many times quicker here than inside the front's one great function)
function sunPack(D, pix, w0, k, o0, o1) {
  for (let o = o0; o < o1; o++) {
    const d = D[o];
    if (d > -1e8) { const q = Math.min(65535, Math.max(1, ((d - w0) * k + 0.5) | 0)); pix[o * 2] = q >> 8; pix[o * 2 + 1] = q & 255; }
  }
}
// a list of blocks into the map: their far faces, as fans
function sunBlocks(F, blocks) {
  let work = 0;
  for (const S of blocks) for (const f of S.faces) {
    if (v3dot(f.n, F.W) > -1e-4) continue;
    for (let i = 1; i < f.p.length - 1; i++) work += sunTri(F, f.p[0], f.p[i], f.p[i + 1], 0);
  }
  return work;
}

// ---------------------------------------------------------------- the bluff's river face as a surface z = wallZ(x, y)
// THE BLUFF is living sandstone in level beds BED metres thick: each bed's riser is nearly upright and ends in a
// ledge LEDGE metres deep, so the whole face steps back as it rises; upright buttresses and gullies break it along
// its length; within SHOULDER metres of its top it rounds over into the hill. THE FRONT is cut back into it: one
// battered plane that leans in seven degrees and is wider at its foot than at its head, its head running out
// into the rough rock with no frame; a roll and a deep hollow cornice at its head with the sunk band
// of the squatting row over it; the door with its slab lintel and the niche over it. The cut is nowhere deeper
// than the kings' own depth: they stand out of the bluff.
// THE CUT'S TWO SIDES ARE EACH A MASON'S RETURN (p1m3, job 8; both sides by the one rule, on every seed). Rock cut
// by hands ends in a clean edge. The line where the cut ends is STRAIGHT and has no chance in it: half the
// front's breadth from the door's axis at the foot (HALF), nearer by SIDE for every metre of height (halfAt: the
// cut is wider at its foot), and it leans back with the cut's own batter, for its inner arris lies in the cut's
// plane. On that line stands the RETURN: ONE PLANE, square to the cut's breadth (it holds the line and the
// direction out of the face), between the cut's own surface and the natural rock. Its inner arris is where it
// meets the cut's plane, its outer arris where the natural face begins: one straight line as the front is looked
// at. ITS DEPTH AT A HEIGHT IS WHAT THE TWO SURFACES GIVE THERE: deep where the cliff stands proud of the plane,
// shallow where a bed's ledge has stepped the cliff back; and where the cut's own moulding stands proud of the
// rock (the hollow cornice flares out past a cliff that has stepped back) the return is that moulding's end
// and looks outward. Both arrises are HARD: the return's corners are its own, with the plane's one normal, shared
// neither with the cut's plane nor with the natural face. Its skin is the cut's dressed stone. Beyond the outer
// arris the natural rock is as ragged as it ever was.
// W: { noise, bend(x, y) metres the face stands back at x and height y (0 at the front), top(x) the bluff's height at its edge }
const LEAN = Math.tan(7 * Math.PI / 180), HALF = 31, SIDE = 0.1, CORN = 24.9, RTOP = 27.5, BAND = 30.4, DOOR_W = 3.75, DOOR_H = 10.5, NICHE = [12.6, 18.4];
const PASSAGE = 16, PILLAR_Z = -0.3, BED = 6.5, LEDGE = 0.75, BED_AT = [0, 0.33, 0.66, 0.965, 0.995], SHOULDER = 9, PROUD = 1.5;
// the kings' size and seat: KS times the carving's measure, lifted so that the pedestal's top stands 2 m over the
// terrace; where the four sit along the face (the first met to the broken one)
const KS = 1.1, KLIFT = 2 - 1.4 * KS, KX = [23, 11, -11, -23];
// THE DOOR'S RING stands two thirds of the way down the passage (DOOR_IN metres inside the face): so deep that the
// jambs hide it from any eye that stands more than some thirty degrees off the door's axis, and its light shows
// from before the door only
const DOOR_IN = PASSAGE * 2 / 3;
// the front's own measures, for whoever lays a place round it before it is built: the cut's breadth, a king's
// height from his pedestal's top to his crown's, the first king's outer foot (along the face, out from it), the
// plane of the knees and of the toes, how deep the door's ring stands
export const MEASURES = { front: 2 * HALF, king: (CROWN_TOP - 1.4) * KS, foot: [KX[0] + 4.9 * KS, 10.5 * KS], kneeZ: 8.8 * KS, toesZ: 10.5 * KS, doorIn: DOOR_IN, passage: PASSAGE, bed: BED };
// half the front's width at height y
const halfAt = (y) => HALF - SIDE * clamp(y, 0, BAND);
// the beds' own warp along the face (none beside the front, where the carved lines are level)
const bedWarp = (W, x) => 0.22 * W.noise.n2(x * 0.012, 4.2) * sstep(36, 80, Math.abs(x));
// how many ledges the natural face has stepped back by at height y, at x along it: the whole beds below, and the
// ledge at the top of the bed the height lies in. For whoever steps another form by the cliff's own beds (the
// world: a ravine's walls widen and deepen by these same ledges, so their risers and ledges meet the face's)
export const bedSteps = (noise, x, y) => { const yy = Math.max(y, 0) / BED + bedWarp({ noise }, x), bed = Math.floor(yy); return bed + sstep(BED_AT[3], BED_AT[4], yy - bed); };
// the natural rock
function rockZ(W, x, y) {
  const n = W.noise, ax = Math.abs(x), top = W.top(x);
  let z = PROUD + 0.7 * n.fbm2(x * 0.035, y * 0.06 + 7, 3) + 0.22 * n.n2(x * 0.4, y * 0.05 + 11) - W.bend(x, y) - 0.03 * y;
  // the beds: every riser ends in a ledge; the ledges' depth changes slowly along the face
  const yy = Math.max(y, 0) / BED + bedWarp(W, x), bed = Math.floor(yy), fr = yy - bed;
  z -= LEDGE * (bed + sstep(BED_AT[3], BED_AT[4], fr)) * (0.8 + 0.35 * n.n2(x * 0.021, 9.7));
  // buttresses 25 to 40 m apart that stand three to four metres proud, gullies cut between them (none in the front)
  const wild = sstep(HALF + 2, HALF + 26, ax);
  if (wild > 0) { const but = n.n2(x * 0.034 + 5, y * 0.006), gul = Math.abs(n.n2(x * 0.083, y * 0.014 + 3)); z += wild * (3.6 * but + 1.2 * gul - 2.4 * sstep(0.3, 0.04, gul) * sstep(0.1, -0.4, but)); }
  // the shoulder: the top rounds over into the hill
  const t = clamp((y - (top - SHOULDER)) / SHOULDER, 0, 1);
  return z - SHOULDER * (1 - Math.sqrt(1 - t * t));
}
// the cut plane with its mouldings
function cutZ(W, x, y) {
  const ax = Math.abs(x);
  let z = -LEAN * Math.min(y, RTOP);
  // the roll at the cornice's foot, the hollow cornice that flares out under the row's seat, the sunk band over it
  if (y > CORN - 0.7) z += y < CORN ? 0.32 * Math.sin((y - CORN + 0.7) / 0.7 * Math.PI) : y < RTOP ? 1.9 * (1 - Math.cos((y - CORN) / (RTOP - CORN) * Math.PI / 2)) : y < RTOP + 0.35 ? 1.9 : 0.3;
  // the framed door with its slab lintel, the niche over it
  if (ax < DOOR_W + 0.95 && y < DOOR_H + 1.4) z += y > DOOR_H ? 0.55 : ax > DOOR_W ? 0.38 : 0;
  if (ax < 1.75 && y > NICHE[0] && y < NICHE[1]) z -= 1.3;
  // each king's back pillar: the upright slab he is one with, standing out of the leaning plane as far as his own back
  for (const p of W.pillars) if (Math.abs(x - p[0]) < p[1] && y < p[2]) z = Math.max(z, PILLAR_Z);
  // faint large shapes where relief once stood, a hand deep, and the dressing's own unevenness
  return z + 0.07 * sstep(0.1, 0.5, W.noise.n2(x * 0.11 + 3, y * 0.09)) * sstep(CORN - 1, CORN - 2.5, y) + 0.05 * W.noise.n2(x * 0.5, y * 0.5 + 5);
}
// the cut's own surface wherever it is asked (its plane and mouldings; at its head it runs out into the rock: a
// ragged line, the break one to two and a half metres high)
function dressedZ(W, x, y) {
  const n = W.noise, nat = rockZ(W, x, y);
  if (y > BAND + 5) return nat;
  const head = BAND + 1.1 * n.n2(x * 0.17 + 9, 1.7) + 0.4 * n.n2(x * 0.7, 4.4), et = 0.8 + 1.6 * (0.5 + 0.5 * n.n2(x * 0.13 + 9, 2.9));
  const m = sstep(head + et * 0.6, head - et * 0.4, y);
  return m > 0 ? lerp(nat, Math.min(cutZ(W, x, y), nat + 2.5), m) : nat;
}
// the face: the cut's surface between the two returns, the natural rock beyond them (the return itself is the
// step between the two at halfAt(y): see the head of this section)
function wallZ(W, x, y) {
  return Math.abs(x) > halfAt(y) ? rockZ(W, x, y) : dressedZ(W, x, y);
}
// grid lines: even steps plus the lines where the surface breaks
function gridLines(a, b, step, breaks) {
  const out = breaks.filter((v) => v > a && v < b);
  for (let v = a; v < b - step * 0.3; v += step) if (!out.some((q) => Math.abs(q - v) < step * 0.3)) out.push(v);
  out.push(b);
  return out.sort((p, q) => p - q).filter((v, i, arr) => i === 0 || v - arr[i - 1] > 1e-4);
}
// the face mesh between x0 and x1 (fine beside the front, coarse beyond), with the door left open. Its rows follow
// the beds (a row at each ledge's two edges) and, within SHOULDER metres of the top, the round of the shoulder; the
// last two rows run back over the hill's brow.
const ROUND = [0, 20, 40, 58, 74, 90].map((a) => Math.sin(a * Math.PI / 180));
// the rows of a COARSE column of the natural face at x, for whoever builds more of the same cliffs beyond this
// part's own wall (the world: the line of cliffs goes on to the land's ends): the foot, each bed's riser top and
// its ledge's inner corner, the shoulder's round; and what a corner at (x, y) is told of that corner's hollow
function farRows(W, x) {
  const y1 = W.top(x) - SHOULDER, warp = bedWarp(W, x), ys = [-1.6], hollow = [false];
  for (let k = 0; (k - warp) * BED < y1; k++) for (const f of [BED_AT[3], BED_AT[4]]) { const y = (k + f - warp) * BED; if (y > -1 && y < y1 - 0.4) { ys.push(y); hollow.push(f === BED_AT[4]); } }
  ys.push(y1); hollow.push(false);
  for (let k = 1; k < ROUND.length; k++) { ys.push(y1 + SHOULDER * ROUND[k]); hollow.push(false); }
  return { ys, hollow };
}
async function buildWall(W, x0, x1, tick) {
  const e = 0.03, xb = [], yb = [0, DOOR_H - e, DOOR_H, DOOR_H + 1.4 - e, DOOR_H + 1.4, NICHE[0], NICHE[0] + e, NICHE[1], NICHE[1] + e, CORN - 0.7, CORN - 0.35, CORN, RTOP - e, RTOP, RTOP + 0.35, RTOP + 0.35 + e];
  for (const sg of [-1, 1]) xb.push(sg * DOOR_W, sg * (DOOR_W + e), sg * (DOOR_W + 0.95 - e), sg * (DOOR_W + 0.95), sg * 1.75, sg * (1.75 + e));
  for (const p of W.pillars) { xb.push(p[0] - p[1] - e, p[0] - p[1] + e, p[0] + p[1] - e, p[0] + p[1] + e); yb.push(p[2] - e, p[2] + e); }
  // THE RETURNS' COLUMNS (see the section's head). The mesh's columns are upright lines and the cut's side leans:
  // so the columns beside each return are FANNED to it. A column is named by where it stands at the foot (u); the
  // column at HALF is the return's own line, sg x halfAt(y) at every height; the columns between it and the outer
  // kings' back slabs (SLAB: the slab's outer edge, a break line of the grid, never moved) share out evenly what
  // lies between the two at each height, and so do the columns between it and the near grid's end (NEAR). Below
  // the terrace and beyond SLAB and NEAR every column stands where it stood. The return's line bears TWO columns:
  // the cut's last (the inner arris, its normal the cut's plane's) and the rock's first (the outer arris, its
  // normal the rock's); between them no strip is drawn but the return's own plane.
  const NEAR = HALF + 5, SLAB = Math.max(...W.pillars.map((p) => Math.abs(p[0]) + p[1])) + e;
  const xOf = (u, y) => {
    const a = Math.abs(u), sg = u < 0 ? -1 : 1, h = halfAt(y);
    return a <= SLAB || a >= NEAR ? u : a === HALF ? sg * h : a < HALF ? sg * (SLAB + (a - SLAB) * (h - SLAB) / (HALF - SLAB)) : sg * (NEAR - (NEAR - a) * (NEAR - h) / (NEAR - HALF));
  };
  // (the grid has a column on each return's line and one RET_IN metres inside it at the foot: the cut's plane's
  // own hollow shade beside the return is drawn within that)
  const RET_IN = 0.4;
  xb.push(-HALF, HALF, RET_IN - HALF, HALF - RET_IN);
  const xsNear = gridLines(Math.max(x0, -NEAR), Math.min(x1, NEAR), 1.0, xb), xs = [];
  for (let x = x0; x < -NEAR - 1.5; x += 3) xs.push(x);
  xs.push(...xsNear);
  for (let x = NEAR + 3; x < x1 - 1.5; x += 3) xs.push(x);
  if (x1 > NEAR) xs.push(x1);
  // WHERE THE FACE BENDS BACK FAST the coarse columns are not enough: a ravine's wall, the nose's flank. A stretch
  // between two coarse columns is STEEP where the face's own bend differs by more than STEEP metres across it at
  // some bed's height; every coarse stretch within FINE_REACH metres of a steep one (a ravine's floor lies
  // between its two walls) gets columns FINE metres apart, and those columns carry the near rows (a row at each
  // ledge's two edges and one every metre between). So a wall's arris, its ledges and the edge of its shade are
  // drawn at a metre's grain there and never across a coarse triangle. The one rule for the whole face.
  const STEEP = 1, FINE = 1, FINE_REACH = 9, fineX = new Set();
  {
    const steepAt = [];
    for (let i = 0; i + 1 < xs.length; i++) {
      if (xs[i + 1] - xs[i] < 2 * FINE) continue;
      for (let y = BED / 2; y < BAND + 2 * BED; y += BED / 2) if (Math.abs(W.bend(xs[i], y) - W.bend(xs[i + 1], y)) > STEEP) { steepAt.push(i); break; }
    }
    const more = [];
    for (let i = 0; i + 1 < xs.length; i++) {
      const a = xs[i], b = xs[i + 1];
      if (b - a < 2 * FINE || !steepAt.some((q) => xs[q] < b + FINE_REACH && xs[q + 1] > a - FINE_REACH)) continue;
      fineX.add(a); fineX.add(b);
      for (let k = 1, n = Math.round((b - a) / FINE); k < n; k++) { more.push(lerp(a, b, k / n)); fineX.add(more[more.length - 1]); }
    }
    xs.push(...more); xs.sort((p, q) => p - q);
  }
  // (the return's line twice: the rock's column and the cut's, the rock's the further from the door. rock[i]: the
  // column i is of the natural face)
  for (const sg of [-1, 1]) { const i = xs.indexOf(sg * HALF); if (i >= 0) xs.splice(i, 0, sg * HALF); }
  const rock = xs.map((u, i) => Math.abs(u) > HALF || (Math.abs(u) === HALF && (u < 0 ? xs[i + 1] === u : xs[i - 1] === u)));
  const pos = [], nor = [], idx = [], kind = [], cols = xs.length, colY = [], colTop = [];
  for (let i = 0; i < cols; i++) {
    // (a column's rows are laid by where it stands over the cut's head, where its top is: the same place for every
    // column that is not fanned)
    const x = xs[i], top = W.top(xOf(x, BAND)), y1 = top - SHOULDER, near = Math.abs(x) < NEAR, fine = near || fineX.has(x), warp = bedWarp(W, x), beds = [];
    colTop.push(top);
    for (let k = 0; (k - warp) * BED < y1; k++) for (const f of fine ? [BED_AT[3], BED_AT[4]] : BED_AT) beds.push((k + f - warp) * BED);
    // (the two columns on a return's line have a row where the line's lean ends: at the cut's head)
    const ys = near ? gridLines(-1.6, y1, 1.05, yb.concat(beds, Math.abs(x) === HALF ? [BAND] : [])) : fine ? gridLines(-1.6, y1, 1.05, beds) : [-1.6, ...beds.filter((y) => y > -1 && y < y1 - 0.4), y1];
    for (let k = 1; k < ROUND.length; k++) ys.push(y1 + SHOULDER * ROUND[k]);
    colY.push(ys);
    if (i % 30 === 29) await tick(COST.column * 8);
  }
  // (a corner of the column u at height y: on the surface of its own side of the return, the cut's or the rock's,
  // with that surface's own slopes: so no normal is taken across the return's step)
  const vAt = (u, y, top, face, mk) => {
    // the slope across the face ahead, up the face below (a ledge's flat and the shoulder's round end above the point)
    const x = xOf(u, y), z = face(W, x, y), h = 0.12, dzx = (face(W, x + h, y) - z) / h, dzy = (z - face(W, x, y - h)) / h, l = hyp(dzx, dzy, 1);
    pos.push(x, y, z); kind.push(mk);
    if (y > top - 0.01) nor.push(0, 1, 0.1); else nor.push(-dzx / l, -dzy / l, 1 / l);
    return pos.length / 3 - 1;
  };
  // THE RETURN'S PLANE between the two columns on its line (A: the cut's corners, B: the rock's, row for row at the
  // same place but for their depth). Its corners are ITS OWN, with the plane's one normal (hard arrises): turned
  // to look into the cut where the rock stands proud, outward where the cut's moulding does. It has corners
  // ACROSS it too, at the bake's own radii from its hollow arris (the lower of the two, where it meets the floor
  // it stands on: RET_AT), so that the shade of that hollow is drawn where it lies and not smeared over the whole
  // depth. Where the two surfaces change places between two rows the piece is two triangles meeting at the
  // point where the two arrises cross. Nothing is drawn where the two surfaces are one (over the cut's head: a
  // depth under RET_LEAST metres). form: for a corner of the plane, how far it stands from the hollow arris; for
  // a corner of the two columns, how high the return stands over it (nought on the arris that stands free).
  const RET_LEAST = 0.002, RET_AT = [0, ...AO_R.map((q) => q[0] * 0.62), 1e9], form = [];
  const returnOf = (A, B, rows) => {
    const P = (q) => [pos[q * 3], pos[q * 3 + 1], pos[q * 3 + 2]];
    const tri = (a, b, c, n) => {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const o = pos.length / 3, flip = (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] < 0;
      for (const q of flip ? [a, c, b] : [a, b, c]) { pos.push(q[0], q[1], q[2]); nor.push(n[0], n[1], 0); kind.push(3); form[pos.length / 3 - 1] = q[3]; }
      idx.push(o, o + 1, o + 2);
    };
    for (let k = 0; k < rows; k++) { const d = pos[B[k] * 3 + 2] - pos[A[k] * 3 + 2]; form[A[k]] = Math.max(d, 0); form[B[k]] = Math.max(-d, 0); }
    for (let k = 0; k + 1 < rows; k++) {
      const a0 = P(A[k]), b0 = P(B[k]), a1 = P(A[k + 1]), b1 = P(B[k + 1]), d0 = b0[2] - a0[2], d1 = b1[2] - a1[2];
      if (Math.abs(d0) < RET_LEAST && Math.abs(d1) < RET_LEAST) continue;
      // (the plane's normal: square to the line's own lean between the two rows, with nothing of it out of the face;
      // toward the door where the rock is the prouder)
      const dx = a1[0] - a0[0], dy = a1[1] - a0[1], l = hyp(dx, dy), sg = a0[0] < 0 ? -1 : 1, nIn = [-sg * dy / l, sg * dx / l], nOut = [-nIn[0], -nIn[1]];
      if (d0 * d1 < 0) {
        const t = d0 / (d0 - d1), c = [lerp(a0[0], a1[0], t), lerp(a0[1], a1[1], t), lerp(a0[2], a1[2], t), 0];
        a0[3] = d0 > 0 ? 0 : -d0; b0[3] = d0 > 0 ? d0 : 0; a1[3] = d1 > 0 ? 0 : -d1; b1[3] = d1 > 0 ? d1 : 0;
        tri(a0, b0, c, d0 > 0 ? nIn : nOut); tri(c, b1, a1, d1 > 0 ? nIn : nOut);
        continue;
      }
      // (the corner of row r that stands h metres out from the hollow arris, no further than the return is deep)
      const n = d0 + d1 > 0 ? nIn : nOut, at = (a, d, h) => { const q = Math.min(h, Math.abs(d)); return [a[0], a[1], (d > 0 ? a[2] : a[2] + d) + q, q]; };
      for (let j = 0; j + 1 < RET_AT.length; j++) {
        const p0 = at(a0, d0, RET_AT[j]), q0 = at(a0, d0, RET_AT[j + 1]), p1 = at(a1, d1, RET_AT[j]), q1 = at(a1, d1, RET_AT[j + 1]);
        if (q0[3] - p0[3] > 1e-4) tri(p0, q0, p1, n);
        if (q1[3] - p1[3] > 1e-4) tri(q0, q1, p1, n);
      }
    }
  };
  const inDoor = (x, y) => Math.abs(x) < DOOR_W && y < DOOR_H - 0.01 && y > -0.5, fineAt = [];
  let prev = null;
  for (let i = 0; i < cols; i++) {
    await tick(COST.column * (colY[i].length / 40));
    const onLine = Math.abs(xs[i]) === HALF && (xs[i - 1] === xs[i] || xs[i + 1] === xs[i]);
    const top = colTop[i], face = rock[i] ? rockZ : dressedZ, cur = colY[i].map((y) => vAt(xs[i], y, top, face, onLine ? (rock[i] ? 2 : 1) : 0));
    if (fineX.has(xs[i]) && Math.abs(xs[i]) >= NEAR) for (const q of cur) fineAt.push(q);
    // the brow: two rows running back over the hill from the shoulder's end
    const zt = pos[cur[cur.length - 1] * 3 + 2];
    for (const [up, back] of [[0.5, 6], [1.6, 17]]) { pos.push(xOf(xs[i], BAND), top + up, zt - back); nor.push(0, 1, 0.1); kind.push(0); cur.push(pos.length / 3 - 1); }
    if (prev && xs[i - 1] === xs[i]) {
      // (the two columns on a return's line: the return's plane and no strip)
      if (rock[i]) returnOf(prev, cur, colY[i].length); else returnOf(cur, prev, colY[i].length);
    } else if (prev) {
      const ya = colY[i - 1], yc = colY[i], na = prev.length - 3, nc = cur.length - 3;
      // walk both columns upward, always closing the lower edge (a strip between two sorted lists)
      let a = 0, c = 0;
      while (a < na || c < nc) {
        const stepA = c >= nc || (a < na && ya[a + 1] <= yc[c + 1]);
        const mx = (xs[i - 1] + xs[i]) / 2, my = stepA ? (ya[a] + ya[a + 1] + yc[c]) / 3 : (ya[a] + yc[c] + yc[c + 1]) / 3;
        if (!inDoor(mx, my)) { if (stepA) idx.push(prev[a], cur[c], prev[a + 1]); else idx.push(prev[a], cur[c], cur[c + 1]); }
        if (stepA) a++; else c++;
      }
      for (let k = 0; k < 2; k++) { const p = prev[na + k], q = cur[nc + k]; idx.push(p, q, p + 1, q, q + 1, p + 1); }
    }
    prev = cur;
  }
  // (fine: one for every corner on a fine column outside the near zone: where the face bends back fast)
  const fine = new Float32Array(pos.length / 3);
  for (const q of fineAt) fine[q] = 1;
  // (kind: for every corner 0, or on a return's line 1 the cut's arris, 2 the rock's, 3 the return's own plane)
  const formOf = new Float32Array(pos.length / 3);
  for (let q = 0; q < formOf.length; q++) formOf[q] = form[q] || 0;
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), idx, fine, kind: Uint8Array.from(kind), form: formOf };
}

// ---------------------------------------------------------------- lesser figures, each plain and worn
// a crouching lion 5 m long and 2.9 m high (the way up to the buried temple), head toward +z: a plinth, the long body
// with its haunches, the chest upright, the head raised in the round ruff of its mane, two forepaws laid out before it
export function lionSolids(r) {
  const w = r.range(0.92, 1.1), hd = r.range(-0.08, 0.08), L = [];
  L.push(box(0, 0.2, 0, 0.95, 0.2, 2.5, 0.08, 0.08));
  L.push(ell(0, 1.12, -0.75, 0.7 * w, 0.72, 1.5, 0.35));
  for (const sg of [-1, 1]) L.push(ell(sg * 0.6 * w, 0.95, -1.55, 0.44, 0.66, 0.76, 0.3));
  L.push(ell(0, 1.5, 0.5, 0.66 * w, 0.98, 0.62, 0.35));
  // the mane: a ruff round the head, broad and high and thin, its rim the line that tells a lion from a lump
  L.push(ell(0, 2.05 + hd, 0.72, 0.92, 0.9, 0.46, 0.14));
  L.push(ell(0, 2.16 + hd, 1.14, 0.5, 0.5, 0.5, 0.16));
  L.push(box(0, 1.98 + hd, 1.6, 0.29, 0.21, 0.24, 0.12, 0.12));
  for (const sg of [-1, 1]) {
    L.push(ell(sg * 0.44, 2.7 + hd, 0.98, 0.15, 0.17, 0.12, 0.08));
    // a forepaw: the leg laid out along the plinth, the paw a broader end
    L.push(cap(sg * 0.5, 0.64, 0.95, sg * 0.5, 0.58, 2.1, 0.27, 0.23, 0.14));
    L.push(ell(sg * 0.5, 0.6, 2.2, 0.31, 0.24, 0.3, 0.1));
  }
  // each is worn differently: a lost muzzle, an ear, a bite out of the back
  for (let i = 0, n = r.int(1, 2); i < n; i++) L.push(cut(ell(r.range(-0.6, 0.6), r.range(1.3, 2.6), r.range(-1.6, 1.9), r.range(0.2, 0.4), r.range(0.2, 0.35), r.range(0.2, 0.4)), 0.12));
  return L;
}
// the nine carved blocks of the broken king: each is a piece of HIM (a region of his whole figure, in the king
// frame, with flat sharp-edged breaks), lying on the terrace where it has lain since he broke. c, h: the region; e: how it lies (turns about x, y, z).
const BLOCKS = [
  { name: 'face', c: [0, 18.4, 3.5], h: [2.7, 1.95, 1.7], cell: 0.21, e: [0.1, 0.3, 1.5] },
  { name: 'crown', c: [0, 20.5, 2.6], h: [1.75, 1.05, 1.75], cell: 0.25, e: [1.2, 0.4, 0.2] },
  { name: 'shoulder', c: [3.7, 14.4, 2.3], h: [1.45, 1.65, 1.45], cell: 0.31, e: [0.5, 1.1, 0.9] },
  { name: 'arm', c: [-3.8, 13.9, 2.4], h: [1.3, 1.5, 1.3], cell: 0.31, e: [1.4, 0.2, 0.3] },
  { name: 'lappet', c: [1.6, 15.6, 3.6], h: [0.85, 1.6, 0.75], cell: 0.26, e: [1.45, 0.9, 0.1] },
  { name: 'wing', c: [2.4, 17.6, 2.5], h: [1.3, 1.9, 1.05], cell: 0.29, e: [1.3, 2.2, 0.2] },
  { name: 'chest', c: [-1.0, 13.9, 3.0], h: [1.9, 1.4, 1.6], cell: 0.34, e: [-1.2, 0.5, 0.15] },
  { name: 'breast', c: [1.4, 13.6, 2.2], h: [1.5, 1.2, 1.5], cell: 0.34, e: [0.3, 2.6, 1.3] },
  { name: 'forearm', c: [-3.15, 11.05, 4.3], h: [1.15, 0.85, 2.0], cell: 0.29, e: [0.15, 1.9, 0.5] },
];

// ---------------------------------------------------------------- the sandstone shader (one for every stone here)
// aBake = (occlusion, sun reaching the point, sand lying on it), aMark = (desert varnish; over one: mud. Striped
// cloth; below nought: worn relief),
// aLocal = the point in its own figure's frame (the stripes of a broken-off piece of headcloth turn with the piece).
// aFine = one where the natural face bends back fast (a ravine's walls and floor, the nose's flank), nought elsewhere.
const STONE_VERT = /* glsl */`
attribute vec3 aBake; attribute vec2 aMark; attribute vec3 aLocal; attribute float aFine;
varying vec3 vWp; varying vec3 vN; varying vec3 vBake; varying vec2 vMark; varying vec3 vLocal; varying float vFine;
#include <fog_pars_vertex>
void main(){
  vec4 p = vec4(position, 1.); vec3 n = normal;
  #ifdef USE_INSTANCING
    p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
  #endif
  vec4 wp = modelMatrix * p; vWp = wp.xyz; vN = mat3(modelMatrix) * n;
  vBake = aBake; vMark = aMark; vLocal = aLocal; vFine = aFine;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const STONE_FRAG = /* glsl */`
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uGndCol; uniform vec3 uRimCol;
uniform vec3 uDoorPos; uniform vec3 uDoorCol; uniform vec3 uSandCol; uniform vec3 uStoneA; uniform vec3 uStoneB; uniform vec3 uVarnish; uniform vec2 uWind; uniform float uTime; uniform vec4 uRiver; uniform vec2 uRiverK;
uniform sampler2D uSunMap; uniform mat4 uSunM; uniform vec4 uSunK; uniform vec4 uBounce;
varying vec3 vWp; varying vec3 vN; varying vec3 vBake; varying vec2 vMark; varying vec3 vLocal; varying float vFine;
#include <fog_pars_fragment>
// The sun's map (drawn in build): uSunM carries a world place into it (cells across and up, depth as a share of
// its span), uSunK = (cells across, cells up, the depth's slack, how far a point is lifted off its face in metres).
// A point is lit where the map holds no stone nearer the sun. Nine cells round the point are weighed by its place
// among them on a smooth bell three cells broad (each read against the depth the point's OWN face has at that
// cell: the face's plane carried there by its normal, so a face aslant to the sun does not shade itself), and
// the sum is drawn in at its middle: a shade's edge runs CLEAN along the thing that casts it, a straight line
// for a straight edge at any slant, with no cell's step in it, and soft over a third of a cell (${SUN_CELL} m a cell).
// From afar the nine are taken two, four, eight cells apart (about what one pixel sees, always on the map's
// own lines), so the edge is as soft as the eye's grain.
float sunTap(vec2 ij, float d){ vec2 t = texture2D(uSunMap, (ij + .5) / uSunK.xy).rg; return step((t.r * 65280. + t.g * 255.) / 65535., d); }
float sunReach(vec3 wp, vec3 n, float dist){
  vec3 q = (uSunM * vec4(wp + n * uSunK.w, 1.)).xyz;
  float s = exp2(floor(log2(max(1., dist * ${(0.0007 / SUN_CELL).toFixed(4)}))));
  if (q.x < 2. * s || q.y < 2. * s || q.x > uSunK.x - 3. * s || q.y > uSunK.y - 3. * s || q.z < 0. || q.z > 1.) return 1.;
  // (the map's three axes in the world: one cell across, one cell up, the depth's share toward the sun)
  vec3 gx = vec3(uSunM[0].x, uSunM[1].x, uSunM[2].x), gy = vec3(uSunM[0].y, uSunM[1].y, uSunM[2].y), gz = vec3(uSunM[0].z, uSunM[1].z, uSunM[2].z);
  // (how the face's own depth changes from cell to cell: nothing for a face square to the sun; held for one all but edge on)
  vec2 slope = -vec2(dot(gx, n) / dot(gx, gx), dot(gy, n) / dot(gy, gy)) * dot(gz, gz) / max(dot(gz, n), .25 * length(gz)) * s;
  vec2 g = q.xy / s - .5, i = floor(g + .5), t = g - i; float d = q.z + uSunK.z, sum = 0.;
  vec2 w[3]; w[0] = .5 * (.5 - t) * (.5 - t); w[1] = .75 - t * t; w[2] = .5 * (.5 + t) * (.5 + t);
  for (int a = 0; a < 3; a++) for (int b = 0; b < 3; b++) {
    vec2 o = vec2(float(a) - 1., float(b) - 1.);
    sum += w[a].x * w[b].y * sunTap((i + o) * s, d + dot(slope, o - t));
  }
  return smoothstep(.34, .66, sum);
}
float h3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
void main(){
  vec3 N = vN / max(length(vN), 1e-5);
  // AN ARRIS IS AN ARRIS: where the face bends back fast (vFine) and the corners' blended normal lies well off the
  // drawn face's own (a wall meeting the face, a ledge meeting its riser), the face's own counts: so a shade's
  // edge there runs along the arris or the ledge and never fades across a triangle. Small relief stays smooth.
  vec3 fN = cross(dFdx(vWp), dFdy(vWp)); fN = fN / max(length(fN), 1e-9) * (dot(fN, N) < 0. ? -1. : 1.);
  float fine = step(.5, vFine);
  N = normalize(mix(N, fN, fine * smoothstep(.02, .08, 1. - dot(N, fN))));
  float ao = clamp(vBake.x, 0., 1.), sun = clamp(vBake.y, 0., 1.), sand = clamp(vBake.z, 0., 1.);
  float dist = length(vWp - cameraPosition);
  // Every mark below is written in world metres on all three axes and fades out before it is finer than two
  // pixels of the widest picture (a mark f metres across is whole within 220 f metres and gone by 440 f).
  #define FADE(f) clamp(2. - dist / (220. * (f)), 0., 1.)
  sun *= sunReach(vWp, N, dist);
  // bedding: level beds, gently warped, each lensing out along the face within some tens of metres: massive units
  // three to four metres thick, beds of a metre, of a foot, of a hand; thin dark seams between them
  float wy = vWp.y + 1.5 * vn(vWp * vec3(.035, .02, .035)) + .4 * vn(vWp * vec3(.21, .1, .21));
  float bed0 = vn(vec3(vWp.x * .017, wy * .28, vWp.z * .017) + vec3(5.3, 0., 2.1));
  float bedA = vn(vec3(vWp.x * .05, wy * 1.1, vWp.z * .05) + vec3(0., 3.7, 1.3));
  float bedB = vn(vec3(vWp.x * .13, wy * 3.7, vWp.z * .13) + 9.1);
  float bedC = vn(vec3(vWp.x * .4, wy * 11., vWp.z * .4) + 2.);
  float fA = FADE(.9), bed = mix(.5, bed0, FADE(3.5)) * .4 + mix(.5, bedA, fA) * .33 + mix(.5, bedB, FADE(.27)) * .17 + mix(.5, bedC, FADE(.09)) * .1;
  float grain = mix(.5, vn(vWp * 2.3), FADE(.43)) * .6 + mix(.5, vn(vWp * 9.), FADE(.11)) * .4;
  vec3 alb = mix(uStoneB, uStoneA, smoothstep(.36, .64, bed));
  alb *= .84 + .32 * grain;
  alb *= 1. - .08 * fA * (1. - smoothstep(0., .03, abs(bedA - .5)));
  // a few clean joints of the living rock: upright, some seven metres apart, wavering a little, each open for some
  // tens of metres of height and tight again; they run through the bluff, the kings and every carved thing alike
  float jw = .03 + dist * .003, fJ = FADE(1.5) * smoothstep(.5, .68, vn(vec3(vWp.x * .06, vWp.y * .025, vWp.z * .06) + 3.));
  vec2 hq = vWp.xz + 1.2 * (vec2(vn(vWp * .12 + 17.), vn(vWp * .12 + 29.)) - .5);
  float jd = min(abs(fract(hq.x / 7.3) - .5) * 7.3, abs(fract(hq.y / 6.1) - .5) * 6.1);
  alb *= 1. - .22 * fJ * (1. - smoothstep(jw * .35, jw, jd)) * (1. - abs(N.y));
  // weathered hollows on upright faces
  float flute = vn(vec3(vWp.x * .9 + vWp.z * .7, vWp.y * .25, vWp.x * .3 - vWp.z * .4));
  alb *= 1. - .1 * FADE(1.) * (1. - abs(N.y)) * smoothstep(.5, .8, flute);
  // desert varnish: soft darker runs, broad, below ledges and laps (never a blotch)
  float streak = smoothstep(.42, .9, mix(.5, vn(vec3(vWp.x * .5 + vWp.z * .38, vWp.y * .1, vWp.x * .2 - vWp.z * .3 + 5.)), FADE(2.)));
  alb = mix(alb, alb * uVarnish * 1.25, clamp(vMark.x, 0., 1.) * .55 * streak);
  // the striped headcloth: plain level grooves a third of a metre apart
  float st = .5 + .5 * sin(vLocal.y * ${(2 * Math.PI / STRIPE).toFixed(3)});
  alb *= 1. - clamp(vMark.y, 0., 1.) * mix(.08, .3 * smoothstep(.5, .95, st), FADE(.2));
  // worn relief on the cut plane (a mark below nought): registers 2.6 m high parted by a level groove; in each, the
  // outlines of upright shapes a man's height and more, a hand deep, lost in patches: outlines only, nothing to read
  float rel = clamp(-vMark.y, 0., 1.) * FADE(.25), rq = vLocal.y / 2.6, rg = min(fract(rq), 1. - fract(rq)) * 2.6;
  float rfig = vn(vec3(vLocal.x * 1.1 + floor(rq) * 7.3, fract(rq) * 1.43, floor(rq) * 3.1 + 1.));
  float rworn = smoothstep(.35, .6, vn(vec3(vLocal.xy * .23 + 11., 4.))) * smoothstep(.1, .4, rg);
  alb *= 1. - rel * (.2 * rworn * (1. - smoothstep(.0, .035, abs(rfig - .5))) + .22 * (1. - smoothstep(.03, .08, rg))) + .05 * rel * rworn * step(.5, rfig);
  // (a mark over one: the swallows' mud)
  alb = mix(alb, vec3(.21, .15, .11) * (.8 + .4 * grain), clamp(vMark.x - 1., 0., 1.));
  alb = mix(alb, uSandCol * (.9 + .2 * grain), sand);
  // wind ripples in sand that lies, in patches some metres across with smooth sand between: three sets, each with
  // its own heading about the wind's and its own spacing in metres (0.33, 0.55, 0.24), each with a lit and a shaded side
  vec2 w2 = mat2(.82, .57, -.57, .82) * uWind, w3 = mat2(.7, -.71, .71, .7) * uWind;
  float m1 = smoothstep(.5, .66, vn(vec3(vWp.xz * .16, 2.))), m2 = smoothstep(.52, .68, vn(vec3(vWp.xz * .13 + 9., 5.))) * (1. - m1), m3 = smoothstep(.55, .7, vn(vec3(vWp.xz * .21 + 4., 8.))) * (1. - m1) * (1. - m2);
  float wob = 5. * vn(vec3(vWp.xz * .3, 2.));
  vec2 rp = uWind * sin(dot(vWp.xz, uWind) * 19. + wob) * m1 * FADE(.33) + w2 * sin(dot(vWp.xz, w2) * 11.4 + wob * 1.3) * m2 * FADE(.55) + w3 * sin(dot(vWp.xz, w3) * 26. + wob) * m3 * FADE(.24);
  N = normalize(N + vec3(rp.x, 0., rp.y) * .32 * sand * smoothstep(.6, .9, N.y));
  // light: the sun through the baked shade; the sky from above and the shade's own light from below and the side
  // through the baked occlusion (which takes half of it at most: a hollow's shade keeps its colour); the bright sky
  // on the sun's side, and the door's light
  float ndl = max(dot(N, uSunDir), 0.);
  vec3 lit = uSunCol * ndl * sun;
  // the river's light: the low sun thrown back up by the ripples plays on every face that looks down at the water:
  // a slow net of soft brighter bands, half a metre wide, written in metres along the face and up it (whole within
  // 121 m, one even light from 242 m on). It reaches a point from the height up at which the land before the bluff
  // no longer stands between: uRiver = (the face's normal in plan, how far out the land's edge lies, the sun's slope).
  vec3 Rs = vec3(uSunDir.x, -uSunDir.y, uSunDir.z);
  vec2 wq = vec2(dot(vWp.xz, uWind) * .33, vWp.y * .5);
  float net = 1. - smoothstep(0., .17, abs(vn(vec3(wq, uTime * .5)) - vn(vec3(wq + 7.3, uTime * .5 + 4.))));
  float ry = uRiverK.y + max(uRiver.z - dot(vWp.xz, uRiver.xy), 0.) * uRiver.w;
  vec3 riv = uSunCol * uRiverK.x * max(dot(N, Rs), 0.) * mix(.3, net, FADE(.55)) * ao * smoothstep(ry, ry + 2.5, vWp.y) * (1. - sand);
  lit += riv;
  vec3 amb = mix(uGndCol, uSkyCol, N.y * .5 + .5) * (.5 + .5 * ao);
  float rk = max(dot(N, normalize(vec3(uSunDir.x, .4, uSunDir.z))), 0.);
  vec3 rim = uRimCol * rk * rk * ao;
  // THE BOUNCE: stone the sun strikes little or not at all is lit by the sky, the ground, the river, and by what
  // the sun strikes round it: the lit sand and the lit rock. The less a point has of the first (a court's foot,
  // a ravine, a hollow: shut in among stone and sand, little sky, no river), the more of the last: their warm
  // light (uBounce.rgb: the sun's colour thrown back by sandstone) makes up what its whole light lacks of a
  // floor (uBounce.a: a share of the sun's own light; a deep hollow keeps half of it, as of the sky's), and adds
  // nothing where the point has that much already. So shade on this stone, cast or turned away, is a warm
  // brown-violet at about half the lit stone's value on every stone alike, never near black.
  const vec3 LUM = vec3(.3, .59, .11);
  amb += uBounce.rgb * max(uBounce.a * (.5 + .5 * ao) - dot(lit + amb + rim, LUM), 0.);
  vec3 dv = uDoorPos - vWp; float dd = length(dv);
  float dl = max(dot(N, dv / max(dd, 1e-3)), 0.) * .85 + .15;
  float flick = .86 + .11 * sin(uTime * 2.3) + .05 * sin(uTime * 5.9 + 1.);
  // (a doorway's light: strong on the threshold and the inner legs, gone by the outer kings)
  vec3 door = uDoorCol * dl * flick * (1. - smoothstep(4., 32., dd)) / (1. + dd * dd * .03);
  gl_FragColor = vec4(alb * (lit + amb + rim + door), 1.);
  #include <fog_fragment>
}`;
// (SHADE: the floor of the light on stone in shade, as a share of the sun's own light)
const SHADE = 0.31;
export function stoneMaterial(light) {
  const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uSunDir: { value: new THREE.Vector3() }, uSunCol: { value: new THREE.Color() }, uSkyCol: { value: new THREE.Color() }, uGndCol: { value: new THREE.Color() },
    uRimCol: { value: new THREE.Color() }, uDoorPos: { value: new THREE.Vector3(0, 5.25, 0.2) }, uDoorCol: { value: new THREE.Color() }, uSandCol: { value: new THREE.Color() },
    uStoneA: { value: new THREE.Color() }, uStoneB: { value: new THREE.Color() }, uVarnish: { value: new THREE.Color() }, uWind: { value: new THREE.Vector2(-1, 0) }, uTime: { value: 0 },
    uRiver: { value: new THREE.Vector4(0, 1, 28, 0.25) }, uRiverK: { value: new THREE.Vector2(0, 0) },
    uSunMap: { value: null }, uSunM: { value: new THREE.Matrix4() }, uSunK: { value: new THREE.Vector4(1, 1, 0, 0) }, uBounce: { value: new THREE.Vector4(0, 0, 0, 0) } }]);
  const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: STONE_VERT, fragmentShader: STONE_FRAG, fog: true });
  u.uSunDir.value.copy(light.sunDir).normalize();
  for (const k of ['uSunCol', 'uSkyCol', 'uGndCol', 'uRimCol', 'uDoorCol', 'uSandCol', 'uStoneA', 'uStoneB', 'uVarnish']) u[k].value.copy(light[k]);
  // (the bounce: the sun's colour on this stone's own mean tone, brought to a luma of one; and the floor: SHADE of
  // the sun's own luma)
  {
    const c = ['r', 'g', 'b'].map((k) => light.uSunCol[k] * (light.uStoneA[k] + light.uStoneB[k]) / 2), lum = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b, l = Math.max(lum(c[0], c[1], c[2]), 1e-6);
    u.uBounce.value.set(c[0] / l, c[1] / l, c[2] / l, SHADE * lum(light.uSunCol.r, light.uSunCol.g, light.uSunCol.b));
  }
  return mat;
}
// the morning's light, used when the part is shown alone (the world hands in its own hour)
export function defaultLight() {
  const C = (r, g, b) => new THREE.Color(r, g, b);
  return { sunDir: new THREE.Vector3(0.114, 0.42, 0.902), uSunCol: C(1.06, 0.9, 0.7), uSkyCol: C(0.2, 0.27, 0.44), uGndCol: C(0.4, 0.29, 0.17), uRimCol: C(0.05, 0.05, 0.06),
    uDoorCol: C(2.6, 1.15, 0.3), uSandCol: C(0.66, 0.42, 0.17), uStoneA: C(0.74, 0.53, 0.3), uStoneB: C(0.6, 0.4, 0.23), uVarnish: C(0.5, 0.37, 0.36) };
}

// ---------------------------------------------------------------- baking and merging
// occlusion and sun shade for a mesh, read from a field S(x, y, z) of the whole front (metres to the nearest stone)
const AO_R = [[0.35, 0.3], [0.8, 0.3], [1.5, 0.25], [2.5, 0.15]];
// the same measure for two plain forms, where the field has no true stand-in (the cut's returns): how open a point
// of a plane face lies that has a floor square to it h metres off (openBy), and a point of that floor at the
// face's foot, the face d metres high, a second floor g metres under the point (openUnder). bakeNet's own sum: at
// each radius the nearest stone to the place that far out along the normal.
const openBy = (h) => { let occ = 0; for (const [r, w] of AO_R) occ += w * clamp(1 - Math.min(r, h) / (0.62 * r), 0, 1); return clamp(1 - occ * 1.3, 0, 1); };
const openUnder = (d, g) => { let occ = 0; for (const [r, w] of AO_R) occ += w * clamp(1 - Math.min(Math.max(r - d, 0), g) / (0.62 * r), 0, 1); return clamp(1 - occ * 1.3, 0, 1); };
// (a long mesh is baked in pieces: corners from..to into the same array, the page handed back between; outZ: nothing
// that S knows stands further out from the cut's plane than this, so a ray toward the sun is clear once it is past it)
function bakeNet(m, S, sunL, bias = 0.35, live = false, from = 0, to = m.pos.length / 3, out = new Float32Array(m.pos.length), outZ = 1e9, own = false) {
  for (let i = from; i < to; i++) {
    const x = m.pos[i * 3], y = m.pos[i * 3 + 1], z = m.pos[i * 3 + 2], nx = m.nor[i * 3], ny = m.nor[i * 3 + 1], nz = m.nor[i * 3 + 2];
    // measured from the field's own value at the point, so a stand-in a hand off the true surface does not darken it
    // (own: the mesh's corners lie on blocks of the field itself, so the field at a corner is nought or less: it need ask no block a hand off)
    const s0 = own ? S(x, y, z, 0.05) : S(x, y, z);
    let occ = 0;
    // (a reading that far out is all one beyond s0 + 0.62 r: the field is told so, and asks no block further off)
    // (the hot loops of this file write their small sums out: a page's cold code calls every helper it meets)
    for (let q = 0; q < AO_R.length; q++) { const r = AO_R[q][0], w = AO_R[q][1], v = 1 - (S(x + nx * r, y + ny * r, z + nz * r, s0 + 0.62 * r) - s0) / (0.62 * r); occ += w * (v < 0 ? 0 : v > 1 ? 1 : v); }
    let sun = 1;
    if (!live) {
      if (nx * sunL.x + ny * sunL.y + nz * sunL.z < 0.02) sun = 0;
      else for (let k = 0, t = bias; k < 30 && t < 70; k++) {
        const d = S(x + sunL.x * t, y + sunL.y * t, z + sunL.z * t) + Math.max(0, -s0) * Math.max(0, 1 - t / 2);
        if (d < 0.03) { sun = 0; break; }
        sun = Math.min(sun, 7 * d / t); t += Math.max(0.25, d * 0.85);
        if (y + sunL.y * t > 48 || z + sunL.z * t > outZ) break;
      }
    }
    // (a corner further than the field's reach from every stone the field holds has nothing to read: all its
    // readings come back as the reach itself, which the sum above would take for stone on every side. Such a
    // corner lies OPEN. It is the natural face far from the cut, a ravine's walls and the nose, where the wall's
    // stand-in lies well behind the rough rock: live drew them at half their shade's light, near black. The natural
    // face NEARER its stand-in than the reach is told open by the wall's own rule, where the wall is baked)
    out[i * 3] = s0 >= FIELD_REACH - 1e-3 ? 1 : clamp(1 - occ * 1.3, 0, 1); out[i * 3 + 1] = sun;
  }
  return out;
}
// turn, size and move a mesh (Euler turns about x, y, z in that order, then one scale, then the shift)
function placeNet(m, e, t, wide = 1, sc = 1) {
  const M = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(e[0], e[1], e[2], 'XYZ')), a = M.elements, pos = new Float32Array(m.pos.length), nor = new Float32Array(m.nor.length);
  for (let q = 0; q < m.pos.length; q += 3) {
    const x = m.pos[q], y = m.pos[q + 1], z = m.pos[q + 2], nx = m.nor[q], ny = m.nor[q + 1], nz = m.nor[q + 2];
    pos[q] = (a[0] * x + a[4] * y + a[8] * z) * wide * sc + t[0]; pos[q + 1] = (a[1] * x + a[5] * y + a[9] * z) * sc + t[1]; pos[q + 2] = (a[2] * x + a[6] * y + a[10] * z) * sc + t[2];
    nor[q] = a[0] * nx + a[4] * ny + a[8] * nz; nor[q + 1] = a[1] * nx + a[5] * ny + a[9] * nz; nor[q + 2] = a[2] * nx + a[6] * ny + a[10] * nz;
  }
  return { pos, nor, idx: m.idx };
}
// many meshes into one geometry
function makeSink() { return { parts: [], verts: 0, tris: 0 }; }
function sinkAdd(sink, m, bake, mark, loc) {
  if (sink.log) sink.log.push(m.idx.length / 3);
  sink.parts.push({ m, bake, mark, loc: loc || m.pos, fine: m.fine }); sink.verts += m.pos.length / 3; sink.tris += m.idx.length / 3;
}
async function sinkGeometry(sink, tick) {
  const n = sink.verts, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), bake = new Float32Array(n * 3), mark = new Float32Array(n * 2), loc = new Float32Array(n * 3), fine = new Float32Array(n);
  const idx = new Uint32Array(sink.tris * 3);
  let v = 0, t = 0;
  for (const p of sink.parts) {
    pos.set(p.m.pos, v * 3); nor.set(p.m.nor, v * 3); bake.set(p.bake, v * 3); loc.set(p.loc, v * 3);
    if (p.mark) mark.set(p.mark, v * 2);
    if (p.fine) fine.set(p.fine, v);
    if (tick) await tick(COST.sink * p.m.pos.length / 3);
    for (let i = 0; i < p.m.idx.length; i++) { idx[t + i] = p.m.idx[i] + v; if (tick && i % 8000 === 7999) await tick(COST.sink * 16000); }
    v += p.m.pos.length / 3; t += p.m.idx.length;
  }
  // the mesh's box, found here in pieces (three's own pass over a quarter of a million corners is one long step),
  // and for its ball the box's own: its middle and half its diagonal, which holds every corner
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (let q = 0; q < pos.length; q += 3) {
    for (let c = 0; c < 3; c++) { const w = pos[q + c]; if (w < lo[c]) lo[c] = w; if (w > hi[c]) hi[c] = w; }
    if (tick && q % 30000 === 29997) await tick(COST.sink * 40000);
  }
  if (tick) await tick();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aBake', new THREE.BufferAttribute(bake, 3)); g.setAttribute('aMark', new THREE.BufferAttribute(mark, 2)); g.setAttribute('aLocal', new THREE.BufferAttribute(loc, 3));
  g.setAttribute('aFine', new THREE.BufferAttribute(fine, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingBox = new THREE.Box3(new THREE.Vector3(lo[0], lo[1], lo[2]), new THREE.Vector3(hi[0], hi[1], hi[2]));
  g.boundingSphere = new THREE.Sphere(g.boundingBox.getCenter(new THREE.Vector3()), 0.5 * hyp(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]));
  return g;
}
// a small free-standing figure (a lion, a baboon) as a ready geometry: occlusion baked, sun left to the shader
export async function figureGeometry(solids, b, h, ask) {
  const tick = pieces(ask), f = fieldOf(solids, b), m = await surfaceNets(f, b, h, h * 0.5, tick), S = (x, y, z) => Math.min(f(x, y, z), y + 0.2);
  const nv = m.pos.length / 3, bake = new Float32Array(nv * 3), sink = makeSink();
  for (let a = 0; a < nv; a += 250) { bakeNet(m, S, null, 0, true, a, Math.min(nv, a + 250), bake); if (tick) await tick(COST.figure * 250); }
  for (let i = 0; i < bake.length; i += 3) bake[i + 2] = 0;
  sinkAdd(sink, m, bake, null, null);
  return sinkGeometry(sink, tick);
}

// ---------------------------------------------------------------- the front
// opts: { light (uniform colours and the WORLD sun direction), sunLocal (the sun in this frame, for the sun's map),
//         x0, x1 (how far the cliff's face is built to either side), bend(x), top(x),
//         pieces (the world's counting hand-back, so that one count runs through both files) }
export async function buildHero(ctx, opts = {}) {
  const core = ctx.core, tick = pieces(opts.pieces || (() => ctx.yield())), noise = ctx.noise;
  // every stream this part draws from, by name, taken here before any loop
  const stream = (name) => core.makeRng(core.hashSeed('fsk-' + name + ':' + ctx.seed));
  const rKing = stream('kings'), rBlock = stream('blocks'), rBab = stream('baboons'), rSand = stream('sand'), rNest = stream('nests'), rCourt = stream('court');
  const light = opts.light || defaultLight(), sunL = (opts.sunLocal || light.sunDir).clone().normalize();
  const BREAK_Y = 12.4;
  // (each king's back pillar: his middle, its half width, its top; the broken king's ends at his break)
  const W = { noise, bend: opts.bend || (() => 0), top: opts.top || (() => 46), pillars: KX.map((x, k) => [x, 3.9 * KS, KLIFT + KS * (k === 3 ? BREAK_Y - 0.9 : 17.4)]) };
  const x0 = opts.x0 ?? -46, x1 = opts.x1 ?? 46;
  const mat = stoneMaterial(light), group = new THREE.Group(), sink = makeSink();
  if (opts.log) sink.log = opts.log;

  // ---- the draws that tell the kings apart (all drawn here, before anything is built): one whole king has lost
  //      his beard, one his nose tip, one the top of his crown; each has his own chipped corners, his own width,
  //      his own sand and varnish, and his small figures their own heights
  const dmg = rKing.shuffle([0, 1, 2]);
  // (the small figures: [x, z, H, what it stands on]: one between the feet on the footstool, one outside a leg on
  // the base; none on the side of a middle king that looks into the way to the door)
  const FIGS = [[[0, 8.75, 4.5, 1.75], [4.0, 7.6, 5.6, 1.4], [-4.0, 7.6, 5.3, 1.4]], [[0, 8.75, 4.4, 1.75], [4.0, 7.6, 5.5, 1.4]], [[0, 8.75, 4.6, 1.75], [-4.0, 7.6, 5.4, 1.4]], [[0, 8.75, 4.4, 1.75], [4.0, 7.6, 5.7, 1.4], [-4.0, 7.6, 5.2, 1.4]]];
  const kings = [];
  for (let k = 0; k < 4; k++) {
    const chips = [];
    for (let i = 0, n = rKing.int(4, 8); i < n; i++) chips.push([rKing(), rKing(), rKing.range(0.25, 0.7)]);
    kings.push({ w: rKing.range(0.97, 1.03), beard: k === 3 || dmg[0] !== k, nose: dmg[1] === k ? rKing.range(0.6, 1) : 0, crown: dmg[2] === k ? rKing.range(0.3, 1) : 0, chips,
      figs: FIGS[k].map(([x, z, H, y0]) => [x, z, H + rKing.range(-0.3, 0.3), y0]), sand: rSand.range(0.35, 1), varn: rSand.range(0.4, 1), seed: rSand.range(0, 50) });
  }
  // ---- each king's blocks in his own frame, and the same blocks where he sits (for the field and for the shade)
  const HKING = 1.7, standing = [];
  const seat = (k) => { const w = kings[k].w * KS, x0 = KX[k]; return (p) => [p[0] * w + x0, p[1] * KS + KLIFT, p[2] * KS]; };
  for (let k = 0; k < 4; k++) {
    // (the first king's blocks are cut by cold code: the page is handed back before them and before their chipping)
    if (!k) await tick();
    const K = kings[k], raw = kingBlocks(K);
    if (!k) await tick();
    const whole = chipped(raw, K.chips), st = seat(k);
    await tick(COST.block * 0.7 * whole.length * (k ? 1 : COLD));
    K.whole = whole;
    K.blocks = (k === 3 ? broken(whole) : whole).concat(...K.figs.map(([x, z, H, y0]) => statueBlocks(x, z, H, y0)));
    for (let i = 0; i < K.blocks.length; i++) { standing.push(moved(K.blocks[i], st)); if (i % 24 === 23) await tick(COST.block * 24); }
  }
  // ---- the forecourt: the terrace before the front. Sand has drifted against the kings' pedestals and the wall's
  //      foot (highest where it meets stone), lies in low dunes between, thins on the way to the door and is gone
  //      at the threshold and at the parapet. duneY: the sand's height over the terrace's level.
  // (WAY_HALF: the way to the door is left open by the parapet, half as broad again as the way between the middle
  // kings' pedestals; the parapet stands PAR_Z out from the cut)
  const tx0 = opts.terrace0 ?? -95, tx1 = opts.terrace1 ?? 30, PAR_Z = 23.4, WAY_HALF = 1.5 * (KX[1] - 5.15 * KS);
  // THE PARAPET'S TWO ENDS, each where a thing of the place ends. Down-river it stops PAR_SHORT metres short of
  // the terrace's own end: there the terrace's bank begins to narrow toward the strand under the rock, and no built
  // stone stands where the water comes nearer than that. Up-river it fences the kings and what lies fallen of the
  // fourth: it runs one bay of its own piers (PIER) past the far end of the furthest place a lying piece takes
  // (LIE_X0: the first of the lying pieces' places; a piece is up to LIE_LONG metres long).
  const PAR_SHORT = 6, PIER = 8.7, LIE_X0 = KX[3] - 11, LIE_LONG = 5.9;
  const PX0 = Math.max(tx0 + PAR_SHORT, LIE_X0 - LIE_LONG / 2 - PIER), PX1 = tx1 - PAR_SHORT;
  const terraceEdge = (x) => 26 + 1.6 * noise.n2(x * 0.13, 4.2) + 0.7 * noise.n2(x * 0.5, 1.7);
  const PED = KX.map((x, k) => [x, 5.15 * KS * kings[k].w, 10.85 * KS]);
  const duneY = (x, z) => {
    let d = z + 0.4;
    for (const p of PED) { const qx = Math.abs(x - p[0]) - p[1], qz = z - p[2]; d = Math.min(d, hyp(Math.max(qx, 0), Math.max(qz, 0))); }
    const way = lerp(0.1 + 0.9 * sstep(0, 5, z), 1, sstep(DOOR_W, DOOR_W + 5, Math.abs(x))), out = sstep(PAR_Z - 0.6, PAR_Z - 6, z);
    return out * way * (1.3 * sstep(6.5, 0.2, d) * (0.6 + 0.4 * noise.n2(x * 0.11, 3.3)) + 0.55 * sstep(0.3, 0.8, 0.5 + 0.5 * noise.fbm2(x * 0.07 + 3, z * 0.1, 2)));
  };
  // (no stair, no wall and no made edge goes down to the river: the forecourt's only built stone is the parapet)
  const court = [];
  // the parapet along the terrace's river edge: lengths of low wall under a coping, broken down in places (a
  // length in four stands lower with no coping; a gap of some metres after one in three, the wall's end raked
  // where it broke); a pier every PIER metres, and on two piers in three a small figure of a hawk
  {
    const gate = WAY_HALF, t = { h: 2.5 };
    for (let x = PX0; x < PX1 - 2;) {
      const len = rCourt.range(2.5, 6), low = rCourt.chance(0.25), h = low ? rCourt.range(0.25, 0.6) : rCourt.range(0.85, 1), gap = rCourt.chance(0.33) ? rCourt.range(1.5, 4.5) : 0.06, rake = rCourt.range(0.5, 1.1);
      const a = x, b = Math.min(x + len, PX1);
      x = b + gap;
      if (b > -gate && a < gate) continue;
      let wallB = blockY((a + b) / 2, PAR_Z, -0.7, h, (b - a) / 2, 0.32, (b - a) / 2, 0.32, 0, 0, t);
      if (gap > 1) wallB = clipBlock(wallB, [1, rake, 0, b - 0.2 + rake * h * 0.4], { broke: 1 }) || wallB;
      court.push(wallB);
      if (!low) { const cop = blockY((a + b) / 2, PAR_Z, h, h + 0.15, (b - a) / 2 + 0.03, 0.4, (b - a) / 2 + 0.03, 0.4, 0, 0, t); court.push(gap > 1 ? clipBlock(cop, [1, rake, 0, b - 0.2 + rake * h * 0.4], { broke: 1 }) || cop : cop); }
    }
    for (let x = PX0 + 3; x < PX1; x += PIER) {
      const stands = rCourt.chance(0.67), sc = rCourt.range(1.05, 1.25), yaw = rCourt.range(-0.25, 0.25), ph = stands ? 1.3 : rCourt.range(0.5, 1.1), cy = Math.cos(yaw), sy = Math.sin(yaw);
      if (Math.abs(x) < gate + 0.8) continue;
      court.push(blockY(x, PAR_Z, -0.7, ph, 0.6, 0.6, 0.55, 0.55, 0, 0, t));
      if (stands) for (const b of falconBlocks()) court.push(moved(b, (p) => [(cy * p[0] + sy * p[2]) * sc + x, p[1] * sc + ph, (-sy * p[0] + cy * p[2]) * sc + PAR_Z]));
    }
    await tick(COST.block * 2 * court.length);
  }
  // ---- the lying pieces of the fourth king: each a region of his WHOLE figure (the region's six sides and two
  //      slanting breaks through it: flat breaks with sharp edges), turned as it lies and sunk a third to a half
  //      in the sand; nine places in two rows beyond his toes, 5.5 m apart (a piece is up to 5.9 m long)
  const lying = [], blocksAt = [], pieces9 = [];
  {
    const slots = rBlock.shuffle([0, 1, 2, 3, 4].map((i) => [LIE_X0 + i * 5.5, 14.6]).concat([0, 1, 2, 3].map((i) => [KX[3] - 8.2 + i * 5.5, 19.2])));
    for (let i = 0; i < BLOCKS.length; i++) {
      const B = BLOCKS[i], c = B.c, h = B.h, sd = rBlock.range(0, 40), a1 = sd * 1.7, a2 = sd * 2.9 + 1, hm = 0.5 * Math.min(h[0], h[1], h[2]);
      const e = [B.e[0] + rBlock.range(-0.2, 0.2), B.e[1] + rBlock.range(-0.5, 0.5), B.e[2] + rBlock.range(-0.15, 0.15)], off = [rBlock.range(-0.5, 0.5), rBlock.range(-0.5, 0.5)], sunkBy = rBlock.range(0.28, 0.45);
      const planes = [[1, 0, 0, c[0] + h[0]], [-1, 0, 0, h[0] - c[0]], [0, 1, 0, c[1] + h[1]], [0, -1, 0, h[1] - c[1]], [0, 0, 1, c[2] + h[2]], [0, 0, -1, h[2] - c[2]]];
      for (const [q, m] of [[[Math.cos(a1) * 0.8, 0.5 * Math.sin(a1 * 1.3), Math.sin(a1) * 0.8], hm], [[Math.cos(a2) * 0.6, 0.75, Math.sin(a2) * 0.6], hm * 1.2]]) { const n = v3unit(q); planes.push([n[0], n[1], n[2], v3dot(n, c) + m]); }
      // (only the blocks whose own ball reaches into the region's box are cut: the rest would be cut to nothing)
      let part = kings[3].whole.filter((b) => Math.abs(b.c[0] - c[0]) < h[0] + b.r && Math.abs(b.c[1] - c[1]) < h[1] + b.r && Math.abs(b.c[2] - c[2]) < h[2] + b.r);
      // (a long list is cut sixty blocks at a time, the page handed back between: the same blocks in the same order)
      for (const pl of planes) {
        const cutBy = [];
        for (let a = 0; a < part.length; a += 60) {
          const to = Math.min(part.length, a + 60);
          for (let q = a; q < to; q++) { const b = clipBlock(part[q], pl, { broke: 1 }); if (b) cutBy.push(b); }
          await tick(COST.block * 0.75 * (to - a));
        }
        part = cutBy;
      }
      if (!part.length) continue;
      // about the region's middle, turned, the king's size; then set down in its place
      const M = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(e[0], e[1], e[2], 'XYZ')).elements;
      const turn = (p) => { const x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2]; return [(M[0] * x + M[4] * y + M[8] * z) * KS, (M[1] * x + M[5] * y + M[9] * z) * KS, (M[2] * x + M[6] * y + M[10] * z) * KS]; };
      let lo = 1e9, hi = -1e9;
      for (const b of part) for (const f of b.faces) for (const q of f.p) { const y = turn(q)[1]; lo = Math.min(lo, y); hi = Math.max(hi, y); }
      const bx = slots[i][0] + off[0], bz = slots[i][1] + off[1], ty = duneY(bx, bz) - lo - sunkBy * (hi - lo);
      pieces9.push({ part, c, e, at: [bx, ty, bz] });
      for (const b of part) lying.push(moved(b, (p) => { const q = turn(p); return [q[0] + bx, q[1] + ty, q[2] + bz]; }));
      blocksAt.push([bx, bz, Math.max(h[0], h[1], h[2]) * 0.9 * KS, hi - lo + ty]);
    }
  }
  // ---- the hawk-headed figure in the niche over the door, and the row of squatting baboons on the cornice (two
  //      carvings, each of the 22 sized and turned by its own draws)
  const ny0 = NICHE[0] + 0.1, nz0 = -LEAN * (NICHE[0] + 2.5) - 1.3 + 0.8, hawk = hawkBlocks().map((b) => moved(b, (p) => [p[0], p[1] + ny0, p[2] + nz0]));
  const row = [];
  {
    const kinds = [baboonBlocks(rBab), baboonBlocks(rBab)];
    for (let i = 0; i < 22; i++) {
      const kind = rBab.chance(0.5) ? 0 : 1, sc = rBab.range(0.94, 1.06), wide = rBab.range(0.95, 1.05), yaw = rBab.range(-0.1, 0.1), cy = Math.cos(yaw), sy = Math.sin(yaw);
      const x0 = (i + 0.5 - 11) * (2 * halfAt(RTOP) - 2) / 22, y0 = RTOP + 0.35, z0 = -LEAN * RTOP + 0.3 + 0.8;
      for (const b of kinds[kind]) row.push(moved(b, (p) => [(cy * p[0] + sy * p[2]) * sc * wide + x0, p[1] * sc + y0, (-sy * p[0] + cy * p[2]) * sc + z0]));
    }
    await tick(COST.block * 22 * 9 * 1.5);
  }

  // ---- the field of the whole front, for occlusion (and for whoever asks how far a place is from stone): every
  //      block where it stands, a plain stand-in for the wall (its lean, the hollow moulding, the door's opening,
  //      the niche, the cut's sides), and the terrace
  const wallNear = (x, y, z) => {
    const ax = Math.abs(x), half = halfAt(y);
    // (beyond the cut the plane is taken behind the deepest gully and ledge, so the rough face's own light is not read as shade)
    if (ax > half || y > BAND) return z - PROUD + W.bend(x, y) + 0.14 * y + 6.5 * sstep(HALF + 7, HALF + 43, ax);
    if (ax < DOOR_W && y < DOOR_H) return 9;
    let s = -LEAN * Math.min(y, RTOP);
    if (y > CORN) s += y < RTOP ? 1.9 * (1 - Math.cos((y - CORN) / (RTOP - CORN) * Math.PI / 2)) : y < RTOP + 0.35 ? 1.9 : 0.3;
    if (ax < 1.75 && y > NICHE[0] && y < NICHE[1]) s -= 1.3;
    for (const p of W.pillars) if (Math.abs(x - p[0]) < p[1] && y < p[2]) s = Math.max(s, PILLAR_Z);
    return Math.min(z - s, z < PROUD - 0.14 * y ? half - ax : 9, z < PROUD - 0.14 * y ? BAND - y + 0.4 : 9);
  };
  const FRONT = [-HALF - 31, -3, -2.5, HALF + 9, RTOP + 4.5, 33], allBlocks = standing.concat(lying, hawk, row, court);
  const stoneAt = await blockField(allBlocks, FRONT, tick);
  // S: metres to the nearest stone: the least of the blocks' field, the wall's stand-in and the ground (the sand's
  // own height on the terrace). The blocks answer first (never more than cap, nor than the field's reach); the
  // wall and the sand are asked only where they could say less: the wall's stand-in is never nearer than
  // z - PROUD (less 0.14 a metre under the terrace's level), the sand never higher than DUNE_MOST.
  const DUNE_MOST = 2;
  const S = (x, y, z, cap) => {
    let d = stoneAt(x, y, z, undefined, cap);
    if (z - PROUD + 0.14 * Math.min(y, 0) < d) { const w = wallNear(x, y, z); if (w < d) d = w; }
    if (y < 3 && z < PAR_Z) { if (y - DUNE_MOST < d) { const g = y - duneY(x, z); if (g < d) d = g; } } else if (y < d) d = y;
    return d;
  };
  // marks and sand for a king's corners, by rules of his own frame (m: his mesh in that frame)
  const kingMarks = (K, m) => {
    const n = m.pos.length / 3, mark = new Float32Array(n * 2), sand = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = m.pos[i * 3], y = m.pos[i * 3 + 1], z = m.pos[i * 3 + 2], ny = m.nor[i * 3 + 1];
      // (the break is old: its faces carry the ages' varnish like the rest, a little less of it, and sand has
      // lodged on what of it looks up; the headcloth, its lappets and its wings carry their stripes)
      mark[i * 2] = (m.kind[i] === 2 ? 0.7 : 1) * K.varn * clamp(0.35 + 0.6 * noise.n2(x * 0.3 + K.seed, y * 0.05), 0, 1) * (ny < 0.5 ? 1 : 0.3);
      mark[i * 2 + 1] = m.kind[i] === 1 ? 1 : 0;
      // sand lodges on what looks up: deep in the lap, on the base and the footstool, on the feet; a little elsewhere
      const zone = m.kind[i] === 2 ? 0.8 : (y > 9.3 && y < 11 && z < 7.3) || y < 1.8 || (y > 2.1 && y < 3.1 && z > 7.2) ? 1 : 0.25;
      sand[i] = sstep(0.72, 0.95, ny) * zone * K.sand * clamp(0.55 + 0.6 * noise.n2(x * 0.5 + K.seed, z * 0.5), 0, 1);
    }
    return { mark, sand };
  };
  // What is never seen is not drawn (it pays for the heads' and hands' second scale of form). A triangle of a
  // carving is left out (1) where it lies inside other stone, in the rock or under the sand: its middle and its
  // three corners, each a hand (HAND) out along its own normal, all lie inside; (2) where it looks
  // back into the cliff more steeply than any place before the front could see (BACK: its normal's share toward the
  // wall; the river and the way in lie before the front, and nothing passes behind it). Corners no kept triangle
  // uses go with them, so nothing is baked for them.
  const BACK = -0.85, HAND = 0.04;
  const unseen = async (loc, placed, mk, cold = 1) => {
    const P = placed.pos, N = placed.nor, I = placed.idx, nv = P.length / 3, to = new Int32Array(nv).fill(-1), idx = [];
    // (under the sand, in the rock, or inside a block: the cheap askings first)
    // (the sand and the wall are asked only where they could hold the place, by the same two bounds as S; the blocks
    // answer from the field's tight lists)
    const IN = -0.012, inStone = (px, py, pz) => {
      if (py < 2 && pz < PAR_Z) { if (py - DUNE_MOST < IN && py - duneY(px, pz) < IN) return true; } else if (py < IN) return true;
      if (pz - PROUD + 0.14 * Math.min(py, 0) < IN && wallNear(px, py, pz) < IN) return true;
      return stoneAt.inside(px, py, pz, IN) < IN;
    };
    let kept = 0;
    for (let t = 0; t < I.length; t += 3) {
      const i0 = I[t], i1 = I[t + 1], i2 = I[t + 2], a = i0 * 3, b = i1 * 3, c = i2 * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      // (the triangle's own normal, a hand long)
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const k = HAND / (Math.sqrt(nx * nx + ny * ny + nz * nz) || 1); nx *= k; ny *= k; nz *= k;
      const mx = (P[a] + P[b] + P[c]) / 3 + nx, my = (P[a + 1] + P[b + 1] + P[c + 1]) / 3 + ny, mz = (P[a + 2] + P[b + 2] + P[c + 2]) / 3 + nz;
      // (a corner is read a little way in toward the middle, where a neighbour's own skin does not answer)
      const gone = nz < BACK * HAND || (inStone(mx, my, mz) && inStone(P[a] + nx + (mx - (P[a] + nx)) * 0.12, P[a + 1] + ny + (my - (P[a + 1] + ny)) * 0.12, P[a + 2] + nz + (mz - (P[a + 2] + nz)) * 0.12)
        && inStone(P[b] + nx + (mx - (P[b] + nx)) * 0.12, P[b + 1] + ny + (my - (P[b + 1] + ny)) * 0.12, P[b + 2] + nz + (mz - (P[b + 2] + nz)) * 0.12)
        && inStone(P[c] + nx + (mx - (P[c] + nx)) * 0.12, P[c + 1] + ny + (my - (P[c + 1] + ny)) * 0.12, P[c + 2] + nz + (mz - (P[c + 2] + nz)) * 0.12));
      if (!gone) { if (to[i0] < 0) to[i0] = kept++; if (to[i1] < 0) to[i1] = kept++; if (to[i2] < 0) to[i2] = kept++; idx.push(to[i0], to[i1], to[i2]); }
      // (800 triangles at a time; the first 800 of cold code 200 at a time)
      if (t % 2400 === 2397) await tick(COST.unseen * (cold > 1 && t < 2400 ? 200 : 800) * cold);
      else if (cold > 1 && t < 2400 && t % 600 === 597) await tick(COST.unseen * 200 * cold);
    }
    const out = { loc: new Float32Array(kept * 3), placed: { pos: new Float32Array(kept * 3), nor: new Float32Array(kept * 3), idx }, mk: mk && { mark: new Float32Array(kept * 2), sand: new Float32Array(kept) } };
    for (let i = 0; i < nv; i++) {
      const j = to[i]; if (j < 0) continue;
      for (let q = 0; q < 3; q++) { out.loc[j * 3 + q] = loc[i * 3 + q]; out.placed.pos[j * 3 + q] = P[i * 3 + q]; out.placed.nor[j * 3 + q] = N[i * 3 + q]; }
      if (mk) { out.mk.mark[j * 2] = mk.mark[i * 2]; out.mk.mark[j * 2 + 1] = mk.mark[i * 2 + 1]; out.mk.sand[j] = mk.sand[i]; }
    }
    return out;
  };
  // one carving into the front's mesh: m in its own frame, placed where it stands; how open each corner lies is
  // read from the field (the sun's own shade is not baked: it is read from the sun's map)
  const carve = async (m0, placed0, mk0, cost = COST.bakeBlock, cold = 1) => {
    const { loc, placed, mk } = await unseen(m0.pos, placed0, mk0, cold);
    const nv = placed.pos.length / 3, bake = new Float32Array(nv * 3);
    // (the first corners of all are read by cold code: a short piece of their own)
    for (let a = 0, n = sink.verts ? 250 : 40; a < nv; a += n, n = 250) { bakeNet(placed, S, null, 0, true, a, Math.min(nv, a + n), bake, 1e9, true); await tick(cost * 250); }
    for (let i = 0; i < nv; i++) bake[i * 3 + 2] = mk ? mk.sand[i] : 0;
    sinkAdd(sink, placed, bake, mk ? mk.mark : null, loc);
    await tick(COST.sink * nv);
  };
  for (let k = 0; k < 4; k++) {
    // (the first king's work runs cold: it is counted COLD times over, and handed back between its parts)
    const K = kings[k], cold = k ? 1 : COLD;
    if (!k) await tick();
    await hideInside(K.blocks, tick, cold);
    const m = await meshOfPieces(K.blocks, HKING, tick, cold);
    const placed = placeNet(m, [0, 0, 0], [KX[k], KLIFT, 0], K.w, KS);
    await tick(k ? COST.place * m.pos.length / 3 : PIECE);
    const mk = kingMarks(K, m);
    await tick(k ? COST.place * m.pos.length / 3 : PIECE);
    await carve(m, placed, mk, COST.bakeBlock * (k ? 1 : 1.5), k ? 1 : 1.6);
  }
  // ---- the cliff's face and its level top: how open each corner lies (its shade from the sun is read from the sun's map)
  const wall = await buildWall(W, x0, x1, tick);
  // (the box of the natural face's own cast shade, for the sun's map: see below)
  const castBox = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
  {
    const m = wall, n = m.pos.length / 3, mark = new Float32Array(n * 2), bake = new Float32Array(n * 3), piece = 250;
    for (let a = 0; a < n; a += piece) { bakeNet(m, S, null, 0, true, a, Math.min(n, a + piece), bake); await tick(COST.bakeWall * piece); }
    // THE NATURAL FACE'S OWN CAST SHADE (beside the cut, CAST_IN metres and more from it). A corner that looks
    // toward the sun is in cast shade where a ray from it toward the sun passes behind the face's plain line (the
    // face by its bend alone, the corner's own relief kept as the ray's start; CAST_SLACK metres are given, so a
    // ledge does not shade its own riser), looked at every so often up to CAST_FAR metres and never above the brow.
    // ONE READING A CORNER IS NOT A SHADE'S EDGE (p1m3, job 7: the ravine's flank down-river of the cut was soft
    // dark rock with no edge). Until then such a corner was dark and its neighbour lit, and the light ran across
    // the triangle: in a ravine the shade of its sunward lip lay as soft spikes a metre long with no edge. NOW
    // THE SUN'S MAP HOLDS IT: every such corner within MAP_REACH metres of the cut (the front's own breadth) is
    // put in a box, MAP_ROUND metres are given round it, and the map is drawn over the cut's box and that box
    // together (the wall's triangles on that side all drawn in, to the wall's end: whatever stands between a
    // corner and the sun is of this wall). So a ravine's shade has the edge the kings' shade has, at the same
    // tenth of a metre a cell (SUN_CELL), cast by the rock's own relief; such a corner is baked lit and the map
    // says the rest. Only a corner in cast shade further off than MAP_REACH keeps its one reading (this bluff
    // has none: its one ravine lies within reach). The map grows by whole cells of its own: sunFrame lays the
    // second box on the first box's own cells (it moves the map's corner back by whole cells only and takes the
    // greater far side), so every cell the cut's box alone had lies where it lay and holds what it held.
    const CAST_IN = 6, CAST_SLACK = 0.4, CAST_FAR = 60, MAP_REACH = 2 * HALF, MAP_ROUND = 3;
    // (how far along its ray toward the sun a corner's light is cut off; nought: it is not)
    const castAt = (x, y, nx, nyy, nz) => {
      if (nx * sunL.x + nyy * sunL.y + nz * sunL.z < 0.02) return 0;
      const at0 = CAST_SLACK - W.bend(x, y);
      for (let t = 1.5; t < CAST_FAR; t *= 1.45) {
        const px = x + sunL.x * t, py = y + sunL.y * t;
        if (py > BAND && py > W.top(px)) break;
        if (at0 + sunL.z * t < -W.bend(px, py)) return t;
      }
      return 0;
    };
    // THE NATURAL FACE LIES OPEN (p1m3, job 7: the soft dark blots on the rock beside the cut, in the ravine and on
    // the nose, that belonged to nothing). How open a corner lies is read from the front's field, and the field's
    // wall beyond the cut is a plain stand-in that is not the face: the rough rock stands before it or behind it
    // by its own relief, a metre and more from corner to corner. A corner that stood less than the field's reach
    // BEFORE the stand-in read the reach's own end as stone on every side (the further out, the darker: black at
    // the reach itself, FIELD_REACH), and one BEHIND it read the stand-in's lean as a roof over every ledge: each corner its
    // own answer, and the answers ran soft across the triangles. THE RULE: where the stand-in is the nearest thing
    // the field knows to a corner of the natural face (no block within reach, the ground no nearer), the corner
    // has nothing to read and lies OPEN, as every corner of the same face further from the cut already did (the
    // rule in bakeNet); its ledges' own hollows are told below as they were. What a block shades (beside a king,
    // under the row) and the foot's own hollow against the ground keep their readings, and so does the brow's
    // round where it has gone behind the stand-in (it lies so all along the bluff).
    const openAt = (x, y, z) => {
      if (Math.abs(x) <= halfAt(y) && y <= BAND) return false;
      const w = wallNear(x, y, z);
      if (w >= FIELD_REACH || (w <= 0 && y > W.top(x) - SHOULDER)) return false;
      if (w > (y < 3 && z < PAR_Z ? y - duneY(x, z) : y)) return false;
      return stoneAt(x, y, z) >= FIELD_REACH - 1e-3;
    };
    for (let i = 0; i < n; i++) {
      const x = m.pos[i * 3], y = m.pos[i * 3 + 1], z = m.pos[i * 3 + 2], ny = m.nor[i * 3 + 1], cutFace = Math.abs(x) < halfAt(y) - 1 && y < CORN - 1;
      // A RETURN'S CORNERS LIE AS OPEN AS ITS OWN FORM MAKES THEM (p1m3, job 8). The field's stand-in for the wall
      // is not the return, so the field is not asked: a corner of the return's plane h metres from its hollow
      // arris has the floor it stands on h metres off and its own plane behind it; a corner on the hollow arris
      // has the return standing over it as high as it is deep there; the arris that stands free lies open. Each
      // by the bake's own measure and radii (openBy, openUnder), the ground counted as a second floor. So the
      // hollow is a little darker along its arris, the same at every height, and nothing else is told.
      const kindOf = m.kind[i];
      if (kindOf) { const g = y < 3 && z < PAR_Z ? y - duneY(x, z) : y; bake[i * 3] = kindOf === 3 ? openBy(Math.min(m.form[i], Math.max(g, 0))) : openUnder(m.form[i], Math.max(g, 0)); }
      // (a return's own corners: the cut's dressed stone, as the cut's plane has it at that height; no relief, no sand)
      if (kindOf === 3) { mark[i * 2] = y < CORN - 1 ? 0.2 : 0.4; if (i % 500 === 499) await tick(COST.bakeWall * 400); continue; }
      if (Math.abs(x) > HALF + CAST_IN) {
        const t = castAt(x, y, m.nor[i * 3], ny, m.nor[i * 3 + 2]);
        if (t > 0) {
          if (Math.abs(x) < HALF + MAP_REACH) for (const p of [[x, y, z], [x + sunL.x * t, y + sunL.y * t, z + sunL.z * t]]) for (let q = 0; q < 3; q++) { castBox[q] = Math.min(castBox[q], p[q] - MAP_ROUND); castBox[q + 3] = Math.max(castBox[q + 3], p[q] + MAP_ROUND); }
          else bake[i * 3 + 1] = 0;
        }
      }
      // (asked only of a corner that was not read open already; the count below carries its share: this loop
      // measures 0.65 ms for 500 corners without it and 0.77 with it, cold, where it was told as 0.475)
      if (!kindOf && bake[i * 3] < 1 && openAt(x, y, z)) bake[i * 3] = 1;
      if (i % 500 === 499) await tick(COST.bakeWall * 400);
      // (the cut's dressed stone runs to the return's line: less of the ages' varnish than the rock; the worn
      // relief keeps a metre's margin from the line)
      mark[i * 2] = (cutFace || kindOf === 1 || (!kindOf && Math.abs(x) < halfAt(y))) && y < CORN - 1 ? 0.2 : 0.4;
      // the cut plane carries bands of worn relief from the pedestals' height to the kings' shoulders
      mark[i * 2 + 1] = cutFace && y > 2.4 && y < 17.5 ? -1 : 0;
      // sand lies on the top and on every ledge wide enough to hold it
      bake[i * 3 + 2] = sstep(0.8, 0.97, ny) * clamp(0.7 + 0.5 * noise.n2(x * 0.2, 9), 0, 1);
      // a ledge's inner corner, where the next bed's riser stands on it, lies in its own hollow all along the bluff
      const yy = Math.max(y, 0) / BED + bedWarp(W, x), fr = yy - Math.floor(yy);
      if (!cutFace && y > 1 && y < W.top(x) - SHOULDER && (fr > 0.985 || fr < 0.004)) bake[i * 3] *= 0.4;
    }
    sinkAdd(sink, m, bake, mark, null);
    await tick(COST.sink * n * 3);
  }
  // ---- the door's passage: plain walls going dark, sand on the threshold; PASSAGE metres deep to its end wall
  {
    const pos = [], nor = [], idx = [], bk = [], zs = [0, -1.2, -3, -6, -10, -PASSAGE];
    const ring = (z) => { const zt = z - LEAN * DOOR_H * (z === 0 ? 1 : 0); return [[-DOOR_W, 0, z], [DOOR_W, 0, z], [DOOR_W, DOOR_H, zt], [-DOOR_W, DOOR_H, zt]]; };
    const NR = [[0, 1, 0], [-1, 0, 0], [0, -1, 0], [1, 0, 0]];
    for (let j = 0; j < zs.length; j++) for (let e = 0; e < 4; e++) for (const c of [e, (e + 1) % 4]) {
      const p = ring(zs[j])[c], dark = lerp(0.6, 0.04, clamp(-zs[j] / 6, 0, 1));
      pos.push(...p); nor.push(...NR[e]); bk.push(dark, 0, e === 0 ? sstep(-3.5, -0.2, zs[j]) * 0.9 : 0);
    }
    for (let j = 0; j < zs.length - 1; j++) for (let e = 0; e < 4; e++) { const a = (j * 4 + e) * 2, b = a + 8; idx.push(a, a + 1, b + 1, a, b + 1, b); }
    const base = pos.length / 3;
    for (const p of ring(-PASSAGE)) { pos.push(...p); nor.push(0, 0, 1); bk.push(0.03, 0, 0); }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    sinkAdd(sink, { pos: new Float32Array(pos), nor: new Float32Array(nor), idx }, new Float32Array(bk), null, null);
  }
  // ---- the lying pieces, the niche's figure, the squatting row, the swallows' nests: into the one mesh
  for (const P of pieces9) {
    const m = meshOf(P.part, 1.2), placed = placeNet(placeNet(m, [0, 0, 0], [-P.c[0], -P.c[1], -P.c[2]]), P.e, P.at, 1, KS), mk = kingMarks(kings[3], m);
    // (sand drifted up a piece's foot and lying on what of it looks up)
    for (let v = 0; v < mk.sand.length; v++) mk.sand[v] = clamp(sstep(0.75, 0.15, placed.pos[v * 3 + 1]) + 0.7 * sstep(0.75, 0.95, placed.nor[v * 3 + 1]), 0, 1);
    await carve(m, placed, mk);
  }
  { const m = meshOf(hawk, 0.9); await carve(m, m, null); }
  { const m = await meshOfPieces(row, 1.2, tick); await carve(m, m, null); }
  {
    // nests of mud under the cornice's hollow: five to nine colonies, each a CLUMP and never a row: every cup is
    // set about its colony's middle by draws of its own, two along the wall (so most sit near the middle and a few
    // out at the edge) and one up it, and is of its own size. A cup is tested against EVERY cup already built on
    // the front, of its own colony and of every colony before it (the one list `built`): one that would sit in an
    // earlier cup is not built, nor one that would stand level with an earlier cup within a metre of it (level:
    // within a third of a cup's height). So no two cups of the front within a metre of each other share a level,
    // also where two colonies lie over one another, and the gaps are what the draws leave. All of a cup's numbers
    // are drawn before it is tested, so a cup that is not built moves no later draw. A colony is as broad and as
    // high as the number of cups tried for it and its own two draws make it (the more cups, the larger the clump),
    // its middle three to five tenths of the way up the hollow.
    const cups = [], built = [], zAt = (y) => -LEAN * y + 1.9 * (1 - Math.cos((y - CORN) / (RTOP - CORN) * Math.PI / 2));
    for (let c = 0, nc = rNest.int(5, 9); c < nc; c++) {
      const cx = rNest.range(-1, 1) * (halfAt(CORN) - 3), cy = CORN + rNest.range(0.75, 1.35), n = rNest.int(8, 18), wide = rNest.range(0.2, 0.3) * Math.sqrt(n), high = rNest.range(0.13, 0.17) * Math.sqrt(n);
      for (let i = 0; i < n; i++) {
        const x = cx + (rNest() + rNest() - 1) * wide, y = cy + rNest.range(-1, 1) * high, r = rNest.range(0.11, 0.21), z = zAt(y + 0.3) - 0.03;
        if (built.some((q) => Math.abs(q[1] - y) < (Math.abs(q[0] - x) < 0.7 * (q[2] + r) ? 0.2 : Math.abs(q[0] - x) < 1 ? 0.1 : 0))) continue;
        built.push([x, y, r]);
        cups.push(loft(ringOf([x, y, z], AX, AZ, ngon(r * 0.45, 6)), ringOf([x, y + 0.3, z], AX, AZ, ngon(r, 6)), { h: 1 }));
      }
    }
    const m = meshOf(cups, 1), nv = m.pos.length / 3, bake = new Float32Array(nv * 3), mark = new Float32Array(nv * 2);
    for (let i = 0; i < nv; i++) { bake[i * 3] = 0.55; bake[i * 3 + 1] = 1; mark[i * 2] = 2; }
    sinkAdd(sink, m, bake, mark, null);
    await tick(COST.mesh * nv);
  }
  // ---- the forecourt's stone into the mesh, and the terrace's own sand: a sheet of one-metre cells over duneY
  { const m = meshOf(court, 2.5); await tick(COST.mesh * m.pos.length / 3); await carve(m, m, null); }
  {
    // (the sheet runs out to the terrace's own wavering edge and dips under the bank's sand there)
    const pos = [], nor = [], idx = [], xs = gridLines(tx0, tx1, 1.05, []), nxs = xs.length - 1, nzs = 26;
    for (let i = 0; i <= nxs; i++) {
      for (let j = 0; j <= nzs; j++) {
        const x = xs[i], z = lerp(-0.6, terraceEdge(x), j / nzs), y = duneY(x, z), e = 0.35;
        pos.push(x, y + 0.04 * noise.n2(x * 0.3, z * 0.3) - 0.5 * sstep(0.88, 1, j / nzs), z);
        const n = v3unit([(duneY(x - e, z) - duneY(x + e, z)) / (2 * e), 1, (duneY(x, z - e) - duneY(x, z + e)) / (2 * e)]);
        nor.push(n[0], n[1], n[2]);
      }
      if (i % 8 === 7) await tick(COST.place * 8 * 27 * 6);
    }
    for (let i = 0; i < nxs; i++) for (let j = 0; j < nzs; j++) { const a = i * (nzs + 1) + j, b = a + nzs + 1; idx.push(a, a + 1, b + 1, a, b + 1, b); }
    const m = { pos: new Float32Array(pos), nor: new Float32Array(nor), idx }, nv = pos.length / 3, bake = new Float32Array(pos.length);
    for (let a = 0; a < nv; a += 250) { bakeNet(m, S, null, 0, true, a, Math.min(nv, a + 250), bake); await tick(COST.bakeBlock * 250); }
    for (let i = 0; i < nv; i++) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      // the packed floor shows pale between the drifts; the sand lies gold in the dunes, against stone, round the lying pieces
      let near = 0; for (const b of blocksAt) near = Math.max(near, sstep(b[2] + 2.2, b[2] * 0.6, hyp(x - b[0], z - b[1])));
      bake[i * 3 + 2] = clamp(0.3 + 0.75 * noise.fbm2(x * 0.09, z * 0.09 + 3, 3) + 0.9 * y + 0.8 * near + 0.6 * sstep(18, 25, z), 0, 1);
    }
    sinkAdd(sink, m, bake, null, null);
  }
  // ---- the sun's map of the front: every block's far faces, the bluff's face set back a hand; over the cut's own
  //      box and, on the cut's own cells, the box of the natural face's cast shade (a ravine beside the cut)
  const cast = castBox[0] < castBox[3];
  const F = sunFrame(sunL, [-HALF - 31, -3, -3, HALF + 17, RTOP + 5, 33], SUN_CELL, cast ? castBox : null);
  await tick(COST.sunCell * F.nx * F.ny);
  for (let i = 0; i < allBlocks.length; i += 2) await tick(COST.sunCell * sunBlocks(F, allBlocks.slice(i, i + 2)) + 0.02);
  {
    // (the wall's triangles within lim of the door; on the side the cast shade's box lies, all of them to the
    // wall's end: a ray from a ravine toward this low sun runs on through the rock beyond it)
    const P = wall.pos, I = wall.idx, lim = HALF + 32, at = (i) => [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]];
    const limN = cast && castBox[0] < -HALF ? 1e9 : lim, limP = cast && castBox[3] > HALF ? 1e9 : lim, off = (x) => x > limP || x < -limN;
    for (let t = 0, work = 0, n = 0; t < I.length; t += 3) {
      if (off(P[I[t] * 3]) && off(P[I[t + 1] * 3])) continue;
      work += sunTri(F, at(I[t]), at(I[t + 1]), at(I[t + 2]), 0.25);
      // (told every four hundred triangles, by the cells they went over and their own number)
      if (++n === 400) { await tick(COST.sunCell * work + COST.sunTri * n); work = 0; n = 0; }
    }
  }
  await tick();   // (the wall's last triangles are in the map: the page is handed back before the map is packed)
  // (depth in sixteen bits over the map's own span: about a millimetre and a half)
  const span = F.w1 - F.w0, pix = new Uint8Array(F.nx * F.ny * 2);
  { const n = F.depth.length; for (let o0 = 0; o0 < n; o0 += 30000) { sunPack(F.depth, pix, F.w0, 65535 / span, o0, Math.min(n, o0 + 30000)); await tick(COST.sunPack * 30000); } }
  const sunTex = new THREE.DataTexture(pix, F.nx, F.ny, THREE.RGFormat);
  sunTex.unpackAlignment = 1; sunTex.minFilter = sunTex.magFilter = THREE.NearestFilter; sunTex.generateMipmaps = false; sunTex.needsUpdate = true;
  mat.uniforms.uSunMap.value = sunTex; mat.uniforms.uSunK.value.set(F.nx, F.ny, 0.05 / span, 0.05);
  // a place of the front's own frame into the map: cells across and up, depth as a share of the span
  const toMap = new THREE.Matrix4().set(F.U[0] / F.cell, F.U[1] / F.cell, F.U[2] / F.cell, -F.u0 / F.cell, F.V[0] / F.cell, F.V[1] / F.cell, F.V[2] / F.cell, -F.v0 / F.cell, F.W[0] / span, F.W[1] / span, F.W[2] / span, -F.w0 / span, 0, 0, 0, 1);
  const _inv = new THREE.Matrix4(), place = () => { group.updateWorldMatrix(true, false); mat.uniforms.uSunM.value.multiplyMatrices(toMap, _inv.copy(group.matrixWorld).invert()); };
  place();
  await tick();
  const front = new THREE.Mesh(await sinkGeometry(sink, tick), mat);
  await tick();
  front.frustumCulled = false; group.add(front);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  return {
    object: group, radius: 24, height: 46, center: V(0, 16, 3), ground: true, groundY: -0.6,
    triangles: sink.tris,
    anchors: {
      door: V(0, DOOR_H / 2, -DOOR_IN), doorAxis: V(0, 0, -1), kings: KX.map((x) => V(x, 0, 0)), faces: KX.map((x) => V(x, KLIFT + 18.4 * KS, 4.7 * KS)), kneeY: KLIFT + 10 * KS, kneeZ: 8.8 * KS, toesZ: 10.5 * KS,
      footHalf: 4.9 * KS, crownY: KLIFT + CROWN_TOP * KS, passage: PASSAGE,
      blocks: blocksAt, terrace: { x0: tx0, x1: tx1, edge: terraceEdge }, way: { half: WAY_HALF }, parapet: { z: PAR_Z, x0: PX0, x1: PX1 },
      cut: { half: HALF, top: RTOP, band: BAND }, door_w: DOOR_W * 2, door_h: DOOR_H,
    },
    // (place: to be called when the front has been set where it stands, so that the sun's map lies on it)
    kit: { material: mat, wallZ: (x, y) => wallZ(W, x, y), farRows: (x) => farRows(W, x), field: S, dune: duneY, place },
    update(dt, time) { mat.uniforms.uTime.value = time; },
    dispose() { sunTex.dispose(); },
  };
}
