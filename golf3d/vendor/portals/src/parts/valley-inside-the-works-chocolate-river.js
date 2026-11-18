// valley-inside-the-works, the chocolate: THE RIVER'S MESH. The grower of the family's vertex layout, the stream's
// metres, and one reach of the river, lying level in its bed from shore to shore. Places are the plan's, in metres.
import * as P from './valley-inside-the-works-plan.js';

// A grower of one merged mesh in the family's vertex layout. d: { thin, froth, cream, pleat: [phase, height, across, along],
// kind (0 pleats travel, 1 stand, 2 a trough under its roller, 3 the fall's sheet, 4 a falling drop), scale (across-units
// per metre), half (the stream's half width in across-units; negative: the same, and no bank eddies), move: [how far a
// travelling bulge lifts the vertex along its normal (m), how far it sways sideways (m), the bulge's phase here
// (radians), the sway's phase]; a vertex that moves carries in the LENGTH of its flow direction the phase's rise per
// metre along the flow. (The sheet's and the drops' own meanings stand at the head of the shader's file.) }.
export function makeAcc() {
  const a = { pos: [], uv: [], flow: [], pleat: [], mix: [], aux: [], move: [], idx: [], n: 0 };
  a.vertex = (x, y, z, u, v, fx, fy, fz, speed, bank, d) => {
    const q = d || {}, pl = q.pleat;
    a.pos.push(x, y, z); a.uv.push(u, v); a.flow.push(fx, fy, fz, speed);
    a.mix.push(bank, q.thin || 0, q.froth || 0, q.cream || 0);
    if (pl) a.pleat.push(pl[0], pl[1], pl[2], pl[3]); else a.pleat.push(0, 0, 0, 1);
    a.aux.push(q.kind || 0, q.scale === undefined ? 1 : q.scale, q.half === undefined ? 8 : q.half);
    if (q.move) a.move.push(q.move[0], q.move[1], q.move[2], q.move[3]); else a.move.push(0, 0, 0, 0);
    return a.n++;
  };
  // rows of equal length, each a list of vertex numbers running toward +across; the next row lies upstream of it
  a.strip = (r0, r1) => { for (let j = 0; j + 1 < r0.length; j++) a.idx.push(r0[j], r0[j + 1], r1[j], r0[j + 1], r1[j + 1], r1[j]); };
  // The mesh, made in several breaths: run it to its end; the last thing it yields is the geometry (before that, null).
  // Its normals are every triangle's own, gathered at its corners and made one long: the usual sum (three.js's
  // computeVertexNormals makes the same in one piece), done here a part at a time.
  a.build = function* (THREE) {
    const g = new THREE.BufferGeometry(), put = (name, arr, n) => g.setAttribute(name, new THREE.BufferAttribute(new Float32Array(arr), n));
    put('position', a.pos, 3); put('aUv', a.uv, 2); put('aFlow', a.flow, 4);
    yield null;
    put('aPleat', a.pleat, 4); put('aMix', a.mix, 4); put('aAux', a.aux, 3); put('aMove', a.move, 4);
    yield null;
    g.setIndex(a.idx);
    yield null;
    const pos = g.attributes.position.array, idx = g.index.array, nrm = new Float32Array(pos.length);
    for (let t = 0; t < idx.length; t += 3) {
      const i = 3 * idx[t], j = 3 * idx[t + 1], k = 3 * idx[t + 2];
      const ax = pos[j] - pos[i], ay = pos[j + 1] - pos[i + 1], az = pos[j + 2] - pos[i + 2], bx = pos[k] - pos[i], by = pos[k + 1] - pos[i + 1], bz = pos[k + 2] - pos[i + 2];
      const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      nrm[i] += nx; nrm[i + 1] += ny; nrm[i + 2] += nz; nrm[j] += nx; nrm[j + 1] += ny; nrm[j + 2] += nz; nrm[k] += nx; nrm[k + 1] += ny; nrm[k + 2] += nz;
      if (t % 15000 === 14997) yield null;
    }
    for (let v = 0; v < nrm.length; v += 3) {
      const l = Math.hypot(nrm[v], nrm[v + 1], nrm[v + 2]) || 1;
      nrm[v] /= l; nrm[v + 1] /= l; nrm[v + 2] /= l;
    }
    g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    yield g;
  };
  return a;
}

