// A HALL ROOFED WITH WEATHER
// A great limestone hall at night, nobody in it, one long bent table laid, a fire on the open floor; its only light
// is some fifteen hundred candle flames riding the hall's air in streams that gather at knots, and where the roof
// should be the weather is inside the room: a flat cloud base wall to wall, a front that crosses the hall sideways, a storm with
// sheet lightning in it and rain that never lands, and behind it a torn sky with the stars out.
//
// WHO BUILDS WHAT (design, section 9). This file and src/parts/hall-roofed-with-weather-air*.js are the AIR: the
// route, the looks, the pace, the ring, the post; the night sky; all cloud, rain and lightning; the candles; the
// hearth's sparks and smoke; the interior kit's light rig and its eight lights. The stone hall and all that stands in
// it is src/parts/hall-roofed-with-weather-hall.js (another builder's), which takes the rig made here.
//
// THE ROUTE, BY THE DESIGN'S PLACES (metres; the hall runs along -z from its low end wall at z 20 to its high end wall
// at z -150; one right-hand way round throughout): in under the cloud at ENTRY, level, down the left side; abeam the
// hearth one whole right-hand circle of 22 m round the fire's column, sinking from 31 to 12; low and straight over
// the table's second bend at about 8.5 (the flown curve dips to 8.25 before the climb); up into the rain to 24; a
// right-hand half circle of 12 m before the great window, rising to 30; home down the middle under the torn sky;
// then a straight last leg of 60 m climbing at 25 degrees through the hearth's sparks to the ring in the cloud's
// face over the low end.
// BEHIND THE ENTRY (the plan's ENTRY: x -21.5, y 33, z -12, heading -z): the low end wall stands 32 m back (z 20); the
// gallery's front 24 m back, its rail (y 15.5) 17.5 m under the entry's axis; the -x wall's bare face 11.5 m to the
// side (its piers' capitals, 1.8 m proud, 9.7 m); the cloud's base 13 m over it (its pouches and scud are a medium).
// The mist that stands along the low end wall's head is a medium too: two of its layers stand 28.9 and 30 m back and
// cross the tube's top between y 35 and 42, the nearer at most a third opaque there, the other at most about a half.
// No body stands in the 9 m tube of the last 30 m (the candles are dealt clear of it, by the plan's ENTRY).
//
// THE LOOKS, in the order flown (each opens and closes at a place of the world, in metres; no two that are on together
// add to more than 1): ON THE WAY IN, one look of full weight: its target slides along the table's own line, at the
// table's top, in step with the flight at one even rate, from the table's line abeam of the entry (the first bend,
// almost under us) to a hearth's width beyond the fire where the fire stands abeam: we come in looking down at the
// laid table and the gaze runs up it to the fire, abeam of us at the entry and ever further ahead of abeam after it;
// THE FIRE (the middle of its flames) for the circle's first eighth; THE ROOF'S RIM from there to the circle's third
// quarter: the gaze lifts from the fire to where the cloud meets the walls a third of a turn ahead of us and leads
// us round the room: the +x wall, the low end with its screen and gallery, the -x wall; THE INCOMING SHELF as we
// come round to face it; THE TABLE as we sink to it; THE LIT STORM over the low pass; THE GREAT WINDOW from afar on
// the climb, let go as the turn begins; INTO THE TURN and down the hall's length to THE RING.
//
// THE RING is the engine's own. It hangs in the hollow over the low end, 26 to 45 m above the circle round the fire,
// and a far opening that high under a cloud reads as a moon's disc, which the design forbids: so the engine leaves it
// undrawn (portal.drawWithin, the metres of route still to fly) through the circle and the low pass. It is first
// drawn at the foot of the climb, where it stands astern (the route heads -z up the hall there, the ring hangs
// toward +z), and it has opened whole (over the engine's own opening stretch) while still astern; the turn at the
// high end then brings the bow round to it for the whole way home and the last leg. Nothing in the world is lit by
// the ring and nothing doubles it: the hollow in the cloud is the cloud's own form, lit by the fire under it.
//
// THE PACE: the flight is a fifth slower from the entry to the end of the circle round the fire (eased over 36 m
// there), so that the way in, the fire and the laid table can be read; and slower by 0.18 in the half circle at the
// high end, between its first and last knots (eased over 24 m at each): the route's tightest turn.
//
// NOTHING HERE IS PLACED, SHOWN, HIDDEN OR LIT BY THE LENS, the frame, a seed's number or the wall clock. Scripted
// weather goes by u (the plan's makeStorm, its timetable found here from places of the route); billow, flicker, the
// candles' round and the sheet lightning's patches go by the world's clock.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as INT from '../kit/interior.js';
import { makeSky } from '../kit/sky.js';
import { HALL, HEARTH, TABLE, tableX, WINDOWS, windowZ, GREAT_WINDOW, ENTRY, EXIT, makeStorm } from '../parts/hall-roofed-with-weather-plan.js';
import { buildHall } from '../parts/hall-roofed-with-weather-hall.js';
import { buildAir } from '../parts/hall-roofed-with-weather-air.js';

