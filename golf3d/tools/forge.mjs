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
import { readFileSync, writeFileSync } from 'node:fs';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { cpus } from 'node:os';
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
    // Batch 2 (from batch 1's feedback, README → "The forge", Batch 2): every
    // map of ten was rated difficulty 1 and nine `short`, five asked for
    // "the long game" and two for a hazard. So the holes are long-game holes
    // now (`long`: the full bag, par by length), three times the length and
    // half as wide again, sampled a unit apart (the cost of a patch stays
    // what it was), with twice the relief.
    relief: 3, reliefMin: 1.2, reliefMax: 8, maxSlope: 0.55, smooth: 2,
    L: 56, W: 24, back: 3, d: 1, ahead: 3, ace: 0.003, scaleK: 1, strip: 5,
    long: true,
    // Clutter (since batch 2): `stand` is how tall a thing standing on the
    // ground may be (golf units) before it counts, `bump` how far the raw
    // ground may stand off its own smoothing, and `lane` how wide either side
    // of the tee-to-cup line has to be clear of both. See `clutter()`.
    // `bump` is in raw golf units, and scales with the square of `d`: 0.1 was
    // set at d 0.5, so 0.4 at d 1.
    stand: 0.15, bump: 0.4, lane: 1.2,
    // Hazards (batch 2: "have some hazard … so it's some kind of challenge /
    // strategy", "the sprites of the sides could be out of bounds"):
    // `pond` is the share of the patch flooded in its hollows (`ponds()`);
    // `outs` makes whatever of the world's stands on the hole off the line
    // out of bounds, so a ball that stops among the trees is replayed rather
    // than rolled through them; `risk` is the share of tee shots fanned
    // round the line that should end wet or out — the hazards in play.
    pond: 0.08, outs: true, risk: 0.25, smoothHard: 8,
    // `turnCost`: a patch off the flight's heading pays this per radian
    // (batch 1's `camera` issues were both on turned patches).
    turnCost: 0.6
}, JSON.parse(one('--recipe', '{}')));
// …and how each map of the batch leans off it, so a verdict can be read
// against a setting: four lengths, three reliefs.
const LEAN = [
    { L: 0.75, relief: 0.6 }, { L: 1, relief: 1 }, { L: 1.25, relief: 1.5 },
    { L: 0.75, relief: 1.5 }, { L: 1, relief: 0.6 }, { L: 1.25, relief: 1 },
    { L: 0.75, relief: 1 }, { L: 1, relief: 1.5 }, { L: 1.25, relief: 0.6 },
    { L: 1, relief: 1 }, { L: 0.75, relief: 1.5 }, { L: 1.25, relief: 1 }
];
// Par by length for a long-game hole (CONFIG.CLUBS: a driver runs about
// forty units), as the drawn long courses have it.
function parFor(tee, cup) {
    const d = Math.hypot(cup.x - tee.x, cup.z - tee.z);
    return d < 28 ? 3 : d < 60 ? 4 : 5;
}

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
    return { h, y0: lo - 0.1 * q.scale, clutter: cl.mask, standing: cl.standing, covered: cl.covered };
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
    const standing = Uint8Array.from(raw, (x, k) => (!covered && q.stood && q.stood[k] >= r.stand) ? 1 : 0);
    const mask = Uint8Array.from(raw, (x, k) => (standing[k] || Math.abs(x - sm[k]) >= r.bump) ? 1 : 0);
    return { mask, standing, covered };
}
// Is the way from tee to cup clear: the lane along the line, the tee's pad and the green?
function clearLine(mask, g, tee, cup, r) {
    const ax = cup.x - tee.x, az = cup.z - tee.z, L2 = ax * ax + az * az;
    for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
        if (!mask[k * g.nx + i]) continue;
        const x = g.x0 + i * g.d, z = g.z0 + k * g.d;
        const t = Math.max(0, Math.min(1, ((x - tee.x) * ax + (z - tee.z) * az) / L2));
        /* A long hole is played over the world's things, not along the
           floor between them (batch 2: Flinching Forest has a tree within a
           unit of every straight forty-unit line), and they are out of
           bounds there (`outs`): only its tee and its green must be clear. */
        if (!r.long && Math.hypot(x - tee.x - ax * t, z - tee.z - az * t) <= r.lane) return false;
        if (Math.hypot(x - cup.x, z - cup.z) <= (r.long ? 2.2 : 2.6) || Math.hypot(x - tee.x, z - tee.z) <= (r.long ? 1.2 : 1.6)) return false;
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

/* Water in the hollows (batch 2). The lowest `share` of the patch is
   flooded, at one level, so long as the tee and the green stay dry with a
   margin round them and the hollow is deep enough to read as water (a
   fifth of a unit). The water is one rectangle over every flooded cell at
   that level: the ball drowns only where the ground is under it, so a dry
   rise inside the rectangle stays dry, and on the world the plane shows
   only where its ground dips below it — a pond, not a sheet. */
function ponds(h, g, tee, cup, share, greenR) {
    if (!share) return null;
    const keep = [], low = [];
    for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
        const x = g.x0 + i * g.d, z = g.z0 + k * g.d, v = h[k * g.nx + i];
        if (Math.hypot(x - tee.x, z - tee.z) < 4 || Math.hypot(x - cup.x, z - cup.z) < greenR + 2.5) keep.push(v);
        else low.push(v);
    }
    if (!low.length) return null;
    low.sort((a, b) => a - b);
    let lvl = low[Math.min(low.length - 1, Math.floor(h.length * share))];
    lvl = Math.min(lvl, Math.min(...keep) - 0.15);
    if (lvl - low[0] < 0.2) return null;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, n = 0;
    for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
        if (h[k * g.nx + i] >= lvl) continue;
        const x = g.x0 + i * g.d, z = g.z0 + k * g.d;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); n++;
    }
    if (n < 6) return null;
    const e = g.d / 2;
    return { rect: [+(x0 - e).toFixed(2), +(z0 - e).toFixed(2), +(x1 - x0 + 2 * e).toFixed(2), +(z1 - z0 + 2 * e).toFixed(2), +lvl.toFixed(3)], cells: n };
}
// The world's things off the line, as out-of-bounds cells (sparse indices into the grid).
function outsOf(standing, g, tee, cup, greenR) {
    if (!standing) return [];
    const out = [];
    for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
        if (!standing[k * g.nx + i]) continue;
        const x = g.x0 + i * g.d, z = g.z0 + k * g.d;
        if (Math.hypot(x - tee.x, z - tee.z) < 1.2 || Math.hypot(x - cup.x, z - cup.z) < 2.2) continue;
        out.push(k * g.nx + i);
    }
    return out;
}

