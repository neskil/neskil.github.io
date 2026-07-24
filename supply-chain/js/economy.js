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

    // Does the map have all raw materials needed for this good?
    // This defines having "the means" to produce it, even if factories aren't built.
    function hasMeansToProduce(good) {
        const g = SC.GOODS[good];
        if (g.raw) return activeSuppliers(good).length > 0;
        return g.inputs.every(hasMeansToProduce);
    }

    function craftableProducts() {
        return Object.keys(SC.GOODS).filter(p => {
            if (!SC.GOODS[p].orderable) return false;
            if (canSource(p)) return true; // currently producing it
            
            // Or we have the means, and the difficulty's grace period has passed
            const unlockedAt = SC.state.unlockedProducts[p];
            if (unlockedAt !== undefined) {
                const graceMin = SC.diff().orderGraceMin;
                if (graceMin !== undefined) {
                    if (SC.state.time >= unlockedAt + graceMin * 60) return true;
                }
            }
            return false;
        });
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
        // Preservatives research stretches every deadline further, and
        // the difficulty preset scales the whole thing (Normal = 0.8×).
        const slack = 1 + C().ORDER_DEPTH_SLACK * (SC.depthOf(product) - 1);
        const deadline = rand(C().ORDER_DEADLINE[0], C().ORDER_DEADLINE[1]) * slack *
            (1 + SC.research.deadlineBonus()) * SC.diff().deadlineMult;
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
            // The frontier opens up at scheduled delivery counts — grows the
            // field and pushes the mountain backdrop out (see WORLD_EXPAND).
            SC.map.maybeExpandField();
        }
    }

    function expireOrder(order) {
        SC.state.orders.splice(SC.state.orders.indexOf(order), 1);
        SC.state.missed++;
        SC.factories.cancelTasksForOrder(order);
        SC.vehicles.cancelJobsForOrder(order);
        if (order.contract) {
            // Penalty scales with however many units are still missing, so
            // a near-complete contract stings less than an untouched one.
            const missingUnits = order.qty - order.deliveredUnits;
            const penalty = Math.round(missingUnits * (order.payout / order.qty) * C().CONTRACT_PENALTY_MULT);
            SC.state.money -= penalty;
            SC.emit('contractFailed', { order, penalty });
        } else {
            SC.emit('orderExpired', order);
        }
    }

    // Roads/factories changed: retry orders that had no route
    function onNetworkChanged() {
        for (const o of SC.state.orders) {
            if (!o.planned) planOrder(o);
        }
    }

    // Demand scales with the customer network: each active DC beyond HQ
    // raises the concurrent-order cap, so a grown map generates enough
    // work to pay for its grown costs. A running promotion adds more.
    function maxActiveOrders() {
        return C().ORDER_MAX_ACTIVE + C().ORDER_PER_CITY * Math.max(0, activeCities().length - 1) +
               (isPromoActive() ? C().PROMO_ORDER_CAP_BONUS : 0);
    }

    // ── Promotions: paid, timed demand bursts (Marketing Blitz) ──
    function isPromoActive() {
        return SC.state.time < SC.state.promoUntil;
    }

    function promoTimeLeft() {
        return Math.max(0, SC.state.promoUntil - SC.state.time);
    }

    function startPromotion() {
        if (!SC.research.isDone('promotions')) return { ok: false, reason: 'locked' };
        if (isPromoActive()) return { ok: false, reason: 'active' };
        if (!SC.canAfford(C().PROMO_COST)) return { ok: false, reason: 'money', cost: C().PROMO_COST };
        SC.state.money -= C().PROMO_COST;
        SC.state.promoUntil = SC.state.time + C().PROMO_DURATION;
        SC.emit('promoStarted', { until: SC.state.promoUntil });
        return { ok: true };
    }

    // ── Contracts: occasional bulk-order offers at a locked-in premium
    // rate. rollContractOffer proposes one; the player Accepts (turns it
    // into a real order via acceptContract) or Declines/lets it expire
    // (declineContract) within CONTRACT_OFFER_EXPIRE. ──
    function rollContractOffer() {
        // Only one contract (offer or active) at a time.
        if (SC.state.contractOffer || SC.state.orders.some(o => o.contract)) return null;
        const cities = activeCities();
        const products = craftableProducts();
        if (!cities.length || !products.length) return null;
        const city = cities[Math.floor(Math.random() * cities.length)];
        const product = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(rand(C().CONTRACT_QTY[0], C().CONTRACT_QTY[1] + 1));

        let nearest = Infinity;
        for (const f of SC.factories.all()) {
            if (f.recipe === product) nearest = Math.min(nearest, Math.hypot(f.x - city.x, f.y - city.y));
        }
        if (nearest === Infinity) nearest = 400;

        // Same shape as spawnOrder's payout formula, plus the locked-in
        // CONTRACT_RATE_BONUS premium that's the whole appeal of accepting.
        const depthMult = 1 + C().ORDER_DEPTH_VALUE * (SC.depthOf(product) - 1);
        const payout = Math.round((qty * (SC.GOODS[product].value * depthMult * C().CONTRACT_RATE_BONUS +
            C().ORDER_DIST_PAY * nearest) * (1 + SC.research.payoutBonus())) / 5) * 5;
        const deadline = rand(C().CONTRACT_DURATION[0], C().CONTRACT_DURATION[1]) * SC.diff().deadlineMult;

        SC.state.contractOffer = { product, city, qty, payout, deadline, timeLeft: C().CONTRACT_OFFER_EXPIRE };
        SC.emit('contractOffered', SC.state.contractOffer);
        return SC.state.contractOffer;
    }

    function acceptContract() {
        const offer = SC.state.contractOffer;
        if (!offer) return { ok: false, reason: 'none' };
        const order = {
            id: ++SC.state.orderSeq,
            city: offer.city, product: offer.product, qty: offer.qty,
            deliveredUnits: 0,
            payout: offer.payout,
            deadline: offer.deadline, deadlineTotal: offer.deadline,
            planned: false, noRoute: false, done: false,
            contract: true
        };
        SC.state.orders.push(order);
        planOrder(order);
        SC.state.contractOffer = null;
        SC.emit('contractAccepted', order);
        return { ok: true, order };
    }

    function declineContract() {
        if (!SC.state.contractOffer) return { ok: false };
        SC.emit('contractDeclined', SC.state.contractOffer);
        SC.state.contractOffer = null;
        SC.state.nextContractIn = rand(C().CONTRACT_INTERVAL[0], C().CONTRACT_INTERVAL[1]);
        return { ok: true };
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
        
        // Track when we first get the means to produce each orderable good
        // so that the difficulty grace period can start ticking.
        for (const p of Object.keys(SC.GOODS)) {
            if (!SC.GOODS[p].orderable) continue;
            if (SC.state.unlockedProducts[p] !== undefined) continue;
            if (hasMeansToProduce(p)) {
                SC.state.unlockedProducts[p] = SC.state.time;
            }
        }

        // Debt interest: a negative balance bleeds continuously, at the
        // difficulty's rate. Interest can push the debt past the credit
        // limit (purchases stay blocked until deliveries pay it down).
        if (SC.state.money < 0 && SC.diff().interestPerMin > 0) {
            const interest = -SC.state.money * (SC.diff().interestPerMin / 60) * dt;
            SC.state.money -= interest;
            SC.state.interestPaid += interest;
        }

        // Default countdown: below the credit limit nothing can be bought,
        // so only deliveries already in flight can save you — recover above
        // -creditLimit within the grace period or the bank forecloses.
        // Sandbox (noFail) skips foreclosure entirely.
        if (SC.state.money < -SC.creditLimit() && !SC.diff().noFail) {
            if (SC.state.defaultIn === null) {
                SC.state.defaultIn = SC.diff().defaultGrace;
                SC.emit('debtWarning', { grace: SC.diff().defaultGrace });
            } else {
                SC.state.defaultIn -= dt;
                if (SC.state.defaultIn <= 0 && !SC.state.gameOver) {
                    SC.state.gameOver = true;
                    SC.emit('gameOver', { debt: -SC.state.money });
                }
            }
        } else if (SC.state.defaultIn !== null) {
            SC.state.defaultIn = null;
            SC.emit('debtRecovered');
        }

        // Contract offers: a pending one just counts down to auto-decline;
        // a new one is only rolled when nothing is pending or already
        // accepted (one contract, offer or active, at a time).
        if (SC.state.contractOffer) {
            SC.state.contractOffer.timeLeft -= dt;
            if (SC.state.contractOffer.timeLeft <= 0) declineContract();
        } else if (!SC.state.orders.some(o => o.contract)) {
            SC.state.nextContractIn -= dt;
            if (SC.state.nextContractIn <= 0) {
                rollContractOffer();
                // Standing Orders research + the player's toggle: skip the
                // Accept/Decline card and take every offer immediately.
                if (SC.state.contractOffer && SC.state.autoAcceptContracts &&
                    SC.research.isDone('autoAcceptContracts')) {
                    acceptContract();
                }
            }
        }

        // New customer DCs (cities) unlock on their own clock, independent
        // of delivery milestones — HQ is the only order-placing location
        // until one appears.
        SC.state.nextCustomerIn -= dt;
        if (SC.state.nextCustomerIn <= 0) {
            const isCity = n => n.kind === 'city';
            const node = SC.map.unlockNext(isCity);
            if (node) {
                SC.emit('unlock', node);
                SC.state.nextCustomerIn =
                    rand(C().CUSTOMER_SPAWN_INTERVAL[0], C().CUSTOMER_SPAWN_INTERVAL[1]) *
                    SC.research.customerSpawnMult(); // Regional Marketing shortens the wait
            } else if (SC.map.anyHeldByRiverGrace(isCity)) {
                // Only the far-bank city is left and we're still inside the
                // river-grace window — retry the moment grace lifts (never
                // let it read as a drained pool).
                SC.state.nextCustomerIn = Math.max(1, SC.map.riverGraceRemaining());
            } else {
                SC.state.nextCustomerIn = Infinity; // pool exhausted — stop checking
            }
        }

        // New orders arrive a bit faster as you level up; a running
        // promotion makes the clock toward the next order tick ~3x faster.
        SC.state.nextOrderIn -= dt * (isPromoActive() ? 1 / C().PROMO_ORDER_MULT : 1);
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
             craftableProducts, bestSourceFor, maxActiveOrders,
             isPromoActive, promoTimeLeft, startPromotion,
             rollContractOffer, acceptContract, declineContract };
})();
