// The Squall Made of Light, after J. M. W. Turner (the late oils). REBUILT WHOLE, November 2026: a new flight and a new part.
// The place is ours, not a copy of one canvas: what is taken from him is the low sun the whole picture turns about, the air that
// eats every far thing, the old ship and the steam that tows her, the squall with the light in it and a steamer labouring in the
// eye of it, the harbour of pale stone.
// THE FLIGHT (about 820 m, 47 s): in over calm molten water toward a low sun, the sky laid in strokes wound about it; the last
// lugger of a fishing fleet close on the left hand, the sun over her yard; a bell buoy close on the right; a small black paddle
// tug coming down toward us, her coal smoke thick at the funnel and soon spent down the wind, and on a slack hawser astern of her
// an old three-decker in her black and yellow, lamps behind a few of her shut ports; we pass outside the tug and down the old
// ship's sunward side; then the squall, seen standing dark ahead from the first: within it the whole sky is its whirl, dark arms
// of cloud and rain wound about the sun with the light pouring between them, and the sea is got up and heavy (the flown line
// climbs three metres to go over it): a brig beats out across our bows, heeled toward us, the sun in her canvas as we come up,
// and we pass close under her; beyond her, in the eye of the whirl, a steam packet labours out against it, burying her bows, her
// wheels thrashing, her smoke torn flat down the wind and across the sun, and we pass close down her side; and seven more luggers
// run home before the wind with tanned sails spread, one always close ahead; out of it the town stands pale against the dark we
// have left; the
// lighthouse on the head of the mole; the harbour mouth; a water street of arcades, porticoes, a campanile and domes, a trader
// at anchor head to us with her sails loosed to dry and the sun behind them; a bridge of five arches, whose great middle arch is
// the way out.
// What reads the eye and what the clock moves: the head of the part says. Here the clock rocks the old ship and the tug, turns the
// tug's wheels and the packet's, lifts every vessel in the squall on the sea under her (bow, stern and beam ends; the packet's
// youngest smoke goes with her funnel), the buoy and the skiffs, stirs the vessels at the quays and swells the lighthouse's lamp
// (slowly: never a flash).
// CLEAR AIR: every solid stands well over two metres from the flown line at every clock. Measured at ten clocks, the nearest are
// the bridge's arch (6.7 m), the big lugger's sail (7.6 m as she rolls), the buoy (8.2 m), the fleet's first sail (9.1 m), the
// trader's yard arm (9.6 m), the tug's paddle box (9.8 m), a skiff in the water street (9.9 m), another lugger's sail (10.4 m),
// the straggler's sail at the start (11.6 m) and the packet's quarter (12.6 m); the old ship, the brig and the hawser stand over 14 m off. A
// gull's ring that would come within nine metres of the line is lifted nine metres over it. The eye is never under five metres,
// and the water lies 3.9 m and more under it, also where the squall's three swells crest together.
// THE WAY OUT is the engine's arch with no frame of its own (frame 0): our stone stands 0.6 m before it. It is first drawn with
// 280 m of route left, when the lighthouse's bastion stands before its place, and shows the next world from 170 m.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeUniforms, buildSky, buildSea, solidMaterial, lineMaterial, Mesher, Liner, drawShip, drawTug, drawLugger, drawHarbour, drawCoaster, drawSkiff, drawBuoy, buildGulls, buildPuffs, swellAt, sm } from '../parts/squall-of-light.js';

