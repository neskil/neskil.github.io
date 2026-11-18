// THE COUNTRY WITH NO UP: the town plan, worked out on the CPU once per seed.
//   roads    the avenue, the spokes from the hall's court, wobbling ring roads round the hall that go round the landing
//            ground, short radial streets between rings, barracks arcs north of the field: a radial town, never a grid
//   lanes    every way a figure can walk is a CLOSED loop (out along one side of a road, round, back along the other),
//            resampled evenly and written as one row of a float texture; the vertex shader reads a figure's place from
//            its row, its phase and the clock, so nobody is moved on the CPU and nobody ever pops at a road's end
//   houses   pentagons, every roof apex north, set in rows along the roads by rejection on a 4 m grid
//   people   per-instance lane, phase, speed, class and company (sons behind, a needle beside, attendants circling)
// No THREE here: plain typed arrays, so the plan can be checked by itself.
import { HALL, FIELD } from './country-with-no-up-glsl.js';

const TAU = Math.PI * 2;
const G = 4, GN = 660, G0 = -1320;                 // the grid: 4 m cells over 2640 m
const PENT = [0, 1, 2, 3, 4].map((j) => [Math.sin(j * TAU / 5), Math.cos(j * TAU / 5)]);     // local x east, y north; vertex 0 is the roof apex

// ---------------------------------------------------------------- polylines ([x, z] pairs)
const plen = (p, closed) => { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (closed) L += Math.hypot(p[0][0] - p[p.length - 1][0], p[0][1] - p[p.length - 1][1]); return L; };
// n points evenly spaced by arc length (a closed line does not repeat its first point)
function resample(p, n, closed) {
  const q = closed ? [...p, p[0]] : p, cum = [0];
  for (let i = 1; i < q.length; i++) cum.push(cum[i - 1] + Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]));
  const L = cum[cum.length - 1], out = []; let k = 0;
  for (let i = 0; i < n; i++) {
    const s = closed ? (i / n) * L : (i / (n - 1)) * L;
    while (k < q.length - 2 && cum[k + 1] < s) k++;
    const f = (s - cum[k]) / Math.max(1e-6, cum[k + 1] - cum[k]);
    out.push([q[k][0] + (q[k + 1][0] - q[k][0]) * f, q[k][1] + (q[k + 1][1] - q[k][1]) * f]);
  }
  return out;
}
// unit tangent at point i
function tangent(p, i, closed) {
  const n = p.length, a = closed ? p[(i - 1 + n) % n] : p[Math.max(0, i - 1)], b = closed ? p[(i + 1) % n] : p[Math.min(n - 1, i + 1)];
  const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l];
}
// a closed loop round an open line: out along its right side, a half turn, back along its left side, a half turn
function racetrack(p, sep) {
  const h = sep / 2, out = [], n = p.length;
  for (let i = 0; i < n; i++) { const t = tangent(p, i, false); out.push([p[i][0] - t[1] * h, p[i][1] + t[0] * h]); }
  let t = tangent(p, n - 1, false);
  for (let k = 1; k < 6; k++) { const a = (k / 6) * Math.PI, c = Math.cos(a), s = Math.sin(a); out.push([p[n - 1][0] + (-t[1] * c + t[0] * s) * h, p[n - 1][1] + (t[0] * c + t[1] * s) * h]); }
  for (let i = n - 1; i >= 0; i--) { const tt = tangent(p, i, false); out.push([p[i][0] + tt[1] * h, p[i][1] - tt[0] * h]); }
  t = tangent(p, 0, false);
  for (let k = 1; k < 6; k++) { const a = (k / 6) * Math.PI, c = Math.cos(a), s = Math.sin(a); out.push([p[0][0] + (t[1] * c - t[0] * s) * h, p[0][1] + (-t[0] * c - t[1] * s) * h]); }
  return out;
}
const circle = (cx, cz, r, n, dir = 1) => { const o = []; for (let i = 0; i < n; i++) { const a = dir * (i / n) * TAU; o.push([cx + Math.sin(a) * r, cz + Math.cos(a) * r]); } return o; };
// a rectangle with round corners, turned by `rot`
function roundRect(cx, cz, w, h, rad, rot) {
  const o = [], c = Math.cos(rot), s = Math.sin(rot), put = (x, z) => o.push([cx + x * c - z * s, cz + x * s + z * c]);
  const corners = [[w / 2 - rad, h / 2 - rad, 0], [-w / 2 + rad, h / 2 - rad, 1], [-w / 2 + rad, -h / 2 + rad, 2], [w / 2 - rad, -h / 2 + rad, 3]];
  for (const [x, z, q] of corners) for (let k = 0; k <= 4; k++) { const a = (q + k / 4) * Math.PI / 2; put(x + Math.cos(a) * rad, z + Math.sin(a) * rad); }
  return o;
}

