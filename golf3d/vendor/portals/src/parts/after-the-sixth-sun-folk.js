// AFTER THE SIXTH SUN: what people built and the people themselves. A stone farm and its windmill, dry-stone walls
// and hedges on the field boundaries, the three-arch bridge, the far white city; harvesters, walkers, carts and cattle
// as instanced figures; the first torches ever lit, kindled one by one as the red sun is eaten; the city's fires.
//   makeBuilt(o)   everything that stands still, merged into one vertex-coloured mesh, plus the windmill's sails
//   makeFolk(o)    the figures, the cattle and the carts (moved by the journey), the flames and the torch pools
// Nobody here owns a lamp: nothing in this file glows but fire.
import * as THREE from 'three';
import { landH, ROAD, FARM, RIVER_Y, LAKE_Y, KNOLL, CREST_Z, CITY, GAP_X, lakeShoreZ, IN_POOL_BOX } from './after-the-sixth-sun-land.js';

const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

// ---------------------------------------------------------------- a small triangle soup builder (position, normal, colour)
function soup() { return { p: [], n: [], c: [] }; }
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _n = new THREE.Vector3();
function tri(B, a, b, c, col, colB = col, colC = col) {
  _a.fromArray(a); _b.fromArray(b); _c.fromArray(c); _n.subVectors(_b, _a).cross(_c.sub(_a)).normalize();
  B.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  for (let i = 0; i < 3; i++) B.n.push(_n.x, _n.y, _n.z);
  B.c.push(col[0], col[1], col[2], colB[0], colB[1], colB[2], colC[0], colC[1], colC[2]);
}
function quad(B, a, b, c, d, col, colTop = col) { tri(B, a, b, c, col, col, colTop); tri(B, a, c, d, col, colTop, colTop); }
// a box standing on (x, y, z): sx wide (local x), sy tall, sz deep, turned by rot about Y; taper narrows the top; no bottom face
function box(B, x, y, z, sx, sy, sz, col, rot = 0, taper = 1, topCol = col, shadeLow = 0.86) {
  const cs = Math.cos(rot), sn = Math.sin(rot), hx = sx / 2, hz = sz / 2, low = mul(col, shadeLow);
  const P = (lx, ly, lz) => [x + lx * cs + lz * sn, y + ly, z - lx * sn + lz * cs];
  const b = [P(-hx, 0, -hz), P(hx, 0, -hz), P(hx, 0, hz), P(-hx, 0, hz)], t = [P(-hx * taper, sy, -hz * taper), P(hx * taper, sy, -hz * taper), P(hx * taper, sy, hz * taper), P(-hx * taper, sy, hz * taper)];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; tri(B, b[j], b[i], t[i], low, low, col); tri(B, b[j], t[i], t[j], low, col, col); }
  quad(B, t[3], t[2], t[1], t[0], topCol);
}
// a pitched roof over a box L long (local x), W deep: two slopes and two gables; its eaves at y
function roof(B, x, y, z, L, W, h, col, rot, gableCol, over = 0.5) {
  const cs = Math.cos(rot), sn = Math.sin(rot), hl = L / 2 + over, hw = W / 2 + over, gl = L / 2;
  const P = (lx, ly, lz) => [x + lx * cs + lz * sn, y + ly, z - lx * sn + lz * cs];
  quad(B, P(-hl, -0.25, hw), P(hl, -0.25, hw), P(hl, h, 0), P(-hl, h, 0), mul(col, 0.92), col);
  quad(B, P(hl, -0.25, -hw), P(-hl, -0.25, -hw), P(-hl, h, 0), P(hl, h, 0), mul(col, 0.92), col);
  tri(B, P(gl, 0, hw - over), P(gl, 0, -hw + over), P(gl, h, 0), gableCol); tri(B, P(-gl, 0, -hw + over), P(-gl, 0, hw - over), P(-gl, h, 0), gableCol);
}
// a round tower or drum: radii r0 (foot) and r1 (top), smooth sides; cap: 0 none, 1 flat, >1 a cone that high
function drum(B, x, y, z, r0, r1, h, sides, col, cap = 1, capCol = col) {
  for (let i = 0; i < sides; i++) {
    const a0 = i / sides * 6.2832, a1 = (i + 1) / sides * 6.2832, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    const A = [x + c0 * r0, y, z + s0 * r0], Bq = [x + c1 * r0, y, z + s1 * r0], C = [x + c1 * r1, y + h, z + s1 * r1], D = [x + c0 * r1, y + h, z + s0 * r1];
    const k = B.n.length; quad(B, Bq, A, D, C, mul(col, 0.86), col);
    // radial normals for the side
    const nn = [[c1, s1], [c0, s0], [c0, s0], [c1, s1], [c0, s0], [c1, s1]];
    for (let v = 0; v < 6; v++) { B.n[k + v * 3] = nn[v][0]; B.n[k + v * 3 + 1] = 0.12; B.n[k + v * 3 + 2] = nn[v][1]; }
    if (cap === 1) tri(B, D, [x, y + h, z], C, capCol); else if (cap > 1) tri(B, D, [x, y + h + cap, z], C, capCol);
  }
}
// a shallow dome: `rise` is its height over its radius
function domeCap(B, x, y, z, r, rise, sides, col) {
  const R = 3;
  for (let j = 0; j < R; j++) for (let i = 0; i < sides; i++) {
    const p = (jj, ii) => { const e = jj / R * Math.PI / 2, a = ii / sides * 6.2832; return [x + Math.cos(a) * Math.cos(e) * r, y + Math.sin(e) * r * rise, z + Math.sin(a) * Math.cos(e) * r]; };
    const A = p(j, i), Bq = p(j, i + 1), C = p(j + 1, i + 1), D = p(j + 1, i), k = B.n.length;
    if (j === R - 1) tri(B, Bq, A, D, col); else quad(B, Bq, A, D, C, col);
    const cnt = j === R - 1 ? 3 : 6;
    for (let v = 0; v < cnt; v++) { const o = k + v * 3, px = B.p[o] - x, py = (B.p[o + 1] - y) / Math.max(rise * rise, 0.05), pz = B.p[o + 2] - z, l = Math.hypot(px, py, pz) || 1; B.n[o] = px / l; B.n[o + 1] = py / l; B.n[o + 2] = pz / l; }
  }
}
function toMesh(B, material) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(B.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 3));
  g.computeBoundingSphere();
  const m = new THREE.Mesh(g, material); m.userData.triangles = B.p.length / 9;
  return m;
}

// ---------------------------------------------------------------- the bridge's deck line: where feet stand on the road (ground, or the deck)
// the deck rises from the south bank at z 26 to 4.2 m over the river (z -5 .. -65) and comes down by z -96
export const deckY = (z) => 4.2 * sstep(-28, 2, -z) * sstep(-98, -67, z) + 0.35 * Math.exp(-((z + 35) / 22) * ((z + 35) / 22));
export const roadY = (x, z) => { const g = landH(x, z); return Math.abs(x) < 6 && z < 28 && z > -99 ? Math.max(g, deckY(z)) : g; };

// the road as one line with distance along it (from the avenue's south end at z 250 to the observatory's door)
const RD = ROAD.slice(1), RLEN = [0];
for (let i = 1; i < RD.length; i++) RLEN.push(RLEN[i - 1] + Math.hypot(RD[i][0] - RD[i - 1][0], RD[i][1] - RD[i - 1][1]));
export const ROAD_LEN = RLEN[RLEN.length - 1];
// position at distance d (metres; negative = still south of the avenue), with the road's direction there: out = [x, z, dx, dz]
export function roadAt(d, out) {
  if (d <= 0) { out[0] = RD[0][0]; out[1] = RD[0][1] - d; out[2] = 0; out[3] = -1; return out; }
  let i = 1; while (i < RD.length - 1 && RLEN[i] < d) i++;
  const a = RD[i - 1], b = RD[i], L = RLEN[i] - RLEN[i - 1], t = Math.min(1, (d - RLEN[i - 1]) / L);
  out[0] = a[0] + (b[0] - a[0]) * t; out[1] = a[1] + (b[1] - a[1]) * t; out[2] = (b[0] - a[0]) / L; out[3] = (b[1] - a[1]) / L;
  return out;
}

