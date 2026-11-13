// Where a tee shot finishes on a tour hole, by line and weight: one row per
// line, one column per weight, each cell the distance left to the flag (ACE,
// or . for out). It is how a hole with no skill in it shows: every cell the
// same number.
//
//   node golf3d/tools/tee-sweep.mjs attic putter 70 92 1 20     # yaw from, to, step, weights
//   XY=1 node golf3d/tools/tee-sweep.mjs attic putter 76 90 2   # where, not how far
//   CUP=10,7 node golf3d/tools/tee-sweep.mjs ...                 # try a pin without editing
//
// Yaw is degrees from +z towards +x.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const js = join(dirname(fileURLToPath(import.meta.url)), '..', 'js') + '/';
const ctx = { console, Math, performance: { now: () => Date.now() } }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['config.js', 'themes.js', 'physics.js', 'courses.js', 'tour-ground.js', 'portals.js', 'swing.js', 'bot.js', 'lab.js']) vm.runInContext(readFileSync(js + f, 'utf8'), ctx, { filename: f });
const G3 = ctx.G3, P = G3.physics;
const [id, clubId, a0, a1, as, wn] = process.argv.slice(2);
const h = G3.portals.WORLDS.find((w) => w.id === id).hole;
if (process.env.CUP) { const [cx, cz] = process.env.CUP.split(',').map(Number); h.cup.x = cx; h.cup.z = cz; }
const club = G3.bagFor(h).find((c) => c.id === clubId || c.short === clubId);
const W = +(wn || 10);
console.log(id, club.id, 'tee', h.tee, 'cup', h.cup, 'bag', G3.bagFor(h).map((c) => c.id).join(','));
for (let a = +a0; a <= +a1 + 1e-9; a += +as) {
  let row = String(a.toFixed(1)).padStart(6) + ' ';
  for (let k = 1; k <= W; k++) {
    const w = P.createWorld(h, { x: h.tee.x, z: h.tee.z, y: h.tee.y + G3.CONFIG.BALL_R }, 0);
    if (!P.launch(w, a * Math.PI / 180, club.power * k / W, club.loft, club.bite)) { row += '  ?  '; continue; }
    P.settle(w, 40, 1 / 120);
    const d = Math.hypot(w.ball.x - h.cup.x, w.ball.z - h.cup.z);
    row += w.sunk ? ' ACE ' : (w.out || w.oob || w.ball.y < -3 ? '  .  ' : process.env.XY ? (' ' + w.ball.x.toFixed(1) + ',' + w.ball.z.toFixed(1)).padStart(10) : (' ' + d.toFixed(1)).padStart(5));
  }
  console.log(row);
}
