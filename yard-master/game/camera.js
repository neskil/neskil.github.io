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
        // Whether the player has taken the camera off its preset — see refit().
        this.userMoved = false;

        const self = this;
        this.controls.addEventListener('start', function () {
            self.transition = null;
            self.userMoved = true;
        });

        this._onResize = function () { self.refit(); };
        window.addEventListener('resize', this._onResize);
        window.addEventListener('orientationchange', this._onResize);
    }

    /**
     * How far back a bounding sphere has to sit to fit on screen.
     *
     * The vertical field of view is fixed, but the horizontal one narrows with
     * the aspect ratio — so on a phone held upright, fitting the vertical one
     * alone (which is what this used to do) frames a bay whose left and right
     * ends are off both edges of the screen. Fit whichever is tighter.
     *
     * The margin is larger in portrait because that is where the HUD costs the
     * most: the top bar and the mission strip own the top of the screen and the
     * control bar the bottom, and none of that is over empty apron.
     */
    CameraRig.prototype.fitRadius = function (sphere) {
        const aspect = this.camera.aspect || 1;
        const vFov = this.camera.fov * Math.PI / 180;
        const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
        const margin = aspect < 0.85 ? 1.24 : 1.08;
        return Math.max(sphere / Math.sin(vFov / 2), sphere / Math.sin(hFov / 2)) * margin;
    };

    /**
     * Size the rig to a bay so every preset frames it sensibly.
     *
     * The default aim is the bay's lower third, because a campaign bay is wider
     * than it is tall and the cargo that matters is near the floor. A bay played
     * from the roof down wants the geometric centre instead: the fit radius is
     * the half-diagonal about the bay's middle, so aiming below it is what puts
     * a piece released at the top tier off the top of the screen.
     *
     * @param {object} bay
     * @param {number} [focusFraction] height of the aim point, 0..1 of the bay
     */
    CameraRig.prototype.frameBay = function (bay, focusFraction) {
        // Both kept so a rotated phone can be re-framed — see refit().
        this.bay = bay;
        this.bayFocus = focusFraction === undefined ? 0.34 : focusFraction;

        const w = bay.cols * C.GRID.CELL_X;
        const d = bay.rows * C.GRID.CELL_Z;
        const h = bay.tiers * C.GRID.TIER_H;

        const sphere = 0.5 * Math.sqrt(w * w + d * d + h * h);
        this.radius = Math.max(16, this.fitRadius(sphere));
        this.focus.set(0, h * this.bayFocus, 0);
    };

    CameraRig.prototype.frameApron = function () {
        this.bay = null;
        this.radius = 46;
        this.focus.set(0, 3, 0);
    };

    /**
     * Re-fit after the viewport changed shape — a phone turned on its side, or
     * a browser window dragged narrow.
     */
    CameraRig.prototype.refit = function () {
        if (!this.bay || this.followTarget) return;
        this.frameBay(this.bay, this.bayFocus);

        /* A camera still sitting on its preset is the rig's to place, so re-run
           that preset at the new aspect — including mid-transition, where the
           destination is what needs correcting rather than the position it
           happens to be passing through. Once the player has orbited or zoomed
           it is theirs, and the most the rig will do is widen. */
        if (!this.userMoved || this.transition) { this.setMode(this.mode); return; }

        const offset = this.camera.position.clone().sub(this.controls.target);
        const r = offset.length();
        if (r < 0.001 || r >= this.radius) return;
        this.camera.position.copy(this.controls.target).add(offset.multiplyScalar(this.radius / r));
    };

    CameraRig.prototype.setMode = function (mode, immediate) {
        this.mode = mode;
        this.followTarget = null;
        this.userMoved = false;

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
