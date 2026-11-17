// doors-in-transit: THE FAR STORE (the works builder's part): what stands beyond the opening in the hall's -z end
// wall, so that the doors seem without number. RANK BEHIND RANK of straight rails across the hall's line: the plan's
// count of ranks at the plan's step from the plan's first, each rank the plan's count of rails one over another
// (the hall's lowest rail height and the hall's own step, going on up), fixed to the faces of plain iron gantry
// posts that stand behind them (a rail's back lies against the posts' faces; a door, hung under the rail's middle,
// passes 0.2 m before them). Under every rail a street of doors in trains, as in the hall (the plan's door, hung
// the plan's drop below its rail by two straps, its face toward the hall, in every paint of the hall's doors),
// GLIDING SLOWLY ACROSS on the world's clock: rails that are neighbours, one over the other or one rank behind the
// other, run opposite ways, each at its own dealt speed. A rail runs from the far air on one side to the far air on
// the other; a door that leaves one end comes in at the other, and both ends stand where the air is whole.
// CHEAP FORMS (…-works-far-forms.js): the nearest four ranks' doors are thin boxes with two straps, the rest single
// faces without straps; every rail and post is a plain box; four draw calls in all. The whole store is the same on every machine
// and every visit of a seed: nothing is thinned, and nothing is cut, sized, hidden or faded by the lens.
// THE FAR AIR (…-works-far-air.js) is laid by place alone, on every fragment, by the plan's own law; plain sheets of
// that same colour close the view at the far end, the far sides and the top (each stands where the law gives air
// and nothing else), and the ground runs on from the wall's line under the same air. The posts run up into the
// whole air too, so that nothing of the store is seen to end.
// DEALT, from streams of the far store's own: each rail's speed, trains, gaps and start (trains); each door's
// paint, tone, size, leaf and frame (paint); where each rank's posts stand along it (posts).
import { FAR, DOOR, tierRail } from './doors-in-transit-plan.js';
import { PAINTS, HANG_X, CLOSE, WORKS_GREEN, WORKS_DARK } from './doors-in-transit-works.js';
import { BEAM } from './doors-in-transit-works-iron.js';
import { farMaterials, farLit } from './doors-in-transit-works-far-air.js';
import { nearDoorForm, faceDoorForm, doorMesh, boxMesh, groundMesh, FLOOR_Y, NEAR_TRIANGLES, FACE_TRIANGLES, BOX_TRIANGLES, GROUND_TRIANGLES } from './doors-in-transit-works-far-forms.js';

const NEAR = 4;                           // the ranks whose doors are boxes
const SPEED = [0.7, 2.0];                 // a far rail's speed, metres a second (the hall's upper streets run faster: these are far off and slow)
const GAP = [1.2, 1.9];                   // bare rail after a train, in trains-and-a-door (the hall's streets: 1.0 to 1.6)
const POST = 1.0, POST_STEP = 80;         // a gantry post's square section; the posts of a rank stand this far apart
const PAVING = '#a79d8c', PAVING_LIT = 1.1;      // the ground's stone, and how much more of the air's light a level face takes than a door's

// o: { THREE, look: { farAir }, streams: { trains, paint, posts } }
export async function buildFar(ctx, o) {
  const { THREE, look, streams } = o;
  const object = new THREE.Group(); object.name = 'doors-in-transit-far';
  const U = { uTime: { value: 0 }, uFarAir: { value: look.farAir }, uLit: { value: farLit(THREE, look.farAir) } };
  const mats = farMaterials(THREE, U, { strap: WORKS_DARK, iron: WORKS_GREEN, ground: PAVING, groundLit: PAVING_LIT });
  const L = 2 * FAR.xGone, col = new THREE.Color();
  const sets = [{ n: 0, place: [], size: [], paint: [] }, { n: 0, place: [], size: [], paint: [] }];      // the near ranks' doors; the rest
  const boxes = { n: 0, middle: [], size: [] };
  const box = (x, y, z, w, h, d) => { boxes.middle.push(x, y, z); boxes.size.push(w, h, d); boxes.n++; };

  for (let r = 0; r < FAR.ranks; r++) {
    const z = FAR.first - FAR.step * r, D = sets[r < NEAR ? 0 : 1], T = streams.trains, P = streams.paint;
    for (let k = 0; k < FAR.tiers; k++) {
      const y = tierRail(k), speed = ((r + k) % 2 === 0 ? 1 : -1) * T.range(SPEED[0], SPEED[1]), start = T.range(0, 30);
      // its trains, as on the hall's streets: four to six doors hung close, then bare rail; the last gap is whole
      // before the rail's measure comes round to the first train again
      let cur = start;
      for (let guard = 0; guard < 60; guard++) {
        const n = 4 + T.int(0, 2), len = (n - 1) * CLOSE, gap = (len + DOOR.frameW) * T.range(GAP[0], GAP[1]);
        if (cur + len + gap > L + start) break;
        for (let j = 0; j < n; j++) {
          col.set(P.pick(PAINTS)).multiplyScalar(P.range(0.88, 1.06));
          const w = P.range(3.9, DOOR.frameW), h = P.range(7.6, DOOR.frameH), leaf = P.int(0, 3) + (P() < 0.3 ? 4 : 0), f = P();
          D.place.push(cur + j * CLOSE - FAR.xGone, y, z, speed);
          D.size.push(w, h, leaf, f < 0.34 ? 0 : f < 0.6 ? 1 : f < 0.8 ? 2 : 3);
          D.paint.push(col.r, col.g, col.b); D.n++;
        }
        cur += len + gap;
      }
      box(0, y + BEAM.h / 2, z, L, BEAM.h, BEAM.w);                                   // the rail, from air to air
    }
    // the rank's gantry posts, from the ground up into the whole air, their faces against the rails' backs
    const zp = z - BEAM.w / 2 - POST / 2, h = FAR.yGone - FLOOR_Y;
    for (let x = -FAR.xGone + streams.posts.range(0, POST_STEP); x < FAR.xGone; x += POST_STEP) box(x, FLOOR_Y + h / 2, zp, POST, h, POST);
    await ctx.yield();
  }
  const near = doorMesh(THREE, nearDoorForm(THREE, HANG_X), mats.doors, sets[0]), far = doorMesh(THREE, faceDoorForm(THREE), mats.doors, sets[1]);
  await ctx.yield();
  const iron = boxMesh(THREE, mats.iron, boxes), ground = groundMesh(THREE, mats.ground);
  // drawn after the hall's own solid things, nearest first, so that what the wall or a nearer rank hides costs little
  [near, iron, far, ground].forEach((m, i) => { m.renderOrder = 1 + i; object.add(m); });
  const triangles = sets[0].n * NEAR_TRIANGLES + sets[1].n * FACE_TRIANGLES + boxes.n * BOX_TRIANGLES + GROUND_TRIANGLES;
  return {
    object, triangles, drawCalls: 4, doors: sets[0].n + sets[1].n, boxes: boxes.n,
    update(dt, time, u) { U.uTime.value = time; },
    dispose() { for (const m of [near, iron, far, ground]) m.geometry.dispose(); for (const m of Object.values(mats)) m.dispose(); },
  };
}
