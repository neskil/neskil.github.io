/**
 * render/yard.js — the bay: painted slots, placed units, ghost, envelope.
 *
 * This is the only place that knows how a grid coordinate becomes a world
 * position. Nothing else should be doing that arithmetic.
 *
 * The bay is centred on the world origin. Cell (0,0) is at -X/-Z.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const C = Cargo3D.Constants;
    const Meshes = Cargo3D.ContainerMeshes;

    function YardView(sceneView, bay) {
        this.sceneView = sceneView;
        this.bay = bay;
        this.root = new THREE.Group();
        this.unitMeshes = {};   // placement id → THREE.Group
        this.ghost = null;
        this.ghostType = null;
        this.ghostRot = 0;

        this.buildBay();
        this.buildEnvelope();
        this.buildDropColumn();
        sceneView.add(this.root);
    }

    /* ── coordinate transforms ─────────────────────────────────────────── */

    /** Centre of a unit's footprint, in world metres. */
    YardView.prototype.cellToWorld = function (x, z, tier, typeId, rot, target) {
        const sp = C.span(typeId, rot);
        const spec = C.CARGO_TYPES[typeId] || C.CARGO_TYPES['20ft'];
        const out = target || new THREE.Vector3();
        out.set(
            (x + sp[0] / 2 - this.bay.cols / 2) * C.GRID.CELL_X,
            tier * C.GRID.TIER_H + spec.height / 2,
            (z + sp[1] / 2 - this.bay.rows / 2) * C.GRID.CELL_Z
        );
        return out;
    };

    /** Ground point → the footprint origin that centres the unit on the cursor. */
    YardView.prototype.worldToCellOrigin = function (point, typeId, rot) {
        const sp = C.span(typeId, rot);
        const fx = point.x / C.GRID.CELL_X + this.bay.cols / 2;
        const fz = point.z / C.GRID.CELL_Z + this.bay.rows / 2;

        let x = Math.round(fx - sp[0] / 2);
        let z = Math.round(fz - sp[1] / 2);

        x = Math.max(0, Math.min(this.bay.cols - sp[0], x));
        z = Math.max(0, Math.min(this.bay.rows - sp[1], z));
        return { x: x, z: z };
    };

    /** World metres → the cell containing them. May fall outside the bay. */
    YardView.prototype.worldToCell = function (x, z) {
        return {
            x: Math.floor(x / C.GRID.CELL_X + this.bay.cols / 2),
            z: Math.floor(z / C.GRID.CELL_Z + this.bay.rows / 2)
        };
    };

    /** True when a ground point is inside the painted bay (plus a slot of slack). */
    YardView.prototype.isOverBay = function (point) {
        const halfW = (this.bay.cols / 2 + 0.75) * C.GRID.CELL_X;
        const halfD = (this.bay.rows / 2 + 0.75) * C.GRID.CELL_Z;
        return Math.abs(point.x) <= halfW && Math.abs(point.z) <= halfD;
    };

    /* ── bay furniture ─────────────────────────────────────────────────── */

    YardView.prototype.buildBay = function () {
        const w = this.bay.cols * C.GRID.CELL_X;
        const d = this.bay.rows * C.GRID.CELL_Z;

        const slabMat = new THREE.MeshStandardMaterial({ color: 0x233045, roughness: 0.9, metalness: 0.1 });
        if (Cargo3D.Textures) {
            // Poured in 6 m bays, which is also roughly two slots — the joints
            // line up with the paint instead of fighting it.
            Cargo3D.Textures.applySkin(slabMat, Cargo3D.Textures.concrete(),
                (w + 1.6) / 6, (d + 1.6) / 6, 0.8);
        }

        const slab = new THREE.Mesh(new THREE.PlaneGeometry(w + 1.6, d + 1.6), slabMat);
        slab.rotation.x = -Math.PI / 2;
        slab.position.y = 0.02;
        slab.receiveShadow = true;
        this.root.add(slab);

        // Painted slot lines.
        const pts = [];
        for (let i = 0; i <= this.bay.cols; i++) {
            const x = (i - this.bay.cols / 2) * C.GRID.CELL_X;
            pts.push(x, 0.035, -d / 2, x, 0.035, d / 2);
        }
        for (let j = 0; j <= this.bay.rows; j++) {
            const z = (j - this.bay.rows / 2) * C.GRID.CELL_Z;
            pts.push(-w / 2, 0.035, z, w / 2, 0.035, z);
        }
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        this.slotLines = new THREE.LineSegments(
            lineGeo,
            new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.5 })
        );
        this.root.add(this.slotLines);

        // Hazard stripe around the perimeter.
        const stripeMat = new THREE.MeshStandardMaterial({
            color: 0xfacc15, roughness: 0.7, emissive: 0x422006, emissiveIntensity: 0.4
        });
        const stripe = 0.35;
        [[w + 1.6, stripe, 0, -(d / 2 + 0.8)], [w + 1.6, stripe, 0, d / 2 + 0.8]].forEach(function (s) {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(s[0], 0.06, s[1]), stripeMat);
            bar.position.set(s[2], 0.04, s[3]);
            this.root.add(bar);
        }, this);
        [[stripe, d + 1.6, -(w / 2 + 0.8), 0], [stripe, d + 1.6, w / 2 + 0.8, 0]].forEach(function (s) {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(s[0], 0.06, s[1]), stripeMat);
            bar.position.set(s[2], 0.04, s[3]);
            this.root.add(bar);
        }, this);

        // Corner posts, one tier tall per allowed tier — a readable height gauge.
        // Galvanised rather than chrome — at metalness 0.6 the environment map
        // turns these into four bright white rods standing over the bay.
        const postMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.25, roughness: 0.6 });
        const bandMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0c4a6e, emissiveIntensity: 0.8 });
        const postH = this.bay.tiers * C.GRID.TIER_H;

        // Kept slim and shadowless: they are a reference for the tier limit,
        // not scenery, and long cast shadows across the slab read as clutter.
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, postH, 8), postMat);
            post.position.set(s[0] * (w / 2 + 0.75), postH / 2, s[1] * (d / 2 + 0.75));
            this.root.add(post);

            for (let t = 1; t <= this.bay.tiers; t++) {
                const band = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 8), bandMat);
                band.position.set(post.position.x, t * C.GRID.TIER_H, post.position.z);
                this.root.add(band);
            }
        }, this);
    };

    /** Wireframe box around everything placed — the score, drawn in the scene. */
    YardView.prototype.buildEnvelope = function () {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        this.envelope = new THREE.LineSegments(
            new THREE.EdgesGeometry(geo),
            new THREE.LineBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.75 })
        );
        this.envelope.visible = false;
        this.envelopeGeo = geo;
        this.root.add(this.envelope);
    };

    YardView.prototype.updateEnvelope = function (bounds) {
        if (!bounds) { this.envelope.visible = false; return; }

        const minX = (bounds.minX - this.bay.cols / 2) * C.GRID.CELL_X;
        const maxX = (bounds.maxX + 1 - this.bay.cols / 2) * C.GRID.CELL_X;
        const minZ = (bounds.minZ - this.bay.rows / 2) * C.GRID.CELL_Z;
        const maxZ = (bounds.maxZ + 1 - this.bay.rows / 2) * C.GRID.CELL_Z;
        const minY = bounds.minTier * C.GRID.TIER_H;
        const maxY = (bounds.maxTier + 1) * C.GRID.TIER_H;

        this.envelope.scale.set(maxX - minX, maxY - minY, maxZ - minZ);
        this.envelope.position.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
        this.envelope.visible = true;
    };

    YardView.prototype.setEnvelopeVisible = function (visible) {
        this.envelopeAllowed = visible;
        if (!visible) this.envelope.visible = false;
    };

    /** Translucent shaft from the floor to the ghost, so the drop reads in 3D. */
    YardView.prototype.buildDropColumn = function () {
        this.dropColumn = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.10, depthWrite: false })
        );
        this.dropColumn.visible = false;
        this.root.add(this.dropColumn);
    };

    /* ── ghost preview ─────────────────────────────────────────────────── */

    YardView.prototype.setGhostType = function (typeId, rot) {
        if (this.ghost && this.ghostType === typeId && this.ghostRot === rot) return;
        this.clearGhost();
        if (!typeId) return;

        this.ghost = Meshes.createGhostMesh(typeId, rot);
        this.ghost.visible = false; // stays hidden until moveGhost positions it
        this.ghostType = typeId;
        this.ghostRot = rot;
        this.root.add(this.ghost);
    };

    YardView.prototype.moveGhost = function (x, z, tier, legal) {
        if (!this.ghost) return;

        this.cellToWorld(x, z, tier, this.ghostType, this.ghostRot, this.ghost.position);
        this.ghost.visible = true;

        const colour = legal ? 0x34d399 : 0xf87171;
        this.ghost.userData.material.color.setHex(colour);
        this.ghost.userData.material.emissive.setHex(legal ? 0x065f46 : 0x7f1d1d);
        this.ghost.userData.edgeMaterial.color.setHex(legal ? 0xecfdf5 : 0xfee2e2);

        const sp = C.span(this.ghostType, this.ghostRot);
        const height = tier * C.GRID.TIER_H;
        this.dropColumn.scale.set(sp[0] * C.GRID.CELL_X * 0.92, Math.max(height, 0.02), sp[1] * C.GRID.CELL_Z * 0.92);
        this.dropColumn.position.set(this.ghost.position.x, height / 2, this.ghost.position.z);
        this.dropColumn.material.color.setHex(colour);
        this.dropColumn.visible = height > 0.05;
    };

    YardView.prototype.hideGhost = function () {
        if (this.ghost) this.ghost.visible = false;
        this.dropColumn.visible = false;
    };

    YardView.prototype.clearGhost = function () {
        if (!this.ghost) return;
        this.root.remove(this.ghost);
        Meshes.disposeGroup(this.ghost);
        this.ghost = null;
        this.ghostType = null;
    };

    /* ── placed units ──────────────────────────────────────────────────── */

    /**
     * Add the mesh for a committed placement. Units drop in over ~0.22 s; the
     * caller does not need to wait, the animation is driven by update().
     */
    YardView.prototype.addUnit = function (placement) {
        const unit = placement.unit;
        const mesh = Meshes.createUnitMesh(placement.type, unit.carrier, unit.traits);

        const target = this.cellToWorld(placement.x, placement.z, placement.tier, placement.type, placement.rot);
        mesh.rotation.y = placement.rot % 2 === 0 ? 0 : Math.PI / 2;
        mesh.position.copy(target);
        mesh.position.y += 3.2;
        mesh.userData.dropTarget = target.y;
        mesh.userData.dropping = true;
        mesh.userData.placementId = placement.id;
        mesh.userData.tier = placement.tier;

        this.root.add(mesh);
        this.unitMeshes[placement.id] = mesh;
        return mesh;
    };

    /**
     * Re-file a unit that the grid has rebuilt somewhere else.
     *
     * Cascade ships a full tier by tearing the survivors down and placing them
     * again a tier lower, which mints new placement ids. The mesh is the same
     * mesh, so it is re-keyed rather than replaced, and the existing drop
     * animation carries it down — update() only ever moves a unit toward its
     * target, which is exactly what settling after a clear is.
     *
     * @param {number} oldId the placement id the mesh is filed under
     * @param {object} placement its replacement record
     * @returns {THREE.Group|null}
     */
    YardView.prototype.reseatUnit = function (oldId, placement) {
        const mesh = this.unitMeshes[oldId];
        if (!mesh) return null;

        if (oldId !== placement.id) {
            delete this.unitMeshes[oldId];
            this.unitMeshes[placement.id] = mesh;
        }
        mesh.userData.placementId = placement.id;
        mesh.userData.tier = placement.tier;

        const target = this.cellToWorld(placement.x, placement.z, placement.tier, placement.type, placement.rot);
        mesh.userData.dropTarget = target.y;
        if (mesh.position.y > target.y + 0.01) {
            mesh.userData.dropping = true;
        } else {
            mesh.position.copy(target);
            mesh.userData.dropping = false;
        }
        return mesh;
    };

    YardView.prototype.removeUnit = function (placementId) {
        const mesh = this.unitMeshes[placementId];
        if (!mesh) return;
        this.root.remove(mesh);
        Meshes.disposeGroup(mesh);
        delete this.unitMeshes[placementId];
    };

    YardView.prototype.meshList = function () {
        const self = this;
        return Object.keys(this.unitMeshes).map(function (id) { return self.unitMeshes[id]; });
    };

    /** Every mesh under the units, for raycasting against placed cargo. */
    YardView.prototype.pickables = function () {
        const out = [];
        this.meshList().forEach(function (group) {
            group.traverse(function (child) {
                if (child.isMesh && !child.userData.isInterior) {
                    child.userData.unitGroup = group;
                    out.push(child);
                }
            });
        });
        return out;
    };

    YardView.prototype.update = function (delta) {
        const step = Math.min(delta, 0.05) * 22;
        const meshes = this.meshList();
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (!mesh.userData.dropping) continue;
            const dy = mesh.position.y - mesh.userData.dropTarget;
            if (dy <= 0.01) {
                mesh.position.y = mesh.userData.dropTarget;
                mesh.userData.dropping = false;
                if (typeof this.onLand === 'function') {
                    this.onLand(mesh.position.x, mesh.position.y, mesh.position.z);
                }
            } else {
                mesh.position.y -= Math.max(dy * step * 0.5, 0.04);
                if (mesh.position.y <= mesh.userData.dropTarget) {
                    mesh.position.y = mesh.userData.dropTarget;
                    mesh.userData.dropping = false;
                    if (typeof this.onLand === 'function') {
                        this.onLand(mesh.position.x, mesh.position.y, mesh.position.z);
                    }
                }
            }
        }
    };

    YardView.prototype.clearUnits = function () {
        const self = this;
        Object.keys(this.unitMeshes).forEach(function (id) { self.removeUnit(Number(id)); });
        this.unitMeshes = {};
        this.updateEnvelope(null);
    };

    YardView.prototype.dispose = function () {
        this.clearUnits();
        this.clearGhost();
        this.sceneView.remove(this.root);
        Meshes.disposeGroup(this.root);
    };

    /* ── the lattice, without a bay ────────────────────────────────────── */

    /**
     * The same slot lattice a bay is painted with, for the modes that have no
     * bay. The physics yard offers mission-style grid placement but owns no
     * YardView, and this file is the only one allowed to turn cells into metres.
     *
     * A footprint spanning an even number of cells centres on a slot line, an
     * odd number on a slot centre — which is why the half-span is taken out
     * before rounding and added back after.
     */
    const GridLattice = {
        /** Snap a free ground point to the footprint centre of the slot under it. */
        snap: function (point, typeId, rot, target) {
            const sp = C.span(typeId, rot);
            const out = target || new THREE.Vector3();
            out.set(
                (Math.round(point.x / C.GRID.CELL_X - sp[0] / 2) + sp[0] / 2) * C.GRID.CELL_X,
                0,
                (Math.round(point.z / C.GRID.CELL_Z - sp[1] / 2) + sp[1] / 2) * C.GRID.CELL_Z
            );
            return out;
        },

        /** Footprint of a type in metres, at the given rotation. */
        footprint: function (typeId, rot) {
            const sp = C.span(typeId, rot);
            return { x: sp[0] * C.GRID.CELL_X, z: sp[1] * C.GRID.CELL_Z };
        }
    };

    Cargo3D.YardView = YardView;
    Cargo3D.GridLattice = GridLattice;
})(window);
