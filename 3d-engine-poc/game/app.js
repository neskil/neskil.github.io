/**
 * game/app.js — bootstrap and the mode machine.
 *
 * Owns the things that outlive a mode (scene, weather, props, vehicle, camera,
 * UI) and swaps the mode that owns the rest. Exactly one mode is active.
 *
 * Load order matters: vendor → core → missions → render → game → ui → this.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};

    /* ── attract mode: the backdrop behind the menu ─────────────────────── */

    function AttractMode(app) {
        this.app = app;
        this.meshes = [];
        this.spin = 0;
    }

    AttractMode.prototype.enter = function () {
        const bay = { cols: 6, rows: 4, tiers: 4 };
        this.yardView = new Cargo3D.YardView(this.app.sceneView, bay);
        this.grid = new Cargo3D.YardGrid(bay.cols, bay.rows, bay.tiers);

        // A pre-packed bay, so the menu has something worth looking at.
        const layout = [
            ['40ft', 'maersk', 0, 0, 0, 0], ['20ft', 'msc', 4, 0, 0, 0],
            ['40ft', 'evergreen', 0, 1, 0, 0], ['20ft', 'hapag', 4, 1, 0, 0],
            ['40ft', 'cosco', 0, 2, 0, 0], ['tank', 'one', 4, 2, 0, 0],
            ['crate', 'steel', 0, 3, 0, 0], ['20ft', 'maersk', 2, 3, 0, 0],
            ['10ft', 'msc', 4, 3, 0, 0], ['10ft', 'one', 5, 3, 0, 0],
            ['40ft', 'hapag', 0, 0, 1, 0], ['20ft', 'evergreen', 4, 0, 1, 0],
            ['40ft', 'msc', 0, 1, 1, 0], ['20ft', 'cosco', 4, 1, 1, 0]
        ];

        const self = this;
        layout.forEach(function (row) {
            const unit = {
                uid: 'attract-' + row[0] + row[2] + row[3] + row[4],
                type: row[0], carrier: row[1], traits: [], departure: 0, massT: 12
            };
            const placement = self.grid.place(unit, row[2], row[3], row[4], row[5]);
            if (placement) {
                const mesh = self.yardView.addUnit(placement);
                mesh.position.y = mesh.userData.dropTarget;
                mesh.userData.dropping = false;
            }
        });

        this.yardView.updateEnvelope(this.grid.bounds());
        this.app.terminal.setVisible(true);
        this.app.sceneView.setMastsVisible(false);
        this.app.vehicle.setEnabled(false);
        this.app.weather.set('dusk');
        this.app.cameraRig.frameBay(bay);
        this.app.cameraRig.setMode('orbit', true);
    };

    AttractMode.prototype.exit = function () {
        if (this.yardView) this.yardView.dispose();
        this.yardView = null;
        this.grid = null;
    };

    AttractMode.prototype.update = function (delta) {
        // Slow drift, unless the player is dragging the camera themselves.
        if (!this.app.sceneView.controls.enabled) return;
        this.spin += delta * 0.055;
        const rig = this.app.cameraRig;
        if (rig.transition || rig.followTarget) return;

        const cam = this.app.sceneView.camera;
        const r = Math.sqrt(cam.position.x * cam.position.x + cam.position.z * cam.position.z);
        const a = Math.atan2(cam.position.z, cam.position.x) + delta * 0.055;
        cam.position.x = Math.cos(a) * r;
        cam.position.z = Math.sin(a) * r;
    };

    /* ── the app ───────────────────────────────────────────────────────── */

    function App(containerEl) {
        this.sceneView = new Cargo3D.SceneView(containerEl);
        this.weather = new Cargo3D.Weather(this.sceneView);
        this.effects = new Cargo3D.Effects(this.sceneView);
        this.terminal = new Cargo3D.TerminalProps(this.sceneView);
        this.vehicle = new Cargo3D.ReachStacker(this.sceneView);
        this.cameraRig = new Cargo3D.CameraRig(this.sceneView);

        this.modes = {
            attract: new AttractMode(this),
            mission: new Cargo3D.MissionMode(this),
            sandbox: new Cargo3D.SandboxMode(this)
        };
        this.modeName = null;
        this.mode = null;

        this.ui = Cargo3D.createUI(this);

        const settings = Cargo3D.Storage.getSettings();
        Cargo3D.Audio.setMuted(!!settings.muted);
    }

    App.prototype.setMode = function (name, opts) {
        if (this.mode) this.mode.exit();
        this.modeName = name;
        this.mode = this.modes[name];
        if (this.mode) this.mode.enter(opts || {});
    };

    App.prototype.startMission = function (mission) {
        this.ui.closeAllPanels();
        this.setMode('mission', { mission: mission });
    };

    App.prototype.startSandbox = function () {
        this.ui.closeAllPanels();
        this.setMode('sandbox');
    };

    App.prototype.goToMenu = function () {
        this.setMode('attract');
        this.ui.openMainMenu();
    };

    App.prototype.run = function () {
        const self = this;
        function frame() {
            window.requestAnimationFrame(frame);
            const delta = self.sceneView.clock.getDelta();

            if (self.mode && self.mode.update) self.mode.update(delta);
            self.cameraRig.update(delta);
            self.vehicle.update(delta);
            self.weather.update(delta);
            self.effects.update(delta);
            self.sceneView.render();
        }
        frame();
    };

    function boot() {
        const container = document.getElementById('canvas-container');
        if (!container) return;

        const app = new App(container);
        Cargo3D.app = app;
        app.goToMenu();
        app.run();
    }

    Cargo3D.App = App;
    Cargo3D.AttractMode = AttractMode;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})(window);
