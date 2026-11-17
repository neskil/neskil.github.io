// THE SWORDBILL'S ROUND
// The feeding round of a sword-billed hummingbird through an Andean cloud forest built fifteen times life size.
// We are the bird: its black bill lies at the bottom of the frame and its wing blur fills the lower corners.
// Out of a tree-fern bowl and along a mossy limb to a pink passionflower, a chase after a long-tailed sylph
// between two trunks, then one round of the leaning red angel's-trumpet tree (src/parts/swordbill-round.js):
// a sunlit bell, the back of the crown over the trunk, five backlit bells, a dive under the crown, up the
// throat of the largest bell and out through the nave between the two limbs.
// Frame: +X east, -Z north, heights relative to the entry. No ground is seen: trunks stand out of the mist.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import { makeFlock } from '../kit/fauna.js';
import { makeWaterfall } from '../kit/water.js';
import { buildHero } from '../parts/swordbill-round.js';

const PALETTE = ['#E6EEE9', '#9FC6B4', '#5F8F3A', '#17301F', '#F2C83A', '#D8321E', '#5A3FC8'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V3(0, 1, 0);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const bellW = (x, a, b, f) => sstep(a, a + f, x) * (1 - sstep(b - f, b, x));

// ---- the flight line: control points from the tree's anchors (A, object space) and its place (O) ------------
// routeOld is the line this forest was grown round: every plant asked it for room when it was placed, and still does
// (pathOld in build), so that each seed keeps the forest it had. The flight itself follows route(), further down.
function routeOld(A, O) {
  const W = (p) => p.clone().add(O), c45 = Math.SQRT1_2;
  const T = (x, y, z) => V3(O.x + (x + z) * c45, O.y + y, O.z + (z - x) * c45);       // tree frame (x lateral, z down-lean) -> world
  const ring = (deg, R, y) => { const a = deg * Math.PI / 180; return T(R * Math.sin(a), y, 26 + R * Math.cos(a)); };
  const s1 = A.stopSun, s2 = A.stopBacklit, s3 = A.stopThroat;
  const ap1 = W(s1.approach), ap2 = W(s2.approach), vw2 = W(s2.view), ap3 = W(s3.approach), m3 = W(s3.flower);
  const N0 = W(A.naveFoot), PS = W(A.portalSeat.position), nd = PS.clone().sub(N0).normalize();
  const ax3 = s3.axis, m1 = W(s1.flower), m2 = W(s2.flower);
  const look2 = vw2.clone().sub(ap2).normalize(), right2 = T(-1, 0, 0).sub(T(0, 0, 0));
  const F = FLOWER;
  const pts = [
    [0, 0, 0], [0, 0, -28], [1.6, 0.5, -50], [5.2, 2.0, -64], [F.x - 0.6, F.y - 2.1, F.z + 5.2], [F.x - 0.1, F.y - 1.3, F.z + 2.3],   // entry, limb, rise under the passionflower
    [F.x + 3.4, F.y - 3.2, F.z - 3.5], [7.5, -0.5, -96], [-2.5, -3, -110.5],            // slide right and down, dash: right of the dark trunk
    [2.5, -4.5, -125], [20, -6.2, -136.5], [38, -7.6, -141], [51, -8.6, -147.5], [58.5, -8.4, -157.5],   // left of the next, out over the ravine mouth
    [ap1.x + 19.5, ap1.y - 2.1, ap1.z + 34], [ap1.x + 15, ap1.y - 1.1, ap1.z + 17], [ap1.x + 9, ap1.y - 0.2, ap1.z + 5.5],   // the tree side-on
    ap1, ap1.clone().lerp(m1, 0.5),                                                     // stop two: head-on, then off to the north
    V3(m1.x + 3.5, m1.y - 0.3, m1.z - 0.7), V3(m1.x + 3.0, m1.y + 0.5, m1.z - 3.4),
    ring(60, 36.5, 21), ring(85, 41, 23), ring(115, 42, 26), ring(145, 41.5, 28), ring(172, 40, 29), ring(196, 39.5, 30),
    ap2, ap2.clone().lerp(m2, 0.46),                                                    // stop three: up at the five, then off to the right and down
    m2.clone().addScaledVector(look2, -4.0).addScaledVector(right2, 0.8), m2.clone().addScaledVector(look2, -3.3).addScaledVector(right2, 3.4).add(V3(0, -1.5, 0)),
    T(-29, 30, 9), T(-31.5, 19, 22.5), T(-25, 7, 36),                                  // the dive: down through the south-west skirt of the crown
  ];
  // THE RISE: a climbing spiral under the foot of the nave, a turn and a half round the line the nave would follow if it
  // went on down, so the portal stays overhead as its window. It ends on the approach to the throat of the largest bell.
  for (let k = 0; k <= 10; k++) pts.push(RISE(k / 8, T));
  pts.push(T(2.6, 2.9, 53.2), m3.clone().addScaledVector(ax3, 14.5), m3.clone().addScaledVector(ax3, 10.2));
  // the throat: up its axis to 3.9 m, then off to the left and down, once more round the foot of the nave and onto its line
  pts.push(m3.clone().addScaledVector(ax3, 6.5), m3.clone().addScaledVector(ax3, 3.9),
    T(2.9, 15.4, 38.9), T(-2.2, 15.0, 37.9), T(-6.4, 12.4, 40.8), T(-7.9, 8.6, 45.6), T(-6.4, 5.9, 51.0), T(-2.2, 4.2, 53.9), T(2.0, 3.9, 52.4), T(3.6, 5.2, 48.2), T(2.6, 8.2, 44.2), T(0.9, 11.8, 41.2),
    N0.clone().addScaledVector(nd, 6), N0.clone().addScaledVector(nd, 22), N0.clone().addScaledVector(nd, 40), PS);
  return pts.map((p) => (p.isVector3 ? [p.x, p.y, p.z] : p));
}
// the spiral of the rise in the tree's own frame: phi in turns from its west point (heading down-lean), anticlockwise from above
const RISE_Y = [-2.4, -3.0, -3.1, -2.6, -1.9, -1.2, -0.6, 0.1, 0.8, 1.6, 2.5];
const RISE = (phi, T) => { const th = Math.PI * (1 - 2 * phi); return T(-3.9 + 8.6 * Math.cos(th), RISE_Y[Math.round(phi * 8)], 46.9 + 8.6 * Math.sin(th)); };
// The flight: the old line as far as the five backlit bells (with more room past the dark trunk of the chase), then out
// over the ravine to the young trumpet tree on the broken trunk, where another swordbill is feeding with the waterfall
// beyond it; round it and back to the old tree from the west, in under its crown, up the throat of the largest bell and
// out by the nave. Its length is the old line's to the centimetre, so every place along the first six tenths keeps its u.
function route(A, O) {
  const W = (p) => p.clone().add(O), pts = routeOld(A, O).slice(0, 32).map((p) => V3(p[0], p[1], p[2]));
  const N0 = W(A.naveFoot), PS = W(A.portalSeat.position), nd = PS.clone().sub(N0).normalize(), m3 = W(A.stopThroat.flower), ax3 = A.stopThroat.axis;
  pts[8].set(ROOM[0], -3, -110.5); pts[9].set(ROOM[1], -4.5, ROOM[2]);
  // the way out is laid in the feeder's own frame: f metres on along the heading we pass it on, l metres to the left of that
  const add = (x, y, z) => pts.push(V3(x, y, z)), loc = (f, l, y) => pts.push(V3(FEED_C.x + FEED_F.x * f + FEED_L.x * l, y, FEED_C.z + FEED_F.z * f + FEED_L.z * l));
  add(-34.2, 3.3, -186.5); loc(-17, -12, 2.4); loc(-15.2, -1.8, 1.8); loc(-9, 0, 1.5); loc(0, 0, 1.5);                         // south out of the dive, round to the west-north-west, level along the ravine
  loc(6.5, 0, 1.5); loc(12.5, -0.4, 1.3); loc(16.6, -3, 0.6); loc(17.6, -7.6, -0.8); loc(14.6, -11.6, -2.6); loc(8, -13, -4.4);      // past the feeder, on toward the fall, and round by the north
  add(-30, -13, -185.5); add(-12, -17.6, -182.5); add(2.5, -20.9, -181); add(11.5, -22.6, -183.5); add(17.2, -21.2, -187.8);                                                // back, in under the south-west skirt
  // the last two knots under the skirt are drawn SKIRT of the way toward the straight line from the knot before them to the first knot on the bell's axis
  // (toward the points 0.42 and 0.75 along it: about as far along it as each knot stands along the way in, 0.42 and 0.74 by the chords): 1.35 and 1.32 m, to 15.0 and 14.6 m below the mouth plane, 11.2 and 4.2 m from the axis.
  // That shortens the way in by as much as the slide past the bell lengthens the line (1.544 m, measured outside this file), so that with SKIRT as typed
  // the whole line has the length named at SKIRT: the keys typed in u along the rest of the line are typed for a line of that length.
  { const n = pts.length, a = pts[n - 3], b = m3.clone().addScaledVector(ax3, 11.5); pts[n - 2].lerp(a.clone().lerp(b, 0.42), SKIRT); pts[n - 1].lerp(a.clone().lerp(b, 0.75), SKIRT); }
  for (const d of [11.5, 6.5, 3.9]) pts.push(m3.clone().addScaledVector(ax3, d));                                                                                           // up the throat
  // the slide: off the axis below the mouth and round the rim to the nave. The knot after the throat stands 1 m up the nave from its foot and 1 m in toward
  // the bell's axis: 1.7 m below the mouth plane, 3.9 m from the axis. The line is 0.25 m off the axis 3.6 m below the mouth and passes the mouth plane 4.47 m out:
  // the rim's lobes reach 1.7 m at rest and their swing carries them up to 0.59 m further (0.112 rad on a lever of 5.25 m), which leaves 2.0 m of clear air
  // and more between them and the line. These figures are measured outside this file; no line here computes or checks them.
  const slide = N0.clone().addScaledVector(nd, 1), out = slide.clone().sub(m3); out.addScaledVector(ax3, -out.dot(ax3)).normalize();   // out: straight away from the bell's axis
  pts.push(slide.addScaledVector(out, -1), N0.clone().addScaledVector(nd, 10), N0.clone().addScaledVector(nd, 24), N0.clone().addScaledVector(nd, 42), PS);
  return pts.map((p) => [p.x, p.y, p.z]);
}
const ROOM = [2.2, 1.365, -128.784];             // the chase passes the dark trunk this far east
const SKIRT = 0.2951871888515;                 // solved, not chosen, given the shares 0.42 and 0.75 and the slide's 1 m and 1 m: the value for which makePath(route(A, ORIGIN)).length is 665.6614332746452 m. Nothing recomputes it: if a knot, an anchor, a share or the slide changes, it must be solved again
const FEED_C = V3(-60, 1.5, -155.38015);               // abeam of the swordbill less 4.6 m: we pass it on our left (z is solved so that the line keeps its length: u 0.70 falls 2.6 m short of here)
const FEED_TH = 0.5, FEED_F = V3(), FEED_L = V3(), turnTo = (th) => { FEED_F.set(-Math.cos(th), 0, -Math.sin(th)); FEED_L.set(FEED_F.z, 0, -FEED_F.x); }; turnTo(FEED_TH);      // the heading we pass it on (north of west), and our left
const FEED = V3(), SNAG = { x: 0, z: 0, r: 4.4, top: -3.6 };
const place = () => { FEED.copy(FEED_C).addScaledVector(FEED_F, 4.6).addScaledVector(FEED_L, 3.7); FEED.y = 3.4; SNAG.x = FEED.x + FEED_F.x * 5.1 + FEED_L.x * 7.8; SNAG.z = FEED.z + FEED_F.z * 5.1 + FEED_L.z * 7.8; };     // mouth of the young tree's great bell; the broken trunk it grows on
place();
const FLOWER = V3(7.5, 6.2, -80);            // mouth of the passionflower (stop one)
const ORIGIN = V3(-18.4, -25, -222.4);       // root collar of the trumpet tree; its crown centre is then (0, 15, -204)
// path fractions of the beats (the route above is 666 m long whatever the seed)
const U = { flare: 0.136, chase0: 0.15, chase1: 0.30, cock0: 0.305, cock1: 0.39, bee0: 0.388, bee1: 0.418, fight0: 0.455, fight1: 0.59, eagle0: 0.47, eagle1: 0.60, out0: 0.598, out1: 0.668, feed0: 0.585, feed1: 0.80, back0: 0.742, back1: 0.842, back2: 0.868, last0: 0.925 };
// speed along the path compared with the mean: dashes, and a held breath at each flower and beside the feeding swordbill
const PACE = [[0, 1.45], [0.07, 1.5], [0.094, 0.5], [0.104, 0.4], [0.124, 0.42], [0.142, 1.3], [0.17, 1.7], [0.28, 1.65], [0.31, 1.35], [0.365, 1.25],
  [0.381, 0.55], [0.389, 0.4], [0.411, 0.42], [0.43, 1.2], [0.5, 1.3], [0.562, 1.2], [0.578, 0.55], [0.586, 0.4], [0.607, 0.42], [0.628, 1.1],
  [0.66, 1.25], [0.682, 0.7], [0.692, 0.45], [0.712, 0.45], [0.728, 0.9], [0.762, 1.1], [0.795, 1.35], [0.83, 1.35], [0.868, 0.95], [0.888, 0.6], [0.896, 0.45], [0.908, 0.45], [0.92, 0.8], [0.94, 0.92], [1, 0.95]];
function pace(u) {
  let i = 1; while (i < PACE.length - 1 && PACE[i][0] < u) i++;
  const a = PACE[i - 1], b = PACE[i];
  return lerp(a[1], b[1], sstep(a[0], b[0], u));
}
export const _dev = { route, routeOld, get ORIGIN() { return ORIGIN; }, get FLOWER() { return FLOWER; }, get FEED() { return FEED; }, get SNAG() { return SNAG; }, get P() { return { ROOM, FEED_C }; }, get FEED_F() { return FEED_F; }, get FEED_L() { return FEED_L; }, routeWith(A, O, xc, zc, th = FEED_TH) { const x0 = FEED_C.x, z0 = FEED_C.z; FEED_C.x = xc; FEED_C.z = zc; turnTo(th); const r = route(A, O); FEED_C.x = x0; FEED_C.z = z0; turnTo(FEED_TH); return r; }, pace };   // for offline checks of the flight line

// ---- a growable vertex buffer: position, normal, colour, uv, and four free floats ------------------------------
class Geo {
  constructor() { this.p = []; this.n = []; this.c = []; this.uv = []; this.w = []; this.idx = []; this.count = 0; this.xf = null; this.nm = null; }
  // every vertex pushed after setXf(m) is moved by m (a rigid or scaling Matrix4); setXf(null) stops it
  mark() { return [this.count, this.idx.length]; }
  cut(m) { this.count = m[0]; this.p.length = this.n.length = this.c.length = m[0] * 3; this.uv.length = m[0] * 2; this.w.length = m[0] * 4; this.idx.length = m[1]; }
  setXf(m) { this.xf = m; if (m) this.nm = new THREE.Matrix3().getNormalMatrix(m); return this; }
  v(p, n, c, u = 0, v = 0, w0 = 0, w1 = 0, w2 = 1, w3 = 0) {
    if (this.xf) {
      const e = this.xf.elements, m = this.nm.elements, x = p.x, y = p.y, z = p.z, a = n.x, b = n.y, d = n.z;
      let nx = m[0] * a + m[3] * b + m[6] * d, ny = m[1] * a + m[4] * b + m[7] * d, nz = m[2] * a + m[5] * b + m[8] * d; const l = Math.hypot(nx, ny, nz) || 1;
      this.p.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]); this.n.push(nx / l, ny / l, nz / l);
    } else { this.p.push(p.x, p.y, p.z); this.n.push(n.x, n.y, n.z); }
    this.c.push(c.r, c.g, c.b); this.uv.push(u, v); this.w.push(w0, w1, w2, w3);
    return this.count++;
  }
  // make every triangle's winding agree with its vertex normals, so gl_FrontFacing means "outside"
  fixWinding() {
    const P = this.p, N = this.n, I = this.idx;
    for (let i = 0; i < I.length; i += 3) {
      const a = I[i] * 3, b = I[i + 1] * 3, c = I[i + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      const d = (uy * vz - uz * vy) * (N[a] + N[b] + N[c]) + (uz * vx - ux * vz) * (N[a + 1] + N[b + 1] + N[c + 1]) + (ux * vy - uy * vx) * (N[a + 2] + N[b + 2] + N[c + 2]);
      if (d < 0) { const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; }
    }
    return this;
  }
  // rings along z: { z, y, x, rx, ry, c | cf(angle) -> Color, w1, w2 }; w = the four free floats (w1, w2 overridable per ring)
  loft(rings, radial, w = [0, 0, 0, 1]) {
    const rows = [], p = V3(), n = V3(), L = rings.length;
    for (let i = 0; i < L; i++) {
      const r = rings[i], a0 = rings[Math.max(0, i - 1)], a1 = rings[Math.min(L - 1, i + 1)];
      const sl = -((a1.rx + a1.ry) - (a0.rx + a0.ry)) * 0.5 / ((a1.z - a0.z) || 1e-3), row = [];
      for (let j = 0; j <= radial; j++) {
        const a = (j / radial) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        p.set((r.x || 0) + c * r.rx, (r.y || 0) + s * r.ry, r.z);
        n.set(c * r.ry, s * r.rx, 0).normalize(); n.z = clamp(sl, -3, 3); n.normalize();
        row.push(this.v(p, n, r.cf ? r.cf(a) : r.c, j / radial, i / (L - 1), w[0], r.w1 ?? w[1], r.w2 ?? w[2], w[3]));
      }
      rows.push(row);
    }
    for (let i = 0; i < L - 1; i++) for (let j = 0; j < radial; j++) this.quad(rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]);
    return this;
  }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  tri(a, b, c) { this.idx.push(a, b, c); }
  // a tube round a polyline with parallel-transported rings. rad(i, t), col(i, t, ang) -> Color, lump(i, ang, len) -> factor, w(i, t) -> [4]
  tube(pts, radial, rad, col, lump, wOf, capEnd) {
    const n = pts.length, t = V3(), nrm = V3(), bin = V3(), prevT = V3(), q = new THREE.Quaternion(), d = V3(), pp = V3(), rows = [];
    t.subVectors(pts[1], pts[0]).normalize();
    nrm.set(1, 0, 0); if (Math.abs(t.x) > 0.9) nrm.set(0, 0, 1);
    nrm.addScaledVector(t, -nrm.dot(t)).normalize();
    let len = 0;
    for (let i = 0; i < n; i++) {
      prevT.copy(t);
      if (i > 0) len += pts[i].distanceTo(pts[i - 1]);
      if (i < n - 1) t.subVectors(pts[i + 1], pts[Math.max(0, i - 1)]).normalize(); else t.subVectors(pts[i], pts[i - 1]).normalize();
      if (i > 0) { q.setFromUnitVectors(prevT, t); nrm.applyQuaternion(q); nrm.addScaledVector(t, -nrm.dot(t)).normalize(); }
      bin.crossVectors(t, nrm);
      const tt = i / (n - 1), r = rad(i, tt), row = [], ww = wOf ? wOf(i, tt) : [0, 0, 1, 0];
      for (let j = 0; j <= radial; j++) {
        const a = (j / radial) * Math.PI * 2;
        d.set(0, 0, 0).addScaledVector(nrm, Math.cos(a)).addScaledVector(bin, Math.sin(a));
        const rr = r * (lump ? lump(i, a, len) : 1);
        pp.copy(pts[i]).addScaledVector(d, rr);
        row.push(this.v(pp, d, col(i, tt, a), j / radial, len, ww[0], ww[1], ww[2], ww[3]));
      }
      rows.push(row);
    }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) this.quad(rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]);
    if (capEnd) { const c = this.v(pts[n - 1].clone().addScaledVector(t, rad(n - 1, 1) * 0.6), t, col(n - 1, 1, 0), 0.5, len, 0, 0, 1, 0); for (let j = 0; j < radial; j++) this.tri(rows[n - 1][j], rows[n - 1][j + 1], c); }
    return this;
  }
  // a flat ribbon through pts, width(t), facing `face`; uv.x -1..1 across, uv.y 0..1 along. wOf(t) -> [4]
  ribbon(pts, width, face, col, wOf, um = 0) {
    const n = pts.length, t = V3(), s = V3(), nn = V3(), a = V3(), b = V3(); let pa = -1, pb = -1;
    for (let i = 0; i < n; i++) {
      t.subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
      s.crossVectors(t, face); if (s.lengthSq() < 1e-6) s.set(1, 0, 0); s.normalize(); nn.crossVectors(s, t).normalize();
      const tt = i / (n - 1), w = width(tt), ww = wOf ? wOf(tt) : [0, 0, 1, 0], c = col(tt);
      a.copy(pts[i]).addScaledVector(s, -w); b.copy(pts[i]).addScaledVector(s, w);
      const uu = um ? w * um : 1, ia = this.v(a, nn, c, -uu, tt, ww[0], ww[1], ww[2], ww[3]), ib = this.v(b, nn, c, uu, tt, ww[0], ww[1], ww[2], ww[3]);
      if (i > 0) this.quad(pa, pb, ib, ia);
      pa = ia; pb = ib;
    }
    return this;
  }
  // a curved sheet: P(t, s, out) -> point for t 0..1 along and s -1..1 across; uv = (s, t); col(t, s) -> Color; wOf(t, s) -> [4]
  grid(rows, cols, P, col, wOf) {
    const a = V3(), b = V3(), c = V3(), d = V3(), n = V3(), p = V3(), ix = [], e = 0.02;
    for (let i = 0; i <= rows; i++) {
      const t = i / rows, row = [];
      for (let j = 0; j <= cols; j++) {
        const s = -1 + 2 * j / cols;
        P(Math.min(1, t + e), s, a); P(Math.max(0, t - e), s, b); P(t, Math.min(1, s + e), c); P(t, Math.max(-1, s - e), d);
        n.crossVectors(a.sub(b), c.sub(d)); if (n.lengthSq() < 1e-12) n.set(0, 1, 0); n.normalize();
        P(t, s, p); const w = wOf ? wOf(t, s) : [0, 0, 1, 0];
        row.push(this.v(p, n, col(t, s), s, t, w[0], w[1], w[2], w[3]));
      }
      ix.push(row);
    }
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) this.quad(ix[i][j], ix[i][j + 1], ix[i + 1][j + 1], ix[i + 1][j]);
    return this;
  }
  // wound = true when fixWinding() has already been run (a large mesh does the two in separate steps)
  build(wound = false) {
    if (!wound) this.fixWinding();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aUV', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aW', new THREE.Float32BufferAttribute(this.w, 4));
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    return g;
  }
}
function spaced(ctrl, n) { return new THREE.CatmullRomCurve3(ctrl, false, 'centripetal').getSpacedPoints(n); }

// ---- GLSL shared by every material of the world --------------------------------------------------------------
const GL_COMMON = /* glsl */`
uniform float uTime; uniform vec3 uSunDir, uSunCol, uSkyCol, uGroundCol, uFogCol, uWindV, uWindN; uniform vec4 uFogP;
float h21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float gust(vec3 p) {
  float ph = dot(p, uWindN) * 0.085 - uTime * 1.15;
  float a = 0.5 + 0.5 * sin(ph), b = 0.5 + 0.5 * sin(ph * 0.37 + p.y * 0.05 + 1.3);
  return a * a * (0.35 + 0.65 * b);
}
// mist: the scene's exp2 fog, thicker up in the cloud, and below us a cloud sea filling the ravine: its density grows
// exponentially below the level uFogP.y (scale height uFogP.w) and is integrated along the line of sight
float mistAmt(vec3 wp, vec3 cam) {
  vec3 dv = wp - cam; float d = length(dv);
  float t0 = d * uFogP.x; t0 = t0 * t0 * (1.0 + 6.0 * smoothstep(55.0, 130.0, wp.y));
  float a = max((cam.y - uFogP.y) / uFogP.w, -1.6), b = max((wp.y - uFogP.y) / uFogP.w, -1.6), db = b - a;
  float F = abs(db) > 0.01 ? (exp(-a) - exp(-b)) / db : exp(-a);
  return 1.0 - exp(-(t0 + uFogP.z * d * F));
}
vec3 rotAA(vec3 v, vec3 k, float a) { float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * (dot(k, v) * (1.0 - c)); }
`;
const GL_LIT = /* glsl */`
// light sliding through the canopy: slow patches of sun in a plane across the sun's direction
float dapple(vec3 wp, float k) {
  vec3 q = wp - uSunDir * dot(wp, uSunDir);
  float d = vn(q.xz * 0.06 + q.y * 0.045 + uTime * 0.025) * 0.65 + vn(q.xz * 0.19 - q.y * 0.13 - uTime * 0.04) * 0.35;
  return mix(1.0, smoothstep(0.4, 0.62, d), k);
}
vec3 bumpN(vec3 N, vec3 wp, float h, float k) {
  vec3 sx = dFdx(wp), sy = dFdy(wp); float hx = dFdx(h), hy = dFdy(h);
  vec3 r1 = cross(sy, N), r2 = cross(N, sx); float det = dot(sx, r1);
  vec3 g = (det < 0.0 ? -1.0 : 1.0) * (hx * r1 + hy * r2);
  return normalize(abs(det) * N - k * g + vec3(0.0, 1e-7, 0.0));
}
// base colour, normal, view, sun visibility, translucency, gloss -> lit colour
vec3 shade(vec3 base, vec3 N, vec3 V, float sunVis, float tr, float gloss) {
  float ndl = dot(N, uSunDir);
  float dif = max(ndl, 0.0) * sunVis, back = max(-ndl, 0.0) * sunVis;
  vec3 amb = mix(uGroundCol, uSkyCol, N.y * 0.5 + 0.5);
  vec3 tcol = base * (0.45 + 1.5 * base);
  vec3 col = base * (amb + uSunCol * dif) + tcol * uSunCol * back * tr;
  float fres = 1.0 - abs(dot(N, V)); fres *= fres;
  col += uSkyCol * fres * (0.06 * min(1.0, gloss * 8.0) + 0.25 * gloss) + tcol * uSunCol * fres * tr * 0.25 * sunVis;
  vec3 H = normalize(uSunDir + V + vec3(0.0, 1e-4, 0.0));
  float ndh = max(dot(N, H), 0.0); float sp = ndh * ndh; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  col += uSunCol * sp * gloss * sunVis;
  return col;
}
`;
// SURF: every opaque surface of the world (bark, moss, rock, fronds, rosettes, petals); uKind picks the pattern
const SURF_VS = /* glsl */`
#include <common>
${GL_COMMON}
attribute vec2 aUV; attribute vec4 aW;
#ifdef USE_INSTANCING
attribute vec4 aTint;
#endif
varying vec2 vUv; varying vec3 vWN; varying vec3 vWP; varying vec3 vCol; varying vec4 vW; varying vec3 vLP;
void main() {
  vec3 p = position; vec3 n = normal; vec3 col = color; float ph = aW.y; float sc = 1.0;
  #ifdef USE_INSTANCING
    sc = length(instanceMatrix[1].xyz);
    p = (instanceMatrix * vec4(p, 1.0)).xyz; n = mat3(instanceMatrix) * n / max(sc, 1e-4);
    col *= aTint.rgb; ph += aTint.a;
  #endif
  vec4 wp = modelMatrix * vec4(p, 1.0);
  float fl = aW.x * sc;
  if (fl > 0.0) {
    float g = gust(wp.xyz);
    wp.xyz += uWindV * (fl * (0.35 + 1.6 * g) * (0.7 + 0.3 * sin(uTime * 1.3 + ph * 30.0)));
    wp.xz += fl * 0.25 * vec2(sin(uTime * 1.1 + ph * 17.0 + wp.y * 0.2), cos(uTime * 0.9 + ph * 11.0));
  }
  vWP = wp.xyz; vWN = mat3(modelMatrix) * n; vUv = aUV; vCol = col; vW = vec4(aW.x, ph, aW.z, aW.w); vLP = p;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const SURF_FS = /* glsl */`
