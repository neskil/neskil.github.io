// Road network: building, cost, Dijkstra pathfinding. Pure logic.
window.SC = window.SC || {};

SC.roads = (function() {

    function findEdge(a, b) {
        return SC.state.edges.find(e =>
            (e.a === a && e.b === b) || (e.a === b && e.b === a)) || null;
    }

    // Quote for a prospective road; null when not buildable. `opts.ferry`
    // requests a ferry instead of a bridge for a river crossing — cheaper
    // than BRIDGE_MULT, at the cost of FERRY_SPEED_MULT (see speedMult).
    // Meaningless (and ignored) for a segment that doesn't cross the river.
    function quote(a, b, opts) {
        if (!a || !b || a === b) return null;
        if (!a.active || !b.active) return null;
        if (findEdge(a, b)) return null;
        const len = Math.hypot(a.x - b.x, a.y - b.y);
        const bridge = SC.map.segmentCrossesRiver(a.x, a.y, b.x, b.y);
        const ferry = !!(opts && opts.ferry) && bridge;
        const mult = ferry ? SC.CONFIG.FERRY_COST_MULT : (bridge ? SC.CONFIG.BRIDGE_MULT : 1);
        const cost = Math.round(len * SC.CONFIG.ROAD_COST_PER_UNIT * mult);
        return { len, bridge, ferry, cost };
    }

    function build(a, b, opts) {
        const q = quote(a, b, opts);
        if (!q) return { ok: false, reason: 'invalid' };
        if (!SC.canAfford(q.cost)) return { ok: false, reason: 'money', cost: q.cost };
        SC.state.money -= q.cost;
        const edge = { a, b, len: q.len, bridge: q.bridge, ferry: q.ferry, cost: q.cost, level: 0 };
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
    // trucks HIGHWAY_SPEED_MULT× faster on that edge; a ferry crossing
    // moves them FERRY_SPEED_MULT slower instead (mutually exclusive —
    // see upgradeQuote). Congestion (when enabled) then applies on top
    // of whichever base multiplier applies.
    function speedMult(edge) {
        if (!edge) return 1;
        const base = edge.level ? SC.CONFIG.HIGHWAY_SPEED_MULT : (edge.ferry ? SC.CONFIG.FERRY_SPEED_MULT : 1);
        return base * congestionMult(edge);
    }

    // Quote for upgrading a road to a highway; null when not possible.
    // A ferry crossing can't be paved into a highway — it's a boat, not
    // a road surface.
    function upgradeQuote(edge) {
        if (!edge || edge.level > 0 || edge.ferry) return null;
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

    function getLineIntersection(a, b, c, d) {
        const rx = b.x - a.x;
        const ry = b.y - a.y;
        const sx = d.x - c.x;
        const sy = d.y - c.y;
        const r_cross_s = rx * sy - ry * sx;
        if (Math.abs(r_cross_s) < 1e-6) return null;

        const q_minus_p_x = c.x - a.x;
        const q_minus_p_y = c.y - a.y;
        const t = (q_minus_p_x * sy - q_minus_p_y * sx) / r_cross_s;
        const u = (q_minus_p_x * ry - q_minus_p_y * rx) / r_cross_s;

        // Ensure intersection lies strictly within the interior of both segments
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: a.x + t * rx,
                y: a.y + t * ry,
                t,
                u
            };
        }
        return null;
    }

    // Shortest distance from a point to a segment (clamped to its endpoints).
    function pointSegDist(px, py, ax, ay, bx, by) {
        const dx = bx - ax, dy = by - ay;
        const l2 = dx * dx + dy * dy;
        let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    }

    // Distance from (x,y) to the nearest built road, or Infinity if there
    // are none yet. Used to keep newly-spawned/placed sites from landing on
    // top of a road (see NODE_ROAD_CLEARANCE, SC.map.relocateOffRoad).
    function pointRoadDist(x, y) {
        let best = Infinity;
        const edges = SC.state.edges;
        for (let i = 0; i < edges.length; i++) {
            const e = edges[i];
            const d = pointSegDist(x, y, e.a.x, e.a.y, e.b.x, e.b.y);
            if (d < best) best = d;
        }
        return best;
    }

    function findClosestCrossing(x, y, maxDist = 40) {
        let best = null;
        let bestDist = maxDist;
        const edges = SC.state.edges;
        for (let i = 0; i < edges.length; i++) {
            for (let j = i + 1; j < edges.length; j++) {
                const e1 = edges[i];
                const e2 = edges[j];
                // Skip if they share an endpoint (not crossing, just connected)
                if (e1.a === e2.a || e1.a === e2.b || e1.b === e2.a || e1.b === e2.b) continue;

                const pt = getLineIntersection(e1.a, e1.b, e2.a, e2.b);
                if (pt) {
                    const distToA1 = Math.hypot(pt.x - e1.a.x, pt.y - e1.a.y);
                    const distToB1 = Math.hypot(pt.x - e1.b.x, pt.y - e1.b.y);
                    const distToA2 = Math.hypot(pt.x - e2.a.x, pt.y - e2.a.y);
                    const distToB2 = Math.hypot(pt.x - e2.b.x, pt.y - e2.b.y);
                    
                    // Must be reasonably far from all endpoints to avoid visual clutter and pathing quirks
                    if (distToA1 >= 20 && distToB1 >= 20 && distToA2 >= 20 && distToB2 >= 20) {
                        const dist = Math.hypot(pt.x - x, pt.y - y);
                        if (dist < bestDist) {
                            bestDist = dist;
                            best = { x: pt.x, y: pt.y, e1, e2, t: pt.t, u: pt.u };
                        }
                    }
                }
            }
        }
        return best;
    }

    return { findEdge, quote, build, demolish, findPath, pathDist,
             speedMult, congestionMult, upgradeQuote, upgrade, getLineIntersection, findClosestCrossing,
             pointSegDist, pointRoadDist };
})();