const TAU = Math.PI * 2, CLIMB = 25 * Math.PI / 180, LAST = 60, RING = 7;      // the last leg's climb and length; the ring's radius (metres)
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// The circle round the fire as laid: its point at the share t of its one turn (0: abeam of the fire, on its -x side;
// 1: the circle's end). A right-hand turn round the hearth's column, 22 m out (20 at its end), sinking from 31 to 12.
const circleAt = (t) => { const a = t * TAU, r = 22 - 2 * sstep(0.7, 1, t); return [HEARTH.x - r * Math.cos(a), 31 - 19 * (t * 0.94 + 0.06 * t * t), HEARTH.z - r * Math.sin(a)]; };
// The route's points, laid from the design's places. The last leg is laid back from EXIT down its own straight line,
// with one more point on that line before its foot, so that the whole 60 m are straight on the curve as flown.
function layRoute() {
  const P = [];
  // from the plan's ENTRY, level, then one easy line to the circle's first point (the join lies midway between them
  // in plan, 0.6 m under the entry's height)
  const first = circleAt(0);
  P.push([ENTRY.x, ENTRY.y, ENTRY.z], [ENTRY.x, ENTRY.y, ENTRY.z - 9], [(ENTRY.x + first[0]) / 2, ENTRY.y - 0.6, (ENTRY.z - 9 + first[2]) / 2]);
  // one whole right-hand circle round the fire's column, sinking 31 -> 12, 22 m out (20 at its end)
  const N = 12;
  for (let i = 0; i <= N; i++) P.push(circleAt(i / N));
  // low over the table's second bend, then up into the rain
  P.push([-18.2, 10.2, -58], [-16.5, 8.5, -70], [-16.5, 8.5, -82], [-16.5, 8.5, -94], [-17.4, 11.6, -104], [-19.2, 18, -115]);
  // the turn at the high end: a right-hand half circle of 12 m about (-8, -124), rising 24 -> 30
  for (let i = 0; i <= 6; i++) { const t = i / 6, a = t * Math.PI; P.push([-8 - 12 * Math.cos(a), 24 + 6 * t, -124 - 12 * Math.sin(a)]); }
  // home under the torn sky, rising gently, then the bend up onto the last leg's line
  const foot = [EXIT.x, EXIT.y - LAST * Math.sin(CLIMB), EXIT.z - LAST * Math.cos(CLIMB)];
  const back = (d) => [EXIT.x, EXIT.y - d * Math.sin(CLIMB), EXIT.z - d * Math.cos(CLIMB)];
  P.push([3.4, 30, -108], [1.6, 29.95, -92], [0.4, 29.85, -78], [0, 29.8, -69.5]);
  P.push(back(LAST + 2.5), foot, back(40), back(20), [EXIT.x, EXIT.y, EXIT.z]);
  return P;
}
export default {
  id: 'hall-roofed-with-weather',
  name: 'A Hall Roofed with Weather',
  category: 'screen',
  placeKind: 'interior',
  screen: "Harry Potter and the Philosopher's Stone",
  screenYear: '2001',
  screenKind: 'film',
  media: ['air', 'interior'],
  weirdness: 0.4,
  async build(ctx) {
    // ---- every random stream of the world, one named stream per kind of thing, all made here
    const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    const S = {
      round: stream('round'), tracks: stream('tracks'), candles: stream('candles'), kinds: stream('kinds'), drips: stream('drips'),
      pads: stream('pads'), puffs: stream('puffs'), rain: stream('rain'), bolts: stream('bolts'), crawlers: stream('crawlers'), sparks: stream('sparks'),
      smoke: stream('smoke'), sky: stream('sky'), lights: stream('lights'),
    };
    const rngFor = (name) => ctx.core.makeRng(ctx.core.hashSeed('hall:' + name + ':' + ctx.seed));
    // ---- what the visit deals: the hour (always night, always flame-lit: the hour only tints that night: here the sky
    // in the gap and the post's tint; in the cloud's file the cloud's body, its haze and the silver on its torn
    // margins; and the hall reads the same hour for its glass), the rare great crawler, the count of candles, and the
    // machine's detail
    const vary = ctx.vary || {}, hour = ({ dawn: 'dawn', golden: 'golden', day: 'day' })[vary.hour] || 'night';
    const dealt = { hour, rare: !!vary.rare, density: Math.min(1.3, Math.max(0.7, vary.density || 1)), detail: (ctx.quality && ctx.quality.detail) || 1 };
    const scene = new THREE.Scene();
    const path = makePath(layRoute()), LEN = path.length;
    await ctx.yield();
    // ---- PLACES ON THE ROUTE (shares of the way, each found from a place of the design in metres)
    const pv = new THREE.Vector3();
    const line = new Float32Array(1601 * 3);
    for (let i = 0; i <= 1600; i++) { path.pointAt(i / 1600, pv); line[i * 3] = pv.x; line[i * 3 + 1] = pv.y; line[i * 3 + 2] = pv.z; if (i % 400 === 399) await ctx.yield(); }
    const uOf = (x, y, z) => { let best = 1e9, bu = 0; for (let i = 0; i <= 1600; i++) { const d = (line[i * 3] - x) ** 2 + (line[i * 3 + 1] - y) ** 2 + (line[i * 3 + 2] - z) ** 2; if (d < best) { best = d; bu = i / 1600; } } return bu; };
    // the table's own places, from the plan: its second bend (its -x extreme under the low pass), and its line a
    // hearth's width beyond the fire
    const zBend = HEARTH.z - TABLE.wave / 2, zPast = HEARTH.z - HEARTH.across;
    const U = {
      abeam: uOf(...circleAt(0)), eighth: uOf(...circleAt(1 / 8)), half: uOf(...circleAt(1 / 2)), threeQ: uOf(...circleAt(3 / 4)), sunk: uOf(...circleAt(1)),
      bend: uOf(-16.5, 8.5, zBend), low1: uOf(-16.5, 8.5, -94), climbed: uOf(-20, 24, -124), turned: uOf(4, 30, -124),
    };
    const m = (metres) => metres / LEN;                       // metres along the route, as a share of the flight
    await ctx.yield();
    // ---- THE WEATHER'S TIMETABLE, by places of the route (the plan's makeStorm): the front reaches the -x wall as we come
    // round the far side of the fire; it has crossed the floor where the low pass ends; it slows over the turn at the
    // high end. Both parts take it from here.
    const weather = makeStorm({ meets: U.half, crossed: U.low1, slowFrom: U.climbed, slowTo: U.turned });
    // ---- the air of the room: a dusk-violet haze, so that the far end sits back and nothing crushes to black
    const HAZE = new THREE.Color('#1d1729');
    scene.background = new THREE.Color('#05060c');
    scene.fog = new THREE.FogExp2(HAZE, 0.0034);

    // ---- the night sky above the cloud (seen only through the torn gap): stars and a pale band, no disc
    const SKYLOOK = {
      night: { zenith: '#040a1c', mid: '#0b1a3c', horizon: '#1a2f5c', stars: 1.25, milkyWay: 1.25 },
      dawn: { zenith: '#16203c', mid: '#3a3a5c', horizon: '#8a6470', stars: 0.5, milkyWay: 0.35 },
      golden: { zenith: '#070b20', mid: '#141a3e', horizon: '#3a2440', stars: 1.1, milkyWay: 1.0 },
      day: { zenith: '#0a1430', mid: '#1a2c58', horizon: '#34508a', stars: 0.95, milkyWay: 1.0 },
    }[dealt.hour];
    const sky = makeSky({ rng: S.sky, preset: 'night', bodies: [], clouds: false, clouds2: false, bake: true, renderer: ctx.renderer,
      zenith: SKYLOOK.zenith, mid: SKYLOOK.mid, horizon: SKYLOOK.horizon, stars: SKYLOOK.stars, milkyWay: SKYLOOK.milkyWay, twinkle: 0.6, milkyAngle: 40 });
    scene.add(sky.object);
    await ctx.yield();

    // ---- THE LIGHT RIG (the interior kit's; made first and handed to the hall): no sun and no window row; a dusk
    // fill, a grey-violet from above (the cloud) and from below (never blue: no stone edge reads as blue trim); EIGHT
    // LIGHTS, never more or fewer: three straw-gold ones that go round high in the room with the leading candle
    // stream, three that stand low along the low stream (over the table's bend, where the route flies lowest), one
    // flickering one on the hearth's own axis, over the logs, and one cold one that goes with the storm's lightning.
    const rig = INT.makeLightRig({ scale: 1, sunIntensity: 0, ambient: 3.0, ambientSky: '#5c586f', ambientGround: '#3b3844', aoRadius: 7, aoStrength: 0.6, envBoost: 1.2 });
    rig.setBounds([HALL.x0, 0, HALL.zHigh], [HALL.x1, HALL.wallTop + 30, HALL.zLow], 0);
    const high = [], low = [];
    for (let i = 0; i < 3; i++) high.push(rig.addLight({ position: [0, 25, -20 - 50 * i], color: '#ffd9a6', intensity: 0, range: 80, flicker: 0.1 }));
    for (let i = 0; i < 3; i++) low.push(rig.addLight({ position: [-16.5, 7.8, -50 - 25 * i], color: '#ffd29a', intensity: 0, range: 46, flicker: 0.16 }));
    rig.addLight({ position: [HEARTH.x, HEARTH.flameTop * 0.7, HEARTH.z], color: '#ffa860', intensity: 9, range: 52, flicker: 0.5 });
    const cold = rig.addLight({ position: [0, 41, -60], color: '#bcc6ff', intensity: 0, range: 95, flicker: 0 });
    // the sixteen thickest parts of the candle streams, for the hall's floor (the air fills it every frame):
    // rig.gold.value[i] = Vector4(x, y, z in metres, strength 0..1)
    rig.gold = { value: Array.from({ length: 16 }, () => new THREE.Vector4(0, 24, -60, 0)) };
    await ctx.yield();

    // ---- THE HALL (another builder's part): walls, windows, floor, table, hearth; it takes this rig
    const hall = await buildHall(ctx, { THREE, INT, rig, rngFor, weather });
    scene.add(hall.object);
    await ctx.yield();

    // ---- THE AIR: the candles on their tracks, the cloud that is the roof, the storm, the hearth's sparks and smoke
    const air = await buildAir(ctx, { path, S, dealt, weather, haze: HAZE, fogDensity: scene.fog.density, gold: rig.gold, leg: { length: LAST, ring: RING },
      ground: hall.object, lights: { high, low, cold } });
    scene.add(air.object);
    await ctx.yield();
    // ---- THE LOOKS. Each opens and closes at a place of the world: a named place of the route, or metres along the
    // route before or after one (the entry is one). Where one look gives way to the next, the one eases out over the
    // same EASE metres the other eases in, so two looks that are on together never add to more than the greater of
    // their weights (none over 1). Every target is worked out from u inside the look's own function, from the plan's
    // places. A look turned along the angle (arc) turns the gaze by its weight's share of the bearing to its target:
    // little while the target is ahead, most when it is abeam. Round the fire the gaze is on the fire for the
    // circle's first eighth only; then it is up on the roof's rim, leading us round the room, to the third quarter.
    const EASE = 12;
    const look = (at, from, to, weight, more) => ({ at, from, to, weight, fade: Math.min(0.5, m(EASE) / (to - from)), ...more });
    const here = new THREE.Vector3(), aim = new THREE.Vector3();
    const POUCH = HALL.cloudBase - 4;                         // (the plan: the cloud's pouches hang to about 42)
    const farWall = [HALL.x1, (WINDOWS.sill + WINDOWS.head) / 2, windowZ(WINDOWS.perSide - 1)];   // the +x wall's window next the high end corner: its middle
    const pois = [
      // THE WAY IN, one look of full weight, alone until it hands over. Its target slides along the table's centre line
      // (the plan's tableX, at the table's top) in step with the flight, at one even rate: it starts on the table's
      // line abeam of ENTRY (the table's first bend, almost under us) and reaches a hearth's width beyond the fire
      // where the fire stands abeam; so it is abeam of us at the entry and ever further ahead of abeam after it. On
      // from before the entry (the engine itself eases every look in at a flight's start); it gives way over the EASE
      // metres after the place abeam of the fire.
      look((time, u) => { const z = ENTRY.z + (zPast - ENTRY.z) * Math.min(1, Math.max(0, u / U.abeam)); return aim.set(tableX(z), TABLE.top, z); },
        -m(2 * EASE), U.abeam + m(EASE), 1, { arc: true }),
      // THE FIRE, for the circle's first eighth: the middle of its flames over the hearth's middle (the plan's flame
      // top, halved). It takes the gaze over those same EASE metres, from where the fire stands abeam, and gives way
      // over the EASE metres after the circle's first eighth, where the gaze lifts to the roof.
      look(() => aim.set(HEARTH.x, HEARTH.flameTop / 2, HEARTH.z), U.abeam, U.eighth + m(EASE), 0.7, { arc: true }),
      // THE ROOF'S RIM, from the circle's first eighth to its third quarter: where the cloud's base meets the walls,
      // ahead of us and to the right, the side the circle turns to. Its target rides an oval on the cloud's base about
      // the hearth's column (the oval that touches the +x wall's face, the low end wall's face and the -x wall's
      // face), a third of a turn ahead of us: the gaze lifts from the fire and leads us round the room: the +x wall,
      // the low end with its screen and gallery, the -x wall, where the shelf comes through and the next look takes
      // the gaze over.
      look((time, u) => {
        path.pointAt(u, here);
        const a = Math.atan2(HEARTH.z - here.z, HEARTH.x - here.x) + TAU / 3;
        return aim.set(HEARTH.x - HALL.x1 * Math.cos(a), HALL.cloudBase, HEARTH.z - (HALL.zLow - HEARTH.z) * Math.sin(a));
      }, U.eighth, U.threeQ + m(EASE), 0.65, { arc: true }),
      // THE INCOMING SHELF, from the circle's third quarter to its end: its rolled lip where the plan puts it, over the hearth's line
      look((time, u) => aim.set(Math.max(HALL.x0, Math.min(HEARTH.x + HEARTH.across / 2, weather.front(u))), POUCH, HEARTH.z), U.threeQ, U.sunk + m(EASE), 0.42),
      // THE TABLE, from the circle's end (we turn down the hall and sink to it) to its second bend under the low pass:
      // its own line a third of its wave ahead of us, at its top
      look((time, u) => { path.pointAt(u, here); const z = here.z - TABLE.wave / 3; return aim.set(tableX(z), TABLE.top, z); }, U.sunk, U.bend + m(EASE), 0.4),
      // THE LIT STORM, from the table's second bend to the foot of the climb: the middle of the band, a bay and a half ahead under the cloud
      look((time, u) => { path.pointAt(u, here); const x = Math.max(HALL.x0 / 2, Math.min(HALL.x1 / 2, (weather.front(u) + weather.back(u)) / 2)); return aim.set(x, POUCH, here.z - 1.5 * WINDOWS.bay); }, U.bend, U.low1 + m(EASE), 0.42),
      // THE GREAT WINDOW from afar, up the climb: from the climb's foot (it stands whole above the bow there) to the
      // turn's first knot, closed as the turn begins
      look(() => aim.set((GREAT_WINDOW.x0 + GREAT_WINDOW.x1) / 2, (GREAT_WINDOW.sill + GREAT_WINDOW.head) / 2, HALL.zHigh), U.low1, U.climbed, 0.5),
      // INTO THE TURN, THEN THE RING: whole at the turn's first knot (it eases in over the climb's last EASE metres), it
      // leads the gaze into the turn: first to the far long wall's window next the corner, then, sliding by the turn's
      // own progress, down the hall's length to the ring, which it holds to the end
      look((time, u) => { const k = sstep(U.climbed, U.turned, u); return aim.set(farWall[0] + (EXIT.x - farWall[0]) * k, farWall[1] + (EXIT.y - farWall[1]) * k, farWall[2] + (EXIT.z - farWall[2]) * k); },
        U.climbed - m(EASE), 1 + m(EASE), 0.6, { arc: true }),
    ];
    // ---- THE PACE: a fifth slower from the entry to the circle's end (eased there over three times EASE metres), and
    // slower in the turn at the high end (between its first and last knots, eased over EASE metres each side of each)
    const pace = (u) => 1 - 0.2 * (1 - sstep(U.sunk - m(2 * EASE), U.sunk + m(EASE), u))
      - 0.18 * sstep(U.climbed - m(EASE), U.climbed + m(EASE), u) * (1 - sstep(U.turned - m(EASE), U.turned + m(EASE), u));

    // ---- THE RING: first drawn by the engine at the foot of the climb (the low pass's end), where it stands behind
    // us: the metres of route still to fly there. The next world's picture comes on in it from the same place.
    const WITHIN = Math.round((1 - U.low1) * LEN);

    await sky.prewarm(ctx.renderer, null, scene);
    const tint = { night: '#fff4ea', dawn: '#fff0ee', golden: '#fff1e2', day: '#f6f4ff' }[dealt.hour];
    return {
      scene, path, duration: Math.round(LEN / 9),
      camera: { fov: 60, near: 0.3, far: 1200, lookAhead: 14, sway: 0.5, bank: 0.3 },
      pois, pace,
      portal: { shape: 'circle', radius: RING, tilt: true, color: '#e9eef6', glow: 0.55, revealDistance: WITHIN, drawWithin: WITHIN },
      post: { exposure: 1.05, bloom: { strength: 0.5, radius: 0.7, threshold: 1.0 },
        grade: { saturation: 1.1, contrast: 1.05, tint, shadowTint: '#0e0b1c', vignette: 0.36, grain: 0.028, aberration: 0 } },
      update(dt, time, camera, u) {
        sky.update(dt, time, camera);
        air.update(dt, time, camera, u);                     // (it moves the rig's lights: they are live)
        rig.update(time, null);
        hall.setLightning(air.flash.k, air.flash.x);
        hall.update(dt, time, u);
      },
      dispose() { sky.dispose(); air.dispose(); hall.dispose(); },
    };
  },
};
