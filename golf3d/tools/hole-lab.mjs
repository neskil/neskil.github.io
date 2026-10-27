// The hole lab, from the command line: every line and every weight from the
// tee of every drawn hole, how many of them are aces and where, whether a shot
// aimed straight at the flag drops, and the caddie's card.
//
//   node golf3d/tools/hole-lab.mjs                       # every mini, crazy and adventure hole
//   node golf3d/tools/hole-lab.mjs seaside quarry        # any course ids
//   node golf3d/tools/hole-lab.mjs works --hole 3        # one hole (or --hole 1,3,4)
//   node golf3d/tools/hole-lab.mjs --coarse              # 1° and 25 weights: a quarter of the work
//   node golf3d/tools/hole-lab.mjs --json out.json       # and the numbers, for hole-lab.html
//
// js/lab.js is the measure and hole-lab.html draws it; this deals the sweep
// out across the machine's cores, because a hole is ~36,000 settled shots per
// club per moment and a page cannot afford that. Plain Node, no install: the
// game's own modules in a vm context, as tools/par-check.mjs does, so the
// numbers are the game's numbers. README → "The hole lab" says what they mean.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpus } from 'node:os';
import vm from 'node:vm';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

const here = fileURLToPath(import.meta.url);
const js = join(dirname(here), '..', 'js');

function load() {
    const ctx = { console, Math, performance: { now: () => Date.now() } };
    ctx.window = ctx;
    vm.createContext(ctx);
    for (const f of ['config.js', 'physics.js', 'courses.js', 'swing.js', 'bot.js', 'lab.js']) {
        vm.runInContext(readFileSync(join(js, f), 'utf8'), ctx, { filename: f });
    }
    return ctx.G3;
}

