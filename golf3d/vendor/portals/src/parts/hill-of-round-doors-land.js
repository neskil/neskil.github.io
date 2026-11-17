// hill-of-round-doors, the land builder's part: THE LAND PUT TOGETHER. buildLand makes the land's one table of
// uniforms and its parts in order: the ground and its turf, the far downs, the stream; then where hedges, walls and
// trees stand, the shade they and the plan's great things throw (baked once), the hedges and walls, the trees, the
// blades of grass, the plants of the waterside, the stooks and kitchen plots, the animals. It hands back one object, its update and its counts.
import * as Flora from '../kit/flora.js';
import { landUniforms } from './hill-of-round-doors-land-glsl.js';
import { makeGround, makeRouteField } from './hill-of-round-doors-land-ground.js';
import { makeDowns, downsHeight } from './hill-of-round-doors-land-downs.js';
import { makeKinds } from './hill-of-round-doors-land-kinds.js';
import { makeWater } from './hill-of-round-doors-land-water.js';
import { layFields } from './hill-of-round-doors-land-fields.js';
import { makeShade } from './hill-of-round-doors-land-shade.js';
import { makeHedges } from './hill-of-round-doors-land-hedges.js';
import { makeTrees } from './hill-of-round-doors-land-trees.js';
import { makeGrass } from './hill-of-round-doors-land-grass.js';
import { makeWaterside } from './hill-of-round-doors-land-waterside.js';
import { makeLife } from './hill-of-round-doors-land-life.js';
import { makeThings } from './hill-of-round-doors-land-things.js';
import { TREE, OAK, MILL, HOMES } from './hill-of-round-doors-plan.js';

export const SHADE_BOX = [-280, -330, 380, 330];               // x0, z0, x1, z1: the ground the baked shade covers

