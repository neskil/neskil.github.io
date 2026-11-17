// STILL WARM
// Six on a January morning in a Montreal row house, seen only as heat. A white-hot thermal picture that is built,
// not filtered: every surface writes a temperature and one ramp turns it into black, charcoal, slate, ash, bone
// white and, only above 50 C, gold. The boiler lights, hot water races through the walls as a forking tree of gold,
// radiators fill rib by rib, and the people who live here are present only as prints that fade.
//
// The house is eight times life size (src/parts/still-warm.js holds its dimensions, the thermal shader kit and the
// heating system). Flight: into the cellar between two brick piers (boiler and cylinder on the axis under a ceiling
// that recedes to black, one gold pipe overhead), bowing west round the boiler's flank -> a climbing right-hand turn up
// through the cellar well -> the east hall coming forward (kitchen, hall radiator, the newel with the handprint) ->
// a second climbing right-hand turn round the stairwell (the tree on the street wall, forking to three radiators at
// three stages) -> the top landing, flown slowly (bed bay, bath bay, the cat on the chest) -> the landing window,
// where the last of the 22 radiators fills under the portal.
// Three rooms are composed round one hot thing each, with the greys closing down round it as it comes on: the long
// radiator by the settle (seen filling rib by rib from the well, u 0.28 to 0.385), the kitchen range (u 0.40 to 0.46) and
// the hot tank in its airing cupboard at the head of the top landing (u 0.652 on). The window end keeps slate walls: gold
// on the radiator, round the arch and in the floor.
// Looks by seed: January dawn (slate, hardest contrast) / the night the power comes back (charcoal and black, thick
// frost, a parlour stove, a hollow on the sofa) / a February afternoon (sun-warmed parallelograms, tea laid, more
// prints). Casts: cat or old dog, bath or shower, kettle or coffee pot. Rare: the front door opens and shuts.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as INT from '../kit/interior.js';
import { buildHero, thermalShared, thermalMaterial, makeTB, addHalo, addEmitter, bakeEmitters, HOUSE as H, PATH_POINTS, T, KIND, THERMAL_GLSL } from '../parts/still-warm.js';

const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp;
const sstep = (x, a, b) => THREE.MathUtils.smoothstep(x, a, b);
const DUR = 41, S = 8;

// ---- flat pieces: a quad with a given normal, and the three axis-aligned shorthands
function quad(tb, P, n, o) {
  const ax = P[1][0] - P[0][0], ay = P[1][1] - P[0][1], az = P[1][2] - P[0][2], bx = P[3][0] - P[0][0], by = P[3][1] - P[0][1], bz = P[3][2] - P[0][2];
  const d = (ay * bz - az * by) * n[0] + (az * bx - ax * bz) * n[1] + (ax * by - ay * bx) * n[2];
  const Q = d < 0 ? [P[0], P[3], P[2], P[1]] : P, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...Q[0], ...Q[1], ...Q[2], ...Q[3]], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([...n, ...n, ...n, ...n], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  tb.add(g, o);
}
const rx = (tb, x, z0, z1, y0, y1, dir, o) => quad(tb, [[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]], [dir, 0, 0], o);
const rz = (tb, z, x0, x1, y0, y1, dir, o) => quad(tb, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], [0, 0, dir], o);
const ry = (tb, y, x0, x1, z0, z1, dir, o) => quad(tb, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], [0, dir, 0], o);
// a box given by its extents
const bx = (tb, x0, x1, y0, y1, z0, z1, o) => tb.box(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), { ...o, p: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2] });
// a kit prop (real metres x 8): its vertex colours become small temperature differences, its sway weights carry over
function kit(tb, geo, o) {
  const col = geo.attributes.color, sf = geo.attributes.surf; let i = 0;
  const tv = o.tv ?? 0.22, sw = o.sway ?? 0;
  tb.add(geo, { ...o, fn: (x, y, z, out) => {
    if (col) out[0] = (o.t ?? T.WOOD) + (0.3 * col.getX(i) + 0.6 * col.getY(i) + 0.1 * col.getZ(i) - 0.22) * tv;
    if (sf && sw) out[3] = (1 - sf.getW(i)) * sw;
    if (o.heat) o.heat(x, y, z, out);
    i++;
  } });
}
const turned = (h, r) => new THREE.LatheGeometry([[0.5, 0], [0.5, 0.05], [0.3, 0.1], [0.42, 0.22], [0.62, 0.34], [0.36, 0.5], [0.26, 0.7], [0.4, 0.86], [0.3, 0.93], [0.46, 1]].map((p) => new THREE.Vector2(p[0] * r, p[1] * h)), 7);

