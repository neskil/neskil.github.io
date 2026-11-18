// city-closing-overhead, THE TOWN (builder B): every house, wall, landmark and tree of the curl and of the flat town.
// It imports the kept core (the Writer, the bodies, the sweep bounds) and reads the plan it is handed; it writes neither.
// ONE BLOCK ROUTINE, ONE HOUSE WRITER: a terrace is an unbroken run of SOFT bodies (each vertex rides its own ground, so the
// walls stand radial and no house leaves the land), fronts flush, party walls written whole. Rows along z on the foot, the
// flank and the flat town; rows along a (turned a quarter) on the ceiling. Every die from a stream named closing-(its thing).
// x IS WORLD x; a is metres from the hinge along the land, z along the flight. In the flat town f = 56 - x stands for a.
// bodies: { aC, zC (the body's anchor), sa0, sa1, sz0, sz1 (its span about the anchor, along a and z), base, top (along its
// ground's normal), soft (true: a = aC + its span rides the ground; false: it stands rigid on the anchor's axes) }; a flat
// body has aC -1 and its anchor's x, y, z. chimneys: { a, z, top } (flat ones a -1 with x, y, z of the top).
// NOTHING HERE READS THE EYE'S PLACE: no rule of this file knows the route or the clock; every figure is a place's.
// THE FINISHING ROUND (9 Nov): what is NEAR THE WAY BY THE PLAN (the rows that front the promenade, the hinge square and the
// street's end; the promenade's and the hinge square's trees; towers A and B; the yards' walls within 50 m of the hinge line)
// is made in relief: reveals, sills, cornices, courses, shutters, pots, ridge tiles, leaf masses, belfries, arched gateways.
// Roofs stand in four families of tone everywhere. One mesh more: the flat promenade's row ('closing-flat-near').
// THE SECOND FINISHING PASS (9 Nov), every place the plan's: the towers of ONE BRICK, plain on every face, their relief of the
// same tone; a broad low basin with a square pier in each square; NOTHING SMALL ALONE ON OPEN PAVING (no post, bollard, tub,
// box, table or stall; a bench only with its back on a wall); trees in CLUMPS and never a file, a stream to each kind, leaf
// masses within 60 m of the promenade's middle line and in every square; the entry's opened place dressed (limes in a kerb,
// a wall fountain, wall lanterns); the outskirts' fields closed by hedges, with orchards in clumps, sheds and blind barns;
// the rim's row two floors and the lowest, behind the plan's rim street.
// THE THIRD PASS (9 Nov): (1) NO TALL PANE, BAR, STRIPE OR PALE BAND ON ANY BUILDING: the hall is plain brick in the houses'
// own small panes (class 1; this file writes no face of the tall-pane class 8 any more); towers and tower houses stay one
// brick, barns and sheds blind. (2) THE LAW OF BODIES (above makeTown): the kerb rows and the flat half stand first; a house
// of the roll that would stand through or within 1 m of one of theirs is left out (stats.met, stats.left). (3) THE TOWN'S
// END AND ITS LOTS ARE THE PLAN'S ALONE: this file holds no end figure; it builds every block, field, farm and tree the
// plan gives, to wherever the plan carries the rolled half. A house's body carries house: true and kerb (a kerb row's).
// AFTER IT (04:37): NOTHING STANDS WHERE THE LAND IS NOT: every body of the roll is tested against the land's free edge at
// its own z (the core's L(z) and the plan's cut, 2 m beyond its far side each way): left out, or a wall or hedge cut back
// (stats.off, stats.cut, stats.offList); an orchard plants the plan's clipped list. Bodies also carry wall, hedge, shed, barn.
import * as THREE from 'three';
import { PLAN, Writer, rowHouse, TREE_KINDS, walls4, segWall, wallColour, wallClass, bandOf, sweepSphere, bendKnots, bendFrame, B0, Lz } from './city-closing-overhead.js';

const C = (h) => new THREE.Color(h), DEG = Math.PI / 180;
const FLOOR = 3.1;                      // a storey (section 4): the facade's cells are cut to it
const ARC_H = 4.2, ARC_T = 3.2;         // an arcade's open ground floor and the walk's depth behind the piers (section 4)
const SLAB_A = 6;                       // the promenade's slab strip, a 0 to 6: the row that fronts it is arcaded
// section 5's two tile tones and six between and beside them (newer tile, weathered grey-brown): a town's roofs seen from over
// them are never one tone
// (the finishing round: FOUR FAMILIES, never one dark one: weathered red, brown, slate grey, and a few mossed)
const ROOFS = ['#8a4a36', '#7a4234', '#96573d', '#6a4638', '#5a4034', '#74584a', '#6b6660', '#5c5853', '#7a746c', '#8a4a36', '#666a50', '#75633f'].map(C);   // (slate typed as a warm grey: the sky's own blue falls on it)
const CHIMNEY = C('#7a5040'), SOFFIT = C('#6b5a4a'), RUBBLE = ['#8f7a66', '#9a8570', '#84705e'].map(C), STONE = C('#b9ad98');
const BRICK_T = C('#b67c66');            // the kept towers' rose brick (their corner strips are of it)
const BRICK = C('#a8604a'), WATER = C('#4f8a96');           // section 5's brick; a basin's water, lit from under (the finishing round)
const ZONES = ['foot', 'flank', 'ceiling', 'brink', 'promenade', 'flat', 'landmarks', 'trees'];   // section 9's lines
// ONE RECIPE A ZONE (section 4): fronts in metres, floors, the share with the gable to the street, the pitch in degrees, the
// share with a chimney, dormers or none, and the zone's most houses (a guard only: stats.stopped counts what it stops, and it
// stops none where the plan carries the rolled town to the roll's own end: the figures stand well over the plan's most lots,
// so the town's end is the plan's and never this guard's)
const RECIPE = {
  promenade: { f: [5, 9], fl: [3, 4], gable: 1, pitch: [30, 40], chim: 1, most: 280 },
  foot: { f: [4.5, 9], fl: [3, 4], gable: 0.3, pitch: [28, 45], chim: 1, dormer: 0.5, most: 1700 },
  flank: { f: [4.5, 9], fl: [3, 4], gable: 0.3, pitch: [28, 45], chim: 1, most: 2300 },
  ceiling: { f: [7, 10], fl: [3, 5], gable: 0.3, pitch: [28, 45], chim: 1, dormer: 0.34, most: 2700 },   // (the finishing round: its roofs face us: one lit dormer on one eaves-fronted house in three)
  brink: { f: [7, 10], fl: [2, 2], gable: 0.3, pitch: [28, 38], chim: 1, most: 420 },   // (THE RIM'S ROW IS THE LOWEST of the town: two floors under a low roof, a calm line behind the rim street's parapet)
  flat: { f: [8, 12], fl: [2, 4], gable: 0.3, pitch: [28, 45], chim: 0.5, most: 1800 },
};
// THE HEIGHT RULE (section 3; the ring's count rests on it): from its own ground nothing of the curl stands over 18 m where a
// is under 60, 26 m to a 100, 24 m on the flank, 76 m on the ceiling; each less 0.3 m for the soft chord of a roof
const capAt = (a) => (a < 60 ? 17.7 : a < 100 ? 25.7 : a < 270 ? 23.7 : 75.7);
const zoneAt = (a) => (a < 110 ? 'foot' : a < 270 ? 'flank' : 'ceiling');
// a run cut into fronts: dealt widths while more than two houses' worth is left; the rest is one house or two equal ones
function fronts(R, len, lo, hi) {
  const out = []; let left = len;
  while (left > hi + lo) { const w = lo + (hi - lo) * R(); out.push(w); left -= w; }
  if (left > hi) out.push(left / 2, left / 2); else out.push(left);
  return out;
}

// the facade's own height (the second of the Writer's four facade floats: s, h, width, eaves) on what was written since
// `from`: rewritten by f, so that a floor's cells begin where a wall does
const cells = (W, from, f) => { const v = W.f.v; for (let i = from; i < W.f.len; i += 4) v[i + 1] = f(v[i + 1]); };

// ONE HOUSE about its own anchor, by its row's axes: r along the row (-w/2 to w/2), t across it (the front at t = +d/2).
// ax: the row's axis ('z' or 'a'); fl: the sign of the front along the body's other axis. Returns the ridge's height.
function house(W, H) {
  const { ax, fl, w, d, e, pitch, gab, wall, roof, seed, base } = H, z = ax === 'z', hw = w / 2, hd = d / 2;
  const X = (r0, r1, t0, t1) => { const a = fl * t0, b = fl * t1, lo = Math.min(a, b), hi = Math.max(a, b); return z ? [lo, hi, r0, r1] : [r0, r1, lo, hi]; };
  const P = (r, n, t) => (z ? [fl * t, n, r] : [r, n, fl * t]);
  const ridge = gab === z ? 'u' : 'z';                       // gable to the street: the ridge runs across the row
  const open = z ? 'u' : 'z', cls = wallClass(wall), end = H.first || H.last, B = X(-hw, hw, -hd, hd);
  // (near the way the roof stands 0.65 m over the front, 0.45 m past the skin: an eaves' overhang with its shadow line)
  const ov = H.near ? 0.65 : gab ? 0.35 : 0.4; H.over = end && !gab && !H.arcade ? 0.4 : ov;
  let rr;
  if (H.arcade) {
    // AN ARCADED FRONT (Bern, Telc): the upper floors' front over the walk, the ground floor's own face 3.2 m behind it, the
    // party walls whole above the walk (their foot, hidden between neighbours, written only at a run's end), a soffit, piers
    const tA = hd - ARC_T, up = ARC_H - FLOOR, f0 = W.f.len;
    // (the upper floors' cells begin on the arcade's top, not 1.1 m under it: their walls' own heights are written less 1.1 m)
    W.look(cls, seed, e - up, end ? 'all' : open);
    W.quad(P(-hw, ARC_H, hd), P(hw, ARC_H, hd), P(hw, e, hd), P(-hw, e, hd), wall, P(0, 0, 1));
    for (const sg of [-1, 1]) W.quad(P(sg * hw, ARC_H, -hd), P(sg * hw, ARC_H, hd), P(sg * hw, e, hd), P(sg * hw, e, -hd), wall, P(sg, 0, 0));
    cells(W, f0, (h) => h - up);
    W.look(cls, seed, e, end ? 'all' : open);
    W.quad(P(-hw, base, -hd), P(hw, base, -hd), P(hw, e, -hd), P(-hw, e, -hd), wall, P(0, 0, -1));
    W.look(cls, seed, ARC_H, end ? 'all' : open);            // the ground floor's own face behind the walk: its door, its panes
    W.quad(P(-hw, base, tA), P(hw, base, tA), P(hw, ARC_H, tA), P(-hw, ARC_H, tA), wall, P(0, 0, 1));
    for (const sg of [-1, 1]) if (sg < 0 ? H.first : H.last) W.quad(P(sg * hw, base, -hd), P(sg * hw, base, tA), P(sg * hw, ARC_H, tA), P(sg * hw, ARC_H, -hd), wall, P(sg, 0, 0));
    W.look(cls, seed, e - up, 'none');
    rr = W.gable(B[0], B[1], B[2], B[3], e, pitch, 0.12, roof, ridge, wall, ov);
    H.arc0 = W.tris;                                         // (from here to arc1: the arcade's own count)
    W.look(0); W.quad(P(-hw, ARC_H, tA), P(hw, ARC_H, tA), P(hw, ARC_H, hd), P(-hw, ARC_H, hd), SOFFIT, P(0, -1, 0));
    W.look(cls, seed, e, 'none');
    // a pier 1.0 m square on each party line (a run's first and last stand wholly inside the run), one more under a front over 6.5 m
    const piers = [H.first ? -hw + 0.5 : -hw]; if (w > 6.5) piers.push(0); if (H.last) piers.push(hw - 0.5);
    H.piers = piers;
    for (const pr of piers) { const Q = X(pr - 0.5, pr + 0.5, hd - 1.0, hd); walls4(W, Q[0], Q[1], base, ARC_H, Q[2], Q[3], wall); }
    // each bay's two top corners filled by a haunch (0.9 m, or a third of a narrow bay): the opening reads as a low arch
    const bL = H.first ? -hw + 1.0 : -hw + 0.5, bR = H.last ? hw - 1.0 : hw - 0.5;
    for (const [b0, b1] of w > 6.5 ? [[bL, -0.5], [0.5, bR]] : [[bL, bR]]) {
      const f = Math.min(0.9, (b1 - b0) / 3);
      W.tri(P(b0, ARC_H, hd), P(b0 + f, ARC_H, hd), P(b0, ARC_H - f, hd), wall, P(0, 0, 1));
      W.tri(P(b1, ARC_H, hd), P(b1 - f, ARC_H, hd), P(b1, ARC_H - f, hd), wall, P(0, 0, 1));
    }
    H.arc1 = W.tris;
  } else if (end && !gab) {
    // A RUN'S END at a cross street (the first critic's 14): hipped, with openings on every face: no blank gable to a street
    rr = rowHouse(W, z ? d : w, z ? w : d, e, pitch, ridge, wall, roof, 0, base, { seed, cls, ends: [H.first, H.last] });
  } else {
    W.look(cls, seed, e, end ? 'all' : open);
    walls4(W, B[0], B[1], base, e, B[2], B[3], wall);
    rr = W.gable(B[0], B[1], B[2], B[3], e, pitch, gab ? 0.12 : ov, roof, ridge, wall, gab ? ov : 0);
  }
  if (H.plinth) {
    // THE BRINK'S PLINTH (section 4): masonry 3 m past the ground's back under the back and gable walls, 0.2 m proud, closed below
    const Q = X(-hw - 0.2, hw + 0.2, -hd - 0.2, hd);
    W.look(4, seed, 0); walls4(W, Q[0], Q[1], -3, 0.3, Q[2], Q[3], H.plinth);
    W.look(0); W.quad([Q[0], -3, Q[2]], [Q[1], -3, Q[2]], [Q[1], -3, Q[3]], [Q[0], -3, Q[3]], H.plinth, [0, -1, 0]);
  }
  if (H.ch > 0) {
    // ONE CHIMNEY, 0.7 m square, on the ridge, in the middle six tenths of it (a hipped end's stands off the hip; a lone house's, hipped twice, in the middle)
    const L = (gab ? d : w) * 0.3, c = H.cpos - 0.5, off = 2 * L * (gab || !end ? c : H.first && H.last ? 0 : H.first ? Math.abs(c) : -Math.abs(c));
    const cr = gab ? 0 : off, ct = gab ? off : 0, Q = X(cr - 0.35, cr + 0.35, ct - 0.35, ct + 0.35);
    W.look(1, seed, rr + H.ch); W.box(Q[0], Q[1], rr - 1.0, rr + H.ch, Q[2], Q[3], CHIMNEY);
    H.chimAt = P(cr, rr + H.ch, ct); H.chimC = [cr, ct, rr + H.ch];
  }
  for (let k = 0; k < (H.dorm || 0); k++) {
    // A DORMER on the street's slope (8 triangles): its face 1.4 by 1.5 m, 1.1 m back from the eaves, a small gabled lid
    const r0 = H.dorm === 1 ? 0 : (k ? 0.24 : -0.24) * w, tn = Math.tan(pitch), tf = hd - 1.1, y0 = e + 1.1 * tn, y1 = y0 + 1.5;
    const tb = tf - 1.5 / tn, tr = tf - 1.95 / tn;
    // (its face is ONE CELL of a first floor: the pane's 0.85 to 2.75 m of the cell written over the face's 1.5 m)
    const f0 = W.f.len; W.look(cls, seed, 2 * FLOOR, 'all');
    W.quad(P(r0 - 0.7, y0, tf), P(r0 + 0.7, y0, tf), P(r0 + 0.7, y1, tf), P(r0 - 0.7, y1, tf), wall, P(0, 0, 1));
    cells(W, f0, (h) => FLOOR + 0.85 + (h - y0) * 1.9 / 1.5); W.look(cls, seed, e, 'none');
    for (const sg of [-1, 1]) {
      W.tri(P(r0 + sg * 0.7, y0, tf), P(r0 + sg * 0.7, y1, tf), P(r0 + sg * 0.7, y1, tb), wall, P(sg, 0, 0));
      W.quad(P(r0 + sg * 0.8, y1, tf + 0.15), P(r0, y1 + 0.45, tf + 0.15), P(r0, y1 + 0.45, tr), P(r0 + sg * 0.8, y1, tb), roof, P(sg, 1, 0));
    }
  }
  if (H.near) {
    // NEAR THE WAY: the front's skin with its reveals, then its dressings (the arcade's upper floors; a plain front whole)
    if (H.arcade) skin(W, P, H, cls, ARC_H, e, ARC_H - FLOOR, 1, Math.round((e - ARC_H) / FLOOR), false);
    else skin(W, P, H, cls, base, e, 0, 0, Math.floor((e + 0.25) / FLOOR) - 1, true);
    dress(W, P, X, H, rr, cls);
  }
  return rr;
}

