/**
 * render/vehicle.js — the drivable reach stacker.
 *
 * Sandbox toy: WASD to drive, Q/E to tilt the boom, Space to grab or release
 * whatever is under the spreader. Input is gated on `enabled` so the campaign's
 * keyboard shortcuts are not fighting a hidden vehicle for the arrow keys.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};

    function ReachStacker(sceneView) {
        this.sceneView = sceneView;
        this.group = new THREE.Group();
        this.enabled = false;

        this.position = new THREE.Vector3(16, 0, 16);
        this.angle = 0;
        this.speed = 0;
        this.maxSpeed = 14;        // m/s at full throttle
        this.acceleration = 22;
        this.friction = 2.6;
        this.turnRate = 1.5;       // rad/s

        this.boomAngle = 0.3;
        this.carried = null;

        this.keys = { forward: false, backward: false, left: false, right: false, boomUp: false, boomDown: false };

        this.build();
        this.group.visible = false;
        sceneView.add(this.group);
        this.bindKeys();
    }

    ReachStacker.prototype.build = function () {
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(3.6, 1.5, 2.3),
            new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4, metalness: 0.5 })
        );
        body.position.y = 1.05;
        body.castShadow = true;
        this.group.add(body);

        const counterweight = new THREE.Mesh(
            new THREE.BoxGeometry(1.3, 1.7, 2.3),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.7 })
        );
        counterweight.position.set(-1.9, 1.15, 0);
        counterweight.castShadow = true;
        this.group.add(counterweight);

        const cab = new THREE.Mesh(
            new THREE.BoxGeometry(1.3, 1.3, 1.2),
            new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6, roughness: 0.1 })
        );
        cab.position.set(-0.2, 2.4, 0.5);
        this.group.add(cab);

        const beaconMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.2 });
        this.beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.24, 8), beaconMat);
        this.beacon.position.set(-0.2, 3.15, 0.5);
        this.group.add(this.beacon);

        const wheelGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.55, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
        this.wheels = [];
        [[1.25, 1.25], [1.25, -1.25], [-1.25, 1.25], [-1.25, -1.25]].forEach(function (at) {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(at[0], 0.7, at[1]);
            wheel.castShadow = true;
            this.group.add(wheel);
            this.wheels.push(wheel);
        }, this);

        this.boomPivot = new THREE.Group();
        this.boomPivot.position.set(-1.3, 2.3, 0);

        const boom = new THREE.Mesh(
            new THREE.BoxGeometry(5.4, 0.5, 0.62),
            new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.6 })
        );
        boom.position.set(2.7, 0, 0);
        boom.castShadow = true;
        this.boomPivot.add(boom);

        this.spreader = new THREE.Group();
        this.spreader.position.set(5.4, -0.25, 0);
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(0.45, 0.3, 2.5),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
        );
        frame.castShadow = true;
        this.spreader.add(frame);
        this.boomPivot.add(this.spreader);

        this.group.add(this.boomPivot);
        this.group.position.copy(this.position);
    };

    ReachStacker.prototype.bindKeys = function () {
        const self = this;

        function set(e, down) {
            if (!self.enabled) return;
            const k = e.key.toLowerCase();
            if (k === 'w' || k === 'arrowup') self.keys.forward = down;
            else if (k === 's' || k === 'arrowdown') self.keys.backward = down;
            else if (k === 'a' || k === 'arrowleft') self.keys.left = down;
            else if (k === 'd' || k === 'arrowright') self.keys.right = down;
            else if (k === 'q') self.keys.boomUp = down;
            else if (k === 'e') self.keys.boomDown = down;
            else return;
            e.preventDefault();
        }

        this._onKeyDown = function (e) { set(e, true); };
        this._onKeyUp = function (e) { set(e, false); };
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    };

    ReachStacker.prototype.setEnabled = function (enabled) {
        this.enabled = enabled;
        this.group.visible = enabled;
        if (!enabled) {
            this.keys = { forward: false, backward: false, left: false, right: false, boomUp: false, boomDown: false };
            this.speed = 0;
            this.carried = null;
        }
    };

    ReachStacker.prototype.update = function (delta) {
        if (!this.enabled) return;
        const dt = Math.min(delta, 0.05);

        if (this.keys.forward) {
            this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration * dt);
            if (Cargo3D.Audio) Cargo3D.Audio.engine();
        } else if (this.keys.backward) {
            this.speed = Math.max(-this.maxSpeed * 0.5, this.speed - this.acceleration * dt);
            if (Cargo3D.Audio) Cargo3D.Audio.engine();
        } else {
            this.speed -= this.speed * Math.min(1, this.friction * dt);
            if (Math.abs(this.speed) < 0.02) this.speed = 0;
        }

        const steer = this.speed >= 0 ? 1 : -1;
        if (this.keys.left) this.angle += this.turnRate * dt * steer;
        if (this.keys.right) this.angle -= this.turnRate * dt * steer;

        if (this.keys.boomUp) {
            this.boomAngle = Math.min(0.7, this.boomAngle + 0.9 * dt);
            if (Cargo3D.Audio) Cargo3D.Audio.hydraulic();
        }
        if (this.keys.boomDown) {
            this.boomAngle = Math.max(0.04, this.boomAngle - 0.9 * dt);
            if (Cargo3D.Audio) Cargo3D.Audio.hydraulic();
        }
        this.boomPivot.rotation.z = this.boomAngle;

        this.position.x += Math.cos(this.angle) * this.speed * dt;
        this.position.z -= Math.sin(this.angle) * this.speed * dt;
        this.position.x = Math.max(-52, Math.min(52, this.position.x));
        this.position.z = Math.max(-52, Math.min(52, this.position.z));

        this.group.position.copy(this.position);
        this.group.rotation.y = this.angle;

        const spin = this.speed * dt * 1.6;
        this.wheels.forEach(function (w) { w.rotation.z += spin; });
        this.beacon.rotation.y += dt * 6;

        if (this.carried) {
            const at = new THREE.Vector3();
            this.spreader.getWorldPosition(at);
            this.carried.position.set(at.x, at.y - 1.4, at.z);
            this.carried.rotation.y = this.angle;
        }
    };

    /** Spreader position in world space. */
    ReachStacker.prototype.spreaderPosition = function (target) {
        const out = target || new THREE.Vector3();
        this.spreader.getWorldPosition(out);
        return out;
    };

    /**
     * Grab the nearest loose unit, or set down the one being carried.
     * @param {THREE.Group[]} candidates loose meshes in the scene
     * @returns {'picked'|'dropped'|'none'}
     */
    ReachStacker.prototype.toggleGrab = function (candidates) {
        const at = this.spreaderPosition();

        if (this.carried) {
            const spec = this.carried.userData.spec;
            this.carried.position.set(at.x, Math.max(spec ? spec.height / 2 : 1.3, at.y - 1.4), at.z);
            this.carried = null;
            if (Cargo3D.Audio) Cargo3D.Audio.lock();
            return 'dropped';
        }

        let closest = null;
        let best = 4.5;
        candidates.forEach(function (mesh) {
            const dist = mesh.position.distanceTo(at);
            if (dist < best) { best = dist; closest = mesh; }
        });

        if (closest) {
            this.carried = closest;
            if (Cargo3D.Audio) Cargo3D.Audio.lock();
            return 'picked';
        }
        return 'none';
    };

    ReachStacker.prototype.dispose = function () {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        this.sceneView.remove(this.group);
    };

    Cargo3D.ReachStacker = ReachStacker;
})(window);
