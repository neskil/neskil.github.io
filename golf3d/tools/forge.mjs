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
    // Batch 2 (from batch 1's feedback, README → "The forge", Batch 2): every
    // map of ten was rated difficulty 1 and nine `short`, five asked for
    // "the long game" and two for a hazard. So the holes are long-game holes
    // now (`long`: the full bag, par by length), three times the length and
    // half as wide again, sampled a unit apart (the cost of a patch stays
    // what it was), with twice the relief.
    relief: 3, reliefMin: 1.8, reliefMax: 6, maxSlope: 0.5, smooth: 2,
    // `L` 70 → 85 and `par` [34, 72] → [45, 95] in batch 5: re-forged on
    // their own patches with the bot with hands, batch 4's fixes played a
    // 47-unit par four in 2.3 and sixty units in 3.0 — a driver carries
    // about forty, so a person needs two real shots only past fifty-five.
    L: 85, W: 24, back: 3, d: 1, ahead: 3, ace: 0.003, scaleK: 1, strip: 5,
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
    pond: 0.08, outs: true, risk: 0.45, smoothHard: 8,
    // `turnCost`: a patch off the flight's heading pays this per radian
    // (batch 1's `camera` issues were both on turned patches).
    turnCost: 0.6,
    // Batch 3 (from batch 2's verdicts, README → "The forge", Batch 3): four
    // of the five rated said `short` (L 42 and 56), every one was rated
    // difficulty 1 or 2, and the two drops were the flattest patch (the
    // forest, steepest cell 0.05, 268 cells of trees out) and the steepest
    // (the erg, relief 7.47). So `L` 56 → 70, `risk` 0.25 → 0.35,
    // `reliefMax` 8 → 6, `maxSlope` 0.55 → 0.5, and two new numbers:
    // `minSlope`, the steepest cell a patch must at least have (batch 1's
    // drops were its flattest too), and `clutterCost`, what a patch pays per
    // share of its cells with the world's things on them (the keep had
    // none). `longClear`: both `clip` maps had the world's things on the
    // line where a ball comes down and runs, so past that share of the way
    // to the cup a long hole's lane must be clear as a short one's is.
    minSlope: 0.2, clutterCost: 2, longClear: 0.45,
    // Batch 4 (from batch 3's verdicts, README → "The forge", Batch 4): ten
    // of thirteen rated said `flat`, every one difficulty 1 or 2, and the
    // notes asked for "some obstacle or hazard", "the tree should have
    // collision" and "some fairway and green". Relief alone was not it — the
    // three steepest maps (4.7 to 5.5 of relief) were drops, two of them
    // `flat` too — so the moves are more hazard than height:
    // `reliefMin` 1.2 → 1.8 and `minSlope` 0.12 → 0.2 (the flattest maps
    // went: 0.67 to 1.32 of relief, a steepest cell of 0.14 to 0.16);
    // `risk` 0.35 → 0.45; `dig`/`digR`, a basin pressed in and flooded
    // beside the green where the patch has no hollow of its own (`digPond`);
    // `solid`, the middles of the world's things struck by the ball
    // (`solidOf`); `paint`, the fairway and the green painted on the world.
    // `noEagle`: no cup the perfect bot holes in two under par (`pin`). Off:
    // tried for batch 4, it turned down every cup of every world tried — the
    // perfect bot chips in from wherever its drive stops.
    dig: 0.45, digR: 4.5, solid: true, paint: true, noEagle: false, par: [45, 95],
    // Batch 5 (from batch 4's verdicts and the four batches before it,
    // README → "The forge", Batch 5, and FORGE-FEEDBACK.md → "What four
    // batches taught"). Every batch has come back "easy", and the reason
    // was the measuring stick: cups were chosen for the perfect bot, which
    // played every par four of batch 4 in two, where the bot with a
    // person's hands (CONFIG.BOT_HANDS, tools/human-check.mjs) averaged 3.1
    // — a stroke under par for a person, on every map. So:
    // `hands`: rounds of the bot with hands played on each of the best
    // `handsTop` cups, and the cup chosen whose average is nearest par +
    // `overPar` with `wet` balls a round in the water or out. `honest`
    // (off): a hole that many strokes under par for it would be given the
    // par it plays to. Tried at 0.4 and at 1, it made glowwood's sixty
    // units a "par three" (330 metres on the screen), and the owner had
    // taken five there and still called it easy: they average about one
    // and a half over the bot with hands, so what "easy" measures is a hole
    // that asks nothing, not its score (FORGE-FEEDBACK.md, lesson 1).
    hands: 6, handsTop: 4, overPar: 0.3, wet: 0.4, honest: 0,
    // `rough`: the ground off the fairway is rough (it was fairway from edge
    // to edge: open land, nothing to miss), and the fairway is one band
    // `fairwayW` wide from the tee to the green (forge.js → `fairway`),
    // painted as it rolls.
    rough: true, fairwayW: 7,
    // `mini`: the owner, "some of the new maps can be mini golf style for
    // the worlds as well". A lean marked `mini` makes a short hole out of
    // the mini bag with these over the recipe: gentle ground, a narrow
    // painted lane, all of it fairway, a small dug pond.
    /* Batch 6 (from batch 5's verdicts, README → "The forge", Batch 6): the
       notes were "too straight" (the Tree City, fun 1), "too straight. What
       is the challenge?" (glowwood, look 5) and "if longer then ok" (the
       Fields of Gazing Grain, a par three of 43). Every forged hole until
       now was one straight band from the tee to the cup, the cup pulled to
       the middle of the patch on a tie, so nothing on it was a choice.
       `bend`: a long hole's fairway turns at an elbow `bend` units off the
       straight line from the tee to the cup, `bendAt` of the way up it, and
       the pond is dug on the inside of the corner, where the straight line
       comes down — cut it and carry the water, or play round (`pin`). */
    bend: 9, bendAt: 0.55,
    mini: { L: 26, relief: 1.2, reliefMin: 0.5, reliefMax: 3, maxSlope: 0.35, minSlope: 0.08, long: false, rough: false,
            fairwayW: 3.5, ace: 0.004, dig: 0.35, digR: 2.5, lane: 1, overPar: -0.2, bend: 0 }
}, JSON.parse(one('--recipe', '{}')));
// …and how each map of the batch leans off it, so a verdict can be read
// against a setting: four lengths, three reliefs.
// Since batch 5 a quarter of the maps are mini-golf holes (`mini`), two of
// the first five, since a copy is played from the top (FORGE-FEEDBACK.md,
// lesson 4). Leans 1 and 3 are where they were, for `--lean`.
// Batch 6: the shortest lean 0.75 → 0.9 (the Fields of Gazing Grain, a par
// three at the 64-unit lean: "if longer then ok … the challenge to hit two
// straight drivers in a row").
const LEAN = [
    { L: 0.9, relief: 0.6 }, { L: 1, relief: 1 }, { mini: true }, { L: 1.25, relief: 1.5 },
    { mini: true }, { L: 0.9, relief: 1.5 }, { L: 1, relief: 0.6 }, { L: 1.25, relief: 1 },
    { mini: true }, { L: 1, relief: 1.5 }, { L: 0.9, relief: 1 }, { L: 1.25, relief: 0.6 }
];
const leanL = (l) => l.mini ? RECIPE.mini.L : Math.round(RECIPE.L * l.L);
// Par by length for a long-game hole (CONFIG.CLUBS: a driver runs about
// forty units). Until batch 4 it was the drawn long courses' (under 28 a
// three, under 60 a four), and batch 3 came back with its par fours played
// in three and its par five in three, a drive and a drive: a forged hole is
// open land twenty-four units wide with no rough, so it is stricter now —
// a four from 34 units, a five from 72 (`par`: [34, 72]).
// Measured along the fairway since batch 6: round the elbow when it bends.
function parFor(tee, cup, r, elbow) {
    const d = elbow ? Math.hypot(elbow.x - tee.x, elbow.z - tee.z) + Math.hypot(cup.x - elbow.x, cup.z - elbow.z) : Math.hypot(cup.x - tee.x, cup.z - tee.z),
        p = (r && r.par) || [28, 60];
    return d < p[0] ? 3 : d < p[1] ? 4 : 5;
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
    return { h, y0: lo - 0.1 * q.scale, clutter: cl.mask, standing: cl.standing, covered: cl.covered, wet: q.wet || null,
             wetShare: q.wet ? q.wet.reduce((a, x) => a + x, 0) / q.wet.length : 0 };
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
    /* …and the world's water (batch 5, forge-sample.mjs → `wet`): a ball
       may fly it, never rest on it (out, as the world's things are), and
       the tee, the green and the landing stay off it as they stay off a
       trunk. */
    const standing = Uint8Array.from(raw, (x, k) => ((!covered && q.stood && q.stood[k] >= r.stand) || (q.wet && q.wet[k])) ? 1 : 0);
    const mask = Uint8Array.from(raw, (x, k) => (standing[k] || Math.abs(x - sm[k]) >= r.bump) ? 1 : 0);
    return { mask, standing, covered };
}
// Is the way from tee to cup clear: the lane along the line, the tee's pad and the green?
/* With an elbow (batch 6, `bend`) the line that has to be clear is the
   fairway's second leg, where the approach comes down and runs, and the
   elbow where the drive lands; the straight line across the corner is the
   gamble, and the world's things on it are welcome. */