// A ROUND LUMP for the crowns passed close by (the kept lump is eight faces: a diamond at 20 m): six sides, two rings at 36
// degrees of latitude and two poles, 24 triangles, each corner's normal the ellipsoid's own there
function ball(W, cu, cn, cz, ru, rn, rz, col) {
  const cl = 0.81, sl = 0.59, at = (x, y, z) => ({ p: [cu + ru * x, cn + rn * y, cz + rz * z], n: [x / ru, y / rn, z / rz] });
  const T = at(0, 1, 0), B = at(0, -1, 0), U = [], L = [];
  for (let k = 0; k <= 6; k++) { const a = k * Math.PI / 3; U.push(at(cl * Math.cos(a), sl, cl * Math.sin(a))); L.push(at(cl * Math.cos(a), -sl, cl * Math.sin(a))); }
  const tri = (a, b, c) => W.triN(a.p, b.p, c.p, col, [a.n, b.n, c.n]);
  for (let k = 0; k < 6; k++) { tri(T, U[k], U[k + 1]); tri(U[k], U[k + 1], L[k + 1]); tri(U[k], L[k + 1], L[k]); tri(B, L[k], L[k + 1]); }
}
// (the first round's oval crown of round lumps is retired: the finishing round's leaf masses stand in its place)
const TRUNK = C('#4a3a2e');

