// Research tree: one project active at a time, paid upfront, takes time,
// then unlocks its effect (see SC.RESEARCH in config.js). Pure logic.
window.SC = window.SC || {};

SC.research = (function() {
    function isDone(id) {
        return !!SC.state.research.completed[id];
    }

    function isAvailable(id) {
        const t = SC.RESEARCH[id];
        if (!t || isDone(id)) return false;
        return t.requires.every(isDone);
    }

    function activeId() {
        const a = SC.state.research.active;
        return a ? a.id : null;
    }

    function canStart(id) {
        return isAvailable(id) && !SC.state.research.active && SC.canAfford(SC.RESEARCH[id].cost);
    }

    function start(id) {
        if (!canStart(id)) return { ok: false };
        SC.state.money -= SC.RESEARCH[id].cost;
        SC.state.research.active = { id, t: 0 };
        SC.emit('researchStarted', id);
        return { ok: true };
    }

    function progress(id) {
        const a = SC.state.research.active;
        if (!a || a.id !== id) return 0;
        return Math.min(1, a.t / SC.RESEARCH[id].time);
    }

    function tick(dt) {
        const a = SC.state.research.active;
        if (!a) return;
        a.t += dt;
        const t = SC.RESEARCH[a.id];
        if (a.t >= t.time) {
            SC.state.research.completed[a.id] = true;
            SC.state.research.active = null;
            SC.emit('researchComplete', a.id);
        }
    }

    // Sum of creditBonus across completed research — read by SC.creditLimit.
    function creditBonus() {
        let b = 0;
        for (const id in SC.state.research.completed) {
            const t = SC.RESEARCH[id];
            if (t && t.creditBonus) b += t.creditBonus;
        }
        return b;
    }

    return { isDone, isAvailable, activeId, canStart, start, progress, tick, creditBonus };
})();
