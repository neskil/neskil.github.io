/**
 * core/manifest.js — what arrives, in what order.
 *
 * Manifests are built from a seed, so a mission plays identically for everyone
 * and a score means something. A mission either lists its units explicitly or
 * describes a distribution for the generator to sample.
 */
(function (global) {
    'use strict';

    const Cargo3D = global.Cargo3D = global.Cargo3D || {};
    const C = Cargo3D.Constants;

    /** mulberry32 — small, fast, and identical across browsers. */
    function rng(seed) {
        let a = seed >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function seedFromString(str) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    /** Stable seed for a calendar day, for a future daily-run mode. */
    function seedFromDate(date) {
        const d = date || new Date();
        return seedFromString(d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate());
    }

    function pickWeighted(rand, weights) {
        let total = 0;
        const keys = Object.keys(weights);
        for (let i = 0; i < keys.length; i++) total += weights[keys[i]];

        let roll = rand() * total;
        for (let i = 0; i < keys.length; i++) {
            roll -= weights[keys[i]];
            if (roll <= 0) return keys[i];
        }
        return keys[keys.length - 1];
    }

    function shuffle(rand, arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return arr;
    }

    /** Turn a partial descriptor into a full unit record. */
    function makeUnit(spec, index, rand) {
        const type = C.CARGO_TYPES[spec.type] || C.CARGO_TYPES['20ft'];
        const traits = (spec.traits || []).slice();
        const load = spec.load !== undefined ? spec.load : 0.35 + rand() * 0.55;
        const carrier = spec.carrier || C.CARRIER_KEYS[Math.floor(rand() * C.CARRIER_KEYS.length)];

        let massT = type.tare + type.payload * load;
        if (traits.indexOf('heavy') !== -1) massT = type.tare + type.payload * 0.95;

        return {
            uid: 'u' + (index + 1),
            index: index,
            type: type.id,
            label: type.short + '-' + String(1000 + index * 7 % 9000),
            carrier: carrier,
            traits: traits,
            departure: spec.departure || 0,
            load: load,
            massT: Math.round(massT * 10) / 10
        };
    }

    /**
     * Build a mission's manifest.
     *
     * Explicit form:
     *   units: [{ type:'20ft', count:3, traits:['reefer'] }, { type:'40ft' }]
     * Generated form:
     *   generate: { count:14, weights:{'20ft':4,'40ft':3}, traits:{reefer:0.2},
     *               departures:[1,2,3], shuffle:true }
     *
     * @param {object} mission
     * @param {number} [seedOverride]
     * @returns {object[]}
     */
    function build(mission, seedOverride) {
        const seed = seedOverride !== undefined
            ? seedOverride
            : (mission.seed !== undefined ? mission.seed : seedFromString(mission.id || 'mission'));
        const rand = rng(seed);
        const specs = [];

        if (mission.units && mission.units.length) {
            mission.units.forEach(function (entry) {
                const count = entry.count || 1;
                for (let i = 0; i < count; i++) {
                    specs.push({
                        type: entry.type,
                        carrier: entry.carrier,
                        traits: entry.traits,
                        departure: entry.departure,
                        load: entry.load
                    });
                }
            });
        }

        const gen = mission.generate;
        if (gen) {
            const weights = gen.weights || { '20ft': 3, '40ft': 2, '10ft': 1 };
            const traitChances = gen.traits || {};
            const departures = gen.departures || null;

            for (let i = 0; i < (gen.count || 0); i++) {
                const traits = [];
                Object.keys(traitChances).forEach(function (trait) {
                    if (rand() < traitChances[trait]) traits.push(trait);
                });
                specs.push({
                    type: pickWeighted(rand, weights),
                    traits: traits,
                    departure: departures ? departures[Math.floor(rand() * departures.length)] : 0
                });
            }
        }

        if (mission.shuffle !== false && (!gen || gen.shuffle !== false)) {
            shuffle(rand, specs);
        }

        return specs.map(function (spec, i) { return makeUnit(spec, i, rand); });
    }

    /** Counts by type, for the mission briefing card. */
    function summarise(units) {
        const byType = {};
        const traits = {};
        units.forEach(function (u) {
            byType[u.type] = (byType[u.type] || 0) + 1;
            (u.traits || []).forEach(function (t) { traits[t] = (traits[t] || 0) + 1; });
        });
        return { total: units.length, byType: byType, traits: traits };
    }

    Cargo3D.Manifest = {
        rng: rng,
        seedFromString: seedFromString,
        seedFromDate: seedFromDate,
        shuffle: shuffle,
        build: build,
        summarise: summarise
    };
})(typeof window !== 'undefined' ? window : globalThis);
