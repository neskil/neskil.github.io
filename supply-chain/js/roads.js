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
        if (SC.state.money < q.cost) return { ok: false, reason: 'money', cost: q.cost };
        SC.state.money -= q.cost;
        const edge = { a, b, len: q.len, bridge: q.bridge, cost: q.cost };
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

    // Dijkstra over the road graph. Returns { path: [nodes], dist } or null.
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
                const d = dist.get(cur) + e.len;
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

    return { findEdge, quote, build, demolish, findPath, pathDist };
})();
