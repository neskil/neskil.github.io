// Manual site placement. Suppliers/factories are locked behind the
// 'manualPlacement' research and cost a premium over the free milestone/
// customer-DC unlocks; junctions are locked behind the (cheap, early)
// 'junctions' research; truck yards are a base mechanic (never gated).
// Pure logic — shares the same tap-to-place UI flow (input.js/render.js).
window.SC = window.SC || {};

SC.placement = (function() {
    // Which research (if any) a kind needs before it can be placed. Truck
    // yards aren't listed — they're a base mechanic, always available.
    const RESEARCH_GATE = { junction: 'junctions', supplier: 'manualPlacement', factory: 'manualPlacement' };

    function isUnlocked(kind) {
        const gate = RESEARCH_GATE[kind];
        return !gate || SC.research.isDone(gate);
    }

    function price(kind) {
        if (kind === 'supplier') return SC.CONFIG.PLACEMENT_SUPPLIER_PRICE;
        if (kind === 'yard') return SC.yardPrice();
        if (kind === 'junction') return SC.CONFIG.PLACEMENT_JUNCTION_PRICE;
        return Math.round(SC.CONFIG.FACTORY_SITE_PRICE * SC.CONFIG.PLACEMENT_FACTORY_MULT);
    }

    function canPlaceAt(x, y) {
        const C = SC.CONFIG;
        if (x < C.NODE_MARGIN || x > SC.worldW() - C.NODE_MARGIN) return false;
        if (y < C.NODE_MARGIN || y > SC.worldH() - C.NODE_MARGIN) return false;
        if (SC.map.isInRiver(x, y)) return false;
        return SC.state.nodes.every(n => Math.hypot(n.x - x, n.y - y) >= C.PLACEMENT_MIN_DIST);
    }

    // kind: 'supplier' (good = raw material key), 'factory' (good = recipe
    // key), 'yard' or 'junction' (good unused).
    function place(kind, good, x, y) {
        if (!isUnlocked(kind)) return { ok: false, reason: 'locked' };
        if (!canPlaceAt(x, y)) return { ok: false, reason: 'invalid' };
        const cost = price(kind);
        if (!SC.canAfford(cost)) return { ok: false, reason: 'money', cost };
        SC.state.money -= cost;
        let node;
        if (kind === 'yard') {
            node = SC.map.makeNode('yard', x, y, { active: true });
            SC.state.yardsBought++;
        } else if (kind === 'junction') {
            node = SC.map.makeNode('junction', x, y, { active: true });
        } else {
            const opts = kind === 'supplier' ? { active: true, mat: good } : { active: true, recipe: good };
            node = SC.map.makeNode(kind, x, y, opts);
        }
        SC.economy.onNetworkChanged(); // orders waiting on this good can now plan
        SC.emit('sitePlaced', { node, cost });
        if (kind === 'yard') SC.emit('yardBuilt', node);
        return { ok: true, node };
    }

    return { price, canPlaceAt, place, isUnlocked };
})();
