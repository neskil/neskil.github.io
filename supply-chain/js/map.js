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
            specializedRecipe: opts.specializedRecipe || null, // factory specialized single recipe or null (Item 11)
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
        const W = SC.worldW(), H = SC.worldH();
        let cx = W * (0.42 + rng.next() * 0.16);
        for (let i = 0; i <= steps; i++) {
            const y = (i / steps) * H;
            cx += (rng.next() - 0.5) * W * 0.07;
            cx = Math.max(W * 0.28, Math.min(W * 0.72, cx));
            spine.push({ x: cx, y });
            halfWidths.push(W * (0.02 + rng.next() * 0.012));
        }
        SC.state.river = { spine, halfWidths };
    }

    function riverAt(y) {
        const r = SC.state.river;
        if (!r) return null;
        // Step from the spine's own span (its last y), not the live world
        // height: the river is laid out once at the base size, so a later
        // field expansion must not re-scale the y→segment mapping. Queries
        // past the spine's end clamp to the last segment (extrapolated).
        const step = r.spine[r.spine.length - 1].y / (r.spine.length - 1);
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

    // Where along a segment (as fractions t0<=t1 in [0,1]) it's actually
    // over the water, so a bridge/ferry can render just that stretch and
    // look like a normal road right up to the bank on either side. A finer
    // sampling than segmentCrossesRiver's boolean check, since this feeds
    // pixel placement rather than a yes/no.
    function riverCrossing(x1, y1, x2, y2) {
        const samples = 48;
        let t0 = null, t1 = null;
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            if (isInRiver(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) {
                if (t0 === null) t0 = t;
                t1 = t;
            }
        }
        if (t0 === null) return null;
        const pad = 1 / samples;
        return { t0: Math.max(0, t0 - pad), t1: Math.min(1, t1 + pad) };
    }

    function farFromOthers(x, y, minDist, except) {
        return SC.state.nodes.every(n => n === except || Math.hypot(n.x - x, n.y - y) >= minDist);
    }

    // True if (x,y) sits far enough from every built road to not read as
    // being "on" one. No roads yet (world-gen) => trivially clear.
    function clearOfRoads(x, y) {
        return SC.roads.pointRoadDist(x, y) >= C().NODE_ROAD_CLEARANCE;
    }

    function segMinDist(x, y, segs) {
        let best = Infinity;
        for (let i = 0; i < segs.length; i++) {
            const s = segs[i];
            const d = SC.roads.pointSegDist(x, y, s.a.x, s.a.y, s.b.x, s.b.y);
            if (d < best) best = d;
        }
        return best;
    }

    // The "unbuilt roads" the player asked about: straight lines between
    // pairs of nearby active sites that don't have a road *yet* but plausibly
    // will (short enough to be a realistic span, and running close to `node`
    // so they'd pass through it). We treat these like roads when nudging a
    // freshly-revealed site, so it doesn't land where a road is about to go —
    // the P→factory line in the report was exactly this. Restricted to lines
    // near the node so the list stays small and the check stays cheap.
    function candidateConnections(node) {
        const near = 350;   // only lines running close to the spot matter
        const maxLen = 900; // a realistic road span between two sites
        const segs = [];
        const act = SC.state.nodes.filter(n => n.active && n !== node);
        for (let i = 0; i < act.length; i++) {
            for (let j = i + 1; j < act.length; j++) {
                const A = act[i], B = act[j];
                if (Math.hypot(A.x - B.x, A.y - B.y) > maxLen) continue;
                if (SC.roads.findEdge(A, B)) continue; // already a built road
                if (SC.roads.pointSegDist(node.x, node.y, A.x, A.y, B.x, B.y) < near)
                    segs.push({ a: A, b: B });
            }
        }
        return segs;
    }

    // Ring-search outward from the node for the closest spot that clears
    // built roads (always), the river and other nodes — and, when `virt` is
    // given, those candidate connection lines too. Returns the spot or null.
    function searchClearSpot(node, clear, minDist, virt) {
        const rings = [clear + 12, clear * 1.8, clear * 2.8, clear * 4, clear * 5.4];
        const steps = 12;
        for (let r = 0; r < rings.length; r++) {
            const rad = rings[r];
            const a0 = r * 0.55; // stagger start angle per ring to sweep more directions
            for (let k = 0; k < steps; k++) {
                const ang = a0 + (k / steps) * Math.PI * 2;
                const x = node.x + Math.cos(ang) * rad;
                const y = node.y + Math.sin(ang) * rad;
                if (x < C().NODE_MARGIN || x > SC.worldW() - C().NODE_MARGIN) continue;
                if (y < C().NODE_MARGIN || y > SC.worldH() - C().NODE_MARGIN) continue;
                if (isInRiver(x, y) || Math.abs(x - riverAt(y).x) <= riverAt(y).halfW + 50) continue;
                if (!farFromOthers(x, y, minDist, node)) continue;
                if (SC.roads.pointRoadDist(x, y) < clear) continue;
                if (virt && segMinDist(x, y, virt) < clear) continue;
                return { x, y };
            }
        }
        return null;
    }

    // A pool/frontier site is positioned at world-gen, long before the player
    // lays any roads — so a milestone/customer site can reveal right on top of
    // a road (the reported case), or on the line where one is about to go. When
    // that happens this nudges it to the closest nearby spot that's clear,
    // trying hardest first and loosening in tiers (per the player's suggestion:
    // nudge a few ways, then give up and keep the original spot):
    //   1-2. avoid built roads AND likely connection lines (full, then reduced
    //        clearance / less crowding room);
    //   3-4. only reached when the node is literally on a built road and *must*
    //        move — drop the connection-line constraint rather than stay on a
    //        road. A node merely sitting on an unbuilt line is left put if the
    //        strict tiers fail (better there than shoved onto another line).
    // No-op when already clear of both, or when nothing suitable is in reach.
    function relocateOffRoad(node) {
        const clear = C().NODE_ROAD_CLEARANCE;
        const onBuilt = SC.state.edges.length > 0 && !clearOfRoads(node.x, node.y);
        const virt = candidateConnections(node);
        const onVirt = segMinDist(node.x, node.y, virt) < clear;
        if (!onBuilt && !onVirt) return false;

        const tiers = [{ clear: clear, minDist: 120, virt: true },
                       { clear: clear * 0.7, minDist: 90, virt: true }];
        if (onBuilt) tiers.push({ clear: clear, minDist: 100, virt: false },
                                { clear: clear * 0.7, minDist: 80, virt: false });

        for (const t of tiers) {
            const spot = searchClearSpot(node, t.clear, t.minDist, t.virt ? virt : null);
            if (spot) { node.x = spot.x; node.y = spot.y; return true; }
        }
        return false;
    }

    function randomLandSpot(minDist) {
        for (let a = 0; a < 200; a++) {
            const x = C().NODE_MARGIN + rng.next() * (SC.worldW() - 2 * C().NODE_MARGIN);
            const y = C().NODE_MARGIN + rng.next() * (SC.worldH() - 2 * C().NODE_MARGIN);
            if (!isInRiver(x, y) && Math.abs(x - riverAt(y).x) > riverAt(y).halfW + 50 &&
                farFromOthers(x, y, minDist)) return { x, y };
        }
        return null;
    }

    function nearestNodeDist(x, y) {
        let best = Infinity;
        for (const n of SC.state.nodes) best = Math.min(best, Math.hypot(n.x - x, n.y - y));
        return best;
    }

    // Like randomLandSpot, but the spot must sit within `maxToNearest` of an
    // already-placed node — so pool sites tether to the existing network and
    // never strand themselves in a far map corner behind one absurdly long
    // road. Either bank is still fair game (river-grace gates *when* far-bank
    // sites unlock, not whether they exist). Widens the leash a little each
    // time it fails, and finally falls back to an unconstrained spot so
    // generation can never stall on a crowded map.
    function randomLandSpotNear(minDist, maxToNearest) {
        for (let a = 0; a < 300; a++) {
            const x = C().NODE_MARGIN + rng.next() * (C().WORLD_W - 2 * C().NODE_MARGIN);
            const y = C().NODE_MARGIN + rng.next() * (C().WORLD_H - 2 * C().NODE_MARGIN);
            if (isInRiver(x, y) || Math.abs(x - riverAt(y).x) <= riverAt(y).halfW + 50) continue;
            if (!farFromOthers(x, y, minDist)) continue;
            const leash = maxToNearest * (1 + a / 300); // relax gradually if it's tight
            if (nearestNodeDist(x, y) > leash) continue;
            return { x, y };
        }
        return randomLandSpot(minDist);
    }

    // Spot near (px,py) at roughly the given distance, on land, clear of others.
    function spotNear(px, py, dist, minDist) {
        for (let a = 0; a < 200; a++) {
            const ang = rng.next() * Math.PI * 2;
            const d = dist * (0.7 + rng.next() * 0.6);
            const x = px + Math.cos(ang) * d, y = py + Math.sin(ang) * d;
            if (x < C().NODE_MARGIN || x > SC.worldW() - C().NODE_MARGIN ||
                y < C().NODE_MARGIN || y > SC.worldH() - C().NODE_MARGIN) continue;
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
            hy = SC.worldH() * (0.35 + rng.next() * 0.3);
            const rv = riverAt(hy);
            const room = side < 0 ? rv.x - rv.halfW - C().NODE_MARGIN
                                  : SC.worldW() - C().NODE_MARGIN - (rv.x + rv.halfW);
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
            const spot = randomLandSpotNear(md, SC.nodeMaxSpread());
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
        // Its spot was fixed at world-gen; a road may now run through it.
        relocateOffRoad(next);
        return next;
    }

    // A land spot inside the newly-opened frontier band (past the old
    // bounds on either axis), clear of the river and other nodes. Same
    // rejection-sampling shape as randomLandSpot, restricted to the band.
    function frontierSpot(oldW, oldH, minDist) {
        for (let a = 0; a < 200; a++) {
            const x = C().NODE_MARGIN + rng.next() * (SC.worldW() - 2 * C().NODE_MARGIN);
            const y = C().NODE_MARGIN + rng.next() * (SC.worldH() - 2 * C().NODE_MARGIN);
            if (x <= oldW - C().NODE_MARGIN && y <= oldH - C().NODE_MARGIN) continue; // not frontier
            if (isInRiver(x, y) || Math.abs(x - riverAt(y).x) < riverAt(y).halfW + 50) continue;
            if (!farFromOthers(x, y, minDist)) continue;
            if (!clearOfRoads(x, y)) continue;
            return { x, y };
        }
        return null;
    }

    // Grow the playing field by one expansion step (WORLD_EXPAND). Additive
    // to the near (high x+y) edge, so existing nodes/river keep their
    // coordinates and only new frontier land appears. Camera bounds, node
    // placement and the terrain backdrop all read SC.worldW()/worldH(), so
    // they follow automatically; render's bg cache re-bakes on the size
    // change. The frontier isn't empty: each expansion seeds it with a new
    // active supplier (a random raw) and a for-sale factory (a random
    // recipe), so there's something out there worth roading toward.
    // Emits 'fieldExpanded' for the UI (toast + camera re-fit).
    function expandField() {
        const ex = C().WORLD_EXPAND;
        const oldW = SC.state.worldW, oldH = SC.state.worldH;
        SC.state.worldW += ex.stepW;
        SC.state.worldH += ex.stepH;
        SC.state.expansions = (SC.state.expansions || 0) + 1;
        const seeded = [];
        const raws = Object.keys(SC.GOODS).filter(g => SC.GOODS[g].raw);
        const recipes = Object.keys(SC.GOODS).filter(g => !SC.GOODS[g].raw);
        // Both spawn active (visible) so they don't sit in — or reorder —
        // the milestone unlock queue; the factory is still forSale, i.e.
        // buyable with the usual tap-twice, like a milestone-unlocked site.
        const wants = [
            ['supplier', { active: true, mat: raws[(rng.next() * raws.length) | 0] }],
            ['factory', { active: true, forSale: true, recipe: recipes[(rng.next() * recipes.length) | 0] }]
        ];
        for (const [kind, opts] of wants) {
            const spot = frontierSpot(oldW, oldH, C().NODE_MIN_DIST);
            if (spot) {
                const n = makeNode(kind, spot.x, spot.y, opts);
                relocateOffRoad(n); // keep it off any road/likely-connection line too
                seeded.push(n);
            }
        }
        SC.emit('fieldExpanded', {
            expansions: SC.state.expansions,
            worldW: SC.state.worldW, worldH: SC.state.worldH, seeded
        });
        return SC.state.expansions;
    }

    // Fire the next scheduled expansion if this delivery count has reached
    // its threshold (WORLD_EXPAND.at). Called from the milestone hook in
    // economy.js. Returns true if it expanded.
    function maybeExpandField() {
        const at = C().WORLD_EXPAND.at;
        const done = SC.state.expansions || 0;
        if (done >= at.length || SC.state.delivered < at[done]) return false;
        expandField();
        return true;
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
             segmentCrossesRiver, riverCrossing, unlockNext, anyHeldByRiverGrace,
             expandField, maybeExpandField, relocateOffRoad, clearOfRoads,
             sideOf, startSide, riverGraceRemaining,
             _resetSeq: () => { nodeSeq = 0; } };
})();
