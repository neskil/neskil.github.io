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

    // Sum a numeric effect field across completed research. Additive
    // effects (creditBonus, payoutBonus, ...) all use this shape.
    function bonusSum(field) {
        let b = 0;
        for (const id in SC.state.research.completed) {
            const t = SC.RESEARCH[id];
            if (t && t[field]) b += t[field];
        }
        return b;
    }

    // Read by SC.creditLimit / economy.spawnOrder / SC.supplierRegen.
    function creditBonus() { return bonusSum('creditBonus'); }
    function payoutBonus() { return bonusSum('payoutBonus'); }
    function deadlineBonus() { return bonusSum('deadlineBonus'); }
    function supplierRegenBonus() { return bonusSum('supplierRegenBonus'); }
    // Extra seconds on the foreclosure grace clock (Debt Restructuring).
    function graceBonus() { return bonusSum('graceBonus'); }
    // Extra concurrent orders (Logistics AI) — economy.maxActiveOrders.
    function orderCapBonus() { return bonusSum('orderCapBonus'); }

    // Multiplicative effects: the product of that field across every
    // completed tech (1 when none apply). customerSpawnMult shortens the
    // wait for new customer DCs, upkeepMult cuts the per-minute operating
    // drain, interestMult cuts what debt costs per minute.
    function multOf(field) {
        let m = 1;
        for (const id in SC.state.research.completed) {
            const t = SC.RESEARCH[id];
            if (t && t[field]) m *= t[field];
        }
        return m;
    }

    function customerSpawnMult() { return multOf('customerSpawnMult'); }
    function upkeepMult() { return multOf('upkeepMult'); }
    function interestMult() { return multOf('interestMult'); }

    // Extra upgrade levels unlocked for `key` (e.g. Overdrive Engines
    // adds { truckSpeed: 3 }) — read by SC.upgradeMax.
    function upgradeMaxBonus(key) {
        let b = 0;
        for (const id in SC.state.research.completed) {
            const t = SC.RESEARCH[id];
            if (t && t.upgradeMaxBonus && t.upgradeMaxBonus[key]) b += t.upgradeMaxBonus[key];
        }
        return b;
    }

    return { isDone, isAvailable, activeId, canStart, start, progress, tick,
             creditBonus, payoutBonus, deadlineBonus, supplierRegenBonus,
             graceBonus, orderCapBonus,
             customerSpawnMult, upkeepMult, interestMult, upgradeMaxBonus };
})();
