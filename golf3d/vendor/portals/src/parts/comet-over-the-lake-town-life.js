// comet-over-the-lake-town, part LIFE: the shrine in its cedars, the trees (kit flora), the small life (kit fauna
// and fx), the far peak. Every draw comes from a named stream handed in; every search has a most.
import * as THREE from 'three';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { Builder } from './comet-over-the-lake-town-town.js';
import { RING, SHRINE, GATE, ISLET, FIELD, RIM } from './comet-over-the-lake-town-land.js';
import { boulderGeometry } from './comet-over-the-lake-town-ride.js';

// ------------------------------------------------------------------ the shrine: a plain small hall, ONE gate, FIVE lanterns in its court (the footpaths' and the brook's lanterns are set here too, where the world asks)
export function buildShrine(material, rng, heightAt, more = [], rimAt = []) {
  const B = new Builder(), y = SHRINE.y, flames = [], timber = [0.3, 0.25, 0.19], shingle = [0.2, 0.25, 0.2], moss = [0.27, 0.31, 0.24];
  // the hall, raised on posts, its front toward the east (the route's side); a sweeping roof of bark shingles
  B.frame(SHRINE.x - 9, y, SHRINE.z, Math.PI / 2);
  for (const px of [-2.4, 0, 2.4]) for (const pz of [-1.9, 1.9]) B.pole(px, pz, 0, 1.0, 0.13, 9, timber, 6);
  B.box(-3.9, 0.95, -3.0, 3.9, 1.15, 4.3, 9, timber, 9, true);                                     // the floor and its front gallery
  B.box(-2.5, 1.15, -2.0, 2.5, 3.5, 2.0, 9, timber);
  B.poly([[-1.0, 1.2, 2.03], [1.0, 1.2, 2.03], [1.0, 3.0, 2.03], [-1.0, 3.0, 2.03]], 3, [0.75, 0.4, 0]);             // lattice doors, a faint warm light within
  B.box(-0.9, 0.3, 3.3, 0.9, 0.6, 4.1, 4, moss, 4, true);                                          // one stone to step up by
  for (const s of [1, -1]) {                                                                        // the roof: three strips a side, flattening to the eaves
    const zs = [0, 1.5, 3.2, 5.3], ys = [5.5, 4.4, 3.7, 3.3];     // deep eaves
    for (let i = 0; i < 3; i++) B.poly(s > 0 ? [[-4.5, ys[i + 1], zs[i + 1]], [4.5, ys[i + 1], zs[i + 1]], [4.5 - 0.25 * (2 - i), ys[i], zs[i]], [-4.5 + 0.25 * (2 - i), ys[i], zs[i]]]
      : [[4.5, ys[i + 1], -zs[i + 1]], [-4.5, ys[i + 1], -zs[i + 1]], [-4.5 + 0.25 * (2 - i), ys[i], -zs[i]], [4.5 - 0.25 * (2 - i), ys[i], -zs[i]]], 10, shingle);
    B.poly(s > 0 ? [[-4.5, 3.16, 5.3], [4.5, 3.16, 5.3], [4.5, 3.3, 5.3], [-4.5, 3.3, 5.3]] : [[4.5, 3.16, -5.3], [-4.5, 3.16, -5.3], [-4.5, 3.3, -5.3], [4.5, 3.3, -5.3]], 6, timber);
  }
  for (const sx of [1, -1]) B.poly([[sx * 2.5, 3.5, 2.0], [sx * 2.5, 3.5, -2.0], [sx * 2.5, 5.3, 0]], 9, timber);
  B.box(-4.2, 5.42, -0.16, 4.2, 5.7, 0.16, 9, [0.24, 0.2, 0.15]);
  for (const sx of [1, -1]) B.pole(sx * 3.3, 4.0, 1.15, 3.5, 0.1, 9, timber, 6);                     // the posts of the front eave
  B.skin(0, 3.2, 0.5, 6.8, 'hall');
  // ONE gate of two posts and two beams, weathered vermilion, no rope; it looks along the path to the hall
  B.frame(GATE.x, y, GATE.z, Math.PI / 2);
  for (const sx of [1, -1]) { B.pole(sx * 1.75, 0, 0, 4.3, 0.2, 12, [0, 0, 0], 8, 0.17); B.box(sx * 1.75 - 0.3, 0, -0.3, sx * 1.75 + 0.3, 0.3, 0.3, 4, moss); }
  B.box(-2.75, 4.3, -0.2, 2.75, 4.62, 0.2, 12, [0, 0, 0], 12, true); B.box(-2.9, 4.62, -0.24, 2.9, 4.74, 0.24, 6, timber, 6, true); B.box(-2.2, 3.45, -0.11, 2.2, 3.72, 0.11, 12, [0, 0, 0], 12, true);
  B.skin(0, 2.4, 0, 3.6, 'gate');
  // stepping stones from the gate to the hall (nine, uneven)
  B.frame(0, 0, 0, 0);
  for (let i = 0; i < 9; i++) { const x = SHRINE.x + 12.5 - i * 1.95 + rng.range(-0.3, 0.3), z = SHRINE.z + rng.range(-0.35, 0.35), r = rng.range(0.45, 0.7), a0 = rng.range(0, 1), p = [];
    for (let k = 0; k < 7; k++) { const a = a0 + (k / 7) * 6.2832; p.push([x + Math.cos(a) * r * (0.85 + 0.3 * ((k * 7) % 3) / 3), y + 0.07, z - Math.sin(a) * r]); } B.poly(p, 4, moss); }
  // FIVE mossy stone lanterns in one uneven row on the gate's south hand, 10.5 m south of the gate's line (so none stands within 6 m of a post and no two
  // frame the gate); every one carries a flame. The three nearest the route are the row's end group: close together, of unequal height, on a line 50 degrees
  // off the route's heading, so that they leave the eye's sight together
  const lx = [20.8, 19.7, 18.6, 12.5, 8], lz = [0, -0.92, -1.84, 0, 0], ls = [1, 1.24, 1.1, 1.05, 1.15];
  const lantern = (lxx, lyy, lzz, s, yaw, on) => {
    B.frame(lxx, lyy, lzz, yaw);
    B.box(-0.4 * s, 0, -0.4 * s, 0.4 * s, 0.25 * s, 0.4 * s, 10, moss); B.pole(0, 0, 0.25 * s, 1.05 * s, 0.15 * s, 10, moss, 6); B.box(-0.36 * s, 1.05 * s, -0.36 * s, 0.36 * s, 1.17 * s, 0.36 * s, 10, moss, 10, true);
    for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) B.box(cx * 0.27 * s - 0.04, 1.17 * s, cz * 0.27 * s - 0.04, cx * 0.27 * s + 0.04, 1.55 * s, cz * 0.27 * s + 0.04, 10, moss);
    if (on) { B.box(-0.21 * s, 1.19 * s, -0.21 * s, 0.21 * s, 1.53 * s, 0.21 * s, 11, [4.4, 2.4, 0.9], 11); const p = B.w([0, 1.36 * s, 0]); flames.push(p); }   // its lit window: the fire box fills the space between the four posts
    B.poly([[-0.5 * s, 1.55 * s, 0.5 * s], [0.5 * s, 1.55 * s, 0.5 * s], [0, 1.95 * s, 0]], 10, moss); B.poly([[0.5 * s, 1.55 * s, 0.5 * s], [0.5 * s, 1.55 * s, -0.5 * s], [0, 1.95 * s, 0]], 10, moss);
    B.poly([[0.5 * s, 1.55 * s, -0.5 * s], [-0.5 * s, 1.55 * s, -0.5 * s], [0, 1.95 * s, 0]], 10, moss); B.poly([[-0.5 * s, 1.55 * s, -0.5 * s], [-0.5 * s, 1.55 * s, 0.5 * s], [0, 1.95 * s, 0]], 10, moss);
    B.skin(0, 1, 0, 1.2, 'lantern');
  };
  const s5 = 1.15 + 0.2 * rng(); for (let i = 0; i < 5; i++) { const yaw = rng.range(-0.3, 0.3), jx = rng.range(-0.25, 0.25), jz = rng.range(-0.3, 0.3), far = i > 2 ? 1 : 0; lantern(SHRINE.x + lx[i] + jx * far, y, SHRINE.z + 10.5 + lz[i] + jz * far, s5 * ls[i], yaw, true); }
  let footpath = null;
  if (heightAt) {
    // the footpath from the lane's head up through the meadow: packed brown earth, worn and a little winding, lying on the slope (never a stair: no joints,
    // no kerbs, no bands across it). It ends at the court's edge, 14 m short of the gate and 6 m to one side of it. A few mossy stones lie beside it, and seven
    // standing lanterns are set unevenly down its west side, every one lit
    B.frame(0, 0, 0, 0);
    const NP = 40, PP = [], PC = [], PI = [], rsh = rng.fork('footpath');
    const along = (lane) => (f) => { const t = Math.min(lane.length - 1.001, Math.max(0, f * (lane.length - 1))), i = Math.floor(t), k = t - i, w = (1.1 * Math.sin(f * 8.5 + 0.7) + 0.45 * Math.sin(f * 21)) * Math.min(1, f * 6, (1 - f) * 6);
      return [lane[i][0] + (lane[i + 1][0] - lane[i][0]) * k + w, lane[i][1] + (lane[i + 1][1] - lane[i][1]) * k]; };
    const lay = (at) => { const i0 = PP.length / 3;
    for (let i = 0; i <= NP; i++) {
      const f = i / NP, c = at(f), w = 0.74 + 0.22 * Math.sin(f * 31 + 2) + 0.12 * Math.sin(f * 67);
      for (const [k, t] of [[-1, 0], [0, 1], [1, 0]]) { const x = c[0] + k * w, sh = 0.82 + 0.18 * rsh(); PP.push(x, heightAt(x, c[1]) + 0.07, c[1]); PC.push((0.3 + 0.2 * t) * sh, (0.215 + 0.12 * t) * sh, (0.13 + 0.07 * t) * sh); }
    }
    for (let i = 0; i < NP; i++) { const a = i0 + i * 3; PI.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); } };
    const at = along(FIELD.lane), at2 = along(RIM.lane); lay(at); lay(at2);          // the same earth from the top terrace up the rim to the ring
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(PP, 3)); pg.setAttribute('color', new THREE.Float32BufferAttribute(PC, 3)); pg.setIndex(PI); pg.computeVertexNormals();
    footpath = new THREE.Mesh(pg, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); footpath.name = 'footpath';
    [[0.12, 1.5, 0.42], [0.31, -1.7, 0.34], [0.45, 1.9, 0.5], [0.62, -1.4, 0.3], [0.86, 1.6, 0.38]].forEach(([f, off, r], i) => { const p = at(f), x = p[0] + off, z = p[1] + 0.4 * i - 0.8, g = heightAt(x, z); B.pole(x, z, g - 0.1, g + 0.22 + 0.1 * (i % 2), r, 10, moss, 6); });
    // THE LANTERN ROWS of the footpath and the rim's path (every one lit; seven to a row: three close at the row's foot standing square to the route, one
    // between, three close at its end standing on a line 50 degrees off the route's heading, so that the end group leaves the eye's sight together; the three
    // of a group are of unequal height). The footpath's stand on its west side; the rim's stand east of its path and never within 6.5 m of the route's line,
    // (its last group stands apart: see below). The lit ones the world asks for beside the brook follow.
    const trio = (bx, bz, hand, obl, s0, ph) => { for (let k = 0; k < 3; k++) { const x = bx + hand * (obl ? 1.1 : 1.5) * k, z = bz - (obl ? 0.92 * k : 0.3 * (k % 2)); lantern(x, heightAt(x, z) - 0.05, z, s0 * [1, 1.24, 1.1][k], 0.3 * Math.sin(k * 2.1 + ph), true); } };
    const pa = at(FIELD.lanterns[0]), pb = at(FIELD.lanterns[1]), pc = at(FIELD.lanterns[2]);
    trio(pa[0] - 6.2, pa[1], -1, false, 1.25, 0.4); lantern(pb[0] - 3.8, heightAt(pb[0] - 3.8, pb[1]) - 0.05, pb[1], 1.5, 0.2, true); trio(pc[0] - 2.4, pc[1], -1, true, 1.25, 1.3);   // (the footpath leaves the route's line at its foot: there the row stands 6.2 m west of it, so no lantern stands within 6 m of the line)
    const pr = at2(0.12), ps = at2(rimAt[0] ?? 0.5), rx = Math.max(pr[0] + 2.4, RING.x + 6.5), sx2 = Math.max(ps[0] + 2.4, RING.x + 6.5);
    trio(rx, pr[1], 1, false, 1.4, 2.2); lantern(sx2, heightAt(sx2, ps[1]) - 0.05, ps[1], 1.7, -0.2, true);
    // THE RIM'S LAST GROUP: where the rim's path is 19 m short of the ring's plane, three lit lanterns of unequal height on a line 50 degrees off the route's
    // heading, 4.8 m apart (3.7 m across the heading, 3.1 m along it): the first 1.5 m west of the path's middle (never within 6 m of the route's line), the
    // other two east of the path, the last of them 12.8 m short of the ring's plane, so none stands within 12 m of the ring's foot. From the last straight each
    // stands clear of the others, and the three leave the eye's sight together.
    let fe = 0; for (let f = 0; f <= 1; f += 0.002) if (at2(f)[1] >= RING.z + 19) fe = f;
    const pe = at2(fe), ex = Math.max(pe[0] - 1.5, RING.x + 6);
    for (let k = 0; k < 3; k++) { const x = ex + 3.7 * k, z = pe[1] - 3.1 * k; lantern(x, heightAt(x, z) - 0.05, z, 1.4 * [1, 1.24, 1.1][k], 0.3 * Math.sin(k * 2.1 + 0.7), true); }
    for (const [x, z, s, yaw] of more) lantern(x, heightAt(x, z) - 0.05, z, s, yaw, true);
    // low mossy stone markers beside both paths (nine along each, dealt unevenly; each under a metre high), set after every lantern stands: a marker dealt
    // within 1.2 m of a lantern's foot (inside its plinth, or touching it) stands across the path instead, at the same place along it
    B.frame(0, 0, 0, 0); const mk = rng.fork('markers');
    for (const [fn, side] of [[at, 1.35], [at2, -1.35]]) for (let i = 0; i < 9; i++) { const f = (i + 0.2 + 0.6 * mk()) / 9, h = mk.range(0.55, 0.95), r = mk.range(0.2, 0.3), p = fn(f), z = p[1];
      const x = flames.some((q) => Math.hypot(q[0] - p[0] - side, q[2] - z) < 1.2) ? p[0] - side : p[0] + side, g = heightAt(x, z); B.pole(x, z, g - 0.15, g + h, r, 10, moss, 5, r * 0.7); }
  }
  return { mesh: B.mesh(material, 'shrine'), flames, skins: B.skins, footpath };
}

