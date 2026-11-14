// Gait Lab: creatures of joints, bones and muscles, and the evolution that
// teaches them to walk. No DOM. tests.html imports this directly.
//
// A creature is { nodes: [[x, y], …], links: [[a, b, kind], …] } in metres,
// y up, ground at y = 0; kind is 1 for a muscle, 0 for a bone. Nothing in the
// body says how to move. A genome does: for every muscle how far it pulls and
// when in the beat, for every joint how well it grips the ground, and one
// tempo for the lot. Evolution only ever sees how far a genome got.

export const DT = 1 / 240;
export const RACE_SECONDS = 10;
export const MAX_NODES = 12;
export const MAX_LINKS = 26;
export const MIN_LINK = 0.2;

const GRAVITY = 9.8;
const STIFF = 700;          // N/m per unit mass
const DAMP = 9;             // along the link
const DRAG = 0.25;          // air
const MAX_SPEED = 30;

// mulberry32: small, fast, and the same on every machine.
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

export const PRESETS = {
    tripod: {
        name: 'Tripod',
        nodes: [[0, 0], [1, 0], [0.5, 0.8]],
        links: [[0, 1, 1], [1, 2, 1], [2, 0, 1]],
    },
    worm: {
        name: 'Inchworm',
        nodes: [[0, 0], [0.5, 0.35], [1, 0], [1.5, 0.35], [2, 0]],
        links: [[0, 1, 0], [1, 2, 0], [2, 3, 0], [3, 4, 0], [0, 2, 1], [2, 4, 1], [1, 3, 1]],
    },
    biped: {
        name: 'Biped',
        nodes: [[0.2, 1.1], [0.9, 1.1], [0.55, 1.6], [0, 0.55], [1.1, 0.55], [0.1, 0], [1.0, 0]],
        links: [[0, 1, 0], [1, 2, 0], [2, 0, 0], [0, 3, 0], [1, 4, 0], [3, 5, 0], [4, 6, 0],
                [1, 3, 1], [0, 4, 1], [0, 5, 1], [1, 6, 1], [3, 4, 1]],
    },
    crab: {
        name: 'Crab',
        nodes: [[0.4, 0.6], [1.4, 0.6], [0.9, 1.0], [0, 0], [0.7, 0], [1.1, 0], [1.8, 0]],
        links: [[0, 1, 0], [1, 2, 0], [2, 0, 0], [0, 3, 1], [0, 4, 1], [1, 5, 1], [1, 6, 1],
                [2, 3, 1], [2, 6, 1], [3, 4, 0], [5, 6, 0]],
    },
};

// ── What counts as a creature ──
export function validate(spec) {
    const { nodes, links } = spec;
    if (!nodes || nodes.length < 3) return { ok: false, why: 'It needs at least three joints.' };
    if (nodes.length > MAX_NODES) return { ok: false, why: 'At most ' + MAX_NODES + ' joints.' };
    if (links.length > MAX_LINKS) return { ok: false, why: 'At most ' + MAX_LINKS + ' links.' };
    if (!links.some(l => l[2])) return { ok: false, why: 'It needs at least one muscle, or nothing can move.' };
    const seen = new Set();
    for (const [a, b] of links) {
        if (a === b || !nodes[a] || !nodes[b]) return { ok: false, why: 'A link joins two different joints.' };
        const key = Math.min(a, b) + '-' + Math.max(a, b);
        if (seen.has(key)) return { ok: false, why: 'Two links join the same pair of joints.' };
        seen.add(key);
        if (Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]) < MIN_LINK - 1e-9) return { ok: false, why: 'Two joints are too close together.' };
    }
    // One body: every joint reachable from the first.
    const reach = new Set([0]);
    for (let grew = true; grew;) {
        grew = false;
        for (const [a, b] of links) {
            if (reach.has(a) !== reach.has(b)) { reach.add(a); reach.add(b); grew = true; }
        }
    }
    if (reach.size !== nodes.length) return { ok: false, why: 'Every joint has to be attached to the rest.' };
    return { ok: true, why: '' };
}

