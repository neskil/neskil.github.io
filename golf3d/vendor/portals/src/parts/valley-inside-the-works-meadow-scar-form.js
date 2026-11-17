// valley-inside-the-works, the meadow: THE SCAR'S FORM, in numbers only (its file of triangles reads this one).
// A natural limestone scar, never a built wall:
//   BEDS of very uneven thickness (thin partings in twos and threes between massive beds of two to four metres), all
//   dipping a little along the hall and each bedding plane rolling gently;
//   LEDGES: every bed stands back from the one below by a depth of its own that swells and pinches out along the scar;
//   the FACE WANDERS in plan (buttresses and bays of a metre or two), each bed a little out of line with its neighbours;
//   JOINTS break each bed into blocks that stand a hand or a forearm proud or shy; here and there a CLEFT goes deep;
//   at the river a WORN NOTCH: the opening widens upward bed by bed, each corner rounded, no square frame.
// Nothing overhangs, and every face stands in front of the plan's own ramp of ground (the plan's heights are kept).
// A column is a place along the scar (x); F[k][i] is where bed k's face stands (z) at column i.
import * as P from './valley-inside-the-works-plan.js';
import { dryHeight } from './valley-inside-the-works-meadow-ground.js';
import { smooth } from './valley-inside-the-works-meadow-field.js';

export const FOOT_Z = -37.2, BACK_Z = -44.6, WALL_Z = P.FALL_Z - 0.55, NOTCH = 8.0;     // (NOTCH: the fall's own half width)
// beside the fall the rock is in blocks of its own: seven joints a side (left, right), by their distance from the river's middle
export const NEAR = [[8.55, 9.3, 10.05, 10.75, 11.6, 12.5, 13.4], [8.6, 9.25, 9.95, 10.7, 11.5, 12.35, 13.3]];

// the plan's ramp under the scar: the z at which its floor has risen h above the lower valley's
const RAMP = [];
for (let z = -37; z >= -43.61; z -= 0.1) RAMP.push([P.floorLevel(z) - P.floorLevel(-37), z]);
export function rampZ(h) {
  if (h <= RAMP[0][0]) return RAMP[0][1];
  for (let i = 1; i < RAMP.length; i++) if (RAMP[i][0] >= h) { const a = RAMP[i - 1], b = RAMP[i]; return a[1] + (b[1] - a[1]) * (h - a[0]) / Math.max(b[0] - a[0], 1e-6); }
  return RAMP[RAMP.length - 1][1];
}

// the columns, left wall to right wall, and the joints between blocks. A joint is two columns a hand apart (side -1:
// its left lip, 1: its right lip); a cleft is three (side 2: its heart). Beside the river stand the near joints (nj: which).
function dealColumns(rng) {
  const cols = [], joints = [];
  for (const s of [-1, 1]) {
    const mine = [];
    mine.push({ x: s * NOTCH, joint: -1, side: 0, nj: -1 });
    NEAR[s < 0 ? 0 : 1].forEach((a, n) => { const nj = (s < 0 ? 0 : 7) + n; mine.push({ x: s * (a - 0.06), joint: -1, side: 0, nj }, { x: s * (a + 0.06), joint: -1, side: 0, nj }); });
    mine.push({ x: s * 14.3, joint: -1, side: 0, nj: -1 });
    let a = 14.3;
    for (let guard = 0; guard < 60 && a < 80.3; guard++) {
      const len = 3.0 + 11 * rng() * rng() + 1.5 * rng(), cleft = rng() < 0.22, from = rng(), deep = 0.6 + 1.1 * rng(), jit = rng();
      const end = Math.min(a + len, 80.3), n = Math.max(1, Math.round((end - a) / 1.55));
      for (let i = 1; i < n; i++) mine.push({ x: s * (a + (end - a) * (i + (((i * 0.618 + jit) % 1) - 0.5) * 0.3) / n), joint: -1, side: 0 });
      if (end >= 80.3) { mine.push({ x: s * 80.3, joint: -1, side: 0 }); break; }
      const j = joints.length, isCleft = cleft && end > 15;
      joints.push({ cleft: isCleft, from, deep });
      if (isCleft) { mine.push({ x: s * (end - 0.38), joint: j, side: -s }, { x: s * end, joint: j, side: 2 }, { x: s * (end + 0.38), joint: j, side: s }); a = end + 0.38; }
      else { mine.push({ x: s * (end - 0.07), joint: j, side: -s }, { x: s * (end + 0.07), joint: j, side: s }); a = end + 0.07; }
    }
    if (s < 0) mine.reverse();
    cols.push(...mine);
  }
  return { cols, joints };
}

