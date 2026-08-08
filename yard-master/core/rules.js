/**
 * core/rules.js — terminal regulations, as pure predicates.
 *
 * A mission declares its rules as strings ('support:1', 'maxTier:3', ...).
 * Each rule is a function of (grid, unit, position) that returns null when the
 * placement is fine, or a player-readable reason when it isn't — the HUD prints
 * that reason under the cursor, so the wording matters.
 *
 * Adding difficulty is one entry here plus one string in a mission.
 */
(function (global) {
    'use strict';

    const Cargo3D = global.Cargo3D = global.Cargo3D || {};
    const C = Cargo3D.Constants;

    function hasTrait(unit, trait) {
        return !!(unit && unit.traits && unit.traits.indexOf(trait) !== -1);
    }

    function dayLabel(day) {
        return C.DEPARTURE_DAYS[day] || ('day ' + day);
    }

    /**
     * Rule table. `defaultParam` applies when a mission writes the rule without
     * a `:value` suffix. `describe(param)` feeds the mission briefing.
     */
    const RULES = {
        support: {
            id: 'support',
            label: 'Supported stacking',
            defaultParam: 1,
            describe: function (p) {
                return p >= 1
                    ? 'Every unit must be fully supported from below.'
                    : 'Units need at least ' + Math.round(p * 100) + '% support from below.';
            },
            check: function (ctx) {
                if (ctx.support.ratio + 1e-9 >= ctx.param) return null;
                return 'Only ' + Math.round(ctx.support.ratio * 100) + '% supported — needs ' +
                       Math.round(ctx.param * 100) + '%.';
            }
        },

        /**
         * The one rule core/ cannot decide.
         *
         * A mission that declares `physics` drops the support rule and lets the
         * simulation answer instead: place what you like, and if the stack will
         * not hold, it comes down. Nothing is lost when it does — the cargo
         * stays in the yard and keeps counting, from wherever it stopped. The
         * cost is the envelope, which is the box around everything placed and
         * therefore grows with every metre a unit slides away from the pile.
         *
         * `check()` always passes because the verdict arrives *after* the
         * placement, not before — and because deciding it needs a rigid-body
         * solver, which needs THREE, which core/ may never touch. The entry
         * exists so the mission card, the briefing and the how-to describe it
         * like any other rule; game/missionPhysics.js does the enforcing.
         */
        physics: {
            id: 'physics',
            label: 'Live physics',
            defaultParam: 1,
            describe: function () {
                return 'No support rule — the stack is simulated. Overhang what you dare. ' +
                       'Anything that falls stays where it lands and still counts, so a ' +
                       'collapse costs you the envelope it sprawls into.';
            },
            check: function () { return null; }
        },

        maxTier: {
            id: 'maxTier',
            label: 'Crane reach',
            defaultParam: 4,
            describe: function (p) { return 'Crane reaches tier ' + p + '. No stacking higher.'; },
            check: function (ctx) {
                if (ctx.tier < ctx.param) return null;
                return 'Above crane reach — tier ' + (ctx.tier + 1) + ' of ' + ctx.param + ' max.';
            }
        },

        noTopLoad: {
            id: 'noTopLoad',
            label: 'No top loading',
            describe: function () { return 'Tank containers cannot carry a stack.'; },
            check: function (ctx) {
                for (let i = 0; i < ctx.support.ids.length; i++) {
                    const below = ctx.grid.placements[ctx.support.ids[i]];
                    const type = below && C.CARGO_TYPES[below.type];
                    if (type && type.noTopLoad) {
                        return 'Nothing may be stacked on a ' + type.label + '.';
                    }
                }
                return null;
            }
        },

        heavyBelow: {
            id: 'heavyBelow',
            label: 'Heavy at the bottom',
            describe: function () { return 'A unit may not rest on anything lighter than itself.'; },
            check: function (ctx) {
                const mass = ctx.unit.massT || 0;
                for (let i = 0; i < ctx.support.ids.length; i++) {
                    const below = ctx.grid.placements[ctx.support.ids[i]];
                    const belowMass = below && below.unit ? (below.unit.massT || 0) : 0;
                    if (mass > belowMass + 1e-6) {
                        return mass.toFixed(1) + ' t cannot sit on a ' + belowMass.toFixed(1) + ' t unit.';
                    }
                }
                return null;
            }
        },

        hazmatGap: {
            id: 'hazmatGap',
            label: 'Dangerous goods separation',
            describe: function () { return 'Two hazmat units may not share a face on the same tier.'; },
            check: function (ctx) {
                if (!hasTrait(ctx.unit, 'hazmat')) return null;
                const ids = ctx.grid.neighboursAt(ctx.cells, ctx.tier);
                for (let i = 0; i < ids.length; i++) {
                    const other = ctx.grid.placements[ids[i]];
                    if (other && hasTrait(other.unit, 'hazmat')) {
                        return 'Hazmat cannot touch hazmat — ' + (other.unit.label || other.type) + ' is adjacent.';
                    }
                }
                return null;
            }
        },

        reeferEdge: {
            id: 'reeferEdge',
            label: 'Reefer power points',
            describe: function () { return 'Reefers need a cell on the bay edge to reach a power point.'; },
            check: function (ctx) {
                if (!hasTrait(ctx.unit, 'reefer')) return null;
                if (ctx.grid.touchesPerimeter(ctx.cells)) return null;
                return 'Reefer needs to reach a bay-edge power point.';
            }
        },

        departureOrder: {
            id: 'departureOrder',
            label: 'Departure order',
            describe: function () { return 'Never stack over cargo that leaves earlier than yours.'; },
            check: function (ctx) {
                const day = ctx.unit.departure || 0;
                if (!day) return null;

                const ids = ctx.grid.idsUnder(ctx.cells, ctx.tier);
                for (let i = 0; i < ids.length; i++) {
                    const below = ctx.grid.placements[ids[i]];
                    const belowDay = below && below.unit ? (below.unit.departure || 0) : 0;
                    if (belowDay && belowDay < day) {
                        return 'Would bury a ' + dayLabel(belowDay) + ' departure under a ' +
                               dayLabel(day) + ' one.';
                    }
                }
                return null;
            }
        }
    };

    /** 'maxTier:3' → { rule, param: 3 }. Unknown ids resolve to null. */
    function parseRule(spec) {
        const parts = String(spec).split(':');
        const rule = RULES[parts[0]];
        if (!rule) return null;

        let param = parts.length > 1 ? parseFloat(parts[1]) : rule.defaultParam;
        if (param === undefined || isNaN(param)) param = rule.defaultParam;
        return { rule: rule, param: param };
    }

    /** Mission briefing lines: [{label, text}]. */
    function describeRules(specs) {
        const out = [];
        (specs || []).forEach(function (spec) {
            const parsed = parseRule(spec);
            if (!parsed) return;
            out.push({ id: parsed.rule.id, label: parsed.rule.label, text: parsed.rule.describe(parsed.param) });
        });
        return out;
    }

    /**
     * Can this unit go here?
     *
     * @param {YardGrid} grid
     * @param {object} unit manifest unit
     * @param {{x:number, z:number, tier:number, rot:number}} pos
     * @param {string[]} specs mission rule strings
     * @returns {{ok:boolean, reason:string|null, violations:object[], support:object|null, cells:Array|null}}
     */
    function validate(grid, unit, pos, specs) {
        const cells = grid.absCells(unit.type, pos.rot, pos.x, pos.z);
        if (!cells) {
            return { ok: false, reason: 'Outside the bay.', violations: [{ id: 'fit', message: 'Outside the bay.' }], support: null, cells: null };
        }
        if (pos.tier < 0 || pos.tier >= grid.tiers) {
            return { ok: false, reason: 'Stack is at the bay height limit.', violations: [{ id: 'fit', message: 'Stack is at the bay height limit.' }], support: null, cells: cells };
        }
        if (!grid.cellsFree(cells, pos.tier)) {
            return { ok: false, reason: 'Slot is occupied.', violations: [{ id: 'fit', message: 'Slot is occupied.' }], support: null, cells: cells };
        }

        const support = grid.supportInfo(cells, pos.tier);
        const ctx = {
            grid: grid, unit: unit, cells: cells,
            x: pos.x, z: pos.z, tier: pos.tier, rot: pos.rot,
            support: support, param: 0
        };

        const violations = [];
        (specs || []).forEach(function (spec) {
            const parsed = parseRule(spec);
            if (!parsed) return;
            ctx.param = parsed.param;
            const message = parsed.rule.check(ctx);
            if (message) violations.push({ id: parsed.rule.id, label: parsed.rule.label, message: message });
        });

        return {
            ok: violations.length === 0,
            reason: violations.length ? violations[0].message : null,
            violations: violations,
            support: support,
            cells: cells
        };
    }

    /**
     * Is there anywhere at all this unit can go? Used to detect a dead end so
     * the game can offer a rewind instead of silently stranding the player.
     */
    function hasLegalPlacement(grid, unit, specs) {
        for (let rot = 0; rot < 2; rot++) {
            const sp = C.span(unit.type, rot);
            for (let x = 0; x <= grid.cols - sp[0]; x++) {
                for (let z = 0; z <= grid.rows - sp[1]; z++) {
                    const tier = grid.restTier(unit.type, rot, x, z);
                    if (tier === null || tier < 0) continue;
                    if (validate(grid, unit, { x: x, z: z, tier: tier, rot: rot }, specs).ok) return true;
                }
            }
        }
        return false;
    }

    Cargo3D.Rules = {
        RULES: RULES,
        parseRule: parseRule,
        describeRules: describeRules,
        validate: validate,
        hasLegalPlacement: hasLegalPlacement,
        hasTrait: hasTrait
    };
})(typeof window !== 'undefined' ? window : globalThis);
