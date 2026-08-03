(function (window) {
    'use strict';

    // Progress lives in one localStorage key. Everything here is defensive:
    // the page is served from GitHub Pages and opened from file:// during
    // development, and in the latter some browsers throw on access rather than
    // returning null.
    const CY = window.CY = window.CY || {};

    const KEY = 'cy.progress.v1';

    function blank() {
        return {
            version: 1,
            missions: {},              // id -> { stars, best, plays }
            settings: { audio: true, weather: 'day' }
        };
    }

    function store() {
        try {
            return window.localStorage;
        } catch (err) {
            return null;
        }
    }

    function load() {
        const ls = store();
        if (!ls) return blank();
        try {
            const raw = ls.getItem(KEY);
            if (!raw) return blank();
            const data = JSON.parse(raw);
            if (!data || data.version !== 1) return blank();
            data.missions = data.missions || {};
            data.settings = Object.assign(blank().settings, data.settings || {});
            return data;
        } catch (err) {
            return blank();
        }
    }

    function save(data) {
        const ls = store();
        if (!ls) return false;
        try {
            ls.setItem(KEY, JSON.stringify(data));
            return true;
        } catch (err) {
            return false;
        }
    }

    // Only ever improves a record — replaying a mission badly must not cost you
    // the medal you already earned.
    function record(missionId, stars, score) {
        const data = load();
        const prev = data.missions[missionId] || { stars: 0, best: Infinity, plays: 0 };
        data.missions[missionId] = {
            stars: Math.max(prev.stars, stars),
            best: Math.min(prev.best === null ? Infinity : prev.best, score),
            plays: (prev.plays || 0) + 1
        };
        // Infinity does not survive JSON.
        if (!isFinite(data.missions[missionId].best)) data.missions[missionId].best = score;
        save(data);
        return data;
    }

    function setSetting(key, value) {
        const data = load();
        data.settings[key] = value;
        save(data);
        return data.settings;
    }

    function reset() {
        const ls = store();
        if (ls) { try { ls.removeItem(KEY); } catch (err) { /* ignore */ } }
        return blank();
    }

    CY.save = {
        KEY: KEY,
        blank: blank,
        load: load,
        write: save,
        record: record,
        setSetting: setSetting,
        reset: reset
    };

})(window);
