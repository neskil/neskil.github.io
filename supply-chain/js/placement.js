// Manual site placement. Suppliers/factories are locked behind the
// 'manualPlacement' research and cost a premium over the free milestone/
// customer-DC unlocks; junctions are locked behind the (cheap, early)
// 'junctions' research; truck yards are a base mechanic (never gated).
// Pure logic — shares the same tap-to-place UI flow (input.js/render.js).
window.SC = window.SC || {};

SC.placement = (function() {
    // Which research (if any) a kind needs before it can be placed. Truck
    // yards aren't listed — they're a base mechanic, always available.
    const RESEARCH_GATE = { intersection: 'intersections', junction: 'junctions', supplier: 'manualPlacement', factory: 'manualPlacement' };

    function isUnlocked(kind) {
        const gate = RESEARCH_GATE[kind];
        return !gate || SC.research.isDone(gate);
    }

    function price(kind) {
        if (kind === 'supplier') return SC.CONFIG.PLACEMENT_SUPPLIER_PRICE;
        if (kind === 'yard') return SC.yardPrice();
        if (kind === 'junction') return SC.CONFIG.PLACEMENT_JUNCTION_PRICE;
        if (kind === 'intersection') return SC.CONFIG.PLACEMENT_INTERSECTION_PRICE;
        if (kind === 'researchLab') return SC.CONFIG.PLACEMENT_RESEARCH_LAB_PRICE || 800;
        return Math.round(SC.CONFIG.FACTORY_SITE_PRICE * SC.CONFIG.PLACEMENT_FACTORY_MULT);
    }

    function canPlaceAt(x, y) {
        const C = SC.CONFIG;
        if (x < C.NODE_MARGIN || x > SC.worldW() - C.NODE_MARGIN) return false;
        if (y < C.NODE_MARGIN || y > SC.worldH() - C.NODE_MARGIN) return false;
        if (SC.map.isInRiver(x, y)) return false;
        // Don't let a site drop on top of a road — junctions (a distinct
        // road-crossing tool, see canPlaceIntersectionAt) are how you tie a
        // node into an existing road.
        if (SC.roads.pointRoadDist(x, y) < C.NODE_ROAD_CLEARANCE) return false;
        return SC.state.nodes.every(n => Math.hypot(n.x - x, n.y - y) >= C.PLACEMENT_MIN_DIST);
    }

    // Retrofit tool: a junction dropped onto two roads that already cross
    // without meeting. Since the overlap rules landed (SC.roads.checkSegment)
    // a new road builds its own interchanges, so the only crossings left to
    // retrofit are the ones in a save from before that — hence the Shop
    // button hides itself when the map has none (SC.roads.hasCrossings).
    function canPlaceIntersectionAt(x, y) {
        if (SC.map.isInRiver(x, y)) return null;
        return SC.roads.findClosestCrossing(x, y, 40);
    }

    // kind: 'supplier' (good = raw material key), 'factory' (good = recipe
    // key), 'yard', 'junction', 'researchLab', or 'intersection' (good unused).
    function place(kind, good, x, y) {
        if (!isUnlocked(kind)) return { ok: false, reason: 'locked' };
        
        let node;
        const cost = price(kind);

        if (kind === 'intersection') {
            const crossing = canPlaceIntersectionAt(x, y);
            if (!crossing) return { ok: false, reason: 'invalid' };
            if (!SC.canAfford(cost)) return { ok: false, reason: 'money', cost };

            SC.state.money -= cost;
            node = SC.map.makeNode('junction', crossing.x, crossing.y, {
                active: true, underConstruction: true,
                constructionTime: SC.CONFIG.CONSTRUCTION_TIME || 7.5, constructTimer: 0
            });

            SC.roads.splitEdge(crossing.e1, node, crossing.t);
            SC.roads.splitEdge(crossing.e2, node, crossing.u);
        } else {
            if (!canPlaceAt(x, y)) return { ok: false, reason: 'invalid' };
            if (!SC.canAfford(cost)) return { ok: false, reason: 'money', cost };
            SC.state.money -= cost;

            const constOpts = {
                active: true, underConstruction: true,
                constructionTime: SC.CONFIG.CONSTRUCTION_TIME || 7.5, constructTimer: 0
            };

            if (kind === 'yard') {
                node = SC.map.makeNode('yard', x, y, constOpts);
                SC.state.yardsBought++;
            } else if (kind === 'junction') {
                node = SC.map.makeNode('junction', x, y, constOpts);
            } else if (kind === 'researchLab') {
                node = SC.map.makeNode('researchLab', x, y, constOpts);
            } else {
                const opts = Object.assign(constOpts, kind === 'supplier' ? { mat: good } : { recipe: good });
                node = SC.map.makeNode(kind, x, y, opts);
            }
        }

        SC.economy.onNetworkChanged(); // orders waiting on this good can now plan
        SC.emit('sitePlaced', { node, cost });
        if (kind === 'yard') SC.emit('yardBuilt', node);
        return { ok: true, node };
    }

    return { price, canPlaceAt, place, isUnlocked, canPlaceIntersectionAt };
})();
