// hill-of-round-doors, the field builder's part: THE MILL on the stream's north bank, on the plan's MILL ground. A tall
// old watermill built into the bank: a stone lower storey down into the water, a jettied upper storey of weatherboards,
// a steep tiled roof with a sagging ridge, a hoist housing breaking the east slope, a stone chimney, deep windows whose
// panes are alight by the hour (the solid material's lamp channel), a boarded door; south of it the wheel pit: a race
// between the mill and a low stone wall in the stream, the pier and block that carry the axle's outer end, and the
// sluice at the race's head. THE WHEEL itself (rims, inner rings, spokes, hub, axle and floats) is laid about its own
// middle so that the caller can turn it by the world's clock; THE WHITE WATER (the race, the shoot under the sluice
// gate, the sheets shed by the rising floats, the tail) is one small mesh of its own, drawn by the clock it is handed.
import { MILL, WATER } from './hill-of-round-doors-plan.js';
import { KIND, TAU, mix3, mul3, sstep, limb, turned } from './hill-of-round-doors-field-geo.js';

export const WHEEL_TURN = 0.4;                                  // the wheel's steady pace, radians a second

// buildMill(G, C, rng): the building and the fixed works of the wheel pit, laid into the Solid G in the world's places.
// C: colour to linear; rng: the stream 'mill' (the tones of its roof and boards).
export function buildMill(G, C, rng) {
  const wx = MILL.wheel.x, xa = wx - 9.5, xb = wx + 9.5, za = MILL.z0 + 3, zb = MILL.z1, low = -1.6, floor = 9.44, eaves = MILL.eaves, ridge = MILL.ridge, jet = 0.35;
  const xw = xa - jet, xe = xb + jet, zn = za - jet, zs = zb + jet, xm = (xa + xb) / 2, slope = (ridge - eaves) / (xe - xm);
  const stone = C('#a69a82'), pale = C('#b9ae96'), damp = C('#59613f'), board = C('#8c7658'), boardDark = C('#4f4233'), tile = C('#96583b'), tileMoss = C('#6d6a36'), oak = C('#5b4835'), frame = C('#d8ceb4');
  const pane = [0.07, 0.095, 0.08];
  const stoneCol = (p) => mul3(mix3(damp, stone, sstep(0.2, 3.4, p[1])), 0.9 + 0.2 * Math.sin(p[0] * 0.31 + p[2] * 0.23 + p[1] * 0.8));
  const boardCol = (p) => mul3(board, 0.82 + 0.26 * sstep(floor, eaves, p[1]) + 0.05 * Math.sin(p[0] + p[2]));
  // a wall seen from outside with (x0, z0) on its left; flat: its boards lie level
  const wall = (x0, z0, x1, z1, y0, y1, col, kind, flat) => {
    const a = [x0, y0, z0], b = [x1, y0, z1], c = [x1, y1, z1], d = [x0, y1, z0];
    if (flat) G.face(b, c, d, a, col, kind); else G.face(a, b, c, d, col, kind);
  };
  // THE STONE STOREY (two lifts, so that the damp of the water shows low down), the jetty's beam, THE BOARDED STOREY
  const split = low + 0.46 * 11;
  G.box([xa, low, za], [xb, split, zb], stoneCol, KIND.stone, 'xXzZ'); G.box([xa, split, za], [xb, floor, zb], stoneCol, KIND.stone, 'xXzZ');
  G.box([xw - 0.06, floor - 0.28, zn - 0.06], [xe + 0.06, floor + 0.16, zs + 0.06], oak, KIND.plain, 'xXzZy');
  const ring = [[xw, zs], [xe, zs], [xe, zn], [xw, zn]];
  for (let k = 0; k < 4; k++) { const p = ring[k], q = ring[(k + 1) % 4]; wall(p[0], p[1], q[0], q[1], floor + 0.16, eaves, boardCol, KIND.planks, true); }
  // real weatherboards on the two walls the flight looks at (south, with its gable, and east): each board leans out
  // at its foot over the board below, its underside in shade
  const lap = (x0, zA, x1, zB, y0, y1, k0, k1) => {               // one board from (x0, zA) to (x1, zB), k: how far along the wall its ends stand in (the gable)
    const nx = -(zB - zA), nz = x1 - x0, nl = Math.hypot(nx, nz), ox = nx / nl * 0.06, oz = nz / nl * 0.06, tone = mul3(board, 0.8 + 0.3 * rng());
    const a = [x0 + (x1 - x0) * k0, y0, zA + (zB - zA) * k0], b = [x0 + (x1 - x0) * k1, y0, zA + (zB - zA) * k1], pa = [a[0] + ox, y0, a[2] + oz], pb = [b[0] + ox, y0, b[2] + oz];
    G.face(pa, pb, [b[0] + ox * 0.15, y1, b[2] + oz * 0.15], [a[0] + ox * 0.15, y1, a[2] + oz * 0.15], (q) => mul3(tone, q[1] > y0 + 0.2 ? 0.86 : 1.05), KIND.plain);
    G.face(a, b, pb, pa, mul3(boardDark, 0.6), KIND.plain);
  };
  const BW = 0.42, nb = Math.ceil((eaves - floor - 0.16) / BW);
  for (let k = 0; k < nb; k++) { const y0 = floor + 0.16 + k * BW, y1 = Math.min(eaves, y0 + BW); lap(xw, zs, xe, zs, y0, y1, 0, 1); lap(xe, zs, xe, zn, y0, y1, 0, 1); }
  for (let y0 = eaves; y0 < ridge - 0.9; y0 += BW) { const k = (y0 + BW - eaves) / (ridge - 0.42 - eaves) * 0.5; lap(xw, zs, xe, zs, y0, y0 + BW, k, 1 - k); }
  // THE ROOF: two steep slopes of tiles in strips along a ridge that sags with age; boarded gables; bargeboards
  const BANDS = 12, over = 0.75, z0 = zs + over, z1 = zn - over, ye = eaves - 0.8 * slope, N = 6, rid = (z) => ridge - 0.42 * Math.sin(Math.PI * (z0 - z) / (z0 - z1));
  for (let k = 0; k < N; k++) {
    const zA = z0 + (z1 - z0) * k / N, zB = z0 + (z1 - z0) * (k + 1) / N, tone = 0.86 + 0.26 * rng(), m = 0.12 + 0.3 * rng();
    const col = (p) => mul3(mix3(tile, tileMoss, m * sstep(ridge - 2, eaves, p[1])), tone);
    // the east slope (the one the bridge looks at) in lapped bands: each band's lower edge stands a tile's thickness
    // over the band below, with its lip in shade
    for (let b = 0; b < BANDS; b++) {
      const P = (t, z, up) => { const dx = xe + 0.8 - xm, dy = rid(z) - ye, L = Math.hypot(dx, dy); return [xe + 0.8 - dx * t + up * dy / L, ye + dy * t + up * dx / L, z]; };
      const t0 = b / BANDS, t1 = (b + 1) / BANDS, Ls = Math.hypot(xe + 0.8 - xm, ridge - ye);
      G.face(P(t0, zA, 0.08), P(t0, zB, 0.08), P(t1, zB, 0), P(t1, zA, 0), col, KIND.tiles, z0 - zA, t0 * Ls);
      G.face(P(t0, zA, 0), P(t0, zB, 0), P(t0, zB, 0.08), P(t0, zA, 0.08), (q) => mul3(col(q), 0.45), KIND.plain);
    }
    G.face([xw - 0.8, ye, zB], [xw - 0.8, ye, zA], [xm, rid(zA), zA], [xm, rid(zB), zB], (p) => mul3(col(p), 0.9), KIND.tiles, zB - z1, 0);
    G.beam([xm, rid(zA) + 0.08, zA], [xm, rid(zB) + 0.08, zB], 0.6, 0.34, mul3(tile, 0.72 * tone), KIND.plain);
  }
  G.tface([xw, eaves, zs], [xe, eaves, zs], [xm, rid(zs), zs], boardCol, KIND.planks, [[eaves, xw], [eaves, xe], [rid(zs), xm]]);
  G.tface([xe, eaves, zn], [xw, eaves, zn], [xm, rid(zn), zn], boardCol, KIND.planks, [[eaves, xe], [eaves, xw], [rid(zn), xm]]);
  for (const z of [z0, z1]) for (const x of [xe + 0.8, xw - 0.8]) G.beam([x, ye + 0.1, z], [xm, rid(z) + 0.1, z], 0.16, 0.5, oak, KIND.plain);
  // THE CHIMNEY through the west slope
  const cx = xa + 3.2, cz = za + 4.2, ct = ridge + 2.4;
  G.box([cx, eaves, cz], [cx + 1.9, ct, cz + 1.9], (p) => mul3(stone, 0.8 + 0.1 * Math.sin(p[1])), KIND.stone, 'xXzZ');
  G.box([cx - 0.16, ct, cz - 0.16], [cx + 2.06, ct + 0.32, cz + 2.06], pale, KIND.plain); G.box([cx + 0.5, ct + 0.32, cz + 0.5], [cx + 1.4, ct + 1.0, cz + 1.4], mul3(tile, 0.8), KIND.plain, 'xXzZY');
  // THE HOIST HOUSING on the east slope: a boarded box out over the yard under its own small roof, a beam for the hoist
  const hz = (za + zb) / 2 - 1, hw = 1.8, hx = xe + 1.9, hy0 = 13.0, hy1 = 18.2, hr = 20.3, back = (y) => xm + (ridge - y) / slope;
  wall(hx, hz + hw, hx, hz - hw, hy0, hy1, boardCol, KIND.planks, true); wall(xe, hz + hw, hx, hz + hw, hy0, hy1, boardCol, KIND.planks, true); wall(hx, hz - hw, xe, hz - hw, hy0, hy1, boardCol, KIND.planks, true);
  G.face([xe, hy0, hz - hw], [hx, hy0, hz - hw], [hx, hy0, hz + hw], [xe, hy0, hz + hw], boardDark, KIND.planks);
  G.tface([hx, hy1, hz + hw], [hx, hy1, hz - hw], [hx, hr - 0.15, hz], boardCol, KIND.planks);
  for (const s of [1, -1]) {
    const ze = hz + s * (hw + 0.4), a = [back(hy1 - 0.3), hy1 - 0.3, ze], b = [hx + 0.5, hy1 - 0.3, ze], c = [hx + 0.5, hr, hz], d = [back(hr), hr, hz], uv = (p) => [p[0], Math.hypot(p[1] - hy1, p[2] - ze)];
    if (s > 0) G.faceW(a, b, c, d, mul3(tile, 0.95), KIND.tiles, uv); else G.faceW(b, a, d, c, mul3(tile, 0.85), KIND.tiles, uv);
    G.tface([xe, eaves, hz + s * hw], [xe, hy1, hz + s * hw], [back(hy1), hy1, hz + s * hw], boardCol, KIND.planks);
  }
  G.beam([hx - 0.6, hr - 0.75, hz], [hx + 1.7, hr - 0.75, hz], 0.24, 0.26, oak, KIND.plain);
  return { xa, xb, za, zb, xw, xe, zn, zs, xm, floor, eaves, rid, hx, hz,  stoneCol, boardCol, wall, colours: { stone, pale, damp, board, boardDark, tile, oak, frame, pane } };
}