// Stand a creature on the ground with its left-most joint at x = 0.
export function settle(spec) {
    const minX = Math.min(...spec.nodes.map(n => n[0])), minY = Math.min(...spec.nodes.map(n => n[1]));
    return { ...spec, nodes: spec.nodes.map(n => [n[0] - minX, n[1] - minY]), links: spec.links.map(l => [...l]) };
}

// ── Genomes ──
// Layout: [tempo, grip × nodes, (pull, phase) × muscles], every gene in 0…1.
export const genomeLength = (spec) => 1 + spec.nodes.length + 2 * spec.links.filter(l => l[2]).length;
export function randomGenome(spec, rand) {
    return Float32Array.from({ length: genomeLength(spec) }, rand);
}
export const tempoHz = (g) => 0.5 + 1.7 * g[0];
export const gripOf = (spec, g, node) => 0.05 + 1.45 * g[1 + node];
export const MAX_PULL = 0.38;                    // a muscle changes length by at most this fraction

// ── Physics ──
export function createWorld(spec, genome) {
    const n = spec.nodes.length;
    const w = {
        n, t: 0, spec, genome,
        x: new Float64Array(n), y: new Float64Array(n),
        vx: new Float64Array(n), vy: new Float64Array(n),
        fx: new Float64Array(n), fy: new Float64Array(n),
        grip: new Float64Array(n),
        links: [], hz: tempoHz(genome), broken: false, startX: 0,
    };
    for (let i = 0; i < n; i++) { w.x[i] = spec.nodes[i][0]; w.y[i] = spec.nodes[i][1]; w.grip[i] = gripOf(spec, genome, i); }
    let m = 0;
    for (const [a, b, kind] of spec.links) {
        const rest = Math.hypot(w.x[a] - w.x[b], w.y[a] - w.y[b]);
        const link = { a, b, rest, muscle: !!kind, pull: 0, phase: 0, target: rest };
        if (kind) {
            link.pull = MAX_PULL * genome[1 + n + 2 * m];
            link.phase = genome[2 + n + 2 * m];
            m++;
        }
        w.links.push(link);
    }
    w.startX = centre(w);
    return w;
}

export function centre(w) {
    let s = 0;
    for (let i = 0; i < w.n; i++) s += w.x[i];
    return s / w.n;
}
export const distance = (w) => centre(w) - w.startX;

export function step(w) {
    if (w.broken) return;
    const { n, x, y, vx, vy, fx, fy } = w;
    // Muscles ease in over the first half second, so nothing starts with a kick.
    const ease = Math.min(1, w.t * 2);
    const beat = 2 * Math.PI * w.hz * w.t;
    for (let i = 0; i < n; i++) { fx[i] = -DRAG * vx[i]; fy[i] = -GRAVITY - DRAG * vy[i]; }
    for (const l of w.links) {
        const dx = x[l.b] - x[l.a], dy = y[l.b] - y[l.a];
        const len = Math.hypot(dx, dy) || 1e-9;
        const ux = dx / len, uy = dy / len;
        l.target = l.muscle ? l.rest * (1 + ease * l.pull * Math.sin(beat + 2 * Math.PI * l.phase)) : l.rest;
        const rel = (vx[l.b] - vx[l.a]) * ux + (vy[l.b] - vy[l.a]) * uy;
        const f = STIFF * (len - l.target) + DAMP * rel;
        fx[l.a] += f * ux; fy[l.a] += f * uy;
        fx[l.b] -= f * ux; fy[l.b] -= f * uy;
    }
    for (let i = 0; i < n; i++) {
        vx[i] += fx[i] * DT; vy[i] += fy[i] * DT;
        const sp = Math.hypot(vx[i], vy[i]);
        if (sp > MAX_SPEED) { vx[i] *= MAX_SPEED / sp; vy[i] *= MAX_SPEED / sp; }
        x[i] += vx[i] * DT; y[i] += vy[i] * DT;
        if (y[i] < 0) {
            // The ground pushes back by exactly what was coming down, and
            // friction can take at most grip × that out of the slide.
            const push = vy[i] < 0 ? -vy[i] : 0;
            y[i] = 0; vy[i] = 0;
            const hold = w.grip[i] * (push + GRAVITY * DT) * 2.2;
            if (Math.abs(vx[i]) <= hold) vx[i] = 0; else vx[i] -= Math.sign(vx[i]) * hold;
        }
        if (!Number.isFinite(x[i] + y[i]) || y[i] > 40) w.broken = true;
    }
    w.t += DT;
}