// ---------------------------------------------------------------- everything that stands still
// o: { rng (the farm, the mill, the bridge's stones), streams: { walls, sheaves, ricks, city } (one seeded stream for each further cast), fields, season,
//      casters (shadow casters are appended), yieldFn }
export async function makeBuilt(o) {
  const { rng, fields, season } = o, ST = o.streams, B = soup(), casters = o.casters || [];
  const stone = lin('#b5a88f'), stoneD = lin('#8d8270'), slate = lin('#5f554b'), thatch = lin('#8b7446'), dark = [0.006, 0.005, 0.005], white = lin('#e9e4d8');
  // ---- the farm: six stone barns round a yard, each with big dark openings (light-wells: this people has no lamps)
  const [fx0, fz0] = FARM, barns = [[-8, -26, 24, 10, 6.5, 0.05], [20, -6, 20, 9, 6, 1.52], [-4, 22, 26, 10.5, 7, -0.04], [-30, 2, 18, 9, 5.5, 1.6], [34, 26, 14, 8, 5, 0.3], [-34, -30, 12, 7, 4.5, 0.9]];
  for (const [dx, dz, L, W, H, rot] of barns) {
    const x = fx0 + dx, z = fz0 + dz, y = landH(x, z) - 0.3, wc = mul(stone, 0.9 + 0.2 * rng()), rc = rng() < 0.5 ? slate : thatch;
    box(B, x, y, z, L, H, W, wc, rot, 1, wc, 0.8);
    roof(B, x, y + H, z, L, W, W * 0.42, rc, rot, mul(wc, 0.95));
    // openings: a tall cart door and a row of unglazed wells on each long wall
    const cs = Math.cos(rot), sn = Math.sin(rot);
    for (const side of [-1, 1]) {
      const n = Math.max(2, Math.round(L / 5));
      for (let k = 0; k < n; k++) {
        const lx = (k + 0.5) / n * L - L / 2, door = k === Math.floor(n / 2), w = door ? 3.4 : 1.7, h = door ? 4.2 : 2.2, by = door ? 0.3 : H - 3.1, lz = side * (W / 2 + 0.02);
        box(B, x + lx * cs + lz * sn, y + by, z - lx * sn + lz * cs, w, h, 0.12, dark, rot, 1, dark, 1);
      }
    }
    casters.push({ x, z, hc: H + W * 0.3, r: Math.min(L, W) * 0.62, tr: 4, kind: 1 });
  }
  await o.yieldFn();
  // ---- the windmill's tower (its sails are a separate mesh that turns): west of the yard, nearest the flight
  const mill = { x: fx0 - 52, z: fz0 + 6, y: 0, h: 15.5 }; mill.y = landH(mill.x, mill.z) - 0.3;
  drum(B, mill.x, mill.y, mill.z, 4.1, 2.6, mill.h, 12, mul(white, 0.92), 0);
  drum(B, mill.x, mill.y + mill.h, mill.z, 3.0, 2.2, 1.2, 12, slate, 2.6, mul(slate, 1.1));
  box(B, mill.x - 4.0, mill.y + 0.2, mill.z, 0.14, 3.0, 1.8, dark, 0, 1, dark, 1);
  for (let k = 0; k < 3; k++) box(B, mill.x - 3.55 + k * 0.42, mill.y + 5.2 + k * 3.6, mill.z, 0.14, 1.4, 0.9, dark, 0, 1, dark, 1);
  casters.push({ x: mill.x, z: mill.z, hc: mill.h + 2, r: 2.6, tr: 3, kind: 1 });
  await o.yieldFn();

  // ---- the bridge: three stone arches over the river, 8 m wide, with parapets and ramps (a side wall cut with arches, extruded)
  {
    const sh = new THREE.Shape(), Z0 = -100, Z1 = 30, N = 44;
    sh.moveTo(Z0, -4.5);
    for (let i = 0; i <= N; i++) { const z = Z0 + (Z1 - Z0) * i / N; sh.lineTo(z, Math.max(deckY(z) - 0.05, -4.4)); }
    sh.lineTo(Z1, -4.5); sh.lineTo(Z0, -4.5);
    for (let k = 0; k < 3; k++) {
      const zc = -51.7 + k * 16.7, hole = new THREE.Path();
      hole.moveTo(zc - 7, -4.2); hole.lineTo(zc + 7, -4.2); hole.lineTo(zc + 7, RIVER_Y - 0.2); hole.absellipse(zc, RIVER_Y - 0.2, 7, 4.1, 0, Math.PI, false); hole.lineTo(zc - 7, -4.2);
      sh.holes.push(hole);
    }
    const eg = new THREE.ExtrudeGeometry(sh, { depth: 8.8, bevelEnabled: false, curveSegments: 9 }).toNonIndexed();
    const P = eg.attributes.position, Nn = eg.attributes.normal;
    for (let i = 0; i < P.count; i++) {
      // shape x -> world z, shape y -> world y, depth -> world x
      const wz = P.getX(i), wy = P.getY(i), wx = P.getZ(i) - 4.4, k = 0.82 + 0.3 * rng() * 0.5 + (wy > 3 ? 0.08 : 0);
      B.p.push(wx, wy, wz); B.n.push(Nn.getZ(i), Nn.getY(i), Nn.getX(i)); const c = Nn.getY(i) > 0.7 ? lin('#9a8d74') : stoneD; B.c.push(c[0] * k, c[1] * k, c[2] * k);
    }
    // ExtrudeGeometry winds for its own axes: after the swap of x and z the faces are mirrored, so turn each triangle round
    const first = B.p.length - P.count * 3;
    for (let t = first; t < B.p.length; t += 9) for (const arr of [B.p, B.n, B.c]) for (let q = 0; q < 3; q++) { const tmp = arr[t + 3 + q]; arr[t + 3 + q] = arr[t + 6 + q]; arr[t + 6 + q] = tmp; }
    eg.dispose();
    // parapets, in short lengths that follow the deck
    for (let z = -96; z < 26; z += 4) for (const sd of [-1, 1]) box(B, sd * 4.15, deckY(z + 2) - 0.1, z + 2, 0.5, 1.05, 4.1, mul(stone, 0.85 + 0.2 * rng()), 0, 1, mul(stone, 1.05));
    for (let k = 0; k < 4; k++) for (const sd of [-1, 1]) box(B, sd * 4.75, -4.4, -60.05 + k * 16.7, 1.6, 8.4, 3.0, mul(stoneD, 0.95), 0, 0.8);      // cutwaters
  }
  await o.yieldFn();

  // ---- dry-stone walls and hedges on the field boundaries within 300 m of the road (the avenue's own strip is walled on both sides)
  const wallR = ST.walls, { xb, len, off, NSTRIP } = fields, hedge = lin('#2c4520'), hedgeTop = lin('#4b6a2c');
  const farmNear = (x, z) => Math.hypot(x - fx0, z - fz0) < 66 || Math.hypot(x - mill.x, z - mill.z) < 14;
  // A hedge is a line of bushes, not a wall: each length of it is two unequal lumps, round-shouldered, of a height, width and green of their own; one
  // length in twelve is a gateway or a gap (half of them two lengths wide); from one length in seven a thorn has grown out above the line. (The walls'
  // stream draws for every length exactly as it did; the form is drawn from the hedges' own stream.)
  const hg = ST.hedges;
  const run = (x0, z0, x1, z1, type) => {
    const L = Math.hypot(x1 - x0, z1 - z0), seg = type === 1 ? 8 : 7, n = Math.max(1, Math.round(L / seg)), rot = Math.atan2(x1 - x0, z1 - z0); let gap = 0;
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; if (farmNear(x, z)) continue;
      if (type === 1) { const c = mul(stone, 0.7 + 0.3 * wallR()); box(B, x + (wallR() - 0.5) * 0.2, landH(x, z) - 0.15, z, 0.75, 1.05 + 0.3 * wallR(), L / n + 0.2, c, rot + (wallR() - 0.5) * 0.03, 0.8, mul(c, 1.15)); }
      else { if (wallR() < 0.06) continue; const g = 0.75 + 0.5 * wallR(), jx = (wallR() - 0.5) * 0.5, w = 1.7 + 0.8 * wallR(), h = 1.5 + 0.9 * wallR(), rr = rot + (wallR() - 0.5) * 0.08;
        if (!hg) { box(B, x + jx, landH(x, z) - 0.2, z, w, h, L / n + 0.6, mul(hedge, g), rr, 0.66, mul(hedgeTop, g), 0.7); continue; }
        if (gap > 0) { gap--; continue; }
        if (hg() < 1 / 12) { gap = hg() < 1 / 2 ? 0 : 1; continue; }
        const sl = L / n, sx = Math.sin(rot), sz = Math.cos(rot), y = landH(x, z) - 0.2;
        for (let q = 0; q < 2; q++) { const t2 = (q - 0.5) * 0.5 * sl, hh = h * (0.7 + 0.75 * hg()), ww = w * (0.8 + 0.5 * hg()), gg = g * (0.8 + 0.4 * hg());
          box(B, x + jx + sx * t2 + (hg() - 0.5) * 0.6, y, z + sz * t2, ww * 1.25, hh, sl / 2 + 1.8, mul(hedge, gg), rr + (hg() - 0.5) * 0.5, 0.32, mul(hedgeTop, gg * 0.8), 0.62); }
        if (hg() < 1 / 7) { const th = 3.2 + 2.4 * hg(), tr = 1.5 + 0.9 * hg(), gg = g * (0.75 + 0.3 * hg()); drum(B, x + jx, y + 0.8, z, tr, tr * 0.75, th * 0.45, 6, mul(hedge, gg), th * 0.4, mul(hedgeTop, gg)); } }
    }
  };
  for (let i = 1; i < NSTRIP; i++) {
    const x = xb[i]; if (Math.abs(x) > 340) continue;
    const av = i === 19 || i === 20, r = wallR(), type = av ? 1 : r < 0.45 ? 1 : r < 0.82 ? 2 : 0; if (!type) continue;
    if (av) { run(x, 262, x, 40, 1); run(x, 860, x, 280, r < 0.5 ? 1 : 2); }
    else for (let z = 860; z > 44; z -= 100) run(x, z, x, Math.max(44, z - 100), type);
  }
  await o.yieldFn();
  for (let i = 0; i < NSTRIP; i++) {
    if (i === 19) continue; const x0 = xb[i], x1 = xb[i + 1]; if (Math.abs((x0 + x1) / 2) > 300) continue;
    for (let j = Math.ceil((44 + off[i]) / len[i]); j * len[i] - off[i] < 860; j++) { const z = j * len[i] - off[i], r = wallR(); if (r < 0.75) run(x0 + 1, z, x1 - 1, z, r < 0.4 ? 1 : 2); }
  }
  await o.yieldFn();
  // ---- stooks in the stubble (the stubble season): in the cornfields of the plain between 260 m west and 260 m east of the road
  if (season === 2) {
    const sheaf = lin('#a88c4c'), shR = ST.sheaves;
    for (let k = 0; k < 2400; k++) {
      const x = -260 + 520 * shR(), z = 60 + 640 * shR(), f = fields.at(x, z);
      if (f.kind !== 1 || f.edge < 4 || farmNear(x, z) || Math.abs(x) < 20) continue;
      const gx = Math.round(x / 9) * 9 + (shR() - 0.5) * 1.2, gz = Math.round(z / 7) * 7 + (shR() - 0.5) * 1.2;
      box(B, gx, landH(gx, gz) - 0.05, gz, 1.5, 1.5 + 0.3 * shR(), 1.1, mul(sheaf, 0.8 + 0.3 * shR()), shR() * 3.14, 0.25, sheaf, 0.75);
    }
    await o.yieldFn();
  }
  // ---- a small farm at the ridge foot, left of the flight, with its ricks (some afternoons they burn)
  const ricks = [], rkR = ST.ricks;
  { const bx = -58, bz = -126, by = landH(bx, bz) - 0.3; box(B, bx, by, bz, 16, 5, 8, mul(stone, 0.95), 0.25, 1, stone, 0.8); roof(B, bx, by + 5, bz, 16, 8, 3.4, thatch, 0.25, stone);
    for (let k = 0; k < 5; k++) { const x = -40 + (k % 3) * 9 + (rkR() - 0.5) * 3, z = -112 - Math.floor(k / 3) * 10 + (rkR() - 0.5) * 3, y = landH(x, z) - 0.2, r = 2.6 + 0.8 * rkR();
      drum(B, x, y, z, r, r * 1.08, 2.4, 9, mul(thatch, 0.95), 0); domeCap(B, x, y + 2.4, z, r * 1.08, 1.15, 9, mul(thatch, 1.1)); ricks.push({ x, y: y + 4.2, z, r });
      casters.push({ x, z, hc: 5, r: r * 0.9, tr: r * 0.9, kind: 1 }); }
    casters.push({ x: bx, z: bz, hc: 7, r: 5, tr: 4, kind: 1 }); }
  await o.yieldFn();

  // ---- the white city on the lake's far shore: blocks, towers and shallow domes on a low rise (2 to 3 km away: no detail spent)
  // (each block takes its sixteen draws before the land is asked whether it may stand, so a changed land never changes the deal of the blocks after it)
  const CX = CITY[0], CZ = CITY[1], fires = [], cr = ST.city, q = new Float64Array(16);
  for (let k = 0; k < 400; k++) {
    for (let i = 0; i < 16; i++) q[i] = cr();
    const a = q[0] * 6.2832, rr = Math.sqrt(q[1]), x = Math.round((CX + Math.cos(a) * rr * 520) / 24) * 24 + (q[2] - 0.5) * 7, z = Math.round((CZ + Math.sin(a) * rr * 330) / 24) * 24 + (q[3] - 0.5) * 7;
    const y = landH(x, z) - 1; if (y < 0.3) continue;
    const mid = 1 - rr, w = 13 + 15 * q[4], d = 13 + 15 * q[5], h = 7 + 12 * q[6] + 16 * mid * q[7], c = mul(white, 0.86 + 0.2 * q[8]), kind = q[9];
    if (kind < 0.09) { const th = 30 + 30 * q[10] * (0.5 + 0.5 * mid), tw = 8 + 5 * q[11]; box(B, x, y, z, tw, th, tw, c, q[12] * 0.3, 0.86, c, 0.9); if (q[13] < 0.6) domeCap(B, x, y + th, z, tw * 0.5, 0.9, 6, mul(c, 1.05)); else drum(B, x, y + th, z, tw * 0.5, 0.2, tw * 0.9, 4, mul(c, 0.9), 0); }
    else if (kind < 0.15) { const r = 9 + 8 * q[10]; drum(B, x, y, z, r, r, 6 + 5 * q[11] + h * 0.3, 8, c, 0); domeCap(B, x, y + 6 + h * 0.3, z, r * 1.02, 0.5, 8, mul(c, 1.06)); }
    else box(B, x, y, z, w, h, d, c, (q[10] < 0.5 ? 0 : 1.5708) + (q[11] - 0.5) * 0.2, 1, mul(c, 0.9), 0.9);
    if (q[14] < 0.17) fires.push({ x, y: y + h * 0.6, z, r: 5 + 9 * q[15] });
    if (k % 100 === 99) await o.yieldFn();
  }
  const material = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const mesh = toMesh(B, material); mesh.frustumCulled = false;
  // ---- the windmill's sails: four lattice arms in the plane facing into the wind (west), turning about the X axis
  const S = soup(), spar = lin('#4a3c2e'), cloth = lin('#d9d0bc');
  box(S, 0, 0.4, 0, 0.24, 9.4, 0.24, spar); box(S, -0.05, 1.8, 1.0, 0.08, 7.4, 1.8, cloth, 0, 1, cloth, 0.92);
  for (let k = 0; k < 6; k++) box(S, -0.02, 2.0 + k * 1.4, 1.0, 0.14, 0.1, 1.9, spar);
  const armP = S.p.slice(), armN = S.n.slice(), armC = S.c.slice();
  for (let q = 1; q < 4; q++) {
    const cs = Math.cos(q * Math.PI / 2), sn = Math.sin(q * Math.PI / 2);
    for (let i = 0; i < armP.length; i += 3) { S.p.push(armP[i], armP[i + 1] * cs - armP[i + 2] * sn, armP[i + 1] * sn + armP[i + 2] * cs); S.n.push(armN[i], armN[i + 1] * cs - armN[i + 2] * sn, armN[i + 1] * sn + armN[i + 2] * cs); S.c.push(armC[i], armC[i + 1], armC[i + 2]); }
  }
  box(S, -0.3, -0.35, 0, 1.2, 0.7, 0.7, spar);
  const sails = toMesh(S, material); sails.position.set(mill.x - 3.5, mill.y + mill.h + 0.3, mill.z);
  const object = new THREE.Group(); object.add(mesh, sails);
  const sailPhase = ST.mill() * 6.283;      // where the sails stand when the world's clock starts: a seeded draw
  return { object, mesh, sails, mill, ricks, fires, material, triangles: mesh.userData.triangles + sails.userData.triangles,
    update(time, wind) { sails.rotation.x = sailPhase + time * 0.42 * (0.7 + 0.3 * wind); } };
}

