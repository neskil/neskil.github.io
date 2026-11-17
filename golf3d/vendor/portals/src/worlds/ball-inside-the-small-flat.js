// The Ball Inside the Small Flat. A flight over a great city's roofs under a full spring moon, in at one high window of
// a tall plain house, down a dark ordinary hallway and through its door: and there is no room but a stair without end,
// a river of guests climbing it out of a fireplace at its foot. Off its great landing through a tall doorway into the
// palace's winter garden (palms, lianas, parrots on gilt stands under a roof of glass), between low walls of white
// tulips into a ballroom of sparkling yellow columns over a floor of turning dancers, between walls of roses and
// camellias, over three pools of wine lit below; on through the hall's far bay, as rich as the hall to its end wall,
// and through that wall's great portal by three chambers, each smaller than the last, into one small sitting room at
// its great size, warm and full, with a lamp, a laid table, a looking glass, a piano and a door standing open.
//
// THE PLACE STANDS. Nothing of it begins, turns or ends as the visitor comes: every state is fixed at the build by a
// thing's own place in the plan, and everything that moves is a habit on the world's clock (the ball's own clock for
// the ball), the same whether anyone is there or not, and reads at every phase.
//  - THE BALL STANDS AT ITS HEIGHT from end to end: every pool boils, lit from below; the far bay keeps its columns,
//    its vault, its chandeliers and its flower walls; the chambers and the room are built once, as they stand, and
//    are lit by their own lamps (a light of place: where a lit point lies in the hall, never where the visitor is).
//  - HABITS ON THE CLOCK: guests climbing the stair; dancers, bows, the monkeys' band, fountains, spray, bubbles,
//    butterflies; blooms of the walls' tops letting go and opening again on rounds of their own; flowers falling from
//    the ceiling; petals stirring where they lie; each parrot on a round of its own (cling, burst off, one closed
//    loop, settle); flames, smoke, washing, curtains, a pendulum, the cat's turning head, each from a drawn phase.
//    On a rare visit the whole ball stops still for a few seconds and goes on, over and over (one round of the
//    world's clock, begun at a drawn phase).
// WHAT KNOWS WHERE THE VISITOR IS (none of it a thing of the story, none of it changes the place):
//  - the film's pace and the gaze's three pulls (the orchestra, the monkeys' stage, the cat), laid between places;
//  - which halls are drawn: the city and its sky until 10 m into the hallway; the stair until 30 m into the forest (the
//    shell about its head, which is wider and higher than the tall house, from the window's plane on: over the roofs
//    it stood out past the house as a black slab, and it cannot be seen through the flat's door before then); the
//    forest and the ballroom from 20 m before the hallway's door. Each is whole whenever it is drawn. NOT EVERY HALL IS
//    DRAWN WHEREVER IT WOULD BE IN VIEW: the halls are larger than the house they lie in, and the stair's near shell,
//    drawn always, would stand in the open past the house's side and over its roof from the roofs; it is left undrawn
//    until the window's plane, where the house's own walls stand between it and the eye;
//  - the site's portal, shown from 150 m; the sky's dome, kept about the eye; gloss, glints, the floor's image, the
//    looking glass's lights, the pools' mirrored walls and the haze, which are optics of standing surfaces seen from
//    where the eye is. A lamp's glow keeps its strength at every distance: it is kept out of the lens by its place;
//  - at the build only: things kept 2.5 m off the line (and off the entry's axis behind the entry), and every glow's
//    middle farther from the line than its own radius.
// The inside keeps its own hour: on a visit at noon it is midnight inside all the same; at a golden sunset the ball is
// lit warmer.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import { ballPlan, ballFilm, ballStreams, makeRoute, makeZone, buildHero, buildCity, geoRest, DURATION, CAM, ST, ROOM } from '../parts/ball-inside-the-small-flat.js';

// the hour outside: the sky's preset, how far it is night (windows and lamps lit), the light on the roofs
const HOURS = {
  night: { preset: 'night', night: 1, key: [0.7, 0.86, 1.3], up: [0.1, 0.135, 0.245], dn: [0.036, 0.048, 0.09], fog: 0.0022 },
  golden: { preset: 'sunset', night: 0.6, key: [1.5, 0.62, 0.24], up: [0.2, 0.15, 0.2], dn: [0.08, 0.05, 0.06], fog: 0.0018 },
  day: { preset: 'day', night: 0, key: [1.7, 1.6, 1.4], up: [0.34, 0.42, 0.56], dn: [0.16, 0.15, 0.14], fog: 0.0012 },
  dawn: { preset: 'dawn', night: 0.55, key: [1.1, 0.72, 0.6], up: [0.2, 0.21, 0.3], dn: [0.08, 0.07, 0.08], fog: 0.002 },
};