// ------------------------------------------------------------------ the trees: where they stand
// cedars round the hall (left of the route only), five pines on the islet, woods on the headland and the valley's
// flanks, pruned pines in the gardens, a few wind-bent pines on the rim. Returns point lists for the kit's scatter.
export function plantTrees(G, path, rng, heightAt, gardens, dn, rimPts = [], streamOf, lanePines = []) {
  const sOf = streamOf || ((n) => rng.fork(n)), rC = sOf('cedars'), rI = sOf('isletpines'), rW = sOf('woods'), rG = sOf('gardenpines');   // each cast draws from a named stream of its own
  const P = (x, z, s, v, sink, rot) => ({ x, y: heightAt(x, z) - sink, z, s, rot, d: 0, u: 0, v });   // (every draw is taken before a test: the turn is drawn by the caller)
  const cedars = [], pines = [], woods = [], small = [], skins = [];
  for (let i = 0, n = 0; i < 2600 && n < 51; i++) {                              // 51 tall cedars, 30 to 38 m: behind and beside the hall, and on up the route's left hand
    const a = rC() * 6.2832, rr = Math.sqrt(rC()), s = rC.range(0.88, 1.12), v = rC.int(0, 2), rot = rC() * 6.283;
    const x = SHRINE.x - 22 + Math.cos(a) * rr * 46, z = SHRINE.z - 6 + Math.sin(a) * rr * 50;
    if ((x > SHRINE.x - 14 && z > SHRINE.z - 9) || cedars.some((c) => Math.hypot(c.x - x, c.z - z) < 5.6)) continue;   // the gate's side lies open to the route
    const near = path.nearestXZ(x, z).dist; if (near < 23) continue;
    cedars.push({ ...P(x, z, s, v, 0.4, rot), far: near > 56 }); skins.push({ x, y: heightAt(x, z) + 17 * s, z, r: 17 * s + 1, name: 'cedar', tall: 34 * s }); n++;
  }
  for (let i = 0, n = 0; i < 300 && n < 5; i++) {                                // five pines on the islet
    const a = rI() * 6.2832, rr = rI.range(1.5, 7), s = rI.range(0.62, 0.85), rot = rI() * 6.283, x = ISLET.x + Math.cos(a) * rr, z = ISLET.z + Math.sin(a) * rr;
    if (pines.some((c) => Math.hypot(c.x - x, c.z - z) < 3.4) || heightAt(x, z) < 1.2) continue;
    pines.push(P(x, z, s, n % 2, 0.2, rot)); skins.push({ x, y: heightAt(x, z) + 6, z, r: 8, name: 'isletpine' }); n++;
  }
  for (const [x, z, sg, turn] of rimPts) { pines.push({ ...P(x, z, sg, 1, 0.2, turn), rim: true }); skins.push({ x, y: heightAt(x, z) + 6, z, r: 8, name: 'rimpine' }); }
  const nW = Math.round(41 + 10 * dn);
  for (let i = 0, n = 0; i < nW * 14 && n < nW; i++) {                           // the woods: headland, flanks, the near walls
    const x = rW.range(-420, 520), z = rW.range(-700, -190), s = rW.range(0.8, 1.4), v = rW.int(0, 3), keep = rW(), rot = rW() * 6.283;
    const h = heightAt(x, z), d = G.inland(x, z), hd = G.headD(x, z), ax = Math.abs(x + 15);
    const on = hd < 56 ? 1 : (d > 6 && h > 1.5 && ((ax > 205 && ax < 520 && d < 420) || (d < 300 && ax >= 520))) ? 0.8 : 0;
    if (keep > on || path.nearestXZ(x, z).dist < 60) continue;
    woods.push(P(x, z, s, v, 0.3, rot)); n++;
  }
  for (const g of gardens.slice(0, 21)) {                                         // pruned pines in the gardens, 5 to 7 m (none close under the route's line)
    const rot = rG() * 6.283, sg = 0.34 + 0.12 * g[2], np = path.nearestXZ(g[0], g[1]);
    if (Math.hypot(Math.max(0, np.dist - 3.5), Math.max(0, np.y - heightAt(g[0], g[1]) - 16.5 * sg)) < 11) continue;
    small.push(P(g[0], g[1], sg, 0, 0.1, rot));
  }
  const rL = sOf('lanepines');                                                    // pruned pines behind the garden walls of the lane the route follows, 5 to 6.5 m, leaning over the walls
  for (const g of lanePines) { const rot = rL() * 6.283, sg = 0.3 + 0.1 * g[2]; small.push(P(g[0], g[1], sg, 0, 0.1, rot)); skins.push({ x: g[0], y: heightAt(g[0], g[1]) + 3, z: g[1], r: 3.6, name: 'lanepine' }); }
  return { cedars, pines, woods, small, skins };
}

