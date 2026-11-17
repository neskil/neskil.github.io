// valley-inside-the-works, THE SHED: the cast-iron columns and their stone piers. A column stands where the plan says
// (COLUMN_X, columnZ, columnStands): a moulded base, a fluted shaft 1.5 m across, a ringed neck, a bell and spreading
// bracket heads up to the lattice girder. One geometry serves every height: its upper part rides up by aP.w * aTall
// in the vertex shader. The two middle rows (the flown line passes the right one at 7.0 to 14.5 m and the left one at
// 13.4 to 20.8 m) are turned finer than the outer rows (a level of detail by where a column STANDS). In the river a
// column stands on a pier pointed upstream; where the plan's ground STEPS under a column's foot (the fall's rock scar,
// the river's very edge) it stands on a square stone pier of its own, built down to the lowest ground under it.
import * as P from './valley-inside-the-works-plan.js';
import { makeMesh } from './valley-inside-the-works-shed-mesh.js';
import { KIND } from './valley-inside-the-works-shed-mats.js';

export const COLUMN = { foot: 2.2, neck: 6.0, cap: 3.5, reach: 3.3, base: 1.3, pier: 1.7, pipe: 1.22 };

// the plan's ground within `reach` of an axis: its lowest and highest, and whether it STEPS there: two neighbouring
// points (a quarter of the reach apart) stand more than 0.5 m apart in height. The valley's own slopes are far gentler.
export function footGround(x, z, reach) {
  const n = 4, h = [];
  let lo = 1e9, hi = -1e9, step = false;
  for (let i = 0; i <= 2 * n; i++) {
    h.push([]);
    for (let j = 0; j <= 2 * n; j++) { const g = P.groundHeight(x + reach * (i - n) / n, z + reach * (j - n) / n); h[i].push(g); lo = Math.min(lo, g); hi = Math.max(hi, g); }
  }
  for (let i = 0; i <= 2 * n; i++) for (let j = 0; j < 2 * n; j++) if (Math.abs(h[i][j + 1] - h[i][j]) > 0.5 || Math.abs(h[j + 1][i] - h[j][i]) > 0.5) step = true;
  return { lo, hi, step };
}

// where every standing column's foot is: [{ x, z, y0, river, terrace, step }]
export function columnList() {
  const out = [], T = P.TERRACE;
  for (const x of P.COLUMN_X) for (let k = 0; k < 22; k++) {
    const z = P.columnZ(k);
    if (!P.columnStands(x, z)) continue;
    const river = P.bankDistance(x, z) < 0, terrace = x > T.x0 && x < T.x1 && z < T.z0 && z > T.z1 - 1;
    const step = !river && !terrace && footGround(x, z, COLUMN.base).step;
    // a stepped foot's pier is topped a hand above the highest ground within the pier's own width of the axis (the
    // top of the step: the scar's rim, the bank), so that no iron lies in rock or earth
    const y0 = terrace ? T.top : river ? P.riverY(z) + 1.2 : step ? footGround(x, z, 2 * COLUMN.pier).hi + 0.1 : P.groundHeight(x, z) - 0.1;
    out.push({ x, z, y0, river: river && !terrace, terrace, step, k });
  }
  return out;
}

// THE CANES AT THE HEAD: every column that stands on the terrace or within CANE_REACH of its front (the plan's
// TERRACE.z0), which is the last three rows (the terrace's and the nave's), has its shaft painted as a sugar cane,
// glossy white with a spiral stripe, by where it stands and by nothing else. Which canes are green is dealt from the
// shed's own stream 'shed-canes', one in five, in the order the plan lists the columns: 1 a red stripe, 2 a green
// one, 0 everywhere else (sage iron). Its base, its bracket head, its flange and its rain pipe stay iron.
const CANE_REACH = 25;
const isCane = (c) => c.z <= P.TERRACE.z0 + CANE_REACH;

