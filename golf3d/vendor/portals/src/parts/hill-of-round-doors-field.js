// hill-of-round-doors: THE FIELD (the field builder's part; the world imports it by the path ...-field.js).
// What stands: THE PARTY TREE in its field and THE OAK on the knoll over the green door, each grown limb by limb
// (...-field-tree.js) on the plan's ground; some hundreds of paper lanterns on cords in the party tree (...-lanterns.js);
// strings of plain flags from bough to bough and out to painted poles (...-flags.js); THE BRIDGE of two stone arches
// with plants in its joints (...-bridge.js); THE MILL with its wheel, pit, sluice and white water (...-mill.js); THE
// FEAST: laid trestle tables, benches, casks, round and ridge tents, and by the mill a cart, casks, sacks and two
// ponies grazing (...-feast.js).
// What moves, all by the world's clock: the leaves of both trees and the bridge's plants in the wind (the flora kit's
// wind), the lanterns swinging on their cords, the flags fluttering, the wheel turning at a steady pace, the white
// water running in the race and falling from the floats.
// Streams of the seed: 'party-tree' (the party tree's whole form), 'oak' (the oak's), 'leaf-spray' (the leaves drawn
// on the one spray both trees wear), 'lanterns' (which limb each lantern hangs from, its cord, shape, colour and
// swing), 'flags' (the strings, the poles, each flag's colours and shape, the lanterns on the pole strings), 'bridge'
// (the tone of its stones, the plants in its joints), 'mill' (the tones of its roof strips and of the wheel's timbers),
// 'feast' (where each table, tent, cask, the cart and the ponies stand), 'feast-food' (what is laid on each table, the
// tones of cloths, casks and sacks, each pony's size), 'marquee-strings' (the lanterns on the strings to the marquee),
// 'bank-strings' (the poles and strings of the bank round the field's rim),
// 'bank-camp' (the camp by the cart road, under that bank), 'marquee' (where the marquee stands),
// 'line-lanterns' (the lanterns on each pole's first string), 'bank-picnic' (the rugs at the bank's foot).
// Light: no light is added. The materials take the scene's sun, fill and fog; the lanterns' warm light is painted on by
// place (...-field-mat.js) and scales with look.lit, as do the mill's window panes. Nothing here reads the lens, the
// frame or the wall clock; places come from the plan (hill-of-round-doors-plan.js) and are never retyped.
import { TREE, OAK, FIELD, MILL, TOP, HALL, DOOR, ROAD, LANE1, LANE2, LANE_HALF, laneAt, groundY, routeOver, routeDistance } from './hill-of-round-doors-plan.js';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';
import { lin, finish, Solid, Leafy, KIND, limb, turned, mix3 } from './hill-of-round-doors-field-geo.js';
import { growTree } from './hill-of-round-doors-field-tree.js';
import { solidMaterial, leafMaterial } from './hill-of-round-doors-field-mat.js';
import { makeSprayTexture, sprig } from './hill-of-round-doors-field-leaf.js';
import { buildBridge } from './hill-of-round-doors-field-bridge.js';
import { buildMill, dressMill, buildWheel, makeMillWater, WHEEL_TURN } from './hill-of-round-doors-field-mill.js';
import { placeLanterns, lampField, makeLanterns } from './hill-of-round-doors-field-lanterns.js';
import { layStrings, makeFlags, makeStrings } from './hill-of-round-doors-field-flags.js';
import { layFeast } from './hill-of-round-doors-field-feast.js';

// Clear air: no wood and no leaf mass of ours comes nearer the flown line than this (the design asks 8 m; the plan's
// measure of the line is good to about a metre).
const SOLID_AIR = 9.2;

