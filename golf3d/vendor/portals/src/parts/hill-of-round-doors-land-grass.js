// hill-of-round-doors, the land builder's part: THE BLADES. Near the flown line the turf is not paint alone: tufts of
// real blades stand on it, instanced (the kit's own grass, src/kit/flora.js makeGrassAsync, in its wind material
// under the scene's two lights, bowing to the wind's gusts): a short close sward wherever grass grows within SHORT
// metres of the line in plan, and long meadow grass with seed heads and meadow flowers where the land's fields say
// the grass stands long (hay fields, islands in the pastures, verges, the wet margin) within LONG metres. Where they
// stand is chosen by place alone (thicker toward the line, by the kit's own bias); each tuft takes the ground's own
// colour at its foot and the baked shade there, so the carpet and the paint are one. The kit thins and drops tufts
// with their distance from the eye (level of detail) and draws only the stretches of route near the eye.
// Long grass keeps its tops 3 m under the flown line: none stands where the line passes lower than DRESS over the ground,
// and none by the mill's works or at the bridge's ends (there the sward is short).
import * as Flora from '../kit/flora.js';
import { routeOver } from './hill-of-round-doors-plan.js';
import { nearWorks, onBridge, wayAt } from './hill-of-round-doors-land-lines.js';

export const SHORT = 40, LONG = 48, DRESS = 6;
const BRIDGE_BERTH = 2.6;                                     // metres about the bridge's own strip (its parapets and abutments) where no tuft or flower stands
const NEAR_LINE = 15;                                         // metres by the route's lattice within which the plan itself is asked how near and how high the line passes

// o: { THREE, rng, path, kinds, routeField, heightAt, shade (the baked shade), look, wind, map (the land's leaf atlas), density, detail }
export async function makeGrass(ctx, o) {
  const { rng, path, kinds, routeField, heightAt, shade, look, wind, map } = o, k = {}, sh = [1, 1, 1], out = [1, 1, 1], col = [0, 0, 0];
  const T = look.turf, amount = (o.density ?? 1) * (0.55 + 0.45 * Math.min(1, o.detail ?? 1));
  // what grows where, read once on a lattice STEP metres wide over the ground within reach of the line (the tufts
  // ask many thousand times): per node how long the grass is, and whether a tuft may stand there at all (not in
  // water, the hall, on the bridge, on the way's bare earth, in a home's garden or against its front)
  const STEP = 1.6, x0 = -136, z0 = -136, nx = Math.ceil(296 / STEP), nz = Math.ceil(424 / STEP), W = nx + 1, G = new Float32Array(W * (nz + 1) * 4);
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      const x = x0 + i * STEP, z = z0 + j * STEP, n = (j * W + i) * 4; if (routeField(x, z) > LONG + 4) continue;
      kinds.at(x, z, k, heightAt(x, z));
      G[n] = nearWorks(x, z) ? 0 : k.long; G[n + 1] = k.grows && k.wet < 0.92 && k.front > 2.6 && k.garden < 0.04 && !onBridge(x, z, BRIDGE_BERTH) ? 1 : 0; G[n + 2] = k.lawn > 0.5 ? 1 : k.mown ? 2 : 0;
      G[n + 3] = k.way < 5.2 ? 1 : 0;
    }
    if ((j & 7) === 7) await ctx.yield();
  }
  const node = (x, z) => (Math.min(nz, Math.max(0, Math.round((z - z0) / STEP))) * W + Math.min(nx, Math.max(0, Math.round((x - x0) / STEP)))) * 4;
  // may a tuft stand at a place? Not on the way's bare earth: by the way that is asked of the way's own middle line
  // (the lattice is too coarse for the earth's edge): the earth lies between the crown's edge and the way's edge
  const w = { d: 0, s: 0, y: 0, up: 0 };
  const stands = (x, z, n) => { if (G[n + 1] < 0.5) return false; if (G[n + 3] > 0.5) { wayAt(x, z, w); if (w.d > 0.8 && w.d < 3.1) return false; } return true; };
  // the ground's own colour at a place, as the turf's paint has it (short sward, long grass, lawn, a mown field)
  const colour = (x, z) => {
    const n = node(x, z), L = G[n], kind = G[n + 2], m = kind === 2 ? 1 : 0, lawn = kind === 1 ? 1 : 0;
    col[0] = T.r * ((1 - L) * (m ? 1.5 : 1 - 0.1 * lawn) + L * 1.36); col[1] = T.g * ((1 - L) * (m ? 1.34 : 1) + L * 1.16); col[2] = T.b * ((1 - L) * (m ? 0.84 : 1 - 0.04 * lawn) + L * 0.6);
    return col;
  };
  // what the sun's shade does to a tuft: in full shade it keeps two thirds of the sky's share of the light (as the turf does)
  const S = look.sunLight, K = look.skyLight, e = Math.max(0.12, look.sun.y);
  const dim = [K.r / (S.r * e + K.r), K.g / (S.g * e + K.g), K.b / (S.b * e + K.b)];
  const shadeFn = (x, z) => { shade.at(x, z, sh); const s = sh[0], op = 0.6 + 0.4 * sh[1], d = 0.66 + 0.34 * s; out[0] = (dim[0] * d + (1 - dim[0]) * s) * op; out[1] = (dim[1] * d + (1 - dim[1]) * s) * op; out[2] = (dim[2] * d + (1 - dim[2]) * s) * op; return out; };
  const short = await Flora.makeGrassAsync({ rng: rng.fork('short'), path, radius: SHORT, bias: 1.35, count: Math.round(23000 * amount), chunks: 8,
    width: [0.6, 1.0], height: [0.22, 0.42], heightAt, heightStep: 2, wind, map, groundColor: colour, shade: shadeFn, rootGain: 1.2, tint: 0.1,
    flowers: 0.07, flowerColors: ['#f2f0e4', '#f2f0e4', '#f4cf2e', '#f2f0e4', '#e8a0c0'], fade: [62, 90],
    density: (x, z) => { const n = node(x, z); return stands(x, z, n) ? 1 - G[n] * 0.85 : 0; } }, ctx.yield);
  const long = await Flora.makeGrassAsync({ rng: rng.fork('long'), path, radius: LONG, bias: 1.3, count: Math.round(10500 * amount), chunks: 8,
    width: [0.7, 1.15], height: [0.8, 1.45], heightAt, heightStep: 2, wind, map, groundColor: colour, shade: shadeFn, rootGain: 1.15, tint: 0.14,
    flowers: 0.12, flowerColors: ['#f4cf2e', '#f4cf2e', '#f2f0e4', '#c86a9c', '#8f7ad0', '#e2473a'], fade: [70, 100],
    density: (x, z) => {
      const n = node(x, z), L = G[n]; if (L < 0.25 || !stands(x, z, n)) return 0;
      if (routeField(x, z) > NEAR_LINE) return L;                // (the lattice's distance is within 6 m of the plan's own: beyond this no tuft is under the line)
      const r = routeOver(x, z); return r.dist < 9 && r.y - heightAt(x, z) < DRESS ? 0 : L; } }, ctx.yield);
  short.object.name = 'hill-sward'; long.object.name = 'hill-long-grass';
  const group = new o.THREE.Group(); group.name = 'hill-grass'; group.add(short.object, long.object);
  return { object: group, short, long, triangles: short.triangles + long.triangles, count: short.count + long.count,
    update(dt, time, u, camera) { short.update(dt, time, camera); long.update(dt, time, camera); },
    dispose() { for (const g of [short, long]) { for (const m of g.meshes) { m.geometry.dispose(); m.dispose(); } g.material.dispose(); } } };
}
