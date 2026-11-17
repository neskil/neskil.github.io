// hill-of-round-doors, the homes: THE LAST HOME'S FORECOURT, in the home's own space (x along the front, y up from
// the garden's level, z out toward the lane). The lead's rule for this garden: what stands under 1 m may stand
// anywhere farther than 1.5 m in plan from the flown line, what stands up to 2.4 m farther than 4 m in plan (the
// climbing rose round the door's rim keeps 2.6 m of air to the line); round the line itself 2 m are always clear.
// plan(x, z): metres in plan from the flown line. A low picket fence and a gate standing open, a flagged apron
// and path with cushions of flowers in the joints at its edges, beds brimming up to the path, a bench under a
// window, a lantern on a short post, pots by the porch step, the rose over the door; lit lanterns by the gate and
// along the path, flowers up the banks either side, and colour massed in warm runs either side of the path and
// outside the fence by the gate (the banks and the massed colour draw from a stream of their own, 'banks-<n>').
import { DOOR, frontTop } from './hill-of-round-doors-plan.js';
import { KIND, mul } from './hill-of-round-doors-homes-geo.js';
import * as PL from './hill-of-round-doors-homes-plants.js';
import { fence, bench } from './hill-of-round-doors-homes-garden.js';

const STONE = [0.6, 0.56, 0.47], WHITE = [0.84, 0.82, 0.74], EARTH = [0.2, 0.13, 0.08], POT = [0.55, 0.2, 0.09];
const pick = (list, r) => list[Math.floor(r() * list.length)];

// a terracotta pot with a cushion of flowers, standing on the ground at (x, z): 0.9 m to the top of its blooms
function pot(G, x, z, col, r) {
  G.tube([x, 0, z], [x, 0.36, z], 0.2, 0.29, 9, POT, KIND.PAINT, 0, { cb: mul(POT, 1.25) });
  G.tube([x, 0.36, z], [x, 0.4, z], 0.31, 0.31, 9, mul(POT, 1.2), KIND.PAINT, 0, { caps: true });
  G.pushYaw(x, 0.34, z); PL.drift(G, 0, 0, 0.38, col, r); G.pop();
}

// a lantern on a short post at (x, z): 2.1 m to its cap
function postLantern(G, x, z, iron) {
  G.box(x - 0.07, -0.1, z - 0.07, x + 0.07, 1.5, z + 0.07, [0.3, 0.2, 0.11], KIND.PAINT, 0, { skip: 'b' });
  G.tube([x, 1.5, z], [x, 1.56, z], 0.16, 0.2, 6, iron, KIND.PAINT, 0, { caps: true });
  G.tube([x, 1.92, z], [x, 2.08, z], 0.22, 0.03, 6, iron, KIND.PAINT, 0, { caps: true });
  for (let k = 0; k < 4; k++) { const t = k / 4 * 6.283 + 0.785, px = x + Math.cos(t) * 0.17, pz = z + Math.sin(t) * 0.17; G.tube([px, 1.56, pz], [px, 1.92, pz], 0.014, 0.014, 3, iron, KIND.PAINT); }
  G.ball(x, 1.72, z, 0.1, 6, 4, [1, 0.7, 0.3], KIND.FLAME, G.phase(x, 0, z), 1, 1.4, 1);
}

// a small lantern on a short post at (x, z), h to its cap (under 1 m): panes of glowing glass, alight by the look
function lowLantern(G, x, z, h, iron) {
  G.box(x - 0.045, -0.05, z - 0.045, x + 0.045, h - 0.34, z + 0.045, iron, KIND.PAINT, 0, { skip: 'b' });
  G.box(x - 0.13, h - 0.34, z - 0.13, x + 0.13, h - 0.3, z + 0.13, iron, KIND.PAINT);
  G.box(x - 0.1, h - 0.3, z - 0.1, x + 0.1, h - 0.07, z + 0.1, [1, 0.72, 0.3], KIND.FLAME, G.phase(x, 0, z), { skip: 'bt' });
  G.tube([x, h - 0.07, z], [x, h, z], 0.17, 0.03, 4, iron, KIND.PAINT, 0, { caps: true });
}

