/**
 * render/terminal.js — the intermodal props: rail track, freight train, semi.
 *
 * Scenery for sandbox mode. The train also acts as a container source: the
 * sandbox's "Unload Train" tool pulls a unit off a flatcar and hands it to the
 * caller to spawn in the yard.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const Meshes = Cargo3D.ContainerMeshes;

    const RAIL_X = -34;
    const TRUCK_X = 30;

    function TerminalProps(sceneView) {
        this.sceneView = sceneView;
        this.root = new THREE.Group();
        this.flatcarLoads = [];

        this.buildTrack();
        this.buildTrain();
        this.buildTruck();

        sceneView.add(this.root);
    }

    TerminalProps.prototype.buildTrack = function () {
        const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
        const tieMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });

        const railGeo = new THREE.BoxGeometry(0.12, 0.2, 100);
        [-0.8, 0.8].forEach(function (offset) {
            const rail = new THREE.Mesh(railGeo, railMat);
            rail.position.set(RAIL_X + offset, 0.14, 0);
            this.root.add(rail);
        }, this);

        const tieGeo = new THREE.BoxGeometry(2.6, 0.12, 0.4);
        for (let z = -48; z <= 48; z += 1.4) {
            const tie = new THREE.Mesh(tieGeo, tieMat);
            tie.position.set(RAIL_X, 0.06, z);
            tie.receiveShadow = true;
            this.root.add(tie);
        }
    };

    TerminalProps.prototype.buildTrain = function () {
        const loco = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.7 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 11), bodyMat);
        body.position.y = 2.1;
        body.castShadow = true;
        loco.add(body);

        const cab = new THREE.Mesh(
            new THREE.BoxGeometry(2.65, 1.1, 3.0),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.5 })
        );
        cab.position.set(0, 3.4, -2.8);
        loco.add(cab);

        const stack = new THREE.Mesh(
            new THREE.CylinderGeometry(0.32, 0.4, 0.7, 10),
            new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 })
        );
        stack.position.set(0, 4.0, 2.4);
        loco.add(stack);

        loco.position.set(RAIL_X, 0, -30);
        this.root.add(loco);

        const carriers = ['maersk', 'evergreen', 'hapag', 'cosco'];
        for (let i = 0; i < 4; i++) {
            const flatcar = new THREE.Group();

            const bed = new THREE.Mesh(
                new THREE.BoxGeometry(2.6, 0.4, 13.5),
                new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.4 })
            );
            bed.position.y = 0.75;
            bed.castShadow = true;
            flatcar.add(bed);

            const bogieMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 });
            [-5, 5].forEach(function (z) {
                const bogie = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 2.2), bogieMat);
                bogie.position.set(0, 0.35, z);
                flatcar.add(bogie);
            });

            const load = Meshes.createUnitMesh('40ft', carriers[i % carriers.length], []);
            load.rotation.y = Math.PI / 2;
            load.position.set(0, 2.4, 0);
            flatcar.add(load);
            this.flatcarLoads.push({ mesh: load, carrier: carriers[i % carriers.length] });

            flatcar.position.set(RAIL_X, 0, -14 + i * 15);
            this.root.add(flatcar);
        }
    };

    TerminalProps.prototype.buildTruck = function () {
        const truck = new THREE.Group();

        const cab = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 2.9, 3.6),
            new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.6 })
        );
        cab.position.set(0, 1.9, -7);
        cab.castShadow = true;
        truck.add(cab);

        const glass = new THREE.Mesh(
            new THREE.BoxGeometry(2.3, 0.9, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.55, roughness: 0.1 })
        );
        glass.position.set(0, 2.7, -8.8);
        truck.add(glass);

        const trailer = new THREE.Mesh(
            new THREE.BoxGeometry(2.6, 0.35, 13),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4 })
        );
        trailer.position.set(0, 1.0, 2);
        trailer.castShadow = true;
        truck.add(trailer);

        const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.42, 14);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
        [-8, -6.4, 5.5, 6.9].forEach(function (z) {
            [-1.25, 1.25].forEach(function (x) {
                const wheel = new THREE.Mesh(wheelGeo, wheelMat);
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(x, 0.55, z);
                truck.add(wheel);
            });
        });

        const load = Meshes.createUnitMesh('40ft', 'msc', []);
        load.rotation.y = Math.PI / 2;
        load.position.set(0, 2.6, 2);
        truck.add(load);

        truck.position.set(TRUCK_X, 0, 4);
        truck.rotation.y = Math.PI;
        this.root.add(truck);
    };

    /**
     * Detach the flatcar load nearest a world point and hand the mesh over, in
     * world space, for a crane to carry. Returns null when nothing is in reach.
     *
     * @param {THREE.Vector3} at
     * @param {number} radius
     * @returns {THREE.Group|null}
     */
    TerminalProps.prototype.liftNearestLoad = function (at, radius) {
        let bestIndex = -1;
        let best = radius === undefined ? 6 : radius;
        const world = new THREE.Vector3();

        for (let i = 0; i < this.flatcarLoads.length; i++) {
            this.flatcarLoads[i].mesh.getWorldPosition(world);
            const dist = world.distanceTo(at);
            if (dist < best) { best = dist; bestIndex = i; }
        }

        if (bestIndex === -1) return null;

        const entry = this.flatcarLoads.splice(bestIndex, 1)[0];
        entry.mesh.getWorldPosition(world);
        if (entry.mesh.parent) entry.mesh.parent.remove(entry.mesh);
        entry.mesh.position.copy(world);
        entry.mesh.rotation.set(0, 0, 0);
        return entry.mesh;
    };

    /**
     * Take the next 40ft off the train.
     * @returns {{carrier:string}|null} null once the train is empty
     */
    TerminalProps.prototype.takeFromTrain = function () {
        const entry = this.flatcarLoads.pop();
        if (!entry) return null;
        if (entry.mesh.parent) entry.mesh.parent.remove(entry.mesh);
        Meshes.disposeGroup(entry.mesh);
        return { carrier: entry.carrier };
    };

    TerminalProps.prototype.remaining = function () {
        return this.flatcarLoads.length;
    };

    TerminalProps.prototype.setVisible = function (visible) {
        this.root.visible = visible;
    };

    Cargo3D.TerminalProps = TerminalProps;
})(window);
