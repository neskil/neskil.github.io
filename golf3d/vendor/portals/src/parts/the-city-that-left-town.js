// THE CITY THAT LEFT, the town on top of the lens: the kit's street fabric, our own lots out to the cut edge, the crown
// tower with the open lantern the gateway stands in, the steel mill at the west lip, the river's two cut mouths, the
// railing along the rim, trees, trams. Everything here is hero-local (see parts/the-city-that-left-common.js).
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makePath, makeRng } from '../kit/core.js';
import * as S from '../kit/structures.js';
import * as flora from '../kit/flora.js';
import { RIM, STREET, HERO, AVE0, PITCH, STREET_W, GRID_ANGLE, TOWER, PATH_PTS, PATH_ABOVE_RIM, toGrid, fromGrid, makeForks, Acc, makePropMaterial, makeRouteProbe } from './the-city-that-left-common.js';

const BRICK = ['#6E3A2C', '#7a4433', '#5e3428', '#70503f', '#844a36'];
export const TOWN_PALETTES = {
  townhouse: { wall: BRICK, roof: ['#3a3230', '#4a3028', '#2f3238'], trim: '#a89c8a', wood: '#3a2a20', accent: '#FFC56B', awning: ['#5a2a24', '#2f3f4a', '#3a4a3c', '#6a5a34'], iron: '#191b1e' },
  modern: { wall: ['#6E3A2C', '#7b4a36', '#5a4a42', '#8a7460', '#57514C', '#66382c'], roof: '#2e2c2c', accent: '#3a2c1c', trim: '#a39a8c' },
  deco: { wall: ['#8f8474', '#7d766c', '#9a8c78', '#6f6a64', '#857562'], roof: '#3a3632', accent: '#FFC56B', trim: '#b5a68c', metal: '#52655a' },
};

// the part of the camera route that is above street level, in hero-local coordinates (the kit keeps roofs out of it)
export function cityPathLocal() {
  return makePath(PATH_PTS.slice(PATH_ABOVE_RIM).map((p) => [p[0] - HERO.x, p[1] - HERO.y, p[2] - HERO.z]));
}

