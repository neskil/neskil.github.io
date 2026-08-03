(function (window) {
    'use strict';

    // The reach stacker. Drivable in every mode; it can only actually lift and
    // place in sandbox, where it is an alternative to clicking — a mission's
    // queue is the mission and nothing else may put a box in the yard.
    //
    // Physics are now in metres and seconds. The old version added a fixed
    // amount per frame, so the machine was twice as fast on a 120 Hz screen.
    const CY = window.CY = window.CY || {};

    const MAX_SPEED = 9.0;      // m/s
    const ACCEL = 7.0;          // m/s²
    const DRAG = 1.8;           // 1/s
    const STEER_RATE = 1.1;     // rad/s at full speed
    const BOOM_RATE = 0.5;      // rad/s
    const BOOM_MIN = 0.05, BOOM_MAX = 0.65;

    function ReachStacker(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.angle = 0;
        this.speed = 0;
        this.boomAngle = 0.3;
        this.carried = null;        // { pieceId, rot, mesh }
        this.controls = { throttle: 0, steer: 0, boom: 0 };

        this.build();
        this.group.position.set(18, 0, 14);
        scene.add(this.group);
    }

    ReachStacker.prototype.build = function () {
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(3.5, 1.4, 2.2),
            new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4, metalness: 0.5 })
        );
        body.position.y = 1.0;
        body.castShadow = true;

        const counterweight = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 1.6, 2.2),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.7 })
        );
        counterweight.position.set(-1.8, 1.1, 0);
        counterweight.castShadow = true;

        const cab = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 1.2, 1.1),
            new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6, roughness: 0.1 })
        );
        cab.position.set(-0.2, 2.3, 0.45);

        this.group.add(body, counterweight, cab);

        const wheelGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.5, 14);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
        this.wheels = [];
        [[1.2, 1.2], [1.2, -1.2], [-1.2, 1.2], [-1.2, -1.2]].forEach(function (o) {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.rotation.x = Math.PI / 2;
            w.position.set(o[0], 0.65, o[1]);
            w.castShadow = true;
            this.group.add(w);
            this.wheels.push(w);
        }, this);

        this.boom = new THREE.Group();
        this.boom.position.set(-1.2, 2.2, 0);
        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(5.2, 0.5, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.6 })
        );
        arm.position.set(2.6, 0, 0);
        arm.castShadow = true;
        this.boom.add(arm);

        this.spreader = new THREE.Group();
        this.spreader.position.set(5.2, -0.2, 0);
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.3, 2.4),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
        );
        frame.castShadow = true;
        this.spreader.add(frame);
        this.boom.add(this.spreader);
        this.group.add(this.boom);
    };

    ReachStacker.prototype.update = function (delta) {
        const c = this.controls;

        if (c.throttle !== 0) {
            this.speed += ACCEL * c.throttle * delta;
            const cap = c.throttle > 0 ? MAX_SPEED : -MAX_SPEED * 0.5;
            this.speed = c.throttle > 0 ? Math.min(this.speed, cap) : Math.max(this.speed, cap);
        } else {
            const drop = DRAG * delta * MAX_SPEED * 0.35;
            if (Math.abs(this.speed) <= drop) this.speed = 0;
            else this.speed -= Math.sign(this.speed) * drop;
        }

        // Steering only bites when the wheels are turning, like a real one.
        if (c.steer !== 0 && Math.abs(this.speed) > 0.05) {
            const bite = Math.min(1, Math.abs(this.speed) / (MAX_SPEED * 0.5));
            this.angle += c.steer * STEER_RATE * bite * delta * Math.sign(this.speed);
        }

        if (c.boom !== 0) {
            this.boomAngle = Math.max(BOOM_MIN, Math.min(BOOM_MAX, this.boomAngle + c.boom * BOOM_RATE * delta));
            if (Math.random() < delta * 6) CY.audio.hydraulic();
        }
        this.boom.rotation.z = this.boomAngle;

        const p = this.group.position;
        p.x += Math.cos(this.angle) * this.speed * delta;
        p.z -= Math.sin(this.angle) * this.speed * delta;
        p.x = Math.max(-42, Math.min(42, p.x));
        p.z = Math.max(-42, Math.min(42, p.z));
        this.group.rotation.y = this.angle;

        const spin = this.speed * delta * 1.6;
        this.wheels.forEach(function (w) { w.rotation.z += spin; });

        CY.audio.setEngineLoad(Math.abs(this.speed) / MAX_SPEED);

        if (this.carried) {
            const sp = new THREE.Vector3();
            this.spreader.getWorldPosition(sp);
            this.carried.mesh.position.set(sp.x, sp.y - 1.4, sp.z);
            this.carried.mesh.rotation.y = this.angle;
        }
    };

    ReachStacker.prototype.spreaderPosition = function () {
        const v = new THREE.Vector3();
        this.spreader.getWorldPosition(v);
        return v;
    };

    // Space toggles between lifting and setting down.
    ReachStacker.prototype.toggleLift = function () {
        if (CY.state.mode !== 'sandbox') {
            CY.emit('game:message', { text: 'The stacker only lifts in sandbox mode.', tone: 'info' });
            return 'none';
        }
        return this.carried ? this.setDown() : this.lift();
    };

    ReachStacker.prototype.lift = function () {
        const sp = this.spreaderPosition();
        const yard = CY.state.yard;
        let best = null, bestDist = 7.0;

        CY.state.grid.pieces.forEach(function (p) {
            const c = CY.pieces3d.centreOf(p.local, p.origin.x, p.origin.y, p.origin.z, yard);
            const dist = Math.hypot(c.x - sp.x, c.z - sp.z);
            if (dist < bestDist) { bestDist = dist; best = p; }
        });

        if (!best) {
            CY.emit('game:message', { text: 'Nothing within reach of the spreader.', tone: 'info' });
            return 'none';
        }
        const rot = best.rot || 0;
        const pieceId = best.pieceId;
        const entry = CY.game.removePiece(best.id);
        if (!entry) return 'none';   // something was stacked on it; removePiece said so

        CY.game.setSandboxPiece(pieceId);
        CY.state.cursor.rot = rot;
        const mesh = CY.pieces3d.build(pieceId, CY.grid.rotate(CY.piece(pieceId).cells, rot), {});
        this.scene.add(mesh);
        this.carried = { pieceId: pieceId, rot: rot, mesh: mesh };
        CY.audio.clunk();
        return 'lifted';
    };

    ReachStacker.prototype.setDown = function () {
        const sp = this.spreaderPosition();
        const cell = CY.worldToCell(sp.x, sp.z, CY.state.yard);
        CY.game.setCursor(cell.x, cell.z);
        const placed = CY.game.place();
        if (!placed) return 'blocked';

        this.scene.remove(this.carried.mesh);
        CY.render.disposeObject(this.carried.mesh);
        this.carried = null;
        CY.audio.clunk();
        return 'placed';
    };

    CY.ReachStacker = ReachStacker;

})(window);
