// ONE DAY UNDER THE OCULUS
// A whole day passes in forty-six seconds inside a Roman rotunda six times life size. The hero part (parts/oculus-day.js)
// is the lighting machine: dome, coffers, floor, the beam and its travelling disc of sun. This file builds the room round
// it: the lower order of the drum (eight bays: door, six exedrae screened by Corinthian columns, the apse), the shrines
// between them, the passage and its two bronze leaves, the portico, the sky in the eye and outside, censers and incense,
// candles, garlands, bay trees, the plants on the rim, swifts, pigeons, leaves on the paving, and the flight itself.
// Azimuths are "door-clockwise seen from above": az -> (x, z) = (-sin az, cos az); the door is at +Z.
// Clock: makeClock keys the sun to the camera's progress u. In the morning the disc runs round the drum ahead of the
// camera (left wall at u 0.08, apse at 0.25, right wall at 0.34), sinking from the lowest coffers to the paving, so the
// rose-gold shaft always stands in the direction of travel and each stretch of the first arc is a different picture.
// It comes to rest just inside the door (april: the wall over it) while the path runs straight at it from the far side
// of the hall, so from u 0.4 to 0.52 the beam stands dead ahead; the path enters its foot at noon (u about 0.55), then
// the sun's azimuth follows the camera round the drum, 30 degrees ahead of it while the climb begins. While we cross,
// the hall light is held down a little (the eye adapts to the disc) and comes back as we turn up the wall. On the climb
// (u 0.5 to 0.66) the gaze is held level and a little inward, with the pigeons in the middle of it.
// Pictures, each with a level horizon (no banking): u 0.08 the reveal; 0.16 a long look up the shaft into the coffers and
// the eye; 0.25 a close pass by a shrine and an exedra (the arc swings out to 107 m) with the lit wall beyond; 0.34 the
// whole hall from the apse; 0.43 to 0.55 the crossing (in the shower look the sun is back by u 0.52); 0.74 to 0.85 the
// day's end, a level look across the dome: the disc has outrun us to the far coffers and lies there as a red-gold lens,
// the copper shaft runs up from it to the eye and the portal, upper right, and eight white pigeons cross the picture at
// u 0.765; then the eye, its evening star and the portal.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import * as INT from '../kit/interior.js';
import { Geo } from '../kit/fauna/common.js';
import { buildHero } from '../parts/oculus-day.js';

const DEG = Math.PI / 180, V3 = THREE.Vector3;
const PALETTE = ['#121620', '#3C4A66', '#B9B2A6', '#FFF6E0', '#D9A441', '#6E2A3A', '#E07A3A'];
const DUR = 46, R_WALL = 130, ORDER_H = 64, EYE_Y = 257.17;
const DUSK_YAW = 28, DUSK_PITCH = 15, LENS_LEAD = 88;     // degrees round the dome from the camera to the evening lens of sun (u 0.77 on)
const LOOKS = ['april', 'night', 'shower', 'summer', 'snow', 'april', 'summer'];
const pz = (az, r, y = 0) => [-Math.sin(az * DEG) * r, y, Math.cos(az * DEG) * r];
// frame standing on the circle of radius r at azimuth az: +Z points at the middle of the hall, +X runs clockwise
function frameAt(az, r, y = 0, out = new THREE.Matrix4()) {
  const s = Math.sin(az * DEG), c = Math.cos(az * DEG);
  return out.makeBasis(new V3(-c, 0, -s), new V3(0, 1, 0), new V3(s, 0, -c)).setPosition(-s * r, y, c * r);
}

// ---------------------------------------------------------------------------------------------------------------
// triangle soup with a transform, flat or supplied normals, vertex colours and an optional shade function (baked AO)
// ---------------------------------------------------------------------------------------------------------------
// a long plain array into a Float32Array, a slice at a time, handing the page back between slices
async function toF32(ctx, arr) {
  const out = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i += 131072) { out.set(arr.slice(i, i + 131072), i); await ctx.yield(); }
  return out;
}
function makeSoup() {
  const P = [], N = [], C = [], m = new THREE.Matrix4(), nm = new THREE.Matrix3();
  const a = new V3(), b = new V3(), c = new V3(), n = new V3(), e1 = new V3(), e2 = new V3(), vn = new V3();
  let shade = null;
  const put = (p, nn, col, t) => { const k = shade ? t * shade(p.x, p.y, p.z) : t; P.push(p.x, p.y, p.z); N.push(nn.x, nn.y, nn.z); C.push(col.r * k, col.g * k, col.b * k); };
  const S = {
    get triangles() { return P.length / 9; },
    at(mat) { if (mat) m.copy(mat); else m.identity(); nm.getNormalMatrix(m); return S; },
    shade(fn) { shade = fn || null; return S; },
    // nfn(x, y, z, out): smooth normal at a world point (its sign is matched to the winding)
    tri(p0, p1, p2, col, t = 1, nfn) {
      a.fromArray(p0).applyMatrix4(m); b.fromArray(p1).applyMatrix4(m); c.fromArray(p2).applyMatrix4(m);
      e1.subVectors(b, a); e2.subVectors(c, a); n.crossVectors(e1, e2); if (n.lengthSq() < 1e-14) return S; n.normalize();
      const t3 = Array.isArray(t) ? t : [t, t, t], pts = [a, b, c];
      for (let i = 0; i < 3; i++) {
        if (nfn) { nfn(pts[i].x, pts[i].y, pts[i].z, vn); if (vn.dot(n) < 0) vn.negate(); put(pts[i], vn, col, t3[i]); } else put(pts[i], n, col, t3[i]);
      }
      return S;
    },
    quad(p0, p1, p2, p3, col, t = 1, nfn) {
      const t4 = Array.isArray(t) ? t : [t, t, t, t];
      S.tri(p0, p1, p2, col, [t4[0], t4[1], t4[2]], nfn); return S.tri(p0, p2, p3, col, [t4[0], t4[2], t4[3]], nfn);
    },
    // box; skip: letters of faces to leave out (x X y Y z Z = min / max of each axis)
    box(x0, y0, z0, x1, y1, z1, col, t = 1, skip = '') {
      const v = (i) => [i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0];
      const f = (k, i0, i1, i2, i3, tt) => { if (!skip.includes(k)) S.quad(v(i0), v(i1), v(i2), v(i3), col, tt); };
      f('x', 0, 4, 6, 2, t * 0.92); f('X', 1, 3, 7, 5, t * 0.92); f('y', 0, 1, 5, 4, t * 0.7); f('Y', 2, 6, 7, 3, t * 1.06); f('z', 0, 2, 3, 1, t); f('Z', 4, 5, 7, 6, t);
      return S;
    },
    // extruded convex polygon [[x, y], ...] between z0 and z1
    prism(poly, z0, z1, col, t = 1, caps = true) {
      const k = poly.length;
      for (let i = 0; i < k; i++) { const p = poly[i], q = poly[(i + 1) % k]; S.quad([p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1], col, t * (q[0] === p[0] ? 0.92 : 1.04)); }
      if (caps) for (let i = 1; i < k - 1; i++) { S.tri([poly[0][0], poly[0][1], z1], [poly[i][0], poly[i][1], z1], [poly[i + 1][0], poly[i + 1][1], z1], col, t); S.tri([poly[0][0], poly[0][1], z0], [poly[i + 1][0], poly[i + 1][1], z0], [poly[i][0], poly[i][1], z0], col, t * 0.9); }
      return S;
    },
    // curved wall round the hall axis (identity transform only), smooth normals
    cyl(az0, az1, y0, y1, r, col, t = 1, step = 2.25) {
      const k = Math.max(1, Math.round(Math.abs(az1 - az0) / step)), nf = (x, y, z, o) => o.set(-x, 0, -z).normalize();
      for (let i = 0; i < k; i++) { const u0 = lerp(az0, az1, i / k), u1 = lerp(az0, az1, (i + 1) / k); S.quad(pz(u0, r, y0), pz(u1, r, y0), pz(u1, r, y1), pz(u0, r, y1), col, t, nf); }
      return S;
    },
    // curved block: inner face at r0 and the faces that can be seen from the hall
    cbox(az0, az1, y0, y1, r0, r1, col, t = 1, faces = 'ftbe', step = 2.25) {
      const k = Math.max(1, Math.round(Math.abs(az1 - az0) / step));
      if (faces.includes('f')) S.cyl(az0, az1, y0, y1, r0, col, t, step);
      for (let i = 0; i < k; i++) {
        const u0 = lerp(az0, az1, i / k), u1 = lerp(az0, az1, (i + 1) / k);
        if (faces.includes('t')) S.quad(pz(u0, r0, y1), pz(u1, r0, y1), pz(u1, r1, y1), pz(u0, r1, y1), col, t * 1.06);
        if (faces.includes('b')) S.quad(pz(u0, r0, y0), pz(u0, r1, y0), pz(u1, r1, y0), pz(u1, r0, y0), col, t * 0.62);
      }
      if (faces.includes('e')) for (const u of [az0, az1]) S.quad(pz(u, r0, y0), pz(u, r1, y0), pz(u, r1, y1), pz(u, r0, y1), col, t * 0.86);
      return S;
    },
    // copy a BufferGeometry (with normals, optional colours) through the current transform
    geo(g, col, t = 1) {
      const gp = g.attributes.position, gn = g.attributes.normal, gc = g.attributes.color, ix = g.index, cnt = ix ? ix.count : gp.count, cc = new THREE.Color();
      for (let i = 0; i < cnt; i++) {
        const j = ix ? ix.getX(i) : i;
        a.fromBufferAttribute(gp, j).applyMatrix4(m); n.fromBufferAttribute(gn, j).applyMatrix3(nm).normalize();
        if (gc) cc.setRGB(gc.getX(j) * col.r, gc.getY(j) * col.g, gc.getZ(j) * col.b); else cc.copy(col);
        put(a, n, cc, t);
      }
      g.dispose(); return S;
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.computeBoundingSphere(); return g;
    },
    // the same for a big soup, one buffer a slice
    async buildSliced(ctx) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(await toF32(ctx, P), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(await toF32(ctx, N), 3));
      g.setAttribute('color', new THREE.BufferAttribute(await toF32(ctx, C), 3));
      g.computeBoundingSphere(); await ctx.yield(); return g;
    },
  };
  return S.at(null);
}

