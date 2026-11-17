// After the Rain, the Whales. A wide avenue of old plane trees in an everyday glass city at dusk, minutes after rain:
// wet asphalt and stone, towers of many kinds on their podiums, an open square, a terrace with one free-standing
// stone arch against the sky. The air of the avenue behaves as sea: whales of five kinds swim calmly through it at the
// height of the street trees, and their shadows slide along the sunlit towers.
// The city, its light and sky: src/parts/after-rain-the-whales.js. Every animal: src/parts/after-rain-the-whales-animals.js.
// This file lays the route, the pace, the looks, the post and the portal, and joins the two parts (both read ctx.vary
// and ctx.quality.detail). The world sets neither portal.drawWithin nor portal.drawIn: the ring stands whole at every metre.
// Axes: x EAST, y up, z SOUTH; the flight goes north. Metres.
import * as THREE from 'three';
import { makePath, clamp } from '../kit/core.js';
import { buildCity, cityEnv, cityPlan } from '../parts/after-rain-the-whales.js';
import { buildAnimals } from '../parts/after-rain-the-whales-animals.js';

// THE ROUTE (the brief's points; a few points on the same straight lines keep the first 60 m and the last 30 m straight)
const ROUTE = [
  [-7, 22, 170], [-7, 22, 150], [-7, 22, 130], [-7, 22, 110], [-6.6, 22.1, 103],
  [-5, 22.5, 80], [-3, 21, 50], [-2, 20, 20], [-4, 20, -20], [-6, 21, -60], [-4, 23, -100], [2, 24, -130],
  [6, 23, -170], [5, 21, -210], [2, 18, -240], [0.25, 15.25, -256], [0, 15, -262], [0, 15, -272], [0, 15, -282], [0, 15, -292],
];