const DEG = Math.PI / 180;
// The places of things (metres; +Z is the course at the entry, +X is port). Everything below is set out from these.
const SHIP = { x: -24, z: 262, yaw: 172 * DEG };                  // the old three-decker, coming toward us under tow, her head a little toward our line (so the low sun rakes the side we pass)
const TUG = { x: 4, z: 172, yaw: 176 * DEG };                     // the tug ahead of her, hauling her down toward us; we pass outside the tug, so the tow never lies across our way
const BUOY = { x: -3, z: 78 };                                  // a bell buoy marking the channel, close on our right hand as we come in
const TRADER = { x: -72, z: 744, yaw: 160 * DEG };                // a trading vessel at anchor in the water street, head to the breeze (and so to us), her sails loosed to dry between us and the sun
// THE WIND blows from astern of us and a little from the left (toward +Z and a little toward -X): the tug's smoke streams back down it,
// the rain slants down it, the fishing fleet runs home before it with sails spread, a brig beats out against it.
const WIND = [-0.35, 0.94];
const BRIG = { x: 24, z: 374, yaw: 207 * DEG, s: 1.5 };           // close hauled on the starboard tack, standing out to sea across our bows, heeled toward us
const PACKET = { x: 12, z: 462, yaw: 150 * DEG, s: 1.7 };         // a steam packet labouring out against the squall, her head a point off the wind: beyond the brig, under the sun as we come up, in the eye of the whirl
// the fleet: x, z, heading, size, goose-winged or not. Each lies to one hand of the flown line, the big ones close. Seven in the squall, and a straggler.
const LUGGERS = [{ x: -22, z: 330, yaw: -24 * DEG, s: 1.7, w: 1 }, { x: -33, z: 460, yaw: -22 * DEG, s: 1.6, w: 0 }, { x: -22, z: 418, yaw: -28 * DEG, s: 2.0, w: 1 },
  { x: -4, z: 512, yaw: -20 * DEG, s: 1.6, w: 1 }, { x: -41, z: 508, yaw: -33 * DEG, s: 1.8, w: 0 }, { x: -31, z: 566, yaw: -30 * DEG, s: 1.4, w: 1 }, { x: -84, z: 586, yaw: -8 * DEG, s: 1.3, w: 0 },
  { x: 27, z: 104, yaw: -16 * DEG, s: 1.5, w: 1 }];                 // the last: the straggler, close on our left hand as we come in, the sun over her yard
const SQUALL = { x: -12, z: 455, r: 90 };                         // the squall: a column of rain with the light in it, standing on the sea
// the harbour: the lighthouse's bastion at the end of the left mole, the other mole's head, the mouth between them, the quays of the water street beyond
const HARBOUR = { bastion: [-62, 640], head: [-118, 646], mouthZ: 646, quayL: -45, quayR: -135, quayY: 2.6, gate: [-90, 800, 6.8, 8.0] };   // gate: x, z, the arch's radius, its springing height