export async function makePlan(ctx, o) {
  // o.forks: the world's own streams, one per kind of thing (roads, houses, scatter, people, field, home)
  const K = o.forks, rng = K.roads, noise = ctx.noise, yieldNow = () => ctx.yield();
  const grid = new Uint8Array(GN * GN);            // bit 1: road or open ground, bit 2: a house
  const gi = (v) => Math.floor((v - G0) / G);
  const stamp = (x, z, r, bit) => {
    const i0 = Math.max(0, gi(x - r)), i1 = Math.min(GN - 1, gi(x + r)), j0 = Math.max(0, gi(z - r)), j1 = Math.min(GN - 1, gi(z + r)), r2 = r * r;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = G0 + (i + 0.5) * G - x, dz = G0 + (j + 0.5) * G - z; if (dx * dx + dz * dz <= r2) grid[j * GN + i] |= bit; }
  };
  const taken = (x, z) => { const i = gi(x), j = gi(z); return i < 0 || j < 0 || i >= GN || j >= GN ? 3 : grid[j * GN + i]; };
  // how full the country is at a place: 1 within 700 m of its middle, thinning to nothing by 1150 m
  const envelope = (x, z) => { const r = Math.hypot(x, z + 100), t = Math.min(1, Math.max(0, (r - 640) / 510)); return 1 - t * t * (3 - 2 * t); };
  const dHall = (x, z) => Math.hypot(x - HALL.x, z - HALL.z), dField = (x, z) => Math.hypot(x - FIELD.x, z - FIELD.z);
  // districts: 0 workmen (south and the avenue), 1 gentry (west and east of the hall, north to the field), 2 barracks (north)
  const district = (x, z) => (dField(x, z) < 400 && z < FIELD.z - 30 ? 2 : (Math.abs(x) > 95 && z > -130 && z < 420 && dHall(x, z) < 600 ? 1 : 0));

  // ---------------------------------------------------------------- roads
  const roads = [];
  const ns = o.spokes, spokeAng = [];
  for (let j = 0; j < ns; j++) {
    const phi = j * TAU / ns, straight = j === 0 || j * 2 === ns, bend = straight ? 0 : rng.range(-0.32, 0.32), rEnd = j === 0 ? 765 : rng.range(640, 940), pts = [];
    spokeAng.push(phi);
    for (let r = HALL.court + 2; r <= rEnd; r += 8) {
      const a = phi + bend * Math.pow((r - HALL.court) / 700, 1.4), x = HALL.x + Math.sin(a) * r, z = HALL.z + Math.cos(a) * r;
      if (dField(x, z) < FIELD.r + 8) break;
      pts.push([x, z]);
    }
    if (pts.length > 4) roads.push({ pts, hw: j === 0 ? 30 : 13, kind: j === 0 ? 'avenue' : 'spoke', closed: false });
  }
  const ringR = [240, 332, 452, 585, 735, 905];
  ringR.forEach((r0, k) => {
    const pts = [], n = Math.round(TAU * r0 / 9), ph = rng.range(0, 9);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, r = r0 * (1 + 0.055 * noise.fbm2(Math.sin(a) * 1.4 + k * 7.1 + ph, Math.cos(a) * 1.4 - k * 3.3, 3));
      let x = HALL.x + Math.sin(a) * r, z = HALL.z + Math.cos(a) * r;
      const d = dField(x, z), lim = FIELD.r + 19;
      if (d < lim) { x = FIELD.x + (x - FIELD.x) / Math.max(d, 1) * lim; z = FIELD.z + (z - FIELD.z) / Math.max(d, 1) * lim; }
      pts.push([x, z]);
    }
    roads.push({ pts, hw: k < 2 ? 10 : 8.5, kind: 'ring', closed: true, ring: k, r0 });
  });
  // short radial streets between one ring and the next, staggered so that no street runs on through
  for (let k = 0; k + 1 < ringR.length; k++) {
    const ra = ringR[k], rb = ringR[k + 1], n = Math.max(6, Math.round(TAU * (ra + rb) * 0.5 / rng.range(120, 150))), st = rng.range(0, TAU);
    for (let m = 0; m < n; m++) {
      const a = st + (m + rng.range(-0.18, 0.18)) * TAU / n, pts = []; let ok = true;
      if (spokeAng.some((p) => Math.abs(((a - p + Math.PI * 3) % TAU) - Math.PI) < 16 / ra)) continue;     // not on top of a spoke
      for (let r = ra + 6; r <= rb - 6; r += 8) { const x = HALL.x + Math.sin(a) * r, z = HALL.z + Math.cos(a) * r; if (dField(x, z) < FIELD.r + 24) { ok = false; break; } pts.push([x, z]); }
      if (ok && pts.length > 4) roads.push({ pts, hw: 6.5, kind: 'minor', closed: false });
    }
  }
  // barracks arcs north of the landing ground
  for (let k = 0; k < 4; k++) {
    const r = FIELD.r + 62 + k * 44, pts = [], span = 1.25 - k * 0.07;
    for (let a = -span; a <= span; a += 8 / r) pts.push([FIELD.x + Math.sin(a) * r, FIELD.z - Math.cos(a) * r]);
    roads.push({ pts, hw: 6, kind: 'barracks', closed: false });
  }
  await yieldNow();
  for (const rd of roads) for (const p of rd.pts) stamp(p[0], p[1], rd.hw, 1);
  stamp(HALL.x, HALL.z, HALL.court + 1, 1); stamp(FIELD.x, FIELD.z, FIELD.r + 24, 1);
  await yieldNow();

  // ---------------------------------------------------------------- houses
  const HMAX = 2400, hx = new Float32Array(HMAX), hz = new Float32Array(HMAX), hr = new Float32Array(HMAX), hs = new Float32Array(HMAX), hd = new Uint8Array(HMAX);
  let nh = 0;
  let hRng = K.houses;
  const sizeFor = (d, x, z) => (d === 1 ? hRng.range(17, 22.5) : d === 2 ? hRng.range(8.5, 10) : hRng.range(12, 13.4)) * (0.8 + 0.2 * envelope(x, z));
  // support of the pentagon (apex north = -z) in a direction (dx, dz): how far it reaches that way, for R = 1
  const reach = (dx, dz) => { let m = -9; for (const v of PENT) m = Math.max(m, v[0] * dx - v[1] * dz); return m; };
  const tryHouse = (x, z, R) => {
    if (nh >= HMAX || Math.abs(x) > 1290 || Math.abs(z) > 1290) return false;
    if (taken(x, z)) return false;
    for (const v of PENT) {
      if (taken(x + v[0] * R * 1.04, z - v[1] * R * 1.04) || taken(x + v[0] * R * 0.55, z - v[1] * R * 0.55)) return false;
      const w = PENT[(PENT.indexOf(v) + 1) % 5];
      if (taken(x + (v[0] + w[0]) * R * 0.52, z - (v[1] + w[1]) * R * 0.52)) return false;
    }
    hx[nh] = x; hz[nh] = z; hr[nh] = R; hs[nh] = hRng(); hd[nh] = district(x, z); nh++;
    stamp(x, z, R * 0.93 + 1.5, 2);
    return true;
  };
  const rowsFor = { avenue: 2, spoke: 2, ring: 2, minor: 1, barracks: 2 };
  for (const rd of roads) {
    const p = rd.pts, n = p.length, L = plen(p, rd.closed);
    for (let side = -1; side <= 1; side += 2) for (let row = 0; row < rowsFor[rd.kind]; row++) {
      let s = hRng.range(0, 8), k = 0, acc = 0;
      // walk the line; place a house, then step on by its own width along the road
      while (s < L - 2) {
        while (k < n - (rd.closed ? 0 : 1) - 1 && acc + Math.hypot(p[(k + 1) % n][0] - p[k][0], p[(k + 1) % n][1] - p[k][1]) < s) { acc += Math.hypot(p[(k + 1) % n][0] - p[k][0], p[(k + 1) % n][1] - p[k][1]); k++; }
        const a = p[k], b = p[(k + 1) % n], sl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, f = Math.min(1, (s - acc) / sl), tx = (b[0] - a[0]) / sl, tz = (b[1] - a[1]) / sl;
        const cx = a[0] + (b[0] - a[0]) * f, cz = a[1] + (b[1] - a[1]) * f, mx = -tz * side, mz = tx * side;
        const d = district(cx + mx * 40, cz + mz * 40), R = sizeFor(d, cx, cz), gap = d === 2 ? 1.2 : hRng.range(1.6, 3.2);
        const set = rd.hw + gap + reach(-mx, -mz) * R + row * ((reach(mx, mz) + reach(-mx, -mz)) * R + gap + 1.5);
        const x = cx + mx * set, z = cz + mz * set, env = envelope(x, z);
        if (hRng() < env * (rd.kind === 'minor' ? 0.8 : 1)) tryHouse(x, z, R);
        s += (reach(tx, tz) + reach(-tx, -tz)) * R + gap;
      }
    }
    await yieldNow();
  }
  // fill what the rows left open, in loose scatter (the insides of the blocks); a stream of its own, because how
  // much the rows drew depends on the roads
  hRng = K.scatter;
  for (let i = 0; i < 5200 && nh < HMAX; i++) {
    const a = hRng() * TAU, r = 1150 * Math.sqrt(hRng()), x = Math.sin(a) * r, z = -100 + Math.cos(a) * r;
    if (hRng() > envelope(x, z)) continue;
    tryHouse(x, z, sizeFor(district(x, z), x, z) * hRng.range(0.86, 1));
    if (i % 400 === 399) await yieldNow();
  }
  // the vermilion square's house: the roomy one nearest the place the world names (a workman's house west of the landing ground)
  let sqH = 0, sqBest = 1e9;
  for (let i = 0; i < nh; i++) { const d = Math.hypot(hx[i] - o.squareNear[0], hz[i] - o.squareNear[1]) + (hr[i] < 11.5 ? 400 : 0); if (d < sqBest) { sqBest = d; sqH = i; } }
  const sqHome = [hx[sqH], hz[sqH] + hr[sqH] * 0.04, hr[sqH]];
  // the houses beside the first stretch of the flight carry wall skirts
  const nearH = [];
  for (let i = 0; i < nh; i++) { const dz = Math.max(0, 320 - hz[i], hz[i] - 500), dd = Math.hypot(hx[i], dz); if (dd < 330 && hz[i] > 200) nearH.push([dd, i]); }
  nearH.sort((a, b) => a[0] - b[0]); const skirtHouses = nearH.slice(0, 360).map((e) => e[1]);

  // ---------------------------------------------------------------- lanes (closed loops)
  const lanes = [];
  const addLane = (pts, kind, extra = {}) => { const L = plen(pts, true), n = Math.min(256, Math.max(12, Math.ceil(L / 7))); const lane = { pts: resample(pts, n, true), n, len: L, kind, row: lanes.length, ...extra }; lanes.push(lane); return lane; };
  const cut = (p, a, b) => p.slice(a, p.length - b);
  for (const rd of roads) {
    if (rd.kind === 'avenue') {
      // men keep the west side, women the east; the middle 16 m stays empty. On the west the soldiers' files go up the
      // inside toward the hall and back down the outside, and the walkers keep between them
      const west = rd.pts.map((q) => [q[0] - 19, q[1]]), east = rd.pts.map((q) => [q[0] + 19, q[1]]);
      addLane(racetrack(west, 5), 'avW', { wob: 1.8 }); addLane(racetrack(east, 11), 'avE', { wob: 3.4 });
      addLane(racetrack(west, 16.5), 'avFile', { wob: 0 });
    } else if (rd.kind === 'spoke') { addLane(racetrack(cut(rd.pts, 1, 1), 12), 'spoke', { wob: 3 }); addLane(racetrack(cut(rd.pts, 2, 2), 5), 'spokeFile', { wob: 0 }); }
    else if (rd.kind === 'ring') {
      // nobody crosses the avenue: its middle is kept empty and its sides belong to the files. Each ring road is walked
      // from one side of the avenue all the way round to the other and back (keep right), turning at the avenue's edge.
      const P = rd.pts, n = P.length, inAve = (q) => Math.abs(q[0]) < 36 && q[1] > HALL.z, start = P.findIndex(inAve);
      if (start < 0) {
        const out = P.map((q, i) => { const t = tangent(P, i, true); return [q[0] - t[1] * 4.5, q[1] + t[0] * 4.5]; }), inn = P.map((q, i) => { const t = tangent(P, i, true); return [q[0] + t[1] * 4.5, q[1] - t[0] * 4.5]; }).reverse();
        addLane(out, 'ring', { wob: 2.4, ring: rd.ring }); addLane(inn, 'ring', { wob: 2.4, ring: rd.ring });
      } else {
        const arc = []; for (let k = 1; k <= n; k++) { const q = P[(start + k) % n]; if (!inAve(q)) arc.push(q); }
        // (a long ring is walked as two half loops so that each fits a row of the lane texture at a fine spacing)
        const half = arc.length >> 1;
        addLane(racetrack(arc.slice(0, half + 1), 9), 'ring', { wob: 2.4, ring: rd.ring }); addLane(racetrack(arc.slice(half), 9), 'ring', { wob: 2.4, ring: rd.ring });
      }
    } else if (rd.kind === 'minor') addLane(racetrack(rd.pts, 6), 'minor', { wob: 1.6 });
    else if (rd.kind === 'barracks') addLane(racetrack(cut(rd.pts, 2, 2), 6), 'barracks', { wob: 0.6 });
  }
  addLane(circle(HALL.x, HALL.z, 98, 96, 1), 'court', { wob: 5 }); addLane(circle(HALL.x, HALL.z, 118, 110, -1), 'court', { wob: 5 });
  addLane(circle(FIELD.x, FIELD.z, FIELD.r + 12, 150, 1), 'rim', { wob: 3 }); addLane(circle(FIELD.x, FIELD.z, FIELD.r + 21, 160, -1), 'rim', { wob: 3 });
  const priestLane = addLane(circle(HALL.x, HALL.z, 20.5, 40, 1), 'priests', { wob: 0 });
  // clearance: the world tests every loop against the eye's own track near the glass (a body's reach: 6.5 m and the
  // loop's wander); a loop that comes within it is left unwalked
  let shutLanes = 0;
  if (o.tooNear) for (const ln of lanes) { ln.shut = ln.pts.some((q) => o.tooNear(q[0], q[1], 6.5 + (ln.wob || 0))); if (ln.shut) shutLanes++; }
  await yieldNow();

  // ---------------------------------------------------------------- people
  const FMAX = 30000, aLane = new Float32Array(FMAX * 4), aMove = new Float32Array(FMAX * 4), aKind = new Float32Array(FMAX * 4), aOff = new Float32Array(FMAX * 4);
  let nf = 0; const pr = K.people, figLane = new Int16Array(FMAX);
  let seedOf = pr;                                   // the stream each body's own number comes from (the stream of whatever is being placed)
  // lane null: at home, (lat, along) is then the place (x, z)
  const put = (lane, phase, speed, lat, size, sides, col, aspect, flag, orbR = 0, orbW = 0, orbP = 0, along = 0) => {
    if (nf >= FMAX) return -1; const i = nf * 4;
    if (lane) { aLane[i] = lane.row; aLane[i + 1] = lane.n; aLane[i + 2] = lane.len; aLane[i + 3] = lat; figLane[nf] = lane.row; }
    else { aLane[i] = 0; aLane[i + 1] = 0; aLane[i + 2] = lat; aLane[i + 3] = along; figLane[nf] = -1; }
    aMove[i] = phase; aMove[i + 1] = speed; aMove[i + 2] = size; aMove[i + 3] = seedOf();
    aKind[i] = sides; aKind[i + 1] = col; aKind[i + 2] = aspect; aKind[i + 3] = flag;
    aOff[i] = orbR; aOff[i + 1] = orbW; aOff[i + 2] = orbP; aOff[i + 3] = lane ? along : 0;
    return nf++;
  };
  const V = () => pr.range(0.82, 1.2);
  const woman = (lane, ph, lat, sp = 3.2 * V(), along = 0, a = 0, b = 0, c = 0) => put(lane, ph, sp, lat, pr.range(4.6, 5.3), 2, 3, 0, 0, a, b, c, along);
  const soldier = (lane, ph, lat, sp, along = 0) => put(lane, ph, sp, lat, 7, 3, 0, 0.23, 1, 0, 0, 0, along);
  const workman = (lane, ph, lat, sp = 3.6 * V()) => put(lane, ph, sp, lat, pr.range(5.4, 6.4), 3, 0, pr.range(0.44, 0.56), 0);
  const gentleman = (lane, ph, lat, wives) => {
    const sp = 2.6 * V(), sides = pr.chance(0.6) ? 4 : 5, size = sides === 4 ? 5.5 : 6.4;
    put(lane, ph, sp, lat, size, sides, 1, 0, 0);
    if (wives) { if (pr.chance(0.6)) woman(lane, ph, lat + 4.4, sp, pr.range(-1, 1)); if (pr.chance(0.22)) woman(lane, ph, lat - 4.4, sp, pr.range(-1, 1)); }
    const sons = pr.chance(0.5) ? (pr.chance(0.4) ? 2 : 1) : 0;
    for (let k = 0; k < sons; k++) put(lane, ph, sp, lat + pr.range(-0.8, 0.8), size * 0.5, sides, 1, 0, 0, 0, 0, 0, -(5 + k * 3.6));
  };
  const noble = (lane, ph, lat) => {
    const sp = 2.0 * V(), sides = pr.int(6, 12), size = 5.6 + sides * 0.28, w = pr.sign() * pr.range(0.5, 0.8), p0 = pr.range(0, TAU);
    put(lane, ph, sp, lat, size, sides, 5, 0, 0);
    for (let k = 0; k < 4; k++) put(lane, ph, sp, lat, 3.4, 3, 0, 0.5, 2, size * 0.5 + 3.4, w, p0 + k * TAU / 4);
  };
  const priest = (lane, ph, lat, sp = 1.4 * V()) => put(lane, ph, sp, lat, 10, 14, 4, 0, 0);
  // A block of soldiers. Every man is his own narrow triangle (7 m by 1.6 m) with dark glass round him: 3.3 m from file
  // to file, 9.6 m from one man's point to the next man's. The block has square corners and never bends: all its men
  // march out and back along the block's own heading as one body (`amp` metres, turning about at each end). Left out
  // whole if any man's beat would come within a body's reach of the eye's track near the glass.
  const block = (cx, cz, th, abreast, deep, amp, ph, sp = 3.6) => {
    const c = Math.cos(th), sn = Math.sin(th), men = [];
    for (let r = 0; r < deep; r++) for (let a = 0; a < abreast; a++) { const u = (r - (deep - 1) / 2) * 9.6, v = (a - (abreast - 1) / 2) * 3.3; men.push([cx + u * c - v * sn, cz + u * sn + v * c]); }
    if (o.tooNear && men.some((m) => [-0.5, 0, 0.5].some((k) => o.tooNear(m[0] + k * amp * c, m[1] + k * amp * sn, 7.5)))) return 0;
    for (const m of men) put(null, 0, sp, m[0], 7, 3, 0, 0.23, 3, amp, th, ph, m[1]);
    return men.length;
  };
  const headingAt = (ln, i) => { const a = ln.pts[(i - 1 + ln.n) % ln.n], b = ln.pts[(i + 1) % ln.n]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
  const br = K.blocks;
  const MIX = { avW: [0, 0.8, 0.19, 0, 0.01], avE: [1, 0, 0, 0, 0], court: [0.25, 0.3, 0.27, 0.11, 0.07], d0: [0.3, 0.56, 0.11, 0.02, 0.01], d1: [0.3, 0.13, 0.44, 0.1, 0.03], d2: [0.12, 0.8, 0.06, 0.01, 0.01] };
  const PERM = { avW: 0.3, avE: 0.34, spoke: 0.3, ring: 0.2, minor: 0.14, court: 0.55, rim: 0.4, barracks: 0.2 };
  let weight = 0; for (const ln of lanes) if (PERM[ln.kind] && !ln.shut) { const m = ln.pts[0], q = ln.pts[ln.n >> 1]; ln.w = ln.len * PERM[ln.kind] * (0.15 + 0.85 * Math.max(envelope(m[0], m[1]), envelope(q[0], q[1]))); weight += ln.w; }
  const scale = (14500 * o.crowd * 0.62) / Math.max(1, weight);      // the rest are files, company, the field and the hall
  for (const ln of lanes) {
    if (ln.shut) continue;
    if (ln.kind === 'avFile') continue;               // (the avenue's soldiers stand in blocks, below)
    if (ln.kind === 'spokeFile') {
      if (ln.len > 300) { seedOf = br; const i = Math.floor(ln.n * br.range(0.12, 0.3)); block(ln.pts[i][0], ln.pts[i][1], headingAt(ln, i), 2, 6, 36, br(), 4.2); seedOf = pr; }
      continue;
    }
    if (ln.kind === 'priests') { const p0 = pr(); for (let k = 0; k < 12; k++) priest(ln, k / 12 + p0, 0, 1.3); continue; }
    if (ln.kind === 'barracks') { seedOf = br; for (let k = 0; k < 2; k++) { const i = Math.floor(ln.n * (0.1 + 0.25 * k + br.range(0, 0.08))); block(ln.pts[i][0], ln.pts[i][1], headingAt(ln, i), 2, 4, 22, br(), 4.2); } seedOf = pr; }
    const count = Math.round(ln.w * scale);
    for (let k = 0; k < count; k++) {
      const ph = pr(), lat = pr.range(-ln.wob, ln.wob), at = ln.pts[Math.floor(ph * ln.n) % ln.n];
      if (pr() > 0.2 + 0.8 * envelope(at[0], at[1])) continue;
      const d = district(at[0], at[1]), mix = MIX[ln.kind] || MIX['d' + d]; let r = pr(), c = 0; while (c < 4 && r > mix[c]) { r -= mix[c]; c++; }
      if (c === 0) woman(ln, ph, lat); else if (c === 1) { if (d === 2 && pr.chance(0.55)) soldier(ln, ph, lat, 4.2 * V()); else workman(ln, ph, lat); }
      else if (c === 2) gentleman(ln, ph, lat, ln.kind !== 'avW'); else if (c === 3) noble(ln, ph, lat); else priest(ln, ph, lat);
    }
    if (ln.row % 8 === 7) await yieldNow();
  }
  await yieldNow();
  // the avenue's soldiers: blocks in two columns on its west side, marching toward the hall and back
  seedOf = br;
  for (let z = HALL.z + 200; z < HALL.z + 740; z += 150) { block(-11.5, z + br.range(-12, 12), -Math.PI / 2, 3, 6, 46, br(), 4.5); block(-28, z + 75 + br.range(-12, 12), -Math.PI / 2, 3, 6, 46, br(), 4.5); }
  // and more people beside its empty middle, alive from the first metre: women on the east, workmen and a few
  // gentlemen on the west, on the avenue's own loops
  const ar = K.avenue; seedOf = ar;
  for (const ln of lanes) {
    if (ln.shut || (ln.kind !== 'avW' && ln.kind !== 'avE')) continue;
    for (let k = 0; k < 150; k++) {
      const ph = ar(), lat = ar.range(-ln.wob, ln.wob), c = ar();
      if (ln.kind === 'avE') put(ln, ph, 3.2 * ar.range(0.82, 1.2), lat, ar.range(4.6, 5.3), 2, 3, 0, 0);
      else if (c < 0.8) put(ln, ph, 3.6 * ar.range(0.82, 1.2), lat, ar.range(5.4, 6.4), 3, 0, ar.range(0.44, 0.56), 0);
      else put(ln, ph, 2.6 * ar.range(0.82, 1.2), lat, 5.5, 4, 1, 0, 0);
    }
  }
  seedOf = pr;
  await yieldNow();
  // the landing ground: drill squares, a market crowd, or a procession of priests
  const fr = K.field; seedOf = fr;
  // a knot of people standing about a place (they shift a little where they stand): n bodies within rad metres
  const knot = (cx, cz, n, rad) => {
    for (let k = 0; k < n; k++) {
      const rr = rad * Math.sqrt(fr()), aa = fr() * TAU, x = cx + Math.sin(aa) * rr, z = cz + Math.cos(aa) * rr, c = fr();
      const w = [fr.range(1.5, 5), fr.sign() * fr.range(0.25, 0.7), fr() * TAU];
      if (c < 0.3) put(null, 0, 0, x, fr.range(4.6, 5.3), 2, 3, 0, 0, ...w, z); else if (c < 0.72) put(null, 0, 0, x, fr.range(5.4, 6.4), 3, 0, 0.5, 0, ...w, z);
      else if (c < 0.94) put(null, 0, 0, x, 5.6, fr.chance(0.6) ? 4 : 5, 1, 0, 0, ...w, z); else put(null, 0, 0, x, 7.5, fr.int(6, 10), 5, 0, 0, ...w, z);
    }
  };
  if (o.field === 'drill') {
    // regiments drawn up across the field in staggered rows: square-cornered blocks of five files, clear lanes of
    // dark glass between block and block, every row marching out and back against its neighbour rows
    const th = fr.range(0, Math.PI), ct = Math.cos(th), st = Math.sin(th), p0 = fr();
    for (let j = -4; j <= 4; j++) for (let i = -2; i <= 2; i++) {
      const a = (i + (j & 1 ? 0.5 : 0)) * 66 + fr.range(-3, 3), b = j * 30 + fr.range(-1.5, 1.5);
      if (Math.hypot(a, b) > 126) continue;
      block(FIELD.x + a * ct - b * st, FIELD.z + a * st + b * ct, th, 5, 5, 14, p0 + (j & 1 ? 0.5 : 0), 3.6);
    }
  } else if (o.field === 'market') {
    for (let s = 0; s < 26; s++) { const r = 128 * Math.sqrt(fr()), a = fr() * TAU; knot(FIELD.x + Math.sin(a) * r, FIELD.z + Math.cos(a) * r, fr.int(26, 54), 15); }
  } else {
    // a procession winding across the field in a long S and back: priests, each with four attendants circling him,
    // two soldiers behind him and three gentlemen after them; and the town come out to see it, in knots along both
    // sides of the way and in the bays of the S
    const th = fr.range(0, Math.PI), ct = Math.cos(th), st = Math.sin(th), wind = [];
    for (let s = -118; s <= 118; s += 6) { const b = 62 * Math.sin(s / 118 * Math.PI * 1.15); if (Math.hypot(s, b) < 124) wind.push([FIELD.x + s * ct - b * st, FIELD.z + s * st + b * ct]); }
    const la = addLane(racetrack(wind, 20), 'proc'), p0 = fr(), n = 12;
    for (let k = 0; k < n; k++) {
      const ph = k / n + p0, r0 = fr() * TAU; priest(la, ph, 0, 1.5);      // r0: where this priest's retinue stands in its round
      for (let q = 0; q < 4; q++) put(la, ph, 1.5, 0, 3.4, 3, 0, 0.5, 2, 8.6, 0.55, r0 + q * TAU / 4);
      for (const lat of [-3, 3]) put(la, ph, 1.5, lat, 7, 3, 0, 0.23, 0, 0, 0, 0, -17);
      for (let q = 0; q < 3; q++) put(la, ph, 1.5, fr.range(-2.5, 2.5), 5.6, fr.chance(0.6) ? 4 : 5, 1, 0, 0, 0, 0, 0, -27 - 8 * q);
    }
    for (let k = 2; k < wind.length - 2; k += 2) {
      const t = tangent(wind, k, false);
      for (const side of [-1, 1]) { const off = side * fr.range(27, 44), x = wind[k][0] - t[1] * off, z = wind[k][1] + t[0] * off; if (dField(x, z) < 136) knot(x, z, fr.int(9, 17), 9); }
    }
  }
  seedOf = pr;
  await yieldNow();
  // at home: a needle and one or two small polygons in every house, moving a little (more of the family at night)
  const hm = K.home;
  for (let i = 0; i < nh; i++) {
    const R = hr[i], n = i === sqH ? 4 : 2 + (hm() < o.home ? 1 : 0) + (hm() < o.home - 1 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const a = hm() * TAU, rr = R * 0.42 * Math.sqrt(hm()), x = hx[i] + Math.sin(a) * rr, z = hz[i] + Math.cos(a) * rr + R * 0.05, w = [hm.range(0.9, 2.0), hm.sign() * hm.range(0.25, 0.6), hm() * TAU];
      // (the vermilion square's family stand round it where the draws put them, 0.45 R and more from the room's
      // middle, and move a little about their places like every family at home)
      if (i === sqH) { const fr2 = 0.45 * R + 0.3 * rr; put(null, 0, 0, hx[i] + Math.sin(a) * fr2, k === 0 ? 5 : k === 1 ? 3.2 : 2.6, k === 0 ? 2 : k === 3 ? 5 : 4, k === 0 ? 3 : 1, 0, 0, 0.4 * w[0], w[1], Math.PI / 2 - a, hz[i] + Math.cos(a) * fr2); continue; }
      if (k === 0) put(null, 0, 0, x, Math.min(5, R * 0.36), 2, 3, 0, 0, ...w, z);
      else if (k === 3 || hd[i] !== 1) put(null, 0, 0, x, k === 3 ? 5.6 : hm.range(2.6, 3.4), 3, 0, 0.5, 0, ...w, z);
      else put(null, 0, 0, x, k === 2 && hm() < 0.4 ? 5.6 : hm.range(2.4, 3.2), hm.chance(0.6) ? 4 : 5, 1, 0, 0, ...w, z);
    }
    if (i % 300 === 299) await yieldNow();
  }
  // who carries a wall skirt: whoever walks beside the first stretch of the flight during its first minute (the
  // world's clock starts at o.clock0)
  const sk = [];
  for (let i = 0; i < nf; i++) {
    const row = figLane[i]; let best = 1e9;
    if (row < 0) {                                   // a soldier in a block: where he is drawn up
      if (aKind[i * 4 + 3] !== 3) continue;
      const dz = Math.max(0, 255 - aLane[i * 4 + 3], aLane[i * 4 + 3] - 530); best = Math.hypot(aLane[i * 4 + 2], dz * 1.5);
    }
    const ln = lanes[Math.max(row, 0)];
    for (let t = 0; t <= 60 && row >= 0; t += 20) {
      let s = (aMove[i * 4] + (aMove[i * 4 + 1] * (o.clock0 + t) + aOff[i * 4 + 3]) / ln.len) % 1; if (s < 0) s += 1;
      const p = ln.pts[Math.floor(s * ln.n) % ln.n], dz = Math.max(0, 255 - p[1], p[1] - 530), dd = Math.hypot(p[0], dz * 1.5);
      if (dd < best) best = dd;
    }
    if (best < 150) sk.push([best, i]);
    if (i % 2000 === 1999) await yieldNow();
  }
  await yieldNow();
  sk.sort((a, b) => a[0] - b[0]); const skirtFigs = sk.slice(0, 3200).map((e) => e[1]);
  // the lanes as a float texture: one row per lane, x and z of each point
  const rows = lanes.length, laneData = new Float32Array(256 * rows * 4);
  for (const ln of lanes) for (let k = 0; k < ln.n; k++) { const i = (ln.row * 256 + k) * 4; laneData[i] = ln.pts[k][0]; laneData[i + 1] = ln.pts[k][1]; }
  // where the houses stand (r: the rain's dry wakes) and where the roads run (g: glass worn bright by feet)
  await yieldNow();
  const occ = new Uint8Array(GN * GN * 2); for (let i = 0; i < GN * GN; i++) { occ[i * 2] = grid[i] & 2 ? 255 : 0; occ[i * 2 + 1] = grid[i] & 1 ? 255 : 0; }
  await yieldNow();
  // the town's own light, gathered and blurred (r walls, g aqua edges, b violet, a pearl): the mist and the glass are lit
  // by what stands on them. Walkers lend their light to the whole of the loop they walk.
  const GLN = 256, glowF = new Float32Array(GLN * GLN * 4), tmpF = new Float32Array(GLN * GLN * 4), laneW = new Float32Array(lanes.length * 4);
  const splat = (x, z, ch, w) => { const i = Math.floor((x - G0) / (GN * G) * GLN), j = Math.floor((z - G0) / (GN * G) * GLN); if (i >= 0 && j >= 0 && i < GLN && j < GLN) glowF[(j * GLN + i) * 4 + ch] += w; };
  for (let i = 0; i < nh; i++) splat(hx[i], hz[i], 0, hr[i] * hr[i] / 150);
  for (let i = 0; i < nf; i++) {
    const col = aKind[i * 4 + 1], ch = col === 0 ? 1 : col === 1 ? 2 : 3, w = aMove[i * 4 + 2] / 6;
    if (figLane[i] < 0) splat(aLane[i * 4 + 2], aLane[i * 4 + 3], ch, w * 0.6); else laneW[figLane[i] * 4 + ch] += w;
  }
  await yieldNow();
  for (const ln of lanes) {
    for (const q of ln.pts) { const e = 0.2 + 0.8 * envelope(q[0], q[1]); for (let ch = 1; ch < 4; ch++) { const w = laneW[ln.row * 4 + ch] / ln.n; if (w > 0) splat(q[0], q[1], ch, w * e); } }
    if (ln.row % 12 === 11) await yieldNow();
  }
  for (let pass = 0; pass < 4; pass++) {                                   // two box blurs each way, 5 texels wide
    await yieldNow();
    const src = pass & 1 ? tmpF : glowF, dst = pass & 1 ? glowF : tmpF, st = pass < 2 ? 4 : GLN * 4, ot = pass < 2 ? GLN * 4 : 4;
    for (let a = 0; a < GLN; a++) for (let ch = 0; ch < 4; ch++) {
      if (a % 64 === 0 && a > 0 && ch === 0) await yieldNow();
      const base = a * ot + ch; let sum = src[base] + src[base + st] + src[base + 2 * st];
      for (let b = 0; b < GLN; b++) {
        dst[base + b * st] = sum * 0.2;
        if (b + 3 < GLN) sum += src[base + (b + 3) * st];
        if (b - 2 >= 0) sum -= src[base + (b - 2) * st];
      }
    }
  }
  // each hue against its own brightest place, and softened, so a quiet ring road still shows beside the drill ground
  await yieldNow();
  const gmax = [1e-6, 1e-6, 1e-6, 1e-6]; for (let i = 0; i < glowF.length; i++) if (glowF[i] > gmax[i & 3]) gmax[i & 3] = glowF[i];
  const glow = new Uint8Array(GLN * GLN * 4), GPOW = [0.8, 0.6, 0.9, 0.7];
  for (let j = 0; j < GLN; j++) {
    for (let i = j * GLN * 4, e = i + GLN * 4; i < e; i++) glow[i] = Math.min(255, Math.round(255 * Math.pow(glowF[i] / (0.7 * gmax[i & 3]), GPOW[i & 3])));
    if (j % 64 === 63) await yieldNow();
  }
  return {
    roads, lanes, laneData, laneRows: rows, spokeAng, shutLanes, sqHome,
    fig: { count: nf, aLane: aLane.subarray(0, nf * 4), aMove: aMove.subarray(0, nf * 4), aKind: aKind.subarray(0, nf * 4), aOff: aOff.subarray(0, nf * 4) }, skirtFigs,
    houses: { count: nh, x: hx, z: hz, r: hr, seed: hs, district: hd }, skirtHouses,
    occ, occN: GN, occ0: G0, occSize: GN * G, glow, glowN: GLN,
  };
}