function clearLine(mask, g, tee, cup, r, elbow) {
    if (elbow) {
        for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
            if (!mask[k * g.nx + i]) continue;
            const x = g.x0 + i * g.d, z = g.z0 + k * g.d;
            if (segDist(x, z, [elbow.x, elbow.z, cup.x, cup.z]) <= r.lane || Math.hypot(x - elbow.x, z - elbow.z) <= 2.5) return false;
            if (Math.hypot(x - cup.x, z - cup.z) <= 2.2 || Math.hypot(x - tee.x, z - tee.z) <= 1.2) return false;
        }
        return true;
    }
    const ax = cup.x - tee.x, az = cup.z - tee.z, L2 = ax * ax + az * az;
    for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
        if (!mask[k * g.nx + i]) continue;
        const x = g.x0 + i * g.d, z = g.z0 + k * g.d;
        const t = Math.max(0, Math.min(1, ((x - tee.x) * ax + (z - tee.z) * az) / L2));
        /* A long hole is played over the world's things, not along the
           floor between them (batch 2: Flinching Forest has a tree within a
           unit of every straight forty-unit line), and they are out of
           bounds there (`outs`): only its tee and its green must be clear. */
        if ((!r.long || t >= (r.longClear || 1)) && Math.hypot(x - tee.x - ax * t, z - tee.z - az * t) <= r.lane) return false;
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
function ponds(h, g, tee, cup, share, greenR, standing) {
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
    /* Not over the world's things (batch 6, the owner's picture of A Great
       Huge Game of Chess: a pond lying across the knight's pedestal). A
       hollow with anything of the world's standing in its water is left dry. */
    if (standing) for (let c = 0; c < h.length; c++) if (standing[c] && h[c] < lvl) {
        const x = g.x0 + (c % g.nx) * g.d, z = g.z0 + Math.floor(c / g.nx) * g.d;
        if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return null;
    }
    const e = g.d / 2;
    return { rect: [+(x0 - e).toFixed(2), +(z0 - e).toFixed(2), +(x1 - x0 + 2 * e).toFixed(2), +(z1 - z0 + 2 * e).toFixed(2), +lvl.toFixed(3)], cells: n };
}
// The world's things off the line, as out-of-bounds cells (sparse indices into the grid).
/* Not on the fairway band either (batch 6): the world clears its trees from
   the band (render.js → the clearing), and a cell left out there is out of
   bounds on open fairway, where nothing is drawn. */
