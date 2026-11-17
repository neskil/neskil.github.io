// THE CITY THAT LEFT, what stands on the land the town leaves: poplars along the old road, oaks in the hedges, willows by
// the dry bed, an orchard and a farm with one window lit, the pylons whose line ran into town, the fence where the road
// was closed and the lorries behind it, a signal box, slag heaps, the cut tunnels and the mine galleries in the hole's
// wall, the rails that sag into it, and the river upstream that still runs and now falls into the hole.
// Everything is land-local (x, z as in the world, y = 0 the valley floor) and rides in the land's group.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import * as flora from '../kit/flora.js';
import { HERO, RIM, STREET, Acc, makePropMaterial } from './the-city-that-left-common.js';
import { bedX, roadX, railX, PYLON_X, FIELD, fieldQ } from './the-city-that-left-land.js';
import { Strands, makeStrandMaterial, Sheets, makeFallMaterial, tunnelInto } from './the-city-that-left-thin.js';

const TAU = Math.PI * 2;
export const FARM = { x: 66, z: -52 };                    // the farm by the old road, on the right as the flight begins
export const FENCE_Z = -119;                              // where the road was closed

// ---------------------------------------------------------------- trees (the kit's, one material, three shapes)
async function buildTrees(ctx, o, F) {
  const L = o.land.shape, path = o.path, pts = [];
  const free = (x, z, margin) => {
    if (Math.hypot(x - HERO.x, z - HERO.z) < RIM + margin) return false;
    if (Math.abs(x - roadX(z)) < 5 && z > -335) return false;
    if (Math.abs(x - railX(z)) < 6 && z > -350) return false;
    if ((z > -353 || z < -675) && Math.abs(x - bedX(z)) < 13) return false;
    return path.nearestXZ(x, z).dist > 11;
  };
  // Each kind of tree has a stream of its own. A tree is tested against the route up its whole height, in the land's
  // frame (the land is lower the further along the route the eye is); one the route would pass within 9 m of is not there.
  const probe = o.hero.probe, TALL = [21, 12.5, 10.5, 5], R = { poplars: F.poplars, oaks: F.hedgeOaks, willows: F.willows, rows: F.orchardRows };
  let tr = R.poplars;
  const put = (x, z, s, v) => { const y = L.ground(x, z), rot = tr.range(0, TAU); if (probe.line('land', [x, y, z], [x, y + TALL[v] * s + 1, z], 9)) pts.push({ x, y, z, s, rot, v, u: 0, d: 0 }); };
  // poplars down both sides of the road, as far as the road still goes
  for (let k = 0, z = 60; z > -322; z -= 13.2, k++) { const side = k % 2 ? 1 : -1, x = roadX(z) + side * 7.2; if (free(x, z, 10)) put(x, z, tr.range(0.9, 1.2), 0); }
  await ctx.yield();
  tr = R.oaks;
  // oaks standing in the hedges: wherever a draw falls within two metres of a hedge line
  let oaks = 0;
  for (let k = 0; k < 5200 && oaks < 96; k++) {
    const x = tr.range(-640, 620), z = tr.range(-1050, 240), q = fieldQ(x, z);
    const fx = q[0] / FIELD[0] - Math.floor(q[0] / FIELD[0]), fz = q[1] / FIELD[1] - Math.floor(q[1] / FIELD[1]);
    const d = Math.min(Math.min(fx, 1 - fx) * FIELD[0], Math.min(fz, 1 - fz) * FIELD[1]);
    if (d > 2.2 || L.ground(x, z) > 30 || !free(x, z, 14)) continue;
    put(x, z, tr.range(0.7, 1.15), 1); oaks++;
  }
  await ctx.yield();
  tr = R.willows;
  // willows and alders on the banks of the dry bed
  for (let z = 230; z > -345; z -= tr.range(16, 34)) { const side = tr.sign(), x = bedX(z) + side * tr.range(15, 20), sz = tr.range(0.75, 1.1); if (path.nearestXZ(x, z).dist > 10 && Math.hypot(x - HERO.x, z - HERO.z) > RIM + 12) put(x, z, sz, 2); }
  // the farm's orchard: small trees in rows
  tr = R.rows;
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const x = FARM.x + 22 + i * 7.5, z = FARM.z - 14 + j * 7.5; if (tr.chance(0.9)) put(x + tr.range(-0.8, 0.8), z + tr.range(-0.8, 0.8), tr.range(0.8, 1.1), 3); }
  const season = o.season, bare = season === 'snow';
  const variants = [
    flora.cypressGeometry({ rng: F.poplarGeo, detail: 0, height: 21, girth: 0.07, leaf: '#35542c', leafDark: '#1c2c1c' }),
    flora.oakGeometry({ rng: F.oakGeo, detail: 0, height: 12.5, foliage: !bare }),
    flora.willowGeometry({ rng: F.willowGeo, detail: 0, height: 10.5 }),
    // the orchard: in blossom in spring, bare under snow, plain small trees otherwise
    season === 'blossom' ? flora.cherryGeometry({ rng: F.orchardGeo, detail: 0, height: 5 }) : flora.oakGeometry({ rng: F.orchardGeo, detail: 0, height: 5, foliage: !bare, fullness: 0.8 }),
  ];
  await ctx.yield();
  const trees = flora.makeScatter({ rng: F.landScatter, material: o.floraMat, variants, points: pts, tint: 0.2, hue: 0.05, tilt: 0.03 });
  return trees;
}

