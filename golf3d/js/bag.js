/* bag.js — the club picker: where the clubs stand, how they move and what
 * happens when one is clicked.
 *
 * The meshes themselves are next door in bag/models.js; this file is entirely
 * about placing them. Two rigs, because the bag stays where it is while the
 * clubs come out of it: one parked in the corner holding the bag, one that
 * travels holding the clubs.
 *
 * ## Furniture, not course
 *
 * Both rigs ride at fixed offsets in *camera* space, so nothing here ever
 * occludes the hole, has to be played around, or pretends to be something the
 * ball could hit. That is why the bag lives here and not in render.js:
 * render.js draws the world the simulation knows about, this draws a thing the
 * simulation has never heard of.
 *
 * ## Interaction
 *
 * The bag sits low in the corner with half of it below the bottom of the
 * screen — enough to say "your clubs are here" and small enough to ignore.
 * Click it and the clubs come out: they travel to the middle of the view, line
 * up with their heads at eye level, and turn on their own axes so the face can
 * be read from every side. The club under the pointer is named and explained
 * above them — that part is DOM, in game/hud.js, because text belongs in text.
 * Click one to take it and they drop back in the bag. Everything the mouse can
 * do here the number keys can do too.
 *
 * ## The row is measured, not tuned
 *
 * One row of four at a fixed size fits a laptop and runs off both edges of a
 * phone held upright, because the frustum is half as wide as it is tall there.
 * So `fitOpen()` divides instead: the frustum's two half-extents at the depth
 * the clubs come to, against the block's own two half-extents from the layout,
 * scaled to whichever binds. What is left of the screen after the naming panel
 * and the power meter have taken theirs is measured in the DOM and handed over
 * by `setBand()` — how tall a paragraph is at a given font on a given phone is
 * not something the renderer could work out.
 *
 * Depends on config.js and bag/models.js. Called by render.js once a frame.
 */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var M3 = G3.clubModels;

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
        spin: 0,
        // How the open row is arranged, and how big it can be — both read off
        // the shape of the screen, so they are recomputed rather than baked.
        cols: 0,
        openScale: 2,
        openY: -0.26,
        crest: 1.31          // how tall the bag stands with its clubs in it
    };

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
    var COL_ROW = 0.16, COL_GRID = 0.34, ROW = 0.42;
    var HALF_LABEL = 0.16;                 // half a label, and a hair over
    var HEAD_TOP = 0.21;                   // head above the row's own line
    var TAIL_ROW = 0.28, TAIL_GRID = 0.11; // label below it, staggered or not

    var OPEN_DEPTH = 1.3;      // how far in front of the lens the clubs come
    var MAX_OPEN = 2;          // and how big they are allowed to get there

    /* And the corner the shut bag stands in, in the same spirit: how far out
       toward the left edge, and how far its tallest head crests above whatever
       the shot controls are using along the bottom. Fractions of the frame,
       not distances in metres — a fixed offset in camera space is a different
       place on every screen, and the one that tucked the bag into the corner
       of a laptop put it off the side of a phone held upright, where the
       frustum is half as wide but exactly as tall. */
    var BAG_DEPTH = 1.5, BAG_SCALE = 0.52;
    var BAG_EDGE = 0.78;       // 1 would be the left edge itself
    var BAG_CLEAR = 0.16;      // in half-heights, above the controls' top
    /* …and however deep the controls are, the heads crest somewhere between
       these two. A tall monitor makes the meter a thin strip near the bottom,
       and a bag that only had to clear that would sink out of sight. */
    var BAG_LOW = -0.56, BAG_HIGH = -0.30;

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

    /* Where each club sits when the bag is shut: bunched in its mouth, leaning
       back, and each one turned to show its own head. The heads hang out to one
       side of their shafts, so four clubs stood dead straight in a tight bunch
       simply hide behind each other — splaying them is what makes the bag read
       as four clubs. */
    function closedSpot(i, n) {
        var spread = (i - (n - 1) / 2);
        var floor = M3.BAG.floor;          // where a grip rests in its well
        return {
            x: spread * 0.052, y: floor, z: spread * 0.048,
            rz: -0.13 - spread * 0.05, rx: 0.05, ry: spread * 0.55, scale: 1
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
        var scale = Math.min(
            MAX_OPEN,
            halfW * 0.94 / m.halfW,
            halfH * (top - bottom) / 2 / m.halfH
        );
        return {
            cols: cols,
            rows: rows,
            scale: scale,
            y: halfH * (top + bottom) / 2 - m.mid * scale
        };
    }

    /* One row of four, and only something else when one row of four cannot be
       read: the arrangement is halved until it either fits at a usable size or
       there is nothing left to halve. A row is what the clubs are *for* — four
       heads side by side, compared at a glance — so it is what they get
       wherever the screen allows it. */
    function openFit(camera, aspect) {
        var n = B.clubs.length;
        var cols = n, fit;
        for (;;) {
            fit = fitOpen(camera, aspect, cols, Math.ceil(n / cols), n);
            if (fit.scale >= MIN_ROW || cols <= 2) return fit;
            cols = Math.max(2, Math.ceil(cols / 2));
        }
    }

    /* Re-place the clubs for a new arrangement. Only the open half changes —
       the bag itself is the same bag whatever shape the window is. */
    function relayoutOpen(cols) {
        var n = B.clubs.length;
        var rows = Math.ceil(n / cols);
        B.cols = cols;
        B.clubs.forEach(function (c, i) {
            c.spot.open = openSpot(i, cols, rows, n, c.len);
            // Labels are wider than the gap between two clubs, so in a single
            // row alternate ones are dropped further to stagger them into two
            // heights — exactly the pairing that would otherwise collide. In a
            // grid the rows have already done that job.
            var drop = 0.06 + (cols === n ? (i % 2) * 0.17 : 0);
            if (c.label) c.label.position.set(c.labelBase.x, c.labelBase.y - drop, c.labelBase.z);
        });
    }

    function build(scene) {
        var M = M3.materials();
        B.rig = new THREE.Group();
        B.pickables = [];
        B.clubs = [];

        var body = M3.body(M);
        B.rig.add(body.group);
        B.pickables.push(body.hit);

        /* The clubs live in a rig of their own so that opening the bag can
           carry *them* into the middle of the view while the bag itself stays
           where it was. Closed, the two rigs sit on top of each other and the
           clubs are simply in the bag. */
        B.clubRig = new THREE.Group();

        C.CLUBS.forEach(function (club, i) {
            var built = M3.club(club, M3.materials());
            var spot = { closed: closedSpot(i, C.CLUBS.length), open: null };
            var label = M3.label(club);

            built.group.add(label);
            // Centred on the head it belongs to, not guessed at: a driver's
            // body, a blade's toe and a mallet's wings all sit at a different
            // offset from the shaft, so the one fixed x/z this used before was
            // only ever right for one of the four. The box read straight off
            // the head geometry is right for all of them. It hangs just under
            // the head rather than above it, because the open row is cropped
            // to the bottom of the screen and the heads already sit against
            // the "pick a club" panel above. How far below is the
            // arrangement's business (`relayoutOpen`), so only the anchor is
            // kept here.
            built.head.updateMatrixWorld(true);
            var headBox = new THREE.Box3().setFromObject(built.head);
            var headMid = headBox.getCenter(new THREE.Vector3());

            B.clubRig.add(built.group);
            B.pickables.push(built.hit);
            B.clubs.push({
                id: club.id,
                club: club,
                len: built.len,
                group: built.group,
                head: built.head,
                label: label,
                labelBase: { x: headMid.x, y: headBox.min.y, z: headMid.z },
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
            map: M3.haze(), transparent: true, opacity: 0.3, depthWrite: false
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

        // How high the bag stands, from the clubs actually in it: the tallest
        // head, from the well it rests in. A longer club in the config makes
        // the bag sit lower rather than poking out of the top of the corner.
        B.crest = 0;
        B.clubs.forEach(function (c) {
            B.crest = Math.max(B.crest, M3.BAG.floor + c.len);
        });

        // A starting arrangement, so a club has somewhere to be before the
        // first frame has measured the window.
        relayoutOpen(B.clubs.length);

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
        put(B.rig, camera, cx, cy, cz, BAG_SCALE, -0.62, 0.1);

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
                var wantOp = B.expanded ? 1 : 0;
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
        setExpanded: setExpanded,
        setSelected: setSelected,
        setHover: setHover,
        setBand: setBand,
        isExpanded: isExpanded,
        state: B
    };

})(window.G3);
