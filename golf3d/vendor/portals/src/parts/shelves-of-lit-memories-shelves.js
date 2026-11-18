// SHELVES OF LIT MEMORIES: the shelf walls, their orbs, the lanes' floor and the plain (the shelves' builder).
// WHAT STANDS WHERE (metres; d is metres to the LEFT of the plan's spine, s metres along it from its start):
//  THE ROUTE'S OWN LANE: floor from d -9 to 9; its two walls' middles at d +12.5 and -12.5, 7 m thick, 38 m tall, from the spine's
//   start to 5 m short of the chasm's rim, where each ends in a plain pier and a round head (radius 3.5). The faces toward the lane
//   are REAL: a plinth 2.5 m tall, twelve recesses 2.6 m deep (boards 0.4 m thick, tops at 2.5 m and every 3 m), a rounded cap.
//   THE ORBS (radius 1, every 2.6 m along the spine, their middles 10.3 m from it, 1 m over their board) stand as true balls from
//   z -215 to each wall's pier (about 5,860 of them, 20 triangles each); north of that the lane's faces are drawn with their
//   depth as the fold walls' faces are (so that from above every lane looks alike), and the real recesses begin with the balls.
//   COLOURS BY DISTRICT along the spine's z: GOLD to -110, BLUE to 40, GOLD with patches of RED (z 48 to 150) and GREEN (z 120 to
//   226) to 230, VIOLET with patches of gold to the mouth; borders waver by the shelf; single orbs differ and a few are dim grey.
//   THE ROLLING SHELF: the left (east, outer) wall's fifth shelf (orbs' middles at y 15.5) between z 56 and 166 (the second bend):
//   its balls roll south along it at 1.3 m a second by the clock, mixed colours, coming in and going out small at its two ends.
//  THE FOLDS BESIDE: four more walls either side (middles at d 37.5, 62.5, 87.5, 112.5 and their mirrors), true walls whose
//   shelves and balls the wall's shader draws with their depth, ending in round heads 5 m short of the rim; each begins south of
//   any bend tighter than its own offset (see wallStart), so none folds on itself; the floor between them out to d 125 either side.
//  THE FAR FOLDS: eighteen more true walls either side, copies of the spine's own curve shifted in x (middles 154 m and every
//   26 m to 596 m from it), from z -470 to z 520 or to 5 m short of the rim, a round head at both ends; shelves and balls drawn
//   with their depth as on the folds beside. No lane between any two walls is under 15.7 m wide.
//  THE PLAIN: one drawn ground from the chasm's rim out to 4.2 km (see plainMat), 0.3 m under the true floor: among the true
//   walls it is the lanes' dark floor with the pools at their feet; beyond them drawn folds take up the walls' lines, turn into
//   loops and whorls, and far off melt into broad soft bands and the haze.
// TRIANGLES (counted): the lane's two walls 37,600, the eight fold walls 14,200, the thirty-six far walls 42,500, the floor
//   10,200, the plain 1,500, the balls 117,100 when every one is in the picture: 223,100 at the most.
// DENSITY (ctx.vary.density) deals the share of grey orbs (2.5 to 6 in a hundred) and the patches' length (0.7 to 1.3 times).
import * as THREE from 'three';
import * as PLAN from './shelves-of-lit-memories-plan.js';
import { orbMat, wallMat, floorMat, plainMat, TEX_W, TEX_H, ROW1 } from './shelves-of-lit-memories-shelfmat.js';

const { LANE, CHASM, ORB, spineAt } = PLAN;
const DS = LANE.orbDs, H = LANE.wallH, HALF = LANE.wall / 2, FACE = LANE.lane / 2, DEEP = 2.6, STEP = 5.2;

