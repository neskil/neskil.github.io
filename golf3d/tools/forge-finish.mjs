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
//   node golf3d/tools/forge-finish.mjs b2-04 --pond auto --write    # …and save it back into the batch
//
// Options: --tee x,z  --cup x,z  --green r (half-size of the green inlay)
//   --pond <level>|auto|none  --box x0,z0,x1,z1 (flood only inside it)
//   --dig x,z,r,depth[;…] (press a basin into flat ground, and flood it)
//   --bend x,z|none (a dogleg: the fairway band turns at this elbow; batch 6)
//   --out-box x0,z0,x1,z1[;…] (cells out of bounds)  --palette '{json}' (colours over the stand-in)  --par n  --long (the full bag)  --map (a plan)  --write (back into the batch)
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
/* The fairway band (batch 5 on) follows the tee and the cup, and --bend
   x,z turns it at an elbow (batch 6, forge.mjs → `bend`): [x0, z0, ex, ez,
   w, x1, z1]. The world's things are cleared from the band where it now
   runs (render.js → the clearing), so whatever of them the map had hard or
   out there goes; what was not instanced (a wall, a house) stays drawn,
   and is said. */
const bendArg = one('--bend');
if (map.fairway && (tee || cup || bendArg)) {
    const old = map.fairway, w = old[4];
    const elbow = bendArg === 'none' ? null : bendArg ? pt(bendArg) : old.length >= 7 ? { x: old[2], z: old[3] } : null;
    const to = elbow || map.cup, ax = to.x - map.tee.x, az = to.z - map.tee.z, L = Math.hypot(ax, az) || 1;
    map.fairway = [+(map.tee.x + ax / L * 1.2).toFixed(2), +(map.tee.z + az / L * 1.2).toFixed(2), to.x, to.z, w];
    if (elbow) map.fairway.push(map.cup.x, map.cup.z);
    const f = map.fairway, seg = (x, z, a) => { const dx = a[2] - a[0], dz = a[3] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
    const onBand = (c) => { const x = g.x0 + (c % g.nx) * g.d, z = g.z0 + Math.floor(c / g.nx) * g.d; return Math.min(seg(x, z, f), f.length >= 7 ? seg(x, z, [f[2], f[3], f[5], f[6]]) : Infinity) < w / 2 + 0.8; };
    const no = (map.outs || []).filter(onBand).length;
    if (map.outs) map.outs = map.outs.filter((c) => !onBand(c));
    if (map.solid) map.solid = map.solid.filter((p) => !onBand(p[0]));
    if (no) console.log(`${no} cells of the world's things lay on the band and are cleared — look at it live in case they were not trees`);
}
if ((tee || cup) && !map.fairway) {
    const mx = (map.tee.x + map.cup.x) / 2, mz = (map.tee.z + map.cup.z) / 2, half = (map.long ? 5 : 4) / 2;
    map.strips = [[Math.min(map.tee.x, mx) - half, map.tee.z + 1, Math.max(map.tee.x, mx) + half, mz],
        [Math.min(mx, map.cup.x) - half, mz, Math.max(mx, map.cup.x) + half, map.cup.z - gr - 0.1]]
        .filter((r) => r[3] - r[1] > 0.5).map((r) => r.map((x) => +x.toFixed(2)));
}
if (one('--par')) map.par = +one('--par');
/* A cup moved among the world's things: the forge never pins one with
   anything standing within 2.2 of it (forge.mjs → clearLine), because the
   ball would roll through a trunk on the green. Said rather than mended. */
if (cup && map.outs) {
    const near = map.outs.filter((c) => Math.hypot(g.x0 + (c % g.nx) * g.d - cup.x, g.z0 + Math.floor(c / g.nx) * g.d - cup.z) < 2.2).length;
    if (near) console.log(`THE GREEN HAS ${near} CELLS OF THE WORLD'S THINGS WITHIN 2.2 OF THE CUP — move it`);
}
/* --out-box x0,z0,x1,z1[;…]: every cell in it out of bounds, off the tee and
   the green — for something of the world's the forge read as ground and the
   sculpt could not press (forge-sculpt.mjs shows it as `+`), so the ball
   would roll through it (b2-07's quay). */
if (one('--out-box')) {
    const on = new Set(map.outs || []);
    for (const bx of one('--out-box').split(';').map((b) => b.split(',').map(Number))) {
        for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
            const x = g.x0 + i * g.d, z = g.z0 + k * g.d;
            if (x < bx[0] || z < bx[1] || x > bx[2] || z > bx[3]) continue;
            if (Math.hypot(x - map.tee.x, z - map.tee.z) < 1.2 || Math.hypot(x - map.cup.x, z - map.cup.z) < gr + 0.5) continue;
            on.add(k * g.nx + i);
        }
    }
    map.outs = [...on].sort((a, b) => a - b);
    console.log(`${map.outs.length} cells out of bounds`);
}
// --palette '{"grass":["#3a2a22","#33241d"],"water":16738842}': colours over the forge's stand-in (forge.js → themeFor).
if (one('--palette')) map.palette = JSON.parse(one('--palette'));

