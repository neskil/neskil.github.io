// bridges-of-marigold, THE AIR (design, section 8): everything that is not the city. This file puts the air's parts
// together, one part per kind of thing, each in a file of its own:
//   -air-sky      the night sky and its stars            -air-gulf     the black water and the bed of mist
//   -air-bridges  the three petal bridges                -air-petals   the petals adrift on the air
//   -air-shed     the petals the bridges shed            -air-lines    where the canyon's hangings run
//   -air-lamps    the strings of coloured lamps          -air-flags    the lines of cut-paper flags
//   -air-trams    every line's cord; the three trams     -air-far      the far towers of the city without end
//   -air-hills    the far hills and their candle points  -air-fire     moths at the lamps; the fireworks
//   -air-glsl     the shader text they share (the plan's bridges and towers, the petal, the sway, a point of light)
// Each part returns { object, update(dt, time, camera, u), triangles, drawCalls, dispose() }.
// Nothing here is placed, shown, hidden or lit by the lens, the frame, a seed's number or the wall clock.
import { buildSky, HOURS } from './bridges-of-marigold-air-sky.js';
import { buildGulf } from './bridges-of-marigold-air-gulf.js';
import { buildBridges } from './bridges-of-marigold-air-bridges.js';
import { buildShed } from './bridges-of-marigold-air-shed.js';
import { buildAdrift } from './bridges-of-marigold-air-petals.js';
import { layLines } from './bridges-of-marigold-air-lines.js';
import { buildLamps } from './bridges-of-marigold-air-lamps.js';
import { buildFlags } from './bridges-of-marigold-air-flags.js';
import { buildTrams } from './bridges-of-marigold-air-trams.js';
import { buildFar } from './bridges-of-marigold-air-far.js';
import { buildHills } from './bridges-of-marigold-air-hills.js';
import { buildFire } from './bridges-of-marigold-air-fire.js';
import { routeHeightAt } from './bridges-of-marigold-plan.js';

export { HOURS };

export async function buildAir(ctx, o) {
  const { THREE, S, look } = o, H = HOURS[look.hour];
  const group = new THREE.Group(), parts = [];
  const U = { uTime: { value: 0 }, uPx: { value: 0.0025 } };          // the world's clock; one pixel's angle (radians)
  // the lamps' five colours (design, section 3), linear, and shared by the lamps, the flags' wash, the water and the mist
  const lampColors = { teal: new THREE.Color('#14d6c4'), magenta: new THREE.Color('#ff2f92'), orange: new THREE.Color('#ff8a1e'), violet: new THREE.Color('#9a4cff'), lime: new THREE.Color('#a6f02a') };
  const add = (p) => { parts.push(p); group.add(p.object); return p; };
  const common = { THREE, look, U, H, lampColors, path: o.path };

  const sky = add(await buildSky(ctx, { THREE, rng: S.sky, hour: look.hour, U, detail: look.detail }));
  await ctx.yield();
  add(await buildGulf(ctx, common));
  await ctx.yield();
  const bridges = add(await buildBridges(ctx, { ...common, S }));
  await ctx.yield();
  add(await buildShed(ctx, { ...common, rng: S.shed, bridges: bridges.bridges, shapes: bridges.shapes }));
  await ctx.yield();
  add(await buildAdrift(ctx, { ...common, rng: S.adrift, rngStream: S.stream }));
  await ctx.yield();
  // the canyon's hangings: one deal of lines, then what hangs on them
  const lines = await layLines(S.lines, look.density, routeHeightAt, ctx.yield);
  await ctx.yield();
  const lamps = add(await buildLamps(ctx, { ...common, rng: S.lamps, lines }));
  await ctx.yield();
  add(await buildFlags(ctx, { ...common, rng: S.flags, lines }));
  await ctx.yield();
  const trams = add(await buildTrams(ctx, { ...common, lines, westShare: o.westShare }));
  await ctx.yield();
  add(await buildFar(ctx, { ...common, rng: S.far }));
  await ctx.yield();
  add(await buildHills(ctx, { ...common, noise: S.crest, rngCandles: S.candles }));
  await ctx.yield();
  add(await buildFire(ctx, { ...common, rngMoths: S.moths, rngFireworks: S.fireworks, near: lamps.near }));
  await ctx.yield();

  const size = new THREE.Vector2();
  return {
    object: group, sky, trams, lines,
    get triangles() { return parts.reduce((n, p) => n + (p.triangles || 0), 0); },
    get drawCalls() { return parts.reduce((n, p) => n + (p.drawCalls || 0), 0); },
    update(dt, time, camera, u) {
      U.uTime.value = time;
      // one pixel's angle, from the picture's own height (it changes while the world is on screen)
      const h = ctx.renderer && ctx.renderer.getDrawingBufferSize ? (ctx.renderer.getDrawingBufferSize(size).y || 1080) : 1080;
      if (camera && camera.projectionMatrix) U.uPx.value = 2 / (camera.projectionMatrix.elements[5] * h);
      for (const p of parts) p.update(dt, time, camera, u);
    },
    prewarm(renderer, scene) { return sky.prewarm(renderer, scene); },
    dispose() { for (const p of parts) p.dispose(); },
  };
}
