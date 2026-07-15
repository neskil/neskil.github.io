// Manual site placement — locked behind the 'manualPlacement' research.
// Lets the player drop a supplier or factory anywhere on land, at a
// premium over the free milestone/customer-DC unlocks. Pure logic.
window.SC = window.SC || {};

SC.placement = (function() {
    function price(kind) {
        return kind === 'supplier'
            ? SC.CONFIG.PLACEMENT_SUPPLIER_PRICE
            : Math.round(SC.CONFIG.FACTORY_SITE_PRICE * SC.CONFIG.PLACEMENT_FACTORY_MULT);
    }

    function canPlaceAt(x, y) {
        const C = SC.CONFIG;
        if (x < C.NODE_MARGIN || x > C.WORLD_W - C.NODE_MARGIN) return false;
        if (y < C.NODE_MARGIN || y > C.WORLD_H - C.NODE_MARGIN) return false;
        if (SC.map.isInRiver(x, y)) return false;
        return SC.state.nodes.every(n => Math.hypot(n.x - x, n.y - y) >= C.PLACEMENT_MIN_DIST);
    }

    // kind: 'supplier' (good = raw material key) or 'factory' (good = recipe key)
    function place(kind, good, x, y) {
        if (!SC.research.isDone('manualPlacement')) return { ok: false, reason: 'locked' };
        if (!canPlaceAt(x, y)) return { ok: false, reason: 'invalid' };
        const cost = price(kind);
        if (!SC.canAfford(cost)) return { ok: false, reason: 'money', cost };
        SC.state.money -= cost;
        const opts = kind === 'supplier' ? { active: true, mat: good } : { active: true, recipe: good };
        const node = SC.map.makeNode(kind, x, y, opts);
        SC.economy.onNetworkChanged(); // orders waiting on this good can now plan
        SC.emit('sitePlaced', { node, cost });
        return { ok: true, node };
    }

    return { price, canPlaceAt, place };
})();
