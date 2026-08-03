/**
 * game/sandbox.js — free-build mode.
 *
 * This is the original proof-of-concept, preserved: spawn anything anywhere,
 * drive the reach stacker, unload the train, change the weather, inspect a
 * unit. No grid, no rules, no score — deliberately. The campaign is where the
 * constraints live.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const C = Cargo3D.Constants;
    const Meshes = Cargo3D.ContainerMeshes;

    const SNAP = C.GRID.CELL_X;

    function SandboxMode(app) {
        this.app = app;
        this.units = [];
        this.selected = null;
        this.spawnType = '20ft';
        this.spawnCarrier = 'maersk';
        this.xray = false;
        this.heatmap = false;

        this.selectionBox = new THREE.BoxHelper(undefined, 0x38bdf8);
        this.selectionBox.visible = false;

        this._scratch = new THREE.Vector3();
        this.bindHandlers();
    }

    SandboxMode.prototype.bindHandlers = function () {
        const self = this;

        this._onPointerDown = function (e) {
            self._press = { x: e.clientX, y: e.clientY, button: e.button };
        };

        this._onPointerUp = function (e) {
            const press = self._press;
            self._press = null;
            if (!press || press.button !== 0 || e.button !== 0) return;
            if (Math.abs(e.clientX - press.x) > 6 || Math.abs(e.clientY - press.y) > 6) return;
            self.onClick(e);
        };

        this._onKeyDown = function (e) {
            if (!self.active) return;
            const k = e.key.toLowerCase();
            if (e.code === 'Space') {
                const action = self.app.vehicle.toggleGrab(self.units);
                if (action !== 'none') self.refreshHUD();
                e.preventDefault();
            } else if (k === 'r' && self.selected) {
                self.rotateSelected();
                e.preventDefault();
            } else if (k === 'delete' || k === 'backspace') {
                if (self.selected) { self.deleteSelected(); e.preventDefault(); }
            } else if (k === 'escape') {
                self.app.ui.openPauseMenu();
            }
        };
    };

    SandboxMode.prototype.enter = function () {
        this.active = true;
        const view = this.app.sceneView;

        view.scene.add(this.selectionBox);
        this.app.terminal.setVisible(true);
        view.setMastsVisible(true);
        this.app.cameraRig.frameApron();
        this.app.cameraRig.setMode('orbit');
        this.app.weather.set(Cargo3D.Storage.getSettings().weather || 'day');

        const dom = view.renderer.domElement;
        dom.addEventListener('pointerdown', this._onPointerDown);
        dom.addEventListener('pointerup', this._onPointerUp);
        window.addEventListener('keydown', this._onKeyDown);

        this.app.ui.showSandboxHUD(this);
        this.seedDemoYard();
        this.refreshHUD();
    };

    SandboxMode.prototype.exit = function () {
        this.active = false;
        const view = this.app.sceneView;
        const dom = view.renderer.domElement;

        dom.removeEventListener('pointerdown', this._onPointerDown);
        dom.removeEventListener('pointerup', this._onPointerUp);
        window.removeEventListener('keydown', this._onKeyDown);

        this.clearYard();
        view.scene.remove(this.selectionBox);
        this.app.vehicle.setEnabled(false);
        this.app.terminal.setVisible(false);
        this.app.ui.hideSandboxHUD();
    };

    SandboxMode.prototype.update = function () {
        if (this.selected) this.selectionBox.setFromObject(this.selected);
    };

    /* ── spawning ──────────────────────────────────────────────────────── */

    SandboxMode.prototype.setSpawn = function (type, carrier) {
        this.spawnType = type;
        this.spawnCarrier = carrier;
    };

    SandboxMode.prototype.spawn = function (x, y, z, type, carrier, traits) {
        const mesh = Meshes.createUnitMesh(type || this.spawnType, carrier || this.spawnCarrier, traits || []);
        mesh.position.set(x, y, z);
        this.app.sceneView.add(mesh);
        this.units.push(mesh);

        if (Cargo3D.Audio) Cargo3D.Audio.lock();
        if (this.app.effects) this.app.effects.ring(x, Math.max(0, y - mesh.userData.spec.height / 2), z);

        if (this.xray) Meshes.setXRay([mesh], true);
        if (this.heatmap) this.applyHeatmap();

        this.refreshHUD();
        return mesh;
    };

    /** Rest height for a new unit at a snapped position, given what is there. */
    SandboxMode.prototype.restHeight = function (x, z, spec) {
        let base = spec.height / 2;
        this.units.forEach(function (mesh) {
            const other = mesh.userData.spec;
            if (!other) return;
            if (Math.abs(mesh.position.x - x) < SNAP * 0.9 && Math.abs(mesh.position.z - z) < SNAP * 0.9) {
                const top = mesh.position.y + other.height / 2;
                if (top + spec.height / 2 > base) base = top + spec.height / 2;
            }
        });
        return base;
    };

    SandboxMode.prototype.onClick = function (event) {
        const view = this.app.sceneView;
        const hits = view.pointerToObjects(event, this.pickables());

        if (hits.length) {
            this.select(hits[0].object.userData.unitGroup);
            return;
        }

        if (this.selected) { this.deselect(); return; }

        const point = view.pointerToGround(event, this._scratch);
        if (!point) return;

        const spec = C.CARGO_TYPES[this.spawnType] || C.CARGO_TYPES['20ft'];
        const x = Math.round(point.x / SNAP) * SNAP;
        const z = Math.round(point.z / SNAP) * SNAP;
        this.spawn(x, this.restHeight(x, z, spec), z);
    };

    SandboxMode.prototype.pickables = function () {
        const out = [];
        this.units.forEach(function (group) {
            group.traverse(function (child) {
                if (child.isMesh && !child.userData.isInterior) {
                    child.userData.unitGroup = group;
                    out.push(child);
                }
            });
        });
        return out;
    };

    /* ── selection ─────────────────────────────────────────────────────── */

    SandboxMode.prototype.select = function (mesh) {
        this.selected = mesh;
        this.selectionBox.setFromObject(mesh);
        this.selectionBox.visible = true;
        this.app.ui.showInspector(mesh);
    };

    SandboxMode.prototype.deselect = function () {
        this.selected = null;
        this.selectionBox.visible = false;
        this.app.ui.hideInspector();
    };

    SandboxMode.prototype.rotateSelected = function () {
        if (!this.selected) return;
        this.selected.rotation.y += Math.PI / 2;
        this.selectionBox.setFromObject(this.selected);
        this.app.ui.showInspector(this.selected);
        if (Cargo3D.Audio) Cargo3D.Audio.click();
    };

    SandboxMode.prototype.deleteSelected = function () {
        if (!this.selected) return;
        const mesh = this.selected;
        this.deselect();

        const at = this.units.indexOf(mesh);
        if (at > -1) this.units.splice(at, 1);
        if (this.app.vehicle.carried === mesh) this.app.vehicle.carried = null;

        this.app.sceneView.remove(mesh);
        Meshes.disposeGroup(mesh);
        this.refreshHUD();
    };

    SandboxMode.prototype.clearYard = function () {
        const view = this.app.sceneView;
        this.deselect();
        this.app.vehicle.carried = null;
        this.units.forEach(function (mesh) {
            view.remove(mesh);
            Meshes.disposeGroup(mesh);
        });
        this.units = [];
        this.refreshHUD();
    };

    /* ── tools ─────────────────────────────────────────────────────────── */

    SandboxMode.prototype.toggleXRay = function () {
        this.xray = !this.xray;
        Meshes.setXRay(this.units, this.xray);
        return this.xray;
    };

    SandboxMode.prototype.applyHeatmap = function () {
        Meshes.setHeatmap(this.units, this.heatmap, function (group) {
            return Math.floor(group.position.y / C.GRID.TIER_H);
        });
    };

    SandboxMode.prototype.toggleHeatmap = function () {
        this.heatmap = !this.heatmap;
        this.applyHeatmap();
        return this.heatmap;
    };

    SandboxMode.prototype.unloadTrain = function () {
        const load = this.app.terminal.takeFromTrain();
        if (!load) return false;

        const x = Math.round((-12 + Math.floor(Math.random() * 5) * SNAP * 2) / SNAP) * SNAP;
        const z = Math.round((-9 + Math.floor(Math.random() * 4) * SNAP * 2) / SNAP) * SNAP;
        const spec = C.CARGO_TYPES['40ft'];
        this.spawn(x, this.restHeight(x, z, spec), z, '40ft', load.carrier);
        return true;
    };

    SandboxMode.prototype.setDriving = function (on) {
        this.app.vehicle.setEnabled(on);
        if (on) this.app.cameraRig.follow(this.app.vehicle);
        else { this.app.cameraRig.frameApron(); this.app.cameraRig.setMode('orbit'); }
    };

    SandboxMode.prototype.metrics = function () {
        let teu = 0, volume = 0, mass = 0, tallest = 0;
        this.units.forEach(function (mesh) {
            const spec = mesh.userData.spec;
            if (!spec) return;
            teu += spec.teu;
            volume += spec.volume;
            mass += spec.tare + spec.payload * 0.45;
            tallest = Math.max(tallest, mesh.position.y + spec.height / 2);
        });
        return {
            count: this.units.length,
            teu: teu.toFixed(1),
            volume: Math.round(volume),
            mass: mass.toFixed(1),
            height: tallest.toFixed(1),
            trainLeft: this.app.terminal.remaining()
        };
    };

    SandboxMode.prototype.refreshHUD = function () {
        this.app.ui.updateSandboxHUD(this.metrics());
    };

    SandboxMode.prototype.seedDemoYard = function () {
        if (this.units.length) return;
        this.spawn(-9.15, 1.445, -3.05, '40ft', 'maersk');
        this.spawn(-9.15, 4.335, -3.05, '40ft', 'hapag');
        this.spawn(3.05, 1.295, 3.05, '20ft', 'evergreen');
        this.spawn(3.05, 1.295, -3.05, '20ft', 'msc');
        this.spawn(9.15, 1.30, 0, 'tank', 'cosco');
        this.spawn(-3.05, 1.30, 6.10, 'crate', 'steel');
        this.deselect();
    };

    Cargo3D.SandboxMode = SandboxMode;
})(window);
