// valley-inside-the-works: THE MEADOW (the meadow builder's part). The valley's ground from the plan, the rock scar,
// the hay meadow in flower with its confectioner's craft, the sweets that stand in it as its tallest plants (candy
// canes, great lollipops, toadstools, gumdrops), the trees, the field walls, the birds and insects.
// The join: buildMeadow(ctx, o) with o = { THREE, rngFor, lightDir, look } -> { object, update(dt, time, u), triangles, drawCalls, dispose() }.
// Nothing in this file reads the lens. Its materials' shaders read the eye only for what the laws allow: a level of
// detail by distance, the sheen and the glints, a thread's breadth (see the sugar's and the ground's own files).
// WHAT IS DRAWN: all that can stand in the picture, the whole flight; the upper valley's floor too, from the entry on
// (it shows through the fall's notch and over the valley's sides). Only what lies BEHIND the flown line's own point
// for good is put away: the line's z falls all the way and the lens looks up the valley, so the lower valley's far
// part (its ground, fringes and walls down to z 30) goes once the line's point is 6 m past it, and the rest of the
// lower valley with the scar once it is 2.4 m past the scar's back. The planting comes and goes by stretches: a
// stretch is drawn from beyond the range at which its own material has drawn it in to nothing, and goes when it
// lies behind the line's point.
// THE BUDGET is held by the build itself. Everything that is drawn is counted first; then the lower valley's
// planting is dealt into what is left of LOW_CAP (dealt again thinner if a deal would not fit), and the upper valley's
// planting is thinned evenly until every view from the scar's approach on stands inside UP_CAP (HEAD_CAP once the
// lower valley and the scar are put away: the hall's own ironwork is at its heaviest in the picture there).
// THE SWEETS stand outside those caps, with a count of their own on top: 69,680 triangles and four draw calls at
// most (see their file), less what a place of the line has already behind it. The scar's rock candy is counted
// with the scar, inside the lower valley's cap.
// TWO RULES OF THE ROOM are kept by every deal here: no tree stands higher than 3 m under the roof's girders (the
// trees' file), and nothing taller than 4 m stands on the wedge of ground between the way in and the great pipe
// (the field file's sightGap: trees, tall sweets, toadstools, reeds and the field walls each ask it).
import * as P from './valley-inside-the-works-plan.js';
import { makeField, NX, NZ, NCH } from './valley-inside-the-works-meadow-field.js';
import { groundGeometry, turfTexture, grainTexture, bladesTexture, driftTexture, groundMaterial } from './valley-inside-the-works-meadow-ground.js';
import { scarGeometry } from './valley-inside-the-works-meadow-scar.js';
import { sugarShared, sugarMaterial } from './valley-inside-the-works-meadow-sugar.js';
import * as FORM from './valley-inside-the-works-meadow-forms.js';
import { plantMeadow, routeTable, meshesFrom } from './valley-inside-the-works-meadow-plant.js';
import { plantUpper, UP_TOP, UP_MAX } from './valley-inside-the-works-meadow-upper.js';
import { makeKinds } from './valley-inside-the-works-meadow-kinds.js';
import { dealTrees, buildTrees, firstHawthorn, TREE_LOD } from './valley-inside-the-works-meadow-trees.js';
import { farMeadow, fieldWalls, dealWalls } from './valley-inside-the-works-meadow-far.js';
import { meadowLife, petalDrift, dawnHaze } from './valley-inside-the-works-meadow-life.js';
import { dealSweets } from './valley-inside-the-works-meadow-sweets-deal.js';
import { buildSweets } from './valley-inside-the-works-meadow-sweets.js';
import { rockCandy } from './valley-inside-the-works-meadow-sweets-rock.js';

const LOW_CAP = 204000, UP_CAP = 248000, HEAD_CAP = 246000, LOW_CALLS = 58, UP_FROM = UP_TOP + UP_MAX;   // (no plant of the upper valley is drawn from further down than UP_FROM)
const FAR_TO = 30 - 6, LOW_TO = -44.6 - 2.4;      // the line's z past which the lower valley's far part (it ends at z 30), and then all of it with the scar (its back is at z -44.6), lies behind the line's point and is put away

