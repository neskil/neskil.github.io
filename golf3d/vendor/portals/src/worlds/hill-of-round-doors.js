// The Hill of Round Doors (film worlds crew C). Built on one place only, in general words: a broad, soft, very green
// hill above a slow stream on a golden summer evening, small homes set into its turf, each with one round door in a
// strong plain colour; a stone bridge and a mill with a turning wheel; one huge tree hung with paper lanterns over
// tables laid for a feast, nobody yet come; a lane that climbs past the homes to the last and highest of them, a round
// green door under a great oak. Everything with a form is ours, drawn anew from the design's words and from real
// things (downland, water meadows, turf-roofed cottages, cottage gardens, village fetes). No person and no character
// in any form; nothing lettered; no mark on any door; no ring but the page's own portal.
//
// THREE BUILDERS: this file and src/parts/hill-of-round-doors-land*.js are the LAND BUILDER's (the flight, the sky and
// the light, the ground, the grass, the lanes, hedges and walls, the flowers of meadow and bank, the stream and the
// pond, ordinary trees, the grazing and flying animals, the putting together). The homes (the twenty fronts, their
// gardens, the green door, its swing and the hall) are buildHomes; the party tree, the tents and tables, the bridge,
// the mill and its wheel and the oak are buildField. Both are handed { THREE, rngFor, look } and are called every
// frame with the flight's own u. The plan (src/parts/hill-of-round-doors-plan.js) holds the numbers all three share.
//
// DECLARED AT THE HEAD
// - SCALE: everything is about three times life size (the plan's SCALE): the flight is a small bird's.
// - THE FLOWN LINE is the plan's ROUTE, knot for knot (about 620 m, 48 s at the engine's even pace; no pace of ours):
//   in over the south meadow and the water, over the bridge, right into the party field and once round the party
//   tree under its outer boughs, up to lane 1 and west along it, round the bend to the right, east along lane 2,
//   in at the green door and nine metres along the hall.
// - THE WAY OUT: the page's ring stands in the hall, nine metres behind the green door (the plan's EXIT).
//   portal.drawWithin and portal.revealDistance are ONE number, the plan's DOOR_SWING.drawWithin (metres of route
//   still to fly: the last leg's length): the engine first draws the ring where the last leg begins, and there the
//   green door still stands shut in front of it, so the ring is first drawn behind the shut leaf. THE DOOR'S SWING
//   IS A MEETING LAID BY PLACE (the homes builder's part, keyed to the same flown line by the plan's DOOR_SWING):
//   the leaf stands shut until DOOR_SWING.shutUntil (96) m of route are still to fly, swings inward as we turn onto
//   the last lane, and rests open with DOOR_SWING.openAt (60) m still to fly, so that the lane is flown toward the
//   open doorway; its own plane is passed with 9 m still to fly. No light and no double of the ring is ours: the
//   hall is lit in its own shader (the homes builder's) by its two lamps and its hearth, by the evening through
//   its side room's round window, and by the day that comes in at the round door as the leaf swings (the sky's
//   fill and a share of the sun, by the same metres as the swing); no light is added to the scene for it.
//   ONE GLOW GOES BY THE SAME METRES AND IS SAID HERE: the hall's firelight on the forecourt (the homes builder's
//   uSpill, drawn in the homes' own material on the path and garden before the doorway). It is nought while the
//   leaf is shut and grows with the leaf's angle as the door swings (so by the metres still to fly, never earlier
//   than the swing); its slow breathing alone follows the world's clock. It is the hearth's light through an open
//   door, lying on the ground outside it: no light, fan or double of the ring, which stands nine metres inside.
// - THE LOOKS open and close BY ONE RULE, worked out in code from the plan's route and each target's place (LOOK and
//   lookWindow below; no window's end is typed): a look opens at the first place of the route where its target
//   stands inside LOOK.open degrees of the bow and within LOOK.range metres in plan, and is let go at the first
//   place after it where the target stands LOOK.close degrees off the bow (before it is abeam), or where the route
//   ends; it eases in and out over the share LOOK.fade of its own window; every look pulls with the one weight
//   LOOK.weight, so no two together weigh more than 1. The bow is the gaze's own: from a place of the route to the
//   place the camera's lookAhead further along it. The targets are places of the plan (LOOKS below).
// - CLEAR AIR, by place and counted against the flown line in plan (the parts say how): no hedge, wall, hay stook
//   or kitchen plot within 9.5 m (they stand under 3.5 m high); no tree's trunk nearer than 9 m plus its crown's reach, and none within
//   14 m plus its crown of the level line running 60 m back from the entry; reeds 12 m; sheep 14 m; swallows 9 m
//   (their courses are laid 24 m off and more); long grass keeps its tops 3 m under the line. Butterflies are small
//   things of the air: the kit moves any whose flutter would come within 3 m of the line.
// - THE HOUR is the visit's (ctx.vary.hour): 'golden' and 'any' the golden evening, sun low in the south-west;
//   'day' a bright afternoon; 'dawn' a pink misty morning with dew, the sun low in the south-east; 'night' deep blue
//   dusk with the first stars, lanterns and windows alight. One sun, one fill and one haze for the whole flight: none
//   of them changes on the way. THE RARE VISIT (ctx.vary.rare): plain golden fireworks high over the hill's east
//   slope, their rockets rising 30 m and more from the line. ctx.vary.density deals how many flowers, trees, reeds
//   and animals; ctx.quality.detail how many tufts of grass.
// - THE STREAMS: one named stream per kind of thing, all made at the top of build() (R); the homes and the field
//   take their own by name through rngFor.
// The kit's parts (sky, light rig, fireworks) are imported, not copied.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import { makeFireworks } from '../kit/fx.js';
import { ROUTE, PORTAL_RADIUS, OAK, TREE, FIELD, MILL, HOMES, DOOR, DOOR_AT, DOOR_SWING, groundY } from '../parts/hill-of-round-doors-plan.js';
import { buildHomes } from '../parts/hill-of-round-doors-homes.js';
import { buildField } from '../parts/hill-of-round-doors-field.js';
import { buildLand } from '../parts/hill-of-round-doors-land.js';

