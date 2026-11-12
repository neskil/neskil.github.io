// One shot on a portal world, traced: where it went and how it ended.
//
//   node golf3d/tools/portal-shot.mjs gasgiant putter 0 0.6      # world club yaw° weight
//   node golf3d/tools/portal-shot.mjs gasgiant putter 0 0.6 4 16 # …from x z instead of the tee
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const js = join(dirname(fileURLToPath(import.meta.url)), '..', 'js');
const ctx = { console, Math, performance: { now: () => Date.now() } };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['config.js', 'themes.js', 'physics.js', 'courses.js', 'portals.js', 'swing.js', 'bot.js', 'lab.js']) {
    vm.runInContext(readFileSync(join(js, f), 'utf8'), ctx, { filename: f });
}
const G3 = ctx.G3, P = G3.physics;
const [id, clubId, yaw, frac, fx, fz] = process.argv.slice(2);
const h = G3.portals.byId(id).hole;
const club = G3.lab.clubById(clubId);
const from = fx !== undefined ? { x: +fx, z: +fz } : { x: h.tee.x, z: h.tee.z };
const w = P.createWorld(h, from, 0);
P.launch(w, +yaw * Math.PI / 180, club.power * +frac, club.loft, club.bite);
let n = 0, top = -9;
const pts = [];
while (n < 60 * 14 && !P.done(w)) {
    P.advance(w, 1 / 60); n++;
    top = Math.max(top, w.ball.y);
    if (n % 12 === 0) pts.push(`${w.ball.x.toFixed(1)},${w.ball.z.toFixed(1)},${w.ball.y.toFixed(1)}`);
}
console.log(pts.join('  '));
console.log(`end ${w.ball.x.toFixed(2)},${w.ball.z.toFixed(2)},${w.ball.y.toFixed(2)} t=${(n / 60).toFixed(1)}s top=${top.toFixed(2)}` +
    ` ${w.sunk ? 'SUNK' : w.out ? 'OUT' : w.splash ? 'SPLASH' : w.moving ? 'moving' : 'rest'}  cup ${h.cup.x},${h.cup.z}`);
