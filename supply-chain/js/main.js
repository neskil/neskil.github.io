// Bootstrap and game loop.
window.SC = window.SC || {};

SC.init = function() {
    // Resume the autosaved game unless this is a fresh/probe run
    const params = new URLSearchParams(location.search);
    const wantFresh = params.has('probe') || params.has('new');
    let restored = false;
    if (!wantFresh && SC.save.exists()) restored = SC.save.load();

    if (!restored) {
        SC.newState();
        SC.map._resetSeq();
        SC.map.generateWorld();
        const start = SC.state.nodes.find(n => n.isHQ);
        for (let i = 0; i < SC.CONFIG.START_TRUCKS; i++) SC.vehicles.addTruck(start);
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

        if (SC.state.gameStarted) {
            SC.state.time += dt;
            SC.economy.tick(dt);
            SC.factories.tick(dt);
            SC.vehicles.tick(dt);
            saveTimer += dt;
            if (saveTimer >= 5 && !wantFresh) {
                saveTimer = 0;
                SC.save.store();
            }
        }
        SC.render.frame(dt, SC.state.time);
        SC.ui.update(dt);
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && SC.state.gameStarted && !wantFresh) SC.save.store();
    });

    const probe = params.get('probe');
    if (probe !== null) SC.runProbe(parseFloat(probe) || 20);
};

// Headless verification hook (see CLAUDE.md): ?probe=N builds the starter
// roads, spawns an order, and fast-forwards N simulated seconds so a single
// screenshot shows roads, trucks and order bubbles without interaction.
SC.runProbe = function(seconds) {
    SC.state.gameStarted = true;
    SC.state.money = Math.max(SC.state.money, 5000);
    const f = SC.factories.all()[0];
    const nearest = (kind, mat) => SC.state.nodes
        .filter(n => n.active && n.kind === kind && (!mat || n.mat === mat))
        .sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y))[0];
    SC.roads.build(f, nearest('supplier', 'wheat'));
    SC.roads.build(f, nearest('supplier', 'water'));
    SC.roads.build(f, nearest('city'));
    const o = SC.economy.spawnOrder();
    if (o) SC.economy.planOrder(o);
    for (let t = 0; t < seconds; t += 0.05) {
        SC.state.time += 0.05;
        SC.economy.tick(0.05);
        SC.factories.tick(0.05);
        SC.vehicles.tick(0.05);
    }
};

document.addEventListener('DOMContentLoaded', SC.init);