// THE POLES OF THE BANK, laid by a rule of the ground. Round the field's rim, wherever the land beyond the rim climbs
// into a bank (8 m out it stands more than 3 m over the field), there is a station every `step` metres or so (a
// fifth more or less, dealt from the stream). At each station a tall pole stands at the bank's foot, a pace and a
// half inside the rim, and a second stands up the bank behind it where the slope eases, or beyond the way where a
// road or lane runs along the bank's top (never more than 24 m out from the rim). No pole stands within a road's or
// lane's half width and `margin`, within `air` metres in plan of the flown line (its clear air), or within `apart`
// metres of another of these poles; where one of a station's two may not stand, the other still does.
// -> [{ x, z, tree, chain, keep }] in the order they are strung: a foot pole from the tree's nearest bough (tree),
// and every pole from the pole before it in this order where the stations follow on (chain); keep: the pole stands
// whether or not a string reaches it.
// o: { field: the plan's FIELD, ground(x, z), over(x, z) -> { dist }, air, step, apart, margin }
function bankPoles(rng, o) {
  const F = o.field, out = [], ways = [ROAD.map((q) => [q[0], q[2]]), ...[LANE1, LANE2].map((L) => [0, L.length].map((s) => { const p = laneAt(L, s); return [p[0], p[2]]; }))];   // three lines in plan: the road, and each (straight) lane from end to end
  const onWay = (x, z) => {
    for (const w of ways) for (let i = 0; i + 1 < w.length; i++) {
      const a = w[i], b = w[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
      if (Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t) < LANE_HALF + o.margin) return true;
    }
    return false;
  };
  const rim = (phi, d) => { const c = Math.cos(phi), s = Math.sin(phi), nl = Math.hypot(c / F.rx, s / F.rz); return [F.x + F.rx * c + d * c / F.rx / nl, F.z + F.rz * s + d * s / F.rz / nl]; };   // d metres out from the rim
  const free = (x, z) => !onWay(x, z) && o.over(x, z).dist >= o.air && !out.some((q) => Math.hypot(q.x - x, q.z - z) < o.apart);
  const p0 = rng() * Math.PI * 2; let last = false;
  for (let phi = p0; phi < p0 + Math.PI * 2;) {
    const jit = rng.range(-0.2, 0.2), more = rng(), [fx, fz] = rim(phi, -1.5), [bx, bz] = rim(phi, 8);          // every station draws its dice, used or not
    if (o.ground(bx, bz) - F.y > 3) {                           // the land beyond the rim climbs here: a bank
      const foot = free(fx, fz);
      if (foot) out.push({ x: fx, z: fz, tree: true, chain: last, keep: true });
      let d = 5; while (d < 24 && (o.ground(...rim(phi, d + 1.5)) - o.ground(...rim(phi, d)) > 0.5 || onWay(...rim(phi, d + 0.5 + more)))) d += 1.5;
      const [ux, uz] = rim(phi, d + 0.5 + more), up = d < 24 && free(ux, uz);
      if (up) out.push({ x: ux, z: uz, chain: foot || last, keep: true });
      last = foot || up;
    } else last = false;
    phi += o.step * (1 + jit) / Math.hypot(F.rx * Math.sin(phi), F.rz * Math.cos(phi));
  }
  return out;
}