/* --fill x,z,r[;…]: a basin filled back in (batch 6: b5-01's pond, dug
   round the House of Four Seasons' snowmen). Every cell inside the disc is
   relaxed to the ground round it (a Laplace fill, the rim held), which is
   what the land was before the dig to within a few hundredths: the bake had
   smoothed it twice. Water over it goes with --pond none, or a new --dig. */
if (one('--fill')) {
    for (const [fx, fz, r] of one('--fill').split(';').map((d) => d.split(',').map(Number))) {
        const inside = [];
        for (let k = 1; k < g.nz - 1; k++) for (let i = 1; i < g.nx - 1; i++) if (Math.hypot(g.x0 + i * g.d - fx, g.z0 + k * g.d - fz) < r) inside.push(k * g.nx + i);
        for (let it = 0; it < 400; it++) for (const c of inside) g.h[c] = (g.h[c - 1] + g.h[c + 1] + g.h[c - g.nx] + g.h[c + g.nx]) / 4;
        inside.forEach((c) => { g.h[c] = +g.h[c].toFixed(3); });
        console.log(`filled ${inside.length} cells round ${fx},${fz}`);
    }
}

/* --dig x,z,r,depth[;x,z,r,depth…]: a basin pressed into the ground, for a
   world with no hollow of its own to flood — the world's ground is sculpted
   to the grid (backdrop.mjs), so it dips too. Since v1.222.0 its floor is
   level (forge.mjs → basin): `depth` under the water at its middle, eased
   back to the ground at its rim, so a basin on a slope holds a pond and not
   a puddle at its low edge. With no --pond, the water stands a fifth of a
   unit under the lowest rim of all the basins, and only inside them. */