// ---------------------------------------------------------------- things people built (one prop mesh)
function pylonInto(acc, x, y, z, lean, leanDir) {
  const H = 34, iron = [0.07, 0.075, 0.08], m = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(leanDir[1], 0, -leanDir[0]).normalize(), lean).setPosition(x, y, z);
  acc.set(m);
  const w = (h) => lerp(4.2, 0.7, Math.pow(h / H, 0.8)), lv = [0, 7, 13, 18.5, 23, 27, 30.5, H];
  for (let k = 0; k < lv.length - 1; k++) {
    const a = lv[k], b = lv[k + 1], wa = w(a), wb = w(b), c = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let i = 0; i < 4; i++) {
      const p = c[i], q = c[(i + 1) % 4];
      acc.cyl([p[0] * wa, a, p[1] * wa], [p[0] * wb, b, p[1] * wb], 0.13, 0.11, 3, iron, 0, 0);
      acc.cyl([p[0] * wa, a, p[1] * wa], [q[0] * wb, b, q[1] * wb], 0.06, 0.06, 3, iron, 0, 0);
      acc.cyl([p[0] * wb, b, p[1] * wb], [q[0] * wb, b, q[1] * wb], 0.06, 0.06, 3, iron, 0, 0);
    }
  }
  // three cross arms, across the line (the line runs along z)
  const arms = [];
  for (const [h, l] of [[23, 9], [27, 7.2], [30.5, 5.4]]) for (const sx of [-1, 1]) {
    acc.cyl([0, h, 0], [sx * l, h + 0.5, 0], 0.16, 0.07, 3, iron, 0, 0); acc.cyl([0, h + 2.2, 0], [sx * l, h + 0.5, 0], 0.07, 0.05, 3, iron, 0, 0);
    acc.cyl([sx * l, h + 0.5, 0], [sx * l, h - 1.1, 0], 0.07, 0.07, 3, [0.16, 0.2, 0.2], 0, 1);
    arms.push(new THREE.Vector3(sx * l, h - 1.1, 0).applyMatrix4(m));
  }
  acc.set(null);
  return arms;
}
function buildBuilt(ctx, S, o, F) {
  const L = o.land.shape, acc = new Acc(), st = new Strands(), gy = (x, z) => L.ground(x, z);
  const wire = [0.03, 0.03, 0.034];
  // Each kind has a stream of its own, and each thing is tested against the route in the land's frame (the land is
  // lower the further along the route the eye is); the test decides: the pylon line stands at the first line west
  // of its own that the route keeps 18 m from (towers and wires), anything else the route would meet is left out.
  const probe = o.hero.probe, rCab = F.pylonCables, rCut = F.cutWires, rLin = F.holeLining, rGal = F.galleries, rSag = F.sagging;
  const clearL = (x, y, z, m) => probe.land([x, y, z], m);
  // the pylons whose line ran north into the town: the last stands at the hole's edge, pulled over toward it
  const zs = [205, 62, -80, -222, -366], tops = [];
  const lineClear = (px) => { for (let z = zs[0]; z >= zs[zs.length - 1]; z -= 12) if (!probe.line('land', [px, gy(px, z), z], [px, gy(px, z) + 35, z], 18 + 9)) return false; return true; };
  const PX = [0, -20, -40, -60, -80].map((d) => PYLON_X + d).find(lineClear);
  for (let k = 0; k < zs.length && PX !== undefined; k++) { const last = k === zs.length - 1; tops.push(pylonInto(acc, PX, gy(PX, zs[k]) - 0.3, zs[k], last ? 0.2 : 0, [0.35, -1])); }
  for (let k = 0; k < tops.length - 1; k++) for (let a = 0; a < 6; a++) {
    const A = tops[k][a], B = tops[k + 1][a], pts = [], lev = [], n = 14, sag = 6.5, ph = rCab.range(0, TAU);
    for (let i = 0; i <= n; i++) { const t = i / n, sg = 4 * t * (1 - t) * sag; pts.push([lerp(A.x, B.x, t), lerp(A.y, B.y, t) - sg, lerp(A.z, B.z, t)]); lev.push(sg); }
    st.line(pts, 0.035, wire, (i) => [lev[i], ph, 0.05, 0.9]);
  }
  // from the last pylon the cut wires hang down, some into the hole
  for (let a = 0; a < 6 && tops.length; a++) {
    const A = tops[zs.length - 1][a], len = rCut.range(18, 40), ph = rCut.range(0, TAU), pts = [], lev = [], n = 8, dz = -rCut.range(0.15, 0.5);
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push([A.x + 0.3 * t, A.y - len * t, A.z + dz * len * t * t]); lev.push(len * t); }
    st.line(pts, 0.035, wire, (i) => [lev[i], ph, 0.05, 2.2 / Math.sqrt(len / 9.8)]);
  }
  // the farm: house, barn, a yard wall; one window lit (it stands only if the route keeps 24 m from its roofs)
  if (clearL(FARM.x + 8, gy(FARM.x, FARM.z) + 8, FARM.z + 4, 24 + 16)) {
    const fx = FARM.x, fz = FARM.z, y = gy(fx, fz) - 0.2, wall = [0.2, 0.17, 0.14], roof = [0.07, 0.05, 0.045], barn = [0.09, 0.06, 0.045];
    const gable = (cx, cz, w, d, h, rh, col) => {
      acc.box(cx, y + h / 2, cz, w, h, d, col);
      const x0 = cx - w / 2 - 0.4, x1 = cx + w / 2 + 0.4, z0 = cz - d / 2 - 0.4, z1 = cz + d / 2 + 0.4, t = y + h, r = t + rh;
      acc.quad([x0, t, z1], [x1, t, z1], [x1, r, cz], [x0, r, cz], roof); acc.quad([x1, t, z0], [x0, t, z0], [x0, r, cz], [x1, r, cz], roof);
      acc.tri([x0, t, z0], [x0, t, z1], [x0, r, cz], col); acc.tri([x1, t, z1], [x1, t, z0], [x1, r, cz], col);
    };
    gable(fx, fz, 11, 7.5, 5.6, 3.2, wall); gable(fx + 17, fz + 9, 9, 17, 6.2, 3.6, barn);
    acc.box(fx - 3.2, y + 6.8, fz, 0.9, 3.4, 0.9, [0.12, 0.07, 0.05]);                    // chimney
    acc.quad([fx - 5.52, y + 3.4, fz - 1.9], [fx - 5.52, y + 3.4, fz - 0.5], [fx - 5.52, y + 4.9, fz - 0.5], [fx - 5.52, y + 4.9, fz - 1.9], [0.3, 0.25, 0.15], 2.2);   // the lit window, looking at the road
    for (const [x0, z0, x1, z1] of [[fx - 9, fz - 9, fx + 24, fz - 9], [fx - 9, fz - 9, fx - 9, fz + 10]]) acc.box((x0 + x1) / 2, y + 0.6, (z0 + z1) / 2, Math.abs(x1 - x0) + 0.5, 1.2, Math.abs(z1 - z0) + 0.5, [0.13, 0.12, 0.11]);
  }
  // the fence where the road was closed, and two lorries behind it with their lamps on the hole
  {
    const x0 = roadX(FENCE_Z) - 40, x1 = roadX(FENCE_Z) + 50, wood = [0.11, 0.09, 0.07];
    for (let x = x0; x <= x1; x += 3.2) { const y = gy(x, FENCE_Z); if (clearL(x, y + 1.5, FENCE_Z, 8)) acc.box(x, y + 0.7, FENCE_Z, 0.16, 1.5, 0.16, wood); }
    for (let x = x0; x < x1; x += 3.2) for (const h of [0.55, 1.15]) if (clearL(x + 1.6, gy(x, FENCE_Z) + 1.5, FENCE_Z, 8)) acc.cyl([x, gy(x, FENCE_Z) + h, FENCE_Z], [x + 3.2, gy(x + 3.2, FENCE_Z) + h, FENCE_Z], 0.05, 0.05, 3, wood, 0, 0);
    for (const dz of [16, 31]) {
      const z = FENCE_Z + dz, x = roadX(z) + 1.4, y = gy(x, z) + 0.15, body = dz < 20 ? [0.1, 0.12, 0.1] : [0.12, 0.08, 0.07];
      if (!clearL(x, y + 2, z + 1.5, 12)) continue;
      acc.box(x, y + 1.9, z + 2.6, 2.4, 2.4, 5.2, body); acc.box(x, y + 1.45, z - 1.2, 2.3, 1.9, 2.2, [0.07, 0.07, 0.075]); acc.box(x, y + 0.55, z + 0.8, 2.2, 0.5, 8, [0.03, 0.03, 0.03]);
      for (const sx of [-0.8, 0.8]) { acc.box(x + sx, y + 1.0, z - 2.34, 0.34, 0.3, 0.08, [0.3, 0.3, 0.25], 4.5); acc.box(x + sx, y + 1.0, z + 5.24, 0.26, 0.2, 0.08, [0.1, 0.02, 0.01], -1.8); }
      acc.box(x, y + 2.05, z - 1.9, 1.9, 0.6, 0.06, [0.2, 0.19, 0.16], 0.35);                // the cab's lit windscreen
    }
  }
  // the signal box by the cut line, its signal at danger; slag heaps beyond
  {
    const z = -168, x = railX(z) + 8, y = gy(x, z);
    if (clearL(x, y + 4, z, 14)) { acc.box(x, y + 1.6, z, 4.2, 3.2, 6.5, [0.14, 0.075, 0.055]); acc.box(x, y + 4.3, z, 4.6, 2.2, 6.9, [0.16, 0.15, 0.13], 0.5); acc.box(x, y + 5.7, z, 5.4, 0.5, 7.7, [0.05, 0.045, 0.045]); }
    const sx = railX(z - 26) - 4, sz = z - 26, sy = gy(sx, sz);
    acc.cyl([sx, sy, sz], [sx, sy + 8.5, sz], 0.14, 0.1, 4, [0.1, 0.1, 0.1], 0, 1); acc.box(sx + 0.9, sy + 7.8, sz, 1.8, 0.34, 0.1, [0.25, 0.06, 0.04]); acc.box(sx - 0.2, sy + 7.3, sz, 0.3, 0.3, 0.3, [0.1, 0.02, 0.01], -2.2);
    for (const [hx, hz, hr, hh] of [[262, -238, 46, 21], [300, -286, 34, 15], [238, -180, 28, 12]]) { const hy = gy(hx, hz) - 1; if (clearL(hx, hy + hh * 0.5, hz, hr + 14)) acc.cyl([hx, hy, hz], [hx + 3, hy + hh, hz - 2], hr, hr * 0.12, 14, [0.035, 0.034, 0.036], 0, 1, [0.06, 0.057, 0.055]); }
  }
  // in the hole's wall: the other halves of the town's cut tunnels (dark now), and old mine galleries lower down
  const holeY = (a, yK) => yK - STREET;                                 // keel height -> land height (the street was ground level)
  // (every wall mouth of the town takes its numbers here, whether or not its other half is opened: no burnt deal)
  const spare = new Acc();
  for (const T of o.hero.roots.mouths.filter((t) => t.wall)) {
    const a = Math.atan2(T.p[2], T.p[0]), r = o.hero.shape.wallR(a, T.p[1]) + 1.2, q = [HERO.x + Math.cos(a) * r, holeY(a, T.p[1]), HERO.z + Math.sin(a) * r];
    tunnelInto(T.open && clearL(q[0], q[1] + 2.5, q[2], 12) ? acc : spare, { p: q, d: [-T.d[0], -T.d[1]], out: 1.5 }, rLin, 0.12);
  }
  for (let k = 0; k < 7; k++) {
    const a = rGal.range(0, TAU), yK = STREET - rGal.range(26, 30), r = o.hero.shape.wallR(a, yK) - 0.2, ca = Math.cos(a), sa = Math.sin(a), x = HERO.x + ca * r, z = HERO.z + sa * r, y = yK - STREET;
    if (!clearL(x, y + 1.2, z, 10)) continue;
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(-sa, 0, ca), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-ca, 0, -sa)).setPosition(x, y, z);
    acc.set(m);
    acc.box(-1.25, 1.1, 0.2, 0.3, 2.2, 0.5, [0.1, 0.075, 0.05]); acc.box(1.25, 1.1, 0.2, 0.3, 2.2, 0.5, [0.1, 0.075, 0.05]); acc.box(0, 2.35, 0.2, 3.1, 0.32, 0.5, [0.1, 0.075, 0.05]);
    acc.quad([-1.1, 0, 0.05], [1.1, 0, 0.05], [1.1, 2.2, 0.05], [-1.1, 2.2, 0.05], [0.004, 0.004, 0.005]);
    acc.set(null);
  }
  // the line's rails and the road's edge sag over the brink
  for (const [lx, n] of [[(z) => railX(z), 2], [(z) => roadX(z), 1]]) {
    let z = -300; for (let it = 0; it < 80 && Math.hypot(lx(z) - HERO.x, z - HERO.z) > RIM + 1.5; it++) z -= 1;
    for (let k = 0; k < n * 2; k++) {
      const g = n === 2 ? (k % 2 ? 0.72 : -0.72) + (k > 1 ? 4.4 : 0) : (k ? 3 : -3), len = rSag.range(9, 26), ph = rSag.range(0, TAU), pts = [], lev = [];
      const x = lx(z) + g, y0 = gy(x, z + 2) + (n === 2 ? 1.5 : 0.1);
      for (let i = -2; i <= 8; i++) { const t = Math.max(0, i / 8); pts.push([x + 0.6 * t * t, y0 - len * t * t * 0.9 - (i > 0 ? 0.6 * t : 0), z + 2 - (i < 0 ? i * 4 : 0) - len * 0.5 * t * (2 - t) - 2 * (i >= 0 ? 1 : 0)]); lev.push(len * t * t); }
      if (pts.every((q) => clearL(q[0], q[1], q[2], 9))) st.line(pts, n === 2 ? 0.09 : 0.14, n === 2 ? [0.06, 0.055, 0.05] : [0.05, 0.05, 0.055], (i) => [lev[i], ph, 0.012, 1.3]);
    }
  }
  return { acc, st };
}

