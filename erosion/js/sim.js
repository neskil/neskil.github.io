// Rainmaker: an island as a grid of heights, and rain that carves it.
// No DOM, no WebGL. tests.html imports this directly.
//
// Heights run 0…1 and a cell is one unit across. Each raindrop is followed on
// its own: it rolls downhill, picks rock up while it is fast and the slope is
// steep, and puts it down when it slows. Rivers, gorges, fans and deltas are
// not drawn anywhere; they are what a few hundred thousand such drops leave.

export const SEA = 0.12;

export const P = {
    inertia: 0.03,       // how much a drop keeps its heading over the slope's
    capacity: 0.5,         // sediment a drop can carry, per unit of speed × water × drop
    minCapacity: 0.002,
    erode: 0.2,         // share of spare capacity filled per step
    deposit: 0.1,        // share of excess sediment dropped per step
    evaporate: 0.012,
    gravity: 4,
    life: 110,           // steps before a drop has soaked away
    radius: 2,           // a drop wears a patch this wide, not a single cell
};

export function rng(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ── Making an island ──
function lattice(seed) {
    return (x, y) => {
        let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 2147483647);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
}
function valueNoise(hash, x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    let fx = x - xi, fy = y - yi;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

export function makeIsland(n = 256, seed = 1) {
    const hash = lattice(seed), h = new Float32Array(n * n);
    const fbm = (x, y, oct, ridged) => {
        let amp = 0.5, sum = 0, norm = 0;
        for (let o = 0; o < oct; o++) {
            let v = valueNoise(hash, x + o * 17.3, y - o * 9.1);
            if (ridged) { v = 1 - Math.abs(2 * v - 1); v *= v; }
            sum += amp * v; norm += amp; amp *= 0.5; x *= 2.03; y *= 2.03;
        }
        return sum / norm;
    };
    for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
            const u = i / (n - 1) - 0.5, v = j / (n - 1) - 0.5;
            // Bend the coastline so it is not a circle.
            const wu = u + 0.09 * (fbm(u * 3 + 40, v * 3, 3) - 0.5), wv = v + 0.09 * (fbm(u * 3, v * 3 + 70, 3) - 0.5);
            const d = Math.hypot(wu, wv) * 2;                       // 0 at the middle, 1 at the edge
            const mask = Math.max(0, 1 - Math.pow(d / 0.93, 2.4));
            const hills = fbm(u * 4.2 + 10, v * 4.2 + 10, 6, false);
            const ridges = fbm(u * 3.1 + 80, v * 3.1 - 30, 5, true);
            const land = 0.2 + 0.5 * hills + 0.62 * ridges * hills;
            h[j * n + i] = Math.max(0, Math.min(1, mask * land * 1.08 + (mask > 0 ? 0.02 : 0) * hills));
        }
    }
    return {
        n, seed, h,
        base: Float32Array.from(h),          // the island before any rain, to compare against
        flow: new Float32Array(n * n),       // water lately through each cell: where the rivers are
        drops: 0, lost: 0, rand: rng(seed * 7919 + 13),
        brush: makeBrush(P.radius),
    };
}

function makeBrush(radius) {
    const cells = [];
    let total = 0;
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const w = radius - Math.hypot(dx, dy);
            if (w > 0) { cells.push([dx, dy, w]); total += w; }
        }
    }
    return cells.map(([dx, dy, w]) => [dx, dy, w / total]);
}

// Height and slope at a point between cells.
export function sample(t, x, y, out = {}) {
    const n = t.n, h = t.h;
    const xi = Math.max(0, Math.min(n - 2, Math.floor(x))), yi = Math.max(0, Math.min(n - 2, Math.floor(y)));
    const fx = Math.max(0, Math.min(1, x - xi)), fy = Math.max(0, Math.min(1, y - yi));
    const i = yi * n + xi;
    const a = h[i], b = h[i + 1], c = h[i + n], d = h[i + n + 1];
    out.gx = (b - a) * (1 - fy) + (d - c) * fy;
    out.gy = (c - a) * (1 - fx) + (d - b) * fx;
    out.h = a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
    return out;
}

