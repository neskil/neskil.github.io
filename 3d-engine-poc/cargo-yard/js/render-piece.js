(function (window) {
    'use strict';

    // Turns grid entries into meshes, and keeps the scene in step with the
    // grid — one mesh per piece id, created on 'game:placed', destroyed on
    // 'game:removed'. Also owns the ghost preview, the x-ray and the heatmap.
    //
    // Two things the original POC got expensive: it built ~50 rib meshes per
    // container (a 40ft alone was 50 draw calls), and it never disposed
    // anything it deleted. Corrugation is now one greyscale texture on one
    // box, tinted by material colour — which also makes the heatmap a
    // one-line colour swap instead of a lossy overwrite.
    const CY = window.CY = window.CY || {};

    const geoCache = Object.create(null);
    const texCache = Object.create(null);
    const meshes = Object.create(null);   // grid piece id -> THREE.Group

    let group = null;      // parent for all placed pieces
    let ghost = null;      // current ghost group
    let ghostKey = '';
    let footprint = null;  // wireframe box under the ghost
    let xray = false;
    let heatmap = false;

    function geo(key, make) {
        if (!geoCache[key]) geoCache[key] = make();
        return geoCache[key];
    }

    function box(w, h, d) {
        return geo('box:' + w.toFixed(3) + ':' + h.toFixed(3) + ':' + d.toFixed(3), function () {
            return new THREE.BoxGeometry(w, h, d);
        });
    }

    // Greyscale corrugation, drawn once and tinted per carrier. `ribs` is how
    // many corrugations across the face.
    function corrugation(ribs) {
        const key = 'corr:' + ribs;
        if (texCache[key]) return texCache[key];
        const c = document.createElement('canvas');
        c.width = 256; c.height = 64;
        const g = c.getContext('2d');
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, c.width, c.height);
        const step = c.width / ribs;
        for (let i = 0; i < ribs; i++) {
            const x = i * step;
            const grd = g.createLinearGradient(x, 0, x + step, 0);
            grd.addColorStop(0.00, 'rgba(0,0,0,0.28)');
            grd.addColorStop(0.35, 'rgba(255,255,255,0.10)');
            grd.addColorStop(0.65, 'rgba(255,255,255,0.10)');
            grd.addColorStop(1.00, 'rgba(0,0,0,0.28)');
            g.fillStyle = grd;
            g.fillRect(x, 0, step, c.height);
        }
        // Top and bottom rails.
        g.fillStyle = 'rgba(0,0,0,0.45)';
        g.fillRect(0, 0, c.width, 4);
        g.fillRect(0, c.height - 4, c.width, 4);

        const tex = new THREE.CanvasTexture(c);
        texCache[key] = tex;
        return tex;
    }

    function timber() {
        const key = 'timber';
        if (texCache[key]) return texCache[key];
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const g = c.getContext('2d');
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, 64, 64);
        g.strokeStyle = 'rgba(0,0,0,0.30)';
        g.lineWidth = 3;
        g.strokeRect(2, 2, 60, 60);
        g.beginPath(); g.moveTo(2, 32); g.lineTo(62, 32); g.stroke();
        g.strokeStyle = 'rgba(0,0,0,0.18)';
        g.lineWidth = 2;
        g.beginPath(); g.moveTo(2, 2); g.lineTo(62, 62); g.stroke();
        const tex = new THREE.CanvasTexture(c);
        texCache[key] = tex;
        return tex;
    }

    // ── Geometry of a placed piece ──────────────────────────────────────

    // Every piece is drawn inside the cuboid its cells span, so the mesh can
    // never disagree with the occupancy grid about how much room it takes.
    function spanMetres(span) {
        return {
            x: span.x * CY.CELL.x,
            y: span.y * CY.CELL.y,
            z: span.z * CY.CELL.z
        };
    }

    function build(pieceId, cells, opts) {
        opts = opts || {};
        const def = CY.piece(pieceId);
        const palette = CY.CARRIERS[def.carrier] || CY.CARRIERS.maersk;
        const span = CY.grid.span(cells);
        const dim = spanMetres(span);
        const g = new THREE.Group();
        g.userData.pieceId = pieceId;

        if (def.kind === 'container') {
            buildContainer(g, def, palette, span, dim, opts);
        } else {
            buildCrates(g, def, palette, cells, span, opts);
        }

        if (opts.tag === 'priority') addPriorityFlag(g, dim);
        return g;
    }

    function shellMaterial(palette, map, opts) {
        const mat = new THREE.MeshStandardMaterial({
            color: palette.color,
            roughness: palette.roughness,
            metalness: palette.metalness,
            map: map || null
        });
        if (opts.ghost) {
            mat.transparent = true;
            mat.opacity = 0.42;
            mat.depthWrite = false;
        }
        return mat;
    }

    function buildContainer(g, def, palette, span, dim, opts) {
        // Real container dimensions, laid along whichever axis the cells run.
        const alongX = span.x >= span.z;
        const len = def.real ? def.real[0] : dim.x;
        const hgt = def.real ? def.real[1] : dim.y;
        const wid = def.real ? def.real[2] : dim.z;

        const bw = alongX ? len : wid;
        const bd = alongX ? wid : len;
        const ribs = Math.max(6, Math.round(len * 2));

        // Cloned per instance so the repeat count can follow the box length;
        // the clone shares the canvas, so this is cheap.
        const tex = corrugation(ribs).clone();
        tex.needsUpdate = true;

        const mat = shellMaterial(palette, tex, opts);
        mat.userData.disposeMap = true;   // this material owns its clone
        const mesh = new THREE.Mesh(box(bw, hgt, bd), mat);
        mesh.userData.sharedGeometry = true;
        mesh.userData.isShell = true;
        mesh.userData.baseColor = palette.color;
        mesh.castShadow = !opts.ghost;
        mesh.receiveShadow = !opts.ghost;
        g.add(mesh);

        if (opts.ghost) return;

        // Corner castings — cheap, and they are what makes a grey box read as
        // a container from across the yard.
        const cornerGeo = box(0.26, 0.26, 0.26);
        const cornerMat = sharedDark();
        const hx = bw / 2, hy = hgt / 2, hz = bd / 2;
        [-1, 1].forEach(function (sx) {
            [-1, 1].forEach(function (sy) {
                [-1, 1].forEach(function (sz) {
                    const c = new THREE.Mesh(cornerGeo, cornerMat);
                    c.position.set(sx * hx, sy * hy, sz * hz);
                    c.userData.sharedGeometry = true;
                    c.userData.sharedMaterial = true;
                    g.add(c);
                });
            });
        });

        // Interior cargo, only visible with the x-ray on.
        const inner = new THREE.Group();
        inner.userData.isInterior = true;
        inner.visible = xray;
        const drumGeo = geo('drum', function () { return new THREE.CylinderGeometry(0.34, 0.34, 0.95, 10); });
        const crateGeo = box(0.9, 0.9, 0.9);
        const drumMat = sharedDrum();
        const crateMat = sharedCrate();
        const n = Math.max(2, Math.round(len / 1.6));
        for (let i = 0; i < n; i++) {
            const t = (i + 0.5) / n - 0.5;
            const m = new THREE.Mesh(i % 2 ? crateGeo : drumGeo, i % 2 ? crateMat : drumMat);
            m.userData.sharedGeometry = true;
            m.userData.sharedMaterial = true;
            m.position.set(alongX ? t * len * 0.9 : 0, -hgt / 2 + 0.52, alongX ? 0 : t * len * 0.9);
            inner.add(m);
        }
        g.add(inner);
    }

    function buildCrates(g, def, palette, cells, span, opts) {
        const tex = timber();
        const inset = 0.86;
        const w = CY.CELL.x * inset, h = CY.CELL.y * inset, d = CY.CELL.z * inset;
        const mat = shellMaterial(palette, tex, opts);
        mat.map = tex;
        cells.forEach(function (c) {
            const m = new THREE.Mesh(box(w, h, d), mat);
            m.userData.sharedGeometry = true;
            m.userData.isShell = true;
            m.userData.baseColor = palette.color;
            m.castShadow = !opts.ghost;
            m.receiveShadow = !opts.ghost;
            // Cell centres relative to the piece's own span.
            m.position.set(
                (c[0] - (span.x - 1) / 2) * CY.CELL.x,
                (c[1] - (span.y - 1) / 2) * CY.CELL.y,
                (c[2] - (span.z - 1) / 2) * CY.CELL.z
            );
            g.add(m);
        });
    }

    function addPriorityFlag(g, dim) {
        const poleGeo = geo('flagpole', function () { return new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6); });
        const flagGeo = box(0.9, 0.5, 0.05);
        const pole = new THREE.Mesh(poleGeo, sharedDark());
        pole.userData.sharedGeometry = true;
        pole.userData.sharedMaterial = true;
        pole.position.set(0, dim.y / 2 + 0.8, 0);
        const flag = new THREE.Mesh(flagGeo, sharedFlag());
        flag.userData.sharedGeometry = true;
        flag.userData.sharedMaterial = true;
        flag.position.set(0.45, dim.y / 2 + 1.3, 0);
        g.add(pole); g.add(flag);
    }

    let _dark, _drum, _crate, _flag;
    function sharedDark() {
        if (!_dark) _dark = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8 });
        return _dark;
    }
    function sharedDrum() {
        if (!_drum) _drum = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.6 });
        return _drum;
    }
    function sharedCrate() {
        if (!_crate) _crate = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
        return _crate;
    }
    function sharedFlag() {
        if (!_flag) _flag = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.6, emissive: 0x7f1d1d });
        return _flag;
    }

    // ── Placement in world space ────────────────────────────────────────

    function centreOf(cells, ox, oy, oz, yard) {
        const span = CY.grid.span(cells);
        const min = CY.cellToWorld(ox, oy, oz, yard);
        const max = CY.cellToWorld(ox + span.x - 1, oy + span.y - 1, oz + span.z - 1, yard);
        return {
            x: (min.x + max.x) / 2,
            y: (min.y + max.y) / 2,
            z: (min.z + max.z) / 2
        };
    }

    // ── Scene sync ──────────────────────────────────────────────────────

    function attach(scene) {
        group = new THREE.Group();
        scene.add(group);

        CY.on('game:placed', function (ev) {
            add(ev.entry);
        });
        CY.on('game:removed', function (ev) {
            drop(ev.id);
        });
        CY.on('game:start', function () {
            Object.keys(meshes).forEach(drop);
            clearGhost();
        });
        CY.on('game:cursor', function (p) {
            updateGhost(p);
        });
    }

    function add(entry) {
        const yard = CY.state.yard;
        const g = build(entry.pieceId, entry.local, { tag: entry.tag });
        const c = centreOf(entry.local, entry.origin.x, entry.origin.y, entry.origin.z, yard);
        g.position.set(c.x, c.y, c.z);
        g.userData.gridId = entry.id;
        group.add(g);
        meshes[entry.id] = g;
        if (heatmap) applyHeatmapTo(g, entry.origin.y);
        if (xray) applyXRayTo(g, true);
        // A drop should land, not appear.
        g.scale.set(1, 1.001, 1);
        return g;
    }

    function drop(id) {
        const g = meshes[id];
        if (!g) return;
        group.remove(g);
        CY.render.disposeObject(g);
        delete meshes[id];
    }

    function meshFor(id) { return meshes[id] || null; }

    function all() {
        return Object.keys(meshes).map(function (k) { return meshes[k]; });
    }

    // ── Ghost preview ───────────────────────────────────────────────────

    function clearGhost() {
        if (ghost) { group.remove(ghost); CY.render.disposeObject(ghost); ghost = null; }
        if (footprint) { group.remove(footprint); CY.render.disposeObject(footprint); footprint = null; }
        ghostKey = '';
    }

    function updateGhost(p) {
        if (!group) return;
        if (!p || !p.cells || CY.state.status !== 'playing') { clearGhost(); return; }

        const key = p.entry.id + ':' + p.rot;
        if (key !== ghostKey) {
            clearGhost();
            ghost = build(p.entry.id, p.cells, { ghost: true, tag: p.entry.tag });
            group.add(ghost);
            ghostKey = key;
        }

        const yard = CY.state.yard;
        // An invalid preview still has to show *somewhere*: park it at the top
        // of the column so the player can see what is in the way.
        const y = p.y >= 0 ? p.y : Math.max(0, yard.h - p.span.y);
        const c = centreOf(p.cells, p.x, y, p.z, yard);
        ghost.position.set(c.x, c.y, c.z);

        const tint = p.valid ? 0x34d399 : 0xf43f5e;
        ghost.traverse(function (child) {
            if (child.isMesh && child.material && !child.userData.sharedMaterial) {
                child.material.color.setHex(tint);
                child.material.opacity = p.valid ? 0.42 : 0.30;
            }
        });

        // The footprint outline is what actually reads at a distance — the
        // ghost box itself disappears against a busy stack.
        const dim = spanMetres(p.span);
        if (!footprint) {
            footprint = new THREE.LineSegments(
                new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
                new THREE.LineBasicMaterial({ color: tint, transparent: true, opacity: 0.95 })
            );
            group.add(footprint);
        }
        footprint.scale.set(dim.x, dim.y, dim.z);
        footprint.position.set(c.x, c.y, c.z);
        footprint.material.color.setHex(tint);
    }

    // ── Overlays ────────────────────────────────────────────────────────

    function applyXRayTo(g, on) {
        g.traverse(function (child) {
            if (child.userData.isInterior) { child.visible = on; return; }
            if (child.isMesh && child.userData.isShell) {
                child.material.transparent = on;
                child.material.opacity = on ? 0.3 : 1.0;
                child.material.depthWrite = !on;
                child.material.needsUpdate = true;
            }
        });
    }

    function setXRay(on) {
        xray = (on === undefined) ? !xray : !!on;
        all().forEach(function (g) { applyXRayTo(g, xray); });
        return xray;
    }

    function applyHeatmapTo(g, tier) {
        // Green on the ground, amber mid-stack, red at the top: where the
        // load — and the tipping risk — actually is.
        let hex = 0x10b981;
        if (tier >= 1) hex = 0xeab308;
        if (tier >= 3) hex = 0xef4444;
        g.traverse(function (child) {
            if (child.isMesh && child.userData.isShell) {
                // The old bug: only one mesh ever stored its original colour,
                // so switching the heatmap off repainted the rest Maersk teal.
                child.material.color.setHex(heatmap ? hex : (child.userData.baseColor || 0x94a3b8));
                child.material.needsUpdate = true;
            }
        });
    }

    function setHeatmap(on) {
        heatmap = (on === undefined) ? !heatmap : !!on;
        CY.state.grid.pieces.forEach(function (p) {
            const g = meshes[p.id];
            if (g) applyHeatmapTo(g, p.origin.y);
        });
        return heatmap;
    }

    CY.pieces3d = {
        attach: attach,
        build: build,
        centreOf: centreOf,
        meshFor: meshFor,
        all: all,
        setXRay: setXRay,
        setHeatmap: setHeatmap,
        isXRay: function () { return xray; },
        isHeatmap: function () { return heatmap; },
        clearGhost: clearGhost
    };

})(window);
