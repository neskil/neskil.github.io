// HERO SET PIECE for "lantern-river": the Lantern Pagoda on its island, with its mirror image in the water.
//
// WHAT IT IS
//   A nine-tier, ~70 m timber pagoda (per seed: 4, 6 or 8 sided) on a walled stone island. Every tier has
//   glowing paper windows, lacquer columns, a railed balcony, rafters lit from below and a swept, upturned
//   tile roof; ~400 red paper lanterns hang along the eaves and sway. A gilt ringed finial tops it. On the
//   island: stone podium with stairs, stone lamps, cherry trees, strings of festival lights running from the
//   second roof down to poles on the rim, a landing on the river side (+Z) and a red torii standing in the
//   water off the landing. Underneath is a REAL y-mirrored copy of all of it (emissive-weighted, dimmed,
//   rippling in the vertex shader) seen through a patch of dark water. The island's own lantern release
//   (modelled amber sky lanterns + glow points, with mirror images) and gold/red fireworks behind the tower
//   are included and can be switched off.
//
// LOCAL SPACE   origin = centre of the island at the WATERLINE (y = 0 is the water surface), +Y up, the
//   landing / torii / main door face +Z (put +Z toward the river channel). The camera should pass on the +Z
//   side travelling from -X to +X so the pagoda is on its left.
//
// OPTS
//   palette     7 hex strings in brief order [night blue, cobalt, violet, ink, timber, lantern amber, lantern red]
//   sides       4 | 6 | 8 plan (default per seed)
//   water       true (default): draw the piece's own water disc + dark bed so the mirror shows. Pass false if
//               the world supplies the water; that water MUST be transparent (alpha <= ~0.6, depthWrite off)
//               or the mirrored copy under it is hidden.
//   waterRadius radius of that disc in metres (default 2600 = out to the horizon; it fades out over its outer
//               quarter, so a small value such as 120 gives a patch that blends onto transparent world water)
//   release     true (default): the island's rising lanterns. false: none (world uses its own fx).
//   fireworks   'auto' (default: shells open on the far side of the tower from the camera) | 'fixed' (always
//               at -Z) | false
//   progress    initial release progress 0..1 (default 0.78 so the standalone piece shows the lantern galaxy;
//               the world should call setProgress every frame)
//
// RETURNS (besides the contract fields)
//   setProgress(p)  p = 0..1 across the release (map world u 0.5..0.75 to 0..1; before that pass 0). At 0 no
//                   sky lantern is visible; they light and lift off in a staggered wave and ease into a slow
//                   swirl 10-95 m up. Purely a function of p (ambient bob and swirl run on time).
//   setLight({ skyColor, groundColor, moonDir, moonColor, waterColor, horizonColor })   any subset.
//   uniforms        shared uniform block. info: per-seed values actually used.
//   setU(u), setWater({...}), kit.{hung, rising, glows}   hooks for the world: see the comments at the return statement.
//
// ANCHORS (local space)
//   gaze            point for the camera poi (middle tiers)
//   flyBy           ordered camera points for the pass round the bend (-X -> +X, 50 m from the axis at the
//                   closest, y 17-22): >= 30 m from the eaves, >= 12 m from the torii. Rising sky lanterns
//                   (1.2 m paper shells) do drift across this line: the camera is meant to climb through them.
//   viewpoints      { entry, low, mid, high } good camera positions looking at `gaze`
//   clearance       { minCameraDistance, eaveRadius, islandRadius }
//   portalSeat      null: in this world the portal sits in the Moon Bridge, not on the island
//   landing, torii  the boat landing and the water torii (positions)
//   releasePoints   launch points of the island wave (for extra world fx / real lights)
//   lightSpots      good positions for the world's warm PointLights
//   fireworks       three shell centres behind the tower (for a kit firework system if ours is off)
//   tiers           [{ y, eaveY, eaveRadius, bodyRadius }] per storey
//
// SIZE   island ~56 x 44 m, tower 70 m; reported radius 50 (includes the lantern field), height 70.
// COST   95k-110k triangles depending on the plan (`info.triangles`; ~30k tower+island, the same again for
//        the mirror, 29k hung lanterns, 13k sky lanterns), 10 draw calls, no lights, no textures.
//        Build 150-300 ms with ctx.yield() breaks.
// ORDER  bed (renderOrder -0.8, no depth write) -> mirror (opaque) -> mirrored glows (1) -> fireworks (1.5)
//        -> water (2) -> haze (3) -> glows (4). World water replacing ours should sit at renderOrder 2.
// LIGHT  Self-lit ShaderMaterials (they ignore scene lights; scene fog is honoured): cool hemisphere
//        ambient + a moon direction + warm light from its own lanterns and windows baked per vertex.
//        Wants blue hour / night, bloom threshold ~0.9, light warm fog. Call setLight with the sky kit's values.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#0b1640', '#2b4a9a', '#6a5f9a', '#1c1a2a', '#3a2a2a', '#ffb35a', '#ff4d3d'];
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- small helpers
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mulc = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

// material ids understood by the solid shader
const M_PLAIN = 0, M_TILE = 1, M_WALL = 2, M_RAFTER = 3, M_STONE = 4, M_LEAF = 5, M_GLOW = 6, M_GOLD = 7, M_RAIL = 8;

let ICO = null;
function icoDirs() {
  if (!ICO) { const g = new THREE.IcosahedronGeometry(1, 1); ICO = Float32Array.from(g.attributes.position.array); g.dispose(); }
  return ICO;
}

// Indexed mesh accumulator: position, normal, colour (linear albedo), uv (pattern coords), material id.
class Builder {
  constructor() { this.p = []; this.n = []; this.c = []; this.uv = []; this.m = []; this.idx = []; this.count = 0; }
  v(x, y, z, nx, ny, nz, c, u, v, m) {
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(c[0], c[1], c[2]); this.uv.push(u, v); this.m.push(m);
    return this.count++;
  }
  // flat quad, corners counter-clockwise seen from outside; uv in metres from corner A
  quad(A, B, C, D, col, m, uo = 0, vo = 0) {
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = D[0] - A[0], vy = D[1] - A[1], vz = D[2] - A[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    const lu = Math.hypot(ux, uy, uz), lv = Math.hypot(vx, vy, vz);
    const a = this.v(A[0], A[1], A[2], nx, ny, nz, col, uo, vo, m), b = this.v(B[0], B[1], B[2], nx, ny, nz, col, uo + lu, vo, m);
    const c = this.v(C[0], C[1], C[2], nx, ny, nz, col, uo + lu, vo + lv, m), d = this.v(D[0], D[1], D[2], nx, ny, nz, col, uo, vo + lv, m);
    this.idx.push(a, b, c, a, c, d);
  }
  // smooth parametric patch; f(u,v) -> [x,y,z, r,g,b, uvx,uvy]; normal = dP/du x dP/dv (negated if flip)
  grid(nu, nv, f, m, flip = false, wrapU = false) {
    const W = nu + 1, H = nv + 1, P = new Array(W * H), base = this.count;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) P[j * W + i] = f(i / nu, j / nv);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const il = i > 0 ? i - 1 : (wrapU ? nu - 1 : 0), ir = i < nu ? i + 1 : (wrapU ? 1 : nu);
      const a = P[j * W + il], b = P[j * W + ir], c = P[Math.max(j - 1, 0) * W + i], d = P[Math.min(j + 1, nv) * W + i];
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - c[0], vy = d[1] - c[1], vz = d[2] - c[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz);
      if (l < 1e-9) { nx = 0; ny = flip ? -1 : 1; nz = 0; } else { const s = (flip ? -1 : 1) / l; nx *= s; ny *= s; nz *= s; }
      const q = P[j * W + i]; this.v(q[0], q[1], q[2], nx, ny, nz, q, q[6], q[7], m);   // q[0..2] reused as colour slot below
      const k = (this.count - 1) * 3; this.c[k] = q[3]; this.c[k + 1] = q[4]; this.c[k + 2] = q[5];
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * W + i, b = a + 1, c = a + W + 1, d = a + W;
      if (flip) this.idx.push(a, c, b, a, d, c); else this.idx.push(a, b, c, a, c, d);
    }
  }
  // surface of revolution about the vertical through (cx,cz); prof = [[r, y, colour], ...] from bottom to top
  lathe(prof, segs, cx, cz, m, rot = 0, uvx = 0) {
    const n = prof.length - 1;
    this.grid(segs, n, (u, v) => {
      const k = Math.round(v * n), q = prof[k], a = rot + u * TAU, c = q[2];
      return [cx + Math.sin(a) * q[0], q[1], cz + Math.cos(a) * q[0], c[0], c[1], c[2], uvx || u * segs, q[1]];
    }, m, false, true);
  }
  // rectangular section swept along a polyline; hw / hh may be numbers or functions of t (0..1)
  sweep(pts, hw, hh, col, m) {
    const n = pts.length, rings = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)], t = i / (n - 1);
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let sx = -tz, sz = tx; const sl = Math.hypot(sx, sz);
      if (sl < 1e-4) { sx = 1; sz = 0; } else { sx /= sl; sz /= sl; }
      const ux = -sz * ty, uy = sz * tx - sx * tz, uz = sx * ty;          // U = S x T  (S has no y)
      const w = typeof hw === 'function' ? hw(t) : hw, h = typeof hh === 'function' ? hh(t) : hh, p = pts[i];
      rings.push({ p, S: [sx, 0, sz], U: [ux, uy, uz], w, h });
    }
    const faces = [[1, 1, -1, 1, 0, 1], [-1, 1, -1, -1, -1, 0], [-1, -1, 1, -1, 0, -1], [1, -1, 1, 1, 1, 0]]; // s0,u0,s1,u1, nS,nU
    let dist = 0;
    const idxOf = [];
    for (let i = 0; i < n; i++) {
      const r = rings[i]; if (i > 0) dist += Math.hypot(r.p[0] - rings[i - 1].p[0], r.p[1] - rings[i - 1].p[1], r.p[2] - rings[i - 1].p[2]);
      const row = [];
      for (let f = 0; f < 4; f++) {
        const F = faces[f], nx = r.S[0] * F[4] + r.U[0] * F[5], ny = r.U[1] * F[5], nz = r.S[2] * F[4] + r.U[2] * F[5];
        for (let e = 0; e < 2; e++) {
          const s = F[e * 2] * r.w, u = F[e * 2 + 1] * r.h;
          row.push(this.v(r.p[0] + r.S[0] * s + r.U[0] * u, r.p[1] + r.U[1] * u, r.p[2] + r.S[2] * s + r.U[2] * u, nx, ny, nz, col, dist, f + e, m));
        }
      }
      idxOf.push(row);
    }
    for (let i = 0; i < n - 1; i++) for (let f = 0; f < 4; f++) {
      const a = idxOf[i][f * 2], b = idxOf[i][f * 2 + 1], c = idxOf[i + 1][f * 2 + 1], d = idxOf[i + 1][f * 2];
      this.idx.push(a, d, c, a, c, b);
    }
  }
  // axis-aligned-in-its-own-frame box: centre, half sizes, rotation about Y; flat faces (no bottom unless asked)
  box(cx, cy, cz, hx, hy, hz, rot, col, m, bottom = false, taper = 1) {
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const P = (x, y, z) => { const k = y > 0 ? taper : 1; x *= k; z *= k; return [cx + x * cs + z * sn, cy + y, cz - x * sn + z * cs]; };
    const a = P(-hx, -hy, hz), b = P(hx, -hy, hz), c = P(hx, hy, hz), d = P(-hx, hy, hz);
    const e = P(-hx, -hy, -hz), f = P(hx, -hy, -hz), g = P(hx, hy, -hz), h = P(-hx, hy, -hz);
    this.quad(a, b, c, d, col, m); this.quad(b, f, g, c, col, m); this.quad(f, e, h, g, col, m); this.quad(e, a, d, h, col, m);
    this.quad(d, c, g, h, col, m); if (bottom) this.quad(e, f, b, a, col, m);
  }
  // noisy icosphere blob (foliage, boulders); colFn(dir, r) -> colour
  blob(cx, cy, cz, rx, ry, rz, noise, amp, freq, colFn, m) {
    const D = icoDirs(), base = this.count, sd = cx * 0.37 + cz * 0.71 + cy * 0.13;
    for (let i = 0; i < D.length; i += 3) {
      const dx = D[i], dy = D[i + 1], dz = D[i + 2], r = 1 + amp * noise.n3(dx * freq + sd, dy * freq - sd, dz * freq + 2.3 * sd);
      const nl = Math.hypot(dx / rx, dy / ry, dz / rz) || 1;
      this.v(cx + dx * r * rx, cy + dy * r * ry, cz + dz * r * rz, dx / rx / nl, dy / ry / nl, dz / rz / nl, colFn(dy, r), dx * rx + cx, dz * rz + cz, m);
    }
    for (let i = 0; i < D.length / 3; i += 3) this.idx.push(base + i, base + i + 1, base + i + 2);
  }
  get triangles() { return this.idx.length / 3; }
}