// ------------------------------------------------------------------ the kit's trees and flowers, instanced
export async function growFlora(ctx, scene, trees, extra, rng) {
  const own = extra.stream ? (n) => extra.stream('flora:' + n) : (n) => rng.fork(n);   // each scatter and each form has a stream of its own, named by what it holds
  const wind = flora.makeWind({ direction: [0.6, 0.4], strength: 1.2, speed: 1.1 });
  const matOpts = { wind, backlight: 0.5, ambient: 2.3, leafAmbient: 2.1 };
  await flora.prepareLeafTexture(matOpts, ctx.yield);
  const mat = flora.windMaterial(matOpts), out = [];
  const add = (variants, points, o = {}) => { if (!points.length) return null; const s = flora.makeScatter({ rng: own('s:' + points.length + ':' + variants.length + ':' + Math.round(points[0].x ?? points[0][0] ?? 0)), material: mat, variants, points, tint: 0.12, hue: 0.03, sink: 0, tilt: 0.03, stretch: 0.12, ...o }); scene.add(s.object); out.push(s); return s; };
  const cedar = (h, d, slim = 0.86) => flora.coniferGeometry({ rng: own('cedar' + h + d), height: h, detail: d, slim, droop: 0.6, leaf: '#2c5c3c', leafLight: '#4e8654', leafDark: '#183626', bark: '#6a4a38', flex: 0.4 });
  const grove1 = add([cedar(34, 1), cedar(33, 1), cedar(35, 1)], trees.cedars.filter((c) => !c.far));
  const grove0 = add([cedar(34, 0), cedar(33, 0), cedar(35, 0)], trees.cedars.filter((c) => !c.far));          // the same trees, plainer: the world shows these from the lake
  add([cedar(34, 0), cedar(33, 0), cedar(35, 0)], trees.cedars.filter((c) => c.far));          // the grove's far side, plainer
  await ctx.yield();
  const pine = (h, d) => flora.pineGeometry({ rng: own('pine' + h + d), height: h, detail: d, leaf: '#2c5a34', bark: '#7a4a34', flex: 0.6 });
  add([pine(16, 1), pine(15, 1)], trees.pines.filter((t) => !t.rim), { tilt: 0.16 });
  // the rim's small wind-leaned trees are full-boughed conifers (a bare-trunked pine reads as a pole against the sky): full from the shore on, plainer from the lake
  const rimPts = trees.pines.filter((t) => t.rim).map((t) => ({ ...t, s: t.s * 0.75 }));
  const rim1 = add([cedar(24, 1), cedar(21, 1)], rimPts, { tilt: 0.16 }), rim0 = add([cedar(24, 0, 0.7), cedar(22, 0, 0.7)], rimPts, { tilt: 0.16 });
  const small = add([pine(15, 0)], trees.small, { tilt: 0.1 });
  await ctx.yield();
  const woodV = [cedar(22, 0, 0.7), cedar(26, 0, 0.74), cedar(24, 0, 0.68), cedar(19, 0, 0.7)];       // the woods' trees are broad and full to the ground (no bare poles on a skyline)
  add(woodV, trees.woods.concat(trees.near || []));
  const upper = add(woodV, trees.upper || []);
  const close = add([cedar(24, 1), cedar(21, 1), cedar(27, 1)], (trees.close || []).map((t) => ({ ...t, v: t.v % 3 })));   // the nearest of them, fuller
  await ctx.yield();
  // azaleas in flower (a muted rose, and white) by the houses; irises along the paddies' banks
  const az = (c) => flora.bushGeometry({ rng: own('az' + c), size: 1.5, detail: 0, flowers: 0.8, flowerColor: c, leaf: '#2f5a2c' });
  const azT = add([az('#c77a8e'), az('#efe9df'), az('#c77a8e')], extra.bushes.map((b, i) => ({ x: b[0], y: extra.heightAt(b[0], b[1]) + 0.1, z: b[1], s: 0.7 + 0.5 * b[2], rot: i * 2.4, d: 0, u: 0, v: i % 3 })));
  // the azaleas of the headwall under the rim are their own set (the world shows it from the shrine's height on: a far level of detail)
  const head = add([az('#c77a8e'), az('#efe9df')], (extra.headBushes || []).map((b, i) => ({ x: b[0], y: extra.heightAt(b[0], b[1]) + 0.1, z: b[1], s: 0.7 + 0.5 * b[2], rot: i * 2.4, d: 0, u: 0, v: i % 2 })));
  const iris = flora.flowerGeometry({ rng: own('iris'), color: '#5a48a8', height: 0.75, width: 0.55, cards: 3 });
  const ir = add([iris], extra.irises.map((p, i) => ({ x: p[0], y: p[1] - 0.05, z: p[2], s: 0.75 + 0.35 * ((i * 37) % 10) / 10, rot: i * 1.7, d: 0, u: 0, v: 0 })));
  // ferns under the ride's trees and along its brook (their own set: the world shows it from the shore on)
  // five persimmon trees by the fields: a small round-headed tree hung with orange fruit
  const per = extra.persimmons || [];
  const perT = add([flora.oakGeometry({ rng: own('persimmon'), height: 6.5, detail: 0, leaf: '#4a6a2c', leafLight: '#7a8a3a', leafDark: '#2c4420' })], per.map((b, i) => ({ x: b[0], y: extra.heightAt(b[0], b[1]) - 0.1, z: b[1], s: b[2], rot: i * 2.3, d: 0, u: 0, v: 0 })));
  const perF = add([flora.bushGeometry({ rng: own('persimmonfruit'), size: 3.2, detail: 0, flowers: 0.9, flowerColor: '#ff8418', leaf: '#3a5a24' })], per.map((b, i) => ({ x: b[0], y: extra.heightAt(b[0], b[1]) + 2.8 * b[2], z: b[1], s: b[2] * 0.9, rot: i * 1.9, d: 0, u: 0, v: 0 })));
  const fern = flora.fernGeometry({ rng: own('fern'), size: 1.4, detail: 0, leaf: '#3f8040', leafLight: '#6aa85a' });
  const ferns = add([fern], (extra.ferns || []).map((b, i) => ({ x: b[0], y: extra.heightAt(b[0], b[1]) + 0.05, z: b[1], s: 0.8 + 0.7 * b[2], rot: i * 2.1, d: 0, u: 0, v: 0 })));
  return { wind, mat, sets: out, head, upper, close, ferns, grove1, grove0, rim1, rim0, dress: [small, azT, ir, perT, perF].filter(Boolean).map((q) => q.object), update(dt, time, camera) { for (const s of out) s.update(dt, time, camera); } };
}

