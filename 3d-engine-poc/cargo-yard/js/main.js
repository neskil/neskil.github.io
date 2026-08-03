(function (window) {
    'use strict';

    // Bootstrap. The only file allowed to know the order things come up in.
    const CY = window.CY = window.CY || {};

    function boot() {
        const container = document.getElementById('canvas-container');
        const R = CY.render.init(container);

        CY.yard3d.attach(R.scene);
        CY.pieces3d.attach(R.scene);
        CY.weather.attach(R.scene);

        const vehicle = new CY.ReachStacker(R.scene);
        const crane = new CY.PortCrane(R.scene);
        CY.render.onFrame(function (delta) {
            vehicle.update(delta);
            crane.update(delta);
            CY.audio.update(delta);
            if (R.cameraMode === 'vehicle') CY.render.followVehicle(vehicle);
            if (R.cameraMode === 'gantry') CY.render.followCrane(crane);
        });

        const terminal = new CY.Terminal(R.scene);

        CY.ui.init();
        CY.input.attach({ vehicle: vehicle, crane: crane });
        CY.uiBind.bind({ vehicle: vehicle, crane: crane, terminal: terminal });

        // Restore what the player last chose.
        const settings = CY.save.load().settings;
        CY.audio.setMuted(settings.audio === false);
        document.getElementById('btn-audio').textContent = settings.audio === false ? '🔇' : '🔊';
        document.getElementById('weather-select').value = settings.weather || 'day';

        // Open in the sandbox — the POC's original behaviour, and the least
        // demanding way to meet the thing.
        CY.game.startSandbox();
        CY.render.frameYard(CY.state.yard);
        CY.weather.set(settings.weather || 'day');
        seedDemoYard();

        CY.render.start();

        // ?mission=m5 jumps straight in; handy for testing and for links.
        // ?autoplay=1 then has a naive solver finish it, which is how the
        // result overlay gets exercised headlessly. See CLAUDE.md.
        const params = new URLSearchParams(window.location.search);
        const wanted = params.get('mission');
        if (wanted && CY.missions.get(wanted)) CY.uiBind.startMission(wanted);
        if (params.get('autoplay')) window.setTimeout(autoplay, 60);
        if (params.get('open') === 'missions') {
            CY.ui.renderMissionList();
            CY.ui.show('overlay-missions');
        }
    }

    // First legal cell wins — no strategy at all, which is the point: it
    // proves a mission is finishable and drives the end-of-run report.
    function autoplay() {
        let guard = 0;
        while (CY.state.status === 'playing' && guard++ < 200) {
            let done = false;
            for (let r = 0; r < 4 && !done; r++) {
                for (let x = 0; x < CY.state.yard.w && !done; x++) {
                    for (let z = 0; z < CY.state.yard.d && !done; z++) {
                        CY.game.setCursor(x, z);
                        if (CY.state.cursor.x !== x || CY.state.cursor.z !== z) continue;
                        if (CY.game.preview().valid) { CY.game.place(); done = true; }
                    }
                }
                if (!done) CY.game.rotate(1);
            }
            if (!done) break;
        }
    }

    // A few boxes so the sandbox is not an empty slab on first load.
    function seedDemoYard() {
        [
            ['c40', 4, 3], ['c40', 4, 4], ['c40', 4, 3], ['c20', 8, 3],
            ['c20', 8, 4], ['kO', 2, 3], ['k2', 2, 5]
        ].forEach(function (spec) {
            CY.game.setSandboxPiece(spec[0]);
            CY.game.setCursor(spec[1], spec[2]);
            CY.game.place();
        });
        CY.game.setSandboxPiece('c20');
        CY.game.centreCursor();
        CY.game.publish();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})(window);
