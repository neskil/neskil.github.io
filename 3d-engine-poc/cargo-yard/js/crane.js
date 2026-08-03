(function (window) {
    'use strict';

    // Rail-mounted gantry crane (RMG) spanning the rail siding and the pad.
    // The structure, the trolley, the four-cable hoist and the alignment laser
    // came from a parallel session's simulator branch. What changed here: it
    // runs on delta time, takes its input from `input.js` like every other
    // actor, and lifts and sets down *through the occupancy grid* rather than
    // moving meshes around behind the game's back.
    const CY = window.CY = window.CY || {};

    const BRIDGE_Y = 16.2;
    const GANTRY_SPEED = 7.0;    // m/s along the rails (z)
    const TROLLEY_SPEED = 6.0;   // m/s across the bridge (x)
    const HOIST_SPEED = 4.0;     // m/s
    const TROLLEY_MIN = -34, TROLLEY_MAX = 20;
    const HOIST_MIN = 1.5, HOIST_MAX = 14.0;
    const RAIL_MIN = -30, RAIL_MAX = 30;

    function PortCrane(scene) {
        this.scene = scene;
        this.group = new THREE.Group();

        // Parked clear of the pad and over the siding, so it does not sit
        // across the default camera's view of the yard.
        this.zPos = -20;
        this.trolleyX = -32;
        this.hoistY = 12.0;
        this.carried = null;         // { pieceId, rot, mesh }
        this.controls = { rail: 0, trolley: 0, hoist: 0 };

        this.buildGantry();
        this.buildTrolley();
        this.buildLaser();
        this.updateHoistVisuals();
        scene.add(this.group);
    }

    PortCrane.prototype.buildGantry = function () {
        const steel = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.7 });
        const accent = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4, metalness: 0.5 });
        const dark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

        // The span now reaches from the siding right across the pad, because
        // the pad is where the game happens — the original stopped at x = -12.
        const legGeo = new THREE.BoxGeometry(1.2, 16, 2.4);
        const bogieGeo = new THREE.BoxGeometry(2.0, 1.0, 4.0);
        [-35, 21].forEach(function (x) {
            const leg = new THREE.Mesh(legGeo, steel);
            leg.position.set(x, 8, 0);
            leg.castShadow = true;
            this.group.add(leg);

            const bogie = new THREE.Mesh(bogieGeo, dark);
            bogie.position.set(x, 0.5, 0);
            bogie.castShadow = true;
            this.group.add(bogie);
        }, this);

        const beam = new THREE.Mesh(new THREE.BoxGeometry(57, 1.8, 2.6), steel);
        beam.position.set(-7, BRIDGE_Y + 0.3, 0);
        beam.castShadow = true;
        this.group.add(beam);

        const stripe = new THREE.Mesh(new THREE.BoxGeometry(56.5, 0.2, 2.7), accent);
        stripe.position.set(-7, BRIDGE_Y - 0.7, 0);
        this.group.add(stripe);

        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 2.0, 2.2),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
        );
        cabin.position.set(-20, BRIDGE_Y - 1.0, 1.5);
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

        const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 6);
        const cableMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
        this.cables = [];
        [[-1.0, 1.0], [1.0, 1.0], [-1.0, -1.0], [1.0, -1.0]].forEach(function (o) {
            const cable = new THREE.Mesh(cableGeo, cableMat);
            this.trolley.add(cable);
            this.cables.push({ mesh: cable, ox: o[0], oz: o[1] });
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
        [[-1.1, -0.1, -2.8], [1.1, -0.1, -2.8], [-1.1, -0.1, 2.8], [1.1, -0.1, 2.8]].forEach(function (p) {
            const lock = new THREE.Mesh(lockGeo, lockMat);
            lock.position.set(p[0], p[1], p[2]);
            this.spreader.add(lock);
        }, this);

        this.trolley.add(this.spreader);
        this.group.add(this.trolley);
    };

    PortCrane.prototype.buildLaser = function () {
        // The targeting beam is what makes an overhead crane usable at all:
        // from up on the bridge you cannot judge what the spreader is over.
        this.laser = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.15, 15, 8),
            new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.35 })
        );
        this.spreader.add(this.laser);
    };

    PortCrane.prototype.updateHoistVisuals = function () {
        const drop = BRIDGE_Y - this.hoistY;
        this.spreader.position.set(0, -drop, 0);
        this.cables.forEach(function (c) {
            c.mesh.scale.y = Math.max(0.01, drop);
            c.mesh.position.set(c.ox, -drop / 2, c.oz);
        });
        if (this.laser) {
            this.laser.scale.y = this.hoistY / 15.0;
            this.laser.position.set(0, -this.hoistY / 2, 0);
        }
    };

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    PortCrane.prototype.update = function (delta) {
        const c = this.controls;
        let moving = false;

        if (c.rail) {
            this.zPos = clamp(this.zPos + c.rail * GANTRY_SPEED * delta, RAIL_MIN, RAIL_MAX);
            this.group.position.z = this.zPos;
            moving = true;
        }
        if (c.trolley) {
            this.trolleyX = clamp(this.trolleyX + c.trolley * TROLLEY_SPEED * delta, TROLLEY_MIN, TROLLEY_MAX);
            this.trolley.position.x = this.trolleyX;
            moving = true;
        }
        if (c.hoist) {
            this.hoistY = clamp(this.hoistY + c.hoist * HOIST_SPEED * delta, HOIST_MIN, HOIST_MAX);
            this.updateHoistVisuals();
            moving = true;
        }
        if (moving && Math.random() < delta * 4) CY.audio.hydraulic();

        if (this.carried) {
            const p = this.spreaderPosition();
            this.carried.mesh.position.set(p.x, p.y - 1.6, p.z);
        }
    };

    PortCrane.prototype.spreaderPosition = function () {
        const v = new THREE.Vector3();
        this.spreader.getWorldPosition(v);
        return v;
    };

    // Same contract as the reach stacker: everything goes through the grid,
    // so the crane cannot create a stack the rules would have refused.
    PortCrane.prototype.toggleLift = function () {
        if (CY.state.mode !== 'sandbox') {
            CY.emit('game:message', { text: 'The gantry only lifts in sandbox mode.', tone: 'info' });
            return 'none';
        }
        return this.carried ? this.setDown() : this.lift();
    };

    PortCrane.prototype.lift = function () {
        const sp = this.spreaderPosition();
        const yard = CY.state.yard;
        let best = null, bestDist = 6.0;
        CY.state.grid.pieces.forEach(function (p) {
            const c = CY.pieces3d.centreOf(p.local, p.origin.x, p.origin.y, p.origin.z, yard);
            const dist = Math.hypot(c.x - sp.x, c.z - sp.z);
            if (dist < bestDist) { bestDist = dist; best = p; }
        });
        if (!best) {
            CY.emit('game:message', { text: 'Nothing under the spreader.', tone: 'info' });
            return 'none';
        }
        const rot = best.rot || 0;
        const pieceId = best.pieceId;
        if (!CY.game.removePiece(best.id)) return 'none';  // something is stacked on it

        CY.game.setSandboxPiece(pieceId);
        CY.state.cursor.rot = rot;
        const mesh = CY.pieces3d.build(pieceId, CY.grid.rotate(CY.piece(pieceId).cells, rot), {});
        this.scene.add(mesh);
        this.carried = { pieceId: pieceId, rot: rot, mesh: mesh };
        CY.audio.clunk();
        return 'lifted';
    };

    PortCrane.prototype.setDown = function () {
        const sp = this.spreaderPosition();
        const cell = CY.worldToCell(sp.x, sp.z, CY.state.yard);
        CY.game.setCursor(cell.x, cell.z);
        if (!CY.game.place()) return 'blocked';

        this.scene.remove(this.carried.mesh);
        CY.render.disposeObject(this.carried.mesh);
        this.carried = null;
        CY.audio.clunk();
        return 'placed';
    };

    CY.PortCrane = PortCrane;

})(window);
