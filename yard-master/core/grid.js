/**
 * core/grid.js — the yard occupancy lattice.
 *
 * A YardGrid is a cols × rows × tiers box of cells (X × Z × Y). Each cell holds
 * either 0 (empty) or the id of the placement occupying it. Everything the game
 * needs to decide legality — gravity, support, burial, adjacency, the bounding
 * envelope — is answered from this array.
 *
 * Pure data + pure functions: no THREE, no DOM. See tests.html.
 */
(function (global) {
    'use strict';

    const Cargo3D = global.Cargo3D = global.Cargo3D || {};
    const C = Cargo3D.Constants;

    let nextPlacementId = 1;

    /**
     * @param {number} cols cells along X
     * @param {number} rows cells along Z
     * @param {number} tiers stack height in tiers
     */
    function YardGrid(cols, rows, tiers) {
        this.cols = cols | 0;
        this.rows = rows | 0;
        this.tiers = tiers | 0;
        this.cells = new Int32Array(this.cols * this.rows * this.tiers);
        /** @type {Object<number, object>} placement id → placement record */
        this.placements = {};
        this.order = []; // placement ids in the order they were placed
    }

    YardGrid.prototype.index = function (x, z, tier) {
        return (tier * this.rows + z) * this.cols + x;
    };

    YardGrid.prototype.inBounds = function (x, z, tier) {
        return x >= 0 && x < this.cols &&
               z >= 0 && z < this.rows &&
               tier >= 0 && tier < this.tiers;
    };

    /** Placement id occupying a cell, or 0. */
    YardGrid.prototype.get = function (x, z, tier) {
        if (!this.inBounds(x, z, tier)) return 0;
        return this.cells[this.index(x, z, tier)];
    };

    /** Highest occupied tier in a column, or -1 when the column is empty. */
    YardGrid.prototype.columnTop = function (x, z) {
        for (let t = this.tiers - 1; t >= 0; t--) {
            if (this.cells[this.index(x, z, t)] !== 0) return t;
        }
        return -1;
    };

    /**
     * Absolute footprint cells for a type placed with its origin at (x, z).
     * @returns {Array<[number, number]>|null} null when any cell is out of bounds
     */
    YardGrid.prototype.absCells = function (typeId, rot, x, z) {
        const mask = C.footprint(typeId, rot);
        if (!mask.length) return null;

        const out = [];
        for (let i = 0; i < mask.length; i++) {
            const ax = x + mask[i][0];
            const az = z + mask[i][1];
            if (ax < 0 || ax >= this.cols || az < 0 || az >= this.rows) return null;
            out.push([ax, az]);
        }
        return out;
    };

    /**
     * The tier a piece falls to when dropped at (x, z) — one above the tallest
     * column under its footprint. Returns null when the footprint is off the bay
     * and -1 when the piece would land above the bay's tier limit.
     */
    YardGrid.prototype.restTier = function (typeId, rot, x, z) {
        const cells = this.absCells(typeId, rot, x, z);
        if (!cells) return null;

        let top = -1;
        for (let i = 0; i < cells.length; i++) {
            const t = this.columnTop(cells[i][0], cells[i][1]);
            if (t > top) top = t;
        }

        const tier = top + 1;
        return tier < this.tiers ? tier : -1;
    };

    /** True when every cell of the footprint is empty at `tier`. */
    YardGrid.prototype.cellsFree = function (absCells, tier) {
        if (tier < 0 || tier >= this.tiers) return false;
        for (let i = 0; i < absCells.length; i++) {
            if (this.cells[this.index(absCells[i][0], absCells[i][1], tier)] !== 0) return false;
        }
        return true;
    };

    /**
     * How much of a footprint rests on something at `tier`.
     * Tier 0 is the ground: fully supported by definition.
     * @returns {{total:number, supported:number, ratio:number, ids:number[]}}
     */
    YardGrid.prototype.supportInfo = function (absCells, tier) {
        const total = absCells.length;
        if (tier <= 0) {
            return { total: total, supported: total, ratio: 1, ids: [] };
        }

        let supported = 0;
        const ids = [];
        for (let i = 0; i < total; i++) {
            const id = this.get(absCells[i][0], absCells[i][1], tier - 1);
            if (id !== 0) {
                supported++;
                if (ids.indexOf(id) === -1) ids.push(id);
            }
        }

        return { total: total, supported: supported, ratio: total ? supported / total : 0, ids: ids };
    };

    /** Distinct placement ids anywhere in the columns under a footprint. */
    YardGrid.prototype.idsUnder = function (absCells, tier) {
        const ids = [];
        for (let i = 0; i < absCells.length; i++) {
            for (let t = 0; t < tier; t++) {
                const id = this.get(absCells[i][0], absCells[i][1], t);
                if (id !== 0 && ids.indexOf(id) === -1) ids.push(id);
            }
        }
        return ids;
    };

    /** Distinct placement ids sharing a face with a footprint on the same tier. */
    YardGrid.prototype.neighboursAt = function (absCells, tier) {
        const own = {};
        for (let i = 0; i < absCells.length; i++) {
            own[absCells[i][0] + ':' + absCells[i][1]] = true;
        }

        const offsets = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const ids = [];
        for (let i = 0; i < absCells.length; i++) {
            for (let o = 0; o < offsets.length; o++) {
                const nx = absCells[i][0] + offsets[o][0];
                const nz = absCells[i][1] + offsets[o][1];
                if (own[nx + ':' + nz]) continue;
                const id = this.get(nx, nz, tier);
                if (id !== 0 && ids.indexOf(id) === -1) ids.push(id);
            }
        }
        return ids;
    };

    /** True when any cell of the footprint sits on the bay perimeter. */
    YardGrid.prototype.touchesPerimeter = function (absCells) {
        for (let i = 0; i < absCells.length; i++) {
            const x = absCells[i][0];
            const z = absCells[i][1];
            if (x === 0 || x === this.cols - 1 || z === 0 || z === this.rows - 1) return true;
        }
        return false;
    };

    /**
     * Commit a unit to the grid. Callers are expected to have run the rule
     * checks first; this only refuses physically impossible writes.
     *
     * @param {object} unit manifest unit ({uid, type, carrier, traits, ...})
     * @returns {object|null} the placement record
     */
    YardGrid.prototype.place = function (unit, x, z, tier, rot) {
        const cells = this.absCells(unit.type, rot, x, z);
        if (!cells || !this.cellsFree(cells, tier)) return null;

        const placement = {
            id: nextPlacementId++,
            unit: unit,
            type: unit.type,
            x: x,
            z: z,
            tier: tier,
            // Tiers are a span, not a number, because a container that has come
            // down lies across whatever height its wreck actually occupies. A
            // unit placed by the crane spans exactly one.
            tierTop: tier,
            rot: rot | 0,
            cells: cells
        };

        for (let i = 0; i < cells.length; i++) {
            this.cells[this.index(cells[i][0], cells[i][1], tier)] = placement.id;
        }

        this.placements[placement.id] = placement;
        this.order.push(placement.id);
        return placement;
    };

    /** Clear every cell a placement holds, without forgetting the placement. */
    YardGrid.prototype.releaseCells = function (placement) {
        const top = placement.tierTop === undefined ? placement.tier : placement.tierTop;
        for (let i = 0; i < placement.cells.length; i++) {
            for (let t = placement.tier; t <= top; t++) {
                if (!this.inBounds(placement.cells[i][0], placement.cells[i][1], t)) continue;
                const idx = this.index(placement.cells[i][0], placement.cells[i][1], t);
                if (this.cells[idx] === placement.id) this.cells[idx] = 0;
            }
        }
    };

    /**
     * Move a placement onto the ground it actually came to rest on.
     *
     * Used when a stack comes down. The cargo is not lost and not craned away:
     * it is still in the yard, still counts, and still widens the envelope —
     * it is simply not where it was put. The id, the unit and its place in the
     * order all survive, so the manifest and undo see no gap.
     *
     * Ground another placement already holds is claimed around, not stolen: the
     * wreck's footprint is an axis-aligned approximation of a box lying at an
     * angle, so it can overlap a neighbour the solver actually kept clear.
     * Claiming runs per cell *and* per tier rather than all-or-nothing, so a
     * wreck that clips one corner of a standing unit still takes the rest of
     * the ground it is genuinely lying on instead of being left holding none.
     *
     * @param {number} id
     * @param {Array<[number, number]>} cells absolute cells the wreck covers
     * @param {number} tier lowest tier it occupies
     * @param {number} tierTop highest tier it occupies
     * @returns {object|null} the updated placement
     */
    YardGrid.prototype.reseat = function (id, cells, tier, tierTop) {
        const placement = this.placements[id];
        if (!placement) return null;

        this.releaseCells(placement);

        const lo = Math.max(0, Math.min(this.tiers - 1, tier));
        const hi = Math.max(lo, Math.min(this.tiers - 1, tierTop));
        const kept = [];

        for (let i = 0; i < cells.length; i++) {
            const x = cells[i][0], z = cells[i][1];
            if (x < 0 || x >= this.cols || z < 0 || z >= this.rows) continue;

            let got = false;
            for (let t = lo; t <= hi; t++) {
                const idx = this.index(x, z, t);
                if (this.cells[idx] !== 0) continue;
                this.cells[idx] = id;
                got = true;
            }
            if (got) kept.push([x, z]);
        }

        placement.cells = kept;
        placement.tier = lo;
        placement.tierTop = hi;
        placement.x = kept.length ? kept[0][0] : placement.x;
        placement.z = kept.length ? kept[0][1] : placement.z;
        return placement;
    };

    /** Remove a placement. Returns the removed record, or null. */
    YardGrid.prototype.removeById = function (id) {
        const placement = this.placements[id];
        if (!placement) return null;

        this.releaseCells(placement);

        delete this.placements[id];
        const at = this.order.indexOf(id);
        if (at > -1) this.order.splice(at, 1);
        return placement;
    };

    /** The most recently placed unit, or null. */
    YardGrid.prototype.lastPlacement = function () {
        if (!this.order.length) return null;
        return this.placements[this.order[this.order.length - 1]] || null;
    };

    /** True when anything rests in the columns directly above a placement. */
    YardGrid.prototype.isBuried = function (id) {
        const placement = this.placements[id];
        if (!placement) return false;

        const top = placement.tierTop === undefined ? placement.tier : placement.tierTop;
        for (let i = 0; i < placement.cells.length; i++) {
            for (let t = top + 1; t < this.tiers; t++) {
                if (this.get(placement.cells[i][0], placement.cells[i][1], t) !== 0) return true;
            }
        }
        return false;
    };

    YardGrid.prototype.list = function () {
        const self = this;
        return this.order.map(function (id) { return self.placements[id]; });
    };

    YardGrid.prototype.count = function () {
        return this.order.length;
    };

    /** Occupied cell count (a proxy for how much slot volume is in use). */
    YardGrid.prototype.occupiedCells = function () {
        let n = 0;
        for (let i = 0; i < this.cells.length; i++) {
            if (this.cells[i] !== 0) n++;
        }
        return n;
    };

    /**
     * Axis-aligned bounds of everything placed, in cells.
     * @returns {object|null} null when the yard is empty
     */
    YardGrid.prototype.bounds = function () {
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        let minTier = Infinity, maxTier = -Infinity;
        let found = false;

        for (let t = 0; t < this.tiers; t++) {
            for (let z = 0; z < this.rows; z++) {
                for (let x = 0; x < this.cols; x++) {
                    if (this.cells[this.index(x, z, t)] === 0) continue;
                    found = true;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (z < minZ) minZ = z;
                    if (z > maxZ) maxZ = z;
                    if (t < minTier) minTier = t;
                    if (t > maxTier) maxTier = t;
                }
            }
        }

        if (!found) return null;

        return {
            minX: minX, maxX: maxX,
            minZ: minZ, maxZ: maxZ,
            minTier: minTier, maxTier: maxTier,
            spanX: maxX - minX + 1,
            spanZ: maxZ - minZ + 1,
            spanTiers: maxTier - minTier + 1
        };
    };

    YardGrid.prototype.clear = function () {
        this.cells.fill(0);
        this.placements = {};
        this.order = [];
    };

    /** Serializable state — used by undo, replays and (later) share links. */
    YardGrid.prototype.serialize = function () {
        return {
            cols: this.cols,
            rows: this.rows,
            tiers: this.tiers,
            placements: this.list().map(function (p) {
                return { uid: p.unit.uid, type: p.type, x: p.x, z: p.z, tier: p.tier, rot: p.rot };
            })
        };
    };

    Cargo3D.YardGrid = YardGrid;
})(typeof window !== 'undefined' ? window : globalThis);
