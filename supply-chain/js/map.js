// World generation: river, node sites (suppliers / factories / cities),
// starter cluster, milestone unlocks. Pure logic — no canvas/DOM.
window.SC = window.SC || {};

SC.map = (function() {
    const C = () => SC.CONFIG;

    let nodeSeq = 0;
    function makeNode(kind, x, y, opts) {
        opts = opts || {};
        const n = {
            id: nodeSeq++,
            kind,                       // 'supplier' | 'factory' | 'city'
            x, y,
            mat: opts.mat || null,      // supplier material key
            active: !!opts.active,      // visible & usable
            forSale: !!opts.forSale,    // inactive factory site, buyable
            isHQ: !!opts.isHQ,
            edges: [],                  // neighbour node refs (kept by roads.js)
            // factory-only production state
            inv: {}, reserved: {}, queue: [], crafting: null
        };
        SC.state.nodes.push(n);
        return n;
    }

    // River spine runs top to bottom; x/halfWidth interpolated by y.
    function generateRiver() {
        const spine = [], halfWidths = [];
        const steps = 16;
        let cx = C().WORLD_W * (0.42 + Math.random() * 0.16);
        for (let i = 0; i <= steps; i++) {
            const y = (i / steps) * C().WORLD_H;
            cx += (Math.random() - 0.5) * C().WORLD_W * 0.07;
            cx = Math.max(C().WORLD_W * 0.28, Math.min(C().WORLD_W * 0.72, cx));
            spine.push({ x: cx, y });
            halfWidths.push(C().WORLD_W * (0.02 + Math.random() * 0.012));
        }
        SC.state.river = { spine, halfWidths };
    }

    function riverAt(y) {
        const r = SC.state.river;
        if (!r) return null;
        const step = C().WORLD_H / (r.spine.length - 1);
        const i = Math.max(0, Math.min(r.spine.length - 2, Math.floor(y / step)));
        const t = (y - i * step) / step;
        return {
            x: r.spine[i].x + t * (r.spine[i + 1].x - r.spine[i].x),
            halfW: r.halfWidths[i] + t * (r.halfWidths[i + 1] - r.halfWidths[i])
        };
    }

    function isInRiver(x, y) {
        const rv = riverAt(y);
        return rv ? Math.abs(x - rv.x) < rv.halfW : false;
    }

    function segmentCrossesRiver(x1, y1, x2, y2) {
        const samples = 24;
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            if (isInRiver(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return true;
        }
        return false;
    }

    function farFromOthers(x, y, minDist) {
        return SC.state.nodes.every(n => Math.hypot(n.x - x, n.y - y) >= minDist);
    }

    function randomLandSpot(minDist) {
        for (let a = 0; a < 200; a++) {
            const x = C().NODE_MARGIN + Math.random() * (C().WORLD_W - 2 * C().NODE_MARGIN);
            const y = C().NODE_MARGIN + Math.random() * (C().WORLD_H - 2 * C().NODE_MARGIN);
            if (!isInRiver(x, y) && Math.abs(x - riverAt(y).x) > riverAt(y).halfW + 50 &&
                farFromOthers(x, y, minDist)) return { x, y };
        }
        return null;
    }

    // Spot near (px,py) at roughly the given distance, on land, clear of others.
    function spotNear(px, py, dist, minDist) {
        for (let a = 0; a < 200; a++) {
            const ang = Math.random() * Math.PI * 2;
            const d = dist * (0.7 + Math.random() * 0.6);
            const x = px + Math.cos(ang) * d, y = py + Math.sin(ang) * d;
            if (x < C().NODE_MARGIN || x > C().WORLD_W - C().NODE_MARGIN ||
                y < C().NODE_MARGIN || y > C().WORLD_H - C().NODE_MARGIN) continue;
            if (isInRiver(x, y)) continue;
            if (segmentCrossesRiver(px, py, x, y)) continue; // keep starter cluster on one side
            if (!farFromOthers(x, y, minDist)) continue;
            return { x, y };
        }
        return null;
    }

    function generateWorld() {
        nodeSeq = 0;
        generateRiver();
        const md = C().NODE_MIN_DIST;

        // Starter cluster on one river side: HQ city, factory, red+blue suppliers.
        const side = Math.random() < 0.5 ? -1 : 1;
        let hx, hy;
        for (let a = 0; ; a++) {
            hy = C().WORLD_H * (0.35 + Math.random() * 0.3);
            const rv = riverAt(hy);
            const room = side < 0 ? rv.x - rv.halfW - C().NODE_MARGIN
                                  : C().WORLD_W - C().NODE_MARGIN - (rv.x + rv.halfW);
            hx = side < 0 ? C().NODE_MARGIN + room * (0.3 + Math.random() * 0.4)
                          : rv.x + rv.halfW + room * (0.3 + Math.random() * 0.4);
            if (!isInRiver(hx, hy) || a > 50) break;
        }
        const hq = makeNode('city', hx, hy, { active: true, isHQ: true });

        const fSpot = spotNear(hx, hy, 300, md) || randomLandSpot(md);
        const factory = makeNode('factory', fSpot.x, fSpot.y, { active: true });
        const s1 = spotNear(factory.x, factory.y, 320, md) || randomLandSpot(md);
        makeNode('supplier', s1.x, s1.y, { active: true, mat: 'red' });
        const s2 = spotNear(factory.x, factory.y, 320, md) || randomLandSpot(md);
        makeNode('supplier', s2.x, s2.y, { active: true, mat: 'blue' });

        // Locked pool, activated by delivery milestones. Order matters:
        // yellow supplier early so all three products become craftable.
        const pool = [
            ['supplier', { mat: 'yellow' }],
            ['city', {}],
            ['factory', { forSale: true }],
            ['supplier', { mat: 'red' }],
            ['city', {}],
            ['supplier', { mat: 'blue' }],
            ['factory', { forSale: true }],
            ['city', {}],
            ['supplier', { mat: 'yellow' }],
            ['city', {}],
            ['factory', { forSale: true }],
            ['city', {}]
        ];
        for (const [kind, opts] of pool) {
            const spot = randomLandSpot(md);
            if (spot) makeNode(kind, spot.x, spot.y, opts);
        }
        return SC.state.nodes;
    }

    // Activate the next locked site. Returns the node or null.
    function unlockNext() {
        const next = SC.state.nodes.find(n => !n.active);
        if (!next) return null;
        next.active = true;
        return next;
    }

    return { makeNode, generateWorld, generateRiver, riverAt, isInRiver,
             segmentCrossesRiver, unlockNext,
             _resetSeq: () => { nodeSeq = 0; } };
})();
