/**
 * game/physicsMode.js — Experimental physics stacking mode.
 *
 * Lets players freely drop containers without grid snapping, experimenting with
 * realistic balance, center-of-gravity tipping, and rigid-body collisions.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const Meshes = Cargo3D.ContainerMeshes;
    const CARRIERS = ['maersk', 'msc', 'evergreen', 'hapag', 'cosco', 'one'];

    function PhysicsMode(app) {
        this.app = app;
        this.physicsWorld = new Cargo3D.PhysicsWorld();
        this.spawnType = '20ft';
        this.spawnCarrier = 'maersk';
        this.rotAngle = 0;
        this.ghost = null;
        this.active = false;

        this._scratch = new THREE.Vector3();
        this.bindHandlers();
    }

    PhysicsMode.prototype.bindHandlers = function () {
        const self = this;

        this._onPointerDown = function (e) {
            self._press = { x: e.clientX, y: e.clientY, button: e.button };
        };

        this._onPointerMove = function (e) {
            if (!self.active) return;
            self.updateHover(e);
        };

        this._onPointerUp = function (e) {
            const press = self._press;
            self._press = null;
            if (!press || press.button !== 0 || e.button !== 0) return;
            if (Math.abs(e.clientX - press.x) > 6 || Math.abs(e.clientY - press.y) > 6) return;
            self.dropContainer();
        };

        this._onKeyDown = function (e) {
            if (!self.active) return;
            const k = e.key.toLowerCase();
            if (k === 'r') {
                self.rotate();
                e.preventDefault();
            } else if (k === 'c' || k === 'delete' || k === 'backspace') {
                self.clearYard();
                e.preventDefault();
            } else if (k === 'escape') {
                self.app.ui.openPauseMenu();
            }
        };
    };

    PhysicsMode.prototype.enter = function () {
        this.active = true;
        const view = this.app.sceneView;

        this.app.terminal.setVisible(true);
        view.setMastsVisible(true);
        this.app.crane.setVisible(false);
        this.app.vehicle.setEnabled(false);
        this.app.cameraRig.frameApron();
        this.app.cameraRig.setMode('orbit');
        this.app.weather.set(Cargo3D.Storage.getSettings().weather || 'day');

        const dom = view.renderer.domElement;
        dom.addEventListener('pointerdown', this._onPointerDown);
        dom.addEventListener('pointermove', this._onPointerMove);
        dom.addEventListener('pointerup', this._onPointerUp);
        window.addEventListener('keydown', this._onKeyDown);

        if (this.app.ui.showPhysicsHUD) {
            this.app.ui.showPhysicsHUD(this);
        }

        this.syncGhost();
        this.refreshHUD();
    };

    PhysicsMode.prototype.exit = function () {
        this.active = false;
        const view = this.app.sceneView;
        const dom = view.renderer.domElement;

        dom.removeEventListener('pointerdown', this._onPointerDown);
        dom.removeEventListener('pointermove', this._onPointerMove);
        dom.removeEventListener('pointerup', this._onPointerUp);
        window.removeEventListener('keydown', this._onKeyDown);

        this.clearYard();
        this.removeGhost();
        this.app.terminal.setVisible(false);

        if (this.app.ui.hidePhysicsHUD) {
            this.app.ui.hidePhysicsHUD();
        }
    };

    PhysicsMode.prototype.update = function (delta) {
        if (!this.active) return;
        this.physicsWorld.update(delta || 0.016);
        this.refreshHUD();
    };

    /* ── Ghost preview & hover positioning ────────────────────────────── */

    PhysicsMode.prototype.syncGhost = function () {
        this.removeGhost();
        this.ghost = Meshes.createUnitMesh(this.spawnType, this.spawnCarrier, []);
        this.ghost.traverse(function (child) {
            if (child.isMesh && child.material) {
                child.material = child.material.clone();
                child.material.transparent = true;
                child.material.opacity = 0.6;
            }
        });
        this.ghost.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.rotAngle);
        this.app.sceneView.add(this.ghost);
        this.ghost.visible = false;
    };

    PhysicsMode.prototype.removeGhost = function () {
        if (!this.ghost) return;
        this.app.sceneView.scene.remove(this.ghost);
        if (Meshes.disposeGroup) Meshes.disposeGroup(this.ghost);
        this.ghost = null;
    };

    PhysicsMode.prototype.rotate = function () {
        // Fine rotation in 15 degree increments to enable angled stacking experiments
        this.rotAngle += Math.PI / 12;
        if (this.ghost) {
            this.ghost.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.rotAngle);
        }
    };

    PhysicsMode.prototype.setSpawn = function (type, carrier) {
        this.spawnType = type || '20ft';
        this.spawnCarrier = carrier || CARRIERS[Math.floor(Math.random() * CARRIERS.length)];
        this.syncGhost();
    };

    PhysicsMode.prototype.updateHover = function (e) {
        if (!this.ghost) return;
        const point = this.app.sceneView.pointerToGround(e, this._scratch);
        if (!point) {
            this.ghost.visible = false;
            return;
        }

        const spec = this.ghost.userData.spec || { width: 2.44, height: 2.9, length: 6.06 };
        const radius = Math.sqrt(spec.width * spec.width + spec.length * spec.length) / 2;

        let targetY = spec.height / 2 + 0.8; // default drop elevation above ground

        // Check if hovering over any existing stacked physics bodies
        const bodies = this.physicsWorld.bodies;
        for (let i = 0; i < bodies.length; i++) {
            const b = bodies[i];
            const dx = b.position.x - point.x;
            const dz = b.position.z - point.z;
            const bRadius = Math.sqrt(b.width * b.width + b.length * b.length) / 2;

            if (dx * dx + dz * dz < (radius + bRadius) * (radius + bRadius) * 0.75) {
                const bTop = b.position.y + b.height / 2;
                if (bTop + spec.height / 2 + 0.5 > targetY) {
                    targetY = bTop + spec.height / 2 + 0.5;
                }
            }
        }

        this.ghost.position.set(point.x, targetY, point.z);
        this.ghost.visible = true;
    };

    /* ── Dropping & mechanics ─────────────────────────────────────────── */

    PhysicsMode.prototype.dropContainer = function () {
        if (!this.ghost || !this.ghost.visible) return;

        const mesh = Meshes.createUnitMesh(this.spawnType, this.spawnCarrier, []);
        mesh.position.copy(this.ghost.position);
        mesh.quaternion.copy(this.ghost.quaternion);
        this.app.sceneView.add(mesh);

        const spec = mesh.userData.spec || { width: 2.44, height: 2.9, length: 6.06 };
        const body = new Cargo3D.RigidBox(mesh, spec.massT || 15);
        this.physicsWorld.add(body);

        if (Cargo3D.Audio) Cargo3D.Audio.lock();
        if (this.app.effects) {
            this.app.effects.ring(mesh.position.x, 0, mesh.position.z);
        }

        // Cycle carrier color for next drop
        this.spawnCarrier = CARRIERS[Math.floor(Math.random() * CARRIERS.length)];
        this.syncGhost();
        this.refreshHUD();
    };

    PhysicsMode.prototype.clearYard = function () {
        const bodies = this.physicsWorld.bodies.slice();
        for (let i = 0; i < bodies.length; i++) {
            const b = bodies[i];
            this.app.sceneView.scene.remove(b.mesh);
            if (Meshes.disposeGroup) Meshes.disposeGroup(b.mesh);
        }
        this.physicsWorld.clear();
        this.refreshHUD();
    };

    PhysicsMode.prototype.refreshHUD = function () {
        if (!this.active || !this.app.ui.updatePhysicsHUD) return;
        const bodies = this.physicsWorld.bodies;
        let mass = 0;
        let maxHeight = 0;

        for (let i = 0; i < bodies.length; i++) {
            const b = bodies[i];
            mass += b.mass;
            const top = b.position.y + b.height / 2;
            if (top > maxHeight) maxHeight = top;
        }

        this.app.ui.updatePhysicsHUD({
            count: bodies.length,
            mass: Math.round(mass),
            height: Math.round(maxHeight * 10) / 10
        });
    };

    Cargo3D.PhysicsMode = PhysicsMode;
})(window);
