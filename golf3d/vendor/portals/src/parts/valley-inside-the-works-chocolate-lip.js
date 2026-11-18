// valley-inside-the-works, the chocolate: THE FALL'S FORM (the numbers and laws the sheet and its foot are built by).
// The upper river comes down its bed at the bed's own width; where the rock opens into the notch it fills the notch
// from wall to wall, is drawn down a little, and turns over without a break: a long gentle shoulder (a round of 5 m),
// then a broad roll (2.2 m) that carries it out past the rock's edge, and then it FALLS IN AN ARC: it leaves at 65
// degrees, as round as the roll, and curves over toward plumb, so that by mid-height its face stands about 1.9 m out
// from the rock and at the pool about 2.5 m. Across the lip the chocolate gathers into five TONGUES of unequal width and weight, which
// NECK IN as they fall, and the whole sheet draws together (the notch is 16 m wide; the brow that goes over the rock's
// edge is narrower by its two shallow margins, which end on the sill; under 12 m at the pool); it thins as it
// falls. Between the tongues lie thin WEBS that tear open on the wet rock behind, and outside the outer tongues a
// thin EDGE that goes from the outside inward all the way down: the sheet's two sides are ragged and slant inward. In the
// windows and beside the sheet a few strands hang free, each ending in a drop. Where a tongue lands the pool is laid
// with low folds.
import * as P from './valley-inside-the-works-plan.js';
import { smooth, LIFT } from './valley-inside-the-works-chocolate-river.js';

export const POOL_Y = P.riverY(P.FALL_Z + 1) + LIFT;
// THE ROCK the fall leaves (the meadow's scar; its numbers as the lead gave them): the notch's floor lies at the upper
// river's bed from the scar's back edge to the wall behind the fall, from x = -8 to 8; its two sides stand plumb.
export const ROCK_Z = P.FALL_Z - 0.55, ROCK_BACK = -44.6, ROCK_Y = P.riverY(P.FALL_Z - 0.01) - 1.5, NOTCH = 8;
// the face is drawn down toward the lip, a little more in the middle, where it runs faster (metres under its level)
export const sagAt = (x) => 0.05 + 0.1 * Math.pow(Math.max(1 - (x / 8) * (x / 8), 0), 1.3);
const DRAW = (z) => smooth(-56, -43, z);
// the stream's own half width: the bed's 6.5 m, spreading to the notch's 8 before it turns over (the notch's corners
// beside it are slack liquid: the river's mesh fills them)
export const upperHalf = (z) => (z > -47 ? 6.5 + 1.5 * smooth(-47, -42.6, z) : P.riverHalfWidth(z));
// the upper river's own face above the lip, at the lip's across-place x0 (-8..8)
export const faceY = (x0, z) => P.riverY(z) + LIFT - sagAt(x0) * DRAW(z);
export const sagOf = (z, s) => sagAt(8 * s) * DRAW(z);

// THE PROFILE down the stream (the same for every column, set on its own level)
export const ZA = ROCK_Z - 1.937;                // where the face begins to turn over (it passes the rock's edge at 32 degrees, half a metre over it)
const R1 = 5, A1 = 16 * Math.PI / 180, R2 = 2.2, A2 = 65 * Math.PI / 180;
const Z1 = ZA + R1 * Math.sin(A1), DY1 = R1 * (1 - Math.cos(A1));
export const ZB = Z1 + R2 * (Math.sin(A2) - Math.sin(A1)), DYB = DY1 + R2 * (Math.cos(A1) - Math.cos(A2));   // where it leaves and falls free
const S1 = R1 * A1;
export const SB = S1 + R2 * (A2 - A1);           // metres along the profile to there
// IN THE AIR: it leaves at A2, V0 m/s outward, and is pulled down (GEFF: a thick sheet is held back from above)
const V0 = 0.87, GEFF = 5, U0 = Math.tan(A2);   // (so the arc it falls in begins as round as the roll it leaves: no crease under the lip)
export const DMAX = 13.0;                        // about how far the sheet falls from where it leaves to the pool
// a place on the profile. st < 0: metres before the turn; 0..1: the shoulder; 1..2: the roll; then D: metres fallen.
// Returns { z, dy (metres under the face's level), nz, ny (the normal), tz, ty (the way it runs), s (metres along), g (how far the
// tongues stand out of the sheet: 0 where it lies level, a quarter as it leaves the lip, 1 from four metres down) }
export function onLip(st) {
  if (st <= 0) return { z: ZA + st, dy: 0, nz: 0, ny: 1, tz: 1, ty: 0, s: st, g: 0 };
  const a = st <= 1 ? A1 * st : A1 + (A2 - A1) * (st - 1), sn = Math.sin(a), cs = Math.cos(a);
  const z = st <= 1 ? ZA + R1 * sn : Z1 + R2 * (sn - Math.sin(A1)), dy = st <= 1 ? R1 * (1 - cs) : DY1 + R2 * (Math.cos(A1) - cs);
  return { z, dy, nz: sn, ny: cs, tz: cs, ty: -sn, s: st <= 1 ? R1 * a : S1 + R2 * (a - A1), g: 0.25 * smooth(0.2, 1.1, a) };
}
export function inAir(D, out) {
  const vh = V0 * (1 + out), u0 = vh * U0, t = (-u0 + Math.sqrt(u0 * u0 + 2 * GEFF * D)) / GEFF, sl = vh / (u0 + GEFF * t), l = Math.hypot(1, sl);
  return { z: ZB + vh * t, dy: DYB + D, nz: 1 / l, ny: sl / l, tz: sl / l, ty: -1 / l, s: SB + D, g: 0.25 + 0.75 * smooth(0, 4.5, D) };
}
export const FOOT_Z = inAir(DMAX - 0.2, 0).z;    // about where the sheet lands in the pool (the pool's rings run out from this line)

