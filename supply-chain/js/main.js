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

    const hq = SC.state.nodes.find(n => n.isHQ) || SC.state.nodes[0];
    const canvas = document.getElementById('gameCanvas');
    SC.render.attach(canvas);
    SC.input.attach(canvas);
    SC.camera.fitWorld();
    // Start zoomed in on the starter cluster so the first roads are obvious
    SC.camera.focus(hq.x, hq.y, Math.max(SC.camera.cam.zoom * 1.6, 0.7));

    SC.on('unlock', n => { n.unlockAt = SC.state.time; });

    SC.ui.init();
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
                SC.economy.tick(dt);
                SC.factories.tick(dt);
                SC.vehicles.tick(dt);
                SC.research.tick(dt);
                if (SC.state.gameOver) break; // a sub-step can end the run
            }
            saveTimer += dt;
            if (saveTimer >= SC.CONFIG.AUTOSAVE_INTERVAL && !wantFresh) {
                saveTimer = 0;
                SC.save.store();
            }
        }
        SC.render.frame(dt, SC.state.time);
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
    // Force a debt balance so the red HUD/credit UI can be screenshotted
    if (p.has('debt')) SC.state.money = -Math.abs(parseFloat(p.get('debt')) || 800);
    // Default-countdown / game-over screenshots: &doom=N puts the balance
    // beyond the credit limit with N seconds on the clock; &gameover=1
    // triggers the foreclosure overlay directly.
    if (p.has('doom')) {
        SC.state.money = -(SC.creditLimit() + 800);
        SC.state.defaultIn = parseFloat(p.get('doom')) || SC.diff().defaultGrace;
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
            if (SC.placement.canPlaceAt(x, y)) res = SC.placement.place('yard', null, x, y);
        }
        if (res.ok) {
            SC.roads.build(hq, res.node);
            SC.state.activeYard = res.node;
            SC.vehicles.buyTruck();
        }
    }
};

document.addEventListener('DOMContentLoaded', SC.init);
