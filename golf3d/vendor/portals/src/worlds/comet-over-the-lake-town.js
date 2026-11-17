// THE COMET COMES APART: deep dusk over a crater lake. A great comet hangs low over the far rim, its head come apart
// into a train of pieces under a cream fan of dust and a thin blue thread of gas; slow far meteors cross the high air
// and burn out there. We come in low over dead-still water that holds the whole sky, round an islet, cross the quay
// of a quiet town of tiled roofs and fly up its main lane between the houses, pass a small shrine in tall cedars,
// climb a wooded ride up a brook's bouldered bed, cross a flight of flooded terraces and reach the rim, where the ring stands
// under the comet's head.
// HEAD NOTES (design typed here). The route's line is typed in the land part (ROUTE); the town's main lane is laid on
// that line, and what stands along it is dealt by rule from streams of its own. The eye's pace is one plain speed (PACE).
// The comet, the stars and the twilight stand at the far plane and are fixed in the sky. The lake's mirror is one planar
// reflection of the whole scene. Nothing travels with the eye.
// THE COMET COMES APART (the journey's one turn, a beat driven by metres flown from named places, never by the clock,
// the same on every visit): from where the shrine's gate is abeam to where the line crosses the top terrace's bank the
// train's pieces drift apart, each with a glow of its own; from where the eye first stands level with the top of the
// lowest terrace's bank (it sees over the bench's lip) to where the line crosses the third terrace's bank a shower of
// meteors comes out, streaming from the broken head as from one radiant. Before that place only the calm slow meteors fly.
// Everything else that moves runs on the world's clock in loops (the comet's life, meteors, lamps, fireflies,
// the mist), each with speeds and phases from a seeded stream of its own.
// THE TWO FLOORS, each ONE elevation in the sky set once at build, the same from every place. The calm meteors' floor:
// the highest ground skyline seen from anywhere on the route (scanned every 5 m of it, on every bearing a meteor can stand
// on: none stands farther than 41 degrees from the comet's bearing), plus 6 degrees (and half a degree for the scan's
// grain). The shower's floor: the same scan taken from the places where the shower is out only (the route's line from
// the place where its beat begins, above, to the ring) and inside the shower's field (the notch of open sky about the
// comet's bearing, as wide either hand as that skyline stays within 1.5 degrees of its height under the comet), plus
// the same 6.5 degrees.
// Looks dealt: ctx.vary.hour night or dawn deals DEEP DUSK, every other hour EARLY DUSK (no seed changes the look).
// Levels of detail by the eye's place alone (never by the lens): while the eye is lakeward of a line 45 m inland of the
// shore line (just short of the town's second lane, where the lake's mirror leaves the picture) the upper trees stand as
// plain far forms and the upper slopes' azaleas, ferns, brook and grass are not drawn; inland of that line the kit's
// conifers, the azaleas and the grass stand, in one step. The far ranges stand in the world (follow 0). The lake's sheet
// is hidden only when no ray of the picture can reach its water, by an exact test (the picture's four edges, each along
// its whole length, against the horizon and the shore line: see lakeSeen). The mirror's own pass leaves out what cannot stand in
// the lake (every sheet of standing water above it, whose upper face no mirrored ray can reach; the terraces' banks and
// the rim's banks, rocks and pool of light behind the terraces' lip; and, while the eye is inland, everything inland)
// and the smallest dress (garden pines, azaleas, irises, persimmons).
// THE LAND'S FOOT, drawn in the mirror's own pass alone and never in the eye's picture: one dark sheet lying flat at the
// water's level under all the land, in the dark of the bank. The mirror's picture is taken from the eye's mirrored place
// under the water, and from there the hills are hollow shells seen from inside: without the sheet the low bright sky
// behind the land stands in that picture just beyond every waterline, and the water shows it as a thin bright line along
// the shore. The sheet is the ground's own triangles near the water (so that its edge is the waterline itself), 48 m
// squares under the higher ground and an apron round the ground's outer edge (the land part's makeLandFoot).
import * as THREE from 'three';
import * as T from '../kit/terrain.js';
import { makePath, makeRng, hashSeed, clamp } from '../kit/core.js';
import { makeTwilight, dirOf, SUN_AZ, TRAIN_AZ } from '../parts/comet-over-the-lake-town-sky.js';
import { makeBuiltMaterial, planTown, buildTown, Builder, makeLampPools } from '../parts/comet-over-the-lake-town-town.js';
import { ROUTE, SHRINE, GATE, ISLET, RING, TERR, SHORE_Z, FIELD, inField, RIM, inPond, buildRimPonds, buildLeat, makeGround, buildTerrain, makeLandFoot, makeLakeMirror, buildTerraces, contourZ, bakeSkyline, makePaddyWater } from '../parts/comet-over-the-lake-town-land.js';
import { buildShrine, plantTrees, growFlora, makePeak, makeLife, makeForest, growGrass, makeRocks } from '../parts/comet-over-the-lake-town-life.js';
import { makeBrook } from '../parts/comet-over-the-lake-town-ride.js';

