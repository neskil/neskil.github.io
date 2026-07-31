// High score chips on the project cards. Each game writes its own progress to
// localStorage under its own key and its own shape; this module reads those
// keys back and turns them into the little chip in the card's top-right
// corner.
//
// The readers are pure — raw string in, chip descriptor out — so the parsing
// can be tested without a page (see tests.html), and so a game changing its
// save format is a one-function change here. A reader never throws: a missing
// or corrupt save just yields the em-dash placeholder the markup ships with.
window.HOME = window.HOME || {};

HOME.stats = (function () {
    const EMPTY = '—';

    function chip(icon, label, value, note) {
        return { icon, label: label || '', value, note: note || '' };
    }

    function parseJSON(raw) {
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (e) { return null; }
    }

    function toInt(raw) {
        const n = parseInt(raw || '0', 10);
        return Number.isFinite(n) ? n : 0;
    }

    // Supply Chain Tycoon: total earned plus a delivery count. Older saves
    // only had `money`, so fall back to it when `earnedTotal` is absent.
    function supplyChainChip(raw) {
        const data = parseJSON(raw);
        const earned = (data && (data.earnedTotal || data.money)) || 0;
        const delivered = (data && data.delivered) || 0;
        if (earned <= 0 && delivered <= 0) return chip('🏆', '', EMPTY);
        return chip('🏆', '', '$' + earned.toLocaleString(), `(${delivered} orders)`);
    }

    // CargoLander keeps per-level bests, historically as bare numbers and
    // later as {score: n} objects — both shapes still exist in the wild, so
    // take the highest of whatever is there. With no runs recorded yet, the
    // pilot's cash balance is the next most interesting number.
    function cargoLanderChip(scoresRaw, cashRaw) {
        const scores = parseJSON(scoresRaw);
        let topScore = 0;
        if (scores) {
            for (const k in scores) {
                const entry = scores[k];
                if (typeof entry === 'number') topScore = Math.max(topScore, entry);
                else if (entry && typeof entry.score === 'number') topScore = Math.max(topScore, entry.score);
            }
        }
        if (topScore > 0) return chip('🚀', 'High Score', topScore.toLocaleString() + ' pts');

        const cash = toInt(cashRaw);
        if (cash > 0) return chip('🚀', 'Pilot Cash', '$' + cash.toLocaleString());

        return chip('🚀', 'High Score', EMPTY);
    }

    function mentalMathChip(raw) {
        const score = toInt(raw);
        return chip('⚡', 'High Score', score > 0 ? score + ' pts' : EMPTY);
    }

    function chipHTML(c) {
        const label = c.label ? ' ' + c.label + ':' : '';
        const note = c.note ? ` <span class="stat-note">${c.note}</span>` : '';
        return `<span class="stat-icon">${c.icon}</span>${label} <span class="stat-val">${c.value}</span>${note}`;
    }

    function render(elementId, c) {
        const el = document.getElementById(elementId);
        if (el) el.innerHTML = chipHTML(c);
    }

    // localStorage itself throws in a few privacy configurations, so each read
    // is guarded rather than trusted.
    function read(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    function init() {
        render('stat-supply-chain', supplyChainChip(read('scTycoonSave.v1')));
        render('stat-cargo-lander', cargoLanderChip(read('cargoLanderHighscores'), read('cargoLanderCash')));
        render('stat-math-game', mentalMathChip(read('mentalMathHighScore')));
    }

    return { init, supplyChainChip, cargoLanderChip, mentalMathChip, chipHTML, EMPTY };
})();