export async function buildField(ctx, o) {
  const { THREE, rngFor, look } = o, object = new THREE.Group(), pause = () => ctx.yield();
  const C = (c) => lin(THREE, c), turf = C(look.turf), mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const density = Math.min(1.3, Math.max(0.7, look.density ?? 1));
  const lit0 = Math.min(1, Math.max(0, look.lit ?? 0)), lit = 0.34 + 0.66 * lit0, lamp = new THREE.Color('#ffd9b3').multiplyScalar(lit);   // the lanterns glow in every look: softly by day, strongly at dusk
  const warm = 1.5 - 0.5 * lit0;                                // what the lanterns light takes more of their light the less they burn
  const wind = flora.makeWind({ direction: [0.85, -0.5], strength: 1, speed: 0.85 });
  const spray = await makeSprayTexture(THREE, rngFor('leaf-spray'), pause, Math.min(4, ctx.renderer.capabilities.getMaxAnisotropy()));
  const solid = solidMaterial(THREE, { lamp }), leaf = leafMaterial(THREE, { wind, lamp, map: spray });
  const geos = [], leafGeos = [], notes = [], tally = [];
  let triangles = 0, drawCalls = 0;
  const put = (G, mat, at, lampAt = null, gain = 1) => {
    const g = finish(THREE, G, lampAt, at, gain), m = new THREE.Mesh(g, mat);
    geos.push(g); if (mat === leaf) leafGeos.push(g);
    m.position.set(at[0], at[1], at[2]); object.add(m); triangles += g.userData.triangles; drawCalls++; tally.push(g.userData.triangles);
    return m;
  };
  await pause();

  // THE PARTY TREE: broad and low-spreading, its lowest boughs and leaves over the plan's TREE.boughs
  const treeAt = [TREE.x, FIELD.y, TREE.z];
  const party = await growTree(rngFor('party-tree'), {
    height: TREE.height, crown: TREE.crown, trunkR: TREE.trunk, trunkTop: 18.5, clear: TREE.boughs - FIELD.y + 0.4, sink: 1.5, lean: 0.05, flare: 0.75,
    buttresses: 7, trunkSides: 28, seam: [-1, 0, -0.35], ground: (x, z) => groundY(TREE.x + x, TREE.z + z) - FIELD.y,
    floorAt: (x, z, r) => { const q = routeOver(TREE.x + x, TREE.z + z), m = SOLID_AIR + r; return q.dist < m ? q.y - FIELD.y + Math.sqrt(m * m - q.dist * q.dist) : -1e9; },
    tiers: [
      { n: 8, phi: [3, 15], y0: [15.9, 17.6], r0: 1.55, r1: 0.4, bow: 2.3, wave: 2.2, sides: 8, segs: 10, sub: 3.6, subR: 0.5, risers: 0.3, rise: 9, twigs: [2, 3] },
      { n: 6, phi: [27, 48], y0: [17.2, 18.6], r0: 1.35, r1: 0.34, bow: 1.6, wave: 1.8, sides: 7, segs: 8, sub: 5, subR: 0.42, risers: 0.25, rise: 7, twigs: [1, 3] },
      { n: 4, phi: [60, 84], y0: [18, 19], r0: 1.25, r1: 0.3, bow: 1.15, wave: 1.4, sides: 6, segs: 7, sub: 6.5, subR: 0.36, risers: 0.2, rise: 5, twigs: [2, 2] },
    ],
    clumpR: 3.3, squash: 0.62, cards: 22, leaf: 1.3, flutter: 4, sway: 0.22,
    bark: C('#75695a'), barkDark: C('#3c342c'), barkLight: C('#8f8474'), moss: C('#5b7430'), turf, lo: C('#1c4a1c'), mid: C('#3f8226'), hi: C('#a3c94e'),
  }, pause);
  await pause();
  // THE LANTERNS in it: some hundreds, by the look's density, none of them or of their cords within LANTERN_AIR of the line
  const lanternList = await placeLanterns(rngFor('lanterns'), party.hangs, { count: Math.round(290 * density), at: treeAt, floorY: FIELD.y + 4.4, route: routeDistance,
    sticks: party.sticks.map((q) => [q[0] + treeAt[0], q[1] + treeAt[1], q[2] + treeAt[2], q[3]]), trunk: [TREE.x, TREE.z, TREE.trunk * 1.9], pause });
  await pause();
  // THE STRINGS OF FLAGS from bough to bough and out to poles in the field (the pole strings carry lanterns too)
  const WIND = [0.85, -0.5], props = new Solid();
  // THE POLES OF THE BANK, laid by the ground (bankPoles, above): round the field's rim wherever the land beyond it
  // climbs, a pole at the bank's foot and a second up the bank every nine metres or so; strung in turn
  const bankDice = rngFor('bank-strings'), bank = bankPoles(bankDice, { field: FIELD, ground: groundY, over: routeOver, air: 12.8, step: 9, apart: 7, margin: 1.5 });
  const laid = await layStrings(rngFor('flags'), { pause, ties: party.ties.map((q) => [q[0] + treeAt[0], q[1] + treeAt[1], q[2] + treeAt[2], q[3]]), trunk: [TREE.x, TREE.z], density,
    ground: groundY, route: routeDistance, over: routeOver, lowY: TREE.boughs + 0.1, near: 12, poleRing: [41.5, 46], crown: TREE.crown, wind: WIND, bank, bankRng: bankDice, moreRng: rngFor('line-lanterns') });
  for (const q of laid.lanterns) if (!lanternList.some((p) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) < 2.3)) lanternList.push(q);
  // THE FEAST under and about the tree, the cart and casks by the mill, the ponies; all the made things in one mesh
  const feast = await layFeast(props, C, rngFor('feast'), rngFor('feast-food'), { tree: [TREE.x, TREE.z], crown: party.reach, field: FIELD, ground: groundY, over: routeOver, poles: laid.poles, density, pause, brng: rngFor('bank-camp'), mrng: rngFor('marquee'), prng: rngFor('bank-picnic'), route: routeDistance });
  notes.push(feast.tables + ' tables, the nearest ' + feast.nearTable.toFixed(1) + ' m from the line in plan; ' + feast.tents + ' tents, the nearest ' + feast.nearTent.toFixed(1) + ' m; ' + (feast.kings.length ? 'the marquee stands' : 'no marquee') + '; props ' + props.triangles + ' triangles');
  await pause();
  // strings of lanterns from the tree's boughs out to the heads of the marquee's king poles
  const cords = [], srng = rngFor('marquee-strings'), tiesW = party.ties.map((q) => [q[0] + treeAt[0], q[1] + treeAt[1], q[2] + treeAt[2]]), taken = new Set();
  for (const kp of feast.kings) {
    let best = -1, bd = Infinity; for (let i = 0; i < tiesW.length; i++) { const d = Math.hypot(tiesW[i][0] - kp[0], tiesW[i][2] - kp[2]); if (d < bd && !taken.has(i)) { bd = d; best = i; } }
    if (best < 0) continue; taken.add(best);
    const a = tiesW[best], n = Math.max(6, Math.ceil(bd / 1.2)), sag = 0.9 + 0.05 * bd, pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push([a[0] + (kp[0] - a[0]) * t, a[1] + (kp[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (kp[2] - a[2]) * t]); }
    cords.push(pts);
    for (let i = 2; i < n * 0.74; i += 2) {
      const u = [srng(), srng(), srng(), srng(), srng()], q = pts[i], size = 0.5 + 0.28 * u[1], L = 1.2 + 0.9 * u[2], y = q[1] - L - 0.5 * size;
      if (routeDistance(q[0], y, q[2]) < 9.2 + 1.4 * size + 0.1 * L || y - size < groundY(q[0], q[2]) + 4.4 || lanternList.some((w) => Math.hypot(w.x - q[0], w.y - y, w.z - q[2]) < 2.6)) continue;
      lanternList.push({ ax: q[0], ay: q[1], az: q[2], L, size, kind: Math.floor(u[0] * 4), tint: Math.floor(u[3] * 4), phase: u[4], amp: Math.min(0.1, 0.42 / L), x: q[0], y, z: q[2] });
    }
  }
  await pause();
  await pause();
  const lampAt = lampField(lanternList); await pause();
  const lanterns = makeLanterns(THREE, lanternList, { lit }); object.add(lanterns.object); triangles += lanterns.triangles; drawCalls += lanterns.drawCalls;
  const flags = makeFlags(THREE, laid, { lampAt, lamp }), strings = makeStrings(THREE, laid.strings.concat(cords, feast.ropes));
  object.add(flags.object, strings.object); tally.push('lanterns ' + lanterns.triangles, 'flags ' + flags.triangles, 'strings ' + strings.triangles); triangles += flags.triangles + strings.triangles; drawCalls += flags.drawCalls + strings.drawCalls;
  for (const q of laid.poles) {                                 // a tall slim pole: bare wood, two painted bands and a ball at its head
    const h = q.y1 - q.y0, wood = C('#8b6c48'), cream = C('#eee3c4'), red = C('#c8402c'), pts = [], rad = [];
    for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([q.x, q.y0 - 0.6 + (h + 0.6) * t, q.z]); rad.push(0.3 - 0.14 * t); }
    limb(props, pts, rad, { sides: 5, kind: KIND.plain, cap: false, col: (t) => (t > 0.8 && t < 0.9 ? red : t >= 0.9 ? cream : mix3(mul(wood, 0.8), wood, t * 3 > 1 ? 1 : t * 3)) });
    turned(props, [q.x, q.y1, q.z], [[0.02, -0.3], [0.3, -0.12], [0.34, 0.12], [0.2, 0.36], [0.02, 0.44]], { sides: 5, kind: KIND.plain, c: C('#d9a53a') });
  }
  let nearest = Infinity; for (const q of lanternList) nearest = Math.min(nearest, routeDistance(q.x, q.y, q.z));
  let nearFlag = Infinity; for (const f of laid.flags) nearFlag = Math.min(nearFlag, routeDistance(f.x, f.y - 1.3 * f.size, f.z), routeDistance(f.x, f.y, f.z));
  let nearPole = Infinity; for (const q of laid.poles) nearPole = Math.min(nearPole, routeOver(q.x, q.z).dist);
  notes.push(lanternList.length + ' lanterns, the nearest middle ' + nearest.toFixed(1) + ' m from the line; ' + laid.flags.length + ' flags on ' + laid.strings.length + ' strings, the nearest ' + nearFlag.toFixed(1)
    + ' m; ' + laid.poles.length + ' poles, the nearest ' + nearPole.toFixed(1) + ' m in plan');
  await pause();
  put(party.wood, solid, treeAt, lampAt, warm); await pause();
  put(party.leaves, leaf, treeAt, lampAt, 1.5 * warm); await pause();
  notes.push('party tree: ' + party.clumps + ' leaf masses, top ' + (FIELD.y + party.top).toFixed(1) + ', reach ' + party.reach.toFixed(1) + ', lowest leaf y ' + (FIELD.y + party.lowest).toFixed(1));

  // THE OAK on the knoll: tall and domed, its feet in the knoll's turf
  const oakY = groundY(OAK.x, OAK.z), oakAt = [OAK.x, oakY, OAK.z];
  const oak = await growTree(rngFor('oak'), {
    height: OAK.height, crown: OAK.crown, trunkR: OAK.trunk, trunkTop: 13.5, clear: 10.3, sink: 3.5, lean: 0.08, flare: 0.8,
    buttresses: 6, trunkSides: 20, seam: [1, 0, -0.5], ground: (x, z) => groundY(OAK.x + x, OAK.z + z) - oakY,
    tiers: [
      { n: 5, phi: [6, 22], y0: [10.6, 12], r0: 1.4, r1: 0.36, bow: 1.9, wave: 2.6, sides: 8, segs: 9, sub: 5.4, subR: 0.5, risers: 0.25, rise: 7, twigs: [1, 2] },
      { n: 3, phi: [32, 52], y0: [11.8, 13], r0: 1.2, r1: 0.3, bow: 1.4, wave: 2.0, sides: 7, segs: 8, sub: 6, subR: 0.42, risers: 0.25, rise: 6, twigs: [1, 2] },
      { n: 2, phi: [62, 82], y0: [12.6, 13.4], r0: 1.05, r1: 0.26, bow: 1.1, wave: 1.4, sides: 6, segs: 7, sub: 6.5, subR: 0.36, risers: 0.2, rise: 4, twigs: [1, 2] },
    ],
    clumpR: 2.7, squash: 0.6, cards: 20, leaf: 1.3, flutter: 4, sway: 0.2,
    bark: C('#6b6052'), barkDark: C('#383029'), barkLight: C('#857a6a'), moss: C('#566b2c'), turf, lo: C('#173f1d'), mid: C('#356f25'), hi: C('#8ab142'),
  }, pause);
  await pause();
  // (the oak once wore a dead spar, a bare bleached bough standing out of the top of its crown. Seen up the lane it
  // read as a stray spike through the leaves, so it is taken off: the oak is whole and green)
  put(oak.wood, solid, oakAt); await pause();
  put(oak.leaves, leaf, oakAt); await pause();
  notes.push('oak: ' + oak.clumps + ' leaf masses, top ' + (oakY + oak.top).toFixed(1) + ', reach ' + oak.reach.toFixed(1));
  // THE HALL under the knoll is the homes builder's: no trunk, buttress or root of the oak may come inside its box (the
  // plan's HALL along the green door's own line, up to its crown) or within half a metre of it. None can: the oak's
  // roots end under ten metres from its middle and the hall ends farther off than that. The count says how near.
  const hx = -TOP.fx, hz = -TOP.fz, hallTop = TOP.y + DOOR.sill + 2 * HALL.r + 0.7; let nearHall = Infinity;
  for (let i = 0; i < oak.wood.count; i++) {
    const x = oak.wood.p[i * 3] + oakAt[0] - TOP.x, y = oak.wood.p[i * 3 + 1] + oakAt[1], z = oak.wood.p[i * 3 + 2] + oakAt[2] - TOP.z, s = x * hx + z * hz, l = Math.abs(z * hx - x * hz);
    nearHall = Math.min(nearHall, Math.hypot(Math.max(0, s - HALL.depth, -s), Math.max(0, l - HALL.half), Math.max(0, y - hallTop)));
  }
  notes.push('the oak\'s wood nearest the hall\'s box ' + nearHall.toFixed(1) + ' m');
  await pause();
  // THE BRIDGE, and the small plants in its joints (toadflax, valerian, ferns: leaves and petals on the trees' spray)
  const greens = new Leafy(), stoneWork = new Solid(), brng = rngFor('bridge');
  const bridge = buildBridge(stoneWork, C, brng);
  const petals = [C('#e9b7d2'), C('#f4efe0'), C('#f0d25a'), C('#b79ae0'), C('#e2607a')], fern = C('#3e7a2c'), fernTip = C('#86b548');
  for (const q of bridge.plants) { const fl = brng() < 0.45; sprig(greens, brng, q, [q[3], q[4], q[5]], brng.range(0.3, 0.62), fern, fl ? petals[Math.floor(brng() * petals.length)] : fernTip); }
  await pause();
  put(stoneWork, solid, [0, 0, 0], lampAt); await pause();
  put(greens, leaf, [0, 0, 0], lampAt, 1.5); await pause();
  // THE MILL (its panes alight by the hour: its own mesh, so that the lamp channel is the windows'), THE WHEEL that
  // turns, and the white water of its pit
  const millWork = new Solid(), mrng = rngFor('mill'), M = buildMill(millWork, C, mrng); await pause();
  const pit = dressMill(millWork, M, groundY); await pause();
  put(millWork, solid, [0, 0, 0]); await pause();
  const wheelWork = new Solid(); buildWheel(wheelWork, C, mrng);
  const wheel = put(wheelWork, solid, [MILL.wheel.x, MILL.wheel.y, MILL.wheel.z]); await pause();
  const millWater = makeMillWater(THREE, fx, { race: pit.race, rng: mrng }); object.add(millWater.object); triangles += millWater.triangles; drawCalls += millWater.drawCalls;
  flora.holdGlow(leaf, leafGeos);
  // the lanterns' light pooled on the grass: a soft warm round under each of the lower lanterns, wider and fainter the
  // higher the lantern hangs, added over the turf a hand above it (faint by day)
  let pool = null;
  if (lit > 0) {
    const steep = (x, z) => Math.abs(groundY(x + 3, z) - groundY(x - 3, z)) + Math.abs(groundY(x, z + 3) - groundY(x, z - 3)) > 0.9;   // no pool on the bank's slope
    const low = lanternList.map((q) => [q.x, q.y - groundY(q.x, q.z), q.z]).filter((q) => q[1] < 11 && !steep(q[0], q[2])).sort((a, b) => a[1] - b[1]).slice(0, 150), pp = [], cc = [], ii = [];
    for (const [x, h, z] of low) {
      const r = 1.6 + 0.42 * h, b = Math.min(1, Math.max(0.3, 1.25 - 0.08 * h)), i0 = pp.length / 3;
      pp.push(x, groundY(x, z) + 0.09, z); cc.push(b, b, b);
      for (let k = 0; k < 9; k++) { const a = k * Math.PI * 2 / 9, px = x + r * Math.cos(a), pz = z + r * Math.sin(a); pp.push(px, groundY(px, pz) + 0.09, pz); cc.push(0, 0, 0); ii.push(i0, i0 + 1 + (k + 1) % 9, i0 + 1 + k); }
    }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3)); pg.setIndex(ii);
    const pm = new THREE.MeshBasicMaterial({ color: lamp.clone().multiplyScalar(0.36 - 0.16 * lit), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 });
    pool = new THREE.Mesh(pg, pm); pool.renderOrder = 1; object.add(pool); geos.push(pg); triangles += ii.length / 3; drawCalls++;
    await pause();
  }
  // all the made things in one mesh; each pony's neck and tail are their own, so that it can graze and flick its tail
  put(props, solid, [0, 0, 0], lampAt, warm); await pause();
  const movers = feast.ponies.map((q, i) => { const nk = put(q.neck, solid, q.neckAt), tl = put(q.tail, solid, q.tailAt); nk.rotation.y = tl.rotation.y = q.yaw; return { nk, tl, ph: q.phase }; });                 // each pony's phase is dealt by the stream 'feast'

  return {
    object, triangles: Math.round(triangles), drawCalls, notes: notes.join('; ') + '; triangles by mesh, in the order made: ' + tally.join(', '),
    update(dt, time) { wind.update(time); lanterns.time.value = time; flags.time.value = time; wheel.rotation.z = -time * WHEEL_TURN; millWater.time.value = time;
      for (const m of movers) { m.nk.rotation.z = 0.02 + 0.045 * Math.sin(time * 0.6 + m.ph) + 0.012 * Math.sin(time * 2.1 + m.ph); m.tl.rotation.z = -0.06 * Math.sin(time * 1.1 + m.ph) - 0.55 * Math.pow(Math.max(0, Math.sin(time * 0.5 + m.ph)), 14); }
    },
    dispose() { for (const g of geos) g.dispose(); solid.dispose(); spray.dispose(); leaf.dispose(); lanterns.dispose(); flags.dispose(); strings.dispose(); millWater.dispose(); if (pool) pool.material.dispose(); },
  };
}
