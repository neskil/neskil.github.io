/**
 * game/contracts.js — the sandbox's optional job board.
 *
 * Binds core/contracts.js to the sandbox: draws the delivery zone, watches where
 * units come to rest, ticks the clock, and applies purchased upgrades to the
 * machinery. Turn it off and the sandbox is a plain free-build again.
 *
 * An order has to be *delivered*. When one is issued, every unit already sitting
 * in its zone is stamped with that order's serial and ignored — otherwise a
 * container that happened to be parked in the depot would pay out the instant
 * the job board was switched on.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const Contracts = Cargo3D.Contracts;
    const Storage = Cargo3D.Storage;

    function ContractRunner(app, sandbox) {
        this.app = app;
        this.sandbox = sandbox;
        this.running = false;

        this.state = Contracts.createState(Storage.getContracts() || undefined);
        this.buildZoneMarker();
    }

    ContractRunner.prototype.buildZoneMarker = function () {
        this.marker = new THREE.Group();

        this.pad = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({
                color: 0x22c55e, transparent: true, opacity: 0.12, depthWrite: false
            })
        );
        this.pad.rotation.x = -Math.PI / 2;
        this.marker.add(this.pad);

        this.padEdges = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)),
            new THREE.LineBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.9 })
        );
        this.padEdges.rotation.x = -Math.PI / 2;
        this.marker.add(this.padEdges);

        this.marker.visible = false;
        this.app.sceneView.add(this.marker);
    };

    ContractRunner.prototype.positionMarker = function () {
        const contract = this.state.active;
        if (!contract) { this.marker.visible = false; return; }

        const zone = contract.zone;
        const w = zone.xMax - zone.xMin;
        const d = zone.zMax - zone.zMin;

        this.pad.scale.set(w, d, 1);
        this.padEdges.scale.set(w, d, 1);
        this.marker.position.set((zone.xMin + zone.xMax) / 2, 0.05, (zone.zMin + zone.zMax) / 2);
        this.marker.visible = true;
    };

    ContractRunner.prototype.start = function () {
        this.running = true;
        if (!this.state.active) Contracts.generate(this.state);
        this.applyUpgrades();
        this.armContract();
        this.notify();
    };

    /**
     * Discount whatever is already standing in the new order's zone, and move
     * the marker. Call this after every `Contracts.generate`.
     */
    ContractRunner.prototype.armContract = function () {
        const contract = this.state.active;
        this.positionMarker();
        if (!contract) return;

        const serial = this.state.serial;
        this.sandbox.units.forEach(function (unit) {
            if (Contracts.inZone(unit.position.x, unit.position.z, contract)) {
                unit.userData.contractIgnore = serial;
            }
        });
    };

    ContractRunner.prototype.stop = function () {
        this.running = false;
        this.marker.visible = false;
        Storage.saveContracts(this.state);
        this.notify();
    };

    ContractRunner.prototype.isRunning = function () {
        return this.running;
    };

    /** Upgrades are idempotent multipliers, so recompute from a known base. */
    ContractRunner.prototype.applyUpgrades = function () {
        const crane = this.app.crane;
        if (!crane) return;

        const fast = this.state.upgrades.fastWinch ? 1.6 : 1;
        crane.maxSpeed = 9 * fast;
        crane.trolleySpeed = 7 * fast;
        crane.hoistSpeed = 7 * fast;
    };

    ContractRunner.prototype.buy = function (key) {
        const result = Contracts.buyUpgrade(this.state, key);
        if (result.ok) {
            this.applyUpgrades();
            Storage.saveContracts(this.state);
            if (Cargo3D.Audio) Cargo3D.Audio.lock();
        } else if (Cargo3D.Audio) {
            Cargo3D.Audio.reject();
        }
        this.notify();
        return result;
    };

    ContractRunner.prototype.update = function (delta) {
        if (!this.running) return;

        const expiry = Contracts.tick(this.state, delta);
        if (expiry) {
            this.armContract();
            this.app.ui.flashReason('Contract expired — $' + expiry.penalty.toLocaleString() + ' penalty.');
            Storage.saveContracts(this.state);
            this.notify();
            return;
        }

        // Anything at rest inside the zone, not currently in a grab, pays out.
        const carriedByStacker = this.app.vehicle ? this.app.vehicle.carried : null;
        const carriedByCrane = this.app.crane ? this.app.crane.carried : null;
        const units = this.sandbox.units;

        const serial = this.state.serial;

        for (let i = 0; i < units.length; i++) {
            const unit = units[i];
            if (unit === carriedByStacker || unit === carriedByCrane) continue;
            if (unit.userData.contractIgnore === serial) continue;

            const done = Contracts.tryComplete(this.state, unit.position.x, unit.position.z);
            if (!done) continue;

            this.armContract();
            this.app.ui.flashSuccess(done.id + ' complete — +$' + done.payout.toLocaleString());
            if (this.app.effects) {
                this.app.effects.ring(unit.position.x, 0, unit.position.z, 0x22c55e);
            }
            if (Cargo3D.Audio) Cargo3D.Audio.fanfare('bronze');
            Storage.saveContracts(this.state);
            break;
        }

        this.notify();
    };

    ContractRunner.prototype.snapshot = function () {
        return {
            running: this.running,
            money: this.state.money,
            delivered: this.state.delivered,
            rating: this.state.rating,
            ratingLabel: Contracts.ratingLabel(this.state.rating),
            upgrades: this.state.upgrades,
            contract: this.state.active
        };
    };

    ContractRunner.prototype.notify = function () {
        this.app.ui.updateContracts(this.snapshot());
    };

    ContractRunner.prototype.reset = function () {
        this.state = Contracts.createState();
        Storage.saveContracts(this.state);
        if (this.running) Contracts.generate(this.state);
        this.applyUpgrades();
        this.armContract();
        this.notify();
    };

    Cargo3D.ContractRunner = ContractRunner;
})(window);