/* ── pinning it ───────────────────────────────────────────────────── */

function strips(tee, cup, w, gr) {
    gr = gr || 1.3;
    // One strip from the tee half way, one from there to short of the green:
    // two rectangles, which the paint (render.js decals, six at most) draws.
    const mx = (tee.x + cup.x) / 2, mz = (tee.z + cup.z) / 2, half = w / 2;
    const a = [Math.min(tee.x, mx) - half, tee.z + 1, Math.max(tee.x, mx) + half, mz];
    const b = [Math.min(mx, cup.x) - half, mz, Math.max(mx, cup.x) + half, cup.z - gr - 0.1];
    return [a, b].filter((r) => r[3] - r[1] > 0.5).map((r) => r.map((x) => +x.toFixed(2)));
}
function measure(map) {
    const h = G3.forge.holeOf(map), bag = G3.bagFor(h);
    const bot = G3.bot.play(h, 10, bag);
    if (!bot.sunk) return null;
    if (map.long) {
        // A long hole is not aced; what it has to have is hazards in play.
        // `risk`: tee shots with every club at three weights, fanned 30°
        // either side of the line, that end in the water or out.
        const bear = Math.atan2(map.cup.x - map.tee.x, map.cup.z - map.tee.z);
        let n = 0, lost = 0;
        for (const club of bag) for (let a = -30; a <= 30; a += 6) for (const k of [0.6, 0.8, 1]) {
            const w = P.createWorld(h, { x: h.tee.x, z: h.tee.z, y: h.tee.y + C.BALL_R }, 0);
            if (!P.launch(w, bear + a * DEG, club.power * k, club.loft, club.bite)) continue;
            P.settle(w); n++;
            if (w.splash || w.out) lost++;
        }
        return { bot: bot.strokes, share: 0, risk: n ? lost / n : 0, straight: false, hole: h };
    }
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
    /* The tee: the patch's origin unless something of the world's stands
       there (batch 2: Sea of Wax has a hull over it on every patch), then the
       first clear spot across the near end. */
    let tee = { x: 0, z: 0 };
    if (base.clutter) {
        const clear = (tx) => { for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) if (base.clutter[k * g.nx + i] && Math.hypot(g.x0 + i * g.d - tx, g.z0 + k * g.d) <= 1.6) return false; return true; };
        const tx = [0, -3, 3, -6, 6, -9, 9].filter((x) => Math.abs(x) <= r.W / 2 - 2).find(clear);
        if (tx !== undefined) tee = { x: tx, z: 0 };
    }
    const teed = level(base.h, g, tee.x, tee.z, 1.2, 2.2);
    // A long hole's green is a long-game green, six units across.
    const gr = r.long ? 3 : 1.3, step = Math.max(1.5, r.L / 16);
    let best = null;
    const why = { line: 0, bot: 0, par: 0 };
    for (let z = r.L * 0.55; z <= r.L * 0.92; z += step) {
        for (let x = -(r.W / 2 - gr - 2); x <= r.W / 2 - gr - 2 + 1e-6; x += step) {
            const cup = { x: +x.toFixed(2), z: +z.toFixed(2) };
            if (base.clutter && !clearLine(base.clutter, g, tee, cup, r)) {
                why.line++;
                continue;
            }
            const h = level(teed, g, x, z, gr + 0.3, gr + 2.2);
            const map = {
                id: 'probe', title: 'probe', world: q.world, u: q.u, par: r.long ? parFor(tee, cup) : 3,
                bag: r.long ? 'long' : 'loft', grid: Object.assign({}, g, { h: round(h, 3) }), tee, cup,
                strips: strips(tee, cup, r.strip, gr)
            };
            if (r.long) { map.long = true; map.green = gr; }
            const pond = ponds(h, g, tee, cup, r.pond, gr);
            if (pond) map.water = [pond.rect];
            const outs = r.outs ? outsOf(base.standing, g, tee, cup, gr) : [];
            if (outs.length) map.outs = outs;
            const m = measure(map);
            if (r.long) {
                // The perfect bot one under par (a birdie for a perfect
                // round, as on the drawn long courses), and the hazards in
                // play near the recipe's share. Ties to the middle.
                if (!m) { why.bot++; continue; }
                if (m.bot > map.par) { why.par++; continue; }
                const sc = Math.abs(m.bot - (map.par - 1)) + 3 * Math.abs(m.risk - r.risk) + 0.1 * Math.abs(x) / (r.W / 2);
                if (!best || sc < best.sc) best = { sc, map, m };
                continue;
            }
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
    if (!best && process.env.FORGE_DEBUG) console.log(`  ${q.world} u${q.u} t${q.turn}: no pin — line blocked ${why.line}, bot never holed ${why.bot}, over par ${why.par}; ${base.standing ? base.standing.reduce((a, x) => a + x, 0) : 0} cells standing, ${base.clutter.reduce((a, x) => a + x, 0)} cluttered`);
    return best;
}

/* ── the slow half, on its own threads ───────────────────────────────

   Pinning and vetting a patch is some tens of thousands of simulated shots,
   all plain JavaScript, and it used to run on the one thread that also
   drives the browser. Now each patch's pin-and-vet goes to a pool of
   threads (this same file, run as a worker: it loads the game's modules on
   its own), one per core less one. Most of a world's time is still the
   browser's, loading and probing it (README → "The forge", Speed). */
function pinAndVet(cands, r) {
    const log = [];
    for (const c of cands) {
        const p = pin(c.q, c.b, r);
        if (!p) continue;
        const v = vet(p.map);
        if (!v.ok) { log.push(`vet failed (${v.moving} shots never stop, ${v.stuck} spots no shot leaves) — next patch`); continue; }
        return { i: cands.indexOf(c), map: p.map, m: { bot: p.m.bot, share: p.m.share, straight: p.m.straight, risk: p.m.risk }, log };
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

const tourWorlds = new Set(G3.portals.WORLDS.map((w) => w.place.world));
let pool = G3.PORTAL_INDEX.filter((row) => !tourWorlds.has(row[0]) && !/\bspace\b/.test(row[5]));
const R = rng(SEED);
pool = pool.map((row) => [R(), row]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
if (one('--worlds')) { const want = one('--worlds').split(','); pool = want.map((id) => G3.PORTAL_INDEX.find((row) => row[0] === id)).filter(Boolean); }
/* --first a,b: these worlds before the rest (batch 2: the six batch 1 rated
   "keep if fixed", forged again with the new recipe); --skip a,b: never these
   (the ones it dropped). */
if (one('--skip')) { const no = new Set(one('--skip').split(',')); pool = pool.filter((row) => !no.has(row[0])); }
if (one('--first')) {
    const want = one('--first').split(','), set = new Set(want);
    pool = want.map((id) => G3.PORTAL_INDEX.find((row) => row[0] === id)).filter(Boolean).concat(pool.filter((row) => !set.has(row[0])));
}

const require = createRequire('/opt/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
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
let next = 0;

async function forgeOne(row) {
    const lean = LEAN[made.length % LEAN.length];
    const r = Object.assign({}, RECIPE, { L: Math.round(RECIPE.L * lean.L), relief: +(RECIPE.relief * lean.relief).toFixed(2) });
    const s = await samplePatches(browser, row[0], {
        us: [0.2, 0.35, 0.5, 0.65, 0.8], turns: [-0.5, 0, 0.5], ahead: r.ahead,
        W: r.W, L: r.L, back: r.back, d: r.d, scaleK: r.scaleK
    });
    if (s.error) return { why: 'load: ' + s.error };
    // Every patch baked and scored; the ones that pass are tried for a pin, best first.
    /* Every patch baked and scored. A world whose every patch is too
       steep is baked once more with `smoothHard` passes before it is passed
       over (batch 2: Sea of Wax, the batch-1 map rated "bumpy, great
       potential", has slopes of 1 to 3 on a long patch at two passes). */
    const scored = [];
    for (const passes of [r.smooth, r.smoothHard || 0]) {
        if (!passes || scored.length) continue;
        const rr = Object.assign({}, r, { smooth: passes });
        for (const q of s.patches) {
            q.world = row[0];
            const b = bake(q, rr);
            if (process.env.FORGE_DEBUG && !b) console.log(`  ${row[0]} u${q.u} t${q.turn}: holes in the ground (${q.h.filter((x) => x === null).length}/${q.h.length})`);
            if (!b) continue;
            const rel = relief(b.h), sl = steepest(b.h, q.nx, q.nz, q.d);
            if (process.env.FORGE_DEBUG) console.log(`  ${row[0]} u${q.u} t${q.turn} ×${passes}: relief ${rel.toFixed(2)} slope ${sl.toFixed(2)} flight ${((q.flightY - b.y0) / q.scale).toFixed(1)} scale ${q.scale.toFixed(2)}`);
            if (rel < r.reliefMin || rel > r.reliefMax || sl > r.maxSlope) continue;
            if ((q.flightY - b.y0) / q.scale < 2) continue;
            scored.push({ q, b, rel, sl, smooth: passes, sc: Math.abs(Math.log(rel / r.relief)) + sl + (r.turnCost || 0) * Math.abs(q.turn) });
        }
    }
    if (!scored.length) return { why: 'no patch: ' + s.patches.length + ' sampled, none with relief ' + r.reliefMin + '–' + r.reliefMax + ' and slope ≤ ' + r.maxSlope };
    scored.sort((a, b) => a.sc - b.sc);
    const top = scored.slice(0, 3), got = await onThread({ cands: top.map((c) => ({ q: c.q, b: c.b })), r });
    got.log.forEach((l) => console.log(`  ${row[0]}: ${l}`));
    if (got.i >= 0) {
        const c = top[got.i], q = c.q, map = got.map, p = { m: got.m };
        const idx = made.length + 1, id = 'b' + BATCH + '-' + String(idx).padStart(2, '0');
        map.id = id;
        map.title = row[1];
        if (!map.long) map.par = p.m.bot <= 2 ? 3 : 4;
        map.at = { x: +q.ox.toFixed(2), z: +q.oz.toFixed(2), y: +c.b.y0.toFixed(2), yaw: +q.yaw.toFixed(4), scale: +q.scale.toFixed(3) };
        map.u = q.u;
        // `clutter`: cells of the patch with something on them (off the line
        // of play, which is clear) — so a `clip` verdict can be read against
        // it; `covered`: the patch is under a ceiling (see `clutter()`).
        map.gen = { L: r.L, relief: r.relief, got: +c.rel.toFixed(2), slope: +c.sl.toFixed(2), u: q.u, turn: q.turn, scale: +q.scale.toFixed(2), smooth: c.smooth, clutter: c.b.clutter.reduce((a, x) => a + x, 0) };
        if (c.b.covered) map.gen.covered = true;
        if (map.long) map.gen.long = true;
        if (map.water) map.gen.pond = map.water[0][4];
        if (map.outs) map.gen.outs = map.outs.length;
        map.metrics = { bot: p.m.bot, ace: +(p.m.share * 100).toFixed(3), straight: p.m.straight };
        if (map.long) map.metrics.risk = +(p.m.risk * 100).toFixed(1);
        return { map };
    }
    return { why: 'no pin: ' + scored.length + ' patches passed, no cup with a clear line that the bot holes in three' };
}

async function worker() {
    while (made.length < COUNT && next < pool.length) {
        const row = pool[next++];
        const t0 = Date.now();
        const res = await forgeOne(row);
        if (res.map && made.length < COUNT) {
            made.push(res.map);
            console.log(`✓ ${res.map.id} ${row[0]} — par ${res.map.par}, bot ${res.map.metrics.bot}, ace ${res.map.metrics.ace}%, risk ${res.map.metrics.risk}%, relief ${res.map.gen.got}, pond ${res.map.gen.pond}, outs ${res.map.gen.outs} (${Math.round((Date.now() - t0) / 1000)}s)`);
        } else if (!res.map) {
            tried.push([row[0], res.why]);
            console.log(`✗ ${row[0]} — ${res.why}`);
        }
    }
}
await Promise.all([worker(), worker(), worker()]);
await browser.close();
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
}