let pond = one('--pond');
if (one('--dig')) {
    const digs = one('--dig').split(';').map((d) => d.split(',').map(Number));
    let rim = Infinity, bx0 = Infinity, bz0 = Infinity, bx1 = -Infinity, bz1 = -Infinity;
    for (const [dx, dz, r] of digs) {
        for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
            const q = Math.hypot(g.x0 + i * g.d - dx, g.z0 + k * g.d - dz);
            if (q > r * 1.15 && q < r * 1.35) rim = Math.min(rim, g.h[k * g.nx + i]);
        }
        bx0 = Math.min(bx0, dx - r); bz0 = Math.min(bz0, dz - r); bx1 = Math.max(bx1, dx + r); bz1 = Math.max(bz1, dz + r);
    }
    const lvl = one('--pond') && !isNaN(+one('--pond')) ? +one('--pond') : rim - 0.2;
    for (const [dx, dz, r, depth] of digs) {
        for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
            const q = Math.hypot(g.x0 + i * g.d - dx, g.z0 + k * g.d - dz) / r, c = k * g.nx + i;
            if (q >= 1) continue;
            const floor = lvl - depth * 0.5 * (1 + Math.cos(Math.PI * q)), e = Math.max(0, (q - 0.5) / 0.5), s = e * e * (3 - 2 * e);
            if (g.h[c] > floor) g.h[c] = +Math.max(g.h[c] - 0.8, floor + (g.h[c] - floor) * s).toFixed(3);
        }
    }
    if (!pond) { pond = String(+lvl.toFixed(3)); if (!one('--box')) args.push('--box', [bx0, bz0, bx1, bz1].join(',')); }
    console.log(`dug ${digs.length} basin${digs.length > 1 ? 's' : ''}; the rim is at ${rim.toFixed(3)}`);
    // The world's things stand up through a pond dug round them (b5-01's snowmen): said, so the basin is moved.
    for (const [dx, dz, r] of digs) {
        const n = (map.outs || []).filter((c) => Math.hypot(g.x0 + (c % g.nx) * g.d - dx, g.z0 + Math.floor(c / g.nx) * g.d - dz) < r * 1.15).length;
        if (n) console.log(`THE BASIN AT ${dx},${dz} HAS ${n} CELLS OF THE WORLD'S THINGS IN IT — they would stand in the water; move it`);
    }
}
// Water: a level, or `auto` (the lowest tenth of the ground, kept off the tee and the green).
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
    // --box x0,z0,x1,z1: flood only inside it (a hollow by the tee left dry).
    const box = one('--box') ? one('--box').split(',').map(Number) : null;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, n = 0;
    for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nx; i++) {
        if (g.h[k * g.nx + i] >= lvl) continue;
        const x = g.x0 + i * g.d, z = g.z0 + k * g.d;
        if (box && (x < box[0] || z < box[1] || x > box[2] || z > box[3])) continue;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); n++;
    }
    const e = g.d / 2;
    if (n) map.water = [[+(x0 - e).toFixed(2), +(z0 - e).toFixed(2), +(x1 - x0 + 2 * e).toFixed(2), +(z1 - z0 + 2 * e).toFixed(2), +lvl.toFixed(3)]];
    const wet = (p) => at(g.h, p.x, p.z) < lvl + 0.15 && (!box || (p.x >= box[0] - 2 && p.z >= box[1] - 2 && p.x <= box[2] + 2 && p.z <= box[3] + 2));
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
    const w = P.createWorld(hole, { x: hole.tee.x, z: hole.tee.z, y: hole.tee.y + G3.ballR(hole) }, 0);
    if (!P.launch(w, bear + a * DEG, club.power * k, club.loft, club.bite)) continue;
    P.settle(w); fan++;
    if (w.splash) wet++; else if (w.out) lost++;
}
// The vet (forge.mjs → vet): every rest spot from the tee must be playable out of.
const rests = new Map(); let moving = 0;
for (const club of bag) for (let a = 0; a < 360; a += 10) for (let k = 1; k <= 10; k++) {
    const w = P.createWorld(hole, { x: hole.tee.x, z: hole.tee.z, y: hole.tee.y + G3.ballR(hole) }, 0);
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
// The bot with hands (forge.mjs → handsOf): a person's card, and balls a round wet or out.
let hands = 0, hwet = 0;
const HR = +one('--hands', 12);
for (let k = 0; k < HR; k++) {
    let a = (k * 7919 + 13) >>> 0;
    const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const res = G3.bot.play(hole, 12, bag, { hands: C.BOT_HANDS, rng: rnd });
    hands += res.strokes;
    res.shots.forEach((q) => { if (q.world.splash || q.world.out) hwet++; });
}
const dist = Math.hypot(map.cup.x - map.tee.x, map.cup.z - map.tee.z);
console.log(`${map.id} ${map.title} — par ${map.par}, ${dist.toFixed(1)} units, cup ${JSON.stringify(map.cup)}, green ±${gr}`);
console.log(`  bot ${bots.join(',')} · ace ${(100 * s.aces.length / s.sims).toFixed(3)}% of ${s.sims} · putt at the flag ${straight ? 'DROPS' : 'does not drop'}`);
console.log(`  bot with hands: ${(hands / HR).toFixed(2)} a round over ${HR}, ${(hwet / HR).toFixed(2)} balls a round wet or out${map.fairway && map.fairway.length >= 7 ? ' · dogleg at ' + map.fairway[2] + ',' + map.fairway[3] : ''}`);
console.log(`  tee shots fanned ±30°: ${(100 * wet / fan).toFixed(1)}% wet, ${(100 * lost / fan).toFixed(1)}% out`);
console.log(`  vet: ${moving} never stop, ${stuck} of ${rests.size} rest spots no shot leaves${moving || stuck ? '  ✗' : '  ✓'}`);

if (args.includes('--map')) {
    let lo = Infinity, hi = -Infinity; g.h.forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); });
    const solidSet = new Set((map.solid || []).map((p) => p[0])), outSet = new Set(map.outs || []);
    for (let k = g.nz - 1; k >= 0; k--) {
        let row = '';
        for (let i = 0; i < g.nx; i++) {
            const x = g.x0 + i * g.d, z = g.z0 + k * g.d, v = g.h[k * g.nx + i];
            // F flag, T tee, E elbow, ~ water (in a pond's box), | a trunk, o out, the band in capitals' place: height digits stay.
            const c = k * g.nx + i, fw = map.fairway;
            const inW = (map.water || []).some((r) => x >= r[0] && x <= r[0] + r[2] && z >= r[1] && z <= r[1] + r[3] && v < r[4]);
            row += Math.hypot(x - map.cup.x, z - map.cup.z) < 0.4 ? 'F' : Math.hypot(x - map.tee.x, z - map.tee.z) < 0.4 ? 'T'
                : fw && fw.length >= 7 && Math.hypot(x - fw[2], z - fw[3]) < 0.6 ? 'E' : inW ? '~' : solidSet.has(c) ? '|' : outSet.has(c) ? 'o'
                : ' .:-=+*#%@'[Math.min(9, Math.floor((v - lo) / (hi - lo + 1e-9) * 10))];
        }
        console.log((z => z.toFixed(1).padStart(6))(g.z0 + k * g.d) + ' ' + row);
    }
}