function outsOf(standing, g, tee, cup, greenR, fw) {
    if (!standing) return [];
    const out = [];
    for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
        if (!standing[k * g.nx + i]) continue;
        const x = g.x0 + i * g.d, z = g.z0 + k * g.d;
        if (Math.hypot(x - tee.x, z - tee.z) < 1.2 || Math.hypot(x - cup.x, z - cup.z) < 2.2) continue;
        if (fw && fwDist(x, z, fw) < fw[4] / 2 + 0.8) continue;
        out.push(k * g.nx + i);
    }
    return out;
}

/* The trunks (batch 4: "the tree should have collision"). What stands on
   the hole was seen from above (forge-sample.mjs → `stood`), so a tree is
   its crown's whole round shadow: struck there, the ball would bounce off
   air a long way from the trunk. So only the middle of each thing is made
   hard — each standing cell's distance in from the nearest clear one, and
   of each connected thing the cells within a cell of its deepest — which is
   a trunk under a crown, the spine of a wall, and the whole of a rod or a
   post. Each is as tall as the thing stands there (golf units, at least
   0.6), so a ball flown over it goes on. Nothing on the tee, the green or
   the strips is made hard: the world clears its things from the strips
   (backdrop.mjs → sculpt), and a trunk that is not drawn must not be hit.
   Returns [cell, height] pairs (forge.js → solidGrid). */
function solidOf(standing, stood, g, tee, cup, greenR, strips, fw, wet) {
    if (!standing || !stood) return [];
    const n = g.nx * g.nz, on = new Uint8Array(n);
    const inStrip = (x, z) => (strips || []).some((r) => x > r[0] - 0.8 && x < r[2] + 0.8 && z > r[1] - 0.8 && z < r[3] + 0.8) ||
        (fw && fwDist(x, z, fw) < fw[4] / 2 + 0.8) ||
        Math.hypot(x - cup.x, z - cup.z) < greenR + 1.1 || Math.hypot(x - tee.x, z - tee.z) < 2;
    for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
        const c = k * g.nx + i;
        // Water is out, never a trunk.
        if (standing[c] && !(wet && wet[c]) && !inStrip(g.x0 + i * g.d, g.z0 + k * g.d)) on[c] = 1;
    }
    // Chessboard distance in from the nearest clear cell (or the patch's edge).
    const dist = new Int32Array(n).fill(0), q = [];
    for (let c = 0; c < n; c++) if (!on[c]) { dist[c] = 0; q.push(c); } else dist[c] = 1e6;
    for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
        const c = k * g.nx + i;
        if (on[c] && (i === 0 || k === 0 || i === g.nx - 1 || k === g.nz - 1)) { dist[c] = 1; q.push(c); }
    }
    for (let h = 0; h < q.length; h++) {
        const c = q[h], i = c % g.nx, k = (c - i) / g.nx;
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
            const ii = i + b, kk = k + a;
            if (ii < 0 || kk < 0 || ii >= g.nx || kk >= g.nz) continue;
            const e = kk * g.nx + ii;
            if (dist[e] > dist[c] + 1) { dist[e] = dist[c] + 1; q.push(e); }
        }
    }
    // Each connected thing's deepest cell, and the cells within one of it.
    const comp = new Int32Array(n).fill(-1), deep = [], out = [];
    for (let c0 = 0; c0 < n; c0++) {
        if (!on[c0] || comp[c0] >= 0) continue;
        const id = deep.length, st = [c0];
        let D = 0;
        comp[c0] = id;
        for (let h = 0; h < st.length; h++) {
            const c = st[h], i = c % g.nx, k = (c - i) / g.nx;
            D = Math.max(D, dist[c]);
            for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
                const ii = i + b, kk = k + a;
                if (ii < 0 || kk < 0 || ii >= g.nx || kk >= g.nz) continue;
                const e = kk * g.nx + ii;
                if (on[e] && comp[e] < 0) { comp[e] = id; st.push(e); }
            }
        }
        deep.push(D);
    }
    for (let c = 0; c < n; c++) {
        // A thing two cells deep or less (a crown three across) keeps only its middle.
        const D = deep[comp[c]];
        if (!on[c] || dist[c] < (D <= 2 ? D : D - 1)) continue;
        out.push([c, +Math.max(0.6, Math.min(12, stood[c])).toFixed(2)]);
    }
    return out;
}

