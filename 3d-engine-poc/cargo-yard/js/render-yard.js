(function (window) {
    'use strict';

    // The static world: apron, the marked pad, and the floodlight masts. The
    // pad is rebuilt whenever a mission changes the yard size, so what you see
    // is always exactly the lattice the rules are enforced on — the old POC
    // drew an 80 m grid at 2.5 m spacing that matched nothing.
    const CY = window.CY = window.CY || {};

    let scene = null;
    let padGroup = null;

    function attach(target) {
        scene = target;
        buildApron();
        CY.on('game:start', function () { buildPad(CY.state.yard); });
    }

    function buildApron() {
        const R = CY._render;
        const geo = new THREE.PlaneGeometry(90, 90);
        R.groundMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.2 });
        const mesh = new THREE.Mesh(geo, R.groundMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        scene.add(mesh);

        const poleGeo = new THREE.CylinderGeometry(0.3, 0.3, 18, 12);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
        [[-28, -28], [28, -28], [-28, 28], [28, 28]].forEach(function (c) {
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(c[0], 9, c[1]);
            pole.castShadow = true;
            scene.add(pole);
        });
    }

    function buildPad(yard) {
        if (padGroup) {
            scene.remove(padGroup);
            CY.render.disposeObject(padGroup);
        }
        padGroup = new THREE.Group();

        const size = CY.yardSizeMetres(yard);
        const halfX = size.x / 2, halfZ = size.z / 2;

        // The slab.
        const slab = new THREE.Mesh(
            new THREE.BoxGeometry(size.x + 1.2, 0.12, size.z + 1.2),
            new THREE.MeshStandardMaterial({ color: 0x27364b, roughness: 0.85, metalness: 0.1 })
        );
        slab.position.y = 0.06;
        slab.receiveShadow = true;
        padGroup.add(slab);

        // Cell lines, one per grid seam — this is the lattice, drawn honestly.
        const pts = [];
        const y = 0.13;
        for (let i = 0; i <= yard.w; i++) {
            const x = -halfX + i * CY.CELL.x;
            pts.push(x, y, -halfZ, x, y, halfZ);
        }
        for (let i = 0; i <= yard.d; i++) {
            const z = -halfZ + i * CY.CELL.z;
            pts.push(-halfX, y, z, halfX, y, z);
        }
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        padGroup.add(new THREE.LineSegments(
            lineGeo,
            new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 })
        ));

        // Hazard border, so the edge of the playable pad is unmissable.
        const edge = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x, 0.02, size.z)),
            new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.8 })
        );
        edge.position.y = 0.15;
        padGroup.add(edge);

        // Tier ceiling: a faint cage at the height the rules stop you at.
        const maxTier = Math.min(yard.h, CY.state.rules.maxTier);
        const cage = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x, maxTier * CY.CELL.y, size.z)),
            new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.22 })
        );
        cage.position.y = maxTier * CY.CELL.y / 2;
        padGroup.add(cage);

        scene.add(padGroup);
    }

    CY.yard3d = { attach: attach, buildPad: buildPad };

})(window);