// What each hour of a visit is like. elevation and azimuth place the sun (azimuth clockwise from north, which is -z:
// 232 is south-west); light and intensity are the sun's own colour and strength; fill, ambient and ground are the
// sky's fill from above, its strength, and the light thrown back up by the land; turf is the sward's own colour (a
// deep green with enough red in it to turn gold under a low sun and enough blue to stay green in shade); lit is how
// far lanterns and windows are alight (0 to 1); dew is the morning's.
const HOURS = {
  golden: { preset: 'goldenHour', elevation: 11, azimuth: 232, light: '#ffd49c', intensity: 7.4, fill: '#adceff', ambient: 1.2, ground: '#a59c6c',
    sky: { zenith: '#2a5aa8', mid: '#7fa2d8', horizon: '#f8c98a', scatterColor: '#ffa246', scatter: 0.7, clouds: { coverage: 0.4, lit: '#ffdcae', shade: '#8a7f9c', silver: 1.3 }, clouds2: false },
    fog: '#eccf9c', haze: 0.00095, air: '#a9c0d6', exposure: 1.0, turf: '#62833f', earth: '#c9b089', stone: '#9c9486', lamp: '#ffb050', lit: 0.5, dew: 0, wind: 1 },
  day: { preset: 'day', elevation: 50, azimuth: 202, light: '#fff4e0', intensity: 2.9, fill: '#a8c8ff', ambient: 1.3, ground: '#9aa070',
    sky: { clouds: { coverage: 0.42 }, clouds2: false },
    fog: '#cfe0ee', haze: 0.0007, air: '#b4cbe6', exposure: 1.0, turf: '#668a44', earth: '#c4ad84', stone: '#a09a8e', lamp: '#ffb050', lit: 0, dew: 0, wind: 1.2 },
  dawn: { preset: 'dawn', elevation: 11, azimuth: 132, light: '#ffdecb', intensity: 7.5, fill: '#c4d2f0', ambient: 1.4, ground: '#b09a8a',
    sky: { clouds: { coverage: 0.3 }, clouds2: false },
    fog: '#efcdc6', haze: 0.0019, air: '#d2c8d8', exposure: 1.0, turf: '#668a48', earth: '#bfa57e', stone: '#9c958c', lamp: '#ffb050', lit: 0, dew: 1, wind: 0.6 },
  night: { preset: 'blueHour', elevation: -6, azimuth: 300, light: '#9db4ff', intensity: 2.0, fill: '#6f8fe0', ambient: 1.8, ground: '#4a5a70',
    sky: { zenith: '#081440', mid: '#1a3884', horizon: '#4a6cb4', stars: 0.55, clouds: { coverage: 0.25 } },
    fog: '#27407c', haze: 0.0009, air: '#2c4a8c', exposure: 1.35, turf: '#6a8e46', earth: '#b8a17c', stone: '#98928a', lamp: '#ffae4a', lit: 1, dew: 0, wind: 0.7 },
};

