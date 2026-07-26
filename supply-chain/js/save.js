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
    const FORMAT = 4; // v4: supplier stock/levels + road upgrade levels

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
            if (t.phase !== 'toDrop') continue; // only already-picked-up cargo counts as "delivered"
            for (const job of t.jobs) {
                if (job.type === 'raw' && inv.has(job.drop.id)) {
                    const c = inv.get(job.drop.id);
                    c[job.item] = (c[job.item] || 0) + 1;
                }
            }
        }

        return {
            v: FORMAT,
            difficulty: st.difficulty,
            seed: st.seed,
            worldW: st.worldW, worldH: st.worldH, expansions: st.expansions,
            congestionEnabled: st.congestionEnabled,
            autoAcceptContracts: st.autoAcceptContracts,
            tutorialStep: st.tutorialStep,
            money: st.money, earnedTotal: st.earnedTotal,
            interestPaid: st.interestPaid, upkeepPaid: st.upkeepPaid || 0,
            landBought: st.landBought || 0,
            delivered: st.delivered, missed: st.missed,
            trucksBought: st.trucksBought,
            yardsBought: st.yardsBought,
            activeYardId: st.activeYard ? st.activeYard.id : null,
            time: st.time, nextOrderIn: st.nextOrderIn, orderSeq: st.orderSeq,
            nextCustomerIn: st.nextCustomerIn,
            promoUntil: st.promoUntil, defaultIn: st.defaultIn,
            promoGood: st.promoGood || null,
            regionsUnlocked: st.regionsUnlocked || 0,
            nextContractIn: st.nextContractIn,
            contractOffer: st.contractOffer ? {
                cityId: st.contractOffer.city.id, product: st.contractOffer.product,
                qty: st.contractOffer.qty, payout: st.contractOffer.payout,
                deadline: st.contractOffer.deadline, timeLeft: st.contractOffer.timeLeft
            } : null,
            deliveredByProduct: Object.assign({}, st.deliveredByProduct),
            moneyHistory: st.moneyHistory.slice(),
            nextStatSampleIn: st.nextStatSampleIn,
            achievements: Object.assign({}, st.achievements),
            unlockedProducts: Object.assign({}, st.unlockedProducts),
            upgrades: Object.assign({}, st.upgrades),
            research: {
                completed: Object.assign({}, st.research.completed),
                active: st.research.active ? Object.assign({}, st.research.active) : null
            },
            river: st.river,
            nodes: st.nodes.map(n => ({
                id: n.id, kind: n.kind, x: n.x, y: n.y, mat: n.mat, recipe: n.recipe,
                specializedRecipe: n.specializedRecipe || null,
                active: n.active, forSale: n.forSale, isHQ: n.isHQ,
                level: n.level || 0, stock: n.stock,
                inv: inv.get(n.id) || {}
            })),
            edges: st.edges.map(e => ({
                a: e.a.id, b: e.b.id, cost: e.cost, level: e.level || 0, ferry: !!e.ferry,
                trips: e.trips || 0
            })),
            trucks: st.trucks.map(t => ({
                nodeId: (t.node || st.nodes[0]).id,
                homeYardId: (t.homeYard || t.node || st.nodes[0]).id
            })),
            orders: st.orders.map(o => ({
                id: o.id, cityId: o.city.id, product: o.product,
                qty: o.qty, deliveredUnits: o.deliveredUnits, payout: o.payout,
                deadline: o.deadline, deadlineTotal: o.deadlineTotal,
                contract: !!o.contract
            }))
        };
    }

    function restore(data) {
        SC.newState(data.difficulty || 'normal');
        SC.map._resetSeq();
        const st = SC.state;
        st.money = data.money;
        st.earnedTotal = data.earnedTotal;
        st.interestPaid = data.interestPaid || 0;
        st.delivered = data.delivered;
        st.missed = data.missed;
        st.trucksBought = data.trucksBought;
        st.yardsBought = data.yardsBought || 0;
        st.time = data.time;
        st.nextOrderIn = data.nextOrderIn;
        st.orderSeq = data.orderSeq;
        st.nextCustomerIn = data.nextCustomerIn !== undefined ? data.nextCustomerIn : st.nextCustomerIn;
        st.promoUntil = data.promoUntil || 0;
        st.promoGood = data.promoGood || null;
        st.regionsUnlocked = data.regionsUnlocked || 0;
        st.defaultIn = data.defaultIn !== undefined ? data.defaultIn : null;
        st.nextContractIn = data.nextContractIn !== undefined ? data.nextContractIn : st.nextContractIn;
        st.deliveredByProduct = data.deliveredByProduct ? Object.assign({}, data.deliveredByProduct) : {};
        st.moneyHistory = data.moneyHistory ? data.moneyHistory.slice() : [];
        st.nextStatSampleIn = data.nextStatSampleIn !== undefined ? data.nextStatSampleIn : st.nextStatSampleIn;
        st.achievements = data.achievements ? Object.assign({}, data.achievements) : {};
        st.unlockedProducts = data.unlockedProducts ? Object.assign({}, data.unlockedProducts) : {};
        st.seed = data.seed || null;
        // Field size is additive/back-compat: pre-expansion saves (and any
        // written by an older client) simply lack these and keep the base.
        st.worldW = data.worldW || SC.CONFIG.WORLD_W;
        st.worldH = data.worldH || SC.CONFIG.WORLD_H;
        st.expansions = data.expansions || 0;
        st.landBought = data.landBought || 0;
        st.upkeepPaid = data.upkeepPaid || 0;
        st.congestionEnabled = data.congestionEnabled !== undefined
            ? data.congestionEnabled : SC.DIFFICULTIES[st.difficulty].congestion;
        st.autoAcceptContracts = !!data.autoAcceptContracts;
        // Saves from before the tutorial shipped have no step — those players
        // are mid-run and shouldn't be dropped into step 1, so default to -1.
        st.tutorialStep = (typeof data.tutorialStep === 'number') ? data.tutorialStep : -1;
        st.upgrades = Object.assign(st.upgrades, data.upgrades);
        if (data.research) {
            st.research.completed = Object.assign({}, data.research.completed);
            st.research.active = data.research.active ? Object.assign({}, data.research.active) : null;
        }
        st.river = data.river;

        const byId = new Map();
        for (const nd of data.nodes) {
            const n = SC.map.makeNode(nd.kind, nd.x, nd.y, {
                id: nd.id, mat: nd.mat, recipe: nd.recipe, active: nd.active,
                forSale: nd.forSale, isHQ: nd.isHQ,
                level: nd.level || 0, stock: nd.stock,
                specializedRecipe: nd.specializedRecipe || null
            });
            n.inv = Object.assign({}, nd.inv);
            byId.set(n.id, n);
        }
        for (const ed of data.edges) {
            const a = byId.get(ed.a), b = byId.get(ed.b);
            if (!a || !b) continue;
            const len = Math.hypot(a.x - b.x, a.y - b.y);
            const bridge = SC.map.segmentCrossesRiver(a.x, a.y, b.x, b.y);
            st.edges.push({ a, b, len, bridge, cost: ed.cost, level: ed.level || 0, ferry: !!ed.ferry, trips: ed.trips || 0 });
            a.edges.push(b);
            b.edges.push(a);
        }
        st.activeYard = byId.get(data.activeYardId) || st.nodes.find(n => n.isHQ) || st.nodes[0];
        for (const t of data.trucks) {
            const node = byId.get(t.nodeId) || st.nodes[0];
            const homeYard = byId.get(t.homeYardId) || node;
            SC.vehicles.addTruck(node, homeYard);
        }
        for (const od of data.orders) {
            const city = byId.get(od.cityId);
            if (!city) continue;
            st.orders.push({
                id: od.id, city, product: od.product, qty: od.qty,
                deliveredUnits: od.deliveredUnits, payout: od.payout,
                deadline: od.deadline, deadlineTotal: od.deadlineTotal,
                planned: false, noRoute: false, done: false,
                contract: !!od.contract
            });
        }
        if (data.contractOffer) {
            const city = byId.get(data.contractOffer.cityId);
            if (city) {
                st.contractOffer = {
                    product: data.contractOffer.product, city,
                    qty: data.contractOffer.qty, payout: data.contractOffer.payout,
                    deadline: data.contractOffer.deadline, timeLeft: data.contractOffer.timeLeft
                };
            }
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
