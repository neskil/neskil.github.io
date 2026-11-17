// valley-inside-the-works: THE CHOCOLATE (the chocolate builder's part): every liquid in the world.
// The river of melted chocolate from the downstream wall to the head pool (it lies level in its bed at the plan's
// liquidY and ends at the wet earth with a thin line of froth), the fall, and the cream that the spring (plan: CREAM)
// draws down the river (the upper river carries two wandering bands of cream of its own). Everything stands where the plan puts it, in metres; nothing reads the lens (the shader's
// sheen and mirror do).
// Where others' things stand or lie in it the liquid answers them, all in the shader: the stone piers, the seven
// intakes, the great pipe's foot (plan: GREAT_PIPE) and the moored boat's waterline (plan: BOAT; its hull's line at
// the liquid's face comes from the shed's boat file through the pool file's HULL).
// Streams of the seed: 'chocolate' (where the flow lines, the folds and the marbling lie), 'fall' (which way round the
// fall's tongues stand, their widths and weights, where the webs between them thin into windows, where the strands
// hang and which of them shed a drop, the folds at its foot, the blots on the pool's banks), 'cream-basin' (the wear
// of the basin's stone).
// Look fields: hour (the gloss; and the hold, which keeps the body brown through that hour's grade on the page).
import * as P from './valley-inside-the-works-plan.js';
import { chocolateMaterial } from './valley-inside-the-works-chocolate-glsl.js';
import { makeAcc, streamV, riverReach, SHORE } from './valley-inside-the-works-chocolate-river.js';
import { fallShapes, sagOf, upperHalf, ZA, ROCK_BACK, NOTCH } from './valley-inside-the-works-chocolate-lip.js';
import { addSheet, addBacking, addDrops } from './valley-inside-the-works-chocolate-sheet.js';
import { addHeap, addSplashes } from './valley-inside-the-works-chocolate-heap.js';
import { basinGeometry, addCream, creamDress } from './valley-inside-the-works-chocolate-cream.js';
import { riverPiers, addDimples } from './valley-inside-the-works-chocolate-pool.js';
import { addTroughs, addHeadPool } from './valley-inside-the-works-chocolate-head.js';

// Where the cream enters the river, in stream metres (the shader draws its reach from there).
const V_SPRING = streamV(P.CREAM.z);