// `lift` is the mean height by which this drawing's columns are raised: the shaft and the rain pipe, whose two rings
// ride apart by aTall, have their normals worked out for the raised form (the lathe's o.lift)
async function columnGeometry(THREE, seg, fine, lift, pause) {
  const m = makeMesh(), C = COLUMN;
  m.set({ kind: KIND.iron, w: 0, col: [1, 1, 1] });
  m.lathe([0, 0, 0], 1, [[1.3, -1.0, 0], [1.3, 0.8, 0], [1.16, 0.8, 0]], 8, { a0: Math.PI / 8, a1: Math.PI * 2 + Math.PI / 8 });
  const base = fine ? [[1.16, 0.8], [1.16, 1.0], [1.04, 1.1], [1.12, 1.18], [1.12, 1.38], [1.0, 1.5], [0.9, 1.75], [0.84, 1.95], [0.8, C.foot]]
    : [[1.16, 0.8], [1.16, 1.0], [1.04, 1.1], [1.12, 1.38], [0.9, 1.75], [0.8, C.foot]];
  m.lathe([0, 0, 0], 1, base.map((q) => [q[0], q[1], 0]), seg);
  await pause();
  m.set({ kind: KIND.flute });
  m.lathe([0, 0, 0], 1, [[0.8, C.foot, 0], [0.72, -C.neck, 1]], fine ? 20 : 12, { uPer: 20, lift });
  m.set({ kind: KIND.iron, w: 1 });
  const top = fine ? [[0.72, -6.0], [0.86, -5.92], [0.86, -5.72], [0.74, -5.62], [0.74, -4.95], [0.8, -4.65], [0.96, -4.35], [1.28, -4.1], [1.34, -3.9]]
    : [[0.72, -6.0], [0.86, -5.92], [0.86, -5.72], [0.74, -5.62], [0.74, -4.95], [0.96, -4.35], [1.34, -3.9]];
  m.lathe([0, 0, 0], 1, top.map((q) => [q[0], q[1], 1]), seg);
  await pause();
  m.box(-1.42, 1.42, -3.9, -C.cap, -1.42, 1.42);                 // the abacus
  m.box(-0.8, 0.8, -C.cap, 0, -0.62, 0.62, 'ud');                // the stub that carries the girder
  // the spreading brackets under the girder, one each way along it
  const curve = [], n = fine ? 5 : 3, R = C.reach;
  for (let i = 0; i <= n; i++) { const t = i / n * Math.PI / 2; curve.push([R - (R - 0.8) * Math.cos(t), -C.cap + (C.cap - 0.55) * Math.sin(t)]); }
  for (const sx of [1, -1]) {
    m.frame([0, 0, 0], [sx, 0, 0], [0, 1, 0], [0, 0, 1]);
    const th = 0.22;
    m.poly([[0.8, 0, th]].concat(curve.map((q) => [q[0], q[1], th]), [[R, 0, th]]));
    m.poly([[0.8, 0, -th], [R, 0, -th]].concat(curve.slice().reverse().map((q) => [q[0], q[1], -th])));
    for (let i = 0; i < n; i++) { const a = curve[i], b = curve[i + 1]; m.quad([a[0], a[1], th + 0.14], [a[0], a[1], -th - 0.14], [b[0], b[1], -th - 0.14], [b[0], b[1], th + 0.14]); }
    m.quad([R, -0.55, th + 0.14], [R, -0.55, -th - 0.14], [R, 0, -th - 0.14], [R, 0, th + 0.14]);
  }
  m.frame(null);
  await pause();
  // a rainwater pipe down the downstream side, from a hopper under the capital to a shoe over the base, on three clips;
  // it stands out past the rims of the bolted flange (0.98 m in radius), a hand clear of them
  m.set({ kind: KIND.iron, w: 0, col: [0.78, 0.8, 0.86] });
  m.lathe([0, 0, C.pipe], 1, [[0.17, 2.3, 0], [0.17, -5.3, 1]], fine ? 8 : 5, { uPer: 1, lift });
  m.box(-0.2, 0.2, 1.95, 2.3, 0.84, C.pipe + 0.33);
  m.set({ w: 1 });
  m.box(-0.38, 0.38, -5.3, -4.72, 0.7, C.pipe + 0.3);
  for (const w of [0.25, 0.5, 0.75]) { m.set({ w }); m.box(-0.27, 0.27, -1.6, -1.42, 0.68, C.pipe + 0.22, 'k'); }
  // the cast flange where the shaft's two lengths are bolted together, half way up
  if (fine) {
    m.set({ kind: KIND.iron, w: 0.5, col: [1, 1, 1] });
    m.lathe([0, 0, 0], 1, [[0.76, -0.42, 0.5], [0.98, -0.34, 0.5], [0.98, -0.06, 0.5], [0.8, -0.03, 0.5], [0.8, 0.03, 0.5], [0.98, 0.06, 0.5], [0.98, 0.34, 0.5], [0.76, 0.42, 0.5]], seg);
    for (let i = 0; i < 8; i++) {
      const a = (i + 0.5) * Math.PI / 4, bx = 0.9 * Math.cos(a), bz = 0.9 * Math.sin(a);
      m.box(bx - 0.07, bx + 0.07, -0.5, 0.5, bz - 0.07, bz + 0.07);
    }
  }
  return m;
}