// ---------------------------------------------------------------- NEAR THE WAY (the finishing round): RELIEF IN GEOMETRY
// THE RULE IS THE PLAN'S, never the eye's: a row is near the way when it fronts the promenade (both arcaded rows, the whole
// length the plan gives them), or faces the hinge line across an open place no deeper than the hinge square (that square's
// fronts; the row behind the entry's opened place). Everywhere else the recipes stand as they were.
const REV = 0.2;                        // a pane's set-back in its wall (0.15 to 0.25 m: a brick and a half less the sash)
// the facade program's own cells (the light's file: a cell 2.3 to 3.4 m, a pane 1.3 by 1.7 m from 0.95 m over its floor, the
// door's leaf to 2.3 m, its fanlight to 2.88 m): the wall is cut open where that program draws each pane
const PANE = { c: 2.6, k: 0.35, hw: 0.65, m: 0.22, y0: 0.95, y1: 2.65, dh: 2.3, fan: 2.88 };
const fr = (x) => x - Math.floor(x), marks = (W) => [W.f.len, W.k.len];
// what was written since the marks, its facade floats (s along the face, h up it, the face's width) written again by f; cls:
// its class (a level face is written plain: a reveal's sill and head take the wall's own class back)
function refac(W, m, cls, f) { const v = W.f.v, k = W.k.v; for (let i = m[0], j = m[1]; i < W.f.len; i += 4, j += 2) { f(v, i); if (cls) k[j] = cls; } }
const LIMEW = C('#efe6d4'), SHUT = ['#2f4a38', '#5a3026', '#3c4c5c', '#4a5540'].map(C), POT = C('#a5583c'), EAVE = C('#4a3b31');
// THE FRONT'S SKIN: the wall's own face REV proud of the panes' wall, in the SAME facade coordinates (so far off, under the
// footprint, skin and panes give one mean and the row reads as every other row), cut open at each pane and at the door: the
// wall's thickness shows, and each reveal carries the facade coordinates of its own pane's edge, so it takes that pane's glow when
// the pane is lit and stays dark when it is not. hA to hB: the face; off: what its cells' heights are written less (an
// arcade's upper floors); f0 to f1: its floors; door: whether its ground floor holds the door. H.ops: its openings.
function skin(W, P, H, cls, hA, hB, off, f0, f1, door) {
  const { w, seed, wall } = H, hw = w / 2, tP = H.d / 2, tS = tP + REV, nE = H.e - off;
  const nC = Math.max(1, Math.floor(w / PANE.c + PANE.k)), cw = w / nC, ph = Math.min(PANE.hw, 0.5 * cw - PANE.m), ow = ph + 0.05;
  const s32 = Math.fround(seed), dc = door ? Math.floor(fr(s32 * 3.77 + 0.61) * nC) : -1, fan = fr(s32 * 17.3 + 0.2) < 0.333;
  W.look(cls, seed, nE, 'all'); H.ops = []; H.ow = ow; H.cw = cw;
  const front = (r0, r1, n0, n1) => {
    if (r1 - r0 < 0.02 || n1 - n0 < 0.02) return;
    const m = marks(W); W.quad(P(r0, n0, tS), P(r1, n0, tS), P(r1, n1, tS), P(r0, n1, tS), wall, P(0, 0, 1));
    refac(W, m, 0, (v, i) => { v[i] += r0 + hw; v[i + 1] -= off; v[i + 2] = w; });
  };
  let rp = -hw;
  for (let c = 0; c <= nC; c++) {
    const xc = -hw + (c + 0.5) * cw;
    front(rp, c < nC ? xc - ow : hw, hA, hB);                 // the pier between two columns of openings
    if (c === nC) break;
    for (const sg of [-1, 1]) {                               // its two jambs, floor to eaves: the pane's own edge along each
      const rj = xc + sg * ow, m = marks(W); W.quad(P(rj, hA, tP), P(rj, hA, tS), P(rj, hB, tS), P(rj, hB, tP), wall, P(-sg, 0, 0));
      refac(W, m, 0, (v, i) => { v[i] = xc + hw + sg * (ph - 0.03); v[i + 1] -= off; v[i + 2] = w; });
    }
    let n0 = hA;
    for (let f = f0; f <= f1; f++) {
      const b = off + f * FLOOR, isDoor = f === 0 && c === dc;
      const o0 = isDoor ? hA : b + PANE.y0 - 0.05, o1 = isDoor ? (fan ? PANE.fan + 0.05 : PANE.dh + 0.03) : b + PANE.y1 + 0.05;
      front(xc - ow, xc + ow, n0, o0); n0 = o1; H.ops.push([xc, o0, o1, isDoor]);
      // the sill and the head of the reveal: the pane's foot (the door's head: its leaf's top, or its fanlight)
      const ys = isDoor ? (fan ? 2.6 : 2.2) : f * FLOOR + PANE.y0 + 0.04;
      for (const [n, up] of [[o0, 1], [o1, -1]]) {
        if (isDoor && up > 0) continue;
        const m = marks(W); W.quad(P(xc - ow, n, tP), P(xc + ow, n, tP), P(xc + ow, n, tS), P(xc - ow, n, tS), wall, P(0, up, 0));
        refac(W, m, cls, (v, i) => { v[i] = xc + hw; v[i + 1] = ys; v[i + 2] = w; });
      }
    }
    front(xc - ow, xc + ow, n0, hB); rp = xc + ow;
  }
  W.look(cls, seed, nE, 'none');                             // the skin's two returns (a higher house's shows over its neighbour)
  for (const sg of [-1, 1]) { const m = marks(W); W.quad(P(sg * hw, hA, tP), P(sg * hw, hA, tS), P(sg * hw, hB, tS), P(sg * hw, hB, tP), wall, P(sg, 0, 0)); refac(W, m, 0, (v, i) => { v[i + 1] -= off; }); }
}
// THE DRESSINGS of a front near the way, in pale stone or the wall's own lighter tone (the garden wall's class with no eaves
// line: bed joints every 0.3 m and the street's wash by its true height; level faces plain, so each underside is a shadow
// line): a cornice under the eaves (a band at a gable's foot), a string course at the first floor, a plinth course (an
// arcade's piers each on a plinth block), a sill to each pane, shutters beside the panes of one house in three, the door's
// surround and its step, the eaves' dark soffit, ridge tiles, one or two pots on the stack
function dress(W, P, X, H, rr, cls) {
  const { w, e, gab, seed, base } = H, hw = w / 2, hd = H.d / 2, tS = hd + REV, tn = Math.tan(H.pitch);
  const T = cls === 1 ? STONE : H.wall.clone().lerp(LIMEW, 0.45);   // brick is dressed in stone, a render in its own paler tone
  const band = (r0, r1, n0, n1, p, under = true, top = true) => {
    W.quad(P(r0, n0, tS + p), P(r1, n0, tS + p), P(r1, n1, tS + p), P(r0, n1, tS + p), T, P(0, 0, 1));
    if (under) W.quad(P(r0, n0, tS), P(r1, n0, tS), P(r1, n0, tS + p), P(r0, n0, tS + p), T, P(0, -1, 0));
    if (top) W.quad(P(r0, n1, tS), P(r1, n1, tS), P(r1, n1, tS + p), P(r0, n1, tS + p), T, P(0, 1, 0));
  };
  W.look(4, seed, 99);
  band(-hw, hw, e - 0.32, e, gab ? 0.14 : 0.22, true, gab);
  const s1 = H.arcade ? ARC_H : FLOOR; band(-hw, hw, s1 - 0.1, s1 + 0.16, 0.09);
  if (H.arcade) { for (const pr of H.piers) { const Q = X(pr - 0.58, pr + 0.58, hd - 1.08, hd + 0.08); W.box(Q[0], Q[1], base, 0.45, Q[2], Q[3], T); W.look(4, seed, 99); } }
  else band(-hw, hw, base, 0.55, 0.07, false, true);
  const SL = H.shut || SHUT, sh = fr(seed * 91.7) < 0.34 ? SL[Math.floor(fr(seed * 57.3) * SL.length)] : null, sw = Math.min(0.5, (H.cw - 2 * H.ow) / 2 - 0.04);
  for (const [xc, o0, o1, isDoor] of H.ops) {
    if (isDoor) {
      // the door's surround (two pilaster strips and a lintel, 0.1 m proud) and its step, 0.16 m high, 0.4 m deep
      for (const sg of [-1, 1]) W.quad(P(xc + sg * H.ow, 0, tS + 0.06), P(xc + sg * (H.ow + 0.18), 0, tS + 0.06), P(xc + sg * (H.ow + 0.18), o1, tS + 0.06), P(xc + sg * H.ow, o1, tS + 0.06), T, P(0, 0, 1));
      band(xc - H.ow - 0.24, xc + H.ow + 0.24, o1, o1 + 0.28, 0.1);
      const Q = X(xc - H.ow - 0.3, xc + H.ow + 0.3, hd, tS + 0.4); W.box(Q[0], Q[1], base, 0.16, Q[2], Q[3], T); W.look(4, seed, 99);
      continue;
    }
    band(xc - H.ow - 0.08, xc + H.ow + 0.08, o0 - 0.1, o0, 0.1, false, true);
    if (sh && sw > 0.3) for (const sg of [-1, 1]) W.quad(P(xc + sg * H.ow, o0, tS + 0.04), P(xc + sg * (H.ow + sw), o0, tS + 0.04), P(xc + sg * (H.ow + sw), o1, tS + 0.04), P(xc + sg * H.ow, o1, tS + 0.04), sh, P(0, 0, 1));
  }
  W.look(0);                                                 // the roof's underside past the skin, dark: the eaves' shadow line
  if (gab) { for (const sg of [-1, 1]) W.quad(P(sg * hw, e, tS), P(sg * hw, e, hd + H.over), P(0, rr, hd + H.over), P(0, rr, tS), EAVE, P(sg, -1, 0)); }
  else W.quad(P(-hw, e - REV * tn - 0.03, tS), P(hw, e - REV * tn - 0.03, tS), P(hw, e - H.over * tn - 0.03, hd + H.over), P(-hw, e - H.over * tn - 0.03, hd + H.over), EAVE, P(0, -1, 0.2));
  // RIDGE TILES (a roll 0.32 m wide, 0.1 m over the ridge, in the roof's own clay a little fresher); none on a hipped end
  const rc = H.roof.clone().multiplyScalar(1.22); W.look(cls, seed, e, 'none');
  if (gab) W.tri(P(-hw, e, tS), P(hw, e, tS), P(0, rr, tS), H.wall, P(0, 0, 1));    // (a gable front's own skin over its eaves' line)
  if (gab) for (const sg of [-1, 1]) W.quad(P(sg * 0.16, rr - 0.04, -hd), P(0, rr + 0.1, -hd), P(0, rr + 0.1, hd + H.over), P(sg * 0.16, rr - 0.04, hd + H.over), rc, P(sg, 1, 0));
  else if (!(H.first || H.last)) for (const sg of [-1, 1]) W.quad(P(-hw, rr - 0.04, sg * 0.16), P(-hw, rr + 0.1, 0), P(hw, rr + 0.1, 0), P(hw, rr - 0.04, sg * 0.16), rc, P(0, 1, sg));
  if (H.chimAt && H.chimC[2] + 0.45 <= H.cap) {
    // CHIMNEY POTS (never over the height rule): one, or two on one stack in two, 0.26 m square and 0.45 m tall, of terracotta
    const two = fr(seed * 33.1) < 0.5, q = H.chimC; W.look(1, seed, 99); H.top = q[2] + 0.45;
    for (const dr of two ? [-0.17, 0.17] : [0]) { const Q = X(q[0] + dr - 0.13, q[0] + dr + 0.13, q[1] - 0.13, q[1] + 0.13); W.box(Q[0], Q[1], q[2], q[2] + 0.45, Q[2], Q[3], POT); }
  }
}
// ---------------------------------------------------------------- TREES ARE TREES (the finishing round)
// A LEAF MASS: a round body of ten sides and three rings (60 triangles), every corner pushed in or out a tenth of its radius
// by its own die (a leafy outline, round close to), shaded smoothly from the mass's own centre; each corner's green warmed toward the lamps' light by
// how low it hangs in the crown and how far it faces down, cooled toward the sky's blue-green by how high it stands
const WARM = C('#c4b25a'), COOL = C('#2c4a3a'), LAT = [0.92, 0.22, -0.52];
function mass(W, c, r, R, lo, hi, col) {
  const ph = R() * 6.283, at = (x, y, z) => {
    const k = 0.9 + 0.2 * R(), p = [c[0] + r[0] * x * k, c[1] + r[1] * y * k, c[2] + r[2] * z * k], t = Math.min(1, Math.max(0, (p[1] - lo) / (hi - lo)));
    return { p, n: [x / r[0], y / r[1], z / r[2]], c: col.clone().lerp(WARM, Math.min(0.8, 0.65 * (1 - t) ** 1.5 + 0.35 * Math.max(0, -y))).lerp(COOL, 0.4 * t * Math.max(0, 0.4 + 0.6 * y)) };
  };
  const T = at(0, 1, 0), B = at(0, -0.8, 0), G = LAT.map((la, k) => { const o = []; for (let i = 0; i < 10; i++) { const a = ph + (i + 0.5 * (k % 2)) * Math.PI / 5; o.push(at(Math.cos(la) * Math.cos(a), Math.sin(la), Math.cos(la) * Math.sin(a))); } o.push(o[0]); return o; });
  const tri = (a, b, d) => W.triN(a.p, b.p, d.p, [a.c, b.c, d.c], [a.n, b.n, d.n]);
  for (let i = 0; i < 10; i++) {
    tri(T, G[0][i], G[0][i + 1]); tri(B, G[2][i], G[2][i + 1]);
    for (let k = 0; k < 2; k++) { tri(G[k][i], G[k][i + 1], G[k + 1][i]); tri(G[k][i + 1], G[k + 1][i + 1], G[k + 1][i]); }
  }
}
// A TREE NEAR THE WAY (a lime or a plane of the promenade's clumps and of the hinge square): a slender trunk of five sides,
// tapering, a limb to each lower mass, and a rounded, broken crown of leaf masses; its reach bounded in metres (no leaf more
// than 1.3 cr off the trunk), so a clump keeps the promenade's clear air. It sways by the kept law (the world's clock).
function leafTree(W, kind, H, R, lumps, cr) {
  const K = TREE_KINDS[kind], cb = H * K.base, tr = Math.max(0.11, H * 0.015), top = cb + (H - cb) * 0.32;
  for (let k = 0; k < 5; k++) {
    const a0 = k * 1.2566, a1 = a0 + 1.2566, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    W.quad([tr * c0, -0.6, tr * s0], [tr * c1, -0.6, tr * s1], [0.55 * tr * c1, top, 0.55 * tr * s1], [0.55 * tr * c0, top, 0.55 * tr * s0], TRUNK, [Math.cos(a0 + 0.63), 0, Math.sin(a0 + 0.63)]);
  }
  for (let i = 0; i < lumps; i++) {
    const d = [R(), R(), R(), R()], f = i / (lumps - 1), ang = i * 2.4 + d[0] * 1.2, off = i === 0 || i === lumps - 1 ? 0 : cr * 0.35 * (0.5 + 0.5 * d[1]);
    const rr = cr * (i === lumps - 1 ? 0.55 : 0.62 + 0.18 * d[2]), ch = cb + (H - cb) * (0.3 + 0.5 * f), cu = Math.cos(ang) * off, cz = Math.sin(ang) * off;
    mass(W, [cu, ch, cz], [rr, Math.min(rr * 0.85, (H - cb) * 0.22), rr], R, cb, H, C(K.cols[Math.floor(d[3] * K.cols.length)]));
    // a limb from the trunk's fork to a lower mass's heart (three sides; the upper masses hide their own)
    if (off > 0 && f < 0.6) for (let k = 0; k < 3; k++) {
      const a0 = k * 2.0944, a1 = a0 + 2.0944, q = 0.4 * tr;
      W.quad([q * Math.cos(a0), cb, q * Math.sin(a0)], [q * Math.cos(a1), cb, q * Math.sin(a1)], [cu + 0.5 * q * Math.cos(a1), ch, cz + 0.5 * q * Math.sin(a1)], [cu + 0.5 * q * Math.cos(a0), ch, cz + 0.5 * q * Math.sin(a0)], TRUNK, [Math.cos(a0 + 1.05), 0, Math.sin(a0 + 1.05)]);
    }
  }
}
// A TREE FAR OFF OR OVERHEAD: a trunk and ONE ROUND CROWN (the round lump of 24 triangles, shaded from its own centre: never
// a stack of boxes); a poplar's or a cypress's a tall spindle
function roundTree(W, kind, H, R) {
  const K = TREE_KINDS[kind], cr = H * K.crown, cb = H * K.base, d = [R(), R(), R()], col = C(K.cols[Math.floor(d[0] * K.cols.length)]);
  W.trunk(0, 0, -0.6, cb + (H - cb) * 0.4, Math.max(0.12, H * 0.02), TRUNK);
  if (K.narrow) ball(W, 0, cb + (H - cb) * 0.52, 0, cr * 1.15, (H - cb) * 0.5, cr * 1.15, col);
  else ball(W, (d[1] - 0.5) * cr * 0.3, cb + (H - cb) * 0.55, (d[2] - 0.5) * cr * 0.3, cr * 1.1, Math.min(cr, (H - cb) * 0.5), cr * 1.1, col);
}
// ---------------------------------------------------------------- A TOWER, PLAIN ON EVERY FACE (the second finishing pass)
// ONE BRICK and nothing of a second tone anywhere on it: no pale base, band, sill, cornice or lit jamb, so no face of it can
// read as striped, on the shaft or at the belfry's end. s square, H high, and never a flat sheet: ITS RELIEF IS THE SAME
// BRICK: a plinth 3.6 m high and 0.4 m proud under a weathering slope; a pilaster 1 m wide and 0.3 m proud up each corner;
// two lesenes 0.5 m wide and 0.18 m proud up each face, a third of the face apart; a string course 0.35 m high to each 8 m
// or so of shaft (the last under the belfry or the cornice) and one dark stair slit, 0.3 by 1.4 m, in each stage's middle
// panel; a cornice of two brick steps; a low pyramid roof of tile. bell (towers A and B): a belfry stage of ONE round-headed
// opening a face (brick, opening, brick: a single opening in a plain wall), its sill 1.3 m up, its jambs and soffit of the
// wall's own brick and unlit, the chamber's wall 0.8 m behind it a dim ember (a lamp by the bells, far inside). The tower
// houses are the same routine with no belfry. No clock, no letter, no flag. Flooded as the kept shaft was (class 6).
const SLIT = C('#1a1614'), EMBER = C('#7a4a26'), BELL = C('#ffb468');   // (BELL: a wall lantern's glass)
function plainTower(W, s, H, bell) {
  const h = s / 2, pt = 3.6, top = H - 2.4, y0 = bell ? top - 7.0 : top, T = BRICK_T, n = Math.max(2, Math.round((y0 - pt) / 8));
  const ow = s * 0.15, ys = top - 1.1 - ow, sill = y0 + 1.3, dp = 0.8, xl = s / 6;
  const M = [(x, n, o) => [x, n, o], (x, n, o) => [o, n, -x], (x, n, o) => [-x, n, -o], (x, n, o) => [-o, n, x]];
  // a sloped or level face kept in the wall's class; y: a level face's own height over the ground (the flood's fall with height
  // is read from it, as on the wall beside it: no strip of another light under a ledge)
  const as6 = (f, y) => { const k = marks(W); f(); refac(W, k, 6, (v, i) => { if (y != null) v[i + 1] = y; }); };
  for (const m of M) {
    const q = (x0, x1, n0, n1, o, col) => W.quad(m(x0, n0, o), m(x1, n0, o), m(x1, n1, o), m(x0, n1, o), col, m(0, 0, 1));
    W.look(6, 0, y0);
    q(-h - 0.4, h + 0.4, -1.3, pt, h + 0.4, T);
    as6(() => W.quad(m(-h - 0.4, pt, h + 0.4), m(h + 0.4, pt, h + 0.4), m(h, pt + 0.5, h), m(-h, pt + 0.5, h), T, m(0, 1, 1)));
    q(-h, h, pt, y0, h, T);
    for (const c of [-xl, xl]) {
      q(c - 0.25, c + 0.25, pt, y0, h + 0.18, T);
      for (const sg of [-1, 1]) W.quad(m(c + sg * 0.25, pt, h), m(c + sg * 0.25, pt, h + 0.18), m(c + sg * 0.25, y0, h + 0.18), m(c + sg * 0.25, y0, h), T, m(sg, 0, 0));
    }
    for (let b = 0; b < n; b++) { const yc = pt + (y0 - pt) * (b + 0.5) / n; W.look(0); q(-0.15, 0.15, yc - 0.7, yc + 0.7, h + 0.02, SLIT); }
    W.look(6, 0, y0);
    if (!bell) continue;
    q(-h, -ow, y0, top, h, T); q(ow, h, y0, top, h, T); q(-ow, ow, y0, sill, h, T);
    for (let i = 0; i < 6; i++) {
      const x0 = -ow + i * ow / 3, x1 = x0 + ow / 3, a0 = ys + Math.sqrt(Math.max(0, ow * ow - x0 * x0)), a1 = ys + Math.sqrt(Math.max(0, ow * ow - x1 * x1));
      W.quad(m(x0, a0, h), m(x1, a1, h), m(x1, top, h), m(x0, top, h), T, m(0, 0, 1));
      as6(() => W.quad(m(x0, a0, h), m(x1, a1, h), m(x1, a1, h - dp), m(x0, a0, h - dp), T, m(-(x0 + x1) / 2, -1, 0)));
    }
    for (const sg of [-1, 1]) W.quad(m(sg * ow, sill, h), m(sg * ow, sill, h - dp), m(sg * ow, ys, h - dp), m(sg * ow, ys, h), T, m(-sg, 0, 0));
    as6(() => W.quad(m(-ow, sill, h), m(ow, sill, h), m(ow, sill, h - dp), m(-ow, sill, h - dp), T, m(0, 1, 0)), sill);
    W.look(7, 1.05); q(-ow, ow, sill, ys + ow, h - dp, EMBER);
  }
  W.look(6, 0, y0);
  for (const [cu, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) walls4(W, cu > 0 ? h - 0.7 : -h - 0.3, cu > 0 ? h + 0.3 : -h + 0.7, pt, top, cz > 0 ? h - 0.7 : -h - 0.3, cz > 0 ? h + 0.3 : -h + 0.7, T);
  for (let k = 1; k <= n; k++) { const y = pt + (y0 - pt) * k / n - 0.35; as6(() => W.box(-h - 0.36, h + 0.36, y, y + 0.35, -h - 0.36, h + 0.36, T, true), y); }
  as6(() => W.box(-h - 0.4, h + 0.4, top, top + 0.5, -h - 0.4, h + 0.4, T, true), top); as6(() => W.box(-h - 0.65, h + 0.65, top + 0.5, top + 0.9, -h - 0.65, h + 0.65, T, true), top);
  W.look(6, 0, y0); W.pyramid(-h - 0.65, h + 0.65, -h - 0.65, h + 0.65, top + 0.9, 1.5, ROOFS[4]);
}
// THE ONLY FURNITURE OF THIS FILE (the second finishing pass: on open paving nothing small stands alone; no post, bollard,
// tub, box, table or stall anywhere): A STONE BENCH, a slab 2 m by 0.5 m on two blocks, of the pale stone of the wall it
// stands against (a clump's kerb wall); al: 0 its length runs along u, 1 along z
function bench(W, al) { const B = (u0, u1, n0, n1, z0, z1) => (al ? W.box(z0, z1, n0, n1, u0, u1, STONE, true) : W.box(u0, u1, n0, n1, z0, z1, STONE, true)); W.look(4, 0.3, 99); B(-1, 1, 0.42, 0.54, -0.25, 0.25); B(-0.8, -0.6, -0.4, 0.42, -0.2, 0.2); B(0.6, 0.8, -0.4, 0.42, -0.2, 0.2); }
// ---------------------------------------------------------------- THE LAW OF BODIES (the third pass)
// NO HOUSE OF THE ROLLED HALF STANDS THROUGH, OR WITHIN ONE METRE OF, A HOUSE OF THE FLAT HALF OR OF A KERB ROW (the arcaded
// rows on the promenade's two kerbs). The kerb rows and the flat half stand first; a house of the roll whose body would
// meet one of theirs is LEFT OUT (its dice drawn all the same, so its neighbours do not change). No typed place: the test is
// of the bodies themselves, in the world: a body's cross-section (its span along a and from base to top, carried by the
// bend's own frames, a point each 3 m of a; a flat body's is its rectangle) against the other's, and their spans of z.
const EDGE_M = 2;                       // metres of land beyond a body's far side, along a and along z (the lead's order of 04:37)
const CLEAR = 1;                        // metres of open air between such bodies (the lead's rule of the third pass)
const _b4 = new Float64Array(4);
function section(K, B) {
  if (B.aC < 0) return [[B.x + B.sa0, B.y + B.base], [B.x + B.sa1, B.y + B.base], [B.x + B.sa1, B.y + B.top], [B.x + B.sa0, B.y + B.top]];
  const a0 = B.aC + B.sa0, a1 = B.aC + B.sa1, n = Math.max(1, Math.ceil((a1 - a0) / 3)), P = [];
  for (let i = 0; i <= n; i++) { const f = bendFrame(K, a0 + (a1 - a0) * i / n, _b4); P.push([f[0] - B.base * f[3], f[1] + B.base * f[2]]); }
  for (let i = n; i >= 0; i--) { const f = bendFrame(K, a0 + (a1 - a0) * i / n, _b4); P.push([f[0] - B.top * f[3], f[1] + B.top * f[2]]); }
  return P;
}
const pSeg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.min(1, Math.max(0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
const inPoly = (p, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > p[1]) !== (P[j][1] > p[1]) && p[0] < (P[j][0] - P[i][0]) * (p[1] - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
const turn = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
// the open air between two sections (0 where they touch, cross or one holds the other)
function sectionGap(P, Q) {
  if (inPoly(P[0], Q) || inPoly(Q[0], P)) return 0;
  let d = Infinity;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length];
    for (let j = 0; j < Q.length; j++) {
      const c = Q[j], e = Q[(j + 1) % Q.length];
      if (turn(a, b, c) * turn(a, b, e) < 0 && turn(c, e, a) * turn(c, e, b) < 0) return 0;
      d = Math.min(d, pSeg(a, c, e), pSeg(c, a, b));
    }
  }
  return d;
}
// a body's shape in the world, and the open air between two shapes (0: they touch or one stands through the other)
export function bodyShape(K, B) {
  const P = section(K, B), S = { P, z0: B.zC + B.sz0, z1: B.zC + B.sz1, x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  for (const q of P) { S.x0 = Math.min(S.x0, q[0]); S.x1 = Math.max(S.x1, q[0]); S.y0 = Math.min(S.y0, q[1]); S.y1 = Math.max(S.y1, q[1]); }
  return S;
}
export function shapeGap(A, B, far = Infinity) {
  const gz = Math.max(A.z0 - B.z1, B.z0 - A.z1, 0);
  if (gz >= far || A.x0 - B.x1 >= far || B.x0 - A.x1 >= far || A.y0 - B.y1 >= far || B.y0 - A.y1 >= far) return far;
  return Math.hypot(sectionGap(A.P, B.P), gz);
}
const DORMERS = true;                   // (the order of work: dormers only when every zone's rows stand; section 15 cuts them here)
export async function makeTown(ctx, { bend, plan, pal, materials }) {
  const group = new THREE.Group(); group.name = 'closing-town';
  const count = {}, tris = {}; for (const z of ZONES) { count[z] = 0; tris[z] = 0; }
  const bodies = [], chimneys = [], meshes = [], stats = { cured: 0, alike: 0, stopped: 0, met: 0, metWorst: CLEAR, left: [] };
  const rng = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
  const FX = plan.flat ? plan.flat.x0 : 56;                  // the promenade's right-hand kerb: f = FX - x stands for a
  const HW = [], HA = []; for (let b = 0; b < 6; b++) { HW.push(new Writer(false, true)); HA.push([]); }   // the curl's soft rows, by the land's six bands
  const FW = new Writer(false, false);                       // the flat town's rows (world space, anchors -1)
  const FN = new Writer(false, false);                       // the flat promenade's arcaded row, near the way (its own mesh: no step over 50 ms)
  let step = 0; const tick = async (n = 1) => { if ((step += n) >= 16) { step = 0; await ctx.yield(); } };   // 16 houses or trees a step (one near the way counts as five)
  const feed = (x, k) => { let i = 0; return () => (i++ ? k : x); };
  // THE LAW OF BODIES: the standing shapes of the kerb rows and of the flat half, kept by cells of 32 m of z (a house is
  // under 12 m of z: it reads its own cell and the two beside it); gapTo: the least open air from a shape to any of them
  // NOTHING STANDS WHERE THE LAND IS NOT (the order after the third pass; a law of bodies, no typed place): every body this
  // file builds on the roll is tested at its own place against THE LAND'S FREE EDGE over its own span of z: the core's L(z)
  // and, where the plan cuts the land inside it, the plan's own edge (brink.edgeA), the lesser of the two at the span's ends
  // and middle, EDGE_M beyond it each way. A body whose far side would come within EDGE_M of that edge is LEFT OUT (stats.off,
  // by kind); a wall's or a hedge's run is CUT BACK to where it holds (stats.cut; what is left under a metre is left out).
  const eA = plan.brink && plan.brink.edgeA, edgeAt = (z) => (eA ? Math.min(Lz(z), eA(z)) : Lz(z));
  const landTo = (z0, z1) => Math.min(edgeAt(z0 - EDGE_M), edgeAt((z0 + z1) / 2), edgeAt(z1 + EDGE_M));
  stats.off = { house: 0, wall: 0, hedge: 0, shed: 0, barn: 0, tree: 0, other: 0 }; stats.cut = { wall: 0, hedge: 0 }; stats.offList = [];
  const onLand = (kind, a, ha, z0, z1) => { if (a + ha + EDGE_M <= landTo(z0, z1)) return true; stats.off[kind]++; stats.offList.push({ kind, a, ha, z0, z1 }); return false; };
  const clipRun = (p, q, half) => {
    const at = (t) => [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])], ok = (t) => { const c = at(t); return c[0] + half + EDGE_M <= landTo(c[1] - half, c[1] + half); };
    const o0 = ok(0), o1 = ok(1);
    if (o0 && o1) return ok(0.5) ? [p, q, false] : null;
    if (!o0 && !o1) return null;
    let lo = o0 ? 0 : 1, hi = o0 ? 1 : 0; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
    const c = o0 ? [p, at(lo)] : [at(lo), q];
    return Math.hypot(c[1][0] - c[0][0], c[1][1] - c[0][1]) < 1 ? null : [c[0], c[1], true];
  };
  const KN = bendKnots(B0), STOOD = new Map(), cellOf = (z) => Math.floor(z / 32);
  const stand = (B) => { const S = bodyShape(KN, B); for (let c = cellOf(S.z0); c <= cellOf(S.z1); c++) { if (!STOOD.has(c)) STOOD.set(c, []); STOOD.get(c).push(S); } };
  const gapTo = (B) => { const S = bodyShape(KN, B); let g = CLEAR; for (let c = cellOf(S.z0 - CLEAR); c <= cellOf(S.z1 + CLEAR); c++) for (const Q of STOOD.get(c) || []) g = Math.min(g, shapeGap(S, Q, CLEAR)); return g; };

  const SHUTS = pal && pal.shut ? pal.shut.map((h) => C(h).multiplyScalar(0.8)) : null;   // the mix's own shutter colours, a little deepened
  // NEAR THE WAY, the plan's rule: the arcaded rows from end to end (to the ring and past it, as the plan's rows run), and a
  // row along the way whose FRONT stands on the far edge of an OPEN PLACE that lies on the hinge line: the hinge square's
  // paving, and the entry's opened place (plan.squares.entry, when the plan names one: its paving, or itself)
  const SQ = plan.squares || {}, OPEN = [SQ.hinge && (SQ.hinge.paved || SQ.hinge), SQ.entry && (SQ.entry.paved || SQ.entry)].filter((Q) => Q && Q.a1 > Q.a0 && Q.z1 > Q.z0);
  // ONE TERRACE. T: { id, zone (whose count), rec (whose recipe), ax ('z' | 'a'), s0, s1 (the run along its axis), tF (the
  // front's line across it), fs (the front's outward sign across), d (depth), arcade, flat, plinth }
  async function terrace(T) {
    const R = rng('closing-row-' + T.id), rec = T.rec, len = T.s1 - T.s0, z = T.ax === 'z';
    if (len < 2.5) return;                                    // (no run of the plan is so short: a guard)
    const ws = fronts(R, len, rec.f[0], rec.f[1]);
    let s = T.s0, fl = rec.fl[0] + Math.floor(R() * (rec.fl[1] - rec.fl[0] + 1)), prev = '', prevWall = null;
    for (let i = 0; i < ws.length; i++) {
      const w = ws[i], D = []; for (let k = 0; k < 11; k++) D.push(R());      // every die of the house, drawn before any test
      const rC = s + w / 2, tC = T.tF - T.fs * T.d / 2, aC = z ? tC : rC, zC = z ? rC : tC; s += w;
      if (count[T.zone] >= RECIPE[T.zone].most) { stats.stopped++; continue; }
      fl = Math.min(rec.fl[1], Math.max(rec.fl[0], fl + Math.floor(D[0] * 3) - 1));     // the bounded walk: one floor a step
      const aLow = aC - (z ? T.d : w) / 2, low = !T.flat && aLow < 60;                 // the height rule's first reach
      let gab = D[1] < rec.gable, wall = wallColour(feed(D[3], D[4]), pal);
      const pitch = Math.min(low ? 30 : 90, rec.pitch[0] + D[2] * (rec.pitch[1] - rec.pitch[0])) * DEG;
      const ch = D[6] < rec.chim ? (low ? 1.6 : 1.6 + 0.8 * D[7]) : 0, cap = T.flat ? 99 : capAt(aLow);
      const rise = () => (gab ? w : T.d) / 2 * Math.tan(pitch);
      // a knee of plain wall, 0 to 0.8 m, over the top floor (no two houses' storeys are quite alike; none under the first cap)
      const knee = low || T.arcade ? 0 : 0.8 * ((D[8] * 7.13) % 1);
      let n = fl, e = 0;
      for (;;) { e = T.arcade ? ARC_H + (n - 1) * FLOOR : n * FLOOR + knee; if (e + rise() + ch <= cap || n <= 2) break; n--; }
      // NEVER TWO NEIGHBOURS ALIKE in eaves and roof kind and colour: cured by a fixed step (the next roof kind; where the
      // recipe has one kind only, the next colour of the wall's own family), never by a redraw
      let key = e + '|' + gab + '|' + wall.getHexString();
      if (key === prev) {
        stats.cured++;
        if (rec.gable > 0 && rec.gable < 1) { gab = !gab; if (e + rise() + ch > cap) e -= FLOOR; }
        else wall = wallColour(feed(D[3], (D[4] + 0.26) % 1), pal);
        key = e + '|' + gab + '|' + wall.getHexString();
        if (key === prev) stats.alike++;                      // (counted, and printed on seeds 1 to 40: none)
      }
      // NEAR THE WAY (the plan's rule, above skin()): and there no two neighbours wear one colour (the same fixed step)
      const near = !!T.arcade || (!T.flat && z && T.fs < 0 && OPEN.some((Q) => Math.abs(T.tF - Q.a1) < 1 && zC > Q.z0 && zC < Q.z1));
      if (near && wall === prevWall) { wall = wallColour(feed(D[3], (D[4] + 0.26) % 1), pal); if (wall === prevWall) wall = wallColour(feed(D[3], (D[4] + 0.52) % 1), pal); key = e + '|' + gab + '|' + wall.getHexString(); }
      prev = key; prevWall = wall;
      const ends = i === 0 || i === ws.length - 1;            // (a run's hipped end carries none: its slope is cut by the hip)
      const dorm = DORMERS && rec.dormer && !gab && !T.arcade && !ends && D[10] < rec.dormer ? (rec.dormer < 0.5 ? 1 : Math.floor(D[10] * 6)) : 0;   // 0 to 2 on one house in two
      // THE LAW OF BODIES: a house of the roll (not a kerb row's) that would stand through or within CLEAR of a standing house
      // of a kerb row or of the flat half is left out (every die of it is drawn above; counted, and kept for the proof)
      const kerb = !!T.arcade, ha = (z ? T.d : w) / 2, hz = (z ? w : T.d) / 2;
      if (!T.flat && !onLand('house', aC, ha, zC - hz, zC + hz)) continue;   // (nothing stands where the land is not)
      if (!kerb && !T.flat) {
        const Q = { aC, zC, sa0: -ha, sa1: ha, sz0: -hz, sz1: hz, base: T.plinth ? -3 : 0, top: e + rise() + ch }, g = gapTo(Q);
        if (g < CLEAR) { stats.met++; stats.metWorst = Math.min(stats.metWorst, g); stats.left.push(Q); continue; }
      }
      let W, flo = T.fs;
      if (T.flat) { W = T.arcade ? FN : FW; W.body(-1, 0, { x: FX - aC, y: PLAN.Y0, z: zC, yaw: 0 }); flo = -T.fs; }   // (du runs to +x there: the front's sign turns)
      else { W = HW[bandOf(zC)]; W.body(aC, zC); }
      const H = { ax: T.ax, fl: flo, w, d: T.d, e, pitch, gab, wall, roof: ROOFS[Math.floor(D[5] * ROOFS.length)], seed: 0.002 + 0.996 * D[8],
        base: -1.3, first: i === 0, last: i === ws.length - 1, arcade: !!T.arcade, near, cap, shut: SHUTS, plinth: T.plinth ? RUBBLE[Math.floor(D[9] * 3)] : null, ch, cpos: D[9], dorm };
      const t0 = W.tris, rr = house(W, H), arc = H.arcade && T.zone !== 'promenade' ? H.arc1 - H.arc0 : 0;
      tris[T.zone] += W.tris - t0 - arc; tris.promenade += arc; count[T.zone]++;     // (the curl's arcades count on the promenade's line)
      const top = Math.max(rr + ch, H.top || 0);
      const B = { aC: T.flat ? -1 : aC, zC, sa0: -ha, sa1: ha, sz0: -hz, sz1: hz, base: T.plinth ? -3 : 0, top, soft: !T.flat, house: true, kerb };
      if (T.flat) { B.x = FX - aC; B.y = PLAN.Y0; B.z = zC; } else HA[bandOf(zC)].push({ a: aC, z: zC, radius: Math.hypot(ha, hz, top) + 3 });
      bodies.push(B); if (kerb || T.flat) stand(B);
      if (H.chimAt) { const q = H.chimAt; chimneys.push(T.flat ? { a: -1, x: FX - aC + q[0], y: PLAN.Y0 + q[1], z: zC + q[2], top: q[1] } : { a: aC + q[0], z: zC + q[2], top: q[1] }); }
      await tick(near ? 5 : 1);
    }
  }
  // A GARDEN WALL between two points of the land (soft) or of the flat town: rubble (class 4), h high, 0.45 m thick
  const GR = rng('closing-gardenwall');
  function gwall(zone, flat, p, q, h, foot = 1.2, lean = false, arch = false, hedge = null, dice = GR) {
    const d1 = dice(), d2 = dice(), kind = hedge ? 'hedge' : 'wall';   // (its dice, drawn before the land's test)
    if (!flat) {
      const c = clipRun(p, q, hedge ? 0.55 : 0.3);
      if (!c) { stats.off[kind]++; stats.offList.push({ kind, a: Math.max(p[0], q[0]), ha: 0.3, z0: Math.min(p[1], q[1]), z1: Math.max(p[1], q[1]) }); return; }
      if (c[2]) { stats.cut[kind]++; p = c[0]; q = c[1]; }
    }
    const aA = (p[0] + q[0]) / 2, zA = (p[1] + q[1]) / 2, W = flat ? FW : HW[bandOf(zA)], t0 = W.tris;
    if (flat) W.body(-1, 0, { x: aA, y: PLAN.Y0, z: zA, yaw: 0 }); else W.body(aA, zA);
    if (hedge) W.look(0); else W.look(4, d1, h);
    if (lean) {
      // (between two terraces its ends stand inside their walls: two long faces and the top, 6 triangles)
      const col = RUBBLE[Math.floor(d2 * 3)], u0 = p[0] - aA, u1 = q[0] - aA, w0 = p[1] - zA, w1 = q[1] - zA, t = 0.225;
      if (arch && Math.abs(u1 - u0) > 5 && h > 2.8) {
        // A YARD'S WALL ARCHED (near the way, by the plan: the yard's near edge within 50 m of the hinge line or of the flat
        // kerb): a round-headed gateway in its middle, 2.2 m wide, sprung 1.5 m up (its crown 2.6 m, under the wall's 3 m), the
        // wall's whole thickness shown in its jambs and its soffit of six pieces; the yard is seen through it
        const lo = Math.min(u0, u1), hi = Math.max(u0, u1), um = (lo + hi) / 2, g = 1.1, ys = 1.5, arc = (x) => ys + Math.sqrt(Math.max(0, g * g - (x - um) ** 2));
        for (const sg of [-1, 1]) {
          W.quad([lo, -foot, sg * t], [um - g, -foot, sg * t], [um - g, h, sg * t], [lo, h, sg * t], col, [0, 0, sg]);
          W.quad([um + g, -foot, sg * t], [hi, -foot, sg * t], [hi, h, sg * t], [um + g, h, sg * t], col, [0, 0, sg]);
          W.quad([um + sg * g, -foot, -t], [um + sg * g, -foot, t], [um + sg * g, ys, t], [um + sg * g, ys, -t], col, [-sg, 0, 0]);
        }
        for (let i = 0; i < 6; i++) {
          const x0 = um - g + i * g / 3, x1 = x0 + g / 3, y0 = arc(x0), y1 = arc(x1);
          for (const sg of [-1, 1]) W.quad([x0, y0, sg * t], [x1, y1, sg * t], [x1, h, sg * t], [x0, h, sg * t], col, [0, 0, sg]);
          const m = marks(W); W.quad([x0, y0, -t], [x1, y1, -t], [x1, y1, t], [x0, y0, t], col, [um - (x0 + x1) / 2, -1, 0]); refac(W, m, 4, () => {});
        }
        W.quad([lo, h, -t], [hi, h, -t], [hi, h, t], [lo, h, t], col, [0, 1, 0]);
      } else if (Math.abs(u1 - u0) > Math.abs(w1 - w0)) {
        for (const sg of [-1, 1]) W.quad([u0, -foot, sg * t], [u1, -foot, sg * t], [u1, h, sg * t], [u0, h, sg * t], col, [0, 0, sg]);
        W.quad([u0, h, -t], [u1, h, -t], [u1, h, t], [u0, h, t], col, [0, 1, 0]);
      } else {
        for (const sg of [-1, 1]) W.quad([sg * t, -foot, w0], [sg * t, -foot, w1], [sg * t, h, w1], [sg * t, h, w0], col, [sg, 0, 0]);
        W.quad([-t, h, w0], [t, h, w0], [t, h, w1], [-t, h, w1], col, [0, 1, 0]);
      }
    } else segWall(W, aA, zA, p, q, h, hedge ? 1.1 : 0.45, hedge || RUBBLE[Math.floor(d2 * 3)], foot);
    tris[zone] += W.tris - t0;
    const ha = Math.abs(q[0] - p[0]) / 2 + 0.3, hz = Math.abs(q[1] - p[1]) / 2 + 0.3;
    const B = { aC: flat ? -1 : aA, zC: zA, sa0: -ha, sa1: ha, sz0: -hz, sz1: hz, base: -foot, top: h, soft: !flat, [kind]: true };
    if (flat) { B.x = aA; B.y = PLAN.Y0; B.z = zA; } else HA[bandOf(zA)].push({ a: aA, z: zA, radius: Math.hypot(ha, hz, h) + foot });
    bodies.push(B);
  }

  // THE KERB ROWS AND THE FLAT HALF STAND FIRST (the law of bodies; every row draws from its own stream, so the order
  // changes no die): the roll's arcaded kerb row, wherever the plan lays a block on the slab strip, then the flat town
  const onKerb = (B) => !B.single && B.rows !== 'a' && B.a0 <= SLAB_A + 0.5;
  for (const B of plan.blocks || []) if (onKerb(B)) {
    const zone = zoneAt((B.a0 + B.a1) / 2), id = Math.round(B.a0) + '-' + Math.round(B.z0), d = (B.a1 - B.a0 - (B.yard || 0)) / 2;
    await terrace({ id: id + '-0', zone, rec: RECIPE.promenade, ax: 'z', s0: B.z0, s1: B.z1, tF: B.a0, fs: -1, d, arcade: true });
  }
  await ctx.yield();
  // THE FLAT TOWN'S BLOCKS (the same routine underfoot): rows along z; the block on the promenade's kerb gives its first
  // terrace, arcaded, to the promenade's line
  for (const B of (plan.flat && plan.flat.blocks) || []) {
    const f0 = FX - B.x1, f1 = FX - B.x0, prom = f0 < 0.5, d = Math.min(11, (f1 - f0) / 2), id = 'f' + Math.round(B.x0) + '-' + Math.round(B.z0);
    await terrace({ id: id + '-0', zone: prom ? 'promenade' : 'flat', rec: prom ? RECIPE.promenade : RECIPE.flat, ax: 'z', s0: B.z0, s1: B.z1, tF: f0, fs: -1, d, arcade: prom, flat: true });
    await terrace({ id: id + '-1', zone: 'flat', rec: RECIPE.flat, ax: 'z', s0: B.z0, s1: B.z1, tF: f1, fs: 1, d, flat: true });
    if (f1 - f0 > 2 * d + 1) for (const zm of [B.z0 + 0.3, B.z1 - 0.3]) gwall('flat', true, [B.x0 + d, zm], [B.x1 - d, zm], 3.0, 1.2, true, FX - (B.x1 - d) < 50);
  }
  await ctx.yield();
  // THE CURL'S BLOCKS (the plan's): two terraces back to back along z with a yard between (the first block has none and its
  // first row, on the slab strip, is the promenade's arcaded row), or TURNED A QUARTER on the ceiling: two terraces along a
  // fronting the cross streets, a court between them closed by a garden wall 2.2 m high at each end
  for (const B of plan.blocks || []) {
    const zone = zoneAt((B.a0 + B.a1) / 2), id = Math.round(B.a0) + '-' + Math.round(B.z0);
    if (B.single) {
      // a lone terrace (the hanging square's two): the block's whole depth, its front on the side the plan names
      const f = B.faces > 0 ? 1 : -1;
      await terrace({ id: id + '-s', zone, rec: RECIPE[zone], ax: 'z', s0: B.z0, s1: B.z1, tF: f > 0 ? B.a1 : B.a0, fs: f, d: B.a1 - B.a0 });
    } else if (B.rows !== 'a') {
      const d = (B.a1 - B.a0 - (B.yard || 0)) / 2, prom = onKerb(B);   // (a kerb block's first row stands already, above)
      if (!prom) await terrace({ id: id + '-0', zone, rec: RECIPE[zone], ax: 'z', s0: B.z0, s1: B.z1, tF: B.a0, fs: -1, d });
      await terrace({ id: id + '-1', zone, rec: RECIPE[zone], ax: 'z', s0: B.z0, s1: B.z1, tF: B.a1, fs: 1, d });
      // a yard's two mouths on the cross streets, each closed by a wall 3 m high (the first critic's 14), 0.3 m inside the fronts
      if (B.yard > 1 && B.yard < 12) for (const zm of [B.z0 + 0.3, B.z1 - 0.3]) gwall(zone, false, [B.a0 + d, zm], [B.a1 - d, zm], 3.0, 1.2, true, B.a0 + d < 50);
    } else {
      const d = Math.min(11, (B.z1 - B.z0) / 2);              // a terrace's depth (section 4)
      await terrace({ id: id + '-0', zone, rec: RECIPE[zone], ax: 'a', s0: B.a0, s1: B.a1, tF: B.z0, fs: -1, d });
      await terrace({ id: id + '-1', zone, rec: RECIPE[zone], ax: 'a', s0: B.a0, s1: B.a1, tF: B.z1, fs: 1, d });
      if (B.z1 - B.z0 > 2 * d + 1) for (const am of [B.a0 + 0.3, B.a1 - 0.3]) gwall(zone, false, [am, B.z0 + d], [am, B.z1 - d], 2.2, 1.2, true);
    }
  }
  await ctx.yield();
  // THE BRINK ROW (section 4), a house thick: terraces along z with their BACKS ON THE CUT (the back wall 0.4 m past it, so no
  // ground shows past a wall), each on its plinth; where the cut steps by more than a house's depth and a least front, a row
  // along a stands on the step's riser, its back on it; a walled garden or a belvedere closes the other slots
  const BR = plan.brink || {}, slots = BR.slots || [], D11 = 11;
  // (where the plan lays a RIM STREET beyond the built line, the row's back stands on paving, not on the land's edge: no
  // plinth under it, and the walls' footing is the common 1.2 m; the parapet on the edge is the core's)
  const EDGE = !BR.rim, FOOT = EDGE ? 3 : 1.2;
  for (let i = 0; i < slots.length; i++) {
    const S = slots[i], c = BR.cutA((S.z0 + S.z1) / 2), N = slots[i + 1] || (BR.steps && BR.steps[0]);
    if (S.kind === 'house') await terrace({ id: 'b' + S.z0, zone: 'brink', rec: RECIPE.brink, ax: 'z', s0: S.z0, s1: S.z1, tF: c + 0.4 - D11, fs: -1, d: D11, plinth: EDGE });
    else {
      // a garden's wall 2.2 m, a belvedere's parapet 1.1 m: on the cut, with the plinth's 3 m footing, and returned to the row's front
      const h = S.kind === 'garden' ? 2.2 : 1.1;
      gwall('brink', false, [c + 0.2, S.z0], [c + 0.2, S.z1], h, FOOT);
      for (const zm of [S.z0 + 0.25, S.z1 - 0.25]) gwall('brink', false, [c + 0.4 - D11, zm], [c + 0.2, zm], h, FOOT);
      if (S.kind === 'garden') gwall('brink', false, [c + 0.4 - D11, S.z0], [c + 0.4 - D11, S.z1], h);
    }
    if (!N) continue;
    const cn = BR.cutA((N.z0 + N.z1) / 2), least = D11 + RECIPE.brink.f[0] / 2;
    if (c - cn > least) await terrace({ id: 'br' + S.z1, zone: 'brink', rec: RECIPE.brink, ax: 'a', s0: cn + 0.4, s1: c + 0.4 - D11, tF: S.z1 + 0.4 - D11, fs: -1, d: D11, plinth: EDGE });
    if (cn - c > least) await terrace({ id: 'br' + S.z1, zone: 'brink', rec: RECIPE.brink, ax: 'a', s0: c + 0.4, s1: cn + 0.4 - D11, tF: S.z1 - 0.4 + D11, fs: 1, d: D11, plinth: EDGE });
  }
  // THE FAR TAPER'S STEPS (the plan's, a house deep each): a row along a on each, its back 0.4 m past the step's far end, its
  // last gable 0.4 m past the cut
  for (const S of BR.steps || []) if (S.a1 - S.a0 > 2.5) await terrace({ id: 'bs' + S.z0, zone: 'brink', rec: RECIPE.brink, ax: 'a', s0: S.a0 + 0.4, s1: S.a1 + 0.4, tF: S.z0 + 0.4, fs: -1, d: S.z1 - S.z0, plinth: EDGE });
  await ctx.yield();
  // LANDMARKS (section 4), RIGID on their anchors' axes, each at a typed place of the plan: bell tower B and the church in
  // the hanging square, the tower houses, a basin fountain in each square (curl); bell tower A (flat, with the rows)
  const LW = new Writer(false, false), LA = [], S = plan.sites || {}, RL = rng('closing-landmarks');
  const mark = (W, t0, a, z, ha, hz, top, x) => {
    tris.landmarks += W.tris - t0; count.landmarks++;
    const B = { aC: x == null ? a : -1, zC: z, sa0: -ha, sa1: ha, sz0: -hz, sz1: hz, base: 0, top, soft: false };
    if (x == null) LA.push({ a, z, radius: Math.hypot(ha, hz, top) + 2 }); else { B.x = x; B.y = PLAN.Y0; B.z = z; }
    bodies.push(B);
  };
  const towerAt = (s, bell) => { if (!onLand('other', s.a, s.w / 2 + 0.65, s.z - s.w / 2 - 0.65, s.z + s.w / 2 + 0.65)) return; const t0 = LW.tris; LW.body(s.a, s.z); plainTower(LW, s.w, s.h, !!bell); mark(LW, t0, s.a, s.z, s.w / 2 + 0.65, s.w / 2 + 0.65, s.h); };
  if (S.towerB && S.towerB.h) towerAt(S.towerB, true);
  for (const s of S.towerHouses || []) towerAt(s);
  if (S.church && S.church.h) {
    // THE HALL (the third pass: NO TALL PANE, BAR OR BAND ON ANY BUILDING): plain brick as the houses' (class 1), no tower:
    // the kept row house at the site's size, every face in the houses' own small panes (1.3 by 1.7 m) in rows by its floors
    const s = S.church, t0 = LW.tris; LW.body(s.a, s.z);
    const rr = rowHouse(LW, s.w, s.d, s.h, (s.pitch || 50) * DEG, s.d >= s.w ? 'z' : 'u', BRICK, ROOFS[1], 0, -1.3, { cls: 1, seed: 0.002 + 0.996 * RL(), open: 'all' });
    mark(LW, t0, s.a, s.z, s.w / 2, s.d / 2, rr);
  }
  for (const s of S.fountains || []) {
    // A BROAD LOW BASIN (the plan gives its place): twelve-sided, 8 m across or the site's own width if that is more, its
    // rim 0.6 m high under a coping 0.5 m broad (a seat's breadth: the rim is the square's bench), calm water 0.15 m under
    // the coping, LIT from under; in its middle a SQUARE PIER of the basin's own stone, 1.4 m square, 1.55 m over the water,
    // under a flat cap. No column, no ball, no figure; nothing stands about it on the paving.
    const t0 = LW.tris, r = Math.max(8, s.w || 0) / 2, ri = r - 0.5, q12 = Math.PI / 6; LW.body(s.a, s.z);
    for (let k = 0; k < 12; k++) {
      const c0 = Math.cos(k * q12), s0 = Math.sin(k * q12), c1 = Math.cos((k + 1) * q12), s1 = Math.sin((k + 1) * q12), nm = [c0 + c1, 0, s0 + s1];
      LW.look(4, 0.6, 99); LW.quad([r * c0, -0.4, r * s0], [r * c1, -0.4, r * s1], [r * c1, 0.6, r * s1], [r * c0, 0.6, r * s0], STONE, nm);
      LW.quad([ri * c0, 0.3, ri * s0], [ri * c1, 0.3, ri * s1], [ri * c1, 0.6, ri * s1], [ri * c0, 0.6, ri * s0], STONE, [-nm[0], 0, -nm[2]]);
      LW.look(0); LW.quad([r * c0, 0.6, r * s0], [r * c1, 0.6, r * s1], [ri * c1, 0.6, ri * s1], [ri * c0, 0.6, ri * s0], STONE, [0, 1, 0]);
      LW.look(7, 1.5); const m = marks(LW); LW.tri([0, 0.45, 0], [ri * c0, 0.45, ri * s0], [ri * c1, 0.45, ri * s1], WATER, [0, 1, 0]); refac(LW, m, 7, () => {});
    }
    LW.look(4, 0.6, 99); walls4(LW, -0.7, 0.7, 0.4, 2.0, -0.7, 0.7, STONE); LW.box(-0.85, 0.85, 2.0, 2.25, -0.85, 0.85, STONE, true);
    mark(LW, t0, s.a, s.z, r, r, 2.25);
  }
  // (the street's end holds nothing of this file: its parapet, seats and lanterns are the world file's)
  const put = (a, z, f, top, r) => { if (!onLand('other', a, r, z - r, z + r)) return; const t0 = LW.tris; LW.body(a, z); f(LW); mark(LW, t0, a, z, r, r, top); };
  const PF = plan.flat;
  const TA0 = plan.flat && plan.flat.towerA;
  if (TA0 && TA0.h) { const t0 = FW.tris; FW.body(-1, 0, { x: TA0.x, y: PLAN.Y0, z: TA0.z, yaw: 0 }); plainTower(FW, TA0.w, TA0.h, true); mark(FW, t0, -1, TA0.z, TA0.w / 2 + 0.65, TA0.w / 2 + 0.65, TA0.h, TA0.x); }
  // THE OUTSKIRTS (section 4): a garden wall 2.2 m high behind the flat town's last row, 6 m out, broken at each cross street
  { const FB = (plan.flat && plan.flat.blocks) || []; let xm = Infinity; for (const B of FB) xm = Math.min(xm, B.x0);
    for (const B of FB) if (B.x0 === xm) gwall('flat', true, [xm - 6, B.z0], [xm - 6, B.z1], 2.2); }
  await ctx.yield();

  // TREES (section 4), rigid, each on its own ground's normal, swaying by the kept law. EVERY KIND HAS A STREAM OF ITS OWN
  // (closing-trees-(kind); where a kind is dealt block by block or square by square, one stream a block or a square): no
  // kind's count or places hang on another's deal, and every tree's own dice are drawn before any test. NO EVEN FILE
  // ANYWHERE (the second finishing pass): each kind of mine stands in CLUMPS of two to five, 3 to 7 m apart inside a clump
  // (each gap its own), with open ground of unlike length between clumps. The promenade's trees stand exactly where the
  // plan says (the world file lays a pit at each). NEAR THE WAY BY THE PLAN (within 60 m of the promenade's middle line: x
  // on the flat, a under NEAR_A on the land beside it) a crown is several leaf masses on limbs, and so are the limes of every square, hanging or not (a square's clumps are its
  // landmark); farther off, one round crown.
  const TW = [new Writer(true), new Writer(true), new Writer(true)], TA = [[], [], []], TF = new Writer(true);
  const HEDGE = ['#34492c', '#2f4428', '#3b4f30'].map(C);   // a clipped hedge's greens (plain: class 0)
  const XM = PF ? (PF.x0 + PF.x1) / 2 : 73, NEAR_A = 60 - ((PF ? PF.x1 : 90) - XM), TREES_MOST = 2400;   // (a guard, counted in stats.stopped: it binds on no seed)
  async function plant(R, a, z, kind, H, x, masses) {
    const d = [R(), R()];
    if (count.trees >= TREES_MOST) { stats.stopped++; return false; }
    const k = TREE_KINDS[kind] ? kind : 'nettle', flat = x != null, W = flat ? TF : TW[bandOf(z) >> 1], t0 = W.tris;
    const near = flat ? Math.abs(x - XM) < 60 : a < NEAR_A, lumps = masses || (near ? (H > 8 ? 4 + Math.floor(d[1] * 2) : 3) : 0);   // (masses: a place's own order, near the way or not)
    const sw = { H, k: Math.min(1.6, H / 14), phase: d[0] * 6.283 };
    if (flat) W.body(-1, 0, { x, y: PLAN.Y0, z, yaw: 0 }, sw); else W.body(a, z, null, sw);
    const cr = Math.min(0.28 * H, 4.0);                      // a leaf-massed crown's radius: 4 m at most (its reach 5 m)
    const r = lumps ? 1.3 * cr : H * TREE_KINDS[k].crown * 1.5;
    if (!flat && !onLand('tree', a, r, z - r, z + r)) return false;   // (nothing stands where the land is not: its crown's reach)
    if (lumps) leafTree(W, k, H, R, lumps, cr); else roundTree(W, k, H, R);
    tris.trees += W.tris - t0; count.trees++;
    const B = { aC: flat ? -1 : a, zC: z, sa0: -r, sa1: r, sz0: -r, sz1: r, base: 0, top: H, soft: false, tree: true };
    if (flat) { B.x = x; B.y = PLAN.Y0; B.z = z; } else TA[bandOf(z) >> 1].push({ a, z, radius: H + 2 });
    bodies.push(B); await tick(lumps ? 8 : 1); return true;
  }
  // ONE RUN'S CLUMPS (s0 to s1 along it): each a list of two to five places i0 to i1 m apart, then g0 to g1 m of open ground;
  // a clump cut to one tree by the run's end is left out
  const clumps = (R, s0, s1, g0, g1, i0 = 3, i1 = 7) => {
    const out = [];
    for (let s = s0 + 0.5 * (g0 + (g1 - g0) * R()); s < s1;) {
      const n = 2 + Math.floor(R() * 4), c = [];
      for (let k = 0; k < n && s < s1; k++) { c.push(s); s += i0 + (i1 - i0) * R(); }
      if (c.length > 1) out.push(c);
      s += g0 + (g1 - g0) * R();
    }
    return out;
  };
  // the plan's own on the flat: the promenade's (crowns of 5 to 7 masses), and the outskirts' poplars and cypresses taken
  // from the plan's row as clumps of two to five of its places with one to three of them left bare between
  { const Rp = rng('closing-trees-promenade'), Ro = rng('closing-trees-outskirts'); let keep = 2 + Math.floor(Ro() * 4), skip = 0;
    for (const t of (PF && PF.trees) || []) {
      if (t.where === 'promenade') { await plant(Rp, -1, t.z, t.kind, t.h, t.x, 5 + Math.floor(Rp() * 3)); continue; }
      if (skip > 0) { skip--; if (!skip) keep = 2 + Math.floor(Ro() * 4); continue; }
      await plant(Ro, -1, t.z, t.kind, t.h, t.x); if (!--keep) skip = 1 + Math.floor(Ro() * 3);
    } }
  // limes 9 to 12 m in the ceiling's courts (a court with a tower house in its middle holds none); pears 5 to 7 m in the
  // yards, within a metre of the yard's middle line (the plan lays their earth there)
  for (const B of plan.blocks || []) {
    if (B.single) continue;
    const id = Math.round(B.a0) + '-' + Math.round(B.z0);
    if (B.rows === 'a') {
      const court = B.z1 - B.z0 - 22; if (court < 9 || B.tower) continue;
      const R = rng('closing-trees-court-' + id);
      for (const c of clumps(R, B.a0 + 4, B.a1 - 4, 18, 52)) for (const a of c) await plant(R, a, (B.z0 + B.z1) / 2 + (R() - 0.5) * (court - 9), 'lime', 9 + 3 * R());
    } else if (B.yard >= 6) {
      const R = rng('closing-trees-yard-' + id);
      for (const c of clumps(R, B.z0 + 4, B.z1 - 4, 22, 64)) for (const z of c) await plant(R, (B.a0 + B.a1) / 2 + (R() - 0.5) * 2, z, 'pear', 5 + 2 * R());
    }
  }
  for (const B of (PF && PF.blocks) || []) if (B.x1 - B.x0 > 26) {
    const R = rng('closing-trees-flatyard-' + Math.round(B.x0) + '-' + Math.round(B.z0));
    for (const c of clumps(R, B.z0 + 5, B.z1 - 5, 40, 110)) for (const z of c) await plant(R, -1, z, 'pear', 5 + 2 * R(), (B.x0 + B.x1) / 2 + (R() - 0.5) * 2);
  }
  // LIMES IN THE TWO SQUARES (section 4): clumps along the square's length about a line seven tenths across it, each tree
  // set off that line by its own die (2 m at most); none within 6 m of a string of bulbs, nor within 9 m of a landmark's walls
  const strings = plan.strings || [], sites = [S.towerB, S.church, ...(S.fountains || []), ...(S.towerHouses || [])].filter((q) => q && q.a != null);
  const clear = (a, z) => {
    for (const q of sites) if (Math.abs(a - q.a) < (q.w || 0) / 2 + 9 && Math.abs(z - q.z) < (q.d || q.w || 0) / 2 + 9) return false;
    for (const g of strings) {
      if (g.a0 < 0 || g.a1 < 0) continue;                    // (the flat promenade's own strings)
      const da = g.a1 - g.a0, dz = g.z1 - g.z0, t = Math.min(1, Math.max(0, ((a - g.a0) * da + (z - g.z0) * dz) / (da * da + dz * dz || 1)));
      if (Math.hypot(a - g.a0 - t * da, z - g.z0 - t * dz) < 6) return false;
    }
    return true;
  };
  for (const [name, Q] of Object.entries(plan.squares || {})) {
    if (!(Q && Q.a1 > Q.a0 && Q.z1 > Q.z0)) continue;
    // (a square of uneven outline: its two fronts at a tree's own z, the narrowest within a crown's reach of it, 4.5 m)
    const span = (z) => { let a0 = Q.a0, a1 = Q.a1; const o = Q.outline || {}; for (const sg of o.near || []) if (z + 4.5 >= sg.z0 && z - 4.5 <= sg.z1) a0 = Math.max(a0, sg.front); for (const sg of o.far || []) if (z + 4.5 >= sg.z0 && z - 4.5 <= sg.z1) a1 = Math.min(a1, sg.front); return [a0, a1]; };
    const R = rng('closing-trees-square-' + name), byWay = name === 'hinge';
    for (const c of clumps(R, Q.z0 + 8, Q.z1 - 8, 16, 40, 4.5, 8)) {
      const bed = [];
      const set = c.map((z) => { const [q0, q1] = span(z); return { a: q0 + 0.7 * (q1 - q0) + (2 * R() - 1) * Math.min(2, 0.08 * (q1 - q0)), z, H: 9 + 3 * R() }; }).filter((t) => clear(t.a, t.z));   // (a clump cut to one tree by a landmark or a string is left out)
      if (set.length > 1) for (const t of set) if (await plant(R, t.a, t.z, 'lime', t.H, undefined, 5)) bed.push([t.a, t.z]);
      // A KERB WALL about each clump of the hinge square's limes (a raised bed's kerb of stone, 0.45 m high, 0.4 m thick, 1.7 m
      // off its outermost trunks across the square and 2 m past its first and last), and A BENCH with its back on the middle
      // of each long side of that wall: the only seats on the square's paving, none standing alone
      if (byWay && bed.length > 1) {
        const a0 = Math.min(...bed.map((p) => p[0])) - 1.7, a1 = Math.max(...bed.map((p) => p[0])) + 1.7, z0 = Math.min(...bed.map((p) => p[1])) - 2, z1 = Math.max(...bed.map((p) => p[1])) + 2;
        const ac = (a0 + a1) / 2, zc = (z0 + z1) / 2, t0 = LW.tris, P4 = [[a0, z0], [a1, z0], [a1, z1], [a0, z1]];
        LW.body(ac, zc); LW.look(4, 0.4, 99);
        for (let i = 0; i < 4; i++) segWall(LW, ac, zc, P4[i], P4[(i + 1) % 4], 0.45, 0.4, STONE, 0.4);
        mark(LW, t0, ac, zc, (a1 - a0) / 2 + 0.2, (z1 - z0) / 2 + 0.2, 0.45);
        for (const ab of [a0 - 0.47, a1 + 0.47]) put(ab, zc, (W) => bench(W, 1), 0.54, 1);
      }
    }
  }
  // THE ENTRY'S SMALL PLACE (the second finishing pass; the plan's opened place at the first wide street's mouth), dressed
  // beside the street's run and never in it (the street is seen climbing from the promenade): A BED OF LIMES (two to four,
  // 4.5 to 6.5 m apart, leaf masses) in a stone kerb, its long side along the way, six tenths across the place from the
  // hinge line, ITS END 3 m FROM THE WIDE STREET'S KERB (the clump marks the street's mouth) and running back from it; on the middle of the kerb's side toward the promenade A WALL FOUNTAIN: a stone wall 2.8 m wide, 2.3 m high and
  // 0.45 m thick under a coping, a trough 2.2 by 0.9 m before it (its rim 0.6 m high, its water lit), a dark spout niche, and
  // A WALL LANTERN on an iron bracket by each end of the wall; a bench with its back on the kerb each side of the fountain
  // where the bed is 12 m long, else on the kerb's far side. Nothing of it stands alone on the paving.
  const EN = SQ.entry;                                       // (the place itself: its paving runs on over the streets about it)
  if (EN && EN.a1 - EN.a0 >= 10 && EN.z1 - EN.z0 >= 12) {
    const R = rng('closing-entry');
    // the place's longer part along z clear of every wide cross street that runs through it (a metre's margin)
    let z0 = EN.z0, z1 = EN.z1;
    for (const c of plan.cross || []) if (c.wide && c.aStart <= EN.a0 + 1 && c.z1 > z0 && c.z0 < z1) { if (c.z0 - z0 >= z1 - c.z1) z1 = c.z0 - 1; else z0 = c.z1 + 1; }
    const room = z1 - z0 - 6, n = Math.min(4, Math.max(2, Math.floor(room / 5.5)));
    if (room >= 6) {
      const line = EN.a0 + 0.6 * (EN.a1 - EN.a0), gaps = []; for (let k = 1; k < n; k++) gaps.push(4.5 + 2 * R());
      // (the street's mouth: the wide cross street that bounds the place's clear part, within 2 m of its end; with none the bed
      // stands in the middle)
      let mouth = 0; for (const c of plan.cross || []) if (c.wide && c.aStart <= EN.a0 + 1) { if (Math.abs(c.z0 - z1) <= 2) mouth = 1; else if (!mouth && Math.abs(c.z1 - z0) <= 2) mouth = -1; }
      const len = gaps.reduce((s, g) => s + g, 0), zs = mouth > 0 ? z1 - 5 - len : mouth < 0 ? z0 + 5 : (z0 + z1) / 2 - len / 2, bed = []; let zt = zs;
      for (let k = 0; k < n; k++) { const a = line + (2 * R() - 1) * 0.8, H = 8 + 1.5 * R(); if (await plant(R, a, zt, 'lime', H)) bed.push([a, zt]); zt += gaps[k] || 0; }   // (young limes, 8 to 9.5 m: under the eaves of the fronts about the place, 10.4 m)
      const a0 = line - 2.5, a1 = line + 2.5, b0 = zs - 2, b1 = zs + len + 2, ac = line, zc = (b0 + b1) / 2, t0 = LW.tris, P4 = [[a0, b0], [a1, b0], [a1, b1], [a0, b1]];
      LW.body(ac, zc); LW.look(4, 0.4, 99);
      for (let i = 0; i < 4; i++) segWall(LW, ac, zc, P4[i], P4[(i + 1) % 4], 0.45, 0.4, STONE, 0.4);
      // the wall fountain, on the kerb's line (u: toward the land; the promenade lies toward -u)
      const u1 = -2.3, u0 = u1 - 0.45;
      LW.look(4, 0.55, 99); LW.box(u0, u1, -0.4, 2.3, -1.4, 1.4, STONE); LW.box(u0 - 0.08, u1 + 0.08, 2.3, 2.45, -1.48, 1.48, STONE, true);
      LW.look(4, 0.55, 99); LW.box(u0 - 0.9, u0, -0.4, 0.6, -1.1, 1.1, STONE);
      LW.look(7, 1.5); { const k = marks(LW); LW.quad([u0 - 0.72, 0.61, -0.92], [u0 - 0.06, 0.61, -0.92], [u0 - 0.06, 0.61, 0.92], [u0 - 0.72, 0.61, 0.92], WATER, [0, 1, 0]); refac(LW, k, 7, () => {}); }
      LW.look(0); LW.quad([u0 - 0.02, 0.95, -0.16], [u0 - 0.02, 0.95, 0.16], [u0 - 0.02, 1.5, 0.16], [u0 - 0.02, 1.5, -0.16], SLIT, [-1, 0, 0]);
      for (const sg of [-1, 1]) {
        LW.look(0); LW.box(u0 - 0.42, u0, 1.98, 2.04, sg * 1.15 - 0.025, sg * 1.15 + 0.025, EAVE);
        LW.look(7, 2.6); LW.box(u0 - 0.55, u0 - 0.27, 1.55, 1.97, sg * 1.15 - 0.14, sg * 1.15 + 0.14, BELL, true);
      }
      mark(LW, t0, ac, zc, 3.9, (b1 - b0) / 2 + 0.2, 2.45);
      if (b1 - b0 >= 12) for (const sg of [-1, 1]) put(a0 - 0.47, zc + sg * 3.6, (W) => bench(W, 1), 0.54, 1);
      else put(a1 + 0.47, zc, (W) => bench(W, 1), 0.54, 1);
    }
  }
  // THE PARKS (the plan's: one on the flank, one on the ceiling): every tree at the plan's own place, leaf-massed (a park's
  // clumps are a landmark of the hanging town), and the park's HEDGE, 1.4 m high, 0.8 m inside its four edges, open 4 m at
  // each gate where a path of the plan meets it; pieces of 12 m at most
  { const R = rng('closing-trees-park');
    for (const Q of SQ.parks || []) {
      if (!(Q.a1 > Q.a0 && Q.z1 > Q.z0)) continue;
      for (const t of Q.trees || []) await plant(R, t.a, t.z, t.kind, t.h, undefined, 4);
      const col = HEDGE[Math.floor(R() * 3)], gates = { a: [], z: [] };
      for (const p of Q.paths || []) { if (p.z0 <= Q.z0 + 1 && p.z1 >= Q.z1 - 1) gates.a.push((p.a0 + p.a1) / 2); else gates.z.push((p.z0 + p.z1) / 2); }
      const runs = (lo, hi, g) => { const out = []; let s = lo; for (const m of g.slice().sort((x, y) => x - y)) { if (m - 2 > s) out.push([s, m - 2]); s = m + 2; } if (hi > s) out.push([s, hi]); return out.flatMap(([p, q]) => { const o = []; for (let v = p; v < q - 0.5; v += 12) o.push([v, Math.min(q, v + 12)]); return o; }); };
      for (const zE of [Q.z0 + 0.8, Q.z1 - 0.8]) for (const [p, q] of runs(Q.a0 + 0.8, Q.a1 - 0.8, gates.a)) gwall(zoneAt((Q.a0 + Q.a1) / 2), false, [p, zE], [q, zE], 1.4, 1.2, false, false, col);
      for (const aE of [Q.a0 + 0.8, Q.a1 - 0.8]) for (const [p, q] of runs(Q.z0 + 0.8, Q.z1 - 0.8, gates.z)) gwall(zoneAt((Q.a0 + Q.a1) / 2), false, [aE, p], [aE, q], 1.4, 1.2, false, false, col);
    } }
  // THE OPENED KERB (the third pass; the plan's kerbOpen: on the roll's side no house of the kerb row stands from the way's
  // start to the fountain place, so the land is seen leaving the kerb and climbing): a low garden wall of rubble on the
  // plan's wall line (the plan's height, 1.2 m at most), BED BY BED: one piece along each of the plan's kerb gardens
  // (kerbOpen.beds: its own span of z and no more), so no wall lies across a street's mouth or on the entry place's paving;
  // its dice from a stream of its own (no other wall's deal hangs on the beds' count); and the plan's own trees, leaf-massed
  // (they stand by the way), each where the plan lays its bed. Nothing else stands there.
  { const KO = plan.kerbOpen, R = rng('closing-trees-kerbopen'), RW = rng('closing-kerbopen-wall');
    if (KO && KO.z1 > KO.z0) {
      const wl = KO.wall, am = wl ? (wl.a0 + wl.a1) / 2 : 0, h = wl ? Math.min(1.2, wl.h || 1.1) : 0;
      if (wl) for (const b of KO.beds || []) if (b.z1 > b.z0) gwall('promenade', false, [am, b.z0], [am, b.z1], h, 1.2, false, false, null, RW);
      for (const t of KO.trees || []) await plant(R, t.a, t.z, t.kind || 'lime', t.h || 9, undefined, 4);
    } }
  // THE SMALL SQUARES' LIMES (the plan's place for each): the plan's tree and one companion 3.5 to 5 m from it toward the
  // square's middle (along z where the tree stands on the middle): a pair, never a lone ball
  { const R = rng('closing-trees-small');
    for (const Q of (plan.squares && plan.squares.small) || []) {
      const t = Q.tree, d = [R(), R(), R()]; if (!t) continue;
      const ca = (Q.a0 + Q.a1) / 2 - t.a, cz = (Q.z0 + Q.z1) / 2 - t.z, L = Math.hypot(ca, cz), g = 3.5 + 1.5 * d[0];
      await plant(R, t.a, t.z, t.kind || 'lime', t.h || 10, undefined, 4);
      await plant(R, t.a + (L > 1 ? ca / L : 0) * g, t.z + (L > 1 ? cz / L : d[1] < 0.5 ? -1 : 1) * g, t.kind || 'lime', (t.h || 10) * (0.75 + 0.2 * d[2]), undefined, 4);
    } }
  // THE RIM'S GARDENS END AS OUTSKIRTS DO: clumps of pears between the lane and the garden's far wall (2.5 m and more inside
  // it; none within 4.5 m of the shed's line) and a shed on that wall in the slot's middle (3.2 by 4.5 m, eaves 2.2 m, of
  // the wall's rubble, blind)
  for (const G of slots) if (G.kind === 'garden') {
    const c = BR.cutA((G.z0 + G.z1) / 2), zm = (G.z0 + G.z1) / 2, R = rng('closing-trees-rim-' + Math.round(G.z0));
    for (const cl of clumps(R, G.z0 + 3, G.z1 - 3, 7, 18, 3, 6)) { const set = cl.map((z) => ({ a: c - 2.5 - 6 * R(), z, H: 5 + 2 * R() })).filter((t) => Math.abs(t.z - zm) > 4.5); if (set.length > 1) for (const t of set) await plant(R, t.a, t.z, 'pear', t.H); }
    if (!onLand('shed', c - 2.2, 1.6, zm - 2.25, zm + 2.25)) continue;
    const W = HW[bandOf(zm)], t0 = W.tris; W.body(c - 2.2, zm);
    const top = rowHouse(W, 3.2, 4.5, 2.2, 30 * DEG, 'z', RUBBLE[1], ROOFS[4], 0, -1.3, { cls: 4, seed: 0.5, open: 'none' });
    tris.brink += W.tris - t0; HA[bandOf(zm)].push({ a: c - 2.2, z: zm, radius: 6 });
    bodies.push({ aC: c - 2.2, zC: zm, sa0: -1.6, sa1: 1.6, sz0: -2.25, sz1: 2.25, base: 0, top, soft: true, shed: true });
  }
  await ctx.yield();
  // THE OUTSKIRTS (the second finishing pass; the plan's fields beyond the town's last streets, on the roll and on the flat):
  // every field closes its own low-z and hinge-side edges, 0.8 m inside them (so each shared edge is closed once): a hedge
  // 1.5 m high and 1.1 m thick about a field or an orchard, a rubble wall 1.3 m about garden plots; pieces of 12 m at most
  // along a (each rides its own ground), of 36 m along z. AN ORCHARD holds the plan's own trees, taken as clumps of two to five
  // of its list with one to three left out between (never a rank whole); PLOTS hold a shed by a corner and one
  // clump; A FIELD holds a low blind barn of rubble (7 by 12 m, eaves 3.4 m) by its hedged corner on one field in three, with
  // a clump of walnuts beside it. No house, no figure, no cart.
  const outs = (O, flat) => {
    // (an orchard's trees on the roll: THE PLAN'S CLIPPED LIST, plan.outskirts.trees, those of it that stand in the field;
    // never the field's own unclipped one)
    const list = [], PT = (O && O.trees) || []; let i = 0;
    for (const f of (O && O.fields) || []) list.push({ i: i++, kind: f.kind, z0: f.z0, z1: f.z1, a0: flat ? f.f0 : f.a0, a1: flat ? f.f1 : f.a1, trees: flat || f.kind !== 'orchard' ? [] : PT.filter((t) => { const ta = t.a != null ? t.a : t.u; return ta >= f.a0 && ta <= f.a1 && t.z >= f.z0 && t.z <= f.z1; }) });
    return list.filter((f) => f.a1 - f.a0 > 6 && f.z1 - f.z0 > 6);
  };
  for (const flat of [false, true]) for (const f of outs(flat ? PF && PF.outskirts : plan.outskirts, flat)) {
    const R = rng('closing-outskirts-' + (flat ? 'f' : '') + f.i), U = (a) => (flat ? FX - a : a), plots = f.kind === 'plots';
    const h = plots ? 1.3 : 1.5, col = plots ? null : HEDGE[Math.floor(R() * 3)], aE = f.a0 + 0.8, zE = f.z0 + 0.8, zone = flat ? 'flat' : 'brink';
    for (let a = f.a0; a < f.a1 - 0.5; a += 12) gwall(zone, flat, [U(a), zE], [U(Math.min(f.a1, a + 12)), zE], h, 1.2, false, false, col);
    for (let z = f.z0; z < f.z1 - 0.5; z += 36) gwall(zone, flat, [U(aE), z], [U(aE), Math.min(f.z1, z + 36)], h, 1.2, false, false, col);
    const d = [R(), R(), R(), R()], la = f.a1 - f.a0, lz = f.z1 - f.z0, kindT = f.kind === 'orchard' ? 'pear' : plots ? 'quince' : 'walnut';
    const KH = TREE_KINDS[kindT].H, grove = async (ac, zc, n) => {
      const set = []; for (let k = 0; k < n; k++) { const a = ac + (R() - 0.5) * 9, z = zc + (R() - 0.5) * 9, H = KH[0] + (KH[1] - KH[0]) * R(); if (a > f.a0 + 3 && a < f.a1 - 3 && z > f.z0 + 3 && z < f.z1 - 3) set.push({ a, z, H }); }
      if (set.length > 1) for (const t of set) await plant(R, flat ? -1 : t.a, t.z, kindT, t.H, flat ? U(t.a) : undefined);
    };
    if (f.kind === 'orchard') {
      // THE PLAN'S OWN TREES on the roll (the flat orchards' stand in plan.flat.trees, planted above), never its ranks whole:
      // two to five of its list planted, then one to three left out, each count its own die
      let keep = 2 + Math.floor(R() * 4), skip = 0;
      if (!flat) for (const t of f.trees) { if (skip > 0) { if (!--skip) keep = 2 + Math.floor(R() * 4); continue; } await plant(R, t.a != null ? t.a : t.u, t.z, t.kind, t.h); if (!--keep) skip = 1 + Math.floor(R() * 3); }
      continue;
    }
    if (!plots && d[0] > 0.34) continue;
    if (la < 22 || lz < 26) continue;
    // the shed or the barn: 5 m (a shed 3 m) inside the field's hedged corner, its ridge along z; the clump beyond it
    const bw = plots ? 3.2 : 7, bl = plots ? 4.5 : 12, e = plots ? 2.2 : 3.4, ba = f.a0 + (plots ? 3 : 5) + bw / 2, bz = f.z0 + (plots ? 3 : 5) + bl / 2;
    if (!flat && !onLand(plots ? 'shed' : 'barn', ba, bw / 2, bz - bl / 2, bz + bl / 2)) continue;   // (and its clump with it)
    const W = flat ? FW : HW[bandOf(bz)], t0 = W.tris; if (flat) W.body(-1, 0, { x: U(ba), y: PLAN.Y0, z: bz, yaw: 0 }); else W.body(ba, bz);
    const top = rowHouse(W, bw, bl, e, (28 + 10 * d[1]) * DEG, 'z', RUBBLE[Math.floor(d[2] * 3)], ROOFS[Math.floor(d[3] * ROOFS.length)], 0, -1.3, { cls: 4, seed: 0.1 + 0.8 * d[1], open: 'none' });
    tris[zone] += W.tris - t0;
    const B = { aC: flat ? -1 : ba, zC: bz, sa0: -bw / 2, sa1: bw / 2, sz0: -bl / 2, sz1: bl / 2, base: 0, top, soft: !flat, [plots ? 'shed' : 'barn']: true };
    if (flat) { B.x = U(ba); B.y = PLAN.Y0; B.z = bz; } else HA[bandOf(bz)].push({ a: ba, z: bz, radius: Math.hypot(bw, bl, top) });
    bodies.push(B);
    await grove(ba + bw / 2 + 6, bz + bl / 2 + 2, 2 + Math.floor(R() * 3));
  }
  await ctx.yield();


  // THE MESHES: the curl's rows in the land's six bands, each in its sweep sphere (soft vertices carry no place of their own:
  // never a sphere computed from them); the flat town's rows in their own
  const mk = (W, mats, sphere, name) => {
    if (!W.tris) return;
    const g = W.geometry(); if (sphere) g.boundingSphere = sphere; else g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mats ? mats.colour : undefined); if (mats && mats.depth) m.customDepthMaterial = mats.depth;
    m.name = name; group.add(m); meshes.push(m);
  };
  const M = materials || {};
  for (let b = 0; b < 6; b++) { mk(HW[b], M.house, sweepSphere(HA[b]), 'closing-rows-' + (b + 1)); await ctx.yield(); }
  mk(FW, M.house, null, 'closing-flat-rows'); await ctx.yield();
  mk(FN, M.house, null, 'closing-flat-near'); await ctx.yield();
  mk(LW, M.house, sweepSphere(LA), 'closing-landmarks'); await ctx.yield();
  for (let i = 0; i < 3; i++) { mk(TW[i], M.tree, sweepSphere(TA[i]), 'closing-trees-' + (i + 1)); await ctx.yield(); }   // (a step a mesh)
  mk(TF, M.tree, null, 'closing-flat-trees');
  // (the depth material of each pair this part hung on its meshes is freed here too: the core hooks no listener to it; a
  // second call by the pair's maker is harmless)
  const dispose = () => { for (const m of meshes) { m.geometry.dispose(); if (m.customDepthMaterial) m.customDepthMaterial.dispose(); } };
  return { group, count, tris, bodies, chimneys, stats, dispose };
}
