// Research tree: research building required, up to 2 concurrent projects active at a time,
// paid upfront, takes time, then unlocks its effect (see SC.RESEARCH in config.js). Pure logic.
window.SC = window.SC || {};

SC.research = (function() {
    function hasBuilding() {
        if (!SC.state || !SC.state.nodes) return false;
        return SC.state.nodes.some(n => n.kind === 'researchLab' && n.active && !n.underConstruction);
    }

    function maxSlots() {
        return hasBuilding() ? 2 : 0;
    }

    function activeList() {
        if (!SC.state || !SC.state.research) return [];
        const a = SC.state.research.active;
        if (!a) return [];
        if (Array.isArray(a)) return a;
        // Legacy single-object fallback
        return [a];
    }

    function activeCount() {
        return activeList().length;
    }

    function activeIds() {
        return activeList().map(a => a.id);
    }

    function activeId() {
        const list = activeList();
        return list.length ? list[0].id : null;
    }

    function isActive(id) {
        return activeList().some(a => a.id === id);
    }

    function isDone(id) {
        return !!(SC.state && SC.state.research && SC.state.research.completed[id]);
    }

    function isAvailable(id) {
        const t = SC.RESEARCH[id];
        if (!t || isDone(id)) return false;
        return t.requires.every(isDone);
    }

    function canStart(id) {
        return hasBuilding() && activeCount() < maxSlots() && isAvailable(id) && !isActive(id) && SC.canAfford(SC.RESEARCH[id].cost);
    }

    function start(id) {
        if (!canStart(id)) return { ok: false };
        SC.state.money -= SC.RESEARCH[id].cost;
        if (!Array.isArray(SC.state.research.active)) {
            SC.state.research.active = activeList();
        }
        SC.state.research.active.push({ id, t: 0 });
        SC.emit('researchStarted', id);
        return { ok: true };
    }

    function progress(id) {
        const a = activeList().find(item => item.id === id);
        if (!a || !SC.RESEARCH[id]) return 0;
        return Math.min(1, a.t / SC.RESEARCH[id].time);
    }

    function tick(dt) {
        const active = activeList();
        if (!active.length) return;
        // Ensure state holds an array
        if (!Array.isArray(SC.state.research.active)) {
            SC.state.research.active = active;
        }
        for (let i = active.length - 1; i >= 0; i--) {
            const a = active[i];
            a.t += dt;
            const t = SC.RESEARCH[a.id];
            if (t && a.t >= t.time) {
                SC.state.research.completed[a.id] = true;
                active.splice(i, 1);
                SC.emit('researchComplete', a.id);
            }
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

    return { hasBuilding, maxSlots, activeList, activeCount, activeIds, activeId, isActive,
             isDone, isAvailable, canStart, start, progress, tick,
             creditBonus, payoutBonus, deadlineBonus, supplierRegenBonus,
             graceBonus, orderCapBonus,
             customerSpawnMult, upkeepMult, interestMult, upgradeMaxBonus };
})();