// ---------------------------------------------------------------- the crown tower
// Built in the grid's frame: +x along the avenue (the way the camera flies), base centre at the origin, y = 0 the street.
function buildTower(mats, rng) {
  const b = new S.Builder(4096), stone = S.lin('#8a7f6e'), dark = S.lin('#5c564e'), trim = S.lin('#b0a38c'), copper = S.lin('#3f6a5c'), roof = S.lin('#33302c');
  b.push(new THREE.Matrix4().makeRotationY(GRID_ANGLE).setPosition(TOWER.x, STREET, TOWER.z));
  const seed = rng();
  // podium
  b.col(dark, 0.7, 1).surf(S.SURF.MASONRY, 0, 1.6); b.box(-14.5, 0, -14.5, 14.5, 3, 14.5, { m: 1 });
  b.col(stone, 0.75, 1).surf(S.SURF.ARCHED, seed, 1.5); b.box(-14, 3, -14, 14, 24, 14, { cellW: 5.6, cellH: 10.5, capColor: roof });
  b.col(trim, 0.9, 1).surf(S.SURF.PLAIN); b.box(-14.6, 23.2, -14.6, 14.6, 24.4, 14.6, { bottom: true, capColor: roof });
  // shaft with piers
  b.col(stone, 0.85, 1).surf(S.SURF.WINDOW, (seed + 0.3) % 1, 1); b.box(-13, 24, -13, 13, 96, 13, { cellW: 2.6, cellH: 3.6, capColor: roof });
  b.col(S.lin('#978b78'), 0.8, 1).surf(S.SURF.PLAIN);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cbox(sx * 12.4, 24, sz * 12.4, 3.4, 74.5, 3.4, {});
  for (const k of [-5.2, 0, 5.2]) { b.cbox(k, 24, 13.2, 0.9, 72.6, 0.7, {}); b.cbox(k, 24, -13.2, 0.9, 72.6, 0.7, {}); b.cbox(13.2, 24, k, 0.7, 72.6, 0.9, {}); b.cbox(-13.2, 24, k, 0.7, 72.6, 0.9, {}); }
  // the belvedere: a terrace with a parapet round the foot of the upper stage
  b.col(trim, 0.9, 1); b.box(-14.2, 95.2, -14.2, 14.2, 96.4, 14.2, { bottom: true, capColor: roof });
  for (const [x0, z0, x1, z1] of [[-14.2, 13.7, 14.2, 14.2], [-14.2, -14.2, 14.2, -13.7], [13.7, -14.2, 14.2, 14.2], [-14.2, -14.2, -13.7, 14.2]]) b.box(x0, 96.4, z0, x1, 97.5, z1, {});
  b.col(stone, 0.85, 1).surf(S.SURF.ARCHED, (seed + 0.6) % 1, 2); b.box(-11, 96.4, -11, 11, 108, 11, { cellW: 3.6, cellH: 11.6, capColor: roof });
  b.col(trim, 0.9, 1).surf(S.SURF.PLAIN); b.box(-11.7, 107.2, -11.7, 11.7, 108.3, 11.7, { bottom: true, capColor: S.lin('#4a443c') });
  // the open lantern: four piers, four arches 15.6 m wide
  b.col(stone, 0.8, 1).surf(S.SURF.MASONRY, 0.6, 1.3).flood(0.9, 108.3, 16);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cbox(sx * 9.4, 108.3, sz * 9.4, 3.2, 12, 3.2, { m: 1 });
  const AR = 7.8, springY = 118.2, topY = 128, n = 10;                 // arch: half-round on the piers
  const face = (fx, fz, tx, tz) => {                                    // a wall face from pier to pier with the arch cut out, where (fx, fz) is the outward normal and (tx, tz) runs along it
    for (let k = 0; k < n; k++) {
      const a0 = Math.PI * k / n, a1 = Math.PI * (k + 1) / n, c0 = Math.cos(a0) * AR, s0 = Math.sin(a0) * AR, c1 = Math.cos(a1) * AR, s1 = Math.sin(a1) * AR;
      for (const off of [11, 8.6]) {                                    // outer and inner skin
        const P = (c, y) => [fx * off + tx * c, y, fz * off + tz * c];
        const q = [P(c0, springY + s0), P(c1, springY + s1), P(c1, topY), P(c0, topY)];
        // the outer skin is floodlit like the piers; the inner skin and the soffit are not (seen through the arch
        // in front they are dark stone against the dusk, not a lit wall behind the gate)
        if (off === 11) { b.flood(0.9, 108.3, 16); b.quad(q[1], q[0], q[3], q[2], [c1 * 0.5, springY * 0.5, c0 * 0.5, topY * 0.5]); } else { b.flood(0); b.quad(q[0], q[1], q[2], q[3], [c0 * 0.5, springY * 0.5, c1 * 0.5, topY * 0.5]); }
      }
      // the soffit of the arch
      const A = [fx * 11 + tx * c0, springY + s0, fz * 11 + tz * c0], B2 = [fx * 11 + tx * c1, springY + s1, fz * 11 + tz * c1], C2 = [fx * 8.6 + tx * c1, springY + s1, fz * 8.6 + tz * c1], D = [fx * 8.6 + tx * c0, springY + s0, fz * 8.6 + tz * c0];
      b.quad(A, B2, C2, D, [0, k, 1, k + 1]);
    }
  };
  face(-1, 0, 0, 1); face(1, 0, 0, -1); face(0, 1, 1, 0); face(0, -1, -1, 0);
  b.flood(0.9, 108.3, 16);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cbox(sx * 9.4, 120.3, sz * 9.4, 3.2, 7.7, 3.2, { m: 1 });
  b.flood(0);
  // the lantern stands open and unlit: four piers, four arches, the dusk seen through them; only its ceiling takes a
  // little of the town's light from below
  b.col(S.lin('#6a6258'), 1, 1).surf(S.SURF.MASONRY, 0.5, 1.2).flood(0.12, 108, 30); b.quad([-8.6, 127.6, -8.6], [8.6, 127.6, -8.6], [8.6, 127.6, 8.6], [-8.6, 127.6, 8.6]); b.flood(0);
  // cornice and the stepped copper cap
  b.col(trim, 0.9, 1).surf(S.SURF.PLAIN); b.box(-12, 128, -12, 12, 129.6, 12, { bottom: true, capColor: copper });
  b.col(copper, 0.8, 1.05);
  b.frustum(0, 0, 21, 21, 18, 18, 129.6, 132.2); b.frustum(0, 0, 15, 15, 13, 13, 132.2, 134.4);
  b.pop();
  const mesh = new THREE.Mesh(b.toGeometry(), mats.facades);
  return { mesh, triangles: b.triangles };
}

