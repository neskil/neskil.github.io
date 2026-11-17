// THE RIVER THAT THINKS (amber-reticulum)
// A karst plateau of pale fluted pinnacles in blue morning shade, and through every gully one amber
// organism: a honeycomb net of honey-glass veins whose grains stream, stop and turn back on one slow
// pulse, converging downstream on the Crossing (src/parts/amber-reticulum.js), where it has hung itself
// across a gorge. World space = the hero's local space: origin at the gorge centre at lip height,
// +Z downstream, the near lip at z = -150. Flying toward +Z, left is +X.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makePath } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import { buildHero } from '../parts/amber-reticulum.js';

const BASE_PAL = ['#E6E3DA', '#7C93B8', '#F2A51E', '#F9E45B', '#B5600F', '#A9D6F0', '#6F8F5A'];
// organism: [amber, edge, dark, grain]
const ORGANISMS = [
  { name: 'honey', amber: '#F2A51E', edge: '#F9E45B', dark: '#B5600F' },
  { name: 'garnet', amber: '#D4472A', edge: '#FFB9A0', dark: '#7A1410' },
  { name: 'citrine', amber: '#F8E27A', edge: '#FDFAD2', dark: '#E0961C' },
];
// hour: sun elevation, key colour, sky ramp, fog colour, exposure
const HOURS = [
  { name: 'early', elev: 15, key: '#FFE7C2', zenith: '#5E8FCB', horizon: '#A9D6F0', band: '#FFE9C4', fog: '#9DBFE0', shadeLine: 30, floorSun: 0.0, exposure: 1.0 },
  { name: 'first', elev: 6, key: '#FFC79A', zenith: '#6E86C0', horizon: '#F6CDB0', band: '#FFB98A', fog: '#C2B4C4', shadeLine: 62, floorSun: 0.0, exposure: 1.06 },
  { name: 'mid', elev: 35, key: '#FFF1DA', zenith: '#4F8AD0', horizon: '#B4DCF2', band: '#FFF3DC', fog: '#A6CBE8', shadeLine: 8, floorSun: 0.55, exposure: 0.94 },
];
const WEATHERS = ['clear', 'mist', 'rain'];

