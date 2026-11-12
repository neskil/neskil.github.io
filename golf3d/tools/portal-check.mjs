// Every portal world, played: the caddie's card, the share of tee shots that
// are aces, and whether the putt straight at the flag drops.
//
//   node golf3d/tools/portal-check.mjs                # every world
//   node golf3d/tools/portal-check.mjs turtle forge   # some of them
//   node golf3d/tools/portal-check.mjs --fine         # half a degree, 50 weights
//
// Plain Node, the game's own modules in a vm context (as tools/par-check.mjs).
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
const G3 = ctx.G3;
const args = process.argv.slice(2);
const named = args.filter((a) => !a.startsWith('--'));
const fine = args.includes('--fine');
for (const w of G3.portals.WORLDS) {
    if (named.length && !named.includes(w.id)) continue;
    const h = w.hole;
    const r = G3.bot.play(h, 10, G3.bagFor(h));
    const s = G3.lab.sweep(h, { step: fine ? 0.5 : 2, weights: fine ? 50 : 20, n: 2 });
    const st = G3.lab.straight(h);
    const wins = G3.lab.windows(s.aces, s.step).slice(0, 3)
        .map((x) => `${x.club} ${x.a0}-${x.a1}° p${x.p0.toFixed(2)}-${x.p1.toFixed(2)}`).join('; ');
    console.log(`${w.id.padEnd(10)} par ${h.par}  caddie ${r.sunk ? r.strokes : 'X'} (${r.shots.map((x) => x.club.short).join(' ')})` +
        `  aces ${(100 * s.aces.length / s.sims).toFixed(3)}% ${G3.lab.verdict(s.aces.length / s.sims)}` +
        `  straight ${st ? st.club + '@' + st.power : 'no'}\n           ${wins}`);
}
