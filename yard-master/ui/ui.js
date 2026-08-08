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
        const physicsHUD = new Cargo3D.PhysicsHUD();
        const cascadeHUD = new Cargo3D.CascadeHUD();
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
            flashSuccess: function (text) { missionHUD.flashSuccess(text); },
            updateContracts: function (snapshot) { sandboxHUD.updateContracts(snapshot); },
            showResults: function (result, saved, next) { results.show(result, saved, next); },

            showSandboxHUD: function () { sandboxHUD.show(); },
            updateSandboxHUD: function (metrics) {
                sandboxHUD.update(metrics);
                if (ui.syncSandboxToolbar) ui.syncSandboxToolbar(metrics);
            },
            hideSandboxHUD: function () { sandboxHUD.hide(); },
            showInspector: function (mesh) { sandboxHUD.showInspector(mesh); },
            hideInspector: function () { sandboxHUD.hideInspector(); },

            showPhysicsHUD: function () { physicsHUD.show(); },
            updatePhysicsHUD: function (metrics) {
                physicsHUD.update(metrics);
                if (ui.syncPhysicsToolbar) ui.syncPhysicsToolbar(metrics);
            },
            hidePhysicsHUD: function () { physicsHUD.hide(); },
            showTowerResult: function (result) { tower.show(result); },
            hideTowerResult: function () { tower.hide(); },

            showCascadeHUD: function () { cascadeHUD.show(); },
            updateCascadeHUD: function (metrics) { cascadeHUD.update(metrics); },
            hideCascadeHUD: function () { cascadeHUD.hide(); },
            showCascadeResult: function (result) { cascade.show(result); },
            hideCascadeResult: function () { cascade.hide(); }
        };

        const tower = new Cargo3D.TowerResultUI(app);
        const cascade = new Cargo3D.CascadeResultUI(app);

        /* ── top bar ───────────────────────────────────────────────────── */

        el('btn-menu').addEventListener('click', function () {
            if (app.modeName === 'attract') menu.openMain();
            else menu.openPause();
        });

        /* Which build is running — set by tools/stamp-build.sh. */
        const stamp = el('build-stamp');
        if (stamp) {
            const build = Cargo3D.BUILD || {};
            const commit = build.commit || 'unstamped';
            stamp.textContent = commit;

            if (build.commit && build.commit !== 'unstamped') {
                stamp.title = 'Build ' + commit + (build.date ? ' · ' + build.date : '');
            } else {
                stamp.title = 'Not stamped — run tools/stamp-build.sh before pushing';
            }
        }

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

                // 'stacker' and 'crane' hand the keyboard to a machine rather
                // than moving the camera; everything else is a plain preset.
                if (mode === 'stacker' || mode === 'crane') {
                    if (app.modeName === 'sandbox') app.mode.setDriving(mode);
                    return;
                }
                if (app.modeName === 'sandbox') app.mode.setDriving('none');
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
            { type: 'pallet', carrier: 'wood', label: 'Pallet' },
            // The two non-rectangular pieces. Campaign mission 13 is the only
            // place they turn up otherwise, and they are the most interesting
            // thing to pack — or to balance a tower on.
            { type: 'lblock', carrier: 'evergreen', label: 'L-Block' },
            { type: 'tblock', carrier: 'one', label: 'T-Block' }
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

        const physPaletteHost = el('physics-palette');
        if (physPaletteHost) {
            SPAWNS.forEach(function (entry, i) {
                const type = C.CARGO_TYPES[entry.type];
                const carrier = C.CARRIERS[entry.carrier];
                const btn = document.createElement('button');
                btn.className = 'palette-btn' + (i === 1 ? ' active' : '');
                btn.title = type.label;
                btn.innerHTML = '<span class="color-dot" style="background:#' +
                    carrier.color.toString(16).padStart(6, '0') + '"></span><span>' + entry.label + '</span>';
                btn.addEventListener('click', function () {
                    physPaletteHost.querySelectorAll('.palette-btn').forEach(function (b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    if (app.modeName === 'physics') app.mode.setSpawn(entry.type, entry.carrier);
                });
                physPaletteHost.appendChild(btn);
            });
        }
        if (el('btn-phys-rotate')) {
            el('btn-phys-rotate').addEventListener('click', function () {
                if (app.modeName === 'physics') app.mode.rotate();
            });
        }
        if (el('btn-phys-clear')) {
            el('btn-phys-clear').addEventListener('click', function () {
                if (app.modeName === 'physics') app.mode.clearYard();
            });
        }

        /* The X/Y/Z console. `data-nudge` is an axis and a direction, so one
           handler covers all six buttons and the markup carries the meaning. */
        document.querySelectorAll('[data-nudge]').forEach(function (btn) {
            const spec = btn.getAttribute('data-nudge');
            const axis = spec.charAt(0);
            const dir = Number(spec.slice(1));
            btn.addEventListener('click', function () {
                if (app.modeName === 'physics') app.mode.nudge(axis, dir);
            });
        });

        if (el('btn-phys-drop')) {
            el('btn-phys-drop').addEventListener('click', function () {
                if (app.modeName === 'physics') app.mode.dropContainer();
            });
        }

        /* ── cascade toolbar ───────────────────────────────────────────── */

        /* Steering is screen-relative — the mode resolves 'left' against the
           camera — so the markup carries a direction, not an axis. */
        document.querySelectorAll('[data-cs-move]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (app.modeName === 'cascade') app.mode.step(btn.getAttribute('data-cs-move'));
            });
        });

        if (el('btn-cs-rotate')) {
            el('btn-cs-rotate').addEventListener('click', function () {
                if (app.modeName === 'cascade') app.mode.rotate();
            });
        }
        /* Two of them: the arrow console's and the touch console's. */
        document.querySelectorAll('[data-cs-drop]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (app.modeName === 'cascade') app.mode.hardDrop();
            });
        });
        if (el('btn-cs-restart')) {
            el('btn-cs-restart').addEventListener('click', function () {
                if (app.modeName === 'cascade') app.mode.restartRun();
            });
        }

        // Soft drop is held, not toggled: it is the keyboard's Shift with a
        // thumb on it, and it has to let go when the finger does — including
        // when the finger slides off the button rather than lifting off it.
        const softBtn = el('btn-cs-soft');
        if (softBtn) {
            const holdSoft = function (on) {
                if (app.modeName !== 'cascade') return;
                softBtn.classList.toggle('active', !!app.mode.setSoft(on));
            };
            softBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); holdSoft(true); });
            ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (evt) {
                softBtn.addEventListener(evt, function () { holdSoft(false); });
            });
        }

        // The gesture console that stands in for those buttons on a phone. It
        // asks for the same four things through the same mode methods; only the
        // input is different, so there is no second copy of the steering here.
        const steerPad = el('cs-pad-steer');
        if (steerPad) {
            Cargo3D.bindSteerPad(steerPad, {
                step: function (dir) { if (app.modeName === 'cascade') app.mode.step(dir); },
                drop: function () { if (app.modeName === 'cascade') app.mode.hardDrop(); },
                soft: function (on) { if (app.modeName === 'cascade') app.mode.setSoft(on); }
            });
        }
        const turnPad = el('cs-pad-turn');
        if (turnPad) {
            Cargo3D.bindTurnPad(turnPad, {
                turn: function () { if (app.modeName === 'cascade') app.mode.rotate(); }
            });
        }

        /**
         * Exclusive button groups driven by a data attribute: the button carries
         * the value, the handler applies it and repaints the group.
         */
        function bindToggleGroup(attr, apply) {
            const buttons = Array.prototype.slice.call(document.querySelectorAll('[' + attr + ']'));
            function paint(value) {
                buttons.forEach(function (b) {
                    b.classList.toggle('active', b.getAttribute(attr) === value);
                });
            }
            buttons.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    paint(apply(btn.getAttribute(attr)));
                });
            });
            return paint;
        }

        const paintPlacement = bindToggleGroup('data-phys-place', function (value) {
            if (app.modeName !== 'physics') return value;
            return app.mode.setPlacementStyle(value);
        });
        const paintChallenge = bindToggleGroup('data-phys-challenge', function (value) {
            if (app.modeName !== 'physics') return value;
            return app.mode.setChallenge(value);
        });

        const paintSandboxPlacement = bindToggleGroup('data-sb-place', function (value) {
            if (app.modeName !== 'sandbox') return value;
            return app.mode.setPlacementStyle(value);
        });

        // The G hotkey changes the same state the buttons do, so the toolbars
        // have to follow the mode rather than only lead it.
        ui.syncPhysicsToolbar = function (metrics) {
            paintPlacement(metrics.placementStyle);
            paintChallenge(metrics.challenge);
        };
        ui.syncSandboxToolbar = function (metrics) {
            paintSandboxPlacement(metrics.placementStyle);
        };

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

        el('btn-contracts').addEventListener('click', function () {
            if (app.modeName !== 'sandbox') return;
            this.classList.toggle('active', app.mode.toggleContracts());
        });

        // Upgrade buttons are rendered fresh on every HUD tick, so delegate.
        el('ct-upgrades').addEventListener('click', function (e) {
            const btn = e.target.closest('[data-upgrade]');
            if (!btn || app.modeName !== 'sandbox' || !app.mode.contracts) return;
            app.mode.contracts.buy(btn.getAttribute('data-upgrade'));
        });

        el('btn-ct-reset').addEventListener('click', function () {
            if (app.modeName !== 'sandbox' || !app.mode.contracts) return;
            if (!window.confirm('Reset capital, reputation and upgrades?')) return;
            app.mode.contracts.reset();
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

        /* ── narrow-screen toolbars ────────────────────────────────────── */

        // Runs last: the accordion reads the palettes, which are generated above.
        const toolbars = Cargo3D.setupToolbars();

        // Hotkeys (G, and the challenge switch) change the same state the
        // buttons do, so the collapsed chips have to follow the mode too.
        const syncPhysics = ui.syncPhysicsToolbar;
        const syncSandbox = ui.syncSandboxToolbar;
        ui.syncPhysicsToolbar = function (metrics) { syncPhysics(metrics); toolbars.refresh(); };
        ui.syncSandboxToolbar = function (metrics) { syncSandbox(metrics); toolbars.refresh(); };

        return ui;
    }

    Cargo3D.createUI = createUI;
})(window);