// dressMill(G, M, ground): the mill's windows and doors and the fixed works of the wheel pit. M: what buildMill
// returned; ground: the plan's groundY.
export function dressMill(G, M, ground) {
  const { xb, xe, xw, zn, zs, xm, za, zb, hx, hz, stoneCol } = M, { pale, board, boardDark, oak, frame, pane } = M.colours, W = MILL.wheel, alight = 13;
  // a window (its panes alight by the hour) or a boarded door on a wall that faces n, its middle at c
  const opening = (c, n, w, h, door, glow = alight) => {
    const r = [n[2], 0, -n[0]], at = (i, j, out) => [c[0] + r[0] * i + n[0] * out, c[1] + j, c[2] + r[2] * i + n[2] * out], first = G.count, f = 0.17;
    const half = door === 'half', y0 = half ? 0 : -h / 2;       // a half door: its lower leaf shut, the room alight over it, its upper leaf swung out
    if (half) { G.face(at(-w / 2, -h / 2, 0.09), at(w / 2, -h / 2, 0.09), at(w / 2, 0, 0.09), at(-w / 2, 0, 0.09), board, KIND.planks); G.face(at(-w / 2, 0.02, 0.1), at(-w / 2 - 0.34 * w, 0.02, 0.1 + 0.9 * w), at(-w / 2 - 0.34 * w, h / 2, 0.1 + 0.9 * w), at(-w / 2, h / 2, 0.1), board, KIND.planks); }
    const lit0 = G.count;
    G.face(at(-w / 2, y0, 0.09), at(w / 2, y0, 0.09), at(w / 2, h / 2, 0.09), at(-w / 2, h / 2, 0.09), door && !half ? boardDark : pane, door && !half ? KIND.planks : KIND.plain);
    if (!door || half) for (let i = lit0; i < G.count; i++) G.s[i * 4 + 3] = half ? glow * 0.7 : glow;
    for (const s of [-1, 1]) {
      G.beam(at(s * (w + f) / 2, -h / 2 - f, 0.12), at(s * (w + f) / 2, h / 2 + f, 0.12), f, 0.2, door ? oak : frame, KIND.plain, n);
      G.beam(at(-w / 2 - f, s * (h + f) / 2, 0.12), at(w / 2 + f, s * (h + f) / 2, 0.12), f, 0.2, door ? oak : frame, KIND.plain, n);
    }
    if (!door) { G.beam(at(0, -h / 2, 0.12), at(0, h / 2, 0.12), 0.07, 0.1, frame, KIND.plain, n); G.beam(at(-w / 2, 0.15, 0.12), at(w / 2, 0.15, 0.12), 0.07, 0.1, frame, KIND.plain, n); }
  };
  const S = [0, 0, 1], E = [1, 0, 0], Nn = [0, 0, -1], Wn = [-1, 0, 0];
  opening([xm - 5.6, 12.9, zs], S, 1.5, 1.9); opening([xm + 5.6, 12.9, zs], S, 1.5, 1.9, false, alight * 2.6); opening([xm, 19.4, zs], S, 1.4, 1.7);
  opening([xe, 12.9, hz + 5.6], E, 1.5, 1.9, false, alight * 2.6); opening([xe, 12.9, hz - 5.6], E, 1.5, 1.9); opening([xb, 5.4, zb - 4.2], E, 1.3, 1.7); opening([xb, 6.8, zb - 10.4], E, 1.3, 1.7);
  opening([xm - 4.5, 12.9, zn], Nn, 1.5, 1.9); opening([xm + 4.5, 12.9, zn], Nn, 1.5, 1.9); opening([xw, 12.9, hz], Wn, 1.5, 1.9);
  const dz = za + 3.2, dy = ground(xb + 0.4, dz);
  opening([xb, dy + 1.4, dz], E, 1.7, 2.8, 'half'); opening([hx, 13.0 + 1.5, hz], E, 1.5, 2.6, true);
  G.box([xb, dy - 1.5, dz - 1.5], [xb + 1.3, dy + 0.06, dz + 1.5], pale, KIND.stone, 'XzZY');          // the door's step
  // quoins at the three corners the flight sees: big dressed stones, long and short by turns, proud of the walling
  for (const [cx, cz, ox, oz] of [[xb, zb, 1, 1], [xb, za, 1, -1], [M.xa, zb, -1, 1]]) for (let i = 0; i < 11; i++) {
    const y0 = -0.66 + i * 0.92, lx = i % 2 ? 0.55 : 1.05, lz = i % 2 ? 1.05 : 0.55, a = [cx - ox * lx, cx + ox * 0.07], b = [cz - oz * lz, cz + oz * 0.07];
    G.box([Math.min(a[0], a[1]), y0, Math.min(b[0], b[1])], [Math.max(a[0], a[1]), y0 + 0.86, Math.max(b[0], b[1])], mul3(pale, 0.88 + 0.05 * (i * 7 % 5)), KIND.plain);
  }
  // the hoist's stage under its door, on two long struts from the wall, with sacks waiting on it
  G.box([hx, 12.88, hz - 1.7], [hx + 1.5, 13.0, hz + 1.7], board, KIND.planks);
  for (const k of [-1, 1]) G.beam([hx + 1.4, 12.88, hz + k * 1.5], [xe, 10.4, hz + k * 1.5], 0.16, 0.18, oak, KIND.plain);
  for (const [dx, dz2, sc] of [[0.5, -1.1, 1], [0.95, -0.6, 0.9], [0.6, 1.15, 1.05]]) turned(G, [hx + dx, 13.0, hz + dz2], [[0.001, 0], [0.27 * sc, 0.04], [0.33 * sc, 0.3 * sc], [0.24 * sc, 0.55 * sc], [0.09 * sc, 0.66 * sc], [0.15 * sc, 0.76 * sc]], { sides: 7, kind: KIND.cloth, c: mul3(frame, 0.82 + 0.06 * sc) });
  // THE WHEEL PIT: a low wall in the stream that makes the race, the pier and block for the axle's outer end, the sluice
  const zw = W.z + W.thick / 2 + 0.75, x0 = W.x - W.r - 5, x1 = W.x + W.r + 3.4, top = WATER + 0.85;
  G.box([x0, -3.2, zw], [x1, top, zw + 1.0], stoneCol, KIND.stone, 'xXzZ'); G.box([x0 - 0.05, top, zw - 0.06], [x1 + 0.05, top + 0.16, zw + 1.06], pale, KIND.plain, 'xXzZY');
  G.box([W.x - 1.3, top, zw - 0.1], [W.x + 1.3, W.y - 1.15, zw + 1.3], stoneCol, KIND.stone, 'xXzZY');
  G.box([W.x - 0.8, W.y - 1.15, zw + 0.05], [W.x + 0.8, W.y + 0.6, zw + 1.15], oak, KIND.plain);
  const xs = x1 - 0.5, za2 = zb + 0.3, zb2 = zw - 0.1, zmid = (za2 + zb2) / 2;
  for (const z of [za2, zb2]) G.box([xs - 0.22, -1.6, z - 0.22], [xs + 0.22, 4.9, z + 0.22], oak, KIND.plain, 'xXzZY');
  G.beam([xs, 4.7, za2 - 0.5], [xs, 4.7, zb2 + 0.5], 0.4, 0.4, oak, KIND.plain); G.beam([xs, 3.3, za2], [xs, 3.3, zb2], 0.3, 0.3, oak, KIND.plain);
  G.box([xs - 0.07, WATER + 0.5, za2 + 0.2], [xs + 0.07, 3.1, zb2 - 0.2], (p) => mul3(board, p[1] < 1.2 ? 0.5 : 0.85), KIND.planks);
  G.beam([xs + 0.2, 2.2, zmid], [xs + 0.2, 5.8, zmid], 0.2, 0.2, oak, KIND.plain, [1, 0, 0]);
  return { race: { x0, x1: xs, z0: zb + 0.05, z1: zw - 0.02 } };
}

