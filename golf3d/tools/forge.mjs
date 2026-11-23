// The map forge: a batch of new World Tour holes laid on Portals worlds' own
// ground, for the owner to play and judge in dev mode (js/forge.js).
//
//   node golf3d/tools/forge.mjs --batch 1                 # 12 maps → js/forge-maps.js
//   node golf3d/tools/forge.mjs --batch 2 --count 12 --seed 7 --recipe '{"relief":1.2}'
//   node golf3d/tools/forge.mjs --batch 1 --worlds a,b,c  # these worlds, in this order
//   node golf3d/tools/forge.mjs --batch 1 --keep b1-01,b1-02 # keep these, forge the rest
//   node golf3d/tools/forge.mjs --batch 2 --count 2 --out /tmp/try.js     # a dry run: the game's file untouched
//
// Needs the local server on 8899 (python3 -m http.server 8899 from the repo
// root). Three worlds are loaded at a time; the shots are played on
// `--threads` threads (default: a core each, less one).
//
// The technique, in order (README → "The forge" has the why):
//   1. sample: the world's ground ahead of its flight, several points along
//      it and three headings at each (tools/forge-sample.mjs);
//   2. choose: the patch whose relief is nearest the recipe's, with no holes
//      in the ground and nothing too steep to hold a ball;
//   3. bake: into golf units, smoothed, the tee levelled;
//   4. pin: every cup site in the far part of the patch is levelled into a
//      green and played — the bot must hole out, and the one whose ace share
//      from the tee is nearest the recipe's wins;
//   5. paint: fairway strips along the line from tee to cup.
// Each map records the settings it was made with (`gen`), and the recipe is
// varied across the batch on purpose, so the owner's verdicts say which
// settings make good holes.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { cpus, homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { samplePatches } from './forge-sample.mjs';

const here = dirname(fileURLToPath(import.meta.url)), js = join(here, '..', 'js');
const args = process.argv.slice(2);
const one = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const BATCH = +one('--batch', 1), COUNT = +one('--count', 12), SEED = +one('--seed', BATCH * 7919);

/* The recipe. Every number here is one the owner's feedback can move:
   `relief` (golf units of rise and fall the patch should have), `maxSlope`
   (steepest cell-to-cell gradient after smoothing), `smooth` (blur passes),
   `L` and `W` (the patch, golf units), `ace` (target share of tee shots that
   go in), `scaleK` (multiplies the world's own scale: bigger is a smaller
   hole in the world). */
const RECIPE = Object.assign({
    relief: 1.6, reliefMin: 0.5, reliefMax: 4.5, maxSlope: 0.55, smooth: 2,
    L: 24, W: 16, back: 3, d: 0.5, ahead: 3, ace: 0.003, scaleK: 1, strip: 4,
    // Clutter (since batch 2): `stand` is how tall a thing standing on the
    // ground may be (golf units) before it counts, `bump` how far the raw
    // ground may stand off its own smoothing, and `lane` how wide either side
    // of the tee-to-cup line has to be clear of both. See `clutter()`.
    stand: 0.15, bump: 0.1, lane: 1.5
}, JSON.parse(one('--recipe', '{}')));
// …and how each map of the batch leans off it, so a verdict can be read
// against a setting: four lengths, three reliefs.
const LEAN = [
    { L: 0.75, relief: 0.6 }, { L: 1, relief: 1 }, { L: 1.25, relief: 1.5 },
    { L: 0.75, relief: 1.5 }, { L: 1, relief: 0.6 }, { L: 1.25, relief: 1 },
    { L: 0.75, relief: 1 }, { L: 1, relief: 1.5 }, { L: 1.25, relief: 0.6 },
    { L: 1, relief: 1 }, { L: 0.75, relief: 1.5 }, { L: 1.25, relief: 1 }
];

// The game's own modules, for building and measuring the holes.
const ctx = { console, Math, performance: { now: () => Date.now() }, localStorage: null };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['config.js', 'themes.js', 'physics.js', 'courses.js', 'tour-ground.js', 'portals.js', 'portal-worlds.js', 'endless.js', 'swing.js', 'bot.js', 'lab.js', 'forge-maps.js', 'forge.js']) {
    vm.runInContext(readFileSync(join(js, f), 'utf8'), ctx, { filename: f });
}
const G3 = ctx.G3, P = G3.physics, C = G3.CONFIG, DEG = Math.PI / 180;

