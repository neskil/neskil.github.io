// OLD LIGHT ARRIVING. Dusk on the great river of a made world whose far side is a still thread of pearl light going over the top of the sky.
// A PLACE THAT STANDS: a lamp-hung river under a terraced town on a river bend's neck, the river's broad basin behind the town's hill,
// and in the basin a great open bowl full of small lights, hushed, turned to a new star that stands low in the sky beyond the town.
// We fly up the river in the town's hill's own shade from that star, over the hill's low crest beside its high head, and out across
// the starlit basin (silver water, a second set of shadows) to the bowl. Nothing is born, grows, fades or falls still as we fly.
//
// THE STAR STANDS (the common part's STAR_K): one strength for the whole flight. Where it is seen and where its light falls is the
// land's affair: the high head of the town's ridge stands on the star's bearing from the river (the shade law in the common part:
// townLit for what the build bakes and olaTownLit for what is lit each frame, one law, which the build asks against itself).
// THE HUSH IS A STATE OF THE PLACE: the bowl's seated crowd has no time term at all; a held globe is a steady light (the one flame
// law gives it no gutter, only a breath of six parts in a hundred, the same all flight); the basin's boats lie rafted;
// no airship goes anywhere (one lies at its mast on the high head, the others hang at rest far off). THE PLACE'S OWN LIFE GOES ON, ON
// THE WORLD'S CLOCK, whether or not anyone comes: the fleet under way up the lower river, the wind, lamps, smoke, the down; the
// white birds of the reed island (they rise in flights, wheel over the reeds and settle, again and again); the fliers (each keeps
// its own round: it wheels aloft, comes down to the landing lawn, stands, goes up again; none over the bowl).
// NOTHING FOLLOWS THE FLIGHT but the camera's own road and gaze: update() reads the clock and the camera, never the flight's share
// or the road's length, and no uniform is fed from them.
// NO WINDOW IS TYPED IN u: the places the gaze turns at are found on the route in metres.
//
// The layout is typed unmirrored (flight -Z, +X right); a mirrored evening turns the world group, the route and the sky left for right.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, setLights, ARCH_AT } from '../parts/old-light-arriving.js';
import { makeLightUniforms, makeLampMap, townLitTwin, STAR_K, QUAY_Z, CREST_Z, BOWL, bowlLA, bowlXZ, STAR_AZ, STAR_DIR, DEG } from '../parts/old-light-arriving-common.js';
import { makeLand, makeWater, makePlain, makeMist } from '../parts/old-light-arriving-land.js';
import { makeClear, BACK, makeCountry, finishCountry } from '../parts/old-light-arriving-country.js';
import { makeAir } from '../parts/old-light-arriving-air.js';
import { makeBirds, makeDown, downBlock, DOWN_PER_M2 } from '../parts/old-light-arriving-wild.js';

const DUR = 46;
const FOV = 62;      // the lens, degrees (the camera's, and what the seed-down's block is sized by)
const REEDS = [-60, -150];      // the reed island, on the map
// The route, as the brief gives it: level up the river, a climb over the garden terraces to the saddle, then one slant down the bowl's axis
// (which is the star's bearing) over the basin, the near lip and the pool to the stage, the last 60 m straight and level into the arch.
const PTS = [[0, 9, 0], [0, 9, -130], [4, 12, -230], [12, 26, -300], [24, 60, -365], [40, 88, -430], [58, 92, -500], [78, 80, -580], [98, 64, -660], [132, 36, -796], [151.5, 19.5, -874], [166, 19.5, -932]];

