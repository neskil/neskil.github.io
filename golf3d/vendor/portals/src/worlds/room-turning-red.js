// THE ROOM TURNING RED: a bee-sized flight across a Fauve dining room while it is repainted around you.
// Everything is flat unlit tube colour from the style kit in ../parts/room-turning-red.js: shader-laid strokes on the
// fields (walls, cloth, floor, ceiling are ONE colour), real stroke quads near the course, ribbon contours, back-face
// hull contours with their pentimento halos, one stripe for a shadow. No lights, no fog, no bloom.
// Course: -Z down the table, a left-hand sweep round and over the goldfish tank (looking down on its bare-canvas water), then
// dead straight along -X to the window, past four canvases of this same room racked in echelon on the left, faces turned to us.
// The portal stands in the slot between the shutters, in the window's opening in the left wall, and the course ends there: the
// window fills the last pictures, its two leaves swung wide onto the painted garden, right back beside the opening.
// Far off, the repaint is laid with a big brush (bigCover in the style kit): a comb of blunt
// stroke ends on the walls. Far strokes drop out whole; a stroke under two pixels fades to the mean of its strokes and ground.
// The painting is never finished: on the last straight the wall behind the rack and a band round the window are still the old
// colour and the last lick of the front closes on the window frame as we come (uLate in the style kit, keyed to u), baskets open
// after it, the contour-only canvas is laid in dab by dab in the room's new colour, and the shutters are pushed wide.
// Variations (seed / ctx.vary): colourway (red over blue, blue over red, rose over viridian, lemon over cobalt), the hour
// in the window picture (day, dawn, golden, night), fruit (lemons, oranges, cherries), flowers (mimosa, anemones), the cat
// (watching, asleep, absent), the guide (bumblebee or cream butterfly), 3-5 goldfish or one large black-and-rose carp.
// Rare: the fish leave through the glass: as we come over the rim they are over the water inside it, ahead of us and 12 m and
// more to the left of the course, spread round its far side; they swim out across the rim, cross the course far ahead and draw away down the room on its
// right, each in its own lane, flank to the eye, with its halo and its reflection dab, and go out through the portal in the slot. They start to
// the side and never go slower than we do, so the eye is never near one.
// The garden comes in at the window: bare-canvas petals (2.6 to 6.6 m at this scale) drift in between the shutters and down the last
// straight, clear of the course; in the window picture six tick birds wheel above the blossom, the canvas path comes down the
// middle of the lawn under the way out, and each tree sheds three petals. Real cloth strokes are laid only where they are two
// pixels thick or more on screen (dabMaterial minPx); the far cloth beyond them is its field, thin strokes faded to their mean.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import {
  buildHero, makeStyle, PALETTE, EXPOSURE, TUBE, STYLE_GLSL, fieldMaterial, fieldPlane, flatMaterial, dabGeometry, dabMaterial,
  contourGeometry, contourMaterial, hullMaterial, makeVineTexture,
} from '../parts/room-turning-red.js';

const T = TUBE;
const HERO = new THREE.Vector3(-30, -8, -450);
const ROOM = { x0: -330, x1: 470, z0: -640, z1: 360, y0: -150, y1: 410 };
const TABLE = { x0: -110, x1: 110, z0: -320, z1: 78 };
const WIN = { x: -330, z: -472, w: 110, y0: -20, y1: 280 };
const R_X0 = ROOM.x0, R_Y0 = ROOM.y0;

// ---- solid forms: position + tube + hull (width, tube, seed); normals computed once, smooth ----
const newAcc = () => ({ pos: [], tube: [], hull: [], idx: [] });
const _v = new THREE.Vector3();
function addGeo(acc, pos, idx, tube, o = {}) {
  const base = acc.pos.length / 3, m = o.m, hw = o.hw ?? 1, ht = o.lineTube ?? T.black, sd = o.seed ?? 0.3;
  for (let i = 0; i < pos.length; i += 3) {
    _v.set(pos[i], pos[i + 1], pos[i + 2]); if (m) _v.applyMatrix4(m);
    acc.pos.push(_v.x, _v.y, _v.z); acc.tube.push(typeof tube === 'function' ? tube(pos[i], pos[i + 1], pos[i + 2]) : tube); acc.hull.push(hw, ht, sd);
  }
  for (let i = 0; i < idx.length; i++) acc.idx.push(idx[i] + base);
}
// surface of revolution, profile [[r, y], ...] bottom to top; wob keeps it from being machine-round
function lathe(acc, prof, seg, tube, o = {}) {
  const pos = [], idx = [], n = prof.length, w = o.wob ?? 0.03, ph = (o.seed ?? 0) * 40;
  for (let j = 0; j < n; j++) for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2, r = prof[j][0] * (1 + w * Math.sin(a * 2 + ph + j * 0.3) + w * 0.6 * Math.sin(a * 3 + ph * 1.7));
    pos.push(Math.sin(a) * r, prof[j][1], Math.cos(a) * r);
  }
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, b = a + 1, c = a + seg + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  addGeo(acc, pos, idx, tube, o);
}
// a lumpy blob (fruit, roll, cushion): a sphere pulled about by hand. r = [rx, ry, rz]
function blob(acc, r, tube, o = {}) {
  const prof = [], n = o.rings ?? 9, k = o.point ?? 1;
  for (let j = 0; j <= n; j++) { const t = j / n, a = t * Math.PI; prof.push([Math.pow(Math.sin(a), k) + 1e-3, -Math.cos(a)]); }
  const m = new THREE.Matrix4().makeScale(r[0], r[1], r[2]); if (o.m) m.premultiply(o.m);
  lathe(acc, prof, o.seg ?? 14, tube, { ...o, m, wob: o.wob ?? 0.05 });
}
function solidGeometry(acc) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.pos, 3)); g.setAttribute('tube', new THREE.Float32BufferAttribute(acc.tube, 1));
  g.setAttribute('hull', new THREE.Float32BufferAttribute(acc.hull, 3)); g.setIndex(acc.idx);
  // smooth normals by welding positions on a 2 cm grid (seams and poles included), so the hull never splits
  const P = acc.pos, I = acc.idx, nv = P.length / 3, N = new Float32Array(nv * 3), key = new Map(), rep = new Int32Array(nv);
  for (let i = 0; i < nv; i++) { const k = Math.round(P[i * 3] * 50) + ',' + Math.round(P[i * 3 + 1] * 50) + ',' + Math.round(P[i * 3 + 2] * 50); let r = key.get(k); if (r === undefined) { r = i; key.set(k, i); } rep[i] = r; }
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const q of [I[t], I[t + 1], I[t + 2]]) { const r = rep[q] * 3; N[r] += nx; N[r + 1] += ny; N[r + 2] += nz; }
  }
  for (let i = 0; i < nv; i++) { const r = rep[i] * 3, l = Math.hypot(N[r], N[r + 1], N[r + 2]) || 1; if (rep[i] === i) { N[r] /= l; N[r + 1] /= l; N[r + 2] /= l; } }
  for (let i = 0; i < nv; i++) { const r = rep[i] * 3; if (rep[i] !== i) { N[i * 3] = N[r]; N[i * 3 + 1] = N[r + 1]; N[i * 3 + 2] = N[r + 2]; } }
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}
// flat shapes (no hull): position + tube. A fan polygon from an outline of 3D points round its centroid.
const newFlat = () => ({ pos: [], tube: [], idx: [] });
function fan(acc, pts, tube, c = null) {            // c: fan from this point instead of the centroid (shapes with a notch)
  const base = acc.pos.length / 3, n = pts.length; let cx = 0, cy = 0, cz = 0;
  for (const p of pts) { cx += p[0]; cy += p[1]; cz += p[2]; }
  if (c) acc.pos.push(c[0], c[1], c[2]); else acc.pos.push(cx / n, cy / n, cz / n); acc.tube.push(tube);
  for (const p of pts) { acc.pos.push(p[0], p[1], p[2]); acc.tube.push(tube); }
  for (let i = 0; i < n; i++) acc.idx.push(base, base + 1 + i, base + 1 + ((i + 1) % n));
}
function quad(acc, a, b, c, d, tube) { const base = acc.pos.length / 3; for (const p of [a, b, c, d]) { acc.pos.push(p[0], p[1], p[2]); acc.tube.push(tube); } acc.idx.push(base, base + 1, base + 2, base, base + 2, base + 3); }
function flatGeometry(acc) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.pos, 3)); g.setAttribute('tube', new THREE.Float32BufferAttribute(acc.tube, 1));
  g.setIndex(acc.idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); return g;
}
// a hand-drawn closed outline in a plane: centre c, axes u, v (3-vectors), radii fn(angle)
function loop(c, u, v, n, rf) { const p = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, r = rf(a), x = Math.cos(a) * r[0], y = Math.sin(a) * r[1]; p.push([c[0] + u[0] * x + v[0] * y, c[1] + u[1] * x + v[1] * y, c[2] + u[2] * x + v[2] * y]); } return p; }
const seg3 = (a, b, n = 12) => { const p = []; for (let i = 0; i <= n; i++) p.push([lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n), lerp(a[2], b[2], i / n)]); return p; };
const mat = (x, y, z, ry = 0, rx = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(s, s, s));