function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ── choosing a patch ─────────────────────────────────────────────── */

function blur(h, nx, nz) {
    const b = Float64Array.from(h);
    for (let k = 1; k < nz - 1; k++) for (let i = 1; i < nx - 1; i++) {
        let t = 0;
        for (let a = -1; a <= 1; a++) for (let e = -1; e <= 1; e++) t += h[(k + a) * nx + i + e];
        b[k * nx + i] = (t + h[k * nx + i] * 3) / 12;
    }
    return b;
}
// Golf heights from a sampled patch, smoothed; null if it will not do.
function bake(q, r) {
    const v = q.h.filter((x) => x !== null);
    if (v.length < q.h.length * 0.98) return null;
    const lo = Math.min(...v);
    const raw = Float64Array.from(q.h, (x) => ((x === null ? lo : x) - lo) / q.scale + 0.1);
    let h = raw;
    for (let n = 0; n < r.smooth; n++) h = blur(h, q.nx, q.nz);
    const cl = clutter(q, raw, r);
    return { h, y0: lo - 0.1 * q.scale, clutter: cl.mask, covered: cl.covered };
}
/* Where the ball would roll through the world's things. Two kinds, and the
   ground probe sees neither as an obstacle — the ball can hit nothing of the
   world's, so both are drawn on the hole and passed through:
   - something standing on the ground (forge-sample.mjs → `stood`, the world
     seen from straight above): b1-10's rods, a tree's trunk, a post;
   - furniture built into the ground's own mesh, which the probe takes for
     ground: b1-07's log rollers, laid down the launch lane in the same mesh
     as the sand. They come out of the sample as bumps far sharper than land
     is — the raw height standing `bump` off its own two-pass smoothing,
     where natural ground keeps within a few hundredths.
   1 marks a cell with either; a cup is never pinned with one on its line.
   A patch more than half covered is under a ceiling, not cluttered: b1-06
   is played under the water of Fireworks Under the Wash, and from above
   its surface stood over 471 cells of 476. Whatever stands under a ceiling
   cannot be seen from above anyway, so such a patch is marked `covered`
   and judged on its bumps alone. */
function clutter(q, raw, r) {
    let sm = raw;
    for (let n = 0; n < 2; n++) sm = blur(sm, q.nx, q.nz);
    const stood = q.stood ? q.stood.filter((x) => x >= r.stand).length : 0;
    const covered = stood > raw.length / 2;
    const mask = Uint8Array.from(raw, (x, k) => ((!covered && q.stood && q.stood[k] >= r.stand) || Math.abs(x - sm[k]) >= r.bump) ? 1 : 0);
    return { mask, covered };
}
// Is the way from tee to cup clear: the lane along the line, the tee's pad and the green?
function clearLine(mask, g, tee, cup, r) {
    const ax = cup.x - tee.x, az = cup.z - tee.z, L2 = ax * ax + az * az;
    for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
        if (!mask[k * g.nx + i]) continue;
        const x = g.x0 + i * g.d, z = g.z0 + k * g.d;
        const t = Math.max(0, Math.min(1, ((x - tee.x) * ax + (z - tee.z) * az) / L2));
        if (Math.hypot(x - tee.x - ax * t, z - tee.z - az * t) <= r.lane) return false;
        if (Math.hypot(x - cup.x, z - cup.z) <= 2.6 || Math.hypot(x - tee.x, z - tee.z) <= 1.6) return false;
    }
    return true;
}
function relief(h) { let lo = Infinity, hi = -Infinity; for (const x of h) { lo = Math.min(lo, x); hi = Math.max(hi, x); } return hi - lo; }
function steepest(h, nx, nz, d) {
    let m = 0;
    for (let k = 0; k < nz - 1; k++) for (let i = 0; i < nx - 1; i++) {
        m = Math.max(m, Math.abs(h[k * nx + i + 1] - h[k * nx + i]) / d, Math.abs(h[(k + 1) * nx + i] - h[k * nx + i]) / d);
    }
    return m;
}
function level(h, g, gx, gz, r0, r1) {
    const out = Float64Array.from(h), at = heightAt(h, g, gx, gz);
    for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
        const r = Math.hypot(g.x0 + i * g.d - gx, g.z0 + k * g.d - gz);
        if (r >= r1) continue;
        const u = r <= r0 ? 0 : (r - r0) / (r1 - r0), m = u * u * (3 - 2 * u);
        out[k * g.nx + i] = at + (out[k * g.nx + i] - at) * m;
    }
    return out;
}
function heightAt(h, g, gx, gz) {
    const i = Math.max(0, Math.min(g.nx - 1, Math.round((gx - g.x0) / g.d))), k = Math.max(0, Math.min(g.nz - 1, Math.round((gz - g.z0) / g.d)));
    return h[k * g.nx + i];
}
const round = (h, p) => Array.from(h, (x) => +x.toFixed(p));

