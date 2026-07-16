// Deterministic PRNG for seeded/shareable worlds. Pure logic — used only
// by map.js's world generation (river shape, node placement), so the
// same seed reproduces the same map layout. Gameplay randomness (order
// timing/contents, customer-DC timers) stays on Math.random — replays
// of a seed can still play out differently turn to turn, only the map
// itself is reproducible.
window.SC = window.SC || {};

SC.rng = (function() {
    // xmur3 hashes an arbitrary seed string down to a 32-bit int;
    // mulberry32 turns that int into a fast, decent-quality float
    // stream. Both are small, well-known non-cryptographic PRNGs —
    // good enough for "same seed -> same map", not security.
    function xmur3(str) {
        let h = 1779033703 ^ str.length;
        for (let i = 0; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
        }
        return function() {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            return (h ^= h >>> 16) >>> 0;
        };
    }

    function mulberry32(a) {
        return function() {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // A short, URL-friendly seed when the player doesn't specify one.
    function randomSeed() {
        return Math.random().toString(36).slice(2, 10);
    }

    function create(seed) {
        const next = mulberry32(xmur3(String(seed))());
        return {
            next,                                    // () => [0, 1)
            range: (a, b) => a + next() * (b - a),    // [a, b)
            int: (a, b) => Math.floor(a + next() * (b - a + 1)) // inclusive ints
        };
    }

    return { create, randomSeed };
})();