// the beds, from under the pool to above the highest ground: thickness, the ledge on top, the lines its face keeps
function dealBeds(rng) {
  const beds = [];
  let y = 1.0, thin = 0;
  for (let guard = 0; guard < 60 && y < 29.5; guard++) {
    const kind = rng(), t = rng(), ledge = rng(), ld = rng(), tint = rng();
    const lam1 = 9 + 14 * rng(), ph1 = 6.2832 * rng(), lam2 = 4 + 5 * rng(), ph2 = 6.2832 * rng(), wl = 5 + 9 * rng(), wp = 6.2832 * rng();
    const ua = 0.05 + 0.2 * rng(), ul = 13 + 22 * rng(), up = 6.2832 * rng(), cr = [2.0 + 2.5 * rng(), 2.0 + 2.5 * rng()], cd = [1.6 + 1.2 * rng(), 1.6 + 1.2 * rng()], wj = [rng(), rng()];
    const isThin = thin < 3 && kind < (thin > 0 ? 0.55 : 0.3), th = isThin ? 0.45 + 0.5 * t : kind < 0.68 ? 1.1 + 1.0 * t : 2.4 + 2.1 * t;
    thin = isThin ? thin + 1 : 0;
    const depth = ledge < 0.62 ? 0.08 * ld : ledge < 0.86 ? 0.25 + 0.4 * ld : 1.0 + 1.3 * ld;   // most beds stand flush: the scar is a cliff, with a ledge here and there
    beds.push({ y, th, depth, tint: 0.88 + 0.2 * tint, lam1, ph1, lam2, ph2, wl, wp, ua, ul, up, cr, cd, wj });
    y += th;
  }
  return beds;
}