// ------------------------------------------------------------------ the far high peak with late snow, its top in the last rose light
export function makePeak(fog, deep) {
  const N = 40, R = 9, P = [], C = [], I = [], H = 1180, RB = 1500, cx = 2500, cz = 300;
  const rock = new THREE.Color('#2e3852'), snow = new THREE.Color(deep ? '#8f9ccc' : '#b9bfe0'), rose = new THREE.Color(deep ? '#c98a98' : '#f2a49a'), c = new THREE.Color();
  for (let j = 0; j <= R; j++) for (let i = 0; i <= N; i++) {
    const a = (i / N) * 6.2832, t = j / R, rib = 1 + 0.16 * Math.sin(a * 5 + 1.3) + 0.09 * Math.sin(a * 11 + 0.4) + 0.05 * Math.sin(a * 23), r = RB * Math.pow(1 - t, 1.25) * (0.6 + 0.4 * rib * (1 - t) + 0.4 * t);
    const y = H * (t * 0.82 + 0.18 * t * t) * (1 + 0.05 * Math.sin(a * 3 + 2) * (1 - t));
    P.push(cx + Math.cos(a) * r, y - 40, cz + Math.sin(a) * r);
    const sn = Math.min(1, Math.max(0, (t - 0.5 + 0.1 * Math.sin(a * 11)) / 0.14)), lit = Math.min(1, Math.max(0, (t - 0.74) / 0.2));
    c.copy(rock).lerp(snow, sn * (0.75 + 0.25 * Math.sin(a * 23))).lerp(rose, lit * 0.85 * (0.6 + 0.4 * Math.cos(a - 3.6))); C.push(c.r, c.g, c.b);
  }
  for (let j = 0; j < R; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, d = a + N + 1, e = d + 1; I.push(a, d, b, b, d, e); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: true, side: THREE.DoubleSide })); m.name = 'peak';
  return m;
}

