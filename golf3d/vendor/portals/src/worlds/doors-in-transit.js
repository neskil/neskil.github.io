// Doors in Transit (film worlds crew C). Built on one idea only, in general words: a store without end where countless
// ordinary doors, each the way into a different room somewhere in the world, hang from moving rails and are carried by
// a works. Everything with a form is ours: a sunlit iron-and-glass shed (the joiner's part), oval rails (the plan's count) stepped back
// and up like the stands of a stadium, a winding tower of doors, a quiet brick bay; the carriers are the power-and-free
// overhead conveyors of paint shops (an I-beam rail, wheeled hangers, railway points). No figure, nothing lettered.
//
// DECLARED AT THE HEAD
// - SCALE: everything is about three and a half times life size (the plan's SCALE): a door is 8.6 m high.
// - THE FLOWN LINE (the part doors-in-transit-works-route.js, by the design's places): the canyon down x = 21 between
//   the lowest street and the tower; a left-hand half circle of 21 m past the bay; up the stand on the -x side; a
//   left-hand half circle of 40 m round the head of the hall; down toward the bay; a straight last leg of 60 m.
// - PLACED TO BE SEEN FROM THE WAY (typed here, true on every seed): the lowest street hangs 11 m to the right of the
//   first leg and the tower 9 m to its left; the bay stands on the hall's axis at the end of the last leg.
// - THE CLOCKS: the tiers above the lowest and the tower's two threads are closed loops on the world's clock. TIER 0 AND THE MARKED
//   DOOR RUN ON u (metres of route flown), one function for both, so that the marked door is beside the entry at the
//   start and in the bay at the end on every visit and no door ever overlaps another.
// - THE WAY OUT: portal.drawWithin 55: the engine draws the exit only when 55 m of route are left, by which place the
//   marked door has stopped in front of it and still stands shut: the opening is first drawn behind the shut leaf.
//   portal.revealDistance 55 (never over drawWithin): the next place comes on in the opening from that same metre
//   and is whole with 33 m left, while the leaf swings open. No light and no double of the ring is ours.
// - camera.nearThrough is not set. Nothing of the works stands in the tube behind the entry (9 m about the level
//   entry frame's axis, 30 m back). THE WORKS COUNT IT, AND THE CLEAR AIR OF THE WHOLE FLOWN LINE, ON EVERY BUILD
//   (doors-in-transit-works-air.js; kept as works.air and in scene.userData.count): the tower's doors come nearest
//   the tube's axis, 9.7 m from it; the lowest street hangs 11 m from it; the floor lies 8 m under it. Nearest the
//   flown line stand the tower's doors (7.9 m), the lowest street's doors (8.7 m) and its rail (9.1 m); no rod
//   stands within 12 m; over the last metre the spur's own beam, from which the marked door hangs, lies 5.1 m
//   above the line.
// - THE PACE: none of ours; the engine's even pace.
// - THE LOOKS (doors-in-transit-works-looks.js): every look opens and closes at a place of the world (metres along
//   the flown line from a named place, or the place where the bearing to its target passes a stated angle off the
//   bow), with fades in metres; every target is a point of the plan, a point of a street's rail at door height, or
//   the marked door. A look opens only where its target lies within 60 degrees of the bow and is let go before it
//   is abeam; no two looks add over 1; beside a long side the gaze leads along the hall. THE MIDDLE OF THE FLIGHT
//   NEVER RESTS ON THE PAVING: up the climb and round the head turn the gaze slides level along the third and the
//   top street (a chain of points on their rails, one after another), then holds the tower's middle until the
//   marked door's look takes over. No share of the flight is typed. Counted on every build (lookCount).
// - THE AIR is one thin haze for the whole hall; it does not change with where the lens is. FIVE SHAFTS OF SUN
//   stand in it and no more (doors-in-transit-works-shafts.js): four side by side through four panes of the sunny
//   end's great screen, slanting down the sun's own way to bright patches on the floor of the side the light falls
//   toward (none through the bay, none over the last leg), and one plumb down the tower from the lantern.
// - THE FAR STORE (doors-in-transit-works-far.js): beyond the opening in the -z end wall, behind the bay, rank behind
//   rank of straight rails stands across the hall's line, tier on tier, a street of doors gliding slowly across
//   under every rail, so that the doors seem without number. It is painted, not lit (no light of ours stands
//   beyond the wall), and it takes THE FAR AIR BY PLACE ALONE, by the plan's own law: none at the opening, wholly
//   air at the store's far end, far sides and top, where plain sheets of that colour close the view. Nothing of
//   it is cut, sized, hidden or faded by the lens, it is the same on every machine, and it does not take the
//   hall's haze. THE FAR AIR'S COLOUR (look.farAir, in the look handed to every part) follows the sun's end: a
//   bright warm haze with the sun at the -z end, a cooler, paler one with the sun at +z. Counted on every build
//   (scene.userData.count.far): its triangles, its draw calls (four), its doors.
// - THE LIGHT: the sky kit's rig (a hemisphere light and one sun, low behind the -z screen) with ONE shadow map, fixed
//   over the whole hall. Of the works, the rails, the rods, the tower's iron, the marked door and a plain box for
//   every hanging door throw the long shadows; of the shed, only the yard's standing things on the floor (stacks of
//   rail, racks, ladders, trolleys, bollards) throw one. WHICH OF THE SHED'S SURFACES TAKE A SHADOW AND WHICH THROW
//   ONE IS THE SHED'S OWN TO SET, and it does (its floor, its brick and its yard take them; its iron and its glass
//   do not): the world sets neither on anything of the shed.
// - THE RAILS HANG FROM THE ROOF'S RIBS by slender rods (the rails' own green) wherever a rail passes under a rib.
//   NO ROD STANDS WITHIN 12 m OF THE FLOWN LINE (the lens's run-in through the entry counted with it): where one
//   would, it hangs farther along its rib, up to 11 m off, and carries the beam by a level arm; where no place on
//   the rib is far enough, the rod is left out and the beam is doubled from the hanger before to the hanger after.
//   Counted on every build (works.rods): 84 rods hang, 15 of them on arms, 4 are left out (all on the lowest
//   street); the nearest stands 12.0 m from the line. Nothing slopes: no raking girder, no brace; nothing of the
//   stands rises from the floor. The doors travel in trains, with stretches of bare rail between.
// - THE WINDING TOWER (doors-in-transit-works-tower.js): a slim double screw of the plan's radius, its doors at all
//   bearings and no two of a turn level. Counted on every build (doors-in-transit-works-count.js, works.towerAir):
//   what moves keeps 0.59 m from what moves or stands with the other thread, and 0.30 m from all that stands.
// - THE LOOKS A SEED DEALS: ctx.vary.hour: any/day clear late morning; golden a lower deeper gold; dawn pale rose and
//   mist; night (there is none) a bright rainy day. ctx.vary.rare: loose petals stream from under the sill of one
//   high door's place (the top street's rail at the middle of its head curve) and drift down the hall's axis toward
//   the tower; the flight crosses over them at the top of the head turn. ctx.vary.density with ctx.quality.detail:
//   how long the top street's stretches of bare rail are.
//   By streams of the seed: the order and paints of the doors, each door's hour and life, which sills leak weather,
//   each street's trains, gaps and speed; the far store's trains, speeds, paints and posts.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import { MARKED, DOOR, TOWER, STRAIGHT, TIERS, tierRadius, tierRail } from '../parts/doors-in-transit-plan.js';
import { routePoints, routeTable, legEnds } from '../parts/doors-in-transit-works-route.js';
import { makeLooks, lookCount } from '../parts/doors-in-transit-works-looks.js';
import { makeDoorKinds } from '../parts/doors-in-transit-doors.js';
import { buildShed } from '../parts/doors-in-transit-shed.js';
import { buildWorks } from '../parts/doors-in-transit-works.js';
import { makeShafts } from '../parts/doors-in-transit-works-shafts.js';
import { buildFar } from '../parts/doors-in-transit-works-far.js';
import { farAirColour } from '../parts/doors-in-transit-works-far-air.js';