// ---------------------------------------------------------------- lots between the kit's blocks and the cut edge
async function buildRimLots(ctx, mats, rng, city, path, keep, extra = [], probe = null) {
  const px = PITCH[0], pz = PITCH[1], sw = STREET_W, has = new Set(city.blocks.map((bl) => bl.i + ',' + bl.j));
  const objs = [...extra], lots = [], cl = toGrid(0, 0);
  const fits = (a0, c0, a1, c1) => { for (const [a, c] of [[a0, c0], [a1, c0], [a1, c1], [a0, c1]]) { const w = fromGrid(a, c); if (Math.hypot(w[0], w[1]) > RIM - 2.6) return false; } return true; };
  for (let i = -6; i <= 5; i++) for (let j = -6; j <= 5; j++) {
    if (has.has(i + ',' + j)) continue;
    const a0 = i * px + sw / 2 + 1.2, a1 = (i + 1) * px - sw / 2 - 1.2, c0 = j * pz + sw / 2 + 1.2, c1 = (j + 1) * pz - sw / 2 - 1.2;
    const na = 4, nc = 3;
    for (let p = 0; p < na; p++) for (let q = 0; q < nc; q++) {
      let la0 = lerp(a0, a1, p / na) + (p ? 0.4 : 0), la1 = lerp(a0, a1, (p + 1) / na) - (p < na - 1 ? 0.4 : 0), lc0 = lerp(c0, c1, q / nc) + (q ? 0.4 : 0), lc1 = lerp(c0, c1, (q + 1) / nc) - (q < nc - 1 ? 0.4 : 0);
      // a lot the cut went through keeps what is left of it on the town's side
      let best = null, area = 0;
      const ia = Math.abs(la0 - cl[0]) < Math.abs(la1 - cl[0]), ic = Math.abs(lc0 - cl[1]) < Math.abs(lc1 - cl[1]);
      for (const sa of [1, 0.85, 0.7, 0.56]) for (const sc of [1, 0.85, 0.7, 0.56]) {
        if (sa * sc <= area) continue;
        const ta0 = ia ? la0 : la1 - (la1 - la0) * sa, ta1 = ia ? la0 + (la1 - la0) * sa : la1, tc0 = ic ? lc0 : lc1 - (lc1 - lc0) * sc, tc1 = ic ? lc0 + (lc1 - lc0) * sc : lc1;
        if (fits(ta0, tc0, ta1, tc1)) { best = [ta0, tc0, ta1, tc1]; area = sa * sc; }
      }
      if (!best) continue;
      la0 = best[0]; lc0 = best[1]; la1 = best[2]; lc1 = best[3];
      if (Math.min(la1 - la0, lc1 - lc0) < 5) continue;
      const mid = fromGrid((la0 + la1) / 2, (lc0 + lc1) / 2);
      if (!keep(mid[0], mid[1], Math.hypot(la1 - la0, lc1 - lc0) / 2)) continue;
      const near = path.nearestXZ(mid[0], mid[1]);
      const warehouse = rng.chance(0.45), floors = warehouse ? rng.int(4, 7) : rng.int(3, 5);
      let h = warehouse ? floors * 4.2 : floors * 3.3;
      if (near.dist < 24) h = Math.min(h, near.y - STREET - 9);
      if (h < 7) continue;
      // and up its whole height the route keeps 10 m from its walls, or the lot stays empty
      if (probe && !probe.line('hero', [mid[0], STREET, mid[1]], [mid[0], STREET + h + 3, mid[1]], Math.hypot(la1 - la0, lc1 - lc0) / 2 + 10)) continue;
      // the front looks at the nearest street
      const da = Math.min(la0 - a0, a1 - la1), dc = Math.min(lc0 - c0, c1 - lc1);
      const face = dc <= da ? (lc0 - c0 < c1 - lc1 ? 2 : 0) : (la0 - a0 < a1 - la1 ? 3 : 1);
      lots.push({ x: mid[0], z: mid[1], w: la1 - la0, d: lc1 - lc0, h, warehouse, face });
    }
  }
  for (const L of lots) {
    const turned = L.face % 2 === 1, width = turned ? L.d : L.w, depth = turned ? L.w : L.d;
    const geo = S.buildingGeometry(L.warehouse
      ? { rng, style: 'modern', width, depth, height: L.h, detail: 0.5, windows: S.SURF.WINDOW, palette: TOWN_PALETTES.modern }
      : { rng, style: 'townhouse', width, depth, height: L.h, detail: 0.5, terrace: true, shop: false, palette: TOWN_PALETTES.townhouse });
    const m = new THREE.Mesh(geo, mats.facades); m.position.set(L.x, STREET - 0.3, L.z); m.rotation.y = GRID_ANGLE + L.face * Math.PI / 2;
    objs.push(m); L.h = geo.userData.h ?? L.h;
    if (objs.length % 10 === 0) await ctx.yield();
  }
  await ctx.yield();
  // baked in three sectors of the rim, a short step each
  const object = new THREE.Group(); let triangles = 0;
  for (let k = 0; k < 3; k++) {
    const part = objs.filter((m) => Math.floor(((Math.atan2(m.position.z, m.position.x) + Math.PI) / (Math.PI * 2)) * 3) % 3 === k);
    if (!part.length) continue;
    const merged = S.mergeObjects(part); object.add(merged.object); triangles += merged.triangles;
    await ctx.yield();
  }
  return { object, triangles, lots };
}

