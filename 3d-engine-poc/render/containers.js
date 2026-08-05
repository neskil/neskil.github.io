/**
 * render/containers.js — procedural cargo meshes.
 *
 * Geometry only. Nothing here decides whether a placement is legal; it reads
 * the spec out of core/constants.js and builds something that looks like it.
 *
 * Convention: a unit's mesh is centred on its own origin with its length along
 * +X, so a 90° rotation about Y is all the yard view needs to place a rotated
 * unit. Meshes that make up the outer shell are tagged `userData.isShell` for
 * the X-ray and heatmap views.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const C = Cargo3D.Constants;

    function shellMaterial(palette) {
        const mat = new THREE.MeshStandardMaterial({
            color: palette.color,
            roughness: palette.roughness,
            metalness: palette.metalness
        });
        mat.userData = { baseColor: palette.color };
        return mat;
    }

    function tagShell(mesh, color) {
        mesh.userData.isShell = true;
        mesh.userData.originalColor = color;
        return mesh;
    }

    /** Steel corner castings at the eight corners of a box. */
    function addCorners(group, l, h, w) {
        const mat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8 });
        const size = 0.22;
        const geo = new THREE.BoxGeometry(size, size, size);
        const hl = l / 2, hh = h / 2, hw = w / 2;

        [-1, 1].forEach(function (sx) {
            [-1, 1].forEach(function (sy) {
                [-1, 1].forEach(function (sz) {
                    const corner = new THREE.Mesh(geo, mat);
                    corner.position.set(sx * hl, sy * hh, sz * hw);
                    group.add(corner);
                });
            });
        });
    }

    /** Vertical corrugation ribs down both long sides. */
    function addRibs(group, spec, palette, ribCount) {
        const mat = new THREE.MeshStandardMaterial({
            color: palette.color,
            roughness: palette.roughness * 0.9,
            metalness: palette.metalness
        });
        const geo = new THREE.BoxGeometry(0.08, spec.height - 0.12, 0.06);
        const halfL = spec.length / 2;
        const halfW = spec.width / 2;
        const start = -halfL + 0.3;
        const step = (spec.length - 0.6) / ribCount;

        for (let i = 0; i <= ribCount; i++) {
            const x = start + i * step;
            [halfW + 0.02, -halfW - 0.02].forEach(function (z) {
                const rib = new THREE.Mesh(geo, mat);
                rib.position.set(x, 0, z);
                rib.castShadow = true;
                group.add(tagShell(rib, palette.color));
            });
        }
    }

    /** Cargo doors on one end, so a rotated unit reads as rotated. */
    function addDoors(group, spec) {
        const mat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.6 });
        const bar = new THREE.BoxGeometry(0.05, spec.height - 0.3, 0.07);
        for (let i = -1; i <= 1; i += 2) {
            const rod = new THREE.Mesh(bar, mat);
            rod.position.set(spec.length / 2 + 0.03, 0, i * spec.width * 0.28);
            group.add(rod);
        }
    }

    /** Trait markings — a reefer's plant, a hazmat placard. */
    function addTraitDecals(group, spec, traits) {
        if (!traits || !traits.length) return;

        if (traits.indexOf('reefer') !== -1) {
            const unitGeo = new THREE.BoxGeometry(0.5, spec.height * 0.55, spec.width * 0.85);
            const unitMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.5 });
            const machine = new THREE.Mesh(unitGeo, unitMat);
            machine.position.set(-spec.length / 2 - 0.24, 0, 0);
            machine.castShadow = true;
            group.add(machine);

            const grillGeo = new THREE.BoxGeometry(0.06, spec.height * 0.3, spec.width * 0.6);
            const grillMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0c4a6e, roughness: 0.4 });
            const grill = new THREE.Mesh(grillGeo, grillMat);
            grill.position.set(-spec.length / 2 - 0.5, 0, 0);
            group.add(grill);

            // Reefer power status LED
            const ledGeo = new THREE.SphereGeometry(0.12, 12, 12);
            const ledMat = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0.95 });
            const led = new THREE.Mesh(ledGeo, ledMat);
            led.position.set(-spec.length / 2 - 0.52, spec.height * 0.2, spec.width * 0.25);
            group.add(led);
        }

        if (traits.indexOf('hazmat') !== -1) {
            const placardGeo = new THREE.BoxGeometry(0.7, 0.7, 0.05);
            const placardMat = new THREE.MeshStandardMaterial({
                color: 0xf59e0b, emissive: 0x7c2d12, emissiveIntensity: 0.6, roughness: 0.4
            });
            const innerGeo = new THREE.BoxGeometry(0.42, 0.42, 0.07);
            const innerMat = new THREE.MeshStandardMaterial({
                color: 0xd97706, emissive: 0xef4444, emissiveIntensity: 0.8
            });

            [1, -1].forEach(function (side) {
                const placard = new THREE.Mesh(placardGeo, placardMat);
                placard.position.set(spec.length * 0.22, 0, side * (spec.width / 2 + 0.06));
                placard.rotation.z = Math.PI / 4;
                group.add(placard);

                const inner = new THREE.Mesh(innerGeo, innerMat);
                inner.position.set(spec.length * 0.22, 0, side * (spec.width / 2 + 0.07));
                inner.rotation.z = Math.PI / 4;
                group.add(inner);
            });
        }
    }

    /** Interior cargo, only visible with the X-ray view on. */
    function addInterior(group, spec, count) {
        const interior = new THREE.Group();
        interior.userData.isInterior = true;

        const drumMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.6 });
        const drumGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.95, 12);
        const crateMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
        const crateGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);

        const halfL = spec.length / 2;
        const halfH = spec.height / 2;
        for (let i = 0; i < count; i++) {
            const x = -halfL + 1.0 + i * 1.3;
            const item = i % 2 === 0
                ? new THREE.Mesh(drumGeo, drumMat)
                : new THREE.Mesh(crateGeo, crateMat);
            item.position.set(x, -halfH + 0.5, 0);
            interior.add(item);
        }

        group.add(interior);
    }

    function buildIsoBox(group, spec, palette, traits) {
        const body = new THREE.Mesh(new THREE.BoxGeometry(spec.length, spec.height, spec.width), shellMaterial(palette));
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(tagShell(body, palette.color));

        addCorners(group, spec.length, spec.height, spec.width);
        addRibs(group, spec, palette, spec.length > 8 ? 20 : (spec.length > 4 ? 10 : 5));
        addDoors(group, spec);
        addTraitDecals(group, spec, traits);
        addInterior(group, spec, spec.length > 8 ? 8 : (spec.length > 4 ? 4 : 2));
    }

    function buildTank(group, spec, palette) {
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 });
        const barGeo = new THREE.BoxGeometry(spec.length, 0.14, 0.14);
        [[0, spec.height / 2, spec.width / 2], [0, spec.height / 2, -spec.width / 2],
         [0, -spec.height / 2, spec.width / 2], [0, -spec.height / 2, -spec.width / 2]].forEach(function (p) {
            const bar = new THREE.Mesh(barGeo, frameMat);
            bar.position.set(p[0], p[1], p[2]);
            bar.castShadow = true;
            group.add(bar);
        });

        const postGeo = new THREE.BoxGeometry(0.14, spec.height, 0.14);
        [-1, 1].forEach(function (sx) {
            [-1, 1].forEach(function (sz) {
                const post = new THREE.Mesh(postGeo, frameMat);
                post.position.set(sx * spec.length / 2, 0, sz * spec.width / 2);
                group.add(post);
            });
        });

        const barrelMat = new THREE.MeshStandardMaterial({
            color: 0xcbd5e1, roughness: 0.18, metalness: 0.95
        });
        barrelMat.userData = { baseColor: 0xcbd5e1 };
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(spec.width * 0.42, spec.width * 0.42, spec.length * 0.88, 20),
            barrelMat
        );
        barrel.rotation.z = Math.PI / 2;
        barrel.castShadow = true;
        group.add(tagShell(barrel, 0xcbd5e1));

        const capMat = new THREE.MeshStandardMaterial({ color: palette.color, roughness: 0.4, metalness: 0.5 });
        const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 12), capMat);
        hatch.position.set(0, spec.width * 0.42, 0);
        group.add(hatch);

        addTraitDecals(group, spec, ['hazmat']);
        addCorners(group, spec.length, spec.height, spec.width);
    }

    function buildCrate(group, spec, palette) {
        const woodMat = new THREE.MeshStandardMaterial({ color: 0xb08d57, roughness: 0.92, metalness: 0.03 });
        woodMat.userData = { baseColor: 0xb08d57 };
        const body = new THREE.Mesh(new THREE.BoxGeometry(spec.length, spec.height, spec.width), woodMat);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(tagShell(body, 0xb08d57));

        const bandMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.85 });

        // Steel banding around both axes.
        [-spec.length * 0.28, spec.length * 0.28].forEach(function (x) {
            const band = new THREE.Mesh(new THREE.BoxGeometry(0.16, spec.height + 0.06, spec.width + 0.06), bandMat);
            band.position.x = x;
            group.add(band);
        });
        [-spec.width * 0.28, spec.width * 0.28].forEach(function (z) {
            const band = new THREE.Mesh(new THREE.BoxGeometry(spec.length + 0.06, spec.height + 0.06, 0.16), bandMat);
            band.position.z = z;
            group.add(band);
        });

        // Skids underneath — this is breakbulk, it arrives on timber.
        const skidGeo = new THREE.BoxGeometry(spec.length * 0.96, 0.18, 0.3);
        const skidMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.95 });
        [-spec.width * 0.32, 0, spec.width * 0.32].forEach(function (z) {
            const skid = new THREE.Mesh(skidGeo, skidMat);
            skid.position.set(0, -spec.height / 2 - 0.09, z);
            skid.castShadow = true;
            group.add(skid);
        });

        addTraitDecals(group, spec, ['fragile']);
    }

    function buildPallet(group, spec, palette) {
        const deck = new THREE.Mesh(
            new THREE.BoxGeometry(spec.length, 0.15, spec.width),
            new THREE.MeshStandardMaterial({ color: palette.color, roughness: palette.roughness, metalness: palette.metalness })
        );
        deck.position.y = -spec.height / 2 + 0.075;
        deck.castShadow = true;
        deck.receiveShadow = true;
        group.add(deck);

        const boxMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c, roughness: 0.8 });
        const boxGeo = new THREE.BoxGeometry(0.5, 0.6, 0.35);
        for (let i = -1; i <= 1; i += 2) {
            for (let j = -1; j <= 1; j += 2) {
                const box = new THREE.Mesh(boxGeo, boxMat);
                box.position.set(i * 0.25, -spec.height / 2 + 0.45, j * 0.18);
                box.castShadow = true;
                group.add(box);
            }
        }
    }

    function buildFlatrack(group, spec, palette) {
        const floorMat = shellMaterial(palette);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 });

        const deck = new THREE.Mesh(new THREE.BoxGeometry(spec.length, 0.35, spec.width), floorMat);
        deck.position.y = -spec.height / 2 + 0.175;
        deck.castShadow = true;
        deck.receiveShadow = true;
        group.add(tagShell(deck, palette.color));

        const postGeo = new THREE.BoxGeometry(0.3, spec.height - 0.35, 0.3);
        const beamGeo = new THREE.BoxGeometry(0.2, 0.2, spec.width);

        [-1, 1].forEach(function (sx) {
            [-1, 1].forEach(function (sz) {
                const post = new THREE.Mesh(postGeo, postMat);
                post.position.set(sx * (spec.length / 2 - 0.2), 0, sz * (spec.width / 2 - 0.2));
                post.castShadow = true;
                group.add(post);
            });
            const beam = new THREE.Mesh(beamGeo, postMat);
            beam.position.set(sx * (spec.length / 2 - 0.2), spec.height / 2 - 0.2, 0);
            group.add(beam);
        });

        addCorners(group, spec.length, spec.height, spec.width);
    }

    function buildLBlock(group, spec, palette) {
        const mat = shellMaterial(palette);
        const cellSize = C.GRID.CELL_X;
        const mask = spec.mask || [[0, 0], [1, 0], [0, 1]];

        mask.forEach(function (pt) {
            const box = new THREE.Mesh(new THREE.BoxGeometry(cellSize * 0.94, spec.height, cellSize * 0.94), mat);
            box.position.set((pt[0] + 0.5 - spec.cells[0] / 2) * cellSize, 0, (pt[1] + 0.5 - spec.cells[1] / 2) * cellSize);
            box.castShadow = true;
            box.receiveShadow = true;
            group.add(tagShell(box, palette.color));
        });
    }

    function buildTBlock(group, spec, palette) {
        const mat = shellMaterial(palette);
        const cellSize = C.GRID.CELL_X;
        const mask = spec.mask || [[0, 0], [1, 0], [2, 0], [1, 1]];

        mask.forEach(function (pt) {
            const box = new THREE.Mesh(new THREE.BoxGeometry(cellSize * 0.94, spec.height, cellSize * 0.94), mat);
            box.position.set((pt[0] + 0.5 - spec.cells[0] / 2) * cellSize, 0, (pt[1] + 0.5 - spec.cells[1] / 2) * cellSize);
            box.castShadow = true;
            box.receiveShadow = true;
            group.add(tagShell(box, palette.color));
        });
    }

    /**
     * Build a cargo unit.
     * @param {string} typeId key into CARGO_TYPES
     * @param {string} carrierKey key into CARRIERS
     * @param {string[]} [traits]
     * @returns {THREE.Group} centred on its own origin, length along +X
     */
    function createUnitMesh(typeId, carrierKey, traits) {
        const spec = C.CARGO_TYPES[typeId] || C.CARGO_TYPES['20ft'];
        const palette = C.CARRIERS[carrierKey] || C.CARRIERS.maersk;

        const group = new THREE.Group();
        group.userData = {
            type: spec.id,
            carrierKey: carrierKey,
            carrierName: palette.name,
            spec: spec,
            traits: traits || []
        };

        if (spec.id === 'pallet') buildPallet(group, spec, palette);
        else if (spec.id === 'tank') buildTank(group, spec, palette);
        else if (spec.id === 'crate') buildCrate(group, spec, palette);
        else if (spec.id === 'flatrack') buildFlatrack(group, spec, palette);
        else if (spec.id === 'lblock') buildLBlock(group, spec, palette);
        else if (spec.id === 'tblock') buildTBlock(group, spec, palette);
        else buildIsoBox(group, spec, palette, traits);

        return group;
    }

    /**
     * Translucent stand-in used for the placement preview. Sized to the unit's
     * *grid footprint* rather than its true metres, so the player reads which
     * slots they are claiming.
     */
    function createGhostMesh(typeId, rot) {
        const spec = C.CARGO_TYPES[typeId] || C.CARGO_TYPES['20ft'];
        const sp = C.span(typeId, rot);

        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({
            color: 0x34d399, transparent: true, opacity: 0.42,
            emissive: 0x065f46, emissiveIntensity: 0.5,
            roughness: 0.5, depthWrite: false
        });

        const edgeMat = new THREE.LineBasicMaterial({ color: 0xecfdf5, transparent: true, opacity: 0.9 });
        const bodies = [];
        const edges = [];

        function addCell(w, h, d, x, z) {
            const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            box.position.set(x, 0, z);
            group.add(box);
            bodies.push(box);

            const line = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), edgeMat);
            line.position.copy(box.position);
            group.add(line);
            edges.push(line);
        }

        if (spec.mask) {
            // One box per occupied cell, so the preview has the same notch the
            // piece does — you aim an L-block by its corner, not by its box.
            const cellX = C.GRID.CELL_X * 0.94;
            const cellZ = C.GRID.CELL_Z * 0.94;
            C.footprint(spec.id, rot).forEach(function (cell) {
                addCell(cellX, spec.height, cellZ,
                    (cell[0] + 0.5 - sp[0] / 2) * C.GRID.CELL_X,
                    (cell[1] + 0.5 - sp[1] / 2) * C.GRID.CELL_Z);
            });
        } else {
            addCell(sp[0] * C.GRID.CELL_X * 0.94, spec.height, sp[1] * C.GRID.CELL_Z * 0.94, 0, 0);
        }

        // One material and one edge material across every cell, so the caller
        // recolours the whole preview by setting two colours.
        group.userData = { bodies: bodies, edges: edges, material: mat, edgeMaterial: edgeMat };
        return group;
    }

    /** X-ray: fade the shells so the interior cargo shows through. */
    function setXRay(groups, enable) {
        groups.forEach(function (group) {
            group.traverse(function (child) {
                if (child.isMesh && child.userData.isShell) {
                    child.material.transparent = enable;
                    child.material.opacity = enable ? 0.28 : 1.0;
                    child.material.needsUpdate = true;
                }
            });
        });
    }

    /** Tier heatmap: green on the ground, red at the top of the stack. */
    function setHeatmap(groups, enable, tierOf) {
        groups.forEach(function (group) {
            const tier = enable ? (tierOf ? tierOf(group) : 0) : 0;
            let heat = 0x10b981;
            if (tier === 1) heat = 0x84cc16;
            else if (tier === 2) heat = 0xeab308;
            else if (tier >= 3) heat = 0xef4444;

            group.traverse(function (child) {
                if (child.isMesh && child.userData.isShell) {
                    child.material.color.setHex(enable ? heat : (child.userData.originalColor || 0x00a0b0));
                    child.material.needsUpdate = true;
                }
            });
        });
    }

    /** Free every geometry and material under a group before dropping it. */
    function disposeGroup(group) {
        group.traverse(function (child) {
            if (!child.isMesh && !child.isLine && !child.isLineSegments) return;
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(function (m) { m.dispose(); });
                else child.material.dispose();
            }
        });
    }

    Cargo3D.ContainerMeshes = {
        createUnitMesh: createUnitMesh,
        createGhostMesh: createGhostMesh,
        setXRay: setXRay,
        setHeatmap: setHeatmap,
        disposeGroup: disposeGroup
    };
})(window);