// THE LOOKS: the one rule's figures, and each look's name and target (a place of the plan). Its window is worked
// out by lookWindow from the route. (The lanterns hang midway between the lawn and the lowest boughs; a door's
// middle is its sill plus its radius over the garden; the oak's crown is two thirds up the tree.)
const LOOK = { open: 45, range: 100, close: 80, fade: 0.25, weight: 0.5 };
const LOOK_AHEAD = 22;                                         // metres: how far along the route the gaze rests (the camera's lookAhead)
const LOOKS = [
  ['the mill wheel', [MILL.wheel.x, MILL.wheel.y, MILL.wheel.z]],
  ['the lantern tree and the tables under it', [TREE.x, (FIELD.y + TREE.boughs) / 2, TREE.z]],
  ['the first round door', [HOMES[0].x, HOMES[0].y + DOOR.sill + DOOR.r, HOMES[0].z]],
  ['the door inside the bend', [HOMES[8].x, HOMES[8].y + DOOR.sill + DOOR.r, HOMES[8].z]],
  ['the first round door of the last lane, as the bend comes round to it', [HOMES[5].x, HOMES[5].y + DOOR.sill + DOOR.r, HOMES[5].z]],
  ['the green door', [DOOR_AT.x, DOOR_AT.y, DOOR_AT.z]],
  ["the oak's crown against the sky", [OAK.x, groundY(OAK.x, OAK.z) + OAK.height * 2 / 3, OAK.z]],
];
// A look's window by the rule: the route is walked a metre at a time; [metres where it opens, metres where it is
// let go], or null if its target never stands inside the opening angle and range.
function lookWindow(path, at, ahead) {
  const p = new THREE.Vector3(), bow = new THREE.Vector3(), to = new THREE.Vector3(), L = path.length;
  const cosOpen = Math.cos(LOOK.open * Math.PI / 180), cosClose = Math.cos(LOOK.close * Math.PI / 180);
  let from = -1;
  for (let d = 0; d < L - 1; d++) {
    path.posAtDist(d, p); path.posAtDist(Math.min(L, d + ahead), bow); bow.sub(p).normalize();
    to.set(at[0], at[1], at[2]).sub(p); const range = Math.hypot(to.x, to.z), c = bow.dot(to.normalize());
    if (from < 0) { if (c > cosOpen && range < LOOK.range) from = d; } else if (c < cosClose) return [from, d];
  }
  return from < 0 ? null : [from, L];
}