// ---------------------------------------------------------------- flames: torches, burning ricks, the city's fires
const FLAME_VS = /* glsl */`
attribute vec4 aPos;        // where it burns, brightness (0 = not kindled)
attribute vec4 aSz;         // width, height in metres (negative: its reflection, hanging down), phase, 0 torch .. 1 a far crimson fire
uniform vec4 uWindT;        // wind x, z, lean, time
varying vec2 vQ, vM, vE; varying vec4 vK; varying float vG;
void main(){
  vec3 c = aPos.xyz;
  // A flame is as big as its fire, in metres, wherever the eye is (fix round 3, S1: nothing here reads the lens, the picture's size or the depth).
  // The card stands upright along the world's up and turns about its upright to face the eye's PLACE. It is larger than the flame's own box
  // (x -1..1, y 0..1) so that it also holds the fire's glow in the air: a soft ball whose sigma is 0.4 m for a torch (it shows about 1.6 m across)
  // and three tenths of the fire's width for a larger fire. A far torch's flame falls under a pixel; its glow is what is left of it, a faint point,
  // and a line of far torches reads as a thin warm thread. A reflection has no glow of its own.
  vec3 te = cameraPosition - c;
  vec3 right = normalize(vec3(te.z, 0.0, -te.x) + vec3(1e-5, 0.0, 0.0));
  float w = max(abs(aSz.x), 0.05), h = max(abs(aSz.y), 0.05), sg = aSz.y > 0.0 ? max(0.4, 0.3*w) : 0.0;
  float X = max(0.5*w, 2.6*sg), ylo = min(0.0, 0.35 - 2.6*sg/h), yhi = max(1.0, 0.35 + 2.6*sg/h);
  vec2 q = vec2(position.x*X/(0.5*w), mix(ylo, yhi, position.y));
  float t = uWindT.w, ph = aSz.z*40.0, qy = clamp(q.y, 0.0, 1.0);
  float lean = qy*qy*h*uWindT.z*(0.8 + 0.35*sin(t*(3.1 + 2.0*fract(aSz.z*5.3)) + ph));
  vec3 wp = c + right*(q.x*w*0.5) + vec3(0.0, q.y*aSz.y, 0.0) + vec3(uWindT.x, 0.0, uWindT.y)*lean;
  wp.y -= 0.12*aSz.y;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
  float fl = 0.82 + 0.18*sin(t*(7.0 + 5.0*fract(aSz.z*3.7)) + ph)*sin(t*2.3 + ph*0.7);
  vQ = q; vM = vec2(q.x*w*0.5, (q.y - 0.35)*h); vE = vec2(position.x, position.y*2.0 - 1.0); vG = sg;
  vK = vec4(aPos.w*fl, aSz.z, aSz.w, t);
  if (aPos.w < 0.003) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const FLAME_FS = /* glsl */`
