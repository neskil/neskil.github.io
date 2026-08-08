/**
 * render/skyline.js — the port on the horizon.
 *
 * The apron stops at 60 m and the sky dome starts at 300, which left a ring of
 * nothing in between and made the yard read as a slab floating in a gradient.
 * This fills it: ship-to-shore cranes, a container vessel, sheds, a tank farm,
 * a city cluster and a lighthouse, arranged around the yard at a distance no
 * player ever reaches.
 *
 * Everything is one unlit material. These are silhouettes — they carry no
 * detail, take no light and cast no shadow, and the weather recolours the lot
 * by setting a single colour. That also means the whole ring is a handful of
 * draw calls, which is the only reason it can afford to be this big.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};

    /** Deterministic noise — the port should be the same port every load. */
    function rng(seed) {
        let s = (seed >>> 0) || 1;
        return function () {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 4294967296;
        };
    }

    function Skyline(sceneView) {
        this.sceneView = sceneView;
        this.root = new THREE.Group();

        /* Unlit, and out of the fog. Fog at these distances would collapse
           every silhouette into one flat wall of fog colour; the preset's tint
           is the haze, applied by hand so it stays readable. */
        this.material = new THREE.MeshBasicMaterial({ color: 0x2f4159, fog: false });
        this.parts = [];

        this.build();
        this.bake();
        this.root.renderOrder = -1;
        sceneView.add(this.root);
    }

    /**
     * Collapse the whole port into a single mesh.
     *
     * A hundred silhouettes is a hundred draw calls on every frame of every
     * mode, which is more than the yard itself costs — and none of it ever
     * moves. Baking each part's world transform into its vertices and
     * concatenating them makes the entire horizon one call.
     *
     * Positions only: the material is unlit, so normals and UVs would be
     * uploaded and never read.
     */
    Skyline.prototype.bake = function () {
        this.root.updateMatrixWorld(true);

        const chunks = [];
        let total = 0;
        this.root.traverse(function (child) {
            if (!child.isMesh) return;
            const geo = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
            geo.applyMatrix4(child.matrixWorld);
            const pos = geo.attributes.position.array;
            chunks.push(pos);
            total += pos.length;
            geo.dispose();
        });

        const merged = new Float32Array(total);
        let at = 0;
        chunks.forEach(function (pos) { merged.set(pos, at); at += pos.length; });

        this.parts.forEach(function (mesh) { mesh.geometry.dispose(); });
        this.parts.length = 0;
        while (this.root.children.length) this.root.remove(this.root.children[0]);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(merged, 3));
        this.merged = new THREE.Mesh(geometry, this.material);
        this.merged.frustumCulled = false;   // it surrounds the camera by design
        this.root.add(this.merged);
    };

    /** Add a box in the group's own space, sized and centred like a BoxGeometry. */
    Skyline.prototype.box = function (w, h, d, x, y, z, ry) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.material);
        mesh.position.set(x, y, z);
        if (ry) mesh.rotation.y = ry;
        this.parts.push(mesh);
        return mesh;
    };

    /**
     * A ship-to-shore gantry: legs, a portal beam, the boom reaching out over
     * the water and the counterweight arm behind it. Read at 200 m this is four
     * verticals and two horizontals, which is exactly how a real one reads.
     */
    Skyline.prototype.craneAt = function (group, x, z, scale, facing) {
        const s = scale;
        const leg = 34 * s;
        const span = 22 * s;
        const g = new THREE.Group();

        [-1, 1].forEach(function (sx) {
            [-1, 1].forEach(function (sz) {
                const post = this.box(1.6 * s, leg, 1.6 * s, sx * span / 2, leg / 2, sz * 6 * s);
                g.add(post);
            }, this);
        }, this);

        g.add(this.box(span + 3 * s, 2.6 * s, 14 * s, 0, leg, 0));                 // portal beam
        g.add(this.box(46 * s, 1.8 * s, 2.4 * s, 16 * s, leg + 7 * s, 0));         // boom, over the water
        g.add(this.box(18 * s, 1.8 * s, 2.4 * s, -16 * s, leg + 7 * s, 0));        // counterweight arm
        g.add(this.box(6 * s, 5 * s, 6 * s, -22 * s, leg + 4 * s, 0));             // machinery house
        // A-frame back to the boom, the shape that makes a gantry a gantry.
        g.add(this.box(1.4 * s, 16 * s, 1.4 * s, -2 * s, leg + 8 * s, 0));

        g.position.set(x, 0, z);
        g.rotation.y = facing;
        group.add(g);
    };

    /** A container vessel: hull, deckhouse, funnel and a deck stack of boxes. */
    Skyline.prototype.shipAt = function (group, x, z, scale, facing) {
        const s = scale;
        const g = new THREE.Group();

        g.add(this.box(120 * s, 9 * s, 18 * s, 0, 4.5 * s, 0));      // hull
        g.add(this.box(104 * s, 4 * s, 16 * s, 2 * s, 11 * s, 0));   // deck
        g.add(this.box(12 * s, 16 * s, 14 * s, -44 * s, 21 * s, 0)); // deckhouse
        g.add(this.box(4 * s, 8 * s, 4 * s, -47 * s, 33 * s, 0));    // funnel
        g.add(this.box(2 * s, 22 * s, 2 * s, 54 * s, 24 * s, 0));    // foremast

        // Deck cargo, in bays of decreasing height toward the bow.
        const rand = rng(4711);
        for (let i = 0; i < 9; i++) {
            const bx = -30 * s + i * 10 * s;
            const h = (10 + rand() * 12) * s;
            g.add(this.box(8 * s, h, 15 * s, bx, 13 * s + h / 2, 0));
        }

        g.position.set(x, 0, z);
        g.rotation.y = facing;
        group.add(g);
    };

    Skyline.prototype.build = function () {
        const rand = rng(20260808);

        /* Water side: the berth. Cranes in a row along one edge with ships
           alongside, angled so the yard reads as sitting behind a quay.

           Everything here is far enough out to subtend only a few degrees. The
           whole point is a band of detail sitting on the horizon — brought any
           closer, the port stops being scenery and starts being a wall. */
        const berth = new THREE.Group();
        for (let i = 0; i < 6; i++) {
            this.craneAt(berth, -150 + i * 60, 0, 0.9 + rand() * 0.2, 0);
        }
        berth.position.set(-20, 0, -360);
        this.root.add(berth);

        this.shipAt(this.root, -80, -410, 1.0, 0.05);
        this.shipAt(this.root, 190, -395, 0.78, -0.30);

        // A second berth off to one side, further out again.
        const farBerth = new THREE.Group();
        for (let i = 0; i < 4; i++) {
            this.craneAt(farBerth, -70 + i * 56, 0, 0.7, Math.PI / 2);
        }
        farBerth.position.set(-420, 0, -70);
        this.root.add(farBerth);

        /* Land side: sheds, tanks and the town, low and busy so the eye reads
           depth rather than a wall. */
        for (let i = 0; i < 22; i++) {
            const a = Math.PI * (0.08 + rand() * 0.84);          // the +Z half
            const r = 300 + rand() * 90;
            const w = 26 + rand() * 54;
            const h = 7 + rand() * 11;
            this.root.add(this.box(w, h, 18 + rand() * 30,
                Math.cos(a) * r, h / 2, Math.sin(a) * r, rand() * Math.PI));
        }

        // Tank farm.
        for (let i = 0; i < 11; i++) {
            const a = Math.PI * (0.60 + rand() * 0.32);
            const r = 320 + rand() * 60;
            const h = 8 + rand() * 7;
            const tank = new THREE.Mesh(
                new THREE.CylinderGeometry(6 + rand() * 5, 6 + rand() * 5, h, 10),
                this.material
            );
            tank.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
            this.parts.push(tank);
            this.root.add(tank);
        }

        /* Town, behind everything. Heights are squared-random so most of it is
           low and a handful of towers stand out — a flat band of equal-height
           blocks reads as a fence, not a city. */
        for (let i = 0; i < 34; i++) {
            const a = Math.PI * (0.04 + rand() * 0.92);
            const r = 380 + rand() * 80;
            const h = 12 + rand() * rand() * 54;
            this.root.add(this.box(14 + rand() * 22, h, 14 + rand() * 22,
                Math.cos(a) * r, h / 2, Math.sin(a) * r, rand() * Math.PI));
        }

        // Chimneys, for a couple of verticals nothing else provides.
        [[-300, 300], [-360, 250], [330, 300]].forEach(function (at) {
            const h = 60 + rand() * 30;
            const stack = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 4, h, 8), this.material);
            stack.position.set(at[0], h / 2, at[1]);
            this.parts.push(stack);
            this.root.add(stack);
        }, this);

        // Lighthouse, on the seaward corner — the one thing with a silhouette
        // you can name from any angle.
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 5, 34, 10), this.material);
        tower.position.set(330, 17, -280);
        this.parts.push(tower);
        this.root.add(tower);
        this.root.add(this.box(9, 4, 9, 330, 36, -280));

        // A far breakwater, so the water side has a hard edge.
        this.root.add(this.box(820, 3, 12, -30, 1.5, -470));
    };

    /**
     * Tint the whole ring. The weather's haze colour is the only thing that
     * distinguishes the port at dawn from the port at midnight.
     *
     * @param {number} hex
     */
    Skyline.prototype.setTint = function (hex) {
        this.material.color.setHex(hex);
    };

    Skyline.prototype.setVisible = function (visible) {
        this.root.visible = visible;
    };

    Skyline.prototype.dispose = function () {
        if (this.merged) this.merged.geometry.dispose();
        this.parts.forEach(function (mesh) { mesh.geometry.dispose(); });
        this.material.dispose();
        this.sceneView.remove(this.root);
    };

    Cargo3D.Skyline = Skyline;
})(window);