// ---------------------------------------------------------------- the steel mill at the west lip
// Its yard was cut through by the rim: two brick sheds, four stacks with a red lamp each, a gasholder in its guide
// frame, sidings that run to the edge (and hang over it: see buildHanging in the hero file). Hero-local, not on the grid.
export const MILL = {
  sheds: [{ x: -156, z: 38, w: 30, d: 74, h: 17 }, { x: -153, z: -52, w: 26, d: 54, h: 14 }],
  stacks: [{ x: -178, z: 68, h: 52 }, { x: -185, z: 28, h: 64 }, { x: -186, z: -40, h: 68 }, { x: -178, z: -66, h: 58 }],
  holder: { x: -193, z: -8, r: 12.5, h: 17 },
};
function buildMill(acc, mats, rng, mill) {
  const MILL = mill, objs = [], brick = [0.15, 0.072, 0.05], soot = [0.05, 0.04, 0.036], iron = [0.05, 0.054, 0.06], Y = STREET - 0.3;
  for (const sh of MILL.sheds) {
    const geo = S.buildingGeometry({ rng, style: 'modern', width: sh.w, depth: sh.d, height: sh.h, detail: 0.4, windows: S.SURF.ARCHED, palette: TOWN_PALETTES.modern });
    const m = new THREE.Mesh(geo, mats.facades); m.position.set(sh.x, Y, sh.z); objs.push(m);
    // saw-tooth roof lights along the shed
    const top = Y + (geo.userData.h ?? sh.h), n = Math.floor(sh.d / 9);
    for (let k = 0; k < n; k++) {
      const z0 = sh.z - sh.d / 2 + 2 + k * (sh.d - 4) / n, z1 = z0 + (sh.d - 4) / n, x0 = sh.x - sh.w / 2 + 1.5, x1 = sh.x + sh.w / 2 - 1.5;
      acc.quad([x0, top, z0], [x1, top, z0], [x1, top + 3.2, z0], [x0, top + 3.2, z0], [0.2, 0.19, 0.15], 0.5);      // the glazed face, lit from inside
      acc.quad([x0, top + 3.2, z0], [x1, top + 3.2, z0], [x1, top, z1], [x0, top, z1], [0.045, 0.045, 0.05]);
      acc.tri([x0, top, z0], [x0, top + 3.2, z0], [x0, top, z1], soot); acc.tri([x1, top, z0], [x1, top, z1], [x1, top + 3.2, z0], soot);
    }
  }
  for (const st of MILL.stacks) {
    const b = Y, mid = b + st.h * 0.62, top = b + st.h;
    acc.box(st.x, b + 3, st.z, 8.6, 6, 8.6, brick);
    acc.cyl([st.x, b + 6, st.z], [st.x, mid, st.z], 3.5, 2.8, 12, brick, 0, 0);
    acc.cyl([st.x, mid, st.z], [st.x, top, st.z], 2.8, 2.25, 12, brick, 0, 1, soot);
    for (const f of [0.3, 0.62, 0.9]) { const y = b + 6 + (st.h - 6) * f, r = lerp(3.5, 2.25, f) + 0.14; acc.cyl([st.x, y, st.z], [st.x, y + 0.5, st.z], r, r, 12, iron, 0, 0); }
    acc.cyl([st.x, top, st.z], [st.x, top + 1.1, st.z], 2.6, 2.6, 12, soot, 0, 1, [0.004, 0.004, 0.004]);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.6; acc.box(st.x + Math.cos(a) * 2.75, top + 0.4, st.z + Math.sin(a) * 2.75, 0.5, 0.5, 0.5, soot, -1.6); }
  }
  // the gasholder: a riveted tank inside a ring of columns
  const H = MILL.holder, hb = Y;
  acc.cyl([H.x, hb, H.z], [H.x, hb + H.h, H.z], H.r, H.r, 28, iron, 0, 0, [0.07, 0.074, 0.08]);
  acc.cyl([H.x, hb + H.h, H.z], [H.x, hb + H.h + 2.6, H.z], H.r, 0.5, 28, [0.06, 0.064, 0.07], 0, 1);
  for (const f of [0.33, 0.66, 1]) acc.cyl([H.x, hb + H.h * f - 0.3, H.z], [H.x, hb + H.h * f, H.z], H.r + 0.18, H.r + 0.18, 28, soot, 0, 0);
  const cols = 12, fr = H.r + 1.6, fh = H.h + 9;
  for (let k = 0; k < cols; k++) {
    const a = k / cols * Math.PI * 2, a2 = (k + 1) / cols * Math.PI * 2, x = H.x + Math.cos(a) * fr, z = H.z + Math.sin(a) * fr, x2 = H.x + Math.cos(a2) * fr, z2 = H.z + Math.sin(a2) * fr;
    acc.cyl([x, hb, z], [x, hb + fh, z], 0.34, 0.26, 5, soot, 0, 1);
    for (const y of [hb + fh * 0.5, hb + fh - 0.4]) acc.cyl([x, y, z], [x2, y, z2], 0.16, 0.16, 4, soot, 0, 0);
    acc.cyl([x, hb + fh * 0.5, z], [x2, hb + fh - 0.4, z2], 0.09, 0.09, 3, soot, 0, 0);
  }
  acc.box(H.x, hb + fh + 0.6, H.z + fr, 0.5, 0.5, 0.5, soot, -1.6);
  // sidings across the yard to the cut edge
  for (const [x0, z0, x1, z1] of [[-140, -6, -214, -40], [-140, -12, -205, -76], [-138, 8, -217, 22]]) {
    const l = Math.hypot(x1 - x0, z1 - z0), nx = -(z1 - z0) / l, nz = (x1 - x0) / l;
    for (const g of [-0.72, 0.72]) acc.cyl([x0 + nx * g, Y + 0.42, z0 + nz * g], [x1 + nx * g, Y + 0.42, z1 + nz * g], 0.09, 0.09, 3, [0.09, 0.085, 0.08], 0, 0);
    for (let d = 1; d < l; d += 2.4) { const cx = lerp(x0, x1, d / l), cz = lerp(z0, z1, d / l); acc.cyl([cx - nx * 1.2, Y + 0.34, cz - nz * 1.2], [cx + nx * 1.2, Y + 0.34, cz + nz * 1.2], 0.12, 0.12, 3, [0.04, 0.032, 0.026], 0, 0); }
  }
  return objs;
}

