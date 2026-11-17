// valley-inside-the-works, the chocolate: THE FALL'S SHEET, built on the form in the lip file: one mesh from the upper
// river's face (it lies on it, a finger's breadth over, wearing the same coordinates, so there is no break), over
// the shoulder and the roll, and down to the pool. Every vertex carries how THICK the sheet is there; the family's
// shader lets it go where it is thinner than a hand (the windows, with ragged edges), rounds every free edge into a
// rim, and lets a little warm light through where it is thin. The strands in the windows are thin ridges of that
// thickness on a column of their own, each ending in a pear; a strand that is shedding has a drop falling below it.
// In its last metres above the folds a tongue swings forward and back in broad pleats (moved by the vertex shader).
// The stream's crown is highest in mid-stream; its two margins come down onto the rock's sill and end there. Close
// behind the sheet hangs a second, thinner fall (addBacking), so that a window shows brown.
import * as P from './valley-inside-the-works-plan.js';
import { streamV, smooth } from './valley-inside-the-works-chocolate-river.js';
import { POOL_Y, ZA, SB, DYB, ROCK_Z, ROCK_Y, faceY, upperHalf, onLip, inAir, tongueAt, tongueT, webThin, edgeThin, edgeCut, columnsOf, fallFeet, CUT, DMAX } from './valley-inside-the-works-chocolate-lip.js';

const STATIONS = [-2.6, -2.0, -1.2, -0.5, 0, 0.25, 0.5, 0.75, 1, 1.12, 1.24, 1.36, 1.48, 1.6, 1.72, 1.84, 1.93, 2];   // the lip: before the turn, the shoulder, the roll
const NR = 52, DEND = DMAX + 0.4;                // rows in the air (closer together at the top, where the arc turns); how far down the sheet is built (its end lies in the pool)
const PLEAT = 2 * Math.PI / 1.25;                // the pleats above the folds lie 1.25 m apart
const WALL = 8.12;                               // the sheet's outermost column at the lip: a hand inside the notch's side

// The sheet's grid: rows from before the turn to the pool, each a list of { x, y, z, p (its place on the profile), x0, T, amp, ph, sway, sph }
// (made a few rows at a time; what it returns at its end is the grid)
function* grid(F) {
  const cols = columnsOf(F), feet = fallFeet(F), last = F.tongues.length - 1;
  // the face's line is not ruled: it wanders, and the stream heaps up toward its middle before it turns over (a rounded brow)
  const uneven = (x0) => 0.03 + 0.06 * Math.sin(0.9 * x0 + F.wave[0]) + 0.035 * Math.sin(2.3 * x0 + F.wave[1]) + 0.16 * (1 - (x0 / WALL) * (x0 / WALL));
  const cap = (xi) => Math.pow(Math.max(1 - xi * xi, 0), 0.9) - 0.12;   // (a tongue's round across: a broad back, no pilaster)
  const pleatAt = (i, xi, D) => ({ amp: (0.2 + 0.28 * F.tongues[i].b) * smooth(feet[i].D - 2.8, feet[i].D - 0.2, D), ph: PLEAT * (1.25 / F.tongues[i].lam) * D + F.tongues[i].num + 2.4 * (F.tongues[i].bow - 2.2) * xi - 0.5 * xi * xi });   // (each tongue's pleats lie at its own spacing and slant)
  const rows = [];
  const stations = STATIONS.map((st) => ({ st, D: 0 }));
  for (let r = 1; r <= NR; r++) stations.push({ st: 2, D: DEND * Math.pow(r / NR, 1.3) });
  for (const { st, D } of stations) {
    const S = F.tongues.map((t) => tongueAt(t, D)), tT = tongueT(D), q = Math.min(D / DMAX, 1), row = [], Dp = st < 2 ? onLip(st).s - SB : D;
    for (const cd of cols) {
      let x0, x, off, T = tT, out, pl;
      if (cd.t !== undefined) {
        const t = F.tongues[cd.t], g = S[cd.t];
        x0 = t.c + t.a * cd.xi; x = g.c + g.a * cd.xi; out = t.out; pl = pleatAt(cd.t, cd.xi, D);
        off = g.b * cap(cd.xi);
      } else if (cd.e !== undefined) {
        // an edge: from the notch's side (f 0), which falls all but plumb, to its tongue (f 1), which necks inward
        const i = cd.e ? last : 0, sd = cd.e ? 1 : -1, t = F.tongues[i], g = S[i], f = cd.f, xt = t.c + sd * t.a, xw = sd * WALL * (1 - 0.08 * q), pe = pleatAt(i, sd, D);
        x0 = sd * WALL + (xt - sd * WALL) * f; x = xw + (g.c + sd * g.a - xw) * f; out = t.out;
        off = -0.12 * g.b - 0.3 * (1 - f);
        T = Math.max(edgeThin(F.edges[cd.e], f, Dp), -0.35);
        pl = { amp: 0.6 * pe.amp, ph: pe.ph };
      } else {
        const web = F.webs[cd.w], tl = F.tongues[cd.w], tr = F.tongues[cd.w + 1], gl = S[cd.w], gr = S[cd.w + 1], f = cd.f;
        const a = tl.c + tl.a, b = tr.c - tr.a, xa = gl.c + gl.a, xb = gr.c - gr.a, pa = pleatAt(cd.w, 1, D), pb = pleatAt(cd.w + 1, -1, D);
        x0 = a + (b - a) * f; x = xa + (xb - xa) * f; out = tl.out + (tr.out - tl.out) * f;
        off = -0.12 * (gl.b + (gr.b - gl.b) * f) - 0.1 * Math.sin(Math.PI * f);
        T = Math.max(webThin(web, f, D), -0.35);
        pl = { amp: 0.6 * (pa.amp + (pb.amp - pa.amp) * f), ph: pa.ph + (pb.ph - pa.ph) * f };
      }
      const p = st < 2 ? onLip(st) : (D > 0 ? inAir(D, out) : onLip(2));
      const zr = Math.min(p.z, ZA), level = faceY(x0, zr) + uneven(x0) * smooth(ZA - 3, ZA - 0.5, p.z) + (st < -2.2 ? -0.05 : 0.03);
      const xs = p.z < ZA ? x * upperHalf(p.z) / 8 : x, o = off * p.g;
      // (an edge's outer half comes down onto the rock's sill before the shoulder's end, and its inner half slopes down to it: the stream's rounded margin)
      const dip = cd.e !== undefined ? Math.max(level - p.dy - ROCK_Y - 0.05, 0) * smooth(0.3, 0.9, st) * (1 - smooth(0.5, 1, cd.f)) : 0;
      row.push({ x: xs, y: level - p.dy - dip + o * p.ny, z: p.z + o * p.nz, p, x0, T, D, amp: D > 0 ? pl.amp : 0, ph: pl.ph, sway: 0.1 * smooth(1, 9, D), sph: 0.35 * x0 + F.wave[2], strand: 0, col: cd });
    }
    rows.push(row);
    if (rows.length % 3 === 0) yield rows.length;
  }
  return { rows, cols, feet };
}

