// The Country Mended with Gold: the inside of a broken celadon bowl two kilometres wide. Its shards hang slightly
// apart over a peach cloud sea, gold runs uphill along every crack and draws them together, and the last
// missing piece (the hero, src/parts/mended-country.js) comes down out of the sky to be set, leaving one chip
// open on purpose: the exit.
//
// HOW IT IS MADE. The bowl is a spherical cap (radius 1600, centre (0,1600,0)) cut by a Voronoi diagram of
// 38-54 seeded sites. Every cell edge is built ONCE as a jittered polyline in a seam table; both neighbouring
// shards, the gold ribbon, the threads and the peach blade over that crack read the same polyline, so seated
// edges meet exactly. Shards are posed in the vertex shader from a small parameter texture (open pose times
// k(u); identity once seated). Three materials only: glaze, biscuit, gold. All events are functions of u.
//
// THE FLIGHT (49 s, about 1,410 m, heading north; beats in shots/mended-country/beats.json). The camera stays off the
// ground. u 0-0.05 a level entry 92 m up: the whole mended bowl below, dark jade and set gold, the Shard ahead tip-up over
// its gap against a deep sky, the afterglow a thin band on the rim line; 0.05-0.12 down past the Lifted Floe, which hangs
// over its hole and its foot ring; 0.13-0.23 along the seam from 40 to 14 m up, its molten front held 62 m ahead, the
// potter's seal beside it; 0.25-0.27 the crossing: the far shard hangs 9 m up until we are 30 m short, its biscuit wall
// lit peach, the gold runs along the crack; 0.3-0.4 UP the wall, the lid over its blazing gap; 0.4-0.47 the Hung Isle to
// port, a whole shard 95 m over its hole on a fringe of threads (the second landmark); 0.5-0.62 the sail; 0.62-0.8 a
// crane climb round the lid as it comes down, to 220 m above the wall; it seats at 0.832 and from 0.8 to 0.93 the whole
// spearhead lies below the lens while the two beads outline it in glowing gold (they meet at 0.925); the last 52 m dive
// at 50 degrees into the chip left open, its rim gilded by 0.948.
// LIGHT: the afterglow rakes the bowl (litK in the hero's LIGHT_GLSL): the side turned to it is lit celadon, the side
// turned away falls to dark jade, pooled glaze goes ink green, the sky is a stop darker than the lit ware, and the gold
// glows: the brightest, most saturated thing in every frame.
// VARIES BY SEED: hour (peach dusk, moonrise, rose dawn; ctx.vary.hour honoured), ware (celadon and gold,
// ivory and red-gold, sea-green and silver), painting and cast (reeds, cranes and fish; pines, deer and
// tadpoles; bare, with slow carp nine metres long), weather (still, dust drift, craze storm), 38-54 shards.
// RARE (ctx.vary.rare): the Last Shard comes from another bowl, cobalt blue-and-white, and is set anyway.
import * as THREE from 'three';
import { makePath, smoothstep, clamp, lerp } from '../kit/core.js';
import { buildHero, LIGHT_GLSL, RELIEF_GLSL, UNDER_GLSL, GOLD_FS, DEFAULT_PALETTE } from '../parts/mended-country.js';

const R = 1600, RIM = 1000, THICK = 9, SEAM_X = 67, SEAT_U = 0.832;
const FOOT_R = 150;
const ISLE = 5, ISLE_X = 420, ISLE_Z = 330, ISLE_LIFT = 95, ISLE_TILT = -0.21;   // the Hung Isle: the second landmark, up the wall to port of the climb
const surfY = (x, z) => R - Math.sqrt(Math.max(1, R * R - x * x - z * z));
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const linV = (hex, k = 1) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r * k, c.g * k, c.b * k); };
// point at height h above the glaze over horizontal (x, z)
function above(x, z, h, out = new THREE.Vector3()) {
  const y = surfY(x, z); out.set(x, y, z);
  return out.addScaledVector(new THREE.Vector3(-x, R - y, -z).multiplyScalar(1 / R), h);
}

// ---- wares, hours, casts (the brief's variations) ----
const WARES = [
  { name: 'celadon', pal: DEFAULT_PALETTE, crack: '#8E9A82' },
  { name: 'ivory', pal: ['#DDD1C6', '#F4EFE8', '#B9A9AE', '#F2ECE2', '#C9703A', '#A8402E', '#F3C9A8'], crack: '#A2969C' },
  { name: 'sea-green', pal: ['#5FA08E', '#BFE0D2', '#2F6E62', '#E9EEE6', '#C9D2D6', '#8E3A2C', '#F3C9A8'], crack: '#6F8F86' },
];
const HOURS = {
  dusk: { peach: '#F3C9A8', deep: '#E89B6E', up: 2.4, zen: '#2A4C56', rim: '#5B8580', glow: '#F6E3CF', glowK: 0.9, fill: '#9DB5AC', haze: '#3F6566', az: 300, portal: '#FBE6D2' },
  moon: { peach: '#B9CBE6', deep: '#7F9FD6', up: 2.0, zen: '#3E4F6E', rim: '#6F86A6', glow: '#E4ECF6', glowK: 0.8, fill: '#94A3B6', haze: '#70849A', az: 300, portal: '#E6F0FF' },
  dawn: { peach: '#F6B7B4', deep: '#EE8F9C', up: 2.3, zen: '#343E66', rim: '#84769A', glow: '#FBE0D6', glowK: 0.95, fill: '#B0AFC2', haze: '#5A5676', az: 120, portal: '#FFE4DA' },
};

// ---- the break pattern: Voronoi cells by half-plane clipping; each vertex k carries nb = neighbour across edge k -> k+1
async function voronoi(sites, tick) {
  const cells = [];
  for (let i = 0; i < sites.length; i++) {
    if ((i & 7) === 7) await tick();
    let poly = [];
    for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; poly.push({ x: Math.cos(a) * RIM, z: -Math.sin(a) * RIM, nb: -1 }); }
    const s = sites[i];
    for (let j = 0; j < sites.length && poly.length > 2; j++) {
      if (j === i) continue;
      const t = sites[j], nx = t.x - s.x, nz = t.z - s.z, mx = (s.x + t.x) / 2, mz = (s.z + t.z) / 2;
      const side = (p) => (p.x - mx) * nx + (p.z - mz) * nz;      // > 0: nearer the other site
      const out = [];
      for (let k = 0; k < poly.length; k++) {
        const a = poly[k], b = poly[(k + 1) % poly.length], da = side(a), db = side(b);
        if (da <= 0) out.push({ x: a.x, z: a.z, nb: db <= 0 ? a.nb : a.nb });
        if ((da <= 0) !== (db <= 0)) {
          const f = da / (da - db), x = a.x + (b.x - a.x) * f, z = a.z + (b.z - a.z) * f;
          // leaving the kept side: the new edge runs along the bisector; entering: the rest of the old edge
          out.push({ x, z, nb: da <= 0 ? j : a.nb });
        }
      }
      poly = out;
    }
    let cx = 0, cz = 0; for (const p of poly) { cx += p.x; cz += p.z; }
    cells.push({ id: i, poly, cx: cx / Math.max(1, poly.length), cz: cz / Math.max(1, poly.length) });
  }
  return cells;
}

// One polyline per cell edge, built once and shared: a point each `step` metres, kinked and jittered by a hash of
// its own position (never the end points, which three shards share).
async function seamTable(cells, stepOf, tick) {
  const seams = new Map();
  for (const c of cells) {
    await tick();
    c.edges = [];
    const n = c.poly.length;
    for (let k = 0; k < n; k++) {
      const a = c.poly[k], b = c.poly[(k + 1) % n], nb = a.nb, len = Math.hypot(b.x - a.x, b.z - a.z);
      if (len < 0.05) continue;
      const key = nb < 0 ? `r${c.id}_${k}` : `${Math.min(c.id, nb)}_${Math.max(c.id, nb)}`;
      let sm = seams.get(key);
      if (!sm) {
        const step = stepOf((a.x + b.x) / 2, (a.z + b.z) / 2), m = Math.max(1, Math.ceil(len / step)), pts = [];
        const px = -(b.z - a.z) / len, pz = (b.x - a.x) / len, h0 = hash1(a.x * 0.013 + b.z * 0.017), amp = nb < 0 ? 0 : Math.min(len * 0.035, 9);
        for (let q = 0; q <= m; q++) {
          const t = q / m; let x = lerp(a.x, b.x, t), z = lerp(a.z, b.z, t);
          if (q > 0 && q < m && nb >= 0) {
            const env = Math.min(1, Math.min(t, 1 - t) * 6), tri = (v) => Math.abs(((v % 1) + 1) % 1 - 0.5) * 2 - 0.5;
            const off = env * amp * (tri(t * 1.7 + h0) + 0.45 * tri(t * 4.3 + h0 * 7)) + (hash1(x * 3.7 + z * 1.3) - 0.5) * Math.min(1.4, step * 0.28);
            const al = (hash1(x * 1.9 - z * 2.3) - 0.5) * step * 0.3;
            x += px * off + pz * al; z += pz * off - px * al;
          }
          pts.push({ x, z });
        }
        sm = { key, a: c.id, b: nb, pts, len }; seams.set(key, sm);
      }
      c.edges.push({ seam: sm, rev: sm.a !== c.id });
    }
    // the closed outline of the shard: its edges end to end, each read from the shared table
    c.ring = [];
    for (const e of c.edges) {
      const p = e.rev ? e.seam.pts.slice().reverse() : e.seam.pts;
      for (let q = 0; q < p.length - 1; q++) c.ring.push({ x: p[q].x, z: p[q].z, seam: e.seam, corner: q === 0 });
    }
  }
  return seams;
}

