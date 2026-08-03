/**
 * missions/missionSchema.js — the shape of a mission, and a validator for it.
 *
 * Missions are data. This file is the contract they have to honour, and the
 * check that tests.html runs over the whole campaign so a broken mission is
 * caught offline rather than by a player.
 *
 *   {
 *     id:      'm03',                       // unique, stable — save keys use it
 *     name:    'Reach Limit',
 *     tagline: 'The crane only goes so high.',
 *     brief:   'Longer prose for the briefing card.',
 *     teaches: 'One line naming the new idea.',
 *     bay:     { cols: 5, rows: 4, tiers: 2 },   // X, Z, Y in grid cells
 *     rules:   ['support:1', 'maxTier:2'],       // see core/rules.js
 *     units:   [{ type:'40ft', count:3, traits:['heavy'], load:0.9 }],
 *     generate:{ count:12, weights:{...}, traits:{...}, departures:[1,2,3] },
 *     seed:    1103,                          // omit → derived from id
 *     shuffle: true,                          // arrival order randomised
 *     medals:  { gold:1.10, silver:1.30, bronze:1.60 },  // × par
 *     weather: 'day'
 *   }
 *
 * Par is computed from the manifest (core/scoring.js), never authored — which
 * is why adding a mission needs no balancing pass.
 */
(function (global) {
    'use strict';

    const Cargo3D = global.Cargo3D = global.Cargo3D || {};
    const C = Cargo3D.Constants;

    const DEFAULTS = {
        tagline: '',
        brief: '',
        teaches: '',
        rules: ['support:1'],
        weather: 'day',
        shuffle: true
    };

    function normalise(mission) {
        const out = Object.assign({}, DEFAULTS, mission);
        out.bay = Object.assign({ cols: 5, rows: 4, tiers: 3 }, mission.bay || {});
        out.medals = Object.assign({}, Cargo3D.Scoring.DEFAULT_MEDALS, mission.medals || {});
        return out;
    }

    /**
     * @returns {string[]} problems; empty means the mission is well-formed
     */
    function validateMission(mission) {
        const problems = [];
        const m = normalise(mission);

        if (!m.id) problems.push('mission has no id');
        if (!m.name) problems.push(m.id + ': no name');

        ['cols', 'rows', 'tiers'].forEach(function (k) {
            if (!(m.bay[k] > 0)) problems.push(m.id + ': bay.' + k + ' must be positive');
        });

        (m.rules || []).forEach(function (spec) {
            if (!Cargo3D.Rules.parseRule(spec)) problems.push(m.id + ': unknown rule "' + spec + '"');
        });

        const units = Cargo3D.Manifest.build(m);
        if (!units.length) problems.push(m.id + ': manifest is empty');

        units.forEach(function (u) {
            const type = C.CARGO_TYPES[u.type];
            if (!type) problems.push(m.id + ': unknown cargo type "' + u.type + '"');
            else if (!type.gridPiece) problems.push(m.id + ': "' + u.type + '" is not a grid piece');
        });

        // Every unit has to physically fit, allowing for a crane-reach rule that
        // shortens the usable stack.
        let usableTiers = m.bay.tiers;
        (m.rules || []).forEach(function (spec) {
            const parsed = Cargo3D.Rules.parseRule(spec);
            if (parsed && parsed.rule.id === 'maxTier') usableTiers = Math.min(usableTiers, parsed.param);
        });

        const needed = Cargo3D.Scoring.cellsFor(units);
        const capacity = m.bay.cols * m.bay.rows * usableTiers;
        if (needed > capacity) {
            problems.push(m.id + ': manifest needs ' + needed + ' cells but the bay holds ' + capacity);
        }

        // A unit longer than the bay in both axes can never be placed.
        units.forEach(function (u) {
            const a = C.span(u.type, 0);
            const b = C.span(u.type, 1);
            const fitsA = a[0] <= m.bay.cols && a[1] <= m.bay.rows;
            const fitsB = b[0] <= m.bay.cols && b[1] <= m.bay.rows;
            if (!fitsA && !fitsB) problems.push(m.id + ': ' + u.type + ' does not fit the bay in any rotation');
        });

        return problems;
    }

    function validateCampaign(campaign) {
        const problems = [];
        const seen = {};

        campaign.forEach(function (mission) {
            if (seen[mission.id]) problems.push('duplicate mission id "' + mission.id + '"');
            seen[mission.id] = true;
            Array.prototype.push.apply(problems, validateMission(mission));
        });

        return problems;
    }

    Cargo3D.MissionSchema = {
        DEFAULTS: DEFAULTS,
        normalise: normalise,
        validateMission: validateMission,
        validateCampaign: validateCampaign
    };
})(typeof window !== 'undefined' ? window : globalThis);
