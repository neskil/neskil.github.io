// Factory production: craft tasks queue up, consume raw inputs, and emit
// finished products as delivery jobs. Pure logic.
window.SC = window.SC || {};

SC.factories = (function() {

    function operational(n) {
        return n.kind === 'factory' && n.active && !n.forSale;
    }

    function all() {
        return SC.state.nodes.filter(operational);
    }

    // One craft task = one unit of `productKey` for one order. `deliverTo`
    // is the ordering city for finished goods; for intermediates it is the
    // downstream factory, and `parentTask` is the task the output feeds.
    function makeTask(factory, productKey, order, deliverTo, parentTask) {
        const needs = {};
        SC.GOODS[productKey].inputs.forEach(m => { needs[m] = (needs[m] || 0) + 1; });
        const task = {
            factory, order, product: productKey,
            deliverTo: deliverTo || (order && order.city),
            parentTask: parentTask || null,
            needs, have: {}, cancelled: false
        };
        // Claim any loose inventory already sitting at the factory
        for (const m of Object.keys(needs)) {
            task.have[m] = 0;
            while ((factory.inv[m] || 0) > 0 && task.have[m] < needs[m]) {
                factory.inv[m]--;
                task.have[m]++;
            }
        }
        factory.queue.push(task);
        return task;
    }

    function missingInputs(task) {
        const out = [];
        for (const m of Object.keys(task.needs)) {
            for (let i = (task.have[m] || 0); i < task.needs[m]; i++) out.push(m);
        }
        return out;
    }

    function inputsComplete(task) {
        return Object.keys(task.needs).every(m => (task.have[m] || 0) >= task.needs[m]);
    }

    // A truck dropped a raw material at this factory.
    function receiveRaw(factory, mat, task) {
        if (task && !task.cancelled && (task.have[mat] || 0) < task.needs[mat]) {
            task.have[mat]++;
        } else {
            factory.inv[mat] = (factory.inv[mat] || 0) + 1; // loose stock for later tasks
        }
    }

    function cancelTasksForOrder(order) {
        for (const f of all()) {
            for (let i = f.queue.length - 1; i >= 0; i--) {
                const t = f.queue[i];
                if (t.order === order) {
                    t.cancelled = true;
                    for (const m of Object.keys(t.have)) {
                        f.inv[m] = (f.inv[m] || 0) + t.have[m];
                        t.have[m] = 0;
                    }
                    f.queue.splice(i, 1);
                }
            }
            // A craft already in progress is allowed to finish (salvage pay).
        }
    }

    function tick(dt) {
        for (const f of all()) {
            if (!f.crafting) {
                const i = f.queue.findIndex(inputsComplete);
                if (i !== -1) f.crafting = { task: f.queue.splice(i, 1)[0], t: 0 };
            }
            if (f.crafting) {
                f.crafting.t += dt;
                if (f.crafting.t >= SC.craftTime(f)) {
                    const task = f.crafting.task;
                    f.crafting = null;
                    SC.emit('crafted', { factory: f, product: task.product });
                    if (task.parentTask) {
                        // Intermediate good: haul it on to the downstream factory
                        SC.vehicles.addJob({
                            type: 'raw',
                            item: task.product,
                            pickup: f,
                            drop: task.deliverTo,
                            order: task.order,
                            task: task.parentTask
                        });
                    } else {
                        SC.vehicles.addJob({
                            type: 'product',
                            item: task.product,
                            pickup: f,
                            drop: task.deliverTo,
                            order: task.order,
                            task: null
                        });
                    }
                }
            }
        }
    }

    function setSpecialization(factory, recipe) {
        if (!factory || factory.kind !== 'factory') return false;
        factory.specializedRecipe = recipe || null;
        SC.emit('factorySpecialized', { factory, recipe: factory.specializedRecipe });
        return true;
    }

    function buySite(node) {
        if (node.kind !== 'factory' || !node.active || !node.forSale) return { ok: false, reason: 'invalid' };
        const price = SC.CONFIG.FACTORY_SITE_PRICE;
        if (!SC.canAfford(price)) return { ok: false, reason: 'money', cost: price };
        SC.state.money -= price;
        node.forSale = false;
        SC.economy && SC.economy.onNetworkChanged();
        SC.emit('sitePurchased', { node, price });
        return { ok: true };
    }

    return { operational, all, makeTask, missingInputs, inputsComplete,
             receiveRaw, cancelTasksForOrder, tick, buySite, setSpecialization };
})();