// ---------------------------------------------------------------- the pagoda
function buildPagoda(B, rng, noise, C, opts) {
  const N = opts.sides || rng.pick([4, 4, 4, 6, 8]), T = 9, tanN = Math.tan(Math.PI / N);
  const apo = N === 4 ? 1 : N === 6 ? 1.1 : 1.16;
  const hw0 = rng.range(6.8, 7.6) * apo, hwTop = hw0 * rng.range(0.43, 0.5);
  const over0 = rng.range(4.7, 5.5) * (N === 4 ? 1 : 0.86), overTop = over0 * rng.range(0.66, 0.76);
  const LIFT = rng.range(1.4, 2.5) * (N === 4 ? 1 : 0.8), FLARE = N === 4 ? 0.055 : 0.035, BW = 1.25;
  const yTerrace = 2.2, yF = 3.6, topRise = rng.range(4.6, 5.6), finialH = 10.4;
  const bodySum = 70 - yF - topRise - finialH;
  const HW = [], RE = [], Y = [], PITCH = [];
  let y = yF, wsum = 0;
  for (let i = 0; i < T; i++) wsum += lerp(1.16, 0.84, i / (T - 1));
  for (let i = 0; i < T; i++) {
    const f = i / (T - 1);
    HW.push(lerp(hw0, hwTop, Math.pow(f, 0.92))); RE.push(HW[i] + lerp(over0, overTop, f));
    PITCH.push(lerp(1.16, 0.84, f) * bodySum / wsum); Y.push(y); y += PITCH[i];
  }
  const side = (k) => { const a = k * TAU / N; return [Math.sin(a), Math.cos(a), Math.cos(a), -Math.sin(a)]; };   // nx,nz,tx,tz
  const PP = (k, u, r) => { const s = side(k), hl = r * tanN * u; return [s[0] * r + s[2] * hl, s[1] * r + s[3] * hl]; };
  const polyGrid = (nu, nv, f, m) => { for (let k = 0; k < N; k++) B.grid(nu, nv, (u, v) => f(k, u * 2 - 1, v), m); };
  const nu = N === 4 ? 16 : N === 6 ? 10 : 8;
  const tile = mixc(C.ink, C.violet, 0.5), tileDark = mulc(tile, 0.6);
  const lacquer = mulc(mixc(C.red, C.timber, 0.35), 0.62), wood = mixc(C.timber, [0.26, 0.15, 0.09], 0.55);
  const plaster = [0.6, 0.54, 0.44], stone = mulc(mixc(C.violet, [0.32, 0.31, 0.3], 0.62), 0.85), gold = [0.74, 0.5, 0.17];
  const lanterns = [], sources = [], tiers = [], glows = [];
  const sumRE = RE.reduce((a, b) => a + b, 0);

  // stone podium with stairs
  const rPod = hw0 + BW + 1.7;
  polyGrid(1, 1, (k, u, v) => { const r = rPod + 0.5 * (1 - v), q = PP(k, u, r); const s = stone; return [q[0], lerp(yTerrace - 0.3, yF - 0.22, v), q[1], s[0], s[1], s[2], u * r * tanN + k * 37, v * 1.5]; }, M_STONE);
  polyGrid(1, 1, (k, u, v) => { const q = PP(k, u, rPod + 0.18); const s = mulc(stone, 1.15); return [q[0], yF - 0.22 + 0.22 * v, q[1], s[0], s[1], s[2], u * rPod * tanN + k * 11, 5 + v * 0.22]; }, M_STONE);
  polyGrid(1, 1, (k, u, v) => { const r = lerp(rPod + 0.18, hw0 - 0.1, v), q = PP(k, u, r); const s = mulc(stone, 1.05); return [q[0], yF, q[1], s[0], s[1], s[2], u * r * tanN + k * 5, r]; }, M_STONE);
  const stairSides = N === 4 ? [0, 1, 2, 3] : N === 6 ? [0, 3] : [0, 2, 4, 6];
  for (const k of stairSides) {
    const s = side(k), a = k * TAU / N;
    for (let st = 0; st < 5; st++) {
      const d = 0.42 * (st + 1) + 0.6, top = yF - st * 0.28, rc = rPod - 0.1 + d * 0.5, hy = (top - yTerrace + 0.3) * 0.5;
      B.box(s[0] * rc, top - hy, s[1] * rc, 1.8, hy, d * 0.5, a, mulc(stone, 1.1 - st * 0.03), M_STONE);
    }
    for (const sx of [-1, 1]) {
      const rc = rPod + 1.25;
      B.box(s[0] * rc + s[2] * sx * 2.1, yTerrace + 0.75, s[1] * rc + s[3] * sx * 2.1, 0.28, 1.05, 1.5, a, mulc(stone, 0.95), M_STONE, false, 0.9);
    }
  }

  for (let i = 0; i < T; i++) {
    const f = i / (T - 1), hw = HW[i], y0 = Y[i], bh = PITCH[i] * 0.56, re = RE[i], ye = y0 + bh + 0.3;
    const top = i === T - 1, rin = top ? 0.45 : HW[i + 1] + BW - 0.25, yt = top ? y0 + bh + topRise : Y[i + 1] - 0.12;
    const lift = LIFT * lerp(1, 0.78, f), bays = Math.max(1, Math.round(2 * hw * tanN / (N === 4 ? 2.9 : 2.5)));
    const rb = hw + BW, run = re - rin;
    const roofR = (t, c) => lerp(rin, re, t) * (1 + FLARE * t * t * c * c * c * c);
    const roofY = (t, c) => ye + (yt - ye) * Math.pow(1 - t, 2.1) + lift * t * t * c * c * c;
    const tint = 1 + 0.12 * noise.n2(i * 3.1, 7.7);
    // walls (paper windows are drawn by the shader in bay coordinates)
    polyGrid(1, 1, (k, u, v) => { const q = PP(k, u, hw); return [q[0], y0 + v * bh, q[1], plaster[0] * tint, plaster[1] * tint, plaster[2] * tint, (u * 0.5 + 0.5) * bays + 16 * (i * N + k), v]; }, M_WALL);
    // round lacquer columns at bay lines
    for (let k = 0; k < N; k++) for (let b = 0; b < bays; b++) {
      const q = PP(k, -1 + 2 * b / bays, hw + 0.1), rr = b === 0 ? 0.27 : 0.2;
      B.lathe([[rr * 1.1, y0, lacquer], [rr, y0 + bh * 0.5, lacquer], [rr * 0.94, y0 + bh, lacquer]], 6, q[0], q[1], M_PLAIN);
    }
    // balcony slab + railing
    if (i > 0) {
      polyGrid(1, 1, (k, u, v) => { const q = PP(k, u, lerp(rb, hw, v)); return [q[0], y0 + 0.02, q[1], wood[0], wood[1], wood[2], u * rb * tanN, v * BW]; }, M_RAFTER);
      polyGrid(1, 1, (k, u, v) => { const q = PP(k, u, rb); return [q[0], y0 - 0.32 + v * 0.34, q[1], lacquer[0], lacquer[1], lacquer[2], u * rb * tanN, v]; }, M_PLAIN);
      polyGrid(1, 1, (k, u, v) => { const q = PP(k, u, rb - 0.06); return [q[0], y0 + 0.02 + v * 1.05, q[1], lacquer[0], lacquer[1], lacquer[2], u * rb * tanN + 50, v]; }, M_RAIL);
    }
    // corbel band under the eaves, rafter soffit, fascia
    polyGrid(1, 2, (k, u, v) => { const r = hw + 0.06 + 0.72 * v, q = PP(k, u, r); const c = mulc(wood, 1.5); return [q[0], y0 + bh - 0.62 + 0.64 * Math.pow(v, 0.7), q[1], c[0], c[1], c[2], u * r * tanN * 1.6, v]; }, M_RAFTER);
    polyGrid(nu, 3, (k, u, v) => {
      const c = Math.abs(u), r = lerp(hw + 0.7, (re - 0.1) * (1 + FLARE * c * c * c * c), v), q = PP(k, u, r), w = mulc(mixc(wood, plaster, 0.35), 1.1);
      return [q[0], lerp(y0 + bh + 0.02, ye - 0.2, Math.pow(v, 1.5)) + lift * v * v * c * c * c, q[1], w[0], w[1], w[2], u * r * tanN, v * run];
    }, M_RAFTER);
    polyGrid(nu, 1, (k, u, v) => {
      const c = Math.abs(u), r = (re - 0.1 + 0.1 * v) * (1 + FLARE * c * c * c * c), q = PP(k, u, r);
      return [q[0], ye - 0.2 + 0.28 * v + lift * c * c * c, q[1], 0.5, 0.42, 0.3, u * r * tanN + 0.25, v];
    }, M_RAFTER);
    // tiled roof
    polyGrid(nu, top ? 9 : 7, (k, u, v) => {
      const t = 1 - v, c = Math.abs(u), r = roofR(t, c), q = PP(k, u, r);
      const n = 0.82 + 0.22 * noise.n3(q[0] * 0.35, q[1] * 0.35, i * 1.7) + 0.1 * t;
      return [q[0], roofY(t, c) + 0.08, q[1], tile[0] * n * tint, tile[1] * n * tint, tile[2] * n, u * r * tanN, t * run * 1.15];
    }, M_TILE);
    // hip ridges with upturned tips
    for (let k = 0; k < N; k++) {
      const pts = [];
      for (let j = 0; j <= 7; j++) { const t = j / 7, q = PP(k, 1, roofR(t, 1)); pts.push([q[0], roofY(t, 1) + 0.24, q[1]]); }
      const q = PP(k, 1, roofR(1, 1) * 1.04); pts.push([q[0], roofY(1, 1) + 0.75, q[1]]);
      B.sweep(pts, (t) => lerp(0.24, 0.13, t), (t) => lerp(0.22, 0.12, t), tileDark, M_PLAIN);
      glows.push([q[0], roofY(1, 1) + 0.2, q[1], 0.5]);            // wind-bell glint at each corner
    }
    // eave lanterns
    const nL = Math.max(2, Math.round(400 * re / sumRE / N));
    for (let k = 0; k < N; k++) for (let j = 0; j < nL; j++) {
      const u = -0.95 + 1.9 * (j + 0.5) / nL, c = Math.abs(u), q = PP(k, u, (re - 0.32) * (1 + FLARE * c * c * c * c));
      lanterns.push([q[0], ye - 0.28 + lift * c * c * c, q[1], rng() * TAU, rng.range(0.9, 1.1) * lerp(1.08, 0.92, f)]);
    }
    sources.push({ N, r: re - 0.32, y: ye - 1.0, col: C.lanternLight, I: 2.3, fall: 2.3, y0: i > 0 ? y0 - PITCH[i - 1] * 0.55 : 0.2, y1: ye + lift + 0.4, lift });
    sources.push({ N, r: hw + 0.35, y: y0 + bh * 0.5, col: C.windowLight, I: 1.5, fall: 1.7, y0: y0 - 0.5, y1: y0 + bh + 1.6, lift: 0 });
    tiers.push({ y: y0, eaveY: ye, eaveRadius: re, bodyRadius: hw });
  }

  // gilt finial: base, bowl, nine rings, water-flame, jewel
  const ya = Y[T - 1] + PITCH[T - 1] * 0.56 + topRise, g = gold, gd = mulc(gold, 0.6), prof = [];
  prof.push([0.95, ya - 0.45, gd], [0.95, ya + 0.35, g], [0.6, ya + 0.45, g], [0.82, ya + 0.55, g], [0.78, ya + 1.0, g], [0.46, ya + 1.42, g], [0.16, ya + 1.55, gd]);
  const rings = rng.int(7, 9), y1 = ya + 1.95, dy = 5.6 / rings;
  for (let j = 0; j < rings; j++) {
    const yr = y1 + j * dy, R = lerp(1.2, 0.62, j / (rings - 1));
    prof.push([0.13, yr - 0.22, gd], [R, yr - 0.05, g], [R, yr + 0.05, g], [0.13, yr + 0.22, gd]);
  }
  const ys = y1 + rings * dy - 0.1;
  prof.push([0.12, ys, gd], [0.55, ys + 0.75, g], [0.14, ys + 1.5, g], [0.36, ys + 1.8, g], [0.4, ys + 2.05, g], [0.02, ys + 2.6, g]);
  B.lathe(prof, 10, 0, 0, M_GOLD);
  glows.push([0, ys + 2.1, 0, 2.2]);
  return { N, tanN, HW, RE, Y, PITCH, tiers, lanterns, sources, glows, rPod, yTerrace, yF, top: ys + 2.6, side, PP, colors: { tile, lacquer, wood, plaster, stone, gold } };
}

