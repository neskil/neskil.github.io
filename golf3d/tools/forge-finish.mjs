// Finishing a forged map by hand: the manual half of the forge loop.
//
// The forge (tools/forge.mjs) gets a hole most of the way; the owner's
// feedback says what is left, and most of what it says is a move of the
// tee, the cup or the water. This does those moves on a forged map's own
// ground, measures the result the way the forge does, and — when it is
// right — writes the ground into the World Tour.
//
//   node golf3d/tools/forge-finish.mjs b1-03                         # measure it as it is
//   node golf3d/tools/forge-finish.mjs b1-03 --cup 3,14 --pond 0.45  # move the cup, flood the hollows to 0.45
//   node golf3d/tools/forge-finish.mjs b1-03 --cup 3,14 --pond auto --green 1.6
//   node golf3d/tools/forge-finish.mjs b1-03 … --tour savanna        # …and write the grid to tour-ground.js
//   node golf3d/tools/forge-finish.mjs b2-04 --from /tmp/batch2.js   # a map from another batch file
//
// Options: --tee x,z  --cup x,z  --green r (half-size of the green inlay)
//   --pond <level>|auto|none  --par n  --long (the full bag)  --map (a plan)
// Prints the bot's strokes, the ace share from the tee, the share of tee
// shots that end wet or out, and the vet (forge.mjs → vet). With --tour it
// also prints the hole for portals.js. No browser, no server: a few seconds.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url)), js = join(here, '..', 'js');
const args = process.argv.slice(2);
const one = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const pt = (s) => { if (!s) return null; const [x, z] = s.split(',').map(Number); return { x, z }; };
const id = args[0];
if (!id || id.startsWith('--')) { console.error('usage: forge-finish.mjs <map id> [--cup x,z] [--tee x,z] [--pond level|auto|none] [--green r] [--tour id]'); process.exit(1); }

const ctx = { console, Math, performance: { now: () => Date.now() }, localStorage: null };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['config.js', 'themes.js', 'physics.js', 'courses.js', 'tour-ground.js', 'portals.js', 'portal-worlds.js', 'endless.js', 'swing.js', 'bot.js', 'lab.js', 'forge-maps.js', 'forge.js']) {
    vm.runInContext(readFileSync(join(js, f), 'utf8'), ctx, { filename: f });
}
if (one('--from')) { vm.runInContext(readFileSync(one('--from'), 'utf8'), ctx, { filename: 'from.js' }); }
const G3 = ctx.G3, P = G3.physics, C = G3.CONFIG, DEG = Math.PI / 180;
const src = G3.FORGE.maps.find((m) => m.id === id);
if (!src) { console.error('no map ' + id + ' in batch ' + G3.FORGE.batch); process.exit(1); }
const map = JSON.parse(JSON.stringify(src));
const g = map.grid, at = (h, x, z) => h[Math.max(0, Math.min(g.nz - 1, Math.round((z - g.z0) / g.d))) * g.nx + Math.max(0, Math.min(g.nx - 1, Math.round((x - g.x0) / g.d)))];

// Level a disc into the ground (forge.mjs → level): flat inside r0, eased out to r1.
function level(h, gx, gz, r0, r1) {
    const out = h.slice(), y = at(h, gx, gz);
    for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
        const r = Math.hypot(g.x0 + i * g.d - gx, g.z0 + k * g.d - gz);
        if (r >= r1) continue;
        const u = r <= r0 ? 0 : (r - r0) / (r1 - r0), m = u * u * (3 - 2 * u);
        out[k * g.nx + i] = +(y + (out[k * g.nx + i] - y) * m).toFixed(3);
    }
    return out;
}

