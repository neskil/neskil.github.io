/**
 * ui/ui.js — the UI facade the game talks to.
 *
 * Modes never touch the DOM directly; they call these methods. Everything below
 * is wiring: menu, HUDs, scorecard, toolbars and the top bar.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const C = Cargo3D.Constants;
    const Storage = Cargo3D.Storage;

    function el(id) { return document.getElementById(id); }

    function createUI(app) {
        const menu = new Cargo3D.MenuUI(app);
        const missionHUD = new Cargo3D.MissionHUD();
        const sandboxHUD = new Cargo3D.SandboxHUD();
        const results = new Cargo3D.ResultsUI(app);

        menu.renderHowTo();

        const ui = {
            menu: menu,
            missionHUD: missionHUD,
            sandboxHUD: sandboxHUD,
            results: results,

            openMainMenu: function () { menu.openMain(); },
            openPauseMenu: function () { menu.openPause(); },
            closeAllPanels: function () { menu.closeAll(); results.hide(); },

            showMissionHUD: function (mission, units) { missionHUD.show(mission, units); },
            updateMissionHUD: function (snapshot) { missionHUD.update(snapshot); },
            hideMissionHUD: function () { missionHUD.hide(); },
            flashReason: function (text) { missionHUD.flashReason(text); },
            showResults: function (result, saved, next) { results.show(result, saved, next); },

            showSandboxHUD: function () { sandboxHUD.show(); },
            updateSandboxHUD: function (metrics) { sandboxHUD.update(metrics); },
            hideSandboxHUD: function () { sandboxHUD.hide(); },
            showInspector: function (mesh) { sandboxHUD.showInspector(mesh); },
            hideInspector: function () { sandboxHUD.hideInspector(); }
        };

        /* ── top bar ───────────────────────────────────────────────────── */

        el('btn-menu').addEventListener('click', function () {
            if (app.modeName === 'attract') menu.openMain();
            else menu.openPause();
        });

        const audioBtn = el('btn-audio');
        function paintAudio() {
            const muted = Cargo3D.Audio.isMuted();
            audioBtn.textContent = muted ? '🔇' : '🔊';
            audioBtn.classList.toggle('muted', muted);
            audioBtn.title = muted ? 'Sound off' : 'Sound on';
        }
        audioBtn.addEventListener('click', function () {
            const muted = Cargo3D.Audio.toggleMute();
            Storage.saveSettings({ muted: muted });
            paintAudio();
        });
        paintAudio();

        /* ── mission controls ──────────────────────────────────────────── */

        el('btn-rotate').addEventListener('click', function () {
            if (app.modeName === 'mission' && app.mode.placement) app.mode.placement.rotate();
        });
        el('btn-undo').addEventListener('click', function () {
            if (app.modeName === 'mission' && app.mode.placement) app.mode.placement.undo();
        });
        el('btn-mission-restart').addEventListener('click', function () {
            if (app.modeName === 'mission') app.mode.restart();
        });

        // Camera presets shared by both modes.
        const camButtons = Array.prototype.slice.call(document.querySelectorAll('[data-cam]'));
        camButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                const mode = btn.getAttribute('data-cam');
                camButtons.forEach(function (b) {
                    if (b.parentNode === btn.parentNode) b.classList.remove('active');
                });
                btn.classList.add('active');

                if (mode === 'drive') {
                    if (app.modeName === 'sandbox') app.mode.setDriving(true);
                    return;
                }
                if (app.modeName === 'sandbox') app.mode.setDriving(false);
                app.cameraRig.setMode(mode);
            });
        });

        /* ── sandbox toolbar ───────────────────────────────────────────── */

        const paletteHost = el('spawn-palette');
        // Short labels: the toolbar has to survive a 1280px viewport alongside
        // the camera, tools and weather sections.
        const SPAWNS = [
            { type: '10ft', carrier: 'msc', label: '10ft' },
            { type: '20ft', carrier: 'maersk', label: '20ft' },
            { type: '40ft', carrier: 'hapag', label: '40ft HC' },
            { type: 'crate', carrier: 'steel', label: 'Crate' },
            { type: 'tank', carrier: 'cosco', label: 'Tank' },
            { type: 'pallet', carrier: 'wood', label: 'Pallet' }
        ];

        SPAWNS.forEach(function (entry, i) {
            const type = C.CARGO_TYPES[entry.type];
            const carrier = C.CARRIERS[entry.carrier];
            const btn = document.createElement('button');
            btn.className = 'palette-btn' + (i === 1 ? ' active' : '');
            btn.title = type.label;
            btn.innerHTML = '<span class="color-dot" style="background:#' +
                carrier.color.toString(16).padStart(6, '0') + '"></span><span>' + entry.label + '</span>';
            btn.addEventListener('click', function () {
                paletteHost.querySelectorAll('.palette-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                if (app.modeName === 'sandbox') app.mode.setSpawn(entry.type, entry.carrier);
            });
            paletteHost.appendChild(btn);
        });

        el('btn-xray').addEventListener('click', function () {
            if (app.modeName !== 'sandbox') return;
            this.classList.toggle('active', app.mode.toggleXRay());
        });
        el('btn-heatmap').addEventListener('click', function () {
            if (app.modeName !== 'sandbox') return;
            this.classList.toggle('active', app.mode.toggleHeatmap());
        });
        el('btn-train').addEventListener('click', function () {
            if (app.modeName !== 'sandbox') return;
            if (!app.mode.unloadTrain()) missionHUD.flashReason('The train is empty.');
        });
        el('btn-clear').addEventListener('click', function () {
            if (app.modeName === 'sandbox') app.mode.clearYard();
        });

        const weatherSelect = el('weather-select');
        Object.keys(Cargo3D.WEATHER_PRESETS).forEach(function (key) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = Cargo3D.WEATHER_PRESETS[key].label;
            weatherSelect.appendChild(opt);
        });
        weatherSelect.value = Storage.getSettings().weather || 'day';
        weatherSelect.addEventListener('change', function () {
            app.weather.set(weatherSelect.value);
            Storage.saveSettings({ weather: weatherSelect.value });
        });

        /* ── inspector actions ─────────────────────────────────────────── */

        el('btn-insp-close').addEventListener('click', function () {
            if (app.modeName === 'sandbox') app.mode.deselect();
        });
        el('btn-insp-rotate').addEventListener('click', function () {
            if (app.modeName === 'sandbox') app.mode.rotateSelected();
        });
        el('btn-insp-delete').addEventListener('click', function () {
            if (app.modeName === 'sandbox') app.mode.deleteSelected();
        });

        return ui;
    }

    Cargo3D.createUI = createUI;
})(window);