// lathe: profile [[r, y, tone?], ...] round Y. flutes: n channels cut into the surface (segs should be 3 n); arc: part turn
function latheGeo(profile, segs, o = {}) {
  const n = profile.length, arc = o.arc ?? Math.PI * 2, closed = !o.arc, cols = closed ? segs : segs + 1;
  const pos = new Float32Array(n * cols * 3), col = new Float32Array(n * cols * 3), idx = [];
  for (let s = 0; s < cols; s++) {
    const th = (s / segs) * arc + (o.phase ?? 0), ca = Math.cos(th), sa = Math.sin(th);
    const fl = o.flutes ? Math.pow(0.5 + 0.5 * Math.cos(th * o.flutes), 1.5) : 0;
    for (let i = 0; i < n; i++) {
      const k = (s * n + i) * 3, pr = profile[i], fw = o.flutes ? (pr[3] ?? 1) : 0;
      const r = pr[0] * (1 - (o.depth ?? 0.07) * fl * fw), t = (pr[2] ?? 1) * (1 - 0.34 * fl * fw) * (o.tone ? o.tone(s, i) : 1);
      pos[k] = r * sa; pos[k + 1] = pr[1]; pos[k + 2] = r * ca; col[k] = t; col[k + 1] = t; col[k + 2] = t;
    }
  }
  for (let s = 0; s < segs; s++) {
    const s2 = closed ? (s + 1) % segs : s + 1;
    for (let i = 0; i < n - 1; i++) { const p = s * n + i, q = s2 * n + i; idx.push(p, q, p + 1, q, q + 1, p + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------------------------------------------
// the flight: portico, passage, reveal, half round the drum, across the floor through the foot of the beam,
// corkscrew up the wall, curl under the eye and out through it
// ---------------------------------------------------------------------------------------------------------------
function buildPath(A) {
  const pts = [], sst = (x0, x1, x) => smoothstep(x0, x1, x);
  const P = (x, y, z) => pts.push([x, y, z]), pol = (az, r, y) => P(-Math.sin(az * DEG) * r, y, Math.cos(az * DEG) * r);
  for (const z of [215, 197, 179, 161, 143, 127]) P(0, z > 170 ? 14 : 14 + (170 - z) * 0.03, z);
  P(-3, 16.2, 111); P(-12, 17.2, 95); P(-26, 18, 80);
  // level arc widening from 76 to RA metres from the centre; a right turn of r4 round the censer in front of the apse that
  // comes out on the door axis; then the long straight back across the floor toward the door, the beam dead ahead
  const RA = 94, r4 = 30, XS = 2.5, a4 = 180 - Math.asin((r4 - XS) / (RA - r4)) / DEG, NA = 7;
  for (let i = 0; i <= NA; i++) { const t = i / NA; pol(lerp(34, a4, t), lerp(76, RA, sst(0, 0.5, t)) + 13 * sst(0.22, 0.48, t) * (1 - sst(0.56, 0.84, t)), 18 + 8 * Math.sin(Math.PI * Math.min(1, t * 1.25) * 0.5) - 3 * Math.max(0, t - 0.8) / 0.2); }
  const c4 = [-(RA - r4) * Math.sin(a4 * DEG), (RA - r4) * Math.cos(a4 * DEG)];
  for (let i = 1; i <= 5; i++) { const b = lerp(a4, 270, i / 5); P(c4[0] - Math.sin(b * DEG) * r4, 23 - 2.5 * i / 5, c4[1] + Math.cos(b * DEG) * r4); }
  const T0 = [XS, c4[1]], NOON = [0, 68];
  for (const t of [0.14, 0.28, 0.42, 0.56, 0.7, 0.84, 0.93]) P(lerp(T0[0], NOON[0], t), 20.5 - 8.5 * Math.pow(Math.min(1, t / 0.6), 1.3), lerp(T0[1], NOON[1], t));
  // the exit, from the hero: 60 m dead straight at 66 degrees into the seat, reached by a right-hand curl of 50 m radius
  const travel = A.exitDir, seat = A.portalSeat.position, pb = seat.clone().addScaledVector(travel, -60);
  const hd = new THREE.Vector2(travel.x, travel.z).normalize(), right = new THREE.Vector2(-hd.y, hd.x);
  const cen = new THREE.Vector2(pb.x, pb.z).addScaledVector(right, 50), rel = new THREE.Vector2(pb.x - cen.x, pb.z - cen.y);
  const RF = cen.length() + 50, azF = Math.atan2(-cen.x, cen.y) / DEG, dF = Math.acos(clamp((rel.x * cen.x + rel.y * cen.y) / (50 * cen.length()), -1, 1)) / DEG;
  const RAMP = 30, THC = 7, BULGE = 16;      // BULGE: the top of the corkscrew swings out to pass close under the second ring of coffers
  const yCurl = (deg) => { let y = pb.y; const H = 50 * deg * DEG, k = 160; for (let i = 0; i < k; i++) { const h = (i + 0.5) / k * H; y -= Math.tan((66 + (THC - 66) * sst(0, RAMP, h)) * DEG) * H / k; } return y; };
  const yTop = yCurl(dF);
  // corkscrew: pursue the circle of radius RF clockwise with a turn radius of at least 38 m; height from an integrated pitch
  const cork = []; let x = NOON[0], z = NOON[1], psi = Math.atan2(NOON[0] - T0[0], NOON[1] - T0[1]), hh = 0;
  for (let i = 0; i < 4000; i++) {
    cork.push([x, z, hh]);
    const r = Math.hypot(x, z), ox = x / r, oz = z / r, az = Math.atan2(-x, z) / DEG; if (i > 50 && az >= azF) break;
    const e = (RF - 7 * (1 - sst(90, 190, hh)) + BULGE * sst(118, 186, hh) * (1 - sst(204, 246, hh)) - r) / 50, want = Math.atan2(-oz + ox * e, ox + oz * e); let d = want - psi; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    const lim = 0.5 / 30 * sst(-10, 14, hh); psi += clamp(d, -lim, lim); x += Math.sin(psi) * 0.5; z += Math.cos(psi) * 0.5; hh += 0.5;
  }
  const NN = cork.length - 1;
  const climb = (thM) => { let y = 12; const ys = [12]; for (let i = 1; i <= NN; i++) { const h = (cork[i][2] + cork[i - 1][2]) / 2; y += Math.tan(thM * sst(0, 55, h) * (1 - (1 - THC / thM) * sst(hh - 85, hh, h)) * DEG) * (cork[i][2] - cork[i - 1][2]); ys.push(y); } return ys; };
  let lo = 20, hi = 60; for (let k = 0; k < 26; k++) { const mid = (lo + hi) / 2; if (climb(mid)[NN] < yTop) lo = mid; else hi = mid; }
  const ys = climb(lo), NK = 17;
  for (let k = 0; k < NK; k++) { const i = Math.round(NN * k / NK); P(cork[i][0], ys[i], cork[i][1]); }
  for (const d of [dF, 134, 114, 94, 74, 56, 40, 26, 14, 6]) { const a = -d * DEG, c = Math.cos(a), s = Math.sin(a); P(cen.x + rel.x * c - rel.y * s, yCurl(d), cen.y + rel.x * s + rel.y * c); }
  for (const k of [-60, -48, -36, -24, -12, 0]) { const q = seat.clone().addScaledVector(travel, k); P(q.x, q.y, q.z); }
  const path = makePath(pts);
  return { path, turn: c4, straight: [T0, NOON] };
}

// ---------------------------------------------------------------------------------------------------------------
// the clock. Path progress u -> hour of the day d (noon = 0.52), and the sun's track as a function of u, so that the
// disc comes off the wall right of the door, crosses the floor in front of the door while the camera flies down the
// axis toward it, and stands where the path turns through it at noon. After noon the sun follows the camera round.
// ---------------------------------------------------------------------------------------------------------------
function makeClock(look) {
  const april = look === 'april', noonEl = april ? 58 : 68, PHI_N = april ? 0 : 14, tp = new V3(), ax = new V3(), q = new V3();
  // [u, where the disc stands in degrees clockwise of the door, elevation of the summer sun]
  // The morning disc runs round the drum ahead of the camera, the way the camera goes: left wall, apse, right wall, and so
  // to the paving inside the door. It is always in the direction of travel, low enough for a level look across the hall.
  const keys = (uN) => [[0, 62, 44], [0.06, 86, 48], [0.12, 112, 52], [0.18, 140, 55.5], [0.25, 164, 59], [0.3, 222, 61.5], [0.34, 286, 63.3], [0.37, 324, 64.5], [0.4, april ? 344 : 346, 65.6], [0.44, april ? 353 : 355, 67.4], [0.48, april ? 358 : 363, 68], [uN, PHI_N + 360, 68]];
  let path = null, uNoon = 0.545, K = keys(uNoon);
  const herm = (j, u) => {
    let i = 0; while (i < K.length - 2 && u > K[i + 1][0]) i++;
    const k0 = K[i], k1 = K[i + 1], h = k1[0] - k0[0], t = clamp((u - k0[0]) / h, 0, 1), sl = (a, b) => (K[b][j] - K[a][j]) / (K[b][0] - K[a][0]);
    const d = sl(i, i + 1), lim = (m) => (d === 0 ? 0 : clamp(m / d, 0, 3) * d), m0 = lim(i > 0 ? (sl(i - 1, i) + d) / 2 : d), m1 = lim(i < K.length - 2 ? (d + sl(i + 1, i + 2)) / 2 : d), t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * k0[j] + (t3 - 2 * t2 + t) * h * m0 + (3 * t2 - 2 * t3) * k1[j] + (t3 - t2) * h * m1;
  };
  const C = {
    noonEl, phiN: PHI_N,
    get uNoon() { return uNoon; },
    dayOf: (u) => (u < uNoon ? u * 0.52 / uNoon : 0.52 + (u - uNoon) * 0.48 / (1 - uNoon)),
    pathOf: (d) => (d < 0.52 ? d * uNoon / 0.52 : uNoon + (d - 0.52) * (1 - uNoon) / 0.48),
    sunAt(d) {
      const u = C.pathOf(d);
      if (u <= uNoon) return { az: 180 + herm(1, u), el: 25 + (herm(2, u) - 25) * (noonEl - 25) / 43 };
      const s = (d - 0.52) / 0.48; let lead = PHI_N + (106 - PHI_N) * Math.min(1, s * 2.2);
      // (as the climb begins the disc runs 30 degrees further ahead, so that it stands on the wall in front of us with
      // the whole shaft above it; by u 0.69 we have caught it up and the edge of the beam brushes us again)
      if (path) { path.pointAt(Math.min(u + 0.022, 0.8), tp); lead = lerp(PHI_N, clamp(Math.atan2(-tp.x, tp.z) / DEG + 30 * smoothstep(uNoon + 0.004, uNoon + 0.045, u) * (1 - smoothstep(0.615, 0.69, u)), PHI_N, 128), smoothstep(uNoon, uNoon + 0.02, u)); }
      // (at the day's end the disc outruns us: from u 0.705 it swings on round the dome to the coffers across the hall, a
      // little to the left of where the gaze then rests, and from there it creeps on with us to the end)
      if (path) { const k = smoothstep(0.705, 0.768, u); if (k > 0) { path.pointAt(Math.min(u, 0.86), tp); lead = lerp(lead, Math.atan2(-tp.x, tp.z) / DEG + LENS_LEAD, k); } }
      return { az: 180 + lead, el: Math.max(noonEl - (noonEl - 14) * Math.pow(s, 0.6), 5) };
    },
    // noon is where the camera is nearest the axis of the (summer) noon beam
    setPath(pa) {
      path = pa; let best = 1e9;
      ax.set(-Math.sin(194 * DEG) * Math.cos(68 * DEG), Math.sin(68 * DEG), Math.cos(194 * DEG) * Math.cos(68 * DEG));
      for (let u = 0.45; u < 0.65; u += 0.0005) { pa.pointAt(u, q); q.y -= EYE_Y; q.addScaledVector(ax, -q.dot(ax)); const dd = q.length(); if (dd < best) { best = dd; uNoon = u; } }
      K = keys(uNoon);
    },
  };
  return C;
}

// ---------------------------------------------------------------------------------------------------------------
// Corinthian column in true proportion: shaft radius 1 at the foot, 18.3 tall (scale uniformly by the shaft radius)
// ---------------------------------------------------------------------------------------------------------------
const COL_H = 18.3;
async function columnGeos(ctx) {
  const shaft = latheGeo([[1.0, 1.3, 0.96, 1], [0.995, 5.2, 1, 1], [0.965, 9.5, 1, 1], [0.92, 13.2, 1, 1], [0.868, 16.05, 0.94, 1]], 60, { flutes: 20, depth: 0.075 });
  await ctx.yield();
  const S = makeSoup(), W = new THREE.Color(1, 1, 1), M = new THREE.Matrix4(), M2 = new THREE.Matrix4();
  S.box(-1.5, 0, -1.5, 1.5, 0.42, 1.5, W, 0.92, 'y');
  S.geo(latheGeo([[1.46, 0.42, 0.75], [1.53, 0.56, 1.05], [1.46, 0.72, 0.95], [1.3, 0.76, 0.55], [1.2, 0.84, 0.65], [1.22, 0.96, 0.9], [1.31, 1.02, 1.05], [1.31, 1.1, 1.05], [1.22, 1.18, 0.9], [1.04, 1.22, 0.65], [1.0, 1.3, 0.9]], 28), W);
  S.geo(latheGeo([[0.868, 16.0, 0.75], [0.97, 16.1, 1.1], [0.97, 16.2, 1.05], [0.868, 16.3, 0.7]], 20), W);
  S.geo(latheGeo([[0.86, 16.3, 0.5], [0.88, 17.0, 0.56], [1.0, 17.5, 0.66], [1.26, 17.9, 0.8]], 16), W);
  await ctx.yield();
  for (let tier = 0; tier < 2; tier++) for (let i = 0; i < 8; i++) {
    const H = tier ? 1.2 : 0.68, w0 = tier ? 0.3 : 0.34, lift = tier * 0.08;
    S.at(M.makeRotationY((i + tier * 0.5) / 8 * Math.PI * 2));
    const rows = [[0, 0.9, w0, 0.5], [0.45, 0.95, w0 * 1.1, 0.78], [0.8, 1.08 + lift, w0 * 0.92, 1.0], [1.0, 1.36 + lift, w0 * 0.45, 1.16], [0.88, 1.47 + lift, 0.07, 0.9]];
    for (let j = 0; j < rows.length - 1; j++) {
      const p = rows[j], q = rows[j + 1], ya = 16.3 + p[0] * H, yb = 16.3 + q[0] * H;
      S.quad([-p[2], ya, p[1]], [0, ya, p[1] + 0.08], [0, yb, q[1] + 0.08], [-q[2], yb, q[1]], W, [p[3] * 0.9, p[3] * 1.1, q[3] * 1.1, q[3] * 0.9]);
      S.quad([0, ya, p[1] + 0.08], [p[2], ya, p[1]], [q[2], yb, q[1]], [0, yb, q[1] + 0.08], W, [p[3] * 1.1, p[3] * 0.8, q[3] * 0.8, q[3] * 1.1]);
    }
  }
  await ctx.yield();
  for (let i = 0; i < 4; i++) {
    const th = (i + 0.5) / 4 * Math.PI * 2;
    S.at(M.makeRotationY(th).multiply(M2.makeTranslation(0, 17.68, 1.72)).multiply(M2.makeRotationZ(Math.PI / 2)));
    S.geo(new THREE.CylinderGeometry(0.31, 0.31, 0.3, 10), W, 1.08); S.geo(new THREE.CylinderGeometry(0.14, 0.14, 0.4, 8), W, 0.6);
    S.at(M.makeRotationY(th)); S.box(-0.1, 17.2, 1.02, 0.1, 17.62, 1.52, W, 0.85, 'yz');
    S.at(M.makeRotationY(i / 4 * Math.PI * 2)); S.box(-0.24, 17.92, 1.5, 0.24, 18.3, 1.74, W, 1.1, 'yz');
  }
  S.at(null); S.box(-1.5, 17.9, -1.5, 1.5, 18.04, 1.5, W, 0.8, 'Y'); S.box(-1.64, 18.04, -1.64, 1.64, 18.3, 1.64, W, 1.0);
  await ctx.yield();
  return { shaft, capBase: S.build() };
}

// ---------------------------------------------------------------------------------------------------------------
// foliage: garlands, bay trees and the plants on the rim. Flat-shaded soup with a sway weight and phase per vertex
// ---------------------------------------------------------------------------------------------------------------
function makeLeafSoup(rng) {
  const P = [], N = [], C = [], W = [], a = new V3(), b = new V3(), c = new V3(), n = new V3();
  const L = {
    get triangles() { return P.length / 9; },
    tri(p0, p1, p2, col, w, ph, t = 1) {
      a.fromArray(p0); b.fromArray(p1); c.fromArray(p2); n.subVectors(b, a).cross(c.sub(a)).normalize();
      const ws = Array.isArray(w) ? w : [w, w, w];
      for (const [p, ww] of [[p0, ws[0]], [p1, ws[1]], [p2, ws[2]]]) { P.push(p[0], p[1], p[2]); N.push(n.x, n.y, n.z); C.push(col.r * t, col.g * t, col.b * t); W.push(ww, ph); }
    },
    quad(p0, p1, p2, p3, col, w, ph, t = 1) { const ws = Array.isArray(w) ? w : [w, w, w, w]; L.tri(p0, p1, p2, col, [ws[0], ws[1], ws[2]], ph, t); L.tri(p0, p2, p3, col, [ws[0], ws[2], ws[3]], ph, t); },
    // a leaf: a diamond about `at`, long axis `dir` (array), in a random plane
    leaf(at, dir, len, wid, col, w, ph, t = 1) {
      const d = new V3().fromArray(dir).normalize(), s = new V3(rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)).cross(d).normalize().multiplyScalar(wid * 0.5);
      const o = new V3().fromArray(at), tip = o.clone().addScaledVector(d, len), mid = o.clone().addScaledVector(d, len * 0.42);
      L.quad(o.toArray(), mid.clone().add(s).toArray(), tip.toArray(), mid.clone().sub(s).toArray(), col, w, ph, t);
    },
    // lumpy ball of facets (clipped bay, garland knots)
    blob(at, r, cols, rows, segs, w, ph, squash = 1) {
      const pt = (i, j) => { const v = i / rows * Math.PI, u = j / segs * Math.PI * 2, k = r * (1 + 0.1 * Math.sin(i * 2.7 + j * 1.9 + ph) + 0.07 * Math.sin(j * 3.3 - i * 1.3 + ph * 2)); return [at[0] + Math.sin(v) * Math.cos(u) * k, at[1] + Math.cos(v) * k * squash, at[2] + Math.sin(v) * Math.sin(u) * k]; };
      for (let i = 0; i < rows; i++) for (let j = 0; j < segs; j++) {
        const col = cols[(i * 7 + j * 3 + Math.floor(rng() * 3)) % cols.length], t = 0.74 + 0.36 * (1 - i / rows) + rng.range(-0.07, 0.07);
        L.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), col, w, ph, t);
      }
    },
    // tube through points with radii, k sides; ws: weight per point
    tube(pts, radii, k, col, ws, ph, t = 1) {
      const ring = (i) => { const p = new V3().fromArray(pts[i]), q = new V3().fromArray(pts[Math.min(i + 1, pts.length - 1)]).sub(new V3().fromArray(pts[Math.max(i - 1, 0)])).normalize(); const u = new V3(0, 1, 0).cross(q); if (u.lengthSq() < 1e-4) u.set(1, 0, 0); u.normalize(); const v = q.clone().cross(u); const out = []; for (let j = 0; j < k; j++) { const th = j / k * Math.PI * 2; out.push(p.clone().addScaledVector(u, Math.cos(th) * radii[i]).addScaledVector(v, Math.sin(th) * radii[i]).toArray()); } return out; };
      let r0 = ring(0);
      for (let i = 0; i < pts.length - 1; i++) { const r1 = ring(i + 1); for (let j = 0; j < k; j++) { const j2 = (j + 1) % k; L.quad(r0[j], r0[j2], r1[j2], r1[j], col, [ws[i], ws[i], ws[i + 1], ws[i + 1]], ph, t * (0.8 + 0.4 * ((j * 5 + i * 3) % 4) / 3)); } r0 = r1; }
    },
    // quad with shading normals of its own (one per corner, arrays); wound so that its front faces along them
    quadN(p, nv, col, ws, ph, t = 1) {
      a.fromArray(p[0]); b.fromArray(p[1]); c.fromArray(p[2]); n.subVectors(b, a).cross(c.sub(a));
      const flip = n.x * nv[0][0] + n.y * nv[0][1] + n.z * nv[0][2] < 0, o = flip ? [0, 3, 2, 0, 2, 1] : [0, 1, 2, 0, 2, 3], tt = Array.isArray(t) ? t : [t, t, t, t];
      for (const i of o) { P.push(p[i][0], p[i][1], p[i][2]); N.push(nv[i][0], nv[i][1], nv[i][2]); C.push(col.r * tt[i], col.g * tt[i], col.b * tt[i]); W.push(ws[i], ph); }
    },
    // a leaf lying on a rounded mass: `out` is the outward direction of the mass there; the leaf's own plane is tilted a
    // little off it and its shading normal leans back toward `out`, so a ball of them shades as a ball of leaves
    leafOn(at, dir, out, len, wid, col, w, ph, t = 1, lean = 0.55) {
      const o = new V3().fromArray(at), d = new V3().fromArray(dir).normalize(), r = new V3().fromArray(out).normalize();
      const sd = new V3().crossVectors(r, d).add(new V3(rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)).multiplyScalar(0.35)).normalize(), fn = new V3().crossVectors(d, sd).normalize();
      if (fn.dot(r) < 0) fn.negate();
      const nn = fn.lerp(r, lean).normalize().toArray(), tip = o.clone().addScaledVector(d, len), mid = o.clone().addScaledVector(d, len * 0.45).addScaledVector(r, len * 0.06); sd.multiplyScalar(wid * 0.5);
      L.quadN([o.toArray(), mid.clone().add(sd).toArray(), tip.toArray(), mid.clone().sub(sd).toArray()], [nn, nn, nn, nn], col, [w, w * 1.04 + 0.02, w * 1.08 + 0.05, w * 1.04 + 0.02], ph, [t * 0.8, t, t * 1.12, t]);
    },
    // round mass with smooth normals (the dark heart of a clipped bay, a knot)
    ball(at, r, col, rows, segs, w, ph, t = 1, squash = 1) {
      const nrm = (i, j) => { const v = i / rows * Math.PI, u = j / segs * Math.PI * 2; return [Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u)]; };
      const pt = (q) => [at[0] + q[0] * r, at[1] + q[1] * r * squash, at[2] + q[2] * r];
      for (let i = 0; i < rows; i++) for (let j = 0; j < segs; j++) { const q = [nrm(i, j), nrm(i + 1, j), nrm(i + 1, j + 1), nrm(i, j + 1)], k = (y) => t * (0.55 + 0.45 * (y * 0.5 + 0.5)); L.quadN(q.map(pt), q, col, [w, w, w, w], ph, [k(q[0][1]), k(q[1][1]), k(q[2][1]), k(q[3][1])]); }
    },
    // tube with smooth normals. Returns the frames [{ p, u, v, r }] so that leaves can be laid on it
    tubeN(pts, radii, k, col, ws, ph, t = 1) {
      const fr = pts.map((_, i) => { const p = new V3().fromArray(pts[i]), q = new V3().fromArray(pts[Math.min(i + 1, pts.length - 1)]).sub(new V3().fromArray(pts[Math.max(i - 1, 0)])).normalize(); const u = new V3(0, 1, 0).cross(q); if (u.lengthSq() < 1e-4) u.set(1, 0, 0); u.normalize(); return { p, q, u, v: q.clone().cross(u), r: radii[i] }; });
      const at = (f, th) => { const d = f.u.clone().multiplyScalar(Math.cos(th)).addScaledVector(f.v, Math.sin(th)); return [f.p.clone().addScaledVector(d, f.r).toArray(), d.toArray()]; };
      for (let i = 0; i < fr.length - 1; i++) for (let j = 0; j < k; j++) {
        const t0 = j / k * Math.PI * 2, t1 = (j + 1) / k * Math.PI * 2, A0 = at(fr[i], t0), A1 = at(fr[i], t1), B1 = at(fr[i + 1], t1), B0 = at(fr[i + 1], t0);
        L.quadN([A0[0], A1[0], B1[0], B0[0]], [A0[1], A1[1], B1[1], B0[1]], col, [ws[i], ws[i], ws[i + 1], ws[i + 1]], ph, t);
      }
      return fr;
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aSw', new THREE.Float32BufferAttribute(W, 2));
      g.computeBoundingSphere(); g.boundingSphere.radius += 3; return g;
    },
    // the same for a big soup, one buffer a slice
    async buildSliced(ctx) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(await toF32(ctx, P), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(await toF32(ctx, N), 3));
      g.setAttribute('color', new THREE.BufferAttribute(await toF32(ctx, C), 3));
      g.setAttribute('aSw', new THREE.BufferAttribute(await toF32(ctx, W), 2));
      g.computeBoundingSphere(); g.boundingSphere.radius += 3; await ctx.yield(); return g;
    },
  };
  return L;
}
function foliageMaterial(hero, time, open) {
  return new THREE.ShaderMaterial({
    defines: open ? { OPEN_AIR: 1 } : {}, fog: true, vertexColors: true, side: THREE.DoubleSide,
    uniforms: { ...hero.uniforms, ...fx.fogUniforms(), uTime: time, uGust: { value: open ? 1 : 0.45 } },
    vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`
      attribute vec2 aSw; uniform float uTime, uGust; varying vec3 vW; varying vec3 vN; varying vec3 vCol;
      void main(){
        vec3 p = position; float ph = aSw.y, w = aSw.x;
        float rl = max(length(p.xz), 1e-3); vec3 rad = vec3(p.x, 0., p.z)/rl, tang = vec3(-rad.z, 0., rad.x);
        vec3 d = tang*sin(uTime*0.9 + ph)*0.8 + rad*sin(uTime*0.63 + ph*1.7)*0.4 + vec3(0., sin(uTime*1.3 + ph*2.1)*0.65, 0.);
        d += vec3(sin(uTime*5.1 + ph*9. + p.y), cos(uTime*6.3 + ph*7.)*0.5, sin(uTime*4.4 + ph*5. + p.x))*0.3*uGust;
        p += d*w;
        vW = p; vN = normal; vCol = color.rgb;
        vec4 mvPosition = viewMatrix*vec4(p, 1.); gl_Position = projectionMatrix*mvPosition;
      ` + fx.GLSL_FOG_VERT + '}',
    fragmentShader: fx.GLSL_NOISE + fx.GLSL_FOG_PARS_FRAG + hero.GLSL + /* glsl */`
      varying vec3 vW; varying vec3 vN; varying vec3 vCol;
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-6, 0.)); if (!gl_FrontFacing) n = -n;
        vec3 alb = vCol*(0.78 + 0.44*vnoise(vW*1.1))*1.55;
        vec3 Vv = normalize(cameraPosition - vW), Rv = reflect(-Vv, n);
        float fr = 1. - max(dot(Vv, n), 0.); fr = 0.3 + 0.7*fr*fr*fr;
        #ifdef OPEN_AIR
        vec3 col = alb*(uSunColor*((max(dot(n, uSunDir), 0.)*0.5 + 0.22)*uCloud.z*0.5) + uSky*(0.3 + 0.2*n.y) + uAmbient);
        #else
        float lit = oculusSun(vW); vec4 bn = ocBounce(vW);
        vec3 col = oculusLightS(vW, n, alb, 1., 0.8);
        col += alb*(uFill*0.7 + uAmbient*1.5 + uBounceCol*(bn.w*0.7));      // leaves pass light: no black masses
        // bay and laurel are leathery: a sheen from the sun, from the disc and from the eye overhead
        col += (uSunColor*(pow(max(dot(Rv, uSunDir), 0.), 26.)*lit*0.3) + uBounceCol*(pow(max(dot(Rv, bn.xyz), 0.), 9.)*bn.w*0.8) + uFill*(0.3*smoothstep(-0.1, 0.9, Rv.y)))*fr;
        #endif
        gl_FragColor = vec4(fxApplyFog(col), 1.);
      }`,
  });
}

// ---------------------------------------------------------------------------------------------------------------
// the sky: seen in the eye, between the portico columns and all round after leaving. Clouds race at time-lapse speed
// ---------------------------------------------------------------------------------------------------------------
function makeSkyDome(hero, P) {
  const uniforms = { uSkyCol: hero.uniforms.uSky, uSunDir: hero.uniforms.uSunDir, uCloud: hero.uniforms.uCloud, uSunCol: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() },
    uSkyP: { value: new THREE.Vector4(P.stars, P.cover, P.cloudGain, 0) }, uWind: { value: new THREE.Vector3(P.wind.x, P.wind.y, 0) }, uDisc: { value: new THREE.Vector4(P.discSize, P.discGain, P.overcast, P.gain ?? 0.62) }, uStar: { value: new THREE.Vector4(0.05, 0.75, 0.66, 0).normalize() } };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; vec4 mv = viewMatrix*vec4(position*60. + cameraPosition, 1.); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: fx.GLSL_NOISE + /* glsl */`
      uniform vec3 uSkyCol, uSunDir, uSunCol, uHorizon, uWind; uniform vec4 uCloud, uSkyP, uDisc, uStar; varying vec3 vDir;   // uWind: xy direction, z evening 0..1
      void main(){
        vec3 d = normalize(vDir + vec3(0., 1e-5, 0.));
        float h = clamp(d.y, 0., 1.), hz = 1. - smoothstep(0., 0.62, h);
        vec3 zen = uSkyCol*uDisc.w*mix(vec3(1.), vec3(0.5, 0.62, 1.12), smoothstep(0.1, 0.9, d.y)*0.78)*mix(vec3(1.), vec3(0.42, 0.46, 0.78), uWind.z);
        vec3 col = mix(zen, uHorizon, hz*hz*0.9);
        float sd = max(dot(d, uSunDir), 0.);
        vec2 dh = d.xz/max(length(d.xz), 1e-4), sh = uSunDir.xz/max(length(uSunDir.xz), 1e-4);
        float sa = max(dot(dh, sh), 0.);
        col += uSunCol*(0.22*sa*sa*sa*hz*hz + 0.16*pow(sd, 12.));
        float sw = 0.5 + 0.5*dot(d, uSunDir); col += uSunCol*(0.15*uWind.z*sw*sw*sw*sw); col *= 1. - 0.35*uWind.z*(1. - sw);
        // stars turn with the hours
        float ca = cos(uSkyP.w), sn = sin(uSkyP.w);
        vec3 sp = vec3(d.x*ca - d.z*sn, d.y, d.x*sn + d.z*ca); sp = vec3(sp.x, sp.y*0.9 - sp.z*0.436, sp.y*0.436 + sp.z*0.9)*90.;
        vec3 sc = floor(sp), sf = fract(sp) - 0.5; float rnd = hash13(sc);
        float star = step(0.93, rnd)*(1. - smoothstep(0.05, 0.3, length(sf)))*(0.4 + 0.6*fract(rnd*57.3));
        col += vec3(0.85, 0.9, 1.)*star*uSkyP.x*3.*smoothstep(0.05, 0.3, d.y);
        // cloud deck
        float dy = max(d.y, 0.05);
        vec2 qq = (cameraPosition.xz + d.xz*((1100. - min(cameraPosition.y, 700.))/dy) + uCloud.xy*2.6 + uWind.xy*(uCloud.w*26.*uWind.z))*0.0019;
        vec2 q = vec2(dot(qq, uWind.xy)*0.42, dot(qq, vec2(-uWind.y, uWind.x))*1.35);      // drawn out along the wind
        float n1 = fbm(q), n2 = vnoise(q*3.3 + 5.) , n3 = vnoise(q*vec2(5., 12.) + 2.);
        float dens = n1*0.76 + n2*0.17 + n3*0.07;
        float cov = smoothstep(uSkyP.y, uSkyP.y + mix(0.16, 0.07, uWind.z), dens)*smoothstep(0.015, 0.16, d.y);
        float core = smoothstep(uSkyP.y + mix(0.09, 0.04, uWind.z), uSkyP.y + mix(0.36, 0.2, uWind.z), dens), rim = cov*(1. - core);
        vec3 lit = uSunCol*(0.17 + 0.24*sd*sd + 0.3*rim*(0.5 + sw)*(1. + 2.2*uWind.z)) + zen*0.3 + uHorizon*0.2, dark = zen*vec3(0.3, 0.3, 0.44) + uHorizon*mix(0.2, 0.08, uWind.z) + uSunCol*mix(0.025, 0.05, uWind.z);
        col = mix(col, mix(lit, dark, core*0.9)*uSkyP.z, cov*0.95);
        col = mix(col, (uHorizon*0.9 + zen*0.3)*(0.8 + 0.4*n1), uDisc.z);
        // the sun or the moon itself
        col += uSunCol*uDisc.y*(1. - smoothstep(uDisc.x*0.8, uDisc.x, acos(clamp(dot(d, uSunDir), -1., 1.))))*(1. - 0.85*cov);
        // the first star of the evening, seen in the eye as we climb to it
        // (small and sharp, with a faint four-point glint: a core of a fifth of a degree, so the glow does not swell it)
        vec3 stA = normalize(cross(uStar.xyz, vec3(0., 1., 0.))), stB = cross(stA, uStar.xyz);
        float stx = dot(d, stA), sty = dot(d, stB), sr2 = stx*stx + sty*sty;
        float glint = exp(-abs(stx)*1400. - abs(sty)*130.) + exp(-abs(sty)*1400. - abs(stx)*130.);
        col += vec3(1., 0.96, 0.88)*uStar.w*step(0.9, dot(d, uStar.xyz))*(exp(-sr2*40000.)*7. + glint*2.4 + exp(-sr2*2600.)*0.1)*(1. - 0.8*cov);
        col = mix(col, uHorizon*0.8, smoothstep(0.0, -0.1, d.y));
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), mat); mesh.frustumCulled = false; mesh.renderOrder = -10; mesh.name = 'sky';
  return { mesh, uniforms };
}

// soft dark blobs on the floor under the things that stand on it
function makeBlobs(list) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], 3)); g.setIndex([0, 2, 1, 0, 3, 2]);
  g.setAttribute('aBlob', new THREE.InstancedBufferAttribute(new Float32Array(list.flat()), 4)); g.instanceCount = list.length;
  g.boundingSphere = new THREE.Sphere(new V3(0, 0, 0), 320);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: /* glsl */`attribute vec4 aBlob; varying vec3 vB; void main(){ vB = vec3(position.xz, aBlob.w); gl_Position = projectionMatrix*viewMatrix*vec4(aBlob.x + position.x*aBlob.z, 0.06, aBlob.y + position.z*aBlob.z, 1.); }`,
    fragmentShader: /* glsl */`varying vec3 vB; void main(){ float a = 1. - smoothstep(0.25, 1., length(vB.xy)); gl_FragColor = vec4(0.01, 0.012, 0.02, a*a*vB.z); }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 1; mesh.name = 'blobs';
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------------
// bronze furniture profiles ([radius, y, tone, flute weight])
// ---------------------------------------------------------------------------------------------------------------
const URN = [[0, 0, 0.7], [2.2, 0, 0.8], [2.4, 0.5, 1], [1.2, 1.2, 0.7], [0.9, 2.2, 0.8], [1.4, 3.0, 1], [3.3, 5.2, 1, 1], [4.0, 7.4, 1.1, 1], [3.6, 9.2, 1, 1], [2.2, 10.4, 0.8], [1.8, 11.2, 0.75], [2.5, 12.0, 1.1], [2.7, 12.3, 1.2], [2.2, 12.5, 0.8], [0, 12.6, 0.5]];
const CANDELABRUM = [[2.4, 0, 0.8], [2.6, 0.6, 1], [1.0, 1.4, 0.75], [0.6, 3, 0.9], [1.0, 4.2, 1.1], [0.5, 5.5, 0.8], [0.45, 12, 0.9], [0.9, 12.8, 1.15], [0.45, 13.6, 0.8], [0.4, 17.5, 0.9], [1.0, 18.2, 1], [2.2, 19.2, 1.15], [2.4, 19.6, 1.2], [0.55, 19.7, 2.4], [0.5, 21.2, 2.8], [0, 21.3, 2.8]];
const CENSER = [[0, 4.2, 0.5], [1.6, 4.0, 0.7], [3.0, 4.4, 0.9, 1], [4.4, 5.6, 1, 1], [5.0, 7.0, 1.05, 1], [4.9, 7.8, 0.85], [5.3, 8.1, 1.2], [5.3, 8.5, 1.25], [4.7, 8.6, 0.7], [4.4, 8.0, 0.3], [0, 7.6, 0.22]];
const TUB = [[2.7, 0, 0.6], [3.0, 0.25, 1], [3.0, 0.5, 0.9], [2.6, 0.7, 0.6], [2.75, 1.0, 0.85, 1], [3.15, 3.1, 1, 1], [3.1, 3.3, 0.7], [3.45, 3.5, 1.2], [3.5, 3.95, 1.25], [2.95, 4.0, 0.7], [2.8, 3.7, 0.4], [0, 3.7, 0.3]];

