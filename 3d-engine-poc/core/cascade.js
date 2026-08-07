/**
 * core/cascade.js — the falling-cargo game.
 *
 * Yard Master's other half. The campaign hands you a manifest and all the time
 * in the world; Cascade drops one container at a time into a narrow bay and
 * keeps dropping whether you are ready or not. Fill a whole tier and it ships
 * out, everything above it settles down a tier, and the bay buys you room.
 *
 * The rules live here, in the same plain-data layer as everything else: a
 * YardGrid for occupancy, integer tiers, and a fall clock in seconds. No THREE,
 * no DOM, no rendering — game/cascadeMode.js draws whatever this says is true,
 * and tests.html plays whole games with no WebGL context at all.
 *
 * Every unit occupies exactly one tier (that is the grid's model, not a
 * simplification made here), so a lock can only ever complete the tier it lands
 * on: one layer per piece, never four. The reward for a run of them is the
 * combo multiplier rather than a Tetris-style multi-clear.
 */
(function (global) {
    'use strict';

    const Cargo3D = global.Cargo3D = global.Cargo3D || {};
    const C = Cargo3D.Constants;

    /**
     * The bay the cargo falls into. Deliberately small: 16 cells to a tier means
     * roughly six pieces fill one, which is the same rhythm as a ten-cell Tetris
     * row. A campaign-sized bay would make a tier take a minute to close.
     */
    const BAY = { cols: 4, rows: 4, tiers: 8 };

    /**
     * What falls, and how often. Read them as tetrominoes: the 10ft is the
     * single cell, the 20ft the domino, the 40ft the I-piece that spans the bay,
     * the crate the O, and the L-corner and T-beam exactly what they say.
     * Tanks and flat racks are left out — their whole point is a rule about what
     * may sit on them, and Cascade has no regulations to hang that on.
     */
    const PIECES = [
        { type: '10ft',   weight: 3 },
        { type: '20ft',   weight: 5 },
        { type: 'crate',  weight: 3 },
        { type: 'lblock', weight: 3 },
        { type: 'tblock', weight: 2 },
        { type: '40ft',   weight: 2 }
    ];

    const SCORE = {
        lock: 12,       // per container set down, × level
        soft: 1,        // per tier given up to a held soft drop
        hard: 2,        // per tier of a hard drop
        layer: 260,     // per tier shipped, × level × combo
        perfect: 1500   // the bay left completely empty
    };

    /** Seconds per tier at level 1, and the floor the decay stops at. */
    const BASE_FALL = 1.5;
    const FALL_DECAY = 0.86;
    const MIN_FALL = 0.24;

    /** How much faster a held soft drop falls. */
    const SOFT_FACTOR = 10;

    /**
     * Grace after touching down. A piece that has landed can still be slid, and
     * each move renews the grace — up to a limit, or a player who keeps nudging
     * would never lock at all.
     */
    const LOCK_DELAY = 0.6;
    const MAX_LOCK_RESETS = 12;

    const TIERS_PER_LEVEL = 3;
    const PREVIEW = 3;

    /** Kicks tried when a rotation does not fit where the piece stands. */
    const KICKS = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0], [0, -2], [0, 2]];

    function pickWeighted(rand, table) {
        let total = 0;
        for (let i = 0; i < table.length; i++) total += table[i].weight;

        let roll = rand() * total;
        for (let i = 0; i < table.length; i++) {
            roll -= table[i].weight;
            if (roll <= 0) return table[i].type;
        }
        return table[table.length - 1].type;
    }

    /**
     * @param {object} [opts]
     * @param {object} [opts.bay] cols/rows/tiers, defaults to BAY
     * @param {number} [opts.seed] fixed seed — the same run twice, for tests
     */
    function CascadeGame(opts) {
        opts = opts || {};
        this.bay = {
            cols: (opts.bay && opts.bay.cols) || BAY.cols,
            rows: (opts.bay && opts.bay.rows) || BAY.rows,
            tiers: (opts.bay && opts.bay.tiers) || BAY.tiers
        };
        this.seed = opts.seed === undefined ? (Date.now() >>> 0) : (opts.seed >>> 0);
        this.grid = new Cargo3D.YardGrid(this.bay.cols, this.bay.rows, this.bay.tiers);
        this.reset();
    }

    /** Back to an empty bay and the first piece of the same seeded run. */
    CascadeGame.prototype.reset = function () {
        this.grid.clear();
        this.rand = Cargo3D.Manifest.rng(this.seed);

        this.nextIndex = 0;
        this.queue = [];
        for (let i = 0; i < PREVIEW; i++) this.queue.push(this.makeUnit());

        this.score = 0;
        this.layers = 0;
        this.dropped = 0;
        this.combo = 0;
        this.bestCombo = 0;
        this.elapsed = 0;
        this.over = false;
        this.soft = false;
        this.piece = null;
        this.fallAccum = 0;
        this.lockAccum = 0;
        this.lockResets = 0;

        this.spawn();
        return this;
    };

    /* ── the cargo ─────────────────────────────────────────────────────── */

    /** A unit record shaped like a manifest's, so the HUD can chip it. */
    CascadeGame.prototype.makeUnit = function () {
        const typeId = pickWeighted(this.rand, PIECES);
        const spec = C.CARGO_TYPES[typeId];
        const carrier = C.CARRIER_KEYS[Math.floor(this.rand() * C.CARRIER_KEYS.length)];
        const index = this.nextIndex++;

        return {
            uid: 'cascade-' + index,
            index: index,
            type: typeId,
            label: spec.short + '-' + String(1000 + (index * 37) % 9000),
            carrier: carrier,
            traits: [],
            departure: 0,
            massT: Math.round((spec.tare + spec.payload * 0.45) * 10) / 10
        };
    };

    /* ── clocks ────────────────────────────────────────────────────────── */

    CascadeGame.prototype.level = function () {
        return 1 + Math.floor(this.layers / TIERS_PER_LEVEL);
    };

    /** Seconds a piece takes to fall one tier at the current level. */
    CascadeGame.prototype.fallInterval = function () {
        const at = BASE_FALL * Math.pow(FALL_DECAY, this.level() - 1);
        return Math.max(MIN_FALL, at);
    };

    /** Interval actually in force, soft drop included. */
    CascadeGame.prototype.stepInterval = function () {
        return this.soft ? this.fallInterval() / SOFT_FACTOR : this.fallInterval();
    };

    /**
     * How far the piece is between its tier and the one below, 0..1. Purely for
     * the renderer: the rules only ever see whole tiers.
     */
    CascadeGame.prototype.fallProgress = function () {
        if (!this.piece || this.over || !this.canFall()) return 0;
        const interval = this.stepInterval();
        return interval > 0 ? Math.min(1, this.fallAccum / interval) : 0;
    };

    /* ── the falling piece ─────────────────────────────────────────────── */

    /** True when a footprint at (x, z, rot) is inside the bay and clear at `tier`. */
    CascadeGame.prototype.fits = function (typeId, rot, x, z, tier) {
        const cells = this.grid.absCells(typeId, rot, x, z);
        if (!cells) return false;
        return this.grid.cellsFree(cells, tier);
    };

    /** Put the next unit at the top of the bay. False when there is no room. */
    CascadeGame.prototype.spawn = function () {
        const unit = this.queue.shift();
        this.queue.push(this.makeUnit());

        const rot = 0;
        const sp = C.span(unit.type, rot);
        const x = Math.floor((this.bay.cols - sp[0]) / 2);
        const z = Math.floor((this.bay.rows - sp[1]) / 2);
        const tier = this.bay.tiers - 1;

        this.fallAccum = 0;
        this.lockAccum = 0;
        this.lockResets = 0;
        this.soft = false;

        if (!this.fits(unit.type, rot, x, z, tier)) {
            // Nothing to draw and nothing to steer: the top tier is taken.
            this.piece = null;
            this.over = true;
            return false;
        }

        this.piece = { unit: unit, type: unit.type, rot: rot, x: x, z: z, tier: tier };
        return true;
    };

    /** True when the tier below the piece is clear all the way across it. */
    CascadeGame.prototype.canFall = function () {
        const p = this.piece;
        if (!p || this.over) return false;
        if (p.tier <= 0) return false;
        return this.fits(p.type, p.rot, p.x, p.z, p.tier - 1);
    };

    /**
     * The tier the piece would come to rest on if it fell from here — the ghost.
     * Walks down from where it is, so it can slide under an overhang and stop
     * there, exactly as the falling piece would.
     */
    CascadeGame.prototype.landingTier = function () {
        const p = this.piece;
        if (!p) return 0;

        let tier = p.tier;
        while (tier > 0 && this.fits(p.type, p.rot, p.x, p.z, tier - 1)) tier--;
        return tier;
    };

    /** Renew the lock grace after a move, while the allowance lasts. */
    CascadeGame.prototype.touch = function () {
        if (this.lockAccum <= 0 || this.lockResets >= MAX_LOCK_RESETS) return;
        this.lockResets++;
        this.lockAccum = 0;
    };

    /** Slide the piece by whole cells. False when something is in the way. */
    CascadeGame.prototype.moveBy = function (dx, dz) {
        const p = this.piece;
        if (!p || this.over) return false;
        return this.moveTo(p.x + dx, p.z + dz);
    };

    /**
     * Put the piece at a footprint origin — what the pointer asks for. The
     * origin is clamped into the bay first, so an aim that runs off the edge
     * slides along it instead of being refused.
     */
    CascadeGame.prototype.moveTo = function (x, z) {
        const p = this.piece;
        if (!p || this.over) return false;

        const sp = C.span(p.type, p.rot);
        const nx = Math.max(0, Math.min(this.bay.cols - sp[0], x | 0));
        const nz = Math.max(0, Math.min(this.bay.rows - sp[1], z | 0));
        if (nx === p.x && nz === p.z) return false;
        if (!this.fits(p.type, p.rot, nx, nz, p.tier)) return false;

        p.x = nx;
        p.z = nz;
        this.touch();
        return true;
    };

    /**
     * Quarter turn. Rotation is 0 or 1 — 180° and 270° give the same footprint —
     * and when the turned piece does not fit where it stands, the kick list
     * shoves it a cell or two before giving up.
     */
    CascadeGame.prototype.rotate = function () {
        const p = this.piece;
        if (!p || this.over) return false;

        const rot = (p.rot + 1) % 2;
        const sp = C.span(p.type, rot);
        if (sp[0] > this.bay.cols || sp[1] > this.bay.rows) return false;

        for (let i = 0; i < KICKS.length; i++) {
            const x = Math.max(0, Math.min(this.bay.cols - sp[0], p.x + KICKS[i][0]));
            const z = Math.max(0, Math.min(this.bay.rows - sp[1], p.z + KICKS[i][1]));
            if (!this.fits(p.type, rot, x, z, p.tier)) continue;

            p.rot = rot;
            p.x = x;
            p.z = z;
            this.touch();
            return true;
        }
        return false;
    };

    /** Hold or release the soft drop. */
    CascadeGame.prototype.setSoft = function (on) {
        const next = !!on;
        if (next === this.soft) return this.soft;
        // The accumulator is measured against an interval that just changed, so
        // carrying it over would jump the piece a tier on the switch.
        this.fallAccum = 0;
        this.soft = next;
        return this.soft;
    };

    /* ── the clock ─────────────────────────────────────────────────────── */

    /**
     * Advance the game by `dt` seconds.
     * @returns {Array<object>} what happened — 'lock', 'clear', 'over'
     */
    CascadeGame.prototype.tick = function (dt) {
        if (this.over || !this.piece) return [];

        const step = Math.max(0, dt || 0);
        this.elapsed += step;
        this.fallAccum += step;

        // Bounded: a tab that slept for a minute should not drop forty tiers.
        let guard = 0;
        while (this.canFall() && this.fallAccum >= this.stepInterval() && guard++ < 32) {
            this.fallAccum -= this.stepInterval();
            this.piece.tier--;
            if (this.soft) this.score += SCORE.soft;
            this.lockAccum = 0;
            this.lockResets = 0;
        }

        if (this.canFall()) return [];

        // Grounded. The grace lets a piece be slid into the gap beside it before
        // it commits, which is the difference between a puzzle and a reflex test.
        this.fallAccum = 0;
        this.lockAccum += step;
        if (this.lockAccum < LOCK_DELAY) return [];

        return this.lockPiece();
    };

    /** Send the piece straight down and lock it there. */
    CascadeGame.prototype.hardDrop = function () {
        if (this.over || !this.piece) return [];

        let fell = 0;
        while (this.canFall()) {
            this.piece.tier--;
            fell++;
        }
        this.score += fell * SCORE.hard;
        return this.lockPiece();
    };

    /**
     * Commit the piece to the grid, ship any tier it completed, and bring on the
     * next one. Order matters: the clear happens before the spawn, so a piece
     * never arrives into a bay that is about to change under it.
     */
    CascadeGame.prototype.lockPiece = function () {
        const p = this.piece;
        if (!p || this.over) return [];

        const placement = this.grid.place(p.unit, p.x, p.z, p.tier, p.rot);
        if (!placement) {
            // Nothing legal can put it here; the yard is full to the roof.
            this.over = true;
            return [{ type: 'over', reason: 'The bay reached the crane limit.' }];
        }

        this.dropped++;
        this.score += SCORE.lock * this.level();
        this.piece = null;

        const events = [{ type: 'lock', placement: placement }];

        const full = this.fullTiers();
        if (full.length) {
            this.combo++;
            if (this.combo > this.bestCombo) this.bestCombo = this.combo;

            const result = this.clearTiers(full);
            this.layers += full.length;
            this.score += Math.round(SCORE.layer * full.length * this.level() * this.comboMultiplier());

            const perfect = this.grid.count() === 0;
            if (perfect) this.score += SCORE.perfect * this.level();

            events.push({
                type: 'clear',
                tiers: full,
                removed: result.removed,
                moved: result.moved,
                combo: this.combo,
                perfect: perfect
            });
        } else {
            this.combo = 0;
        }

        if (!this.spawn()) {
            events.push({ type: 'over', reason: 'The next container had nowhere to go.' });
        }
        return events;
    };

    /** Consecutive clears are worth more: 1×, 1.5×, 2× and on up. */
    CascadeGame.prototype.comboMultiplier = function () {
        return 1 + Math.max(0, this.combo - 1) * 0.5;
    };

    /** Tiers with every cell occupied, lowest first. */
    CascadeGame.prototype.fullTiers = function () {
        const out = [];
        for (let t = 0; t < this.bay.tiers; t++) {
            let full = true;
            for (let z = 0; z < this.bay.rows && full; z++) {
                for (let x = 0; x < this.bay.cols; x++) {
                    if (this.grid.get(x, z, t) === 0) { full = false; break; }
                }
            }
            if (full) out.push(t);
        }
        return out;
    };

    /**
     * Ship the given tiers and settle everything above them.
     *
     * A unit sits in exactly one tier, so a cleared tier takes whole containers
     * and never cuts one in half. Survivors are torn down and rebuilt a tier or
     * more lower, which mints new placement ids — hence `moved`, pairing each
     * old record with its replacement so the renderer can follow its mesh.
     *
     * @param {number[]} tiers ascending
     * @returns {{removed: object[], moved: Array<{from: object, to: object}>}}
     */
    CascadeGame.prototype.clearTiers = function (tiers) {
        const cleared = {};
        tiers.forEach(function (t) { cleared[t] = true; });

        const removed = [];
        const survivors = [];
        this.grid.list().forEach(function (placement) {
            if (cleared[placement.tier]) removed.push(placement);
            else survivors.push(placement);
        });

        this.grid.clear();

        const moved = [];
        for (let i = 0; i < survivors.length; i++) {
            const p = survivors[i];
            let drop = 0;
            for (let t = 0; t < tiers.length; t++) {
                if (tiers[t] < p.tier) drop++;
            }
            const next = this.grid.place(p.unit, p.x, p.z, p.tier - drop, p.rot);
            if (next) moved.push({ from: p, to: next });
        }

        return { removed: removed, moved: moved };
    };

    /* ── readouts ──────────────────────────────────────────────────────── */

    /** Highest occupied tier plus one — how full the bay is, in tiers. */
    CascadeGame.prototype.stackHeight = function () {
        const bounds = this.grid.bounds();
        return bounds ? bounds.maxTier + 1 : 0;
    };

    /**
     * How close the lowest unfinished tier is to shipping, 0..1. The one number
     * that says whether the next piece should go where it fits or where it helps.
     */
    CascadeGame.prototype.tierFill = function () {
        const cells = this.bay.cols * this.bay.rows;
        for (let t = 0; t < this.bay.tiers; t++) {
            let filled = 0;
            for (let z = 0; z < this.bay.rows; z++) {
                for (let x = 0; x < this.bay.cols; x++) {
                    if (this.grid.get(x, z, t) !== 0) filled++;
                }
            }
            if (filled < cells) return filled / cells;
        }
        return 0;
    };

    /** Everything the HUD needs, in one object. */
    CascadeGame.prototype.snapshot = function () {
        return {
            score: this.score,
            layers: this.layers,
            level: this.level(),
            combo: this.combo,
            bestCombo: this.bestCombo,
            dropped: this.dropped,
            elapsed: this.elapsed,
            over: this.over,
            soft: this.soft,
            current: this.piece ? this.piece.unit : null,
            upcoming: this.queue.slice(0, PREVIEW),
            tierFill: this.tierFill(),
            stackHeight: this.stackHeight(),
            tiers: this.bay.tiers,
            fallInterval: this.fallInterval()
        };
    };

    Cargo3D.Cascade = {
        BAY: BAY,
        PIECES: PIECES,
        SCORE: SCORE,
        PREVIEW: PREVIEW,
        LOCK_DELAY: LOCK_DELAY,
        BASE_FALL: BASE_FALL,
        MIN_FALL: MIN_FALL,
        SOFT_FACTOR: SOFT_FACTOR,
        TIERS_PER_LEVEL: TIERS_PER_LEVEL,
        Game: CascadeGame
    };
    Cargo3D.CascadeGame = CascadeGame;
})(typeof window !== 'undefined' ? window : globalThis);