function spread(t, x, y, amount) {
    // Put sediment down over the brush, so a dying drop leaves a fan and not a
    // spike. Silt settling in the sea builds the bed up to just under the
    // surface and no further; what will not fit is carried off to deep water
    // (and counted in t.lost, so nothing vanishes from the books).
    const n = t.n, cx = Math.round(x), cy = Math.round(y);
    let placed = 0;
    for (const [dx, dy, w] of t.brush) {
        const px = cx + dx, py = cy + dy;
        if (px < 0 || py < 0 || px >= n || py >= n) continue;
        const k = py * n + px;
        let add = amount * w;
        if (t.h[k] < SEA) add = Math.min(add, Math.max(0, SEA - 0.004 - t.h[k]));
        t.h[k] += add; placed += add;
    }
    t.lost += amount - placed;
}

const S0 = {}, S1 = {};
// One raindrop, landing at (x, y). Returns how many steps it lived.
export function drop(t, x, y) {
    const n = t.n, h = t.h;
    let dx = 0, dy = 0, speed = 1, water = 1, sediment = 0, step = 0;
    for (; step < P.life; step++) {
        const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, cell = yi * n + xi;
        sample(t, x, y, S0);
        dx = dx * P.inertia - S0.gx * (1 - P.inertia);
        dy = dy * P.inertia - S0.gy * (1 - P.inertia);
        const len = Math.hypot(dx, dy);
        if (len < 1e-9) break;                        // a dead-flat spot: it pools and soaks in
        dx /= len; dy /= len;
        x += dx; y += dy;
        if (x < 1 || y < 1 || x >= n - 2 || y >= n - 2) { x -= dx; y -= dy; break; }
        t.flow[cell] += water;
        const dh = sample(t, x, y, S1).h - S0.h;
        if (S1.h < SEA - 0.01) break;                 // out to sea: whatever it carries settles here
        const cap = Math.max(-dh * speed * water * P.capacity, P.minCapacity);
        if (sediment > cap || dh > 0) {
            // Uphill it fills the hollow behind it; otherwise it drops part of the excess.
            const amount = dh > 0 ? Math.min(dh, sediment) : (sediment - cap) * P.deposit;
            sediment -= amount;
            h[cell] += amount * (1 - fx) * (1 - fy);
            h[cell + 1] += amount * fx * (1 - fy);
            h[cell + n] += amount * (1 - fx) * fy;
            h[cell + n + 1] += amount * fx * fy;
        } else {
            // Never dig deeper than the step down, or drops would drill pits.
            const amount = Math.min((cap - sediment) * P.erode, -dh);
            for (const [bx, by, w] of t.brush) {
                const px = xi + bx, py = yi + by;
                if (px < 0 || py < 0 || px >= n || py >= n) continue;
                const k = py * n + px, take = Math.min(h[k], amount * w);
                h[k] -= take; sediment += take;
            }
        }
        speed = Math.sqrt(Math.max(0, speed * speed - dh * P.gravity));
        water *= 1 - P.evaporate;
    }
    if (sediment > 0) spread(t, x, y, sediment);
    t.drops++;
    return step;
}

// Rain `count` drops. With a cloud {x, y, r} they fall round that point;
// otherwise anywhere on the map.
export function rain(t, count, cloud = null) {
    const n = t.n, rand = t.rand;
    for (let i = 0; i < count; i++) {
        let x, y;
        if (cloud) {
            const a = rand() * 2 * Math.PI, r = cloud.r * Math.sqrt(rand());
            x = cloud.x + Math.cos(a) * r; y = cloud.y + Math.sin(a) * r;
        } else { x = 1 + rand() * (n - 3); y = 1 + rand() * (n - 3); }
        if (x < 1 || y < 1 || x >= n - 2 || y >= n - 2) continue;
        if (sample(t, x, y, S0).h < SEA) { t.drops++; continue; }          // fell in the sea
        drop(t, x, y);
    }
}