const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---- hot loops live in small plain functions: a loop inside the long async build is never optimised, these are ----
function splatSamples(mapData, NM, M, vs, k0, k1) {
  const sx = NM / M.w, sz = NM / M.h;
  for (let k = k0; k < k1; k++) {
    const s = vs[k], x = s[0], z = s[1], live = s[3] === 1, bed = s[3] === 2, reach = live ? 16 : bed ? 2.4 : 7, ch = live ? 0 : 2, r0 = live || bed ? s[2] : 0, top = live || bed ? 255 : 198, lim = (r0 + reach) * (r0 + reach), kk = top / reach, rr = r0 * r0;
    const cx = (x - M.x0) * sx, cz = (z - M.z0) * sz, ex = (reach + r0) * sx + 1, ez = (reach + r0) * sz + 1;
    const j0 = Math.max(0, Math.floor(cz - ez)), j1 = Math.min(NM - 1, Math.ceil(cz + ez)), i0 = Math.max(0, Math.floor(cx - ex)), i1 = Math.min(NM - 1, Math.ceil(cx + ex));
    for (let j = j0; j <= j1; j++) {
      const dz = (j + 0.5) / sz + M.z0 - z, dz2 = dz * dz; let o = (j * NM + i0) * 4 + ch;
      for (let i = i0; i <= i1; i++, o += 4) {
        const dx = (i + 0.5) / sx + M.x0 - x, d2 = dx * dx + dz2;
        if (d2 >= lim) continue;
        const v = d2 <= rr ? top : top - (Math.sqrt(d2) - r0) * kk;
        if (v > mapData[o]) mapData[o] = v;
      }
    }
  }
}
// casters: { x, z, r, h, gy }; the wedge of shade each throws away from the sun, kept as a height above the gully floor
function shadeWedges(mapData, NM, M, casters, c0, c1, hx, hz, tanE) {
  const sx = NM / M.w, sz = NM / M.h;
  for (let c = c0; c < c1; c++) {
    const t = casters[c], gy = t.gy, L = Math.min(t.h / tanE, 620), R = t.r * 0.95 + 0.03 * L, core = 0.3 * t.r;
    const jA = Math.max(0, Math.floor((t.z - L * hz - R - M.z0) * sz)), jB = Math.min(NM - 1, Math.ceil((t.z - 0.5 * t.r - M.z0) * sz));
    for (let j = jA; j <= jB; j++) {
      const z = M.z0 + (j + 0.5) / sz, ta = (t.z - z) / hz, xa = t.x - hx * ta, wr = t.r * 0.95 + 0.03 * ta, fl = 0.012 * Math.max(-150 - z, 0), top = gy - ta * tanE - fl;
      const iA = Math.max(0, Math.floor((xa - wr / hz - M.x0) * sx)), iB = Math.min(NM - 1, Math.ceil((xa + wr / hz - M.x0) * sx));
      let o = (j * NM + iA) * 4 + 1;
      for (let i = iA; i <= iB; i++, o += 4) {
        const lat = Math.abs(M.x0 + (i + 0.5) / sx - xa) * hz, e = (lat - core) / (wr - core), f = e <= 0 ? 1 : e >= 1 ? 0 : 1 - e * e * (3 - 2 * e);
        const H = (top + t.h * f) * (255 / 160);
        if (H > mapData[o]) mapData[o] = H > 255 ? 255 : H;
      }
    }
  }
}
function upsampleBay(mapData, NM, G, NG, j0, j1) {
  const q = NM / NG;
  for (let j = j0; j < j1; j++) {
    const fy = (j + 0.5) / q, gj = Math.min(Math.floor(fy), NG - 1), ty = fy - gj, ra = gj * (NG + 1), rb = ra + NG + 1;
    for (let i = 0; i < NM; i++) {
      const fx = (i + 0.5) / q, gi = Math.min(Math.floor(fx), NG - 1), tx = fx - gi, a = G[ra + gi] + (G[ra + gi + 1] - G[ra + gi]) * tx, b = G[rb + gi] + (G[rb + gi + 1] - G[rb + gi]) * tx;
      const v = 127.5 + (a + (b - a) * ty) * (255 / 160);
      mapData[(j * NM + i) * 4 + 3] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
}
function noiseOctave(acc, L, n, NS, amp) {
  const ixA = new Uint16Array(NS), i1A = new Uint16Array(NS), txA = new Float32Array(NS);
  for (let x = 0; x < NS; x++) { const fx = x * n / NS, ix = Math.floor(fx), t = fx - ix; ixA[x] = ix; i1A[x] = (ix + 1) % n; txA[x] = t * t * (3 - 2 * t); }
  for (let y = 0; y < NS; y++) {
    const r0 = ixA[y] * n, r1 = i1A[y] * n, ty = txA[y], row = y * NS;
    for (let x = 0; x < NS; x++) { const a0 = L[r0 + ixA[x]], a1 = L[r0 + i1A[x]], b0 = L[r1 + ixA[x]], b1 = L[r1 + i1A[x]], tx = txA[x], top = a0 + (a1 - a0) * tx; acc[row + x] += amp * (top + (b0 + (b1 - b0) * tx - top) * ty); }
  }
}
function noiseStore(noiseData, acc, tot, c) {
  for (let k = 0, n = acc.length; k < n; k++) { const v = ((acc[k] / tot - 0.5) * 1.7 + 0.5) * 255; noiseData[k * 4 + c] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v); }
}

export default {
  id: 'amber-reticulum',
  name: 'The River That Thinks',
  category: 'alien',
  weirdness: 0.7,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng.fork('reticulum'), noise = ctx.noise;
    const vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const rare = !!vary.rare;
    // ---- the visit's look ----
    let hourI = rng.pick([0, 0, 1, 2, 2]);
    if (vary.hour === 'dawn') hourI = 1; else if (vary.hour === 'day') hourI = 2; else if (vary.hour === 'golden') hourI = 0;
    const weatherI = rng.pick([0, 0, 1, 2]);
    const orgI = rng.pick([0, 0, 2, 0, 0, 1, 2]);
    const period = rng.pick([6, 8, 8, 10]);
    const swifts = rng.chance(0.25);
    const HOUR = HOURS[hourI], weather = WEATHERS[weatherI], ORG = ORGANISMS[orgI];
    const pal = BASE_PAL.slice(); pal[2] = ORG.amber; pal[3] = ORG.edge; pal[4] = ORG.dark;
    const wet = weather === 'rain' ? 1 : 0, misty = weather === 'mist' ? 1 : 0;
    const DURATION = 46;

    const scene = new THREE.Scene();
    const disposables = [];

    // ---- the hero first: its fly line fixes the end of the path ----
    const hero = await buildHero(ctx, { palette: pal, detail, period, duration: DURATION, skyColor: HOUR.horizon });
    scene.add(hero.object);
    const A = hero.anchors, U = hero.veinKit.uniforms;
    await ctx.yield();
    // sun: the hero's azimuth (50 degrees left of the exit heading), this hour's elevation
    const sunDir = new THREE.Vector3(A.sunDir.x, 0, A.sunDir.z).normalize().multiplyScalar(Math.cos(HOUR.elev * Math.PI / 180));
    sunDir.y = Math.sin(HOUR.elev * Math.PI / 180); sunDir.normalize();
    hero.setSun(sunDir, HOUR.key);
    const sunAz = Math.atan2(sunDir.x, -sunDir.z) * 180 / Math.PI;      // kit convention: 0 = -Z, +90 = +X

    // ---- the path: plateau, ridge, gully, lip, then the hero's own line through the net ----
    const fly = A.flyThrough, F = fly[0];
    const floorBase = (z) => 0.012 * Math.max(-150 - z, 0);
    const up = [   // offsets from the lip point F: [dx, dz, y]  (y null = ride 11.5 m above the gully floor)
      [0, -953, 62], [0, -890, 60], [5, -830, 51], [10, -765, 36],
      [11, -705, 28], [-10, -645, 27], [-40, -585, 29],
      [-58, -525, 52], [-47, -455, 85], [-48, -405, 75], [-64, -353, 51],
      [-80, -305, 29], [-91, -256, null], [-96, -208, null], [-88, -164, null, 7], [-60, -110, null, 21], [-29, -53, null, 13],
    ];
    const pts = up.map(([dx, dz, y, lift]) => new THREE.Vector3(F.x + dx, y ?? (floorBase(F.z + dz) + 12.5 + (F.y - 12.5 - floorBase(F.z)) * smoothstep(-180, -40, dz) + (lift || 0)), F.z + dz));
    // the camera crosses the lip well above it and only then sinks into the net, so the whole Crossing shows over the
    // edge; the lift is the largest that keeps the hero's clearance from every strand
    const nBase = pts.length, nearSS = (A.strandSamples || []).filter((sm) => sm.p.z < F.z + 110);
    let path = null;
    for (const [lift, e0, e1] of [[16, 12, 78], [16, 12, 66], [16, 10, 58], [12, 12, 78], [12, 12, 66], [12, 10, 58], [12, 5, 50], [8, 5, 50], [0, 5, 50]]) {
      pts.length = nBase;
      for (const p of fly) { const q = p.clone(); q.y += lift * (1 - smoothstep(F.z + e0, F.z + e1, q.z)); pts.push(q); }
      path = makePath(pts, { samples: 420 });
      let mn = 1e9; for (const sm of nearSS) mn = Math.min(mn, path.distanceTo(sm.p.x, sm.p.y, sm.p.z) - sm.r);
      await ctx.yield();
      if (mn >= 8.6) break;
    }
    const seat = A.portalSeat.position, exitDir = A.exitHeading;
    const uLip = path.nearestXZ(F.x + 12, -150).u;
    await ctx.yield();

    // ---- ground: a plateau falling gently to the gorge, a low ridge, the gorge cut, the far plateau ----
    const bay = { x: F.x - 190, z: F.z - 420, rx: 110, rz: 150 };          // the stone the organism has not reached yet
    const bayD = (x, z) => { const ex = (x - bay.x) / bay.rx, ez = (z - bay.z) / bay.rz; return (Math.sqrt(ex * ex + ez * ez) - 1) * 120 + noise.n2(x * 0.02, z * 0.02) * 14; };
    const ridgeZ = F.z - 470;
    const lipZ = (x) => { const b = 1 - Math.abs(Math.sin(x * 0.033 + 1.7 * Math.sin(x * 0.0071))); return 150 + noise.n2(x * 0.011, 3.3) * 5 + 11 * b * b - 3; };   // broad buttresses, sharp flutes between
    // ---- the saddle (beat C): a low col of the plateau's own pavement between two fluted towers, across the view to the
    // right of the path at u 0.235 (it faces the camera of u 0.16, 100 m off); a vein climbs it with fat bulges strung along it ----
    const sad = { x: 0, z: 0, ax: 0, az: 1 };          // ax, az: the ridge's long axis (toward screen right); d below is across it, positive downstream
    { const q = path.pointAt(0.235), tg = path.tangentAt(0.235), tl = Math.hypot(tg.x, tg.z) || 1; sad.ax = -tg.z / tl; sad.az = tg.x / tl; sad.x = q.x + sad.ax * 54; sad.z = q.z + sad.az * 54; }
    const saddleH = (x, z) => {
      const dx = x - sad.x, dz = z - sad.z, s = dx * sad.ax + dz * sad.az, d = dx * sad.az - dz * sad.ax, as = Math.abs(s);
      if (as > 23 || Math.abs(d) > 58) return 0;
      const crest = 10 * (1 - smoothstep(8, 22, as)), w = 16 + 2 * noise.n2(s * 0.05, 3.1);          // only in the gap: the towers stand on the floor
      return crest * Math.exp(-(d * d) / (w * w)) * (1 + 0.1 * noise.n2(x * 0.07, z * 0.07));
    };
    const groundRaw = (x, z) => {
      const az = Math.abs(z), lz = lipZ(x + (z > 0 ? 500 : 0));
      let h;
      if (z < 0) {
        h = floorBase(z) + noise.n2(x * 0.013, z * 0.013) * 2.2 + noise.n2(x * 0.05, z * 0.05) * 0.7;
        const rz = (z - ridgeZ + noise.n2(x * 0.004, 7) * 60) / 70;
        h += 22 * Math.exp(-rz * rz) * (0.6 + 0.4 * noise.n2(x * 0.008, 1.7));
        h += saddleH(x, z);
      } else h = 4 + 0.02 * (z - 150) + noise.n2(x * 0.013, z * 0.013) * 3;
      if (az < lz + 6) {                                                     // the gorge: a stepped wall, then mist
        const t = clamp((lz - az) / 30, 0, 1), st = t + 0.05 * Math.sin(t * 30 + x * 0.05) * t * (1 - t);
        h = lerp(h * (1 - smoothstep(0, 8, lz - az + 6)), -205 + noise.n2(x * 0.02, z * 0.02) * 6, Math.pow(clamp(st, 0, 1), 0.55));
      }
      return h;
    };
    const ground = (x, z) => {
      const h = groundRaw(x, z);
      if (z > -140) return h;
      const n = path.nearestXZ(x, z);
      return n.dist < 60 ? Math.min(h, lerp(n.y - lerp(12.5, 4, smoothstep(F.z - 70, F.z - 15, z)), h + 30, smoothstep(14, 60, n.dist))) : h;   // near the lip the flight may skim the stone
    };

    // ---- pinnacles: a jittered triangular lattice; any tower too near the path steps back to line the gully ----
    const SP = 64, ROWH = SP * 0.866, X0 = -560, Z0 = F.z - 1130, NI = 19, NJ = 21;
    const slots = [];                                                         // lattice slot (i,j) -> { x, z, r, h, on }
    const slotAt = (i, j) => slots[j * NI + i];
    const entryX = pts[0].x, sightDir = new THREE.Vector3(20 - pts[0].x, 0, -150 - pts[0].z).normalize();
    for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) {
      let x = X0 + i * SP + (j % 2) * SP * 0.5 + rng.range(-13, 13), z = Z0 + j * ROWH + rng.range(-13, 13);
      const big = rng(), r0 = 8.5 + 13 * big * big + rng.range(0, 3), keep = rng();
      let h = 42 + 95 * Math.pow(rng(), 1.5) + r0 * 1.2, on = true, r = r0;
      const rzn = (z - ridgeZ) / 90; h += 38 * Math.exp(-rzn * rzn);
      if (z > -190 - r) on = false;                                           // the lip belongs to the hero's six
      for (const t of A.towers) if (Math.hypot(x - t.position.x, z - t.position.z) < t.radius + r + 26) on = false;
      const bd = bayD(x, z);
      if (bd < 0) { if (keep < 0.55) on = false; h *= 0.55; r *= 0.8; }
      const n = path.nearestXZ(x, z);
      let need = r * 1.12 + 13;
      if (n.u > 0.17 && n.u < 0.36) { const tq = path.tangentAt(n.u), pq = path.pointAt(n.u); if ((x - pq.x) * tq.z - (z - pq.z) * tq.x > 0) need += 19 * smoothstep(0.17, 0.2, n.u) * (1 - smoothstep(0.33, 0.36, n.u)); }
      if (on && n.dist < need) {                                              // step back from the path
        const q = path.pointAt(n.u), dx = x - q.x, dz = z - q.z, d = Math.max(Math.hypot(dx, dz), 0.01), push = need + rng.range(0, 4);
        x = q.x + dx / d * push; z = q.z + dz / d * push;
        if (path.nearestXZ(x, z).dist < need - 0.5) on = false;
      }
      {  // the sight wedge from the entry to the Crossing: nothing on the entry axis, and inside the wedge no top above
         // y 50, so that from y 60 the upper web shows over the forest between the taller towers to either side
        if (on && Math.abs(x - entryX) < r + 13 && z > pts[0].z && z < pts[0].z + 300) on = false;
        const rx = x - pts[0].x, rz = z - pts[0].z, along = rx * sightDir.x + rz * sightDir.z, lat = Math.abs(rx * sightDir.z - rz * sightDir.x);
        if (on && along > 80 && lat < r + 8 + 0.075 * along) { const top = 55 - 44 * (along / 1130) - 6 * keep - groundRaw(x, z); if (h > top) { if (top > 15) h = top; else on = false; } }
      }
      if (on && z < pts[0].z + 24 && Math.abs(x - entryX) < r + 22) on = false;
      slots.push({ x, z, r, h, on, seed: rng() * 100, i, j });
      if (i === NI - 1 && j % 3 === 2) await ctx.yield();
    }
    // the bare tower the feelers reach for always stands: downstream in the bay, ahead and to the right of the camera
    // as it comes off the ridge (beat D)
    const feelAim = { x: bay.x + 42, z: bay.z + 89 };
    let feelSlot = null;
    { let bd = 1e9; for (const sl of slots) { if (bayD(sl.x, sl.z) > -22) continue; const d = Math.hypot(sl.x - feelAim.x, sl.z - feelAim.z); if (d < bd) { bd = d; feelSlot = sl; } }
      if (feelSlot) { feelSlot.on = true; feelSlot.h = clamp(feelSlot.h, 46, 64); feelSlot.r = clamp(feelSlot.r, 9, 13); } }
    if (feelSlot) feelSlot.fixed = true;
    {  // the saddle: nothing stands in the vein's way up to the col or on it, and a fluted tower rises either side of it
      for (const sl of slots) { const dx = sl.x - sad.x, dz = sl.z - sad.z, s = dx * sad.ax + dz * sad.az, d = dx * sad.az - dz * sad.ax; if (Math.abs(s) < 11 + sl.r && d > -80 && d < 40 + sl.r) sl.on = false; }
      for (const e of [-1, 1]) {
        const ex = sad.x + sad.ax * 23 * e, ez = sad.z + sad.az * 23 * e; let b = null, bd = 1e9;
        for (const sl of slots) { if (sl.fixed) continue; const d = Math.hypot(sl.x - ex, sl.z - ez); if (d < bd) { bd = d; b = sl; } }
        if (b) { b.x = ex; b.z = ez; b.on = true; b.fixed = true; b.r = 11 + e; b.h = 78 + 14 * e; b.sink = 2; }
      }
    }
    for (let a = 0; a < slots.length; a++) {                                  // no two towers grown into each other
      const s = slots[a]; if (!s.on || s.fixed) continue;
      for (let b = 0; b < slots.length; b++) { const t = slots[b]; if ((b < a || t.fixed) && t !== s && t.on && Math.hypot(s.x - t.x, s.z - t.z) < (s.r + t.r) * 0.92 + 5) { s.on = false; break; } }
    }
    await ctx.yield();
    // far towers: beyond the lattice and on the far plateau, never near the gorge or the exit line
    const farTowers = [];
    const nFar = Math.round(420 * (0.5 + 0.5 * detail));
    for (let k = 0; k < nFar; k++) {
      const farSide = k % 3 === 0;
      const x = rng.range(-1500, 1500), z = farSide ? rng.range(215, 1300) : rng.range(-2300, -190);
      const r = rng.range(9, 22), h = 45 + 100 * Math.pow(rng(), 1.5), sd = rng() * 100;
      if (!farSide && x > X0 - 20 && x < X0 + NI * SP + 20 && z > Z0 - 20 && z < Z0 + NJ * ROWH + 10) continue;
      if (farSide && Math.abs(x - (seat.x + exitDir.x * (z - seat.z) / Math.max(exitDir.z, 0.3))) < 60 + (z - 150) * 0.12) continue;   // calm wall behind the portal
      let ok = true;
      for (const t of A.towers) if (Math.hypot(x - t.position.x, z - t.position.z) < t.radius + r + 30) ok = false;
      if (ok) farTowers.push({ x, z, r, h, seed: sd, on: true });
    }
    await ctx.yield();
    await ctx.yield();

    // ---- THE GRAPH: the main vein under the path, then a honeycomb grown outward from it ----
    const uMainEnd = path.nearestXZ(F.x - 6, F.z - 12).u;
    const main = [];                                                          // { x, z, d } from upstream to the lip
    {
      const t0 = path.startTangent, p0 = path.start;
      for (let d = -260; d < 0; d += 13) main.push({ x: p0.x + t0.x * d + Math.sin(d / 47) * 9, z: p0.z + t0.z * d });
      const q = new THREE.Vector3(), tg = new THREE.Vector3(), n = Math.round(uMainEnd * path.length / 11);
      for (let k = 0; k <= n; k++) {
        const u = (k / n) * uMainEnd; path.pointAt(u, q); path.tangentAt(u, tg);
        const high = smoothstep(26, 44, q.y - floorBase(q.z)) * (1 - smoothstep(0.42, 0.5, u));
        // near the lip the vein leaves the middle of the gully for the side away from the ring, so the ring shows past it
        const off = -Math.sign((seat.x - F.x) * tg.z - (seat.z - F.z) * tg.x) * 12 * smoothstep(uMainEnd - 0.12, uMainEnd - 0.03, u);
        const w = high * (Math.sin(u * 61) * 9 + Math.sin(u * 143) * 3.5) + off;
        main.push({ x: q.x + tg.z * w, z: q.z - tg.x * w });
      }
      let d = 0;
      for (let k = main.length - 1; k >= 0; k--) { if (k < main.length - 1) d += Math.hypot(main[k].x - main[k + 1].x, main[k].z - main[k + 1].z); main[k].d = d; }
    }
    const S_LIP = 230;                                                        // arc distance from the Knot to the lip
    const nearMain = (x, z) => { let b = 1e9, bi = 0; for (let k = 0; k < main.length; k++) { const dx = main[k].x - x, dz = main[k].z - z, dd = dx * dx + dz * dz; if (dd < b) { b = dd; bi = k; } } return { dist: Math.sqrt(b), k: bi }; };
    // nodes: one per lattice triangle, at the centroid of its three towers
    const nodes = [], edgeMap = new Map();
    const addTri = (a, b, c) => {
      if (!a || !b || !c) return;
      const x = (a.x + b.x + c.x) / 3, z = (a.z + b.z + c.z) / 3;
      let ok = z < -172 && bayD(x, z) > 10;
      for (const s of [a, b, c]) if (s.on && Math.hypot(x - s.x, z - s.z) < s.r + 3.5) ok = false;
      for (const t of A.towers) if (Math.hypot(x - t.position.x, z - t.position.z) < t.radius + 10) ok = false;
      const nm = nearMain(x, z), id = nodes.length;
      const nd = { id, x, z, ok, root: false, dist: 1e9, parent: -1, pe: null, desc: 1, adj: [] };
      if (ok && nm.dist < 21) { if (hash1(id * 3.7 + 1.3) < 0.42 && main[nm.k].d > 30) { nd.root = true; nd.x = main[nm.k].x; nd.z = main[nm.k].z; nd.dist = 0; nd.s0 = S_LIP + main[nm.k].d; } else nd.ok = false; }
      nodes.push(nd);
      for (const [p, q] of [[a, b], [b, c], [a, c]]) {
        const ia = p.j * NI + p.i, ib = q.j * NI + q.i, key = Math.min(ia, ib) * 4096 + Math.max(ia, ib);
        if (!edgeMap.has(key)) edgeMap.set(key, { a: p, b: q, n: [] });
        edgeMap.get(key).n.push(id);
      }
    };
    for (let j = 0; j < NJ - 1; j++) for (let i = 0; i < NI - 1; i++) {
      if (j % 2 === 0) { addTri(slotAt(i, j), slotAt(i + 1, j), slotAt(i, j + 1)); addTri(slotAt(i + 1, j), slotAt(i, j + 1), slotAt(i + 1, j + 1)); }
      else { addTri(slotAt(i, j), slotAt(i + 1, j), slotAt(i + 1, j + 1)); addTri(slotAt(i, j), slotAt(i, j + 1), slotAt(i + 1, j + 1)); }
    }
    await ctx.yield();
    const edges = [];
    for (const e of edgeMap.values()) {
      if (e.n.length < 2) continue;
      const n1 = nodes[e.n[0]], n2 = nodes[e.n[1]];
      if (!n1.ok || !n2.ok || (n1.root && n2.root)) continue;
      const a = e.a, b = e.b, d = Math.hypot(a.x - b.x, a.z - b.z), ra = a.on ? a.r : 0, rb = b.on ? b.r : 0, gap = d - ra - rb;
      if (gap < 4) continue;
      const t = (ra + gap * 0.5) / d, mx = lerp(a.x, b.x, t), mz = lerp(a.z, b.z, t);
      const ed = { n1, n2, mx, mz, gap, len: Math.hypot(n1.x - mx, n1.z - mz) + Math.hypot(n2.x - mx, n2.z - mz), w: 0.7 + 0.6 * rng(), kind: 'dry', r: 0.5 };
      n1.adj.push(ed); n2.adj.push(ed); edges.push(ed);
    }
    await ctx.yield();
    // spanning tree by Dijkstra from every root at once (random weights make it meander)
    {
      const done = new Uint8Array(nodes.length); let _dj = 0;
      for (;;) {
        let best = null;
        for (const nd of nodes) if (!done[nd.id] && nd.ok && nd.dist < 1e8 && (!best || nd.dist < best.dist)) best = nd;
        if (!best) break;
        done[best.id] = 1; if (++_dj % 120 === 0) await ctx.yield();
        for (const ed of best.adj) { const o = ed.n1 === best ? ed.n2 : ed.n1, nd2 = best.dist + ed.len * ed.w; if (!done[o.id] && nd2 < o.dist) { o.dist = nd2; o.parent = best.id; o.pe = ed; } }
      }
      const order = nodes.filter((n) => n.ok && n.dist < 1e8).sort((a, b) => b.dist - a.dist);
      for (const nd of order) if (nd.parent >= 0) { nodes[nd.parent].desc += nd.desc; nd.pe.kind = 'tree'; nd.pe.child = nd; }
      for (const nd of order.reverse()) if (nd.parent >= 0) nd.s0 = nodes[nd.parent].s0 + nd.pe.len;     // true arc distance from the Knot
      for (const ed of edges) {
        if (ed.kind === 'tree') { ed.r = Math.min(0.5 + 0.4 * Math.sqrt(ed.child.desc), 3.4); if (path.nearestXZ(ed.mx, ed.mz).dist < 26) ed.r = Math.min(ed.r, 1.9); }
        else if (ed.n1.dist < 1e8 && ed.n2.dist < 1e8 && rng() < 0.3) { ed.kind = 'loop'; ed.r = rng.range(0.5, 0.95); }
      }
    }
    await ctx.yield();

    // ---- tubes: every live edge becomes a honey-glass tube in the hero's own material ----
    const kids = nodes.map(() => []);
    for (const nd of nodes) if (nd.parent >= 0 && nd.pe.kind === 'tree') kids[nd.parent].push(nd);
    const lipEnd = new THREE.Vector3();                                       // where the main ends below the lip and divides
    const tubes = [], veinSamples = [];                                        // samples: [x, z, r, live] for the vein map
    const minR = (x, z) => 0.0028 * (path.nearestXZ(x, z).dist + 30);
    const pushTube = (xs, zs, ys, rs, ss, o) => {
      const n = xs.length, P = new Float32Array(n * 3), R = new Float32Array(n), S = new Float32Array(n);
      let zc = 0;
      for (let k = 0; k < n; k++) { P[k * 3] = xs[k]; P[k * 3 + 1] = ys[k]; P[k * 3 + 2] = zs[k]; R[k] = rs[k]; S[k] = ss[k]; zc += zs[k] / n; }
      tubes.push({ P, R, S, sides: o.sides, gain: o.gain ?? 1, r0: o.r0, seed: o.seed, ref: null, hang: !!o.hang, nocap: !!o.nocap, zc });
    };
    {  // the main
      const xs = [], zs = [], ys = [], rs = [], ss = [];
      for (let k = 0; k < main.length; k++) {
        const m = main[k], f = k / (main.length - 1), r = lerp(4.3, 6.2, smoothstep(0.2, 0.8, f)) * (1 + 0.06 * Math.sin(k * 0.9)) * (1 - 0.7 * smoothstep(0.84, 0.985, f));     // it slims toward the lip, where it splits
        xs.push(m.x); zs.push(m.z); rs.push(r); ss.push(S_LIP + m.d); ys.push(ground(m.x, m.z) + 0.25 * r);
        veinSamples.push([m.x, m.z, r, 1]);
        if (k < main.length - 1) veinSamples.push([(m.x + main[k + 1].x) / 2, (m.z + main[k + 1].z) / 2, r, 1]);
      }
      {  // the same tube runs on to the edge, bends over it as one closed elbow and stops a little way down, where it
         // divides: the three strands to the Knot start inside its end
        const m = main[main.length - 1], dir = path.tangentAt(uMainEnd), dl = Math.hypot(dir.x, dir.z) || 1, dx = dir.x / dl, dz = Math.max(dir.z / dl, 0.5), r0 = rs[rs.length - 1];
        let x = m.x, z = m.z, run = 0;
        for (let k = 0; k < 40; k++) {
          const nx = x + dx * 3.5, nz = z + dz * 3.5; if (nz > -lipZ(nx) - 3) break;
          x = nx; z = nz; run += 3.5;
          xs.push(x); zs.push(z); rs.push(r0); ys.push(groundRaw(x, z) + 0.3 * r0); ss.push(S_LIP - run); veinSamples.push([x, z, r0, 1]);
        }
        const ey = ys[ys.length - 1], RE = 5;
        for (let k = 1; k <= 6; k++) {                     // a quarter turn over the edge
          const a = k / 6 * Math.PI / 2;
          xs.push(x + dx * RE * Math.sin(a)); zs.push(z + dz * RE * Math.sin(a)); ys.push(ey - RE * (1 - Math.cos(a))); rs.push(r0 * (1 - 0.1 * k / 6)); ss.push(S_LIP - run - RE * a);
        }
        for (let k = 1; k <= 3; k++) { xs.push(x + dx * RE); zs.push(z + dz * RE); ys.push(ey - RE - 2.4 * k); rs.push(r0 * (0.9 - 0.12 * k)); ss.push(S_LIP - run - RE * 1.57 - 2.4 * k); }
        lipEnd.set(x + dx * RE * 0.25, ey - 0.2, z + dz * RE * 0.25);     // the crown of the bend: the three strands leave from here, in view from above the lip
      }
      await ctx.yield();
      const half = main.length >> 1, cut = (a, b) => pushTube(xs.slice(a, b), zs.slice(a, b), ys.slice(a, b), rs.slice(a, b), ss.slice(a, b), { sides: 14, r0: 5.5, seed: 0.37 });
      cut(0, half + 4); cut(half - 3, xs.length);          // the two lengths overlap, so no joint shows
    }
    await ctx.yield();
    let ec = 0;
    for (const ed of edges) {
      const live = ed.kind !== 'dry';
      // a quadratic through the gap between the two towers this edge squeezes past
      const a = ed.kind === 'tree' ? ed.child : (ed.n1.s0 > ed.n2.s0 ? ed.n1 : ed.n2), b = a === ed.n1 ? ed.n2 : ed.n1;
      const cx = 2 * ed.mx - (a.x + b.x) / 2, cz = 2 * ed.mz - (a.z + b.z) / 2, np = ed.r > 1.5 ? 9 : 6;
      const leaf = ed.kind === 'tree' && kids[a.id].length === 0;
      const xs = [], zs = [], ys = [], rs = [], ss = [];
      for (let k = 0; k < np; k++) {
        const t = k / (np - 1), w0 = (1 - t) * (1 - t), w1 = 2 * t * (1 - t), w2 = t * t;
        const x = w0 * a.x + w1 * cx + w2 * b.x, z = w0 * a.z + w1 * cz + w2 * b.z;
        if (!live) { veinSamples.push([x, z, 0.9, 0]); continue; }
        let r = Math.max(ed.r * (0.86 + 0.14 * t), minR(x, z));
        if (leaf) r *= 0.12 + 0.88 * smoothstep(0, 0.55, t);
        if (ed.kind === 'loop') r *= 0.75 + 0.25 * Math.abs(2 * t - 1);
        xs.push(x); zs.push(z); rs.push(r); ys.push(ground(x, z) + 0.25 * r); ss.push(lerp(a.s0, b.s0, t));
        veinSamples.push([x, z, r, 1]);
      }
      if (live) pushTube(xs, zs, ys, rs, ss, { sides: ed.r > 2 ? 10 : ed.r > 1.1 ? 7 : 5, r0: ed.r, seed: 0.05 + 0.9 * hash1(ec * 1.31), nocap: true });
      if (++ec % 240 === 0) await ctx.yield();
    }
    {  // at the lip the main pours over the edge and down the wall into the mist, and sends an arm up each flanking tower to the strands
      const mk = main.length - 1, m = main[mk], dir = path.tangentAt(uMainEnd);
      const arm = (tw, sgn, seed) => {
        const s0 = main[mk - 1], tx = tw.position.x - sgn * tw.radius * 0.62, tz = tw.position.z - tw.radius * 0.6, xs = [], zs = [], ys = [], rs = [], ss = [];
        for (let k = 0; k <= 34; k++) {
          const t = k / 34, g = smoothstep(0, 0.8, t), x = lerp(s0.x, tx, g) + Math.sin(t * 6 + seed * 9) * 2.5 * g * (1 - g), z = lerp(s0.z, tz, g * g);
          const r = lerp(2.0, 1.1, t), climb = smoothstep(0.72, 1, t);
          xs.push(lerp(x, tw.position.x - sgn * tw.radius * 0.45, climb * 0.6)); zs.push(lerp(z, tw.position.z - tw.radius * 0.35, climb * 0.6));
          ys.push(Math.max(groundRaw(x, z), 0) + 0.3 * r + climb * 3); rs.push(r * (1 - 0.6 * climb)); ss.push(S_LIP - 50 * t);
          if (t < 0.75) veinSamples.push([x, z, r, 1]);
        }
        for (let it = 0; it < 4; it++) for (let k = 1; k < xs.length - 1; k++) { xs[k] = (xs[k - 1] + 2 * xs[k] + xs[k + 1]) / 4; ys[k] = (ys[k - 1] + 2 * ys[k] + ys[k + 1]) / 4; zs[k] = (zs[k - 1] + 2 * zs[k] + zs[k + 1]) / 4; }
        pushTube(xs.reverse(), zs.reverse(), ys.reverse(), rs.reverse(), ss.reverse(), { sides: 9, r0: 2.2, seed, hang: true });
      };
      arm(A.towers[0], 1, 0.61); arm(A.towers[1], -1, 0.23);
    }
    // ---- THE RIVER CHOOSES (beat B): a stem leaves the main and forks beside the path; as the camera passes, one arm
    // starves to a pale thread on its own chalky track while its neighbour fattens (radius scales driven by u) ----
    const armMid = new THREE.Vector3();
    {
      const q = new THREE.Vector3(), tg = new THREE.Vector3();
      const lay = (u0, u1, n, latAt, rAt, code, seed, dry) => {
        const xs = [], zs = [], ys = [], rs = [], ss = [];
        for (let k = 0; k <= n; k++) {
          const t = k / n, u = lerp(u0, u1, t); path.pointAt(u, q); path.tangentAt(u, tg);
          const tl = Math.hypot(tg.x, tg.z) || 1, lat = latAt(t, u), x = q.x + tg.z / tl * lat, z = q.z - tg.x / tl * lat, r = rAt(t);
          xs.push(x); zs.push(z); rs.push(r); ys.push(ground(x, z) + 0.25 * r); ss.push(S_LIP + (uMainEnd - u) * path.length + lat);
          veinSamples.push([x, z, dry ? 0.35 : r * (code === 3 ? 2.6 : 1), 1]);
          if (dry) veinSamples.push([x, z, r * 1.08, 2]);
        }
        pushTube(xs.reverse(), zs.reverse(), ys.reverse(), rs.reverse(), ss.reverse(), { sides: 12, r0: 2.4, seed: code + seed });
      };
      const wob = (u) => 1.6 * Math.sin(u * 190) + 0.9 * Math.sin(u * 437);
      lay(0.183, 0.214, 9, (t) => 13 * smoothstep(0, 1, t), () => 2.9, 0, 0.42, false);                                              // the stem
      lay(0.214, 0.37, 30, (t, u) => 13 + wob(u) * smoothstep(0, 0.2, t) + 30 * smoothstep(0.72, 1, t), (t) => 2.5 * (1 - 0.75 * smoothstep(0.8, 1, t)), 2, 0.3, true);      // starves
      lay(0.214, 0.385, 32, (t, u) => 13 + 11.5 * smoothstep(0, 0.16, t) + wob(u + 0.3) * smoothstep(0.1, 0.3, t) + 34 * smoothstep(0.7, 1, t), (t) => 1.5 * (1 - 0.7 * smoothstep(0.82, 1, t)), 3, 0.3, false);   // fattens
      {  // the climber: leaves the main at u 0.2, crosses the floor, climbs the saddle and goes over its top
        path.pointAt(0.195, q);
        const ex = sad.x - q.x, ez = sad.z - q.z, el = Math.hypot(ex, ez) || 1, L = el + 36, n = Math.round(L / 2.4);
        const xs = [], zs = [], ys = [], rs = [], ss = [];
        for (let k = 0; k <= n; k++) {
          const t = k / n, dd = t * L, wv = 1.6 * Math.sin(dd * 0.13) * smoothstep(4, 16, dd);
          const x = q.x + ex / el * dd - ez / el * wv, z = q.z + ez / el * dd + ex / el * wv, r = 2.5 * (0.4 + 0.6 * smoothstep(0, 0.08, t)) * (1 - 0.8 * smoothstep(0.86, 1, t));
          xs.push(x); zs.push(z); rs.push(r); ys.push(ground(x, z) + 0.3 * r); ss.push(300 + dd);
          veinSamples.push([x, z, r, 1]);
        }
        pushTube(xs, zs, ys, rs, ss, { sides: 10, r0: 2.5, seed: 6.3 });
      }
      path.pointAt(0.29, q); path.tangentAt(0.29, tg);
      armMid.set(q.x + tg.z * 18, ground(q.x + tg.z * 18, q.z - tg.x * 18) + 2, q.z - tg.x * 18);
    }
    await ctx.yield();

    // ---- THE FRONT FEELS ITS WAY (beat D): three feelers leave the growing edge and creep across the bare stone to a
    // tower the net has not reached; their length is driven by u (uBranch.z), their tips taper in the vertex shader ----
    let feelLen = 60;
    {
      const aim = feelAim, tgt = feelSlot;
      const T = tgt ? { x: tgt.x, z: tgt.z, r: tgt.r * 1.02 } : { x: aim.x, z: aim.z, r: 2 };
      const pc = path.pointAt(0.47), base = Math.atan2(pc.x - T.x, pc.z - T.z);
      feelLen = 0;
      [-0.62, 0.0, 0.58, -1.2, 1.15].forEach((da, fi) => {
        const a = base + da, dx = Math.sin(a), dz = Math.cos(a);
        let d = T.r + 6; while (d < 150 && bayD(T.x + dx * d, T.z + dz * d) < 9) d += 4;                    // out to the covered stone
        const xs = [], zs = [], ys = [], rs = [], ss = [], n = 26; let arc = 0;
        for (let k = 0; k <= n; k++) {
          const t = k / n, dd = lerp(d, T.r * (fi === 1 ? 0.96 : 1.0), t), w = Math.sin(t * Math.PI) * (5 * Math.sin(t * 7 + fi * 2.1) + 2 * Math.sin(t * 17 + fi));
          const x = T.x + dx * dd + dz * w, z = T.z + dz * dd - dx * w, r = lerp(2.5, 1.5, t);
          if (k) arc += Math.hypot(x - xs[k - 1], z - zs[k - 1]);
          xs.push(x); zs.push(z); rs.push(r); ys.push(ground(x, z) + 0.3 * r + (fi === 1 ? 14 * smoothstep(0.93, 1, t) : 0)); ss.push(1000 + arc);
        }
        feelLen = Math.max(feelLen, arc);
        pushTube(xs, zs, ys, rs, ss, { sides: 8, r0: 2.0, seed: 4.1 + 0.17 * fi });
      });
    }
    await ctx.yield();

    // ---- at the lip the vein splits: strands thrown from the edge down to the Knot, each tested against the fly line
    // and against every strand of the hero ----
    {
      const SS = A.strandSamples || [], v = new THREE.Vector3(), a = lipEnd;
      const base = Math.atan2(a.x - A.knot.x, -(a.z - A.knot.z));
      let made = 0;
      for (const da of [0.0, -0.7, 0.7, -0.35, 0.35, -1.0, 1.0, -1.3, 1.3]) {
        if (made >= 3) break;
        const ang = base + da;
        const b = new THREE.Vector3(A.knot.x + Math.sin(ang) * 32, A.knot.y + 4, A.knot.z - Math.cos(ang) * 32), len = a.distanceTo(b);
        for (const sag of [-10, -6, -2, 3, 7, 11, 16, 22]) {      // -10 is the arc of a thing poured: level off the lip, steepening into the Knot
          let ok = true; const xs = [], zs = [], ys = [], rs = [], ss = [];
          for (let k = 0; k <= 30 && ok; k++) {
            const t = k / 30, rc = lerp(1.75, 1.3, t) * (1 + 0.2 * Math.exp(-t * 14)) * (0.3 + 0.7 * smoothstep(0, 0.07, t)), r = rc * 0.66;   // they grow out of the vein's body (rc: the width the clearances were set for)
            v.lerpVectors(a, b, t); v.y -= sag * 4 * t * (1 - t);
            v.x += (made - 1) * 2.0 * smoothstep(0, 0.07, t) * Math.exp(-t * 12);                     // the three leave the elbow side by side
            if (path.distanceTo(v.x, v.y, v.z) < (t < 0.15 ? 8.5 : 9.3) + rc) ok = false;
            if (t > 0.05 && t < 0.9) for (const sm of SS) { if (sm.p.distanceToSquared(v) < (rc + sm.r + 1.3) * (rc + sm.r + 1.3)) { ok = false; break; } }
            xs.push(v.x); zs.push(v.z); ys.push(v.y); rs.push(r); ss.push(42 + len * (1 - t));
          }
          if (ok) { pushTube(xs.reverse(), zs.reverse(), ys.reverse(), rs.reverse(), ss.reverse(), { sides: 9, r0: 1.1, seed: 5.11 + 0.23 * made, hang: true }); made++; break; }     // seed 5..6: the pour (brighter, swelling)
        }
        await ctx.yield();
      }
    }
    await ctx.yield();

    // mesh in z-bands (each band is one draw call that the frustum can drop), flattened where it rests on stone
    {
      const lay = tubes.filter((t) => !t.hang).sort((a, b) => a.zc - b.zc), hang = tubes.filter((t) => t.hang);
      const NB = 9, per = Math.ceil(lay.length / NB), groups = [];
      for (let b = 0; b < NB; b++) groups.push(lay.slice(b * per, (b + 1) * per));
      groups.push(hang);
      for (let gi = 0; gi < groups.length; gi++) {
        if (!groups[gi].length) continue;
        const geo = await hero.veinKit.meshTubes(groups[gi], ctx);
        if (gi < NB) {
          const p = geo.attributes.position.array, nr = geo.attributes.normal.array, tb = geo.attributes.aTube.array;
          for (let v = 0, n = p.length / 3; v < n; v++) p[v * 3 + 1] -= nr[v * 3 + 1] * tb[v * 4 + 1] * 0.35;
        }
        geo.boundingSphere = null; geo.computeBoundingSphere(); geo.boundingSphere.radius += 5;
        const mesh = new THREE.Mesh(geo, hero.veinKit.material);
        hero.object.add(mesh);
        await ctx.yield();
      }
    }

    // ---- the vein map (512 square, 8 bit): R nearness of a live vein, G height of the towers' cast shadow above the
    // gully floor (x160 m), B dried tracks, A signed distance to the edge of the unreached bay ----
    const MAP = { x0: -640, z0: F.z - 1250, w: 1360, h: 1300, n: 512 };
    const mapData = new Uint8Array(MAP.n * MAP.n * 4);
    {
      const NM = MAP.n;
      for (let k = 0; k < veinSamples.length; k += 2500) { splatSamples(mapData, NM, MAP, veinSamples, k, Math.min(k + 2500, veinSamples.length)); await ctx.yield(); }
      // cast shadows: every tower throws a tapering wedge of shade away from the sun; the map keeps its top
      const hl = Math.hypot(sunDir.x, sunDir.z), hx = sunDir.x / hl, hz = Math.max(sunDir.z / hl, 0.3), tanE = sunDir.y / hl;
      const casters = slots.filter((t) => t.on).concat(farTowers.filter((t) => t.z < -150)).map((t) => ({ x: t.x, z: t.z, r: t.r, h: t.h, gy: groundRaw(t.x, t.z) }));
      for (const t of A.towers) casters.push({ x: t.position.x, z: t.position.z, r: t.radius, h: t.height, gy: 0 });
      await ctx.yield();
      for (let c = 0; c < casters.length; c += 160) { shadeWedges(mapData, NM, MAP, casters, c, Math.min(c + 160, casters.length), hx, hz, tanE); await ctx.yield(); }
      // the bay's edge, worked out on a coarse lattice and smoothed up
      const NG = 128, G = new Float32Array((NG + 1) * (NG + 1));
      for (let gj = 0; gj <= NG; gj++) { for (let gi = 0; gi <= NG; gi++) G[gj * (NG + 1) + gi] = bayD(MAP.x0 + gi * MAP.w / NG, MAP.z0 + gj * MAP.h / NG); if (gj % 32 === 31) await ctx.yield(); }
      for (let j = 0; j < NM; j += 128) { upsampleBay(mapData, NM, G, NG, j, j + 128); await ctx.yield(); }
    }
    const veinMap = new THREE.DataTexture(mapData, MAP.n, MAP.n, THREE.RGBAFormat, THREE.UnsignedByteType);
    veinMap.magFilter = THREE.LinearFilter; veinMap.minFilter = THREE.LinearFilter; veinMap.wrapS = veinMap.wrapT = THREE.ClampToEdgeWrapping;
    veinMap.colorSpace = THREE.NoColorSpace; veinMap.needsUpdate = true;
    await ctx.yield();

    // one tileable noise texture, four channels of different grain
    const NS = 256, noiseData = new Uint8Array(NS * NS * 4);
    {
      const nr = rng.fork('noise');
      const acc = new Float32Array(NS * NS);
      for (let c = 0; c < 4; c++) {
        const octs = c === 2 ? [32, 64, 128] : c === 3 ? [4, 8, 16] : [8, 16, 32, 64];
        acc.fill(0); let amp = 0.5, tot = 0;
        for (const n of octs) {
          const L = new Float32Array(n * n); for (let k = 0; k < L.length; k++) L[k] = nr();
          noiseOctave(acc, L, n, NS, amp); tot += amp; amp *= 0.5;
        }
        noiseStore(noiseData, acc, tot, c);
        await ctx.yield();
      }
    }
    const noiseTex = new THREE.DataTexture(noiseData, NS, NS, THREE.RGBAFormat, THREE.UnsignedByteType);
    noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping; noiseTex.magFilter = THREE.LinearFilter; noiseTex.minFilter = THREE.LinearMipmapLinearFilter;
    noiseTex.generateMipmaps = true; noiseTex.colorSpace = THREE.NoColorSpace; noiseTex.needsUpdate = true;

    // ---- uniforms every stone, ground and mist shader of this world shares ----
    const fogCol = new THREE.Color(HOUR.fog);
    if (misty) fogCol.lerp(new THREE.Color('#E8EEF4'), 0.15);
    scene.fog = new THREE.FogExp2(fogCol, misty ? 0.00066 : 0.00058);
    const W = {
      uTime: { value: 0 }, uSun: U.uSun, uKey: { value: new THREE.Color(HOUR.key) }, uZen: { value: new THREE.Color(HOUR.zenith) },
      uFill: { value: new THREE.Color(pal[1]) }, uHorizon: { value: new THREE.Color(HOUR.horizon) },
      uStone: { value: new THREE.Color(pal[0]).multiplyScalar(wet ? 0.58 : 0.72) }, uMoss: { value: new THREE.Color(pal[6]) },
      uAmber: { value: new THREE.Color(ORG.amber) }, uLemon: { value: new THREE.Color(ORG.edge) }, uDarkA: { value: new THREE.Color(ORG.dark) },
      uVeinMap: { value: veinMap }, uMapRect: { value: new THREE.Vector4(MAP.x0, MAP.z0, 1 / MAP.w, 1 / MAP.h) }, uNoise: { value: noiseTex },
      uShade: { value: new THREE.Vector4(HOUR.shadeLine, HOUR.floorSun, wet, misty) },      // shade line height, sun on the floors, wet, mist
      uBay: { value: new THREE.Vector4(bay.x, bay.z, bay.rx, bay.rz) }, uCreep: { value: new THREE.Vector2(0, 0) }, uStarve: { value: 0 }, uSad: { value: new THREE.Vector4(sad.x, sad.z, groundRaw(sad.x, sad.z) - saddleH(sad.x, sad.z), 0) }, uSadAx: { value: new THREE.Vector2(sad.ax, sad.az) },   // metres crept, stroke 0..1; how far the starving arm has shrunk
      uPulse: { value: 0 }, uCloud: { value: new THREE.Vector2(0, 0) },
    };
    // K8: the new gorge banks take a stream of their own (it draws from no parent); where the bank field starts is drawn
    const bankRng = ctx.core.makeRng(ctx.core.hashSeed('gorge-banks:' + ctx.seed));
    W.uBank = { value: new THREE.Vector2(bankRng(), bankRng()) };
    const GLSL_W = /* glsl */`
      uniform float uTime, uPulse; uniform vec3 uSun, uKey, uZen, uFill, uHorizon, uStone, uMoss, uAmber, uLemon, uDarkA;
      uniform sampler2D uVeinMap, uNoise; uniform vec4 uMapRect, uShade, uBay; uniform vec2 uCreep, uCloud; uniform float uStarve; uniform vec4 uSad; uniform vec2 uSadAx;
      vec4 veinAt(vec2 xz){ return texture2D(uVeinMap, (xz - uMapRect.xy) * uMapRect.zw); }
      // drifting cumulus shadows: 1 in sun, lower under a cloud
      float cloudSun(vec2 xz){ float c = texture2D(uNoise, (xz + uCloud) / 1500.0).a; return 1.0 - 0.5 * smoothstep(0.6, 0.74, c); }
      // how much of the low sun reaches a point hgt metres above the gully floor: the towers' cast shadows, then cloud
      float sunReach(vec2 xz, float hgt){
        float H = veinAt(xz).g * 160.0;
        return smoothstep(H - 2.0, H + 3.0, hgt) * cloudSun(xz);
      }
      // the bay the net has not reached: under 0 is bare stone; the edge creeps inward on each out-stroke
      float bayDist(vec2 xz){ return (veinAt(xz).a - 0.5) * 160.0 + uCreep.x; }
      // limestone light: a raking warm key above the shade line, sky-blue fill below it, never grey; mist in the gorge
      vec3 stoneLight(vec3 alb, vec3 N, vec3 P, float hgt, float ao){
        float reach = sunReach(P.xz, hgt) * (0.1 + 0.9 * smoothstep(-26.0, 4.0, P.y));
        float ndl = clamp((dot(N, uSun) + 0.3) / 1.3, 0.0, 1.0);
        vec3 fill = mix(uFill * 1.2 + vec3(0.06, 0.07, 0.11), uHorizon * 0.56 + uZen * 0.36, 0.5 + 0.5 * N.y) * ao;
        fill *= mix(1.0, 0.42, (1.0 - smoothstep(-50.0, 2.0, P.y)));
        return alb * (fill * (1.0 - 0.3 * reach) * (0.8 + 0.2 * cloudSun(P.xz)) + uKey * vec3(1.0, 0.9, 0.7) * (ndl * 1.75 + 0.08) * reach);
      }
      vec3 gorgeMist(vec3 col, vec3 P){
        float m = (1.0 - smoothstep(-150.0, -62.0, P.y + (texture2D(uNoise, P.xz / 260.0 + vec2(uTime * 0.004, 0.0)).r - 0.5) * 26.0));
        return mix(col, uFill * 0.66 + uHorizon * 0.26, m * 0.93);
      }
      // K8: the gorge's bank field, 1 in a bank of mist and 0 in a hollow, in the gorge's own metres and on the world's
      // clock. One field shapes the new mist sheets and thins the mist tone on a wall where a hollow lies against it.
      // A bank and its hollow are together about half as long as the gorge is wide (the noise's coarsest grain, a quarter
      // of 640 m); across the gorge the field is three times as long again, so that a bank reaches from wall to wall. It
      // slides along the gorge at the pace of live's own sheets (0.008 of their 410 m a second), the same way; where it
      // starts is drawn (uBank), not typed.
      uniform vec2 uBank;
      float gorgeBank(vec2 xz){ return texture2D(uNoise, vec2(xz.x / 640.0 + uTime * (0.008 * 410.0 / 640.0) + uBank.x, xz.y / 1920.0 + uBank.y)).a; }
      // how far a hollow thins the mist tone on the stone: nil at y -120 and above (the brief's mist begins 120 m down),
      // whole one ledge spacing lower (the wall's ledges are 1 / 0.043 = 23.3 m apart); nil again at the wall's foot, the
      // lowest ledge spacing above the floor at y -205, so that no hollow ever shows the floor's stone. A hollow is thin
      // mist, not clear air: three tenths of the tone always stay.
      float gorgeThin(vec3 P){
        float band = (1.0 - smoothstep(-143.3, -120.0, P.y)) * smoothstep(-181.7, -158.4, P.y);
        return 0.7 * (1.0 - smoothstep(0.36, 0.56, gorgeBank(P.xz))) * band;
      }
    `;
    await ctx.yield();

    // ---- the ground: one warped grid, fine under the flight and at the gorge walls, coarse to the horizon ----
    const axis = (segs) => { const a = []; for (const [f, t, st] of segs) { const n = Math.max(1, Math.round((t - f) / st)); for (let k = 0; k < n; k++) a.push(f + (t - f) * k / n); } a.push(segs[segs.length - 1][1]); return a; };
    const gx = axis([[-3400, -1400, 500], [-1400, -700, 100], [-700, -300, 22], [-300, 340, 9], [340, 700, 22], [700, 1400, 100], [1400, 3400, 500]]);
    const gz = axis([[-3800, -2000, 450], [-2000, -1400, 100], [-1400, F.z - 1000, 30], [F.z - 1000, -188, 9], [-188, -112, 3.3], [-112, 112, 28], [112, 188, 3.3], [188, 500, 14], [500, 1400, 60], [1400, 3400, 500]]);
    const terrainGeo = new THREE.BufferGeometry();
    {
      const nx = gx.length, nz = gz.length, pos = new Float32Array(nx * nz * 3), idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
      const rows = (j0, j1) => { for (let j = j0; j < j1; j++) for (let i = 0; i < nx; i++) { const k = (j * nx + i) * 3; pos[k] = gx[i]; pos[k + 1] = ground(gx[i], gz[j]); pos[k + 2] = gz[j]; } };
      for (let j = 0; j < nz; j += 30) { rows(j, Math.min(j + 30, nz)); await ctx.yield(); }
      const quads = () => { let io = 0; for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + nx; idx[io++] = a; idx[io++] = b; idx[io++] = a + 1; idx[io++] = a + 1; idx[io++] = b; idx[io++] = b + 1; } };
      quads();
      terrainGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); terrainGeo.setIndex(new THREE.BufferAttribute(idx, 1));
      await ctx.yield();
      const nor = new Float32Array(nx * nz * 3);                               // normals from the grid's own neighbours, a few rows at a time
      const normals = (ja, jb) => { for (let j = ja; j < jb; j++) {
        const j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, nz - 1);
        for (let i = 0; i < nx; i++) {
          const i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, nx - 1), a = (j * nx + i0) * 3, b = (j * nx + i1) * 3, c = (j0 * nx + i) * 3, d = (j1 * nx + i) * 3;
          const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], wy = pos[d + 1] - pos[c + 1], wz = pos[d + 2] - pos[c + 2];
          const n0 = -uy * wz, n1 = ux * wz, n2 = -ux * wy, l = Math.max(Math.hypot(n0, n1, n2), 1e-9), k = (j * nx + i) * 3;
          nor[k] = n0 / l; nor[k + 1] = n1 / l; nor[k + 2] = n2 / l;
        }
      } };
      for (let j = 0; j < nz; j += 64) { normals(j, Math.min(j + 64, nz)); await ctx.yield(); }
      terrainGeo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      await ctx.yield();
      terrainGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 6000);
    }
    await ctx.yield();
    const FOGU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const GLSL_HASH = /* glsl */`float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }`;
    const groundMat = new THREE.ShaderMaterial({
      fog: true, uniforms: { ...FOGU(), ...W },
      vertexShader: /* glsl */`
        varying vec3 vP, vN;
        #include <fog_pars_vertex>
        void main(){ vP = position; vN = normal; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vP, vN;
        #include <fog_pars_fragment>
        ${GLSL_W}
        ${GLSL_HASH}
        void main(){
          vec3 N = normalize(vN), V = normalize(cameraPosition - vP); vec2 xz = vP.xz;
          float wall = (1.0 - smoothstep(-14.0, -2.0, vP.y)); vec2 nq = xz + vec2(0.0, vP.y * 0.9 * wall);
          float dist = length(cameraPosition - vP), near = 1.0 - smoothstep(50.0, 240.0, dist);
          float hgt = vP.y - (vP.z < 0.0 ? 0.012 * max(-150.0 - vP.z, 0.0) : 4.0);
          vec4 n1 = texture2D(uNoise, nq / 97.0), n2 = texture2D(uNoise, nq / 19.0 + 0.31), n3 = texture2D(uNoise, nq / 3.7);
          // relief from the same noise: blocks at 19 m, pitting at 3.7 m
          float bx = texture2D(uNoise, (nq + vec2(0.5, 0.0)) / 19.0 + 0.31).b - n2.b, bz = texture2D(uNoise, (nq + vec2(0.0, 0.5)) / 19.0 + 0.31).b - n2.b;
          float px = texture2D(uNoise, (nq + vec2(0.25, 0.0)) / 3.7).r - n3.r, pz = texture2D(uNoise, (nq + vec2(0.0, 0.25)) / 3.7).r - n3.r;
          vec3 Nb = normalize(N - vec3(bx * 9.0 + px * 2.2 * near, 0.0, bz * 9.0 + pz * 2.2 * near) * (1.0 - 0.5 * wall));
          // limestone pavement: pale blocks, dark grikes between them
          float grike = (1.0 - smoothstep(0.0, 0.09, abs(n2.b - 0.5))) * (0.35 + 0.65 * near);
          vec3 alb = uStone * vec3(0.84, 0.77, 0.64) * (0.62 + 0.3 * n1.r + 0.22 * (n2.r - 0.5) + 0.2 * (n3.r - 0.5) * near);
          alb *= 1.0 - 0.3 * grike;
          float xq = xz.x + (vP.z > 0.0 ? 500.0 : 0.0), bph = xq * 0.033 + 1.7 * sin(xq * 0.0071);
          float but = 1.0 - abs(sin(bph)); but *= but;                                   // 1 in the flutes between buttresses
          float lph = fract(vP.y * 0.043 + n1.r * 0.35 + 0.22 * sin(bph * 2.0));
          float ledgeTop = smoothstep(0.84, 0.9, lph) * (1.0 - smoothstep(0.95, 1.0, lph)), ledgeUnder = smoothstep(0.55, 0.82, lph) * (1.0 - smoothstep(0.82, 0.86, lph));
          float fph = xq * 0.52 + n1.g * 3.0 + sin(vP.y * 0.05) * 1.2, fwf = fwidth(fph);
          float flutes = mix(0.5, abs(sin(fph)), 1.0 - smoothstep(0.3, 1.0, fwf));
          vec3 wallAlb = uStone * (0.56 + 0.2 * flutes + 0.1 * n2.r) * (1.0 - 0.3 * ledgeUnder) * (1.0 + 0.85 * ledgeTop) * (0.55 + 0.45 * (1.0 - but));
          alb = mix(alb, wallAlb, wall);
          vec4 vm = veinAt(xz);
          float v = vm.r, dry = vm.b, bd = bayDist(xz), inBay = 1.0 - smoothstep(-8.0, 6.0, bd);
          alb = mix(alb, uStone * (1.0 + 0.12 * n2.r) * (1.0 - 0.3 * grike), inBay * (1.0 - wall));
          // the bare stone is not blank: the net lay here once and left. Its old bed is still there, a honeycomb of chalk
          // tracks with a dark seam down each and a raised rim, moss inside the rims, the cells between them stained and
          // damp by turns; ahead of the growing edge lemon scouts are already running back along the old seams
          float gE = 99.0, gm = inBay * (1.0 - wall);
          if (gm > 0.01) {
            vec2 gq = (xz + (n1.rg - 0.5) * 15.0 + (n2.rg - 0.5) * 2.0) / 34.0, gi = floor(gq), gf = gq - gi;
            float f1 = 9.0, f2 = 9.0; vec2 c1 = vec2(0.0), d1 = vec2(0.0, 1.0);
            for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
              vec2 o = vec2(float(i), float(j)), cid = gi + o, pt = o + 0.2 + 0.6 * vec2(h21(cid), h21(cid + 31.7)) - gf;
              float dd = dot(pt, pt);
              if (dd < f1) { f2 = f1; f1 = dd; c1 = cid; d1 = pt; } else if (dd < f2) { f2 = dd; }
            }
            gE = (sqrt(f2) - sqrt(f1)) * 17.0;                                  // metres to the nearest old track, about
            float ch = h21(c1 + 5.1), ch2 = h21(c1 + 9.7);
            float gTrk = 1.0 - smoothstep(1.3, 2.3, gE), gRim = smoothstep(1.9, 2.7, gE) * (1.0 - smoothstep(2.7, 4.4, gE)), gSeam = 1.0 - smoothstep(0.35, 0.95, gE);
            vec3 a2 = uStone * (0.5 + 0.36 * ch + 0.14 * n2.r + 0.2 * (n1.r - 0.5)) * (1.0 - 0.14 * grike) * (1.0 - 0.16 * smoothstep(4.0, 13.0, gE));
            a2 = mix(a2, a2 * vec3(0.7, 0.8, 0.98), step(ch2, 0.3) * 0.7);                                                    // damp cells are blue-grey
            a2 = mix(a2, a2 * vec3(1.06, 0.88, 0.62), step(0.5, ch2) * (0.3 + 0.5 * n1.g));                                   // old honey stain
            float gMoss = smoothstep(0.42, 0.68, n2.g + 0.3 * n1.b) * smoothstep(2.4, 4.6, gE) * (1.0 - smoothstep(5.0, 12.0, gE)) * step(0.38, ch);
            a2 = mix(a2, uMoss * (0.6 + 0.6 * n3.g), gMoss * 0.72);
            a2 = mix(a2, uStone * 1.42 + 0.04, gTrk * 0.9 * (0.8 + 0.2 * n3.b));
            a2 *= (1.0 + 0.22 * gRim) * (1.0 - 0.62 * gSeam);
            alb = mix(alb, a2, gm);
            vec2 gd = d1 / max(length(d1), 0.001);
            float tilt = smoothstep(2.4, 3.2, gE) * (1.0 - smoothstep(3.2, 4.8, gE)) - smoothstep(0.7, 1.5, gE) * (1.0 - smoothstep(1.5, 2.4, gE));
            Nb = normalize(mix(Nb, N, 0.45 * gm) + vec3(gd.x, 0.0, gd.y) * (tilt * 0.55 * gm));
          }
          // moss cushions, greenest along the dried tracks; nothing grows beside a live vein
          float moss = smoothstep(0.56, 0.74, n2.g + 0.25 * n1.b + 0.4 * dry - 0.18) * (1.0 - wall) * (1.0 - 0.85 * inBay) * (1.0 - smoothstep(0.75, 0.95, v));
          alb = mix(alb, uMoss * (0.6 + 0.6 * n3.g), moss * 0.75);
          // dried tracks: chalky ribbons with raised edges
          float bedIn = smoothstep(0.8, 0.9, dry), dryO = dry * (1.0 - bedIn) * 1.29;
          float trk = smoothstep(0.66, 0.82, dryO), rim = smoothstep(0.5, 0.64, dryO) * (1.0 - smoothstep(0.66, 0.76, dryO));
          alb = mix(alb, uStone * 1.3 + 0.03, trk * 0.8 * (0.75 + 0.25 * n3.b) * (1.0 - wall));
          alb *= 1.0 - 0.3 * rim;
          // the bed of the arm that starves: as it shrinks it leaves a pale chalky channel as wide as it was, with a raised
          // lip and a dark seam inside it, moss already at its edge
          float bedMid = smoothstep(0.93, 0.99, dry), bedLip = bedIn * (1.0 - bedMid);
          vec3 chalk = uStone * (1.45 + 0.25 * n3.b - 0.2 * n2.r) + vec3(0.07, 0.065, 0.05);
          alb = mix(alb, chalk * (1.0 - 0.3 * smoothstep(0.2, 0.9, fract(n1.r * 9.0 + n2.g * 3.0)) * bedMid), bedIn * uStarve);
          alb = mix(alb, uMoss * (0.8 + 0.5 * n3.g), smoothstep(0.62, 0.8, dry) * (1.0 - bedIn) * uStarve * 0.8);
          alb *= 1.0 + uStarve * (0.3 * bedLip - 0.34 * smoothstep(0.86, 0.93, dry) * (1.0 - smoothstep(0.93, 0.97, dry)));
          // contact shade and the pale hem where a vein rests
          float ao = (1.0 - 0.55 * smoothstep(0.78, 0.97, v)) * (1.0 - 0.3 * grike) * mix(0.66 + 0.2 * n1.b, 1.0, max(wall, smoothstep(10.0, 40.0, hgt)));
          alb = mix(alb, uStone * 1.2, smoothstep(0.9, 0.96, v) * 0.45);
          // K8: THE GORGE WALLS' RELIEF, per pixel, from the phases live paints them with (bph, lph, fph above), in world
          // height and metres along the gorge, the same on both walls and under the route as anywhere. Below the lip the
          // sky fill is the only light, so the relief is an occlusion and a normal turned down, and it only darkens:
          // nothing comes out paler than live. It reads no camera (not V, dist or near) and nothing of ground().
          {
            // ledges: the band under each painted lip stands in the lip's shade, deepest right under its edge (0.17 of the
            // fill goes: a tone set on the whole wall beside live, a third of the first depth), and faces down at 45 degrees
            // there. The edge is cut at the foot of live's pale band (0.84) one pixel wide; the band's own width on the
            // screen is taken from the phase before its fract(), so its wrap draws no hairline.
            float lu = vP.y * 0.043 + n1.r * 0.35 + 0.22 * sin(bph * 2.0), fwl = fwidth(lu);
            float lUnder = smoothstep(0.55, 0.84, lph) * clamp((0.84 - lph) / max(fwl, 1e-5) + 0.5, 0.0, 1.0) * (1.0 - smoothstep(0.3, 1.0, fwl / (0.84 - 0.55)));
            // flutes: the seam between two ribs lies on live's dark line (sin(fph) = 0). A wall flute is 6 m wide
            // (pi / 0.52); the shade at its seam is 0.055 deep: a tone set on the whole wall beside live (a third of the
            // first depth), not a measure of the flute. Finer than a pixel it goes to its mean over one flute
            // (1 - 2 / pi) by live's own filter (fwf).
            float fSeam = mix(0.3634, 1.0 - abs(sin(fph)), 1.0 - smoothstep(0.3, 1.0, fwf));
            // the notch between two buttresses (but, the lip's own 11 m recess, about 18 m wide at half its depth):
            // its shade is a ninth at its back: a tone set on the whole wall beside live, not a measure of the notch
            float wAo = (1.0 - 0.17 * lUnder) * (1.0 - 0.055 * fSeam) * (1.0 - but / 9.0);
            ao *= mix(1.0, wAo, wall);
            Nb.y -= lUnder * wall;
            Nb = Nb / max(length(Nb), 1e-4);
          }
          vec3 col = stoneLight(alb, Nb, vP, hgt, ao);
          float reach = sunReach(xz, hgt);
          // thread veins: exploratory filaments fanning out from every vein and behind the growing edge
          float t1 = (n2.r + 0.5 * n1.g) * 5.0, t2 = (n2.g + 0.6 * n3.a * near) * 4.0;
          float f1 = fwidth(t1), f2 = fwidth(t2);
          float l1 = (1.0 - smoothstep(0.014, 0.0142 + f1 * 1.5, abs(fract(t1) - 0.5))) * (1.0 - smoothstep(0.25, 0.7, f1));
          float l2 = (1.0 - smoothstep(0.016, 0.0162 + f2 * 1.5, abs(fract(t2) - 0.5))) * (1.0 - smoothstep(0.25, 0.7, f2));
          float behind = smoothstep(2.0, 14.0, bd) * (1.0 - smoothstep(30.0, 70.0, bd));
          float thr = max(l1 * smoothstep(0.5, 0.8, v), l2 * max(smoothstep(0.62, 0.9, v), behind)) * (1.0 - wall) * (1.0 - inBay);
          vec3 thrCol = mix(uLemon, uAmber, 0.45) * (0.5 + 0.5 * reach + 0.25 * n3.g) * (0.72 + 0.5 * sin((t1 + t2) * 21.0 - uPulse * 0.22));
          thr *= (1.0 - 0.7 * smoothstep(60.0, 170.0, dist)) * (1.0 - bedIn * uStarve);
          col = mix(col, thrCol, thr * 0.6);
          { float front = smoothstep(-150.0, -10.0, bd) * gm * (1.0 - 0.6 * smoothstep(120.0, 320.0, dist));
            float scout = (1.0 - smoothstep(0.4, 1.2, gE)) * front * (0.6 + 0.4 * sin(gE * 3.0 + (xz.x + xz.y) * 0.21 - uPulse * 0.22));
            col = mix(col, mix(uLemon, uAmber, 0.3) * (0.75 + 0.5 * reach), min(scout * 1.1, 1.0));
            col += uLemon * uKey * (0.07 * front * (1.0 - smoothstep(0.4, 3.2, gE))); }
          // light through the veins stains the rock beyond them
          float vs = veinAt(xz + uSun.xz * 9.0).r;
          col += uAmber * uKey * (smoothstep(0.5, 0.95, vs) * (1.0 - smoothstep(0.86, 0.98, v)) * 0.13 * (0.5 + uShade.y));
          // rain pans mirror the sky
          float pan = smoothstep(0.0, 0.03, n2.a * 0.62 + n1.g * 0.38 - mix(0.86, 0.74, uShade.z)) * smoothstep(0.93, 0.985, N.y) * (1.0 - trk) * (1.0 - smoothstep(0.8, 0.95, v));
          float fres = 1.0 - max(V.y, 0.0); fres *= fres;
          vec3 R = reflect(-V, normalize(vec3(sin(uTime * 1.7 + xz.x * 2.1) * 0.012, 1.0, sin(uTime * 1.3 + xz.y * 2.6) * 0.012)));
          float gl = max(dot(R, uSun), 0.0); gl *= gl; gl *= gl; gl *= gl; gl *= gl; gl *= gl;
          vec3 panCol = mix(uHorizon, uZen, clamp(R.y * 1.4, 0.0, 1.0)) * (0.24 + 0.6 * fres) + uKey * gl * gl * 3.0 * reach;
          panCol += vec3(0.5) * smoothstep(0.55, 0.75, texture2D(uNoise, xz / 37.0 + R.xz * 0.6 + vec2(uTime * 0.02, 0.0)).a) * (0.1 + 0.4 * fres);
          col = mix(col, panCol, pan * 0.92);
          col += (uHorizon * 0.5 + uZen * 0.2) * uShade.z * fres * fres * 0.22 * (1.0 - pan);      // wet stone takes a sky sheen
          // the growing edge: a lemon sheet in round lobes that bud on each out-stroke
          if (abs(bd - 10.0) < 46.0 && wall < 0.5) {
            vec2 id = floor(xz / 7.0); float best = 9.0;
            for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
              vec2 c = id + vec2(float(i), float(j)), h = vec2(h21(c), h21(c + 17.3)), cc = (c + 0.2 + 0.6 * h) * 7.0;
              float bdc = (textureLod(uVeinMap, (cc - uMapRect.xy) * uMapRect.zw, 0.0).a - 0.5) * 160.0 + uCreep.x;
              float Rl = clamp(bdc * 0.7 + 2.2 + 0.9 * sin(uCreep.y * 6.2832 + h.y * 6.2832) * h.x, 0.0, 6.4);
              best = min(best, length(xz - cc) - Rl + step(Rl, 0.05) * 9.0);
            }
            float sheet = (1.0 - smoothstep(-0.2, 0.25, best)) * (1.0 - smoothstep(12.0, 30.0, bd));
            float dome = clamp(-best / 3.5, 0.0, 1.0), lip = smoothstep(0.0, 0.5, -best) * (1.0 - smoothstep(0.5, 1.6, -best));
            // each lobe is a low dome of young glass: lemon where it is thin at the edge, amber where it is deep, the stone showing through
            float deep = smoothstep(0.1, 0.9, dome);
            vec3 sc = mix(uLemon, uAmber * vec3(1.0, 0.86, 0.7), deep * 0.9) * (0.36 + 0.4 * lip + 0.55 * reach + 0.12 * n3.g) * (1.0 - 0.3 * deep * (1.0 - reach));
            sc = mix(sc, col * mix(uLemon, uAmber, 0.5) * 2.2, 0.3 * (1.0 - lip));
            float dg = max(dot(reflect(-V, normalize(vec3(-uSun.x, 2.2, -uSun.z) * vec3(1.0 - dome, 1.0, 1.0 - dome))), uSun), 0.0); dg *= dg; dg *= dg; dg *= dg; dg *= dg;
            sc += uKey * dg * dg * 0.7 * reach + uHorizon * 0.12 * fres;
            col = mix(col * (1.0 - 0.35 * (1.0 - smoothstep(0.0, 1.2, best)) * step(0.0, best)), sc, sheet);
          }
          vec3 stoneK = col;                                     // K8: the stone before live's mist tone
          col = gorgeMist(col, vP);
          col = mix(col, stoneK, gorgeThin(vP));                 // K8: a hollow against the wall thins live's tone (never above y -120, never at the foot)
          gl_FragColor = vec4(col, 1.0);
          #include <fog_fragment>
        }`,
    });
    const terrain = new THREE.Mesh(terrainGeo, groundMat);
    scene.add(terrain);
    await ctx.yield();

    // ---- pinnacles: one fluted, ledged, ragged-crowned profile evaluated in the vertex shader, three levels of detail ----
    const GLSL_TOWER = /* glsl */`
      // radius (in units of the tower's base radius) at angle a and height fraction f; sd = seed, nf = flute count
      float towerR(float a, float f, float sd, float nf, float flute, out float cap){
        float crown = 0.5 + 0.5 * sin(a * 2.0 + sd) * cos(a * 3.0 - sd * 1.7);
        float h = clamp(f + 0.17 * crown * smoothstep(0.45, 0.95, f), 0.0, 1.0);
        float r = 0.86 - 0.33 * h;
        for (int k = 0; k < 4; k++) {
          float lg = 0.17 + 0.2 * float(k) + 0.03 * sin(sd * 3.0 + float(k) * 1.9) + 0.025 * sin(a * 2.0 + float(k) * 2.1 + sd);
          r += step(h, lg) * (0.03 + (0.09 + 0.05 * flute) * smoothstep(lg - 0.035, lg - 0.004, h));
        }
        cap = smoothstep(0.86, 1.0, h);
        r *= sqrt(max(1.0 - cap * cap, 0.0)) * 0.98 + 0.02 * (1.0 - cap);
        r *= 1.0 + 0.13 * sin(a * 2.0 + sd * 2.3 + h * 1.5) + 0.07 * sin(a * 3.0 + sd);
        r *= 1.0 - 0.1 * (1.0 - smoothstep(0.06, 0.1, f)) * smoothstep(0.0, 0.05, f) + 0.3 * (1.0 - smoothstep(0.0, 0.05, f));      // undercut foot, then the buried flare
        float fl = abs(sin(a * nf * 0.5 + sin(f * 9.0 + sd) * 0.5));
        float groove = (1.0 - fl) * (1.0 - fl);
        return r * (1.0 - 0.17 * flute * (1.0 - groove) * (1.0 - cap * 0.7));
      }`;
    const towerBase = (NA, NY) => {
      const af = new Float32Array((NA + 1) * (NY + 1) * 2), idx = new Uint16Array(NA * NY * 6);
      for (let j = 0; j <= NY; j++) for (let i = 0; i <= NA; i++) { const k = (j * (NA + 1) + i) * 2; af[k] = (i / NA) * Math.PI * 2; af[k + 1] = Math.pow(j / NY, 0.85); }
      let io = 0;
      for (let j = 0; j < NY; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + NA + 1; idx[io++] = a; idx[io++] = a + 1; idx[io++] = b; idx[io++] = b; idx[io++] = a + 1; idx[io++] = b + 1; }
      return { af: new THREE.BufferAttribute(af, 2), idx: new THREE.BufferAttribute(idx, 1), pos: new THREE.BufferAttribute(new Float32Array((NA + 1) * (NY + 1) * 3), 3) };
    };
    const towerMat = (flute) => new THREE.ShaderMaterial({
      fog: true, uniforms: { ...FOGU(), ...W, uFlute: { value: flute } },
      vertexShader: /* glsl */`
        attribute vec2 aAF; attribute vec4 aI, aJ;
        uniform float uFlute;
        varying vec3 vP, vN; varying vec4 vJ; varying vec3 vAF;
        varying float vTR;                                       // K8: the tower's base radius in metres, for the per-pixel relief
        #include <fog_pars_vertex>
        ${GLSL_TOWER}
        vec3 tp(float a, float f){ float c; float r = towerR(a, f, aJ.y, aJ.z, uFlute, c) * aI.w; return vec3(aI.x + sin(a) * r, aI.y - 7.0 + f * (aJ.x + 7.0), aI.z + cos(a) * r); }
        void main(){
          float a = aAF.x, f = aAF.y, df = f > 0.9 ? -0.012 : 0.012;
          vec3 p = tp(a, f), c = cross(tp(a + 0.03, f) - p, (tp(a, f + df) - p) * sign(df));
          vN = mix(c / max(length(c), 1e-5), vec3(0.0, 1.0, 0.0), smoothstep(0.97, 1.0, f));
          vP = p; vJ = aJ; vAF = vec3(a, f, aI.y);
          vTR = aI.w;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vP, vN; varying vec4 vJ; varying vec3 vAF;
        varying float vTR;
        #include <fog_pars_fragment>
        ${GLSL_W}
        void main(){
          vec3 N = normalize(vN); float a = vAF.x, f = vAF.y, sd = vJ.y, H = vJ.x;
          float dist = length(cameraPosition - vP);
          float crown = 0.5 + 0.5 * sin(a * 2.0 + sd) * cos(a * 3.0 - sd * 1.7);
          float h = clamp(f + 0.17 * crown * smoothstep(0.45, 0.95, f), 0.0, 1.0), cap = smoothstep(0.86, 1.0, h);
          float fl = abs(sin(a * vJ.z * 0.5 + sin(f * 9.0 + sd) * 0.5)), groove = (1.0 - fl) * (1.0 - fl);
          vec4 n1 = texture2D(uNoise, vec2(a * 1.3 + sd, vP.y * 0.012)), n2 = texture2D(uNoise, vec2(a * 5.0 + sd, vP.y * 0.07));
          // fine solution grooves, faded before they alias, and faint bedding
          float ph = a * 46.0 + sin(vP.y * 0.11 + sd) * 1.4 + n1.r * 3.0, fw = fwidth(ph);
          {  // the flutes meet in knife edges and carry fine runnels: both turn the shading normal round the tower
            float fa = a * vJ.z * 0.5 + sin(f * 9.0 + sd) * 0.5, nearK = 1.0 - smoothstep(70.0, 260.0, dist);
            vec3 tang = vec3(cos(a), 0.0, -sin(a));
            float knife = cos(fa) * sign(sin(fa)) * (1.0 - cap) * nearK;
            float runnel = cos(ph) * sign(sin(ph)) * (1.0 - smoothstep(0.2, 0.7, fw)) * (1.0 - cap);
            float bedN = cos(vP.y * 0.41 + sin(a * 3.0 + sd) * 2.0 + sin(vP.y * 0.13) * 3.0) * nearK;
            N = normalize(N + tang * (0.5 * knife + 0.22 * runnel) + vec3(0.0, 0.16 * bedN, 0.0));
          }
          float fine = mix(0.6, abs(sin(ph)), 1.0 - smoothstep(0.2, 0.7, fw));
          float bed = sin(vP.y * 0.41 + sin(a * 3.0 + sd) * 2.0 + sin(vP.y * 0.13) * 3.0);
          vec3 alb = uStone * (0.82 + 0.24 * groove + 0.14 * (n1.g - 0.5) + 0.1 * (n2.r - 0.5));
          alb = mix(alb, uFill * 0.9, 0.14 * (1.0 - groove));
          alb = mix(alb, vec3(0.9, 0.82, 0.66) * 0.8, (0.5 * cap + 0.25 * smoothstep(0.6, 1.0, h) * groove) * smoothstep(12.0, 40.0, H));
          alb *= 0.72 + 0.28 * smoothstep(12.0, 40.0, H);
          alb *= 0.88 + 0.17 * fine * (1.0 - 0.6 * cap) + 0.05 * bed;
          alb *= 1.0 - 0.2 * smoothstep(0.55, 0.75, n2.b) * (1.0 - cap);
          float nearT = 1.0 - smoothstep(40.0, 150.0, dist); vec4 n3 = texture2D(uNoise, vec2(a * 19.0 + sd, vP.y * 0.31));
          alb *= 1.0 + nearT * (0.22 * (n3.r - 0.5) - 0.2 * (1.0 - smoothstep(0.02, 0.1, abs(fract(vP.y * 0.19 + n1.r * 2.0 + sin(a * 2.0) * 0.4) - 0.5))) * step(0.45, n2.g));                                  // rain streaks
          // moss on faces turned from the sun and low down; ledges carry ferns and cushions
          float away = clamp(-(sin(a) * uSun.x + cos(a) * uSun.z), 0.0, 1.0), ledge = smoothstep(0.55, 0.9, N.y) * (1.0 - cap);
          float moss = smoothstep(0.55, 0.8, n1.b * 0.7 + 0.35 * away - 0.4 * h + 0.5 * ledge + 0.15 * n2.g);
          alb = mix(alb, uMoss * (0.7 + 0.6 * n2.g), moss * 0.45);
          float hgt = vP.y - (vP.z < 0.0 ? 0.012 * max(-150.0 - vP.z, 0.0) : 4.0), foot = vP.y - vAF.z;
          float ao = (0.6 + 0.4 * groove) * (0.55 + 0.45 * smoothstep(0.0, 9.0, foot));
          // K8: THE STONE'S RELIEF PER PIXEL, one rule on every tower of all three meshes, written in the tower's own angle,
          // height and radius. It goes into the sky fill's occlusion and the shading normal that stoneLight and the cap
          // light take, and nowhere else (the warm rim and the wet glint below keep live's N). It reads no camera, no
          // distance, no uFlute; what is finer than a pixel fades by its own width on the screen (fwidth, taken here).
          vec3 Nr = N; float rAo = 1.0;
          {
            // fine solution grooves (0.3 to 1.5 m, phase ph): the knife ridge lies where sin(ph) is 0, as live's runnel
            // normal cuts it, the round bottom where abs(sin(ph)) is 1. The occlusion is nil on the ridge and lies only
            // in the runnel at the groove's bottom, about an eighth of the groove wide (abs(sin(ph)) to the 32nd), so the
            // body between keeps live's tone. Its depth 0.22 is a tone set on every tower beside live, not a measure: in shade
            // (it acts on the sky fill alone) it takes the runnel, painted 1.05, to 0.82, under its ridge at 0.88. On the cap
            // it thins as the paint does. Finer than a pixel it goes to its mean over one groove (0.14 of the depth).
            float gS = sin(ph); gS *= gS; gS *= gS; gS *= gS; gS *= gS; gS *= gS;
            float gAo = 1.0 - 0.22 * (1.0 - 0.6 * cap) * mix(0.14, gS, 1.0 - smoothstep(0.2, 0.7, fw));
            // the four ledges, from the profile's own heights (GLSL_TOWER): under each lip the rock swells out by 0.14 of
            // the radius over 0.035 - 0.004 of the height, so that band faces down and stands in the lip's shade; at the
            // lip the profile steps back by 0.17 of the radius, a shelf that faces the sky.
            float fwh = fwidth(h), rel = vTR / max(H + 7.0, 1.0), lipW = 0.035 - 0.004;
            // a shelf falls outward at one in four, so rain runs off it: its top shows as a band a quarter of its depth tall
            float topW = max(0.25 * 0.17 * rel, 1e-4);
            float under = 0.0, tilt = 0.0, top = 0.0;
            for (int k = 0; k < 4; k++) {
              float lg = 0.17 + 0.2 * float(k) + 0.03 * sin(sd * 3.0 + float(k) * 1.9) + 0.025 * sin(a * 2.0 + float(k) * 2.1 + sd);
              float below = clamp((lg - h) / max(fwh, 1e-5) + 0.5, 0.0, 1.0);          // 1 under the lip's edge, 0 over it, one pixel wide
              float tt = clamp((h - (lg - 0.035)) / lipW, 0.0, 1.0);
              under = max(under, tt * tt * (3.0 - 2.0 * tt) * below);
              tilt = max(tilt, 6.0 * tt * (1.0 - tt) * below);
              top = max(top, (1.0 - below) * (1.0 - smoothstep(0.0, topW, h - lg)));
            }
            float lKeep = (1.0 - smoothstep(0.3, 1.0, fwh / lipW)) * (1.0 - cap), tKeep = (1.0 - smoothstep(0.3, 1.0, fwh / topW)) * (1.0 - cap);
            // right under a lip a quarter of the fill goes (half the first depth, as the brief audit asked): a deeper sky blue, never near black
            rAo = gAo * (1.0 - 0.25 * under * lKeep);
            // the swell's own slope (0.14 of the radius over lipW of the height, steepest in the middle) turns the normal down
            Nr = N + vec3(0.0, -min(0.14 * rel / lipW * tilt, 2.0) * lKeep, 0.0);
            Nr = Nr / max(length(Nr), 1e-4);
            Nr = mix(Nr, vec3(0.0, 1.0, 0.0), top * tKeep);
            Nr = Nr / max(length(Nr), 1e-4);
          }
          vec3 col = stoneLight(alb, Nr, vP, hgt, ao * rAo);
          // the low sun catches every crown: an ivory cap over a blue body
          float capR = sunReach(vP.xz, hgt + 5.0 + 0.3 * H);
          float tall = smoothstep(12.0, 40.0, H);                 // a stump is a dark boulder, not a white heap
          float capL = smoothstep(0.42, 0.95, h) * capR * (0.55 + 0.45 * clamp(dot(Nr, uSun) * 0.5 + 0.6, 0.0, 1.0)) * (0.15 + 0.85 * tall) * rAo;     // K8: the cap light takes the relief's normal and shade
          col += alb * uKey * vec3(1.0, 0.84, 0.56) * capL * clamp(1.6 - 1.7 * uSun.y, 0.5, 1.25);
          // seen against the sun, every crown and flute edge wears a warm rim
          vec3 Vr = normalize(cameraPosition - vP); float rimE = 1.0 - max(dot(N, Vr), 0.0), rimB = max(-dot(Vr, uSun), 0.0);
          col += alb * uKey * vec3(1.0, 0.8, 0.5) * (rimE * rimE * rimE * rimB * rimB * 1.6 * (0.25 + 0.75 * smoothstep(0.3, 0.9, h)) * (0.3 + 0.7 * capR));
          // after rain the wet stone glints toward the low sun
          vec3 Vw = normalize(cameraPosition - vP); float gw = max(dot(reflect(-Vw, N), uSun), 0.0); gw *= gw; gw *= gw; gw *= gw;
          col += uKey * uShade.z * gw * (0.1 + 0.5 * gw) * (0.4 + 0.6 * groove) * sunReach(vP.xz, hgt + 10.0);
          col *= 0.78 + 0.22 * smoothstep(0.0, 0.5, f);
          // amber light thrown onto the foot by the vein that passes it
          float vs = veinAt(vP.xz + uSun.xz * 5.0).r;
          col += uAmber * uKey * (smoothstep(0.55, 1.0, vs) * (1.0 - smoothstep(2.0, 16.0, foot)) * 0.16 * (0.6 + uShade.y));
          col += (uHorizon * 0.4) * uShade.z * 0.1 * (1.0 - N.y * N.y);                                   // wet sheen
          col = gorgeMist(col, vP);
          gl_FragColor = vec4(col, 1.0);
          #include <fog_fragment>
        }`,
    });
    const allTowers = slots.filter((s) => s.on).concat(farTowers);
    for (let k = 0; k < allTowers.length; k++) { const t = allTowers[k]; t.pd = path.nearestXZ(t.x, t.z).dist; t.gy = ground(t.x, t.z) - (t.sink || 0); t.flutes = 2 * (5 + Math.floor(t.seed % 3)); if (k % 150 === 149) await ctx.yield(); }
    allTowers.sort((a, b) => a.pd - b.pd);
    await ctx.yield();
    {
      const NHI = 18, NMID = Math.round(120 * (0.6 + 0.4 * detail));
      const lods = [
        { list: allTowers.slice(0, NHI), base: towerBase(44, 20), mat: towerMat(1), bands: 1 },
        { list: allTowers.slice(NHI, NHI + NMID), base: towerBase(16, 9), mat: towerMat(0.5), bands: 3 },
        { list: allTowers.slice(NHI + NMID), base: towerBase(7, 3), mat: towerMat(0), bands: 3 },
      ];
      for (const L of lods) {
        const sorted = L.list.slice().sort((a, b) => a.z - b.z), per = Math.ceil(sorted.length / L.bands);
        for (let b = 0; b < L.bands; b++) {
          const part = sorted.slice(b * per, (b + 1) * per); if (!part.length) continue;
          const g = new THREE.InstancedBufferGeometry();
          g.setAttribute('position', L.base.pos); g.setAttribute('aAF', L.base.af); g.setIndex(L.base.idx);
          const aI = new Float32Array(part.length * 4), aJ = new Float32Array(part.length * 4), box = new THREE.Box3();
          part.forEach((t, k) => { aI.set([t.x, t.gy, t.z, t.r], k * 4); aJ.set([t.h, t.seed, t.flutes, 0], k * 4); box.expandByPoint(new THREE.Vector3(t.x - 30, t.gy - 10, t.z - 30)); box.expandByPoint(new THREE.Vector3(t.x + 30, t.gy + t.h, t.z + 30)); });
          g.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4)); g.setAttribute('aJ', new THREE.InstancedBufferAttribute(aJ, 4));
          g.instanceCount = part.length; g.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
          scene.add(new THREE.Mesh(g, L.mat));
        }
        await ctx.yield();
      }
    }
    await ctx.yield();
    const updaters = [];                                                      // (dt, time, camera, u) of every later piece

    // ---- birds: white long-necked fliers (or dark swifts) as one instanced mesh, posed and flown in the vertex shader ----
    {
      const V = [], Wg = [], I = [];
      const v = (x, y, z, w = 0) => { V.push(x, y, z); Wg.push(w); return V.length / 3 - 1; };
      const tail = v(0, 0, -0.45), nose = v(0, 0.03, 0.22), r0 = v(0.08, 0, -0.05), r1 = v(0, 0.07, -0.05), r2 = v(-0.08, 0, -0.05), r3 = v(0, -0.06, -0.05);
      for (const [a, b] of [[r0, r1], [r1, r2], [r2, r3], [r3, r0]]) I.push(tail, b, a, nose, a, b);
      const n0 = v(-0.03, 0.03, 0.18), n1 = v(0.03, 0.03, 0.18), n2 = v(-0.022, 0.1, 0.34, -1), n3 = v(0.022, 0.1, 0.34, -1), n4 = v(-0.035, 0.1, 0.5, -2), n5 = v(0.035, 0.1, 0.5, -2), bk = v(0, 0.08, 0.72, -2);
      I.push(n0, n1, n2, n2, n1, n3, n2, n3, n4, n4, n3, n5, n4, n5, bk);
      for (const sg of [1, -1]) { const l0 = v(sg * 0.03, -0.04, -0.02), l1 = v(sg * 0.03, -0.04, -0.1), l2 = v(sg * 0.035, -0.06, -0.06, -3); I.push(l0, l1, l2); }
      for (const sg of [1, -1]) {
        const a = v(sg * 0.05, 0.03, 0.12, 0.05), b = v(sg * 0.05, 0.03, -0.14, 0.05), c = v(sg * 0.4, 0.03, 0.14, 0.53), d = v(sg * 0.4, 0.03, -0.16, 0.53), e = v(sg * 0.75, 0.03, 0.02, 1), f = v(sg * 0.62, 0.03, -0.14, 0.85);
        I.push(a, c, b, b, c, d, c, e, d, d, e, f);
      }
      const nRoost = 60, nPerch = Math.min(14, A.perches.length), nSkein = Math.round(40 * (0.5 + 0.5 * detail)), nSkim = swifts ? Math.round(170 * detail) : Math.round(18 * detail);
      const nNear = 13, N = nRoost + nPerch + nSkein + nSkim + nNear, aH = new Float32Array(N * 4), aM = new Float32Array(N * 4);
      const br = rng.fork('birds'), q = new THREE.Vector3(), tg = new THREE.Vector3();
      let k = 0;
      const put = (x, y, z, ph, m, a, b, c) => { aH.set([x, y, z, ph], k * 4); aM.set([m, a, b, c], k * 4); k++; };
      const skinTop = (x, z) => ground(x, z) + 0.25 * 6 + 6 * 0.62;
      for (let i = 0; i < nRoost; i++) {                                       // standing on the main vein of the close pass
        const u = lerp(0.575, 0.66, (i + br()) / nRoost); path.pointAt(u, q); path.tangentAt(u, tg);
        const off = br.range(-2.6, 2.6), x = q.x + tg.z * off, z = q.z - tg.x * off;
        put(x, skinTop(x, z) - 0.9 * Math.abs(off) * Math.abs(off) / 6, z, br(), 0, u - 14 / path.length - br() * 0.004, (off >= 0 ? 1 : -1) * br.range(0.7, 1.3), Math.atan2(tg.x, tg.z));
      }
      for (let i = 0; i < nPerch; i++) { const p = A.perches[i].position; put(p.x, p.y + 0.1, p.z, br(), 1, i % 3 === 0 ? br.range(9, 16) : 0, br.range(0.5, 0.8), br() * 6.28); }
      for (let i = 0; i < nSkein; i++) {                                       // two skeins crossing the tops far off
        const g = i % 2, row = (i >> 1), sideS = row % 2 ? 1 : -1;
        put(g ? 520 : -620, (g ? 112 : 96) + br.range(-1.5, 1.5), g ? -640 : -330, br(), 2, g ? -1.9 : 1.75, g ? 15 : 17, sideS * Math.ceil(row / 2));
      }
      const e0 = pts[14], e1 = F;
      for (let i = 0; i < nSkim; i++) {                                        // skimmers low over the skin of the last straight
        const t = br.range(0.25, 0.75), cx = lerp(e0.x, e1.x, t), cz = lerp(e0.z, e1.z, t);
        put(cx, skinTop(cx, cz) + br.range(0.6, 2.4), cz, br(), 3, Math.atan2(e1.x - e0.x, e1.z - e0.z), br.range(30, 75), br.range(0.35, 0.6) * (br() < 0.5 ? 1 : -1));
      }
      {  // one vee crosses close below the camera as it starts its dive (its place along its line follows u)
        path.pointAt(0.08, q); path.tangentAt(0.08, tg);                    // 50 m ahead of the camera at u 0.08 and a little below it: the middle of the frame
        const hd = Math.atan2(-tg.z, tg.x);
        for (let i = 0; i < nNear; i++) { const row = Math.ceil(i / 2), sideS = i % 2 ? 1 : -1; put(q.x + tg.x * 50, q.y - 9.5 + br.range(-0.6, 0.6), q.z + tg.z * 50, br(), 4, hd, row * 3.6, sideS * row * 2.7); }
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(V), 3)); g.setAttribute('aW', new THREE.BufferAttribute(new Float32Array(Wg), 1));
      g.setIndex(I); g.setAttribute('aH', new THREE.InstancedBufferAttribute(aH, 4)); g.setAttribute('aM', new THREE.InstancedBufferAttribute(aM, 4));
      g.instanceCount = N; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -400), 1400);
      const birdU = { ...FOGU(), ...W, uU: { value: 0 }, uBody: { value: new THREE.Color(swifts ? '#4A423A' : '#F4F1E8') }, uSize: { value: swifts ? 0.6 : 1.0 } };
      const mat = new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide, uniforms: birdU,
        vertexShader: /* glsl */`
          attribute float aW; attribute vec4 aH, aM;
          uniform float uTime, uU, uSize;
          varying float vShade, vPale;
          #include <fog_pars_vertex>
          void main(){
            float mode = aM.x, ph = aH.w * 6.2832;
            vec3 home = aH.xyz, off = vec3(0.0); float head = aM.w, fly = 1.0, bank = 0.0, pitch = 0.0, size = 1.25 * uSize;
            if (mode < 0.5) {                       // roost, then lift in a wave as the camera comes
              float q = max(uU - aM.y, 0.0) / 0.06; fly = smoothstep(0.0, 0.05, q);
              float c = cos(aM.w), s = sin(aM.w), sd = aM.z;
              vec2 f2 = vec2(s, c), r2 = vec2(c, -s);
              off.xz = f2 * (q * 42.0) + r2 * sd * (0.6 * fly + 3.6 * smoothstep(0.0, 0.2, q) + 20.0 * q * q);
              off.y = 9.0 * sqrt(q) + 5.0 * q * q + 0.5 * sin(uTime * 3.0 + ph) * fly;
              head = aM.w + sd * 0.5 * smoothstep(0.1, 1.0, q); bank = -sd * 0.35 * fly; pitch = 0.5 * (1.0 - smoothstep(0.1, 0.5, q)) * fly;
            } else if (mode < 1.5) {                // perched on the strands; every third wheels round its perch
              float R = aM.y, a = uTime * aM.z * (22.0 / max(R, 9.0)) * 0.6 + ph; fly = step(0.5, R);
              off = vec3(cos(a) * R - R, 4.0 * fly + 2.0 * sin(a * 0.5) * fly, sin(a) * R); head = fly > 0.5 ? -a : aM.w; bank = 0.4 * fly;
            } else if (mode < 2.5) {                // far skeins: a vee crossing above the tops
              float side = aM.w * 4.5, d = mod(uTime * aM.z + 300.0, 1500.0) - abs(aM.w) * 5.0; head = aM.y;
              off.xz = vec2(sin(head), cos(head)) * d + vec2(cos(head), -sin(head)) * side; off.y = sin(uTime * 0.4 + ph) * 1.5; size = 5.0;
            } else if (mode > 3.5) {                // the near vee: its middle crosses the camera's line at u 0.08
              float d = (uU - 0.069) * 1100.0 - aM.z; head = aM.y;
              off.xz = vec2(sin(head), cos(head)) * d + vec2(cos(head), -sin(head)) * aM.w; off.y = 0.7 * sin(uTime * 0.6 + ph); size = 5.6;
            } else {                                // skimmers: long flat loops low over the vein
              float a = uTime * aM.w + ph, c = cos(aM.y), s = sin(aM.y);
              vec2 e = vec2(sin(a) * 3.2 * sign(aM.w), cos(a) * aM.z);
              off.xz = vec2(s, c) * e.y + vec2(c, -s) * e.x; off.y = 0.5 * sin(a * 3.0 + ph);
              head = aM.y + atan(cos(a) * 3.2, -sin(a) * aM.z * sign(aM.w)); size = 1.1 * uSize;
            }
            // no bird crosses the lens: one that would pass close shrinks away to nothing first
            float dcam = distance(cameraPosition, home + off); size *= mode < 0.5 ? smoothstep(2.5, 7.0, dcam) : smoothstep(9.0, 22.0, dcam);
            // pose: beat the wings when flying, fold them and stand tall when not
            vec3 p = position; float w = max(aW, 0.0), sx = sign(p.x), st = 1.0 - fly;
            if (aW < -2.5) { p.y -= 0.36 * st; p.z -= 0.42 * fly; p.y += 0.04 * fly; }
            else if (aW < -1.5) { p.y += 0.36 * st; p.z -= 0.24 * st; }
            else if (aW < -0.5) { p.y += 0.2 * st; p.z -= 0.16 * st; }
            float beat = sin(uTime * (mode > 1.5 && mode < 2.5 ? 7.0 : 11.0) + ph * 3.0), th = beat * 0.75 * fly;
            float lag = sin(uTime * 11.0 + ph * 3.0 - 0.9) * 0.5 * fly;
            p.y += abs(p.x) * sin(th) + max(w - 0.53, 0.0) * 0.8 * sin(lag);
            p.x = sx * mix(0.05 + w * 0.06, abs(p.x) * (0.8 + 0.2 * cos(th)), fly);
            p.z -= (1.0 - fly) * w * 0.3; p.y -= (1.0 - fly) * w * 0.12;
            float pt = mix(-0.3, -pitch, fly), cp = cos(pt), sp = sin(pt);
            p.yz = vec2(p.y * cp - p.z * sp, p.y * sp + p.z * cp); p.y += (1.0 - fly) * 0.38;
            p.xy = vec2(p.x * cos(bank) - p.y * sin(bank), p.x * sin(bank) + p.y * cos(bank));
            float ch = cos(head), sh = sin(head);
            p.xz = vec2(p.x * ch + p.z * sh, -p.x * sh + p.z * ch);
            vPale = step(3.5, mode);
            vShade = (0.62 + 0.38 * clamp(p.y * 2.0 + 0.5, 0.0, 1.0) + 0.2 * w * beat * fly) * (1.0 - 0.3 * smoothstep(0.7, 1.0, w)) * (aW < -2.5 ? 0.45 : 1.0);
            vec4 mvPosition = modelViewMatrix * vec4(home + off + p * size, 1.0); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uBody, uKey, uHorizon, uZen; varying float vShade, vPale;
          #include <fog_pars_fragment>
          void main(){
            vec3 col = mix(uBody, vec3(0.96, 0.94, 0.9), vPale) * ((uHorizon * 0.55 + uZen * 0.3) + uKey * 0.5 * vShade) * vShade;
            gl_FragColor = vec4(col, 1.0);
            #include <fog_fragment>
          }`,
      });
      const birds = new THREE.Mesh(g, mat); birds.frustumCulled = false;
      scene.add(birds);
      updaters.push((dt, time, camera, u) => { birdU.uU.value = u; });
    }
    await ctx.yield();

    // ---- fallen blocks at the tower feet, ferns on the ledges, wiry shrubs on the caps, grass under the overhangs ----
    const jsTowerR = (t, a, f) => {                                           // the vertex shader's profile, for placing things on a tower
      const sd = t.seed, crown = 0.5 + 0.5 * Math.sin(a * 2 + sd) * Math.cos(a * 3 - sd * 1.7), h = clamp(f + 0.17 * crown * smoothstep(0.45, 0.95, f), 0, 1);
      let r = 0.86 - 0.33 * h;
      for (let k = 0; k < 4; k++) { const lg = 0.17 + 0.2 * k + 0.03 * Math.sin(sd * 3 + k * 1.9) + 0.025 * Math.sin(a * 2 + k * 2.1 + sd); if (h <= lg) r += 0.03 + 0.14 * smoothstep(lg - 0.035, lg - 0.004, h); }
      const cap = smoothstep(0.86, 1, h); r *= Math.sqrt(Math.max(1 - cap * cap, 0)) * 0.98 + 0.02 * (1 - cap);
      r *= 1 + 0.13 * Math.sin(a * 2 + sd * 2.3 + h * 1.5) + 0.07 * Math.sin(a * 3 + sd);
      return r * t.r;
    };
    const veinNear = (x, z) => { const i = Math.floor((x - MAP.x0) / MAP.w * MAP.n), j = Math.floor((z - MAP.z0) / MAP.h * MAP.n); return i < 0 || j < 0 || i >= MAP.n || j >= MAP.n ? 0 : mapData[(j * MAP.n + i) * 4] / 255; };
    {
      const fr = rng.fork('flora'), nearT = allTowers.slice(0, 70);
      // blocks
      const nB = Math.round(520 * detail * dens), bP = new Float32Array(nB * 4), bQ = new Float32Array(nB * 4);
      let nb = 0;
      for (let tries = 0; tries < nB * 4 && nb < nB; tries++) {
        const t = nearT[Math.floor(fr() * fr() * nearT.length)], a = fr() * 6.283, lean = fr() < 0.6, d = t.r * (lean ? fr.range(0.98, 1.2) : fr.range(1.3, 2.4));
        const x = t.x + Math.sin(a) * d, z = t.z + Math.cos(a) * d, size = lean ? fr.range(1.2, 4.2) : fr.range(0.6, 2.2);
        if (veinNear(x, z) > 0.8 || path.nearestXZ(x, z).dist < 8 + size || bayD(x, z) < -20 || z > -165) continue;
        if (tries % 120 === 119) await ctx.yield();
        bP.set([x, ground(x, z) + size * 0.22, z, size], nb * 4); bQ.set([fr() * 6.283, lean ? fr.range(0.3, 0.9) : fr.range(0, 0.3), fr.range(0.55, 1.5), fr() * 100], nb * 4); nb++;
      }
      const bg = new THREE.InstancedBufferGeometry(), box = new THREE.BoxGeometry(1, 1, 1, 2, 1, 2), bp = box.attributes.position;
      for (let k = 0; k < bp.count; k++) { const x = bp.getX(k), y = bp.getY(k), z = bp.getZ(k), n = noise.n3(x * 3.1 + 9, y * 3.1, z * 3.1) * 0.22; bp.setXYZ(k, x * (1 + n) * (y > 0 ? 0.8 : 1), y * (1 - n), z * (1 + n * 0.7) * (y > 0 ? 0.86 : 1)); }
      bg.setAttribute('position', bp); bg.setIndex(box.index);
      bg.setAttribute('aP', new THREE.InstancedBufferAttribute(bP, 4)); bg.setAttribute('aQ', new THREE.InstancedBufferAttribute(bQ, 4));
      bg.instanceCount = nb; bg.boundingSphere = new THREE.Sphere(new THREE.Vector3(F.x - 30, 20, F.z - 480), 620);
      disposables.push(box);
      scene.add(new THREE.Mesh(bg, new THREE.ShaderMaterial({
        fog: true, uniforms: { ...FOGU(), ...W },
        vertexShader: /* glsl */`
          attribute vec4 aP, aQ; varying vec3 vP; varying float vSeed;
          #include <fog_pars_vertex>
          void main(){
            vec3 p = position * aP.w * vec3(1.0, aQ.z, 1.25 - 0.25 * aQ.z);
            float ct = cos(aQ.y), st = sin(aQ.y); p.xy = vec2(p.x * ct - p.y * st, p.x * st + p.y * ct);
            float cr = cos(aQ.x), sr = sin(aQ.x); p.xz = vec2(p.x * cr + p.z * sr, -p.x * sr + p.z * cr);
            vP = aP.xyz + p; vSeed = aQ.w;
            vec4 mvPosition = modelViewMatrix * vec4(vP, 1.0); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vP; varying float vSeed;
          #include <fog_pars_fragment>
          ${GLSL_W}
          void main(){
            vec3 c = cross(dFdx(vP), dFdy(vP)), N = c / max(length(c), 1e-6);
            vec4 n = texture2D(uNoise, vP.xz / 2.3 + vP.y * 0.21 + vSeed);
            vec3 alb = uStone * (0.78 + 0.3 * n.r + 0.1 * fract(vSeed));
            alb = mix(alb, uMoss * (0.6 + 0.5 * n.g), smoothstep(0.5, 0.75, n.b + 0.3 * N.y) * 0.55);
            float hgt = vP.y - (vP.z < 0.0 ? 0.012 * max(-150.0 - vP.z, 0.0) : 4.0);
            vec3 col = stoneLight(alb, N, vP, hgt, 0.62 + 0.3 * smoothstep(0.0, 2.5, hgt));
            col += uAmber * uKey * smoothstep(0.55, 1.0, veinAt(vP.xz + uSun.xz * 5.0).r) * 0.14;
            gl_FragColor = vec4(col, 1.0);
            #include <fog_fragment>
          }`,
      })));
      await ctx.yield();
      // tufts: six tapering blades; ferns (green, on ledges and at groove feet), shrubs (pale, on caps), hanging grass (flipped)
      const TV = [], TW = [], TI = [];
      for (let b = 0; b < 6; b++) {
        const a = b / 6 * 6.283 + 0.3 * Math.sin(b * 2.4), ca = Math.cos(a), sa = Math.sin(a), o = TV.length / 3, wd = 0.11;
        TV.push(-sa * wd, 0, ca * wd, sa * wd, 0, -ca * wd, ca * 0.55 - sa * wd * 0.7, 0.5, sa * 0.55 + ca * wd * 0.7, ca * 0.55 + sa * wd * 0.7, 0.5, sa * 0.55 - ca * wd * 0.7, ca * 1.05, 0.42, sa * 1.05);
        TW.push(0, 0, 0.5, 0.5, 1); TI.push(o, o + 1, o + 2, o + 1, o + 3, o + 2, o + 2, o + 3, o + 4);
      }
      const nT = Math.round(1300 * detail * dens), tP = new Float32Array(nT * 4), tC = new Float32Array(nT * 4);
      let nt = 0;
      const fern = new THREE.Color(pal[6]).multiplyScalar(0.9), shrub = new THREE.Color('#B9BE9A'), grass = new THREE.Color('#9DA86A'), cc = new THREE.Color();
      for (let tries = 0; tries < nT * 3 && nt < nT; tries++) {
        if (tries % 250 === 249) await ctx.yield();
        const t = nearT[Math.floor(Math.pow(fr(), 1.6) * nearT.length)], a = fr() * 6.283, kind = fr();
        let f, rr, sc, flip = 1;
        if (kind < 0.6) {                                                      // ledge ferns
          const kq = Math.floor(fr() * 4), lg = 0.17 + 0.2 * kq + 0.03 * Math.sin(t.seed * 3 + kq * 1.9) + 0.025 * Math.sin(a * 2 + kq * 2.1 + t.seed);
          const crown = 0.5 + 0.5 * Math.sin(a * 2 + t.seed) * Math.cos(a * 3 - t.seed * 1.7);
          f = lg - 0.004; for (let it = 0; it < 3; it++) f = lg - 0.004 - 0.17 * crown * smoothstep(0.45, 0.95, f);
          rr = lerp(jsTowerR(t, a, f + 0.02), jsTowerR(t, a, f - 0.03), fr.range(0.35, 0.95)); sc = fr.range(0.8, 1.7); cc.copy(fern).multiplyScalar(fr.range(0.7, 1.2));
        } else if (kind < 0.78) { f = fr.range(0.9, 0.97); rr = jsTowerR(t, a, f) * fr.range(0.3, 0.95); sc = fr.range(1.4, 2.6); cc.copy(shrub).multiplyScalar(fr.range(0.8, 1.1)); }
        else if (kind < 0.9) { f = 0.105; rr = jsTowerR(t, a, f) * 0.97; sc = fr.range(1.0, 1.8); flip = -1; cc.copy(grass).multiplyScalar(fr.range(0.7, 1.1)); }
        else { f = 0.065; rr = t.r * fr.range(1.0, 1.5); sc = fr.range(0.9, 1.8); cc.copy(fern).multiplyScalar(fr.range(0.7, 1.1)); }
        const x = t.x + Math.sin(a) * rr, z = t.z + Math.cos(a) * rr, y = kind >= 0.9 ? ground(x, z) : t.gy - 7 + f * (t.h + 7);
        if (kind >= 0.9 && veinNear(x, z) > 0.86) continue;
        tP.set([x, y + (flip < 0 ? 0.3 : -0.05), z, sc * flip], nt * 4); tC.set([cc.r, cc.g, cc.b, fr() * 6.283], nt * 4); nt++;
      }
      const tg = new THREE.InstancedBufferGeometry();
      tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TV), 3)); tg.setAttribute('aW', new THREE.BufferAttribute(new Float32Array(TW), 1)); tg.setIndex(TI);
      tg.setAttribute('aP', new THREE.InstancedBufferAttribute(tP, 4)); tg.setAttribute('aC', new THREE.InstancedBufferAttribute(tC, 4));
      tg.instanceCount = nt; tg.boundingSphere = new THREE.Sphere(new THREE.Vector3(F.x - 30, 40, F.z - 480), 640);
      scene.add(new THREE.Mesh(tg, new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide, uniforms: { ...FOGU(), ...W },
        vertexShader: /* glsl */`
          attribute float aW; attribute vec4 aP, aC; uniform float uTime; varying vec3 vC, vP; varying float vT;
          #include <fog_pars_vertex>
          void main(){
            float s = abs(aP.w), fl = sign(aP.w), cr = cos(aC.w), sr = sin(aC.w);
            vec3 p = position * s; p.y *= fl * (fl < 0.0 ? 1.8 : 1.0); if (fl < 0.0) p.xz *= 0.45;
            p.xz = vec2(p.x * cr + p.z * sr, -p.x * sr + p.z * cr);
            float wv = sin(uTime * 1.9 + aP.x * 0.7 + aP.z * 0.5 + aC.w) + 0.5 * sin(uTime * 3.7 + aC.w * 5.0);
            p.xz += vec2(0.11, 0.07) * wv * aW * s; p.y += 0.05 * wv * aW * aW * s;
            vP = aP.xyz + p; vC = aC.rgb; vT = aW;
            vec4 mvPosition = modelViewMatrix * vec4(vP, 1.0); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vC, vP; varying float vT;
          #include <fog_pars_fragment>
          ${GLSL_W}
          void main(){
            float hgt = vP.y - (vP.z < 0.0 ? 0.012 * max(-150.0 - vP.z, 0.0) : 4.0);
            vec3 col = vC * (0.55 + 0.6 * vT) * (uFill * 1.1 + uHorizon * 0.45 + uKey * 1.1 * sunReach(vP.xz, hgt));
            gl_FragColor = vec4(col, 1.0);
            #include <fog_fragment>
          }`,
      })));
    }
    await ctx.yield();

    // ---- mist: many thin sheets staggered in the gorge, each feathered out before it can meet a wall, wispy at the top;
    // sunlit on the near side, in the far wall's blue shadow beyond, bluer again under the net ----
    {
      const sheets = [], nG = Math.max(6, Math.round(11 * detail));
      for (let k = 0; k < nG; k++) { const f = k / (nG - 1); sheets.push({ y0: lerp(-152, -86, f * f * 0.5 + f * 0.5), slope: 0, x: [-2600, 2600], z: [-150, 150], a: lerp(0.5, 0.26, f), th: lerp(0.24, 0.6, f * f), sc: lerp(1, 1.7, f) }); }
      if (misty) for (let k = 0; k < 4; k++) sheets.push({ y0: 2 + k * 2.6, slope: 0.012, x: [-1500, 1500], z: [-2400, -150], a: 0.4 - 0.06 * k, th: 0.5 + 0.035 * k, sc: 0.75, gully: 1 });
      const P = [], Q = [], Q2 = [], I = [], featK = nG - 1;       // one sheet carries what lies ON the mist: rings, shadows, the pool of light
      sheets.forEach((s, k) => {
        const o = P.length / 3;
        for (const [x, z] of [[s.x[0], s.z[0]], [s.x[1], s.z[0]], [s.x[0], s.z[1]], [s.x[1], s.z[1]]]) { P.push(x, s.y0 + s.slope * Math.max(-150 - z, 0), z); Q.push(s.a, k * 0.37, s.sc, s.gully ? 1 : 0); Q2.push(s.th, s.y0, k === featK ? 1 : 0); }
        I.push(o, o + 2, o + 1, o + 1, o + 2, o + 3);
      });
      // K8: banks that reach both walls. Live's sheets stay as they are and feather out before the stone; these few new
      // sheets lie at the brief's mist level, y -120, and half a ledge spacing (0.5 / 0.043 m) lower each, and run past the
      // lip's furthest reach (lipZ is never over 163) into the stone on both sides. They are shaped by the bank field of
      // GLSL_W: the lower a sheet, the wider its banks and the more of it lies in the bank's own shade (a bank is a
      // mound: aK.y is 0 on the top sheet and 1 on the lowest), and the lowest keeps a quarter of its
      // strength in the hollows so that no hollow opens onto the floor. Their number scales with detail as live's
      // does. Vertices of their own after live's loop, a flag of their own (aK.x), a start phase drawn from the
      // banks' own stream; in the index list each goes before every live sheet that lies above it, so live's upper
      // sheets and what lies on the top one are drawn over them.
      const K = new Array(P.length / 3 * 2).fill(0);
      {
        const nNew = Math.max(2, Math.round(3 * detail)), added = [];
        for (let j = 0; j < nNew; j++) {
          const y0 = -120 - j * 0.5 / 0.043, o = P.length / 3, ph = bankRng();
          for (const [x, z] of [[-2600, -170], [2600, -170], [-2600, 170], [2600, 170]]) { P.push(x, y0, z); Q.push(0.5 + 0.06 * j, ph, 1, 0); Q2.push(0.52 - 0.08 * j, y0, 0); K.push(1, j / (nNew - 1)); }
          added.push({ y0, t: [o, o + 2, o + 1, o + 1, o + 2, o + 3] });
        }
        const order = sheets.map((sh, k) => ({ y0: sh.gully ? 1e9 : sh.y0, t: I.slice(k * 6, k * 6 + 6) })).concat(added).map((e, i) => ({ y0: e.y0, t: e.t, i })).sort((p, q) => p.y0 - q.y0 || p.i - q.i);
        I.length = 0; for (const e of order) I.push(...e.t);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 4)); g.setAttribute('aQ2', new THREE.Float32BufferAttribute(Q2, 3)); g.setIndex(I);
      g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 2));                    // K8: 1 on the new banks' vertices; how low in its bank a sheet lies (0 top, 1 lowest)
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 6000);
      const tanE = sunDir.y / Math.hypot(sunDir.x, sunDir.z);
      const mist = new THREE.Mesh(g, new THREE.ShaderMaterial({
        fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...FOGU(), ...W, uMistSun: { value: 150 - 40 / Math.max(tanE, 0.05) } },
        vertexShader: /* glsl */`
          attribute vec4 aQ; attribute vec3 aQ2; varying vec3 vP; varying vec4 vQ; varying vec3 vQ2;
          attribute vec2 aK; varying vec2 vK;
          #include <fog_pars_vertex>
          void main(){ vP = position; vQ = aQ; vQ2 = aQ2; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
            vK = aK;
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vP; varying vec4 vQ; varying vec3 vQ2; uniform float uMistSun;
          varying vec2 vK;
          #include <fog_pars_fragment>
          ${GLSL_W}
          void main(){
            vec2 q = vP.xz * vQ.z * vec2(1.0, mix(1.0, 0.45, vQ.w));
            float n = texture2D(uNoise, q / 410.0 + vec2(uTime * 0.008, vQ.y)).r * 0.62 + texture2D(uNoise, q / 131.0 + vec2(uTime * 0.017 + vQ.y, uTime * 0.004)).g * 0.38;
            float n2 = texture2D(uNoise, q / 47.0 + vec2(uTime * 0.03, vQ.y * 3.0)).r;
            float a = smoothstep(vQ2.x, vQ2.x + 0.34, n + 0.1 * (n2 - 0.5)) * vQ.x;
            // no sheet ever reaches a wall: each feathers out well before it (gully mist stops short of the lip)
            float dep = clamp(-vQ2.y / 205.0, 0.0, 1.0), wallZ = 136.0 - 30.0 * dep * sqrt(dep);
            a *= mix(1.0 - smoothstep(wallZ - 46.0, wallZ - 3.0, abs(vP.z)), (1.0 - smoothstep(-215.0, -158.0, vP.z)), vQ.w);
            float dc = length(cameraPosition - vP);
            a *= smoothstep(3.0, 22.0, abs(cameraPosition.y - vP.y)) * smoothstep(8.0, 60.0, dc);
            a *= mix(1.0, smoothstep(30.0, 85.0, distance(vP.xz, uSad.xy)), vQ.w);        // gully mist thins out round the col instead of cutting a line across it
            // light: the sun reaches the near side; the far wall's shadow and the net's shadow are blue
            float under = (1.0 - vQ.w) * exp(-dot(vP.xz, vP.xz) / 22000.0);
            float lit = mix((1.0 - smoothstep(uMistSun - 45.0, uMistSun + 45.0, vP.z)) * (1.0 - 0.55 * under), 1.0, vQ.w) * cloudSun(vP.xz);
            vec3 shade = uFill * (0.62 + 0.3 * n) + uHorizon * 0.2, sun = uHorizon * 0.62 + vec3(0.2, 0.2, 0.21) + uKey * (0.1 + 0.16 * n2);
            vec3 col = mix(shade, sun, lit);
            col += uAmber * uKey * under * (0.05 + 0.1 * n2);             // the net stains the mist under it
            // under the net the mist is not empty: the strands' shadows lie across it as soft blue bands, and where a drip
            // lands a pale ring opens slowly and fades (one to a 64 m cell, each on its own clock)
            float top = (1.0 - vQ.w) * vQ2.z * (1.0 - smoothstep(170.0, 260.0, abs(vP.x)));
            float band = smoothstep(0.55, 0.95, sin(vP.x * 0.047 + 1.4 * sin(vP.x * 0.012 + 1.0) + vP.z * 0.016));
            float band2 = smoothstep(0.7, 0.98, sin(vP.x * 0.031 - vP.z * 0.052 + 1.1 * sin(vP.z * 0.017) + 2.0));
            col = mix(col, shade * 0.74, max(band, band2 * 0.8) * 0.5 * top * (0.4 + 0.6 * lit));
            vec2 rq = vec2(0.8 * vP.x - 0.6 * vP.z, 0.6 * vP.x + 0.8 * vP.z);
            vec2 rc = floor(rq / 58.0), rf = rq - (rc + 0.5) * 58.0;
            float rh = fract(sin(dot(rc, vec2(127.1, 311.7))) * 43758.5453), rh2 = fract(rh * 57.31);
            float ph = fract(uTime * (0.07 + 0.05 * rh2) + rh), rr = length(rf - (vec2(rh, fract(rh * 113.7)) - 0.5) * 18.0), rad = 2.0 + 17.0 * ph;
            float ring = exp(-(rr - rad) * (rr - rad) / (1.6 + 5.0 * ph)) * (1.0 - ph) * (1.0 - ph) * step(0.3, rh2) + 0.6 * exp(-rr * rr / 6.0) * (1.0 - smoothstep(0.0, 0.25, ph)) * step(0.3, rh2);
            col += (uHorizon * 0.8 + uAmber * uKey * 0.4) * ring * top;
            // and the sun that came through the glass lies on the mist as a pool of gold light, crawling with bright threads
            vec2 pc = vP.xz + uSun.xz * 40.0;
            float pool = exp(-(pc.x * pc.x / 22000.0 + pc.y * pc.y / 9000.0)) * top;
            float c1 = sin(pc.x * 0.19 + 1.3 * sin(pc.y * 0.12 + uTime * 0.21)) * sin(pc.y * 0.17 + 1.1 * sin(pc.x * 0.1 - uTime * 0.17));
            float c2 = sin(pc.x * 0.083 - pc.y * 0.11 + 1.7 * sin(pc.x * 0.05 + uTime * 0.13));
            float thr = (1.0 - smoothstep(0.02, 0.24, abs(c1))) * (0.55 + 0.45 * c2);
            col = mix(col, col * vec3(1.1, 0.84, 0.46) * (0.9 + 0.5 * thr) + uAmber * uKey * (0.08 + 0.6 * thr), pool * (0.5 + 0.5 * thr) * (0.5 + 0.5 * lit));
            a = max(a, (0.42 + 0.5 * thr) * pool * (1.0 - smoothstep(wallZ - 46.0, wallZ - 3.0, abs(vP.z))) * smoothstep(8.0, 60.0, dc));
            a = max(a, ring * top * 0.85 * (1.0 - smoothstep(wallZ - 46.0, wallZ - 3.0, abs(vP.z))) * smoothstep(8.0, 60.0, dc));
            // K8: the new banks (vK.x = 1 on their vertices, 0 on every sheet of live's): live's cool white and shade blue
            // as computed above, WITHOUT the amber of the net (the stain term is left out for them: no new amber light in
            // the gorge), and a strength of their own from the bank field, which takes none of the fades above: not the
            // feather before the walls (they reach the stone) and nothing of the camera's place.
            // A bank's edge is billowed by live's own two noises of this sheet (n, n2, on the sheet's drawn phase), so the
            // sheets of one bank differ and slide past each other; the lowest sheet keeps a quarter of its strength in
            // the hollows; the sun reaches a bank's top and a fifth of it reaches the lowest sheet.
            { float aK = vQ.x * mix(smoothstep(vQ2.x, vQ2.x + 0.1, gorgeBank(vP.xz) + 0.3 * (n - 0.5) + 0.1 * (n2 - 0.5)), 1.0, 0.25 * smoothstep(0.5, 1.0, vK.y));
              col = mix(col, mix(shade, sun, lit * (1.0 - 0.8 * vK.y)), vK.x);
              a = mix(a, aK, vK.x); }
            gl_FragColor = vec4(col, a);
            #include <fog_fragment>
          }`,
      }));
      mist.renderOrder = 3;
      scene.add(mist);
    }
    await ctx.yield();

    // ---- the rare event: a great reservoir hanging from a strand ahead of the camera lets go at u 0.85, falls slowly
    // through the middle of the picture into the mist on a stretching thread, and the net above it springs up ----
    const rareTop = new THREE.Vector3(), rarePos = new THREE.Vector3();
    {
      const q = path.pointAt(0.85), tg = path.tangentAt(0.85), SS = A.strandSamples || [];
      let bs = 1e9; rareTop.set(q.x + tg.x * 75 + tg.z * 6, q.y + 20, q.z + tg.z * 75 - tg.x * 6);
      for (let i = 0; i < SS.length; i++) {
        const c = SS[i].p, dx = c.x - q.x, dz = c.z - q.z, fwd = dx * tg.x + dz * tg.z, lat = dx * tg.z - dz * tg.x, up = c.y - SS[i].r - q.y;
        if (fwd < 52 || fwd > 105 || Math.abs(lat) > 24 || up < 8 || up > 36) continue;
        if (path.nearestXZ(c.x, c.z).dist < 17 || Math.hypot(c.x - A.knot.x, c.z - A.knot.z) < 42 || c.distanceTo(seat) < 28) continue;
        let ok = true;
        for (const r of A.reservoirs) if (Math.hypot(c.x - r.x, c.z - r.z) < 11) { ok = false; break; }
        for (let j = 0; j < SS.length && ok; j++) { const o = SS[j].p; if (o.y < c.y - 4 && Math.hypot(o.x - c.x, o.z - c.z) < 6 + SS[j].r) ok = false; }
        const score = Math.abs(lat - 4) + 0.3 * Math.abs(fwd - 78) + 0.5 * Math.abs(up - 22);
        if (ok && score < bs) { bs = score; rareTop.set(c.x, c.y - SS[i].r, c.z); }
        if (i % 60 === 59) await ctx.yield();
      }
      const prof = [];
      for (let k = 0; k <= 18; k++) { const t = k / 18; prof.push(new THREE.Vector2(Math.max(4.1 * Math.pow(Math.sin(Math.PI * Math.pow(t, 1.7)), 0.8), 0.001) + 0.28 * (1 - t), -20 * t)); }
      const dg = new THREE.LatheGeometry(prof, 22), thg = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true); thg.translate(0, 0.5, 0);
      // the same honey glass as every teardrop of the hero (its shading code, its uniforms): a clear gold body with the
      // gorge seen through it, grains and motes turning inside, a bright far edge
      const rareU = { ...FOGU(), ...U };
      const dmat = (thread) => new THREE.ShaderMaterial({
        fog: true, uniforms: rareU,
        vertexShader: /* glsl */`
          varying vec3 vN, vP, vO;
          #include <fog_pars_vertex>
          void main(){ vO = position; vN = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
            vFogDepth *= 0.55;
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vN, vP, vO; uniform vec3 uGrain; uniform float uTime;
          #include <fog_pars_fragment>
          ${hero.veinKit.glsl}
          void main(){
            vec3 N = normalize(vN), V = normalize(cameraPosition - vP);
            float ndv, back; gP = vP; gGl = 1.0;
            vec3 col = honey(N, V, ${thread ? '0.5' : '4.0'}, ndv, back);
            ${thread ? '' : `
            float zz = abs(vO.z) < 1e-4 ? 1e-4 : vO.z, ang = atan(vO.x, zz) / 6.2832, turn = uTime * 2.2, cell = 1.0;
            float fw = (fwidth(vO.y) + fwidth(vO.x)) / cell, keep = 1.0 - smoothstep(0.3, 0.8, fw);
            float g1 = grainLayer(vec2(vO.y / cell + 3.1 + turn * 0.01, (ang + turn * 0.0045) * 26.0), 26.0, 0.8, 0.8);
            float g2 = grainLayer(vec2(vO.y / (cell * 1.6) + 7.0, (ang - turn * 0.003 + 0.37) * 17.0), 17.0, 0.8, 0.9);
            float g3 = grainLayer(vec2(vO.y / cell * 2.0 + 13.0 - turn * 0.016, (ang + turn * 0.007 + 0.61) * 52.0), 52.0, 0.5, 0.7) * (1.0 - smoothstep(0.12, 0.3, fw));
            g1 = mix(0.06, g1, keep); g2 = mix(0.06, g2, keep);
            vec3 gcol = uGrain * (0.3 + 0.5 * back);
            col = mix(col, gcol + col * 0.4, g2 * 0.3);
            col = mix(col, gcol * 0.8 + col * 0.25, g1 * 0.5);
            float band = 0.5 + 0.5 * sin(ang * 37.7 + vO.y / cell * 0.8 + turn * 0.012);
            col += (col * 0.7 + uSunCol * vec3(0.4, 0.26, 0.06)) * g3 * band * band * band * smoothstep(0.15, 0.5, ndv) * (0.4 + 0.5 * back * back);
            { float xe = 1.0 - ndv, aw = smoothstep(0.15, 0.85, -dot(N, uSun)); col += (col * 0.9 + uLemon * 0.3) * aw * xe * xe * (1.0 - xe * xe * xe); }`}
            col = skin(col, N, V, ndv, 1.0);
            gl_FragColor = vec4(col, 1.0);
            #include <fog_fragment>
          }`,
      });
      const drop = new THREE.Mesh(dg, dmat(false)), thread = new THREE.Mesh(thg, dmat(true));
      drop.visible = thread.visible = rare; drop.frustumCulled = thread.frustumCulled = false;
      scene.add(drop, thread);
      rarePos.copy(rareTop).y -= 12;
      if (rare) {
        U.uRareP.value.copy(rareTop);
        updaters.push((dt, time, camera, u) => {
          const t = Math.max(u - 0.822, 0) * DURATION, fall = Math.min(3.0 * t * t, 260), snap = smoothstep(1.9, 2.3, t);
          const sw = 1 + 0.07 * Math.sin(time * 0.9) + 0.3 * smoothstep(0.7, 0.822, u), st = 1 + 0.16 * smoothstep(0, 1.0, t) - 0.12 * snap;
          drop.position.set(rareTop.x + Math.sin(time * 0.45) * (t > 0 ? 0.2 : 0.8), rareTop.y - 1.5 - fall, rareTop.z);
          drop.scale.set(sw / Math.sqrt(st), st, sw / Math.sqrt(st));
          rarePos.set(rareTop.x, rareTop.y - 12 - fall, rareTop.z);
          const len = Math.max((1.8 + fall) * (1 - snap), 0.01), th = lerp(0.7, 0.14, smoothstep(0, 30, fall)) * (1 - snap);
          thread.position.set(drop.position.x, rareTop.y - len + 0.3, rareTop.z); thread.scale.set(Math.max(th, 0.001), len, Math.max(th, 0.001));
          // the strand it hung from, relieved of the weight, springs up and rings down
          U.uRareA.value = t > 0 ? 6 * Math.exp(-0.45 * t) * Math.sin(Math.min(t, 0.6) / 0.6 * Math.PI / 2) * Math.cos(2.0 * Math.max(t - 0.6, 0)) : -1.5 * smoothstep(0.7, 0.822, u);
        });
      }
    }
    await ctx.yield();
    // ---- the way out shows from far off: a soft pale halo round the ring, gone by the time the collar can be read ----
    {
      const hm = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uSeat: { value: seat.clone() } },
        vertexShader: /* glsl */`
          varying vec2 vQ; varying float vFar, vWheel; uniform vec3 uSeat;
          void main(){ vQ = position.xy * 2.0; vec4 wp = modelMatrix * vec4(position, 1.0); float dS = distance(cameraPosition, uSeat); vFar = smoothstep(80.0, 190.0, dS); vWheel = smoothstep(120.0, 205.0, dS); gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`
          varying vec2 vQ; varying float vFar, vWheel;
          void main(){
            float dw = length(vQ), d = dw * 1.615, g = 1.0 - smoothstep(0.0, 1.0, d);
            float ring = exp(-(d - 0.27) * (d - 0.27) * 150.0);
            // from far off it is a pale wheel: a soft disc out to 21 m with a brighter rim and a dozen faint spokes, so the
            // way out reads at a tenth of the frame from the lip; it draws in to the ring as the camera comes
            float rw = 0.2 + 0.3 * vWheel, disc = 1.0 - smoothstep(rw - 0.12, rw, dw), rim = exp(-(dw - rw) * (dw - rw) * 900.0);
            float sp = 0.5 + 0.5 * cos(atan(vQ.y, vQ.x + 0.00001) * 12.0); sp *= sp; sp *= sp;
            float wheel = disc * (0.2 + 0.16 * sp * smoothstep(0.14, 0.3, dw)) + 0.42 * rim + 0.12 * exp(-(dw - rw) * (dw - rw) * 60.0);
            gl_FragColor = vec4(vec3(0.8, 0.92, 1.0) * ((g * g * 0.7 + g * 0.2 + ring * 0.5) * vFar + wheel * vWheel), 1.0);
          }`,
      });
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), hm);
      halo.position.copy(seat).addScaledVector(exitDir, -0.6); halo.scale.setScalar(84);
      halo.lookAt(seat.x - exitDir.x * 50, seat.y, seat.z - exitDir.z * 50);
      halo.renderOrder = 4;
      scene.add(halo);
      // its glare: from the lip the way out is a bright thing seen through a thicket, and its light spills over the strands
      // in front of it (a soft bloom only, no edge, drawn over them; gone with the wheel as the camera comes near)
      const gm = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: hm.uniforms, vertexShader: hm.vertexShader,
        fragmentShader: /* glsl */`
          varying vec2 vQ; varying float vFar, vWheel;
          void main(){ float d2 = dot(vQ, vQ); gl_FragColor = vec4(vec3(0.8, 0.92, 1.0) * (vWheel * (0.2 * exp(-d2 * 4.5) + 0.16 * exp(-d2 * 30.0))), 1.0); }`,
      });
      const glare = new THREE.Mesh(halo.geometry, gm);
      glare.position.copy(halo.position); glare.quaternion.copy(halo.quaternion); glare.scale.copy(halo.scale); glare.renderOrder = 5;
      scene.add(glare);
    }
    await ctx.yield();
    // @@MORE

    // ---- sky: clear morning, small warm sun ahead-left, a dozen flat cumulus, thin high streaks ----
    const sky = makeSky({
      rng: rng.fork('sky'), preset: 'day', zenith: HOUR.zenith, horizon: HOUR.horizon, ground: fogCol, fogColor: fogCol,
      sunDirection: sunDir, sunColor: HOUR.key, sunSize: 1.1, sunIntensity: 11, sunGlow: hourI === 1 ? 1.0 : 0.75,
      scatterColor: HOUR.band, scatter: hourI === 1 ? 0.6 : 0.36, scatterPow: 4, scatterHigh: 0.1,
      clouds: { coverage: wet ? 0.46 : 0.3, softness: 0.22, scale: 1.25, opacity: 0.9, wind: [0.042, 0.011], lit: hourI === 1 ? '#FFE3CF' : '#F8F4EC', shade: '#8FA3C6' },
      clouds2: { coverage: 0.42, stretch: 1, opacity: 0.5, scale: 0.8 },
    });
    scene.add(sky.object);
    await ctx.yield();

    const uDrip = A.heroDrip ? path.nearestXZ(A.heroDrip.x, A.heroDrip.z).u - 50 / path.length : 0.86;
    const seg = [1.13, 1.08, 1.5, 0.8, 0.7, 1.2, 0.95], cuts = [0.19, 0.33, 0.43, 0.55, 0.7, 0.82];
    const pace = (u) => { let v = seg[0]; for (let k = 0; k < cuts.length; k++) v = lerp(v, seg[k + 1], smoothstep(cuts[k] - 0.035, cuts[k] + 0.035, u)); return lerp(v, 0.95, smoothstep(0.88, 0.93, u)); };
    // the look-target keeps the height it had when the saddle was a 21 m ridge, so the gaze is exactly as it was
    const sadAim = new THREE.Vector3(sad.x, groundRaw(sad.x, sad.z) - saddleH(sad.x, sad.z) + 21 * (1 + 0.08 * noise.n2(sad.x * 0.07, sad.z * 0.07) + 0.09 * Math.sin(1.3 * Math.sin(0.7))) - 9, sad.z);
    // one slow look at the growing front: the bare tower the feelers reach for, held from the ridge until it is abeam
    const frontAim = feelSlot ? new THREE.Vector3(feelSlot.x, ground(feelSlot.x, feelSlot.z) + 18, feelSlot.z) : new THREE.Vector3(feelAim.x, 24, feelAim.z);
    const P2 = period * 2;
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration: DURATION, pace,
      camera: { fov: 62, near: 0.5, far: 5000, lookAhead: 26, sway: 0.8, bank: 0.9 },
      pois: [
        { at: new THREE.Vector3(20, 25, -150), from: 0.0, to: 0.14, weight: 0.45 },
        { at: sadAim, from: 0.09, to: 0.215, weight: 0.42, fade: 0.5 },           // the saddle and its climbing vein, on the right
        { at: armMid, from: 0.185, to: 0.285, weight: 0.4 },
        { at: new THREE.Vector3(F.x - 25, -5, F.z - 235), from: 0.272, to: 0.44, weight: 0.7 },
        { at: frontAim, from: 0.35, to: 0.58, weight: 0.5, fade: 0.5 },
        { at: new THREE.Vector3(0, -28, 0), from: 0.74, to: 1.0, weight: 0.4, fade: 0.15 },             // one steady pull to the Knot, no hand-over
        ...(rare ? [{ at: () => rarePos, from: 0.78, to: 0.92, weight: 0.3, fade: 0.5 }] : []),
      ],
      portal: { shape: 'circle', radius: 7, color: '#DDF2FF', glow: 1, revealDistance: 600 },
      post: {
        exposure: HOUR.exposure,
        bloom: { strength: 0.3, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.06, contrast: 1.05, tint: '#ffffff', shadowTint: '#0a1020', vignette: 0.26, grain: 0.02 },
      },
      ride: 'none',
      update(dt, time, camera, u) {
        W.uTime.value = time;
        hero.update(dt, time, camera);
        hero.setProgress(0.86 + (u - uDrip));
        // the one pulse: its displacement for the world's own shaders, and how far the growing edge has crept
        W.uPulse.value = hero.pulse(time);
        const cyc = Math.floor(time / P2), ph = (time - cyc * P2) / period * Math.PI, half = 0.5 * period / Math.PI;
        const part = ph < Math.PI * 0.5 ? Math.sin(ph) : ph < Math.PI * 1.5 ? 1 : 2 + Math.sin(ph);
        W.uCreep.value.set(Math.min((cyc * 2 + part) * half, 45), (time - cyc * P2) / P2);
        W.uCloud.value.set(time * 16, time * 5);
        // beat B: one branch starves to a thread while its neighbour fattens
        const sw = smoothstep(0.195, 0.268, u);
        W.uStarve.value = sw;
        U.uBranch.value.set(lerp(1, 0.1, sw), lerp(1, 2.6, sw), 5 + (feelLen + 10) * smoothstep(0.34, 0.53, u), 0);
        sky.update(dt, time, camera);
        for (const f of updaters) f(dt, time, camera, u);
      },
      dispose() { for (const d of disposables) d.dispose(); },
    };
  },
};
