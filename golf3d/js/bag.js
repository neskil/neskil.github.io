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

   Interaction: the bag sits low in the corner, mostly off the bottom of the
   screen, showing only its cuff and the heads standing in it — enough to say
   "your clubs are here" and small enough to ignore. Click it and the clubs
   come *out* of the bag and line up across the middle of the view, each turning
   slowly so the face can be seen from every side, and the club under the
   pointer is named and explained above them (that part is DOM, in game.js —
   text belongs in text). Click one to take it and they drop back in the bag.
   Everything the mouse can do here the number keys can do too. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;

    var B = {
        rig: null,           // the bag, parked in the corner
        clubRig: null,       // the clubs, which travel out of it
        clubs: [],           // { group, meshes, label, target, now }
        pickables: [],
        expanded: false,
        selected: null,
        ray: null,
        ndc: null,
        ready: false,
        hover: null,
        // Where the rig is, as a blend between tucked away and front and
        // centre. Everything about the open state is this number.
        open01: 0,
        spin: 0
    };

    /* ── materials ─────────────────────────────────────────────────────── */

    function mats() {
        return {
            leather: new THREE.MeshLambertMaterial({ color: 0x2a3138 }),
            panel: new THREE.MeshLambertMaterial({ color: 0x39424b }),
            trim: new THREE.MeshLambertMaterial({ color: 0x38bdf8 }),
            dark: new THREE.MeshLambertMaterial({ color: 0x14181d }),
            /* Broad and soft rather than mirror-bright: the course has
               three lights of its own and the picker adds a fourth, and a
               shininess up in the hundreds gives a crown one hard white spot
               per light instead of one long sheen. */
            crown: new THREE.MeshPhongMaterial({
                color: 0x212b38, shininess: 26, specular: 0x556373
            }),
            insert: new THREE.MeshPhongMaterial({ color: 0x1e2932, shininess: 20, specular: 0x333c44 }),
            steel: new THREE.MeshPhongMaterial({ color: 0xc2cad3, shininess: 80, specular: 0x8892a0 }),
            grip: new THREE.MeshLambertMaterial({ color: 0x23272e }),
            head: new THREE.MeshPhongMaterial({ color: 0xa9b3bf, shininess: 90, specular: 0xffffff }),
            face: new THREE.MeshPhongMaterial({ color: 0xdfe7ee, shininess: 60, specular: 0x777f88 }),
            grooves: new THREE.MeshPhongMaterial({
                map: grooveTexture(), shininess: 45, specular: 0x666e77, side: THREE.DoubleSide
            })
        };
    }

    // Grooves, drawn: a dozen lines across a face is a texture, not geometry.
    var _grooves = null;
    function grooveTexture() {
        if (_grooves) return _grooves;
        var cv = document.createElement('canvas');
        cv.width = cv.height = 64;
        var g = cv.getContext('2d');
        g.fillStyle = '#cfd8e0';
        g.fillRect(0, 0, 64, 64);
        g.strokeStyle = 'rgba(40, 50, 60, 0.55)';
        g.lineWidth = 2;
        for (var y = 8; y < 60; y += 6) {
            g.beginPath(); g.moveTo(4, y); g.lineTo(60, y); g.stroke();
        }
        _grooves = new THREE.CanvasTexture(cv);
        return _grooves;
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
        head.position.y = len - 0.004;
        head.add(buildHead(club, M));

        head.rotation.z = -club.loft;
        g.add(head);

        var hit = new THREE.Mesh(
            new THREE.BoxGeometry(0.20, 0.20, 0.24),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
        );
        hit.position.set(0, len + 0.02, 0.05);
        hit.userData.clubId = club.id;
        g.add(hit);

        g.userData.clubId = club.id;
        g.userData.len = len;
        return { group: g, hit: hit, head: head, len: len };
    }

    /* Heads, modelled from photographs rather than guessed at. A driver is a
       swollen pear sliced off square where the face goes; an iron is a thin
       blade hung off its heel with a rounded toe and a topline that runs down
       to it; a mallet putter is a wide, low slab with wings behind the face.

       Sizes are the real ones. The USGA caps a driver head at 127mm heel to
       toe and 71mm tall, and a 460cc head sits right on that limit; an iron
       blade is about 76mm heel to toe and 50mm tall; a mallet is about 105mm
       across and 55mm front to back. References are listed in the README.

       Everything is built in the head's own frame, and that frame is the club
       as it stands in a bag — grip down in the well, head up where it can be
       seen. The origin is where the shaft ends, +Y runs on past it to the
       sole, +X is the way the face looks, and Z is heel to toe with the head
       hung out to +Z from a hosel at z = 0. That last part is what was wrong
       before: the heads floated beside their shafts because nothing sat where
       the shaft actually ended. */

    /* A sphere pushed into the shape of a driver: squashed flat, swelling
       toward the back, and sliced off where the face goes. A club head is a
       curved volume, and a curved volume is what a warped sphere is — the
       extruded outline it replaces could only ever be a rounded brick. */
    function driverBody() {
        var R = 0.052, FACE = 0.040;
        var geo = new THREE.SphereGeometry(R, 28, 20);
        var p = geo.attributes.position;
        for (var i = 0; i < p.count; i++) {
            var x = p.getX(i), y = p.getY(i), z = p.getZ(i);
            var back = (R - x) / (2 * R);        // 0 at the face, 1 at the back
            z *= 0.78 + 0.50 * back;             // the pear: narrow at the face
            y *= 0.60 + 0.12 * back;             // and a touch deeper at the back
            if (x > FACE) x = FACE;              // slice the face flat
            p.setXYZ(i, x, y, z);
        }
        geo.computeVertexNormals();
        return geo;
    }

    /* An iron blade, seen from the face: heel on the left at x = 0, toe out to
       the right, sole along the bottom. +y is away from the shaft, so the
       topline is the near edge and the sole is the far one. */
    function bladeShape(h) {
        var sh = new THREE.Shape();
        sh.moveTo(0.004, 0.006);
        sh.lineTo(0.050, 0.012);                                  // the topline
        sh.quadraticCurveTo(0.070, 0.016, 0.074, 0.030);          // the toe
        sh.quadraticCurveTo(0.078, h - 0.008, 0.062, h);
        sh.lineTo(0.012, h - 0.005);                              // the sole
        sh.quadraticCurveTo(-0.002, h - 0.008, 0.004, 0.006);     // up the heel
        return sh;
    }

    /* The muscle behind a blade: a bar of steel hugging the sole from heel
       to toe, which is where the weight in a real iron actually sits. Without
       it the blade reads as a butter knife; as a box bolted on the back it
       read as a step. */
    function muscleShape(h) {
        var sh = new THREE.Shape();
        sh.moveTo(0.012, h - 0.026);
        sh.lineTo(0.056, h - 0.022);
        sh.quadraticCurveTo(0.066, h - 0.021, 0.066, h - 0.012);
        sh.quadraticCurveTo(0.065, h - 0.004, 0.054, h - 0.004);
        sh.lineTo(0.016, h - 0.008);
        sh.quadraticCurveTo(0.006, h - 0.010, 0.012, h - 0.026);
        return sh;
    }

    /* A mallet, seen from above: the flat face at +x, wings swept back. +y is
       heel to toe here; the extrusion is the head's height. */
    function malletShape() {
        var w = 0.052, f = 0.026, b = -0.030;
        var sh = new THREE.Shape();
        sh.moveTo(f, -w + 0.008);
        sh.lineTo(f, w - 0.008);
        sh.quadraticCurveTo(f, w, f - 0.010, w);
        sh.lineTo(b + 0.016, w);
        sh.quadraticCurveTo(b, w, b, w - 0.020);
        sh.lineTo(b, -w + 0.020);
        sh.quadraticCurveTo(b, -w, b + 0.016, -w);
        sh.lineTo(f - 0.010, -w);
        sh.quadraticCurveTo(f, -w, f, -w + 0.008);
        return sh;
    }

    function extruded(shape, depth, bevel) {
        return new THREE.ExtrudeGeometry(shape, {
            depth: depth, curveSegments: 16,
            bevelEnabled: true, bevelSegments: 4,
            bevelSize: bevel, bevelThickness: bevel, bevelOffset: 0
        });
    }

    function buildHead(club, M) {
        var g = new THREE.Group();
        var hosel;

        if (club.id === 'driver') {
            /* Hung off its heel: the body is pushed out to +z so that z = 0,
               where the shaft is, lands on the heel and not in the middle of
               the crown. */
            var body = new THREE.Mesh(driverBody(), M.crown);
            body.position.set(0, 0.042, 0.044);
            g.add(body);

            // The face plate sits exactly on the flat slice.
            /* Sized to the slice, not guessed: at x = 0.040 the warped
               sphere is 0.028 across and 0.020 tall, so anything bigger than
               that stands out past the body as a rim. A driver face is wider
               than it is tall, which the y scale is doing. */
            var face = new THREE.Mesh(new THREE.CircleGeometry(0.027, 26), M.face);
            face.rotation.y = Math.PI / 2;
            face.scale.set(1, 0.72, 1);
            face.position.set(0.0404, 0.042, 0.044);
            g.add(face);

            /* Short. A long one climbs straight out through the crown,
               which is the one thing a driver never does. */
            hosel = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0105, 0.032, 12), M.head);
            hosel.position.set(0.004, 0.013, 0.002);
            g.add(hosel);

        } else if (club.id === 'putter') {
            var mallet = extruded(malletShape(), 0.019, 0.005);
            mallet.rotateX(-Math.PI / 2);        // extrude upward, face to +x
            mallet.translate(0, 0.020, 0.042);
            g.add(new THREE.Mesh(mallet, M.head));

            // A dark insert across the face — every mallet has one, and it is
            // the quickest way to read "putter" at a glance.
            var insert = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.022, 0.084), M.insert);
            insert.position.set(0.0265, 0.030, 0.042);
            g.add(insert);

            // The sight line, pointing where the ball goes.
            var sight = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.003, 0.005), M.trim);
            sight.position.set(-0.006, 0.0138, 0.042);
            g.add(sight);

            // A plumber's neck: straight down off the shaft, then across to
            // the heel. Two cylinders and the club stops looking welded on.
            hosel = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.024, 12), M.head);
            hosel.position.set(0.004, 0.010, -0.004);
            g.add(hosel);
            var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.026, 12), M.head);
            neck.rotation.x = Math.PI / 2;
            neck.position.set(0.004, 0.021, 0.006);
            g.add(neck);

        } else {
            /* An iron. The blade is extruded backward from x = 0, so the face
               is the plane the shaft stands on and the loft rotation tilts
               exactly the thing you are looking at. */
            var wedgey = club.id === 'wedge';
            var h = wedgey ? 0.053 : 0.047;
            var blade = extruded(bladeShape(h), 0.011, 0.003);
            blade.rotateY(-Math.PI / 2);         // extrusion runs to -x, toe to +z
            var iron = new THREE.Mesh(blade, M.head);
            g.add(iron);

            /* A muscle back: a thicker pad along the sole behind the blade.
               It is what stops an iron reading as a butter knife, and it is
               where the weight really is. */
            var mus = extruded(muscleShape(h), 0.011, 0.004);
            mus.rotateY(-Math.PI / 2);
            mus.translate(-0.009, 0, 0);
            g.add(new THREE.Mesh(mus, M.head));

            var faceI = new THREE.Mesh(
                new THREE.PlaneGeometry(0.056, h - 0.016),
                M.grooves
            );
            faceI.rotation.y = Math.PI / 2;
            faceI.position.set(0.0034, h / 2 + 0.002, 0.040);
            g.add(faceI);

            hosel = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.0092, 0.040, 12), M.head);
            hosel.position.set(-0.004, 0.016, 0.003);
            g.add(hosel);
        }

        return g;
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

    /* Each club gets up its own hand, not just its own name: a driver reads
       hot and heavy because it is the reach club, a wedge reads soft and
       looping because it is the touch club, and so on. The gradient and the
       glow behind the type carry that; the words underneath do not have to. */
    var LABEL_STYLE = {
        driver: {
            font: '800 44px Outfit, system-ui, sans-serif',
            grad: ['#fff3b0', '#fb923c', '#ef4444'],
            glow: 'rgba(248, 113, 41, 0.85)', accent: '#fda57d'
        },
        wedge: {
            font: 'italic 700 40px Georgia, "Times New Roman", serif',
            grad: ['#fef9c3', '#facc15', '#ca8a04'],
            glow: 'rgba(250, 204, 21, 0.6)', accent: '#fde68a'
        },
        chipper: {
            font: '700 38px "JetBrains Mono", ui-monospace, monospace',
            grad: ['#bbf7d0', '#4ade80', '#16a34a'],
            glow: 'rgba(74, 222, 128, 0.55)', accent: '#86efac'
        },
        putter: {
            font: '600 40px Outfit, system-ui, sans-serif',
            grad: ['#e0f2fe', '#7dd3fc', '#38bdf8'],
            glow: 'rgba(125, 211, 252, 0.55)', accent: '#93c5fd'
        }
    };

    function labelTexture(club) {
        var cv = document.createElement('canvas');
        cv.width = 320; cv.height = 112;
        var g = cv.getContext('2d');
        g.clearRect(0, 0, 320, 112);

        g.fillStyle = 'rgba(6, 20, 32, 0.86)';
        g.strokeStyle = 'rgba(125, 211, 252, 0.5)';
        g.lineWidth = 3;
        if (g.roundRect) {
            g.beginPath(); g.roundRect(4, 4, 312, 104, 18); g.fill(); g.stroke();
        } else {
            g.fillRect(4, 4, 312, 104);
            g.strokeRect(4, 4, 312, 104);
        }

        var style = LABEL_STYLE[club.id] || LABEL_STYLE.chipper;
        g.textAlign = 'center';
        g.textBaseline = 'middle';

        // The name, in its own gradient and glow — this is the "personality"
        // half. Short enough that a linear gradient across the whole word
        // reads as a colour, not a smear.
        g.font = style.font;
        var grad = g.createLinearGradient(50, 0, 270, 0);
        style.grad.forEach(function (c, i) { grad.addColorStop(i / (style.grad.length - 1), c); });
        g.fillStyle = grad;
        g.shadowColor = style.glow;
        g.shadowBlur = 16;
        g.fillText(club.name, 160, 42);
        g.shadowBlur = 0;

        // The stats, kept to one short line — this is the part a player
        // actually compares club to club, so it stays plain and legible.
        g.fillStyle = style.accent;
        g.font = '600 22px "JetBrains Mono", ui-monospace, monospace';
        g.fillText('pwr ' + club.power + ' · loft ' + Math.round(club.loft * 180 / Math.PI) + '°', 160, 84);

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
        sprite.scale.set(0.33, 0.115, 1);
        sprite.renderOrder = 20;
        return sprite;
    }

    /* ── layout ────────────────────────────────────────────────────────── */

    /* Where each club sits, closed and open. Closed they are bunched in the
       mouth of the bag leaning back; open they fan across the screen, stand up,
       and come forward far enough to be worth clicking. */
    function layout(i, n, len) {
        var spread = (i - (n - 1) / 2);
        var floor = BAG_H - WELL;          // where a grip rests in its well
        return {
            /* Fanned, and each one turned to show its own head. The heads
               hang out to one side of their shafts now, so four clubs stood
               dead straight in a tight bunch simply hide behind each other —
               splaying them is what makes the bag read as four clubs. */
            closed: {
                x: spread * 0.052, y: floor, z: spread * 0.048,
                rz: -0.13 - spread * 0.05, rx: 0.05, ry: spread * 0.55, scale: 1
            },
            // Out of the bag altogether: stood up in a row across the middle of
            // the view, evenly spaced and square to the camera, where they can
            // be looked at properly.
            /* Out of the bag and right up to the camera, heads in a row at eye
               level with the shafts running down out of frame.

               A club is 45 inches of shaft and four of head. Shown whole at a
               size where the head can be read it is a lamp post, and the head
               is the entire thing you are choosing between — so the row is
               aligned on the heads (`-len` puts each one at the same height)
               and cropped by the bottom of the screen. The different lengths
               still show where they belong, which is standing in the bag. */
            open: {
                x: spread * 0.16, y: -len + 0.15, z: 0,
                rz: 0, rx: 0, ry: 0, scale: 1
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

        /* The clubs live in a rig of their own so that opening the bag can
           carry *them* into the middle of the view while the bag itself stays
           where it was. Closed, the two rigs sit on top of each other and the
           clubs are simply in the bag. */
        B.clubRig = new THREE.Group();

        C.CLUBS.forEach(function (club, i) {
            var built = buildClub(club, mats());
            var spot = layout(i, C.CLUBS.length, built.len);
            var label = buildLabel(club);

            built.group.add(label);
            // Centred on the head it belongs to, not guessed at: a driver's
            // body, a blade's toe and a mallet's wings all sit at a different
            // offset from the shaft, so the one fixed x/z this used before
            // was only ever right for one of the four. The box read straight
            // off the head geometry is right for all of them. Just under the
            // head rather than above it, because the open row is cropped to
            // the bottom of the screen and the heads already sit right
            // against the "pick a club" panel above.
            built.head.updateMatrixWorld(true);
            var headBox = new THREE.Box3().setFromObject(built.head);
            var headMid = headBox.getCenter(new THREE.Vector3());
            label.position.set(headMid.x, headBox.min.y - 0.09, headMid.z);

            B.clubRig.add(built.group);
            B.pickables.push(built.hit);
            B.clubs.push({
                id: club.id,
                club: club,
                len: built.len,
                group: built.group,
                head: built.head,
                label: label,
                spot: spot,
                now: { x: spot.closed.x, y: spot.closed.y, z: spot.closed.z, rz: spot.closed.rz, rx: spot.closed.rx, ry: spot.closed.ry, scale: 1, lift: 0, glow: 0, labelOp: 0 }
            });
        });

        // No shadows: it is a metre from the lens and would smear one across
        // the whole hole.
        B.clubRig.traverse(function (o) { o.castShadow = false; o.receiveShadow = false; });
        B.rig.traverse(function (o) { o.castShadow = false; o.receiveShadow = false; });
        scene.add(B.clubRig);
        /* A soft dark haze behind the bag. Chrome shafts against a bright sky
           are nearly invisible without something to sit against, and this is
           cheaper and calmer than an outline. */
        var haze = new THREE.Sprite(new THREE.SpriteMaterial({
            map: hazeTexture(), transparent: true, opacity: 0.3, depthWrite: false
        }));
        haze.scale.set(1.5, 2.0, 1);
        haze.position.set(0.05, 0.75, -0.3);
        B.haze = haze;
        B.rig.add(haze);

        var lamp = new THREE.PointLight(0xfff2dd, 0.55, 3.2);
        lamp.position.set(0.6, 1.2, 0.9);
        B.rig.add(lamp);

        /* A light that travels with the clubs. The bag's lamp stays in the
           corner when the picker opens, and the course's own sun is behind
           the row — without this the heads come forward into their own
           shadow and every one of them is the same flat grey. */
        B.lamp = new THREE.PointLight(0xfff6e6, 0.3, 6);
        B.lamp.position.set(0.35, 0.75, 1.3);
        B.clubRig.add(B.lamp);

        scene.add(B.rig);

        B.ray = new THREE.Raycaster();
        B.ndc = new THREE.Vector2();
        B.ready = true;
        setSelected(C.DEFAULT_CLUB);
        return B.rig;
    }

    /* ── per frame ─────────────────────────────────────────────────────── */

    var _off = new THREE.Vector3();

    /* Parked at an offset in camera space and turned off-axis so it reads as an
       object with sides. Opening slides the whole rig from the corner — where
       it is deliberately half off the bottom of the screen — to the middle of
       the view, and squares it up to the camera on the way. */
    function place(camera, aspect) {
        if (!B.ready) return;
        var k = B.open01;
        var wide = aspect > 0.95;

        // The bag: low in a corner, half of it below the bottom of the screen.
        // Only the cuff and the heads standing in it are meant to show.
        var cx = wide ? -0.76 : -0.48, cy = wide ? -0.88 : -0.96, cz = -1.5;
        put(B.rig, camera, cx, cy, cz, 0.52, -0.62, 0.1);

        // The clubs: the same place when shut, the middle of the view when
        // open, squaring up to the camera as they come.
        put(B.clubRig, camera,
            cx + (0 - cx) * k,
            cy + (-0.26 - cy) * k,
            cz + (-1.3 - cz) * k,
            0.52 + 1.48 * k,          // they come up to the lens
            -0.62 + 0.62 * k,
            0.1 - 0.1 * k);
    }

    function put(rig, camera, x, y, z, scale, twistY, twistX) {
        _off.set(x, y, z);
        _off.applyQuaternion(camera.quaternion);
        rig.position.copy(camera.position).add(_off);
        rig.quaternion.copy(camera.quaternion);
        rig.rotateY(twistY);
        rig.rotateX(twistX);
        rig.scale.setScalar(scale);
    }

    function update(dt, camera, aspect) {
        if (!B.ready) return;

        var ease = 1 - Math.pow(0.0008, dt);      // ~0.25s to settle
        B.open01 += ((B.expanded ? 1 : 0) - B.open01) * ease;
        if (B.open01 < 0.001) B.open01 = 0;
        B.spin += dt * 0.7;                        // a slow turn, once open
        place(camera, aspect);
        if (B.haze) B.haze.material.opacity = 0.3 * (1 - B.open01);
        if (B.lamp) B.lamp.intensity = 0.3 + 0.85 * B.open01;
        B.clubs.forEach(function (c) {
            var to = B.expanded ? c.spot.open : c.spot.closed;
            var chosen = c.id === B.selected;
            var facing = chosen || B.hover === c.id;
            // Kept small: at the zoom the open row uses, a tenth of a unit is
            // a fifth of the screen and the club in hand floats away from the
            // others instead of standing a little proud of them.
            var lift = chosen ? (B.expanded ? 0.022 : 0.045) : 0;
            var glow = chosen ? 1 : (B.hover === c.id ? 0.5 : 0);

            c.now.x += (to.x - c.now.x) * ease;
            c.now.y += (to.y - c.now.y) * ease;
            c.now.z += (to.z - c.now.z) * ease;
            c.now.rz += (to.rz - c.now.rz) * ease;
            c.now.rx += (to.rx - c.now.rx) * ease;
            c.now.ry += (to.ry - c.now.ry) * ease;
            /* No size bump for the club in hand. The open row is aligned on
               the *heads*, and scaling a club scales its length, so a 1.08
               bump lifted the driver's head four times further than the lift
               itself did — invisible in the bag, a hundred pixels out of line
               in the picker. It is marked by the glow and the panel instead. */
            c.now.scale += (to.scale - c.now.scale) * ease;
            c.now.lift += (lift - c.now.lift) * ease;
            c.now.glow += (glow - c.now.glow) * ease;

            c.group.position.set(c.now.x, c.now.y + c.now.lift, c.now.z);
            // Turning on its own axis while it is out of the bag, so the head
            // can be seen from every side. The one in hand turns to face front
            // instead of spinning, so it is obvious which is which — and so
            // does whichever one is under the pointer, because a label is not
            // worth reading while it is orbiting past.
            var turn = c.now.ry + B.open01 * (facing ? 0 : 1) * B.spin;
            c.group.rotation.set(c.now.rx, turn, c.now.rz);
            c.group.scale.setScalar(c.now.scale);

            // The club in hand catches a light of its own. Every club owns its
            // materials, so this stays on the one club it is meant for.
            /* Gentle. A driver crown is nearly black, and any more than
               this floods it pale blue — the club in hand ends up the one you
               can see least of. */
            var e = 0.15 * c.now.glow;
            c.group.traverse(function (o) {
                if (o.material && o.material.emissive) o.material.emissive.setRGB(e * 0.45, e * 0.7, e);
            });

            // The full write-up still lives in the panel above (game.js,
            // where it can be read by a screen reader); this is the fast
            // version, floating right over the club it is about — up while
            // the row is open and the club is the one in hand or under the
            // pointer, gone otherwise so four of them are never on at once.
            if (c.label) {
                var wantOp = (B.expanded && facing) ? 1 : 0;
                c.now.labelOp += (wantOp - c.now.labelOp) * ease;
                c.label.material.opacity = c.now.labelOp;
                c.label.visible = c.now.labelOp > 0.01;
            }
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
            var best = null, bestD = 0.2;       // a generous target in a row
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