export const smooth = (a, b, v) => { const t = Math.min(Math.max((v - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };

// STREAM METRES: the length of the river's middle line, counted downstream from the head (z = HEAD_Z).
const V_STEP = 0.25, V_N = Math.round((P.SHED.zDown + 1 - P.HEAD_Z) / V_STEP);
const V_TABLE = new Float32Array(V_N + 1);
for (let i = 1; i <= V_N; i++) {
  const z0 = P.HEAD_Z + (i - 1) * V_STEP, z1 = z0 + V_STEP;
  V_TABLE[i] = V_TABLE[i - 1] + Math.hypot(V_STEP, P.riverX(z1) - P.riverX(z0));
}
export function streamV(z) {
  const f = Math.min(Math.max((z - P.HEAD_Z) / V_STEP, 0), V_N - 1e-6), i = Math.floor(f);
  return V_TABLE[i] + (V_TABLE[i + 1] - V_TABLE[i]) * (f - i);
}

// THE LIQUID LIES IN ITS BED: its face stands the plan's FREEBOARD under riverY (riverY + LIFT is the plan's liquidY),
// dead level from bank to bank, and runs on a hand past the plan's bank line, under the bank's earth: where the bed's
// slope rises through it is the shore. No bead, no rim. SHORE: where that is, in metres from the bank line (the
// ground falls from riverY at the bank line to the bed, 1.5 m under it, over 0.55 m).
export const LIFT = -P.FREEBOARD;
export const SHORE = -0.55 * P.FREEBOARD / 1.5;
const RIM = [[-1.3, 0], [-0.6, 0], [-0.25, 0], [0.35, 0]];   // (metres past the bank, metres under the top)
export const ACROSS = 16;   // quads across the body of the river

// One reach of the river: rows at the given z (going upstream). o: { speed, nominal (the half width its
// across-coordinate is counted in), half(z) (the stream's own half width; default: the plan's), level(z) (default:
// the plan's), dress(u, v, z, x, s) -> the vertex's d, sag(z, s) (metres the face lies under its level, s -1..1
// across), past(z) (how far the liquid runs on past that half width, in metres; default a hand), shore(z) (where
// its shore lies, in metres past that half width; default at it) }.
export function riverReach(acc, zs, o) {
  const half = o.half || P.riverHalfWidth, level = o.level || P.riverY, past = o.past || (() => RIM[RIM.length - 1][0]), shore = o.shore || (() => 0);
  let prev = null;
  for (const z of zs) {
    const c = P.riverX(z), h = half(z), y = level(z) + LIFT, v = streamV(z);
    const e = 0.05, cA = P.riverX(z + e), cB = P.riverX(z - e), hA = half(z + e), hB = half(z - e);
    const row = [], pz = past(z), sz = shore(z);
    const put = (s, off, dy, bank) => {          // s: -1..1 across the stream; off: metres past that; dy: metres under the top
      let fx = (cA + s * hA) - (cB + s * hB), fz = 2 * e, fy = -2 * e * 0.008;
      const l = Math.hypot(fx, fy, fz); fx /= l; fy /= l; fz /= l;
      const u = s * o.nominal + off * o.nominal / h, x = c + s * h + off;      // (across-units: the bank line is at nominal)
      const d = (o.dress && o.dress(u, v, z, x, s)) || {};
      d.scale = o.nominal / h; d.half = o.nominal * (1 + sz / h);
      row.push(acc.vertex(x, y - dy - (o.sag ? o.sag(z, s) : 0), z, u, v, fx, fy, fz, o.speed, bank, d));
    };
    const last = RIM.length - 1;
    for (let k = last; k >= 0; k--) put(-1, -(k === last ? pz : RIM[k][0]), 0, 1 + k / last);
    const inner = 1 - 1.8 / h;
    for (let j = 1; j < ACROSS; j++) { const s = inner * (2 * j / ACROSS - 1); put(s, 0, 0, Math.abs(s)); }
    for (let k = 0; k <= last; k++) put(1, k === last ? pz : RIM[k][0], 0, 1 + k / last);
    if (prev) acc.strip(prev, row);
    prev = row;
  }
}
