/**
 * core/storage.js — campaign progress and settings.
 *
 * One localStorage key, one shape, versioned. The portfolio landing page reads
 * the same key to show medals on the card, so treat the schema as public: bump
 * SAVE_VERSION and migrate rather than repurposing fields.
 *
 * Falls back to an in-memory store when localStorage is unavailable (private
 * mode, or a browser that blocks storage on file:// URLs) so the game still
 * plays; progress just doesn't survive a reload.
 */
(function (global) {
    'use strict';

    const Cargo3D = global.Cargo3D = global.Cargo3D || {};

    const SAVE_KEY = 'cargo3d.save.v1';
    const SAVE_VERSION = 1;

    let memoryFallback = null;

    function blank() {
        return {
            version: SAVE_VERSION,
            missions: {},
            settings: { muted: false, weather: 'day', showGrid: true },
            stats: { unitsPlaced: 0, missionsRun: 0 },
            // Physics tower challenge — see game/physicsMode.js. Additive, so a
            // save written before the mode existed still reads at version 1.
            physics: { bestHeight: 0, bestUnits: 0, runs: 0 },
            // Sandbox contract economy — see core/contracts.js. Only the
            // durable parts are stored; the active order is not resumed.
            contracts: null
        };
    }

    function read() {
        if (memoryFallback) return memoryFallback;
        try {
            const raw = global.localStorage && global.localStorage.getItem(SAVE_KEY);
            if (!raw) return blank();
            const data = JSON.parse(raw);
            if (!data || data.version !== SAVE_VERSION) return blank();
            data.missions = data.missions || {};
            data.settings = Object.assign(blank().settings, data.settings || {});
            data.stats = Object.assign(blank().stats, data.stats || {});
            data.physics = Object.assign(blank().physics, data.physics || {});
            return data;
        } catch (e) {
            return blank();
        }
    }

    function write(data) {
        try {
            if (!global.localStorage) throw new Error('no localStorage');
            global.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
            memoryFallback = null;
        } catch (e) {
            memoryFallback = data;
        }
        return data;
    }

    function missionRecord(missionId) {
        const data = read();
        return data.missions[missionId] || null;
    }

    /**
     * Merge an attempt into the save. Only improvements overwrite the best.
     * @param {object} result from Scoring.buildResult
     * @returns {{record:object, improved:boolean, previousBest:number|null}}
     */
    function recordResult(result) {
        const data = read();
        const prev = data.missions[result.missionId] || { plays: 0, best: null, medal: null, completed: false };
        const previousBest = prev.best;

        const improved = result.complete && (prev.best === null || result.envelope < prev.best - 1e-6);

        const record = {
            plays: (prev.plays || 0) + 1,
            best: improved ? result.envelope : prev.best,
            medal: improved ? result.medal : (bestMedal(prev.medal, result.complete ? result.medal : null)),
            completed: prev.completed || result.complete,
            lastEnvelope: result.envelope,
            par: result.par,
            updatedAt: Date.now()
        };

        data.missions[result.missionId] = record;
        data.stats.missionsRun = (data.stats.missionsRun || 0) + 1;
        data.stats.unitsPlaced = (data.stats.unitsPlaced || 0) + result.placed;
        write(data);

        return { record: record, improved: improved, previousBest: previousBest };
    }

    const MEDAL_RANK = { gold: 3, silver: 2, bronze: 1 };

    function bestMedal(a, b) {
        return (MEDAL_RANK[b] || 0) > (MEDAL_RANK[a] || 0) ? b : (a || null);
    }

    /** A mission is open once the one before it has been completed. */
    function isUnlocked(campaign, missionId) {
        const at = campaign.findIndex(function (m) { return m.id === missionId; });
        if (at <= 0) return true;
        const prev = missionRecord(campaign[at - 1].id);
        return !!(prev && prev.completed);
    }

    /** Durable half of the contract economy: capital, reputation, upgrades. */
    function getContracts() {
        return read().contracts;
    }

    function saveContracts(state) {
        const data = read();
        data.contracts = state ? {
            money: state.money,
            delivered: state.delivered,
            rating: state.rating,
            upgrades: Object.assign({}, state.upgrades)
        } : null;
        write(data);
        return data.contracts;
    }

    /** Best tower the physics challenge has ever produced. */
    function getPhysics() {
        return read().physics;
    }

    /**
     * Merge a finished tower run into the save. Only a taller tower overwrites.
     * @param {{height:number, units:number}} run
     * @returns {{best:object, improved:boolean, previousBest:number}}
     */
    function recordTower(run) {
        const data = read();
        const prev = data.physics;
        const previousBest = prev.bestHeight || 0;
        const improved = run.height > previousBest + 1e-6;

        data.physics = {
            bestHeight: improved ? run.height : previousBest,
            bestUnits: improved ? run.units : (prev.bestUnits || 0),
            runs: (prev.runs || 0) + 1
        };
        write(data);

        return { best: data.physics, improved: improved, previousBest: previousBest };
    }

    function getSettings() {
        return read().settings;
    }

    function saveSettings(patch) {
        const data = read();
        data.settings = Object.assign(data.settings, patch || {});
        write(data);
        return data.settings;
    }

    /** Headline numbers — used by the mission select header and the portfolio card. */
    function summary(campaign) {
        const data = read();
        let gold = 0, silver = 0, bronze = 0, completed = 0, bestRatio = null;

        (campaign || []).forEach(function (mission) {
            const rec = data.missions[mission.id];
            if (!rec) return;
            if (rec.completed) completed++;
            if (rec.medal === 'gold') gold++;
            else if (rec.medal === 'silver') silver++;
            else if (rec.medal === 'bronze') bronze++;
            if (rec.best && rec.par) {
                const ratio = rec.best / rec.par;
                if (bestRatio === null || ratio < bestRatio) bestRatio = ratio;
            }
        });

        return {
            gold: gold, silver: silver, bronze: bronze,
            medals: gold + silver + bronze,
            completed: completed,
            total: (campaign || []).length,
            bestRatio: bestRatio,
            unitsPlaced: data.stats.unitsPlaced || 0
        };
    }

    function resetProgress() {
        return write(blank());
    }

    Cargo3D.Storage = {
        SAVE_KEY: SAVE_KEY,
        SAVE_VERSION: SAVE_VERSION,
        read: read,
        write: write,
        missionRecord: missionRecord,
        recordResult: recordResult,
        isUnlocked: isUnlocked,
        getContracts: getContracts,
        saveContracts: saveContracts,
        getPhysics: getPhysics,
        recordTower: recordTower,
        getSettings: getSettings,
        saveSettings: saveSettings,
        summary: summary,
        resetProgress: resetProgress
    };
})(typeof window !== 'undefined' ? window : globalThis);
