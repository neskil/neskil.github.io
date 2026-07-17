// Inspect-mode data: what a hovered/held node connects to, and which
// road segments serve those connections. Pure logic — no DOM/canvas;
// ui.js renders the tooltip, render.js draws the highlight.
window.SC = window.SC || {};

SC.inspect = (function() {

    function factoryInfo(node) {
        const g = SC.GOODS[node.recipe];
        const inputs = g.inputs.map(m => {
            const pick = SC.economy.bestSourceFor(m, node);
            return { good: m, pick: pick || null, connected: !!pick, dist: pick ? pick.dist : null };
        });
        return { kind: 'factory', node, building: g.building, recipe: node.recipe, inputs };
    }

    function supplierInfo(node) {
        const consumers = SC.factories.all()
            .filter(f => SC.GOODS[f.recipe].inputs.includes(node.mat))
            .map(f => {
                const dist = SC.roads.pathDist(node, f);
                const connected = dist !== Infinity;
                return { factory: f, connected, dist: connected ? dist : null };
            });
        return { kind: 'supplier', node, mat: node.mat, consumers };
    }

    function cityInfo(node) {
        const orders = SC.state.orders.filter(o => o.city === node);
        return { kind: 'city', node, orders };
    }

    function junctionInfo(node) {
        return { kind: 'junction', node };
    }

    // What to show for a hovered/held node, or null if it has nothing to say.
    function infoFor(node) {
        if (!node || !node.active) return null;
        if (node.kind === 'factory') return factoryInfo(node);
        if (node.kind === 'supplier') return supplierInfo(node);
        if (node.kind === 'city') return cityInfo(node);
        if (node.kind === 'junction') return junctionInfo(node);
        return null;
    }

    // Walk a sourcing pick tree (from economy.bestSourceFor/order.route),
    // collecting every road leg from raw suppliers up to `dest` as a flat
    // list of node-polylines for the render-side glow overlay. `good` is
    // what's hauled on the pick.node→dest leg; it's attached to the path
    // array as a `.good` property (still a plain node array otherwise) so
    // the renderer can tint each leg by its cargo — recursive legs are
    // colored by the input material they feed the parent with.
    function collectRoutePaths(pick, dest, paths, good) {
        if (!pick) return;
        const leg = SC.roads.findPath(pick.node, dest);
        if (leg) {
            if (good) leg.path.good = good;
            paths.push(leg.path);
        }
        if (pick.srcs) {
            for (const m of Object.keys(pick.srcs)) collectRoutePaths(pick.srcs[m], pick.node, paths, m);
        }
    }

    // Every road segment relevant to a hovered/held node's info panel.
    function highlightPathsFor(info) {
        const paths = [];
        if (!info) return paths;
        if (info.kind === 'factory') {
            for (const inp of info.inputs) {
                if (inp.connected) collectRoutePaths(inp.pick, info.node, paths, inp.good);
            }
        } else if (info.kind === 'supplier') {
            for (const c of info.consumers) {
                if (!c.connected) continue;
                const leg = SC.roads.findPath(info.node, c.factory);
                if (leg) {
                    leg.path.good = info.mat;
                    paths.push(leg.path);
                }
            }
        } else if (info.kind === 'city') {
            for (const o of info.orders) {
                if (o.route) collectRoutePaths(o.route, info.node, paths, o.product);
            }
        }
        return paths;
    }

    return { infoFor, factoryInfo, supplierInfo, cityInfo, junctionInfo, collectRoutePaths, highlightPathsFor };
})();
