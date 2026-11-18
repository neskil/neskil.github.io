// valley-inside-the-works: THE SHED (the shed builder's part): the building that holds the valley, seen from inside.
// The saw-tooth roof with its glass, the lattice girders and trusses, the cast-iron columns and their stone piers, the
// brick walls with their windows, galleries, stairs and doors, the round windows of the head wall, the stone terrace
// at the head with its four troughs and their granite rollers; and, moored in the lower river, the boat of rose
// boiled sugar (its own piece says how it is drawn and moved). Everything stands where the plan module puts it.
// THE HEAD IS SWEETENED, all by place: the head wall's four glazed round windows are of swirled sugar glass, the
// columns on the terrace and within 25 m of its front are painted as canes, and round the way out, wholly outside its
// iron ring, a rosette of separate sweets (gumdrops, peppermint discs, humbugs) lies on the brick under a great arch.
// THROUGH EVERY PANE THE SKY: blue with sunlit cumulus that drifts by the clock, drawn by the direction looked along.
// The join: buildShed(ctx, o) with o = { THREE, rngFor, lightDir, look } -> { object, update(dt, time, u), triangles,
// drawCalls, dispose() }. The lens is read only in the shaders: by the footprint filter, by the sky beyond the glass
// (the eye's own ray from cameraPosition through the pane: a sky is drawn by direction, round whichever eye looks) and
// by the flutes' tilt (viewMatrix carries the upright axis into view space); nothing is placed, hidden or timed by
// it. The rollers go by the plan's rollerZ(i, time), the clouds' drift and the sugar windows' slow turn by the clock.
import * as P from './valley-inside-the-works-plan.js';
import { makeMesh } from './valley-inside-the-works-shed-mesh.js';
import { makeMaterials } from './valley-inside-the-works-shed-mats.js';
import { buildRoof } from './valley-inside-the-works-shed-roof.js';
import { buildColumns } from './valley-inside-the-works-shed-columns.js';
import { buildWalls } from './valley-inside-the-works-shed-walls.js';
import { buildHead } from './valley-inside-the-works-shed-head.js';
import { buildBoat } from './valley-inside-the-works-shed-boat.js';

export async function buildShed(ctx, o) {
  const THREE = o.THREE, object = new THREE.Group();
  object.name = 'valley-shed';
  const mats = makeMaterials(THREE, o);
  const clear = { min: 1e9, what: '', at: [0, 0, 0] };
  const kit = {
    THREE, ctx, o, mats, object, makeMesh, solid: makeMesh(), lace: makeMesh(), glass: makeMesh(), owned: [], movers: [], calls: 0, triangles: 0, clear,
    // count the clear air a point of the shed leaves against the flown line. Left out of the count: everything more
    // than 28 m to either side of the hall's middle, and everything beyond z 204 (the downstream wall and what stands
    // on it: the plan sets that wall at z 210, where the 60 m straight behind the entry ends)
    air(x, y, z, what) {
      if (Math.abs(x) > 28 || z > P.SHED.zDown - 6) return;
      const d = P.routeDistance(x, y, z);
      if (d < clear.min) { clear.min = d; clear.what = what; clear.at = [x, y, z]; }
    },
  };
  await ctx.yield();                                             // (the materials are made: a breath before the first piece)
  await buildRoof(kit);
  await ctx.yield();
  await buildColumns(kit);
  await ctx.yield();
  await buildWalls(kit);
  await ctx.yield();
  await buildHead(kit);
  await ctx.yield();
  await buildBoat(kit);
  await ctx.yield();
  // the three gathered meshes: each one's vertices go to the air count, the lace is put in its drawing order, each is made
  for (const [name, mesh, mat] of [['solid', kit.solid, mats.solid], ['glass', kit.glass, mats.glass], ['lace', kit.lace, mats.lace]]) {
    if (!mesh.triangles) continue;
    for (let i = 0; i < mesh.vertices; i += 3000) { mesh.each((x, y, z) => kit.air(x, y, z, name), i, i + 3000); await ctx.yield(); }
    if (name === 'lace') mesh.sortBy((x, y, z) => (y > 47.5 ? -10000 : 0) + z);     // the roof's lace first, each far to near up the hall
    await ctx.yield();
    const g = await mesh.buildInSteps(THREE, () => ctx.yield()), obj = new THREE.Mesh(g, mat);
    obj.name = 'shed-' + name; obj.frustumCulled = false;
    if (name === 'lace') obj.renderOrder = -1;
    object.add(obj); kit.owned.push(g); kit.triangles += mesh.triangles; kit.calls++;
    await ctx.yield();
  }
  object.userData.clearAir = clear; object.userData.count = { triangles: kit.triangles, drawCalls: kit.calls };
  return {
    object, triangles: kit.triangles, drawCalls: kit.calls, clearAir: clear,
    update(dt, time, u) {
      mats.uniforms.uShedTime.value = time;
      for (const mv of kit.movers) mv(dt, time, u);
    },
    dispose() { for (const x of kit.owned) if (x && x.dispose) x.dispose(); for (const mt of mats.all) mt.dispose(); },
  };
}