/* Water where the patch has no hollow (batch 4: "Need some obstacle or
   Hazard", on a par five rated fun 4 with nothing on it). A basin `digR`
   in radius with a level floor `dig` under the water (`basin`; half a unit
   is about the most a world shows, README → "Round two of finishing"),
   the water a fifth of a unit under its lowest rim, as forge-finish --dig
   does by hand. It goes short of the green, or failing that where a drive
   comes down, on the side of the line the ground already falls to; the
   first site that holds twelve cells of water wins. The tee and the green
   stay dry. Returns the dug ground and the water, or null. */
function digPond(h, g, tee, cup, greenR, r, first, standing) {
    if (!r.dig) return null;
    const R = r.digR || 3.5, ax = cup.x - tee.x, az = cup.z - tee.z, L = Math.hypot(ax, az), ux = ax / L, uz = az / L;
    const back = greenR + R + 0.6, x1 = g.x0 + (g.nx - 1) * g.d, z1 = g.z0 + (g.nz - 1) * g.d;
    const mean = (cx, cz) => { let t = 0, m = 0; for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) if (Math.hypot(g.x0 + i * g.d - cx, g.z0 + k * g.d - cz) < R) { t += h[k * g.nx + i]; m++; } return t / Math.max(1, m); };
    // In order: short of the green either side, then where a drive comes
    // down (55% of the way) either side and on the line; each pair the
    // lower side first, where the ground already falls.
    const at = (t, side, off) => ({ cx: tee.x + ax * t + side * uz * off, cz: tee.z + az * t - side * ux * off });
    const tg = 1 - back / L, groups = first ? [first] : [[at(tg, -1, R * 0.75), at(tg, 1, R * 0.75)], [at(0.55, -1, R), at(0.55, 1, R)], [at(0.55, 0, 0)]];
    for (const grp of groups) {
        for (const s of grp.map((p) => Object.assign(p, { low: mean(p.cx, p.cz) })).sort((p, q) => p.low - q.low)) {
            const { cx, cz } = s;
            if (cx - R < g.x0 + 1 || cx + R > x1 - 1 || cz - R < g.z0 + 1 || cz + R > z1 - 1) continue;
            if (Math.hypot(cx - tee.x, cz - tee.z) < R + 5 || Math.hypot(cx - cup.x, cz - cup.z) < greenR + R + 0.5) continue;
            // The inside of a dogleg's corner: the fairway stays dry.
            if (s.fw && fwDist(cx, cz, s.fw) < R + s.fw[4] / 2 + 0.2) continue;
            /* Never where the world's things stand (batch 6: b5-01's pond was
               dug round the House of Four Seasons' snowmen, which stood up
               through the water — "water occlusion issue with the placed
               water obstacle"). The basin presses the world's ground, not
               what stands on it. */
            if (standing && standingNear(standing, g, cx, cz, R * 1.15)) continue;
            let rim = Infinity, keep = Infinity;
            for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
                const x = g.x0 + i * g.d, z = g.z0 + k * g.d, q = Math.hypot(x - cx, z - cz), c = k * g.nx + i;
                if (q > R * 1.15 && q < R * 1.35) rim = Math.min(rim, h[c]);
                // The tee and the green stay dry where the water's box reaches them.
                if (Math.abs(x - cx) <= R + 0.5 && Math.abs(z - cz) <= R + 0.5 &&
                    (Math.hypot(x - tee.x, z - tee.z) < 3 || Math.hypot(x - cup.x, z - cup.z) < greenR + 1)) keep = Math.min(keep, h[c]);
            }
            const lvl = Math.min(rim - 0.2, keep - 0.15), out = basin(h, g, cx, cz, R, r.dig, lvl);
            let x0 = Infinity, xx = -Infinity, z0 = Infinity, zz = -Infinity, n = 0;
            for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
                const x = g.x0 + i * g.d, z = g.z0 + k * g.d;
                if (out[k * g.nx + i] >= lvl || Math.abs(x - cx) > R || Math.abs(z - cz) > R) continue;
                x0 = Math.min(x0, x); xx = Math.max(xx, x); z0 = Math.min(z0, z); zz = Math.max(zz, z); n++;
            }
            if (n < 12) continue;
            const e = g.d / 2;
            return { h: out, rect: [+(x0 - e).toFixed(2), +(z0 - e).toFixed(2), +(xx - x0 + 2 * e).toFixed(2), +(zz - z0 + 2 * e).toFixed(2), +lvl.toFixed(3)], cells: n };
        }
    }
    return null;
}

function standingNear(standing, g, cx, cz, R) {
    for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
        if (standing[k * g.nx + i] && Math.hypot(g.x0 + i * g.d - cx, g.z0 + k * g.d - cz) < R) return true;
    }
    return false;
}