/* ── pinning it ───────────────────────────────────────────────────── */

function strips(tee, cup, w) {
    // One strip from the tee half way, one from there to short of the green:
    // two rectangles, which the paint (render.js decals, six at most) draws.
    const mx = (tee.x + cup.x) / 2, mz = (tee.z + cup.z) / 2, half = w / 2;
    const a = [Math.min(tee.x, mx) - half, tee.z + 1, Math.max(tee.x, mx) + half, mz];
    const b = [Math.min(mx, cup.x) - half, mz, Math.max(mx, cup.x) + half, cup.z - 1.4];
    return [a, b].filter((r) => r[3] - r[1] > 0.5).map((r) => r.map((x) => +x.toFixed(2)));
}
function measure(map) {
    const h = G3.forge.holeOf(map), bag = G3.bagFor(h);
    const bot = G3.bot.play(h, 10, bag);
    if (!bot.sunk) return null;
    const bear = Math.atan2(map.cup.x - map.tee.x, map.cup.z - map.tee.z) / DEG;
    const s = G3.lab.sweep(h, { step: 4, weights: 10, moments: [0], from: bear - 60, to: bear + 60 });
    // The sweep covered a third of the compass; the share is of what it played.
    const share = s.aces.length / s.sims;
    const straight = G3.lab.straight(h);
    const tee = P.surfaceTop(h, map.tee.x, map.tee.z), cup = P.surfaceTop(h, map.cup.x, map.cup.z);
    if (!tee || !cup) return null;
    return { bot: bot.strokes, share, straight: !!straight, hole: h };
}
/* The last check before a map is kept, the one that found b1-05's fault in
   batch 1: tee shots over every line and weight (every 10°, ten weights,
   every club), then from every spot a ball came to rest, does some shot
   get it out? A ball that never stops, or a spot no shot leaves, is a map
   that is broken whatever its numbers say. */
function vet(map) {
    const h = G3.forge.holeOf(map), bag = G3.bagFor(h), rests = new Map();
    let n = 0, moving = 0;
    for (const club of bag) for (let a = 0; a < 360; a += 10) for (let k = 1; k <= 10; k++) {
        const w = P.createWorld(h, { x: h.tee.x, z: h.tee.z, y: h.tee.y + C.BALL_R }, 0);
        if (!P.launch(w, a * DEG, club.power * k / 10, club.loft, club.bite)) continue;
        P.settle(w); n++;
        if (w.sunk || w.splash || w.out) continue;
        if (w.moving) moving++;
        const key = Math.round(w.ball.x * 2) + ',' + Math.round(w.ball.z * 2);
        if (!rests.has(key)) rests.set(key, { x: w.ball.x, y: w.ball.y, z: w.ball.z });
    }
    let stuck = 0;
    for (const r of rests.values()) {
        let ok = false;
        out: for (const club of bag) for (let a = 0; a < 360; a += 20) for (let k = 2; k <= 10; k += 4) {
            if (P.escapes(h, r, 0, a * DEG, club.power * k / 10, club.loft, club.bite)) { ok = true; break out; }
        }
        if (!ok) stuck++;
    }
    return { ok: moving === 0 && stuck === 0, moving, stuck, n };
}