// ---------------------------------------------------------------- the whole of it
// o: { land (the land part), hero (the hero part), path, season, floraMat (the kit's wind material, shared with the town's trees) }
export async function buildLandProps(ctx, S, o) {
  const F = o.forks, group = new THREE.Group();                 // the visit's streams (the list is in -common.js)
  const trees = await buildTrees(ctx, o, F);
  group.add(trees.object);
  await ctx.yield();
  const built = buildBuilt(ctx, S, o, F);
  group.add(new THREE.Mesh(built.acc.build(), makePropMaterial(S, { flicker: 0 })));
  const strandMat = makeStrandMaterial(S), strands = new THREE.Mesh(built.st.build(), strandMat); strands.frustumCulled = false;
  group.add(strands);
  await ctx.yield();
  // the river above the town still runs: where its bed was cut it pours into the hole and feeds the lake
  const sh = new Sheets(), a = Math.atan2(-675 + 2 - HERO.z, bedX(-676) - HERO.x), ca = Math.cos(a), sa = Math.sin(a);
  for (const [off, len, out] of [[0, 96, 13], [0.7, 88, 17]]) {
    const seed = F.landFall.range(0, 50);
    const top = (k) => { const b = a + (k / 8 - 0.5) * 17 / RIM, r = o.hero.shape.wallR(b, STREET - 3) - 0.6 - off; return [HERO.x + Math.cos(b) * r, -2.6 + off * 0.3, HERO.z + Math.sin(b) * r]; };
    // (tested down its whole curve in the land's frame: it falls only if the route keeps 24 m from its middle)
    if (o.hero.probe.fall('land', top(4), [-ca, -sa], out, len, 24, 0.8)) sh.sheet(8, top, { len, out, dir: [-ca, -sa], seed, kind: 0, nd: 18, spread: 0.45 });
  }
  const fallMat = makeFallMaterial(S);
  const fall = new THREE.Mesh(sh.build(), fallMat); fall.renderOrder = 3; fall.frustumCulled = false;
  group.add(fall);
  return {
    object: group, trees, triangles: trees.triangles + built.acc.triangles + built.st.triangles + sh.triangles,
    update(dt, time, camera) { trees.update(dt, time, camera); },
  };
}
