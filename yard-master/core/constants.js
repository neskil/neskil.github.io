/**
 * core/constants.js — the yard's units of measure and cargo catalogue.
 *
 * No THREE here (and nowhere else in core/). Everything below is plain data so
 * it can be loaded by tests.html without a WebGL context.
 */
(function (global) {
    'use strict';

    const Cargo3D = global.Cargo3D = global.Cargo3D || {};

    /**
     * Grid metrics. The cell is square and sized so ISO container lengths land
     * on whole cells: 20ft (6.06 m) = 2 cells, 40ft (12.19 m) = 4 cells. The
     * slack around the 2.44 m width reads as the aisle a real yard has.
     */
    const GRID = {
        CELL_X: 3.05,
        CELL_Z: 3.05,
        TIER_H: 2.90
    };

    GRID.CELL_AREA = GRID.CELL_X * GRID.CELL_Z;
    GRID.CELL_VOLUME = GRID.CELL_AREA * GRID.TIER_H;

    /** Carrier liveries. `color` is a hex int so render/ can hand it to THREE. */
    const CARRIERS = {
        maersk:    { name: 'Maersk Line',    color: 0x00a0b0, metalness: 0.30, roughness: 0.40 },
        hapag:     { name: 'Hapag-Lloyd',    color: 0xe65c00, metalness: 0.20, roughness: 0.50 },
        evergreen: { name: 'Evergreen Line', color: 0x007a4d, metalness: 0.30, roughness: 0.40 },
        msc:       { name: 'MSC',            color: 0xda9f1a, metalness: 0.20, roughness: 0.50 },
        cosco:     { name: 'COSCO',          color: 0xc2410c, metalness: 0.25, roughness: 0.45 },
        one:       { name: 'ONE',            color: 0xdb2777, metalness: 0.25, roughness: 0.45 },
        wood:      { name: 'Pine Wood',      color: 0xb08d57, metalness: 0.05, roughness: 0.90 },
        steel:     { name: 'Unbranded',      color: 0x94a3b8, metalness: 0.60, roughness: 0.35 }
    };

    const CARRIER_KEYS = ['maersk', 'hapag', 'evergreen', 'msc', 'cosco', 'one'];

    /**
     * Terminals. A mission names one and the whole yard is repainted in it —
     * ground, slab, slot lines, hazard stripe and the tier gauge.
     *
     * They are ordered, and the campaign walks them: you start on a short
     * feeder quay with faded paint and finish on an automated terminal where
     * everything is new. The colours are the only thing that changes — a bay is
     * a bay — but four hours of missions on one grey slab reads as one long
     * mission, and this is the cheapest way to say that time has passed.
     *
     * Every value is a hex int, so `render/` can hand them straight to THREE and
     * `core/` still never sees it.
     */
    const TERMINALS = {
        feeder: {
            id: 'feeder',
            name: 'Feeder Berth 7',
            blurb: 'A short quay, a tired slab, and paint that was last done a decade ago.',
            ground: 0x232a33, apron: 0x2b333d, slab: 0x3b4450,
            lines: 0x8fc4dd, hazard: 0xe0b429, post: 0x3d4757, band: 0x38bdf8
        },
        river: {
            id: 'river',
            name: 'Riverside Intermodal',
            blurb: 'Rail on one side, road on the other, and never enough room between them.',
            ground: 0x241f1c, apron: 0x2e2724, slab: 0x413730,
            lines: 0xf0b366, hazard: 0xf97316, post: 0x4a3f33, band: 0xfb923c
        },
        deepwater: {
            id: 'deepwater',
            name: 'Deepwater Terminal',
            blurb: 'Post-panamax berths and a stacking plan that assumes you never make a mistake.',
            ground: 0x121a24, apron: 0x18222e, slab: 0x223140,
            lines: 0x5eead4, hazard: 0xfacc15, post: 0x2f3b4a, band: 0x22d3ee
        },
        automated: {
            id: 'automated',
            name: 'Terminal 9 — Automated',
            blurb: 'Nobody walks the slab here. The paint is new because nothing scuffs it.',
            ground: 0x2a2c3a, apron: 0x363949, slab: 0x3c4053,
            lines: 0xe9d5ff, hazard: 0xf5f3ff, post: 0x5b6779, band: 0xa855f7
        }
    };

    /** Terminals in campaign order — the arc the missions walk through. */
    const TERMINAL_KEYS = ['feeder', 'river', 'deepwater', 'automated'];

    /**
     * The atmospheres a mission may name.
     *
     * The vocabulary lives here so `missions/missionSchema.js` can reject a
     * typo without `core/` knowing what a light is — the presets themselves are
     * in `render/weather.js`, which checks itself against this list on load.
     * A mission shipped for a release naming `clear` before there was a `clear`,
     * and it silently rendered as a sunny day. Once was enough.
     */
    const WEATHER_KEYS = ['dawn', 'day', 'clear', 'dusk', 'rain', 'snow', 'fog', 'night'];

    /**
     * Cargo catalogue. `cells` is the footprint in grid cells at rotation 0
     * ([alongX, alongZ]); `length`/`width`/`height` are the true metres used for
     * the mesh and the real-world stats. Every unit occupies exactly one tier.
     *
     * `noTopLoad` marks cargo that cannot carry a stack (tanks, open tops).
     */
    const CARGO_TYPES = {
        '10ft': {
            id: '10ft', label: '10ft Box', short: '10',
            cells: [1, 1],
            length: 2.99, width: 2.44, height: 2.59,
            teu: 0.5, tare: 1.3, payload: 10.2, volume: 15.9,
            gridPiece: true
        },
        '20ft': {
            id: '20ft', label: '20ft Standard', short: '20',
            cells: [2, 1],
            length: 6.06, width: 2.44, height: 2.59,
            teu: 1, tare: 2.2, payload: 28.2, volume: 33.2,
            gridPiece: true
        },
        '40ft': {
            id: '40ft', label: '40ft High Cube', short: '40',
            cells: [4, 1],
            length: 12.19, width: 2.44, height: 2.89,
            teu: 2, tare: 3.8, payload: 30.4, volume: 76.4,
            gridPiece: true
        },
        'crate': {
            id: 'crate', label: 'Breakbulk Crate', short: 'OOG',
            cells: [2, 2],
            length: 5.80, width: 5.20, height: 2.60,
            teu: 2, tare: 1.6, payload: 24.0, volume: 78.4,
            gridPiece: true
        },
        'tank': {
            id: 'tank', label: 'Tank Container', short: 'TNK',
            cells: [2, 1],
            length: 6.06, width: 2.44, height: 2.59,
            teu: 1, tare: 3.6, payload: 26.0, volume: 26.0,
            noTopLoad: true,
            gridPiece: true
        },
        'flatrack': {
            id: 'flatrack', label: '20ft Flat Rack', short: 'FLT',
            cells: [2, 1],
            length: 6.06, width: 2.44, height: 2.59,
            teu: 1, tare: 2.7, payload: 31.0, volume: 30.0,
            gridPiece: true
        },
        'lblock': {
            id: 'lblock', label: 'L-Corner Machinery', short: 'LCB',
            cells: [2, 2],
            mask: [[0, 0], [1, 0], [0, 1]],
            length: 6.06, width: 6.06, height: 2.59,
            teu: 1.5, tare: 3.2, payload: 22.0, volume: 45.0,
            gridPiece: true
        },
        'tblock': {
            id: 'tblock', label: 'T-Beam Module', short: 'TBM',
            cells: [3, 2],
            mask: [[0, 0], [1, 0], [2, 0], [1, 1]],
            length: 9.15, width: 6.06, height: 2.59,
            teu: 2, tare: 4.1, payload: 28.0, volume: 54.0,
            gridPiece: true
        },
        'pallet': {
            id: 'pallet', label: 'Wooden Euro-Pallet', short: 'PAL',
            cells: [1, 1],
            length: 1.20, width: 0.80, height: 1.40,
            teu: 0.1, tare: 0.02, payload: 1.5, volume: 1.34,
            gridPiece: false
        }
    };

    /** Types the campaign can put in a manifest, in catalogue order. */
    const GRID_TYPE_KEYS = Object.keys(CARGO_TYPES).filter(function (k) {
        return CARGO_TYPES[k].gridPiece;
    });

    /** Cargo traits. Rules key off these; the HUD renders the badge. */
    const TRAITS = {
        reefer:  { id: 'reefer',  label: 'Reefer',  badge: '❄', color: 0x38bdf8, note: 'Needs a power point on the bay edge' },
        hazmat:  { id: 'hazmat',  label: 'Hazmat',  badge: '☣', color: 0xf59e0b, note: 'May not touch another hazmat unit on the same tier' },
        heavy:   { id: 'heavy',   label: 'Heavy',   badge: '⬤', color: 0xef4444, note: 'Wants to be low in the stack' }
    };

    /** Departure day labels, indexed by a unit's `departure` (1-based). */
    const DEPARTURE_DAYS = ['—', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    /**
     * Footprint of a type at a given rotation, as a list of [dx, dz] cell
     * offsets from the piece origin. Kept as an explicit mask so non-rectangular
     * cargo works natively with grid.js and placement.js.
     *
     * A rotated mask is a real quarter turn — `[dx, dz] → [dz, cells[0]-1-dx]`,
     * not a transpose. The two agree for anything symmetric about the diagonal
     * (every rectangle, and the T), and disagree for the L: a transpose mirrors
     * it, so the grid would reserve the notch on the opposite corner from the
     * one the mesh draws. render/containers.js turns the piece a quarter turn,
     * so this has to as well.
     *
     * @param {string} typeId
     * @param {number} rot 0 or 1 (90° steps)
     * @returns {Array<[number, number]>}
     */
    function footprint(typeId, rot) {
        const type = CARGO_TYPES[typeId];
        if (!type) return [];

        const isRot = ((rot | 0) % 2) !== 0;

        if (type.mask) {
            return type.mask.map(function (pt) {
                return isRot ? [pt[1], type.cells[0] - 1 - pt[0]] : [pt[0], pt[1]];
            });
        }

        const spanX = isRot ? type.cells[1] : type.cells[0];
        const spanZ = isRot ? type.cells[0] : type.cells[1];

        const cells = [];
        for (let dx = 0; dx < spanX; dx++) {
            for (let dz = 0; dz < spanZ; dz++) {
                cells.push([dx, dz]);
            }
        }
        return cells;
    }

    /** Cell span of a type at a rotation, as [spanX, spanZ]. */
    function span(typeId, rot) {
        const type = CARGO_TYPES[typeId];
        if (!type) return [0, 0];
        const swapped = ((rot | 0) % 2) !== 0;
        return swapped ? [type.cells[1], type.cells[0]] : [type.cells[0], type.cells[1]];
    }

    /** Number of cells a type occupies (rotation-independent). */
    function cellCount(typeId) {
        const type = CARGO_TYPES[typeId];
        if (!type) return 0;
        return type.mask ? type.mask.length : (type.cells[0] * type.cells[1]);
    }

    /** A terminal palette by key, falling back to the first one. */
    function terminal(key) {
        return TERMINALS[key] || TERMINALS[TERMINAL_KEYS[0]];
    }

    Cargo3D.Constants = {
        GRID: GRID,
        CARRIERS: CARRIERS,
        CARRIER_KEYS: CARRIER_KEYS,
        TERMINALS: TERMINALS,
        TERMINAL_KEYS: TERMINAL_KEYS,
        WEATHER_KEYS: WEATHER_KEYS,
        terminal: terminal,
        CARGO_TYPES: CARGO_TYPES,
        GRID_TYPE_KEYS: GRID_TYPE_KEYS,
        TRAITS: TRAITS,
        DEPARTURE_DAYS: DEPARTURE_DAYS,
        footprint: footprint,
        span: span,
        cellCount: cellCount
    };
})(typeof window !== 'undefined' ? window : globalThis);