export default {
  id: 'hill-of-round-doors',
  name: 'The Hill of Round Doors',
  category: 'screen',
  placeKind: 'domestic',
  screen: 'The Lord of the Rings: The Fellowship of the Ring',
  screenYear: '2001',
  screenKind: 'film',
  media: ['air'],
  weirdness: 0.35,
  async build(ctx) {
    // every stream of the world, in one list, before anything is made: one named stream per kind of thing
    const rngFor = (name) => ctx.core.makeRng(ctx.core.hashSeed('hill:' + name + ':' + ctx.seed));
    const R = { sky: rngFor('land-sky'), ground: rngFor('land-ground'), blades: rngFor('land-blades'), downs: rngFor('land-downs'), fields: rngFor('land-fields'),
      reeds: rngFor('land-reeds'), lilies: rngFor('land-lilies'), ducks: rngFor('land-ducks'), hedges: rngFor('land-hedges'),
      trees: rngFor('land-trees'), sheep: rngFor('land-sheep'), swallows: rngFor('land-swallows'),
      butterflies: rngFor('land-butterflies'), things: rngFor('land-things'), fireworks: rngFor('land-fireworks') };
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1 };
    const detail = ctx.quality ? ctx.quality.detail : 1;
    const hour = vary.hour === 'day' || vary.hour === 'dawn' || vary.hour === 'night' ? vary.hour : 'golden';
    const H = HOURS[hour], rare = !!vary.rare, density = vary.density ?? 1;
    const scene = new THREE.Scene();
    // ------------------------------------------------------------ the flown line: the plan's knots exactly
    const path = makePath(ROUTE);
    await ctx.yield();

    // ------------------------------------------------------------ the evening sky, its sun and fill, the haze
    const sky = makeSky({ rng: R.sky, preset: H.preset, sunElevation: H.elevation, sunAzimuth: H.azimuth, lightColor: H.light, ...H.sky });
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(new THREE.Color(H.fog), H.haze);
    // (two lights and no more, the same from the first metre to the last: the sun and the sky's fill; no shadow map:
    // the land bakes its own shade by place)
    const rig = makeLightRig(sky, { intensity: H.intensity / Math.max(0.01, sky.lightIntensity), ambient: H.ambient / Math.max(0.01, sky.ambientIntensity), bounce: 0, follow: false });
    rig.hemi.color.set(H.fill); rig.hemi.groundColor.set(H.ground);
    rig.sun.target.position.set(20, 20, 20); rig.sun.position.copy(rig.sun.target.position).addScaledVector(sky.lightDirection, 500);
    scene.add(rig.object);
    // THE LOOK HANDED TO EVERY PART (the design's section 8): hour; sun, a unit vector toward the sun (at night toward
    // the dusk's last light); sunColor and skyColor; turf, the grass's own colour, so that a turf lip or a tree's foot
    // in that colour under the scene's two lights meets the ground in the same tone; density and detail; lit, how far
    // lanterns and windows are alight; fireworks, the rare visit.
    const look = { hour, sun: sky.lightDirection.clone(), sunColor: rig.sun.color.clone(), skyColor: sky.zenithColor.clone().lerp(sky.horizonColor, 0.5),
      turf: new THREE.Color(H.turf), density, detail, lit: H.lit, fireworks: rare };
    // what the land's own materials read besides: the two lights as they fall (colour times strength), the earth's
    // and the stone's colours, the lamplight's colour, the wind (a unit heading in plan and a strength), the dew
    const windA = 0.35, light = { ...look, sunLight: rig.sun.color.clone().multiplyScalar(rig.sun.intensity), skyLight: rig.hemi.color.clone().multiplyScalar(rig.hemi.intensity),
      groundLight: rig.hemi.groundColor.clone().multiplyScalar(rig.hemi.intensity), earth: new THREE.Color(H.earth), stone: new THREE.Color(H.stone),
      lamp: new THREE.Color(H.lamp), air: new THREE.Color(H.air), wind: [Math.cos(windA), Math.sin(windA)], windStrength: H.wind, dew: H.dew };
    await ctx.yield();

    // ------------------------------------------------------------ the land (this builder's parts)
    const land = await buildLand(ctx, { THREE, R, look: light, fog: scene.fog, sky, path });
    scene.add(land.object);
    await ctx.yield();
    // ------------------------------------------------------------ the homes and the field (the other two builders' parts)
    const homes = await buildHomes(ctx, { THREE, rngFor, look });
    scene.add(homes.object);
    await ctx.yield();
    const field = await buildField(ctx, { THREE, rngFor, look });
    scene.add(field.object);
    await ctx.yield();
    // ------------------------------------------------------------ the rare visit: golden fireworks, high and far from the line
    let fireworks = null;
    if (rare) {
      fireworks = makeFireworks({ rng: R.fireworks, bursts: 5, sparks: 240, period: 6.2, rise: 1.3, radius: 36, gravity: 2.6, size: 0.42, trail: 0.55, launchHeight: 96, crackle: 0.5,
        position: [128, 124, 8], area: [44, 22, 34], colors: ['#ffd27a', '#ffc04a', '#fff0c0', '#ffb030', '#ffe29a'], intensity: hour === 'night' ? 2.2 : 2.8 });
      scene.add(fireworks.object);
    }
    await sky.prewarm(ctx.renderer, null, scene);
    const total = path.length;

    return {
      scene, path,
      duration: 48,
      camera: { fov: 60, near: 0.3, far: 3600, lookAhead: LOOK_AHEAD, bank: 0.15, sway: 0.3 },
      pois: LOOKS.map(([, at]) => [at, lookWindow(path, at, LOOK_AHEAD)]).filter(([, w]) => w).map(([at, w]) => ({ at, from: w[0] / total, to: w[1] / total, fade: LOOK.fade, weight: LOOK.weight })),
      portal: { shape: 'circle', radius: PORTAL_RADIUS, color: '#ffc566', glow: 0.6, revealDistance: DOOR_SWING.drawWithin, drawWithin: DOOR_SWING.drawWithin },
      post: { exposure: H.exposure, bloom: { strength: 0.22, radius: 0.6, threshold: 0.93 }, grade: { saturation: 1.04, contrast: 1.0, vignette: 0.22, grain: 0.016 } },
      update(dt, time, camera, u) {
        sky.update(dt, time, camera); rig.update(dt, time, camera);
        land.update(dt, time, u, camera); homes.update(dt, time, u); field.update(dt, time, u);
        if (fireworks) fireworks.update(dt, time);
      },
      dispose() {
        for (const part of [sky, land, homes, field]) if (typeof part.dispose === 'function') part.dispose();
        if (fireworks) { fireworks.object.geometry.dispose(); fireworks.material.dispose(); }
      },
    };
  },
};