export async function buildMeadow(ctx, o) {
  const THREE = o.THREE, object = new THREE.Group(), owned = [];
  object.name = 'valley-meadow';
  const field = await makeField(ctx);
  // the field walls' lines and the trees' places first: every plant keeps off a wall, and the shade under the trees shapes the planting
  const walls = await dealWalls(o, firstHawthorn(), () => ctx.yield()); field.wallDistance = walls.distance;
  await ctx.yield();
  const sites = await dealTrees(o, walls, () => ctx.yield()); field.addShade(sites);
  await ctx.yield();
  // ... and the sweets' places, which keep off both: no meadow plant grows within a sweet's cover (the hook the plants
  // ask answers for the walls and the sweets alike: a plant keeps 1.4 m from a wall's line and 0.25 m out of a cover)
  const sweetDeal = await dealSweets(ctx, o, walls, sites);
  field.wallDistance = (x, z) => Math.min(walls.distance(x, z), sweetDeal.cover(x, z) + 1.15);
  await ctx.yield();
  // 1. THE GROUND
  const grain = await grainTexture(ctx, THREE, o.rngFor('meadow-grain')); owned.push(grain);
  await ctx.yield();
  const turf = await turfTexture(ctx, THREE, field, o.look); owned.push(turf);
  const blades = await bladesTexture(ctx, THREE, o.rngFor('meadow-blades')); owned.push(blades);
  await ctx.yield();
  const gGeo = await groundGeometry(ctx, THREE);
  await ctx.yield();
  const drift = driftTexture(THREE, field, NX, NZ, NCH); owned.push(drift);
  await ctx.yield();
  const gMat = groundMaterial(THREE, turf, grain, blades, drift);
  // the ground is three sheets that share their vertices: the lower valley's down to z 30, from there to the fall's
  // foot, and the upper valley's with the plan's ramp
  const allIdx = gGeo.index.array, [s1, s2] = gGeo.userData.splits;
  const sheet = (a, b, name) => {
    const g = new THREE.BufferGeometry();
    for (const k of ['position', 'normal', 'color', 'aG']) g.setAttribute(k, gGeo.attributes[k]);
    g.setIndex(new THREE.BufferAttribute(allIdx.slice(a, b), 1)); g.boundingSphere = gGeo.boundingSphere.clone();
    const m = new THREE.Mesh(g, gMat); m.name = name; object.add(m); owned.push(g);
    return { meshes: [m], triangles: (b - a) / 3, calls: 1 };
  };
  // what goes with the lower valley's far part, with the rest of the lower valley, with the upper valley's floor
  const lowFar = sheet(0, s1, 'valley-ground'), low = sheet(s1, s2, 'valley-ground-mid'), high = sheet(s2, allIdx.length, 'valley-ground-upper');
  owned.push(gGeo, gMat);
  let fixed = high.triangles, fixedCalls = high.calls;      // what is drawn from everywhere (the upper valley's floor is)
  await ctx.yield();
  // 2. THE SCAR
  const sGeo = await scarGeometry(ctx, THREE, o.rngFor('meadow-scar'), o.rngFor('meadow-scar-rubble'));
  const scar = new THREE.Mesh(sGeo, gMat); scar.name = 'valley-scar'; object.add(scar); owned.push(sGeo);
  gMat.userData.uniforms.uDip.value = sGeo.userData.dip;      // (the paint's bedding lies as the beds dip)
  low.meshes.push(scar); low.triangles += sGeo.userData.triangles; low.calls += 1;
  await ctx.yield();
  // 4. THE SUGAR: one material for everything that grows, in the modes its file tells
  // (the drawing's height in pixels, by the renderer's own size: read when the part is built and on every update)
  const size = new THREE.Vector2(), pixHigh = () => (ctx.renderer ? Math.max(ctx.renderer.getDrawingBufferSize(size).y, 1) : 1);
  const shared = sugarShared(THREE, o.look, routeTable(), pixHigh());
  const mats = { shared, hi: sugarMaterial(THREE, shared, 1), lo: sugarMaterial(THREE, shared, 2), still: sugarMaterial(THREE, shared, 0),
    treeNear: sugarMaterial(THREE, shared, 1, [TREE_LOD[0], TREE_LOD[1], 0, 0]), treeFar: sugarMaterial(THREE, shared, 4, [TREE_LOD[0], TREE_LOD[1], 0, 0]) };
  owned.push(mats.hi, mats.lo, mats.still, mats.treeNear, mats.treeFar);
  mats.wood = mats.still;
  mats.dens = 0.7 + 0.45 * (Math.min(Math.max(o.look.density, 0.7), 1.3) - 0.7);     // look.density 0.7..1.3 deals 0.70 to 0.97 of the full count
  const fr = o.rngFor('meadow-forms');
  const loForms = { disc: FORM.loDisc(THREE), puff: FORM.loPuff(THREE), tuft: FORM.loTuft(THREE, fr) };
  const kinds = makeKinds(THREE, fr, field);
  for (const k of kinds) owned.push(k.form);
  owned.push(loForms.disc, loForms.puff, loForms.tuft);
  // 5. THE TREES
  const trees = await buildTrees(ctx, o, sites, mats, meshesFrom);
  object.add(trees.object); owned.push(...trees.owned);
  await ctx.yield();
  // THE SWEETS: four instanced meshes in a material of their own
  const sweets = buildSweets(THREE, o.look, sweetDeal);
  object.add(sweets.object); owned.push(...sweets.owned);
  await ctx.yield();
  // ROCK CANDY on the scar's ledges and lip, in the sweets' material: it is counted and put away with the scar
  const rock = rockCandy(THREE, o.rngFor, sGeo.userData.spots, sweets.material);
  if (rock.mesh) { object.add(rock.mesh); owned.push(...rock.owned); low.meshes.push(rock.mesh); low.triangles += rock.triangles; low.calls += 1; }
  await ctx.yield();
  // 6. THE REST OF THE VALLEY: the fringes drawn whole at any range, and the dry-stone field walls
  const far = await farMeadow(ctx, o, field, mats, loForms, sGeo.userData.spots, meshesFrom);
  object.add(far.object); fixed += far.zones[2].triangles; fixedCalls += far.zones[2].drawCalls;
  [lowFar, low].forEach((g, i) => { g.meshes.push(...far.zones[i].meshes); g.triangles += far.zones[i].triangles; g.calls += far.zones[i].drawCalls; });
  await ctx.yield();
  // the field walls stand in three meshes: with the lower valley's far part, with the rest of the lower valley, and the upper valley's own
  const wGeo = [];
  for (const zn of [0, 1, 2]) {
    const g = await fieldWalls(THREE, o.rngFor, walls.lines.filter((w) => w.zone === zn), () => ctx.yield()); wGeo.push(g); owned.push(g);
    await ctx.yield();
    if (!g.userData.triangles) continue;
    const m = new THREE.Mesh(g, gMat); m.name = 'valley-field-walls-' + zn; object.add(m);
    if (zn === 2) { fixed += g.userData.triangles; fixedCalls += 1; } else { const part = zn ? low : lowFar; part.meshes.push(m); part.triangles += g.userData.triangles; part.calls += 1; }
  }
  // 7. LIFE: swallows, bees, butterflies; the petals and the dawn haze where the look asks for them
  const life = await meadowLife(ctx, o, field, mats, meshesFrom, sites, walls, sweetDeal);
  object.add(life.object); owned.push(...life.owned); fixed += life.triangles; fixedCalls += life.drawCalls;
  let petals = null;
  if (o.look.petals) { petals = petalDrift(THREE, o, shared.uTime); object.add(petals.object); owned.push(...petals.owned); fixed += petals.triangles; fixedCalls += 1; }
  await ctx.yield();
  if (o.look.hour === 'dawn') { const hz = dawnHaze(THREE, o, field); object.add(hz.object); owned.push(...hz.owned); fixed += hz.triangles; fixedCalls += 1; }
  await ctx.yield();
  // 3. THE MEADOW NEAR THE FLOWN LINE, lower valley: dealt into what the budget has left where it is heaviest
  let treeLow = 0, treeLowCalls = 0;
  for (let z = 152; z > UP_FROM; z -= 2) { const [t, c] = trees.show(z); treeLow = Math.max(treeLow, t); treeLowCalls = Math.max(treeLowCalls, c); }
  const planting = await plantMeadow(ctx, o, field, kinds, mats, loForms, LOW_CAP - fixed - lowFar.triangles - low.triangles - treeLow, LOW_CALLS - fixedCalls - lowFar.calls - low.calls - treeLowCalls);
  object.add(planting.object);
  await ctx.yield();
  // ... and THE UPPER VALLEY'S, thinned evenly until every view that has it fits
  const upper = await plantUpper(ctx, o, field, kinds, mats, loForms, meshesFrom);
  object.add(upper.object); owned.push(...upper.owned);
  // what stands whatever the planting does, at a place of the flown line: [triangles, draw calls]
  const stands = (z, apply = true) => {
    const fa = z > FAR_TO, lo = z > LOW_TO;
    if (apply) { for (const m of lowFar.meshes) m.visible = fa; for (const m of low.meshes) m.visible = lo; }
    return [fixed + (fa ? lowFar.triangles : 0) + (lo ? low.triangles : 0), fixedCalls + (fa ? lowFar.calls : 0) + (lo ? low.calls : 0)];
  };
  let thin = 1;
  for (let pass = 0; pass < 5; pass++) {          // (a stretch far off is already cut by its range, so one cut may not do)
    let over = 1;
    for (let z = UP_FROM, n = 0; z > -232; z -= 1) {
      const u = upper.show(z, false)[0]; if (u > 0) over = Math.min(over, ((z > LOW_TO ? UP_CAP : HEAD_CAP) - stands(z, false)[0] - trees.show(z)[0] - planting.show(z)[0]) / u);
      if (++n % 40 === 0) await ctx.yield();
    }
    if (over >= 1) break;
    thin = upper.setThin(thin * over * 0.985);
    await ctx.yield();
  }
  // what a place of the flown line draws, and what it costs
  const showAll = (z) => { const s = stands(z), a = planting.show(z), b = upper.show(z), c = trees.show(z), w = sweets.show(z); return [s[0] + a[0] + b[0] + c[0] + w[0], s[1] + a[1] + b[1] + c[1] + w[1]]; };
  let triangles = 0, drawCalls = 0, lowTris = 0, lowCalls = 0;
  for (let z = 152, n = 0; z > -232; z -= 1) {
    const [t, c] = showAll(z); triangles = Math.max(triangles, t); drawCalls = Math.max(drawCalls, c);
    if (z > UP_FROM) { lowTris = Math.max(lowTris, t); lowCalls = Math.max(lowCalls, c); }
    if (++n % 64 === 0) await ctx.yield();
  }
  showAll(P.ENTRY.z);
  await ctx.yield();
  const path = ctx.core.makePath(P.ROUTE), eye = new THREE.Vector3();
  const info = { minClear: Math.min(planting.minClear, upper.minClear, trees.minClear, far.minClear, sGeo.userData.minClear), wallClear: Math.min(...wGeo.map((g) => g.userData.minClear)), walls: walls.lines.map((w) => w.name), plantClear: planting.minClear, upperClear: upper.minClear, farClear: far.minClear, treeClear: trees.minClear,
    sweets: { counts: sweets.counts, triangles: sweets.triangles, calls: sweets.drawCalls, least: sweetDeal.least }, lifeClear: life.minClear, life: life.info, petals: petals ? { count: petals.count, clear: petals.minClear } : null, far: far.counts, rock: { count: rock.count, clear: +Math.min(rock.minClear, 999).toFixed(2) }, treesLeft: trees.left, treesRoofLeft: trees.roofLeft, treesSightLeft: trees.sightLeft, treeTop: +trees.top.toFixed(2), trees: trees.counts, sites: sites.length,
    planting: planting.stats, counts: planting.counts, upper: upper.stats, upperThin: thin, fixed, fixedCalls, lowTris, lowCalls, lowerFar: lowFar.triangles, lowerValley: low.triangles, upperFloor: high.triangles, scar: { triangles: sGeo.userData.triangles, clear: sGeo.userData.minClear, beds: sGeo.userData.beds, columns: sGeo.userData.columns, rubble: sGeo.userData.rubble } };
  return {
    object, triangles, drawCalls, info,
    update(dt, time, u) {
      shared.uTime.value = time; sweets.update(time);
      shared.uPixH.value = pixHigh();
      path.pointAt(Math.min(Math.max(u || 0, 0), 1), eye); showAll(eye.z);
      for (const f of life.items) f.update(dt, time, null, u);
    },
    dispose() { for (const x of owned) if (x && x.dispose) x.dispose(); },
  };
}