/* A basin with a level floor: pressed `depth` under the water's level `lvl`
   at its middle and eased back to the ground at its rim, never cut more than
   0.8 into a bank. Pressed relative to the ground instead, as batch 3's
   digs were, a basin on a slope is a tilted dish that holds a puddle at its
   low edge (nine cells, on Before the Fire's valley). The same in
   forge-finish.mjs → --dig. */
function basin(h, g, cx, cz, R, depth, lvl) {
    const out = Float64Array.from(h);
    for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
        const q = Math.hypot(g.x0 + i * g.d - cx, g.z0 + k * g.d - cz) / R, c = k * g.nx + i;
        if (q >= 1) continue;
        const floor = lvl - depth * 0.5 * (1 + Math.cos(Math.PI * q)), e = Math.max(0, (q - 0.5) / 0.5), s = e * e * (3 - 2 * e);
        if (h[c] > floor) out[c] = Math.max(h[c] - 0.8, floor + (h[c] - floor) * s);
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
/* The fairway band (batch 5): from just in front of the tee to the
   green's middle, `w` wide, round-ended (forge.js → holeOf lays it as a
   road, render.js paints the same shape). */
/* With an elbow (batch 6) it is [x0, z0, ex, ez, width, x1, z1]: the band
   runs on from the elbow to the green, a second road (forge.js → holeOf). */
function fairwayOf(tee, cup, gr, w, elbow) {
    const to = elbow || cup, ax = to.x - tee.x, az = to.z - tee.z, L = Math.hypot(ax, az) || 1;
    const f = [+(tee.x + ax / L * 1.2).toFixed(2), +(tee.z + az / L * 1.2).toFixed(2), to.x, to.z, w];
    if (elbow) f.push(cup.x, cup.z);
    return f;
}
// The distance from the fairway band's centreline, round the elbow if it has one.
function fwDist(x, z, f) {
    const a = segDist(x, z, f);
    return f.length >= 7 ? Math.min(a, segDist(x, z, [f[2], f[3], f[5], f[6]])) : a;
}
/* Where a dogleg's elbow goes for a cup (batch 6, `bend`): `bendAt` of the
   way up, `bend` off the straight line on the side away from the cup (both
   sides for a cup near the middle), inside the patch with room for the
   band. Returns the elbows worth trying, each with the inside of its corner
   (where the pond is dug: on the straight line, pushed just far enough off
   the band to leave it dry). */
function elbowsFor(tee, cup, r) {
    if (!r.bend || !r.long) return [null];
    const out = [], t = r.bendAt || 0.55, lim = r.W / 2 - r.fairwayW / 2 - 1;
    const sides = Math.abs(cup.x - tee.x) < 2 ? [-1, 1] : [cup.x > tee.x ? -1 : 1];
    const lx = tee.x + (cup.x - tee.x) * t, lz = tee.z + (cup.z - tee.z) * t;
    for (const s of sides) {
        const ex = Math.max(-lim, Math.min(lim, lx + s * r.bend));
        if (Math.abs(ex - lx) < r.bend * 0.6) continue;
        const e = { x: +ex.toFixed(2), z: +lz.toFixed(2), off: +(ex - lx).toFixed(2) };
        // Stepped off the band until the basin clears it (the legs slant, so the offset alone is short).
        const R = r.digR || 3.5, fw = fairwayOf(tee, cup, 3, r.fairwayW, e);
        let cx = lx;
        while (fwDist(cx, lz, fw) < R + r.fairwayW / 2 + 0.4 && Math.abs(cx) < r.W / 2) cx -= s * 0.25;
        e.inside = { cx: +cx.toFixed(2), cz: +lz.toFixed(2) };
        out.push(e);
    }
    return out.length ? out : [null];
}
function segDist(x, z, f) {
    const ax = f[2] - f[0], az = f[3] - f[1], t = Math.max(0, Math.min(1, ((x - f[0]) * ax + (z - f[1]) * az) / (ax * ax + az * az || 1)));
    return Math.hypot(x - f[0] - ax * t, z - f[1] - az * t);
}
/* The bot with a person's hands (CONFIG.BOT_HANDS; tools/human-check.mjs),
   `n` rounds, seeded: its average and the balls a round wet or out. */
function handsOf(map, n) {
    const h = G3.forge.holeOf(map), bag = G3.bagFor(h);
    let t = 0, wet = 0;
    for (let k = 0; k < n; k++) {
        const res = G3.bot.play(h, 12, bag, { hands: C.BOT_HANDS, rng: rng(k * 7919 + 13) });
        t += res.strokes;
        res.shots.forEach((s) => { if (s.world.splash || s.world.out) wet++; });
    }
    return { avg: t / n, wet: wet / n };
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
    const why = { line: 0, bot: 0, par: 0 }, cands = [];
    for (let z = r.L * 0.55; z <= r.L * 0.92; z += step) {
        for (let x = -(r.W / 2 - gr - 2); x <= r.W / 2 - gr - 2 + 1e-6; x += step) {
            const cup = { x: +x.toFixed(2), z: +z.toFixed(2) };
            for (const elbow of elbowsFor(tee, cup, r)) {
            if (base.clutter && !clearLine(base.clutter, g, tee, cup, r, elbow)) {
                why.line++;
                continue;
            }
            let h = level(teed, g, x, z, gr + 0.3, gr + 2.2);
            const fw = r.fairwayW ? fairwayOf(tee, cup, gr, r.fairwayW, elbow) : null;
            /* A dogleg's pond is dug on the inside of its corner first (batch
               6), whatever hollow the patch has: it is what makes the corner
               a choice. Failing that, as before: the patch's own hollow, or a
               basin short of the green. Dug on a mini hole too since batch 5
               (a mini hole is never `long`). */
            let dug = elbow ? digPond(h, g, tee, cup, gr, r, [Object.assign({ fw }, elbow.inside)], base.standing) : null;
            const pond = dug ? null : ponds(h, g, tee, cup, r.pond, gr, base.standing);
            if (!dug && !pond && (r.long || r.isMini)) dug = digPond(h, g, tee, cup, gr, r, null, base.standing);
            if (dug) h = dug.h;
            const map = {
                id: 'probe', title: 'probe', world: q.world, u: q.u, par: r.long ? parFor(tee, cup, r, elbow) : 3,
                bag: r.long ? 'long' : 'loft', grid: Object.assign({}, g, { h: round(h, 3) }), tee, cup,
                strips: r.fairwayW ? undefined : strips(tee, cup, r.strip, gr)
            };
            if (!map.strips) delete map.strips;
            if (fw) map.fairway = fw;
            if (elbow) map.bend = elbow.off;
            if (r.rough) map.rough = true;
            if (r.long) { map.long = true; map.green = gr; }
            if (pond) map.water = [pond.rect];
            if (dug) { map.water = [dug.rect]; map.dug = true; }
            const outs = r.outs ? outsOf(base.standing, g, tee, cup, gr, fw) : [];
            if (outs.length) map.outs = outs;
            const solid = r.solid ? solidOf(base.standing, q.stood, g, tee, cup, gr, map.strips, map.fairway, base.wet) : [];
            if (solid.length) map.solid = solid;
            if (r.paint) map.paint = true;
            const m = measure(map);
            if (r.long) {
                // The perfect bot one under par (a birdie for a perfect
                // round, as on the drawn long courses), and the hazards in
                // play near the recipe's share. Ties to the middle.
                if (!m) { why.bot++; continue; }
                if (m.bot > map.par) { why.par++; continue; }
                /* …and not two under (batch 4): batch 3's par fours were
                   played in three and its par five in three, and the forge
                   had made every one of them a hole the perfect bot played in
                   two. An eagle for it is a birdie for a person. */
                if (r.noEagle && m.bot < map.par - 1) { why.eagle = (why.eagle || 0) + 1; continue; }
                /* Until batch 5 this also paid for every stroke the perfect
                   bot was off a birdie, which ranked first the cups it could
                   birdie — the easy ones — before anything else was asked.
                   The bot with hands judges difficulty now (below); here
                   only the hazards in play and the tie to the middle. */
                /* A dogleg is not pulled to the middle (batch 6): the tie-break
                   to the middle is what laid every hole of batch 5 straight up
                   its patch. */
                const sc = (r.hands ? 0 : Math.abs(m.bot - (map.par - 1))) + 3 * Math.abs(m.risk - r.risk) + (elbow ? 0 : 0.1 * Math.abs(x) / (r.W / 2));
                cands.push({ sc, map, m });
                continue;
            }
            if (!m || m.bot > 3) continue;
            // Nearest the recipe's ace share, on a log scale; a putt at the
            // flag that drops is a hole with nothing to read, so it pays.
            // The last term only breaks ties: batch 1 had every cup the bot
            // could not ace scored alike, so the first tried won — the far
            // left edge, on six maps of ten. Between equals, nearer the middle.
            const sc = Math.abs(Math.log((m.share + 1e-4) / r.ace)) + (m.straight ? 0.8 : 0) + (m.share === 0 ? 1.5 : 0) + 0.1 * Math.abs(x) / (r.W / 2);
            cands.push({ sc, map, m });
            }
        }
    }
    /* The bot with hands (batch 5): the best few cups by the perfect bot's
       reading are played `hands` rounds each as a person would, and the one
       whose average is nearest par + `overPar`, with about `wet` balls a
       round in trouble, wins. Batch 4 is why: the perfect bot played every
       par four in two and could not tell one cup from another, and the bot
       with hands averaged 3.1 on all of them, which is what the owner's
       "easy" on every map of every batch was saying. */
    cands.sort((a, b) => a.sc - b.sc);
    for (const c of cands.slice(0, r.hands ? (r.handsTop || 3) : 1)) {
        if (r.hands) {
            const hd = handsOf(c.map, r.hands);
            const want = (r.long ? c.map.par : 3) + (r.overPar || 0);
            c.m.hands = hd.avg; c.m.wet = hd.wet;
            c.sc2 = Math.abs(hd.avg - want) + 0.5 * Math.abs(hd.wet - (r.wet || 0)) + 0.2 * c.sc;
        } else c.sc2 = c.sc;
        if (!best || c.sc2 < best.sc2) best = c;
    }
    /* …and a long hole a person still plays well under its par by length
       is given the par it plays to: a "par four" played in three is a par
       three, and calling it four is what made batch 4's two-stroke holes
       eagles. */
    if (best && r.long && r.hands && r.honest && best.m.hands <= best.map.par - r.honest) {
        best.m.lenPar = best.map.par;
        best.map.par = Math.max(3, Math.round(best.m.hands - (r.overPar || 0)));
    }
    if (!best && process.env.FORGE_DEBUG) console.log(`  ${q.world} u${q.u} t${q.turn}: no pin — line blocked ${why.line}, bot never holed ${why.bot}, over par ${why.par}, eagle ${why.eagle || 0}; ${base.standing ? base.standing.reduce((a, x) => a + x, 0) : 0} cells standing, ${base.clutter.reduce((a, x) => a + x, 0)} cluttered`);
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
        return { i: cands.indexOf(c), map: p.map, m: { bot: p.m.bot, share: p.m.share, straight: p.m.straight, risk: p.m.risk, hands: p.m.hands, wet: p.m.wet, lenPar: p.m.lenPar }, log };
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
// Launched the first time a world is not in the cache.
let browser = null;
const launch = () => browser || (browser = chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }));
const made = [], tried = [];
/* --with <file>:<id>[,<file>:<id>…]: maps out of other batch files — a fix
   finished by hand (forge-finish --write) or a world forged alone with its
   own recipe — at the head of the batch, in that order; their worlds are not
   forged again. --keep b1-01,b1-02,…: those maps of the batch on disk are
   carried over as they are, after the ones forged now (since batch 3: the new
   recipe is what is played first), and neither their worlds nor the worlds
   that batch passed over are tried again. Either way a map keeps its rating
   key (forge.js → keyFor), which does not read its id. */
