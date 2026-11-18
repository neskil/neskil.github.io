// The Ground Turns. You look north from a headland at night; a cottage window goes dark; then the stars stay exactly where
// they are while the whole coast, sea and sleeper and all, swings 52 degrees round the pole star until the edge of the sea
// rolls off a sun that never moved. Two frames: the SKY FRAME is engine space and never moves (stars, Milky Way, sun, exit
// ring); the LAND FRAME is one group whose matrix is written from u alone (see ../parts/the-ground-turns.js).
// Land positions below are (east, north) in metres from the entry: x = east, z = -north.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath } from '../kit/core.js';
import { makeDevice, groundY } from '../parts/the-ground-turns.js';

const D2R = Math.PI / 180;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// give a geometry one flat albedo (linear) and a material id as attributes, drop uv, make it non-indexed so everything merges.
// aMat.x: 0 whitewash, 1 drystone, 2 slate, 3 thorn wood and leaf, 4 the far headland, 5 dressed stone, 6 paint, 7 bare limestone. aMat.y: how far the wind moves it.
function tint(g, r, gg, b, mat = 0, sway = 0) {
  const n = g.index ? g.toNonIndexed() : g; if (n !== g) g.dispose();
  n.deleteAttribute('uv'); if (!n.getAttribute('normal')) n.computeVertexNormals();
  const N = n.getAttribute('position').count, c = new Float32Array(N * 3), m = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) { c[i * 3] = r; c[i * 3 + 1] = gg; c[i * 3 + 2] = b; m[i * 2] = mat; m[i * 2 + 1] = sway; }
  n.setAttribute('color', new THREE.BufferAttribute(c, 3)); n.setAttribute('aMat', new THREE.BufferAttribute(m, 2));
  return n;
}
const box = (x0, x1, y0, y1, z0, z1) => new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);