export default {
  id: 'room-turning-red',
  name: 'The Room Turning Red',
  category: 'domestic',
  after: 'the Fauves',
  weirdness: 0.45,
  media: ['interior', 'tiny', 'air'],
  async build(ctx) {
    const scene = new THREE.Scene();
    let rng = ctx.rng.fork('room'); const roomRng = rng, vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    const rare = !!vary.rare;

    // ---------- variation: colourway, hour, cast ----------
    const WAYS = [
      { name: 'red over blue', old: [T.cobalt, T.viridian], next: [T.vermilion, T.vermilion], shOld: T.lemon, shNew: T.viridian, vine: T.cobalt, fruits: ['lemons', 'lemons', 'cherries'] },
      { name: 'blue over red', old: [T.vermilion, T.rose], next: [T.cobalt, T.cobalt], shOld: T.viridian, shNew: T.lemon, vine: T.vermilion, fruits: ['lemons', 'lemons', 'cherries'] },
      { name: 'rose over viridian', old: [T.viridian, T.cobalt], next: [T.rose, T.rose], shOld: T.lemon, shNew: T.viridian, vine: T.black, fruits: ['lemons', 'oranges', 'oranges'] },
      { name: 'lemon over cobalt', old: [T.cobalt, T.viridian], next: [T.lemon, T.lemon], shOld: T.rose, shNew: T.viridian, vine: T.vermilion, fruits: ['oranges', 'oranges', 'cherries'] },
    ];
    const hour = vary.hour === 'night' ? 'night' : vary.hour === 'dawn' ? 'dawn' : vary.hour === 'golden' ? 'golden' : 'day';
    let wayIdx = rng.pick([0, 0, 0, 1, 2, 3, 0, 1, 2, 3]);
    if (hour === 'night') wayIdx = 1;                       // at night the front paints the room cobalt
    const way = WAYS[wayIdx];
    const fruit = rng.pick(way.fruits), flowers = rng.pick(['mimosa', 'mimosa', 'anemones']);
    const catMood = rng.pick(['watching', 'watching', 'asleep', 'absent']), guide = rng.pick(['bee', 'bee', 'bee', 'butterfly']);
    const nFish = rng.pick([4, 4, 4, 3, 5]);
    // a random stream of its own for what was added later (the carp cast, the bold fruit), so no earlier choice of any seed moves
    const addRng = ctx.core.makeRng('room-additions:' + ctx.seed), carp = addRng() < 0.15 && !rare;

    const style = makeStyle(ctx, PALETTE), U = style.uniforms, tv = (i) => U.uTube.value[i];
    U.uResY = { value: 900 };
    U.uVineCol.value.copy(tv(way.vine));
    U.uSeed.value.set(rng.range(0.05, 0.45), rng.range(0.55, 0.95));
    const flatMat = flatMaterial(style), hullMat = hullMaterial(style), haloMat = hullMaterial(style, { halo: true, width: 1.7 });
    const lineMat = contourMaterial(style), smallHalo = hullMaterial(style, { halo: true, width: 0.32 });
    const addSolid = (acc, name, parent = scene, hm = haloMat) => {       // a form, its contour shell and its pentimento halo: three draws, one geometry
      const g = solidGeometry(acc), grp = new THREE.Group(); grp.name = name;
      for (const [m, ro] of [[flatMat, 0], [hullMat, 0], [hm, 0]]) { const me = new THREE.Mesh(g, m); me.frustumCulled = false; me.renderOrder = ro; grp.add(me); }
      parent.add(grp); return grp;
    };
    const addFlat = (acc, name, parent = scene) => { const me = new THREE.Mesh(flatGeometry(acc), flatMat); me.name = name; me.frustumCulled = false; parent.add(me); return me; };
    const addLines = (lines, name, parent = scene, m = lineMat) => { const me = new THREE.Mesh(contourGeometry(lines), m); me.name = name; me.frustumCulled = false; parent.add(me); return me; };

    // ---------- the course ----------
    const hx = HERO.x, hy = HERO.y, hz = HERO.z, PORTAL = new THREE.Vector3(WIN.x, 66, WIN.z);
    const path = makePath([
      [0, 6, 64], [0, 6, 30], [0, 6, -6], [4.5, 6, -52], [-3, 6, -104], [-7, 6.3, -150], [1, 6.6, -196], [7, 7, -240], [8, 8, -288],
      [16, 10.5, -330], [32, 15, -372], [41, 22, -410], [34, 33, -446], [13.5, 60, -470], [-8, 73, -476], [-30, 71.5, -472.6], [-70, 66, -472],
      [-130, 66, -472], [-200, 66, -472], [-270, 66, -472], [PORTAL.x, PORTAL.y, PORTAL.z],
    ]);
    const L = path.length;
    // speed by distance (m/s): 24 down the table, 15 off its end, 13 round the tank, 18.5 past the canvases (lingering), 22 to the window
    const speedAt = (d) => { const a = smoothstep(340, 392, d), b = smoothstep(420, 462, d), c = smoothstep(586, 645, d), e = smoothstep(770, 842, d); return lerp(lerp(lerp(lerp(24, 15, a), 13, b), 18.5, c), 22, e); };
    const NT = 256, tTab = new Float32Array(NT + 1); let tt = 0;
    for (let i = 1; i <= NT; i++) { tt += (L / NT) / speedAt(((i - 0.5) / NT) * L); tTab[i] = tt; }
    const duration = tt, avg = L / duration;
    const tOfU = (u) => { const x = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(x)); return lerp(tTab[i], tTab[i + 1], x - i); };
    const uOfT = (t) => { let lo = 0, hi = 1; for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; if (tOfU(m) < t) lo = m; else hi = m; } return (lo + hi) / 2; };
    const pace = (u) => speedAt(clamp(u, 0, 1) * L) / avg;
    // the front (metres along the front coordinate) by script time: 45 m/s past us, then faster up the room, ten seconds in all
    const frontAt = (t) => 118 + 45 * (t - 6) + 150 * Math.max(0, t - 8);
    await ctx.yield();

    // ---------- the fields: floor, ceiling, walls and cloth are one colour ----------
    const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Zn = new THREE.Vector3(0, 0, -1), V = (x, y, z) => new THREE.Vector3(x, y, z);
    const vine = await makeVineTexture(ctx, { rng: rng.fork('vine') });
    const growCloth = { value: 0 }, growWall = { value: 0 }, growSide = { value: 0 }, growLeft = { value: 0 }, growCanvas = { value: 0 };
    // the last lick: the wall behind the rack of canvases and a band of wall round the window are left for the end (see frontCoord)
    U.uLate.value.set(1, R_X0, WIN.z, R_Y0); U.uLateB.value.set(WIN.w / 2, WIN.y0, WIN.y1, 200);
    const vineOpt = (map, grow, hw = 1.7) => ({ tex: vine.texture, rect: vine.rect, len: vine.length, main: vine.main, map, grow, hw });
    const mergeFields = (parts) => {
      const acc = { position: [], fu: [], fv: [], idx: [] }; let base = 0;
      for (const g of parts) { for (const k of ['position', 'fu', 'fv']) { const a = g.getAttribute(k).array; for (let i = 0; i < a.length; i++) acc[k].push(a[i]); } const ia = g.index.array; for (let i = 0; i < ia.length; i++) acc.idx.push(ia[i] + base); base += g.getAttribute('position').count; g.dispose(); }
      const sg = new THREE.BufferGeometry(); for (const k of ['position', 'fu', 'fv']) sg.setAttribute(k, new THREE.Float32BufferAttribute(acc[k], 3)); sg.setIndex(acc.idx); sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); return sg;
    };
    const R = ROOM, cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2, cy = (R.y0 + R.y1) / 2, sxR = R.x1 - R.x0, szR = R.z1 - R.z0, syR = R.y1 - R.y0;
    const wz0 = WIN.z - WIN.w / 2, wz1 = WIN.z + WIN.w / 2;          // the window opening in the left wall
    const rect = (o, u, v, a0, a1, b0, b1) => fieldPlane(o.clone().addScaledVector(u, (a0 + a1) / 2).addScaledVector(v, (b0 + b1) / 2), u, v, a1 - a0, b1 - b0);
    const shell = mergeFields([
      fieldPlane(V(cx, R.y1, cz), X, Zn, sxR, szR), fieldPlane(V(cx, cy, R.z1), X, Y, sxR, syR),
      rect(V(R.x0, 0, 0), Zn, Y, -R.z1, 250, R.y0, R.y1),
      rect(V(R.x0, 0, 0), Zn, Y, -wz1, -wz0, R.y0, WIN.y0), rect(V(R.x0, 0, 0), Zn, Y, -wz1, -wz0, WIN.y1, R.y1),
      // the cloth's hanging sides (its top is a mesh of its own, with the arabesque)
      rect(V(TABLE.x0, 0, 0), Zn, Y, -TABLE.z1, -TABLE.z0, -90, 0), rect(V(TABLE.x1, 0, 0), Zn, Y, -TABLE.z1, -TABLE.z0, -90, 0),
      rect(V(0, 0, TABLE.z0), X, Y, TABLE.x0, TABLE.x1, -90, 0), rect(V(0, 0, TABLE.z1), X, Y, TABLE.x0, TABLE.x1, -90, 0),
    ]);
    const addField = (g, name, o) => { const me = new THREE.Mesh(g, fieldMaterial(style, o)); me.name = name; me.frustumCulled = false; scene.add(me); return me; };
    addField(shell, 'room-shell', {});
    const vx = [rng.range(-215, -170), rng.range(75, 120)];
    addField(rect(V(0, 0, R.z0), X, Y, R.x0, -60, R.y0, R.y1), 'far-wall-a', { vine: vineOpt(new THREE.Vector4(vx[0], R.y0 + 10, 0, 1), growWall, 2.2) });
    addField(rect(V(0, 0, R.z0), X, Y, -60, 240, R.y0, R.y1), 'far-wall-b', { vine: vineOpt(new THREE.Vector4(vx[1], R.y0 + 10, 0, 1), growWall, 2.2) });
    vx.push(rng.fork('vine3').range(338, 372));
    addField(rect(V(0, 0, R.z0), X, Y, 240, R.x1, R.y0, R.y1), 'far-wall-c', { vine: vineOpt(new THREE.Vector4(vx[2], R.y0 + 10, 0, 1), growWall, 2.2) });
    addField(fieldPlane(V(R.x1, cy, cz), Zn, Y, szR, syR), 'right-wall', { vine: vineOpt(new THREE.Vector4(-40, rng.range(40, 90), 1, 0), growSide, 2.4) });
    const growFloor = { value: 0 }, floorVine = { x: 150, v: rng.range(505, 530) }, lwv = [rng.range(345, 365), rng.range(578, 590)];
    addField(fieldPlane(V(cx, R.y0, cz), X, Zn, sxR, szR), 'floor', { vine: vineOpt(new THREE.Vector4(floorVine.x, floorVine.v, -1, 0), growFloor, 2.6) });
    addField(rect(V(R.x0, 0, 0), Zn, Y, 250, -wz1, R.y0, R.y1), 'left-wall-a', { vine: vineOpt(new THREE.Vector4(lwv[0], R.y0 + 10, 0, 1), growLeft, 2.0) });
    addField(rect(V(R.x0, 0, 0), Zn, Y, -wz0, -R.z0, R.y0, R.y1), 'left-wall-b', { vine: vineOpt(new THREE.Vector4(lwv[1], R.y0 + 10, 0, 1), growLeft, 2.0) });
    const clothVine = { u: rng.range(-40, -30), v: 62 };
    // one curl ends just left of the course some 190 m down the table: its basket opens 15 m from the lens at about ten seconds
    const forceTip = vine.tips.reduce((b, t) => (Math.abs(t[0] - 131) < Math.abs(b[0] - 131) ? t : b), vine.tips[0]);
    clothVine.v = clamp(217 - forceTip[0], 30, 119); clothVine.u = clamp(forceTip[1] - 20, -75, 45);
    clothVine.basket = [clothVine.u - forceTip[1], -clothVine.v - forceTip[0]];
    const cloth = addField(rect(V(0, 0, 0), X, Zn, TABLE.x0, TABLE.x1, -TABLE.z1, -TABLE.z0), 'cloth', { vine: vineOpt(new THREE.Vector4(clothVine.u, clothVine.v, 0, 1), growCloth, 1.6) });
    await ctx.yield();
    // the room's corners, the table's edge and the window's reveal: told only by a wobbling contour
    const roomLines = [], rl = (a, b, w = 2.4, n = 24) => roomLines.push({ pts: seg3(a, b, n), closed: false, width: w, tube: T.black, seed: rng() });
    for (const y of [R.y0 + 0.6, R.y1 - 0.6]) { rl([R.x0 + 1, y, R.z0 + 1], [R.x1 - 1, y, R.z0 + 1]); rl([R.x0 + 1, y, R.z0 + 1], [R.x0 + 1, y, R.z1]); rl([R.x1 - 1, y, R.z0 + 1], [R.x1 - 1, y, R.z1]); }
    rl([R.x0 + 1, R.y0, R.z0 + 1], [R.x0 + 1, R.y1, R.z0 + 1]); rl([R.x1 - 1, R.y0, R.z0 + 1], [R.x1 - 1, R.y1, R.z0 + 1]);
    const tb = [[TABLE.x0, TABLE.z1], [TABLE.x1, TABLE.z1], [TABLE.x1, TABLE.z0], [TABLE.x0, TABLE.z0]];
    for (let i = 0; i < 4; i++) { const a = tb[i], b = tb[(i + 1) % 4]; rl([a[0], 0.3, a[1]], [b[0], 0.3, b[1]], 1.1, 40); rl([a[0], 0.3, a[1]], [a[0] * 0.985, -90, a[1]], 1.2, 10); rl([a[0], -90, a[1]], [b[0], -90, b[1]], 1.1, 30); }
    roomLines.push({ pts: [[R.x0 + 0.8, WIN.y0, wz1], [R.x0 + 0.8, WIN.y1, wz1], [R.x0 + 0.8, WIN.y1, wz0], [R.x0 + 0.8, WIN.y0, wz0]].flatMap((p, i, a) => seg3(p, a[(i + 1) % 4], 10).slice(0, 10)), closed: true, width: 2.2, tube: T.black, seed: rng(), gap: 0.05 });
    addLines(roomLines, 'room-lines');
    await ctx.yield();

    // ---------- the table's things: two or three flat shapes each, a hull contour, one stripe for a shadow ----------
    const solid = newAcc(), flat = newFlat(), lines = [], dabs = [], spots = [[clothVine.basket[0], clothVine.basket[1], 10]];      // spots: [x, z, r] footprints on the cloth
    const pathXAtZ = (z) => { let lo = 0, hi = 0.62; for (let k = 0; k < 20; k++) { const m = (lo + hi) / 2; if (path.pointAt(m, _v).z > z) lo = m; else hi = m; } return path.pointAt(lo, _v).x; };
    const stripe = (x, z, rx, rz, y = 0.22) => dabs.push({ p: [x + rx + 3.7, y, z + rz * 0.12], a: [0.5, 0, rz * 1.0], b: [Math.max(2.1, rx * 0.24), 0, 0], tube: 7, seed: rng(), bend: -0.3 });
    // a leaf standing in space: outline about a spine from a to b, half-width w, in the plane holding `up`
    const leaf3 = (a, b, up, w, tube, lw = 0.7) => {
      const n = 9, out = [], rib = [], d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      for (let s = 0; s < 2; s++) for (let i = s ? n - 1 : 0; s ? i > 0 : i <= n; i += s ? -1 : 1) {
        const t = i / n, h = (s ? -1 : 1) * w * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.8) + w * 0.25 * Math.sin(t * Math.PI);
        out.push([a[0] + d[0] * t + up[0] * h, a[1] + d[1] * t + up[1] * h, a[2] + d[2] * t + up[2] * h]);
      }
      for (let i = 0; i <= 5; i++) { const t = 0.05 + 0.8 * i / 5, h = w * 0.25 * Math.sin(t * Math.PI); rib.push([a[0] + d[0] * t + up[0] * h, a[1] + d[1] * t + up[1] * h, a[2] + d[2] * t + up[2] * h]); }
      fan(flat, out, tube);
      lines.push({ pts: out, closed: true, width: lw, tube: T.black, seed: rng(), gap: 0.1 }); lines.push({ pts: rib, closed: false, width: lw * 0.7, tube: T.black, seed: rng() });
    };
    const fruitAt = (x, z, yaw, s = 1) => {
      if (fruit === 'lemons') {
        const m = mat(x, 5.1 * s, z, yaw, Math.PI / 2, 0, s), mm = new THREE.Matrix4().makeScale(5.2, 8.2, 5.1).premultiply(m), w3 = new THREE.Vector3();
        const two = (px, py, pz) => { w3.set(px, py, pz).applyMatrix4(mm); return (w3.x - x) * 0.72 - (w3.y - 5.1 * s) * 0.9 + (w3.z - z) * 0.28 > 3.1 * s ? T.rose : T.lemon; };
        blob(solid, [5.2, 8.2, 5.1], two, { m, point: 0.72, seed: rng(), hw: 1.15, rings: 12, seg: 20 });
        const e = [x + Math.sin(yaw) * 7.6 * s, 5.4 * s, z + Math.cos(yaw) * 7.6 * s], o = [Math.sin(yaw), Math.cos(yaw)];
        leaf3(e, [e[0] + o[0] * 7 * s + o[1] * 3 * s, e[1] + 4.5 * s, e[2] + o[1] * 7 * s - o[0] * 3 * s], [0.2, 1, 0.1], 2.5 * s, T.viridian);
        leaf3(e, [e[0] + o[0] * 5 * s - o[1] * 5.5 * s, e[1] + 1.2 * s, e[2] + o[1] * 5 * s + o[0] * 5.5 * s], [0.1, 1, -0.2], 2.2 * s, T.viridian);
        stripe(x, z, 5.4 * s * Math.abs(Math.cos(yaw)) + 8 * s * Math.abs(Math.sin(yaw)), 5.4 * s * Math.abs(Math.sin(yaw)) + 8 * s * Math.abs(Math.cos(yaw)));
        spots.push([x, z, 8 * s]);
      } else if (fruit === 'oranges') {
        blob(solid, [6.6 * s, 6.1 * s, 6.5 * s], T.vermilion, { m: mat(x, 6.1 * s, z, yaw), seed: rng(), hw: 1.15, rings: 10, seg: 16 });
        leaf3([x, 12 * s, z], [x + 6 * s * Math.sin(yaw), 16 * s, z + 6 * s * Math.cos(yaw)], [0, 1, 0], 2.3 * s, T.viridian);
        stripe(x, z, 6.6 * s, 6.5 * s); spots.push([x, z, 7 * s]);
      } else {                                   // spilled cherries: three to a stalk
        const top = [x + rng.range(-2, 2), 13 * s, z + rng.range(-2, 2)];
        for (let k = 0; k < 3; k++) {
          const a = yaw + k * 2.1, c = [x + Math.sin(a) * 5.2 * s, 3.4 * s, z + Math.cos(a) * 5.2 * s];
          blob(solid, [3.5 * s, 3.4 * s, 3.5 * s], k === 1 ? T.vermilion : T.rose, { m: mat(c[0], c[1], c[2], a), seed: rng(), hw: 1.0, rings: 8, seg: 12 });
          const mid = [lerp(c[0], top[0], 0.5) + Math.sin(a) * 1.5, lerp(6.8 * s, top[1], 0.6), lerp(c[2], top[2], 0.5) + Math.cos(a) * 1.5];
          lines.push({ pts: [...seg3([c[0], 6.6 * s, c[2]], mid, 4), ...seg3(mid, top, 4).slice(1)], closed: false, width: 0.8, tube: T.black, seed: rng() });
          stripe(c[0], c[2], 3.4 * s, 3.4 * s);
        }
        spots.push([x, z, 9 * s]);
      }
    };
    const OBJ = { dec: [-42, -150, 15], stand: [42, -235, 21], cup: [27, -70, 13] };
    stripe(clothVine.basket[0] + 1, clothVine.basket[1] - 4, 5.5, 7);
    const blocked = (x, z, r) => Math.hypot(x - clothVine.basket[0], z - clothVine.basket[1] - 16) < 24 + r || Object.values(OBJ).some((o) => Math.hypot(x - o[0], z - o[1]) < o[2] + r) || spots.some((o) => Math.hypot(x - o[0], z - o[1]) < o[2] + r);
    const nFruit = 9 + Math.round((density - 0.7) * 10 * detail);
    for (let i = 0; i < nFruit; i++) {
      const near = i < 9, z = near ? -14 - i * 33 + rng.range(-5, 5) : rng.range(-300, 40), side = near ? (i % 2 ? 1 : -1) : (rng.chance(0.5) ? 1 : -1);
      let x = pathXAtZ(z) + side * (near ? rng.range(24, 27.5) : rng.range(36, 92));
      const yaw = rng.range(0, Math.PI), s = near ? rng.range(0.86, 1.0) : rng.range(0.8, 1.05);
      let zz = z; for (let k = 0; k < 6 && blocked(x, zz, 9); k++) { zz += 13; x = pathXAtZ(zz) + side * (near ? 25.5 : Math.abs(x - pathXAtZ(z))); }
      if (blocked(x, zz, 9) || Math.abs(x) > 100) continue;
      fruitAt(x, zz, yaw, s);
      if (i % 3 === 2) await ctx.yield();
    }
    await ctx.yield();

    // the decanter: bare canvas inside a cobalt line, holding a lemon shape of wine that tilts
    const DEC = [[9.5, 0.3], [13.2, 1.5], [14.4, 8], [14, 17], [11.5, 26], [6.6, 33], [3.9, 40], [3.5, 52], [4.2, 58], [5.6, 61.5], [5.2, 62]];
    lathe(solid, DEC, 22, T.canvas, { m: mat(OBJ.dec[0], 0, OBJ.dec[1]), lineTube: T.cobalt, hw: 1.3, seed: rng(), wob: 0.02 });
    stripe(OBJ.dec[0], OBJ.dec[1], 14, 14); spots.push([OBJ.dec[0], OBJ.dec[1], 15]);
    { const gr = rng.fork('decanter-glass'); for (let k = 0; k < 15; k++) {              // glass is drawn: loose cobalt strokes on it, all round
      const a = (k / 15) * 6.283 * 2 + gr.range(-0.25, 0.25), y = k % 3 === 2 ? gr.range(36, 50) : gr.range(7, 21), r = (y > 33 ? 4.6 : 14.9), g = gr.range(0.9, 1.4) * (gr.chance(0.5) ? 1 : -1), hl = y > 33 ? 2.6 : gr.range(2.6, 4.2), hw = gr.range(0.55, 0.8);
      const c = [Math.sin(a) * r, Math.cos(a) * r], t = [Math.cos(a), -Math.sin(a)], cg = Math.cos(g), sg = Math.sin(g);
      dabs.push({ p: [OBJ.dec[0] + c[0], y, OBJ.dec[1] + c[1]], a: [t[0] * cg * hl, sg * hl, t[1] * cg * hl], b: [-t[0] * sg * hw, cg * hw, -t[1] * sg * hw], tube: T.cobalt, seed: gr() }); } }
    lines.push({ pts: loop([OBJ.dec[0], 61.8, OBJ.dec[1]], [1, 0, 0], [0, 0, 1], 20, () => [5.6, 5.6]), closed: true, width: 0.9, tube: T.cobalt, seed: rng(), gap: 0.12 });
    const wineTube = way.next[0] === T.lemon ? T.rose : T.lemon, wineSeg = 22, wineRows = [[13.5, 1.7], [14.75, 8], [14.4, 15]];
    const winePos = [], wineIdx = [];
    for (let j = 0; j < 4; j++) for (let i = 0; i <= wineSeg; i++) { const a = (i / wineSeg) * Math.PI * 2, r = wineRows[Math.min(j, 2)][0]; winePos.push(Math.sin(a) * r, wineRows[Math.min(j, 2)][1], Math.cos(a) * r); }
    for (let j = 0; j < 3; j++) for (let i = 0; i < wineSeg; i++) { const a = j * (wineSeg + 1) + i, b = a + 1, c = a + wineSeg + 1, d = c + 1; wineIdx.push(a, b, c, b, d, c); }
    const wc = winePos.length / 3; winePos.push(0, 22, 0); for (let i = 0; i < wineSeg; i++) wineIdx.push(wc, 3 * (wineSeg + 1) + i, 3 * (wineSeg + 1) + i + 1);
    const wineGeo = new THREE.BufferGeometry(); wineGeo.setAttribute('position', new THREE.Float32BufferAttribute(winePos, 3));
    wineGeo.setAttribute('tube', new THREE.Float32BufferAttribute(new Float32Array(winePos.length / 3).fill(wineTube), 1)); wineGeo.setIndex(wineIdx);
    const wine = new THREE.Mesh(wineGeo, flatMat); wine.name = 'wine'; wine.position.set(OBJ.dec[0], 0, OBJ.dec[1]); wine.frustumCulled = false; scene.add(wine);
    const wineLine = addLines([{ pts: loop([0, 0, 0], [1, 0, 0], [0, 0, 1], 24, () => [13.6, 13.6]), closed: true, width: 0.8, tube: T.cobalt, seed: rng(), gap: 0.2 }], 'wine-line');
    wineLine.position.set(OBJ.dec[0], 22, OBJ.dec[1]);
    // the sprig: mimosa (thirty lemon dots on thin black stems that nod) or three anemones
    const sprig = [], sx0 = OBJ.dec[0], sz0 = OBJ.dec[1];
    const nStem = flowers === 'mimosa' ? 6 : 3, flTube = way.next[0] === T.lemon ? T.rose : T.lemon;
    for (let k = 0; k < nStem; k++) {
      const a = rng.range(0, 6.28), lean = rng.range(5, 17), top = [sx0 + Math.sin(a) * lean, rng.range(84, 104), sz0 + Math.cos(a) * lean];
      const mid = [sx0 + Math.sin(a) * lean * 0.3, 76, sz0 + Math.cos(a) * lean * 0.3];
      lines.push({ pts: [...seg3([sx0, 56, sz0], mid, 4), ...seg3(mid, top, 5).slice(1)], closed: false, width: 0.75, tube: T.black, seed: rng() });
      if (flowers === 'mimosa') for (let j = 0; j < 5; j++) {
        const t = 0.35 + 0.65 * (j / 4), c = [lerp(mid[0], top[0], t) + rng.range(-2.6, 2.6), lerp(mid[1], top[1], t) + rng.range(-1, 1), lerp(mid[2], top[2], t) + rng.range(-2.6, 2.6)], r = rng.range(1.5, 2.2), q = rng.range(0, 3.14);
        for (const h of [0, Math.PI / 2]) sprig.push({ p: c, a: [Math.cos(q + h) * r, 0, Math.sin(q + h) * r], b: [0, r, 0], tube: flTube, seed: rng() });
      } else {
        const pt = [T.vermilion, T.rose, T.cobalt, T.canvas].filter((c) => c !== way.next[0])[k % 3], q = rng.range(0, 3.14);
        for (let j = 0; j < 6; j++) { const pa = (j / 6) * 6.283, r = 5.2; for (const h of [0, Math.PI / 2])
          sprig.push({ p: [top[0] + Math.cos(pa) * 3.4 * Math.cos(q + h), top[1] + Math.sin(pa) * 3.4, top[2] + Math.cos(pa) * 3.4 * Math.sin(q + h)], a: [Math.cos(pa) * r * 0.62 * Math.cos(q + h), Math.sin(pa) * r * 0.62, Math.cos(pa) * r * 0.62 * Math.sin(q + h)], b: [-Math.sin(pa) * 2.3 * Math.cos(q + h), Math.cos(pa) * 2.3, -Math.sin(pa) * 2.3 * Math.sin(q + h)], tube: pt, seed: rng() }); }
        for (const h of [0, Math.PI / 2]) sprig.push({ p: [top[0] + Math.sin(q + h) * 0.2, top[1], top[2] - Math.cos(q + h) * 0.2], a: [Math.cos(q + h) * 2, 0, Math.sin(q + h) * 2], b: [0, 2, 0], tube: T.black, seed: rng() });
      }
    }
    const sprigMesh = new THREE.Mesh(dabGeometry(sprig), dabMaterial(style, { nod: 0.012 })); sprigMesh.name = 'sprig'; sprigMesh.frustumCulled = false; scene.add(sprigMesh);
    await ctx.yield();

    // the coffee cup on its saucer, steaming three cream commas
    const steamCommas = [], steamMat = dabMaterial(style);
    {
      const [x, z] = OBJ.cup, cupTube = way.next[0] === T.rose || way.old[0] === T.rose ? T.lemon : T.rose;
      lathe(solid, [[6, 0.3], [12.5, 0.9], [13, 2], [6.5, 2.2]], 20, T.canvas, { m: mat(x, 0, z), hw: 1.0, seed: rng(), wob: 0.02 });
      lathe(solid, [[5.2, 2.2], [7.4, 6], [8.6, 12], [9.1, 18], [8.3, 18.1]], 20, cupTube, { m: mat(x, 0, z), hw: 1.25, seed: rng(), wob: 0.02 });
      fan(flat, loop([x, 17.2, z], [1, 0, 0], [0, 0, 1], 18, () => [8.4, 8.4]), T.black);
      lines.push({ pts: loop([x, 18.3, z], [1, 0, 0], [0, 0, 1], 22, () => [9.1, 9.1]), closed: true, width: 0.9, tube: T.black, seed: rng(), gap: 0.1 });
      lines.push({ pts: loop([x + 11.5, 10.5, z + 3], [0.95, 0, 0.3], [0, 1, 0], 14, () => [4.2, 5]).slice(9).concat(loop([x + 11.5, 10.5, z + 3], [0.95, 0, 0.3], [0, 1, 0], 14, () => [4.2, 5]).slice(0, 6)), closed: false, width: 1.5, tube: T.black, seed: rng() });
      stripe(x, z, 12.5, 12.5); spots.push([x, z, 13.5]);
      for (let k = 0; k < 3; k++) {
        const q = 0.5 + k * 1.1, com = [];
        for (const h of [0, Math.PI / 2]) com.push({ p: [0, 0, 0], a: [Math.cos(q + h) * 2.4, 10.4, Math.sin(q + h) * 2.4], b: [Math.cos(q + h) * 3.5, 0, Math.sin(q + h) * 3.5], tube: T.canvas, seed: 0.21 + 0.3 * k, bend: 0.95 });
        const cm = new THREE.Mesh(dabGeometry(com), steamMat); cm.name = 'steam'; cm.frustumCulled = false; scene.add(cm); steamCommas.push(cm);
      }
    }
    // the pedestal fruit stand: plums and pomegranates as cobalt, rose and vermilion blobs
    {
      const [x, z] = OBJ.stand, m = mat(x, 0, z), stTube = way.next[0] === T.lemon ? T.canvas : T.lemon;
      const sd0 = rng(), bandT = [T.cobalt, T.rose, T.viridian].find((c) => c !== way.next[0] && c !== way.old[0]), bowlT = stTube === T.canvas ? T.lemon : T.canvas;
      lathe(solid, [[10, 0.3], [11.5, 1.6], [5, 4.5], [2.6, 9], [3.6, 15], [2.4, 22], [3.4, 27], [9, 30.5]], 24, stTube, { m, hw: 1.3, seed: sd0, wob: 0.015 });
      lathe(solid, [[9, 30.5], [13.2, 32.1], [17, 34]], 24, bowlT, { m, hw: 1.3, seed: sd0, wob: 0.015 });
      lathe(solid, [[17, 34], [19.1, 36.1]], 24, bandT, { m, hw: 1.3, seed: sd0, wob: 0.015 });
      lathe(solid, [[19.1, 36.1], [20.5, 38.5], [20, 39.2], [15, 37], [2, 35.5]], 24, stTube, { m, hw: 1.3, seed: sd0, wob: 0.015 });
      for (const [rr, yy] of [[9.3, 30.5], [17.3, 34], [19.4, 36.1]]) lines.push({ pts: loop([x, yy, z], [1, 0, 0], [0, 0, 1], 26, () => [rr, rr]), closed: true, width: 0.8, tube: T.black, seed: rng(), gap: 0.16 });
      for (let k = 0; k < 9; k++) { const a = (k / 9) * 6.283 + 0.2, rr = 13.4; dabs.push({ p: [x + Math.sin(a) * rr, 32.3, z + Math.cos(a) * rr], a: [Math.cos(a) * 1.7, 0, -Math.sin(a) * 1.7], b: [Math.sin(a) * 0.5, 0.75, Math.cos(a) * 0.5], tube: bandT, seed: rng() }); }
      const ft = [T.cobalt, T.rose, T.vermilion, T.viridian, T.rose, T.cobalt].filter((c) => c !== way.next[0]);
      for (let k = 0; k < 7; k++) {
        const a = (k / 6) * 6.283 + rng.range(-0.2, 0.2), r = k === 6 ? 0 : 11.5, rr = rng.range(5.2, 6.6);
        blob(solid, [rr, rr * rng.range(0.9, 1.05), rr], ft[k % ft.length], { m: mat(x + Math.sin(a) * r, (k === 6 ? 48 : 41) + rng.range(-0.6, 0.6), z + Math.cos(a) * r, a), seed: rng(), hw: 1.1, rings: 8, seg: 12 });
      }
      leaf3([x - 6, 48, z + 5], [x - 17, 55, z + 12], [0, 1, 0.2], 3.2, T.viridian); leaf3([x + 5, 50, z - 3], [x + 15, 58, z - 8], [0.1, 1, 0], 3, T.viridian);
      stripe(x, z, 11, 11); spots.push([x, z, 12]);
    }
    // two bread rolls and the knife
    for (const [x, z, yaw] of [[-58, -34, 0.5], [70, -182, 2.2]]) {
      blob(solid, [9, 6.2, 13], T.canvas, { m: mat(x, 5.9, z, yaw), seed: rng(), hw: 1.25, rings: 9, seg: 16, wob: 0.06 });
      for (let k = -1; k <= 1; k++) { const c = [x + Math.sin(yaw) * k * 6, 0, z + Math.cos(yaw) * k * 6], o = [Math.cos(yaw), -Math.sin(yaw)];
        lines.push({ pts: [-0.6, -0.3, 0, 0.3, 0.6].map((t) => [c[0] + o[0] * t * 8, 6.2 + 6.1 * Math.sqrt(1 - t * t * 0.9) - (k ? 0.5 : 0), c[2] + o[1] * t * 8 + t * 2]), closed: false, width: 1.0, tube: T.black, seed: rng() }); }
      stripe(x, z, 10, 12); spots.push([x, z, 13]);
    }
    {
      const kx = -64, kz = -236, ky = 0.5, yaw = 0.16, c = Math.cos(yaw), s = Math.sin(yaw), P = (a, b) => [kx + a * s + b * c, ky, kz + a * c - b * s];
      const blade = [P(-22, -1.2), P(-10, -2.4), P(4, -2.6), P(4, 1.5), P(-8, 1.6), P(-18, 0.9)], handle = [P(4, -1.9), P(21, -2.3), P(22.5, 0), P(21, 2.2), P(4, 1.6)];
      fan(flat, blade, T.canvas); fan(flat, handle, T.black);
      lines.push({ pts: blade.map((p) => [p[0], 0.9, p[2]]), closed: true, width: 0.9, tube: T.black, seed: rng(), gap: 0.08 });
      dabs.push({ p: [kx + 4.2, 0.2, kz], a: [s * 20, 0, c * 20], b: [1.2 * c, 0, -1.2 * s], tube: 7, seed: rng() });
      spots.push([kx, kz, 5], [kx + s * 14, kz + c * 14, 5], [kx - s * 14, kz - c * 14, 5]);
    }
    await ctx.yield();
    // the cane chair pulled back from the table, a striped apron thrown over it: the only sign of whoever lives here. It stands
    // beside the table on the cloth's right-hand side, its seat (32.5 m in radius) 25 m clear of the cloth's edge, beside the table's
    // far third (the third nearest the tank): the seat's edge on the line where that third begins, the rest of the chair beside the
    // third (so that, in plan, it stands outside every line from the course to the fifth canvas wherever that canvas is dealt). It is
    // square to the table: its back to the tank's end, the apron over the back and falling on the face toward the table's head. Its
    // stripe lies along its right-hand foot, as every stripe in the room does.
    {
      const seatY = -42, caneTube = way.next[0] === T.lemon || way.old[0] === T.lemon ? T.canvas : T.lemon;
      const chX = TABLE.x1 + 25 + 32.5, chZ = TABLE.z0 + (TABLE.z1 - TABLE.z0) / 3 - 32.5;
      const M = mat(chX, 0, chZ, Math.PI / 2), W = (lx, y, lz) => { _v.set(lx, y, lz).applyMatrix4(M); return [_v.x, _v.y, _v.z]; }, at = (lx, y, lz, ry = 0, rx = 0, rz = 0) => M.clone().multiply(mat(lx, y, lz, ry, rx, rz));
      for (const [dx, dz] of [[-24, -24], [24, -24], [-24, 24], [24, 24]]) lathe(solid, [[3.4, R.y0 - seatY], [2.6, -60], [3.2, -6], [3.6, 0]], 8, caneTube, { m: at(dx, seatY, dz), hw: 1.2, seed: rng() });
      lathe(solid, [[2, -5], [30, -5.5], [32.5, -2], [31, 0.5], [2, 1]], 22, caneTube, { m: at(0, seatY, 0), hw: 1.4, seed: rng(), wob: 0.02 });
      for (const dz of [-27, 27]) lathe(solid, [[3.2, 0], [2.6, 60], [2.8, 118], [1, 122]], 8, caneTube, { m: at(27, seatY, dz, 0, 0, -0.12), hw: 1.2, seed: rng() });
      for (const hgt of [70, 112]) { const yy = seatY + hgt, xx = 27 + hgt * 0.12; lathe(solid, [[2.4, -29], [2.9, 0], [2.4, 29]], 8, caneTube, { m: at(xx, yy, 0, 0, Math.PI / 2, 0), hw: 1.1, seed: rng() }); }
      for (let k = -3; k <= 3; k++) lines.push({ pts: seg3(W(27 + 8.5, seatY + 71, k * 7.2), W(27 + 13.2, seatY + 111, k * 7.2 + (k % 2 ? 1.5 : -1.5)), 6), closed: false, width: 0.9, tube: T.black, seed: rng() });
      // the apron: stripes of rose and bare canvas hanging over the top rail toward the table
      const ax = 27 + 112 * 0.12 - 3.4, ay = seatY + 114, stripes = 8, apA = way.next[0] === T.rose ? T.cobalt : T.rose;
      for (let k = 0; k < stripes; k++) {
        const z0 = -22 + k * 5.5, z1 = z0 + 5.5, drop = 74 + 5 * Math.sin(k * 1.3), tb2 = k % 2 ? T.canvas : apA;
        quad(flat, W(ax, ay + 1.5, z0), W(ax, ay + 1.5, z1), W(ax - 7 - 2 * Math.sin(k), ay - drop, z1 + 1.5), W(ax - 7 - 2 * Math.sin(k + 1), ay - drop + 2, z0 + 1.5), tb2);
      }
      lines.push({ pts: [W(ax - 0.4, ay + 1.5, -22), W(ax - 0.4, ay + 1.5, 22), W(ax - 8, ay - 76, 23.5), W(ax - 8, ay - 72, -20.5)].flatMap((p, i, a) => seg3(p, a[(i + 1) % 4], 8).slice(0, 8)), closed: true, width: 1.1, tube: T.black, seed: rng(), gap: 0.1 });
      dabs.push({ p: [chX + 40, R.y0 + 0.4, chZ], a: [0, 0, 30], b: [4, 0, 0], tube: 7, seed: rng(), bend: 0.3 });
    }
    await ctx.yield();
    // one bold group of the cloth's fruit, larger than the rest, on the left of the course before the decanter (its own
    // random stream, so nothing else in the room moves)
    { rng = addRng; const yaw = rng.range(0.2, 1.2);
      for (const [side, bz] of [[-1, -113], [-1, -47], [1, -146], [-1, -108], [-1, -118], [-1, -52], [1, -140], [1, -152], [-1, -181], [1, -212]]) { const bx = pathXAtZ(bz) + side * 40; if (!blocked(bx, bz, 13)) { fruitAt(bx, bz, yaw, 1.65); break; } }
      rng = roomRng; }
    await ctx.yield();

    // ---------- the hero: the goldfish tank on its rose table ----------
    const hero = await buildHero(ctx, { stage: false, style, detail, fish: nFish, carp, cat: catMood !== 'absent', catAzimuth: Math.PI, vine,
      layers: { old: way.old, next: way.next, shOld: way.shOld, shNew: way.shNew } });
    hero.object.position.copy(HERO); scene.add(hero.object);
    await ctx.yield();

    // ---------- the cat on its cane chair beyond the tank: one black shape, two lemon eyes, a tail that curls ----------
    const CAT = { x: -30, z: -560, seat: -62 };
    const catG = new THREE.Group(); catG.name = 'cat'; catG.position.set(CAT.x, CAT.seat, CAT.z); scene.add(catG);
    const headG = new THREE.Group(); catG.add(headG);
    const tailN = 22, tailPts = []; for (let i = 0; i < tailN; i++) tailPts.push([40 + i * 3, 4, 10]);
    let tailMesh = null, tailGeo = null;
    {
      const chair = newAcc(), cane = way.next[0] === T.lemon || way.old[0] === T.lemon ? T.canvas : T.lemon;
      for (const [dx, dz] of [[-34, -30], [34, -30], [-34, 30], [34, 30]]) lathe(chair, [[4, R.y0 - CAT.seat], [3, -40], [3.8, -6], [4, 0]], 8, cane, { m: mat(dx, -4, dz), hw: 1.3, seed: rng() });
      lathe(chair, [[3, -8], [46, -8.5], [50, -4], [48, -0.5], [3, 0]], 24, cane, { m: mat(0, 0, 0), hw: 1.5, seed: rng(), wob: 0.02 });
      const cushTube = way.next[0] === T.rose ? T.viridian : T.rose;
      blob(chair, [41, 7, 38], cushTube, { m: mat(0, 5, 0), hw: 1.2, seed: rng(), rings: 8, seg: 20 });
      addSolid(chair, 'cat-chair', catG);
      dabs.push({ p: [CAT.x + 58, R.y0 + 0.4, CAT.z], a: [0, 0, 44], b: [5, 0, 0], tube: 7, seed: rng(), bend: 0.3 });
      if (catMood !== 'absent') {
        const body = newAcc(), head = newAcc(), eyes = newFlat(), asleep = catMood === 'asleep';
        if (asleep) {
          blob(body, [52, 27, 43], T.black, { m: mat(0, 36, 0), hw: 0.5, seed: rng(), rings: 10, seg: 22, wob: 0.03 });
          headG.position.set(30, 38, 34);
          blob(head, [22, 18, 20], T.black, { hw: 0.5, seed: rng(), rings: 9, seg: 16 });
        } else {
          blob(body, [41, 50, 34], T.black, { m: mat(0, 58, -4), hw: 0.5, seed: rng(), rings: 10, seg: 22, wob: 0.03, point: 0.8 });
          blob(body, [28, 44, 24], T.black, { m: mat(0, 96, 2), hw: 0.5, seed: rng(), rings: 9, seg: 18 });       // chest and neck
          for (const sd of [-1, 1]) blob(body, [10, 26, 13], T.black, { m: mat(sd * 17, 30, 27), hw: 0.5, seed: rng(), rings: 7, seg: 10 });   // forelegs
          headG.position.set(0, 140, 6);
          blob(head, [27, 23, 23], T.black, { hw: 0.5, seed: rng(), rings: 10, seg: 18 });
        }
        for (const sd of [-1, 1]) lathe(head, [[9.5, 0], [6, 9], [0.4, 19]], 8, T.black, { m: mat(sd * 15, asleep ? 11 : 15, 0, 0, 0, -sd * 0.32), hw: 0.5, seed: rng() });
        const hs = asleep ? 0.8 : 1;
        for (const sd of [-1, 1]) {
          if (!asleep) {
            const c = [sd * 10.5, 2.5, 22.2];
            fan(eyes, loop(c, [1, 0, sd * -0.25], [0.12 * sd, 1, 0], 14, (a) => [6.3 * hs, 3.4 * hs * (0.75 + 0.25 * Math.abs(Math.cos(a)))]), T.lemon);
            fan(eyes, loop([c[0], c[1], c[2] + 0.5], [1, 0, sd * -0.25], [0, 1, 0], 8, () => [1.25, 3.1]), T.black);
          }
        }
        addSolid(body, 'cat-body', catG); addSolid(head, 'cat-head', headG);
        if (!asleep) addFlat(eyes, 'cat-eyes', headG);
        tailGeo = contourGeometry([{ pts: tailPts, closed: false, width: 9.5, tube: T.black, seed: 0.37 }]);
        tailMesh = new THREE.Mesh(tailGeo, lineMat); tailMesh.name = 'cat-tail'; tailMesh.frustumCulled = false; catG.add(tailMesh);
      }
    }
    await ctx.yield();

    // ---------- the window: the only sky, painted like everything else, 60 m behind the opening ----------
    const HOURS = { day: [T.lemon, T.viridian], dawn: [T.rose, T.viridian], golden: [T.vermilion, T.cobalt], night: [T.black, T.viridian] };
    const winMat = new THREE.ShaderMaterial({
      uniforms: { ...U, uBand: { value: tv(HOURS[hour][0]) }, uLawn: { value: tv(HOURS[hour][1]) }, uNight: { value: hour === 'night' ? 1 : 0 }, uWSeed: { value: rng.range(0, 50) } },
      vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: /* glsl */`
        ${STYLE_GLSL}
        uniform vec3 uBand, uLawn; uniform float uNight, uWSeed; varying vec3 vW;
        const float HOUSE_X = ${(WIN.w / 6).toFixed(2)};       // on the horizon within the opening's middle third: its middle on that third's right-hand edge, so its near wall stands beside the way out (14 m wide) in the slot
        float ell(vec2 p, vec2 c, vec2 r){ return (length((p - c)/r) - 1.)*min(r.x, r.y); }
        float segd(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba*clamp(dot(pa, ba)/max(dot(ba, ba), 1e-4), 0., 1.)); }
        void main(){
          vec2 p = vec2(-vW.z - 472., vW.y);
          float aa = max(0.7*length(fwidth(p)), 1e-3);
          float hz = 52. + 8.*sin(p.x*0.021 + uWSeed) + 4.*sin(p.x*0.057 + 2.);
          vec3 col = p.y > hz ? uBand : uLawn;
          col = mix(col, uTube[0], (1. - smoothstep(-aa, aa, abs(p.y - hz) - 0.9))*step(0.42, vn(vec2(p.x*0.05, 3.))));      // a sliver of canvas where the two meet
          // night: lemon star dabs and a cream moon
          vec2 sc = floor(p/23.), sf = p - (sc + 0.5)*23.; float sh = h21(sc + uWSeed);
          float star = ell(sf, (vec2(sh, fract(sh*7.3)) - 0.5)*12., vec2(2.6, 1.7));
          col = mix(col, uTube[4], (1. - smoothstep(-aa, aa, star))*uNight*step(hz + 6., p.y)*step(0.45, sh));
          col = mix(col, uTube[0], (1. - smoothstep(-aa, aa, length(p - vec2(-22., 215.)) - 15.))*uNight);
          // a path of bare canvas winding down the lawn
          // (it comes down the middle of the lawn, under where the way out stands, in the clear between the two leaves: the way
          // to the door, wider toward the eye; the distance is across the path, so its bends keep their width)
          float pdn = max(hz - p.y, 0.), pcx = -5. + (5. + 0.2*pdn)*sin(pdn*0.062 + 0.5 + 0.3*sin(uWSeed)) - 0.05*pdn;
          float pcs = (5. + 0.2*pdn)*0.062*cos(pdn*0.062 + 0.5 + 0.3*sin(uWSeed)) + 0.2*sin(pdn*0.062 + 0.5 + 0.3*sin(uWSeed)) - 0.05;
          float pth = abs(p.x - pcx)/sqrt(1. + pcs*pcs) - (1.5 + pdn*0.072)*(0.85 + 0.3*vn(vec2(p.y*0.11, 7.)));
          col = mix(col, uTube[0], (1. - smoothstep(-aa, aa, pth))*step(p.y, hz - 2.));
          // blossom trees: black trunks, flowers left as bare canvas, each crown inside one loose black line that swells,
          // thins and breaks. The hand's wobble warps the plane, not the field, so the field stays a distance and every
          // edge is cut to one pixel after the loop (no derivative inside it): nothing soft, nothing grey.
          vec2 pw = p + vec2(1.9*sin(p.y*0.21 + uWSeed) + 0.7*sin(p.y*0.47 + 1.3), 1.7*sin(p.x*0.19 + 2.*uWSeed) + 0.6*sin(p.x*0.43 + 4.));
          float crAll = 1e3, crS = 1., crA = 1., ptl = 1e3;
          for (int i = 0; i < 7; i++) {
            float fi = float(i), hh = h11(fi + uWSeed), tx = -175. + fi*58. + 26.*hh, by = hz + 22. - 62.*fract(hh*5.3), s = 1.3 - 0.5*fract(hh*5.3);
            float sway = 1.6*sin(uTime*0.6 + fi*2.);
            float tr = segd(p, vec2(tx, by - 34.*s), vec2(tx + 4.*s + sway*0.4, by)) - 1.5*s;
            tr = min(tr, segd(p, vec2(tx + 2.*s, by - 10.*s), vec2(tx + 13.*s + sway, by + 12.*s)) - 1.0*s);
            tr = min(tr, segd(p, vec2(tx + 3.*s, by - 14.*s), vec2(tx - 12.*s + sway, by + 9.*s)) - 1.0*s);
            col = mix(col, uTube[6], 1. - smoothstep(-aa, aa, tr - 0.5*aa));
            float cr = min(ell(pw, vec2(tx + sway, by + 20.*s), vec2(22., 15.)*s), min(ell(pw, vec2(tx - 17.*s + sway, by + 8.*s), vec2(14., 11.)*s), ell(pw, vec2(tx + 18.*s + sway, by + 9.*s), vec2(15., 10.)*s)));
            if (cr < crAll) { crAll = cr; crS = s; float ax = p.x - tx; crA = fract(atan(p.y - by - 14.*s, abs(ax) < 1e-3 ? 1e-3 : ax)*0.159 + hh + uTime*0.004); }
            // a few flowers let go: canvas dabs coming down, each a clean dab three pixels across or not there
            // (three to a tree, out of step, each from another part of the crown)
            for (int k = 0; k < 3; k++) { float fk = float(k), cl = uTime*0.05 + hh*3. + fk*0.37;
              float ft = fract(cl), fx = tx + 22.*s*sin(fi*5. + fk*2.1 + floor(cl)*2.3) + 5.*sin(uTime*0.9 + fi + fk*1.9);
              ptl = min(ptl, ell(p, vec2(fx, by + (12. - 3.*fk)*s - ft*50.*s), vec2(2.9, 2.)) + 1e3*step(0.93, ft)); }
          }
          float cfw = max(fwidth(crAll), 1e-4), lw = max(0.62*crS*(0.5 + 1.1*vn(p*0.09 + 3.)), 1.25*aa);
          col = mix(col, uTube[0], clamp(0.5 - crAll/cfw, 0., 1.));
          col = mix(col, uTube[6], clamp(0.5 - (abs(crAll) - lw)/cfw, 0., 1.)*step(0.2, crA));
          col = mix(col, uTube[0], clamp(0.5 - ptl/max(fwidth(ptl), 1e-4), 0., 1.)*step(1.6*aa, 1.9));
          // the rose-pink house, the size of a matchbox
          vec2 hq = p - vec2(HOUSE_X, hz - 5.);
          float hb = max(abs(hq.x) - 11., abs(hq.y - 7.) - 7.), rf = max(abs(hq.x)*0.75 + (hq.y - 14.) - 10., 14. - hq.y);
          col = mix(col, uTube[5], 1. - smoothstep(-aa, aa, hb)); col = mix(col, uTube[1], 1. - smoothstep(-aa, aa, rf));
          col = mix(col, uTube[6], (1. - smoothstep(-aa, aa, abs(min(hb, rf)) - 0.55))*step(0.1, fract(hq.x*0.05 + hq.y*0.07)));
          // six black tick-mark birds crossing the picture
          for (int i = 0; i < 6; i++) {
            // (they wheel over the garden above the blossom, each on its own flat round at its own height, 22 to 65 m above the
            // height the last straight is flown at (66 m), within 80 m of the window's axis; a tick is two strokes, never under two pixels)
            float fi = float(i), bh = h11(fi + 3.), th = uTime*(0.085 + 0.04*bh)*(i == 1 || i == 4 ? -1. : 1.) + fi*1.9 + 6.*h11(fi);
            vec2 c = vec2(-3. + (36. + 34.*bh)*sin(th) + 8.*sin(th*2.3 + fi), 88. + 8.6*fi + (5. + 2.*bh)*cos(th) + 2.5*sin(uTime*0.7 + fi*2.));
            float fl = 2.2*sin(uTime*5. + fi*1.7);
            float bd = min(segd(p, c, c + vec2(-4.7, 2.5 + fl)), segd(p, c, c + vec2(4.7, 3.2 + fl))) - max(0.95, 1.1*aa);
            col = mix(col, uNight > 0.5 ? uTube[0] : uTube[6], 1. - smoothstep(-aa, aa, bd));
          }
          gl_FragColor = vec4(col, 1.);
        }`,
    });
    const roomLines2 = [];
    const winPic = new THREE.Mesh(new THREE.PlaneGeometry(640, 700), winMat); winPic.name = 'window-picture';
    winPic.rotation.y = Math.PI / 2; winPic.position.set(WIN.x - 60, 150, WIN.z - 40); scene.add(winPic);
    // The blossom the garden sheds comes in at the window: bare-canvas petals (the brief's "blossom shedding a few canvas-white
    // dabs", here as real dabs in the room) drift in between the shutters and down the last straight on the draught that bellies
    // the curtain, tumbling, well clear of the course and of the way out. Each is a whole crisp dab or it is not there: one
    // under three pixels across is not laid. Their limits: 110 at most; none longer than 6.6 m (half-length 3.3 at most); none
    // further into the room than 252 m from the window (its run); flat bare canvas; none nearer the lens than 6 m: each starts
    // 13 m or more to one side of the window's axis and drifts on away from it, so with its sway (3.2 m) and its half-length it
    // keeps 6.5 m and more from the course all the way (the shader also lays none within 7 m in front of the eye).
    { const pr = ctx.core.makeRng('room-petals:' + ctx.seed), nP = Math.round(110 * detail), base = new THREE.PlaneGeometry(2, 2);
      const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
      const iP = new Float32Array(nP * 3), iV = new Float32Array(nP * 4), iS = new Float32Array(nP * 3);
      for (let i = 0; i < nP; i++) {
        let dz = 0, dy = 0; for (let t = 0; t < 8; t++) { dz = pr.range(-49, 49); dy = pr.range(-70, 150) * pr(); if (Math.hypot(dz, dy) > 16) break; }
        if (Math.hypot(dz, dy) <= 16) dz = dz < 0 ? -18 : 18;
        if (Math.abs(dz) < 13) dz += dz < 0 ? -13 : 13;
        iP.set([WIN.x - 5, 66 + dy, WIN.z + dz], i * 3);
        iV.set([pr.range(130, 252), (dz > 0 ? pr.range(2, 24) : -pr.range(4, 70)), pr.range(18, 70) * (dy > 40 ? 1.4 : 0.7), pr()], i * 4);     // run into the room (+X), drift away from the course, fall, phase
        iS.set([i % 6 === 0 ? pr.range(2.6, 3.3) : pr.range(1.3, 2.5), pr(), 1 / pr.range(17, 31)], i * 3);                                                                    // half-length, seed, loops per second
      }
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 3)); g.setAttribute('iV', new THREE.InstancedBufferAttribute(iV, 4)); g.setAttribute('iS', new THREE.InstancedBufferAttribute(iS, 3));
      g.instanceCount = nP; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(WIN.x + 130, 66, WIN.z), 1e4);
      const pm = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: U,
        vertexShader: /* glsl */`
          uniform float uTime, uResY; attribute vec3 iP, iS; attribute vec4 iV; varying vec2 vUv; varying float vSd;
          void main(){ vUv = position.xy; vSd = iS.y;
            float s = fract(uTime*iS.z + iV.w), ph = iV.w*40.;
            vec3 c = iP + vec3(iV.x*s, -iV.z*(0.35*s + 0.65*s*s) + 2.6*sin(s*21. + ph), iV.y*s + 3.2*sin(s*15. + ph*1.7));
            vec4 mv = viewMatrix*vec4(c, 1.);
            float ang = uTime*(0.7 + 0.9*iS.y) + ph, sq = 0.62 + 0.38*sin(uTime*(1.1 + 1.4*iS.y) + ph*2.3);       // it turns, and shows more or less of its face
            vec2 q = position.xy*vec2(iS.x, iS.x*0.6*sq), r = vec2(q.x*cos(ang) - q.y*sin(ang), q.x*sin(ang) + q.y*cos(ang));
            float px = iS.x*0.6*sq*projectionMatrix[1][1]*max(uResY, 1.)*0.5/max(-mv.z, 0.1);
            if (s < 0.015 || s > 0.985 || px < 1.5*(0.9 + 0.5*iS.y) || -mv.z < 7.) r = vec2(0.);
            mv.xy += r; gl_Position = projectionMatrix*mv; }`,
        fragmentShader: /* glsl */`
          uniform vec3 uTube[7]; varying vec2 vUv; varying float vSd;
          void main(){ float x = vUv.x, w = (1. - x*x)*(0.78 + 0.22*x) + 0.05*sin(x*9. + vSd*40.);      // a petal: blunt at one end, drawn in at the other
            if (abs(vUv.y + 0.08*sin(x*4. + vSd*17.)) > w*0.95) discard;
            gl_FragColor = vec4(uTube[0], 1.); }` });
      const pmesh = new THREE.Mesh(g, pm); pmesh.name = 'petals-in'; pmesh.frustumCulled = false; scene.add(pmesh); }
    await ctx.yield();
    // the reveal of the opening (four thin canvas faces) so the wall has a thickness
    { const rv = newFlat(), x0 = WIN.x, x1 = WIN.x - 6;
      roomLines2.push({ pts: [[x1 - 0.2, WIN.y0, wz1], [x1 - 0.2, WIN.y1, wz1], [x1 - 0.2, WIN.y1, wz0], [x1 - 0.2, WIN.y0, wz0]].flatMap((p, i, a) => seg3(p, a[(i + 1) % 4], 10).slice(0, 10)), closed: true, width: 1.5, tube: T.black, seed: 0.61, gap: 0.07 });
      quad(rv, [x0, WIN.y0, wz1], [x0, WIN.y0, wz0], [x1, WIN.y0, wz0], [x1, WIN.y0, wz1], T.canvas); quad(rv, [x0, WIN.y1, wz1], [x0, WIN.y1, wz0], [x1, WIN.y1, wz0], [x1, WIN.y1, wz1], T.canvas);
      quad(rv, [x0, WIN.y0, wz1], [x0, WIN.y1, wz1], [x1, WIN.y1, wz1], [x1, WIN.y0, wz1], T.canvas); quad(rv, [x0, WIN.y0, wz0], [x0, WIN.y1, wz0], [x1, WIN.y1, wz0], [x1, WIN.y0, wz0], T.canvas);
      addFlat(rv, 'window-reveal'); addLines(roomLines2, 'reveal-lines'); }
    await ctx.yield();
    // the shutters: two louvred leaves standing ajar outside, swinging, the slot between them never under 16 m
    const shTube = T.viridian;                         // viridian at every hour, as the brief has them (the hour changes only the window picture)
    const shutters = [1, -1].map((dir) => {
      const g = new THREE.Group(); g.name = 'shutter'; g.position.set(WIN.x - 8, 0, WIN.z + dir * 36); scene.add(g);
      const f = newFlat(), w = 26, y0 = WIN.y0 + 2, y1 = 196, zz = (s) => -dir * s, ls = [];
      const bar = (s0, s1, ya, yb) => quad(f, [0, ya, zz(s0)], [0, ya, zz(s1)], [0, yb, zz(s1)], [0, yb, zz(s0)], shTube);
      bar(0, 3.2, y0, y1); bar(w - 3.2, w, y0, y1); bar(0, w, y0, y0 + 5); bar(0, w, y1 - 5, y1); bar(0, w, 86, 91);
      for (let y = y0 + 8; y < y1 - 8; y += 6.2) if (y < 82 || y > 92) bar(2.6, w - 2.6, y, y + 3.7);
      ls.push({ pts: [[0, y0, 0], [0, y1, 0], [0, y1, zz(w)], [0, y0, zz(w)]].flatMap((p, i, a) => seg3(p, a[(i + 1) % 4], 10).slice(0, 10)).map((p) => [p[0] + 0.3, p[1], p[2]]), closed: true, width: 1.3, tube: T.black, seed: rng(), gap: 0.07 });
      addFlat(f, 'shutter-leaf', g); addLines(ls, 'shutter-line', g);
      return { g, dir, ph: rng.range(0, 6.28) };
    });

    // ---------- the curtain: stripes of rose and bare canvas blowing in from the window in slow bellying folds ----------
    const curA = way.next[0] === T.rose ? T.cobalt : T.rose;
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 40, 60), new THREE.ShaderMaterial({
      side: THREE.DoubleSide, uniforms: { ...U, uCurA: { value: tv(curA) } },
      vertexShader: /* glsl */`
        uniform float uTime; varying vec2 vUv;
        void main(){ vUv = uv; float v = 1. - uv.y, lift = pow(max(v, 0.), 1.4), t = uTime;
          float gust = 0.82 + 0.18*sin(t*0.45 + uv.x*2.);
          vec3 p;
          p.x = ${(WIN.x + 4).toFixed(1)} + 150.*lift*gust + v*(9.*sin(v*7. - t*1.1 + uv.x*3.) + 5.*sin(v*13. - t*1.7 + uv.x*5.)) + 3.*sin(uv.x*38.)*(1. - 0.6*v);
          p.y = 292. - 200.*v + 6.*v*sin(v*5. - t*0.9 + uv.x*4.);
          p.z = ${WIN.z.toFixed(1)} + (uv.x - 0.5)*(112. + 26.*v) + 2.5*v*sin(v*9. - t*0.8);
          gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uTube[7]; uniform vec3 uCurA; varying vec2 vUv;
        void main(){
          float s = vUv.x*11. + 0.16*sin(vUv.y*17.) + 0.08*sin(vUv.y*41.), k = abs(fract(s) - 0.5), aa = max(fwidth(s), 1e-4);
          vec3 col = mix(uCurA, uTube[0], smoothstep(-aa, aa, k - 0.25));
          float e = min(min(vUv.x, 1. - vUv.x)/max(fwidth(vUv.x), 1e-5), vUv.y/max(fwidth(vUv.y), 1e-5));    // the edge line, in pixels
          float ew = max(2., 0.0035/max(min(fwidth(vUv.x), fwidth(vUv.y)*1.6), 1e-5));
          if (e < ew) col = uTube[6];
          gl_FragColor = vec4(col, 1.); }`,
    }));
    curtain.name = 'curtain'; curtain.frustumCulled = false; scene.add(curtain);
    lines.push({ pts: seg3([WIN.x + 5, 293, wz1 + 8], [WIN.x + 5, 293, wz0 - 8], 16), closed: false, width: 2.2, tube: T.black, seed: rng() });   // the rod

    // ---------- the canvases: the room's earlier lives, racked in echelon down the left of the last straight ----------
    // Four paintings on stands, each turned a little further toward the oncoming eye (like an open blind), the nearest to
    // the window standing against the wall beside it. Each is this same room: table, tank, fish, cat, window, a curl of the
    // arabesque; one all in one old tube, one in another, one only black contour on bare canvas, one turned to show its bars.
    await ctx.yield();
    const gallery = [];                                  // [x, y, z] of each face's centre, window end first (for the gaze)
    const lateDabs = []; let lateX = -258;               // the contour-only canvas is laid in, stroke by stroke, as we come level with it
    const paintRoom = (Q, s, kind, fieldT, back) => {    // Q(a, y, h): picture coords (72 x 96, origin bottom centre) -> world
      const only = kind === 2, alt = (t, o) => (t === fieldT ? o : t);
      const put = (pts, fill, lw, lt, h, closed = true, gap = 0.1) => {
        if (fill !== null && !only) fan(back, pts.map((p) => Q(p[0], p[1], h)), fill);
        if (lw) lines.push({ pts: pts.map((p) => Q(p[0], p[1], h + 0.45)), closed, width: lw * s, tube: only ? T.black : lt, seed: rng(), gap });
      };
      const el = (ca, cy, ra, ry, n = 18, wob = 0.05, sd = 0) => { const p = []; for (let i = 0; i < n; i++) { const t = (i / n) * 6.2832, r = 1 + wob * Math.sin(t * 3 + sd) + wob * 0.6 * Math.sin(t * 5 + sd * 2.3); p.push([ca + Math.cos(t) * ra * r, cy + Math.sin(t) * ry * r]); } return p; };
      const rc = (a0, y0, a1, y1, n = 5) => [[a0, y0], [a1, y0], [a1, y1], [a0, y1]].flatMap((p, i, a) => { const q = a[(i + 1) % 4], o = []; for (let j = 0; j < n; j++) o.push([lerp(p[0], q[0], j / n), lerp(p[1], q[1], j / n)]); return o; });
      const dab = (a, y, ang, hl, hw, tube, h, bend = 0) => { const o = Q(a, y, h), ea = Q(a + Math.cos(ang) * hl, y + Math.sin(ang) * hl, h), eb = Q(a - Math.sin(ang) * hw, y + Math.cos(ang) * hw, h);
        dabs.push({ p: o, a: [ea[0] - o[0], ea[1] - o[1], ea[2] - o[2]], b: [eb[0] - o[0], eb[1] - o[1], eb[2] - o[2]], tube: only ? T.black : tube, seed: rng(), bend }); };
      const lineT = alt(T.black, T.canvas), vineT = alt(alt(way.vine, T.vermilion), T.cobalt);
      // the table: one rose ellipse, its shadow a stripe at the right-hand foot
      put(el(3, 25, 28, 9.5, 22, 0.03, 1), alt(T.rose, T.lemon), 1.5, lineT, 0.5);
      if (!only) dab(33.5, 21, 1.45, 8, 1.7, alt(T.lemon, T.rose), 0.9, 0.3);
      // the window, top right: a band over a lawn left as bare canvas, a mullion, two blossom blots
      put(rc(17, 52, 33, 91), T.canvas, 0, lineT, 0.5);
      put(rc(17, 74, 33, 91, 3), alt(T.lemon, T.rose), 0, lineT, 0.7);
      put(rc(17, 52, 33, 91), null, 1.3, lineT, 0.8);
      put([[25, 53], [25.3, 66], [24.8, 78], [25, 90]], null, 1.0, lineT, 0.8, false);
      if (!only) { dab(21, 62, 0.3, 2.6, 1.7, alt(T.viridian, T.cobalt), 0.9); dab(29, 67, 2.6, 2.4, 1.6, alt(T.viridian, T.cobalt), 0.9); }
      // the cat behind the tank: one flat shape, two ears, two eye dabs
      put(el(-18, 47, 10, 17, 18, 0.05, 2), T.black, only ? 1.2 : 0, lineT, 0.6);
      put(el(-18, 68, 8.2, 7.4, 14, 0.04, 4), T.black, only ? 1.2 : 0, lineT, 0.7);
      for (const sd of [-1, 1]) put([[-18 + sd * 7.6, 71], [-18 + sd * 6.6, 81.5], [-18 + sd * 1.6, 74.5]], T.black, only ? 1.0 : 0, lineT, 0.7);
      if (!only) for (const sd of [-1, 1]) dab(-18 + sd * 3.4, 69, sd * 0.2, 2.1, 1.05, alt(T.lemon, T.canvas), 1.0);
      else for (const sd of [-1, 1]) put(el(-18 + sd * 3.4, 69, 2.1, 1.1, 8, 0, 0), null, 0.7, T.black, 1.0);
      // the tank on the table: bare canvas inside a cobalt line that does not close, three or four fish
      put(rc(-9, 28, 15, 62), T.canvas, 0, T.cobalt, 0.9);
      put(el(3, 62, 12, 3.3, 16, 0.02, 0), T.canvas, 1.25, alt(T.cobalt, T.black), 1.0, true, 0.14);
      put([[-9, 62], [-9.3, 45], [-9, 29]], null, 1.25, alt(T.cobalt, T.black), 1.0, false);
      put([[15, 62], [15.3, 45], [15, 29]], null, 1.25, alt(T.cobalt, T.black), 1.0, false);
      put(el(3, 28.5, 12, 3.3, 16, 0.02, 3).slice(8), null, 1.25, alt(T.cobalt, T.black), 1.0, false);
      for (const [fa, fy, fg] of [[-3, 37, 0.25], [8, 44, 2.9], [0, 51, -0.2], [9, 55, 3.3]]) { dab(fa, fy, fg, 4.3, 1.75, alt(T.vermilion, T.rose), 1.3, 0.25); if (!only) dab(fa - Math.cos(fg) * 5.2, fy - Math.sin(fg) * 5.2, fg + 0.5, 1.9, 1.2, alt(T.rose, T.vermilion), 1.3); }
      // a lemon on the table and a curl of the arabesque with its basket of blobs
      put(el(21, 21.5, 5.6, 3.7, 12, 0.05, 5), alt(T.lemon, T.canvas), 1.0, lineT, 1.0);
      const curl = []; for (let i = 0; i <= 30; i++) { const t = i / 30, a = 1.2 + t * 8.2, r = 13.5 * (1 - t * 0.78); curl.push([-19 + Math.cos(a) * r * 0.85 - t * 5, 8 + t * 14 + Math.sin(a) * r * 0.62 + 4]); }
      put(curl, null, 2.3, vineT, 0.9, false);
      const st = []; for (let i = 0; i <= 14; i++) { const t = i / 14; st.push([-31 + 5.5 * Math.sin(t * 5.2), 33 + t * 52]); }
      put(st, null, 2.0, vineT, 0.9, false);
      for (const [ba, by] of [[-28.5, 60], [-27, 88]]) {
        if (!only) { dab(ba, by - 2.2, 0, 4.6, 2.3, alt(T.canvas, T.lemon), 1.0); dab(ba - 2.6, by + 1.6, 0.4, 1.9, 1.6, alt(T.rose, T.lemon), 1.2); dab(ba + 0.3, by + 2.6, 1.2, 1.9, 1.6, alt(T.lemon, T.rose), 1.25); dab(ba + 3, by + 1.4, 2.2, 1.9, 1.6, alt(T.rose, T.lemon), 1.3); }
        put(el(ba, by, 5.2, 4.6, 10, 0.06, by), null, 0.8, lineT, 1.4, true, 0.2);
      }
      put([[22, 5.5], [24, 7.2], [25.5, 4.6], [27.5, 7], [29.5, 4.8], [32, 6.2]], null, 0.8, lineT, 0.9, false);      // signed, bottom right
      if (only) {
        // this one is the room as it is now, still being painted: the colour goes in dab by dab inside the black drawing
        const nx = way.next[0], a2 = (t, o) => (t === nx ? o : t), lr = rng.fork('late-canvas');
        const lay = (a, y, ang, hl, hw, tube, h, bend = 0) => { const o = Q(a, y, h), ea = Q(a + Math.cos(ang) * hl, y + Math.sin(ang) * hl, h), eb = Q(a - Math.sin(ang) * hw, y + Math.cos(ang) * hw, h);
          lateDabs.push({ p: o, a: [ea[0] - o[0], ea[1] - o[1], ea[2] - o[2]], b: [eb[0] - o[0], eb[1] - o[1], eb[2] - o[2]], tube, seed: lr(), bend, born: lateDabs.length }); };
        const field = (k) => { for (let j = 0; j < 3; j++) lay(-23.5 + j * 23.5 + lr.range(-1.5, 1.5), 5.6 + k * 10.6 + lr.range(-0.6, 0.6), lr.range(-0.1, 0.1) + (j % 2 ? 3.14 : 0), 12.8, 6.3, nx, 0.2, lr.range(-0.1, 0.1)); };
        for (let k = -2; k <= 2; k++) lay(3 + k * 0.6, 25 + k * 3.6, k % 2 ? 3.14 : 0, 27 * Math.sqrt(1 - (k * 3.6 / 9.6) ** 2), 2.3, a2(T.rose, T.lemon), 0.5);        // the table
        lay(33.5, 21, 1.45, 8, 1.7, a2(T.viridian, T.cobalt), 0.6, 0.3);
        for (const da of [-4.6, 0, 4.6]) lay(-18 + da, 47, 1.571, 15.5 - Math.abs(da) * 0.5, 3.1, T.black, 0.55);                                                    // the cat
        lay(-18, 66, 0, 6.6, 3.0, T.black, 0.6); lay(-18, 70.5, 3.14, 6.8, 3.0, T.black, 0.6); lay(-24.5, 76, 1.45, 4.4, 1.7, T.black, 0.6); lay(-11.5, 76, 1.7, 4.4, 1.7, T.black, 0.6);
        const keep = (a, y, hl, hw, h) => { lay(a, y, 0, hl, hw, T.canvas, h); lateDabs[lateDabs.length - 1].born = -1e6; };      // what stays bare canvas when the field goes in
        for (let k = 0; k < 4; k++) keep(3, 32.6 + k * 8.4, 12.4, 4.7, 0.35);
        for (let k = 0; k < 3; k++) keep(25, 57 + k * 7.5, 8.2, 4.3, 0.35);
        for (const [ba, by] of [[-28.5, 60], [-27, 88]]) keep(ba, by - 2.2, 4.6, 2.3, 1.0);
        field(0); field(1); field(2); field(3);
        lay(25, 86.5, 0, 7.6, 2.6, a2(T.lemon, T.rose), 0.6); lay(25, 80, 3.14, 7.6, 2.6, a2(T.lemon, T.rose), 0.6); lay(25, 75.5, 0, 7.6, 2.0, a2(T.lemon, T.rose), 0.6);   // the window's band
        lay(21, 62, 0.3, 2.6, 1.7, a2(T.viridian, T.cobalt), 0.9); lay(29, 67, 2.6, 2.4, 1.6, a2(T.viridian, T.cobalt), 0.9);
        lay(21, 21.5, 0.1, 5.2, 3.3, a2(T.lemon, T.canvas), 0.75);                                                                                                // the lemon
        for (const [ba, by] of [[-28.5, 60], [-27, 88]]) { lay(ba - 2.6, by + 1.6, 0.4, 1.9, 1.6, a2(T.rose, T.lemon), 1.2); lay(ba + 0.3, by + 2.6, 1.2, 1.9, 1.6, a2(T.lemon, T.rose), 1.25); lay(ba + 3, by + 1.4, 2.2, 1.9, 1.6, a2(T.rose, T.lemon), 1.3); }
        field(4); field(5); field(6);
        for (const [fa, fy, fg] of [[-3, 37, 0.25], [8, 44, 2.9], [0, 51, -0.2], [9, 55, 3.3]]) lay(fa, fy, fg, 4.6, 1.95, a2(T.vermilion, T.rose), 1.38, 0.25);            // the fish turn red
        field(7); field(8);
        for (const sd of [-1, 1]) lay(-18 + sd * 3.4, 69, sd * 0.2, 2.2, 1.15, a2(T.lemon, T.canvas), 1.5);                                                             // and last the eyes
      }
    };
    {
      const kindsBySlot = rng.pick([[0, 2, 1, 3], [1, 2, 0, 3], [0, 1, 3, 2], [1, 0, 2, 3]]), tubes = [T.viridian, T.cobalt, T.rose, T.lemon].filter((c) => c !== way.next[0]);
      const back = newFlat(), barT = way.old[0] === T.lemon || way.next[0] === T.lemon ? T.rose : T.lemon;
      // slot: x of the face's centre, metres left of the course, degrees turned toward the oncoming eye
      const SLOT = [[-322, 97, 8], [-292, 146, 20], [-258, 193, 32], [-222, 238, 44]];
      const hang = (ox, oz, deg, w, yb, kind, fieldT, stand) => {
        const f = deg * Math.PI / 180, n = [Math.cos(f), 0, -Math.sin(f)], e = [-Math.sin(f), 0, -Math.cos(f)], lean = stand ? 0.045 : 0, s = w / 72, hP = 96 * s, yt = yb + hP;
        const P = (a, y, h = 0) => { const hh = h - (y - yb) * lean; return [ox + e[0] * a + n[0] * hh, y, oz + e[2] * a + n[2] * hh]; };
        const Q = (a, y, h = 0) => P(a * s, yb + y * s, h), W2 = w / 2;
        const box = (a0, y0, a1, y1, h, tube) => quad(back, P(a0, y0, h), P(a1, y0, h), P(a1, y1, h), P(a0, y1, h), tube);
        const edge = (a0, y0, a1, y1, h, wd, nseg = 8) => lines.push({ pts: seg3(P(a0, y0, h), P(a1, y1, h), nseg), closed: false, width: wd, tube: T.black, seed: rng() });
        const frame = (h) => lines.push({ pts: [P(-W2, yb, h), P(-W2, yt, h), P(W2, yt, h), P(W2, yb, h)].flatMap((p, i, a) => seg3(p, a[(i + 1) % 4], 10).slice(0, 10)), closed: true, width: 1.7, tube: T.black, seed: rng(), gap: 0.05 });
        const bars = (h) => {                             // the stretcher: four bars, a cross, corner keys
          const bw = 5 * s;
          for (const [a0, y0, a1, y1] of [[-W2, yb, -W2 + bw, yt], [W2 - bw, yb, W2, yt], [-W2, yt - bw, W2, yt], [-W2, yb, W2, yb + bw], [-W2, yb + hP * 0.5 - bw * 0.45, W2, yb + hP * 0.5 + bw * 0.45], [-bw * 0.45, yb, bw * 0.45, yt]]) box(a0, y0, a1, y1, h, barT);
        };
        gallery.push(P(0, yb + hP * 0.5, 0));
        if (kind === 3) {                                 // turned to the wall: raw canvas, lemon bars, a paper label
          box(-W2, yb, W2, yt, 0.2, T.canvas); bars(0.5);
          const bw = 5 * s;
          edge(-W2 + bw, yb + bw, -W2 + bw, yt - bw, 0.9, 1.0); edge(W2 - bw, yb + bw, W2 - bw, yt - bw, 0.9, 1.0); edge(-W2 + bw, yt - bw, W2 - bw, yt - bw, 0.9, 1.0); edge(-W2 + bw, yb + bw, W2 - bw, yb + bw, 0.9, 1.0);
          edge(-W2 + bw, yb + hP * 0.5 - bw * 0.5, W2 - bw, yb + hP * 0.5 - bw * 0.5, 0.9, 0.8); edge(bw * 0.5, yb + bw, bw * 0.5, yt - bw, 0.9, 0.8);
          for (const [sa, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const ca = sa * (W2 - bw), cy = sy > 0 ? yt - bw : yb + bw; fan(back, [P(ca, cy, 0.7), P(ca - sa * 9 * s, cy, 0.7), P(ca, cy - sy * 9 * s, 0.7)], barT); edge(ca - sa * 9 * s, cy, ca, cy - sy * 9 * s, 1.0, 0.8, 4); }
          box(8 * s, yb + 60 * s, 25 * s, yb + 72 * s, 0.8, alt3(T.rose)); edge(10 * s, yb + 68 * s, 23 * s, yb + 68.6 * s, 1.1, 0.7, 5); edge(10 * s, yb + 64 * s, 19 * s, yb + 64.4 * s, 1.1, 0.7, 5);
          box(-W2, yb, W2, yt, -0.5, fieldT);            // its painted side, seen only from behind
        } else {
          if (kind === 2) box(-W2, yb, W2, yt, 0.1, T.canvas);
          else { const me = new THREE.Mesh(fieldPlane(new THREE.Vector3(...P(0, yb + hP * 0.5, 0)), V(e[0], 0, e[2]), V(-n[0] * lean, 1, -n[2] * lean).normalize(), w, hP), fieldMaterial(style, { single: [fieldT, fieldT] })); me.name = 'canvas-face'; me.frustumCulled = false; scene.add(me); }
          paintRoom(Q, s, kind, kind === 2 ? -1 : fieldT, back);
          if (stand) { box(-W2, yb, W2, yt, -0.6, T.canvas); bars(-0.9); }
        }
        frame(1.2); if (stand) frame(-1.1);
        if (!stand) return;
        // the stand: two legs to the floor, a ledge under the canvas, a rail; one stripe on the floor for its shadow
        for (const sd of [-1, 1]) { const la = sd * (W2 - 9 * s); box(la - 2.4, R.y0, la + 2.4, yb - 4, 0, barT); edge(la - 2.4, R.y0, la - 2.4, yb - 4, 0.4, 1.3, 14); edge(la + 2.4, R.y0, la + 2.4, yb - 4, 0.4, 1.3, 14); }
        box(-W2 - 4, yb - 5, W2 + 4, yb - 0.4, 0.3, barT); edge(-W2 - 4, yb - 5.2, W2 + 4, yb - 5.2, 0.7, 1.3, 10);
        box(-W2 + 9 * s, yb - 74, W2 - 9 * s, yb - 69, 0, barT); edge(-W2 + 9 * s, yb - 74.2, W2 - 9 * s, yb - 74.2, 0.4, 1.0, 8);
        const ft = P(W2 + 7, R.y0, 0); dabs.push({ p: [ft[0] + n[0] * 20, R.y0 + 0.4, ft[2] + n[2] * 20], a: [n[0] * 30, 0, n[2] * 30], b: [e[0] * 4.2, 0, e[2] * 4.2], tube: 7, seed: rng(), bend: 0.25 });
      };
      const alt3 = (t) => (t === way.next[0] || t === barT ? T.cobalt : t);
      for (let k = 0; k < 4; k++) {
        const kind = kindsBySlot[k], [sx, lat, deg] = SLOT[k], w = rng.range(70, 76), yb = rng.range(14, 24) + k * 2;
        if (kind === 2) lateX = sx;
        hang(sx, WIN.z + lat, deg, w, yb, kind, tubes[kind % 2], true);
        await ctx.yield();
      }
      // a fifth, hung on the far wall to the right of the tank: the room once more, in the tube the rack left out
      hang(rng.range(196, 226), R.z0 + 1.2, -90, 118, rng.range(96, 112), 0, tubes[2] ?? tubes[0], false);
      await ctx.yield();
      addFlat(back, 'canvases');
    }
    await ctx.yield();
    // the exit: a rectangle standing in the slot, rimmed by a black ribbon that does not close
    lines.push({ pts: [[-7.6, -10.6], [-7.6, 10.6], [7.6, 10.6], [7.6, -10.6]].flatMap((p, i, a) => seg3([PORTAL.x + 0.5, PORTAL.y + p[1], PORTAL.z + p[0]], [PORTAL.x + 0.5, PORTAL.y + a[(i + 1) % 4][1], PORTAL.z + a[(i + 1) % 4][0]], 8).slice(0, 8)), closed: true, width: 1.25, tube: T.black, seed: rng(), gap: 0.08 });
    await ctx.yield();

    // ---------- the guide we follow (a bumblebee: black, lemon, black, two cream wing strokes) and the butterflies ----------
    const flyers = [];
    const wingAcc = newFlat(), wingPts = [];
    for (let i = 0; i <= 30; i++) {                        // a fore lobe and a smaller hind lobe round the root, a soft notch between
      const a = -1.3 + 2.55 * i / 30, r = 0.45 + 3.9 * Math.exp(-(((a - 0.52) / 0.5) ** 2)) + 2.9 * Math.exp(-(((a + 0.66) / 0.44) ** 2)) + 0.12 * Math.sin(a * 7);
      wingPts.push([0.1 + Math.cos(a) * r, 0, -Math.sin(a) * r]);
    }
    fan(wingAcc, wingPts, T.canvas, [0.1, 0, 0]);
    const wingGeo = flatGeometry(wingAcc), wingLineGeo = contourGeometry([{ pts: wingPts, closed: false, width: 0.2, tube: T.black, seed: 0.2 }, { pts: [[0.9, 0, 0.2], [1.9, 0, 0.1], [2.8, 0, -0.5]], closed: false, width: 0.16, tube: T.black, seed: 0.7 }]);
    const bflyBody = newAcc(); blob(bflyBody, [0.26, 0.26, 2.0], T.black, { hw: 0.1, seed: 0.5, rings: 6, seg: 6 });
    const bflyBodyGeo = solidGeometry(bflyBody);
    const beeWingAcc = newFlat(), bw = [];      // a wing is one cream stroke: loaded at the tip, lifted at the root
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, t = 0.5 + 0.5 * Math.cos(a), hw = 0.95 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.6)), 0.7) + 0.08; bw.push([t * 4.6, 0.25 * t, Math.sin(a) > 0 ? hw * 0.8 - 0.5 * t : -hw - 0.5 * t]); }
    fan(beeWingAcc, bw, T.canvas);
    const beeWingGeo = flatGeometry(beeWingAcc);
    const makeFlyer = (kind, scale) => {
      const g = new THREE.Group(); g.name = kind; g.scale.setScalar(scale); scene.add(g);
      const wings = [1, -1].map((sd) => { const w = new THREE.Group(); w.scale.x = sd; g.add(w); return w; });
      if (kind === 'bee') {
        const b = newAcc();
        blob(b, [0.9, 0.86, 0.9], T.black, { m: mat(0, 0.05, -2.3), hw: 0.26, seed: 0.1, rings: 7, seg: 10 });      // head
        blob(b, [1.3, 1.22, 1.55], T.lemon, { m: mat(0, 0.1, -0.45), hw: 0.26, seed: 0.2, rings: 8, seg: 10 });     // the lemon middle, the longest dab
        blob(b, [1.16, 1.06, 1.2], T.black, { m: mat(0, -0.12, 1.85), hw: 0.26, seed: 0.3, rings: 7, seg: 10 });    // tail
        addSolid(b, 'bee-body', g, smallHalo);
        for (const w of wings) { const me = new THREE.Mesh(beeWingGeo, flatMat); me.frustumCulled = false; me.position.set(0.3, 0.7, -0.5); me.rotation.x = 0.2; me.scale.setScalar(0.8); w.add(me); }
      } else {
        const body = new THREE.Group(); for (const m of [flatMat, hullMat, smallHalo]) { const me = new THREE.Mesh(bflyBodyGeo, m); me.frustumCulled = false; body.add(me); } g.add(body);
        for (const w of wings) { const me = new THREE.Mesh(wingGeo, flatMat); me.frustumCulled = false; const li = new THREE.Mesh(wingLineGeo, lineMat); li.frustumCulled = false; w.add(me, li); }
      }
      const f = { g, wings, kind, pos: new THREE.Vector3(), prev: new THREE.Vector3(), ph: rng.range(0, 6.28) }; flyers.push(f); return f;
    };
    const guideF = makeFlyer(guide === 'bee' ? 'bee' : 'butterfly', guide === 'bee' ? 0.7 : 0.56);
    const tumblers = [makeFlyer('butterfly', 1.05), makeFlyer('butterfly', 0.9)];
    // the pair tumbles 24 m ahead of where we are at five seconds (u 0.133), right of the course: both whole in the frame there
    const tumbleC = path.pointAt(0.133 + 26 / L, new THREE.Vector3()).add(new THREE.Vector3(11.5, 1.2, 0));
    const rimLand = new THREE.Vector3(hx - 28.6, hy + hero.anchors.rimY + 1.0, hz - 10.5),      // the far rim, 13 m left of the course
      uLand = path.nearestXZ(rimLand.x, rimLand.z).u;
    await ctx.yield();

    // ---------- flower baskets at the ends of the arabesque's curls: opened blob by blob as the vine reaches them ----------
    const notNew = (list) => list.filter((c) => c !== way.next[0]);
    const blobTubes = notNew([T.rose, T.lemon, T.rose, T.lemon, T.vermilion]), leafTube = way.next[0] === T.viridian ? T.cobalt : T.viridian, bowlTube = notNew([T.canvas, T.lemon])[0];
    // o: world origin of the surface's plane coords, a/b: world axes of plane x / y, n: its normal toward the room
    const basketsOn = (map, o, a, b, n, inside, size, maxN, force = null) => {
      const list = [], c = map.z, s = map.w, W = (px, py, h) => [o[0] + a[0] * px + b[0] * py + n[0] * h, o[1] + a[1] * px + b[1] * py + n[1] * h, o[2] + a[2] * px + b[2] * py + n[2] * h];
      const ax = (dx, dy) => [a[0] * dx + b[0] * dy, a[1] * dx + b[1] * dy, a[2] * dx + b[2] * dy];
      let count = 0;
      for (let tile = 0; tile < 4; tile++) for (const tip of vine.tips) {
        const qx = tip[0] + tile * vine.period, qy = tip[1], px = map.x + c * qx - s * qy, py = map.y + s * qx + c * qy, arc = tip[2] + tile * vine.main;
        const forced = force && tile === 0 && tip === force, S = (forced ? 19 : size) * rng.range(0.85, 1.1), rot = rng.range(-0.5, 0.5), keep = rng.chance(0.62 + 0.3 * (density - 0.7) / 0.6);
        if (!forced && (!inside(px, py, S) || count >= maxN || !keep)) continue;
        count++;
        // the forced one stands: its plane tipped up about its own foot (55 degrees), so it faces the eye instead of lying as a streak
        const tl = forced ? 0.96 : 0, ct = Math.cos(tl), stl = Math.sin(tl), lift = forced ? 0.46 * S * stl + 0.3 : 0, rt2 = forced ? rot * 0.3 : rot;
        const b2 = [b[0] * ct + n[0] * stl, b[1] * ct + n[1] * stl, b[2] * ct + n[2] * stl], n2 = [n[0] * ct - b[0] * stl, n[1] * ct - b[1] * stl, n[2] * ct - b[2] * stl], c0 = W(px, py, 0);
        const W2 = (lx, ly, h) => [c0[0] + a[0] * lx + b2[0] * ly + n2[0] * h + n[0] * lift, c0[1] + a[1] * lx + b2[1] * ly + n2[1] * h + n[1] * lift, c0[2] + a[2] * lx + b2[2] * ly + n2[2] * h + n[2] * lift];
        const ax2 = (dx, dy) => [a[0] * dx + b2[0] * dy, a[1] * dx + b2[1] * dy, a[2] * dx + b2[2] * dy];
        const cr = Math.cos(rt2), sr = Math.sin(rt2), L = (x, y) => [(cr * x - sr * y) * S, (sr * x + cr * y) * S];
        const D = (x, y, hx, hy, ang, tube, k, h, bend = 0) => { const p = L(x, y), an = ang + rt2;
          list.push({ p: W2(p[0], p[1], h), a: ax2(Math.cos(an) * hx * S, Math.sin(an) * hx * S), b: ax2(-Math.sin(an) * hy * S, Math.cos(an) * hy * S), tube, seed: rng(), bend, born: arc + k * 7 }); };
        D(0, -0.17, 0.3, 0.13, 0, bowlTube, 0, 0.35); D(0, -0.3, 0.22, 0.1, 0, bowlTube, 0.5, 0.36);                 // the basket
        D(0, -0.045, 0.33, 0.022, 0, T.black, 1, 0.5, 0.5); D(0, -0.41, 0.22, 0.02, 0, T.black, 1.3, 0.5, -0.6);
        D(-0.29, -0.22, 0.15, 0.02, 1.25, T.black, 1.6, 0.5); D(0.29, -0.22, 0.15, 0.02, -1.25, T.black, 1.9, 0.5);
        D(0, 0.2, 0.36, 0.02, 0, T.black, 2.2, 0.5, 6);                                                             // its handle
        D(-0.36, 0.0, 0.2, 0.075, 2.7, leafTube, 2.5, 0.4, 0.4); D(0.36, 0.02, 0.2, 0.075, 0.45, leafTube, 3, 0.4, -0.4); D(0.04, 0.3, 0.16, 0.07, 1.5, leafTube, 3.5, 0.4);
        for (let k = 0; k < 5; k++) { const an = 2.7 - k * 0.56, r = k % 2 ? 0.2 : 0.25; D(Math.cos(an) * r, 0.02 + Math.sin(an) * r * 0.75, 0.115, 0.1, rng.range(0, 3), blobTubes[k % blobTubes.length], 4 + k, 0.55 + k * 0.03); }
      }
      return list;
    };
    const basketMesh = (list, grow, name, ro = 0, span = 16) => { if (!list.length) return null; const m = dabMaterial(style, { birth: grow, span }); const me = new THREE.Mesh(dabGeometry(list), m); me.name = name; me.frustumCulled = false; me.renderOrder = ro; scene.add(me); return me; };
    const clothMap = new THREE.Vector4(clothVine.u, clothVine.v, 0, 1);
    // the cloth's baskets are dealt from a stream of their own, named from the seed (it draws nothing from the room's): which of
    // them stand depends on what lies on the cloth, the bold fruit too, and the room's stream must not move with that
    rng = ctx.core.makeRng(ctx.core.hashSeed('cloth-baskets:' + ctx.seed));
    const clothBaskets = basketsOn(clothMap, [0, 0, 0], [1, 0, 0], [0, 0, -1], [0, 1, 0], (px, py, S) => Math.abs(px) < 104 - S * 0.4 && py > -TABLE.z1 + 20 && py < -TABLE.z0 - 14 && !blocked(px, -py, S * 0.3), 27, 7, forceTip);
    rng = roomRng;
    basketMesh(clothBaskets, growCloth, 'baskets-cloth', 4);
    const wallB = [];
    for (const x0 of vx) for (const d of basketsOn(new THREE.Vector4(x0, R.y0 + 10, 0, 1), [0, 0, R.z0], [1, 0, 0], [0, 1, 0], [0, 0, 1], (px, py, S) => px > R.x0 + 30 && px < R.x1 - 30 && py > R.y0 + 30 && py < R.y1 - 30, 42, 9)) wallB.push(d);
    const lateB = [], leftB = [];
    const splitLate = (list, lateBorn) => { const keepL = []; for (let i = 0; i < list.length; i += 15) { const c = list[i].p, lb = lateBorn(c[0], c[1], c[2]), arc0 = list[i].born;
      for (let j = i; j < i + 15 && j < list.length; j++) { if (lb === null) keepL.push(list[j]); else { list[j].born = lb + (list[j].born - arc0) / 7 * 34; lateB.push(list[j]); } } } return keepL; };
    for (const c0 of lwv) for (const d of basketsOn(new THREE.Vector4(c0, R.y0 + 10, 0, 1), [R.x0, 0, 0], [0, 0, -1], [0, 1, 0], [1, 0, 0], (px, py, S) => (px < -wz1 - S * 0.45 || px > -wz0 + S * 0.45) && px < -R.z0 - 22 && px > 260 && py > R.y0 + 30 && py < R.y1 - 30, 36, 8)) leftB.push(d);
    basketMesh(wallB, growWall, 'baskets-wall');
    basketMesh(splitLate(leftB, (x, y, z) => { const r = Math.hypot(Math.max(Math.abs(z - WIN.z) - WIN.w / 2, 0), Math.max(WIN.y0 - y, y - WIN.y1, 0)); if (r < 62) return 1500 + 10 * (20 + 195 * (1 - r / 54)) + 230;
      const zr = z - WIN.z - WIN.w / 2; return zr > 15 && zr < 236 && y < 72 ? 1500 + 10 * (15 + (200 - zr) / 1.03) + 250 : null; }), growLeft, 'baskets-left');
    basketMesh(basketsOn(new THREE.Vector4(floorVine.x, floorVine.v, -1, 0), [0, R.y0, 0], [1, 0, 0], [0, 0, -1], [0, 1, 0], (px, py) => px > R.x0 + 30 && px < 140 && py > 380 && py < -R.z0 - 30 && Math.hypot(px - hx, py + hz) > 70, 46, 8), growFloor, 'baskets-floor');
    basketMesh(lateB, U.uFront, 'baskets-late', 0, 40);
    const rwMap = new THREE.Vector4(-40, 0, 1, 0); rwMap.y = scene.getObjectByName('right-wall').material.uniforms.uVineMap.value.y;
    basketMesh(basketsOn(rwMap, [R.x1, 0, 0], [0, 0, -1], [0, 1, 0], [-1, 0, 0], (px, py) => px > -R.z1 + 40 && px < -R.z0 - 40 && py > R.y0 + 30 && py < R.y1 - 30, 44, 10), growSide, 'baskets-side');
    await ctx.yield();

    // ---------- real stroke quads on the cloth near the course: edges that visibly overlap ----------
    {
      const list = [], vd = vine.texture.image.data, VW = 512, VH = 256, nS = Math.round(7200 * detail), ang0 = [0.3 + U.uSeed.value.x * 2.3, 0.3 + U.uSeed.value.y * 2.3];
      const vineDist = (x, z) => { const qx = -z - clothVine.v, qy = -(x - clothVine.u); if (qx < 0) return 99; const u = (qx - vine.rect.x) / vine.rect.z, v = (qy - vine.rect.y) / vine.rect.w; if (v < 0 || v > 1) return 99;
        const i = Math.floor((u - Math.floor(u)) * VW) % VW, j = Math.min(VH - 1, Math.floor(v * VH)); return vd[(j * VW + i) * 2] * 8 / 255; };
      // The strokes are dealt by metres from the start along the course, as far as it runs over the cloth (to the last place from
      // which a stroke 6 m further on can still lie on the cloth), from a stream of their own. The slivers have another, named from
      // the seed, so that what the strokes' loop draws (a bend only for those it keeps) does not move them.
      const sr = rng.fork('strokes'), sv = ctx.core.makeRng(ctx.core.hashSeed('slivers:' + ctx.seed));
      let dCloth = 0; { let hi = L; for (let k = 0; k < 30; k++) { const m = (dCloth + hi) / 2; if (path.posAtDist(m, _v).z > TABLE.z0 - 3) dCloth = m; else hi = m; } }
      for (let i = 0; i < nS; i++) {
        const isNew = i >= nS * 0.4, ds = sr.range(0, dCloth), side = sr.range(-1, 1), pp = path.posAtDist(ds, _v), x = pp.x + side * Math.abs(side) * 46, z = pp.z + sr.range(-6, 6);
        const an = ang0[isNew ? 1 : 0] + sr.range(-0.35, 0.35), hl = sr.range(3.4, 4.5), hw = sr.range(1.05, 1.3), sd = sr();
        if (Math.abs(x) > 107 || z > TABLE.z1 - 3 || z < TABLE.z0 + 3) continue;
        if (isNew && (vineDist(x, z) < 4.6 || spots.some((o) => Math.hypot(x - o[0], z - o[1]) < o[2] + 2.2))) continue;
        list.push({ p: [x, 0.1, z], a: [Math.cos(an) * hl, 0, -Math.sin(an) * hl], b: [Math.sin(an) * hw, 0, Math.cos(an) * hw], tube: isNew ? 8 : 9, seed: sd, bend: sr.range(-0.25, 0.25) });
        if (i % 300 === 299) await ctx.yield();
      }
      await ctx.yield();
      const nSl = Math.round(900 * detail);                      // slivers of bare canvas left between the strokes
      for (let i = 0; i < nSl; i++) {
        if (i % 300 === 299) await ctx.yield();
        const ds = sv.range(0, dCloth), side = sv.range(-1, 1), pp = path.posAtDist(ds, _v), x = pp.x + side * Math.abs(side) * 40, z = pp.z + sv.range(-6, 6), an = ang0[1] + sv.range(-0.3, 0.3), hl = sv.range(1.4, 3.2), hw = sv.range(0.13, 0.26);
        if (Math.abs(x) > 107 || z > TABLE.z1 - 3 || z < TABLE.z0 + 3 || vineDist(x, z) < 3) continue;
        list.push({ p: [x, 0.1, z], a: [Math.cos(an) * hl, 0, -Math.sin(an) * hl], b: [Math.sin(an) * hw, 0, Math.cos(an) * hw], tube: 0, seed: sv(), bend: sv.range(-1.5, 1.5) });
      }
      await ctx.yield();
      const m = dabMaterial(style, { front: true, minPx: 1.15 }); m.depthWrite = false; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -6;
      const me = new THREE.Mesh(dabGeometry(list), m); me.name = 'cloth-strokes'; me.frustumCulled = false; me.renderOrder = 2; scene.add(me);
      await ctx.yield();
      // the floor under the tank and the last straight, seen from 200 m up: strokes laid large, slivers of canvas left between them
      const fl = [], fr = rng.fork('floor-strokes'), nF = Math.round(620 * detail);
      for (let i = 0; i < nF; i++) {
        const x = fr.range(R.x0 + 8, 90), z = fr.range(R.z0 + 8, -120), sliver = i % 5 < 3, an = ang0[1] + fr.range(-0.4, 0.4), hl = sliver ? fr.range(7, 18) : fr.range(11, 17), hw = sliver ? fr.range(0.9, 1.6) : fr.range(3.6, 5.2), sd = fr(), bd = fr.range(-0.8, 0.8);
        if (Math.hypot(x - hx, z - hz) < 47 || (Math.abs(x) < 116 && z > TABLE.z0 - 6)) continue;
        fl.push({ p: [x, R.y0 + 0.2, z], a: [Math.cos(an) * hl, 0, -Math.sin(an) * hl], b: [Math.sin(an) * hw, 0, Math.cos(an) * hw], tube: sliver ? 0 : 9, seed: sd, bend: sliver ? bd : bd * 0.3 });
      }
      const fm = new THREE.Mesh(dabGeometry(fl), m); fm.name = 'floor-strokes'; fm.frustumCulled = false; fm.renderOrder = 2; scene.add(fm);
    }
    await ctx.yield();

    // ---------- the static forms, flats, stripes and contours, merged ----------
    addSolid(solid, 'table-things');
    await ctx.yield();
    addFlat(flat, 'flats');
    await ctx.yield();
    { const m = dabMaterial(style); m.polygonOffset = true; m.polygonOffsetFactor = -3; m.polygonOffsetUnits = -10;
      const me = new THREE.Mesh(dabGeometry(dabs), m); me.name = 'stripes-and-dabs'; me.frustumCulled = false; me.renderOrder = 3; scene.add(me); }
    { const m = dabMaterial(style, { birth: growCanvas, span: 1.3 }); m.polygonOffset = true; m.polygonOffsetFactor = -3; m.polygonOffsetUnits = -10;
      const me = new THREE.Mesh(dabGeometry(lateDabs), m); me.name = 'canvas-laying'; me.frustumCulled = false; me.renderOrder = 3; scene.add(me); }
    await ctx.yield();
    addLines(lines, 'contours');
    await ctx.yield();

    // ---------- the rare event: the fish leave through the glass and swim on down the room ahead of us ----------
    const escapees = [], uCross = path.nearestXZ(hx + 8, WIN.z).u;
    const escHalo = hullMaterial(style, { halo: true, width: 0.7 });
    if (rare) {
      // each is the tank's own goldfish (the hero's fish shape: fat vermilion stroke, forked rose tail of two curved lobes, dorsal
      // dab, ventral and pectoral fins, black eye) inside a soft-edged window of the old colour, with its reflection (a separate
      // vermilion dab) keeping station over it; no flat fan
      const b = newAcc();
      blob(b, [1.5, 3.2, 7.2], T.vermilion, { m: mat(0, 0.3, 0.9), hw: 0.55, seed: 0.6, rings: 9, seg: 12, point: 1.15, wob: 0.09 });
      const bg = solidGeometry(b), refA = newFlat(); fan(refA, loop([0, 7.5, 0], [0.9, 0, 0], [0, 0, 1], 12, (a) => [1.5, 5 + 0.6 * Math.sin(a * 3)]), T.vermilion); const rg = flatGeometry(refA);
      for (let i = 0; i < nFish; i++) {
        const g = new THREE.Group(); g.name = 'escapee'; g.visible = false; scene.add(g);
        const hl = new THREE.Mesh(bg, escHalo); hl.frustumCulled = false; g.add(hl);
        const fm = new THREE.Mesh(hero.fishSide, flatMat); fm.frustumCulled = false; fm.rotation.y = Math.PI / 2; fm.scale.setScalar(1.12); g.add(fm);
        const rf = new THREE.Mesh(rg, flatMat); rf.frustumCulled = false; g.add(rf);
        // near, off, up: where it is first seen, over the water inside the glass: metres ahead of where the eye comes over the
        // rim, to the left of the course, below the course there. They stand on a ring 20 m round the tank's axis, 7.5 m under the
        // course, at even steps round its far side from the rim crossing: a rule of the place, the same for three, four or five
        const ph = (80 + (i + 0.5) / nFish * 130) * Math.PI / 180, rx = hx + 20 * Math.cos(ph), rz = hz + 20 * Math.sin(ph), ur = path.nearestXZ(rx, WIN.z).u;
        path.pointAt(ur, _v);
        g.scale.setScalar(1.15); escapees.push({ g, fm, lead: 46 + i * 14, near: Math.max((ur - uCross) * L, 4), off: rz - _v.z, up: -7.5, side: -21 - i * 8 - rng.range(0, 3), y: [-10, 12, 0, 22, -20][i] + rng.range(-3, 3), ph: rng.range(0, 6.28) });
      }
    }
    // Where escapee e is when the eye is dCam metres down the course. Until the eye is over the water it keeps its place ahead of
    // the eye inside the glass; from there it draws ahead to its lead (it only ever gains on the eye), swims out across the rim,
    // crosses the course to its lane on the right and rises or sinks to its own height. eo: what the heading needs from this.
    const eo = { d: 0, sq: 0, cr: 0, lat: 0, zo: 0, amp: 0, wv: 0, go: 0 };
    const escAt = (e, dCam, time, out) => {
      const since = Math.max(dCam - uCross * L, 0); eo.go = smoothstep(0, 75, since); eo.cr = smoothstep(22, 80, since);
      eo.d = Math.min(dCam + lerp(e.near, e.lead, smoothstep(0, 60, since)), L + 30); path.posAtDist(eo.d, out);
      const sq0 = smoothstep(0, 1, clamp((L - eo.d) / 130, 0, 1)); eo.sq = lerp(0.14, 1, sq0); eo.lat = e.side * lerp(0.2, 1, sq0 * sq0);
      eo.zo = lerp(e.off, eo.lat, eo.cr); eo.wv = time * 0.85 + e.ph; eo.amp = 13 * eo.sq * eo.cr;
      out.z += eo.zo + eo.amp * Math.sin(eo.wv); out.y += lerp(e.up, (e.y + 2.5 * Math.sin(time * 0.7 + e.ph * 2)) * lerp(0.2, 1, sq0), eo.go);
      return out;
    };
    const heroFish = hero.object.getObjectByName('goldfish'), heroRefl = hero.object.getObjectByName('reflections');

    // ---------- motion ----------
    const cw = new THREE.Vector3(), a3 = new THREE.Vector3(), b3 = new THREE.Vector3(), tg = new THREE.Vector3(), rt = new THREE.Vector3(), size = new THREE.Vector2();
    const winePA = wineGeo.getAttribute('position'), wineTop = 3 * (wineSeg + 1);
    const tailPA = tailGeo ? tailGeo.getAttribute('position') : null, tailTA = tailGeo ? tailGeo.getAttribute('tan') : null;
    const catWorld = new THREE.Vector3(CAT.x, CAT.seat + (catMood === 'asleep' ? 40 : 140), CAT.z);
    let headYaw = 0, headPitch = 0;
    const halo = U.uHalo.value;
    const face = new THREE.Vector3(), camW = new THREE.Vector3(), guidePh = rng.fork('guide').range(0, 6.28);
    const placeFlyer = (f, p, dt, flap, amp, dir = null) => {
      f.prev.copy(f.pos); f.pos.copy(p); f.g.position.copy(p);
      if (dir) a3.copy(dir); else { a3.copy(f.pos).sub(f.prev); if (a3.lengthSq() < 1e-8) a3.set(0, 0, -1); a3.y *= 0.4; } a3.normalize();
      b3.copy(p).sub(a3); f.g.lookAt(b3);
      // a butterfly is drawn the way a painter sees one: wings open toward the eye, head up, tumbling a little about that
      if (f.kind === 'butterfly') { f.g.lookAt(camW); f.g.rotateX(1.05 + 0.3 * Math.sin(flap * 0.13 + f.ph)); f.g.rotateY(0.6 * Math.sin(flap * 0.07 + f.ph * 2)); }
      // the bee's wings stand up over its back, one a little forward and one a little back: two cream strokes above three dabs
      const w = f.kind === 'bee' ? 1.08 + 0.36 * amp * Math.sin(flap) : 0.2 + 0.75 * amp * Math.sin(flap); f.wings[0].rotation.z = w; f.wings[1].rotation.z = -w;
      if (f.kind === 'bee') { f.wings[0].rotation.x = 0.42; f.wings[1].rotation.x = -0.3; }
    };
    const dLate = path.nearestXZ(-30, WIN.z).u * L, uLateEnd = Math.min(path.nearestXZ(lateX, WIN.z).u - 0.08, 0.88);
    function update(dt, time, camera, u) {
      // the front crosses the room in ten seconds; from the tank on it follows the eye, 10 units to the metre flown, for the last lick
      const ts = tOfU(u || 0), dC = (u || 0) * L, F = dC > dLate ? 1500 + 10 * (dC - dLate) : Math.min(frontAt(ts), 1500);
      hero.setFront(F); hero.update(dt, time, camera);
      if (ctx.renderer?.getDrawingBufferSize) U.uResY.value = ctx.renderer.getDrawingBufferSize(size).y;
      growCloth.value = Math.max(0, 105 * (ts - 6.8)); growSide.value = Math.max(0, 80 * (ts - 8.5)); growWall.value = Math.max(0, 210 * (ts - 10.2)); growFloor.value = Math.max(0, 75 * (ts - 10.5));
      growLeft.value = Math.min(growWall.value, 150) + 560 * clamp(((u || 0) - 0.64) / 0.28, 0, 1);
      growCanvas.value = (lateDabs.length + 2) * Math.pow(clamp(((u || 0) - 0.675) / (uLateEnd - 0.675), 0, 1), 0.8) - 0.2;
      camera.getWorldPosition(cw); camW.copy(cw);
      // the wine tilts as if the table were jogged
      const tx = 0.085 * Math.sin(time * 0.9) + 0.04 * Math.sin(time * 2.3), tz = 0.06 * Math.cos(time * 0.7);
      for (let i = 0; i <= wineSeg; i++) { const a = (i / wineSeg) * Math.PI * 2, x = Math.sin(a) * 12.9, z = Math.cos(a) * 12.9; winePA.setXYZ(wineTop + i, x, 22 + tx * x + tz * z, z); }
      winePA.needsUpdate = true; wineLine.rotation.set(tz, 0, -tx); wineLine.scale.setScalar(12.9 / 13.6);
      // the steam: three cream commas in one column out of the cup. Each comes up out of the coffee, so the lowest always stands in
      // the cup's mouth, rises curling, and thins away at the top as the next one follows it
      for (let k = 0; k < 3; k++) { const ph = (time * 0.075 + k / 3) % 1, sc = (0.6 + 0.4 * smoothstep(0, 0.4, ph)) * (1 - smoothstep(0.72, 1, ph)), cm = steamCommas[k];
        cm.position.set(OBJ.cup[0] + 3.4 * Math.sin(ph * 5.2 + k * 2.1) * ph, 13.5 + ph * 41, OBJ.cup[1] + 2.4 * Math.cos(ph * 4.1 + k) * ph); cm.scale.setScalar(Math.max(sc, 1e-3)); cm.rotation.y = ph * 2.6 + k * 2.1; }
      // shutters swing a few degrees either way. They stand ajar until the eye is off the tank; down the last straight they are swung
      // wide onto the painted garden, past square and right back beside the opening (their slats to the room, the garden clear between
      // them), and stand so from where the eye is as far from the window as the window is wide
      const openK = smoothstep(uOff * L, L - WIN.w, dC);
      for (const s of shutters) s.g.rotation.y = s.dir * (lerp(0.37, 168 * Math.PI / 180, openK) + 0.07 * Math.sin(time * 0.55 + s.ph) + 0.03 * Math.sin(time * 1.3 + s.ph * 2));
      // the cat: its head follows the nearest fish, then us; its tail curls and uncurls as one ribbon
      if (tailGeo) {
        let best = 1e9; tg.copy(cw);
        if (cw.distanceTo(catWorld) > 150) for (let i = 0; i < hero.fishCount; i++) { hero.fishWorld(i, a3); const d = a3.distanceTo(catWorld); if (d < best) { best = d; tg.copy(a3); } }
        const dx = tg.x - catWorld.x, dy = tg.y - catWorld.y, dz = tg.z - catWorld.z, k = clamp(dt * 2.2, 0, 1);
        if (catMood === 'watching') { headYaw = lerp(headYaw, clamp(Math.atan2(dx, dz), -1.25, 1.25), k); headPitch = lerp(headPitch, clamp(-Math.atan2(dy, Math.hypot(dx, dz)), -0.5, 0.6), k); }
        else { headYaw = 0.5; headPitch = 0.25 + 0.03 * Math.sin(time * 0.8); }
        headG.rotation.set(headPitch, headYaw, 0.06 * Math.sin(time * 0.4), 'YXZ');
        const curl = 0.5 + 0.5 * Math.sin(time * 0.55), flick = 0.25 * Math.sin(time * 1.7);
        let px = 30, py = 10, pz = -6, th = -0.35, yaw = 0.25;
        for (let i = 0; i < tailN; i++) {
          const t = i / (tailN - 1); tailPts[i][0] = px; tailPts[i][1] = py; tailPts[i][2] = pz;
          th += 0.02 + (0.05 + 0.3 * curl) * t * t * 2.2 + flick * 0.05 * Math.sin(t * 6 + time * 2); yaw += 0.03 * Math.sin(time * 0.6 + t * 3);
          px += Math.cos(th) * Math.cos(yaw) * 5.2; py += Math.sin(th) * 5.2; pz += Math.sin(yaw) * Math.cos(th) * 5.2 + 0.5;
        }
        for (let i = 0; i < tailN; i++) {
          const p = tailPts[i], q0 = tailPts[Math.max(i - 1, 0)], q1 = tailPts[Math.min(i + 1, tailN - 1)]; let ax = q1[0] - q0[0], ay = q1[1] - q0[1], az = q1[2] - q0[2]; const l = Math.hypot(ax, ay, az) || 1; ax /= l; ay /= l; az /= l;
          tailPA.setXYZ(i * 2, p[0], p[1], p[2]); tailPA.setXYZ(i * 2 + 1, p[0], p[1], p[2]); tailTA.setXYZ(i * 2, ax, ay, az); tailTA.setXYZ(i * 2 + 1, ax, ay, az);
        }
        tailPA.needsUpdate = true; tailTA.needsUpdate = true;
      }
      // the guide: 14 m ahead and a little below, weaving; it settles on the tank's far rim as we leave it
      const ug = (u || 0) + (16 + 18 * smoothstep(uFlank - 0.11, uFlank - 0.03, u || 0)) / L, land = smoothstep(uLand - 26 / L, uLand - 2 / L, ug);
      path.pointAt(Math.min(ug, uLand), a3); path.tangentAt(Math.min(ug, uLand), tg); rt.set(-tg.z, 0, tg.x).normalize();
      const wph = (Math.min(ug, uLand) * L) / 23 + guidePh, ws = Math.sin(wph), wv = Math.sign(ws) * Math.pow(Math.abs(ws), 0.5);
      const catK = smoothstep(uFlank - 0.2, uFlank - 0.13, ug), swp = smoothstep(uFlank - 0.02, uFlank + 0.04, ug), yawG = (0.62 * Math.cos(wph) - 0.5 * wv) * (1 - land) * (1 - 0.6 * swp);
      // over the table it wanders up to 8 m to either side of the course and back (a slow drift under the weave), rising and dipping a little
      a3.addScaledVector(rt, lerp(lerp(8.2 * Math.sin(wph * 0.5 + 0.7) + 2.6 * wv, 3.6 + 1.0 * ws, catK), -3.2 + 1.1 * ws, swp) + 0.8 * Math.sin(time * 2.9)).add(b3.set(0, -4.1 + 0.7 * Math.sin(time * 1.9) + 0.8 * Math.sin(wph * 0.8 + 1), 0)).addScaledVector(tg, 1.5 * Math.sin(time * 0.8));
      // it is held broadside to the eye (three dabs in a row, never a ball seen from behind), yawing a little as it weaves
      b3.copy(a3).sub(cw); b3.y = 0; if (b3.lengthSq() < 1e-4) b3.copy(tg); b3.normalize();
      const yk = (guide === 'bee' ? 0.14 : 0.75) + 0.22 * yawG; face.set(-b3.z * Math.cos(yk) + b3.x * Math.sin(yk), 0, b3.x * Math.cos(yk) + b3.z * Math.sin(yk));
      face.lerp(tg, 0.6 * land); face.y = tg.y * 0.3 + 0.08 * Math.cos(time * 1.9);
      a3.lerp(rimLand, land); cw.copy(a3);
      placeFlyer(guideF, cw, dt, time * (guide === 'bee' ? 36 : 9), (guide === 'bee' ? 0.75 : 0.95) * (1 - 0.8 * land), face);
      if (land > 0.98) { b3.copy(rimLand).add(a3.set(1, 0, 0.3)); guideF.g.lookAt(b3); }
      halo[0].set(cw.x, cw.y, cw.z, land > 0.5 ? 0 : 2.2);
      // two cream butterflies tumbling over the fruit
      for (let i = 0; i < 2; i++) { const f = tumblers[i], q = time * (0.8 + i * 0.23) + f.ph;
        cw.set(tumbleC.x + (i ? 3.6 : -3.4) + 1.1 * Math.cos(q) + 0.5 * Math.sin(q * 2.3), tumbleC.y + 1.1 * Math.sin(q * 1.7 + i) + (i ? 3.4 : -1.6), tumbleC.z + 2.4 * Math.sin(q) * (i ? -1 : 1) + 1.2 * Math.cos(q * 1.3));
        placeFlyer(f, cw, dt, time * 10 + f.ph, 0.8); halo[1 + i].set(cw.x, cw.y, cw.z, 4.4 - i * 0.6); }
      // rare: the fish leave
      if (rare) {
        const out = (u || 0) > uCross; heroFish.visible = !out; heroRefl.visible = !out; hero.setFishShown(!out);
        const dCam = (u || 0) * L, since = dCam - uCross * L;
        for (let i = 0; i < escapees.length; i++) { const e = escapees[i];
          // They are over the water inside the glass as we come over the rim, each ahead of the eye and 12 m and more to its left,
          // low over the water. From there each swims out across the rim and on, drawing ahead all the way, crosses the course
          // far ahead and takes its own lane on the right (lane, height and weave as before from 80 m on). They start to the side
          // and only gain on the eye, so it is never near one: a margin in space, with no test at the lens.
          escAt(e, dCam, time, a3); e.g.visible = out && eo.d < L + 4; if (!out) continue;
          // its heading is its travel: down its lane (which draws in toward the window) and, at first, across from the left
          const s1 = smoothstep(0, 1, clamp((L - eo.d - 1) / 130, 0, 1));
          const turn = Math.atan2(e.side * lerp(0.2, 1, s1 * s1) - eo.lat, 1) + Math.atan2((eo.lat - e.off) * (smoothstep(22, 80, since + 1) - eo.cr), 1 + (e.lead - e.near) * (smoothstep(0, 60, since + 1) - smoothstep(0, 60, since)));
          const on = smoothstep(4, -8, eo.zo);
          const yaw = turn + (0.12 + 0.43 * eo.sq) * on + Math.atan(eo.amp * 0.85 * Math.cos(eo.wv) / 22) * 1.25 + 0.14 * Math.sin(time * 4.2 + e.ph);
          e.g.position.copy(a3); e.g.scale.setScalar(lerp(0.9, 1.15, eo.go)); e.g.rotation.set(0, Math.PI / 2 + yaw, 0.1 * Math.sin(time * 2.1 + e.ph)); }
      }
    }

    const uAt = (x, z) => path.nearestXZ(x, z).u, bk = clothVine.basket;
    const uTableEnd = uAt(12, -312), uFlank = uAt(33, -446), uRim = uAt(-8, -476), uOff = uAt(-50, -472), wTank = 1 - (1 - 0.74) * (1 - 0.75), lookAhead = 22, galAim = new THREE.Vector3(), tankAim = new THREE.Vector3(), rimAim = new THREE.Vector3(), tankAim2 = new THREE.Vector3(), fishAim = new THREE.Vector3(), _fw = new THREE.Vector3();
    scene.background = new THREE.Color().setRGB(U.uOldA.value.x, U.uOldA.value.y, U.uOldA.value.z);
    update(0, 0, { getWorldPosition: (v) => v.copy(path.start) }, 0);
    return {
      scene, path, duration, pace,
      title: way.name === 'red over blue' ? 'The Room Turning Red' : way.name === 'blue over red' ? 'The Room Turning Blue' : way.name === 'rose over viridian' ? 'The Room Turning Rose' : 'The Room Turning Yellow',
      camera: { fov: 62, near: 0.4, far: 2600, lookAhead, sway: 0.5, bank: 0.28 },
      pois: [
        { at: [bk[0], 7, bk[1]], from: uAt(pathXAtZ(bk[1] + 64), bk[1] + 64), to: uAt(pathXAtZ(bk[1] + 6), bk[1] + 6), weight: 0.45 },
        // ONE pull holds the tank, from the table's end to the far rim. It stands for three that lay one on another on the tank's axis
        // (0.74 to its top from the table's end, 0.75 a little higher on the sweep, 0.85 down into the water): its weight is what the first
        // two made together, 1 - (1 - 0.74)(1 - 0.75), its span is their three spans joined, and its aim goes from the one height to the
        // other and down into the water by their weights. How far the gaze has come off the course onto the tank (k1, k2, k3: each of the
        // three over its own span, as it was) is in the aim itself: a point between the course ahead and the tank, as far off as the tank.
        // So the default camera looks where it did, the aims are fixed heights (no lift), and nothing is stacked.
        { at: (time, u) => {
            const k1 = 0.74 * bell(u, uTableEnd - 0.1, uFlank + 0.09, 0.3), k2 = 0.75 * bell(u, uFlank - 0.07, uRim, 0.3), k3 = 0.85 * smoothstep(uRim - 0.015, uRim - 0.015 + 0.3 * (uOff - uRim + 0.015), u), k12 = 1 - (1 - k1) * (1 - k2);
            path.pointAt(u, _v);
            if (rare) { tankAim.set(0, 0, 0); for (const e of escapees) tankAim.addScaledVector(escAt(e, u * L, time, _fw), 1 / escapees.length); fishAim.set(hx, hy + 33, hz).lerp(tankAim, smoothstep(uCross - 18 / L, uCross + 4 / L, u)); }
            else fishAim.set(hx, hy + 33, hz);
            tankAim2.set(hx, hy + 32 + 12 * k2 / Math.max(k2 + k1 * (1 - k2), 1e-6), hz).lerp(fishAim, k3 / Math.max(k3 + k12 * (1 - k3), 1e-6));
            path.pointAt(u + lookAhead / L, rimAim).sub(_v).setLength(tankAim2.distanceTo(_v)).add(_v);       // the course ahead (the camera's own look-ahead), as far off as the tank
            return rimAim.lerp(tankAim2, (1 - (1 - k12) * (1 - k3)) / wTank);
          }, from: uTableEnd - 0.1, to: uOff, fade: 0.3 * (uOff - uRim + 0.015) / (uOff - uTableEnd + 0.1), weight: wTank },       // (its end eases over the same metres as the third's did)
        { at: (time, u) => { const cxp = path.pointAt(u, _v).x, k = smoothstep(-60, -215, cxp), a = gallery[2], b = gallery[0]; galAim.set(lerp(a[0], b[0], k), lerp(a[1], b[1], k) - 6, lerp(a[2], b[2], k)); galAim.lerp(tankAim.set(WIN.x, 66, WIN.z + 25), 0.7 * smoothstep(-165, -235, cxp));       // near the window the gaze comes back, so the last canvas is whole in the frame
          return rare ? galAim.lerp(tankAim.set(cxp - 200, 62, WIN.z - 30), 0.6) : galAim; }, from: 0.645, to: 0.93, fade: 0.2, weight: 0.42 },
      ],
      portal: { shape: 'rect', width: 14, height: 20, color: '#F1E6CC', glow: 0, halo: false, veil: '#F1E6CC', blendDistance: 25, revealDistance: 300 },
      // exact colour: flat = 1 skips the tone map, so every tube reaches the screen as its own hex (nothing is pre-corrected)
      post: { exposure: EXPOSURE, flat: 1, bloom: { strength: 0, radius: 0.1, threshold: 1.5 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { hero.dispose(); if (guide !== 'bee') beeWingGeo.dispose(); if (!rare) { escHalo.dispose(); hero.fishSide.dispose(); } },
    };
  },
};
