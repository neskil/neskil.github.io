/**
 * core/scoring.js — how a finished yard is measured.
 *
 * The rank is the *envelope*: the volume of the smallest axis-aligned box that
 * contains every occupied cell. Lower wins. Sprawl multiplies across all tiers,
 * air pockets are paid for, and the number is visible in the scene as a
 * wireframe while you play.
 *
 * Par is derived from the manifest — a perfect zero-waste pack — so a new
 * mission needs no hand-tuned target.
 */
(function (global) {
    'use strict';

    const Cargo3D = global.Cargo3D = global.Cargo3D || {};
    const C = Cargo3D.Constants;

    const DEFAULT_MEDALS = { gold: 1.10, silver: 1.30, bronze: 1.60 };

    /** Cell-volume of the bay lattice, in m³. */
    function cellVolume() {
        return C.GRID.CELL_VOLUME;
    }

    /**
     * Measure the current grid.
     * @param {YardGrid} grid
     */
    function measure(grid) {
        const bounds = grid.bounds();
        const placements = grid.list();

        let cargoVolume = 0;
        let teu = 0;
        let massT = 0;
        for (let i = 0; i < placements.length; i++) {
            const type = C.CARGO_TYPES[placements[i].type];
            if (!type) continue;
            cargoVolume += type.volume;
            teu += type.teu;
            massT += (placements[i].unit && placements[i].unit.massT) || type.tare;
        }

        if (!bounds) {
            return {
                count: 0,
                spanX: 0, spanZ: 0, spanTiers: 0,
                envelopeCells: 0, occupiedCells: 0,
                envelope: 0, footprintArea: 0, height: 0,
                slotEfficiency: 0, packDensity: 0,
                cargoVolume: 0, teu: 0, massT: 0
            };
        }

        const footprintArea = bounds.spanX * C.GRID.CELL_X * bounds.spanZ * C.GRID.CELL_Z;
        const height = bounds.spanTiers * C.GRID.TIER_H;
        const envelope = footprintArea * height;
        const envelopeCells = bounds.spanX * bounds.spanZ * bounds.spanTiers;
        const occupiedCells = grid.occupiedCells();

        return {
            count: placements.length,
            spanX: bounds.spanX,
            spanZ: bounds.spanZ,
            spanTiers: bounds.spanTiers,
            bounds: bounds,
            envelopeCells: envelopeCells,
            occupiedCells: occupiedCells,
            envelope: envelope,
            footprintArea: footprintArea,
            height: height,
            slotEfficiency: envelopeCells ? occupiedCells / envelopeCells : 0,
            packDensity: envelope ? cargoVolume / envelope : 0,
            cargoVolume: cargoVolume,
            teu: teu,
            massT: massT
        };
    }

    /**
     * Perfect-pack volume for a manifest: every unit's footprint cells with no
     * wasted slot anywhere. Unreachable in practice — that is what makes it par.
     */
    function parFor(units) {
        let cells = 0;
        for (let i = 0; i < units.length; i++) {
            cells += C.cellCount(units[i].type);
        }
        return cells * cellVolume();
    }

    /** Cell count a manifest needs, for the HUD's "slots required" readout. */
    function cellsFor(units) {
        let cells = 0;
        for (let i = 0; i < units.length; i++) {
            cells += C.cellCount(units[i].type);
        }
        return cells;
    }

    /**
     * @returns {'gold'|'silver'|'bronze'|null}
     */
    function medalFor(envelope, par, thresholds) {
        if (!par || !envelope) return null;
        const t = Object.assign({}, DEFAULT_MEDALS, thresholds || {});
        const ratio = envelope / par;
        if (ratio <= t.gold) return 'gold';
        if (ratio <= t.silver) return 'silver';
        if (ratio <= t.bronze) return 'bronze';
        return null;
    }

    /** Volume you must not exceed to earn a given medal. */
    function targetFor(par, thresholds, medal) {
        const t = Object.assign({}, DEFAULT_MEDALS, thresholds || {});
        return par * (t[medal] || t.bronze);
    }

    /**
     * Final scorecard for a mission attempt.
     *
     * @param {YardGrid} grid
     * @param {object} mission
     * @param {object[]} units the full manifest (placed and unplaced)
     * @param {{moves:number, undos:number, elapsedMs:number}} [stats]
     */
    function buildResult(grid, mission, units, stats) {
        const m = measure(grid);
        const par = parFor(units);
        const placed = grid.count();
        const complete = placed >= units.length;
        const medal = complete ? medalFor(m.envelope, par, mission.medals) : null;

        return {
            missionId: mission.id,
            missionName: mission.name,
            complete: complete,
            placed: placed,
            required: units.length,
            envelope: m.envelope,
            par: par,
            ratio: par ? m.envelope / par : 0,
            overPar: m.envelope - par,
            medal: medal,
            measure: m,
            stats: stats || { moves: placed, undos: 0, elapsedMs: 0 },
            thresholds: {
                gold: targetFor(par, mission.medals, 'gold'),
                silver: targetFor(par, mission.medals, 'silver'),
                bronze: targetFor(par, mission.medals, 'bronze')
            }
        };
    }

    Cargo3D.Scoring = {
        DEFAULT_MEDALS: DEFAULT_MEDALS,
        cellVolume: cellVolume,
        measure: measure,
        parFor: parFor,
        cellsFor: cellsFor,
        medalFor: medalFor,
        targetFor: targetFor,
        buildResult: buildResult
    };
})(typeof window !== 'undefined' ? window : globalThis);
