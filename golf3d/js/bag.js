/* The bag: the club picker, modelled rather than laid out.

   Built to the real thing's proportions, because the first pass was drawn from
   memory and came out looking like a bin: a cart bag is about 35 inches tall
   with a 9 to 10.5 inch cuff — call it four times as tall as it is wide, where
   mine had been under two — and it holds a 45 inch driver, 35.5 inch wedges and
   a 34 inch putter. Those are the numbers below, in metres, which is why the
   driver towers over the rest of the heads and the putter barely clears the
   cuff. Sources are in the README.

   It is furniture, not course — it stands in front of the camera rather than on
   the green, at a fixed offset in camera space, so it never occludes the hole,
   never has to be dodged, and never pretends to be something the ball could
   hit. That is why it lives here and not in render.js: render.js draws the
   world the simulation knows about, and this file draws a thing the simulation
   has never heard of.

   Clubs are built from `CONFIG.CLUBS`, and each head is tilted by that club's
   own loft — so the difference between the driver and the wedge is not a label,
   it is the angle of the face you are looking at. Add a fifth club to the
   config and it appears in the bag, in the fan, with a label, pickable.

   Interaction: click the bag to open it, click a club to take it. Everything
   the mouse can do here the number keys can do too. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;

    var B = {
        rig: null,
        clubs: [],           // { group, meshes, label, target, now }
        pickables: [],
        expanded: false,
        selected: null,
        ray: null,
        ndc: null,
        ready: false,
        hover: null
    };

    /* ── materials ─────────────────────────────────────────────────────── */

    function mats() {
        return {
            leather: new THREE.MeshLambertMaterial({ color: 0x2a3138 }),
            panel: new THREE.MeshLambertMaterial({ color: 0x39424b }),
            trim: new THREE.MeshLambertMaterial({ color: 0x38bdf8 }),
            dark: new THREE.MeshLambertMaterial({ color: 0x14181d }),
            steel: new THREE.MeshPhongMaterial({ color: 0xc2cad3, shininess: 80, specular: 0x8892a0 }),
            grip: new THREE.MeshLambertMaterial({ color: 0x23272e }),
            head: new THREE.MeshPhongMaterial({ color: 0xa9b3bf, shininess: 90, specular: 0xffffff }),
            face: new THREE.MeshLambertMaterial({ color: 0xe8eef4 })
        };
    }

    /* ── one club ──────────────────────────────────────────────────────── */

    // Real lengths, in metres. A driver is 45 inches, wedges 35.5, a putter 34.
    var LENGTHS = { driver: 1.14, chipper: 0.95, wedge: 0.90, putter: 0.86 };

    /* Grip, shaft, ferrule, head — bottom to top, because that is the order
       they are stacked in and the order they read in. The head is a different
       shape per club and is turned by the club's own loft about the axis across
       the face, which is the whole point of looking at it: an open face means
       the ball goes up. */
    function buildClub(club, M) {
        var g = new THREE.Group();
        var len = LENGTHS[club.id] || 0.95;

        var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0085, len, 10), M.steel);
        shaft.position.y = len / 2;
        g.add(shaft);

        // The grip is at the bottom, down in the bag, and the head at the top
        // where it can be seen and clicked. Rubber grips are about 10 inches.
        var grip = new THREE.Mesh(new THREE.CylinderGeometry(0.0105, 0.0135, 0.25, 10), M.grip);
        grip.position.y = 0.125;
        g.add(grip);
        var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0135, 0.012, 0.014, 10), M.dark);
        cap.position.y = 0.007;
        g.add(cap);

        // The ferrule: the little collar where shaft meets head. Two millimetres
        // of trim that does more for "this is a golf club" than anything else
        // on the shaft.
        var ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.0105, 0.0095, 0.028, 10), M.dark);
        ferrule.position.y = len - 0.03;
        g.add(ferrule);

        var head = new THREE.Group();
        head.position.y = len - 0.042;

        if (club.id === 'putter') {
            // A mallet: flat face, a flange behind it and a sight line on top.
            var body = new THREE.Mesh(new THREE.BoxGeometry(0.098, 0.030, 0.042), M.head);
            body.position.set(0.030, 0.014, 0);
            head.add(body);
            var flange = new THREE.Mesh(new THREE.BoxGeometry(0.070, 0.024, 0.038), M.dark);
            flange.position.set(0.046, 0.013, -0.035);
            head.add(flange);
            var sight = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.003, 0.055), M.face);
            sight.position.set(0.030, 0.030, -0.014);
            head.add(sight);
        } else if (club.id === 'driver') {
            // 460cc is about five inches across and two deep, and mostly crown.
            var crown = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), M.dark);
            crown.scale.set(0.115, 0.055, 0.095);
            crown.position.set(0.042, 0.026, 0);
            head.add(crown);
            var face = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.048, 0.072), M.face);
            face.position.set(0.094, 0.026, 0);
            head.add(face);
            var sole = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 10), M.head);
            sole.scale.set(0.10, 0.018, 0.08);
            sole.position.set(0.042, 0.006, 0);
            head.add(sole);
        } else {
            // An iron: hosel, blade, sole, and grooves across the face.
            var hosel = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.05, 8), M.head);
            hosel.position.set(0.004, 0.024, 0);
            head.add(hosel);
            var blade = new THREE.Mesh(new THREE.BoxGeometry(0.019, 0.055, 0.072), M.head);
            blade.position.set(0.030, 0.028, 0);
            head.add(blade);
            var sole = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.013, 0.072), M.dark);
            sole.position.set(0.032, 0.004, 0);
            head.add(sole);
            var grooves = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.036, 0.058), M.face);
            grooves.position.set(0.040, 0.030, 0);
            head.add(grooves);
        }

        head.rotation.z = -club.loft;
        g.add(head);

        var hit = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.2, 0.16),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
        );
        hit.position.y = len - 0.02;
        hit.userData.clubId = club.id;
        g.add(hit);

        g.userData.clubId = club.id;
        g.userData.len = len;
        return { group: g, hit: hit, head: head, len: len };
    }

    /* ── the bag itself ────────────────────────────────────────────────── */

    /* A cart bag: 0.89 tall, a 0.26 cuff, and the details that make it one
       rather than a cylinder — a divider cross in the mouth, stitched seams, a
       zip pocket, a padded strap and a foot ring. */
    var BAG_H = 0.89, BAG_R = 0.13, WELL = 0.72;

    function buildBody(M) {
        var g = new THREE.Group();

        var body = new THREE.Mesh(new THREE.CylinderGeometry(BAG_R, BAG_R * 0.86, BAG_H, 24), M.leather);
        body.position.y = BAG_H / 2;
        g.add(body);

        // A lighter panel round the middle, and the accent as a narrow band —
        // the same trick every bag maker uses to stop it reading as a tube.
        var panel = new THREE.Mesh(new THREE.CylinderGeometry(BAG_R * 1.012, BAG_R * 0.96, 0.3, 24), M.panel);
        panel.position.y = BAG_H * 0.56;
        g.add(panel);
        var band = new THREE.Mesh(new THREE.CylinderGeometry(BAG_R * 1.03, BAG_R * 1.02, 0.035, 24), M.trim);
        band.position.y = BAG_H * 0.42;
        g.add(band);

        [0.30, 0.72].forEach(function (f) {
            var seam = new THREE.Mesh(new THREE.TorusGeometry(BAG_R * 0.99, 0.004, 6, 26), M.dark);
            seam.rotation.x = Math.PI / 2;
            seam.position.y = BAG_H * f;
            g.add(seam);
        });

        var cuff = new THREE.Mesh(new THREE.CylinderGeometry(BAG_R * 1.06, BAG_R * 1.02, 0.075, 24), M.dark);
        cuff.position.y = BAG_H - 0.035;
        g.add(cuff);
        var lip = new THREE.Mesh(new THREE.TorusGeometry(BAG_R * 1.06, 0.011, 8, 26), M.dark);
        lip.rotation.x = Math.PI / 2;
        lip.position.y = BAG_H;
        g.add(lip);

        // The divider cross. Real bags run fourteen full-length slots; four is
        // as many as reads at this size, and it is what the clubs sit in.
        [0, Math.PI / 2].forEach(function (a) {
            var d = new THREE.Mesh(new THREE.BoxGeometry(BAG_R * 2.05, 0.05, 0.008), M.dark);
            d.position.y = BAG_H - 0.03;
            d.rotation.y = a;
            g.add(d);
        });

        var base = new THREE.Mesh(new THREE.CylinderGeometry(BAG_R * 0.9, BAG_R * 0.92, 0.05, 24), M.dark);
        base.position.y = 0.025;
        g.add(base);
        var foot = new THREE.Mesh(new THREE.TorusGeometry(BAG_R * 0.9, 0.012, 6, 24), M.dark);
        foot.rotation.x = Math.PI / 2;
        foot.position.y = 0.012;
        g.add(foot);

        var pocket = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.24, 0.075), M.panel);
        pocket.position.set(0, 0.34, 0.10);
        g.add(pocket);
        var zip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.008, 0.006), M.trim);
        zip.position.set(0, 0.45, 0.142);
        g.add(zip);
        var pull = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.005), M.trim);
        pull.position.set(0.06, 0.432, 0.145);
        g.add(pull);

        var ball = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.13, 0.06), M.panel);
        ball.position.set(0.105, 0.2, 0.045);
        ball.rotation.y = -0.7;
        g.add(ball);

        var strap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.66, 0.012), M.dark);
        strap.position.set(-0.115, 0.46, 0.045);
        strap.rotation.z = 0.16;
        g.add(strap);
        var pad = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.22, 0.022), M.panel);
        pad.position.set(-0.13, 0.55, 0.045);
        pad.rotation.z = 0.16;
        g.add(pad);

        var hit = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, BAG_H, 12),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
        );
        hit.position.y = BAG_H / 2;
        hit.userData.bag = true;
        g.add(hit);

        return { group: g, hit: hit };
    }

    /* ── labels ────────────────────────────────────────────────────────── */

    function labelTexture(club) {
        var cv = document.createElement('canvas');
        cv.width = 320; cv.height = 96;
        var g = cv.getContext('2d');
        g.clearRect(0, 0, 320, 96);

        g.fillStyle = 'rgba(6, 20, 32, 0.86)';
        g.strokeStyle = 'rgba(125, 211, 252, 0.5)';
        g.lineWidth = 3;
        if (g.roundRect) {
            g.beginPath(); g.roundRect(4, 4, 312, 88, 18); g.fill(); g.stroke();
        } else {
            g.fillRect(4, 4, 312, 88);
            g.strokeRect(4, 4, 312, 88);
        }

        g.fillStyle = '#eaf6ff';
        g.font = '600 40px Outfit, system-ui, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(club.name, 160, 38);

        g.fillStyle = '#7dd3fc';
        g.font = '600 24px "JetBrains Mono", ui-monospace, monospace';
        g.fillText(club.key + ' · ' + Math.round(club.loft * 180 / Math.PI) + '°', 160, 72);

        var t = new THREE.CanvasTexture(cv);
        t.needsUpdate = true;
        return t;
    }

    function hazeTexture() {
        var cv = document.createElement('canvas');
        cv.width = cv.height = 128;
        var g = cv.getContext('2d');
        var grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
        grd.addColorStop(0, 'rgba(4, 14, 24, 0.85)');
        grd.addColorStop(0.55, 'rgba(4, 14, 24, 0.42)');
        grd.addColorStop(1, 'rgba(4, 14, 24, 0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(cv);
    }

    function buildLabel(club) {
        var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: labelTexture(club), transparent: true, opacity: 0, depthTest: false
        }));
        sprite.scale.set(0.30, 0.09, 1);
        sprite.renderOrder = 20;
        return sprite;
    }

    /* ── layout ────────────────────────────────────────────────────────── */

    /* Where each club sits, closed and open. Closed they are bunched in the
       mouth of the bag leaning back; open they fan across the screen, stand up,
       and come forward far enough to be worth clicking. */
    function layout(i, n) {
        var spread = (i - (n - 1) / 2);
        var floor = BAG_H - WELL;          // where a grip rests in its well
        return {
            closed: {
                x: spread * 0.03, y: floor, z: spread * 0.026,
                rz: -0.13 - spread * 0.05, rx: 0.05, scale: 1
            },
            // Open, the grips stay down in the wells and the heads splay: the
            // fan turns about the mouth, which is what a handful of clubs does.
            open: {
                x: spread * 0.03, y: floor + 0.03, z: 0.02 + spread * 0.035,
                rz: spread * 0.33, rx: -0.04, scale: 1
            }
        };
    }

    function build(scene) {
        var M = mats();
        B.rig = new THREE.Group();
        B.pickables = [];
        B.clubs = [];

        var body = buildBody(M);
        B.rig.add(body.group);
        B.pickables.push(body.hit);

        C.CLUBS.forEach(function (club, i) {
            var built = buildClub(club, mats());
            var spot = layout(i, C.CLUBS.length);
            var label = buildLabel(club);

            built.group.add(label);
            // Above the head. The clubs are real lengths, so the labels stagger
            // themselves — driver highest, putter lowest.
            label.position.set(0.02, built.len + 0.1, 0.02);

            B.rig.add(built.group);
            B.pickables.push(built.hit);
            B.clubs.push({
                id: club.id,
                club: club,
                len: built.len,
                group: built.group,
                head: built.head,
                label: label,
                spot: spot,
                now: { x: spot.closed.x, y: spot.closed.y, z: spot.closed.z, rz: spot.closed.rz, rx: spot.closed.rx, scale: 1, lift: 0, glow: 0 }
            });
        });

        // No shadows: it is a metre from the lens and would smear one across
        // the whole hole.
        B.rig.traverse(function (o) { o.castShadow = false; o.receiveShadow = false; });
        /* A soft dark haze behind the bag. Chrome shafts against a bright sky
           are nearly invisible without something to sit against, and this is
           cheaper and calmer than an outline. */
        var haze = new THREE.Sprite(new THREE.SpriteMaterial({
            map: hazeTexture(), transparent: true, opacity: 0.3, depthWrite: false
        }));
        haze.scale.set(1.5, 2.0, 1);
        haze.position.set(0.05, 0.75, -0.3);
        B.rig.add(haze);

        var lamp = new THREE.PointLight(0xfff2dd, 0.55, 3.2);
        lamp.position.set(0.6, 1.2, 0.9);
        B.rig.add(lamp);

        B.rig.scale.setScalar(0.66);
        scene.add(B.rig);

        B.ray = new THREE.Raycaster();
        B.ndc = new THREE.Vector2();
        B.ready = true;
        setSelected(C.DEFAULT_CLUB);
        return B.rig;
    }

    /* ── per frame ─────────────────────────────────────────────────────── */

    var _off = new THREE.Vector3();

    /* Parked at a fixed offset in camera space, then turned a little off-axis
       so it reads as an object with sides rather than a picture of a bag. */
    function place(camera, aspect) {
        if (!B.ready) return;
        var wide = aspect > 0.95;
        _off.set(wide ? -0.66 : -0.44, wide ? -0.60 : -0.70, -1.45);
        _off.applyQuaternion(camera.quaternion);
        B.rig.position.copy(camera.position).add(_off);
        B.rig.quaternion.copy(camera.quaternion);
        B.rig.rotateY(-0.55);
        B.rig.rotateX(0.10);
    }

    function update(dt, camera, aspect) {
        if (!B.ready) return;
        place(camera, aspect);

        var ease = 1 - Math.pow(0.0008, dt);      // ~0.25s to settle
        B.clubs.forEach(function (c) {
            var to = B.expanded ? c.spot.open : c.spot.closed;
            var chosen = c.id === B.selected;
            var lift = chosen ? (B.expanded ? 0.05 : 0.045) : 0;
            var glow = chosen ? 1 : (B.hover === c.id ? 0.5 : 0);

            c.now.x += (to.x - c.now.x) * ease;
            c.now.y += (to.y - c.now.y) * ease;
            c.now.z += (to.z - c.now.z) * ease;
            c.now.rz += (to.rz - c.now.rz) * ease;
            c.now.rx += (to.rx - c.now.rx) * ease;
            c.now.scale += (to.scale * (chosen ? 1.08 : 1) - c.now.scale) * ease;
            c.now.lift += (lift - c.now.lift) * ease;
            c.now.glow += (glow - c.now.glow) * ease;

            c.group.position.set(c.now.x, c.now.y + c.now.lift, c.now.z);
            c.group.rotation.set(c.now.rx, 0, c.now.rz);
            c.group.scale.setScalar(c.now.scale);

            // The club in hand catches a light of its own. Every club owns its
            // materials, so this stays on the one club it is meant for.
            var e = 0.34 * c.now.glow;
            c.group.traverse(function (o) {
                if (o.material && o.material.emissive) o.material.emissive.setRGB(e * 0.45, e * 0.7, e);
            });

            // Only the club in hand wears its name, plus whichever one is under
            // the pointer — four labels at once was a wall of text over the
            // course.
            var want = chosen ? 0.9 : (B.hover === c.id ? 1 : 0);
            c.label.material.opacity += (want - c.label.material.opacity) * ease;
            c.label.visible = c.label.material.opacity > 0.02;
        });
    }

    /* ── picking ───────────────────────────────────────────────────────── */

    /* Returns 'bag', a club id, or null.

       Closed, the whole thing is one target: anywhere on the bag or the clubs
       poking out of it opens it. Open, a click takes the club whose *head* is
       nearest it on screen — not the first box a ray happens to cross. The fan
       is seen from an angle, so the shafts and heads overlap in depth, and a
       ray aimed squarely at one head will pass through its neighbour's box on
       the way there; screen distance is both easier to reason about and what
       the player is actually pointing at. */
    var _head = new THREE.Vector3();

    // How far a point up the club is from the click, in screen terms.
    function screenGap(group, up, nx, ny, aspect, camera) {
        _head.set(0, up, 0);
        group.localToWorld(_head);
        _head.project(camera);
        return Math.hypot((_head.x - nx) * aspect, _head.y - ny);
    }

    function pick(nx, ny, camera, scene) {
        if (!B.ready) return null;
        scene.updateMatrixWorld(true);

        if (B.expanded) {
            var aspect = camera.aspect || 1;
            var best = null, bestD = 0.13;      // ~a fingertip at any size
            B.clubs.forEach(function (c) {
                var d = Math.min(
                    screenGap(c.group, c.len - 0.02, nx, ny, aspect, camera),
                    screenGap(c.group, c.len + 0.1, nx, ny, aspect, camera)
                );
                if (d < bestD) { bestD = d; best = c.id; }
            });
            if (best) return best;
        }

        B.ndc.set(nx, ny);
        B.ray.setFromCamera(B.ndc, camera);
        var hits = B.ray.intersectObjects(B.pickables, false);
        return hits.length ? 'bag' : null;
    }

    function setExpanded(on) { B.expanded = !!on; }
    function toggle() { B.expanded = !B.expanded; return B.expanded; }
    function setSelected(id) { B.selected = id; }
    function setHover(id) { B.hover = id; }
    function isExpanded() { return B.expanded; }

    G3.bag = {
        build: build,
        update: update,
        pick: pick,
        toggle: toggle,
        setExpanded: setExpanded,
        setSelected: setSelected,
        setHover: setHover,
        isExpanded: isExpanded,
        state: B
    };

})(window.G3);