// ---------------------------------------------------------------- the island, landing, torii, lamps, trees, light strings
function buildIsland(B, rng, noise, C, pg) {
  const rx = rng.range(26, 30), rz = rng.range(20.5, 23), ph = rng.range(0, 50), yT = pg.yTerrace;
  const R = (th) => {
    const s = Math.sin(th), c = Math.cos(th);
    return (1 + 0.07 * noise.n2(c * 1.4 + ph, s * 1.4)) / Math.sqrt((s / rx) * (s / rx) + (c / rz) * (c / rz));
  };
  const st = pg.colors.stone, lacq = pg.colors.lacquer, wood = pg.colors.wood;
  const sources = [], glows = [], lanterns = [], bulbs = [];
  const SEG = 56;
  // battered revetment wall + cap
  const wallProf = [[1.1, -2.2], [0.5, 0.25], [0.08, yT - 0.3], [0.2, yT - 0.28], [0.2, yT]];
  B.grid(SEG, wallProf.length - 1, (u, v) => {
    const th = u * TAU, k = Math.round(v * (wallProf.length - 1)), w = wallProf[k], r = R(th) + w[0];
    const wet = smoothstep(1.0, 0.0, w[1]), n = 0.9 + 0.2 * noise.n2(th * 9, w[1]);
    return [Math.sin(th) * r, w[1], Math.cos(th) * r, st[0] * n * (1 - 0.45 * wet), st[1] * n * (1 - 0.4 * wet), st[2] * n * (1 - 0.3 * wet), th * 24, w[1]];
  }, M_STONE, false, true);
  // cap stones and the terrace (raked gravel, moss toward the rim)
  B.grid(SEG, 1, (u, v) => { const th = u * TAU, r = R(th) + 0.2 - 1.1 * v; return [Math.sin(th) * r, yT, Math.cos(th) * r, st[0] * 1.15, st[1] * 1.15, st[2] * 1.15, th * 24, 9 + v]; }, M_STONE, false, true);
  const gravel = [0.3, 0.28, 0.27], moss = [0.07, 0.13, 0.07];
  B.grid(SEG, 5, (u, v) => {
    const th = u * TAU, r = lerp(R(th) - 0.9, pg.rPod * 0.8, v), x = Math.sin(th) * r, z = Math.cos(th) * r;
    const m = smoothstep(0.1, 0.7, noise.fbm2(x * 0.12 + ph, z * 0.12, 3) + 0.45 - v * 0.9), c = mixc(gravel, moss, m);
    return [x, yT + 0.02 + 0.12 * m * (v > 0 && v < 1 ? 1 : 0), z, c[0], c[1], c[2], x, z];
  }, M_PLAIN, false, true);
  // shore boulders
  const nb = rng.int(9, 14);
  for (let i = 0; i < nb; i++) {
    const th = rng.range(0.5, TAU - 0.5), r = R(th) + rng.range(0.9, 2.2), s = rng.range(0.7, 2.0), g = rng.range(0.7, 1.1);
    B.blob(Math.sin(th) * r, rng.range(-0.1, 0.35) * s, Math.cos(th) * r, s * rng.range(1, 1.5), s * rng.range(0.5, 0.8), s, noise, 0.28, 1.3,
      (dy) => mulc(mixc(st, moss, clamp(dy * 0.8, 0, 0.6)), g * (0.75 + 0.25 * dy)), M_PLAIN);
  }
  // landing on +Z: steps down to a jetty
  const rL = R(0);
  for (let s = 0; s < 6; s++) {
    const top = yT - s * 0.36, hy = (top + 1.6) * 0.5;
    B.box(0, top - hy, rL + 0.1 + s * 0.52, 2.6, hy, 0.45, 0, mulc(st, 1.12 - s * 0.03), M_STONE);
  }
  B.box(0, -0.6, rL + 5.2, 2.6, 0.95, 2.4, 0, mulc(st, 0.92), M_STONE);
  for (const sx of [-1, 1]) for (const dz of [3.2, 7.3]) B.lathe([[0.2, -1, wood], [0.17, 1.25, wood], [0.2, 1.3, mulc(st, 1.2)], [0.0, 1.5, mulc(st, 1.2)]], 6, sx * 2.5, rL + dz, M_PLAIN);
  // stone lamps
  const lamp = (x, z, s) => {
    const sl = mulc(st, 1.1), P = (a) => a.map((q) => [q[0] * s, yT + q[1] * s, q[2]]);
    B.lathe(P([[0.58, 0, sl], [0.52, 0.24, sl], [0.22, 0.36, sl], [0.18, 1.22, sl], [0.44, 1.38, sl], [0.46, 1.5, sl], [0.3, 1.52, sl]]), 6, x, z, M_PLAIN);
    B.lathe(P([[0.3, 1.52, C.amber], [0.3, 1.96, C.amber]]), 6, x, z, M_GLOW, 0, 3.2);
    B.lathe(P([[0.3, 1.96, sl], [0.68, 1.98, sl], [0.52, 2.14, sl], [0.17, 2.4, sl], [0.1, 2.56, sl], [0.17, 2.64, sl], [0.0, 2.8, sl]]), 6, x, z, M_PLAIN);
    sources.push({ x, y: yT + 1.75 * s, z, col: C.windowLight, I: 2.4, fall: 2.2 });
    glows.push([x, yT + 1.75 * s, z, 1.3]);
  };
  const nLamp = rng.int(6, 9), lampPh = rng.range(0.25, 0.6);
  for (let i = 0; i < nLamp; i++) { const th = lampPh + (i + 0.5) / nLamp * (TAU - 2 * lampPh), r = R(th) - 2.1; lamp(Math.sin(th) * r, Math.cos(th) * r, rng.range(1.05, 1.3)); }
  lamp(-3.5, rL - 1.6, 1.35); lamp(3.5, rL - 1.6, 1.35);
  // torii standing in the water off the landing
  const tz = rL + rng.range(12.5, 15), tH = rng.range(6.4, 7.4), tW = tH * 0.43, red = mulc(mixc(C.red, C.timber, 0.15), 0.7), blk = mulc(C.ink, 1.4);
  for (const sx of [-1, 1]) {
    B.lathe([[0.48, -2, blk], [0.46, 0.9, blk], [0.4, 0.95, red], [0.33, tH, red]], 8, sx * tW, tz, M_PLAIN);
    for (const dz of [-1.5, 1.5]) B.lathe([[0.22, -2, blk], [0.2, 0.7, blk], [0.18, 0.75, red], [0.16, 2.6, red], [0.24, 2.65, blk], [0.0, 2.9, blk]], 6, sx * tW, tz + dz, M_PLAIN);
    B.box(sx * tW, 1.9, tz, 0.1, 0.13, 1.5, 0, red, M_PLAIN, true);
  }
  B.box(0, tH - 1.45, tz, tW + 0.85, 0.2, 0.17, 0, red, M_PLAIN, true);
  B.box(0, tH - 0.72, tz, 0.16, 0.52, 0.12, 0, red, M_PLAIN);
  const arcPts = (y, half, bow) => { const a = []; for (let j = 0; j <= 10; j++) { const x = (j / 10 * 2 - 1) * half; a.push([x, y + bow * Math.pow(Math.abs(x / half), 2.2), tz]); } return a; };
  B.sweep(arcPts(tH - 0.02, tW + 1.25, 0.32), 0.24, 0.2, red, M_PLAIN);
  B.sweep(arcPts(tH + 0.36, tW + 1.6, 0.52), (t) => 0.33, 0.17, blk, M_PLAIN);
  for (const sx of [-1, 1]) { lanterns.push([sx * tW * 0.5, tH - 1.67, tz, rng() * TAU, 1.15]); sources.push({ x: sx * tW * 0.5, y: tH - 2.4, z: tz, col: C.lanternLight, I: 2.6, fall: 2.4 }); }
  // cherry trees
  const nT = rng.int(4, 7), trees = [];
  for (let i = 0; i < nT * 6 && trees.length < nT; i++) {
    const th = rng.range(0.35, TAU - 0.35), rMax = R(th) - 3.4, rMin = Math.max(pg.rPod + 3.6, pg.RE[0] + 1.5);
    if (rMax < rMin) continue;
    const r = rng.range(rMin, rMax), x = Math.sin(th) * r, z = Math.cos(th) * r;
    if (trees.some((t) => Math.hypot(t[0] - x, t[1] - z) < 6.5)) continue;
    trees.push([x, z]);
    const h = rng.range(3.0, 4.4), lean = rng.range(0.4, 1.2), la = rng.range(0, TAU), bark = mulc(wood, 0.7), tp = [];
    for (let j = 0; j <= 5; j++) { const t = j / 5; tp.push([x + Math.sin(la) * lean * t * t + 0.25 * Math.sin(t * 5 + i), yT + h * t, z + Math.cos(la) * lean * t * t]); }
    B.sweep(tp, (t) => lerp(0.32, 0.15, t), (t) => lerp(0.3, 0.14, t), bark, M_PLAIN);
    const tx = tp[5][0], ty = tp[5][1], tzz = tp[5][2], nBl = rng.int(6, 9), pale = rng.range(0, 1);
    for (let b = 0; b < nBl; b++) {
      const a = rng.range(0, TAU), d = b === 0 ? 0 : rng.range(1.2, 3.0), s = rng.range(1.3, 2.3) * (b === 0 ? 1.25 : 1), by = ty + rng.range(-0.3, 1.5) - d * 0.25;
      if (b > 0 && b < 4) B.sweep([[tx, ty - 0.6, tzz], [tx + Math.sin(a) * d * 0.6, by - 0.5, tzz + Math.cos(a) * d * 0.6], [tx + Math.sin(a) * d, by, tzz + Math.cos(a) * d]], 0.09, 0.09, bark, M_PLAIN);
      const pink = mixc([0.7, 0.36, 0.46], [0.8, 0.62, 0.64], pale * 0.6 + rng() * 0.4);
      B.blob(tx + Math.sin(a) * d, by, tzz + Math.cos(a) * d, s, s * 0.7, s, noise, 0.3, 1.7, (dy, r) => mulc(pink, (0.62 + 0.3 * dy) * (0.55 + 0.5 * r)), M_LEAF);
    }
  }
  // strings of festival lights from the third roof down to poles on the rim
  const tier = pg.tiers[2], strings = [];
  const ends = [];
  for (let k = 0; k < pg.N; k++) { ends.push([k, 1]); if (pg.N === 4) ends.push([k, 0]); }
  for (const [k, u] of ends) {
    const q = pg.PP(k, u, tier.eaveRadius * (u ? 1.03 : 1)), th = Math.atan2(q[0], q[1]);
    if (Math.abs(th) < 0.2) continue;                                       // keep the landing axis open
    const S = [q[0], tier.eaveY + (u ? 1.2 : 0.1), q[1]], rp = R(th) - 1.3, ph2 = 6.2 + rng.range(-0.6, 0.8), E = [Math.sin(th) * rp, yT + ph2, Math.cos(th) * rp];
    const len = Math.hypot(E[0] - S[0], E[1] - S[1], E[2] - S[2]), sag = len * rng.range(0.1, 0.16), pts = [], nP = 14;
    const at = (t) => [lerp(S[0], E[0], t), lerp(S[1], E[1], t) - sag * 4 * t * (1 - t), lerp(S[2], E[2], t)];
    for (let j = 0; j <= nP; j++) pts.push(at(j / nP));
    B.sweep(pts, 0.035, 0.035, blk, M_PLAIN);
    const nB = Math.round(len / 1.5);
    for (let j = 1; j < nB; j++) { const p = at(j / nB); bulbs.push([p[0], p[1] - 0.22, p[2], j % 3 === 0 ? 1 : 0]); }
    B.lathe([[0.13, yT, wood], [0.09, E[1], wood], [0.15, E[1] + 0.05, pg.colors.gold], [0.0, E[1] + 0.4, pg.colors.gold]], 5, E[0], E[2], M_PLAIN);
    strings.push({ from: S, to: E });
  }
  return { R, rx, rz, rL, yT, sources, glows, lanterns, bulbs, strings, torii: [0, tH, tz], toriiW: tW, landing: [0, 0.4, rL + 5.2] };
}

