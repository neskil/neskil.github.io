// Sand Clock — the falling-sand world, with no DOM in it.
//
// The world is a grid of cells, one material each. A tick walks the grid from
// the bottom row up (so a grain that falls is not visited again lower down)
// and alternates the direction it walks each row (so nothing drifts left just
// because left came first). Anything that moves into a cell is stamped with
// the tick, and a stamped cell is skipped — that is what stops a rising
// bubble of steam from shooting to the ceiling in one frame.
//
// "Down" is whichever way gravity points (world.gx, world.gy): every rule is
// written against the gravity vector G and the sideways vector P, and the
// walk starts from whichever edge is the floor. With gravity pointing down,
// G = (0, 1) and P = (1, 0) and all of it reads as plain x and y + 1.
//
// The grid is cut into 32×32 chunks, and a chunk where nothing has changed
// for a few ticks goes to sleep and is skipped. Any write into a cell wakes
// its chunk (and the neighbouring chunk, at an edge), and cells that change
// on their own — fire, plants, gas, ants — keep theirs awake. That is what
// lets a fine grid of a million cells run: most of a scene is sitting still.
//
// Everything random comes from the rng passed in, so tests can run a world
// from a seed and get the same answer twice.

export const M = Object.freeze({
    EMPTY: 0, STONE: 1, SAND: 2, WATER: 3, LAVA: 4, PLANT: 5, FIRE: 6,
    OIL: 7, STEAM: 8, SMOKE: 9, ICE: 10, GLASS: 11, WOOD: 12, FLOWER: 13,
    ACID: 14, GUNPOWDER: 15, SALT: 16, SNOW: 17,
    METAL: 18, SPARK: 19, BATTERY: 20, CLONER: 21, VOID: 22, SEED: 23,
    SPROUT: 24, ANT: 25, HONEY: 26, CLOUD: 27,
});

// kind: how it moves. density: what sinks through what (a powder or liquid
// swaps with anything lighter that is not solid). Gases are lighter than
// everything, so water falls through steam rather than stacking on it.
export const MATERIALS = [
    { id: M.EMPTY, name: 'Eraser', kind: 'empty', density: 0, color: [0, 0, 0] },
    { id: M.STONE, name: 'Stone', kind: 'solid', density: 99, color: [118, 118, 128] },
    { id: M.SAND, name: 'Sand', kind: 'powder', density: 5, color: [226, 192, 122] },
    { id: M.WATER, name: 'Water', kind: 'liquid', density: 3, color: [56, 132, 230], flow: 5 },
    { id: M.LAVA, name: 'Lava', kind: 'liquid', density: 4, color: [255, 92, 28], flow: 1, viscous: 0.55 },
    { id: M.PLANT, name: 'Plant', kind: 'solid', density: 99, color: [64, 178, 84] },
    { id: M.FIRE, name: 'Fire', kind: 'fire', density: 0.5, color: [255, 160, 40] },
    { id: M.OIL, name: 'Oil', kind: 'liquid', density: 2, color: [96, 70, 44], flow: 3 },
    { id: M.STEAM, name: 'Steam', kind: 'gas', density: 0.2, color: [200, 214, 230] },
    { id: M.SMOKE, name: 'Smoke', kind: 'gas', density: 0.1, color: [80, 80, 90] },
    { id: M.ICE, name: 'Ice', kind: 'solid', density: 99, color: [170, 220, 245] },
    { id: M.GLASS, name: 'Glass', kind: 'solid', density: 99, color: [190, 225, 235] },
    { id: M.WOOD, name: 'Wood', kind: 'solid', density: 99, color: [128, 84, 48] },
    { id: M.FLOWER, name: 'Flower', kind: 'solid', density: 99, color: [244, 114, 182] },
    { id: M.ACID, name: 'Acid', kind: 'liquid', density: 3.5, color: [150, 240, 60], flow: 3 },
    { id: M.GUNPOWDER, name: 'Gunpowder', kind: 'powder', density: 4.5, color: [70, 66, 72] },
    { id: M.SALT, name: 'Salt', kind: 'powder', density: 5.5, color: [236, 236, 242] },
    // Lighter than water, so it settles on a pond as a crust instead of sinking.
    { id: M.SNOW, name: 'Snow', kind: 'powder', density: 1.5, color: [244, 248, 255], drift: 0.5 },
    { id: M.METAL, name: 'Metal', kind: 'solid', density: 99, color: [140, 152, 170] },
    { id: M.SPARK, name: 'Spark', kind: 'spark', density: 0.3, color: [255, 248, 170] },
    { id: M.BATTERY, name: 'Battery', kind: 'solid', density: 99, color: [234, 200, 40] },
    { id: M.CLONER, name: 'Cloner', kind: 'solid', density: 99, color: [192, 90, 220] },
    { id: M.VOID, name: 'Void', kind: 'solid', density: 99, color: [46, 16, 70] },
    { id: M.SEED, name: 'Seed', kind: 'powder', density: 5, color: [168, 124, 64] },
    { id: M.SPROUT, name: 'Sprout', kind: 'solid', density: 99, color: [150, 112, 66] },
    // Lighter than water: an ant that falls in a pond floats, and slowly drowns.
    { id: M.ANT, name: 'Ant', kind: 'critter', density: 2, color: [214, 76, 54] },
    { id: M.HONEY, name: 'Honey', kind: 'liquid', density: 3.8, color: [236, 168, 36], flow: 1, viscous: 0.85 },
    { id: M.CLOUD, name: 'Cloud', kind: 'cloud', density: 0.15, color: [208, 214, 232] },
];

const KIND = MATERIALS.map(m => m.kind);
const DENSITY = MATERIALS.map(m => m.density);
const FLAMMABLE = new Set([M.PLANT, M.OIL, M.WOOD, M.FLOWER, M.GUNPOWDER, M.SEED, M.SPROUT]);
// What acid cannot eat: the glass it is kept in, itself, and the void.
const ACIDPROOF = new Set([M.EMPTY, M.ACID, M.GLASS, M.STEAM, M.SMOKE, M.FIRE, M.SPARK, M.VOID]);
const HOT = new Set([M.FIRE, M.LAVA, M.STEAM, M.SPARK]);
// Ground a seed will take root in.
const SOIL = new Set([M.SAND, M.STONE, M.WOOD, M.PLANT]);

const LIFE = {
    [M.FIRE]: [24, 70],
    [M.STEAM]: [160, 420],
    [M.SMOKE]: [40, 110],
    [M.SPARK]: [3, 8],
    [M.CLOUD]: [900, 1800],
};

// Cells that can change with nothing around them changing: they keep their
// chunk awake. Metal only while it carries a charge (checked in step).
const RESTLESS = new Uint8Array(MATERIALS.length);
for (const m of MATERIALS) {
    if (['gas', 'fire', 'spark', 'cloud', 'critter'].includes(m.kind)) RESTLESS[m.id] = 1;
}
for (const t of [M.PLANT, M.ICE, M.LAVA, M.ACID, M.SALT, M.SNOW, M.BATTERY, M.CLONER, M.VOID, M.SEED, M.SPROUT]) {
    RESTLESS[t] = 1;
}

