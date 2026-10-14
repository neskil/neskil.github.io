// Timed runs: the clock, the score, and the table of best scores. Pure
// logic (localStorage only, like save.js and stats.js).
//
// A run's mode (SC.RUN_MODES) is fixed at new-game. Endless runs never end
// here — only foreclosure ends them. A timed run ends when sim time reaches
// SC.state.runLimit: the sim freezes (main.js checks runOver the way it
// checks gameOver), the score is filed against its board, and 'runComplete'
// carries the result to the summary screen. Sim time is the clock, so
// fast-forward shortens the wait without changing the game.
window.SC = window.SC || {};

SC.run = (function() {
    const BEST_KEY = 'scTycoonBest.v1';
    const DAILY_KEEP = 30; // daily boards older than this many days are pruned

    function mode() {
        return SC.RUN_MODES[SC.state.runMode] || SC.RUN_MODES.endless;
    }

    function isTimed() {
        return !!SC.state.runLimit;
    }

    function timeLeft() {
        return isTimed() ? Math.max(0, SC.state.runLimit - SC.state.time) : Infinity;
    }

    // Profit at the bell: cash minus what the difficulty handed you at the
    // start, so the starting balance isn't counted as an achievement and
    // spending only scores if it has paid itself back by the end.
    function score() {
        return Math.round(SC.state.money - SC.DIFFICULTIES[SC.state.difficulty].startMoney);
    }

    // Local calendar date, so "today" turns over at the player's midnight.
    function todayKey(d) {
        d = d || new Date();
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    function dailySeed(dateKey) {
        return 'daily-' + (dateKey || todayKey());
    }

    // Which table a score is filed under: one per day for the daily (its
    // map and difficulty are fixed, so the scores are comparable), one per
    // difficulty for the plain timed challenge.
    function boardKey() {
        const st = SC.state;
        if (st.runMode === 'daily') return 'daily:' + (st.dailyDate || todayKey());
        if (st.runMode === 'challenge') return 'challenge:' + st.difficulty;
        return null;
    }

    function loadBests() {
        try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {}; }
        catch (e) { return {}; }
    }

    function saveBests(bests) {
        const daily = Object.keys(bests).filter(k => k.startsWith('daily:')).sort();
        for (const k of daily.slice(0, Math.max(0, daily.length - DAILY_KEEP))) delete bests[k];
        try { localStorage.setItem(BEST_KEY, JSON.stringify(bests)); }
        catch (e) { /* quota/private mode — the score just isn't remembered */ }
    }

    function best(key) {
        const v = loadBests()[key || boardKey()];
        return typeof v === 'number' ? v : null;
    }

    function finish() {
        const st = SC.state;
        st.runOver = true;
        const s = score();
        const key = boardKey();
        const bests = loadBests();
        const prevBest = typeof bests[key] === 'number' ? bests[key] : null;
        const isBest = prevBest === null || s > prevBest;
        if (isBest) {
            bests[key] = s;
            saveBests(bests);
        }
        SC.emit('runComplete', { score: s, prevBest, best: isBest ? s : prevBest, isBest });
    }

    function tick() {
        const st = SC.state;
        if (!isTimed() || st.runOver || st.gameOver) return;
        if (st.time >= st.runLimit) finish();
    }

    // One line to paste somewhere, e.g. for comparing dailies with friends.
    function shareText() {
        const st = SC.state;
        const s = score();
        const money = (s < 0 ? '−$' : '+$') + Math.abs(s).toLocaleString('en-US');
        const what = st.runMode === 'daily'
            ? `📅 Daily ${st.dailyDate || todayKey()}`
            : `⏱️ ${mode().minutes}-min challenge (${SC.DIFFICULTIES[st.difficulty].label})`;
        return `Supply Chain Tycoon ${what}: ${money} profit, ${st.delivered} orders filled`;
    }

    return { mode, isTimed, timeLeft, score, todayKey, dailySeed, boardKey,
             best, finish, tick, shareText, BEST_KEY };
})();
