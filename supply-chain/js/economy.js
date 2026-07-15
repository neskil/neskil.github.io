// Orders, planning, money, upgrades, milestones. Pure logic.
window.SC = window.SC || {};

SC.economy = (function() {
    const C = () => SC.CONFIG;

    function activeCities() {
        return SC.state.nodes.filter(n => n.kind === 'city' && n.active);
    }

    function activeSuppliers(mat) {
        return SC.state.nodes.filter(n =>
            n.kind === 'supplier' && n.active && (!mat || n.mat === mat));
    }

    // Products whose every input has at least one active supplier
    function craftableProducts() {
        return Object.keys(SC.PRODUCTS).filter(p =>
            SC.PRODUCTS[p].inputs.every(m => activeSuppliers(m).length > 0));
    }

    function rand(a, b) { return a + Math.random() * (b - a); }

    function spawnOrder() {
        const cities = activeCities();
        const products = craftableProducts();
        if (!cities.length || !products.length) return null;
        const city = cities[Math.floor(Math.random() * cities.length)];
        const product = products[Math.floor(Math.random() * products.length)];
        const qty = 1 + Math.floor(Math.random() * Math.min(3, 1 + SC.state.delivered / 5));

        // Distance bonus estimated from the nearest operational factory
        let nearest = Infinity;
        for (const f of SC.factories.all()) {
            nearest = Math.min(nearest, Math.hypot(f.x - city.x, f.y - city.y));
        }
        if (nearest === Infinity) nearest = 400;
        const payout = Math.round((qty * (C().ORDER_BASE_PAY + C().ORDER_DIST_PAY * nearest)) / 5) * 5;

        const deadline = rand(C().ORDER_DEADLINE[0], C().ORDER_DEADLINE[1]);
        const order = {
            id: ++SC.state.orderSeq,
            city, product, qty,
            deliveredUnits: 0,
            payout,
            deadline, deadlineTotal: deadline,
            planned: false, noRoute: false,
            done: false
        };
        SC.state.orders.push(order);
        SC.emit('order', order);
        return order;
    }

    // Pick the operational factory with the cheapest total haul
    // (each raw's nearest reachable supplier -> factory, factory -> city),
    // then create craft tasks and raw haul jobs.
    function planOrder(order) {
        if (order.planned) return true;
        let best = null, bestCost = Infinity;
        for (const f of SC.factories.all()) {
            const toCity = SC.roads.pathDist(f, order.city);
            if (toCity === Infinity) continue;
            let cost = toCity, sups = {};
            for (const m of SC.PRODUCTS[order.product].inputs) {
                let sBest = null, sDist = Infinity;
                for (const s of activeSuppliers(m)) {
                    const d = SC.roads.pathDist(s, f);
                    if (d < sDist) { sDist = d; sBest = s; }
                }
                if (!sBest) { cost = Infinity; break; }
                cost += sDist;
                sups[m] = sBest;
            }
            if (cost < bestCost) { bestCost = cost; best = { f, sups }; }
        }
        if (!best) {
            order.noRoute = true;
            return false;
        }
        for (let u = 0; u < order.qty; u++) {
            const task = SC.factories.makeTask(best.f, order.product, order);
            for (const m of SC.factories.missingInputs(task)) {
                SC.vehicles.addJob({
                    type: 'raw', item: m,
                    pickup: best.sups[m], drop: best.f,
                    order, task
                });
            }
        }
        order.planned = true;
        order.noRoute = false;
        order.factory = best.f;
        return true;
    }

    function deliverProduct(order, item) {
        if (order.done || !SC.state.orders.includes(order)) {
            SC.state.money += C().SALVAGE_PAY; // arrived after expiry
            SC.emit('salvage', { item });
            return;
        }
        order.deliveredUnits++;
        if (order.deliveredUnits >= order.qty) {
            order.done = true;
            SC.state.orders.splice(SC.state.orders.indexOf(order), 1);
            SC.state.money += order.payout;
            SC.state.earnedTotal += order.payout;
            SC.state.delivered++;
            SC.emit('orderComplete', order);
            if (SC.state.delivered % C().MILESTONE_EVERY === 0) {
                const node = SC.map.unlockNext();
                if (node) SC.emit('unlock', node);
            }
        }
    }

    function expireOrder(order) {
        SC.state.orders.splice(SC.state.orders.indexOf(order), 1);
        SC.state.missed++;
        SC.factories.cancelTasksForOrder(order);
        SC.vehicles.cancelJobsForOrder(order);
        SC.emit('orderExpired', order);
    }

    // Roads/factories changed: retry orders that had no route
    function onNetworkChanged() {
        for (const o of SC.state.orders) {
            if (!o.planned) planOrder(o);
        }
    }

    let planTimer = 0;
    function tick(dt) {
        // New orders arrive a bit faster as you level up
        SC.state.nextOrderIn -= dt;
        if (SC.state.nextOrderIn <= 0 && SC.state.orders.length < C().ORDER_MAX_ACTIVE) {
            const o = spawnOrder();
            if (o) planOrder(o);
            const pace = Math.max(0.5, 1 - SC.state.delivered * 0.02);
            SC.state.nextOrderIn = rand(C().ORDER_INTERVAL[0], C().ORDER_INTERVAL[1]) * pace;
        }

        for (let i = SC.state.orders.length - 1; i >= 0; i--) {
            const o = SC.state.orders[i];
            o.deadline -= dt;
            if (o.deadline <= 0) expireOrder(o);
        }

        planTimer += dt;
        if (planTimer >= 1) {
            planTimer = 0;
            onNetworkChanged();
        }
    }

    function buyUpgrade(key) {
        const price = SC.upgradePrice(key);
        if (price === null) return { ok: false, reason: 'maxed' };
        if (SC.state.money < price) return { ok: false, reason: 'money', cost: price };
        SC.state.money -= price;
        SC.state.upgrades[key]++;
        return { ok: true, level: SC.state.upgrades[key] };
    }

    return { spawnOrder, planOrder, deliverProduct, expireOrder,
             onNetworkChanged, tick, buyUpgrade, craftableProducts };
})();