// ---------------------------------------------------------------- baked warm light (lantern rows, windows, lamps)
function bakeWarm(B, rings, points) {
  const n = B.count, out = new Float32Array(n * 3), P = B.p, Nn = B.n;
  for (let i = 0; i < n; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], nx = Nn[i * 3], ny = Nn[i * 3 + 1], nz = Nn[i * 3 + 2];
    let r = 0, g = 0, b = 0;
    const th = Math.atan2(x, z);
    for (let s = 0; s < rings.length; s++) {
      const S = rings[s]; if (y < S.y0 || y > S.y1) continue;
      const a = Math.round(th / (TAU / S.N)) * (TAU / S.N), sn = Math.sin(a), cs = Math.cos(a), hl = S.r * Math.tan(Math.PI / S.N);
      const xl = clamp(x * cs - z * sn, -hl, hl), c = Math.abs(xl) / hl;
      const dx = sn * S.r + cs * xl - x, dy = S.y + S.lift * c * c * c - y, dz = cs * S.r - sn * xl - z, d = Math.hypot(dx, dy, dz) + 1e-4;
      const ndl = (nx * dx + ny * dy + nz * dz) / d, w = (ndl > 0 ? ndl * 0.88 : 0) + 0.12, I = S.I * w / (1 + (d / S.fall) * (d / S.fall));
      r += S.col[0] * I; g += S.col[1] * I; b += S.col[2] * I;
    }
    for (let s = 0; s < points.length; s++) {
      const S = points[s], dx = S.x - x, dy = S.y - y, dz = S.z - z, d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > 200) continue;
      const d = Math.sqrt(d2) + 1e-4, ndl = (nx * dx + ny * dy + nz * dz) / d, w = (ndl > 0 ? ndl * 0.85 : 0) + 0.15, I = S.I * w / (1 + d2 / (S.fall * S.fall));
      r += S.col[0] * I; g += S.col[1] * I; b += S.col[2] * I;
    }
    out[i * 3] = r; out[i * 3 + 1] = g; out[i * 3 + 2] = b;
  }
  return out;
}

const GLSL_NOISE = /* glsl */`
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y); }
`;