// ---- geometry: glazed skins (web of rings from the shared outline to the centroid), biscuit walls, foot ring ----
const P_ = new THREE.Vector3(), N_ = new THREE.Vector3();
function surf(x, z, depth = 0) {                       // point `depth` metres under the glaze, down the normal
  const y = surfY(x, z); N_.set(-x, R - y, -z).multiplyScalar(1 / R);
  return P_.set(x, y, z).addScaledVector(N_, -depth);
}
async function buildShards(cells, collarSd, footR, collarRing, tick) {
  const gPos = [], gInfo = [], gIdx = []; let gn = 0;
  const bPos = [], bInfo = [], bNrm = [], bIdx = []; let bn = 0;
  const gv = (x, z, depth, d, tint, id, side) => { const p = surf(x, z, depth); gPos.push(p.x, p.y, p.z); gInfo.push(d, tint, id, side); return gn++; };
  const bv = (x, z, depth, id, fh, flag, nx = 0, ny = 1, nz = 0) => { const p = surf(x, z, depth); bPos.push(p.x, p.y, p.z); bInfo.push(depth, id, fh, flag); bNrm.push(nx, ny, nz); return bn++; };
  const OFF = [0, 1.2, 3.6, 9, 22], FR = [0.7, 0.48, 0.27, 0.1], DEPTH = [0, 0.5, 2.2, 5.2, THICK];
  for (const c of cells) {
    await tick();
    const ring = c.ring, n = ring.length; if (n < 3) continue;
    const poly = c.poly, m = poly.length;
    const nbOf = (p) => (p.seam.b < 0 ? -1 : (p.seam.a === c.id ? p.seam.b : p.seam.a));   // the shard across this edge (-1: the rim)
    const edgeD = (x, z) => {                             // distance to the straight cell edges (the cell is convex)
      let best = 1e9;
      for (let k = 0; k < m; k++) {
        const a = poly[k], b = poly[(k + 1) % m], ex = b.x - a.x, ez = b.z - a.z, l = Math.hypot(ex, ez); if (l < 0.05) continue;
        best = Math.min(best, Math.abs((x - a.x) * ez - (z - a.z) * ex) / l);
      }
      return best;
    };
    // top skin
    const rows = OFF.length + FR.length, base = gn;
    for (let i = 0; i < n; i++) {
      if ((i & 15) === 15) await tick();
      const p = ring[i], dx = p.x - c.cx, dz = p.z - c.cz, rho = Math.max(1, Math.hypot(dx, dz));
      for (let r = 0; r < rows; r++) {
        const s = r < OFF.length ? Math.max(1 - OFF[r] / rho, 0.78 - 0.01 * r) : FR[r - OFF.length];
        const x = c.cx + dx * s, z = c.cz + dz * s;
        gv(x, z, 0, r === 0 ? 0 : Math.max(edgeD(x, z), OFF[Math.min(r, OFF.length - 1)] * 0.5), nbOf(p), c.id, 1);
      }
    }
    const ctr = gv(c.cx, c.cz, 0, edgeD(c.cx, c.cz), c.id, c.id, 1);
    for (let i = 0; i < n; i++) {
      const a = base + i * rows, b = base + ((i + 1) % n) * rows;
      for (let r = 0; r < rows - 1; r++) gIdx.push(a + r, a + r + 1, b + r, b + r, a + r + 1, b + r + 1);
      gIdx.push(a + rows - 1, ctr, b + rows - 1);
    }
    await tick();
    // underside: a fan 9 m down (plain, ring-marked; seen under the Floe and through cracks)
    const ub = gn;
    for (let i = 0; i < n; i++) gv(ring[i].x, ring[i].z, THICK, 0, nbOf(ring[i]), c.id, -1);
    for (let i = 0; i < n; i++) { const p = ring[i]; gv(lerp(c.cx, p.x, 0.5), lerp(c.cz, p.z, 0.5), THICK, 30, c.id, c.id, -1); }
    const uc = gv(c.cx, c.cz, THICK, 60, c.id, c.id, -1);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; gIdx.push(ub + i, ub + j, ub + n + i, ub + j, ub + n + j, ub + n + i, ub + n + i, ub + n + j, uc); }
    // biscuit wall: every break shows 9 m of thickness; chipped facets (flat normals come from derivatives)
    const wb = bn;
    await tick();
    for (let i = 0; i < n; i++) {
      if ((i & 31) === 31) await tick();
      const p = ring[i], dx = c.cx - p.x, dz = c.cz - p.z, l = Math.max(1, Math.hypot(dx, dz));
      const q0 = ring[(i + n - 1) % n], q1 = ring[(i + 1) % n]; let ox = q1.z - q0.z, oz = -(q1.x - q0.x); const ol = Math.max(1e-4, Math.hypot(ox, oz)); ox /= ol; oz /= ol;
      if (ox * dx + oz * dz > 0) { ox = -ox; oz = -oz; }             // the wall faces out of its shard
      for (let r = 0; r < DEPTH.length; r++) {
        const h = p.x * 0.731 + p.z * 1.377 + r * 7.7 + c.id * 3.1, mid = r > 0 && r < DEPTH.length - 1 ? 1 : 0;
        const bite = mid * (0.2 + 0.35 * hash1(h) + (hash1(h * 0.37) > 0.8 ? 0.4 : 0)) + (r === DEPTH.length - 1 ? 0.5 : 0);
        bv(p.x + dx / l * bite, p.z + dz / l * bite, DEPTH[r], c.id, hash1(h + 2.2), nbOf(p), ox, 0.03, oz);
      }
    }
    await tick();
    for (let i = 0; i < n; i++) {
      if ((i & 31) === 31) await tick();
      const j = (i + 1) % n, R5 = DEPTH.length;
      if (collarSd(ring[i].x, ring[i].z) < 1 && collarSd(ring[j].x, ring[j].z) < 1) continue;   // hidden inside the hero's collar
      for (let r = 0; r < R5 - 1; r++) {
        const a = wb + i * R5 + r, b = wb + j * R5 + r;
        if ((i + r) & 1) bIdx.push(a, a + 1, b, b, a + 1, b + 1); else bIdx.push(a, a + 1, b + 1, a, b + 1, b);
      }
    }
  }
  // the foot ring: a biscuit wall 22 m tall and 14 m thick under the floor, seen beneath the Lifted Floe
  const SEG = 120, prof = [[footR - 7, THICK - 1], [footR - 7.6, THICK + 8], [footR - 6.2, THICK + 21], [footR - 3, THICK + 22.4], [footR + 3, THICK + 22.4], [footR + 6.2, THICK + 21], [footR + 7.6, THICK + 8], [footR + 7, THICK - 1], [footR + 7, THICK - 1], [footR - 7, THICK - 1]];   // the last two: its top, where the floor sat on it
  const fb = bn;
  for (let i = 0; i <= SEG; i++) {
    const a = (i / SEG) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    prof.forEach(([r, dep], k) => { const rr = r + (k > 0 && k < 7 ? (hash1(i * 1.7 + k * 9.1) - 0.5) * 0.9 : 0); const sg = k < 4 ? -1 : 1, tp = k === 3 || k === 4 ? 1 : 0, cap = k > 7 ? 1 : 0; bv(ca * rr, sa * rr, dep, -1, hash1(i * 3.3 + k), -3, cap ? 0 : ca * sg * (1 - 0.6 * tp), cap ? 1 : -0.8 * tp, cap ? 0 : sa * sg * (1 - 0.6 * tp)); });
  }
  for (let i = 0; i < SEG; i++) for (let k = 0; k < prof.length - 1; k++) {
    const a = fb + i * prof.length + k, b = a + prof.length;
    if ((i + k) & 1) bIdx.push(a, a + 1, b, b, a + 1, b + 1); else bIdx.push(a, a + 1, b + 1, a, b + 1, b);
  }
  const geo = async (pos, info, idx, nrm) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); await tick();
    g.setAttribute('aInfo', new THREE.Float32BufferAttribute(info, 4)); await tick();
    if (nrm) { g.setAttribute('aNrm', new THREE.Float32BufferAttribute(nrm, 3)); await tick(); }
    g.setIndex(idx); return g;
  };
  // the world's side of the crack round the hero's collar: the same 9 m of biscuit, facing the collar
  await tick();
  const cb = bn, cn = collarRing.length, R5 = DEPTH.length;
  for (let i = 0; i < cn; i++) for (let r = 0; r < R5; r++) {
    const p = collarRing[i], h = i * 5.31 + r * 7.7, bite = (r > 0 && r < R5 - 1 ? 0.2 + 0.35 * hash1(h) : 0) + (r === R5 - 1 ? 0.5 : 0);
    bv(p.x + p.ox * bite, p.z + p.oz * bite, DEPTH[r], -1, hash1(h + 2.2), -2, -p.ox, 0.03, -p.oz);
  }
  for (let i = 0; i < cn; i++) for (let r = 0; r < R5 - 1; r++) {
    const a = cb + i * R5 + r, b = cb + ((i + 1) % cn) * R5 + r;
    if ((i + r) & 1) bIdx.push(a, a + 1, b, b, a + 1, b + 1); else bIdx.push(a, a + 1, b + 1, a, b + 1, b);
  }
  await tick(); const glaze = await geo(gPos, gInfo, gIdx);
  await tick(); const biscuit = await geo(bPos, bInfo, bIdx, bNrm);
  await tick();
  return { glaze, biscuit };
}

