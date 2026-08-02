(function(window) {
    'use strict';

    window.Cargo3D = window.Cargo3D || {};

    function IntermodalTerminal(scene) {
        this.scene = scene;
        this.trainGroup = new THREE.Group();
        this.truckGroup = new THREE.Group();
        this.trainContainers = [];

        this.buildRailTrack();
        this.buildTrain();
        this.buildSemiTruck();
    }

    IntermodalTerminal.prototype.buildRailTrack = function() {
        // Steel Rail Tracks at X = -32
        const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
        const tieMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });

        const railGeo = new THREE.BoxGeometry(0.12, 0.2, 80);
        const railLeft = new THREE.Mesh(railGeo, railMat);
        railLeft.position.set(-32.8, 0.1, 0);
        const railRight = new THREE.Mesh(railGeo, railMat);
        railRight.position.set(-31.2, 0.1, 0);
        this.scene.add(railLeft);
        this.scene.add(railRight);

        // Wooden Railroad Ties (sleepers)
        const tieGeo = new THREE.BoxGeometry(2.4, 0.12, 0.4);
        for (let z = -38; z <= 38; z += 1.2) {
            const tie = new THREE.Mesh(tieGeo, tieMat);
            tie.position.set(-32, 0.06, z);
            this.scene.add(tie);
        }
    };

    IntermodalTerminal.prototype.buildTrain = function() {
        // Diesel Locomotive Engine
        const locoGroup = new THREE.Group();
        const locoBodyGeo = new THREE.BoxGeometry(2.6, 3.2, 10);
        const locoMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.7 });
        const locoBody = new THREE.Mesh(locoBodyGeo, locoMat);
        locoBody.position.y = 2.0;
        locoBody.castShadow = true;
        locoGroup.add(locoBody);

        // Cabin Windows & Roof Light
        const cabGeo = new THREE.BoxGeometry(2.6, 1.0, 3.0);
        const cabMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2 });
        const cab = new THREE.Mesh(cabGeo, cabMat);
        cab.position.set(0, 3.2, -2.5);
        locoGroup.add(cab);

        locoGroup.position.set(-32, 0, -22);
        this.trainGroup.add(locoGroup);

        // 3 Container Flatcars behind locomotive
        for (let i = 0; i < 3; i++) {
            const flatcar = new THREE.Group();
            const bedGeo = new THREE.BoxGeometry(2.5, 0.4, 13);
            const bedMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
            const bed = new THREE.Mesh(bedGeo, bedMat);
            bed.position.y = 0.6;
            bed.castShadow = true;
            flatcar.add(bed);

            // Spawn container on flatcar
            const carriers = ['maersk', 'evergreen', 'hapag'];
            const container = window.Cargo3D.Containers.createContainerMesh('40ft', carriers[i]);
            container.position.set(0, 2.2, 0);
            flatcar.add(container);
            this.trainContainers.push(container);

            flatcar.position.set(-32, 0, -5 + i * 14);
            this.trainGroup.add(flatcar);
        }

        this.scene.add(this.trainGroup);
    };

    IntermodalTerminal.prototype.buildSemiTruck = function() {
        // Semi Truck Cab (Red Freightliner)
        const cabGeo = new THREE.BoxGeometry(2.4, 2.8, 3.5);
        const cabMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.6 });
        const cab = new THREE.Mesh(cabGeo, cabMat);
        cab.position.set(0, 1.8, -6);
        cab.castShadow = true;
        this.truckGroup.add(cab);

        // Flatbed Trailer
        const trailerGeo = new THREE.BoxGeometry(2.5, 0.3, 12.5);
        const trailerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
        const trailer = new THREE.Mesh(trailerGeo, trailerMat);
        trailer.position.set(0, 0.8, 2);
        trailer.castShadow = true;
        this.truckGroup.add(trailer);

        // 20ft Container on Trailer
        const truckContainer = window.Cargo3D.Containers.createContainerMesh('20ft', 'msc');
        truckContainer.position.set(0, 2.2, 2);
        this.truckGroup.add(truckContainer);

        this.truckGroup.position.set(28, 0, 0);
        this.scene.add(this.truckGroup);
    };

    /**
     * Automated train unloading sequence: moves a train container into the yard.
     */
    IntermodalTerminal.prototype.autoUnloadTrain = function(sceneControls) {
        if (this.trainContainers.length === 0) return 'empty';

        const container = this.trainContainers.pop();
        if (container && container.parent) {
            container.parent.remove(container);
        }

        // Spawn unit into yard
        const carriers = ['maersk', 'hapag', 'evergreen', 'msc'];
        const randomCarrier = carriers[Math.floor(Math.random() * carriers.length)];
        const gridX = -12.5 + Math.floor(Math.random() * 4) * 5;
        const gridZ = -7.5 + Math.floor(Math.random() * 4) * 5;

        sceneControls.setSpawnConfig('40ft', randomCarrier);
        sceneControls.spawnContainer(gridX, 1.45, gridZ);
        if (window.Cargo3D.Audio) window.Cargo3D.Audio.playLockSound();

        return 'unloaded';
    };

    window.Cargo3D.IntermodalTerminal = IntermodalTerminal;
})(window);