const SOLID_VERT = /* glsl */`
attribute vec3 color; attribute vec3 aWarm; attribute float aMat;
uniform float uTime;
varying vec3 vCol; varying vec3 vWarm; varying vec3 vN; varying vec3 vWp; varying vec3 vOp; varying vec2 vUv; varying float vMat;
#include <fog_pars_vertex>
void main(){
  vCol = color; vWarm = aWarm; vUv = uv; vMat = aMat; vOp = position;
  vec4 wp = modelMatrix * vec4(position, 1.);
  vec3 n = normalize(mat3(modelMatrix) * normal);
  #ifdef MIRROR
    float h = max(position.y, 0.);
    float w = sin(h * 0.55 - uTime * 1.7 + wp.x * 0.21) * (0.06 + 0.008 * h) + sin(h * 1.9 + uTime * 2.6 + wp.z * 0.3) * 0.04;
    wp.x += w; wp.z += w * 0.6;
    n.y = -n.y;
  #endif
  vN = n; vWp = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SOLID_FRAG = /* glsl */`
uniform float uTime; uniform float uSeed;
uniform vec3 uSky; uniform vec3 uGround; uniform vec3 uMoonDir; uniform vec3 uMoonCol; uniform vec3 uAmber; uniform vec3 uLacquer; uniform vec3 uWood; uniform vec3 uWater;
varying vec3 vCol; varying vec3 vWarm; varying vec3 vN; varying vec3 vWp; varying vec3 vOp; varying vec2 vUv; varying float vMat;
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vWp);
  #ifdef MIRROR
    if (vOp.y < 0.03) discard;
    V.y = -V.y;
  #endif
  if (dot(n, V) < 0.) n = -n;
  vec3 alb = vCol; vec3 emi = vec3(0.); float spec = 0.; float gloss = 16.; float amb2 = 1.;
  if (vMat < 0.5) {
    alb *= 0.82 + 0.36 * vnoise(vOp.xz * 1.7 + vOp.y * 2.3);
  } else if (vMat < 1.5) {                                   // roof tiles: ridged rows running down the slope
    float tx = vUv.x / 0.46, row = vUv.y / 0.8;
    float k = clamp(1.2 - fwidth(tx) * 1.6, 0., 1.);
    float f = abs(fract(tx) - 0.5) * 2., id = hash21(vec2(floor(tx), floor(row)));
    float pat = mix(0.5, 1.22, smoothstep(0.05, 0.75, f)) * (0.8 + 0.4 * id) * mix(0.6, 1., smoothstep(0., 0.18, fract(row)));
    alb *= mix(0.9, pat, k);
    spec = 0.35 + 0.4 * k * smoothstep(0.3, 0.9, f); gloss = 20.;
  } else if (vMat < 2.5) {                                   // wall: dado, lacquer rails, paper windows with lattice
    float bx = fract(vUv.x), by = vUv.y, id = floor(vUv.x);
    if (by < 0.15) { alb = uWood * (0.8 + 0.5 * vnoise(vec2(vUv.x * 9., by * 3.))); }
    else if (by < 0.2 || (by > 0.8 && by < 0.85)) { alb = uLacquer; }
    else if (by < 0.8 && bx > 0.13 && bx < 0.87) {
      float lx = (bx - 0.13) / 0.74, ly = (by - 0.2) / 0.6;
      float bar = max(step(0.42, abs(fract(lx * 4.) - 0.5)), step(0.43, abs(fract(ly * 5.) - 0.5)));
      float lit = step(0.2, hash21(vec2(id, uSeed)));
      float fl = 0.86 + 0.14 * sin(uTime * (1.2 + 2.5 * hash21(vec2(id, 3.))) + id);
      float shade = 0.5 + 0.5 * smoothstep(1.1, 0., ly) + 0.25 * vnoise(vec2(id * 7. + lx * 2., ly * 3.));
      alb = mix(vec3(0.5, 0.45, 0.36), uWood * 0.6, bar);
      emi = uAmber * (2.4 * lit * fl * shade) * mix(1., 0.06, bar);
    } else if (by > 0.85) { alb *= 0.85 + 0.25 * step(0.5, fract(vUv.x * 6.)); }
  } else if (vMat < 3.5) {                                   // rafters / planks
    float s = vUv.x / 0.42, k = clamp(1.2 - fwidth(s) * 1.6, 0., 1.);
    alb *= mix(0.8, mix(0.42, 1.12, smoothstep(0.4, 0.5, fract(s))), k);
  } else if (vMat < 4.5) {                                   // coursed stone
    vec2 q = vec2(vUv.x / 1.3, vUv.y / 0.55); q.x += 0.5 * mod(floor(q.y), 2.);
    vec2 f = fract(q); float id = hash21(floor(q));
    float mortar = smoothstep(0., 0.05, f.x) * smoothstep(1., 0.95, f.x) * smoothstep(0., 0.1, f.y) * smoothstep(1., 0.9, f.y);
    alb *= (0.74 + 0.42 * id) * mix(0.42, 1., mortar) * (0.85 + 0.3 * vnoise(vUv * 5.));
  } else if (vMat < 5.5) {                                   // blossom
    float a = vnoise(vOp.xz * 2.9 + vOp.y * 2.3), b = vnoise(vOp.xy * 7.3 + vOp.z * 5.1);
    alb *= 0.55 + 0.9 * a; alb = mix(alb, alb * 1.5 + 0.06, step(0.68, b)); amb2 = 1.5;
  } else if (vMat < 6.5) {                                   // emissive
    emi = vCol * vUv.x * (0.85 + 0.15 * sin(uTime * 3.1 + vOp.x * 7. + vOp.z * 5.)); alb = vec3(0.02);
  } else if (vMat < 7.5) {                                   // gilt metal
    spec = 2.2; gloss = 34.; alb *= 0.8 + 0.3 * vnoise(vOp.xy * 6.);
  } else {                                                   // railing lattice (alpha cut)
    float x = vUv.x / 0.42, y = vUv.y, k = clamp(1.3 - fwidth(x) * 1.4, 0., 1.);
    float keep = step(0.86, y) + step(y, 0.1) + step(abs(y - 0.5), 0.04) + k * step(fract(x), 0.2) + step(fract(x / 6.), 0.05);
    if (keep < 0.5) discard;
  }
  float ndv = max(dot(n, V), 0.);
  vec3 amb = mix(uGround, uSky, n.y * 0.5 + 0.5) * amb2;
  float ml = max(dot(n, uMoonDir), 0.);
  vec3 R = reflect(-V, n);
  float sp = pow(max(dot(R, uMoonDir), 0.), gloss);
  #ifdef MIRROR
    float h = vOp.y;
    vec3 col = alb * (vWarm * 1.0 + amb * 0.6 + uMoonCol * ml * 0.35) + emi * 0.85;
    col *= 0.72 * (0.78 + 0.22 * sin(h * 2.3 - uTime * 2.1 + vWp.x * 0.6 + vWp.z * 0.4));
    col = mix(uWater, col, exp(-h * 0.005));
  #else
    vec3 col = alb * (amb + uMoonCol * ml + vWarm) + emi;
    col += spec * sp * uMoonCol * 0.7 + spec * alb * vWarm * 0.6 * pow(1. - ndv, 2.);
    if (vMat > 6.5 && vMat < 7.5) col += alb * (mix(uGround, uSky, R.y * 0.5 + 0.5) * 1.4 + uAmber * 0.22 * smoothstep(0.2, -0.6, R.y));
    col += alb * uSky * pow(1. - ndv, 3.) * 0.9;
  #endif
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// fog uniforms are per material (three fills them in); everything in `u` is shared by reference
const fogUniforms = (u) => Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), u);

function makeSolid(B, warm, U) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(B.n, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
  g.setAttribute('aMat', new THREE.Float32BufferAttribute(B.m, 1));
  g.setAttribute('aWarm', new THREE.BufferAttribute(warm, 3));
  g.setIndex(B.count > 65535 ? new THREE.Uint32BufferAttribute(B.idx, 1) : new THREE.Uint16BufferAttribute(B.idx, 1));
  g.computeBoundingSphere();
  const mk = (mirror) => new THREE.ShaderMaterial({
    uniforms: fogUniforms(U), vertexShader: SOLID_VERT, fragmentShader: SOLID_FRAG, fog: true, side: THREE.DoubleSide,
    defines: mirror ? { MIRROR: 1 } : {},
  });
  const mesh = new THREE.Mesh(g, mk(false)), mirror = new THREE.Mesh(g, mk(true));
  mirror.scale.y = -1; mirror.renderOrder = -0.5;
  return { mesh, mirror, geometry: g };
}

// ---------------------------------------------------------------- lanterns: hung (red, eaves) and rising (amber)
const GLSL_RISE = /* glsl */`
// launch position -> where the sky lantern is at release progress p; w = visibility
vec4 risePos(vec3 base, vec4 a, vec2 b, float p, float time){
  float s = clamp((p - a.x) / 0.42, 0., 2.);
  float e = 1. - exp(-1.9 * s);
  float ang = b.y * (e * 0.9 + time * 0.012);
  float cs = cos(ang), sn = sin(ang);
  vec2 xz = base.xz * (1. + b.x * e);
  xz = vec2(xz.x * cs - xz.y * sn, xz.x * sn + xz.y * cs);
  xz += vec2(sin(time * 0.31 + a.z), cos(time * 0.27 + a.z * 1.3)) * 0.6 * e;
  float y = base.y + a.y * e + sin(time * 0.4 + a.z * 2.1) * 0.4 * e;
  return vec4(xz.x, y, xz.y, smoothstep(0., 0.06, s));
}`;

// World-space variant for the rest of the river: launch keyed to the raw path progress uU, straight rise with a
// little drift, then a slow endless creep upward (fading at the top of each loop) so the galaxy never freezes.
// a = (launch u, rise height, phase, scale), b = drift in metres.
const GLSL_RISE_RIVER = /* glsl */`
uniform float uU;
vec4 risePos(vec3 base, vec4 a, vec2 b, float p, float time){
  float s = max(uU - a.x, 0.) / 0.085;
  float e = 1. - exp(-1.6 * s);
  float w = fract(time * 0.021 + a.z * 0.37);
  vec2 xz = base.xz + b * e + vec2(sin(time * 0.31 + a.z), cos(time * 0.27 + a.z * 1.3)) * 0.7 * e;
  float y = base.y + a.y * e + (w - 0.5) * 26. * e + sin(time * 0.4 + a.z * 2.1) * 0.4 * e;
  return vec4(xz.x, y, xz.y, smoothstep(0., 0.12, s) * mix(1., smoothstep(0., 0.12, w) * (1. - smoothstep(0.88, 1., w)), e));
}`;