// The strands: on its own column each, from where its web thins away down to its end; thinner as it falls, a pear at
// the end. ends: where each one that is shedding ends (for the falling drops).
function strands(F, G) {
  const { rows, cols } = G, ends = [], first = STATIONS.length;
  cols.forEach((cd, c) => {
    const opening = cd.w !== undefined ? F.webs[cd.w] : (cd.e !== undefined ? F.edges[cd.e] : null);
    if (!opening) return;
    for (const s of opening.strands) {
      if (s.col !== cd.j) continue;
      let top = first - 4;                           // (an edge may be open from the roll on)
      while (top < rows.length && rows[top][c].T >= CUT) top++;
      if (top >= rows.length - 6) continue;
      const D0 = rows[top][c].D, foot = Math.min(...G.feet.map((f) => f.D)), len = Math.min(s.len, foot - 1.2 - D0);
      if (len < 1) continue;
      for (let r = Math.max(top - 2, first - 5); r < rows.length; r++) {
        const v = rows[r][c], u = (v.D - D0) / len;
        if (u > 1) break;
        // (thinner as it falls, a pear at its end; its two neighbour columns are drawn in beside it, so it stays a hand wide)
        const pear = smooth(0.8, 0.9, u), core = s.fat * (1 - 0.4 * Math.max(u, 0)) * (1 - pear) + pear, wS = 0.11 * (1 - 0.4 * Math.max(u, 0)) * (1 - pear) + 0.2 * pear, on = smooth(-0.6, 0, u);
        v.T = Math.max(v.T, core * on); v.strand = Math.max(v.strand, on);
        for (const k of [-1, 1]) { const n = rows[r][c + k]; n.x += (v.x + k * wS - n.x) * on; n.strand = Math.max(n.strand, 0.6 * on); }
        if (u > 0.9 && s.drop && !ends.some((e) => e.s === s)) ends.push({ s, x: v.x, y: v.y, z: v.z });
      }
    }
  });
  return ends;
}
// The sheet. F: fallShapes(rng). It is built a few rows at a time: run it to its end, with a breath at each yield.
// When it is done, F.ends holds where each shedding strand ends.
export function* addSheet(acc, F) {
  const G = yield* grid(F), { rows } = G, vTop = streamV(ZA), ids = [];
  yield 0;
  F.ends = strands(F, G);
  yield 1;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r], up = rows[Math.max(r - 1, 0)], dn = rows[Math.min(r + 1, rows.length - 1)], id = [];
    for (let c = 0; c < row.length; c++) {
      const v = row[c], a = row[Math.max(c - 1, 0)], b = row[Math.min(c + 1, row.length - 1)];
      // how the thickness changes across and along the sheet, per metre (the shader turns every free edge by it)
      const gx = (b.T - a.T) / Math.max(b.x - a.x, 0.02), gs = (dn[c].T - up[c].T) / Math.max(Math.hypot(dn[c].y - up[c].y, dn[c].z - up[c].z), 0.05);
      const k = v.D > 0 ? PLEAT : 1, cx = P.riverX(Math.min(v.z, ZA));
      id.push(acc.vertex(v.x + cx, v.y, v.z, v.x0 * 6.5 / 8, vTop + v.p.s, 0, v.p.ty * k, v.p.tz * k, 1.2 + 3.2 * Math.sqrt(Math.max(v.p.s - 1, 0) / 13), 0,
        { thin: v.T, froth: v.strand, kind: 3, scale: 6.5 / 8, half: -6.5, pleat: [0, 0, gx, gs], move: [v.amp, v.sway, v.ph, v.sph] }));
    }
    if (r > 0) acc.strip(id, ids[r - 1]);
    ids.push(id);
    if (r % 4 === 3) yield r;
  }
}

