(function (window) {
    'use strict';

    // Scenery with one job: the rail siding and the road trailer that the
    // sandbox draws boxes from. "Unload" lifts a real container off a flatcar
    // and hands that exact type to the cursor — the old version discarded the
    // box it removed and spawned a random one at a random spot instead.
    const CY = window.CY = window.CY || {};

    function Terminal(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.wagons = [];
        this.build();
        scene.add(this.group);
    }

    Terminal.prototype.build = function () {
        const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
        const tieMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
        const railGeo = new THREE.BoxGeometry(0.12, 0.2, 84);

        const left = new THREE.Mesh(railGeo, railMat);
        left.position.set(-32.8, 0.1, 0);
        const right = new THREE.Mesh(railGeo, railMat);
        right.position.set(-31.2, 0.1, 0);
        this.group.add(left, right);

        const tieGeo = new THREE.BoxGeometry(2.4, 0.12, 0.4);
        for (let z = -40; z <= 40; z += 1.6) {
            const tie = new THREE.Mesh(tieGeo, tieMat);
            tie.position.set(-32, 0.06, z);
            this.group.add(tie);
        }

        // Locomotive.
        const loco = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(2.6, 3.2, 10),
            new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.7 })
        );
        body.position.y = 2.0;
        body.castShadow = true;
        const cab = new THREE.Mesh(
            new THREE.BoxGeometry(2.6, 1.0, 3.0),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2 })
        );
        cab.position.set(0, 3.2, -2.5);
        loco.add(body, cab);
        loco.position.set(-32, 0, -26);
        this.group.add(loco);

        // Three flatcars, each with a container that is really there.
        const manifest = ['c40', 'c40', 'c20'];
        const bedGeo = new THREE.BoxGeometry(2.5, 0.4, 13);
        const bedMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
        for (let i = 0; i < manifest.length; i++) {
            const car = new THREE.Group();
            const bed = new THREE.Mesh(bedGeo, bedMat);
            bed.position.y = 0.6;
            bed.castShadow = true;
            car.add(bed);

            const pieceId = manifest[i];
            const cells = CY.piece(pieceId).cells;
            const box = CY.pieces3d.build(pieceId, cells, {});
            box.rotation.y = Math.PI / 2;   // boxes ride along the rails
            box.position.set(0, 2.3, 0);
            car.add(box);

            car.position.set(-32, 0, -8 + i * 15);
            this.group.add(car);
            this.wagons.push({ car: car, box: box, pieceId: pieceId });
        }

        // Road trailer on the far side.
        const truck = new THREE.Group();
        const tcab = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 2.8, 3.5),
            new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.6 })
        );
        tcab.position.set(0, 1.8, -6);
        tcab.castShadow = true;
        const trailer = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 0.3, 12.5),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
        );
        trailer.position.set(0, 0.8, 2);
        trailer.castShadow = true;
        truck.add(tcab, trailer);

        const load = CY.pieces3d.build('c20', CY.piece('c20').cells, {});
        load.rotation.y = Math.PI / 2;
        load.position.set(0, 2.2, 2);
        truck.add(load);
        truck.position.set(32, 0, 0);
        this.group.add(truck);
    };

    // Hand the next box on the siding to the cursor. Sandbox only — a mission
    // queue is the mission, and nothing may inject into it.
    Terminal.prototype.unloadNext = function () {
        if (CY.state.mode !== 'sandbox') return null;
        const wagon = this.wagons.pop();
        if (!wagon) return null;
        wagon.car.remove(wagon.box);
        CY.render.disposeObject(wagon.box);
        CY.game.setSandboxPiece(wagon.pieceId);
        CY.audio.hydraulic();
        CY.emit('game:message', {
            text: 'Lifted a ' + CY.piece(wagon.pieceId).label + ' off the siding — place it.',
            tone: 'good'
        });
        return wagon.pieceId;
    };

    Terminal.prototype.remaining = function () { return this.wagons.length; };

    CY.Terminal = Terminal;

})(window);