export function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const CHUNK = 5;          // chunks are 1 << CHUNK = 32 cells square
const EDGE = (1 << CHUNK) - 1;
const SLEEP_AFTER = 10;   // idle ticks before a chunk sleeps

export function createWorld(w, h, rng = Math.random) {
    const cw = (w + EDGE) >> CHUNK, ch = (h + EDGE) >> CHUNK;
    const awake = new Uint8Array(cw * ch);
    awake.fill(SLEEP_AFTER);
    return {
        w, h, rng,
        tick: 0,
        gx: 0, gy: 1,
        type: new Uint8Array(w * h),
        shade: new Uint8Array(w * h),
        life: new Uint16Array(w * h),
        stamp: new Uint32Array(w * h),
        cw, ch, awake,
        // Taps that keep pouring: { x, y, t, rate, spread, cap? }. A scene sets
        // them (the volcano's vent, the garden's rain); clear() takes them away.
        // `cap` is a share of the world: the tap rests while its material
        // covers more than that, so a tap left running cannot flood the screen.
        emitters: [],
        census: new Uint32Array(MATERIALS.length),
    };
}

function wake(world, x, y) {
    const cx = x >> CHUNK, cy = y >> CHUNK, { cw, ch, awake } = world;
    const x0 = (x & EDGE) === 0 && cx > 0 ? cx - 1 : cx;
    const x1 = (x & EDGE) === EDGE && cx < cw - 1 ? cx + 1 : cx;
    const y0 = (y & EDGE) === 0 && cy > 0 ? cy - 1 : cy;
    const y1 = (y & EDGE) === EDGE && cy < ch - 1 ? cy + 1 : cy;
    for (let j = y0; j <= y1; j++) for (let k = x0; k <= x1; k++) awake[j * cw + k] = SLEEP_AFTER;
}

const wakeIndex = (world, i) => wake(world, i % world.w, (i / world.w) | 0);

export function wakeAll(world) { world.awake.fill(SLEEP_AFTER); }

/** How many chunks are awake — for the page's performance read-out and tests. */
export function awakeChunks(world) {
    let n = 0;
    for (const a of world.awake) if (a) n++;
    return n;
}

/** Puts one cell of `t` at (x, y), with a fresh shade and lifetime. */
export function set(world, x, y, t) {
    if (x < 0 || y < 0 || x >= world.w || y >= world.h) return;
    const i = y * world.w + x;
    world.type[i] = t;
    world.shade[i] = (world.rng() * 256) | 0;
    const span = LIFE[t];
    world.life[i] = span ? span[0] + ((world.rng() * (span[1] - span[0])) | 0) : 0;
    wake(world, x, y);
}

/** set(), stamped: a cell made during a tick is not stepped again that tick. */
function spawn(world, x, y, t) {
    set(world, x, y, t);
    if (x >= 0 && y >= 0 && x < world.w && y < world.h) world.stamp[y * world.w + x] = world.tick;
}

export function get(world, x, y) {
    if (x < 0 || y < 0 || x >= world.w || y >= world.h) return M.STONE;
    return world.type[y * world.w + x];
}

export function count(world, t) {
    let n = 0;
    for (let i = 0; i < world.type.length; i++) if (world.type[i] === t) n++;
    return n;
}

export function clear(world) {
    world.type.fill(0);
    world.life.fill(0);
    world.emitters = [];
    wakeAll(world);
}

/** A round brush. Powders and liquids go down speckled so they read as grains
    and pour rather than landing as one slab; solids go down whole. */
export function paint(world, cx, cy, r, t, overwrite = false) {
    const kind = KIND[t];
    const sparse = kind !== 'solid' && kind !== 'empty' && t !== M.ANT;
    for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy > r * r + r) continue;
            const x = cx + dx, y = cy + dy;
            if (x < 0 || y < 0 || x >= world.w || y >= world.h) continue;
            // Ants go down a few at a time, not as a carpet.
            if (t === M.ANT ? world.rng() > 0.08 : sparse && world.rng() > 0.55) continue;
            const cur = world.type[y * world.w + x];
            if (t !== M.EMPTY && cur !== M.EMPTY && !overwrite) continue;
            set(world, x, y, t);
        }
    }
}

/** A straight stroke of round dabs from (x0, y0) to (x1, y1). */
export function line(world, x0, y0, x1, y1, r, t, overwrite = false) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / Math.max(1, r / 2)));
    for (let s = 0; s <= steps; s++) {
        paint(world, Math.round(x0 + (x1 - x0) * s / steps), Math.round(y0 + (y1 - y0) * s / steps), r, t, overwrite);
    }
}

function swap(world, a, b) {
    const { type, shade, life, stamp } = world;
    const t = type[a]; type[a] = type[b]; type[b] = t;
    const s = shade[a]; shade[a] = shade[b]; shade[b] = s;
    const l = life[a]; life[a] = life[b]; life[b] = l;
    stamp[a] = world.tick;
    stamp[b] = world.tick;
    wakeIndex(world, a);
    wakeIndex(world, b);
}

/** Can a cell of material `t` move into a cell holding `other`? */
function canDisplace(t, other) {
    if (other === M.EMPTY) return true;
    const k = KIND[other];
    if (k === 'solid') return false;
    return DENSITY[other] < DENSITY[t];
}

function tryMove(world, i, x, y, t) {
    if (x < 0 || y < 0 || x >= world.w || y >= world.h) return false;
    const j = y * world.w + x;
    if (!canDisplace(t, world.type[j])) return false;
    swap(world, i, j);
    return true;
}

function neighbours(world, x, y, fn) {
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= world.w || ny >= world.h) continue;
            fn(ny * world.w + nx, nx, ny);
        }
    }
}

function become(world, i, t) {
    world.type[i] = t;
    const span = LIFE[t];
    world.life[i] = span ? span[0] + ((world.rng() * (span[1] - span[0])) | 0) : 0;
    world.stamp[i] = world.tick;
    wakeIndex(world, i);
}

// Gravity (GX, GY) and sideways (PX, PY) for the tick in progress, set at
// the top of step() so the rules below can read them without a lookup.
let GX = 0, GY = 1, PX = 1, PY = 0;

