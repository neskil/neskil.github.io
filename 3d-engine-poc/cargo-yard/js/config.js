(function (window) {
    'use strict';

    // Cargo Yard — every tunable number and every piece definition lives here.
    // Pure data + pure math: no THREE, no DOM. See 3d-engine-poc/CLAUDE.md.
    const CY = window.CY = window.CY || {};

    CY.VERSION = window.CY_VERSION || '0.0.0';

    // ── The yard grid ───────────────────────────────────────────────────
    // The whole game is played on an integer voxel lattice. One cell is half
    // a 20ft container: a 20ft is 2 cells long, a 40ft is 4. Cell height is
    // one high-cube tier, so a standard and a high cube both cost one tier —
    // which is exactly how a real yard is planned.
    CY.CELL = { x: 3.05, y: 2.90, z: 2.60 };
    CY.CELL.volume = CY.CELL.x * CY.CELL.y * CY.CELL.z; // 23.0 m³

    // Default yard footprint in cells (x = along the quay, z = across, y = tiers).
    CY.YARD = { w: 12, d: 8, h: 5 };

    // Rules a mission may override. Hard rules block a placement outright;
    // soft rules cost volume at the final audit (see scoring.js).
    CY.RULES = {
        maxTier: 5,        // hard: nothing may reach above this tier
        minSupport: 0.5,   // hard: fraction of a piece's underside that must be carried
        preview: 3,        // how many upcoming pieces the queue shows
        allowUndo: true
    };

    // Soft-rule penalties, in m³ added to the score. One 40ft is 76 m³, so a
    // penalty is deliberately painful but not automatically fatal — burying a
    // priority box to save a whole tier can still be the right call.
    CY.PENALTY = {
        buriedPriority: 60,
        noPlugAccess: 45,
        abandonedPiece: 120   // a queue piece with nowhere legal to go
    };

    // ── Carrier liveries ────────────────────────────────────────────────
    CY.CARRIERS = {
        maersk:    { name: 'Maersk Line',    color: 0x00a0b0, metalness: 0.30, roughness: 0.40 },
        hapag:     { name: 'Hapag-Lloyd',    color: 0xe65c00, metalness: 0.20, roughness: 0.50 },
        evergreen: { name: 'Evergreen Line', color: 0x007a4d, metalness: 0.30, roughness: 0.40 },
        msc:       { name: 'MSC Reefer',     color: 0xda9f1a, metalness: 0.20, roughness: 0.50 },
        tank:      { name: 'Tank Frame',     color: 0x94a3b8, metalness: 0.80, roughness: 0.25 },
        wood:      { name: 'Timber Crate',   color: 0xb08d57, metalness: 0.05, roughness: 0.90 },
        steel:     { name: 'Steel Crate',    color: 0x64748b, metalness: 0.60, roughness: 0.40 }
    };

    // ── Pieces ──────────────────────────────────────────────────────────
    // A piece is a polycube: a list of [x, y, z] cell offsets in local space,
    // normalised so the minimum corner sits at the origin. Containers are the
    // boring I-pieces; crate bundles are where the Tetris comes from.
    //
    //   kind      'container' renders as one long corrugated box sized from its
    //             real-world dimensions; 'crate' renders one timber box per cell.
    //   volume    real cargo volume in m³ (what the yard is actually earning).
    //   mass      laden tonnes, for the HUD and the stress heatmap.
    //   noTop     nothing may rest on this piece (tanks, open-top frames).
    //   power     needs a reefer plug: at the final audit at least one cell must
    //             still face open air sideways.
    function line(n) {
        const cells = [];
        for (let i = 0; i < n; i++) cells.push([i, 0, 0]);
        return cells;
    }

    CY.PIECES = {
        // Intermodal boxes ------------------------------------------------
        c20: {
            label: '20ft Standard', short: '20ft', kind: 'container', carrier: 'maersk',
            cells: line(2), teu: 1, volume: 33.2, mass: 24.0, real: [6.06, 2.59, 2.44]
        },
        c40: {
            label: '40ft High Cube', short: '40ft', kind: 'container', carrier: 'hapag',
            cells: line(4), teu: 2, volume: 76.4, mass: 30.4, real: [12.19, 2.89, 2.44]
        },
        c45: {
            label: '45ft High Cube', short: '45ft', kind: 'container', carrier: 'evergreen',
            cells: line(5), teu: 2.25, volume: 86.1, mass: 32.5, real: [13.72, 2.89, 2.44]
        },
        r20: {
            label: '20ft Reefer', short: 'Reefer', kind: 'container', carrier: 'msc',
            cells: line(2), teu: 1, volume: 28.3, mass: 27.0, real: [6.06, 2.59, 2.44],
            power: true
        },
        t20: {
            label: '20ft Tank', short: 'Tank', kind: 'container', carrier: 'tank',
            cells: line(2), teu: 1, volume: 26.0, mass: 34.0, real: [6.06, 2.59, 2.44],
            noTop: true
        },

        // Crate bundles — the polycubes -------------------------------------
        k1: {
            label: 'Single Crate', short: 'Crate', kind: 'crate', carrier: 'wood',
            cells: [[0, 0, 0]], teu: 0.25, volume: 14.0, mass: 4.0
        },
        k2: {
            label: 'Crate Pair', short: 'Pair', kind: 'crate', carrier: 'wood',
            cells: line(2), teu: 0.5, volume: 28.0, mass: 8.0
        },
        kO: {
            label: 'Crate Block', short: 'Block', kind: 'crate', carrier: 'wood',
            cells: [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1]], teu: 1, volume: 56.0, mass: 16.0
        },
        kL: {
            label: 'L-Bundle', short: 'L', kind: 'crate', carrier: 'steel',
            cells: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [2, 0, 1]], teu: 1, volume: 56.0, mass: 18.0
        },
        kJ: {
            label: 'J-Bundle', short: 'J', kind: 'crate', carrier: 'steel',
            cells: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 0, 1]], teu: 1, volume: 56.0, mass: 18.0
        },
        kS: {
            label: 'S-Bundle', short: 'S', kind: 'crate', carrier: 'steel',
            cells: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [2, 0, 1]], teu: 1, volume: 56.0, mass: 18.0
        },
        kT: {
            label: 'T-Bundle', short: 'T', kind: 'crate', carrier: 'wood',
            cells: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [1, 0, 1]], teu: 1, volume: 56.0, mass: 17.0
        },
        kTower: {
            label: 'Crate Tower', short: 'Tower', kind: 'crate', carrier: 'wood',
            cells: [[0, 0, 0], [0, 1, 0]], teu: 0.5, volume: 28.0, mass: 8.0
        },
        kStep: {
            label: 'Step Bundle', short: 'Step', kind: 'crate', carrier: 'steel',
            cells: [[0, 0, 0], [1, 0, 0], [0, 1, 0]], teu: 0.75, volume: 42.0, mass: 13.0
        },
        kTripod: {
            label: 'Corner Bundle', short: 'Corner', kind: 'crate', carrier: 'steel',
            cells: [[0, 0, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0]], teu: 1, volume: 56.0, mass: 17.0
        }
    };

    CY.piece = function (id) {
        return CY.PIECES[id] || null;
    };

    // ── Grid ↔ world ────────────────────────────────────────────────────
    // Kept here (and pure) so the logic layer can reason about world metres —
    // e.g. the reach stacker deciding which cell it is parked next to —
    // without pulling in the renderer.
    CY.cellToWorld = function (cx, cy, cz, yard) {
        yard = yard || CY.YARD;
        return {
            x: (cx - yard.w / 2 + 0.5) * CY.CELL.x,
            y: (cy + 0.5) * CY.CELL.y,
            z: (cz - yard.d / 2 + 0.5) * CY.CELL.z
        };
    };

    CY.worldToCell = function (wx, wz, yard) {
        yard = yard || CY.YARD;
        return {
            x: Math.floor(wx / CY.CELL.x + yard.w / 2),
            z: Math.floor(wz / CY.CELL.z + yard.d / 2)
        };
    };

    CY.yardSizeMetres = function (yard) {
        yard = yard || CY.YARD;
        return { x: yard.w * CY.CELL.x, y: yard.h * CY.CELL.y, z: yard.d * CY.CELL.z };
    };

})(window);
