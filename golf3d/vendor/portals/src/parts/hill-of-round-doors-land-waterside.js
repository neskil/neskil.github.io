// hill-of-round-doors, the land builder's part: WHAT GROWS AT THE WATER. Reeds in clumps along both banks of the
// stream and round the pond, yellow flag irises among them at the water's edge, lily pads with their flowers on the
// pond's quiet water and above the bridge: all the kit's own plants (src/kit/flora.js makeReeds, makeFlowers,
// makeLilyPads) on places of our own, drawn by the land's shared wind material and swaying in the same wind.
// None stands by the bridge, by the mill, its wheel pit and race wall, or in the weir's run; reeds keep REED_CLEAR m from the flown line in plan.
import * as Flora from '../kit/flora.js';
import { streamZ, streamHalf, WATER } from './hill-of-round-doors-plan.js';
import { nearWorks } from './hill-of-round-doors-land-lines.js';
import { WEIR } from './hill-of-round-doors-land-water.js';

export const REED_CLEAR = 12;

// o: { rngReeds, rngLilies, routeField, heightAt, material, shade, density }
export function makeWaterside(ctx, o) {
  const { THREE, rngReeds: rr, rngLilies: rl, routeField, heightAt, material, density } = o, reeds = [], irises = [], pads = [];
  const byWeir = (x) => x > WEIR.x1 - WEIR.run - 3 && x < WEIR.x0 + 4;
  // ---- reeds and irises: beds of a few clumps each, at the water's edge on either bank
  const beds = Math.round(22 * density);
  for (let b = 0; b < beds; b++) {
    const x0 = rr.range(-175, 150), north = rr() < 0.5, len = rr.range(5, 14), n = 2 + Math.floor(rr() * 4);
    for (let i = 0; i < n; i++) {
      const x = x0 + rr.range(-0.5, 0.5) * len, out = rr.range(-0.6, 2.4), s = rr.range(1.25, 2.1), rot = rr.range(0, 6.283), iris = rr(), ix = rr.range(-2.5, 2.5), io = rr.range(1.6, 3.2);     // the clump's dice, before any test
      const edge = streamHalf(x) + out, z = streamZ(x) + (north ? -edge : edge);
      if (Math.abs(x) < 14 || nearWorks(x, z) || nearWorks(x, z + (north ? 6 : -6)) || byWeir(x) || routeField(x, z) < REED_CLEAR) continue;
      reeds.push({ x, y: Math.max(WATER - 0.35, heightAt(x, z)), z, s, rot, d: 0, u: 0 });
      if (iris < 0.75) { const zi = streamZ(x + ix) + (north ? -1 : 1) * (streamHalf(x + ix) + io); irises.push({ x: x + ix, y: heightAt(x + ix, zi), z: zi, s: s * 1.5, rot, d: 0, u: 0 }); }
    }
  }
  // ---- lily pads: on the pond above the weir and on the slow water above the bridge, toward the banks
  for (let i = 0; i < Math.round(44 * density); i++) {
    const up = rl() < 0.4, x = up ? rl.range(15, 72) : rl.range(-47, -12), north = rl() < 0.5, inn = rl.range(1.6, 7.5), s = rl.range(1.3, 2.4), rot = rl.range(0, 6.283);
    if (!up && north) continue;                                   // (the mill's race and its wall lie along the pond's north side)
    const z = streamZ(x) + (north ? -1 : 1) * (streamHalf(x) - inn);
    if (nearWorks(x, z)) continue;
    pads.push({ x, y: WATER, z, s, rot, d: 0, u: 0 });
  }
  const group = new THREE.Group(); group.name = 'hill-waterside';
  const parts = [
    Flora.makeReeds({ rng: rr.fork('reeds'), points: reeds, material, tint: 0.16 }),
    Flora.makeFlowers({ rng: rr.fork('irises'), points: irises, material, colors: undefined, petalColors: ['#f2d22c', '#f6dc48', '#e8c020'], chunks: 1 }),
    Flora.makeLilyPads({ rng: rl.fork('pads'), points: pads, material, waterY: WATER + 0.03 }),
  ];
  let triangles = 0; for (const p of parts) { group.add(p.object); triangles += p.triangles || 0; }
  return { object: group, triangles, counts: { reeds: reeds.length, irises: irises.length, pads: pads.length },
    update(dt, time, u, camera) { for (const p of parts) p.update(dt, time, camera); },
    dispose() { for (const p of parts) for (const m of p.meshes || []) { m.geometry.dispose(); m.dispose(); } } };
}