// ---- gold ribbons, peach blades and catenary threads, all read from the seam table ----
async function buildSeams(seams, cells, collarSd, crack, rng, detail, tick) {
  const oPos = [], oAcr = [], oGold = [], oWin = [], oIdx = []; let on = 0;      // gold
  const lPos = [], lIds = [], lBl = [], lIdx = []; let ln = 0;                    // blades
  const tPos = [], tIds = [], tT = [], tRnd = [], tIdx = []; let tn = 0;          // threads
  const A = new THREE.Vector3(), T = new THREE.Vector3(), fronts = [];
  for (const sm of seams.values()) {
    if (sm.b < 0) continue;
    await tick();
    const ca = cells[sm.a], cb = cells[sm.b], pts = sm.pts, M = pts.length;
    // arc length from the LOW end (gold runs uphill)
    const cum = [0]; for (let i = 1; i < M; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
    const rv = sm.fixed && sm.fixed.river;               // a river: s runs from its far end toward the gap
    const L = cum[M - 1], flip = rv ? Math.hypot(pts[0].x - rv.ax, pts[0].z - rv.az) < Math.hypot(pts[M - 1].x - rv.ax, pts[M - 1].z - rv.az)
      : sm.fixed && sm.fixed.flip !== undefined ? sm.fixed.flip : Math.hypot(pts[0].x, pts[0].z) > Math.hypot(pts[M - 1].x, pts[M - 1].z);
    const sOf = (i) => (flip ? L - cum[i] : cum[i]);
    const cut = rv ? 0.2 : crack + 1.2, ok = pts.map((p) => collarSd(p.x, p.z) > cut);
    let sCut = L; for (let i = 0; i < M; i++) if (!ok[i]) sCut = Math.min(sCut, sOf(i));
    const seatU = Math.max(ca.u1, cb.u1), opens = seatU > 0;
    let g0 = -2, g1 = -1;
    if (rv) { g0 = rv.uRef - (L - rv.rRef) / rv.v; g1 = g0 + (L + 8) / rv.v; rv.uA = g0 + sCut / rv.v; }   // its front at radius rRef from the gap at uRef; at the collar's break at uA
    else if (sm.fixed && sm.fixed.g0 !== undefined) { g0 = sm.fixed.g0; g1 = sm.fixed.g1; }
    else if (sm.fixed) { g0 = sm.fixed.u - sOf(sm.fixed.i) / 1750; g1 = g0 + (L + 8) / 1750; }   // the front passes point i at u
    if (opens && !sm.fixed) { g0 = seatU + 0.004; g1 = g0 + Math.max(0.03, (L + 8) / 1080 / rng.range(1.3, 2.0)); }
    sm.g0 = g0; sm.g1 = g1; sm.L = L; sm.sOf = sOf; sm.near = cum[1] < 6.5;
    const baseR = sm.fixed ? (rv ? rv.r : 1.6) : (rng.range(0.55, 1.1) + Math.min(1.2, L / 400) * rng.range(0.3, 1)) * 1.5;
    const SEG = rv ? 8 : sm.near ? 6 : 4;
    const gb = on;
    for (let i = 0; i < M; i++) {
      if ((i & 63) === 63) await tick();
      const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(M - 1, i + 1)];
      surf(p.x, p.z); T.set(b.x - a.x, surfY(b.x, b.z) - surfY(a.x, a.z), b.z - a.z).normalize();
      A.crossVectors(N_, T).normalize();
      // a seam that stops at the collar's break thins to a point there (never a square-cut end); a river bridges it
      const tp = rv || sCut >= L ? 1 : 0.06 + 0.94 * smoothstep(0, 7, Math.abs(sCut - sOf(i)) - 1);
      for (let j = 0; j <= SEG; j++) {
        oPos.push(P_.x, P_.y, P_.z); oAcr.push(A.x, A.y, A.z); oGold.push(sOf(i), (j / SEG - 0.5) * Math.PI, baseR * tp, L); oWin.push(g0, g1); on++;
      }
    }
    for (let i = 0; i < M - 1; i++) {
      if (!ok[i] || !ok[i + 1]) continue;
      for (let j = 0; j < SEG; j++) { const a = gb + i * (SEG + 1) + j, b = a + SEG + 1; oIdx.push(a, b, a + 1, b, b + 1, a + 1); }
    }
    if (g1 > 0) fronts.push(sm);
    if (!opens) continue;
    // peach blade over the open crack
    const lb = ln;
    for (let i = 0; i < M; i++) {
      const p = surf(pts[i].x, pts[i].z, 2);
      for (let j = 0; j < 2; j++) { lPos.push(p.x, p.y, p.z); lIds.push(sm.a, sm.b); lBl.push(j, cum[i], Math.min(1, Math.min(cum[i], L - cum[i]) / 12)); ln++; }
      if (i < M - 1) { const a = lb + i * 2; lIdx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    // threads: sagging catenaries between the two posed edges at the same seam point
    const prob = (sm.a === ISLE || sm.b === ISLE ? 0.3 : sm.near ? 0.24 : 0.07) * detail, TS = 8;   // the Hung Isle is drawn home on a fringe of threads
    for (let i = 1; i < M - 1; i++) {
      if (rng() > prob || !ok[i]) continue;
      const p = surf(pts[i].x, pts[i].z, 0.6), r0 = rng(), r1 = rng(), base = tn;
      for (let k = 0; k <= TS; k++) for (let sd = -1; sd <= 1; sd += 2) {
        tPos.push(p.x, p.y, p.z); tIds.push(sm.a, sm.b); tT.push(k / TS, sd); tRnd.push(r0, r1); tn++;
      }
      for (let k = 0; k < TS; k++) { const a = base + k * 2; tIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  }
  const mk = async (pos, attrs, idx) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    for (const [name, arr, n] of attrs) { await tick(); g.setAttribute(name, new THREE.Float32BufferAttribute(arr, n)); }
    await tick(); g.setIndex(idx); return g;
  };
  await tick(); const gold = await mk(oPos, [['aAcross', oAcr, 3], ['aGold', oGold, 4], ['aWin', oWin, 2]], oIdx);
  await tick(); const blades = await mk(lPos, [['aIds', lIds, 2], ['aBl', lBl, 3]], lIdx);
  await tick(); const threads = await mk(tPos, [['aIds', tIds, 2], ['aT', tT, 2], ['aRnd', tRnd, 2]], tIdx);
  await tick();
  return { gold, blades, threads, fronts };
}

// ---- shaders ----
// Pose of a shard: open pose times k(u), rocking scaled by k; exactly the identity once seated.
// Parameter texture rows: 0 (centroid, shrink) 1 (hinge axis, tilt) 2 (u0, u1, phase, rock) 3 (lift, crazeU, tint, -)
const POSE_GLSL = /* glsl */`
uniform highp sampler2D uShards; uniform float uU;
float openOf(float id) {
  if (id < -1.5) return 1.0; if (id < -0.5) return 0.0;
  vec4 a2 = texelFetch(uShards, ivec2(int(id + 0.5), 2), 0);
  return 1.0 - smoothstep(a2.x, a2.y, uU);
}
vec3 poseOf(vec3 p, float id) {
  if (id < -0.5) return p;
  int ix = int(id + 0.5);
  vec4 a2 = texelFetch(uShards, ivec2(ix, 2), 0);
  float k = 1.0 - smoothstep(a2.x, a2.y, uU);
  if (k <= 0.0) return p;
  vec4 a0 = texelFetch(uShards, ivec2(ix, 0), 0), a1 = texelFetch(uShards, ivec2(ix, 1), 0), a3 = texelFetch(uShards, ivec2(ix, 3), 0);
  vec3 c = a0.xyz, v = (p - c) * (1.0 - a0.w * k), ax = a1.xyz;
  float ang = (a1.w + a2.w * sin(uTime * 0.47 + a2.z)) * k, ca = cos(ang), sa = sin(ang);
  v = v * ca + cross(ax, v) * sa + ax * dot(ax, v) * (1.0 - ca);
  vec3 nC = normalize(vec3(0.0, 1600.0, 0.0) - c);
  return c + v + nC * (a3.x + 14.0 * a2.w * sin(uTime * 0.71 + a2.z * 1.7)) * k;
}`;

const GLAZE_VS = /* glsl */`
attribute vec4 aInfo;
varying vec3 vPos, vN, vSeat; varying vec4 vInfo; varying vec3 vSh;   // vSh = (open, crazeU, tint)
${LIGHT_GLSL}
${POSE_GLSL}
void main() {
  vec3 up = normalize(vec3(0.0, 1600.0, 0.0) - position);
  float id = aInfo.z, side = aInfo.w;
  vSeat = side < 0.0 ? position + up * ${THICK.toFixed(1)} : position;
  vec3 wp = poseOf(position, id), w2 = poseOf(position + up * 4.0, id);
  vN = normalize(w2 - wp) * side;
  vec4 a3 = texelFetch(uShards, ivec2(int(max(id, 0.0) + 0.5), 3), 0);
  vSh = vec3(max(openOf(id), openOf(aInfo.y)), a3.y, a3.z);
  vPos = wp; vInfo = aInfo;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;

const GLAZE_FS = /* glsl */`
precision highp float;
varying vec3 vPos, vN, vSeat; varying vec4 vInfo; varying vec3 vSh;
uniform vec3 uCopper, uCrackCol, uAbsorb, uMilk, uIron, uPig;
uniform sampler2D uPaint, uCollar;
uniform vec4 uCollarBox, uPaintW, uSeal, uStream;     // (minx, minz, 1/w, 1/h) (cx, cz, w, h) (cx, cz, half, on) (x, z, flow, on)
uniform float uU, uCrack, uFishScale, uFishAmt, uCrazeAll, uPaintAmt, uPigMix;
${LIGHT_GLSL}
${RELIEF_GLSL}
${UNDER_GLSL}
// the potter's seal: a fret maze of grooves 2 m wide pressed into the floor (no characters)
float sealAt(vec2 q) {
  vec2 a = abs(q); float m = max(a.x, a.y), hs = uSeal.z;
  if (m > hs) return 0.0;
  float frame = 1.0 - smoothstep(0.8, 1.25, abs(m - (hs - 2.5)));
  vec2 c = a - hs * 0.45; float cm = max(abs(c.x), abs(c.y));
  float ri = floor(cm / 4.0 + 0.5), dl = abs(cm - ri * 4.0);
  float g = (1.0 - smoothstep(0.8, 1.25, dl)) * step(cm, hs * 0.45 - 2.6) * step(0.5, ri);
  float sgn = mod(ri, 2.0) < 0.5 ? 1.0 : -1.0;
  float gap = step(0.0, sgn * c.x) * (1.0 - smoothstep(0.9, 1.4, abs(c.y - 2.0 * sgn)));       // each square broken once: a meander
  return clamp(max(frame, g * (1.0 - gap)), 0.0, 1.0);
}
float reliefAll(vec2 p, float fine, float top) {
  return (relief(p, fine) - 0.6 * sealAt(p - uSeal.xy) * uSeal.w) * top;
}
void main() {
  float side = vInfo.w, top = step(0.0, side);
  vec2 pw = vSeat.xz;
  // the hero's collar owns its ground: cut the wall to its outline, leaving the crack
  vec2 cuv = (pw - uCollarBox.xy) * uCollarBox.zw;
  float sd = 1e3;
  if (cuv.x > 0.0 && cuv.x < 1.0 && cuv.y > 0.0 && cuv.y < 1.0) { sd = textureLod(uCollar, cuv, 0.0).r * 64.0 - 16.0; if (sd < uCrack - 0.5) discard; }
  float d = min(vInfo.x, max(sd - uCrack, 0.0));
  float open = max(vSh.x, 1.0 - smoothstep(0.0, 8.0, sd - uCrack));
  vec3 V = normalize(cameraPosition - vPos + vec3(0.0, 1e-4, 0.0));
  vec3 N0 = normalize(vN), Nt = N0 * side;
  vec3 Tx = normalize(vec3(1.0, 0.0, 0.0) - Nt * Nt.x), Tz = normalize(vec3(0.0, 0.0, 1.0) - Nt * Nt.z);
  float nv0 = dot(N0, V);
  vec2 par = -vec2(dot(V, Tx), dot(V, Tz)) / max(abs(nv0), 0.35);
  float fw = max(length(fwidth(pw)), 1e-4);
  float fine = top * (1.0 - smoothstep(0.16, 0.75, fw * 0.33)) * (0.25 + 0.75 * smoothstep(0.12, 0.55, abs(nv0)));   // throwing rings soften to faint ridges at grazing angles
  float h0 = reliefAll(pw, fine, top), e = clamp(fw * 1.2, 0.3, 4.0);
  vec2 grad = vec2(reliefAll(pw + vec2(e, 0.0), fine, top) - h0, reliefAll(pw + vec2(0.0, e), fine, top) - h0) / e;
  vec3 N = normalize(N0 - (Tx * grad.x + Tz * grad.y) * 1.6);
  float nv = max(dot(N, V), 0.0);
  float tint = vSh.z, rOut = length(pw);
  float run = 0.16 * (1.0 - smoothstep(540.0, 800.0, rOut)) + 0.34 * (vnoise(pw * 0.013 + tint * 9.0) - 0.5) + 0.42 * (1.0 - smoothstep(60.0, 460.0, rOut));   // glaze ran down and pooled deep in the well
  float t = clamp(0.46 - 1.6 * h0 + run + (tint - 0.5) * 0.2 + 0.07 * (vnoise(pw * 0.045) - 0.5), 0.1, 1.4) * smoothstep(0.0, 2.5, d);
  t = mix(t, (0.6 + 0.3 * (vnoise(pw * 0.035) - 0.5) + 0.07 * sin(rOut * 1.0472)) * smoothstep(0.0, 2.5, d), 1.0 - top);
  float ta = min(t * (1.0 + uPool * smoothstep(0.5, 1.2, t)), 1.75);        // pooled glaze goes deep: dark jade in every groove and hollow
  vec3 base = uBiscuit * exp(-ta * uAbsorb / max(nv, 0.6));
  base = mix(base, uMilk * (0.82 + 0.3 * exp(-t * 1.2)), 0.14 * smoothstep(0.05, 0.4, t) * (1.0 - smoothstep(0.6, 1.1, t)));
  float under = smoothstep(0.12, 0.3, t) * top;
  vec2 pF = pw + par * 0.5, pC1 = pw + par * 0.3, pC2 = pw + par * 0.12;
  // iron red pressed into the seal's grooves, green pooled over it
  float sl = sealAt(pF - uSeal.xy) * uSeal.w * top;
  base = mix(base, base * uIron, sl * 0.75);
  // paint under the glaze: the wall picture and the shore strip beside the low pass
  vec2 dW = pF - uPaintW.xy, upW = normalize(uPaintW.xy), wuv = vec2(dot(dW, vec2(upW.y, -upW.x)) / uPaintW.z + 0.5, dot(dW, upW) / uPaintW.w + 0.5);
  float inW = step(0.0, wuv.x) * step(wuv.x, 1.0) * smoothstep(0.0, 0.07, wuv.y) * step(wuv.y, 1.0);
  float pm = texture2D(uPaint, vec2(clamp(wuv.x, 0.0, 1.0), 0.25 + 0.75 * clamp(wuv.y, 0.002, 1.0))).r * inW;
  vec2 suv = vec2(pF.y / 104.0, (pF.x - 30.0) / 28.0);
  float inS = step(0.0, suv.y) * step(suv.y, 1.0) * smoothstep(-200.0, -186.0, pF.y) * (1.0 - smoothstep(70.0, 100.0, pF.y));
  pm = max(pm, texture2D(uPaint, vec2(suv.x, clamp(suv.y, 0.0, 0.995) * 0.25)).r * inS);
  pm = smoothstep(0.1, 0.66, pm + (vnoise(pF * 2.3) - 0.5) * 0.3 * pm);                 // a brushed edge, crisp when the lens is close
  pm *= under * uPaintAmt * (0.75 + 0.25 * vnoise(pF * 1.3));
  float lumB = dot(base, vec3(0.3, 0.5, 0.2));
  base = mix(base, mix(base * uCopper * 0.95 + uCopper * vec3(0.1, 0.015, 0.0), uPig * max(0.55 + 0.6 * lumB, 0.82), uPigMix), pm * mix(0.86, 0.95, uPigMix));   // pigment under glass: copper red on any ware
  // glaze fish: copper dabs half a metre down, idling in shoals, packing at open cracks, streaming over under new gold
  float rr = length(pF), aa = atan(pF.x, abs(pF.y) < 1e-3 ? 1e-3 : pF.y), band = floor(rr / 42.0);
  float dirn = mod(band, 2.0) * 2.0 - 1.0;
  vec2 q = vec2(aa * 660.0 + dirn * (uTime * (3.2 + 2.0 * hash21(vec2(band, 3.0)))), (rr + 1.5 * sin(aa * 90.0 + uTime * 0.2)) * 0.62) / uFishScale;
  float lane = (1.0 - smoothstep(18.0, 60.0, abs(pF.x - 62.0))) * smoothstep(-200.0, -150.0, pF.y) * (1.0 - smoothstep(110.0, 190.0, pF.y));
  float shoal = smoothstep(0.4, 0.56, vnoise(vec2(q.x, q.y / 0.62) * 0.021 * uFishScale + vec2(band * 3.7, uTime * 0.01)) + 0.35 * open * exp(-d / 30.0) + 0.4 * lane);
  float fishFade = under * uFishAmt * (1.0 - smoothstep(0.12, 0.4, fw / uFishScale)) * smoothstep(0.17 + 0.055 * uFishScale, 0.4 + 0.055 * uFishScale, abs(nv0)) * smoothstep(1.6, 3.4, length(cameraPosition - vPos) / uFishScale);   // seen along the glaze a dab is only a streak: they show where the lens looks down on them
  vec2 sq = pF - uStream.xy; float srm = (1.0 - smoothstep(40.0, 58.0, length(sq))) * uStream.w;
  vec2 f2 = vec2(0.0);
  if (fishFade > 0.01) {
    if (srm < 0.99 && shoal > 0.01) {
      f2 = fish(q, uTime);
      if (fw < 0.5) f2 = max(f2, fish(q * 1.31 + vec2(17.3, 41.9), uTime + 3.0));     // a second, smaller year-class when near
      f2 *= shoal * (1.0 - srm);
    }
    if (srm > 0.01) {
      float al = sq.y - uStream.z; fishFade = max(fishFade, under * srm * (1.0 - smoothstep(0.2, 0.5, fw)));
      float sm = smoothstep(-40.0, -32.0, al) * (1.0 - smoothstep(-8.0, -2.0, al)) * (1.0 - smoothstep(15.0, 24.0, abs(sq.x + 4.0)));
      f2 = max(f2, fish(vec2(al + 0.6 * sin(uTime * 0.5), sq.x * 0.62) / 0.5, uTime * 1.6) * sm * srm);
      f2 = max(f2, fish(vec2(al * 1.13 + 0.5 * sin(uTime * 0.4 + 2.0) + 9.4, sq.x * 0.7 + 23.7) / 0.5, uTime * 1.6 + 2.0) * sm * srm);   // the shoal is thick here
    }
    f2 *= fishFade;
  }
  base *= mix(vec3(1.0), vec3(0.84, 0.96, 0.88), f2.y * 0.6);                 // the copper bled a little green round each dab
  base = mix(base, mix(base * uCopper * 0.92 + uCopper * vec3(0.07, 0.01, 0.0), uPig * max(0.55 + 0.6 * lumB, 0.82), uPigMix), f2.x * 0.82);   // dabs lie under the glass, dimmer than the gold, never darker than deep jade
  // crackle: a net that arrives on each shard as weather
  float crz = clamp((uU - vSh.y) / 0.025, 0.0, 1.0) + uCrazeAll;
  float crazeOn = smoothstep(0.0, 0.22, crz * 1.3 - vnoise(pw * 0.017 + 5.0)), crazeOld = (0.32 + 0.68 * crazeOn) * (0.25 + 0.75 * vnoise(pw * 0.09 + 11.0));
  vec2 warp = (vec2(vnoise(pw * 0.31), vnoise(pw * 0.31 + 37.0)) - 0.5) * 1.5;
  float cf1 = 1.0 - smoothstep(0.2, 0.7, fw / 1.6), cf2 = 1.0 - smoothstep(0.1, 0.36, fw / 0.45);
  vec2 c1 = cf1 > 0.01 ? crackle((pC1 + warp) / 1.9) : vec2(1.0, 0.0);
  float line1 = (1.0 - smoothstep(0.006, 0.018 + fw * 0.55, c1.x)) * cf1, line2 = 0.0;
  if (cf2 > 0.01) { vec2 c2 = crackle((pC2 + warp * 0.6) / 0.45 + 17.0); line2 = (1.0 - smoothstep(0.02, 0.05 + fw * 1.0, c2.x)) * cf2 * 0.4; }
  base *= mix(vec3(1.0), uCrackCol * 0.9, clamp(line1 * 0.6 * crazeOld + line2 * (0.35 + 0.65 * step(c1.y, 0.45)) * crazeOn, 0.0, 1.0) * under);
  // light: wrapped diffuse from the afterglow and the dove fill; nothing falls below deep jade
  float kd = dot(N, uGlowDir) * 0.5 + 0.5, fd = N.y * 0.5 + 0.5;
  vec3 light = uGlowCol * 1.2 * (litK(N) - uShade * 0.85) + uFillCol * (0.3 + 0.7 * fd * fd) * 1.2;   // the shaded side keeps only the sky's cool fill
  vec3 col = base * light;
  // peach up-light: a 3 m lip beside an open crack, and the undersides of what hangs
  float lip = (exp(-d / 3.0) + 0.3 * exp(-d / 16.0)) * open * top;
  col += base * mix(uPeach, uDeep, 0.3) * 1.1 * uUpLight * (0.3 * lip + (1.0 - top) * (0.18 + 0.42 * max(-N.y, 0.0)));
  col = max(col, uBiscuit * exp(-1.75 * uAbsorb) * 0.34);                 // the deepest pool is ink green, never black
  col = mix(col, max(col, uPig * (0.3 + dot(uFillCol, vec3(0.33)))), clamp(f2.x * 1.15, 0.0, 1.0) * top);   // a dab keeps its copper red on the shaded side
  vec3 Rr = reflect(-V, normalize(mix(N0, N, 0.25 + 0.6 * smoothstep(0.15, 0.6, abs(nv0))))); Rr.y = mix(Rr.y, abs(Rr.y) + 0.02, top);   // seen along the wall the sky lies on the glaze as one soft streak, not a band per ring   // the bowl hides the cloud sea from its own inside
  float fres = 0.04 + 0.96 * pow(clamp(1.0 - nv, 0.0, 1.0), 5.0);
  col = mix(col, min(skyCol(Rr), vec3(1.1)), clamp(fres, 0.0, 1.0) * 0.36 * (1.0 - 0.65 * pm));   // the brushwork holds its colour under the sky's reflection
  float hl = max(dot(Rr, uGlowDir), 0.0); float hl2 = hl * hl; hl2 *= hl2; hl2 *= hl2; hl2 *= hl2 * hl2 * hl;
  col = min(col, vec3(0.86));
  col += uGlowCol * 0.2 * hl2 * (0.8 + 0.4 * vnoise(pw * 0.35 + vec2(uTime * 0.16, uTime * 0.09))) * top;        // the one long wet highlight, never quite still
  if (top < 0.5) {
    // what hangs shows its foot: rough unglazed clay, no rings, lit only by the cloud sea below it. Deep peach beside
    // the broken edge, falling to a dusky rose-grey toward the middle, so it stands a stop under the cloud it hangs over.
    float gU = 0.5 * vnoise(pw * 0.8) + 0.3 * vnoise(pw * 0.09 + 3.0) + 0.2 * vnoise(pw * 4.1) * (1.0 - smoothstep(0.1, 0.5, fw));
    float eU = exp(-d / 30.0), eN = exp(-d / 5.0), dn = 0.45 + 0.55 * max(-N0.y, 0.0);
    vec4 ch = chips(vec3(pw.x, 0.0, pw.y) / 7.5 + 2.1);              // the foot was never trimmed: broad shallow scoops
    float sc = clamp(0.5 + 1.1 * (ch.x * 0.6 + ch.z * 0.8), 0.0, 1.0), crk = 1.0 - smoothstep(0.0, 0.05 + fw * 0.02, ch.w);
    vec3 clay = uBiscuit * (0.36 + 0.2 * gU + 0.12 * sc) * (1.0 - 0.3 * crk);
    vec3 lightU = mix(mix(uPeach, uDeep, 0.55) * 0.5 + uFillCol * 0.55, mix(uPeach, uDeep, 0.6), eU) * uUpLight * (0.3 + 0.5 * eU + 0.35 * eN);
    lightU *= 0.86 + 0.28 * vnoise(pw * 0.035 + vec2(uTime * 0.3, -uTime * 0.2));   // the cloud sea's light is never still on what hangs over it
    col = clay * (lightU * dn * (0.35 + 0.65 * open) + uFillCol * 0.12);
  }
  gl_FragColor = vec4(haze(min(col, vec3(0.97)), length(cameraPosition - vPos)), 1.0);
}`;

const BISCUIT_VS = /* glsl */`
attribute vec4 aInfo; attribute vec3 aNrm;
varying vec3 vPos, vSeat, vN; varying vec4 vInfo; varying float vOpen;
${LIGHT_GLSL}
${POSE_GLSL}
void main() {
  vec3 wp = poseOf(position, aInfo.y);
  vN = normalize(poseOf(position + aNrm * 3.0, aInfo.y) - wp + vec3(0.0, 1e-5, 0.0));   // a smooth wall normal: the chips are cut in the shader
  vOpen = max(openOf(aInfo.y), openOf(aInfo.w));
  vPos = wp; vSeat = position; vInfo = aInfo;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
const BISCUIT_FS = /* glsl */`
precision highp float;
varying vec3 vPos, vSeat, vN; varying vec4 vInfo; varying float vOpen;
uniform vec3 uGlass;
uniform sampler2D uCollar; uniform vec4 uCollarBox; uniform float uCrack;
${LIGHT_GLSL}
void main() {
  vec3 V = normalize(cameraPosition - vPos + vec3(0.0, 1e-4, 0.0));
  vec3 N = normalize(vN + vec3(0.0, 1e-6, 0.0));
  if (dot(N, V) < -0.2) N = -N;
  // a shard's own wall stops where the collar's ground begins (its unlit end would stand in the collar's crack)
  vec2 cuv = (vSeat.xz - uCollarBox.xy) * uCollarBox.zw; float sd = 1e3;
  if (cuv.x > 0.0 && cuv.x < 1.0 && cuv.y > 0.0 && cuv.y < 1.0) sd = textureLod(uCollar, cuv, 0.0).r * 64.0 - 16.0;
  if (vInfo.w > -1.5 && sd < uCrack + 0.4) discard;
  float nearCrack = 1.0 - smoothstep(0.0, 8.0, sd - uCrack);
  float depth = vInfo.x, rimK = vInfo.w > -1.5 && vInfo.w < -0.5 ? 1.0 : 0.0, open = mix(max(smoothstep(0.0, 0.3, vOpen), nearCrack), 0.25, rimK) * (vInfo.w < -1.5 && depth > 7.5 ? 0.5 : 0.85);
  vec2 gp = vSeat.xz * 0.9 + vSeat.y * vec2(0.63, -0.41);
  float fw = max(length(fwidth(gp)), 1e-4);
  // the foot ring: a wall of its own under the floor. Sky and fill on its top and upper face, the cloud sea's peach only
  // toward its foot, and the glaze that ran down the bowl's outside pooled dark in its inner corner
  float foot = step(vInfo.w, -2.5), rr = length(vSeat.xz) - ${FOOT_R.toFixed(1)}, dW = mix(depth, clamp((depth - 8.0) * 0.4, 0.0, 9.0), foot);
  open = mix(open, 0.7 * smoothstep(12.0, 29.0, depth), foot);
  float lipK, edgeK; vec3 Nb = N;
  N = biscuitN(Nb, vSeat, fw, lipK, edgeK);
  vec3 col = biscuitShade(N, Nb, gp, dW, fw, open, lipK, edgeK, vInfo.z);
  float capK = foot * smoothstep(0.5, 0.8, Nb.y);
  col = mix(col, col * 0.55 + uBiscuit * (uFillCol * 0.9 + uGlowCol * 0.35 * litK(Nb)) * 0.5, capK);          // its top catches the sky: a pale line
  float pool = foot * max(capK * (1.0 - smoothstep(-5.6, -4.2, rr)), step(rr, 0.0) * (1.0 - capK) * (1.0 - smoothstep(9.2, 11.0, depth)));
  col = mix(col, uGlass * 0.22 * (uFillCol * 1.4 + uGlowCol * 0.4) + skyCol(reflect(-V, Nb)) * 0.06, pool * 0.9);
  float glassLine = (1.0 - smoothstep(0.42, 0.55 + fw * 0.3, depth));
  vec3 glass = uGlass * (0.3 + 0.22 * vnoise(gp * 3.3)) * (uFillCol * 1.3 + uGlowCol * 0.6 * litK(Nb)) + skyCol(reflect(-V, N)) * 0.05 + uGlass * uPeach * uUpLight * 0.05 * open;
  col = mix(col, min(glass, vec3(0.5)), glassLine);
  gl_FragColor = vec4(haze(col, length(cameraPosition - vPos)), 1.0);
}`;

// Gold: one half-round ribbon per seam. front = (L + 8) * progress of the seam's window; nothing beyond the front,
// a crown at it, heat behind it. Shaded by the hero's GOLD_FS.
const GOLD_VS = /* glsl */`
attribute vec3 aAcross; attribute vec4 aGold; attribute vec2 aWin;
uniform float uU; uniform vec2 uRes;
varying vec3 vPos, vN, vT, vA; varying vec4 vG;
void main() {
  float s = aGold.x, phi = aGold.y, baseR = aGold.z, L = aGold.w;
  float prog = clamp((uU - aWin.x) / max(aWin.y - aWin.x, 1e-4), 0.0, 1.0), front = (L + 8.0) * prog, behind = front - s;
  float running = step(0.0005, prog) * (1.0 - step(0.9995, prog));
  float grow = (1.0 - smoothstep(front - 6.0, front, s)) * step(0.0005, prog);
  float crown = exp(-behind * behind / 9.0) * running;
  float heat = behind > 0.0 ? exp(-behind / (baseR > 1.5 ? 60.0 : 18.0)) * (1.0 - smoothstep(0.0, 0.07, uU - aWin.y)) : 0.0;   // a river glows a long way behind its front
  vec3 nrm = normalize(vec3(0.0, 1600.0, 0.0) - position);
  float rad = baseR * grow * (1.0 + 1.2 * crown), sp = sin(phi), cp = cos(phi);
  float pxm = distance(cameraPosition, position) * 2.0 / max(projectionMatrix[1][1] * uRes.y, 1.0);
  rad = max(rad, 2.3 * pxm * grow);                                   // a far seam holds three pixels: mended with gold reads from across the bowl
  vec3 p = position + aAcross * sp * rad + nrm * (cp * rad * (0.5 + 0.25 * crown) - 0.06);
  vN = normalize(aAcross * sp * 0.55 + nrm * cp + nrm * 0.02); vA = aAcross; vT = normalize(cross(nrm, aAcross));
  vPos = p; vG = vec4(s, sp * baseR, heat * 0.85, crown * 0.8);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;

const THREAD_VS = /* glsl */`
attribute vec2 aIds, aT, aRnd;
uniform vec2 uRes;
varying vec3 vPos; varying vec3 vTR;
${LIGHT_GLSL}
${POSE_GLSL}
void main() {
  vec3 A = poseOf(position, aIds.x), B = poseOf(position, aIds.y);
  float gap = length(B - A), t = aT.x, bow = 4.0 * t * (1.0 - t);
  float slack = min(gap * (0.1 + 0.5 * aRnd.x), 6.0 + gap * 0.08) + 0.3;   // a long thread is nearly taut: it draws its shard home
  vec3 sway = vec3(sin(uTime * 0.43 + aRnd.y * 6.28), 0.0, cos(uTime * 0.37 + aRnd.x * 6.28)) * gap * 0.03;
  vec3 p = mix(A, B, t) + (vec3(0.0, -slack, 0.0) + sway) * bow;
  vec3 tg = (B - A) + vec3(0.0, -slack, 0.0) * 4.0 * (1.0 - 2.0 * t) + vec3(1e-3, 0.0, 0.0);
  vec3 toCam = cameraPosition - p; float dist = max(length(toCam), 0.1);
  vec3 sd = cross(tg, toCam); float sl = length(sd); sd = sl > 1e-5 ? sd / sl : vec3(1.0, 0.0, 0.0);
  float px = dist * 2.0 / max(projectionMatrix[1][1] * uRes.y, 1.0);
  float base = 0.07 + 0.05 * aRnd.y, halfW = max(base, 0.8 * px) * smoothstep(0.25, 1.2, gap);
  p += sd * aT.y * halfW;
  vPos = p; vTR = vec3(t, clamp(base / max(halfW, 1e-4), 0.0, 1.0), aRnd.x);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  if (gap < 0.25) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const THREAD_FS = /* glsl */`
precision highp float;
varying vec3 vPos; varying vec3 vTR;
uniform vec3 uF0, uEmber; uniform float uGoldLift;
${LIGHT_GLSL}
void main() {
  float g = 0.5 + 0.5 * sin(vTR.x * 9.0 + uTime * 1.3 + vTR.z * 40.0); g *= g; g *= g;
  vec3 col = uF0 * (uFillCol * 0.4 + uGlowCol * 0.3 + uPeach * uUpLight * 0.16) + uEmber * (0.12 + 1.9 * g * g) * mix(0.4, 1.0, vTR.y);
  col += uF0 * mix(uF0, vec3(1.0), 0.3) * (0.1 + 1.2 * uGoldLift) * mix(0.5, 1.0, vTR.y);
  col = mix(col, mix(uF0, vec3(1.0), 0.6) * (uGlowCol * 0.75 + uPeach * 0.35), (1.0 - vTR.y) * 0.7);   // far off: a pale bright hairline
  gl_FragColor = vec4(haze(col, length(cameraPosition - vPos)), 1.0);
}`;

// Peach blades: the light of the cloud sea standing up through every open crack; narrows and goes out as it closes.
const BLADE_VS = /* glsl */`
attribute vec2 aIds; attribute vec3 aBl;
varying vec3 vB; varying float vDist;
${LIGHT_GLSL}
${POSE_GLSL}
void main() {
  vec3 A = poseOf(position, aIds.x), B = poseOf(position, aIds.y);
  float gap = length(B - A);
  float hgt = min(7.0 + gap * 2.2, 30.0) * (0.7 + 0.3 * sin(aBl.y * 0.07 + uTime * 0.13));   // low: the light stands in the crack, it never veils the floes behind
  vec3 p = mix(A, B, 0.5) + normalize(vec3(0.0, 1600.0, 0.0) - position) * hgt * aBl.x;
  vB = vec3(aBl.x, aBl.y, smoothstep(0.4, 3.0, gap) * aBl.z); vDist = distance(cameraPosition, p);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const BLADE_FS = /* glsl */`
precision highp float;
varying vec3 vB; varying float vDist;
uniform float uBlade;
${LIGHT_GLSL}
void main() {
  float t = vB.x, f = 1.0 - t; f = f * f * f * smoothstep(0.0, 0.04, t);
  float streak = 0.55 + 0.45 * vnoise(vec2(vB.y * 0.22 + 0.5 * sin(uTime * 0.21 + vB.y * 0.01), uTime * 0.17));
  float a = f * streak * vB.z * uBlade * exp(-vDist * uHazeK) * smoothstep(1.5, 9.0, vDist);
  gl_FragColor = vec4(mix(uPeach, uDeep, 0.6) * uUpLight * a, 1.0);
}`;

// Sky: the hero's analytic sky, with slow cloud-top noise in the lower hemisphere (seen only through the cracks).
const SKY_VS = /* glsl */`varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); if (abs(gl_Position.w) < 1e-4) gl_Position.w = 1e-4; gl_Position.z = gl_Position.w * 0.9999; }`;
const SKY_FS = /* glsl */`
precision highp float;
varying vec3 vD;
${LIGHT_GLSL}
void main() {
  vec3 d = normalize(vD + vec3(0.0, 1e-5, 0.0));
  vec3 c = skyCol(d);
  if (d.y < 0.02) {
    vec2 cp = d.xz / max(-d.y + 0.12, 0.05) * 3.0 + vec2(uTime * 0.034, uTime * 0.02);   // the cloud tops roll under the bowl
    float n = vnoise(cp) * 0.5 + vnoise(cp * 2.3 + 7.0) * 0.27 + vnoise(cp * 5.1 + vec2(uTime * 0.07, -uTime * 0.04)) * 0.15 + vnoise(cp * 11.3) * 0.08;
    float bil = smoothstep(0.25, 0.8, n), rim = smoothstep(0.5, 0.72, n) * (1.0 - smoothstep(0.72, 0.92, n));
    // a floor to the hole: saturated peach billows, deeper rose in the troughs between them, a paler lit crest on each
    vec3 sea = mix(uDeep * vec3(0.8, 0.7, 0.76), mix(uDeep, uPeach, 0.72) * 1.08, bil) + uPeach * 0.16 * rim;
    c = mix(c, sea, 1.0 - smoothstep(-0.05, 0.02, d.y));
  }
  c += uGlowCol * 0.1 * pow(max(1.0 - abs(d.y), 0.0), 8.0);
  // Where the ray leaves the bowl's sphere below the rim it has passed through a crack or the gap: the bowl hangs
  // IN the lit cloud, so every break blazes peach whatever the angle, not only those we look down through.
  vec3 ro = cameraPosition - vec3(0.0, 1600.0, 0.0);
  float bq = dot(ro, d), disc = bq * bq - (dot(ro, ro) - 2560000.0);
  if (disc > 0.0) {
    float yExit = cameraPosition.y + d.y * (-bq + sqrt(disc));
    float thru = (1.0 - smoothstep(322.0, 356.0, yExit)) * smoothstep(-0.02, 0.06, d.y);
    vec2 cq = d.xz * 5.0 + vec2(uTime * 0.011, d.y * 7.0 - uTime * 0.008);
    float cn = vnoise(cq) * 0.65 + vnoise(cq * 2.7 + 5.0) * 0.35;
    c = mix(c, mix(uDeep * 0.8, mix(uDeep, uPeach, 0.5) * 1.3, cn * cn * (3.0 - 2.0 * cn)), thru);
  }
  gl_FragColor = vec4(c, 1.0);
}`;

// Gold dust: pollen in a box that follows the lens; a few are bright, most are faint.
const DUST_VS = /* glsl */`
attribute vec4 aRnd;
uniform vec2 uRes; uniform float uTime, uDust;
varying float vA;
void main() {
  vec3 drift = vec3(0.6, 0.25, 0.9) * uTime * (0.7 + 1.5 * aRnd.x) + vec3(sin(uTime * 0.31 + aRnd.y * 30.0), sin(uTime * 0.23 + aRnd.z * 30.0), cos(uTime * 0.27 + aRnd.w * 30.0)) * 1.4;
  vec3 p = mod(position + drift - cameraPosition + 40.0, 80.0) - 40.0;
  float dc = length(p); p += cameraPosition;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float dist = max(-mv.z, 0.1), sizeM = 0.09 + 0.3 * aRnd.z * aRnd.z;
  float px = sizeM * projectionMatrix[1][1] * uRes.y * 0.5 / dist;
  gl_PointSize = clamp(px, 1.6, 16.0);
  vA = uDust * clamp(px / 1.6, 0.35, 1.0) * (0.45 + 0.55 * aRnd.w) * (1.0 - smoothstep(30.0, 40.0, dc)) * smoothstep(1.0, 4.0, dist) * (0.55 + 0.45 * sin(uTime * 2.0 + aRnd.x * 50.0));   // each mote turns in the light: a slow twinkle (a third of a hertz, eased)
  gl_Position = projectionMatrix * mv;
}`;
const DUST_FS = /* glsl */`
precision highp float;
varying float vA; uniform vec3 uEmber;
void main() { vec2 c = gl_PointCoord - 0.5; float f = max(1.0 - dot(c, c) * 4.0, 0.0); gl_FragColor = vec4(uEmber * 2.1 * f * f * vA, 1.0); }`;

// ---- the painting under the glaze: one 1024 canvas, red channel = how much copper the brush left ----
// Top 768 rows: the wall picture (420 x 315 m). Bottom 256 rows: the shore strip beside the low pass (104 x 28 m, tiling).
async function paintTexture(rng, cast, tick) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1024;
  const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round';
  // one loaded-brush stroke: fat at the root, thinning, dry-brushed (broken) toward the tip
  const stroke = (x0, y0, x1, y1, bend, w0, w1, dry = 0.5) => {
    const mx = (x0 + x1) / 2 - (y1 - y0) * bend, my = (y0 + y1) / 2 + (x1 - x0) * bend, n = Math.max(8, Math.round(Math.hypot(x1 - x0, y1 - y0) / 5));
    let px = x0, py = y0;
    for (let i = 1; i <= n; i++) {
      const t = i / n, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t, x = a * x0 + b * mx + c * x1, y = a * y0 + b * my + c * y1;
      const dryT = Math.max(0, (t - (1 - dry)) / Math.max(dry, 1e-3));
      g.globalAlpha = (0.95 - 0.55 * dryT) * (dryT > 0.2 && rng() < dryT * 0.55 ? 0.25 : 1);
      g.lineWidth = Math.max(1, lerp(w0, w1, Math.pow(t, 0.8)) * Math.min(1, 0.22 + t * 7));   // the brush touches down as a point
      g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke(); px = x; py = y;
    }
    g.globalAlpha = 1;
  };
  const blob = (x, y, rx, ry, rot, a = 0.95) => { g.globalAlpha = a; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; };
  if (cast === 0) {
    // reeds: single strokes 120 m tall, with long leaves; two cranes, one landing
    for (let i = 0; i < 9; i++) {
      await tick();
      const x = 90 + i * 100 + rng.range(-30, 30), h = rng.range(300, 420), lean = rng.range(-70, 70);
      stroke(x, 768, x + lean, 768 - h, rng.range(-0.08, 0.08), 20, 5, 0.45);
      for (let k = 0; k < 3; k++) { const y = 768 - h * rng.range(0.25, 0.8), dir = rng.sign(); stroke(x + lean * (768 - y) / h, y, x + dir * rng.range(60, 130), y - rng.range(10, 120), dir * 0.25, 13, 2, 0.6); }
      blob(x + lean, 768 - h - 16, 9, 30, lean * 0.004, 0.85);
    }
    const crane = (cx, cy, s, landing) => {
      blob(cx, cy, 52 * s, 30 * s, -0.25);
      stroke(cx + 40 * s, cy - 12 * s, cx + 78 * s, cy - 110 * s, -0.35, 13 * s, 7 * s, 0.1); blob(cx + 80 * s, cy - 116 * s, 11 * s, 8 * s, 0);
      stroke(cx + 86 * s, cy - 116 * s, cx + 128 * s, cy - 104 * s, 0, 5 * s, 1.5, 0.2);
      stroke(cx - 6 * s, cy + 24 * s, cx - 14 * s, cy + (landing ? 100 : 140) * s, 0.05, 5 * s, 3 * s, 0.2); stroke(cx + 12 * s, cy + 24 * s, cx + (landing ? 40 : 16) * s, cy + (landing ? 96 : 140) * s, -0.1, 5 * s, 3 * s, 0.2);
      for (let k = 0; k < 5; k++) stroke(cx - 36 * s, cy - 4 * s, cx - (88 + k * 10) * s, cy + (22 - k * 13) * s, 0.12, 15 * s, 3, 0.5);
      if (landing) for (let k = 0; k < 7; k++) stroke(cx - 6 * s, cy - 18 * s, cx - (70 - k * 26) * s, cy - (130 + 22 * Math.sin(k * 0.6)) * s, 0.1, 17 * s, 3, 0.5);
    };
    crane(330, 300, 1.1, true); crane(690, 520, 1.25, false);
  } else if (cast === 1) {
    // pines and deer
    for (let i = 0; i < 4; i++) {
      await tick();
      const x = 130 + i * 250 + rng.range(-50, 50), h = rng.range(380, 560), lean = rng.range(-80, 80);
      stroke(x, 768, x + lean, 768 - h, rng.range(-0.15, 0.15), 30, 9, 0.2);
      for (let k = 0; k < 6; k++) {
        const t = 0.35 + k * 0.11, bx = x + lean * t, by = 768 - h * t, dir = k % 2 ? 1 : -1, len = rng.range(70, 150) * (1.2 - t * 0.6);
        stroke(bx, by, bx + dir * len, by - rng.range(-10, 40), dir * 0.2, 11, 4, 0.2);
        for (let q = 0; q < 9; q++) { const fx = bx + dir * len * rng.range(0.3, 1.05), fy = by - rng.range(0, 30); for (let n = 0; n < 5; n++) stroke(fx, fy, fx + rng.range(-34, 34), fy - rng.range(14, 40), 0, 3.5, 1, 0.5); }
      }
    }
    const deer = (cx, cy, s, flip) => {
      const f = flip ? -1 : 1;
      blob(cx, cy, 58 * s, 26 * s, 0.05 * f); stroke(cx + f * 44 * s, cy - 10 * s, cx + f * 70 * s, cy - 66 * s, 0.1 * f, 20 * s, 11 * s, 0.05); blob(cx + f * 80 * s, cy - 72 * s, 18 * s, 10 * s, 0.3 * f);
      for (const lx of [-42, -28, 30, 44]) stroke(cx + f * lx * s, cy + 16 * s, cx + f * (lx + rng.range(-8, 8)) * s, cy + 92 * s, 0.05, 8 * s, 3 * s, 0.2);
      for (const a of [-0.3, 0.25]) { stroke(cx + f * 74 * s, cy - 80 * s, cx + f * (74 + 40 * a) * s, cy - 140 * s, a * 0.4, 4.5 * s, 2, 0.2); stroke(cx + f * (74 + 20 * a) * s, cy - 110 * s, cx + f * (90 + 50 * a) * s, cy - 128 * s, 0, 3.5 * s, 1.5, 0.2); }
    };
    deer(400, 560, 1.2, false); deer(700, 640, 0.9, true);
  }
  // shore strip: iron-red brush grass 2-5 m tall and six tiny pavilions, "up" = the way we fly (+x on the canvas)
  if (cast !== 2) {
    for (let i = 0; i < 110; i++) {
      if (i % 12 === 0) await tick();
      const x = rng.range(0, 1024), y = 768 + 14 + 228 * Math.pow(rng(), 0.7), h = rng.range(14, 38), nb = rng.int(3, 6);
      for (let k = 0; k < nb; k++) { const a = (k / (nb - 1) - 0.5) * 1.1 + rng.range(-0.1, 0.1); for (const ox of [0, -1024, 1024]) stroke(x + ox, y, x + ox + Math.cos(a) * h, y + Math.sin(a) * h, a * 0.3, 3.2, 1, 0.6); }
    }
    for (let i = 0; i < 6; i++) {
      const x = 80 + i * 165 + rng.range(-30, 30), y = 800 + rng.range(0, 180), s = rng.range(0.9, 1.3);
      g.fillStyle = '#000'; g.fillRect(x - 6, y - 26 * s, 44 * s, 52 * s); g.fillStyle = '#fff';
      stroke(x + 30 * s, y, x + 20 * s, y - 22 * s, 0.25, 6, 2.5, 0.1); stroke(x + 30 * s, y, x + 20 * s, y + 22 * s, -0.25, 6, 2.5, 0.1);
      stroke(x, y - 11 * s, x + 20 * s, y - 11 * s, 0, 2.5, 2.5, 0); stroke(x, y + 11 * s, x + 20 * s, y + 11 * s, 0, 2.5, 2.5, 0); stroke(x, y - 15 * s, x, y + 15 * s, 0, 3, 3, 0);
    }
  }
  await tick();
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; tex.anisotropy = 4; tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

export default {
  id: 'mended-country',
  name: 'The Country Mended with Gold',
  category: 'bizarre',
  media: ['air', 'interior'],
  weirdness: 0.8,
  async build(ctx) {
    const { rng } = ctx;
    const vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---- the visit: hour, ware, painting and cast, weather; the rare event is a Shard from another bowl ----
    const hourKey = vary.hour === 'night' ? 'moon' : vary.hour === 'dawn' ? 'dawn' : (vary.hour === 'golden' || vary.hour === 'day') ? 'dusk' : rng.pick(['dusk', 'dusk', 'moon', 'dawn']);
    const H = HOURS[hourKey], ware = rng.pick([WARES[0], WARES[0], WARES[1], WARES[2]]);
    const cast = rng.int(0, 2), weather = rng.pick(['still', 'dust', 'craze']), rare = !!vary.rare;
    const pal = ware.pal.slice(); pal[6] = H.peach;
    if (hourKey === 'moon' && ware.name !== 'sea-green') pal[4] = ware.name === 'ivory' ? '#D69A6A' : '#E3CB86';   // paler gold by moonlight
    const glowDir = new THREE.Vector3(hourKey === 'dawn' ? -0.6 : 0.6, 0.37, 0.79).normalize();   // the afterglow softbox: its band stands just above the rim line ahead, and its long wet highlight lies in frame
    const scene = new THREE.Scene();

    // ---- the hero: the Last Shard and its collar, seated on the north meridian ----
    const hero = await buildHero(ctx, { palette: pal, glowDir, detail, startU: 0.1, seatU: SEAT_U, meetU: 0.925, chipU: 0.948 });
    const PL = hero.anchors.placement;
    hero.object.position.fromArray(PL.position); hero.object.rotation.y = PL.rotationY; hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    const toWorld = (a) => new THREE.Vector3(-a[0], a[1] + PL.position[1], PL.position[2] - a[2]);
    const U = hero.uniforms;
    U.uPeach.value.copy(linV(H.peach)); U.uDeep.value.copy(linV(H.deep)); U.uUpLight.value = H.up; U.uZenith.value.copy(linV(H.zen)); U.uRimSky.value.copy(linV(H.rim));
    U.uGlowCol.value.copy(linV(H.glow, H.glowK)); U.uFillCol.value.copy(linV(H.fill, 0.45));
    if (ware.name === 'ivory') {
      // a white ware: the fill is held near cream and bright enough that the wall reads porcelain, not putty; the
      // lilac-grey lives where the glaze is thick (grooves, petals, pooled hollows) and in the craze lines
      U.uFillCol.value.lerp(linV('#ECE6D8', 0.64), 0.8);
      U.uAbsorb.value.set(0.36, 0.41, 0.31); U.uMilk.value.copy(linV('#E9E3D6')); U.uPool.value = 2.0;   // thin glaze stays ivory; pooled glaze goes lilac-grey in every groove
    }
    U.uHazeCol.value.copy(linV(H.haze)); U.uHazeK.value = hourKey === 'moon' ? 1 / 1500 : 1 / 2600;
    U.uCrackCol.value.copy(new THREE.Vector3().fromArray(new THREE.Color(ware.crack).toArray().map(Math.sqrt)));
    await ctx.yield();

    // ---- the flight: level entry over the seal, the low pass beside a seam, up the wall, along the gap, the dive ----
    const ft = hero.anchors.flyThrough.map(toWorld);
    // THE ROUTE (round 3): five different pictures in the first third and a new one at every still after it. High level
    // entry over the seal and the whole mended bowl; a swing to port as it drops, toward the Lifted Floe on its foot ring;
    // the low pass beside the molten seam; the crossing; then UP, 60 m off the wall, over the painted reeds and cranes;
    // a wide swing out to starboard so the lid is seen whole, side-on, coming down over its blazing gap; in over the
    // collar as it seats; the bead; the dive.
    // THE ROUTE (polish round): the camera stays off the ground. A high level entry (92 m) with the whole stepped bowl
    // below and the Shard ahead against the deep sky; down past the Lifted Floe; along the molten seam from 30 to 13 m
    // up; the crossing; up the wall to port, where the Hung Isle is being drawn home on its threads; the sail; then a
    // long crane climb round the lid as it comes down, to 220 m above the wall, so that the seated spearhead lies whole
    // below the lens while the beads outline it in gold; and the dive into the chip.
    const diveDir = new THREE.Vector3().subVectors(ft[6], ft[5]).normalize(), diveBack = (s) => ft[6].clone().addScaledVector(diveDir, -s);
    const pathPts = [[60, 92, -362], [60, 92, -305], above(58, -232, 76), above(57, -165, 42), above(60, -105, 21), above(61, -45, 14), above(62, 12, 14),
      above(72, 72, 24), above(100, 140, 44), above(138, 205, 58), above(166, 285, 66), above(182, 365, 76), above(184, 440, 104), above(166, 505, 160), above(128, 570, 222),
      new THREE.Vector3(104, 352, 655), diveBack(120), ft[5], ft[6]];
    await ctx.yield();
    const path = makePath(pathPts);
    await ctx.yield();
    const chipC = toWorld(hero.anchors.portalSeat.position), tmp = new THREE.Vector3();
    const uOfZ = (z) => { let lo = 0, hi = 0.8; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (path.pointAt(m, tmp).z < z) lo = m; else hi = m; } return lo; };

    // ---- the collar's outline in world space: signed distance (texture for the glaze, function for the mesh) ----
    const CRACK = 2.6;
    const col = hero.anchors.collarOutline.filter((_, i) => i % 3 === 0).map((a) => { const v = toWorld(a); return { x: v.x, z: v.z }; });
    let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9, ccx = 0, ccz = 0;
    await ctx.yield();
    for (const p of col) { bx0 = Math.min(bx0, p.x); bx1 = Math.max(bx1, p.x); bz0 = Math.min(bz0, p.z); bz1 = Math.max(bz1, p.z); ccx += p.x / col.length; ccz += p.z / col.length; }
    bx0 -= 44; bx1 += 44; bz0 -= 44; bz1 += 44;
    const collarSd = (x, z) => {
      if (x < bx0 || x > bx1 || z < bz0 || z > bz1) return 99;
      let best = 1e18, inside = false;
      for (let i = 0, j = col.length - 1; i < col.length; j = i++) {
        const a = col[j], b = col[i], ex = b.x - a.x, ez = b.z - a.z;
        const t = clamp(((x - a.x) * ex + (z - a.z) * ez) / Math.max(1e-6, ex * ex + ez * ez), 0, 1), dx = x - a.x - ex * t, dz = z - a.z - ez * t;
        best = Math.min(best, dx * dx + dz * dz);
        if ((a.z > z) !== (b.z > z) && x < a.x + (z - a.z) / (b.z - a.z) * ex) inside = !inside;
      }
      return inside ? -Math.sqrt(best) : Math.sqrt(best);
    };
    const CT = 224, cdata = new Uint8Array(CT * CT);
    for (let j = 0; j < CT; j++) for (let i = 0; i < CT; i++) {
      if (i === 0 && (j & 15) === 0) await ctx.yield();
      const sd = collarSd(bx0 + (i + 0.5) / CT * (bx1 - bx0), bz0 + (j + 0.5) / CT * (bz1 - bz0));
      cdata[j * CT + i] = Math.round(clamp((sd + 16) / 64, 0, 1) * 255);
    }
    const collarTex = new THREE.DataTexture(cdata, CT, CT, THREE.RedFormat, THREE.UnsignedByteType);
    collarTex.minFilter = collarTex.magFilter = THREE.LinearFilter; collarTex.needsUpdate = true;
    await ctx.yield();
    const collarRing = col.map((p, i) => {
      const a = col[(i + col.length - 1) % col.length], b = col[(i + 1) % col.length];
      let ox = b.z - a.z, oz = -(b.x - a.x); const l = Math.max(1e-4, Math.hypot(ox, oz)); ox /= l; oz /= l;
      if (ox * (p.x - ccx) + oz * (p.z - ccz) < 0) { ox = -ox; oz = -oz; }
      return { x: p.x + ox * CRACK, z: p.z + oz * CRACK, ox, oz };
    });
    await ctx.yield();

    // ---- the break pattern: a few placed sites (the seal shard, the seam we follow, the Lifted Floe, the crack
    // we cross) and 34-50 seeded ones ----
    await ctx.yield();
    const sites = [{ x: 60, z: -272 }, { x: SEAM_X + 30, z: -112 }, { x: SEAM_X - 30, z: -112 }, { x: -118, z: -70 }, { x: 72 + 0 * rng.range(-10, 10), z: 108 + 0 * rng.range(-8, 8) }, { x: ISLE_X, z: ISLE_Z },
      { x: 250, z: 168 }, { x: 420, z: 122 }, { x: 600, z: 205 }, { x: 632, z: 400 }, { x: 505, z: 525 }];   // five sites ring the Hung Isle, so it is a compact island about 200 m across   // the far shard of the crossing: placed, so the crack lies at z -2
    // the rivers: one wedge shard per site direction round the gap, so the hero's rays are real breaks across the wall
    const RV = hero.anchors.rivers, apexW = toWorld([RV.apex[0], 0, RV.apex[1]]), FAN0 = sites.length, NFAN = RV.phi.length, RHO = 285;
    const fanDir = RV.phi.map((ph) => { const a = ph * Math.PI / 180; return [Math.sin(a), -Math.cos(a)]; });
    for (const d of fanDir) sites.push({ x: apexW.x + d[0] * RHO, z: apexW.z + d[1] * RHO });
    // the rivers on the flight's side run as a pack a little ahead of the lens all the way up the climb, each front at
    // its own depth, and outrun it to the gap; those across the gap run later. One (row 4) starts early, on the edge of the
    // wedge that is held open into the climb, so the view up the wall at u 0.4 has an open crack and climbing gold in it
    const RIV = [[0.74, 20, 1300], [0.68, 20, 1300], [0.5, 60, 1200], [0.5, 150, 1400], [0.4, 0, 1150, 235], [0.56, 90, 1400], [0.56, 50, 1300], [0.56, 22, 1300],
      [0.7, 0, 1350, 35], [0.7, 0, 1350, 50], [0.7, 0, 1300, 60], [0.7, 0, 1200, 72], [0.76, 0, 1150, 112], [0.775, 0, 1100, 112], [0.81, 0, 900, 78]];   // per river: at u, its front is `ahead` metres nearer the gap than the lens (or at a given radius from it); speed
    const rLens = (u) => { path.pointAt(u, tmp); return Math.hypot(tmp.x - apexW.x, tmp.z - apexW.z); };
    await ctx.yield();
    const rivRef = RIV.map(([ur, ahead, v, absR]) => absR ?? rLens(ur) - ahead);
    const rivG0 = RIV.map(([ur, ahead, v], k) => ur - (380 - rivRef[k]) / v);          // about when each starts, at its far end
    await ctx.yield();
    const want = rng.int(38, 54);
    for (let tries = 0; sites.length < want && tries < 6000; tries++) {
      if (tries % 150 === 149) await ctx.yield();
      const a = rng.range(0, Math.PI * 2), r = Math.sqrt(rng()) * (RIM - 40), x = Math.cos(a) * r, z = Math.sin(a) * r;
      const minD = lerp(150, 235, clamp(r / 800, 0, 1)) * (tries > 3000 ? 0.75 : 1);
      if (collarSd(x, z) < 30) continue;
      if (sites.every((s) => Math.hypot(s.x - x, s.z - z) > minD)) sites.push({ x, z });
    }
    await ctx.yield();
    const cells = await voronoi(sites, () => ctx.yield()), NS = cells.length;
    await ctx.yield();
    const cellAt = (x, z) => { let b = 0, bd = 1e18; for (let i = 0; i < NS; i++) { const d = (sites[i].x - x) ** 2 + (sites[i].z - z) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
    const SEAL = 0, PORT = 1, STAR = 2, FLOE = 3, AHEAD = 4;
    const farStep = detail < 0.9 ? 12.5 : 10;
    const seams = await seamTable(cells, (x, z) => (path.nearestXZ(x, z).dist < 170 ? 4.5 : farStep), () => ctx.yield());
    await ctx.yield();
    await ctx.yield();
    for (let u = 0; u <= 0.8; u += 0.004) {                    // where the flight first comes over each shard
      path.pointAt(u, tmp); const c = cells[cellAt(tmp.x, tmp.z)];
      if (c.uIn === undefined && tmp.y - surfY(tmp.x, tmp.z) < 30) c.uIn = u;
    }
    await ctx.yield();
    const uCross = uOfZ(-2.5);                                // the lens is over the crack we cross
    const crazeAtU = uOfZ(34), crazeCell = (() => { path.pointAt(crazeAtU + 0.005, tmp); return cellAt(tmp.x, tmp.z); })();
    // ---- open poses (parameter texture): each shard hangs 2-14 m from its seat, tipped and rocking, and closes in
    // its own window of u; shards under the flight come in just ahead of the lens ----
    const SD = new Uint16Array(64 * 4 * 4), hf = THREE.DataUtils.toHalfFloat;
    const put = (row, i, a, b, c, d) => { const o = (row * 64 + i) * 4; SD[o] = hf(a); SD[o + 1] = hf(b); SD[o + 2] = hf(c); SD[o + 3] = hf(d); };
    for (const c of cells) {
      if ((c.id & 7) === 0) await ctx.yield();
      const i = c.id, nr = path.nearestXZ(c.cx, c.cz);
      let rad = 0; for (const p of c.ring) rad += Math.hypot(p.x - c.cx, p.z - c.cz) / Math.max(1, c.ring.length); rad = Math.max(rad, 40);
      const touching = c.ring.some((p, k) => k % 3 === 0 && collarSd(p.x, p.z) < 24);
      // the floes hang in steps, each further one a little higher, so every break shows its lit 9 m wall to the lens
      const terr = clamp(0.03 * (Math.hypot(c.cx - 60, c.cz + 335) - 110), 3, 15) * rng.range(0.8, 1.25);
      let u0 = -2, u1 = -1, lift = 0, tilt = 0, rock = 0, shrink = 0, ax = rng.range(0, Math.PI * 2), axis = [Math.cos(ax), 0, Math.sin(ax)];
      const fj = i - FAN0, fan = fj >= 0 && fj < NFAN;
      let hx = c.cx, hz = c.cz;
      if (fan) {
        // a wedge beside the gap hangs from a hinge at the collar's break, its far end dropped 3-8 m, and swings up
        // to its seat before its rivers run (it only ever hangs BELOW its seat: the flight passes over it)
        hx = apexW.x + fanDir[fj][0] * 112; hz = apexW.z + fanDir[fj][1] * 112; axis = [-fanDir[fj][1], 0, fanDir[fj][0]];
        u1 = Math.max(0.3, Math.min(rivG0[Math.max(fj - 1, 0)], rivG0[Math.min(fj, rivG0.length - 1)]) - 0.012); u0 = u1 - 0.1;
        tilt = -(0.012 + 0.02 * hash1(fj * 4.7 + 1.3)); rock = 0.0028;
        if (fj === 4) { u1 = 0.5; u0 = 0.41; tilt = -0.04; rock = 0.006; }   // held open into the climb: peach in the crack ahead while gold already climbs its edge
      }
      else if (i === SEAL || touching || (i > ISLE && i < FAN0)) { /* seated from the start (the seal's shard, the collar's neighbours, the ring round the Hung Isle) */ }
      else if (i === PORT || i === STAR) { u0 = 0.012; u1 = uOfZ(-218); lift = 2.6; tilt = rng.sign() * 0.006; rock = 0.002; shrink = 2.5 / rad; }   // nearly home: a dark crack between them, closed as the gold arrives (the opening picture is the mended bowl, not a raft of slabs)
      else if (i === FLOE) { u1 = uOfZ(-40); u0 = u1 - 0.1; lift = 26; tilt = 18 * Math.PI / 180; rock = 0.005; shrink = 0.03; axis = [0, 0, 1]; }
      else if (i === AHEAD) { u1 = uCross - 0.002; u0 = uCross - 0.021; lift = 9; tilt = rng.sign() * 0.006; rock = 0.003; shrink = 8 / rad; }   // held open until the lens is 34 m short, seated as we cross
      else if (i === ISLE) {   // the Hung Isle: a whole shard hanging 95 m over its hole, its near side tipped up so the clay foot shows, lit from the cloud sea; drawn home on its threads while we pass
        u0 = 0.44; u1 = 0.74; lift = ISLE_LIFT; tilt = ISLE_TILT; rock = 0.004; shrink = 0.035; axis = [-0.54, 0, 0.84];
      }
      else if (Math.hypot(c.cx - 60, c.cz + 300) < 330) { /* the country round the entry is mended already: its seams are set gold, and only the Lifted Floe hangs */ }
      else if (c.uIn !== undefined) { u1 = Math.max(0.03, c.uIn - 0.004); u0 = u1 - 0.055; lift = Math.min(terr, 13); tilt = rng.sign() * rng.range(0.004, 0.012); rock = 0.004; shrink = rng.range(6, 9) / rad; }
      else if (rng() > 0.6) {                             // the rest are already home, their seams set gold: mended, from the first frame
        const near = nr.dist < 130;
        u1 = clamp(nr.u + rng.range(0.08, 0.4), 0.2, 0.97); u0 = Math.max(0.02, u1 - rng.range(0.12, 0.3));
        lift = near ? -rng.range(3, 10) : terr;
        tilt = rng.range(-1, 1) * (near ? 0.014 : 0.03); rock = near ? 0.005 : rng.range(0.008, 0.018); shrink = rng.range(6, 10) / rad;
      }
      c.u0 = u0; c.u1 = u1; c.tint = rng();
      const crazeU = i === crazeCell ? crazeAtU : rng() < 0.4 ? -1 : weather === 'craze' ? clamp(nr.u + rng.range(-0.06, 0.02), 0.02, 0.9) : rng.range(0.05, 1.3);
      surf(hx, hz);
      put(0, i, P_.x, P_.y, P_.z, shrink); put(1, i, axis[0], axis[1], axis[2], tilt); put(2, i, u0, u1, rng.range(0, 6.28), rock); put(3, i, lift, crazeU, c.tint, 0);
    }
    put(2, 63, -2, -1, 0, 0);
    const shardTex = new THREE.DataTexture(SD, 64, 4, THREE.RGBAFormat, THREE.HalfFloatType);
    shardTex.minFilter = shardTex.magFilter = THREE.NearestFilter; shardTex.generateMipmaps = false; shardTex.needsUpdate = true;
    await ctx.yield();

    // ---- the seam we follow: its gold front is held just ahead of the lens (s runs south to north) ----
    const follow = seams.get(`${PORT}_${STAR}`);
    if (follow) {
      const sp = follow.pts, z0 = Math.min(sp[0].z, sp[sp.length - 1].z), z1 = Math.max(sp[0].z, sp[sp.length - 1].z);
      follow.fixed = { flip: sp[0].z > sp[sp.length - 1].z, g0: uOfZ(z0 - 62), g1: uOfZ(z1 + 8 - 62) };   // its front 62 m ahead of the lens: in the middle of the picture from 13 to 30 m up
    }
    // the crack we cross: its gold passes under the flight line when the lens is 14 m short of it
    for (const k of [`${STAR}_${AHEAD}`, `${PORT}_${AHEAD}`]) {
      const sm = seams.get(k); if (!sm) continue;
      let bi = -1, bd = 30; sm.pts.forEach((p, i) => { const d = path.nearestXZ(p.x, p.z).dist; if (d < bd) { bd = d; bi = i; } });
      if (bi >= 0) sm.fixed = { i: bi, u: uCross - 0.02 };
    }
    RV.theta.forEach((th, k) => {
      const sm = seams.get(`${FAN0 + k}_${FAN0 + k + 1}`);
      if (sm) sm.fixed = { river: { k, ax: apexW.x, az: apexW.z, uRef: RIV[k][0], rRef: rivRef[k], v: RIV[k][2], r: RV.radius } };
    });
    const tick = () => ctx.yield();
    const geo = await buildShards(cells, collarSd, FOOT_R, collarRing, tick);
    await ctx.yield();
    const sg = await buildSeams(seams, cells, collarSd, CRACK, rng.fork('seams'), detail, tick);
    for (const sm of seams.values()) { const rv = sm.fixed && sm.fixed.river; if (rv && rv.uA !== undefined) hero.setRiver(rv.k, rv.uA, rv.v); }   // the same gold runs on across the collar
    await ctx.yield();

    // ---- materials: glaze, biscuit, gold (plus additive threads' glints, blades and dust) ----
    const aheadU = cells[AHEAD].u1, crossAt = path.pointAt(uCross, new THREE.Vector3());
    const fishScale = cast === 2 ? 4.2 : cast === 1 ? 1.0 : 1.9;
    U.uFishScale.value = fishScale; U.uCarve.value = cast === 2 ? 1 : 0;
    U.uPig.value.copy(linV(pal[5], ware.name === 'sea-green' ? 1.7 : ware.name === 'celadon' ? 1.6 : 1.3)); U.uPigMix.value = ware.name === 'ivory' ? 0.35 : 0.82;
    if (ware.name === 'sea-green') U.uGoldWarm.value.set(0.96, 1.0, 1.05);   // silver seams stay cool
    U.uGoldLift.value = ware.name === 'sea-green' ? 0.16 : hourKey === 'moon' ? 0.26 : 0.22;
    const W = {
      ...U, uShards: { value: shardTex }, uU: { value: 0 }, uPaint: { value: null }, uCollar: { value: collarTex },
      uCollarBox: { value: new THREE.Vector4(bx0, bz0, 1 / (bx1 - bx0), 1 / (bz1 - bz0)) }, uPaintW: { value: new THREE.Vector4(98, 328, 430, 290) },
      uSeal: { value: new THREE.Vector4(24, -118, 30, 1) }, uStream: { value: new THREE.Vector4(crossAt.x, crossAt.z, 0, cast === 2 ? 0 : 1) },
      uCrack: { value: CRACK }, uFishAmt: { value: 1 }, uCrazeAll: { value: 0 }, uPaintAmt: { value: 1 },
      uIron: { value: new THREE.Vector3(0.74, 0.36, 0.27) }, uBlade: { value: 0.3 }, uDust: { value: weather === 'dust' ? 1.9 : 1.25 },
    };
    await ctx.yield();
    const paint = await paintTexture(rng.fork('paint'), cast, () => ctx.yield());
    await ctx.yield();
    const mat = (vs, fs, extra = {}) => new THREE.ShaderMaterial({ uniforms: W, vertexShader: vs, fragmentShader: fs, ...extra });
    const bound = new THREE.Sphere(new THREE.Vector3(0, 200, 0), 1400);
    W.uPaint.value = paint;
    const add = (o, name, order = 0) => { o.geometry.boundingSphere = bound; o.name = name; o.frustumCulled = false; o.renderOrder = order; scene.add(o); return o; };
    add(new THREE.Mesh(geo.glaze, mat(GLAZE_VS, GLAZE_FS, { side: THREE.DoubleSide })), 'glaze');
    add(new THREE.Mesh(geo.biscuit, mat(BISCUIT_VS, BISCUIT_FS, { side: THREE.DoubleSide })), 'biscuit');
    await ctx.yield();
    add(new THREE.Mesh(sg.gold, mat(GOLD_VS, GOLD_FS)), 'gold');
    add(new THREE.Mesh(sg.threads, mat(THREAD_VS, THREAD_FS, { side: THREE.DoubleSide })), 'threads');
    add(new THREE.Mesh(sg.blades, mat(BLADE_VS, BLADE_FS, { side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })), 'blades', 2);
    add(new THREE.Mesh(new THREE.IcosahedronGeometry(1, 4), mat(SKY_VS, SKY_FS, { side: THREE.BackSide, depthWrite: false })), 'sky', -1);
    await ctx.yield();
    const nDust = Math.round(5600 * detail * Math.max(density, 0.95) * (weather === 'dust' ? 2.2 : 1)), dPos = new Float32Array(nDust * 3), dRnd = new Float32Array(nDust * 4);
    for (let i = 0; i < nDust; i++) { dPos[i * 3] = rng.range(0, 80); dPos[i * 3 + 1] = rng.range(0, 80); dPos[i * 3 + 2] = rng.range(0, 80); for (let k = 0; k < 4; k++) dRnd[i * 4 + k] = rng(); }
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3)); dGeo.setAttribute('aRnd', new THREE.BufferAttribute(dRnd, 4));
    add(new THREE.Points(dGeo, mat(DUST_VS, DUST_FS, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })), 'dust', 3);

    // ---- gaze: the Shard at entry, the gold beside us on the low pass, the Floe as it seats, the crossing, then
    // the Shard again up the wall, the outlined spearhead from above, and the chip ----
    const shardAt = new THREE.Vector3(), sideAt = new THREE.Vector3(), seamAt = new THREE.Vector3(), floeAt = new THREE.Vector3(-80, 112, -70), beadAt = new THREE.Vector3();
    const seatC = hero.anchors.capPoint(0, -125);
    const poseToWorld = (v) => { v.applyMatrix4(hero.pose); return v.set(-v.x, v.y + PL.position[1], PL.position[2] - v.z); };
    const shardNow = () => poseToWorld(shardAt.fromArray(seatC));
    const B0 = SEAT_U - 0.002, BN = 60, beadTab = [];
    for (let i = 0; i <= BN; i++) {
      const bp = hero.beadPositions(B0 + i * 0.002).map((q) => new THREE.Vector3(-q[0], q[1] + PL.position[1], PL.position[2] - q[2]));
      beadTab.push([bp[1], bp[0].clone().add(bp[1]).multiplyScalar(0.5)]);       // the bead on our flank, and the midpoint of the two
    }
    await ctx.yield();
    const uSeam0 = uOfZ(-185), uSeam1 = uOfZ(-62);
    const isleAt = above(ISLE_X - 30, ISLE_Z - 22, ISLE_LIFT * 0.5), spearAt = new THREE.Vector3(), spearC = toWorld(hero.anchors.capPoint(0, -135)), aheadAt = new THREE.Vector3();
    const spearNow = (time, u) => {   // the seated spearhead whole below the lens, then the two beads as they close at its base
      const f = clamp((Math.max(u, SEAT_U + 0.012) - B0) / 0.002, 0, BN - 1e-3), i = Math.floor(f), t = f - i;
      return spearAt.copy(spearC).lerp(sideAt.lerpVectors(beadTab[i][1], beadTab[i + 1][1], t), smoothstep(0.885, 0.93, u));
    };
    const pois = [
      { at: shardNow, from: 0.0, to: 0.06, weight: 0.5, fade: 0.4 },
      { at: floeAt, from: 0.05, to: uSeam0 - 0.02, weight: 0.7, fade: 0.35 },       // the Lifted Floe hanging over its foot ring
      { at: (time, u) => { path.pointAt(Math.min(u + 0.04, 0.4), seamAt); seamAt.x = SEAM_X - 1; seamAt.y = surfY(seamAt.x, seamAt.z) + 2; return seamAt; }, from: uSeam0 - 0.03, to: uSeam1, weight: 0.8, fade: 0.25 },   // down the seam: the molten front ahead, the stepped country beyond
      { at: (time, u) => aheadAt.set(crossAt.x + 2, surfY(crossAt.x, crossAt.z + 40) + 4, crossAt.z + 40), from: uSeam1 - 0.015, to: uCross + 0.004, weight: 0.75, fade: 0.3 },      // the crossing: the far shard's lit wall, gold running into the crack
      { at: () => { shardNow(); shardAt.x -= 105; return shardAt; }, from: uCross + 0.012, to: uOfZ(160), weight: 0.85, fade: 0.3 },             // rising: the lid over its blazing gap
      { at: isleAt, from: uOfZ(128), to: uOfZ(262), weight: 0.9, fade: 0.3 },                   // the Hung Isle to port
      { at: shardNow, from: uOfZ(250), to: 0.8, weight: 0.9, fade: 0.2 },                       // the sail, then the lid from above on the crane climb
      { at: spearNow, from: 0.775, to: 0.97, weight: 1, fade: 0.12 },   // the engine lets go of every poi from u 0.93; the long lookAhead then finds the chip
    ];

    U.uRare && (U.uRare.value = rare ? 1 : 0);
    let lastU = 0;
    return {
      scene, path, duration: 49,
      title: rare ? 'The Country Mended with Gold (a piece from another bowl)' : 'The Country Mended with Gold',
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 58, sway: 0.5, bank: 0.5 },
      pois,
      portal: { shape: 'circle', radius: 7, color: H.portal, glow: 1, revealDistance: 400, tilt: true },
      post: { exposure: 0.94, bloom: { strength: 0.55, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.08, contrast: 1.1, tint: '#ffffff', shadowTint: '#0b1512', vignette: 0.22, grain: 0, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        lastU = clamp(u || 0, 0, 1);
        hero.setProgress(lastU); hero.update(dt, time, camera);
        W.uU.value = lastU;
        W.uStream.value.z = 72 * smoothstep(aheadU - 0.03, aheadU + 0.045, lastU);
        W.uCrazeAll.value = weather === 'craze' ? 0.25 * smoothstep(0.3, 0.9, lastU) : 0;
        U.uBeacon.value = smoothstep(0.6, 0.74, lastU) * (1 - smoothstep(0.81, 0.865, lastU));   // the chip's light shows once the lid is coming down, and hands over to the portal's own glow
      },
      dispose() { hero.dispose(); shardTex.dispose(); collarTex.dispose(); W.uPaint.value.dispose(); },
    };
  },
};
