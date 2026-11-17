// THE CITY THAT LEFT: at dusk a whole brick-and-steel river town is lifting out of its valley on a lens of its own
// bedrock, lights on. We come in low up the emptied riverbed, pass under the dripping keel above the hole it left,
// climb round the cut rim, fly its avenue at roof height and leave from the crown of its tallest tower.
//
// THE LIFT IS BUILT UPSIDE DOWN: the city stands still in world space and the LAND (one group) sinks under it,
// landY(u) = 150 (1 - u), a pure function of the journey. The picture is the same as a rising city, the gateway can
// sit on the tower, and the camera never threads a moving roof.
//
// WHAT IS PACED TO THE FLIGHT (and nothing else is): the town's rise. The land's height follows the share of the
// route flown, evenly, with no hold; and what answers the rise is read each frame from how far the town has risen
// (`risen`, from the land's height): the lake in the hole, the water left in the cut river and mains, the evening
// coming on (darker, more windows lit, more stars), and in the rare visit that has it the second town beyond the
// ridge, leaving as ours is. Three meetings the design names are keyed to the flight at places found on the route,
// with the kit's own crossing and pacing flocks (parts/-life.js): geese across the route at the watchers' fence,
// crows lifting where the route comes out under the west lip, pigeons keeping pace from street level to the tower.
// Everything else is a bystander on the world clock, periodic, from drawn starts: trams, the stranded subway
// trains, falling stones, wheeling flocks, the other cities climbing, smoke, flags, everything that swings.
//
// MAP OF THIS FILE
//   1. the visit      what the seed decides: the hour (parts/-sky.js HOURS), the season, how many cities are in the sky,
//                     which birds, the rare second town beyond the east ridge
//   2. build(ctx)     shared light (parts/-common.js) -> kit materials -> the hero (parts/the-city-that-left.js: keel,
//                     roots, hanging things, falls, field; parts/-town.js: streets, tower, mill) -> the land
//                     (parts/-land.js) -> the sky (parts/-sky.js) -> life (parts/-life.js) -> lights -> pois
//   3. update()       the clock (time): everything ambient. The journey (u): the land's height; from that height,
//                     how far the town has risen, and from that the lake, the falls, the lit windows, the stars.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import * as KS from '../kit/structures.js';
import * as flora from '../kit/flora.js';
import { HERO, RIM, STREET, LIP, LAND0, LIFT, GLOW_DIR, landY, toGrid, fromGrid, AVE0, TOWER, makeShared, makeKeelShape, makeForks, makeRouteProbe, routePoints } from '../parts/the-city-that-left-common.js';
import { buildHero } from '../parts/the-city-that-left.js';
import { buildLand } from '../parts/the-city-that-left-land.js';
import { buildSky, HOURS } from '../parts/the-city-that-left-sky.js';
import { buildLife } from '../parts/the-city-that-left-life.js';
import { buildLandProps, FENCE_Z } from '../parts/the-city-that-left-landprops.js';

const DUR = 50;

