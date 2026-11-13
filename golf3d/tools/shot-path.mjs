// One tee shot on a tour hole, as the points it passes through.
//
//   node golf3d/tools/shot-path.mjs attic putter 82 0.7 6    # world, club, yaw, power 0..1, every nth step
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const js = join(dirname(fileURLToPath(import.meta.url)), '..', 'js') + '/';
const ctx = { console, Math, performance: { now: () => Date.now() } }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['config.js', 'themes.js', 'physics.js', 'courses.js', 'tour-ground.js', 'portals.js', 'swing.js', 'bot.js', 'lab.js']) vm.runInContext(readFileSync(js + f, 'utf8'), ctx, { filename: f });
const G3 = ctx.G3, P = G3.physics;
const [id, clubId, yaw, pw, ev] = process.argv.slice(2);
const h = G3.portals.WORLDS.find((w) => w.id === id).hole;
const club = G3.bagFor(h).find((c) => c.id === clubId);
const w = P.createWorld(h, { x: h.tee.x, z: h.tee.z, y: h.tee.y + G3.CONFIG.BALL_R }, 0);
P.launch(w, yaw * Math.PI / 180, club.power * pw, club.loft, club.bite);
let n = 0, out = [];
while (n < 40 * 120 && !P.done(w)) { P.advance(w, 1 / 120); if (n++ % (+ev || 24) === 0) out.push(`${(n/120).toFixed(1)}s ${w.ball.x.toFixed(1)},${w.ball.z.toFixed(1)},${w.ball.y.toFixed(1)} v${Math.hypot(w.ball.vx||0, w.ball.vz||0).toFixed(1)}`); }
console.log(out.join(' | ')); console.log('end', w.ball.x.toFixed(2), w.ball.z.toFixed(2), w.ball.y.toFixed(2), w.sunk ? 'SUNK' : '', 'club power', club.power, 'g', G3.CONFIG.GRAVITY);
