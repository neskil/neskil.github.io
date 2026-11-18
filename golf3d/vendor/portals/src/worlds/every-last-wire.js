// every-last-wire: a small farming valley late on a clear afternoon, made wholly of wire as a wireworker makes things:
// hills and fields of mesh, hedges of dark rope, trees of twisted copper and green garden wire, a village and a church
// of welded rod under roofs of red coated wire, a river of bright drawn strands, clouds of steel wool. At the valley's
// middle the country is being unmade: its wire is drawn in to a ring of 24 reels (each wound with the country's own
// wire, in its colours) round a hub, and what leaves the hub is paperclips, all alike. Where a field has come undone
// its board lies bare and on it stand that field's paperclips, row on row, where its crop stood; ten heaps of them lie
// round the middle; and one chain of them (24 links, each 68 m long, where the fields' clips are 22, 28 and 36 m) rises from the hub in a single
// bowed arc into the top loop of one great paperclip standing on end, 680 m tall. We come in high over the whole
// valley, pass low beside an oak and a house
// as they come undone, cross the fields of clips, go once round the ring of reels, climbing, and go out through the
// standing clip's top loop.
//
// WHAT MOVES, AND BY WHAT:
//   BY PLACE (the metres of route flown, uS), THE WORLD'S ANSWER TO THE VISITOR: the unmaking spreads from the middle,
//   its radius RU0 + RUK metres for each metre flown, up to RU1; a tree or a house comes undone as that radius reaches
//   it (its twigs first, its trunk last; a house from its ridge down), and a drawn-off wire runs from it to the
//   nearest reel while it does; a field's clips stand from the route metre at which the unmaking has surely passed
//   their place; the oak and the house beside the low pass by the route metres written where they are laid.
//   BY THE PLACE'S OWN CLOCK (the world's seconds, the same for any visitor, and at every pose, also with the eye
//   standing still): glints run in along the taut lines and down the river; strings of clips travel down the
//   drawn-off wires; the chain's clips travel up its arc into the way out; the heaps glitter; the steel wool drifts
//   to and fro; and THE PULL runs through the country's fields as soft shivers, in toward the middle (the look's land).
//   Nothing is begun, ended, moved or lit by a typed time, a typed share of the flight, a seed or a still's position.
//   What reads the eye or the pixel is named at the head of the look's file (seven terms).
//
// THE LIGHT IS ONE LAW (the look's file): one low sun in the west, the sky's light from above, the ground's from
// below, a haze with distance; every long shadow lies along that one sun. The picture is passed on as written, with
// the engine's own bloom held low (only what is brighter than white glows: the sun and the glints on steel).
//
// THE LOOKS (pois) are typed in metres of route or by the angle round the middle at which we stand on the ring
// (ringAt): places, never times. As they run: the middle from afar; on the low pass the oak and the standing clip
// together, then, gliding over from 200 m to 40 m before the oak comes abeam, the oak alone and close, then (from
// the oak's abeam on) straight to the middle;
// on the ring the third heap, then the wheel of reels looked at low, then the standing clip whole and the chain's
// sweep into its top loop, then the whole from the far side and the clip's waist; and over the last 520 m the top
// loop, aimed a little under the way out, so that the way out stands in the upper part of the picture as a gateway
// with the valley under it.
//
// WHAT STANDS WHERE, BY RULE (the same for every visit): a strewn clip of a heap stands by its own distance from the
// way: within 140 m every one that is dealt, beyond 280 m about a third of them (by the heap's own size), and between
// the two the one goes over into the other. So a heap is close-strewn on its flank toward the way and thin on its far
// flank, about seven in ten of its clips in all. A strewn clip is bright on its heap's sun side and darker on its
// far side.
//
// THE BUILD'S STEPS, said plainly: every loop yields, and the step tool reads 0 ms as the longest step. In some
// thirty runs of that tool two stray long tasks of about 52 ms showed which no step of this world explains (the
// world's own laps between yields are 22 ms at the most). They are said here for the owner's intake.
//
// THE VISIT (ctx.vary.density) deals how closely the woods stand, a little either way; a small machine
// (ctx.quality.detail) gets thinner woods and fewer of the far clips.
//
// PREVIEWS WITH STRANGERS WERE USED in the making (section 172); no stranger who saw a preview scored at the bar.
//
// TRIANGLES: counted in marks.tris (every sheet; instances times their count).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeWirework, COL, KIND, mix, ss, noise, ball, wireTree } from '../parts/every-last-wire.js';

const TAU = Math.PI * 2, CX = 0, CZ = 3000, RU0 = 560, RU1 = 1040, RING = 340, LOOP = [300, 605, 3900], CLIP = 680, OAK = [20, 2090], OAKH = 50, HERO = [-125, 2265];
const SUN = [-0.85, 0.3, 0.3];
const riverX = (z) => 220 * Math.sin(z / 900 + 0.5);
// the land's height: a level floor along the river, hills to either side rising to the rim, the valley closed at its far end
const land = (x, z) => { const d = Math.abs(x - riverX(z)), dc = Math.hypot(x - CX, z - CZ);
  let h = 330 * ss(430, 1900, d) + 260 * ss(1900, 5200, d) + 140 * (noise(x / 620 + 3, z / 620) - 0.5) * ss(260, 1200, d) + 30 * (noise(x / 210, z / 210) - 0.5) * ss(150, 800, d);
  h += 340 * ss(4900, 6800, z) * (0.55 + 0.45 * noise(x / 900 + 9, 0.3)) + 300 * ss(-900, -2600, z);
  return h * ss(380, 1250, dc); };
// the heaps of clips about the middle, each a cone at its angle of rest: [its bearing from the middle in degrees, how far out, how high]
const ROWS = [22, 28, 36];      // the clips' sizes, field by field (as the look's land has them)
const HEAPS = [[12, 500, 90], [36, 470, 70], [60, 520, 110], [86, 480, 80], [112, 530, 100], [138, 475, 66], [165, 510, 115], [192, 480, 78], [218, 525, 96], [243, 490, 70]].map(([a, r, h]) => [CX + r * Math.cos(a * Math.PI / 180), CZ + r * Math.sin(a * Math.PI / 180), h]);
const heapH = (x, z) => { let m = 0; for (const [hx, hz, h] of HEAPS) { const v = h - Math.hypot(x - hx, z - hz) / 1.6; if (v > m) m = v; } return m; };
const ground = (x, z) => land(x, z) + heapH(x, z);
// THE ROUTE: in high over the valley's near end; down to the floor; low past the oak (to our left) and the house (to
// our right) where the unmaking stands as we come; over the fields of clips to the ring's east point; once round the
// ring of reels, counter-clockwise and climbing; on up to the top loop of the standing clip.
const ROUTE = [[-691, 185, 944], [-625, 160, 1035], [-450, 105, 1270], [-330, 76, 1540], [-215, 42, 1760], [-145, 26, 1950], [-55, 20, 2150], [25, 28, 2380], [160, 46, 2630], [290, 66, 2840]];
for (let a = 0; a <= 360; a += 15) { const rr = RING; ROUTE.push([CX + rr * Math.cos(a * Math.PI / 180), 66 + 234 * a / 360, CZ + rr * Math.sin(a * Math.PI / 180)]); }
ROUTE.push([345, 362, 3290], [326, 488, 3610], LOOP);