export async function buildShelves(ctx, shared) {
  const group = new THREE.Group(); group.name = 'shelves';
  const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed('shelves-' + name + ':' + ctx.seed));
  const dn = Math.min(1, Math.max(0, ((ctx.vary && Number.isFinite(ctx.vary.density) ? ctx.vary.density : 1) - 0.7) / 0.6));      // 0 the sparsest deal (density 0.7), 1 the densest (1.3)

  // ---- the spine by its own length: a table of places, then at(s)
  const NT = (PLAN.SPINE.length - 1) * 40, TB = new Float64Array((NT + 1) * 5);
  for (let k = 0, s = 0; k <= NT; k++) { const p = spineAt(k / 40); if (k) s += Math.hypot(p[0] - TB[(k - 1) * 5], p[1] - TB[(k - 1) * 5 + 1]); TB.set([p[0], p[1], p[2], p[3], s], k * 5); }
  const STOT = TB[NT * 5 + 4];
  const at = (s) => { let lo = 0, hi = NT; const ss = Math.min(Math.max(s, 0), STOT);
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (TB[m * 5 + 4] <= ss) lo = m; else hi = m; }
    const a = lo * 5, b = hi * 5, f = (ss - TB[a + 4]) / Math.max(TB[b + 4] - TB[a + 4], 1e-6), l = (i) => TB[a + i] + (TB[b + i] - TB[a + i]) * f;
    const tx = l(2), tz = l(3), n = Math.hypot(tx, tz) || 1; return { x: l(0), z: l(1), tx: tx / n, tz: tz / n, s: ss }; };
  const rimGap = (s, d) => { const p = at(s); return Math.hypot(p.x + p.tz * d - CHASM.x, p.z - p.tx * d - CHASM.z) - CHASM.r; };
  // where a wall whose middle runs d left of the spine ends: 5 m short of the rim (a search with a most)
  const wallEnd = (d) => { let lo = STOT * 0.5, hi = STOT; if (rimGap(hi, d) > 5) return hi;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (rimGap(m, d) > 5) lo = m; else hi = m; } return lo; };
  // where a wall may begin: south of any bend of the spine's first 240 m that is tighter than the wall's far face is far from the
  // spine (plus 8 m) on the wall's own side, so that no offset wall folds on itself (the spine bends 69 m tight near z -430, on
  // the right hand, and kinks at its very start); never north of 6 m along
  const wallStart = (dFar, sg) => { let s0 = 6; for (let s = 2; s < 240; s += 2) { const a = at(s - 1), b = at(s + 1), turn = (a.tx * b.tz - a.tz * b.tx) / 2;      // a turn to the right is positive
    if (-sg * turn * (dFar + 8) > 1) s0 = Math.max(s0, s + 4); } return s0; };
  const secs = (s0, s1) => { const n = Math.max(1, Math.ceil((s1 - s0) / STEP)), out = []; for (let i = 0; i <= n; i++) out.push(at(s0 + (s1 - s0) * i / n)); return out; };

  // ---- THE DEAL of the lane's orbs: one texel an orb (rgb its colour, a how bright); rows 0-11 the left face, 16-27 the right
  const NC = Math.min(TEX_W, Math.ceil(STOT / DS)), data = new Uint8Array(TEX_W * TEX_H * 4), dice = new Float32Array(TEX_W * TEX_H);
  const PAL = [ORB.gold, ORB.blue, ORB.red, ORB.green, ORB.violet, ORB.grey].map((h) => new THREE.Color(h));
  const pr = stream('patches'), pw = 0.7 + 0.6 * dn, patches = [];
  const patch = (z0, z1, id) => { const a = pr(), b = pr(), c = pr(), e = pr(), f = pr(); patches.push({ z: z0 + (z1 - z0) * a, j: Math.floor(b * 12), f: c < 0.5 ? 0 : 1, L: (9 + 12 * e) * pw, hh: 1 + Math.floor(f * 3), id }); };
  for (let i = 0; i < 6; i++) patch(48, 150, 2);
  for (let i = 0; i < 6; i++) patch(120, 226, 3);
  for (let i = 0; i < 8; i++) patch(250 + i * 14, 392, 0);                              // gold comes back toward the mouth
  for (let i = 0; i < 4; i++) patch(-450, -140, 2 + (i % 3));                           // a patch or two in the long golden stretch
  const or = stream('orbs'), grey = 0.025 + 0.035 * dn;
  for (let f = 0; f < 2; f++) for (let j = 0; j < 12; j++) { const row = j + f * ROW1;
    for (let i = 0; i < NC; i++) { const d1 = or(), d2 = or(), d3 = or(), d4 = or(), d5 = or(), d6 = or();
      const zc = at((i + 0.5) * DS).z, zb = zc + 10 * Math.sin(j * 1.1 + f * 2.3) + (d1 - 0.5) * 14;
      let id = zb < -110 ? 0 : zb < 40 ? 1 : zb < 230 ? 0 : 4, bright = 1;
      for (const p of patches) if (p.f === f && Math.abs(j - p.j) <= p.hh && Math.abs(zc - p.z) < p.L * (0.8 + 0.4 * d6)) id = p.id;
      if (d3 < 0.045) id = Math.floor(d4 * 4.999);
      if (d2 < grey) { id = 5; bright = 0.9; }
      const c = PAL[id], k = (row * TEX_W + i) * 4; data[k] = Math.round(c.r * 255); data[k + 1] = Math.round(c.g * 255); data[k + 2] = Math.round(c.b * 255); data[k + 3] = Math.round(bright * 255);
      dice[row * TEX_W + i] = d5; }
    await ctx.yield(); }
  const tex = new THREE.DataTexture(data, TEX_W, TEX_H, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const cellAtZ = (z) => { let best = 0; for (let i = 0; i < NC; i++) if (at((i + 0.5) * DS).z <= z) best = i; return best; };
  const endL = wallEnd(HALF + FACE), endR = wallEnd(-(HALF + FACE)), PIER = 1.6;
  const iR0 = cellAtZ(-215), iR1 = [Math.floor((endL - PIER - 0.2) / DS), Math.floor((endR - PIER - 0.2) / DS)];      // each face's balls stand to its own pier
  const uni = { uOrbTex: { value: tex }, uRoll: { value: new THREE.Vector4(4, cellAtZ(56), cellAtZ(166), 1.3) }, uReal: { value: new THREE.Vector2(iR0, Math.max(iR1[0], iR1[1])) } };

  // ---- sweeping a profile along the spine. A segment: [d0, y0, d1, y1, nd, ny, kind, dep0, dep1, face] (d left of the spine;
  // (nd, ny) its normal across and up). own: the metres along are the face's own (a drawn face), else the spine's
  const acc = () => ({ P: [], N: [], A: [], I: [] });
  const sweep = (g, ss, segs, own) => { for (const [d0, y0, d1, y1, nd, ny, kind, dep0, dep1, face] of segs) { const base = g.P.length / 3; let a0 = 0, a1 = 0, px0 = 0, pz0 = 0, px1 = 0, pz1 = 0;
    for (let i = 0; i < ss.length; i++) { const c = ss[i], X0 = c.x + c.tz * d0, Z0 = c.z - c.tx * d0, X1 = c.x + c.tz * d1, Z1 = c.z - c.tx * d1;
      if (i) { a0 += Math.hypot(X0 - px0, Z0 - pz0); a1 += Math.hypot(X1 - px1, Z1 - pz1); } px0 = X0; pz0 = Z0; px1 = X1; pz1 = Z1;
      g.P.push(X0, y0, Z0, X1, y1, Z1); g.N.push(c.tz * nd, ny, -c.tx * nd, c.tz * nd, ny, -c.tx * nd);
      g.A.push(own ? a0 : c.s, dep0, kind, face, own ? a1 : c.s, dep1, kind, face);
      if (i) { const k = base + (i - 1) * 2; g.I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } } } };
  // a flat wall across the lane's direction at a place (closing a wall's section), and a round head at a wall's end
  const cross = (g, c, dA, dB, face) => { const base = g.P.length / 3;
    for (const [d, y] of [[dA, 0], [dB, 0], [dA, H], [dB, H]]) { g.P.push(c.x + c.tz * d, y, c.z - c.tx * d); g.N.push(-c.tx * face, 0, -c.tz * face); g.A.push(0, 0, 2, 0); }
    g.I.push(base, base + 1, base + 2, base + 1, base + 3, base + 2); };
  const head = (g, c, dm) => { const ex = c.x + c.tz * dm, ez = c.z - c.tx * dm, n = 10, rings = [[HALF, 0], [HALF, H - 0.3], [HALF - 0.3, H], [0, H]];
    for (let r = 0; r < 3; r++) { const base = g.P.length / 3, [r0, y0] = rings[r], [r1, y1] = rings[r + 1], up = r === 0 ? 0 : r === 1 ? 0.7 : 1, out = Math.sqrt(1 - up * up);
      for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + Math.PI * i / n, ux = Math.cos(a) * c.tx + Math.sin(a) * c.tz, uz = Math.cos(a) * c.tz - Math.sin(a) * c.tx;
        g.P.push(ex + ux * r0, y0, ez + uz * r0, ex + ux * r1, y1, ez + uz * r1); g.N.push(ux * out, up, uz * out, ux * out, up, uz * out); g.A.push(0, 0, 2, 0, 0, 0, 2, 0);
        if (i) { const k = base + (i - 1) * 2; g.I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } } } };
  const mesh = (g, mat, name) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(g.P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.N, 3));
    geo.setAttribute('aA', new THREE.Float32BufferAttribute(g.A, 4)); geo.setIndex(g.I); const m = new THREE.Mesh(geo, mat); m.name = name; m.frustumCulled = false; group.add(m); return m; };
  const mWall = wallMat(shared, uni), mFloor = floorMat(shared, uni), mOrb = orbMat(shared, uni);

  // ---- THE LANE'S TWO WALLS: the real face toward the lane, a drawn face away from it
  let tris = 0;
  for (const sg of [1, -1]) { const g = acc(), f0 = sg > 0 ? 0 : ROW1, end = sg > 0 ? endL : endR, D = (dep) => sg * (FACE + dep), inw = -sg, real = [];
    real.push([D(0), 0, D(0), LANE.shelf0, inw, 0, 0, 0, 0, f0]);
    for (let j = 0; j < 12; j++) { const yb = LANE.shelf0 + LANE.shelfDy * j, yo = j < 11 ? yb + DEEP : H - 0.4, yn = j < 11 ? yb + LANE.shelfDy : H - 0.25;
      real.push([D(0), yb, D(DEEP), yb, 0, 1, 0, 0, DEEP, f0], [D(DEEP), yb, D(DEEP), yo, inw, 0, 0, DEEP, DEEP, f0], [D(DEEP), yo, D(0), yo, 0, -1, 0, DEEP, 0, f0], [D(0), yo, D(0), yn, inw, 0, 0, 0, 0, f0]); }
    const cap = [[D(0), H - 0.25, D(0.3), H, inw * 0.64, 0.77, 2, 0, 0, 0], [D(0.3), H, D(HALF), H, 0, 1, 2, 0, 0, 0]];
    const outer = [[D(HALF), H, D(2 * HALF - 0.3), H, 0, 1, 2, 0, 0, 0], [D(2 * HALF - 0.3), H, D(2 * HALF), H - 0.3, sg * 0.7, 0.7, 2, 0, 0, 0], [D(2 * HALF), H - 0.3, D(2 * HALF), 0, sg, 0, 1, sg, sg, sg > 0 ? 1 : 2]];
    // north of the true balls (they begin at z -215) the lane's own face is drawn with its depth as its neighbours' faces are,
    // so that from above the lane looks as every other lane does; the real recesses begin where the balls do
    const st = wallStart(FACE + 2 * HALF, sg), sJ = iR0 * DS, north = secs(st, sJ), body = secs(sJ, end - PIER), pier = secs(end - PIER, end);
    sweep(g, body, real, false); sweep(g, secs(st, end - PIER), cap, false); sweep(g, secs(st, end), outer, true);
    sweep(g, north, [[D(0), 0, D(0), H - 0.25, inw, 0, 1, inw, inw, sg > 0 ? 100 : 101]], true);
    sweep(g, pier, [[D(0), 0, D(0), H - 0.25, inw, 0, 2, 0, 0, 0], ...cap], false);
    cross(g, body[body.length - 1], D(0), D(HALF), 1); cross(g, body[0], D(0), D(DEEP), -1); cross(g, north[0], D(0), D(2 * HALF), 1); head(g, at(end), sg * (FACE + HALF));
    tris += g.I.length / 3; mesh(g, mWall, 'lane-wall'); await ctx.yield(); }

  // ---- THE FOLDS BESIDE: four more walls either side, true walls with drawn faces; then the floor of all the lanes
  const fold = acc(); let fi = 3;
  for (const sg of [1, -1]) for (let k = 1; k <= 4; k++) { const dm = sg * (HALF + FACE + LANE.pitch * k), end = wallEnd(dm), a = dm - HALF, b = dm + HALF, st = wallStart(Math.abs(dm) + HALF, sg);
    sweep(fold, secs(st, end), [[a, 0, a, H - 0.3, -1, 0, 1, -1, -1, fi++], [a, H - 0.3, a + 0.3, H, -0.7, 0.7, 2, 0, 0, 0], [a + 0.3, H, b - 0.3, H, 0, 1, 2, 0, 0, 0], [b - 0.3, H, b, H - 0.3, 0.7, 0.7, 2, 0, 0, 0], [b, H - 0.3, b, 0, 1, 0, 1, 1, 1, fi++]], true);
    cross(fold, at(st), a, b, 1); head(fold, at(end), dm); await ctx.yield(); }
  tris += fold.I.length / 3; mesh(fold, mWall, 'fold-walls');
  // ---- THE FAR FOLDS: eighteen more true walls either side, each a copy of the spine's own curve SHIFTED IN x (a shifted copy never
  // folds on itself): middles 154 m and every 26 m to 596 m from the curve, from z -470 to z 520 or to 5 m short of the rim, a round
  // head at both ends. The lanes between them are 15.7 to 19 m wide (narrowest where the curve slants most); the lane between the
  // first of them and the outermost offset wall is never under 15.8 m (measured against the plan's spine)
  const far = acc(), XC = (z) => -48 * Math.cos(0.0116355 * (z - 381)), XS = (z) => 48 * 0.0116355 * Math.sin(0.0116355 * (z - 381));
  for (const sg of [1, -1]) for (let m = 0; m < 18; m++) { const X = sg * (154 + 26 * m); let z1 = 520;
    for (let z = -470; z <= 520; z += 1) if (Math.hypot(XC(z) + X - CHASM.x, z - CHASM.z) < CHASM.r + 5 + HALF) { z1 = z - 1; break; }
    const n = Math.ceil((z1 + 470) / 9), ss = [];
    for (let i = 0; i <= n; i++) { const z = -470 + (z1 + 470) * i / n, sl = XS(z), l = Math.hypot(sl, 1); ss.push({ x: XC(z) + X, z, tx: sl / l, tz: 1 / l, s: 0 }); }
    sweep(far, ss, [[-HALF, 0, -HALF, H - 0.3, -1, 0, 1, -1, -1, fi++], [-HALF, H - 0.3, -HALF + 0.3, H, -0.7, 0.7, 2, 0, 0, 0], [-HALF + 0.3, H, HALF - 0.3, H, 0, 1, 2, 0, 0, 0],
      [HALF - 0.3, H, HALF, H - 0.3, 0.7, 0.7, 2, 0, 0, 0], [HALF, H - 0.3, HALF, 0, 1, 0, 1, 1, 1, fi++]], true);
    head(far, ss[n], 0); head(far, { x: ss[0].x, z: ss[0].z, tx: -ss[0].tx, tz: -ss[0].tz }, 0);
    if (m % 3 === 2) await ctx.yield(); }
  tris += far.I.length / 3; mesh(far, mWall, 'far-walls');
  const fl = acc(), lines = [-125]; for (let k = -5; k <= 3; k++) lines.push(k * 25 + 16, k * 25 + 25, k * 25 + 34); lines.push(125);
  const fs = secs(0, STOT);
  for (let q = 0; q + 1 < lines.length; q++) { const base = fl.P.length / 3;
    for (let i = 0; i < fs.length; i++) { const c = fs[i]; for (const d of [lines[q], lines[q + 1]]) { fl.P.push(c.x + c.tz * d, 0, c.z - c.tx * d); fl.N.push(0, 1, 0); fl.A.push(d, c.s, c.tx, c.tz); }
      if (i) { const k = base + (i - 1) * 2; fl.I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } } }
  tris += fl.I.length / 3; mesh(fl, mFloor, 'lane-floor'); await ctx.yield();

  // ---- THE ORBS that stand as true balls: a hull of 20 triangles each (it encloses the ball with a quarter to spare, for the far look, and its lowest corners stay inside the 0.4 m board), in stretches
  // of 48 places along the lane so that what is out of the picture is not drawn
  const hull = new THREE.IcosahedronGeometry(1.2584 * 1.28, 0), M = new THREE.Matrix4(); let orbs = 0;
  for (let f = 0; f < 2; f++) { const sg = f ? -1 : 1;
    for (let i0 = iR0; i0 < iR1[f]; i0 += 48) { const i1 = Math.min(i0 + 48, iR1[f]), n = (i1 - i0) * 12, geo = hull.clone(), AI = new Float32Array(n * 4), AT = new Float32Array(n * 2);
      const im = new THREE.InstancedMesh(geo, mOrb, n); let q = 0;
      for (let i = i0; i < i1; i++) { const c = at((i + 0.5) * DS), x = c.x + c.tz * sg * (FACE + 1.3), z = c.z - c.tx * sg * (FACE + 1.3);
        for (let j = 0; j < 12; j++, q++) { const row = j + f * ROW1; M.makeTranslation(x, LANE.shelf0 + LANE.orbR + LANE.shelfDy * j, z); im.setMatrixAt(q, M);
          AI.set([i, row, dice[row * TEX_W + i], LANE.orbR], q * 4); AT.set([c.tx, c.tz], q * 2); } }
      geo.setAttribute('aI', new THREE.InstancedBufferAttribute(AI, 4)); geo.setAttribute('aT', new THREE.InstancedBufferAttribute(AT, 2));
      im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.boundingSphere.radius += 3; im.name = 'orbs'; group.add(im); orbs += n; }
    await ctx.yield(); }
  hull.dispose();

  // ---- THE PLAIN beyond: a drawn ground round the chasm out to 4.2 km, 0.3 m under the true floor (the shader cuts the chasm's round out of it)
  const pl = acc(), RR = [CHASM.r - 16, 560, 640, 800, 1100, 1600, 2400, 3300, 4200], NS = 96;
  for (let r = 0; r < RR.length; r++) for (let i = 0; i <= NS; i++) { const a = i / NS * Math.PI * 2; pl.P.push(CHASM.x + Math.sin(a) * RR[r], -0.3, CHASM.z + Math.cos(a) * RR[r]); pl.N.push(0, 1, 0); pl.A.push(0, 0, 0, 0);
    if (r && i) { const k = (r - 1) * (NS + 1) + i - 1, k2 = k + NS + 1; pl.I.push(k, k + 1, k2, k + 1, k2 + 1, k2); } }
  tris += pl.I.length / 3; mesh(pl, plainMat(shared, uni), 'plain'); await ctx.yield();
  const dispose = () => { const geos = new Set(), mats = new Set();
    group.traverse((o) => { if (o.geometry) geos.add(o.geometry); if (o.material) mats.add(o.material); if (o.isInstancedMesh) o.dispose(); });
    for (const g of geos) g.dispose(); for (const m of mats) m.dispose(); tex.dispose(); };
  return { object: group, update() {}, dispose, orbs, triangles: tris + orbs * 20 };
}