/* --write: the finished map back into the batch file it came from
   (forge-maps.js, or --from), in its place. It is a new map with a new
   rating key (forge.js → keyFor), so it comes back unrated. */
if (args.includes('--write')) {
    const f = one('--from') || join(js, 'forge-maps.js'), text = readFileSync(f, 'utf8');
    const m = text.match(/window\.G3\.FORGE = (\{[\s\S]*\});\s*$/);
    if (!m) { console.error('no window.G3.FORGE in ' + f); process.exit(1); }
    const data = JSON.parse(m[1]), at = data.maps.findIndex((x) => x.id === map.id);
    map.finished = (map.finished || []).concat([args.filter((a) => a !== '--write' && a !== '--map').join(' ')]);
    // What it plays to now, so the next copy's line reads against the map as it is (batch 6).
    if (map.gen) {
        map.gen.hands = +(hands / HR).toFixed(2); map.gen.wet = +(hwet / HR).toFixed(2);
        if (map.fairway && map.fairway.length >= 7) map.gen.bend = map.fairway[2]; else delete map.gen.bend;
        if (!map.water) delete map.gen.pond; else map.gen.pond = map.water[0][4];
    }
    data.maps[at] = map;
    writeFileSync(f, text.slice(0, m.index) + 'window.G3.FORGE = ' + JSON.stringify(data) + ';\n');
    console.log(`wrote ${map.id} back into ${f} (finished by hand: ${map.finished.join(' | ')})`);
}

const tour = one('--tour');
if (tour) {
    const f = join(js, 'tour-ground.js'), text = readFileSync(f, 'utf8');
    /* The world's things go with the ground since batch 5 (the Pop-Up Book,
       the first keep forged with trunks): `outs`, the cells a ball may not
       stop in, and `solid`, the trunks it strikes, which portals.js →
       marks() turns into the hole's outGrid and solidGrid as forge.js does. */
    const tg = { x0: g.x0, z0: g.z0, d: g.d, nx: g.nx, nz: g.nz, h: g.h };
    if (map.outs && map.outs.length) tg.outs = map.outs;
    if (map.solid && map.solid.length) tg.solid = map.solid;
    const line = `    G3.TOUR_GROUND['${tour}'] = ${JSON.stringify(tg)};`;
    const re = new RegExp(`^    G3\\.TOUR_GROUND\\['${tour}'\\] = .*$`, 'm');
    writeFileSync(f, re.test(text) ? text.replace(re, line) : text.replace(/\n\}\)\(window\.G3\);\s*$/, '\n' + line + '\n})(window.G3);\n'));
    console.log(`wrote G3.TOUR_GROUND['${tour}'] to js/tour-ground.js. The place and the hole, for portals.js:`);
    console.log(`  PLACES: "${tour}": ["${map.world}", ${JSON.stringify({ u: map.u, at: map.at })}]`);
    console.log(`  tee ${JSON.stringify(map.tee)}, cup ${JSON.stringify(map.cup)}, green pad (${map.cup.x - gr}, ${map.cup.z - gr}, ${2 * gr}, ${2 * gr})`);
    console.log(`  strips ${JSON.stringify(map.strips)}${map.water ? ', water ' + JSON.stringify(map.water) : ''}`);
    console.log(`  ground pad (${g.x0}, ${g.z0}, ${(g.nx - 1) * g.d}, ${(g.nz - 1) * g.d})`);
}
