// Smoke Turns the Aspens: a still October afternoon in an aspen grove fired in raku.
// Three fired surfaces and no fourth: white crackle glaze (trunks, limbs, boulders, breasts, deer), bare clay smoked black
// (floor, twigs, stalks, bark eyes), copper matt glaze (every leaf: verdigris until smoke reaches it, then lustre by angle).
// A line is a craze; shadow is smoke stain; distance is smoke and takes the black first (far trunks end as bars of the smoke's
// shade against a paler low band). The floor is two values, black clay and pale pools with an edge; the smoke lies OVER what
// stands in it (litter, fern feet, hooves, trunk feet are veiled inside a pool). NO LINE OF CHANGE TRAVELS THROUGH THIS WOOD: every
// trunk is crazed before we come, copper lanes stand where earlier drifts crossed (a grove on the left, a ragged lane along our
// own way, lanes round the Stem), and the one thing that turns while we watch is the Old Stem's crown, where puffs from the leaf
// piles rise through it and copper blooms in a patch round each until the dappled crown is wholly copper, its birds bursting out
// patch by patch. (On the rare day smoke comes up through the whole wood during the exit and every crown blooms, here and there.)
// No lights, no fog, no textures, no full-screen pass: post is flat (the colour written is the colour shown).
// The hero and every shader live in ../parts/smoke-turns-the-aspens.js; this file lays out the grove, the flight and the events.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, buildDaughterHoop, makeRakuStyle, makeSweeper, leafGeometry, smokeGeometry, birdGeometry, flyerGeometry, RAKU_PALETTE }
  from '../parts/smoke-turns-the-aspens.js';

const HZ = 300;                      // the Old Stem stands on the axis at z 300
const DURATION = 42;