#include <common>
${GL_COMMON}
${GL_LIT}
uniform float uKind, uDapple; uniform vec4 uP;         // uP: detail scale, detail amount, moss, gloss
uniform vec4 uEagle; uniform vec3 uEagleR;              // the eagle (xyz, strength of its shadow) and its wing axis
uniform vec4 uBear; uniform vec3 uBearR;                // the bear (middle of its body, half its length) and the way it faces
uniform vec3 uGreen, uDeep, uPearl, uYel, uFogUp; uniform float uCool;
varying vec2 vUv; varying vec3 vWN; varying vec3 vWP; varying vec3 vCol; varying vec4 vW; varying vec3 vLP;
void main() {
  vec3 N = normalize(vWN + vec3(0.0, 1e-5, 0.0));
  if (!gl_FrontFacing) N = -N;
  vec3 toCam = cameraPosition - vWP; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-4);
  vec3 base = vCol; float tr = vW.w, sunVis = vW.z, gloss = uP.w, ph = vW.y;
  bool pool = false;
  if (uKind < 0.5) {
    base *= 1.0 - uP.y + 2.0 * uP.y * vn(vLP.xz * uP.x + vLP.y * uP.x * 0.7 + ph * 5.0);
  } else if (uKind < 1.5) {
    // bark with long fissures and pale lichen plates, moss cushions on the tops and the weather side
    float u = vUv.x, v = vUv.y;
    // ridges of cork running up the trunk, parted by narrow dark fissures that wander and fork; finer ones between them
    // near to; here and there a cross-crack. Drawn sharp, so that a trunk close by reads as bark and not as a smear
    float wand = vn(vec2(u * 8.0, v * 0.06)) * 1.7;
    float f1 = vn(vec2(u * 31.0 + wand, v * 0.085)), f2 = vn(vec2(u * 77.0 + f1 * 2.5, v * 0.24));
    float kNear = 1.0 - smoothstep(35.0, 95.0, dist), kMid = 1.0 - smoothstep(160.0, 320.0, dist);
    float fisA = smoothstep(0.035, 0.26, abs(f1 - 0.5) * 2.0), fisB = mix(1.0, smoothstep(0.03, 0.2, abs(f2 - 0.5) * 2.0), kNear);
    float crack = mix(1.0, smoothstep(0.02, 0.1, abs(vn(vec2(u * 17.0 + 3.0, v * 1.6 + f1 * 4.0)) - 0.5)), kNear * 0.8);
    float fis = mix(0.8, fisA * (0.7 + 0.3 * fisB) * (0.75 + 0.25 * crack), kMid);
    vec3 cork = mix(vec3(0.024, 0.02, 0.017), vec3(0.15, 0.138, 0.118), fis) * (0.82 + 0.36 * vn(vec2(u * 120.0, v * 2.2)));
    // near to: the cork broken into plates by short cross-cracks, and a fine grain, drawn sharp
    { float kN = 1.0 - smoothstep(18.0, 55.0, dist); vec2 pq = vec2(u * 37.0 + wand * 1.7, v * 0.42); pq.y += h21(vec2(floor(pq.x), 7.0)) * 3.0 + 0.35 * vn(vec2(u * 90.0, v * 0.6)); float pl = h21(floor(pq)), pe = min(fract(pq.y), 1.0 - fract(pq.y));
      cork *= mix(1.0, (0.86 + 0.28 * pl) * (0.6 + 0.4 * smoothstep(0.0, 0.07, pe)) * (0.85 + 0.3 * vn(vec2(u * 400.0, v * 9.0))), kN * 0.8); }
    float lich = smoothstep(0.5, 0.72, vn(vWP.xy * 0.33 + vWP.z * 0.21)) * smoothstep(0.4, 0.5, vn(vWP.xz * 1.7 + vWP.y * 1.3)) * fisA;
    float nearK = 1.0 - smoothstep(25.0, 90.0, dist);
    cork = mix(cork, uPearl * 0.5, lich * 0.42) * mix(vCol * 3.0, vec3(0.85), vW.w * nearK);
    float cush = vn(vWP.xz * 0.6 + vWP.y * 0.3), cush2 = mix(0.5, vn(vWP.xz * 2.3 + vWP.y * 1.9), 1.0 - smoothstep(90.0, 260.0, dist)), fine = mix(0.5, vn(vWP.xz * 7.0 + vWP.y * 6.0), nearK);
    float mk = smoothstep(0.5, 0.72, uP.z * 0.5 + N.y * 0.55 + cush * 0.3 + cush2 * 0.14 + 0.1 * (1.0 - smoothstep(30.0, 85.0, dist)));
    vec3 moss = mix(uDeep * 2.6, uGreen * 1.05 + uYel * 0.12, cush2 * 0.65 + 0.35 * cush) * (0.6 + 0.8 * fine);
    base = mix(cork * mix(0.62, 1.0, smoothstep(14.0, 70.0, dist)), moss * mix(0.4, 1.0, smoothstep(14.0, 75.0, dist)), mk) * (1.0 - 0.62 * vW.w * smoothstep(45.0, 110.0, dist));       // the framing trunks: dark from far off, moss and all
    N = bumpN(N, vWP, mix(fis * 0.22, cush2 * 0.5 + fine * 0.12, mk), 1.0);
    tr = 0.45 * mk;
  } else if (uKind < 2.5) {
    // fern frond: pinnae cut out of the blade
    float ax = abs(vUv.x), y = vUv.y;
    float env = smoothstep(0.0, 0.1, y) * (1.0 - y * y * y) * 0.98 + 0.02;
    float f = abs(fract(y * uP.x - ax * 0.55) - 0.5) * 2.0;
    if (ax > 0.07 && (ax > env || f > 0.84 - 0.45 * ax)) discard;
    base *= 0.8 + 0.4 * vn(vec2(vUv.x * 4.0, y * 30.0) + ph * 13.0);
    base = mix(base, uDeep * 1.3, (1.0 - smoothstep(0.03, 0.09, ax)) * 0.6);
  } else if (uKind < 3.5) {
    // moss beard: ragged strands cut out of the ribbon
    float sx = vUv.x * 2.5 + ph * 13.0, id = floor(sx), fx = fract(sx) - 0.5;
    float strand = h21(vec2(id, floor(ph * 97.0)));
    float wav = 0.18 * sin(vUv.y * 7.0 + strand * 20.0);
    float wid = mix((0.22 + 0.22 * strand) * (1.0 - 0.6 * vUv.y), 0.6, smoothstep(16.0, 55.0, dist));     // far off the strands close up into a curtain: no hatching
    if (abs(fx + wav) > wid || vUv.y > 0.45 + 0.55 * strand) discard;
    base *= 0.7 + 0.6 * strand;
  } else if (uKind < 4.5) {
    pool = true;
  } else if (uKind < 5.5) {
    // the ravine's walls: dark wet beds of rock on the risers, fern and moss on every ledge, shadow in the crevices
    float k1 = 1.0 - smoothstep(120.0, 340.0, dist), k2 = 1.0 - smoothstep(45.0, 170.0, dist), k3 = 1.0 - smoothstep(12.0, 48.0, dist);
    float wv = vn(vWP.xz * 0.045) * 5.0;
    float st = vn(vec2((vWP.y + wv) * 0.55, (vWP.x + vWP.z) * 0.012)), st2 = mix(0.5, vn(vec2((vWP.y + wv) * 1.7, (vWP.x - vWP.z) * 0.03)), k2);
    float crack = vn(vec2(vWP.x * 0.33 + vWP.z * 0.29, vWP.y * 0.06));
    // wet rock: near-black beds and paler ribs, joints, black streaks where water runs down, a little lichen; sheets of moss
    // and hanging fern on the risers, so that no face of it is a smooth pale grey
    vec3 rock = mix(vec3(0.009, 0.012, 0.014), vec3(0.074, 0.07, 0.062), st * 0.65 + 0.35 * st2);
    rock *= 0.42 + 0.72 * smoothstep(0.25, 0.6, mix(0.5, crack, k1));
    float joint = mix(1.0, smoothstep(0.03, 0.14, abs(vn(vec2(vWP.x * 0.9 + vWP.z * 0.8 + st * 3.0, vWP.y * 0.16)) - 0.5)), k2 * 0.75);
    float stain = smoothstep(0.52, 0.78, vn(vec2(vWP.x * 0.23 + vWP.z * 0.19, vWP.y * 0.011 + 3.0))) * k1;
    rock *= joint * (1.0 - 0.6 * stain);
    rock = mix(rock, uPearl * 0.34, smoothstep(0.64, 0.82, vn(vWP.xy * 0.21 + vWP.z * 0.17)) * 0.4 * (1.0 - stain));
    float mossR = smoothstep(0.4, 0.66, vn(vWP.xz * 0.12 + vWP.y * 0.1 + 5.0) * 0.55 + vn(vWP.xy * 0.33 + vWP.z * 0.29) * 0.3 + st * 0.2 + (1.0 - joint) * 0.2);
    rock = mix(rock, mix(uDeep * 1.5, uGreen * 0.62 + uYel * 0.04, vn(vWP.xz * 0.7 + vWP.y * 0.9)) * (0.55 + 0.6 * st2), mossR * 0.8);
    // fern tufts as cells: each a lit crown with a dark skirt and its own green
    vec2 fp = vWP.xz * 0.34 + vWP.y * 0.23 - 0.5; vec2 fi = floor(fp), ff = fract(fp);
    vec2 o1 = vec2(0.0, 0.0), o2 = vec2(1.0, 0.0), o3 = vec2(0.0, 1.0), o4 = vec2(1.0, 1.0);
    float h1 = h21(fi + o1), h2 = h21(fi + o2), h3 = h21(fi + o3), h4 = h21(fi + o4);
    float d1 = length(ff - o1 - 0.5 * (vec2(h1, fract(h1 * 7.3)) - 0.5)), d2 = length(ff - o2 - 0.5 * (vec2(h2, fract(h2 * 7.3)) - 0.5));
    float d3 = length(ff - o3 - 0.5 * (vec2(h3, fract(h3 * 7.3)) - 0.5)), d4 = length(ff - o4 - 0.5 * (vec2(h4, fract(h4 * 7.3)) - 0.5));
    float dm = d1, hm = h1; if (d2 < dm) { dm = d2; hm = h2; } if (d3 < dm) { dm = d3; hm = h3; } if (d4 < dm) { dm = d4; hm = h4; }
    float crown = mix(0.5, 1.0 - smoothstep(0.1, 0.62, dm), k2), tint = mix(0.5, hm, k2);
    float g1 = vn(vWP.xz * 0.085 + vWP.y * 0.06), g0 = vn(vWP.xz * 0.21 - vWP.y * 0.17 + 3.0), g3 = mix(0.5, vn(vWP.xz * 4.0 + vWP.y * 3.0), k3);
    float mk = smoothstep(0.36, 0.58, N.y * 0.95 + (g1 - 0.5) * 0.5 + (g0 - 0.5) * 0.3 * k1);
    vec3 fern = mix(uDeep * 1.3, mix(uGreen * 0.95, uGreen * 0.8 + uYel * 0.2, tint), crown * (0.55 + 0.45 * tint)) * (0.6 + 0.8 * g3) * (0.6 + 0.8 * mix(0.5, g0, k1));
    base = mix(rock, fern, mk) * vCol * 3.0;
    N = bumpN(N, vWP, mix(st * 0.5 + crack * 0.6 * k1, crown * 1.3 * k2 + g0 * 0.9 * k1, mk) + g3 * 0.2 * k3, 1.0);
    tr = 0.35 * mk; gloss = mix(0.34 + 0.3 * stain, 0.06, mk);
  } else if (uKind < 6.5) {
    // petal: a few broad veins running with its outline, a keel down the middle, a satin of cells, light through it
    float vx = vUv.x * uP.x, vv = abs(fract(vx + 0.5) - 0.5), fwv = fwidth(vx), ax = min(abs(vUv.x), 1.0);
    float vein = (1.0 - smoothstep(0.05, 0.05 + max(fwv * 1.5, 0.12), vv)) * 0.2;
    float cell = vn(vUv * vec2(7.0, 19.0) + ph * 7.0);
    base *= (1.0 - vein) * (0.9 + 0.2 * cell) * mix(1.0, 0.8, ax * ax * ax);
    N = bumpN(N, vWP, (1.0 - ax * ax) * 0.05 - vein * 0.06 + cell * 0.012, 1.0);
  } else if (uKind < 7.5) {
  } else if (uKind < 8.5) {
    // a tier of foliage: pads of leaf sprays with a ragged edge and sky-holes, cut out of a shallow dome
    vec2 q = vUv; float r = length(q), k2 = 1.0 - smoothstep(150.0, 290.0, dist);
    float lob = vn(q * 1.9 + ph * 31.0) * 0.62 + vn(q * 4.7 - ph * 17.0) * 0.38;
    float hole = vn(q * 2.9 + ph * 53.0 + 7.0);
    // the sprays are cells, pushed about so that no grid shows, close-set in places and open lace in others
    vec2 cp = q * 5.5 + ph * 13.0 + 0.9 * vec2(vn(q * 3.3 + ph * 5.0), vn(q * 3.3 + 9.0 - ph * 7.0)); vec2 ci = floor(cp), cf = fract(cp) - 0.5; float ch = h21(ci);
    float open = vn(q * 2.3 + ph * 77.0);
    cf -= (vec2(ch, fract(ch * 7.3)) - 0.5) * 0.4;
    float spray = length(cf) * (1.0 + 0.3 * sin(atan(cf.y, cf.x + 1e-4) * 5.0 + ch * 40.0));
    if (r > 0.5 + 0.52 * lob || (hole > 0.66 && r > 0.18) || spray > mix(1.5, 0.36 + 0.16 * ch + 0.5 * open, k2)) discard;
    base *= mix(1.0, (0.62 + 0.7 * ch) * (1.25 - 0.8 * min(spray, 0.7)), k2) * (0.75 + 0.5 * lob);
    tr = 0.6;
  } else if (uKind < 9.5) {
    // a lobe of a vine leaf: toothed edge, pale midrib and side veins, quilted between them
    float ax = abs(vUv.x), y = vUv.y;
    float tooth = abs(fract(y * 9.0 + 0.5 * step(0.0, vUv.x)) - 0.5);
    if (ax > 0.94 - 0.2 * tooth) discard;
    float sa = y * 7.0 - ax * 1.6, sv = abs(fract(sa) - 0.5), fws = fwidth(sa);
    float vein = max(1.0 - smoothstep(0.04, 0.04 + max(fws * 1.5, 0.07), sv), 1.0 - smoothstep(0.03, 0.1, ax));
    base *= 0.8 + 0.4 * vn(vUv * vec2(5.0, 14.0) + ph * 9.0);
    base = mix(base, base * 1.45 + uYel * 0.05, vein * 0.6);
    N = bumpN(N, vWP, (sv - 0.25) * 0.06 * (1.0 - vein), 1.0);
  }
  if (uKind > 0.5 && uKind < 1.5) sunVis *= 0.4 + 0.6 * dapple(vWP, uDapple); else
  sunVis *= dapple(vWP, uDapple);
  vec3 col;
  if (pool) {
    float r = length(vUv), t = fract(uTime * 0.31 + ph), t2 = fract(uTime * 0.23 + ph * 3.7 + 0.5);
    float ring = (1.0 - smoothstep(0.0, 0.07, abs(r - t * 0.95))) * (1.0 - t) + (1.0 - smoothstep(0.0, 0.06, abs(length(vUv - vec2(0.25, -0.2)) - t2 * 0.7))) * (1.0 - t2);
    float fres = 1.0 - abs(dot(N, V)); fres = fres * fres;
    col = mix(uDeep * 0.4 + uGroundCol * 0.2, uSkyCol * 1.25, 0.12 + 0.88 * fres) * (1.0 + 0.7 * ring) + uSunCol * ring * 0.18 * sunVis;
  } else {
    col = shade(base, N, V, sunVis, tr, gloss);
    if (uKind > 5.5 && uKind < 6.5) col += base * (0.45 + 1.5 * base) * uSunCol * tr * (0.1 + 0.25 * sunVis);     // petals are lamps
    if (uKind > 0.5 && uKind < 1.5) {
      // wood standing in bright mist: the mist lights it from every side, the sky rims its shadow side, the sun rims it from beyond
      float fr = 1.0 - abs(dot(N, V)); fr *= fr;
      // (less of the mist's even light than there was, more of the sun on the side that faces it: trunks have a lit side and a dark one)
      col += base * uFogCol * mix(0.26, 0.5, smoothstep(22.0, 95.0, dist)) * (1.0 - 0.8 * vW.w * smoothstep(40.0, 110.0, dist)) + base * uSunCol * max(dot(N, uSunDir), 0.0) * sunVis * 0.45 + uSkyCol * vec3(0.75, 0.95, 1.2) * fr * fr * 0.55 * (1.0 - 0.75 * vW.w * smoothstep(45.0, 110.0, dist)) + base * uSunCol * fr * max(dot(-V, uSunDir) + 0.3, 0.0) * 0.8;
    }
    if (uKind > 4.5 && uKind < 5.5) col += base * uFogCol * 0.1 + base * uSunCol * max(dot(N, uSunDir), 0.0) * sunVis * 0.55 + base * (uSkyCol * 0.9 + uFogCol * 0.3) * (1.0 - smoothstep(25.0, 110.0, dist));
    if (uKind > 6.5 && uKind < 7.5) {
      // our own head as its owner sees it. vW.w picks the part: 0 the bill (horn-black upper mandible, a seam, a paler lower
      // one, a thread of sky along the ridge), 1 the brow (feathers lying scale on scale, their free tips toward us), 2 one
      // small feather lapping the bill's root. Lit by the sky above and a little sun; the mist does not light it.
      float top = max((viewMatrix * vec4(N, 0.0)).y, 0.0), fr2 = 1.0 - abs(dot(N, V)); fr2 *= fr2;
      vec3 lit = uSkyCol * 1.05 + uGroundCol * 0.25 + uSunCol * (0.08 + 0.3 * max(dot(N, uSunDir), 0.0));
      if (vW.w > 1.5) {
        float y = vUv.y, ax = abs(vUv.x);
        if (ax > 0.12 + 0.88 * sin(3.1416 * pow(clamp(y, 0.0, 1.0), 0.7))) discard;
        float barb = 0.85 + 0.15 * sin((y * 26.0 - ax * 5.0) * 3.1416);
        col = vCol * barb * (1.0 - 0.4 * (1.0 - smoothstep(0.0, 0.16, ax))) * lit * (0.55 + 0.6 * top) * (0.6 + 0.8 * y)
          + vec3(0.3, 0.8, 0.45) * uSkyCol * smoothstep(0.5, 1.0, y) * (0.3 + 0.7 * top) * 0.1;
      } else if (vW.w > 0.5) {
        vec2 q = vUv * uP.xy; q.x += 0.5 * floor(q.y);
        vec2 f = fract(q); float fx = f.x - 0.5, fh = h21(floor(q) + 11.0);
        float e2 = f.y + 1.6 * fx * fx;                                   // 0 at the feather's root, 1 along its rounded tip
        float body = smoothstep(0.0, 0.55, e2) * (1.0 - smoothstep(0.98, 1.06, e2)), fringe = smoothstep(0.6, 0.92, e2) * (1.0 - smoothstep(0.96, 1.04, e2));
        col = vCol * (0.7 + 0.6 * fh) * mix(0.34, 1.0, body) * lit * (0.55 + 0.6 * top)
          + mix(vec3(0.16, 0.62, 0.36), vec3(0.5, 0.6, 0.24), fh) * (uSkyCol + uSunCol * 0.1) * fringe * (0.12 + 0.88 * fh * fh) * (0.3 + 0.7 * top) * (0.1 + 0.05 * sin(uTime * 1.7 + fh * 40.0))
          + uSkyCol * (top * top * top * 0.07 + fr2 * 0.04);
      } else {
        float a = vUv.x * 6.2832, sa = sin(a), t = vUv.y;
        float seam = 1.0 - smoothstep(0.03, 0.03 + max(fwidth(sa) * 1.5, 0.05), abs(sa - 0.78));
        float low = 1.0 - smoothstep(0.74, 0.78, sa), lip = (1.0 - smoothstep(0.0, 0.08, abs(sa - 0.66))) * low;
        float da = (a - 1.5708) / 0.2, ridge = exp(-da * da);
        float grain = 0.82 + 0.36 * vn(vec2(vUv.x * 70.0, t * 5.0));
        vec3 horn = mix(vec3(0.02, 0.018, 0.018), vec3(0.12, 0.093, 0.066), low) * grain;
        horn = mix(horn, vec3(0.24, 0.2, 0.15), lip * 0.5) * (1.0 - 0.85 * seam);
        horn = mix(horn, vec3(0.07, 0.06, 0.05), smoothstep(0.85, 1.0, t) * 0.5);
        col = horn * lit * (0.6 + 0.8 * top) + lit * vec3(0.86, 0.92, 1.0) * ridge * (0.8 - 0.3 * t) * (0.8 + 0.2 * grain) * (1.0 - seam) + uSkyCol * fr2 * 0.05;
      }
    }
    if (uKind > 9.5) {
      // a glass drop: the sun gathered on its far side, the sky on its rim, one spark
      float fz = 1.0 - abs(dot(N, V)); vec3 H = normalize(uSunDir + V + vec3(0.0, 1e-4, 0.0));
      float sp = max(dot(N, H), 0.0); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
      float lens = smoothstep(-0.3, 0.9, dot(N, -uSunDir));
      col = vCol * (uSkyCol * 0.5 + uGroundCol * 0.2 + uSunCol * (0.1 + 0.8 * lens * lens)) + (uSkyCol + uFogCol * 0.5) * fz * fz * 0.9 + uSunCol * sp * 1.6 * sunVis;
    }
    // the eagle's shadow, thrown down-sun on whatever lies beyond it
    if (uEagle.w > 0.001) {
      vec3 ev = vWP - uEagle.xyz; float along = dot(ev, uSunDir); vec3 pv = ev - uSunDir * along;
      float du = dot(pv, uEagleR), dv = length(pv - uEagleR * du);
      float sh = max(1.0 - smoothstep(0.55, 1.0, length(vec2(du / 13.0, dv / 4.2))), 1.0 - smoothstep(0.5, 1.0, length(vec2(du / 2.6, dv / 7.5))));
      col *= 1.0 - 0.72 * sh * uEagle.w * step(along, 0.0);
    }
    // the bear's shadow: its body thrown down-sun on the rock and the plants, and the dark it stands over
    if (uBear.w > 0.0) {
      vec3 bv = vWP - uBear.xyz; float al = dot(bv, uSunDir); vec3 pv = bv - uSunDir * al;
      float du = dot(pv, uBearR), dv = length(pv - uBearR * du);
      float sh = (1.0 - smoothstep(0.75, 1.1, length(vec2(du / uBear.w, dv / (uBear.w * 0.5))))) * (1.0 - smoothstep(-2.0, 1.0, al)) * (1.0 - smoothstep(4.0, 7.0, -al / uBear.w));
      vec2 gv = vec2(dot(bv.xz, uBearR.xz), dot(bv.xz, vec2(-uBearR.z, uBearR.x)));
      float under = (1.0 - smoothstep(0.55, 1.2, length(gv / vec2(uBear.w * 1.05, uBear.w * 0.52)))) * (1.0 - smoothstep(0.0, uBear.w * 0.5, abs(bv.y + 0.6 * uBear.w)));
      col *= 1.0 - max(0.7 * sh, 0.6 * under);
    }
  }
  // mist seen against the sky takes the sky's colour, so that far crowns go blue, not the colour of the low cloud
  vec3 fc = mix(uFogCol, uFogUp, smoothstep(0.08, 0.55, -V.y));
  // far off the air itself goes blue-green, so that cliffs and far crowns stand in layers; the cloud lying in the ravine stays pale
  fc = mix(fc, fc * vec3(0.64, 0.83, 1.0), uCool * smoothstep(60.0, 300.0, dist) * (1.0 - 0.6 * smoothstep(450.0, 900.0, dist)) * smoothstep(uFogP.y - 6.0, uFogP.y + 14.0, vWP.y));
  float mA = mistAmt(vWP, cameraPosition);
  if (uKind > 0.5 && uKind < 1.5) mA *= 1.0 - 0.8 * vW.w * smoothstep(40.0, 110.0, dist);      // the framing trunks keep their dark through the mist
  gl_FragColor = vec4(mix(col, fc, mA), 1.0);
}`;
// BIRD: a creature whose wings (parts 1, 2) turn about an axis through their roots and whose tail (part 3) trails
const BIRD_VS = /* glsl */`
#include <common>
${GL_COMMON}
attribute vec4 aW;                                      // part, weight along the part, iridescence, sun/ao
uniform vec4 uAnim;                                     // wing angle, tail phase, tail amplitude, head/part-4 angle
uniform vec3 uPivL, uPivR, uAxis, uPivH;
varying vec3 vWN; varying vec3 vWP; varying vec3 vCol; varying vec4 vW; varying vec3 vLP;
void main() {
  vec3 p = position; vec3 n = normal; vLP = position;
  if (aW.x > 0.5 && aW.x < 2.5) {
    bool left = aW.x < 1.5; vec3 piv = left ? uPivL : uPivR; float a = (left ? 1.0 : -1.0) * uAnim.x * (0.55 + 0.75 * aW.y);
    p = piv + rotAA(p - piv, uAxis, a); n = rotAA(n, uAxis, a);
  } else if (aW.x > 2.5 && aW.x < 3.5) {
    float w = aW.y * aW.y;
    p.x += sin(uAnim.y - aW.y * 5.0) * uAnim.z * w; p.y += cos(uAnim.y * 0.8 - aW.y * 4.0) * uAnim.z * 0.6 * w;
  } else if (aW.x > 3.5) {
    p = uPivH + rotAA(p - uPivH, vec3(0.0, 1.0, 0.0), uAnim.w); n = rotAA(n, vec3(0.0, 1.0, 0.0), uAnim.w);
  }
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWP = wp.xyz; vWN = mat3(modelMatrix) * n; vCol = color; vW = aW;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const BIRD_FS = /* glsl */`
#include <common>
${GL_COMMON}
${GL_LIT}
uniform vec3 uIrid; uniform float uFade, uRim, uFeath, uSpark, uScl, uFur, uStream;
varying vec3 vWN; varying vec3 vWP; varying vec3 vCol; varying vec4 vW; varying vec3 vLP;
void main() {
  vec3 N = normalize(vWN + vec3(0.0, 1e-5, 0.0));
  if (!gl_FrontFacing) N = -N;
  vec3 toCam = cameraPosition - vWP; vec3 V = toCam / max(length(toCam), 1e-4);
  // feathers: rows of scales, each its own shade and its own moment of glitter
  vec2 q = vec2(atan(vLP.x, vLP.y + 1e-4) * 3.2, vLP.z * 17.0) * uScl; q.x += 0.5 * floor(q.y);
  vec2 qi = floor(q), qf = fract(q); float fh = h21(qi + 3.0), edge = smoothstep(0.55, 1.0, qf.y) * 0.45 + smoothstep(0.3, 0.5, abs(qf.x - 0.5)) * 0.25;
  float sc = vW.z > 0.05 ? 1.0 : 0.0;
  vec3 base = vCol * mix(1.0, (0.7 + 0.6 * fh) * (1.0 - edge), sc) * (0.9 + 0.2 * vn(vWP.xy * 9.0 + vWP.z * 7.0));
  if (uFeath > 0.5 && vW.x > 0.5 && vW.x < 2.5) {
    // flight feathers: each a soft step of shade across the wing, gone where they would be finer than the pixels
    float fx = abs(vLP.x) * uFeath, fwf = fwidth(fx);
    base *= mix(1.0, 0.7 + 0.55 * fract(fx), (1.0 - smoothstep(0.2, 0.45, fwf)) * 0.7);
  }
  float furK = 1.0; vec3 N0 = N;
  if (uFur > 0.5) {
    // fur: long streaks lying back along the body, tufted, so that the light breaks on it
    float f1 = vn(vec2(atan(vLP.x + 1e-4, vLP.y - 5.0) * 13.0, vLP.z * 1.5 + vLP.y * 0.9)), f2 = vn(vec2(vLP.x * 5.3 + vLP.y * 4.1, vLP.z * 5.6));
    furK = f1 * (0.6 + 0.4 * f2); base *= 0.5 + 1.0 * furK;
    N = bumpN(N, vWP, (f1 * 0.5 + f2 * 0.25) * 0.22, 1.0);
  }
  vec3 col = shade(base, N, V, vW.w, 0.25, 0.5 * uRim);
  if (uFur > 0.5) {
    // a black coat is read by its light: a warm rim along the edge turned to the sun, a sheen where the fur lies across the light,
    // a cool one from the sky on its back; the cream of the face and bib takes the same light
    // (the rim is taken from the body's own shape, not from the fur's bumps: the coat stays black and only its outline takes the light)
    float fzf = 1.0 - abs(dot(N0, V)), sunny = max(dot(N0, uSunDir) + 0.35, 0.0), fl = clamp(base.g * 9.0, 0.0, 1.0); fzf *= 0.75 + 0.5 * furK;
    vec3 H2 = normalize(uSunDir + V + vec3(0.0, 1e-4, 0.0)); float sh = max(dot(N, H2), 0.0); sh *= sh; sh *= sh;
    vec3 warm = uSunCol * vec3(1.0, 0.8, 0.56) + uFogCol * 0.25;
    sh *= sh;
    col += (base * 2.0 + vec3(0.1, 0.068, 0.038)) * warm * fzf * fzf * fzf * (0.25 + sunny) * 2.2
      + vec3(0.013, 0.01, 0.008) * warm * sh * (0.5 + fl) * (0.3 + 1.5 * furK) + uSkyCol * vec3(0.03, 0.036, 0.046) * max(N.y, 0.0) * (0.4 + fl) * (0.3 + 1.4 * furK);
  }
  if (uStream > 0.5 && vW.x > 2.5 && vW.x < 3.5 && vW.z < 0.05) {
    // tail streamers catch the light: they glow with the sun through them, and a gleam runs down them as they whip
    float thru = 0.35 + 0.65 * abs(dot(N, uSunDir)), gleam = 0.5 + 0.5 * sin(vLP.z * 7.0 + uTime * 5.0 + vLP.x * 9.0);
    col += vCol * (uSunCol * 0.42 * thru + uSkyCol * 0.5) * (0.55 + 0.75 * gleam * gleam);
  }
  // feather glitter: a metallic colour that turns on and off with the angle to the light
  float gl = max(dot(reflect(-V, N), uSunDir), 0.0); gl = gl * gl; gl *= gl;
  float fz = 1.0 - abs(dot(N, V));
  col += uIrid * vW.z * (0.07 + 1.5 * gl * (0.3 + 1.3 * fh) + 0.16 * fz) * (uSkyCol * 0.6 + uSunCol * 0.6 + 0.2) * (1.0 - 0.6 * edge * sc);
  // a gorget that glitters toward the eye whatever the sun is doing: scale by scale, coming and going
  col += uIrid * vW.z * uSpark * (0.12 + 1.5 * fh * fh) * (1.0 - edge) * pow(max(dot(N, V), 0.0), 1.5) * (0.65 + 0.35 * sin(uTime * 2.3 + fh * 40.0));
  col += (uSkyCol + uFogCol * 0.4) * fz * fz * uRim;                            // pale rim so dark birds read on dark leaves
  gl_FragColor = vec4(mix(col, uFogCol, mistAmt(vWP, cameraPosition) * uFade), 1.0);
}`;
// FAN: the blur of a hummingbird's wings (theirs, and our own at the lower corners of the frame)
const FAN_VS = /* glsl */`
attribute vec2 aQ;
varying vec2 vQ; varying vec3 vWP;
void main() { vQ = aQ; vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const FAN_FS = /* glsl */`
${GL_COMMON}
uniform vec3 uCol; uniform vec4 uFan;                   // alpha, angular spread, seed, mist on/off
uniform vec2 uSoft;                                     // depth of the faint streaks along the stroke, weight of the stroke's two ends
varying vec2 vQ; varying vec3 vWP;
void main() {
  float r = length(vQ), ang = atan(vQ.y, vQ.x + 1e-4);
  float q = abs(ang) / max(uFan.y, 1e-3), rad = (1.0 - smoothstep(0.42, 1.0, r)) * smoothstep(0.0, 0.3, r);
  // a soft sheet: densest in the middle of the stroke, a little denser again where the wing dwells at its two ends, no spokes
  float lim = smoothstep(0.5, 0.82, q) * (1.0 - smoothstep(0.82, 1.0, q));
  float a = rad * max(1.0 - smoothstep(0.35, 1.0, q), lim * uSoft.y);
  float st = 1.0 - uSoft.x + uSoft.x * vn(vec2(ang * 5.0 + uFan.z, r * 1.5 - uTime * 2.0));
  float breathe = 0.93 + 0.07 * sin(uTime * 9.0 + uFan.z);                       // under 2 Hz, 7 percent: never a strobe
  vec3 col = uCol * (uSkyCol * 1.05 + uSunCol * 0.3) * (0.94 + 0.12 * st);
  col = mix(col, uFogCol, mistAmt(vWP, cameraPosition) * uFan.w);
  gl_FragColor = vec4(col, clamp(a * st * breathe * uFan.x, 0.0, 1.0));
}`;
// soft instanced sprites: streaming mist (uMode 0) and dancing gnats / drifting spores (uMode 1)
const PUFF_VS = /* glsl */`
${GL_COMMON}
attribute vec4 aA, aB;                                   // mist: base xyz + size | phase, 1/period (negative: a streamer pouring upward), seed, alpha.  gnats: anchor xyz + dance radius | phase, size, gain, speed
uniform float uMode, uEntry, uVeil; uniform vec2 uRes;      // uEntry: the far veils thin; uVeil: those in the middle distance too (the view in from the door)
varying vec2 vQ; varying float vA; varying float vSeed; varying vec3 vWP; varying vec2 vSun; varying float vShd;
void main() {
  vec3 p; float size, alpha, rise = 0.0; vShd = 0.0;
  vSun = normalize((viewMatrix * vec4(uSunDir, 0.0)).xy + vec2(1e-4, 2e-4));
  if (uMode < 0.5) {
    rise = step(aB.y, 0.0);
    float c = fract(uTime * abs(aB.y) + aB.x);
    p = aA.xyz + mix(uWindN * 95.0 + vec3(0.0, 14.0, 0.0), uWindN * 9.0 + vec3(0.0, 46.0, 0.0), rise) * (c - 0.5);
    p.xz += 3.0 * vec2(sin(c * 6.0 + aB.z * 9.0), cos(c * 5.0 + aB.z * 7.0));
    vShd = mix(0.5 * rise, 1.0, step(aA.w, 0.0));            // 1: the shade under the crown (a negative size marks it); 0.5: a streamer pouring upward
    size = abs(aA.w) * (0.8 + 0.5 * c); alpha = aB.w * sin(c * 3.14159); vSeed = aB.z + c * 0.6;
  } else {
    float t = uTime * aB.w + aB.x * 40.0;
    p = aA.xyz + aA.w * vec3(sin(t * 1.3) + 0.5 * sin(t * 3.1 + 1.0), 0.7 * sin(t * 1.9 + 2.0) + 0.3 * sin(t * 4.3), cos(t * 1.1) + 0.5 * cos(t * 2.7 + 0.5));
    size = aB.y; alpha = aB.z; vSeed = aB.x;
  }
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float d = max(-mv.z, 0.05);
  if (uMode < 0.5) alpha *= smoothstep(7.0, 30.0, d) * mix((1.0 - 0.85 * uEntry * smoothstep(95.0, 150.0, d)) * (1.0 - 0.85 * uVeil * smoothstep(45.0, 100.0, d)), 1.0, 0.8 * step(1.5, aB.x));      // (a phase over 1.5 marks a bank that stands whatever the distance)
  else {
    float px = size * projectionMatrix[1][1] / d * uRes.y * 0.5, k = max(1.0, 1.3 / max(px, 1e-3));
    size *= k; alpha *= clamp(1.6 / (k * k), 0.0, 1.0) * smoothstep(0.8, 2.6, d);
  }
  vWP = p; vA = alpha; vQ = position.xy;
  mv.xy += position.xy * size * vec2(1.0, 1.0 + 1.3 * rise);
  gl_Position = projectionMatrix * mv;
}`;
const PUFF_FS = /* glsl */`
${GL_COMMON}
uniform float uMode;
varying vec2 vQ; varying float vA; varying float vSeed; varying vec3 vWP; varying vec2 vSun; varying float vShd;
void main() {
  float r2 = dot(vQ, vQ); if (r2 > 1.0) discard;
  float a = 1.0 - r2; vec3 col;
  if (uMode < 0.5) {
    float n = vn(vQ * 1.7 + vSeed * 7.0) * 0.6 + vn(vQ * 3.9 - vSeed * 3.0) * 0.4;
    a = a * a * smoothstep(0.2, 0.75, n + 0.25 * (1.0 - r2));
    // lit from the sun's side, blue-grey on the other: the mist has body
    float body = (vShd > 0.25 && vShd < 0.75) ? 1.0 : 0.3;
    col = mix(uFogCol * mix(vec3(1.0), vec3(0.8, 0.87, 0.94), body), uFogCol * (1.0 + 0.12 * body) + uSunCol * 0.05 * body, smoothstep(-0.5, 0.8, dot(vQ, vSun) + (n - 0.5) * 0.8));
    col = mix(col, uFogCol * vec3(0.5, 0.64, 0.7), step(0.75, vShd));
  } else {
    a = a * a;
    float lit = smoothstep(0.35, 0.6, vn(vWP.xz * 0.11 + vWP.y * 0.07 + uTime * 0.03));
    col = mix(uGroundCol * 0.6, uSunCol * 1.6 + uSkyCol, lit);
    col = mix(col, uFogCol, mistAmt(vWP, cameraPosition));
  }
  gl_FragColor = vec4(col, a * vA);
}`;
// SHAFT: sunlight standing in the mist, a ribbon along the sun's direction turned to face the camera
const SHAFT_VS = /* glsl */`
${GL_COMMON}
attribute vec4 aA, aB;                                   // top xyz + length | width, seed, gain, 0
varying vec2 vQ; varying float vA;
void main() {
  vec3 top = aA.xyz + vec3(sin(uTime * 0.07 + aB.y * 9.0), 0.0, cos(uTime * 0.06 + aB.y * 5.0)) * 3.0;
  vec3 c = top - uSunDir * (aA.w * (0.5 - 0.5 * position.y));
  vec3 side = normalize(cross(uSunDir, cameraPosition - c) + vec3(1e-4, 0.0, 1e-4));
  vec3 p = c + side * position.x * aB.x * (0.65 + 0.35 * (0.5 - 0.5 * position.y));
  vec4 mv = viewMatrix * vec4(p, 1.0);
  vA = aB.z * (0.6 + 0.4 * sin(uTime * 0.23 + aB.y * 20.0)) * smoothstep(8.0, 30.0, -mv.z) * (1.0 - smoothstep(150.0, 260.0, -mv.z));
  vQ = position.xy;
  gl_Position = projectionMatrix * mv;
}`;
const SHAFT_FS = /* glsl */`
uniform vec3 uSunCol;
varying vec2 vQ; varying float vA;
void main() {
  float e = 1.0 - vQ.x * vQ.x; e *= e;
  float l = smoothstep(-1.0, -0.3, vQ.y) * (1.0 - smoothstep(0.6, 1.0, vQ.y));
  gl_FragColor = vec4(uSunCol * vec3(1.0, 0.9, 0.74) * (e * l * vA), 1.0);
}`;
// WING: glasswing butterflies, each two clear wings hinged on its line of flight
const WING_VS = /* glsl */`
${GL_COMMON}
attribute vec4 aA, aB;                                   // anchor xyz + phase | span, speed, loop radius, flutter
varying vec2 vQ; varying vec3 vWN; varying vec3 vWP;
void main() {
  float th = uTime * aB.y + aA.w * 6.2832, R = aB.z;
  vec3 c = aA.xyz + vec3(R * cos(th), 0.45 * R * sin(th * 1.7 + aA.w * 9.0) + 0.25 * sin(uTime * 2.3 + aA.w * 20.0), R * sin(th));
  vec3 fw = normalize(vec3(-sin(th), 0.3 * cos(th * 1.7 + aA.w * 9.0), cos(th)));
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))), up = cross(rt, fw);
  float glide = smoothstep(-0.3, 0.4, sin(uTime * 0.6 + aA.w * 31.0));
  float flap = mix(0.35, 0.15 + 1.05 * abs(sin(uTime * aB.w + aA.w * 50.0)), glide);
  float sgn = position.x < 0.0 ? -1.0 : 1.0, ax = abs(position.x);
  vec3 lp = rt * (sgn * ax * cos(flap)) + up * (ax * sin(flap)) + fw * position.z;
  vec3 ln = up * cos(flap) - rt * (sgn * sin(flap));
  vec3 p = c + lp * aB.x * 0.5;
  vWP = p; vWN = ln; vQ = vec2(ax, position.z);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const WING_FS = /* glsl */`
${GL_COMMON}
varying vec2 vQ; varying vec3 vWN; varying vec3 vWP;
void main() {
  // fore wing and hind wing as two lobes; dark veins and a dark border round clear panes
  vec2 q = vQ; float fore = length((q - vec2(0.5, 0.18)) / vec2(0.52, 0.3)), hind = length((q - vec2(0.36, -0.2)) / vec2(0.38, 0.3));
  float s = min(fore, hind); if (s > 1.0 && (q.x > 0.035 || abs(q.y) > 0.3)) discard;
  float border = smoothstep(0.72, 0.95, s);
  float ang = atan(q.y - 0.02, q.x + 1e-4);
  float veins = 1.0 - smoothstep(0.08, 0.2, abs(fract(ang * 2.6 + 0.5) - 0.5));
  float dark = max(max(border, veins * 0.8), 1.0 - smoothstep(0.02, 0.05, q.x));
  vec3 N = normalize(vWN + vec3(0.0, 1e-5, 0.0)); vec3 toCam = cameraPosition - vWP; vec3 V = toCam / max(length(toCam), 1e-4);
  vec3 H = normalize(uSunDir + V + vec3(0.0, 1e-4, 0.0));
  float sp = abs(dot(N, H)); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  vec3 col = mix(uSkyCol * 1.4, vec3(0.03, 0.022, 0.015), dark) + uSunCol * sp * (1.0 - dark) * 2.2 + vec3(0.5, 0.12, 0.05) * border * step(0.5, fore) * 0.2;
  float a = max(dark * 0.9, 0.16 + sp * 0.8);
  gl_FragColor = vec4(mix(col, uFogCol, mistAmt(vWP, cameraPosition)), a);
}`;
// RAIN: fine drizzle, short streaks wrapped in a box round the camera
const RAIN_VS = /* glsl */`
${GL_COMMON}
attribute vec4 aA;                                       // base xyz + speed
uniform vec2 uRes;
varying vec2 vQ; varying float vA;
void main() {
  vec3 b = aA.xyz + vec3(uWindV.x * 6.0, -aA.w, uWindV.z * 6.0) * uTime;
  vec3 p = cameraPosition + mod(b - cameraPosition, vec3(44.0)) - 22.0;
  vec3 dir = normalize(vec3(uWindV.x * 6.0, -aA.w, uWindV.z * 6.0));
  p += dir * position.y * 0.55;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float d = max(-mv.z, 0.05), px = 0.012 * projectionMatrix[1][1] / d * uRes.y * 0.5, k = max(1.0, 1.5 / max(px, 1e-3));
  vec3 side = normalize(cross(dir, cameraPosition - p) + vec3(1e-4, 0.0, 1e-4));
  mv.xyz += mat3(viewMatrix) * side * (position.x * 0.012 * k);
  vA = 0.42 * clamp(1.5 / k, 0.0, 1.0) * smoothstep(0.6, 3.0, d) * (1.0 - smoothstep(14.0, 22.0, d));
  vQ = position.xy;
  gl_Position = projectionMatrix * mv;
}`;
const RAIN_FS = /* glsl */`
uniform vec3 uSkyCol;
varying vec2 vQ; varying float vA;
void main() { float e = (1.0 - vQ.x * vQ.x) * (1.0 - vQ.y * vQ.y); gl_FragColor = vec4(uSkyCol * 2.2, e * vA); }`;

// STRAND: falling water drawn as ribbons: the strands of the fall (laid over the kit's sheets, on the same leap) and the drip
// lines off the bear's crag. aUV = across (-1..1), along (0 at the lip..1 at the foot); aW = seed, 0 strands / 1 separate drops,
// gain, seconds from lip to foot. The pattern is carried down at the speed water falls, so it draws out as it goes
const STRAND_VS = /* glsl */`
${GL_COMMON}
attribute vec2 aUV; attribute vec4 aW;
varying vec2 vUv; varying vec4 vW; varying vec3 vWP;
void main() {
  vUv = aUV; vW = aW; vec3 p = position;
  p.xz += uWindN.xz * (aUV.y * aUV.y * 1.3 * (0.5 + 0.5 * sin(uTime * 0.6 + aW.x * 9.0 + aUV.y * 3.0)));       // the wind leans the foot of it
  vec4 wp = modelMatrix * vec4(p, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const STRAND_FS = /* glsl */`