function stepPowder(world, i, x, y, t, mat) {
    if (t === M.SALT || t === M.SNOW || t === M.SEED) {
        // One random neighbour a tick is enough to read as a slow reaction.
        const nx = x + ((world.rng() * 3) | 0) - 1, ny = y + ((world.rng() * 3) | 0) - 1;
        const o = get(world, nx, ny), j = ny * world.w + nx;
        if (t === M.SALT) {
            if (o === M.ICE || o === M.SNOW) { if (world.rng() < 0.08) become(world, j, M.WATER); }
            else if (o === M.WATER && world.rng() < 0.004) { become(world, i, M.EMPTY); return; }
        } else if (t === M.SNOW) {
            if (HOT.has(o) && world.rng() < 0.3) { become(world, i, M.WATER); return; }
        } else if (o === M.WATER && SOIL.has(get(world, x + GX, y + GY))) {
            // A seed on the ground with water beside it drinks and sprouts.
            become(world, j, M.EMPTY);
            become(world, i, M.SPROUT);
            world.life[i] = 12 + ((world.rng() * 16) | 0);
            return;
        }
    }
    // A flake drifts: it falls only some ticks and wanders when it does.
    if (mat.drift && world.rng() < mat.drift) {
        if (world.rng() < 0.3) {
            const d = world.rng() < 0.5 ? -1 : 1;
            tryMove(world, i, x + PX * d, y + PY * d, t);
        }
        return;
    }
    if (tryMove(world, i, x + GX, y + GY, t)) return;
    const d = world.rng() < 0.5 ? -1 : 1;
    if (tryMove(world, i, x + GX + PX * d, y + GY + PY * d, t)) return;
    tryMove(world, i, x + GX - PX * d, y + GY - PY * d, t);
}

function stepLiquid(world, i, x, y, t, mat) {
    if (mat.viscous && world.rng() < mat.viscous) return;
    if (tryMove(world, i, x + GX, y + GY, t)) return;
    const d = world.rng() < 0.5 ? -1 : 1;
    if (tryMove(world, i, x + GX + PX * d, y + GY + PY * d, t)) return;
    if (tryMove(world, i, x + GX - PX * d, y + GY - PY * d, t)) return;
    // Spread sideways: slide as far as `flow` cells while the way is open.
    // Only into empty cells or gases, so a pool levels out instead of two
    // liquids churning through each other sideways forever.
    const { w, h, type } = world;
    let best = -1;
    for (let s = 1; s <= mat.flow; s++) {
        const nx = x + PX * d * s, ny = y + PY * d * s;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) break;
        const o = type[ny * w + nx];
        if (o !== M.EMPTY && KIND[o] !== 'gas') break;
        best = ny * w + nx;
        // Found a drop: stop here so it falls next tick.
        const bx = nx + GX, by = ny + GY;
        if (bx >= 0 && by >= 0 && bx < w && by < h && type[by * w + bx] === M.EMPTY) break;
    }
    if (best >= 0) swap(world, i, best);
}

function stepGas(world, i, x, y, t) {
    if (--world.life[i] === 0) {
        // Steam that has risen and cooled rains back down some of the time;
        // the rest is lost, so a kettle left on does slowly boil dry.
        if (t === M.STEAM && world.rng() < 0.45) become(world, i, M.WATER);
        else become(world, i, M.EMPTY);
        return;
    }
    const r = world.rng();
    const dx = r < 0.33 ? -1 : r < 0.66 ? 1 : 0;
    if (tryGas(world, i, x - GX + PX * dx, y - GY + PY * dx)) return;
    if (tryGas(world, i, x - GX - PX * dx, y - GY - PY * dx)) return;
    const s = world.rng() < 0.5 ? -1 : 1;
    tryGas(world, i, x + PX * s, y + PY * s);
}

function tryGas(world, i, x, y) {
    if (x < 0 || y < 0 || x >= world.w || y >= world.h) return false;
    const j = y * world.w + x;
    if (world.type[j] !== M.EMPTY) return false;
    swap(world, i, j);
    return true;
}

function stepFire(world, i, x, y) {
    // Water puts it out, and half the time boils off for its trouble.
    let doused = false;
    let fuel = false;
    neighbours(world, x, y, (j) => {
        const o = world.type[j];
        if (o === M.WATER) {
            doused = true;
            if (world.rng() < 0.5) become(world, j, M.STEAM);
        } else if (o === M.GUNPOWDER) {
            fuel = true;
            if (world.rng() < 0.1) explode(world, j % world.w, (j / world.w) | 0, 4);
        } else if (FLAMMABLE.has(o)) {
            fuel = true;
            const p = o === M.OIL ? 0.5 : o === M.WOOD ? 0.06 : 0.1;
            if (world.rng() < p) become(world, j, M.FIRE);
        } else if ((o === M.ICE || o === M.SNOW) && world.rng() < 0.08) {
            become(world, j, M.WATER);
        } else if (o === M.HONEY && world.rng() < 0.01) {
            become(world, j, M.SMOKE);  // burnt sugar
        }
    });
    if (doused) { become(world, i, M.STEAM); return; }

    // A flame with fuel beside it burns twice as long.
    if ((!fuel || world.rng() < 0.5) && --world.life[i] === 0) {
        become(world, i, world.rng() < 0.4 ? M.SMOKE : M.EMPTY);
        return;
    }
    // Flicker upward, and now and then sideways — unless there is something
    // beside it to burn, in which case it clings to it. A flame that drifted
    // off a plank on its first frame never set anything alight.
    if (!fuel && world.rng() < 0.6) {
        const dx = ((world.rng() * 3) | 0) - 1;
        tryGas(world, i, x - GX + PX * dx, y - GY + PY * dx);
    }
}

function stepLava(world, i, x, y, t, mat) {
    let quenched = false;
    neighbours(world, x, y, (j) => {
        const o = world.type[j];
        if (o === M.WATER) {
            quenched = true;
            become(world, j, M.STEAM);
        } else if (o === M.ICE || o === M.SNOW) {
            become(world, j, M.WATER);
        } else if (o === M.GUNPOWDER) {
            explode(world, j % world.w, (j / world.w) | 0, 4);
        } else if (FLAMMABLE.has(o)) {
            if (world.rng() < 0.2) become(world, j, M.FIRE);
        } else if (o === M.SAND && world.rng() < 0.004) {
            become(world, j, M.GLASS);
        } else if (o === M.EMPTY && world.rng() < 0.0015) {
            become(world, j, M.FIRE);
        }
    });
    if (quenched) { become(world, i, M.STONE); return; }
    stepLiquid(world, i, x, y, t, mat);
}

/** A blast of radius r: everything inside but stone, metal and glass is thrown
    out as fire and empty air, and gunpowder caught in it goes up too — as
    fire, which sets off the next grain over, so a trail burns like a fuse. */
export function explode(world, cx, cy, r) {
    for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy > r * r) continue;
            const x = cx + dx, y = cy + dy;
            if (x < 0 || y < 0 || x >= world.w || y >= world.h) continue;
            const j = y * world.w + x;
            const o = world.type[j];
            if (o === M.GLASS || o === M.VOID || ((o === M.STONE || o === M.METAL) && world.rng() < 0.85)) continue;
            if (o === M.WATER) { if (world.rng() < 0.5) become(world, j, M.STEAM); continue; }
            become(world, j, o === M.GUNPOWDER || world.rng() < 0.35 ? M.FIRE : world.rng() < 0.3 ? M.SMOKE : M.EMPTY);
        }
    }
}

/** Acid eats one random neighbour now and then and is spent doing it, so a
    puddle of acid eats a hole its own size. Glass holds it; water dilutes it. */
