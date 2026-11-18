// valley-inside-the-works, the chocolate: THE FOOT OF THE FALL. Thick liquid FOLDS where it lands: each tongue, swinging
// forward and back in its last metres, lays itself down in fat glossy folds, back and forth like poured batter: a
// rolling heap into which the sheet plunges, most of a metre high under the heaviest tongue with a fold on it, as wide
// as the tongue (its height: the lip file's foldOf). The folds are rounded ridges
// that are laid at the landing line, are pushed out before the sheet (and, less far, behind it, half a beat later),
// widen and sink (moved by the family's vertex shader: the place and the world's clock alone). Beyond the pile's
// foot they run on over the pool as low rings: ARCS, each centred where its own tongue lands; the heaviest tongue's
// travel a dozen metres before they are gone, the others' only a few, and each is stronger one way than another.
// A few thick blots lie on the banks to both sides. No spray and no mist; the pale froth that lies in a ragged collar
// round the heap's foot and drifts off downstream, the churning of the heap's face and the pool's fat slow rings are
// the shader's (the glsl file: standing(), where the fall lands).
import * as P from './valley-inside-the-works-plan.js';
import { streamV, smooth, LIFT } from './valley-inside-the-works-chocolate-river.js';
import { fallFeet, ROCK_Z } from './valley-inside-the-works-chocolate-lip.js';

const FAR = 3;                                   // how soon the rings beyond a pile are drawn wider
// the folds and their rings at (x, z): h the height of the pile; amp, ph, gx, gz, rate: the travelling fold or ring
// there (its height, its phase, the way it runs, its phase per metre)
function field(feet, x, z) {
  let sum = 0, best = null, a1 = 0, a2 = 0;
  for (const f of feet) {
    // (a pile lies along the line its tongue lands on; behind that line it is squeezed toward the rock; its foot is uneven)
    const L = 0.85 * f.a, ex = x - f.x - Math.min(Math.max(x - f.x, -L), L), ez = (z - f.z) * (z < f.z ? 1.8 : 1), d = Math.hypot(ex, ez), an = Math.atan2(ez, ex);
    const R = f.R * (1 + 0.12 * Math.sin(3 * an + f.p1) + 0.07 * Math.sin(5 * an + f.p2) + 0.07 * Math.sin(2.1 * x + f.p3)), q = d / R;
    const h = f.H * Math.pow(Math.max(1 - q * q, 0), 1.5);
    sum += h * h * h * h;
    const out = Math.max(d - R, 0), way = 0.6 + 0.4 * Math.sin(2.3 * an + f.p3);          // (a ring is stronger one way than another)
    const amp = q < 1 ? f.A * smooth(0, 0.18, q) * (1 - 0.45 * smooth(0.3, 1, q)) : 0.55 * f.A * way * (1 - smooth(0.4, f.reach - R, out));
    if (amp > a1) { a2 = a1; a1 = amp; best = { f, d, ex, ez, q, R, out, an }; } else if (amp > a2) a2 = amp;
  }
  const o = { h: Math.sqrt(Math.sqrt(sum)), amp: 0, ph: 0, gx: 0, gz: 1, rate: 1 };
  if (best && a1 - a2 > 1e-4) {
    const l = Math.max(best.d, 0.05), f = best.f, K = 2 * Math.PI * f.n, k1 = 0.75 * K / best.R;   // (k1: the phase per metre at the pile's foot)
    const turn = 0.5 * Math.PI * (1 - Math.sin(best.an));                                    // (laid back and forth: behind the line half a beat later)
    o.amp = a1 - a2; o.gx = best.ex / l; o.gz = best.ez / l;
    if (best.q < 1) { o.ph = K * Math.pow(best.q, 0.75) + f.po + turn; o.rate = k1 * Math.pow(Math.max(best.q, 0.15), -0.25); }
    else { o.ph = K + k1 * FAR * Math.log(1 + best.out / FAR) + f.po + turn; o.rate = k1 / (1 + best.out / FAR); }
  }
  return o;
}

