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
        driver:  { name: '#8ab4ff', metal: 0x1f6fff, steel: 0x2f3b4f, shine: 82, finish: 'pvd' },
        iron:    { name: '#c4b5fd', metal: 0x8b5cf6, steel: 0x9aa6b4, shine: 76, finish: 'brushed' },
        chipper: { name: '#86efac', metal: 0x22c55e, steel: 0x929daa, shine: 70, finish: 'satin' },
        wedge:   { name: '#fde68a', metal: 0xeab308, steel: 0x76828f, shine: 96, finish: 'chrome' },
        mallet:  { name: '#f0abfc', metal: 0xc026d3, steel: 0x4a5568, shine: 30, finish: 'satin' },
        checker: { name: '#5eead4', metal: 0x14b8a6, steel: 0x8d97a3, shine: 24, finish: 'brushed' }
    };
    function look(id) { return CLUB_LOOK[id] || CLUB_LOOK.chipper; }

    /* What each finish does to the metal, and all four are now the same two
       numbers: how much of it is metal, and how rough that metal is.

       They used to be a reflectivity, a shininess and a highlight colour,
       which is the Phong way of saying it — a blend between a painted colour
       and a reflected room, with a hand-picked specular on top to stop three
       lamps turning every head into a white dot. The heads are standard
       (metalness/roughness) materials now, so the two numbers *are* the
       finish: at `metalness: 1` there is no painted colour left to blend
       with, the colour tints the reflection itself the way a real metal
       does, and `roughness` blurs the room rather than dimming it. That is
       the difference between a club that is grey where it is not shiny and
       one that is dark where the room is dark — which is what metal looks
       like.

       Nothing is perfectly smooth. A wedge at 0.11 is a mirror with a
       machined head's worth of haze on it; below about 0.05 a head picks up
       every mip seam in the room and flashes as it turns. `streak` still
       asks for the brushed texture below, which is a roughness map now
       rather than a specular one — the grain *is* where the metal is rougher,
       so it combs the reflection instead of combing a highlight. */
    var FINISH = {
        chrome:  { metal: 1.00, rough: 0.11, streak: false },
        brushed: { metal: 0.92, rough: 0.36, streak: true },
        satin:   { metal: 0.80, rough: 0.48, streak: true },
        pvd:     { metal: 1.00, rough: 0.24, streak: false }
    };

    /* How much of the room a metal is allowed to pick up. A metal is lit by
       *nothing else* — at `metalness: 1` there is no diffuse term for the
       scene's own lights to land on — so this is the one number that says
       how bright the bag reads. A touch over 1, because the room is a
       canvas and its whitest softbox is still only a canvas white; much
       over, and a chrome wedge under the bloom pass is a lamp. */
    var ENV_LIGHT = 1.1;
    function finishOf(club) {
        return FINISH[club ? look(club.id).finish : 'satin'] || FINISH.satin;
    }

    /* ── materials ─────────────────────────────────────────────────────── */

    /* Where the highlights come from is the room below, not a picked
       specular colour. That was the Phong answer and it had to be hand-tuned
       to stay honest — a white highlight on every metal is what turned four
       heads into four white blobs, so the speculars were written grey and
       the shininess low enough to spread the dot into a sheen. A metal's
       highlight is a reflection of something; give it something to reflect
       and the tuning is the room's job. */
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
        /* A product-shot room rather than a sky: a lit cyclorama, a pale
           floor, and softboxes standing round it at head height.

           It used to be written dark on purpose, because under Phong's
           `MixOperation` the room was blended *over* a painted colour that
           the scene's own lamps were already lighting — a bright room came
           back as a white blob with bloom round it. A metal on a standard
           material has no painted colour to fall back on: the room is the
           only light it has, so a dark room is a black club. That is exactly
           what the first standard pass looked like — five heads in silhouette
           against the fairway. The floor is the half that matters most: a
           blade's face and a wedge's sole look sideways and down, into the
           bottom of this strip, and the old floor there was #0c1015. */
        sky.addColorStop(0.00, '#c3d4e6');     // zenith
        sky.addColorStop(0.34, '#94a9bf');
        sky.addColorStop(0.47, '#b9a891');     // the horizon's own warmth
        sky.addColorStop(0.53, '#6b737d');     // a pale studio floor under it
        sky.addColorStop(1.00, '#3a4048');
        g.fillStyle = sky;
        g.fillRect(0, 0, W, H);

        /* The lights. Soft-edged everywhere, because a bar drawn hard comes
           back off a curved head as a cut-out rectangle.

           Two kinds. The round ones are overhead lamps, and they are what
           sweeps across a crown as it turns. The tall ones are softboxes
           standing *across* the horizon, and they are the chrome stripe — the
           long bright band down the side of a shaft or along the top line of
           an iron that is the first thing anyone means by "it looks like
           metal". Nothing overhead can put that there: a vertical surface
           only ever sees the horizon. */
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
        [[0.08, 0.035, 'rgba(255, 250, 240, 0.70)'],
         [0.40, 0.050, 'rgba(236, 244, 255, 0.62)'],
         [0.71, 0.030, 'rgba(255, 246, 232, 0.55)']].forEach(function (box) {
            var cx = box[0] * W, hw = box[1] * W;
            var y0 = 0.30 * H, y1 = 0.62 * H;
            var across = g.createLinearGradient(cx - hw, 0, cx + hw, 0);
            across.addColorStop(0, 'rgba(255, 255, 255, 0)');
            across.addColorStop(0.5, box[2]);
            across.addColorStop(1, 'rgba(255, 255, 255, 0)');
            g.fillStyle = across;
            g.fillRect(cx - hw, y0, hw * 2, y1 - y0);
        });

        _env = new THREE.CanvasTexture(cv);
        _env.mapping = THREE.EquirectangularReflectionMapping;
        if (THREE.sRGBEncoding !== undefined) _env.encoding = THREE.sRGBEncoding;
        return _env;
    }

    /* The grain on a head that is not a mirror. A brushed or milled face is
       polished in one direction only, so its highlight is a streak rather
       than a dot — and a streak is what says "machined" at the size these are
       drawn. It rides on `roughnessMap`, so the grain is where the metal is
       rougher: the colour underneath is untouched and what is combed is how
       sharply each line of it gives the room back. (On the Phong pass this
       was a `specularMap`, which combed the highlight and left the
       reflection alone — the same picture doing half the work.) */
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

    /* The same room, blurred by roughness — which is the thing a standard
       material cannot do without. `roughness` on a physical material is
       answered by reading the environment from a prefiltered mip chain: a
       mirror takes the sharp level, a satin head takes a smeared one, and
       both are looking at the *same room*, which is what makes four finishes
       read as four finishes rather than four greys. Handed a raw
       equirectangular strip instead, r128's physical shader has no chain to
       walk and the reflection drops out altogether — a black club, not a
       rough one. So the strip is the source and this is what the materials
       are given.

       Built once, lazily, at the point the context is known — the same bargain
       `TX.prepare` makes in textures.js. If there is no renderer yet, or the
       build is a three.js without a PMREM generator in it, the strip goes out
       unfiltered: every finish then reads as the same polished one, which is
       a worse-looking bag and still a bag. */
    var _radiance = null, _radianceTried = false;
    function studioRadiance() {
        if (_radianceTried) return _radiance || studioEnv();
        _radianceTried = true;
        var renderer = G3.render && G3.render.state && G3.render.state.renderer;
        if (!renderer || !THREE.PMREMGenerator) return studioEnv();
        try {
            var gen = new THREE.PMREMGenerator(renderer);
            _radiance = gen.fromEquirectangular(studioEnv()).texture;
            gen.dispose();
        } catch (e) {
            _radiance = null;
        }
        return _radiance || studioEnv();
    }

    /* One metal, built from a finish rather than from four loose numbers at
       each call site. Everything that is meant to look like steel goes
       through here, so "what does chrome look like" is answered once.

       `over.rough` is the one thing a call site may argue with, because a
       club's own polish is a club's business: see `polish` below. */
    function metal(color, fin, over) {
        var m = new THREE.MeshStandardMaterial({
            color: ink(color),
            metalness: over && over.metal !== undefined ? over.metal : fin.metal,
            roughness: over && over.rough !== undefined ? over.rough : fin.rough,
            envMap: studioRadiance(),
            envMapIntensity: over && over.light !== undefined ? over.light : ENV_LIGHT
        });
        if (fin.streak) m.roughnessMap = brushTexture();
        return m;
    }

    /* A club's own `shine` — 24 for the checker, 96 for the wedge — against
       the roughness its finish starts from. It used to be a Phong
       `shininess`, which is a highlight's *tightness*, and the nearest honest
       thing to that in a standard material is how polished the surface is: a
       96 comes out around two thirds of its finish's roughness and a 24 at
       about a fifth rougher than it. Two numbers rather than a second table,
       because "what this club is made of" wants to stay on the one line in
       CLUB_LOOK that says it. */
    function polish(fin, shine) {
        var k = 1.25 - 0.6 * Math.max(0, Math.min(1, (shine || 60) / 100));
        return Math.max(0.05, fin.rough * k);
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
            paint: new THREE.MeshStandardMaterial({
                color: ink(L ? L.metal : 0x38bdf8),
                /* Paint is the one thing on a head that is *not* metal, and
                   saying so is what keeps the club's colour its colour: at
                   `metalness: 0.1` the room lands on it as a sheen over the
                   colour rather than instead of it, which is a lacquered
                   panel. Rougher than the steel beside it, and given less of
                   the room, for the same reason. */
                metalness: 0.10, roughness: 0.34,
                envMap: studioRadiance(), envMapIntensity: 0.85
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
            crown: metal(L ? L.steel : 0x36435a, fin, { rough: polish(fin, shine) }),
            /* A putter insert is the one part of a club that is deliberately
               soft — a polymer face, there to deaden the strike — so it is
               the one part with no metal in it at all. */
            insert: new THREE.MeshStandardMaterial({
                color: ink(0x1e2932), metalness: 0.0, roughness: 0.78,
                envMap: studioRadiance(), envMapIntensity: 0.5
            }),
            /* The shaft. Chrome whoever is holding it — a shaft is the one
               part of a club nobody finishes to match the head — and the one
               place the reflection is doing the most work per triangle: a
               plain grey rod against a bright sky is a scratch on the frame,
               and the same rod with the room in it is a shaft. */
            steel: metal(0x8d98a4, FINISH.chrome, { rough: 0.16 }),
            grip: new THREE.MeshLambertMaterial({ color: ink(0x1d2127) }),
            head: metal(steel, fin, { rough: polish(fin, shine) }),
            /* A driver face is a bright insert whatever the crown is doing,
               so it takes the mirror rather than the club's own finish. */
            face: metal(0xa8b4c0, FINISH.chrome, { rough: 0.19 }),
            /* And the milled face, which is the one metal that is a picture
               rather than a colour. It keeps the club's own finish so a
               chrome wedge's grooves flash and a brushed iron's do not — but
               never the brushed streak, which would cross its own grooves. */
            grooves: new THREE.MeshStandardMaterial({
                map: faceTexture(club), bumpMap: faceTexture(club), bumpScale: 0.0016,
                /* Milled, so always a little rougher than the rest of the
                   head it sits in, and given less of the room: a face is
                   grooves lit from the side, not a second mirror. */
                metalness: fin.metal * 0.92, roughness: Math.min(0.9, fin.rough + 0.10),
                envMap: studioRadiance(), envMapIntensity: ENV_LIGHT * 0.6,
                side: THREE.DoubleSide
            }),
            /* The driver's shell: carbon crown under a clear coat — a gloss
               with very little metal in it, so the reflection sits *on* the
               weave — framed in white, ringed in the club's colour as an
               anodised metal (on a SIM2 the ring is a forged aluminium part
               and catches the light like one), over a dark satin sole. One
               material, painted in its shader; see `driverSkin`. Only the
               driver uses it, so only the driver builds it. */
            skin: club && club.id === 'driver' ? driverSkin(L) : null,
            // Painted white: a driver's face surround, a sleeve's index band,
            // a two-ball's discs.
            white: new THREE.MeshStandardMaterial({
                color: ink(0xeef1f4), metalness: 0.0, roughness: 0.32,
                envMap: studioRadiance(), envMapIntensity: 0.7
            }),
            // Polished weights and screws.
            chrome: metal(0xd4dce4, FINISH.chrome, { rough: 0.08 })
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
    /* Which face a club wears. Five, because there are five ways a real face
       is finished: an iron's grooves, a wedge's grooves over milling, the
       checker's spin face (milled in a fine check, which is the joke in its
       name and also exactly what a spin-milled face looks like), a driver's
       dark face with the dashed scorelines down its middle, and a putter's
       plain milling with no grooves at all. */
    function faceKind(club) {
        var id = club ? club.id : '';
        if (id === 'driver') return 'driver';
        if (id === 'putter' || id === 'mallet') return 'putter';
        if (id === 'wedge') return 'milled';
        if (id === 'checker') return 'checker';
        return 'grooved';
    }
    function faceTexture(club) {
        var key = faceKind(club);
        if (_faces[key]) return _faces[key];
        var N = 128;
        var cv = document.createElement('canvas');
        cv.width = cv.height = N;
        var g = cv.getContext('2d');
        var m, y;

        if (key === 'driver') {
            /* Brushed charcoal with the Twist Face scorelines: five rows,
               each a line and a dot on the heel side, a dot and a line on
               the toe side, and a plain line between them on the middle
               three — with the rows drawn in toward the corners, where the
               face itself is narrower. Twice as wide as it is tall, as the
               face is, so the dots stay round. */
            cv.width = 256;
            g.fillStyle = '#25292e';
            g.fillRect(0, 0, 256, N);
            for (m = 0; m < N; m++) {
                g.fillStyle = 'rgba(255, 255, 255, ' + (0.015 + 0.03 * ((m * 7919) % 5) / 5).toFixed(3) + ')';
                g.fillRect(0, m, 256, 1);
            }
            g.strokeStyle = g.fillStyle = 'rgba(232, 238, 244, 0.92)';
            g.lineWidth = 2;
            [[30, 34], [46, 26], [62, 22], [78, 28], [94, 40]].forEach(function (row, i) {
                var yy = row[0], inset = row[1];
                g.beginPath(); g.moveTo(inset, yy); g.lineTo(92, yy); g.stroke();
                g.fillRect(100, yy - 2, 6, 4);
                g.fillRect(150, yy - 2, 6, 4);
                g.beginPath(); g.moveTo(164, yy); g.lineTo(256 - inset, yy); g.stroke();
                if (i > 0 && i < 4) {
                    g.beginPath(); g.moveTo(114, yy); g.lineTo(142, yy); g.stroke();
                }
            });
            _faces[key] = srgbCanvas(cv);
            return _faces[key];
        }

        if (key === 'putter') {
            g.fillStyle = '#bcc6d0';
            g.fillRect(0, 0, N, N);
            for (m = 0; m < N; m += 2) {
                g.fillStyle = m % 4 ? 'rgba(255, 255, 255, 0.10)' : 'rgba(20, 28, 36, 0.10)';
                g.fillRect(0, m, N, 1);
            }
            _faces[key] = srgbCanvas(cv);
            return _faces[key];
        }

        var fine = key !== 'grooved';
        g.fillStyle = fine ? '#c9d4de' : '#b6c1cc';
        g.fillRect(0, 0, N, N);

        if (fine) {
            // The milling: fine passes across the face, under the grooves
            // rather than instead of them.
            g.lineWidth = 1;
            for (m = 0; m < N; m += 2) {
                g.strokeStyle = 'rgba(255, 255, 255, ' + (m % 4 ? 0.05 : 0.11) + ')';
                g.beginPath(); g.moveTo(0, m + 0.5); g.lineTo(N, m + 0.5); g.stroke();
            }
        }
        if (key === 'checker') {
            for (var cy = 0; cy < N; cy += 8) {
                for (var cx = (cy / 8) % 2 ? 8 : 0; cx < N; cx += 16) {
                    g.fillStyle = 'rgba(24, 32, 41, 0.10)';
                    g.fillRect(cx, cy, 8, 8);
                }
            }
        }

        var step = fine ? 8 : 12, pad = fine ? 4 : 10;
        g.lineWidth = fine ? 2.5 : 4;
        for (y = step; y < N - step / 2; y += step) {
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

    /* The driver's crown: a 2x2 twill of carbon fibre, each tow a dark
       bundle lit along its length, the way a weave catches the light
       differently on the cells that run across it. One 64px tile covers
       12mm of crown (see the UVs in `driverShell`) — 3mm tows, a touch
       coarser than a real weave so it still reads at picker size; at 4mm
       it read as a wicker basket and at 2mm as flat black. */
    var _carbon = null;
    function carbonTexture() {
        if (_carbon) return _carbon;
        var N = 64, C = 16;
        var cv = document.createElement('canvas');
        cv.width = cv.height = N;
        var g = cv.getContext('2d');
        for (var j = 0; j < N / C; j++) {
            for (var i = 0; i < N / C; i++) {
                var across = (i + j) % 2 === 0;
                var x = i * C, y = j * C;
                var grad = across
                    ? g.createLinearGradient(x, y, x, y + C)
                    : g.createLinearGradient(x, y, x + C, y);
                grad.addColorStop(0.0, '#0b0d10');
                grad.addColorStop(0.5, '#3d444d');
                grad.addColorStop(1.0, '#0b0d10');
                g.fillStyle = grad;
                g.fillRect(x, y, C, C);
            }
        }
        _carbon = srgbCanvas(cv);
        _carbon.wrapS = _carbon.wrapT = THREE.RepeatWrapping;
        return _carbon;
    }

    /* ── one club ──────────────────────────────────────────────────────── */

    // Real lengths, in metres. A driver is 45 inches, a 7 iron 38, wedges 35.5,
    // a putter 34 — and the mallet is a putter, which it was not until the
    // mallet had a head of its own: it fell through to the default 0.95.
    var LENGTHS = {
        driver: 1.14, iron: 0.97, chipper: 0.95, wedge: 0.90, checker: 0.92,
        putter: 0.86, mallet: 0.86
    };

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
            new THREE.MeshStandardMaterial({
                color: ink(look(club.id).metal), metalness: 0.15, roughness: 0.30,
                envMap: studioRadiance(), envMapIntensity: 0.9
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

    /* Heads, modelled from photographs and spec sheets rather than guessed
       at. Real sizes throughout: the USGA caps a driver at 127mm heel to toe
       and 71mm tall; a 7 iron is 76–80mm of blade with a 6–8mm topline and a
       17–24mm sole, and its toe stands no more than about 0.62 of its length;
       a wedge is a taller teardrop with a wide, cambered sole; an Anser putter
       is 100mm of face with a flange behind it and a weight at each end.

       And one look per head rather than one shape per head, because the row
       is a shop window: the driver is a carbon-crowned, ring-skirted modern
       driver after the TaylorMade SIM2 Max; the irons are perimeter-weighted
       cavity backs with a two-tone medallion in the cavity, after PXG; the
       wedges are muscle-back teardrops with a cambered sole; the putter is a
       heel-toe Anser blade on a plumber's neck; and the mallet is a two-ball,
       which is the one putter anybody can name from across a room.

       Everything is built in the head's own frame, and that frame is the club
       as it stands in a bag — grip down in the well, head up where it can be
       seen. The origin is where the shaft ends, +Y runs on past it to the
       sole, +X is the way the face looks, and Z is heel to toe with the head
       hung out to +Z from a hosel at z = 0. Two ways of drawing in it recur
       often enough to have names: `backward` extrudes an outline drawn *on
       the face* back into the head, and `upward` extrudes an outline drawn
       *from above* up off the sole. */

    // From p toward q by d, never past half the edge.
    function toward(p, q, d) {
        var dx = q[0] - p[0], dy = q[1] - p[1];
        var L = Math.sqrt(dx * dx + dy * dy) || 1;
        d = Math.min(d, L / 2);
        return [p[0] + dx / L * d, p[1] + dy / L * d];
    }

    /* A polygon with every corner rounded by its own radius. A club head is a
       handful of straight-ish edges and a handful of very different curves —
       a sharp leading edge, a round toe, a heel that blends into the neck —
       and writing it as corners and radii is what keeps an outline readable
       and tunable, where a run of hand-placed Béziers was neither. */
    function roundPoly(pts, radii, into) {
        var sh = into || new THREE.Shape();
        var n = pts.length;
        for (var i = 0; i < n; i++) {
            var p = pts[i];
            var r = typeof radii === 'number' ? radii : radii[i];
            var a = toward(p, pts[(i + n - 1) % n], r), b = toward(p, pts[(i + 1) % n], r);
            if (i === 0) sh.moveTo(a[0], a[1]); else sh.lineTo(a[0], a[1]);
            sh.quadraticCurveTo(p[0], p[1], b[0], b[1]);
        }
        sh.closePath();
        return sh;
    }

    /* Normals that are smooth across a curve and sharp across an edge.

       r128's ExtrudeGeometry is not indexed and computes its normals per
       face, so every bevel came out faceted — a row of flat strips round a
       toe where there should be one highlight sliding round it. Averaging
       every face at a corner the other way smooths the leading edge of a
       blade into a pillow. This averages only the faces within `deg` of
       each other, which is what a modelling package calls an auto-smooth
       angle. */
    function creased(geo, deg) {
        var pos = geo.attributes.position, n = pos.count;
        var lim = Math.cos(deg * Math.PI / 180);
        var fn = new Float32Array(n * 3);
        var a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
        var i, j, k;
        for (i = 0; i < n; i += 3) {
            a.fromBufferAttribute(pos, i);
            b.fromBufferAttribute(pos, i + 1).sub(a);
            c.fromBufferAttribute(pos, i + 2).sub(a);
            b.cross(c);
            var L = b.length();
            if (L > 0) b.multiplyScalar(1 / L);
            for (k = 0; k < 3; k++) { fn[(i + k) * 3] = b.x; fn[(i + k) * 3 + 1] = b.y; fn[(i + k) * 3 + 2] = b.z; }
        }
        var buckets = {};
        for (i = 0; i < n; i++) {
            var key = Math.round(pos.getX(i) * 1e5) + ',' + Math.round(pos.getY(i) * 1e5) + ',' +
                Math.round(pos.getZ(i) * 1e5);
            (buckets[key] || (buckets[key] = [])).push(i);
        }
        var out = new Float32Array(n * 3);
        Object.keys(buckets).forEach(function (key) {
            var list = buckets[key];
            for (var x = 0; x < list.length; x++) {
                var p = list[x] * 3, sx = 0, sy = 0, sz = 0;
                for (var y = 0; y < list.length; y++) {
                    var q = list[y] * 3;
                    if (fn[p] * fn[q] + fn[p + 1] * fn[q + 1] + fn[p + 2] * fn[q + 2] >= lim) {
                        sx += fn[q]; sy += fn[q + 1]; sz += fn[q + 2];
                    }
                }
                var m = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1;
                out[p] = sx / m; out[p + 1] = sy / m; out[p + 2] = sz / m;
            }
        });
        geo.setAttribute('normal', new THREE.BufferAttribute(out, 3));
        return geo;
    }

    /* An outline drawn on the face — x heel to toe, y topline down to the
       sole — pushed back into the head from `front`. The bevel grows the
       outline by its own size, so the solid starts at `front` exactly and
       ends `depth + 2 * bevel` behind it. */
    function backward(shape, depth, bevel, front) {
        var geo = new THREE.ExtrudeGeometry(shape, {
            depth: depth, curveSegments: 14, bevelEnabled: bevel > 0,
            bevelSegments: 3, bevelSize: bevel, bevelThickness: bevel
        });
        geo.rotateY(-Math.PI / 2);           // extrusion runs to -x, outline x to +z
        geo.translate(front - bevel, 0, 0);
        return creased(geo, 40);
    }

    /* An outline drawn from above — x the way the face looks, y heel to toe —
       stood up off a sole at `sole`, `height` tall including its bevels. */
    function upward(shape, height, bevel, sole) {
        var geo = new THREE.ExtrudeGeometry(shape, {
            depth: Math.max(0.0002, height - 2 * bevel), curveSegments: 14,
            bevelEnabled: bevel > 0, bevelSegments: 3, bevelSize: bevel, bevelThickness: bevel
        });
        geo.rotateX(Math.PI / 2);            // outline y to +z, extrusion to -y
        geo.translate(0, sole - bevel, 0);
        return creased(geo, 40);
    }

    // A round bar from a to b — a neck, a crank, a weight screw.
    function rod(mat, a, b, r0, r1, seg) {
        var d = new THREE.Vector3().subVectors(b, a);
        var m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, d.length(), seg || 16), mat);
        m.position.copy(a).addScaledVector(d, 0.5);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
        return m;
    }
    function v3(x, y, z) { return new THREE.Vector3(x, y, z); }

    /* The face itself, as a flat plate cut to an outline drawn in the face
       plane, with fresh UVs over its own box: `ShapeGeometry` hands out the
       shape's own coordinates as texture coordinates, which for a head
       measured in metres is the first 8% of the picture stretched over the
       whole face. Shrunk about its middle by `inset`, so the grooves stop
       short of the edge the way milling does. */
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

    /* ── the driver ─────────────────────────────────────────────────────── */

    /* From above: a big rounded triangle, widest just behind the face and
       running back to a broad, round tail — 128mm heel to toe, 118 face to
       back. Drawn in the body's own frame, whose x = 0 is the face; the
       body is then set forward of the shaft (see `buildDriver`). */
    var DRIVER_FOOT = [
        [0.012, 0.008], [0.015, 0.064], [0.011, 0.120], [-0.024, 0.128],
        [-0.086, 0.110], [-0.106, 0.064], [-0.086, 0.016], [-0.026, 0.000]
    ];
    var DRIVER_R = [0.010, 0.060, 0.014, 0.030, 0.040, 0.040, 0.040, 0.020];
    var D_SOLE = 0.080, D_SOLE_H = 0.026, D_FACE = 0.000;
    var D_CX = -0.046, D_CZ = 0.064;
    // How far ahead of the shaft the face stands — a driver's face progression.
    var D_AHEAD = 0.008;

    /* The skin: one material for the whole shell, painted in the shader
       from the head's own coordinates — carbon crown, the white frame along
       the face and down the heel, the blue ring round the back of the skirt
       and its hairline round the crown's edge, and the grey sole.

       It was a material per triangle first, and every boundary came out as
       a saw blade: the shell's triangles are long slivers by the time a
       sphere has been pushed into a driver, and an edge can only be as
       clean as the triangles it is cut along. Painted per pixel, an edge is
       a curve. `lat` is the sphere's own latitude before it was moved, so a
       band measured in it runs along the shell's rows however tall the
       crown is at that point — which is what keeps the ring level.

       The panel is the SIM2's: everything on the crown more than a thumb's
       width back from the face and in from the heel is carbon, and the
       frame round it is white, narrowing to nothing as it runs back along
       the heel. Toe and tail are carbon to the edge, with the blue line. */
    function driverSkin(L) {
        var m = new THREE.MeshStandardMaterial({
            map: carbonTexture(), metalness: 0.2, roughness: 0.2,
            envMap: studioRadiance(), envMapIntensity: ENV_LIGHT * 0.95
        });
        var uni = {
            uWhite: { value: ink(0xeef1f4) },
            uRing: { value: ink(L ? L.metal : 0x1f6fff) },
            uSole: { value: ink(0x3a424c) }
        };
        function f(n) { return n.toFixed(4); }
        m.onBeforeCompile = function (sh) {
            Object.keys(uni).forEach(function (k) { sh.uniforms[k] = uni[k]; });
            sh.vertexShader = 'attribute float lat;\nvarying float vLat;\nvarying vec3 vLocal;\n' +
                sh.vertexShader.replace('#include <begin_vertex>',
                    '#include <begin_vertex>\n\tvLat = lat;\n\tvLocal = position;');
            sh.fragmentShader = 'uniform vec3 uWhite;\nuniform vec3 uRing;\nuniform vec3 uSole;\n' +
                'varying float vLat;\nvarying vec3 vLocal;\n' +
                sh.fragmentShader.replace('#include <metalnessmap_fragment>', [
                    '#include <metalnessmap_fragment>',
                    '\tfloat dAA = 0.0006;',
                    '\tfloat dZ = (vLocal.z - ' + f(D_CZ) + ') / 0.064;',
                    '\tfloat dFront = ' + f(D_FACE - 0.014) + ' - 0.004 * dZ * dZ;',
                    '\tfloat dHeel = mix(0.028, -0.03, smoothstep(-0.035, -0.085, vLocal.x));',
                    '\tfloat dPanel = smoothstep(-dAA, dAA, dFront - vLocal.x) * smoothstep(-dAA, dAA, vLocal.z - dHeel);',
                    '\tfloat dCrown = 1.0 - smoothstep(-0.002, 0.002, vLat);',
                    '\tfloat dFace = smoothstep(' + f(D_FACE - 0.0012) + ', ' + f(D_FACE - 0.0004) + ', vLocal.x);',
                    '\tfloat dEdge = dCrown * smoothstep(-0.125, -0.112, vLat) * dPanel *',
                    '\t\tsmoothstep(' + f(D_FACE - 0.020) + ', ' + f(D_FACE - 0.028) + ', vLocal.x);',
                    '\tfloat dRing = (1.0 - dCrown) * (1.0 - smoothstep(0.085, 0.095, vLat)) *',
                    '\t\tsmoothstep(-0.024, -0.034, vLocal.x);',
                    '\tfloat dBlue = max(dEdge, dRing);',
                    '\tfloat dWhite = max(dCrown * (1.0 - dPanel), dFace);',
                    '\tvec3 dCol = mix(uSole, diffuseColor.rgb, dCrown);',
                    '\tdCol = mix(dCol, uWhite, dWhite);',
                    '\tdiffuseColor.rgb = mix(dCol, uRing, dBlue);',
                    '\troughnessFactor = mix(mix(mix(0.40, roughnessFactor, dCrown), 0.32, dWhite), 0.26, dBlue);',
                    '\tmetalnessFactor = mix(mix(mix(0.80, metalnessFactor, dCrown), 0.0, dWhite), 0.55, dBlue);'
                ].join('\n'));
        };
        m.customProgramCacheKey = function () { return 'loft-driver-skin'; };
        return m;
    }

    /* How tall the crown stands over the head's waist at (x, z): low at the
       face, rising to its crest about a quarter of the way back, and easing
       off toward the tail — the profile every modern driver shares and the
       one an egg cannot do. */
    function driverCrown(x, z) {
        var nx = Math.max(0, Math.min(1, (D_FACE - x) / 0.112));
        var nz = (z - D_CZ) / 0.066;
        var g = nx < 0.28 ? smooth01(nx / 0.28) : 1 - 0.55 * smooth01((nx - 0.28) / 0.72);
        return 0.030 + 0.008 * g * Math.max(0, 1 - 0.55 * nz * nz);
    }
    function smooth01(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

    /* The shell: a sphere whose every vertex is moved onto the shape above.
       Its direction round the vertical picks a radius off the outline, and
       its height up or down picks a point on a superellipse — rounder over
       the crown, squarer over the sole — so the sides stand up like a club's
       and do not taper like a pebble's. Then the front is sliced flat for
       the face, which is how a face gets the outline a real one has: the
       shape the head's own front happens to make, rounder at the toe than
       the heel and flatter along the sole. An extruded outline cannot do the
       crown at all: its cap is one flat fan of triangles with nothing inside
       it to dome. */
    function driverShell() {
        var ring = roundPoly(DRIVER_FOOT, DRIVER_R).getSpacedPoints(360);
        var table = ring.map(function (p) {
            var dx = p.x - D_CX, dz = p.y - D_CZ;
            return { a: Math.atan2(dz, dx), r: Math.sqrt(dx * dx + dz * dz) };
        }).sort(function (u, w) { return u.a - w.a; });
        function radiusAt(a) {
            var n = table.length;
            for (var i = 0; i < n; i++) {
                var lo = table[(i + n - 1) % n], hi = table[i];
                var la = i === 0 ? lo.a - 2 * Math.PI : lo.a;
                if (a >= la && a <= hi.a) {
                    var t = (a - la) / ((hi.a - la) || 1);
                    return lo.r + (hi.r - lo.r) * t;
                }
            }
            return table[0].r;
        }
        /* Dense, because the materials are chosen a triangle at a time and
           the edge of the carbon panel is only as clean as the mesh under it. */
        var geo = new THREE.SphereGeometry(1, 128, 72).toNonIndexed();
        var pos = geo.attributes.position;
        var lat = new Float32Array(pos.count);
        var waist = D_SOLE - D_SOLE_H;
        for (var i = 0; i < pos.count; i++) {
            var ux = pos.getX(i), uy = pos.getY(i), uz = pos.getZ(i);
            lat[i] = uy;
            var s = Math.sqrt(ux * ux + uz * uz);
            var phi = Math.atan2(uz, ux);
            var crown = uy < 0;                      // sphere +y is our sole
            var R = radiusAt(phi);
            /* Squarer toward the front, so that the slice for the face cuts
               nearly the head's whole height: a face is about half as tall
               as the head is wide, and a profile as round at the front as it
               is at the tail gave a letterbox. */
            var front = smooth01((D_CX + Math.cos(phi) * R - (D_FACE - 0.034)) / 0.034);
            var pw = crown ? 2.4 + 3.2 * front : 5.0 + 2.0 * front;
            var rr = Math.pow(s, 2 / pw);
            var yy = Math.pow(Math.abs(uy), 2 / pw);
            var x = D_CX + Math.cos(phi) * R * rr, z = D_CZ + Math.sin(phi) * R * rr;
            var y = crown ? waist - yy * driverCrown(x, z) : waist + yy * D_SOLE_H;
            pos.setXYZ(i, Math.min(x, D_FACE), y, z);
        }
        creased(geo, 34);

        /* Top-down UVs, in units of one weave tile: the only thing that
           reads them is the crown's carbon, and from above is how a crown is
           seen. */
        var uv = new Float32Array(pos.count * 2);
        for (var j = 0; j < pos.count; j++) {
            uv[j * 2] = pos.getZ(j) / 0.012;
            uv[j * 2 + 1] = pos.getX(j) / 0.012;
        }
        geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        geo.setAttribute('lat', new THREE.BufferAttribute(lat, 1));
        return geo;
    }

    /* The face, as a D inside the slice. Measured off the shell rather than
       written down — the slice is wherever the head's front happens to be —
       and then drawn the way a SIM2's face sits in its frame: a long, nearly
       straight top edge under a wide band of white, a big round toe that
       runs almost to the edge, a sole edge that curves up toward the heel,
       and the white widening again round the heel where it climbs into the
       neck. Drawn as (-z, y), so turning it to face +x puts the toe at +z. */
    function driverFaceShape(shell) {
        var pos = shell.attributes.position;
        var z0 = 1, z1 = -1, y0 = 1, y1 = -1;
        for (var i = 0; i < pos.count; i++) {
            if (pos.getX(i) < D_FACE - 1e-6) continue;
            z0 = Math.min(z0, pos.getZ(i)); z1 = Math.max(z1, pos.getZ(i));
            y0 = Math.min(y0, pos.getY(i)); y1 = Math.max(y1, pos.getY(i));
        }
        var h = y1 - y0;
        return roundPoly([
            [-(z0 + 0.013), y0 + 0.21 * h],      // heel, under the frame
            [-(z1 - 0.005), y0 + 0.13 * h],      // toe, top
            [-(z1 - 0.002), y1 - 0.004],         // toe, bottom
            [-(z0 + 0.020), y1 - 0.002],         // heel, bottom
            [-(z0 + 0.009), y0 + 0.55 * h]       // heel, middle
        ], [0.012, 0.030, 0.026, 0.024, 0.016]);
    }

    function buildDriver(g, M) {
        /* The body stands ahead of the shaft, the way a driver's face sits in
           front of the line of its hosel; the neck and sleeve stay on the
           shaft's own axis. */
        var body = new THREE.Group();
        body.position.x = D_AHEAD;
        g.add(body);

        var shell = driverShell();
        body.add(new THREE.Mesh(shell, M.skin));

        var face = facePlate(driverFaceShape(shell), 1);
        face.rotateY(Math.PI / 2);
        face.translate(D_FACE + 0.0003, 0, 0);
        body.add(new THREE.Mesh(face, M.grooves));

        /* The sole, which in the bag is the side that faces the sky — so it
           is where most of the detail goes. A keel running back to a weight
           at the tail (SIM2's "inertia generator"), a speed slot across the
           front, and two stripes of the club's colour either side of the
           keel. */
        body.add(new THREE.Mesh(upward(roundPoly([
            [-0.032, 0.052], [-0.032, 0.076], [-0.096, 0.070], [-0.096, 0.058]
        ], [0.004, 0.004, 0.006, 0.006]), 0.0075, 0.0013, D_SOLE + 0.0045), M.head));
        body.add(rod(M.chrome, v3(-0.092, D_SOLE + 0.0005, 0.064), v3(-0.092, D_SOLE + 0.0068, 0.064),
            0.0088, 0.0088, 24));
        body.add(rod(M.insert, v3(-0.092, D_SOLE + 0.004, 0.064), v3(-0.092, D_SOLE + 0.0072, 0.064),
            0.0038, 0.0038, 6));
        var slot = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.003, 0.070), M.insert);
        slot.position.set(D_FACE - 0.007, D_SOLE - 0.0006, 0.064);
        body.add(slot);
        [0.044, 0.084].forEach(function (z) {
            var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.0016, 0.0035), M.paint);
            stripe.position.set(-0.056, D_SOLE + 0.0002, z);
            stripe.rotation.y = z < 0.064 ? 0.16 : -0.16;
            body.add(stripe);
        });

        // The maker's mark on the crown, sat on the dome rather than
        // floating at a guessed height: a small white disc on the carbon.
        var ax = -0.034, az = 0.066;
        body.add(rod(M.white, v3(ax, D_SOLE - D_SOLE_H - driverCrown(ax, az) + 0.0006, az),
            v3(ax, D_SOLE - D_SOLE_H - driverCrown(ax, az) - 0.0004, az), 0.0026, 0.0026, 16));

        /* The neck is white and runs up out of the white frame on the heel;
           over it, the black adjustable sleeve with the white index band
           every adjustable driver has. */
        g.add(rod(M.white, v3(0.000, 0.012, 0.0095), v3(0.003, 0.050, 0.016), 0.0080, 0.0105));
        g.add(rod(M.insert, v3(0, -0.003, 0.0092), v3(0.0005, 0.0135, 0.0098), 0.0084, 0.0086));
        g.add(rod(M.white, v3(0, 0.0045, 0.0094), v3(0, 0.0060, 0.0095), 0.0088, 0.0088));
    }

    /* ── irons and wedges ───────────────────────────────────────────────── */

    /* One family, four members. Lengths in metres: `len` heel to toe, `heel`
       and `toe` the blade's height at each end, `neck` how much hosel stands
       above the blade, `sole` the sole's width front to back, `cavity` a
       perimeter-weighted back (else a muscle), `drop` a teardrop topline that
       climbs to a high toe, and `bounce` how far the trailing edge of the
       sole hangs below the leading one, per metre of sole. */
    var IRONS = {
        iron:    { len: 0.078, heel: 0.033, toe: 0.050, neck: 0.036, sole: 0.019, cavity: true },
        chipper: { len: 0.075, heel: 0.036, toe: 0.054, neck: 0.040, sole: 0.022, cavity: true },
        wedge:   { len: 0.080, heel: 0.035, toe: 0.059, neck: 0.044, sole: 0.026, drop: true, bounce: 0.14 },
        checker: { len: 0.078, heel: 0.035, toe: 0.056, neck: 0.042, sole: 0.024, drop: true, bounce: 0.08 }
    };

    function bladeOutline(p, S) {
        if (p.drop) {
            return roundPoly([
                [0.001, S - p.heel], [p.len * 0.55, S - p.heel - 0.009],
                [p.len - 0.004, S - p.toe + 0.004], [p.len, S - p.toe * 0.42],
                [p.len - 0.016, S], [0.006, S], [-0.002, S - 0.013]
            ], [0.004, 0.030, 0.022, 0.022, 0.014, 0.007, 0.004]);
        }
        return roundPoly([
            [0.001, S - p.heel], [p.len - 0.015, S - p.toe],
            [p.len, S - p.toe + 0.021], [p.len - 0.010, S],
            [0.006, S], [-0.002, S - 0.013]
        ], [0.004, 0.016, 0.014, 0.010, 0.007, 0.004]);
    }

    function buildIron(g, M, club) {
        var p = IRONS[club.id] || IRONS.iron;
        var S = p.neck + p.heel;            // where the sole is
        var FACE = 0.0032, B = 0.0009;

        var outline = bladeOutline(p, S);
        g.add(new THREE.Mesh(backward(outline, FACE - 2 * B, B, 0), M.head));

        if (p.cavity) {
            /* The perimeter: the blade's own outline with the cavity cut out
               of it, standing proud of the back of the face — a thick
               topline, a heavy toe and the weight low and wide. */
            var rim = bladeOutline(p, S);
            rim.holes.push(roundPoly([
                [0.011, S - p.heel + 0.0065], [p.len - 0.021, S - p.toe + 0.0075],
                [p.len - 0.0085, S - p.toe + 0.022], [p.len - 0.017, S - 0.0135],
                [0.012, S - 0.011]
            ], [0.004, 0.011, 0.010, 0.006, 0.005], new THREE.Path()));
            g.add(new THREE.Mesh(backward(rim, 0.0042, 0.0011, -FACE + 0.0004), M.head));

            /* The medallion, after PXG: a dark plate with the club's colour
               standing on it, in the bottom of the cavity where the eye goes
               first. It is what tells a 7 iron from a pitch from behind. */
            var zc = p.len * 0.47, yc = S - 0.0185;
            var slope = (p.toe - p.heel) / p.len;
            function plate(w, h) {
                return roundPoly([
                    [zc - w, yc - h + slope * w], [zc + w, yc - h - slope * w],
                    [zc + w, yc + h - slope * w * 0.4], [zc - w, yc + h + slope * w * 0.4]
                ], Math.min(h, 0.003));
            }
            g.add(new THREE.Mesh(backward(plate(0.019, 0.0062), 0.0008, 0.0006, -FACE + 0.0003), M.insert));
            g.add(new THREE.Mesh(backward(plate(0.0145, 0.0034), 0.0010, 0.0005, -FACE - 0.0008), M.paint));
        } else {
            /* A muscle: the lower half of the back thickened, smooth, with a
               stripe of the club's colour across it. */
            var muscle = roundPoly([
                [0.008, S - p.heel * 0.62], [p.len - 0.022, S - p.toe * 0.50],
                [p.len - 0.0095, S - p.toe * 0.28], [p.len - 0.016, S - 0.003],
                [0.008, S - 0.0025]
            ], [0.004, 0.016, 0.012, 0.006, 0.004]);
            g.add(new THREE.Mesh(backward(muscle, 0.0032, 0.0018, -FACE + 0.0004), M.head));
            var zs = p.len * 0.52, ys = S - p.toe * 0.30;
            var stripe = roundPoly([
                [zs - 0.016, ys - 0.0018], [zs + 0.016, ys - 0.0034],
                [zs + 0.016, ys + 0.0006], [zs - 0.016, ys + 0.0022]
            ], 0.0016);
            g.add(new THREE.Mesh(backward(stripe, 0.0006, 0.0004, -FACE - 0.0067), M.paint));
        }

        /* The sole: a bar along the bottom as wide as the club's sole, its
           trailing edge hung lower than its leading one by the club's bounce
           — the camber a wedge glides on, and the one feature of a wedge a
           golfer looks for first. */
        var sole = backward(roundPoly([
            [0.004, S - 0.011], [p.len - 0.021, S - 0.0145], [p.len - 0.007, S - 0.0095],
            [p.len - 0.012, S], [0.006, S]
        ], [0.003, 0.006, 0.006, 0.008, 0.006]), p.sole - FACE - 0.003, 0.0015, -FACE + 0.0004);
        if (p.bounce) {
            var sp = sole.attributes.position;
            for (var i = 0; i < sp.count; i++) {
                if (sp.getY(i) > S - 0.004) sp.setY(i, sp.getY(i) + p.bounce * Math.max(0, -sp.getX(i) - FACE));
            }
            creased(sole, 40);
        }
        g.add(new THREE.Mesh(sole, M.head));

        // The grooves, on a plate cut to the face's own outline.
        var plateGeo = facePlate(bladeOutline(p, S), p.drop ? 0.88 : 0.84);
        plateGeo.rotateY(-Math.PI / 2);
        plateGeo.translate(0.0004, 0, 0);
        g.add(new THREE.Mesh(plateGeo, M.grooves));

        /* The hosel: long, tapering into the heel, and set a few millimetres
           ahead of the leading edge — offset, which every iron has and which
           is half of what makes one look like an iron rather than a hatchet. */
        g.add(rod(M.head, v3(-0.0022, -0.002, 0.0005), v3(-0.0030, S - p.heel + 0.010, 0.0025),
            0.0068, 0.0090));
    }

    /* ── putters ────────────────────────────────────────────────────────── */

    /* The Anser: a face block, a low flange behind it, a weight standing at
       heel and toe, a sight line on the flange, and a plumber's neck — down
       off the shaft, across, and down again into the heel. */
    function buildBlade(g, M) {
        var S = 0.056, H = 0.023, top = S - H;
        g.add(new THREE.Mesh(upward(roundPoly([
            [-0.0055, -0.0045], [-0.0055, 0.0945], [-0.0115, 0.0945], [-0.0115, -0.0045]
        ], [0.002, 0.002, 0.003, 0.003]), H, 0.0015, S), M.head));
        g.add(new THREE.Mesh(upward(roundPoly([
            [-0.010, -0.002], [-0.010, 0.092], [-0.032, 0.089], [-0.032, 0.001]
        ], [0.002, 0.002, 0.010, 0.010]), 0.0080, 0.0015, S), M.head));
        [[-0.004, 0.011], [0.079, 0.093]].forEach(function (zz) {
            g.add(new THREE.Mesh(upward(roundPoly([
                [-0.010, zz[0]], [-0.010, zz[1]], [-0.029, zz[1] - 0.002], [-0.029, zz[0] + 0.002]
            ], [0.002, 0.002, 0.006, 0.006]), 0.019, 0.0018, S), M.head));
        });
        var sight = new THREE.Mesh(new THREE.BoxGeometry(0.017, 0.0010, 0.0024), M.paint);
        sight.position.set(-0.021, S - 0.0080 - 0.0002, 0.045);
        g.add(sight);
        var dot = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.0008, 0.0018), M.paint);
        dot.position.set(-0.0085, top - 0.0002, 0.045);
        g.add(dot);

        var face = facePlate(roundPoly([
            [0.000, top + 0.0025], [0.090, top + 0.0025], [0.090, S - 0.0025], [0.000, S - 0.0025]
        ], 0.0025), 1);
        face.rotateY(-Math.PI / 2);
        face.translate(-0.0038, 0, 0);
        g.add(new THREE.Mesh(face, M.grooves));

        var knee = top - 0.012;
        g.add(rod(M.head, v3(0, -0.003, 0), v3(0, knee, 0), 0.0058, 0.0060));
        g.add(rod(M.head, v3(0, knee, 0), v3(-0.0055, knee, 0.015), 0.0056, 0.0056));
        g.add(rod(M.head, v3(-0.0055, knee, 0.015), v3(-0.0080, top + 0.001, 0.016), 0.0052, 0.0060));
        [v3(0, knee, 0), v3(-0.0055, knee, 0.015)].forEach(function (at) {
            var elbow = new THREE.Mesh(new THREE.SphereGeometry(0.0058, 14, 10), M.head);
            elbow.position.copy(at);
            g.add(elbow);
        });
    }

    /* The two-ball: a half-moon mallet with two white discs on its back,
       lined up behind the ball — the alignment aid the design is named for,
       and why it reads as itself at any size. The club's colour runs along
       the top of the face, and the face is a dark insert. */
    function buildMallet(g, M) {
        var S = 0.056, H = 0.024, top = S - H;
        g.add(new THREE.Mesh(upward(roundPoly([
            [-0.004, -0.004], [-0.004, 0.100], [-0.030, 0.102], [-0.070, 0.084],
            [-0.076, 0.048], [-0.070, 0.012], [-0.030, -0.006]
        ], [0.004, 0.004, 0.020, 0.022, 0.030, 0.022, 0.020]), H, 0.003, S), M.head));
        [-0.030, -0.057].forEach(function (x) {
            g.add(rod(M.insert, v3(x, top + 0.0004, 0.048), v3(x, top - 0.0008, 0.048), 0.0122, 0.0122, 32));
            g.add(rod(M.white, v3(x, top + 0.0002, 0.048), v3(x, top - 0.0016, 0.048), 0.0104, 0.0104, 32));
        });
        var band = new THREE.Mesh(new THREE.BoxGeometry(0.0045, 0.0012, 0.084), M.paint);
        band.position.set(-0.0105, top - 0.0003, 0.048);
        g.add(band);
        var insert = new THREE.Mesh(new THREE.BoxGeometry(0.0018, H - 0.009, 0.086), M.insert);
        insert.position.set(-0.004 + 0.0030 + 0.0006, S - H / 2, 0.048);
        g.add(insert);
        // A slant neck: one straight bend from the shaft into the heel.
        g.add(rod(M.head, v3(0, -0.003, 0), v3(-0.006, top + 0.002, 0.013), 0.0058, 0.0064));
    }

    function buildHead(club, M) {
        var g = new THREE.Group();
        if (club.id === 'driver') buildDriver(g, M);
        else if (club.id === 'putter') buildBlade(g, M);
        else if (club.id === 'mallet') buildMallet(g, M);
        else buildIron(g, M, club);
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
        var bandText = held ? 'IN HAND' : 'KEY ' + club.key;
        if (club.bite) bandText += ' \u00b7 BITE ' + Math.round(club.bite * 100) + '%';
        g.fillText(bandText, W / 2, 4 + BAND_H / 2);

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

    /* Side by side, for a card standing in a row: carry & loft on the left,
       total distance, power & bite on the right. */
    function sideBySideFigures(g, W, H, rule, deg, club, frac, tint) {
        var top = rule + 22;
        var x2 = Math.round(W * 0.54);
        var carryStr = club.carry ? String(club.carry) : '\u2014';
        var totalStr = club.total ? String(club.total) : String(club.power);

        g.fillStyle = 'rgba(159, 182, 201, 0.9)';
        g.font = '700 15px ' + FACE;
        g.fillText('CARRY \u00b7 ' + deg + '\u00b0', 28, top);
        g.fillText('TOTAL \u00b7 PWR ' + club.power, x2, top);

        g.fillStyle = '#eaf6ff';
        g.font = '700 34px ' + FIGS;
        g.fillText(carryStr, 28, top + 34);
        g.fillText(totalStr, x2, top + 34);

        if (club.bite) {
            roundRect(g, W - 116, top + 42, 88, 22, 6);
            g.fillStyle = 'rgba(20, 184, 166, 0.25)';
            g.fill();
            g.strokeStyle = '#5eead4';
            g.lineWidth = 1.5;
            g.stroke();
            g.fillStyle = '#5eead4';
            g.font = '800 12px ' + FACE;
            g.textAlign = 'center';
            g.fillText('BITE ' + Math.round(club.bite * 100) + '%', W - 72, top + 53);
            g.textAlign = 'left';
        } else {
            drawPower(g, x2, top + 56, W - 28 - x2, 11, frac, tint.name);
        }
        drawLoft(g, 126, top + 44, deg, tint.name);
    }

    /* Stacked, for a card in a grid: carry and loft on line one, total
       distance and power/bite on line two. */
    function stackedFigures(g, W, H, rule, deg, club, frac, tint) {
        var mid = rule + 56;                 // the carry line
        var low = H - 30;                    // …and the total line
        var carryStr = club.carry ? String(club.carry) : '\u2014';
        var totalStr = club.total ? String(club.total) : String(club.power);

        g.fillStyle = 'rgba(159, 182, 201, 0.9)';
        g.font = '700 16px ' + FACE;
        g.fillText('CARRY \u00b7 ' + deg + '\u00b0', 26, mid - 34);
        g.fillText('TOTAL \u00b7 PWR ' + club.power, 26, low - 34);

        g.fillStyle = '#eaf6ff';
        g.font = '700 46px ' + FIGS;
        g.fillText(carryStr, 26, mid);
        g.fillText(totalStr, 26, low);

        drawLoft(g, W - 108, mid + 10, deg, tint.name);

        if (club.bite) {
            roundRect(g, W - 130, low - 16, 104, 24, 6);
            g.fillStyle = 'rgba(20, 184, 166, 0.25)';
            g.fill();
            g.strokeStyle = '#5eead4';
            g.lineWidth = 1.5;
            g.stroke();
            g.fillStyle = '#5eead4';
            g.font = '800 13px ' + FACE;
            g.textAlign = 'center';
            g.fillText('BITE ' + Math.round(club.bite * 100) + '%', W - 78, low - 4);
            g.textAlign = 'left';
        } else {
            drawPower(g, W - 150, low + 4, 124, 14, frac, tint.name);
        }

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
                now: { x: spot.closed.x, y: spot.closed.y, z: spot.closed.z, rz: spot.closed.rz, rx: spot.closed.rx, ry: spot.closed.ry, scale: 1, lift: 0, glow: 0, labelOp: 0, spin: 0 }
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
            /* The clubs stand at OPEN_YAW and hold still in the row — a card
               is not worth reading while it orbits past — with one exception:
               the club under the pointer turns gently on its own axis, which
               is the only way to inspect the face and loft from every side.
               Kept to a calm showcase rate (~16°/s) and tracked per club so
               hovering never causes an accumulated spin jump. Unhovering
               eases the club back to OPEN_YAW via the shortest route. */
            if (under) {
                c.now.spin += dt * 0.28;
                if (c.now.spin > Math.PI) c.now.spin -= 2 * Math.PI;
                else if (c.now.spin < -Math.PI) c.now.spin += 2 * Math.PI;
            } else if (c.now.spin !== 0) {
                c.now.spin = ease1(c.now.spin, 0, ease);
                if (Math.abs(c.now.spin) < 0.001) c.now.spin = 0;
            }
            var turn = c.now.ry + B.open01 * c.now.spin;
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