// ---------------------------------------------------------------------------------------------------------------
// the room round the hero: lower order of the drum, exedrae, shrines, doorway, passage, portico and their furniture
// ---------------------------------------------------------------------------------------------------------------
async function buildRoom(ctx, rng, K, mop) {
  const S = makeSoup(), B = makeSoup(), PV = makeSoup(), O = makeSoup();        // revetment, bronze, paving, portico granite
  const { WHITE, GIALLO, PORPH, GREEN, GREY, DARK, BRZ, WOOD, ONE } = K;
  const out = { hallCols: [], shrineCols: [], porticoCols: [], flames: [], blobs: [], trees: [], censers: [], swags: [] };
  const M = new THREE.Matrix4(), M2 = new THREE.Matrix4(), v = new V3();
  const world = (mat, x, y, z) => v.set(x, y, z).applyMatrix4(mat).toArray();
  const lathe = (soup, mat, prof, segs, o, col, sc = 1, x = 0, y = 0, z = 0, t = 1) => { soup.at(M.copy(mat).multiply(M2.makeTranslation(x, y, z)).multiply(M2.makeScale(sc, sc, sc))); soup.geo(latheGeo(prof, segs, o), col, t); };
  const candle = (mat, x, y, z, sc, segs) => { lathe(B, mat, CANDELABRUM, segs, {}, BRZ, sc, x, y, z); const p = world(mat, x, y + 21.5 * sc, z); out.flames.push([p[0], p[1], p[2], 3.6 * sc]); };
  const poly = (cx, cy, r, k, a0 = 0, a1 = Math.PI * 2) => { const pts = []; for (let i = 0; i < k; i++) { const th = a0 + (a1 - a0) * (a1 - a0 < 6.2 ? i / (k - 1) : i / k); pts.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r]); } return pts; };
  const I = new THREE.Matrix4();
  const nicheShade = (x, y, z) => { const r = Math.hypot(x, z); return (1 - 0.42 * smoothstep(131, 153, r)) * (1 - 0.3 * smoothstep(26, 64, y) * smoothstep(130, 141, r)); };

  // --- the entablature the hero's cornice sits on, all the way round
  S.cbox(0, 360, ORDER_H, 65.6, 127.9, 134, WHITE, 0.95, 'fb', 2.5);
  S.cbox(0, 360, 65.6, 67.2, 127.55, 134, WHITE, 1.04, 'fb', 2.5);
  S.cbox(0, 360, 67.2, 71.7, 127.9, 134, PORPH, 1.15, 'ft', 2.5);
  // a fillet over the architrave and a course of dentils under the cornice, all the way round
  S.cbox(0, 360, 66.95, 67.3, 127.2, 128, WHITE, 1.1, 'ftb', 2.5); S.cbox(0, 360, 70.55, 70.8, 127.6, 128, WHITE, 0.9, 'fb', 2.5);
  for (let i = 0; i < 480; i++) { if ((i & 15) === 0) await ctx.yield(); S.at(frameAt(i * 0.75, 127.9)); S.box(-0.42, 70.8, 0, 0.42, 71.7, 0.6, WHITE, 1.05, 'zY'); }

  for (let k = 0; k < 8; k++) {
    await ctx.yield();
    const A = k * 45, a0 = A + 9, a1 = A + 36, mid = A + 22.5, tri = k % 2 === 0;
    // --- pier between two bays
    S.at(null).shade(null);
    S.cbox(a0, a1, 0, 5.4, 128.8, 131, GREY, 0.9, 'fte'); S.cbox(a0, a1, 5.4, 6.6, 129.2, 131, WHITE, 1.0, 'fte');
    S.cyl(a0, a1, 6.6, ORDER_H, R_WALL, WHITE, 0.92);
    S.cbox(a0 + 2.2, a1 - 2.2, 46.6, 48, 129.3, 130.2, WHITE, 1.08, 'ftb'); S.cyl(a0 + 2.2, a1 - 2.2, 8.8, 10.6, 129.92, GIALLO, 1.1); S.cyl(a0 + 2.2, a1 - 2.2, 60.4, 62.4, 129.92, PORPH, 1.2);
    for (const [p0, p1] of [[a0, a0 + 2.0], [a1 - 2.0, a1]]) {
      S.cbox(p0, p1, 8.6, 57.5, 128.7, 130.5, GIALLO, 1.0, 'fe', 1); S.cbox(p0 + 0.45, p1 - 0.45, 10, 56, 128.5, 130, GIALLO, 1.12, 'fe', 1);
      S.cbox(p0 - 0.15, p1 + 0.15, 6.6, 8.6, 128.4, 130.5, WHITE, 1, 'fte', 1);
      S.cbox(p0 - 0.2, p1 + 0.2, 57.5, ORDER_H, 128.2, 130.5, WHITE, 1.05, 'fbe', 1); S.cbox(p0 + 0.3, p1 - 0.3, 58.8, 62.6, 127.85, 130, WHITE, 0.86, 'ftbe', 1);
    }
    for (const sg of [-1, 1]) {
      const c = mid + sg * 8.35, hw = 2.3, inlay = (sg > 0) === (k % 2 === 0) ? PORPH : GREEN;
      S.at(null); S.cbox(c - hw, c + hw, 12, 44, 129.45, 130.2, WHITE, 1.05, 'ftbe', 1.2); S.cyl(c - hw + 0.42, c + hw - 0.42, 13, 43, 129.4, inlay, 1.25, 1.2);
      S.at(frameAt(c, 129.6)); S.prism(poly(0, 52.5, 5.2, 16), -0.3, 0.12, WHITE, 1.05); S.prism(poly(0, 52.5, 4.2, 16), 0.12, 0.3, sg > 0 ? GIALLO : PORPH, 1.2);
    }
    await ctx.yield();
    // --- the shrine in the middle of the pier
    const FS = frameAt(mid, R_WALL), fr = tri ? PORPH : GIALLO;
    S.at(FS); S.box(-11.2, 0, -0.5, 11.2, 1.2, 7.4, GREY, 0.95, 'yz'); S.box(-10.4, 1.2, -0.5, 10.4, 7.6, 6.6, WHITE, 0.98, 'yz'); S.box(-11, 7.6, -0.5, 11, 8.8, 7.2, WHITE, 1.06, 'z');
    S.box(-7, 2.4, 6.6, 7, 6.6, 6.85, tri ? GREEN : PORPH, 1.2, 'z');
    S.box(-6.5, 8.8, -0.3, 6.5, 24, 0.5, WHITE, 1.02, 'z'); S.box(-5.3, 8.8, 0.5, 5.3, 24, 0.62, DARK, 0.9, 'z');
    S.prism(poly(0, 24, 6.5, 9, 0, Math.PI), -0.3, 0.5, WHITE, 1.02); S.prism(poly(0, 24, 5.3, 9, 0, Math.PI), 0.5, 0.62, DARK, 0.9);
    S.box(-2.6, 8.8, 0.6, 2.6, 11.4, 4.6, WHITE, 0.9, 'yz'); S.box(-3, 11.4, 0.6, 3, 12, 5, WHITE, 1.05, 'z');
    S.box(-10.8, 29.8, -0.3, 10.8, 31.4, 6.7, WHITE, 0.95, 'z'); S.box(-10.5, 31.4, -0.3, 10.5, 33.2, 6.4, fr, 1.15, tri ? 'zxX' : 'z'); S.box(-11.6, 33.2, -0.3, 11.6, 34.3, 7.4, WHITE, 1.06, 'z');
    // the porphyry frieze's two returns stand in the shrine's own shade, where the stone goes out to a black block: a paler slab there
    if (tri) { S.box(-10.5, 31.4, -0.3, -10.5, 33.2, 6.4, fr, 3.4, 'XyYzZ'); S.box(10.5, 31.4, -0.3, 10.5, 33.2, 6.4, fr, 3.4, 'xyYzZ'); }
    if (tri) { S.prism([[-11.6, 34.3], [11.6, 34.3], [0, 40.6]], -0.3, 7.2, WHITE, 1.0); S.prism([[-8.4, 35.1], [8.4, 35.1], [0, 39.5]], 7.2, 7.3, fr, 1.1); }
    else { S.prism(poly(0, 22.8, 16.3, 9, Math.PI * 0.25, Math.PI * 0.75).reverse(), -0.3, 7.2, WHITE, 1.0); S.prism(poly(0, 23.4, 14.6, 7, Math.PI * 0.3, Math.PI * 0.7).reverse(), 7.2, 7.3, fr, 1.1); }
    // carved work on the shrine: dentils under the cornice, a corona over it, a raking (or curved) cornice of three members
    // standing proud of the tympanum, and a patera in the middle of it
    for (let i = -10; i <= 10; i++) S.box(i * 1.02 - 0.3, 32.5, 6.4, i * 1.02 + 0.3, 33.2, 7.05, WHITE, 1.06, 'zY');
    S.box(-12.1, 33.75, 7.4, 12.1, 34.3, 8.2, WHITE, 1.1, 'z'); S.box(-11.85, 33.2, 7.4, 11.85, 33.75, 7.75, WHITE, 0.82, 'zY');
    const rake = (px, py, ang, len, flip) => {
      S.at(M.copy(FS).multiply(M2.makeTranslation(px, py, 0)).multiply(M2.makeRotationZ(ang)));
      const band = (a, b, z1, t, e) => S.box(-e, flip ? -b : a, 7.2, len + e, flip ? -a : b, z1, WHITE, t, 'z');
      band(-0.9, 0.25, 8.15, 1.08, 0.2); band(0.25, 0.6, 8.5, 1.14, 0.3); band(-1.35, -0.9, 7.6, 0.8, 0);
    };
    if (tri) { rake(-11.6, 34.3, Math.atan2(6.3, 11.6), Math.hypot(11.6, 6.3), false); rake(11.6, 34.3, Math.PI - Math.atan2(6.3, 11.6), Math.hypot(11.6, 6.3), true); }
    else for (let i = 0; i < 10; i++) { const a = Math.PI * (0.25 + 0.05 * (i + 0.5)); rake(16.3 * Math.cos(a) + 1.29 * Math.sin(a), 22.8 + 16.3 * Math.sin(a) - 1.29 * Math.cos(a), a + Math.PI / 2, 2.58, true); }
    S.at(FS); S.prism(poly(0, tri ? 36.7 : 36.4, 1.35, 12), 7.3, 7.6, WHITE, 1.1); S.prism(poly(0, tri ? 36.7 : 36.4, 0.62, 8), 7.6, 7.85, tri ? GIALLO : PORPH, 1.25);
    for (const sx of [-1, 1]) {
      out.shrineCols.push({ p: world(FS, sx * 8.3, 8.8, 4.7), r: 1.147, c: tri ? 0 : 1 });
      candle(FS, sx * 5.4, 8.8, 5.9, 0.22, 8);
    }
    lathe(B, FS, URN, 20, { flutes: 10, depth: 0.06 }, BRZ, 0.62, 0, 12, 2.9);
    out.blobs.push([...world(FS, 0, 0, 5).filter((_, i) => i !== 1), 15, 0.5]);
    out.trees.push({ az: A + 13.2, r: 120.5 }, { az: A + 31.8, r: 120.5 });

    // --- the bay: doorway (k = 0) or an exedra behind two columns
    if (k === 0) continue;
    await ctx.yield();
    const FN = frameAt(A, R_WALL), round = k % 2 === 1 || k === 4, apse = k === 4, XW = 20.3, D0 = -6, HW = round ? 44 : ORDER_H;
    const main = apse ? PORPH : [GIALLO, GREEN, PORPH][k % 3], plan = [[XW, 2.6], [XW, D0]];
    if (round) for (let i = 1; i <= 12; i++) plan.push([XW * Math.cos(i / 12 * Math.PI), D0 - XW * Math.sin(i / 12 * Math.PI)]);
    else plan.push([XW, -21], [XW * 0.5, -21], [0, -21], [-XW * 0.5, -21], [-XW, -21], [-XW, D0]);
    plan.push([-XW, 2.6]);
    S.at(FN).shade(nicheShade);
    for (const [y0, y1, col, t] of [[0, 7, GREY, 0.9], [7, 9, WHITE, 1.05], [9, (HW - 5 + 9) / 2, main, 1.1], [(HW - 5 + 9) / 2, HW - 5, main, 1.1], [HW - 5, HW, WHITE, 1.0]])
      for (let i = 0; i < plan.length - 1; i++) S.quad([plan[i][0], y0, plan[i][1]], [plan[i + 1][0], y0, plan[i + 1][1]], [plan[i + 1][0], y1, plan[i + 1][1]], [plan[i][0], y1, plan[i][1]], col, t);
    if (round) {
      const dc = apse ? GIALLO : WHITE, dt = apse ? 1.3 : 0.8;
      const dp = (th, ph) => [XW * Math.cos(ph) * Math.cos(th), HW + XW * Math.sin(ph), D0 - XW * Math.cos(ph) * Math.sin(th)];
      for (let j = 0; j < 5; j++) for (let i = 0; i < 12; i++) {
        const t0 = i / 12 * Math.PI, t1 = (i + 1) / 12 * Math.PI, p0 = j / 5 * Math.PI / 2, p1 = (j + 1) / 5 * Math.PI / 2;
        S.quad(dp(t0, p0), dp(t1, p0), dp(t1, p1), dp(t0, p1), dc, dt * ((i + j) % 2 ? 1 : 0.84));
      }
      for (let i = 0; i < 10; i++) { const s0 = i / 10 * Math.PI, s1 = (i + 1) / 10 * Math.PI; S.quad([XW * Math.cos(s0), HW + XW * Math.sin(s0), 2.6], [XW * Math.cos(s1), HW + XW * Math.sin(s1), 2.6], [XW * Math.cos(s1), HW + XW * Math.sin(s1), D0], [XW * Math.cos(s0), HW + XW * Math.sin(s0), D0], dc, dt * 0.9); }
    } else {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const x0 = -XW + i * XW / 2, z0 = 2.6 - j * 7.87; S.quad([x0, HW, z0], [x0 + XW / 2, HW, z0], [x0 + XW / 2, HW, z0 - 7.87], [x0, HW, z0 - 7.87], WHITE, (i + j) % 2 ? 0.8 : 0.66); }
      S.box(-9, 30, -21, 9, 33, -19.6, WHITE, 1.05, 'z'); S.box(-7.5, 9, -21, 7.5, 30, -20.5, apse ? GIALLO : WHITE, 0.95, 'z'); S.box(-6.3, 10, -20.5, 6.3, 29, -20.3, DARK, 1.0, 'z');
    }
    await ctx.yield();
    // pedestal, urn or an empty plinth, two tall candelabra
    S.box(-4.6, 0, -16.6, 4.6, 1.2, -7.4, GREY, 0.95, 'y'); S.box(-3.8, 1.2, -15.8, 3.8, 8, -8.2, WHITE, 1.0, 'y'); S.box(-4.4, 8, -16.4, 4.4, 9, -7.6, WHITE, 1.08);
    S.box(-2.6, 2.6, -8.2, 2.6, 6.6, -8.05, main === PORPH ? GIALLO : PORPH, 1.2);
    B.shade(nicheShade);
    if (round) lathe(B, FN, URN, 30, { flutes: 12, depth: 0.06 }, BRZ, apse ? 1.3 : 1.05, 0, 9, -12);
    for (const sx of [-1, 1]) { candle(FN, sx * 12.6, 0, -4.5, apse ? 1.15 : 0.95, 12); out.blobs.push([...world(FN, sx * 12.6, 0, -4.5).filter((_, i) => i !== 1), 5.5, 0.6]); }
    if (apse) for (const sx of [-1, 1]) candle(FN, sx * 6.2, 9, -9.4, 0.3, 8);
    out.blobs.push([...world(FN, 0, 0, -12).filter((_, i) => i !== 1), 11, 0.55]);
    S.shade(null); B.shade(null);
    PV.at(FN); PV.quad([-XW - 1, -0.03, 4], [XW + 1, -0.03, 4], [XW + 1, -0.03, -28], [-XW - 1, -0.03, -28], ONE, 0.75);
    for (const sx of [-1, 1]) out.hallCols.push({ p: world(FN, sx * 7.95, 0, 0.25), r: 3.5, c: apse ? 2 : k % 2 });
  }
  return finishRoom({ ctx, S, B, PV, O, out, K, rng, mop, lathe, candle, poly, world, I });
}