function latheGeo(prof, segs) {
  const b = new Builder(); b.lathe(prof, segs, 0, 0, 0);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3));
  g.setIndex(b.idx);
  return g;
}

function makeHungLanterns(list, U) {
  const P = [1, 1, 1], D = [0, 0, 0];
  const g = latheGeo([[0.0, -1.62, D], [0.15, -1.2, D], [0.2, -1.1, P], [0.45, -0.86, P], [0.45, -0.5, P], [0.2, -0.27, P], [0.15, -0.13, D]], 6);
  const n = list.length, inst = new Float32Array(n * 4), sc = new Float32Array(n);
  for (let i = 0; i < n; i++) { inst.set(list[i].slice(0, 4), i * 4); sc[i] = list[i][4]; }
  g.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 4));
  g.setAttribute('aScale', new THREE.InstancedBufferAttribute(sc, 1));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: fogUniforms(U), fog: true,
    vertexShader: /* glsl */`
      attribute vec3 color; attribute vec4 aInst; attribute float aScale;
      uniform float uTime;
      varying vec3 vN; varying vec3 vWp; varying float vPaper; varying float vY; varying float vPh;
      #include <fog_pars_vertex>
      void main(){
        float a1 = sin(uTime * 1.1 + aInst.w) * 0.1 + sin(uTime * 0.63 + aInst.w * 1.7) * 0.05;
        float a2 = sin(uTime * 0.9 + aInst.w * 2.3) * 0.08;
        vec3 p = position * aScale; vec3 n = normal;
        float c = cos(a1), s = sin(a1);
        p.xy = vec2(p.x * c - p.y * s, p.x * s + p.y * c); n.xy = vec2(n.x * c - n.y * s, n.x * s + n.y * c);
        c = cos(a2); s = sin(a2);
        p.zy = vec2(p.z * c - p.y * s, p.z * s + p.y * c); n.zy = vec2(n.z * c - n.y * s, n.z * s + n.y * c);
        vec4 wp = modelMatrix * vec4(p + aInst.xyz, 1.);
        vN = normalize(mat3(modelMatrix) * n); vWp = wp.xyz; vPaper = color.r; vY = position.y; vPh = aInst.w;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uRed; uniform vec3 uAmber; uniform vec3 uSky;
      varying vec3 vN; varying vec3 vWp; varying float vPaper; varying float vY; varying float vPh;
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN), V = normalize(cameraPosition - vWp);
        float ndv = abs(dot(n, V));
        float rib = 0.84 + 0.16 * sin(vY * 52.);
        float fl = 0.88 + 0.12 * sin(uTime * (2.3 + fract(vPh) * 2.) + vPh * 5.);
        float core = pow(ndv, 1.4) * smoothstep(-1.2, -0.75, vY) * smoothstep(-0.2, -0.6, vY);
        vec3 glow = mix(uRed * 2.6, mix(uRed, uAmber, 0.3) * 4.2, core) * rib * fl;
        vec3 cap = vec3(0.012, 0.01, 0.012) + uSky * 0.03 + uRed * 0.05;
        vec3 col = mix(cap, glow, step(0.5, vPaper));
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return mesh;
}

function makeSkyLanterns(list, U, RISE = GLSL_RISE) {
  const P = [1, 1, 1];
  const g = latheGeo([[0.27, 0, P], [0.42, 0.55, P], [0.46, 0.95, P], [0.31, 1.22, P], [0.0, 1.31, P]], 7);
  const n = list.length, base = new Float32Array(n * 3), A = new Float32Array(n * 4), Bb = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { const l = list[i]; base.set(l.base, i * 3); A.set(l.a, i * 4); Bb.set(l.b, i * 2); }
  g.setAttribute('aBase', new THREE.InstancedBufferAttribute(base, 3));
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4));
  g.setAttribute('aB', new THREE.InstancedBufferAttribute(Bb, 2));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: fogUniforms(U), fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aBase; attribute vec4 aA; attribute vec2 aB;
      uniform float uTime; uniform float uProgress;
      varying vec3 vN; varying vec3 vWp; varying float vY; varying float vPh;
      #include <fog_pars_vertex>
      ${RISE}
      void main(){
        vec4 r = risePos(aBase, aA, aB, uProgress, uTime);
        float tilt = sin(uTime * 0.7 + aA.z * 3.) * 0.1;
        vec3 p = position * (aA.w * r.w);
        p.xy = vec2(p.x * cos(tilt) - p.y * sin(tilt), p.x * sin(tilt) + p.y * cos(tilt));
        vec4 wp = modelMatrix * vec4(p + r.xyz, 1.);
        vN = normalize(mat3(modelMatrix) * normal); vWp = wp.xyz; vY = position.y; vPh = aA.z;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uAmber; uniform vec3 uRed;
      varying vec3 vN; varying vec3 vWp; varying float vY; varying float vPh;
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN), V = normalize(cameraPosition - vWp);
        float inside = step(dot(n, V), 0.);
        float fl = 0.85 + 0.15 * sin(uTime * (3. + fract(vPh) * 3.) + vPh * 9.);
        float hot = smoothstep(1.3, 0., vY);
        vec3 col = mix(uAmber * 1.3, mix(uAmber, vec3(1., 0.75, 0.4), 0.3) * 3.3, hot * hot) * fl;
        col = mix(col, mix(uAmber, uRed, 0.25) * 1.2, smoothstep(0.9, 1.3, vY));
        col *= 1. + inside * 0.8;
        col *= 0.8 + 0.2 * sin(atan(n.x, n.z) * 7.);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return mesh;
}

// one buffer of glow points, drawn twice: above the water and as mirror images under it.
// pts: { p:[x,y,z], a:[delay,rise,phase,0], b:[expand,swirl], type, size, col:[r,g,b] }
// type 0 static (both passes) | 1 rising (both) | 2 static, mirror only | 3 rising, mirror only | 4 static, above only
function makeGlowPoints(pts, U, RISE = GLSL_RISE) {
  const n = pts.length, pos = new Float32Array(n * 3), A = new Float32Array(n * 4), Bb = new Float32Array(n * 4), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const q = pts[i]; pos.set(q.p, i * 3); A.set(q.a || [0, 0, i * 1.37, 0], i * 4);
    Bb.set([q.b ? q.b[0] : 0, q.b ? q.b[1] : 0, q.type, q.size], i * 4); col.set(q.col, i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aA', new THREE.BufferAttribute(A, 4));
  g.setAttribute('aB', new THREE.BufferAttribute(Bb, 4));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  const mk = (mirror) => new THREE.ShaderMaterial({
    uniforms: fogUniforms(U), fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    defines: mirror ? { MIRROR: 1 } : {},
    vertexShader: /* glsl */`
      attribute vec4 aA; attribute vec4 aB; attribute vec3 aCol;
      uniform float uTime; uniform float uProgress; uniform float uPx;
      varying vec3 vCol; varying float vTw;
      #include <fog_pars_vertex>
      ${RISE}
      void main(){
        float type = aB.z, vis = 1.;
        vec3 p = position;
        if ((type > 0.5 && type < 1.5) || (type > 2.5 && type < 3.5)) { vec4 r = risePos(position, aA, aB.xy, uProgress, uTime); p = r.xyz; vis = r.w; }
        else p.xz += aA.xy * sin(uTime * 0.8 + aA.w);                      // static glows may sway: aA.xy = amplitude (m), aA.w = phase
        #ifdef MIRROR
          if (type > 3.5) vis = 0.;
          float h = max(p.y, 0.);
          p.x += sin(h * 0.55 - uTime * 1.7 + p.x * 0.21) * (0.06 + 0.008 * h);
          p.y = -p.y;
        #else
          if (type > 1.5 && type < 3.5) vis = 0.;
        #endif
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        gl_PointSize = clamp(vis * aB.w * uPx * projectionMatrix[1][1] / max(-mvPosition.z, 1.), 0., 96.);
        vTw = vis * (0.82 + 0.18 * sin(uTime * (2. + fract(aA.z) * 3.) + aA.z * 7.));
        vCol = aCol;
        gl_Position = projectionMatrix * mvPosition;
        if (vis < 0.01) gl_Position = vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime;
      varying vec3 vCol; varying float vTw;
      #include <fog_pars_fragment>
      void main(){
        vec2 q = (gl_PointCoord - 0.5) * 2.;
        #ifdef MIRROR
          q.x *= 2.4;
          float rip = 0.55 + 0.45 * sin(gl_FragCoord.y * 1.3 + uTime * 5. + gl_FragCoord.x * 0.15);
        #else
          float rip = 1.;
        #endif
        float d = length(q);
        float a = exp(-d * d * 5.) * 0.45 + pow(max(1. - d, 0.), 7.) * 1.5;
        a *= smoothstep(1., 0.7, d);
        vec3 col = vCol * a * vTw * rip;
        #ifdef MIRROR
          col *= 0.42;
        #endif
        #ifdef USE_FOG
          #ifdef FOG_EXP2
            col *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          #else
            col *= 1. - smoothstep(fogNear, fogFar, vFogDepth);
          #endif
        #endif
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const above = new THREE.Points(g, mk(false)), below = new THREE.Points(g, mk(true));
  above.frustumCulled = below.frustumCulled = false;
  return { above, below };
}

// ---------------------------------------------------------------- water patch, dark bed, haze, fireworks
function makeWater(U, radius) {
  const group = new THREE.Group();
  // dark bed: painted first without depth so the mirrored copy draws over it and the water over both
  const bed = new THREE.Mesh(new THREE.CircleGeometry(Math.max(3000, radius * 1.2), 48), new THREE.ShaderMaterial({
    uniforms: fogUniforms(U), fog: true, depthWrite: false,
    vertexShader: `#include <fog_pars_vertex>
      void main(){ vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `uniform vec3 uWater;
      #include <fog_pars_fragment>
      void main(){ gl_FragColor = vec4(uWater, 1.);
      #include <fog_fragment>
      }`,
  }));
  bed.rotation.x = -Math.PI / 2; bed.position.y = -0.4; bed.renderOrder = -0.8; bed.frustumCulled = false;
  const surf = new THREE.Mesh(new THREE.CircleGeometry(radius, 72), new THREE.ShaderMaterial({
    uniforms: fogUniforms(U), fog: true, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      varying vec3 vWp; varying vec3 vLp;
      #include <fog_pars_vertex>
      void main(){
        vLp = vec3(position.x, 0., -position.y);
        vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform float uWaterR; uniform vec3 uWater; uniform vec3 uHorizon; uniform vec3 uSky; uniform vec3 uAmber; uniform vec3 uRed;
      uniform vec3 uOrigin; uniform vec4 uPortal; uniform vec3 uPortalCol; uniform vec3 uMoonDir; uniform vec3 uMoonGlint; uniform vec2 uEmberDir; uniform vec3 uEmberCol;
      varying vec3 vWp; varying vec3 vLp;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main(){
        vec3 V = normalize(cameraPosition - vWp);
        vec2 p = vLp.xz; float t = uTime;
        float dist = length(cameraPosition - vWp), lod = clamp(60. / dist, 0.15, 1.);
        float gx = 0.05 * sin(p.x * 1.3 + t * 1.2 + sin(p.y * 0.7 + t * 0.3) * 1.5) + lod * (0.04 * sin(p.x * 3.1 - p.y * 2.3 + t * 2.1) + 0.07 * (vnoise(p * 1.9 + t * 0.6) - 0.5));
        float gz = 0.05 * sin(p.y * 1.1 - t * 0.9 + sin(p.x * 0.6 - t * 0.2) * 1.5) + lod * (0.04 * sin(p.y * 3.7 + p.x * 1.9 - t * 1.7) + 0.07 * (vnoise(p * 2.3 - t * 0.5 + 7.) - 0.5));
        vec3 n = normalize(vec3(gx, 1., gz));
        float ndv = max(dot(n, V), 0.);
        float F = 0.03 + 0.97 * pow(1. - ndv, 5.);
        vec3 R = reflect(-V, n); R.y = abs(R.y);
        vec3 sky = mix(uHorizon, uSky * 0.35, smoothstep(0., 0.5, R.y));
        // the ember band of the horizon, mirrored where the water looks toward it
        sky += uEmberCol * pow(max(dot(normalize(R.xz + 1e-5), uEmberDir), 0.), 5.) * (1. - smoothstep(0.02, 0.3, R.y));
        // light of the tower smeared toward the viewer: where does the rippled reflection ray pass the tower axis?
        // (world frame: the piece may be rotated in the world)
        vec2 pw = vWp.xz - uOrigin.xz;
        vec2 r2 = R.xz; float tt = -dot(pw, r2) / max(dot(r2, r2), 1e-4);
        float dmin = length(pw + r2 * tt), hy = R.y * tt;
        float glow = step(0., tt) * exp(-dmin * dmin / 90.) * smoothstep(1., 6., hy) * (1. - smoothstep(48., 72., hy));
        float glit = pow(vnoise(p * vec2(1.6, 1.1) + vec2(t * 0.7, -t * 0.4)), 2.) * 2.2;
        vec3 smear = mix(uRed, uAmber, 0.6) * glow * (0.05 + 0.34 * glit);
        // the same for a ring of light standing in the water (the world's exit portal): uPortal = (x, z, top height, strength)
        vec2 pq = vWp.xz - uPortal.xy; float t2 = -dot(pq, r2) / max(dot(r2, r2), 1e-4);
        float d2 = length(pq + r2 * t2), h2 = R.y * t2;
        smear += uPortalCol * (uPortal.w * step(0., t2) * exp(-d2 * d2 / 46.) * smoothstep(0.2, 3., h2) * (1. - smoothstep(uPortal.z * 0.75, uPortal.z, h2)) * (0.08 + 0.5 * glit));
        // moon glitter
        smear += uMoonGlint * pow(max(dot(R, uMoonDir), 0.), 260.) * (0.4 + 2.4 * glit);
        float a0 = 0.22, k = F * 0.5;
        float alpha = a0 + (1. - a0) * k;
        vec3 rgb = uWater * a0 * (1. - k) + sky * k + smear;
        float fade = 1. - smoothstep(uWaterR * 0.75, uWaterR, length(p));
        rgb *= fade; alpha *= fade;
        #ifdef USE_FOG
          #ifdef FOG_EXP2
            float ff = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          #else
            float ff = smoothstep(fogNear, fogFar, vFogDepth);
          #endif
          rgb = mix(rgb, fogColor * alpha, ff);
        #endif
        gl_FragColor = vec4(rgb, alpha);
      }`,
  }));
  surf.rotation.x = -Math.PI / 2; surf.position.y = 0.01; surf.renderOrder = 2;
  group.add(bed, surf);
  return group;
}

function makeHaze(U) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      varying vec2 vQ;
      void main(){
        vQ = position.xy;
        vec4 mv = viewMatrix * modelMatrix * vec4(0., 27., 0., 1.);
        mv.xy += position.xy * vec2(62., 66.); mv.z -= 24.;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uAmber; uniform vec3 uRed; varying vec2 vQ;
      void main(){
        float d = length(vQ * vec2(1., 0.85) + vec2(0., 0.12));
        float a = exp(-d * d * 3.2) * (1. - smoothstep(0.75, 1., length(vQ)));
        gl_FragColor = vec4(mix(uRed, uAmber, 0.6) * 0.085 * a, 1.);
      }`,
  }));
  m.frustumCulled = false; m.renderOrder = 3;
  return m;
}

function makeFireworks(rng, U) {
  const SH = 6, SPARKS = 72, TR = 5, n = SH * SPARKS * TR, pos = new Float32Array(n * 3), S = new Float32Array(n * 3);
  for (let sh = 0, i = 0; sh < SH; sh++) for (let k = 0; k < SPARKS; k++) {
    const z = rng.range(-1, 1), a = rng.range(0, TAU), r = Math.sqrt(1 - z * z), sp = rng.chance(0.75) ? rng.range(0.9, 1) : rng.range(0.35, 0.9), rnd = rng();
    for (let j = 0; j < TR; j++, i++) { pos.set([r * Math.cos(a) * sp, z * sp, r * Math.sin(a) * sp], i * 3); S.set([sh, j * 0.075, rnd], i * 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(S, 3));
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec3 aS;
      uniform float uTime; uniform float uPx; uniform vec3 uFwC; uniform vec2 uFwT; uniform vec3 uAmber; uniform vec3 uRed;
      varying vec3 vCol;
      float h1(float x){ return fract(sin(x * 127.1) * 43758.5453); }
      void main(){
        float sh = aS.x, T = 6.4, life = 3.6;
        float ct = uTime / T + 0.31 + step(2.5, sh) * 0.5 - mod(sh, 3.) * 0.045;
        float cyc = floor(ct), age = fract(ct) * T, k = sh * 17. + cyc * 3.7;
        float lane = mod(sh, 3.) - 1.;
        vec3 c = uFwC + vec3(uFwT.x, 0., uFwT.y) * (lane * 46. + (h1(k) - 0.5) * 34.) + vec3(0., (h1(k + 1.3) - 0.5) * 34. + abs(lane) * -8., 0.);
        float Rb = 21. + 15. * h1(k + 2.9);
        float lag = aS.y, ageP = max(age - lag, 0.);
        float e = 1. - exp(-ageP * 2.3);
        vec3 p = c + position * Rb * e - vec3(0., 0.55 * ageP * ageP, 0.);
        float b = (1. - step(life, age)) * (1. - smoothstep(0.5, 1., age / life));
        b *= (1. - lag * 2.3) * step(lag, age);
        b *= 0.65 + 0.35 * sin(uTime * 23. + aS.z * 40.) * smoothstep(0.8, 2.5, age);
        float gold = step(0.5, h1(k + 5.1));
        vec3 base = mix(uRed * 1.2 + vec3(0.25, 0.02, 0.02), mix(uAmber, vec3(1., 0.8, 0.45), 0.5), gold);
        vCol = mix(base, vec3(1., 0.9, 0.75), exp(-age * 5.)) * b * (5. + 7. * exp(-age * 4.));
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_PointSize = clamp((1.0 + 1.1 * aS.z) * (1. - lag * 1.6) * (0.5 + 0.5 * b) * uPx * projectionMatrix[1][1] / max(-mv.z, 1.), 1.6, 24.);
        gl_Position = b > 0.002 ? projectionMatrix * mv : vec4(2., 2., 2., 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol;
      void main(){ float d = length(gl_PointCoord - 0.5) * 2.; gl_FragColor = vec4(vCol * pow(max(1. - d, 0.), 2.5), 1.); }`,
  }));
  pts.frustumCulled = false; pts.renderOrder = 1.5;
  return pts;
}