varying vec2 vQ, vM, vE; varying vec4 vK; varying float vG;
void main(){
  float y = clamp(vQ.y, 0.0, 1.0), t = vK.w, ph = vK.y*40.0;
  float inY = step(0.0, vQ.y)*step(vQ.y, 1.0);
  float x = vQ.x + 0.22*y*sin(y*7.0 - t*9.0 + ph) + 0.1*y*sin(y*15.0 - t*14.0 + ph*1.7);
  float w = 0.62*pow(1.0 - y, 0.7)*smoothstep(0.0, 0.16, y) + 0.02;
  float d = abs(x)/w;
  float body = (1.0 - smoothstep(0.35, 1.0, d))*inY;
  float core = (1.0 - smoothstep(0.0, 0.55, d + y*0.9))*inY;
  float halo = exp(-min(vQ.x*vQ.x*3.2 + (vQ.y - 0.3)*(vQ.y - 0.3)*7.0, 40.0));
  float glow = exp(-min(dot(vM, vM)/max(2.0*vG*vG, 1e-4), 40.0))*step(0.001, vG)*(1.0 - smoothstep(0.75, 1.0, max(abs(vE.x), abs(vE.y))));
  vec3 torch = vec3(2.3, 0.78, 0.13)*body + vec3(2.6, 2.1, 1.0)*core + vec3(0.5, 0.17, 0.03)*halo*0.5 + vec3(1.0, 0.42, 0.1)*glow*0.42;
  vec3 far = vec3(2.0, 0.34, 0.06)*body + vec3(1.6, 0.9, 0.25)*core + vec3(0.8, 0.09, 0.02)*halo + vec3(0.8, 0.1, 0.025)*glow*0.25;
  gl_FragColor = vec4(mix(torch, far, vK.z)*vK.x, 1.0);
}`;

function figureSoup(carrier) {
  const S = soup(), cloth = [0.8, 0.8, 0.8], legs = [0.42, 0.4, 0.38], head = [0.95, 0.8, 0.68], wood = [0.2, 0.15, 0.1];
  box(S, 0, 0, 0, 0.34, 0.84, 0.2, legs, 0, 0.9, legs, 0.8);
  box(S, 0, 0.82, 0, 0.44, 0.62, 0.25, cloth, 0, 0.88, cloth, 0.85);
  box(S, 0, 1.45, 0, 0.21, 0.25, 0.22, head, 0, 0.9, mul(head, 0.6));
  box(S, -0.27, 0.8, 0, 0.1, 0.6, 0.12, cloth, 0, 0.9);
  if (carrier) { box(S, 0.27, 1.28, 0.02, 0.1, 0.6, 0.11, cloth, 0, 0.9); box(S, 0.27, 1.82, 0.02, 0.055, 0.6, 0.055, wood); }
  else box(S, 0.27, 0.8, 0, 0.1, 0.6, 0.12, cloth, 0, 0.9);
  return S;
}
function oxSoup(S, x, z, col) {
  box(S, x, 0.62, z, 0.74, 0.8, 2.0, col, 0, 0.92, col, 0.8); box(S, x, 0.86, z + 1.2, 0.36, 0.44, 0.62, mul(col, 0.92), 0, 0.85);
  for (const sx of [-0.24, 0.24]) for (const sz of [-0.74, 0.74]) box(S, x + sx, 0, z + sz, 0.15, 0.64, 0.15, mul(col, 0.8));
  return S;
}
function instanced(S, material, count) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(S.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(S.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(S.c, 3));
  const m = new THREE.InstancedMesh(g, material, Math.max(1, count)); m.count = count; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  m.userData.triangles = S.p.length / 9 * count;
  return m;
}
// write a turn about Y, a uniform scale and a position straight into an instance matrix
function setYaw(mesh, i, x, y, z, yaw, sc) {
  const e = mesh.instanceMatrix.array, o = i * 16, c = Math.cos(yaw) * sc, s = Math.sin(yaw) * sc;
  e[o] = c; e[o + 1] = 0; e[o + 2] = -s; e[o + 3] = 0; e[o + 4] = 0; e[o + 5] = sc; e[o + 6] = 0; e[o + 7] = 0; e[o + 8] = s; e[o + 9] = 0; e[o + 10] = c; e[o + 11] = 0; e[o + 12] = x; e[o + 13] = y; e[o + 14] = z; e[o + 15] = 1;
}

// ---------------------------------------------------------------- the people, the beasts, the fire
// o: { streams (one seeded stream for each cast: walkers, harvesters, cattle, carts, flames, watchers, boats, stooks, jetty, isles, wall), fields, path,
//      clock (the sky's clock: eclAt(f) = the route metre where the share f of the eclipse is gone; goneAt = the snap), places (routePlaces),
//      dens, rare, built (from makeBuilt), torchUniform (24 vec4 for the ground's light pools), wind [x, z], duration }
// Every moment here (a torch kindled, a reaper stopping, a beast lying down, a fire catching) belongs to the sky's one clock: a share of the eclipse, or
// the city's burning. Nothing here is placed by the route: the people stand by the road, the gap in the skyline's trees, the mole and the shore.
export function makeFolk(o) {
  const ST = o.streams, rng = ST.walkers, { fields, path } = o, dens = o.dens ?? 1, rare = !!o.rare, object = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  // (second hand mend, N2a) whatever of this cast stands within some 6 m of a lamp is lit by it: the walkers, a cart, the road's wall. The same pools
  // that light the ground (the land's uTorch: x, z, the lamp's strength, 1 / its reach squared), the same reach, added to the thing's own colour at every hour.
  if (o.torchUniform && o.torchBox) { const NL = o.torchUniform.length;
    mat.onBeforeCompile = (sh) => { sh.uniforms.uTorch = { value: o.torchUniform }; sh.uniforms.uPoolBox = { value: o.torchBox };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\nuniform vec4 uTorch[${NL}]; uniform vec4 uPoolBox[2]; varying vec3 vLampL;`).replace('#include <project_vertex>', `#include <project_vertex>
        { vec4 lw = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          lw = instanceMatrix*lw;
        #endif
          lw = modelMatrix*lw; vec3 ll = vec3(0.0);
          if (${IN_POOL_BOX('lw.xz')}) {      // (cost only, C1: outside the pools' two boxes the sum is nothing)
            for (int k = 0; k < ${NL}; k++) { vec2 dd = lw.xz - uTorch[k].xy; float a = max(0.0, 1.0 - dot(dd, dd)*uTorch[k].w); ll += vec3(1.0, 0.5, 0.14)*(uTorch[k].z*a*a); }
          }
          vLampL = ll; }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLampL;').replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec3 fl = diffuseColor.rgb*vLampL; float fm = max(fl.r, max(fl.g, fl.b)); totalEmissiveRadiance += fl*(0.2/(0.2 + fm)); }`); }; }
  const TINTS = [[0.55, 0.42, 0.3], [0.72, 0.62, 0.42], [0.78, 0.74, 0.66], [0.36, 0.42, 0.55], [0.58, 0.3, 0.25], [0.42, 0.47, 0.33], [0.85, 0.82, 0.76]];
  const col = new THREE.Color(), r4 = [0, 0, 0, 0];
  const tintOf = (mesh, i, r = rng) => { const t = TINTS[Math.floor(r() * TINTS.length)], k = 0.8 + 0.4 * r(); mesh.setColorAt(i, col.setRGB(t[0] * k, t[1] * k, t[2] * k)); };
  const late = ST, clock = o.clock, RP = o.places, MG = clock.goneAt;

  // ---- walkers on the road, in knots (140, the brief's count); one in three carries a torch (few and small: the guard's ruling); the stream is twice as long on a rare afternoon, and then one in six carries one, so the torches are no more
  const NW = Math.min(320, Math.round(140 * dens * (rare ? 2 : 1))), reach = rare ? ROAD_LEN + 380 : ROAD_LEN;
  const W = [], knots = Math.max(6, Math.round(NW / 6.5));
  for (let k = 0; k < knots; k++) {
    const gd = rng() < 0.55 ? 330 + (ROAD_LEN - 380) * rng() : ROAD_LEN - 70 - reach * Math.pow(rng(), 0.85) * 0.93, n = Math.max(1, Math.round(NW / knots + (rng() - 0.5) * 5));
    for (let j = 0; j < n && W.length < NW; j++) W.push({ d0: gd + rng.gauss() * 6, lat: (rng() - 0.5) * 3.6, ph: rng() * 6.283, spd: 0.85 + 0.3 * rng(), sc: 0.9 + 0.2 * rng(), end: ROAD_LEN - 3 - rng() * 30, torch: rng() < (rare ? 1 / 6 : 1 / 3), k: 9 });
  }
  const carriers = W.filter((w) => w.torch), plain = W.filter((w) => !w.torch);
  // the first torch is lit on the bridge; the fire is passed along the road from there, hand to hand
  { let first = carriers[0]; for (const c of carriers) if (Math.abs(c.d0 - 292) < Math.abs(first.d0 - 292)) first = c;
    let far = 1; for (const c of carriers) far = Math.max(far, Math.abs(c.d0 - first.d0));
    // (the first when three tenths of the eclipse is gone, the farthest hands reached just before the thread goes)
    for (const c of carriers) c.k = clock.eclAt(0.31 + 0.635 * Math.pow(Math.abs(c.d0 - first.d0) / far, 0.8) + (c === first ? 0 : 0.015 + 0.046 * rng())); }
  // ---- watchers who have left the road for the open hillside. They stand in knots beside the two ways people take on the ridge: the road's zigzags
  // from its first bend up to the observatory's door, and the way on through the gap in the skyline's trees and down the far slope to the mole. Each
  // knot is drawn as a place along those ways (by length) and 8 to 45 m off to one side or the other; one torch in each knot, a second in one knot
  // in three. They do not walk; they face the place where the sun is going out. Their torches are kindled in the second half of the eclipse, like the road's.
  const NP0 = plain.length, NT0 = carriers.length, wr = late.watchers;
  const MOLE = [KNOLL[0], lakeShoreZ(KNOLL[0]) + 4], MOLE_LEN = 124;      // the mole's root on the shore straight below the dome, and how far it runs out (due north)
  if (wr) { const NK = Math.round(18 * dens), faceSun = Math.atan2(clock.deathDir.x, clock.deathDir.z);
    const offRoad = (x, z) => { let d = 1e9; for (let i = 0; i < ROAD.length - 1; i++) { const a = ROAD[i], b = ROAD[i + 1], bx = b[0] - a[0], bz = b[1] - a[1], t = sat(((x - a[0]) * bx + (z - a[1]) * bz) / (bx * bx + bz * bz)); d = Math.min(d, Math.hypot(x - a[0] - bx * t, z - a[1] - bz * t)); } return d; };
    const legs = []; let total = 0;
    for (const way of [ROAD.slice(4), [[GAP_X, CREST_Z], MOLE]]) for (let i = 0; i < way.length - 1; i++) { const a = way[i], b = way[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); legs.push({ a, b, l, at: total }); total += l; }
    const q = new Float64Array(41);
    for (let k = 0; k < NK; k++) {
      for (let j = 0; j < 41; j++) q[j] = wr();
      const d = q[0] * total, leg = legs.find((g) => d < g.at + g.l) || legs[legs.length - 1], t = (d - leg.at) / leg.l, tx = (leg.b[0] - leg.a[0]) / leg.l, tz = (leg.b[1] - leg.a[1]) / leg.l;
      const lat = (q[1] < 1 / 2 ? -1 : 1) * (8 + 37 * q[2]), gx = leg.a[0] + (leg.b[0] - leg.a[0]) * t - tz * lat, gz = leg.a[1] + (leg.b[1] - leg.a[1]) * t + tx * lat, n = 3 + Math.floor(q[3] * 4), two = q[4] < 1 / 3;
      if (landH(gx, gz) < 0.9 || offRoad(gx, gz) < 6 || Math.hypot(gx - KNOLL[0], gz - KNOLL[1]) < 30 || (gx > 50 && gx < 134 && Math.abs(gz - KNOLL[1]) < 24) || (gx < GAP_X - 8 && Math.abs(gz - CREST_Z) < 22) || Math.hypot(gx + 45, gz + 120) < 30) continue;
      for (let j = 0; j < n; j++) {
        const o6 = 5 + j * 6, a = q[o6] * 6.283, r = j ? 0.8 + 2.6 * Math.sqrt(q[o6 + 1]) : 0, x = gx + Math.cos(a) * r, z = gz + Math.sin(a) * r, torch = j === 0 || (j === 1 && two);
        (torch ? carriers : plain).push({ fix: true, x, y: landH(x, z), z, yaw: faceSun + (q[o6 + 2] - 0.5) * 0.9, ph: q[o6 + 3] * 6.283, sc: 0.9 + 0.2 * q[o6 + 4], torch, k: clock.eclAt(0.5 + 0.3 * q[o6 + 5]) });
      } } }
  const mPlain = instanced(figureSoup(false), mat, plain.length), mCarry = instanced(figureSoup(true), mat, carriers.length);
  for (let i = 0; i < NP0; i++) tintOf(mPlain, i); for (let i = 0; i < NT0; i++) tintOf(mCarry, i);
  for (let i = NP0; i < plain.length; i++) tintOf(mPlain, i, wr); for (let i = NT0; i < carriers.length; i++) tintOf(mCarry, i, wr);
  object.add(mPlain, mCarry);

  // ---- harvesters: thirty (the brief's count), in gangs of six, each gang a line of reapers across a cornfield of the plain the flight comes in over. They
  // are drawn in the plain's own metres (x from -190 to 130, z from 60 to 540), never by the route; every gang takes all its draws before its field is
  // asked for. They work, then stop about the first notch (some as the light changes before it, the last a little after) and stand facing the last sun.
  const NH = Math.round(30 * dens), H = [], hr = ST.harvesters;
  const cornAt = (x, z) => { const f = fields.at(x, z); return f.kind <= 1 && f.edge >= 3 && Math.abs(x) >= 19 && Math.hypot(x - FARM[0], z - FARM[1]) >= 60; };
  for (let tries = 0; H.length < NH && tries < 600; tries++) {
    const gx = -190 + 320 * hr(), gz = 60 + 480 * hr(), a = hr() * 6.283, stopAt = hr(), q = []; for (let j = 0; j < 30; j++) q.push(hr());
    if (!cornAt(gx, gz)) continue;
    for (let j = 0; j < 6 && H.length < NH; j++) {
      const o5 = j * 5, x = gx + Math.cos(a) * (j - 2.5) * 3.4 + (q[o5] - 0.5) * 1.2, z = gz + Math.sin(a) * (j - 2.5) * 3.4 + (q[o5 + 1] - 0.5) * 1.2; if (!cornAt(x, z)) continue;
      H.push({ x, y: landH(x, z), z, yaw: q[o5 + 2] * 6.283, ph: q[o5 + 3] * 6.283, sc: 0.9 + 0.2 * q[o5 + 4], k: clock.eclAt(-0.115 + 0.27 * (0.7 * stopAt + 0.3 * q[o5 + 3])) });
    }
  }
  // Further gangs over the whole plain (fix round 2, A7), from a stream of their own (gangs): nine, times the density, each drawn as a place in the
  // plain's own metres (x from -280 to 220, z from 60 to 620) and taking all its draws before its field is asked for. In the harvest a gang works where
  // the work is: at the nearest wall of standing corn across the rows from its place, six reapers in echelon on the stubble with their faces to the
  // corn; one gang in two has its wain standing 9 to 16 m behind it on the stubble. In the green spring there is no wall: a gang hoes in a line in the
  // young corn. Nothing here is placed by the route.
  const NH0 = H.length, wains = [];
  if (late.gangs) { const gr = late.gangs, NG = Math.round(9 * dens), q = new Float64Array(36); let made = 0;
    for (let tries = 0; made < NG && tries < NG * 12; tries++) {
      for (let j = 0; j < 36; j++) q[j] = gr();
      const gx = -280 + 500 * q[0], gz = 60 + 560 * q[1], f = fields.at(gx, gz), e = fields.edgeNear(gx, gz), got = [];
      if (!e && !(fields.season === 1 && f.kind === 4)) continue;
      for (let j = 0; j < 6; j++) { const o5 = 5 + j * 5; let x, z, yaw;
        if (e) { const across = e.rc + e.side * (0.9 + 0.9 * j + 0.5 * q[o5]), along = (e.cross ? gx : gz) + (j - 2.5) * 3.2 + (q[o5 + 1] - 0.5);
          x = e.cross ? along : across; z = e.cross ? across : along; yaw = (e.cross ? (e.side > 0 ? Math.PI : 0) : -e.side * Math.PI / 2) + (q[o5 + 2] - 0.5) * 0.8; }
        else { const a = q[2] * 6.283; x = gx + Math.cos(a) * (j - 2.5) * 3.4 + (q[o5] - 0.5) * 1.2; z = gz + Math.sin(a) * (j - 2.5) * 3.4 + (q[o5 + 1] - 0.5) * 1.2; yaw = q[o5 + 2] * 6.283; }
        const g2 = fields.at(x, z); if (g2.i !== f.i || g2.j !== f.j || g2.edge < 3 || Math.abs(x) < 19 || Math.hypot(x - FARM[0], z - FARM[1]) < 60) continue;
        got.push({ x, y: landH(x, z), z, yaw, ph: q[o5 + 3] * 6.283, sc: 0.9 + 0.2 * q[o5 + 4], k: clock.eclAt(-0.115 + 0.27 * (0.7 * q[3] + 0.3 * q[o5 + 3])) }); }
      if (got.length < 4) continue;
      for (const h of got) H.push(h); made++;
      if (e && q[4] < 1 / 2) { const across = e.rc + e.side * (9 + 7 * q[35]), along = e.cross ? gx : gz, x = e.cross ? along : across, z = e.cross ? across : along, g2 = fields.at(x, z);
        if (g2.i === f.i && g2.j === f.j && g2.edge > 4 && Math.abs(x) > 22) wains.push([x, z, (e.cross ? Math.PI / 2 : 0) + (q[34] < 1 / 2 ? Math.PI : 0)]); }
    } }
  const mHarv = instanced(figureSoup(false), mat, H.length); H.forEach((w, i) => tintOf(mHarv, i, i < NH0 ? hr : late.gangs)); object.add(mHarv);
  // what they have cut stands behind each of them: a short row of stooks
  if (late.stooks) { const sr = late.stooks, SS = soup(), sheafC = lin('#b89a52'), ST = [];
    box(SS, 0, 0, 0, 1.5, 1.7, 1.1, mul(sheafC, 0.8), 0, 0.22, sheafC, 0.7); box(SS, 0, 0, 0, 1.1, 1.75, 1.5, mul(sheafC, 0.74), 0, 0.22, mul(sheafC, 0.95), 0.7);
    for (const h of H.slice(0, NH0)) { const a = sr() * 6.283, n = 3 + Math.floor(sr() * 5), dx = Math.cos(a), dz = Math.sin(a);
      for (let j = 0; j < n; j++) { const x = h.x + dx * (3 + j * 3.4) + (sr() - 0.5), z = h.z + dz * (3 + j * 3.4) + (sr() - 0.5); if (fields.at(x, z).edge > 2 && Math.abs(x) > 19) ST.push([x, z, sr() * 3.14, 0.85 + 0.3 * sr()]); } }
    const mSt = instanced(SS, mat, ST.length); ST.forEach((t, i) => { setYaw(mSt, i, t[0], landH(t[0], t[1]) - 0.05, t[1], t[2], t[3]); const k = 0.85 + 0.3 * sr(); mSt.setColorAt(i, col.setRGB(k, k, k)); });
    mSt.instanceMatrix.needsUpdate = true; if (ST.length) object.add(mSt); }

  // stooks in rows on every cut part of the wheat (fix round 2, A7; a stream of their own, stookRows): the sheaves are stood up where they were bound,
  // nine metres between the rows and seven along them over the whole plain; one place in six is empty. Each takes its five draws before its field is asked.
  let stookTris = 0;
  if (late.stookRows) { const s2 = late.stookRows, S1 = soup(), sheafC = lin('#b89a52'), list = [];
    // (fix round 3, D3: a stook is sheaves leaned together, not a cone: broad at the foot, drawn in at the bands, the heads splayed above; and no
    // two alike: each is shifted off its place in the row, has its own height and girth and leans its own way, one in nine has fallen over; all
    // from a stream of its own, stookForm, so that stookRows deals as it did)
    box(S1, 0, 0, 0, 1.5, 1.15, 1.2, mul(sheafC, 0.72), 0, 0.42, mul(sheafC, 0.92), 0.7);
    box(S1, 0, 1.13, 0, 0.64, 0.58, 0.52, mul(sheafC, 0.9), 0, 1.6, mul(sheafC, 1.14), 0.8);
    const sf = late.stookForm;
    for (let x = -300; x <= 260; x += 9) for (let z = 60; z <= 640; z += 7) { const px = x + (s2() - 0.5) * 1.6, pz = z + (s2() - 0.5) * 1.6, rot = s2() * 3.14, sc = 0.85 + 0.3 * s2(), miss = s2();
      if (miss < 1 / 6 || Math.abs(px) < 20 || !fields.reapedAt(px, pz) || fields.at(px, pz).edge < 3.5 || Math.hypot(px - FARM[0], pz - FARM[1]) < 62) continue;
      list.push([px, pz, rot, sc, 0.85 + 0.3 * miss]); }
    if (list.length) { const mS = instanced(S1, mat, list.length); list.forEach((t, i) => {
        let dx = 0, dz = 0, hk = 1, lx = 0, lz = 0, wk = 1;
        if (sf) { dx = (sf() - 0.5) * 3.4; dz = (sf() - 0.5) * 2.4; hk = 0.72 + 0.6 * sf(); const la = sf() * 6.283, down = sf() < 1 / 9, ll = down ? 1.5 : 0.3 * sf(); lx = Math.cos(la) * ll; lz = Math.sin(la) * ll; wk = down ? 1.15 : 0.82 + 0.4 * sf(); if (down) hk *= 0.5; }
        const x = t[0] + dx, z = t[1] + dz; setYaw(mS, i, x, landH(x, z) - 0.05, z, t[2], t[3] * wk);
        { const e = mS.instanceMatrix.array, o16 = i * 16, h = t[3] * hk; e[o16 + 4] = lx * h; e[o16 + 5] = h; e[o16 + 6] = lz * h; }
        mS.setColorAt(i, col.setRGB(t[4], t[4], t[4])); });
      mS.instanceMatrix.needsUpdate = true; object.add(mS); stookTris = mS.userData.triangles; } }

  // ---- a dozen white cattle in the pasture beyond the river, left of the flight; they lie down one by one as the light fails
  const C = [], ctl = ST.cattle;
  for (let tries = 0; C.length < 12 && tries < 400; tries++) {
    const x = -14 - 62 * ctl(), z = -74 - 34 * ctl(); if (C.some((c) => Math.hypot(c.x - x, c.z - z) < 4.5)) continue;
    C.push({ x, y: landH(x, z), z, yaw: ctl() * 6.283, k: clock.eclAt(0.04 + 0.77 * ctl()), sc: 0.9 + 0.2 * ctl() });
  }
  const mCattle = instanced(oxSoup(soup(), 0, 0, [0.92, 0.9, 0.84]), mat, C.length);
  C.forEach((c, i) => { const k = 0.85 + 0.2 * ctl(); mCattle.setColorAt(i, col.setRGB(k, k, k * 0.97)); }); object.add(mCattle);

  // ---- carts drawn by oxen on the road
  const cartS = soup(), woodC = lin('#6b5137'), tan = lin('#b08a5c'), sheaf = lin('#b39650');
  box(cartS, 0, 0.9, 0, 1.7, 0.45, 3.4, woodC); box(cartS, 0, 1.35, 0, 1.5, 1.0, 3.0, sheaf, 0, 0.72, mul(sheaf, 1.1));
  for (const sx of [-0.98, 0.98]) for (let k = 0; k < 10; k++) { const a0 = k / 10 * 6.283, a1 = (k + 1) / 10 * 6.283; tri(cartS, [sx, 0.85, -0.4], [sx, 0.85 + Math.cos(a0) * 0.85, -0.4 + Math.sin(a0) * 0.85], [sx, 0.85 + Math.cos(a1) * 0.85, -0.4 + Math.sin(a1) * 0.85], mul(woodC, 0.7)); }
  box(cartS, 0, 0.95, 3.0, 0.1, 0.1, 3.0, woodC); oxSoup(cartS, -0.55, 3.9, tan); oxSoup(cartS, 0.55, 3.9, mul(tan, 0.85));
  box(cartS, 0.35, 1.35, 1.35, 0.34, 0.8, 0.3, [0.4, 0.34, 0.28]); box(cartS, 0.35, 2.15, 1.35, 0.2, 0.24, 0.2, [0.8, 0.66, 0.55]);
  // They are an endless traffic on the world's clock, like the walkers: spaced along the whole road at half the avenue's length, so that two are between
  // the avenue's rows whatever the clock says (the brief's two carts). Where the line of carts stands when the clock starts, each cart's place in
  // its bay of 14 m and the phase of its jolting are seeded draws.
  const LO = -470, CSPAN = ROAD_LEN - 8 - LO, NCART = Math.max(2, Math.round(CSPAN / (Math.abs(o.avenue[0] - o.avenue[1]) / 2))), cartStep = CSPAN / NCART, cartPhase = ST.carts() * cartStep;
  // (fix round 3, S5: no even pitch. Each gap between one cart and the next is drawn from the carts' own stream, 0.6 to 1.4 of the mean gap, then the
  // gaps are fitted to the road's length; the first cart's place is the stream's first draw, as it was; the count and the draws per cart are as they were)
  const carts = [], gaps = []; let gapSum = 0;
  for (let i = 0; i < NCART; i++) { const g = 0.6 + 0.8 * ST.carts(); gaps.push(g); gapSum += g; carts.push({ d0: 0, lat: i % 2 ? -1.3 : 1.4, ph: ST.carts() * 6.283 }); }
  { let d = LO + cartPhase; for (let i = 0; i < NCART; i++) { carts[i].d0 = d; d += gaps[i] * CSPAN / gapSum; } }
  const mCart = instanced(cartS, mat, NCART); object.add(mCart);
  // the gangs' wains: the same cart and oxen, standing on the stubble
  if (wains.length) { const mW = instanced(cartS, mat, wains.length); wains.forEach((w, i) => setYaw(mW, i, w[0], landH(w[0], w[1]), w[1], w[2], 1)); mW.instanceMatrix.needsUpdate = true; object.add(mW); stookTris += mW.userData.triangles; }

  // ---- boats on the lake: people who have put out from the shore to watch, a torch at each bow
  const boatS = soup(), tar = [0.085, 0.07, 0.06], canvas = [0.4, 0.34, 0.25];
  box(boatS, 0, -0.4, 0, 2.5, 1.2, 8.6, tar, 0, 1.22, mul(tar, 1.5), 0.8); box(boatS, 0, -0.3, 5.0, 1.1, 1.3, 1.8, tar, 0, 1.3, mul(tar, 1.5), 0.8); box(boatS, 0, -0.3, -4.9, 1.6, 1.2, 1.4, tar, 0, 1.2, mul(tar, 1.5), 0.8);
  box(boatS, 0, 0.6, 0.9, 0.17, 8.2, 0.17, mul(tar, 1.6)); box(boatS, 0.12, 3.3, -0.3, 0.07, 4.6, 3.6, canvas, 0.1, 0.72, mul(canvas, 1.1), 0.9); box(boatS, 0.12, 3.25, -0.3, 0.14, 0.14, 4.0, mul(tar, 1.6), 0.1);
  box(boatS, 0.2, 0.7, 3.3, 0.44, 1.45, 0.3, [0.5, 0.46, 0.4]); box(boatS, 0.2, 2.15, 3.3, 0.22, 0.25, 0.22, [0.8, 0.66, 0.55]); box(boatS, 0.46, 1.9, 3.3, 0.06, 1.0, 0.06, [0.2, 0.15, 0.1]);
  box(boatS, -0.3, 0.7, -3.2, 0.44, 1.3, 0.3, [0.36, 0.38, 0.44]); box(boatS, -0.3, 2.0, -3.2, 0.22, 0.25, 0.22, [0.8, 0.66, 0.55]);
  // (they have put out from the mole: each lies somewhere in the fan of open water within 75 degrees either side of due north of the mole's head,
  // 50 to 900 m out and thinner with distance; every boat takes all its draws before the water is asked for)
  const BT = []; if (late.boats) { const br = late.boats, NB = Math.round(10 * Math.min(1.5, dens)), hx = MOLE[0], hz = MOLE[1] - MOLE_LEN;
    for (let tries = 0; BT.length < NB && tries < 300; tries++) {
      const a = (br() - 0.5) * 2.618, d = 50 + 850 * Math.pow(br(), 1.3), yaw = br() * 6.283, ph = br() * 6.283, k = clock.eclAt(0.5 + 0.4 * br()), sc = 1.7 + 0.5 * br(), x = hx + Math.sin(a) * d, z = hz - Math.cos(a) * d;
      if (landH(x, z) > -3 || BT.some((b) => Math.hypot(b.x - x, b.z - z) < 60)) continue;
      BT.push({ x, z, yaw, ph, k, sc });
    } }
  const mBoat = instanced(boatS, mat, BT.length); object.add(mBoat);
  let lateTris = 0;
  // ---- THE TIDE (fix round 3; stream `tide`; hand mends M1 and N1): the crowd from the city, on foot, empty-handed, with no light among them. They
  // walk the whole road on the world's clock for the whole visit, every one at its full size from its first step to its last: from the road's first
  // point (ROAD[0], where the road as built comes into the world) through the avenue, over the bridge, up the hill and in at the observatory's door.
  // Nothing of it hangs on the metres flown, on the sky or on the eye, and nothing fades or grows. They are dressed as the other travellers are (the
  // cast's own cloths, by the stream): by day people walking to the hill under the suns; in the dusk they are dark by the light on them.
  // Two spacings, by one rule of the place: on the level they walk at their own pace (1.56 to 2.08 m a second); from the road's first bend at the
  // ridge's foot (ROAD[4]) the climb slows every one to six tenths of it, so the line closes up on the hill: 3.1 m of road to a figure there (as it
  // was), 3.1 / 0.6 = 5.2 m on the plain, at the visit's density 1. The count follows from the two lengths.
  // The way in: the road comes to the drum's foot beside the door, so the crowd leaves it 14 m short of its end, swings out before the steps, goes
  // up them and in at the door's dark, drawing together to the door's width; a figure is taken away 1.4 m behind the dark, inside the wall.
  const tide = [], TIDE_LO = 250 - ROAD[0][1], TIDE_HILL = RLEN[3], HILL_PACE = 0.6, HILL_GAP = 3.1, DR = o.door || null, TIDE_OFF = DR ? ROAD_LEN - 14 : ROAD_LEN - 3, TX = [], TZ = [], TL = [0];
  if (DR) { const a = roadAt(TIDE_OFF, [0, 0, 0, 0]), cz = DR.z + DR.steps[1][1] + 3.6, fz = DR.z + DR.steps[0][1] + 0.2;
    for (let j = 0; j <= 12; j++) { const t = j / 12; TX.push((1 - t) * (1 - t) * a[0] + (2 * t * (1 - t) + t * t) * DR.x); TZ.push((1 - t) * (1 - t) * a[1] + 2 * t * (1 - t) * cz + t * t * fz); }
    TX.push(DR.x); TZ.push(DR.z + DR.face - 1.4);
    for (let j = 1; j < TX.length; j++) TL.push(TL[j - 1] + Math.hypot(TX[j] - TX[j - 1], TZ[j] - TZ[j - 1])); }
  // (the tide's way measured in metres of level walking: the plain's length, and the hill's length divided by the hill's pace)
  const TIDE_PLAIN = TIDE_HILL - TIDE_LO, TIDE_CLIMB = TIDE_OFF + TL[TL.length - 1] - TIDE_HILL, TIDE_SPAN = TIDE_PLAIN + TIDE_CLIMB / HILL_PACE;
  // where a figure of the tide stands at distance d along its way, lat to the side of its line: out = [x, y, z, yaw]
  const tideAt = (d, lat, out) => {
    if (d <= TIDE_OFF) { const q = roadAt(d, r4), x = q[0] - q[3] * lat, z = q[1] + q[2] * lat; out[0] = x; out[1] = roadY(x, z); out[2] = z; out[3] = Math.atan2(q[2], q[3]); return out; }
    const s = d - TIDE_OFF; let j = 1; while (j < TL.length - 1 && TL[j] < s) j++;
    const L = Math.max(1e-3, TL[j] - TL[j - 1]), t = Math.min(1, (s - TL[j - 1]) / L), dx = (TX[j] - TX[j - 1]) / L, dz = (TZ[j] - TZ[j - 1]) / L, k = lat * (1 - 0.65 * sstep(0, TL[12], s));
    const x = TX[j - 1] + (TX[j] - TX[j - 1]) * t - dz * k, z = TZ[j - 1] + (TZ[j] - TZ[j - 1]) * t + dx * k, hz = z - DR.z;
    let y = roadY(x, z);
    // (a figure stands on a tread while it is over it, and steps up to it over the last metre before its edge: the ground falls away before the door)
    for (const [z0, z1, hw, top] of DR.steps) y = Math.max(y, DR.y + top - 0.9 * Math.hypot(Math.max(0, Math.abs(x - DR.x) - hw), Math.max(0, z0 - hz, hz - z1)));
    if (hz < DR.steps[0][0]) y = Math.max(y, DR.y + DR.steps[0][3]);
    out[0] = x; out[1] = y; out[2] = z; out[3] = Math.atan2(dx, dz); return out;
  };
  let mTide = null; const t4 = [0, 0, 0, 0];
  if (late.tide) { const tr = late.tide, NTD = Math.round(Math.min(280 / 190, dens) * (TIDE_CLIMB + TIDE_PLAIN * HILL_PACE) / HILL_GAP);
    mTide = instanced(figureSoup(false), mat, NTD);
    for (let i = 0; i < NTD; i++) { tide.push({ d0: TIDE_SPAN * tr(), lat: (tr() - 0.5) * 4.4, ph: tr() * 6.283, spd: 1.2 + 0.4 * tr(), sc: 0.88 + 0.22 * tr() }); tintOf(mTide, i, tr); }
    if (mTide.instanceColor) mTide.instanceColor.needsUpdate = true; object.add(mTide); lateTris += mTide.userData.triangles; }
  // ---- the fishers' mole: a stone pier run straight out from the shore (which lies east and west here), due north from the foot of the slope straight
  // below the dome; boats moored along both its sides, people standing on it with their faces to the cluster's heart (no lamp among them)
  const moored = [];
  if (late.jetty) { const jr = late.jetty, M0 = MOLE, rot = Math.PI, J = soup(), stoneJ = lin('#8a8474'), LEN = MOLE_LEN;
    const at = (d, lat) => [M0[0] + lat, M0[1] - d];
    for (let d = -10; d < LEN; d += 8) { const q = at(d + 4, (jr() - 0.5) * 0.3), k = 0.9 + 0.2 * jr(); box(J, q[0], -5.5, q[1], 5.4, 6.6 + 0.12 * jr(), 8.3, mul(stoneJ, k * 0.4), rot, 0.97, mul(stoneJ, k * 0.5), 0.6);      // (dark wet stone: by starlight the mole is a dark line on the water, and what shows on it is its fires)
      for (const sd of [-1, 1]) { const b = at(d + 4, sd * 2.3); box(J, b[0], 1.1, b[1], 0.34, 0.55, 0.34, [0.1, 0.09, 0.08], rot); } }
    { const q = at(LEN + 2, 0); drum(J, q[0], -5.5, q[1], 5.4, 4.8, 7.0, 12, mul(stoneJ, 0.45), 1, mul(stoneJ, 0.5)); drum(J, q[0], 1.5, q[1], 0.5, 0.4, 2.2, 6, [0.12, 0.1, 0.09], 1); }
    const mole = toMesh(J, mat); object.add(mole); lateTris += mole.userData.triangles;
    const NM = 9, mMoor = instanced(boatS, mat, NM);
    for (let i = 0; i < NM; i++) { const sd = i % 2 ? -1 : 1, d = 16 + (LEN - 26) * (i + jr()) / NM, q = at(d, sd * (4.6 + 0.8 * jr())), yaw = rot + (jr() < 0.5 ? 0 : Math.PI) + (jr() - 0.5) * 0.3, sc = 0.8 + 0.35 * jr();
      setYaw(mMoor, i, q[0], LAKE_Y + 0.02, q[1], yaw, sc); moored.push({ x: q[0], z: q[1], yaw, sc, d }); }
    mMoor.instanceMatrix.needsUpdate = true; object.add(mMoor); lateTris += mMoor.userData.triangles;
    const NPm = Math.round(13 * Math.min(1.4, dens)), mPier = instanced(figureSoup(false), mat, NPm), hd = clock.heartDir, face = Math.atan2(hd.x, hd.z);
    for (let i = 0, g = [0, 0]; i < NPm; i++) { if (i % 3 === 0) g = [8 + (LEN - 6) * jr(), (jr() - 0.5) * 2.4]; const q = at(g[0] + (jr() - 0.5) * 1.8, g[1] + (jr() - 0.5) * 1.6);
      setYaw(mPier, i, q[0], 1.1, q[1], face + (jr() - 0.5) * 0.7, 0.9 + 0.2 * jr()); tintOf(mPier, i, jr); }
    mPier.instanceMatrix.needsUpdate = true; if (mPier.instanceColor) mPier.instanceColor.needsUpdate = true; object.add(mPier); lateTris += mPier.userData.triangles; }
  // ---- the mole made whole (fix round 2, A3), all from a stream of its own (moleWorks). Seen from the air a bare pier is a grey bar; what makes it a
  // pier is what stands on it and where it comes ashore: a parapet along its weather side, a kerb and three flights of steps down to the boats on the
  // other, the paved hard where it meets the beach with two boat sheds beside it, and fire. The fire is the people's answer to the dark, so it is
  // kindled only after the snap: it is carried out along the mole from the shore while the stars cross the sky (the first cresset as the wave sets
  // out, the beacon on the head as the night is full), and every third moored boat lights a bow torch as it passes. Each fire has its image in the water.
  const MF = [], GL = [];      // fires { x, y, z, w, h, ph, k (the route metre it is kindled at), b (brightness) }; firelight on the stone { x, y, z, sx, sz, ph, k }
  if (late.jetty && late.moleWorks) { const mr = late.moleWorks, M2 = soup(), stoneJ = lin('#8a8474'), stoneK = lin('#6f6a5d'), iron = [0.05, 0.045, 0.045], dk = [0.012, 0.01, 0.01], LEN = MOLE_LEN;
    const at = (d, lat) => [MOLE[0] + lat, MOLE[1] - d], lit = (d) => clock.waveAt + clock.waveLen * (0.15 + 0.85 * sat(d / (LEN + 2)));
    for (let d = -6; d < LEN - 2; d += 4) { const k = 0.8 + 0.3 * mr(), hgt = 0.85 + 0.15 * mr(); if (mr() < 0.12) continue; const q = at(d + 2, -2.45); box(M2, q[0], 1.1, q[1], 0.5, hgt, 4.05, mul(stoneK, k), 0, 0.92, mul(stoneJ, k * 1.15), 0.7); }
    for (let d = -6; d < LEN - 2; d += 8) { const q = at(d + 4, 2.55); box(M2, q[0], 1.1, q[1], 0.3, 0.22, 7.6, mul(stoneK, 0.9), 0, 1, mul(stoneJ, 1.05)); }
    for (let f = 0; f < 3; f++) { const d0 = LEN * (f + 0.3 + 0.4 * mr()) / 3; for (let j = 0; j < 5; j++) { const q = at(d0 + j * 0.8, 3.3); box(M2, q[0], -5.5, q[1], 1.3, 6.5 - j * 0.24, 0.82, mul(stoneK, 0.85), 0, 1, mul(stoneJ, 0.95)); } }
    // the hard: big slabs laid up the beach from the mole's root, widening to where the way from the gap in the trees comes down
    for (let d = -10; d > -46; d -= 6) { const wdt = 5.6 + (-10 - d) * 0.22; for (let c = -1; c <= 1; c++) { const q = at(d - 3, c * wdt / 3 + (mr() - 0.5) * 0.4), k = 0.78 + 0.3 * mr();
      box(M2, q[0], landH(q[0], q[1]) - 0.5, q[1], wdt / 3 - 0.15, 0.62, 5.8, mul(stoneK, k * 0.8), (mr() - 0.5) * 0.05, 1, mul(stoneJ, k)); } }
    // two boat sheds beside the hard: low stone, slate roofs, their dark doors toward the water
    for (const sd of [-1, 1]) { const q = at(-20 - 8 * mr(), sd * (11 + 3 * mr())), y = landH(q[0], q[1]) - 0.5, rot = Math.PI / 2 + (mr() - 0.5) * 0.3, cs = Math.cos(rot), sn = Math.sin(rot);
      box(M2, q[0], y, q[1], 10, 3.4, 6.5, mul(stoneJ, 0.85), rot, 1, stoneJ, 0.75); roof(M2, q[0], y + 3.4, q[1], 10, 6.5, 2.5, lin('#4a433c'), rot, mul(stoneJ, 0.8));
      box(M2, q[0] + 5.03 * cs, y + 0.2, q[1] - 5.03 * sn, 0.12, 2.7, 3.4, dk, rot, 1, dk, 1); }
    // cressets: an iron basket on a post, three along the kerb (one in each third of the mole, by the stream) and the beacon on the head's post
    const posts = []; for (let i = 0; i < 3; i++) posts.push([LEN * (i + 0.2 + 0.6 * mr()) / 3, 2.2, false]); posts.push([LEN + 2, 0, true]);
    let nFire = 0;      // (hand mend M2) each fire on a post or at a bow has a number: its flame, its image in the water and its light on the stone are one fire
    for (const [d, lat, head] of posts) { const q = at(d, lat), y0 = head ? 3.7 : 3.2, ph = mr(), k = lit(d);
      if (!head) box(M2, q[0], 1.1, q[1], 0.14, 2.1, 0.14, iron);
      box(M2, q[0], y0, q[1], head ? 0.7 : 0.5, 0.42, head ? 0.7 : 0.5, iron, 0.4, 1.35, dk, 1);
      if (head && late.moleFires) continue;      // (fix round 3, D3: no beacon at the head; its post stands unlit)
      MF.push({ x: q[0], y: y0 + 0.3, z: q[1], w: head ? 2.2 : 1.4, h: head ? 3.6 : 2.4, ph, k, b: 1, f: nFire });
      MF.push({ x: q[0] + (head ? 0 : 1.4), y: LAKE_Y + 0.05, z: q[1] - (head ? 6.4 : 0), w: head ? 1.9 : 1.3, h: head ? -7 : -5, ph, k, b: 0.42, f: nFire });
      GL.push({ x: MOLE[0], y: head ? 1.56 : 1.27, z: q[1], sx: head ? 5.2 : 2.65, sz: head ? 5.2 : 11, ph, k, g: 1, f: nFire });
      nFire++; }
    moored.forEach((b, i) => { if (i % 3 !== 1) return; const c = Math.cos(b.yaw) * b.sc, sn = Math.sin(b.yaw) * b.sc, x = b.x + 0.46 * c + 3.3 * sn, z = b.z - 0.46 * sn + 3.3 * c, ph = mr(), k = lit(b.d);
      MF.push({ x, y: LAKE_Y + 0.02 + 3.0 * b.sc, z, w: 0.8, h: 1.3, ph, k, b: 0.9, f: nFire }); MF.push({ x, y: LAKE_Y + 0.05, z, w: 1.0, h: -5.5, ph, k, b: 0.42, f: nFire });
      nFire++; });
    // (fix round 3, D3; stream moleFires) what burns on the mole is what was to hand in that minute, so no two fires are alike and they do not stand
    // in a row: two heaps of nets set alight where they lay (anywhere along the mole), and every fire of its own size. (hand mend M2) One draw for one
    // fire: a heap's size is its own draw; each fire on a post or at a bow takes one more, and its flame, the width and the length of its image in the
    // water and its light on the stone all take that one number.
    if (late.moleFires) { const mf = late.moleFires;
      for (let i = 0; i < 2; i++) { const d = LEN * (0.08 + 0.84 * mf()), q = at(d, (mf() - 0.5) * 2.6), sz = 0.7 + 0.9 * mf(), ph = mf(), k = lit(d);
        box(M2, q[0], 1.1, q[1], 1.6 * sz, 0.5 * sz, 1.3 * sz, dk, mf() * 3.14, 0.6);
        MF.push({ x: q[0], y: 1.1 + 0.4 * sz, z: q[1], w: 1.5 * sz, h: 1.9 * sz, ph, k, b: 0.9, f: -1 });
        GL.push({ x: MOLE[0], y: 1.27, z: q[1], sx: 2.65, sz: 9, ph, k, g: sz, f: -1 }); }
      const G = []; for (let i = 0; i < nFire; i++) G.push(0.6 + 0.95 * mf());
      for (const f of MF) if (f.f >= 0) { f.w *= G[f.f]; f.h *= G[f.f]; }
      for (const g of GL) if (g.f >= 0) g.g = G[g.f]; }
    const works = toMesh(M2, mat); object.add(works); lateTris += works.userData.triangles; }
  // the firelight on the mole's stone: flat patches of warm light on its top round each cresset, raised with their fire
  const glowU = { uM: { value: 0 }, uT: { value: 0 } };
  if (GL.length) { const gg = new THREE.InstancedBufferGeometry(), gc = new Float32Array(GL.length * 4), gs = new Float32Array(GL.length * 4);
    // (the light on the stone is as long as its fire is big: the patch's length along the mole and the pool in it take the fire's number; its width is the mole's)
    GL.forEach((g, i) => { gc.set([g.x, g.y, g.z, g.k], i * 4); gs.set([g.sx, g.sz * g.g, g.ph, g.g], i * 4); });
    gg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); gg.setIndex([0, 1, 2, 0, 2, 3]);
    gg.setAttribute('aC', new THREE.InstancedBufferAttribute(gc, 4)); gg.setAttribute('aS', new THREE.InstancedBufferAttribute(gs, 4)); gg.instanceCount = GL.length;
    const gm = new THREE.Mesh(gg, new THREE.ShaderMaterial({ uniforms: glowU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`attribute vec4 aC, aS; uniform float uM, uT; varying vec2 vQ, vD; varying float vK;
        void main(){ vQ = position.xy; vD = position.xy*aS.xy/max(aS.w, 0.3); vK = smoothstep(aC.w, aC.w + 17.0, uM)*(0.82 + 0.18*sin(uT*8.3 + aS.z*40.0)*sin(uT*2.9 + aS.z*17.0));
          gl_Position = projectionMatrix*viewMatrix*vec4(aC.x + position.x*aS.x, aC.y, aC.z + position.y*aS.y, 1.0); if (vK < 0.003) gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }`,
      fragmentShader: /* glsl */`varying vec2 vQ, vD; varying float vK;
        // (a pool a few metres across under each fire, in metres of stone and not in parts of the patch: dark stone between one fire and the next)
        void main(){ float d2 = clamp(dot(vD, vD), 0.0, 400.0), e = 1.0 - smoothstep(0.72, 1.0, max(abs(vQ.x), abs(vQ.y))); gl_FragColor = vec4(vec3(0.8, 0.34, 0.08)*((0.5*exp(-d2/7.0) + 0.1*exp(-d2/34.0))*e*vK), 1.0); }` }));
    gm.frustumCulled = false; gm.renderOrder = 5; object.add(gm); lateTris += GL.length * 2; }
  // ---- wooded isles in the lake: low dark backs with a few firs, drawn anywhere over the water from 550 m west to 700 m east of the avenue's line and
  // from 230 m off the shore below the dome outward (thinner with distance); every isle takes all its draws before the water is asked for
  if (late.isles) { const ir = late.isles, shore = MOLE[1] - 4, I = soup(), earth = [0.1, 0.11, 0.085], fir = [0.04, 0.07, 0.045], got = [], q = new Float64Array(75);
    for (let tries = 0; got.length < 7 && tries < 200; tries++) {
      for (let j = 0; j < 75; j++) q[j] = ir();
      const x = -550 + 1250 * q[0], z = shore - 230 - 1250 * Math.pow(q[1], 1.2), r = 30 + 60 * q[2], rise = 0.07 + 0.08 * q[3];
      if (landH(x, z) > -4 || landH(x + r, z) > -4 || landH(x - r, z) > -4 || landH(x, z - r) > -4 || got.some((g) => Math.hypot(g[0] - x, g[1] - z) < g[2] + r + 60)) continue;
      got.push([x, z, r]); domeCap(I, x, -0.5, z, r, rise, 14, earth);
      for (let k = 0, n = 5 + Math.floor(q[4] * 10); k < n; k++) { const o5 = 5 + k * 5, a = q[o5] * 6.283, rho = r * 0.72 * Math.sqrt(q[o5 + 1]), sc = 1.1 + 1.0 * q[o5 + 2];
        drum(I, x + Math.cos(a) * rho, -0.7 + rise * Math.sqrt(r * r - rho * rho), z + Math.sin(a) * rho, 2.4 * sc, 0.12, 13 * sc, 6, mul(fir, 0.8 + 0.4 * q[o5 + 3]), 0); }
    }
    const isles = toMesh(I, mat); object.add(isles); lateTris += isles.userData.triangles; }
  // ---- a dry-stone wall on the downhill side of the ridge road, broken here and there, from the first bend up to the observatory's terrace
  if (late.wall) { const wr2 = late.wall, Wl = soup(), stoneW = lin('#857f70');
    for (let i = 4; i < ROAD.length - 2; i++) { const a = ROAD[i], b = ROAD[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), rot = Math.atan2(dx, dz), side = landH(a[0] - dz / l * 6, a[1] + dx / l * 6) < landH(a[0] + dz / l * 6, a[1] - dx / l * 6) ? 1 : -1;
      for (let d = 5; d < l - 5; d += 2.5) { if (wr2() < 0.13) { d += 2.5 * Math.floor(wr2() * 3); continue; }
        const x = a[0] + dx / l * d - dz / l * side * 3.6, z = a[1] + dz / l * d + dx / l * side * 3.6, k = 0.85 + 0.3 * wr2();
        box(Wl, x, landH(x, z) - 0.25, z, 0.55, 1.0 + 0.3 * wr2(), 2.6, mul(stoneW, k * 0.8), rot + (wr2() - 0.5) * 0.06, 0.9, mul(stoneW, k * 1.1), 0.7); } }
    const wall = toMesh(Wl, mat); object.add(wall); lateTris += wall.userData.triangles; }

  // ---- the flames: every torch, the ricks (on a rare afternoon), the far city's fires and their reflections in the lake
  const ricks = rare ? o.built.ricks : [], fires = o.built.fires.slice(0, 60);
  const RK = 6, NT = carriers.length, NR = ricks.length * RK, NC = fires.length * 2, NBT = BT.length * 2, NMF = MF.length, NF = NT + NR + NC + NBT + NMF;
  const aPos = new Float32Array(NF * 4), aSz = new Float32Array(NF * 4);
  const flr = ST.flames, F0 = clock.cityAt;
  for (let i = 0; i < NT; i++) { aSz[i * 4] = 0.5; aSz[i * 4 + 1] = 0.85; aSz[i * 4 + 2] = flr(); aSz[i * 4 + 3] = 0; }
  BT.forEach((b, i) => { for (let j = 0; j < 2; j++) { const o4 = (NT + NR + NC + i * 2 + j) * 4; aSz[o4] = j ? 1.0 : 0.8; aSz[o4 + 1] = j ? -6.5 : 1.3; aSz[o4 + 2] = b.ph / 6.283; aSz[o4 + 3] = 0; } });
  ricks.forEach((r, i) => { for (let j = 0; j < RK; j++) { const o4 = (NT + i * RK + j) * 4, a = flr() * 6.283, rr = r.r * 0.75 * Math.sqrt(flr()), big = j === 0 ? 1 : 0.35 + 0.5 * flr();
    aPos[o4] = r.x + Math.cos(a) * rr * (j ? 1 : 0); aPos[o4 + 1] = r.y - 1.4 - 1.6 * flr() * (j ? 1 : 0); aPos[o4 + 2] = r.z + Math.sin(a) * rr * (j ? 1 : 0); aSz[o4] = 3.6 * big + 0.8; aSz[o4 + 1] = (6.5 + 3 * flr()) * big + 1.2; aSz[o4 + 2] = flr(); aSz[o4 + 3] = 0.22; } });
  fires.forEach((f, i) => { for (let j = 0; j < 2; j++) { const o4 = (NT + NR + i * 2 + j) * 4; aPos[o4] = f.x; aPos[o4 + 1] = j ? 0.4 : f.y; aPos[o4 + 2] = f.z - (j ? 4 : 0); aSz[o4] = f.r * 2.6; aSz[o4 + 1] = j ? -f.r * 6 : f.r * 3.8; aSz[o4 + 2] = flr(); aSz[o4 + 3] = 1; } f.k = F0 + (RP.SH - F0) * Math.pow(i / Math.max(1, fires.length - 1), 1.3); });
  MF.forEach((f, i) => { const o4 = (NT + NR + NC + NBT + i) * 4; aPos[o4] = f.x; aPos[o4 + 1] = f.y; aPos[o4 + 2] = f.z; aSz[o4] = f.w; aSz[o4 + 1] = f.h; aSz[o4 + 2] = f.ph; aSz[o4 + 3] = 0; });
  // (the city's fires catch one after another between the clock's first fire and the lake's shore, each growing over 80 m of flight: the clock's burning, fire by fire)
  const fg = new THREE.InstancedBufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); fg.setIndex([0, 1, 2, 0, 2, 3]);
  const posAttr = new THREE.InstancedBufferAttribute(aPos, 4); posAttr.setUsage(THREE.DynamicDrawUsage);
  fg.setAttribute('aPos', posAttr); fg.setAttribute('aSz', new THREE.InstancedBufferAttribute(aSz, 4)); fg.instanceCount = NF;
  const FU = { uWindT: { value: new THREE.Vector4(o.wind?.[0] ?? 0.94, o.wind?.[1] ?? 0.34, 0.3, 0) } };
  const flames = new THREE.Mesh(fg, new THREE.ShaderMaterial({ uniforms: FU, vertexShader: FLAME_VS, fragmentShader: FLAME_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
  flames.frustumCulled = false; flames.renderOrder = 6; object.add(flames);

  // the pools of lamplight on the ground: one for each lamp in the cast's own order (the last place in the list is the world's: the observatory's door)
  const pools = o.torchUniform, NPL = pools.length - 1;
  // the road is an endless procession on the world's clock: people come up from far down the avenue (behind where the flight
  // begins), walk at 1.3 m/s and go in at the observatory's door, so the stream looks the same at any moment
  let now = 0;
  const place = (mesh, w, i) => {
    if (w.fix) { setYaw(mesh, i, w.x, w.y, w.z, w.yaw + 0.07 * Math.sin(now * 0.6 + w.ph), w.sc); return 1; }
    const span = w.end - LO, d = LO + (((w.d0 - LO + 1.3 * w.spd * now) % span) + span) % span, q = roadAt(d, r4), x = q[0] - q[3] * w.lat, z = q[1] + q[2] * w.lat;
    const vis = sstep(0, 2.5, d - LO) * sstep(0, 3, w.end - d);
    setYaw(mesh, i, x, roadY(x, z) + 0.035 * Math.abs(Math.sin(now * 5.2 + w.ph)), z, Math.atan2(q[2], q[3]) + 0.06 * Math.sin(now * 2.6 + w.ph), Math.max(0.001, w.sc * vis));
    return vis;
  };
  const tri0 = lateTris + stookTris + (mPlain.userData.triangles + mCarry.userData.triangles + mHarv.userData.triangles + mCattle.userData.triangles + mBoat.userData.triangles + mCart.userData.triangles) + NF * 2;
  return {
    object, triangles: tri0, torches: NT, fires, ricks,
    // m: metres along the route (torches, cattle, fires); time: the world's clock (walking, flicker); st: the sky clock's state; cam: where the eye is
    update(u, m, time, st, cam, size) {
      now = time;
      for (let i = 0; i < plain.length; i++) place(mPlain, plain[i], i);
      if (mTide) {
        for (let i = 0; i < tide.length; i++) { const w = tide[i], tau = (((w.d0 + 1.3 * w.spd * now) % TIDE_SPAN) + TIDE_SPAN) % TIDE_SPAN, q = tideAt(tau < TIDE_PLAIN ? TIDE_LO + tau : TIDE_HILL + (tau - TIDE_PLAIN) * HILL_PACE, w.lat, t4);
          setYaw(mTide, i, q[0], q[1] + 0.04 * Math.abs(Math.sin(now * 6.4 + w.ph)), q[2], q[3] + 0.06 * Math.sin(now * 2.6 + w.ph), w.sc); }
        mTide.instanceMatrix.needsUpdate = true; }
      for (let i = 0; i < NT; i++) {
        const w = carriers[i], vis = place(mCarry, w, i), e = mCarry.instanceMatrix.array, o16 = i * 16, o4 = i * 4;
        const on = sstep(w.k, w.k + 14, m) * vis;
        // the torch's head, above the raised hand
        const tx = e[o16 + 12] + 0.27 * e[o16] + 0.02 * e[o16 + 8], ty = e[o16 + 13] + 2.42 * e[o16 + 5], tz = e[o16 + 14] + 0.27 * e[o16 + 2] + 0.02 * e[o16 + 10];
        aPos[o4] = tx; aPos[o4 + 1] = ty; aPos[o4 + 2] = tz; aPos[o4 + 3] = on * (0.75 + 0.25 * sstep(w.k, w.k + 57, m));
      }
      // (second hand mend, N2a; the last thing, Q1) every lamp that is carried has its pool on the ground, as strong as its flame burns: no choice by
      // the eye, no fade with distance from it, and no pool where no flame is. A pool reaches 2 m at the most and never more than 0.45 of the way to
      // the nearest other lamp, so two neighbours' pools do not meet; two bearers closer than 1.8 m to each other share one small spot (no pool is
      // drawn smaller than 0.8 m, so that a bearer is not left dark under his own torch).
      for (let i = 0; i < Math.min(NT, NPL); i++) { const o4 = i * 4, x = aPos[o4], z = aPos[o4 + 2]; let d2 = 1e9;
        for (let j = 0; j < NT; j++) if (j !== i) { const dx = aPos[j * 4] - x, dz = aPos[j * 4 + 2] - z; d2 = Math.min(d2, dx * dx + dz * dz); }
        const reach = Math.min(2, Math.max(0.8, 0.45 * Math.sqrt(d2)));
        pools[i].set(x, z, aPos[o4 + 3] * (0.85 + 0.15 * Math.sin(time * 8.3 + carriers[i].ph)), 1 / (reach * reach)); }
      mPlain.instanceMatrix.needsUpdate = true; mCarry.instanceMatrix.needsUpdate = true;
      // harvesters: the swing of the work, then stillness, turned to the red sun
      const sun = st.suns[5].dir, sunYaw = Math.atan2(sun.x, sun.z);
      for (let i = 0; i < H.length; i++) {
        const h = H[i], stop = sstep(h.k, h.k + 40, m);
        setYaw(mHarv, i, h.x, h.y, h.z, (h.yaw + 0.55 * Math.sin(time * 1.5 + h.ph)) * (1 - stop) + sunYaw * stop, h.sc);
      }
      mHarv.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < C.length; i++) { const c = C[i], lie = sstep(c.k, c.k + 34, m); setYaw(mCattle, i, c.x, c.y - 0.6 * lie * c.sc, c.z, c.yaw, c.sc); }
      mCattle.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < NCART; i++) {
        const c = carts[i], d = LO + (((c.d0 - LO + 0.75 * time) % CSPAN) + CSPAN) % CSPAN, q = roadAt(d, r4), x = q[0] - q[3] * c.lat, z = q[1] + q[2] * c.lat;
        setYaw(mCart, i, x, roadY(x, z) + 0.02 * Math.sin(time * 3.1 + c.ph), z, Math.atan2(q[2], q[3]), Math.max(0.001, sstep(0, 4, d - LO) * sstep(0, 5, ROAD_LEN - 8 - d)));
      }
      mCart.instanceMatrix.needsUpdate = true;
      // fire: the ricks at the ridge foot (a rare afternoon, from the snap), then the city, fire by fire; the mole's cressets and bow torches
      // (fire answers the dark: the first rick catches as the last thread goes and is ablaze by the time the first stars are out; the fire runs to the next
      // rick every quarter of the star wave's length flown)
      const WV = clock.waveLen, rk = sstep(MG, MG + WV / 7 + WV / 14, m);
      for (let i = 0; i < NR; i++) aPos[(NT + i) * 4 + 3] = rk * (0.62 + 0.2 * Math.sin(time * 1.3 + aSz[(NT + i) * 4 + 2] * 6.283)) * sstep(0, WV / 4, m - MG - WV / 4 * Math.floor(i / RK));
      if (o.blazeUniform && ricks.length) { const r0 = ricks[Math.min(1, ricks.length - 1)]; o.blazeUniform.set(r0.x + 4, r0.z - 4, rk * (1.5 + 0.25 * Math.sin(time * 7.1 + aSz[NT * 4 + 2] * 6.283) * Math.sin(time * 2.9 + aSz[NT * 4 + 6] * 6.283)), 1 / (30 * 30)); }
      for (let i = 0; i < fires.length; i++) { const f = fires[i], on = sstep(f.k, f.k + 80, m), o4 = (NT + NR + i * 2) * 4; aPos[o4 + 3] = on * 0.9; aPos[o4 + 7] = on * 0.55; }
      // the boats ride the ripples and swing slowly at their moorings; each bow torch has its long reflection under it
      for (let i = 0; i < BT.length; i++) {
        const b = BT[i], yaw = b.yaw + 0.22 * Math.sin(time * 0.13 + b.ph), x = b.x + 5 * Math.sin(time * 0.05 + b.ph), z = b.z + 5 * Math.cos(time * 0.043 + b.ph * 1.7), y = LAKE_Y + 0.1 * Math.sin(time * 0.9 + b.ph);
        setYaw(mBoat, i, x, y, z, yaw, b.sc);
        const c = Math.cos(yaw) * b.sc, sn = Math.sin(yaw) * b.sc, o4 = (NT + NR + NC + i * 2) * 4, on = sstep(b.k, b.k + 17, m);
        aPos[o4] = x + 0.46 * c + 3.3 * sn; aPos[o4 + 1] = y + 3.0 * b.sc; aPos[o4 + 2] = z - 0.46 * sn + 3.3 * c; aPos[o4 + 3] = on * 0.9;
        aPos[o4 + 4] = aPos[o4]; aPos[o4 + 5] = LAKE_Y + 0.05; aPos[o4 + 6] = aPos[o4 + 2]; aPos[o4 + 7] = on * 0.42;
      }
      mBoat.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < NMF; i++) { const f = MF[i]; aPos[(NT + NR + NC + NBT + i) * 4 + 3] = sstep(f.k, f.k + 17, m) * f.b; }
      glowU.uM.value = m; glowU.uT.value = time;
      posAttr.needsUpdate = true;
      FU.uWindT.value.z = 0.16 + 0.22 * st.wind; FU.uWindT.value.w = time;
    },
  };
}