async function finishRoom({ ctx, S, B, PV, O, out, K, rng, mop, lathe, candle, poly, world, I }) {
  const { WHITE, GIALLO, PORPH, GREEN, GREY, DARK, BRZ, WOOD, ONE, GRAN, ROSE } = K;
  await ctx.yield();
  // --- the door bay from inside: wall, surround, cornice on consoles, a porphyry panel over it
  const dA = Math.asin(12 / R_WALL) / DEG, FD = frameAt(0, R_WALL);
  S.at(null).shade(null);
  S.cyl(-9, -dA, 0, ORDER_H, R_WALL, WHITE, 0.92); S.cyl(dA, 9, 0, ORDER_H, R_WALL, WHITE, 0.92); S.cyl(-dA, dA, 44, ORDER_H, R_WALL, WHITE, 0.92);
  S.at(FD);
  for (const sx of [-1, 1]) {
    S.box(sx > 0 ? 12 : -15.2, 0, 0.2, sx > 0 ? 15.2 : -12, 47.2, 1.9, GIALLO, 1.05); S.box(sx > 0 ? 12.8 : -14.4, 1, 1.9, sx > 0 ? 14.4 : -12.8, 44.8, 2.25, GIALLO, 1.2, 'z');
    S.box(sx > 0 ? 14.2 : -17.4, 39.5, 0.2, sx > 0 ? 17.4 : -14.2, 47.2, 3.2, WHITE, 1.0); S.box(sx > 0 ? 15.2 : -19.6, 5.4, 0.3, sx > 0 ? 19.6 : -15.2, 37, 0.9, sx > 0 ? GREEN : PORPH, 1.2, 'z');
  }
  S.box(-15.2, 44, 0.2, 15.2, 47.2, 1.9, GIALLO, 1.05); S.box(-18.2, 47.2, 0.2, 18.2, 48.6, 3.4, WHITE, 1.0); S.box(-19.4, 48.6, 0.2, 19.4, 50, 4.4, WHITE, 1.08);
  S.box(-11.5, 51.6, 0.2, 11.5, 62.2, 0.7, WHITE, 1.05, 'z'); S.box(-10.3, 52.8, 0.7, 10.3, 61, 0.95, PORPH, 1.3, 'z'); S.prism(poly(0, 56.9, 3.2, 14), 0.95, 1.25, GIALLO, 1.2);
  // --- the passage through the wall (36 m), panelled, with cross beams
  S.at(null);
  for (const sx of [-1, 1]) {
    S.quad([sx * 12, 0, 129.4], [sx * 12, 0, 166], [sx * 12, 44, 166], [sx * 12, 44, 129.4], WHITE, 0.9);
    S.box(sx > 0 ? 11.1 : -12, 0, 130, sx > 0 ? 12 : -11.1, 5, 166, GREY, 0.92, sx > 0 ? 'Xy' : 'xy');
    for (let j = 0; j < 3; j++) {
      const z0 = 133 + j * 11, c = j === 1 ? PORPH : GIALLO;
      S.box(sx > 0 ? 11.45 : -12, 7.5, z0, sx > 0 ? 12 : -11.45, 37.5, z0 + 8.6, WHITE, 1.05, sx > 0 ? 'X' : 'x'); S.box(sx > 0 ? 11.25 : -11.45, 9, z0 + 1.2, sx > 0 ? 11.45 : -11.25, 36, z0 + 7.4, c, 1.2, sx > 0 ? 'X' : 'x');
    }
  }
  S.quad([-12, 44, 129.4], [12, 44, 129.4], [12, 44, 166], [-12, 44, 166], WHITE, 0.62);
  for (const z of [131, 141.5, 152, 162.5]) S.box(-12, 41.6, z, 12, 44, z + 2.6, WHITE, 0.8, 'Y');
  await ctx.yield();
  // --- bronze: transom and pierced grille over the leaves
  B.at(null); B.box(-12, 35.3, 167.5, 12, 36.6, 168.7, BRZ, 1.0);
  for (let i = 0; i <= 8; i++) B.box(-12 + i * 2.93, 36.6, 167.85, -11.45 + i * 2.93, 44, 168.35, BRZ, 0.9, 'yY');
  for (const y of [39, 41.4]) B.box(-12, y, 167.9, 12, y + 0.5, 168.3, BRZ, 1.0);
  for (let i = 0; i < 8; i++) B.at(new THREE.Matrix4().makeTranslation(-10.26 + i * 2.93, 40.5, 168.1)).geo(new THREE.TorusGeometry(0.95, 0.2, 5, 12), BRZ, 1.1);
  await ctx.yield();

  // --- the portico: back wall with the doorway and two statue recesses, antae, beams, coffered ceiling
  O.at(null);
  for (const [x0, x1, y0] of [[-84, -12, 0], [12, 84, 0], [-12, 12, 44]]) O.box(x0, y0, 160, x1, 100, 166, GRAN, 1.0, 'xXyYz');
  for (const sx of [-1, 1]) {
    O.box(sx > 0 ? 12 : -15.8, 0, 166, sx > 0 ? 15.8 : -12, 47.6, 168, WHITE, 1.0, 'z'); O.box(sx > 0 ? 12.9 : -14.9, 1, 168, sx > 0 ? 14.9 : -12.9, 45, 168.4, WHITE, 1.15, 'z');
    O.box(sx > 0 ? 15 : -18.4, 40, 166, sx > 0 ? 18.4 : -15, 47.6, 169.6, WHITE, 0.95, 'z');
    O.box(sx > 0 ? 15.8 : -84, 0, 166, sx > 0 ? 84 : -15.8, 5.2, 167.1, GRAN, 0.7, 'z'); O.box(sx > 0 ? 12 : -84, 60, 166, sx > 0 ? 84 : -12, 62.4, 167.5, WHITE, 0.9, 'z');
    const cx = sx * 41;
    O.box(cx - 11, 5.2, 166, cx + 11, 50, 167.3, WHITE, 0.92, 'z'); O.box(cx - 8.6, 7, 167.3, cx + 8.6, 44, 167.4, DARK, 1.0, 'z');
    O.at(new THREE.Matrix4().makeTranslation(0, 0, 167.3)); O.prism(poly(cx, 44, 11, 9, 0, Math.PI), -1.3, 0, WHITE, 0.92); O.prism(poly(cx, 44, 8.6, 9, 0, Math.PI), 0, 0.1, DARK, 1.0); O.at(null);
    O.box(cx - 4.4, 0, 167, cx + 4.4, 7, 175, WHITE, 0.85, 'z'); O.box(cx - 5, 7, 166.6, cx + 5, 8, 175.6, WHITE, 1.0, 'z');
    lathe(B, I, URN, 30, { flutes: 12, depth: 0.06 }, BRZ, 1.15, cx, 8, 171);
    for (const xr of [21.5, 56]) { O.box(sx * xr - 4.3, 0, 166, sx * xr + 4.3, 84, 168.6, ROSE, 0.95, 'z'); O.box(sx * xr - 4.3, 84, 166, sx * xr + 4.3, 93, 266, GRAN, 0.85, 'Y'); }
    O.box(sx > 0 ? 62 : -82, 9, 166, sx > 0 ? 82 : -62, 56, 166.8, ROSE, 0.9, 'z'); O.box(sx > 0 ? 64 : -80, 11, 166.8, sx > 0 ? 80 : -64, 54, 167, GRAN, 1.1, 'z');
  }
  await ctx.yield();
  O.box(-15.8, 44, 166, 15.8, 47.6, 168, WHITE, 1.0, 'z'); O.box(-19, 47.6, 166, 19, 49.2, 169.4, WHITE, 0.95, 'z'); O.box(-20.6, 49.2, 166, 20.6, 50.8, 170.6, WHITE, 1.05, 'z');
  for (const z of [180, 205, 230, 255]) { O.box(-60, 84, z - 3.6, 60, 93, z + 3.6, GRAN, 0.8, 'Y'); for (const x of [-56, -21.5, 21.5, 56]) out.porticoCols.push({ p: [x, 0, z], r: 84 / COL_H }); }
  O.box(-62, 93, 166, 62, 96, 266, GRAN, 0.6, 'xXYzZ');
  B.at(null).shade(null); for (const sx of [-1, 1]) { candle(I, sx * 18.2, 0, 174, 0.8, 12); out.blobs.push([sx * 18.2, 174, 5, 0.5]); }
  await ctx.yield();
  // --- paving: passage, portico and the ground outside
  PV.at(null);
  PV.quad([-12, -0.03, 129.6], [12, -0.03, 129.6], [12, -0.03, 166], [-12, -0.03, 166], ONE, 0.9);
  PV.quad([-90, -0.03, 166], [90, -0.03, 166], [90, -0.03, 300], [-90, -0.03, 300], ONE, 0.95);
  PV.quad([-3200, -0.5, -3200], [3200, -0.5, -3200], [3200, -0.5, 3200], [-3200, -0.5, 3200], ONE, 0.8);

  // --- four censers on stone discs round the middle of the floor
  for (const cp of [[-33, 14], [33, 14], [-33, -46], [33, -46]]) {     // two flank the crossing, two stand before the apse
    await ctx.yield();
    const p = [cp[0], 0, cp[1]], T = new THREE.Matrix4().makeTranslation(p[0], 0, p[2]).multiply(new THREE.Matrix4().makeRotationY(rng.range(0, 6.28)));
    S.at(T).geo(latheGeo([[7, 0, 0.8], [7, 0.7, 1], [6.2, 0.95, 1.1], [0, 0.95, 1.0]], 28), WHITE, 0.95);
    lathe(B, T, CENSER, 36, { flutes: 12, depth: 0.08 }, BRZ, 1, 0, 0.6, 0);
    lathe(B, T, [[0.9, 0.9, 0.7], [0.7, 2.6, 0.9], [1.5, 4.9, 1.0]], 10, {}, BRZ, 1, 0, 0, 0);
    for (let i = 0; i < 3; i++) {
      const R = new THREE.Matrix4().copy(T).multiply(new THREE.Matrix4().makeRotationY(i / 3 * Math.PI * 2));
      B.at(R); B.box(-0.55, 0.95, 4.3, 0.55, 2.0, 5.9, BRZ, 1.1); B.quad([-0.45, 2, 4.6], [0.45, 2, 4.6], [0.4, 5.6, 3.5], [-0.4, 5.6, 3.5], BRZ, 0.9); B.quad([-0.45, 2, 5.5], [0.45, 2, 5.5], [0.4, 6.4, 4.1], [-0.4, 6.4, 4.1], BRZ, 1.1);
      B.quad([-0.45, 2, 4.6], [-0.45, 2, 5.5], [-0.4, 6.4, 4.1], [-0.4, 5.6, 3.5], BRZ, 0.8); B.quad([0.45, 2, 4.6], [0.45, 2, 5.5], [0.4, 6.4, 4.1], [0.4, 5.6, 3.5], BRZ, 0.8);
      B.at(new THREE.Matrix4().copy(R).multiply(new THREE.Matrix4().makeTranslation(0, 8.0, 5.55)).multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2 + Math.PI / 3 * 0)).multiply(new THREE.Matrix4().makeRotationX(0.5))).geo(new THREE.TorusGeometry(1.0, 0.2, 6, 12), BRZ, 1.15);
    }
    out.censers.push([p[0], 9.2, p[2]]); out.blobs.push([p[0], p[2], 10.5, 0.62]);
  }
  await ctx.yield();
  // --- bay trees in bronze tubs; the bucket and the mop at the end of the wet stripe
  for (const t of out.trees) if (Math.abs(t.az - 103.2) < 0.1) t.az = 98.8;      // (the tub nearest the path stands back a little, so the close pass does not clip its crown)
  for (const t of out.trees) { await ctx.yield(); const p = pz(t.az, t.r); t.p = p; lathe(B, I, TUB, 24, { flutes: 8, depth: 0.06 }, BRZ, 1, p[0], 0, p[2], 0.5); out.blobs.push([p[0], p[2], 6.5, 0.6]); }
  await ctx.yield();
  const bx = mop.x - 3.4, bz = mop.y - 2.6;
  lathe(B, I, [[1.5, 0, 0.8], [1.6, 0.2, 1], [2.0, 3.0, 1.05], [2.15, 3.2, 1.25], [1.9, 3.2, 0.6], [1.5, 0.5, 0.35], [0, 0.5, 0.3]], 14, {}, BRZ, 1, bx, 0, bz);
  B.at(new THREE.Matrix4().makeTranslation(bx, 3.1, bz).multiply(new THREE.Matrix4().makeRotationY(0.6)).multiply(new THREE.Matrix4().makeRotationX(0.35))).geo(new THREE.TorusGeometry(2.05, 0.12, 5, 14, Math.PI), BRZ, 1.2);
  const dir = new V3(mop.z - mop.x, 0, mop.w - mop.y).normalize(), mopM = new THREE.Matrix4().makeBasis(new V3(-dir.z, 0, dir.x), new V3(0, 1, 0), dir).setPosition(mop.x, 0, mop.y);
  S.at(new THREE.Matrix4().copy(mopM).multiply(new THREE.Matrix4().makeRotationX(-0.22))); S.box(-0.2, 0.3, -1, 0.2, 0.7, 10.5, WOOD, 1.0);
  S.at(mopM); S.box(-2.1, 0.02, -1.4, 2.1, 0.5, 0.6, WHITE, 0.95); S.box(-1.7, 0.5, -1.0, 1.7, 0.8, 0.2, WHITE, 0.75);
  out.blobs.push([bx, bz, 3.6, 0.6], [mop.x, mop.y, 3.4, 0.4]);
  out.bucket = [bx, bz];
  await ctx.yield();
  const revet = await S.buildSliced(ctx); await ctx.yield();
  const bronze = await B.buildSliced(ctx); await ctx.yield();
  const paving = PV.build(), granite = O.build();
  return { revet, bronze, paving, granite, ...out, tris: S.triangles + B.triangles + PV.triangles + O.triangles };
}

// ---------------------------------------------------------------------------------------------------------------
// garlands swagged round the drum, bay trees, and what has seeded itself on the rim of the eye
// ---------------------------------------------------------------------------------------------------------------
async function buildFoliage(ctx, rng, trees, flowers, density) {
  const L = makeLeafSoup(rng), C = (h) => new THREE.Color(h);
  const laurel = [C('#1d3a22'), C('#27492a'), C('#335a30'), C('#183020')], young = C('#55783a'), heart = C('#101f15');
  const bloom = [C('#e9e2d0'), C('#d8c9a8'), C('#f2ecdf')], gold = C('#c79a3e'), ribbon = flowers ? C('#b98a2e') : C('#7c1c2c'), bark = C('#3a2a1e');
  const att = [];
  for (let k = 0; k < 8; k++) { const A = k * 45; att.push([A - 3.5, k ? 123.9 : 127.2], [A + 3.5, k ? 123.9 : 127.2], [A + 11.25, 127.2], [A + 22.5, 127.2], [A + 33.75, 127.2]); }
  // a ball of small leaves round a dark heart: the crown of a clipped bay, the knot of a garland
  const leafBall = async (c, r, n, w, ph, squash = 1, cols = laurel) => {
    L.ball(c, r * 0.84, heart, 6, 10, w, ph, 1, squash);
    for (let j = 0; j < n; j++) {
      if ((j & 63) === 63) await ctx.yield();                              // sixty-four leaves a slice
      const y = rng.range(-1, 1), a = rng.range(0, 6.2832), h = Math.sqrt(1 - y * y), o = [h * Math.cos(a), y, h * Math.sin(a)], rr = r * rng.range(0.88, 1.03);
      const tg = new V3(rng.range(-1, 1), rng.range(-0.4, 1), rng.range(-1, 1)), ov = new V3().fromArray(o); tg.addScaledVector(ov, -tg.dot(ov)).normalize().addScaledVector(ov, 0.3);
      const top = 0.62 + 0.38 * (y * 0.5 + 0.5), fresh = rng.chance(0.07 + 0.1 * Math.max(y, 0));
      L.leafOn([c[0] + o[0] * rr, c[1] + o[1] * rr * squash, c[2] + o[2] * rr], tg.toArray(), o, r * rng.range(0.3, 0.42), r * rng.range(0.14, 0.2), fresh ? young : rng.pick(cols), w, ph, top * rng.range(0.8, 1.25));
    }
  };
  for (let i = 0; i < att.length; i++) {
    await ctx.yield();                                                      // one swag a slice
    const [z0, r0] = att[i], [z1raw, r1] = att[(i + 1) % att.length], z1 = z1raw < z0 ? z1raw + 360 : z1raw, ph = rng.range(0, 6.28);
    const span = (z1 - z0) * DEG * 126, sag = span * rng.range(0.2, 0.26), pts = [], rad = [], ws = [], n = 10;
    const mid = (s) => pz(lerp(z0, z1, s), lerp(r0, r1, s) - 0.9 * Math.sin(Math.PI * s), 61.2 - sag * 4 * s * (1 - s));
    for (let j = 0; j <= n; j++) { const s = j / n, b = Math.sin(Math.PI * s); pts.push(mid(s)); rad.push(0.55 + 0.6 * Math.pow(b, 0.7)); ws.push(b); }
    // the swag: a fat rope of laurel, thickest in the middle, shingled with small leaves that point down toward its lowest point
    const fr = L.tubeN(pts, rad, 7, heart, ws, ph, 1.1), nl = Math.round(150 * density);
    for (let j = 0; j < nl; j++) {
      if ((j & 63) === 63) await ctx.yield();
      const s = rng.range(0.02, 0.98), fi = Math.min(n - 1, Math.floor(s * n)), ft = s * n - fi, f0 = fr[fi], f1 = fr[fi + 1], th = rng.range(0, 6.2832), b = Math.sin(Math.PI * s);
      const c = f0.p.clone().lerp(f1.p, ft), rr = lerp(f0.r, f1.r, ft), o = f0.u.clone().multiplyScalar(Math.cos(th)).addScaledVector(f0.v, Math.sin(th)), q = f0.q.clone().multiplyScalar(s < 0.5 ? 1 : -1);
      const d = q.addScaledVector(o, rng.range(0.25, 0.7)).add(new V3(rng.range(-0.3, 0.3), rng.range(-0.45, 0.1), rng.range(-0.3, 0.3))), fl = flowers && rng.chance(0.1);
      const at = c.addScaledVector(o, rr * 0.92), top = 0.66 + 0.34 * (o.y * 0.5 + 0.5);
      L.leafOn(at.toArray(), d.toArray(), o.toArray(), rng.range(1.25, 1.9), rng.range(0.6, 0.9), fl ? rng.pick(bloom) : rng.chance(0.08) ? young : rng.pick(laurel), b, ph, top * (fl ? 1 : rng.range(0.8, 1.25)));
    }
    await ctx.yield();
    // a ribbon wound round it, and blossoms or gilt berries along its front
    const turns = 3.5, nr = 42;
    for (let j = 0; j < nr; j++) {
      const s0 = 0.06 + 0.88 * j / nr, s1 = 0.06 + 0.88 * (j + 1) / nr, row = [];
      for (const s of [s0, s1]) { const fi = Math.min(n - 1, Math.floor(s * n)), ft = s * n - fi, f0 = fr[fi], f1 = fr[fi + 1], th = s * turns * 6.2832 + ph, o = f0.u.clone().multiplyScalar(Math.cos(th)).addScaledVector(f0.v, Math.sin(th)), c = f0.p.clone().lerp(f1.p, ft).addScaledVector(o, lerp(f0.r, f1.r, ft) + 0.42); row.push([c.clone().addScaledVector(f0.q, -0.3).toArray(), c.clone().addScaledVector(f0.q, 0.3).toArray(), o.toArray(), Math.sin(Math.PI * s)]); }
      L.quadN([row[0][0], row[0][1], row[1][1], row[1][0]], [row[0][2], row[0][2], row[1][2], row[1][2]], ribbon, [row[0][3], row[0][3], row[1][3], row[1][3]], ph, 0.9);
    }
    for (let j = 0; j < 9; j++) {
      const s = (j + 0.5 + rng.range(-0.3, 0.3)) / 9, fi = Math.min(n - 1, Math.floor(s * n)), f0 = fr[fi], ctr = new V3().fromArray(mid(s)), inw = new V3(-ctr.x, 0, -ctr.z).normalize(), o = inw.multiplyScalar(0.8).add(new V3(0, rng.range(-0.7, 0.2), 0)).addScaledVector(f0.q, rng.range(-0.3, 0.3)).normalize();
      const c = ctr.addScaledVector(o, lerp(f0.r, fr[fi + 1].r, 0.5) + 0.5), e1 = new V3().crossVectors(o, f0.q).normalize(), e2 = new V3().crossVectors(o, e1), w = Math.sin(Math.PI * s), R = flowers ? rng.range(0.75, 1.05) : rng.range(0.4, 0.55), col = flowers ? rng.pick(bloom) : gold, on = o.toArray();
      const pt = (a, r, lift) => c.clone().addScaledVector(e1, Math.cos(a) * r).addScaledVector(e2, Math.sin(a) * r).addScaledVector(o, lift).toArray();
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.2832 + j; L.quadN([pt(a, 0.12 * R, 0.2), pt(a - 0.5, 0.7 * R, 0.12), pt(a, R, -0.05), pt(a + 0.5, 0.7 * R, 0.12)], [on, on, on, on], col, [w, w, w, w], ph, [0.8, 1.05, 1.2, 1.05]); }
      L.quadN([pt(0, 0.24 * R, 0.3), pt(1.57, 0.24 * R, 0.3), pt(3.14, 0.24 * R, 0.3), pt(4.71, 0.24 * R, 0.3)], [on, on, on, on], flowers ? gold : ribbon, [w, w, w, w], ph, 1.1);
    }
    // the knot where two swags meet: a boss of leaves, a hanging tail and two long ribbons
    const k0 = pz(z0, r0 - 0.5, 61.4), tail = [], tr = [], tw = [];
    await leafBall(k0, 1.75, Math.round(34 * density), 0.1, ph, 1, flowers ? [...laurel, ...bloom] : laurel);
    for (let j = 0; j <= 4; j++) { tail.push([k0[0], k0[1] - 1.2 - j * 1.8, k0[2]]); tr.push(0.8 - j * 0.16); tw.push(0.15 + j * 0.28); }
    const tf = L.tubeN(tail, tr, 5, heart, tw, ph, 1.1);
    for (let j = 0; j < 20; j++) { const fi = rng.int(0, 3), f0 = tf[fi], th = rng.range(0, 6.2832), o = f0.u.clone().multiplyScalar(Math.cos(th)).addScaledVector(f0.v, Math.sin(th)); L.leafOn(f0.p.clone().lerp(tf[fi + 1].p, rng()).addScaledVector(o, f0.r * 0.9).toArray(), [o.x * 0.6, -1, o.z * 0.6], o.toArray(), rng.range(1.2, 1.7), rng.range(0.55, 0.8), rng.pick(laurel), 0.2 + fi * 0.28, ph, rng.range(0.8, 1.2)); }
    const inw = new V3(-k0[0], 0, -k0[2]).normalize(), side = new V3(-inw.z, 0, inw.x), nI = inw.toArray();
    // (each ribbon curls and turns over as it falls, narrows, and ends in a swallow tail)
    for (const sg of [-1, 1]) {
      const len = rng.range(8, 11), seg = 10; let prev = null;
      for (let j = 0; j <= seg; j++) {
        const s = j / seg, tw = sg * (0.25 + 1.5 * s) + 0.45 * Math.sin(s * 6 + ph), ct = Math.cos(tw), stw = Math.sin(tw);
        const c = new V3(k0[0], k0[1] - 1.2 - len * (s - 0.06 * Math.sin(s * 6.3)), k0[2]).addScaledVector(side, sg * (0.4 + 2.1 * Math.pow(s, 0.8) + 0.5 * Math.sin(s * 7 + ph))).addScaledVector(inw, 0.75 + 0.55 * Math.sin(s * 5 + sg + ph));
        const wd = side.clone().multiplyScalar(ct).addScaledVector(inw, stw), hw = (0.62 - 0.2 * s) * (0.8 + 0.2 * Math.cos(s * 9 + ph)), nr = inw.clone().multiplyScalar(ct).addScaledVector(side, -stw).toArray();
        const cur = [c.clone().addScaledVector(wd, -hw).toArray(), c.clone().addScaledVector(wd, hw).toArray(), 0.1 + 1.3 * s, nr, 0.72 + 0.4 * Math.abs(ct)];
        if (prev) L.quadN([prev[0], prev[1], cur[1], cur[0]], [prev[3], prev[3], cur[3], cur[3]], ribbon, [prev[2], prev[2], cur[2], cur[2]], ph + sg, [prev[4] * 0.8, prev[4], cur[4], cur[4] * 0.8]);
        prev = cur;
      }
      const e0 = new V3().fromArray(prev[0]), e1 = new V3().fromArray(prev[1]), em = e0.clone().lerp(e1, 0.5).toArray();
      L.tri(prev[0], em, [e0.x, e0.y - 1.5, e0.z], ribbon, prev[2], ph + sg, 0.9); L.tri(em, prev[1], [e1.x, e1.y - 1.5, e1.z], ribbon, prev[2], ph + sg, 0.9);
    }
  }
  // bay trees: a clipped ball of small dark leaves on a clean stem
  const nLeaf = Math.round(420 * density);
  for (const t of trees) {
    await ctx.yield();
    const p = t.p, ph = rng.range(0, 6.28), top = 15.2 + rng.range(-0.8, 0.8), r = rng.range(4.6, 5.4);
    L.tubeN([[p[0], 3.6, p[2]], [p[0] + 0.2, 7.5, p[2]], [p[0], top - 2.5, p[2] + 0.2], [p[0], top - 0.5, p[2]]], [0.55, 0.45, 0.4, 0.3], 6, bark, [0, 0.05, 0.2, 0.3], ph, 1);
    L.ball([p[0], 4.05, p[2]], 2.7, C('#2a2018'), 2, 10, 0, ph, 1, 0.12);           // earth in the tub
    // the crown was clipped to a ball in spring and has grown since: one mass, five uneven lobes, shoots standing out of it
    await leafBall([p[0], top, p[2]], r * 0.8, Math.round(nLeaf * 0.46), 0.34, ph, 0.92);
    await ctx.yield();
    for (let j = 0; j < 5; j++) {
      const a = j / 5 * 6.2832 + rng.range(-0.5, 0.5), e = rng.range(-0.3, 0.8), d = r * rng.range(0.44, 0.62), c = [p[0] + Math.cos(a) * Math.cos(e) * d, top + Math.sin(e) * d * 0.9, p[2] + Math.sin(a) * Math.cos(e) * d];
      await leafBall(c, r * rng.range(0.4, 0.58), Math.round(nLeaf * 0.1), 0.42, ph + j * 0.7, rng.range(0.8, 1));
    }
    await ctx.yield();
    for (let j = 0; j < 9; j++) {
      const y = rng.range(-0.2, 1), a = rng.range(0, 6.2832), h = Math.sqrt(1 - y * y), o = new V3(h * Math.cos(a), y, h * Math.sin(a)), b = new V3(p[0], top, p[2]).addScaledVector(o, r * 0.92), up = o.clone().multiplyScalar(0.6).add(new V3(0, 0.8, 0)).normalize();
      for (let q = 0; q < 4; q++) { const at = b.clone().addScaledVector(up, q * 0.75), side = new V3(rng.range(-1, 1), rng.range(-0.2, 0.5), rng.range(-1, 1)).normalize(); L.leafOn(at.toArray(), up.clone().addScaledVector(side, 0.9).toArray(), o.toArray(), rng.range(1.3, 1.8), rng.range(0.5, 0.7), q > 1 ? young : rng.pick(laurel), 0.55 + q * 0.12, ph + j, rng.range(0.9, 1.25), 0.35); }
    }
  }
  await ctx.yield();
  // the rim: grass, ferns and one small fig, in the open air (second soup, its own material)
  const Rm = makeLeafSoup(rng), fresh = [C('#5d8a3a'), C('#7aa04a'), C('#4a7a34'), C('#a09a58')], Y = EYE_Y + 9.02;
  const nt = Math.round(64 * density);
  for (let i = 0; i < nt; i++) {
    const az = rng.range(0, 360), r = rng.range(27.6, 31), q = pz(az, r, Y), ph = rng.range(0, 6.28);
    for (let j = 0; j < 5; j++) { const a = rng.range(0, 6.28), h = rng.range(1.6, 3.4), ln = rng.range(0.3, 1.3), w = 0.24; Rm.tri([q[0] + Math.cos(a + 1.57) * w, Y, q[2] + Math.sin(a + 1.57) * w], [q[0] - Math.cos(a + 1.57) * w, Y, q[2] - Math.sin(a + 1.57) * w], [q[0] + Math.cos(a) * ln, Y + h, q[2] + Math.sin(a) * ln], rng.pick(fresh), [0, 0, 1.3], ph, rng.range(0.8, 1.25)); }
  }
  for (let i = 0; i < 14; i++) {
    const az = rng.range(0, 360), q = pz(az, rng.range(27.4, 29.6), Y), ph = rng.range(0, 6.28), col = fresh[i % 3];
    for (let f = 0; f < 7; f++) {
      const a = f / 7 * 6.28 + rng.range(-0.3, 0.3), len = rng.range(3.5, 5.5), ca = Math.cos(a), sa = Math.sin(a), px = -sa * 0.65, pzz = ca * 0.65;
      for (let j = 0; j < 4; j++) {
        const s0 = j / 4, s1 = (j + 1) / 4, w0 = 1 - s0 * 0.85, w1 = 1 - s1 * 0.85, y0 = Y + Math.sin(s0 * 2.4) * len * 0.42, y1 = Y + Math.sin(s1 * 2.4) * len * 0.42;
        Rm.quad([q[0] + ca * len * s0 + px * w0, y0, q[2] + sa * len * s0 + pzz * w0], [q[0] + ca * len * s0 - px * w0, y0, q[2] + sa * len * s0 - pzz * w0], [q[0] + ca * len * s1 - px * w1, y1, q[2] + sa * len * s1 - pzz * w1], [q[0] + ca * len * s1 + px * w1, y1, q[2] + sa * len * s1 + pzz * w1], col, [s0 * 1.4, s0 * 1.4, s1 * 1.4, s1 * 1.4], ph + f, 0.8 + 0.4 * s1);
      }
    }
  }
  const fa = rng.range(200, 330), fp = pz(fa, 29.2, Y), fph = rng.range(0, 6.28), figG = [C('#4f7f3a'), C('#6a9644'), C('#3f6a34')];
  Rm.tube([fp, [fp[0] + 0.4, Y + 2.2, fp[2] + 0.3], [fp[0] + 0.2, Y + 4.4, fp[2] - 0.5]], [0.42, 0.3, 0.2], 5, bark, [0, 0.15, 0.4], fph, 1.1);
  for (let b = 0; b < 5; b++) {
    const a = b / 5 * 6.28 + 0.4, e = [fp[0] + Math.cos(a) * 3.2, Y + 4.6 + rng.range(0, 2.4), fp[2] + Math.sin(a) * 3.2];
    Rm.tube([[fp[0] + 0.3, Y + 3 + b * 0.3, fp[2]], [(fp[0] + e[0]) / 2, e[1] - 0.4, (fp[2] + e[2]) / 2], e], [0.2, 0.15, 0.1], 4, bark, [0.3, 0.7, 1.1], fph, 1.1);
    for (let j = 0; j < 6; j++) { const s = rng.range(0.3, 1.05); Rm.leaf([lerp(fp[0], e[0], s), lerp(Y + 3.4, e[1], s) + rng.range(-0.3, 0.6), lerp(fp[2], e[2], s)], [rng.range(-1, 1), rng.range(-0.8, 0.3), rng.range(-1, 1)], rng.range(1.6, 2.3), rng.range(1.3, 1.8), rng.pick(figG), 0.5 + s, fph + j, rng.range(0.85, 1.25)); }
  }
  await ctx.yield();
  const hall = await L.buildSliced(ctx); await ctx.yield();
  return { hall, rim: Rm.build(), tris: L.triangles + Rm.triangles };
}

