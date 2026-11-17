// hill-of-round-doors, the land builder's part: THE GROUND MESH, made from the plan's one ground function by the
// kit's own mesher (a quadtree, joined without cracks, one draw call). How fine it is at a place is chosen BY PLACE
// alone: by the plan's routeOver (two-metre cells out to about 50 m from the flown line in plan, four-metre cells to
// about 100 m, doubling with the distance beyond) and by the homes (makeHomeField below: half-metre cells along
// every front, one-metre cells over every garden). The lens chooses nothing. The mesh stands over the whole of the
// plan's ground out to the far downs; over the hall's footprint its triangles are left out (those wholly inside)
// and the turf's own shader leaves out the rest to the footprint's exact edge.
import * as T from '../kit/terrain.js';
import { groundY, routeOver, HOMES } from './hill-of-round-doors-plan.js';
import { wayAt, homeAt, homeFrame, inHall } from './hill-of-round-doors-land-lines.js';
import { makeTurfMaterial } from './hill-of-round-doors-land-turf.js';

export const NEAR_FLOOR = 26;                    // the least distance the flown line counts as for the mesher: no cell by the line is finer than 2 m
export const HOME_NEAR = 70;                     // metres from the flown line (in plan) inside which a home is meshed at its finest
export const GROUND_BOX = [-640, -448, 704, 448];   // x0, z0, x1, z1: the mesh's reach (the far downs rise before its edge)

// How fine the mesh must be about the homes, as the mesher's own measure (a distance: its cells are half a metre
// where it is under 12.7, one metre under 25.4, two under 50.8, and so on doubling; 17.5 times the distance to a
// thing is just enough to split every cell that touches the thing). The plan's ground is level before a home's
// front line and for 1.2 m behind it, then climbs the mound's face: a triangle reaching from before the line to the
// face would stand as a ramp against the home's wall and in its door. So along the line 0.6 m behind every front
// the cells are the finest (no triangle that crosses that line is long enough to reach from the front to the face:
// the mesh is level to the wall), and over every garden with its blended edges and the mound's face they are 1 m.
// A home farther than HOME_NEAR from the flown line gets the same one step coarser (1 m along the line, 2 m about:
// there the ground may stand up to a tenth of a metre off the garden's level at the wall).
export function makeHomeField(routeField) {
  const H = HOMES.map((h) => ({ h, line: routeField(h.x, h.z) < HOME_NEAR ? 0 : 13, box: routeField(h.x, h.z) < HOME_NEAR ? 13 : 26 })), f = { u: 0, v: 0 };
  return (x, z) => {
    let best = 1e9;
    for (const { h, line, box } of H) {
      if (Math.abs(x - h.x) > 64 || Math.abs(z - h.z) > 64) continue;
      homeFrame(h, x, z, f);
      const au = Math.abs(f.u), lu = Math.max(0, au - h.w), lv = f.v - 0.6, bu = Math.max(0, au - h.w - 2.5), bv = Math.max(0, -10.5 - f.v, f.v - 2.7);
      best = Math.min(best, Math.max(line, 17.5 * Math.sqrt(lu * lu + lv * lv)), Math.max(box, 17.5 * Math.sqrt(bu * bu + bv * bv)));
    }
    return best;
  };
}

// How far a place is from the flown line in plan: the plan's routeOver, read once on a lattice STEP metres wide and
// mixed between its nodes (the mesher asks many thousand times).
export async function makeRouteField(ctx, box = GROUND_BOX, STEP = 8) {
  const nx = Math.ceil((box[2] - box[0]) / STEP), nz = Math.ceil((box[3] - box[1]) / STEP), S = nx + 1, F = new Float32Array(S * (nz + 1));
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) F[j * S + i] = routeOver(box[0] + i * STEP, box[1] + j * STEP).dist;
    if ((j & 15) === 15) await ctx.yield();
  }
  return (x, z) => {
    const fx = Math.min(nx - 1e-3, Math.max(0, (x - box[0]) / STEP)), fz = Math.min(nz - 1e-3, Math.max(0, (z - box[1]) / STEP));
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * S + i;
    return (F[k] * (1 - u) + F[k + 1] * u) * (1 - v) + (F[k + S] * (1 - u) + F[k + S + 1] * u) * v;
  };
}