export default {
  id: 'old-light-arriving',
  name: 'Old Light Arriving',
  category: 'books',
  placeKind: 'alien',
  book: 'Look to Windward',
  author: 'Iain M. Banks, 1954 to 2013',
  weirdness: 0.55,
  async build(ctx) {
    const { rng } = ctx, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    // ---- every seeded stream, one for each kind of thing, taken here in one fixed list before anything is built
    const S = {};
    for (const name of ['hour', 'weather', 'season', 'layout', 'stars', 'mottle', 'clouds', 'meteors', 'range', 'plain', 'boats', 'houses', 'trees', 'people', 'crowd', 'floats', 'masts', 'ships', 'fliers', 'tethers', 'quay', 'gulls', 'down', 'reeds', 'fires', 'hung', 'hill', 'yards', 'berths', 'smoke', 'aboard', 'crest', 'grove', 'walk', 'landings']) S[name] = rng.fork(name);
    // ---- the evening, dealt by shares
    // the hour: twenty minutes after sundown 5/8, two hours into night 3/8 (a viewer who asks for night gets the later hour)
    const late = vary.hour === 'night' ? true : S.hour() < 3 / 8;
    // the weather: clear 1/2, river mist 1/4, high cloud 1/4
    const weather = (() => { const r = S.weather(); return r < 1 / 2 ? 'clear' : r < 3 / 4 ? 'mist' : 'cloud'; })();
    // the season: late summer 3/4, first snow 1/4
    const snow = S.season() < 1 / 4;
    // the layout: mirrored left for right 1/2; the bowl two-thirds or wholly full 1/2 each; two or three airships 1/2 each; the fleet from a thin
    // procession to a regatta (an even draw)
    const MX = S.layout() < 1 / 2 ? -1 : 1, full = S.layout() < 1 / 2 ? 2 / 3 : 1, ships = S.layout() < 1 / 2 ? 2 : 3, fleet = S.layout.range(0.55, 1);
    const rare = !!vary.rare;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#05081a');
    scene.fog = new THREE.FogExp2(new THREE.Color('#222E54'), 0.00042);      // (between the brief's fog and the haze it says lifts the far plain)
    const root = new THREE.Group(); root.scale.x = MX; scene.add(root);
    const path = makePath(PTS.map((p) => [p[0] * MX, p[1], p[2]])), LEN = path.length;
    // ---- places on the route, in metres flown (found by walking it; nothing is typed)
    const RP = (() => { const P = new THREE.Vector3(), o = { quay: -1, saddle: -1, lip: -1, poolFar: -1 };
      for (let m = 0; m <= LEN; m += 0.5) { path.posAtDist(m, P); const x = P.x * MX, la = bowlLA(x, P.z), r = Math.hypot(la[0], la[1]);
        if (o.quay < 0 && P.z < QUAY_Z) o.quay = m; if (o.saddle < 0 && P.z < CREST_Z) o.saddle = m;
        if (o.lip < 0 && r < BOWL.rim) o.lip = m; if (o.poolFar < 0 && o.lip >= 0 && la[1] > BOWL.pool) o.poolFar = m; }
      return o; })();
    await ctx.yield();

    // ---- four lights for the whole flight, never switched. Our own shaders read them from LU; the kit's materials from these four objects.
    const LU = makeLightUniforms(), WU = { uLate: { value: late ? 1 : 0 } }, LAMP_UNDER = new THREE.Color(0.16, 0.07, 0.015);
    LU.uMX.value = MX; LU.uSnow.value = snow ? 1 : 0; LU.uFogCol.value = scene.fog.color; LU.uFogDen.value = scene.fog.density;
    const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, Math.PI), dGlow = new THREE.DirectionalLight(0xffffff, Math.PI), dBand = new THREE.DirectionalLight(0xffffff, Math.PI), dStar = new THREE.DirectionalLight(0xffffff, Math.PI);
    scene.add(hemi, dGlow, dGlow.target, dBand, dBand.target, dStar, dStar.target);
    const aim = (light, dir) => light.position.set(dir.x * MX, dir.y, dir.z).multiplyScalar(1000);
    setLights(LU, STAR_K, late); aim(dGlow, LU.uGlowDir.value); aim(dBand, LU.uBandDir.value); aim(dStar, LU.uStarDir.value);      // (set once: the star stands at one strength)
    hemi.color.copy(LU.uHemiSky.value); hemi.groundColor.copy(LU.uHemiGround.value).add(LAMP_UNDER);      // (the kit's trees take the lamps' amber from below, as our own crowns do)
    dGlow.color.copy(LU.uGlowCol.value); dBand.color.copy(LU.uBandCol.value); dStar.color.copy(LU.uStarCol.value);

    // (ONE LAW FOR THE SHADE: the script's form, which the build bakes by, against the shader's, which lights the water under what
    // is baked: the same within 0.02 at 400 points of the river and its banks, or the build fails: the common part's townLitTwin)
    { const d = townLitTwin(); if (!(d <= 0.02)) throw new Error('old-light-arriving: the shade law\'s script form and its shader form differ by ' + d.toFixed(3) + ' on the river (0.02 is allowed)'); }
    // ---- the south country, the water, the far plain
    const lampMap = makeLampMap(LU);      // the lamps' light on the ground: every pool is laid into this one map, which the ground reads
    const land = await makeLand(LU, ctx.yield); root.add(land.object);
    await ctx.yield();
    const water = makeWater(LU, WU); root.add(water.object);
    await ctx.yield();
    const plain = await makePlain(LU, WU, { seed: [S.plain() * 6.283, S.plain() * 6.283], full, pause: ctx.yield }); root.add(plain.object);
    await ctx.yield();

    // ---- the country's life: boats, lamps, people (laid by the land's and the river's own coordinates; the route is asked only for clearance)
    const route = (() => { const P = new THREE.Vector3(), a = []; for (let m = 0; m <= LEN; m += 3) { path.posAtDist(m, P); a.push(P.x * MX, P.y, P.z); } return a; })();
    const RU = { uRes: { value: new THREE.Vector2(1280, 720) }, uHalo: { value: weather === 'mist' ? 0.3 : 0.1 } };      // (in mist every lamp wears a wider halo)
    const WIND = [0.9, -0.44];      // the evening's wind on the map: toward the east and a little north
    if (weather === 'mist') root.add(makeMist(LU, WIND).object);
    const CP = { LU, RU, WU, S, clear: makeClear(route), fleet, ships, snow, wind: WIND, lampMap, yieldFn: ctx.yield };
    // the eyes of the skyline's test (the owner's order J1): one every 5 m of road from the entry to the saddle's crossing
    CP.skyEyes = (() => { const P = new THREE.Vector3(), a = []; for (let m = 0; m <= RP.saddle; m += 5) { path.posAtDist(m, P); a.push([m, P.x * MX, P.y, P.z]); } return a; })();
    const country = await makeCountry(CP);
    if (!country.skyline.ok) throw new Error('old-light-arriving: the thread out of the cleft: ' + country.skyline.fails.length + ' failures, the first: ' + country.skyline.fails[0]);
    await ctx.yield();
    const air = await makeAir(CP, country); root.add(air.group);
    // (the line behind the entry: the least distance the build found from it to the ground, a berth or a lane, on this seed's own deal)
    if (CP.clear.stats.back < BACK.keep) throw new Error('old-light-arriving: ' + CP.clear.stats.backBy + ' stands ' + CP.clear.stats.back.toFixed(1) + ' m from the line behind the entry (its clearance is ' + BACK.keep + ' m)');
    await ctx.yield();
    await finishCountry(CP, country); root.add(country.group);
    await ctx.yield();

    // ---- the bowl and the sky it faces (the hero part)
    const clear = CP.clear, th = -STAR_AZ * DEG;
    const hero = await buildHero(ctx, { LU, WU, RU, streams: S, late, rare, highCloud: weather === 'cloud', full,
      far: (l, a, y) => { const p = bowlXZ(l, a); return clear.dist(p[0], y, p[1]); },
      lamp: (x, z, r, k, h, foot, wide) => { const p = bowlXZ(x, -z); lampMap.stamp(p[0], p[1], r, k, h, foot, wide); },
      wind: [Math.cos(th) * WIND[0] - Math.sin(th) * WIND[1], Math.sin(th) * WIND[0] + Math.cos(th) * WIND[1]] });
    hero.object.position.set(BOWL.c[0], 0, BOWL.c[1]); hero.object.rotation.y = -STAR_AZ * DEG;
    root.add(hero.object);
    await ctx.yield();
    // the fliers, dealt last of all that stands or flies: their courses are asked of the land, of everything the country and the air
    // have laid, and of what the bowl's dressing has stood on its rim and outer slope, where they land (the air part's rule)
    await air.fly(hero.dress.stand.map((o) => { const p = bowlXZ(o.x, -o.z); return { x: p[0], z: p[1], r: o.r, top: o.top }; }),
      hero.dress.floats.map((f) => { const p = bowlXZ(f.p[0], -f.p[2]); return { p: [p[0], f.p[1], p[1]], len: f.len }; }));
    await ctx.yield(); await lampMap.finish(ctx.yield); await ctx.yield();
    hero.sky.group.scale.x = MX; scene.add(hero.sky.group);
    await ctx.yield();

    // ---- the white river birds of the reed island: their own round on the world's clock (the wild part). Every bird's whole loop is
    // asked against the road before they are let fly.
    await ctx.yield();
    const birds = makeBirds(LU, { R: S.gulls, island: REEDS, rx: 13, rz: 21, n: 90 });
    // (every bird's loop is dealt, so the build proves on this seed's own deal that none comes within the road's 7 m at any phase of
    // its round. The loops go out westward of the island, whose near edge is 47 m from the road; a loop's breadth can carry it a
    // dozen metres east of that edge, toward the road: the least distance counted on seeds 1 to 1,000 is 30.7 m)
    const birdGap = birds.nearest(clear.dist);
    if (birdGap < 7) throw new Error('old-light-arriving: a river bird\'s loop comes within ' + birdGap.toFixed(1) + ' m of the road');
    root.add(birds.object);
    // EVERYTHING THE CLOCK MOVES, AT EVERY PHASE (a visitor may come in with the clock at any reading): each was asked where it was
    // dealt, over its whole course or its whole swing (a lane's whole length for the craft under way, the moored airship's ball, a
    // flier's whole course with its circle, a float's globe with its swing, a plume's whole line, a bird's whole course), and the least
    // distances found are asked once more here against the road's least keep-clear: the build fails if any is inside it.
    { const a = air.stats, c = clear.stats, gaps = { 'a craft under way': c.fleet, 'the moored airship': a.ship, 'a flier': a.fliers ?? 1e9, 'a float\'s globe': a.floats ?? 1e9, 'a chimney\'s plume': c.smoke, 'a river bird': birdGap };
      for (const k of Object.keys(gaps)) if (!(gaps[k] >= 7)) throw new Error('old-light-arriving: ' + k + ' comes within ' + gaps[k] + ' m of the road at some phase of the clock'); }
    // (the small dark birds the brief wheels over the knolls are left out: specks on a night sky read as a cluster of faint stars)
    // ---- seed-down: a layer of air over ground and water, each fleck at its own height above the surface under it (see the wild part)
    const eye = new THREE.Vector3();
    const down = await makeDown(LU, { R: S.down, block: downBlock(FOV), count: Math.round(DOWN_PER_M2 * downBlock(FOV) ** 2 * detail), wind: [WIND[0] * 1.6, WIND[1] * 1.6], pause: ctx.yield, RU, arch: (() => { const p = bowlXZ(0, ARCH_AT); return [p[0], BOWL.yStage + 9, p[1]]; })() });
    root.add(down.object);
    await ctx.yield();

    // ---- the gaze. From the saddle until the road has passed the pool's far edge, one pull toward the point 3 km beyond the arch
    // along the star's own direction: the line of sight of every seat in the bowl, which faces the arch and the place in the sky
    // beyond it where the star stands.
    const gazeAt = (() => { const p = bowlXZ(0, ARCH_AT), d = STAR_DIR; return [(p[0] + d.x * 3000) * MX, BOWL.yStage + 11 + d.y * 3000, p[1] + d.z * 3000]; })();
    // And one before it, over the climb from the quay line to the saddle: the gaze leans to where the journey goes (the bowl, behind
    // the bluff). This pull is not in the design: it is listed in the report as a departure.
    const pois = [{ at: [BOWL.c[0] * MX, BOWL.yPool, BOWL.c[1]], from: RP.quay / LEN, to: RP.saddle / LEN, weight: 0.5 },
      { at: gazeAt, from: RP.saddle / LEN, to: RP.poolFar / LEN, weight: 0.35 }];

    function update(dt, time, camera) {
      LU.uTime.value = time;
      if (ctx.renderer) ctx.renderer.getDrawingBufferSize(RU.uRes.value);
      hero.sky.update(time, camera);
      hero.update(dt, time, camera);
      camera.getWorldPosition(eye); down.uniforms.uEye.value.set(eye.x * MX, eye.y, eye.z);
      down.uniforms.uShow.value = ctx.through ? 0 : 1;      // (the block of air is carried round the eye: not drawn while the world is seen through a portal)
      country.trees.wind.update(time);
    }

    return {
      scene, path, duration: DUR,
      camera: { fov: FOV, near: 0.3, far: 7000, nearThrough: 0.3, lookAhead: 24, sway: 0.4, bank: 0.1 },
      pois,
      portal: { shape: 'arch', width: 16, height: 22, color: '#DCE8FF', glow: 0.3, revealDistance: LEN - RP.saddle },      // the arch is first seen as the road crosses the saddle
      // (THE BLOOM'S RADIUS: the engine's bloom spreads a small bright thing over SQUARE blocks of the picture, its blur being level to
      // its edge: 11 pixels across on its first level, 36 on its second, at 720 lines. A lamp a few pixels wide that stood against the
      // dark wore the first as a square patch. The radius is the engine's own share between its levels: at 1 the first level carries
      // 0.2 of its light where it carried 0.52 at 0.6 and the second 0.4 for 0.56, the wide levels the rest: the same light, spread
      // wide and soft. Tuned on the whole flight; a lamp's own glow is the round halo of the lamps' law.)
      post: { exposure: 1.15, bloom: { strength: 0.5, radius: 1.0, threshold: 0.92 },
        grade: { saturation: 1.04, contrast: 1.06, tint: '#ffffff', shadowTint: '#060A1C', vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() {},
    };
  },
};