// THE THIN FALL BEHIND: close behind the sheet (half a metre nearer the rock) a second, thinner fall runs down, whole
// from side to side, so that a window or a tear in the sheet shows brown liquid in the sheet's shade, never a black
// hollow. It hangs from under the roll into the pool and is nowhere wider than the sheet before it.
export function addBacking(acc, F) {
  const last = F.tongues.length - 1, NB = 14, NRB = 18, vTop = streamV(ZA), level = faceY(0, ZA), cx = P.riverX(ZA);
  let prev = null;
  for (let r = 0; r <= NRB; r++) {
    const D = 0.9 + (DEND - 0.9) * Math.pow(r / NRB, 1.2), q = Math.min(D / DMAX, 1), p = inAir(D, 0);
    const gl = tongueAt(F.tongues[0], D), gr = tongueAt(F.tongues[last], D), fb = Math.min(Math.max(edgeCut(D) + 0.3, 0), 1);
    const xl = -WALL * (1 - 0.08 * q), xr = WALL * (1 - 0.08 * q), a = xl + (gl.c - gl.a - xl) * fb, b = xr + (gr.c + gr.a - xr) * fb;
    const z = Math.max(p.z - 0.5, ROCK_Z + 0.12), row = [];
    for (let j = 0; j <= NB; j++) {
      const x = a + (b - a) * j / NB;
      row.push(acc.vertex(x + cx, level - DYB - D, z, x * 6.5 / 8, vTop + SB + D, 0, -1, 0, 2.4, 0, { thin: -0.55, kind: 1, scale: 6.5 / 8, half: -6.5 }));
    }
    if (prev) acc.strip(row, prev);
    prev = row;
  }
}

// THE DROPS: under each shedding strand one fat drop: it swells at the strand's end, lets go, and falls to the pool
// (the family's vertex shader moves it: aMove = how far it falls, how long one drop takes, where in that time it is).
export function addDrops(acc, F) {
  const RINGS = [0, 0.1, 0.25, 0.42, 0.6, 0.78, 0.92, 1], NS = 8;
  for (const e of F.ends || []) {
    const r = 0.1 + 0.05 * e.s.fat, h = 2.9 * r, cx = e.x, cy = e.y - 0.3 * h, cz = e.z + 0.06, travel = Math.max(cy - POOL_Y - 0.4, 0.5);
    let up = null;
    RINGS.forEach((u, n) => {
      // a pear: narrow above, fat below
      const rr = r * Math.sin(Math.PI * Math.pow(u, 0.62)) * (0.55 + 0.6 * u), y = cy + h * (0.5 - u), ring = [];
      for (let j = 0; j < NS; j++) {
        const a = 2 * Math.PI * j / NS;
        ring.push(acc.vertex(cx + rr * Math.sin(a), y, cz + rr * Math.cos(a), cx * 6.5 / 8, streamV(ZA) + 4, 0, -1, 0, 3, 0, { kind: 4, half: -6.5, pleat: [cx, cy, cz, 0], move: [travel, e.s.per, e.s.ph, 0] }));
      }
      if (up) for (let j = 0; j < NS; j++) acc.idx.push(ring[j], ring[(j + 1) % NS], up[j], ring[(j + 1) % NS], up[(j + 1) % NS], up[j]);
      up = ring;
    });
  }
}
