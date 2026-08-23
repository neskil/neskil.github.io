/* render/aim.js — the shot you have not taken yet.
 *
 * Five pieces of one widget, all of them lying on the ground around the ball:
 * the wedge pointing where the shot is going, the band stretched out behind it
 * showing how far back the swing is loaded, the ring round the ball filling
 * clockwise with power, the filled plane showing where the ball would land,
 * and the arrowhead on the end of it.
 *
 * `build(scene)` once, `update(world, aim)` every frame, and that is the whole
 * interface. Everything it makes is its own — nothing else in the renderer
 * reads `A` — and every buffer is written in place, so aiming allocates
 * nothing.
 *
 * The plane is drawn from `physics.previewPath()`, which runs the real
 * simulation forward. It is therefore a promise: what it draws is what the
 * ball will do. Anything that makes the preview and the shot disagree is a
 * bug in this file or in the arguments it is handed, never something to
 * correct by eye.
 *
 * Depends on physics.js and config.js. Never touches the hole, the camera or
 * the game.
 */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var P = G3.physics;

    /* Everything this widget owns. Built once, written in place thereafter. */
    var A = {
        group: null,
        arrow: null, band: null, ring: null, ringCount: 0,
        plane: null, head: null, perPath: 0
    };

    function build(scene) {
        A.group = new THREE.Group();

        // Ground arrow: a flat wedge that grows with power. Drawn without depth
        // testing so it is never swallowed by the pad it lies on.
        var shape = new THREE.BufferGeometry();
        shape.setAttribute('position', new THREE.Float32BufferAttribute(new Array(9 * 3).fill(0), 3));
        A.arrow = new THREE.Mesh(shape, new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
            depthTest: false
        }));
        A.arrow.renderOrder = 5;
        A.group.add(A.arrow);

        /* The band: a tapered strip behind the ball, opposite the shot, that
           grows as the pull grows. It is the part of a slingshot you can see
           straining, and without it a big shot and a small one look the same
           until the ball moves. */
        var band = new THREE.BufferGeometry();
        band.setAttribute('position', new THREE.Float32BufferAttribute(new Array(6 * 3).fill(0), 3));
        A.band = new THREE.Mesh(band, new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
            depthTest: false
        }));
        A.band.renderOrder = 4;
        A.group.add(A.band);

        /* The ring: a full circle round the ball drawn only as far as the power
           has wound on. RingGeometry lays its triangles out in order round the
           circle, so a draw range is an arc, and an arc costs nothing. */
        var ring = new THREE.RingGeometry(0.30, 0.40, 64);
        A.ringCount = ring.index.count;
        A.ring = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({
            color: 0x9ae6b4, transparent: true, opacity: 0.9, side: THREE.DoubleSide,
            depthTest: false
        }));
        A.ring.rotation.x = -Math.PI / 2;
        A.ring.renderOrder = 7;
        A.group.add(A.ring);

        /* Predicted path, as a filled plane rather than a row of dots. Two
           power-perturbed arcs — a touch light, a touch heavy — bound a
           quad-strip surface between them: the shape of it *is* the answer to
           "how far could this go", spanning the min and max air time a loaded
           shot could land at. An arrowhead at the loaded shot's own landing
           point (or its first bounce) marks the one result actually aimed
           at, without pretending the game can promise it. */
        var perPath = 40;
        A.perPath = perPath;
        var pvcount = (perPath - 1) * 6;
        var pg = new THREE.BufferGeometry();
        pg.setAttribute('position', new THREE.Float32BufferAttribute(new Array(pvcount * 3).fill(0), 3));
        pg.setAttribute('color', new THREE.Float32BufferAttribute(new Array(pvcount * 3).fill(1), 3));
        A.plane = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
            vertexColors: true, depthTest: false
        }));
        A.plane.renderOrder = 6;
        A.plane.frustumCulled = false;
        A.group.add(A.plane);

        var hg = new THREE.BufferGeometry();
        hg.setAttribute('position', new THREE.Float32BufferAttribute(new Array(3 * 3).fill(0), 3));
        A.head = new THREE.Mesh(hg, new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.95, side: THREE.DoubleSide,
            depthTest: false
        }));
        A.head.renderOrder = 7;
        A.head.frustumCulled = false;
        A.group.add(A.head);

        scene.add(A.group);
    }

    // One quad of the path plane, as two triangles: pA-pB-pC and pA-pC-pD.
    /* ── the predicted path ────────────────────────────────────────────── */

    function putPathQuad(arr, base, pA, pB, pC, pD) {
        var idx = base * 3;
        arr[idx] = pA.x; arr[idx + 1] = pA.y; arr[idx + 2] = pA.z;
        arr[idx + 3] = pB.x; arr[idx + 4] = pB.y; arr[idx + 5] = pB.z;
        arr[idx + 6] = pC.x; arr[idx + 7] = pC.y; arr[idx + 8] = pC.z;
        arr[idx + 9] = pA.x; arr[idx + 10] = pA.y; arr[idx + 11] = pA.z;
        arr[idx + 12] = pC.x; arr[idx + 13] = pC.y; arr[idx + 14] = pC.z;
        arr[idx + 15] = pD.x; arr[idx + 16] = pD.y; arr[idx + 17] = pD.z;
    }

    function setPathQuadShade(col, base, shade) {
        var idx = base * 3;
        for (var v = 0; v < 6; v++) { col[idx + v * 3] = col[idx + v * 3 + 1] = col[idx + v * 3 + 2] = shade; }
    }

    /* A tail of where the ball has just been. Additive blending and a colour
       that darkens with age does the fading for us — per-point alpha would want
       a custom shader, and this reads the same. */

    function update(world, aim) {
        var show = !!(aim && aim.show && !world.moving && !world.sunk);
        A.group.visible = show;
        if (!show) return;

        var b = world.ball;
        var dirX = Math.sin(aim.yaw), dirZ = Math.cos(aim.yaw);
        var rawFrac = Math.max(0, Math.min(1, aim.power / C.MAX_POWER));
        // The wedge and band keep a floor so the shot direction is always
        // visible; the ring below uses the real fraction so it reads 0% at 0%.
        var frac = Math.max(0.08, rawFrac);
        var len = 0.7 + frac * 2.6;
        var halfW = 0.11 + frac * 0.05;
        var y = b.y - C.BALL_R + 0.02;

        // Wedge: a shaft and a head, six vertices, written straight into the
        // buffer so nothing is allocated per frame.
        var px = -dirZ, pz = dirX;   // perpendicular
        var a = A.arrow.geometry.attributes.position.array;
        function put(i, sx, sz) {
            a[i * 3] = b.x + dirX * sx + px * sz;
            a[i * 3 + 1] = y;
            a[i * 3 + 2] = b.z + dirZ * sx + pz * sz;
        }
        var shaft = len * 0.72;
        put(0, 0.22, -halfW); put(1, 0.22, halfW); put(2, shaft, halfW);
        put(3, 0.22, -halfW); put(4, shaft, halfW); put(5, shaft, -halfW);
        put(6, shaft, -halfW * 2.4); put(7, shaft, halfW * 2.4); put(8, len, 0);
        A.arrow.geometry.attributes.position.needsUpdate = true;
        A.arrow.geometry.computeBoundingSphere();

        // Green through amber to red as the swing fills, and hard red once it
        // is into the last of it.
        var hue = frac > C.OVERSWING ? 0 : 0.33 * (1 - frac / C.OVERSWING);
        A.arrow.material.color.setHSL(hue, 0.85, frac > C.OVERSWING ? 0.62 : 0.55);

        // The band, stretched out behind the ball by the same fraction.
        var ba = A.band.geometry.attributes.position.array;
        var back = 0.26 + frac * 2.2;
        function bandPut(i, sx, sz) {
            ba[i * 3] = b.x - dirX * sx + px * sz;
            ba[i * 3 + 1] = y;
            ba[i * 3 + 2] = b.z - dirZ * sx + pz * sz;
        }
        var tip = 0.05 + frac * 0.03;
        bandPut(0, 0.18, -0.13); bandPut(1, 0.18, 0.13); bandPut(2, back, tip);
        bandPut(3, 0.18, -0.13); bandPut(4, back, tip); bandPut(5, back, -tip);
        A.band.geometry.attributes.position.needsUpdate = true;
        A.band.geometry.computeBoundingSphere();
        A.band.material.color.copy(A.arrow.material.color);
        A.band.material.opacity = 0.25 + frac * 0.4;

        // The ring fills clockwise from the shot line as the power winds on.
        A.ring.position.set(b.x, y, b.z);
        A.ring.rotation.z = -aim.yaw;
        A.ring.geometry.setDrawRange(0, Math.max(3, Math.floor(A.ringCount * rawFrac / 3) * 3));
        A.ring.material.color.copy(A.arrow.material.color);
        A.ring.visible = rawFrac > 0.02;

        // Touch is too coarse to load an exact number, so the plane spans a
        // spread of power either side of what is loaded — its two edges are
        // the lightest and heaviest this shot could actually be, and its
        // width at any point is how much air time is still in question there.
        // previewPath simulates a real shot, and the simulation refuses
        // anything under MIN_POWER — so every one of the three is asked for at
        // least that, the same floor the wedge and the band already keep. An
        // unclamped 0 comes back as an empty path, and an empty path has no
        // arrowhead to point.
        var shown = Math.max(C.MIN_POWER, aim.power);
        var lo = Math.max(C.MIN_POWER, shown * 0.82);
        var hi = Math.min(C.MAX_POWER, Math.max(C.MIN_POWER, shown * 1.18));
        var seconds = 0.5 + frac * 0.5;
        var perPath = A.perPath;
        var i, k;

        var loPts = P.previewPath(world, aim.yaw, lo, aim.loft, seconds);
        var hiPts = P.previewPath(world, aim.yaw, hi, aim.loft, seconds);
        var midPts = P.previewPath(world, aim.yaw, shown, aim.loft, seconds);
        if (!midPts.length || !loPts.length || !hiPts.length) {
            A.plane.visible = false;
            A.head.visible = false;
            return;
        }
        A.plane.visible = true;
        A.head.visible = true;

        var turn = -1;
        for (i = 1; i < midPts.length; i++) {
            if (midPts[i].bounce) { turn = i; break; }
        }

        var nSamples = Math.min(perPath, Math.min(loPts.length, hiPts.length));
        var segCount = Math.max(0, nSamples - 1);
        var turnFrac = (turn >= 0 && midPts.length > 1) ? turn / (midPts.length - 1) : -1;
        var turnSample = turnFrac >= 0 ? Math.round(turnFrac * segCount) : -1;

        var loArr = [], hiArr = [];
        for (i = 0; i < nSamples; i++) {
            var kl = Math.min(loPts.length - 1, Math.round(i * ((loPts.length - 1) / Math.max(1, nSamples - 1))));
            var kh = Math.min(hiPts.length - 1, Math.round(i * ((hiPts.length - 1) / Math.max(1, nSamples - 1))));
            loArr.push(loPts[kl]);
            hiArr.push(hiPts[kh]);
        }

        var pos = A.plane.geometry.attributes.position.array;
        var col = A.plane.geometry.attributes.color.array;
        for (i = 0; i < perPath - 1; i++) {
            var base = i * 6;
            if (i < segCount) {
                var shade = (1 - (i / segCount) * 0.4) * ((turnSample >= 0 && i >= turnSample) ? 0.5 : 1);
                putPathQuad(pos, base, loArr[i], hiArr[i], hiArr[i + 1], loArr[i + 1]);
                setPathQuadShade(col, base, shade);
            } else {
                for (var v = 0; v < 6; v++) pos[(base + v) * 3 + 1] = -999;
            }
        }
        A.plane.geometry.attributes.position.needsUpdate = true;
        A.plane.geometry.attributes.color.needsUpdate = true;
        A.plane.geometry.computeBoundingSphere();

        // The arrowhead: where the loaded shot itself lands, or first meets a
        // wall — the one point in the plane that is actually being aimed at.
        var headIdx = turn >= 0 ? turn : midPts.length - 1;
        var headPos = midPts[headIdx];
        var prevPos = midPts[Math.max(0, headIdx - 1)];
        var hdx = headPos.x - prevPos.x, hdz = headPos.z - prevPos.z;
        var hlen = Math.hypot(hdx, hdz) || 1;
        hdx /= hlen; hdz /= hlen;
        var hpx = -hdz, hpz = hdx;
        var hs = 0.14 + frac * 0.05;
        var hp = A.head.geometry.attributes.position.array;
        hp[0] = headPos.x - hpx * hs; hp[1] = headPos.y; hp[2] = headPos.z - hpz * hs;
        hp[3] = headPos.x + hpx * hs; hp[4] = headPos.y; hp[5] = headPos.z + hpz * hs;
        hp[6] = headPos.x + hdx * hs * 2; hp[7] = headPos.y; hp[8] = headPos.z + hdz * hs * 2;
        A.head.geometry.attributes.position.needsUpdate = true;
        A.head.geometry.computeBoundingSphere();
        A.head.material.color.copy(A.arrow.material.color);
    }

    /* Camera. The player never flies it directly: it sits behind the ball
       looking down the aim line, which is what makes "drag left, aim left"
       true from any angle. Overview lifts it above the hole instead. */

    G3.aimView = {
        build: build,
        update: update,
        state: A
    };

})(window.G3);