export default {
  id: 'the-city-that-left',
  name: 'The City That Left',
  category: 'books',
  placeKind: 'city',
  book: 'Cities in Flight',
  author: 'James Blish, 1921 to 1975',
  weirdness: 0.6,
  async build(ctx) {
    // every stream of the generator the world draws from, taken here, once, in one fixed list (parts/-common.js, FORKS)
    const F = makeForks(ctx);
    // the world clock of the visit starts some way into its ten minutes (drawn), so that nothing our shaders run on
    // the clock (rings in the grass and in the field, lamps that flicker, water, smoke) begins at the same pose twice
    const clock0 = F.clock.range(0, 600);
    // ---------------------------------------------------------------- 1. the visit
    // one draw deals one look, by shares
    const vr = F.visit, deal = (x, shares) => { let sum = 0; for (const [name, share] of shares) { sum += share; if (x < sum) return name; } return shares[shares.length - 1][0]; };
    const hourKey = deal(vr(), [['apricot', 2 / 5], ['rain', 1 / 5], ['deep', 1 / 5], ['shelf', 1 / 5]]), hour = HOURS[hourKey];
    const season = deal(vr(), [['stubble', 1 / 2], ['snow', 1 / 4], ['blossom', 1 / 4]]);
    const skyCities = vr.int(9, 24), second = vr.chance(1 / 8);
    const birds = deal(vr(), [['pigeons', 3 / 5], ['gulls', 1 / 5], ['starlings', 1 / 5]]);
    const scene = new THREE.Scene();
    const S = makeShared(), SU = S.uniforms;
    SU.uBand.value.set(hour.band).multiplyScalar(hour.bandGain * 1.1); SU.uRose.value.set(hour.rose).multiplyScalar(hour.roseGain * 1.1);
    SU.uSunCol.value.set(hour.key).multiplyScalar(0.5 * hour.keyGain); SU.uFogGlow.value.set(hour.fogGlow);
    SU.uWet.value = hour.wet; SU.uSnow.value = season === 'snow' ? 1 : 0;
    scene.fog = new THREE.FogExp2(new THREE.Color('#2A3042'), 0.0009);
    scene.background = new THREE.Color('#0C0F17');
    await ctx.yield();

    // ---------------------------------------------------------------- 2. the town in the air
    const mats = KS.makeMaterials({ night: 0.7, lit: 0.5, glow: 3, streetY: HERO.y + STREET, streetGlow: 0.14, warm: '#FFCB7E', cool: '#C9DAF2', glass: '#101820' });
    mats.setSky({ top: '#0C0F17', horizon: '#3A3B4A', sun: hour.band, sunDir: [GLOW_DIR[0], 0.1, GLOW_DIR[1]] });
    await ctx.yield();
    // The rock of the keel is as the visit's noise made it; it is the ROAD that gives way. Under the keel every point
    // of the road takes its height from the rock over it, less one margin (routePoints in -common.js); the road so
    // laid is then tested every 3 m: the rock within 12 m of it in plan must nowhere be less than 14 m overhead.
    const shape = makeKeelShape(ctx.noise);
    const rockOverhead = (route) => {
      const q = new THREE.Vector3(); let least = 1e9;
      for (let s = 0; s <= route.length; s += 3) {
        route.posAtDist(s, q);
        const lx = q.x - HERO.x, lz = q.z - HERO.z;
        if (q.y > HERO.y + STREET || Math.hypot(lx, lz) > RIM + 12) continue;
        for (let dx = -12; dx <= 12; dx += 4) for (let dz = -12; dz <= 12; dz += 4) {
          if (dx * dx + dz * dz > 144 || Math.hypot(lx + dx, lz + dz) > RIM - 3) continue;
          least = Math.min(least, shape.under(lx + dx, lz + dz) - (q.y - HERO.y));
        }
      }
      return least;
    };
    // If the test fails (the rock dips between two points of the road), the whole row under the keel is taken 3 m
    // lower and tested again, and so on down to 21 m.
    // (one candidate road is two steps of the build: laying it out, then testing the rock over it)
    const tryRoute = async (lower) => { const pr = makeRouteProbe(3, routePoints(shape, lower)); await ctx.yield(); const ok = rockOverhead(pr.route) >= 14; await ctx.yield(); return ok ? pr : null; };
    let probe = null, lower = 0;
    for (; lower <= 21 && !probe; lower += 3) probe = await tryRoute(lower);
    lower -= 3;
    if (!probe) { probe = makeRouteProbe(3, routePoints(shape, lower)); await ctx.yield(); }
    const path = probe.route;
    // one leaf material for every tree, on the town and on the land
    await flora.prepareLeafTexture({}, ctx.yield);
    const floraMat = flora.windMaterial({ wind: flora.makeWind({ direction: [0.5, -0.85], strength: 0.75 }), backlight: 0.5 });
    await ctx.yield();
    const hero = await buildHero(ctx, { shared: S, mats, shape, floraMat, forks: F, probe });
    hero.object.position.set(HERO.x, HERO.y, HERO.z);
    scene.add(hero.object);
    await ctx.yield();

    // ---------------------------------------------------------------- the land it leaves
    const land = await buildLand(ctx, S, shape, { season });
    land.group.position.y = landY(0);
    scene.add(land.group);
    await ctx.yield();
    const props = await buildLandProps(ctx, S, { land, hero, path, season, floraMat, forks: F });
    land.group.add(props.object);
    await ctx.yield();

    // ---------------------------------------------------------------- the sky
    const sky = buildSky(ctx, S, { hour: hourKey, cities: skyCities, second, forks: F });
    scene.add(sky.object);
    await ctx.yield();

    // ---------------------------------------------------------------- lights (for the kit's lit materials; ours carry the shared light)
    const key = new THREE.DirectionalLight(new THREE.Color(hour.key), 0.85 * hour.keyGain);
    key.position.set(GLOW_DIR[0], 0.14, GLOW_DIR[1]).multiplyScalar(900); scene.add(key);
    scene.add(new THREE.HemisphereLight(new THREE.Color('#465678'), new THREE.Color('#1A1620'), 1.7));
    await ctx.yield();

    // The places of the journey, found on the route itself, in metres along it: where it passes the watchers' fence,
    // goes in under the rim, comes out under the west lip, is level with the streets, crosses in over the rim, and
    // crosses the river in the town. Every window below is written in metres from these places.
    // Two more for the gaze: where the route is nearest the keel's centre in plan (keelNear), and where it has
    // climbed above the town's tallest roofs (crown: 100 m over the streets, the most the town is built to).
    const LEN = path.length, place = { fence: 0, under: 0, keelNear: 0, out: 0, top: 0, over: 0, river: 0, crown: 0 };
    {
      const p = new THREE.Vector3(); let stage = 0, least = 1e9;
      for (let s = 0; s <= LEN; s += 0.5) {
        path.posAtDist(s, p);
        const r = Math.hypot(p.x - HERO.x, p.z - HERO.z), g = toGrid(p.x - HERO.x, p.z - HERO.z);
        if (!place.fence && p.z < FENCE_Z) place.fence = s;
        if (stage === 1 && r < least) { least = r; place.keelNear = s; }
        if (stage === 0 && r < RIM) { place.under = s; stage = 1; }
        else if (stage === 1 && r > RIM) { place.out = s; stage = 2; }
        else if (stage === 2 && p.y > HERO.y + STREET) { place.top = s; stage = 3; }
        else if (stage === 3 && r < RIM) { place.over = s; stage = 4; }
        else if (stage === 4 && g[0] > 0) { place.river = s; stage = 5; }
        else if (stage === 5 && p.y > HERO.y + STREET + 100) { place.crown = s; stage = 6; }
      }
      if (!place.crown) place.crown = LEN;
    }
    const ramp = (d, at, w) => smoothstep(at - w, at + w, d), between = (d, a, b, w) => ramp(d, a, w) * (1 - ramp(d, b, w));
    // slower under the keel (from the rim going over us to the west lip), quicker on the climbing turn outside the
    // rim, slower again once we are in over the rim and on the avenue; each change eases over 80 m about its place
    const pace = (u) => { const d = u * LEN; return 1 - 0.15 * between(d, place.under, place.out, 40) + 0.15 * between(d, place.out, place.over, 40) - 0.15 * ramp(d, place.over, 40); };
    // A pull of the gaze between two places. One pull at a time: each eases in over its first EASE metres and out over
    // its last EASE metres, and the next begins exactly EASE metres before the one before it ends, so across a
    // hand-over the two together are never more than the larger of them. No weight is over 0.8, so the route's own
    // line never keeps less than a fifth of the gaze; over the last metres to the portal (the engine's own easing
    // out of every pull) it has all of it.
    // (what the pulls look at: the town whole, the keel's belly, the west lip, where the avenue's line meets the west rim, where the avenue crosses the river, the roofs round the tower's foot)
    const aveEnd = fromGrid(-236, 0), EASE = 60, lipAt = [-RIM * Math.cos(25 * Math.PI / 180), -RIM * Math.sin(25 * Math.PI / 180)];
    const gaze = (at, a, b, weight) => ({ at, from: a / LEN, to: b / LEN, weight, fade: clamp(EASE / Math.max(b - a, 1), 0.05, 0.5) });
    const life = await buildLife(ctx, S, { scene, path, duration: DUR, hero, land, birds, forks: F, at: { fence: place.fence / LEN, out: place.out / LEN, top: place.top / LEN, past: (LEN + 60) / LEN } });
    scene.add(life.object);
    await ctx.yield();
    await sky.sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: DUR, pace,
      camera: { fov: 62, near: 0.5, far: 5200, lookAhead: 26, sway: 0.8, bank: 0.8 },
      pois: [
        // the town whole, from the entry to the watchers' fence
        gaze([HERO.x, HERO.y + STREET + 25, HERO.z], 0, place.fence, 0.6),
        // the keel and its roots, from the fence until the route is as near the keel's centre as it comes
        gaze([HERO.x, HERO.y + 42, HERO.z], place.fence - EASE, place.keelNear, 0.4),
        // the west lip and what hangs from it, 25 degrees round to the north of where the route passes under it (the
        // side the turn goes round), against the afterglow: from there until the rim pull has taken over
        gaze([HERO.x + lipAt[0], HERO.y + LIP - 6, HERO.z + lipAt[1]], place.keelNear - EASE, place.out + EASE, 0.5),
        // round the cut rim to the houses where the avenue ends at its edge: from where no rock is overhead any more
        // until we are level with the streets
        gaze([HERO.x + aveEnd[0], HERO.y + STREET + 14, HERO.z + aveEnd[1]], place.out, place.top, 0.8),
        // the lit town, from level with its streets until we are in over the rim
        gaze([HERO.x + AVE0[0], HERO.y + STREET + 12, HERO.z + AVE0[1]], place.top - EASE, place.over, 0.8),
        // the tower's shaft over the roofs round it, from the rim to the portal (the engine itself lets every pull go
        // over the last 7 per cent of the route, so the run into the gate is the route's own); the crown itself needs
        // no pull (the avenue runs straight at it)
        gaze([HERO.x + TOWER.x, HERO.y + STREET + 70, HERO.z + TOWER.z], place.over - EASE, LEN, 0.6),
      ],
      // the gate opens from where the eye comes in over the rim: from there the avenue runs straight at the tower
      portal: { shape: 'circle', radius: 6.8, color: '#FFE2B0', glow: 1, revealDistance: LEN - place.over, style: 'ring' },
      post: { exposure: 1.2, bloom: { strength: 0.45, radius: 0.6, threshold: 0.9 },
        grade: { saturation: 0.9, contrast: 1.05, shadowTint: '#07090F', vignette: 0.3, grain: 0.02 } },
      update(dt, time, camera, u) {
        SU.uTime.value = time + clock0;
        // the one thing paced to the flight: the land's height (the town's rise, seen from the town)
        const ly = landY(u);
        SU.uLandY.value = ly; land.group.position.y = ly;
        // how far the town has risen, read back from that height: 0 on the ground, 1 at the full 150 m
        const risen = clamp((LAND0 - ly) / LIFT, 0, 1);
        land.update(dt, time, camera, risen); props.update(dt, time, camera);
        hero.update(dt, time, camera, risen);
        sky.update(dt, time, camera, risen);
        life.update(dt, time, camera, u);
        // the evening comes on as it rises: the land darker, more windows lit
        mats.setNight(lerp(0.7, 0.95, risen)); mats.uniforms.uLit.value = lerp(0.5, 0.8, risen);
      },
      dispose() { sky.dispose(); },
    };
  },
};
