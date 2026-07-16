// Road network: building, cost, Dijkstra pathfinding. Pure logic.
window.SC = window.SC || {};

SC.roads = (function() {

    function findEdge(a, b) {
        return SC.state.edges.find(e =>
            (e.a === a && e.b === b) || (e.a === b && e.b === a)) || null;
    }

    // Quote for a prospective road; null when not buildable.
    function quote(a, b) {
        if (!a || !b || a === b) return null;
        if (!a.active || !b.active) return null;
        if (findEdge(a, b)) return null;
        const len = Math.hypot(a.x - b.x, a.y - b.y);
        const bridge = SC.map.segmentCrossesRiver(a.x, a.y, b.x, b.y);
        const cost = Math.round(len * SC.CONFIG.ROAD_COST_PER_UNIT *
            (bridge ? SC.CONFIG.BRIDGE_MULT : 1));
        return { len, bridge, cost };
    }

    function build(a, b) {
        const q = quote(a, b);
        if (!q) return { ok: false, reason: 'invalid' };
        if (!SC.canAfford(q.cost)) return { ok: false, reason: 'money', cost: q.cost };
        SC.state.money -= q.cost;
        const edge = { a, b, len: q.len, bridge: q.bridge, cost: q.cost, level: 0 };
        SC.state.edges.push(edge);
        a.edges.push(b);
        b.edges.push(a);
        SC.economy && SC.economy.onNetworkChanged();
        SC.emit('roadBuilt', edge);
        return { ok: true, edge };
    }

    function demolish(edge) {
        const i = SC.state.edges.indexOf(edge);
        if (i === -1) return false;
        // Refuse while a truck is travelling on it
        const busy = SC.state.trucks.some(t => t.path && t.path.some((n, k) =>
            k < t.path.length - 1 &&
            ((n === edge.a && t.path[k + 1] === edge.b) ||
             (n === edge.b && t.path[k + 1] === edge.a))));
        if (busy) return false;
        SC.state.edges.splice(i, 1);
        edge.a.edges.splice(edge.a.edges.indexOf(edge.b), 1);
        edge.b.edges.splice(edge.b.edges.indexOf(edge.a), 1);
        const refund = Math.round(edge.cost * SC.CONFIG.ROAD_REFUND);
        SC.state.money += refund;
        SC.economy && SC.economy.onNetworkChanged();
        SC.emit('roadDemolished', { edge, refund });
        return true;
    }

    // Congestion (feature-flagged, see SC.state.congestionEnabled):
    // trucks beyond CONGESTION_THRESHOLD sharing an edge right now slow
    // it down multiplicatively, floored at CONGESTION_FLOOR. Read live
    // off vehicles.js each call, so it reacts in real time as trucks
    // arrive/leave the edge — including inside Dijkstra's own weighting
    // below, which is what makes routing actually prefer a quieter
    // parallel road over a jammed one.
    function congestionMult(edge) {
        if (!SC.state.congestionEnabled || !SC.vehicles) return 1;
        const excess = SC.vehicles.truckCountOnEdge(edge) - SC.CONFIG.CONGESTION_THRESHOLD;
        return excess > 0
            ? Math.max(SC.CONFIG.CONGESTION_FLOOR, 1 - SC.CONFIG.CONGESTION_STEP * excess)
            : 1;
    }

    // Highways (edge.level 1, unlocked by 'pavedRoads' research) move
    // trucks HIGHWAY_SPEED_MULT× faster on that edge; congestion (when
    // enabled) then slows an overloaded edge back down on top of that.
    function speedMult(edge) {
        if (!edge) return 1;
        return (edge.level ? SC.CONFIG.HIGHWAY_SPEED_MULT : 1) * congestionMult(edge);
    }

    // Quote for upgrading a road to a highway; null when not possible.
    function upgradeQuote(edge) {
        if (!edge || edge.level > 0) return null;
        if (!SC.research.isDone('pavedRoads')) return null;
        const cost = Math.round(edge.len * SC.CONFIG.ROAD_UPGRADE_PER_UNIT *
            (edge.bridge ? SC.CONFIG.BRIDGE_MULT : 1));
        return { cost };
    }

    function upgrade(edge) {
        const q = upgradeQuote(edge);
        if (!q) return { ok: false, reason: 'invalid' };
        if (!SC.canAfford(q.cost)) return { ok: false, reason: 'money', cost: q.cost };
        SC.state.money -= q.cost;
        edge.level = 1;
        SC.economy && SC.economy.onNetworkChanged();
        SC.emit('roadUpgraded', { edge, cost: q.cost });
        return { ok: true, edge };
    }

    // Dijkstra over the road graph, weighted by travel TIME (highway
    // edges count len/speedMult), so routing prefers upgraded roads.
    // Returns { path: [nodes], dist } or null.
    function findPath(from, to) {
        if (from === to) return { path: [from], dist: 0 };
        const dist = new Map([[from, 0]]);
        const prev = new Map();
        const open = [from];
        const done = new Set();
        while (open.length) {
            let bi = 0;
            for (let i = 1; i < open.length; i++)
                if (dist.get(open[i]) < dist.get(open[bi])) bi = i;
            const cur = open.splice(bi, 1)[0];
            if (cur === to) break;
            if (done.has(cur)) continue;
            done.add(cur);
            for (const nb of cur.edges) {
                const e = findEdge(cur, nb);
                const d = dist.get(cur) + e.len / speedMult(e);
                if (!dist.has(nb) || d < dist.get(nb)) {
                    dist.set(nb, d);
                    prev.set(nb, cur);
                    open.push(nb);
                }
            }
        }
        if (!dist.has(to)) return null;
        const path = [to];
        while (path[0] !== from) path.unshift(prev.get(path[0]));
        return { path, dist: dist.get(to) };
    }

    function pathDist(from, to) {
        const r = findPath(from, to);
        return r ? r.dist : Infinity;
    }

    return { findEdge, quote, build, demolish, findPath, pathDist,
             speedMult, congestionMult, upgradeQuote, upgrade };
})();
