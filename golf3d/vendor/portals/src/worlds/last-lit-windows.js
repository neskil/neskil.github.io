// THE LAST LIT WINDOWS: a traveller comes home across a land where the sun has gone out. Low past fire-pits and
// running hounds, under the head of a living hill that has stared for an age at the last house of humankind, over
// the ring of clear light where the host stands in armour, up the grey metal face of a pyramid miles high, floor after
// floor of lit windows with small watching figures, out over the dark country and back in through the mouth of the open
// gallery where the gateway stands.
//
// MAP OF THIS FILE
//   1. the visit        what the seed decides: the air, the pyramid's hour, the colour of the near fires, the pack,
//                       which far Watcher wears the crown, the greeting
//   2. build(ctx)       PATH -> PLACES (where the route meets the things of the world, in metres along it) -> shared light
//                       (parts/last-lit-windows.js: makeShared) -> the hero (the pyramid's face, gate, gallery, crowd) ->
//                       the night (parts/-land: sky, plain, glow map, ring, dome, fires, moss; parts/-far: house, cones,
//                       strata) -> the Watchers (parts/-watcher) -> the cast (parts/-cast: hounds, walkers, the host and
//                       its discs, giants) -> air (ash, mist) -> lights -> pace, pois
//   3. update()         the clock (time, from a dealt second): windows, flames, smoke, breath, the ring's pulses, the
//                       giants' round. Paced to the flight (metres flown, from the PLACES): the hounds' run or the
//                       striding giant, the walkers on the road. By where the eye is among the things of the world:
//                       the two sliding lights, the colour of the ash, the ashfall's lifting, the greeting wave (rare).
// Space: Y up, metres; the pyramid is centred on the origin and the flight is over its +Z face (z = 1200 - 0.325 y).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeShared, makeFigures, GATE, GAL, PYR, faceZ } from '../parts/last-lit-windows.js';
import { makeLayout, glowLights, makeGlowMap, GLOW_FAR, GLOW_WIDE, wideLights, buildSky, buildGround, buildRing, buildDome, buildFires, buildMoss, buildBoulders, roadZ, ringDist } from '../parts/last-lit-windows-land.js';
import { buildWatcher } from '../parts/last-lit-windows-watcher.js';
import { houndGeometry, giantGeometry, makeCreatures, buildWalkers, buildDiscs } from '../parts/last-lit-windows-cast.js';
import { buildHouse, buildCones, buildKiln, buildStrata, buildCrown, buildWanderers, buildFarGlow } from '../parts/last-lit-windows-far.js';

const DUR = 50;
// THE ROUTE. We come in from the south-west at 40 m, heading for the great Watcher's head, so that it is seen whole
// against the windows; swing left round it, pass under the head and in front of the dome of light, cross the road and
// the ring, and come over the causeway to the great gate. There we turn along the face and climb it, 36 m off, 37
// degrees up; then draw out from it over the dark country (to 67 m off), turn back, and fly in through the second mouth
// of the gallery at 38 degrees to the wall; a last easy turn inside, and the hall straight to the gateway.
const PATH_PTS = [[-370, 40, 2000], [-285, 26, 1853], [-258, 15, 1730], [-232, 12, 1600], [-198, 15, 1522], [-130, 16, 1420], [-50, 23, 1310], [25, 40, 1236],
  [36, 50, 1227], [49, 63, 1218], [65, 75, 1212], [100, 102, 1203], [135, 129, 1194], [159, 138, 1192], [182, 146, 1197], [217, 157, 1209], [241, 163, 1214],
  [266, 170, 1210], [288, 176, 1199], [312, 174, 1181], [335, 173, 1163], [359, 171, 1144], [387, 171, 1130], [417, 171, 1125], [452, 171, 1125], [486, 171, 1125], [520, 171, 1125]];
const RED = [0.366, 0.0152, 0.0109], BLUE = [0.045, 0.133, 0.745], PALE = [0.72, 0.83, 1.0];

