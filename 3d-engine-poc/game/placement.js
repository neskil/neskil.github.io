/**
 * game/placement.js — turning pointer movement into legal grid placements.
 *
 * Owns the ghost, the rotation state and the queue cursor. It asks core/rules
 * whether something is allowed and never decides for itself.
 *
 * Click-versus-orbit is resolved on pointerup: a press that moved more than a
 * few pixels was a camera drag, not a placement.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const C = Cargo3D.Constants;
    const Rules = Cargo3D.Rules;

    const DRAG_SLOP_PX = 6;

    /**
     * @param {object} deps { sceneView, yardView, grid, effects, rules, units, onChange, onPlace, onUndo, onReject, onComplete }
     */
    function PlacementController(deps) {
        this.sceneView = deps.sceneView;
        this.yardView = deps.yardView;
        this.grid = deps.grid;
        this.effects = deps.effects;
        this.rules = deps.rules || [];
        this.units = deps.units || [];

        this.onChange = deps.onChange || function () {};
        this.onPlace = deps.onPlace || function () {};
        this.onUndo = deps.onUndo || function () {};
        this.onReject = deps.onReject || function () {};
        this.onComplete = deps.onComplete || function () {};
        this.onExit = deps.onExit || function () {};

        this.index = 0;
        this.rot = 0;
        this.undos = 0;
        this.hover = null;
        this.attached = false;

        this._scratch = new THREE.Vector3();
        this.bindHandlers();
    }

    PlacementController.prototype.current = function () {
        return this.index < this.units.length ? this.units[this.index] : null;
    };

    PlacementController.prototype.upcoming = function (count) {
        return this.units.slice(this.index + 1, this.index + 1 + (count || 3));
    };

    PlacementController.prototype.remaining = function () {
        return Math.max(0, this.units.length - this.index);
    };

    PlacementController.prototype.isFinished = function () {
        return this.index >= this.units.length;
    };

    /** Rotation only means something when the footprint is not square. */
    PlacementController.prototype.canRotate = function () {
        const unit = this.current();
        if (!unit) return false;
        const type = C.CARGO_TYPES[unit.type];
        return !!type && type.cells[0] !== type.cells[1];
    };

    PlacementController.prototype.bindHandlers = function () {
        const self = this;
        const dom = this.sceneView.renderer.domElement;

        this._onPointerMove = function (e) { self.updateHover(e); };

        this._onPointerDown = function (e) {
            self._press = { x: e.clientX, y: e.clientY, button: e.button };
        };

        this._onPointerUp = function (e) {
            const press = self._press;
            self._press = null;
            if (!press || press.button !== 0 || e.button !== 0) return;
            if (Math.abs(e.clientX - press.x) > DRAG_SLOP_PX ||
                Math.abs(e.clientY - press.y) > DRAG_SLOP_PX) return;

            self.updateHover(e);
            self.commit();
        };

        this._onKeyDown = function (e) {
            if (!self.attached) return;
            const k = e.key.toLowerCase();
            if (k === 'r') { self.rotate(); e.preventDefault(); }
            else if (k === 'z') { self.undo(); e.preventDefault(); }
            else if (k === 'escape') { self.onExit(); }
        };

        this._dom = dom;
    };

    PlacementController.prototype.attach = function () {
        if (this.attached) return;
        this.attached = true;
        this._dom.addEventListener('pointermove', this._onPointerMove);
        this._dom.addEventListener('pointerdown', this._onPointerDown);
        this._dom.addEventListener('pointerup', this._onPointerUp);
        this._dom.addEventListener('pointerleave', this._onPointerLeaveBound = this.clearHover.bind(this));
        window.addEventListener('keydown', this._onKeyDown);
        this.syncGhost();
        this.onChange(this);
    };

    PlacementController.prototype.detach = function () {
        if (!this.attached) return;
        this.attached = false;
        this._dom.removeEventListener('pointermove', this._onPointerMove);
        this._dom.removeEventListener('pointerdown', this._onPointerDown);
        this._dom.removeEventListener('pointerup', this._onPointerUp);
        this._dom.removeEventListener('pointerleave', this._onPointerLeaveBound);
        window.removeEventListener('keydown', this._onKeyDown);
        this.yardView.clearGhost();
        this.hover = null;
    };

    PlacementController.prototype.syncGhost = function () {
        const unit = this.current();
        if (!unit) {
            this.yardView.clearGhost();
            return;
        }
        this.yardView.setGhostType(unit.type, this.rot);
    };

    PlacementController.prototype.clearHover = function () {
        this.hover = null;
        this.yardView.hideGhost();
        this.onChange(this);
    };

    PlacementController.prototype.updateHover = function (event) {
        const unit = this.current();
        if (!unit) { this.clearHover(); return; }

        const point = this.sceneView.pointerToGround(event, this._scratch);
        if (!point || !this.yardView.isOverBay(point)) { this.clearHover(); return; }

        const origin = this.yardView.worldToCellOrigin(point, unit.type, this.rot);
        const tier = this.grid.restTier(unit.type, this.rot, origin.x, origin.z);

        if (tier === null) { this.clearHover(); return; }

        const pos = { x: origin.x, z: origin.z, tier: tier < 0 ? this.grid.tiers : tier, rot: this.rot };
        const check = Rules.validate(this.grid, unit, pos, this.rules);

        this.hover = {
            x: pos.x, z: pos.z, tier: pos.tier, rot: this.rot,
            ok: check.ok, reason: check.reason,
            violations: check.violations,
            support: check.support
        };

        this.yardView.setGhostType(unit.type, this.rot);
        this.yardView.moveGhost(pos.x, pos.z, Math.min(pos.tier, this.grid.tiers - 1), check.ok);
        this.onChange(this);
    };

    PlacementController.prototype.rotate = function () {
        if (!this.canRotate()) return;
        this.rot = (this.rot + 1) % 2;
        this.syncGhost();
        if (Cargo3D.Audio) Cargo3D.Audio.click();

        // Re-validate in place so the ghost colour follows the rotation.
        if (this.hover) {
            const unit = this.current();
            const tier = this.grid.restTier(unit.type, this.rot, this.hover.x, this.hover.z);
            if (tier === null || tier < 0) { this.clearHover(); return; }
            const check = Rules.validate(this.grid, unit, { x: this.hover.x, z: this.hover.z, tier: tier, rot: this.rot }, this.rules);
            this.hover.tier = tier;
            this.hover.rot = this.rot;
            this.hover.ok = check.ok;
            this.hover.reason = check.reason;
            this.hover.violations = check.violations;
            this.yardView.moveGhost(this.hover.x, this.hover.z, tier, check.ok);
        }
        this.onChange(this);
    };

    /** Commit the hovered placement, if it is legal. */
    PlacementController.prototype.commit = function () {
        const unit = this.current();
        if (!unit || !this.hover) return false;

        if (!this.hover.ok) {
            if (Cargo3D.Audio) Cargo3D.Audio.reject();
            this.onReject(this.hover.reason || 'Placement not allowed.');
            return false;
        }

        const placement = this.grid.place(unit, this.hover.x, this.hover.z, this.hover.tier, this.rot);
        if (!placement) {
            if (Cargo3D.Audio) Cargo3D.Audio.reject();
            this.onReject('Slot is occupied.');
            return false;
        }

        const mesh = this.yardView.addUnit(placement);
        this.yardView.updateEnvelope(this.grid.bounds());

        if (this.effects) {
            this.effects.ring(mesh.position.x, placement.tier * C.GRID.TIER_H, mesh.position.z, 0x38bdf8);
        }
        if (Cargo3D.Audio) Cargo3D.Audio.lock();

        this.index++;
        this.rot = 0;
        this.syncGhost();
        this.onPlace(placement, this);
        this.onChange(this);

        if (this.isFinished()) this.onComplete(this);
        return true;
    };

    /** Pop the last unit back to the head of the queue. */
    PlacementController.prototype.undo = function () {
        const last = this.grid.lastPlacement();
        if (!last) return false;

        this.grid.removeById(last.id);
        this.yardView.removeUnit(last.id);
        this.yardView.updateEnvelope(this.grid.bounds());

        this.index = Math.max(0, this.index - 1);
        this.undos++;
        this.rot = 0;
        this.syncGhost();

        if (Cargo3D.Audio) Cargo3D.Audio.lift();
        this.onUndo(last, this);
        this.onChange(this);
        return true;
    };

    /** True when the head of the queue has nowhere legal left to go. */
    PlacementController.prototype.isStuck = function () {
        const unit = this.current();
        if (!unit) return false;
        return !Rules.hasLegalPlacement(this.grid, unit, this.rules);
    };

    Cargo3D.PlacementController = PlacementController;
})(window);
