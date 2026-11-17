// bridges-of-marigold: THE CITY (the city builder's part; the air builder's world imports buildCity from the file
// this one is copied to). What stands: every tower of the plan as a stack of some hundreds of houses, each a block of
// its own strong colour with shutters, doors and lit rooms drawn in its shader; the stone feet at the water, the great
// tower's stepped pyramid, its gate terrace and gate house; the two landings of the canyon bridge; tower 7's roof
// terrace with its market; scaffolds, water tanks and two cranes at the tops; the dark inside of the towers; and,
// on the houses whose fronts stand within 70 m of the flown line (a place, never the lens), real relief: balconies
// with iron railings and pots, jutting rooms on brackets, striped awnings, washing lines, arcades with railed walks.
// Footbridges of iron join some towers (they leave the towers' radii, by the design; each keeps 14 m and more from
// the flown line; their ends are handed back as `bridges`), and small boats lie at the quays.
// So that the ring towers read from far off as piled-up towns: each has a bulge or a waist, houses that jut out
// beyond the plan's radius where the leave allows it (city-place: only where the flown line is more than 40 m off
// in plan), two or three great terrace rings with arcades, and a crown of its own (city-skyline). Under tower 7's
// deck a sun of tiles, corbels and lanterns. Up to four lit cable cars glide between ring towers (city-cars).
// The join (design, section 8): buildCity(ctx, { THREE, rngFor, look }) returns { object, update(dt, time, u),
// triangles, drawCalls, dispose() }. The city adds no light to the scene and reads neither the lens nor the frame nor
// the wall clock: its windows flicker by the world's own time handed to update().
// STREAMS OF THE SEED (each by rngFor(name)): 'stack0'..'stack7' the houses of each tower (tier pitch, widths, askew,
// inset, depth, colour, roof, where the top breaks off); 'stone' the turn and step heights of the feet; 'terrace'
// the market stalls' cloth, wares and turns; 'crown' where the cranes stand and which open roofs carry a scaffold or
// a tank ('crown<k>:<house>' the sizes of each); 'relief' which house near the line gets a balcony, a jutting room,
// an awning, brackets, a washing line ('relief:<house>' their small sizes and colours); 'decks' what stands on each
// open roof under a set-back ('decks:<house>' its small sizes); 'links' the footbridges' heights and the boats;
// 'rings<k>' the heights of a ring tower's terrace rings, 'skyline:<k>' their turn; 'skyline' which crown stands
// on which ring tower and its small sizes; 'cars' the cables' heights and sag and where each cabin starts.
// LOOKS: look.density scales the share of lit openings; look.sky tints the cool fill on every wall, look.glow the
// lamps' warm light; look.hour 'day' (the brighter night) lifts the fill.
// BROUGHT IN: nothing of its own; the hash and the value noise are the kit's (fx.js), imported.
import { TOWERS } from './bridges-of-marigold-plan.js';
import { dealStacks } from './bridges-of-marigold-city-deal.js';
import { makeGeo } from './bridges-of-marigold-city-geo.js';
import { makeHouseMaterial, makeStoneMaterial } from './bridges-of-marigold-city-mat.js';
import { layStoneIn, QUAY } from './bridges-of-marigold-city-stone.js';
import { layLinksIn } from './bridges-of-marigold-city-links.js';
import { layGateHouse, layTerraceRail } from './bridges-of-marigold-city-gate.js';
import { layLanding, layRoofTerrace } from './bridges-of-marigold-city-terrace.js';
import { layTops } from './bridges-of-marigold-city-crown.js';
import { layRelief, frontOf } from './bridges-of-marigold-city-relief.js';
import { layDecks } from './bridges-of-marigold-city-decks.js';
import { layTerraces, layCrowns } from './bridges-of-marigold-city-skyline.js';
import { layCars, carAt } from './bridges-of-marigold-city-cars.js';

// The paint of the houses (the design's list: rose, cobalt, turquoise, ochre, lime, violet, vermilion, white; and two
// between them, a sky blue and a magenta, so that ten are dealt).
const PAINT = ['#de5279', '#2a4fc0', '#17aaa0', '#dc9a2c', '#8fc234', '#8250c8', '#de4628', '#ece2cf', '#4692d6', '#c7388f'];