// one pigeon standing on the floor (nose +Z), for the dozen that strut in the noon sun before they go up. White vertex
// colour takes the instance colour; the neck sheen, wing bars, tail band and red feet are painted in.
function pigeonGeo() {
  const S = makeSoup(), W = new THREE.Color(1, 1, 1), NK = new THREE.Color(0.5, 0.74, 0.66), DK = new THREE.Color(0.36, 0.36, 0.42), RED = new THREE.Color(1.25, 0.42, 0.36), M = new THREE.Matrix4();
  const sph = (x, y, z, sx, sy, sz, rx, col, t, a = 10, b = 7) => S.at(M.makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeRotationX(rx)).multiply(new THREE.Matrix4().makeScale(sx, sy, sz))).geo(new THREE.SphereGeometry(1, a, b), col, t);
  sph(0, 1.2, -0.12, 0.7, 0.6, 1.26, -0.3, W, 1.0, 12, 8);          // body
  sph(0, 1.42, 0.6, 0.6, 0.58, 0.6, 0, W, 1.08, 10, 7);             // breast
  sph(0, 1.94, 0.96, 0.35, 0.56, 0.35, 0.25, NK, 0.95, 8, 6);       // neck
  sph(0, 2.47, 1.14, 0.33, 0.32, 0.38, 0, W, 0.9, 8, 6);            // head
  for (const sx of [-1, 1]) {
    sph(sx * 0.2, 2.53, 1.36, 0.07, 0.07, 0.05, 0, RED, 1.1, 5, 4);                                      // eye
    sph(sx * 0.6, 1.36, -0.32, 0.17, 0.44, 1.14, -0.32, W, 0.78, 8, 6);                                  // folded wing
    sph(sx * 0.74, 1.2, -0.52, 0.06, 0.3, 0.11, -0.32, DK, 1, 5, 4); sph(sx * 0.72, 1.12, -0.86, 0.06, 0.28, 0.11, -0.32, DK, 1, 5, 4);   // two dark bars
    S.at(null); S.quad([sx * 0.52, 1.2, -1.15], [sx * 0.7, 1.0, -1.2], [sx * 0.12, 0.92, -2.25], [sx * 0.05, 1.06, -2.1], DK, 1.1);        // primaries crossed over the tail
    S.box(sx * 0.3 - 0.07, 0, -0.07, sx * 0.3 + 0.07, 0.72, 0.07, RED, 1); S.box(sx * 0.3 - 0.17, 0, -0.12, sx * 0.3 + 0.17, 0.07, 0.44, RED, 1);
  }
  S.at(null);
  S.tri([-0.09, 2.5, 1.48], [0.09, 2.5, 1.48], [0, 2.4, 1.86], DK, 1.2); S.tri([-0.09, 2.5, 1.48], [0, 2.4, 1.86], [0, 2.58, 1.5], DK, 1.4); S.tri([0.09, 2.5, 1.48], [0, 2.58, 1.5], [0, 2.4, 1.86], DK, 1.4);
  for (let i = 0; i < 5; i++) {                                     // tail: five feathers, a dark band near the end
    const a0 = (i - 2.5) * 0.17, a1 = (i - 1.5) * 0.17, p = (a, l, y) => [Math.sin(a) * l, y, -1.05 - Math.cos(a) * l];
    S.quad(p(a0, 0.2, 1.12), p(a1, 0.2, 1.12), p(a1, 0.95, 0.92), p(a0, 0.95, 0.92), W, 0.72);
    S.quad(p(a0, 0.95, 0.92), p(a1, 0.95, 0.92), p(a1, 1.25, 0.84), p(a0, 1.25, 0.84), DK, 1);
    S.quad(p(a0, 1.25, 0.84), p(a1, 1.25, 0.84), p(a1, 1.38, 0.81), p(a0, 1.38, 0.81), W, 0.8);
  }
  return S.build();
}

