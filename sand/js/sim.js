// Sand Clock — the falling-sand world, with no DOM in it.
//
// The world is a grid of cells, one material each. A tick walks the grid from
// the bottom row up (so a grain that falls is not visited again lower down)
// and alternates the direction it walks each row (so nothing drifts left just
// because left came first). Anything that moves into a cell is stamped with
// the tick, and a stamped cell is skipped — that is what stops a rising
// bubble of steam from shooting to the ceiling in one frame.
//
// Everything random comes from the rng passed in, so tests can run a world
// from a seed and get the same answer twice.

export const M = Object.freeze({
    EMPTY: 0, STONE: 1, SAND: 2, WATER: 3, LAVA: 4, PLANT: 5, FIRE: 6,
    OIL: 7, STEAM: 8, SMOKE: 9, ICE: 10, GLASS: 11, WOOD: 12, FLOWER: 13,
    ACID: 14, GUNPOWDER: 15, SALT: 16, SNOW: 17,
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
];

const KIND = MATERIALS.map(m => m.kind);
const DENSITY = MATERIALS.map(m => m.density);
const FLAMMABLE = new Set([M.PLANT, M.OIL, M.WOOD, M.FLOWER, M.GUNPOWDER]);
// What acid cannot eat: the glass it is kept in, and itself.
const ACIDPROOF = new Set([M.EMPTY, M.ACID, M.GLASS, M.STEAM, M.SMOKE, M.FIRE]);
const HOT = new Set([M.FIRE, M.LAVA, M.STEAM]);

const LIFE = {
    [M.FIRE]: [24, 70],
    [M.STEAM]: [160, 420],
    [M.SMOKE]: [40, 110],
};

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

export function createWorld(w, h, rng = Math.random) {
    return {
        w, h, rng,
        tick: 0,
        type: new Uint8Array(w * h),
        shade: new Uint8Array(w * h),
        life: new Uint16Array(w * h),
        stamp: new Uint32Array(w * h),
        // Taps that keep pouring: { x, y, t, rate, spread }. A scene sets them
        // (the volcano's vent, the garden's rain); clear() takes them away.
        emitters: [],
    };
}

/** Puts one cell of `t` at (x, y), with a fresh shade and lifetime. */
export function set(world, x, y, t) {
    if (x < 0 || y < 0 || x >= world.w || y >= world.h) return;
    const i = y * world.w + x;
    world.type[i] = t;
    world.shade[i] = (world.rng() * 256) | 0;
    const span = LIFE[t];
    world.life[i] = span ? span[0] + ((world.rng() * (span[1] - span[0])) | 0) : 0;
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
}

/** A round brush. Powders and liquids go down speckled so they read as grains
    and pour rather than landing as one slab; solids go down whole. */
export function paint(world, cx, cy, r, t, overwrite = false) {
    const kind = KIND[t];
    const sparse = kind === 'powder' || kind === 'liquid' || kind === 'gas' || kind === 'fire';
    for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy > r * r + r) continue;
            const x = cx + dx, y = cy + dy;
            if (x < 0 || y < 0 || x >= world.w || y >= world.h) continue;
            if (sparse && world.rng() > 0.55) continue;
            const cur = world.type[y * world.w + x];
            if (t !== M.EMPTY && cur !== M.EMPTY && !overwrite) continue;
            set(world, x, y, t);
        }
    }
}

function swap(world, a, b) {
    const { type, shade, life, stamp } = world;
    const t = type[a]; type[a] = type[b]; type[b] = t;
    const s = shade[a]; shade[a] = shade[b]; shade[b] = s;
    const l = life[a]; life[a] = life[b]; life[b] = l;
    stamp[a] = world.tick;
    stamp[b] = world.tick;
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
}

function stepPowder(world, i, x, y, t, mat) {
    if (t === M.SALT || t === M.SNOW) {
        // One random neighbour a tick is enough to read as a slow reaction.
        const nx = x + ((world.rng() * 3) | 0) - 1, ny = y + ((world.rng() * 3) | 0) - 1;
        const o = get(world, nx, ny), j = ny * world.w + nx;
        if (t === M.SALT) {
            if (o === M.ICE || o === M.SNOW) { if (world.rng() < 0.08) become(world, j, M.WATER); }
            else if (o === M.WATER && world.rng() < 0.004) { become(world, i, M.EMPTY); return; }
        } else if (HOT.has(o) && world.rng() < 0.3) { become(world, i, M.WATER); return; }
    }
    // A flake drifts: it falls only some ticks and wanders when it does.
    if (mat.drift && world.rng() < mat.drift) {
        if (world.rng() < 0.3) tryMove(world, i, x + (world.rng() < 0.5 ? -1 : 1), y, t);
        return;
    }
    if (tryMove(world, i, x, y + 1, t)) return;
    const d = world.rng() < 0.5 ? -1 : 1;
    if (tryMove(world, i, x + d, y + 1, t)) return;
    tryMove(world, i, x - d, y + 1, t);
}

function stepLiquid(world, i, x, y, t, mat) {
    if (mat.viscous && world.rng() < mat.viscous) return;
    if (tryMove(world, i, x, y + 1, t)) return;
    const d = world.rng() < 0.5 ? -1 : 1;
    if (tryMove(world, i, x + d, y + 1, t)) return;
    if (tryMove(world, i, x - d, y + 1, t)) return;
    // Spread sideways: slide as far as `flow` cells while the way is open.
    // Only into empty cells or gases, so a pool levels out instead of two
    // liquids churning through each other sideways forever.
    const w = world.w;
    let best = -1;
    for (let s = 1; s <= mat.flow; s++) {
        const nx = x + d * s;
        if (nx < 0 || nx >= w) break;
        const o = world.type[y * w + nx];
        if (o !== M.EMPTY && KIND[o] !== 'gas') break;
        best = nx;
        // Found a drop: stop here so it falls next tick.
        if (y + 1 < world.h && world.type[(y + 1) * w + nx] === M.EMPTY) break;
    }
    if (best >= 0) swap(world, i, y * w + best);
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
    if (tryGas(world, i, x + dx, y - 1)) return;
    if (tryGas(world, i, x - dx, y - 1)) return;
    tryGas(world, i, x + (world.rng() < 0.5 ? -1 : 1), y);
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
        tryGas(world, i, x + dx, y - 1);
    }
}