export async function buildColumns(kit) {
  const { THREE, mats, solid, ctx, object } = kit, list = columnList(), top = P.SHED.roofValley - 4;
  kit.columns = list;
  const deal = kit.o.rngFor('shed-canes'), caneOf = new Map();
  for (const c of list) if (isCane(c)) caneOf.set(c, deal() < 0.2 ? 2 : 1);
  let triangles = 0;
  for (const fine of [true, false]) {
    const set = list.filter((c) => (Math.abs(c.x) < 20) === fine);
    if (!set.length) continue;
    const m = await columnGeometry(THREE, fine ? 16 : 8, fine, set.reduce((sum, c) => sum + top - c.y0, 0) / set.length, () => ctx.yield());
    await ctx.yield();
    const g = m.build(THREE);
    await ctx.yield();
    const tall = new Float32Array(set.length), cane = new Float32Array(set.length), mesh = new THREE.InstancedMesh(g, mats.column, set.length), mt = new THREE.Matrix4();
    set.forEach((c, i) => { tall[i] = top - c.y0; cane[i] = caneOf.get(c) || 0; mt.makeTranslation(c.x, c.y0, c.z); mesh.setMatrixAt(i, mt); });
    g.setAttribute('aTall', new THREE.InstancedBufferAttribute(tall, 1));
    g.setAttribute('aCane', new THREE.InstancedBufferAttribute(cane, 1));
    mesh.frustumCulled = false; mesh.name = fine ? 'shed-columns-near' : 'shed-columns-far';
    object.add(mesh); kit.owned.push(g, mesh);
    triangles += m.triangles * set.length; kit.calls++;
    await ctx.yield();
    // the clear air a column leaves: its widest part at each height, against the flown line
    if (fine) for (const [i, c] of set.entries()) {
      if (i % 6 === 5) await ctx.yield();
      const rings = [[c.y0 + 2.2, 1.35, 1.35], [top - 2, COLUMN.reach, 0.5], [top - 3.8, 1.45, 1.45]];
      for (let y = c.y0 + 5; y < top - 6; y += 3) rings.push([y, 0.9, COLUMN.pipe + 0.2]);   // (the rain pipe's outer side)
      for (const [y, rx, rz] of rings) for (let a = 0; a < 8; a++) kit.air(c.x + rx * Math.cos(a * Math.PI / 4), y, c.z + rz * Math.sin(a * Math.PI / 4), 'column');
    }
    await ctx.yield();
  }
  kit.triangles += triangles;
  // the stone piers of the columns that stand in the river: 3.4 m wide, pointed upstream, 1.2 m above the surface
  for (const c of list) {
    if (!c.river) continue;
    const yb = P.riverY(c.z) - 2.2, yt = c.y0;
    const shape = (s) => [[-1.7, 1.5], [-1.1, 2.3], [1.1, 2.3], [1.7, 1.5], [1.7, -1.6], [0, -4.3], [-1.7, -1.6]].map((q) => [c.x + q[0] * s, c.z + q[1] * s]);
    solid.set({ kind: KIND.ashlar, w: 0.3, col: [1, 1, 1] });
    solid.prism(shape(1), yb, yt - 0.5, { top: false });
    solid.set({ w: 0.6 });
    solid.prism(shape(1.07), yt - 0.5, yt);
    solid.quad([c.x - 1.9, yt - 0.5, c.z + 2.5], [c.x - 1.9, yt - 0.5, c.z - 4.7], [c.x + 1.9, yt - 0.5, c.z - 4.7], [c.x + 1.9, yt - 0.5, c.z + 2.5]);   // the cap's underside
    await ctx.yield();
  }
  // the square stone piers of the columns whose foot spans a step of the plan's ground: 3.4 m wide under a cap course,
  // from 0.6 m under the lowest ground beneath the pier up to the column's foot
  for (const c of list) {
    if (!c.step) continue;
    const h = COLUMN.pier, yb = footGround(c.x, c.z, h * 1.07).lo - 0.6, yt = c.y0;
    const square = (s) => [[-h, -h], [h, -h], [h, h], [-h, h]].map((q) => [c.x + q[0] * s, c.z + q[1] * s]);
    solid.set({ kind: KIND.ashlar, w: 0.3, col: [1, 1, 1] });
    solid.prism(square(1), yb, yt - 0.5, { top: false });
    solid.set({ w: 0.6 });
    solid.prism(square(1.07), yt - 0.5, yt, { bottom: true });
    await ctx.yield();
  }
  await ctx.yield();
}