export default {
  id: 'after-rain-the-whales',
  name: 'After the Rain, the Whales',
  category: 'screen',
  placeKind: 'city',
  screen: 'Extraordinary Attorney Woo',
  screenYear: '2022',
  screenKind: 'series',
  media: ['air'],
  weirdness: 0.45,
  description: 'A wide avenue of old plane trees in a glass city at dusk, minutes after rain. Whales swim calmly through the air at the height of the street trees and their shadows slide along the sunlit towers; the avenue ends at a terrace where one twisted stone arch stands against the open sky.',
  async build(ctx) {
    const vary = ctx.vary || {};
    const hour = vary.hour === 'dawn' || vary.hour === 'day' || vary.hour === 'night' ? vary.hour : 'golden';
    const scene = new THREE.Scene();
    const path = makePath(ROUTE);
    const L = path.length;
    // metres flown at which the route stands at a given z: the route runs north all the way, so z only falls as the
    // metres rise, and the place is found on the path itself by halving (no table of steps)
    const tp = new THREE.Vector3();
    const metreAtZ = (z) => { let a = 0, b = L; for (let i = 0; i < 48; i++) { const m = (a + b) / 2; if (path.posAtDist(m, tp).z > z) a = m; else b = m; } return (a + b) / 2; };
    // THE PACE (the brief: it may ease to about 7.5 m/s beside the mother and calf and beside the sleepers, and run to
    // 11 m/s between). Two keys, each by its place: the near pass (the brief: the lens draws level with the mother at
    // about z 128) and the middle of the sleepers' stretch (the brief: they hang between z -140 and z -210). The eased
    // stretch reaches about 30 m of route either side of the near pass and 52 m either side of the sleepers' middle.
    const NEAR_PASS_Z = 128, SLEEPERS_Z0 = -140, SLEEPERS_Z1 = -210;
    const mMother = metreAtZ(NEAR_PASS_Z), mSleep = metreAtZ((SLEEPERS_Z0 + SLEEPERS_Z1) / 2);
    const pace = (u) => {
      const m = u * L;
      const a = Math.exp(-(((m - mMother) / 30) ** 2)), b = Math.exp(-(((m - mSleep) / 52) ** 2));
      return 1.07 - 0.26 * a - 0.12 * b;
    };
    // the film's clock at which the lens is at u, at this pace (the engine scales the pace to last the duration)
    const DUR = 48, NT = 512, tt = new Float32Array(NT + 1);
    for (let i = 1; i <= NT; i++) tt[i] = tt[i - 1] + 1 / pace((i - 0.5) / NT);
    const timeAt = (u) => { const x = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(x)); return (DUR * (tt[i] + (tt[i + 1] - tt[i]) * (x - i))) / tt[NT]; };

    const env = cityEnv(hour);
    // the city's plan is dealt first: its towers (the animals take their light through the same towers as the street
    // does), its lamp standards, its trees and its arch's measures (the animals' places come from what the city really lays)
    const plan = await cityPlan(ctx, env, path);
    scene.fog = new THREE.Fog(env.fogColor.clone(), env.fogNear, env.fogFar);
    const animals = await buildAnimals(ctx, { path, timeAt, env, standards: plan.standards, trees: plan.treesLaid, arch: plan.arch });
    await ctx.yield();
    const city = await buildCity(ctx, { animals, path, env, hour, plan });
    scene.add(city.object, animals.object);

    // THE LOOKS: five (four the brief names and, since r7, the pod's next whale), each a stretch of route from one place of the world to another, at an anchor
    // a part gives, with nothing added to it. Every anchor is asked where its animal is WHEN THE LENS IS AT u (the film's
    // clock for that place, timeAt(u): the animals' courses follow the lens's place) and how it bobs NOW (the world's
    // clock), so the gaze aims at the body as it is drawn.
    const A = animals.anchors, tv = new THREE.Vector3();
    const at = (f) => (time, u) => { const a = typeof f === 'function' ? f(timeAt(u), time) : f; return tv.set(a[0], a[1], a[2]); };
    // places of the windows: the brief's own (the entry's first 30 m carry no look; the straight start ends at z 110; the
    // dolphins play between z 70 and z -20; the blue whale is in view from z 20; the orcas pass about z -195 to -215),
    // the plan's (the south side of street B is the building line at z -96) and the animals' (the sleepers' own middle)
    const STRAIGHT_END_Z = 110, STREET_B_SOUTH = -96, zSleep = clamp(A.sleepers[2], SLEEPERS_Z1, SLEEPERS_Z0);
    // each look: its anchor, the metres of route of its first and second place, its weight
    const windows = [
      // toward the mother's eye on the near pass: from 30 m in to the end of the straight start (the weight is what keeps
      // the camera's turn under 30 degrees a second when the lens arrives at a carried 60 m/s)
      [A.mother, 30, metreAtZ(STRAIGHT_END_Z), 0.27],
      // to the pod's next whale ahead up the avenue (the animals' anchor: the whale the lens is coming up to, taken up and
      // let go by its distance ahead along the route): from the end of the straight start to where the blue whale comes
      // into view. Design change of round r7: it takes the place of the look down to the dolphins' stepped plaza.
      [A.podAhead || city.anchors.plaza, metreAtZ(STRAIGHT_END_Z), metreAtZ(20), 0.45],
      // ahead to the blue whale over street B: from where it comes into view to the south side of its street
      [A.blue, metreAtZ(20), metreAtZ(STREET_B_SOUTH), 0.4],
      // left to the sleepers over the square: from the south side of street B until the lens is level with their middle
      [A.sleepers, metreAtZ(STREET_B_SOUTH), metreAtZ(zSleep), 0.42],
      // right to the orcas coming south down the east side: from the sleepers' middle to the end of their passing
      [A.orcas, metreAtZ(zSleep), metreAtZ(-215), 0.3],
    ];
    // ONE LENGTH of route for every rise and every fall: each look rises over it from its first place and falls over it
    // to its second, at full weight between. It is half the entry look's stretch (from 30 m in to the end of the straight
    // start), the shortest stretch the design fixes. Where the sleepers' own middle leaves the orcas a stretch shorter
    // than two such lengths, that look's rise and fall overlap and it stays a little under its weight.
    const ramp = (windows[0][2] - windows[0][1]) / 2;
    const pois = windows.map(([a, m0, m1, weight]) => ({ at: at(a), from: m0 / L, to: m1 / L, weight, fade: ramp / (m1 - m0) }));
    // the exit is in view from the south side of street B on: the engine draws the ring whole from REVEAL_WHOLE of
    // revealDistance left to fly, so that length is the metres left at that place
    const REVEAL_WHOLE = 0.6;
    return {
      scene, path, duration: DUR, pace,
      camera: { fov: 62, near: 0.3, far: 5200, lookAhead: 26, sway: 0.6, bank: 0.4 },
      pois,
      portal: { shape: 'arch', width: 12, height: 18, color: '#ffe6c4', glow: 1.15, revealDistance: (L - metreAtZ(STREET_B_SOUTH)) / REVEAL_WHOLE },
      post: {
        exposure: hour === 'night' ? 1.6 : hour === 'day' ? 0.94 : 1.2, bloom: { strength: 0.32, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.09, contrast: 1.05, tint: '#fffaf4', shadowTint: '#10142c', vignette: 0.26, grain: 0.02, aberration: 0 },
      },
      update(dt, time, camera) {
        animals.update(dt, time, camera);
        city.update(dt, time, camera);
      },
      dispose() { city.dispose(); animals.dispose(); },
    };
  },
};