export default {
  id: 'the-ground-turns',
  name: 'The Ground Turns',
  category: 'sky',
  weirdness: 0.3,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#04070E');

    // ---- the seeded look: the lights of the land, the sea, the latitude, and the rare morning star
    const vr = rng.fork('night');
    const lights = vr.pick(['slope', 'mole', 'three']);
    const lat = vr.chance(0.4) ? 37 : 30;
    const calmSeed = vr.chance(0.4);
    const calm = (vary.hour === 'dawn' || vary.hour === 'day') ? true : (vary.hour === 'night' || vary.hour === 'golden') ? false : calmSeed;
    const rare = !!vary.rare;

    // ---- the path: one dead straight line due north, a constant 2 degree climb, 1500 m (only the portal lives on it)
    const path = makePath([[0, 0, 0], [0, 52.3, -1499]]);

    // ---- the village: lamps on the far headland between azimuth 10 and 26 degrees east of north, 2500 m off
    const SEA_Y = -58, lr = rng.fork('lamps'), lamps = [];
    const lampAt = (azDeg, h, rad = 2500) => new THREE.Vector3(Math.sin(azDeg * D2R) * rad, SEA_Y + h, -Math.cos(azDeg * D2R) * rad);
    if (lights === 'slope') {
      const hs = lr.shuffle([8, 13, 19, 24, 30, 35, 41, 46, 52, 58, 64, 70]);                 // no two share a height
      for (let i = 0; i < 12; i++) lamps.push(lampAt(10 + 16 * (i + lr.range(-0.3, 0.3)) / 11, hs[i], 2500 + hs[i] * 1.4));
    } else if (lights === 'mole') {
      for (let i = 0; i < 9; i++) lamps.push(lampAt(10.5 + 15 * i / 8, 5, 2380));              // a ruled line at sea level: a comb of arcs
    } else {
      lamps.push(lampAt(11.5, 9, 2440), lampAt(18, 44, 2540), lampAt(25, 70, 2600));           // a quay, a farm, a mast: three nested rings
    }
    const order = lr.shuffle(lamps.map((_, i) => i)), lampOutU = [];
    for (let r = 0; r < lamps.length; r++) lampOutU[order[r]] = 0.78 + 0.10 * (r + 1) / lamps.length;   // the brief's beat: they go out one by one from u 0.78 to 0.88, the r-th of n at 0.78 + 0.10 (r + 1) / n
    await ctx.yield();

    const CIS = { x: 6, z: -42, r: 2.62, y: groundY(3, 39) + 0.84 };                         // the cistern stands level on the low side of the slope
    // the rocks that stand in the bay, right of the Milky Way (azimuth 44 east, 460 m off): [east, z, radius at the waterline, height]
    const SEAROCKS = [[319.5, -330.9, 21, 108], [266, -296, 17, 21], [303, -258, 9, 8]];
    const dev = await makeDevice(ctx, { path, lat, lamps, lampOutU, rare, calm, detail, seaY: SEA_Y, cistern: CIS, seaRocks: SEAROCKS });
    scene.add(dev.land, dev.sky);
    const land = dev.land, M = dev.materials;
    await ctx.yield();

    // ---- the headland: short grass, level under the lens, falling gently to the cliff edge 96 m north; east of the track
    // the cliff turns back into a cove, so the sea lies open on the right, under the village and the Milky Way
    const edgeN = (x) => 96 - 43 * sstep(9, 24, x) - 9 * sstep(24, 150, x) + 2.6 * ctx.noise.n2(x * 0.021, 3.7) + 1.0 * ctx.noise.n2(x * 0.09, 9.1);
    const xs = []; for (let x = -520; x <= 520; x += (Math.abs(x) < 70 ? 2.5 : Math.abs(x) < 160 ? 6 : 24)) xs.push(x);
    const rowsN = [-160, -90, -50, -30, -18, -10]; for (let n = -4; n <= 100; n += 4) rowsN.push(n);
    const gp = [], gk = [], gi = [], NR = rowsN.length + 4;
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i], e = edgeN(x), ye = groundY(x, e), jag = ctx.noise.n2(x * 0.05, 1.3), jag2 = ctx.noise.n2(x * 0.17, 6.1);
      for (const n of rowsN) { const nn = Math.min(n, e - 0.6); gp.push(x, groundY(x, nn), -nn); gk.push(0); }
      gp.push(x, ye - 0.05, -e); gk.push(0.3);                                                   // the lip: turf curling over
      gp.push(x, ye - 1.6, -(e + 0.7 + 0.5 * jag2)); gk.push(1);
      gp.push(x, ye - 14 - 4 * jag2, -(e + 2.8 + 2.4 * jag)); gk.push(1);                        // the face, a little ragged
      gp.push(x, SEA_Y - 3, -(e + 10 + 3 * jag)); gk.push(1);
      if (i % 60 === 59) await ctx.yield();
    }
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < NR - 1; j++) { const a = i * NR + j, b = a + NR; gi.push(a, b, a + 1, a + 1, b, b + 1); }
    const groundG = new THREE.BufferGeometry(); groundG.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
    groundG.setAttribute('aK', new THREE.Float32BufferAttribute(gk, 1)); groundG.setIndex(gi);
    const ground = new THREE.Mesh(groundG, M.ground); ground.frustumCulled = false; ground.name = 'headland'; land.add(ground);
    await ctx.yield();

    // ---- the cast, all in the land frame, all one merged mesh: each thing is there to show the tilt or to be carried
    const parts = [], W = [0.50, 0.49, 0.46], WH = [0.78, 0.765, 0.72], SL = [0.200, 0.218, 0.262], BK = [0.27, 0.275, 0.235];
    const tri = (pts, col, mat = 0) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); g.computeVertexNormals(); return tint(g, col[0], col[1], col[2], mat); };
    // WALL: drystone, 1.2 m high, battered, with a cope of upright stones, straight along east -3.5 from north -15 to the cliff:
    // with the track, the hands of the clock. It follows the fall of the ground.
    const wr = rng.fork('wall'), wallEnd = edgeN(-3.5) - 1.2, wx = -3.5, wpts = [];
    let hPrev = 1.08, nPrev = -15;
    for (let n = -15 + 1.3; n < wallEnd + 1.3; n += 1.3) {
      const n1 = Math.min(n, wallEnd), h1 = 1.08 + wr.range(-0.06, 0.06), y0 = groundY(wx, nPrev), y1 = groundY(wx, n1);
      const A = (dx, y, nn) => [wx + dx, y, -nn];
      const q = (a, b, c, d) => wpts.push(a, b, c, a, c, d);
      q(A(-0.36, y0 - 0.3, nPrev), A(-0.36, y1 - 0.3, n1), A(-0.25, y1 + h1, n1), A(-0.25, y0 + hPrev, nPrev));      // west face
      q(A(0.36, y1 - 0.3, n1), A(0.36, y0 - 0.3, nPrev), A(0.25, y0 + hPrev, nPrev), A(0.25, y1 + h1, n1));          // east face
      q(A(-0.25, y0 + hPrev, nPrev), A(-0.25, y1 + h1, n1), A(0.25, y1 + h1, n1), A(0.25, y0 + hPrev, nPrev));      // top
      hPrev = h1; nPrev = n1;
    }
    parts.push(tri(wpts, W, 1));
    parts.push(tri([[wx - 0.36, groundY(wx, -15) - 0.3, 15], [wx + 0.36, groundY(wx, -15) - 0.3, 15], [wx + 0.25, 1.08, 15], [wx - 0.36, groundY(wx, -15) - 0.3, 15], [wx + 0.25, 1.08, 15], [wx - 0.25, 1.08, 15]], W, 1));
    const cope = new THREE.BoxGeometry(0.5, 0.26, 0.11);
    for (let n = -15, i = 0; n < wallEnd; n += 0.19 + wr.range(0, 0.05), i++) {
      const g = cope.clone(); g.rotateX(wr.range(-0.5, -0.1)).rotateY(wr.range(-0.12, 0.12)).scale(1 + wr.range(-0.12, 0.12), 1 + wr.range(-0.25, 0.3), 1);
      const sh = 0.75 + 0.4 * wr();
      parts.push(tint(g.translate(wx + wr.range(-0.03, 0.03), groundY(wx, n) + 1.19, -n), W[0] * sh, W[1] * sh, W[2] * sh, 5));
      if (i % 150 === 149) await ctx.yield();
    }
    // CROSS WALL AND GATEWAY: a second drystone wall crossing the headland at north 12.5, with two dressed gateposts where the
    // track goes through and a five-bar gate left half open. It is the threshold of the first seconds: a level stone line under
    // the level sea line, passed beneath before the land begins to turn (out of the frame by u 0.10, before the window goes dark). No rng: a fixed hash.
    { const XN = 12.5, hx = (i) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }, cw = [];
      const q = (a, b, c, d) => cw.push(a, b, c, a, c, d);
      for (const [xa, xb] of [[-32, -2.1], [2.1, 32]]) {
        let hP = 1.02, xP = xa;
        for (let x = xa + 1.3, i = 0; x < xb + 1.3; x += 1.3, i++) {
          const x1 = Math.min(x, xb), h1 = 1.02 + 0.12 * (hx(i + xa) - 0.5), y0 = groundY(xP, XN), y1 = groundY(x1, XN), B = (xx, y, dn) => [xx, y, -(XN + dn)];
          q(B(x1, y1 - 0.3, -0.36), B(xP, y0 - 0.3, -0.36), B(xP, y0 + hP, -0.25), B(x1, y1 + h1, -0.25));          // south face
          q(B(xP, y0 - 0.3, 0.36), B(x1, y1 - 0.3, 0.36), B(x1, y1 + h1, 0.25), B(xP, y0 + hP, 0.25));              // north face
          q(B(xP, y0 + hP, -0.25), B(x1, y1 + h1, -0.25), B(x1, y1 + h1, 0.25), B(xP, y0 + hP, 0.25));              // top
          hP = h1; xP = x1;
        }
        for (let x = xa, i = 0; x < xb; x += 0.19 + 0.05 * hx(i * 3 + xa), i++) {                                    // the cope of upright stones
          const g = cope.clone(); g.rotateX(-0.1 - 0.4 * hx(i + 7.5)).rotateY(Math.PI / 2 + 0.24 * (hx(i + 2.5) - 0.5)).scale(1, 1 + 0.55 * hx(i + 4.5) - 0.25, 1 + 0.24 * (hx(i + 1.5) - 0.5));
          const sh = 0.75 + 0.4 * hx(i + 9.5);
          parts.push(tint(g.translate(x, groundY(x, XN) + 1.13, -XN + 0.06 * (hx(i + 5.5) - 0.5)), W[0] * sh, W[1] * sh, W[2] * sh, 5));
        }
        await ctx.yield();
      }
      parts.push(tri(cw, [W[0] * 0.84, W[1] * 0.84, W[2] * 0.84], 1));                                          // a shade quieter than the long wall
      for (const gx of [-1.85, 1.85]) {                                                                              // the gateposts, capped
        parts.push(tint(box(gx - 0.26, gx + 0.26, -0.3, 1.5, -XN - 0.26, -XN + 0.26), 0.56, 0.55, 0.50, 5));
        parts.push(tint(new THREE.ConeGeometry(0.42, 0.30, 4).rotateY(Math.PI / 4).translate(gx, 1.65, -XN), 0.50, 0.49, 0.45, 5));
      }
      const gate = [], GL = 2.95, T = [0.47, 0.45, 0.39];                                                           // weathered oak, hung on the east post
      for (const y of [0.22, 0.44, 0.66, 0.92, 1.2]) gate.push(box(0.05, GL, y - 0.06, y + 0.06, -0.03, 0.03));
      for (const [l, top] of [[0.09, 1.42], [GL - 0.06, 1.27]]) gate.push(box(l - 0.06, l + 0.06, 0.12, top, -0.045, 0.045));
      gate.push(new THREE.BoxGeometry(Math.hypot(GL - 0.2, 0.98), 0.09, 0.035).rotateZ(Math.atan2(0.98, GL - 0.2)).translate(GL / 2, 0.71, 0.04));   // the brace
      for (let i = 0; i < gate.length; i++) { const sh = 0.85 + 0.3 * hx(i + 40.5);
        parts.push(tint(gate[i].rotateY(Math.PI - 44 * D2R).translate(1.56, 0, -XN - 0.05), T[0] * sh, T[1] * sh, T[2] * sh, 6)); }
    }
    cope.dispose();
    await ctx.yield();
    // COTTAGE: whitewashed, 12 by 5.5 m, eaves 2.6 m, slate roof with its ridge at 5.5 m, south wall at north 62
    const cx0 = -19, cx1 = -7, cz0 = -67.5, cz1 = -62, ridgeZ = (cz0 + cz1) / 2, cy = groundY(-13, 62);
    const cparts = [];
    cparts.push(tint(box(cx0, cx1, -1.2, 2.6, cz0, cz1), WH[0], WH[1], WH[2], 0));
    for (const x of [cx0, cx1]) cparts.push(tri([[x, 2.6, cz0], [x, 2.6, cz1], [x, 5.5, ridgeZ]], WH, 0));                              // the gables
    const ov = 0.38, ey = 2.6 - 0.22, ry = 5.6;
    cparts.push(tri([[cx0 - ov, ey, cz1 + ov], [cx1 + ov, ey, cz1 + ov], [cx1 + ov, ry, ridgeZ], [cx0 - ov, ey, cz1 + ov], [cx1 + ov, ry, ridgeZ], [cx0 - ov, ry, ridgeZ]], SL, 2));
    cparts.push(tri([[cx1 + ov, ey, cz0 - ov], [cx0 - ov, ey, cz0 - ov], [cx0 - ov, ry, ridgeZ], [cx1 + ov, ey, cz0 - ov], [cx0 - ov, ry, ridgeZ], [cx1 + ov, ry, ridgeZ]], SL, 2));
    cparts.push(tint(box(cx0 - ov, cx1 + ov, ey - 0.1, ey + 0.02, cz1 + ov - 0.06, cz1 + ov + 0.04), 0.05, 0.055, 0.065, 6));           // the eaves board
    cparts.push(tint(box(cx0 - ov - 0.02, cx1 + ov + 0.02, ry - 0.04, ry + 0.1, ridgeZ - 0.12, ridgeZ + 0.12), 0.07, 0.075, 0.09, 6)); // ridge tiles
    for (const x of [cx0 + 0.95, cx1 - 0.95]) {                                                                                         // a chimney at each gable, with a pot
      cparts.push(tint(box(x - 0.5, x + 0.5, 4.1, 6.5, ridgeZ - 0.48, ridgeZ + 0.48), WH[0], WH[1], WH[2], 0));
      cparts.push(tint(box(x - 0.58, x + 0.58, 6.5, 6.64, ridgeZ - 0.56, ridgeZ + 0.56), 0.30, 0.29, 0.27, 5));
      cparts.push(tint(new THREE.CylinderGeometry(0.15, 0.19, 0.5, 8).translate(x, 6.89, ridgeZ), 0.16, 0.10, 0.07, 6));
    }
    // the door: planks in sea-green paint, in a shadowed reveal under a stone lintel, with a step
    const RV = [0.27, 0.27, 0.26], PT = [0.50, 0.51, 0.49], LN = [0.40, 0.39, 0.36], zf = cz1;
    cparts.push(tint(box(-15.86, -14.44, -0.1, 2.16, zf - 0.02, zf + 0.02), RV[0], RV[1], RV[2], 6));
    cparts.push(tint(box(-15.7, -14.6, 0, 2.02, zf, zf + 0.05), 0.040, 0.078, 0.086, 6));
    for (let i = 1; i < 5; i++) cparts.push(tint(box(-15.7 + i * 0.22 - 0.012, -15.7 + i * 0.22 + 0.012, 0.02, 2.0, zf + 0.05, zf + 0.056), 0.012, 0.022, 0.026, 6));   // the joints between planks
    cparts.push(tint(box(-15.98, -14.32, 2.16, 2.40, zf - 0.02, zf + 0.06), LN[0], LN[1], LN[2], 5));
    cparts.push(tint(box(-15.9, -14.4, -0.25, 0.06, zf, zf + 0.7), 0.42, 0.41, 0.38, 5));                                                // its step
    // the window: a shadowed reveal, a painted frame with a mullion and a transom, a stone lintel and sill
    const wx0 = -11.3, wx1 = -9.9, wy0 = 0.95, wy1 = 2.05, fz0 = zf + 0.045, fz1 = zf + 0.10;
    cparts.push(tint(box(wx0 - 0.16, wx1 + 0.16, wy0 - 0.06, wy1 + 0.16, zf - 0.02, zf + 0.025), RV[0], RV[1], RV[2], 6));
    for (const [a0, a1, b0, b1] of [[wx0 - 0.02, wx0 + 0.07, wy0, wy1], [wx1 - 0.07, wx1 + 0.02, wy0, wy1], [wx0, wx1, wy0 - 0.02, wy0 + 0.07], [wx0, wx1, wy1 - 0.07, wy1 + 0.02],
      [(wx0 + wx1) / 2 - 0.03, (wx0 + wx1) / 2 + 0.03, wy0, wy1], [wx0, wx1, wy0 + 0.62, wy0 + 0.67]]) cparts.push(tint(box(a0, a1, b0, b1, fz0, fz1), PT[0], PT[1], PT[2], 6));
    cparts.push(tint(box(wx0 - 0.28, wx1 + 0.28, wy1 + 0.16, wy1 + 0.40, zf - 0.02, zf + 0.06), LN[0], LN[1], LN[2], 5));
    cparts.push(tint(box(wx0 - 0.2, wx1 + 0.2, wy0 - 0.15, wy0 - 0.06, zf - 0.02, zf + 0.17), LN[0], LN[1], LN[2], 5));                 // the sill
    // a small window high in the east gable (unlit: one household, one lamp) and a rain butt at the corner
    cparts.push(tint(box(cx1 - 0.02, cx1 + 0.03, 3.25, 4.05, ridgeZ - 0.42, ridgeZ + 0.42), RV[0], RV[1], RV[2], 6));
    cparts.push(tint(box(cx1 + 0.03, cx1 + 0.05, 3.33, 3.97, ridgeZ - 0.34, ridgeZ + 0.34), 0.012, 0.018, 0.034, 6));
    cparts.push(tint(box(cx1 + 0.05, cx1 + 0.08, 3.33, 3.97, ridgeZ - 0.025, ridgeZ + 0.025), PT[0], PT[1], PT[2], 6));
    cparts.push(tint(new THREE.CylinderGeometry(0.42, 0.38, 1.1, 14).translate(cx1 + 0.55, 0.3, zf + 0.55), 0.10, 0.085, 0.07, 6));
    for (const g of cparts) parts.push(g.translate(0, cy, 0));
    // the washing, left out overnight on a line across the yard: white linen that hangs by the land's gravity and stirs in the
    // west wind (the hem moves, the line does not). It is carried with the sleeper.
    { const wr2 = rng.fork('washing'), A = [-16.2, 52.6], B = [-10.6, 56.8], L = Math.hypot(B[0] - A[0], B[1] - A[1]), dx = (B[0] - A[0]) / L, dn = (B[1] - A[1]) / L;
      const yl = (f) => groundY(A[0] + dx * L * f, A[1] + dn * L * f) + 2.15 - 0.22 * Math.sin(Math.PI * f);        // the line sags a little
      for (const P of [A, B]) parts.push(tint(box(P[0] - 0.07, P[0] + 0.07, groundY(P[0], P[1]) - 0.2, groundY(P[0], P[1]) + 2.3, -P[1] - 0.07, -P[1] + 0.07), 0.16, 0.14, 0.11, 6));
      let f = 0.07;
      for (const [w, h, c] of [[1.7, 1.55, 0.74], [0.8, 0.7, 0.60], [1.3, 1.1, 0.70], [1.6, 1.6, 0.76]]) {     // a short line, inside the frame to the end
        const f1 = f + w / L, NS = 4, free = 0.7 + 0.6 * wr2();
        for (let k = 0; k < NS; k++) {                                                                // four bands from line to hem: the lower, the freer
          const t0 = k / NS, t1 = (k + 1) / NS, q = [];
          for (const [ff, tt] of [[f, t0], [f1, t0], [f1, t1], [f, t1]]) q.push([A[0] + dx * L * ff, yl(ff) - h * tt, -(A[1] + dn * L * ff)]);
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([q[0], q[1], q[2], q[0], q[2], q[3]].flat(), 3)); g.computeVertexNormals();
          const sh = c * (1 - 0.05 * k);
          const tg = tint(g, sh, sh * 0.99, sh * 0.95, 6, 0), am = tg.getAttribute('aMat');
          [t0, t0, t1, t0, t1, t1].forEach((tt, v) => am.setY(v, 0.2 + 2.3 * tt * tt * free));       // per corner, so the bands stay joined
          parts.push(tg);
        }
        f = f1 + wr2.range(0.02, 0.05);
      }
    }
    // CISTERN: a round stone tank 6 m across, its rim level and 0.9 m above the high side of the slope, brim full
    const cis = dev.cistern, rimY = cis.y + 0.06, cisBase = groundY(cis.x + 3, -cis.z + 3) - 0.4;
    const lathe = new THREE.LatheGeometry([new THREE.Vector2(3.06, cisBase), new THREE.Vector2(3.0, rimY - 0.12), new THREE.Vector2(3.05, rimY - 0.1), new THREE.Vector2(3.05, rimY),
      new THREE.Vector2(cis.r - 0.04, rimY), new THREE.Vector2(cis.r - 0.04, rimY - 0.07), new THREE.Vector2(cis.r, rimY - 0.08), new THREE.Vector2(cis.r, rimY - 0.4)], 56);
    parts.push(tint(lathe.translate(cis.x, 0, cis.z), 0.55, 0.535, 0.49, 5));
    // DEW POND: a clay-lined pond by the track, kerbed with field stones, brim full: the near water. Stars lie in it as points from
    // the first frame, large in the lower right, and slide across it once the land begins to turn. The lens has passed it by u 0.25.
    const POND = { x: 8.6, n: 21, sx: 1.95, sz: 1.35 };
    { const k = new THREE.LatheGeometry([new THREE.Vector2(3.02, -0.35), new THREE.Vector2(2.96, 0.14), new THREE.Vector2(2.84, 0.23), new THREE.Vector2(2.66, 0.2), new THREE.Vector2(2.6, 0.02), new THREE.Vector2(2.6, -0.3)], 44);
      parts.push(tint(k.scale(POND.sx, 1, POND.sz).translate(POND.x, 0, -POND.n), 0.47, 0.46, 0.425, 1));
      const pr = rng.fork('pond');
      for (let i = 0; i < 26; i++) {                                                              // field stones set on the kerb, no two alike
        const a = (i + pr.range(-0.3, 0.3)) / 26 * Math.PI * 2, g = new THREE.IcosahedronGeometry(1, 1), s = pr.range(0.22, 0.42), sh = 0.8 + 0.4 * pr();
        g.scale(s * pr.range(1, 1.6), s * 0.62, s * pr.range(0.8, 1.3)).rotateY(pr.range(0, 3.1));
        parts.push(tint(g.translate(POND.x + Math.cos(a) * 2.86 * POND.sx, 0.17, -POND.n + Math.sin(a) * 2.86 * POND.sz), 0.50 * sh, 0.49 * sh, 0.45 * sh, 7));
      }
      const pw = new THREE.Mesh(new THREE.CircleGeometry(2.62, 40).rotateX(-Math.PI / 2), M.water);
      pw.position.set(POND.x, 0.07, -POND.n); pw.scale.set(POND.sx, 1, POND.sz); pw.name = 'pond-water'; land.add(pw); }
    await ctx.yield();
    // THORN: one wind-bent hawthorn 7.5 m tall at (-5, 60), leaning east with the wind, black: a second vertical. Its twigs
    // and leaves stir (aMat.y), its trunk does not.
    const tr = rng.fork('thorn'), up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), ty = groundY(-5, 60), leafP = [];
    const limb = (p, d, len, r0, depth) => {
      const r1 = Math.max(0.035, r0 * 0.70), g = new THREE.CylinderGeometry(r1, r0, len, depth > 2 ? 7 : 5, 1, true).translate(0, len / 2, 0);
      g.applyQuaternion(q.setFromUnitVectors(up, d)).translate(p.x, p.y, p.z); parts.push(tint(g, BK[0], BK[1], BK[2], 3, Math.max(0, (4 - depth) / 4) ** 2 * 0.7));
      const tip = p.clone().addScaledVector(d, len);
      if (depth <= 2) for (let i = 0; i < (depth === 2 ? 10 : 26); i++) {              // dark leaf sprays, combed east by the wind: the crown's mass
        const c = p.clone().addScaledVector(d, len * tr.range(0.25, 1.1)).add(new THREE.Vector3(tr.range(-0.3, 0.75), tr.range(-0.22, 0.3), tr.range(-0.45, 0.45)));
        const a = new THREE.Vector3(tr.range(-1, 1), tr.range(-0.5, 0.5), tr.range(-1, 1)).normalize().multiplyScalar(tr.range(0.22, 0.42));
        const bb = new THREE.Vector3(tr.range(-1, 1), tr.range(-0.6, 0.6), tr.range(-1, 1)).normalize().multiplyScalar(tr.range(0.18, 0.34));
        leafP.push([c.x - a.x, c.y - a.y, c.z - a.z], [c.x + a.x, c.y + a.y, c.z + a.z], [c.x + bb.x + 0.1, c.y + bb.y, c.z + bb.z]);
      }
      if (depth <= 0) return;
      const kids = depth > 3 ? 2 : 3;
      for (let i = 0; i < kids; i++) {
        const nd = d.clone().add(new THREE.Vector3(tr.range(-0.5, 0.9) + 0.42, tr.range(-0.3, 0.55), tr.range(-0.7, 0.7))).normalize();
        limb(i === 0 ? tip : p.clone().addScaledVector(d, len * tr.range(0.45, 0.9)), nd, len * tr.range(0.6, 0.8), r1 * (i === 0 ? 1 : 0.75), depth - 1);
      }
    };
    limb(new THREE.Vector3(-6.2, ty - 0.2, -60), new THREE.Vector3(0.30, 1, 0.03).normalize(), 3.3, 0.36, 5);
    { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(leafP.flat(), 3)); g.computeVertexNormals(); parts.push(tint(g, 0.040, 0.056, 0.036, 3, 1)); }
    await ctx.yield();
    // OUTCROPS: four low slabs of the headland's own limestone east of the track: by night pale lumps that lean with the land,
    // at sunrise the things whose long shadows lie across the grass and the track
    const ROCKS = [[3.0, 52.5, 1.5, 1.15, 1.1], [9.5, 60, 2.1, 1.5, 1.6], [13.5, 49.5, 1.7, 0.95, 1.3], [2.6, 71, 1.2, 0.8, 0.9]], rockBox = [];
    for (let i = 0; i < ROCKS.length; i++) {
      const [rx, rn, rw, rh, rd] = ROCKS[i], g0 = new THREE.IcosahedronGeometry(1, 2), gy0 = groundY(rx, rn);
      g0.deleteAttribute('uv'); g0.deleteAttribute('normal'); const g = mergeVertices(g0, 1e-3), pa = g.getAttribute('position'); g0.dispose();
      for (let v = 0; v < pa.count; v++) {
        const x = pa.getX(v), y = pa.getY(v), z = pa.getZ(v);
        const j = 1 + 0.30 * ctx.noise.n2(x * 1.7 + i * 9.1, z * 1.7 + y * 2.3) + 0.12 * ctx.noise.n2(x * 5.1 + 3, y * 5.1 + z * 4.3 + i);
        const yy = Math.round((y * j * 0.5 + 0.5) * 5) / 5;                                     // stepped beds
        pa.setXYZ(v, rx + x * j * rw * (1 - 0.25 * yy), gy0 - 0.25 + (0.6 * yy + 0.4 * (y * j * 0.5 + 0.5)) * (rh + 0.25), -rn + z * j * rd * (1 - 0.25 * yy));
      }
      g.computeVertexNormals(); parts.push(tint(g, 0.43, 0.42, 0.385, 7));
      rockBox.push([[rx - rw * 0.72, gy0 - 1, -rn - rd * 0.72], [rx + rw * 0.72, gy0 + rh * 0.9, -rn + rd * 0.72]]);
    }
    await ctx.yield();
    // FAR HEADLAND: a low dark back across the bay, 2500 m away, azimuth 6 to 28 degrees east, 110 m high, with a broken skyline
    const hp = [], hi = [];
    const hprof = (az) => 110 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (az - 4.5) / 25)))), 0.6) * (0.74 + 0.2 * ctx.noise.n2(az * 0.35, 5.5) + 0.07 * ctx.noise.n2(az * 1.9, 2.2));
    const HR = [[2430, -1.5, 0], [2452, 0.2, 14], [2500, 0.5, 0], [2560, 0.82, 0], [2620, 1, 0], [2700, 0.7, 0], [2860, -0.02, -1.5]];
    let col = 0;
    for (let az = 4.5; az <= 29.51; az += 0.25, col++) {
      const sn = Math.sin(az * D2R), c = Math.cos(az * D2R), H = hprof(az);
      for (const [r, f, add] of HR) hp.push(sn * r, SEA_Y + Math.max(f * H + (H > 3 ? add : 0), -1.5), -c * r);
      if (az > 4.5) for (let j = 0; j < HR.length - 1; j++) { const a = (col - 1) * HR.length + j, b = a + HR.length; hi.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(hp, 3)); hg.setIndex(hi); hg.computeVertexNormals();
    parts.push(tint(hg, 0.040, 0.045, 0.052, 4));
    // THE STACK: a pillar of the same bedded stone the sea has cut off from the coast, with a skerry and a reef at its foot. A
    // third upright for the land's clock, alone on the right where there was only water: it leans with the sea line all night
    // and stands black against the dawn. It stays 47 degrees and more from the pole, so it never crosses a lamp's arc or the sun.
    { const [sx, sz, sr, sh] = SEAROCKS[0], NA = 30, NH = 28, sp = [], si2 = [];
      const prof = (t) => { const P = [[0, 1.05], [0.10, 0.74], [0.42, 0.60], [0.66, 0.68], [0.80, 0.56], [0.93, 0.40], [1, 0.24]]; let k = 0; while (k < P.length - 2 && t > P[k + 1][0]) k++;
        const f = Math.min(1, Math.max(0, (t - P[k][0]) / (P[k + 1][0] - P[k][0]))); return P[k][1] + (P[k + 1][1] - P[k][1]) * f; };
      for (let j = 0; j < NH; j++) for (let i = 0; i < NA; i++) {
        const t = j / (NH - 1), a = i / NA * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        const bed = (Math.floor(t * 17 + 0.6 * ctx.noise.n2(ca * 1.3 + 4, sa * 1.3)) % 2) ? 0.05 : -0.03;                          // ledges where the softer beds have gone
        const r = sr * prof(t) * (1 + 0.20 * ctx.noise.n2(ca * 1.6 + 9.1, sa * 1.6 + t * 4.2) + 0.08 * ctx.noise.n2(ca * 5 + t * 9, sa * 5 + 2.2) + bed) * (1 + 0.16 * ca);
        sp.push(sx + ca * r, SEA_Y - 3 + t * (sh + 3) + (j === NH - 1 ? 0 : 1.2 * ctx.noise.n2(a * 2, t * 20)), sz + sa * r);
      }
      sp.push(sx, SEA_Y + sh + 2.5, sz);
      for (let j = 0; j < NH - 1; j++) for (let i = 0; i < NA; i++) { const a = j * NA + i, b = j * NA + (i + 1) % NA; si2.push(a, a + NA, b, b, a + NA, b + NA); }
      for (let i = 0; i < NA; i++) si2.push((NH - 1) * NA + i, NH * NA, (NH - 1) * NA + (i + 1) % NA);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); g.setIndex(si2); g.computeVertexNormals();
      parts.push(tint(g, 0.125, 0.122, 0.118, 8));
      for (let k = 1; k < SEAROCKS.length; k++) {
        const [rx, rz, rr, rh] = SEAROCKS[k], g0 = new THREE.IcosahedronGeometry(1, 3); g0.deleteAttribute('uv'); g0.deleteAttribute('normal');
        const gk2 = mergeVertices(g0, 1e-3), pa = gk2.getAttribute('position'); g0.dispose();
        for (let v = 0; v < pa.count; v++) { const x = pa.getX(v), y = pa.getY(v), z = pa.getZ(v), j = 1 + 0.32 * ctx.noise.n2(x * 1.9 + k * 7, z * 1.9 + y) + 0.12 * ctx.noise.n2(x * 6, z * 6 + y * 4);
          pa.setXYZ(v, rx + x * j * rr * (1.25 - 0.3 * y), SEA_Y - 2 + Math.max(0, y * j) * (rh + 2) * (0.75 + 0.5 * ctx.noise.n2(x * 2.4, z * 2.4 + 5)), rz + z * j * rr * 0.8); }
        gk2.computeVertexNormals(); parts.push(tint(gk2, 0.12, 0.118, 0.112, 8));
      }
    }
    await ctx.yield();
    // ---- flight2: THE NEEDLE ON ITS TERRACE. The land's own hand: a white stone needle at the track's end, plumb on the land's
    // meridian (east 0), its point under the star the land turns about; two level steps of the wall's stone under it. One rigid
    // stone of the land: no lamp, no glass, no band, no door; pale by albedo alone, lit by the sky as the cottage is, each face by
    // its own normal. It reads edgeN(0), groundY and constants only: no u, no eye, no lens, no stream, no clock. Because it is
    // plumb and on the meridian, the line from its foot through its point passes through the pole star at every turn: a
    // consequence of where it stands. (In this file: the NE line, the TERRACE block, the NEEDLE block, and the setBox(8) line
    // below; in the part file: box slot 8, material code 9 and its coordinate line. Each comes out by removing its own lines.)
    const NE = { n: edgeN(0) - 9.5, hd0: 3.0, hd1: 2.4, hs: 22, hp: 7, bare: 3, lo: 5.6, up: 4.4, step: 0.6, west: -3.0, sb: 1.1 };   // the axis 9.5 m south of the cliff edge on the meridian; metres, all of it
    NE.y = groundY(0, NE.n - NE.lo) + 2 * NE.step;                                                                    // the terrace's top: the long wall's height (1.2 m) above the ground at the lower step's south edge
    // flight2 TERRACE: two level steps of the long wall's stone (tone W, the wall's own material), 0.6 m each; the lower reaches
    // 5.6 m from the axis to south, east and north, the upper 4.4 m; nothing west of east -3.0, so the long wall (its east face
    // at -3.14) stands whole and free beside it; each goes 0.5 m under the lowest ground it covers (its north edge: the ground falls north)
    for (const [a, top] of [[NE.lo, NE.y - NE.step], [NE.up, NE.y]]) parts.push(tint(box(NE.west, a, groundY(0, NE.n + a) - 0.5, top, -NE.n - a, -NE.n + a), W[0], W[1], W[2], 1));
    // flight2 NEEDLE: a solid square shaft set corner-on to the track (its arrises to south, east, north and west; the south one on
    // the track's centre line, the west one at east -3.0): half-diagonal 3.0 m at the terrace, 2.4 m at 22 m; on it a 7 m point of
    // the same stone. The lowest 3 m bare stone in the wall's tone, the rest whitewash; one material (code 9) for all of it
    { const LW = [0.66, 0.645, 0.61], bare = [], lw = [], apex = [0, NE.y + NE.hs + NE.hp, -NE.n];
      const A = (k, h) => { const a = NE.hd0 + (NE.hd1 - NE.hd0) * h / NE.hs, d = [[0, 1], [1, 0], [0, -1], [-1, 0]][k & 3]; return [d[0] * a, NE.y + h, -NE.n + d[1] * a]; };   // arris k (south, east, north, west) at height h
      for (let k = 0; k < 4; k++) {
        for (const [h0, h1, to] of [[0, NE.bare, bare], [NE.bare, NE.hs, lw]]) to.push(A(k, h0), A(k + 1, h0), A(k + 1, h1), A(k, h0), A(k + 1, h1), A(k, h1));
        lw.push(A(k, NE.hs), A(k + 1, NE.hs), apex); }
      parts.push(tri(bare, W, 9), tri(lw, LW, 9)); }
    dev.uniforms.uNeedle.value.set(0, NE.y, -NE.n);                                                                    // flight2 NEEDLE: where it stands, for its own surface in the part file (code 9: blocks, worn wash, damp foot; the damp ring on the upper step): east 0, the terrace's top, the axis's z
    await ctx.yield();
    const cast = new THREE.Mesh(mergeGeometries(parts, false), M.solid); cast.frustumCulled = false; cast.name = 'cast'; land.add(cast);
    for (const g of parts) g.dispose();
    await ctx.yield();
    // the one window in the south wall: lit until u 0.10, dark by u 0.12. It lights nothing.
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.1), M.window); win.position.set(-10.6, cy + 1.5, cz1 + 0.04); win.name = 'window'; land.add(win);
    // the dawn shadows are analytic: four boxes in the land frame (wall, cottage, cistern, thorn)
    dev.setBox(0, [-3.8, -9, -wallEnd], [-3.2, groundY(wx, 40) + 1.25, 15]); dev.setBox(1, [cx0, cy - 1, cz0], [cx1, cy + 4.3, cz1]);
    dev.setBox(2, [cis.x - 2.9, cisBase, cis.z - 2.9], [cis.x + 2.9, rimY, cis.z + 2.9]); dev.setBox(3, [-7.6, ty + 1.5, -62.2], [-2.2, ty + 7.6, -58.2]);
    for (let i = 0; i < rockBox.length; i++) dev.setBox(4 + i, rockBox[i][0], rockBox[i][1]);
    dev.setBox(8, [-NE.sb, NE.y - 1, -NE.n - NE.sb], [NE.sb, NE.y + NE.hs, -NE.n + NE.sb]);                             // flight2: the needle's dawn shadow (a box inside the shaft: 1.1 m east and north of the axis, from 1 m under the terrace's top to the shoulder; the point casts none)
    await ctx.yield();

    // ---- GRASS: blades within 80 m, bending in a steady west wind, tips catching the sky
    const NG = Math.round(90000 * detail * Math.min(1.2, density)), gr = rng.fork('grass'), off = new Float32Array(NG * 4);
    for (let i = 0; i < NG; i++) {
      let x = 0, n = 0;
      for (let k = 0; k < 6; k++) {
        x = gr.gauss() * 13; n = -8 + 84 * Math.pow(gr(), 1.2);
        if (Math.abs(x) > 1.4 && Math.abs(x + 3.5) > 0.55 && !(Math.abs(n - 12.5) < 0.5 && Math.abs(x) < 32.2) && n < edgeN(x) - 0.4 && !(x > cx0 - 0.4 && x < cx1 + 0.4 && n > 61.6 && n < 68) && Math.hypot(x - cis.x, n + cis.z) > 3.3 && Math.hypot((x - POND.x) / POND.sx, (n - POND.n) / POND.sz) > 3.08) break;
      }
      off[i * 4] = x; off[i * 4 + 1] = -n; off[i * 4 + 2] = gr.range(0.16, 0.36); off[i * 4 + 3] = gr();
      if (i % 4000 === 3999) await ctx.yield();
    }
    const bladeG = new THREE.InstancedBufferGeometry();
    bladeG.setAttribute('position', new THREE.Float32BufferAttribute([-0.035, 0, 0, 0.035, 0, 0, 0, 1, 0], 3));
    bladeG.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4)); bladeG.instanceCount = NG;
    const grass = new THREE.Mesh(bladeG, M.grass); grass.frustumCulled = false; grass.name = 'grass'; land.add(grass);
    await ctx.yield();

    return {
      scene, path, duration: 42, pace: () => 1,
      title: 'The Ground Turns',
      camera: { fov: 80, sway: 0, bank: 0, near: 0.5, far: 20000 },
      pois: [],
      portal: { shape: 'circle', radius: 7, color: '#DCE6FF', glow: 0.5, halo: false, style: 'ring', revealDistance: 150, blendDistance: 25 },
      post: { exposure: 1.25, bloom: { strength: 0.5, radius: 0.45, threshold: 1.0 },
        grade: { saturation: 1.05, contrast: 1.06, shadowTint: '#050A16', vignette: 0.25, grain: 0.03 } },
      ride: 'none', companion: 'none', style: 'none',
      update(dt, time, camera, u) { dev.update(dt, time, camera, u, ctx.renderer); },
      dispose() {},
    };
  },
};