${GL_COMMON}
varying vec2 vUv; varying vec4 vW; varying vec3 vWP;
void main() {
  float s = clamp(vUv.x, -1.0, 1.0), t = clamp(vUv.y, 0.0, 1.0), tau = sqrt(t) * vW.w - uTime, sd = vW.x * 17.0;
  float edge = 1.0 - s * s, a; vec3 col;
  vec3 lit = uSkyCol * 1.15 + uFogCol * 0.42 + uSunCol * (0.1 + 0.16 * abs(uSunDir.x));
  if (vW.y < 0.5) {
    float clump = vn(vec2(s * 2.2 + sd, tau * 1.9)), fine = vn(vec2(s * 9.0 + sd * 3.0, tau * 5.5)), thread = vn(vec2(s * 21.0 + sd, tau * 2.6 + t * 5.0));
    float body = smoothstep(0.3, 0.7, clump * 0.6 + fine * 0.4), head = smoothstep(0.6, 0.88, clump) * smoothstep(0.35, 0.7, fine);
    float torn = mix(1.0, 0.25 + 0.75 * smoothstep(0.32, 0.6, thread), smoothstep(0.04, 0.5, t));           // the sheet tears into threads as it falls
    a = edge * (0.3 + 0.7 * body) * torn * smoothstep(0.0, 0.012, t) * (1.0 - smoothstep(0.86, 1.0, t));
    col = mix(vec3(0.42, 0.56, 0.6), vec3(0.94, 0.97, 1.0), 0.35 + 0.65 * body) * lit + uSunCol * vec3(1.0, 0.92, 0.8) * head * 0.2;
    // the bright rim: the glassy lip, and the thin water at the fall's two edges with the light through it
    float rim = max((1.0 - smoothstep(0.0, 0.035, t)) * 0.8, smoothstep(0.45, 0.95, abs(s)) * 0.5);
    col += (uSunCol * 0.2 + uSkyCol * 0.5) * rim;
  } else {
    float cell = fract(tau * 0.8 + sd), dropK = smoothstep(0.84, 0.93, cell) * (1.0 - smoothstep(0.97, 1.0, cell));
    a = edge * edge * (dropK + 0.12 * vn(vec2(sd, tau * 3.0)));
    col = vec3(0.9, 0.96, 1.0) * lit * 1.2 + uSunCol * 0.25 * dropK;
  }
  col = mix(col, uFogCol, mistAmt(vWP, cameraPosition));
  gl_FragColor = vec4(col, clamp(a * vW.z, 0.0, 1.0));
}`;

function quadGeo(attrs, wide) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  let n = 0;
  for (const k in attrs) { const [arr, size] = attrs[k]; g.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(arr), size)); n = arr.length / size; }
  g.instanceCount = n; return g;
}

// ---- creatures (unit: metres at x15; forward +Z, up +Y). aW = part, weight along the part, glitter, light --------
const C = (h, k = 1) => { const c = new THREE.Color(h); return c.multiplyScalar(k); };
// a hummingbird: body, head and needle bill, a glittering gorget, an eye with its white spot;
// tail 'streamers' (sylph), 'rackets' (racket-tail) or 'fan'
function hummerGeo(sp) {
  const G = new Geo(), back = C(sp.back), belly = C(sp.belly), throat = C(sp.throat), tailC = C(sp.tail), dark = C('#0b0d0c'), pale = C('#f2f2ea');
  const crown = C(sp.crown || sp.back, 1.25), vent = C(sp.vent || '#d8d4c0', 0.8);
  const kb = sp.bellyK ?? -0.3, under = (top, bot) => (a) => { const k = Math.sin(a); return k < kb ? bot : k < kb + 0.2 ? top.clone().lerp(bot, (kb + 0.2 - k) / 0.2) : top; };
  const hw = sp.headIrid ?? 1.6;                         // how much the head glitters (less where a crown must keep its own colour)
  const capped = (cap, top, bot) => { const u2 = under(top, bot); return (a) => { const k = Math.sin(a); return k > 0.62 ? cap : k > 0.42 ? top.clone().lerp(cap, (k - 0.42) / 0.2) : u2(a); }; };
  // arch > 0 (the swordbill at its flower): the head is thrown back, so the body hangs away from the line of the bill, toward the back
  const arch = sp.arch || 0, ay = (z) => arch * Math.pow(Math.max(0, 0.32 - z), 2), slope = (z) => 2 * arch * Math.max(0, 0.32 - z);
  const bent = (rings) => (arch ? rings.map((r) => ({ ...r, y: (r.y || 0) + ay(r.z), ry: r.ry * Math.pow(1 + slope(r.z) * slope(r.z), 0.25) })) : rings);
  // a long bill is drawn with more rings, faintly upcurved, its upper ridge paler so that it reads against dark leaves
  const billRings = sp.bill > 0.8 ? [0, 0.12, 0.3, 0.5, 0.7, 0.86, 1].map((t) => ({ z: 0.515 + sp.bill * t, y: 0.07 + 0.06 * t * t, rx: lerp(0.036, 0.007, Math.pow(t, 0.8)), ry: lerp(0.04, 0.008, Math.pow(t, 0.8)), cf: (a) => (Math.sin(a) > 0.55 ? C('#3a3a34') : dark), w2: 0 }))
    : [{ z: 0.515 + sp.bill * 0.5, y: 0.07, rx: 0.019, ry: 0.019, c: dark, w2: 0 }, { z: 0.515 + sp.bill, y: 0.07, rx: 0.006, ry: 0.006, c: dark, w2: 0 }];
  G.loft(bent([
    { z: -0.42, y: 0.0, rx: 0.02, ry: 0.02, c: back, w2: 0.6 }, { z: -0.33, y: 0, rx: 0.08, ry: 0.07, cf: under(back, vent), w2: 0.7 }, { z: -0.2, y: 0, rx: 0.135, ry: 0.125, cf: under(back, belly) },
    { z: -0.05, y: 0.0, rx: 0.165, ry: 0.15, cf: under(back, belly) }, { z: 0.1, y: 0.012, rx: 0.165, ry: 0.15, cf: under(back, sp.collar ? C(sp.collar) : belly) },
    // the neck pinches in behind a round head: crown on top, the face the colour of the back, the gorget beneath
    { z: 0.2, y: 0.03, rx: 0.128, ry: 0.12, cf: under(back, throat), w2: 1.4 }, { z: 0.262, y: 0.05, rx: 0.09, ry: 0.088, cf: under(back, throat), w2: 1.6 },
    { z: 0.318, y: 0.066, rx: 0.113, ry: 0.111, cf: capped(crown, back, throat), w2: hw }, { z: 0.385, y: 0.075, rx: 0.13, ry: 0.128, cf: capped(crown, back, throat), w2: hw },
    { z: 0.445, y: 0.078, rx: 0.111, ry: 0.108, cf: capped(crown, back, throat), w2: hw * 0.9 }, { z: 0.49, y: 0.074, rx: 0.07, ry: 0.068, cf: capped(crown, back, throat), w2: hw * 0.6 },
    { z: 0.515, y: 0.07, rx: 0.034, ry: 0.034, c: dark, w2: 0 }, ...(sp.bill > 0.8 ? billRings.slice(1) : billRings),
  ]), 14, [0, 0, 0.9, 1]);
  // the eye: a dark bead each side with a glint, and the white spot behind it
  for (const s of [-1, 1]) {
    G.loft([{ z: 0.39, x: s * 0.098, y: 0.098, rx: 0.004, ry: 0.004, c: dark }, { z: 0.408, x: s * 0.106, y: 0.098, rx: 0.03, ry: 0.03, c: dark }, { z: 0.426, x: s * 0.108, y: 0.098, rx: 0.037, ry: 0.037, c: dark }, { z: 0.444, x: s * 0.106, y: 0.098, rx: 0.03, ry: 0.03, c: dark }, { z: 0.462, x: s * 0.098, y: 0.098, rx: 0.004, ry: 0.004, c: dark }], 7, [0, 0, 0, 1]);
    G.loft([{ z: 0.424, x: s * 0.136, y: 0.114, rx: 0.002, ry: 0.002, c: pale }, { z: 0.435, x: s * 0.139, y: 0.114, rx: 0.011, ry: 0.011, c: C('#ffffff', 2.5) }, { z: 0.446, x: s * 0.136, y: 0.114, rx: 0.002, ry: 0.002, c: pale }], 4, [0, 0, 0, 1]);
    G.loft([{ z: 0.318, x: s * 0.112, y: 0.106, rx: 0.003, ry: 0.003, c: pale }, { z: 0.346, x: s * 0.121, y: 0.106, rx: 0.027, ry: 0.024, c: pale }, { z: 0.374, x: s * 0.118, y: 0.106, rx: 0.003, ry: 0.003, c: pale }], 5, [0, 0, 0, 1]);
  }
  const upF = V3(0, 1, 0), sideF = V3(1, 0, 0);
  if (arch) { const th = Math.atan(slope(-0.34)); G.setXf(new THREE.Matrix4().makeTranslation(0, ay(-0.34), -0.34).multiply(new THREE.Matrix4().makeRotationX(th)).multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.34))); }
  if (sp.tailKind === 'streamers' || sp.tailKind === 'rackets') {
    const rk = sp.tailKind === 'rackets', tip = C(sp.tailTip || sp.tail, 1.0);
    for (const s of [-1, 1]) {
      const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(V3(s * (0.035 + (rk ? 0.1 : 0.2) * t * t), -0.03 * t, -0.36 - sp.tailLen * t)); }
      // a broad flat vane and a narrower one across it, so the streamer shows from every side
      const wid = (t) => (rk ? (t > 0.76 ? 0.03 + 0.15 * Math.sin((t - 0.76) / 0.24 * Math.PI) : 0.03) : 0.035 + 0.06 * Math.pow(Math.sin(Math.min(1, t * 1.06) * Math.PI), 0.7) * (1 - 0.35 * t));
      const col = (t) => (rk && t < 0.74 ? dark : tailC.clone().lerp(tip, t));
      G.ribbon(pts, wid, upF, col, (t) => [3, t, 0.0, 1]);
      G.ribbon(pts, (t) => wid(t) * 0.5, sideF, col, (t) => [3, t, 0.0, 1]);
    }
    // short green tail coverts over the roots of the streamers
    for (let k = -1; k <= 1; k++) G.ribbon([V3(k * 0.04, 0.01, -0.34), V3(k * 0.09, 0.0, -0.52), V3(k * 0.13, -0.01, -0.68)], (t) => 0.05 * (1 - 0.6 * t) + 0.01, upF, () => back, (t) => [3, t * 0.2, 0.8, 1]);
  } else if (sp.fork) {
    // a forked tail, spread: the outer feathers the longest. Laid out twice, flat and on edge, so that it is a dark spread
    // fork from the side as well as from above
    for (const face of [upF, sideF]) for (let k = -3; k <= 3; k++) {
      if (k === 0) continue;
      const a = k * 0.085 + Math.sign(k) * 0.04, len = sp.tailLen * (0.62 + 0.38 * Math.abs(k) / 3), sn = Math.sin(a) * len, cs = Math.cos(a) * len, fl = face === upF;
      const pts = [V3(0, 0, -0.33), V3(fl ? sn * 0.5 : 0, fl ? 0 : sn * 0.5, -0.33 - cs * 0.5), V3(fl ? sn : 0, fl ? -0.02 : sn, -0.33 - cs)];
      G.ribbon(pts, (t) => 0.018 + 0.05 * Math.sin(Math.min(1, t * 1.15 + 0.1) * Math.PI * 0.9), face, (t) => tailC.clone().multiplyScalar(1 - 0.35 * t), (t) => [3, t * 0.4, 0.0, 1]);
    }
  } else {
    for (let k = -2; k <= 2; k++) {
      const a = k * 0.2, pts = [V3(0, 0, -0.34), V3(Math.sin(a) * sp.tailLen * 0.5, 0, -0.34 - Math.cos(a) * sp.tailLen * 0.5), V3(Math.sin(a) * sp.tailLen, -0.02, -0.34 - Math.cos(a) * sp.tailLen)];
      G.ribbon(pts, (t) => 0.025 + 0.085 * Math.sin(Math.min(1, t * 1.2 + 0.1) * Math.PI * 0.9), upF, (t) => (Math.abs(k) === 2 && sp.tailEdge ? C(sp.tailEdge) : tailC), (t) => [3, t * 0.4, 0.4, 1]);
    }
  }
  G.setXf(null);
  if (sp.puffs) for (const s of [-1, 1]) G.loft([{ z: -0.22, x: s * 0.07, y: -0.15, rx: 0.01, ry: 0.01, c: C('#f6f6ee') }, { z: -0.13, x: s * 0.085, y: -0.2, rx: 0.135, ry: 0.125, c: C('#f6f6ee') }, { z: -0.04, x: s * 0.07, y: -0.15, rx: 0.01, ry: 0.01, c: C('#dcdcd2') }], 7, [0, 0, 0, 1]);
  return G.build();
}
// a bird that flaps: stout body, bill, optional disc crest, eyes, a fanned tail, and two real wings (parts 1 and 2):
// each a thick lens-sectioned surface that arches upward along its span, coverts in front and flight feathers behind,
// with separate spread primaries at its tip, so that it never thins to a line when seen edge-on
function flapperGeo(sp) {
  const G = new Geo(), back = C(sp.back), belly = C(sp.belly), head = C(sp.head), wingC = C(sp.wing), wing2 = C(sp.wing2 || sp.wing), tailC = C(sp.tail), billC = C(sp.billC);
  const under = C(sp.under || sp.wing), under2 = C(sp.under2 || sp.wing2 || sp.wing), trail = C(sp.trail || sp.wing), tert = sp.tertial ? C(sp.tertial) : null, throat = C(sp.throat || sp.belly);
  const cere = C(sp.cere || sp.billC), tailBand = C(sp.tailBand || sp.tail), eyeC = C(sp.eye || '#e8e2c8'), dark = C('#070707'), m = new THREE.Matrix4(), mf = new THREE.Matrix4();
  const two = (top, bot) => (a) => { const k = Math.sin(a); return k < -0.35 ? bot : k < -0.1 ? top.clone().lerp(bot, (-0.1 - k) / 0.25) : top; };
  const bl = sp.bill, bd = sp.billDepth, hook = sp.hook || 0;
  G.loft([
    { z: -0.5, y: 0.02, rx: 0.02, ry: 0.02, c: back }, { z: -0.38, y: 0.0, rx: 0.12, ry: 0.1, cf: two(back, belly) }, { z: -0.15, y: 0, rx: 0.2, ry: 0.19, cf: two(back, belly) },
    { z: 0.08, y: 0.0, rx: 0.21, ry: 0.2, cf: two(back, belly) }, { z: 0.26, y: 0.04, rx: 0.16, ry: 0.16, cf: two(head, throat) }, { z: 0.38, y: 0.08, rx: 0.14, ry: 0.14, cf: two(head, throat) },
    { z: 0.47, y: 0.09, rx: 0.11, ry: 0.11, c: head }, { z: 0.52, y: 0.08, rx: 0.055, ry: bd * 1.05, c: cere }, { z: 0.52 + bl * 0.55, y: 0.07 - hook * 0.3, rx: 0.035, ry: bd * 0.8, c: billC }, { z: 0.52 + bl, y: 0.04 - hook, rx: 0.008, ry: 0.012, c: C(sp.billTip || sp.billC) },
  ], 10, [0, 0, sp.glitter || 0, 1]);
  // eyes
  for (const s of [-1, 1]) G.loft([{ z: 0.415, x: s * 0.098, y: 0.115, rx: 0.003, ry: 0.003, c: eyeC }, { z: 0.44, x: s * 0.108, y: 0.115, rx: 0.028, ry: 0.028, c: eyeC }, { z: 0.452, x: s * 0.114, y: 0.115, rx: 0.014, ry: 0.014, c: dark }, { z: 0.465, x: s * 0.1, y: 0.115, rx: 0.003, ry: 0.003, c: dark }], 6, [0, 0, 0, 1]);
  if (sp.crest) G.loft([{ z: 0.2, y: 0.2, rx: 0.012, ry: 0.02, c: head }, { z: 0.33, y: 0.26, rx: 0.04, ry: 0.16, c: head }, { z: 0.48, y: 0.28, rx: 0.05, ry: 0.2, cf: (a) => (Math.sin(a) > 0.8 ? C(sp.crestEdge || sp.head) : head) }, { z: 0.61, y: 0.24, rx: 0.035, ry: 0.15, c: head }, { z: 0.68, y: 0.16, rx: 0.006, ry: 0.012, c: head }], 10, [0, 0, 0, 1]);
  if (sp.feet) for (const s of [-1, 1]) G.loft([{ z: -0.42, x: s * 0.07, y: -0.15, rx: 0.01, ry: 0.01, c: belly }, { z: -0.3, x: s * 0.075, y: -0.19, rx: 0.06, ry: 0.05, c: belly }, { z: -0.2, x: s * 0.075, y: -0.2, rx: 0.04, ry: 0.035, c: C(sp.feet) }, { z: -0.1, x: s * 0.075, y: -0.19, rx: 0.008, ry: 0.008, c: C(sp.feet) }], 6, [0, 0, 0, 1]);
  const half = sp.span * 0.5, armL = half * (1 - (sp.fingerLen ?? 0.24)), c0 = sp.chord, NS = 7;
  const chord = (t) => c0 * (0.78 + 0.3 * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.05))) * (1 - 0.3 * t * t * t);
  const fore = (t) => 0.03 + 0.09 * Math.sin(Math.PI * t) - 0.12 * t * t, lift = (t) => armL * (0.04 * t + 0.13 * t * t);
  for (const s of [1, -1]) {
    // loft frame: z out along the span, x toward the bill, y up
    m.makeBasis(V3(0, 0, 1), V3(0, 1, 0), V3(s, 0, 0)).setPosition(s * 0.12, 0.1, 0.05);
    G.setXf(m);
    const rings = [];
    for (let i = 0; i <= NS; i++) {
      const t = i / NS, ch = chord(t), inner = tert && t < 0.36;
      rings.push({ z: armL * t, x: fore(t), y: lift(t), rx: ch * 0.5, ry: Math.max(0.014, ch * 0.075 * (1 - 0.55 * t)), w1: t,
        cf: (a) => { const c = Math.cos(a), up = Math.sin(a) > 0; if (c < -0.9) return inner ? tert : trail; if (c > 0.25) return up ? wing2 : under2; return inner ? tert : (up ? wingC : under); } });
    }
    rings[0].rx *= 0.55; rings[0].ry *= 1.6;
    G.loft(rings, 10, [s > 0 ? 1 : 2, 0, 0, 1]);
    // the primaries: separate blades fanned from the hand, their tips curling up
    const nF = sp.fingers || 5, tipC = chord(1), Lf0 = half - armL + c0 * 0.25;
    for (let k = 0; k < nF; k++) {
      const f = k / (nF - 1), ang = -0.2 + 1.05 * f, Lf = Lf0 * (1.12 - 0.5 * f * f), wF = tipC * (sp.fingerW ?? 0.3);
      mf.makeRotationY(-ang).setPosition(fore(1) + tipC * (0.36 - 0.72 * f), lift(1) - 0.004 * k, armL - 0.04 * c0);
      G.setXf(m.clone().multiply(mf));
      const fr = []; for (let i = 0; i <= 4; i++) { const t = i / 4; fr.push({ z: Lf * t, x: -0.06 * Lf * t * t, y: 0.14 * Lf * t * t, rx: wF * 0.5 * (0.75 + 0.35 * Math.sin(Math.PI * t)) * (1 - 0.72 * t * t * t * t), ry: 0.012, w1: 1,
        cf: (a) => (t > 0.45 || Math.sin(a) > 0 ? (t > 0.45 ? trail : wingC) : under) }); }
      G.loft(fr, 6, [s > 0 ? 1 : 2, 1, 0, 1]);
    }
  }
  // the tail: a fan of blades
  const nT = sp.tailN || 7;
  for (let k = 0; k < nT; k++) {
    const a = (k - (nT - 1) / 2) * sp.tailFan, Lt = sp.tailLen * (1 - 0.1 * Math.abs(k - (nT - 1) / 2) / nT);
    mf.makeRotationY(Math.PI - a).setPosition(0, 0.02 - 0.003 * Math.abs(k - (nT - 1) / 2), -0.4);
    G.setXf(mf);
    const tr = []; for (let i = 0; i <= 3; i++) { const t = i / 3; tr.push({ z: Lt * t, y: -0.02 * t, rx: 0.035 + 0.06 * Math.sin(Math.PI * Math.min(1, t * 0.8 + 0.15)), ry: 0.012, w1: t * 0.25, c: t > 0.6 ? tailBand : tailC }); }
    tr[3].rx *= 0.45;
    G.loft(tr, 6, [3, 0, 0, 1]);
  }
  G.setXf(null);
  return G.build();
}
// the spectacled bear, standing on all fours (it faces +z; about 19 m from nose to tail, 9 m at the shoulder: we are a
// hummingbird a metre long): trunk, head (part 4, turns), the near foreleg (part 1, rakes about X at the shoulder), three legs
function bearGeo() {
  const G = new Geo(), black = C('#0c0b0a'), fur = C('#17120f'), cream = C('#e6d8ac'), m = new THREE.Matrix4();
  const bib = (a) => (Math.sin(a) < -0.45 ? cream : fur);
  G.loft([{ z: -8.0, y: 5.7, rx: 0.25, ry: 0.25, c: black }, { z: -7.4, y: 5.5, rx: 2.3, ry: 2.4, c: fur }, { z: -5.6, y: 5.3, rx: 3.25, ry: 3.3, c: fur }, { z: -2.6, y: 5.0, rx: 3.5, ry: 3.4, c: fur },
    { z: 0.4, y: 5.1, rx: 3.4, ry: 3.4, c: fur }, { z: 3.0, y: 5.5, rx: 3.3, ry: 3.7, c: fur }, { z: 5.0, y: 5.8, rx: 2.8, ry: 3.1, cf: bib }, { z: 6.4, y: 5.9, rx: 2.2, ry: 2.4, cf: bib }, { z: 7.2, y: 5.9, rx: 1.6, ry: 1.7, c: fur }], 16, [0, 0, 0, 1]);
  // head: a broad skull, the pale rings round the eyes that give it its name, a short pale muzzle, a dark nose
  const spec = (a) => { const sn = Math.sin(a), c = Math.abs(Math.cos(a)); return sn > -0.05 && sn < 0.8 && c > 0.3 && c < 0.9 ? cream : fur; };
  G.loft([{ z: 5.9, y: 5.9, rx: 0.3, ry: 0.3, c: fur }, { z: 6.5, y: 5.9, rx: 1.9, ry: 1.9, c: fur }, { z: 7.6, y: 5.95, rx: 2.3, ry: 2.15, c: fur }, { z: 8.6, y: 5.75, rx: 2.05, ry: 1.85, cf: spec },
    { z: 9.4, y: 5.3, rx: 1.3, ry: 1.15, cf: spec }, { z: 10.3, y: 5.05, rx: 0.98, ry: 0.86, c: cream }, { z: 10.9, y: 5.0, rx: 0.62, ry: 0.55, c: black }, { z: 11.1, y: 5.0, rx: 0.1, ry: 0.1, c: black }], 14, [4, 0, 0, 1]);
  for (const sg of [-1, 1]) {
    G.setXf(m.makeTranslation(sg * 1.7, 7.75, 7.3)); G.loft([{ z: -0.35, rx: 0.1, ry: 0.1, c: fur }, { z: 0, rx: 0.7, ry: 0.78, c: fur }, { z: 0.35, rx: 0.1, ry: 0.1, c: black }], 8, [4, 0, 0, 1]);
    G.setXf(m.makeTranslation(sg * 1.25, 6.35, 9.15)); G.loft([{ z: -0.2, rx: 0.05, ry: 0.05, c: black }, { z: 0, rx: 0.3, ry: 0.3, c: black }, { z: 0.2, rx: 0.05, ry: 0.05, c: black }], 6, [4, 0, 0, 1]);
  }
  // legs: columns of fur down to broad dark paws (the loft's axis is turned upright: its z is height, its y points back)
  const leg = (x, z, hTop, fat, part, wgt) => {
    G.setXf(m.makeRotationX(-Math.PI / 2).setPosition(x, 0, z));
    G.loft([{ z: 0.0, y: -0.5, rx: 0.3, ry: 0.4, c: black }, { z: 0.15, y: -0.5, rx: 1.3 * fat, ry: 1.75 * fat, c: black }, { z: 0.9, y: -0.35, rx: 1.25 * fat, ry: 1.6 * fat, c: black }, { z: 1.8, y: 0, rx: 0.95 * fat, ry: 1.05 * fat, c: fur },
      { z: hTop * 0.55, y: 0, rx: 1.1 * fat, ry: 1.3 * fat, c: fur }, { z: hTop * 0.85, y: 0.1, rx: 1.4 * fat, ry: 1.9 * fat, c: fur }, { z: hTop, y: 0.1, rx: 1.1 * fat, ry: 1.5 * fat, c: fur }], 10, [part, wgt, 0, 1]);
  };
  leg(2.0, 3.7, 6.6, 1.0, 1, 0.6); leg(-2.0, 3.3, 6.6, 1.0, 0, 0); leg(2.1, -5.0, 6.2, 1.12, 0, 0); leg(-2.1, -5.6, 6.2, 1.12, 0, 0);
  G.setXf(null);
  return G.build();
}
// the bumblebee: black and white bands
function beeGeo() {
  const G = new Geo(), k = C('#0c0c0d'), w = C('#e6e4da'), y = C('#d9c15a');
  G.loft([{ z: -0.2, rx: 0.01, ry: 0.01, c: w }, { z: -0.16, rx: 0.06, ry: 0.055, c: w }, { z: -0.1, rx: 0.085, ry: 0.08, c: k }, { z: -0.04, rx: 0.09, ry: 0.085, c: w }, { z: 0.0, rx: 0.07, ry: 0.07, c: k },
    { z: 0.04, rx: 0.075, ry: 0.08, c: k }, { z: 0.1, rx: 0.08, ry: 0.085, c: y }, { z: 0.15, rx: 0.06, ry: 0.06, c: k }, { z: 0.19, rx: 0.045, ry: 0.045, c: k }, { z: 0.21, rx: 0.01, ry: 0.01, c: k }], 9, [0, 0, 0, 1]);
  return G.build();
}

// ---- the looks: hour of day (sky, light, mist, grade); weather and cast are drawn on top -----------------------
const LOOKS = {
  morning: { preset: 'day', sun: [0.53, 0.848, 0.0], zenith: '#5f97cc', mid: '#b4cfdc', horizon: '#dde8e4', ground: '#c9d9d5', fog: '#d2dfdb', fogK: 0.9, dens: 0.0034, low: [-31, 0.011, 9],
    clouds: { coverage: 0.8, softness: 0.5, scale: 1.3, lit: '#f4f5ef', shade: '#a6bbc0' }, sunI: 9, exposure: 1.0, bloom: 0.4, sat: 1.1, tint: '#ffffff', shadow: '#02100a', portal: '#fff2d2', shafts: 1 },
  dawn: { preset: 'dawn', sun: [0.96, 0.2, 0.18], zenith: '#7184b4', mid: '#c6b4c4', horizon: '#f2cfc2', ground: '#d6c4c6', fog: '#e2cbc8', fogK: 0.8, dens: 0.0038, low: [-24, 0.014, 8],
    clouds: { coverage: 0.72, softness: 0.5, scale: 1.2, lit: '#ffd8c6', shade: '#8f90ad' }, sunI: 10, exposure: 1.05, bloom: 0.45, sat: 1.08, tint: '#fff4f0', shadow: '#0a0814', portal: '#ffe0d0', shafts: 0.55 },
  afternoon: { preset: 'goldenHour', sun: [-0.94, 0.342, 0.0], zenith: '#5c8fca', mid: '#c9cfc0', horizon: '#eee0c4', ground: '#d4d3c2', fog: '#dadccd', fogK: 0.84, dens: 0.0033, low: [-33, 0.010, 9],
    clouds: { coverage: 0.7, softness: 0.5, scale: 1.3, lit: '#ffe8be', shade: '#a3a49c' }, sunI: 11, exposure: 1.0, bloom: 0.45, sat: 1.1, tint: '#fff8ec', shadow: '#0a0c04', portal: '#ffe6b0', shafts: 1 },
  bluehour: { preset: 'blueHour', sun: [-0.9, 0.3, 0.3], zenith: '#16265a', mid: '#3d5596', horizon: '#7189c4', ground: '#465a90', fog: '#5d74ad', fogK: 0.62, dens: 0.0034, low: [-31, 0.011, 9],
    clouds: { coverage: 0.5, softness: 0.5, scale: 1.3, lit: '#93a6dc', shade: '#2a3868' }, sunI: 0, exposure: 1.35, bloom: 0.5, sat: 1.05, tint: '#eef2ff', shadow: '#04061a', portal: '#bcd0ff', shafts: 0 },
};
const RIVALS = {
  sylph: { back: '#1f9a4c', belly: '#17703e', throat: '#3b6cf0', crown: '#35c070', tail: '#8a3ad8', tailTip: '#6a48f0', tailKind: 'streamers', tailLen: 1.7, bill: 0.2, irid: '#39e07a', fan: '#7f8c82' },
  inca: { back: '#0c1a14', belly: '#0b120f', throat: '#0b120f', collar: '#f0f0e8', tail: '#e8e8e0', tailEdge: '#e8e8e0', tailKind: 'fan', tailLen: 0.55, bill: 0.42, irid: '#2a8f5a', fan: '#8f9892' },
  sapphirewing: { back: '#1c8a5a', belly: '#1a6a48', throat: '#27a06a', tail: '#162a4a', tailKind: 'fan', tailLen: 0.7, bill: 0.3, irid: '#3ad0a0', fan: '#5f86f0' },
};

export default {
  id: 'swordbill-round',
  name: "The Swordbill's Round",
  category: 'wilderness',
  weirdness: 0.05,
  media: ['air', 'tiny'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const vr = rng.fork('look');
    // ---- which visit is this -------------------------------------------------------------------------------
    let hour = { dawn: 'dawn', day: 'morning', golden: 'afternoon', night: 'bluehour' }[vary.hour];
    const pk = (arr) => arr[Math.min(arr.length - 1, Math.floor(vr() * arr.length))];
    const hr = pk(['afternoon', 'morning', 'afternoon', 'morning', 'dawn', 'morning', 'dawn', 'bluehour']); if (!hour) hour = hr;
    const wr = vr(); let weather = wr < 0.25 ? 'drizzle' : wr < 0.55 ? 'mist' : wr < 0.78 ? 'clear' : 'mist'; if (hour === 'dawn' && weather === 'clear') weather = 'mist';
    const bloomForm = pk(['scarlet', 'flame', 'scarlet', 'yellow', 'scarlet']);
    const rivalKind = pk(['sylph', 'inca', 'sylph', 'sapphirewing', 'sylph']);
    const toucans = vr() < 0.3, bearMode = pk(['bear', 'cub', 'bear', 'none', 'bear']), fuchsiaFirst = vr() > 0.6;
    const rare = !!vary.rare, density = Math.round(clamp(300 * (vary.density ?? 1), 220, 380));
    const LK = LOOKS[hour], clear = weather === 'clear', drizzle = weather === 'drizzle';
    const pal = PALETTE.map((h) => new THREE.Color(h)), [cPearl, cMist, cGreen, cDeep, cYel, cRed, cViolet] = pal;

    // ---- the hero tree, and the flight line laid round it ------------------------------------------------------
    // pathOld is the line this forest was grown round: every "is it in the way" question of the scatter is still put to
    // it, so each seed keeps its trees, ferns and bells; `path` is the line flown, and what would now stand in it is
    // taken out afterwards without disturbing a single random draw.
    let path = null, pathOld = null;
    const polys = (pa, u0, du) => {
      const n = Math.ceil(pa.length * du / 3), poly = [], out = [];
      for (let i = 0; i <= n; i++) poly.push(pa.pointAt(u0 + du * i / n).sub(ORIGIN));
      for (let i = 0; i < poly.length - 1; i += 12) out.push(poly.slice(i, i + 13));
      return out;
    };
    const hero = await buildHero(ctx, { palette: PALETTE, hour, weather, bloom: bloomForm, density, sunDir: LK.sun, shafts: LK.shafts > 0, fogCut: 0.3, mistAlpha: 0.5, farFrom: V3(0, 0, 0).sub(ORIGIN),
      route: (A) => { pathOld = makePath(routeOld(A, ORIGIN)); path = makePath(route(A, ORIGIN)); return polys(pathOld, 0.385, 0.55); },
      avoid: () => polys(path, 0.592, 0.338),
      // the eyes on the rise that the tree keeps its leaves out of the sight of: from each a cone to the portal's seat (r: its radius at the seat; to: the
      // share of the way it runs; cut 'leaves': leaf clusters and beards only). They stand at even steps of ROUTE METRES from the place of u 0.80 to the
      // place of u 0.83, both ends kept (pointAt goes by length along the line, so even shares of that stretch are even steps in metres). The step is the
      // spacing of a test along the route (2 to 3 m, never steps of u), 2.5 m: the stretch is cut into one step at the least, the
      // whole number of steps nearest that.
      sight: () => { const u0 = 0.8, u1 = 0.83, n = Math.max(1, Math.round((u1 - u0) * path.length / 2.5)), eyes = []; for (let k = 0; k <= n; k++) eyes.push({ from: path.pointAt((u0 * (n - k) + u1 * k) / n).sub(ORIGIN), r: 7.4, to: 0.92, cut: 'leaves' }); return eyes; },
      feeder: { mouth: FEED.clone().sub(ORIGIN), root: V3(SNAG.x - FEED_F.x, SNAG.top, SNAG.z - FEED_F.z).sub(ORIGIN), side: FEED_L.clone().addScaledVector(FEED_F, 0.25) } });
    // clear of the line flown as well as of the old one (nothing that passed the old test may now stand in our way)
    const newClear = (x, y, z, m) => path.distanceTo(x, y, z) >= m;
    // everything added for the way out to the feeder draws from a stream of its own: the forest's draws are left as they were
    const nz = makeRng(hashSeed('swordbill-round:feeder:' + (ctx.seed ?? 0)));
    await ctx.yield();
    const scene = new THREE.Scene();
    hero.object.position.copy(ORIGIN); scene.add(hero.object);
    const A = hero.anchors, WO = (p) => p.clone().add(ORIGIN), L = path.length;
    const crownC = V3(0, 15, -204), PS = WO(A.portalSeat.position), N0 = WO(A.naveFoot), naveDir = PS.clone().sub(N0).normalize();
    const M1 = WO(A.stopSun.flower), M3 = WO(A.stopThroat.flower), ax3 = A.stopThroat.axis.clone();
    const five = V3(); for (const b of A.stopBacklit.bells) five.add(b); five.multiplyScalar(1 / A.stopBacklit.bells.length).add(ORIGIN).add(V3(0, 2.0, 0));

    // ---- light, mist and the uniforms every material shares ----------------------------------------------------
    const fogCol = new THREE.Color(LK.fog).multiplyScalar(LK.fogK);
    const dens = LK.dens * (clear ? 0.66 : drizzle ? 1.15 : 1);
    scene.fog = new THREE.FogExp2(fogCol, dens);
    const lowDens = LK.low[1] * (clear ? 0.6 : 1);
    const HU = hero.uniforms, windN = A.wind.clone().normalize();
    if (hour === 'bluehour') { HU.uSkyCol.value.multiplyScalar(1.5); HU.uGroundCol.value.multiplyScalar(1.6); HU.uSunCol.value.multiplyScalar(1.5); }
    const SU = {
      uTime: { value: 0 }, uSunDir: HU.uSunDir, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uGroundCol: HU.uGroundCol,
      uFogCol: { value: fogCol }, uFogP: { value: new THREE.Vector4(dens, LK.low[0] - (clear ? 6 : 0), LK.low[1] * (clear ? 0.6 : 1), LK.low[2]) },
      uWindV: { value: windN.clone() }, uWindN: { value: windN },
      uGreen: { value: cGreen.clone() }, uDeep: { value: cDeep.clone() }, uPearl: { value: cPearl.clone() }, uYel: { value: cYel.clone() },
      uEagle: { value: new THREE.Vector4(0, 0, 0, 0) }, uEagleR: { value: V3(1, 0, 0) }, uBear: { value: new THREE.Vector4(0, 0, 0, 0) }, uBearR: { value: V3(0, 0, 1) }, uCool: { value: hour === 'afternoon' ? 0.6 : hour === 'bluehour' ? 0 : 0.4 },
      uFogUp: { value: fogCol.clone().lerp(new THREE.Color(LK.mid).lerp(new THREE.Color(LK.zenith), 0.4).multiplyScalar(LK.fogK), hour === 'afternoon' ? (clear ? 0.85 : 0.7) : clear ? 0.65 : 0.5) },
    };
    const uRes = { value: new THREE.Vector2(800, 450) }, uEntry = { value: 1 }, uVeil = { value: 1 };
    const surf = (kind, P, o = {}) => new THREE.ShaderMaterial({ uniforms: { ...SU, uKind: { value: kind }, uDapple: { value: o.dapple ?? 1 }, uP: { value: new THREE.Vector4(P[0], P[1], P[2], P[3]) } },
      vertexShader: SURF_VS, fragmentShader: SURF_FS, vertexColors: true, side: THREE.DoubleSide });
    const add = (m, order = 0) => { m.frustumCulled = false; m.renderOrder = order; scene.add(m); return m; };
    const sunW = V3(LK.sun[0], LK.sun[1], LK.sun[2]).normalize();

    const sky = makeSky({ rng, preset: LK.preset, sunDirection: LK.sun, zenith: LK.zenith, mid: LK.mid, horizon: LK.horizon, ground: LK.ground, groundFalloff: 3,
      clouds: clear ? { ...LK.clouds, coverage: LK.clouds.coverage * 0.6 } : LK.clouds, clouds2: false, sunIntensity: LK.sunI, sunSize: 1.3, fogColor: fogCol, stars: hour === 'bluehour' ? 0.5 : 0,
      ...(hour === 'bluehour' ? { bodies: [{ direction: LK.sun, size: 1.6, color: '#f4f0dc', phase: 0.8, glow: 0.5, intensity: 3 }], key: 0 } : {}) });
    scene.add(sky.object);
    await ctx.yield();

    // ---- the forest's wood: giant trunks out of the mist, the limb we fly along, three limbs overhead, lianas ----
    // the forest's stream. The builders below all draw from `fr`; frUse(nz) lends them the feeder's stream while something new
    // is built with them, so that the old forest's draws stay exactly as they were
    const fr0 = rng.fork('forest'); let frNow = fr0;
    const fr = Object.assign(() => frNow(), { range: (a, b) => frNow.range(a, b), chance: (q) => frNow.chance(q), int: (a, b) => frNow.int(a, b), pick: (a) => frNow.pick(a), sign: () => frNow.sign(), gauss: () => frNow.gauss() });
    const frUse = (r) => { frNow = r || fr0; };
    const grey = (k) => new THREE.Color(0.33 * k, 0.33 * k, 0.325 * k);
    const barkG = new Geo(), trunks = [
      { x: -16, z: -116, r: 4.8, k: 0.3, fixed: 1, dx: -3.6, rs: 0.9 }, { x: 31, z: -127, r: 5.5, k: 0.44, fixed: 1 }, { x: -30, z: -40, r: 4.6, k: 0.9, fixed: 1 }, { x: 27, z: -30, r: 4.2, k: 1, fixed: 1 },
      { x: -21, z: -78, r: 4.0, k: 1.05, fixed: 1 }, { x: 30, z: -76, r: 5.2, k: 0.9, fixed: 1, dx: 3.2, rs: 0.79 }, { x: -47, z: -88, r: 5 }, { x: 52, z: -50, r: 4.5 }, { x: -58, z: -30, r: 5.5 }, { x: 62, z: -100, r: 5 },
      { x: 59.5, z: -137, r: 4.6, k: 0.8, fixed: 1 }, { x: 75, z: -166, r: 5, k: 0.9, fixed: 1 }, { x: -44, z: -134, r: 4.2 }, { x: -72, z: -108, r: 5 }, { x: 80, z: -68, r: 5 }, { x: 36, z: -288, r: 3.4, top: -23, fixed: 1 },
    ];
    let ti = 0;
    for (const t of trunks) {
      if (!t.fixed) { t.x += fr.range(-5, 5); t.z += fr.range(-5, 5); t.r *= fr.range(0.85, 1.15); t.k = fr.range(0.8, 1.1); }
      const sd = fr.range(0, 60), lean = fr.range(-0.035, 0.035), lean2 = fr.range(-0.035, 0.035), top = t.top ?? 125, pts = [];
      // dx, rs: two trunks have since been moved aside and slimmed to give the flight room. at0 / r0 are where they stood: whether
      // anything grows on them or hangs from them is still decided there, so every seed keeps its forest
      const x0 = t.x; t.r0 = t.r; if (t.dx) { t.x += t.dx; t.r *= t.rs; }
      t.at0 = (y) => V3(x0 + lean * y + 0.9 * Math.sin(y * 0.031 + sd), y, t.z + lean2 * y + 0.9 * Math.cos(y * 0.027 + sd));
      for (let y = -135; y <= top + 0.1; y += (top + 135) / 28) pts.push(V3(t.x + lean * y + 0.9 * Math.sin(y * 0.031 + sd), y, t.z + lean2 * y + 0.9 * Math.cos(y * 0.027 + sd)));
      t.at = (y) => V3(t.x + lean * y + 0.9 * Math.sin(y * 0.031 + sd), y, t.z + lean2 * y + 0.9 * Math.cos(y * 0.027 + sd));
      const col = grey(t.k ?? 0.9);
      // the two trunks that frame the old tree from the entry (ti 0, 1) are marked (aW.w = 1): dark and standing clear of the mist from far off, bark and moss near to
      const frameW = ti < 2 ? () => [0, 0, 1, 1] : null;
      barkG.tube(pts, 22, (i, tt) => t.r * (1.1 - 0.2 * tt), () => col, (i, a, len) => 1 + 0.085 * Math.sin(a * 5 + sd + len * 0.012) + 0.05 * Math.sin(a * 3 - len * 0.05 + sd) + 0.035 * Math.sin(a * 9 + len * 0.11), frameW);
      if ((++ti & 3) === 0) await ctx.yield();
    }
    const limbCurves = [];
    const ropeG = new Geo(), ropeC = new THREE.Color(0.1, 0.105, 0.06);
    const limb = (ctrl, r0, r1, n, radial, k = 0.9, G = barkG) => {
      const pts = spaced(ctrl.map((p) => V3(p[0], p[1], p[2])), n), sd = fr.range(0, 40), col = G === barkG ? grey(k) : ropeC;
      G.tube(pts, radial, (i, t) => lerp(r0, r1, t), () => col, (i, a, len) => 1 + 0.07 * Math.sin(a * 3 + len * 0.5 + sd) + 0.05 * Math.sin(len * 1.3 + sd * 1.7) + 0.05 * noise.n3(Math.cos(a) * 1.5 + sd, Math.sin(a) * 1.5, len * 0.35));
      const c = { pts, r: (t) => lerp(r0, r1, t) }; limbCurves.push(c); return c;
    };
    const road = limb([[0.6, -10.6, 24], [0, -9.4, 8], [-0.3, -8.0, -8], [0.4, -7.3, -24], [1.0, -7.6, -42], [0, -9.0, -60], [-4.5, -12, -80], [-10.5, -16, -98], [-15, -19, -113]], 2.6, 3.4, 56, 18, 0.8);
    await ctx.yield();
    // From the entry the trumpet tree's crown stands on the axis, 11 degrees either side of it and from 5 degrees below the
    // level to 14.5 above. Nothing may cross it: the passionflower's bough is a cantilever from the right-hand trunk that stops
    // above the crown's top, and the limb between the two framing trunks runs high in the roof of the forest.
    const inCone = (x, y, z) => z < -15 && z > -190 && Math.abs(x) < 0.2 * -z + 1.5 && y > 0.0875 * z && y < -0.26 * z;
    const ghost = (ctrl) => ({ pts: spaced(ctrl.map((p) => V3(p[0], p[1], p[2])), 22) });      // where a limb used to run: its scatter is still drawn from there, so that every seed keeps its forest
    const over = [
      limb([[-30, 9, -40], [-14, 12.5, -37], [2, 13.8, -35], [16, 12, -31], [27, 9, -30]], 1.7, 1.5, 22, 10),
      limb([[30, 16, -76], [22, 20.5, -76.4], [14, 22.6, -76.9], [7.5, 22.4, -77.2], [2.5, 20.6, -77.6]], 1.7, 0.75, 22, 10),
      limb([[-19, 50, -116], [-4, 57, -121], [10, 59, -124], [24, 56, -126], [31, 50, -127]], 1.7, 1.6, 22, 10, 0.6),
      limb([[27, 22, -30], [38, 25, -40], [47, 24, -47], [52, 20, -50]], 1.4, 1.2, 14, 8),
      limb([[-30, 24, -40], [-27, 27, -55], [-23, 25, -68], [-21, 21, -78]], 1.4, 1.2, 16, 8),
      limb([[27, 12, -30], [17, 15.5, -42], [10, 16.6, -53], [17, 15.5, -65], [30, 12, -76]], 1.3, 1.2, 24, 9),      // the fuchsia's bough, bowing in over the entry
    ];
    // boughs under the chase: gardens that streak through the lower part of the frame as we follow the sylph
    over[1].was = ghost([[-21, 12, -78], [-8, 15.5, -76], [7, 16.8, -77], [20, 15, -76], [30, 11, -76]]); over[1].was.r = 1.55; over[1].was.r0 = 1.6; over[1].was.r1 = 1.5;
    over[2].was = ghost([[-16, 6, -116], [-4, 10, -121], [10, 11.5, -124], [24, 8, -126], [31, 5, -127]]); over[2].was.r = 1.65; over[2].was.r0 = 1.7; over[2].was.r1 = 1.6;
    const below = [
      limb([[-16, -15, -116], [-2, -16.5, -118.5], [14, -17, -123], [31, -15.5, -127]], 1.9, 1.7, 22, 10, 0.85),
      limb([[31, -18, -127], [41, -19.5, -130], [51, -19, -134], [59.5, -17, -137]], 1.8, 1.6, 16, 10, 0.85),
      limb([[59.5, -19.5, -137], [65, -21.5, -146], [70, -21.5, -156], [75, -19, -166]], 1.8, 1.6, 16, 10, 0.8),
      limb([[30, -13, -76], [22, -15, -88], [8, -16, -102], [-16, -13, -116]], 1.7, 1.5, 22, 9, 0.9),
      // a bough reaching west from the far trunk of the chase, low on our left as we follow the sylph out over the ravine
      limb([[75, -17, -166], [62, -17.5, -163.5], [50, -14.5, -158], [40, -12.5, -153], [32, -10.5, -150]], 1.8, 0.8, 18, 9, 0.8),
      // a great liana let down out of the trumpet tree's crown: it hangs across the lower left of the dive, dark on the bright mist
      limb([[-16, 6, -203], [-13.6, -6, -200.6], [-12.2, -12.6, -197], [-10.4, -15.6, -193.6], [-7.6, -18.4, -189.2], [-4.4, -22.5, -191.5], [-1.5, -28, -197], [0, -34, -203]], 0.72, 0.4, 20, 8, 0.7, ropeG),
    ];
    await ctx.yield();
    const lianas = [];
    for (let i = 0; i < 16; i++) {
      const a = fr.pick(trunks.slice(0, 15)), b = fr.pick(trunks.slice(0, 15)); if (a === b) continue;
      const ya = fr.range(10, 60), yb = fr.range(-20, 40), pa0 = a.at0(ya), pb0 = b.at0(yb), d = pa0.distanceTo(pb0), pa = a.at(ya), pb = b.at(yb);
      if (d > 85) continue;
      const sag = d * fr.range(0.25, 0.45), hang = (p, q) => { const mid = p.clone().lerp(q, 0.5); mid.y -= sag; return spaced([p, p.clone().lerp(mid, 0.5).add(V3(0, -d * 0.06, 0)), mid, q.clone().lerp(mid, 0.5).add(V3(0, -d * 0.06, 0)), q], 18); };
      const pts0 = hang(pa0, pb0), pts = a.dx || b.dx ? hang(pa, pb) : pts0;
      let ok = true; for (const p of pts0) if (pathOld.distanceTo(p.x, p.y, p.z) < 9) { ok = false; break; }
      if (!ok) continue;
      const rr = fr.range(0.16, 0.34), col = grey(0.7);
      pts.was = pts0;
      if (pts0.some((p) => inCone(p.x, p.y, p.z) || inCone(p.x, p.y - 4, p.z)) || pts.some((p) => inCone(p.x, p.y, p.z) || inCone(p.x, p.y - 4, p.z) || !newClear(p.x, p.y, p.z, 9))) { pts.hidden = true; lianas.push(pts); continue; }
      barkG.tube(pts, 5, () => rr, () => col, null); lianas.push(pts);
    }
    await ctx.yield();
    // three lianas slung under the line of the chase
    for (const q of [[-16, -5, -116, 31, -8, -127, 0.26], [31, -6, -127, 59.5, -9, -137, 0.3], [59.5, -4, -137, 75, -12, -166, 0.28], [30, -3, -76, 31, -9, -127, 0.25]]) {
      const pa = V3(q[0], q[1], q[2]), pb = V3(q[3], q[4], q[5]), d = pa.distanceTo(pb), mid = pa.clone().lerp(pb, 0.5); mid.y -= d * q[6];
      const pts = spaced([pa, pa.clone().lerp(mid, 0.5).add(V3(0, -d * 0.06, 0)), mid, pb.clone().lerp(mid, 0.5).add(V3(0, -d * 0.06, 0)), pb], 18);
      let ok = true; for (const p of pts) if (pathOld.distanceTo(p.x, p.y, p.z) < 6.5 || !newClear(p.x, p.y, p.z, 6.5)) { ok = false; break; }
      if (!ok) continue;
      barkG.tube(pts, 6, () => 0.3, () => grey(0.75), null); lianas.push(pts);
    }
    await ctx.yield();
    // the head of the bear's short tree: a mossy boss of wood for it to sit on
    const bearAt = V3(36, -13, -288);
    {
      const sd = fr.range(0, 9), col = grey(0.8), lump = (k) => 1 + 0.12 * Math.sin(k * 2.3 + sd);
      barkG.setXf(new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(bearAt.x, bearAt.y - 6.2, bearAt.z));
      barkG.loft([[-5.5, 1.6], [-3.4, 4.2], [-1.6, 7.4], [0.4, 9.6], [2.6, 9.2], [4.3, 6.6], [5.2, 3.2], [5.55, 0.3]].map((q, k) => ({ z: q[0], rx: q[1] * lump(k), ry: q[1] * lump(k + 3), x: 0.4 * Math.sin(k + sd), y: 0.4 * Math.cos(k * 1.7 + sd), c: col })), 14, [0, 0, 1, 0]);
      barkG.setXf(null);
    }
    await ctx.yield();
    // the snag out in the ravine: a great trunk broken off at our height, its top a ring of splinters round a mossy hollow.
    // A young trumpet tree has rooted in it (the hero builds that), and its first great bell hangs out over the void
    {
      const sd = nz.range(0, 40), col = grey(0.62), pts = [], lean = 0.035, at = (y) => V3(SNAG.x + lean * (y - SNAG.top) + 0.8 * Math.sin(y * 0.04 + sd), y, SNAG.z - 0.02 * (y - SNAG.top) + 0.8 * Math.cos(y * 0.033 + sd));
      const off = at(SNAG.top); off.set(SNAG.x - off.x, 0, SNAG.z - off.z);
      for (let k = 0; k <= 22; k++) pts.push(at(lerp(-140, SNAG.top - 1.2, k / 22)).add(off));
      const lump = (i, a, len) => 1 + 0.11 * Math.sin(a * 4 + sd + len * 0.02) + 0.06 * Math.sin(a * 7 - len * 0.07 + sd) + 0.04 * Math.sin(a * 11 + len * 0.13);
      barkG.tube(pts, 20, (i, t) => SNAG.r * (1.22 - 0.22 * t), () => col, lump);
      // the broken rim: splinters of the outer wood left standing, the tallest on the side away from us
      for (let k = 0; k < 11; k++) {
        const a = (k / 11) * 6.283 + nz.range(-0.2, 0.2), tall = (0.9 + 2.6 * Math.pow(0.5 + 0.5 * Math.cos(a - 2.6), 2)) * nz.range(0.7, 1.25), rr = SNAG.r * nz.range(0.82, 0.96), wd = nz.range(0.9, 1.5);
        const base = V3(SNAG.x + Math.cos(a) * rr, SNAG.top - 2.6, SNAG.z + Math.sin(a) * rr), tip = V3(SNAG.x + Math.cos(a) * rr * 0.93 + nz.range(-0.3, 0.3), SNAG.top + tall, SNAG.z + Math.sin(a) * rr * 0.93 + nz.range(-0.3, 0.3));
        barkG.tube([base, base.clone().lerp(tip, 0.45), base.clone().lerp(tip, 0.8), tip], 5, (i, t) => wd * (1 - 0.86 * t * t), () => col, null, null, true);
      }
      // the hollow's floor: a mossy cushion a little below the rim
      barkG.setXf(new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(SNAG.x, SNAG.top - 1.3, SNAG.z));
      barkG.loft([[-0.4, 4.3], [0.1, 4.0], [0.55, 3.1], [0.9, 1.7], [1.05, 0.2]].map((q, k) => ({ z: q[0], rx: q[1], ry: q[1], c: col })), 12, [0, 0, 1, 0]);
      barkG.setXf(null);
    }
    await ctx.yield();
    add(new THREE.Mesh(barkG.build(), surf(1, [0, 0, 0.55, 0.08])));
    await ctx.yield();
    add(new THREE.Mesh(ropeG.build(), surf(0, [0.9, 0.3, 0, 0.06], { dapple: 0.5 })));
    await ctx.yield();

    // ---- moss beards under every limb and liana --------------------------------------------------------------
    const beardG = new Geo(), bGreen = new THREE.Color().copy(cGreen).multiplyScalar(0.55).add(cDeep.clone().multiplyScalar(0.7)), bPale = cPearl.clone().multiplyScalar(0.3).add(cGreen.clone().multiplyScalar(0.5));
    // was = where this beard hung before its limb was moved (its draws follow the old place); hide = draw and build nothing
    const beard = (top, Lb, w, G = beardG, was = null, hide = false) => {
      const tt = was || top, bot = tt.y - Lb; if (pathOld.distanceTo(tt.x, bot, tt.z) < 5.6 || pathOld.distanceTo(tt.x, tt.y - Lb * 0.5, tt.z) < 5.6) return;
      const ph = fr(), a0 = fr.range(0, Math.PI), pts = [];
      if (hide) return;
      if (was && (pathOld.distanceTo(top.x, top.y - Lb, top.z) < 5.6 || pathOld.distanceTo(top.x, top.y - Lb * 0.5, top.z) < 5.6)) return;
      if (!newClear(top.x, top.y - Lb, top.z, 6.2) || !newClear(top.x, top.y - Lb * 0.5, top.z, 6.2) || !newClear(top.x, top.y, top.z, 5)) return;
      // nothing hangs into the sight of the crown: a beard over it is cut short at the cone's roof
      if (top.z < -15 && top.z > -190 && Math.abs(top.x) < 0.2 * -top.z + 1.5 && top.y - Lb < -0.26 * top.z && top.y > 0.0875 * top.z) { Lb = top.y + 0.26 * top.z; if (Lb < 1.5) return; }
      for (let k = 0; k <= 4; k++) pts.push(V3(top.x, top.y - Lb * k / 4, top.z));
      for (let pl = 0; pl < 2; pl++) { const a = a0 + pl * 1.57; G.ribbon(pts, (t) => w * (1 - 0.25 * t), V3(Math.cos(a), 0, Math.sin(a)), (t) => bGreen.clone().lerp(bPale, t * 0.8), (t) => [t * t * 1.4, ph, 0.9, 1.2]); }
    };
    const steep = (c, i) => { const a = c.pts[i - 1], b = c.pts[i + 1]; return Math.abs(b.y - a.y) > 0.9 * Math.hypot(b.x - a.x, b.z - a.z); };
    for (const c of below) for (let i = 1; i < c.pts.length - 1; i++) { if (fr.chance(0.9) && !steep(c, i)) beard(c.pts[i].clone().add(V3(fr.range(-0.6, 0.6), -c.r(0.5) * 0.8, fr.range(-0.6, 0.6))), fr.range(3, 7), fr.range(0.6, 1.1)); }
    await ctx.yield();
    for (const c of over) for (let i = 1; i < c.pts.length - 1; i++) {
      if ((i & 15) === 1) await ctx.yield();
      if (!fr.chance(0.85)) continue;
      const off = V3(fr.range(-0.5, 0.5), 0, fr.range(-0.5, 0.5)), was = c.was ? c.was.pts[i].clone().add(off) : null;
      if (was) { was.y -= c.was.r * 0.8; off.y = -c.r(i / (c.pts.length - 1)) * 0.8; } else off.y = -c.r(0.5) * 0.8;
      beard(c.pts[i].clone().add(off), fr.chance(0.3) ? fr.range(2, 3.2) : fr.range(4, 6.5), fr.range(0.5, 1.0), beardG, was);
    }
    await ctx.yield();
    for (let i = 4; i < road.pts.length - 2; i++) for (const s of [-1, 1]) if (fr.chance(0.6)) { const p = road.pts[i]; beard(V3(p.x + s * fr.range(1.6, 2.4), p.y - 1.9, p.z + fr.range(-0.5, 0.5)), fr.range(3, 6), fr.range(0.5, 0.9)); }
    await ctx.yield();
    for (const pts of lianas) for (let i = 2; i < pts.length - 2; i += 2) if (fr.chance(0.7)) beard(pts[i].clone().add(V3(0, -0.2, 0)), fr.range(2.5, 6), fr.range(0.4, 0.8), beardG, pts.was && pts.was !== pts ? pts.was[i].clone().add(V3(0, -0.2, 0)) : null, !!pts.hidden);
    await ctx.yield();
    // moss let down from the snag's rim and its flanks
    for (let k = 0; k < 16; k++) {
      const a = nz.range(0, 6.283), low = k > 8 ? nz.range(4, 22) : nz.range(0.6, 2.4), rr = SNAG.r * (1.0 + 0.012 * low) + 0.25, top = V3(SNAG.x + Math.cos(a) * rr, SNAG.top - low, SNAG.z + Math.sin(a) * rr), Lb = nz.range(2.6, 6), w = nz.range(0.5, 1.0), ph = nz(), a0 = nz.range(0, 3.14), pts = [];
      if (!newClear(top.x, top.y - Lb, top.z, 5) || !newClear(top.x, top.y, top.z, 5)) continue;
      for (let j = 0; j <= 4; j++) pts.push(V3(top.x, top.y - Lb * j / 4, top.z));
      for (let pl = 0; pl < 2; pl++) { const aa = a0 + pl * 1.57; beardG.ribbon(pts, (t) => w * (1 - 0.25 * t), V3(Math.cos(aa), 0, Math.sin(aa)), (t) => bGreen.clone().lerp(bPale, t * 0.8), (t) => [t * t * 1.4, ph, 0.9, 1.2]); }
    }
    await ctx.yield();
    add(new THREE.Mesh(beardG.build(), surf(3, [0, 0, 0, 0])));
    await ctx.yield();

    // ---- instanced plants: fern fronds, bromeliad tanks and their pools, moss wands -------------------------------
    const m4 = new THREE.Matrix4(), bX = V3(), bY = V3(), bZ = V3(), tmp = V3();
    const frond = { m: [], t: [] }, ros = { m: [], t: [] }, pools = { m: [], t: [] }, wands = { m: [], t: [] };
    const pushInst = (set, pos, yAxis, zHint, sc, tint, ph) => {
      bY.copy(yAxis).normalize(); bZ.copy(zHint).addScaledVector(bY, -zHint.dot(bY)); if (bZ.lengthSq() < 1e-6) bZ.set(1, 0, 0).addScaledVector(bY, -bY.x); bZ.normalize(); bX.crossVectors(bY, bZ);
      m4.makeBasis(bX, bY, bZ).scale(tmp.set(sc, sc, sc)).setPosition(pos);
      for (let e = 0; e < 16; e++) set.m.push(m4.elements[e]);
      set.t.push(tint.r, tint.g, tint.b, ph);
    };
    const fernCol = () => cGreen.clone().multiplyScalar(fr.range(0.55, 0.85)).lerp(cDeep, fr.range(0.1, 0.45)).multiplyScalar(1.5);
    const dOut = V3(), dDir = V3(), smp = V3(), pp0 = V3();
    // one frond: from pos, starting along dir, arching over and outward; refused if it would come near the flight line
    // (was = where the plant stood before its limb was moved: whether it is drawn is still decided there, so every seed keeps its forest)
    const frondClear = (pos, dir, len, clearM, pa = pathOld) => { for (const k of [0.2, 0.35, 0.5, 0.62, 0.74, 0.86, 1.0]) { smp.copy(pos).addScaledVector(dir, len * 0.62 * k).addScaledVector(dOut, len * 0.42 * k * k); smp.y -= len * 0.2 * k * k * k; if (pa.distanceTo(smp.x, smp.y, smp.z) < clearM + len * 0.1) return false; } return true; };
    const addFrond = (pos, dir, len, clearM, was = null) => {
      dOut.set(dir.x, 0, dir.z); if (dOut.lengthSq() < 1e-4) dOut.set(1, 0, 0); dOut.normalize();
      if (clearM > 0 && !frondClear(was || pos, dir, len, clearM)) return false;
      const col = fernCol(), ph = fr();
      if (was && clearM > 0 && !frondClear(pos, dir, len, clearM)) return false;
      if (!frondClear(pos, dir, len, Math.max(clearM, 5), path)) return false;
      pushInst(frond, pos, dir, dOut, len, col, ph); return true;
    };
    const rosette = (c, n, len, tilt, clearM, up = UP, was = null) => {
      const a0 = fr.range(0, 6.283);
      for (let k = 0; k < n; k++) { const az = a0 + (k / n) * 6.283 + fr.range(-0.2, 0.2), tl = tilt * fr.range(0.7, 1.3); dDir.set(Math.sin(tl) * Math.cos(az), Math.cos(tl), Math.sin(tl) * Math.sin(az)); if (up !== UP) dDir.addScaledVector(up, 0.8).normalize(); addFrond(c, dDir, len * fr.range(0.8, 1.15), clearM, was); }
    };
    const bromTint = () => new THREE.Color(fr.range(0.8, 1.2), fr.range(0.85, 1.15), fr.range(0.8, 1.1));
    const addBrom = (pos, up, sc, was = null) => {
      const tp = was || pos; if (pathOld.distanceTo(tp.x, tp.y, tp.z) < sc * 1.3 + 4.5) return;
      const ph = fr(), hint = tmp.set(fr.range(-1, 1), 0, fr.range(-1, 1)).clone(), tint = bromTint();
      if (was && pathOld.distanceTo(pos.x, pos.y, pos.z) < sc * 1.3 + 4.5) return;
      if (!newClear(pos.x, pos.y, pos.z, sc * 1.3 + 4.5)) return;
      pushInst(ros, pos, up, hint, sc, tint, ph);
      bY.copy(up).normalize(); pushInst(pools, pos.clone().addScaledVector(bY, sc * 0.2), up, V3(1, 0, 0), sc * 0.3, cPearl, ph);
    };
    // tree ferns: the bowl we start in, their neighbours along the limb, far ones in the mist
    rosette(V3(5, -17, 15), 16, 31, 0.62, 10);
    for (const c of [[-20, -11, -24, 26], [19, -15, -54, 28], [-17, -13, -64, 25], [24, -9, -104, 26], [-34, -4, -98, 27], [44, -18, -112, 28], [-36, -47, -124, 26], [66, -20, -130, 24]]) rosette(V3(c[0], c[1], c[2]), 13, c[3], 0.66, 9);
    for (let i = 0; i < Math.round(10 * detail); i++) { const a = fr.range(0, 6.283), d = fr.range(80, 170); const c = V3(Math.sin(a) * d, fr.range(-35, 15), -70 + Math.cos(a) * d); if (c.z < -138 || pathOld.distanceTo(c.x, c.y, c.z) < 45) continue; rosette(c, 10, fr.range(22, 30), 0.7, 0); }
    await ctx.yield();
    rosette(V3(49, -12.8, -157.5), 11, 11, 0.75, 9);
    // epiphytes on the trunks and limbs: small ferns, bromeliads
    for (const t of trunks) {
      const n = Math.round((t.top ? 4 : 9) * detail);
      for (let i = 0; i < n; i++) {
        const y = fr.range(-45, t.top ? -45 : 55), a = fr.range(0, 6.283), c = t.at(y), out = V3(Math.cos(a), 0, Math.sin(a)); c.addScaledVector(out, t.r * 1.02);
        const c0 = t.dx ? t.at0(y).addScaledVector(out, t.r0 * 1.02) : null;
        if (fr.chance(0.45)) addBrom(c.clone().addScaledVector(out, 0.5), out.clone().multiplyScalar(0.5).add(UP), fr.range(1.6, 3.3), c0 ? c0.clone().addScaledVector(out, 0.5) : null);
        else rosette(c, 6, fr.range(4, 8), 0.9, 7, out, c0);
      }
      await ctx.yield();
    }
    for (const c of limbCurves) for (let i = 2; i < c.pts.length - 2; i++) {
      if ((i & 7) === 2) await ctx.yield();
      const p = c.pts[i], rr = c.r(i / c.pts.length);
      if (c === road) {
        if (fr.chance(0.5)) { const s = fr.sign(); addBrom(V3(p.x + s * (rr + fr.range(0.6, 1.6)), p.y + fr.range(-1.2, 0.2), p.z + fr.range(-0.8, 0.8)), V3(s * 0.55, 1, 0), fr.range(1.5, 3.4)); }
        if (fr.chance(0.7)) { const s = fr.sign(); rosette(V3(p.x + s * rr * fr.range(0.75, 1.0), p.y + rr * 0.55, p.z + fr.range(-0.8, 0.8)), 5, fr.range(1.6, 3.2), 0.9, 2.6, V3(s * 0.7, 0.7, 0)); }
      } else if (below.includes(c)) { if (steep(c, i)) continue; if (fr.chance(0.4)) addBrom(V3(p.x + fr.range(-1, 1), p.y + rr * 0.9, p.z + fr.range(-1, 1)), UP, fr.range(1.8, 3.2)); else rosette(V3(p.x, p.y + rr * 0.8, p.z), 7, fr.range(3.5, 6.5), 0.85, 6); }
      else if (fr.chance(0.3)) {
        const g = c.was, q = g ? g.pts[i] : null, gr = g ? lerp(g.r0, g.r1, i / c.pts.length) : 0;
        if (fr.chance(0.5)) addBrom(V3(p.x, p.y + rr * 0.9, p.z), UP, fr.range(1.5, 2.8), q ? V3(q.x, q.y + gr * 0.9, q.z) : null); else rosette(V3(p.x, p.y + rr * 0.8, p.z), 6, fr.range(3, 5.5), 0.95, 7, UP, q ? V3(q.x, q.y + gr * 0.8, q.z) : null);
      }
    }
    await ctx.yield();

    // ---- the ravine: the north rim (the tree's foothold) is a narrow shoulder that falls into the cloud sea to the east and
    // the north; the head wall with the waterfall stands to the west; the floor is lost in mist. Beds of rock step the walls
    // into ledges, buttresses and gullies break their line.
    const rimZ = -216, southZ = -146, rootX = ORIGIN.x, rootZ = ORIGIN.z;
    const terr = (y, s, k) => { const q = y / s, f = q - Math.floor(q); return lerp(y, (Math.floor(q) + sstep(0.5, 1.0, f)) * s, k); };
    const hT = (x, z) => {
      const calm = sstep(6, 40, Math.hypot(x - rootX, z - rootZ));
      const n1 = noise.fbm2(x * 0.012, z * 0.012, 3) * calm, n2 = noise.n2(x * 0.05 + 7, z * 0.05) * calm, east = Math.max(0, x - 5);
      const bz = 1 - Math.abs(noise.n2(z * 0.034, 3.7)), bx = 1 - Math.abs(noise.n2(x * 0.036, 9.1));           // buttresses along the two walls
      const rise = 0.5 * sstep(-25, -95, x) - 0.2 * sstep(-45, 25, x);
      const north = -27 + rise * Math.max(0, rimZ - z) - east * (1.0 + 1.1 * sstep(rimZ, rimZ - 60, z)) + n1 * 9 + n2 * 2.5;
      const south = -98 - east * 0.3 + n1 * 6;
      const inR = sstep(0, 26, z - rimZ + n2 * 4 + bx * bx * 9 * calm) * sstep(0, 16, southZ - z);
      let y = lerp(z < (rimZ + southZ) / 2 ? north : south, -150 + n1 * 8, inR);
      const head = sstep(-84, -146, x + n2 * 6 + bz * bz * 11);
      y = lerp(y, Math.max(y, 46 + n1 * 12 + 0.25 * Math.max(0, -146 - x)), head);
      return lerp(y, terr(y + n2 * 4, 12.5, 0.8) - n2 * 4, calm);
    };
    const hC = (x, z) => { let y = hT(x, z); if (x > -70 && x < 90 && z < -130 && z > -300) { const q = pathOld.nearestXZ(x, z); if (q.dist < 30) y = Math.min(y, q.y - 10 - (30 - q.dist) * 0.15); } return y; };
    const veils = [];
    // the fall: its lip, and how far out its leap has carried it at height y (the kit's fall is thrown at 3 m/s)
    const FALL = { x: -117, y: 47, z: -183, h: 98 }, fallX = (y) => FALL.x + 3 * Math.sqrt(2 * Math.max(0, FALL.y - y) / 9.81);
    // where the air stands clear (rules in space): round the fall and the young tree; and among the great trunks of the chase
    const clearAir = (x, z) => 1 - sstep(48, 95, Math.hypot(x + 100, z + 172)), chaseAir = (x, z) => bellW(z, -178, -92, 22) * bellW(x, -34, 84, 22);
    {
      // a grid drawn finer over the head wall and the north wall than over the land that lies under the cloud
      const G = new Geo(), NX = 120, NZ = 100, x0 = -205, x1 = 135, z0 = -400, z1 = -118, nrm = V3(), p = V3();
      const axis = (n, a, b, w) => { const acc = [0]; for (let i = 0; i < n; i++) acc.push(acc[i] + 1 / w(lerp(a, b, (i + 0.5) / n))); return acc.map((v) => lerp(a, b, v / acc[n])); };
      // the warp is solved by fixed-point passes so that the cells are small where the weight is large
      const warp = (n, a, b, w) => { let xs = axis(n, a, b, () => 1); for (let it = 0; it < 6; it++) { const acc = [0]; for (let i = 0; i < n; i++) acc.push(acc[i] + 1 / w(0.5 * (xs[i] + xs[i + 1]))); xs = acc.map((v) => lerp(a, b, v / acc[n])); } return xs; };
      const xs = warp(NX, x0, x1, (x) => 1 + 2.4 * bellW(x, -165, -62, 30) + 0.8 * bellW(x, -62, 45, 20));
      const zs = warp(NZ, z0, z1, (z) => 1 + 2.2 * bellW(z, -262, -186, 20));
      const hs = new Float32Array((NX + 1) * (NZ + 1));
      for (let j = 0; j <= NZ; j++) { for (let i = 0; i <= NX; i++) hs[j * (NX + 1) + i] = hC(xs[i], zs[j]); await ctx.yield(); }
      const H = (i, j) => hs[clamp(j, 0, NZ) * (NX + 1) + clamp(i, 0, NX)], X = (i) => xs[clamp(i, 0, NX)], Z = (j) => zs[clamp(j, 0, NZ)];
      for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
        if (i === 0) await ctx.yield();                              // a row of the grid at a time
        const h = H(i, j); p.set(xs[i], h, zs[j]);
        nrm.set((H(i - 1, j) - H(i + 1, j)) / (X(i + 1) - X(i - 1)), 1, (H(i, j - 1) - H(i, j + 1)) / (Z(j + 1) - Z(j - 1))).normalize();
        // crevices: a point lower than the land round it lies in shadow
        const ao = clamp(1 + (h - 0.25 * (H(i - 3, j) + H(i + 3, j) + H(i, j - 3) + H(i, j + 3))) * 0.06, 0.42, 1.2);
        G.v(p, nrm, grey((0.85 + 0.3 * noise.n2(p.x * 0.03, p.z * 0.03)) * ao), i / NX, j / NZ, 0, 0, 0.5 + 0.5 * ao, 0);
      }
      await ctx.yield();
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i; G.quad(a, a + 1, a + NX + 2, a + NX + 1); }
      await ctx.yield();
      G.fixWinding();
      await ctx.yield();
      const geo = G.build(true);
      await ctx.yield();
      add(new THREE.Mesh(geo, surf(5, [0, 0, 0, 0.05], { dapple: 0.6 })));
    }
    await ctx.yield();
    // ferns on every ledge that stands out of the cloud, hanging moss under the lips of the ledges, veils of mist against the walls
    const clumps = { m: [], t: [] }, wallBeardG = new Geo();
    {
      const seaY = SU.uFogP.value.y, want = Math.round(1700 * detail), nrm = V3(), pos = V3(); let got = 0, nB = 0;
      const clumpCol = () => cGreen.clone().lerp(cYel, fr.range(0, 0.22)).multiplyScalar(fr.range(0.6, 1.2)).lerp(cDeep, fr.range(0.0, 0.35)).multiplyScalar(1.5);
      for (let i = 0; i < 9000 && got < want; i++) {
        if ((i & 63) === 63) await ctx.yield();
        const wall = i % 3 === 0, x = wall ? fr.range(-158, -84) : fr.range(-90, 48), z = wall ? fr.range(-312, -150) : fr.range(-300, -190);
        const y = hC(x, z); if (y < seaY - 22 || y > 62) continue;
        if (pathOld.distanceTo(x, y + 2.5, z) < 11 || Math.hypot(x - rootX, z - rootZ) < 7) continue;
        nrm.set(hC(x - 1.5, z) - hC(x + 1.5, z), 3, hC(x, z - 1.5) - hC(x, z + 1.5)).normalize();
        if (nrm.y < 0.5) {
          // a riser: hang a beard of moss from it, and now and then let mist stand against it
          if (nB < 230 * detail && nrm.y > 0.18) { beard(pos.set(x + nrm.x * 0.8, y + 1.5, z + nrm.z * 0.8).clone(), fr.range(6, 12), fr.range(0.9, 1.9), wallBeardG); nB++; }
          if (veils.length < 40 && fr.chance(0.25)) veils.push(x + nrm.x * 9, y + fr.range(-4, 8), z + nrm.z * 9, fr.range(20, 38));
          continue;
        }
        nrm.y += 0.9; nrm.normalize();
        const sc = fr.range(3.2, 7.0) * (0.8 + 0.4 * noise.n2(x * 0.05, z * 0.05));
        pushInst(clumps, pos.set(x, y - 0.25, z), nrm, tmp.set(fr.range(-1, 1), 0, fr.range(-1, 1)).clone(), sc, clumpCol(), fr()); got++;
      }
    }
    const fall = makeWaterfall({ rng, top: [-117, 47, -183], height: 98, width: 7, dir: [1, 0, 0], launch: 3, rainbow: 0, mistCount: Math.round(110 * detail), light: sky });
    scene.add(fall.object);
    await ctx.yield();
    // ---- the fall's own rock: a wet dark rib standing out of the head wall from the cloud to the brink, the lip at its head. The
    // water leaps clear of it and is seen against it from every side; ferns, moss and beards up both its flanks. Over the kit's
    // sheets, on the same leap, our own strands of falling water (STRAND). All of it draws from the feeder's stream.
    const strandG = new Geo(), strandW = new THREE.Color(1, 1, 1);
    {
      const G = new Geo(), p = V3(), faceX = (y) => fallX(y) - 0.7 - 2.6 * sstep(FALL.y, FALL.y - 10, y), y0 = FALL.y - 0.4;
      const rib = (t, s2, out) => {
        const as = Math.abs(s2), sg = s2 < 0 ? -1 : 1, fl = Math.max(0, (as - 0.55) / 0.45), bank = 2.4 * Math.min(1, as * 1.5) ** 2; let x, y;
        if (t < 0.12) { const k = t / 0.12; y = y0 + (1 - k) * 3.5 + bank; x = lerp(-158, faceX(y0), k); }
        else { const f = (t - 0.12) / 0.88, on = sstep(0, 0.1, f); y = y0 - f * 106 + bank * (1 - sstep(0, 0.06, f)); x = faceX(y) + (1.3 * noise.n2(y * 0.09 + 11, s2 * 2.1) - 1.5 * (0.5 + 0.5 * Math.sin(y * 0.55 + sg * 1.3))) * on; }
        const wd = 9.5 + 4.5 * sstep(0.12, 1, t);
        return out.set(x - Math.pow(fl, 1.3) * 38 - 1.6 * as * as, y, FALL.z + sg * (Math.min(as, 0.55) / 0.55 * wd + fl * 8) + 1.2 * noise.n2(y * 0.07, s2 * 1.7 + 5));
      };
      G.grid(40, 22, rib, (t, s2) => grey(0.5 + 0.2 * noise.n2(t * 9, s2 * 4)), () => [0, 0, 0.85, 0]);
      await ctx.yield();
      add(new THREE.Mesh(G.build(), surf(5, [0, 0, 0, 0.05], { dapple: 0.5 })));
      await ctx.yield();
      frUse(nz);
      const up = V3(), hint = V3();
      for (let i = 0; i < 70; i++) {
        const sg = nz.sign(), as = nz.range(0.4, 0.98), t = i < 12 ? nz.range(0.02, 0.12) : nz.range(0.12, 0.7), kind = nz(); rib(t, sg * as, p);
        up.set(0.55, 0.75, sg * 0.4); hint.set(nz.range(-1, 1), 0, nz.range(-1, 1));
        if (kind < 0.72) pushInst(clumps, p.clone().add(V3(0.2, -0.2, 0)), up, hint.clone(), nz.range(3.2, 6.2), cGreen.clone().lerp(cYel, nz.range(0, 0.22)).multiplyScalar(nz.range(0.6, 1.15)).lerp(cDeep, nz.range(0, 0.35)).multiplyScalar(1.5), nz());
        else if (kind < 0.85) rosette(p.clone().add(V3(0.3, 0, 0)), 6, nz.range(4.5, 8.5), 0.95, 0, V3(0.85, 0.3, sg * 0.35));
        else beard(p.clone().add(V3(0.7, 0.4, 0)), nz.range(5, 11), nz.range(0.9, 1.7), wallBeardG);
      }
      frUse(null);
      await ctx.yield();
      // six strands across the lip, each widening as it falls
      for (let k = 0; k < 6; k++) {
        const zc = lerp(-2.9, 2.9, k / 5) + nz.range(-0.3, 0.3), w0 = nz.range(0.9, 1.5), xo = 0.35 + 0.22 * (k % 3), sd = nz();
        strandG.grid(26, 2, (t, s2, out) => { const y = FALL.y - 0.25 - t * (FALL.h - 1.5); return out.set(fallX(y) + xo, y, FALL.z + zc + s2 * w0 * (1 + 1.1 * t)); }, () => strandW, () => [sd, 0, 1, 4.45]);
      }
    }
    await ctx.yield();
    // ferns and tanks on the rim round the root, and on the slope behind it
    for (let i = 0; i < Math.round(70 * detail); i++) {
      const a = fr.range(0, 6.283), d = 9 + 55 * Math.sqrt(fr()), x = rootX + Math.cos(a) * d, z = rootZ - Math.abs(Math.sin(a)) * d * 0.8 + 3;
      const y = hT(x, z); if (z > rimZ + 4 || pathOld.distanceTo(x, y + 3, z) < 9) continue;
      if (fr.chance(0.2)) addBrom(V3(x, y + 0.4, z), UP, fr.range(1.8, 3.2)); else rosette(V3(x, y, z), 5, fr.range(5, 9.5), 0.95, 8);
    }
    // the bear's tree down the slope: a low crown full of tanks
    for (let i = 0; i < 14; i++) { const a = fr.range(0, 6.283), d = fr.range(3, 12); addBrom(V3(bearAt.x + Math.cos(a) * d, bearAt.y - 1.5 - d * 0.25 + fr.range(-1, 1), bearAt.z + Math.sin(a) * d), V3(Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4), fr.range(2.2, 3.6)); }
    await ctx.yield();

    // ---- the bear's crag: a stack of rock standing on the shoulder north of the tree, its top a tilted garden of tanks and
    // ferns where the bear feeds, side-on to us as we come round the tree. Everything here draws from the feeder's stream (nz)
    // or from none: the forest's draws are untouched.
    const BEAR_S = 1.25, BEAR = V3(8, 0, -271.5), bearF = V3(-0.547, 0, 0.838), CRAG = { x: 5, z: -272, a: 22, b: 18 };
    const cragTopY = (x, z) => -10.4 + clamp(0.14 * (-268 - z), -2.4, 2.8) + 0.9 * noise.n2(x * 0.11 + 5, z * 0.11);
    BEAR.y = cragTopY(BEAR.x, BEAR.z) - 0.3;
    {
      const G = new Geo(), NR = 30, NS = 60, p = V3(), q2 = V3(), nrm = V3(), n = (NR + 1) * (NS + 1), hs = new Float32Array(n), xs = new Float32Array(n), zs = new Float32Array(n), es = new Float32Array(n);
      for (let i = 0; i <= NR; i++) {
        const t = i / NR, q = t < 0.45 ? t / 0.45 * 0.9 : 0.9 + (t - 0.45) / 0.55 * 1.25;        // the rings crowd the rim and the cliff
        for (let j = 0; j <= NS; j++) {
          const a = (j % NS) / NS * 6.2832, ca = Math.cos(a), sa = Math.sin(a), k = i * (NS + 1) + j;
          const wob = 1 + 0.17 * noise.n2(ca * 1.7 + 3, sa * 1.7) + 0.07 * noise.n2(ca * 5, sa * 5 + 9);
          const x = CRAG.x + ca * CRAG.a * q * wob, z = CRAG.z + sa * CRAG.b * q * wob, e = Math.max(0, q - 1) * 14;
          let y = cragTopY(x, z) - 14 * Math.max(0, q - 0.82) ** 2;
          if (e > 0) { y -= e * 5 * (0.8 + 0.4 * noise.n2(x * 0.1, z * 0.1 + 7)); y = lerp(y, terr(y, 7, 0.55), sstep(0, 3, e)); }
          const g = hC(x, z) - 2; y = i === NR ? g : Math.max(y, g);
          xs[k] = x; zs[k] = z; hs[k] = y; es[k] = e;
        }
        if ((i & 3) === 3) await ctx.yield();
      }
      const K = (i, j) => clamp(i, 0, NR) * (NS + 1) + ((j % NS) + NS) % NS;
      for (let i = 0; i <= NR; i++) {
        for (let j = 0; j <= NS; j++) {
          const k = i * (NS + 1) + j, a = K(i + 1, j), b = K(i - 1, j), c = K(i, j + 1), d = K(i, j - 1);
          q2.set(xs[a] - xs[b], hs[a] - hs[b], zs[a] - zs[b]); p.set(xs[c] - xs[d], hs[c] - hs[d], zs[c] - zs[d]);
          nrm.crossVectors(p, q2); if (nrm.lengthSq() < 1e-9) nrm.set(0, 1, 0); nrm.normalize(); if (nrm.y < 0) nrm.multiplyScalar(-1);
          const ao = es[k] > 0 ? 0.9 + 0.2 * noise.n2(xs[k] * 0.2, hs[k] * 0.2) : 1;
          G.v(p.set(xs[k], hs[k], zs[k]), nrm, grey((1.05 + 0.3 * noise.n2(xs[k] * 0.03, zs[k] * 0.03)) * ao), j / NS, i / NR, 0, 0, 0.5 + 0.5 * ao, 0);
        }
        if ((i & 7) === 7) await ctx.yield();
      }
      for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j; G.quad(a, a + 1, a + NS + 2, a + NS + 1); }
      add(new THREE.Mesh(G.build(), surf(5, [0, 0, 0, 0.05], { dapple: 0.3 })));
      await ctx.yield();
      // the garden on its top: tank bromeliads (the biggest at the bear's muzzle), ferns and tufts; low things only on our side of the bear
      frUse(nz);
      const onTop = (x, z, dy) => V3(x, cragTopY(x, z) + dy, z), sideB = V3(-bearF.z, 0, bearF.x);
      { const mz = BEAR.clone().addScaledVector(bearF, 13.4 * BEAR_S); addBrom(onTop(mz.x, mz.z, 0.3), UP, 4.6); }
      for (let i = 0; i < 30; i++) {
        const a = nz.range(0, 6.283), d = Math.sqrt(nz()), x = CRAG.x + Math.cos(a) * CRAG.a * 0.86 * d, z = CRAG.z + Math.sin(a) * CRAG.b * 0.86 * d, kind = nz(), hx2 = nz.range(-0.2, 0.2), hz2 = nz.range(-0.2, 0.2); let sc = nz.range(2.2, 3.8);
        const ox = x - BEAR.x, oz = z - BEAR.z, fw = ox * bearF.x + oz * bearF.z, sd = ox * sideB.x + oz * sideB.z, toUs = ox * 0.6 + oz * 0.8;
        if (Math.abs(sd) < 5.4 * BEAR_S && fw > -11 * BEAR_S && fw < 16 * BEAR_S) continue;                    // not under the bear, nor in its plant
        const low = toUs > 2;
        if (low) sc = Math.min(sc, 2.6);
        if (kind < 0.5 || (low && kind < 0.8)) addBrom(onTop(x, z, 0.3), V3(hx2, 1, hz2), sc);
        else if (kind < 0.8) rosette(onTop(x, z, 0), 6, nz.range(4.5, 7.5), 0.95, 0);
        else pushInst(clumps, onTop(x, z, -0.25), UP, V3(hx2, 0, hz2 + 0.01), nz.range(3.2, 5.5), cGreen.clone().lerp(cYel, nz.range(0, 0.2)).multiplyScalar(nz.range(0.7, 1.15) * 1.5), nz());
      }
      await ctx.yield();
      // the stack's faces, all the way round and down to the cloud: hanging ferns, cushions of moss and tanks with red hearts on
      // every bed of the rock, beards let down from its rim
      const outV = V3(), cp = V3(), faceAt = (i0, f, j, off) => { const a = i0 * (NS + 1) + j, b = a + NS + 1, an = j / NS * 6.2832; outV.set(Math.cos(an), 0, Math.sin(an)); return cp.set(lerp(xs[a], xs[b], f) + outV.x * off, lerp(hs[a], hs[b], f), lerp(zs[a], zs[b], f) + outV.z * off); };
      for (let n2 = 0; n2 < 170; n2++) {
        const i0 = 14 + Math.floor(nz() * 7), j = Math.floor(nz() * NS), f = nz(), kind = nz(), sc = nz.range(2.4, 4.4), ph = nz(), sp = nz.range(-1, 1); faceAt(i0, f, j, 0.3);
        if (cp.y < BEAR.y - 40) continue;
        if (kind < 0.66) pushInst(clumps, cp.clone(), V3(outV.x * 0.8, 0.7, outV.z * 0.8), V3(-outV.z, 0, outV.x), sc, cGreen.clone().lerp(cYel, 0.1 + 0.1 * sp).multiplyScalar((0.9 + 0.25 * sp) * 1.5).lerp(cDeep, 0.15), ph);
        else if (kind < 0.78) rosette(cp.clone(), 5, 2.6 + sc * 0.7, 0.95, 0, V3(outV.x * 0.9, 0.35, outV.z * 0.9));
        else if (kind < 0.9) addBrom(cp.clone().addScaledVector(outV, 0.5), V3(outV.x * 0.55, 1, outV.z * 0.55), 1.3 + sc * 0.3);
        else beard(cp.clone().addScaledVector(outV, 0.6), 2 + sc * 1.4, 0.3 + sc * 0.22, wallBeardG);
        if ((n2 & 31) === 31) await ctx.yield();
      }
      for (let j = 0; j < NS; j += 2) { faceAt(14, 0.75 + 0.2 * nz(), j, 0.5); beard(cp.clone(), nz.range(3, 7.5), nz.range(0.6, 1.2), wallBeardG); }
      // three lines of drips running down the face on our side of it (south-east), off the garden's lip
      for (const an of [0.62, 1.02, 1.38]) {
        const j = Math.round((an + nz.range(-0.08, 0.08)) / 6.2832 * NS), pts = [], sd = nz();
        for (let k = 0; k <= 10; k++) { const r = 14.6 + k * 0.52; faceAt(Math.floor(r), r - Math.floor(r), j, 0.28); pts.push(cp.clone()); }
        strandG.ribbon(pts, () => 0.4, outV.clone(), () => strandW, () => [sd, 1, 1, 2.6]);
      }
      frUse(null);
    }
    await ctx.yield();
    add(new THREE.Mesh(wallBeardG.build(), surf(3, [0, 0, 0, 0])));
    await ctx.yield();
    add(new THREE.Mesh(strandG.build(), new THREE.ShaderMaterial({ uniforms: { ...SU }, vertexShader: STRAND_VS, fragmentShader: STRAND_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide })), 3);
    await ctx.yield();

    // wax palms standing out of the cloud sea to the east (sharp after rain, ghosts in mist)
    const palmTrunks = [];
    for (let i = 0; i < 11; i++) { const x = fr.range(300, 470), z = fr.range(-380, -40), top = fr.range(30, 85); palmTrunks.push([x, top, z]); rosette(V3(x, top, z), 11, fr.range(30, 40), 0.85, 0); }

    // unit geometries for the instanced plants
    const white = new THREE.Color(1, 1, 1);
    const frondGeo = (() => {
      const G = new Geo(), N = 7, p = V3(), n = V3(); let y = 0, z = 0; const rows = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N, be = Math.pow(t, 1.3) * 1.9;
        if (i > 0) { const bm = Math.pow((i - 0.5) / N, 1.3) * 1.9; y += Math.cos(bm) / N; z += Math.sin(bm) / N; }
        const ny = Math.sin(be), nz = -Math.cos(be), row = [];
        for (const sx of [-1, 0, 1]) { p.set(sx * 0.17, y + ny * (sx ? 0 : 0.014), z + nz * (sx ? 0 : 0.014)); n.set(sx * 0.35, ny, nz).normalize(); row.push(G.v(p, n, white, sx, t, t * t * 0.05, 0, 1, 0.8)); }
        rows.push(row);
      }
      for (let i = 0; i < N; i++) for (let k = 0; k < 2; k++) G.quad(rows[i][k], rows[i][k + 1], rows[i + 1][k + 1], rows[i + 1][k]);
      return G.build();
    })();
    const rosGeo = (() => {
      const G = new Geo(), heart = cRed.clone().multiplyScalar(0.8).add(cGreen.clone().multiplyScalar(0.14)), leaf = cGreen.clone().multiplyScalar(0.95), tip = cDeep.clone().multiplyScalar(1.7);
      for (let k = 0; k < 16; k++) {
        const inner = k % 2, az = (k / 16) * 6.283 + (inner ? 0.2 : 0), len = inner ? 0.72 : 1.0, el0 = inner ? 1.15 : 0.8, pts = [];
        for (let j = 0; j <= 3; j++) { const t = j / 3, rr = len * t * (0.5 + 0.5 * Math.cos(el0 - t * 0.6)) + 0.06, hh = len * (Math.sin(el0) * t - 0.45 * t * t); pts.push(V3(Math.cos(az) * rr, hh, Math.sin(az) * rr)); }
        G.ribbon(pts, (t) => 0.15 * (1 - t * t) * (0.5 + 0.5 * Math.min(1, t * 4)) + 0.012, UP, (t) => (t < 0.35 ? heart.clone().lerp(leaf, t / 0.35) : leaf.clone().lerp(tip, (t - 0.35) * 0.9)), (t) => [t * t * 0.035, 0, 0.55 + 0.45 * t, 0.5]);
      }
      return G.build();
    })();
    const poolGeo = (() => {
      const G = new Geo(), c = G.v(V3(0, 0, 0), UP, white, 0, 0, 0, 0, 1, 0), ring = [];
      for (let k = 0; k <= 10; k++) { const a = (k / 10) * 6.283; ring.push(G.v(V3(Math.cos(a), 0, Math.sin(a)), UP, white, Math.cos(a), Math.sin(a), 0, 0, 1, 0)); }
      for (let k = 0; k < 10; k++) G.tri(c, ring[k], ring[k + 1]);
      return G.build();
    })();
    const wandGeo = (() => {
      const G = new Geo(), stalk = new THREE.Color('#5a2c14'), cap = new THREE.Color('#b8862c');
      for (const f of [V3(0, 0, 1), V3(1, 0, 0)]) {
        G.ribbon([V3(0, 0, 0), V3(0.03, 0.84, 0.02)], (t) => 0.03 - 0.012 * t, f, () => stalk, (t) => [t * 0.12, 0, 1, 0.6]);
        G.ribbon([V3(0.03, 0.82, 0.02), V3(0.04, 0.91, 0.03), V3(0.07, 1.0, 0.05)], (t) => 0.06 * Math.sin(t * Math.PI) + 0.004, f, () => cap, () => [0.12, 0, 1, 0.9]);
      }
      return G.build();
    })();
    // moss wands: a field of sporophyte stalks on the top of the limb we fly along
    for (let i = 0, n = Math.round(1500 * detail); i < n; i++) {
      const k = 3 + Math.floor(fr() * (road.pts.length * 0.62)), p = road.pts[k], q = road.pts[k + 1], f = fr(), a = fr.gauss() * 0.55, rr = road.r(k / road.pts.length) * 1.03;
      tmp.set(Math.sin(a), Math.cos(a), 0);
      pushInst(wands, V3(lerp(p.x, q.x, f) + tmp.x * rr, lerp(p.y, q.y, f) + tmp.y * rr, lerp(p.z, q.z, f)), tmp, V3(0, 0, 1), fr.range(0.4, 0.9), white.clone().multiplyScalar(fr.range(0.7, 1.3)), fr());
      if ((i & 1023) === 1023) await ctx.yield();
    }
    const inst = (geo, mat, set, order = 0) => {
      const n = set.t.length / 4; if (!n) return null;
      const im = new THREE.InstancedMesh(geo, mat, n); im.instanceMatrix.array.set(set.m); im.instanceMatrix.needsUpdate = true;
      geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(set.t), 4));
      return add(im, order);
    };
    const clumpGeo = (() => {
      const G = new Geo();
      for (let k = 0; k < 5; k++) {
        const az = k * 1.2566 + fr.range(-0.3, 0.3), Lf = fr.range(0.85, 1.15), lift = fr.range(0.5, 0.9), pts = [];
        for (let j = 0; j <= 2; j++) { const t = j / 2, r = 0.06 + Lf * t; pts.push(V3(Math.cos(az) * r, lift * Math.sin(t * 2.3) - 0.3 * t * t, Math.sin(az) * r)); }
        if (k < 4) G.ribbon(pts, () => 0.29, UP, (t) => white.clone().multiplyScalar(0.55 + 0.75 * t), (t) => [t * t * 0.045, k * 0.31, 1, 0.8]);
      }
      return G.build();
    })();
    await ctx.yield();
    // the snag's garden: ferns in its hollow and on its rim, two tanks, moss let down its sunless side
    {
      const fc = () => cGreen.clone().multiplyScalar(nz.range(0.55, 0.85)).lerp(cDeep, nz.range(0.1, 0.45)).multiplyScalar(1.5), d = V3(), o = V3();
      const tuft = (c, n, len, tilt) => { const a0 = nz.range(0, 6.283); for (let k = 0; k < n; k++) { const az = a0 + (k / n) * 6.283 + nz.range(-0.2, 0.2), tl = tilt * nz.range(0.75, 1.25); d.set(Math.sin(tl) * Math.cos(az), Math.cos(tl), Math.sin(tl) * Math.sin(az)); o.set(d.x, 0, d.z).normalize(); dOut.copy(o); const Lf = len * nz.range(0.8, 1.15); if (frondClear(c, d, Lf, 6, path)) pushInst(frond, c, d.clone(), o.clone(), Lf, fc(), nz()); } };
      tuft(V3(SNAG.x - 1.6, SNAG.top - 0.5, SNAG.z + 1.4), 9, 6.2, 0.85);
      tuft(V3(SNAG.x + 2.9, SNAG.top - 0.3, SNAG.z + 2.6), 6, 4.2, 1.0);
      tuft(V3(SNAG.x - 3.4, SNAG.top - 5.5, SNAG.z + 3.3), 6, 5.0, 1.15);
      tuft(V3(SNAG.x + 3.9, SNAG.top - 9.5, SNAG.z + 2.8), 6, 5.5, 1.2);
      for (const q of [[2.6, 0.2, -2.6, 2.3], [-3.6, -1.0, -1.2, 1.9], [3.9, -4.4, 1.9, 2.1]]) {
        const pos = V3(SNAG.x + q[0], SNAG.top + q[1], SNAG.z + q[2]), ph = nz(), tint = new THREE.Color(nz.range(0.8, 1.2), nz.range(0.85, 1.15), nz.range(0.8, 1.1)), up = V3(q[0] * 0.08, 1, q[2] * 0.08);
        pushInst(ros, pos, up, V3(nz.range(-1, 1), 0, nz.range(-1, 1)), q[3], tint, ph); pushInst(pools, pos.clone().addScaledVector(up.normalize(), q[3] * 0.2), up, V3(1, 0, 0), q[3] * 0.3, cPearl, ph);
      }
    }
    await ctx.yield();
    inst(frondGeo, surf(2, [24, 0, 0, 0.12]), frond);
    await ctx.yield();
    inst(rosGeo, surf(0, [3, 0.18, 0, 0.3]), ros);
    await ctx.yield();
    inst(poolGeo, surf(4, [0, 0, 0, 1]), pools);
    const wandMesh = inst(wandGeo, surf(0, [0, 0, 0, 0.1]), wands);
    const wandA = road.pts[3].clone(), wandD = road.pts[3 + Math.floor(road.pts.length * 0.62)].clone().sub(wandA), wandL2 = Math.max(wandD.lengthSq(), 1e-6);
    await ctx.yield();

    // ---- far layers: whole trees dissolving into the mist. Each is an emergent of the cloud forest: a trunk that forks into
    // four to six rising boughs, every bough carrying overlapping tiers of foliage (ragged pads with sky-holes, cut out of
    // shallow domes), a fringe of hanging moss and a tuft or two of epiphytes. Each tree has its own height, reach and tone,
    // and the tone steps paler and bluer with distance.
    {
      const treeG = new Geo(), fringeG = new Geo(), tierG = new Geo(), tiers = { m: [], t: [] }, eul = new THREE.Euler();
      {
        const c = tierG.v(V3(0, 0.4, 0), UP, white, 0, 0, 0, 0, 1, 0.6), r1 = [], r2 = [], rim = new THREE.Color(0.72, 0.72, 0.72);
        for (let k = 0; k <= 8; k++) {
          const a = (k / 8) * 6.2832, cx = Math.cos(a), sz = Math.sin(a);
          r1.push(tierG.v(V3(cx * 0.58, 0.3, sz * 0.58), V3(cx * 0.35, 1, sz * 0.35).normalize(), white, cx * 0.58, sz * 0.58, 0.012, 0, 0.95, 0.6));
          r2.push(tierG.v(V3(cx, 0, sz), V3(cx * 0.8, 0.6, sz * 0.8).normalize(), rim, cx, sz, 0.03, 0, 0.8, 0.6));
        }
        for (let k = 0; k < 8; k++) { tierG.tri(c, r1[k], r1[k + 1]); tierG.quad(r1[k], r2[k], r2[k + 1], r1[k + 1]); }
      }
      const hazeCol = cMist.clone().lerp(new THREE.Color(LK.zenith), 0.4).multiplyScalar(0.55);
      const tier = (c, s, tone, flat = 1) => {
        if (pathOld.distanceTo(c.x, c.y, c.z) < s + 14) return;
        m4.makeRotationFromEuler(eul.set(fr.range(-0.22, 0.22), fr.range(0, 6.283), fr.range(-0.22, 0.22))).scale(tmp.set(s * fr.range(0.9, 1.2), s * fr.range(0.7, 1.25) * flat, s * fr.range(0.9, 1.2))).setPosition(c.x, c.y, c.z);
        const k = fr.range(0.78, 1.22), ph = fr();
        if (!newClear(c.x, c.y, c.z, s + 12)) return;
        for (let e = 0; e < 16; e++) tiers.m.push(m4.elements[e]);
        tiers.t.push(tone.r * k, tone.g * k, tone.b * k, ph);
      };
      const woodCol = () => cDeep.clone().multiplyScalar(fr.range(1.0, 1.6)).lerp(new THREE.Color(0.08, 0.075, 0.065), fr.range(0.4, 0.8));
      const tuftCol = (tone) => tone.clone().lerp(cGreen, 0.5).multiplyScalar(1.3);
      const side = V3(), q1 = V3(), q2 = V3(), nH = V3();
      // a curtain of moss under a bough: one strip, its strands and ragged hem cut out by the beard shader
      const fringe = (pts, r, Lb, tone) => {
        const ph = fr(), top = bGreen.clone().lerp(tone, 0.5), bot = bPale.clone().lerp(tone, 0.35); let pa = -1, pb = -1, len = 0;
        for (let i = 1; i < pts.length; i++) {
          const p = pts[i]; if (i > 1) len += p.distanceTo(pts[i - 1]);
          nH.set(-(p.z - pts[i - 1].z), 0, p.x - pts[i - 1].x); if (nH.lengthSq() < 1e-6) nH.set(1, 0, 0); nH.normalize();
          const L1 = Lb * (0.6 + 0.4 * Math.sin(Math.PI * i / (pts.length - 1)));
          const ia = fringeG.v(q1.set(p.x, p.y - r * 0.6, p.z), nH, top, len * 0.34, 0, 0, ph, 0.9, 1.2), ib = fringeG.v(q2.set(p.x, p.y - r * 0.6 - L1, p.z), nH, bot, len * 0.34, 1, 1.2, ph, 0.9, 1.2);
          if (i > 1) fringeG.quad(pa, ia, ib, pb);
          pa = ia; pb = ib;
        }
      };
      // boughs from the point `from` on a trunk of radius r: R = reach, nB of them, each with its tiers, fringe and twigs
      const crownOn = (from, r, R, nB, col, tone, top = true) => {
        const a0 = fr.range(0, 6.283);
        for (let k = 0; k < nB; k++) {
          const a = a0 + (k / nB) * 6.283 + fr.range(-0.45, 0.45), reach = R * fr.range(0.5, 1.12), up = R * fr.range(0.3, 0.78), dx = Math.cos(a), dz = Math.sin(a), bend = fr.range(-0.2, 0.2);
          side.set(-dz, 0, dx);
          const P = (f, h) => V3(from.x + dx * reach * f + side.x * reach * bend * f * f, from.y + up * h, from.z + dz * reach * f + side.z * reach * bend * f * f);
          const pts = spaced([from.clone(), P(0.38, 0.58), P(0.72, 0.92), P(1, 1)], 4), rb = r * fr.range(0.4, 0.55);
          treeG.tube(pts, 4, (i, t) => rb * (1 - 0.72 * t), () => col, null);
          const s1 = R * fr.range(0.3, 0.42), e = pts[4];
          tier(V3(e.x, e.y + s1 * 0.05, e.z), s1, tone);
          for (const sg of [-1, 1]) {
            if (fr.chance(0.2)) continue;
            const s2 = R * fr.range(0.2, 0.32), c2 = pts[sg > 0 ? 3 : 2].clone().addScaledVector(side, sg * R * fr.range(0.2, 0.36)); c2.y += R * fr.range(-0.1, 0.16);
            treeG.tube([pts[sg > 0 ? 3 : 2], c2], 3, (i, t) => rb * (0.4 - 0.22 * t), () => col, null);
            tier(c2, s2, tone);
          }
          if (fr.chance(0.75)) fringe(pts, rb, fr.range(4, 9) * (R / 22), tone);
          if (fr.chance(0.4)) { const p = pts[fr.int(1, 3)]; pushInst(clumps, V3(p.x, p.y + rb * 0.5, p.z), UP, V3(dx, 0, dz), fr.range(3.5, 6.5), tuftCol(tone), fr()); }
        }
        if (top) { const s0 = R * fr.range(0.3, 0.42); tier(V3(from.x, from.y + R * fr.range(0.6, 0.8), from.z), s0, tone); tier(V3(from.x + fr.range(-4, 4), from.y + R * fr.range(0.82, 1.0), from.z + fr.range(-4, 4)), s0 * 0.62, tone); }
      };
      for (let i = 0, n = Math.round(66 * detail); i < n; i++) {
        await ctx.yield();                                             // a tree at a time
        const a = fr.range(0, 6.283), d = fr.range(95, 400), x = Math.sin(a) * d, z = -90 + Math.cos(a) * d;
        const r = fr.range(3.2, 6.5), sd = fr.range(0, 30), lx = fr.range(-0.04, 0.04), lz = fr.range(-0.04, 0.04), hgt = fr(), R = fr.range(18, 30), nB = fr.int(4, 6), hue = fr.range(-1, 1), shade = fr.range(1.4, 2.3), mixG = fr.range(0.08, 0.38), hz = fr.range(0, 0.12), low = fr(), col = woodCol();
        if ((z < -138 && z > -232 && x > -100) || pathOld.nearestXZ(x, z).dist < 62) continue;
        // a tree that would now stand over the way out to the feeder is grown all the same (its draws are spent) and then taken back out
        const mark = path.nearestXZ(x, z).dist < 46 || Math.hypot(x - 5, z + 272) < 48 ? [treeG.mark(), fringeG.mark(), tiers.m.length, tiers.t.length, clumps.m.length, clumps.t.length] : null;
        const base = z < rimZ ? hT(x, z) : -140, top = Math.max(base + 40, lerp(-10, 38, hgt) + (d - 95) * 0.09);
        const hzK = (d < 190 ? 0 : d < 290 ? 0.22 : 0.42) + hz; col.lerp(hazeCol, hzK * 0.9);
        const tone = cDeep.clone().multiplyScalar(shade).lerp(cGreen, mixG).lerp(hue > 0 ? cYel : cMist, Math.abs(hue) * 0.1).lerp(hazeCol, hzK);
        const at = (y) => V3(x + lx * y + 1.2 * Math.sin(y * 0.03 + sd), y, z + lz * y + 1.2 * Math.cos(y * 0.027 + sd));
        const pts = []; for (let k = 0; k <= 9; k++) pts.push(at(lerp(base - 4, top, k / 9)));
        treeG.tube(pts, 7, (k, t) => r * (1.2 - 0.55 * t), () => col, (k, ang) => 1 + 0.1 * Math.sin(ang * 4 + sd));
        crownOn(at(top), r * 0.75, R, nB, col, tone);
        // a lower storey on the taller ones
        if (top > 22 && low < 0.6) crownOn(at(top - R * lerp(1.0, 1.7, low / 0.6)), r * 0.7, R * 0.55, 3, col, tone, false);
        if (mark) { treeG.cut(mark[0]); fringeG.cut(mark[1]); tiers.m.length = mark[2]; tiers.t.length = mark[3]; clumps.m.length = mark[4]; clumps.t.length = mark[5]; }
      }
      for (const q of palmTrunks) { const col = new THREE.Color(0.2, 0.2, 0.19); treeG.tube([V3(q[0], q[1] - 260, q[2]), V3(q[0] + 1.5, q[1] - 120, q[2]), V3(q[0], q[1], q[2])], 6, () => 2.6, () => col, null); }
      await ctx.yield();
      // the near trunks branch too, high above the flight: their tiers are the roof over the limb garden and the first stop
      { let k = 0; for (const t of trunks.slice(0, 15)) { const tone = cDeep.clone().multiplyScalar(fr.range(1.5, 2.2)).lerp(cGreen, fr.range(0.2, 0.45)); crownOn(t.at(fr.range(56, 72)), t.r * 0.8, fr.range(20, 27), fr.int(4, 5), woodCol(), tone); await ctx.yield(); } }
      // the bear's crown: ragged tiers round the mossy head of its short trunk
      { const tone = cDeep.clone().multiplyScalar(1.9).lerp(cGreen, 0.4);
        for (let k = 0; k < 9; k++) { const a = (k / 9) * 6.283 + fr.range(-0.2, 0.2), d = fr.range(7, 12); tier(V3(bearAt.x + Math.cos(a) * d, bearAt.y - fr.range(4.5, 9), bearAt.z + Math.sin(a) * d), fr.range(5, 7.5), tone, 0.8); }
        for (let k = 0; k < 10; k++) { const a = fr.range(0, 6.283), d = fr.range(5, 11); pushInst(clumps, V3(bearAt.x + Math.cos(a) * d, bearAt.y - 1.8 - d * 0.32, bearAt.z + Math.sin(a) * d), V3(Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5), V3(1, 0, 0), fr.range(3, 5), tuftCol(tone), fr()); } }
      await ctx.yield();
      add(new THREE.Mesh(treeG.build(), surf(0, [0.12, 0.3, 0, 0.02], { dapple: 0 })));
      await ctx.yield();
      add(new THREE.Mesh(fringeG.build(), surf(3, [0, 0, 0, 0])));
      await ctx.yield();
      inst(tierG.build(), surf(8, [0, 0, 0, 0.05], { dapple: 0.35 }), tiers);
      await ctx.yield();
      inst(clumpGeo, surf(2, [17, 0, 0, 0.12]), clumps);
    }
    await ctx.yield();

    if (clear) {
      // the snow cone of Antisana, small on the eastern horizon
      const cone = new THREE.Mesh(new THREE.ConeGeometry(520, 300, 24, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(LK.horizon).lerp(new THREE.Color('#ffffff'), 0.45).multiplyScalar(0.93), fog: false }));
      cone.position.set(2300, 95, -520); add(cone, -0.5);
    }

    // ---- stop one: the passionflower (or, on some visits, a crimson tube-fuchsia) on its vine, framed by the vine's own
    // leaves and tendrils two to four metres from the eye; the fuchsia bush beside it; orchid sprays along the limb -------
    let plantG = new Geo(), petalG = new Geo(), leafG = new Geo(), dropG = new Geo(); const mT = new THREE.Matrix4();
    const pink = C('#ee5c9a'), pinkPale = C('#f9cfdd'), rose = C('#cf2f78'), crimson = C('#c2182e'), leafC = cGreen.clone().multiplyScalar(0.7).lerp(cDeep, 0.35).multiplyScalar(1.4), stemC = cGreen.clone().multiplyScalar(0.5);
    // under a low warm sun the pink would turn red: lean it toward blue so that the passionflower stays pink at every hour
    if (hour === 'afternoon' || hour === 'dawn') for (const c of [pink, pinkPale, rose]) { const k = hour === 'afternoon' ? 1 : 0.5; c.r *= 1 - 0.1 * k; c.b *= 1 + 0.42 * k; }
    const fAxis = V3(0.16, 0.26, -0.95).normalize();
    // a glass drop of radius r at c (in the frame set on dropG), showing the colour it sits on
    const glass = (c, r, tint) => dropG.loft([-1, -0.72, -0.25, 0.3, 0.75, 1].map((k) => ({ z: c.z + k * r, x: c.x, y: c.y, rx: r * Math.sqrt(Math.max(0.004, 1 - k * k)), ry: r * Math.sqrt(Math.max(0.004, 1 - k * k)), c: tint })), 7, [0, 0, 1, 0]);
    // a leaf on a short stalk: three toothed lobes (the passion vine) or one long blade (the fuchsia), each folded along its midrib
    const leafOn = (at, out, s, lobes) => {
      const side = V3().crossVectors(out, UP).normalize(), base = at.clone().addScaledVector(out, 0.5 * s), ph = fr(), droop = fr.range(0.12, 0.38), tint = leafC.clone().multiplyScalar(fr.range(0.8, 1.2));
      plantG.tube([at, base], 4, () => 0.035 * s, () => stemC, null);
      for (const k of lobes) {
        const d = out.clone().addScaledVector(side, k * 0.85).normalize(), Ll = (k ? 0.95 : lobes.length > 1 ? 1.4 : 1.9) * s, wd = (k ? 0.36 : 0.44) * s, sd = V3().crossVectors(d, UP).normalize(), fold = fr.range(0.12, 0.34), wav = fr.range(0, 6);
        leafG.grid(6, 2, (t, sx, o) => {
          const w = wd * Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + 0.94 * t)), 0.75) * (1 - 0.3 * t * t) + 0.012;
          o.copy(base).addScaledVector(d, Ll * t).addScaledVector(sd, sx * w); o.y += Ll * (0.14 * Math.sin(t * 2.4) - droop * t * t) + Math.abs(sx) * w * fold + 0.03 * s * Math.sin(t * 9 + wav) * sx; return o;
        }, (t, sx) => tint.clone().multiplyScalar(0.78 + 0.4 * t), (t) => [0.1 + 0.3 * t, ph, 1, 0.8]);
      }
      if (fr.chance(0.3)) { dropG.setXf(null); glass(base.clone().addScaledVector(out, 0.5 * s).add(V3(0, 0.06 * s + 0.04, 0)), fr.range(0.035, 0.055), tint.clone().multiplyScalar(1.3)); }
    };
    const leaf3 = (at, out, s) => leafOn(at, out, s, [0]);                          // the fuchsia bush: plain blades
    const stopLobes = fuchsiaFirst ? [0] : [-1, 0, 1];
    const vine = (ctrl, r, leaves, lobes = [0]) => {
      const pts = spaced(ctrl, 22);
      plantG.tube(pts, 6, (i, t) => r * (1 - 0.3 * t), () => stemC, (i, a, len) => 1 + 0.15 * Math.sin(len * 3 + a * 2), (i, t) => [0.12 * t, 0.3, 1, 0.2]);
      if (leaves) for (let i = leaves; i < pts.length; i += 2) { const a = i * 2.4 + pts[0].x; leafOn(pts[i], V3(Math.cos(a), 0.15, Math.sin(a)).normalize(), fr.range(0.85, 1.3), lobes); }
      return pts;
    };
    // a coiled tendril: a spring that hangs from h and nods in the wind
    const tendril = (h, sg) => {
      const pts = []; for (let i = 0; i <= 64; i++) { const t = i / 64, a = t * 6.283 * 4.5, rr = 0.3 * (1 - 0.45 * t); pts.push(V3(h.x + sg * (0.4 * t + rr * Math.cos(a)), h.y - 1.3 * t + rr * Math.sin(a), h.z + 0.5 * t + 0.1 * Math.sin(a))); }
      plantG.tube(pts, 5, (i, t) => 0.03 - 0.016 * t, () => stemC, null, (i, t) => [0.3 * t, 0.7, 1, 0.2]);
    };
    const ped = FLOWER.clone().addScaledVector(fAxis, 1.78);
    if (!fuchsiaFirst) {
      bZ.copy(fAxis).negate(); bX.crossVectors(UP, bZ).normalize(); bY.crossVectors(bZ, bX);
      const fm = new THREE.Matrix4().makeBasis(bX, bY, bZ).setPosition(FLOWER);
      plantG.setXf(fm); petalG.setXf(fm); dropG.setXf(fm);
      // the long tube back to the vine: ribbed, green flushed with pink, a swollen base in three bracts
      const tubeC = cGreen.clone().lerp(pink, 0.45).multiplyScalar(0.8), ribC = cGreen.clone().lerp(pink, 0.2).multiplyScalar(0.55), ribs = (a) => (Math.cos(a * 5) > 0.3 ? tubeC : ribC);
      plantG.loft([{ z: -1.78, rx: 0.05, ry: 0.05, c: stemC }, { z: -1.64, rx: 0.2, ry: 0.2, c: stemC }, { z: -1.46, rx: 0.14, ry: 0.14, cf: ribs }, { z: -1.0, rx: 0.115, ry: 0.115, cf: ribs }, { z: -0.5, rx: 0.12, ry: 0.12, cf: ribs }, { z: -0.12, rx: 0.15, ry: 0.15, c: pink }, { z: 0.02, rx: 0.19, ry: 0.19, c: pink }], 15, [0.12, 0.3, 1, 0.5]);
      for (let k = 0; k < 3; k++) { const az = k * 2.094 + 0.5; leafG.grid(4, 2, (t, s, o) => { const w = 0.2 * Math.sin(Math.PI * (0.12 + 0.86 * t)) + 0.01, r = 0.16 + 0.3 * Math.sin(t * 1.8); return o.set(Math.cos(az) * r - Math.sin(az) * s * w, Math.sin(az) * r + Math.cos(az) * s * w, -1.72 + 0.62 * t); }, () => leafC, () => [0.1, 0.4, 1, 0.7]); }
      // ten petals in two whorls: five reflexed sepals behind, five cupped petals in front, each keeled, its edges raised, its tip curled back
      const petals = [];
      for (let k = 0; k < 10; k++) {
        const inner = k % 2, az = (k / 10) * 6.283 + fr.range(-0.06, 0.06), Lp = (inner ? 1.1 : 1.3) * fr.range(0.95, 1.05), wmax = inner ? 0.275 : 0.31, tw = fr.range(-0.1, 0.1), cup = (inner ? 0.85 : 0.55) * fr.range(0.8, 1.2);
        const z1 = inner ? 0.52 : 0.12, z2 = inner ? -0.56 : -0.5, z0 = inner ? 0.05 : 0.0, curl = fr.range(0.25, 0.42);
        const P = (t, s, o) => {
          const w = wmax * (0.2 + 0.8 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + 0.86 * t)), 0.7)) * (1 - Math.pow(t, 5)) + 0.004;
          const r = 0.14 + Lp * t, lat = s * w, a = az + tw * t, ca = Math.cos(a), sa = Math.sin(a);
          return o.set(ca * r - sa * lat, sa * r + ca * lat, z0 + z1 * t + z2 * t * t - curl * Math.pow(t, 4) + cup * (1 - 0.5 * t) * w * (s * s - 0.35) - 0.02 * (1 - Math.abs(s)));
        };
        petals.push(P);
        petalG.grid(10, 4, P, (t, s) => {
          const c = pinkPale.clone().lerp(pink, sstep(0.04, 0.5, t)).lerp(rose, sstep(0.55, 1.0, t) * 0.7 + 0.25 * s * s * t);
          return c.multiplyScalar(inner ? 1.0 : (0.55 + 0.38 * sstep(0.15, 0.62, t)));                    // the sepals lie in the petals' shadow
        }, () => [0.1, 0.3 + k * 0.07, 1, 0.9]);
      }
      await ctx.yield();
      // the corona: a ring of separate filaments, white at the root, banded violet
      const vio = cViolet.clone().multiplyScalar(1.25), vioD = cViolet.clone().multiplyScalar(0.5), wht = C('#efe6f4');
      for (let k = 0; k < 32; k++) {
        const az = (k / 32) * 6.283, ca = Math.cos(az), sa = Math.sin(az), Lc = fr.range(0.22, 0.3), lift = fr.range(0.1, 0.17);
        petalG.tube([V3(ca * 0.16, sa * 0.16, 0.03), V3(ca * (0.16 + Lc * 0.55), sa * (0.16 + Lc * 0.55), 0.03 + lift * 0.8), V3(ca * (0.16 + Lc), sa * (0.16 + Lc), 0.03 + lift)], 3, (i, t) => 0.017 - 0.008 * t, (i, t) => (i === 0 ? wht : i === 1 ? vioD : vio), null, () => [0.1, 0.5, 1, 0.6]);
      }
      petalG.loft([{ z: -0.03, rx: 0.15, ry: 0.15, c: vioD }, { z: 0.07, rx: 0.185, ry: 0.185, c: cViolet.clone().multiplyScalar(1.1) }], 14, [0.12, 0.3, 1, 0.6]);
      // the column: five anthers on arms, three knobbed styles
      plantG.loft([{ z: -0.1, rx: 0.035, ry: 0.035, c: pinkPale }, { z: 0.5, rx: 0.035, ry: 0.035, c: pinkPale }, { z: 0.56, rx: 0.065, ry: 0.065, c: cGreen }, { z: 0.66, rx: 0.03, ry: 0.03, c: cGreen }], 7, [0.12, 0.3, 1, 0.3]);
      for (let k = 0; k < 5; k++) {
        const az = (k / 5) * 6.283 + 0.3, ca = Math.cos(az), sa = Math.sin(az);
        plantG.tube([V3(ca * 0.03, sa * 0.03, 0.5), V3(ca * 0.12, sa * 0.12, 0.55), V3(ca * 0.19, sa * 0.19, 0.52)], 4, () => 0.012, () => pinkPale, null, () => [0.12, 0.3, 1, 0.3]);
        petalG.tube([V3(ca * 0.19 - sa * 0.1, sa * 0.19 + ca * 0.1, 0.5), V3(ca * 0.2, sa * 0.2, 0.5), V3(ca * 0.19 + sa * 0.1, sa * 0.19 - ca * 0.1, 0.5)], 5, (i, t) => 0.012 + 0.03 * Math.sin(Math.PI * t), () => cYel, null, () => [0.12, 0.3, 1, 0.5], true);
      }
      for (let k = 0; k < 3; k++) { const az = (k / 3) * 6.283; plantG.loft([{ z: 0.64, x: Math.cos(az) * 0.03, y: Math.sin(az) * 0.03, rx: 0.015, ry: 0.015, c: cGreen }, { z: 0.74, x: Math.cos(az) * 0.1, y: Math.sin(az) * 0.1, rx: 0.02, ry: 0.02, c: cGreen }, { z: 0.78, x: Math.cos(az) * 0.12, y: Math.sin(az) * 0.12, rx: 0.045, ry: 0.045, c: cYel.clone().multiplyScalar(0.7) }, { z: 0.82, x: Math.cos(az) * 0.12, y: Math.sin(az) * 0.12, rx: 0.01, ry: 0.01, c: cGreen }], 5, [0.12, 0.3, 1, 0.3]); }
      // glass drops lying on the petals
      const dp = V3();
      for (const q of [[1, 0.42, 0.3, 0.06], [3, 0.6, -0.4, 0.045], [5, 0.33, 0.1, 0.05], [7, 0.55, 0.45, 0.04], [9, 0.7, -0.2, 0.05], [0, 0.5, 0.2, 0.05], [4, 0.62, -0.3, 0.04], [6, 0.4, 0.5, 0.045], [2, 0.75, 0.0, 0.04]]) {
        petals[q[0]](q[1], q[2], dp); dp.z += q[3] * 0.7; glass(dp, q[3], pinkPale.clone().lerp(pink, 0.35).multiplyScalar(1.15));
      }
      plantG.setXf(null); petalG.setXf(null); dropG.setXf(null);
    }
    await ctx.yield();
    // a tube-fuchsia flower: frame origin where the tube ends and the sepals part, z down its axis; S = size
    const fuchsia = (mouth, axis, S, bud) => {
      bZ.copy(axis).normalize(); bX.crossVectors(UP, bZ); if (bX.lengthSq() < 1e-4) bX.set(1, 0, 0); bX.normalize(); bY.crossVectors(bZ, bX);
      mT.makeBasis(bX, bY, bZ).scale(tmp.set(S, S, S)).setPosition(mouth);
      plantG.setXf(mT); petalG.setXf(mT);
      const ph = fr(), w = [0.06, ph, 1, 0.85], pale = crimson.clone().lerp(pinkPale, 0.45), deep = crimson.clone().multiplyScalar(0.6), purple = cViolet.clone().multiplyScalar(0.85), a0 = fr.range(0, 1.5);
      plantG.loft([{ z: -1.36, rx: 0.02, ry: 0.02, c: stemC }, { z: -1.28, rx: 0.07, ry: 0.07, c: cGreen }, { z: -1.14, rx: 0.075, ry: 0.075, c: cGreen }, { z: -1.05, rx: 0.045, ry: 0.045, c: cGreen.clone().lerp(crimson, 0.5) }], 8, w);
      petalG.loft([{ z: -1.05, rx: 0.045, ry: 0.045, c: pale }, { z: -0.9, rx: 0.062, ry: 0.062, c: crimson }, { z: -0.45, rx: 0.08, ry: 0.08, c: crimson }, { z: -0.12, rx: 0.105, ry: 0.105, c: crimson }, { z: 0.0, rx: 0.13, ry: 0.13, c: deep }], 10, w);
      if (bud) { petalG.loft([{ z: 0, rx: 0.13, ry: 0.13, c: crimson }, { z: 0.1, rx: 0.146, ry: 0.146, c: crimson }, { z: 0.2, rx: 0.15, ry: 0.15, c: crimson }, { z: 0.32, rx: 0.132, ry: 0.132, c: crimson.clone().lerp(pale, 0.5) }, { z: 0.42, rx: 0.1, ry: 0.1, c: pale }, { z: 0.52, rx: 0.058, ry: 0.058, c: pale }, { z: 0.6, rx: 0.012, ry: 0.012, c: pale }], 18, w); plantG.setXf(null); petalG.setXf(null); return; }
      // four flared sepals, channelled, their tips curled back
      for (let q = 0; q < 4; q++) {
        const az = a0 + q * 1.5708, ca = Math.cos(az), sa = Math.sin(az), Ls = 0.62 * fr.range(0.9, 1.1), fl = fr.range(0.62, 0.86);
        petalG.grid(6, 2, (t, s, o) => { const ww = 0.125 * Math.pow(Math.sin(Math.PI * (0.16 + 0.84 * t)), 0.8) * (1 - t * t * t * t) + 0.005, r = 0.11 + Ls * (fl * t + 0.12 * t * t), z = Ls * (0.6 * t - 0.62 * t * t) + 0.3 * ww * s * s; return o.set(ca * r - sa * s * ww, sa * r + ca * s * ww, z); },
          (t, s) => pale.clone().lerp(crimson, sstep(0.0, 0.35, t)).lerp(deep, sstep(0.75, 1, t) * 0.5), () => w);
      }
      // the skirt: four purple petals wrapped round the stamens
      for (let q = 0; q < 4; q++) {
        const az = a0 + 0.785 + q * 1.5708;
        petalG.grid(3, 3, (t, s, o) => { const a = az + s * 0.95, r = 0.1 + 0.085 * t + 0.02 * s * s * t; return o.set(Math.cos(a) * r, Math.sin(a) * r, 0.01 + 0.3 * t - 0.03 * s * s * t); }, (t, s) => purple.clone().multiplyScalar(0.7 + 0.5 * t), () => w);
      }
      // eight stamens and the longer style, each with its anther
      for (let q = 0; q < 9; q++) {
        const st = q === 8, az = q * 0.785 + 0.3, r0 = st ? 0 : 0.035, r1 = st ? 0.01 : 0.075, Lz = st ? 0.92 : fr.range(0.6, 0.74), ca = Math.cos(az), sa = Math.sin(az);
        petalG.tube([V3(ca * r0, sa * r0, 0.02), V3(ca * (r0 + r1) * 0.5, sa * (r0 + r1) * 0.5, Lz * 0.55), V3(ca * r1, sa * r1, Lz)], 3, () => 0.011, () => pale, null, () => w);
        petalG.tube([V3(ca * r1, sa * r1, Lz - 0.01), V3(ca * r1, sa * r1, Lz + 0.035), V3(ca * r1, sa * r1, Lz + 0.08)], 4, (i, t) => 0.008 + (st ? 0.03 : 0.022) * Math.sin(Math.PI * t), () => (st ? pale : C('#f4ead0')), null, () => w, true);
      }
      plantG.setXf(null); petalG.setXf(null);
    };
    const hang = V3(7.7, 10.4, -81.7);
    if (fuchsiaFirst) {
      // a hanging cluster: the open flower we feed at, four more round it, two buds
      const a0 = V3(-0.05, -0.84, 0.54).normalize(), m0 = FLOWER.clone().addScaledVector(a0, -0.51).sub(FLOWER);
      for (const q of [[m0.x, m0.y, m0.z, a0, 1.7, 0], [-1.6, 1.0, -1.1, V3(-0.3, -0.9, 0.3), 1.3, 0], [1.55, 1.3, -1.3, V3(0.34, -0.88, 0.32), 1.35, 0], [0.2, 2.4, -2.3, V3(0.0, -0.98, 0.2), 1.2, 0],
        [-0.9, 2.9, -1.9, V3(-0.2, -0.95, -0.1), 1.0, 1], [1.1, 3.2, -1.8, V3(0.25, -0.95, 0.0), 0.9, 1], [2.6, 2.4, -2.5, V3(0.4, -0.88, 0.1), 1.1, 0]]) {
        const ax = q[3].clone().normalize(), mouth = V3(FLOWER.x + q[0], FLOWER.y + q[1] - 0.35, FLOWER.z + q[2]), ov = mouth.clone().addScaledVector(ax, -1.36 * q[4]);
        fuchsia(mouth, ax, q[4], q[5]);
        const mid = ov.clone().lerp(hang, 0.5); mid.y += 0.5; mid.x += (ov.x - hang.x) * 0.2;
        plantG.tube(spaced([hang, mid, ov], 6), 4, (i, t) => 0.04 - 0.018 * t, () => stemC.clone().lerp(crimson, 0.35), null, (i, t) => [0.06 * t, 0.3, 1, 0.2]);
        if (!q[5]) glass(mouth.clone().addScaledVector(ax, 1.02 * q[4]), 0.045, crimson.clone().lerp(pinkPale, 0.6));
        await ctx.yield();
      }
    }
    vine([V3(7.2, 15.4, -77), V3(7.9, 12, -77.6), V3(8.5, 9.6, -79.6), ...(fuchsiaFirst ? [hang] : [ped.clone().add(V3(0.25, 0.9, -0.3)), ped])], 0.11, 3, stopLobes);
    await ctx.yield();
    vine([V3(4.6, 16.2, -77.2), V3(4.2, 12, -78.6), V3(4.5, 8.5, -80.2), V3(4.9, 5.5, -80.9), V3(5.3, 2.8, -80.6), V3(5.0, 0.5, -80.0)], 0.1, 4, stopLobes);
    await ctx.yield();
    vine([V3(10.6, 16.0, -77.3), V3(10.9, 13.4, -78.9), V3(10.8, 11.4, -80.0), V3(10.6, 10.2, -80.5)], 0.085, 5, stopLobes);
    tendril(V3(5.3, 6.9, -80.5), 1); tendril(V3(4.8, 4.0, -80.6), 1); tendril(V3(10.7, 10.3, -80.4), -1); tendril(V3(8.3, 9.9, -79.5), 1);
    glass(V3(5.3, 6.9, -80.5).add(V3(0.7, -1.36, 0.5)), 0.05, leafC.clone().multiplyScalar(1.4));
    await ctx.yield();
    // the tube-fuchsia: pendant crimson flowers on drooping stems, ten metres to the right
    const FU = V3(9.0, 3.3, -54.5);
    {
      const crim = C('#c2182e'), purple = cViolet.clone().multiplyScalar(0.9), down = new THREE.Matrix4();
      for (let s = 0; s < 3; s++) {
        const end = V3(FU.x + (s - 1) * 1.3, FU.y + 1.2 + (s % 2) * 0.8, FU.z + (s - 1) * 0.5);
        const pts = vine([V3(FU.x + 0.6 + s * 0.5, 15.7, FU.z + 1.4), V3(FU.x + 0.8 + (s - 1) * 0.8, FU.y + 6.5, FU.z + 0.8), end.clone().add(V3(0, 2.2, 0.6)), end], 0.07, false);
        for (let k = 0; k < 5; k++) {
          const p = pts[pts.length - 1 - k * 2].clone().add(V3(fr.range(-0.35, 0.35), -0.1, fr.range(-0.35, 0.35))), ph = fr();
          down.makeRotationX(Math.PI / 2 + fr.range(-0.25, 0.25)).setPosition(p); plantG.setXf(down); petalG.setXf(down);
          const w = [0.1, ph, 1, 0.8];
          plantG.loft([{ z: -0.2, rx: 0.012, ry: 0.012, c: stemC }, { z: 0, rx: 0.02, ry: 0.02, c: stemC }, { z: 0.07, rx: 0.05, ry: 0.05, c: cGreen }], 5, w);
          petalG.loft([{ z: 0.07, rx: 0.05, ry: 0.05, c: crim }, { z: 0.14, rx: 0.035, ry: 0.035, c: crim }, { z: 0.38, rx: 0.05, ry: 0.05, c: crim }, { z: 0.43, rx: 0.065, ry: 0.065, c: crim }], 6, w);
          for (let q = 0; q < 4; q++) { const az = q * 1.571 + 0.4; petalG.ribbon([V3(Math.cos(az) * 0.05, Math.sin(az) * 0.05, 0.42), V3(Math.cos(az) * 0.16, Math.sin(az) * 0.16, 0.5), V3(Math.cos(az) * 0.24, Math.sin(az) * 0.24, 0.48)], (t) => 0.055 * (1 - t) + 0.008, V3(0, 0, 1), () => crim, () => w); }
          petalG.loft([{ z: 0.42, rx: 0.05, ry: 0.05, c: purple }, { z: 0.57, rx: 0.045, ry: 0.045, c: purple }, { z: 0.6, rx: 0.01, ry: 0.01, c: purple }], 6, w);
          petalG.ribbon([V3(0, 0, 0.58), V3(0.01, 0, 0.76)], () => 0.014, V3(1, 0, 0), () => pinkPale, () => w);
        }
        plantG.setXf(null); petalG.setXf(null);
        for (let k = 1; k < 4; k++) leaf3(pts[6 + k * 3], V3(Math.cos(k * 2.1 + s), 0.1, Math.sin(k * 2.1 + s)).normalize(), 0.8);
      }
    }
    // orchid sprays arching off the limb's flanks: cream stars
    {
      const cream = C('#f2ecd2'), throat = cYel.clone().multiplyScalar(0.9);
      for (let i = 0, n = Math.round(18 * detail); i < n; i++) {
        const k = 4 + Math.floor(fr() * 30), p = road.pts[k], s = fr.sign(), rr = road.r(0.3), base = V3(p.x + s * rr * 0.92, p.y + rr * 0.4, p.z + fr.range(-1, 1));
        const dir = V3(s * fr.range(0.6, 1), fr.range(0.5, 1.0), fr.range(-0.4, 0.4)).normalize(), Ls = fr.range(2.2, 3.6), ph = fr();
        const pts = []; for (let j = 0; j <= 6; j++) { const t = j / 6; pts.push(base.clone().addScaledVector(dir, Ls * t).add(V3(s * 0.5 * t * t, -Ls * 0.42 * t * t, 0))); }
        if (pathOld.distanceTo(pts[6].x, pts[6].y, pts[6].z) < 2.4) continue;
        plantG.tube(pts, 4, (ii, t) => 0.035 - 0.015 * t, () => stemC, null, (ii, t) => [0.25 * t * t, ph, 1, 0.3]);
        for (let j = 2; j <= 6; j++) for (const sd of [-1, 1]) {
          const c = pts[j].clone().add(V3(sd * 0.16, 0.12, sd * 0.1)), fx = V3(), t = j / 6;
          for (let q = 0; q < 5; q++) { const az = q * 1.2566 + j; fx.set(Math.cos(az) * 0.26, Math.sin(az) * 0.26 * 0.9, Math.sin(az * 2) * 0.05); petalG.ribbon([c, c.clone().add(fx)], (tt) => 0.085 * (1 - 0.6 * tt), V3(0, 0, 1), (tt) => (tt < 0.5 ? throat : cream), () => [0.25 * t * t, ph, 1, 0.8]); }
        }
      }
    }
    for (const q of [[7.3, 21.5, -77.15, 7.2, 15.4, -77, 0.11], [4.7, 20.7, -77.4, 4.6, 16.2, -77.2, 0.1], [10.5, 21.6, -77.1, 10.6, 16.0, -77.3, 0.085]]) {
      const pts = vine([V3(q[0], q[1], q[2]), V3((q[0] + q[3]) / 2 - 0.25, (q[1] + q[4]) / 2, (q[2] + q[5]) / 2 + 0.2), V3(q[3], q[4], q[5])], q[6] * 1.25, false);
      for (const i of [5, 11, 17]) { const a = i * 2.4 + q[0]; leafOn(pts[i], V3(Math.cos(a), 0.15, Math.sin(a)).normalize(), fr.range(0.85, 1.3), stopLobes); }
    }
    // stop one's garden is drawn until the chase has left it behind (u 0.15); the fuchsia below from the far side of the tree on
    const plantSets = [[], []];
    const plantOut = (set) => {
      set.push(add(new THREE.Mesh(plantG.build(), surf(0, [2.5, 0.16, 0, 0.25], { dapple: 0.7 }))), add(new THREE.Mesh(petalG.build(), surf(6, [2.5, 0, 0, 0.3], { dapple: 0.5 }))),
        add(new THREE.Mesh(leafG.build(), surf(9, [0, 0, 0, 0.35], { dapple: 0.6 }))), add(new THREE.Mesh(dropG.build(), surf(10, [0, 0, 0, 1], { dapple: 0 }))));
    };
    plantOut(plantSets[0]);
    await ctx.yield();
    // a crimson tube-fuchsia let down out of the old tree's western skirt: three flowers on their vines, hung over the way
    // out to the ravine, dark and then lit against the mist of the valley
    {
      plantG = new Geo(); petalG = new Geo(); leafG = new Geo(); dropG = new Geo();
      frUse(nz);
      const top = V3(-30.2, 17.5, -184.0);
      for (const q of [[-30.9, 8.2, -182.6, 1.4], [-29.3, 9.8, -184.8, 1.2], [-31.8, 10.8, -181.0, 1.1]]) {
        const e = V3(q[0], q[1], q[2]), S = q[3], ax = V3(nz.range(-0.08, 0.08), -1, nz.range(-0.08, 0.08)).normalize(), neck = e.clone().addScaledVector(ax, -1.36 * S);
        vine([top.clone().add(V3(nz.range(-0.4, 0.4), 0, nz.range(-0.4, 0.4))), top.clone().lerp(neck, 0.45).add(V3(nz.range(-0.6, 0.6), 0.4, nz.range(-0.6, 0.6))), neck.clone().add(V3(0.1, 2.2, 0)), neck], 0.11, 7);
        fuchsia(e, ax, S, false);
      }
      frUse(null);
      dropG.tri(dropG.v(V3(0, -900, 0), UP, white), dropG.v(V3(0.01, -900, 0), UP, white), dropG.v(V3(0, -900, 0.01), UP, white));      // never an empty buffer, whatever the dew does
      plantOut(plantSets[1]);
    }
    await ctx.yield();

    // ---- air: streaming mist, sun shafts, gnats in the shafts, drifting spores, glasswings, drizzle -------------
    const sprite = (vs, fs, uni, o = {}) => new THREE.ShaderMaterial({ uniforms: { ...SU, ...uni }, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...o });
    const ar = rng.fork('air'), tan = V3(), pp = V3();
    {
      const aA = [], aB = [], n = Math.round((hour === 'dawn' ? 190 : clear ? 100 : 150) * detail);
      for (let i = 0; i < n; i++) {
        const u = ar(), a = ar.range(0, 6.283), d = ar.range(16, 70); path.pointAt(u, pp);
        const low = hour === 'dawn' && ar.chance(0.6) && (u < 0.6 || u > 0.93);     // dawn: the ravine brim-full of cloud, but not across the view up the nave
        const x = pp.x + Math.cos(a) * d, z = pp.z + Math.sin(a) * d, thin = 1 - 0.6 * clearAir(x, z) - 0.35 * chaseAir(x, z);
        aA.push(x, low ? ar.range(-34, -12) : pp.y + (u < 0.34 ? ar.range(-36, -11) : ar.range(-34, 7)), z, ar.range(14, 34) * (low ? 1.5 : 1));
        aB.push(ar(), 1 / ar.range(28, 52), ar.range(0, 10), ar.range(0.06, 0.135) * (low ? 1.5 : thin));
      }
      // streamers pouring up out of the ravine under the old tree's crown, on its valley side (world coordinates)
      for (let i = 0, nW = Math.round(14 * detail); i < nW; i++) {
        aA.push(ar.range(4, 42), ar.range(-44, -22), ar.range(-232, -184), ar.range(5, 10));
        aB.push(ar(), -1 / ar.range(16, 26), ar.range(0, 10), ar.range(0.16, 0.28));
      }
      // the fall's spray: plumes rising off its foot and off the ledges it strikes, drifting out over the basin
      for (let i = 0, nW = Math.round(12 * detail); i < nW; i++) {
        const y = ar.range(-46, -6);
        aA.push(fallX(y) + ar.range(1, 15), y, FALL.z + ar.range(-11, 11), ar.range(4, 8));
        aB.push(ar(), -1 / ar.range(14, 22), ar.range(0, 10), ar.range(0.13, 0.22));
      }
      // bright mist rising behind the bear's crag, on the side away from our way round the tree: the bear stands dark against it
      if (bearMode !== 'none') for (let i = 0; i < 16; i++) {
        aA.push(BEAR.x - 7 + ar.range(-27, 23), BEAR.y + ar.range(-17, 3), BEAR.z - 25 + ar.range(-12, 9), ar.range(11, 17));
        aB.push(2 + ar(), -1 / ar.range(40, 64), ar.range(0, 10), ar.range(0.26, 0.38));
      }
      // the crown's shade on the mist beneath it: the shafts and the lit streamers stand out against it
      for (let i = 0, nD = Math.round(24 * detail); i < nD; i++) {
        const u = ar.range(0.62, 0.72), a = ar.range(0, 6.283), d = ar.range(30, 72); pathOld.pointAt(u, pp);      // (the old dive: still under the crown)
        aA.push(pp.x + Math.cos(a) * d, ar.range(-44, -16), pp.z + Math.sin(a) * d, -ar.range(16, 27));
        aB.push(ar(), -1 / ar.range(50, 75), ar.range(0, 10), ar.range(0.3, 0.45));
      }
      // veils standing against the ravine walls, between their ledges
      for (let i = 0; i < veils.length; i += 4) { aA.push(veils[i], veils[i + 1], veils[i + 2], veils[i + 3]); aB.push(ar(), 1 / ar.range(34, 60), ar.range(0, 10), ar.range(0.1, 0.17) * (1 - 0.75 * clearAir(veils[i], veils[i + 2]))); }      // (none across the fall and the wall beside it)
      add(new THREE.Mesh(quadGeo({ aA: [aA, 4], aB: [aB, 4] }), sprite(PUFF_VS, PUFF_FS, { uMode: { value: 0 }, uRes, uEntry, uVeil })), 2);
    }
    const shaftTops = [];
    if (LK.shafts > 0) {
      const aA = [], aB = [];
      for (let i = 0; i < 18; i++) {
        const u = ar.range(0.0, 0.34), a = ar.range(0, 6.283), d = ar.range(9, 38), len = ar.range(60, 105); path.pointAt(u, pp);
        const top = V3(pp.x + Math.cos(a) * d, pp.y, pp.z + Math.sin(a) * d).addScaledVector(sunW, len * 0.55);
        shaftTops.push({ top, len });
        let cross = 1; for (let k = 0; k <= 6; k++) { const f = k / 6; if (inCone(top.x - sunW.x * len * f, top.y - sunW.y * len * f, top.z - sunW.z * len * f)) cross = 0.12; }
        aA.push(top.x, top.y, top.z, len); aB.push(ar.range(1.8, 4.6), ar(), ar.range(0.045, 0.1) * LK.shafts * (clear ? 0.7 : 1) * cross, 0);
      }
      // shafts standing where the canopy opens, each set out in world coordinates by its foot (where it ends in the gap); it climbs
      // from there toward the sun. A low sun would bring a shaft out of the head wall: it is cut short at the cliff's face
      const gainK = LK.shafts * (clear ? 0.8 : 1);
      const shaftAt = (fx, fy, fz, len, wd, gain) => {
        let l = len; if (sunW.x < -0.2) l = Math.min(l, Math.max(18, (fx + 138) / -sunW.x));
        const top = V3(fx, fy, fz).addScaledVector(sunW, l);
        let cross = 1; for (let k = 0; k <= 6; k++) { const f = k / 6; if (inCone(top.x - sunW.x * l * f, top.y - sunW.y * l * f, top.z - sunW.z * l * f)) cross = 0.12; }
        shaftTops.push({ top, len: l }); aA.push(top.x, top.y, top.z, l); aB.push(wd, ar(), gain * gainK * cross, 0);
      };
      // in the spray of the fall's basin, before the dark rock
      for (let i = 0; i < 8; i++) shaftAt(ar.range(-111, -88), ar.range(-30, -4), FALL.z + ar.range(-22, 22), ar.range(46, 66), ar.range(2.0, 3.6), ar.range(0.17, 0.26));
      // beyond the young tree on its broken trunk
      for (let i = 0; i < 4; i++) shaftAt(SNAG.x - ar.range(8, 24), ar.range(-18, -3), SNAG.z + ar.range(-18, 18), ar.range(44, 60), ar.range(1.8, 3.0), ar.range(0.15, 0.22));
      // over the ravine between the young tree and the old one
      for (let i = 0; i < 6; i++) shaftAt(ar.range(-54, -20), ar.range(-24, -6), ar.range(-197, -158), ar.range(46, 68), ar.range(1.6, 2.8), ar.range(0.15, 0.24));
      // in the gaps between the great trunks of the chase: midway between every two neighbours, where it is not on our line
      { let nG = 0;
        for (let i = 0; i < 15 && nG < 12; i++) for (let j = i + 1; j < 15 && nG < 12; j++) {
          const a = trunks[i], b = trunks[j], dd = Math.hypot(a.x - b.x, a.z - b.z); if (dd < 22 || dd > 62) continue;
          const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, fy = ar.range(-22, -7), dp = path.distanceTo(mx, fy + 12, mz);
          if (mz > -62 || dp < 9 || dp > 58) continue;
          shaftAt(mx, fy, mz, ar.range(60, 88), ar.range(2.0, 3.8), ar.range(0.1, 0.17)); nG++;
        } }
      // either side of the bear's crag and beyond it
      if (bearMode !== 'none') for (let i = 0; i < 4; i++) shaftAt(BEAR.x + (i & 1 ? 1 : -1) * ar.range(17, 30), BEAR.y + ar.range(-15, -4), BEAR.z + ar.range(-26, 2), ar.range(44, 58), ar.range(1.8, 3.0), ar.range(0.14, 0.2));
      add(new THREE.Mesh(quadGeo({ aA: [aA, 4], aB: [aB, 4] }), sprite(SHAFT_VS, SHAFT_FS, {}, { blending: THREE.AdditiveBlending })), 4);
    }
    {
      const aA = [], aB = [], nG = Math.round(620 * detail), nS = Math.round(360 * detail);
      for (let i = 0; i < nG && shaftTops.length; i++) {
        const s = shaftTops[i % shaftTops.length], k = ar.range(0.4, 0.75);
        aA.push(s.top.x - sunW.x * s.len * k + ar.range(-1.6, 1.6), s.top.y - sunW.y * s.len * k + ar.range(-2.5, 2.5), s.top.z - sunW.z * s.len * k + ar.range(-1.6, 1.6), ar.range(0.4, 1.1));
        aB.push(ar(), 0.035, 0.95, ar.range(1.0, 2.4));
      }
      for (let i = 0; i < nS; i++) {
        const u = ar(), a = ar.range(0, 6.283), d = ar.range(3, 16); path.pointAt(u, pp);
        aA.push(pp.x + Math.cos(a) * d, pp.y + ar.range(-6, 6), pp.z + Math.sin(a) * d, ar.range(1.5, 3.5));
        aB.push(ar(), ar.range(0.02, 0.04), 0.6, ar.range(0.08, 0.2));
      }
      for (let i = 0, nM = Math.round(300 * detail); i < nM; i++) {
        const u = ar(), a = ar.range(0, 6.283), d = ar.range(4, 15); path.pointAt(u, pp);
        aA.push(pp.x + Math.cos(a) * d, pp.y + ar.range(-5, 5), pp.z + Math.sin(a) * d, ar.range(3, 6.5));
        aB.push(ar(), ar.range(0.05, 0.1), 0.45, ar.range(0.22, 0.5));
      }
      // drops adrift in the air between the fall and the young tree: they turn slowly and flash where the light finds them
      for (let i = 0, nD = Math.round(180 * detail); i < nD; i++) {
        aA.push(ar.range(-110, -68), ar.range(-12, 11), ar.range(-197, -148), ar.range(1.2, 3.2));
        aB.push(ar(), ar.range(0.03, 0.055), 0.85, ar.range(0.1, 0.3));
      }
      add(new THREE.Mesh(quadGeo({ aA: [aA, 4], aB: [aB, 4] }), sprite(PUFF_VS, PUFF_FS, { uMode: { value: 1 }, uRes, uEntry, uVeil })), 3);
    }
    // The route's whole line as a table: nL + 1 points at even steps of pointAt's measure, about WING_STEP apart (gap is the widest gap between
    // neighbours, measured as the table is made). What must be held against the whole line is held against it: the glasswings' law below.
    // The bells' check reads this table too.
    const WING_AIR = 2.0, WING_STEP = 0.1, WING_TURNS = 12;
    const nL = Math.ceil(path.length / WING_STEP), lx = new Float64Array(nL + 1), ly = new Float64Array(nL + 1), lz = new Float64Array(nL + 1);
    let gap = 0;
    for (let j = 0; j <= nL; j++) { path.pointAt(j / nL, pp); lx[j] = pp.x; ly[j] = pp.y; lz[j] = pp.z; if (j) gap = Math.max(gap, Math.hypot(lx[j] - lx[j - 1], ly[j] - ly[j - 1], lz[j] - lz[j - 1])); }
    // THE GLASSWINGS' LAW, one function for the seventy and for the feeder's cloud. wingOff(p, w) takes a wing's place p and its dealt numbers w (what
    // goes into aA.w and aB: phase, span, speed, loop radius, flutter) and stands the place off the WHOLE line, not only off the point of it the wing is
    // dealt from (the route is a round and comes by again, and a wing loops and flaps about its place): wherever the line passes within WING_AIR of a
    // bound of where the wing's skin can be, p is moved straight away from the point of the line it is least clear of, by the least that clears that
    // point, and then looked at again, since another part of the line may now be the nearest. It answers 0 when the wing is clear (p is then its place),
    // 1 when the wing still lacks after WING_TURNS turns, 2 when its place stands on its least clear point, where there is no way to move it: a wing
    // answered 1 or 2 is not drawn, and is counted (wingDrops, below). The bound is WING_VS's own figures, typed again here: the body rides a level circle of radius
    // aB.z about the place and bobs at most 0.45 aB.z + 0.25 up and down (a filled drum is taken, so a wing can be moved whose skin itself stays further
    // off), and a wing's far corner is half the span aB.x times hypot(1, 0.5) from the body, however it flaps. Half of WING_STEP is added to what a wing
    // must keep: between two neighbouring points of the table that both clear, the line comes nearer by a few millimetres at the most, far under that
    // half step. The search for the least clear point hops: a point that stands cl clear while the least so far is c lets it pass over the next
    // (cl - c) / gap points, since none of them can be nearer than c; it finds the same point as looking at every one.
    const wingOff = (p, w) => {
      const R = w[3], V = 0.45 * R + 0.25, need = WING_AIR + 0.5 * w[1] * Math.hypot(1, 0.5) + 0.5 * WING_STEP;
      for (let turn = 0; ; turn++) {
        let c = need, bj = -1;                                   // the point of the line the drum is least clear of, if any is nearer than need
        for (let j = 0; j <= nL; j++) {
          const cl = Math.hypot(Math.max(0, Math.hypot(lx[j] - p.x, lz[j] - p.z) - R), Math.max(0, Math.abs(ly[j] - p.y) - V));
          if (cl < c) { c = cl; bj = j; } else j += Math.floor((cl - c) / gap);
        }
        if (bj < 0) return 0;
        const vx = p.x - lx[bj], vy = p.y - ly[bj], vz = p.z - lz[bj], A = Math.hypot(vx, vz), B = Math.abs(vy);
        if (turn === WING_TURNS) return 1;
        if (!(A + B > 1e-6)) return 2;
        const clear = (k) => Math.hypot(Math.max(0, k * A - R), Math.max(0, k * B - V));   // the drum's clear air of that point with the place k times as far from it
        let lo = 1, hi = 2; while (clear(hi) < need) hi *= 2;
        for (let n = 0; n < 40; n++) { const m = 0.5 * (lo + hi); if (clear(m) < need) lo = m; else hi = m; }
        p.set(lx[bj] + hi * vx, ly[bj] + hi * vy, lz[bj] + hi * vz);
      }
    };
    {
      const g = new THREE.InstancedBufferGeometry(), aA = [], aB = [], drops = [[], [], []];      // drops: the wings not drawn, by why (1, 2, 3), each by its number in the deal
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -0.5, 0, 0, -0.5, 1, 0, -0.5, -1, 0, 0.5, 0, 0, 0.5, 1, 0, 0.5], 3));
      g.setIndex([0, 1, 4, 0, 4, 3, 1, 2, 5, 1, 5, 4]);
      // the seventy: each is dealt (all its draws first, in their order) off a point of the line, then stood off the whole line by the law
      for (let i = 0; i < 70; i++) {
        const u = ar.range(0.61, 0.915), a = ar.range(0, 6.283), d = ar.range(4.5, 8.5); path.pointAt(u, pp); path.tangentAt(u, tan);
        bX.crossVectors(tan, UP).normalize(); bY.crossVectors(bX, tan);
        pp.addScaledVector(bX, Math.cos(a) * d).addScaledVector(bY, Math.sin(a) * d * 0.7);
        const w = [ar(), ar.range(0.8, 1.0), ar.range(0.45, 0.9) * ar.sign(), ar.range(1.0, 2.0), ar.range(9, 13)], why = wingOff(pp, w);
        if (why) { drops[why - 1].push(i); continue; }
        aA.push(pp.x, pp.y, pp.z, w[0]); aB.push(w[1], w[2], w[3], w[4]);
      }
      // a cloud of them round the young tree's bells and out toward the fall (set out from the tree's place, clear of our line): each is dealt and its dealt
      // place tested (4 m from the line by path.distanceTo, the snag's keep-out), and one that passes is then stood off the WHOLE line by the law
      // (path.distanceTo measures the place alone, to a sample of the line every 2 m, so a wing it passes can still bring its skin within WING_AIR of
      // the line); a wing the law moves into the snag's keep-out is not drawn (why 3), like one the law cannot clear, and is counted with them
      for (let i = 0; i < 16; i++) {
        const x = FEED.x + ar.range(-15, 5), y = ar.range(-1, 8), z = FEED.z + ar.range(-10, 9), w = [ar(), ar.range(0.85, 1.0), ar.range(0.5, 0.8) * ar.sign(), ar.range(0.8, 1.6), ar.range(9, 13)];
        if (path.distanceTo(x, y, z) < 4 || Math.hypot(x - SNAG.x, z - SNAG.z) < SNAG.r + 2.5) continue;
        pp.set(x, y, z);
        const why = wingOff(pp, w) || (Math.hypot(pp.x - SNAG.x, pp.z - SNAG.z) < SNAG.r + 2.5 ? 3 : 0);
        if (why) { drops[why - 1].push(70 + i); continue; }
        aA.push(pp.x, pp.y, pp.z, w[0]); aB.push(w[1], w[2], w[3], w[4]);
      }
      // THE WINGS NOT DRAWN are counted by why, in scene.userData.wingDrops: turns (still lacking after WING_TURNS turns), point (the place stands on its
      // least clear point), snag (a wing of the cloud moved into the snag's keep-out). Where any count is not nought the build says so once, naming the
      // seed, each count and each wing by its number in the deal (the seventy are 0 to 69, the cloud's sixteen 70 to 85). Nothing else comes of it.
      scene.userData.wingDrops = { turns: drops[0].length, point: drops[1].length, snag: drops[2].length };
      if (drops[0].length + drops[1].length + drops[2].length) console.warn(`swordbill-round, seed ${ctx.seed}: glasswings not drawn (a wing's number is its place in the deal: the seventy 0 to 69, the cloud 70 to 85): ${drops[0].length} still lacking after ${WING_TURNS} turns of the law [${drops[0].join(', ')}]; ${drops[1].length} standing on their least clear point of the line [${drops[1].join(', ')}]; ${drops[2].length} of the cloud moved into the snag's keep-out [${drops[2].join(', ')}]`);
      g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(aA), 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(aB), 4)); g.instanceCount = aA.length / 4;
      add(new THREE.Mesh(g, sprite(WING_VS, WING_FS, {})), 3);
    }
    if (drizzle) {
      const aA = []; for (let i = 0, n = Math.round(900 * detail); i < n; i++) aA.push(ar.range(0, 44), ar.range(0, 44), ar.range(0, 44), ar.range(9, 13));
      add(new THREE.Mesh(quadGeo({ aA: [aA, 4] }), sprite(RAIN_VS, RAIN_FS, { uRes })), 5);
    }
    await ctx.yield();

    // ---- wildlife ---------------------------------------------------------------------------------------------
    const birdMat = (irid, o = {}) => new THREE.ShaderMaterial({ uniforms: { ...SU, uAnim: { value: new THREE.Vector4(0, 0, o.tail ?? 0.1, 0) }, uPivL: { value: o.pivL || V3(0.12, 0.1, 0.05) }, uPivR: { value: o.pivR || V3(-0.12, 0.1, 0.05) },
      uAxis: { value: o.axis || V3(0, 0, 1) }, uPivH: { value: o.pivH || V3() }, uIrid: { value: C(irid) }, uFade: { value: 1 }, uFur: { value: o.fur ?? 0 }, uStream: { value: o.stream ?? 0 }, uRim: { value: o.rim ?? 0.5 }, uFeath: { value: o.feath ?? 0 }, uSpark: { value: o.spark ?? 0 }, uScl: { value: o.scl ?? 1 } }, vertexShader: BIRD_VS, fragmentShader: BIRD_FS, vertexColors: true, side: THREE.DoubleSide });
    const fanMat = (col, alpha, spread, mist, streak = 0.14, ends = 0.55, seed = null) => new THREE.ShaderMaterial({ uniforms: { ...SU, uCol: { value: C(col) }, uFan: { value: new THREE.Vector4(alpha, spread, seed ?? rng() * 20, mist) }, uSoft: { value: new THREE.Vector2(streak, ends) } }, vertexShader: FAN_VS, fragmentShader: FAN_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    // the blur of two wings: each a fan across the body's line and another along it
    const hummerFans = (len) => {
      const P = [], Q = [], I = []; let n = 0;
      for (const s of [-1, 1]) for (const pl of [0, 1]) {
        const r = [s * 0.13, 0.09, 0.1];
        for (const c of [[0, -1], [1, -1], [1, 1], [0, 1]]) { P.push(r[0] + s * c[0] * len, r[1] + (pl ? 0.45 * c[0] * len : c[1] * len), r[2] + (pl ? c[1] * len : -0.1 * c[0] * len)); Q.push(c[0], c[1]); }
        I.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 2)); g.setIndex(I); return g;
    };
    const birds = new THREE.Group(); scene.add(birds);
    // own = a stream of its own for a bird added later (the others draw from the world's, in their old order)
    const makeHummer = (sp, size, own = null) => {
      const g = new THREE.Group(), body = new THREE.Mesh(hummerGeo(sp), birdMat(sp.irid, { tail: sp.tailKind === 'fan' ? 0.03 : 0.16, spark: sp.spark, scl: sp.scl, stream: 1 })), fans = new THREE.Mesh(hummerFans(sp.wing || 0.8), fanMat(sp.fan, sp.fanA || 0.85, 1.25, 1, 0.14, 0.8, own ? own() * 20 : null));
      body.frustumCulled = false; fans.frustumCulled = false; fans.renderOrder = 6; g.add(body, fans); g.scale.setScalar(size); birds.add(g);
      return { g, anim: body.material.uniforms.uAnim.value, ph: (own || rng)() * 10 };
    };
    const rivalSpec = RIVALS[rivalKind], rivalSize = rivalKind === 'sapphirewing' ? 1.5 : rivalKind === 'inca' ? 1.3 : 1.0;
    const rival = makeHummer(rivalSpec, rivalSize), fighters = [makeHummer(RIVALS.sylph, 1.0), makeHummer(RIVALS.sylph, 0.95)];
    const racketSpec = { back: '#1e8a46', belly: '#23a052', throat: '#34d67c', tail: '#101826', tailKind: 'rackets', tailLen: 0.95, bill: 0.16, crown: '#30c068', irid: '#40e080', fan: '#7f8c82', puffs: 1 };
    const rackets = [makeHummer(racketSpec, 1.0), makeHummer(racketSpec, 0.94)];
    // another of our own kind, feeding at the young tree's great bell: bronze-green, a glittering gorget, the bill longer than the bird
    const SW = 2.6, swordSpec = { back: '#2a6b3c', belly: '#b4cdb0', bellyK: -0.05, headIrid: 0.35, throat: '#1f6b3a', crown: '#b07a2c', vent: '#b9b89a', tail: '#101512', tailKind: 'fan', fork: 1, tailLen: 0.52, bill: 1.05, arch: 0.5, irid: '#58f08a', fan: '#4f5850', fanA: 1.0, spark: 1.0, wing: 0.9, scl: 2.3 };
    const feeder = makeHummer(swordSpec, SW, nz), FEED_LEAN = V3().copy(FEED_L).multiplyScalar(0.94).addScaledVector(FEED_F, -0.34).normalize();      // we come on it side-on, its breast turned a little our way
    // seen from the side a hummingbird's stroke is a thin line and the bird a wingless spindle: each of the three birds that come
    // close gets a second blur, two fans that face the eye and stand across the body's line, shown the more the more side-on it is
    const sideFans = (h, size, a, col, spread, mist, seed = null) => {
      const P = [], Q = [], I = [], len = 0.72; let n = 0;
      for (const sg of [-1, 1]) { for (const c of [[0, -1], [1, -1], [1, 1], [0, 1]]) { P.push(sg * (0.06 + c[0] * len), c[1] * len * 0.8 + c[0] * 0.3 * len, 0); Q.push(c[0], c[1]); } I.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 2)); g.setIndex(I);
      const m = new THREE.Mesh(g, fanMat(col, a, spread, mist, 0.12, 0.8, seed ?? nz() * 20)); m.frustumCulled = false; m.renderOrder = 6; m.scale.setScalar(size); m.visible = false; birds.add(m);
      return { m, g: h.g, a, size, fan: m.material.uniforms.uFan.value };
    };
    // pale where it hovers before a wall in shade (afternoon, blue hour); dark grey-brown where the wall behind it is bright mist-grey (morning, dawn)
    const fansDark = hour === 'morning' || hour === 'dawn', feederFans = sideFans(feeder, SW, fansDark ? 1.0 : 0.8, fansDark ? '#221e19' : '#d6dccb', 0.95, 0.15);
    if (fansDark) feederFans.m.material.uniforms.uSoft.value.set(0.05, 1.0);
    // two more sylphs: they keep us company on the way out over the ravine and cross our bow as we come back
    const extras = [makeHummer(RIVALS.sylph, 1.25, nz), makeHummer(RIVALS.sylph, 1.1, nz)];
    const extraFans = [sideFans(extras[0], 1.25, 0.75, '#59625a', 1.2, 0.2, 3.7), sideFans(extras[1], 1.1, 0.75, '#59625a', 1.2, 0.2, 11.3)]      // dark, and hardly taking the mist's colour: these two are seen against bright mist, where a mist-coloured blur is no blur at all;
    await ctx.yield();
    const makeFlapper = (sp, size) => {
      const m = new THREE.Mesh(flapperGeo(sp), birdMat(sp.irid || '#000000', { tail: 0.03, rim: sp.rim, feath: sp.feath ?? 8 })); m.frustumCulled = false; m.scale.setScalar(size); birds.add(m);
      if (sp.overMist) { m.material.transparent = true; m.renderOrder = 7; }
      return { g: m, anim: m.material.uniforms.uAnim.value, ph: rng() * 10 };
    };
    const cock = makeFlapper({ back: bloomForm === 'yellow' ? '#e0461c' : '#e23a14', belly: '#d8321e', head: '#ee4a1a', crestEdge: '#ff6a2a', wing: '#0b0b0d', wing2: '#141416', tertial: '#b9bcc0', under: '#1c1c1f', under2: '#101012', tail: '#0b0b0d',
      billC: '#e8a020', bill: 0.1, billDepth: 0.05, crest: 1, span: 2.3, chord: 0.5, tailLen: 0.34, tailFan: 0.15, fingers: 6, fingerLen: 0.26, fingerW: 0.25, eye: '#eef0ff', feath: 9, rim: 0.25 }, 4.8 / 1.4);
    const pair = toucans ? [0, 1].map(() => makeFlapper({ back: '#4a4a2a', belly: '#7f9fb8', head: '#101010', wing: '#3d4a2a', wing2: '#55602c', under: '#6a7458', tail: '#3a3a26', tailBand: '#8a3a1a', billC: '#e8c020', billTip: '#b02018', bill: 0.42, billDepth: 0.09,
      span: 1.9, chord: 0.42, tailLen: 0.5, tailFan: 0.12, fingers: 5 }, 7 / 1.5)) : null;
    // the black-and-chestnut eagle: black hood and back, chestnut belly and wing linings, grey flight feathers tipped black, yellow cere and feet
    const eagle = rare ? makeFlapper({ back: '#0c0c0e', belly: '#7a3216', head: '#0b0b0d', throat: '#0b0b0d', wing: '#121214', wing2: '#0c0c0e', under: '#6e6a62', under2: '#7a3216', trail: '#0a0a0b', tail: '#8f8c84', tailBand: '#0c0c0e',
      billC: '#2a2a2c', cere: '#e8b820', billTip: '#101010', hook: 0.05, bill: 0.14, billDepth: 0.07, span: 3.25, chord: 0.74, tailLen: 0.5, tailFan: 0.13, tailN: 7, fingers: 5, fingerLen: 0.27, fingerW: 0.24, feet: '#e8b820', eye: '#f0a020', rim: 0.07, feath: 8, overMist: 1 }, 25 / 3.25) : null;
    // THE GUARD of both tanager flocks' blocks, which read by name what the kit made of a flock. Before a block walks anything it asks: that
    // each name a block or update reads is there and of the kind it is read as (an object; a function: our path's posAtDist, the route's
    // pointAt, the flock's update, the group's updateMatrixWorld where the block calls it, the four readers of aAnim and of position; a
    // uniform is asked to be there and its fields are asked as numbers); that each number of N is a finite number and, where N gives it a
    // most, over 0 and no more than it (MOST: 4,000 birds, vertices, or quarter-metre steps of our path or of the route, which is 1 km;
    // the sphere's radius is asked over 0 and has no most); that the count is whole and iA and iB are four numbers a bird, each a finite
    // number; that each vertex of the model gives a finite reach. The guard hands nothing back to the page: its walks are short at
    // their mosts. The quarter metre is the guard's own measure of the two lengths for both flocks (so 1 km at the most); the burst's
    // search walks at a step of its own, 0.05 m, and is bounded by its count. THE SEARCHES' MOSTS: each block counts in ONE count,
    // across its whole search, the pairs it walks (a place of our line held against a bird's box; the crossing flock's count also takes
    // a place held against the whole flock's box), and where the count passes its most the flock is left out: MOST_PAIRS for the
    // crossing flock, whose pairs are read out of two tables, MOST_WALK for the burst, whose every pair reads our path's curve anew and
    // costs several times as much. The mosts were sized by time, the deals' longest searches beside them as the floor: at them a flock's whole search, the guard, the tables
    // and the hand-backs with it, was timed when the mosts were set (9 October, on pages of one loaded build machine) and ended inside
    // about a second (the crossing flock's; the burst's inside a quarter of one). No line measures time, and a sound deal past a most
    // loses its flock, warned: of 80,000 deals counted then the longest searches walked 538,477 pairs and 19,328. The figures are in
    // that pass's notes (notes-16r.md).
    // Where an ask fails, or a search passes its most, or the lift is over LIFT_MOST, or a number of a search is not a finite one,
    // `flockOut` warns once with the reason (for a name: not which name), hides the flock, takes it out of its parent
    // (where it has one whose remove is a function) and frees what is the flock's own, each asked for by kind before it is called: its
    // geometry (the kit builds the bird's model and the per-bird arrays anew for every flock), its material (of the program two flocks
    // share the renderer keeps its own count) and the texture of its baked course (route.texture, the material's uRoute). The kit's
    // flock hands out no dispose of its own, and the engine's clearing frees only what is in the scene. A flock is left out during the
    // build, before any frame of this world: where nothing has drawn it the graphics card holds nothing of it yet and the freeing takes
    // nothing from the card; it is there so that a flock that was drawn before it was left out does not stay on the card for good.
    // The guard then hands back not-a-number, the block is not run and the flock's name is set to null, so update no longer calls it.
    // The two lines that lay a flock into the scene ask for its group first, as the guard does. Where nothing fails the guard hands back
    // the bird's reach at size 1, whatever the wing does: a wing vertex turns about its shoulder, and the kit's wing law (birds.js 135 to
    // 156) adds the edge's flick and the outer wing's sweep (0.22 and 0.25 of the beat's amplitude a span metre), the body's bob, the
    // tail's flick.
    const fin = Number.isFinite, MOST = 4000, MOST_PAIRS = 1000000, MOST_WALK = 50000, isObj = (o) => typeof o === 'object' && o !== null;
    const overWalk = (most) => 'its search walked more than its most of ' + most + ' pairs, a place of our line held against a box of the flock\'s';
    const flockOut = (fl, name, why) => {
      console.warn('swordbill-round, seed ' + ctx.seed + ': the ' + name + ' is left out (' + why + ')');
      const o = fl && fl.object;
      if (isObj(o)) { o.visible = false; if (isObj(o.parent) && typeof o.parent.remove === 'function') o.parent.remove(o); }
      for (const own of [fl && fl.geometry, fl && fl.material, fl && isObj(fl.route) && fl.route.texture]) if (isObj(own) && typeof own.dispose === 'function') own.dispose();
      return null;
    };
    const flockRead = (fl, name, step, sphere) => {
      const at = fl && fl.geometry && fl.geometry.attributes, U = fl && fl.uniforms, n = fl && fl.count, o = fl && fl.object;
      const attr = (a) => isObj(a) && typeof a.getX === 'function' && typeof a.getY === 'function' && typeof a.getZ === 'function' && typeof a.getW === 'function';
      let reach = 0, why = '';
      if (!(at && U && isObj(o) && isObj(o.position) && isObj(o.userData) && (sphere || typeof o.updateMatrixWorld === 'function') && isObj(fl.route) && typeof fl.route.pointAt === 'function' && typeof path.posAtDist === 'function' && typeof fl.update === 'function' && isObj(U.uTravel)
        && (!sphere || isObj(fl.bounds)) && isObj(at.iA) && isObj(at.iB) && isObj(at.iA.array) && isObj(at.iB.array) && attr(at.aAnim) && attr(at.position) && U.uWander && U.uFlap && U.uWing && U.uNear && U.uScale))
        why = 'a name this world reads of the kit\'s flock or of our path is absent or of another kind than it is read as';
      else {
        const A = at.iA.array, B = at.iB.array, wan = U.uWander.value, wing = U.uWing.value, amp = U.uFlap.value?.y;
        const N = [['our path\'s length', path.length, MOST * step], ['the route\'s length', fl.route.length, MOST * step], ['the count of birds', n, MOST], ['position\'s count', at.position.count, MOST], ['aAnim\'s count', at.aAnim.count, MOST],
          ...(sphere ? [['the sphere\'s radius', fl.bounds.radius, Infinity]] : []), ['uScale', U.uScale.value], ['uWander\'s x', wan?.x], ['uWander\'s y', wan?.y], ['uWander\'s z', wan?.z], ['uFlap\'s y', amp], ['uWing\'s w', wing?.w], ['uWing\'s x', wing?.x], ['uNear\'s y', U.uNear.value?.y]];
        for (const [what, v, most] of N) if (!why) why = !fin(v) ? what + ' is not a finite number' : most && !(v > 0) ? what + ' is not over 0' : v > most ? what + ' is over the most the search takes, ' + most : '';
        if (!why) why = !Number.isInteger(n) ? 'the count of birds is not a whole number' : A.length !== n * 4 || B.length !== n * 4 ? 'iA or iB is not four numbers a bird long' : '';
        for (let i = 0; i < n * 4 && !why; i++) if (!fin(A[i]) || !fin(B[i])) why = 'a number of iA or iB is not a finite number';
        for (let i = 0; i < at.position.count && !why; i++) {
          const side = at.aAnim.getY(i), d = Math.abs(side) > 0.5 ? at.aAnim.getX(i) : 0;
          const r = Math.hypot(at.position.getX(i) - side * d, at.position.getY(i), at.position.getZ(i)) + d * (1 + Math.hypot(0.22, 0.25) * amp) + wing.w * amp + 0.06 * wing.x * at.aAnim.getW(i);
          reach = Math.max(reach, r); if (!fin(r)) why = 'a vertex of the bird\'s model gives a reach that is not a finite number';
        }
      }
      if (why) flockOut(fl, name, why);
      return why ? NaN : reach;
    };
    // the tanagers crossing as we arrive: sixty birds on a level course 8.5 m over our line 39 m from the start. Through a portal the kit flies
    // the flock round that course on the clock, so it can be coming over the line as the lens gets there: it is kept off the lens by place.
    // THE CALL lays a loose line: the spread in height is 1.0 and the wander in height 0.4, ONE FIFTH of the 5 and 2 this world had up to
    // round 13 (its call spread [9, 5, 30] and left the wander to the kit's crows, [4, 2, 4, 0.4]); every other figure of the call is as
    // it was then. Round 14 had 1.02 and 0.41, sized on forty seeds' deals; the fifth is the owner's round share next to them, typed plain
    // and read from no seed: where a deal's lowest bird still comes within its clear air of our line,
    // the block below lifts the whole course by what is lacking; over LIFT_MOST nothing is lifted and the flock is left out. The kit draws the same numbers whatever these two
    // options are: a bird's height is one bell-curve draw times 0.45 of the spread, and the wander takes no draw.
    let flock = toucans ? null : makeFlock({ rng, species: 'crows', count: 60, size: 3.0, speed: 12, spread: [9, 1.0, 30], wander: [4, 0.4, 4, 0.4], cross: { path, u: 0.012, lead: 31, span: 150, angle: 76, side: 1, height: 8.5, duration: 44 },
      body: '#0d1640', belly: '#f2c83a', wingC: '#0c1238', head: '#d8321e', tailC: '#0a0f2c', beak: '#202020',
      light: { sunDir: sunW, sunColor: HU.uSunCol.value, sunIntensity: 1, sky: HU.uSkyCol.value.clone().multiplyScalar(2.2), skyIntensity: 1, ground: HU.uGroundCol.value.clone().multiplyScalar(2.2), groundIntensity: 1 } });
    if (flock && isObj(flock.object)) { flock.object.frustumCulled = false; scene.add(flock.object); }
    const flockReach = toucans ? NaN : flockRead(flock, 'tanager flock', 0.25);
    if (!fin(flockReach)) flock = null;
    if (flock)
    {
      // A bird's station: the course's point at its metre plus its dealt offsets in the world's axes (iA: x and the height, a bell-curve draw
      // of 0.45 times the spread in height; iB's fourth number: z). Its box: about the station it wanders at most 1.5 times the wander's first
      // figure along x, its second in height, its third along z. On the clock any metre of the course can meet any metre of our line, so every
      // point of the course is held against every point of the line.
      await ctx.yield();
      const at = flock.geometry.attributes, iA = at.iA.array, iB = at.iB.array, U = flock.uniforms, wan = U.uWander.value, p = V3();
      let most = 0, wide = 0, lift = 0, why = '', walked = 0, mark = 0;
      // the clear air about a bird's box: the kit's own guard (uNear's second number, (0.5 + 0.5) * size * 2.2 = 6.6 m: inside it the kit shrinks
      // a bird) or, where more, 2.0 m and the bird's reach at its dealt size (iB's first number times uScale). `order`: the birds by the lift
      // they can ask, the most first. LIFT_MOST: the most the owner gives the lift, in metres.
      const air = [], step = 0.25, LIFT_MOST = 2.0, ex = 1.5 * wan.x + step, ez = wan.z + step;
      for (let i = 0; i < flock.count; i++) { air.push(Math.max(U.uNear.value.y, 2.0 + flockReach * iB[i * 4] * U.uScale.value)); most = Math.max(most, air[i]); wide = Math.max(wide, Math.abs(iA[i * 4]), Math.abs(iB[i * 4 + 3])); }
      const order = air.map((_, i) => i).sort((i, j) => (air[j] - iA[j * 4 + 1]) - (air[i] - iA[i * 4 + 1]));
      // every quarter metre of the course against every quarter metre of our line: where the line is nearer a bird's box in plan than the clear
      // air, the box's floor (the station less the wander in height) must stand so far over it that the box is the clear air away. Against
      // slipping between table points the box is taken a step wider in plan and the highest of the line's three points is held against the lowest
      // of the course's three; not in the table: the last part of a step of each, and the 2.88 m before the course's first metre, where the kit
      // draws a bird small (the course's ends lie some 69 m to the side of our line). The lift is the greatest need found. Hand-backs: every
      // 256th point of either table, every point of the course in the search, and every 8,192 pairs walked. By the guard a table has MOST + 1 points
      // at the most (the kit deals sixty birds; the tables' sizes follow the two lengths at a quarter metre). `walked` is the search's ONE COUNT OF PAIRS: every
      // place of the line's table held against a point of the course (first against the whole flock's box: `far`) and every bird's box then
      // held against it there. Past MOST_PAIRS the search ends and the flock is left out. A point of either table that is not a finite
      // number leaves the flock out before a pair is walked.
      const line = [], course = [], far = wide + Math.max(ex, ez) + most;
      for (let d = 0; d <= path.length; d += step) { if (line.length % 768 === 0) await ctx.yield(); path.posAtDist(d, p); line.push(p.x, p.y, p.z); }
      for (let s = 0; s <= flock.route.length; s += step) { if (course.length % 768 === 0) await ctx.yield(); flock.route.pointAt(s, p); course.push(p.x, p.y, p.z); }
      if (!line.every(fin) || !course.every(fin)) why = 'a point of our path or of the course is not a finite number';
      for (let a = 0; !why && a < course.length; a += 3) {
        await ctx.yield();
        const low = Math.min(course[a + 1], course[Math.max(a - 2, 1)], course[Math.min(a + 4, course.length - 2)]);
        for (let b = 0; !why && b < line.length; b += 3) {
          if (++walked > MOST_PAIRS) { why = overWalk(MOST_PAIRS); break; }
          if (walked - mark > 8192) { mark = walked; await ctx.yield(); }
          const dx = line[b] - course[a], dz = line[b + 2] - course[a + 2], out = Math.max(Math.abs(dx), Math.abs(dz)) - far;
          if (out >= 0) { b += 3 * Math.floor(out / (2 * step)); continue; }      // too far for any bird's box, the points passed over too (two are no more than a step apart; half as many are passed)
          const rest = Math.max(line[b + 1], line[Math.max(b - 2, 1)], line[Math.min(b + 4, line.length - 2)]) - low + wan.y;   // the lift at which the box of a bird dealt at the course's own height would rest on the line here
          for (const i of order) {
            const touch = rest - iA[i * 4 + 1];
            if (touch + air[i] <= lift) break;      // even straight over the line it asks no more than is found, nor can a later bird in the order
            if (++walked > MOST_PAIRS) { why = overWalk(MOST_PAIRS); break; }
            const gx = Math.max(Math.abs(dx - iA[i * 4]) - ex, 0), gz = Math.max(Math.abs(dz - iB[i * 4 + 3]) - ez, 0), g2 = air[i] * air[i] - gx * gx - gz * gz;
            if (g2 > 0) lift = Math.max(lift, touch + Math.sqrt(g2));
          }
        }
      }
      // the lift is the group's own place: the kit draws and guards the flock through the group's matrix; its timetable, treadmill and end fades
      // read only the metre along the course, which a lift does not change. It is written only where it is a finite number and no more than
      // LIFT_MOST: where it is not, the flock is left out, the group's place as the kit made it.
      if (!why && !fin(lift)) why = 'the lift found is not a finite number';
      if (!why && lift > LIFT_MOST) why = 'the lift it asks, ' + lift.toFixed(2) + ' m, is over its most of ' + LIFT_MOST + ' m';
      if (why) flock = flockOut(flock, 'tanager flock', why);
      else if (lift > 0) { flock.object.position.y = lift; flock.object.updateMatrixWorld(); }
    }
    // the rare visit: when the eagle stoops, the tanagers explode out of the crown and the eagle's shadow slides over the head wall
    // The burst's course rises through our own line: the block after the call keeps each bird off the lens by place, writing one dealt number,
    // the lag, of only a bird whose box would come within its clear air of the lens. BURST_U, BURST_SPEED, BURST_DUR: the burst's cross u,
    // its speed and its duration, the figures the call had typed in it in rounds 13 and 14, written once: the call hands them to the kit and the block reckons the kit's timetable
    // from the same three names.
    const BURST_U = 0.548, BURST_SPEED = 17, BURST_DUR = 44;
    let burst = null;
    if (rare) {
      burst = makeFlock({ rng, species: 'crows', count: 44, size: 3.0, speed: BURST_SPEED, flap: 5, glide: 0.05, spread: [12, 7, 22], cross: { path, u: BURST_U, lead: 33, span: 140, angle: 64, side: -1, height: -3, rise: 34, duration: BURST_DUR },
        body: '#0d1640', belly: '#f2c83a', wingC: '#0c1238', head: '#d8321e', tailC: '#0a0f2c', beak: '#202020',
        light: { sunDir: sunW, sunColor: HU.uSunCol.value, sunIntensity: 1, sky: HU.uSkyCol.value.clone().multiplyScalar(2.2), skyIntensity: 1, ground: HU.uGroundCol.value.clone().multiplyScalar(2.2), groundIntensity: 1 } });
      if (burst && isObj(burst.object)) { burst.object.frustumCulled = false; scene.add(burst.object); }
      const burstReach = flockRead(burst, 'tanager burst', 0.25, true);
      if (!fin(burstReach)) burst = null;
      if (burst)
      {
        // The burst is not on its course when we enter, so the kit's treadmill never runs for it and a bird's place is a thing of the line's
        // metre alone: with the lens at metre d of our line the timetable has the lead point at the course's metre Lr / 2 + (d / L - BURST_U) *
        // BURST_SPEED * BURST_DUR, and a bird rides its lag (iA's third number) behind it, in a box made as the crossing flock's.
        await ctx.yield();
        const at = burst.geometry.attributes, iA = at.iA.array, iB = at.iB.array, U = burst.uniforms, wan = U.uWander.value, n = burst.count, Lr = burst.route.length, L = path.length, p = V3(), q = V3();
        let back = 0, why = '', walked = 0;
        // k: the metres of its course the lead point flies while the lens flies one metre of our line. The clear air of a bird's box: the crossing
        // flock's (6.6 m, or 2.0 m and the reach at its dealt size) and, the walk below reading the line a twentieth of a metre a step, half a
        // step's motion of the lens and the bird more. `back`: the longest lag dealt.
        const k = BURST_SPEED * BURST_DUR / L, h = 0.05, ex = 1.5 * wan.x, ey = wan.y, ez = wan.z, round = Math.hypot(ex, ey, ez), air = [], held = [], lags = [];
        for (let i = 0; i < n; i++) { air.push(Math.max(U.uNear.value.y, 2.0 + burstReach * iB[i * 4] * U.uScale.value) + (1 + k) * h / 2); back = Math.max(back, iA[i * 4 + 2]); }
        // how near the lens comes to bird i's box if the bird rides g metres behind the lead point: our line walked from where the bird comes onto
        // its course's first metre to where it leaves the last (not the 4.08 m before the first, where the kit draws a bird small). Further off
        // than its clear air the walk passes over the metres in which the box cannot have come that near (lens and bird together move no more
        // than 1 + k metres a metre of the line; half as many are passed over); nearer, it goes step by step. Each step is a pair, a place of
        // our line held against the bird's box, and `walked` is the search's ONE COUNT OF PAIRS, every bird's and every lag's tried: a step past
        // MOST_WALK, or a distance that is not a finite number, sets `why` and the walk hands back no number, which counts as not clear. One
        // walk over our own path takes one step for every twentieth of a metre of it at the most (the count is what ends a search), so the
        // walk hands back to the page too, every 256 pairs of the count.
        const least = async (i, g) => {
          let v = Infinity;
          for (let d = Math.max(0, BURST_U * L + (g - Lr / 2) / k); d <= L;) {
            const s = Lr / 2 + (d - BURST_U * L) * k - g; if (s > Lr) break;
            path.posAtDist(d, p); burst.route.pointAt(s, q);
            const gap = Math.hypot(Math.max(Math.abs(p.x - q.x - iA[i * 4]) - ex, 0), Math.max(Math.abs(p.y - q.y - iA[i * 4 + 1]) - ey, 0), Math.max(Math.abs(p.z - q.z - iB[i * 4 + 3]) - ez, 0));
            if (++walked > MOST_WALK || !fin(gap)) { why = walked > MOST_WALK ? overWalk(MOST_WALK) : 'the distance of a bird\'s box from our line is not a finite number'; return NaN; }
            if (walked % 256 === 0) await ctx.yield();
            if (gap < v) v = gap;
            d += Math.max(h, (gap - air[i]) / (2 * (1 + k)));
          }
          return v;
        };
        // A bird whose box keeps its clear air is not touched. Another has its lag made shorter: down by what the box still lacks (which moves
        // the box no further, so no lag that clears is passed over), a hundredth of a metre at the least, until the box is clear; and no further
        // ahead of the lead point than `ahead`. `ahead` IS MEANT AS A BOUND OF THE GROUP, not of the culling: the kit itself lays no bird ahead of
        // the lead point, and a bird is moved no further ahead of it than the kit's own sphere has room. Its figure is the room the kit's own sphere about the group has (in birds.js,
        // `bounds`: laid once at the build about the dealt lags and offsets, the wander and the bird's size): a bird at the lag `ahead`,
        // with its box and its reach, still stands inside that sphere. No line measures a picture, and whether the burst still reads as one group
        // with a bird at the bound has not been looked at. NOTHING DRAWN DEPENDS ON THE SPHERE HERE: the kit does nothing to a bird
        // outside it; it hands the sphere to the renderer, which would pass over the whole flock where the sphere is out of the picture, and the
        // line that lays the burst into the scene switches that culling off (with it off the renderer reads only the sphere's centre, for the
        // order it draws in). What is drawn does depend on a lag far ahead in one place: `onRoute` shows a flock only while its travel is over
        // -8 m, so a bird put well ahead is in the air before the flock is shown. A bird not clear at the bound keeps
        // its dealt lag, is named in userData.held as [bird, dealt lag, that furthest lag, the box's distance there] and is warned of once.
        // The lags found are kept in `lags` and written, with iA marked for upload, only after every bird is searched: where `why` is set (by
        // a walk) the burst is left out and iA is as dealt. A round of the lowering that is not the last walks a pair or more, so the rounds
        // have the count's most too.
        for (let i = 0; i < n; i++) {
          await ctx.yield();
          const lag = iA[i * 4 + 2]; let g = lag, v = await least(i, g);
          if (v >= air[i]) continue;
          const ahead = -(burst.bounds.radius - back / 2 - Math.hypot(iA[i * 4], iA[i * 4 + 1], iB[i * 4 + 3]) - round - burstReach * iB[i * 4] * U.uScale.value);
          while (v < air[i] && g > ahead) { await ctx.yield(); g = Math.max(ahead, g - Math.max(0.01, air[i] - v)); v = await least(i, g); }
          if (why) break;
          if (v < air[i]) { held.push([i, lag, g, v]); continue; }
          lags.push(i, g);
        }
        if (why) burst = flockOut(burst, 'tanager burst', why);
        for (let j = 0; burst && j < lags.length; j += 2) iA[lags[j] * 4 + 2] = lags[j + 1];
        if (burst && lags.length) at.iA.needsUpdate = true;
        if (burst && held.length) burst.object.userData.held = held;
        if (burst && held.length) console.warn(`swordbill-round, seed ${ctx.seed}: tanager burst: ${held.length} of ${n} birds left at the dealt lag, no lag in bound clearing the lens (by place in the deal) [${held.map((x) => x[0]).join(', ')}]`);
      }
    }
    await ctx.yield();
    let bear = null, cub = null;
    if (bearMode !== 'none') {
      const mk = (sc, back, side, turn) => {
        const m = new THREE.Mesh(bearGeo(), birdMat('#000000', { axis: V3(1, 0, 0), pivL: V3(2.0, 6.2, 3.7), pivR: V3(-2.0, 6.2, 3.3), pivH: V3(0, 5.9, 6.3), rim: 0.1, fur: 1 }));
        m.frustumCulled = false; m.scale.setScalar(sc); m.material.uniforms.uFade.value = 0.32;      // black on pale mist: it keeps its dark from far off
        m.position.set(BEAR.x + bearF.x * back - bearF.z * side, 0, BEAR.z + bearF.z * back + bearF.x * side); m.position.y = cragTopY(m.position.x, m.position.z) - 0.3 * sc;
        m.rotation.y = Math.atan2(bearF.x, bearF.z) + turn; scene.add(m); return m;
      };
      bear = mk(BEAR_S, 0, 0, 0); if (bearMode === 'cub') cub = mk(0.45 * BEAR_S, -6, -9, 0.5);
      // its shadow on the rock and the plants (the middle of its body, half its length, the way it faces)
      SU.uBear.value.set(BEAR.x + bearF.x * 0.6 * BEAR_S, BEAR.y + 5.4 * BEAR_S, BEAR.z + bearF.z * 0.6 * BEAR_S, 9.0 * BEAR_S); SU.uBearR.value.copy(bearF);
    }
    const bee = new THREE.Group();
    { const b = new THREE.Mesh(beeGeo(), birdMat('#000000')), f = new THREE.Mesh(hummerFans(0.3), fanMat('#c6cecb', 0.62, 3.3, 1, 0.05, 0)); b.frustumCulled = false; f.frustumCulled = false; f.renderOrder = 6; f.position.set(0, -0.03, -0.07); bee.add(b, f); bee.scale.setScalar(0.8 / 0.42); birds.add(bee); }
    await ctx.yield();

    // ---- the mount: our own head at the foot of the frame (a small feathered crown and the bill running away from it), our
    // wing blur in the lower corners. The camera rides just behind and above the head. Head frame: the bill's root at the
    // origin, the bill along -z, y up; the crown, the nape and the shoulders run back along +z, out of the frame's foot.
    const mount = new THREE.Group(); mount.matrixAutoUpdate = false; scene.add(mount);
    const bill = new THREE.Group(), beak = new THREE.Group(); mount.add(bill); bill.add(beak);
    // the bill: 1.5 m of horn, slender, a little upcurved. BILL_L, billR, billY are read again by the drop that runs down it
    const BILL_L = 1.5, billR = (t) => lerp(0.024, 0.009, Math.pow(t, 0.9)), billY = (t) => 0.085 * t * t;
    {
      const G = new Geo(), horn = new THREE.Color(1, 1, 1), rings = [{ z: 0.04, y: 0, rx: 0.024, ry: 0.026, c: horn }];
      for (let i = 0; i <= 22; i++) { const t = i / 22, r = billR(t); rings.push({ z: -BILL_L * t, y: billY(t), rx: r, ry: r * 1.1, c: horn }); }
      rings.push({ z: -BILL_L - 0.01, y: billY(1), rx: 0.0065, ry: 0.007, c: horn }, { z: -BILL_L - 0.016, y: billY(1), rx: 0.001, ry: 0.001, c: horn });   // a rounded tip, not a point
      G.loft(rings, 14, [0, 0, 1, 0]);
      // the head: deep bottle green, bronzed along the crown, darker down the nape; feathers lying scale on scale (uv = round, along)
      const G2 = new Geo(), green = C('#1b5a3a'), bronze = C('#4a4a22'), nape = C('#0f3524'), cc = new THREE.Color();
      const TAB = [[-0.03, 0.026, 0.028, 0.0], [0.02, 0.05, 0.045, 0.012], [0.07, 0.082, 0.07, 0.03], [0.13, 0.1, 0.086, 0.042], [0.19, 0.104, 0.09, 0.04], [0.26, 0.095, 0.08, 0.025], [0.33, 0.085, 0.072, 0.0], [0.42, 0.1, 0.085, -0.04], [0.54, 0.14, 0.11, -0.09], [0.66, 0.17, 0.125, -0.14], [0.78, 0.18, 0.13, -0.2]];
      const hr = [];
      for (let i = 0; i <= 20; i++) {
        const f = i / 2, k = Math.min(TAB.length - 2, Math.floor(f)), w = sstep(0, 1, f - k), a = TAB[k], b = TAB[k + 1], back = sstep(0.2, 0.5, lerp(a[0], b[0], w));
        hr.push({ z: lerp(a[0], b[0], f - k), rx: lerp(a[1], b[1], w), ry: lerp(a[2], b[2], w), y: lerp(a[3], b[3], w),
          cf: (an) => cc.copy(green).lerp(bronze, Math.max(0, Math.sin(an)) ** 3 * 0.55 * (1 - back)).lerp(nape, back * 0.7).multiplyScalar(Math.sin(an) > -0.2 ? 1 : 0.55).clone() });
      }
      G2.loft(hr, 22, [0, 0, 1, 1]);
      // small feathers lapping the root of the bill, longest along its ridge
      const p0 = V3(), p1 = V3(), p2 = V3(), p3 = V3(), out = V3();
      for (let k = 0; k < 15; k++) {
        const ph = lerp(0.05, Math.PI - 0.05, k / 14), cx = Math.cos(ph), sy = Math.sin(ph), len = 0.03 + 0.065 * sy * sy * sy + 0.01 * ((k * 7) % 3), tl = len / BILL_L, r1 = billR(tl);
        p0.set(cx * 0.027, sy * 0.029 + 0.003, 0.012); p1.set(cx * 0.0265, sy * 0.029 + 0.002, -len * 0.3);
        p2.set(cx * (r1 + 0.003), sy * (r1 * 1.1 + 0.003) + billY(tl * 0.65), -len * 0.65); p3.set(cx * (r1 + 0.0012), sy * (r1 * 1.1 + 0.0012) + billY(tl), -len);
        out.set(cx, sy, 0.2).normalize();
        G.ribbon([p0.clone(), p1.clone(), p2.clone(), p3.clone()], () => 0.0085 + 0.003 * sy, out, (tt) => cc.copy(green).lerp(bronze, sy * sy * 0.35).multiplyScalar(0.85 + 0.25 * tt).clone(), () => [0, k * 0.1, 1, 2]);
      }
      const headMat = surf(7, [22, 20, 0, 0.16], { dapple: 0 });
      const m = new THREE.Mesh(G.build(), headMat), m2 = new THREE.Mesh(G2.build(), headMat); m.frustumCulled = false; m.renderOrder = 8; m2.frustumCulled = false; m2.renderOrder = 8; beak.add(m); bill.add(m2);
    }
    const drop = new THREE.Mesh(new Geo().loft([{ z: -0.03, rx: 0.002, ry: 0.002, c: C('#9fb8b4') }, { z: -0.018, rx: 0.02, ry: 0.02, c: C('#9fb8b4') }, { z: 0.004, rx: 0.026, ry: 0.026, c: C('#dfeeea') }, { z: 0.024, rx: 0.016, ry: 0.016, c: C('#dfeeea') }, { z: 0.03, rx: 0.002, ry: 0.002, c: C('#ffffff') }], 7, [0, 0, 1, 1]).build(), surf(0, [0, 0, 0, 3.0], { dapple: 0 }));
    drop.frustumCulled = false; drop.renderOrder = 9; beak.add(drop);
    // our wing blur: two fans whose roots are pinned to the lower corners of the frame, whatever its shape
    const myFans = [-1, 1].map((s) => {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0], 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute([0, -1, 1, -1, 1, 1, 0, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const m = new THREE.Mesh(g, fanMat('#bdb19c', 0.42, 1.0, 0, 0.1, 0.3)); m.frustumCulled = false; m.renderOrder = 9; m.position.set(s * 0.85, -0.48, -0.8); mount.add(m); return m;
    });
    await ctx.yield();

    // ---- gaze, scripts, update ----------------------------------------------------------------------------------
    const c45 = Math.SQRT1_2, Tt = (x, y, z) => V3(ORIGIN.x + (x + z) * c45, ORIGIN.y + y, ORIGIN.z + (z - x) * c45);
    const onRoute = (f) => { const s = f.uniforms.uTravel.value; return s > -8 && s < f.route.length + 60; };
    const camP = V3(), camD = V3(), camR = V3(), camU = V3(), v0 = V3(), v1 = V3(), v2 = V3(), ZERO = V3(0, 0, 0), mLook = new THREE.Matrix4();
    const aim = (obj, dir) => { if (dir.lengthSq() < 1e-8) return; mLook.lookAt(dir, ZERO, UP); obj.quaternion.setFromRotationMatrix(mLook); };
    let clock = 0;
    const hT1 = V3(), hT2 = V3(), FEEDS = [FLOWER.clone(), M1.clone(), WO(A.stopBacklit.flower), M3.clone()];      // the four flowers of the round, where the neck reaches
    const frame = (u) => { const uu = clamp(u, 0, 0.999); path.tangentAt(uu, tan); bX.crossVectors(tan, UP).normalize(); bY.crossVectors(bX, tan); return path.pointAt(uu, pp); };
    // the rival leads the chase 4.9 m ahead, drawing a corkscrew wide enough to show its streamers side-on
    const chaseMid = (u, out) => out.copy(frame(u + (4.9 + 0.4 * Math.sin(u * 90)) / L)).addScaledVector(bY, 0.1);
    const chasePos = (u, out) => { chaseMid(u, out); const th = u * 300 + 1.868; return out.addScaledVector(bX, Math.cos(th) * 1.5 + 0.3 * Math.sin(clock * 2.9)).addScaledVector(bY, Math.sin(th) * 0.6 + 0.2 * Math.sin(clock * 3.7 + 1.0)); };
    const perch = V3(FLOWER.x + 6.5, FLOWER.y + 7.5, FLOWER.z - 3), flare = frame(U.flare).clone().addScaledVector(tan, 3.9).add(V3(0.5, 0.7, 0)), chase0 = chasePos(U.chase0, V3()), chase1 = chasePos(U.chase1, V3());
    const lat = V3().crossVectors(naveDir, UP).normalize(), racketAt = [FU.clone().add(V3(-1.9, -0.7, 1.4)), FU.clone().add(V3(1.5, 0.7, 1.6))];
    const RK = fuchsiaFirst ? [[0.30, -0.28, 4.6], [0.80, 0.06, 6.0]] : [[0.72, 0.37, 6.2], [0.84, 0.04, 7.0]];      // where the racket-tails hover at stop one: place in the frame, range
    // a bird set out from the eye: sx, sy = its place in the frame (fractions of the half width and half height), d = its range;
    // fwd and upH (right / up / away, about our line of sight to it) = where it heads and where its back points
    const bF = V3(), bU = V3(), bS = V3(), eD = V3(), eR = V3(), eU = V3(), mB = new THREE.Matrix4();
    const fX = V3(), fY = V3(), fZ = V3(), fF = V3();
    const faceFans = (f) => {
      f.m.visible = f.g.visible; if (!f.m.visible) return;
      fF.set(0, 0, 1).applyQuaternion(f.g.quaternion); fX.crossVectors(camD, fF); const k = fX.length();
      if (k < 0.2) { f.m.visible = false; return; }
      fX.multiplyScalar(1 / k); fZ.copy(camD).multiplyScalar(-1); fY.crossVectors(fZ, fX);
      mB.makeBasis(fX, fY, fZ); f.m.quaternion.setFromRotationMatrix(mB);
      f.m.position.copy(f.g.position).addScaledVector(fF, f.size * 0.1).addScaledVector(camD, f.size * 0.2); f.fan.x = f.a * sstep(0.2, 0.75, k);
    };
    const poseFromEye = (g, sx, sy, d, hx, hy, f, uh) => {
      g.position.copy(camP).addScaledVector(camD, d).addScaledVector(camR, sx * hx * d).addScaledVector(camU, sy * hy * d);
      eD.copy(g.position).sub(camP).normalize(); eR.crossVectors(eD, camU).normalize(); eU.crossVectors(eR, eD);
      bF.set(0, 0, 0).addScaledVector(eR, f[0]).addScaledVector(eU, f[1]).addScaledVector(eD, f[2]).normalize();
      bU.set(0, 0, 0).addScaledVector(eR, uh[0]).addScaledVector(eU, uh[1]).addScaledVector(eD, uh[2]); bU.addScaledVector(bF, -bU.dot(bF));
      if (bU.lengthSq() < 1e-6) bU.copy(camU); bU.normalize(); bS.crossVectors(bU, bF);
      mB.makeBasis(bS, bU, bF); g.quaternion.setFromRotationMatrix(mB);
    };
    // the gaze under the crown: up the line of the nave to its window, never steeper than fifty degrees
    const q0 = V3(), aimV = V3(), chaseV = V3();
    const upAim = (time, u) => { path.pointAt(clamp(u, 0, 1), q0); const dx = PS.x - q0.x, dy = PS.y - q0.y, dz = PS.z - q0.z, h = Math.max(1e-3, Math.hypot(dx, dz)), e = Math.min(Math.atan2(dy, h) - 0.1, 0.87); return aimV.set(q0.x + dx / h * 40 * Math.cos(e), q0.y + 40 * Math.sin(e), q0.z + dz / h * 40 * Math.cos(e)); };
    const pois = [
      { at: crownC, from: 0.0, to: 0.10, weight: 0.3 },
      { at: FLOWER.clone().addScaledVector(fAxis, 0.3), from: 0.07, to: 0.142, weight: 0.88 },
      { at: V3(-38, 4, -120), from: 0.058, to: 0.094, weight: 0.14 },                           // a glance left as the vine comes up, so the right-hand trunk keeps to the edge
      { at: (time, u) => chaseMid(u, chaseV), from: 0.146, to: 0.30, weight: 0.7, fade: 0.14 },
      { at: V3(14, 12, -204), from: 0.146, to: 0.196, weight: 0.3 },                             // a glance right at the old tree as the chase begins: the near trunk keeps to the left edge
      { at: crownC.clone().add(V3(0, -4, 0)), from: 0.275, to: 0.385, weight: 0.4 },
      { at: WO(A.stopSun.pivot).lerp(M1, 0.6), from: 0.372, to: 0.42, weight: 0.85 },
      { at: Tt(0, 36, 10), from: 0.42, to: 0.575, weight: 0.38 },
      { at: V3(BEAR.x, BEAR.y + 1.5, BEAR.z), from: 0.405, to: 0.475, weight: 0.6 },             // the bear on its crag, whole in the frame
      { at: five, from: 0.56, to: 0.614, weight: 0.85 },
      // out over the ravine: the snag and its young tree across the mist, then the swordbill at its bell with the fall beyond,
      // on toward the fall as we pass it, and round to the old tree's western skirts lit from behind us
      { at: V3(FEED.x + 3, 4.5, FEED.z + 5), from: 0.596, to: 0.668, weight: 0.75 },
      { at: V3(FEED_C.x - 28.98, 1.8, FEED_C.z - 7.76), from: 0.645, to: 0.728, weight: 0.9 },
      { at: V3(-113, 5, -183), from: 0.708, to: 0.742, weight: 0.5, fade: 0.4 },
      { at: V3(0, 8, -204), from: 0.728, to: 0.80, weight: 0.75 },
      { at: V3(-18, -5, -202), from: 0.775, to: 0.836, weight: 0.8 },
      { at: upAim, from: 0.802, to: 0.894, weight: 0.86 },
      { at: M3.clone().addScaledVector(ax3, -1.6), from: 0.886, to: 0.916, weight: 0.85, fade: 0.25 },
      { at: upAim, from: 0.908, to: 0.975, weight: 0.88, fade: 0.1 },
    ];
    const hover = (h, time, pos, face, e) => { h.g.position.copy(pos); h.g.position.y += 0.12 * Math.sin(time * 2.3 + h.ph); v2.copy(face).sub(pos); v2.y = 0; v2.normalize(); v2.y = 0.8; aim(h.g, v2); h.anim.y = time * 7 + h.ph; };
    const fly = (h, time, pos, dir) => { h.g.position.copy(pos); aim(h.g, dir); h.anim.y = time * 11 + h.ph; };
    const flap = (f, time, hz, amp) => { f.anim.x = Math.sin(time * 6.2832 * hz + f.ph) * amp + 0.15; f.anim.y = time * 3 + f.ph; };

    scene.userData.heroBells = hero.bells;                 // for offline checks of what each frame holds
    // THE LINE'S CLEAR AIR OF EVERY BELL THE PART HANDS OUT, measured once here (not in it: the far stand-ins, a bell below full size, the drops, the
    // wood, a wind set stronger than the part's). It moves, cuts and hides nothing: it counts, warns once, and brings the tree's matrices up to date
    // (its one write to drawn things: to the first frame's own values).
    // The part draws a bell's vertex turned about the bell's pivot (its instance's place) by one angle about a level axis, both made of the two
    // components of its swing law (swingAA), and hands out with each bell a bound of that angle whatever the clock: bells[i].swing, 3.2 times the
    // bell's amplitude (each component is at most 0.9 of the amplitude and the gust adds at most 1.9 of it along the wind, as the part is built: this
    // world leaves the part's wind as it is). A vertex turned by no more than that angle, about whatever axis through the pivot, stays on its own
    // sphere about the pivot (its lever: its distance from the pivot at rest) within that angle of where it rests: a cap of the sphere. The least
    // distance from a point of the line's table to that cap is had in closed form, for every vertex of the bell's own mesh (the instance is found by its
    // pivot; the skin is taken at its vertices, at full size). Between two neighbours of the table that both stand c off a cap the line's straight piece
    // stands at least sqrt(c * c - gap * gap / 4) off it, and the line itself is taken to stand no further off that piece than the table bows there
    // (bw: how far a point of the table stands off the straight piece between its two neighbours, a stretch twice as long; a point takes the most of
    // its own and its two neighbours'). A bell's least is the least of that figure over its vertices and the points of the table near it, and a bell is
    // counted where its least is under BELL_AIR. The three flowers the route stops at (the part's stopSun, stopBacklit and stopThroat: bells[i].stop
    // names each) are held to STOP_AIR: a flower the route stops at may stand inside 2.0 m by the design, never inside 1.0 m at the bound of its swing
    // (the owner's floor). Only the points of the table that stand within the longest lever a bell of its length can have (unit), and what it must keep, of a
    // bell's pivot are looked at (found by hopping, as the wings' law hops), and the build hands back after the table's bows, after the meshes'
    // levers, after each mesh's edges, after every bell measured and every 512 vertices of one. A stop flower is counted where its least is under
    // STOP_AIR; a bell near the line in no mesh at its pivot, any bell whose swing, length or reach is not a number, and a bell near the line
    // whose mesh gives the facet term no number (corners that are not whole triangles, an edge that is not a number), apart (unseen). 3.2 is a
    // bound by this sum: 0.9 * sqrt(2) + 1.9 * 0.958 (the gust at the part's own strength; 0.958: the wind's level part) = 3.09.
    {
      const BELL_AIR = 2.0, STOP_AIR = 1.0, h2 = 0.25 * gap * gap, bw = new Float64Array(nL + 1), skins = [], under = [], unseen = [], near = [], O = V3(), v = V3(), m4 = new THREE.Matrix4();
      let bow = 0, unit = 0;                                 // bow: the most of bw; unit: the longest lever of any bell's mesh, for a bell of length 1
      for (let j = 1; j < nL; j++) {
        const ax = lx[j + 1] - lx[j - 1], ay = ly[j + 1] - ly[j - 1], az = lz[j + 1] - lz[j - 1], bx = lx[j] - lx[j - 1], by = ly[j] - ly[j - 1], bz = lz[j] - lz[j - 1];
        const t = (ax * bx + ay * by + az * bz) / (ax * ax + ay * ay + az * az), ex = bx - t * ax, ey = by - t * ay, ez = bz - t * az;
        bw[j] = Math.sqrt(ex * ex + ey * ey + ez * ez); if (bw[j] > bow) bow = bw[j];
      }
      await ctx.yield();
      hero.object.updateWorldMatrix(false, true);
      hero.object.traverse((o) => {
        if (!o.isInstancedMesh || !o.geometry.attributes.aSw) return;
        const q = o.geometry.attributes.position, s = o.matrixWorld.getMaxScaleOnAxis();
        for (let k = 0; k < q.count; k++) unit = Math.max(unit, s * Math.hypot(q.getX(k), q.getY(k), q.getZ(k)));
        skins.push(o);
      });
      await ctx.yield();
      // THE FACETS: a bell swings as one stiff body, and the point X of a facet nearest a point P of the line has a corner V with XV square to PX and no
      // longer than f = fac * the bell's length (fac: the longest edge of any bell's mesh over sqrt(3)). With f taken off under the root below, and the
      // skip and the reach widened by it, the least bounds a full-size bell's whole skin. A MESH THAT GIVES THE FACET TERM NO NUMBER (the count of
      // its corners, its index's or, where it has no index, its position's, is nought or no multiple of three, so that a corner has no triangle to
      // ask for an edge; or an edge of it is not a finite number) gives `fac` nothing, so `fac` stays a number: the mesh is kept in `odd`, and a
      // bell near the line that is found in it is counted with the unseen, with its reason. While `odd` holds a mesh, a bell is taken for near
      // with the widest facet term a mesh can have (no edge is longer than twice the longest lever, `unit`), so that no bell of such a mesh is
      // passed over as far for want of its own edges. A bell whose reach is itself not a finite number (a vertex that is not one leaves
      // the longest lever, `unit`, none; so does a mesh's scale, or the line's bow or gap, that is not one) cannot be told far from the line and is counted with the unseen too; and a point of the line is
      // told far only where its distance is a number that says so.
      let fac = 0; const odd = new Set();
      for (const o of skins) {
        const q = o.geometry.attributes.position, s = o.matrixWorld.getMaxScaleOnAxis(), ix = o.geometry.index, nc = (ix || q).count, at = (p, k) => p.fromBufferAttribute(q, ix ? ix.getX(k) : k);
        let m = nc > 0 && nc % 3 === 0 ? 0 : NaN;             // m: this mesh's longest edge over sqrt(3); not a number where it has none to give
        for (let k = 0; k < nc && !Number.isNaN(m); k++) m = Math.max(m, s * at(O, k).distanceTo(at(v, k - k % 3 + (k + 1) % 3)) / Math.sqrt(3));
        if (Number.isFinite(m)) fac = Math.max(fac, m); else odd.add(o);
        await ctx.yield();
      }
      for (let n = 0; n < hero.bells.length; n++) {
        const b = hero.bells[n], floor = b.stop === 'stopSun' || b.stop === 'stopBacklit' || b.stop === 'stopThroat' ? STOP_AIR : BELL_AIR;
        if (![b.swing, b.length].every(Number.isFinite)) { unseen.push(n + ' (swing or length not a number)'); continue; }
        const f = fac * b.length, need = Math.hypot(floor + bow, 0.5 * gap, f), reach = unit * b.length + (odd.size ? Math.hypot(floor + bow, 0.5 * gap, 2 * unit * b.length / Math.sqrt(3)) : need);
        if (!Number.isFinite(reach)) { unseen.push(n + ' (its reach is not a finite number: a vertex of a bell\'s mesh, a mesh\'s scale, or the line\'s bow or gap is not one)'); continue; }
        O.copy(b.position).add(ORIGIN); near.length = 0;
        for (let j = 0; j <= nL; j++) { const x = lx[j] - O.x, y = ly[j] - O.y, z = lz[j] - O.z, d = Math.sqrt(x * x + y * y + z * z); if (!(d >= reach)) near.push(j); else j += Math.floor((d - reach) / gap); }
        if (!near.length) continue;
        let skin = null;                                     // the bell's mesh and, in m4, its instance's matrix in the world
        for (const o of skins) { for (let i = 0; i < o.count && !skin; i++) { o.getMatrixAt(i, m4); m4.premultiply(o.matrixWorld); if (Math.hypot(m4.elements[12] - O.x, m4.elements[13] - O.y, m4.elements[14] - O.z) < 1e-3) skin = o; } if (skin) break; }
        if (!skin) { unseen.push(n); continue; }
        if (odd.has(skin)) { unseen.push(n + ' (its mesh\'s corners are not whole triangles, or an edge of it is not a number)'); continue; }
        O.set(m4.elements[12], m4.elements[13], m4.elements[14]);
        const Q = new Float64Array(near.length * 5), q = skin.geometry.attributes.position, cs = Math.cos(b.swing), sn = Math.sin(b.swing);      // Q: each near point from the pivot, its distance, its bow
        for (let i = 0; i < near.length; i++) { const j = near[i], x = lx[j] - O.x, y = ly[j] - O.y, z = lz[j] - O.z; Q[i * 5] = x; Q[i * 5 + 1] = y; Q[i * 5 + 2] = z; Q[i * 5 + 3] = Math.sqrt(x * x + y * y + z * z); Q[i * 5 + 4] = Math.max(bw[j > 0 ? j - 1 : j], bw[j], bw[j < nL ? j + 1 : j]); }
        let e = floor, C = need;                             // e: the bell's least, where under its floor; C: a point that stands C or more off a cap cannot bring e down, nor can the points the hop passes over
        for (let k = 0; k < q.count; k++) {
          if ((k & 511) === 511) await ctx.yield();
          v.fromBufferAttribute(q, k).applyMatrix4(m4).sub(O);
          const r = v.length(); if (r > 0) v.multiplyScalar(1 / r);
          for (let i = 0; i < near.length; i++) {
            const rho = Q[i * 5 + 3], dot = Q[i * 5] * v.x + Q[i * 5 + 1] * v.y + Q[i * 5 + 2] * v.z;      // dot >= rho * cs: the point looks at the cap from within its cone
            const cl = dot >= rho * cs ? Math.abs(rho - r) : Math.sqrt(Math.max(0, rho * rho + r * r - 2 * r * (dot * cs + Math.sqrt(Math.max(0, rho * rho - dot * dot)) * sn)));
            if (cl >= C) { const jn = near[i] + Math.floor((cl - C) / gap); while (i + 1 < near.length && near[i + 1] <= jn) i++; continue; }
            const ej = Math.sqrt(Math.max(0, cl * cl - h2 - f * f)) - Q[i * 5 + 4];
            if (ej < e) { e = ej; C = Math.hypot(e + bow, 0.5 * gap, f); }
          }
        }
        if (e < floor) under.push(`bell ${n}${b.stop ? ' (' + b.stop + ')' : ''}, pivot (${O.x.toFixed(2)}, ${O.y.toFixed(2)}, ${O.z.toFixed(2)}), least ${Math.max(0, e).toFixed(3)} m of the ${floor} m it is to keep`);
        await ctx.yield();
      }
      scene.userData.bellAir = { under: under.length, unseen: unseen.length };
      if (under.length + unseen.length) console.warn(`swordbill-round, seed ${ctx.seed}: of the tree's ${hero.bells.length} bells, able to swing nearer the route's line than each is to keep: ${under.length}${under.length ? ' (' + under.join('; ') + ')' : ''}; not measured (near the line in no mesh at its pivot, or as said): ${unseen.length}${unseen.length ? ' (bell ' + unseen.join(', bell ') + ')' : ''}`);
    }
    { const tg = (o, t) => { if (o) (o.g || o).userData.tag = t; }; tg(rival, 'rival'); tg(fighters[0], 'fighter0'); tg(fighters[1], 'fighter1'); tg(rackets[0], 'racket0'); tg(rackets[1], 'racket1'); tg(cock, 'cock'); tg(bee, 'bee'); tg(bear, 'bear'); tg(feeder, 'feeder'); tg(extras[0], 'extra0'); tg(extras[1], 'extra1'); }
    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: 44, pace, ride: 'none',
      camera: { fov: 62, near: 0.1, far: 3000, lookAhead: 14, sway: 0.8, bank: 1 },
      pois,
      portal: { shape: 'circle', radius: 7, tilt: true, color: LK.portal, glow: 0.8, revealDistance: 150 },
      post: { exposure: LK.exposure, bloom: { strength: LK.bloom, radius: 0.6, threshold: 0.9 },
        grade: { saturation: LK.sat, contrast: 1.05, tint: LK.tint, shadowTint: LK.shadow, vignette: 0.28, grain: 0.02 } },
      update(dt, time, camera, u) {
        SU.uTime.value = time; clock = time;
        if (ctx.renderer) ctx.renderer.getDrawingBufferSize(uRes.value);
        camera.getWorldPosition(camP); camera.getWorldDirection(camD);
        { const me = camera.matrixWorld.elements; camR.set(me[0], me[1], me[2]).normalize(); camU.set(me[4], me[5], me[6]).normalize(); }
        sky.update(dt, time, camera); hero.update(dt, time, camera); fall.update(dt, time, camera);
        // from the entry the tree is two hundred metres off: its petals carry more of the light until we are among the trunks,
        // and the far veils of mist thin out along the sight of it
        // (by the eye's distance from the crown: over 173 m in full, none within 104 m)
        { const far = sstep(104, 173, camP.distanceTo(crownC)); HU.uGlow.value *= 1 + 0.6 * far; HU.uFogCut.value = 0.3 - 0.14 * far; }
        // the mist by where the eye is, a rule in space: it thins as we come out among the trunks (north of z -56), is thinnest over
        // the ravine and round the fall and the young tree, so that the cliffs, the water and the far crowns stand clear, and closes
        // in under the old tree's crown and up its nave, where the ravine's updraught pours it. Only the density values move
        const openAir = Math.max(sstep(157, 195, -camP.z), clearAir(camP.x, camP.z));
        const thinK = 1 - (0.34 * sstep(56, 96, -camP.z) + 0.22 * openAir) * sstep(17, 30, Math.hypot(camP.x - crownC.x, camP.z - crownC.z));
        SU.uFogP.value.x = dens * thinK; SU.uFogP.value.z = lowDens * (0.1 + 0.9 * thinK); scene.fog.density = dens * thinK;
        uEntry.value = Math.max(1 - sstep(0.08, 0.2, u), (1 - thinK) * 1.5); uVeil.value = 1 - sstep(0.03, 0.085, u);
        // a flock whose every bird the kit has already faded out (it has not yet come onto its crossing, or has left it) is not drawn
        if (flock) { flock.update(dt, time, camera, u); flock.object.visible = onRoute(flock); }
        // the stalks of the limb's moss are under a metre tall: more than 48 m from the stretch of limb they grow on (a rule in
        // world coordinates) they are finer than a pixel and are not drawn; nor are they when that whole
        // stretch of limb lies behind the eye
        if (wandMesh) {
          v0.copy(camP).sub(wandA); const k = clamp(v0.dot(wandD) / wandL2, 0, 1), ahead = Math.max(-v0.dot(camD), wandD.dot(camD) - v0.dot(camD));
          wandMesh.visible = ahead > -6 && v0.addScaledVector(wandD, -k).length() < 48;
        }
        { const one = u < 0.15, two = u > 0.45 && u < 0.8; for (const m of plantSets[0]) m.visible = one; for (const m of plantSets[1]) m.visible = two; }
        if (burst) { burst.update(dt, time, camera, u); burst.object.visible = onRoute(burst); }
        // our own head and wings: out of sight while the world is only seen through a portal, easing in as we enter. They move by
        // rules of the flight itself, the same everywhere: the pace (the head sinks in a dash and rises as we slow; the wing fans sweep
        // back or open out), the bend of the line just ahead (the head swings and banks into every turn, and tips with a climb or a
        // dive), and a flower within reach ahead of us (the neck reaches: the bill lifts and slides forward into it, a drop running down it).
        // hx, hy = half the frame's width and height one metre ahead: the head and the fans are set out from them
        const e = sstep(0, 0.012, u), pe = camera.projectionMatrix.elements, hx = 1 / Math.max(0.2, pe[0]), hy = 1 / Math.max(0.2, pe[5]), ky = hy / 0.6009;
        mount.visible = u > 0; mount.matrix.copy(camera.matrixWorld); mount.matrixWorldNeedsUpdate = true;
        const pc = pace(u), slow = 1 - sstep(0.45, 0.95, pc), dash = sstep(1.0, 1.6, pc);
        let nearF = 0; for (const F of FEEDS) { v0.copy(F).sub(camP); const d = Math.max(v0.length(), 1e-3); nearF = Math.max(nearF, (1 - sstep(5.5, 12.5, d)) * sstep(0.3, 0.75, v0.dot(camD) / d)); }
        const reach = slow * nearF;
        path.tangentAt(clamp(u - 0.004, 0, 0.999), hT1); path.tangentAt(clamp(u + 0.011, 0, 0.999), hT2);
        const kY = clamp(Math.atan2(hT1.x * hT2.z - hT1.z * hT2.x, hT1.x * hT2.x + hT1.z * hT2.z) / 0.55, -1, 1) * (1 - 0.6 * reach), kP = clamp((hT2.y - hT1.y) / 0.35, -1, 1) * (1 - reach);
        // the pose: where the bill's root lies below and ahead of the eye, and how the bill is pitched. In flight we look down its
        // length from just behind the crown (it is foreshortened to a few percent of the frame); at a flower it comes up to the centre
        let py = lerp(-0.462, -0.468, dash), pz = -0.64, pr = lerp(-21.3, -22.5, dash);
        py = lerp(py, -0.48, slow); pz = lerp(pz, -0.72, slow); pr = lerp(pr, -16.5, slow);
        py = lerp(py, -0.54, reach); pz = lerp(pz, -1.0, reach); pr = lerp(pr, 3, reach);
        bill.position.set(0.05 * kY + 0.003 * Math.sin(time * 1.3), (py - 0.4 * (1 - e)) * ky - 0.012 * Math.abs(kY) + 0.004 * Math.sin(time * 1.9), pz);
        bill.rotation.set((pr + 2.2 * kP + 0.25 * Math.sin(time * 0.9)) * 0.017453, -0.2 * kY + 0.006 * Math.sin(time * 0.7), -0.3 * kY);
        bill.scale.setScalar(clamp(hx / 1.068 * 1.45, 0.6, 1));                                  // a smaller head in a tall, narrow frame
        const dt01 = 1 - ((time * 0.3) % 1), ds = sstep(0.25, 0.6, reach) * Math.sin(Math.min(1, dt01 * 6) * 1.5708);
        drop.position.set(0, billY(dt01) + billR(dt01) * 1.1 + 0.011, -BILL_L * dt01); drop.scale.setScalar(Math.max(0.001, ds * 0.8));
        for (let k = 0; k < 2; k++) {
          const f = myFans[k], sg = k ? 1 : -1, a = 0.42 + 0.2 * slow - 0.1 * dash - 0.09 * kY * sg, R = (0.62 + 0.08 * slow - 0.07 * dash) * Math.min(hx, hy * 1.5) * 0.8;
          f.position.set(sg * (hx * 0.8 + 0.06 * R), -hy * 0.8 - 0.05 * R, -0.8);
          f.rotation.z = sg > 0 ? Math.PI - a : a; f.scale.set(R, R * (sg > 0 ? -1 : 1), 1);
          f.material.uniforms.uFan.value.x = e * (0.42 + 0.05 * slow); f.material.uniforms.uFan.value.y = 0.62 + 0.53 * slow - 0.14 * dash;
        }
        // the rival: waits above the flower, drops and flares in our face, leads the chase, peels off; crosses the portal at the end
        const scare = eagle ? sstep(0.505, 0.525, u) : 0;
        if (u < 0.118) { hover(rival, time, perch, FLOWER); rival.g.visible = true; }
        else if (u < U.chase0) {
          const k = (u - 0.118) / (U.chase0 - 0.118); rival.g.visible = true;
          v2.copy(camP).addScaledVector(camD, 3.9).addScaledVector(camR, 0.3 * hx * 3.9).addScaledVector(camU, 0.06 * hy * 3.9); flare.copy(v2);
          if (k < 0.72) { v0.copy(perch).lerp(flare, sstep(0, 0.5, k)); v0.y += 2.5 * Math.sin(Math.min(1, k / 0.5) * Math.PI); hover(rival, time, v0, camP); }
          else { v0.copy(flare).lerp(chase0, sstep(0.72, 1, k)); fly(rival, time, v0, v1.copy(chase0).sub(flare)); }
        } else if (u < U.chase1) { chasePos(u, v0); chasePos(u + 0.0025, v1); rival.g.visible = true; fly(rival, time, v0, v1.sub(v0)); }
        // the peel away: it starts from the chase's own moving place and adds k * k of the peel's reach, so the bird leaves with no jump; fly is given the direction of
        // travel, which is the chase's step over 0.0025 of u plus the peel's change over that same step: 0.1 k = 2 k * 0.0025 / 0.05 (to be kept in step with those two figures)
        else if (u < 0.35) { const k = (u - U.chase1) / 0.05; v1.set(24, 17, -34); chasePos(u, v0); chasePos(u + 0.0025, v2).sub(v0).addScaledVector(v1, 0.1 * k); v0.addScaledVector(v1, k * k); rival.g.visible = true; fly(rival, time, v0, v2); }
        else if (u < 0.92) rival.g.visible = false;
        else {
          // 14 m ahead up the nave, crossing the opening from left to right
          const k = clamp((u - U.last0) / 0.05, -0.4, 1.4); path.pointAt(Math.min(u, 0.999), v0); v0.addScaledVector(naveDir, 9).addScaledVector(lat, -5.5 + 11 * k); v0.y += 1.2 * Math.sin(k * 3.1);
          rival.g.visible = u < 0.992; fly(rival, time, v0, v1.copy(lat).addScaledVector(UP, 0.35 * Math.cos(k * 3.1)));
        }
        // two sylphs dogfighting across our bow on the far side of the tree: they hold 11 m ahead of the eye, high in the frame
        const fw = bellW(u, U.fight0, U.fight1, 0.03) * (1 - scare);
        for (let k = 0; k < 2; k++) {
          const f = fighters[k]; f.g.visible = fw > 0.01;
          if (!f.g.visible) continue;
          const a = time * 2.6 + u * 150 + k * Math.PI, out = 1 - fw;
          v0.copy(camP).addScaledVector(camD, 11 + 1.5 * Math.sin(a * 0.5)).addScaledVector(camR, Math.cos(a) * 2.7 - out * 12).addScaledVector(camU, Math.sin(a) * 1.2 + 1.7 + out * 13);
          v1.set(0, 0, 0).addScaledVector(camR, -Math.sin(a) * 2.7).addScaledVector(camU, Math.cos(a) * 1.2).addScaledVector(camD, Math.cos(a * 0.5) * 0.75);
          fly(f, time, v0, v1);
        }
        // racket-tails working the fuchsia: hover, dart, hover
        // as we pass they leave it and come with us to the vine, where they hover beside the flower through stop one, high in the
        // right of the frame, darting from station to station; the rival's attack scatters them
        { const w = sstep(0.05, 0.088, u) * (1 - sstep(0.15, 0.165, u)), near = sstep(0.072, 0.1, u), gone = sstep(0.1265, 0.143, u);
          for (let k = 0; k < 2; k++) {
            const r = rackets[k], q = RK[k], d = Math.sin(time * 0.5 + k * 2.1), d2 = Math.sin(time * 0.37 + k);
            v0.copy(racketAt[k]); v0.x += 0.7 * d * d * d; v0.y += 0.35 * d2 * d2 * d2;
            if (w > 0) {
              const e1 = Math.sin(time * 1.1 + k * 2.4), e2 = Math.sin(time * 0.83 + k * 1.7 + 1.0), dd = lerp(q[2] + 6.5, q[2], near) + 4 * gone;
              const sx = q[0] - 0.3 * (1 - near) + 0.06 * e1 * e1 * e1 + (1.0 + 0.3 * k) * gone, sy = q[1] + 0.07 * e2 * e2 * e2 + 0.9 * gone;
              v1.copy(camP).addScaledVector(camD, dd).addScaledVector(camR, sx * hx * dd).addScaledVector(camU, sy * hy * dd);
              v0.lerp(v1, w);
            }
            hover(r, time, v0, w > 0.5 ? FLOWER : FU);
          } }
        // the cock-of-the-rock bursts up out of the void on our right, 27 m off at its nearest, wheels and climbs away to the right:
        // we see its back, the scarlet disc of its crest, and both black wings with their grey tertials in mid-beat
        { const k = (u - U.cock0) / (U.cock1 - U.cock0); cock.g.visible = k > 0 && k < 1;
          if (cock.g.visible) {
            const k1 = sstep(0, 0.55, k), k2 = sstep(0.55, 1, k);
            poseFromEye(cock.g, 1.25 - 0.78 * k1 + 0.8 * k2, -0.85 + 0.63 * k1 + 1.0 * k2 + 0.03 * Math.sin(time * 2.2), 46 - 19.5 * k1 + 4 * k2, hx, hy, [-0.95 + 1.6 * k2, 0.25 + 0.3 * k2, 0.15 + 0.2 * k2], [0.0, 0.78, -0.62]);
            flap(cock, time, 3.2, 0.8);
          } }
        if (pair) for (let k = 0; k < 2; k++) { const c = ((time * 8.5 + k * 9 + 30) % 110) - 55; pair[k].g.position.set(c, 8 + k * 2.5 + Math.sin(time * 1.1 + k), -42 - k * 5 + c * 0.25); aim(pair[k].g, v1.set(1, 0, 0.25)); flap(pair[k], time, 2.4, 0.7); }
        if (eagle) {
          // the eagle stoops in from the upper left with its underside to us, pulls up and flares across our bow 36 m away
          // (u 0.55: wings and tail spread, head up), then tips over and slides out low on the right
          const k = (u - U.eagle0) / (U.eagle1 - U.eagle0); eagle.g.visible = k > 0 && k < 1;
          if (eagle.g.visible) {
            const k1 = sstep(0, 0.62, k), kf = sstep(0.34, 0.62, k), k2 = sstep(0.66, 1, k), w = 0.04 * Math.sin(time * 0.9);
            poseFromEye(eagle.g, -0.25 + 0.73 * k1 + 1.8 * k2, 0.9 - 1.28 * k1 - 0.8 * k2, 96 - 60 * k1 - 4 * k2, hx, hy,
              [lerp(lerp(0.75, 0.15, kf), 0.85, k2), lerp(lerp(-0.6, 0.8, kf), -0.45, k2), lerp(lerp(-0.1, -0.5, kf), 0.2, k2)], [lerp(0.1, 0.0, kf) - 0.2 * k2 + w, lerp(0.2, 0.45, kf), lerp(0.95, 0.85, kf)]);
            eagle.anim.x = 0.1 + (0.05 + 0.07 * kf * (1 - k2)) * Math.sin(time * 2.2); eagle.anim.y = time * 2;
            // its shadow is thrown down-sun on the head wall and the ferns
            SU.uEagle.value.set(eagle.g.position.x, eagle.g.position.y, eagle.g.position.z, sstep(0, 0.1, k) * (1 - sstep(0.85, 1, k)));
            SU.uEagleR.value.set(1, 0, 0).applyQuaternion(eagle.g.quaternion);
          } else SU.uEagle.value.w = 0;
        }
        // the other swordbill: it hangs under the young tree's great bell with its bill up the corolla, dipping and drawing back
        feeder.g.visible = u > U.feed0 && u < U.feed1;
        if (feeder.g.visible) {
          hero.feederMouth(time, v0, v1); v0.add(ORIGIN);                                          // the bell's mouth and the way it hangs just now
          bF.copy(v1).multiplyScalar(-1).addScaledVector(FEED_LEAN, 0.33).normalize();
          bU.copy(FEED_LEAN).multiplyScalar(-1); bU.addScaledVector(bF, -bU.dot(bF)).normalize(); bS.crossVectors(bU, bF);
          mB.makeBasis(bS, bU, bF); feeder.g.quaternion.setFromRotationMatrix(mB);
          feeder.g.position.copy(v0).addScaledVector(v1, -(1.2 + 0.28 * Math.sin(time * 0.9))).addScaledVector(bF, -SW * 1.565).addScaledVector(bU, -SW * 0.13);
          feeder.g.position.y += 0.05 * Math.sin(time * 2.1 + 1.0);
          feeder.anim.y = time * 7 + feeder.ph;
        }
        faceFans(feederFans);
        // two sylphs: one comes with us through the chase, low on our right; both hold station ahead as we leave the old tree for
        // the ravine; on the way back they cross our bow, one hunting the other
        { const e0 = extras[0], e1 = extras[1], ko = (u - U.out0) / (U.out1 - U.out0), kb = (u - U.back0) / (U.back1 - U.back0);
          e0.g.visible = e1.g.visible = false;
          if (u > 0.15 && u < 0.302) {
            const kin = 1 - sstep(0.15, 0.158, u), kout = sstep(0.285, 0.302, u);
            poseFromEye(e0.g, -0.36 + 0.06 * Math.sin(u * 40) - 1.5 * kin, 0.02 + 0.07 * Math.sin(u * 55 + 1) + 0.03 * Math.sin(time * 1.7) + 1.1 * kout, 6.3 + 0.5 * Math.sin(u * 30) + 9 * kout, hx, hy, [0.82, 0.08 + 0.5 * kout, 0.56], [0, 1, 0]);
            e0.g.visible = true; e0.anim.y = time * 11 + e0.ph;
          } else if (ko > 0 && ko < 1) {
            const kin = 1 - sstep(0, 0.1, ko), kout = sstep(0.82, 1, ko);
            const turn = sstep(0.3, 0.55, ko);
            poseFromEye(e0.g, lerp(-0.44, -0.18, ko) - 1.0 * kin, lerp(0.0, 0.12, ko) + 0.03 * Math.sin(time * 1.3) + 0.7 * kout, lerp(4.4, 6.5, ko) + 16 * kout, hx, hy, [lerp(-0.45, 0.8, turn), lerp(0.45, 0.1, turn) + kout, lerp(0.75, 0.55, turn) + kout], [0, 1, 0]);
            poseFromEye(e1.g, lerp(0.06, 0.2, ko) - 1.4 * kin, lerp(0.34, 0.22, ko) + 0.03 * Math.sin(time * 1.1 + 2) + 0.8 * kout, lerp(7.2, 9.5, ko) + 16 * kout, hx, hy, [-0.85 + 1.6 * kout, -0.05 + kout, 0.3 + kout], [0, 1, 0]);
            e0.g.visible = e1.g.visible = true; e0.anim.y = time * 7 + e0.ph; e1.anim.y = time * 7 + e1.ph;
          } else if (u > U.back0 && u < U.back2) {
            // as before up to the middle of the frame; then they slow, the hunted one a little left of centre and the hunter behind it,
            // both below the ring, and climb away toward it (s1: the slowing, s2: the leaving)
            const k0 = Math.min(kb, 0.6), k1 = Math.min(kb - 0.2, 0.52), s1 = sstep(0.6, 1.0, kb), s1b = sstep(0.72, 1.06, kb), s2 = sstep(1.0, 1.26, kb);
            poseFromEye(e0.g, lerp(1.3, -1.3, k0) - 0.24 * s1 + 0.12 * s2, 0.12 + 0.15 * Math.sin(k0 * 6.3) + 0.34 * s2, 4.6 + 2.6 * s1 + 34 * s2 * s2, hx, hy, [-1 + 0.8 * s2, 0.14 * Math.cos(k0 * 6.3) + 0.2 * s1 + 0.4 * s2, 0.15 + 0.35 * s1 + 0.9 * s2], [0, 1, 0]);
            poseFromEye(e1.g, lerp(1.3, -1.3, k1) - 0.3 * s1b + 0.1 * s2, -0.1 + 0.15 * Math.sin(k1 * 6.3 - 1.2) + 0.1 * s1b + 0.4 * s2, 5.7 + 2.4 * s1b + 34 * s2 * s2, hx, hy, [-1 + 0.8 * s2, 0.14 * Math.cos(k1 * 6.3 - 1.2) + 0.2 * s1b + 0.4 * s2, 0.1 + 0.35 * s1b + 0.9 * s2], [0, 1, 0]);
            e0.g.visible = e1.g.visible = true; e0.anim.y = time * 11 + e0.ph; e1.anim.y = time * 11 + e1.ph;
          } }
        faceFans(extraFans[0]); faceFans(extraFans[1]);
        // the bumblebee drones past the sunlit bell: 2.6 m off the eye, in from the right
        { const k = (u - U.bee0) / (U.bee1 - U.bee0); bee.visible = k > 0 && k < 1;
          if (bee.visible) { v0.copy(camP).addScaledVector(camD, 2.6).addScaledVector(camR, hx * 2.6 * (0.99 - 0.61 * k)).addScaledVector(camU, 0.05 + 0.1 * Math.sin(time * 3.1) - 0.25 * k); bee.position.copy(v0); aim(bee, v1.copy(camR).multiplyScalar(-1).addScaledVector(camD, 0.3).addScaledVector(camU, -0.1)); } }
        // the bear rakes at the tank in front of it with its near forepaw and turns its head a little; the cub looks about
        { if (bear) { const ua = bear.material.uniforms.uAnim.value; ua.x = -0.24 - 0.2 * Math.sin(time * 1.3) - 0.05 * Math.sin(time * 2.9); ua.w = 0.3 * Math.sin(time * 0.4) + 0.08 * Math.sin(time * 1.7); }
          if (cub) { const ua = cub.material.uniforms.uAnim.value; ua.x = -0.2 - 0.2 * Math.sin(time * 2.1 + 1); ua.w = 0.5 * Math.sin(time * 0.7 + 2); } }
      },
      dispose() { sky.dispose?.(); hero.dispose?.(); },
    };
  },
};