// what each hour of a visit is like (always day, always indoors; there is no night here: a bright rainy day instead)
const HOURS = {
  day: { preset: 'day', elevation: 30, azimuth: 20, light: '#fff0d6', intensity: 2.8, ambient: 1.3, fog: '#e9dcc6', haze: 0.0009, exposure: 1.0, shaft: '#ffe9c2', shaftGain: 0.7, leak: 1.9 },
  golden: { preset: 'goldenHour', elevation: 19, azimuth: 17, light: '#ffcf8a', intensity: 2.7, ambient: 1.1, fog: '#f0cf9e', haze: 0.0011, exposure: 1.0, shaft: '#ffd08a', shaftGain: 0.75, leak: 1.9 },
  dawn: { preset: 'dawn', elevation: 22, azimuth: 22, light: '#ffe1d8', intensity: 2.3, ambient: 1.15, fog: '#eedcd8', haze: 0.0016, exposure: 1.0, shaft: '#ffe3dc', shaftGain: 0.55, leak: 2.0 },
  night: { preset: 'overcast', elevation: 34, azimuth: 20, light: '#e6eef6', intensity: 1.5, ambient: 1.7, fog: '#d9dfe4', haze: 0.0013, exposure: 1.0, shaft: '#eef4fa', shaftGain: 0.2, leak: 2.5 },
};