function pin(q, base, r) {
    const g = { x0: q.x0, z0: q.z0, d: q.d, nx: q.nx, nz: q.nz };
    const tee = { x: 0, z: 0 };
    const teed = level(base.h, g, tee.x, tee.z, 1.2, 2.2);
    let best = null;
    for (let z = r.L * 0.55; z <= r.L * 0.92; z += 1.5) {
        for (let x = -(r.W / 2 - 3); x <= r.W / 2 - 3 + 1e-6; x += 1.5) {
            const cup = { x: +x.toFixed(2), z: +z.toFixed(2) };
            if (base.clutter && !clearLine(base.clutter, g, tee, cup, r)) continue;
            const h = level(teed, g, x, z, 1.6, 3.2);
            const map = {
                id: 'probe', title: 'probe', world: q.world, u: q.u, par: 3, bag: 'loft',
                grid: Object.assign({}, g, { h: round(h, 3) }), tee, cup, strips: strips(tee, cup, r.strip)
            };
            const m = measure(map);
            if (!m || m.bot > 3) continue;
            // Nearest the recipe's ace share, on a log scale; a putt at the
            // flag that drops is a hole with nothing to read, so it pays.
            // The last term only breaks ties: batch 1 had every cup the bot
            // could not ace scored alike, so the first tried won — the far
            // left edge, on six maps of ten. Between equals, nearer the middle.
            const sc = Math.abs(Math.log((m.share + 1e-4) / r.ace)) + (m.straight ? 0.8 : 0) + (m.share === 0 ? 1.5 : 0) + 0.1 * Math.abs(x) / (r.W / 2);
            if (!best || sc < best.sc) best = { sc, map, m };
        }
    }
    return best;
}

/* ── the slow half, on its own threads ───────────────────────────────

   Pinning and vetting a patch is some tens of thousands of simulated shots,
   all plain JavaScript, and it used to run on the one thread that also
   drives the browser. Now each patch's pin-and-vet goes to a pool of
   threads (this same file, run as a worker: it loads the game's modules on
   its own), one per core less one. Since the ground became one render per
   patch, these shots are most of a world's time (README → "The forge",
   Speed). */
function pinAndVet(cands, r) {
    const log = [];
    for (const c of cands) {
        const p = pin(c.q, c.b, r);
        if (!p) continue;
        const v = vet(p.map);
        if (!v.ok) { log.push(`vet failed (${v.moving} shots never stop, ${v.stuck} spots no shot leaves) — next patch`); continue; }
        return { i: cands.indexOf(c), map: p.map, m: { bot: p.m.bot, share: p.m.share, straight: p.m.straight }, log };
    }
    return { i: -1, log };
}
if (!isMainThread) {
    parentPort.on('message', (t) => parentPort.postMessage(pinAndVet(t.cands, t.r)));
} else {
/* ── the batch ────────────────────────────────────────────────────── */

const THREADS = Math.max(1, +one('--threads', Math.max(1, cpus().length - 1)));
const idle = [], waiting = [];
for (let n = 0; n < THREADS; n++) idle.push(new Worker(fileURLToPath(import.meta.url), { argv: args }));
function onThread(task) {
    return new Promise((resolve, reject) => {
        const go = (w) => {
            const done = (res) => { w.off('error', fail); idle.push(w); if (waiting.length) waiting.shift()(idle.pop()); resolve(res); };
            const fail = (e) => { w.off('message', done); reject(e); };
            w.once('message', done); w.once('error', fail);
            w.postMessage(task);
        };
        if (idle.length) go(idle.pop()); else waiting.push(go);
    });
}

const T0 = Date.now();
const tourWorlds = new Set(G3.portals.WORLDS.map((w) => w.place.world));
let pool = G3.PORTAL_INDEX.filter((row) => !tourWorlds.has(row[0]) && !/\bspace\b/.test(row[5]));
const R = rng(SEED);
pool = pool.map((row) => [R(), row]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
if (one('--worlds')) { const want = one('--worlds').split(','); pool = want.map((id) => G3.PORTAL_INDEX.find((row) => row[0] === id)).filter(Boolean); }

const require = createRequire('/opt/');
const { chromium } = require('playwright');
// Launched the first time a world is not in the cache.
let browser = null;
const launch = () => browser || (browser = chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }));
const made = [], tried = [];
/* --keep b1-01,b1-02,…: those maps of the batch on disk are carried over as
   they are (renumbered in order at the end), and neither their worlds nor
   the worlds that batch passed over are tried again. */
if (one('--keep')) {
    const keep = one('--keep').split(','), old = G3.FORGE || { maps: [] };
    old.maps.filter((m) => keep.includes(m.id)).forEach((m) => made.push(m));
    // Batch 1 was written before `passed` was kept: read it off the file's head.
    if (!old.passed) { const m = readFileSync(join(js, 'forge-maps.js'), 'utf8').match(/passed over: ([^.]*)\./); old.passed = m ? m[1].split(/,\s*/) : []; }
    const skip = new Set(made.map((m) => m.world).concat(old.passed || []));
    pool = pool.filter((row) => !skip.has(row[0]));
    (old.passed || []).forEach((w) => tried.push([w, 'passed over in the batch kept from']));
}