export default {
  id: 'last-lit-windows',
  name: 'The Last Lit Windows',
  category: 'books',
  placeKind: 'bizarre',
  book: 'The Night Land',
  author: 'William Hope Hodgson, 1877 to 1918',
  weirdness: 0.8,
  async build(ctx) {
    const rng = ctx.rng, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1);
    // THE STREAMS. One seeded stream for each family of things, all taken here in this fixed order before anything is
    // dealt, so that no family's count of draws can move another's. A new family goes at the end of the list.
    const S = {};
    for (const n of ['visit', 'windows', 'crowd', 'watchers', 'pits', 'house', 'holes', 'cones', 'kiln', 'fields', 'farfires', 'fires', 'smoke', 'haze', 'holeglows',
      'fireglows', 'sparksA', 'sparksB', 'moss', 'conesmoke', 'far', 'cast', 'ash', 'mist', 'fog', 'host', 'breath', 'wander', 'round', 'strata', 'clock']) S[n] = rng.fork(n);
    // the families added later: each a stream of its own from the world's seed and its name, drawing from no parent
    for (const n of ['balconies', 'companies', 'fargiants']) S[n] = ctx.core.makeRng(ctx.core.hashSeed(n + ':' + ctx.seed));
    // polish round 1: the boulders of the plain and the cities of the face, each a stream of its own in the same way
    for (const n of ['boulders', 'cities']) S[n] = ctx.core.makeRng(ctx.core.hashSeed(n + ':' + ctx.seed));
    // ---------------------------------------------------------------- 1. the visit
    // SHARES, as a rule. The air: clear on 1 visit in 2; heavy ashfall, dry snow and ground mist on 1 in 6 each. The
    // pyramid's hour: evening on 1 in 2, waking on 1 in 4, its sleep-time on 1 in 4. The near fires blue on 3 in 10. Crown
    // and pit change Watchers on 1 in 2. The greeting on 1 in 6. One striding giant in place of the pack on 1 in 6.
    const vr = S.visit;
    const airDraw = vr(), air = airDraw < 1 / 2 ? 'clear' : airDraw < 1 / 2 + 1 / 6 ? 'ash' : airDraw < 1 / 2 + 2 / 6 ? 'snow' : 'mist';
    const hourDraw = vr(), hour = hourDraw < 1 / 2 ? 'evening' : hourDraw < 3 / 4 ? 'waking' : 'sleep';
    const LIT = { evening: 0.7, waking: 0.85, sleep: 0.35 }[hour];
    const blueField = vr.chance(3 / 10), swap = vr.chance(1 / 2), greet = vr.chance(1 / 6);
    const giant = vr.chance(1 / 6), pack = vr.int(8, 20);
    const scene = new THREE.Scene();
    const path = makePath(PATH_PTS), PL = path.length;
    const shared = makeShared();
    const SU = shared.uniforms;
    const time = { value: 0 };
    // the kit's effects fog themselves with the scene's fog; every material of ours fogs itself
    scene.fog = new THREE.FogExp2(new THREE.Color('#0C0B14'), 0.0006);
    scene.background = new THREE.Color('#050409');
    const fog0 = SU.uFog.value.clone();
    await ctx.yield();

    // ---------------------------------------------------------------- 2. the last house
    const hero = await buildHero(ctx, { shared, streams: S, lit: LIT, crowd: Math.round((hour === 'sleep' ? 1600 : hour === 'waking' ? 2700 : 2400) * (0.5 + 0.5 * detail)), galLight: hour === 'sleep' ? 0.8 : 1 });
    scene.add(hero.object);
    await ctx.yield();

    // ---------------------------------------------------------------- the night and the land
    const L = makeLayout(ctx, path, { blueField, swap, streams: S });
    await ctx.yield();
    // ---------------------------------------------------------------- PLACES: where the route meets the things of the
    // world, in metres from its start. Each is found on the path (a crossing, or the nearest point to a thing); every
    // window of the journey below is written from these, in metres, and its u is whatever comes out.
    const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _a = [0, 0], _b = [0, 0];
    const firstAt = (test, from = 0) => { for (let d = from; d < PL; d += 1) if (test(path.posAtDist(d, _p))) return d; return PL; };
    const abeam = (x, z) => path.nearestXZ(x, z).u * PL;
    const off = (p) => p.z - faceZ(p.y);
    const AT = {};
    // under the great Watcher's head
    AT.head = abeam(L.W.head[0], L.W.head[1]);
    // abeam of pit A, on our left where the hounds run
    AT.pitA = abeam(L.pits[0].x, L.pits[0].z);
    // where the route crosses the pale road, and the ring
    AT.road = firstAt((p) => p.z < roadZ(p.x));
    AT.ring = L.dRing;
    // over the causeway before the great gate: the foot of the climb
    AT.gate = abeam(GATE.x, PYR.half);
    // where the route first comes within 60 m of the face
    AT.near = firstAt((p) => off(p) < 60);
    // where, after the climb, we have drawn 50 m off the face; and where we pass through its outer skin, in the gallery's mouth
    AT.leave = firstAt((p) => off(p) > 50, AT.gate + 60);
    AT.mouth = firstAt((p) => off(p) < 0, AT.leave);
    const cp = path.posAtDist(AT.ring).clone();

    // the red glows low on the far horizon stand over the five fire fields of the far country (dealt from the 'fields'
    // stream): each as wide as its field is from the house's centre and a third again (its smoke spreads it), the wider
    // field the stronger; the cold one stands over the plain of blue fire; the sky between them is black
    const sky = buildSky(shared, [
      ...L.fields.map((q) => [q[0], q[1], 1.3 * q[2] / Math.hypot(q[0], q[1]), 0, 0.5 + 0.2 * (q[2] - 180) / 240]),
      [L.bluePlain[0] * 1.2, L.bluePlain[1] * 1.2, 0.12, 1, 0.45],
    ]);
    scene.add(sky.mesh);
    await ctx.yield();
    const lights = glowLights(L);
    const glowMap = await makeGlowMap(ctx, lights);
    await ctx.yield();
    const glowFar = await makeGlowMap(ctx, lights, GLOW_FAR);
    await ctx.yield();
    // polish round 1 (P1a): the firelight of the country at large, one more map (see wideLights)
    const wideLs = wideLights(L), glowWide = await makeGlowMap(ctx, wideLs, GLOW_WIDE);
    await ctx.yield();
    const ground = await buildGround(ctx, shared, L, lights, glowMap, hero.uniforms, glowFar, { tex: glowWide });
    scene.add(ground.mesh);
    await ctx.yield();
    const ring = buildRing(ctx, shared, L); scene.add(ring.mesh);
    await ctx.yield();
    const dome = buildDome(ctx, shared, L); scene.add(dome.mesh);
    await ctx.yield();
    const fires = await buildFires(ctx, shared, L, fx, time, { path, detail, streams: S });
    scene.add(fires.group);
    await ctx.yield();
    const moss = await buildMoss(ctx, shared, L, lights, path, Math.round(2500 * detail), S.moss);
    scene.add(moss.mesh);
    await ctx.yield();
    const boulders = await buildBoulders(ctx, shared, L, path, wideLs, S.boulders, Math.round(1000 * detail));
    scene.add(boulders.mesh);
    await ctx.yield();
    const house = buildHouse(shared, L); scene.add(house.mesh);
    const cones = await buildCones(ctx, shared, L, S.conesmoke); scene.add(cones.group);
    const kiln = buildKiln(shared, L); scene.add(kiln.mesh);
    await ctx.yield();
    // the three strata of the brief, each two sheets thick, and two low bars lying over the eastern land, one somewhere
    // from 85 to 125 m up and one from 45 to 75 m: where, is the seed's
    const barHi = S.strata.range(85, 125), barLo = S.strata.range(45, 75);
    const strata = buildStrata(shared, [
      [1000, 300, 2400, 3600, 0.5, 0], [690, 300, 2400, 3200, 0.42, 0], [640, 300, 2400, 3200, 0.52, 0], [365, 300, 2400, 2800, 0.42, 0], [318, 300, 2400, 2800, 0.52, 0],
      [barHi, 1500, 2500, 1700, 0.44, 1], [barLo, 1700, 2300, 1500, 0.46, 1],
    ], { tex: glowFar, box: [GLOW_FAR.x0, GLOW_FAR.z0, 1 / GLOW_FAR.w, 1 / GLOW_FAR.d], wide: glowWide, wideBox: [GLOW_WIDE.x0, GLOW_WIDE.z0, 1 / GLOW_WIDE.w, 1 / GLOW_WIDE.d] });
    scene.add(strata.mesh);
    await ctx.yield();

    // ---------------------------------------------------------------- the Watchers
    // the great one takes the red of every pit and fire-hole that burns near it, baked on its hide
    const hideGlow = [];
    for (const q of L.pits) if (Math.hypot(q.x - L.W.c[0], q.z - L.W.c[1]) < 420) hideGlow.push({ at: [q.x, q.y + 3, q.z], color: q.kind ? BLUE : RED, reach: q.r * 6, power: 2.2, sharp: 1 });
    // (polish round 1, P2: and each of those pits lights it broadly from below, its half light at the Watcher's own
    // height, so that brow, shoulders and the hide's folds are read from the road)
    for (const q of L.pits) if (Math.hypot(q.x - L.W.c[0], q.z - L.W.c[1]) < 420) hideGlow.push({ at: [q.x, q.y + 3, q.z], color: q.kind ? BLUE : [0.42, 0.06, 0.016], reach: L.W.tall * 0.4, power: 0.35, sharp: 1, low: [L.heightAt(L.W.c[0], L.W.c[1]), L.heightAt(L.W.c[0], L.W.c[1]) + L.W.tall / 3] });   // (second part, G2: whole at the Watcher's foot, nothing from a third of its height up)
    for (const q of L.holes) if (Math.hypot(q.x - L.W.c[0], q.z - L.W.c[1]) < 330) hideGlow.push({ at: [q.x, q.y + 1.5, q.z], color: q.kind ? BLUE : RED, reach: q.r * 12, power: 1.2, sharp: 1 });
    const great = await buildWatcher(ctx, shared, { c: L.W.c, f: L.W.f, tall: L.W.tall, ground: L.heightAt, seed: 1.7, headSeg: 84, glow: hideGlow, dome: { at: [L.dome.x, 22, L.dome.z], reach: 125, color: [0.3, 0.345, 0.44] } });
    scene.add(great.group);
    await ctx.yield();
    // the two far ones, each alone on its own quarter of the compass (which quarters, and where in them, the layout
    // deals): the first long and low with its head carried high, the second tall and steep with its head sunk; one over
    // a red pit, one under a ring of blue light
    const farW = [], farGlow = { positions: [], sizes: [], colors: [] };
    const FAR_FORM = [{ lenK: 1.2, widK: 0.9, hump: 0.82, headUp: 1.22, headTilt: 0.5 }, { lenK: 0.82, widK: 1.1, hump: 1.22, headUp: 0.78, headTilt: 0.06 }];
    for (let i = 0; i < L.far.length; i++) {
      const w = L.far[i];
      const pitAt = [w.pit[0], 6, w.pit[1]], crownAt = [w.x + w.f[0] * w.tall * 0.55, w.tall * 1.02, w.z + w.f[1] * w.tall * 0.55];
      const glow = w.glow === 'pit' ? { at: pitAt, color: RED, reach: 190, power: 2.6 } : { at: crownAt, color: BLUE, reach: 110, power: 2.0 };
      const fw = await buildWatcher(ctx, shared, { c: [w.x, w.z], f: w.f, tall: w.tall, ...FAR_FORM[i], rings: 36, sectors: 64, headSeg: 24, seed: 5.3 + i * 3.1, glow, rim: w.glow === 'pit' ? 0 : 1.3 });   // (second part, G3d: the one lit red from below has no pale rim: a dark hump)
      scene.add(fw.group); farW.push(fw);
      // polish round 1 (P1g): the light of its own fire (or ring) stands in the air behind it
      scene.add(buildFarGlow(shared, w, w.glow === 'pit' ? [0.26, 0.032, 0.011] : [0.03, 0.042, 0.065]).mesh);
      // the far lights are small and stand at their own places (the pit at the body's foot, the crown over its head), so
      // that the body between stays a whole dark shape
      if (w.glow === 'pit') { farGlow.positions.push([pitAt[0], 10, pitAt[2]]); farGlow.sizes.push(0.6); farGlow.colors.push('#A3211B'); }
      else { scene.add(buildCrown(shared, crownAt, w.tall * 0.2).mesh); farGlow.positions.push(crownAt); farGlow.sizes.push(0.6); farGlow.colors.push('#A9C6FF'); }
      await ctx.yield();
    }
    farGlow.positions.push(house.front); farGlow.sizes.push(0.13); farGlow.colors.push('#DDEBFF');
    for (const c of L.cones) { farGlow.positions.push([c.x, c.y + c.h * 1.05, c.z]); farGlow.sizes.push(c.h / 90); farGlow.colors.push('#A3211B'); }
    const farGlows = fx.makeGlows({ rng: S.far, ...farGlow, size: 150, intensity: 0.5, core: 0, halo: 1, flicker: 0.12, near: [0.2, 1], minAngle: 0, fogAmount: 0.25, time, renderOrder: 2 });
    scene.add(farGlows.object);
    await ctx.yield();

    // ---------------------------------------------------------------- the cast
    // Hounds (or, on some visits, one giant) run ahead on our left, between the route and pit A. Where they are is a function
    // of how far we have come: they pass pit A when we are 40 m short of it (near enough to read them against its fire), and
    // are level with us 17 m short of the road; there they wheel away west along it.
    const cr = S.cast;
    const route = (s, c, out) => {
      const sT = Math.min(s, c.turn);
      path.posAtDist(sT, _p); path.tangentAtDist(sT, _t);
      const tl = Math.hypot(_t.x, _t.z) || 1, tx = _t.x / tl, tz = _t.z / tl;
      const x0 = _p.x + tz * c.left, z0 = _p.z - tx * c.left;
      if (s <= c.turn) { out[0] = x0; out[1] = z0; return out; }
      const a = s - c.turn, th0 = Math.atan2(tz, tx), aEnd = Math.max(0, c.R * (th0 + Math.PI)), th = th0 - Math.min(a, aEnd) / c.R;
      let x = x0 - c.R * (Math.sin(th) - Math.sin(th0)), z = z0 + c.R * (Math.cos(th) - Math.cos(th0));
      if (a > aEnd) { const b = a - aEnd; x -= b; z = lerp(z, roadZ(x) + c.lane, smoothstep(0, 90, b)); }
      out[0] = x; out[1] = z; return out;
    };
    const cast = new THREE.Group(); cast.name = 'cast'; scene.add(cast);
    const nHounds = giant ? 0 : pack;
    const hounds = nHounds ? makeCreatures(shared, houndGeometry(), nHounds, { rig: [0.72, 0.95, 0.15, 0.2], albedo: [0.05, 0.046, 0.048], rim: 1.0, fire: 2.4, name: 'hounds' }) : null;
    const houndRows = [], houndTurn = AT.road - 17, houndK = (houndTurn - AT.pitA) / (houndTurn - AT.pitA + 40);
    for (let i = 0; i < nHounds; i++) {
      const ds = cr.range(-22, 24);
      houndRows.push({ ds, left: cr.range(11, 23), turn: houndTurn + ds * 0.35 + cr.range(-8, 8), R: cr.range(13, 22), lane: cr.range(-7, 7), size: cr.range(0.9, 1.16), ph: cr(), stride: cr.range(4.1, 4.8) * 2.1 });
    }
    if (hounds) cast.add(hounds.mesh);
    await ctx.yield();
    // the grey giants: two go slowly round the far kiln, crossing its fire; on a giant's visit a third strides past pit A
    const nGiants = 2 + (giant ? 1 : 0);
    const giants = makeCreatures(shared, giantGeometry(), nGiants, { rig: [0.42, 0.5, 0.3, 0], albedo: [0.07, 0.07, 0.078], rim: 0.7, name: 'giants' });
    cast.add(giants.mesh);
    const strider = { ds: 0, left: 16, turn: AT.road - 29, R: 30, lane: 0 };
    // giants walking in the dark country south and east of the house: each goes its own slow round about one of the far
    // fires that burn within 800 m outside the ring, the country the ring's men look out on (if fewer than seven burn so
    // near, about any far fire). Which fire, how wide, which way, and where on the round it is when we come: its own
    // stream; it goes on the world's clock
    const fq = S.fargiants, farGiants = makeCreatures(shared, giantGeometry(), 7, { rig: [0.42, 0.5, 0.3, 0], albedo: [0.07, 0.07, 0.078], rim: 0.7, name: 'far-giants' });
    cast.add(farGiants.mesh);
    const ringFires = L.farFires.filter((q) => ringDist(q.x, q.z) < 800), nearFires = ringFires.length >= 7 ? ringFires : L.farFires;
    const farRounds = [];
    await ctx.yield();
    for (let i = 0; i < 7; i++) { const q = fq.pick(nearFires); farRounds.push({ x: q.x, z: q.z, R: q.r * fq.range(5, 11), w: (fq.chance(1 / 2) ? 1 : -1) * 2.4, ph: fq() * 6.283, size: fq.range(0.9, 1.25) }); }
    const walkers = buildWalkers(shared, 9); cast.add(walkers.mesh);
    const walkRows = []; let span = 0;
    for (let i = 0; i < 9; i++) { walkRows.push({ base: span, lane: cr.range(-2.2, 2.2), ph: cr() * 6.28 }); span += cr.range(60, 140); }
    // The walkers go east at 1.1 m/s for as long as the journey has lasted (metres flown over our mean speed), from a
    // common start along their road that is the seed's (walkShift, below: anywhere within 100 m, the mean spacing of two
    // walkers): which of them is near where we cross the road, and how near, comes of that.
    const WALK_X0 = -640, V_MEAN = PL / DUR;
    await ctx.yield();
    // the armoured men: two ranks just inside the ring where we cross it, facing the dark, a disc of cold light in each right hand
    const rankList = [];
    for (let i = 0; i < 300; i++) {
      const rank = i % 2, x = cp.x - 62 + (i >> 1) * 1.05 + rank * 0.5 + cr.range(-0.12, 0.12), z = 1420 - 9.5 - rank * 2.6 + cr.range(-0.15, 0.15);
      rankList.push([x, L.heightAt(x, z), z, 0, cr.range(0.96, 1.08), cr(), cr(), 0]);
    }
    const walkShift = cr.range(0, 100);        // the walkers' common start: the last draw of the cast's stream, so that it moves nothing dealt before it
    const ranks = makeFigures(shared, rankList, { armour: true, name: 'ranks', wave: 1 });
    cast.add(ranks.mesh);
    const discs = buildDiscs(shared, ranks); cast.add(discs.mesh);
    await ctx.yield();

    // ---------------------------------------------------------------- the air
    const set = fx.fxGroup(); scene.add(set.object);
    const snowing = air === 'snow';
    // ash (or snow): all of it close to the lens, as flakes, dim and warm: a far bright speck against this sky would be a star
    const ash = fx.makeParticles({ rng: S.ash, preset: snowing ? 'snow' : 'ash', time, count: Math.round({ clear: 360, ash: 900, snow: 1000, mist: 330 }[air] * detail), box: [14, 10, 14], minAngle: 0, near: [0.6, 2.5],
      velocity: snowing ? [-2.6, -1.1, 0.5] : [-2.2, -0.42, 0.4], size: snowing ? [0.04, 0.08] : [0.07, 0.2], colors: ['#402020', '#402020', '#402020'], intensity: 1, opacity: 0.9, additive: snowing ? 0.4 : 0.2 });
    set.add(ash);
    // ground mist in the hollow between the Watcher's head and the place where we cross the ring: centred midway between
    // them, and as deep (north to south) as they are apart, so that none lies on the swept ground
    set.add(fx.makeMist({ rng: S.mist, time, count: Math.round(70 * detail), area: [620, 7, Math.abs(L.W.head[1] - cp.z)], center: [0.5 * (L.W.head[0] + cp.x), 3, 0.5 * (L.W.head[1] + cp.z)], size: [18, 42], color: '#16141c', opacity: air === 'mist' ? 0.5 : 0.2, drift: [-0.8, 0, 0.2],
      heightAt: L.heightAt, lift: 1.2 }));
    await ctx.yield();
    if (air === 'mist') {
      set.add(fx.makeGroundFog({ rng: S.fog, time, layers: 5, size: 900, y: 0.5, height: 8, color: '#1b1820', opacity: 0.5, coverage: 0.62, wind: [-0.9, 0.3], sunDir: [0.35, 0.45, -0.82], sunColor: '#6a4a26', scatter: 0.3 }));
      SU.uFog.value.y = fog0.y * 2.4; fog0.y = SU.uFog.value.y;
      await ctx.yield();
    }
    // ---------------------------------------------------------------- the host
    // The men of the last house who have come out to meet the traveller: grey armour, drawn up in order. Two files down
    // each side of the causeway from the ring to the gate, facing it; two companies of five ranks before the gate, facing
    // the dark. Each has the disc of clear cold light in his right hand: out here there is no other lamp.
    const hr = S.host, hostList = [];
    const man = (x, z, face) => hostList.push([x + hr.range(-0.1, 0.1), L.heightAt(x, z), z + hr.range(-0.1, 0.1), face, hr.range(0.96, 1.08), hr(), hr(), 0]);
    for (let z = 1216; z < 1409; z += 1.5) for (const sx of [-1, 1]) { man(GATE.x + sx * 11.2, z, -sx * 1.57); man(GATE.x + sx * 12.9, z + 0.75, -sx * 1.57); }
    for (const sx of [-1, 1]) for (let r = 0; r < 5; r++) for (let k = 0; k < 16; k++) man(GATE.x + sx * (15.5 + k * 1.6), 1206 + r * 2.0, 0);
    // The companies: the host drawn up over the court on both hands of the causeway, one block of five ranks of eight to
    // each terrace of the court (the terraces lie 44 m apart, the first kerb 22 m from the face) and to every 46 m along
    // the face, facing the dark; three blocks in four are in their places (which: the seed's)
    await ctx.yield();
    const cq = S.companies;
    for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) {
      for (let j = 0; j < 4; j++) {
        const here = cq.chance(3 / 4), x0 = GATE.x + sx * (38 + 46 * k), z0 = 1244 + 44 * j;
        if (!here) continue;
        for (let r = 0; r < 5; r++) for (let i = 0; i < 8; i++) { const x = x0 + (i - 3.5) * 1.6, z = z0 + (r - 2) * 2.0; hostList.push([x + cq.range(-0.1, 0.1), L.heightAt(x, z), z + cq.range(-0.1, 0.1), cq.range(-0.15, 0.15), cq.range(0.96, 1.08), cq(), cq(), 0]); }
      }
      await ctx.yield();
    }
    const host = makeFigures(shared, hostList, { armour: true, name: 'host', wave: 1 });
    await ctx.yield();
    cast.add(host.mesh);
    const hostDiscs = buildDiscs(shared, host); cast.add(hostDiscs.mesh);
    await ctx.yield();
    // the breath of the warm house lying thin and low on the swept ground
    set.add(fx.makeMist({ rng: S.breath, time, count: Math.round(40 * detail), area: [460, 4, 190], center: [-30, 2.5, 1312], size: [18, 40], color: '#8a6238', opacity: 0.07, drift: [-0.6, 0, 0.12], lift: 1 }));
    await ctx.yield();
    const wanderers = buildWanderers(shared, S.wander, L); scene.add(wanderers.mesh);
    // where each giant is on its round and where each Watcher is in its breath when we arrive: the seed's
    const rr = S.round, giantPhase = [rr() * 6.283, rr() * 6.283];
    great.uniforms.uPhase.value = rr() * 6.283; for (const fw of farW) fw.uniforms.uPhase.value = rr() * 6.283;
    // the world's clock does not start at nought when we arrive: every flame, pulse, shutter and breath is somewhere in
    // its own round, by the seed (CLOCK0 seconds in); so is the slow wandering of the great eye
    const CLOCK0 = S.clock.range(0, 600), eyePhase = S.clock() * 6.283, striderPhase = S.clock();
    const ashRed = new THREE.Color(...(blueField ? [0.1, 0.2, 0.75] : [0.62, 0.05, 0.035])), ashPale = new THREE.Color(0.5, 0.58, 0.72), ashAmber = new THREE.Color(0.8, 0.42, 0.16), ashC = new THREE.Color();
    const ashGain = snowing ? 0.3 : 0.13;

    // ---------------------------------------------------------------- lights (for the kit's lit materials; ours carry their own)
    const key = new THREE.DirectionalLight(new THREE.Color('#FFC46B'), 1.1); key.position.set(0.35, 0.45, -0.82).multiplyScalar(600); scene.add(key);
    scene.add(new THREE.HemisphereLight(new THREE.Color('#1B1A28'), new THREE.Color('#07060B'), 0.35));
    const redLight = new THREE.PointLight(new THREE.Color('#A3211B'), 40, 120, 1.4); scene.add(redLight);
    const paleLight = new THREE.PointLight(new THREE.Color('#DDEBFF'), 30, 160, 1.4); scene.add(paleLight);
    // the four pits nearest the low flight (none lies inside the ring) light whatever passes them
    const pitsByPath = L.pits.map((p) => ({ p, n: path.nearestXZ(p.x, p.z) })).filter((q) => q.n.u * PL < AT.ring + 30).sort((a, b) => a.n.dist - b.n.dist);
    for (let i = 0; i < 4; i++) {
      const q = pitsByPath[i]; if (!q) continue;
      SU.uPit.value[i].set(q.p.x, q.p.y + 2.5, q.p.z, q.p.r * 2.4);
      SU.uPitCol.value[i].setRGB(...(q.p.kind ? BLUE : RED)).multiplyScalar(q.p.kind ? 2.2 : 3.2);
    }
    SU.uPale.value[0].set(L.dome.x, 14, L.dome.z, 85); SU.uPaleCol.value[0].setRGB(...PALE).multiplyScalar(0.45);
    SU.uPale.value[2].set(GATE.x, 14, faceZ(14) + 4, 55); SU.uPaleCol.value[2].setRGB(1.0, 0.85, 0.62).multiplyScalar(0.9);
    const ringCross = new THREE.Vector3(cp.x, 10, 1420), galLamp = new THREE.Vector3(430, 180, 1128);
    const paleCol = new THREE.Color('#DDEBFF'), amberCol = new THREE.Color('#FFC46B');

    const eye = new THREE.Vector3(), size = new THREE.Vector2(), ss = smoothstep;
    // PACE, from where the eye is among the things of the world (the eye at u is a point of the path):
    //   slower as the Watcher's head comes within 400 to 260 m (the entry is 430 m from the head), to look at it;
    //   faster again from 110 m outside the ring (the road lies 70 m outside it) to 40 m inside, over the bare swept ground;
    //   slower as the face comes within 120 to 40 m (the climb stands 36 m off it), to see the rooms;
    //   slowest from 250 to 150 m from the gateway (the gallery's mouth is some 155 m from it), through the mouth and down the hall.
    const headAt = new THREE.Vector3(L.W.head[0], 95, L.W.head[1]), gatewayAt = hero.anchors.portal;
    const pace = (u) => {
      path.posAtDist(u * PL, _p);
      let v = lerp(0.85, 1.05, ss(260, 400, _p.distanceTo(headAt)));
      v = lerp(1.15, v, ss(-40, 110, ringDist(_p.x, _p.z)));
      v = lerp(0.95, v, ss(40, 120, off(_p)));
      return lerp(0.85, v, ss(150, 250, _p.distanceTo(gatewayAt)));
    };
    const place = (cre, i, s, c, sizeK, phase) => {
      route(s, c, _a); route(s + 1.2, c, _b);
      cre.at[i].set(_a[0], L.heightAt(_a[0], _a[1]), _a[1], Math.atan2(_b[0] - _a[0], _b[1] - _a[1]));
      cre.gait[i].set(phase, 1, sizeK, 0);
    };
    // GAZE. One pull, from where the route first comes within 60 m of the face (AT.near: from there on its aim is the
    // face) to the gallery's mouth (AT.mouth). Its two ramps are measures of the place (polish round 1, P4). IN: the
    // pull comes on as the route's distance to the face falls from 60 m to STAND, the distance at which the route
    // stands off the face on the climb (its least between the foot of the climb and where it leaves the face); the
    // measure is the least distance the route has had so far, so the pull, once on, stays on when the route draws out
    // again. OUT: the pull goes off as the eye's distance to the gallery's mouth (the point where the route passes
    // the face's outer skin) falls from the mouth's own height (floor to lintel, GAL.head - GAL.y0) to nothing.
    // Between the ramps the pull is whole. Inside a ramp the aim is turned from the way ahead to the pull's own aim.
    // On the climb it turns the eye toward the face, at the people at the sills beside and just under
    // us (the point of the face abeam of where we shall be 25 m on; under our own height by 2 m and by as much again as
    // the route climbs in 14 m), so that the eye rides level however steeply the route climbs, and the wall stands upright
    // beside it with the land below on the other hand. The climb stands 36 m off the face: as we draw out from it, between 40 and 60 m off,
    // the pull swings out to the house on its hill in the dark country; and back to the face as we come in again.
    const gazeAt = new THREE.Vector3(), dA = new THREE.Vector3(), dB = new THREE.Vector3(), houseAt = new THREE.Vector3(L.house.x, L.house.y + 15, L.house.z);
    const AHEAD = 30, dW = new THREE.Vector3();
    // the least distance to the face that the route has had, metre by metre from its start; STAND; the mouth
    const least = new Float32Array(Math.ceil(PL) + 2); { let m = 1e9; for (let i = 0; i < least.length; i++) { m = Math.min(m, off(path.posAtDist(Math.min(i, PL), _p))); least[i] = m; } }
    let STAND = 1e9; for (let d = AT.gate; d <= AT.leave; d += 1) STAND = Math.min(STAND, off(path.posAtDist(d, _p)));
    const mouthAt = path.posAtDist(AT.mouth).clone(), MOUTH_H = GAL.head - GAL.y0;
    const gaze = (t, u) => {
      const d = u * PL;
      path.posAtDist(Math.min(d + 25, PL), _p); const xa = _p.x;
      path.tangentAtDist(d, _t); const dip = 2 + 14 * Math.max(_t.y / (_t.length() || 1), 0);
      path.posAtDist(d + AHEAD, dW);
      path.posAtDist(d, _p); dA.set(xa, _p.y - dip, faceZ(_p.y - dip)); dA.sub(_p).normalize(); dB.copy(houseAt).sub(_p).normalize();
      gazeAt.copy(dA).lerp(dB, ss(40, 60, off(_p))).normalize();
      const i = Math.min(Math.floor(d), least.length - 2), lst = lerp(least[i], least[i + 1], d - i);
      const k = (1 - ss(STAND, 60, lst)) * ss(0, MOUTH_H, _p.distanceTo(mouthAt));
      if (k < 1) gazeAt.lerp(dW.sub(_p).normalize(), 1 - k).normalize();
      return gazeAt.multiplyScalar(300).add(_p);
    };
    return {
      scene, path, duration: DUR, pace,
      camera: { fov: 64, near: 0.5, far: 5200, lookAhead: AHEAD, sway: 0.8, bank: 0.9 },
      pois: [
        // the Watcher's eye, from the entry (0 m) until we are under its head
        { at: great.eye, from: 0 / PL, to: AT.head / PL, weight: 0.55, fade: 0.3 },
        // the sills, then the house (see GAZE): seven parts in ten of the eye's turning, the rest left to the way ahead
        // so that the mouth is seen coming; the pull's own ramps are in its aim (see GAZE), so the window here has
        // none to speak of (a millionth of its length, which only keeps the kit's ramp from dividing by nothing)
        { at: gaze, from: AT.near / PL, to: AT.mouth / PL, weight: 0.7, fade: 1e-6 },
      ],
      portal: { shape: 'arch', width: 12, height: 16, color: '#DDEBFF', glow: 1, revealDistance: 330 },
      post: { exposure: 1.3, bloom: { strength: 0.55, radius: 0.6, threshold: 0.9 },
        grade: { saturation: 0.95, contrast: 1.06, shadowTint: '#0A0714', vignette: 0.42, grain: 0.035 } },
      update(dt, time_, camera, uPath) {
        // d: metres flown; every window of the journey below is in metres from a place (AT)
        const d = uPath * PL;
        const clock = time_ + CLOCK0;
        SU.uTime.value = clock; time.value = clock;
        eye.setFromMatrixPosition(camera.matrixWorld);
        const el = Math.hypot(eye.x, eye.z) || 1; SU.uPyrDir.value.set(-eye.x / el, -eye.z / el);
        sky.mesh.position.copy(eye);
        hero.update(dt, clock, camera);
        ctx.renderer.getDrawingBufferSize(size); ring.uniforms.uRes.value.copy(size); SU.uRes.value.copy(size);
        fires.update(dt, clock, camera); set.update(dt, clock, camera);
        // ---- the journey. The cast of the low flight (the pack, the striding giant, the walkers on the road) is paced to
        // the flight: each goes along its own course with the metres we have flown. Everything else follows from where the
        // eye is among the things of the world, or runs on the world's clock.
        const rdEye = ringDist(eye.x, eye.z), offEye = eye.z - faceZ(eye.y);
        // the hounds: the middle of the pack abeam of pit A when we are 40 m short of it, level with us at the place where they turn
        for (let i = 0; i < nHounds; i++) { const h = houndRows[i], s = AT.pitA + (d - AT.pitA + 40) * houndK + h.ds; place(hounds, i, s, h, h.size, s / h.stride + h.ph); }
        // the striding giant: two of its strides (19 m) past pit A as we come abeam of the pit, going at a third of our
        // speed, a giant's walk (so it crosses before the pit's fire 63 m before we come abeam)
        if (giant) { const s = AT.pitA + 19 + 0.3 * (d - AT.pitA); place(giants, 2, s, strider, 1, s / 9.5 + striderPhase); }
        ranks.uniforms.uEye.value.copy(eye); host.uniforms.uEye.value.copy(eye);
        // the greeting (rare). It wakes as the traveller comes into the ring's own light (12 m either side of the line); its
        // front climbs the rows as the traveller comes in, and is past where the lights go out (1600 m) when he is 130 m
        // inside; it spends itself as he comes in (to a third by 120 m inside, half the breadth of the swept ground) and is
        // gone as he comes under the face (from 110 to 40 m off it; the climb stands 36 m off it).
        if (greet) hero.setGreet(-40 + 1680 * ss(0, 130, -rdEye), 0.9 * ss(-12, 12, -rdEye) * Math.exp(Math.min(rdEye, 0) / 110) * ss(40, 110, offEye));
        // heavy ashfall lies on the land under the smoke: thick while the eye is under the lower of the two smoke bars,
        // thinning as the eye rises between them on the climb, clear above the upper bar (their heights are the seed's)
        if (air === 'ash') { const k = 1 - ss(barLo, barHi, eye.y); SU.uFog.value.x = fog0.x * (1 + 1.5 * k); SU.uFog.value.y = fog0.y * (1 + 0.8 * k); }
        // the ash takes the light of what is near the eye: red (or blue) within 150 m of a fire-pit, pale within 190 m of the
        // dome or 110 m of the ring, amber from the face (a little everywhere, all of it within 150 m of the face)
        let dPit = 1e9;
        for (const q of L.pits) dPit = Math.min(dPit, Math.hypot(eye.x - q.x, eye.y - q.y, eye.z - q.z));
        const sRed = 1 - ss(40, 150, dPit), sPale = Math.max(1 - ss(60, 190, Math.hypot(eye.x - L.dome.x, eye.z - L.dome.z)), 1 - ss(20, 110, Math.abs(ringDist(eye.x, eye.z))));
        const sAmb = 0.25 + 0.75 * (1 - ss(150, 420, eye.z - faceZ(eye.y))), sN = 1 / (sRed + sPale + sAmb);
        ashC.setRGB(ashRed.r * sRed + ashPale.r * sPale + ashAmber.r * sAmb, ashRed.g * sRed + ashPale.g * sPale + ashAmber.g * sAmb, ashRed.b * sRed + ashPale.b * sPale + ashAmber.b * sAmb).multiplyScalar(ashGain * sN);
        ash.uniforms.uColorA.value.copy(ashC); ash.uniforms.uColorB.value.copy(ashC).multiplyScalar(0.55); ash.uniforms.uColorC.value.copy(ashC).multiplyScalar(1.5);
        // the two sliding lights. Red: at the pit nearest the eye, going out as the eye comes from the road (70 m outside
        // the ring) to the ring itself, for no pit burns inside it. Pale: at the ring crossing while the eye is low; it goes
        // up with the eye, from the height of the gate's head to just under the gallery's floor, and is amber there.
        let best = pitsByPath[0], bd = 1e9;
        for (const q of pitsByPath) { const dd = Math.hypot(q.p.x - eye.x, q.p.z - eye.z); if (dd < bd) { bd = dd; best = q; } }
        if (best) redLight.position.set(best.p.x, best.p.y + 4, best.p.z);
        redLight.intensity = 40 * ss(0, 70, rdEye);
        const g = ss(GATE.h + 6, GAL.y0 - 10, eye.y);
        paleLight.position.lerpVectors(ringCross, galLamp, g); paleLight.color.copy(paleCol).lerp(amberCol, g);
        SU.uPale.value[1].set(paleLight.position.x, paleLight.position.y, paleLight.position.z, 60);
        SU.uPaleCol.value[1].copy(paleLight.color).multiplyScalar(0.2 * (1 - g));
        // the eye wanders slowly, and turns a few degrees toward whatever comes near it: the nearer, the more (half its
        // turn at 170 m, about the Watcher's own height)
        const de = eye.distanceTo(great.eye) / 170;
        great.eyeUniforms.uTurn.value = 0.1 * Math.sin(clock * 0.31 + eyePhase) + 0.3 / (1 + de * de);
        // the walkers on the road (see WALK_X0)
        for (let i = 0; i < 9; i++) {
          const w = walkRows[i], q = (((w.base + walkShift + 1.1 * d / V_MEAN) % span) + span) % span, x = WALK_X0 + q, z = roadZ(x) + w.lane;
          const sink = 1 - ss(0, 40, q) * (1 - ss(span - 40, span, q));
          walkers.at[i].set(x, L.heightAt(x, z) - 0.25 - 7 * sink, z, w.ph);
        }
        for (let i = 0; i < 7; i++) {
          const q = farRounds[i], a = clock * q.w / q.R + q.ph, x = q.x + Math.cos(a) * q.R, z = q.z + Math.sin(a) * q.R, sg = q.w > 0 ? 1 : -1;
          farGiants.at[i].set(x, L.heightAt(x, z), z, Math.atan2(-Math.sin(a) * sg, Math.cos(a) * sg));
          farGiants.gait[i].set(a * sg * q.R / 9.5, 1, q.size, 0);
        }
        // ---- the clock: the giants go round the kiln
        for (let i = 0; i < 2; i++) {
          const R = 25 + 7 * i, a = clock * (0.105 - 0.02 * i) + giantPhase[i], x = L.kiln.x + Math.cos(a) * R, z = L.kiln.z + Math.sin(a) * R;
          giants.at[i].set(x, L.heightAt(x, z), z, Math.atan2(-Math.sin(a), Math.cos(a)));
          giants.gait[i].set(a * R / 9.5, 1, 1 - 0.08 * i, 0);
        }
      },
      dispose() {},
    };
  },
};