// buildWheel(G, C, rng): THE WHEEL about its own middle, its axle along z (the caller stands it at the plan's
// MILL.wheel and turns it about z). Two rims and two inner rings, spokes, a hub at each rim, the axle, the floats.
export function buildWheel(G, C, rng) {
  const W = MILL.wheel, R = W.r - 0.55, hz = W.thick / 2 - 0.22, oak = C('#5e4a36'), wet = C('#33302a'), moss = C('#4d5c2e'), NS = 24, SP = 8;
  const tone = () => { const k = 0.8 + 0.34 * rng(); return (p) => { const r = Math.hypot(p[0], p[1]); return mul3(mix3(mix3(oak, moss, 0.35 * sstep(2.5, R, r)), wet, 0.45 * sstep(R - 2.2, R + 0.6, r)), k); }; };
  const at = (r, a, z) => [r * Math.cos(a), r * Math.sin(a), z];
  for (const z of [-hz, hz]) {
    for (let k = 0; k < NS; k++) { const a0 = TAU * k / NS, a1 = TAU * (k + 1) / NS, am = (a0 + a1) / 2; G.beam(at(R, a0, z), at(R, a1, z), 0.34, 0.5, tone(), KIND.plain, [Math.cos(am), Math.sin(am), 0]); }
    for (let k = 0; k < 12; k++) { const a0 = TAU * k / 12, a1 = TAU * (k + 1) / 12, am = (a0 + a1) / 2; G.beam(at(R * 0.56, a0, z), at(R * 0.56, a1, z), 0.26, 0.3, tone(), KIND.plain, [Math.cos(am), Math.sin(am), 0]); }
    for (let k = 0; k < SP; k++) { const a = TAU * (k + (z > 0 ? 0 : 0.5)) / SP; G.beam(at(0.7, a, z), at(R - 0.2, a, z), 0.3, 0.36, tone(), KIND.plain, [0, 0, 1]); }
  }
  for (let k = 0; k < NS; k++) { const a = TAU * (k + 0.5) / NS; G.beam(at(R - 0.75, a, 0), at(W.r, a, 0), W.thick, 0.1, tone(), KIND.planks, [-Math.sin(a), Math.cos(a), 0]); }
  const zs = [-W.thick / 2 - 2.1, -hz - 0.45, -hz - 0.4, -hz + 0.4, -hz + 0.45, hz - 0.45, hz - 0.4, hz + 0.4, hz + 0.45, W.thick / 2 + 1.5], rs = [0.42, 0.42, 0.95, 0.95, 0.5, 0.5, 0.95, 0.95, 0.42, 0.42];
  limb(G, zs.map((z) => [0, 0, z]), rs, { sides: 10, kind: KIND.plain, col: (t, k) => mul3(oak, k % 2 ? 0.7 : 0.95), seam: [0, 1, 0] });
}

