(function (window) {
    'use strict';

    // The whole game in one number: **the smallest cuboid that still contains
    // everything you stacked**. Lower wins.
    //
    // Width and depth are the extents of what you actually placed; height is
    // measured from the ground up, so a tower cannot score as if it floated.
    // Holes inside the stack are counted — the box does not care that they are
    // empty, it only cares how big it has to be.
    const CY = window.CY = window.CY || {};

    function evaluate(g, opts) {
        opts = opts || {};
        const rules = opts.rules || CY.RULES;
        const ext = CY.grid.extents(g);

        let cargoVolume = 0, mass = 0, teu = 0;
        g.pieces.forEach(function (p) {
            const def = CY.piece(p.pieceId);
            if (!def) return;
            cargoVolume += def.volume;
            mass += def.mass;
            teu += def.teu;
        });

        const penalties = audit(g, rules, opts);
        let penaltyVolume = 0;
        penalties.forEach(function (p) { penaltyVolume += p.cost; });

        const bboxCells = ext.empty ? 0 : ext.spanX * ext.spanY * ext.spanZ;
        const bboxVolume = bboxCells * CY.CELL.volume;

        return {
            empty: ext.empty,
            pieces: g.pieces.length,
            cells: ext.count,
            spanX: ext.spanX, spanY: ext.spanY, spanZ: ext.spanZ,
            bboxCells: bboxCells,
            // The score itself, in m³.
            stackVolume: bboxVolume,
            penaltyVolume: penaltyVolume,
            score: bboxVolume + penaltyVolume,
            // Context the HUD shows next to it.
            cargoVolume: cargoVolume,
            mass: mass,
            teu: teu,
            // Cell fill is the honest packing number; cargo fill is the same
            // idea against real cargo volume (crates do not fill their cell).
            fill: bboxCells ? ext.count / bboxCells : 0,
            cargoFill: bboxVolume ? cargoVolume / bboxVolume : 0,
            penalties: penalties
        };
    }

    // Soft rules. These never block a placement — they cost volume at the end,
    // so burying a priority box to save a whole tier stays a real choice.
    function audit(g, rules, opts) {
        opts = opts || {};
        const out = [];
        g.pieces.forEach(function (p) {
            const def = CY.piece(p.pieceId);
            if (!def) return;
            if (p.tag === 'priority' && CY.grid.isBuried(g, p.id)) {
                out.push({
                    id: p.id, kind: 'buriedPriority', cost: CY.PENALTY.buriedPriority,
                    text: (def.short || def.label) + ' departs first but is buried'
                });
            }
            if (def.power && !CY.grid.hasSideAccess(g, p.id)) {
                out.push({
                    id: p.id, kind: 'noPlugAccess', cost: CY.PENALTY.noPlugAccess,
                    text: (def.short || def.label) + ' has no reefer plug access'
                });
            }
        });
        (opts.abandoned || []).forEach(function (pieceId) {
            const def = CY.piece(pieceId);
            out.push({
                id: null, kind: 'abandonedPiece', cost: CY.PENALTY.abandonedPiece,
                text: (def ? def.short || def.label : 'Piece') + ' had nowhere legal to go'
            });
        });
        return out;
    }

    // Par is derived, never hand-written: the theoretical floor is the queue's
    // own cell count (a perfect pack with no holes), and the medals are
    // multiples of it, so adding a piece to a mission cannot leave a stale
    // target behind.
    //
    // Multiples of that floor. Bronze is the unlock gate and is
    // deliberately generous; gold is the actual challenge. tests.html is the
    // calibration authority: it runs a greedy reference packer over every
    // mission and fails if one of them stops being clearable, so editing a
    // queue cannot silently strand a par. A mission whose shape mix genuinely
    // cannot pack tight overrides these in its own `par` block.
    const DEFAULT_PAR = { gold: 1.15, silver: 1.45, bronze: 2.00 };

    function parFor(queue, overrides) {
        let cells = 0;
        queue.forEach(function (q) {
            const def = CY.piece(typeof q === 'string' ? q : q.id);
            if (def) cells += def.cells.length;
        });
        const floor = cells * CY.CELL.volume;
        const mult = Object.assign({}, DEFAULT_PAR, overrides || {});
        return {
            cells: cells,
            floor: floor,
            gold: floor * mult.gold,
            silver: floor * mult.silver,
            bronze: floor * mult.bronze
        };
    }

    function rate(score, par) {
        if (!par) return 0;
        if (score <= par.gold) return 3;
        if (score <= par.silver) return 2;
        if (score <= par.bronze) return 1;
        return 0;
    }

    CY.score = {
        evaluate: evaluate,
        audit: audit,
        parFor: parFor,
        rate: rate,
        DEFAULT_PAR: DEFAULT_PAR
    };

})(window);
