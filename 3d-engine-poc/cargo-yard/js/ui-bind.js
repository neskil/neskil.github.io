(function (window) {
    'use strict';

    // Clicks in, game verbs out. Kept apart from ui.js so the rendering side
    // stays a pure function of state and the wiring stays greppable.
    const CY = window.CY = window.CY || {};

    function on(id, event, fn) {
        const node = document.getElementById(id);
        if (node) node.addEventListener(event, fn);
    }

    function bind(ctx) {
        const el = CY.ui.el;

        // Header ---------------------------------------------------------
        on('btn-missions', 'click', function () {
            CY.ui.renderMissionList();
            CY.ui.show('overlay-missions');
        });
        on('btn-close-missions', 'click', function () { CY.ui.hide('overlay-missions'); });
        on('btn-sandbox', 'click', function () {
            CY.ui.hideAll();
            CY.game.startSandbox();
            CY.render.frameYard(CY.state.yard);
        });
        on('btn-help', 'click', function () { CY.ui.show('overlay-help'); });
        on('btn-close-help', 'click', function () { CY.ui.hide('overlay-help'); });
        on('btn-audio', 'click', function (e) {
            const muted = CY.audio.toggleMute();
            e.currentTarget.textContent = muted ? '🔇' : '🔊';
            CY.save.setSetting('audio', !muted);
        });

        // Mission select -------------------------------------------------
        on('mission-list', 'click', function (e) {
            const tile = e.target.closest('[data-mission]');
            if (!tile || tile.disabled) return;
            startMission(tile.getAttribute('data-mission'));
        });
        on('btn-reset-progress', 'click', function () {
            CY.save.reset();
            CY.ui.renderMissionList();
            CY.ui.toast({ text: 'Progress cleared.', tone: 'info' });
        });

        // Result ---------------------------------------------------------
        on('btn-retry', 'click', function () {
            CY.ui.hide('overlay-result');
            startMission(CY.state.missionId);
        });
        on('btn-result-missions', 'click', function () {
            CY.ui.hide('overlay-result');
            CY.ui.renderMissionList();
            CY.ui.show('overlay-missions');
        });
        on('btn-next-mission', 'click', function (e) {
            const id = e.currentTarget.getAttribute('data-mission');
            if (id) { CY.ui.hide('overlay-result'); startMission(id); }
        });

        // Queue actions --------------------------------------------------
        on('btn-rotate', 'click', function () { CY.game.rotate(1); });
        on('btn-undo', 'click', function () { CY.game.undo(); });

        // Sandbox palette ------------------------------------------------
        on('spawn-group', 'click', function (e) {
            const btn = e.target.closest('[data-piece]');
            if (!btn) return;
            CY.game.setSandboxPiece(btn.getAttribute('data-piece'));
            CY.ui.syncPalette();
        });

        // Camera ---------------------------------------------------------
        const camButtons = {
            'cam-orbit': 'orbit', 'cam-iso': 'iso', 'cam-crane': 'crane',
            'cam-vehicle': 'vehicle', 'cam-gantry': 'gantry'
        };
        const machines = { vehicle: 'vehicle', gantry: 'crane' };
        Object.keys(camButtons).forEach(function (id) {
            on(id, 'click', function () {
                const mode = camButtons[id];
                if (machines[mode] && CY.state.mode !== 'sandbox') {
                    CY.ui.toast({ text: 'The machines are sandbox toys — missions are placed by hand.', tone: 'info' });
                }
                CY.render.setCameraMode(mode, ctx[machines[mode] || 'vehicle']);
                Object.keys(camButtons).forEach(function (other) {
                    document.getElementById(other).classList.toggle('active', other === id);
                });
            });
        });

        // Analysis -------------------------------------------------------
        on('btn-xray', 'click', function (e) {
            e.currentTarget.classList.toggle('active', CY.pieces3d.setXRay());
        });
        on('btn-heatmap', 'click', function (e) {
            e.currentTarget.classList.toggle('active', CY.pieces3d.setHeatmap());
        });
        on('btn-train', 'click', function () {
            if (!ctx.terminal.unloadNext()) {
                CY.ui.toast({
                    text: CY.state.mode === 'sandbox' ? 'The siding is empty.' : 'Not in a mission.',
                    tone: 'info'
                });
            }
        });

        // Weather --------------------------------------------------------
        on('weather-select', 'change', function (e) {
            CY.weather.set(e.target.value);
            CY.save.setSetting('weather', e.target.value);
        });

        // Escape closes whatever is open.
        CY.on('ui:escape', function () { CY.ui.hideAll(); });
        document.addEventListener('click', function (e) {
            if (e.target.classList && e.target.classList.contains('overlay')) CY.ui.hideAll();
        });
    }

    function startMission(id) {
        if (!CY.game.startMission(id)) return;
        CY.render.frameYard(CY.state.yard);
        CY.render.setCameraMode('orbit');
        document.getElementById('cam-orbit').classList.add('active');
        document.getElementById('cam-vehicle').classList.remove('active');
        document.getElementById('cam-gantry').classList.remove('active');
    }

    CY.uiBind = { bind: bind, startMission: startMission };

})(window);
