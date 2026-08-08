/**
 * core/scoring.js — how a finished yard is measured.
 *
 * The rank is the *envelope*: the volume of the smallest axis-aligned box that
 * contains every occupied cell. A mission's `scoreMode` decides which way that
 * number should go:
 *
 *   - 'pack'   (default) — lower wins. Sprawl multiplies across all tiers, air
 *     pockets are paid for, and par is a perfect zero-waste pack of the
 *     manifest: the tightest the envelope could ever be.
 *   - 'sprawl' — higher wins. The target is the bay's own volume: the biggest
 *     the envelope could ever be, given the mission's own bay size. Medal
 *     thresholds are read as a floor instead of a ceiling.
 *
 * Both targets are derived — from the manifest or from the bay the mission
 * already declares — so a new mission needs no hand-tuned number either way.
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

    /** The whole bay's volume in m³ — the ceiling a sprawl mission scores against. */
    function bayVolume(bay) {
        return bay.cols * bay.rows * bay.tiers * cellVolume();
    }

    /**
     * The volume a mission scores the envelope against: the tightest a pack
     * mission could ever be, or the biggest a sprawl mission could ever be.
     * @param {object} mission
     * @param {object[]} units the full manifest
     */
    function scoreTarget(mission, units) {
        return mission.scoreMode === 'sprawl' ? bayVolume(mission.bay) : parFor(units);
    }

    /**
     * @param {number} envelope
     * @param {number} target par (pack) or bay volume (sprawl)
     * @param {object} [thresholds]
     * @param {'pack'|'sprawl'} [mode]
     * @returns {'gold'|'silver'|'bronze'|null}
     */
    function medalFor(envelope, target, thresholds, mode) {
        if (!target || !envelope) return null;
        const t = Object.assign({}, DEFAULT_MEDALS, thresholds || {});
        const ratio = envelope / target;
        if (mode === 'sprawl') {
            if (ratio >= t.gold) return 'gold';
            if (ratio >= t.silver) return 'silver';
            if (ratio >= t.bronze) return 'bronze';
            return null;
        }
        if (ratio <= t.gold) return 'gold';
        if (ratio <= t.silver) return 'silver';
        if (ratio <= t.bronze) return 'bronze';
        return null;
    }

    /**
     * Volume threshold for a given medal: the most a pack mission may use, or
     * the least a sprawl mission must fill.
     */
    function targetFor(target, thresholds, medal) {
        const t = Object.assign({}, DEFAULT_MEDALS, thresholds || {});
        return target * (t[medal] || t.bronze);
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
        const mode = mission.scoreMode === 'sprawl' ? 'sprawl' : 'pack';
        const target = scoreTarget(mission, units);
        const placed = grid.count();
        const complete = placed >= units.length;
        const medal = complete ? medalFor(m.envelope, target, mission.medals, mode) : null;

        return {
            missionId: mission.id,
            missionName: mission.name,
            scoreMode: mode,
            complete: complete,
            placed: placed,
            required: units.length,
            envelope: m.envelope,
            par: target,
            ratio: target ? m.envelope / target : 0,
            overPar: m.envelope - target,
            medal: medal,
            measure: m,
            stats: stats || { moves: placed, undos: 0, elapsedMs: 0 },
            thresholds: {
                gold: targetFor(target, mission.medals, 'gold'),
                silver: targetFor(target, mission.medals, 'silver'),
                bronze: targetFor(target, mission.medals, 'bronze')
            }
        };
    }

    Cargo3D.Scoring = {
        DEFAULT_MEDALS: DEFAULT_MEDALS,
        cellVolume: cellVolume,
        bayVolume: bayVolume,
        measure: measure,
        parFor: parFor,
        cellsFor: cellsFor,
        scoreTarget: scoreTarget,
        medalFor: medalFor,
        targetFor: targetFor,
        buildResult: buildResult
    };
})(typeof window !== 'undefined' ? window : globalThis);
