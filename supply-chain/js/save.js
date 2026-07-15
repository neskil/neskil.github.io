// Autosave / restore via localStorage. Pure logic (localStorage only).
//
// In-flight work is not saved verbatim: on restore, orders come back
// unplanned and the planner rebuilds tasks and haul jobs. Raw materials
// already delivered to (or en route to) a factory are folded into that
// factory's loose inventory so little is lost; products mid-craft or
// mid-delivery are re-crafted.
window.SC = window.SC || {};

SC.save = (function() {
    const KEY = 'scTycoonSave.v1';
    const FORMAT = 2; // v2: emoji goods tree + factory recipes

    function serialize() {
        const st = SC.state;

        // Fold task.have and truck-borne raws back into factory inventory
        const inv = new Map(); // node id -> {mat: count}
        for (const n of st.nodes) {
            if (n.kind !== 'factory') continue;
            const copy = Object.assign({}, n.inv);
            for (const task of n.queue) {
                for (const m of Object.keys(task.have)) {
                    copy[m] = (copy[m] || 0) + task.have[m];
                }
            }
            inv.set(n.id, copy);
        }
        for (const t of st.trucks) {
            if (t.cargo && t.job && t.job.type === 'raw' && inv.has(t.job.drop.id)) {
                const c = inv.get(t.job.drop.id);
                c[t.cargo] = (c[t.cargo] || 0) + 1;
            }
        }

        return {
            v: FORMAT,
            money: st.money, earnedTotal: st.earnedTotal,
            interestPaid: st.interestPaid,
            delivered: st.delivered, missed: st.missed,
            trucksBought: st.trucksBought,
            time: st.time, nextOrderIn: st.nextOrderIn, orderSeq: st.orderSeq,
            nextCustomerIn: st.nextCustomerIn,
            upgrades: Object.assign({}, st.upgrades),
            river: st.river,
            nodes: st.nodes.map(n => ({
                id: n.id, kind: n.kind, x: n.x, y: n.y, mat: n.mat, recipe: n.recipe,
                active: n.active, forSale: n.forSale, isHQ: n.isHQ,
                inv: inv.get(n.id) || {}
            })),
            edges: st.edges.map(e => ({ a: e.a.id, b: e.b.id, cost: e.cost })),
            trucks: st.trucks.map(t => (t.node || st.nodes[0]).id),
            orders: st.orders.map(o => ({
                id: o.id, cityId: o.city.id, product: o.product,
                qty: o.qty, deliveredUnits: o.deliveredUnits, payout: o.payout,
                deadline: o.deadline, deadlineTotal: o.deadlineTotal
            }))
        };
    }

    function restore(data) {
        SC.newState();
        SC.map._resetSeq();
        const st = SC.state;
        st.money = data.money;
        st.earnedTotal = data.earnedTotal;
        st.interestPaid = data.interestPaid || 0;
        st.delivered = data.delivered;
        st.missed = data.missed;
        st.trucksBought = data.trucksBought;
        st.time = data.time;
        st.nextOrderIn = data.nextOrderIn;
        st.orderSeq = data.orderSeq;
        st.nextCustomerIn = data.nextCustomerIn !== undefined ? data.nextCustomerIn : st.nextCustomerIn;
        st.upgrades = Object.assign(st.upgrades, data.upgrades);
        st.river = data.river;

        const byId = new Map();
        for (const nd of data.nodes) {
            const n = SC.map.makeNode(nd.kind, nd.x, nd.y, {
                id: nd.id, mat: nd.mat, recipe: nd.recipe, active: nd.active,
                forSale: nd.forSale, isHQ: nd.isHQ
            });
            n.inv = Object.assign({}, nd.inv);
            byId.set(n.id, n);
        }
        for (const ed of data.edges) {
            const a = byId.get(ed.a), b = byId.get(ed.b);
            if (!a || !b) continue;
            const len = Math.hypot(a.x - b.x, a.y - b.y);
            const bridge = SC.map.segmentCrossesRiver(a.x, a.y, b.x, b.y);
            st.edges.push({ a, b, len, bridge, cost: ed.cost });
            a.edges.push(b);
            b.edges.push(a);
        }
        for (const nodeId of data.trucks) {
            SC.vehicles.addTruck(byId.get(nodeId) || st.nodes[0]);
        }
        for (const od of data.orders) {
            const city = byId.get(od.cityId);
            if (!city) continue;
            st.orders.push({
                id: od.id, city, product: od.product, qty: od.qty,
                deliveredUnits: od.deliveredUnits, payout: od.payout,
                deadline: od.deadline, deadlineTotal: od.deadlineTotal,
                planned: false, noRoute: false, done: false
            });
        }
        SC.economy.onNetworkChanged(); // rebuild plans, tasks and haul jobs
        return st;
    }

    let lastSavedAt = null; // Date.now() of the last successful store

    function store() {
        try {
            localStorage.setItem(KEY, JSON.stringify(serialize()));
            lastSavedAt = Date.now();
        } catch (e) { /* quota/private mode — play on without saving */ }
    }

    function load() {
        let data = null;
        try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* corrupt */ }
        if (!data || data.v !== FORMAT || !data.nodes || !data.river) {
            clear();
            return false;
        }
        try {
            restore(data);
            return true;
        } catch (e) {
            clear();
            return false;
        }
    }

    function exists() {
        return !!localStorage.getItem(KEY);
    }

    function clear() {
        localStorage.removeItem(KEY);
    }

    return { serialize, restore, store, load, exists, clear, KEY,
             getLastSavedAt: () => lastSavedAt };
})();