const gr = +one('--green', map.green || 1.3);
if (one('--green')) map.green = gr;
if (args.includes('--long')) { map.long = true; delete map.bag; }
const tee = pt(one('--tee')), cup = pt(one('--cup'));
if (tee) { map.tee = tee; g.h = level(g.h, tee.x, tee.z, 1.2, 2.2); }
if (cup) { map.cup = cup; g.h = level(g.h, cup.x, cup.z, gr + 0.3, gr + 1.9); }
if (tee || cup) {
    const mx = (map.tee.x + map.cup.x) / 2, mz = (map.tee.z + map.cup.z) / 2, half = (map.long ? 5 : 4) / 2;
    map.strips = [[Math.min(map.tee.x, mx) - half, map.tee.z + 1, Math.max(map.tee.x, mx) + half, mz],
        [Math.min(mx, map.cup.x) - half, mz, Math.max(mx, map.cup.x) + half, map.cup.z - gr - 0.1]]
        .filter((r) => r[3] - r[1] > 0.5).map((r) => r.map((x) => +x.toFixed(2)));
}
if (one('--par')) map.par = +one('--par');

// Water: a level, or `auto` (the lowest tenth of the ground, kept off the tee and the green).
const pond = one('--pond');
if (pond === 'none') delete map.water;
else if (pond) {
    let lvl = +pond;
    if (pond === 'auto') {
        const low = [];
        for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
            const x = g.x0 + i * g.d, z = g.z0 + k * g.d;
            if (Math.hypot(x - map.tee.x, z - map.tee.z) > 3 && Math.hypot(x - map.cup.x, z - map.cup.z) > gr + 2) low.push(g.h[k * g.nx + i]);
        }
        low.sort((a, b) => a - b);
        lvl = low[Math.floor(low.length * 0.1)];
    }
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, n = 0;
    for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
        if (g.h[k * g.nx + i] >= lvl) continue;
        const x = g.x0 + i * g.d, z = g.z0 + k * g.d;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); n++;
    }
    const e = g.d / 2;
    if (n) map.water = [[+(x0 - e).toFixed(2), +(z0 - e).toFixed(2), +(x1 - x0 + 2 * e).toFixed(2), +(z1 - z0 + 2 * e).toFixed(2), +lvl.toFixed(3)]];
    const wet = (p) => at(g.h, p.x, p.z) < lvl + 0.15;
    console.log(`pond at ${lvl.toFixed(3)}: ${n} cells${wet(map.tee) ? ' — THE TEE IS AT THE WATERLINE' : ''}${wet(map.cup) ? ' — THE GREEN IS AT THE WATERLINE' : ''}`);
}

/* ── measure, as the forge does ─────────────────────────────────────── */
const hole = G3.forge.holeOf(map), bag = G3.bagFor(hole);
let bots = [];
for (let n = 0; n < 5; n++) { const b = G3.bot.play(hole, 10, bag); bots.push(b.sunk ? b.strokes : 'x'); }
const s = G3.lab.sweep(hole, { step: 2, weights: 12, moments: [0] });
const straight = G3.lab.straight(hole);
let fan = 0, lost = 0, wet = 0;
const bear = Math.atan2(map.cup.x - map.tee.x, map.cup.z - map.tee.z);
for (const club of bag) for (let a = -30; a <= 30; a += 5) for (const k of [0.4, 0.6, 0.8, 1]) {
    const w = P.createWorld(hole, { x: hole.tee.x, z: hole.tee.z, y: hole.tee.y + C.BALL_R }, 0);
    if (!P.launch(w, bear + a * DEG, club.power * k, club.loft, club.bite)) continue;
    P.settle(w); fan++;
    if (w.splash) wet++; else if (w.out) lost++;
}
// The vet (forge.mjs → vet): every rest spot from the tee must be playable out of.
const rests = new Map(); let moving = 0;
for (const club of bag) for (let a = 0; a < 360; a += 10) for (let k = 1; k <= 10; k++) {
    const w = P.createWorld(hole, { x: hole.tee.x, z: hole.tee.z, y: hole.tee.y + C.BALL_R }, 0);
    if (!P.launch(w, a * DEG, club.power * k / 10, club.loft, club.bite)) continue;
    P.settle(w);
    if (w.sunk || w.splash || w.out) continue;
    if (w.moving) moving++;
    const key = Math.round(w.ball.x * 2) + ',' + Math.round(w.ball.z * 2);
    if (!rests.has(key)) rests.set(key, { x: w.ball.x, y: w.ball.y, z: w.ball.z });
}
let stuck = 0;
for (const r of rests.values()) {
    let ok = false;
    out: for (const club of bag) for (let a = 0; a < 360; a += 20) for (let k = 2; k <= 10; k += 4) {
        if (P.escapes(hole, r, 0, a * DEG, club.power * k / 10, club.loft, club.bite)) { ok = true; break out; }
    }
    if (!ok) stuck++;
}
const dist = Math.hypot(map.cup.x - map.tee.x, map.cup.z - map.tee.z);
console.log(`${map.id} ${map.title} — par ${map.par}, ${dist.toFixed(1)} units, cup ${JSON.stringify(map.cup)}, green ±${gr}`);
console.log(`  bot ${bots.join(',')} · ace ${(100 * s.aces.length / s.sims).toFixed(3)}% of ${s.sims} · putt at the flag ${straight ? 'DROPS' : 'does not drop'}`);
console.log(`  tee shots fanned ±30°: ${(100 * wet / fan).toFixed(1)}% wet, ${(100 * lost / fan).toFixed(1)}% out`);
console.log(`  vet: ${moving} never stop, ${stuck} of ${rests.size} rest spots no shot leaves${moving || stuck ? '  ✗' : '  ✓'}`);