export default {
  id: 'comet-over-the-lake-town', name: 'The Comet Comes Apart', category: 'screen', placeKind: 'wilderness',
  screen: 'Your Name', screenYear: '2016', screenKind: 'film', weirdness: 0.3, media: ['air'],
  async build(ctx) {
    const stream = (name) => makeRng(hashSeed(name + ':' + ctx.seed));
    const vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const deep = vary.hour === 'night' || vary.hour === 'dawn';
    const dn = clamp(((vary.density ?? 1) - 0.7) / 0.6, 0, 1), rare = !!vary.rare;
    const scene = new THREE.Scene(), owned = [];
    const path = makePath(ROUTE), L = path.length;
    const PACE = 18;                                    // the eye's speed in metres a second, the same over the whole flight
    // a place of the route by metres flown: the first metre from `from` on (walked every 2 m, then halved to the centimetre) where a test of the eye's place first holds
    const wp = new THREE.Vector3(), wq = new THREE.Vector3();
    const firstM = (from, test) => {
      const ok = (m) => { path.posAtDist(Math.min(L, m), wp); path.posAtDist(Math.min(L, m + 2), wq); return test(wp, wq); };
      for (let m = from; m <= L; m += 2) if (ok(m)) { if (m === from) return m; let a = m - 2, b = m; for (let i = 0; i < 9; i++) { const c = (a + b) / 2; if (ok(c)) b = c; else a = c; } return b; }
      return L;
    };
    // the route's metre nearest a named point (the kit's answer, refined to the centimetre)
    const metreAt = (x, z) => {
      let best = path.nearestXZ(x, z).u * L, bd = 1e9; const m0 = best;
      for (let m = m0 - 6; m <= m0 + 6; m += 0.5) { path.posAtDist(clamp(m, 0, L), wp); const d = Math.hypot(wp.x - x, wp.z - z); if (d < bd) { bd = d; best = m; } }
      for (let i = 0, step = 0.25; i < 6; i++, step /= 2) for (const m of [best - step, best + step]) { path.posAtDist(clamp(m, 0, L), wp); const d = Math.hypot(wp.x - x, wp.z - z); if (d < bd) { bd = d; best = m; } }
      return clamp(best, 0, L);
    };

    // ---------------- the sky: twilight, stars, the comet
    const tw = makeTwilight(stream('comet'), { deep, dn });
    scene.add(tw.dome, tw.comet, tw.storm);
    const fogCol = tw.colorAt(dirOf(SUN_AZ + 150, 2.5)).lerp(tw.colorAt(dirOf(SUN_AZ + 40, 4)), 0.35).multiplyScalar(deep ? 0.8 : 0.72);
    scene.fog = new THREE.FogExp2(fogCol, 0.00036);
    // the light: the afterglow from ahead, a soft rose-grey sky from behind and above, the blue of the zenith all round
    const glowDir = dirOf(SUN_AZ, 15), fillDir = dirOf(150, 50);
    const glow = new THREE.DirectionalLight(deep ? '#f0a070' : '#ffbc80', deep ? 1.0 : 1.5); glow.position.copy(glowDir).multiplyScalar(500);
    const fill = new THREE.DirectionalLight(deep ? '#93a6e0' : '#cdbfe0', deep ? 1.8 : 1.6); fill.position.copy(fillDir).multiplyScalar(500);
    const hemi = new THREE.HemisphereLight(deep ? '#7088d0' : '#92a8dc', deep ? '#343240' : '#4c463c', deep ? 2.5 : 2.2);
    const cool = new THREE.DirectionalLight('#b6caff', deep ? 0.8 : 0.6); cool.position.copy(tw.c0).multiplyScalar(500);   // the comet's own pale light
    scene.add(glow, glow.target, fill, fill.target, hemi, cool, cool.target);
    await ctx.yield();

    // ---------------- the ground, the lake's mirror, the terraces
    const G = makeGround(ctx.noise);
    const terrain = await buildTerrain(ctx, G, path, fillDir);
    const landFoot = makeLandFoot(terrain, G); scene.add(terrain.object, landFoot);
    await ctx.yield();
    // ---------------- the town on its one shore
    const Lg = { hemiSky: hemi.color.clone().multiplyScalar(hemi.intensity), hemiGround: hemi.groundColor.clone().multiplyScalar(hemi.intensity), glowDir,
      glowCol: glow.color.clone().multiplyScalar(glow.intensity), fillDir, fillCol: fill.color.clone().multiplyScalar(fill.intensity), lampGain: tw.look.lamps,
      coolDir: tw.c0, coolCol: cool.color.clone().multiplyScalar(cool.intensity) };
    const built = makeBuiltMaterial(tw.U, scene.fog, Lg);
    const surfaceAt = (x, z) => terrain.surfaceAt(x, z);
    // THE ONE FLOOR of every meteor: the highest ground skyline seen from any place of the route (every 5 m of it), on every bearing where a meteor can stand
    // (none stands farther than 41 degrees from the comet's bearing: the scan takes 46 degrees either hand of it, every 2 degrees), from 10 m out to the far ranges
    // (whose tops stand under 10 degrees from anywhere); plus the owner's 6 degrees, and half a degree for the scan's grain. ONE elevation, the same from every place.
    // THE SHOWER'S FLOOR: the same scan from the places where the shower is out only: the route's line from where the eye first stands level with the top of the
    // lowest terrace's bank (mSee: it sees over the bench's lip) to the ring; plus the same 6.5 degrees. ONE elevation, set once here.
    const mSee = firstM(0, (p) => p.y >= TERR.yw + 0.2);
    let skyMax = 10 * Math.PI / 180, skyShow = skyMax; const sv = new THREE.Vector3(), D2R = Math.PI / 180, showBy = new Float32Array(47);
    for (let i = 0, m = 0; m <= L; i++, m += 5) {
      path.posAtDist(m, sv); const out = m > mSee - 5;
      for (let az = TRAIN_AZ - 46; az <= TRAIN_AZ + 46; az += 2) { const sx = Math.sin(az * D2R), sz = -Math.cos(az * D2R);
        for (let t = 10; t < 2600; t = t * 1.06 + 1) { const e = Math.atan2(G.groundAt(sv.x + sx * t, sv.z + sz * t) - sv.y, t); if (e > skyMax) skyMax = e; if (out && e > showBy[(az - TRAIN_AZ + 46) / 2]) showBy[(az - TRAIN_AZ + 46) / 2] = e; } }
      if (i % 2 === 1) await ctx.yield();
    }
    // THE SHOWER'S FIELD: the notch of open sky about the comet's bearing: as far either hand (the same both hands, by the scan's 2 degrees) as the ground skyline
    // seen from the bench's line stands within 1.5 degrees of its height under the comet itself (the crater's east wall ends it). No ribbon ends outside it, and
    // the shower's floor is the highest skyline inside it (never under the far ranges' 10 degrees) plus 6.5 degrees.
    let fieldW = 0; while (fieldW < 40 && Math.max(showBy[23 + fieldW / 2 + 1], showBy[23 - fieldW / 2 - 1]) <= showBy[23] + 1.5 * D2R) fieldW += 2;
    for (let k = -fieldW / 2; k <= fieldW / 2; k++) skyShow = Math.max(skyShow, showBy[23 + k]);
    const FLOOR = skyMax / D2R + 6.5, SHOWER = skyShow / D2R + 6.5; tw.setFloor(FLOOR, SHOWER, Math.max(8, fieldW - 2));
    const plan = await planTown(G, path, stream('town'), dn, surfaceAt, deep, ctx.yield, stream('lanehouses'));
    await ctx.yield();
    const town = await buildTown(plan, G, path, stream('townbits'), surfaceAt, built, { stream, yield: ctx.yield });
    scene.add(town.mesh);
    if (town.pools.length) scene.add(makeLampPools(town.pools, surfaceAt, '#ffa850', 0.75 * tw.look.lamps, tw.U.uTime, stream('poolflicker')));   // a soft pool under every lamp post, and nowhere else
    await ctx.yield();
    // five places where a fish rises, each on a clock of its own: open water within 80 m of the route's line over the lake (dealt; every die before its test; a bounded search)
    const fs = stream('fishrings'), fish = [], mShore = firstM(0, (p) => p.z < SHORE_Z), fv = new THREE.Vector3();
    for (let i = 0; i < 60 && fish.length < 5; i++) { const m = fs.range(0, mShore), side = fs.range(-80, 80), per = fs.range(8, 15), ph = fs.range(0, 15); path.posAtDist(m, fv);
      if (Math.abs(side) < 12 || G.groundAt(fv.x + side, fv.z) > -1.2) continue; fish.push([fv.x + side, fv.z, per, ph]); }
    const lake = makeLakeMirror(scene.fog, town.boats, fish);
    scene.add(lake.object);
    const tb = new Builder(), terr = buildTerraces(G, stream('terraces'), dn, tb);
    const banks = tb.mesh(built, 'banks'); scene.add(banks);
    await ctx.yield();
    // the rim's seven pines, dealt along the crest from a stream of their own: none by the ring's foot or the route's line, no two mirrored about the last straight
    const rp = stream('rimpines'), rimPines = [], crest = surfaceAt(ROUTE[ROUTE.length - 1][0], ROUTE[ROUTE.length - 1][2]);   // the crest's height under the ring
    for (let i = 0; i < 400 && rimPines.length < 7; i++) {
      const side = rp() < 0.5 ? -1 : 1, off = rp(), z0 = rp.range(-984, -928), sg0 = rp.range(0.46, 0.7), turn = rp.range(0, 6.283), fore = rimPines.length < 3 && i < 140;
      // the first three stand close by the last straight, 11 to 12 m from the line and well under it: the rim's foreground
      const x = side * (fore ? 11 + 1.2 * off : 14 + 62 * off * off), z = fore ? -953 + (z0 + 984) * 0.86 : z0, sg = fore ? Math.min(sg0, 0.56) : sg0;
      if (Math.hypot(x, z + 960) < 16 || surfaceAt(x, z) < crest - (fore ? 15 : 1.2) || inPond(x, z, 2.5)) continue;   // the far ones on the crest's flat, the near ones on the slope under it
      if (rimPines.some((q) => Math.hypot(q[0] - x, q[1] - z) < 11 || (Math.abs(q[0] + x) < 9 && Math.abs(q[1] - z) < 14))) continue;
      rimPines.push([x, z, sg, turn]);
    }
    if (rimPines.length % 2 === 0) rimPines.pop();
    // THE LEAT under the bridge the lane crosses: still water in a stone channel along the contour, holding the same sky and comet (the paddies' law)
    const lb = new Builder(), leat = buildLeat(surfaceAt, lb, plan.leat), leatWalls = lb.mesh(built, 'leat'); scene.add(leatWalls);
    // the paddies run on to the ring: three small ponds on the rim's crest that hold the sky, the comet and the ring's glowing rim
    const rb = new Builder(), rim = buildRimPonds(surfaceAt, rb, RIM.ponds), rimBanks = rb.mesh(built, 'rim banks'); scene.add(rimBanks);

    // ---------------- the shrine in its cedars, the trees, the far peak and ranges, the small life
    const trees = plantTrees(G, path, stream('trees'), surfaceAt, town.gardens, dn, rimPines, stream, plan.lanePines);
    await ctx.yield();
    const irises = terr.tops.filter((t, i) => (path.nearestXZ(t[0], t[2]).dist < 30 ? (i * 7) % 5 < 2 && i % 4 !== 3 : i % 7 === 2));
    const forest = await makeForest(G, path, stream('forest'), surfaceAt, Math.round((1640 + 340 * dn) * (0.6 + 0.4 * detail)), ctx.yield, stream('avenue')); scene.add(forest.mesh, forest.far);
    trees.near = forest.nearPts.filter((t) => !t.up); const isClose = (t) => t.near < 36 || (t.z < -840 && t.near < 72);                    // the nearest stand full (on the rim, where they stand against the sky, out to 72 m)
    trees.upper = forest.nearPts.filter((t) => t.up && !isClose(t)); trees.close = forest.nearPts.filter((t) => t.up && isClose(t));
    await ctx.yield();
    // WHAT STANDS BEFORE THE SKY, for every sheet of still water: the trees' own places and heights (the grove's cedars, the islet's and the rim's pines, the
    // woods, the forest on the walls, the avenue), gathered as a canopy on 10 m cells, and the town's roofs by their footprints (the far ranges are a floor all round)
    const CELL = 10, canopy = new Map(), cellOf = (x, z) => Math.floor(x / CELL) * 4096 + Math.floor(z / CELL), stands = (x, z, h) => { const k = cellOf(x, z); if (!(canopy.get(k) >= h)) canopy.set(k, h); };
    for (const c of trees.cedars) stands(c.x, c.z, 34 * c.s);
    for (const c of trees.pines) stands(c.x, c.z, (c.rim ? 17 : 15.5) * c.s);
    for (const c of trees.woods) stands(c.x, c.z, 23 * c.s);
    for (const t of forest.stand) stands(t[0], t[1], t[2]);
    const standLift = (x, z, h) => {
      for (const q of plan.lots) { if (!q.house) continue; const dx = x - q.xc, dz = z - q.zc; if (Math.abs(dx) > 10 || Math.abs(dz) > 10) continue;
        const cs = Math.cos(q.yaw), sn = Math.sin(q.yaw); if (Math.abs(dx * cs - dz * sn) < q.w / 2 + 0.6 && Math.abs(dx * sn + dz * cs) < q.d / 2 + 0.6) return q.floor + (q.type === 'shed' ? 3.6 : q.type === 'store' ? 8 : 7.2) - h; }
      return canopy.get(cellOf(x, z)) || 0;
    };
    // each skyline is baked round the middle of the water it serves, at the height of its highest sheet (a lower sheet's own bank is drawn by the bank's term)
    const midOf = (geo) => { const a = geo.attributes.position, mid = { x: 0, y: -1e9, z: 0 }; for (let i = 0; i < a.count; i++) { mid.x += a.getX(i) / a.count; mid.z += a.getZ(i) / a.count; mid.y = Math.max(mid.y, a.getY(i)); } return mid; };
    const P0 = midOf(terr.wg);
    const skyline = await bakeSkyline(G, P0, ctx.yield, standLift, [0.05, 2600]); owned.push(skyline);
    // the wind's cat's-paws over every sheet of paddy water: one heading, speed, grain and ripple rate, dealt
    const gs = stream('gusts'), ga = gs.range(0, 6.283), gv = gs.range(2.2, 3.6), gust = new THREE.Vector4(Math.cos(ga) * gv, Math.sin(ga) * gv, gs.range(0.035, 0.055), gs.range(2.2, 3.4));
    const paddy = makePaddyWater(terr.wg, tw.U, scene.fog, skyline, P0, { gust, rise: terr.dy + 0.2, bank: deep ? '#1e3428' : '#2a4634', ring: [RING.x, RING.y, RING.z, RING.r], land: deep ? '#16262e' : '#24382f' });
    scene.add(paddy.object);
    await ctx.yield();
    const P1 = midOf(leat.wg);
    const skyline1 = await bakeSkyline(G, P1, ctx.yield, standLift, [0.05, 2600]); owned.push(skyline1);
    const paddy1 = makePaddyWater(leat.wg, tw.U, scene.fog, skyline1, P1, { gust, rise: 0.22, bank: deep ? '#34342c' : '#4a4a3e', ring: [0, -5000, RING.z, 1], land: deep ? '#1c3430' : '#2a4638' });   // (the land it holds is the wooded wall above the town)
    scene.add(paddy1.object);
    await ctx.yield();
    const P2 = midOf(rim.wg), skyline2 = await bakeSkyline(G, P2, ctx.yield, standLift, [0.05, 2600]); owned.push(skyline2);   // the skyline as the crest sees it
    const paddy2 = makePaddyWater(rim.wg, tw.U, scene.fog, skyline2, P2, { gust, rise: 0.3, bank: deep ? '#1e3428' : '#2a4634', ring: [RING.x, RING.y, RING.z, RING.r], land: deep ? '#16262e' : '#24382f' });
    scene.add(paddy2.object);
    await ctx.yield();
    // by each of the three near pines: azaleas in bloom (three, one, three) and one boulder, dealt from a stream of their own
    const rf = stream('rimfore'), foreBushes = [], foreRocks = [];
    rimPines.slice(0, 3).forEach(([x, z], i) => { const sd = Math.sign(x);
      for (let k = 0, n = [3, 1, 3][i]; k < n; k++) { const a = rf.range(0, 6.283), d = rf.range(2.6, 5.4), s = rf.range(1.3, 2.3), bx = x + Math.cos(a) * d * 0.8 + sd * 1.5, bz = z + Math.sin(a) * d; if (Math.abs(bx) > 8.5 && !inPond(bx, bz, 1)) foreBushes.push([bx, bz, s]); }
      foreRocks.push([x + sd * rf.range(1.6, 3.2), z + rf.range(-3.5, 3.5), rf.range(0.9, 1.7)]); });
    const rimRocks = makeRocks(stream('rocks'), surfaceAt, 23, foreRocks); scene.add(rimRocks);
    // azaleas in flower over the steep wall under the terraces and on the rim's shoulder (all dice drawn before the tests; none at the ring's foot)
    const hb = stream('headwall'), headBushes = [];
    for (let i = 0, nb = Math.round((800 + 230 * dn) * (0.6 + 0.4 * detail)); i < nb; i++) {
      const x = hb.range(-84, 96), z = hb.range(-988, -552), sz = hb(), keep = hb(), hgt = surfaceAt(x, z);
      if (!((hgt > 44 && hgt < 120.5) || hgt > 136.8) || G.inTerr(x, z) > 0.02 || Math.hypot(x, z + 960) < 6 || Math.hypot(x + 55, z + 620) < 30 || keep > 0.92 || inField(x, z, 1.5) || inPond(x, z, 1.2)) continue;
      if (ctx.noise.n2(x * 0.045 + 7, z * 0.045) < 0.02) continue;                        // they grow in big masses, with open ground between
      headBushes.push([x, z, 0.9 + 1.6 * sz]);
    }
    headBushes.push(...foreBushes);
    await ctx.yield();
    // the ride above the shrine, by its places: from the foot of the shrine's footpath (the lane's head, the meadow's lower edge), past the gate (abeam), from the
    // avenue's foot (where the route's ground first stands 2 m above the shrine's court) to the bench's lip (where it first stands at the lowest terrace's height)
    const fr = stream('ferns'), ferns = [], pv = new THREE.Vector3(), mA = metreAt(FIELD.lane[0][0], FIELD.lane[0][1]), mGate = metreAt(GATE.x, GATE.z);
    const mBrook = firstM(mGate, (p) => surfaceAt(p.x, p.z) > SHRINE.y + 2), mB = firstM(mBrook, (p) => surfaceAt(p.x, p.z) >= TERR.y0 - 0.5), mLip = mB;
    const mTop = firstM(mLip, (p) => surfaceAt(p.x, p.z) > TERR.y1 + 0.5);                                                // the top terrace's bank
    // the shower is full where the line crosses the third terrace's bank; the train has come apart where it crosses the top terrace's bank
    const mFull = firstM(mSee, (p) => p.z < contourZ(G, p.x, TERR.yw + 1.5 * terr.dy)), mTopBank = firstM(mFull, (p) => p.z < contourZ(G, p.x, TERR.y1 - terr.dy / 2));
    for (let i = 0, nf = Math.round(340 * (0.6 + 0.4 * detail)); i < nf; i++) {
      const m = fr.range(mA, mB), side = fr.range(-38, 40), sz = fr(); path.posAtDist(m, pv);
      const x = pv.x + side, z = pv.z, hgt = surfaceAt(x, z);
      if (hgt < 44 || hgt > 120.5 || G.inTerr(x, z) > 0.02 || Math.hypot(x + 55, z + 620) < 22 || inField(x, z, 1.2)) continue;
      ferns.push([x, z, sz]);
    }
    const offShrine = (x, z, r) => Math.hypot(x - SHRINE.x, z - SHRINE.z) < 34 + r || Math.hypot(x - GATE.x, z - GATE.z) < 9 + r;   // no boulder lies through the shrine's things
    const brook = makeBrook(path, surfaceAt, stream('brook'), scene.fog, tw.colorAt(dirOf(SUN_AZ + 10, 30)).multiplyScalar(1.05), { from: mBrook, to: mB, keepOff: offShrine });
    // The brook's bed keeps its boulders. Its water sheets are not drawn (lying in the grass by the line they read as dark hard-edged slabs) and are freed
    // here, at once, so that nothing unused is kept. (The ride part still works them out: the falls' and the boulders' dice follow the water's in one
    // stream, and a brook without them would deal every boulder of the ride anew.)
    brook.mesh.geometry.dispose(); brook.mesh.material.dispose(); brook.pools.dispose(); brook.mesh = brook.pools = null;
    scene.add(brook.rocks);
    // the shrine, the footpaths and every standing lantern: five more lit ones beside the brook, on its east bank at dealt places of its run (unevenly)
    // THE BROOK'S LANTERNS: seven, every one lit, on the lower 55 m of the ride so that all stand in sight together: three close at the brook's foot (square to the
    // route), one between (dealt), three close at the row's end (on a line 50 degrees off the route's heading, so they leave the eye's sight together); each group
    // of unequal heights; none within 7 m of the route's line (a group that would be is moved straight out to 7 m)
    const nbs = Math.floor(brook.sparks.length / 4), bl = stream('brooklanterns'), bS = bl.range(1.3, 1.5), bMid = bl.range(20, 36);
    const bAt = (mUp, k, obl, s) => { const sp = brook.sparks[Math.min(nbs - 1, Math.round(mUp / 1.5)) * 4 + 2], q = path.nearestXZ(sp[0], sp[2]); path.posAtDist(q.u * L, pv);
      const hand = sp[0] >= pv.x ? 1 : -1, out = Math.max(0, 7 - q.dist); return [sp[0] + hand * (out + (obl ? 1.1 : 1.5) * k), sp[2] - (obl ? 0.92 * k : 0), s, bl.range(-0.5, 0.5)]; };
    const brookLanterns = nbs < 40 ? [] : [bAt(3, 0, false, bS), bAt(3, 1, false, bS * 1.24), bAt(3, 2, false, bS * 1.1), bAt(bMid, 0, false, bS * 1.15), bAt(54, 0, true, bS), bAt(54, 1, true, bS * 1.24), bAt(54, 2, true, bS * 1.1)];
    const rl = stream('rimlanterns'), rimAt = [0.4 + 0.2 * rl()];                       // seven up the rim's path: where its one single lantern stands (dealt), between the group at the path's foot and the group by the ring's foot
    const shrine = buildShrine(built, stream('shrine'), surfaceAt, brookLanterns, rimAt); scene.add(shrine.mesh, shrine.footpath);
    // each of the brook's lanterns lights the trunks, the boulders and the ferns round it: a warm lamp of its own at its flame, reaching 34 m
    for (const p of shrine.flames.slice(shrine.flames.length - brookLanterns.length)) { const pl = new THREE.PointLight('#ffa850', 60 * tw.look.lamps, 34, 2); pl.position.set(p[0], p[1] + 0.3, p[2]); scene.add(pl); }
    // warm light on the ground (and the brook's boulders) under every lantern, and the ring's own light: a wide soft pool on the crest, the rim's path and
    // the slope under it, strongest within 40 m of the ring
    // THE POND RULE, for every pool of light (the lanterns' and the ring's): no pool lies over a pond's sheet. Inside a pond's outline, and half a metre
    // round it, a pool's net lies under the pond's bed, so the ponds mirror the sky plainly. (The ring's pool is half as strong as it was, so the grass
    // round the ring keeps the dusk's tone and the glow is strongest near the ring's foot.)
    const underPonds = (x, z) => surfaceAt(x, z) - (inPond(x, z, 0.5) ? 0.6 : 0);
    const lanternPools = makeLampPools(shrine.flames.map((p) => ({ x: p[0], z: p[2], r: 7.5 })), underPonds, '#ffa850', 0.85 * tw.look.lamps, tw.U.uTime, stream('lanternflicker'));
    const ringPool = makeLampPools([{ x: RING.x, z: RING.z + 8, r: 64, n: 48 }], underPonds, '#f2dca4', 0.21);
    scene.add(lanternPools, ringPool);
    // flower drifts beside the shrine's footpath and the rim's path: seven along each, dealt; each a loose patch of irises 2 to 9 m off the path, none in a pond,
    // a plot or the path itself
    const dr = stream('drifts'), drifts = [];
    for (const lane of [FIELD.lane, RIM.lane]) for (let d = 0; d < 7; d++) { const f = dr() * (lane.length - 1), i = Math.min(lane.length - 2, Math.floor(f)), k = f - i, side = (dr() < 0.5 ? -1 : 1) * dr.range(2, 9), cx = lane[i][0] + (lane[i + 1][0] - lane[i][0]) * k + side, cz = lane[i][1] + (lane[i + 1][1] - lane[i][1]) * k;
      for (let j = 0; j < 15; j++) { const x = cx + dr.range(-2.2, 2.2), z = cz + dr.range(-1.6, 1.6); if (!inPond(x, z, 0.6) && !inField(x, z, 0.4)) drifts.push([x, surfaceAt(x, z), z]); } }
    const grown = await growFlora(ctx, scene, trees, { bushes: town.bushes, headBushes, irises: irises.concat(rim.tops, leat.tops, drifts), ferns, persimmons: FIELD.trees.concat(plan.lanePersimmons), heightAt: surfaceAt, stream }, stream('flora'));
    await ctx.yield();
    const grass = await growGrass(ctx, scene, path, surfaceAt, G, grown, stream('grass'));
    scene.add(makePeak(scene.fog, deep));
    const ridges = T.makeHorizonRidges({ rng: stream('ranges'), layers: 3, radius: [3800, 5600], height: [260, 700], base: -60, fog: scene.fog, colorNear: deep ? '#16203a' : '#27334f',
      sunDir: glowDir, sunColor: '#ffb070', sunIntensity: 0.8, rim: 1.2, snow: false, follow: 0 });                                // the far ranges stand in the world
    scene.add(ridges.object);
    await ctx.yield();
    // thin low mist: two bands lying on the water off the quay, one either hand of the lane's foot (none within 40 m of where the route crosses the shore);
    // and still wisps between the avenue's trunks, none within 12.5 m of the route's line
    const xF = plan.foot, mists = [
      { count: 13, area: [xF - 44 + 215, 1.4, 11], center: [(xF - 44 - 215) / 2, 1.5, SHORE_Z + 16], size: [10, 18], opacity: 0.12, drift: [1.3, 0, 0.15] },
      { count: 9, area: [175 - (xF + 36), 1.4, 11], center: [(175 + xF + 36) / 2, 1.5, SHORE_Z + 16], size: [10, 18], opacity: 0.12, drift: [1.3, 0, 0.15] },
    ];
    // low mist lying on the water in the far bays: still puffs 8 to 30 m off the shore all round the lake (the shore found from the lake's middle, the islet's
    // place, along a dealt bearing), none within 70 m of the route's line and none before the town's front, which has its own bands
    const bm = stream('baymist'), bays = [];
    for (let i = 0; i < 90 && bays.length < 45; i++) {
      const a = bm.range(0, 6.2832), off = bm.range(8, 30), up = bm.range(0.9, 1.9), sx = Math.sin(a), sz = Math.cos(a); let t = 40;
      while (t < 900 && G.groundAt(ISLET.x + sx * t, ISLET.z + sz * t) < 0.2) t += 6;
      const x = ISLET.x + sx * (t - off), z = ISLET.z + sz * (t - off);
      if (t >= 900 || t - off < 40 || G.groundAt(x, z) > -0.2 || path.nearestXZ(x, z).dist < 70 || (z < SHORE_Z + 40 && x > -215 && x < 175)) continue;
      bays.push([x, up, z]);
    }
    if (bays.length) mists.push({ positions: bays, size: [16, 30], opacity: 0.11, flatten: 0.2 });
    const am = stream('avenuemist'), wisps = [];
    for (let i = 0; i < 60 && wisps.length < 21; i++) {
      const m = am.range(mBrook, mB), side = (am() < 0.5 ? -1 : 1) * am.range(13, 34), up = am.range(1.0, 3.5); path.posAtDist(m, pv); const x = pv.x + side, z = pv.z;
      if (path.nearestXZ(x, z).dist < 12.5) continue;
      wisps.push([x, surfaceAt(x, z) + up, z]);
    }
    if (wisps.length) mists.push({ positions: wisps, size: [8, 14], opacity: 0.1 });
    const life = await makeLife(ctx, scene, path, { stream, lamps: town.lamps, flames: shrine.flames, windows: town.winGlows, smokes: town.smokes,
      tops: terr.tops.concat(brook.sparks, brook.sparks, brook.sparks, rim.tops, rim.tops, leat.tops, leat.tops, leat.tops), mists, rare, detail, glowDir, lampGain: tw.look.lamps }, stream('life'));
    await ctx.yield();

    // ---------------- looks: one at a time, each target worked out inside its own function
    const eye = new THREE.Vector3(), tgt = new THREE.Vector3(), cpos = new THREE.Vector3();
    const cometLook = (time, u) => { path.pointAt(u, eye); return tgt.copy(eye).addScaledVector(tw.c0, 4000); };
    // THE LOOKS, one at a time, each between two places of the route (found by metres, to the centimetre):
    //  the comet, from the entry until the lane's foot is nearer the eye than the islet is;
    //  the lane's head (where the lane the route follows ends at the meadow, under the comet; 3 m over its ground), from that place until the eye crosses the quay's lip;
    //  the shrine's gate (its own place, at half its height), from the lane's head (the foot of the shrine's footpath) until the gate is abeam;
    //  the comet again over the terraces, from the bench's lip to the top terrace's bank.
    const headAt = new THREE.Vector3(FIELD.lane[0][0], surfaceAt(FIELD.lane[0][0], FIELD.lane[0][1]) + 3, FIELD.lane[0][1]), gateAt = new THREE.Vector3(GATE.x, GATE.y + GATE.h / 2, GATE.z);
    const mIslet = firstM(0, (p) => Math.hypot(p.x - plan.foot, p.z - SHORE_Z) < Math.hypot(p.x - ISLET.x, p.z - ISLET.z)), mQuay = firstM(mIslet, (p) => p.z < town.lipAt(p.x));
    const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    // the mirror's own pass: what cannot stand in the lake is not drawn into it (see the head notes)
    const dress = [...grown.dress, banks, paddy.object, paddy1.object, paddy2.object, rimBanks, ringPool, rimRocks], inlandOnly = [grown.upper, grown.close, grown.head, grown.ferns, grown.grove1, grown.rim1, grass, brook.rocks].filter(Boolean).map((q) => q.object || q);
    const leaveOut = dress.concat(inlandOnly), was = new Array(leaveOut.length).fill(true), mirrorPass = lake.object.onBeforeRender;
    let eyeInland = false;
    lake.object.onBeforeRender = function (renderer, sc, cam) {
      for (let i = 0; i < leaveOut.length; i++) { was[i] = leaveOut[i].visible; if (i < dress.length || eyeInland) leaveOut[i].visible = false; }
      landFoot.visible = true; mirrorPass.call(this, renderer, sc, cam); landFoot.visible = false;
      for (let i = 0; i < leaveOut.length; i++) leaveOut[i].visible = was[i];
    };
    // Can any ray of the picture reach the lake's water (all of it lies lakeward of the shore line z -336)? AN EXACT TEST. A ray reaches the water when it
    // goes down (it is under the horizon) and is still above the water where it crosses the shore line's upright plane. The rays that do so make a wedge
    // that runs out sideways along the shore line, beyond any picture; so if the picture (taken a tenth wider than it is) holds one such ray, one of its four
    // edges holds one too. Each edge is cut, along its whole length, to its stretch under the horizon and to its stretch above the water at the shore
    // line: the lake is seen when on some edge the two stretches meet. Nothing is sampled, so no thin band of lake can fall between rays.
    const edge = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    const lakeSeen = (camera) => {
      if (cpos.z > -336) return true;
      const inland = -336 - cpos.z;                                                             // how far inland of the shore line the eye stands
      for (let i = 0; i < 4; i++) edge[i].set(i === 1 || i === 2 ? 1.1 : -1.1, i > 1 ? 1.1 : -1.1, 0.5).unproject(camera).sub(cpos);   // the picture's four corners, in order round it
      for (let i = 0; i < 4; i++) {
        const a = edge[i], b = edge[(i + 1) % 4], y0 = a.y, y1 = b.y, g0 = cpos.y * a.z + inland * a.y, g1 = cpos.y * b.z + inland * b.y;   // y under 0: under the horizon; g over 0: above the water at the shore line
        if ((y0 >= 0 && y1 >= 0) || (g0 <= 0 && g1 <= 0)) continue;
        let lo = 0, hi = 1;
        if (y0 >= 0) lo = y0 / (y0 - y1); else if (y1 >= 0) hi = y0 / (y0 - y1);
        if (g0 <= 0) lo = Math.max(lo, g0 / (g0 - g1)); else if (g1 <= 0) hi = Math.min(hi, g0 / (g0 - g1));
        if (lo <= hi) return true;
      }
      return false;
    };
    const world = {
      scene, path, duration: Math.round(L / PACE),
      camera: { fov: 66, near: 0.5, far: 7500, lookAhead: 30, sway: 0.6, bank: 0.3 },
      pois: [
        { at: cometLook, from: 0, to: mIslet / L, weight: 0.36 },
        { at: headAt, from: mIslet / L, to: mQuay / L, weight: 0.5 },
        { at: gateAt, from: mA / L, to: mGate / L, weight: 0.5 },
        { at: cometLook, from: mLip / L, to: mTop / L, weight: 0.36 },
      ],
      portal: { shape: 'circle', radius: RING.r, color: '#f2dca4', glow: 1.0, revealDistance: 240 },
      post: { exposure: deep ? 1.2 : 1.0, bloom: { strength: 0.32, radius: 0.5, threshold: 0.9 },
        grade: { saturation: 1.05, contrast: 1.03, tint: '#ffffff', shadowTint: '#0a1020', vignette: 0.18, grain: 0.018, aberration: 0 } },
      // readings for the report and the count of clear air (nothing here is used by the flight)
      readings: { skins: [...town.skins, ...shrine.skins, ...trees.skins, ...forest.skins], moths: life.moths ? life.moths.kept : null, houses: plan.houses, paddies: terr.paddies.length,
        fireflies: life.fireflies, boats: town.boats.length, lamps: town.lamps.length, floor: FLOOR, shower: SHOWER, field: fieldW, lights: town.lamps.map((p) => [p[0], p[2]]).concat(shrine.flames.map((p) => [p[0], p[2]])), marks: town.marks,
        places: { mIslet, mQuay, mA, mGate, mBrook, mLip, mTop, mSee, mFull, mTopBank, L } },
      update(dt, time, camera, u) {
        tw.update(time); const flown = (u || 0) * L;
        // THE TURN, by metres flown: the train comes apart from the shrine's gate (abeam) to the top terrace's bank; the shower comes out from where the eye
        // stands level with the lowest terrace's bank to the third terrace's bank
        tw.beat(ss(mGate, mTopBank, flown), ss(mSee, mFull, flown));
        lake.uniforms.uTime.value = time;
        // the lake's sheet is hidden only while no ray of the picture can reach its water
        cpos.setFromMatrixPosition(camera.matrixWorld);
        eyeInland = cpos.z < SHORE_Z - 20; lake.object.visible = lakeSeen(camera);
        terrain.update(dt, time); ridges.update(dt, time, camera); ridges.object.position.x = 0; ridges.object.position.z = 0;
        grown.update(dt, time, camera); grass.update(dt, time, camera); life.update(dt, time, camera, u);
        const upNear = cpos.z < SHORE_Z - 45;                                   // the upper trees: the kit's conifers from the shore on, their plain far forms from the lake
        if (grown.upper) grown.upper.object.visible = upNear; if (grown.close) grown.close.object.visible = upNear; forest.far.visible = !upNear;
        grass.object.visible = upNear;                           // the rim's grass: nothing of it can be told from the lake
        if (grown.head) grown.head.object.visible = upNear; if (grown.ferns) grown.ferns.object.visible = upNear;
        brook.rocks.visible = upNear;
        if (grown.grove1) { grown.grove1.object.visible = upNear; grown.grove0.object.visible = !upNear; }      // the nearer cedars and the rim's pines: full from the shore on, plainer from the lake
        if (grown.rim1) { grown.rim1.object.visible = upNear; grown.rim0.object.visible = !upNear; }
      },
      dispose() { for (const t of owned) t.dispose(); lake.object.dispose?.(); },
    };
    return world;
  },
};
