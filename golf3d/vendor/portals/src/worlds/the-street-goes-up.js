// The Street Goes Up: a sunny harbour town on one slab of land bent once at a right angle. The high street,
// the tramline and the canal round the bend and run straight up a wall of town; the sea beside it stays level.
import * as THREE from 'three';
import { makePath, bell } from '../kit/core.js';
import { buildDevice, LAND, S_WALL, S_RIM, fold, viaductLine, VIADUCT } from '../parts/the-street-goes-up.js';

// the flown line, in metres: in over the harbour, round the foot of the bend, up along the wall's face
// with the wall on the left and the sea on the right, easing level at the rim's height while yet out over the
// wall's face, and then straight, slantwise in over the top rows and the rim's edge on a gentle rise, to the ring
// under the canal's leap.
const ROUTE = [
  [-20, 24, -394], [48, 24, -313], [111, 25, -236], [166, 26, -165], [212, 28, -99], [232, 38, -55],
  [231, 62, 4], [230, 88, 65], [230, 108, 112],
  [226, 123, 146], [212, 141, 186], [200, 162, 234], [200, 171, 255], [211, 189, 296], [223, 206, 334], [232, 223, 373],
  [233, 261, 462], [234, 299, 552], [234, 340, 649], [236, 371, 722],
  [234.5, 378.5, 757], [233.5, 382.6, 786],
  [238.5, 385.45, 810.03], [245.2, 386.98, 821.65], [276, 394, 875],
];

// THE LOOKS AND THE LINGERING. Every span is found from places of the town by the route's nearest pass of them:
// a look begins at the pass of one place, ends at the pass of another, and is whole from (or lets go at) the pass
// of a third, so the length of its rise and fall is the stretch between two places too.
export function planLooks(path, P) {
  const passOf = (x, z) => path.nearestXZ(x, z).u;
  const world = (pl, h = 0) => fold(pl.s, pl.z, h, new THREE.Vector3());
  const pass = (pl) => { const w = world(pl); return passOf(w.x, w.z); };
  const pois = [];
  // a look at a place, from one pass to another; ease is the pass where it is whole (near its start) or where it
  // begins to let go (near its end): the same length of route serves for its rise and its fall
  const look = (at, from, to, ease, weight) => {
    const span = Math.max(to - from, 1e-4), fade = Math.min(Math.min(Math.abs(ease - from), Math.abs(to - ease)) / span, 0.5);
    pois.push({ at, from, to, weight, fade });
  };
  const tp = P.tramPlace, bendIn = passOf(tp.s0, tp.z0), uBend = passOf(LAND.wallX - LAND.R * 0.7, LAND.avenueZ);
  const steepleUp = world(P.steepleUp, 30), uSteeple = passOf(steepleUp.x, steepleUp.z);
  // a light chain toward the next landmark's place, lifted so it is never below the line: each look runs from the
  // pass of the landmark before it to its own
  const chain = [
    world(P.clock, 30), world(P.millUp, 18), steepleUp, null,
    world(P.steepleLying, 40), world(P.carousel, 6), world(P.mills[0], 18), world(P.mills[1], 18), world(P.mills[2], 18),
    world(P.chimneys[2], 40),
  ];
  let before = 0;
  for (const target of chain) {
    if (!target) { before = uBend; continue; }
    const to = passOf(target.x, target.z);
    if (to > before) {
      const lifted = target.clone(); lifted.y = Math.max(lifted.y, path.pointAt(to).y);
      pois.push({ at: lifted, from: before, to, weight: 0.25 });
    }
    before = Math.max(before, to);
  }
  // THE BEND: one look holds the avenue's bend, where a tram is always going round, from the upright steeple's
  // pass until the bend itself is passed; it begins to let go at the tram place's near corner
  const bendFoot = fold(S_WALL - LAND.R * 0.5, LAND.avenueZ, 2, new THREE.Vector3());
  look(bendFoot, uSteeple, uBend, bendIn, 0.6);
  // THE FOOT OF THE WALL: as the bend look lets go the gaze leans down toward the far end of the bend, where the
  // canal rounds it, so the level sea, the floor town and the bend itself are in view beside the wall, as far as
  // the lying steeple
  const bendEnd = fold(LAND.sCrease + LAND.R * 0.5, LAND.canalZ, 0, new THREE.Vector3());
  const uLake = pass(P.lake), uLying = pass(P.steepleLying);
  look(bendEnd, bendIn, uLying, uBend, 0.42);
  // THE HUNG LAKE: from the carousel on the gaze is drawn to the standing water ahead, to the lower far quarter
  // of it, where its boats' masts stand out level; it is whole by the first lying windmill
  const lakeLow = world({ s: P.lake.s - P.lake.r * 0.5, z: P.lake.z + P.lake.r * 0.5 }, 0);
  look(lakeLow, pass(P.carousel), uLake, pass(P.mills[0]), LOOKS.lake);
  const vl = viaductLine(P), archAt = (VIADUCT.arches - 1.5) * vl.len / VIADUCT.arches;
  const crown = fold(P.viaduct.s0 + archAt * vl.ds, P.viaduct.z0 + archAt * vl.dz, P.viaduct.h, new THREE.Vector3());
  const uCrown = passOf(crown.x, crown.z), uFoot = pass({ s: P.viaduct.s0, z: P.viaduct.z0 });
  // THE LEAN IN: up the wall from the bend's pass to the pass of the hung lake's far shore, the gaze is turned
  // in toward the wall and down (LEAN, laid from the lens's own place on the line), so the town on the wall, the
  // floor town under it and the level sea with its ships and its horizon are in one view; it is whole by the
  // lying steeple's pass and lets go over the same length of route before the lake's far shore, so beyond the lake
  // no standing look holds the gaze from the line (only the light chain draws it toward the next landmark): the
  // works, the viaduct and what hangs beyond it stand before the lens
  const leanAt = new THREE.Vector3(), uShore = pass({ s: P.lake.s, z: P.lake.z + P.lake.r });
  pois.push({ at: (time, u) => path.pointAt(u, leanAt).add(LEAN), from: uBend, to: uShore, weight: LOOKS.lean, fade: Math.min((uLying - uBend) / (uShore - uBend), 0.5) });
  // THE CANAL'S MOUTH: from the arch on, the gaze leans out and down toward the quay's edge where the canal meets
  // the harbour, far below, so the wall's face falling away, the cloud's level top, the gulls over it and the sea
  // under them are beside the top rows and the rim all the way to the ring
  const mouth = fold(0, LAND.canalZ, 0, new THREE.Vector3());
  look(mouth, uCrown, passOf(LAND.wallX + LAND.thick, LAND.canalZ), uFoot, LOOKS.mouth);
  // lingering: slower round the bend and under the lying steeple
  const bendOut = passOf(LAND.wallX, LAND.avenueZ + 20);
  const sl = world(P.steepleLying, 0), underIn = passOf(sl.x, sl.z - 35), underOut = passOf(sl.x, sl.z + 35);
  const pace = (u) => 1 - 0.25 * bell(u, bendIn, bendOut) - 0.2 * bell(u, underIn, underOut);
  return { pois, pace };
}
// how strongly each standing look draws the gaze
export const LOOKS = { lake: 0.45, lean: 0.85, mouth: 0.22 };
// the lean in, in metres from the lens: in toward the wall, down, and on along the wall
const LEAN = new THREE.Vector3(36, -21, 100);