if (args.includes('--map')) {
    let lo = Infinity, hi = -Infinity; g.h.forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); });
    const lvl = map.water ? map.water[0][4] : -Infinity;
    for (let k = g.nz - 1; k >= 0; k--) {
        let row = '';
        for (let i = 0; i < g.nx; i++) {
            const x = g.x0 + i * g.d, z = g.z0 + k * g.d, v = g.h[k * g.nx + i];
            row += Math.hypot(x - map.cup.x, z - map.cup.z) < 0.4 ? 'F' : Math.hypot(x - map.tee.x, z - map.tee.z) < 0.4 ? 'T' : v < lvl ? '~' : ' .:-=+*#%@'[Math.min(9, Math.floor((v - lo) / (hi - lo + 1e-9) * 10))];
        }
        console.log((z => z.toFixed(1).padStart(6))(g.z0 + k * g.d) + ' ' + row);
    }
}

const tour = one('--tour');
if (tour) {
    const f = join(js, 'tour-ground.js'), text = readFileSync(f, 'utf8');
    const line = `    G3.TOUR_GROUND['${tour}'] = ${JSON.stringify({ x0: g.x0, z0: g.z0, d: g.d, nx: g.nx, nz: g.nz, h: g.h })};`;
    const re = new RegExp(`^    G3\\.TOUR_GROUND\\['${tour}'\\] = .*$`, 'm');
    writeFileSync(f, re.test(text) ? text.replace(re, line) : text.replace(/\n\}\)\(window\.G3\);\s*$/, '\n' + line + '\n})(window.G3);\n'));
    console.log(`wrote G3.TOUR_GROUND['${tour}'] to js/tour-ground.js. The place and the hole, for portals.js:`);
    console.log(`  PLACES: "${tour}": ["${map.world}", ${JSON.stringify({ u: map.u, at: map.at })}]`);
    console.log(`  tee ${JSON.stringify(map.tee)}, cup ${JSON.stringify(map.cup)}, green pad (${map.cup.x - gr}, ${map.cup.z - gr}, ${2 * gr}, ${2 * gr})`);
    console.log(`  strips ${JSON.stringify(map.strips)}${map.water ? ', water ' + JSON.stringify(map.water) : ''}`);
    console.log(`  ground pad (${g.x0}, ${g.z0}, ${(g.nx - 1) * g.d}, ${(g.nz - 1) * g.d})`);
}