// o: { THREE, R (the land's streams by name), look (the look with the land's own extras), fog, sky, path }
export async function buildLand(ctx, o) {
  const { THREE, R, look, fog, sky, path } = o, group = new THREE.Group(); group.name = 'hill-land';
  // the visit's own deal of the fields (which is pasture, which hay, which just mown)
  const farSeed = R.fields();
  const uniforms = landUniforms(THREE, { ...look, farSeed }, fog), parts = [];
  const add = (part) => { parts.push(part); group.add(part.object); return part; };
  const routeField = await makeRouteField(ctx);
  // what grows where (the land's fields and drifts): the ground's paint and the plants both ask it
  const kinds = makeKinds(ctx.core.makeNoise(R.fields.int(1, 2147483646)), farSeed);
  const ground = add(await makeGround(ctx, { THREE, rng: R.ground, uniforms, look, routeField, kinds }));
  await ctx.yield();
  const downsNoise = ctx.core.makeNoise(R.downs.int(1, 2147483646));
  add(await makeDowns(ctx, { THREE, noise: downsNoise, uniforms }));
  await ctx.yield();
  const heightAt = ground.heightAt;
  const water = add(makeWater(ctx, { THREE, sky, uniforms, heightAt }));
  await ctx.yield();
  // ---- where the hedges, walls and trees stand
  const lay = await layFields(ctx, { rng: R.hedges, rngTrees: R.trees, kinds, routeField, heightAt, sun: look.sun, density: look.density,
    farHeightAt: (x, z) => Math.max(heightAt(x, z), downsHeight(downsNoise, x, z)) });
  // ---- the shade of everything that stands: the plan's two great trees and the mill, our trees, hedges and walls
  const shade = await makeShade(ctx, { THREE, box: SHADE_BOX, size: 768, sun: look.sun, heightAt, step: 6 });
  const sl = Math.hypot(look.sun.x, look.sun.z) || 1e-3, px = look.sun.z / sl, pz = -look.sun.x / sl;      // across the sun's way, in plan
  for (const t of [TREE, OAK]) {
    const y = heightAt(t.x, t.z); shade.crown({ x: t.x, y: y + t.height * 0.66, z: t.z, r: t.crown, ry: t.height * 0.32, dense: 0.8 });
    shade.face(t.x - px * t.trunk, t.z - pz * t.trunk, t.x + px * t.trunk, t.z + pz * t.trunk, t.height * 0.5, 0.95);
    await ctx.yield();
  }
  shade.face(MILL.x0, MILL.z0, MILL.x1, MILL.z0, MILL.eaves + 4); shade.face(MILL.x1, MILL.z0, MILL.x1, MILL.z1, MILL.eaves + 4);
  shade.face(MILL.x1, MILL.z1, MILL.x0, MILL.z1, MILL.eaves + 4); shade.face(MILL.x0, MILL.z1, MILL.x0, MILL.z0, MILL.eaves + 4);
  let n = 0;
  for (const t of lay.trees) { shade.crown({ x: t.x, y: t.y + t.h * 0.62, z: t.z, r: t.r, ry: t.h * 0.34, dense: 0.82 }); if ((++n & 7) === 7) await ctx.yield(); }
  for (const t of lay.far) if (t.d < 330) { shade.crown({ x: t.x, y: t.y + t.h * 0.55, z: t.z, r: t.h * 0.5, ry: t.h * 0.42, dense: 0.8 }); if ((++n & 15) === 15) await ctx.yield(); }
  for (const run of lay.runs) { for (let i = 0; i < run.pts.length - 1; i++) { const a = run.pts[i], b = run.pts[i + 1]; shade.face(a.x, a.z, b.x, b.z, Math.min(a.h, b.h), run.wall ? 0.95 : 0.88); } if ((++n & 15) === 15) await ctx.yield(); }
  // the lamplight on the ground: under the party tree's lanterns, before each home's door and windows, by the mill
  shade.pool(TREE.x, TREE.z, TREE.crown + 20, 0.8); shade.pool((MILL.x0 + MILL.x1) / 2, MILL.z0 - 6, 16, 0.4);
  for (const h of HOMES) shade.pool(h.x + h.fx * 5, h.z + h.fz * 5, 10, 0.5);
  const shadeTex = shade.texture(); uniforms.uShade.value = shadeTex;
  uniforms.uShadeBox.value.set(SHADE_BOX[0], SHADE_BOX[1], 1 / (SHADE_BOX[2] - SHADE_BOX[0]), 1 / (SHADE_BOX[3] - SHADE_BOX[1]));
  await ctx.yield();
  // ---- what stands and grows (the kit's leaf atlas is drawn once, in steps, and shared)
  const wind = Flora.makeWind({ direction: look.wind, strength: 0.8 * look.windStrength, speed: 0.9 });
  const leafOptions = { wind, backlight: 0.8, ambient: 1.5, leafAmbient: 1.3 };
  await Flora.prepareLeafTexture(leafOptions, ctx.yield);
  const leaf = Flora.windMaterial(leafOptions);
  add(makeHedges(ctx, { THREE, runs: lay.runs, uniforms, look }));
  await ctx.yield();
  add(await makeTrees(ctx, { THREE, rng: R.trees, trees: lay.trees, far: lay.far, uniforms, material: leaf }));
  await ctx.yield();
  const grass = add(await makeGrass(ctx, { THREE, rng: R.blades, path, kinds, routeField, heightAt, shade, look, wind, map: leaf.map, density: look.density, detail: look.detail }));
  await ctx.yield();
  add(makeWaterside(ctx, { THREE, rngReeds: R.reeds, rngLilies: R.lilies, routeField, heightAt, material: leaf, density: look.density }));
  await ctx.yield();
  add(await makeThings(ctx, { THREE, rng: R.things, kinds, routeField, heightAt, uniforms }));
  await ctx.yield();
  add(await makeLife(ctx, { THREE, R, look, path, heightAt, uniforms, density: look.density }));
  await ctx.yield();
  let triangles = 0; for (const p of parts) triangles += p.triangles || 0;
  return {
    object: group, uniforms, ground, water, grass, lay, shade, kinds, routeField, triangles, heightAt,
    update(dt, time, u, camera) { uniforms.uTime.value = time; wind.update(time); for (const p of parts) if (p.update) p.update(dt, time, u, camera); },
    dispose() { for (const p of parts) if (p.dispose) p.dispose(); shadeTex.dispose(); leaf.map.dispose(); leaf.dispose(); },
  };
}