function stepAcid(world, i, x, y, t, mat) {
    const nx = x + ((world.rng() * 3) | 0) - 1, ny = y + ((world.rng() * 3) | 0) - 1;
    if (nx >= 0 && ny >= 0 && nx < world.w && ny < world.h && world.rng() < 0.15) {
        const j = ny * world.w + nx, o = world.type[j];
        if (o === M.WATER) {
            if (world.rng() < 0.1) { become(world, i, M.WATER); return; }
        } else if (!ACIDPROOF.has(o)) {
            become(world, j, world.rng() < 0.2 ? M.SMOKE : M.EMPTY);
            if (world.rng() < 0.5) { become(world, i, M.EMPTY); return; }
        }
    }
    stepLiquid(world, i, x, y, t, mat);
}

/* ── Electricity ──
   Metal carries a pulse. A metal cell's `life` is its charge: 0 is ready,
   CHARGE is the head of a pulse, and it counts down from there. A head
   passes the charge to ready metal beside it on the next tick, and the cells
   behind it are still counting down, so a pulse runs one way along a wire
   one cell a tick and a loop of wire carries it round for ever. */
export const CHARGE = 4;

function energize(world, j) {
    world.life[j] = CHARGE;
    world.stamp[j] = world.tick;
    wakeIndex(world, j);
}

/** What a charge does to what it touches that is not metal. */
function shock(world, j) {
    const o = world.type[j];
    if (o === M.GUNPOWDER) explode(world, j % world.w, (j / world.w) | 0, 4);
    else if (o === M.ICE || o === M.SNOW) { if (world.rng() < 0.15) become(world, j, M.WATER); }
    else if (FLAMMABLE.has(o)) { if (world.rng() < 0.04) become(world, j, M.FIRE); }
    else if (o === M.WATER) { if (world.rng() < 0.01) become(world, j, M.STEAM); }
}

function stepMetal(world, i, x, y) {
    const { life, stamp, type } = world;
    if (life[i] === CHARGE) {
        neighbours(world, x, y, (j) => {
            if (type[j] === M.METAL) { if (life[j] === 0) energize(world, j); }
            else shock(world, j);
        });
    }
    life[i]--;
    stamp[i] = world.tick;
}

function stepSpark(world, i, x, y) {
    neighbours(world, x, y, (j) => {
        const o = world.type[j];
        if (o === M.METAL) { if (world.life[j] === 0) energize(world, j); }
        else if (FLAMMABLE.has(o) && o !== M.GUNPOWDER) { if (world.rng() < 0.3) become(world, j, M.FIRE); }
        else shock(world, j);
    });
    if (--world.life[i] === 0) become(world, i, M.EMPTY);
}

/** A battery sends a pulse into the metal it touches every BATTERY_PERIOD ticks. */
const BATTERY_PERIOD = 40;
function stepBattery(world, i, x, y) {
    if (world.tick % BATTERY_PERIOD) return;
    neighbours(world, x, y, (j) => {
        if (world.type[j] === M.METAL && world.life[j] === 0) energize(world, j);
    });
}

/* ── Machines ── */

/** A cloner remembers the first loose thing that touches it (its `life` is
    that material + 1) and from then on makes more of it into empty cells
    beside it. Only loose things: a cloner of stone would just be stone. */
function stepCloner(world, i, x, y) {
    const nx = x + ((world.rng() * 3) | 0) - 1, ny = y + ((world.rng() * 3) | 0) - 1;
    if (nx < 0 || ny < 0 || nx >= world.w || ny >= world.h) return;
    const o = world.type[ny * world.w + nx];
    if (!world.life[i]) {
        if (o !== M.EMPTY && KIND[o] !== 'solid') world.life[i] = o + 1;
        return;
    }
    if (o === M.EMPTY && world.rng() < 0.5) spawn(world, nx, ny, world.life[i] - 1);
}

/** The void swallows whatever touches it, walls and all. */
function stepVoid(world, i, x, y) {
    const nx = x + ((world.rng() * 3) | 0) - 1, ny = y + ((world.rng() * 3) | 0) - 1;
    if (nx < 0 || ny < 0 || nx >= world.w || ny >= world.h) return;
    const j = ny * world.w + nx, o = world.type[j];
    if (o !== M.EMPTY && o !== M.VOID && world.rng() < 0.6) become(world, j, M.EMPTY);
}

/* ── Plants ──
   A plant cell's `life` is the water it holds. Cells touching water drink it
   (the water is used up), every cell passes some of what it holds to a
   neighbouring plant cell, and a cell with enough to spare grows one new cell
   into open air — upward, and only where it would not crowd an existing stem.
   So water travels up a stalk to its tip and the tip is where it grows, which
   is what keeps a garden a set of stems instead of a green slab. A tip that
   is well fed and has nowhere left to go sometimes flowers. */
const GROW_COST = 12;
const DRINK = 40;
const MAX_HELD = 200;

function plantNeighbours(world, x, y) {
    let n = 0;
    neighbours(world, x, y, (j) => {
        const o = world.type[j];
        if (o === M.PLANT || o === M.FLOWER) n++;
    });
    return n;
}

function stepPlant(world, i, x, y) {
    const { w, h, type, life, rng } = world;
    if (rng() > 0.25) return;

    // Drink: one random neighbour, and only if it is water.
    const dx = ((rng() * 3) | 0) - 1, dy = ((rng() * 3) | 0) - 1;
    const nx = x + dx, ny = y + dy;
    if ((dx || dy) && nx >= 0 && ny >= 0 && nx < w && ny < h) {
        const j = ny * w + nx;
        if (type[j] === M.WATER && life[i] < MAX_HELD) {
            become(world, j, M.EMPTY);
            life[i] = Math.min(MAX_HELD, life[i] + DRINK);
        } else if (type[j] === M.PLANT && life[i] > life[j] + 2) {
            // Share: half the difference flows to the drier neighbour,
            // biased upward by trying the cell above more often (below).
            const give = (life[i] - life[j]) >> 1;
            life[i] -= give;
            life[j] += give;
        }
    }
    // Upward bias for the sharing: the cell above, if it is plant, gets a turn too.
    const ux = x - GX, uy = y - GY;
    if (ux >= 0 && uy >= 0 && ux < w && uy < h) {
        const up = uy * w + ux;
        if (type[up] === M.PLANT && life[i] > life[up] + 2) {
            const give = (life[i] - life[up]) >> 1;
            life[i] -= give;
            life[up] += give;
        }
    }

    if (life[i] < GROW_COST * 2) return;
    // Grow: up, or up and to one side; now and then straight out sideways.
    const r = rng();
    const side = r < 0.5 ? 0 : r < 0.72 ? -1 : r < 0.94 ? 1 : (rng() < 0.5 ? -2 : 2);
    const lift = r < 0.94 ? 1 : 0;
    const gx = x + PX * side - GX * lift, gy = y + PY * side - GY * lift;
    if (gx < 0 || gy < 0 || gx >= w || gy >= h) return;
    const g = gy * w + gx;
    if (type[g] !== M.EMPTY) return;
    if (plantNeighbours(world, gx, gy) > 2) {
        // Crowded in: a tip with water to spare and nowhere to go flowers.
        if (life[i] > MAX_HELD * 0.6 && plantNeighbours(world, x, y) <= 2 && rng() < 0.08) {
            type[i] = M.FLOWER;
            world.stamp[i] = world.tick;
            wake(world, x, y);
        }
        return;
    }
    become(world, g, M.PLANT);
    life[i] -= GROW_COST;
    life[g] = GROW_COST >> 1;
}

