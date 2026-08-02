import * as THREE from 'three';

// Carrier Brand Color Palettes
export const CARRIER_PALETTES = {
    maersk: { name: 'Maersk Line', color: 0x00a0b0, metalness: 0.3, roughness: 0.4 },
    hapag: { name: 'Hapag-Lloyd', color: 0xe65c00, metalness: 0.2, roughness: 0.5 },
    evergreen: { name: 'Evergreen Line', color: 0x007a4d, metalness: 0.3, roughness: 0.4 },
    msc: { name: 'MSC Yellow', color: 0xda9f1a, metalness: 0.2, roughness: 0.5 },
    wood: { name: 'Pine Wood', color: 0xb08d57, metalness: 0.05, roughness: 0.9 }
};

// Standard Container Dimensions (in meters)
export const CONTAINER_SPECS = {
    '20ft': { length: 6.06, width: 2.44, height: 2.59, teu: 1, volume: 33.2, emptyWeight: 2.2, maxWeight: 28.2 },
    '40ft': { length: 12.19, width: 2.44, height: 2.89, teu: 2, volume: 76.4, emptyWeight: 3.8, maxWeight: 30.4 },
    'pallet': { length: 1.2, width: 0.8, height: 1.4, teu: 0.1, volume: 1.34, emptyWeight: 0.02, maxWeight: 1.5 }
};

/**
 * Creates a procedural 3D shipping container mesh with corrugated walls & corner castings.
 */
export function createContainerMesh(type = '20ft', carrierKey = 'maersk') {
    const spec = CONTAINER_SPECS[type] || CONTAINER_SPECS['20ft'];
    const palette = CARRIER_PALETTES[carrierKey] || CARRIER_PALETTES['maersk'];

    const group = new THREE.Group();
    group.userData = {
        type: type,
        carrierKey: carrierKey,
        carrierName: palette.name,
        spec: spec,
        createdAt: Date.now()
    };

    if (type === 'pallet') {
        // Build wooden pallet mesh
        const palletGeo = new THREE.BoxGeometry(spec.length, 0.15, spec.width);
        const palletMat = new THREE.MeshStandardMaterial({
            color: palette.color,
            roughness: palette.roughness,
            metalness: palette.metalness
        });
        const palletMesh = new THREE.Mesh(palletGeo, palletMat);
        palletMesh.castShadow = true;
        palletMesh.receiveShadow = true;
        palletMesh.position.y = 0.075;
        group.add(palletMesh);

        // Add cargo boxes on top
        const boxMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c, roughness: 0.8 });
        for (let i = -1; i <= 1; i += 2) {
            for (let j = -1; j <= 1; j += 2) {
                const boxGeo = new THREE.BoxGeometry(0.5, 0.6, 0.35);
                const boxMesh = new THREE.Mesh(boxGeo, boxMat);
                boxMesh.position.set(i * 0.25, 0.45, j * 0.18);
                boxMesh.castShadow = true;
                group.add(boxMesh);
            }
        }
        return group;
    }

    // Main Box Body
    const bodyMat = new THREE.MeshStandardMaterial({
        color: palette.color,
        roughness: palette.roughness,
        metalness: palette.metalness
    });

    const bodyGeo = new THREE.BoxGeometry(spec.length, spec.height, spec.width);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Frame / Edges Details
    const frameMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.3,
        metalness: 0.8
    });

    // Steel Corner Castings (8 corners)
    const cornerSize = 0.22;
    const cornerGeo = new THREE.BoxGeometry(cornerSize, cornerSize, cornerSize);
    const halfL = spec.length / 2;
    const halfH = spec.height / 2;
    const halfW = spec.width / 2;

    const cornersPos = [
        [-halfL, -halfH, -halfW], [-halfL, -halfH, halfW],
        [-halfL, halfH, -halfW], [-halfL, halfH, halfW],
        [halfL, -halfH, -halfW], [halfL, -halfH, halfW],
        [halfL, halfH, -halfW], [halfL, halfH, halfW]
    ];

    cornersPos.forEach(([x, y, z]) => {
        const corner = new THREE.Mesh(cornerGeo, frameMat);
        corner.position.set(x, y, z);
        group.add(corner);
    });

    // Corrugation Side Ribs Simulation
    const ribCount = type === '40ft' ? 24 : 12;
    const ribMat = new THREE.MeshStandardMaterial({
        color: palette.color,
        roughness: palette.roughness * 0.9,
        metalness: palette.metalness
    });

    const ribWidth = 0.08;
    const ribGeo = new THREE.BoxGeometry(ribWidth, spec.height - 0.1, 0.06);
    const startX = -halfL + 0.3;
    const stepX = (spec.length - 0.6) / ribCount;

    for (let i = 0; i <= ribCount; i++) {
        const posX = startX + i * stepX;

        // Front wall rib
        const ribFront = new THREE.Mesh(ribGeo, ribMat);
        ribFront.position.set(posX, 0, halfW + 0.02);
        ribFront.castShadow = true;
        group.add(ribFront);

        // Back wall rib
        const ribBack = new THREE.Mesh(ribGeo, ribMat);
        ribBack.position.set(posX, 0, -halfW - 0.02);
        ribBack.castShadow = true;
        group.add(ribBack);
    }

    // Door Locking Bars on End
    const barGeo = new THREE.CylinderGeometry(0.02, 0.02, spec.height - 0.2, 8);
    const bar1 = new THREE.Mesh(barGeo, frameMat);
    bar1.position.set(halfL + 0.02, 0, -0.3);
    const bar2 = new THREE.Mesh(barGeo, frameMat);
    bar2.position.set(halfL + 0.02, 0, 0.3);
    group.add(bar1);
    group.add(bar2);

    return group;
}

/**
 * Calculates total yard metrics from active placed container meshes.
 */
export function calculateYardMetrics(placedObjects) {
    let totalTEU = 0;
    let totalVol = 0;
    let totalMass = 0;

    placedObjects.forEach(obj => {
        const spec = obj.userData.spec;
        if (spec) {
            totalTEU += spec.teu;
            totalVol += spec.volume;
            totalMass += spec.emptyWeight + (spec.maxWeight * 0.4); // avg load factor
        }
    });

    return {
        count: placedObjects.length,
        teu: totalTEU.toFixed(1),
        vol: Math.round(totalVol),
        mass: totalMass.toFixed(1),
        stability: placedObjects.length === 0 ? '100% (Optimal)' : '98.5% (Stable)'
    };
}