// The rivers are a running average: let old water drain away.
export function dry(t, keep = 0.97) {
    const f = t.flow;
    for (let i = 0; i < f.length; i++) f[i] *= keep;
}

// Raise (or with amount < 0, lower) a rounded hill. Both the island and its
// before-picture change, so "what the rain did" stays the rain's doing.
export function sculpt(t, x, y, radius, amount) {
    const n = t.n, r = Math.ceil(radius);
    for (let py = Math.max(0, Math.round(y) - r); py <= Math.min(n - 1, Math.round(y) + r); py++) {
        for (let px = Math.max(0, Math.round(x) - r); px <= Math.min(n - 1, Math.round(x) + r); px++) {
            const d = Math.hypot(px - x, py - y) / radius;
            if (d >= 1) continue;
            const w = amount * (1 - d * d) * (1 - d * d), k = py * n + px;
            const edge = Math.min(px, py, n - 1 - px, n - 1 - py) / 8;      // leave the map's rim under water
            const add = w * Math.min(1, edge);
            const before = t.h[k];
            t.h[k] = Math.max(0, Math.min(1.2, before + add));
            t.base[k] = Math.max(0, t.base[k] + (t.h[k] - before));
        }
    }
}

// Where a ray from `eye` along `dir` (world units: x and z in cells, y in
// heights × yScale) first meets the land or the sea. Null if it misses.
export function pick(t, eye, dir, yScale) {
    const n = t.n;
    let prev = 0;
    for (let s = 0; s < n * 4; s += 0.5) {
        const x = eye[0] + dir[0] * s, y = eye[1] + dir[1] * s, z = eye[2] + dir[2] * s;
        if (x < 0 || z < 0 || x > n - 1 || z > n - 1) { prev = s; continue; }
        const ground = Math.max(sample(t, x, z, S0).h, SEA) * yScale;
        if (y <= ground) {
            // Close in on the crossing between the last step above and this one below.
            let lo = prev, hi = s;
            for (let k = 0; k < 12; k++) {
                const m = (lo + hi) / 2;
                const mx = eye[0] + dir[0] * m, mz = eye[2] + dir[2] * m;
                const inside = mx >= 0 && mz >= 0 && mx <= n - 1 && mz <= n - 1;
                const g = inside ? Math.max(sample(t, mx, mz, S0).h, SEA) * yScale : -Infinity;
                if (eye[1] + dir[1] * m <= g) hi = m; else lo = m;
            }
            return { x: eye[0] + dir[0] * hi, y: eye[2] + dir[2] * hi, land: sample(t, eye[0] + dir[0] * hi, eye[2] + dir[2] * hi, S0).h >= SEA };
        }
        prev = s;
    }
    return null;
}

// ── What the rain has done so far ──
export function measure(t) {
    const { h, base, n } = t;
    let moved = 0, cut = 0, built = 0, land = 0, volume = 0;
    for (let i = 0; i < h.length; i++) {
        const d = h[i] - base[i];
        if (d < 0) { moved -= d; if (-d > cut) cut = -d; } else if (d > built) built = d;
        if (h[i] >= SEA) land++;
        if (base[i] > SEA) volume += base[i] - SEA;
    }
    return {
        moved,                       // rock taken from where it was, in height × cells
        movedShare: volume ? moved / volume : 0,
        deepestCut: cut, tallestFill: built,
        landShare: land / (n * n),
    };
}

export const total = (t) => { let s = 0; for (let i = 0; i < t.h.length; i++) s += t.h[i]; return s; };

// How much of the water runs through the busiest `share` of cells: near
// `share` itself when rain runs off evenly, near 1 once it has found rivers.
export function riverShare(t, share = 0.02) {
    const sorted = Float32Array.from(t.flow).sort();
    const from = Math.floor(sorted.length * (1 - share));
    let top = 0, all = 0;
    for (let i = 0; i < sorted.length; i++) { all += sorted[i]; if (i >= from) top += sorted[i]; }
    return all ? top / all : 0;
}