const WATER_F = /* glsl */`
float hillWater() {
  float a;
  if (vK.x > 1.5) {                                             // a soft round puff of spray or foam, fading in and out over its life
    float d2 = dot(vS.xy, vS.xy);
    return clamp(exp(-d2 * 2.6) * (1.0 - smoothstep(0.7, 1.0, sqrt(max(d2, 1e-6)))) * vS.z * vK.y, 0.0, 1.0);
  }
  if (vK.x < 0.5) {                                             // the race and the tail: streaks running west with the stream
    vec2 q = vec2(vHillP.x + uHillTime * 3.4, vHillP.z);
    float n = vnoise(vec2(q.x * 0.33, q.y * 1.7)) * 0.6 + vnoise(vec2(q.x * 1.2 + 7.0, q.y * 4.1)) * 0.4;
    float foot = (vHillP.x - uHillHub.x + 0.55 * uHillHub.z) / (0.55 * uHillHub.z);
    a = smoothstep(0.4, 0.7, n + 0.22 * exp(-foot * foot));
  } else {                                                      // the sheets shed by the rising floats: streaks falling
    float u = (vHillP.x - uHillHub.x) / uHillHub.z, top = uHillHub.y + uHillHub.z * 0.55 * sqrt(max(1.0 - u * u, 0.0));
    float m = (1.0 - smoothstep(-0.62, -0.42, u)) * smoothstep(-1.03, -0.95, u) * (1.0 - smoothstep(top - 1.8, top, vHillP.y));
    float n = vnoise(vec2(vHillP.x * 3.1 + vHillP.z, (vHillP.y + uHillTime * 5.5) * 0.42)) * 0.62 + vnoise(vec2(vHillP.x * 9.0, (vHillP.y + uHillTime * 7.0) * 1.1)) * 0.38;
    a = m * smoothstep(0.34, 0.74, n) * 0.85;
  }
  return clamp(a * vK.y, 0.0, 1.0);
}`;