export default {
  id: 'smoke-turns-the-aspens',
  name: 'Smoke Turns the Aspens',
  category: 'wilderness',
  weirdness: 0.15,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = Math.min(1, Math.max(0.6, ctx.quality?.detail ?? 1));
    const density = Math.min(1.3, Math.max(0.7, vary.density ?? 1)), rare = !!vary.rare;
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const lerp = (a, b, t) => a + (b - a) * t, sat = (x) => Math.min(1, Math.max(0, x));
    const ss = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
    const scene = new THREE.Scene();

    // ---- the edition: hour, firing, weather, cast (chosen once from the seed) ----
    const vr = rng.fork ? rng.fork('edition') : rng;
    const hourPick = vr(), firePick = vr(), weatherPick = vr(), castPick = vr();
    const hour = vary.hour === 'dawn' ? 'morning' : vary.hour === 'golden' ? 'late' : vary.hour === 'day' ? 'afternoon'
      : hourPick < 0.4 ? 'afternoon' : hourPick < 0.7 ? 'morning' : 'late';
    const firing = firePick < 0.4 ? 'balanced' : firePick < 0.7 ? 'heavy' : 'light';
    const weather = weatherPick < 0.4 ? 'still' : weatherPick < 0.7 ? 'gusts' : 'thick';
    const cast = castPick < 0.5 ? 'magpie' : castPick < 0.75 ? 'woodpecker' : 'owl';
    const palette = RAKU_PALETTE.slice();
    if (hour === 'late') palette[2] = '#CFC7B8';            // the smoke a shade warmer, still pale
    if (hour === 'morning') palette[2] = '#C8CAC6';         // a shade cooler before the day
    const style = makeRakuStyle(palette, {
      sunElevation: hour === 'late' ? 13 : hour === 'morning' ? 24 : 38, sunRight: hour === 'late' ? 112 : 150,
      fogHalf: weather === 'thick' ? 125 : 185, fire: firing === 'heavy' ? 0.85 : firing === 'light' ? -0.85 : 0,
      cast: cast === 'magpie' ? 0 : cast === 'woodpecker' ? 1 : 2, beat: cast === 'owl' ? 0.42 : cast === 'woodpecker' ? 1.3 : 1,
    });
    const U = style.uniforms;
    if (weather === 'gusts') U.uGust.value.x = 1;
    const birdScale = cast === 'owl' ? 2.0 : cast === 'woodpecker' ? 1.4 : 1.5;

    // ---- the hero: the Old Stem, on the axis at z 300 ----
    const stemFog0 = weather === 'thick' ? 240 : 330, stemLeafFog = { value: stemFog0 * 1.5 };
    const hero = await buildHero(ctx, { style, sky: false, floor: false, detail, birdScale, heroFogHalf: stemFog0, leafFogHalf: stemLeafFog });
    hero.object.position.set(0, 0, HZ);
    scene.add(hero.object);
    await ctx.yield();
    const A = hero.anchors, toW = (p) => V3(p.x, p.y, p.z + HZ);

    // ---- the flight: floor run down the avenue, the link up a smoke drift, the artist's line round the trunk, straight out ----
    const pts = [[0, 1.5, 0], [0, 2.6, 14], [-0.7, 3.4, 28], [-2.3, 3.9, 43], [-2.5, 4.0, 58], [-0.6, 3.5, 72], [1.9, 3.1, 86], [4.6, 3.6, 106], [9, 6.2, 132], [15.3, 10.3, 162],
      [21.5, 14.2, 192], [26.5, 17, 216], [29.3, 18.7, 236], [28.6, 19.7, 250]].map((p) => V3(p[0], p[1], p[2]));
    for (let i = 1; i < A.flyThrough.length; i++) pts.push(toW(A.flyThrough[i]));
    const path = makePath(pts, { samples: 520 });
    const L = path.length;
    await ctx.yield();
    // u of a few landmarks, found on the path itself so events stay true if the line changes
    const uOfPoint = (p) => { let b = 0, bd = 1e9; const q = V3(); for (let i = 0; i <= 800; i++) { path.pointAt(i / 800, q); const d = q.distanceToSquared(p); if (d < bd) { bd = d; b = i; } } return b / 800; };
    const uFloorEnd = uOfPoint(pts[6]), uHelix0 = uOfPoint(toW(A.flyThrough[A.helixStart]));
    await ctx.yield();
    const uHelix1 = uOfPoint(toW(A.flyThrough[A.helixEnd])), uClose = uOfPoint(toW(A.closePass.position));
    await ctx.yield();
    const uOne = uOfPoint(toW(A.oneImage.position));
    const pathY = (u) => path.pointAt(sat(u), _tmp).y, _tmp = V3();
    const exitDir = A.portalSeat.direction.clone().normalize(), seat = toW(A.portalSeat.position);

    // the bloom clock as a pure function of u (the hero calls it ringY; a patch of the crown goes over when the clock passes its
    // value): it creeps while we come up the link, keeps three metres over the eye while we circle, runs on up as we leave
    const ringAt = (u) => {
      // (it stands at 25 from the first frame: the patches of the hem bloomed before we came)
      const ride = pathY(u) + 3, base = 25 + 6.5 * ss(0.12, uHelix0 + 0.03, u);      // while we come up the link the lowest patches are already spreading
      const out = ss(uHelix1 - 0.01, 0.985, u) * 34;
      return base + Math.log(1 + Math.exp((ride - base) * 1.2)) / 1.2 + out;
    };
    await ctx.yield();

    // ---- where the grove stands: two escort rows 7-9 m off the line, then a jittered grid, 9-16 m apart ----
    const er = rng.fork ? rng.fork('grove') : rng;
    const GC = { x: 0, z: 215, R: 335 }, uLinkEnd = uHelix0 - 0.075;
    const trees = [], cellMap = new Map(), ck = (x, z) => Math.floor(x / 16 + 100) * 1000 + Math.floor(z / 16 + 100);
    const nearTree = (x, z, r) => { const cx = Math.floor(x / 16 + 100), cz = Math.floor(z / 16 + 100);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const c = cellMap.get((cx + a) * 1000 + cz + b); if (!c) continue;
        for (const t of c) if ((t.x - x) ** 2 + (t.z - z) ** 2 < r * r) return true; }
      return false; };
    const piles = [{ x: 7.8, z: 30 }, { x: -9.5, z: 96 }, { x: 13.5, z: 181 }, { x: -12, z: 140 }].slice(0, density > 1.1 ? 4 : density < 0.85 ? 2 : 3);
    const boulders = [{ x: -7.2, z: 20, r: 1.5 }, { x: 7.4, z: 15, r: 1.1 }, { x: -9, z: 44, r: 2.3 }, { x: -8.6, z: 57, r: 1.6 }, { x: -7.6, z: 71, r: 1.2 },
      { x: -6, z: 121, r: 2.4 }, { x: -7.6, z: 108, r: 1.5 }, { x: 22.5, z: 150, r: 2.2 },
      { x: -9.5, z: 168, r: 3.0 }, { x: -6.2, z: 171.5, r: 1.3 }, { x: -11, z: 197, r: 3.2 }, { x: -8, z: 201, r: 1.4 }];      // two groups on the right of the open wedge: the near marks of the link
    const deerLane = { x: 12.6, z0: 44, z1: 108 };
    // the wedge between our line and the avenue's axis, z 138-264: nothing stands there, so from u 0.3 the Old Stem is in plain sight
    const wedgeX = new Float32Array(270).fill(-1e3); { const q = V3(); for (let i = 0; i <= 2000; i++) { const u = (i / 2000) * (uHelix0 - 0.03); path.pointAt(u, q); const zi = Math.floor(q.z); if (zi >= 0 && zi < 270) wedgeX[zi] = Math.max(wedgeX[zi], q.x); } }
    await ctx.yield();
    const inWedge = (x, z, m) => { const zi = Math.floor(z); return zi >= 138 && zi < 266 && x > -4 - m && x < wedgeX[zi] - 2.5 + m; };
    const reserved = (x, z, m) => {
      if (inWedge(x, z, m)) return true;
      for (const p of piles) if ((p.x - x) ** 2 + (p.z - z) ** 2 < (m + 3.2) ** 2) return true;
      for (const b of boulders) if ((b.x - x) ** 2 + (b.z - z) ** 2 < (m + b.r + 0.6) ** 2) return true;
      if (Math.abs(x - deerLane.x) < 2.6 + m && z > deerLane.z0 - 4 && z < deerLane.z1 + 4) return true;
      if (x > 6 && x < 15.5 && z > 57 && z < 93) return true;                          // the glade where the deer stand
      const sx = seat.x, sz = seat.z; if ((sx - x) ** 2 + (sz - z) ** 2 < 144) return true;
      return false; };
    const sightCone = (x, z) => z > 58 && z < 268 && x < -3 && x > -(0.155 * z + 2.5);
    const addTree = (x, z, tier, row) => {
      const n = path.nearestXZ(x, z);
      const t = { x, z, tier, row, h: er.range(34, 46), r: er.range(0.42, 0.8), uN: n.u, dN: n.dist, yN: n.y, sd: er(), la: er.range(0, 6.283), lm: er.range(0.3, 1.5) };
      if (row) { t.r = er.range(0.55, 0.8); }
      trees.push(t); const k = ck(x, z); let c = cellMap.get(k); if (!c) cellMap.set(k, (c = [])); c.push(t); return t; };
    { const p = V3(), tg = V3(); let side = 1;
      for (const sgn of [1, -1]) { let d = sgn > 0 ? 19.5 : 12;
        while (d < uLinkEnd * L) { path.posAtDist(d, p); path.tangentAtDist(d, tg); const hl = Math.hypot(tg.x, tg.z) || 1;
          const lat = er.range(7.9, 9.4), x = p.x - sgn * (tg.z / hl) * lat, z = p.z + sgn * (tg.x / hl) * lat;      // sgn +1 = right of the course (-X)
          const n = path.nearestXZ(x, z);
          if (n.dist > 7.4 && Math.hypot(x, z - HZ) > 56 && !reserved(x, z, 1.2) && !sightCone(x, z) && !nearTree(x, z, 7.5)) addTree(x, z, 0, true);
          d += er.range(9.5, 12.5); side = -side; } } }
    const featureTree = trees.reduce((b, t) => (t.x < 0 && (b.x >= 0 || Math.abs(t.z - 46) < Math.abs(b.z - 46)) ? t : b), trees[0]);   // nearest trunk on the right
    featureTree.feature = true; featureTree.r = 0.78;
    const S = 13;
    for (let gz = -9; gz <= 43; gz++) { for (let gx = -27; gx <= 27; gx++) {
        const x = gx * S + er.range(-4.4, 4.4) + (gz & 1 ? S * 0.5 : 0), z = gz * S + er.range(-4.4, 4.4), keep = er();
        const dc = Math.hypot(x - GC.x, z - GC.z); if (dc > GC.R) continue;
        if (Math.abs(x) < 12.5 && z > -45 && z < HZ - 50) continue;                       // the avenue
        if (Math.hypot(x, z - HZ) < 56) continue;                                         // the Old Stem's own ground
        const n = path.nearestXZ(x, z);
        if (n.y < 50 && n.dist < 13.5) continue;
        if (reserved(x, z, 1.5) || sightCone(x, z) || nearTree(x, z, 8.8)) continue;
        const tier = n.dist < 46 && n.u < uHelix0 + 0.02 ? 0 : n.dist < 150 ? 1 : 2;
        if (tier === 2 && keep > 0.62 * detail + 0.1) continue;
        if (tier === 1 && detail < 0.8 && keep > 0.8) continue;
        addTree(x, z, tier, false); }
      if ((gz & 7) === 7) await ctx.yield(); }

    // ---- smoke drifts across the grove: where one has passed the crowns are already copper (nothing in the grove turns as we pass) ----
    const nDrift = Math.round(lerp(3, 5, sat((density - 0.7) / 0.6))), drifts = [];
    for (let i = 0; i < nDrift; i++) { const a = er.range(-0.5, 0.5) + (i % 2 ? Math.PI * 0.5 : 0.15);
      drifts.push({ px: er.range(-140, 140), pz: i === 0 ? 395 : i === 1 ? 168 : er.range(130, 520), dx: Math.cos(a), dz: Math.sin(a), w: er.range(13, 24), ph: er.range(0, 6.28) }); }
    drifts[1].px = 150; drifts[1].dx = 0.99; drifts[1].dz = 0.14;              // one crosses the course far down the avenue, off to the side
    const exH = V3(exitDir.x, 0, exitDir.z).normalize(), camC1 = (seat.x - 0) * exH.x + (seat.z - HZ) * exH.z;
    // the u at which smoke reaches a leaf: -1 already copper, 1e9 stays green
    const turnU = (x, z, y, t, jit, stay) => {
      if (stay < 0.02) return 1e9;
      const wob = 0.75 + 0.5 * Math.sin(x * 0.07 + z * 0.05 + t.sd * 6) * Math.sin(z * 0.031 - x * 0.02);
      for (let i = 0; i < drifts.length; i++) { const d = drifts[i], rx = x - d.px, rz = z - d.pz, al = rx * d.dx + rz * d.dz, ac = Math.abs(rx * d.dz - rz * d.dx + 9 * Math.sin(al * 0.022 + d.ph));
        if (ac < d.w * wob && (z > 128 || Math.abs(x) > 60) && stay > 0.07) return -1; }
      // a grove on the left that turned before we came (the first pile's smoke has lain there all afternoon)
      if (x > 15.5 + 5 * Math.sin(z * 0.05 + 1) && x < 82 * wob && z > -70 && z < 172 + 18 * Math.sin(x * 0.07) && stay > 0.07) return -1;
      // our own drift: a stripe along the line of flight whose turning line runs ahead of us, 16 m at the entry, 55 m by the link
      const lane = Math.sin(x * 0.045 + 1.3 + t.sd) * Math.sin(z * 0.038 + x * 0.02);      // a drift's edge is ragged: dapples left green
      if (t.dN < 24 * wob + 5 && t.yN < 50 && t.uN > 0.035) return lane > -0.5 && stay > 0.1 ? -1 : 1e9;
      // the ring's smoke spills out through the grove round the Stem as we circle: a turning line that widens below us
      { const ds = Math.hypot(x, z - HZ); if (ds < 112 * wob && t.yN < 50 && lane > -0.12 && stay > 0.1) return -1; }      // round the Stem the piles' smoke has lain in lanes
      if (t.yN >= 50 && t.dN < 19 * wob && stay > 0.1) return -1;                                                    // and under the way out
      // the rare day: smoke comes up through the whole wood during the exit and every crown blooms, here, there, until all is copper
      if (rare) return 0.775 + 0.11 * ((t.sd * 7.31) % 1) + jit * 0.012;
      return 1e9; };
    await ctx.yield();

    // ---- the wood: white crackle trunks and limbs, black clay twigs, every one crazed before we came ----
    const FRONT_K = 1.33, frontAt = (u) => u * L * FRONT_K + 14;
    const lee = er.range(0, 6.283), leeX = Math.cos(lee), leeZ = Math.sin(lee);
    const glazeNear = makeSweeper(), glazeFar = makeSweeper(), glazeFeat = makeSweeper(), clay = makeSweeper();
    const twigMarks = [], GOLD = 2.39996;
    // path samples near a tree, for clearance of limbs, twigs and leaves
    const SN = 640, sP = new Float32Array((SN + 1) * 3); { const q = V3(); for (let i = 0; i <= SN; i++) { path.pointAt(i / SN, q); sP[i * 3] = q.x; sP[i * 3 + 1] = q.y; sP[i * 3 + 2] = q.z; } }
    const nearSamples = (t, reach) => { const out = []; for (let i = 0; i <= SN; i++) { const dx = sP[i * 3] - t.x, dz = sP[i * 3 + 2] - t.z; if (dx * dx + dz * dz < reach * reach) out.push(sP[i * 3], sP[i * 3 + 1], sP[i * 3 + 2]); } return out; };
    const clearOf = (ns, x, y, z) => { let b = 1e9; for (let i = 0; i < ns.length; i += 3) { const dx = ns[i] - x, dy = ns[i + 1] - y, dz = ns[i + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
    const growLimb = (t, p0, az, el, len, n, rise) => { const pp = [p0.clone()], d = V3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)), p = p0.clone();
      for (let i = 1; i <= n; i++) { d.y += rise / n; d.x += er.range(-0.14, 0.14); d.z += er.range(-0.14, 0.14); d.normalize(); p.addScaledVector(d, len / n); pp.push(p.clone()); }
      return pp; };
    const addTwig = (t, base, dir, len) => { const pp = [base.clone()], d = dir.clone(), p = base.clone();
      for (let k = 1; k <= 3; k++) { d.x += er.range(-0.3, 0.3); d.z += er.range(-0.3, 0.3); d.y -= 0.05; d.normalize(); p.addScaledVector(d, len / 3); pp.push(p.clone()); }
      if (t.ns.length) for (let k = 1; k <= 3; k++) if (clearOf(t.ns, pp[k].x, pp[k].y, pp[k].z) < 5.6) return;
      twigMarks.push(clay.vertexCount); clay.sweep(pp, [0.07, 0.052, 0.035, 0.02], { sides: 3, sway: (s) => s * s });
      t.hang.push(pp[1], pp[2], pp[3]); };
    const trunkAxis = (t, y, out = V3()) => out.set(t.x + Math.cos(t.la) * t.lm * Math.sin(y * 0.07 + t.sd * 9) * sat(y / 10), y, t.z + Math.sin(t.la) * t.lm * Math.sin(y * 0.07 + t.sd * 9) * sat(y / 10));
    let lowBranch = null, lowBranch2 = null;
    const rowNear = (sgn, z) => trees.reduce((b, t) => (t.row && !t.feature && t.x * sgn > 0 && (!b || Math.abs(t.z - z) < Math.abs(b.z - z)) ? t : b), null);
    const lowTreeA = rowNear(1, 41), lowTreeB = rowNear(-1, 30);
    // more low boughs over the first of the avenue: [side, z, height]; they stay green
    const lowMore = new Map(), lowBoughs = [];
    for (const [sg, z, y] of [[1, 14, 8.2], [-1, 20, 9.6], [1, 27, 12.6], [-1, 9, 12], [-1, 40, 17]]) { const t = rowNear(sg, z); if (t && t !== lowTreeA && t !== lowTreeB && !lowMore.has(t)) lowMore.set(t, y); }
    for (let ti = 0; ti < trees.length; ti++) {
      const t = trees[ti]; t.hang = []; t.ns = t.tier === 0 && t.dN < 26 ? nearSamples(t, 30) : [];
      const sw = t.feature ? glazeFeat : t.tier === 0 ? glazeNear : glazeFar;
      const rings = t.tier === 0 ? 9 : t.tier === 1 ? 5 : 3, sides = t.feature ? 14 : t.tier === 0 ? 10 : t.tier === 1 ? 6 : 4;
      const tp = [], tr = [], forks = [];
      for (let i = 0; i < rings; i++) { const f = i / (rings - 1), y = -0.7 + (t.h + 0.7) * Math.pow(f, 1.25); tp.push(trunkAxis(t, y)); tr.push(Math.max(0.1, t.r * (1 - 0.86 * Math.pow(f, 1.6)))); }
      const nl = t.tier === 0 ? er.int(4, 6) : t.tier === 1 && t.dN < 85 ? 2 : 0, az0 = er.range(0, 6.283);
      const limbs = [];
      for (let k = 0; k < nl; k++) { const y = lerp(21, t.h - 8, (k + er.range(0.1, 0.9)) / nl), az = az0 + k * GOLD, len = er.range(5.5, 9.5) * (1 - 0.35 * (y - 21) / Math.max(1, t.h - 29));
        const r0 = Math.min(0.3, t.r * 0.42), n = t.tier === 0 ? 4 : 2, pp = growLimb(t, trunkAxis(t, y), az, er.range(0.35, 0.8), len, n, 0.5);
        if (t.ns.length) { let ok = true; for (const q of pp) if (clearOf(t.ns, q.x, q.y, q.z) < 6.8) ok = false; if (!ok) continue; }
        limbs.push({ pp, r0, y, n }); forks.push(y); }
      // a low branch over the avenue by the first leaf pile (the one a wisp reaches), and one further on that has already turned
      if (t === lowTreeA) { const y = 9.2, pp = growLimb(t, trunkAxis(t, y), Math.PI * 0.5 + 0.22, 0.2, 8.2, 5, 0.12);      // along the avenue's left side, off the sight line to the Stem
        lowBranch = { t, pp }; limbs.push({ pp, r0: 0.26, y, n: 5, low: true }); forks.push(y); }
      if (t === lowTreeB) { const y = 10.2, pp = growLimb(t, trunkAxis(t, y), -0.8, 0.2, 6.4, 5, 0.12);
        lowBranch2 = { t, pp }; limbs.push({ pp, r0: 0.24, y, n: 5, low: true }); forks.push(y); }
      if (lowMore.has(t)) { const y = lowMore.get(t), pp = growLimb(t, trunkAxis(t, y), (t.x > 0 ? Math.PI : 0) + er.range(-0.3, 0.3), er.range(0.15, 0.26), er.range(7, 8.6), 5, 0.12);
        lowBoughs.push({ t, pp }); limbs.push({ pp, r0: 0.25, y, n: 5, low: true, more: true }); forks.push(y); }
      const arc0 = t.feature ? 0 : (t.uN * L - 28) * FRONT_K + 14;
      sw.sweep(tp, tr, { sides, cell: t.tier === 0 ? 0.55 : 0.8, arc0,
        shape: (th, s) => 1 + 0.5 * Math.exp(-Math.max(0, s - 0.7) / 1.3) * (0.6 + 0.4 * Math.cos(3 * th + t.sd * 20)) + 0.03 * Math.sin(2 * th + s * 0.3),
        ao: (p, rad) => { let a = 0.42 * Math.max(0, rad.x * leeX + rad.z * leeZ) + 0.6 * Math.exp(-Math.max(p.y, 0) / 1.7);
          for (let k = 0; k < forks.length; k++) { const dy = forks[k] - p.y; if (dy > -0.6 && dy < 4) a += 0.5 * Math.exp(-dy * dy / 2.2); } return a; } });
      for (const lb of limbs) { const rr = []; for (let i = 0; i <= lb.n; i++) rr.push(Math.max(0.055, lb.r0 * (1 - 0.8 * i / lb.n)));
        sw.sweep(lb.pp, rr, { sides: t.tier === 0 ? 5 : 4, cell: 0.4, arc0: arc0 + lb.y, shape: (th, s) => 1 + 0.5 * Math.exp(-s / (1.5 * lb.r0)),
          ao: (p, rad, s) => 0.3 * Math.max(0, -rad.y) + 0.7 * Math.exp(-s / 0.8) });
        if (t.tier === 0) { const e = lb.pp[lb.n], m = lb.pp[lb.n - 1], dir = V3().subVectors(e, m).normalize();
          if (lb.low) { for (let k = 1; k <= lb.n; k++) t.hang.push(lb.pp[k]);
            for (const k of lb.more ? [2, 3, 4, 5] : [3, 5]) { const q = lb.pp[k], a = er.range(0, 6.283); addTwig(t, q, V3(Math.cos(a) * 0.8, -0.25, Math.sin(a) * 0.8).addScaledVector(dir, 0.6).normalize(), er.range(1.6, 2.6)); } }
          else { addTwig(t, e, dir, er.range(3, 4.6)); addTwig(t, m, V3(-dir.z, 0.2, dir.x), er.range(2.6, 4)); addTwig(t, m, V3(dir.z, 0.25, -dir.x), er.range(2.6, 4)); } }
        else t.hang.push(lb.pp[lb.n]); }
      if (t.tier === 0) { const top = tp[rings - 1], sub = tp[rings - 2];
        for (let k = 0; k < 3; k++) { const a = er.range(0, 6.283); addTwig(t, k ? sub : top, V3(Math.cos(a), k ? 0.5 : 1, Math.sin(a)).normalize(), er.range(2.5, 4)); } }
      if (ti % 5 === 4) await ctx.yield();
    }
    const groveFront = { value: new THREE.Vector3(1e4, 1e4, 1e4) }, featFront = groveFront, allSmoked = { value: 1e4 };      // every trunk crazed before we came
    const mkMesh = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.frustumCulled = false; scene.add(m); return m; };
    mkMesh(glazeNear.build(), style.glazeMaterial(null, { ringY: allSmoked, front: groveFront }), 'grove-near-glaze');
    await ctx.yield();
    mkMesh(glazeFar.build(), style.glazeMaterial(null, { ringY: allSmoked, front: groveFront }), 'grove-far-glaze');
    await ctx.yield();
    mkMesh(glazeFeat.build(), style.glazeMaterial(null, { ringY: allSmoked, front: featFront }), 'feature-trunk');
    await ctx.yield();

    // twigs carry their radius in aCk.x (4 rings of 4 vertices each), so the shader can hold them at 1.5 px
    const clayGeo = clay.build(); await ctx.yield(); { const a = clayGeo.getAttribute('aCk'); for (let v = 0; v < a.count; v++) a.setX(v, 0.07 * [1, 0.75, 0.5, 0.3][Math.floor((v % 16) / 4)]); }
    mkMesh(clayGeo, style.clayMaterial(), 'grove-twigs');
    await ctx.yield();

    // ---- the leaves: copper matt discs hung to quake. aTurn = the u at which smoke reaches each one ----
    const lr = rng.fork ? rng.fork('leaves') : rng, uNow = { value: 0 }, groveLeafFog = { value: U.uFogHalf.value };
    const perNear = Math.round(340 * (0.5 + 0.5 * (detail - 0.6) / 0.4)), perMid = Math.round(104 * detail), perFar = Math.round(46 * detail), perVeryFar = 14;
    const nLitter = Math.round(3600 * detail * lerp(0.8, 1.15, sat((density - 0.7) / 0.6)));
    let cap = nLitter + 120 + 46 * 5 + trees.length * 8; for (const t of trees) cap += t.tier === 0 ? perNear : t.tier === 1 ? (t.dN < 85 ? perMid : perFar) : perVeryFar;
    const lPos = new Float32Array(cap * 3), lLeaf = new Float32Array(cap * 4), lTurn = new Float32Array(cap); let nLeaf = 0;
    const putLeaf = (x, y, z, az, tilt, ph, rad, turn) => { lPos[nLeaf * 3] = x; lPos[nLeaf * 3 + 1] = y; lPos[nLeaf * 3 + 2] = z;
      lLeaf[nLeaf * 4] = az; lLeaf[nLeaf * 4 + 1] = tilt; lLeaf[nLeaf * 4 + 2] = ph; lLeaf[nLeaf * 4 + 3] = rad; lTurn[nLeaf] = turn; nLeaf++; };
    for (let ti = 0; ti < trees.length; ti++) {
      const t = trees[ti], cy = (21 + t.h) / 2 + 2, ry = (t.h - 19) / 2;
      const n = t.tier === 0 ? perNear : t.tier === 1 ? (t.dN < 85 ? perMid : perFar) : perVeryFar;
      const rad0 = t.tier === 0 ? 0.4 : t.tier === 1 ? (t.dN < 85 ? 0.62 : 1.0) : 2.4, rad1 = t.tier === 0 ? 0.55 : t.tier === 1 ? (t.dN < 85 ? 0.86 : 1.4) : 3.6;
      for (let k = 0; k < n; k++) {
        let x, y, z; const a = lr.range(0, 6.283), rr = Math.sqrt(lr()), v = lr.range(-1, 1), rad = lr.range(rad0, rad1), ph = lr(), az = lr.range(0, 6.283), tl = lr.gauss() * 0.45, jit = lr.range(-1, 1), stay = lr(), pick = lr();
        if (t.hang.length && (t.tier === 0 || pick < 0.45)) { const h = t.hang[Math.floor(pick * 0.999 * t.hang.length * (t.tier === 0 ? 1 : 2.2)) % t.hang.length], sc = t.tier === 0 ? 3.1 : 4.2;
          x = h.x + Math.cos(a) * rr * sc; z = h.z + Math.sin(a) * rr * sc; y = h.y + 0.4 - (v * 0.5 + 0.5) * 2.6; }
        else { const q = Math.sqrt(Math.max(0, 1 - v * v * 0.8)) * (t.tier === 2 ? 5 : 6.5) * rr; x = t.x + Math.cos(a) * q; z = t.z + Math.sin(a) * q; y = cy + v * ry; }
        if (y < 20.5) y = 20.5 + (20.5 - y) * 0.5;
        let rs = 1; if (t.ns.length) { const c = clearOf(t.ns, x, y, z); if (c < 4.3) continue; rs = Math.min(1, Math.max(0.5, (c - 2) / 8)); }
        putLeaf(x, y, z, az, tl, ph, rad * rs, turnU(x, z, y, t, jit, stay));
      }
      if (ti % 12 === 11) await ctx.yield();
    }
    // crown masses: every tree carries a few big discs lying nearly flat high in its crown, in the crown's own state, so from
    // above the wood is a canopy of round masses that hides the floor (the brief's cluster discs), not confetti over sticks
    for (let ti = 0; ti < trees.length; ti++) { const t = trees[ti], n = t.tier === 2 ? 5 : 8, top = t.h - (t.tier === 0 ? 1.5 : 3);
      for (let k = 0; k < n; k++) { const h1 = (t.sd * (k + 3) * 5.7) % 1, a = t.sd * 40 + k * 2.4, q = k === 0 ? 0 : 2.2 + 3 * h1, x = t.x + Math.cos(a) * q, z = t.z + Math.sin(a) * q, y = top - (k === 0 ? 0 : 0.8 + (k % 4) * 1.3);
        putLeaf(x, y, z, a, (k % 2 ? 1 : -1) * (1.02 + 0.42 * h1), (t.sd * (k + 1) * 3.3) % 1, k === 0 ? 3.3 : 2.1 + 1.0 * h1, turnU(x, z, y, t, 0, 1)); } }
    await ctx.yield();
    // the two low branches: forty discs each in a line under the limb. One turns at u 0.03-0.06 in a line that runs along it
    // from the trunk outward; the other turned before we came (so copper is in the first frame, small)
    for (const [lb, ev] of [[lowBranch, true], [lowBranch2, false]]) { if (!lb) continue; const n = lb.pp.length - 1;
      for (let k = 0; k < 44; k++) { const f = (k + lr()) / 44, x = f * n, i0 = Math.min(n - 1, Math.floor(x)), p = V3().lerpVectors(lb.pp[i0], lb.pp[i0 + 1], x - i0);
        putLeaf(p.x + lr.range(-1.0, 1.0), p.y - lr.range(0.5, 1.9), p.z + lr.range(-1.0, 1.0), lr.range(0, 6.283), lr.gauss() * 0.4, lr(), lr.range(0.5, 0.66), ev ? 0.022 + 0.05 * ((Math.floor(f * 3.999) * 0.618 + 0.3) % 1) + 0.012 * Math.abs(f * 4 % 1 - 0.5) : -1); } }
    for (const lb of lowBoughs) { const n = lb.pp.length - 1;
      for (let k = 0; k < 46; k++) { const fq = (k + lr()) / 46, x = (0.25 + 0.75 * fq) * n, i0 = Math.min(n - 1, Math.floor(x)), p = V3().lerpVectors(lb.pp[i0], lb.pp[i0 + 1], x - i0);
        putLeaf(p.x + lr.range(-1.4, 1.4), p.y - lr.range(0.3, 2.0), p.z + lr.range(-1.4, 1.4), lr.range(0, 6.283), lr.gauss() * 0.4, lr(), lr.range(0.46, 0.62), 1e9); } }
    // litter: unturned green discs lying flat on the black floor along the way, stirring
    for (let k = 0; k < nLitter; k++) { const d = 3 + Math.pow(lr(), 1.2) * (uHelix0 * L), lat = lr.gauss() * 10, p = path.posAtDist(d, _tmp), big = lr();
      putLeaf(p.x + lat + lr.range(-2, 2), 0.07 + lr() * 0.05, p.z + lr.range(-4, 4), lr.range(0, 6.283), 1.47 + lr.range(-0.05, 0.05), lr(), big < 0.15 ? lr.range(0.3, 0.38) : lr.range(0.17, 0.27), 1e9);
      if (k % 600 === 599) await ctx.yield(); }
    const leafMesh = mkMesh(leafGeometry(lPos.subarray(0, nLeaf * 3), lLeaf.subarray(0, nLeaf * 4), lTurn.subarray(0, nLeaf)), style.leafMaterial(uNow, 0.004, null, { minPx: 1.3, fogHalf: groveLeafFog }), 'grove-leaves');
    const groveMinPx = leafMesh.material.uniforms.uMinPx;
    await ctx.yield();

    // ---- floor (bare smoked clay with lying smoke), sky (kiln smoke and the flat disc) ----
    const floorFog = { value: Math.max(300, U.uFogHalf.value * 1.8) };      // the black clay holds through more smoke than the wood: black to 40 m, mid grey only past 100 m
    const floor = mkMesh(new THREE.CircleGeometry(350, 72).rotateX(-Math.PI / 2), style.floorMaterial({ pool: hour === 'morning' ? 1.15 : 1, ash: 1, entryZ: 0, poolAt: V3(-7.5, 13, 5.2), clearAt: V3(0, HZ, 13), fogHalf: floorFog }), 'floor');
    const skyOpts = { floor: true, floorY: 0, pool: hour === 'morning' ? 1.15 : 1, ash: 1, band: 0.3, entryZ: 0, poolAt: V3(-7.5, 13, 5.2), clearAt: V3(0, HZ, 13), fogHalf: floorFog, farLine: 1, glow: hour === 'late' ? 1.15 : 1 };
    floor.position.set(0, 0, GC.z);
    const sky = mkMesh(new THREE.SphereGeometry(600, 24, 12), style.skyMaterial(skyOpts), 'sky'); sky.renderOrder = -1;

    // ---- boulders in white crackle; leaf piles raked up and left smouldering (black mounds, no flame, no glow) ----
    const fr = rng.fork ? rng.fork('floor') : rng;
    const rocks = makeSweeper(), mounds = makeSweeper();
    const lump = (sw, cx, cz, r, hgt, sink, cell, seedv) => { const pp = [], rr = [], n = 8;
      for (let i = 0; i <= n; i++) { const f = i / n, y = -sink + (hgt + sink) * f, e = Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(2 * f - 1), 2.3)));
        pp.push(V3(cx + Math.sin(f * 3 + seedv) * r * 0.12, y, cz + Math.cos(f * 2.3 + seedv) * r * 0.12)); rr.push(Math.max(0.02 * r, r * e)); }
      sw.sweep(pp, rr, { sides: 12, cell, arc0: 0, shape: (th, s) => 1 + 0.16 * Math.sin(2 * th + seedv) + 0.1 * Math.sin(3 * th + s * 0.8 + seedv * 3) + 0.06 * Math.sin(5 * th - s),
        ao: (p, rad) => 0.55 * Math.exp(-Math.max(p.y, 0) / (0.35 * hgt)) + 0.35 * Math.max(0, rad.x * leeX + rad.z * leeZ) + 0.25 * Math.max(0, -rad.y) }); };
    for (const b of boulders) lump(rocks, b.x, b.z, b.r, b.r * 1.25, b.r * 0.45, 0.5, b.x * 1.3 + b.z);
    for (let k = 0; k < Math.round(26 * density); k++) { const d = fr.range(20, uHelix0 * L), p = path.posAtDist(d, _tmp), lat = (fr() < 0.5 ? -1 : 1) * fr.range(13, 42), r = fr.range(0.9, 2.4), x = p.x + lat, z = p.z + fr.range(-5, 5);
      if (reserved(x, z, r + 0.5) || nearTree(x, z, r + 1.6) || path.nearestXZ(x, z).dist < 11 || Math.hypot(x, z - HZ) < 14) continue; lump(rocks, x, z, r, r * fr.range(1, 1.4), r * 0.45, 0.5, k * 7.7); }
    mkMesh(rocks.build(), style.glazeMaterial(), 'boulders');
    for (const p of piles) { lump(mounds, p.x, p.z, 2.0, 1.25, 0.9, 1.2, p.z); lump(mounds, p.x + 1.3, p.z - 0.8, 1.1, 0.7, 0.5, 1.2, p.x); }
    mkMesh(mounds.build(), style.clayMaterial(), 'leaf-piles');
    await ctx.yield();

    // ---- black clay ferns and seedling whips along the way (the near marks of the floor run) ----
    { const P = [], N = [], UVv = [], CK = [], q = V3(), d = V3(), sd = V3();
      const tri = (a, b, c, s0, s1, s2, z0 = 0, z1 = 0, z2 = 0) => { P.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); N.push(0, 1, 0, 0, 1, 0, 0, 1, 0); UVv.push(0, 0, 0, 0, 0, 0); CK.push(0, 0, z0, s0, 0, 0, z1, s1, 0, 0, z2, s2); };
      const nFern = Math.round(240 * detail * density), nWhip = Math.round(240 * detail);
      for (let k = 0; k < nFern + nWhip; k++) {
        if (k % 50 === 49) await ctx.yield();
        const dd = Math.pow(fr(), 1.4) * (uHelix0 * L - 30), p = path.posAtDist(dd, _tmp), lat = (fr() < 0.5 ? -1 : 1) * (4.6 + Math.abs(fr.gauss()) * 5.5), x = p.x + lat, z = p.z + fr.range(-3, 3);
        const a0 = fr.range(0, 6.283), size = fr.range(0.8, 1.5);
        if (reserved(x, z, 0.6) || nearTree(x, z, 1.3) || Math.hypot(x, z - HZ) < 9) continue;
        if (k < nFern) { const nf = 5 + (k % 3);
          for (let j = 0; j < nf; j++) { const a = a0 + j * 6.283 / nf + fr.range(-0.3, 0.3), len = size * fr.range(1.3, 2.3), seg = 7; d.set(Math.cos(a), 0, Math.sin(a)); sd.set(-d.z, 0, d.x);
            let prev = V3(x, 0, z), pw = 0.02;
            for (let s = 1; s <= seg; s++) { const f = s / seg, cur = V3(x + d.x * len * f, len * 0.8 * Math.sin(f * 2.35) * (1 - 0.2 * f), z + d.z * len * f), w = s === seg ? 0 : len * 0.055 * Math.pow(Math.sin(Math.PI * Math.min(1, f * 1.1)), 0.6) + 0.012, sw0 = ((s - 1) / seg) ** 2, sw1 = f * f;
              const a0 = prev.clone().addScaledVector(sd, -pw), a1 = prev.clone().addScaledVector(sd, pw), b0 = cur.clone().addScaledVector(sd, -w), b1 = cur.clone().addScaledVector(sd, w);
              tri(a0, a1, b0, sw0, sw0, sw1, 0, 1, 0); if (s < seg) tri(a1, b1, b0, sw0, sw1, sw1, 1, 1, 0);
              if (s > 2 && s < seg && (j + k) % 2 === 0) { const sg = s % 2 ? 1 : -1, tip = cur.clone().addScaledVector(sd, sg * len * 0.2).addScaledVector(d, len * 0.07); tip.y -= len * 0.05; const zz = sg > 0 ? 1 : 0; tri(prev.clone().lerp(cur, 0.4), cur, tip, sw1, sw1, sw1, zz, zz, zz); }
              pw = w; prev = cur; } } }
        else { const h = size * fr.range(0.9, 1.7), lean = fr.range(0.1, 0.5); d.set(Math.cos(a0), 0, Math.sin(a0)); sd.set(-d.z, 0, d.x); let prev = V3(x, 0, z);
          for (let s = 1; s <= 4; s++) { const f = s / 4, cur = V3(x + d.x * lean * f * f * h, h * f, z + d.z * lean * f * f * h), w = 0.035 * (1.2 - f);
            tri(prev.clone().addScaledVector(sd, -w), prev.clone().addScaledVector(sd, w), cur, (f - 0.25) ** 2, (f - 0.25) ** 2, f * f);
            if (s > 1) tri(prev, cur, cur.clone().addScaledVector(d, 0.3).add(V3(0, 0.22, 0)).addScaledVector(sd, (s % 2 ? 1 : -1) * 0.2), f * f, f * f, f * f);      // a bud
            prev = cur; } }
      }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      await ctx.yield();
      g.setAttribute('uv', new THREE.Float32BufferAttribute(UVv, 2)); g.setAttribute('aCk', new THREE.Float32BufferAttribute(CK, 4));
      mkMesh(g, style.clayMaterial({ side: THREE.DoubleSide }), 'ferns'); }
    await ctx.yield();

    // ---- the exit: the Stem's eldest daughter, bowed into a hoop, 80 m out and 60 m up ----
    const hoop = await buildDaughterHoop(ctx, style, { centre: seat, dir: exitDir, groundY: 0, opening: 7.5, turnNow: uNow, turn: rare ? 0.93 : 1e9, turnSoft: 0.004, crownTurn: uHelix1 - 0.09 });
    scene.add(hoop.object);
    const hoopTurn = { value: 0 };
    { const n = hoop.perches.length, R = new Float32Array(n * 3), B = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { const p = hoop.perches[i]; R[i * 3] = p.x - seat.x; R[i * 3 + 1] = p.y + 0.1; R[i * 3 + 2] = p.z - seat.z;
        B[i * 4] = 2 + 30 * ((i * 0.618) % 1); B[i * 4 + 1] = (i * 0.37 + 0.11) % 1; B[i * 4 + 2] = 11 + 5 * ((i * 0.27) % 1); B[i * 4 + 3] = (i % 3) / 3; }
      const m = mkMesh(birdGeometry(R, B), style.birdMaterial(hoopTurn, birdScale), 'hoop-birds'); m.position.set(seat.x, 0, seat.z); }
    await ctx.yield();

    // ---- smoke: the drift we ride, ankle smoke on the avenue, a rope from each pile, morning sheets, the rare bank ----
    const sr = rng.fork ? rng.fork('smoke') : rng;
    const puffs = (n, fn) => { const P = new Float32Array(n * 3), Q = new Float32Array(n * 4), o = [0, 0, 0, 1, 0, 0, 0.5];
      for (let i = 0; i < n; i++) { fn(i, o); P[i * 3] = o[0]; P[i * 3 + 1] = o[1]; P[i * 3 + 2] = o[2]; Q[i * 4] = o[3]; Q[i * 4 + 1] = sr(); Q[i * 4 + 2] = o[5]; Q[i * 4 + 3] = o[6]; }
      return smokeGeometry(P, Q); };
    const d0 = uFloorEnd * L - 14, d1 = (uHelix0 - 0.13) * L;
    const drift = mkMesh(puffs(Math.round(430 * detail), (i, o) => { const p = path.posAtDist(sr.range(d0, d1), _tmp), up = Math.abs(sr.gauss()) * 4 + 1.5, sd = sr.gauss() * 9;
      o[0] = p.x + (p.z > 128 ? Math.abs(sd) * 1.25 + 4.5 : sd + (sd < 0 ? -7 : 7)); o[1] = Math.max(1.5, p.y + up + (p.z > 128 ? 2 : 0)); o[2] = p.z + sr.range(-4, 4); o[3] = sr.range(4.5, 8.5); o[5] = 0; o[6] = sr.range(0.5, 1.3); }),
      style.smokeMaterial({ alpha: weather === 'thick' ? 0.045 : 0.032 }), 'smoke-drift'); drift.renderOrder = 5;
    const perRope = Math.round(96 * (0.7 + 0.3 * detail));
    for (const p of piles) { const m = mkMesh(puffs(perRope, (i, o) => {
      o[0] = sr.range(-0.3, 0.3); o[1] = 1.15; o[2] = sr.range(-0.3, 0.3); o[3] = sr.range(0.6, 1.05); o[5] = sr.range(0.03, 0.045); o[6] = 0.1; }),
      style.smokeMaterial({ alpha: 0.14, rope: 22, bend: V3(2.5, -3, 15), pale: -0.7 }), 'smoke-rope'); m.position.set(p.x, 0, p.z); m.renderOrder = 5; }
    // wisps that go round the Old Stem inside the ring, at the turning line (the hero's own ring is the wide one)
    const skirt = mkMesh(puffs(Math.round(170 * detail), (i, o) => { const a = sr.range(0, 6.283), r = sr.range(6.5, 32);
      o[0] = Math.cos(a) * r; o[1] = sr.gauss() * 6 - 3; o[2] = Math.sin(a) * r; o[3] = sr.range(1.3, 3.2); o[5] = 0; o[6] = sr.range(0.3, 0.8); }),
      style.smokeMaterial({ lift: hero.ringY, spin: 0.11, alpha: 0.08, pale: -0.45, far: [22, 55, 0.85] }), 'smoke-skirt'); skirt.renderOrder = 5; skirt.position.set(0, 0, HZ);
    if (hour === 'morning') { const sheets = mkMesh(puffs(Math.round(170 * detail), (i, o) => { const p = path.posAtDist(sr.range(-20, uHelix0 * L + 40), _tmp);
        o[0] = p.x + sr.range(-60, 60); o[1] = (i % 2 ? 6 : 20) + sr.range(-0.4, 0.4); o[2] = p.z + sr.range(-10, 10); o[3] = sr.range(11, 20); o[5] = 0; o[6] = 0.15; }),
        style.smokeMaterial({ alpha: 0.15, flat: true }), 'smoke-sheets'); sheets.renderOrder = 4; }
    // the rare bank: a wall of smoke 600 m long that crosses the grove under us during the exit; the canopy turns along it
    let bank = null;
    if (rare) { bank = mkMesh(puffs(Math.round(260 * detail), (i, o) => { const s = sr.range(-310, 310) * 0.75, c = sr.gauss() * 110 + 95;
        o[0] = exH.x * c - exH.z * s; o[1] = sr.range(33, 50); o[2] = exH.z * c + exH.x * s; o[3] = sr.range(13, 22); o[5] = 0; o[6] = 1.2; }),
        style.smokeMaterial({ alpha: 0.2, pale: 0.35 }), 'smoke-bank'); bank.renderOrder = 5; bank.position.set(0, 0, HZ); }
    const driftMats = [];
    for (let i = 0; i < drifts.length; i++) { const d = drifts[i];
      const m = mkMesh(puffs(Math.round(70 * detail), (k, o) => { const al = sr.range(-300, 300), ac = sr.gauss() * d.w * 0.45 - 9 * Math.sin(al * 0.022 + d.ph);
        o[0] = d.px + d.dx * al + d.dz * ac; o[1] = sr.range(31, 47); o[2] = d.pz + d.dz * al - d.dx * ac; o[3] = sr.range(9, 16); o[5] = sr.range(0.012, 0.02); o[6] = 0.8; }),
        style.smokeMaterial({ alpha: 0.21, rope: 0, bend: V3(d.dx * 70, 0, d.dz * 70), pale: -0.12 }), 'smoke-drift-' + i); m.renderOrder = 5; driftMats.push(m.material); }
    { const side = V3().crossVectors(exitDir, V3(0, 1, 0)).normalize(), tilt = sr.range(-0.07, 0.07);
      const m = mkMesh(puffs(Math.round(90 * detail), (k, o) => { const al = sr.range(-170, 170), back = 72 + sr.gauss() * 12, upb = k % 4 === 0 ? sr.range(17, 26) : sr.range(-6, 3);
        o[0] = seat.x + exitDir.x * back + side.x * al; o[1] = seat.y + upb + al * tilt + sr.gauss() * 1.6; o[2] = seat.z + exitDir.z * back + side.z * al; o[3] = sr.range(13, 24); o[5] = 0; o[6] = 0.9; }),
        style.smokeMaterial({ alpha: 0.25, pale: -0.36, far: [500, 900, 0.5] }), 'smoke-behind-hoop'); m.renderOrder = 3; }
    await ctx.yield();

    // ---- free birds: the one that flies with us up the drift, two that leave their boulder across the nose, the last through the hoop ----
    const flyerGeo = flyerGeometry();
    const mkFlyer = (name, sc) => { const flap = { value: 0 }, fold = { value: 0 }, head = { value: 0 }, m = mkMesh(flyerGeo, style.flyerMaterial(flap, fold, sc || birdScale, head), name); return { m, flap, fold, head, seed: sr(), sc: sc || birdScale }; };
    const compLead = cast === 'owl' ? 4.8 : 4.0;
    const companion = mkFlyer('companion', cast === 'owl' ? 2.5 : cast === 'woodpecker' ? 2.2 : 2.3), hoppers = [mkFlyer('hopper-a', birdScale * 1.1), mkFlyer('hopper-b', birdScale * 1.1)], passers = [];
    for (let i = 0; i < 5; i++) passers.push(mkFlyer('passer-' + i, i < 2 ? birdScale * 1.4 : undefined));
    const ringMat = hero.object.getObjectByName('old-stem-smoke-ring')?.material, skirtMat = skirt.material;
    const b0 = boulders[0], perch = [V3(b0.x + 0.3, b0.r * 1.25 + 0.14 * birdScale, b0.z - 0.35), V3(b0.x - 0.55, b0.r * 1.16 + 0.14 * birdScale, b0.z + 0.6)];

    // ---- deer: a file of white crackle deer with black legs, walking between the trunks; they stop and look up as we pass ----
    const deerGeo = (() => { const b = makeSweeper(), h = makeSweeper(), l = makeSweeper(), o = { sides: 9, cell: 0.34, arc0: 0, ao: (p, rad) => 0.45 * Math.max(0, -rad.y) + 0.2 * Math.max(0, rad.x * leeX + rad.z * leeZ) };
      b.sweep([V3(0, 2.5, -1.75), V3(0, 2.62, -1.3), V3(0, 2.6, -0.4), V3(0, 2.56, 0.5), V3(0, 2.62, 1.2), V3(0, 2.72, 1.62)], [0.1, 0.56, 0.62, 0.6, 0.56, 0.3], o);
      b.sweep([V3(0, 2.62, 1.25), V3(0, 3.05, 1.6), V3(0, 3.5, 1.82), V3(0, 3.8, 1.93)], [0.42, 0.33, 0.25, 0.21], o);                 // neck
      b.sweep([V3(0, 2.8, -1.6), V3(0, 2.75, -1.95), V3(0, 2.5, -2.1)], [0.14, 0.11, 0.04], { ...o, sides: 5 });                         // tail
      h.sweep([V3(0, 0.02, -0.28), V3(0, 0.06, 0), V3(0, 0.0, 0.34), V3(0, -0.1, 0.66), V3(0, -0.14, 0.86)], [0.1, 0.27, 0.23, 0.14, 0.1], o);
      for (const s of [-1, 1]) h.sweep([V3(s * 0.16, 0.2, -0.08), V3(s * 0.33, 0.45, -0.16), V3(s * 0.4, 0.68, -0.2)], [0.07, 0.1, 0.02], { ...o, sides: 4 });   // ears
      l.sweep([V3(0, 0.15, 0), V3(0, -0.9, 0.05), V3(0, -1.5, -0.02), V3(0, -2.25, 0.03), V3(0, -2.42, 0.1)], [0.2, 0.12, 0.085, 0.07, 0.09], { sides: 6, cell: 0.5 });
      return { body: b.build(), head: h.build(), leg: l.build() }; })();
    const deerMat = style.glazeMaterial(), legMat = style.clayMaterial(), nDeer = Math.max(4, Math.min(6, Math.round(5 * density))), deer = [];
    for (let i = 0; i < nDeer; i++) { const g = new THREE.Group(), sc = i === 0 ? 1.08 : i === nDeer - 1 ? 0.72 : sr.range(0.9, 1.02);
      const body = new THREE.Mesh(deerGeo.body, deerMat), head = new THREE.Mesh(deerGeo.head, deerMat), legs = [];
      head.position.set(0, 3.86, 1.95); g.add(body, head);
      for (let k = 0; k < 4; k++) { const lg = new THREE.Mesh(deerGeo.leg, legMat); lg.position.set(k % 2 ? 0.3 : -0.3, 2.4, k < 2 ? 1.15 : -1.2); g.add(lg); legs.push(lg); }
      g.scale.setScalar(sc); g.position.set(deerLane.x + sr.range(-0.7, 0.7), 0, 67 - i * 5.4); scene.add(g);
      deer.push({ g, head, legs, z0: 70 - i * 4.7, ph: sr.range(0, 6.28), sc }); }
    let deerWalk = 0;
    await ctx.yield();

    // ---- gaze and pace ----
    const trunkW = (y, out) => { const a = A.trunkAt(y); return out.set(a.x, y, a.z + HZ); };
    const _poiA = V3(), _poiB = V3(), _poiC = V3();
    const _poiD = V3(), _poiE = V3(), _poiF = V3();
    const aheadOf = (u, du, dy, out) => { path.pointAt(sat(u + du), out); out.y += dy; return out; };
    const pois = [
      { at: (time, u) => _poiC.set(deerLane.x - 1, 2.6, 56 + deerWalk), from: 0.075, to: 0.15, weight: 0.5, fade: 0.35 },
      { at: [0, 36, HZ], from: 0.2, to: uHelix0 + 0.04, weight: 0.62, fade: 0.3 },
      // the climb is three pictures: down the spiral at the black floor and the copper below, out along the boughs with the
      // trunk as a side frame, the lace close to, then up into the green ceiling
      { at: (time, u) => aheadOf(u, 0.05, -11, _poiD), from: uHelix0 + 0.035, to: uHelix0 + 0.15, weight: 0.42, fade: 0.35 },
      { at: (time, u) => trunkW(pathY(u) + 1, _poiA), from: uHelix0 - 0.05, to: uHelix1 - 0.01, weight: 0.12, fade: 0.22 },
      { at: (time, u) => trunkW(pathY(u) + 0.5, _poiB), from: uClose - 0.028, to: uClose + 0.04, weight: 0.42, fade: 0.4 },
      { at: (time, u) => trunkW(pathY(u) + 11, _poiE), from: uOne - 0.02, to: uOne + 0.075, weight: 0.15, fade: 0.35 },
      { at: (time, u) => aheadOf(u, 0.045, 6.5, _poiF), from: uOne - 0.02, to: uOne + 0.075, weight: 0.22, fade: 0.35 },
    ];
    const pace = (u) => 0.7 + 0.8 * ss(uFloorEnd - 0.03, uFloorEnd + 0.05, u) - 0.7 * ss(uHelix0 - 0.1, uHelix0 - 0.01, u) + 0.2 * ss(0.855, 0.9, u);

    // ---- every frame: the bloom clock, the Stem's smoke distance, birds, deer. Nothing is made here ----
    const _p = V3(), _q = V3(), _tg = V3(), _r = V3(), UP = V3(0, 1, 0), camSide = V3(8, 3.4, 11.5);
    const place = (f, pos, heading, roll, scale) => { f.m.position.copy(pos); _q.copy(pos).add(heading); f.m.up.set(Math.sin(roll), Math.cos(roll), 0); f.m.lookAt(_q); f.m.scale.setScalar(scale); };
    const beatHz = cast === 'owl' ? 0.9 : cast === 'woodpecker' ? 2.6 : 2;
    const wing = (time, seed, glideAmt) => { const g = 1 - glideAmt * ss(0.3, 0.8, Math.sin(time * 0.7 + seed * 20)); return Math.sin(time * 6.2832 * beatHz + seed * 30) * 0.95 * g + 0.12; };
    function update(dt, time, camera, u) {
      u = sat(u || 0);
      hero.setRingY(ringAt(u)); hero.update(dt, time, camera);
      // the ring gathers as we go in under the lowest limb: before that it is a breath, so the Stem stands clear at its reveal
      { const gather = ss(uHelix0 - 0.085, uHelix0 - 0.015, u); if (ringMat) ringMat.uniforms.uAlpha.value = 0.028 * gather; skirtMat.uniforms.uAlpha.value = 0.06 * gather; }
      uNow.value = u; hoopTurn.value = (u - 0.865) * 420;
      // the Stem is the one thing meant to be seen from the entry on: it keeps its marks through more smoke while it is far off
      { const k = 1 - ss(0.04, 0.34, u); hero.fog.value = stemFog0 * (1 + 1.7 * k); stemLeafFog.value = stemFog0 * (1.5 + 1.5 * k); }
      // from above the wood is a canopy: crowns keep their copper and their mass (longer smoke, a larger least disc)
      if (camera) { const cy = camera.matrixWorld.elements[13], hi = ss(27, 46, cy); groveLeafFog.value = U.uFogHalf.value * (1 + 1.8 * hi); groveMinPx.value = 1.3 + 2.3 * hi; for (const dm of driftMats) dm.uniforms.uAlpha.value = 0.21 - 0.16 * hi; }
      // the companion: it drops in over our right shoulder at u 0.05, flies with us a few metres ahead and a little below the
      // eye, banked so its back and open wings are toward us, looks back once at u 0.27, and peels off toward the Stem
      { const drop = 1 - ss(0.04, 0.09, u), away = ss(0.3, 0.38, u), lift = ss(0.19, 0.25, u), lead = compLead + lift * 1.2 + drop * 7 + away * 34, d = u * L + lead;
        path.posAtDist(d, _p); path.tangentAtDist(d, _tg); _r.crossVectors(_tg, UP).normalize();
        const glance = ss(0.262, 0.272, u) * (1 - ss(0.285, 0.297, u));
        _p.addScaledVector(_r, 0.35 + 0.5 * Math.sin(u * 34 - 7.6) + drop * 6 + away * 15 + 0.2 * Math.sin(time * 0.9))
          .addScaledVector(UP, -0.5 + 0.95 * lift + 0.1 * Math.sin(u * 50) + drop * 8 + away * 10 + 0.15 * Math.sin(time * 1.3 + 1));
        _tg.addScaledVector(_r, away * 0.7 - glance * 0.35 - drop * 0.5 + 0.1).addScaledVector(UP, away * 0.3 - drop * 0.6 + 0.5 + 0.06 * lift).normalize();
        companion.head.value = glance * 2.1;
        companion.flap.value = wing(time, companion.seed, 0) * 0.55 + 0.1; place(companion, _p, _tg, -(0.42 + 0.1 * Math.sin(u * 40)) * (1 - 1.9 * lift) - glance * 0.2 - away * 0.3, 1); }
      // two on the boulder by the entry: they hop, then leave across the nose
      for (let i = 0; i < 2; i++) { const h = hoppers[i], s = ss(0.008 + i * 0.006, 0.05 + i * 0.008, u), s2 = ss(0.05, 0.13, u);
        path.pointAt(u, _p); _p.add(camSide).add(_q.set(i * 2.2 + s2 * 12, i * 0.9 + s2 * 13, i * 1.5 + s2 * 26));
        _p.lerpVectors(perch[i], _p, s); _p.y += Math.sin(s * Math.PI) * 1.6 * (1 - s2);
        const hop = Math.max(0, Math.sin(time * 1.7 + i * 2.4)) ; if (s <= 0) _p.y += hop * hop * hop * 0.22;
        _tg.set(0.83, 0.12 + 0.3 * s2, 0.55).normalize(); if (s <= 0) { _tg.set(Math.sin(i * 2.3 + 0.9 + 0.3 * Math.sin(time * 0.6 + i)), 0.5, -Math.cos(i * 2.3 + 0.9)).normalize(); h.head.value = 0.9 * Math.sin(time * 0.8 + i * 2); } else h.head.value = 0;
        h.fold.value = 1 - ss(0, 0.12, s); h.flap.value = wing(time, h.seed, 0.15); place(h, _p, _tg, -0.55 * ss(0.05, 0.5, s) * (1 - s2), 1); }
      // the last ones out: they come up from under the leaf shell, converge on the hoop and go through before us
      for (let i = 0; i < passers.length; i++) { const f = passers[i], k = ss(0.895, 0.985, u), gap = 5.6 + i * 2.2 + k * (40 + i * 7), db = (1 - u) * L - gap, spread = (1 - ss(0.3, 0.95, k)) * (i < 2 ? 0.3 : 1);
        const a = i * 2.4 + 0.5; _r.crossVectors(exitDir, UP).normalize();
        _p.copy(seat).addScaledVector(exitDir, -db).addScaledVector(_r, i < 2 ? (i ? -3 : 2.3) * (0.55 + 1.5 * spread) : Math.cos(a) * (2 + 9 * spread)).addScaledVector(UP, (i < 2 ? (i ? -1.2 : 0.4) : Math.sin(a) * 2 - 7 * spread * spread) + 0.4 * Math.sin(time * 1.1 + i));
        _tg.copy(exitDir).addScaledVector(_r, -Math.cos(a) * 0.25 * spread).addScaledVector(UP, 0.3 * spread).normalize();
        const dirn = i % 2 ? 1 : -1, th = time * (0.2 + 0.03 * i) * dirn + i * 1.9, ro = 31 + 3.2 * i, go = ss(0.835, 0.868, u);
        _q.set(Math.sin(th) * ro, 34 + 5.5 * i + 2.5 * Math.sin(th * 1.3 + i), HZ + Math.cos(th) * ro); _r.set(Math.cos(th) * dirn, 0.05, -Math.sin(th) * dirn);
        _p.lerpVectors(_q, _p, go); _tg.lerp(_r, 1 - go).normalize();
        f.flap.value = wing(time, f.seed, 0.4); place(f, _p, _tg, (1 - go) * -0.3 * dirn + (i < 2 ? (i ? 0.5 : -0.5) * go * (0.4 + 2 * spread) : 0), db > -6 ? 1 : 0.001); }
      // deer: walk on world time, stop and look up while we pass (u), walk on when we have gone
      const halt = ss(0.07, 0.092, u) * (1 - ss(0.2, 0.24, u));
      deerWalk = 14 * ss(-0.02, 0.092, u) + 10 * ss(0.2, 0.3, u);
      for (let i = 0; i < deer.length; i++) { const d = deer[i], ph = (deerWalk / (1.9 * d.sc)) * Math.PI + d.ph, sw = 0.36 * (1 - halt);
        d.g.position.z = d.z0 + deerWalk; d.g.position.y = 0.04 * Math.abs(Math.sin(ph)) * (1 - halt);
        d.legs[0].rotation.x = Math.sin(ph) * sw; d.legs[1].rotation.x = -Math.sin(ph) * sw; d.legs[2].rotation.x = -Math.sin(ph + 0.5) * sw; d.legs[3].rotation.x = Math.sin(ph + 0.5) * sw;
        const look = halt * (0.6 + 0.4 * Math.sin(time * 0.5 + d.ph));
        d.head.rotation.set(lerp(0.35 + 0.06 * Math.sin(ph * 2), -0.4, look), -1.0 * look * (0.8 + 0.2 * Math.sin(time * 0.31 + i)), 0, 'YXZ'); }
      if (bank) bank.material.uniforms.uAlpha.value = 0.2 * ss(0.74, 0.83, u);
    }
    update(0, 0, null, 0);

    return {
      scene, path, duration: DURATION, pace,
      title: hour === 'morning' ? 'Smoke Turns the Aspens, Early' : hour === 'late' ? 'Smoke Turns the Aspens, Late Day' : 'Smoke Turns the Aspens',
      ride: 'none', style: 'none', companion: 'none',
      camera: { fov: 62, near: 0.3, far: 1800, lookAhead: 18, sway: 0.6, bank: 0.5 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#F1EEE6', glow: 0.25, tilt: true, revealDistance: 240 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      update,
      dispose() { hero.dispose(); },
      info: { hour, firing, weather, cast, rare, trees: trees.length, leaves: nLeaf, uFloorEnd, uHelix0, uHelix1, uClose, uOne, L, hero: hero.stats },
    };
  },
};
