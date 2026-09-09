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
        // How far out of the bag the club in hand stands, as a multiple of
        // the offset `heldSpot` is written in. Read off the frustum in
        // `place`, for the reason written there.
        heldK: 1,
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
       appears: the collar under its head in the bag, the paint on the head
       itself, the halo behind it when it is in hand, its name on its label,
       and the two figures under the name. Four coloured collars standing in
       the cuff is what makes the shut bag read as four *different* clubs at a
       glance — and it is already the picker's legend before the picker opens.

       `steel` and `shine` are the second half of that, and they were what the
       row was missing. Colour on a ferrule two millimetres tall is a legend;
       colour on the *head* is what tells four clubs apart at the size a phone
       shows them, and a real bag does it the same way — a driver crown is
       painted near black, an iron is polished chrome, a lob wedge is a dull
       raw finish that deliberately does not flash. Three finishes, not one
       grey, and the difference is a shade and a shininess rather than a new
       material per club.

       Two of these are new because two clubs had no entry at all: `look()`
       falls back to the pitch's green, so the mallet and the checker — both
       handed out a hole at a time — arrived wearing another club's colour on
       a hole where they are the only unfamiliar thing in the bag. */
    /* `finish` is the third of them, and it is what a shade and a shininess
       could never say on their own: a polished head *reflects the place it is
       standing*, and a brushed one smears the same reflection into a streak.
       Both are envMap work rather than colour work — see `studioEnv` — and
       naming the finish here is what keeps one club's look in one line.

       The wedge is chrome now rather than the raw grey it was. That entry
       used to carry the whole job of telling it from the iron, on a shade of
       grey four millimetres tall; it is told apart by its *shape* now — its
       own high-toed outline and a sole you can see the bounce on — which
       reads at any size, and it frees the finish to be the mirror a real
       chrome wedge is. The iron takes the brushed one in its place, which is
       what a players' blade actually wears. */
    var CLUB_LOOK = {
        putter:  { name: '#7dd3fc', metal: 0x38bdf8, steel: 0x515f72, shine: 34, finish: 'satin' },
        driver:  { name: '#fdba74', metal: 0xf97316, steel: 0x2f3b4f, shine: 82, finish: 'pvd' },
        iron:    { name: '#c4b5fd', metal: 0x8b5cf6, steel: 0x9aa6b4, shine: 76, finish: 'brushed' },
        chipper: { name: '#86efac', metal: 0x22c55e, steel: 0x929daa, shine: 70, finish: 'satin' },
        wedge:   { name: '#fde68a', metal: 0xeab308, steel: 0x76828f, shine: 96, finish: 'chrome' },
        mallet:  { name: '#f0abfc', metal: 0xc026d3, steel: 0x4a5568, shine: 30, finish: 'satin' },
        checker: { name: '#5eead4', metal: 0x14b8a6, steel: 0x8d97a3, shine: 24, finish: 'brushed' }
    };
    function look(id) { return CLUB_LOOK[id] || CLUB_LOOK.chipper; }

    /* What each finish does to the metal, and all four are the same three
       numbers: how much of the room it gives back, how tight the highlight
       is, and what colour that highlight is.

       `reflect` is a Phong `reflectivity` under `MixOperation`, which is a
       straight blend between the painted colour and the reflected room — so
       chrome at 0.50 is half room and a black PVD driver at 0.18 is mostly
       paint with the sky caught along one edge. `streak` asks for the brushed
       texture below, which is what turns a highlight into the grain a milled
       head has. */
    var FINISH = {
        chrome:  { reflect: 0.50, shine: 96, spec: 0x828f9d, streak: false },
        brushed: { reflect: 0.30, shine: 44, spec: 0x67727f, streak: true },
        satin:   { reflect: 0.22, shine: 38, spec: 0x59626d, streak: true },
        pvd:     { reflect: 0.18, shine: 120, spec: 0x5b6572, streak: false }
    };
    function finishOf(club) {
        return FINISH[club ? look(club.id).finish : 'satin'] || FINISH.satin;
    }

    /* ── materials ─────────────────────────────────────────────────────── */

    /* Specular colours are as considered as the diffuse ones. A white
       highlight on every metal is what turned four heads into four white
       blobs: chrome reflects the sky it is standing under, not a studio
       flash, so the speculars here are grey and the shininess is low enough
       that the highlight is a sheen across the crown rather than one hard
       dot per light. */
    /* ── the room the metal reflects ───────────────────────────────────── */

    /* Something for chrome to be chrome *at*. This is the one thing three
       lamps and a high shininess could not buy: a polished head is not a
       bright grey object, it is a mirror, and a mirror with nothing in front
       of it is a grey object. Lit and no more, every head in the row came
       back the same pale slate — which is exactly what the first pass looked
       like, and why turning one in the picker showed you nothing but its
       outline changing.

       So: one equirectangular strip, drawn once, standing in for the place
       the bag is parked. Sky overhead, a warm band at the horizon, dark
       ground below, and three soft lamps for the light itself. The lamps are
       the working half — they are what sweeps across a crown as it turns
       and along a wedge's sole as the camera comes round, and motion in a
       highlight is the whole difference between metal and paint.

       It is deliberately not the course's own sky. A reflection has to read
       at four millimetres tall against whatever is behind it, and the real
       sky over a night hole is black: a mirror of it is indistinguishable
       from a matte black head. This one is the same fair weather everywhere,
       which is what a product shot does and for the same reason.

       Equirectangular rather than a cube map because it is one canvas rather
       than six, and `MixOperation` rather than the default multiply because
       multiply can only ever darken — a chrome head needs the room *added*
       to it, not used as a stencil. */
    var _env = null;
    function studioEnv() {
        if (_env) return _env;
        var W = 256, H = 128;
        var cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        var g = cv.getContext('2d');

        var sky = g.createLinearGradient(0, 0, 0, H);
        /* Written dark on purpose. A reflection reads by *contrast*, not by
           brightness — and this one goes through bloom on the way out, so a
           sky drawn as bright as the real one comes back off a chrome wedge
           as a white blob with a glow round it, which is the one thing worse
           than the flat grey it replaced. Dark room, bright lights. */
        sky.addColorStop(0.00, '#9ebcda');     // zenith
        sky.addColorStop(0.38, '#6d8aa6');
        sky.addColorStop(0.49, '#877a68');     // the horizon's own warmth
        sky.addColorStop(0.52, '#333b45');     // and the ground under it
        sky.addColorStop(1.00, '#0c1015');
        g.fillStyle = sky;
        g.fillRect(0, 0, W, H);

        /* The lights. Soft-edged and well above the horizon, because a bar
           drawn hard comes back off a curved head as a cut-out rectangle —
           and one drawn low sits in the reflection of the ground, where the
           head never points. */
        [[0.20, 0.20, 0.16, 'rgba(255, 252, 244, 0.62)'],
         [0.62, 0.28, 0.10, 'rgba(206, 228, 250, 0.46)'],
         [0.88, 0.16, 0.07, 'rgba(255, 240, 216, 0.38)']].forEach(function (bar) {
            var cx = bar[0] * W, cy = bar[1] * H, r = bar[2] * W;
            var glow = g.createRadialGradient(cx, cy, 0, cx, cy, r);
            glow.addColorStop(0, bar[3]);
            glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            g.fillStyle = glow;
            g.fillRect(cx - r, cy - r, r * 2, r * 2);
        });

        _env = new THREE.CanvasTexture(cv);
        _env.mapping = THREE.EquirectangularReflectionMapping;
        if (THREE.sRGBEncoding !== undefined) _env.encoding = THREE.sRGBEncoding;
        return _env;
    }

    /* The grain on a head that is not a mirror. A brushed or milled face is
       polished in one direction only, so its highlight is a streak rather
       than a dot — and a streak is what says "machined" at the size these are
       drawn. It rides on `specularMap`, which modulates the highlight alone:
       the paint underneath keeps the club's own colour and only the shine is
       combed. */
    var _brush = null;
    function brushTexture() {
        if (_brush) return _brush;
        var W = 64, H = 64;
        var cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        var g = cv.getContext('2d');
        g.fillStyle = '#b4b4b4';
        g.fillRect(0, 0, W, H);
        /* Streaks along one axis, at a handful of weights, so the grain is
           uneven the way a real brushed face is rather than a comb.

           Sown from a counter rather than from `Math.random`, so the picture
           is the same one on every load. A texture that differs run to run
           makes a before-and-after screenshot pair differ for a reason that
           has nothing to do with the change under it, and this repo settles
           anything visual by looking at exactly such a pair. */
        var seed = 12345;
        function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
        for (var i = 0; i < 150; i++) {
            var x = rnd() * W;
            var v = 0.5 + rnd() * 0.5;
            g.strokeStyle = 'rgba(255, 255, 255, ' + (0.10 * v).toFixed(3) + ')';
            g.lineWidth = 0.5 + rnd() * 1.5;
            g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
            g.strokeStyle = 'rgba(0, 0, 0, ' + (0.10 * v).toFixed(3) + ')';
            g.beginPath();
            g.moveTo(x + 1.2, 0); g.lineTo(x + 1.2, H); g.stroke();
        }
        _brush = new THREE.CanvasTexture(cv);
        _brush.wrapS = _brush.wrapT = THREE.RepeatWrapping;
        _brush.repeat.set(3, 3);
        return _brush;
    }

    /* One metal, built from a finish rather than from four loose numbers at
       each call site. Everything that is meant to look like steel goes
       through here, so "what does chrome look like" is answered once. */
    function metal(color, fin, over) {
        var m = new THREE.MeshPhongMaterial({
            color: ink(color),
            shininess: over && over.shininess !== undefined ? over.shininess : fin.shine,
            specular: ink(fin.spec),
            envMap: studioEnv(),
            combine: THREE.MixOperation,
            reflectivity: over && over.reflect !== undefined ? over.reflect : fin.reflect
        });
        if (fin.streak) m.specularMap = brushTexture();
        return m;
    }

    /* `club` is optional: the bag's own body has no club and takes the
       defaults. Everything a head is made of is built here rather than in
       `buildHead` so that one club owns one set of materials — which is what
       lets the club in hand be lit on its own without every other head
       lighting up with it. */
    function mats(club) {
        var L = club ? look(club.id) : null;
        var steel = L ? L.steel : 0x929daa;
        var shine = L ? L.shine : 70;
        var fin = finishOf(club);
        return {
            /* The paint: the club's own colour, on the parts of a head that
               are allowed to be any colour at all — a driver's sole plate and
               alignment mark, a mallet's sight line. It is
               the same hex as the ferrule below it and as the name on the
               card, so a club is one colour in three places rather than a
               grey head with a coloured collar under it. */
            paint: new THREE.MeshPhongMaterial({
                color: ink(L ? L.metal : 0x38bdf8), shininess: 46, specular: ink(0x3a4249),
                // A painted panel is lacquered, not matte: a little of the
                // room in it, and far less than the bare steel beside it.
                envMap: studioEnv(), combine: THREE.MixOperation, reflectivity: 0.14
            }),
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
            crown: metal(L ? L.steel : 0x36435a, fin, { shininess: shine }),
            insert: new THREE.MeshPhongMaterial({ color: ink(0x1e2932), shininess: 20, specular: ink(0x252c33) }),
            /* The shaft. Chrome whoever is holding it — a shaft is the one
               part of a club nobody finishes to match the head — and the one
               place the reflection is doing the most work per triangle: a
               plain grey rod against a bright sky is a scratch on the frame,
               and the same rod with the room in it is a shaft. */
            steel: metal(0x8d98a4, FINISH.chrome, { reflect: 0.30, shininess: 72 }),
            grip: new THREE.MeshLambertMaterial({ color: ink(0x1d2127) }),
            head: metal(steel, fin, { shininess: shine }),
            /* A driver face is a bright insert whatever the crown is doing,
               so it takes the mirror rather than the club's own finish. */
            face: metal(0xa8b4c0, FINISH.chrome, { reflect: 0.34, shininess: 62 }),
            /* And the milled face, which is the one metal that is a picture
               rather than a colour. It keeps the club's own finish so a
               chrome wedge's grooves flash and a brushed iron's do not — but
               never the brushed streak, which would cross its own grooves. */
            grooves: new THREE.MeshPhongMaterial({
                map: faceTexture(club), bumpMap: faceTexture(club), bumpScale: 0.0016,
                shininess: fin.shine, specular: ink(fin.spec),
                envMap: studioEnv(), combine: THREE.MixOperation,
                reflectivity: fin.reflect * 0.55,
                side: THREE.DoubleSide
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

    /* Grooves, drawn: a dozen lines across a face is a texture, not geometry.

       Two faces rather than one, because the two clubs that wear them are
       not making the same claim. An iron's grooves are a handful of wide
       lines over the middle of the face; a wedge's are twice as many, twice
       as fine, run the whole way across, and sit in a face that has been
       milled between them — that milling is most of why a wedge photographs
       the way it does, and it is the thing the old single texture had no way
       to say. Both are cached per shape rather than per club: five clubs
       asking for the same picture should not draw it five times.

       The same canvas goes in as `bumpMap` as well as `map`, which is what
       makes a groove an incision rather than a stripe — the lines catch the
       light along one edge and lose it along the other as the head turns. */
    var _faces = {};
    function faceTexture(club) {
        var fine = !!club && (club.id === 'wedge' || club.id === 'checker');
        var key = fine ? 'milled' : 'grooved';
        if (_faces[key]) return _faces[key];
        var N = 128;
        var cv = document.createElement('canvas');
        cv.width = cv.height = N;
        var g = cv.getContext('2d');
        g.fillStyle = fine ? '#c9d4de' : '#b6c1cc';
        g.fillRect(0, 0, N, N);

        if (fine) {
            // The milling: fine concentric-looking passes across the face,
            // under the grooves rather than instead of them.
            g.lineWidth = 1;
            for (var m = 0; m < N; m += 2) {
                g.strokeStyle = 'rgba(255, 255, 255, ' + (m % 4 ? 0.05 : 0.11) + ')';
                g.beginPath(); g.moveTo(0, m + 0.5); g.lineTo(N, m + 0.5); g.stroke();
            }
        }

        var step = fine ? 8 : 12, pad = fine ? 4 : 10;
        g.lineWidth = fine ? 2.5 : 4;
        for (var y = step; y < N - step / 2; y += step) {
            g.strokeStyle = 'rgba(24, 32, 41, 0.72)';
            g.beginPath(); g.moveTo(pad, y); g.lineTo(N - pad, y); g.stroke();
            // The lip under each groove, which is the half a flat line was
            // missing: an edge that has been cut has a bright side.
            g.lineWidth = 1;
            g.strokeStyle = 'rgba(255, 255, 255, 0.30)';
            g.beginPath();
            g.moveTo(pad, y + (fine ? 2 : 3)); g.lineTo(N - pad, y + (fine ? 2 : 3));
            g.stroke();
            g.lineWidth = fine ? 2.5 : 4;
        }
        _faces[key] = srgbCanvas(cv);
        return _faces[key];
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
                color: ink(look(club.id).metal), shininess: 44, specular: ink(0x3a4249),
                envMap: studioEnv(), combine: THREE.MixOperation, reflectivity: 0.16
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

        /* Everything that has to hang *beside* the head without turning with
           it goes in here, and `update` keeps its yaw the negative of the
           club's own. Two things need that and both are new: the card, which
           is anchored on the head's own bounding box and would swing out of
           line the moment the head was turned to show its face; and the halo
           behind the club in hand, which is a sprite and would orbit the
           shaft rather than stay behind the thing it is marking. */
        var pivot = new THREE.Group();
        g.add(pivot);

        g.userData.clubId = club.id;
        g.userData.len = len;
        return {
            group: g, hit: hit, head: head, len: len, pivot: pivot,
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

    /* A wedge, which is not a tall iron however often it is drawn as one.

       Held to the face, the two are different outlines and the difference is
       the whole of what the picker exists to show. An iron is a blade: a
       straight topline, a small toe, a sole no thicker than the rest of it.
       A wedge is a teardrop — the topline climbs from the heel and rolls
       over a high, round toe, the face is a good centimetre taller, and the
       sole is a broad bar with the leading edge sitting proud of it. That
       last part is the bounce, and it is the one feature of a wedge a golfer
       would look for first.

       Same frame as `bladeShape`: heel at x = 0, toe out to +x, and +y
       running from the topline down to the sole. Real numbers again — a
       58-degree wedge is about 78mm heel to toe with a 58mm face, against a
       7 iron's 76 by 50. */
    function wedgeShape(h) {
        var sh = new THREE.Shape();
        sh.moveTo(0.006, 0.014);                                  // heel end of the topline
        sh.quadraticCurveTo(0.034, 0.005, 0.058, 0.012);          // …climbing toward the toe
        sh.quadraticCurveTo(0.076, 0.019, 0.079, 0.040);          // and round the high toe
        sh.quadraticCurveTo(0.080, h - 0.008, 0.062, h);          // down its trailing edge
        sh.lineTo(0.022, h);                                      // the sole, flat and broad
        sh.quadraticCurveTo(0.004, h - 0.001, 0.002, h - 0.022);  // the heel corner, rounded
        sh.quadraticCurveTo(0.000, 0.022, 0.006, 0.014);          // and up the heel
        return sh;
    }

    /* The sole of one: a bar the whole width of the head rather than the
       muscle pad an iron gets, and thicker than the blade it hangs off so the
       leading edge stands proud of it. Drawn from the sole up rather than
       from the back, because that is where a wedge keeps its weight. */
    function bounceShape(h) {
        var sh = new THREE.Shape();
        sh.moveTo(0.014, h - 0.021);
        sh.lineTo(0.058, h - 0.017);
        sh.quadraticCurveTo(0.068, h - 0.015, 0.066, h - 0.005);
        sh.quadraticCurveTo(0.064, h - 0.001, 0.054, h - 0.002);
        sh.lineTo(0.020, h - 0.004);
        sh.quadraticCurveTo(0.006, h - 0.006, 0.014, h - 0.021);
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

    /* The face, cut to the head's own outline instead of laid over it as a
       rectangle. A plane wide enough to carry the grooves across a blade is
       wider than the blade is at its topline and at its heel, so its corners
       stood out past the curve of the head — a flat card of grooves floating
       in front of a rounded club, which is exactly what it looked like.

       This is the same outline the head is built from, shrunk about its own
       middle so the grooves stop short of the edge the way milling does, and
       given fresh UVs over its own box: `ShapeGeometry` hands out the shape's
       own coordinates as texture coordinates, which for a head measured in
       metres is the first 8% of the picture stretched over the whole face. */
    function facePlate(shape, inset) {
        var geo = new THREE.ShapeGeometry(shape, 16);
        geo.computeBoundingBox();
        var b = geo.boundingBox;
        var cx = (b.min.x + b.max.x) / 2, cy = (b.min.y + b.max.y) / 2;
        geo.translate(-cx, -cy, 0);
        geo.scale(inset, inset, 1);
        geo.translate(cx, cy, 0);

        geo.computeBoundingBox();
        b = geo.boundingBox;
        var w = b.max.x - b.min.x, hh = b.max.y - b.min.y;
        var pos = geo.attributes.position, uv = geo.attributes.uv;
        for (var i = 0; i < pos.count; i++) {
            uv.setXY(i, (pos.getX(i) - b.min.x) / w, (pos.getY(i) - b.min.y) / hh);
        }
        uv.needsUpdate = true;
        return geo;
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

            /* The sole plate, which is where a real driver wears its maker's
               colour and half the reason the row no longer reads as four grey
               blobs. A head is built in the frame it stands in — grip down,
               `+Y` running on past the shaft to the sole — so in the bag and
               in the open row the sole is the face pointing at the sky, which
               makes it the one panel of a driver the picker can always see.
               Squashed flat and sunk into the body, so what shows is the rim
               of it round the crown rather than a second ball stuck on. */
            var sole = new THREE.Mesh(new THREE.SphereGeometry(0.043, 20, 12), M.paint);
            sole.scale.set(0.92, 0.30, 1.24);
            sole.position.set(-0.002, 0.062, 0.044);
            g.add(sole);

            // And the alignment mark, pointing where the ball goes: the
            // same colour again, on the other side of the head, so the club
            // is still its own colour from whichever side it is turned to.
            var aim = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.003, 0.005), M.paint);
            aim.position.set(0.022, 0.0135, 0.044);
            g.add(aim);

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

            /* The sight line, pointing where the ball goes — in the club's
               own colour rather than the bag's trim. It was the one accent on
               a head that was already painted, and painting it the same blue
               on every putter-shaped club meant a mallet handed out for one
               hole arrived wearing the putter's colour on the one part of it
               a player looks at. */
            var sight = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.003, 0.005), M.paint);
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
            var h = wedgey ? 0.058 : 0.047;
            var deep = wedgey ? 0.012 : 0.011;   // a wedge is a heavier head
            /* A hair of a bevel on the wedge rather than the blade's, and it
               is the difference between a shape and a pill: bevelSize runs
               outward from *both* ends of a 12mm extrusion, so the 3mm an
               iron can carry rounded a wedge's outline away entirely and
               left two chrome cylinders lying against each other. Its
               silhouette is the whole reason it has its own shape. */
            var bev = wedgey ? 0.0016 : 0.003;
            var blade = extruded(wedgey ? wedgeShape(h) : bladeShape(h), deep, bev);
            blade.rotateY(-Math.PI / 2);         // extrusion runs to -x, toe to +z
            var iron = new THREE.Mesh(blade, M.head);
            g.add(iron);

            /* Behind the blade: a muscle pad on an iron, and on a wedge the
               full-width sole that carries its bounce. Both are the same
               trick — a second, thicker extrusion set back from the face —
               and both are what stop a lofted club reading as a butter knife.

               Set back far enough that its own front cap is buried inside the
               blade, since coincident caps z-fight, and no further: a sole
               standing a whole head's depth off the back is not bounce, it is
               a second club behind the first, which is what it looked like
               from anywhere but the face. */
            var back = wedgey
                ? extruded(bounceShape(h), 0.014, 0.0022)
                : extruded(muscleShape(h), 0.011, 0.004);
            back.rotateY(-Math.PI / 2);
            back.translate(wedgey ? -0.004 : -0.009, 0, 0);
            g.add(new THREE.Mesh(back, M.head));

            var plate = facePlate(wedgey ? wedgeShape(h) : bladeShape(h), 0.86);
            plate.rotateY(-Math.PI / 2);          // …into the blade's own frame
            plate.translate(bev + 0.0008, 0, 0);  // and a hair proud of its cap
            g.add(new THREE.Mesh(plate, M.grooves));

            /* And the neck. A wedge's is longer and stands more upright than
               an iron's — it is the club you hold closest to the shaft — and
               at this size the difference between the two necks reads before
               the difference between the two faces does. */
            hosel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.0066, 0.0080, wedgey ? 0.046 : 0.040, 12), M.head);
            hosel.position.set(-0.004, wedgey ? 0.018 : 0.016, 0.003);
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
            redrawCards();
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

    /* The card, and the band across the top of it. The band is new and it is
       carrying two facts that were only ever in the DOM panel above the row:
       which number key takes this club, and whether it is the one in hand.
       The first is the reason the band exists on every card rather than only
       on one — a picker that has to be clicked is a picker that is slower
       than the keyboard it is hiding, and "KEY 3" on the card is where
       somebody looking at the clubs will actually see it. */
    /* A card comes in two shapes, and which one is drawn is the layout's
       business rather than the club's.

       One shape could not do both jobs. Side by side in a row there is width
       going spare and height there is not, so the loft and the power stand in
       two columns; wrapped into a grid on a phone it is the other way round —
       two columns on a card a third of a screen wide is two columns of
       nothing, and the figures were coming out nine pixels tall. Stacked, the
       same card spends its width on the figures instead, and they land at
       twice the size on the screen that could least afford the small ones.

       Both are drawn at a size the canvas can be read at and then scaled to
       the frustum (`fitOpen`), so these are proportions rather than pixels. */
    var CARDS = {
        row:  { w: 400, h: 190, band: 28, world: 0.30 },
        grid: { w: 328, h: 252, band: 28, world: 0.285 }
    };
    var CARD = CARDS.row;

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

    /* Two of these per club: the ordinary card, and the one the club in hand
       wears. A picker whose only answer to "which one am I holding" is a
       slightly brighter lump of chrome is a picker that has to be counted
       rather than read, and the club in hand is the one fact the row exists
       to change. So the card says it: the border and the name's underline
       take the club's own colour, and a chip along the bottom spells it out
       in words. Two canvases a club, drawn once at load and swapped by
       pointer — cheaper than tinting a sprite and legible in a way a tint
       is not. */
    function labelTexture(club, held) {
        var W = CARD.w, H = CARD.h, BAND_H = CARD.band;
        var cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        var g = cv.getContext('2d');
        var tint = look(club.id);
        g.clearRect(0, 0, W, H);

        /* The card. Darker and more opaque than it was: it is read against
           bright grass and brighter water, and a card you have to squint
           through is a card nobody reads. */
        roundRect(g, 4, 4, W - 8, H - 8, 24);
        /* All but opaque. The card stands in front of its own shaft and in
           front of whatever the course is doing behind it, and at 0.94 a
           chrome shaft came through the middle of every name as a pale
           stripe. */
        g.fillStyle = held ? 'rgba(7, 22, 34, 0.985)' : 'rgba(5, 16, 26, 0.975)';
        g.fill();
        g.strokeStyle = held ? tint.name : 'rgba(125, 211, 252, 0.32)';
        g.lineWidth = held ? 5 : 3;
        g.stroke();

        /* The band. Painted inside the card's own rounded outline — a
           rectangle across the top of a rounded card puts two square corners
           back on it — and in the club's colour only when the club is in
           hand, which is the difference between a strip of information and a
           badge. */
        g.save();
        roundRect(g, 4, 4, W - 8, H - 8, 24);
        g.clip();
        g.globalAlpha = held ? 0.22 : 0.10;
        g.fillStyle = held ? tint.name : '#9fb6c9';
        g.fillRect(4, 4, W - 8, BAND_H);
        g.restore();

        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.font = '800 16px ' + FACE;
        g.fillStyle = held ? tint.name : 'rgba(159, 182, 201, 0.82)';
        g.fillText(held ? 'IN HAND' : 'KEY ' + club.key, W / 2, 4 + BAND_H / 2);

        /* The name, in the page's own face, in one flat colour: a gradient
           across four letters is a smear at the size this is read from. */
        g.fillStyle = tint.name;
        g.font = '800 46px ' + FACE;
        g.fillText(club.name, W / 2, BAND_H + 42);

        var rule = BAND_H + 74;
        g.strokeStyle = 'rgba(148, 176, 199, 0.20)';
        g.lineWidth = 2;
        g.beginPath(); g.moveTo(40, rule); g.lineTo(W - 40, rule); g.stroke();

        g.textAlign = 'left';
        var deg = Math.round(club.loft * 180 / Math.PI);
        var frac = club.power / maxPower();

        if (CARD === CARDS.grid) stackedFigures(g, W, H, rule, deg, club, frac, tint);
        else sideBySideFigures(g, W, H, rule, deg, club, frac, tint);

        return srgbCanvas(cv);
    }

    /* Side by side, for a card standing in a row: the loft on the left with
       the picture of it, the power on the right with the bar. */
    function sideBySideFigures(g, W, H, rule, deg, club, frac, tint) {
        var top = rule + 22;
        var x2 = Math.round(W * 0.54);

        g.fillStyle = 'rgba(159, 182, 201, 0.9)';
        g.font = '700 17px ' + FACE;
        g.fillText('LOFT', 28, top);
        g.fillText('POWER', x2, top);

        g.fillStyle = '#eaf6ff';
        g.font = '700 36px ' + FIGS;
        g.fillText(deg + '\u00b0', 28, top + 36);
        g.fillText(String(club.power), x2, top + 36);

        drawLoft(g, 118, top + 46, deg, tint.name);
        drawPower(g, x2, top + 58, W - 28 - x2, 13, frac, tint.name);
    }

    /* Stacked, for a card in a grid: one reading to a line, and the figures
       given the width the second column used to take. This is the shape a
       phone gets, and the numbers on it are the point of the change — a loft
       is a fact you read at a glance or not at all. */
    function stackedFigures(g, W, H, rule, deg, club, frac, tint) {
        var mid = rule + 56;                 // the loft line
        var low = H - 30;                    // …and the power line

        g.fillStyle = 'rgba(159, 182, 201, 0.9)';
        g.font = '700 18px ' + FACE;
        g.fillText('LOFT', 26, mid - 34);
        g.fillText('POWER', 26, low - 34);

        g.fillStyle = '#eaf6ff';
        g.font = '700 50px ' + FIGS;
        g.fillText(deg + '\u00b0', 26, mid);
        g.fillText(String(club.power), 26, low);

        drawLoft(g, W - 108, mid + 12, deg, tint.name);
        drawPower(g, W - 150, low + 4, 124, 14, frac, tint.name);

        g.strokeStyle = 'rgba(148, 176, 199, 0.14)';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(26, (mid + low) / 2 - 22); g.lineTo(W - 26, (mid + low) / 2 - 22);
        g.stroke();
    }

    /* The halo behind the club in hand: white in the middle and gone by the
       rim, so the sprite's own `color` is what tints it. Drawn once and
       shared by every club, since the tint is the material's and not the
       texture's. */
    var _halo = null;
    function haloTexture() {
        if (_halo) return _halo;
        var cv = document.createElement('canvas');
        cv.width = cv.height = 128;
        var g = cv.getContext('2d');
        var grd = g.createRadialGradient(64, 64, 2, 64, 64, 62);
        grd.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        grd.addColorStop(0.42, 'rgba(255, 255, 255, 0.34)');
        grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, 128, 128);
        _halo = srgbCanvas(cv);
        return _halo;
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
        var idle = labelTexture(club, false);
        var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: idle, transparent: true, opacity: 0, depthTest: false
        }));
        sprite.userData.idle = idle;
        sprite.userData.held = labelTexture(club, true);
        sizeLabel(sprite);
        sprite.renderOrder = 20;
        return sprite;
    }

    function sizeLabel(sprite) {
        sprite.scale.set(CARD.world, CARD.world * CARD.h / CARD.w, 1);
    }

    /* Swap every card to the other shape and redraw it: two canvases a club,
       and only when the arrangement actually changes shape — a window resized,
       a phone turned over, or a hole handing out a bag of a different size.
       Redrawing rather than scaling one texture is the whole point: a stacked
       card is not a squashed row card, it is a different arrangement of the
       same four readings. */
    function setCardShape(want) {
        if (CARD === want) return;
        CARD = want;
        redrawCards();
    }

    /* Both faces of every card, drawn again from whatever is true now — the
       shape the layout has asked for, or the typeface that has just arrived.
       Which face is showing survives the swap; the card under it does not
       otherwise change. */
    function redrawCards() {
        _labelled.forEach(function (c) {
            var held = c.label.material.map === c.label.userData.held;
            c.label.userData.idle = labelTexture(c.club, false);
            c.label.userData.held = labelTexture(c.club, true);
            c.label.material.map = held ? c.label.userData.held : c.label.userData.idle;
            c.label.material.needsUpdate = true;
            sizeLabel(c.label);
        });
    }

    // Which of a card's two faces is showing, swapped rather than redrawn.
    function faceLabel(label, held) {
        var want = held ? label.userData.held : label.userData.idle;
        if (label.material.map === want) return;
        label.material.map = want;
        label.material.needsUpdate = true;
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
    /* How far round each club stands in the open row, and it is the whole
       reason the row is worth opening. A head is built with its face looking
       down +X and its toe out to +Z, and the rig squares itself up to the
       camera when it opens — so at a yaw of nothing you are looking at the
       *back* of every head in the bag. The face is the part that differs
       between a driver and a wedge; a row that hides it is a row of grey
       lumps with captions.

       Three quarters of the way round rather than square on to it: a face
       seen flat is a disc and tells you nothing about how far back it leans,
       and the lean is the other half of what a club is. This shows both. */
    var OPEN_YAW = -0.72;

    var HEAD_TOP = 0.21;                   // head above the row's own line

    /* Everything else about the arrangement is the card's own size, so it is
       worked out from the card rather than tuned to one: how far apart two
       clubs stand is a card and a gap, how far apart two rows stand is a card
       and the head of the row below it, and how far the block reaches under
       the line the heads are on is half a card and the drop.

       The cards used to be closer together than they are wide and staggered
       to two heights to survive it, which is a trick that works exactly once
       and was the reason a five-club bag on a phone came out as a pile.
       Standing them a card apart costs width — and width is what a single row
       is *for*, so a screen without it now wraps into a grid instead of
       overlapping its way through.

       These hang off the card rather than off the bag, and that is what keeps
       the fit from chasing its own tail. The shape a card is drawn in depends
       on how many columns there are; the room a column needs depends on the
       card; so measuring a candidate arrangement against whatever card
       happens to be drawn at that moment is a loop, and one that flips
       between two arrangements a frame apart at the window sizes where they
       are close. Every candidate is measured against the card *it* would
       use, so the answer is the frustum's alone. */
    function derive(card) {
        var halfH = card.world * card.h / card.w / 2;
        card.col = card.world + 0.05;         // two clubs, side by side
        card.half = card.world / 2 + 0.01;    // half a card, and a hair over
        // Low enough that the whole head clears the top of its own card. A
        // card that covers the head is a caption standing in front of the
        // thing it captions, and the head — the face, and how far back it
        // leans — is what the row is opened to compare.
        card.drop = halfH + 0.06;
        card.tail = card.drop + halfH;
        // A row has to clear the heads of the row under it, not just its own
        // card: the head stands HEAD_TOP above its line and the card hangs
        // `tail` below.
        card.stack = card.tail + HEAD_TOP + 0.055;
        return card;
    }
    derive(CARDS.row);
    derive(CARDS.grid);

    /* Which card an arrangement is drawn with: a row has width to spend on
       two columns of figures, a grid has not. */
    function cardFor(cols, n) {
        return cols === n && n > 1 ? CARDS.row : CARDS.grid;
    }

    var OPEN_DEPTH = 1.3;      // how far in front of the lens the clubs come
    var MAX_OPEN = 2;          // and how big they are allowed to get there

    /* And where the scrim hangs, which is a compromise with one number on
       each side. Too near and it is in front of the heads; too far and the
       ground under a camera zoomed all the way in can come between it and
       the lens, leaving a bright wedge along the bottom of the frame. The
       row occupies 1.1 to 1.5 out from the lens at full size, and the
       closest the camera is ever allowed to the ball is four units, so
       1.62 clears the first with room and the second by miles. */
    var SCRIM_DEPTH = 1.62;
    var SCRIM = 0.72;          // …and how dark it gets, fully open

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
            var rest = restSpot(c);
            c.now.x = rest.x; c.now.y = rest.y; c.now.z = rest.z;
            c.now.rz = rest.rz; c.now.rx = rest.rx; c.now.ry = rest.ry;
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

    /* …and where the club in hand stands instead, which is not in the bag at
       all: out of the mouth, down on the ground in front of it and leaning
       back against the cuff, the way anybody who is about to play a shot
       parks the club they are about to play it with.

       The shut bag's whole job is to answer "your clubs are here" without
       being opened, and it was answering only half of it. Five heads bunched
       in a cuff say what you have; nothing there said which one is in your
       hand — that lived in a chip along the top of the screen and in a colour
       on a ferrule two millimetres tall. Standing the chosen club out of the
       bunch says it in the place a player is already looking, and it says it
       in silhouette, which survives being four hundred pixels away on a
       phone.

       It stands on the ground rather than in the well, so it is a little
       lower than the bunch and the same real length it always was; it leans a
       few degrees out, away from the bag's silhouette rather than across it;
       and its yaw is nearer face-on than anything in the mouth, because this
       is the one club worth reading and so the one turned to be read.

       Two things about the numbers. They are worked in the *camera's* axes
       and written back in the bag's, since the bag is stood at an angle to
       the lens (`TWIST`) and the two do not agree — the first pass read as
       "0.18 to the right", landed a fifth of a unit nearer the lens than the
       bag, and perspective then carried it left *across* the bag rather than
       clear of it. And they are scaled by `heldK`, which is the same lesson
       `BAG_EDGE` is written in fractions of the frame for: a fixed offset in
       metres is a different place on every screen. A fifth of a laptop's
       frustum is half of a phone's held upright, so a club that stood neatly
       beside the bag on a desk stood in the middle of the hole on a phone,
       over the power meter. `place` measures it off the frustum. */
    function heldSpot() {
        var k = B.heldK;
        return {
            x: 0.36 * k, y: 0.05, z: -0.10 * k,
            rz: -0.06, rx: 0.04, ry: -0.42, scale: 1
        };
    }

    /* Which of the two a club is resting at while the bag is shut. Everything
       that puts a club away goes through here rather than reaching for
       `spot.closed`, so the club in hand leaves the bunch on selection and
       goes back into it the moment another one is taken. */
    function restSpot(c) {
        return c.id === B.selected ? heldSpot() : c.spot.closed;
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
        var card = cardFor(cols, n);
        var col = i % cols;
        var row = Math.floor(i / cols);
        // The last row of a grid is usually short, and a short row left-aligned
        // under a full one reads as a mistake rather than as an arrangement —
        // five clubs two abreast used to hang the fifth off the left. Each row
        // is centred on what is actually in it.
        var inRow = Math.min(cols, n - row * cols);
        return {
            x: (col - (inRow - 1) / 2) * card.col,
            // Rows stack downward, and the block is recentred on itself so
            // adding one does not push the first row off the top.
            y: -len + 0.15 - row * card.stack + (rows - 1) * card.stack / 2,
            z: 0, rz: 0, rx: 0, ry: OPEN_YAW, scale: 1
        };
    }

    /* What a given arrangement costs: half its width, half its height, and
       where its own middle sits relative to the line the clubs are laid out
       on. The last one matters because the block is not symmetrical — every
       label hangs below its head — so centring it means knowing how far off
       centre it already is. */
    function openMetrics(cols, rows, n) {
        var card = cardFor(cols, n);
        var top = HEAD_TOP;
        var bottom = -card.tail - (rows - 1) * card.stack;
        return {
            halfW: (cols - 1) / 2 * card.col + card.half,
            halfH: (top - bottom) / 2,
            // openSpot recentres the rows on the layout line, so the block's
            // middle moves back up by half of what the extra rows added.
            mid: (top + bottom) / 2 + (rows - 1) * card.stack / 2
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
            y: halfH * (top + bottom) / 2 - m.mid * scale
        };
    }

    /* Every arrangement the bag could be laid out in, measured, and the one
       that draws the clubs biggest wins.

       This used to halve the columns until the row was either usable or
       unhalvable, guarded by a rule about whether narrowing could help at all
       — and it got a phone wrong in both directions at once. Held upright it
       kept a five-club row that fitted only because the cards were allowed to
       overlap; on its side it dropped to a row so small the cards were
       unreadable and then had a rule saying not to try anything else. Asking
       every candidate what scale it would actually get is both shorter and
       right: wrapping wins when a row has run out of width, and cannot win
       when the band above and below is what is pinching, because a taller
       block scores worse in the same band and simply loses.

       A row is still what the clubs are *for* — heads side by side, compared
       at a glance — so it holds the tie: an arrangement with more rows has to
       be a clear margin better before it takes the row's place, rather than
       winning on a hundredth. */
    function openFit(camera, aspect) {
        var n = live().length;
        var best = null, seen = {}, rows, cols, fit;
        if (!n) return fitOpen(camera, aspect, 1, 1, 1);
        for (rows = 1; rows <= n; rows++) {
            cols = Math.ceil(n / rows);
            /* Counting by rows rather than by columns is what keeps the
               candidates balanced — five clubs get 5, 3, 2 and 1 across,
               never the ragged 4 that leaves one club alone under four. Two
               row counts can land on the same width (five clubs in four rows
               and in three both come to 2 across), and the second is the same
               arrangement measured twice. */
            if (seen[cols]) continue;
            seen[cols] = 1;
            fit = fitOpen(camera, aspect, cols, Math.ceil(n / cols), n);
            if (!best || fit.scale > best.scale * 1.06) best = fit;
        }
        return best;
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
        setCardShape(cardFor(cols, n));
        syncStubs();
        row.forEach(function (c, i) {
            c.spot.open = openSpot(i, cols, rows, n, c.len);
            /* Every card hangs at the same height now. The row used to drop
               alternate ones to stagger them into two heights, which is what
               a row of cards closer together than they are wide needs — and
               they now stand a full card apart (see `metrics`), so there is
               nothing left to dodge. A level row is also the one you can read
               across: five cards at two heights are compared a pair at a
               time. */
            if (c.label) {
                c.label.position.set(c.labelBase.x, c.labelBase.y - CARD.drop, c.labelBase.z);
            }
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
            var built = buildClub(club, mats(club));
            var spot = { closed: closedSpot(i, C.ALL_CLUBS.length), open: null };
            var label = buildLabel(club);

            built.pivot.add(label);
            /* Hung on the club's own axis, and at the same height on every
               club. It used to be centred on the head instead, on the grounds
               that a driver's body, a blade's toe and a mallet's wings all sit
               at a different offset from the shaft — which is true of the
               head and is exactly why it is the wrong thing to hang a card
               from. Five clubs are laid out by their shafts, so five cards
               hung off five differently-shaped heads come out at five
               different heights and five different offsets: a row of cards
               that reads as five things dropped rather than a row, and, once
               the cards were big enough to read, one that overlapped its
               neighbours in the places the heads happened to lean.

               So the anchor is the shaft, and how far below it the card hangs
               is the arrangement's business (`metrics`/`relayoutOpen`) — far
               enough that the head above it stays in full view, which is what
               the row is being opened to look at. The head's own box is still
               read here, for the halo, which is a marker *on* the head and
               does belong to it. */
            built.head.updateMatrixWorld(true);
            var headBox = new THREE.Box3().setFromObject(built.head);
            var headMid = headBox.getCenter(new THREE.Vector3());

            /* The halo: a disc of the club's own colour behind its head, lit
               only for the club in hand and half lit for the one under the
               pointer. Emissive alone was doing that job and could not — a
               driver crown is nearly black on purpose, and the light needed
               to make a black crown glow is the light that floods a chrome
               blade white, so the club being marked was the one you could
               see least of. A halo marks a club without touching how the
               club itself is lit, and it is the same colour as the name on
               its card, so the answer to "which one is in my hand" is a
               colour rather than a brightness. */
            var halo = new THREE.Sprite(new THREE.SpriteMaterial({
                map: haloTexture(), color: ink(look(club.id).metal),
                transparent: true, opacity: 0, depthTest: false, depthWrite: false
            }));
            /* Not additive, and no bigger than the head it is behind. Both
               were the first version and both were wrong for the same reason:
               the picture goes through bloom on the way out, so an additive
               sprite the size of a club head comes back as a coloured cloud
               the size of a fist and the marker is louder than the thing it
               is marking. */
            halo.scale.set(0.15, 0.15, 1);
            halo.position.set(headMid.x, headMid.y, headMid.z);
            halo.renderOrder = 8;
            built.pivot.add(halo);

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
                pivot: built.pivot,
                halo: halo,
                labelBase: { x: 0, y: built.len - 0.02, z: 0 },
                spot: spot,
                shaft: built.shaft, fullGeo: built.fullGeo, stubGeo: built.stubGeo,
                stubLen: built.stubLen, grip: built.grip, cap: built.cap, stubOn: false,
                now: { x: spot.closed.x, y: spot.closed.y, z: spot.closed.z, rz: spot.closed.rz, rx: spot.closed.rx, ry: spot.closed.ry, scale: 1, lift: 0, glow: 0, labelOp: 0, turn01: 0 }
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
        // Wide enough to take in the club standing beside the bag as well as
        // the bag: chrome against a bright sky needs something behind it, and
        // the club in hand is the one most often against open sky.
        haze.scale.set(1.9, 2.0, 1);
        haze.position.set(0.11, 0.72, -0.3);
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

        /* The scrim: the course, dimmed, while the row is out.

           The picker has always claimed to dim the course behind the clubs
           and what actually did it was a CSS gradient over the whole canvas —
           which dims the clubs by exactly as much, because they are drawn on
           that canvas. The clubs are the one thing that should not be dimmed,
           so a curtain over the top can never be the answer; it has to be
           hung *behind* them, in the scene.

           Which is what this is: a plane sized to the frustum, held a little
           further from the lens than the row, with its depth test on and its
           depth write off. Transparent objects are drawn after opaque ones,
           so by the time this is painted every club has already written its
           own depth — and every fragment of the scrim that lands behind a
           club is thrown away by that. The result is the course going dark
           and the row staying exactly as lit as it was, out of one plane and
           no second pass. */
        B.scrim = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({
                color: ink(0x030a14), transparent: true, opacity: 0,
                depthWrite: false, fog: false
            })
        );
        B.scrim.renderOrder = 6;
        B.scrim.visible = false;
        B.scrim.frustumCulled = false;
        scene.add(B.scrim);

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

        /* And how far out of the bag the club in hand may stand: a fifth of
           the half-width the bag was placed against, expressed as a multiple
           of the offset `heldSpot` is written in. Clamped at both ends — a
           phone held upright should still put the club clearly outside the
           bag, and an ultrawide should not park it halfway across the hole. */
        var heldK = Math.max(0.55, Math.min(1.25, bagW * 0.208 / 0.16));
        /* …and a change to it is a fifth thing that can give a shut bag
           something to do again. `update` stops easing once nothing is
           moving, and a window resized or a phone turned over moves the
           whole rig from `place` without ever asking a club to ease
           anywhere — so without this the club in hand keeps the offset it
           was standing at on the old frustum. */
        if (Math.abs(heldK - B.heldK) > 1e-4) { B.heldK = heldK; B.settled = false; }

        /* How the clubs are arranged, how big they get and how high they sit
           are all measured against this window, every frame — the lens opens as
           the ball speeds up and a phone can be turned over mid-round, so none
           of the three is a constant. The rearrangement itself only runs when
           the answer changes. */
        var fit = openFit(camera, aspect);
        if (fit.cols !== B.cols) relayoutOpen(fit.cols);
        B.openScale = fit.scale;
        B.openY = fit.y;

        /* The scrim, a little further out than the row and sized to whatever
           the frustum is there. Wider than it needs to be on purpose: the
           camera's own aspect is what this is measured against, and a plane
           cut to it exactly shows a hairline of undimmed course down the edge
           the moment the lens opens between the measurement and the frame. */
        if (B.scrim) {
            var sh = Math.tan((camera.fov || 52) * Math.PI / 360) * SCRIM_DEPTH;
            B.scrim.visible = k > 0.005;
            B.scrim.material.opacity = SCRIM * k;
            B.scrim.scale.set(sh * aspect * 2.4, sh * 2.4, 1);
            put(B.scrim, camera, 0, 0, -SCRIM_DEPTH, 1, 0, 0);
            // put() sets the scale from its own argument; this one is set
            // from the frustum above, so it goes back afterwards.
            B.scrim.scale.set(sh * aspect * 2.4, sh * 2.4, 1);
        }

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
            var chosen = c.id === B.selected;
            var to = B.expanded ? c.spot.open : restSpot(c);
            var under = B.expanded && B.hover === c.id;
            // Kept small: at the zoom the open row uses, a tenth of a unit is
            // a fifth of the screen and the club in hand floats away from the
            // others instead of standing a little proud of them.
            /* The club under the pointer stands up as well as the one in
               hand, and further, because a hover has to answer *before* the
               click: the row is five near-identical silhouettes and the one
               thing a player wants to know while moving across them is which
               one they are about to take. */
            /* Shut, the club in hand no longer needs lifting clear of the
               bunch — it is not in the bunch (see `heldSpot`), and a lift on
               top of that is a club hovering over the grass. */
            var lift = under ? 0.042 : (chosen && B.expanded ? 0.022 : 0);
            var glow = chosen ? 1 : (under ? 0.62 : 0);

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
            /* Turning on its own axis while it is in the bag, so a glance at
               the cuff still reads as four different heads. Once the row is
               out, the clubs stand at OPEN_YAW and hold still — a card is not
               worth reading while it orbits past — with one exception: the
               club under the pointer keeps turning, which is the only way to
               see a face from every side and the thing the row was always
               described as doing. */
            c.now.turn01 = ease1(c.now.turn01, under ? 1 : 0, ease);
            var turn = c.now.ry +
                B.open01 * (B.expanded ? c.now.turn01 : 1) * B.spin;
            c.group.rotation.set(c.now.rx, turn, c.now.rz);
            c.group.scale.setScalar(c.now.scale);
            // …and whatever hangs beside the head rather than on it stays put
            // while it turns. See `pivot` in buildClub.
            if (c.pivot) c.pivot.rotation.y = -turn;

            // The club in hand catches a light of its own. Every club owns its
            // materials, so this stays on the one club it is meant for.
            /* Gentle. A driver crown is nearly black, and any more than
               this floods it pale blue — the club in hand ends up the one you
               can see least of. */
            /* And only while the row is out. Shut, the club in hand is
               already marked by standing outside the bag (`heldSpot`) —
               lighting it as well put a lamp on the one club with nothing
               behind it, and bloom turned a chrome head so lit into a white
               blob with a coloured ring round it. */
            var e = 0.10 * c.now.glow * B.open01;
            c.group.traverse(function (o) {
                if (o.material && o.material.emissive) o.material.emissive.setRGB(e * 0.45, e * 0.7, e);
            });
            // The halo does the rest, and it is the half that shows on a dark
            // crown. Only while the row is open: a coloured glow behind a club
            // standing in a shut bag is a light source nothing in the corner
            // of the screen explains.
            if (c.halo) {
                /* Dimmer than it was, because the metal behind it is not the
                   flat grey it was drawn against: a polished head already
                   carries its own highlight, and a halo bright enough to
                   mark a slate blade blooms straight over a chrome one. */
                c.halo.material.opacity = 0.36 * c.now.glow * B.open01;
                c.halo.visible = c.halo.material.opacity > 0.01;
            }

            // The full write-up still lives in the panel above (game.js,
            // where it can be read by a screen reader); this is the fast
            // version, floating right over the club it belongs to, all four
            // up together the moment the row is open so every club can be
            // compared at a glance rather than one at a time.
            if (c.label) {
                c.now.labelOp = ease1(c.now.labelOp, B.expanded ? 1 : 0, ease);
                c.label.material.opacity = c.now.labelOp;
                c.label.visible = c.now.labelOp > 0.01;
                faceLabel(c.label, chosen);
                /* And the cards that are neither in hand nor under the
                   pointer stand back. Five cards at the same weight is five
                   things asking to be read at once; a card at three quarters
                   is still legible and is plainly not the one being talked
                   about. */
                c.label.material.color.setScalar(0.72 + 0.28 * c.now.glow);
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

    /* Where a card is on the screen, as a rectangle. A sprite always faces the
       lens, so its size in the frame is its world size over the frustum's at
       the depth it is standing — no projection of corners needed, and it is
       the same arithmetic `fitOpen` sizes the row with, run backwards.

       Returns the half-extents alongside the middle, both in the same -1..1
       the pointer arrives in. */
    var _card = new THREE.Vector3(), _cardScale = new THREE.Vector3();
    function cardRect(label, camera) {
        // How big it is drawn is its *world* scale, which is what the sprite
        // shader measures off the model matrix — the rig it hangs in is scaled
        // to the frustum every frame, so the sprite's own numbers are half the
        // answer.
        label.getWorldScale(_cardScale);
        _card.setFromMatrixPosition(label.matrixWorld);
        _card.applyMatrix4(camera.matrixWorldInverse);
        var dist = -_card.z;
        if (dist <= 0.01) return null;
        var halfH = Math.tan((camera.fov || 52) * Math.PI / 360) * dist;
        var halfW = halfH * (camera.aspect || 1);
        // applyMatrix4 divides through by w, so this lands in the same -1..1
        // the pointer arrives in.
        _card.applyMatrix4(camera.projectionMatrix);
        return {
            x: _card.x, y: _card.y,
            hx: _cardScale.x / 2 / halfW, hy: _cardScale.y / 2 / halfH
        };
    }

    function pick(nx, ny, camera, scene) {
        if (!B.ready) return null;
        scene.updateMatrixWorld(true);

        if (B.expanded) {
            var aspect = camera.aspect || 1;
            var best = null, bestD = 0.2;       // a generous target in a row

            /* The card first, and by the rectangle it actually occupies.

               It is the biggest, squarest thing on the screen with a club's
               name written across it, so it is what a finger goes for — and
               for a long time the only thing that answered was the head above
               it, which on a phone is a chrome lump the width of a thumbnail.
               A picker you have to aim at is a picker that loses to the
               keyboard it is standing in for.

               Cards do not overlap each other (see `metrics`), so the first
               one the point falls inside is the answer; there is no nearest
               to work out. */
            var hit = null;
            live().forEach(function (c) {
                if (hit || !c.label || !c.label.visible) return;
                var r = cardRect(c.label, camera);
                if (!r) return;
                if (Math.abs(nx - r.x) <= r.hx && Math.abs(ny - r.y) <= r.hy) hit = c.id;
            });
            if (hit) return hit;

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