export async function buildChocolate(ctx, o) {
  const THREE = o.THREE, object = new THREE.Group();
  const rng = o.rngFor('chocolate');
  const gloss = o.look.hour === 'night' ? 1.3 : (o.look.hour === 'dawn' ? 1.08 : 1);
  const piers = riverPiers();                                             // (the shader lays the rings, the dent and the trail round each)
  const material = chocolateMaterial(THREE, o, { seedU: rng() * 200, seedV: rng() * 900, gloss, spring: V_SPRING, piers });
  await ctx.yield();
  const acc = makeAcc();
  const F = fallShapes(o.rngFor('fall'));
  // the lower river: from the downstream wall up to the rock behind the fall (finer rows in the pool under the fall)
  const lower = [];
  for (let z = P.SHED.zDown + 0.5; z > 73.75; z -= 1) lower.push(z);
  for (let z = 73.5; z > 66.6; z -= 1 / 3) lower.push(z);                 // finer where the cream lands
  for (let z = 66.5; z > -30.25; z -= 1) lower.push(z);
  for (let z = -30.5; z > -41.2; z -= 0.5) lower.push(z);                 // (the pool runs on behind the fall and into the rock)
  const low = (z) => Math.max(z, P.FALL_Z);
  const lowerDress = { speed: 1.5, nominal: 8, half: (z) => P.riverHalfWidth(low(z)), level: (z) => P.riverY(low(z)), dress: (u, v, z, x) => (z - P.CREAM.z > -4 && z - P.CREAM.z < 7.5 && creamDress(u, v, z, x)) || null };
  const cut = Math.ceil(lower.length / 10);                               // (ten parts that share a row each, a breath after each)
  for (let k = 0; k < lower.length - 1; k += cut) { riverReach(acc, lower.slice(k, k + cut + 1), lowerDress); await ctx.yield(); }
  // the upper river: from the lip to the head pool
  // (the fall's own sheet lies over it from its first row; where the rock opens into the notch, at ROCK_BACK, the
  // liquid fills the notch from side to side: the stream spreads slowly, the corners beside it are slack)
  const upper = [ZA + 0.35, ZA - 0.4, -43.7, ROCK_BACK + 0.03, ROCK_BACK - 0.03];
  for (let z = -45; z >= P.HEAD_Z; z -= 1) upper.push(z);
  // (it carries cream too: two long wandering bands of it, which the shader draws out into swirls; none near the lip)
  const upperCream = (u, v, z, x, s) => {
    const a = s - 0.55 * Math.sin(0.085 * v + 1.3), b = s + 0.5 * Math.sin(0.06 * v + 4.0) + 0.25;
    return { cream: Math.min(0.62 * Math.exp(-a * a / 0.07) + 0.5 * Math.exp(-b * b / 0.05), 0.75) * Math.min(Math.max((v - 2) / 12, 0), 1) * Math.min(Math.max((-45.5 - z) / 8, 0), 1) };
  };
  const upperDress = { speed: 1.2, nominal: 6.5, half: upperHalf, sag: sagOf, dress: upperCream,
    past: (z) => (z >= ROCK_BACK ? NOTCH + 0.4 - upperHalf(z) : 0.35), shore: (z) => (z >= ROCK_BACK ? NOTCH - SHORE : 6.5) - upperHalf(z) };
  const ucut = Math.ceil(upper.length / 6);                               // (six parts that share a row each, a breath after each)
  for (let k = 0; k < upper.length - 1; k += ucut) { riverReach(acc, upper.slice(k, k + ucut + 1), upperDress); await ctx.yield(); }
  for (const rows of addSheet(acc, F)) await ctx.yield();                 // (the fall's sheet: a few rows, a breath, a few rows)
  addBacking(acc, F);                                                     // (a thin fall close behind it: its windows show brown)
  await ctx.yield();
  addDrops(acc, F);
  (F.ends || []).slice(0, 8).forEach((e, i) => material.uniforms.uDrop.value[i].set(e.x, e.z + 0.06, e.s.per, e.s.ph));   // (where each drop lands: the shader lays its rings there)
  await ctx.yield();
  for (const rows of addHeap(acc, F)) await ctx.yield();                  // (the folds at its foot and their rings, likewise)
  addSplashes(acc, F);
  await ctx.yield();
  addDimples(acc);
  await ctx.yield();
  addTroughs(acc);
  await ctx.yield();
  addHeadPool(acc);
  await ctx.yield();
  // the cream spring: its stone basin (a lit stone under the plan's bars), the cream in it and the rope it pours
  addCream(acc);
  await ctx.yield();
  const stone = P.barMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 }));
  const basin = new THREE.Mesh(basinGeometry(THREE, o.rngFor('cream-basin')), stone);
  object.add(basin);
  await ctx.yield();
  let geometry = null;
  for (const g of acc.build(THREE)) { geometry = g; await ctx.yield(); }      // (the mesh and its normals, a part at a time)
  const river = new THREE.Mesh(geometry, material);
  river.frustumCulled = false;
  object.add(river);
  await ctx.yield();
  return {
    object,
    update(dt, time) {
      const un = material.uniforms;
      un.uTime.value = time;
      for (let i = 0; i < 4; i++) {            // where each roller is and how fast it travels (the plan's law)
        un.uRollZ.value.setComponent(i, P.rollerZ(i, time));
        un.uRollV.value.setComponent(i, (P.rollerZ(i, time + 0.02) - P.rollerZ(i, time - 0.02)) / 0.04);
      }
    },
    triangles: acc.idx.length / 3 + basin.geometry.index.count / 3, drawCalls: 2,
    dispose() { geometry.dispose(); material.dispose(); basin.geometry.dispose(); stone.dispose(); },
  };
}