// THE TONGUES at the lip, left to right: [width, how far its face stands proud (m), how much it necks in, how much
// farther out it falls]; THE WEBS between them: [width, 0 thin but whole / 1 a tall window / 2 it opens low down];
// and an EDGE outside each outer tongue (EDGE: about its width at the lip).
const TONGUES = [[2.9, 0.5, 0.26, 0.06], [1.5, 0.3, 0.3, -0.08], [3.3, 0.62, 0.22, 0.12], [1.3, 0.24, 0.32, -0.12], [2.2, 0.42, 0.28, 0.03]];
const WEBS = [[1.2, 2], [2.2, 1], [0.8, 0], [2.5, 1]];
const EDGE = 1.7;                                // (wide: on the lip an edge is the stream's shallow margin, which comes down onto the sill)
export const NT = 9, NW = 13, NC = 6, NE = 8;    // steps across a tongue, across a window's web, across a whole web, across an edge
export const CUT = 0.12;                         // thinner than this the sheet is gone

// One fall's own shapes, dealt by the seed's stream: which way round it stands, every width, where and how the webs
// and the edges thin, where the strands hang and which of them is shedding a drop, the folds at the foot, the blots.
export function fallShapes(rng) {
  const flip = rng() < 0.5, tw = TONGUES.map((t) => t[0] * (0.88 + 0.24 * rng())), ww = WEBS.map((w) => w[0] * (0.88 + 0.24 * rng()));
  const ew = [EDGE * (0.8 + 0.5 * rng()), EDGE * (0.8 + 0.5 * rng())];
  const k = 16 / (tw.reduce((a, b) => a + b, 0) + ww.reduce((a, b) => a + b, 0) + ew[0] + ew[1]);
  const order = flip ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4], tongues = [], webs = [];
  // the strands of an opening: each on a column of its own, never two side by side
  const strandsOf = (n, steps, shed) => {
    const taken = new Set(), list = [];
    for (let s = 0; s < n; s++) {
      const col = 2 + Math.floor(rng() * (steps - 3)), len = 1.6 + 4.2 * rng(), drop = rng() < shed, ph = rng(), per = 3 + 2 * rng(), fat = 0.6 + 0.3 * rng();
      if ([-2, -1, 0, 1, 2].some((d) => taken.has(col + d))) continue;
      taken.add(col);
      list.push({ col, len, drop, ph, per, fat });
    }
    return list;
  };
  let x = -8 + ew[0] * k;
  order.forEach((i, n) => {
    const a = tw[i] * k / 2, t = TONGUES[i];
    tongues.push({ c: x + a, a, b: t[1], neck: t[2] * (0.9 + 0.2 * rng()), out: t[3], bw: 0.25 + 0.2 * rng(), bph: 6.28 * rng(), wig: 0.08 + 0.1 * rng(), wph: 6.28 * rng(),
      num: 6.28 * rng(), pile: 0.85 + 0.3 * rng(), bow: 1.4 + 1.6 * rng(), lam: 1.05 + 0.6 * rng() });
    x += 2 * a;
    if (n === 4) return;
    const j = flip ? 3 - n : n, kind = WEBS[j][1], gap = ww[j] * k, steps = kind === 0 ? NC : NW;
    webs.push({ gap, kind, steps, d0: kind === 2 ? 4.5 + 2 * rng() : 1.5 + 2 * rng(), len: kind === 0 ? 40 : (kind === 2 ? 3 + 2 * rng() : 1.5 + 1.5 * rng()),
      pw: 0.7 + 0.3 * rng(), skew: 0.75 + 0.6 * rng(), strands: strandsOf(kind === 1 ? 3 : (kind === 2 ? 1 : 0), steps, 0.65) });
    x += gap;
  });
  const edges = ew.map((w) => ({ gap: w * k, steps: NE, d0: 0.7 + 1.4 * rng(), p1: 6.28 * rng(), p2: 6.28 * rng(), strands: strandsOf(2, NE, 0.85) }));
  const splash = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(() => [rng(), rng(), rng(), rng(), rng(), rng()]);   // (the blots on the banks: the dice of each)
  return { tongues, webs, edges, splash, wave: [6.28 * rng(), 6.28 * rng(), 6.28 * rng()] };
}
// a tongue after falling D: its middle (the whole sheet draws together), its half width (it necks in), how far its
// face stands proud (its weight comes and goes, and lessens as it thins)
export function tongueAt(t, D) {
  const q = Math.min(Math.max(D / DMAX, 0), 1);
  return { c: t.c * (1 - 0.24 * Math.pow(q, 0.8)) + t.wig * Math.sin(0.5 * D + t.wph) * smooth(0, 3, D), a: t.a * (1 - t.neck * Math.pow(q, 0.7)),
    b: t.b * (0.78 + 0.22 * Math.sin(t.bw * D + t.bph)) * (1 - 0.35 * q) };
}
// how thick a tongue is after falling D (it thins as it speeds up): 1 at the lip, about half at the pool
export const tongueT = (D) => 1 - 0.56 * Math.pow(Math.min(Math.max(D / DMAX, 0), 1), 0.7);
// how thick a web is at w (0..1 across it) after falling D: as its tongues at its two edges, thinnest toward its middle
export function webThin(web, w, D) {
  const m = Math.max(0.72 - 0.6 * Math.max(D - web.d0, 0) / web.len, -1.6);
  return tongueT(D) * (1 - (1 - m) * Math.pow(Math.sin(Math.PI * Math.pow(w, web.skew)), web.pw));
}
// how thick an edge is at f (0 at the rock's side, 1 at its tongue) after falling D (under 0: metres before it leaves
// the roll): whole on the lip; from just under the roll it goes from the outside inward, STEADILY: the line where it
// ends (cut) runs in from the notch's side at the lip to all but the tongue at the pool, and wanders. So the lip is no
// wider than the sheet under it, and the sheet's side slants inward all the way down, with no step.
const EDGE_W = 0.35;                             // (over this share of the edge's width it thins to nothing)
export function edgeThin(e, f, D) {
  const wob = (0.08 * Math.sin(1.1 * D + e.p1) + 0.045 * Math.sin(2.7 * D + e.p2)) * smooth(-0.4, e.d0 + 0.6, D);
  const cut = edgeCut(D) + wob, tT = tongueT(D), W = 0.14 + (EDGE_W - 0.14) * smooth(-0.3, 2.5, D);   // (on the lip it ends in a short round rim, no pale flap)
  return CUT + (tT - CUT) * Math.min((f - cut) / W, 1);
}
// the line where an edge ends (the share of its width, from the rock's side, that is gone) after falling D, without
// its wandering. Upstream of the shoulder's end the edge is whole (the notch's corner is slack liquid, wall to wall);
// there its outer half comes down onto the rock's sill (the sheet's file: dip) and ENDS on it, half a metre and more
// before the rock's own edge, so that the brow which hangs before the rock is narrower than the notch and a rim of
// bare wet rock shows either side of it.
export const edgeCut = (D) => Math.max(0.92 * Math.pow(Math.min(Math.max(D, 0) / DMAX, 1), 0.75), 0.5 * smooth(-2.05, -1.75, D), 0.6 * smooth(-1.6, -1.0, D)) - (EDGE_W + 0.15) * (1 - smooth(-2.2, -1.9, D));
// the sheet's columns, left to right: { e: edge (0 left, 1 right), j, f: 0 at the rock's side .. 1 at its tongue },
// { t: tongue, xi: -1..1 across it } or { w: web, j: step across it, f: 0..1 }
export function columnsOf(F) {
  const cols = [];
  for (let j = 0; j < NE; j++) cols.push({ e: 0, j, f: j / NE });
  F.tongues.forEach((t, i) => {
    for (let j = 0; j <= NT; j++) cols.push({ t: i, xi: -1 + 2 * j / NT });
    if (i < F.webs.length) for (let j = 1; j < F.webs[i].steps; j++) cols.push({ w: i, j, f: j / F.webs[i].steps });
  });
  for (let j = NE - 1; j >= 0; j--) cols.push({ e: 1, j, f: j / NE });
  return cols;
}
// how high the heap of folds stands where a tongue goes in (a metre at the most), and where every tongue lands: its middle,
// half width, weight, the folds' height
export const foldOf = (t) => Math.min(0.34 + 0.8 * t.b, 0.85) * t.pile;
export function fallFeet(F) {
  return F.tongues.map((t) => {
    const H = foldOf(t), D = Math.max(faceY(t.c, ZA) - DYB - POOL_Y - 0.5 * H, 1), g = tongueAt(t, D);
    return { x: g.c, z: inAir(D, t.out).z + 0.3 * g.b, a: g.a, b: t.b, H, D, num: t.num, bow: t.bow };
  });
}
