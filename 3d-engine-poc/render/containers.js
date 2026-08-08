/**
 * render/containers.js — procedural cargo meshes.
 *
 * Geometry only. Nothing here decides whether a placement is legal; it reads
 * the spec out of core/constants.js and builds something that looks like it.
 * Surface detail comes from render/textures.js, which paints one shared set of
 * skins the whole yard borrows.
 *
 * Convention: a unit's mesh is centred on its own origin with its length along
 * +X, so a 90° rotation about Y is all the yard view needs to place a rotated
 * unit. Meshes that make up the outer shell are tagged `userData.isShell` for
 * the X-ray and heatmap views; a material that must keep its own colour through
 * the heatmap sets `material.userData.fixedColor`.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const C = Cargo3D.Constants;
    const T = Cargo3D.Textures;

    /* Roughly how many metres of wall one tile of a skin covers. Keeping the
       tiling in world units means a 40ft and a 10ft wear the same size rivets. */
    const WALL_TILE = 2.6;
    const PLATE_TILE = 2.2;
    const TREAD_TILE = 1.5;

    /** Every material in a mesh, whether it carries one or a face array. */
    function materialsOf(mesh) {
        if (!mesh.material) return [];
        return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    }

    function shellMaterial(palette) {
        const mat = new THREE.MeshStandardMaterial({
            color: palette.color,
            roughness: palette.roughness,
            metalness: palette.metalness
        });
        mat.userData = { baseColor: palette.color };
        return mat;
    }

    /** Painted steel that keeps its own colour through the heatmap. */
    function steelMaterial(color, roughness, metalness) {
        const mat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: roughness === undefined ? 0.4 : roughness,
            metalness: metalness === undefined ? 0.75 : metalness
        });
        mat.userData = { fixedColor: true };
        return mat;
    }

    function tagShell(mesh, color) {
        mesh.userData.isShell = true;
        mesh.userData.originalColor = color;
        return mesh;
    }

    /** Steel corner castings at the eight corners of a box. */
    function addCorners(group, l, h, w) {
        const mat = steelMaterial(0x2b3648, 0.34, 0.85);
        if (T) T.applySkin(mat, T.boltedPlate(), 3, 3, 0.6);
        const size = 0.24;
        const geo = new THREE.BoxGeometry(size, size, size);
        const hl = l / 2, hh = h / 2, hw = w / 2;

        [-1, 1].forEach(function (sx) {
            [-1, 1].forEach(function (sy) {
                [-1, 1].forEach(function (sz) {
                    const corner = new THREE.Mesh(geo, mat);
                    corner.position.set(sx * hl, sy * hh, sz * hw);
                    corner.castShadow = true;
                    group.add(corner);
                });
            });
        });
    }

    /**
     * Top and bottom rails down both long sides.
     *
     * The corrugation itself is in the wall skin's normal map now — twenty-odd
     * rib boxes per container was most of the yard's draw calls and read no
     * better than a pressed steel profile does.
     */
    function addRails(group, spec, palette) {
        const mat = steelMaterial(0x33404f, 0.42, 0.7);
        if (T) T.applySkin(mat, T.boltedPlate(), spec.length / PLATE_TILE, 0.4, 0.7);

        const railGeo = new THREE.BoxGeometry(spec.length + 0.04, 0.14, 0.1);
        const halfW = spec.width / 2;
        const halfH = spec.height / 2;

        [-1, 1].forEach(function (sy) {
            [-1, 1].forEach(function (sz) {
                const rail = new THREE.Mesh(railGeo, mat);
                rail.position.set(0, sy * (halfH - 0.06), sz * (halfW + 0.03));
                rail.castShadow = true;
                group.add(rail);
            });
        });
    }

    /** Cargo doors on one end, so a rotated unit reads as rotated. */
    function addDoors(group, spec) {
        const mat = steelMaterial(0x1a2332, 0.4, 0.72);
        const bar = new THREE.CylinderGeometry(0.035, 0.035, spec.height - 0.34, 8);
        const handleGeo = new THREE.BoxGeometry(0.05, 0.06, 0.26);

        for (let i = -1; i <= 1; i += 2) {
            [0.20, 0.36].forEach(function (t) {
                const rod = new THREE.Mesh(bar, mat);
                rod.position.set(spec.length / 2 + 0.04, 0, i * spec.width * t);
                group.add(rod);

                const handle = new THREE.Mesh(handleGeo, mat);
                handle.position.set(spec.length / 2 + 0.09, -spec.height * 0.04, i * spec.width * t);
                group.add(handle);
            });
        }
    }

    /**
     * Carrier livery, painted on both flanks.
     *
     * It has to be its own decal plane: the wall skin is greyscale so
     * `material.color` can carry the carrier's paint, and white lettering
     * drawn into a greyscale map would come out the colour of the box.
     */
    function addLivery(group, spec, carrierKey, palette) {
        if (!T) return;

        const tex = T.carrierDecal(carrierKey, palette.name);
        const w = Math.min(spec.length * 0.62, spec.height * 2.9);
        const h = w * 0.3;
        const geo = new THREE.PlaneGeometry(w, h);

        [1, -1].forEach(function (side) {
            const mat = new THREE.MeshStandardMaterial({
                map: tex,
                transparent: true,
                roughness: 0.55,
                metalness: 0.0,
                depthWrite: false,
                polygonOffset: true,
                polygonOffsetFactor: -2,
                polygonOffsetUnits: -2
            });
            mat.userData = { fixedColor: true };

            const decal = new THREE.Mesh(geo, mat);
            decal.position.set(-spec.length * 0.08, spec.height * 0.10, side * (spec.width / 2 + 0.055));
            decal.rotation.y = side > 0 ? 0 : Math.PI;
            decal.userData.isSkin = true;
            group.add(decal);
        });
    }

    /** Trait markings — a reefer's plant, a hazmat placard. */
    function addTraitDecals(group, spec, traits) {
        if (!traits || !traits.length) return;

        if (traits.indexOf('reefer') !== -1) {
            const unitMat = steelMaterial(0xdfe6ee, 0.34, 0.55);
            if (T) T.applySkin(unitMat, T.boltedPlate(), 1.2, 1.2, 0.8);
            const unitGeo = new THREE.BoxGeometry(0.5, spec.height * 0.55, spec.width * 0.85);
            const machine = new THREE.Mesh(unitGeo, unitMat);
            machine.position.set(-spec.length / 2 - 0.24, 0, 0);
            machine.castShadow = true;
            group.add(machine);

            const grillGeo = new THREE.BoxGeometry(0.06, spec.height * 0.3, spec.width * 0.6);
            const grillMat = steelMaterial(0x38bdf8, 0.4, 0.3);
            grillMat.emissive = new THREE.Color(0x0c4a6e);
            const grill = new THREE.Mesh(grillGeo, grillMat);
            grill.position.set(-spec.length / 2 - 0.5, 0, 0);
            group.add(grill);

            // Reefer power status LED
            const ledGeo = new THREE.SphereGeometry(0.12, 12, 12);
            const ledMat = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0.95 });
            ledMat.userData = { fixedColor: true };
            const led = new THREE.Mesh(ledGeo, ledMat);
            led.position.set(-spec.length / 2 - 0.52, spec.height * 0.2, spec.width * 0.25);
            group.add(led);
        }

        if (traits.indexOf('hazmat') !== -1) {
            const placardGeo = new THREE.BoxGeometry(0.7, 0.7, 0.05);
            const placardMat = new THREE.MeshStandardMaterial({
                color: 0xf59e0b, emissive: 0x7c2d12, emissiveIntensity: 0.6, roughness: 0.4
            });
            placardMat.userData = { fixedColor: true };
            const innerGeo = new THREE.BoxGeometry(0.42, 0.42, 0.07);
            const innerMat = new THREE.MeshStandardMaterial({
                color: 0xd97706, emissive: 0xef4444, emissiveIntensity: 0.8
            });
            innerMat.userData = { fixedColor: true };

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
        if (T) T.applySkin(crateMat, T.timber(), 1, 1, 0.6);
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

    /**
     * A shipping box, with a different skin on every face.
     *
     * BoxGeometry hands out one material group per face in the order
     * +X, -X, +Y, -Y, +Z, -Z, which is the only way to get corrugation running
     * down the walls, across the roof and doors on exactly one end without
     * building the box out of six separate planes.
     */
    function buildIsoBox(group, spec, palette, traits, carrierKey) {
        const geo = new THREE.BoxGeometry(spec.length, spec.height, spec.width);
        let materials;

        if (T) {
            const wall = T.containerWall();
            const doors = T.containerDoors();
            const roof = T.containerRoof();

            const sideMat = shellMaterial(palette);
            T.applySkin(sideMat, wall, spec.length / WALL_TILE, 1, 1.0);

            const doorMat = shellMaterial(palette);
            T.applySkin(doorMat, doors, 1, 1, 0.9);

            const backMat = shellMaterial(palette);
            T.applySkin(backMat, wall, Math.max(1, spec.width / WALL_TILE), 1, 1.0);

            const roofMat = shellMaterial(palette);
            T.applySkin(roofMat, roof, spec.length / WALL_TILE, Math.max(1, spec.width / WALL_TILE), 0.9);

            const floorMat = steelMaterial(0x2f3947, 0.6, 0.6);
            T.applySkin(floorMat, T.boltedPlate(), spec.length / PLATE_TILE, 1, 0.8);

            materials = [doorMat, backMat, roofMat, floorMat, sideMat, sideMat];
        } else {
            materials = shellMaterial(palette);
        }

        const body = new THREE.Mesh(geo, materials);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(tagShell(body, palette.color));

        addCorners(group, spec.length, spec.height, spec.width);
        addRails(group, spec, palette);
        addDoors(group, spec);
        addLivery(group, spec, carrierKey, palette);
        addTraitDecals(group, spec, traits);
        addInterior(group, spec, spec.length > 8 ? 8 : (spec.length > 4 ? 4 : 2));
    }

    function buildTank(group, spec, palette) {
        const frameMat = steelMaterial(0x3a4658, 0.4, 0.8);
        if (T) T.applySkin(frameMat, T.boltedPlate(), spec.length / PLATE_TILE, 0.3, 0.7);

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
            color: 0xdbe3ea, roughness: 0.18, metalness: 0.95
        });
        barrelMat.userData = { baseColor: 0xdbe3ea };
        if (T) T.applySkin(barrelMat, T.brushedSteel(), spec.length / 1.4, 1, 0.5);

        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(spec.width * 0.42, spec.width * 0.42, spec.length * 0.88, 24),
            barrelMat
        );
        barrel.rotation.z = Math.PI / 2;
        barrel.castShadow = true;
        group.add(tagShell(barrel, 0xdbe3ea));

        // Baffle rings, so the barrel is not one unbroken tube.
        const ringGeo = new THREE.TorusGeometry(spec.width * 0.425, 0.05, 8, 24);
        [-0.28, 0, 0.28].forEach(function (t) {
            const ring = new THREE.Mesh(ringGeo, frameMat);
            ring.rotation.y = Math.PI / 2;
            ring.position.x = spec.length * t;
            group.add(ring);
        });

        const capMat = shellMaterial(palette);
        if (T) T.applySkin(capMat, T.boltedPlate(), 1, 1, 0.8);
        const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 14), capMat);
        hatch.position.set(0, spec.width * 0.42, 0);
        group.add(tagShell(hatch, palette.color));

        // Discharge pipework under one end.
        const pipeMat = steelMaterial(0x94a3b8, 0.3, 0.9);
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, spec.width * 0.8, 10), pipeMat);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.set(spec.length * 0.34, -spec.height * 0.28, 0);
        group.add(pipe);

        addTraitDecals(group, spec, ['hazmat']);
        addCorners(group, spec.length, spec.height, spec.width);
    }

    function buildCrate(group, spec, palette) {
        const woodMat = new THREE.MeshStandardMaterial({ color: 0xb08d57, roughness: 0.92, metalness: 0.03 });
        woodMat.userData = { baseColor: 0xb08d57 };
        if (T) T.applySkin(woodMat, T.timber(), spec.length / 2.4, spec.height / 2.4, 1.0);

        const body = new THREE.Mesh(new THREE.BoxGeometry(spec.length, spec.height, spec.width), woodMat);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(tagShell(body, 0xb08d57));

        const bandMat = steelMaterial(0x53637a, 0.35, 0.85);

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

        // Corner brackets, where a crate actually takes its knocks.
        const bracketMat = steelMaterial(0x64748b, 0.4, 0.8);
        const bracketGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        [-1, 1].forEach(function (sx) {
            [-1, 1].forEach(function (sy) {
                [-1, 1].forEach(function (sz) {
                    const b = new THREE.Mesh(bracketGeo, bracketMat);
                    b.position.set(
                        sx * (spec.length / 2 - 0.18),
                        sy * (spec.height / 2 - 0.18),
                        sz * (spec.width / 2 - 0.18)
                    );
                    group.add(b);
                });
            });
        });

        // Skids underneath — this is breakbulk, it arrives on timber.
        const skidGeo = new THREE.BoxGeometry(spec.length * 0.96, 0.18, 0.3);
        const skidMat = new THREE.MeshStandardMaterial({ color: 0x8a5a24, roughness: 0.95 });
        skidMat.userData = { fixedColor: true };
        if (T) T.applySkin(skidMat, T.timber(), spec.length / 2.0, 0.3, 0.8);
        [-spec.width * 0.32, 0, spec.width * 0.32].forEach(function (z) {
            const skid = new THREE.Mesh(skidGeo, skidMat);
            skid.position.set(0, -spec.height / 2 - 0.09, z);
            skid.castShadow = true;
            group.add(skid);
        });

        addTraitDecals(group, spec, ['fragile']);
    }

    function buildPallet(group, spec, palette) {
        const deckMat = new THREE.MeshStandardMaterial({
            color: palette.color, roughness: palette.roughness, metalness: palette.metalness
        });
        deckMat.userData = { baseColor: palette.color };
        if (T) T.applySkin(deckMat, T.timber(), 1, 1, 0.8);

        const deck = new THREE.Mesh(new THREE.BoxGeometry(spec.length, 0.15, spec.width), deckMat);
        deck.position.y = -spec.height / 2 + 0.075;
        deck.castShadow = true;
        deck.receiveShadow = true;
        group.add(tagShell(deck, palette.color));

        // Bearer blocks, the bit that makes a pallet a pallet.
        const blockMat = new THREE.MeshStandardMaterial({ color: 0x9a7a48, roughness: 0.95 });
        blockMat.userData = { fixedColor: true };
        if (T) T.applySkin(blockMat, T.timber(), 0.6, 0.6, 0.7);
        const blockGeo = new THREE.BoxGeometry(0.16, 0.09, spec.width);
        [-0.42, 0, 0.42].forEach(function (t) {
            const block = new THREE.Mesh(blockGeo, blockMat);
            block.position.set(t * spec.length, -spec.height / 2 + 0.005, 0);
            group.add(block);
        });

        const boxMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c, roughness: 0.8 });
        boxMat.userData = { fixedColor: true };
        if (T) T.applySkin(boxMat, T.timber(), 0.8, 0.8, 0.7);
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
        if (T) T.applySkin(floorMat, T.treadPlate(), spec.length / TREAD_TILE, spec.width / TREAD_TILE, 1.0);

        const postMat = steelMaterial(0x1e293b, 0.4, 0.75);
        if (T) T.applySkin(postMat, T.boltedPlate(), 0.4, spec.height / PLATE_TILE, 0.8);

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

        // Lashing rings down both sills.
        const ringMat = steelMaterial(0x8b98ab, 0.3, 0.9);
        const ringGeo = new THREE.TorusGeometry(0.11, 0.03, 6, 12);
        [-1, 1].forEach(function (sz) {
            [-0.3, 0, 0.3].forEach(function (t) {
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.position.set(t * spec.length, -spec.height / 2 + 0.36, sz * (spec.width / 2 - 0.06));
                ring.rotation.y = Math.PI / 2;
                group.add(ring);
            });
        });

        addCorners(group, spec.length, spec.height, spec.width);
    }

    /* ── masked machinery modules (L, T, anything else with a mask) ────── */

    const outlineCache = {};

    /**
     * Boundary polygon of a masked footprint, in metres, centred on the piece
     * origin and wound counter-clockwise.
     *
     * Every cell contributes its four walls; a wall shared with a neighbour
     * shows up twice, once in each direction, and the two cancel. What survives
     * is exactly the silhouette — which is the whole point. Drawing a masked
     * piece as one box per cell is what made the L and the T read as three
     * loose crates instead of one machine.
     *
     * Points live in the extrusion's own plane, where the second coordinate `w`
     * is the negated grid Z; a mesh built from them is rotated -90° about X, so
     * `w` lands back on -Z and the piece sits exactly where the grid says.
     *
     * @param {object} spec a cargo type with a `mask`
     * @returns {{points: THREE.Vector2[], convex: boolean[]}}
     */
    function maskOutline(spec) {
        if (outlineCache[spec.id]) return outlineCache[spec.id];

        const edges = {};
        function ekey(a, b) { return a[0] + ',' + a[1] + '>' + b[0] + ',' + b[1]; }
        function addEdge(a, b) {
            const rev = ekey(b, a);
            if (edges[rev]) delete edges[rev];
            else edges[ekey(a, b)] = [a, b];
        }

        spec.mask.forEach(function (p) {
            const x0 = p[0], x1 = p[0] + 1;
            const w0 = -(p[1] + 1), w1 = -p[1];
            addEdge([x0, w0], [x1, w0]);
            addEdge([x1, w0], [x1, w1]);
            addEdge([x1, w1], [x0, w1]);
            addEdge([x0, w1], [x0, w0]);
        });

        const next = {};
        Object.keys(edges).forEach(function (k) {
            const e = edges[k];
            next[e[0][0] + ',' + e[0][1]] = e[1];
        });

        const startKey = Object.keys(next)[0];
        const start = startKey.split(',').map(Number);
        const loop = [start];
        let cur = next[startKey];
        let guard = 0;
        while (cur && (cur[0] !== start[0] || cur[1] !== start[1]) && guard++ < 512) {
            loop.push(cur);
            cur = next[cur[0] + ',' + cur[1]];
        }

        // Drop the mid-points of straight runs: a bevelled extrusion of a
        // polygon with collinear vertices grows spikes at the redundant ones.
        const trimmed = loop.filter(function (p, i) {
            const prev = loop[(i - 1 + loop.length) % loop.length];
            const nxt = loop[(i + 1) % loop.length];
            const ax = p[0] - prev[0], ay = p[1] - prev[1];
            const bx = nxt[0] - p[0], by = nxt[1] - p[1];
            return ax * by - ay * bx !== 0;
        });

        const cellX = C.GRID.CELL_X;
        const cellZ = C.GRID.CELL_Z;
        const points = trimmed.map(function (p) {
            return new THREE.Vector2(
                (p[0] - spec.cells[0] / 2) * cellX,
                (p[1] + spec.cells[1] / 2) * cellZ
            );
        });

        // A left turn on a counter-clockwise loop is an outside corner — the
        // places a real module carries its corner castings.
        const convex = points.map(function (p, i) {
            const prev = points[(i - 1 + points.length) % points.length];
            const nxt = points[(i + 1) % points.length];
            return (p.x - prev.x) * (nxt.y - p.y) - (p.y - prev.y) * (nxt.x - p.x) > 0;
        });

        outlineCache[spec.id] = { points: points, convex: convex };
        return outlineCache[spec.id];
    }

    /**
     * Extrude an outline upward into a solid slab, centred on y = 0.
     *
     * @param {THREE.Vector2[]} points outline, counter-clockwise
     * @param {number} height total height including the bevel
     * @param {number} bevel bevel thickness, 0 for a hard edge
     * @param {number} inset shrink toward the origin, for a proud lip or a kerb
     */
    function extrudeOutline(points, height, bevel, inset) {
        const scale = 1 + (inset || 0);
        const shape = new THREE.Shape(points.map(function (p) {
            return new THREE.Vector2(p.x * scale, p.y * scale);
        }));

        const depth = Math.max(0.02, height - bevel * 2);
        const geo = new THREE.ExtrudeGeometry(shape, {
            depth: depth,
            bevelEnabled: bevel > 0,
            bevelThickness: bevel,
            bevelSize: bevel,
            bevelSegments: 1,
            curveSegments: 1
        });

        // Extruded along +Z; stand it up so the caps become top and bottom.
        geo.rotateX(-Math.PI / 2);
        geo.translate(0, -depth / 2, 0);
        return geo;
    }

    /**
     * Machinery module: an L or a T, built as one bevelled steel casting rather
     * than a handful of cubes pushed together.
     *
     * Everything hangs off the silhouette — the hazard skirt, the tread-plate
     * deck, the kerb and the corner castings all follow the same polygon — so
     * the notch reads as a deliberate shape from every angle.
     */
    function buildModule(group, spec, palette) {
        const outline = maskOutline(spec);
        const points = outline.points;
        const h = spec.height;

        const SKIRT = 0.42;   // hazard band around the foot
        const KERB = 0.13;    // rim around the deck

        /* Body. Cap material is the walkable deck, wall material the painted
           flank — ExtrudeGeometry hands out group 0 for the caps and group 1
           for the walls, which is exactly the split we want. */
        const wallMat = shellMaterial(palette);
        const deckMat = shellMaterial(palette);
        deckMat.metalness = Math.min(1, palette.metalness + 0.35);
        if (T) {
            T.applySkin(wallMat, T.boltedPlate(), 1 / PLATE_TILE, 1 / PLATE_TILE, 1.0);
            T.applySkin(deckMat, T.treadPlate(), 1 / TREAD_TILE, 1 / TREAD_TILE, 1.0);
        }

        const body = new THREE.Mesh(extrudeOutline(points, h, 0.07, 0), [deckMat, wallMat]);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(tagShell(body, palette.color));

        // Hazard skirt around the foot — a real machinery module is banded so
        // nobody drives a reach stacker into the overhang.
        if (T) {
            const stripeMat = steelMaterial(0xffffff, 0.55, 0.25);
            // The chevron sheet is 4:1, so one band of it covers 4× its height.
            T.applySkin(stripeMat, { map: T.hazardStripe() }, 1 / (SKIRT * 4), 1 / SKIRT, 0);
            stripeMat.roughness = 0.55;

            const capMat = steelMaterial(0x2b3444, 0.5, 0.7);
            const skirt = new THREE.Mesh(
                extrudeOutline(points, SKIRT, 0, 0.014),
                [capMat, stripeMat]
            );
            skirt.position.y = -h / 2 + SKIRT / 2;
            skirt.castShadow = true;
            group.add(skirt);
        }

        addDeckKerb(group, points, h, KERB);

        // Corner castings on the outside corners of the silhouette.
        const castingMat = steelMaterial(0x232d3d, 0.34, 0.85);
        if (T) T.applySkin(castingMat, T.boltedPlate(), 2.5, 2.5, 0.6);
        const castingGeo = new THREE.BoxGeometry(0.34, 0.30, 0.34);
        points.forEach(function (p, i) {
            if (!outline.convex[i]) return;
            [-1, 1].forEach(function (sy) {
                const casting = new THREE.Mesh(castingGeo, castingMat);
                casting.position.set(p.x * 0.985, sy * (h / 2 - 0.16), -p.y * 0.985);
                casting.castShadow = true;
                group.add(casting);
            });
        });

        addModuleDetails(group, spec, h);
    }

    /**
     * A raised steel kerb running the whole silhouette.
     *
     * One beam per outline edge rather than a ring extrusion: an L's outline
     * has a reflex corner sitting exactly on the piece origin, so any ring built
     * by shrinking the polygon toward the centre collapses on itself right
     * there. Beams are exact for any mask, and the top-down camera this game is
     * played from gets a hard dark outline around every notch.
     *
     * @param {THREE.Vector2[]} points outline in extrusion space (world z = -y)
     * @param {number} h piece height
     * @param {number} kerb kerb height
     */
    function addDeckKerb(group, points, h, kerb) {
        const WIDTH = 0.18;
        const BEVEL = 0.07;   // the body's top cap is inset by its bevel

        const mat = steelMaterial(0x27313f, 0.42, 0.8);
        if (T) T.applySkin(mat, T.treadPlate(), 1 / TREAD_TILE, 1 / kerb, 0.7);

        // Centroid of the outline, used to tell inward from outward. Every mask
        // in the catalogue is a rectilinear blob whose vertex average lands
        // inside it, which is all this test needs.
        let cx = 0, cz = 0;
        points.forEach(function (p) { cx += p.x; cz += -p.y; });
        cx /= points.length;
        cz /= points.length;

        points.forEach(function (p, i) {
            const q = points[(i + 1) % points.length];
            const ax = p.x, az = -p.y;
            const bx = q.x, bz = -q.y;
            const dx = bx - ax, dz = bz - az;
            const len = Math.sqrt(dx * dx + dz * dz);
            if (len < 1e-4) return;

            const mx = (ax + bx) / 2, mz = (az + bz) / 2;
            // Edge normal, flipped to whichever side the centroid is on.
            let nx = dz / len, nz = -dx / len;
            if (nx * (mx - cx) + nz * (mz - cz) > 0) { nx = -nx; nz = -nz; }

            const off = BEVEL + WIDTH / 2;
            // Over-length by one width so the corners close on themselves.
            const beam = new THREE.Mesh(new THREE.BoxGeometry(len + WIDTH, kerb, WIDTH), mat);
            beam.position.set(mx + nx * off, h / 2 - kerb / 2 + 0.04, mz + nz * off);
            beam.rotation.y = Math.atan2(-dz, dx);
            beam.castShadow = true;
            group.add(beam);
        });
    }

    /**
     * The machinery a machinery module is presumably full of: lifting eyes on
     * every cell, a vent bank, a junction box, a pipe coil.
     *
     * Nothing here rises more than 0.22 m above the deck. A tier is 2.90 m and
     * these pieces are 2.59 m tall, so that is the whole clearance budget before
     * a detail starts poking through whatever is stacked on top.
     */
    function addModuleDetails(group, spec, h) {
        const cellX = C.GRID.CELL_X;
        const cellZ = C.GRID.CELL_Z;
        const top = h / 2;

        const steel = steelMaterial(0x9aa6b6, 0.32, 0.9);
        const dark = steelMaterial(0x2f3a4b, 0.45, 0.75);
        if (T) T.applySkin(dark, T.boltedPlate(), 1.6, 1.6, 0.8);

        const padGeo = new THREE.BoxGeometry(0.42, 0.06, 0.42);
        const eyeGeo = new THREE.TorusGeometry(0.11, 0.032, 6, 14);

        spec.mask.forEach(function (cell, index) {
            const cx = (cell[0] + 0.5 - spec.cells[0] / 2) * cellX;
            const cz = (cell[1] + 0.5 - spec.cells[1] / 2) * cellZ;

            // Lifting eye, one per cell.
            const pad = new THREE.Mesh(padGeo, dark);
            pad.position.set(cx, top + 0.03, cz);
            group.add(pad);

            const eye = new THREE.Mesh(eyeGeo, steel);
            eye.position.set(cx, top + 0.15, cz);
            group.add(eye);

            if (index === 0) {
                // Vent bank — louvred, and the piece's "front".
                const louvre = new THREE.BoxGeometry(cellX * 0.62, 0.045, 0.1);
                for (let i = 0; i < 5; i++) {
                    const slat = new THREE.Mesh(louvre, dark);
                    slat.position.set(cx, top + 0.06, cz + 0.85 - i * 0.2);
                    slat.rotation.x = -0.5;
                    group.add(slat);
                }
            } else if (index === 1) {
                // Junction box with a conduit run.
                const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.34), dark);
                box.position.set(cx - 0.6, top + 0.10, cz + 0.5);
                box.castShadow = true;
                group.add(box);

                const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, cellX * 0.8, 8), steel);
                conduit.rotation.z = Math.PI / 2;
                conduit.position.set(cx, top + 0.07, cz + 0.5);
                group.add(conduit);
            } else {
                // Pipe coil.
                const coil = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 8, 20), steel);
                coil.rotation.x = Math.PI / 2;
                coil.position.set(cx, top + 0.09, cz);
                group.add(coil);
            }
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
        const key = C.CARRIERS[carrierKey] ? carrierKey : 'maersk';
        const palette = C.CARRIERS[key];

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
        else if (spec.mask) buildModule(group, spec, palette);
        else buildIsoBox(group, spec, palette, traits, key);

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

        function addBody(geometry, x, z) {
            const box = new THREE.Mesh(geometry, mat);
            box.position.set(x, 0, z);
            group.add(box);
            bodies.push(box);

            const line = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 30), edgeMat);
            line.position.copy(box.position);
            group.add(line);
            edges.push(line);
        }

        if (spec.mask) {
            // The same silhouette the piece itself is extruded from, so the
            // preview has the notch the module has — you aim an L-block by its
            // corner, not by its bounding box.
            const rotated = ((rot | 0) % 2) !== 0;
            const outline = maskOutline(spec);
            const geo = extrudeOutline(outline.points, spec.height, 0.05, 0);
            if (rotated) {
                // The footprint mask transposes on rotation; the mesh answers
                // that with the same quarter turn the yard gives a real unit.
                geo.rotateY(Math.PI / 2);
            }
            addBody(geo, 0, 0);
        } else {
            addBody(new THREE.BoxGeometry(
                sp[0] * C.GRID.CELL_X * 0.94, spec.height, sp[1] * C.GRID.CELL_Z * 0.94
            ), 0, 0);
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
                if (!child.isMesh) return;
                if (!child.userData.isShell && !child.userData.isSkin) return;
                materialsOf(child).forEach(function (mat) {
                    // The livery decals are transparent to begin with; remember
                    // that on the way in or turning X-ray off welds them shut.
                    if (mat.userData.wasTransparent === undefined) {
                        mat.userData.wasTransparent = mat.transparent;
                    }
                    mat.transparent = enable || mat.userData.wasTransparent;
                    mat.opacity = enable ? 0.28 : 1.0;
                    mat.needsUpdate = true;
                });
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
                if (!child.isMesh || !child.userData.isShell) return;
                materialsOf(child).forEach(function (mat) {
                    if (mat.userData && mat.userData.fixedColor) return;
                    mat.color.setHex(enable ? heat : (child.userData.originalColor || 0x00a0b0));
                    mat.needsUpdate = true;
                });
            });
        });
    }

    /**
     * Turn a real unit mesh into a see-through preview of itself.
     *
     * Modes that hover a full unit under the cursor used to clone each mesh's
     * material inline. A box now carries one material per face, so that has to
     * go through `materialsOf()` — and it belongs here anyway, beside the code
     * that decided a mesh may hold an array in the first place.
     *
     * @param {THREE.Object3D} group
     * @param {number} opacity
     */
    function makeTranslucent(group, opacity) {
        group.traverse(function (child) {
            if (!child.isMesh || !child.material) return;
            const copies = materialsOf(child).map(function (mat) {
                const copy = mat.clone();
                copy.transparent = true;
                copy.opacity = opacity;
                copy.depthWrite = false;
                return copy;
            });
            child.material = Array.isArray(child.material) ? copies : copies[0];
        });
        return group;
    }

    /** Free every geometry and material under a group before dropping it. */
    function disposeGroup(group) {
        group.traverse(function (child) {
            if (!child.isMesh && !child.isLine && !child.isLineSegments) return;
            if (child.geometry) child.geometry.dispose();
            materialsOf(child).forEach(function (mat) { mat.dispose(); });
        });
    }

    Cargo3D.ContainerMeshes = {
        createUnitMesh: createUnitMesh,
        createGhostMesh: createGhostMesh,
        maskOutline: maskOutline,
        makeTranslucent: makeTranslucent,
        setXRay: setXRay,
        setHeatmap: setHeatmap,
        disposeGroup: disposeGroup
    };
})(window);
