// valley-inside-the-works, the meadow: THE SCAR'S RUBBLE. What has come down from the face lies at its foot: fallen
// blocks (a few as big as a cart, most the size of a chest), each a box out of true, turned and tipped, half sunk in the
// turf; and scree, small stones heaped against the rock, thickest under the clefts. None lies in the pool or under the
// fall. And along the top edge the rim's own stones. Every stone's dice are drawn before it is tried.
import * as P from './valley-inside-the-works-plan.js';
import { dryHeight } from './valley-inside-the-works-meadow-ground.js';
import { NOTCH } from './valley-inside-the-works-meadow-scar-form.js';

// one stone: a box w by h by d whose top is drawn in by `taper`, its eight corners out of true by `rough` (jit: its 24 dice), turned by
// yaw and tipped by tip, standing at (x, y, z); five faces (it has no underside)
function stone(E, jit, x, y, z, w, h, d, yaw, tip, taper, rough, tint) {
  const c = Math.cos(yaw), s = Math.sin(yaw), ct = Math.cos(tip), st = Math.sin(tip), p = [];
  for (let i = 0; i < 8; i++) {
    const up = i >> 2, k = up ? 1 - taper : 1;
    const px = ((i & 1) ? 0.5 : -0.5) * w * k + (jit[i * 3] - 0.5) * rough, py = (up ? h : -0.25 * h) + (jit[i * 3 + 1] - 0.5) * rough, pz = ((i & 2) ? 0.5 : -0.5) * d * k + (jit[i * 3 + 2] - 0.5) * rough;
    const ty = py * ct - pz * st, tz = py * st + pz * ct;                 // tipped about its length
    p.push([x + px * c + tz * s, y + ty, z - px * s + tz * c]);
  }
  const lo = 0.66 * tint, hi = tint, top = 1.06 * tint, mid = [x, y + 0.4 * h, z];
  const face = (a, b, cc, dd, ka, kb, kc, kd) => {
    const m = [(p[a][0] + p[cc][0]) / 2 - mid[0], (p[a][1] + p[cc][1]) / 2 - mid[1], (p[a][2] + p[cc][2]) / 2 - mid[2]];
    E.facing(m, [p[a], p[b], p[cc], p[dd]], [ka, kb, kc, kd]);
  };
  face(0, 1, 5, 4, lo, lo, hi, hi); face(1, 3, 7, 5, lo, lo, hi, hi); face(3, 2, 6, 7, lo, lo, hi, hi); face(2, 0, 4, 6, lo, lo, hi, hi);
  face(4, 5, 7, 6, top, top, top, top);
}

const dice24 = (rng) => { const a = []; for (let i = 0; i < 24; i++) a.push(rng()); return a; };

export function scarRubble(E, S, rng) {
  const { cols, N, F, foot } = S;
  // the foot of the face at an x: the lowest bed that shows, between the two columns it lies in
  const footZ = (x) => {
    let i = 0; while (i + 2 < N && cols[i + 1].x < x) i++;
    let k = 0; while (k < S.K - 1 && S.YT[k][i] < foot[i] + 0.05) k++;
    return Math.max(F[k][i], F[k][i + 1]);
  };
  const clefts = cols.filter((c) => c.side === 2).map((c) => c.x);
  let blocks = 0, scree = 0;
  // fallen blocks
  for (let n = 0; n < 64; n++) {
    const px = rng(), out = rng(), big = rng(), w = rng(), d = rng(), hh = rng(), yaw = rng() * 6.2832, tip = (rng() - 0.5) * 0.7, tint = 0.86 + 0.22 * rng(), jit = dice24(rng);
    const x = -78 + 156 * px, size = big < 0.1 ? 1.6 + 1.2 * big * 10 : 0.5 + 0.9 * big, z = footZ(x) + 0.5 + 0.6 * size + 5.5 * out * out;
    if (P.bankDistance(x, z) < 1.3 + size || Math.abs(x) < NOTCH + 2.5) continue;
    stone(E, jit, x, dryHeight(x, z) - 0.05, z, size * (0.8 + 0.8 * w), size * (0.45 + 0.4 * hh), size * (0.7 + 0.6 * d), yaw, tip, 0.12, 0.14 * size, tint);
    blocks++;
  }
  // scree: against the face, and in fans under the clefts
  for (let n = 0; n < 170; n++) {
    const px = rng(), out = rng(), sz = rng(), yaw = rng() * 6.2832, tip = (rng() - 0.5) * 0.9, tint = 0.82 + 0.26 * rng(), fan = rng(), spread = rng() - 0.5, jit = dice24(rng);
    const cx = clefts.length && fan < 0.55 ? clefts[Math.floor(fan / 0.55 * clefts.length) % clefts.length] : null;
    const x = cx !== null ? cx + spread * 5 * (0.3 + out) : -78 + 156 * px, size = 0.22 + 0.4 * sz * sz, z = footZ(x) + 0.1 + 2.6 * out * out;
    if (P.bankDistance(x, z) < 1.0 + size || Math.abs(x) < NOTCH + 2.5) continue;
    stone(E, jit, x, dryHeight(x, z) - 0.03 + (cx !== null ? 0.5 * (1 - out) : 0), z, size * 1.3, size * 0.8, size, yaw, tip, 0.35, 0.16 * size, tint);
    scree++;
  }
  // the rim's own stones: blocks left standing along the scar's top edge, here and there, so that the edge is broken
  // stone and never one line of turf (none by the fall, none near the flown line)
  let rimStones = 0;
  for (let n = 0; n < 60; n++) {
    const px = rng(), back = rng(), sz = rng(), w = rng(), hh = rng(), yaw = (rng() - 0.5) * 0.9, tip = (rng() - 0.5) * 0.3, tint = 0.86 + 0.2 * rng(), jit = dice24(rng);
    const x = -78 + 156 * px, size = 0.4 + 0.75 * sz * sz;
    let i = 0; while (i + 2 < N && cols[i + 1].x < x) i++;
    let k = 0; while (k < S.K - 1 && S.YT[k][i] < S.rim[i] - 1e-3) k++;
    const z = Math.min(F[k][i], F[k][i + 1]) - 0.15 - 0.5 * size - 0.8 * back * back, y = S.rim[i] - 0.06;
    if (Math.abs(x) < NOTCH + 3.5 || P.routeDistance(x, y + size, z) < 6) continue;
    stone(E, jit, x, y, z, size * (0.9 + 0.9 * w), size * (0.5 + 0.5 * hh), size * 0.8, yaw, tip, 0.1, 0.12 * size, tint);
    rimStones++;
  }
  return { blocks, scree, rim: rimStones };
}
