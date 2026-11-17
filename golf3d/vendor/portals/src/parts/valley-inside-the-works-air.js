// valley-inside-the-works: THE AIR (the world builder's): the four daylights a visit can be dealt (LOOKS), the sky
// behind the roof glass and the windows, and what hangs in the air of the hall: a little warm dust that is bright in
// the bars of light and unseen in the shade between them, slanting shafts of light where the bars come down, a
// light haze down the nave, and at dawn a low mist lying in the meadow.
// Nothing here is placed, shown or lit by the lens. What reads the eye, and how: the sky is the kit's dome, drawn at
// the far plane round whichever camera renders it; of the dust (one endless field fixed in the hall, a mote's place
// a function of the clock alone) the piece round the eye is drawn, a level of detail, and a mote smaller than a
// pixel is filtered by the pixel's footprint; the beams' light is summed along the line of sight and sinks with
// distance (air by distance); dust and beams are brighter looking toward the light (how dust scatters: a sheen);
// dust and beams thin toward the eye by true distance between 2.5 and 0.6 m; dawn's mist banks are fixed things
// that keep their own half width from the flown line, and the kit's near fade on them is set inside the same range.
import { makeSky } from '../kit/sky.js';
import { makeMist } from '../kit/fx.js';
import * as P from './valley-inside-the-works-plan.js';
import { makeBeams } from './valley-inside-the-works-air-beams.js';
import { makeDust } from './valley-inside-the-works-air-dust.js';

// THE LOOKS, by ctx.vary.hour (design, section 7). There is no night here: 'night' is a bright day with broken
// cloud. EVERY LOOK IS SUNLIGHT THROUGH A GLASS ROOF: a warm, strong sun against a cool, much weaker fill, so that
// the plan's bars lie on everything as bright warm bars with blue-green shade between them (level ground in a bar
// gets about three and a half times the light of the shade beside it).
//   sun, sunPower   the directional light through the roof glass (the bars)
//   sky, shade, fill   the hemisphere light: the sky's fill from above, the meadow's bounce from below, its strength
//   back   the colour behind everything (the scene's background)
//   fog, fogDensity   the scene's haze, a light one down the whole nave, the same for the whole flight: the far
//                     columns and the head wall stand paler and a little bluer than the near (a fifth at 200 m,
//                     half at the hall's length)
//   haze   the same as one number, handed to the other parts in look.haze
//   ring   the colour of the way out's rim
//   beam, dust   the shafts of light in the air: their strength, and how much a metre of lit air scatters
//   motes   the dust motes' brightness
//   mist   the low haze lying over the meadow (dawn only): its colour and strength; 0 or absent: none
//   dome   the sky behind the glass (kit sky options)
//   exposure .. shadowTint   the post
export const LOOKS = {
  day: {
    sun: '#ffe7bd', sunPower: 5.2, sky: '#d6e4ff', shade: '#6c8c88', fill: 1.5, back: '#b9cbd8', haze: 0.5,
    fog: '#dbe5ee', fogDensity: 0.0023, ring: '#fff4e0', exposure: 0.95, bloom: 0.3, saturation: 1.14, contrast: 1.1,
    tint: '#fffaf0', shadowTint: '#081418', beam: 0.5, dust: 0.01, motes: 1.2,
    dome: { preset: 'day', zenith: '#6fa6e0', horizon: '#dfeaf2', sunIntensity: 9, clouds: { coverage: 0.42, softness: 0.4, scale: 1.2 } },
  },
  golden: {
    sun: '#ffbe78', sunPower: 5.0, sky: '#dfe2f4', shade: '#7a8490', fill: 1.5, back: '#e6c9a4', haze: 0.55,
    fog: '#e8d6bc', fogDensity: 0.0024, ring: '#fff0d6', exposure: 0.94, bloom: 0.32, saturation: 1.12, contrast: 1.09,
    tint: '#fff4e2', shadowTint: '#0c1018', beam: 0.55, dust: 0.011, motes: 1.3,
    dome: { preset: 'goldenHour', sunIntensity: 9, clouds: { coverage: 0.4, softness: 0.4, scale: 1.2 } },
  },
  dawn: {
    sun: '#ffc4b0', sunPower: 4.4, sky: '#dfe0f6', shade: '#74809c', fill: 1.5, back: '#e2cfd6', haze: 0.7,
    fog: '#e2d6de', fogDensity: 0.0026, ring: '#fff0ea', exposure: 0.96, bloom: 0.3, saturation: 1.1, contrast: 1.08,
    tint: '#fff4f2', shadowTint: '#100c14', beam: 0.5, dust: 0.012, motes: 1.1, mist: 0.055, mistColor: '#fbeeea',
    dome: { preset: 'dawn', sunIntensity: 7, clouds: { coverage: 0.45, softness: 0.45, scale: 1.2 } },
  },
  night: {
    sun: '#fff0d2', sunPower: 4.6, sky: '#dde8fb', shade: '#70908c', fill: 1.7, back: '#c3d2de', haze: 0.5,
    fog: '#d9e3ec', fogDensity: 0.0023, ring: '#f6f6f2', exposure: 0.9, bloom: 0.28, saturation: 1.12, contrast: 1.09,
    tint: '#fffaf2', shadowTint: '#0a1216', beam: 0.45, dust: 0.01, motes: 1.0,
    dome: { preset: 'day', zenith: '#6a9fdc', horizon: '#e4edf4', sunIntensity: 8, clouds: { coverage: 0.62, softness: 0.45, scale: 1.4 } },
  },
};