// o: { THREE, rng, uniforms, look, routeField, kinds }. Returns { object, terrain, material, triangles, heightAt, dispose }.
export async function makeGround(ctx, o) {
  const { THREE, rng, uniforms, look, routeField, kinds } = o;
  const material = makeTurfMaterial(THREE, uniforms, look);
  // (the kit's mesher wants a detail picture for its own material; ours needs none, so it is handed one white texel, which
  // the turf material carries as a plain property so that it is freed with it)
  const blank = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); blank.needsUpdate = true; material.blank = blank;
  const homeField = makeHomeField(routeField);
  const terrain = await T.makeTerrainAsync({
    rng, noise: ctx.noise, height: groundY, bounds: GROUND_BOX, cell: 0.5, near: 6, levels: 7,
    focus: (x, z) => Math.min(Math.max(NEAR_FLOOR, routeField(x, z)), homeField(x, z)),
    refine: 0,
    corridor: false, sunDir: look.sun, shadow: 0.9, ao: 0.5, skirt: 0,
    color: (x, z, h, ny, out) => out.setRGB(1, 1, 1), materialInstance: material, detailTexture: blank, strata: { beds: [] },
  }, ctx.yield);
  await ctx.yield();
  // what the turf must know of each vertex's place: how far it lies from the way's middle line, said twice (signed,
  // over 0 on the hill's side and by the road and under 0 on the valley's side: between two vertices either side of
  // the middle line that is exact; and unsigned: that is what holds away from the way, where the side changes
  // between one way and the next and the signed distance would pass through 0 and draw a thread of earth), how
  // much of a home's mound and of a home's garden it is, how far it is from the flown line in plan, and the land's
  // own islands of long grass there
  const geo = terrain.geometry, pos = geo.attributes.position.array, nv = pos.length / 3, land = new Float32Array(nv * 4);
  const w = { d: 0, s: 0, y: 0, up: 0 }, h = { mound: 0, garden: 0, front: 0 };
  const kind = new Float32Array(nv * 2), k = { long: 0 };
  for (let i = 0; i < nv; i++) {
    const x = pos[i * 3], z = pos[i * 3 + 2], rd = routeField(x, z);
    if (rd < 260) {
      wayAt(x, z, w); homeAt(x, z, h);
      kind[i * 2 + 1] = Math.min(30, w.d); land[i * 4] = kind[i * 2 + 1] * (w.up < 0 ? -1 : 1); land[i * 4 + 1] = h.mound; land[i * 4 + 2] = h.garden;
    } else { kind[i * 2 + 1] = 30; land[i * 4] = 30; }
    land[i * 4 + 3] = Math.min(400, rd);
    kind[i * 2] = kinds.fields(x, z, pos[i * 3 + 1], k).long;
    if ((i & 2047) === 2047) await ctx.yield();
  }
  geo.setAttribute('aLand', new THREE.BufferAttribute(land, 4));
  geo.setAttribute('aKind', new THREE.BufferAttribute(kind, 2));
  // the hall's footprint: the triangles wholly inside it are left out of the mesh
  const idx = geo.index.array, keep = new idx.constructor(idx.length); let n = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    if (inHall(pos[a], pos[a + 2]) && inHall(pos[b], pos[b + 2]) && inHall(pos[c], pos[c + 2])) continue;
    keep[n++] = idx[t]; keep[n++] = idx[t + 1]; keep[n++] = idx[t + 2];
  }
  geo.setIndex(new THREE.BufferAttribute(keep.subarray(0, n), 1));
  terrain.object.name = 'hill-ground'; terrain.object.frustumCulled = false;
  return { object: terrain.object, terrain, material, triangles: n / 3, heightAt: terrain.surfaceAt,
    dispose() { terrain.dispose(); blank.dispose(); } };
}