export async function buildCity(ctx, o) {
  const { THREE, rngFor } = o, look = o.look || {};
  const group = new THREE.Group(), made = [];
  // the city's own light: a cool fill of the sky's colour and the lamps' warm colour
  const sky = new THREE.Color(look.sky !== undefined ? look.sky : '#2a2160'), glow = new THREE.Color(look.glow !== undefined ? look.glow : '#ffa040');
  const lift = (c, to) => c.multiplyScalar(to / Math.max(1e-3, c.r, c.g, c.b));
  const fill = lift(sky.clone().lerp(new THREE.Color(0.3, 0.26, 0.6), 0.5), look.hour === 'day' ? 0.2 : 0.13);
  const warm = lift(glow.clone(), 1).lerp(new THREE.Color(1, 0.66, 0.36), 0.65);
  const U = { uTime: { value: 0 }, uFill: { value: fill }, uWarm: { value: warm }, uDensity: { value: look.density !== undefined ? look.density : 1 } };
  const houseMat = makeHouseMaterial(THREE, U), stoneMat = makeStoneMaterial(THREE, U);
  let triangles = 0, drawCalls = 0;
  await ctx.yield();

  // 1. the stacks
  const houses = [];
  for (let k = 0; k < TOWERS.length; k++) { dealStacks(rngFor, houses, k); await ctx.yield(); }
  const paint = PAINT.map((h) => new THREE.Color(h));
  const box = new THREE.BoxGeometry(1, 1, 1); made.push(box);
  const n = houses.length, iCol = new Float32Array(n * 3), iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
  // each house's own paint: its dealt colour, deeper or paler by its own numbers, some of it faded by the weather
  const fr = (v) => v - Math.floor(v);
  houses.forEach((h, i) => {
    const c = paint[h.col], f1 = fr(h.seed * 7.31), f2 = fr(h.seed * 3.71), faded = fr(h.seed * 11.13) < 0.16;
    const s = faded ? 0.5 : 1 - 0.3 * f2, v = (faded ? 0.8 : 0.58) + 0.5 * f1, grey = 0.3 * c.r + 0.6 * c.g + 0.1 * c.b;
    iCol[i * 3] = (grey + (c.r - grey) * s) * v; iCol[i * 3 + 1] = (grey + (c.g - grey) * s) * v; iCol[i * 3 + 2] = (grey + (c.b - grey) * s) * v;
  });
  const paintOf = (h) => { const i = houses.indexOf(h); return [iCol[i * 3], iCol[i * 3 + 1], iCol[i * 3 + 2]]; };
  await ctx.yield();
  // the relief near the flown line (it says which cells of a front open as doors onto a balcony or a walk)
  const GR = makeGeo(THREE), codes = await layRelief(GR, houses, rngFor, paintOf, () => ctx.yield());
  await ctx.yield();
  // the open roofs under the set-backs: terraces, domes, belfries, pergolas, stairs
  const GD = makeGeo(THREE); await layDecks(GD, houses, rngFor, paintOf, () => ctx.yield());
  await ctx.yield();
  const mesh = new THREE.InstancedMesh(box, houseMat, n), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < n; i++) {
    const h = houses[i], f = frontOf(h);
    M.compose(P.set(h.x, h.y + h.h / 2, h.z), Q.setFromAxisAngle(Y, h.yaw), S.set(h.w, h.h, h.d)); mesh.setMatrixAt(i, M);
    iB[i * 4] = f.bays; iB[i * 4 + 1] = f.floors; iB[i * 4 + 2] = codes[i]; iB[i * 4 + 3] = f.door;
    iA[i * 4] = h.seed; iA[i * 4 + 1] = 0; iA[i * 4 + 2] = Math.max(0, 1 - (h.inset - (h.bite || 0)) / 4.2 - (h.ring > 0 ? 0.25 : 0)); iA[i * 4 + 3] = 0;
    if (i % 200 === 199) await ctx.yield();
  }
  box.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCol, 3)); box.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); box.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  mesh.frustumCulled = false; group.add(mesh); triangles += n * 12; drawCalls += 1;
  await ctx.yield();
  // the tiled roofs: a hipped roof with eaves on the blocks dealt one, drawn with the block's own numbers
  {
    const a = 0.525, e = 0.5, r = 0.74, q = 0.2, V = [], tri = (...p) => { for (const v of p) V.push(v[0], v[1], v[2]); };
    const A = [-a, e, a], B = [a, e, a], C = [q, r, 0], D = [-q, r, 0], E = [a, e, -a], F = [-a, e, -a];
    tri(A, B, C); tri(A, C, D); tri(E, F, D); tri(E, D, C); tri(B, E, C); tri(F, A, D); tri(A, F, E); tri(A, E, B);
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(V, 3)); rg.computeVertexNormals(); made.push(rg);
    const idx = []; for (let i = 0; i < n; i++) if (houses[i].tiled) idx.push(i);
    const rc = new Float32Array(idx.length * 3), ra = new Float32Array(idx.length * 4), rb = new Float32Array(idx.length * 4), roofs = new THREE.InstancedMesh(rg, houseMat, idx.length);
    idx.forEach((i, j) => {
      mesh.getMatrixAt(i, M); roofs.setMatrixAt(j, M);
      rc.set(iCol.subarray(i * 3, i * 3 + 3), j * 3); ra.set(iA.subarray(i * 4, i * 4 + 4), j * 4);
    });
    rg.setAttribute('iCol', new THREE.InstancedBufferAttribute(rc, 3)); rg.setAttribute('iA', new THREE.InstancedBufferAttribute(ra, 4)); rg.setAttribute('iB', new THREE.InstancedBufferAttribute(rb, 4));
    roofs.frustumCulled = false; group.add(roofs); triangles += idx.length * 8; drawCalls += 1;
  }
  await ctx.yield();

  // 2. the stone: feet, pyramid, terrace, gate house, the dark inside
  const G = makeGeo(THREE), GA = makeGeo(THREE);
  await layStoneIn(G, rngFor, () => ctx.yield()); await ctx.yield();
  layGateHouse(G); layTerraceRail(G); await ctx.yield();
  layLanding(G, 0, 0); layLanding(G, 4, 1); await ctx.yield();
  layRoofTerrace(G, rngFor); await ctx.yield();
  // the ring towers' skyline: their terrace rings (a ring a step), their crowns
  for (let k = 1; k < TOWERS.length - 1; k++) for (let i = 0; i < 3; i++) { layTerraces(G, rngFor, k, i); await ctx.yield(); }
  layCrowns(G, rngFor); await ctx.yield();
  // cable cars between ring towers: the cables, and one cabin's shape for all of them
  const GC = makeGeo(THREE), carLines = layCars(G, GC, rngFor); await ctx.yield();
  // footbridges between the towers, boats at the quays
  const bridges = await layLinksIn(G, rngFor, QUAY, () => ctx.yield()); await ctx.yield();
  // 3. the tops: scaffolds, tanks, two cranes (the arm of one turns)
  const crown = await layTops(G, GA, houses, rngFor, paintOf, () => ctx.yield()); await ctx.yield();
  const stoneGeo = await G.buildIn(() => ctx.yield()); made.push(stoneGeo);
  const stone = new THREE.Mesh(stoneGeo, stoneMat); stone.frustumCulled = false; group.add(stone); triangles += G.triangles; drawCalls += 1;
  await ctx.yield();
  const reliefGeo = await GR.buildIn(() => ctx.yield()); made.push(reliefGeo);
  const relief = new THREE.Mesh(reliefGeo, stoneMat); relief.frustumCulled = false; group.add(relief); triangles += GR.triangles; drawCalls += 1;
  await ctx.yield();
  const deckGeo = GD.build(); made.push(deckGeo);
  const decks = new THREE.Mesh(deckGeo, stoneMat); decks.frustumCulled = false; group.add(decks); triangles += GD.triangles; drawCalls += 1;
  await ctx.yield();
  const armGeo = GA.build(); made.push(armGeo);
  const arm = new THREE.Mesh(armGeo, stoneMat); arm.position.set(crown.pivot[0], crown.pivot[1], crown.pivot[2]); arm.frustumCulled = false; group.add(arm); triangles += GA.triangles; drawCalls += 1;
  await ctx.yield();

  const carGeo = GC.build(); made.push(carGeo);
  const cars = carLines.map((l) => { const m = new THREE.Mesh(carGeo, stoneMat); m.frustumCulled = false; m.rotation.y = Math.atan2(l.a[2] - l.b[2], l.b[0] - l.a[0]); group.add(m); return m; });
  triangles += GC.triangles * cars.length; drawCalls += cars.length;
  // each cabin glides to and fro along its cable (there and back in about two minutes of the world's own time)
  const glide = (time) => cars.forEach((m, i) => { const q = carAt(carLines[i], 0.5 - 0.46 * Math.cos(time * 0.05 + carLines[i].phase)); m.position.set(q[0], q[1], q[2]); });
  glide(0);
  await ctx.yield();

  return {
    object: group, triangles, drawCalls, houses: n, bridges, parts: { houses: n * 12, relief: GR.triangles, decks: GD.triangles, stone: G.triangles, arm: GA.triangles },
    update(dt, time) { U.uTime.value = time; arm.rotation.y = time * 0.045; glide(time); },      // (the crane's arm: a turn in 140 s of the world's own time)
    dispose() { for (const g of made) g.dispose(); houseMat.dispose(); stoneMat.dispose(); },
  };
}