// ---------------------------------------------------------------------------------------------------------------
// a pigeon on the wing, for the kit's flock shader (its attributes and wing conventions; nose +Z, metres before the
// flock's `size`). A plump lofted body with a keel, a pinched neck, a round head and a short beak; each wing is a
// cambered sheet of coverts with ten secondaries and nine primaries let into its rear edge as separate feathers
// (scalloped along the arm, fingered at the tip, the leading edge bent at the wrist); the tail is a fan of twelve.
// Vertex colour is not a colour here: r = tone, g = how dark the marking is, b = 1 (the instance tint's blue then
// carries how grey that bird is), and the flock's own fragment shader (pigeonFrag) turns it into a white dove or a
// blue-grey rock pigeon. Sheets carry their upper-side normal, so the shader can tell an underwing from a back.
// ---------------------------------------------------------------------------------------------------------------
const PG = { L: 0.4, G: 0.1, W: 0.5, C: 0.23, TL: 0.17, WRIST: 0.42 };
const PG_PLAN = [[0, 0], [0.2, 0.07], [0.42, 0.115], [0.62, 0.05], [0.82, -0.1], [1, -0.3]];      // leading edge: [span fraction, z / span]
function flyingPigeonGeo() {
  const g = new Geo(), { L, G, W, C, TL } = PG, K = (t, m) => new THREE.Color(t, m, 1), nrm = new Map();
  const R = (z, y, rx, ry, top, belly) => ({ z: z * L, y: y * G, rx: rx * G, ry: ry * G, top, belly });
  const back = K(0.9, 0.06), bel = K(1.02, 0), rump = K(1.1, 0), brs = K(1.04, 0.04), nkT = K(0.9, 0.4), nkB = K(0.96, 0.3), hd = K(0.94, 0.46), hdB = K(0.98, 0.36), bk = K(0.7, 0.9), cere = K(1.3, 0);
  g.loft([
    R(-0.5, 0.1, 0, 0, rump, bel), R(-0.44, 0.1, 0.22, 0.16, rump, bel), R(-0.36, 0.08, 0.42, 0.32, rump, bel), R(-0.26, 0.04, 0.62, 0.52, back, bel), R(-0.14, 0, 0.82, 0.74, back, bel),
    R(-0.02, -0.03, 0.96, 0.93, back, bel), R(0.08, -0.06, 1.0, 1.04, back, brs), R(0.16, -0.05, 0.94, 1.0, back, brs), R(0.22, 0, 0.8, 0.86, back, brs), R(0.27, 0.09, 0.62, 0.66, nkT, nkB),
    R(0.31, 0.2, 0.47, 0.49, nkT, nkB), R(0.345, 0.28, 0.43, 0.45, nkT, nkB), R(0.385, 0.34, 0.5, 0.5, hd, hdB), R(0.42, 0.36, 0.52, 0.52, hd, hdB), R(0.455, 0.34, 0.44, 0.46, hd, hdB),
    R(0.48, 0.28, 0.3, 0.32, hd, hdB), R(0.5, 0.22, 0.16, 0.15, cere, bk), R(0.535, 0.17, 0.09, 0.08, bk, bk), R(0.575, 0.11, 0, 0, bk, bk),
  ], { sides: 16, top: back, belly: bel });
  // smooth curve through [x, y] keys
  const curve = (P, s) => { let i = 0; while (i < P.length - 2 && s > P[i + 1][0]) i++; const p0 = P[Math.max(i - 1, 0)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(i + 2, P.length - 1)], h = p2[0] - p1[0], t = clamp((s - p1[0]) / h, 0, 1), m1 = (p2[1] - p0[1]) / (p2[0] - p0[0]) * h, m2 = (p3[1] - p1[1]) / (p3[0] - p1[0]) * h, t2 = t * t, t3 = t2 * t; return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (3 * t2 - 2 * t3) * p2[1] + (t3 - t2) * m2; };
  const sx0 = 0.5 * G, wy = 0.3 * G, wz = 0.19 * L, wr = PG.WRIST;
  const leadZ = (sf) => wz + W * curve(PG_PLAN, sf);
  const chord = (sf) => (sf <= wr ? lerp(1, 0.98, sf / wr) + 0.05 * Math.sin(Math.PI * sf / wr) : 0.98 * Math.pow(1 - Math.pow((sf - wr) / (1 - wr), 1.8), 0.85));     // of C
  const covert = (sf) => (sf <= wr ? lerp(0.44, 0.4, sf / wr) : lerp(0.4, 0.04, smoothstep(wr, 0.8, sf)));                                                               // where the flight feathers start
  // a vertex of a sheet: position, colour, its own upper-side normal, and the wing animation (metres out, side, trailing weight)
  const sv = (x, y, z, tone, mask, nx, ny, nz, tw) => { const i = g.v(x, y, z, K(tone, mask)); const l = Math.hypot(nx, ny, nz); nrm.set(i, [nx / l, ny / l, nz / l]); g.a[i * 4] = Math.max(0, x - sx0); g.a[i * 4 + 1] = 1; g.a[i * 4 + 2] = tw; return i; };
  const w0 = g.n, NS = 10, NP = 9, NF = NS + NP, rt = [], tp = [];
  // root fairing inside the body, then the coverts: three rows from the leading edge to the line the feathers leave from
  let prev = null;
  for (let i = -1; i <= NF; i++) {
    const sfR = i < 0 ? 0 : i <= NS ? wr * i / NS : wr + (0.8 - wr) * (i - NS) / NP, x = i < 0 ? 0.2 * G : sx0 + W * sfR, zl = leadZ(sfR), cv = C * covert(sfR), near = 1 - smoothstep(0, 0.14, sfR), ox = 0.2 + 0.3 * sfR;
    const yb = i < 0 ? 0.25 * G : 0, hand = smoothstep(wr, 0.8, sfR);
    const row = [sv(x, wy + yb - 0.004, zl + (i < 0 ? 0.04 * C : 0), lerp(0.84, 0.9, near), 0.12 * hand, ox, 1, 0.9, 0),
      sv(x, wy + yb + 0.011 * (1 - 0.6 * hand), zl - cv * 0.45, lerp(1.04, 0.92, near), 0, ox, 1, 0.22, 0.22),
      sv(x, wy + yb + 0.007 * (1 - 0.6 * hand), zl - cv - (i < 0 ? 0.3 * C : 0), lerp(0.9, 0.9, near), 0.05, ox, 1, -0.12, 0.45)];
    if (prev) { g.quad(prev[0], prev[1], row[1], row[0]); g.quad(prev[1], prev[2], row[2], row[1]); }
    prev = row;
    if (i >= 0) {
      rt.push([x, wy + 0.004 * (1 - hand), zl - cv + 0.012]);
      const sfT = i <= NS ? wr * 1.04 * i / NS : wr * 1.04 + (1 - wr * 1.04) * Math.pow((i - NS) / NP, 0.82);
      tp.push([sx0 + W * sfT, wy - 0.006, leadZ(sfT) - C * chord(sfT)]);
    }
  }
  // flight feathers: each its own five-sided blade with a tilt, lighter along its free edge and darker where the next one covers it
  for (let i = 0; i < NF; i++) {
    const prim = i >= NS, j = prim ? (i - NS + 0.5) / NP : 0, A = rt[i], B = rt[i + 1], TA = tp[i], TB = tp[i + 1], fs = prim ? lerp(0.8, 0.66, j) : 0.87, pinch = prim ? lerp(0.05, 0.3, j * j) : 0.03;
    const mix3 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)];
    const cR = mix3(A, B, 0.5), cT = mix3(TA, TB, 0.5), sA = mix3(mix3(A, TA, fs), mix3(cR, cT, fs), pinch), sB = mix3(mix3(B, TB, fs), mix3(cR, cT, fs), pinch + (prim ? 0.1 : 0));
    const tipC = mix3(mix3(TA, TB, prim ? 0.6 : 0.5), cR, -0.03), ax = B[0] - A[0], az = B[2] - A[2], al = Math.hypot(ax, az) || 1, tilt = 0.3;
    const nx = 0.3 + 0.2 * (A[0] - sx0) / W - tilt * ax / al, nz = -0.2 - tilt * az / al, sf = (cR[0] - sx0) / W, body = 1 - smoothstep(0.02, 0.16, sf), dk = prim ? lerp(0.55, 0.95, j) : 0.5;
    const tA = lerp(1.1, 0.95, body), tB = lerp(0.78, 0.92, body), twR = 0.45, y2 = (p, d) => [p[0], p[1] + d, p[2]];
    const a = sv(...y2(A, 0.003), tA * 0.92, 0.04, nx, 1, nz, twR), b = sv(...y2(B, -0.003), tB * 0.92, 0.04, nx, 1, nz, twR);
    const c = sv(...y2(sA, 0.003), tA, dk * 0.55, nx, 1, nz - 0.2, 0.9), d = sv(...y2(sB, -0.003), tB, dk * 0.55, nx, 1, nz - 0.2, 0.9), e = sv(...tipC, (tA + tB) * 0.5, dk, nx, 1, nz - 0.3, 1);
    g.quad(a, b, d, c); g.tri(c, d, e);
  }
  const wrng = [w0, g.n], m0 = g.n; g.mirror(wrng);
  for (let i = m0; i < g.n; i++) { const s = nrm.get(w0 + i - m0); nrm.set(i, [-s[0], s[1], s[2]]); }
  // tail: a fan of twelve feathers from under the rump, a dark band before the pale tips
  const tz = -0.5 * L + 0.12 * L, FA = 0.6, NT = 12, tv = (a, r, y, tone, mask, tilt, w) => { const i = g.v(Math.sin(a) * r, y, tz + 0.02 - Math.cos(a) * r, K(tone, mask)); const l = Math.hypot(tilt, 1, 0.22); nrm.set(i, [tilt * Math.cos(a) / l, 1 / l, (tilt * Math.sin(a) - 0.1) / l]); g.a[i * 4 + 3] = w; return i; };
  for (let i = 0; i < NT; i++) {
    const a0 = lerp(-FA, FA, i / NT), a1 = lerp(-FA, FA, (i + 1) / NT), am = (a0 + a1) / 2, da = (a1 - a0) * 0.06, len = (0.02 + TL) * (1 - 0.13 * (am / FA) * (am / FA)), yb = 0.085 * G + 0.008 * (1 - (am / FA) * (am / FA)), sg = am < 0 ? -1 : 1;
    const tA = sg > 0 ? 1.08 : 0.8, tB = sg > 0 ? 0.8 : 1.08, tl = -0.3 * sg, dy = 0.0025 * sg;
    const a = tv(a0, 0.03, yb + dy, tA * 0.9, 0, tl, 0), b = tv(a1, 0.03, yb - dy, tB * 0.9, 0, tl, 0), c = tv(a0, len * 0.6, yb * 0.6 + dy, tA, 0.12, tl, 0.6), d = tv(a1, len * 0.6, yb * 0.6 - dy, tB, 0.12, tl, 0.6);
    const e = tv(a0 + da, len * 0.9, yb * 0.3 + dy, tA, 0.85, tl, 0.9), f = tv(a1 - da, len * 0.9, yb * 0.3 - dy, tB, 0.85, tl, 0.9), h = tv(am, len, yb * 0.25, 1, 0.35, tl, 1);
    g.quad(a, b, d, c); g.quad(c, d, f, e); g.tri(e, f, h);
  }
  const geo = g.build(), nn = geo.attributes.normal;
  for (const [i, s] of nrm) nn.setXYZ(i, s[0], s[1], s[2]);
  return geo;
}
// The flock's fragment shader, replaced before it is first compiled. The kit lights a whole flock with one sun and a
// sky; here a bird is lit like the stones: by the sun only while it is in the beam (white, rim-lit, its wings glowing
// where the light comes through them), by the warm bounce off the disc, and otherwise by the hall's own soft grey
// (the flock light's sky and ground, which the world sets every frame, with its sunColor as the beam's strength).
function pigeonFrag(GLSL) {
  const { L, G, W, C } = PG, f = (x) => x.toFixed(4);
  return /* glsl */`
#include <fog_pars_fragment>
` + GLSL + /* glsl */`
uniform vec3 uSkyColor, uGroundColor;
varying vec3 vColor, vN, vWorld, vEmit, vLocal; varying float vThin;
void main(){
  vec3 Nr = normalize(vN + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vWorld);
  float facing = dot(Nr, V), wing = step(0.5, vThin);
  float sheet = max(wing, step(vLocal.z, ${f(-0.5 * L - 0.004)}));
  float under = sheet*step(facing, 0.);
  vec3 N = facing < 0. ? -Nr : Nr;
  float k = clamp(vColor.b, 0., 1.), tone = vColor.r, mk = clamp(vColor.g, 0., 1.);
  // two dark bars across the inner wing of a grey bird, seen from above
  float ax = (abs(vLocal.x) - ${f(0.5 * G)})/${f(W)}, cz = (${f(0.19 * L)} + ${f(W)}*0.25*ax - vLocal.z)/${f(C)};
  float bar = wing*(1. - under)*smoothstep(0.05, 0.11, ax)*(1. - smoothstep(0.37, 0.46, ax))
    *max(smoothstep(0.38, 0.43, cz)*(1. - smoothstep(0.5, 0.55, cz)), smoothstep(0.68, 0.73, cz)*(1. - smoothstep(0.8, 0.86, cz)));
  mk = max(mk, bar*0.85*smoothstep(0.4, 0.8, k));
  // the underwing is pale: there the dark keeps to the tips and the trailing edge
  mk *= 1. - 0.5*under*wing;
  vec3 coat = mix(vec3(0.88, 0.86, 0.82), vec3(0.45, 0.48, 0.55), k);
  coat = mix(coat, mix(vec3(0.92, 0.9, 0.87), vec3(0.72, 0.73, 0.77), k), under*wing);
  vec3 dark = mix(vec3(0.52, 0.5, 0.49), vec3(0.1, 0.105, 0.13), k);
  vec3 alb = mix(coat, dark, mk)*tone;
  // the neck of a grey bird: green and purple gloss that turns with the view
  float bz = vLocal.z/${f(L)}, neck = (1. - sheet)*smoothstep(0.2, 0.27, bz)*(1. - smoothstep(0.35, 0.4, bz))*k*smoothstep(-0.3, 0.3, N.y);
  float fn = 1. - max(dot(N, V), 0.);
  alb = mix(alb, mix(vec3(0.12, 0.42, 0.3), vec3(0.42, 0.2, 0.5), smoothstep(0.2, 0.8, fn + 0.3*sin(vLocal.y*140.)))*1.15, neck*0.42);
  // eye: a dark bead in an orange ring
  vec3 ev = vLocal - vec3(sign(vLocal.x)*${f(0.4 * G)}, ${f(0.4 * G)}, ${f(0.45 * L)});
  float ed = length(ev)/${f(0.1 * G)}, eb = (1. - sheet)*(1. - smoothstep(0.75, 1.1, ed));
  alb = mix(alb, mix(vec3(0.02), vec3(0.85, 0.36, 0.1), smoothstep(0.45, 0.6, ed)), eb);
  // soft scales of small feathers, only where they are big enough to draw
  vec2 q = vec2(vLocal.x*46., (vLocal.z + vLocal.y*0.6)*40.); q.x += 0.5*floor(q.y);
  float fw = max(fwidth(q.x), fwidth(q.y));
  vec2 sf = fract(q) - vec2(0.5, 0.);
  alb *= 1. + 0.2*(smoothstep(0., 0.6, sf.y)*(1. - smoothstep(0.25, 0.5, abs(sf.x))) - 0.4)*(1. - smoothstep(0.2, 0.6, fw));
  // light
  // (the beam's edge is taken a few metres soft for a bird: the lit haze round the shaft reaches it first)
  vec2 hb = vWorld.xz + (uSunDir.xz/max(uSunDir.y, 0.02))*max(uEye.x - vWorld.y, 0.);
  float lit = max(oculusSun(vWorld), (1. - smoothstep(uEye.y - 2., uEye.y + 10., length(hb)))*uCloud.z*0.8), ndl = dot(N, uSunDir);
  vec3 sun = uSunColor*lit;
  vec3 hemi = mix(uGroundColor, uSkyColor, N.y*0.5 + 0.5);
  vec4 b = ocBounce(vWorld);
  vec3 col = alb*(hemi + uBounceCol*((max(dot(N, b.xyz), 0.)*0.8 + 0.2)*b.w*1.6) + sun*(max(ndl*0.65 + 0.35, 0.) + 0.34));
  col += alb*vec3(1., 0.84, 0.62)*sun*(sheet*max(-ndl, 0.)*1.2);          // sun through the feathers
  float fr = fn*fn*fn;
  col += (sun*0.95 + uSkyColor*0.4)*fr*(0.3 + 0.7*alb);                     // the rim: bright in the beam, a cool thread out of it
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
}
// hand a kit flock the pigeon: geometry, shader, the stones' uniforms, and what each bird is. o: { grey(i) -> 0 white .. 1 grey,
// level (how far the body follows a climb or a dive), bank }
function fitPigeon(flock, geo, hero, o = {}) {
  const m = flock.material, G = flock.geometry, HU = hero.uniforms;
  for (const k of ['uFill', 'uAmbient', 'uBouncePos', 'uBounceCol', 'uSky', 'uCandle', 'uLamp', 'uBounceK', 'uOuter', 'uEye', 'uCloud']) m.uniforms[k] = HU[k];
  m.fragmentShader = pigeonFrag(hero.GLSL);
  if (o.level !== undefined) m.defines.LEVEL = o.level.toFixed(3);
  if (o.bank !== undefined) m.uniforms.uBank.value = o.bank;
  m.uniforms.uFlap.value.w = PG.WRIST;
  for (const k of ['position', 'normal', 'color', 'aAnim', 'aPivot', 'aGlow']) G.setAttribute(k, geo.attributes[k]);
  G.setIndex(geo.index);
  const T = G.attributes.iTint; for (let i = 0; i < T.count; i++) T.setXYZ(i, T.getX(i), 1, o.grey ? o.grey(i) : 1);
  T.needsUpdate = true;
  return flock;
}

// what each seeded look does to the sky, the haze and the grade
const LOOK = {
  summer: { fog: 0.00155, cover: 0.5, cloudGain: 1.0, stars: 0, overcast: 0, disc: [0.02, 3], exposure: 1.16, sat: 1.1, tint: '#fff7ea', shadow: '#0b1226', portal: '#ffe2a6' },
  april: { fog: 0.0017, cover: 0.42, cloudGain: 1.08, stars: 0, overcast: 0, disc: [0.02, 3], exposure: 1.16, sat: 1.06, tint: '#f6faff', shadow: '#0c1428', portal: '#ffeccc' },
  shower: { fog: 0.0019, cover: 0.46, cloudGain: 0.9, stars: 0, overcast: 0, disc: [0.02, 3], exposure: 1.2, sat: 1.04, tint: '#f4f6fa', shadow: '#0c1220', portal: '#ffd9a0' },
  snow: { fog: 0.0023, cover: 0.3, cloudGain: 0.9, stars: 0, overcast: 0.8, disc: [0.03, 1.2], exposure: 1.42, sat: 0.92, tint: '#eef3ff', shadow: '#10182c', portal: '#ffd6a0' },
  night: { fog: 0.0015, cover: 0.58, cloudGain: 0.55, stars: 1, overcast: 0, disc: [0.028, 5], exposure: 1.6, sat: 0.84, tint: '#f0f1f6', shadow: '#07080e', portal: '#cfe0ff' },
};

export default {
  id: 'oculus-day',
  name: 'One Day under the Oculus',
  category: 'interior',
  weirdness: 0.2,
  media: ['interior'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    let look = LOOKS[Math.floor(rng.fork('look')() * LOOKS.length) % LOOKS.length];
    if (vary.hour === 'night') look = 'night'; else if (vary.hour && vary.hour !== 'any' && look === 'night') look = 'summer';
    if (rare && look !== 'summer' && look !== 'april') look = 'summer';          // the petals want the copper beam
    const LK = LOOK[look], night = look === 'night', april = look === 'april', cast = rng.fork('cast'), flowers = cast.chance(0.45), pigeonCast = cast.pick(['grey', 'white', 'mixed']);
    const C = (h) => new THREE.Color(h);
    const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x2a3450, LK.fog); scene.background = new THREE.Color(0x04060b);
    const time = { value: 0 };

    // ------------------------------------------------------------------ the hero and the clock
    const clock = makeClock(look), dayOf = clock.dayOf, sunAt = clock.sunAt;
    const hero = await buildHero(ctx, { palette: PALETTE, look, rare, drum: 'attic', sunAt });
    scene.add(hero.object);
    await ctx.yield();
    const built = buildPath(hero.anchors), path = built.path;
    await ctx.yield();
    clock.setPath(path); const uNoon = clock.uNoon;
    hero.setProgress(0.1);
    const A = hero.anchors, seat = A.portalSeat.position.clone();
    await ctx.yield();

    // ------------------------------------------------------------------ stone, bronze, columns
    const K = { WHITE: C('#c4bcb0'), GIALLO: C('#b98a3c'), PORPH: C('#6b2a3c'), GREEN: C('#476452'), GREY: C('#85837f'), DARK: C('#4a2c36'),
      BRZ: C('#7a5026').lerp(C(PALETTE[4]), 0.14), WOOD: C('#6a4a30'), ONE: C('#b9b2a6'), GRAN: C('#8b8884'), ROSE: C('#96807a') };
    const room = await buildRoom(ctx, rng.fork('room'), K, hero.mop);
    await ctx.yield();
    const revetMat = hero.makeStoneMaterial({ kind: 'revet', vertexColors: true, gloss: 0.3, outer: true });
    const bronzeMat = hero.makeStoneMaterial({ kind: 'bronze', vertexColors: true, gloss: 0.5, outer: true });
    const pavingMat = hero.makeStoneMaterial({ kind: 'paving', vertexColors: true, gloss: 0.32, outer: true });
    const graniteMat = hero.makeStoneMaterial({ kind: 'granite', vertexColors: true, gloss: 0.26, outer: true });
    const colMat = hero.makeStoneMaterial({ kind: 'marble', vertexColors: true, gloss: 0.42 });
    const addMesh = (geo, mat, name, cull = true) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.frustumCulled = cull; scene.add(m); return m; };
    addMesh(room.revet, revetMat, 'revetment', false); addMesh(room.bronze, bronzeMat, 'bronze', false); addMesh(room.paving, pavingMat, 'paving', false); addMesh(room.granite, graniteMat, 'portico');
    await ctx.yield();
    const cg = await columnGeos(ctx), mI = new THREE.Matrix4(), qI = new THREE.Quaternion(), sI = new V3(), pI = new V3();
    const instanced = (geo, mat, list, colorOf, name) => {
      const im = new THREE.InstancedMesh(geo, mat, list.length); im.name = name;
      list.forEach((c, i) => { qI.setFromAxisAngle(new V3(0, 1, 0), Math.atan2(c.p[0], c.p[2]) + (c.spin ?? 0)); im.setMatrixAt(i, mI.compose(pI.fromArray(c.p), qI, sI.setScalar(c.r))); im.setColorAt(i, colorOf(c, i)); });
      im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); scene.add(im); return im;
    };
    await ctx.yield();
    const shaftCols = [K.GIALLO.clone().multiplyScalar(1.12), C('#d8d0c6'), K.PORPH.clone().multiplyScalar(1.15)], capCol = C('#d6cfc2'), hallCols = [...room.hallCols, ...room.shrineCols];
    instanced(cg.shaft, colMat, hallCols, (c) => shaftCols[c.c], 'shafts');
    instanced(cg.capBase, colMat, hallCols, (c) => (c.c === 2 ? C(PALETTE[4]).multiplyScalar(0.9) : capCol), 'capitals');
    instanced(cg.shaft, graniteMat, room.porticoCols, (c, i) => (i % 3 === 1 ? K.GRAN : K.ROSE).clone().multiplyScalar(1.05), 'portico-shafts');
    instanced(cg.capBase, graniteMat, room.porticoCols, () => C('#b3aca2'), 'portico-capitals');
    scene.add(makeBlobs(room.blobs));
    await ctx.yield();

    // ------------------------------------------------------------------ the two bronze leaves (12 m wide, 35 tall), hinged at the outer end of the passage
    const leaves = [], leafMat = hero.makeStoneMaterial({ kind: 'bronze', vertexColors: true, gloss: 0.62, outer: true }); leafMat.defines.OC_LEAF = 1;
    for (const sx of [-1, 1]) {
      const L = makeSoup(), d = -sx, hemi = new THREE.SphereGeometry(1, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2), bM = new THREE.Matrix4(), bR = new THREE.Matrix4(), bS = new THREE.Matrix4();                                        // the leaf runs from its hinge toward the axis
      const bx = (x0, y0, z0, x1, y1, z1, t, skip) => L.box(Math.min(d * x0, d * x1), y0, z0, Math.max(d * x0, d * x1), y1, z1, K.BRZ, t, skip);
      bx(0, 0, -0.45, 11.9, 41, 0.45, 0.8);
      for (const z of [-1, 1]) {
        for (let j = 0; j < 3; j++) { const y0 = 1.6 + j * 11.2; bx(1.2, y0, z * 0.45, 10.7, y0 + 9.8, z * 0.75, 1.0); bx(2.3, y0 + 1.1, z * 0.75, 9.6, y0 + 8.7, z * 0.95, 0.72); bx(3.4, y0 + 2.2, z * 0.95, 8.5, y0 + 7.6, z * 1.2, 1.1); }
        // cast relief: bosses down both stiles and along every rail, and in each panel a roundel (a ring round a domed
        // boss) between four small studs
        const boss = (x, y, zz, r, t) => L.at(bM.makeTranslation(d * x, y, z * zz).multiply(bR.makeRotationX(z * Math.PI / 2)).multiply(bS.makeScale(r, r, r))).geo(hemi, K.BRZ, t);
        for (let j = 0; j < 15; j++) { for (const x of [0.6, 11.3]) boss(x, 1 + j * 2.78, 0.45, 0.4, 1.5); if (j % 5 === 4) await ctx.yield(); }
        for (let j = 0; j < 4; j++) { for (let i = 0; i < 4; i++) boss(2.4 + i * 2.37, 0.85 + j * 11.2 + (j === 3 ? 1.2 : 0), 0.45, 0.34, 1.45); await ctx.yield(); }
        for (let j = 0; j < 3; j++) {
          const yc = 1.6 + j * 11.2 + 4.9;
          L.at(new THREE.Matrix4().makeTranslation(d * 5.95, yc, z * 1.2)).geo(new THREE.TorusGeometry(1.75, 0.3, 5, 14), K.BRZ, 1.5);
          boss(5.95, yc, 1.2, 1.05, 1.7);
          for (const [ox, oy] of [[-1.9, -2.1], [1.9, -2.1], [-1.9, 2.1], [1.9, 2.1]]) boss(5.95 + ox, yc + oy, 1.2, 0.26, 1.5);
          await ctx.yield();
        }
        for (let i = 0; i < 3; i++) bx(1.6 + i * 3.1, 36.4, z * 0.45, 4.1 + i * 3.1, 39.9, z * 0.72, 1.05);
        L.at(new THREE.Matrix4().makeTranslation(d * 10.2, 13, z * 1.0)).geo(new THREE.TorusGeometry(1.1, 0.22, 6, 14), K.BRZ, 1.6); L.at(null);
      }
      const mesh = addMesh(L.build(), leafMat, 'leaf', false); mesh.position.set(sx * 12, 0, 166); leaves.push({ mesh, sx });
      await ctx.yield();
    }
    const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(24, 44).translate(0, 22, 0), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uCol: { value: new THREE.Color() }, uT: time },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
      // incense haze climbing through the light of the doorway
      fragmentShader: `uniform vec3 uCol; uniform float uT; varying vec2 vUv;
        float hh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); return mix(mix(hh(i), hh(i + vec2(1., 0.)), f.x), mix(hh(i + vec2(0., 1.)), hh(i + vec2(1., 1.)), f.x), f.y); }
        void main(){ float a = (1. - abs(vUv.x - 0.5)*1.4)*(0.55 + 0.45*vUv.y);
          float n = vn(vUv*vec2(2.2, 5.) + vec2(uT*0.35, -uT*0.5))*0.65 + vn(vUv*vec2(5., 11.) + vec2(-uT*0.5, -uT*0.9))*0.35;
          gl_FragColor = vec4(uCol*a*(0.16 + 0.6*n), 1.); }` }));
    doorGlow.position.set(0, 0, 150); doorGlow.name = 'door-haze'; scene.add(doorGlow);
    const setDoors = (u) => { const th = lerp(29, 87, smoothstep(0.008, 0.044, u)) * DEG; for (const l of leaves) l.mesh.rotation.y = -l.sx * th; };
    setDoors(0);

    // ------------------------------------------------------------------ foliage
    await ctx.yield();
    const fol = await buildFoliage(ctx, rng.fork('fol'), room.trees, flowers, density * (0.6 + 0.4 * detail));
    addMesh(fol.hall, foliageMaterial(hero, time, false), 'garlands', false); addMesh(fol.rim, foliageMaterial(hero, time, true), 'rim-plants');
    await ctx.yield();

    // ------------------------------------------------------------------ sky, outside
    const sky = makeSkyDome(hero, { wind: hero.wind, stars: LK.stars, cover: LK.cover, cloudGain: LK.cloudGain, discSize: LK.disc[0], discGain: LK.disc[1], overcast: LK.overcast });
    scene.add(sky.mesh);
    await ctx.yield();
    {
      const T = makeSoup(), cr = rng.fork('town'), tones = [C('#b7a48c'), C('#a8937c'), C('#c2b29a'), C('#9c8a7a')], roof = C('#8a5a44');
      for (let i = 0; i < 70; i++) {
        const a = cr.range(0, 360), r = cr.range(330, 900), p = pz(a, r), w = cr.range(18, 46), d = cr.range(18, 46), h = cr.range(22, 60) * (cr.chance(0.1) ? 2 : 1);
        if (Math.abs(p[0]) < 120 && p[2] > 0) continue;
        T.at(new THREE.Matrix4().makeTranslation(p[0], 0, p[2]).multiply(new THREE.Matrix4().makeRotationY(cr.range(0, 3.14))));
        T.box(-w, -1, -d, w, h, d, cr.pick(tones), 1, 'y'); T.prism([[-w - 1, h], [w + 1, h], [0, h + w * 0.35]], -d - 1, d + 1, roof, 0.9);
        if (i % 16 === 15) await ctx.yield();
      }
      addMesh(T.build(), hero.makeStoneMaterial({ kind: 'plain', vertexColors: true, outer: true, gloss: 0.02 }), 'town');
    }
    await ctx.yield();
    // across the square from the porch stands a temple front in the open sun: eight white columns before a red wall.
    // Seen from the hall it fills the doorway: by day a white glare, by night moonlit shafts in a dim blue slot
    const openU = { value: new THREE.Vector2(night ? 1.0 : 2.6, night ? 0.6 : 0.14) };
    {
      const Q = makeSoup(), stone = C('#cfc6b6'), red = C('#7c3828'), dark = C('#2a1c18'), M4 = new THREE.Matrix4();
      Q.box(-84, -0.5, 318, 84, 1.2, 380, stone, 0.8, 'y'); Q.box(-80, 1.2, 322, 80, 2.4, 380, stone, 0.9, 'y'); Q.box(-76, 2.4, 326, 76, 3.6, 380, stone, 1.0, 'y');
      for (const x of [-66.5, -47.5, -28.5, -9.5, 9.5, 28.5, 47.5, 66.5]) {
        Q.at(M4.makeTranslation(x, 3.6, 334));
        Q.geo(latheGeo([[4.9, 0, 0.8], [5.0, 1.0, 1], [4.3, 1.6, 0.8], [4.0, 2.2, 1, 1], [3.9, 30, 1, 1], [3.45, 70, 1, 1], [3.9, 70.6, 0.9], [4.8, 74.5, 0.85], [5.2, 75, 1]], 24, { flutes: 8, depth: 0.05 }), stone, 1);
        await ctx.yield();
      }
      Q.at(null); Q.box(-72, 78.6, 328, 72, 92, 340, stone, 0.95, 'Y'); Q.box(-74, 92, 326.5, 74, 95, 342, stone, 1.05);
      Q.box(-70, 3.6, 352, 70, 78.6, 356, red, 1.0, 'xXyYZ');
      Q.box(-8, 3.6, 351.2, 8, 46, 352, stone, 1.0, 'yZ'); Q.box(-5.6, 3.6, 350.9, 5.6, 42, 351.2, dark, 1.0, 'yZ');
      for (const sx of [-1, 1]) for (const xx of [19, 38, 57]) { Q.box(sx * xx - 5.5, 16, 351.4, sx * xx + 5.5, 52, 352, stone, 0.92, 'yYZ'); Q.box(sx * xx - 4.3, 17.2, 351.2, sx * xx + 4.3, 50.8, 351.4, red, 0.7, 'yYZ'); }
      addMesh(Q.build(), hero.makeStoneMaterial({ kind: 'granite', vertexColors: true, open: true, gloss: 0.05, uniforms: { uOpen: openU } }), 'square');
    }
    await ctx.yield();

    // ------------------------------------------------------------------ flames, halos, incense, dry leaves
    const set = fx.fxGroup(); scene.add(set.object);
    const flames = INT.makeFlames({ flames: room.flames, rng: rng.fork('flames'), gain: night ? 0.7 : look === 'snow' || look === 'shower' ? 0.55 : 0.42 }); scene.add(flames.object);
    await ctx.yield();
    const halos = set.add(fx.makeGlows({ rng: rng.fork('halo'), time, positions: [...room.flames.map((f) => [f[0], f[1] + f[3] * 0.4, f[2]]), ...room.censers.map((c) => [c[0], c[1] - 0.4, c[2]])],
      sizes: [...room.flames.map((f) => 0.5 + f[3] * 0.3), ...room.censers.map(() => 1.7)], colors: [...room.flames.map(() => '#ffb060'), ...room.censers.map(() => '#ff7a30')], size: night ? 9 : 7, intensity: night ? 1.1 : look === 'shower' ? 0.85 : 0.6, flicker: 0.5, halo: 1, core: 0.3 })), haloBase = night ? 1.1 : look === 'shower' ? 0.85 : 0.6;
    await ctx.yield();
    const smokes = [];
    for (let i = 0; i < room.censers.length; i++) {
      smokes.push(set.add(fx.makeSmokeColumn({ rng: rng.fork('smoke' + i), time, position: room.censers[i], height: 120, radius: [1.0, 10], size: [3.5, 20], count: Math.round(60 * detail),
        color: '#77809a', colorTop: '#9aa2b8', shadowColor: '#1c2030', ambient: '#0a0c14', opacity: 0.12, rate: 0.03, wind: [0.5, 0, 0.22], bend: 0.3, sunDir: [0, 1, 0], sunColor: '#ffffff', scatter: 0.5, rim: 0.3 })));
      await ctx.yield();
    }
    set.add(fx.makeParticles({ rng: rng.fork('leaves'), preset: 'leaves', time, follow: false, center: [0, 3.2, 152], box: [44, 6.4, 196], count: Math.round(230 * detail * density), velocity: [0.5, -0.1, -7.5], velocityRandom: [1.6, 0.5, 2.5],
      size: [0.7, 1.5], colors: night ? ['#2a3040', '#3a4050', '#202838'] : ['#6a4a2a', '#8a6a3a', '#4a3a22'], intensity: night ? 0.5 : 0.8 }));
    await ctx.yield();
    // a gust at eye height through the portico and the passage
    set.add(fx.makeParticles({ rng: rng.fork('gust'), preset: 'leaves', time, follow: false, center: [0, 15, 186], box: [42, 24, 120], count: Math.round(170 * detail * density), velocity: [0.9, -0.35, -9.5], velocityRandom: [2.2, 1.2, 3],
      size: [0.8, 1.7], colors: night ? ['#8a94b4', '#a0a8c4', '#6a7494'] : ['#b08a4a', '#c8a45a', '#8a6a3a'], intensity: night ? 0.7 : 1.0 }));
    await ctx.yield();
    // the shower falls on the square too: seen from the hall as silver streaks in the doorway, beyond the porch
    const doorRain = look === 'shower' ? set.add(fx.makeParticles({ rng: cast.fork('rain'), preset: 'rain', time, follow: false, center: [0, 40, 292], box: [84, 80, 56], count: Math.round(2600 * detail), velocity: [3, -64, 1.5], velocityRandom: [1, 14, 1], size: [0.3, 0.62], stretch: 0.06, intensity: 1.4, opacity: 0 })) : null;
    doorRain?.setOpacity(0);
    await ctx.yield();
    const doorMist = set.add(fx.makeMist({ rng: rng.fork('mist'), time, count: Math.round(26 * detail), area: [34, 26, 84], center: [0, 15, 172], size: [14, 30], color: '#8fa0c8', opacity: 0.15, drift: [0.25, 0.1, 2.6], flatten: 0.7, floorFade: 0.6 }));
    await ctx.yield();

    // ------------------------------------------------------------------ birds: swifts (bats at night) in the beam and round the hall, pigeons
    const st = hero.state, vc = path.length / DUR;
    const lightA = { _resolved: true, sunDir: st.sunDir, sunColor: new THREE.Color(), sky: new THREE.Color(), ground: new THREE.Color() };
    const lightP = { _resolved: true, sunDir: st.sunDir, sunColor: new THREE.Color(), sky: new THREE.Color(), ground: new THREE.Color() };
    const lightB = { _resolved: true, sunDir: st.sunDir, sunColor: new THREE.Color(), sky: new THREE.Color(), ground: new THREE.Color() };
    const sw = night ? { species: 'bats', form: 'loose', size: 4.2, flap: 6 } : { species: 'swifts', size: 3.9 };
    const ring = (r, y, amp, n = 8, tilt = 0) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; o.push([Math.cos(a) * r, y + Math.sin(a * 2 + 1) * amp + Math.cos(a) * tilt, Math.sin(a) * r]); } return o; };
    const birds = [], add = (f, mode, light) => { f.setLight(light); f.mode = mode; f.light = light; scene.add(f.object); birds.push(f); return f; };
    const beamSwifts = add(F.makeFlock({ rng: rng.fork('sw1'), ...sw, count: Math.round(20 * density), speed: 24, spread: [9, 8, 26], wander: [5, 4, 5, 0.9], route: ring(15, 0, 6, 8, 5), closed: true }), 'time', lightA);
    await ctx.yield();
    add(F.makeFlock({ rng: rng.fork('sw2'), ...sw, count: Math.round(12 * density), speed: 21, spread: [12, 9, 30], wander: [6, 5, 6, 0.8], route: ring(58, 118, 24, 9, 10), closed: true }), 'time', lightB);
    await ctx.yield();
    // the nine under the eye (the designer's staging): a ring about the dome's axis 14 m under the eye plane and wide enough that the lens
    // rises through its middle with clear air, its whole reach below the eye plane and clear of the rim and the shell: they wheel round the
    // eye's edge from underneath, across the nearest coffers and the beam. Their scatter is three quarters of what it was, held by the kit
    // within three scatters; by place no bird's reach is within 2 m of the lens in the picture, or 1 m outside it, at any clock
    add(F.makeFlock({ rng: rng.fork('sw3'), ...sw, size: sw.size * 1.3, count: 9, speed: 20, spread: [3, 2, 70], wander: [1.8, 1.4, 1.8, 0.9], maxSigma: 3, route: ring(28, EYE_Y - 14, 2, 10, 1), closed: true }), 'time', lightA);
    await ctx.yield();
    // the loop over the door and the wide ring fly by the clock, so a bird may be anywhere along its course when the lens passes under. The
    // door party keeps its low pass before the bronze door (the designer's ruling): its scatter is a half of what it was and its two points
    // over the lens's line stand 1.2 m higher than at first; the wide ring stands 6 m higher. The kit holds each dealt place within three
    // scatters, so that by place no bird's reach is within 2 m of the lens in the picture, or 1 m outside it, at any clock
    add(F.makeFlock({ rng: rng.fork('sw4'), ...sw, count: 14, speed: 19, spread: [4, 2.5, 22], wander: [2, 1.5, 2, 0.9], maxSigma: 3, route: [[-44, 19, 198], [-8, 24.2, 179], [36, 19.2, 190], [44, 32, 228], [6, 38, 244], [-40, 26, 234]], closed: true }), 'time', lightP);
    await ctx.yield();
    add(F.makeFlock({ rng: rng.fork('sw5'), ...sw, count: Math.round(20 * density), speed: 23, spread: [9, 5, 56], wander: [5, 3, 5, 0.9], maxSigma: 3, route: ring(62, 42, 7, 9, 4), closed: true, start: 0.55 }), 'time', lightB);
    await ctx.yield();
    // pigeons: one finer bird for every flock (flyingPigeonGeo); each is grey, white or one of a mixed lot, by the cast
    const greyOf = (i) => (pigeonCast === 'grey' ? 0.8 + 0.2 * ((i * 7) % 5) / 4 : pigeonCast === 'white' ? 0.1 * ((i * 3) % 4) / 3 : (i * 5 + 1) % 3 === 0 ? 0.05 : 0.8 + 0.2 * ((i * 7) % 5) / 4);
    const coatOf = (i) => C('#e4e1da').lerp(C('#8d93a3'), greyOf(i));
    const pigeon = { species: 'crows', size: 4.2, flap: 4.2, glide: 0.08, amp: 0.8, dihedral: 0.14, outer: 0.85, form: 'loose', palette: { len: PG.L, girth: PG.G, span: PG.W, chord: PG.C, wing: 'gull', tail: PG.TL, tailW: 0.1, fingers: 0 } };
    const pgeo = flyingPigeonGeo(), newLight = () => ({ _resolved: true, sunDir: st.sunDir, sunColor: new THREE.Color(), sky: new THREE.Color(), ground: new THREE.Color() });
    await ctx.yield();
    const lightRoost = newLight(), lightBurst = newLight(), lightLate = newLight();
    add(fitPigeon(F.makeFlock({ rng: rng.fork('pg0'), ...pigeon, count: Math.round(8 * density), speed: 13, spread: [10, 6, 26], wander: [4, 3, 4, 0.5], route: ring(46, 112, 16, 8, -12), closed: true, start: 0.3 }), pgeo, hero, { grey: greyOf, bank: 0.8 }), 'time', lightRoost);
    await ctx.yield();
    // the noon burst, keyed to u: a dozen go up off the paving in the disc of sun as we fly at it, cross in front of us from
    // left to right, climbing, then lead the camera round the turn and up the door wall: a loose sheet of birds 16 m ahead,
    // a little outside the path and 9 m above it, so that the camera looks up at spread wings and fanned tails against
    // the wall and the attic and never straight up their tails. At the end they slide across toward the eye and leave for it.
    const TAKE = 0.482, U1 = 0.53, U2 = 0.665, bq = new V3(), tq = new V3(), gazeL = new V3(), gazeL2 = new V3(), Lp = path.length, fu = [], fi = [];
    // level look ahead for the climb: the horizontal chord of the path over the next `far` metres, turned `inDeg` toward the
    // middle of the hall (the right-hand side of the corkscrew), `dist` metres out and `up` metres above the camera
    const aheadPt = (u, far, inDeg, dist, up, out) => {
      const d = u * Lp; path.posAtDist(d, bq); path.posAtDist(d + far, tq);
      let hx = tq.x - bq.x, hz = tq.z - bq.z; const hl = Math.max(Math.hypot(hx, hz), 1e-3); hx /= hl; hz /= hl;
      const c = Math.cos(inDeg * DEG), sn = Math.sin(inDeg * DEG);
      return out.set(bq.x + (hx * c - hz * sn) * dist, bq.y + up, bq.z + (hz * c + hx * sn) * dist);
    };
    // the sheet of birds keeps 27 m ahead of the lens, a little inside the turn and 15 m above it: in the upper middle of the
    // picture for both cameras, high enough that the lens looks up under spread wings and fanned tails
    // the gaze of the day's end: DUSK_YAW degrees left of the portal, DUSK_PITCH above level
    const duskPt = (u, out) => { path.pointAt(u, bq); const h = Math.atan2(seat.x - bq.x, seat.z - bq.z) + DUSK_YAW * DEG, c = Math.cos(DUSK_PITCH * DEG) * 200; return out.set(bq.x + Math.sin(h) * c, bq.y + Math.sin(DUSK_PITCH * DEG) * 200, bq.z + Math.cos(h) * c); };
    const followPt = (u) => { const k = smoothstep(0.615, 0.665, u); return aheadPt(u, 45, 12, 27 + 5 * k, 15 + 3 * k, gazeL).toArray(); };
    // (the first three points are a run-in over the paving where the birds wait unseen until the take-off)
    // then a steep climb across the door wall: side-on while they are low, overhead (undersides, 45 degrees off the body) from u 0.515
    const burstRoute = [[34, 4, 88], [27, 4, 89], [20, 4, 89.6], [13, 4.5, 90], [7, 9, 90.5], [1.5, 15.5, 92], [-3.5, 21, 94.5], [-8.5, 25, 97], [-14, 27, 98.5]];
    for (let u = U1; u < U2 + 1e-6; u += 0.009) { fu.push(u); fi.push(burstRoute.length); burstRoute.push(followPt(u)); }
    burstRoute.push([-92, 150, -6], [-52, 196, 0], [-8, 236, 4], [4, 266, 0], [10, 300, -8]);
    const burst = add(fitPigeon(F.makeFlock({ rng: rng.fork('pg1'), ...pigeon, form: 'line', size: 4.8, flap: 4.6, glide: 0.03, count: 12, speed: vc, wander: [1.6, 1.2, 1.6, 0.7], route: burstRoute, closed: false, start: 0 }), pgeo, hero, { grey: greyOf, level: 0.25, bank: 0.3 }), 'burst', lightBurst);
    // their places in the sheet: metres to the right of the line of flight, above it, and behind its head (none nearer the lens than 12 m)
    { const fa = burst.geometry.attributes.iA; for (let i = 0; i < fa.count; i++) { const c = i % 4, r = Math.floor(i / 4) % 3; fa.setXYZ(i, (c - 1.5) * 4.3 + (r % 2 ? 1.6 : -0.5) + cast.range(-1, 1), (r - 1) * 3.3 + cast.range(-1, 1), ((c * 2 + r * 3) % 4) * 2.4 + cast.range(0, 1.6)); } fa.needsUpdate = true; }
    await ctx.yield();
    // metres along the baked route at each control point (the nearest sample, searched forward), then metres for a
    // given u: a clatter off the floor and a steep climb in the disc, joining a line 30 m ahead of the camera at U1,
    // which they then hold up the first turn of the corkscrew
    const sAt = []; { const Lr = burst.route.length, ds = Lr / 1800; let s0 = 0;
      for (let i = 0; i < burstRoute.length; i++) { let best = 1e9, bs = s0; const c = burstRoute[i]; for (let sx = s0; sx < Math.min(Lr, s0 + 110); sx += ds) { burst.route.pointAt(sx, bq); const dd = (bq.x - c[0]) ** 2 + (bq.y - c[1]) ** 2 + (bq.z - c[2]) ** 2; if (dd < best) { best = dd; bs = sx; } } sAt.push(bs); s0 = bs; if ((i & 3) === 3) await ctx.yield(); } }
    await ctx.yield();
    const sT = sAt[3], bD = sAt[fi[0]] - sT, bX = U1 - TAKE, bM0 = 0.5, bM1 = clamp(Lp * bX / Math.max(bD, 1), 0, 3), fs = fi.map((i) => sAt[i]), fN = fu.length - 1;
    const burstS = (u) => {
      if (u <= TAKE) return sT;
      if (u < U1) { const x = (u - TAKE) / bX, x2 = x * x, x3 = x2 * x; return sT + bD * ((x3 - 2 * x2 + x) * bM0 + (3 * x2 - 2 * x3) + (x3 - x2) * bM1); }
      if (u >= fu[fN]) return fs[fN] + (u - fu[fN]) * Lp * (1 + 0.7 * smoothstep(0, 0.035, u - fu[fN]));   // they pull away for the eye
      let i = 0; while (i < fN - 1 && u > fu[i + 1]) i++;
      return lerp(fs[i], fs[i + 1], (u - fu[i]) / (fu[i + 1] - fu[i]));
    };
    // eight leave the coffers ahead of us and cross the view toward the eye at u 0.765
    const Yup = new V3(0, 1, 0), c0 = path.pointAt(0.765, new V3()), ga = duskPt(0.765, new V3()).sub(c0).normalize().multiplyScalar(0.9).addScaledVector(seat.clone().sub(c0).normalize(), 0.1).normalize();
    const gr = new V3().crossVectors(ga, Yup).normalize(), gu = new V3().crossVectors(gr, ga);
    const lp = (f, r, up) => { const q = c0.clone().addScaledVector(ga, f).addScaledVector(gr, r).addScaledVector(gu, up), rl = Math.hypot(q.x, q.z), lim = Math.sqrt(Math.max(16900 - (q.y - 130) * (q.y - 130), 1)) - 9; if (rl > lim) { q.x *= lim / rl; q.z *= lim / rl; } return q.toArray(); };
    const lateRoute = [lp(16, -70, 10), lp(20, -50, 9), lp(25, -32, 7), lp(30, -15, 4), lp(40, 4, 0), lp(56, 28, -8), lp(80, 50, -24), lp(120, 60, -50), lp(160, 60, -80)];
    const late = add(fitPigeon(F.makeFlock({ rng: rng.fork('pg2'), ...pigeon, count: 8, speed: 17, spread: [7, 4, 12], wander: [2, 1.5, 2, 0.6], route: lateRoute, closed: false, start: 0 }), pgeo, hero, { grey: (i) => 0.14 * ((i * 3) % 4) / 3, level: 0.5, bank: 0.5 }), 'late', lightLate);
    await ctx.yield();
    let lateD = 0; for (let i = 1; i <= 3; i++) lateD += Math.hypot(lateRoute[i][0] - lateRoute[i - 1][0], lateRoute[i][1] - lateRoute[i - 1][1], lateRoute[i][2] - lateRoute[i - 1][2]);
    const U_LATE = 0.765 - (lateD + 9) / 17 / DUR; late.flightSpeed = 17;     // at u 0.765 they are just past the fourth point of the route: left of the middle, coming into the shaft
    // the swifts leave with us (the design: "pour in and out through the eye; at the end they leave with us"): one stream of
    // forty, 80 m long. It leaves the near end of where the beam swifts circle (64 m down the beam's axis from the eye at the
    // hour we reach the foot of our last straight, and 14 m under that axis to be clear of the vault), swoops up the beam's
    // throat and through the eye 12 m from its centre on the beam's side, still swinging toward the line its curve is laid
    // to (below); past the eye it wheels round the portal (below). No swift strays more than 6.5 m from the stream's line
    // (its own place across it and its wander). Up to the eye the line keeps more than that and a wing from the vault
    // (18.6 m); past the eye, as far as the head gets before the flight ends (95 m), it keeps 9.4 m from the rim's wall,
    // 10.3 m from the portal's disc and 13.3 m from our own path, and 7.5 m or more from the solid of sight lines between
    // any stand on our path and the disc (7.6 m at the eye plane itself, seen from the curl before our last straight, the
    // same point and figure as round 7's line; just under the eye 7.2 m), so no swift's body is drawn across the disc;
    // that margin is under a wing, so a wingtip can touch the disc's edge in the extreme case. Not kept clear by any rule
    // here: the fronds of the rim's ferns (on seeds 1 to 300 the innermost tip stands 22 to 24 m from the eye's axis and a
    // wing of the wheel reaches out to 23.7 m: on about four seeds in ten a wing can touch a frond at rest, a body never;
    // round 7's line touched them more).
    // It flies at the beam swifts' own speed and the last of it goes through the eye plane as we do; its place is by u,
    // like the evening pigeons', and its wing beats by the world's clock, like the burst's
    const tH = new V3(A.exitDir.x, 0, A.exitDir.z).normalize(), axE = hero.discAt(dayOf(1 - 60 / Lp), new V3()).sub(A.eye).normalize();
    const sH = new V3(-tH.z, 0, tH.x); if (sH.dot(axE) < 0) sH.negate();      // level, square to our heading, on the beam's side
    const oS = A.eye.clone().addScaledVector(axE, 64); oS.y -= 14;
    const oE = A.eye.clone().addScaledVector(sH, 12), dOut = A.exitDir.clone().addScaledVector(sH, A.portalSeat.radius / ((seat.y - A.eye.y) / A.exitDir.y)).normalize();
    // from the circling place to the eye: one curve that leaves up the beam's axis and is laid to arrive on the line dOut
    // (the stream no longer climbs away by that line: it wheels, below); baked from its samples at the quarters, the
    // stream crosses the eye still swinging toward that line, as it did in round 7
    const oM = oS.distanceTo(oE) / 3, oC1 = oS.clone().addScaledVector(axE, -oM), oC2 = oE.clone().addScaledVector(dOut, -oM);
    const oB = (k) => oS.clone().multiplyScalar((1 - k) ** 3).addScaledVector(oC1, 3 * k * (1 - k) ** 2).addScaledVector(oC2, 3 * k * k * (1 - k)).addScaledVector(oE, k ** 3);
    // past the eye the stream does not go on up that line (seen from under the eye the swifts just through it stood one
    // behind another, each seen from behind, and read as a knot of specks): it levels out and wheels round the portal in
    // a rising spiral about the eye's upright axis. The spiral's formula starts at the eye on that line (its first heading
    // and climb are the line's own); the baked stream crosses the eye climbing as the line does but heading 23 degrees
    // off ours where the line heads 48, swings on toward the line for 2 m and then turns into the wheel: a smooth S within
    // 8 m. The radius eases from 12 m (oE's own 12) to 17 m (between the disc's edge at 7 m and the rim's wall at 26.4 m
    // a swift's stray and a wing fit on both sides from 15.1 to 18.3 m), the climb eases to 1.6 m a radian (10 m a turn),
    // and it turns the way it is already heading, so from under the eye each swift is seen from below in its own shape.
    // The four numbers 17, 1.6, 4 and 0.35 are typed; the 32 points and their steps only sample the formula (the baked
    // curve lies 0.19 m from it at the join, 0.05 m as far as 25 m past the eye and 0.01 m after).
    // The stream's bank is 0.35 in place of the kit's 2 (at 2 a swift in a ring of 17 m rolls the kit's full 69 degrees
    // and is seen on edge from under the middle; at 0.35 about 28 degrees). The kit has one bank for a whole route, so it
    // holds on the swoop under the eye too: over the last 15 m under the eye round 7's swifts flew at the full 69
    // degrees; now the line rolls 11 to 35 degrees there and, in the last metre under the eye, through level into the
    // S. The route is 216.6 m where round 7's was 241.5 m, so the kit's fade at the start (a share
    // of the length) is 10.8 m where it was 12.1 m, and the curve's last 13.6 m under the eye lies up to 0.19 m from
    // round 7's.
    const oOut = [];
    { const R_W = 17, r0 = 12, C_W = 1.6, K_H = 4, hx = dOut.dot(tH), hs = dOut.dot(sH);
      const r1 = r0 * hs / hx, kR = r1 / (R_W - r0), dh0 = dOut.y / Math.hypot(hx, hs) * Math.hypot(r0, r1);      // the formula's first heading and climb are the line's own
      for (let i = 1; i <= 32; i++) { const th = i <= 6 ? i * 0.15 : 0.9 + (i - 6) * 0.3, r = R_W - (R_W - r0) * Math.exp(-kR * th);
        oOut.push(A.eye.clone().addScaledVector(sH, r * Math.cos(th)).addScaledVector(tH, r * Math.sin(th)).setY(A.eye.y + C_W * th + (dh0 - C_W) / K_H * (1 - Math.exp(-K_H * th)))); } }
    const outRoute = [oS, oB(0.25), oB(0.5), oB(0.75), oE, ...oOut].map((q) => q.toArray());
    const leave = add(F.makeFlock({ rng: ctx.core.makeRng(ctx.core.hashSeed('oculus7-leave:' + ctx.seed)), ...sw, form: 'stream', count: 40, speed: 24, spread: [3, 3, 80], wander: [1.5, 1.5, 2, 0.9], bank: 0.35, route: outRoute, closed: false, start: 0 }), 'leave', lightA);
    // each swift keeps the kit's own draws: its place across the stream is held within 2.5 m, and along the stream the kit's
    // thickening toward the head (its power 1.6) is undone, so that the stream is even
    { const fa = leave.geometry.attributes.iA; for (let i = 0; i < fa.count; i++) fa.setXYZ(i, clamp(fa.getX(i), -2.5, 2.5), clamp(fa.getY(i), -2.5, 2.5), 80 * Math.pow(fa.getZ(i) / 80, 1 / 1.6)); fa.needsUpdate = true; }
    await ctx.yield();
    // metres along the stream's route at the eye plane, and the u at which we cross that plane ourselves
    let sEye = 0; { const Lr = leave.route.length; while (sEye < Lr && leave.route.pointAt(sEye, bq).y < A.eye.y) sEye += 0.25; }
    let uEye = 1 - 60 / Lp; while (uEye < 1 && path.pointAt(uEye, bq).y < A.eye.y) uEye += 0.0002;
    const U_OUT = uEye - (sEye + 80) / 24 / DUR; leave.flightSpeed = 24;
    // a dozen strut in the sun inside the door until the burst
    const strutGeo = pigeonGeo(); await ctx.yield();
    const strut = new THREE.InstancedMesh(strutGeo, hero.makeStoneMaterial({ kind: 'plain', vertexColors: true, gloss: 0.12 }), 12); strut.name = 'strutters'; strut.frustumCulled = false; scene.add(strut);
    await ctx.yield();
    const struts = []; { const sr = rng.fork('strut'); for (let i = 0; i < 12; i++) { struts.push({ x: sr.range(4, 19), z: sr.range(83, 98), a: sr.range(1.2, 3.2), w: sr.range(0.25, 0.5) * sr.sign(), ph: sr.range(0, 6.28), s: sr.range(0.85, 1.1) }); strut.setColorAt(i, coatOf(i).multiplyScalar(sr.range(0.8, 1.1))); } }
    const placeStruts = (t, u) => {
      const gone = 1 - smoothstep(TAKE - 0.003, TAKE + 0.001, u);
      for (let i = 0; i < 12; i++) {
        const s = struts[i], a = s.ph + t * s.w, pause = smoothstep(0.1, 0.5, Math.sin(t * 0.37 + s.ph * 3) * 0.5 + 0.5), aa = s.ph + (t * 0.5 + Math.sin(t * 0.7 + s.ph) * 0.8 * pause) * s.w;
        qI.setFromAxisAngle(pI.set(0, 1, 0), -aa + (s.w > 0 ? 0 : Math.PI)); const bob = Math.abs(Math.sin(t * 5 + s.ph)) * 0.12;
        strut.setMatrixAt(i, mI.compose(pI.set(s.x + Math.cos(aa) * s.a, bob, s.z + Math.sin(aa) * s.a), qI, sI.setScalar(Math.max(s.s * gone, 1e-4))));
      }
      strut.instanceMatrix.needsUpdate = true;
    };
    placeStruts(0, 0);
    await ctx.yield();

    // ------------------------------------------------------------------ the frame
    const eye = A.eye, gazeC = new V3(), domeC = new V3(0, 130, 0), gaze1 = new V3(), gaze2 = new V3(), gaze3 = new V3(), gazeB = new V3(), gazeF = new V3(), gazeU = new V3(), gazeN = new V3(), gazeD = new V3(), camP = new V3(), tmpC = new THREE.Color(), tmpC2 = new THREE.Color(), fogC = scene.fog.color, beamP = new V3();
    let shutNow = 0;
    const birdLight = (L, sunK, skyK) => {
      const f = st.fill, g = (f.r * 0.3 + f.g * 0.5 + f.b * 0.2) * skyK * (night ? 2.4 : 1) * (1 + 0.5 * shutNow);
      L.sunColor.copy(hero.uniforms.uSunColor.value).multiplyScalar(sunK); L.sky.setRGB(g * 0.97, g, g * 1.05); L.ground.setRGB(g * 0.66, g * 0.62, g * 0.6);
    };
    const smokeTint = (un, k1, k2) => { for (const s of smokes) { const U = s.uniforms; U.uColor?.value.copy(tmpC).multiplyScalar(k1); U.uColorTop?.value.copy(tmpC).multiplyScalar(k2); U.uShadow?.value.copy(tmpC).multiplyScalar(0.3); U.uAmbient?.value.copy(tmpC).multiplyScalar(0.08); U.uSunColor?.value.copy(st.sunColor).multiplyScalar(0.16 * st.cloud * un); U.uSunDir?.value.copy(st.sunDir); } };
    return {
      scene, path, duration: DUR,
      // slower through the portico and its doors, a little quicker round the turn at the apse, lingering on the climb beside the beam
      pace: (u) => 1 - 0.24 * (1 - smoothstep(0.02, 0.12, u)) + 0.1 * smoothstep(0.3, 0.36, u) * (1 - smoothstep(0.42, 0.48, u)) - 0.16 * smoothstep(0.58, 0.66, u) * (1 - smoothstep(0.8, 0.88, u)),
      title: look === 'night' ? 'One Night under the Oculus' : 'One Day under the Oculus',
      camera: { fov: 66, near: 0.5, far: 5200, lookAhead: 34, sway: 0.4, bank: 0 },
      pois: [
        // the morning is four pictures, each with a level horizon. The reveal: the shaft and its ellipse across the hall
        { at: () => gaze1.copy(st.disc).lerp(eye, 0.1), from: 0.04, to: 0.15, weight: 0.56, fade: 0.25 },
        // then a long look up the shaft into the coffers, the eye at the top of the picture and the ellipse at its foot
        { at: () => gazeU.copy(st.disc).lerp(eye, 0.45), from: 0.112, to: 0.218, weight: 0.85, fade: 0.3 },
        // the close pass along the wall: a level look at the shrine and the exedra beside us, the lit wall beyond them
        { at: (tt, u) => { path.pointAt(u, gazeN); const a = Math.atan2(-gazeN.x, gazeN.z) + 17 * DEG; return gazeN.set(-Math.sin(a) * 117, 23, Math.cos(a) * 117); }, from: 0.2, to: 0.305, weight: 0.6, fade: 0.3 },
        // from the apse, the whole hall: paving, drum, attic and dome, the shaft standing across it on its ellipse
        { at: () => gaze2.copy(st.disc).lerp(eye, 0.4), from: 0.29, to: 0.392, weight: 0.75, fade: 0.3 },
        // the crossing: the beam dead ahead (in april the disc on the wall over the door)
        { at: () => (look === 'april' ? gazeB.copy(st.disc) : gazeB.copy(st.disc).lerp(eye, 0.07)), from: 0.365, to: 0.535, weight: look === 'april' ? 0.7 : 0.6, fade: 0.22 },
        // the climb: a level look ahead and across the hall, so that the wall beside us, the disc on it and the far side
        // of the drum stand upright in the picture
        { at: (tt, u) => aheadPt(u, 45, 14, 60, 4, gazeL2), from: 0.495, to: 0.668, weight: 0.6, fade: 0.24 },
        { at: () => gaze3.copy(st.disc), from: 0.56, to: 0.7, weight: 0.22 },
        // the pigeons that lead us round the turn and up the door wall
        { at: (tt, u) => burst.route.pointAt(Math.min(burstS(u), burst.route.length * 0.98) - 3, gazeF), from: 0.488, to: 0.66, weight: 0.36, fade: 0.22 },
        { at: seat, from: 0.615, to: 1.0, weight: 0.86, fade: 0.22 },
        // the day's end has a picture of its own, held from u 0.74 to 0.83: a level look across the hall from high on the
        // dome. The eye and the portal stand upper right, the copper shaft runs down from them to its lens on the far
        // coffers in the middle, the dark coffers beside us fill the left, and the lamp-lit attic lies along the foot
        { at: (tt, u) => duskPt(u, gazeD), from: 0.7, to: 0.875, weight: 0.92, fade: 0.25 },
      ],
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: LK.portal, glow: 0.5, revealDistance: 420, tilt: true },
      post: { exposure: LK.exposure, bloom: { strength: 0.3, radius: 0.7, threshold: 1.25 },
        grade: { saturation: LK.sat, contrast: 1.08, tint: LK.tint, shadowTint: LK.shadow, vignette: 0.34, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update(dt, t, camera, u) {
        time.value = t;
        const d = dayOf(u);
        hero.setProgress(d);
        // the eye adapts to the blazing disc while we cross the floor toward it: the hall falls four stops below it,
        // the bounce stays close to the disc, and the beam stands out against the dark wall
        const shut = look === 'shower' ? smoothstep(0.33, 0.4, d) * (1 - smoothstep(0.445, 0.5, d)) : 0;
        shutNow = shut;
        // (held through the turn up the door wall: the hall stays dark and cool until the disc has left the paving)
        const nn = smoothstep(0.33, 0.41, u) * (1 - smoothstep(april ? 0.5 : 0.545, april ? 0.58 : 0.61, u)) * (night ? 0.4 : look === 'snow' ? 0.4 : 0.38) * (1 - shut);
        // the beam's own shader thins the lit air to a gold veil close to the camera, so flying through the foot of it
        // never whites the picture out; there the motes carry the light
        camera.getWorldPosition(camP); beamP.copy(camP).sub(eye); beamP.addScaledVector(st.sunDir, -beamP.dot(st.sunDir));
        const bd = beamP.length() / A.eyeRadius, close = 1 - smoothstep(1.1, 2.6, bd);
        // (in the morning the shaft is seen from the side, across the whole hall: there it stands brighter)
        const morn = 1 - smoothstep(0.3, 0.4, u), mornB = 1 - smoothstep(0.26, 0.4, u);
        const gOut = night ? 1.5 + 0.8 * mornB : (lerp(2.7, 1.15, smoothstep(2.4, 4.2, st.power)) + 0.85 * nn) * (look === 'april' ? 1 + 0.3 * (1 - smoothstep(0.2, 0.34, d)) : 1) * (1 + 1.5 * mornB + 1.1 * smoothstep(0.545, 0.58, u) * (1 - smoothstep(0.615, 0.67, u)));
        // the day's end: the lens of sun stands across the hall, the shaft seen from the side all the way down to it
        const duskK = smoothstep(0.715, 0.765, u) * (1 - smoothstep(0.85, 0.9, u));
        hero.setBeamGain(gOut * (1 + (night ? 0.5 : 0.9) * duskK), night ? 0.5 : 0.2, night ? 90 : 125); hero.setMoteGain(lerp(1 + 0.7 * smoothstep(0.6, 0.68, u) * (1 - smoothstep(0.88, 0.95, u)) + 1.1 * duskK, 2.4, close));
        hero.update(dt, t, camera);
        const HU = hero.uniforms;
        HU.uSunColor.value.multiplyScalar(lerp(lerp(0.64, 0.86, Math.max(morn, smoothstep(0.55, 0.59, u) * (1 - smoothstep(0.66, 0.72, u)) * 0.8)), 0.5, nn) * (1 + 2.2 * duskK)); HU.uSunColor.value.g *= 1 - 0.16 * duskK; HU.uSunColor.value.b *= 1 - 0.38 * duskK;       // stopped down on the disc while the hall is held dark
        // once inside at night the eye has left the porch behind: the doorway is a dim blue slot, darker than the moonbeam
        HU.uOuter.value = night ? lerp(1, 0.4, smoothstep(0.1, 0.24, u)) : 1;
        hero.floorSun.value = night ? 0.85 : look === 'snow' ? 0.9 : 0.52; hero.floorLift.value = Math.max(nn / 0.38, 0.8 * shut * smoothstep(0.44, 0.47, u)) * (night ? 0.5 : 1);
        { const ev = smoothstep(0.7, 0.86, d), f = HU.uFill.value, g = (f.r + f.g + f.b) / 3; f.setRGB(lerp(f.r, g * 1.04, ev * 0.3), lerp(f.g, g, ev * 0.3), lerp(f.b, g * 1.02, ev * 0.3)).multiplyScalar((1 + 0.3 * ev) * lerp(1, 0.52, nn) * (night ? 2.3 : 1)); f.r *= 1 - 0.14 * nn; f.b *= 1 + 0.1 * nn; }
        HU.uAmbient.value.multiplyScalar(lerp(1, 0.6, nn) * (night ? 1 : 1.45)); if (night) { const a = HU.uAmbient.value, g = (a.r + a.g + a.b) / 3; a.setRGB(lerp(a.r, g, 0.45), lerp(a.g, g, 0.45), lerp(a.b, g, 0.45)).multiplyScalar(2.4); }
        // in the morning the disc stands on the wall ahead of us: its bounce reaches further and warms the drum and the dome round it
        HU.uBounceK.value = lerp(lerp(1 / 5200, 1 / 12000, morn), 1 / 2600, nn); HU.uBounceCol.value.multiplyScalar(1 + 0.3 * nn + 2.3 * morn); HU.uHalo.value = 0.16 + 0.08 * morn + 0.26 * duskK;
        const dusk = night ? 0 : smoothstep(0.68, 0.82, d); if (halos.uniforms?.uIntensity) halos.uniforms.uIntensity.value = haloBase * (1 + 2.6 * dusk);
        HU.uLamp.value.setRGB(1, 0.5, 0.2).multiplyScalar(6 * dusk * (look === 'snow' ? 1.3 : 1));
        HU.uCandle.value.setRGB(1, 0.5, 0.19).multiplyScalar((0.5 + 0.2 * nn + 2.8 * shut + 3.8 * dusk + 2.4 * (1 - smoothstep(0.04, 0.14, d))) * (night ? 2.6 : look === 'snow' ? 1.7 : 1) * (0.92 + 0.08 * Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1)));
        fogC.copy(st.fog).multiplyScalar(lerp(1, 0.45, nn)); scene.background.copy(fogC).multiplyScalar(0.5);
        const SU = sky.uniforms;
        if (shut > 0) { hero.uniforms.uFill.value.multiplyScalar(1 + (0.42 + 0.63 * smoothstep(0.505, 0.55, u)) * shut); hero.uniforms.uAmbient.value.multiplyScalar(1 + 0.25 * shut); doorRain?.setOpacity(0.85 * shut); } else doorRain?.setOpacity(0);   // a silver gloom under the shower, the candles carrying the hall
        SU.uSunCol.value.copy(st.sunColor).multiplyScalar(st.cloud);
        SU.uHorizon.value.copy(st.fog).multiplyScalar(1.5).add(tmpC.copy(st.sunColor).multiplyScalar(0.035));
        { const el = lerp(41, 58, smoothstep(0.86, 0.925, u)) * DEG, ce = Math.cos(el); SU.uStar.value.set(-Math.sin(340 * DEG) * ce, Math.sin(el), Math.cos(340 * DEG) * ce, night ? 0 : smoothstep(0.74, 0.9, d) * smoothstep(0.862, 0.885, u)); }     // the evening star climbs the dark side of the eye, clear of the portal
        SU.uSkyP.value.set(night ? 1 : Math.max((1 - smoothstep(0.02, 0.14, d)) * 0.9, 0.7 * smoothstep(0.8, 0.96, d)), lerp(LK.cover, 0.1, shut), LK.cloudGain, t * (night ? 0.06 : 0.02));
        SU.uDisc.value.z = Math.max(LK.overcast, shut * 0.85); SU.uWind.value.z = night ? 0 : smoothstep(0.64, 0.84, d);
        setDoors(u);
        doorGlow.material.uniforms.uCol.value.copy(st.fog).multiplyScalar(1.3).add(tmpC.copy(st.fill).multiplyScalar(0.4)).add(tmpC.copy(st.sunColor).multiplyScalar(night ? 0.03 : 0.1)).multiplyScalar(1 - smoothstep(0.02, 0.05, u)); doorGlow.visible = u < 0.05;
        // incense takes the colour of the hour; birds are lit by the fill, and by the sun where they fly in the beam
        doorMist.uniforms.uColor?.value.copy(st.fog).multiplyScalar(1.6);
        tmpC.copy(st.fill).multiplyScalar(1.5 * lerp(1, 0.4, nn)).lerp(tmpC2.copy(st.sunColor).multiplyScalar(0.12), 0.3 * (1 - 0.7 * nn)); smokeTint(1 - 0.75 * nn, 0.85, 1.25);
        lightA.sunColor.copy(st.sunColor).multiplyScalar(0.55 * st.cloud); lightA.sky.copy(st.fill).multiplyScalar(2.2 * lerp(1, 0.45, nn)); lightA.ground.copy(st.fill).multiplyScalar(1.2).add(tmpC2.copy(st.sunColor).multiplyScalar(0.05));
        lightP.sunColor.copy(st.sunColor).multiplyScalar(0.1); lightP.sky.copy(st.sky).multiplyScalar(0.9).add(lightA.sky); if (night) lightP.sky.multiplyScalar(2.2); if (shut > 0) { const c = lightP.sky, g = c.r * 0.3 + c.g * 0.5 + c.b * 0.2, k = 0.75 * shut; c.setRGB(lerp(c.r, g * 1.02, k), lerp(c.g, g, k), lerp(c.b, g * 1.02, k)); } lightP.ground.copy(lightP.sky).multiplyScalar(0.5);
        lightB.sunColor.copy(st.sunColor).multiplyScalar(0.12 * st.cloud); lightB.sky.copy(lightA.sky); lightB.ground.copy(lightA.ground);
        // pigeons (their own shader): the sun at about half the stones' while a bird is in the beam, and out of it a soft
        // neutral grey that keeps a white bird well above the darkened wall behind it
        birdLight(lightBurst, 0.52, 0.5 - 0.1 * nn); birdLight(lightRoost, 0.5, 0.42); birdLight(lightLate, 0.7, 1.35); lightLate.sky.r *= 1.1; lightLate.sky.b *= 0.92;     // the white birds of the evening carry the lamp light up with them
        beamSwifts.object.position.copy(eye).addScaledVector(st.sunDir, -lerp(64, 96, 0.5 + 0.5 * Math.sin(t * 0.21)));
        for (const f of birds) {
          f.setLight(f.light);
          if (f.mode === 'time') f.update(dt, t, camera);
          else if (f.mode === 'u') f.update(dt, t, camera, u);
          else if (f.mode === 'leave') { f.object.visible = u > U_OUT; f.update(dt, clamp((u - U_OUT) * DUR, 0, f.route.length * 0.985 / f.flightSpeed), camera); f.uniforms.uPhase.value = t; }
          else if (f.mode === 'late') { const tMax = f.route.length * 0.985 / f.flightSpeed; f.object.visible = u > U_LATE && (u - U_LATE) * DUR < tMax; f.update(dt, clamp((u - U_LATE) * DUR, 0, tMax), camera); }
          else {
            // the burst: its place on the route comes from u, its wing beats from the clock
            const sB = Math.min(burstS(u) + 2.6 * (1 + Math.sin(t * 0.8)) * smoothstep(TAKE + 0.012, TAKE + 0.035, u), f.route.length * 0.985);   // they surge and fall back a little as they lead
            f.object.visible = u > TAKE && sB < f.route.length * 0.98;
            f.update(dt, sB / vc, camera); f.uniforms.uPhase.value = t; f.uniforms.uFlap.value.y = lerp(1.08, 0.8, smoothstep(U1 - 0.012, U1 + 0.04, u));   // deep clapping beats off the floor
          }
        }
        placeStruts(t, u);
        flames.update(dt, t); set.update(dt, t, camera);
      },
      dispose() { hero.dispose(); },
    };
  },
};
