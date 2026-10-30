// The bot plays a course with a person's hands, many times, and the card says
// what a decent amateur would average.
//
//   node golf3d/tools/human-check.mjs keys                 # one course, 12 rounds
//   node golf3d/tools/human-check.mjs keys --rounds 30     # more rounds, steadier numbers
//   node golf3d/tools/human-check.mjs keys --hole 3        # one hole
//
// par-check.mjs is the perfect player: it strikes every ball exactly where it
// meant to, so its card reads a hole's *shape* — whether there is a second
// shot in it — and says nothing about whether the hole is fair. This is the
// other reading. Every stroke leaves off line and off weight by
// CONFIG.BOT_HANDS, and the bot chooses knowing that (bot.js, "hands"), so a
// green you can only reach by threading a ball between two splashes costs
// strokes here and costs nothing there.
//
// What to read off it, per hole: the average against par (a fair long hole
// sits within about half a stroke over it for this player), the spread, and
// the splashes per round — water that catches one ball in three is a hazard,
// one that catches two balls a round is the hole.
//
// Seeded, so the same build gives the same card. Plain Node, no install.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const js = join(dirname(fileURLToPath(import.meta.url)), '..', 'js');
const ctx = { console, Math, performance: { now: () => Date.now() } };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['config.js', 'physics.js', 'courses.js', 'swing.js', 'bot.js']) {
    vm.runInContext(readFileSync(join(js, f), 'utf8'), ctx, { filename: f });
}
const G3 = ctx.G3;

const args = process.argv.slice(2);
const flag = (name, dflt) => {
    const i = args.indexOf('--' + name);
    return i >= 0 ? Number(args[i + 1]) : dflt;
};
const flagged = new Set(['--rounds', '--hole', '--seed']);
const named = args.filter((a, i) => !a.startsWith('--') && !flagged.has(args[i - 1]));
const rounds = flag('rounds', 12), only = flag('hole', 0), seed0 = flag('seed', 1);
const courses = G3.COURSES.filter((c) => named.length ? named.includes(c.id) : c.id === 'keys');

// mulberry32: small, seeded, and the same on every machine.
function rng(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

for (const c of courses) {
    let mean = 0, par = 0;
    console.log(`${c.id} — ${rounds} rounds with CONFIG.BOT_HANDS`);
    c.holes.forEach((h, k) => {
        if (only && only !== k + 1) return;
        const cards = [], used = {};
        let wet = 0, lost = 0;
        for (let r = 0; r < rounds; r++) {
            const res = G3.bot.play(h, 12, G3.bagFor(h),
                { hands: G3.CONFIG.BOT_HANDS, rng: rng(seed0 * 7919 + k * 104729 + r * 15485863) });
            if (!res.sunk) lost++;
            cards.push(res.strokes);
            res.shots.forEach((s) => {
                if (s.world.splash || s.world.out) wet++;
                const id = s.club.short;
                used[id] = (used[id] || 0) + 1;
            });
        }
        const avg = cards.reduce((a, b) => a + b, 0) / rounds;
        const sorted = cards.slice().sort((a, b) => a - b);
        const tally = {};
        cards.forEach((s) => { tally[s] = (tally[s] || 0) + 1; });
        const dist = Object.keys(tally).sort((a, b) => a - b).map((s) => `${s}×${tally[s]}`).join(' ');
        const clubs = Object.entries(used).sort((a, b) => b[1] - a[1])
            .map(([id, n]) => `${id} ${(n / rounds).toFixed(1)}`).join(', ');
        const over = avg - h.par;
        console.log(`  ${(k + 1)}. ${h.name.padEnd(20)} par ${h.par}  avg ${avg.toFixed(2)} (${over >= 0 ? '+' : ''}${over.toFixed(2)})` +
            `  best ${sorted[0]}  splash/rd ${(wet / rounds).toFixed(2)}${lost ? `  UNFINISHED ${lost}` : ''}`);
        console.log(`       ${dist}   clubs/rd: ${clubs}`);
        mean += avg; par += h.par;
    });
    console.log(`  total avg ${mean.toFixed(1)} against par ${par} (${mean - par >= 0 ? '+' : ''}${(mean - par).toFixed(1)})\n`);
}
