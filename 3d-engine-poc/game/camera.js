/**
 * game/camera.js — named camera rigs with smooth transitions.
 *
 * Presets set a destination; update() eases toward it and hands control back to
 * OrbitControls the moment the player touches the mouse.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const C = Cargo3D.Constants;

    const DIRECTIONS = {
        orbit: new THREE.Vector3(0.95, 0.62, 1.25),
        iso:   new THREE.Vector3(1.0, 0.92, 1.0),
        top:   new THREE.Vector3(0.001, 1.0, 0.22),
        front: new THREE.Vector3(0.0, 0.42, 1.0)
    };

    function CameraRig(sceneView) {
        this.sceneView = sceneView;
        this.camera = sceneView.camera;
        this.controls = sceneView.controls;
        this.mode = 'orbit';
        this.radius = 30;
        this.focus = new THREE.Vector3(0, 3, 0);
        this.transition = null;
        this.followTarget = null;

        const self = this;
        this.controls.addEventListener('start', function () { self.transition = null; });
    }

    /** Size the rig to a bay so every preset frames it sensibly. */
    CameraRig.prototype.frameBay = function (bay) {
        const w = bay.cols * C.GRID.CELL_X;
        const d = bay.rows * C.GRID.CELL_Z;
        const h = bay.tiers * C.GRID.TIER_H;

        // Fit the bay's bounding sphere to the vertical field of view, with a
        // little margin so the HUD panels do not crowd the corners.
        const fov = this.camera.fov * Math.PI / 180;
        const sphere = 0.5 * Math.sqrt(w * w + d * d + h * h);
        this.radius = Math.max(16, (sphere / Math.sin(fov / 2)) * 1.08);
        this.focus.set(0, h * 0.34, 0);
    };

    CameraRig.prototype.frameApron = function () {
        this.radius = 46;
        this.focus.set(0, 3, 0);
    };

    CameraRig.prototype.setMode = function (mode, immediate) {
        this.mode = mode;
        this.followTarget = null;

        if (mode === 'vehicle') return; // driven by follow()

        const dir = (DIRECTIONS[mode] || DIRECTIONS.orbit).clone().normalize();
        const to = dir.multiplyScalar(this.radius).add(this.focus);

        if (immediate) {
            this.camera.position.copy(to);
            this.controls.target.copy(this.focus);
            this.controls.update();
            this.transition = null;
        } else {
            this.transition = {
                fromPos: this.camera.position.clone(),
                toPos: to,
                fromTarget: this.controls.target.clone(),
                toTarget: this.focus.clone(),
                t: 0,
                duration: 0.65
            };
        }
    };

    /**
     * Keep a growing stack in frame. The tower challenge calls this every frame,
     * so it eases rather than cuts, and it only ever rises and pulls back —
     * a camera that crept back down every time a container settled would be
     * unwatchable. Yields entirely while a preset transition or a chase is live;
     * the player can still orbit and zoom underneath it.
     *
     * @param {number} topY height of the tallest container, in metres
     */
    CameraRig.prototype.trackStack = function (topY, delta) {
        if (this.transition || this.followTarget) return;

        const target = this.controls.target;
        const wantY = Math.max(3, topY * 0.5);

        if (wantY > target.y + 0.01) {
            const dy = (wantY - target.y) * Math.min(1, delta * 1.2);
            target.y += dy;
            this.camera.position.y += dy;
            this.focus.y = target.y;
        }

        // Pull back far enough that the whole stack still fits the vertical FOV.
        const fov = this.camera.fov * Math.PI / 180;
        const wantR = Math.max(46, (topY * 0.62) / Math.tan(fov / 2) + 18);
        const offset = this.camera.position.clone().sub(target);
        const r = offset.length();

        if (wantR > r && r > 0.001) {
            offset.multiplyScalar(Math.min(wantR, r + delta * 16) / r);
            this.camera.position.copy(target).add(offset);
        }
        if (wantR > this.radius) this.radius = wantR;
    };

    /** Chase camera for the reach stacker. */
    CameraRig.prototype.follow = function (vehicle) {
        this.mode = 'vehicle';
        this.followTarget = vehicle;
        this.transition = null;
    };

    CameraRig.prototype.update = function (delta) {
        if (this.followTarget) {
            const v = this.followTarget;
            const behind = 15;
            const desired = new THREE.Vector3(
                v.position.x - Math.cos(v.angle) * behind,
                v.position.y + 9,
                v.position.z + Math.sin(v.angle) * behind
            );
            this.camera.position.lerp(desired, Math.min(1, delta * 4));
            this.controls.target.lerp(
                new THREE.Vector3(v.position.x, v.position.y + 2.4, v.position.z),
                Math.min(1, delta * 6)
            );
            return;
        }

        const tr = this.transition;
        if (!tr) return;

        tr.t += delta;
        const k = Math.min(1, tr.t / tr.duration);
        const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

        this.camera.position.lerpVectors(tr.fromPos, tr.toPos, eased);
        this.controls.target.lerpVectors(tr.fromTarget, tr.toTarget, eased);

        if (k >= 1) this.transition = null;
    };

    Cargo3D.CameraRig = CameraRig;
})(window);
