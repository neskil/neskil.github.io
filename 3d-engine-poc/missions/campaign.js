/**
 * missions/campaign.js — the line missions, in order.
 *
 * Pure data. See missions/missionSchema.js for the shape and the validator that
 * tests.html runs over every entry here.
 *
 * Design notes for anyone adding a mission:
 *  - Par is a perfect zero-waste pack, computed from the manifest. To force
 *    stacking, make the manifest need more cells than the bay floor has; to
 *    make a clean pack reachable, let the total cell count factor into a box
 *    that fits the bay (e.g. 30 cells in a 5×4 bay → a tidy 5×3×2).
 *  - Introduce one rule at a time and say so in `teaches`.
 *  - Loosen `medals` when a rule makes a perfect tiling genuinely fiddly.
 */
(function (global) {
    'use strict';

    const Cargo3D = global.Cargo3D = global.Cargo3D || {};

    const CAMPAIGN = [
        {
            id: 'm01',
            name: 'First Shift',
            tagline: 'Learn the slot grid.',
            teaches: 'Click to drop a unit. The score is the box around your stack — keep it tight.',
            brief: 'A quiet Monday. Eight units off the feeder, one small bay, no complications. ' +
                   'Fill the floor and you have already matched par.',
            bay: { cols: 4, rows: 3, tiers: 3 },
            rules: ['support:1'],
            units: [
                { type: '20ft', count: 4 },
                { type: '10ft', count: 4 }
            ],
            seed: 1001,
            weather: 'day'
        },
        {
            id: 'm02',
            name: 'Long Boxes',
            tagline: 'Forty-footers change the geometry.',
            teaches: 'Press R to rotate. A 40ft eats four slots in a line — place it before the gaps close.',
            brief: 'Three high-cubes and three standards. The bay is exactly wide enough for a 40ft ' +
                   'and a 20ft side by side, if you see it.',
            bay: { cols: 6, rows: 3, tiers: 3 },
            rules: ['support:1'],
            units: [
                { type: '40ft', count: 3 },
                { type: '20ft', count: 3 }
            ],
            seed: 1002,
            weather: 'day'
        },
        {
            id: 'm03',
            name: 'Reach Limit',
            tagline: 'The crane only goes so high.',
            teaches: 'Crane reach caps the stack. More cargo than floor means you must use every tier.',
            brief: 'Thirty slots of cargo, twenty slots of floor, and a crane that will not lift past ' +
                   'the second tier. Two clean tiers over three rows is par.',
            bay: { cols: 5, rows: 4, tiers: 2 },
            rules: ['support:1', 'maxTier:2'],
            units: [
                { type: '40ft', count: 3 },
                { type: '20ft', count: 6 },
                { type: '10ft', count: 6 }
            ],
            seed: 1003,
            weather: 'dusk'
        },
        {
            id: 'm04',
            name: 'Out of Gauge',
            tagline: 'Breakbulk does not queue politely.',
            teaches: 'Crates are 2×2 — the only square footprint. Rotation will not help you.',
            brief: 'Four machinery crates off the heavy-lift berth, plus the usual boxes. ' +
                   'Crates want corners; leave the awkward strips for the 10ft units.',
            bay: { cols: 5, rows: 4, tiers: 3 },
            rules: ['support:1'],
            units: [
                { type: 'crate', count: 4 },
                { type: '20ft', count: 8 },
                { type: '10ft', count: 8 }
            ],
            seed: 1004,
            medals: { gold: 1.12, silver: 1.32, bronze: 1.65 },
            weather: 'day'
        },
        {
            id: 'm05',
            name: 'Top Heavy',
            tagline: 'Mass goes at the bottom.',
            teaches: 'A unit may not rest on anything lighter than itself. Plan the stack downward.',
            brief: 'Loaded high-cubes at thirty tonnes, half-empty tens at five. Get the order wrong ' +
                   'and the heavy boxes have nowhere left to go but the floor.',
            bay: { cols: 5, rows: 4, tiers: 4 },
            rules: ['support:1', 'heavyBelow'],
            units: [
                { type: '40ft', count: 4, load: 0.90 },
                { type: '20ft', count: 8, load: 0.50 },
                { type: '10ft', count: 8, load: 0.40 }
            ],
            seed: 1005,
            medals: { gold: 1.12, silver: 1.32, bronze: 1.65 },
            weather: 'rain'
        },
        {
            id: 'm06',
            name: 'No Top Load',
            tagline: 'Tanks carry liquid, not containers.',
            teaches: 'Nothing may be stacked on a tank container. Every tank you place costs you a roof.',
            brief: 'Four tanks in the arrival order. Each one seals the column it lands in, so spend ' +
                   'them on the top tier and not a moment earlier.',
            bay: { cols: 5, rows: 4, tiers: 4 },
            rules: ['support:1', 'noTopLoad'],
            units: [
                { type: 'tank', count: 4 },
                { type: '40ft', count: 2 },
                { type: '20ft', count: 8 },
                { type: '10ft', count: 8 }
            ],
            seed: 1006,
            medals: { gold: 1.12, silver: 1.34, bronze: 1.70 },
            weather: 'fog'
        },
        {
            id: 'm07',
            name: 'Cold Chain',
            tagline: 'Reefers need power.',
            teaches: 'A reefer must touch the bay edge to reach a power point. Interior slots are off limits.',
            brief: 'Three refrigerated high-cubes and the rest dry. The outer rows are the only place ' +
                   'the reefers can live — so decide early what earns an edge slot.',
            bay: { cols: 6, rows: 4, tiers: 4 },
            rules: ['support:1', 'reeferEdge'],
            units: [
                { type: '40ft', count: 3, traits: ['reefer'] },
                { type: '40ft', count: 3 },
                { type: '20ft', count: 8 },
                { type: '10ft', count: 8 }
            ],
            seed: 1007,
            medals: { gold: 1.12, silver: 1.34, bronze: 1.70 },
            weather: 'night'
        },
        {
            id: 'm08',
            name: 'Dangerous Goods',
            tagline: 'Keep them apart.',
            teaches: 'Two hazmat units may not share a face on the same tier — but they may stack.',
            brief: 'Four flagged boxes in a bay you need to pack solid. The separation rule only looks ' +
                   'sideways; the vertical is yours to exploit.',
            bay: { cols: 6, rows: 4, tiers: 4 },
            rules: ['support:1', 'hazmatGap'],
            units: [
                { type: '40ft', count: 6 },
                { type: '20ft', count: 4, traits: ['hazmat'] },
                { type: '20ft', count: 4 },
                { type: '10ft', count: 8 }
            ],
            seed: 1008,
            medals: { gold: 1.15, silver: 1.35, bronze: 1.75 },
            weather: 'dusk'
        },
        {
            id: 'm09',
            name: 'Monday Sailing',
            tagline: 'Nothing leaves from under a pile.',
            teaches: 'Never stack over cargo that leaves earlier. Late departures go at the bottom.',
            brief: 'Three sailings, three days, one bay. The Wednesday high-cubes are your foundation; ' +
                   'the Monday tens have to stay diggable.',
            bay: { cols: 6, rows: 4, tiers: 4 },
            rules: ['support:1', 'departureOrder'],
            units: [
                { type: '40ft', count: 6, departure: 3 },
                { type: '20ft', count: 8, departure: 2 },
                { type: '10ft', count: 8, departure: 1 }
            ],
            seed: 1009,
            medals: { gold: 1.12, silver: 1.34, bronze: 1.70 },
            weather: 'day'
        },
        {
            id: 'm10',
            name: 'Mixed Traffic',
            tagline: 'Everything at once, and more of it.',
            teaches: 'Reefer power, hazmat separation and departure order, on a bay you have to fill twice over.',
            brief: 'A full shift. Twenty-four units, three regulations, and a seven-wide bay that packs ' +
                   'perfectly into two tiers if you keep the rows honest.',
            bay: { cols: 7, rows: 4, tiers: 4 },
            rules: ['support:1', 'reeferEdge', 'hazmatGap', 'departureOrder'],
            units: [
                { type: '40ft', count: 4, departure: 3 },
                { type: '40ft', count: 4, departure: 3, traits: ['reefer'] },
                { type: '20ft', count: 4, departure: 2, traits: ['hazmat'] },
                { type: '20ft', count: 4, departure: 2 },
                { type: '10ft', count: 8, departure: 1 }
            ],
            seed: 1010,
            medals: { gold: 1.15, silver: 1.38, bronze: 1.80 },
            weather: 'rain'
        },
        {
            id: 'm11',
            name: 'Tight Bay',
            tagline: 'Four wide. Go up.',
            teaches: 'A narrow bay removes rotation as an option. Height is the only free dimension left.',
            brief: 'The overflow bay: four slots wide, three deep, and cleared for five tiers. ' +
                   'A 40ft spans the whole width, so every one you place commits a full row.',
            bay: { cols: 4, rows: 3, tiers: 5 },
            rules: ['support:1', 'heavyBelow'],
            units: [
                { type: '40ft', count: 6, load: 0.85 },
                { type: '20ft', count: 8, load: 0.50 },
                { type: '10ft', count: 8, load: 0.35 }
            ],
            seed: 1011,
            medals: { gold: 1.12, silver: 1.34, bronze: 1.70 },
            weather: 'night'
        },
        {
            id: 'm12',
            name: 'Yard Master',
            tagline: 'The whole rulebook.',
            teaches: 'Every regulation, thirty units, and three tiers of par. This is the exam.',
            brief: 'Peak season. Crates, tanks, reefers, dangerous goods and three sailings, in a bay ' +
                   'that is exactly three perfect tiers deep. Nobody gets gold on the first run.',
            bay: { cols: 6, rows: 4, tiers: 5 },
            rules: ['support:1', 'noTopLoad', 'heavyBelow', 'reeferEdge', 'hazmatGap', 'departureOrder'],
            units: [
                { type: '40ft', count: 5, departure: 3, load: 0.85 },
                { type: '40ft', count: 3, departure: 3, load: 0.85, traits: ['reefer'] },
                { type: 'crate', count: 2, departure: 3, load: 0.80 },
                { type: '20ft', count: 4, departure: 2, load: 0.50, traits: ['hazmat'] },
                { type: '20ft', count: 6, departure: 2, load: 0.50 },
                { type: 'tank', count: 2, departure: 1, load: 0.30 },
                { type: '10ft', count: 8, departure: 1, load: 0.30 }
            ],
            seed: 1012,
            medals: { gold: 1.18, silver: 1.42, bronze: 1.85 },
            weather: 'fog'
        }
    ];

    function byId(id) {
        for (let i = 0; i < CAMPAIGN.length; i++) {
            if (CAMPAIGN[i].id === id) return CAMPAIGN[i];
        }
        return null;
    }

    function nextAfter(id) {
        const at = CAMPAIGN.findIndex(function (m) { return m.id === id; });
        return at > -1 && at + 1 < CAMPAIGN.length ? CAMPAIGN[at + 1] : null;
    }

    Cargo3D.Campaign = {
        MISSIONS: CAMPAIGN,
        byId: byId,
        nextAfter: nextAfter
    };
})(typeof window !== 'undefined' ? window : globalThis);