export default {
  id: 'doors-in-transit',
  name: 'Doors in Transit',
  category: 'screen',
  placeKind: 'interior',
  screen: 'Monsters, Inc.',
  screenYear: '2001',
  screenKind: 'film',
  media: ['air', 'interior'],
  weirdness: 0.5,
  async build(ctx) {
    const mk = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    // every stream of the world, in one list, before any loop runs
    const rSky = mk('doors-sky'), rOrder = mk('doors-order'), rPaint = mk('doors-paint'), rHour = mk('doors-hours'),
      rTower = mk('doors-tower'), rWeather = mk('doors-weather'), rDust = mk('doors-dust'), rPetal = mk('doors-petals'),
      rShaft = mk('doors-shafts'), rLantern = mk('doors-lantern'), rMote = mk('doors-motes'),
      rFarTrains = mk('doors-far-trains'), rFarPaint = mk('doors-far-paint'), rFarPosts = mk('doors-far-posts'),      // the far store's own: its rails' trains and speeds, its doors' paints, its posts' places
      rTiers =Array.from({ length: TIERS }, (_, k) => mk('doors-tier-' + k));      // each tier's own stream: its trains, gaps, start and speed
    const rngFor = (name) => ctx.core.makeRng(ctx.core.hashSeed('doors:' + name + ':' + ctx.seed));
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1 };
    const detail = ctx.quality ? ctx.quality.detail : 1;
    const hourName = vary.hour === 'golden' || vary.hour === 'dawn' || vary.hour === 'night' ? vary.hour : 'day';
    const H = HOURS[hourName], rare = !!vary.rare, density = vary.density ?? 1;
    const scene = new THREE.Scene();

    // ------------------------------------------------------------ the flown line
    const path = makePath(routePoints(4));
    const table = routeTable(0.5), ends = legEnds(0.5);
    await ctx.yield();

    // ------------------------------------------------------------ the day outside, and its light
    const sky = makeSky({ rng: rSky, preset: H.preset, sunElevation: H.elevation, sunAzimuth: H.azimuth, lightColor: H.light });
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(new THREE.Color(H.fog), H.haze);
    // (the bright floor lights the undersides; ONE SHADOW MAP, fixed over the whole hall: the long shadows of rails,
    // doors, tower and the yard's standing things on the floor)
    const rig = makeLightRig(sky, { intensity: H.intensity / Math.max(0.01, sky.lightIntensity), ambient: H.ambient, bounce: 0.55, shadow: true, shadowSize: 2048, shadowRange: 176, follow: false });
    rig.sun.target.position.set(0, 30, 0); rig.sun.position.copy(rig.sun.target.position).addScaledVector(sky.lightDirection, 500);
    scene.add(rig.object);
    const sunDir = sky.lightDirection.clone();
    // THE LOOK HANDED TO EVERY PART. look.farAir: the colour of the far store's air (the rule is the far part's own,
    // doors-in-transit-works-far-air.js): with the sun at the -z end, a bright warm haze (the hall's haze of the
    // hour steeped in the colour of the sun's light); with the sun at the +z end, a cooler, paler one; between
    // the two by the sun's bearing alone.
    const look = { farAir: farAirColour(THREE, sunDir, H.fog, H.light) };
    await ctx.yield();

    // ------------------------------------------------------------ the shed (the joiner's) and the door kinds (the joiner's)
    const shed = await buildShed(ctx, { THREE, rngFor, sunDir, look });
    scene.add(shed.object);      // (the shed says itself which of its meshes take a shadow and which throw one: the world touches neither)
    await ctx.yield();
    const doors = await makeDoorKinds(ctx, { THREE, rngFor, look });
    await ctx.yield();

    // ------------------------------------------------------------ the works: rails, streams, the tower, the marked door
    const works = await buildWorks(ctx, { THREE, scene, doors, table, ends, sunDir, look, hourName, rare, density, detail, roofY: shed.roofY,
      streams: { order: rOrder, paint: rPaint, hours: rHour, tiers: rTiers, tower: rTower, weather: rWeather } });
    scene.add(works.object);
    for (const m of works.casters) m.castShadow = true;
    if (doors.leakUniforms && doors.leakUniforms.uLeakGain) doors.leakUniforms.uLeakGain.value = H.leak;      // the one knob for every leak under this bloom
    await ctx.yield();
    // ------------------------------------------------------------ the far store: what stands beyond the opening in the -z end wall
    const far = await buildFar(ctx, { THREE, look, streams: { trains: rFarTrains, paint: rFarPaint, posts: rFarPosts } });
    scene.add(far.object);
    await ctx.yield();
    // ------------------------------------------------------------ the air: slow dust, and five shafts of sun (four through the end screen, one down the tower)
    const timeU = { value: 0 };
    const dust = fx.makeParticles({ rng: rDust, preset: 'dust', time: timeU, count: Math.round(900 * detail), box: [60, 36, 60], size: [0.07, 0.16],
      colors: ['#fff3d8', '#ffe9c0', '#ffffff'], intensity: 0.4, minAngle: 0.007, twinkle: 0.15 });      // (a little everywhere, faint; the dust that shows is in the shafts. Soft motes three pixels wide at the least: never single bright pixels)
    scene.add(dust.object);
    const sunIn = [-sunDir.x, -sunDir.y, -sunDir.z];
    const shafts = makeShafts({ THREE, fx, look, rng: rShaft, rngLantern: rLantern, rngMotes: rMote, time: timeU, sunIn, color: H.shaft, gain: H.shaftGain, motes: 1500 * detail });
    scene.add(shafts.object);
    await ctx.yield();

    // THE RARE VISIT: loose petals stream from under the sill of ONE HIGH DOOR'S PLACE and drift down the hall (made
    // on every visit, drawn only on the rare one; the kit's own petals at the kit's own size). THE SOURCE is a named
    // place of the plan: the top street's rail at the middle of its head curve, on the hall's axis. The stream
    // begins two metres under a door's sill there and runs level down the axis toward the tower: a ribbon 18 m
    // wide and 2 m deep that ends 6 m short of the tower's rail. BY PLACE it lies in free air: 0.35 m over the
    // third street's beam where it crosses that street's head curve (no rod of any street stands so near the middle
    // of a head curve), more than 5 m short of the tower's doors and steps, and under the flown line, which crosses
    // it once, at the top of the head turn, 3.3 m and more over it (the law asks 2 m of clear air; a petal is 0.2 m
    // long). The least distance from the ribbon to the flown line is counted on every build
    // (scene.userData.count.petals).
    const top = TIERS - 1, sill = tierRail(top) - DOOR.drop, head = STRAIGHT + tierRadius(top), foot = TOWER.z + TOWER.radius + 6;
    const ribbon = [18, 2, head - foot], ribbonAt = [0, sill - 2 - ribbon[1] / 2, (head + foot) / 2];
    const petals = fx.makeParticles({ rng: rPetal, preset: 'petals', time: timeU, follow: false, box: ribbon, center: ribbonAt,
      count: Math.round(4400 * detail), velocity: [0, -0.2, -2.6], colors: ['#ff9fbe', '#ffc2d4', '#ff86ad'] });
    let petalAir = Infinity;
    for (const q of table.pts) petalAir = Math.min(petalAir, Math.hypot(Math.max(0, Math.abs(q[0] - ribbonAt[0]) - ribbon[0] / 2),
      Math.max(0, Math.abs(q[1] - ribbonAt[1]) - ribbon[1] / 2), Math.max(0, Math.abs(q[2] - ribbonAt[2]) - ribbon[2] / 2)));
    petals.setOpacity(rare ? 1 : 0); scene.add(petals.object);
    await ctx.yield();

    // ------------------------------------------------------------ THE LOOKS, each opened and closed at a place of the world
    // (doors-in-transit-works-looks.js: the places, the targets and the reasons; counted here against their rules)
    const looks = makeLooks({ table, ends, markedAt: works.markedAt });
    scene.userData.count = { air: works.air, tower: works.towerAir, rods: works.rods, looks: lookCount(looks, table, 1), petals: petalAir,
      far: { triangles: far.triangles, drawCalls: far.drawCalls, doors: far.doors } };
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path,
      duration: 50,
      camera: { fov: 60, near: 0.3, far: 1200, lookAhead: 22, bank: 0, sway: 0.4 },      // a level horizon: doors hang plumb
      pois: looks.pois,
      portal: { shape: 'arch', width: MARKED.w, height: MARKED.h, color: '#fff1d6', glow: 0.5, revealDistance: 55, drawWithin: 55 },
      post: { exposure: H.exposure, bloom: { strength: 0.2, radius: 0.5, threshold: 0.95 }, grade: { saturation: 1.08, contrast: 1.05, vignette: 0.26, grain: 0.02 } },
      update(dt, time, camera, u) {
        sky.update(dt, time, camera); rig.update(dt, time, camera);
        shed.update(dt, time, u); doors.update(dt, time);
        works.update(dt, time, u, camera); far.update(dt, time, u);
        timeU.value = time; dust.update(dt, time, camera); shafts.update(dt, time, camera); petals.update(dt, time, camera);
      },
      // every part that has a dispose of its own is asked (of the kit's, the sky has one today); the engine frees what hangs in the scene
      dispose() { for (const part of [sky, rig, dust, shafts, petals, works, far, doors, shed]) if (typeof part.dispose === 'function') part.dispose(); },
    };
  },
};