// The folds and the rings: one fine patch of the pool's face from the rock behind the sheet to 13 m out, widening
// with the pool. F: fallShapes(rng). It is built a few rows at a time: run it to its end, with a breath at each yield.
export function* addHeap(acc, F) {
  const top = Math.max(...F.tongues.map((t) => t.b));
  const feet = fallFeet(F).map((f, i) => ({ ...f, R: 1.1 + 2.2 * f.H, A: 0.1 + 0.12 * f.H, n: Math.max(Math.round((1.1 + 2.2 * f.H) / 0.55), 2), po: f.num, reach: f.b >= top ? 12 : 4.6 + 2.2 * f.H,
    p1: 1.7 * i + F.wave[0], p2: 2.9 * i + F.wave[1], p3: 4.1 * i + F.wave[2] }));
  const lineZ = (x) => {                           // the line the tongues land on, across the pool
    let i = 0;
    while (i + 2 < feet.length && x > feet[i + 1].x) i++;
    const a = feet[i], b = feet[i + 1], t = Math.min(Math.max((x - a.x) / (b.x - a.x), 0), 1);
    return a.z + (b.z - a.z) * t;
  };
  // the rows, by their distance before the landing line (under 0: that part of the way back to the rock behind the sheet)
  const S = [-1, -0.85, -0.7, -0.58, -0.48, -0.4, -0.33, -0.27, -0.21, -0.16, -0.11, -0.07, -0.035];
  for (let s = 0; s < 4.21; s += 0.14) S.push(s);
  for (let s = 4.5; s < 7.51; s += 0.3) S.push(s);
  for (let s = 8; s < 13.51; s += 0.5) S.push(s);
  const NX = 68, e = 0.05;
  let prev = null;
  for (let k = S.length - 1; k >= 0; k--) {         // from downstream going upstream, as the river's rows run
    const row = [];
    for (let j = 0; j <= NX; j++) {
      const xn = 2 * j / NX - 1, zl = lineZ(8.2 * xn), s = S[k] < 0 ? S[k] * (zl - (ROCK_Z + 0.15)) : S[k], z = zl + s;
      const open = smooth(-37.9, -36.9, z), wide = Math.max(z + 36.9, 0);
      const x = 0.6 * P.riverX(z) * open + xn * (8.5 - 0.6 * open + 0.45 * wide), zr = Math.max(z, P.FALL_Z);
      const c = P.riverX(z), half = P.riverHalfWidth(zr), sn = (x - c) / half, q = field(feet, x, z);
      const side = 1 - smooth(0.8, 0.98, Math.abs(xn)) * open, amp = q.amp * (1 - smooth(0.78, 0.98, Math.abs(xn)) * open) * (1 - smooth(11, 13.5, s));
      // the way it runs: the river's own way at the patch's edge, outward from the landing where the ridges travel
      let fx = (P.riverX(z + e) + sn * P.riverHalfWidth(Math.max(z + e, P.FALL_Z))) - (P.riverX(z - e) + sn * P.riverHalfWidth(Math.max(z - e, P.FALL_Z))), fz = 2 * e;
      const l = Math.hypot(fx, fz), m = smooth(0, 0.02, amp);
      fx = (fx / l) * (1 - m) + q.gx * m; fz = (fz / l) * (1 - m) + q.gz * m;
      const l2 = Math.max(Math.hypot(fx, fz), 1e-3), rate = m > 0 ? q.rate : 1;
      row.push(acc.vertex(x, P.riverY(zr) + LIFT + 0.035 + q.h * side, z, sn * 8, streamV(z), fx / l2 * rate, 0, fz / l2 * rate, 1.5, Math.min(Math.abs(sn), 1),
        { kind: 0, scale: 8 / half, half: 8, move: [amp, 0, q.ph, 0] }));
    }
    if (prev) acc.strip(prev, row);
    prev = row;
    if (k % 4 === 0) yield k;
  }
}
// THE BLOTS: a few thick blots of chocolate thrown out of the folding, lying on the banks at the scar's foot to both
// sides of the pool: each a low fat dome with an uneven edge, drawn out a little the way it was thrown, and round
// the big ones some smaller. They lie on the plan's ground (groundHeight) and stand still.
export function addSplashes(acc, F) {
  const T = [0.02, 0.4, 0.7, 0.88, 0.97, 1, 1];     // rings from the middle to the edge; the last is the edge's foot, in the ground
  F.splash.forEach((u, n) => {
    const sd = n < 5 ? -1 : 1, big = n % 5 < 2, R = big ? 0.45 + 0.3 * u[2] : 0.14 + 0.12 * u[2], H = big ? 0.14 + 0.08 * u[3] : 0.07 + 0.04 * u[3];
    const cz = (big ? -36.3 + 1.45 * R + 2.3 * u[1] : -36.4 + 1.45 * R + 3.2 * u[1]);
    const cx = P.riverX(cz) + sd * (P.riverHalfWidth(cz) + 1.2 + R + (big ? 1.2 : 2.6) * u[0]);
    let ax = cx, az = cz - (P.FALL_Z + 2.5);       // the way it was thrown: away from the fall's foot
    const al = Math.hypot(ax, az); ax /= al; az /= al;
    const seg = big ? 14 : 9, p1 = 6.28 * u[4], p2 = 6.28 * u[5];
    let inner = null;
    T.forEach((t, k) => {
      const ring = [];
      for (let j = 0; j < seg; j++) {
        const a = 2 * Math.PI * j / seg, rho = t * R * (1 + 0.22 * Math.sin(3 * a + p1) + 0.12 * Math.sin(5 * a + p2));
        const along = 1.45 * rho * Math.cos(a), across = rho * Math.sin(a), x = cx + along * ax + across * az, z = cz + along * az - across * ax;
        const y = P.groundHeight(x, z) + (k === T.length - 1 ? -0.15 : H * Math.sqrt(Math.max(1 - t * t * t * t, 0)) - 0.03);
        ring.push(acc.vertex(x, y, z, x - P.riverX(z), streamV(z), ax, 0, az, 0, 0, { kind: 1, half: -8 }));
      }
      if (inner) for (let j = 0; j < seg; j++) acc.idx.push(ring[j], ring[(j + 1) % seg], inner[j], ring[(j + 1) % seg], inner[(j + 1) % seg], inner[j]);
      inner = ring;
    });
  });
}
