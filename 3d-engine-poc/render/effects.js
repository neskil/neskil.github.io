/**
 * render/effects.js — small, cheap feedback flourishes.
 *
 * A pooled set of expanding rings for lock-in, and a one-off spark burst for a
 * completed mission. Nothing here allocates during play.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};

    const RING_POOL = 8;
    const SPARK_COUNT = 140;

    function Effects(sceneView) {
        this.sceneView = sceneView;
        this.rings = [];

        const geo = new THREE.RingGeometry(0.7, 1.0, 28);
        for (let i = 0; i < RING_POOL; i++) {
            const ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
                color: 0x38bdf8, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false
            }));
            ring.rotation.x = -Math.PI / 2;
            ring.visible = false;
            ring.userData = { life: 0, ttl: 0.7, scale: 6 };
            sceneView.add(ring);
            this.rings.push(ring);
        }

        this.buildSparks();
    }

    Effects.prototype.buildSparks = function () {
        const positions = new Float32Array(SPARK_COUNT * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        this.sparkVel = new Float32Array(SPARK_COUNT * 3);
        this.sparkGeo = geo;
        this.sparks = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0xfbbf24, size: 0.45, transparent: true, opacity: 0, depthWrite: false
        }));
        this.sparks.visible = false;
        this.sparkLife = 0;
        this.sceneView.add(this.sparks);
    };

    /** Expanding ring on the ground under a lock-in. */
    Effects.prototype.ring = function (x, y, z, colorHex) {
        for (let i = 0; i < this.rings.length; i++) {
            const ring = this.rings[i];
            if (ring.visible) continue;
            ring.position.set(x, y + 0.06, z);
            ring.scale.set(1, 1, 1);
            ring.material.color.setHex(colorHex === undefined ? 0x38bdf8 : colorHex);
            ring.material.opacity = 0.85;
            ring.userData.life = 0;
            ring.visible = true;
            return;
        }
    };

    /** Celebratory burst, used on the scorecard reveal. */
    Effects.prototype.burst = function (x, y, z, colorHex) {
        const pos = this.sparkGeo.attributes.position.array;
        for (let i = 0; i < SPARK_COUNT; i++) {
            pos[i * 3] = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.5;
            const speed = 6 + Math.random() * 12;
            this.sparkVel[i * 3] = Math.cos(theta) * Math.cos(phi) * speed;
            this.sparkVel[i * 3 + 1] = Math.sin(phi) * speed + 4;
            this.sparkVel[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * speed;
        }
        this.sparkGeo.attributes.position.needsUpdate = true;
        this.sparks.material.color.setHex(colorHex === undefined ? 0xfbbf24 : colorHex);
        this.sparks.material.opacity = 1;
        this.sparks.visible = true;
        this.sparkLife = 0;
    };

    Effects.prototype.update = function (delta) {
        const dt = Math.min(delta, 0.05);

        for (let i = 0; i < this.rings.length; i++) {
            const ring = this.rings[i];
            if (!ring.visible) continue;
            ring.userData.life += dt;
            const t = ring.userData.life / ring.userData.ttl;
            if (t >= 1) { ring.visible = false; ring.material.opacity = 0; continue; }
            const s = 1 + t * ring.userData.scale;
            ring.scale.set(s, s, s);
            ring.material.opacity = 0.85 * (1 - t);
        }

        if (this.sparks.visible) {
            this.sparkLife += dt;
            const pos = this.sparkGeo.attributes.position.array;
            for (let i = 0; i < SPARK_COUNT; i++) {
                this.sparkVel[i * 3 + 1] -= 22 * dt;
                pos[i * 3] += this.sparkVel[i * 3] * dt;
                pos[i * 3 + 1] += this.sparkVel[i * 3 + 1] * dt;
                pos[i * 3 + 2] += this.sparkVel[i * 3 + 2] * dt;
            }
            this.sparkGeo.attributes.position.needsUpdate = true;
            this.sparks.material.opacity = Math.max(0, 1 - this.sparkLife / 2.2);
            if (this.sparkLife > 2.2) this.sparks.visible = false;
        }
    };

    Cargo3D.Effects = Effects;
})(window);
