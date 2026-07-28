// Bootstrap and game loop.
window.SC = window.SC || {};

SC.init = function() {
    // Resume the autosaved game unless this is a fresh/probe run
    const params = new URLSearchParams(location.search);
    const wantFresh = params.has('probe') || params.has('new');
    let restored = false;
    if (!wantFresh && SC.save.exists()) restored = SC.save.load();

    if (!restored) {
        // Difficulty is chosen on the new-game screen (written to
        // localStorage by the picker so it survives the reload).
        SC.newState(localStorage.getItem('scTycoonDifficulty') || 'normal');
        SC.map._resetSeq();
        // ?seed=xyz reproduces a shared map exactly (river shape, node
        // layout); omit for a fresh random one. Menu shows the seed in
        // play so it can be copied/shared after the fact too.
        SC.map.generateWorld(params.get('seed'));
        const start = SC.state.nodes.find(n => n.isHQ);
        SC.state.activeYard = start;
        for (let i = 0; i < SC.CONFIG.START_TRUCKS; i++) SC.vehicles.addTruck(start, start);
    } else {
        SC.state.gameStarted = true;
    }
    
    if (SC.stats && SC.stats.initRun) {
        SC.stats.initRun();
    }

    const hq = SC.state.nodes.find(n => n.isHQ) || SC.state.nodes[0];
    const canvas = document.getElementById('gameCanvas');
    SC.render.attach(canvas);
    SC.input.attach(canvas);
    SC.camera.fitWorld();
    // Start zoomed in on the starter cluster so the first roads are obvious
    SC.camera.focus(hq.x, hq.y, Math.max(SC.camera.cam.zoom * 1.6, 0.7));

    SC.on('unlock', n => { n.unlockAt = SC.state.time; });

    // The field just grew: recompute camera bounds/min-zoom for the new
    // extent (setViewport is otherwise only called on resize) and let the
    // player know the frontier opened up.
    SC.on('fieldExpanded', () => {
        SC.camera.setViewport(window.innerWidth, window.innerHeight);
        SC.emit('toast', { text: '🗺️ The frontier expands — new land unlocked!', kind: 'info' });
    });

    SC.ui.init();
    // Headless verification hook (see CLAUDE.md): &tutorial=N drops a fresh
    // world straight onto tutorial step N (1-based, default 1) so the banner
    // and the focus dim/rings can be screenshotted. Deliberately NOT part of
    // ?probe=, which builds the starter roads and would satisfy the first
    // three steps before the shot is taken.
    if (params.has('tutorial')) {
        SC.state.gameStarted = true;
        SC.tutorial.start();
        const n = parseInt(params.get('tutorial'), 10);
        if (n > 1) SC.state.tutorialStep = Math.min(n - 1, SC.tutorial.stepCount - 1);
        SC._ui.updateTutorial();
    }
    if (restored) SC.emit('toast', { text: 'Game restored from autosave', kind: 'info' });

    let last = performance.now();
    let saveTimer = 0;
    function loop(now) {
        let dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        if (SC.state.gameStarted && !SC.state.paused && !SC.state.gameOver) {
            // Fast-forward: run `speed` fixed-size sub-steps of the same dt
            // rather than scaling dt itself, so trucks/crafting/interest
            // etc. see the same step size as at 1x (no physics drift) —
            // more simulated time per frame, not bigger, riskier steps.
            for (let i = 0; i < SC.state.speed; i++) {
                SC.state.time += dt;
                SC.map.tick(dt);
                SC.economy.tick(dt);
                SC.factories.tick(dt);
                SC.vehicles.tick(dt);
                SC.research.tick(dt);
                SC.stats.tick(dt);
                if (SC.state.gameOver) break; // a sub-step can end the run
            }
            saveTimer += dt;
            if (saveTimer >= SC.CONFIG.AUTOSAVE_INTERVAL && !wantFresh) {
                saveTimer = 0;
                SC.save.store();
            }
        }
        SC.render.frame(dt, SC.state.time);
        // Ambience/score run on the wall clock, so this stays outside the
        // fast-forward sub-step loop — 4× speed must not pitch the music up.
        SC.audio.update();
        SC.ui.update(dt);
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    // Save on every way a mobile browser can kill the tab: backgrounding
    // (visibilitychange), bfcache eviction / close (pagehide), and desktop
    // close (beforeunload). localStorage writes are synchronous, so these
    // are safe places to flush.
    const flush = () => { if (SC.state.gameStarted && !wantFresh && !SC.state.gameOver) SC.save.store(); };
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);

    const probe = params.get('probe');
    if (probe !== null) SC.runProbe(parseFloat(probe) || 20);
};