/* The samples, kept on disk (README → "The forge", Speed). Only `W`, `L`,
   `back`, `d`, `ahead` and `scaleK` change what is sampled; everything else
   in the recipe acts on a patch already sampled. So each world is sampled
   once, at the longest `L` any lean asks for, and cropped to each lean's;
   the sample is kept under a key made of those numbers, the headings and
   points along the flight, and the source of backdrop.mjs and
   forge-sample.mjs (either changed is a new sample). A second batch, or a
   second try at one with the recipe moved, skips the browser for every
   world it has seen. `--cache <dir>` puts it elsewhere, `--no-cache`
   neither reads nor writes it. */
const GROUND = one('--ground', 'render');
const SAMPLE_L = Math.max(...LEAN.map((l) => Math.round(RECIPE.L * l.L)));
const CACHE = args.includes('--no-cache') ? null : one('--cache', join(homedir(), '.cache', 'loft-links-forge'));
const SRC = createHash('sha1').update(readFileSync(join(js, 'backdrop.mjs'))).update(readFileSync(join(here, 'forge-sample.mjs'))).digest('hex');
const stats = { cached: 0, sampled: 0, load: 0, ground: 0, stood: 0 };
async function sampled(world) {
    const R = {
        us: [0.2, 0.35, 0.5, 0.65, 0.8], turns: [-0.5, 0, 0.5], ahead: RECIPE.ahead,
        W: RECIPE.W, L: SAMPLE_L, back: RECIPE.back, d: RECIPE.d, scaleK: RECIPE.scaleK, ground: GROUND
    };
    const key = createHash('sha1').update(JSON.stringify([world, R, SRC])).digest('hex').slice(0, 16);
    const file = CACHE && join(CACHE, world + '-' + key + '.json');
    if (file && existsSync(file)) { stats.cached++; return JSON.parse(readFileSync(file, 'utf8')); }
    const s = await samplePatches(await launch(), world, R);
    if (s.error) return s;
    stats.sampled++;
    for (const k of ['load', 'ground', 'stood']) stats[k] += s.t[k] || 0;
    if (file) { mkdirSync(CACHE, { recursive: true }); writeFileSync(file, JSON.stringify(s)); }
    return s;
}
// A patch sampled long, cut to `L`: its rows run from the tee's back edge up
// the line of play, so the first rows are the shorter patch.
function crop(q, L) {
    const nz = Math.round((L + q.back) / q.d) + 1;
    if (nz >= q.nz) return Object.assign({}, q);
    const n = nz * q.nx, h = q.h.slice(0, n);
    return Object.assign({}, q, { nz, h, stood: q.stood && q.stood.slice(0, n), miss: h.filter((x) => x === null).length });
}

async function forgeOne(row, li) {
    const lean = LEAN[li];
    const r = Object.assign({}, RECIPE, { L: Math.round(RECIPE.L * lean.L), relief: +(RECIPE.relief * lean.relief).toFixed(2) });
    const s = await sampled(row[0]);
    if (s.error) return { why: 'load: ' + s.error };
    s.patches = s.patches.map((q) => crop(Object.assign(q, { back: -q.z0 }), r.L));
    // Every patch baked and scored; the ones that pass are tried for a pin, best first.
    const scored = [];
    for (const q of s.patches) {
        q.world = row[0];
        const b = bake(q, r);
        if (!b) continue;
        const rel = relief(b.h), sl = steepest(b.h, q.nx, q.nz, q.d);
        if (rel < r.reliefMin || rel > r.reliefMax || sl > r.maxSlope) continue;
        if ((q.flightY - b.y0) / q.scale < 2) continue;
        scored.push({ q, b, rel, sl, sc: Math.abs(Math.log(rel / r.relief)) + sl });
    }
    if (!scored.length) return { why: 'no patch: ' + s.patches.length + ' sampled, none with relief ' + r.reliefMin + '–' + r.reliefMax + ' and slope ≤ ' + r.maxSlope };
    scored.sort((a, b) => a.sc - b.sc);
    const top = scored.slice(0, 3), got = await onThread({ cands: top.map((c) => ({ q: c.q, b: c.b })), r });
    const log = got.log.map((l) => `  ${row[0]}: ${l}`);
    if (got.i >= 0) {
        const c = top[got.i], q = c.q, map = got.map, p = { m: got.m };
        map.title = row[1];
        map.par = p.m.bot <= 2 ? 3 : 4;
        map.at = { x: +q.ox.toFixed(2), z: +q.oz.toFixed(2), y: +c.b.y0.toFixed(2), yaw: +q.yaw.toFixed(4), scale: +q.scale.toFixed(3) };
        map.u = q.u;
        // `clutter`: cells of the patch with something on them (off the line
        // of play, which is clear) — so a `clip` verdict can be read against
        // it; `covered`: the patch is under a ceiling (see `clutter()`).
        map.gen = { L: r.L, relief: r.relief, got: +c.rel.toFixed(2), slope: +c.sl.toFixed(2), u: q.u, turn: q.turn, scale: +q.scale.toFixed(2), smooth: r.smooth, clutter: c.b.clutter.reduce((a, x) => a + x, 0) };
        if (c.b.covered) map.gen.covered = true;
        map.metrics = { bot: p.m.bot, ace: +(p.m.share * 100).toFixed(3), straight: p.m.straight };
        return { map, log };
    }
    return { why: 'no pin: ' + scored.length + ' patches passed, no cup with a clear line that the bot holes in three', log };
}