/** A sprout is the growing tip of a tree: its `life` is how many more cells
    of trunk it has in it. It climbs, leaving wood behind, now and then forks,
    and when it runs out or hits something it bursts into a crown of leaves. */
function stepSprout(world, i, x, y) {
    const { rng, life } = world;
    if (rng() > 0.12) return;
    const left = life[i];
    const lean = rng() < 0.2 ? (rng() < 0.5 ? -1 : 1) : 0;
    const tx = x - GX + PX * lean, ty = y - GY + PY * lean;
    const o = get(world, tx, ty);
    if (left > 0 && (o === M.EMPTY || o === M.WATER || KIND[o] === 'gas')) {
        become(world, i, M.WOOD);
        spawn(world, tx, ty, M.SPROUT);
        world.life[ty * world.w + tx] = left - 1;
        // A branch: a second, shorter tip out to one side.
        if (left > 5 && rng() < 0.1) {
            const s = rng() < 0.5 ? -1 : 1;
            const bx = x + PX * s * 2 - GX, by = y + PY * s * 2 - GY;
            if (get(world, bx, by) === M.EMPTY) {
                spawn(world, bx, by, M.SPROUT);
                world.life[by * world.w + bx] = left >> 1;
            }
        }
        return;
    }
    become(world, i, M.WOOD);
    const r = 3 + ((rng() * 3) | 0);
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r || rng() > 0.8) continue;
        if (get(world, x + dx, y + dy) !== M.EMPTY) continue;
        spawn(world, x + dx, y + dy, rng() < 0.05 ? M.FLOWER : M.PLANT);
    }
}

function stepIce(world, i, x, y) {
    if (world.rng() > 0.02) return;
    const nx = x + ((world.rng() * 3) | 0) - 1;
    const ny = y + ((world.rng() * 3) | 0) - 1;
    if (nx < 0 || ny < 0 || nx >= world.w || ny >= world.h) return;
    const j = ny * world.w + nx;
    if (world.type[j] === M.WATER && world.rng() < 0.25) become(world, j, M.ICE);
}

/** A cloud drifts, rains now and then, and thins away when it has rained out. */
function stepCloud(world, i, x, y) {
    if (--world.life[i] === 0) { become(world, i, M.EMPTY); return; }
    const { rng } = world;
    if (rng() < 0.01 && get(world, x + GX, y + GY) === M.EMPTY) spawn(world, x + GX, y + GY, M.WATER);
    if (rng() < 0.08) {
        const d = rng() < 0.5 ? -1 : 1;
        tryGas(world, i, x + PX * d, y + PY * d);
    }
}

/* ── Ants ──
   An ant's `life` is the way it is facing (1 forward, 2 back, 0 not yet
   chosen), and it travels with the ant when the ant moves. It falls like
   sand, walks along whatever it lands on, climbs a step one cell high, digs
   through sand, nibbles plants, turns round at a wall, and does not survive
   heat, acid or a long swim. */
function stepAnt(world, i, x, y) {
    const { rng, life, type } = world;
    let dead = false, wet = false;
    neighbours(world, x, y, (j) => {
        const o = type[j];
        if (o === M.FIRE || o === M.LAVA || o === M.ACID || o === M.SPARK || o === M.VOID) dead = true;
        else if (o === M.WATER || o === M.HONEY) wet = true;
        else if (o === M.METAL && life[j] > 0) dead = true;
    });
    if (dead || (wet && rng() < 0.004)) { become(world, i, rng() < 0.5 ? M.SMOKE : M.EMPTY); return; }
    if (rng() < 0.5) return;
    if (tryMove(world, i, x + GX, y + GY, M.ANT)) return;
    if (!life[i]) life[i] = rng() < 0.5 ? 1 : 2;
    if (rng() < 0.01) life[i] = 3 - life[i];
    const dir = life[i] === 1 ? 1 : -1;
    const fx = x + PX * dir, fy = y + PY * dir;
    const f = get(world, fx, fy);
    if (f === M.EMPTY || KIND[f] === 'gas') { swap(world, i, fy * world.w + fx); return; }
    // Climb a step: the cell above the one in front, if there is headroom.
    const ux = fx - GX, uy = fy - GY;
    if (get(world, ux, uy) === M.EMPTY && get(world, x - GX, y - GY) === M.EMPTY) {
        swap(world, i, uy * world.w + ux);
        return;
    }
    if ((f === M.SAND || f === M.SNOW || f === M.SALT) && rng() < 0.15) {
        swap(world, i, fy * world.w + fx);  // dig: the grain goes behind
    } else if ((f === M.PLANT || f === M.FLOWER || f === M.HONEY) && rng() < 0.05) {
        become(world, fy * world.w + fx, M.EMPTY);  // eat
    } else {
        life[i] = 3 - life[i];
    }
}

