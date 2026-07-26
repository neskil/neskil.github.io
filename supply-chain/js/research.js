// Research tree: one project at a time by default, two once a Research
// Lab is built. Late-tier techs (`needsLab` in SC.RESEARCH) also require
// the lab. Paid upfront, takes time, then unlocks its effect. Pure logic.
window.SC = window.SC || {};

SC.research = (function() {
    function hasBuilding() {
        if (!SC.state || !SC.state.nodes) return false;
        return SC.state.nodes.some(n => n.kind === 'researchLab' && n.active && !n.underConstruction);
    }

    // Without a lab you can still run one project at a time; the lab
    // buys a second concurrent slot (and is the only way into the
    // `needsLab` late-tier techs, see needsLab below).
    function maxSlots() {
        return hasBuilding() ? 2 : 1;
    }

    // Late-tier techs are gated on the building; early ones are not.
    function needsLab(id) {
        const t = SC.RESEARCH[id];
        return !!(t && t.needsLab);
    }

    function labSatisfied(id) {
        return !needsLab(id) || hasBuilding();
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

    function queueList() {
        if (!SC.state || !SC.state.research) return [];
        if (!Array.isArray(SC.state.research.queue)) {
            SC.state.research.queue = [];
        }
        return SC.state.research.queue;
    }

    function queueCount() {
        return queueList().length;
    }

    function isQueued(id) {
        return queueList().includes(id);
    }

    function isAvailable(id) {
        const t = SC.RESEARCH[id];
        if (!t || isDone(id)) return false;
        return t.requires.every(isDone);
    }

    function isQueueable(id) {
        const t = SC.RESEARCH[id];
        if (!t || isDone(id) || isActive(id) || isQueued(id)) return false;
        if (!labSatisfied(id)) return false;
        return t.requires.every(req => isDone(req) || isActive(req) || isQueued(req));
    }

    function canStart(id) {
        return labSatisfied(id) && activeCount() < maxSlots() && isAvailable(id) && !isActive(id) && !isQueued(id) && SC.canAfford(SC.RESEARCH[id].cost);
    }

    function canQueue(id) {
        return isQueueable(id) && SC.canAfford(SC.RESEARCH[id].cost);
    }

    function enqueue(id) {
        if (!canQueue(id)) return { ok: false };
        SC.state.money -= SC.RESEARCH[id].cost;
        queueList().push(id);
        SC.emit('researchQueued', id);
        return { ok: true };
    }

    function cancelQueue(id) {
        if (!isQueued(id)) return { ok: false };
        const q = queueList();
        const idx = q.indexOf(id);
        if (idx === -1) return { ok: false };

        q.splice(idx, 1);
        if (SC.RESEARCH[id]) {
            SC.state.money += SC.RESEARCH[id].cost;
        }

        let removed;
        do {
            removed = false;
            for (let i = 0; i < q.length; i++) {
                const qId = q[i];
                const t = SC.RESEARCH[qId];
                if (t && !t.requires.every(req => isDone(req) || isActive(req) || q.slice(0, i).includes(req))) {
                    q.splice(i, 1);
                    SC.state.money += t.cost;
                    SC.emit('researchQueueCancelled', qId);
                    removed = true;
                    break;
                }
            }
        } while (removed);

        SC.emit('researchQueueCancelled', id);
        return { ok: true };
    }

    function start(id) {
        if (canStart(id)) {
            SC.state.money -= SC.RESEARCH[id].cost;
            if (!Array.isArray(SC.state.research.active)) {
                SC.state.research.active = activeList();
            }
            SC.state.research.active.push({ id, t: 0 });
            SC.emit('researchStarted', id);
            return { ok: true };
        } else if (activeCount() >= maxSlots() && canQueue(id)) {
            return enqueue(id);
        }
        return { ok: false };
    }

    function progress(id) {
        const a = activeList().find(item => item.id === id);
        if (!a || !SC.RESEARCH[id]) return 0;
        return Math.min(1, a.t / SC.RESEARCH[id].time);
    }

    function tick(dt) {
        const active = activeList();
        if (active.length) {
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

        const q = queueList();
        while (activeCount() < maxSlots() && q.length > 0) {
            const idx = q.findIndex(qId => {
                const t = SC.RESEARCH[qId];
                return t && t.requires.every(isDone);
            });
            if (idx === -1) break;
            const readyId = q.splice(idx, 1)[0];
            if (!Array.isArray(SC.state.research.active)) {
                SC.state.research.active = activeList();
            }
            SC.state.research.active.push({ id: readyId, t: 0 });
            SC.emit('researchStarted', readyId);
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

    return { hasBuilding, needsLab, labSatisfied, maxSlots, activeList, activeCount, activeIds, activeId, isActive,
             queueList, queueCount, isQueued, isQueueable, canQueue, enqueue, cancelQueue,
             isDone, isAvailable, canStart, start, progress, tick,
             creditBonus, payoutBonus, deadlineBonus, supplierRegenBonus,
             graceBonus, orderCapBonus,
             customerSpawnMult, upkeepMult, interestMult, upgradeMaxBonus };
})();