// ---------------------------------------------------------------- the river's cut ends, the barred street ends
function buildEdges(acc, mats, city, shape, group) {
  const px = PITCH[0], pz = PITCH[1], sw = STREET_W, stone = [0.17, 0.165, 0.155], Y = STREET;
  const M = new THREE.Matrix4().makeRotationY(GRID_ANGLE).setPosition(AVE0[0], 0, AVE0[1]);
  // how far along a grid line (a fixed, c running; or the other way) the cut edge is
  const edge = (fix, dir, alongC, inset) => { let t = 150 * dir; for (let it = 0; it < 60; it++) { const w = alongC ? fromGrid(fix, t) : fromGrid(t, fix), r = Math.hypot(w[0], w[1]); if (r > shape.wallR(Math.atan2(w[1], w[0]), Y) - inset) break; t += dir * 1.5; } return t; };
  acc.set(M);
  const water = [];
  for (const dir of [1, -1]) {
    // the kit's quays end with its blocks; from there to the edge the embankments are ours
    let from = 150 * dir;
    for (const bl of city.blocks) if (bl.i === 0 || bl.i === -1) from = dir > 0 ? Math.max(from, bl.z1 + 0.3) : Math.min(from, bl.z0 - 0.3);
    for (const side of [-1, 1]) {
      const to = edge(side * 13.5, dir, true, 1.2), c0 = Math.min(from, to), c1 = Math.max(from, to);
      if (c1 - c0 < 1) continue;
      acc.box(side * 13.4, Y - 1.75, (c0 + c1) / 2, 5.6, 3.9, c1 - c0, stone);
      acc.box(side * 11.1, Y + 0.65, (c0 + c1) / 2, 0.5, 0.9, c1 - c0, [0.2, 0.195, 0.18]);
    }
    const wEnd = edge(0, dir, true, 0.4), k0 = dir > 0 ? 196 : -172.5;
    water.push([Math.min(k0, wEnd), Math.max(k0, wEnd)]);
  }
  // street ends: trestles with red lamps a few metres short of the drop
  const trestle = (a, c, alongC) => {
    for (const o of [-6.5, 0, 6.5]) {
      const x = alongC ? a + o : a, z = alongC ? c : c + o, sx = alongC ? 5 : 0.3, sz = alongC ? 0.3 : 5;
      acc.box(x, Y + 0.95, z, sx, 0.28, sz, [0.3, 0.28, 0.24]); acc.box(x, Y + 0.5, z, sx * 0.94, 0.12, sz * 0.94, [0.12, 0.1, 0.09]);
      for (const e of [-0.45, 0.45]) acc.box(x + (alongC ? e * 5 : 0), Y + 0.5, z + (alongC ? 0 : e * 5), 0.16, 1.0, 0.16, [0.06, 0.055, 0.05]);
      acc.box(x, Y + 1.3, z, 0.26, 0.3, 0.26, [0.1, 0.02, 0.01], -2.2);
    }
  };
  for (let i = -4; i <= 4; i++) { if (i === 0) continue; for (const dir of [1, -1]) { const c = edge(i * px, dir, true, 7); const w = fromGrid(i * px, c); if (w[0] < -116 && Math.abs(w[1]) < 96) continue; trestle(i * px, c, true); } }
  for (let j = -4; j <= 4; j++) for (const dir of [1, -1]) { const a = edge(j * pz, dir, false, 7); const w = fromGrid(a, j * pz); if ((w[0] < -116 && Math.abs(w[1]) < 96) || (j === 0 && dir > 0)) continue; trestle(a, j * pz, false); }
  acc.set(null);
  // the river itself, from where the kit's water stops to the lip
  const wb = new S.Builder(64); wb.push(M);
  for (const [c0, c1] of water) wb.quad([-11, Y - 1.7, c1], [11, Y - 1.7, c1], [11, Y - 1.7, c0], [-11, Y - 1.7, c0]);
  wb.pop();
  group.add(new THREE.Mesh(wb.toGeometry(), mats.canal({ deep: S.lin('#0a1826'), shallow: S.lin('#27365A') })));
}

