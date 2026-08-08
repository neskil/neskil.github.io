/**
 * core/contracts.js — the terminal's order book and economy.
 *
 * Ported from the pre-restructure `js/game.js` GameManager and split so the
 * rules live here as a pure state machine: no THREE, no DOM, no timers. The
 * caller ticks it with a delta and reports where cargo currently sits; this
 * decides what that is worth.
 *
 * Sandbox uses it as an optional layer — the campaign has its own scoring.
 */
(function (global) {
    'use strict';

    const Cargo3D = global.Cargo3D = global.Cargo3D || {};

    const START_CAPITAL = 15000;
    const CONTRACT_SECONDS = 150;
    const EXPIRY_PENALTY = 1500;

    /**
     * Delivery zones are world-space rectangles on the apron, matching the
     * terminal's actual geography: the rail transfer bay to the west, the depot
     * in the middle, the truck deck to the east.
     */
    const TEMPLATES = [
        {
            type: 'unload_train',
            title: 'Unload Train Cargo to Transfer Bay',
            desc: 'Lift a container off a freight flatcar and set it down in Yard Bay Alpha, west of the depot.',
            payout: 4800,
            zone: { xMin: -28, xMax: -14, zMin: -20, zMax: 20 }
        },
        {
            type: 'yard_stack',
            title: 'Stack Export Cargo in Central Depot',
            desc: 'Place any intermodal unit inside the Central Depot Zone.',
            payout: 3500,
            zone: { xMin: -8, xMax: 8, zMin: -10, zMax: 10 }
        },
        {
            type: 'express_delivery',
            title: 'Express Freight to the East Platform',
            desc: 'Move a container across to the Eastern Semi-Truck Delivery Deck.',
            payout: 6200,
            zone: { xMin: 15, xMax: 32, zMin: -10, zMax: 10 }
        }
    ];

    const UPGRADES = {
        fastWinch:    { id: 'fastWinch',    label: 'Fast Winch',      cost: 4000, note: 'Gantry travel and hoist 60% quicker.' },
        extendedSnap: { id: 'extendedSnap', label: 'Extended Reach',  cost: 3000, note: 'Wider twistlock capture radius.' },
        autoDispatch: { id: 'autoDispatch', label: 'Auto Dispatch',   cost: 6500, note: 'Every order arrives with 30s more on the clock.' }
    };

    function createState(overrides) {
        return Object.assign({
            money: START_CAPITAL,
            delivered: 0,
            rating: 100,
            upgrades: { fastWinch: false, extendedSnap: false, autoDispatch: false },
            active: null,
            serial: 0
        }, overrides || {});
    }

    /** Seconds a new order gets, before the clock starts. */
    function contractDuration(state) {
        return CONTRACT_SECONDS + (state.upgrades.autoDispatch ? 30 : 0);
    }

    /**
     * Issue the next order. `pick` is an injectable 0..1 source so tests and
     * seeded runs are reproducible.
     */
    function generate(state, pick) {
        const roll = typeof pick === 'function' ? pick() : Math.random();
        const template = TEMPLATES[Math.min(TEMPLATES.length - 1, Math.floor(roll * TEMPLATES.length))];

        state.serial++;
        state.active = {
            id: 'ORD-' + (1000 + state.serial * 7 % 9000),
            type: template.type,
            title: template.title,
            desc: template.desc,
            payout: template.payout,
            zone: template.zone,
            duration: contractDuration(state),
            timeRemaining: contractDuration(state)
        };
        return state.active;
    }

    /** Is a world-space point inside the active order's delivery zone? */
    function inZone(x, z, contract) {
        if (!contract) return false;
        const zone = contract.zone;
        return x >= zone.xMin && x <= zone.xMax && z >= zone.zMin && z <= zone.zMax;
    }

    /**
     * Advance the clock.
     * @returns {{type:'expired', penalty:number}|null}
     */
    function tick(state, deltaSeconds, pick) {
        if (!state.active) return null;

        state.active.timeRemaining = Math.max(0, state.active.timeRemaining - deltaSeconds);
        if (state.active.timeRemaining > 0) return null;

        state.money = Math.max(0, state.money - EXPIRY_PENALTY);
        state.rating = Math.max(50, state.rating - 5);
        generate(state, pick);
        return { type: 'expired', penalty: EXPIRY_PENALTY };
    }

    /**
     * Award the active order if the given point satisfies it.
     * @returns {{type:'completed', id:string, payout:number}|null}
     */
    function tryComplete(state, x, z, pick) {
        if (!state.active || !inZone(x, z, state.active)) return null;

        const done = state.active;
        state.money += done.payout;
        state.delivered++;
        state.rating = Math.min(100, state.rating + 2);
        generate(state, pick);

        return { type: 'completed', id: done.id, payout: done.payout };
    }

    /** @returns {{ok:boolean, reason:string|null}} */
    function buyUpgrade(state, key) {
        const upgrade = UPGRADES[key];
        if (!upgrade) return { ok: false, reason: 'No such upgrade.' };
        if (state.upgrades[key]) return { ok: false, reason: 'Already owned.' };
        if (state.money < upgrade.cost) return { ok: false, reason: 'Not enough capital.' };

        state.money -= upgrade.cost;
        state.upgrades[key] = true;
        return { ok: true, reason: null };
    }

    /** Letter grade for the reputation number, for the HUD. */
    function ratingLabel(rating) {
        if (rating >= 98) return 'A+';
        if (rating >= 90) return 'A';
        if (rating >= 80) return 'B';
        if (rating >= 70) return 'C';
        if (rating >= 60) return 'D';
        return 'E';
    }

    Cargo3D.Contracts = {
        START_CAPITAL: START_CAPITAL,
        CONTRACT_SECONDS: CONTRACT_SECONDS,
        EXPIRY_PENALTY: EXPIRY_PENALTY,
        TEMPLATES: TEMPLATES,
        UPGRADES: UPGRADES,
        createState: createState,
        contractDuration: contractDuration,
        generate: generate,
        inZone: inZone,
        tick: tick,
        tryComplete: tryComplete,
        buyUpgrade: buyUpgrade,
        ratingLabel: ratingLabel
    };
})(typeof window !== 'undefined' ? window : globalThis);