export function step(world) {
    world.tick++;
    const { w, h, type, life, stamp, awake, cw } = world;
    GX = world.gx; GY = world.gy;
    PX = GY; PY = -GX;
    if (world.tick % 30 === 0 && world.emitters.some(e => e.cap)) census(world);
    for (const e of world.emitters) {
        if (world.rng() > e.rate) continue;
        if (e.cap && world.census[e.t] > e.cap * w * h) continue;
        const x = e.x + (e.spread ? Math.round((world.rng() * 2 - 1) * e.spread) : 0);
        const o = get(world, x, e.y);
        // An eraser tap is a drain: it swallows whatever reaches it, but
        // leaves the walls alone (get() reads off-grid as stone).
        if (e.t === M.EMPTY) { if (o !== M.EMPTY && KIND[o] !== 'solid') set(world, x, e.y, M.EMPTY); }
        else if (o === M.EMPTY) set(world, x, e.y, e.t);
    }
    // Walk from the floor up: rows when gravity is vertical, columns when not.
    const vertical = GY !== 0;
    const L = vertical ? h : w, A = vertical ? w : h;
    const fromEnd = (vertical ? GY : GX) > 0;
    for (let n = 0; n < L; n++) {
        const layer = fromEnd ? L - 1 - n : n;
        const ltr = ((layer + world.tick) & 1) === 0;
        const lc = layer >> CHUNK;
        for (let k = 0; k < A; k++) {
            const a = ltr ? k : A - 1 - k;
            const x = vertical ? a : layer, y = vertical ? layer : a;
            const c = vertical ? lc * cw + (a >> CHUNK) : (a >> CHUNK) * cw + lc;
            if (!awake[c]) {
                // Skip to the end of this sleeping chunk's run along the layer.
                k += ltr ? EDGE - (a & EDGE) : a & EDGE;
                continue;
            }
            const i = y * w + x;
            const t = type[i];
            if (t === M.EMPTY || stamp[i] === world.tick) continue;
            if (RESTLESS[t] || (t === M.METAL && life[i])) awake[c] = Math.max(awake[c], 2);
            const mat = MATERIALS[t];
            switch (mat.kind) {
                case 'powder': stepPowder(world, i, x, y, t, mat); break;
                case 'liquid':
                    if (t === M.LAVA) stepLava(world, i, x, y, t, mat);
                    else if (t === M.ACID) stepAcid(world, i, x, y, t, mat);
                    else stepLiquid(world, i, x, y, t, mat);
                    break;
                case 'gas': stepGas(world, i, x, y, t); break;
                case 'fire': stepFire(world, i, x, y); break;
                case 'spark': stepSpark(world, i, x, y); break;
                case 'cloud': stepCloud(world, i, x, y); break;
                case 'critter': stepAnt(world, i, x, y); break;
                default:
                    if (t === M.PLANT) stepPlant(world, i, x, y);
                    else if (t === M.ICE) stepIce(world, i, x, y);
                    else if (t === M.METAL) { if (life[i]) stepMetal(world, i, x, y); }
                    else if (t === M.SPROUT) stepSprout(world, i, x, y);
                    else if (t === M.BATTERY) stepBattery(world, i, x, y);
                    else if (t === M.CLONER) stepCloner(world, i, x, y);
                    else if (t === M.VOID) stepVoid(world, i, x, y);
            }
        }
    }
    for (let c = 0; c < awake.length; c++) if (awake[c]) awake[c]--;
}

/** Counts every material into world.census, for the taps' fill limit. */
export function census(world) {
    const out = world.census;
    out.fill(0);
    for (let i = 0; i < world.type.length; i++) out[world.type[i]]++;
    return out;
}

/** Points gravity along one of the four axes. */
export function setGravity(world, gx, gy) {
    world.gx = gx;
    world.gy = gy;
    wakeAll(world);
}

/** Turns the whole world upside down — the hourglass's one trick. A 180°
    rotation is just the cell arrays read backwards. */
export function flip(world) {
    world.type.reverse();
    world.shade.reverse();
    world.life.reverse();
    world.stamp.fill(0);
    for (const e of world.emitters) { e.x = world.w - 1 - e.x; e.y = world.h - 1 - e.y; }
    wakeAll(world);
}

/** A copy of the world at a new size, cell for nearest cell: what the page
    uses to change the detail level without losing what is on screen. */
export function resized(world, w, h) {
    const out = createWorld(w, h, world.rng);
    out.gx = world.gx; out.gy = world.gy; out.tick = world.tick;
    for (let y = 0; y < h; y++) {
        const sy = Math.min(world.h - 1, Math.floor((y + 0.5) * world.h / h));
        for (let x = 0; x < w; x++) {
            const sx = Math.min(world.w - 1, Math.floor((x + 0.5) * world.w / w));
            const i = y * w + x, j = sy * world.w + sx;
            out.type[i] = world.type[j];
            // Fresh grain when scaling up, so a cell does not become a flat block.
            out.shade[i] = w > world.w ? (world.rng() * 256) | 0 : world.shade[j];
            out.life[i] = world.life[j];
        }
    }
    out.emitters = world.emitters.map(e => ({
        ...e,
        x: Math.round(e.x * w / world.w),
        y: Math.round(e.y * h / world.h),
        spread: Math.round((e.spread || 0) * w / world.w),
    }));
    return out;
}

/* ── Tools ───────────────────────────────────────────────────────────────── */

/** Pushes the loose cells under a brush one or two cells along (dx, dy), as
    a gust of wind would: the cells furthest along go first, so a heap moves
    as a heap instead of piling into itself. */
export function push(world, cx, cy, r, dx, dy) {
    const cells = [];
    for (let oy = -r; oy <= r; oy++) for (let ox = -r; ox <= r; ox++) {
        if (ox * ox + oy * oy > r * r + r) continue;
        const x = cx + ox, y = cy + oy;
        if (x < 0 || y < 0 || x >= world.w || y >= world.h) continue;
        const t = world.type[y * world.w + x];
        if (t !== M.EMPTY && KIND[t] !== 'solid') cells.push([x, y, ox * dx + oy * dy]);
    }
    cells.sort((a, b) => b[2] - a[2]);
    for (const [x0, y0] of cells) {
        let x = x0, y = y0;
        for (let s = 0; s < 2; s++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= world.w || ny >= world.h) break;
            const o = world.type[ny * world.w + nx];
            if (o !== M.EMPTY && KIND[o] !== 'gas') break;
            swap(world, y * world.w + x, ny * world.w + nx);
            x = nx; y = ny;
        }
    }
}

/** A heat lamp (hot) or a freezer (cold) over a round patch: each cell under
    it has a chance of changing as it would if you held a flame or ice to it. */
export function temper(world, cx, cy, r, hot) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r + r || world.rng() > 0.2) continue;
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= world.w || y >= world.h) continue;
        const j = y * world.w + x, o = world.type[j];
        if (hot) {
            if (o === M.WATER) become(world, j, M.STEAM);
            else if (o === M.ICE || o === M.SNOW) become(world, j, M.WATER);
            else if (o === M.CLOUD) become(world, j, M.STEAM);
            else if (o === M.GUNPOWDER) explode(world, x, y, 4);
            else if (FLAMMABLE.has(o)) { if (world.rng() < 0.3) become(world, j, M.FIRE); }
            else if (o === M.SAND) { if (world.rng() < 0.05) become(world, j, M.GLASS); }
            else if (o === M.STONE || o === M.METAL) { if (world.rng() < 0.03) become(world, j, M.LAVA); }
            else if (o === M.ANT) become(world, j, M.SMOKE);
        } else {
            if (o === M.WATER) become(world, j, M.ICE);
            else if (o === M.STEAM) become(world, j, M.WATER);
            else if (o === M.CLOUD) become(world, j, M.SNOW);
            else if (o === M.LAVA) become(world, j, M.STONE);
            else if (o === M.FIRE || o === M.SPARK) become(world, j, M.EMPTY);
            else if (o === M.ACID && world.rng() < 0.2) become(world, j, M.ICE);
        }
    }
}

/** A bolt of lightning from the sky to (tx, ty): it zig-zags down through
    open air leaving a trail of sparks, and where it hits something it
    strikes — fusing sand to glass, lighting what burns, charging metal and
    setting off gunpowder. Returns the cell it struck. */
