/* bag/models.js — a golf bag and four clubs, as geometry.
 *
 * Every mesh in the picker is made here and nothing here knows the picker
 * exists: give it a club out of `CONFIG.CLUBS` and get a group back. No state,
 * no camera, no layout, no interaction — those are bag.js's, next door.
 *
 * ## Built to real numbers
 *
 * The first pass was drawn from memory and came out looking like a bin. This
 * one is built to the real thing: a cart bag is about 35 inches tall with a 9
 * to 10.5 inch cuff — near enough four times as tall as it is wide, where mine
 * had been under two — and it holds a 45 inch driver, 35.5 inch wedges and a
 * 34 inch putter. Those are the numbers below, in metres, and they are why the
 * driver towers over the other heads, why the putter barely clears the cuff,
 * and why the labels stagger themselves without being told to. Sources are in
 * the README.
 *
 * ## Adding a club
 *
 * A fifth club is an entry in `CONFIG.CLUBS` plus, here, a length in `LENGTHS`
 * and a branch in `buildHead()` — and then it appears in the bag, in the fan,
 * with a label, pickable, with no markup and no CSS. Each head is turned by
 * that club's own loft, so the difference between the driver and the wedge is
 * not a caption, it is the angle of the face you are looking at.
 * `render-tests.html` fails if a club in the config has no length here.
 *
 * Depends on config.js and THREE. Nothing else.
 */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;

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

    /* A cart bag: 0.89 tall, a 0.26 cuff, and the details that make it one
       rather than a cylinder — a divider cross in the mouth, stitched seams, a
       zip pocket, a padded strap and a foot ring. */
    var BAG_H = 0.89, BAG_R = 0.13, WELL = 0.72;

    /* ── the bag itself ────────────────────────────────────────────────── */

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
        sprite.scale.set(0.29, 0.10, 1);
        sprite.renderOrder = 20;
        return sprite;
    }

    G3.clubModels = {
        LENGTHS: LENGTHS,
        /* The bag's own dimensions, for the layout next door. `floor` is the
           one it actually wants: how high off the ground a grip rests once the
           club is standing in its well, which is what decides where a club
           starts from and how tall the bag stands with its clubs in it. */
        BAG: { height: BAG_H, radius: BAG_R, well: WELL, floor: BAG_H - WELL },
        materials: mats,
        club: buildClub,
        head: buildHead,
        body: buildBody,
        label: buildLabel,
        haze: hazeTexture
    };

})(window.G3);