// Headless verification hook (see CLAUDE.md): ?probe=N builds the starter
// roads, spawns an order, and fast-forwards N simulated seconds so a single
// screenshot shows roads, trucks and order bubbles without interaction.
SC.runProbe = function(seconds) {
    SC.state.gameStarted = true;
    SC.state.money = Math.max(SC.state.money, 5000);
    const p = new URLSearchParams(location.search);
    if (p.has('dc')) SC.state.nextCustomerIn = 3;
    if (p.has('capacity')) SC.state.upgrades.truckCapacity = SC.CONFIG.UPGRADES.truckCapacity.max;
    if (p.has('speed')) SC.state.speed = parseInt(p.get('speed'), 10) || 1;
    // &expand=N applies N field expansions up front (bigger playing field +
    // mountains pushed further out), for screenshotting the enlarged canvas
    // without playing to the delivery milestones that trigger it.
    if (p.has('expand')) {
        const n = parseInt(p.get('expand'), 10) || 1;
        for (let i = 0; i < n; i++) SC.map.expandField();
        SC.camera.setViewport(window.innerWidth, window.innerHeight);
    }
    const f = SC.factories.all()[0];
    const nearest = (kind, mat) => SC.state.nodes
        .filter(n => n.active && n.kind === kind && (!mat || n.mat === mat))
        .sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y))[0];
    const city = nearest('city');
    SC.roads.build(f, nearest('supplier', 'wheat'));
    SC.roads.build(f, nearest('supplier', 'water'));
    SC.roads.build(f, city);
    const o = SC.economy.spawnOrder();
    if (o) SC.economy.planOrder(o);
    for (let t = 0; t < seconds; t += 0.05) {
        SC.state.time += 0.05;
        SC.economy.tick(0.05);
        SC.factories.tick(0.05);
        SC.vehicles.tick(0.05);
    }
    // Visual gallery (&sitegallery=1): drop one active supplier of every
    // raw material in a grid next to HQ, so all themed site models
    // (farm/lake/mine/pasture/grove/fab) can be screenshotted in one shot.
    // Bypasses placement rules on purpose — screenshot aid only.
    if (p.has('sitegallery')) {
        const hq = SC.state.nodes.find(n => n.isHQ);
        const mats = Object.keys(SC.GOODS).filter(g => SC.GOODS[g].raw);
        mats.forEach((mat, i) => {
            const col = i % 4, row = (i / 4) | 0;
            SC.map.makeNode('supplier', hq.x - 260 + col * 175, hq.y + 140 + row * 170,
                            { active: true, mat });
        });
    }
    // Pin the first planned order's route glow (&routeglow=1) so the
    // per-leg step colors (each leg tinted by its cargo) can be
    // screenshotted — same overlay as tapping the order row, but with a
    // far-off expiry so it survives the screenshot delay.
    if (p.has('routeglow')) {
        const o = SC.state.orders.find(o => o.route);
        if (o) {
            const paths = [];
            SC.inspect.collectRoutePaths(o.route, o.city, paths, o.product);
            SC.state.highlight = {
                paths, color: SC.GOODS[o.product].color,
                city: o.city, until: SC.state.time + 600
            };
        }
    }
    // Force a debt balance so the red HUD/credit UI can be screenshotted
    if (p.has('debt')) SC.state.money = -Math.abs(parseFloat(p.get('debt')) || 800);
    // Default-countdown / game-over screenshots: &doom=N puts the balance
    // beyond the credit limit with N seconds on the clock; &gameover=1
    // triggers the foreclosure overlay directly.
    if (p.has('doom')) {
        SC.state.money = -(SC.creditLimit() + 800);
        SC.state.defaultIn = parseFloat(p.get('doom')) || SC.defaultGrace();
    }
    if (p.has('gameover')) {
        SC.state.money = -(SC.creditLimit() + 800);
        SC.state.gameOver = true;
        SC.emit('gameOver', { debt: -SC.state.money });
    }
    // Complete the promotions tech and light one up (&promo=1)
    if (p.has('promo')) {
        SC.state.money = Math.max(SC.state.money, 50000);
        SC.state.research.completed.premiumContracts = true;
        SC.state.research.completed.promotions = true;
        SC.economy.startPromotion();
    }
    if (p.has('region')) {
        SC.map.unlockRegion();
    }
    if (p.has('spec')) {
        const f = SC.factories.all()[0];
        if (f) SC.factories.setSpecialization(f, f.recipe);
    }
    // Instantly complete research so the placement UI can be screenshotted
    if (p.has('research')) {
        SC.state.money = Math.max(SC.state.money, 50000);
        for (const id of p.get('research').split(',')) {
            if (SC.RESEARCH[id]) SC.state.research.completed[id] = true;
        }
    }
    // Complete pavedRoads and pave every built road, so highway styling
    // can be screenshotted
    if (p.has('highway')) {
        SC.state.money = Math.max(SC.state.money, 50000);
        SC.state.research.completed.pavedRoads = true;
        for (const e of SC.state.edges.slice()) SC.roads.upgrade(e);
    }
    // Level up every supplier N times (&suplevel=2) for the ▲ pips, and
    // &drain=1 empties supplier stocks so the red low-stock bar shows
    if (p.has('suplevel')) {
        const lv = parseInt(p.get('suplevel'), 10) || 1;
        SC.state.money = Math.max(SC.state.money, 100000);
        for (const n of SC.state.nodes) {
            if (n.kind !== 'supplier' || !n.active) continue;
            for (let i = 0; i < lv; i++) SC.economy.upgradeSupplier(n);
        }
    }
    if (p.has('drain')) {
        for (const n of SC.state.nodes) {
            if (n.kind === 'supplier') n.stock = Math.min(n.stock, 1);
        }
    }
    // Build a ferry crossing from HQ to a node mirrored across the river
    // (guaranteed to cross it, regardless of map seed/orientation), so
    // the teal dashed line + shuttling boat can be screenshotted.
    if (p.has('ferry')) {
        SC.state.money = Math.max(SC.state.money, 50000);
        const hq = SC.state.nodes.find(n => n.isHQ);
        const rv = SC.map.riverAt(hq.y);
        const other = SC.map.makeNode('yard', rv.x + (rv.x - hq.x), hq.y, { active: true });
        SC.roads.build(hq, other, { ferry: true });
    }
    // Same trick as &ferry=1, but a plain bridge — for screenshotting the
    // piered deck that now spans only the water, not the whole road.
    if (p.has('bridge')) {
        SC.state.money = Math.max(SC.state.money, 50000);
        const hq = SC.state.nodes.find(n => n.isHQ);
        const rv = SC.map.riverAt(hq.y);
        const other = SC.map.makeNode('yard', rv.x + (rv.x - hq.x), hq.y, { active: true });
        SC.roads.build(hq, other);
    }
    // Force-jam the factory->HQ edge with several trucks parked mid-span,
    // so the congestion glow overlay can be screenshotted without waiting
    // on real dispatch timing (&jam=1; also flips congestion on regardless
    // of difficulty default).
    if (p.has('jam')) {
        SC.state.congestionEnabled = true;
        SC.state.money = Math.max(SC.state.money, 50000);
        const edge = SC.roads.findEdge(f, city);
        if (edge) {
            for (let i = 0; i < 4; i++) {
                const truck = SC.vehicles.addTruck(f, f);
                truck.path = [edge.a, edge.b];
                truck.pathIdx = 0;
                truck.progress = 0.25 + i * 0.15;
                truck.phase = 'toDrop';
                truck.x = edge.a.x + (edge.b.x - edge.a.x) * truck.progress;
                truck.y = edge.a.y + (edge.b.y - edge.a.y) * truck.progress;
            }
        }
    }
    // Force a contract offer card (&contract=1), or an already-accepted
    // contract order (&contract=accept), so both UI states are screenshotable
    // without waiting on the random CONTRACT_INTERVAL timer.
    if (p.has('contract')) {
        SC.state.money = Math.max(SC.state.money, 50000);
        SC.economy.rollContractOffer();
        if (p.get('contract') === 'accept') SC.economy.acceptContract();
    }
    // Fire the Bridge-vs-Ferry crossing-choice modal (&crossing=1), using
    // the same mirrored-node trick as &ferry=1, so it's screenshotable
    // without manually tapping a river-crossing road.
    if (p.has('crossing')) {
        SC.state.money = Math.max(SC.state.money, 50000);
        const hq = SC.state.nodes.find(n => n.isHQ);
        const rv = SC.map.riverAt(hq.y);
        const other = SC.map.makeNode('yard', rv.x + (rv.x - hq.x), hq.y, { active: true });
        SC.emit('crossingChoice', { a: hq, b: other });
    }
    // Arm placement mode so the ghost preview can be screenshotted, e.g.
    // ?placemode=supplier:wheat
    if (p.has('placemode')) {
        const [kind, good] = p.get('placemode').split(':');
        SC.state.placeMode = { kind, good };
    }
    if (p.has('hoverAt')) {
        const [hx, hy] = p.get('hoverAt').split(',').map(Number);
        SC.input._setDebugHover(hx, hy);
    }
    // &select=hq|factory|<node id> picks the node a road would start from
    // (what tapping it does), so the build ghost can be screenshotted
    // together with &hoverAt: its cost label, the rings where a legal
    // crossing would build interchanges, or the red ✕ preview of a road the
    // overlap rules refuse.
    if (p.has('select')) {
        const key = p.get('select');
        SC.state.selectedNode = SC.state.nodes.find(n => String(n.id) === key) ||
            (key === 'factory' ? SC.factories.all()[0] : SC.state.nodes.find(n => n.isHQ));
    }
    // Put the map into both supply-gap states at once (&gaps=1): buy the
    // first for-sale factory, so its raw inputs are suddenly needed with no
    // supplier unlocked for them (staked claims appear), and demolish the
    // bakery's wheat road, so an owned supplier is needed with no route
    // (warning ring on the site itself).
    if (p.has('gaps')) {
        // Own a factory whose raw inputs have no supplier unlocked yet.
        let site = SC.state.nodes.find(n => n.kind === 'factory' && n.forSale && n.active);
        if (!site) site = SC.map.unlockNext(n => n.kind === 'factory');
        if (site) {
            SC.state.money += SC.CONFIG.FACTORY_SITE_PRICE;
            SC.factories.buySite(site);
            site.underConstruction = false; // skip the build timer for the shot
        }
        // Strand an owned supplier: park the fleet first, since demolish
        // (rightly) refuses a road with a truck on it.
        for (const t of SC.state.trucks) { t.path = null; t.jobs = []; t.cargo = []; }
        const bakery = SC.factories.all()[0];
        const wheat = SC.state.nodes.find(n => n.kind === 'supplier' && n.mat === 'wheat' && n.active);
        const edge = bakery && wheat && SC.roads.findEdge(bakery, wheat);
        if (edge) SC.roads.demolish(edge);
    }
    // Open the inspect tooltip on a node (&inspect=wheat|<mat>|hq|factory|
    // <node id>) without a real tap, so what a site actually reports —
    // stock, rate, the biome/yield row — can be screenshotted.
    if (p.has('inspect') && SC.input._setDebugInspect) {
        const key = p.get('inspect');
        const node = SC.state.nodes.find(n => String(n.id) === key) ||
            SC.state.nodes.find(n => n.kind === 'supplier' && n.mat === key && n.active) ||
            (key === 'factory' ? SC.factories.all()[0] : SC.state.nodes.find(n => n.isHQ));
        SC.state.mode = 'inspect';
        SC.input._setDebugInspect(node);
    }
    // Point the camera somewhere specific (&focus=x,y,zoom — zoom optional):
    // screenshots default to the HQ cluster, so this is how a far corner,
    // the whole-map view (&focus with a low zoom), or a specific site gets
    // framed for verification.
    if (p.has('focus')) {
        const [fx, fy, fz] = p.get('focus').split(',').map(Number);
        SC.camera.focus(fx, fy, fz || SC.camera.cam.zoom);
    }
    // Force a persistent loading + unloading crate near HQ so the transfer
    // animation can be screenshotted without catching a real 0.55s pickup.
    if (p.has('xfer') && SC.render._forceTransfer) {
        const hq = SC.state.nodes.find(n => n.isHQ);
        SC.render._forceTransfer(hq.x - 60, hq.y, 'wheat', 1, 999);
        SC.render._forceTransfer(hq.x + 60, hq.y, 'bread', -1, 999);
    }
    // Build a second truck yard near HQ and station a truck there, so the
    // yard marker + per-yard truck count can be screenshotted. Try a ring
    // of offsets since the starter cluster's exact layout is randomized.
    if (p.has('yard')) {
        SC.state.money = Math.max(SC.state.money, 50000);
        const hq = SC.state.nodes.find(n => n.isHQ);
        let res = { ok: false };
        for (let a = 0; a < 16 && !res.ok; a++) {
            const angle = (a / 16) * Math.PI * 2;
            const x = hq.x + Math.cos(angle) * 350, y = hq.y + Math.sin(angle) * 350;
            // Needs a spot HQ can also reach with a legal road (overlap
            // rules), since the shot is of the yard *plus* its road.
            if (SC.placement.canPlaceAt(x, y) &&
                !SC.roads.checkSegment(hq.x, hq.y, x, y, [hq]).blocked)
                res = SC.placement.place('yard', null, x, y);
        }
        if (res.ok) {
            SC.roads.build(hq, res.node);
            SC.state.activeYard = res.node;
            SC.vehicles.buyTruck();
        }
    }
    // Place a junction near HQ and road it in (same ring-search as &yard=1),
    // so the small routing-marker node can be screenshotted.
    if (p.has('junction')) {
        SC.state.money = Math.max(SC.state.money, 50000);
        const hq = SC.state.nodes.find(n => n.isHQ);
        let res = { ok: false };
        for (let a = 0; a < 16 && !res.ok; a++) {
            const angle = (a / 16) * Math.PI * 2;
            const x = hq.x + Math.cos(angle) * 250, y = hq.y + Math.sin(angle) * 250;
            if (SC.placement.canPlaceAt(x, y) &&
                !SC.roads.checkSegment(hq.x, hq.y, x, y, [hq]).blocked)
                res = SC.placement.place('junction', null, x, y);
        }
        if (res.ok) SC.roads.build(hq, res.node);
    }
    // Force an interchange (&interchange=1): with 'intersections' researched
    // a road laid across another one builds a junction at the crossing and
    // splits both roads (see SC.roads.build). Drops two waypoints either
    // side of an existing road and connects them, so the result can be
    // screenshotted without hunting for a legal crossing by hand.
    if (p.has('interchange')) {
        SC.state.money = Math.max(SC.state.money, 50000);
        SC.state.research.completed.intersections = true;
        SC.state.research.completed.junctions = true;
        // Waypoints either side of the first starter road, at whatever pair
        // of offsets clears the rest of the cluster (the starter layout is
        // seed-dependent, so both sides get their own search).
        const edge = SC.state.edges[0];
        const dists = [160, 200, 240, 300, 380];
        let done = false;
        for (let i = 0; edge && !done && i < dists.length; i++) {
            for (let j = 0; !done && j < dists.length; j++) {
                const ux = (edge.b.x - edge.a.x) / edge.len, uy = (edge.b.y - edge.a.y) / edge.len;
                const mx = (edge.a.x + edge.b.x) / 2, my = (edge.a.y + edge.b.y) / 2;
                const p1 = { x: mx - uy * dists[i], y: my + ux * dists[i] };
                const p2 = { x: mx + uy * dists[j], y: my - ux * dists[j] };
                if (!SC.placement.canPlaceAt(p1.x, p1.y) || !SC.placement.canPlaceAt(p2.x, p2.y)) continue;
                const chk = SC.roads.checkSegment(p1.x, p1.y, p2.x, p2.y, []);
                if (chk.blocked || !chk.crossings.length) continue;
                const n1 = SC.placement.place('junction', null, p1.x, p1.y);
                const n2 = SC.placement.place('junction', null, p2.x, p2.y);
                done = n1.ok && n2.ok && SC.roads.build(n1.node, n2.node).ok;
            }
        }
    }
    // Force some interesting Stats-screen data (&stats=1): a few
    // achievements, a delivery breakdown, and a money-history sparkline,
    // so the ☰ menu's Stats & Achievements overlay is screenshotable
    // without a long real playthrough. Opens the overlay too.
    if (p.has('stats')) {
        SC.state.deliveredByProduct = { bread: 42, shoes: 17, car: 3 };
        SC.state.delivered = 62;
        SC.state.achievements.firstBridge = true;
        SC.state.achievements.firstJunction = true;
        SC.state.achievements.tenTruckFleet = true;
        SC.state.moneyHistory = [1200, 1500, 1100, 1800, 2400, 2100, 3000, 3500, 3200, 4000];
        if (SC.state.edges[0]) SC.state.edges[0].trips = 27;
        SC.ui.openStatsOverlay();
    }
};

document.addEventListener('DOMContentLoaded', SC.init);