// flowers up the banks either side of the front, outside the fence: drifts in runs of one colour, lupins, a rose
// or two (12 m and more from the flown line in plan, so they are built of fewer faces)
function layBanks(G, home, r) {
  const w = home.w;
  for (const s of [-1, 1]) {
    let col = pick(PL.BLOOMS.low, r), run = 0;
    for (let i = 0; i < 38; i++) {
      if (run-- <= 0) { col = pick(PL.BLOOMS.low, r); run = 3 + Math.floor(r() * 5); }
      const u = r(), v = r(), hh = 0.45 + 0.4 * r();
      PL.drift(G, s * (w + 1.6 + 6.4 * u * u), -4 + 11 * v, hh, col, r, true);
    }
    for (let i = 0; i < 8; i++) { const u = r(), v = r(), hh = 1.4 + 0.7 * r(); PL.lupin(G, s * (w + 1.9 + 5 * u), -3.5 + 10 * v, hh, pick(PL.BLOOMS.lupin, r), r); }
    for (let i = 0; i < 3; i++) { const u = r(), v = r(), hh = 1.2 + 0.5 * r(); PL.rose(G, s * (w + 3 + 3.5 * u), -2 + 8 * v, hh, pick(PL.BLOOMS.rose, r), r, true); }
  }
}

// colour massed either side of the path for the arrival: two more rows of low flowers inside the fence beside the
// path beds, and a broad drift of them outside it either side of the gate, in warm runs of one colour (all under
// 1 m, by the forecourt's low rule; post: the lantern post's place, left clear)
function layMass(G, r, low, fz, post) {
  const L = PL.BLOOMS.low, WARM = [L[0], L[1], L[5], L[4], L[3], L[0], L[1]];
  for (const s of [-1, 1]) {
    let col = pick(WARM, r), run = 0;
    for (let z = 3.3; z < fz - 1.4; z += 0.62) for (const x of [3.8, 4.5]) {
      if (run-- <= 0) { col = pick(WARM, r); run = 3 + Math.floor(r() * 4); }
      const px = s * (x + (r() - 0.5) * 0.2), pz = z + (r() - 0.5) * 0.2, hh = 0.5 + 0.28 * r();
      if (low(px, pz) && Math.hypot(px - post[0], pz - post[1]) > 0.75) PL.drift(G, px, pz, hh, col, r);
    }
    for (let i = 0; i < 12; i++) {
      if (run-- <= 0) { col = pick(WARM, r); run = 3 + Math.floor(r() * 4); }
      const u = r(), v = r(), px = s * (3.3 + 3.6 * u), pz = fz + 0.55 + 1.5 * v, hh = 0.45 + 0.3 * r();
      if (low(px, pz)) PL.drift(G, px, pz, hh, col, r);
    }
  }
}

// the rose that climbs round the door's rim: two stems from the ground, leaf and bloom over the arch
function climbingRose(G, d, col, r) {
  const R = d.door.r + d.door.rimW + 0.3, cy = d.door.y, a0 = -0.44, a1 = Math.PI + 0.44, n = 46, stem = [0.25, 0.17, 0.09];
  for (const s of [-1, 1]) G.tube([s * (R * Math.cos(a0) + 0.05), -0.05, 0.14], [s * R * Math.cos(a0), cy + R * Math.sin(a0), 0.16], 0.06, 0.045, 5, stem, KIND.PAINT);
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n, jr = r(), jz = r(), big = 0.36 + 0.16 * r(), x = Math.cos(a) * (R + 0.42 * jr), y = cy + Math.sin(a) * (R + 0.42 * jr), z = 0.2 + 0.1 * jz;
    G.ball(x, y, z, 1, 5, 3, PL.ROSE_LEAF, KIND.LEAF, 0, big, big, big * 0.5, PL.LEAF, 0.03);
    for (let k = 0; k < 4; k++) {
      const t = r() * 6.283, q = r() * big * 0.85, br = 0.13 + 0.08 * r();
      PL.flower(G, x + Math.cos(t) * q, y + Math.sin(t) * q, z + big * 0.5 + 0.02, 0.2 * Math.cos(t), 0.2 * Math.sin(t) + 0.15, 1, br, 5, mul(col, 0.8), col, 0.03);
    }
  }
}

