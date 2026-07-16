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

    // Can this good be produced with today's suppliers and factories?
    // (Raw: an active supplier exists. Crafted: an operational factory
    // with the recipe exists and every input can itself be sourced.)
    function canSource(good) {
        const g = SC.GOODS[good];
        if (g.raw) return activeSuppliers(good).length > 0;
        return SC.factories.all().some(f => f.recipe === good) &&
               g.inputs.every(canSource);
    }

    function craftableProducts() {
        return Object.keys(SC.GOODS).filter(p =>
            SC.GOODS[p].orderable && canSource(p));
    }

    function rand(a, b) { return a + Math.random() * (b - a); }

    function spawnOrder() {
        const cities = activeCities();
        const products = craftableProducts();
        if (!cities.length || !products.length) return null;
        const city = cities[Math.floor(Math.random() * cities.length)];
        const product = products[Math.floor(Math.random() * products.length)];
        const qty = 1 + Math.floor(Math.random() * Math.min(3, 1 + SC.state.delivered / 5));

        // Distance bonus estimated from the nearest factory with the recipe
        let nearest = Infinity;
        for (const f of SC.factories.all()) {
            if (f.recipe === product) {
                nearest = Math.min(nearest, Math.hypot(f.x - city.x, f.y - city.y));
            }
        }
        if (nearest === Infinity) nearest = 400;
        // Deeper chains pay a premium on top of the good's base value —
        // multi-tier logistics (car, robot) should out-earn bread runs.
        // Premium Contracts research boosts every payout on top.
        const depthMult = 1 + C().ORDER_DEPTH_VALUE * (SC.depthOf(product) - 1);
        const payout = Math.round((qty * (SC.GOODS[product].value * depthMult + C().ORDER_DIST_PAY * nearest) *
            (1 + SC.research.payoutBonus())) / 5) * 5;

        // Deeper chains (steel -> car) get extra deadline slack;
        // Preservatives research stretches every deadline further.
        const slack = 1 + C().ORDER_DEPTH_SLACK * (SC.depthOf(product) - 1);
        const deadline = rand(C().ORDER_DEADLINE[0], C().ORDER_DEADLINE[1]) * slack *
            (1 + SC.research.deadlineBonus());
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

    // Where can one unit of `good` come from, to be used at `dest`?
    // Raw goods: the nearest connected supplier. Crafted goods: the
    // factory with that recipe whose own inputs are also sourceable,
    // minimizing (inputs -> factory -> dest) haul distance.
    function bestSourceFor(good, dest) {
        const g = SC.GOODS[good];
        if (g.raw) {
            let best = null, bestD = Infinity;
            for (const s of activeSuppliers(good)) {
                const d = SC.roads.pathDist(s, dest);
                if (d < bestD) { bestD = d; best = s; }
            }
            return best && { node: best, dist: bestD };
        }
        let best = null, bestCost = Infinity;
        for (const f of SC.factories.all()) {
            if (f.recipe !== good) continue;
            const toDest = SC.roads.pathDist(f, dest);
            if (toDest === Infinity) continue;
            let cost = toDest, srcs = {};
            for (const m of g.inputs) {
                const src = bestSourceFor(m, f);
                if (!src) { cost = Infinity; break; }
                cost += src.dist;
                srcs[m] = src;
            }
            if (cost < bestCost) { bestCost = cost; best = { node: f, dist: cost, srcs }; }
        }
        return best;
    }

    // Create the craft task for one unit of `good` at the chosen factory,
    // plus haul jobs for its raw inputs and recursive tasks for crafted
    // inputs. `pick` comes from bestSourceFor so the whole tree is known
    // to be routable before any task is created.
    function planUnit(pick, good, deliverTo, order, parentTask) {
        const task = SC.factories.makeTask(pick.node, good, order, deliverTo, parentTask);
        for (const m of SC.factories.missingInputs(task)) {
            const src = pick.srcs[m];
            if (SC.GOODS[m].raw) {
                SC.vehicles.addJob({
                    type: 'raw', item: m,
                    pickup: src.node, drop: pick.node,
                    order, task
                });
            } else {
                planUnit(src, m, pick.node, order, task);
            }
        }
    }

    function planOrder(order) {
        if (order.planned) return true;
        const pick = bestSourceFor(order.product, order.city);
        if (!pick) {
            order.noRoute = true;
            return false;
        }
        for (let u = order.deliveredUnits; u < order.qty; u++) {
            planUnit(pick, order.product, order.city, order, null);
        }
        order.planned = true;
        order.noRoute = false;
        order.factory = pick.node;
        order.route = pick; // for UI highlighting
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
                // Milestones only unlock suppliers/factories — new customer
                // DCs arrive on their own timer in tick(), so HQ stays the
                // sole order-placing location until one shows up.
                const node = SC.map.unlockNext(n => n.kind !== 'city');
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

    // Demand scales with the customer network: each active DC beyond HQ
    // raises the concurrent-order cap, so a grown map generates enough
    // work to pay for its grown costs.
    function maxActiveOrders() {
        return C().ORDER_MAX_ACTIVE + C().ORDER_PER_CITY * Math.max(0, activeCities().length - 1);
    }

    // Suppliers regenerate stock toward their (level-scaled) cap; trucks
    // arriving at a dry supplier wait in the 'loading' phase (vehicles.js).
    function tickSuppliers(dt) {
        for (const n of SC.state.nodes) {
            if (n.kind !== 'supplier' || !n.active) continue;
            const cap = SC.supplierCap(n);
            if (n.stock < cap) n.stock = Math.min(cap, n.stock + SC.supplierRegen(n) * dt);
        }
    }

    // Per-supplier upgrade: each level raises stock cap and regen rate.
    function upgradeSupplier(node) {
        if (!node || node.kind !== 'supplier' || !node.active) return { ok: false, reason: 'invalid' };
        const price = SC.supplierUpgradePrice(node);
        if (price === null) return { ok: false, reason: 'maxed' };
        if (!SC.canAfford(price)) return { ok: false, reason: 'money', cost: price };
        SC.state.money -= price;
        node.level = (node.level || 0) + 1;
        SC.emit('supplierUpgraded', { node, price });
        return { ok: true, level: node.level };
    }

    let planTimer = 0;
    function tick(dt) {
        tickSuppliers(dt);
        // Debt interest: a negative balance bleeds continuously. Interest
        // can push the debt past the credit limit (purchases stay blocked
        // until deliveries pay it back down).
        if (SC.state.money < 0) {
            const interest = -SC.state.money * (C().DEBT_INTEREST_PER_MIN / 60) * dt;
            SC.state.money -= interest;
            SC.state.interestPaid += interest;
        }

        // New customer DCs (cities) unlock on their own clock, independent
        // of delivery milestones — HQ is the only order-placing location
        // until one appears.
        SC.state.nextCustomerIn -= dt;
        if (SC.state.nextCustomerIn <= 0) {
            const node = SC.map.unlockNext(n => n.kind === 'city');
            if (node) SC.emit('unlock', node);
            SC.state.nextCustomerIn = node
                ? rand(C().CUSTOMER_SPAWN_INTERVAL[0], C().CUSTOMER_SPAWN_INTERVAL[1]) *
                  SC.research.customerSpawnMult() // Regional Marketing shortens the wait
                : Infinity; // pool exhausted — stop checking
        }

        // New orders arrive a bit faster as you level up
        SC.state.nextOrderIn -= dt;
        if (SC.state.nextOrderIn <= 0 && SC.state.orders.length < maxActiveOrders()) {
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
        if (!SC.canAfford(price)) return { ok: false, reason: 'money', cost: price };
        SC.state.money -= price;
        SC.state.upgrades[key]++;
        return { ok: true, level: SC.state.upgrades[key] };
    }

    return { spawnOrder, planOrder, deliverProduct, expireOrder,
             onNetworkChanged, tick, tickSuppliers, buyUpgrade, upgradeSupplier,
             craftableProducts, bestSourceFor, maxActiveOrders };
})();