export default {
  id: 'every-last-wire',
  name: 'Every Last Wire',
  category: 'bizarre',
  weirdness: 0.8,
  media: ['air', 'open'],
  async build(ctx) {
    const core = ctx.core, stream = (name) => core.makeRng(core.hashSeed('every-last-wire:' + name + ':' + ctx.seed));
    // the visit's own density (how closely the woods stand) and the machine's detail (thinner woods, fewer far clips)
    const density = Math.min(1.3, Math.max(0.7, ctx.vary?.density ?? 1)), detail = Math.min(1, Math.max(0.6, Number(ctx.quality?.detail) || 1)), woodK = (0.7 + 0.3 * density) * detail;
    const B = makeWirework({ sun: SUN }), U = B.uniforms, scene = new THREE.Scene(); scene.background = new THREE.Color('#F8CF94');
    const path = makePath(ROUTE), L = path.length, marks2 = {}; let tris = 0;
    U.uC.value.set(CX, CZ, 0, 0);
    const sky = B.sky(21000); sky.position.set(0, 0, CZ); scene.add(sky);
    // the route metre abeam a place on the way in (before the ring), and the metre at which the unmaking reaches a radius
    const pv = new THREE.Vector3(); let uIn = 0.5;
    { let best = 1e18; for (let i = 0; i <= 700; i++) { path.pointAt(i / 1000, pv); const d = (pv.x - 290) ** 2 + (pv.y - 66) ** 2 + (pv.z - 2840) ** 2; if (d < best) { best = d; uIn = i / 1000; } } }
    const sIn = (x, z) => { let best = 1e18, bu = 0; for (let i = 0; i <= 500; i++) { const u = i / 500 * uIn; path.pointAt(u, pv); const d = (pv.x - x) ** 2 + (pv.z - z) ** 2; if (d < best) { best = d; bu = u; } } return bu * L; };
    await ctx.yield();
    // how fast the unmaking spreads: so that it stands 80 m beyond the oak as we come abeam of it (the oak stands in the silver)
    const RUK = (Math.hypot(OAK[0] - CX, OAK[1] - CZ) + 80 - RU0) / sIn(OAK[0], OAK[1]), sReach = (rho) => (rho - RU0) / RUK;
    U.uR.value.set(RU0, RUK, 0, RU1);
    HEAPS.forEach(([hx, hz, hh], i) => U.uHeap.value[i].set(hx, hz, hh));
    await ctx.yield();
    // the low pass, sampled: how far a place lies from it over the ground
    const sOak0 = sIn(OAK[0], OAK[1]), sHouse0 = sIn(HERO[0], HERO[1]), lowPass = [];
    for (let sm = sOak0 - 900; sm <= sHouse0 + 250; sm += 15) { path.pointAt(sm / L, pv); lowPass.push(pv.x, pv.z); }
    const nearLow = (x, z) => { let best = 1e18; for (let i = 0; i < lowPass.length; i += 2) { const d = (lowPass[i] - x) ** 2 + (lowPass[i + 1] - z) ** 2; if (d < best) best = d; } return Math.sqrt(best); };
    let landY = ground;
    await ctx.yield();

    // ---- THE LAND: one skin, 40 m cells along the route's country, wider toward the rim ----
    { const axis = (lo, hi, step, farLo, farHi) => { const a = []; for (let v = lo; v <= hi + 1e-6; v += step) a.push(v); let s = step, v = hi; while (v < farHi) { s *= 1.35; v += s; a.push(v); } s = step; v = lo; while (v > farLo) { s *= 1.35; v -= s; a.unshift(v); } return a; };
      const xs = axis(-2400, 2400, 40, -9000, 9000), zs = axis(-1200, 5600, 40, -6000, 12000);
      const sh = B.sheet(), V = [], C = [], nx = xs.length, nz = zs.length;
      for (let j = 0; j < nz; j++) { for (let i = 0; i < nx; i++) { const x = xs[i], z = zs[j];
          V.push([x, ground(x, z), z]); C.push([Math.min(1, heapH(x, z) / 100), 0, 0]); }
        if (j % 16 === 15) await ctx.yield(); }
      // the skin is added in bands of 16 rows, so that no build step is long; each corner's normal is the sum over all
      // the triangles round it, worked out here over the whole skin first, so that no seam shows between two bands
      const NN = new Float64Array(nx * nz * 3), face = (a, b, c) => { const Av = V[a], Bv = V[b], Cv = V[c];
        const x = (Bv[1] - Av[1]) * (Cv[2] - Av[2]) - (Bv[2] - Av[2]) * (Cv[1] - Av[1]), y = (Bv[2] - Av[2]) * (Cv[0] - Av[0]) - (Bv[0] - Av[0]) * (Cv[2] - Av[2]), z = (Bv[0] - Av[0]) * (Cv[1] - Av[1]) - (Bv[1] - Av[1]) * (Cv[0] - Av[0]);
        if (x * x + y * y + z * z < 1e-12) return; NN[a * 3] += x; NN[a * 3 + 1] += y; NN[a * 3 + 2] += z; NN[b * 3] += x; NN[b * 3 + 1] += y; NN[b * 3 + 2] += z; NN[c * 3] += x; NN[c * 3 + 1] += y; NN[c * 3 + 2] += z; };
      for (let j = 0; j < nz - 1; j++) { for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; face(a, c, d); face(a, d, b); }
        if (j % 16 === 15) await ctx.yield(); }
      for (let j0 = 0; j0 < nz - 1; j0 += 16) { const j1 = Math.min(nz - 1, j0 + 16), I = [];
        for (let j = 0; j < j1 - j0; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; I.push(a, c, d, a, d, b); }
        sh.add(V.slice(j0 * nx, (j1 + 1) * nx), I, { cols: C.slice(j0 * nx, (j1 + 1) * nx), kind: KIND.land, norms: NN.subarray(j0 * nx * 3, (j1 + 1) * nx * 3) });
        await ctx.yield(); }
      tris += sh.tris(); scene.add(B.mesh(sh, 'land')); await ctx.yield();
      // the skin's own height at a place (as its triangles lie), for the shadows that lie on it
      const cell = (arr, v) => { let lo = 0, hi = arr.length - 2; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (arr[m] <= v) lo = m; else hi = m - 1; } return lo; };
      landY = (x, z) => { const i = cell(xs, x), j = cell(zs, z), fx = Math.min(1, Math.max(0, (x - xs[i]) / (xs[i + 1] - xs[i]))), fz = Math.min(1, Math.max(0, (z - zs[j]) / (zs[j + 1] - zs[j])));
        const ya = V[j * nx + i][1], yb = V[j * nx + i + 1][1], yc = V[(j + 1) * nx + i][1], yd = V[(j + 1) * nx + i + 1][1];
        return fz >= fx ? ya + (yc - ya) * fz + (yd - yc) * fx : ya + (yb - ya) * fx + (yd - yb) * fz; }; }
    await ctx.yield();

    // ---- THE WOODS on the hills and the trees of the floor: a trunk of copper wire, a crown of green mesh ----
    const W = B.lengths('wires'), ST = B.streams('streams'), SH = B.shadows('shadows'), wood = stream('wood'), trees = [], nearTrees = [], leafClips = [];
    // a tree's long shadow: its trunk's line, then its crown's round (hc: the crown's middle over the ground, R: its radius)
    const treeShade = (x, z, hc, R, alpha, s0, span) => { const len = hc * SH.reach + 2.2 * R; SH.add(x, z, len, 1.05 * R, Math.max(0.02, (hc * SH.reach - 2.2 * R) / len), alpha, s0, span, landY); };
    // the way in (before the ring), sampled: how far a place lies from it over the ground
    const wayIn = []; for (let i = 0; i <= 400; i++) { path.pointAt(i / 400 * (uIn + 0.01), pv); wayIn.push(pv.x, pv.z); }
    const fromWayIn = (x, z) => { let best = 1e18; for (let i = 0; i < wayIn.length; i += 2) { const d = (wayIn[i] - x) ** 2 + (wayIn[i + 1] - z) ** 2; if (d < best) best = d; } return Math.sqrt(best); };
    // a drawn-off wire from the nearest reel to a thing's top, low over the board, and the string of clips that travels down it
    const peg = (x, z) => { const a = Math.round(Math.atan2(z - CZ, x - CX) / TAU * 24) / 24 * TAU; return [CX + 196 * Math.cos(a), 6, CZ + 196 * Math.sin(a)]; };
    // (no drawn-off wire passes within 110 m of the low pass over the ground)
    const drawOff = (x, y, z, top, sOn, sOff, len, gauge, own) => { const p0 = peg(x, z);
      if (!own) for (let i = 0; i <= 10; i++) if (nearLow(x + (p0[0] - x) * i / 10, z + (p0[2] - z) * i / 10) < 110) return;
      const d = Math.hypot(x - p0[0], z - p0[2]), k = Math.max(0.03, Math.min(0.3, 30 / d)), p1 = [x + (p0[0] - x) * k, y + 3, z + (p0[2] - z) * k], p2 = [x, y + top, z];
      W.add(p0, p1, p2, gauge * 0.3, mix(COL.zinc, [0.1, 0.1, 0.12], 0.45), { s0: sOff + 40, span: 140, run: -42 });
      if (len > 0) ST.add(p0, p1, p2, { n: Math.max(4, Math.round(d / (len * 9))), len, rate: 0.3, s0: sOn, s1: sOff }); };
    let row = 0;
    for (let z = -700; z < 5900; z += 46) { for (let x = -2700; x < 2700; x += 46) { const jx = x + 40 * (wood() - 0.5), jz = z + 40 * (wood() - 0.5), k = wood(), r = wood(), c = wood();
        if (k >= 0.4) continue; const h = land(jx, jz), dc = Math.hypot(jx - CX, jz - CZ);
        // (the ridge at the valley's near end is wooded more closely)
        const inWood = k < 0.36 * woodK && h > 60 && h < 420 && noise(jx / 330 + 11, jz / 330 + 4) > (jz < 900 ? 0.36 : 0.55), lone = h <= 60 && k < 0.035 && Math.abs(jx - riverX(jz)) > 60;
        if (!inWood && !lone) continue; if (dc < RU0 + 20) continue;
        const rd = fromWayIn(jx, jz); if (rd < 70) continue;
        if (rd < 140 && h < 90) { nearTrees.push({ x: jx, z: jz, y: h, dc, h: 24 + 14 * r, c }); continue; }
        trees.push({ x: jx, z: jz, y: h, dc, rd, R: (lone ? 11 : 9) + 6 * r, c }); }
      if (++row % 12 === 0) await ctx.yield(); }
    await ctx.yield();
    trees.sort((a, b) => b.z - a.z);                 // the far ones are drawn first: one sees through a crown
    { const sh = ball(B.sheet(), 6, 4), crowns = B.many(sh, trees.length, 'crowns'), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), greens = [COL.leaf, COL.green, COL.kale, COL.sage, lin255(196, 150, 60)];
      // a crown is turned with its own +x toward the middle: it is wiped away from that side (the look's ball)
      for (let i = 0; i < trees.length; i++) { const t = trees[i], th = t.R * 1.25, s0 = t.dc < RU1 + 40 ? sReach(t.dc) - 300 : 1e9, col = mix(greens[Math.floor(t.c * 4.999)], COL.leaf, 0.3);
        e.set(0, Math.atan2(t.z - CZ, CX - t.x), 0); q.setFromEuler(e); m.compose(new THREE.Vector3(t.x, t.y + th + t.R * 0.55, t.z), q, new THREE.Vector3(t.R * (0.95 + 0.25 * t.c), t.R * 0.9, t.R));
        crowns.set(i, m, col, KIND.hex, 0.5, 0.065, 0, s0 - 600, 1500);
        W.line([t.x, t.y - 1, t.z], [t.x + 0.6 * (t.c - 0.5), t.y + th + t.R * 0.4, t.z], 0.9, COL.bark, { s0: s0 + 920, span: 220 });
        treeShade(t.x, t.z, th + t.R * 0.55, t.R, 0.72, s0 - 600, 1500);
        if (s0 < 1e8) drawOff(t.x, t.y, t.z, th + t.R * 0.5, s0 - 600, s0 + 1100, t.rd < 300 ? 6 : 0, 0.5);
        if (i % 300 === 299) await ctx.yield(); }
      tris += crowns.tris; scene.add(crowns.mesh); }
    await ctx.yield();

    // ---- THE OAK AND THE HOUSE BESIDE THE LOW PASS, and a row of wire trees along the lane before them ----
    // a wire tree's leaves become paperclips as it comes undone, the side toward the middle first: each clip hangs
    // where its loop of leaf was, between the route metres at which the loop is drawn in and the twig after it
    const deal = stream('deal'), oak = { x: OAK[0], z: OAK[1] }, sOak = sIn(oak.x, oak.z);
    const toMid = (x, z) => { const d = Math.hypot(CX - x, CZ - z); return [(CX - x) / d, (CZ - z) / d]; }, onClip = (pos, dir, len, sOn, sOff) => leafClips.push({ pos, dir, len, sOn, sOff });
    // (the oak's own clips are larger, and never drawn thinner than the pixel is wide: the look's head, 2)
    const onOak = (pos, dir, len, sOn, sOff) => leafClips.push({ pos, dir, len: len * 1.5, sOn, sOff, fat: true });
    wireTree(W, oak.x, ground(oak.x, oak.z), oak.z, OAKH, deal, { s0: sOak - 180, span: 440, wires: 7, loops: 2, twigs: 3, gauge: 0.0105, toward: toMid(oak.x, oak.z), onClip: onOak });
    treeShade(oak.x, oak.z, 0.72 * OAKH, 0.33 * OAKH, 0.55, sOak - 180, 440);
    const smaller = [[-650, 1120, 56], [-600, 1215, 48], [-75, 1420, 34], [-185, 1530, 30], [-40, 1640, 38], [-150, 1760, 30], [-5, 1860, 36], [-185, 2010, 32], [-110, 2330, 30], [95, 2300, 30]].map(([x, z, h]) => ({ x, z, h, lane: true }));
    for (const t of nearTrees) if (smaller.every((o) => Math.hypot(o.x - t.x, o.z - t.z) > 40) && Math.hypot(oak.x - t.x, oak.z - t.z) > 70) smaller.push(t);
    for (const t of smaller) { const { x, z, h } = t, y = ground(x, z), dc = Math.hypot(x - CX, z - CZ), s0 = dc < RU1 + 40 ? sReach(dc) - 300 : 1e9;
      wireTree(W, x, y, z, h, deal, { s0: s0 - 600, span: 1500, wires: t.lane ? 5 : 4, loops: t.lane ? 3 : 2, toward: toMid(x, z), onClip: s0 < 1e8 ? onClip : null });
      treeShade(x, z, 0.72 * h, 0.33 * h, 0.5, s0 - 600, 1500);
      if (s0 < 1e8) drawOff(x, y, z, 0.42 * h, s0 - 590, s0 + 880, 5, 0.5); }
    await ctx.yield();
    // an orchard on the floor where the unmaking is on its way: rows of small trees, each with its wire to the reels
    { const orch = stream('orchard'); for (let i = -6; i <= 6; i++) for (let j = 0; j < 7; j++) { const a = Math.PI * 1.5 + i * 0.105 + 0.02 * (orch() - 0.5), r = 640 + j * 52 + 8 * (orch() - 0.5), x = CX + r * Math.cos(a), z = CZ + r * Math.sin(a), h = 17 + 6 * orch();
        if (path.nearestXZ(x, z).dist < 34 || Math.abs(x - riverX(z)) < 40 || Math.hypot(x - oak.x, z - oak.z) < 60) continue; const s0 = sReach(r) - 900;
        wireTree(W, x, ground(x, z), z, h, orch, { s0, span: 1500, wires: 3, loops: 2, gauge: 0.016, leaf: i % 2 ? COL.leaf : COL.green, toward: toMid(x, z) });
        treeShade(x, z, 0.72 * h, 0.33 * h, 0.5, s0, 1500);
        drawOff(x, ground(x, z), z, 0.42 * h, s0 + 10, s0 + 1480, fromWayIn(x, z) < 420 ? 4 : 0, 0.4); } }
    // a fence along our left hand on the low pass: rods, and three wires from rod to rod
    { let last = null; for (let z = 1340; z <= 2040; z += 20) { const x = -150 + 0.11 * (z - 1340) + 6 * Math.sin(z / 90), y = ground(x, z), dc = Math.hypot(x - CX, z - CZ), s0 = dc < RU1 + 40 ? sReach(dc) - 200 : 1e9;
        W.line([x, y - 0.5, z], [x, y + 7, z], 0.32, COL.white, { s0: s0 + 120, span: 80 });
        if (last) for (const hgt of [2.2, 4.2, 6.2]) W.line([last[0], last[1] + hgt, last[2]], [x, y + hgt, z], 0.16, COL.zinc, { s0, span: 120 });
        last = [x, y, z]; } }
    await ctx.yield();
    // houses: walls of cream square mesh, a roof of red rows, rods at the corners; wiped away from the ridge down
    const houses = B.sheet(), house = (x, z, rot, w, d, h, s0, span) => { const y = ground(x, z), c = Math.cos(rot), s = Math.sin(rot), T = (lx, ly, lz) => [x + c * lx + s * lz, y + ly, z - s * lx + c * lz], rh = h + 0.45 * w, top = (ly) => ly / rh;
      const quad = (a, b, cc, dd, uvw, uvh, q) => houses.add([T(...a), T(...b), T(...cc), T(...dd)], [0, 1, 2, 0, 2, 3], { ...q, uv: [[0, 0], [uvw, 0], [uvw, uvh], [0, uvh]], wipe: [top(a[1]), top(b[1]), top(cc[1]), top(dd[1])], s0, span });
      const wall = { col: COL.cream, kind: KIND.square, cell: 1.3, wire: 0.2 }, roof = { col: COL.red, kind: KIND.rows, cell: 1.6, wire: 0.42 };
      quad([-w / 2, 0, d / 2], [w / 2, 0, d / 2], [w / 2, h, d / 2], [-w / 2, h, d / 2], w, h, wall); quad([w / 2, 0, -d / 2], [-w / 2, 0, -d / 2], [-w / 2, h, -d / 2], [w / 2, h, -d / 2], w, h, wall);
      quad([w / 2, 0, d / 2], [w / 2, 0, -d / 2], [w / 2, h, -d / 2], [w / 2, h, d / 2], d, h, wall); quad([-w / 2, 0, -d / 2], [-w / 2, 0, d / 2], [-w / 2, h, d / 2], [-w / 2, h, -d / 2], d, h, wall);
      for (const sg of [-1, 1]) { houses.add([T(-w / 2, h, sg * d / 2), T(w / 2, h, sg * d / 2), T(0, rh, sg * d / 2)], [0, 1, 2], { ...wall, uv: [[0, 0], [w, 0], [w / 2, rh - h]], wipe: [top(h), top(h), 0.999], s0, span });
        const e = w / 2 + 1.2, sl = Math.hypot(e, rh - h + 1); quad([sg * e, h - 1, -d / 2 - 1], [sg * e, h - 1, d / 2 + 1], [0, rh, d / 2 + 1], [0, rh, -d / 2 - 1], d + 2, sl, { ...roof, ang: Math.PI / 2 }); }
      const rod = (a, b, o) => W.line(T(...a), T(...b), 0.34, COL.white, { s0: s0 + span * o, span: span * 0.3 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod([sx * w / 2, 0, sz * d / 2], [sx * w / 2, h, sz * d / 2], 0.7);
      rod([0, rh, -d / 2 - 1], [0, rh, d / 2 + 1], 0); for (const sz of [-1, 1]) { rod([-w / 2, h, sz * d / 2], [0, rh, sz * d / 2], 0.2); rod([w / 2, h, sz * d / 2], [0, rh, sz * d / 2], 0.2); rod([-w / 2, h, sz * d / 2], [w / 2, h, sz * d / 2], 0.5); }
      for (const sx of [-1, 1]) rod([sx * w / 2, h, -d / 2], [sx * w / 2, h, d / 2], 0.5);
      SH.add(x, z, (h + 0.3 * w) * SH.reach + 0.5 * Math.max(w, d), 0.55 * Math.max(w, d), 0, 0.8, s0, span, landY); };
    const hero = { x: HERO[0], z: HERO[1] }, sHouse = sIn(hero.x, hero.z);
    house(hero.x, hero.z, 0.5, 22, 30, 15, sHouse - 330, 400);
    // the village to the left of the way in, and its church
    for (let i = 0; i < 26; i++) { const x = -255 - 230 * deal(), z = 1300 + 540 * deal(), ry = deal() * TAU, w = 15 + 8 * deal(), d = 20 + 10 * deal(), h = 10 + 5 * deal();
      if (fromWayIn(x, z) < 75 || Math.hypot(x + 350, z - 1630) < 52) continue; house(x, z, ry, w, d, h, 1e9, 1); }
    { const x = -350, z = 1640, y = ground(x, z); house(x, z, 0, 20, 46, 20, 1e9, 1); SH.add(x, z - 34, 64 * SH.reach, 9, 0, 0.8, 1e9, 1, landY);
      const T = (lx, ly, lz) => [x + lx, y + ly, z + lz - 34], tower = { col: COL.cream, kind: KIND.square, cell: 2.6, wire: 0.34 };
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4, b = a + Math.PI / 2, r = 9; houses.add([T(r * Math.cos(a), 0, r * Math.sin(a)), T(r * Math.cos(b), 0, r * Math.sin(b)), T(r * Math.cos(b), 42, r * Math.sin(b)), T(r * Math.cos(a), 42, r * Math.sin(a))], [0, 1, 2, 0, 2, 3], { ...tower, uv: [[0, 0], [12.7, 0], [12.7, 42], [0, 42]] });
        houses.add([T(r * Math.cos(a), 42, r * Math.sin(a)), T(r * Math.cos(b), 42, r * Math.sin(b)), T(0, 78, 0)], [0, 1, 2], { col: COL.red, kind: KIND.rows, cell: 1.6, wire: 0.42, uv: [[0, 0], [12.7, 0], [6.3, 38]] });
        W.line(T(r * Math.cos(a), 0, r * Math.sin(a)), T(r * Math.cos(a), 42, r * Math.sin(a)), 0.4, COL.white); W.line(T(r * Math.cos(a), 42, r * Math.sin(a)), T(0, 78, 0), 0.4, COL.white); } }
    tris += houses.tris(); scene.add(B.mesh(houses, 'houses'));
    await ctx.yield();

    // ---- THE MIDDLE: the ring of reels, the chain that rises, the fields of clips, the heaps, the standing clip ----
    // the reels: 24 on a ring, each a drum wound with the country's wire in its colours, between two plain cheeks;
    // from each reel's top a wire runs to the hub at the middle, where the chain of clips leaves the ground
    const HUB = 30, REEL = [COL.green, COL.copper, COL.brass, COL.kale, COL.straw, COL.red];
    { const sh = B.sheet(), n = 24, m = 16, drum = (x, z, r, y0, y1, q) => { const V = [], I = [], uv = [];
          for (let i = 0; i <= m; i++) { const b = i / m * TAU; V.push([x + r * Math.cos(b), y0, z + r * Math.sin(b)], [x + r * Math.cos(b), y1, z + r * Math.sin(b)]); uv.push([i * r * TAU / m, y0], [i * r * TAU / m, y1]); }
          for (let i = 0; i < m; i++) { const k = i * 2; I.push(k, k + 1, k + 3, k, k + 3, k + 2); } sh.add(V, I, { ...q, uv }); },
        cheek = (x, z, r, y) => { const V = [[x, y, z]], I = []; for (let i = 0; i <= m; i++) { const b = i / m * TAU; V.push([x + r * Math.cos(b), y, z + r * Math.sin(b)]); } for (let i = 1; i <= m; i++) I.push(0, i + 1, i); sh.add(V, I, { col: COL.zinc, kind: KIND.plain }); };
      for (let k = 0; k < n; k++) { const a = k / n * TAU, x = CX + 190 * Math.cos(a), z = CZ + 190 * Math.sin(a);
        drum(x, z, 9, 2, 20, { col: REEL[k % REEL.length], kind: KIND.rows, cell: 1.5, wire: 0.6, ang: Math.PI / 2 }); drum(x, z, 13, 0, 2, { col: COL.zinc, kind: KIND.plain }); cheek(x, z, 13, 2); drum(x, z, 13, 20, 22, { col: COL.zinc, kind: KIND.plain }); cheek(x, z, 13, 22);
        W.line([CX, HUB, CZ], [x, 22, z], 0.5, [-1, -1, -1], { run: -42 }); SH.add(x, z, 22 * SH.reach, 13, 0, 0.8, 1e9, 1, landY); }
      SH.add(CX, CZ, HUB * SH.reach, 7, 0, 0.8, 1e9, 1, landY);
      drum(CX, CZ, 7, 0, HUB, { col: COL.zinc, kind: KIND.plain }); cheek(CX, CZ, 7, HUB);
      tris += sh.tris(); scene.add(B.mesh(sh, 'pegs')); }
    // THE CHAIN: 24 clips hooked in one another (each 68 m long, where the fields' clips are 22, 28 and 36 m), rising from the hub in one arc (straight up at first, level at last)
    // into the way out, bowing out 170 m to one side on its way: it goes through the standing clip's top loop 34 m over the middle of the way out, and beyond
    // the way out's own plane it is in the next world. Its clips travel up it by the place's clock
    const NCH = 24; { const pe = path.pointAt(1, new THREE.Vector3()), tn = pe.clone().sub(path.pointAt(1 - 6 / path.length, new THREE.Vector3())).normalize();
      const th = Math.hypot(tn.x, tn.z), E = [LOOP[0] + tn.x / th * 50, LOOP[1] + 34, LOOP[2] + tn.z / th * 50], D = Math.hypot(E[0] - CX, E[2] - CZ), H = E[1] - HUB;
      const BOW = 170, NS = 2000, acc = [0]; for (let i = 1; i <= NS; i++) { const t = (i - 0.5) / NS * Math.PI / 2; acc.push(acc[i - 1] + Math.hypot(D * Math.sin(t), H * Math.cos(t), 2 * BOW * Math.sin(4 * t)) * Math.PI / 2 / NS); }
      const arc = []; for (let k = 0, i = 0; k <= 8; k++) { const want = acc[NS] * k / 8; while (i < NS && acc[i + 1] < want) i++; arc.push(k === 8 ? Math.PI / 2 : (i + (want - acc[i]) / Math.max(acc[i + 1] - acc[i], 1e-9)) / NS * Math.PI / 2); }
      U.uChain.value.set(NCH, 0.28, D, H); U.uChain2.value.set((E[0] - CX) / D, (E[2] - CZ) / D, acc[NS] / NCH * 1.22, BOW); U.uArc.value = arc; U.uAxis.value.set(CX, HUB, CZ);
      U.uGate.value.set(tn.x, tn.y, tn.z, pe.dot(tn) + 1); }
    { const ch = B.chain(NCH, 'chain'); tris += ch.tris; scene.add(ch.mesh); }
    { const spots = [], lay = stream('clips');
      // great clips stand out of the heaps at all angles
      for (const [hx, hz, hh] of HEAPS) for (let i = 0; i < 7; i++) { const top = i > 4, a = lay() * TAU, r = hh * (top ? 0.25 * lay() : 0.2 + 1.0 * lay()), tip = lay(); spots.push({ x: hx + r * Math.cos(a), z: hz + r * Math.sin(a), yaw: lay() * TAU, tip, great: true, size: top ? 60 + 40 * lay() : 26 + 30 * lay(), lean: top ? 0.9 + 0.5 * tip : 0.45 + 0.8 * tip }); }
      // every clip that stands or lies on the silver has its shadow on the ground along the sun: the clip's own shape,
      // thrown onto the ground's plane where it stands (castOn); smp, d3: the way, sampled, and how far a place lies from it
      const smp = []; for (let i = 0; i <= 300; i++) { path.pointAt(i / 300, pv); smp.push(pv.x, pv.y, pv.z); }
      const d3 = (x, y, z) => { let b = 1e18; for (let i = 0; i < smp.length; i += 3) { const d = (smp[i] - x) ** 2 + (smp[i + 1] - y) ** 2 + (smp[i + 2] - z) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
      const shades = [], gN = (x, z) => { const hx = ground(x + 3, z) - ground(x - 3, z), hz = ground(x, z + 3) - ground(x, z - 3), l = Math.hypot(hx, 6, hz); return [-hx / l, 6 / l, -hz / l]; };
      const sunOn = (x, z, lo = 0.78) => { const n = gN(x, z), c = n[0] * B.sun.x + n[1] * B.sun.y + n[2] * B.sun.z; return lo + (1.12 - lo) * ss(B.sun.y - 0.25, B.sun.y + 0.25, c); };      // the ground's own tilt toward the sun: a heap has a bright side and a dark one
      const castOn = (mat, x, z, sOn, heap) => { const sm = B.shadowOf(mat, [x, ground(x, z) + 0.6, z], gN(x, z), new THREE.Matrix4()); if (sm) shades.push({ m: sm, sOn, heap }); };
      const cl = B.clipsMany(spots.length, 'clips', 0.7), m = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), e = new THREE.Euler(), YA = new THREE.Vector3(0, 1, 0);
      spots.forEach((s, i) => { e.set(-Math.PI / 2 + s.lean, s.yaw, 0, 'YXZ'); q.setFromEuler(e); m.compose(new THREE.Vector3(s.x, ground(s.x, s.z) + (s.great ? 1.2 + 2 * s.tip + s.size * 0.22 : 0.9 + 0.5 * s.size * Math.sin(Math.abs(s.lean))), s.z), q, new THREE.Vector3(s.size, s.size, s.size));
        if (s.great) cl.set(i, m, 0.03, -1); else cl.set(i, m, 0.034, -(0.9 + 0.2 * s.tip), s.sOn, 1e9); castOn(m, s.x, s.z, s.great ? -1e9 : s.sOn, true); });
      tris += cl.tris; scene.add(cl.mesh);
      // THE FIELDS OF CLIPS: where a field has come undone its board lies bare, and on it stand the field's clips, row
      // on row, upright, where the rows of the crop stood: every field its own way of the rows, its own size of clip and
      // its own lean, and every clip turned and leaned a little by its own draw (field: the land's own fields, as the look draws them). By the way itself (within 140 m) each is
      // a clip of wire, farther off a clip on a card; each is there from the route metre at which the unmaking has
      // surely passed its place (BY PLACE). On the heaps the clips lie as they fell, at all angles
      { const rw = stream('rows'), near = [], far = [], C35 = Math.cos(0.35), S35 = Math.sin(0.35);
        const field = (x, z) => { const ax = (C35 * x - S35 * z) / 250, ay = (S35 * x + C35 * z) / 250, qx = ax + 0.16 * Math.sin(ay * 1.9 + 1.3), qy = ay + 0.16 * Math.sin(ax * 1.6 + 0.4), ix = Math.floor(qx), iy = Math.floor(qy), fx = qx - ix, fy = qy - iy;
          return { a: (((ix * 2 + iy * 3) % 6) + 6) % 6, m: (((ix + 2 * iy) % 3) + 3) % 3, l: (((ix + iy) % 3) + 3) % 3, border: Math.min(fx, 1 - fx, fy, 1 - fy) * 250 }; };
        for (let a = 0; a < 6; a++) for (let mi = 0; mi < 3; mi++) { const ang = a * 0.5236, ca = Math.cos(ang), sa = Math.sin(ang), size = ROWS[mi], R = 1.1 * size, A = 0.5 * size, cxp = ca * CX - sa * CZ, cyp = sa * CX + ca * CZ, reach = 970;
          for (let j = Math.floor((cyp - reach) / R); j <= (cyp + reach) / R; j++) for (let i = Math.floor((cxp - reach) / A); i <= (cxp + reach) / A; i++) { const xp = (i + 0.5) * A, yp = (j + 0.5) * R, x = ca * xp + sa * yp, z = -sa * xp + ca * yp, r = Math.hypot(x - CX, z - CZ);
            if (r < 258 || r > 965) continue; const f = field(x, z); if (f.a !== a || f.m !== mi || f.border < 12 || heapH(x, z) > 0) continue;
            const h1 = rw(), h2 = rw(), h3 = rw(), y = ground(x, z), d = d3(x, y, z); if (d < 0.7 * size + 20 || (d > 300 && (h1 * 4096) % 1 > detail)) continue;      // (a small machine: fewer far clips, by a number that turns none)
            (d < 140 && near.length < 1400 ? near : far).push({ x, y, z, size, yaw: ang + (h1 - 0.5) * 0.6, lean: Math.PI / 2 - 0.28 * f.l - 0.22 * h2, tone: (0.8 + 0.3 * h3) * sunOn(x, z), sOn: sReach(r + 70) }); }
          await ctx.yield(); }
        const pile = B.clipsMany(Math.max(1, near.length), 'pile', 0.4);
        near.forEach((c, i) => { e.set(-Math.PI / 2 + c.lean, c.yaw, 0, 'YXZ'); q.setFromEuler(e); m.compose(new THREE.Vector3(c.x, c.y + 0.5 + 0.43 * c.size * Math.sin(c.lean), c.z), q, new THREE.Vector3(c.size, c.size, c.size)); pile.set(i, m, 0.036, c.tone, c.sOn, 1e9); castOn(m, c.x, c.z, c.sOn); });
        if (!near.length) { m.makeScale(0, 0, 0); pile.set(0, m, 0.03, 1, 0, 0); }
        tris += pile.tris; scene.add(pile.mesh); marks2.pile = near.length;
        const hp = stream('heapclips'); for (const [hx, hz, hh] of HEAPS) for (let i = 0; i < 320; i++) { const a = hp() * TAU, r = 1.55 * hh * Math.sqrt(hp()), x = hx + r * Math.cos(a), z = hz + r * Math.sin(a), k = hp(), yaw = hp() * TAU, tip = hp(), tn = hp(), size = 16 + 30 * k * k, y = ground(x, z), d = d3(x, y, z);
          if (i >= 320 + (0.0141 * hh * hh - 320) * ss(140, 280, d) || d < 0.7 * size + 22 || heapH(x, z) <= 0) continue; far.push({ x, y, z, size, yaw, lean: 0.2 + 0.95 * tip, tone: -(0.62 + 0.5 * tn) * sunOn(x, z, 0.6), sOn: sReach(Math.hypot(x - CX, z - CZ) + 70) }); }      // (a tone below nought: a clip of a heap, for the look. Each strewn clip stands by its own distance d from the way: within 140 m, where each is seen as a clip, every one that is dealt; beyond 280 m only the heap's first 0.0141 for each square metre of its height squared, about a third; between the two the one goes over into the other. No heap lies wholly near or wholly far: each is close-strewn toward the way and thin on its far flank. They are darker on the heap's side away from the sun, six tenths at the least)
        await ctx.yield();
        const cd = B.cards(Math.max(1, far.length), 'multitude', false);
        for (let i = 0; i < far.length; i++) { const c = far[i]; e.set(-Math.PI / 2 + c.lean, c.yaw, 0, 'YXZ'); q.setFromEuler(e); m.compose(new THREE.Vector3(c.x, c.y + 0.5 + 0.43 * c.size * Math.sin(c.lean), c.z), q, new THREE.Vector3(c.size, c.size, c.size)); cd.set(i, m, 0.036, c.tone, c.sOn, c.y); castOn(m, c.x, c.z, c.sOn, c.tone < 0);
          if (i % 500 === 499) await ctx.yield(); }
        if (!far.length) { m.makeScale(0, 0, 0); cd.set(0, m, 0.03, 1, 0); }
        tris += cd.tris; scene.add(cd.mesh); marks2.multitude = far.length; }
      await ctx.yield();
      { const sc = B.cards(Math.max(1, shades.length), 'clipshadows', true); shades.forEach((h, i) => sc.set(i, h.m, 0.036, h.heap ? -1 : 1, h.sOn)); if (!shades.length) { m.makeScale(0, 0, 0); sc.set(0, m, 0.03, 1, 0); }
        tris += sc.tris; scene.add(sc.mesh); marks2.clipShadows = shades.length; }
      // the standing clip's long shadow over the silver and the fields
      SH.add(LOOP[0] - 0.03 * CLIP, LOOP[2], CLIP * SH.reach, 46, 0, 0.55, 1e9, 1, landY);
      // THE STANDING CLIP, 680 m tall, its plane across our way out; the way out is its top loop
      const big = B.clipsMany(1, 'standing', 3); m.compose(new THREE.Vector3(LOOP[0] - 0.03 * CLIP, LOOP[1] - 0.39 * CLIP, LOOP[2]), q.identity(), new THREE.Vector3(CLIP, CLIP, CLIP)); big.set(0, m, 13 / CLIP, 1);
      tris += big.tris; scene.add(big.mesh);
      // the leaves that have become clips: each along where its loop of leaf hung
      const lf = B.clipsMany(Math.max(1, leafClips.length), 'leafclips', 0.5), yv = new THREE.Vector3(), xv = new THREE.Vector3(), zv = new THREE.Vector3(), bm = new THREE.Matrix4();
      leafClips.forEach((c, i) => { yv.set(c.dir[0], c.dir[1], c.dir[2]).normalize(); xv.set(-yv.z, 0.3, yv.x).normalize(); zv.crossVectors(xv, yv).normalize(); xv.crossVectors(yv, zv);
        bm.makeBasis(xv, yv, zv); bm.scale(new THREE.Vector3(c.len, c.len, c.len)); bm.setPosition(c.pos[0] + yv.x * c.len * 0.4, c.pos[1] + yv.y * c.len * 0.4, c.pos[2] + yv.z * c.len * 0.4); lf.set(i, bm, c.fat ? 0.036 : 0.03, c.fat ? -1 : 1, c.sOn, c.sOff); });
      if (!leafClips.length) { bm.makeScale(0, 0, 0); lf.set(0, bm, 0.05, 1, 0, 0); }
      tris += lf.tris; scene.add(lf.mesh); }
    await ctx.yield();
    { const lw = W.done(); tris += lw.tris; scene.add(lw.mesh); await ctx.yield(); const st = ST.done(); tris += st.tris; scene.add(st.mesh); marks2.lengths = lw.count; marks2.streamClips = st.count; marks2.leafClips = leafClips.length;
      const sd = SH.done(); tris += sd.tris; scene.add(sd.mesh); marks2.shadowTris = sd.tris; }

    // ---- THE SKY'S STEEL WOOL: puffs in flocks, drifting to and fro by the place's clock ----
    const flock = new THREE.Group(); flock.name = 'flock';
    { const cs = stream('sky'), puffs = []; for (let g = 0; g < 11; g++) { const a = cs() * TAU, r = 2500 + 6500 * cs(), gx = CX + r * Math.cos(a), gz = CZ + r * Math.sin(a), gy = 1150 + 500 * cs(), n = 5 + Math.floor(cs() * 4);
        U.uCloud.value[g].set(gx, gy, gz, (n - 1) / 2 * 190 + 210);
        for (let i = 0; i < n; i++) { const k = 1 - Math.abs(i - (n - 1) / 2) / n; puffs.push({ x: gx + (i - (n - 1) / 2) * 190 + 90 * (cs() - 0.5), y: gy + 110 * k * cs(), z: gz + 220 * (cs() - 0.5), sx: 170 + 150 * k + 60 * cs(), sy: 100 + 90 * k + 40 * cs(), sz: 170 + 110 * cs(), seed: cs() }); } }
      const wl = B.wool(puffs.length), m = new THREE.Matrix4(), q = new THREE.Quaternion();
      puffs.forEach((p, i) => { m.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(p.sx, p.sy, p.sz)); wl.set(i, m, p.seed, 1); });
      tris += wl.tris; flock.add(wl.mesh); scene.add(flock); }

    const tick = (time) => { U.uTime.value = time; flock.position.x = 420 * Math.sin(time * TAU / 600); U.uFlock.value.x = flock.position.x; };
    tick(0);
    const sRing = sIn(290, 2840) + 170, low = (s) => ss(sOak - 1300, sOak - 800, s) * (1 - ss(sHouse + 100, sHouse + 450, s));
    // the share of the route at which we stand at an angle round the middle (once round, from the east point)
    const ringTab = []; { let prev = null, acc = 0; for (let sm = sRing; sm <= L; sm += 2) { path.pointAt(sm / L, pv); const a = Math.atan2(pv.z - CZ, pv.x - CX); if (prev !== null) { let d = a - prev; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; acc += d; } else acc = a; prev = a; ringTab.push(acc); } }
    const ringAt = (deg) => { const t = deg * Math.PI / 180; let i = 0; while (i < ringTab.length - 1 && ringTab[i] < t) i++; return (sRing + 2 * i) / L; };
    // the ring angle at which we stand, in degrees, by the share of the route flown (ringAt the other way round)
    const angAt = (u) => { const f = Math.min(ringTab.length - 1.001, Math.max(0, (u * L - sRing) / 2)), i = Math.floor(f); return (ringTab[i] + (ringTab[i + 1] - ringTab[i]) * (f - i)) * 180 / Math.PI; };
    // ONE LOOK FOR THE RING'S FIRST HALF, its target moving BY PLACE (the ring angle at which we stand): from a point
    // 300 m ahead on the way (no turn) it swings in, evenly by its bearing from where we stand, to the wheel of reels
    // and their long shadows (low, between the hub and the east reels, so that the wheel and not the sky fills the picture), rests there, then
    // glides up in one glide (ring angle 104 to 137) to the standing clip and the chain's sweep: its target there is
    // the point half way between a point of the standing clip (half the clip's height straight below the middle of
    // its top loop) and the middle of the straight line from the middle look's own point (midAt, 70 m up over the
    // hub's foot) to the middle of the top loop. The look stands on its target (weight 1), so that it never parks high where the target lies behind
    // the way. So the gaze turns evenly and is never let go to the way between two looks that lie far apart
    const midAt = new THREE.Vector3(CX, 70, CZ), wheelAt = new THREE.Vector3(CX + 150, 60, CZ + 10), sweepAt = new THREE.Vector3(LOOP[0], LOOP[1] - 0.5 * CLIP, LOOP[2]).lerp(new THREE.Vector3((midAt.x + LOOP[0]) / 2, (midAt.y + LOOP[1]) / 2, (midAt.z + LOOP[2]) / 2), 0.5), glide = new THREE.Vector3(), here = new THREE.Vector3();
    const ringLook = (time, u) => { const a = angAt(u); if (a >= 78) return glide.lerpVectors(wheelAt, sweepAt, ss(104, 137, a));
      path.pointAt(u, here); path.pointAt(Math.min(1, u + 300 / L), glide); const k = ss(30, 78, a), a0 = Math.atan2(glide.z - here.z, glide.x - here.x);
      let d = Math.atan2(wheelAt.z - here.z, wheelAt.x - here.x) - a0; d -= TAU * Math.round(d / TAU);
      const az = a0 + d * k, r = 300 + (Math.hypot(wheelAt.x - here.x, wheelAt.z - here.z) - 300) * k;
      return glide.set(here.x + r * Math.cos(az), glide.y + (wheelAt.y - glide.y) * k, here.z + r * Math.sin(az)); };
    // the oak's look, its target moving BY PLACE (route metres before we come abeam of the oak): far out a point 278 m beyond the oak (119 m east and 251 m north of it, 60 m up: along the way's own heading there), which seen from the way lies between the oak and the standing clip, from about a tenth of the sideways turn from the oak to the clip (760 m out, where the look begins) to a good third (200 m out, where the glide begins), so that both stand in the picture; from 200 m to 40 m before abeam it glides, in one long gentle turn, onto the oak itself for the close pass
    const oakAt = new THREE.Vector3(oak.x, 29, oak.z), bothAt = new THREE.Vector3(oak.x + 119, 60, oak.z + 251), oakGlide = new THREE.Vector3();
    const oakLook = (time, u) => oakGlide.lerpVectors(bothAt, oakAt, ss(sOak - 200, sOak - 40, u * L));
    // (a look's fade is its share of the look's own length, at either end; where it is typed as metres over the look's length it is that many metres of route)
    const pois = [{ at: new THREE.Vector3(CX, 230, CZ), from: 0, to: (sOak - 760) / L, weight: 0.6, fade: 0.25 },
      // the oak's look begins where the look from afar ends (760 m before the oak's abeam) and ends where the house comes abeam (117 m after the oak's); its fade is that same stretch from the oak's abeam to the house's: it holds until the oak is abeam and lets go over the 117 m to the house's abeam
      { at: oakLook, from: (sOak - 760) / L, to: sHouse / L, weight: 0.8, fade: (sHouse - sOak) / (sHouse - sOak + 760), arc: true },
      // the middle, from where the oak comes abeam (it lies over the oak's look for those 117 m, so the gaze goes straight from the oak to the middle) and as we swing in beside the ring, until 150 m before its east point: the hub, the reels about it, the chain rising from it
      { at: midAt, from: sOak / L, to: (sRing - 150) / L, weight: 0.9, fade: 151 / (sRing - 150 - sOak), arc: true },
      // as we come onto the ring: ahead, the third heap with the great clips standing out of it, sunlit, and behind it
      // the standing clip, the chain going over to it from the right
      { at: new THREE.Vector3(HEAPS[2][0], 150, HEAPS[2][1]), from: (sRing - 420) / L, to: ringAt(52), weight: 0.8, fade: 0.3, arc: true },
      // from the ring's north side the wheel of reels, from its west side the standing clip and the chain's sweep (the
      // looks lie over one another, the later one leads; this one ends where the look at the clip's waist begins, ring angle 258, so that it still
      // holds when the look at the whole has its full weight)
      { at: ringLook, from: ringAt(26), to: ringAt(258), weight: 1, fade: 146 / ((ringAt(258) - ringAt(26)) * L), arc: true },
      // from the ring's far side, where the hub, the chain and the standing clip stand in one line: the whole of it,
      // the hub below, the chain going up from it and over into the standing clip's top loop
      { at: new THREE.Vector3(CX + 150, 215, CZ + 450), from: ringAt(190), to: ringAt(300), weight: 0.95, fade: 0.3, arc: true },
      { at: new THREE.Vector3(LOOP[0], LOOP[1] - 0.42 * CLIP, LOOP[2]), from: ringAt(258), to: (L - 420) / L, weight: 0.85, fade: 0.25, arc: true },
      { at: new THREE.Vector3(LOOP[0], LOOP[1] - 0.12 * CLIP, LOOP[2]), from: (L - 520) / L, to: 1, weight: 0.85, fade: 0.3, arc: true }];
    return {
      scene, path, duration: 133, pace: (u) => 1.2 - 0.55 * low(u * L),
      camera: { fov: 62, near: 2, far: 30000, lookAhead: 70, sway: 0.2, bank: 0.2 },
      pois,
      portal: { shape: 'circle', radius: 60, color: '#E6EBEE', frame: 0, glow: 0, halo: false, revealDistance: 2 * L },
      post: { flat: 1, exposure: 1, bloom: { strength: 0.3, radius: 0.6, threshold: 1.0 }, grade: { saturation: 1.03, contrast: 1.05, vignette: 0.2, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      marks: { L, RUK, tris, density, detail, trees: trees.length, nearTrees: nearTrees.length, ...marks2, sOak: Math.round(sOak), sHouse: Math.round(sHouse), sRing: Math.round(sRing) },
      update(dt, time, camera, u) { U.uS.value = u * L; tick(time); },
      dispose() {},
    };
  },
};
function lin255(r, g, b) { const c = new THREE.Color(r / 255, g / 255, b / 255); c.convertSRGBToLinear(); return [c.r, c.g, c.b]; }