// ------------------------------------------------------------------ the small life (bounded, on the clock)
export async function makeLife(ctx, scene, path, o, rng) {
  const own = o.stream ? (n) => o.stream('life:' + n) : (n) => rng.fork(n);   // each cast has a stream of its own, by name
  const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
  const light = F.lightFrom(scene), fauna = F.makeFauna(scene, { light }), detail = o.detail;
  // lamps and flames: soft warm halos
  // (a lamp post's halo is four metres wide; a stone lantern's is small, no wider than twice the lantern, so that the lantern is seen as a thing with its window lit)
  if (o.lamps.length) set.add(fx.makeGlows({ rng: own('glows'), time, positions: o.lamps, color: '#ffb468', size: 4.0, intensity: 2.1 * o.lampGain, flicker: 0.14, halo: 1, core: 1.0, fogAmount: 0.5 }));
  if (o.flames.length) set.add(fx.makeGlows({ rng: own('lanternglows'), time, positions: o.flames, color: '#ffb468', size: 1.7, intensity: 1.5 * o.lampGain, flicker: 0.14, halo: 1, core: 0.8, fogAmount: 0.5 }));
  // smoke rising in the light air from five chimneys, or three (a medium)
  const nS = o.smokes.length >= 5 ? 5 : o.smokes.length >= 3 ? 3 : Math.min(1, o.smokes.length);   // an odd number of chimneys smoke
  for (const p of o.smokes.slice(0, nS)) set.add(fx.makeSmokeColumn({ rng: own('smoke' + p[0]), time, position: p, height: 26, radius: [0.25, 1.7], size: [0.9, 4.4], count: Math.round(60 * detail), color: '#b0b2c4', colorTop: '#c8cade',
    shadowColor: '#70748c', ambient: '#565a72', opacity: 0.17, rate: 0.05, wind: [0.45, 0, 0.18], bend: 0.3, sunDir: o.glowDir, sunColor: '#ffc090' }));
  // fireflies low over the banks, the brook, the leat and the rim's ponds (1,700 for 1,000 in a firefly year)
  const nF = Math.round((o.rare ? 1700 : 1000) * detail), ff = [], fr = own('ffp');
  for (let i = 0; i < nF && o.tops.length; i++) { const t = o.tops[Math.floor(fr() * o.tops.length)], q = [t[0] + fr.range(-2.5, 2.5), t[1] + fr.range(0.3, 2.2), t[2] + fr.range(-2.5, 2.5)], np = path.nearestXZ(q[0], q[2]);
    if (Math.hypot(np.dist, np.y - q[1]) >= 4) ff.push(q); }                       // (none is seated within 4 m of the route's line)
  if (ff.length) fauna.add(F.makeFireflies({ rng: own('fireflies'), positions: ff, count: ff.length, color: '#d8f060', color2: '#a8e850', size: 0.32, blink: 0.35, nearFade: [2, 5] }));
  await ctx.yield();
  // moths round the quay's three lamps
  let moths = null;
  if (o.lamps.length >= 3) { moths = F.makeMoths({ rng: own('moths'), positions: o.lamps.slice(0, 3), count: Math.round(27 * detail), size: 1.8, jitter: 0.5, roam: [0.9, 0.6, 0.6, 0.4], light, keepClear: { path, dist: 2 } }); fauna.add(moths); }
  // a soft halo at each lit window (from a named stream of its own)
  if (o.windows && o.windows.length) set.add(fx.makeGlows({ rng: own('wglows'), time, positions: o.windows, color: '#ffb060', size: 2.6, intensity: 0.75 * o.lampGain, flicker: 0.04, halo: 1, core: 0.25, fogAmount: 0.5 }));
  // thin low mist: the world says where (bands lying on the water off the town's shore either hand of the lane's foot, in the far bays, between the avenue's trunks)
  (o.mists || []).forEach((mo, i) => set.add(fx.makeMist({ rng: own('mist' + i), time, color: '#a9b6d6', flatten: 0.25, ...mo })));
  return { time, set, fauna, moths, fireflies: ff.length,
    update(dt, t, camera, u) { time.value = t; set.update(dt, t, camera); fauna.update(dt, t, camera, u); } };
}