export async function buildAir(ctx, o) {
  const THREE = o.THREE, L = o.L, object = new THREE.Group();
  // ---- the sky behind the glass: the kit's dome as the look deals it (L.dome), its sun where the plan's light comes from
  const sky = makeSky({ rng: o.rngFor('sky'), ...L.dome, sunDirection: o.lightDir.clone() });
  object.add(sky.object);
  await ctx.yield();
  // ---- the beams where the bars come down, and the dust that drifts in them
  const beams = makeBeams(THREE, L, o.lightDir);
  object.add(beams.mesh);
  await ctx.yield();
  const dust = makeDust(THREE, L, o.lightDir, o.rngFor('dust'), o.look.detail);
  object.add(dust.mesh);
  await ctx.yield();
  // ---- dawn's low mist over the meadow: soft banks lying in the grass, each a fixed thing of the world, 14 to 26 m
  // across and a fifth as high. A bank lies only where no part of it can reach the river, the scar, the terrace or
  // the lens: its middle keeps the widest bank's half width (13 m) from the river's edge, from the scar and from
  // the terrace, 14 m from the walls, and 15 m in plan from the flown line and its straight behind the entry, so
  // the lens never enters one. Their places are dealt by the stream 'mist-places'; the kit's own dice for each
  // bank's size and shape come from another, 'mist-banks'. The kit's near fade (given in bank widths) is set
  // inside 0.6 to 2.5 m of true distance for every width of bank; the flown line never comes that near.
  let mist = null;
  const clock = { value: 0 };
  if (L.mist > 0) {
    const r = o.rngFor('mist-places'), places = [], S = P.SHED, T = P.TERRACE, wide = [14, 26], reach = wide[1] / 2;
    for (let i = 0; i < 200 && places.length < 64; i++) {
      // every candidate's dice, then the test: a place on the hall's floor and how high the bank lies over the grass
      const x = S.x0 + 14 + (S.x1 - S.x0 - 28) * r(), z = S.zHead + 14 + (S.zDown - S.zHead - 28) * r(), lift = 1.2 + 2.2 * r();
      if (P.bankDistance(x, z) < reach || P.routeDistanceXZ(x, z) < reach + 2 || Math.abs(z - P.FALL_Z) < reach + 3) continue;
      if (x > T.x0 - reach && x < T.x1 + reach && z < T.z0 + reach) continue;
      places.push([x, P.groundHeight(x, z) + lift, z]);
    }
    mist = makeMist({ rng: o.rngFor('mist-banks'), positions: places, size: wide, color: L.mistColor, shadowColor: L.mistColor, opacity: L.mist, flatten: 0.22, ragged: 1.7, softness: 1.0,
      sunDir: o.lightDir, time: clock, near: [0.6 / wide[0], 2.5 / wide[1]] });
    object.add(mist.object);
    await ctx.yield();
  }
  // ---- what it costs, counted from what was made
  let triangles = 0, drawCalls = 0;
  object.traverse((m) => { if (m.isMesh) { drawCalls++; const g = m.geometry, n = g.index ? g.index.count : g.attributes.position.count; triangles += (n / 3) * (g.isInstancedBufferGeometry ? g.instanceCount : 1); } });
  const size = new THREE.Vector2();
  return {
    object, triangles, drawCalls,
    async prewarm(renderer, scene) { await sky.prewarm(renderer, null, scene); },
    update(dt, time, camera) {
      sky.update(dt, time, camera);
      clock.value = time;
      dust.material.uniforms.uTime.value = time;
      dust.material.uniforms.uViewH.value = ctx.renderer.getDrawingBufferSize(size).y;   // (for the dust's footprint filter)
    },
    dispose() {
      sky.dispose(); beams.geometry.dispose(); beams.material.dispose(); dust.geometry.dispose(); dust.material.dispose(); dust.table.dispose();
      if (mist) { mist.object.traverse((m) => { if (m.geometry) m.geometry.dispose(); }); mist.material.dispose(); }
    },
  };
}
