// The bot plays a course and the card says how far under par it went.
//
//   node golf3d/tools/par-check.mjs                     # the four long courses
//   node golf3d/tools/par-check.mjs parkland seaside    # any course ids
//   node golf3d/tools/par-check.mjs --all               # every course
//
// The bot is a perfect player — it picks its line and its weight out of
// thousands of simulated shots and never overdraws — so its card is not what a
// person scores. What it is good for is the *shape* of a hole: a par 4 it
// drives in one is a par 4 with no second shot in it, and a course it plays in
// half its par is a course with no decisions left. PLAN.md → "The course
// rehaul" sets the line this is measured against.
//
// Plain Node, no install: it loads the same modules tests.html does into a vm
// context, so the numbers are the game's numbers.
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
const named = args.filter((a) => !a.startsWith('--'));
const courses = G3.COURSES.filter((c) =>
    args.includes('--all') ? !c.isRange
        : named.length ? named.includes(c.id)
            : c.group === 'long');

let strokes = 0, par = 0;
for (const c of courses) {
    let cs = 0, cp = 0;
    const rows = [];
    for (const h of c.holes) {
        const r = G3.bot.play(h, 10, G3.bagFor(h));
        const s = r.sunk ? r.strokes : NaN;
        const clubs = r.shots.map((x) => (x.club && x.club.short) || '?').join(' ');
        const len = Math.hypot(h.cup.x - h.tee.x, h.cup.z - h.tee.z);
        rows.push(`  ${String(s).padStart(3)} / ${h.par}  ${(s - h.par >= 0 ? '+' : '') + (s - h.par)}`.padEnd(18) +
            `${h.name.padEnd(22)} ${len.toFixed(0).padStart(3)}u  ${clubs}`);
        cs += s; cp += h.par;
    }
    console.log(`${c.id} — ${cs} against par ${cp} (${cs - cp >= 0 ? '+' : ''}${cs - cp})`);
    console.log(rows.join('\n'));
    strokes += cs; par += cp;
}
if (courses.length > 1) console.log(`\nall — ${strokes} against par ${par} (${strokes - par >= 0 ? '+' : ''}${strokes - par})`);