// Run one creature for a race and say how far it got. A creature that
// blows up scores nothing, which is how evolution learns not to.
export function race(spec, genome, seconds = RACE_SECONDS) {
    const w = createWorld(spec, genome);
    const steps = Math.round(seconds / DT);
    for (let i = 0; i < steps && !w.broken; i++) step(w);
    return w.broken ? 0 : distance(w);
}

// ── Evolution ──
export function createPopulation(spec, seed = 1, size = 60) {
    const rand = rng(seed);
    return {
        spec, rand, size, gen: 0,
        genomes: Array.from({ length: size }, () => randomGenome(spec, rand)),
        history: [],               // { gen, best, mean, median } per generation raced
        ranked: null,              // last raced generation, best first: { genome, dist }
        record: 0,
    };
}

function gauss(rand) {
    return Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
}

export function mutate(genome, rand, rate = 0.22, size = 0.13) {
    const g = Float32Array.from(genome);
    let touched = false;
    for (let i = 0; i < g.length; i++) {
        if (rand() < rate) { g[i] = Math.min(1, Math.max(0, g[i] + gauss(rand) * size)); touched = true; }
    }
    if (!touched) { const i = Math.floor(rand() * g.length); g[i] = Math.min(1, Math.max(0, g[i] + gauss(rand) * size)); }
    return g;
}

export function cross(a, b, rand) {
    return Float32Array.from(a, (v, i) => rand() < 0.5 ? v : b[i]);
}

// Race everyone, rank them, and breed the next generation:
// the top tenth go through untouched, the rest are children of the top half.
export function evolve(pop) {
    const ranked = pop.genomes.map(genome => ({ genome, dist: race(pop.spec, genome) }))
        .sort((p, q) => q.dist - p.dist);
    const dists = ranked.map(r => r.dist);
    const stats = {
        gen: pop.gen,
        best: dists[0],
        mean: dists.reduce((s, d) => s + d, 0) / dists.length,
        median: dists[dists.length >> 1],
    };
    pop.history.push(stats);
    pop.ranked = ranked;
    pop.record = Math.max(pop.record, stats.best);

    const elite = Math.max(2, Math.round(pop.size * 0.1));
    const pool = ranked.slice(0, pop.size >> 1);
    const pick = () => {
        const a = pool[Math.floor(pop.rand() * pool.length)], b = pool[Math.floor(pop.rand() * pool.length)];
        return (a.dist >= b.dist ? a : b).genome;
    };
    const next = ranked.slice(0, elite).map(r => r.genome);
    while (next.length < pop.size) next.push(mutate(cross(pick(), pick(), pop.rand), pop.rand));
    pop.genomes = next;
    pop.gen++;
    return stats;
}

// ── Sharing a body by link ──
// Joints snap to a 5 cm grid, so two base-36 digits each; links are index pairs.
export function encode(spec) {
    const d = (v) => Math.max(0, Math.min(1295, Math.round(v * 20))).toString(36).padStart(2, '0');
    const nodes = spec.nodes.map(n => d(n[0]) + d(n[1])).join('');
    const links = spec.links.map(l => l[0].toString(36) + l[1].toString(36) + (l[2] ? 'm' : 'b')).join('');
    return nodes + '.' + links;
}
export function decode(str) {
    try {
        const [ns, ls] = String(str).split('.');
        if (!ns || !ls || ns.length % 4 || ls.length % 3 || /[^0-9a-z]/.test(ns + ls)) return null;
        const nodes = [], links = [];
        for (let i = 0; i < ns.length; i += 4) nodes.push([parseInt(ns.slice(i, i + 2), 36) / 20, parseInt(ns.slice(i + 2, i + 4), 36) / 20]);
        for (let i = 0; i < ls.length; i += 3) links.push([parseInt(ls[i], 36), parseInt(ls[i + 1], 36), ls[i + 2] === 'm' ? 1 : 0]);
        const spec = { nodes, links };
        return validate(spec).ok ? spec : null;
    } catch { return null; }
}
