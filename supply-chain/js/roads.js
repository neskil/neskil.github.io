// Road network: building, cost, Dijkstra pathfinding. Pure logic.
window.SC = window.SC || {};

SC.roads = (function() {

    function findEdge(a, b) {
        return SC.state.edges.find(e =>
            (e.a === a && e.b === b) || (e.a === b && e.b === a)) || null;
    }

    // ── Overlap rules ───────────────────────────────────────────────────
    // A road may not be laid over the top of the network — that's what
    // turned mature maps into a cat's cradle of map-long diagonals drawn
    // straight over everything. Two rules, both quoted here and surfaced by
    // the build ghost (render-network) and a toast (input):
    //   1. It may not brush past a site that isn't one of its own endpoints
    //      (NODE_ROAD_CLEARANCE) — route *through* that site instead, which
    //      is what makes a network of hops rather than one long bypass.
    //   2. It may not cross another road at all until the (cheap, early)
    //      'intersections' research; afterwards a crossing is legal but
    //      builds a real interchange — a junction node splitting both roads,
    //      priced per crossing at PLACEMENT_INTERSECTION_PRICE, the same as
    //      retrofitting one by hand — so the two roads genuinely meet
    //      instead of overlapping.
    // A blocked prospect comes back from quote() with `.blocked` set (and a
    // matching blockMessage) instead of null, so the UI can say why.

    // Every existing edge the segment a→b crosses, ordered along it.
    // Edges sharing one of `ignore`'s nodes are connected to the new road,
    // not crossed by it.
    function edgeCrossings(ax, ay, bx, by, ignore) {
        const p = { x: ax, y: ay }, q = { x: bx, y: by };
        const out = [];
        for (const e of SC.state.edges) {
            if (ignore.indexOf(e.a) !== -1 || ignore.indexOf(e.b) !== -1) continue;
            const pt = getLineIntersection(p, q, e.a, e.b);
            if (pt) out.push({ edge: e, x: pt.x, y: pt.y, t: pt.t, u: pt.u });
        }
        return out.sort((m, n) => m.t - n.t);
    }

    // Geometry verdict for a prospective road, independent of who owns its
    // ends — the build ghost runs it against a bare pointer position, so it
    // takes raw coordinates plus the nodes the segment is allowed to touch.
    // Returns { blocked: reason|null, crossings, node?, at? }.
    function checkSegment(ax, ay, bx, by, ignore) {
        const C = SC.CONFIG;
        ignore = ignore || [];
        for (const n of SC.state.nodes) {
            if (!n.active || ignore.indexOf(n) !== -1) continue;
            if (pointSegDist(n.x, n.y, ax, ay, bx, by) < C.NODE_ROAD_CLEARANCE)
                return { blocked: 'node', node: n, crossings: [] };
        }
        const crossings = edgeCrossings(ax, ay, bx, by, ignore);
        // The plain rule comes first, so a player without the research hears
        // "roads can't cross" rather than a lecture on interchange geometry.
        if (crossings.length && !(SC.research && SC.research.isDone('intersections')))
            return { blocked: 'crossing', at: crossings[0], crossings };
        // An interchange needs room. On top of a node (or of the next
        // interchange along) it would leave a stub edge shorter than the
        // roundabout drawn over it; midstream it would be a roundabout
        // floating on the river.
        for (let i = 0; i < crossings.length; i++) {
            const c = crossings[i];
            if (SC.map.isInRiver(c.x, c.y)) return { blocked: 'water', at: c, crossings };
            const tight = [c.edge.a, c.edge.b, { x: ax, y: ay }, { x: bx, y: by }]
                .some(p => Math.hypot(c.x - p.x, c.y - p.y) < C.ROAD_JUNCTION_MIN_GAP) ||
                (i > 0 && Math.hypot(c.x - crossings[i - 1].x, c.y - crossings[i - 1].y) < C.ROAD_JUNCTION_MIN_GAP);
            if (tight) return { blocked: 'tight', at: c, crossings };
        }
        return { blocked: null, crossings };
    }

    function nodeLabel(n) {
        if (!n) return 'a site';
        if (n.isHQ) return 'HQ';
        if (n.kind === 'supplier') return `the ${SC.nameOf(n.mat).toLowerCase()} supplier`;
        if (n.kind === 'factory') return `the ${(SC.GOODS[n.recipe].building || 'factory').toLowerCase()}`;
        if (n.kind === 'junction') return 'a junction';
        if (n.kind === 'yard') return 'a truck yard';
        return 'a customer DC';
    }

    // Why a quote (or a checkSegment verdict) is blocked, in words. Pure
    // string — input.js toasts it, render-network labels the ghost with it.
    function blockMessage(q) {
        switch (q && q.blocked) {
            case 'node': return `That road would run over ${nodeLabel(q.node)} — connect through it instead`;
            case 'crossing': return 'Roads can’t cross — route through a node, or research Road Crossings ➕';
            case 'tight': return 'No room for an interchange where those roads cross';
            case 'water': return 'Roads can’t cross midstream — that interchange would sit in the river';
            default: return '';
        }
    }

    // The spans a prospective road is actually built from: one per stretch
    // between its endpoints and its interchanges. Each is priced on its own,
    // since one span may cross the river while another doesn't.
    function spanQuotes(a, b, crossings, wantFerry) {
        const pts = [a].concat(crossings, [b]);
        const out = [];
        for (let i = 0; i < pts.length - 1; i++) {
            const p = pts[i], q = pts[i + 1];
            const len = Math.hypot(q.x - p.x, q.y - p.y);
            const bridge = SC.map.segmentCrossesRiver(p.x, p.y, q.x, q.y);
            const ferry = wantFerry && bridge;
            const mult = ferry ? SC.CONFIG.FERRY_COST_MULT : (bridge ? SC.CONFIG.BRIDGE_MULT : 1);
            out.push({ len, bridge, ferry, cost: Math.round(len * SC.CONFIG.ROAD_COST_PER_UNIT * mult) });
        }
        return out;
    }

    // Quote for a prospective road; null when the pair is meaningless (same
    // node, inactive, already roaded), otherwise a quote — with `.blocked`
    // set when the overlap rules above forbid it. `opts.ferry` requests a
    // ferry instead of a bridge for a river crossing — cheaper than
    // BRIDGE_MULT, at the cost of FERRY_SPEED_MULT (see speedMult).
    // Meaningless (and ignored) for a segment that doesn't cross the river.
    // `cost` covers every span plus `fee`, the interchange junctions.
    function quote(a, b, opts) {
        if (!a || !b || a === b) return null;
        if (!a.active || !b.active) return null;
        if (findEdge(a, b)) return null;
        const len = Math.hypot(a.x - b.x, a.y - b.y);
        const bridge = SC.map.segmentCrossesRiver(a.x, a.y, b.x, b.y);
        const wantFerry = !!(opts && opts.ferry);
        const chk = checkSegment(a.x, a.y, b.x, b.y, [a, b]);
        const spans = spanQuotes(a, b, chk.crossings, wantFerry);
        const fee = chk.crossings.length * SC.CONFIG.PLACEMENT_INTERSECTION_PRICE;
        const cost = spans.reduce((sum, s) => sum + s.cost, 0) + fee;
        const q = { len, bridge, ferry: wantFerry && bridge, cost, fee,
                    crossings: chk.crossings, spans };
        if (chk.blocked) {
            q.blocked = chk.blocked;
            q.node = chk.node || null;
            q.at = chk.at || null;
        }
        return q;
    }

    function build(a, b, opts) {
        const q = quote(a, b, opts);
        if (!q) return { ok: false, reason: 'invalid' };
        if (q.blocked) return { ok: false, reason: q.blocked, message: blockMessage(q), quote: q };
        if (!SC.canAfford(q.cost)) return { ok: false, reason: 'money', cost: q.cost };
        SC.state.money -= q.cost;
        // Interchanges first: each crossed road is split by its own junction
        // node, which the new road then hops through.
        const chain = [a];
        for (const c of q.crossings) {
            const j = SC.map.makeNode('junction', c.x, c.y, { active: true });
            splitEdge(c.edge, j, c.u);
            chain.push(j);
            SC.emit('sitePlaced', { node: j, cost: SC.CONFIG.PLACEMENT_INTERSECTION_PRICE });
        }
        chain.push(b);
        const edges = [];
        for (let i = 0; i < chain.length - 1; i++) {
            const s = q.spans[i];
            const edge = { a: chain[i], b: chain[i + 1], len: s.len, bridge: s.bridge,
                           ferry: s.ferry, cost: s.cost, level: 0 };
            SC.state.edges.push(edge);
            chain[i].edges.push(chain[i + 1]);
            chain[i + 1].edges.push(chain[i]);
            edges.push(edge);
        }
        SC.economy && SC.economy.onNetworkChanged();
        bumpNetworkVersion();
        for (const edge of edges) SC.emit('roadBuilt', edge);
        return { ok: true, edge: edges[0], edges, junctions: chain.slice(1, -1) };
    }

    // Replace `edge` with two edges meeting at `node`, which sits at
    // fraction `t` along it (edge.a → edge.b). Shared by the interchanges
    // built above and the manual retrofit tool (SC.placement 'intersection'),
    // including re-seating any truck currently driving the old edge.
    function splitEdge(edge, node, t) {
        const a = edge.a, b = edge.b;
        const idx = SC.state.edges.indexOf(edge);
        if (idx !== -1) SC.state.edges.splice(idx, 1);
        a.edges.splice(a.edges.indexOf(b), 1);
        b.edges.splice(b.edges.indexOf(a), 1);

        // Each half re-derives its own bridge/ferry state and length-priced
        // cost (a split can leave one half over water and the other dry),
        // and inherits the original's highway level.
        const halves = [[a, node], [node, b]].map(([p, q]) => {
            const len = Math.hypot(q.x - p.x, q.y - p.y);
            const bridge = SC.map.segmentCrossesRiver(p.x, p.y, q.x, q.y);
            const ferry = !!edge.ferry && bridge;
            const mult = ferry ? SC.CONFIG.FERRY_COST_MULT : (bridge ? SC.CONFIG.BRIDGE_MULT : 1);
            return { a: p, b: q, len, bridge, ferry,
                     cost: Math.round(len * SC.CONFIG.ROAD_COST_PER_UNIT * mult), level: edge.level };
        });
        for (const half of halves) {
            SC.state.edges.push(half);
            half.a.edges.push(half.b);
            half.b.edges.push(half.a);
        }

        // Re-seat in-flight trucks: insert the node into their path and
        // rescale the progress of whichever leg they're driving right now.
        for (const truck of SC.state.trucks) {
            if (!truck.path) continue;
            for (let k = 0; k < truck.path.length - 1; k++) {
                const na = truck.path[k], nb = truck.path[k + 1];
                if (!((na === a && nb === b) || (na === b && nb === a))) continue;
                truck.path.splice(k + 1, 0, node);
                if (k < truck.pathIdx) {
                    truck.pathIdx++;
                } else if (k === truck.pathIdx) {
                    const f = (na === a) ? t : (1 - t);
                    if (truck.progress < f) {
                        truck.progress = truck.progress / f;
                    } else {
                        truck.pathIdx++;
                        truck.progress = (truck.progress - f) / (1 - f);
                    }
                }
                k++; // skip the node just inserted
            }
        }
        bumpNetworkVersion();
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
        bumpNetworkVersion();
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
        bumpNetworkVersion();
        SC.emit('roadUpgraded', { edge, cost: q.cost });
        return { ok: true, edge };
    }

    let pathCache = new Map();

    function bumpNetworkVersion() {
        if (SC.state) {
            SC.state.networkVersion = (SC.state.networkVersion || 0) + 1;
        }
        pathCache.clear();
    }

    function clearCache() {
        pathCache.clear();
    }

    // Dijkstra over the road graph, weighted by travel TIME (highway
    // edges count len/speedMult), so routing prefers upgraded roads.
    // Returns { path: [nodes], dist } or null.
    function findPath(from, to) {
        if (!from || !to) return null;
        if (from === to) return { path: [from], dist: 0 };

        const ver = SC.state ? (SC.state.networkVersion || 0) : 0;
        let cong = 's';
        if (SC.state && SC.state.congestionEnabled) {
            let totalJammed = 0;
            const edges = SC.state.edges;
            for (let i = 0; i < edges.length; i++) {
                const cnt = SC.vehicles ? SC.vehicles.truckCountOnEdge(edges[i]) : 0;
                if (cnt > 0) totalJammed += (i + 1) * cnt;
            }
            cong = 'c' + totalJammed;
        }
        const fromId = from.id !== undefined ? from.id : from;
        const toId = to.id !== undefined ? to.id : to;
        const key = ver + ':' + cong + ':' + fromId + ':' + toId;

        if (pathCache.has(key)) {
            const cached = pathCache.get(key);
            return cached ? { path: cached.path.slice(), dist: cached.dist } : null;
        }

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
                if (!e) continue;
                const d = dist.get(cur) + e.len / speedMult(e);
                if (!dist.has(nb) || d < dist.get(nb)) {
                    dist.set(nb, d);
                    prev.set(nb, cur);
                    open.push(nb);
                }
            }
        }
        if (!dist.has(to)) {
            if (pathCache.size > 2000) pathCache.clear();
            pathCache.set(key, null);
            return null;
        }
        const path = [to];
        while (path[0] !== from) path.unshift(prev.get(path[0]));
        const res = { path, dist: dist.get(to) };

        if (pathCache.size > 2000) pathCache.clear();
        pathCache.set(key, { path: path.slice(), dist: res.dist });

        return { path: res.path.slice(), dist: res.dist };
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

    // Is there any unconnected crossing left on the map? New roads can't
    // make one any more (they build an interchange instead, see build), so
    // this is only ever true for a save from before that rule — which is
    // exactly when the manual retrofit tool is worth offering (see
    // SC.ui.updateIntersectionBtn).
    function hasCrossings() {
        const edges = SC.state.edges;
        for (let i = 0; i < edges.length; i++) {
            for (let j = i + 1; j < edges.length; j++) {
                const e1 = edges[i], e2 = edges[j];
                if (e1.a === e2.a || e1.a === e2.b || e1.b === e2.a || e1.b === e2.b) continue;
                if (getLineIntersection(e1.a, e1.b, e2.a, e2.b)) return true;
            }
        }
        return false;
    }

    // Test/dev hook: an edge that ignores the overlap rules, i.e. the kind of
    // crossing a pre-1.56 save can still contain. Not reachable in play.
    function _addRawEdge(a, b) {
        const len = Math.hypot(a.x - b.x, a.y - b.y);
        const bridge = SC.map.segmentCrossesRiver(a.x, a.y, b.x, b.y);
        const edge = { a, b, len, bridge, ferry: false, level: 0,
                       cost: Math.round(len * SC.CONFIG.ROAD_COST_PER_UNIT * (bridge ? SC.CONFIG.BRIDGE_MULT : 1)) };
        SC.state.edges.push(edge);
        a.edges.push(b);
        b.edges.push(a);
        bumpNetworkVersion();
        return edge;
    }

    return { findEdge, quote, build, demolish, findPath, pathDist,
             speedMult, congestionMult, upgradeQuote, upgrade, getLineIntersection, findClosestCrossing,
             checkSegment, blockMessage, splitEdge, hasCrossings,
             bumpNetworkVersion, clearCache,
             pointSegDist, pointRoadDist, _addRawEdge };
})();