// THE FORECOURT. r: the garden's stream; plan(x, z): metres in plan from the flown line.
export function layTopGarden(G, home, d, r, plan, density, rb = r) {
  const w = home.w, fz = 6.6, gx = 1.95, fx = w + 0.8, k = 1 / density;
  const low = (x, z, rad = 0.45) => plan(x, z) > 1.5 + rad + 0.1, mid = (x, z, rad = 0.5) => plan(x, z) > 4 + rad + 0.1;
  const benchSide = r() < 0.5 ? -1 : 1, theme = Math.floor(r() * 3), roseCol = pick(PL.BLOOMS.rose, r), outer = d.windows.filter((q) => q.x * benchSide > 0).sort((a, b) => Math.abs(b.x) - Math.abs(a.x))[0];
  const bx = outer ? outer.x : benchSide * 7.5;
  // the porch steps (level), the flagged apron and path (flush with the ground)
  const lift = G.lift; G.lift = null;
  G.box(-1.9, -0.4, 0, 1.9, 0.25, 2.1, STONE, KIND.FLAGS, 0, { skip: 'bk', low: mul(STONE, 0.7) });
  G.box(-1.45, 0.25, 0, 1.45, DOOR.sill - 0.02, 1.3, mul(STONE, 1.1), KIND.FLAGS, 0, { skip: 'bk', low: mul(STONE, 0.8) });
  G.lift = lift;
  G.poly([[-3.5, 0.045, 0.1], [3.5, 0.045, 0.1], [3.5, 0.045, 3.0], [-3.5, 0.045, 3.0]], STONE, KIND.FLAGS, 0, { out: [0, 1, 0] });
  G.poly([[-1.9, 0.05, 3.0], [1.9, 0.05, 3.0], [1.9, 0.05, fz + 0.9], [-1.9, 0.05, fz + 0.9]], STONE, KIND.FLAGS, 0, { out: [0, 1, 0] });
  for (const s of [-1, 1]) { pot(G, s * 2.4, 0.55, pick(PL.BLOOMS.low, r), r); pot(G, s * 2.45, 1.75, pick(PL.BLOOMS.low, r), r); }
  for (let i = 0; i < 26; i++) {                                // cushions of flowers in the joints, at the flags' edges
    const s = r() < 0.5 ? -1 : 1, onPath = r() < 0.55, t = r(), u = r(), col = pick(PL.BLOOMS.low, r);
    const x = s * (onPath ? 1.74 + 0.14 * u : 2.95 + 0.5 * u), z = onPath ? 3.1 + t * (fz - 2.6) : 0.5 + t * 2.4;
    if (low(x, z, 0.06)) { G.pushYaw(x, 0.03, z, 0, 1, 0.3); PL.drift(G, 0, 0, 0.3, col, r, true); G.pop(); }
  }
  // the low picket fence, its gate posts, the two leaves of the gate standing wide open into the garden
  fence(G, -fx, fz, -gx, fz, 0, 1, WHITE, 0.7); fence(G, gx, fz, fx, fz, 0, 1, WHITE, 0.7);
  fence(G, -fx, 0.5, -fx, fz, -1, 0, WHITE, 0.7); fence(G, fx, 0.5, fx, fz, 1, 0, WHITE, 0.7);
  for (const [s, a] of [[-1, 1.75], [1, 1.39]]) {
    G.box(s * gx - 0.1, -0.1, fz - 0.1, s * gx + 0.1, 0.97, fz + 0.1, WHITE, KIND.PAINT, 0, { skip: 'b', low: mul(WHITE, 0.7) });
    G.pushYaw(s * (gx + 0.04), 0, fz - 0.14, Math.sin(a), Math.cos(a)); fence(G, 0.1, 0, 1.75, 0, 0, 1, WHITE, 0.7); G.pop();
  }
  if (mid(bx - 1.2, 0.75) && mid(bx + 1.2, 0.75)) bench(G, bx, 0.75, 2.3, [0.5, 0.36, 0.2]);
  postLantern(G, -benchSide * 4.9, 5.3, d.iron);
  // a lit lantern either side of the gate, and a row of small ones along the flagged path
  for (const s of [-1, 1]) { lowLantern(G, s * 2.35, fz + 0.5, 0.96, d.iron); for (let z = 3.3; z < fz - 0.4; z += 0.9) lowLantern(G, s * 2.08, z, 0.56, d.iron); }
  layBanks(G, home, rb);                                     // (the banks' dice are a stream of their own: rb)
  layMass(G, rb, low, fz, [-benchSide * 4.9, 5.3]);          // (and after them, from the same stream, the massed colour by the path)
  climbingRose(G, d, roseCol, r);
  // the beds: along the wall, both sides of the path right up to its flags, and inside the fence
  for (const s of [-1, 1]) {
    G.poly([[s * 3.6, 0.035, 0.28], [s * (w - 0.35), 0.035, 0.28], [s * (w - 0.35), 0.035, 1.7], [s * 3.6, 0.035, 1.7]], EARTH, KIND.EARTH, 0, { out: [0, 1, 0] });
    G.poly([[s * 2.0, 0.035, 3.1], [s * 3.5, 0.035, 3.1], [s * 3.5, 0.035, fz - 0.2], [s * 2.0, 0.035, fz - 0.2]], EARTH, KIND.EARTH, 0, { out: [0, 1, 0] });
    G.poly([[s * 3.5, 0.035, fz - 1.3], [s * fx, 0.035, fz - 1.3], [s * fx, 0.035, fz - 0.2], [s * 3.5, 0.035, fz - 0.2]], EARTH, KIND.EARTH, 0, { out: [0, 1, 0] });
    for (let x = 3.9; x < w - 0.6; x += 0.8 * k) {              // the wall bed: tall flowers where the air allows, low ones before them
      const px = s * (x + (r() - 0.5) * 0.25), jz = r() * 0.2, cap = Math.min(2.3, frontTop(home, px) + 0.3), size = r(), kind = r(), col = pick(PL.BLOOMS.hollyhock, r);
      const byWindow = d.windows.some((q) => Math.abs(px - q.x) < q.r + 0.3), byBench = Math.abs(px - bx) < 1.5;
      if (!byBench && !byWindow && cap > 1.5 && mid(px, 0.5 + jz)) {
        if (theme === 1 ? kind < 0.65 : kind < 0.25) PL.sunflower(G, px, 0.5 + jz, Math.min(cap - 0.3, 1.7 + 0.3 * size), r); else PL.hollyhock(G, px, 0.5 + jz, Math.min(cap - 0.1, 1.75 + 0.45 * size), col, r);
      } else if (!byBench) PL.drift(G, px, 0.55 + jz, 0.6, pick(PL.BLOOMS.low, r), r);
      if (!byBench) PL.drift(G, px + 0.3 * s, 1.25 + jz, 0.5, pick(PL.BLOOMS.low, r), r);
    }
    let col = pick(PL.BLOOMS.low, r), run = 0;
    for (let z = 3.4; z < fz - 0.5; z += 0.55 * k) for (const x of [2.45, 3.1]) {     // the path beds, in runs of one colour
      if (run-- <= 0) { col = pick(PL.BLOOMS.low, r); run = 2 + Math.floor(r() * 4); }
      const px = s * (x + (r() - 0.5) * 0.15), hh = 0.42 + 0.2 * r();
      if (low(px, z)) PL.drift(G, px, z + (r() - 0.5) * 0.2, hh, col, r);
    }
    for (let x = 3.9; x < fx - 0.4; x += 0.62 * k) PL.drift(G, s * (x + (r() - 0.5) * 0.2), fz - 0.5 - r() * 0.2, 0.4 + 0.25 * r(), pick(PL.BLOOMS.low, r), r, x > 6.5);
    for (let x = 6.4; x < fx - 0.8; x += 2.1 * k) { const px = s * (x + (r() - 0.5) * 0.3), hh = 1.2 + 0.4 * r(); if (mid(px, fz - 1.0, hh * 0.75)) PL.rose(G, px, fz - 1.05, hh, pick(PL.BLOOMS.rose, r), r); }
    for (let z = 3.6; z < fz - 1.8; z += 1.5 * k) { const px = s * (5.4 + r() * 0.5), hh = 1.5 + 0.6 * r(); if (mid(px, z, 0.35)) PL.lupin(G, px, z, hh, pick(PL.BLOOMS.lupin, r), r); }
  }
}