if (!isMainThread) {
    const G3 = load();
    parentPort.on('message', (job) => {
        const hole = G3.courseById(job.course).holes[job.hole];
        let out;
        if (job.kind === 'sweep') {
            out = G3.lab.sweep(hole, { step: job.step, weights: job.weights, from: job.from, to: job.to });
        } else if (job.kind === 'straight') {
            out = { putt: G3.lab.straight(hole), lofted: G3.lab.straight(hole, { lofted: true }) };
        } else {
            const r = G3.bot.play(hole, 10, G3.bagFor(hole));
            out = { sunk: r.sunk, strokes: r.strokes, clubs: r.shots.map((s) => s.club.short) };
        }
        parentPort.postMessage({ id: job.id, out });
    });
} else {
    const args = process.argv.slice(2);
    const flag = (n) => args.includes(n);
    const value = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
    const valued = new Set([value('--hole'), value('--json'), value('--workers')].filter(Boolean));
    const named = args.filter((a) => !a.startsWith('--') && !valued.has(a));
    const coarse = flag('--coarse');
    const step = coarse ? 1 : 0.5, weights = coarse ? 25 : 50;
    const G3 = load();
    const C = G3.CONFIG;

    const courses = G3.COURSES.filter((c) => named.length ? named.includes(c.id)
        : C.MINI_GROUPS.includes(c.group));
    const holes = [];
    for (const c of courses) {
        c.holes.forEach((h, i) => {
            if (value('--hole') && value('--hole').split(',').indexOf(String(i + 1)) < 0) return;
            holes.push({ course: c.id, index: i, hole: h });
        });
    }
    if (!holes.length) { console.error('No holes match.'); process.exit(1); }

    // The compass in twelve slices per hole, so one slow hole is spread over
    // every core rather than left on one of them at the end.
    const SLICES = 12;
    const jobs = [];
    holes.forEach((x, k) => {
        jobs.push({ kind: 'bot', course: x.course, hole: x.index, k });
        jobs.push({ kind: 'straight', course: x.course, hole: x.index, k });
        for (let s = 0; s < SLICES; s++) {
            jobs.push({ kind: 'sweep', course: x.course, hole: x.index, k, step, weights,
                from: 360 * s / SLICES, to: 360 * (s + 1) / SLICES });
        }
    });
    jobs.forEach((j, i) => { j.id = i; });

    const results = holes.map(() => ({ sweep: { sims: 0, aces: [], per: {} } }));
    const n = Math.max(1, Number(value('--workers')) || cpus().length);
    let next = 0, done = 0;
    const started = Date.now();

    await new Promise((resolve, reject) => {
        for (let w = 0; w < Math.min(n, jobs.length); w++) {
            const worker = new Worker(here);
            const feed = () => {
                if (next >= jobs.length) { worker.terminate(); return; }
                worker.postMessage(jobs[next++]);
            };
            worker.on('message', ({ id, out }) => {
                const job = jobs[id], r = results[job.k];
                if (job.kind === 'sweep') {
                    r.sweep.sims += out.sims;
                    r.sweep.aces.push(...out.aces);
                    r.sweep.moments = out.moments;
                    for (const [club, row] of Object.entries(out.per)) {
                        const t = r.sweep.per[club] || (r.sweep.per[club] = { sims: 0, aces: 0 });
                        t.sims += row.sims; t.aces += row.aces;
                    }
                } else r[job.kind] = out;
                done++;
                if (process.stderr.isTTY) process.stderr.write(`\r${done}/${jobs.length} jobs`);
                if (done === jobs.length) resolve();
                feed();
            });
            worker.on('error', reject);
            feed();
        }
    });
    if (process.stderr.isTTY) process.stderr.write('\n');

    const pct = (x) => (x * 100).toFixed(3) + '%';
    const report = holes.map((x, k) => {
        const r = results[k], h = x.hole;
        // The share a player gets out of the club they would pick for it.
        let best = null;
        for (const [club, row] of Object.entries(r.sweep.per)) {
            const share = row.aces / row.sims;
            if (!best || share > best.share) best = { club, share };
        }
        const wins = G3.lab.windows(r.sweep.aces, step);
        return {
            course: x.course, hole: x.index + 1, name: h.name, par: h.par,
            sims: r.sweep.sims, aces: r.sweep.aces.length, per: r.sweep.per,
            best, verdict: G3.lab.verdict(best && best.share),
            windows: wins.slice(0, 6), windowCount: wins.length,
            straight: r.straight, bot: r.bot,
            aceList: flag('--json') ? r.sweep.aces : undefined
        };
    });

    let course = null;
    for (const r of report) {
        if (r.course !== course) { course = r.course; console.log(`\n${G3.courseById(course).name} (${course})`); }
        const s = r.straight;
        const flags = [
            s.putt ? `STRAIGHT PUTT drops (${s.putt.club} ${Math.round(s.putt.power * 100)}%${s.putt.at ? ' t' + s.putt.at : ''})` : '',
            s.lofted ? `straight ${s.lofted.club} drops (${Math.round(s.lofted.power * 100)}%)` : '',
            r.bot.sunk ? '' : 'BOT NEVER HOLES OUT'
        ].filter(Boolean).join(' · ');
        const w = r.windows[0];
        console.log(`  ${String(r.hole)}  ${r.name.padEnd(22)} par ${r.par}  ` +
            `aces ${(r.best ? r.best.club + ' ' + pct(r.best.share) : '-').padEnd(16)} ${r.verdict.padEnd(9)} ` +
            `${String(r.windowCount).padStart(3)} win${w ? `, widest ${w.club} ${w.a0}–${w.a1}° ${Math.round(w.p0 * 100)}–${Math.round(w.p1 * 100)}%${w.at ? ' t' + w.at : ''}` : ''}  ` +
            `bot ${r.bot.strokes}${flags ? '  ← ' + flags : ''}`);
    }
    console.log(`\n${report.length} holes, ${jobs.length} jobs on ${n} workers, ${((Date.now() - started) / 1000).toFixed(0)}s` +
        ` (${step}° × ${weights} weights)`);

    if (value('--json')) {
        writeFileSync(value('--json'), JSON.stringify({ step, weights, version: G3.VERSION, holes: report }));
        console.log(`wrote ${value('--json')}`);
    }
}
