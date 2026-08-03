(function (window) {
    'use strict';

    // Seeded RNG. Missions generate their queue from a seed so a mission plays
    // identically for everyone (and so a score is comparable, and a seed is
    // shareable in the URL). mulberry32 — small, fast, good enough.
    const CY = window.CY = window.CY || {};

    function create(seed) {
        let a = (seed >>> 0) || 1;
        const rng = {
            next: function () {
                a |= 0; a = (a + 0x6D2B79F5) | 0;
                let t = Math.imul(a ^ (a >>> 15), 1 | a);
                t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            },
            int: function (maxExclusive) {
                return Math.floor(rng.next() * maxExclusive);
            },
            pick: function (arr) {
                return arr[rng.int(arr.length)];
            },
            shuffle: function (arr) {
                const out = arr.slice();
                for (let i = out.length - 1; i > 0; i--) {
                    const j = rng.int(i + 1);
                    const t = out[i]; out[i] = out[j]; out[j] = t;
                }
                return out;
            }
        };
        return rng;
    }

    // Turn a mission id into a stable numeric seed, so mission ids can stay
    // human-readable strings.
    function hash(str) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    CY.rng = { create: create, hash: hash };

})(window);