export default {
  id: 'still-warm',
  name: 'Still Warm',
  category: 'domestic',
  weirdness: 0.5,
  media: ['interior', 'tiny'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070708');
    const shared = thermalShared();
    await ctx.yield();
    const path = makePath(PATH_POINTS);
    await ctx.yield();
    const mat = thermalMaterial(shared), mat2 = thermalMaterial(shared, { side: THREE.DoubleSide });

    // ---- which visit: 0 January dawn, 1 a February afternoon, 2 the night the power comes back
    const mood = vary.mood ?? rng();
    let look = mood < 0.38 ? 0 : mood < 0.6 ? 1 : 2;
    if (vary.hour === 'dawn') look = 0; else if (vary.hour === 'day' || vary.hour === 'golden') look = 1; else if (vary.hour === 'night') look = 2;
    const cast = { dog: look === 1 ? rng() < 0.7 : rng() < 0.25, shower: look === 2 ? rng() < 0.6 : rng() < 0.3, coffee: look === 1 ? rng() < 0.3 : rng() < 0.5 };
    const rare = !!vary.rare, density = vary.density ?? 1;
    shared.uShift.value = [0, 0.045, -0.085][look];
    shared.uSun.value = look === 1 ? 1 : 0;
    shared.uTop.value = [-0.062, -0.05, -0.115][look];          // the top storey: slate to charcoal by day, near black on the night visit
    shared.uDark.value = [0.8, 1, 0.5][look];                     // how far the composed rooms close down round their hot thing
    const lit = look !== 2;                                     // on the night the power came back the kitchen range is cold
    shared.uToe.value = lit ? 1 : 0;

    const hero = await buildHero(ctx, { shared, path, material: mat, look, bake: false });
    scene.add(hero.object);
    const A = hero.anchors, K = A.keys, RAD = Object.fromEntries(A.radiators.map((r) => [r.id, r]));
    await ctx.yield();
    // u of the path sample nearest a place (3D)
    const NS = 600, samp = []; for (let i = 0; i <= NS; i++) samp.push(path.pointAt(i / NS));
    const uAt = (x, y, z) => { let b = 1e9, bi = 0; for (let i = 0; i <= NS; i++) { const p = samp[i], d = (p.x - x) ** 2 + (p.y - y) ** 2 + (p.z - z) ** 2; if (d < b) { b = d; bi = i; } } return bi / NS; };

    // dawn is the hardest look: walls between charcoal and slate, ceilings darker, the two outside walls near black;
    // bone white is kept for what a body warmed
    const WALL = 0.295, FLOOR = T.SLATE - 0.095, CEIL = 0.225, BRICK = 0.225;
    const paper = { t: WALL, k: KIND.PAPER }, board = { t: FLOOR, k: KIND.BOARD }, plain = { t: CEIL, k: KIND.PLAIN }, brick = { t: BRICK, k: KIND.BRICK }, wood = { t: 0.46, k: KIND.BOARD };
    const W = H.WELL, COALZ = -127;

    // ================================================================== the cellar
    const tc = makeTB(), td = makeTB();          // td: thin shells seen from both sides
    ry(tc, H.CELLAR, -34, 34, 0, -164, 1, { t: BRICK - 0.02, k: KIND.BRICK });
    rx(tc, -34, 0, -164, H.CELLAR, 0, 1, brick); rx(tc, 34, 0, -164, H.CELLAR, 0, -1, brick);
    rz(tc, 0, -34, 34, H.CELLAR, 0, -1, brick); rz(tc, -164, -34, 34, H.CELLAR, 0, 1, brick);
    await ctx.yield();
    // the ceiling recedes: the underside of the floor and the joists are the coldest wood in the house, a tone under the
    // brick, each joist one dark piece of timber (no board pattern), so the pale cylinder and the boiler carry the room
    const under = { t: 0.115, k: KIND.UNDER }, joist = { t: 0.155, k: KIND.BEAM };
    ry(tc, -3, -34, 34, 0, W.z0, -1, under); ry(tc, -3, -34, W.x0, W.z0, -164, -1, under); ry(tc, -3, W.x1, 34, W.z0, -164, -1, under);
    for (let z = -3.2; z > W.z0 + 1; z -= 3.3) bx(tc, -34, 34, -5, -3, z - 0.4, z + 0.4, joist);
    bx(tc, -34, 34, -5.4, -3, W.z0 - 0.5, W.z0 + 0.5, { t: 0.15, k: KIND.BEAM });
    await ctx.yield();
    await ctx.yield();
    const pier = { t: BRICK + 0.015, k: KIND.BRICK };
    for (const [px, pz] of [[-16.5, -36], [7, -36], [5, -104], [21, -104]]) {             // brick piers; the first pair frames the way in
      bx(tc, px - 2.2, px + 2.2, H.CELLAR, -5.4, pz - 2.2, pz + 2.2, pier);
      bx(tc, px - 2.8, px + 2.8, H.CELLAR, H.CELLAR + 1.4, pz - 2.8, pz + 2.8, { t: BRICK - 0.015, k: KIND.BRICK });
      bx(tc, px - 2.5, px + 2.5, H.CELLAR + 1.4, H.CELLAR + 1.9, pz - 2.5, pz + 2.5, { t: BRICK + 0.035, k: KIND.BRICK });
      bx(tc, px - 2.45, px + 2.45, -7.0, -6.2, pz - 2.45, pz + 2.45, { t: BRICK, k: KIND.BRICK });
      bx(tc, px - 2.7, px + 2.7, -6.2, -5.2, pz - 2.7, pz + 2.7, { t: BRICK + 0.04, k: KIND.BRICK });
      bx(tc, px - 3.2, px + 3.2, -5.4, -4.9, pz - 3.2, pz + 3.2, { t: 0.17, k: KIND.BEAM });
    }
    await ctx.yield();
    // the cellar stair against the rear wall: closed risers, strings, a turned balustrade on its open side with a newel
    // at the foot and one at the head, and under it what a cellar keeps: barrels, sacks, a basket of linen still warm
    const CST = (i) => [-20 + (i + 0.5) * 2.5, H.CELLAR + (i + 1) * 1.375], SA = Math.atan2(22, 40), SC = Math.cos(SA), SS = Math.sin(SA);
    for (let i = 0; i < 16; i++) { const [x, y] = CST(i);
      bx(tc, x - 1.4, x + 1.4, y - 0.4, y, -163.6, -158, { t: 0.42, k: KIND.BOARD }); bx(tc, x - 1.5, x + 1.45, y - 0.12, y + 0.04, -163.6, -157.8, { t: 0.47, k: KIND.BOARD });
      bx(tc, x - 1.32, x - 1.2, y - 1.4, y - 0.4, -163.6, -158, { t: 0.33, k: KIND.BOARD });
      for (const f of [-0.6, 0.6]) tc.add(turned(5.45, 0.5), { p: [x + f, y, -158.25], t: 0.47, k: KIND.BOARD });
      if ((i & 3) === 3) await ctx.yield(); }
    for (const z of [-158.2, -163.4]) { const g = new THREE.BoxGeometry(46, 1.9, 0.45); tc.add(g, { p: [0, -11.7, z], r: [0, 0, SA], ...wood, t: 0.4 }); }
    { const g = new THREE.BoxGeometry(46.5, 0.6, 0.95); tc.add(g, { p: [0.2, -4.75, -158.25], r: [0, 0, SA], t: 0.5, k: KIND.BOARD });
      const g2 = new THREE.BoxGeometry(46.5, 0.3, 0.6); tc.add(g2, { p: [0.2, -5.2, -158.25], r: [0, 0, SA], t: 0.44, k: KIND.BOARD });
      for (const [x, y] of [[-21.6, H.CELLAR], [20.6, 0.2 - 0.4]]) { tc.box(1.5, 8.4, 1.5, { p: [x, y + 4.2, -158.25], t: 0.47, k: KIND.BOARD }); tc.box(1.8, 0.4, 1.8, { p: [x, y + 8.5, -158.25], t: 0.5, k: KIND.BOARD }); tc.sph(0.95, { p: [x, y + 9.5, -158.25], t: 0.5, k: KIND.BOARD }, 10, 7); } }
    await ctx.yield();
    { const ur = rng.fork('understair');
      for (const [x, r, hh] of [[8.5, 2.1, 5.6], [13.2, 2.3, 6.2], [17.6, 1.9, 5.2]]) {
        const g = new THREE.CylinderGeometry(r * 0.86, r * 0.86, hh, 16, 4), pp = g.attributes.position;
        for (let i = 0; i < pp.count; i++) { const f = 1 + 0.16 * (1 - (pp.getY(i) / (hh / 2)) ** 2); pp.setX(i, pp.getX(i) * f); pp.setZ(i, pp.getZ(i) * f); }
        g.computeVertexNormals(); tc.add(g, { p: [x, H.CELLAR + hh / 2, -160.4], t: 0.3 + ur() * 0.04, k: KIND.BOARD });
        for (const fy of [0.14, 0.38, 0.62, 0.86]) { const tr = new THREE.TorusGeometry(r * (0.9 + 0.13 * (1 - (fy * 2 - 1) ** 2)), 0.11, 5, 18); tr.rotateX(Math.PI / 2); tc.add(tr, { p: [x, H.CELLAR + hh * fy, -160.4], t: 0.15, k: KIND.METAL }); }
        tc.cyl(r * 0.8, r * 0.8, 0.14, 14, { p: [x, H.CELLAR + hh - 0.25, -160.4], t: 0.26, k: KIND.BOARD });
        await ctx.yield();
      }
      for (const [x, y, sc, rz2] of [[1.5, 1.1, 1, 0.1], [4.2, 1.0, 0.9, -0.2], [2.8, 2.9, 0.85, 0.05], [-3, 1.0, 0.95, 0.3]]) tc.sph(1.7 * sc, { p: [x, H.CELLAR + y, -160.6], s: [1.25, 0.72, 1.0], r: [0, rz2, 0], t: 0.31 + ur() * 0.05, k: KIND.CLOTH }, 12, 8);
      // the linen basket: wicker sides, a heap of folded sheets not long out of the copper
      { const bxp = [23.5, H.CELLAR, -152.5], g = new THREE.CylinderGeometry(2.5, 2.0, 2.8, 18, 3, true), pp = g.attributes.position;
        for (let i = 0; i < pp.count; i++) { const a = Math.atan2(pp.getZ(i), pp.getX(i)), f = 1 + 0.035 * Math.sin(a * 18 + pp.getY(i) * 5); pp.setX(i, pp.getX(i) * f); pp.setZ(i, pp.getZ(i) * f); }
        g.computeVertexNormals(); td.add(g, { p: [bxp[0], bxp[1] + 1.4, bxp[2]], t: 0.34, k: KIND.BOARD }); tc.cyl(2.0, 2.0, 0.2, 16, { p: [bxp[0], bxp[1] + 0.1, bxp[2]], t: 0.3, k: KIND.BOARD });
        for (const sx of [-1, 1]) { const hg = new THREE.TorusGeometry(0.7, 0.13, 5, 10, Math.PI); tc.add(hg, { p: [bxp[0] + sx * 2.5, bxp[1] + 2.6, bxp[2]], r: [0, Math.PI / 2, 0], t: 0.34, k: KIND.BOARD }); }
        for (let i = 0; i < 4; i++) tc.box(3.3 - i * 0.3, 0.55, 2.6 - i * 0.2, { p: [bxp[0] + (ur() - 0.5) * 0.4, bxp[1] + 2.3 + i * 0.5, bxp[2] + (ur() - 0.5) * 0.4], r: [0, (ur() - 0.5) * 0.5, 0], t: 0.6 + i * 0.03, k: KIND.CLOTH });
        addHalo(tc, { p: [bxp[0], H.CELLAR + 0.02, bxp[2]], r: 5.5, t: BRICK - 0.02, k: KIND.BRICK, gain: 0.13 }); } }
    await ctx.yield();
    // the coal corner under the chute, shelves of jars along the west wall, crates and a tub
    { const cr = rng.fork('cellar');
      for (let i = 0; i < Math.round(46 * detail); i++) { const a = (cr() - 0.5) * 3.0, d = cr() * 8.5, r = 0.6 + cr() * 0.9; tc.add(new THREE.IcosahedronGeometry(r, 0), { p: [-33.4 + Math.cos(a) * d, H.CELLAR + r * 0.5 + (8.5 - d) * 0.36 * cr(), COALZ + Math.sin(a) * d], r: [cr() * 3, cr() * 3, 0], t: 0.1 + cr() * 0.06, k: KIND.IRON }); }
      await ctx.yield();
      bx(tc, -34, -33.5, -12, -6, COALZ - 3.5, COALZ + 3.5, { t: 0.02, k: KIND.IRON }); bx(tc, -34, -33.7, -12.5, -5.5, COALZ - 4, COALZ + 4, { t: 0.12, k: KIND.BOARD });
      tc.box(0.3, 6.4, 7.2, { p: [-32.2, -14.6, COALZ], r: [0, 0, 0.5], t: 0.08, k: KIND.IRON });                                   // the chute door hanging open
      for (let s = 0; s < 3; s++) {
        const y = H.CELLAR + 3.2 + s * 4.2; bx(tc, -34, -31, y - 0.3, y, -14, -58, { t: 0.29, k: KIND.BOARD });
        for (let z = -15.5; z > -57; z -= 1.6 + cr() * 2.2) { if (cr() < 0.25) continue; const r = 0.5 + cr() * 0.5, h = 1.2 + cr() * 1.6;
          tc.cyl(r, r, h, 9, { p: [-32.4 + cr() * 0.5, y + h / 2, z], t: 0.2 + cr() * 0.09, k: KIND.PLAIN }); tc.cyl(r * 0.8, r * 0.8, 0.22, 9, { p: [-32.4, y + h + 0.1, z], t: 0.12, k: KIND.METAL }); }
      }
      await ctx.yield();
      for (const z of [-14, -36, -58]) bx(tc, -34, -31.2, H.CELLAR, H.CELLAR + 12.4, z - 0.25, z + 0.25, { t: 0.27, k: KIND.BOARD });
      for (const [x, z, w, h, r] of [[13, -50, 5, 4, 0.3], [14, -50.6, 3.6, 3, -0.2], [26, -60, 6, 5, 0.1], [11, -74, 4.4, 3.6, 0.05], [27, -84, 5, 3.4, 0.5], [12, -122, 4, 3, 0.2]]) {
        const y = H.CELLAR + (x === 14 ? 4 : 0);
        tc.box(w, h, w * 0.8, { p: [x, y + h / 2, z], r: [0, r, 0], t: 0.27, k: KIND.BOARD });
        for (const sy of [0.12, 0.88]) tc.box(w + 0.2, h * 0.1, w * 0.8 + 0.2, { p: [x, y + h * sy, z], r: [0, r, 0], t: 0.31, k: KIND.BOARD });
      }
      { const g = new THREE.CylinderGeometry(3.4, 2.8, 4.4, 18, 1, true); td.add(g, { p: [25, H.CELLAR + 2.6, -24], t: 0.17, k: KIND.METAL }); tc.cyl(2.8, 2.8, 0.2, 18, { p: [25, H.CELLAR + 0.5, -24], t: 0.17, k: KIND.METAL });
        const tr = new THREE.TorusGeometry(3.4, 0.14, 5, 20); tr.rotateX(Math.PI / 2); tc.add(tr, { p: [25, H.CELLAR + 4.8, -24], t: 0.15, k: KIND.METAL }); }
      await ctx.yield();
      // a workbench with a vice and tins, tools on the wall, a log pile and a sled along the west lane
      const WBZ = -108.5;
      kit(tc, INT.tableGeometry({ scale: S, width: 1.9, depth: 0.6, height: 0.86, legs: 'square' }), { p: [-31, H.CELLAR, WBZ], r: [0, Math.PI / 2, 0], t: 0.34 });
      tc.box(1.6, 1.3, 1.1, { p: [-30.2, H.CELLAR + 7.5, WBZ + 5.4], t: 0.15, k: KIND.IRON }); tc.box(0.5, 1.0, 2.0, { p: [-29.6, H.CELLAR + 7.9, WBZ + 5.4], t: 0.15, k: KIND.IRON }); tc.cyl(0.1, 0.1, 2.6, 6, { p: [-28.9, H.CELLAR + 7.6, WBZ + 5.4], r: [0, 0, 1.2], t: 0.14, k: KIND.METAL });
      bx(tc, -34, -32, -10.2, -9.9, -90, -106, { t: 0.33, k: KIND.BOARD });
      for (let z = -91; z > -105.5; z -= 1.7 + cr() * 1.2) { const r = 0.55 + cr() * 0.35, h = 1.0 + cr() * 1.3; tc.cyl(r, r, h, 9, { p: [-33, -9.9 + h / 2, z], t: 0.22 + cr() * 0.1, k: KIND.METAL }); }
      for (let i = 0; i < 6; i++) { const z = -91.5 - i * 2.4, h = 2.2 + cr() * 2.2; tc.box(0.14, h, 0.3 + cr() * 0.4, { p: [-33.8, -12.4 - h / 2, z], r: [(cr() - 0.5) * 0.3, 0, 0], t: 0.17, k: KIND.METAL }); tc.box(0.2, 0.9, 0.9 + cr() * 0.5, { p: [-33.75, -12.6 - h, z], t: 0.3, k: KIND.BOARD }); }
      for (let r = 0; r < 4; r++) for (let i = 0; i < 7 - r; i++) { const g = new THREE.CylinderGeometry(0.75, 0.75, 4.6, 8); g.rotateZ(Math.PI / 2); tc.add(g, { p: [29.5 + (cr() - 0.5) * 0.5, H.CELLAR + 0.75 + r * 1.3, -92 - (i + r * 0.5) * 1.55], t: 0.24 + cr() * 0.07, k: KIND.BOARD }); }
      for (const dz of [-0.9, 0.9]) tc.box(0.3, 9, 0.5, { p: [-32.6, H.CELLAR + 4.3, -84 + dz], r: [0, 0, -0.22], t: 0.38, k: KIND.BOARD });
      for (let i = 0; i < 5; i++) tc.box(0.25, 0.4, 2.6, { p: [-32.9 + i * 0.36, H.CELLAR + 1.4 + i * 1.6, -84], r: [0, 0, -0.22], t: 0.4, k: KIND.BOARD });
      // warmth the boiler lays into the floor and the joists over it
      const BN = [Math.sin(H.BYAW), Math.cos(H.BYAW)];
      { const hp = [A.boiler.x + BN[0] * 7.5, H.CELLAR + 0.06, A.boiler.z + BN[1] * 7.5], HR = 19, g = new THREE.RingGeometry(0.01, HR, 30, 8); g.rotateX(-Math.PI / 2);
        tc.add(g, { p: hp, s: [1, 1, 1.3], k: KIND.BRICK, arr: K.burner + 0.012, fn: (x, y, z, out) => { const d = Math.min(1, Math.hypot(x - hp[0], (z - hp[2]) / 1.3) / HR), e = (1 - d) * (1 - d) * (1 + 2 * d); out[0] = BRICK - 0.02 + 0.17 * e * e + 0.07 * e; out[2] = 0.2 * e; } }); }
      addHalo(tc, { p: [A.puddle.x, H.CELLAR + 0.02, A.puddle.z], r: 1.5, t: BRICK - 0.02, k: KIND.BRICK, gain: 0.34 });
      addHalo(tc, { p: [H.CYL[0], H.CELLAR, H.CYL[2]], r: 8, t: BRICK - 0.02, k: KIND.BRICK, gain: 0.12 });
    }
    await ctx.yield();

    // ================================================================== ground floor
    const tg = makeTB();
    ry(tg, 0, -34, 34, 0, -60, 1, board); ry(tg, 0, 0, 34, -60, W.z0, 1, board); ry(tg, 0, -34, 0, -60, -93, 1, board);
    ry(tg, 0, -34, 0, -93, W.z0, 1, { t: FLOOR, k: KIND.TILE }); ry(tg, 0, -34, W.x0, W.z0, -164, 1, board); ry(tg, 0, W.x1, 34, W.z0, -164, 1, board);
    rz(tg, W.z0, W.x0, W.x1, -3, 0, -1, { t: T.DIM, k: KIND.BOARD }); rx(tg, W.x0, W.z0, -164, -3, 0, 1, { t: T.DIM, k: KIND.BOARD }); rx(tg, W.x1, W.z0, -164, -3, 0, -1, { t: T.DIM, k: KIND.BOARD });
    // outside walls, floor to roof
    const westT = look === 1 ? { t: T.ASH - 0.04, k: KIND.PAPER } : paper;
    rx(tg, -34, 0, -164, 0, 45, 1, westT); rx(tg, -34, 0, -164, 45, H.TOP, 1, paper); rx(tg, 34, 0, -164, 0, H.TOP, -1, paper);
    const coldWall = { t: 0.14, k: KIND.PAPER };            // the street wall and the rear wall: the darkest surfaces indoors
    rz(tg, 0, -34, 34, 0, H.TOP, -1, coldWall); rz(tg, -164, -34, 34, 0, H.TOP, 1, coldWall);
    await ctx.yield();
    // the wall between the hall and the rooms, with two openings 18 m wide; folded-back doors
    // the wall between the hall and the rooms: a long pier (the hall radiator stands against it), then the parlour and kitchen openings
    for (const [z0, z1] of [[-60, -78], [-91, -95], [-111, -116.6]]) bx(tg, -0.6, 0.6, 0, 21, z0, z1, paper);
    for (const [z0, z1] of [[-78, -91], [-95, -111]]) {
      bx(tg, -0.6, 0.6, 16, 21, z0, z1, paper);
      bx(tg, -0.9, 0.9, 15.4, 16.2, z0, z1, wood); bx(tg, -0.9, 0.9, 0, 16, z0 - 0.5, z0 + 0.3, wood); bx(tg, -0.9, 0.9, 0, 16, z1 - 0.3, z1 + 0.5, wood);
      for (const [zz, s] of [[z0 - 0.75, 1], [z1 + 0.75, -1]]) for (const x of [-5.2, -9.6]) {
        if (z0 === -78 && s === 1) {           // this pair lies flat against the pier, so the room behind it can be seen from the hall
          const zc = x < -7 ? -71.3 : -75.6; bx(tg, -1.15, -0.75, 0.2, 15.2, zc - 2.1, zc + 2.1, { t: 0.43, k: KIND.BOARD });
          for (const [y0, y1] of [[1.2, 6], [7, 14.2]]) bx(tg, -1.25, -0.65, y0, y1, zc - 1.5, zc + 1.5, { t: 0.4, k: KIND.BOARD });
          continue;
        }
        bx(tg, x - 2.1, x + 2.1, 0.2, 15.2, zz - 0.2, zz + 0.2, { t: 0.43, k: KIND.BOARD });
        for (const [y0, y1] of [[1.2, 6], [7, 14.2]]) bx(tg, x - 1.5, x + 1.5, y0, y1, zz - 0.3, zz + 0.3, { t: 0.4, k: KIND.BOARD });
      }
    }
    bx(tg, -34, 0, 0, 21, -60.5, -59.5, paper); bx(tg, -34, 0, 0, 21, -93.5, -92.5, { t: WALL - 0.075, k: KIND.PLAIN }); bx(tg, -34, 0.6, 0, 21, -116.6, -115.8, paper);
    ry(tg, 21, -34, 34, -60, -164, -1, plain);
    for (const z of [-67, -79, -91, -103, -115]) { bx(tg, 0.6, 34, 19.7, 21, z - 0.7, z + 0.7, { t: 0.31, k: KIND.BOARD }); bx(tg, 0.6, 34, 19.4, 19.7, z - 0.95, z + 0.95, { t: 0.34, k: KIND.BOARD }); }
    for (const z of [-85, -109]) { tg.cyl(2.6, 3.0, 0.3, 18, { p: [17, 20.85, z], t: 0.3, k: KIND.PLAIN }); tg.cyl(0.1, 0.1, 3.4, 5, { p: [17, 19, z], t: 0.14, k: KIND.METAL }); tg.cyl(0.5, 1.9, 1.5, 14, { p: [17, 16.9, z], t: 0.13, k: KIND.METAL }, true); tg.sph(0.6, { p: [17, 16.3, z], t: 0.1, k: KIND.METAL }, 8, 6); }
    // (beams over the well too, and a third pendant: the ceiling is never a bare field)
    for (const z of [-127, -139, -151]) { bx(tg, -34, 34, 19.7, 21, z - 0.7, z + 0.7, { t: 0.31, k: KIND.BOARD }); bx(tg, -34, 34, 19.4, 19.7, z - 0.95, z + 0.95, { t: 0.34, k: KIND.BOARD }); }
    for (const x of [-24.6, 24.6]) bx(tg, x - 0.6, x + 0.6, 20, 21, W.z0, -164, { t: 0.32, k: KIND.BOARD });
    { const z = -133, x = -2; tg.cyl(2.6, 3.0, 0.3, 18, { p: [x, 20.85, z], t: 0.3, k: KIND.PLAIN }); tg.cyl(0.1, 0.1, 3.4, 5, { p: [x, 19, z], t: 0.14, k: KIND.METAL }); tg.cyl(0.5, 1.9, 1.5, 14, { p: [x, 16.9, z], t: 0.13, k: KIND.METAL }, true); tg.sph(0.6, { p: [x, 16.3, z], t: 0.1, k: KIND.METAL }, 8, 6); }
    rz(tg, -60, -34, 34, 21, 24, 1, { t: T.DIM + 0.04, k: KIND.BOARD });
    // skirtings, a dado rail and a cornice down the hall and round the stair hall
    for (const [x, d] of [[33.85, -1], [0.75, 1]]) { bx(tg, x - 0.15, x + 0.15, 0, 1.5, d > 0 ? -60 : -60, d > 0 ? -78 : W.z0, wood); }
    bx(tg, 0.6, 0.85, 7.6, 8.1, -60, -78, wood);
    bx(tg, 33.7, 34, 7.6, 8.1, -60, -164, wood); bx(tg, 33.4, 34, 20, 21, -60, -164, plain);
    bx(tg, -34, -33.7, 0, 1.5, 0, -60, wood); bx(tg, -34, 34, 0, 1.5, -0.3, 0, wood); bx(tg, -34, -33.7, 7.6, 8.1, 0, -60, wood);
    // a closed door in the parlour's front wall, for scale
    bx(tg, -22, -12, 0, 17, -59.5, -59.1, { t: 0.42, k: KIND.BOARD }); for (const [y0, y1] of [[1.4, 7], [8.2, 15.6]]) for (const x of [-19.4, -14.6]) bx(tg, x - 1.9, x + 1.9, y0, y1, -59.1, -58.95, { t: 0.4, k: KIND.BOARD });
    bx(tg, -23, -11, 17, 18, -59.5, -58.9, wood); tg.sph(0.4, { p: [-13.2, 8, -58.8], t: 0.14, k: KIND.METAL }, 8, 6);
    // the balustrade round the well
    const balGeo = () => turned(6.2, 0.62);
    const rail = (tb, x0, z0, x1, z1, y, n) => {
      const len = Math.hypot(x1 - x0, z1 - z0), yaw = Math.atan2(x1 - x0, z1 - z0);
      tb.box(0.9, 0.55, len, { p: [(x0 + x1) / 2, y + 6.5, (z0 + z1) / 2], r: [0, yaw, 0], t: 0.52, k: KIND.BOARD }); tb.box(0.7, 0.4, len, { p: [(x0 + x1) / 2, y + 0.2, (z0 + z1) / 2], r: [0, yaw, 0], t: 0.44, k: KIND.BOARD });
      for (let i = 0; i < n; i++) { const f = (i + 0.5) / n; tb.add(balGeo(), { p: [lerp(x0, x1, f), y + 0.3, lerp(z0, z1, f)], t: 0.49, k: KIND.BOARD }); }
      for (const f of [0, 1]) { tb.box(1.3, 7.6, 1.3, { p: [lerp(x0, x1, f), y + 3.8, lerp(z0, z1, f)], t: 0.5, k: KIND.BOARD }); tb.box(1.6, 0.35, 1.6, { p: [lerp(x0, x1, f), y + 7.7, lerp(z0, z1, f)], t: 0.53, k: KIND.BOARD }); }
    };
    rail(tg, 0.6, W.z0, 4.5, W.z0, 0, 3); await ctx.yield(); rail(tg, W.x1, W.z0, W.x1, -163, 0, 28); await ctx.yield(); rail(tg, W.x0, W.z0, W.x0, -163, 0, 28);
    await ctx.yield();

    // the east side of the well, where boots come off: a settle against the party wall with a cushion still warm where
    // someone sat, boots beside it, coats and a hat on their pegs, two pictures
    { const SZ = -137, er = rng.fork('settle');
      bx(tg, 30.6, 33.5, 3.0, 3.6, SZ - 6.6, SZ + 6.6, { t: 0.5, k: KIND.BOARD }); bx(tg, 30.9, 33.4, 0.25, 3.0, SZ - 6.3, SZ + 6.3, { t: 0.4, k: KIND.BOARD });
      bx(tg, 33.2, 33.8, 0, 10.6, SZ - 6.6, SZ + 6.6, { t: 0.46, k: KIND.BOARD }); bx(tg, 33.0, 33.9, 10.6, 11.2, SZ - 6.9, SZ + 6.9, { t: 0.52, k: KIND.BOARD });
      for (let i = 0; i < 4; i++) { const z = SZ - 4.8 + i * 3.2; bx(tg, 33.05, 33.2, 4.6, 9.8, z - 1.25, z + 1.25, { t: 0.42, k: KIND.BOARD }); bx(tg, 30.75, 30.9, 0.7, 2.6, z - 1.25, z + 1.25, { t: 0.36, k: KIND.BOARD }); }
      for (const sz of [-1, 1]) { const z = SZ + sz * 6.6; bx(tg, 30.5, 33.6, 0, 6.3, z - 0.3, z + 0.3, { t: 0.48, k: KIND.BOARD }); bx(tg, 30.3, 33.6, 6.3, 6.8, z - 0.45, z + 0.45, { t: 0.53, k: KIND.BOARD }); tg.sph(0.6, { p: [30.6, 7.2, z], t: 0.52, k: KIND.BOARD }, 9, 6); }
      { const cg = new THREE.BoxGeometry(2.5, 0.75, 12.4, 4, 2, 10), pp = cg.attributes.position; for (let i = 0; i < pp.count; i++) if (pp.getY(i) > 0) pp.setY(i, pp.getY(i) * (1 - 0.35 * Math.pow(Math.abs(pp.getX(i)) / 1.25, 3) - 0.3 * Math.pow(Math.abs(pp.getZ(i)) / 6.2, 6)));
        cg.computeVertexNormals(); const hz = SZ + 2.4;
        tg.add(cg, { p: [31.95, 3.97, SZ], k: KIND.CLOTH, fn: (x, y, z, out) => { const e = Math.max(0, 1 - Math.hypot((x - 31.9) / 1.5, (z - hz) / 2.6)); out[0] = 0.5 + 0.22 * e * e * (3 - 2 * e) * (y > 4 ? 1 : 0.3); } }); }
      for (const [dz, yaw] of [[-9.2, 0.25], [-10.6, -0.2]]) { tg.box(1.0, 1.0, 2.5, { p: [31.6, 0.5, SZ + dz], r: [0, yaw, 0], t: 0.37, k: KIND.CLOTH }); tg.cyl(0.52, 0.48, 2.9, 9, { p: [31.6 + Math.sin(yaw) * -0.7, 2.2, SZ + dz - 0.7], t: 0.39, k: KIND.CLOTH }); tg.cyl(0.4, 0.4, 0.12, 9, { p: [31.6 + Math.sin(yaw) * -0.7, 3.62, SZ + dz - 0.7], t: 0.63, k: KIND.CLOTH }); }
      bx(tg, 33.6, 33.95, 14.4, 15.4, SZ - 7.4, SZ + 7.4, { t: 0.5, k: KIND.BOARD });
      await ctx.yield();
      for (let i = 0; i < 5; i++) { const z = SZ - 5.6 + i * 2.8; { const g = new THREE.CylinderGeometry(0.13, 0.13, 1.0, 6); g.rotateZ(Math.PI / 2); tg.add(g, { p: [33.2, 14.9, z], t: 0.2, k: KIND.METAL }); } tg.sph(0.22, { p: [32.7, 14.9, z], t: 0.2, k: KIND.METAL }, 6, 4);
        if (i === 4) { tg.sph(1.15, { p: [32.9, 15.3, z], s: [0.8, 0.62, 1], t: 0.4, k: KIND.CLOTH }, 10, 7); tg.cyl(1.7, 1.7, 0.14, 14, { p: [32.9, 14.95, z], s: [0.8, 1, 1], t: 0.38, k: KIND.CLOTH }); continue; }
        if (i === 2) continue;
        const warm = i === 1, hh = 8.2 + er() * 1.6, cg = new THREE.CylinderGeometry(0.75, 1.75 + er() * 0.4, hh, 12, 5), pp = cg.attributes.position;
        for (let j = 0; j < pp.count; j++) { const a = Math.atan2(pp.getZ(j), pp.getX(j)), f = 1 + 0.07 * Math.sin(a * 5 + i) * (0.5 - pp.getY(j) / hh); pp.setX(j, pp.getX(j) * f); pp.setZ(j, pp.getZ(j) * f); }
        cg.computeVertexNormals();
        tg.add(cg, { p: [33.0, 14.6 - hh / 2, z], s: [0.5, 1, 1], k: KIND.CLOTH, sway: 0.04, fn: (x, y, zz, out) => { out[0] = warm ? 0.47 + 0.16 * sstep(y, 8, 14.5) : 0.33 + i * 0.012; } });
        tg.sph(0.85, { p: [33.0, 14.3, z], s: [0.55, 0.5, 1.5], t: warm ? 0.6 : 0.35, k: KIND.CLOTH }, 9, 6); }
      for (const [z, w, h, y] of [[-121.5, 6, 8, 12.5], [-153.5, 8, 6, 12.5]]) { bx(tg, 33.6, 34, y - h / 2, y + h / 2, z - w / 2, z + w / 2, { t: 0.5, k: KIND.BOARD }); bx(tg, 33.5, 33.6, y - h / 2 + 0.7, y + h / 2 - 0.7, z - w / 2 + 0.7, z + w / 2 - 0.7, { t: 0.33, k: KIND.CLOTH }); }
    }
    // the party wall warms through round the riser and the radiator under the picture: a pale halo for them to stand against
    addHalo(tg, { wall: [-1, 0], p: [33.93, 10.6, -123.4], w: 27, h: 21, t: WALL, k: KIND.PAPER, arr: RAD.rearE.arrive, gain: 0.085 });
    addHalo(tg, { p: [30.2, 0.03, -122.6], r: 7.2, sz: 1.75, t: FLOOR, k: KIND.BOARD, arr: RAD.rearE.arrive + 0.01, gain: 0.13 });
    await ctx.yield();

    // ================================================================== the stair hall
    const ts = makeTB();
    const panes = [];                       // [cx, cy, cz, w, h, nx, nz, ghost radiator id | null, half-round]
    const windowAt = (tb, cx, y0, y1, w, z, nz, ghost) => {
      const zi = z + nz * 0.5;
      bx(tb, cx - w / 2 - 0.7, cx - w / 2, y0 - 0.6, y1 + 0.7, z, zi, wood); bx(tb, cx + w / 2, cx + w / 2 + 0.7, y0 - 0.6, y1 + 0.7, z, zi, wood);
      bx(tb, cx - w / 2 - 1, cx + w / 2 + 1, y0 - 0.7, y0, z, z + nz * 1.3, wood); bx(tb, cx - w / 2 - 0.9, cx + w / 2 + 0.9, y1, y1 + 0.8, z, z + nz * 0.7, wood);
      bx(tb, cx - 0.25, cx + 0.25, y0, y1, z, z + nz * 0.32, { t: 0.2, k: KIND.BOARD }); bx(tb, cx - w / 2, cx + w / 2, (y0 + y1) / 2 - 0.3, (y0 + y1) / 2 + 0.3, z, z + nz * 0.4, { t: 0.2, k: KIND.BOARD });
      panes.push([cx, (y0 + y1) / 2, z + nz * 0.14, w, y1 - y0, 0, nz, ghost, 0]);
    };
    windowAt(ts, -24, 7, 19, 8, 0, -1, 'street1'); windowAt(ts, -8, 7, 19, 8, 0, -1, 'street2');
    windowAt(ts, -24, 30, 42, 8, 0, -1, null); windowAt(ts, 28, 31, 43, 7, 0, -1, 'first');
    windowAt(ts, -28, 56, 68, 7, 0, -1, 'top1'); windowAt(ts, -6, 56, 68, 8, 0, -1, 'stairB'); windowAt(ts, 19, 56, 68, 8, 0, -1, 'stairA');
    windowAt(tg, -12, 6, 18, 9, -164, 1, 'rearW'); windowAt(tg, 12, 6, 18, 9, -164, 1, null);
    await ctx.yield();
    // the front door's frame and fanlight (the door itself is its own mesh: on a rare visit it opens)
    rz(ts, -0.06, 12, 22, 0, 17, -1, { t: 0.0, k: KIND.METAL });
    bx(ts, 11, 12, 0, 17.6, -0.9, 0, wood); bx(ts, 22, 23, 0, 17.6, -0.9, 0, wood); bx(ts, 11, 23, 17, 17.7, -1.0, 0, wood);
    { const g = new THREE.TorusGeometry(5.3, 0.4, 6, 18, Math.PI); ts.add(g, { p: [17, 17.7, -0.4], t: T.WOOD, k: KIND.BOARD });
      for (let i = 1; i < 6; i++) { const a = (i / 6) * Math.PI; ts.box(5, 0.3, 0.3, { p: [17 + Math.cos(a) * 2.5, 17.7 + Math.sin(a) * 2.5, -0.3], r: [0, 0, a], t: 0.2, k: KIND.BOARD }); }
      panes.push([17, 17.7, -0.14, 10, 5, 0, -1, null, 1]); }
    // first flight up the east wall, corner landing, second flight along the street wall
    const RISE = 24 / 17, TR1 = 48 / 17, TR2 = 44 / 17, runner = { t: 0.43, k: KIND.CLOTH }, stepT = { t: 0.4, k: KIND.BOARD };
    const steps1 = [], steps2 = [];
    for (let i = 0; i < 17; i++) {
      const z0 = -58 + i * TR1, y = (i + 1) * RISE;
      bx(ts, 26, 34, y - 2.4, y, z0, z0 + TR1, stepT); bx(ts, 25.8, 34, y - 0.3, y + 0.02, z0 - 0.35, z0 + 0.2, { t: 0.44, k: KIND.BOARD });
      bx(ts, 27.6, 32.4, y, y + 0.1, z0 - 0.3, z0 + TR1, runner); bx(ts, 27.6, 32.4, y - RISE, y, z0 - 0.12, z0, runner);
      for (const f of [0.25, 0.75]) ts.add(turned(6.6, 0.62), { p: [26.35, y, z0 + f * TR1], t: 0.49, k: KIND.BOARD });
      steps1.push([30, y + 0.1, z0 + TR1 * 0.5]);
      const x0 = 22 - i * TR2, y2 = 24 + (i + 1) * RISE;
      bx(ts, x0 - TR2, x0, y2 - 2.4, y2, 0, -8, stepT); bx(ts, x0 - 0.2, x0 + 0.35, y2 - 0.3, y2 + 0.02, 0, -8.2, { t: 0.44, k: KIND.BOARD });
      bx(ts, x0 - TR2, x0 + 0.3, y2, y2 + 0.1, -1.6, -6.4, runner); bx(ts, x0, x0 + 0.12, y2 - RISE, y2, -1.6, -6.4, runner);
      for (const f of [0.25, 0.75]) ts.add(turned(6.6, 0.62), { p: [x0 - f * TR2, y2, -7.65], t: 0.49, k: KIND.BOARD });
      steps2.push([x0 - TR2 * 0.5, y2 + 0.1, -4]);
      if ((i & 3) === 3) await ctx.yield();
    }
    const A1 = Math.atan2(24, 48), A2 = Math.atan2(24, 44);
    ts.box(8, 1.2, 53.7, { p: [30, 12 - 2.2, -34], r: [-A1, 0, 0], t: 0.37, k: KIND.PLAIN }); ts.box(0.5, 3.0, 53.7, { p: [25.9, 12 - 1.0, -34], r: [-A1, 0, 0], t: 0.42, k: KIND.BOARD });
    ts.box(1.0, 0.6, 54.5, { p: [26.35, 12 + 7.4, -34.2], r: [-A1, 0, 0], t: 0.53, k: KIND.BOARD });
    ts.box(50.1, 1.2, 8, { p: [0, 36 - 2.2, -4], r: [0, 0, -A2], t: 0.37, k: KIND.PLAIN }); ts.box(50.1, 3.0, 0.5, { p: [0, 36 - 1.0, -8.1], r: [0, 0, -A2], t: 0.42, k: KIND.BOARD });
    ts.box(50.8, 0.6, 1.0, { p: [0.2, 36 + 7.4, -7.65], r: [0, 0, -A2], t: 0.53, k: KIND.BOARD });
    bx(ts, 22, 34, 21, 24, 0, -10, stepT); bx(ts, 22.6, 33, 24, 24.1, -1.6, -9.4, runner);
    await ctx.yield();
    // newels: the heavy one at the foot (its cap carries the handprint), plain ones at the turns
    const NEWEL = [26.4, 0, -59.6];
    ts.box(2.0, 3.2, 2.0, { p: [NEWEL[0], 1.6, NEWEL[2]], t: 0.45, k: KIND.BOARD }); ts.box(2.3, 0.4, 2.3, { p: [NEWEL[0], 3.3, NEWEL[2]], t: 0.47, k: KIND.BOARD });
    ts.add(turned(6.4, 1.5), { p: [NEWEL[0], 3.5, NEWEL[2]], t: 0.45, k: KIND.BOARD }); ts.box(2.1, 0.5, 2.1, { p: [NEWEL[0], 10.1, NEWEL[2]], t: 0.47, k: KIND.BOARD });
    ts.sph(1.3, { p: [NEWEL[0], 11.4, NEWEL[2]], t: 0.46, k: KIND.BOARD }, 16, 10);
    for (const [x, y, z] of [[22.6, 24, -9.4], [26.4, 24, -9.6], [-21.4, 48, -7.6]]) { ts.box(1.5, 9, 1.5, { p: [x, y + 4.5, z], t: 0.45, k: KIND.BOARD }); ts.sph(0.95, { p: [x, y + 9.7, z], t: 0.46, k: KIND.BOARD }, 10, 7); }
    // the upper walls the stairwell looks at, and three pictures hung on them
    rz(ts, -60, -34, 34, 24, 45, 1, paper); rz(ts, -60, 0, 34, 45, H.TOP, 1, paper);
    for (const [x, y, w, h] of [[-20, 34, 9, 7], [10, 35, 12, 9], [22, 58, 8, 10], [8, 60, 7, 9]]) { bx(ts, x - w / 2, x + w / 2, y - h / 2, y + h / 2, -60, -59.6, { t: 0.42, k: KIND.BOARD }); bx(ts, x - w / 2 + 0.8, x + w / 2 - 0.8, y - h / 2 + 0.8, y + h / 2 - 0.8, -59.6, -59.5, { t: 0.3, k: KIND.CLOTH }); }
    bx(ts, -34, 34, 44.2, 45, -60, -59.4, wood);
    // gallery and strip slabs with their balustrades; a rug, a hall table and a coat stand below
    bx(ts, -34, -22, 45, 47.95, 0, -56, { t: 0.36, k: KIND.PLAIN }); bx(ts, -34, 0, 45, 47.95, -56, -60, { t: 0.36, k: KIND.PLAIN }); rz(ts, -55.98, -22, 0, 45, 48, 1, { t: T.DIM + 0.04, k: KIND.BOARD });
    const rail6 = (x0, z0, x1, z1, n) => {
      const len = Math.hypot(x1 - x0, z1 - z0), yaw = Math.atan2(x1 - x0, z1 - z0);
      ts.box(0.9, 0.55, len, { p: [(x0 + x1) / 2, 54.2, (z0 + z1) / 2], r: [0, yaw, 0], t: 0.53, k: KIND.BOARD }); ts.box(0.7, 0.4, len, { p: [(x0 + x1) / 2, 48.2, (z0 + z1) / 2], r: [0, yaw, 0], t: 0.45, k: KIND.BOARD });
      for (let i = 0; i < n; i++) { const f = (i + 0.5) / n; ts.add(turned(5.7, 0.62), { p: [lerp(x0, x1, f), 48.3, lerp(z0, z1, f)], t: 0.49, k: KIND.BOARD }); }
    };
    rail6(-21.6, -8.4, -21.6, -55.6, 33); await ctx.yield(); rail6(-21.6, -55.6, -0.4, -55.6, 15); rail6(-0.4, -55.6, -0.4, -59.8, 3);
    for (const [x, z] of [[-21.6, -55.6], [-0.4, -55.6], [-21.6, -32]]) { ts.box(1.4, 7.2, 1.4, { p: [x, 51.6, z], t: 0.45, k: KIND.BOARD }); ts.sph(0.9, { p: [x, 55.8, z], t: 0.46, k: KIND.BOARD }, 10, 7); }
    ry(ts, 0.06, -27, 4, -14, -50, 1, { t: 0.41, k: KIND.CLOTH }); ry(ts, 0.09, -25.4, 2.4, -15.6, -48.4, 1, { t: 0.44, k: KIND.CLOTH });
    await ctx.yield();
    kit(ts, INT.tableGeometry({ scale: S, width: 1.5, depth: 0.5, height: 0.8 }), { p: [-30.5, 0, -46], r: [0, Math.PI / 2, 0], t: 0.44 });
    { const g = INT.vaseGeometry({ rng: rng.fork('vase'), scale: S, height: 0.42, flowers: true }); kit(ts, g, { p: [-30.5, 6.4, -46], t: 0.26, sway: 0.25 }); }
    const CS = -0.2;
    ts.cyl(0.3, 0.45, 14, 8, { p: [CS, 7, -3.2], t: 0.42, k: KIND.BOARD }); ts.cyl(1.6, 1.9, 0.6, 12, { p: [CS, 0.3, -3.2], t: 0.42, k: KIND.BOARD });
    for (let i = 0; i < 5; i++) { const a = i * 1.257; ts.box(1.6, 0.22, 0.22, { p: [CS + Math.cos(a) * 0.8, 13.6, -3.2 + Math.sin(a) * 0.8], r: [0, -a, 0.5], t: 0.42, k: KIND.BOARD }); }
    { const coat = new THREE.CylinderGeometry(1.0, 2.2, 9.5, 10, 4); ts.add(coat, { p: [CS + 1.3, 8.2, -3.8], s: [1, 1, 0.6], t: 0.3, k: KIND.CLOTH, sway: 0.05 }); ts.add(new THREE.CylinderGeometry(0.9, 1.9, 8, 10, 4), { p: [CS - 1.1, 8.6, -2.6], s: [1, 1, 0.55], r: [0, 0.6, 0], t: 0.33, k: KIND.CLOTH, sway: 0.05 }); }
    for (const [x, z, r] of [[8.3, -3, 0.3], [9.6, -4.2, -0.5]]) { ts.box(1.1, 2.6, 2.4, { p: [x, 1.3, z], r: [0, r, 0], t: 0.3, k: KIND.CLOTH }); ts.box(1.0, 1.0, 1.4, { p: [x + Math.sin(r) * 1.5, 0.5, z + Math.cos(r) * 1.5], r: [0, r, 0], t: 0.3, k: KIND.CLOTH }); }
    await ctx.yield();

    // ================================================================== the top floor
    const tt = makeTB();
    ry(tt, 48, -34, 0, -56, -164, 1, board); ry(tt, 48, -34, -22, 0, -56, 1, board);
    ry(tt, 48.03, -34, -23.5, -90.5, -120.5, 1, { t: FLOOR, k: KIND.TILE });
    ry(tt, H.TOP, -34, 34, 0, -164, -1, plain);
    rx(tt, 0, -60, -164, 48, H.TOP, -1, paper);
    for (const z of [-62, -90, -121]) { bx(tt, -34, -23.5, 48, H.TOP, z - 0.5, z + 0.5, paper); bx(tt, -24.4, -23, 48, H.TOP, z - 0.9, z + 0.9, { t: 0.37, k: KIND.BOARD }); bx(tt, -34, -23.4, 48, 49.5, z - 0.65, z + 0.65, wood); }
    bx(tt, -34, -23.5, 70, H.TOP, -62, -121, paper);
    bx(tt, -24.2, -23.2, 69.4, 70.4, -62, -121, wood);
    ry(tt, 48.05, -19.5, -8.5, -63, -152, 1, { t: 0.38, k: KIND.RUG }); ry(tt, 48.08, -18.2, -9.8, -64.5, -150.5, 1, { t: 0.42, k: KIND.RUG });
    bx(tt, -0.3, 0, 48, 49.5, -60, -164, wood); bx(tt, -34, -33.7, 48, 49.5, -121, -164, wood); bx(tt, -0.25, 0, 55.6, 56.1, -60, -164, wood);
    for (const z of [-66, -90, -114, -138]) bx(tt, -34, 0, 72.6, H.TOP, z - 0.6, z + 0.6, { t: 0.33, k: KIND.BOARD });
    bx(tt, -34, 34, 72.8, H.TOP, -0.8, 0, plain); bx(tt, -0.8, 0, 72.8, H.TOP, -60, -164, plain); bx(tt, -34, -33.2, 72.8, H.TOP, 0, -164, plain);
    // the closed door the footprints end at, with its architrave
    const DOORZ = -117;
    const dwood = { t: 0.41, k: KIND.BOARD };
    bx(tt, -0.5, 0, 48, 65, DOORZ - 5, DOORZ + 5, { t: 0.37, k: KIND.BOARD }); bx(tt, -0.7, 0, 48, 66, DOORZ - 6, DOORZ - 5, dwood); bx(tt, -0.7, 0, 48, 66, DOORZ + 5, DOORZ + 6, dwood); bx(tt, -0.8, 0, 65, 66.2, DOORZ - 6.3, DOORZ + 6.3, dwood);
    for (const [y0, y1] of [[49.4, 55], [56.2, 63.6]]) for (const z of [DOORZ - 2.4, DOORZ + 2.4]) bx(tt, -0.65, -0.5, y0, y1, z - 1.9, z + 1.9, { t: 0.345, k: KIND.BOARD });
    tt.sph(0.42, { p: [-0.9, 56, DOORZ - 3.9], t: 0.14, k: KIND.METAL }, 8, 6);
    addHalo(tt, { p: [-2.6, 48.02, DOORZ], r: 5.2, sx: 0.55, sz: 1.2, t: FLOOR, k: KIND.BOARD, gain: 0.2 });
    // the airing cupboard in the corner at the head of the strip, its one wide door swung right back against the west wall:
    // the hot tank on its plinth, banded, with its flow and feed, and slatted shelves of warm linen over it. The landing
    // line runs in under it: the tank is the first thing on this floor the front reaches, and the head of the landing
    // (the rail, the floor, the wall beside it) is composed round its light.
    const CUP = [-33.5, -24.9, -61.5, -57.4], uTank = 0.652, TANK = [(CUP[0] + CUP[1]) / 2, 49.1, -59.5];
    { const [x0, x1, z0, z1] = CUP, cw = { t: 0.41, k: KIND.BOARD }, [cx, cy, cz] = TANK, lr = ctx.core.makeRng(977);
      bx(tt, x1 - 0.35, x1, 48, 69.6, z0, z1, cw); bx(tt, x0, x0 + 0.3, 48, 69.6, z0, z1, cw);
      bx(tt, x0 - 0.1, x1 + 0.3, 69.6, 70.5, z0, z1 + 0.35, { t: 0.46, k: KIND.BOARD }); bx(tt, x0, x1, 68.4, 69.6, z1 - 0.3, z1, cw);
      bx(tt, x0 + 0.3, x1 - 0.35, 48, cy, z0, z1 - 0.2, { t: 0.37, k: KIND.BOARD });
      for (const x of [x0 + 0.3, x1 - 0.8]) bx(tt, x, x + 0.5, cy, 68.4, z1 - 0.25, z1, cw);
      bx(tt, x0 + 0.1, x0 + 0.5, 48.4, 68.4, z1, z1 + 8.2, cw);
      for (const [y0, y1] of [[49.8, 56.6], [58, 67]]) for (const zc of [z1 + 2.2, z1 + 6.0]) bx(tt, x0 + 0.5, x0 + 0.62, y0, y1, zc - 1.5, zc + 1.5, { t: 0.36, k: KIND.BOARD });
      bx(tt, x0 + 0.5, x0 + 0.66, 57.0, 57.6, z1 + 0.3, z1 + 7.9, { t: 0.44, k: KIND.BOARD });
      tt.sph(0.36, { p: [x0 + 0.85, 58.6, z1 + 7.5], t: 0.14, k: KIND.METAL }, 7, 5);
      const tk = (x, y, z, out) => { const h = clamp((y - cy) / 13.2, 0, 1); out[0] = 0.5 + 0.13 * h; out[1] = uTank + (1 - h) * 0.03; out[2] = 0.872 + 0.085 * h - out[0]; };
      tt.add(new THREE.CylinderGeometry(2.7, 2.7, 11.4, 20, 6), { p: [cx, cy + 5.7, cz], k: KIND.METAL, fn: tk });
      tt.add(new THREE.SphereGeometry(2.7, 20, 6, 0, Math.PI * 2, 0, Math.PI / 2), { p: [cx, cy + 11.4, cz], s: [1, 0.6, 1], k: KIND.METAL, fn: tk });
      for (const y of [2.3, 5.8, 9.3]) { const g = new THREE.TorusGeometry(2.77, 0.12, 5, 24); g.rotateX(Math.PI / 2); tt.add(g, { p: [cx, cy + y, cz], t: 0.3, k: KIND.METAL, arr: uTank + 0.02, gain: 0.47 }); }
      tt.tube([[cx, cy + 12.9, cz], [cx, cy + 14.0, cz], [cx + 2.7, cy + 15.0, cz - 0.8], [cx + 2.7, 69.6, cz - 0.8]], 0.3, { t: 0.3, k: KIND.METAL, arr: uTank + 0.03, gain: 0.57, steps: 14 });
      tt.tube([[x0 + 1.4, 48.2, z1 - 0.7], [x0 + 1.4, cy + 1.4, z1 - 0.9], [cx - 2.4, cy + 1.6, cz + 0.6]], 0.26, { t: 0.3, k: KIND.METAL, arr: uTank, gain: 0.56, steps: 10 });
      { const g = new THREE.CylinderGeometry(0.36, 0.36, 0.5, 8); g.rotateZ(Math.PI / 2); tt.add(g, { p: [x0 + 1.4, cy + 2.6, z1 - 0.8], t: 0.2, k: KIND.METAL }); tt.box(0.14, 0.14, 1.3, { p: [x0 + 1.4, cy + 3.0, z1 - 0.8], t: 0.18, k: KIND.METAL }); }
      for (const y of [63.3, 66.0]) {
        for (let i = 0; i < 5; i++) bx(tt, x0 + 0.3, x1 - 0.35, y, y + 0.22, z0 + 0.25 + i * 0.78, z0 + 0.75 + i * 0.78, { t: 0.42, k: KIND.BOARD });
        for (let j = 0; j < 2; j++) { const n = 2 + Math.floor(lr() * 3), sx = x0 + 1.8 + j * 2.75;
          for (let i = 0; i < n && y + 0.9 + i * 0.44 < (y < 65 ? 65.8 : 68.3); i++) tt.box(2.3 - lr() * 0.3, 0.42, 2.7, { p: [sx + (lr() - 0.5) * 0.2, y + 0.44 + i * 0.44, z0 + 2.2], r: [0, (lr() - 0.5) * 0.22, 0], t: 0.6 + lr() * 0.085, k: KIND.CLOTH }); }
      }
      addHalo(tt, { p: [cx + 1.5, 48.04, z1 + 4.6], r: 7.6, sx: 1.15, sz: 0.95, t: FLOOR, k: KIND.BOARD, arr: uTank + 0.01, gain: 0.15 });
      addEmitter(shared, [cx, cy + 2.4, z1 + 1.3], [cx, cy + 11.6, z1 + 1.3], { R: 10.5, I: 1.7, arr: uTank + 0.03, arr1: uTank, w: 0.03, prio: true, span: true });
    }
    await ctx.yield();
    // the landing window: a deep frame with an arched head, two mullions either side of the portal, a sill
    const WX = H.WIN.x, zw = -164;
    { const sh = new THREE.Shape(); sh.moveTo(-12.6, 54); sh.lineTo(12.6, 54); sh.lineTo(12.6, 73.6); sh.lineTo(-12.6, 73.6); sh.lineTo(-12.6, 54);
      const hole = new THREE.Path(); hole.moveTo(-11, 55); hole.lineTo(-11, 61); hole.absarc(0, 61, 11, Math.PI, 0, true); hole.lineTo(11, 55); hole.lineTo(-11, 55); sh.holes.push(hole);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.9, bevelEnabled: false, curveSegments: 20 }); tt.add(g, { p: [WX, 0, zw], t: 0.25, k: KIND.BOARD }); }
    for (const sx of [-1, 1]) bx(tt, WX + sx * 7.5 - 0.35, WX + sx * 7.5 + 0.35, 55, 71.2, zw, zw + 0.7, { t: 0.13, k: KIND.BOARD });
    bx(tt, WX - 13.2, WX + 13.2, 54, 55, zw, zw + 2.4, { t: 0.3, k: KIND.BOARD });
    { const g = new THREE.TorusGeometry(7.45, 0.3, 5, 20, Math.PI); tt.add(g, { p: [WX, 62, zw + 0.4], t: 0.13, k: KIND.BOARD }); }
    panes.push([WX, 63.5, zw + 0.2, 22, 17, 0, 1, 'window', 0]);
    // a laylight over the stairwell: more black glass, frost, and cold air coming down from it
    // (and a coffer of beams round it, so the stairwell's ceiling is never a bare field)
    for (const z of [-14.5, -45.5]) { bx(tt, -33.2, 34, 72.4, H.TOP, z - 0.7, z + 0.7, { t: 0.31, k: KIND.BEAM }); bx(tt, -33.2, 34, 72.1, 72.4, z - 0.95, z + 0.95, { t: 0.34, k: KIND.BEAM }); }
    for (const x of [-14, 18]) bx(tt, x - 0.6, x + 0.6, 72.6, H.TOP, -0.8, -60, { t: 0.3, k: KIND.BOARD });
    for (const x of [-25, 28]) bx(tt, x - 0.45, x + 0.45, 73, H.TOP, -0.8, -60, { t: 0.28, k: KIND.BOARD });
    const LL = [2, 73.7, -30, 20, 20];
    for (const sx of [-1, 1]) { bx(tt, LL[0] + sx * 10 - 0.5, LL[0] + sx * 10 + 0.5, 72.9, H.TOP, LL[2] - 10.5, LL[2] + 10.5, wood); bx(tt, LL[0] - 10.5, LL[0] + 10.5, 72.9, H.TOP, LL[2] + sx * 10 - 0.5, LL[2] + sx * 10 + 0.5, wood); }
    for (const d of [-5, 0, 5]) { bx(tt, LL[0] + d - 0.25, LL[0] + d + 0.25, 73.2, 73.75, LL[2] - 10, LL[2] + 10, { t: 0.22, k: KIND.BOARD }); bx(tt, LL[0] - 10, LL[0] + 10, 73.2, 73.75, LL[2] + d - 0.25, LL[2] + d + 0.25, { t: 0.22, k: KIND.BOARD }); }
    panes.push([LL[0], LL[1], LL[2], LL[3], LL[4], 0, 0, null, 2]);
    await ctx.yield();

    // ================================================================== what people left in the rooms
    const fr = rng.fork('furniture');
    const uKitchen = uAt(13.5, 7, -108), uHallRad = uAt(11, 7, -90), uNewel = uAt(16, 9, -62), uBath = uAt(-14, 58.5, -104), uBed = uAt(-14, 59, -76);
    // kitchen: counter and range against the parlour wall (they face the camera coming up the hall), table by the door
    // (the range at its west end is burning: its iron pale at the foot and gold at the hot plate, the pans on it hot)
    kit(tg, INT.kitchenCounterGeometry({ rng: fr.fork('counter'), scale: S }), { p: [-12, 0, -96.3], r: [0, Math.PI, 0], t: 0.42,
      heat: lit ? (x, y, z, out) => { if (x < -15.55) out[0] = 0.58 + 0.1 * Math.min(1, y / 7.2) + (out[0] - 0.4) * 0.5 + (y > 7.22 ? 0.17 : 0); } : null });
    await ctx.yield();
    const RANGE = [-19.4, 7.25, -96.6];
    if (lit) {
      // the fire door with the fire behind its slots, the ash pit's slit, two hot-plate rings, the flue up the wall
      const hotR = { k: KIND.IRON, arr: -0.1, gain: 0 }, FZ = -98.93;
      bx(tg, -20.9, -16.1, 1.75, 5.0, FZ - 0.2, FZ, { t: 0.79, ...hotR }); bx(tg, -21.1, -15.9, 5.0, 5.3, FZ - 0.3, FZ, { t: 0.7, ...hotR });
      for (let i = 0; i < 5; i++) bx(tg, -20.25 + i * 0.85, -19.75 + i * 0.85, 2.3, 4.45, FZ - 0.27, FZ - 0.18, { t: 0.975, ...hotR });
      bx(tg, -20.5, -16.5, 0.85, 1.2, FZ - 0.12, FZ, { t: 0.93, ...hotR });
      for (const x of [-17.58, -21.22]) { const g = new THREE.TorusGeometry(1.2, 0.13, 5, 20); g.rotateX(Math.PI / 2); tg.add(g, { p: [x, 7.42, -96.45], t: 0.95, ...hotR }); }
      tg.add(new THREE.CylinderGeometry(0.5, 0.5, 13.5, 10, 6), { p: [-22.45, 14.1, -94.6], ...hotR, fn: (x, y, z, out) => { out[0] = 0.875 - 0.3 * (y - 7.35) / 13.5; } });
      tg.cyl(0.72, 0.72, 0.5, 10, { p: [-22.45, 7.6, -94.6], t: 0.86, ...hotR }); tg.cyl(0.7, 0.7, 0.45, 10, { p: [-22.45, 20.6, -94.6], t: 0.52, k: KIND.IRON });
      addEmitter(shared, [-18.5, 3.2, -100.8], null, { R: 9, I: 1.7, flick: true, prio: true });
      addEmitter(shared, [-22.4, 9.8, -99.4], [-16.4, 9.8, -99.4], { R: 10, I: 1.75, prio: true });
      addHalo(tg, { p: [-18.5, 0.045, -103.2], r: 8.4, sx: 1.25, sz: 0.85, t: FLOOR, k: KIND.TILE, gain: 0.15 });
    }
    if (cast.coffee) {
      tg.cyl(0.75, 1.1, 3.2, 12, { p: RANGE.map((v, i) => v + (i === 1 ? 1.6 : 0)), t: 0.68, k: KIND.METAL }); tg.cyl(0.3, 0.8, 0.5, 12, { p: [RANGE[0], RANGE[1] + 3.4, RANGE[2]], t: 0.62, k: KIND.METAL });
      tg.sph(0.22, { p: [RANGE[0], RANGE[1] + 3.75, RANGE[2]], t: 0.5, k: KIND.METAL }, 7, 5); tg.box(0.25, 0.3, 1.5, { p: [RANGE[0] + 0.5, RANGE[1] + 2.4, RANGE[2] - 1.2], r: [0.6, 0.4, 0], t: 0.64, k: KIND.METAL });
      { const hg = new THREE.TorusGeometry(0.9, 0.14, 5, 12, Math.PI); hg.rotateZ(-Math.PI / 2); tg.add(hg, { p: [RANGE[0] + 0.95, RANGE[1] + 1.8, RANGE[2]], t: 0.4, k: KIND.BOARD }); }
    } else kit(tg, INT.teapotGeometry({ scale: 17, height: 0.16 }), { p: RANGE, r: [0, 2.4, 0], t: 0.69, tv: 0.05, k: KIND.METAL });
    addHalo(tg, { p: [RANGE[0], RANGE[1] - 0.04, RANGE[2]], r: 4.2, t: 0.42, k: KIND.IRON, gain: 0.3 });
    await ctx.yield();
    if (lit) addHalo(tg, { wall: [0, -1], p: [-17.5, 12.2, -93.52], w: 21, h: 16, t: WALL - 0.075, k: KIND.PLAIN, gain: 0.17 });
    else addHalo(tg, { wall: [0, -1], p: [RANGE[0], RANGE[1] + 4.5, -93.52], w: 9, h: 10, t: WALL - 0.075, k: KIND.PLAIN, gain: 0.15 });
    const TOAST = [-6.5, 7.25, -96.4], uToast = uKitchen - 0.085;
    bx(tg, TOAST[0] - 1.9, TOAST[0] + 1.9, TOAST[1], TOAST[1] + 2.3, TOAST[2] - 1.05, TOAST[2] + 1.05, { t: 0.3, k: KIND.METAL, arr: uToast + 0.02, gain: 0.24 });
    bx(tg, TOAST[0] - 2.0, TOAST[0] + 2.0, TOAST[1], TOAST[1] + 0.3, TOAST[2] - 1.15, TOAST[2] + 1.15, { t: 0.2, k: KIND.METAL });
    for (const dz of [-0.45, 0.45]) { bx(tg, TOAST[0] - 1.5, TOAST[0] + 1.5, TOAST[1] + 2.26, TOAST[1] + 2.38, TOAST[2] + dz - 0.26, TOAST[2] + dz + 0.26, { t: 0.3, k: KIND.METAL, arr: uToast, gain: 0.62 });
      bx(tg, TOAST[0] - 1.25, TOAST[0] + 1.25, TOAST[1] + 1.7, TOAST[1] + 3.1, TOAST[2] + dz - 0.11, TOAST[2] + dz + 0.11, { t: 0.4, k: KIND.PLAIN, arr: uToast + 0.03, gain: 0.24 }); }
    bx(tg, TOAST[0] + 1.9, TOAST[0] + 2.2, TOAST[1] + 1.0, TOAST[1] + 1.35, TOAST[2] - 0.25, TOAST[2] + 0.25, { t: 0.16, k: KIND.METAL });
    addEmitter(shared, [TOAST[0], TOAST[1] + 3.0, TOAST[2] - 0.5], null, lit ? { R: 6.4, I: 1.45, arr: uToast, w: 0.03 } : { R: 4.6, I: 1.15, arr: uToast, w: 0.03 });
    await ctx.yield();
    const TABLE = [-11, 0, -106.5], tg1 = INT.tableGeometry({ scale: S, width: 1.5, depth: 0.95 }), tableTop = tg1.userData.top ?? 6.1;
    kit(tg, tg1, { p: TABLE, t: 0.44 });
    kit(tg, INT.cupGeometry({ scale: 15 }), { p: [TABLE[0] + 2.4, tableTop, TABLE[2] + 0.8], t: 0.6, tv: 0.05 });
    kit(tg, INT.plateGeometry({ scale: 11 }), { p: [TABLE[0] - 1.6, tableTop, TABLE[2] - 1.0], t: 0.33, tv: 0.05 });
    bx(tg, TABLE[0] - 2.5, TABLE[0] - 0.9, tableTop + 0.12, tableTop + 0.36, TABLE[2] - 1.8, TABLE[2] - 0.4, { t: 0.52, k: KIND.PLAIN });
    if (look === 1) kit(tg, INT.teaSetGeometry({ rng: fr.fork('tea'), scale: 9 }), { p: [TABLE[0] - 3.5, tableTop, TABLE[2] + 1.2], t: 0.58, tv: 0.08 });
    await ctx.yield();
    const CHAIR = [-4.6, 0, -111];
    kit(tg, INT.chairGeometry({ scale: S }), { p: CHAIR, r: [0, 2.3, 0], t: 0.43, heat: (x, y, z, out) => { if (y > 3.2 && y < 4.4) out[0] += 0.24 * Math.max(0, 1 - Math.hypot(x - CHAIR[0], z - CHAIR[2]) / 2.4); } });
    kit(tg, INT.chairGeometry({ scale: S }), { p: [-18.5, 0, -104], r: [0, -1.5, 0], t: 0.4 });
    kit(tg, INT.bookshelfGeometry({ rng: fr.fork('dresser'), scale: S, width: 1.6, height: 2.0, books: false }), { p: [-31.5, 0, -111.5], r: [0, Math.PI / 2, 0], t: 0.4 });
    await ctx.yield();
    // parlour: a sofa facing the hearth, a wing chair, a round table, a rug
    ry(tg, 0.06, -28, -6.5, -66, -90, 1, { t: 0.4, k: KIND.CLOTH }); ry(tg, 0.085, -26.4, -8.1, -67.5, -88.5, 1, { t: 0.44, k: KIND.CLOTH });
    await ctx.yield();
    const SOFA = [-16, 0, -86];
    kit(tg, INT.sofaGeometry({ rng: fr.fork('sofa'), scale: S }), { p: SOFA, t: 0.45, k: KIND.CLOTH });
    kit(tg, INT.chairGeometry({ scale: S, style: 'arm' }), { p: [-26, 0, -72], r: [0, 2.3, 0], t: 0.45, k: KIND.CLOTH });
    const rt = INT.tableGeometry({ scale: S, round: true, width: 0.9, height: 0.6 }); kit(tg, rt, { p: [-16, 0, -75], t: 0.43 });
    if (look === 1) kit(tg, INT.teaSetGeometry({ rng: fr.fork('tea2'), scale: 9 }), { p: [-16, rt.userData.top ?? 4.8, -75], t: 0.6, tv: 0.08 });
    else kit(tg, INT.bookStackGeometry({ rng: fr.fork('books'), scale: 9, count: 3 }), { p: [-16, rt.userData.top ?? 4.8, -75], t: 0.38 });
    await ctx.yield();
    const STOVE = [-5.6, 0, -72.4], HEARTHX = -18;
    if (look === 2) {       // the night the power came back: a stove that has been burning all along, and a hollow under blankets on the sofa
      const hotS = { k: KIND.METAL, arr: -0.1, gain: 0.0 };
      tg.cyl(2.3, 2.6, 6.8, 16, { p: [STOVE[0], 4.8, STOVE[2]], ...hotS, fn: (x, y, z, out) => { out[0] = 0.83 + 0.07 * (y - 1.4) / 6.8; } });
      tg.cyl(2.7, 2.7, 0.5, 16, { p: [STOVE[0], 8.4, STOVE[2]], t: 0.86, ...hotS }); tg.cyl(2.8, 2.8, 0.5, 16, { p: [STOVE[0], 1.3, STOVE[2]], t: 0.78, ...hotS });
      for (let i = 0; i < 4; i++) { const a = i * 1.571 + 0.4; const tr = new THREE.TorusGeometry(2.42 + i * 0.02, 0.12, 5, 20); tr.rotateX(Math.PI / 2); tg.add(tr, { p: [STOVE[0], 2.6 + i * 1.5, STOVE[2]], t: 0.72, ...hotS }); tg.cyl(0.25, 0.35, 1.2, 6, { p: [STOVE[0] + Math.cos(a) * 2.1, 0.6, STOVE[2] + Math.sin(a) * 2.1], t: 0.5, k: KIND.METAL }); }
      { const d = new THREE.CylinderGeometry(1.3, 1.3, 0.3, 16); d.rotateX(Math.PI / 2); tg.add(d, { p: [STOVE[0], 4.4, STOVE[2] - 2.5], t: 0.99, k: KIND.METAL, arr: 0, gain: 0.0 }); }
      tg.cyl(0.7, 0.7, 12.4, 10, { p: [STOVE[0], 14.8, STOVE[2] + 0.4], ...hotS, fn: (x, y, z, out) => { out[0] = 0.86 - 0.22 * (y - 8.6) / 12.4; } });
      addHalo(tg, { p: [STOVE[0] - 1, 0, STOVE[2] - 2], r: 11, t: FLOOR, k: KIND.BOARD, gain: 0.34 });
      addHalo(tg, { wall: [-1, 0], p: [-0.62, 9.5, STOVE[2]], w: 17, h: 19, t: WALL, k: KIND.PAPER, gain: 0.3 });
      addHalo(tg, { p: [SOFA[0] - 2.5, 4.05, SOFA[2] + 0.6], r: 3.1, sx: 1.25, sz: 0.8, t: 0.45, k: KIND.CLOTH, gain: 0.3 });
      for (const [dx, s] of [[2.6, 1.5], [4.4, 1.2], [-6.2, 1.1]]) tg.sph(s, { p: [SOFA[0] + dx, 4.6, SOFA[2] + 0.4], s: [1.5, 0.7, 1.3], t: 0.52, k: KIND.CLOTH }, 10, 7);
    }
    kit(tg, INT.fireplaceGeometry({ rng: fr.fork('hearth'), scale: S }), { p: [HEARTHX, 0, -60.6], r: [0, Math.PI, 0], t: 0.3, tv: 0.12 });
    await ctx.yield();

    // bath bay: a claw-foot bath 13 m long under a running tap (or a shower behind a pale curtain)
    const BATH = [-27.5, 48, -104], uTap = uBath - 0.2;
    { const shell = new THREE.SphereGeometry(1, 22, 9, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      const bfn = (x, y, z, out) => { out[1] = uTap + (y - 49.2) * 0.03; };
      td.add(shell, { p: [BATH[0], BATH[1] + 5.0, BATH[2]], s: [2.75, 3.9, 6.5], t: 0.33, k: KIND.IRON, arr: uTap, gain: 0.3, fn: bfn });
      const rim = new THREE.TorusGeometry(1, 0.075, 6, 28); rim.rotateX(Math.PI / 2); tt.add(rim, { p: [BATH[0], BATH[1] + 5.0, BATH[2]], s: [2.78, 3.2, 6.53], t: 0.36, k: KIND.IRON, arr: uTap + 0.1, gain: 0.25 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { tt.sph(0.55, { p: [BATH[0] + sx * 1.5, BATH[1] + 0.5, BATH[2] + sz * 3.9], s: [1, 0.9, 1.3], t: 0.2, k: KIND.METAL }, 8, 6); tt.cyl(0.3, 0.5, 1.5, 7, { p: [BATH[0] + sx * 1.4, BATH[1] + 1.4, BATH[2] + sz * 3.7], r: [sz * 0.3, 0, -sx * 0.3], t: 0.24, k: KIND.IRON }); }
      await ctx.yield();
      // taps and spout at the near end
      const tz = BATH[2] + 6.9;
      for (const sx of [-1, 1]) { tt.cyl(0.16, 0.16, 6.4, 7, { p: [BATH[0] + sx * 0.7, BATH[1] + 3.2, tz], t: 0.16, k: KIND.METAL, arr: sx > 0 ? uTap : -1, gain: 0.6 }); tt.box(0.9, 0.14, 0.14, { p: [BATH[0] + sx * 0.7, BATH[1] + 6.7, tz], t: 0.14, k: KIND.METAL }); tt.sph(0.3, { p: [BATH[0] + sx * 0.7, BATH[1] + 6.4, tz], t: 0.15, k: KIND.METAL, arr: sx > 0 ? uTap : -1, gain: 0.5 }, 7, 5); }
      tt.box(1.8, 0.3, 0.3, { p: [BATH[0], BATH[1] + 6.0, tz], t: 0.16, k: KIND.METAL, arr: uTap, gain: 0.55 }); tt.box(0.3, 0.3, 1.5, { p: [BATH[0], BATH[1] + 6.0, tz - 0.7], t: 0.16, k: KIND.METAL, arr: uTap, gain: 0.6 });
      // mat, towel rail with a towel, a stool
      ry(tt, 48.07, -23.4, -20.2, BATH[2] + 4.5, BATH[2] - 3.5, 1, { t: 0.46, k: KIND.CLOTH });
      for (const x of [-32.4, -27.6]) tt.cyl(0.14, 0.14, 7, 6, { p: [x, 51.5, -92], t: 0.15, k: KIND.METAL }); for (const y of [51.5, 54.6]) tt.box(5, 0.2, 0.2, { p: [-30, y, -92], t: 0.15, k: KIND.METAL });
      tt.box(4.2, 4.4, 0.5, { p: [-30, 52.5, -92.1], t: 0.5, k: KIND.CLOTH, sway: 0.03 });
      kit(tt, INT.chairGeometry({ scale: S, style: 'stool' }), { p: [-21.5, 48, -95.5], t: 0.42 }); tt.box(2.6, 0.5, 2.2, { p: [-21.5, 48 + 3.9, -95.5], t: 0.5, k: KIND.CLOTH });
      addHalo(tt, { p: [BATH[0], 48.04, BATH[2]], r: 7, sx: 0.7, sz: 1.25, t: FLOOR, k: KIND.TILE, arr: uTap + 0.05, gain: 0.14 });
      if (cast.shower) {          // a ring rail and a pale curtain round the far end
        const ring = new THREE.TorusGeometry(1, 0.05, 5, 26); ring.rotateX(Math.PI / 2); tt.add(ring, { p: [BATH[0], 67, BATH[2] - 3], s: [2.9, 3, 3.6], t: 0.15, k: KIND.METAL });
        tt.cyl(0.12, 0.12, 16.5, 6, { p: [BATH[0], 60, BATH[2] - 6.2], t: 0.15, k: KIND.METAL, arr: uTap, gain: 0.45 }); tt.cyl(0.8, 0.2, 0.5, 10, { p: [BATH[0], 68, BATH[2] - 5.6], t: 0.16, k: KIND.METAL, arr: uTap, gain: 0.42 });
        const cg = new THREE.CylinderGeometry(1, 1, 15.5, 28, 8, true, -0.4, Math.PI * 1.25);
        const pc = cg.attributes.position; for (let i = 0; i < pc.count; i++) { const a = Math.atan2(pc.getX(i), pc.getZ(i)), f = 1 + 0.05 * Math.sin(a * 22); pc.setX(i, pc.getX(i) * f); pc.setZ(i, pc.getZ(i) * f); }
        cg.computeVertexNormals();
        td.add(cg, { p: [BATH[0], 59.2, BATH[2] - 3], s: [2.9, 1, 3.6], r: [0, Math.PI, 0], t: 0.42, k: KIND.CLOTH, arr: uTap, gain: 0.17, sway: 0.1 });
      }
    }
    await ctx.yield();
    // bedroom bay: the brass bed with the quilt turned back off two hollows
    const BED = [-28.7, 48, -77];
    { const bg = INT.bedGeometry({ rng: fr.fork('bed'), scale: S, width: 1.28, length: 2.0 }), top = 48 + (bg.userData.top ?? 5);
      kit(tt, bg, { p: BED, t: 0.46, tv: 0.2, k: KIND.CLOTH });
      await ctx.yield();
      for (const sx of [-1, 1]) addHalo(tt, { p: [BED[0] + sx * 2.5, top + 0.55, BED[2] + 1.6], r: 2.7, sx: 0.8, sz: 1.5, t: 0.5, k: KIND.CLOTH, gain: 0.215 });
      { const roll = new THREE.CylinderGeometry(0.9, 0.9, 10.2, 12, 6); roll.rotateZ(Math.PI / 2); tt.add(roll, { p: [BED[0], top + 0.5, BED[2] - 3.4], s: [1, 0.75, 1.5], t: 0.52, k: KIND.CLOTH }); }
      kit(tt, INT.tableGeometry({ scale: S, width: 0.5, depth: 0.45, height: 0.62 }), { p: [-21.4, 48, -66.2], t: 0.42 });
      tt.cyl(0.5, 0.4, 1.2, 9, { p: [-21.4, 48 + 5.6, -66.2], t: 0.24, k: KIND.PLAIN });
      for (const [x, z, r] of [[-21.6, -74, 0.2], [-21.4, -76.2, -0.1]]) tt.box(1.0, 0.5, 2.2, { p: [x, 48.3, z], r: [0, r, 0], t: 0.3, k: KIND.CLOTH });
      ry(tt, 48.06, -23, -19.4, -70, -83, 1, { t: 0.45, k: KIND.CLOTH });
    }
    await ctx.yield();
    // the chest by the balustrade end with the folded blanket, a linen press beyond the door, pictures on the wall
    const CHEST = [-4.2, 48, -86], CASE1 = -109;
    const CATY = cast.dog ? 48.95 : 53.75, CAT0 = [CHEST[0] - (cast.dog ? 1.2 : 0), CATY, CHEST[2] + 2.6];
    if (!cast.dog) {
    bx(tt, CHEST[0] - 2.4, CHEST[0] + 2.4, 48.5, 52.6, CHEST[2] - 7, CHEST[2] + 7, { t: 0.43, k: KIND.BOARD }); bx(tt, CHEST[0] - 2.6, CHEST[0] + 2.6, 52.6, 53.2, CHEST[2] - 7.2, CHEST[2] + 7.2, { t: 0.46, k: KIND.BOARD });
    for (const z of [-4.5, 0, 4.5]) bx(tt, CHEST[0] - 2.5, CHEST[0] + 2.5, 48.6, 53.25, CHEST[2] + z - 0.25, CHEST[2] + z + 0.25, { t: 0.2, k: KIND.METAL });
    for (const sz of [-6.4, 6.4]) for (const sx of [-1.9, 1.9]) tt.sph(0.5, { p: [CHEST[0] + sx, 48.4, CHEST[2] + sz], t: 0.4, k: KIND.BOARD }, 7, 5);
    bx(tt, CHEST[0] - 2.1, CHEST[0] + 2.1, 53.2, 53.48, CAT0[2] - 2.6, CAT0[2] + 2.6, { t: 0.5, k: KIND.CLOTH }); bx(tt, CHEST[0] - 2.0, CHEST[0] + 2.0, 53.48, CATY, CAT0[2] - 2.5, CAT0[2] + 2.4, { t: 0.52, k: KIND.CLOTH });
    } else {            // the old dog's bed on the landing floor
      tt.cyl(4.6, 4.9, 0.9, 20, { p: [CAT0[0], 48.45, CAT0[2]], s: [1, 1, 1.25], t: 0.47, k: KIND.CLOTH });
      { const g = new THREE.TorusGeometry(4.5, 0.75, 7, 22); g.rotateX(Math.PI / 2); tt.add(g, { p: [CAT0[0], 48.9, CAT0[2]], s: [1, 1, 1.25], t: 0.5, k: KIND.CLOTH }); }
      addHalo(tt, { p: [CAT0[0], 48.9, CAT0[2]], r: 3.6, sz: 1.25, t: 0.47, k: KIND.CLOTH, gain: 0.2 });
    }
    { const bc = rng.fork('bookcase'), z0 = CHEST[2] - 7.8, x0 = CHEST[0] - 2.3, x1 = CHEST[0] + 2.3;
      bx(tt, x0 + 0.3, x1, 48.3, 52.7, z0, CASE1, { t: 0.34, k: KIND.BOARD }); bx(tt, x0 - 0.1, x1 + 0.1, 52.7, 53.2, z0 + 0.2, CASE1 - 0.2, { t: 0.44, k: KIND.BOARD }); bx(tt, x0, x1, 48, 48.5, z0, CASE1, { t: 0.4, k: KIND.BOARD });
      for (const z of [z0, (z0 + CASE1) / 2, CASE1]) bx(tt, x0, x0 + 0.4, 48.4, 52.7, z - 0.2, z + 0.2, { t: 0.43, k: KIND.BOARD });
      bx(tt, x0, x0 + 0.4, 50.4, 50.65, z0, CASE1, { t: 0.43, k: KIND.BOARD });
      for (const y of [48.5, 50.65]) for (let z = z0 - 0.35; z > CASE1 + 0.9;) { const w = 0.3 + bc() * 0.42, h = 1.3 + bc() * 0.7; if (bc() < 0.86) tt.box(0.5, h, w, { p: [x0 + 0.42, y + h / 2, z - w / 2], r: [bc() < 0.12 ? 0.2 : 0, 0, 0], t: 0.3 + bc() * 0.16, k: KIND.PAPER }); z -= w + 0.04; }
      for (const [z, n] of [[z0 - 2.5, 3], [CASE1 + 2.2, 2]]) for (let i = 0; i < n; i++) tt.box(1.5 - i * 0.12, 0.34, 2.1 - i * 0.2, { p: [x1 - 0.95, 53.37 + i * 0.34, z], r: [0, (bc() - 0.5) * 0.5, 0], t: 0.36 + bc() * 0.1, k: KIND.PAPER });
    }
    await ctx.yield();
    const PRESS = 0.34;
    bx(tt, -3.5, 0, 48, 68, -126, -138, { t: PRESS, k: KIND.BOARD }); bx(tt, -3.9, 0, 68, 69, -125.6, -138.4, { t: PRESS + 0.04, k: KIND.BOARD }); for (const z of [-129, -135]) { bx(tt, -3.65, -3.5, 50, 66, z - 2.4, z + 2.4, { t: PRESS - 0.03, k: KIND.BOARD }); tt.sph(0.3, { p: [-3.8, 58, z + (z < -132 ? 2 : -2)], t: 0.14, k: KIND.METAL }, 6, 4); }
    for (const [z, w, h, y] of [[-70, 9, 9, 62], [-92, 9, 7, 63], [-150, 6, 8, 62]]) { bx(tt, -0.4, 0, y - h / 2, y + h / 2, z - w / 2, z + w / 2, { t: 0.42, k: KIND.BOARD }); bx(tt, -0.5, -0.4, y - h / 2 + 0.7, y + h / 2 - 0.7, z - w / 2 + 0.7, z + w / 2 - 0.7, { t: 0.3, k: KIND.CLOTH }); }
    await ctx.yield();
    // the window's curtains (they pale from the hem up and stir once the radiator is full) and the fern on its stand
    for (const cx of [H.WIN.x - 13.7, H.WIN.x + 12.4]) {
      const g = new THREE.PlaneGeometry(3.6, 24.6, 14, 12), pp = g.attributes.position;
      for (let i = 0; i < pp.count; i++) pp.setZ(i, Math.sin(pp.getX(i) * 5.2) * 0.34 + Math.sin(pp.getX(i) * 1.7 + pp.getY(i) * 0.2) * 0.15);
      g.computeVertexNormals();
      tt.add(g, { p: [cx, 60.5, -162.2], t: 0.35, k: KIND.CLOTH, fn: (x, y, z, out) => { const h = (y - 48.2) / 24.6; out[1] = K.window + 0.025 + h * 0.11; out[2] = 0.21 * (1 - 0.4 * h); out[3] = 0.55 * (1 - h) * (1 - h) + 0.05; } });
    }
    { const pole = new THREE.CylinderGeometry(0.22, 0.22, 31, 7); pole.rotateZ(Math.PI / 2); tt.add(pole, { p: [H.WIN.x - 0.6, 73.0, -162.2], t: 0.2, k: KIND.METAL }); for (const x of [-30.4, 0.6 - 1.0]) tt.sph(0.5, { p: [x, 73, -162.2], t: 0.2, k: KIND.METAL }, 7, 5); }
    kit(tt, INT.tableGeometry({ scale: S, round: true, width: 0.5, height: 0.72 }), { p: [-30, 48, -151], t: 0.42 });
    kit(tt, INT.plantGeometry({ rng: fr.fork('fern'), scale: 10, kind: 'fern' }), { p: [-30, 48 + 5.76, -151], t: 0.2, tv: 0.1, sway: 0.7 });
    await ctx.yield();

    // ================================================================== things that move on their own meshes
    // the front door (hinged at x 22; on a rare visit it opens and shuts on someone leaving)
    const doorTB = makeTB();
    bx(doorTB, -10, 0, 0.1, 17, -0.75, -0.2, { t: 0.2, k: KIND.BOARD });
    for (const [y0, y1] of [[1.2, 6.4], [9, 15.8]]) for (const x of [-7.4, -2.6]) bx(doorTB, x - 1.9, x + 1.9, y0, y1, -0.9, -0.75, { t: 0.15, k: KIND.BOARD });
    bx(doorTB, -6.6, -3.4, 7.2, 8.0, -0.92, -0.75, { t: 0.05, k: KIND.METAL }); doorTB.sph(0.45, { p: [-8.9, 8.2, -1.1], t: 0.06, k: KIND.METAL }, 8, 6);
    const doorMat = thermalMaterial(shared); doorMat.uniforms.uShift = { value: shared.uShift.value };
    const door = new THREE.Mesh(doorTB.build(), doorMat); door.position.set(22, 0, 0); scene.add(door);
    // the spider plant turning on its cord in the stairwell
    const PLANT = [8, 40, -53], PCORD = 10;
    const plantTB = makeTB(), pr = rng.fork('spider');
    plantTB.cyl(0.14, 0.14, PCORD, 5, { p: [0, 2.2 + PCORD / 2, 0], t: 0.3, k: KIND.CLOTH });
    { const by = PLANT[1] + 2.2 + PCORD; ts.box(0.36, 0.36, 7.6, { p: [PLANT[0], by, -56.2], t: 0.16, k: KIND.METAL }); ts.box(0.3, 0.3, 6.4, { p: [PLANT[0], by - 2.2, -57.6], r: [-0.75, 0, 0], t: 0.16, k: KIND.METAL }); ts.box(0.9, 5.6, 0.3, { p: [PLANT[0], by - 2, -59.8], t: 0.16, k: KIND.METAL });
      const sc = new THREE.TorusGeometry(0.5, 0.1, 5, 12, Math.PI * 1.5); ts.add(sc, { p: [PLANT[0], by + 0.1, -52.6], r: [0, Math.PI / 2, 0], t: 0.16, k: KIND.METAL }); }
    for (let i = 0; i < 3; i++) { const a = i * 2.094; plantTB.box(0.12, 3.4, 0.12, { p: [Math.cos(a) * 0.95, 1.4, Math.sin(a) * 0.95], r: [Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55], t: 0.3, k: KIND.CLOTH }); }
    plantTB.cyl(2.0, 1.4, 2.4, 14, { p: [0, -1.2, 0], t: 0.25, k: KIND.PLAIN }); plantTB.cyl(2.15, 2.15, 0.35, 14, { p: [0, 0.1, 0], t: 0.27, k: KIND.PLAIN });
    const leafBlade = (len, wid, droop, yaw, x0, y0, z0, t) => {            // an arching strap leaf as a bent ribbon
      const g = new THREE.PlaneGeometry(wid, len, 1, 7); g.translate(0, len / 2, 0); const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const f = p.getY(i) / len, w = p.getX(i) * (1 - f * f) * (0.4 + 1.2 * Math.min(1, f * 4)); p.setXYZ(i, w, len * (f * 0.55 - droop * f * f), len * f * 0.9); }
      g.computeVertexNormals(); plantTB.add(g, { p: [x0, y0, z0], r: [0, yaw, 0], t, k: KIND.PLAIN, sway: 0.0 });
    };
    for (let i = 0; i < 26; i++) leafBlade(4.5 + pr() * 3.2, 0.7 + pr() * 0.3, 0.7 + pr() * 0.5, pr() * 6.283, 0, 0.2, 0, 0.16 + pr() * 0.08);
    for (let i = 0; i < 5; i++) {                                           // runners with plantlets
      const a = pr() * 6.283, L = 5 + pr() * 4, ex = Math.cos(a) * 3.4, ez = Math.sin(a) * 3.4;
      plantTB.tube([[0, 0.3, 0], [ex * 0.6, 1.2, ez * 0.6], [ex, -L * 0.5, ez], [ex * 1.05, -L, ez * 1.05]], 0.09, { t: 0.2, k: KIND.PLAIN, tension: 0.5 }, 5);
      for (let k = 0; k < 7; k++) leafBlade(1.4 + pr() * 1.0, 0.36, 0.9, pr() * 6.283, ex * 1.05, -L, ez * 1.05, 0.17 + pr() * 0.06);
    }
    await ctx.yield();
    const plant = new THREE.Mesh(plantTB.build(), mat2); plant.position.set(PLANT[0], PLANT[1], PLANT[2]); scene.add(plant);
    // bath water (rises as the tap runs) and the hot thread from the tap (or the shower's threads)
    const waterTB = makeTB(); { const g = new THREE.CircleGeometry(1, 28); g.rotateX(-Math.PI / 2); waterTB.add(g, { t: 0.73, k: KIND.PLAIN, fn: (x, y, z, out) => { out[0] = 0.73 - 0.06 * Math.hypot(x, z); } }); }
    const water = new THREE.Mesh(waterTB.build(), mat); scene.add(water);
    const streamTB = makeTB();
    if (cast.shower) for (let i = 0; i < 7; i++) { const a = i * 0.898; streamTB.cyl(0.07, 0.07, 1, 5, { p: [Math.cos(a) * (i ? 0.5 : 0), -0.5, Math.sin(a) * (i ? 0.5 : 0)], r: [Math.sin(a) * 0.05 * (i ? 1 : 0), 0, -Math.cos(a) * 0.05 * (i ? 1 : 0)], t: 0.715, k: KIND.PLAIN }); }
    else streamTB.cyl(0.13, 0.1, 1, 6, { p: [0, -0.5, 0], t: 0.93, k: KIND.METAL, arr: 0 });
    const stream = new THREE.Mesh(streamTB.build(), mat);
    const STREAM = cast.shower ? [BATH[0], 67.7, BATH[2] - 5.6] : [BATH[0], 53.85, BATH[2] + 5.45]; stream.position.set(STREAM[0], STREAM[1], STREAM[2]); scene.add(stream);

    // ---- the shell meshes
    for (const [tb, name, m] of [[tc, 'cellar', mat], [tg, 'ground', mat], [ts, 'stairhall', mat], [tt, 'top', mat], [td, 'shells', mat2]]) { await ctx.yield(); const geo = tb.build(); await ctx.yield(); const mesh = new THREE.Mesh(geo, m); mesh.name = name; scene.add(mesh); }

    // ================================================================== glass: cold black mirrors with frost ferns
    const glassMat = new THREE.ShaderMaterial({ uniforms: { uTime: shared.uTime, uFront: shared.uFront, uShift: shared.uShift, uSun: shared.uSun, uGrow: { value: 1 }, uFrost: { value: look === 2 ? 1 : 0 } }, side: THREE.DoubleSide,
      vertexShader: 'attribute vec4 aG; varying vec2 vUv; varying vec4 vG; void main(){ vUv = uv; vG = aG; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: /* glsl */`
varying vec2 vUv; varying vec4 vG; uniform float uGrow, uFrost;
${THERMAL_GLSL}
float fern(vec2 p, float seed, float grow) {
  float d = length(p) + 1e-3, a = atan(p.y, p.x + 1e-3);
  float n = thNoise(p * 1.3 + seed);
  float fr = sin(a * 9. + n * 5. + seed), barb = sin(d * 7. - abs(fr) * 3. + n * 4.);
  float R = grow * (2.4 + 1.8 * thHash(vec2(seed, 1.)));
  float m = 1. - smoothstep(R * .3, R, d + (n - .5) * 1.4);
  return m * (smoothstep(.15, .8, fr * .5 + .5) * .65 + smoothstep(.3, .9, barb * .5 + .5) * .35);
}
void main() {
  vec2 sz = vG.zw, p = vUv * sz; float s = vG.x, g = uGrow * (.6 + .4 * min(sz.x, sz.y) / 12.);
  float f = max(max(fern(p, s, g), fern(vec2(sz.x - p.x, p.y), s + 3., g)), max(fern(vec2(p.x, sz.y - p.y), s + 7., g * .75), fern(sz - p, s + 11., g * .75)));
  f = max(f, (1. - smoothstep(0., g * .9, p.y + (thNoise(p * vec2(.9, 2.) + s) - .5) * 1.4)) * (.45 + .55 * thNoise(p * 2.2 + s)));
  float t = f * .135 + (thNoise(p * .35 + s) - .5) * .012;
  // the night the power came back: the frost is thick, slate in its body and pale along its growing edge
  t += uFrost * (f * .17 + .34 * smoothstep(.1, .3, f) * (1. - smoothstep(.3, .62, f)));
  vec2 q = (vUv - vec2(.5, .17)) * vec2(1., sz.y / max(sz.x, 1e-3));
  float gh = exp(-dot(q, q) / .03) * step(-.5, vG.y);
  t += gh * (.035 + .1 * smoothstep(vG.y, vG.y + .06, uFront)) * (.85 + .15 * sin(uTime * .7 + s));
  gl_FragColor = vec4(thRamp(max(t, 0.) + thGrain() * .5), 1.);
}` });
    { const pos = [], uv = [], ag = [], idx = [];
      panes.forEach((pn, i) => {
        const [cx, cy, cz, w, h, nx, nz, ghost, half] = pn, seed = (i * 7.31 + 1.7) % 50, garr = ghost && RAD[ghost] ? RAD[ghost].arrive : -1, b = pos.length / 3;
        if (half === 2) {
          for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(cx + sx * w / 2, cy, cz + sy * h / 2); uv.push(sx * 0.5 + 0.5, sy * 0.5 + 0.5); ag.push(seed, garr, w, h); }
          idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
        } else if (half) {
          const n = 14; pos.push(cx, cy, cz); uv.push(0.5, 0); ag.push(seed, garr, w, h);
          for (let k = 0; k <= n; k++) { const a = (k / n) * Math.PI; pos.push(cx + Math.cos(a) * w / 2, cy + Math.sin(a) * h, cz); uv.push(0.5 + Math.cos(a) * 0.5, Math.sin(a)); ag.push(seed, garr, w, h); if (k) idx.push(b, b + k, b + k + 1); }
        } else {
          for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(cx + sx * w / 2 * (nz ? 1 : 0), cy + sy * h / 2, cz + sx * w / 2 * (nx ? 1 : 0)); uv.push(sx * 0.5 + 0.5, sy * 0.5 + 0.5); ag.push(seed, garr, w, h); }
          idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
        }
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aG', new THREE.Float32BufferAttribute(ag, 4)); g.setIndex(idx);
      scene.add(new THREE.Mesh(g, glassMat)); }
    await ctx.yield();

    // ================================================================== prints: feet, a hand, a mug ring, the cat's oval
    const PR = [];
    const qY = new THREE.Quaternion(), vS = new THREE.Vector3(), vP = new THREE.Vector3(), mI = new THREE.Matrix4();
    const addPrint = (type, x, y, z, dx, dz, len, wid, age, fade = -1, quat = null) => {
      const q = quat || new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-dx, -dz));
      PR.push({ m: new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(wid / 2, 1, len / 2)), type, age, fade, base: 0.33 });
    };
    const trail = (pts, per, a0, a1, side0 = 0) => {
      let n = side0;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[2] - a[2]), dx = (b[0] - a[0]) / len, dz = (b[2] - a[2]) / len, k = Math.max(1, Math.round(len / per));
        for (let j = 0; j < k; j++, n++) { const f = (j + 0.5) / k, s = n % 2 ? 1 : -1, g = (i + f) / (pts.length - 1);
          addPrint(n % 2, lerp(a[0], b[0], f) - dz * s * 0.8, lerp(a[1], b[1], f), lerp(a[2], b[2], f) + dx * s * 0.8, dx, dz, 2.1, 0.95, lerp(a0, a1, g)); }
      }
      return n;
    };
    let pn = trail([[-8, 0.07, -105], [1, 0.07, -102], [12, 0.07, -95], [22, 0.07, -76], [29.6, 0.07, -62.5]], 3.4, 0.6, 0.47);
    for (let i = 0; i < 17; i++, pn++) addPrint(pn % 2, steps1[i][0] + (pn % 2 ? 0.8 : -0.8), steps1[i][1] + 0.05, steps1[i][2], 0, 1, 2.1, 0.95, lerp(0.46, 0.36, i / 16));
    for (const [x, z] of [[29.6, -6.8], [27.2, -4.4]]) { addPrint(pn % 2, x, 24.16, z, -0.7, 0.7, 2.1, 0.95, 0.35); pn++; }
    for (let i = 0; i < 17; i++, pn++) addPrint(pn % 2, steps2[i][0], steps2[i][1] + 0.05, steps2[i][2] + (pn % 2 ? 0.8 : -0.8), -1, 0, 2.1, 0.95, lerp(0.34, 0.24, i / 16));
    trail([[-24.5, 48.14, -4.5], [-28, 48.14, -12], [-28, 48.14, -54], [-15, 48.14, -60], [-12.4, 48.14, -80], [-12.4, 48.14, -107], [-5, 48.14, -113.5], [-2.4, 48.14, DOORZ + 0.6]], 3.4, 0.23, 0.05, pn);
    trail([[-22.2, 48.14, -79], [-21, 48.14, -89], [-22.3, 48.14, -98]], 3.2, 0.02, 0.1);
    if (look === 1) trail([[17, 0.07, -5], [9, 0.07, -30], [-10, 0.07, -52], [-16.5, 0.07, -58]], 3.4, 0.5, 0.42);
    if (look === 1 && density > 0.9) trail([[2, 0.07, -74], [-10, 0.07, -77], [-13, 0.07, -79.5]], 3.2, 0.3, 0.26);
    // someone went down to see to the boiler and came back up: prints across the cellar floor and up its stair, then
    // along the east side of the well (the settle) to the kitchen; and a hand on every rail on the way
    { const n0 = PR.length, fy = H.CELLAR + 0.07;
      trail([[-11.5, fy, -73.5], [-20.5, fy, -91], [-21.8, fy, -125], [-21.6, fy, -150], [-21.2, fy, -159.6]], 3.4, 0.2, 0.12);
      for (let i = n0; i < PR.length; i++) PR[i].base = BRICK - 0.02;
      for (let i = 0; i < 16; i++) { const c = CST(i); addPrint(i % 2, c[0], c[1] + 0.1, -160.8 + (i % 2 ? 0.8 : -0.8), 1, 0, 2.1, 0.95, lerp(0.12, 0.07, i / 15)); PR[PR.length - 1].base = 0.45; }
      trail([[21.6, 0.07, -160.6], [27.4, 0.07, -155.5], [28.6, 0.07, -142], [28.3, 0.07, -124], [20, 0.07, -112.5], [8, 0.07, -105.5], [1.5, 0.07, -103.6]], 3.4, 0.16, 0.3);
      const railPrint = (C, dir, nrm, sAlong, age, base = 0.52) => {
        const zl = new THREE.Vector3(...dir).normalize(), yl = new THREE.Vector3(...nrm).normalize(), xl = new THREE.Vector3().crossVectors(yl, zl);
        const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xl, yl, zl));
        addPrint(4, C[0] + zl.x * sAlong + yl.x * 0.325, C[1] + zl.y * sAlong + yl.y * 0.325, C[2] + zl.z * sAlong + yl.z * 0.325, 0, 1, 1.9, 0.88, age, -1, q); PR[PR.length - 1].base = base;
      };
      [-17, -8.5, 0, 9, 17].forEach((sv, i) => railPrint([0.2, -4.75, -158.25], [SC, SS, 0], [-SS, SC, 0], sv, 0.1 - i * 0.012));
      [-150, -141, -131, -122].forEach((z, i) => railPrint([24, 6.47, z], [0, 0, 1], [0, 1, 0], 0, 0.16 + i * 0.03));
      const c1 = Math.cos(A1), s1 = Math.sin(A1), c2 = Math.cos(A2), s2 = Math.sin(A2);
      [-21, -12.5, -4, 5, 14, 22.5].forEach((sv, i) => railPrint([26.35, 19.4, -34.2], [0, s1, c1], [0, c1, -s1], sv, 0.4 - i * 0.02));
      [-19, -9, 2, 12, 21].forEach((sv, i) => railPrint([0.2, 43.4, -7.65], [-c2, s2, 0], [s2, c2, 0], sv, 0.3 - i * 0.02));
      [-19, -31, -45].forEach((z, i) => railPrint([-21.6, 54.2, z], [0, 0, -1], [0, 1, 0], 0, 0.2 - i * 0.02));
      [-15.5, -7].forEach((x, i) => railPrint([x, 54.2, -55.6], [1, 0, 0], [0, 1, 0], 0, 0.15 - i * 0.02));
    }
    { const n = new THREE.Vector3(-0.5, 0.78, -0.38).normalize(), f = new THREE.Vector3(0.45, 0.4, 0.3), zl = f.clone().addScaledVector(n, -f.dot(n)).normalize().negate(), xl = new THREE.Vector3().crossVectors(n, zl);
      const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xl, n, zl)), c = new THREE.Vector3(NEWEL[0], 11.4, NEWEL[2]).addScaledVector(n, 1.36);
      addPrint(2, c.x, c.y, c.z, 0, 1, 1.9, 1.6, 0.16, -1, q); PR[PR.length - 1].base = 0.46; }
    addPrint(3, TABLE[0] + 0.2, tableTop + 0.05, TABLE[2] + 1.6, 0, 1, 1.5, 1.5, 0.3); PR[PR.length - 1].base = 0.44;
    if (!cast.dog) { addPrint(4, CAT0[0], CATY + 0.04, CAT0[2], 0, 1, 4.0, 3.3, 0.0, 0.795); PR[PR.length - 1].base = 0.5; }
    const printMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      uniforms: { uTime: shared.uTime, uFront: shared.uFront, uShift: shared.uShift, uSun: shared.uSun, uDoor: shared.uDoor },
      vertexShader: /* glsl */`
attribute vec4 iP; varying vec2 vUv; varying vec4 vP; varying float vDim; uniform float uDoor;
void main() {
  vUv = uv; vP = iP;
  vec4 c = modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.);
  float reach = uDoor * 124., d = -c.z;
  vDim = (1. - smoothstep(reach - 3., reach + 1., d)) * (1. - smoothstep(-.5, 1.5, abs(c.x - 17.) - (5.5 + d * .13))) * step(c.y, 12.) * min(uDoor * 9., 1.);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.);
}`,
      fragmentShader: /* glsl */`
varying vec2 vUv; varying vec4 vP; varying float vDim;
${THERMAL_GLSL}
float sdEll(vec2 p, vec2 c, vec2 r) { vec2 q = (p - c) / r; return (length(q) - 1.) * min(r.x, r.y); }
float sdSeg(vec2 p, vec2 a, vec2 b, float r) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0., 1.); return length(pa - ba * h) - r; }
float smin(float a, float b, float k) { float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
void main() {
  vec2 p = vUv * 2. - 1.; float ty = vP.x, d;
  if (ty < 1.5) {
    p.x *= ty < .5 ? 1. : -1.;
    d = sdEll(p, vec2(.05, .22), vec2(.46, .36)); d = smin(d, sdEll(p, vec2(0., -.58), vec2(.33, .3)), .25); d = smin(d, sdEll(p, vec2(.12, -.2), vec2(.26, .4)), .2);
    d = min(d, length(p - vec2(-.3, .78)) - .15); d = min(d, length(p - vec2(-.02, .84)) - .11); d = min(d, length(p - vec2(.2, .8)) - .1);
    d = min(d, length(p - vec2(.38, .7)) - .09); d = min(d, length(p - vec2(.52, .56)) - .08);
  } else if (ty < 2.5) {
    d = sdEll(p, vec2(0., -.42), vec2(.46, .42));
    d = smin(d, sdSeg(p, vec2(-.32, -.1), vec2(-.42, .62), .1), .08); d = smin(d, sdSeg(p, vec2(-.1, -.05), vec2(-.12, .84), .105), .08);
    d = smin(d, sdSeg(p, vec2(.12, -.05), vec2(.14, .78), .1), .08); d = smin(d, sdSeg(p, vec2(.32, -.12), vec2(.4, .56), .09), .08);
    d = smin(d, sdSeg(p, vec2(.4, -.5), vec2(.8, -.1), .11), .1);
  } else if (ty < 3.5) d = abs(length(p) - .68) - .1;
  else d = sdEll(p, vec2(0.), vec2(.86, .86));
  float age = clamp(vP.y + uFront * .2 + (vP.w > 0. ? max(0., uFront - vP.w) * 2.2 : 0.) + vDim * .85, 0., 1.);
  float e = mix(.05, .3, age), m = 1. - smoothstep(-e * .5, e, d), w = 1. - age;
  float base = vP.z + uShift;
  float t = base + (.75 - base) * (w * .8 + .2 * w * w) * m;
  float a = m * smoothstep(0., .25, w);
  if (a < .004) discard;
  gl_FragColor = vec4(thRamp(t + thGrain()), a);
}` });
    { const g = new THREE.PlaneGeometry(2, 2); g.rotateX(-Math.PI / 2);
      const prints = new THREE.InstancedMesh(g, printMat, PR.length), ip = new Float32Array(PR.length * 4);
      PR.forEach((p, i) => { prints.setMatrixAt(i, p.m); ip.set([p.type, p.age, p.base, p.fade], i * 4); });
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(ip, 4)); prints.frustumCulled = false; prints.renderOrder = 1; scene.add(prints); }
    await ctx.yield();

    await ctx.yield();
    // ================================================================== air: plumes over what is hot, steam, cold pouring off the glass
    const VE = [];
    const veil = (type, c, w, h, yaw, arr, strength, lean = 0, flat = null) => VE.push({ type, c, w, h, yaw, arr, strength, lean, flat });
    // (on a rare visit the hall radiator's plume stands as soon as its first ribs are hot, so that it is there to lean)
    for (const r of A.radiators) veil(0, [r.top.x + r.normal.x * 0.7, r.top.y + 7.4, r.top.z + r.normal.z * 0.7], r.width + 4, 16, Math.atan2(r.normal.x, r.normal.z), r.id === 'window' ? 0.8 : r.id === 'hall' && rare ? r.arrive + 0.004 : r.id === 'rearE' ? r.arrive + 0.012 : r.full - 0.014, (r.id === 'hall' && rare) || r.id === 'rearE' ? 0.62 : 0.46, r.id === 'hall' ? 1 : 0);
    for (const yaw of [0, Math.PI / 2]) {
      veil(0, [BATH[0], 62.4, BATH[2] + (cast.shower ? -3 : 0)], yaw ? 14 : 8.5, 23, yaw, uTap + 0.02, 0.85);
      if (lit) veil(6, [RANGE[0], RANGE[1] + 8.4, RANGE[2] - 0.5], 5.2, 12.6, yaw + 0.5, -1, 0.9);       // steam with the fire's gold in its foot
      else veil(2, [RANGE[0], RANGE[1] + 7.4, RANGE[2]], 3.6, 9.5, yaw + 0.5, -1, 0.85);
      veil(0, [A.boilerTop.x, -5.4, A.boilerTop.z], 12, 6, yaw + H.BYAW, K.burner + 0.05, 0.5);
      veil(0, [H.CYL[0], -4.6, H.CYL[2]], 9, 5.6, yaw + 0.4, -1, 0.5);
      if (look === 2) veil(0, [STOVE[0], 15.2, STOVE[2]], 8, 13, yaw, -1, 0.7);
    }
    veil(0, [TANK[0], 67.2, CUP[3] + 0.5], 8.4, 11, 0, uTank + 0.03, 0.5); veil(4, [TANK[0] + 1.5, 65.5, CUP[3] + 0.9], 3, 9, 0.3, uTank + 0.035, 0.6);
    for (const pn of panes) {
      const [cx, cy, cz, w, h, nx, nz, ghost, half] = pn, top = cy + (half ? h : h / 2), sill = cy - (half ? 0 : h / 2);
      if (half === 2) { for (const yaw of [0, Math.PI / 2]) veil(1, [cx, 66.6, cz], 18, 13.6, yaw, -1, 0.5); continue; }
      if (ghost === 'stairA' || ghost === 'stairB') continue;
      const floor = sill > 48 ? 48 : sill > 24 ? (cx > 20 ? 24 : sill - 12) : 0;
      if (ghost === 'window') { veil(1, [cx, 48.2, cz + 10], w, 19, 0, -1, 0.8, 0, [0, -1]); continue; }
      veil(1, [cx, (sill + floor) / 2 + 0.6, cz + nz * 0.9], w + 1.5, sill - floor + 1.2, Math.atan2(nx, nz), -1, 0.7);
      if ((floor === 0 && cz > -100) || (floor === 48 && cx < -22)) veil(1, [cx, floor + 0.22, cz + nz * 9.5], w + 2, 18, 0, -1, 0.8, 0, [0, -nz]);
    }
    // the cellar's own air: two strands off the cylinder's cap, and round the well only a few thin wisps lifting a
    // short way off the gold line in the cut edge of the floor: never a sheet, and none where the camera climbs through
    veil(4, [H.CYL[0] - 1.2, -4.6, H.CYL[2] + 0.4], 3.2, 6.4, 0.2, -1, 0.6); veil(4, [H.CYL[0] + 1.4, -4.9, H.CYL[2] - 0.3], 2.6, 5.6, 1.2, -1, 0.5);
    veil(0, [H.CYL[0], -5.12, H.CYL[2] + 8.5], 13, 20, 0, -1, 0.5, 0, [0, 1]);            // the cylinder's warm air pooling under the joists, drifting our way
    for (const [x, z, w, h, yaw, da] of [[-19.5, -116.7, 4.2, 8.5, 0, 0.06], [-9, -116.7, 3.2, 6, 0, 0.065], [2.5, -116.7, 4.4, 9.5, 0, 0.07], [-23.3, -127, 3.6, 7, Math.PI / 2, 0.08], [-23.3, -137.5, 3, 5.5, Math.PI / 2, 0.088],
      [-23.3, -148, 4.4, 9, Math.PI / 2, 0.095], [-23.3, -157, 3.4, 6.5, Math.PI / 2, 0.1], [23.3, -151, 4, 8, Math.PI / 2, 0.1], [23.3, -158.5, 3.2, 5.5, Math.PI / 2, 0.105]]) veil(4, [x, -1.2 + h / 2, z], w, h, yaw, K.leave + da, 0.8);
    // black air spilling from the coal chute beside the lane, and creeping under the front door
    veil(1, [-33.1, -14.5, COALZ], 9, 14, Math.PI / 2, -1, 0.8); veil(1, [-25, H.CELLAR + 0.25, COALZ], 13, 20, 0, -1, 0.9, 0, [1, 0]);
    veil(1, [17, 0.2, -11], 6, 20, 0, -1, 0.7, 0, [0, 1]);
    // the rare visit: outside air standing in the open doorway and running down the hall above the wedge
    veil(3, [17, 8.6, -1.2], 10, 17, 0, -1, 0.9); veil(3, [17, 0.3, -34], 13, 66, 0, -1, 0.85, 0, [0, 1]); veil(3, [16, 0.3, -86], 16, 44, 0, -1, 0.7, 0, [0, 1]);
    const veilMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uTime: shared.uTime, uFront: shared.uFront, uShift: shared.uShift, uSun: shared.uSun, uLean: { value: 0 }, uDoorV: { value: 0 } },
      vertexShader: /* glsl */`
attribute vec4 iV; attribute vec3 iS; varying vec2 vUv; varying vec4 vV; varying vec3 vS;
void main() { vUv = uv; vV = iV; vS = iS; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`
varying vec2 vUv; varying vec4 vV; varying vec3 vS; uniform float uLean, uDoorV;
${THERMAL_GLSL}
// types: 0 a plume over something hot, 1 cold air falling or creeping, 2 steam, 3 the open door's air (rare),
// 4 one thin strand of warm air, 5 the cellar draught (cold, quick, in long streamers), 6 steam over a fire (gold at its foot)
void main() {
  vec2 uv = vUv; float ty = vV.x, s = vV.w;
  float door = step(2.5, ty) * step(ty, 3.5), wsp = step(3.5, ty) * step(ty, 4.5), drt = step(4.5, ty) * step(ty, 5.5), fst = step(5.5, ty);
  float cold = step(.5, ty) * step(ty, 1.5) + door + drt, steam = step(1.5, ty) * step(ty, 2.5) + fst;
  float dir = cold > .5 ? 1. : -1., sp = steam > .5 ? .5 : (drt > .5 ? .62 : (cold > .5 ? .1 : .2));
  // each sheet sways on its own slow noise, so no two neighbours ever move in step
  float sway = (thNoise(vec2(uv.y * 2.1 + s * 1.7, uTime * .32 + s * 2.3)) - .5) * .13 + (thNoise(vec2(uv.y * 5.3 - uTime * .45, s * 3.1)) - .5) * .05;
  uv.x += vS.z * uLean * uv.y * .9 + (1. - cold) * sway * uv.y;
  vec2 q = vec2(uv.x * vS.x * .34 + s, uv.y * vS.y * .13 + dir * uTime * sp + s * 3.);
  float n = thNoise(q) * .6 + thNoise(q * 2.3 + 7.) * .4;
  float streak = thNoise(vec2(uv.x * vS.x * mix(.95, .5, drt) + s * 2., uv.y * vS.y * mix(.045, .028, drt) + dir * uTime * sp * .6));
  // strands gather and thin out along the sheet: never an even comb
  streak *= .5 + 1.05 * thNoise(vec2(uv.x * vS.x * .23 + s * 5., uv.y * vS.y * .05 + dir * uTime * sp * .25));
  float ex = smoothstep(0., .3, uv.x) * (1. - smoothstep(.7, 1., uv.x));
  float ey = cold > .5 ? (1. - smoothstep(.82, 1., uv.y)) * smoothstep(0., .14, uv.y) * (.55 + .6 * (1. - uv.y)) : smoothstep(0., .1, uv.y) * (1. - smoothstep(.3, 1., uv.y));
  float gate = (vV.y < -.5 ? 1. : smoothstep(vV.y, vV.y + .04, uFront)) * mix(1., uDoorV, door);
  float wisp = cold > .5 || steam > .5 ? n * .65 + streak * .55 : n * .3 + streak * .9;      // hot air rises in strands, not in a cloud
  float a = gate * vV.z * ex * ey * smoothstep(.22, .8, wisp);
  if (drt > .5) {            // streamers a few metres long that slide the whole way to the burner
    float dn = thNoise(vec2(uv.x * vS.x * .4 + s, uv.y * vS.y * .075 + uTime * .62)) * .62 + thNoise(vec2(uv.x * vS.x * .95 + s * 3., uv.y * vS.y * .17 + uTime * 1.05)) * .38;
    a = gate * vV.z * ex * ey * smoothstep(.36, .66, dn);
  }
  if (wsp > .5) {            // a wandering centre line that widens and breaks up as it climbs
    float c = .5 + (thNoise(vec2(vUv.y * 2.6 + s * 4.1, uTime * .3 + s)) - .5) * .7 * vUv.y;
    float x = (vUv.x - c) / mix(.11, .24, vUv.y);
    float brk = smoothstep(.25, .7, thNoise(vec2(vUv.x * 2.5 + s * 9., vUv.y * 3.4 - uTime * .75 + s)));
    a = gate * vV.z * exp(-x * x) * smoothstep(0., .1, vUv.y) * (1. - smoothstep(.35, 1., vUv.y)) * (.35 + .65 * brk);
  }
  if (a < .004) discard;
  float t = cold > .5 ? .03 + .06 * n : (steam > .5 ? .68 + .06 * n + fst * .22 * (1. - vUv.y) * (1. - vUv.y) : (wsp > .5 ? .47 + uShift * .5 : .6 + .1 * n + uShift * .4));
  if (drt > .5) t = .012 + .03 * n;
  gl_FragColor = vec4(thRamp(t + thGrain()), a);
}` });
    { const g = new THREE.PlaneGeometry(1, 1), veils = new THREE.InstancedMesh(g, veilMat, VE.length), iv = new Float32Array(VE.length * 4), is = new Float32Array(VE.length * 3);
      const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3();
      VE.forEach((v, i) => {
        if (v.flat) { Y.set(v.flat[0], 0, v.flat[1]); Z.set(0, 1, 0); X.crossVectors(Y, Z); mI.makeBasis(X, Y, Z); qY.setFromRotationMatrix(mI); }
        else qY.setFromAxisAngle(vP.set(0, 1, 0), v.yaw);
        veils.setMatrixAt(i, mI.compose(vP.set(v.c[0], v.c[1], v.c[2]), qY, vS.set(v.w, v.h, 1)));
        iv.set([v.type, v.arr, v.strength, (i * 3.71) % 20], i * 4); is.set([v.w, v.h, v.lean], i * 3);
      });
      g.setAttribute('iV', new THREE.InstancedBufferAttribute(iv, 4)); g.setAttribute('iS', new THREE.InstancedBufferAttribute(is, 3));
      veils.frustumCulled = false; veils.renderOrder = 3; scene.add(veils); }
    await ctx.yield();

    // ================================================================== the warm animals: the cat (or the old dog) and the cellar mouse
    const POSE = {
      stand: { hip: [-1, 1.75, 0], mid: [0, 1.8, 0], chest: [1, 1.7, 0], neck: [1.35, 1.95, 0], head: [1.75, 2.2, 0], nose: [2.2, 2.08, 0], earL: [1.68, 2.74, -0.28], earR: [1.68, 2.74, 0.28],
        t1: [-1.5, 2.1, 0], t2: [-1.9, 2.6, 0], t3: [-2.1, 3.1, 0.1], t4: [-2.05, 3.55, 0.2], eFL: [1, 1, -0.32], pFL: [1.05, 0.16, -0.32], eFR: [1, 1, 0.32], pFR: [1.05, 0.16, 0.32],
        kHL: [-1.42, 0.66, -0.36], pHL: [-1.14, 0.16, -0.36], kHR: [-1.42, 0.66, 0.36], pHR: [-1.14, 0.16, 0.36] },
      stretch: { hip: [-1, 2.0, 0], mid: [0, 1.5, 0], chest: [0.95, 0.85, 0], neck: [1.3, 0.92, 0], head: [1.7, 1.08, 0], nose: [2.12, 0.92, 0], earL: [1.58, 1.56, -0.3], earR: [1.58, 1.56, 0.3],
        t1: [-1.45, 2.5, 0], t2: [-1.75, 3.0, 0], t3: [-1.85, 3.5, 0], t4: [-1.7, 3.95, 0], eFL: [1.7, 0.4, -0.3], pFL: [2.6, 0.16, -0.3], eFR: [1.7, 0.4, 0.3], pFR: [2.6, 0.16, 0.3],
        kHL: [-1.46, 0.72, -0.38], pHL: [-1.12, 0.16, -0.38], kHR: [-1.46, 0.72, 0.38], pHR: [-1.12, 0.16, 0.38] },
      curl: { hip: [-0.55, 0.55, 0.75], mid: [-0.95, 0.6, -0.1], chest: [-0.35, 0.55, -0.85], neck: [0.25, 0.5, -0.95], head: [0.72, 0.46, -0.5], nose: [0.66, 0.38, -0.05], earL: [1.0, 0.88, -0.72], earR: [1.08, 0.84, -0.3],
        t1: [-0.1, 0.3, 1.15], t2: [0.55, 0.26, 1.05], t3: [1.05, 0.26, 0.6], t4: [1.2, 0.26, 0.05], eFL: [0.1, 0.28, -0.45], pFL: [0.45, 0.2, -0.15], eFR: [-0.05, 0.28, -0.3], pFR: [0.3, 0.2, 0.05],
        kHL: [-0.25, 0.3, 0.5], pHL: [0.2, 0.2, 0.45], kHR: [-0.1, 0.3, 0.35], pHR: [0.3, 0.2, 0.3] },
      lie: { hip: [-1.1, 0.55, 0], mid: [0, 0.62, 0], chest: [1.0, 0.6, 0], neck: [1.4, 0.55, 0], head: [1.85, 0.46, -0.1], nose: [2.4, 0.36, -0.15], earL: [1.7, 0.4, -0.55], earR: [1.6, 0.7, -0.45],
        t1: [-1.6, 0.3, 0.2], t2: [-2.0, 0.25, 0.5], t3: [-2.3, 0.22, 0.8], t4: [-2.5, 0.2, 1.1], eFL: [1.0, 0.3, 0.7], pFL: [1.3, 0.2, 1.5], eFR: [0.85, 0.5, 0.6], pFR: [1.1, 0.45, 1.35],
        kHL: [-1.0, 0.3, 0.8], pHL: [-0.7, 0.2, 1.6], kHR: [-1.15, 0.5, 0.7], pHR: [-0.85, 0.45, 1.5] },
    };
    // one smooth warm body: the spine (nose to tail tip) is a curve through the joints, skinned with overlapping
    // ellipsoids whose shading normal is taken about the bone, so the joins do not show; legs the same; head, paws and
    // pointed ears on top. Bone white, never gold; ears and tail tip a cooler grey.
    const JN = Object.keys(POSE.stand), J = Object.fromEntries(JN.map((n) => [n, new THREE.Vector3()]));
    const BT = 0.725, SUB = 3;
    const SPINE = [['nose', 0.17, 0.7], ['head', 0.36, BT], ['neck', 0.33, BT], ['chest', 0.47, BT], ['mid', 0.43, BT], ['hip', 0.48, BT], ['t1', 0.2, 0.7], ['t2', 0.15, 0.66], ['t3', 0.13, 0.6], ['t4', 0.08, 0.5]];
    // legs taper evenly from a full shoulder or haunch to the paw (four overlapping pieces each); the hind leg bends
    // back at the hock
    const LEGS = [['chest', 'eFL', 'pFL', [0.32, 0.245, 0.185, 0.135]], ['chest', 'eFR', 'pFR', [0.32, 0.245, 0.185, 0.135]], ['hip', 'kHL', 'pHL', [0.42, 0.3, 0.19, 0.135]], ['hip', 'kHR', 'pHR', [0.42, 0.3, 0.19, 0.135]]];
    const NSP = (SPINE.length - 1) * SUB, NLEG = LEGS.length * 4, I_HEAD = NSP + NLEG, I_EAR = I_HEAD + 1, I_PAW = I_EAR + 2, I_RUMP = I_PAW + 4, I_MOUSE = I_RUMP + 2, NC = I_MOUSE + 6;
    const critMat = new THREE.ShaderMaterial({ uniforms: { uTime: shared.uTime, uFront: shared.uFront, uShift: shared.uShift, uSun: shared.uSun, uCat: { value: new THREE.Vector4(0, 0, 0, 1) } },
      vertexShader: /* glsl */`
attribute vec2 iT; varying vec2 vT; varying vec3 vN, vW, vA;
void main() {
  vT = iT;
  vec3 s2 = vec3(dot(instanceMatrix[0].xyz, instanceMatrix[0].xyz), dot(instanceMatrix[1].xyz, instanceMatrix[1].xyz), dot(instanceMatrix[2].xyz, instanceMatrix[2].xyz));
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * (normal / max(s2, vec3(1e-6))));
  vA = mat3(modelMatrix) * (instanceMatrix[0].xyz / sqrt(max(s2.x, 1e-6)));
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
      fragmentShader: /* glsl */`
varying vec2 vT; varying vec3 vN, vW, vA; uniform vec4 uCat;
${THERMAL_GLSL}
void main() {
  vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
  float small = step(1.5, vT.y), ax = vT.y - 2. * small;            // (the mouse's parts carry ax + 2)
  vec3 Nb = N - vA * dot(N, vA) * (.9 * ax);                         // about the bone: a tube, not a string of beads
  N = Nb / max(length(Nb), 1e-3);
  // the cat is one body: its dark limb comes mostly from where a point lies on the whole animal, so no part shows its join
  vec3 bc = vW - uCat.xyz; bc.y *= 1.5; vec3 Nc = bc / max(length(bc), 1e-3);
  vec3 Nm = mix(N, Nc, .72 * (1. - small) * (1. - smoothstep(uCat.w, uCat.w * 1.9, length(vW - uCat.xyz))));
  N = Nm / max(length(Nm), 1e-3);
  float ndv = abs(dot(N, V));
  float fur = (thNoise(vW.xz * 2.6 + vW.y * 2.) - .5) * .026 + (thNoise(vW.xy * 9. + vW.z * 7.) - .5) * .016;
  float t = vT.x - .19 * (1. - ndv) * (1. - ndv) + fur;
  gl_FragColor = vec4(thRamp(min(t, .742) + thGrain() * .6), 1.);
}` });
    const critGeo = new THREE.SphereGeometry(1, 14, 9), crit = new THREE.InstancedMesh(critGeo, critMat, NC), iT = new Float32Array(NC * 2);
    const setT = (i, t, ax) => { iT[i * 2] = cast.dog ? t - 0.02 : t; iT[i * 2 + 1] = ax; };
    for (let i = 0; i < NSP; i++) { const k = Math.floor(i / SUB), f = (i % SUB + 0.5) / SUB; setT(i, lerp(SPINE[k][2], SPINE[k + 1][2], f), 1); }
    for (let i = 0; i < NLEG; i++) setT(NSP + i, [BT, BT, 0.712, 0.69][i % 4], 1);
    setT(I_HEAD, BT, 0); setT(I_EAR, 0.52, 0.5); setT(I_EAR + 1, 0.52, 0.5); for (let i = 0; i < 4; i++) setT(I_PAW + i, 0.64, 0); setT(I_RUMP, BT, 0); setT(I_RUMP + 1, BT, 0);
    for (let i = 0; i < 6; i++) { iT[(I_MOUSE + i) * 2] = [0.735, 0.735, 0.62, 0.62, 0.6, 0.55][i]; iT[(I_MOUSE + i) * 2 + 1] = (i > 3 ? 1 : 0) + 2; }
    critGeo.setAttribute('iT', new THREE.InstancedBufferAttribute(iT, 2)); crit.frustumCulled = false; scene.add(crit);
    const cF = new THREE.Matrix4(), cQ = new THREE.Quaternion(), cA = new THREE.Vector3(), cB = new THREE.Vector3(), cD = new THREE.Vector3(), cM = new THREE.Matrix4(), cS = new THREE.Vector3(), X1 = new THREE.Vector3(1, 0, 0);
    const CSC = cast.dog ? 2.0 : 1.45, catP = new THREE.Vector3(CAT0[0], CATY + 1, CAT0[2]), mouseP = new THREE.Vector3().fromArray(A.mousePipe.from);
    cF.makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
    // an ellipsoid from a to b (world), radii r1 (up-ish) and r2, lengthened by pad so neighbours overlap
    const part = (i, a, b, r1, r2, pad) => {
      cD.subVectors(b, a); const len = cD.length();
      if (len < 1e-4) { cQ.setFromRotationMatrix(cF); cS.set(r1 * 1.15, r1 * 0.9, r2); } else { cQ.setFromUnitVectors(X1, cD.multiplyScalar(1 / len)); cS.set(len / 2 + pad, r1, r2); }
      cM.compose(cA.addVectors(a, b).multiplyScalar(0.5), cQ, cS); crit.setMatrixAt(i, cM);
    };
    const wA = new THREE.Vector3(), wB = new THREE.Vector3(), SP = SPINE.map(() => new THREE.Vector3());
    const crom = (p0, p1, p2, p3, t, out) => { const t2 = t * t, t3 = t2 * t;
      return out.set(0.5 * (2 * p1.x + (p2.x - p0.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (3 * p1.x - p0.x - 3 * p2.x + p3.x) * t3),
        0.5 * (2 * p1.y + (p2.y - p0.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (3 * p1.y - p0.y - 3 * p2.y + p3.y) * t3),
        0.5 * (2 * p1.z + (p2.z - p0.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (3 * p1.z - p0.z - 3 * p2.z + p3.z) * t3)); };
    const uM0 = 0.082, uM1 = 0.118, WALK0 = 0.808, WALKMAX = Math.abs(CASE1 + 3 - CAT0[2]);
    const U_STRETCH = [0.762, 0.782], U_STAND = [0.803, 0.814];
    // everything animals() needs is made here, once: update() allocates nothing
    const NJ = JN.length, JV = JN.map((n) => J[n]), P_CURL = JN.map((n) => POSE.curl[n]), P_STR = JN.map((n) => POSE.stretch[n]), P_STAND = JN.map((n) => POSE.stand[n]), P_LIE = JN.map((n) => POSE.lie[n]);
    const GAIT = [[J.pFL, J.eFL, 0], [J.pHR, J.kHR, 0.4], [J.pFR, J.eFR, Math.PI], [J.pHL, J.kHL, Math.PI + 0.4]];
    const PAWS = [J.pFL, J.pFR, J.pHL, J.pHR], PAWSIGN = [1, 1, -0.8, -0.8], HEADS = [J.neck, J.head, J.nose, J.earL, J.earR], EARS = [J.earL, J.earR];
    const SPJ = SPINE.map((sp) => J[sp[0]]), LEGJ = LEGS.map((l) => [J[l[0]], J[l[1]], J[l[2]], l[3]]);
    const MP = A.mousePipe, mF = new THREE.Vector3(...MP.from), mT = new THREE.Vector3(...MP.to), mH = new THREE.Vector3(...MP.hole);
    const mD1 = mT.clone().sub(mF), L1 = mD1.length(), mD2 = mH.clone().sub(mT), L2 = mD2.length(); mD1.normalize(); mD2.normalize();
    function animals(time, u) {
      // --- cat: curled and breathing, then it unrolls, stretches with its forelegs out, stands and walks toward the window
      const a = cast.dog ? 0 : sstep(u, U_STRETCH[0], U_STRETCH[1]), b = cast.dog ? 0 : sstep(u, U_STAND[0], U_STAND[1]);
      const walk = cast.dog ? 0 : clamp((u - WALK0) * path.length * 0.95, 0, WALKMAX), wk = sstep(walk, 0, 0.6) * (1 - sstep(walk, WALKMAX - 0.6, WALKMAX));
      const lift = cast.dog ? sstep(u, 0.76, 0.79) * (1 - 0.6 * sstep(u, 0.83, 0.86)) : 0, breath = 1 + 0.05 * Math.sin(time * 1.9) * (1 - b);
      const tw = cast.dog ? Math.pow(Math.max(0, Math.sin(time * 0.8)), 5) * Math.sin(time * 15) * 0.16 + Math.pow(Math.max(0, Math.sin(time * 0.53 + 2)), 8) * Math.sin(time * 11) * 0.12 : 0;
      for (let i = 0; i < NJ; i++) {
        const v = JV[i];
        if (cast.dog) v.fromArray(P_LIE[i]);
        else { const c = P_CURL[i], s = P_STR[i], d = P_STAND[i]; v.set(lerp(lerp(c[0], s[0], a), d[0], b), lerp(lerp(c[1], s[1], a), d[1], b), lerp(lerp(c[2], s[2], a), d[2], b)); }
      }
      const ph = walk * 3.1, hold = a * (1 - b);
      if (wk > 0) for (let i = 0; i < 4; i++) {
        const gt = GAIT[i], s = Math.sin(ph + gt[2]), c = Math.max(0, Math.cos(ph + gt[2])); gt[0].x += s * 0.45 * wk; gt[0].y += c * 0.28 * wk; gt[1].x += s * (i & 1 ? 0.34 : 0.22) * wk; gt[1].y += c * (i & 1 ? 0.2 : 0.1) * wk; }
      J.hip.y += 0.12 * Math.sin(time * 1.1) * hold; J.chest.y -= 0.06 * Math.sin(time * 1.1) * hold; J.pFL.x += 0.1 * Math.sin(time * 2.3) * hold; J.pFR.x += 0.1 * Math.sin(time * 2.3 + 1.4) * hold;   // the stretch is alive: rump rocking, claws kneading
      J.t2.z += Math.sin(time * 1.3 + 0.5) * 0.14 * a; J.t3.z += Math.sin(time * 1.3) * 0.3 * a; J.t4.z += Math.sin(time * 1.3 - 0.6) * 0.5 * a; J.t4.x += 0.25 * a; J.t4.z += Math.sin(time * 0.9) * 0.08 * (1 - a);
      J.head.y += 0.06 * Math.sin(ph * 2) * wk; J.nose.y += 0.06 * Math.sin(ph * 2) * wk; J.mid.y += 0.04 * Math.sin(ph * 2 + 1) * wk;
      J.hip.y += 0.05 * Math.sin(ph * 2 + 0.6) * wk; J.chest.y += 0.05 * Math.sin(ph * 2 + 2.2) * wk;                 // shoulders and haunches roll as it walks
      J.earR.y += 0.05 * Math.sin(time * 7) * Math.max(0, Math.sin(time * 0.6)) * (1 - a);
      if (cast.dog) { for (let i = 0; i < 4; i++) { PAWS[i].x += tw * PAWSIGN[i]; PAWS[i].y += Math.abs(tw) * 0.4; }
        for (let i = 0; i < 5; i++) HEADS[i].y += lift * (i === 0 ? 0.35 : 0.85);
        J.t3.y += Math.abs(Math.sin(time * 6.5)) * 0.35 * lift; J.t4.y += Math.abs(Math.sin(time * 6.5)) * 0.6 * lift; }
      const baseY = cast.dog ? CATY : CATY - 0.5 * sstep(walk, 2.2, 3.4);
      const yw = cast.dog ? 0.3 : 0.5 * (1 - sstep(walk, 0.2, 2.4));
      cF.makeBasis(cA.set(-Math.sin(yw), 0, -Math.cos(yw)), cB.set(0, 1, 0), cD.set(Math.cos(yw), 0, -Math.sin(yw)));
      cF.setPosition(CAT0[0], baseY, CAT0[2] - walk);
      catP.set(CAT0[0], baseY + 1.6 + 1.4 * a, CAT0[2] - walk - 1.2 * a);
      for (let i = 0; i < NJ; i++) JV[i].multiplyScalar(CSC).applyMatrix4(cF);
      critMat.uniforms.uCat.value.set((J.hip.x + J.chest.x) * 0.5, (J.hip.y + J.chest.y) * 0.5 - 0.25 * CSC, (J.hip.z + J.chest.z) * 0.5, 1.5 * CSC);
      // spine
      for (let k = 0; k < SPINE.length; k++) SP[k].copy(SPJ[k]);
      let ii = 0;
      for (let k = 0; k < SPINE.length - 1; k++) {
        const p0 = SP[Math.max(0, k - 1)], p1 = SP[k], p2 = SP[k + 1], p3 = SP[Math.min(SPINE.length - 1, k + 2)];
        for (let j = 0; j < SUB; j++, ii++) {
          crom(p0, p1, p2, p3, j / SUB, wA); crom(p0, p1, p2, p3, (j + 1) / SUB, wB);
          const r = lerp(SPINE[k][1], SPINE[k + 1][1], (j + 0.5) / SUB) * CSC * (k >= 3 && k <= 4 ? breath : 1);
          part(ii, wA, wB, r, r * (k >= 2 && k <= 4 ? 0.9 : 1), wA.distanceTo(wB) * 0.95);
        }
      }
      for (let l = 0; l < 4; l++) {
        const lg = LEGJ[l], mid = lg[1], paw = lg[2], rr = lg[3];
        cB.copy(lg[0]); cB.y -= 0.12 * CSC;
        for (let j = 0; j < 4; j++) {                    // four overlapping pieces from shoulder to paw, bending at the elbow
          const f0 = j / 4, f1 = (j + 1) / 4, r = rr[j] * CSC;
          if (f0 < 0.5) wA.lerpVectors(cB, mid, f0 * 2); else wA.lerpVectors(mid, paw, f0 * 2 - 1);
          if (f1 <= 0.5) wB.lerpVectors(cB, mid, f1 * 2); else wB.lerpVectors(mid, paw, f1 * 2 - 1);
          part(ii++, wA, wB, r, r, wA.distanceTo(wB) * 0.7);
        }
      }
      part(I_HEAD, J.head, J.head, 0.41 * CSC, 0.43 * CSC, 0);
      for (let i = 0; i < 2; i++) { wA.lerpVectors(J.head, EARS[i], 0.45); wB.lerpVectors(J.head, EARS[i], 1.32); part(I_EAR + i, wA, wB, 0.17 * CSC, 0.07 * CSC, 0.02); }
      for (let i = 0; i < 4; i++) { wA.copy(PAWS[i]); wB.copy(PAWS[i]); wB.x -= Math.sin(yw) * 0.2 * CSC; wB.z -= Math.cos(yw) * 0.2 * CSC; part(I_PAW + i, wA, wB, 0.13 * CSC, 0.15 * CSC, 0.12 * CSC); }
      part(I_RUMP, J.hip, J.hip, 0.5 * CSC, 0.47 * CSC, 0); part(I_RUMP + 1, J.chest, J.chest, 0.45 * CSC, 0.42 * CSC, 0);
      // --- the mouse: waits on the cold return where it crosses the lane, runs it to the boiler and goes in under the brick plinth
      const m = sstep(u, uM0, uM1), bob = Math.abs(Math.sin(time * 14)) * 0.1 * (m > 0.01 && m < 0.99 ? 1 : 0.25);
      const d = m * (L1 + L2), idle = 1 - sstep(u, uM0 - 0.012, uM0), fidget = Math.sin(time * 0.9) * 1.8 * idle;
      if (d < L1) { mouseP.copy(mF).addScaledVector(mD1, d + fidget); mouseP.y += 0.62 + bob + Math.abs(Math.sin(time * 9)) * 0.05 * idle; cD.copy(mD1); if (idle > 0.5 && Math.cos(time * 0.9) < 0) cD.negate(); }
      else { mouseP.lerpVectors(mT, mH, (d - L1) / L2); mouseP.y += 0.62 + bob; cD.copy(mD2); }
      const g = m > 0.985 ? 0.001 : 1, sn = Math.sin(time * 5) * 0.5 + 0.5;
      cQ.setFromUnitVectors(X1, cD);
      crit.setMatrixAt(I_MOUSE, cM.compose(mouseP, cQ, cS.set(1.35 * g, 0.72 * g, 0.66 * g)));
      crit.setMatrixAt(I_MOUSE + 1, cM.compose(cA.copy(mouseP).addScaledVector(cD, 1.3).setY(mouseP.y - 0.05 + sn * 0.08 + cD.y * 1.3), cQ, cS.set(0.62 * g, 0.46 * g, 0.44 * g)));
      for (let e = 0; e < 2; e++) { const sg = e ? 1 : -1; crit.setMatrixAt(I_MOUSE + 2 + e, cM.compose(cA.copy(mouseP).addScaledVector(cD, 1.0).add(cB.set(-cD.z * 0.34 * sg, 0.5, cD.x * 0.34 * sg)), cQ, cS.set(0.1 * g, 0.3 * g, 0.26 * g))); }
      wA.copy(mouseP).addScaledVector(cD, -1.25); wA.y -= 0.3; wB.copy(mouseP).addScaledVector(cD, -2.5); wB.y -= 0.45 - Math.sin(time * 9) * 0.08;
      cB.copy(mouseP).addScaledVector(cD, -3.7); cB.y -= 0.5 - Math.sin(time * 9 + 1) * 0.16;
      if (g < 0.5) { crit.setMatrixAt(I_MOUSE + 4, cM.makeScale(0.001, 0.001, 0.001).setPosition(mouseP)); crit.setMatrixAt(I_MOUSE + 5, cM); }
      else { part(I_MOUSE + 4, wA, wB, 0.12, 0.12, 0.1); part(I_MOUSE + 5, wB, cB, 0.08, 0.08, 0.1); }
      crit.instanceMatrix.needsUpdate = true;
    }
    animals(0, 0);
    await ctx.yield();

    // ---- warm light from what the rooms themselves hold: the stove on the night visit, the tap's thread, the window
    if (look === 2) addEmitter(shared, [STOVE[0] - 0.6, 5, STOVE[2] - 3.4], null, { R: 12, I: 1.35, flick: true });
    if (!cast.shower) addEmitter(shared, [STREAM[0], 51.6, STREAM[2]], [STREAM[0], 53.6, STREAM[2]], { R: 3.4, I: 0.8 });
    addEmitter(shared, [H.WIN.x, 57, -161.4], [H.WIN.x, 67, -161.4], lit ? { R: 9, I: 1.25 } : { R: 15, I: 0.9 });
    if (lit) {            // and the halo round the arch itself: the reveal, the frame and the wall close above it
      const wx = H.WIN.x, zo = -162.9, ho = { R: 4.4, I: 1.0 };             // (behind the curtains: they stay pale cloth against it)
      addEmitter(shared, [wx - 7.6, 70.4, zo], [wx + 7.6, 70.4, zo], ho);
      for (const sx of [-1, 1]) addEmitter(shared, [wx + sx * 9.9, 56.5, zo], [wx + sx * 9.1, 65.5, zo], ho);
    }
    bakeEmitters(shared, detail, look === 2 ? 0.74 : 1);
    await ctx.yield();

    // ================================================================== the flight
    const growBase = look === 2 ? 2.3 : look === 1 ? 0.95 : 1.25;
    // beats (all keyed to u): 0.04 burner, 0.048-0.16 the sections pale in turn, 0.08-0.12 mouse, 0.082 the front leaves,
    // 0.10-0.13 the boiler's front, 0.14-0.18 its flank at 8 m, 0.40-0.47 kitchen, 0.45-0.55 hall radiator filling (rare:
    // 0.385-0.57 the front door stands open and the wedge slides the hall to the foot of the stair),
    // 0.28-0.385 the long radiator by the settle fills rib by rib, 0.535-0.64 the tree, 0.652-0.69 the tank in its cupboard,
    // 0.67-0.74 the landing line, 0.76-0.86 the cat, 0.85-0.9 the bath, 0.74-0.97 the window radiator
    const pace = (u) => {
      let p = 0.85;
      p = lerp(p, 1.6, sstep(u, 0.17, 0.22));
      p = lerp(p, 1.9, sstep(u, 0.36, 0.42));
      p = lerp(p, 1.45, sstep(u, 0.54, 0.59));
      p = lerp(p, 0.5, sstep(u, 0.665, 0.73));
      p = lerp(p, 1.0, sstep(u, 0.865, 0.915));
      return p;
    };
    const P = A.portal, V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const aimFront = V3(A.boiler.x, A.boiler.y + 1.2, A.boiler.z), aimFlank = V3(A.boilerTop.x - 5.4, -10.4, A.boilerTop.z - 2.6), aimB = V3(0, 0, 0);
    const pois = [
      { at: V3((A.boiler.x + H.CYL[0]) / 2 - 1, -14, (A.boiler.z + H.CYL[2]) / 2), from: 0.0, to: 0.095, weight: 0.5 },      // the pair, on the way in
      { at: () => mouseP, from: 0.068, to: 0.122, weight: 0.3 },
      { at: (time, u) => aimB.lerpVectors(aimFront, aimFlank, sstep(u, 0.125, 0.16)), from: 0.088, to: 0.19, weight: 0.85 },   // the boiler: its front, then round onto the flank
      { at: V3(H.LANE, -6, -113), from: 0.18, to: 0.235, weight: 0.4 },
      { at: V3(3, -7, -161), from: 0.215, to: 0.315, weight: 0.5 },                    // the cellar stair with its prints, the gold round the well, the rear radiators filling
      { at: V3(33.6, 10.5, -125), from: 0.292, to: 0.388, weight: 0.85 },            // rising through the well: the riser's head climbing the party wall, the long radiator filling under the picture, its pool on the wall
      { at: V3(BED[0] + 3, 53.5, BED[2]), from: 0.715, to: 0.775, weight: 0.3 },
      { at: V3(6, 41, 0), from: 0.51, to: 0.665, weight: 0.9 },
      { at: V3(-14, 46, -120), from: 0.645, to: 0.78, weight: 0.7 },
      { at: () => catP, from: 0.755, to: 0.872, weight: 0.5 },
      { at: V3(BATH[0], 58, BATH[2]), from: 0.772, to: 0.836, weight: 0.22 },              // the bath while it is still ahead; never the wall after it
      { at: V3(H.WIN.x, 53.5, -161), from: 0.862, to: 0.975, weight: 0.45 },             // the window radiator under the portal, the fern beside it
    ];
    if (rare) pois.push({ at: V3(17.5, 6, -4), from: 0.4, to: 0.45, weight: 0.75 }, { at: V3(16.5, 0, -52), from: 0.435, to: 0.56, weight: 0.8 });
    else pois.push({ at: look === 2 ? V3(STOVE[0], 5, STOVE[2]) : V3(RANGE[0] + 4, 7.5, RANGE[2] - 3), from: uKitchen - 0.06, to: uKitchen + 0.012, weight: look === 2 ? 0.42 : 0.6 },
      { at: V3(1.25, 3.6, RAD.hall.pos.z), from: 0.44, to: 0.535, weight: 0.7 },
      { at: V3(NEWEL[0], 11.5, NEWEL[2]), from: 0.5, to: 0.55, weight: 0.3 });
    return {
      scene, path, duration: DUR, pace,
      title: ['Still Warm', 'Still Warm: February Afternoon', 'Still Warm: The Night the Power Came Back'][look],
      camera: { fov: 60, near: 0.3, far: 520, lookAhead: 16, sway: 1.5, bank: 0.3 },
      pois,
      portal: { shape: 'arch', width: P.width, height: P.height, color: '#FFE9B2', glow: 0.35, halo: false, revealDistance: 150 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        hero.setProgress(u);
        hero.update(dt, time, camera, ctx.renderer);
        glassMat.uniforms.uGrow.value = growBase * (0.72 + 0.5 * u);
        plant.rotation.y = time * 0.13 + Math.sin(time * 0.45) * 0.25;
        const wl = sstep(u, uTap, uBath + 0.02), wy = 50.3 + 2.2 * wl + Math.sin(time * 1.7) * 0.02, k = Math.sqrt(Math.max(0.05, 1 - ((53 - wy) / 3.9) ** 2)) * 0.97;
        water.position.set(BATH[0], wy, BATH[2]); water.scale.set(2.75 * k, 1, 6.5 * k);
        const fl = 1 + 0.18 * Math.sin(time * 9.3) + 0.1 * Math.sin(time * 23);
        stream.scale.set(fl, STREAM[1] - wy, fl);
        // rare: the front door swings open on someone leaving, stands open while the cold wedge runs the hall, and shuts
        // (the leaf stands half open, pale against the black doorway; the wedge's head runs the hall floor toward us, 92 m
        // of it by u 0.475, so its front edge and the gold line it puts out are in the picture all the way)
        const open = rare ? sstep(u, 0.385, 0.412) * (1 - sstep(u, 0.545, 0.57)) : 0;
        door.rotation.y = -0.85 * open;
        doorMat.uniforms.uShift.value = shared.uShift.value + 0.36 * open;
        shared.uDoor.value = rare ? (92 * clamp((u - 0.4) / 0.075, 0, 1) + 12 * sstep(u, 0.475, 0.52)) / 124 * (1 - 0.7 * sstep(u, 0.6, 0.7)) : 0;
        veilMat.uniforms.uDoorV.value = open;
        veilMat.uniforms.uLean.value = rare ? sstep(u, 0.46, 0.5) * (1 - sstep(u, 0.56, 0.62)) : 0;
        shared.uStir.value = 3 * sstep(u, 0.84, 0.95);
        animals(time, u);
      },
      dispose() { hero.dispose(); },
    };
  },
};