// makeMillWater(THREE, fx, o): THE WHITE WATER of the pit, one mesh that takes the scene's light and fog: the race from
// the sluice to the wall's end and its tail thinning into the stream, the shoot under the gate, and the sheets falling
// from the floats as they rise on the wheel's west side, and puffs of spray and foam. fx: the fx kit (its noise);
// o: { race: from dressMill, rng: the stream 'mill' }.
// -> { object, time: set .value to the world's clock, triangles, drawCalls, dispose }
export function makeMillWater(THREE, fx, o) {
  const W = MILL.wheel, r = o.race, y = WATER + 0.1, P = [], K = [], Nn = [], I = [];
  const S4 = [], V4 = [];
  const v = (x, yy, z, kind, fade, ny = 1, nz = 0) => { P.push(x, yy, z); K.push(kind, fade); Nn.push(0, ny, nz); S4.push(0, 0, 0, 0); V4.push(0, 0, 0, 1); return P.length / 3 - 1; };
  const quad = (a, b, c, d) => I.push(a, b, c, a, c, d);
  const xs = [r.x1 - 2.0, W.x + 2, W.x - W.r, r.x0, r.x0 - 16], fade = [1, 0.85, 1.15, 0.8, 0], wide = [0, 0, 0, 0, 7];
  let prev = null;
  for (let i = 0; i < xs.length; i++) {
    const a = v(xs[i], y, r.z0, 0, fade[i]), b = v(xs[i], y, r.z1 + wide[i], 0, i === xs.length - 1 ? 0 : fade[i]);
    if (prev) quad(a, b, prev[1], prev[0]);
    prev = [a, b];
  }
  quad(v(r.x1 - 2.0, y, r.z0 + 0.3, 0, 1.3), v(r.x1 - 2.0, y, r.z1 - 0.3, 0, 1.3), v(r.x1, WATER + 0.55, r.z1 - 0.3, 0, 1.3), v(r.x1, WATER + 0.55, r.z0 + 0.3, 0, 1.3));
  for (const z of [W.z + W.thick / 2 + 0.05, W.z]) {
    const xl = W.x - W.r - 0.3, xr = W.x - 0.38 * W.r, y1 = W.y + 0.6 * W.r;
    quad(v(xl, WATER, z, 1, 1, 0.6, 0.8), v(xr, WATER, z, 1, 1, 0.6, 0.8), v(xr, y1, z, 1, 1, 0.6, 0.8), v(xl, y1, z, 1, 1, 0.6, 0.8));
  }
  // SPRAY AND FOAM: soft puffs turned to the eye, each on its own short flight by the clock: thrown up where the
  // sheets strike the race, dripping from the floats as they climb, drifting down the tail
  const rng = o.rng, puff = (x, yy, z, kind, alpha, vel, life, size) => {
    const ph = rng(), i0 = P.length / 3;
    for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { P.push(x, yy, z); K.push(kind, alpha); Nn.push(0, 1, 0); S4.push(cx, cy, size, ph); V4.push(vel[0], vel[1], vel[2], life); }
    quad(i0, i0 + 1, i0 + 2, i0 + 3);
  };
  for (let k = 0; k < 44; k++) puff(W.x - W.r - 0.2 + (0.55 * W.r + 0.2) * rng(), WATER + 0.15, W.z - 1.2 + 2.8 * rng(), 2, 0.55, [-0.4 - 1.8 * rng(), 2.4 + 2.6 * rng(), (rng() - 0.4) * 1.2], 0.6 + 0.5 * rng(), 0.35 + 0.4 * rng());
  for (let k = 0; k < 14; k++) { const a = Math.PI * (0.83 + 0.31 * rng()), yy = W.y + W.r * Math.sin(a); puff(W.x + W.r * Math.cos(a), yy, W.z - 1.3 + 2.8 * rng(), 2, 0.5, [-0.3, 0, 0], Math.sqrt(2 * Math.max(0.4, yy - WATER) / 9.8), 0.22 + 0.2 * rng()); }
  for (let k = 0; k < 14; k++) puff(W.x - W.r - 1 - 5 * rng(), WATER + 0.2, r.z0 + 0.4 + (r.z1 - r.z0 - 0.8) * rng(), 3, 0.42, [-2.2 - 0.8 * rng(), 0, (rng() - 0.5) * 0.6], 1.6 + rng(), 0.6 + 0.6 * rng());
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 2));
  g.setAttribute('aSpr', new THREE.Float32BufferAttribute(S4, 4)); g.setAttribute('aVel', new THREE.Float32BufferAttribute(V4, 4));
  g.setIndex(I); g.computeBoundingSphere();
  const U = { uHillTime: { value: 0 }, uHillHub: { value: new THREE.Vector3(W.x, W.y, W.r) } };
  const mat = new THREE.MeshLambertMaterial({ color: '#f2f6f6', transparent: true, depthWrite: false, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute vec2 aK; attribute vec4 aSpr; attribute vec4 aVel; uniform float uHillTime; varying vec2 vK; varying vec3 vHillP; varying vec3 vS;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  vK = aK; vHillP = position; vS = vec3(0.0);
  if (aK.x > 1.5) {
    float tau = fract(uHillTime / aVel.w + aSpr.w), tt = tau * aVel.w;
    vec3 c = position + aVel.xyz * tt; if (aK.x < 2.5) c.y -= 4.9 * tt * tt;
    vec3 rgt = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), upv = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    transformed = c + (rgt * aSpr.x + upv * aSpr.y) * (aSpr.z * (0.55 + 0.9 * tau));
    vS = vec3(aSpr.xy, sin(3.14159 * tau)); vHillP = transformed;
  }`);
    sh.fragmentShader = 'uniform float uHillTime; uniform vec3 uHillHub; varying vec2 vK; varying vec3 vHillP; varying vec3 vS;\n' + fx.GLSL_HASH + '\n' + fx.GLSL_VALUE_NOISE + '\n' + WATER_F + '\n'
      + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.a *= hillWater();');
  };
  mat.customProgramCacheKey = () => 'hill-field-water-2';
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 2;
  return { object: mesh, time: U.uHillTime, triangles: I.length / 3, drawCalls: 1, dispose() { g.dispose(); mat.dispose(); } };
}