// ---------------------------------------------------------------- assembly
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const hueShift = (hex, d) => { const c = new THREE.Color(hex); c.offsetHSL(d, 0, 0); return [c.r, c.g, c.b]; };
  const C = {
    night: lin(pal[0]), cobalt: lin(pal[1]), violet: lin(pal[2]), ink: lin(pal[3]), timber: lin(pal[4]),
    amber: hueShift(pal[5], rng.range(-0.012, 0.012)), red: hueShift(pal[6], rng.range(-0.012, 0.02)),
  };
  C.lanternLight = mixc(C.red, C.amber, 0.28); C.windowLight = mixc(C.amber, [1, 0.8, 0.6], 0.3);

  const B = new Builder();
  const pg = buildPagoda(B, rng, noise, C, opts);
  await ctx.yield();
  const isl = buildIsland(B, rng, noise, C, pg);
  await ctx.yield();
  const warm = bakeWarm(B, pg.sources, isl.sources);
  await ctx.yield();

  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const U = {
    uTime: { value: 0 }, uSeed: { value: rng.range(1, 90) }, uProgress: { value: opts.progress ?? 0.78 }, uPx: { value: 270 },
    uSky: { value: V3(mulc(mixc(C.cobalt, C.violet, 0.25), 1.8)) }, uGround: { value: V3(mulc(mixc(C.night, C.cobalt, 0.3), 1.2)) },
    uMoonDir: { value: new THREE.Vector3(0.55, 0.5, 0.67).normalize() }, uMoonCol: { value: new THREE.Vector3(0.28, 0.34, 0.5) },
    uAmber: { value: V3(C.amber) }, uRed: { value: V3(C.red) }, uLacquer: { value: V3(pg.colors.lacquer) }, uWood: { value: V3(pg.colors.wood) },
    uWater: { value: V3(mulc(mixc(C.night, C.cobalt, 0.12), 0.8)) }, uHorizon: { value: V3(mulc(mixc(C.cobalt, C.violet, 0.4), 0.45)) },
    uWaterR: { value: opts.waterRadius ?? 2600 }, uU: { value: 0 }, uOrigin: { value: new THREE.Vector3() }, uPortal: { value: new THREE.Vector4(0, 0, 16, 0) }, uPortalCol: { value: new THREE.Vector3(1, 0.8, 0.5) },
    uMoonGlint: { value: new THREE.Vector3(0, 0, 0) }, uEmberDir: { value: new THREE.Vector2(0, -1) }, uEmberCol: { value: new THREE.Vector3(0, 0, 0) }, uFwC: { value: new THREE.Vector3(0, 78, -100) }, uFwT: { value: new THREE.Vector2(1, 0) },
  };

  const object = new THREE.Group(); object.name = 'lantern-pagoda';
  const solid = makeSolid(B, warm, U);
  object.add(solid.mesh, solid.mirror);
  const hungList = pg.lanterns.concat(isl.lanterns);
  object.add(makeHungLanterns(hungList, U));
  await ctx.yield();

  // glow points: bulbs, glints, lantern halos and reflections, the far field of the release
  const pts = [], amber = C.amber, lanL = C.lanternLight;
  for (const b of isl.bulbs) pts.push({ p: [b[0], b[1], b[2]], type: 0, size: 0.8, col: b[3] ? mulc(C.red, 3.0) : mulc(amber, 2.4) });
  for (const g of pg.glows.concat(isl.glows)) pts.push({ p: [g[0], g[1], g[2]], type: 0, size: 1.3 * g[3] + 0.5, col: mulc(amber, 0.9) });
  for (const l of hungList) {
    pts.push({ p: [l[0], l[1] - 0.7, l[2]], type: 2, size: 1.6, col: mulc(lanL, 1.0) });
    pts.push({ p: [l[0], l[1] - 0.7, l[2]], type: 4, size: 3.0, col: mulc(lanL, 0.14) });
  }
  const sky = [], releasePoints = [];
  if (opts.release !== false) {
    const swirl = rng.sign(), rMin = pg.RE[0] * (pg.N === 4 ? 1.45 : 1.12) + 1.5, nModel = 240, nFar = 640;
    const thOff = rng.range(0, TAU);
    for (let i = 0; i < nModel + nFar; i++) {
      const far = i >= nModel, rf = Math.pow(rng(), 1.5), th = thOff + (i % 3) * TAU / 3 + rng.gauss() * 0.42, Ri = isl.R(th);
      const r = Math.max(rMin, Ri * (far ? rng.range(0.85, 1.9) : rng.range(0.8, 1.45)));
      const base = [Math.sin(th) * r, r < Ri - 0.5 ? isl.yT + 1.3 : 0.9, Math.cos(th) * r];
      const a = [0.55 * Math.pow(rng(), 1.3), 8 + (far ? 100 : 82) * rf, rng.range(0, 40), rng.range(1.0, 1.5)];
      const b = [0.1 + 0.75 * rf + rng.range(0, 0.18), swirl * (0.5 + 2.2 * rf)];
      if (far) pts.push({ p: base, a, b, type: 1, size: rng.range(0.9, 1.5), col: mulc(mixc(amber, C.red, rng.range(0, 0.25)), rng.range(0.9, 1.6)) });
      else { sky.push({ base, a, b }); pts.push({ p: [base[0], base[1] + 0.6, base[2]], a, b, type: 3, size: 1.8, col: mulc(amber, 1.0) }); if (i % 13 === 0) releasePoints.push(V3(base)); }
    }
    object.add(makeSkyLanterns(sky, U));
  }
  const glow = makeGlowPoints(pts, U);
  glow.below.renderOrder = 1; glow.above.renderOrder = 4;
  object.add(glow.below, glow.above);
  if (opts.water !== false) object.add(makeWater(U, U.uWaterR.value));
  object.add(makeHaze(U));
  const fwMode = opts.fireworks === undefined ? 'auto' : opts.fireworks;
  if (fwMode) object.add(makeFireworks(rng, U));
  await ctx.yield();

  const tiers = pg.tiers, mid = tiers[4], eaveMax = pg.RE[0] * (pg.N === 4 ? 1.5 : 1.12);
  const anchors = {
    gaze: new THREE.Vector3(0, mid.y + 2, 0),
    flyBy: [[-90, 17, 64], [-45, 20.5, 53.5], [0, 22, 50], [45, 21, 53.5], [90, 18, 64]].map(V3),
    viewpoints: { entry: new THREE.Vector3(-150, 4, 120), low: new THREE.Vector3(-20, 3.5, 95), mid: new THREE.Vector3(0, 22, 62), high: new THREE.Vector3(55, 40, 70) },
    clearance: { minCameraDistance: 30, eaveRadius: eaveMax, islandRadius: Math.max(isl.rx, isl.rz) * 1.08 },
    portalSeat: null,
    landing: V3(isl.landing), torii: V3(isl.torii),
    releasePoints,
    lightSpots: [new THREE.Vector3(0, tiers[1].eaveY - 1, tiers[1].eaveRadius + 2), new THREE.Vector3(tiers[3].eaveRadius + 2, tiers[3].eaveY - 1, 0),
      new THREE.Vector3(-tiers[3].eaveRadius - 2, tiers[3].eaveY - 1, 0), new THREE.Vector3(0, 4, isl.rL + 3)],
    fireworks: [new THREE.Vector3(-46, 62, -105), new THREE.Vector3(0, 78, -105), new THREE.Vector3(46, 60, -105)],
    tiers,
  };
  const triangles = B.triangles * 2 + hungList.length * 72 + sky.length * 56 + 2 + 72 + 48;
  const tmp = new THREE.Vector3(), size = new THREE.Vector2();
  return {
    object, radius: 50, height: 70, center: new THREE.Vector3(0, 24, 0), anchors, ground: false, groundY: 0,
    uniforms: U,
    info: { sides: pg.N, top: pg.top, triangles, solidTriangles: B.triangles, lanterns: hungList.length, skyLanterns: sky.length, glowPoints: pts.length, island: [isl.rx, isl.rz] },
    setProgress(p) { U.uProgress.value = clamp(p, 0, 1); },
    // WORLD HOOKS. setU: raw path progress for the river-wide release built with `kit`. setWater: any of
    // { portal: [worldX, worldZ, topHeight, strength], portalColor, moonGlint, emberDir: [x, z], emberColor } (Vector3 / Color / arrays).
    setU(u) { U.uU.value = u; },
    setWater(w = {}) {
      const c3 = (u, v) => { if (v == null) return; if (v.isColor) u.value.set(v.r, v.g, v.b); else if (v.isVector3) u.value.copy(v); else u.value.set(v[0], v[1], v[2]); };
      if (w.portal) U.uPortal.value.set(w.portal[0], w.portal[1], w.portal[2], w.portal[3]);
      c3(U.uPortalCol, w.portalColor); c3(U.uMoonGlint, w.moonGlint); c3(U.uEmberCol, w.emberColor);
      if (w.emberDir) U.uEmberDir.value.set(w.emberDir[0], w.emberDir[1]).normalize();
    },
    // The piece's own lantern and glow systems for the rest of the world, in WORLD space (add the results to the scene, not to
    // `object`); they share this piece's uniforms, palette and fog. hung(list [[x,y,z,phase,scale],..]) red swaying paper lanterns;
    // rising(list [{ base, a:[launchU, riseHeight, phase, scale], b:[driftX, driftZ] }]) amber sky lanterns launched at path progress
    // a[0]; glows(pts) -> { above, below } points drawn above the water and as streaked mirror images under it (see makeGlowPoints;
    // rising types use the same a / b as rising(), static types may sway: a = [swayX, swayZ, twinklePhase, swayPhase]).
    kit: {
      hung: (list) => makeHungLanterns(list, U),
      rising: (list) => makeSkyLanterns(list, U, GLSL_RISE_RIVER),
      glows: (pts) => { const g = makeGlowPoints(pts, U, GLSL_RISE_RIVER); g.below.renderOrder = 1; g.above.renderOrder = 4; return g; },
    },
    setLight(l = {}) {
      const set = (u, v) => { if (v === undefined) return; if (v.isColor) u.value.set(v.r, v.g, v.b); else u.value.copy(v); };
      set(U.uSky, l.skyColor); set(U.uGround, l.groundColor); set(U.uMoonCol, l.moonColor); set(U.uWater, l.waterColor); set(U.uHorizon, l.horizonColor);
      if (l.moonDir) U.uMoonDir.value.copy(l.moonDir).normalize();
    },
    update(dt, time, camera) {
      U.uTime.value = time;
      object.updateWorldMatrix(true, false); U.uOrigin.value.setFromMatrixPosition(object.matrixWorld);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uPx.value = size.y * 0.5; }
      if (fwMode === 'auto' && camera) {
        object.updateWorldMatrix(true, false);
        object.worldToLocal(tmp.copy(camera.position));
        const l = Math.hypot(tmp.x, tmp.z) || 1, bx = -tmp.x / l, bz = -tmp.z / l;
        U.uFwC.value.set(bx * 100, 78, bz * 100); U.uFwT.value.set(-bz, bx);
      }
    },
    dispose() {},
  };
}
