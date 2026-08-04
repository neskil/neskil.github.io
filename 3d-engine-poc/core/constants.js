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
        hazmat:  { id: 'hazmat',  label: 'Hazmat',  badge: '☣', color: 0xf59e0b, note: 'Must not touch other hazmat' },
        fragile: { id: 'fragile', label: 'Fragile', badge: '✦', color: 0xa78bfa, note: 'Take care on top tiers' },
        heavy:   { id: 'heavy',   label: 'Heavy',   badge: '⬤', color: 0xef4444, note: 'Wants to be low in the stack' }
    };

    /** Departure day labels, indexed by a unit's `departure` (1-based). */
    const DEPARTURE_DAYS = ['—', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    /**
     * Footprint of a type at a given rotation, as a list of [dx, dz] cell
     * offsets from the piece origin. Kept as an explicit mask (rather than a
     * width/height pair) so non-rectangular cargo can be added later without
     * touching grid.js or placement.js.
     *
     * @param {string} typeId
     * @param {number} rot 0 or 1 (90° steps; 180°/270° are identical footprints)
     * @returns {Array<[number, number]>}
     */
    function footprint(typeId, rot) {
        const type = CARGO_TYPES[typeId];
        if (!type) return [];

        const swapped = ((rot | 0) % 2) !== 0;
        const spanX = swapped ? type.cells[1] : type.cells[0];
        const spanZ = swapped ? type.cells[0] : type.cells[1];

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
        return type ? type.cells[0] * type.cells[1] : 0;
    }

    Cargo3D.Constants = {
        GRID: GRID,
        CARRIERS: CARRIERS,
        CARRIER_KEYS: CARRIER_KEYS,
        CARGO_TYPES: CARGO_TYPES,
        GRID_TYPE_KEYS: GRID_TYPE_KEYS,
        TRAITS: TRAITS,
        DEPARTURE_DAYS: DEPARTURE_DAYS,
        footprint: footprint,
        span: span,
        cellCount: cellCount
    };
})(typeof window !== 'undefined' ? window : globalThis);
