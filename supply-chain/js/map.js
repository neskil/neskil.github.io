// World generation: river, node sites (suppliers / factories / cities),
// starter cluster, milestone unlocks. Pure logic — no canvas/DOM.
window.SC = window.SC || {};

SC.map = (function() {
    const C = () => SC.CONFIG;

    // Set fresh by generateWorld(seed) each new map; every other function
    // below reads from it instead of Math.random, so a given seed always
    // lays out the same river/nodes. Falls back to a real-random seed if
    // generateWorld is ever called without one (shouldn't happen outside
    // very old tests).
    let rng = SC.rng.create(SC.rng.randomSeed());

    let nodeSeq = 0;
    function makeNode(kind, x, y, opts) {
        opts = opts || {};
        const id = opts.id !== undefined ? opts.id : nodeSeq;
        nodeSeq = Math.max(nodeSeq, id + 1);
        const n = {
            id,
            kind,                       // 'supplier' | 'factory' | 'city'
            x, y,
            mat: opts.mat || null,      // supplier raw-good key
            recipe: opts.recipe || null,// factory output good key
            active: !!opts.active,      // visible & usable
            forSale: !!opts.forSale,    // inactive factory site, buyable
            isHQ: !!opts.isHQ,
            edges: [],                  // neighbour node refs (kept by roads.js)
            // factory-only production state
            inv: {}, reserved: {}, queue: [], crafting: null,
            // supplier-only: upgrade level and regenerating stock
            level: opts.level || 0
        };
        if (kind === 'supplier') {
            n.stock = opts.stock !== undefined ? opts.stock : SC.supplierCap(n);
        }
        SC.state.nodes.push(n);
        return n;
    }

    // River spine runs top to bottom; x/halfWidth interpolated by y.
    function generateRiver() {
        const spine = [], halfWidths = [];
        const steps = 16;
        let cx = C().WORLD_W * (0.42 + rng.next() * 0.16);
        for (let i = 0; i <= steps; i++) {
            const y = (i / steps) * C().WORLD_H;
            cx += (rng.next() - 0.5) * C().WORLD_W * 0.07;
            cx = Math.max(C().WORLD_W * 0.28, Math.min(C().WORLD_W * 0.72, cx));
            spine.push({ x: cx, y });
            halfWidths.push(C().WORLD_W * (0.02 + rng.next() * 0.012));
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

    // Which bank a point sits on: -1 = left/west of the river, +1 =
    // right/east. Used for the river-grace ease-in (unlockNext keeps early
    // sites on HQ's bank). Falls back to +1 if there's no river yet.
    function sideOf(x, y) {
        const rv = riverAt(y);
        return rv ? (x < rv.x ? -1 : 1) : 1;
    }

    // The bank HQ started on (derived, so it survives save/restore without
    // being persisted). Defaults to +1 before HQ exists.
    function startSide() {
        const hq = SC.state.nodes.find(n => n.isHQ);
        return hq ? sideOf(hq.x, hq.y) : 1;
    }

    // Seconds left in the difficulty's river-grace window (0 once elapsed
    // or on a difficulty with no grace). During this window unlockNext
    // holds back sites on the far bank; economy.js uses the remaining time
    // to know when to retry a customer-DC spawn it had to skip.
    function riverGraceRemaining() {
        const mins = SC.diff().riverGraceMin || 0;
        return Math.max(0, mins * 60 - SC.state.time);
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
            const x = C().NODE_MARGIN + rng.next() * (C().WORLD_W - 2 * C().NODE_MARGIN);
            const y = C().NODE_MARGIN + rng.next() * (C().WORLD_H - 2 * C().NODE_MARGIN);
            if (!isInRiver(x, y) && Math.abs(x - riverAt(y).x) > riverAt(y).halfW + 50 &&
                farFromOthers(x, y, minDist)) return { x, y };
        }
        return null;
    }

    // Spot near (px,py) at roughly the given distance, on land, clear of others.
    function spotNear(px, py, dist, minDist) {
        for (let a = 0; a < 200; a++) {
            const ang = rng.next() * Math.PI * 2;
            const d = dist * (0.7 + rng.next() * 0.6);
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

    // seed: any string/number. Same seed -> same river shape and node
    // layout (this is the whole map — milestone/customer-DC unlock order
    // through the pool is deterministic already, so a seed fully
    // reproduces a shared map). Omit for a fresh random one.
    function generateWorld(seed) {
        const usedSeed = (seed !== undefined && seed !== null && seed !== '') ? seed : SC.rng.randomSeed();
        rng = SC.rng.create(usedSeed);
        SC.state.seed = String(usedSeed);
        nodeSeq = 0;
        generateRiver();
        const md = C().NODE_MIN_DIST;

        // Starter cluster on one river side: HQ city, factory, red+blue suppliers.
        const side = rng.next() < 0.5 ? -1 : 1;
        let hx, hy;
        for (let a = 0; ; a++) {
            hy = C().WORLD_H * (0.35 + rng.next() * 0.3);
            const rv = riverAt(hy);
            const room = side < 0 ? rv.x - rv.halfW - C().NODE_MARGIN
                                  : C().WORLD_W - C().NODE_MARGIN - (rv.x + rv.halfW);
            hx = side < 0 ? C().NODE_MARGIN + room * (0.3 + rng.next() * 0.4)
                          : rv.x + rv.halfW + room * (0.3 + rng.next() * 0.4);
            if (!isInRiver(hx, hy) || a > 50) break;
        }
        const hq = makeNode('city', hx, hy, { active: true, isHQ: true });

        // Bread chain to start: bakery + wheat & water suppliers near HQ
        const fSpot = spotNear(hx, hy, 300, md) || randomLandSpot(md);
        const factory = makeNode('factory', fSpot.x, fSpot.y, { active: true, recipe: 'bread' });
        const s1 = spotNear(factory.x, factory.y, 320, md) || randomLandSpot(md);
        makeNode('supplier', s1.x, s1.y, { active: true, mat: 'wheat' });
        const s2 = spotNear(factory.x, factory.y, 320, md) || randomLandSpot(md);
        makeNode('supplier', s2.x, s2.y, { active: true, mat: 'water' });

        // Locked pool, activated by delivery milestones. Order matters:
        // the sneaker chain arrives first, then the two-tier car chain
        // (ore + coal -> smelter -> steel; steel + chips -> car factory),
        // then the three-tier robot chain — it reuses rubber, chips and
        // steel from the earlier chains (copper + rubber -> wire mill;
        // wire + chips -> circuit factory; circuit + steel -> robot
        // factory), so those roads/suppliers now do double duty.
        const pool = [
            ['supplier', { mat: 'wool' }],
            ['supplier', { mat: 'rubber' }],
            ['factory', { forSale: true, recipe: 'shoes' }],
            ['city', {}],
            ['supplier', { mat: 'ore' }],
            ['supplier', { mat: 'coal' }],
            ['factory', { forSale: true, recipe: 'steel' }],
            ['supplier', { mat: 'chips' }],
            ['factory', { forSale: true, recipe: 'car' }],
            ['city', {}],
            ['supplier', { mat: 'wheat' }],
            ['factory', { forSale: true, recipe: 'bread' }],
            ['supplier', { mat: 'water' }],
            ['city', {}],
            ['supplier', { mat: 'copper' }],
            ['factory', { forSale: true, recipe: 'wire' }],
            ['factory', { forSale: true, recipe: 'circuit' }],
            ['factory', { forSale: true, recipe: 'robot' }]
        ];
        for (const [kind, opts] of pool) {
            const spot = randomLandSpot(md);
            if (spot) makeNode(kind, spot.x, spot.y, opts);
        }
        return SC.state.nodes;
    }

    // Activate the next locked site matching `filterFn` (pool order is
    // preserved either way, since inactive non-matching nodes are simply
    // skipped). No filter = next locked site of any kind. Used to keep
    // supplier/factory milestones and customer-DC spawns on separate,
    // independently-ordered tracks through the same pool.
    //
    // River-grace ease-in: while riverGraceRemaining() > 0, sites on the
    // far bank are skipped so early growth stays on HQ's side. The pool
    // order is still honoured — a held far-side node just waits for a later
    // unlock once the grace window closes. Returns null if nothing is
    // eligible right now (the caller can tell a true pool-exhaustion from a
    // grace hold via anyHeldByRiverGrace/held-node checks).
    function unlockNext(filterFn) {
        const holdFar = riverGraceRemaining() > 0;
        const hqSide = holdFar ? startSide() : 0;
        const next = SC.state.nodes.find(n => !n.active && (!filterFn || filterFn(n)) &&
            !(holdFar && sideOf(n.x, n.y) !== hqSide));
        if (!next) return null;
        next.active = true;
        return next;
    }

    // Are there inactive nodes matching `filterFn` that unlockNext is only
    // skipping because of the river-grace hold (i.e. they'd unlock now if
    // grace were over)? Lets economy.js retry a skipped customer spawn when
    // grace ends instead of mistaking it for a drained pool.
    function anyHeldByRiverGrace(filterFn) {
        if (riverGraceRemaining() <= 0) return false;
        const hqSide = startSide();
        return SC.state.nodes.some(n => !n.active && (!filterFn || filterFn(n)) &&
            sideOf(n.x, n.y) !== hqSide);
    }

    return { makeNode, generateWorld, generateRiver, riverAt, isInRiver,
             segmentCrossesRiver, unlockNext, anyHeldByRiverGrace,
             sideOf, startSide, riverGraceRemaining,
             _resetSeq: () => { nodeSeq = 0; } };
})();