function stepLava(world, i, x, y, t, mat) {
    let quenched = false;
    neighbours(world, x, y, (j) => {
        const o = world.type[j];
        if (o === M.WATER) {
            quenched = true;
            become(world, j, M.STEAM);
        } else if (o === M.ICE) {
            become(world, j, M.WATER);
        } else if (o === M.SNOW) {
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

/** A blast of radius r: everything inside but stone and glass is thrown out
    as fire and empty air, and gunpowder caught in it goes up too — as fire,
    which sets off the next grain over, so a trail burns along like a fuse. */
export function explode(world, cx, cy, r) {
    for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy > r * r) continue;
            const x = cx + dx, y = cy + dy;
            if (x < 0 || y < 0 || x >= world.w || y >= world.h) continue;
            const j = y * world.w + x;
            const o = world.type[j];
            if (o === M.GLASS || (o === M.STONE && world.rng() < 0.85)) continue;
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
    if (y > 0) {
        const up = i - w;
        if (type[up] === M.PLANT && life[i] > life[up] + 2) {
            const give = (life[i] - life[up]) >> 1;
            life[i] -= give;
            life[up] += give;
        }
    }

    if (life[i] < GROW_COST * 2) return;
    // Grow: up, or up and to one side; now and then straight out sideways.
    const r = rng();
    const gx = x + (r < 0.5 ? 0 : r < 0.72 ? -1 : r < 0.94 ? 1 : (rng() < 0.5 ? -2 : 2));
    const gy = r < 0.94 ? y - 1 : y;
    if (gx < 0 || gy < 0 || gx >= w || gy >= h) return;
    const g = gy * w + gx;
    if (type[g] !== M.EMPTY) return;
    if (plantNeighbours(world, gx, gy) > 2) {
        // Crowded in: a tip with water to spare and nowhere to go flowers.
        if (life[i] > MAX_HELD * 0.6 && plantNeighbours(world, x, y) <= 2 && rng() < 0.08) {
            type[i] = M.FLOWER;
            world.stamp[i] = world.tick;
        }
        return;
    }
    become(world, g, M.PLANT);
    life[i] -= GROW_COST;
    life[g] = GROW_COST >> 1;
}

function stepIce(world, i, x, y) {
    if (world.rng() > 0.02) return;
    const nx = x + ((world.rng() * 3) | 0) - 1;
    const ny = y + ((world.rng() * 3) | 0) - 1;
    if (nx < 0 || ny < 0 || nx >= world.w || ny >= world.h) return;
    const j = ny * world.w + nx;
    if (world.type[j] === M.WATER && world.rng() < 0.25) become(world, j, M.ICE);
}

export function step(world) {
    world.tick++;
    const { w, h, type, stamp } = world;
    for (const e of world.emitters) {
        if (world.rng() > e.rate) continue;
        const x = e.x + (e.spread ? Math.round((world.rng() * 2 - 1) * e.spread) : 0);
        const o = get(world, x, e.y);
        // An eraser tap is a drain: it swallows whatever reaches it, but
        // leaves the walls alone (get() reads off-grid as stone).
        if (e.t === M.EMPTY) { if (o !== M.EMPTY && KIND[o] !== 'solid') set(world, x, e.y, M.EMPTY); }
        else if (o === M.EMPTY) set(world, x, e.y, e.t);
    }
    for (let y = h - 1; y >= 0; y--) {
        const ltr = ((y + world.tick) & 1) === 0;
        for (let k = 0; k < w; k++) {
            const x = ltr ? k : w - 1 - k;
            const i = y * w + x;
            const t = type[i];
            if (t === M.EMPTY || stamp[i] === world.tick) continue;
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
                default:
                    if (t === M.PLANT) stepPlant(world, i, x, y);
                    else if (t === M.ICE) stepIce(world, i, x, y);
            }
        }
    }
}

/** Turns the whole world upside down — the hourglass's one trick. A 180°
    rotation is just the cell arrays read backwards. */
export function flip(world) {
    world.type.reverse();
    world.shade.reverse();
    world.life.reverse();
    world.stamp.fill(0);
}

/* ── Scenes ──────────────────────────────────────────────────────────────── */

/* The neck is one cell wide and passes exactly one grain per tick, and the
   page steps 60 ticks a second — so 3,600 grains is a one-minute glass. A
   screen too small to hold that many just makes a shorter one. */
export const HOURGLASS_GRAINS = 3600;

/** The hourglass the page is named after: two glass bulbs and a neck, the top
    one full of sand. Returns the row of the neck, which is what the timer
    watches: the clock has run out when no sand is left above it.

    The walls are drawn as runs between one row's edge and the next, not as a
    dot per row. Grains move diagonally, so a staircase wall with a gap at
    every step leaks — the first version emptied in two seconds by pouring
    round the neck instead of through it. */
export function hourglass(world, grains = HOURGLASS_GRAINS) {
    clear(world);
    const { w, h } = world;
    const cx = Math.floor(w / 2);
    const top = Math.max(2, Math.floor(h * 0.05));
    const bot = h - 1 - top;
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
        set(world, sx, ground - 1, M.PLANT);
        world.life[(ground - 1) * w + sx] = 60;
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