export default {
  id: 'the-street-goes-up',
  name: 'The Street Goes Up',
  category: 'city',
  weirdness: 0.7,
  media: ['air', 'open'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const path = makePath(ROUTE);

    // ---- what this visit is dealt ----
    const deal = ctx.rng.fork('deal');
    const hourDeal = deal.pick(['morning', 'noon', 'gold']);
    const want = ctx.vary && ctx.vary.hour;
    const hour = want === 'dawn' ? 'morning' : want === 'day' ? 'noon' : want === 'golden' ? 'gold' : hourDeal;
    const lakeLift = deal.range(-10, 10);
    const boats = deal.int(6, 10);
    const breeze = deal() < 0.5 ? 0 : deal.range(0.25, 1);       // calm, or a sea breeze leaning the risen smoke
    const gala = deal.int(0, 2);                                   // the festival's colour: balloons and awnings
    const rare = !!(ctx.vary && ctx.vary.rare);
    const density = (ctx.vary && ctx.vary.density) || 1;
    const detail = (ctx.quality && ctx.quality.detail) || 1;

    scene.fog = new THREE.FogExp2(new THREE.Color('#D4E6EF'), 0.00042);
    scene.add(new THREE.HemisphereLight(0xD4E6EF, 0x7FA6C0, 0.45));
    const sunLight = new THREE.DirectionalLight(0xFFF1D6, 1.2); scene.add(sunLight);
    await ctx.yield();

    const device = await buildDevice(ctx, scene, { path, hour, lakeLift, boats, breeze, gala, rare, density, detail });
    sunLight.position.copy(device.air.uSun.value).multiplyScalar(1000);
    sunLight.color.copy(device.air.uSunCol.value);
    await ctx.yield();

    // ---- looks and lingering: every span is found from places of the town, by the route's nearest pass ----
    const { pois, pace } = planLooks(path, device.places);

    return {
      scene, path,
      duration: 47,
      pace,
      ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 6000, bank: 0, sway: 0 },      // the lens is upright throughout: the level horizon is the witness
      portal: { shape: 'circle', radius: 7, color: '#FFF4DA' },
      post: { exposure: 1, bloom: { strength: 0.22, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 1.0, contrast: 1.05, tint: '#FFF6E6', vignette: 0.2, grain: 0.02 } },
      pois,
      update(dt, time, camera, u) { device.update(dt, time, camera); },
      dispose() { device.dispose(); },
    };
  },
};