export default {
  id: 'ball-inside-the-small-flat',
  name: 'The Ball Inside the Small Flat',
  category: 'books',
  placeKind: 'interior',
  book: 'The Master and Margarita',
  author: 'Mikhail Bulgakov, 1891 to 1940',
  media: ['interior'],
  weirdness: 0.8,
  async build(ctx) {
    const vary = ctx.vary || {}, detail = ctx.quality ? ctx.quality.detail : 1, density = vary.density ?? 1, rare = !!vary.rare;
    // every stream of the world, once, here; the plan draws its own
    const plan = ballPlan(ctx.seed, vary.hour), R = ballStreams(ctx.seed), HR = HOURS[plan.hour] || HOURS.night;
    await ctx.yield();
    const path = makePath(plan.pts, { samples: 640 });
    await ctx.yield();
    const film = ballFilm(plan, path), LEN = film.LEN;
    await ctx.yield();
    const route = makeRoute(film);
    await ctx.yield();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color().setRGB(0.016, 0.009, 0.008);
    // the sky outside: a full moon low ahead and to one hand at night; at sunset and dawn the sun stands there; at noon
    // it stands high over the visitor's shoulder
    const skyOpts = { rng: R.sky, preset: HR.preset };
    if (plan.hour === 'night') skyOpts.bodyOverrides = { 0: { elevation: plan.moonEl, azimuth: plan.moonAz, size: 3.3, phase: 1, intensity: 1.5, glow: 0.4, glowColor: '#b9ccff', glowSize: 5 } };
    else if (plan.hour === 'day') { skyOpts.sunElevation = 58; skyOpts.sunAzimuth = 180 + plan.moonAz; }
    else { skyOpts.sunElevation = plan.hour === 'golden' ? 4 : 5; skyOpts.sunAzimuth = plan.moonAz; }
    const sky = makeSky(skyOpts);
    scene.add(sky.object);
    await ctx.yield();
    // the whole place hangs in one frame: F1 moved so that the route begins at the world's origin, mirrored by the hand
    const root = new THREE.Group(); root.scale.x = plan.hand; root.position.z = -plan.zStart; scene.add(root);
    const L = sky.lightDirection, fc = sky.fogColor;
    const zCity = makeZone({ ambUp: HR.up, ambDn: HR.dn, keyDir: [plan.hand * L.x, L.y, L.z], keyC: HR.key, fogC: [fc.r, fc.g, fc.b], fogD: HR.fog });
    zCity.U.uVis.value.z = HR.night;
    // cloud shadows drift over the city under the moon or the sun (a habit on the world's clock)
    zCity.U.uCld.value.x = 0.48;
    zCity.point(0, 0, 6.4, ST.HALL + 3.5, 13, [1.5 * HR.night + 0.2, 0.9 * HR.night + 0.1, 0.4 * HR.night]);
    const city = await buildCity(ctx, plan, zCity, R, route, HR.night);
    city.group.name = 'city'; root.add(city.group);
    await ctx.yield();
    const hero = await buildHero(ctx, { plan, streams: R, density, detail, rare, film, route });
    root.add(hero.object); root.updateMatrixWorld(true); hero.frames(); zCity.frame(root);
    await ctx.yield();
    // the buffers the meshes were gathered in are let go
    geoRest();
    const place = (u) => {
      const st = film.at(u * LEN);
      hero.halls(st.zr, st.d);
      const out = st.z1 > ST.HALL - 10;
      city.group.visible = out; sky.object.visible = out;
    };
    place(0);
    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: DURATION, pace: film.pace,
      camera: { ...CAM },
      pois: film.pois,
      portal: { shape: 'rect', width: ROOM.DOORW, height: ROOM.DOORH, color: '#ffd98a', glow: 0.8, revealDistance: 150 },
      post: { exposure: 1.0, bloom: { strength: 0.5, radius: 0.7, threshold: 0.92 }, grade: { saturation: 1.06, contrast: 1.04, tint: '#ffffff', shadowTint: '#05030a', vignette: 0.3, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        place(u);
        zCity.U.uTime.value = time; zCity.U.uCld.value.z = time;
        hero.update(dt, time);
        if (sky.object.visible) sky.update(dt, time, camera);
      },
      proof: route.best, counts: { ...hero.counts, ...city.counts }, ballClock: hero.ballTime,
      dispose() { hero.dispose(); sky.dispose(); },
    };
  },
};
