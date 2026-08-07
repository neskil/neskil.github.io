/**
 * game/cascadeMode.js — Cascade, the falling-cargo game.
 *
 * The campaign's yard, played against a clock instead of a manifest. A crane
 * releases one container at a time at the top of a narrow bay and it comes down
 * on its own; you steer it while it falls, and a tier you fill completely ships
 * out and takes its height with it.
 *
 * Everything that decides what is true — where the piece is, whether it fits,
 * which tiers ship, what it scores — is core/cascade.js. This file is the
 * wiring: meshes, camera, input, and the events the rules hand back.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const C = Cargo3D.Constants;
    const Meshes = Cargo3D.ContainerMeshes;
    const Storage = Cargo3D.Storage;

    /** A frame this long is a stalled tab, not a slow one — do not fall for it. */
    const MAX_DELTA = 0.12;

    /** How far from the piece a tap still counts as "drop it here". */
    const TAP_REACH = 1;

    function CascadeMode(app) {
        this.app = app;
        this.game = null;
        this.yardView = null;
        this.pieceMesh = null;
        this.pieceUid = null;
        this.active = false;
        this.paused = false;

        this._scratch = new THREE.Vector3();
        this.bindHandlers();
    }

    /* ── input ─────────────────────────────────────────────────────────── */

    CascadeMode.prototype.bindHandlers = function () {
        const self = this;

        this._onPointerDown = function (e) {
            self._press = { x: e.clientX, y: e.clientY, button: e.button };
        };

        this._onPointerMove = function (e) {
            if (!self.active || self.paused || !self.game || self.game.over) return;
            // A mouse aims by hovering; a finger has nothing to hover with, so
            // its first tap does the aiming instead (see _onPointerUp).
            if (e.pointerType === 'touch' || e.pointerType === 'pen') return;
            self.aimAt(e);
        };

        this._onPointerUp = function (e) {
            const press = self._press;
            self._press = null;
            if (!press || press.button !== 0 || e.button !== 0) return;
            // A drag is the camera, not a placement.
            if (Math.abs(e.clientX - press.x) > 6 || Math.abs(e.clientY - press.y) > 6) return;
            if (!self.active || self.paused || !self.game || self.game.over) return;

            const touch = e.pointerType === 'touch' || e.pointerType === 'pen';
            // Asked before the aim moves the piece out from under the question.
            const confirming = !touch || self.pointerNearPiece(e);

            self.aimAt(e);
            if (confirming) self.hardDrop();
        };

        this._onKeyDown = function (e) {
            if (!self.active || !self.game) return;

            if (e.key === 'Shift') {
                self.setSoft(true);
                return;
            }

            const STEP = {
                ArrowLeft: 'left', ArrowRight: 'right',
                ArrowUp: 'forward', ArrowDown: 'back',
                a: 'left', d: 'right', w: 'forward', s: 'back'
            };
            const dir = STEP[e.key] || STEP[e.key.toLowerCase()];
            if (dir) {
                self.step(dir);
                e.preventDefault();
                return;
            }

            if (e.key === ' ' || e.key === 'Enter') {
                self.hardDrop();
                e.preventDefault();
                return;
            }

            const k = e.key.toLowerCase();
            if (k === 'r' || k === 'q' || k === 'e') {
                self.rotate();
                e.preventDefault();
            } else if (k === 'escape' || k === 'p') {
                self.app.ui.openPauseMenu();
            }
        };

        this._onKeyUp = function (e) {
            if (e.key === 'Shift') self.setSoft(false);
        };

        // A soft drop held while the window loses focus would never be released.
        this._onBlur = function () { self.setSoft(false); };
    };

    /* ── lifecycle ─────────────────────────────────────────────────────── */

    CascadeMode.prototype.enter = function (opts) {
        this.active = true;
        this.paused = false;

        const view = this.app.sceneView;
        this.game = new Cargo3D.CascadeGame({
            bay: (opts && opts.bay) || Cargo3D.Cascade.BAY,
            seed: opts && opts.seed
        });

        this.yardView = new Cargo3D.YardView(view, this.game.bay);
        this.yardView.setEnvelopeVisible(false);

        this.app.terminal.setVisible(false);
        view.setMastsVisible(false);
        this.app.vehicle.setEnabled(false);
        this.app.crane.setEnabled(false);
        this.app.crane.setVisible(false);
        this.app.weather.set(Storage.getSettings().weather || 'day');
        // Centred on the bay's full height, not its lower third: the piece the
        // player is steering starts at the roof of a shaft twice as tall as it
        // is wide, and it has to stay on screen the whole way down.
        this.app.cameraRig.frameBay(this.game.bay, 0.5);
        this.app.cameraRig.setMode('iso');

        const dom = view.renderer.domElement;
        dom.addEventListener('pointerdown', this._onPointerDown);
        dom.addEventListener('pointermove', this._onPointerMove);
        dom.addEventListener('pointerup', this._onPointerUp);
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
        window.addEventListener('blur', this._onBlur);

        this.app.ui.showCascadeHUD();
        this.syncPiece();
        this.refreshHUD();
    };

    CascadeMode.prototype.exit = function () {
        this.active = false;
        const view = this.app.sceneView;
        const dom = view.renderer.domElement;

        dom.removeEventListener('pointerdown', this._onPointerDown);
        dom.removeEventListener('pointermove', this._onPointerMove);
        dom.removeEventListener('pointerup', this._onPointerUp);
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        window.removeEventListener('blur', this._onBlur);

        this.removePieceMesh();
        if (this.yardView) this.yardView.dispose();
        this.yardView = null;
        this.game = null;

        this.app.ui.hideCascadeResult();
        this.app.ui.hideCascadeHUD();
    };

    /** Start the run again from an empty bay. */
    CascadeMode.prototype.restartRun = function () {
        if (!this.game) return;

        this.removePieceMesh();
        this.yardView.clearUnits();
        this.yardView.hideGhost();
        this.game.reset();
        this.paused = false;

        this.app.ui.hideCascadeResult();
        this.syncPiece();
        this.refreshHUD();
    };

    /**
     * The falling clock has to stop while a panel is over the yard — this is the
     * one mode where a pause menu that keeps playing is a lost run.
     */
    CascadeMode.prototype.setPaused = function (paused) {
        this.paused = !!paused;
        if (this.paused) this.setSoft(false);
        this.refreshHUD();
        return this.paused;
    };

    CascadeMode.prototype.update = function (delta) {
        if (!this.active || !this.game) return;

        // Runs while paused too: a tier that just shipped is still settling, and
        // freezing it mid-air reads as a bug rather than as a pause.
        this.yardView.update(delta);

        if (!this.paused && !this.game.over) {
            this.applyEvents(this.game.tick(Math.min(delta || 0, MAX_DELTA)));
        }

        this.syncPiece();
        this.refreshHUD();
    };

    /* ── what the rules hand back ──────────────────────────────────────── */

    CascadeMode.prototype.applyEvents = function (events) {
        for (let i = 0; i < events.length; i++) {
            const ev = events[i];
            if (ev.type === 'lock') this.onLock(ev);
            else if (ev.type === 'clear') this.onClear(ev);
            else if (ev.type === 'over') this.onOver(ev);
        }
    };

    /**
     * A container has come to rest. It fell here under its own weight, so the
     * mesh is placed at its target rather than dropped into it again.
     */
    CascadeMode.prototype.onLock = function (ev) {
        this.removePieceMesh();

        const mesh = this.yardView.addUnit(ev.placement);
        mesh.position.y = mesh.userData.dropTarget;
        mesh.userData.dropping = false;

        const spec = C.CARGO_TYPES[ev.placement.type] || C.CARGO_TYPES['20ft'];
        if (this.app.effects) {
            this.app.effects.dustPuff(mesh.position.x, mesh.position.y - spec.height / 2, mesh.position.z);
            this.app.effects.shake(0.18);
        }
        if (Cargo3D.Audio) Cargo3D.Audio.lock();
    };

    /** A tier shipped out. Its cargo goes, and everything above settles down. */
    CascadeMode.prototype.onClear = function (ev) {
        for (let i = 0; i < ev.removed.length; i++) {
            this.yardView.removeUnit(ev.removed[i].id);
        }
        for (let i = 0; i < ev.moved.length; i++) {
            this.yardView.reseatUnit(ev.moved[i].from.id, ev.moved[i].to);
        }

        const tier = ev.tiers[0];
        const centre = this.yardView.cellToWorld(
            (this.game.bay.cols - 1) / 2, (this.game.bay.rows - 1) / 2, tier, '10ft', 0
        );

        if (this.app.effects) {
            this.app.effects.burst(centre.x, centre.y, centre.z, ev.perfect ? 0xfbbf24 : 0x34d399);
            this.app.effects.ring(centre.x, tier * C.GRID.TIER_H + 0.05, centre.z, 0x34d399);
            this.app.effects.shake(0.35);
        }
        if (Cargo3D.Audio) {
            Cargo3D.Audio.fanfare(ev.perfect ? 'gold' : ev.combo > 2 ? 'silver' : 'bronze');
        }

        this.app.ui.flashSuccess(
            ev.perfect ? 'Bay cleared — every tier shipped.'
                : ev.combo > 1 ? 'Tier ' + (tier + 1) + ' shipped · ' + ev.combo + '× combo'
                : 'Tier ' + (tier + 1) + ' shipped out.'
        );
    };

    CascadeMode.prototype.onOver = function (ev) {
        this.removePieceMesh();
        this.yardView.hideGhost();
        this.setSoft(false);

        const saved = Storage.recordCascade({
            score: this.game.score,
            layers: this.game.layers,
            level: this.game.level()
        });

        if (Cargo3D.Audio) Cargo3D.Audio.reject();
        this.app.cameraRig.setMode('orbit');

        this.app.ui.showCascadeResult({
            score: this.game.score,
            layers: this.game.layers,
            level: this.game.level(),
            dropped: this.game.dropped,
            bestCombo: this.game.bestCombo,
            elapsedMs: Math.round(this.game.elapsed * 1000),
            reason: ev.reason,
            best: saved.best.bestScore,
            previousBest: saved.previousBest,
            improved: saved.improved,
            runs: saved.best.runs
        });
    };

    /* ── the falling container ─────────────────────────────────────────── */

    /**
     * Put the piece mesh and the landing ghost where the rules say they are.
     * The mesh sits at a fractional tier — the only place in the game that does,
     * because it is the only thing that is between two of them.
     */
    CascadeMode.prototype.syncPiece = function () {
        const piece = this.game.piece;
        if (!piece) {
            this.removePieceMesh();
            this.yardView.hideGhost();
            return;
        }

        if (this.pieceUid !== piece.unit.uid) {
            this.removePieceMesh();
            this.pieceMesh = Meshes.createUnitMesh(piece.type, piece.unit.carrier, piece.unit.traits);
            this.pieceUid = piece.unit.uid;
            this.app.sceneView.add(this.pieceMesh);
        }

        const tier = piece.tier - this.game.fallProgress();
        this.yardView.cellToWorld(piece.x, piece.z, tier, piece.type, piece.rot, this.pieceMesh.position);
        this.pieceMesh.rotation.y = piece.rot % 2 === 0 ? 0 : Math.PI / 2;

        this.yardView.setGhostType(piece.type, piece.rot);
        this.yardView.moveGhost(piece.x, piece.z, this.game.landingTier(), true);
    };

    CascadeMode.prototype.removePieceMesh = function () {
        if (!this.pieceMesh) return;
        this.app.sceneView.remove(this.pieceMesh);
        Meshes.disposeGroup(this.pieceMesh);
        this.pieceMesh = null;
        this.pieceUid = null;
    };

    /* ── steering ──────────────────────────────────────────────────────── */

    /**
     * Which way is "left" depends on where the camera is standing, and this yard
     * is orbited constantly. So the arrows are resolved against the view: the
     * dominant horizontal axis of the camera's forward direction is up-screen,
     * and right is that turned a quarter clockwise.
     */
    CascadeMode.prototype.axes = function () {
        const view = this.app.sceneView;
        let fx = view.controls.target.x - view.camera.position.x;
        let fz = view.controls.target.z - view.camera.position.z;

        if (Math.abs(fx) >= Math.abs(fz)) {
            fx = fx >= 0 ? 1 : -1;
            fz = 0;
        } else {
            fz = fz >= 0 ? 1 : -1;
            fx = 0;
        }
        return { forward: { x: fx, z: fz }, right: { x: -fz, z: fx } };
    };

    /** @param {'left'|'right'|'forward'|'back'} dir screen-relative */
    CascadeMode.prototype.step = function (dir) {
        if (!this.canPlay()) return false;

        const axes = this.axes();
        const sign = (dir === 'left' || dir === 'back') ? -1 : 1;
        const axis = (dir === 'left' || dir === 'right') ? axes.right : axes.forward;

        const moved = this.game.moveBy(axis.x * sign, axis.z * sign);
        if (moved && Cargo3D.Audio) Cargo3D.Audio.click();
        this.syncPiece();
        return moved;
    };

    CascadeMode.prototype.rotate = function () {
        if (!this.canPlay()) return false;
        const turned = this.game.rotate();
        if (turned && Cargo3D.Audio) Cargo3D.Audio.click();
        else if (!turned && Cargo3D.Audio) Cargo3D.Audio.reject();
        this.syncPiece();
        return turned;
    };

    CascadeMode.prototype.setSoft = function (on) {
        if (!this.game) return false;
        if (on && !this.canPlay()) return false;
        return this.game.setSoft(on);
    };

    CascadeMode.prototype.hardDrop = function () {
        if (!this.canPlay()) return;
        if (Cargo3D.Audio) Cargo3D.Audio.hydraulic();
        this.applyEvents(this.game.hardDrop());
        this.syncPiece();
        this.refreshHUD();
    };

    CascadeMode.prototype.canPlay = function () {
        return !!(this.active && this.game && this.game.piece && !this.game.over && !this.paused);
    };

    /* ── pointer aiming ────────────────────────────────────────────────── */

    /** The footprint origin a pointer event is asking for, or null. */
    CascadeMode.prototype.originAt = function (event) {
        const piece = this.game && this.game.piece;
        if (!piece) return null;

        const point = this.app.sceneView.pointerToGround(event, this._scratch);
        if (!point) return null;
        return this.yardView.worldToCellOrigin(point, piece.type, piece.rot);
    };

    CascadeMode.prototype.aimAt = function (event) {
        if (!this.canPlay()) return false;
        const origin = this.originAt(event);
        if (!origin) return false;

        const moved = this.game.moveTo(origin.x, origin.z);
        this.syncPiece();
        return moved;
    };

    /** Is this tap roughly where the piece already is? Then it means "drop". */
    CascadeMode.prototype.pointerNearPiece = function (event) {
        const piece = this.game && this.game.piece;
        const origin = this.originAt(event);
        if (!piece || !origin) return false;
        return Math.abs(origin.x - piece.x) <= TAP_REACH && Math.abs(origin.z - piece.z) <= TAP_REACH;
    };

    /* ── HUD ───────────────────────────────────────────────────────────── */

    CascadeMode.prototype.metrics = function () {
        const snap = this.game.snapshot();
        snap.paused = this.paused;
        snap.best = Storage.getCascade().bestScore || 0;

        // One word for the state of the run: the readout the phone strip keeps
        // when everything else has been folded away.
        snap.status = snap.over ? 'over'
            : this.paused ? 'paused'
            : snap.stackHeight >= snap.tiers - 1 ? 'danger'
            : snap.soft ? 'soft'
            : 'falling';
        return snap;
    };

    CascadeMode.prototype.refreshHUD = function () {
        if (!this.active || !this.game) return;
        this.app.ui.updateCascadeHUD(this.metrics());
    };

    Cargo3D.CascadeMode = CascadeMode;
})(window);