export function lightning(world, tx, ty) {
    const { rng } = world;
    let x = Math.max(0, Math.min(world.w - 1, tx + Math.round((rng() - 0.5) * world.w * 0.2)));
    let y = 0;
    for (; y < world.h; y++) {
        const o = get(world, x, y);
        if (o !== M.EMPTY && KIND[o] !== 'gas' && KIND[o] !== 'cloud') break;
        if (y >= ty && rng() < 0.3) break;
        if (o === M.EMPTY) set(world, x, y, M.SPARK);
        const toward = Math.sign(tx - x) * Math.min(1, Math.abs(tx - x) / Math.max(1, ty - y + 1) * 2);
        x += Math.round(toward + (rng() - 0.5) * 2.2);
        x = Math.max(0, Math.min(world.w - 1, x));
    }
    strike(world, x, Math.min(y, world.h - 1));
    return { x, y };
}

function strike(world, cx, cy) {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= world.w || y >= world.h) continue;
        const j = y * world.w + x, o = world.type[j];
        if (o === M.SAND) { if (world.rng() < 0.6) become(world, j, M.GLASS); }
        else if (o === M.METAL) { if (world.life[j] === 0) energize(world, j); }
        else if (o === M.EMPTY) { if (world.rng() < 0.3) become(world, j, M.FIRE); }
        else if (FLAMMABLE.has(o) && o !== M.GUNPOWDER) { if (world.rng() < 0.6) become(world, j, M.FIRE); }
        else shock(world, j);
    }
}

/* ── Scenes ──────────────────────────────────────────────────────────────── */

/* The neck is one cell wide and passes exactly one grain per tick, and the
   page steps 60 ticks a second — so 3,600 grains is a one-minute glass. A
   screen too small to hold that many just makes a shorter one. */
export const HOURGLASS_GRAINS = 3600;
// On a fine grid the glass keeps to this many rows, centred, so 3,600 grains
// still fill its top bulb instead of lying in the bottom of a huge one.
const HOURGLASS_ROWS = 190;

/** The hourglass the page is named after: two glass bulbs and a neck, the top
    one full of sand. Returns the row of the neck, which is what the timer
    watches: the clock has run out when no sand is left above it.

    The walls are drawn as runs between one row's edge and the next, not as a
    dot per row. Grains move diagonally, so a staircase wall with a gap at
    every step leaks — the first version emptied in two seconds by pouring
    round the neck instead of through it. */
export function hourglass(world, grains = HOURGLASS_GRAINS) {
    clear(world);
    world.gx = 0; world.gy = 1;
    const { w } = world;
    const gh = Math.min(world.h, HOURGLASS_ROWS);
    const oy = (world.h - gh) >> 1;
    const cx = Math.floor(w / 2);
    const top = oy + Math.max(2, Math.floor(gh * 0.05));
    const bot = oy + gh - 1 - Math.max(2, Math.floor(gh * 0.05));
    const neckY = Math.floor((top + bot) / 2);
    const span = neckY - top;
    const half = Math.max(8, Math.min(Math.floor(w * 0.4), Math.floor(span * 0.62)));
    const NECK = 0;  // a one-cell opening: the centre column and nothing else
    const radius = (y) => {
        const d = Math.abs(y - neckY);
        const t = d / span;  // 0 at the neck, 1 at the ends
        // Each bulb is a rounded ellipse sitting on a cone. The cone is the
        // clamp: never flatter than one cell out per row away from the neck,
        // or grains settle on the shoulders at their angle of repose and the
        // clock never runs out.
        const c = 0.56;
        const e = (t - c) / c;
        const bulb = half * Math.sqrt(Math.max(0, 1 - e * e));
        return Math.max(NECK, Math.round(Math.min(bulb, NECK + d)));
    };
    for (let y = top; y <= bot; y++) {
        const r = radius(y);
        const reach = Math.max(r, y > top ? radius(y - 1) : r, y < bot ? radius(y + 1) : r);
        for (let x = r + 1; x <= reach + 2; x++) {
            set(world, cx - x, y, M.GLASS);
            set(world, cx + x, y, M.GLASS);
        }
        if (y === top || y === bot) {
            for (let x = cx - r - 4; x <= cx + r + 4; x++) {
                set(world, x, y, M.GLASS);
                set(world, x, y + (y === top ? -1 : 1), M.WOOD);
            }
        }
    }
    // Fill the top bulb from the neck upward until `grains` are in. Each row
    // fills from the middle out, so a part-filled top row settles as a heap.
    let left = grains;
    for (let y = neckY - 2; y > top && left > 0; y--) {
        const r = radius(y);
        for (let k = 0; k <= 2 * r && left > 0; k++) {
            const off = (k + 1) >> 1;
            set(world, cx + (k & 1 ? off : -off), y, M.SAND);
            left--;
        }
    }
    return { neckY, cx };
}

export function sandAbove(world, row) {
    let n = 0;
    const { w } = world;
    for (let i = 0; i < row * w; i++) if (world.type[i] === M.SAND) n++;
    return n;
}

export function volcano(world) {
    clear(world);
    const { w, h } = world;
    const cx = Math.floor(w / 2);
    const base = h - 1;
    const peak = Math.floor(h * 0.45);
    for (let y = peak; y <= base; y++) {
        const half = Math.floor(((y - peak) / (base - peak)) * w * 0.38) + 3;
        for (let x = cx - half; x <= cx + half; x++) {
            const inVent = Math.abs(x - cx) <= 2 && y < base - 4;
            set(world, x, y, inVent ? M.LAVA : M.STONE);
        }
    }
    // A lake to the left for the lava to find, trees on the right to set alight.
    for (let y = base - Math.floor(h * 0.12); y <= base; y++) {
        for (let x = 1; x < Math.floor(w * 0.16); x++) if (get(world, x, y) === M.EMPTY) set(world, x, y, M.WATER);
    }
    for (let k = 0; k < 4; k++) {
        const tx = Math.floor(w * (0.8 + k * 0.045));
        const trunk = Math.floor(h * 0.12);
        for (let y = base - trunk; y <= base; y++) if (get(world, tx, y) === M.EMPTY) set(world, tx, y, M.WOOD);
        paint(world, tx, base - trunk - 2, 3, M.PLANT, false);
    }
    for (let y = peak - 3; y < peak; y++) for (let x = cx - 2; x <= cx + 2; x++) set(world, x, y, M.LAVA);
    // The vent never runs dry, so the lake keeps hissing into stone.
    world.emitters.push({ x: cx, y: peak - 1, t: M.LAVA, rate: 1, spread: 2 });
}

