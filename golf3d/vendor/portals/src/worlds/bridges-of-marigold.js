// BRIDGES OF MARIGOLD
// A city of the dead at night, nobody in view: towers of houses stacked on houses out of a dark misty gulf, every
// window lit, and across the gulf to its gate and between its towers three broad bridges made of nothing but deep,
// glowing orange marigold petals, which crumble at their edges into streams of drifting petals.
//
// WHO BUILDS WHAT (design, section 8). This file and src/parts/bridges-of-marigold-air*.js are the AIR: the route,
// the looks, the ring and the post; the sky, the far hills, the water and the mist; the three petal bridges; the
// petals adrift; the lamps, the flags, the trams; the fireworks and the moths; and the world's four lights. The city
// (towers, feet, gate house, terraces, cranes) is src/parts/bridges-of-marigold-city*.js, another builder's part,
// which adds no light. The plan's numbers are src/parts/bridges-of-marigold-plan.js, the designer's.
//
// THE FLIGHT, by places (the plan's ROUTE handed whole to the kit's makePath: about 641 m in 50 s, one way round,
// the great tower on the right hand):
//   1. ON THE GREAT BRIDGE. In at the plan's ENTRY heading north, 10 m over the petals a little before the bridge's
//      crown; then down the bridge's far slope toward the gate house, 6 m over the petals at the lowest.
//   2. OFF THE BRIDGE. 60 m before the gate the route bears left, into the canyon on the great tower's south-west.
//   3. ROUND THE GREAT TOWER, CLIMBING. Up the west side, where the west tram comes by on the left at our own
//      height; round the north side under the canyon bridge (its bed 19 m over us where we cross under it, and
//      never nearer than 15 m); up the east side.
//   4. OUT, heading south: over ring tower 7's roof terrace and along the high bridge, 6.5 m and more over its
//      petals, straight for the last 120 m to the ring on the bridge's crown.
// BEHIND THE ENTRY stands the great bridge itself, running back 120 m and down into the mist (its bed goes 14 m
// further, under the mist), with the water and the mist under it and petals adrift over it; and far off, the far
// city's towers (while the bridge runs, their walls and cranes 55 m and more to either side of its line; their
// axes 300 m and more from the great tower's) with the slow fireworks of every visit high over them. Nothing
// else of this world's.
// The level line that runs 60 m back from the entry lies over the bridge's middle: the petals' tops (at or
// under the plan's deck) are 10.3 m under that line at the entry, 12 m under it from 11 m back, 16 m from 28 m
// back and 26 m at 60 m back. Every lamp, flag, cable and tram stands in the canyon or between the ring towers,
// 98 m and more north of the entry (the far city's own strings and flag lines hang between far towers).
// ONE MEETING IS KEYED TO THE ROUTE (the design's "tram gliding by at our own height", which a clock alone would
// let a visit miss): THE WEST TRAM's place on its cable, from ring tower 3 to ring tower 2, goes by how far we
// have flown: a fifth of the way along it at the place where the route leaves the great bridge (60 m before the
// gate), four fifths at the place abeam of ring tower 3, eased between; it stands still before and after. So it
// comes on toward us up the canyon and goes by on our left, 36 m off, some 20 m of route after the place abeam of
// ring tower 2. Everything else that moves goes by the world's clock.
// THE RING'S FIRST DRAWING: portal.drawWithin and portal.revealDistance are ONE number, worked out in build() (no
// typed metres): the metres of route still to fly at the place abeam of the gap between ring towers 4 and 5, where
// the ring's place stands behind the great tower; it comes out past the tower's east flank some 18 m of route later.
// NOTHING IS PLACED, SHOWN, HIDDEN OR LIT BY THE LENS, THE FRAME, A SEED'S NUMBER OR THE WALL CLOCK. By the eye's
// true distance only: the bridges' petals thin beyond 28 m, the canyon bridge's beyond 62 m (those kept grow, so
// the bed stays covered); the cuts
// in the paper flags and the far towers' windows give way to their mean where a pixel covers more than they do;
// a point of light (lamp, candle, star, moth) and a cord never fall under a few pixels; the mist and the drifting
// petals, which are a medium, thin within 2.5 m of the lens.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { ROUTE, EXIT, PORTAL_RADIUS, TOWERS, GATE, GREAT_BRIDGE, HIGH_BRIDGE, CANYON_BRIDGE, towerRadius, canyonBridge, ring, spiral, greatDeck } from '../parts/bridges-of-marigold-plan.js';
import { buildCity } from '../parts/bridges-of-marigold-city.js';
import { buildAir, HOURS } from '../parts/bridges-of-marigold-air.js';
import { HILLS_RADIUS } from '../parts/bridges-of-marigold-air-hills.js';

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export default {
  id: 'bridges-of-marigold',
  name: 'Bridges of Marigold',
  category: 'screen',
  placeKind: 'city',
  screen: 'Coco',
  screenYear: '2017',
  screenKind: 'film',
  media: ['air'],
  weirdness: 0.6,
  async build(ctx) {
    // ---- every random stream of the world, one named stream per kind of thing, all made here
    const rngFor = (name) => ctx.core.makeRng(ctx.core.hashSeed('marigold:' + name + ':' + ctx.seed));
    const fieldFor = (name) => ctx.core.makeNoise(ctx.core.hashSeed('marigold:' + name + ':' + ctx.seed));     // a seeded noise field
    const S = {
      sky: rngFor('air-sky'), candles: rngFor('air-candles'), bed: rngFor('air-bed'), rings: rngFor('air-rings'), shed: rngFor('air-shed'),
      adrift: rngFor('air-adrift'), stream: rngFor('air-stream'), lines: rngFor('air-lines'), lamps: rngFor('air-lamps'), flags: rngFor('air-flags'), far: rngFor('air-far'),
      moths: rngFor('air-moths'), fireworks: rngFor('air-fireworks'), heaps: fieldFor('air-heaps'), crest: fieldFor('air-crest'),
    };
    // ---- what the visit deals (design, section 7): always night; the hour tints it; the rare look is fireworks; the
    // density is the count of lamps, flags and lit windows; the machine's detail thins what is plentiful
    const vary = ctx.vary || {}, hour = ({ dawn: 'dawn', golden: 'golden', day: 'day' })[vary.hour] || 'night', H = HOURS[hour];
    const look = {
      hour, sky: new THREE.Color(H.fillSky), glow: new THREE.Color('#ff8a1c'),
      density: Math.min(1.3, Math.max(0.7, vary.density || 1)), detail: (ctx.quality && ctx.quality.detail) || 1, fireworks: !!vary.rare,
    };
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(H.fog);
    scene.fog = new THREE.FogExp2(new THREE.Color(H.fog), 0.0013);
    const path = makePath(ROUTE), LEN = path.length;
    await ctx.yield();
    // ---- PLACES ON THE ROUTE (shares of the way, each found from a place of the plan in metres)
    const pv = new THREE.Vector3(), line = new Float32Array(1601 * 3);
    for (let i = 0; i <= 1600; i++) { path.pointAt(i / 1600, pv); line[i * 3] = pv.x; line[i * 3 + 1] = pv.y; line[i * 3 + 2] = pv.z; if (i % 400 === 399) await ctx.yield(); }
    const uOf = (x, y, z) => { let best = 1e9, bu = 0; for (let i = 0; i <= 1600; i++) { const d = (line[i * 3] - x) ** 2 + (line[i * 3 + 1] - y) ** 2 + (line[i * 3 + 2] - z) ** 2; if (d < best) { best = d; bu = i / 1600; } } return bu; };
    const m = (metres) => metres / LEN;                       // metres along the route, as a share of the flight
    const overBridge = (z) => uOf(GREAT_BRIDGE.x, greatDeck(z) + 7, z);          // the route's place over the great bridge at this z
    const onWinding = (b) => uOf(...spiral(b));                                  // the winding's place at this bearing of the plan
    const U = {
      down: overBridge(GATE.z1 + 90),                         // 90 m before the gate: we are sinking along the bridge's far slope
      leave: overBridge(GATE.z1 + 60),                        // 60 m before the gate: the route bears left off the bridge
      t2: onWinding(TOWERS[2].b), t3: onWinding(TOWERS[3].b), // abeam of ring towers 2 and 3, on the west side
      under: onWinding(CANYON_BRIDGE.b),                      // under the canyon bridge, on the north side
      gap: onWinding((TOWERS[4].b + TOWERS[5].b) / 2),        // abeam of the gap between ring towers 4 and 5
      t5: onWinding(TOWERS[5].b),                             // abeam of ring tower 5, on the east side
    };
    // THE WEST TRAM'S PLACE ON ITS CABLE, by the route flown (see the head): a fifth of the way along it where we
    // leave the bridge, four fifths where ring tower 3 stands abeam, eased between
    const westShare = (u) => 0.2 + 0.6 * sstep(U.leave, U.t3, u);
    await ctx.yield();

    // ---- THE WORLD'S FOUR LIGHTS, never more or fewer: a fill from the night sky above and the bridges' gold from
    // below; one low key from the side of the sky's wash; and two gold lamps that stand in the two bridges the city's
    // stone is nearest to: over the great bridge's last stretch before the gate, and at the high bridge's root over
    // tower 7's roof terrace. They stand still and never change.
    const fill = new THREE.HemisphereLight(new THREE.Color(H.fillSky), new THREE.Color(H.fillGround), H.fill);
    const key = new THREE.DirectionalLight(new THREE.Color(H.key), H.keyI);
    { const a = H.keyAz * Math.PI / 180; key.position.set(Math.sin(a) * 300, 150, -Math.cos(a) * 300); }
    const gateGlow = new THREE.PointLight(look.glow, 420, 260, 1.4);
    gateGlow.position.set(GREAT_BRIDGE.x, greatDeck(GATE.z1 + 22) + 7, GATE.z1 + 22);
    const roofGlow = new THREE.PointLight(look.glow, 260, 200, 1.4);
    roofGlow.position.set(HIGH_BRIDGE.x, HIGH_BRIDGE.y0 + 8, HIGH_BRIDGE.z0 + 8);
    scene.add(fill, key, gateGlow, roofGlow);

    // ---- THE CITY (another builder's part)
    const city = await buildCity(ctx, { THREE, rngFor, look });
    scene.add(city.object);
    await ctx.yield();

    // ---- THE AIR
    const air = await buildAir(ctx, { THREE, S, look, path, westShare });
    scene.add(air.object);
    await ctx.yield();

    // ---- THE LOOKS. Each opens and closes at a place of the world: a named place of the route, or metres along the
    // route before or after one. Where one look gives way straight to the next, the place named is where the one
    // has closed and the other is whole: the next opens EASE metres before it, and eases in over the same metres
    // the first eases out, so two looks that are on together never add to more than the greater of their weights
    // (none over 1). Between the third and the fourth the gaze goes back to the way ahead. Every target is a place
    // of the plan (or the west tram where it is then), worked out inside the look's own function. Each is let go
    // before its target stands abeam.
    const EASE = 15;
    const gaze = (at, from, to, weight, ease = EASE) => ({ at, from, to, weight, fade: Math.min(0.5, m(ease) / (to - from)) });
    const aim = new THREE.Vector3(), T0 = TOWERS[0], T5 = TOWERS[5], T6 = TOWERS[6];
    // the great tower's south face, over the gate, at a share of the height of its houses
    const face = (share) => { const y = T0.base + (T0.top - T0.base) * share; return aim.set(T0.x, y, T0.z + towerRadius(0, y)); };
    const pois = [
      // 1. THE GATE AND THE TOWER AHEAD, from the bridge: the great tower's face over the gate, two fifths of the
      // way up its houses. It lifts the gaze a little, so that the picture holds the bridge below and the city over
      // it. On from before the entry (the engine itself eases every look in at a flight's start) to the place 90 m
      // before the gate.
      gaze(() => face(0.4), -m(2 * EASE), U.down + m(EASE), 0.5),
      // 2. UP THE GREAT TOWER'S FACE, as we near it: a place higher on the same face, from 90 m before the gate; let
      // go 20 m after the route has left the bridge, as the face goes off to the right.
      gaze(() => face(0.62), U.down, U.leave + m(20), 0.42),
      // 3. THE WEST TRAM, the car itself where it then hangs: from the canyon's mouth, where it comes on toward us
      // ahead, until the route is abeam of ring tower 2, where the car is going off to the left (this look eases
      // in and out over twice the EASE metres: the car goes by fast at the last).
      gaze((time, u) => air.trams.carAt(0, time, u, aim), U.leave + m(20 - EASE), U.t2, 0.45, 2 * EASE),
      // 4. THE CANYON BRIDGE, as we come to pass under it: its glowing underside over the place where the route
      // crosses under (the plan's bridge at the winding's own radius there), from 10 m after the place abeam of ring
      // tower 2 (it comes out from behind the great tower's flank about there) to 20 m before the crossing, where it
      // stands steep overhead.
      gaze(() => {
        const sp = spiral(CANYON_BRIDGE.b), s = (Math.hypot(sp[0], sp[2]) - CANYON_BRIDGE.r0) / (CANYON_BRIDGE.r1 - CANYON_BRIDGE.r0), c = canyonBridge(s);
        return aim.set(c[0], c[1] - 3, c[2]);
      }, U.t2 + m(10), U.under - m(20), 0.5),
      // 5. THE FAR SIDE'S VIEW OUT: the far hills' face seen through the gap between ring towers 5 and 6, where the
      // canyon opens: from 20 m before the canyon bridge (the gap is ahead there) to 40 m after it (it goes off left).
      gaze(() => { const q = ring((T5.b + T6.b) / 2, HILLS_RADIUS); return aim.set(q[0], T0.base + 20, q[1]); }, U.under - m(20 + EASE), U.under + m(40), 0.4),
      // 6. THE SCAFFOLDS AT THE TOP: the crown of ring tower 6, which stands ahead and over us as we climb the east
      // side: from 40 m after the canyon bridge to 18 m after the place abeam of ring tower 5. (The great tower's own
      // cranes stand abeam and high over us all the way round, and over the picture's top from the bridge: no look
      // can be given to them that is let go before abeam.)
      gaze(() => aim.set(T6.x, T6.top + T6.crown / 2, T6.z), U.under + m(40 - EASE), U.t5 + m(18), 0.4),
      // 7. THE RING: from 18 m after the place abeam of ring tower 5, where it has come out from behind the great
      // tower, to the end.
      gaze(() => aim.set(EXIT.x, EXIT.y, EXIT.z), U.t5 + m(18 - EASE), 1 + m(EASE), 0.6),
    ];
    // ---- THE RING: first drawn by the engine where the route is abeam of the gap between ring towers 4 and 5 (the
    // metres of route still to fly there). It stands behind the great tower there, and comes out from behind the
    // tower's east flank some 18 m of route later; the next world's picture comes on in it from the same place.
    const WITHIN = Math.round((1 - U.gap) * LEN);
    await air.prewarm(ctx.renderer, scene);
    return {
      scene, path, duration: 50,
      camera: { fov: 60, near: 0.3, far: 3400, lookAhead: 22, sway: 0.6, bank: 0.5 },
      pois,
      portal: { shape: 'circle', radius: PORTAL_RADIUS, color: '#ffd9a0', glow: 0.5, revealDistance: WITHIN, drawWithin: WITHIN },
      post: { exposure: H.exposure, bloom: { strength: 0.5, radius: 0.7, threshold: 0.95 },
        grade: { saturation: 1.12, contrast: 1, tint: H.tint, shadowTint: H.shadow, vignette: 0.3, grain: 0.026, aberration: 0 } },
      update(dt, time, camera, u) {
        air.update(dt, time, camera, u);
        city.update(dt, time, u);
      },
      dispose() { air.dispose(); city.dispose(); },
    };
  },
};