const rank = new Map();
if (one('--with')) {
    for (const ref of one('--with').split(',')) {
        const at = ref.lastIndexOf(':'), f = ref.slice(0, at), id = ref.slice(at + 1);
        const data = JSON.parse(readFileSync(f, 'utf8').match(/window\.G3\.FORGE = (\{[\s\S]*\});\s*$/)[1]);
        const m = data.maps.find((x) => x.id === id);
        if (!m) throw new Error('--with: no map ' + id + ' in ' + f);
        rank.set(m, rank.size);
        made.push(m);
    }
    const skip = new Set(made.map((m) => m.world));
    pool = pool.filter((row) => !skip.has(row[0]));
}
if (one('--keep')) {
    const keep = one('--keep').split(','), old = G3.FORGE || { maps: [] };
    old.maps.filter((m) => keep.includes(m.id)).forEach((m) => { rank.set(m, 1e6 + rank.size); made.push(m); });
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
const SAMPLE_L = Math.max(...LEAN.map(leanL));
const CACHE = args.includes('--no-cache') ? null : one('--cache', join(homedir(), '.cache', 'loft-links-forge'));
const SRC = createHash('sha1').update(readFileSync(join(js, 'backdrop.mjs'))).update(readFileSync(join(here, 'forge-sample.mjs'))).digest('hex');
const stats = { cached: 0, sampled: 0, load: 0, ground: 0, stood: 0 };
async function sampled(world) {
    const R = {
        us: [0.2, 0.35, 0.5, 0.65, 0.8], turns: [-0.5, 0, 0.5], ahead: RECIPE.ahead,
        W: RECIPE.W, L: SAMPLE_L, back: RECIPE.back, d: RECIPE.d, scaleK: RECIPE.scaleK, ground: GROUND,
        crops: [...new Set(LEAN.map(leanL))]
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
// the line of play, so the first rows are the shorter patch. What stands on
// it was drawn for each length on its own (forge-sample.mjs → `stoodBy`).
function crop(q, L) {
    const nz = Math.min(q.nz, Math.round((L + q.back) / q.d) + 1);
    const n = nz * q.nx, h = q.h.slice(0, n);
    return Object.assign({}, q, { nz, h, wet: q.wet ? q.wet.slice(0, n) : null, stood: q.stoodBy && L in q.stoodBy ? q.stoodBy[L] : null, miss: h.filter((x) => x === null).length });
}

async function forgeOne(row, li) {
    const lean = LEAN[li];
    const r = lean.mini ? Object.assign({}, RECIPE, RECIPE.mini, { isMini: true })
        : Object.assign({}, RECIPE, { L: Math.round(RECIPE.L * lean.L), relief: +(RECIPE.relief * lean.relief).toFixed(2) });
    const s = await sampled(row[0]);
    if (s.error) return { why: 'load: ' + s.error };
    s.patches = s.patches.map((q) => crop(Object.assign(q, { back: -q.z0 }), r.L));
    // Every patch baked and scored; the ones that pass are tried for a pin, best first.
    /* Every patch baked and scored. A world whose every patch is too
       steep is baked once more with `smoothHard` passes before it is passed
       over (batch 2: Sea of Wax, the batch-1 map rated "bumpy, great
       potential", has slopes of 1 to 3 on a long patch at two passes). */
    const scored = [];
    for (const passes of [r.smooth, r.smoothHard || 0]) {
        if (!passes || scored.length) continue;
        const rr = Object.assign({}, r, { smooth: passes });
        // `us` in the recipe: only these points along the flight (b1-09, "wrong spot?": forging one world at another place).
        // …and `turns`: only these headings (a fix re-forged on the very patch it was rated on).
        for (const q of s.patches.filter((q) => (!r.us || r.us.includes(q.u)) && (!r.turns || r.turns.includes(q.turn)))) {
            q.world = row[0];
            const b = bake(q, rr);
            if (process.env.FORGE_DEBUG && !b) console.log(`  ${row[0]} u${q.u} t${q.turn}: holes in the ground (${q.h.filter((x) => x === null).length}/${q.h.length})`);
            if (!b) continue;
            const rel = relief(b.h), sl = steepest(b.h, q.nx, q.nz, q.d);
            if (process.env.FORGE_DEBUG) console.log(`  ${row[0]} u${q.u} t${q.turn} ×${passes}: relief ${rel.toFixed(2)} slope ${sl.toFixed(2)} flight ${((q.flightY - b.y0) / q.scale).toFixed(1)} scale ${q.scale.toFixed(2)}`);
            if (rel < r.reliefMin || rel > r.reliefMax || sl > r.maxSlope || sl < (r.minSlope || 0)) continue;
            // A patch that is mostly the world's water is a hole on a lake (batch 5: the Mountain, the Tower, the Chinar Terraces).
            if (b.wetShare > (r.wetMax || 0.3)) { if (process.env.FORGE_DEBUG) console.log(`  ${row[0]} u${q.u} t${q.turn}: ${Math.round(b.wetShare * 100)}% water`); continue; }
            if ((q.flightY - b.y0) / q.scale < 2) continue;
            const busy = b.covered ? 0 : b.clutter.reduce((a, x) => a + x, 0) / b.clutter.length;
            scored.push({ q, b, rel, sl, smooth: passes, sc: Math.abs(Math.log(rel / r.relief)) + sl + (r.turnCost || 0) * Math.abs(q.turn) + (r.clutterCost || 0) * busy });
        }
    }
    if (!scored.length) return { why: 'no patch: ' + s.patches.length + ' sampled, none with relief ' + r.reliefMin + '–' + r.reliefMax + ' and slope ' + (r.minSlope || 0) + '–' + r.maxSlope };
    scored.sort((a, b) => a.sc - b.sc);
    const top = scored.slice(0, 3), got = await onThread({ cands: top.map((c) => ({ q: c.q, b: c.b })), r });
    const log = got.log.map((l) => `  ${row[0]}: ${l}`);
    if (got.i >= 0) {
        const c = top[got.i], q = c.q, map = got.map, p = { m: got.m };
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
        if (r.isMini) map.gen.mini = true;
        if (p.m.hands !== undefined) { map.gen.hands = +p.m.hands.toFixed(2); map.gen.wet = +p.m.wet.toFixed(2); }
        if (p.m.lenPar !== undefined) map.gen.lenPar = p.m.lenPar;
        if (map.water) map.gen.pond = map.water[0][4];
        if (map.outs) map.gen.outs = map.outs.length;
        if (map.solid) map.gen.solid = map.solid.length;
        if (c.b.wetShare) map.gen.water = +c.b.wetShare.toFixed(2);
        if (map.dug) { map.gen.dug = true; delete map.dug; }
        if (map.bend) { map.gen.bend = map.bend; delete map.bend; }
        map.metrics = { bot: p.m.bot, ace: +(p.m.share * 100).toFixed(3), straight: p.m.straight };
        if (map.long) map.metrics.risk = +(p.m.risk * 100).toFixed(1);
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
/* --lean n: the batch's first map is forged on lean n rather than 0 — for
   a fix re-forged alone on the length it was rated at (batch 4). */
const inHand = new Map(), PRE = made.length - (+one('--lean', 0));
let startAt = 0;
const begin = (k) => {
    const li = (made.length - PRE) % LEAN.length, t0 = Date.now();
    inHand.set(k, forgeOne(pool[k], li).then((res) => ({ res, li, t0 }), (e) => ({ res: { why: 'error: ' + String(e.message || e).slice(0, 120), log: [] }, li, t0 })));
};
for (let at = 0; made.length < COUNT && at < pool.length; at++) {
    while (startAt < pool.length && startAt < at + 3) begin(startAt++);
    const row = pool[at];
    let { res, li, t0 } = await inHand.get(at);
    inHand.delete(at);
    if (li !== (made.length - PRE) % LEAN.length) { t0 = Date.now(); res = await forgeOne(row, (made.length - PRE) % LEAN.length); }
    (res.log || []).forEach((l) => console.log(l));
    if (res.map) {
        res.map.id = 'b' + BATCH + '-' + String(made.length + 1).padStart(2, '0');
        made.push(res.map);
        console.log(`✓ ${res.map.id} ${row[0]} — par ${res.map.par}, bot ${res.map.metrics.bot}, ace ${res.map.metrics.ace}%, risk ${res.map.metrics.risk}%, relief ${res.map.gen.got}, pond ${res.map.gen.pond}, outs ${res.map.gen.outs} (${Math.round((Date.now() - t0) / 1000)}s)`);
    } else {
        tried.push([row[0], res.why]);
        console.log(`✗ ${row[0]} — ${res.why}`);
    }
}
// Worlds started past the last one needed are let finish, and not counted.
await Promise.all(inHand.values());
if (browser) await (await browser).close();
idle.forEach((w) => w.terminate());

// The maps --with names first, then the ones forged now in the order they
// were made, then the ones --keep carried over.
made.forEach((m, i) => { if (!rank.has(m)) rank.set(m, 1e3 + i); });
made.sort((a, b) => rank.get(a) - rank.get(b));
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