export function garden(world) {
    clear(world);
    const { w, h } = world;
    const ground = h - Math.floor(h * 0.16);
    for (let y = ground; y < h; y++) for (let x = 0; x < w; x++) set(world, x, y, M.SAND);
    // A stone pond in the middle, and seeds along the ground for the rain to find.
    const bx = Math.floor(w * 0.38), bw = Math.floor(w * 0.24), by = ground - Math.floor(h * 0.08);
    for (let y = by; y < ground; y++) {
        set(world, bx, y, M.STONE);
        set(world, bx + bw, y, M.STONE);
    }
    for (let y = by + 2; y < ground; y++) for (let x = bx + 1; x < bx + bw; x++) set(world, x, y, M.WATER);
    const seeds = Math.max(4, Math.floor(w / 22));
    for (let k = 0; k < seeds; k++) {
        const sx = Math.floor((k + 0.5) * w / seeds);
        if (sx > bx - 2 && sx < bx + bw + 2) continue;
        // Every third one a tree seed, the rest grass.
        if (k % 3 === 1) set(world, sx, ground - 1, M.SEED);
        else {
            set(world, sx, ground - 1, M.PLANT);
            world.life[(ground - 1) * w + sx] = 60;
        }
    }
    // Two seeds on the pond's rim, already drinking.
    set(world, bx, by - 1, M.PLANT);
    set(world, bx + bw, by - 1, M.PLANT);
    // A light rain to keep it all watered.
    world.emitters.push({ x: Math.floor(w / 2), y: 0, t: M.WATER, rate: 0.5, spread: Math.floor(w / 2) });
}

/** The newer materials side by side: a glass beaker of acid with a stone
    block lowered into it, a gunpowder fuse running to a stack of crates, and
    a snowdrift on a ledge over a lamp of lava. */
export function lab(world) {
    clear(world);
    const { w, h } = world;
    const floor = h - 3;
    for (let y = floor; y < h; y++) for (let x = 0; x < w; x++) set(world, x, y, M.STONE);
    // Beaker, left: glass walls and floor, two-thirds acid, a stone block in it.
    const bx0 = Math.floor(w * 0.06), bx1 = Math.floor(w * 0.3), btop = Math.floor(h * 0.45);
    for (let y = btop; y < floor; y++) { set(world, bx0, y, M.GLASS); set(world, bx1, y, M.GLASS); }
    for (let x = bx0; x <= bx1; x++) set(world, x, floor - 1, M.GLASS);
    const acidTop = btop + Math.floor((floor - btop) * 0.35);
    for (let y = acidTop; y < floor - 1; y++) for (let x = bx0 + 1; x < bx1; x++) set(world, x, y, M.ACID);
    const mid = (bx0 + bx1) >> 1, bs = Math.max(3, Math.floor((bx1 - bx0) * 0.18));
    for (let y = acidTop - bs; y < acidTop + bs; y++) for (let x = mid - bs; x <= mid + bs; x++) set(world, x, y, M.STONE);
    // Fuse, middle: a gunpowder trail on a stone shelf to wooden crates, lit at one end.
    const sy = Math.floor(h * 0.62), sx0 = bx1 + 6, sx1 = Math.floor(w * 0.72);
    for (let x = sx0; x <= sx1; x++) set(world, x, sy, M.STONE);
    for (let x = sx0 + 2; x < sx1 - 6; x++) set(world, x, sy - 1, M.GUNPOWDER);
    for (let y = sy - 9; y < sy; y++) for (let x = sx1 - 6; x <= sx1; x++) {
        set(world, x, y, (x - sx1 + 6) % 3 === 0 || y === sy - 9 ? M.WOOD : M.GUNPOWDER);
    }
    for (let x = sx0; x < sx0 + 2; x++) set(world, x, sy - 1, M.FIRE);
    // Right: a ledge of snow above a small lava lamp, melting into a pool.
    const lx0 = Math.floor(w * 0.78), lx1 = w - 3, ly = Math.floor(h * 0.4);
    for (let x = lx0; x <= lx1; x++) set(world, x, ly, M.STONE);
    for (let y = ly - 6; y < ly; y++) for (let x = lx0 + 1; x < lx1; x++) set(world, x, y, M.SNOW);
    for (let x = lx0 + 2; x < lx1 - 1; x++) set(world, x, floor - 1, M.LAVA);
    world.emitters.push({ x: (lx0 + lx1) >> 1, y: 0, t: M.SNOW, rate: 0.3, spread: (lx1 - lx0) >> 1 });
}

/** Machines: a battery driving a pulse round a loop of wire that melts the
    ice strung on it, a lead off the loop to a gunpowder charge, a cloner
    making ants that walk a shelf into a void, and tree seeds in a sand bed
    under a rain cloud. */
export function circuit(world) {
    clear(world);
    const { w, h } = world;
    const floor = h - 3;
    for (let y = floor; y < h; y++) for (let x = 0; x < w; x++) set(world, x, y, M.STONE);
    // The loop: a rectangle of metal with a battery against one side.
    const lx0 = Math.floor(w * 0.08), lx1 = Math.floor(w * 0.42);
    const ly0 = Math.floor(h * 0.18), ly1 = Math.floor(h * 0.5);
    for (let x = lx0; x <= lx1; x++) { set(world, x, ly0, M.METAL); set(world, x, ly1, M.METAL); }
    for (let y = ly0; y <= ly1; y++) { set(world, lx0, y, M.METAL); set(world, lx1, y, M.METAL); }
    set(world, lx0 - 1, (ly0 + ly1) >> 1, M.BATTERY);
    set(world, lx0 - 2, (ly0 + ly1) >> 1, M.BATTERY);
    for (let x = lx0 + 4; x < lx1 - 2; x += 5) set(world, x, ly0 - 1, M.ICE);
    // A long lead off the loop's bottom corner, down into a glass cup of
    // gunpowder on the floor (the cup stops the charge slumping off the wire).
    const ex = Math.floor(w * 0.56);
    for (let x = lx1; x <= ex; x++) set(world, x, ly1, M.METAL);
    for (let y = ly1; y < floor - 3; y++) set(world, ex, y, M.METAL);
    for (let y = floor - 7; y < floor; y++) { set(world, ex - 5, y, M.GLASS); set(world, ex + 5, y, M.GLASS); }
    for (let y = floor - 6; y < floor; y++) for (let x = ex - 4; x <= ex + 4; x++) if (get(world, x, y) === M.EMPTY) set(world, x, y, M.GUNPOWDER);
    // Right, high: a cloner primed with ants on a shelf, a void at the far end.
    const sy = Math.floor(h * 0.28), sx0 = Math.floor(w * 0.64), sx1 = w - 4;
    for (let x = sx0; x <= sx1; x++) set(world, x, sy, M.STONE);
    set(world, sx0 + 2, sy - 1, M.CLONER);
    world.life[(sy - 1) * w + sx0 + 2] = M.ANT + 1;
    for (let y = sy - 4; y < sy; y++) for (let x = sx1 - 2; x <= sx1; x++) set(world, x, y, M.VOID);
    // Right, low: tree seeds in a sand bed under a rain cloud.
    const bed = Math.floor(w * 0.68);
    for (let y = floor - 4; y < floor; y++) for (let x = bed; x < w - 2; x++) set(world, x, y, M.SAND);
    for (let k = 0; k < 4; k++) set(world, bed + Math.floor((k + 0.5) * (w - 2 - bed) / 4), floor - 5, M.SEED);
    for (let y = Math.floor(h * 0.4); y < Math.floor(h * 0.46); y++) {
        for (let x = bed; x < w - 4; x++) if (world.rng() < 0.7) set(world, x, y, M.CLOUD);
    }
}
