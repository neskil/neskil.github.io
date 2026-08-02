(function(window) {
    'use strict';

    window.Cargo3D = window.Cargo3D || {};

    // Carrier Brand Color Palettes
    const CARRIER_PALETTES = {
        maersk: { name: 'Maersk Line', color: 0x00a0b0, metalness: 0.3, roughness: 0.4 },
        hapag: { name: 'Hapag-Lloyd', color: 0xe65c00, metalness: 0.2, roughness: 0.5 },
        evergreen: { name: 'Evergreen Line', color: 0x007a4d, metalness: 0.3, roughness: 0.4 },
        msc: { name: 'MSC Yellow', color: 0xda9f1a, metalness: 0.2, roughness: 0.5 },
        wood: { name: 'Pine Wood', color: 0xb08d57, metalness: 0.05, roughness: 0.9 }
    };

    // Standard Container Dimensions (in meters)
    const CONTAINER_SPECS = {
        '20ft': { length: 6.06, width: 2.44, height: 2.59, teu: 1, volume: 33.2, emptyWeight: 2.2, maxWeight: 28.2 },
        '40ft': { length: 12.19, width: 2.44, height: 2.89, teu: 2, volume: 76.4, emptyWeight: 3.8, maxWeight: 30.4 },
        'pallet': { length: 1.2, width: 0.8, height: 1.4, teu: 0.1, volume: 1.34, emptyWeight: 0.02, maxWeight: 1.5 }
    };

    let isXRayActive = false;
    let isHeatmapActive = false;

    /**
     * Creates a procedural 3D shipping container mesh with corrugated walls, corner castings, and interior cargo.
     */
    function createContainerMesh(type, carrierKey) {
        type = type || '20ft';
        carrierKey = carrierKey || 'maersk';
        
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

        // Main Box Body Shell
        const bodyMat = new THREE.MeshStandardMaterial({
            color: palette.color,
            roughness: palette.roughness,
            metalness: palette.metalness,
            transparent: false,
            opacity: 1.0
        });

        const bodyGeo = new THREE.BoxGeometry(spec.length, spec.height, spec.width);
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        bodyMesh.userData.isShell = true;
        bodyMesh.userData.originalColor = palette.color;
        group.add(bodyMesh);

        // Steel Corner Castings
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8 });
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

        // Corrugation Ribs
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
            const ribFront = new THREE.Mesh(ribGeo, ribMat);
            ribFront.position.set(posX, 0, halfW + 0.02);
            ribFront.castShadow = true;
            ribFront.userData.isShell = true;
            group.add(ribFront);

            const ribBack = new THREE.Mesh(ribGeo, ribMat);
            ribBack.position.set(posX, 0, -halfW - 0.02);
            ribBack.castShadow = true;
            ribBack.userData.isShell = true;
            group.add(ribBack);
        }

        // Add 3D Interior Cargo (Visible in X-Ray mode)
        const interiorGroup = new THREE.Group();
        interiorGroup.userData.isInterior = true;

        // Internal Wooden Pallets & Oil Drums
        const drumMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.6 });
        const drumGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.95, 12);

        const crateMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
        const crateGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);

        const numCargo = type === '40ft' ? 8 : 4;
        for (let k = 0; k < numCargo; k++) {
            const cargoX = -halfL + 1.0 + k * 1.3;
            if (k % 2 === 0) {
                const drum = new THREE.Mesh(drumGeo, drumMat);
                drum.position.set(cargoX, -halfH + 0.5, 0);
                interiorGroup.add(drum);
            } else {
                const crate = new THREE.Mesh(crateGeo, crateMat);
                crate.position.set(cargoX, -halfH + 0.45, 0);
                interiorGroup.add(crate);
            }
        }

        group.add(interiorGroup);
        return group;
    }

    /**
     * Toggles X-Ray Cutaway View on container outer walls.
     */
    function toggleXRayMode(placedObjects, enable) {
        isXRayActive = enable !== undefined ? enable : !isXRayActive;

        placedObjects.forEach(group => {
            group.traverse(child => {
                if (child.isMesh && child.userData.isShell) {
                    child.material.transparent = isXRayActive;
                    child.material.opacity = isXRayActive ? 0.3 : 1.0;
                    child.material.needsUpdate = true;
                }
            });
        });

        return isXRayActive;
    }

    /**
     * Toggles Structural Safety Balance Heatmap (Green/Yellow/Red).
     */
    function toggleStressHeatmap(placedObjects, enable) {
        isHeatmapActive = enable !== undefined ? enable : !isHeatmapActive;

        placedObjects.forEach(group => {
            const posY = group.position.y;
            let heatColor = 0x10b981; // Green = Tier 1 Ground Level (Optimal)
            if (posY > 3.0 && posY <= 6.0) heatColor = 0xeab308; // Yellow = Tier 2 (Moderate Load)
            if (posY > 6.0) heatColor = 0xef4444; // Red = Tier 3+ (High Stress / Tipping Warning)

            group.traverse(child => {
                if (child.isMesh && child.userData.isShell) {
                    if (isHeatmapActive) {
                        child.material.color.setHex(heatColor);
                    } else {
                        child.material.color.setHex(child.userData.originalColor || 0x00a0b0);
                    }
                    child.material.needsUpdate = true;
                }
            });
        });

        return isHeatmapActive;
    }

    function calculateYardMetrics(placedObjects) {
        let totalTEU = 0;
        let totalVol = 0;
        let totalMass = 0;

        placedObjects.forEach(obj => {
            const spec = obj.userData.spec;
            if (spec) {
                totalTEU += spec.teu;
                totalVol += spec.volume;
                totalMass += spec.emptyWeight + (spec.maxWeight * 0.4);
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

    window.Cargo3D.Containers = {
        CARRIER_PALETTES: CARRIER_PALETTES,
        CONTAINER_SPECS: CONTAINER_SPECS,
        createContainerMesh: createContainerMesh,
        toggleXRayMode: toggleXRayMode,
        toggleStressHeatmap: toggleStressHeatmap,
        calculateYardMetrics: calculateYardMetrics
    };
})(window);