/* Three worlds are worked at once, but kept in the pool's order, so a batch
   is the same however long each world takes (and whether it came from the
   cache). A map's lean is the next one the batch needs when its world's turn
   comes, as if the worlds were done one at a time. A world started early is
   started on the lean it would get if every world still in hand before it
   failed, which most do; if one of them makes a map instead, the world is
   done again on the right lean. Until batch 2's speed work the lean was
   taken when a world started, so which world got which lean depended on
   which finished first, and a faster run made a different batch. */
const inHand = new Map();
let startAt = 0;
const begin = (k) => {
    const li = made.length % LEAN.length, t0 = Date.now();
    inHand.set(k, forgeOne(pool[k], li).then((res) => ({ res, li, t0 }), (e) => ({ res: { why: 'error: ' + String(e.message || e).slice(0, 120), log: [] }, li, t0 })));
};
for (let at = 0; made.length < COUNT && at < pool.length; at++) {
    while (startAt < pool.length && startAt < at + 3) begin(startAt++);
    const row = pool[at];
    let { res, li, t0 } = await inHand.get(at);
    inHand.delete(at);
    if (li !== made.length % LEAN.length) { t0 = Date.now(); res = await forgeOne(row, made.length % LEAN.length); }
    (res.log || []).forEach((l) => console.log(l));
    if (res.map) {
        res.map.id = 'b' + BATCH + '-' + String(made.length + 1).padStart(2, '0');
        made.push(res.map);
        console.log(`✓ ${res.map.id} ${row[0]} — par ${res.map.par}, bot ${res.map.metrics.bot}, ace ${res.map.metrics.ace}%, relief ${res.map.gen.got} (${Math.round((Date.now() - t0) / 1000)}s)`);
    } else {
        tried.push([row[0], res.why]);
        console.log(`✗ ${row[0]} — ${res.why}`);
    }
}
// Worlds started past the last one needed are let finish, and not counted.
await Promise.all(inHand.values());
if (browser) await (await browser).close();
idle.forEach((w) => w.terminate());

made.sort((a, b) => a.id.localeCompare(b.id));
made.forEach((m, i) => { m.id = 'b' + BATCH + '-' + String(i + 1).padStart(2, '0'); });
const out = `/* The forge's batch ${BATCH}: holes laid by tools/forge.mjs on Portals worlds'
   own ground, not approved yet (dev mode → New maps, js/forge.js). Generated:
   do not edit by hand — run the tool again. Recipe: ${JSON.stringify(RECIPE)}.
   Worlds tried and passed over: ${tried.map((t) => t[0]).join(', ') || 'none'}. */
window.G3 = window.G3 || {};
window.G3.FORGE = ${JSON.stringify({ batch: BATCH, recipe: RECIPE, maps: made, passed: tried.map((t) => t[0]) })};
`;
const dest = one('--out', join(js, 'forge-maps.js'));
writeFileSync(dest, out);
console.log(`wrote ${dest}: batch ${BATCH}, ${made.length} maps (${tried.length} worlds passed over)`);
console.log(`browser: ${stats.sampled} worlds sampled (load ${Math.round(stats.load / 1000)}s, ground ${Math.round(stats.ground / 1000)}s, stood ${Math.round(stats.stood / 1000)}s, summed over pages), ${stats.cached} from the cache; ${Math.round((Date.now() - T0) / 1000)}s in all`);
}
