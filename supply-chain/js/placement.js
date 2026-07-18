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
        return Math.round(SC.CONFIG.FACTORY_SITE_PRICE * SC.CONFIG.PLACEMENT_FACTORY_MULT);
    }

    function canPlaceAt(x, y) {
        const C = SC.CONFIG;
        if (x < C.NODE_MARGIN || x > SC.worldW() - C.NODE_MARGIN) return false;
        if (y < C.NODE_MARGIN || y > SC.worldH() - C.NODE_MARGIN) return false;
        if (SC.map.isInRiver(x, y)) return false;
        return SC.state.nodes.every(n => Math.hypot(n.x - x, n.y - y) >= C.PLACEMENT_MIN_DIST);
    }

    function canPlaceIntersectionAt(x, y) {
        if (SC.map.isInRiver(x, y)) return null;
        return SC.roads.findClosestCrossing(x, y, 40);
    }

    function splitEdge(edge, node, t_intersect) {
        const a = edge.a;
        const b = edge.b;

        // Remove edge from SC.state.edges
        const idx = SC.state.edges.indexOf(edge);
        if (idx !== -1) SC.state.edges.splice(idx, 1);

        // Remove connections
        a.edges.splice(a.edges.indexOf(b), 1);
        b.edges.splice(b.edges.indexOf(a), 1);

        // Create two new edges: a-node and node-b
        const len1 = Math.hypot(node.x - a.x, node.y - a.y);
        const len2 = Math.hypot(b.x - node.x, b.y - node.y);

        // Determine bridge/ferry status
        const bridge1 = SC.map.segmentCrossesRiver(a.x, a.y, node.x, node.y);
        const bridge2 = SC.map.segmentCrossesRiver(node.x, node.y, b.x, b.y);

        // Keep ferry if original was ferry
        const ferry1 = edge.ferry && bridge1;
        const ferry2 = edge.ferry && bridge2;

        // Calculate new cost proportional to length
        const mult1 = ferry1 ? SC.CONFIG.FERRY_COST_MULT : (bridge1 ? SC.CONFIG.BRIDGE_MULT : 1);
        const cost1 = Math.round(len1 * SC.CONFIG.ROAD_COST_PER_UNIT * mult1);
        const mult2 = ferry2 ? SC.CONFIG.FERRY_COST_MULT : (bridge2 ? SC.CONFIG.BRIDGE_MULT : 1);
        const cost2 = Math.round(len2 * SC.CONFIG.ROAD_COST_PER_UNIT * mult2);

        const edge1 = { a, b: node, len: len1, bridge: bridge1, ferry: ferry1, cost: cost1, level: edge.level };
        const edge2 = { a: node, b, len: len2, bridge: bridge2, ferry: ferry2, cost: cost2, level: edge.level };

        SC.state.edges.push(edge1);
        SC.state.edges.push(edge2);
        a.edges.push(node);
        node.edges.push(a);
        b.edges.push(node);
        node.edges.push(b);

        // Update in-flight truck paths
        for (const t of SC.state.trucks) {
            if (!t.path) continue;
            for (let k = 0; k < t.path.length - 1; k++) {
                const na = t.path[k], nb = t.path[k + 1];
                if ((na === a && nb === b) || (na === b && nb === a)) {
                    t.path.splice(k + 1, 0, node);
                    if (k < t.pathIdx) {
                        t.pathIdx++;
                    } else if (k === t.pathIdx) {
                        const fromNode = na;
                        const f_intersect = (fromNode === a) ? t_intersect : (1 - t_intersect);
                        if (t.progress < f_intersect) {
                            t.progress = t.progress / f_intersect;
                        } else {
                            t.pathIdx++;
                            t.progress = (t.progress - f_intersect) / (1 - f_intersect);
                        }
                    }
                    k++; // skip the newly inserted node
                }
            }
        }
    }

    // kind: 'supplier' (good = raw material key), 'factory' (good = recipe
    // key), 'yard', 'junction', or 'intersection' (good unused).
    function place(kind, good, x, y) {
        if (!isUnlocked(kind)) return { ok: false, reason: 'locked' };
        
        let node;
        const cost = price(kind);

        if (kind === 'intersection') {
            const crossing = canPlaceIntersectionAt(x, y);
            if (!crossing) return { ok: false, reason: 'invalid' };
            if (!SC.canAfford(cost)) return { ok: false, reason: 'money', cost };

            SC.state.money -= cost;
            node = SC.map.makeNode('junction', crossing.x, crossing.y, { active: true });

            splitEdge(crossing.e1, node, crossing.t);
            splitEdge(crossing.e2, node, crossing.u);
        } else {
            if (!canPlaceAt(x, y)) return { ok: false, reason: 'invalid' };
            if (!SC.canAfford(cost)) return { ok: false, reason: 'money', cost };
            SC.state.money -= cost;

            if (kind === 'yard') {
                node = SC.map.makeNode('yard', x, y, { active: true });
                SC.state.yardsBought++;
            } else if (kind === 'junction') {
                node = SC.map.makeNode('junction', x, y, { active: true });
            } else {
                const opts = kind === 'supplier' ? { active: true, mat: good } : { active: true, recipe: good };
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
