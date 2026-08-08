/**
 * render/crane.js — rail-mounted gantry crane (RMG).
 *
 * Ported from the pre-restructure `js/crane.js`. It spans the freight tracks and
 * the transfer yard: the whole portal rolls along Z, a trolley slides along the
 * bridge in X, and the winch lowers a spreader that can lift a container
 * straight off a train flatcar.
 *
 * Changes from the original: motion is frame-rate independent, input is gated on
 * `enabled` so it does not fight the reach stacker for WASD, and it takes a
 * SceneView rather than a bare scene.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};

    const BRIDGE_Y = 16.2;
    const LEG_LEFT = -35;
    const LEG_RIGHT = -12;

    function PortCrane(sceneView) {
        this.sceneView = sceneView;
        this.group = new THREE.Group();
        this.enabled = false;

        // Portal travel along the rails (Z).
        this.zPos = -5;
        this.zSpeed = 0;
        this.maxSpeed = 9;        // m/s
        this.acceleration = 14;
        this.friction = 2.4;

        // Trolley along the bridge span (X).
        this.trolleyX = -32;
        this.minX = -34;
        this.maxX = -13;
        this.trolleySpeed = 7;    // m/s

        // Winch (Y).
        this.hoistY = 12.0;
        this.minY = 1.5;
        this.maxY = 14.0;
        this.hoistSpeed = 7;      // m/s

        this.carried = null;

        this.keys = { forward: false, backward: false, left: false, right: false, hoistUp: false, hoistDown: false };

        this.buildGantry();
        this.buildTrolley();
        this.buildLaser();
        this.updateHoistVisuals();

        this.group.visible = false;
        sceneView.add(this.group);
        this.bindKeys();
    }

    PortCrane.prototype.buildGantry = function () {
        const steel = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.7 });
        const accent = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4, metalness: 0.5 });
        const dark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

        const legGeo = new THREE.BoxGeometry(1.2, 16, 2.4);
        [LEG_LEFT, LEG_RIGHT].forEach(function (x) {
            const leg = new THREE.Mesh(legGeo, steel);
            leg.position.set(x, 8, 0);
            leg.castShadow = true;
            this.group.add(leg);

            const bogie = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 4.0), dark);
            bogie.position.set(x, 0.5, 0);
            bogie.castShadow = true;
            this.group.add(bogie);
        }, this);

        const beam = new THREE.Mesh(new THREE.BoxGeometry(25, 1.8, 2.6), steel);
        beam.position.set(-23.5, 16.5, 0);
        beam.castShadow = true;
        this.group.add(beam);

        const stripe = new THREE.Mesh(new THREE.BoxGeometry(24.5, 0.2, 2.7), accent);
        stripe.position.set(-23.5, 15.5, 0);
        this.group.add(stripe);

        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 2.0, 2.2),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
        );
        cabin.position.set(-20, 15.2, 1.5);
        this.group.add(cabin);

        this.group.position.z = this.zPos;
    };

    PortCrane.prototype.buildTrolley = function () {
        this.trolley = new THREE.Group();
        this.trolley.position.set(this.trolleyX, BRIDGE_Y, 0);

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 1.0, 3.2),
            new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3, metalness: 0.6 })
        );
        body.castShadow = true;
        this.trolley.add(body);

        const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
        const cableMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
        this.cables = [];
        [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (at) {
            const cable = new THREE.Mesh(cableGeo, cableMat);
            this.trolley.add(cable);
            this.cables.push({ mesh: cable, ox: at[0], oz: at[1] });
        }, this);

        this.spreader = new THREE.Group();
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 0.4, 6.0),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
        );
        frame.castShadow = true;
        this.spreader.add(frame);

        const lockGeo = new THREE.BoxGeometry(0.3, 0.5, 0.3);
        const lockMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.5 });
        [[-1.1, -2.8], [1.1, -2.8], [-1.1, 2.8], [1.1, 2.8]].forEach(function (at) {
            const lock = new THREE.Mesh(lockGeo, lockMat);
            lock.position.set(at[0], -0.1, at[1]);
            this.spreader.add(lock);
        }, this);

        this.trolley.add(this.spreader);
        this.group.add(this.trolley);
    };

    /** Vertical targeting beam from the spreader to the ground. */
    PortCrane.prototype.buildLaser = function () {
        this.laser = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.15, 15, 12),
            new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.32, depthWrite: false })
        );
        this.spreader.add(this.laser);
    };

    PortCrane.prototype.updateHoistVisuals = function () {
        const drop = BRIDGE_Y - this.hoistY;
        this.spreader.position.set(0, -drop, 0);

        this.cables.forEach(function (c) {
            c.mesh.scale.y = drop;
            c.mesh.position.set(c.ox, -drop / 2, c.oz);
        });

        if (this.laser) {
            this.laser.scale.y = this.hoistY / 15.0;
            this.laser.position.set(0, -this.hoistY / 2, 0);
        }
    };

    PortCrane.prototype.bindKeys = function () {
        const self = this;

        function set(e, down) {
            if (!self.enabled) return;
            const k = e.key.toLowerCase();
            if (k === 'w' || k === 'arrowup') self.keys.forward = down;
            else if (k === 's' || k === 'arrowdown') self.keys.backward = down;
            else if (k === 'a' || k === 'arrowleft') self.keys.left = down;
            else if (k === 'd' || k === 'arrowright') self.keys.right = down;
            else if (k === 'q') self.keys.hoistDown = down;
            else if (k === 'e') self.keys.hoistUp = down;
            else return;
            e.preventDefault();
        }

        this._onKeyDown = function (e) { set(e, true); };
        this._onKeyUp = function (e) { set(e, false); };
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    };

    PortCrane.prototype.setEnabled = function (enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.keys = { forward: false, backward: false, left: false, right: false, hoistUp: false, hoistDown: false };
            this.zSpeed = 0;
            this.carried = null;
        }
    };

    /** The gantry stays in the scene as terminal furniture even when not driven. */
    PortCrane.prototype.setVisible = function (visible) {
        this.group.visible = visible;
    };

    PortCrane.prototype.update = function (delta) {
        if (!this.group.visible) return;
        const dt = Math.min(delta, 0.05);

        if (this.enabled) {
            if (this.keys.forward) {
                this.zSpeed = Math.max(-this.maxSpeed, this.zSpeed - this.acceleration * dt);
                if (Cargo3D.Audio) Cargo3D.Audio.engine();
            } else if (this.keys.backward) {
                this.zSpeed = Math.min(this.maxSpeed, this.zSpeed + this.acceleration * dt);
                if (Cargo3D.Audio) Cargo3D.Audio.engine();
            } else {
                this.zSpeed -= this.zSpeed * Math.min(1, this.friction * dt);
                if (Math.abs(this.zSpeed) < 0.02) this.zSpeed = 0;
            }

            this.zPos = Math.max(-38, Math.min(38, this.zPos + this.zSpeed * dt));
            this.group.position.z = this.zPos;

            if (this.keys.left) {
                this.trolleyX = Math.max(this.minX, this.trolleyX - this.trolleySpeed * dt);
                if (Cargo3D.Audio) Cargo3D.Audio.hydraulic();
            }
            if (this.keys.right) {
                this.trolleyX = Math.min(this.maxX, this.trolleyX + this.trolleySpeed * dt);
                if (Cargo3D.Audio) Cargo3D.Audio.hydraulic();
            }
            this.trolley.position.x = this.trolleyX;

            if (this.keys.hoistDown) {
                this.hoistY = Math.max(this.minY, this.hoistY - this.hoistSpeed * dt);
                if (Cargo3D.Audio) Cargo3D.Audio.hydraulic();
            }
            if (this.keys.hoistUp) {
                this.hoistY = Math.min(this.maxY, this.hoistY + this.hoistSpeed * dt);
                if (Cargo3D.Audio) Cargo3D.Audio.hydraulic();
            }
            this.updateHoistVisuals();
        }

        if (this.carried) {
            const at = this.spreaderPosition();
            const spec = this.carried.userData.spec;
            this.carried.position.set(at.x, at.y - (spec ? spec.height / 2 : 1.3) - 0.2, at.z);
            this.carried.rotation.set(0, 0, 0);
        }
    };

    PortCrane.prototype.spreaderPosition = function (target) {
        const out = target || new THREE.Vector3();
        this.spreader.getWorldPosition(out);
        return out;
    };

    /** World position the crane is pointing at on the ground. */
    PortCrane.prototype.groundTarget = function () {
        const at = this.spreaderPosition();
        at.y = 0;
        return at;
    };

    /**
     * Engage or release the twistlocks.
     *
     * @param {THREE.Group[]} units loose yard units (mutated when a train load
     *        is transferred into the yard)
     * @param {object} [terminal] TerminalProps, so flatcar loads can be lifted
     * @returns {'picked'|'dropped'|'none'}
     */
    PortCrane.prototype.toggleGrab = function (units, terminal) {
        if (!this.enabled) return 'none';
        const at = this.spreaderPosition();

        if (this.carried) {
            const spec = this.carried.userData.spec;
            const halfH = spec ? spec.height / 2 : 1.3;

            // Rest on whatever is already underneath.
            let targetY = halfH;
            const self = this;
            units.forEach(function (other) {
                if (other === self.carried) return;
                if (Math.abs(other.position.x - at.x) < 1.8 && Math.abs(other.position.z - at.z) < 4.0) {
                    const otherSpec = other.userData.spec;
                    const top = other.position.y + (otherSpec ? otherSpec.height / 2 : 1.3);
                    if (top + halfH > targetY) targetY = top + halfH;
                }
            });

            const snap = Cargo3D.Constants.GRID.CELL_X;
            this.carried.position.set(
                Math.round(at.x / snap) * snap,
                targetY,
                Math.round(at.z / snap) * snap
            );

            if (units.indexOf(this.carried) === -1) units.push(this.carried);
            this.carried = null;
            if (Cargo3D.Audio) Cargo3D.Audio.lock();
            return 'dropped';
        }

        let closest = null;
        let best = 4.0;
        units.forEach(function (unit) {
            const dist = unit.position.distanceTo(at);
            if (dist < best) { best = dist; closest = unit; }
        });

        // Nothing loose in reach — try lifting off a flatcar instead.
        if (!closest && terminal) {
            const lifted = terminal.liftNearestLoad(at, 6.5);
            if (lifted) {
                this.sceneView.add(lifted);
                closest = lifted;
            }
        }

        if (closest) {
            this.carried = closest;
            if (Cargo3D.Audio) Cargo3D.Audio.lock();
            return 'picked';
        }
        return 'none';
    };

    PortCrane.prototype.dispose = function () {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        this.sceneView.remove(this.group);
    };

    Cargo3D.PortCrane = PortCrane;
})(window);