// ---------------------------------------------------------------- the town
export async function buildTown(ctx, shared, mats, opts = {}) {
  const F = opts.forks || makeForks(ctx), group = new THREE.Group();     // the visit's streams (the list is in -common.js)
  const path = cityPathLocal();
  await ctx.yield();
  // the kit keeps its blocks out of the camera's way by asking the path; the same question keeps the mill's yard at the
  // west lip and the tower's plot free (a path-like object: "the route passes here, far below the roofs")
  const inYard = (x, z) => x < -122 && Math.abs(z) < 88;
  const inPlot = (x, z) => { const g = toGrid(x, z), t = toGrid(TOWER.x, TOWER.z); return Math.abs(g[0] - t[0]) < 17 && Math.abs(g[1] - t[1]) < 19; };
  // The kit lays the whole town out in one call, which is too long a step: it is called once per piece of the town
  // instead (four bands along the avenue by four across it; all cuts lie on street lines, so no building straddles
  // two). Every call gets the same stream, so all agree on which blocks exist; a call's path-like object says "the
  // route passes here" outside its own piece. Three calls with no piece at all lay the ground and the water, the
  // lamps, the traffic.
  const citySeed = Math.floor(F.city() * 1e9), parts = [], cityGroup = new THREE.Group();
  const pieceOf = (x, z) => { const g = toGrid(x, z); return clamp(Math.floor(g[0] / PITCH[0]), -2, 1) + 2 + 4 * (clamp(Math.floor(g[1] / PITCH[1]), -2, 1) + 2); };
  for (let q = -3; q < 16; q++) {
    const kitPath = { length: path.length, pointAt: (u, o) => path.pointAt(u, o), nearestXZ: (x, z) => (pieceOf(x, z) !== q || inYard(x, z) || inPlot(x, z) ? { dist: 0, u: 0, y: STREET - 60 } : path.nearestXZ(x, z)) };
    const part = S.makeCity({
      rng: makeRng(citySeed), mats, path: kitPath, center: [0, 0], origin: AVE0, radius: 176, block: [PITCH[0] - STREET_W, PITCH[1] - STREET_W], street: STREET_W, angle: GRID_ANGLE,
      groundY: STREET, maxHeight: 100, minHeight: 24, core: 0.46, midEdge: 0.93, detail: 0.5, corridor: 10, clearY: 6, chunk: 150,
      canalLines: { x: [0] }, boats: 0, traffic: q === -1 ? 4 : 0, lamps: q === -2, water: q === -3, landmark: false, lampRadius: 1.3, lampSpacing: 44, lampColor: '#FFC56B',
      styles: { core: ['deco'], mid: ['block', 'block', 'deco'], outer: ['townhouse'] }, building: TOWN_PALETTES,
      palette: { sidewalk: '#5a5856', asphalt: '#2c2d31', water: '#0a1826', waterShallow: '#27365A', deck: '#3a3a3c' },
    });
    if (q !== -3) part.object.remove(part.ground);
    parts.push(part); cityGroup.add(part.object);
    await ctx.yield();
  }
  const city = { object: cityGroup, buildings: parts.flatMap((c) => c.buildings), blocks: parts[0].blocks, triangles: parts.reduce((n, c) => n + c.triangles, 0), update(dt, time) { for (const c of parts) c.update(dt, time); } };
  group.add(city.object);
  const tower = buildTower(mats, F.tower);
  group.add(tower.mesh);
  await ctx.yield();
  // keep the tower's plot, the mill's yard at the west lip and the river free of rim lots
  const keep = (x, z, r) => {
    if (Math.hypot(x - TOWER.x, z - TOWER.z) < 21 + r) return false;
    const g = toGrid(x, z); if (Math.abs(g[0]) < 12.5 + r * 0.7) return false;
    if (x < -118 - r && Math.abs(z) < 92 + r) return false;
    return true;
  };
  // our own props on the town: the mill, the river's cut ends, the barred street ends (one mesh)
  const acc = new Acc();
  // the mill stands where it stood; a stack or a shed the route would pass within 14 m of is not there (tested up its height)
  const probe = opts.probe || makeRouteProbe();
  const mill = { sheds: MILL.sheds.filter((sh) => probe.line('hero', [sh.x, STREET, sh.z], [sh.x, STREET + sh.h + 4, sh.z], Math.max(sh.w, sh.d) * 0.5 + 14)), stacks: MILL.stacks.filter((st) => probe.line('hero', [st.x, STREET, st.z], [st.x, STREET + st.h + 2, st.z], 14)), holder: MILL.holder };
  const millObjs = buildMill(acc, mats, F.mill, mill);
  await ctx.yield();
  buildEdges(acc, mats, city, opts.shape, group);
  // what stands on the flat roofs round the tower (stream 'roofThings'): a water tank on legs, a lit skylight or a
  // planted box with its lamp; nothing where the route passes within 9 m
  const rRT = F.roofThings; let roofThings = 0, roofTries = 0;
  for (const bl of city.buildings) {
    if (Math.hypot(bl.x - TOWER.x, bl.z - TOWER.z) > 180 || bl.h < 20 || bl.h > 78 || roofTries >= 90 || !rRT.chance(0.75)) continue;
    roofTries++;
    const x = bl.x + rRT.range(-0.16, 0.16) * bl.w, z = bl.z + rRT.range(-0.16, 0.16) * bl.d, y = STREET + bl.h + 0.1, kind = rRT.int(0, 2), s = rRT.range(0.85, 1.25);
    if (!probe.hero([x, y + 3, z], 9)) continue;
    if (kind === 0) {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) acc.box(x + sx * 1.1 * s, y + 1.1, z + sz * 1.1 * s, 0.18, 2.2, 0.18, [0.03, 0.03, 0.032]);
      acc.cyl([x, y + 2.2, z], [x, y + 5 * s, z], 1.6 * s, 1.6 * s, 9, [0.1, 0.075, 0.05], 0, 1, [0.07, 0.055, 0.04]);
      acc.cyl([x, y + 5 * s, z], [x, y + 5 * s + 1.1, z], 1.75 * s, 0.1, 9, [0.05, 0.05, 0.055]);
    } else if (kind === 1) {
      acc.box(x, y + 0.35, z, 3.6 * s, 0.7, 2.3 * s, [0.05, 0.05, 0.05]); acc.box(x, y + 0.75, z, 3.2 * s, 0.12, 1.9 * s, [0.3, 0.26, 0.17], 2.4);
    } else {
      acc.box(x, y + 0.35, z, 5 * s, 0.7, 3 * s, [0.05, 0.04, 0.03]); acc.box(x - s, y + 1.1, z, 2.2 * s, 1.1, 2 * s, [0.03, 0.055, 0.03]); acc.box(x + 1.4 * s, y + 0.95, z + 0.3, 1.3 * s, 0.7, 1.5 * s, [0.04, 0.065, 0.03]);
      acc.box(x + 2.2 * s, y + 1.5, z - 1.2 * s, 0.1, 2.3, 0.1, [0.03, 0.03, 0.03]); acc.box(x + 2.2 * s, y + 2.7, z - 1.2 * s, 0.3, 0.3, 0.3, [0.3, 0.26, 0.17], 3.5);
    }
    roofThings++;
  }
  const props = new THREE.Mesh(acc.build(), makePropMaterial(shared, { flicker: 0 }));
  group.add(props);
  await ctx.yield();
  const lots = await buildRimLots(ctx, mats, F.lots, city, path, keep, millObjs, probe);
  group.add(lots.object);
  await ctx.yield();
  // two trams on one loop: out along the avenue, back along the next street
  const px = PITCH[0], pz = PITCH[1], loop = [];
  const ring = [[-2 * px, 0], [2 * px, 0], [2 * px, -pz], [-2 * px, -pz]];
  for (let k = 0; k < 4; k++) {
    const A = ring[k], B = ring[(k + 1) % 4], la = B[0] - A[0], lc = B[1] - A[1], l = Math.hypot(la, lc), n = Math.max(2, Math.round(l / 30));
    for (let i = 0; i <= n; i++) { const t = (i / n), r = 10 / l, tt = lerp(r, 1 - r, t), w = fromGrid(A[0] + la * tt, A[1] + lc * tt); loop.push([w[0], STREET + 0.02, w[1]]); }
  }
  const tramRng = [F.tram0, F.tram1];
  // plane trees down the avenue; and trees the cut left standing on the very edge, roots in the air (the hero part hangs them)
  const tr = F.townTrees, pts = [], rimTrees = [];
  for (let a = -150; a < 120; a += 21) for (const c of [-8.4, 8.4]) {
    if (Math.abs(a) < 17 || Math.abs(a / px - Math.round(a / px)) * px < 13.5) continue;
    const w = fromGrid(a + tr.range(-1.5, 1.5), c), sz = tr.range(0.75, 1), rot = tr.range(0, 6.283);
    if (probe.line('hero', [w[0], STREET, w[1]], [w[0], STREET + 12, w[1]], 12)) pts.push({ x: w[0], y: STREET, z: w[1], s: sz, rot, v: 0, u: 0, d: 0 });
  }
  for (let k = 0; k < 300 && rimTrees.length < 11; k++) {
    const a = tr.range(0, Math.PI * 2), r = opts.shape.wallR(a, STREET) - tr.range(2.6, 4.2), x = Math.cos(a) * r, z = Math.sin(a) * r, g = toGrid(x, z);
    const ca = Math.abs(g[0] / px - Math.round(g[0] / px)) * px, cc = Math.abs(g[1] / pz - Math.round(g[1] / pz)) * pz;
    if (Math.min(ca, cc) < 13 || inYard(x, z) || Math.abs(g[0]) < 18) continue;                        // not in a street, the mill's yard or the river
    if (lots.lots.some((L) => Math.hypot(L.x - x, L.z - z) < Math.max(L.w, L.d) * 0.5 + 3.5) || city.buildings.some((b) => Math.hypot(b.x - x, b.z - z) < Math.max(b.w, b.d) * 0.5 + 3.5)) continue;
    if (rimTrees.some((t) => Math.hypot(t.x - x, t.z - z) < 30) || !probe.line('hero', [x, STREET - 9, z], [x, STREET + 14, z], 12)) continue;
    rimTrees.push({ x, z, a }); pts.push({ x, y: STREET - 0.3, z, s: tr.range(0.85, 1.15), rot: tr.range(0, 6.283), v: 0, u: 0, d: 0 });
  }
  let floraMat = opts.floraMat;
  if (!floraMat) { await flora.prepareLeafTexture({}, ctx.yield); floraMat = flora.windMaterial({ wind: flora.makeWind({ direction: [0.5, -0.85], strength: 0.75 }), backlight: 0.5 }); }
  const trees = flora.makeScatter({ rng: F.townScatter, material: floraMat, variants: [flora.oakGeometry({ rng: F.townTreeGeo, detail: 0, height: 11, leaf: '#4a6a34', bark: '#8a8474' })], points: pts, tilt: 0.02 });
  group.add(trees.object);
  await ctx.yield();
  // the two trams keep half a loop apart; where on the loop they are as the visit begins is the visit's own draw
  const loopLen = 2 * (4 * px + pz), tram0 = F.tramStart() * loopLen;
  const trams = tramRng.map((r, k) => S.makeTrain({ rng: r, mats, points: loop, closed: true, type: 'tram', cars: 0, speed: 7.5, start: (tram0 + k * loopLen / 2) % loopLen, beam: false }));
  // (their line is tested too: a tram runs only if the route keeps 14 m from every point of the loop)
  if (loop.every((q) => probe.hero([q[0], q[1] + 3, q[2]], 14))) for (const t of trams) group.add(t.object);
  await ctx.yield();
  return {
    object: group, city, tower, lots, props, trams, path, mill, rimTrees, trees, triangles: city.triangles + tower.triangles + lots.triangles + acc.triangles + trees.triangles + trams.reduce((n, t) => n + t.triangles, 0),
    update(dt, time, camera) { city.update(dt, time); for (const t of trams) t.update(dt, time, camera); trees.update(dt, time, camera); },
  };
}