export function scarForm(rng) {
  const dip = (rng() < 0.5 ? -1 : 1) * (0.014 + 0.012 * rng()), p1 = 6.2832 * rng(), p2 = 6.2832 * rng(), p3 = 6.2832 * rng(), flare = [2.6 + 1.6 * rng(), 2.6 + 1.6 * rng()];
  const { cols, joints } = dealColumns(rng), beds = dealBeds(rng), K = beds.length, N = cols.length;
  // every joint's dice for every bed: whether the joint shows in that bed, and the throw of the block to its right
  const live = [], thrown = [];
  for (let j = 0; j <= joints.length; j++) { live.push([]); thrown.push([]); for (let k = 0; k < K; k++) { live[j].push(rng()); thrown[j].push(rng()); } }
  // ... and beside the fall: every near joint's dice for every bed (does it show there, the step at it, which way), and the wet's reach in each bed
  const nd = [], wd = [[], []];
  for (let n = 0; n < 14; n++) { nd.push([]); for (let k = 0; k < K; k++) nd[n].push([rng(), rng(), rng()]); }
  for (const s of [0, 1]) for (let k = 0; k < K; k++) wd[s].push(rng());
  const throwOf = (v) => v < 0.12 ? 0.55 + 2.5 * v : (v - 0.56) * 1.3;      // a block's throw: now and then a buttress stands well proud
  const Yof = (k, x) => k >= K ? 99 : beds[k].y + dip * x + beds[k].ua * Math.sin(x / beds[k].ul + beds[k].up);
  const F = [], YB = [], YT = [], TH = [];
  for (let k = 0; k < K; k++) {
    F.push(new Float32Array(N)); YB.push(new Float32Array(N)); YT.push(new Float32Array(N));
    // a block's throw holds from bed to bed (so a joint reads from the foot to the rim); each bed stands a little out of it
    const t = new Float32Array(N); let all = throwOf(thrown[joints.length][0]), cur = thrown[joints.length][k] - 0.5;
    for (let i = 0; i < N; i++) {
      const c = cols[i];
      if (c.joint >= 0 && c.side === 1) {
        if (joints[c.joint].cleft || live[c.joint][0] < 0.6) all = throwOf(thrown[c.joint][0]);
        if (live[c.joint][k] < 0.45) cur = thrown[c.joint][k] - 0.5;
      }
      if (i > 0 && cols[i - 1].x < 0 && c.x > 0) { all = throwOf(thrown[joints.length][1 % K]); cur = thrown[joints.length][(k + 1) % K] - 0.5; }     // (the river parts the two sides)
      t[i] = Math.abs(c.x) < 14.5 ? 0 : all + 0.3 * cur;
    }
    TH.push(t);
  }
  // the notch's half width at each bed, left and right: wider with height, never narrower
  const W = [[], []];
  for (const s of [0, 1]) { let w = NOTCH; for (let k = 0; k < K; k++) { const h = Math.min(Math.max((beds[k].y - 4) / 14, 0), 1); w = Math.max(w, NOTCH + flare[s] * Math.pow(h, 1.3) + 0.6 * (beds[k].wj[s] - 0.5) * h); W[s].push(w); } }
  // BESIDE THE FALL the rock is in blocks too. In each bed, at each near joint that shows there, the block beyond it
  // stands a step of 0.2 to 0.6 m proud or shy of its neighbour (the block next to the fall keeps its place). And the
  // WET of each bed (the splashes' reach) ends at one of its joints, 0.9 to 2.8 m outside the notch's own edge there
  // (less than half that beside the lip): its boundary runs in steps along joints and bed lines and does not flare at the foot.
  const nlive = [], wetTo = [[], []];
  for (let k = 0; k < K; k++) nlive.push(new Uint8Array(14));
  for (const s of [0, 1]) for (let k = 0; k < K; k++) {
    const want = W[s][k] + (0.9 + 1.9 * wd[s][k]) * (1 - 0.6 * smooth(0, 2.5, W[s][k] - NOTCH)), bt = [0];      // (less beside the lip, where the notch is wide)
    let best = 0, t = 0;
    for (let n = 1; n < 7; n++) if (Math.abs(NEAR[s][n] - want) < Math.abs(NEAR[s][best] - want)) best = n;
    wetTo[s].push(NEAR[s][best]);
    for (let n = 0; n < 7; n++) {
      const d = nd[s * 7 + n][k], on = n === best || d[0] < 0.6, step = 0.2 + 0.4 * d[1], way = d[2] < 0.5 ? -1 : 1;
      nlive[k][s * 7 + n] = on ? 1 : 0;
      if (on) t += (Math.abs(t + way * step) > 0.45 ? (t > 0 ? -1 : 1) : way) * step;
      bt.push(t);
    }
    for (let i = 0; i < N; i++) {
      const c = cols[i], ax = Math.abs(c.x);
      if (ax >= 14.5 || (c.x < 0 ? 0 : 1) !== s) continue;
      TH[k][i] = bt[c.nj >= 0 ? (c.nj % 7) + (ax > NEAR[s][c.nj % 7] ? 1 : 0) : ax < 9 ? 0 : 7];
    }
  }
  const foot = new Float32Array(N), top = new Float32Array(N), rim = new Float32Array(N), gone = new Float32Array(N);
  for (let i = 0, d = 0; i < N; i++) {       // the rim: here and there a block's top bed has gone, and the turf runs down into the gap
    const c = cols[i];
    if (c.joint >= 0 && c.side === 1 && (joints[c.joint].cleft || live[c.joint][0] < 0.6)) d = live[c.joint][1] < 0.26 ? 0.4 + 1.1 * thrown[c.joint][2] : 0;
    if (i > 0 && cols[i - 1].x < 0 && c.x > 0) d = 0;
    gone[i] = Math.abs(c.x) < 16 ? 0 : d;
  }
  for (let i = 0; i < N; i++) {
    const c = cols[i], x = c.x, ax = Math.abs(x), s = x < 0 ? 0 : 1;
    foot[i] = dryHeight(x, FOOT_Z + 0.4); top[i] = dryHeight(x, BACK_Z); rim[i] = top[i] + 0.1 - gone[i];
    const B = Math.min(Math.max(0.8 + 1.0 * Math.sin(x / 13.7 + p1) + 0.6 * Math.sin(x / 6.1 + p2) + 0.3 * Math.sin(x / 3.1 + p3), -0.25), 2.3) * smooth(9.5, 17, ax);
    const near = 1 - smooth(9.6, 17, ax), fb = foot[i] - 0.8;
    let S = 0, prev = 1e9, y0 = Yof(0, x);
    for (let k = 0; k < K; k++) {
      const b = beds[k], y1 = Math.max(Yof(k + 1, x), y0 + 0.3);       // (a bed keeps a foot of thickness where its planes roll together)
      YB[k][i] = Math.min(Math.max(y0, fb), rim[i]); YT[k][i] = Math.min(Math.max(y1, fb), rim[i]);
      let g = FOOT_Z + B - S + 0.22 * Math.sin(x / b.wl + b.wp) + TH[k][i];
      if (c.side === 2) { const J = joints[c.joint]; if (YT[k][i] > foot[i] + (J.from < 0.6 ? 0 : (J.from - 0.6) * 20)) g -= J.deep; }
      const bound = rampZ(YB[k][i] - foot[i]) + 0.45 + (ax < 14.5 ? Math.max(TH[k][i], 0) : 0), Wk = W[s][k];      // (a proud block beside the fall stands proud of the ramp's line too)
      if (ax <= Wk + 0.01) g = Math.max(WALL_Z, bound);            // inside the worn notch: the rock stands as far back as the plan's ground lets it
      else if (ax < Wk + b.cr[s]) {                               // the worn corner: the face turns round into the notch
        const t = (Wk + b.cr[s] - ax) / b.cr[s];
        g = Math.max(Math.min(Math.max(g, -38.3) - b.cd[s] * (1 - Math.sqrt(1 - t * t)), prev), bound, WALL_Z + 0.25);
      } else g = Math.max(Math.min(g, prev), bound, -38.3 - 4.6 * (1 - near * near));     // (beside the fall the rock keeps forward of the falling sheet)
      g = Math.min(g, prev);
      F[k][i] = g;
      if (ax >= 14.5 || YT[k][i] > fb + 0.02) prev = g;      // (beside the fall a bed that lies wholly under the ground holds nothing back)
      // the ledge on this bed: by its own law along the scar; none while the bed is in the ground or cut by the rim
      const m = Math.max(0, 0.55 + 0.75 * Math.sin(x / b.lam1 + b.ph1) + 0.45 * Math.sin(x / b.lam2 + b.ph2));
      S += b.depth * m * smooth(0, 1, y1 - foot[i]) * smooth(0.1, 1.2, top[i] - y1);
      y0 = y1;
    }
  }
  return { cols, joints, beds, K, N, F, YB, YT, foot, top, rim, dip, W, nlive, wetTo };
}