// ------------------------------------------------------------------ the forest on the crater's walls: thousands of plain far conifers
// One instanced mesh of six-sided cones (cedar and beech tones), dense on the walls, the headland and the valley's
// flanks, thin on the open slopes; none within 46 m of the route, none on the town, the shrine's shelf or the terraces.
export async function makeForest(G, path, rng, heightAt, count, yieldFn, rngAvenue = null) {
  // a far tree: two open four-sided cones, the upper one standing in the lower, so the outline steps like a conifer's (8 triangles)
  const ga = new THREE.ConeGeometry(1, 0.62, 4, 1, true).toNonIndexed(); ga.translate(0, 0.31, 0);
  const gb = new THREE.ConeGeometry(0.66, 0.62, 4, 1, true).toNonIndexed(); gb.rotateY(0.78); gb.translate(0, 0.69, 0);
  const geo = new THREE.BufferGeometry();
  for (const name of ['position', 'normal']) { const a = ga.attributes[name].array, b = gb.attributes[name].array, o = new Float32Array(a.length + b.length); o.set(a, 0); o.set(b, a.length); geo.setAttribute(name, new THREE.BufferAttribute(o, 3)); }
  // every treetop takes a rim of the horizon's glow: the form's own colour runs from dark at the foot to warm and light at the top
  const pa = geo.attributes.position, col = new Float32Array(pa.count * 3);
  for (let i = 0; i < pa.count; i++) { const yy = pa.getY(i), k = 0.7 + 0.7 * yy * yy; col[i * 3] = k * (1 + 0.2 * yy); col[i * 3 + 1] = k * (1 + 0.06 * yy); col[i * 3 + 2] = k * (1 - 0.1 * yy); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const mesh = new THREE.InstancedMesh(geo, mat, count), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  const cedar = new THREE.Color('#2a5c3a'), beech = new THREE.Color('#3f6e40'), skins = [], nearPts = [], far = new THREE.InstancedMesh(geo, mat, 520);
  let n = 0, nf = 0; const stand = [];                                // every tree's place and height, for the skylines of the still waters
  for (let i = 0; i < count * 9 && n < count; i++) {
    if (yieldFn && i % 400 === 399) await yieldFn();
    const x = rng.range(-760, 1250), z = rng.range(-1150, 420), keep = rng(), h = rng.range(15, 29), w = rng.range(0.2, 0.3), tone = rng(), lean = rng.range(-0.06, 0.06), bright = rng.range(0.8, 1.3), spin = rng() * 6.283;
    const y = heightAt(x, z); if (y < 1.2) continue;
    const d = G.inland(x, z), g = G.gentle(x), ax = Math.abs(x + 15), near = path.nearestXZ(x, z).dist;
    const wall = 1 - g, head = G.headD(x, z) < 58 ? 1 : 0, flank = (ax > 198 && d < 330) ? 1 : 0;
    const hw = (d > 332 && d < 434) || (d > 606 && d < 720);                                             // the steep wall under the terraces and the rim's shoulder are wooded
    const open = (d > 300 && (near > 62 || hw) && Math.hypot(x + 55, z + 620) > 52) ? (hw ? 0.6 : 0.16) : 0;   // thin clumps on the open upper slopes
    const dens = Math.max(wall, head, flank, open) * Math.min(1, Math.max(0.3, 1.7 - near / 650));
    if (keep > dens || near < (hw && d < 434 ? 28 : 46) || G.inTerr(x, z) > 0.02) continue;
    stand.push([x, z, h]);
    if (near < 90) skins.push({ x, y: y + h / 2, z, r: h / 2 + 1, name: 'tree' });
    // near the route a tree is one of the kit's conifers with real boughs (at most 170); far off it is a plain cone
    if (near < 120 && nearPts.length < 240) {
      const up = z < -500; nearPts.push({ x, y: y - 0.3, z, s: h / 23, rot: spin, d: 0, u: 0, v: Math.floor(tone * 3.99), up, near });
      if (up) {                                                // an upper tree has its plain far form too: the world shows that one from the lake, the kit's tree from the shore on
        e.set(lean, spin, lean * 0.7); q.setFromEuler(e); p.set(x, y - 0.5, z); s.set(h * w, h, h * w); m.compose(p, q, s); far.setMatrixAt(nf, m);
        c.copy(cedar).lerp(beech, tone > 0.72 ? 0.8 : tone * 0.25).multiplyScalar(bright); far.setColorAt(nf, c); nf++; }
      continue;
    }
    e.set(lean, spin, lean * 0.7); q.setFromEuler(e); p.set(x, y - 0.5, z); s.set(h * w, h, h * w); m.compose(p, q, s); mesh.setMatrixAt(n, m);
    c.copy(cedar).lerp(beech, tone > 0.72 ? 0.8 : tone * 0.25).multiplyScalar(bright); mesh.setColorAt(n, c);
    n++;
  }
  // the steep wall under the terraces is thick wood, and the ride we climb through it toward the comet is an avenue
  // (every draw before the tests; a bounded search; each has its kit form near and its plain form from the lake)
  const ra = rngAvenue || rng;                                    // (the avenue's trees are dealt from a stream of their own, so the forest's count does not re-deal them)
  for (let i = 0; i < 900 && nearPts.length < 500; i++) {         // (an avenue: close on both hands, 19 m and more from the line, thinner farther off)
    if (yieldFn && i % 300 === 299) await yieldFn();
    const x = ra.range(-150, 160), z = ra.range(-778, -596), h = ra.range(16, 29), w = ra.range(0.2, 0.3), tone = ra(), lean = ra.range(-0.06, 0.06), bright = ra.range(0.8, 1.3), spin = ra() * 6.283, keep = ra();
    const y = heightAt(x, z), near = path.nearestXZ(x, z).dist;
    if (y < 57.5 || y > 120.5 || near < 19 || (near > 66 && keep > 0.4) || G.inTerr(x, z) > 0.02 || Math.hypot(x + 55, z + 620) < 42) continue;
    stand.push([x, z, h]);
    if (near < 90) skins.push({ x, y: y + h / 2, z, r: h / 2 + 1, name: 'tree' });
    nearPts.push({ x, y: y - 0.3, z, s: h / 23, rot: spin, d: 0, u: 0, v: Math.floor(tone * 3.99), up: true, near });
    e.set(lean, spin, lean * 0.7); q.setFromEuler(e); p.set(x, y - 0.5, z); s.set(h * w, h, h * w); m.compose(p, q, s); far.setMatrixAt(nf, m);
    c.copy(cedar).lerp(beech, tone > 0.72 ? 0.8 : tone * 0.25).multiplyScalar(bright); far.setColorAt(nf, c); nf++;
  }
  mesh.count = n; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.name = 'forest'; mesh.frustumCulled = false;
  far.count = nf; far.instanceMatrix.needsUpdate = true; if (far.instanceColor) far.instanceColor.needsUpdate = true; far.name = 'forest far forms'; far.frustumCulled = false;
  return { mesh, far, count: n, skins, nearPts, stand };
}

// grass tufts on the open rim and the upper slope beside the route (kit grass, a small carpet)
export async function growGrass(ctx, scene, path, heightAt, G, flo, rng) {
  // no grass in standing water or through a farmhouse: the rim's ponds, the three houses
  const wet = (x, z) => FIELD.houses.some((p) => Math.hypot(x - p[0], z - p[1]) < 7)
    || RIM.ponds.some(([px, pz, w, d]) => { const a = (x - px) / (w / 2), b = (z - pz) / d; return a * a + b * b < 1; });
  const grass = await flora.makeGrassAsync({ rng, path, uRange: [path.nearestXZ(FIELD.lane[0][0], FIELD.lane[0][1]).u, 1.0],   // from the foot of the shrine's lane (the town's upper edge) on
    radius: 38, count: Math.round(8000 * ((ctx.quality && ctx.quality.detail) || 1)), chunks: 3, fade: [60, 90], flowers: 0,
    heightAt, wind: flo.wind, map: flo.mat.map, root: '#3a4f24', tip: '#7f9a48', height: [0.8, 1.7], width: [1.2, 2.0],
    density: (x, z) => (G.inTerr(x, z) > 0.02 || Math.hypot(x + 55, z + 620) < 30 || wet(x, z) ? 0 : 1) }, ctx.yield);
  scene.add(grass.object);
  return grass;
}

// grey rocks with lichen, an odd number, lying about the rim close to the route (plain faceted stones; none at the ring's foot)
export function makeRocks(rng, heightAt, count = 23, near = []) {
  const geo = boulderGeometry();                                  // rounded, smooth, mossy on top (the ride's own form)
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }), count + near.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  let n = 0;
  for (let i = 0; i < count * 8 && n < count; i++) {
    const x = rng.range(-58, 62), z = rng.range(-992, -926), r = rng.range(0.6, 2.4), sq = rng.range(0.7, 1.3), yaw = rng() * 6.283, tip = rng.range(-0.3, 0.3), tone = rng.range(0.75, 1.2), warm = rng();
    if (Math.hypot(x, z + 960) < 9 || Math.abs(x) < 4) continue;
    e.set(tip, yaw, tip * 0.6); q.setFromEuler(e); p.set(x, heightAt(x, z) + r * 0.18, z); s.set(r * sq, r, r / sq); m.compose(p, q, s); mesh.setMatrixAt(n, m);
    c.set(warm < 0.3 ? '#8f8672' : '#857f74').multiplyScalar(tone); mesh.setColorAt(n, c); n++;
  }
  for (const [x, z, r] of near) { e.set(0.15, x * 1.3, 0.1); q.setFromEuler(e); p.set(x, heightAt(x, z) + r * 0.18, z); s.set(r * 1.15, r, r * 0.9); m.compose(p, q, s); mesh.setMatrixAt(n, m); c.set('#857f74'); mesh.setColorAt(n, c); n++; }   // those asked for by place
  mesh.count = n; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.name = 'rocks'; mesh.frustumCulled = false;
  return mesh;
}
