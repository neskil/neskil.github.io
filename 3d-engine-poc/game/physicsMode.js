/**
 * game/physicsMode.js — the experimental physics yard.
 *
 * Everything here is settled by game/physics.js rather than by core/rules.js:
 * there is no grid holding a stack up and no support rule to satisfy, only
 * contacts, friction and a centre of gravity. A stack stands because it
 * balances, and falls when it does not.
 *
 * Two challenges share the yard:
 *   - free play    — drop whatever, wherever, and watch what happens.
 *   - tower        — stack as high as you can; the run ends when it comes down.
 *
 * Two placement styles share both:
 *   - free         — anywhere the cursor points, rotated in 15° steps.
 *   - grid         — snapped to the campaign's slot lattice in quarter turns,
 *                    the same placement the missions use. Physics still decides
 *                    whether it holds; the grid only decides where it lands.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const Meshes = Cargo3D.ContainerMeshes;
    const Lattice = Cargo3D.GridLattice;
    const CARRIERS = ['maersk', 'msc', 'evergreen', 'hapag', 'cosco', 'one'];

    const DEFAULT_SPEC = { width: 2.44, height: 2.59, length: 6.06 };

    /** How far above the stack a container is released, per placement style. */
    const DROP_GAP = { free: 0.6, grid: 0.15 };

    /**
     * How far a settled container may fall before the tower counts as collapsed.
     * Settling compresses a stack by millimetres, so anything near half a
     * container height is unambiguous.
     */
    const COLLAPSE_DROP = 1.2;

    const QUARTER = Math.PI / 2;

    /**
     * Laden mass in tonnes — tare plus a part-full payload, the same assumption
     * the sandbox HUD reports. A 40ft outweighs a 10ft by roughly four to one,
     * so what you put where genuinely changes what the stack does.
     */
    function unitMass(spec) {
        if (spec.massT) return spec.massT;
        const laden = (spec.tare || 0) + (spec.payload || 0) * 0.45;
        return laden > 0.5 ? laden : 15;
    }

    function PhysicsMode(app) {
        this.app = app;
        this.physicsWorld = new Cargo3D.PhysicsWorld();
        this.spawnType = '20ft';
        this.spawnCarrier = 'maersk';
        this.rotAngle = 0;
        this.ghost = null;
        this.active = false;

        this.placementStyle = 'grid';
        this.challenge = 'freeplay';
        this.run = this.blankRun();

        this._scratch = new THREE.Vector3();
        this._snap = new THREE.Vector3();
        this._box = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
        this.bindHandlers();
    }

    PhysicsMode.prototype.blankRun = function () {
        return { status: 'idle', height: 0, units: 0, reason: null };
    };

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

            // Position from the event that is actually dropping it. A touch tap
            // cannot be relied on to send a pointermove first, so without this
            // the drop uses wherever the ghost happened to be left.
            self.updateHover(e);
            self.dropContainer();
        };

        this._onKeyDown = function (e) {
            if (!self.active) return;
            const k = e.key.toLowerCase();
            if (k === 'r') {
                self.rotate();
                e.preventDefault();
            } else if (k === 'g') {
                self.setPlacementStyle(self.placementStyle === 'grid' ? 'free' : 'grid');
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

        if (this.app.ui.showPhysicsHUD) this.app.ui.showPhysicsHUD(this);

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

        if (this.app.ui.hideTowerResult) this.app.ui.hideTowerResult();
        if (this.app.ui.hidePhysicsHUD) this.app.ui.hidePhysicsHUD();
    };

    PhysicsMode.prototype.update = function (delta) {
        if (!this.active) return;
        this.physicsWorld.update(delta || 0.016);

        if (this.challenge === 'tower') {
            if (this.run.status !== 'over') this.updateRun();
            this.app.cameraRig.trackStack(this.maxTop(), delta || 0.016);
        }
        this.refreshHUD();
    };

    /** Height of the tallest container corner in the yard, in metres. */
    PhysicsMode.prototype.maxTop = function () {
        const bodies = this.physicsWorld.bodies;
        let top = 0;
        for (let i = 0; i < bodies.length; i++) {
            const y = bodies[i].topY();
            if (y > top) top = y;
        }
        return top;
    };

    /* ── modes ─────────────────────────────────────────────────────────── */

    /** @param {'free'|'grid'} style */
    PhysicsMode.prototype.setPlacementStyle = function (style) {
        this.placementStyle = style === 'free' ? 'free' : 'grid';

        // Grid placement only has the two rotations the missions have, so a free
        // angle has to collapse onto the nearest quarter turn on the way in.
        if (this.placementStyle === 'grid') {
            this.rotAngle = Math.round(this.rotAngle / QUARTER) * QUARTER;
        }
        this.syncGhost();
        this.refreshHUD();
        return this.placementStyle;
    };

    /** @param {'freeplay'|'tower'} which */
    PhysicsMode.prototype.setChallenge = function (which) {
        const next = which === 'tower' ? 'tower' : 'freeplay';
        if (next === this.challenge) return this.challenge;

        this.challenge = next;
        this.clearYard();
        this.run = this.blankRun();
        if (this.app.ui.hideTowerResult) this.app.ui.hideTowerResult();

        this.app.cameraRig.frameApron();
        this.app.cameraRig.setMode('orbit');

        this.refreshHUD();
        return this.challenge;
    };

    PhysicsMode.prototype.restartRun = function () {
        this.clearYard();
        this.run = this.blankRun();
        if (this.app.ui.hideTowerResult) this.app.ui.hideTowerResult();

        // trackStack() only ever climbs, so a new run needs the rig put back.
        this.app.cameraRig.frameApron();
        this.app.cameraRig.setMode('orbit');

        this.syncGhost();
        this.refreshHUD();
    };

    /* ── the tower run ─────────────────────────────────────────────────── */

    /**
     * A container that has settled records the height it settled at. If it ever
     * drops well below that again, something under it gave way — which is the
     * only definition of "the tower came down" that does not need a rule.
     */
    PhysicsMode.prototype.updateRun = function () {
        const bodies = this.physicsWorld.bodies;
        if (!bodies.length) {
            this.run.status = 'idle';
            return;
        }

        for (let i = 0; i < bodies.length; i++) {
            const b = bodies[i];
            if (b.settledTop === undefined || b.settledTop === null) continue;
            if (b.topY() < b.settledTop - COLLAPSE_DROP) {
                this.endRun('A container came down.');
                return;
            }
        }

        let atRest = true;
        for (let i = 0; i < bodies.length; i++) {
            if (!bodies[i].sleeping) { atRest = false; break; }
        }

        if (!atRest) {
            this.run.status = 'settling';
            return;
        }

        let top = 0;
        for (let i = 0; i < bodies.length; i++) {
            const b = bodies[i];
            const y = b.topY();
            if (b.settledTop === undefined || b.settledTop === null) b.settledTop = y;
            if (y > top) top = y;
        }

        this.run.status = 'stable';
        this.run.height = top;
        this.run.units = bodies.length;
    };

    PhysicsMode.prototype.endRun = function (reason) {
        this.run.status = 'over';
        this.run.reason = reason;

        const saved = Cargo3D.Storage.recordTower({
            height: this.run.height,
            units: this.run.units
        });

        if (Cargo3D.Audio) Cargo3D.Audio.reject();
        if (this.app.ui.showTowerResult) {
            this.app.ui.showTowerResult({
                height: this.run.height,
                units: this.run.units,
                reason: reason,
                best: saved.best.bestHeight,
                previousBest: saved.previousBest,
                improved: saved.improved,
                runs: saved.best.runs
            });
        }
    };

    /* ── ghost preview & hover positioning ────────────────────────────── */

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
        // Grid placement matches the missions: two rotations, because 180° and
        // 270° give an identical footprint. Free placement can go anywhere.
        this.rotAngle += this.placementStyle === 'grid' ? QUARTER : Math.PI / 12;
        if (this.ghost) {
            this.ghost.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.rotAngle);
        }

        // A turned container has a different footprint, so the height it can
        // clear the stack at changes with it. Leaving the old height behind is
        // what let a rotated container be dropped inside its neighbour.
        if (this._lastPointer) this.updateHover(this._lastPointer);

        if (Cargo3D.Audio) Cargo3D.Audio.click();
        this.refreshHUD();
    };

    /** Quarter turns, 0 or 1 — the rotation core/constants.span() understands. */
    PhysicsMode.prototype.gridRot = function () {
        const quarters = Math.round(this.rotAngle / QUARTER);
        return ((quarters % 2) + 2) % 2;
    };

    PhysicsMode.prototype.setSpawn = function (type, carrier) {
        this.spawnType = type || '20ft';
        this.spawnCarrier = carrier || CARRIERS[Math.floor(Math.random() * CARRIERS.length)];
        this.syncGhost();
    };

    /** Horizontal extent of a placed body, from its eight corners. */
    PhysicsMode.prototype.bodyExtent = function (body, out) {
        out.minX = Infinity; out.maxX = -Infinity;
        out.minZ = Infinity; out.maxZ = -Infinity;

        for (let i = 0; i < 8; i++) {
            this._scratch.copy(body.samplePoints[i])
                .applyQuaternion(body.quaternion)
                .add(body.position);
            if (this._scratch.x < out.minX) out.minX = this._scratch.x;
            if (this._scratch.x > out.maxX) out.maxX = this._scratch.x;
            if (this._scratch.z < out.minZ) out.minZ = this._scratch.z;
            if (this._scratch.z > out.maxZ) out.maxZ = this._scratch.z;
        }
        return out;
    };

    /**
     * Height the ghost should hover at above (x, z): clear of everything whose
     * footprint it overlaps. Extents are axis-aligned, so the answer errs on the
     * high side for a rotated stack — better than clipping into it.
     */
    PhysicsMode.prototype.restHeight = function (x, z, halfX, halfZ, spec) {
        const gap = DROP_GAP[this.placementStyle];
        let targetY = spec.height / 2 + gap;

        const minX = x - halfX, maxX = x + halfX;
        const minZ = z - halfZ, maxZ = z + halfZ;
        const bodies = this.physicsWorld.bodies;

        for (let i = 0; i < bodies.length; i++) {
            const ext = this.bodyExtent(bodies[i], this._box);
            if (ext.maxX <= minX || ext.minX >= maxX) continue;
            if (ext.maxZ <= minZ || ext.minZ >= maxZ) continue;

            const clear = bodies[i].topY() + spec.height / 2 + gap;
            if (clear > targetY) targetY = clear;
        }
        return targetY;
    };

    PhysicsMode.prototype.updateHover = function (e) {
        if (!this.ghost) return;
        if (this.challenge === 'tower' && this.run.status === 'over') {
            this.ghost.visible = false;
            return;
        }

        // Remembered so a rotation can re-solve the hover without a new event.
        this._lastPointer = { clientX: e.clientX, clientY: e.clientY };

        const point = this.app.sceneView.pointerToGround(e, this._scratch);
        if (!point) {
            this.ghost.visible = false;
            return;
        }

        const spec = this.ghost.userData.spec || DEFAULT_SPEC;
        let x = point.x;
        let z = point.z;
        let halfX, halfZ;

        if (this.placementStyle === 'grid') {
            const snapped = Lattice.snap(point, this.spawnType, this.gridRot(), this._snap);
            x = snapped.x;
            z = snapped.z;
            const foot = Lattice.footprint(this.spawnType, this.gridRot());
            halfX = foot.x / 2;
            halfZ = foot.z / 2;
        } else {
            // Rotated footprint, conservatively: the swept half-extent.
            const c = Math.abs(Math.cos(this.rotAngle));
            const s = Math.abs(Math.sin(this.rotAngle));
            halfX = (spec.length * s + spec.width * c) / 2;
            halfZ = (spec.length * c + spec.width * s) / 2;
        }

        // _scratch is the ground point; read it before restHeight() reuses it.
        this.ghost.position.set(x, this.restHeight(x, z, halfX, halfZ, spec), z);
        this.ghost.visible = true;
    };

    /* ── dropping & mechanics ─────────────────────────────────────────── */

    PhysicsMode.prototype.dropContainer = function () {
        if (!this.ghost || !this.ghost.visible) return;
        if (this.challenge === 'tower' && this.run.status === 'over') return;

        const mesh = Meshes.createUnitMesh(this.spawnType, this.spawnCarrier, []);
        mesh.position.copy(this.ghost.position);
        mesh.quaternion.copy(this.ghost.quaternion);
        this.app.sceneView.add(mesh);

        const spec = mesh.userData.spec || DEFAULT_SPEC;
        const body = new Cargo3D.RigidBox(mesh, unitMass(spec));
        body.settledTop = null;
        this.physicsWorld.add(body);
        this.liftClear(body);

        if (Cargo3D.Audio) Cargo3D.Audio.lock();
        if (this.app.effects) this.app.effects.ring(mesh.position.x, 0, mesh.position.z);

        if (this.challenge === 'tower') this.run.status = 'settling';

        // Cycle carrier colour for the next drop.
        this.spawnCarrier = CARRIERS[Math.floor(Math.random() * CARRIERS.length)];
        this.syncGhost();
        this.refreshHUD();
    };

    /**
     * Raise a freshly dropped container until it is clear of everything else.
     *
     * The hover height already aims to do this, but it works from axis-aligned
     * extents and a cursor that may be stale by a frame. This is the backstop:
     * a container that starts inside another is the one thing the solver cannot
     * resolve cleanly, and it reads as two boxes melted together.
     */
    PhysicsMode.prototype.liftClear = function (body) {
        const world = this.physicsWorld;

        for (let i = 0; i < 24; i++) {
            const depth = world.penetrationOf(body);
            if (depth <= world.slop) return;
            body.position.y += depth + world.slop;
            body.updateTransform();
        }
    };

    PhysicsMode.prototype.clearYard = function () {
        const bodies = this.physicsWorld.bodies.slice();
        for (let i = 0; i < bodies.length; i++) {
            this.app.sceneView.scene.remove(bodies[i].mesh);
            if (Meshes.disposeGroup) Meshes.disposeGroup(bodies[i].mesh);
        }
        this.physicsWorld.clear();

        if (this.challenge === 'tower' && this.run.status !== 'over') {
            this.run = this.blankRun();
        }
        this.refreshHUD();
    };

    /* ── HUD ───────────────────────────────────────────────────────────── */

    PhysicsMode.prototype.metrics = function () {
        const bodies = this.physicsWorld.bodies;
        let mass = 0;
        let asleep = 0;

        for (let i = 0; i < bodies.length; i++) {
            mass += bodies[i].mass;
            if (bodies[i].sleeping) asleep++;
        }

        return {
            count: bodies.length,
            mass: Math.round(mass),
            height: Math.round(this.maxTop() * 10) / 10,
            settled: asleep === bodies.length,
            challenge: this.challenge,
            placementStyle: this.placementStyle,
            status: this.run.status,
            runHeight: Math.round(this.run.height * 10) / 10,
            best: Math.round((Cargo3D.Storage.getPhysics().bestHeight || 0) * 10) / 10
        };
    };

    PhysicsMode.prototype.refreshHUD = function () {
        if (!this.active || !this.app.ui.updatePhysicsHUD) return;
        this.app.ui.updatePhysicsHUD(this.metrics());
    };

    Cargo3D.PhysicsMode = PhysicsMode;
})(window);