export default {
  id: 'squall-of-light',
  name: 'The Squall Made of Light',
  category: 'artists',
  placeKind: 'ocean',
  after: 'J. M. W. Turner, 1775 to 1851',
  weirdness: 0.3,
  media: ['water', 'open'],
  async build(ctx) {
    const rng = ctx.rng, detail = Math.min(1, Math.max(0.6, ctx.quality?.detail ?? 1));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F0DDB6');
    const U = makeUniforms('fire', new THREE.Vector3(rng.range(0, 40), rng.range(0, 40), rng.range(0, 40)), rng.range(5.9, 6.9));   // each deal: its own sky, the sun a little higher or lower
    U.uSq.value.set(SQUALL.x, SQUALL.z, SQUALL.r, 2.1); U.uSwell.value.set(0.14, 2.8, 0, 0);
    U.uCalm.value.set(HARBOUR.mouthZ - 8, HARBOUR.mouthZ + 46, 1, 0);       // within the moles the water lies stiller and glassier
    const trash = [];
    const sky = buildSky(U), sea = buildSea(U, detail);
    scene.add(sky, sea); trash.push(sky, sea);
    await ctx.yield();

    const solid = solidMaterial(U), lines = lineMaterial(U);
    // the ship
    const shipG = new THREE.Group(); shipG.position.set(SHIP.x, 0, SHIP.z); shipG.rotation.y = SHIP.yaw; scene.add(shipG);
    const sM = new Mesher(), sL = new Liner();
    const ship = drawShip(sM, sL, rng.fork ? rng.fork('ship') : rng);
    await ctx.yield();
    const shipMesh = new THREE.Mesh(sM.geometry(), solid), shipLines = new THREE.Mesh(sL.geometry(), lines);
    shipMesh.frustumCulled = shipLines.frustumCulled = false; shipLines.renderOrder = 5;
    shipG.add(shipMesh, shipLines); trash.push(shipMesh, shipLines);
    await ctx.yield();
    // the tug
    const tugG = new THREE.Group(); tugG.position.set(TUG.x, 0, TUG.z); tugG.rotation.y = TUG.yaw; scene.add(tugG);
    const tM = new Mesher(), tL = new Liner(), tW = new Mesher();
    const tug = drawTug(tM, tL, tW, rng.fork ? rng.fork('tug') : rng);
    const tugMesh = new THREE.Mesh(tM.geometry(), solid), tugLines = new THREE.Mesh(tL.geometry(), lines), wheels = new THREE.Mesh(tW.geometry(), solid);
    tugMesh.frustumCulled = tugLines.frustumCulled = wheels.frustumCulled = false; tugLines.renderOrder = 5;
    wheels.position.set(tug.shaft[0], tug.shaft[1], tug.shaft[2]);
    tugG.add(tugMesh, tugLines, wheels); trash.push(tugMesh, tugLines, wheels);
    await ctx.yield();
    // the hawser: from her starboard hawse (the tug lies on that bow) to the tug's bitts, a slack tow with its long bight in the sea
    const toWorld = (g, q) => { const c = Math.cos(g.rotation.y), s = Math.sin(g.rotation.y); return [g.position.x + q[0] * c + q[2] * s, q[1], g.position.z - q[0] * s + q[2] * c]; };
    const hL = new Liner(), hA = toWorld(shipG, [-ship.hawse[0], ship.hawse[1], ship.hawse[2]]), hB = toWorld(tugG, tug.tow), hp = [];
    for (let i = 0; i <= 40; i++) { const k = i / 40; hp.push([hA[0] + (hB[0] - hA[0]) * k, hA[1] + (hB[1] - hA[1]) * k - 8.4 * 4 * k * (1 - k), hA[2] + (hB[2] - hA[2]) * k]); }
    hL.line(hp, 0.26, new THREE.Color('#33261E'), 1, 1);                    // a heavy tarred rope: it takes no thread of light
    const hawser = new THREE.Mesh(hL.geometry(), lines); hawser.frustumCulled = false; hawser.renderOrder = 5; scene.add(hawser); trash.push(hawser);

    // what the sea must know of them: where each hull lies (for the dark and the white along her side, and the tug's wake), and boxes to mirror
    let nb = 0;
    const mirror = (g, bx, col) => { if (nb >= 32) return; const c = toWorld(g, bx.c); U.uBxC.value[nb].set(c[0], c[1], c[2], Math.cos(g.rotation.y)); U.uBxH.value[nb].set(bx.h[0], bx.h[1], bx.h[2], Math.sin(g.rotation.y)); U.uBxCol.value[nb].set(col[0], col[1], col[2]); nb++; };
    U.uVes.value[0].set(SHIP.x, SHIP.z, Math.cos(SHIP.yaw), Math.sin(SHIP.yaw)); U.uVesS.value[0].set(7.5, 30.5, 1, 0);
    U.uVes.value[1].set(TUG.x, TUG.z, Math.cos(TUG.yaw), Math.sin(TUG.yaw)); U.uVesS.value[1].set(2.9, 13.4, 2, tug.wheelX);
    mirror(shipG, ship.boxes[0], [0.4, 0.31, 0.19]); mirror(shipG, ship.boxes[1], [0.4, 0.31, 0.19]); for (let i = 2; i < 5; i++) mirror(shipG, ship.boxes[i], [0.66, 0.56, 0.36]);
    mirror(tugG, tug.boxes[0], [0.03, 0.022, 0.02]); mirror(tugG, tug.boxes[1], [0.025, 0.02, 0.02]);

    // the tug's smoke: thick and black at the funnel, streaming aft down the wind and climbing, soon a thin haze (it is spent before the old ship); the thrash of her wheels
    const puffs = [], pr = rng.fork ? rng.fork('puffs') : rng;
    const fW = toWorld(tugG, tug.funnel), nS = Math.round(150 * detail);
    for (let i = 0; i < nS; i++) puffs.push({ p0: [fW[0], fW[1] + 0.2, fW[2]], v: [WIND[0] * 84, 5, WIND[1] * 78], phase: (i + pr()) / nS, rate: 1 / 17, r0: 1.0, r1: pr.range(9, 15), rise: pr.range(18, 26), wob: pr.range(1.0, 2.6), seed: pr(), mode: 0 });
    for (const sd of [1, -1]) {
      const wp = toWorld(tugG, [sd * tug.wheelX, 0.3, tug.shaft[2] - 1.6]), aft = toWorld({ position: { x: 0, z: 0 }, rotation: tugG.rotation }, [sd * 0.9, 0, -7]);
      for (let i = 0; i < 22; i++) puffs.push({ p0: [wp[0] + pr.range(-0.4, 0.4), wp[1], wp[2] + pr.range(-0.6, 0.6)], v: [aft[0] * pr.range(0.5, 1.2), 0, aft[2] * pr.range(0.5, 1.2)], phase: (i + pr()) / 22, rate: pr.range(0.6, 1.0), r0: 0.2, r1: pr.range(0.5, 0.95), rise: pr.range(0.5, 1.6), wob: 0.12, seed: pr(), mode: 1 });
    }
    await ctx.yield();

    // the fleet running home before the wind, and the brig standing out against it: each rides the sea where she lies
    const ride = [];
    const afloat = (g, q, half, heel, slot) => {
      U.uVes.value[slot].set(q.x, q.z, Math.cos(q.yaw), Math.sin(q.yaw)); U.uVesS.value[slot].set(half[0], half[1], 4, 0);
      ride.push({ g, x: q.x, z: q.z, fx: Math.sin(q.yaw), fz: Math.cos(q.yaw), L: half[1] * 0.8, B: half[0] * 0.85, heel });
    };
    LUGGERS.forEach((q, i) => {
      const g = new THREE.Group(); g.position.set(q.x, 0, q.z); g.rotation.order = 'YXZ'; g.rotation.y = q.yaw; scene.add(g);
      const lM = new Mesher(), lL = new Liner(), lug = drawLugger(lM, lL, rng.fork ? rng.fork('lugger' + i) : rng, q.s, q.w);
      const m = new THREE.Mesh(lM.geometry(), solid), l = new THREE.Mesh(lL.geometry(), lines);
      m.frustumCulled = l.frustumCulled = false; l.renderOrder = 5; g.add(m, l); trash.push(m, l);
      afloat(g, q, lug.half, -0.05, i < 7 ? 3 + i : 12);
      mirror(g, lug.boxes[0], [0.03, 0.025, 0.022]); if (i === 0 || i === 2 || i === 7) mirror(g, lug.boxes[1], [0.5, 0.16, 0.06]);
    });
    await ctx.yield();
    const brG = new THREE.Group(); brG.position.set(BRIG.x, 0, BRIG.z); brG.rotation.order = 'YXZ'; brG.rotation.y = BRIG.yaw; scene.add(brG);
    const brM = new Mesher(), brL = new Liner(), brig = drawCoaster(brM, brL, BRIG.s, ['#EFE6CF', '#F3EBD6', '#E6D8B8', '#EFE3C8'].map((h) => new THREE.Color(h)), 1);
    const brMesh = new THREE.Mesh(brM.geometry(), solid), brLines = new THREE.Mesh(brL.geometry(), lines);
    brMesh.frustumCulled = brLines.frustumCulled = false; brLines.renderOrder = 5; brG.add(brMesh, brLines); trash.push(brMesh, brLines);
    afloat(brG, BRIG, [2.9 * BRIG.s, 10 * BRIG.s], -0.2, 2);
    mirror(brG, brig.boxes[0], [0.05, 0.04, 0.035]); mirror(brG, brig.boxes[1], [0.8, 0.72, 0.52]);
    await ctx.yield();
    // the steam packet in the eye of the squall: she rides the sea and buries her bows in it, her wheels thrashing, her smoke torn flat down the wind
    const PS = PACKET.s, pkG = new THREE.Group(); pkG.position.set(PACKET.x, 0, PACKET.z); pkG.rotation.order = 'YXZ'; pkG.rotation.y = PACKET.yaw; pkG.scale.setScalar(PS); scene.add(pkG);
    const pM = new Mesher(), pL = new Liner(), pW = new Mesher(), packet = drawTug(pM, pL, pW, pr.fork ? pr.fork('packet') : rng, PS);   // her dice are dealt from the smoke's, so the harbour's deal stands as it was before she came
    const pkMesh = new THREE.Mesh(pM.geometry(), solid), pkLines = new THREE.Mesh(pL.geometry(), lines), pkWheels = new THREE.Mesh(pW.geometry(), solid);
    pkMesh.frustumCulled = pkLines.frustumCulled = pkWheels.frustumCulled = false; pkLines.renderOrder = 5;
    pkWheels.position.set(packet.shaft[0], packet.shaft[1], packet.shaft[2]);
    pkG.add(pkMesh, pkLines, pkWheels); trash.push(pkMesh, pkLines, pkWheels);
    U.uVes.value[13].set(PACKET.x, PACKET.z, Math.cos(PACKET.yaw), Math.sin(PACKET.yaw)); U.uVesS.value[13].set(2.9 * PS, 13.4 * PS, 2, packet.wheelX * PS);
    ride.push({ g: pkG, x: PACKET.x, z: PACKET.z, fx: Math.sin(PACKET.yaw), fz: Math.cos(PACKET.yaw), L: 13.4 * PS * 0.8, B: 2.9 * PS * 0.85, heel: -0.03, pitch: 1.25, heave: 0.6 });
    const big = (bx) => ({ c: bx.c.map((v) => v * PS), h: bx.h.map((v) => v * PS) }), flat = { position: pkG.position, rotation: pkG.rotation };
    mirror(flat, big(packet.boxes[0]), [0.03, 0.022, 0.02]); mirror(flat, big(packet.boxes[1]), [0.025, 0.02, 0.02]);
    const fP = toWorld(flat, packet.funnel.map((v) => v * PS)), fNow = new THREE.Vector3();          // her funnel's lip at rest (the youngest smoke is carried from there to where the lip is just now)
    {
      const nP = Math.round(120 * detail), fw = [Math.sin(PACKET.yaw), Math.cos(PACKET.yaw)], pt = [Math.cos(PACKET.yaw), -Math.sin(PACKET.yaw)];
      for (let i = 0; i < nP; i++) puffs.push({ p0: [fP[0], fP[1] - 0.5, fP[2]], v: [WIND[0] * 112, 2, WIND[1] * 104], phase: (i + pr()) / nP, rate: 1 / 14, r0: 1.3, r1: pr.range(8, 14), rise: pr.range(7, 12), wob: pr.range(1.4, 3.2), seed: pr(), mode: 0.25 });
      for (const sd of [1, -1]) {                                           // the thrash of her wheels
        const wp = toWorld(flat, [sd * packet.wheelX * PS, 0.4, (packet.shaft[2] - 1.6) * PS]);
        for (let i = 0; i < 24; i++) { const k = pr.range(5, 11); puffs.push({ p0: [wp[0] + pr.range(-0.6, 0.6), wp[1], wp[2] + pr.range(-0.9, 0.9)], v: [-fw[0] * k + pt[0] * sd * 1.2, 0, -fw[1] * k + pt[1] * sd * 1.2], phase: (i + pr()) / 24, rate: pr.range(0.5, 0.9), r0: 0.3, r1: pr.range(0.8, 1.5), rise: pr.range(0.8, 2.4), wob: 0.2, seed: pr(), mode: 1 }); }
      }
      const bw = toWorld(flat, [0, 0.6, 12.2 * PS]);                         // the sea she buries her bows in: thrown up over them and blown aft
      for (let i = 0; i < 56; i++) { const sd = i % 2 ? 1 : -1, a = pr.range(3, 11), b = pr.range(0.5, 5.5); puffs.push({ p0: [bw[0] + pr.range(-1.2, 1.2), bw[1], bw[2] + pr.range(-1.2, 1.2)], v: [-fw[0] * a + pt[0] * sd * b + WIND[0] * 3, 0, -fw[1] * a + pt[1] * sd * b + WIND[1] * 3], phase: (i + pr()) / 56, rate: pr.range(0.36, 0.7), r0: 0.6, r1: pr.range(1.8, 4.0), rise: pr.range(3, 9), wob: 0.35, seed: pr(), mode: 1 }); }
    }
    const puffMesh = buildPuffs(U, puffs); scene.add(puffMesh); trash.push(puffMesh);
    await ctx.yield();

    // the harbour
    const hM = new Mesher(), hbL = new Liner(), lampM = new Mesher();
    const harbour = drawHarbour(hM, hbL, lampM, rng.fork ? rng.fork('harbour') : rng, HARBOUR);
    await ctx.yield();
    const lampMat = solidMaterial(U, { uGlow: { value: 1 } });
    const harbourMesh = new THREE.Mesh(hM.geometry(), solid), harbourLines = new THREE.Mesh(hbL.geometry(), lines), lampMesh = new THREE.Mesh(lampM.geometry(), lampMat);
    harbourMesh.frustumCulled = harbourLines.frustumCulled = lampMesh.frustumCulled = false; harbourLines.renderOrder = 5;
    scene.add(harbourMesh, harbourLines, lampMesh); trash.push(harbourMesh, harbourLines, lampMesh);
    const still = { position: { x: 0, z: 0 }, rotation: { y: 0 } };
    mirror(still, harbour.boxes[0], [0.36, 0.33, 0.33]); mirror(still, harbour.boxes[1], [0.62, 0.56, 0.46]); mirror(still, harbour.boxes[2], [0.3, 0.27, 0.33]); mirror(still, harbour.boxes[3], [0.66, 0.55, 0.36]);
    await ctx.yield();
    // vessels lying at the quays, and boats pulling about the mouth
    const cM = new Mesher(), cL = new Liner(), coaster = drawCoaster(cM, cL, 1), cGeo = cM.geometry(), cLGeo = cL.geometry();
    const boats = [];
    for (const [x, z, yaw, sc] of [[HARBOUR.quayL - 5.5, 728, 3 * DEG, 1.0], [HARBOUR.quayR + 6, 764, 181 * DEG, 1.15], [HARBOUR.quayL - 6, 884, -2 * DEG, 0.9]]) {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; g.scale.setScalar(sc);
      const m = new THREE.Mesh(cGeo, solid), l = new THREE.Mesh(cLGeo, lines); m.frustumCulled = l.frustumCulled = false; l.renderOrder = 5; g.add(m, l); scene.add(g);
      boats.push({ g, ph: x * 0.37 + z * 0.11, k: 0.6 });
      mirror(g, { c: coaster.boxes[0].c.map((v) => v * sc), h: coaster.boxes[0].h.map((v) => v * sc) }, [0.05, 0.04, 0.035]);
    }
    const kM = new Mesher(); drawSkiff(kM, 2); const kGeo = kM.geometry();
    for (const [x, z, yaw] of [[-61, 608, -70 * DEG], [-104, 672, 35 * DEG], [-100, 722, 160 * DEG], [-108, 772, -20 * DEG], [20, 96, 60 * DEG]]) {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; const m = new THREE.Mesh(kGeo, solid); m.frustumCulled = false; g.add(m); scene.add(g);
      boats.push({ g, ph: x * 0.53 + z * 0.29, k: 1.6, skiff: true });
    }
    trash.push({ geometry: cGeo }, { geometry: cLGeo }, { geometry: kGeo });
    // the trader at anchor: the largest thing in the harbour, and the sun is behind her canvas
    const trG = new THREE.Group(); trG.position.set(TRADER.x, 0, TRADER.z); trG.rotation.y = TRADER.yaw; scene.add(trG);
    const trM = new Mesher(), trL = new Liner(), trader = drawCoaster(trM, trL, 1.55, (rng.fork ? rng.fork('trader') : rng).pick([['#E9DCBE', '#EFE3C8', '#D39A52', '#B9562E'], ['#D39A52', '#B9562E', '#E9DCBE', '#D9A45E'], ['#DDB064', '#C0652F', '#D39A52', '#A84A2A']]).map((h) => new THREE.Color(h)));   // each deal dyes her canvas its own way
    const trMesh = new THREE.Mesh(trM.geometry(), solid), trLines = new THREE.Mesh(trL.geometry(), lines);
    trMesh.frustumCulled = trLines.frustumCulled = false; trLines.renderOrder = 5; trG.add(trMesh, trLines); trash.push(trMesh, trLines);
    U.uVes.value[10].set(TRADER.x, TRADER.z, Math.cos(TRADER.yaw), Math.sin(TRADER.yaw)); U.uVesS.value[10].set(4.3, 15.2, 3, 0);
    mirror(trG, trader.boxes[0], [0.05, 0.04, 0.035]); mirror(trG, trader.boxes[1], [0.8, 0.6, 0.32]);
    boats.push({ g: trG, ph: 2.3, k: 0.45 });
    await ctx.yield();

    // the bell buoy: it nods on the swell
    const bM = new Mesher(), buoy = drawBuoy(bM, null), buoyG = new THREE.Group(), buoyMesh = new THREE.Mesh(bM.geometry(), solid);
    buoyG.position.set(BUOY.x, 0, BUOY.z); buoyMesh.frustumCulled = false; buoyG.add(buoyMesh); scene.add(buoyG); trash.push(buoyMesh);
    mirror(buoyG, buoy.boxes[0], [0.3, 0.07, 0.05]);
    U.uVes.value[11].set(BUOY.x, BUOY.z, 1, 0); U.uVesS.value[11].set(1.45, 1.45, 3, 0);                     // the sea darkens under it and breaks white against it

    // the flight
    const pts = [[0, 5.0, 0], [2.5, 5.2, 45], [8, 5.6, 95], [14.5, 6.0, 140], [17.5, 6.2, 172], [15.5, 6.4, 200], [9, 6.5, 228], [1.5, 6.5, 252], [-3, 6.5, 272], [-5, 6.4, 296],
      [-4.4, 7.3, 325], [-3.4, 8.2, 360], [-3.0, 9.0, 395], [-5, 9.4, 430], [-10, 9.4, 462], [-20, 9.2, 500], [-37, 8.4, 540], [-58, 7.4, 578],
      [-78, 6.6, 612], [-88, 6.1, 646], [-90, 6.2, 690], [-90, 6.8, 740], [-90, 7.5, 800]];
    const path = makePath(pts);
    const uAt = (x, z) => path.nearestXZ(x, z).u;
    // gulls: about the old ship's mastheads, over the tug's wake, in the squall, about the lighthouse, over the water street. Each keeps a level ring of
    // its own; a ring that would come near the flown line is lifted nine metres over it.
    const gr = rng.fork ? rng.fork('gulls') : rng, gulls = [];
    const flock = (cx, cz, n, rMin, rMax, yMin, yMax, spread) => { for (let i = 0; i < n; i++) gulls.push({ c: [cx + gr.range(-spread, spread), gr.range(yMin, yMax), cz + gr.range(-spread, spread)], r: gr.range(rMin, rMax), speed: gr.range(7, 11) * (gr() < 0.5 ? 1 : -1), phase: gr.range(0, 6.283), flap: gr.range(7, 10), size: gr.range(0.75, 1.05) }); };
    flock(-12, 70, 4, 8, 16, 7, 15, 10); flock(SHIP.x, SHIP.z, 9, 14, 34, 22, 50, 12); flock(TUG.x - 4, TUG.z + 34, 7, 9, 22, 9, 20, 12); flock(BRIG.x - 8, BRIG.z + 10, 5, 10, 24, 14, 30, 10);
    flock(LUGGERS[2].x, LUGGERS[2].z, 5, 10, 24, 12, 28, 10); flock(HARBOUR.bastion[0], HARBOUR.bastion[1], 8, 8, 26, 16, 44, 6); flock(-90, 740, 8, 10, 28, 20, 36, 22); flock(PACKET.x - 6, PACKET.z + 16, 6, 10, 26, 18, 36, 10);
    for (const q of gulls) for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, n = path.nearestXZ(q.c[0] + Math.cos(a) * q.r, q.c[2] + Math.sin(a) * q.r); if (n.dist < 9) q.c[1] = Math.max(q.c[1], n.y + 9); }
    const gullMesh = buildGulls(U, gulls); scene.add(gullMesh); trash.push(gullMesh);
    const pois = [
      { at: [TUG.x, 6, TUG.z], from: uAt(1.5, 30), to: uAt(15, 146), weight: 0.35 },
      { at: [SHIP.x + 4, 20, SHIP.z - 8], from: uAt(16.5, 158), to: uAt(0, 257), weight: 0.45 },
      { at: [BRIG.x, 13, BRIG.z], from: uAt(-4.4, 296), to: uAt(-3.3, 366), weight: 0.42 },
      { at: [PACKET.x, 9, PACKET.z], from: uAt(-3.1, 374), to: uAt(-7.5, 448), weight: 0.45 },
      { at: [LUGGERS[4].x, 8, LUGGERS[4].z], from: uAt(-9, 458), to: uAt(-23, 506), weight: 0.3 },
    ];
    const size = new THREE.Vector2();
    return {
      scene, path, duration: 47, pois,
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 24, sway: 0.5, bank: 0.6 },
      portal: { shape: 'arch', width: 14, height: 15, frame: 0, color: '#FFE8B8', veil: '#FFE8B8', revealDistance: 170, drawWithin: 280 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0.3, radius: 0.6, threshold: 1.0 }, grade: { saturation: 1, contrast: 1, vignette: 0.18, grain: 0.02 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        U.uT.value = time;
        if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uRes.value.copy(size); }
        // the old ship barely stirs; the tug works
        shipG.rotation.z = Math.sin(time * 0.52) * 0.006; shipG.rotation.x = Math.sin(time * 0.37 + 1.1) * 0.003;
        tugG.rotation.z = Math.sin(time * 1.5) * 0.02; tugG.rotation.x = Math.sin(time * 1.9 + 0.6) * 0.016; tugG.position.y = Math.sin(time * 1.9) * 0.1;
        wheels.rotation.x = time * 2.3; pkWheels.rotation.x = time * 2.0;
        // every boat in the squall lifts and falls with the sea under her, bow and stern and beam ends
        for (const q of ride) {
          const h0 = swellAt(U, q.x, q.z, time), hb = swellAt(U, q.x + q.fx * q.L, q.z + q.fz * q.L, time), hs = swellAt(U, q.x - q.fx * q.L, q.z - q.fz * q.L, time);
          const hp = swellAt(U, q.x + q.fz * q.B, q.z - q.fx * q.B, time), hq = swellAt(U, q.x - q.fz * q.B, q.z + q.fx * q.B, time);
          q.g.position.y = h0 * (q.heave || 0.85) - 0.1; q.g.rotation.x = -Math.atan2(hb - hs, 2 * q.L) * (q.pitch || 0.8); q.g.rotation.z = Math.atan2(hp - hq, 2 * q.B) * 0.5 + q.heel;
        }
        fNow.set(packet.funnel[0], packet.funnel[1], packet.funnel[2]); pkG.updateMatrixWorld(); pkG.localToWorld(fNow); U.uFol.value.set(fNow.x - fP[0], fNow.y - fP[1], fNow.z - fP[2]);
        for (const b of boats) { b.g.position.y = (b.skiff ? swellAt(U, b.g.position.x, b.g.position.z, time) * 0.9 : 0) + Math.sin(time * 0.9 * b.k + b.ph) * 0.05; b.g.rotation.z = Math.sin(time * 0.7 * b.k + b.ph) * 0.012 * b.k; b.g.rotation.x = Math.sin(time * 0.53 * b.k + b.ph * 1.7) * 0.008 * b.k; }
        // the lighthouse's lamp comes round: a slow swell of light, never a flash
        lampMat.uniforms.uGlow.value = 0.55 + 0.9 * Math.pow(0.5 + 0.5 * Math.sin(time * 0.9), 3);
        buoyG.position.y = swellAt(U, BUOY.x, BUOY.z, time) * 0.9; buoyG.rotation.z = Math.sin(time * 1.3) * 0.09; buoyG.rotation.x = Math.sin(time * 1.05 + 1) * 0.07;
      },
      dispose() {
        for (const m of trash) m.geometry.dispose();
        solid.dispose(); lines.dispose(); puffMesh.material.dispose(); gullMesh.material.dispose(); lampMat.dispose(); sky.material.dispose(); sea.material.dispose(); U.uNoise.value.dispose();
      },
    };
  },
};
