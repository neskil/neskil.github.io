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
        settled: false,        // shut, still, and nothing left to ease
        selected: null,
        ray: null,
        ndc: null,
        ready: false,
        hover: null,
        // Where the rig is, as a blend between tucked away and front and
        // centre. Everything about the open state is this number.
        open01: 0,
        spin: 0,
        // How the open row is arranged, and how big it can be — both read off
        // the shape of the screen, so they are recomputed rather than baked.
        cols: 0,
        openScale: 2,
        openY: -0.26,
        crest: 1.31          // how tall the bag stands with its clubs in it
    };

    /* ── colour ────────────────────────────────────────────────────────── */

    /* Every colour below is written in sRGB — the same hex the stylesheet uses
       — and converted here, once, at the point it is written.

       This is not a nicety. three.js at r128 hands a material colour to the
       shader untouched and then encodes the finished frame to sRGB on the way
       out, so a colour written dark is lit as though it were much lighter and
       leaves lighter still: #2a3138 leather came back off the screen as a mid
       grey. That is the whole reason the bag read as a beige bucket rather
       than the black cart bag it was modelled as, and why four clubs whose
       heads are three different greys all arrived the same shade of white.
       Converting on the way in puts the written palette back on the screen. */
    function ink(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }

    /* A canvas is drawn in sRGB too, and three.js will decode it for us if it
       is told what it is holding. Without this the labels come out of the same
       double-encoding the materials did: pale, washed and low in contrast. */
    function srgbCanvas(cv) {
        var t = new THREE.CanvasTexture(cv);
        if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
        t.anisotropy = 4;
        return t;
    }

    /* One typeface, in two weights, for every word this file draws — the
       names on the club cards and the maker's patch on the bag alike. What
       the first pass did instead, and why it did not work, is under `labels`
       below. */
    var FACE = '"Outfit", system-ui, -apple-system, "Segoe UI", sans-serif';
    var FIGS = '"JetBrains Mono", ui-monospace, "SFMono-Regular", monospace';

    /* One palette per club, and it is the same palette everywhere the club
       appears: the collar under its head in the bag, its name on its label,
       and the two figures under the name. Four coloured collars standing in
       the cuff is what makes the shut bag read as four *different* clubs at a
       glance — and it is already the picker's legend before the picker opens. */
    var CLUB_LOOK = {
        putter:  { name: '#7dd3fc', metal: 0x38bdf8 },
        driver:  { name: '#fdba74', metal: 0xf97316 },
        iron:    { name: '#c4b5fd', metal: 0x8b5cf6 },
        chipper: { name: '#86efac', metal: 0x22c55e },
        wedge:   { name: '#fde68a', metal: 0xeab308 }
    };
    function look(id) { return CLUB_LOOK[id] || CLUB_LOOK.chipper; }

    /* ── materials ─────────────────────────────────────────────────────── */

    /* Specular colours are as considered as the diffuse ones. A white
       highlight on every metal is what turned four heads into four white
       blobs: chrome reflects the sky it is standing under, not a studio
       flash, so the speculars here are grey and the shininess is low enough
       that the highlight is a sheen across the crown rather than one hard
       dot per light. */
    function mats() {
        return {
            leather: new THREE.MeshLambertMaterial({ color: ink(0x59636f) }),
            panel: new THREE.MeshLambertMaterial({ color: ink(0x6d7886) }),
            trim: new THREE.MeshLambertMaterial({ color: ink(0x2b93c8) }),
            dark: new THREE.MeshLambertMaterial({ color: ink(0x353d47) }),
            /* The inside of the bag, which used to be the outside of the
               world: a cylinder is single-sided, so looking down into the
               mouth looked straight through the far wall at the sea.

               It is lit by nothing the scene owns — a light out here
               reaches the far wall and no other — so it is painted rather
               than lit: bright at the rim where the daylight gets in, dark
               at the bottom of the well. A flat tone made the mouth a hole
               cut in the bag; the fall-off is what makes it a depth. */
            liner: new THREE.MeshBasicMaterial({ map: linerTexture(), side: THREE.BackSide }),
            well: new THREE.MeshBasicMaterial({ color: ink(0x191f26) }),
            crown: new THREE.MeshPhongMaterial({
                color: ink(0x36435a), shininess: 26, specular: ink(0x39434f)
            }),
            insert: new THREE.MeshPhongMaterial({ color: ink(0x1e2932), shininess: 20, specular: ink(0x252c33) }),
            steel: new THREE.MeshPhongMaterial({ color: ink(0x8f9aa6), shininess: 60, specular: ink(0x5a636d) }),
            grip: new THREE.MeshLambertMaterial({ color: ink(0x1d2127) }),
            head: new THREE.MeshPhongMaterial({ color: ink(0x929daa), shininess: 70, specular: ink(0x646d77) }),
            face: new THREE.MeshPhongMaterial({ color: ink(0xb9c4cf), shininess: 50, specular: ink(0x4c545c) }),
            grooves: new THREE.MeshPhongMaterial({
                map: grooveTexture(), shininess: 40, specular: ink(0x4c545c), side: THREE.DoubleSide
            })
        };
    }

    // Daylight falling into an open bag, drawn: a strip, light at the top.
    var _liner = null;
    function linerTexture() {
        if (_liner) return _liner;
        var cv = document.createElement('canvas');
        cv.width = 4; cv.height = 64;
        var g = cv.getContext('2d');
        var grd = g.createLinearGradient(0, 0, 0, 64);
        grd.addColorStop(0, '#5b6773');
        grd.addColorStop(0.28, '#39424c');
        grd.addColorStop(1, '#12171d');
        g.fillStyle = grd;
        g.fillRect(0, 0, 4, 64);
        _liner = srgbCanvas(cv);
        return _liner;
    }

    // Grooves, drawn: a dozen lines across a face is a texture, not geometry.
    var _grooves = null;
    function grooveTexture() {
        if (_grooves) return _grooves;
        var cv = document.createElement('canvas');
        cv.width = cv.height = 64;
        var g = cv.getContext('2d');
        g.fillStyle = '#b6c1cc';
        g.fillRect(0, 0, 64, 64);
        g.strokeStyle = 'rgba(28, 36, 45, 0.6)';
        g.lineWidth = 2;
        for (var y = 8; y < 60; y += 6) {
            g.beginPath(); g.moveTo(4, y); g.lineTo(60, y); g.stroke();
        }
        _grooves = srgbCanvas(cv);
        return _grooves;
    }

    /* ── one club ──────────────────────────────────────────────────────── */

    // Real lengths, in metres. A driver is 45 inches, a 7 iron 38, wedges 35.5,
    // a putter 34.
    var LENGTHS = { driver: 1.14, iron: 0.97, chipper: 0.95, wedge: 0.90, putter: 0.86 };

    /* Grip, shaft, ferrule, head — bottom to top, because that is the order
       they are stacked in and the order they read in. The head is a different
       shape per club and is turned by the club's own loft about the axis across
       the face, which is the whole point of looking at it: an open face means
       the ball goes up. */
    /* A shaft tapers from a 0.0085 grip end to a 0.0055 tip, so a shortened
       stand-in for it (see STUB below) is cut from the same cone rather than
       drawn as a uniform rod: its cut end takes whatever radius the full
       shaft would have had at that height. */
    function taperedShaft(len, height) {
        height = Math.min(height, len);
        var rTop = 0.0055, rBottom = 0.0085;
        var rCut = rBottom + (rTop - rBottom) * ((len - height) / len);
        return new THREE.CylinderGeometry(rTop, rCut, height, 10);
    }

    /* How much shaft shows near the head once the picker has wrapped into a
       grid of more than one row (see relayoutOpen / syncStubs). A shaft is
       real-world length — 0.86 to 1.14 metres — and a row is 0.42 apart, so
       drawn whole every club's shaft runs on well past the row under it and
       out the far side of whatever club is parked there. Cut to a stub short
       enough to clear the next row down, a club still reads as a club — head,
       ferrule and a hand's width of shaft — without appearing to belong to
       its neighbour's card. */
    var STUB = 0.34;

    function buildClub(club, M) {
        var g = new THREE.Group();
        var len = LENGTHS[club.id] || 0.95;

        var fullGeo = taperedShaft(len, len);
        var stubLen = Math.min(len, STUB);
        var stubGeo = taperedShaft(len, stubLen);
        var shaft = new THREE.Mesh(fullGeo, M.steel);
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

        /* The ferrule: the little collar where shaft meets head. Two
           millimetres of trim that does more for "this is a golf club" than
           anything else on the shaft — and, since it is the one part of a
           club that is allowed to be any colour at all, this is where each
           club wears its own. It sits above the cuff on a shut bag, so four
           clubs bunched in the mouth are four colours rather than four
           silhouettes. */
        var ferrule = new THREE.Mesh(
            new THREE.CylinderGeometry(0.0112, 0.0096, 0.030, 10),
            new THREE.MeshPhongMaterial({
                color: ink(look(club.id).metal), shininess: 44, specular: ink(0x3a4249)
            }));
        ferrule.position.y = len - 0.03;
        g.add(ferrule);
        var collar = new THREE.Mesh(new THREE.CylinderGeometry(0.0118, 0.0118, 0.007, 10), M.dark);
        collar.position.y = len - 0.047;
        g.add(collar);

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
        return {
            group: g, hit: hit, head: head, len: len,
            shaft: shaft, fullGeo: fullGeo, stubGeo: stubGeo, stubLen: stubLen,
            grip: grip, cap: cap
        };
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
            var wedgey = club.id === 'wedge' || club.id === 'checker';
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
       zip pocket, a padded strap and a foot ring.

       Where those details *sit* matters as much as having them. The bag stands
       mostly below the bottom of the screen on purpose, so everything that
       says "golf bag" rather than "bin" has to live in the hand's width of it
       that shows: the cuff, the piping under it, the panel with the name on
       it and the carry handle. The pocket, the strap and the foot
       ring are still modelled, and are still the first things you see if the
       window is tall enough to show them, but they are no longer carrying the
       silhouette on their own. */
    var BAG_H = 0.89, BAG_R = 0.13, WELL = 0.72;

    /* Which way round the bag is standing, as an angle about its own axis.
       `place` twists the whole rig by -TWIST so it is seen from the corner
       rather than square on, which means the part of it facing the camera is
       this far round from local +z. Anything meant to be *read* — the name on
       the side — is centred here rather than on the bag's nominal front. */
    var TWIST = 0.62, FACING = TWIST;

    /* The name on the side, drawn rather than modelled. A bag with nothing on
       it is a container; a bag with a maker on it is somebody's. */
    var _mono = null;
    function monogramTexture() {
        if (_mono) return _mono;
        var cv = document.createElement('canvas');
        cv.width = 256; cv.height = 144;
        var g = cv.getContext('2d');
        g.fillStyle = '#414d59';
        g.fillRect(0, 0, 256, 144);
        g.strokeStyle = 'rgba(148, 210, 240, 0.75)';
        g.lineWidth = 5;
        g.strokeRect(9, 9, 238, 126);
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        // Big enough to survive being a centimetre of curved canvas on a
        // laptop: a maker's patch nobody can read is a smudge.
        g.fillStyle = '#f2f9ff';
        g.font = '800 62px ' + FACE;
        g.fillText('LOFT', 128, 52);
        g.fillStyle = '#a8dcf5';
        g.font = '800 46px ' + FACE;
        g.fillText('LINKS', 128, 104);
        _mono = srgbCanvas(cv);
        return _mono;
    }

    function buildBody(M) {
        var g = new THREE.Group();

        /* Open at the top, both here and at the cuff. A three.js cylinder is
           capped by default, and those two caps were a pair of solid discs
           lying across the mouth: the clubs came *through* the lid rather
           than standing in the bag, which is most of why the whole thing read
           as a bin with sticks in it. The lining below is what the mouth
           shows now. */
        var body = new THREE.Mesh(
            new THREE.CylinderGeometry(BAG_R, BAG_R * 0.86, BAG_H, 24, 1, true), M.leather);
        body.position.y = BAG_H / 2;
        g.add(body);

        // The lining, and the floor of the well the grips rest on. Both exist
        // only so that the mouth reads as an inside.
        var liner = new THREE.Mesh(
            new THREE.CylinderGeometry(BAG_R * 0.99, BAG_R * 0.84, WELL + 0.01, 20, 1, true), M.liner);
        liner.position.y = BAG_H - (WELL + 0.01) / 2 + 0.005;
        g.add(liner);
        var floor = new THREE.Mesh(new THREE.CircleGeometry(BAG_R * 0.84, 20), M.well);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = BAG_H - WELL;
        g.add(floor);

        /* The panel with the name on it, and the accent piping over it, both
           held up under the cuff where they can be seen. Below about y = 0.55
           the bag is off the bottom of the screen on a phone. */
        var panel = new THREE.Mesh(new THREE.CylinderGeometry(BAG_R * 1.015, BAG_R * 0.985, 0.24, 24), M.panel);
        panel.position.y = BAG_H * 0.74;
        g.add(panel);

        /* Centred on the face the camera is actually looking at, not on the
           bag's own front: the rig stands turned off-axis so it reads as an
           object with sides, and a patch centred on local +z spent half of
           itself round the side. FACING is that turn. */
        _monoMat = new THREE.MeshLambertMaterial({ map: monogramTexture(), side: THREE.DoubleSide });
        var mono = new THREE.Mesh(
            new THREE.CylinderGeometry(BAG_R * 1.03, BAG_R * 1.02, 0.115, 16, 1, true,
                FACING - 0.58, 1.16),
            _monoMat);
        mono.position.y = BAG_H * 0.74;
        g.add(mono);

        var band = new THREE.Mesh(new THREE.CylinderGeometry(BAG_R * 1.035, BAG_R * 1.03, 0.018, 24), M.trim);
        band.position.y = BAG_H * 0.86;
        g.add(band);

        [0.40, 0.62].forEach(function (f) {
            var seam = new THREE.Mesh(new THREE.TorusGeometry(BAG_R * 0.99, 0.004, 6, 26), M.dark);
            seam.rotation.x = Math.PI / 2;
            seam.position.y = BAG_H * f;
            g.add(seam);
        });

        var cuff = new THREE.Mesh(
            new THREE.CylinderGeometry(BAG_R * 1.06, BAG_R * 1.02, 0.075, 24, 1, true), M.dark);
        cuff.position.y = BAG_H - 0.035;
        g.add(cuff);
        var lip = new THREE.Mesh(new THREE.TorusGeometry(BAG_R * 1.06, 0.011, 8, 26), M.dark);
        lip.rotation.x = Math.PI / 2;
        lip.position.y = BAG_H;
        g.add(lip);

        /* The carry handle over the mouth. It is the one part of a bag nobody
           mistakes for anything else, and at this crop it is right in the
           middle of what shows. */
        var handle = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.008, 6, 18, Math.PI), M.panel);
        handle.rotation.y = Math.PI / 2;
        handle.position.set(-BAG_R * 0.72, BAG_H - 0.02, 0);
        g.add(handle);

        // The divider cross. Real bags run fourteen full-length slots; four is
        // as many as reads at this size, and it is what the clubs sit in.
        [0, Math.PI / 2].forEach(function (a) {
            var d = new THREE.Mesh(new THREE.BoxGeometry(BAG_R * 1.94, 0.05, 0.008), M.dark);
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
        pocket.position.set(0, 0.30, 0.10);
        g.add(pocket);
        var zip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.008, 0.006), M.trim);
        zip.position.set(0, 0.41, 0.142);
        g.add(zip);
        var pull = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.005), M.trim);
        pull.position.set(0.06, 0.392, 0.145);
        g.add(pull);

        var ball = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.13, 0.06), M.panel);
        ball.position.set(0.105, 0.18, 0.045);
        ball.rotation.y = -0.7;
        g.add(ball);

        var strap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.60, 0.012), M.dark);
        strap.position.set(-0.115, 0.42, 0.045);
        strap.rotation.z = 0.16;
        g.add(strap);
        var pad = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.22, 0.022), M.panel);
        pad.position.set(-0.125, 0.50, 0.045);
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

    /* One typeface (FACE and FIGS, at the top of this file), in two weights,
       for everything on a label.

       The first pass gave each club a *font* of its own — the driver in a
       heavy sans, the wedge in an italic serif, the chipper in a monospace —
       on the theory that four different faces would read as four different
       personalities. Four faces on four cards standing side by side read as
       four different games. A club is told apart by its colour and by the
       shape of the head above the card; the type's whole job is to be read
       at a glance from across a phone, and the face that does that best is
       the one the rest of the page is already set in.

       Labels are drawn on a canvas, and a canvas draws with whatever font the
       browser has *at the moment fillText runs*. The web font arrives a
       heartbeat later than the first frame does, so every label was being
       baked in the fallback face and kept it for the rest of the round —
       which is a good half of why the type never looked like the page's.
       Redrawing once the font is in costs four canvases, once. */
    var _labelled = [];
    var _monoMat = null;
    function watchFonts() {
        if (!document.fonts || !document.fonts.ready) return;
        document.fonts.ready.then(function () {
            _labelled.forEach(function (c) {
                c.label.material.map = labelTexture(c.club);
                c.label.material.needsUpdate = true;
            });
            if (_monoMat) {
                _mono = null;
                _monoMat.map = monogramTexture();
                _monoMat.needsUpdate = true;
            }
        })['catch'](function () { /* no fonts API, no redraw, no harm */ });
    }

    /* ── one label ─────────────────────────────────────────────────────── */

    /* What a label has to answer is "what does this club do", and the two
       numbers that answer it are the loft and the ceiling on power. They used
       to be a line of shorthand — `pwr 14 · loft 22°` — which is the data and
       none of the meaning: 14 is in units nobody outside physics.js has ever
       seen, and a number of degrees is only a picture if you already have the
       picture.

       So both are drawn as well as written. The loft is the face itself, at
       the angle it is really set to, with the launch line off it: a wedge's
       card shows a face lying right back and a line going up, a putter's
       shows a face standing straight and a line along the ground. The power
       is a bar filled against the biggest club in the bag, so "the driver is
       the reach club" is a length rather than a claim. The figures stay
       underneath for anyone who wants them. */

    var LABEL_W = 368, LABEL_H = 166;

    function maxPower() {
        var m = 0;
        C.CLUBS.forEach(function (c) { m = Math.max(m, c.power); });
        return m || 1;
    }

    function roundRect(g, x, y, w, h, r) {
        if (g.roundRect) { g.beginPath(); g.roundRect(x, y, w, h, r); return; }
        g.beginPath();
        g.moveTo(x + r, y);
        g.arcTo(x + w, y, x + w, y + h, r);
        g.arcTo(x + w, y + h, x, y + h, r);
        g.arcTo(x, y + h, x, y, r);
        g.arcTo(x, y, x + w, y, r);
        g.closePath();
    }

    /* The loft, drawn: a ball on the ground, the face set at the club's own
       angle behind it, and the line the ball leaves on. Four degrees is a
       number; this is what four degrees does, and what forty-two does instead.

       The club stands behind the ball, where it stands at address — drawn
       over the ball it read as a club buried in it, and the launch line
       started from thin air instead of from the ball it is launching. */
    function drawLoft(g, cx, cy, deg, tint) {
        var rad = deg * Math.PI / 180;
        var R = 34;
        var bx = cx + 9, by = cy - 5;   // the ball, sitting on the ground

        // The ground, running under both.
        g.strokeStyle = 'rgba(148, 176, 199, 0.45)';
        g.lineWidth = 2;
        g.beginPath(); g.moveTo(cx - 26, cy); g.lineTo(bx + R, cy); g.stroke();

        /* The face, leaned back by the loft: the top tips away from the ball,
           which is what opening a face looks like from the side. Drawn first,
           so the ball sits in front of it rather than behind. */
        g.save();
        g.translate(cx, cy);
        g.rotate(-rad);
        g.fillStyle = tint;
        g.fillRect(-5, -26, 5, 26);
        g.fillStyle = 'rgba(255, 255, 255, 0.32)';
        g.fillRect(-5, -26, 5, 5);
        g.restore();

        // The line off the face, from the ball rather than from the club.
        var grad = g.createLinearGradient(bx, by, bx + R * Math.cos(rad), by - R * Math.sin(rad));
        grad.addColorStop(0, tint);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        g.strokeStyle = grad;
        g.lineWidth = 4;
        g.beginPath();
        g.moveTo(bx, by);
        g.lineTo(bx + R * Math.cos(rad), by - R * Math.sin(rad));
        g.stroke();

        g.fillStyle = 'rgba(233, 244, 255, 0.92)';
        g.beginPath(); g.arc(bx, by, 5, 0, Math.PI * 2); g.fill();
    }

    // The ceiling on power, against the biggest club in the bag.
    function drawPower(g, x, y, w, h, frac, tint) {
        roundRect(g, x, y, w, h, h / 2);
        g.fillStyle = 'rgba(148, 176, 199, 0.20)';
        g.fill();
        roundRect(g, x, y, Math.max(h, w * frac), h, h / 2);
        g.fillStyle = tint;
        g.fill();
    }

    function labelTexture(club) {
        var cv = document.createElement('canvas');
        cv.width = LABEL_W; cv.height = LABEL_H;
        var g = cv.getContext('2d');
        var tint = look(club.id);
        g.clearRect(0, 0, LABEL_W, LABEL_H);

        /* The card. Darker and more opaque than it was: it is read against
           bright grass and brighter water, and a card you have to squint
           through is a card nobody reads. */
        roundRect(g, 4, 4, LABEL_W - 8, LABEL_H - 8, 22);
        g.fillStyle = 'rgba(5, 16, 26, 0.94)';
        g.fill();
        g.strokeStyle = 'rgba(125, 211, 252, 0.32)';
        g.lineWidth = 3;
        g.stroke();

        /* The name, in the page's own face, in one flat colour: a gradient
           across four letters is a smear at the size this is read from. */
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillStyle = tint.name;
        g.font = '800 44px ' + FACE;
        g.fillText(club.name, LABEL_W / 2, 42);

        g.strokeStyle = 'rgba(148, 176, 199, 0.20)';
        g.lineWidth = 2;
        g.beginPath(); g.moveTo(44, 72); g.lineTo(LABEL_W - 44, 72); g.stroke();

        g.textAlign = 'left';
        var deg = Math.round(club.loft * 180 / Math.PI);

        // Left: the loft, as a figure and as the picture of it.
        g.fillStyle = 'rgba(159, 182, 201, 0.9)';
        g.font = '700 16px ' + FACE;
        g.fillText('LOFT', 26, 92);
        g.fillStyle = '#eaf6ff';
        g.font = '700 27px ' + FIGS;
        g.fillText(deg + '\u00b0', 26, 124);
        drawLoft(g, 112, 134, deg, tint.name);

        // Right: the ceiling on power, as a figure and as a length. The bar
        // is filled against the biggest club in the bag, so "the driver is
        // the reach club" is something you can see rather than work out.
        var x = 206;
        g.fillStyle = 'rgba(159, 182, 201, 0.9)';
        g.font = '700 16px ' + FACE;
        g.fillText('POWER', x, 92);
        g.fillStyle = '#eaf6ff';
        g.font = '700 27px ' + FIGS;
        g.fillText(String(club.power), x, 124);
        drawPower(g, x, 142, LABEL_W - 26 - x, 11, club.power / maxPower(), tint.name);

        return srgbCanvas(cv);
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
        return srgbCanvas(cv);
    }

    function buildLabel(club) {
        var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: labelTexture(club), transparent: true, opacity: 0, depthTest: false
        }));
        sprite.scale.set(0.26, 0.26 * LABEL_H / LABEL_W, 1);
        sprite.renderOrder = 20;
        return sprite;
    }

    /* ── layout ────────────────────────────────────────────────────────── */

    /* The open row, in numbers.

       The gaps first: clubs in a single row stand closer together than a label
       is wide and the labels are staggered to two heights to survive it, which
       is a trick that only works once — a wrapped grid has to hold its labels
       a full label apart instead. Then what a row costs in height: from the
       top of a head down to the bottom of the label hanging under it, which is
       further in a staggered row than a level one.

       Everything the fit below does is arithmetic on these six numbers and the
       frustum, so a new club, a new label size or a phone nobody has held yet
       all come out right without a new constant. */
    var COL_ROW = 0.175, COL_GRID = 0.32, ROW = 0.42;
    var HALF_LABEL = 0.145;                // half a label, and a hair over
    var HEAD_TOP = 0.21;                   // head above the row's own line
    var TAIL_ROW = 0.40, TAIL_GRID = 0.15; // label below it, staggered or not

    var OPEN_DEPTH = 1.3;      // how far in front of the lens the clubs come
    var MAX_OPEN = 2;          // and how big they are allowed to get there

    /* And the corner the shut bag stands in, in the same spirit: how far out
       toward the left edge, and how far its tallest head crests above whatever
       the shot controls are using along the bottom. Fractions of the frame,
       not distances in metres — a fixed offset in camera space is a different
       place on every screen, and the one that tucked the bag into the corner
       of a laptop put it off the side of a phone held upright, where the
       frustum is half as wide but exactly as tall. */
    var BAG_DEPTH = 1.5, BAG_SCALE = 0.46;
    var BAG_EDGE = 0.74;       // 1 would be the left edge itself
    var BAG_CLEAR = 0.20;      // in half-heights, above the controls' top
    /* …and however deep the controls are, the heads crest somewhere between
       these two. A tall monitor makes the meter a thin strip near the bottom,
       and a bag that only had to clear that would sink out of sight. */
    var BAG_LOW = -0.52, BAG_HIGH = -0.28;

    /* The band of the screen the clubs may use. Not the whole of it: the panel
       naming the club is along the top and the power meter and Swing are along
       the bottom, and a label that lands under either is a label nobody can
       read.

       Both of those are DOM, and how much room they take is a font size, a
       line count and a phone away from anything the renderer knows — so game.js
       measures them and says (`setBand`), in fractions of the stage's height.
       These are the fallbacks for the frame before it has. */
    var BAND = { top: 0.22, bottom: 0.20 };

    /* Below this the heads are too small to tell apart, and a row that cannot
       reach it wraps into a grid instead. In practice a phone held upright
       clears it and keeps the single row; it is a five-club bag in a letterbox
       window that wraps. */
    var MIN_ROW = 0.62;

    /* The clubs actually in the bag on this hole. Everything that arranges,
       measures or picks a club works off this rather than off `B.clubs`,
       which is the whole modelled set — so a hole played out of two clubs
       gets two clubs in the mouth of the bag, two heads in the open row, and
       no way to select a third. */
    function live() {
        var out = [], i;
        for (i = 0; i < B.clubs.length; i++) if (B.clubs[i].on) out.push(B.clubs[i]);
        return out;
    }

    /* Hand the bag this hole's clubs, by id and in order. Called on every
       hole, because a hole that says nothing is still saying "all five". */
    function setBag(clubs) {
        var want = {}, i;
        (clubs || C.CLUBS).forEach(function (c) { want[c.id] = 1; });
        for (i = 0; i < B.clubs.length; i++) {
            B.clubs[i].on = !!want[B.clubs[i].id];
            B.clubs[i].group.visible = B.clubs[i].on;
        }
        var row = live();
        B.crest = 0;
        row.forEach(function (c, i2) {
            c.spot.closed = closedSpot(i2, row.length);
            /* Snapped rather than animated into place. The bag changes between
               holes, with the screen going through a hole card either way, and
               a club sliding across the corner of the view to a new slot on
               the first frame of a new hole reads as a glitch rather than as
               an arrangement. */
            c.now.x = c.spot.closed.x; c.now.y = c.spot.closed.y; c.now.z = c.spot.closed.z;
            c.now.rz = c.spot.closed.rz; c.now.rx = c.spot.closed.rx; c.now.ry = c.spot.closed.ry;
            c.now.lift = 0; c.now.glow = 0; c.now.labelOp = 0;
            B.crest = Math.max(B.crest, BAG_H - WELL + c.len);
        });
        relayoutOpen(row.length);
        B.settled = false;
    }

    /* Where each club sits when the bag is shut: bunched in its mouth, leaning
       back, and each one turned to show its own head. The heads hang out to one
       side of their shafts, so four clubs stood dead straight in a tight bunch
       simply hide behind each other — splaying them is what makes the bag read
       as four clubs. */
    function closedSpot(i, n) {
        var spread = (i - (n - 1) / 2);
        var floor = BAG_H - WELL;          // where a grip rests in its well
        /* Tighter, and leaning less, than the first arrangement. A bunch as
           wide as this one was put the outer two grips within a centimetre of
           the wall, and the lean then carried their shafts out across the
           bag's own silhouette: two clubs in a bag and two propped against
           it. Everything here now stands inside the mouth it came out of. */
        return {
            x: spread * 0.034, y: floor, z: spread * 0.030,
            rz: -0.075 - spread * 0.028, rx: 0.03, ry: spread * 0.55, scale: 1
        };
    }

    /* And where it goes when the bag opens: out of it altogether and right up
       to the camera, heads at eye level with the shafts running down out of
       frame.

       A club is 45 inches of shaft and four of head. Shown whole at a size
       where the head can be read it is a lamp post, and the head is the entire
       thing you are choosing between — so the row is aligned on the heads
       (`-len` puts every one of them at the same height) and cropped by the
       bottom of the screen.

       `cols` is what makes this survive a phone held upright. One row of four
       is right on a laptop and runs off both edges of a portrait screen, which
       is half as wide as it is tall: the frustum is a fixed shape and the row
       was not. Fewer columns and more rows, and the whole thing is then scaled
       to what the frustum will actually take (see `fitOpen`). */
    function openSpot(i, cols, rows, n, len) {
        var col = i % cols;
        var row = Math.floor(i / cols);
        return {
            x: (col - (cols - 1) / 2) * (cols === n ? COL_ROW : COL_GRID),
            // Rows stack downward, and the block is recentred on itself so
            // adding one does not push the first row off the top.
            y: -len + 0.15 - row * ROW + (rows - 1) * ROW / 2,
            z: 0, rz: 0, rx: 0, ry: 0, scale: 1
        };
    }

    /* What a given arrangement costs: half its width, half its height, and
       where its own middle sits relative to the line the clubs are laid out
       on. The last one matters because the block is not symmetrical — every
       label hangs below its head — so centring it means knowing how far off
       centre it already is. */
    function openMetrics(cols, rows, n) {
        var grid = cols !== n;
        var top = HEAD_TOP;
        var bottom = -(grid ? TAIL_GRID : TAIL_ROW) - (rows - 1) * ROW;
        return {
            halfW: (cols - 1) / 2 * (grid ? COL_GRID : COL_ROW) + HALF_LABEL,
            halfH: (top - bottom) / 2,
            // openSpot recentres the rows on the layout line, so the block's
            // middle moves back up by half of what the extra rows added.
            mid: (top + bottom) / 2 + (rows - 1) * ROW / 2
        };
    }

    /* How big the arrangement can be at OPEN_DEPTH, and where it has to sit to
       be centred in the band it is allowed. Both half-extents of the frustum
       are known there and both of the block are known from the layout, so this
       is a division rather than a guess — which is the whole difference
       between fitting every screen and fitting the one it was tuned on. */
    function fitOpen(camera, aspect, cols, rows, n) {
        var halfH = Math.tan((camera.fov || 52) * Math.PI / 360) * OPEN_DEPTH;
        var halfW = halfH * aspect;
        var m = openMetrics(cols, rows, n);
        // The band, in the same units as the frustum: the middle of the screen
        // is 0 and the top edge is 1, so a strip taking a fifth of the height
        // off the top brings the ceiling down to 0.6.
        var top = 1 - 2 * BAND.top, bottom = -(1 - 2 * BAND.bottom);
        var widthScale = halfW * 0.94 / m.halfW;
        var heightScale = halfH * (top - bottom) / 2 / m.halfH;
        var scale = Math.min(MAX_OPEN, widthScale, heightScale);
        return {
            cols: cols,
            rows: rows,
            scale: scale,
            // Wrapping into more rows only wins back room when the row was
            // too *wide* for the frustum. On a short screen — a phone on its
            // side, where width is the one thing not in short supply — it is
            // the band above and below that is pinching the scale, and an
            // extra row only pinches it harder: more rows means a taller
            // block, and a taller block is worse off in the same band. So
            // this says whether halving the columns can actually help,
            // which is what keeps that case from halving its way to a
            // vanishing row instead of stopping at the widest one it has.
            narrowerHelps: widthScale < heightScale,
            y: halfH * (top + bottom) / 2 - m.mid * scale
        };
    }

    /* One row of four, and only something else when one row of four cannot be
       read: the arrangement is halved until it either fits at a usable size or
       there is nothing left to halve. A row is what the clubs are *for* — four
       heads side by side, compared at a glance — so it is what they get
       wherever the screen allows it. */
    function openFit(camera, aspect) {
        var n = live().length;
        var cols = n, fit;
        for (;;) {
            fit = fitOpen(camera, aspect, cols, Math.ceil(n / cols), n);
            if (fit.scale >= MIN_ROW || cols <= 2 || !fit.narrowerHelps) return fit;
            cols = Math.max(2, Math.ceil(cols / 2));
        }
    }

    /* Swap a club between its real shaft and the stub cut from the same cone
       (see STUB, above `buildClub`) — grip and cap go with it, since a stub
       does not reach far enough down to need them. Cheap to call every time
       the arrangement changes: it is a geometry pointer and two booleans,
       not a rebuild. */
    function applyStub(c, on) {
        if (c.stubOn === on) return;
        c.stubOn = on;
        c.shaft.geometry = on ? c.stubGeo : c.fullGeo;
        c.shaft.position.y = on ? c.len - c.stubLen / 2 : c.len / 2;
        c.grip.visible = !on;
        c.cap.visible = !on;
    }

    /* Only a wrapped grid — more than one row — sets a club's shaft back to
       its stub; a single row has nothing under it for a long shaft to run
       into, and the bag when shut wants every club whole. */
    function syncStubs() {
        var row = live();
        var grid = B.expanded && B.cols !== row.length;
        row.forEach(function (c) { applyStub(c, grid); });
    }

    /* Re-place the clubs for a new arrangement. Only the open half changes —
       the bag itself is the same bag whatever shape the window is. */
    function relayoutOpen(cols) {
        var row = live();
        var n = row.length;
        var rows = Math.ceil(n / cols);
        B.cols = cols;
        syncStubs();
        row.forEach(function (c, i) {
            c.spot.open = openSpot(i, cols, rows, n, c.len);
            // Labels are wider than the gap between two clubs, so in a single
            // row alternate ones are dropped further to stagger them into two
            // heights — exactly the pairing that would otherwise collide. In a
            // grid the rows have already done that job.
            /* The stagger is measured against the closest pair, not the
               average one: the cards hang under the heads they belong to and
               a driver's head is a different shape from a putter's, so the
               gap between two neighbouring cards is not the same gap twice.
               At 0.20 the tightest of them cleared by a fifth of a card,
               which on screen is two cards touching. */
            var drop = 0.08 + (cols === n ? (i % 2) * 0.26 : 0);
            if (c.label) c.label.position.set(c.labelBase.x, c.labelBase.y - drop, c.labelBase.z);
        });
    }

    function build(scene) {
        var M = mats();
        B.rig = new THREE.Group();
        B.pickables = [];
        B.clubs = [];
        _labelled = [];

        var body = buildBody(M);
        B.rig.add(body.group);
        B.pickables.push(body.hit);

        /* The clubs live in a rig of their own so that opening the bag can
           carry *them* into the middle of the view while the bag itself stays
           where it was. Closed, the two rigs sit on top of each other and the
           clubs are simply in the bag. */
        B.clubRig = new THREE.Group();

        /* Every club the game knows about is modelled, not just the ones in
           today's bag: a hole may hand out a club the default bag does not
           have (courses.bagFor), and rebuilding a putter's geometry on the tee
           of hole four is not something to do a hole at a time. `setBag` is
           what decides which of them are in the bag, in play and on screen. */
        C.ALL_CLUBS.forEach(function (club, i) {
            var built = buildClub(club, mats());
            var spot = { closed: closedSpot(i, C.ALL_CLUBS.length), open: null };
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
            //
            // Where it hangs from is read off the head geometry rather than
            // guessed at: a driver's body, a blade's toe and a mallet's wings
            // all sit at a different offset from the shaft, so the one fixed
            // x/z this used before was only ever right for one of the four.
            // How far below it hangs is the arrangement's business
            // (`relayoutOpen`), so only the anchor is kept here.
            built.head.updateMatrixWorld(true);
            var headBox = new THREE.Box3().setFromObject(built.head);
            var headMid = headBox.getCenter(new THREE.Vector3());

            B.clubRig.add(built.group);
            B.pickables.push(built.hit);
            _labelled.push({ club: club, label: label });
            B.clubs.push({
                id: club.id,
                club: club,
                len: built.len,
                group: built.group,
                head: built.head,
                label: label,
                labelBase: { x: headMid.x, y: headBox.min.y, z: headMid.z },
                spot: spot,
                shaft: built.shaft, fullGeo: built.fullGeo, stubGeo: built.stubGeo,
                stubLen: built.stubLen, grip: built.grip, cap: built.cap, stubOn: false,
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

        var lamp = new THREE.PointLight(0xfff2dd, 0.42, 3.2);
        lamp.position.set(0.6, 1.2, 0.9);
        B.rig.add(lamp);

        /* Lights that travel with the clubs. The bag's lamp stays in the
           corner when the picker opens, and the course's own sun is behind
           the row — without these the heads come forward into their own
           shadow and every one of them is the same flat grey.

           One lamp was not enough of one: at 0.22 the row was lit only
           enough to prove it was unlit, and chrome with nothing to reflect
           reads as slate. So three, which is a studio rather than a torch:
           a warm key in front and above, off to the side so the crowns
           take a highlight down one edge instead of a flat wash; a cool
           fill low on the other side to open the shadow under each head
           without flattening it back out; and a rim behind, which is what
           actually separates a shaft from the sky it stands against. */
        B.lamp = new THREE.PointLight(0xfff6e6, 0.95, 7);
        B.lamp.position.set(0.55, 1.05, 1.4);
        B.clubRig.add(B.lamp);

        B.fill = new THREE.PointLight(0xcfe2ff, 0.38, 6);
        B.fill.position.set(-0.85, 0.25, 1.0);
        B.clubRig.add(B.fill);

        B.rim = new THREE.PointLight(0xffe9c6, 0.45, 5);
        B.rim.position.set(0.1, 1.35, -1.0);
        B.clubRig.add(B.rim);

        scene.add(B.rig);

        // How high the bag stands, from the clubs actually in it: the tallest
        // head, from the well it rests in. A longer club in the config makes
        // the bag sit lower rather than poking out of the top of the corner.
        // The default bag, so there is one before the first hole has asked
        // for its own — and B.crest and the arrangement with it.
        setBag(C.CLUBS);

        // And redraw the labels — and the name on the bag — once the page's
        // own typeface has actually arrived.
        watchFonts();

        B.ray = new THREE.Raycaster();
        B.ndc = new THREE.Vector2();
        B.ready = true;
        setSelected(C.DEFAULT_CLUB);
        return B.rig;
    }

    /* ── per frame ─────────────────────────────────────────────────────── */

    var _off = new THREE.Vector3();

    /* Parked in the corner of the frame and turned off-axis so it reads as an
       object with sides. Opening slides the whole rig from there to the middle
       of the view, squaring it up to the camera on the way.

       Where that corner is gets worked out the same way the open row does:
       against the frustum, so the bag stands in the same place on a laptop, a
       phone on its side and a phone held upright. It is deliberately half off
       the bottom and half off the left — only the cuff and the heads standing
       in it are meant to show — but half off is a fraction, and the fixed
       offsets this used before were a quarter of the way into a wide screen
       and clean off the side of a narrow one. */
    function place(camera, aspect) {
        if (!B.ready) return;
        var k = B.open01;

        var bagH = Math.tan((camera.fov || 52) * Math.PI / 360) * BAG_DEPTH;
        var bagW = bagH * aspect;
        var cz = -BAG_DEPTH;
        var cx = -bagW * BAG_EDGE;
        // Cresting just above the controls, wherever they have ended up: the
        // heads are what say "your clubs are here", so they are the part that
        // has to clear the meter, and the rest of the bag can go under it.
        var crest = Math.max(BAG_LOW, Math.min(BAG_HIGH,
            BAG_CLEAR - (1 - 2 * BAND.bottom)));
        var cy = bagH * crest - B.crest * BAG_SCALE;
        put(B.rig, camera, cx, cy, cz, BAG_SCALE, -TWIST, 0.1);

        /* How the clubs are arranged, how big they get and how high they sit
           are all measured against this window, every frame — the lens opens as
           the ball speeds up and a phone can be turned over mid-round, so none
           of the three is a constant. The rearrangement itself only runs when
           the answer changes. */
        var fit = openFit(camera, aspect);
        if (fit.cols !== B.cols) relayoutOpen(fit.cols);
        B.openScale = fit.scale;
        B.openY = fit.y;

        // The clubs: the same place when shut, the middle of the view when
        // open, squaring up to the camera as they come.
        put(B.clubRig, camera,
            cx + (0 - cx) * k,
            cy + (B.openY - cy) * k,
            cz + (-OPEN_DEPTH - cz) * k,
            BAG_SCALE + (B.openScale - BAG_SCALE) * k,   // up to the lens
            -TWIST + TWIST * k,
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

    /* A shut bag is a still object. It rides in camera space so it still has
       to be *placed* every frame — the lens opens as the ball speeds up, and a
       phone can be turned over mid-round — but once the clubs have eased back
       into it there is nothing left to ease: the closed spin is multiplied by
       open01, which is zero, and every club is already where it is going. So
       the loop below stops running until something asks it to start again, and
       what can ask is exactly four things (below). Four traverses of four club
       models a frame is not much; it is also not nothing, and it was buying
       precisely no change on screen. */
    /* Off screen for the length of something that is not the game — the intro
       flyover is the only caller. Both rigs, because the bag and the clubs in
       it are two groups hung off the scene rather than one: they are placed
       from the camera every frame and would otherwise ride along on a shot
       that is meant to look like nobody is holding anything. */
    function setVisible(on) {
        if (!B.ready) return;
        if (B.rig) B.rig.visible = on;
        if (B.clubRig) B.clubRig.visible = on;
    }

    function update(dt, camera, aspect) {
        if (!B.ready) return;
        if (B.settled && !B.expanded) { place(camera, aspect); return; }

        var moved = 0;
        function ease1(now, to, k) {
            var d = (to - now) * k;
            if (Math.abs(d) > moved) moved = Math.abs(d);
            return now + d;
        }

        var ease = 1 - Math.pow(0.0008, dt);      // ~0.25s to settle
        B.open01 += ((B.expanded ? 1 : 0) - B.open01) * ease;
        if (B.open01 < 0.001) B.open01 = 0;
        B.spin += dt * 0.7;                        // a slow turn, once open
        place(camera, aspect);
        if (B.haze) B.haze.material.opacity = 0.3 * (1 - B.open01);
        /* The rig brightens as it opens: in the bag the clubs are a corner
           ornament and should sit in the scene's own light, out in the row
           they are the thing being read and get the full studio. */
        if (B.lamp) B.lamp.intensity = 0.30 + 0.95 * B.open01;
        if (B.fill) B.fill.intensity = 0.12 + 0.38 * B.open01;
        if (B.rim) B.rim.intensity = 0.14 + 0.45 * B.open01;
        B.clubs.forEach(function (c) {
            // A club that is not in this hole's bag is not on screen and has
            // no slot in the arrangement to be moved towards.
            if (!c.on || !c.spot.open) return;
            var to = B.expanded ? c.spot.open : c.spot.closed;
            var chosen = c.id === B.selected;
            // Kept small: at the zoom the open row uses, a tenth of a unit is
            // a fifth of the screen and the club in hand floats away from the
            // others instead of standing a little proud of them.
            var lift = chosen ? (B.expanded ? 0.022 : 0.045) : 0;
            var glow = chosen ? 1 : (B.hover === c.id ? 0.5 : 0);

            c.now.x = ease1(c.now.x, to.x, ease);
            c.now.y = ease1(c.now.y, to.y, ease);
            c.now.z = ease1(c.now.z, to.z, ease);
            c.now.rz = ease1(c.now.rz, to.rz, ease);
            c.now.rx = ease1(c.now.rx, to.rx, ease);
            c.now.ry = ease1(c.now.ry, to.ry, ease);
            /* No size bump for the club in hand. The open row is aligned on
               the *heads*, and scaling a club scales its length, so a 1.08
               bump lifted the driver's head four times further than the lift
               itself did — invisible in the bag, a hundred pixels out of line
               in the picker. It is marked by the glow and the panel instead. */
            c.now.scale = ease1(c.now.scale, to.scale, ease);
            c.now.lift = ease1(c.now.lift, lift, ease);
            c.now.glow = ease1(c.now.glow, glow, ease);

            c.group.position.set(c.now.x, c.now.y + c.now.lift, c.now.z);
            // Turning on its own axis while it is in the bag, so a glance
            // at the cuff still reads as four different heads. Once the row
            // is out where it can be read, all four hold still instead —
            // every club now carries its own label the whole time it is
            // open, and a label is not worth reading while it orbits past.
            var turn = c.now.ry + B.open01 * (B.expanded ? 0 : 1) * B.spin;
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
            // version, floating right over the club it belongs to, all four
            // up together the moment the row is open so every club can be
            // compared at a glance rather than one at a time.
            if (c.label) {
                c.now.labelOp = ease1(c.now.labelOp, B.expanded ? 1 : 0, ease);
                c.label.material.opacity = c.now.labelOp;
                c.label.visible = c.now.labelOp > 0.01;
            }
        });

        // Shut, and nothing moved worth a pixel: stop until something changes.
        B.settled = !B.expanded && B.open01 === 0 && moved < 1e-5;
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
            live().forEach(function (c) {
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

    /* The four things that can give the bag something to do again. Anything
       that changes where a club is going, or how it is lit, has to come
       through one of these — which is what makes the early-out in update()
       safe to trust. */
    function setExpanded(on) { B.expanded = !!on; B.settled = false; syncStubs(); }
    function toggle() { B.expanded = !B.expanded; B.settled = false; syncStubs(); return B.expanded; }
    function setSelected(id) { B.selected = id; B.settled = false; }
    function setHover(id) { if (id !== B.hover) B.settled = false; B.hover = id; }
    function isExpanded() { return B.expanded; }

    /* What the DOM is using at the top and the bottom of the stage, as
       fractions of its height. Clamped rather than trusted: a mid-transition
       measurement or a stage of no height should move the clubs a little, not
       fold them into a point. */
    function setBand(top, bottom) {
        if (top > 0) BAND.top = Math.max(0.06, Math.min(0.45, top));
        if (bottom > 0) BAND.bottom = Math.max(0.06, Math.min(0.45, bottom));
    }

    G3.bag = {
        build: build,
        update: update,
        pick: pick,
        toggle: toggle,
        setBag: setBag,
        setVisible: setVisible,
        setExpanded: setExpanded,
        setSelected: setSelected,
        setHover: setHover,
        setBand: setBand,
        isExpanded: isExpanded,
        // The palette, so the DOM can say a club in the same colour the canvas
        // does rather than keeping a second copy of it.
        look: look,
        state: B
    };

})(window.G3);
