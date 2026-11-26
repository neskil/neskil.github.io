/* Portals — every hole a world of its own, and every cup a door to the next.

   The fifteen courses in courses.js are places: six holes of one kind of golf
   under one sky. This is the other thing. A *journey* is a string of worlds,
   one hole each, and nothing about one carries into the next — not the
   ground, not the weight of the ball, not the bag. You hole out, the cup opens
   on somewhere else, and you are standing on its tee.

   The idea is Ethan Mollick's Portals (github.com/emollick/ai-portals): an
   endless flight through generated worlds, each ending in a portal on the
   next. Nothing of its code is here — that project flies a camera and this
   one plays golf — but the shape is its shape: a library of worlds nobody
   picks from, a picker that leans towards the ones you have not seen and
   towards a world unlike the one you are in, and a gallery to go back to the
   ones you liked.

   A world is `{ id, title, kind, caption, theme, tier, hole }`:

     id       what the save, the gallery and `?world=` call it
     kind     the shelf it is filed on in the gallery (KINDS below)
     theme    its palette, in THEMES at the bottom of this file and merged
              into G3.THEMES — a world's look is data, like any course's
     tier     1 to 3: how much it asks. A journey climbs.
     hole     an ordinary hole, built by courses.js → build, with one more
              field: `scene`, the name of the set piece worlds.js stands
              round it

   The holes are written with the same vocabulary the courses are
   (G3.authoring) and deliberately not like them. A course hole has a rail
   round it and a lesson in it. A world is open — no rail unless something is
   standing there — hangs over whatever the world is over, and is built round
   one thing that would be too strange to ask for six times. */
(function (G3) {
    'use strict';

    var A = G3.authoring, P = G3.physics;
    var pad = A.pad, wall = A.wall, bank = A.bank, spinner = A.spinner, slider = A.slider,
        sprung = A.sprung, belt = A.belt, pipe = A.pipe, loop = A.loop,
        bumper = A.bumper, post = A.post, circle = A.circle,
        channel = A.channel, mesa = A.mesa, hill = A.hill;
    var TAU = Math.PI * 2;

    // A round pad standing on its own.
    function disc(cx, cz, r, y, kind) {
        var p = pad(cx - r, cz - r, 2 * r, 2 * r, y || 0, kind || 'green');
        p.round = { sw: r, se: r, nw: r, ne: r };
        return p;
    }

    // A deck with its ends rounded right off: an oval, near enough.
    function rounded(cx, cz, w, d, y, kind) {
        var p = pad(cx - w / 2, cz - d / 2, w, d, y || 0, kind || 'fairway'), r = Math.min(w, d) / 2;
        p.round = { sw: r, se: r, nw: r, ne: r };
        return p;
    }

    /* A regular polygon (physics.padRadius, `sides`) standing on its own or,
       with `layer`, laid into another: corner radius `r`, the first corner
       due +x turned by `turn`. */
    function ngon(cx, cz, r, sides, kind, layer, turn) {
        var p = pad(cx - r, cz - r, 2 * r, 2 * r, 0, kind || 'green');
        p.r = r; p.sides = sides; p.turn = turn || 0;
        p.rIn = r * Math.cos(Math.PI / sides);
        if (layer) { p.inlay = true; p.layer = layer; }
        return p;
    }

    // A kerb: a low rail along a segment, for the few edges a world closes.
    function kerb(x0, z0, x1, z1, y, h) {
        var len = Math.hypot(x1 - x0, z1 - z0);
        return bank((x0 + x1) / 2, (z0 + z1) / 2, len, -Math.atan2(z1 - z0, x1 - x0),
            { base: (y || 0) - 0.1, h: h === undefined ? 0.5 : h, t: 0.3 });
    }

    /* A fir the ball cannot roll through. A tree is solid at its trunk
       only (courses.tree), which is right for a broadleaf with its crown up
       out of reach; a fir's lowest skirt of needles hangs less than half a
       unit off the ground and two to three trunks wide, so a ball rolled past
       one went in under the needles and came out the other side (the
       owner's `clip` on The Snow Globe). Under it stand two squares of
       needles, one turned an eighth, as wide across as three quarters of
       that skirt: an octagon the ball meets where it would meet the
       branches. They are kind 'unseen', which nothing draws — the fir is
       the picture. The skirt's radius is render.addTree's own arithmetic
       for this trunk at this spot (treeHash), so it is the skirt drawn. */
    function fir(cx, cz, t, h) {
        var n = Math.sin(cz * 1.7 * 12.9898 + cx * 0.9 * 78.233) * 43758.5453;
        var spire = t / 2 * (2.6 + (n - Math.floor(n)) * 1.1) * 0.82, a = spire * 0.75;
        var out = [A.tree(cx, cz, { t: t, h: h, fir: true })];
        [0, Math.PI / 4].forEach(function (yaw) {
            out.push(wall(cx - a, cz - a, 2 * a, 2 * a, 0.6, { base: -0.1, yaw: yaw, kind: 'unseen' }));
        });
        return out;
    }

    /* Every world is open, calm and unstaked, and its boundary is its own
       extent with room round it: off the edge is off the world, and OOB_Y is
       what ends the shot. `bare` keeps the long game's flowers and herons out
       of places that have no business growing them. */
    /* A sculpted hole's ground (a `ghost` pad carrying a baked `grid`) is
       one surface from edge to edge: fairway, like the strips laid on it,
       since v1.183.0. Nothing is painted on the world any more, so a line
       between fairway and rough would be a change in the roll nobody could
       see. The green round the cup is still a green underfoot. (The forge's
       maps paint theirs since batch 4, and so since batch 5 they have
       rough off a painted fairway: forge.js → holeOf, `rough`.) */
    function world(h) {
        var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, m = 6;
        h.pads.forEach(function (p) {
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x + p.w);
            minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z + p.d);
        });
        // Short holes are played out of the mini bag; a long one says so.
        h.open = true; h.calm = true; h.bare = true; h.mini = !h.long; h.stakes = false;
        h.portal = true;
        /* Every pad is a slab a hand thick, not a column down to anything:
           a hole is laid on a world's ground (backdrop.mjs) and whatever it
           had underneath would stand up out of that ground as a block. A
           `grounded` hole's own stand-in floor is just under the slab
           (its theme's surroundY); the rest hang in the air. A hole placed
           exactly, on something that stands up off its world's floor, says
           how deep its slab has to be to reach that floor (`plinth`). */
        h.pads.forEach(function (p) { if (!p.inlay) { p.hover = true; if (h.plinth) p.deck = h.plinth; } });
        h.fence = { x: minX - m, z: minZ - m, w: maxX - minX + 2 * m, d: maxZ - minZ + 2 * m };
        /* A sculpted hole's grid is all the ground it has: off its edge the
           ball is out at once rather than falling through the world drawn
           round it (physics → `hole.edge`; b4-06, "Ball fell thru world").
           Held a hair inside the last cell, where the grid still answers. */
        h.pads.forEach(function (p) {
            if (!p.ghost || !p.field || !p.field[0] || !p.field[0].grid) return;
            var e = 0.02;
            h.edge = { x0: p.x + e, z0: p.z + e, x1: p.x + p.w - e, z1: p.z + p.d - e };
        });
        return A.build(h);
    }

    /* A forged keep's world things, carried with its ground (tour-ground.js
       → `outs`, `solid`; forge-finish --tour writes them): the cells a ball
       may cross and not stop in, and the trunks it strikes — what forge.js
       → holeOf gives a forged map, so the hole plays as it was rated. */
    function marks(h, G) {
        if (!G) return;
        var sub = { x0: G.x0, z0: G.z0, d: G.d, nx: G.nx, nz: G.nz };
        if (G.outs && G.outs.length) {
            var o = {};
            G.outs.forEach(function (k) { o[k] = 1; });
            h.outGrid = Object.assign({ on: o, n: G.outs.length }, sub);
        }
        if (G.solid && G.solid.length) {
            var s = {};
            G.solid.forEach(function (p) { s[p[0]] = p[1]; });
            h.solidGrid = Object.assign({ h: G.h, on: s, n: G.solid.length }, sub);
        }
    }

    /* A train on a straight track along x: a locomotive and its coaches,
       one wall a car, all running one way at `speed` (signed, units a
       second) round a run `amp` either side of `cx` — so it comes past, is
       gone, and comes past again from the same side, rather than shuttling.
       `at` is how far along the run the engine is at t = 0. Each car is
       the box the ball meets and is drawn by render.js → addTrain. */
    function train(cx, z, d, o) {
        var cars = o.cars || [2.2, 1.8], gap = o.gap === undefined ? 0.12 : o.gap;
        var dir = o.speed < 0 ? -1 : 1, behind = 0, out = [];
        cars.forEach(function (len, i) {
            if (i) behind += cars[i - 1] / 2 + gap + len / 2;
            var w = wall(cx - len / 2, z, len, d, o.h || 0.9, {
                base: -0.1, kind: 'train',
                move: { axis: 'x', run: true, amp: o.amp, speed: o.speed, phase: (o.at || 0) - dir * behind }
            });
            w.car = i ? 'coach' : 'engine'; w.facing = dir; w.livery = o.livery || 0; w.seat = i;
            if (!i && o.track) w.track = o.track;
            out.push(w);
        });
        return out;
    }

    var ROLL = ['putter', 'mallet'];
    var LOFT = ['putter', 'mallet', 'chipper', 'wedge'];

    /* ── the worlds ─────────────────────────────────────────────────────── */

    var WORLDS = [];
    /* Which of Portals' worlds each hole is played inside, and where in it:
       `u` is how far along that world's own flight path the tee stands,
       `scale` its units to one of ours, `lift` and `turn` a nudge up and
       round (backdrop.mjs → anchorFor). */
    var PLACES = {"breakfast": ["breakfast-table", {"u": 0.2, "at": {"x": -82.95, "z": -58.9, "y": 45.3, "yaw": 3.1416, "scale": 1.4}}], "turtle": ["world-turtle", {"reach": 4, "u": 0.02, "at": {"x": -95.58, "z": 148.41, "y": 150, "yaw": 0.6981, "scale": 2.5}}], "gasgiant": ["storm-bands", {"u": 0.44, "scale": 2.2, "ground": false}], "abyss": ["kelp-cathedral", {"u": 0.55, "scale": 2.2}], "carnival": ["carnival-on-the-frozen-river", {"u": 0.72, "scale": 1.8, "lift": 1}], "mushroom": ["spore-rain", {"u": 0.5, "scale": 1.8, "lift": 2}], "orrery": ["long-library", {"u": 0.12, "scale": 1.8}], "stairs": ["stairway-everywhere", {"u": 0.55, "scale": 2.0, "flyLine": false}], "attic": ["the-toppling", {"u": 0.16, "scale": 0.85, "event": {"from": -0.035, "to": 0.09, "secs": 6, "gate": [14.9, 2.4, 1.7], "say": "The dominoes are going over."}}], "threebody": ["airbrush-black-hole", {"u": 0.2, "scale": 1.8, "turn": -0.5, "hide": ["ship"]}], "clouds": ["cloud-armada", {"u": 0.35, "scale": 2.0, "ground": false}], "forge": ["obsidian-forge", {"u": 0.52, "scale": 2.3}], "table": ["breakfast-table", {"press": false, "u": 0.3, "at": {"x": -90, "z": -47, "y": 45, "yaw": 3.1416, "scale": 3.5}}], "nave": ["kelp-cathedral", {"u": 0.3, "at": {"x": 0, "z": 50, "y": -41, "yaw": 3.1416, "scale": 3}}], "rapids": ["paper-boat-rapids", {"u": 0.8, "scale": 1.4, "lift": 0.3}], "railway": ["attic-railway", {"u": 0.6, "at": {"x": -278, "z": 156.8, "y": 6.1, "yaw": 3.1416, "scale": 2.8}, "hide": ["clockwork-cars"]}], "custard": ["islands-in-custard", {"u": 0.5, "scale": 1.3, "lift": 0.9}], "pyramid": ["pyramid-of-khufu", {"u": 0.5, "scale": 2.2, "turn": -0.5}], "drydock": ["moon-in-dry-dock", {"u": 0.18, "scale": 1.8, "lift": 0.8, "event": {"from": 0.42, "to": 0.64, "secs": 10, "sink": true, "look": [0, 98, 0], "say": "The moorings are slipping. The Moon is going back up."}}], "ironriver": ["obsidian-forge", {"u": 0.5, "at": {"x": -45, "z": 2.5, "y": 0, "yaw": 0, "scale": 2.5}}], "maelstrom": ["maelstrom-descent", {"u": 0.5, "at": {"x": 139.7, "z": -52.06, "y": -25.63, "yaw": 0.3713, "scale": 1.8}}], "globe": ["shaken-globe", {"u": 0.5, "at": {"x": 0, "z": 24, "y": 0, "yaw": 3.1416, "scale": 1.5}}], "pins": ["country-of-pins", {"u": 0.5, "scale": 1.8}], "savanna": ["storm-savanna", {"reach": 2.5, "u": 0.35, "at": {"x": -35.17, "z": 408.21, "y": -3.29, "yaw": 2.142, "scale": 3}}], "fire": ["the-fire-comes-round", {"reach": 2.5, "u": 0.65, "at": {"x": -980.51, "z": 552.84, "y": 1.47, "yaw": -1.8326, "scale": 3}}], "popup": ["paper-kingdom", {"reach": 2.5, "u": 0.35, "at": {"x": 299.3, "z": 190.32, "y": 1.23, "yaw": -1.1232, "scale": 3}}]};
    function add(w) {
        w.hole.scene = w.scene || w.id; w.hole.worldId = w.id; w.hole.theme = w.theme;
        var q = PLACES[w.id];
        if (q) { w.place = { world: q[0] };
            if (q[1]) for (var k in q[1]) w.place[k] = q[1][k]; w.hole.place = w.place; }
        w.hole.inWorld = w.world;
        WORLDS.push(w);
    }

    /* Breakfast, at the size of a crumb. The table stops, the placemat is
       three and a half units off across nothing, and the butter knife
       somebody left on the edge is a ramp. Up it with most of a mallet and
       the ball flies the gap; the teaspoon lying across is the other way,
       a plank a ball wide. Sugar cubes on the mat. */
    add({
        id: 'breakfast', title: 'The Butter Knife', world: 'Breakfast Kingdom', kind: 'home', tier: 1,
        caption: 'A table the size of a county. Up the butter knife and over the edge, or across the teaspoon.',
        theme: 'breakfast',
        hole: world({
            name: 'The Butter Knife', par: 3, bag: ROLL,
            blurb: 'Up the butter knife and fly the gap to the placemat — or walk the teaspoon, a ball wide.',
            pads: [
                pad(0, 0, 9, 8, 0, 'wood'),
                pad(3, 8, 3, 3.5, 0, 'wood', 0, 0.2),
                pad(7.3, 8, 1.0, 7, 0, 'wood'),
                pad(0.5, 15, 8, 7.5, 0, 'green')
            ],
            extra: [
                wall(4.4, 18.2, 0.9, 0.9, 0.8, { base: -0.1, kind: 'meteor' }),
                wall(2.6, 19.6, 0.9, 0.9, 0.8, { base: -0.1, kind: 'meteor' }),
                kerb(0.5, 22.5, 8.5, 22.5), kerb(0.5, 15, 0.5, 22.5), kerb(8.5, 15, 8.5, 22.5),
                kerb(0, 0, 9, 0), kerb(0, 0, 0, 8), kerb(9, 0, 9, 8)
            ],
            tee: { x: 4.5, z: 2 }, cup: { x: 3.4, z: 21 }
        })
    });

    /* Sculpted to its world, and the first of the tour that is. The ground
       here is not drawn by anybody: it is the country on the turtle's back
       itself — a headland on the south coast of the shell-world, sampled
       through that world's own geometry and baked (tour-ground.js, the two
       tools beside it). The tee is on the crown of the headland, thirteen
       units over the sea. The fairway falls away down its spine and the
       green is round to the right on the next plateau, with the sea left of
       everything and long of the green.

       The spine was a dip and a ridge as the world has them until v1.158.0,
       and the dip was where every ball finished, in a fold nothing in the
       bag got out of cleanly (the owner: "hard with all the hills, and weird
       geometry between the hills that you get stuck on"). The line of play
       is groomed now (tools/groom-ground.mjs): the folds are rolled out of
       it and the dip is filled to a long easy fall, and because the world's
       ground is pressed to the bake (backdrop.mjs → sculpt, `reach`) it is
       rolled out of the picture as well. Off the line it is the turtle's.

       So the ball rolls on the world's own hills, and with the world on
       screen its ground is the world's ground: the `ghost` pad and sea are
       drawn only when the world is not, and what is laid over the country is
       a tee, two strips of mown fairway and a green. */
    add({
        id: 'turtle', title: 'Across the Shell', world: 'The World Turtle', kind: 'bizarre', tier: 2,
        caption: 'A par four on a headland of the country on a turtle\'s back. The hills are the world\'s own.',
        theme: 'turtle',
        hole: (function () {
            var G = (G3.TOUR_GROUND || {}).turtle, field = G ? [{ grid: G }] : [];
            function on(p, inlay) { p.field = field; if (inlay) p.inlay = true; return p; }
            var ground = on(pad(-6, -4, 52, 70, 0, 'fairway'));
            ground.ghost = true;
            var sea = A.rect(-30, -30, 100, 120, 0.15);
            sea.ghost = true;
            return world({
                name: 'Across the Shell', par: 4, long: true,
                blurb: 'Off the crown of the headland and down its spine, which has been mown and rolled. The green is round to the right at the far end — and the sea is left of all of it.',
                pads: [
                    ground,
                    on(pad(6, 1, 8, 30, 0, 'fairway'), true),
                    on(pad(5, 31, 10, 12, 0, 'fairway'), true),
                    on(pad(15, 43, 13.5, 9, 0, 'fairway'), true),
                    on(pad(28.5, 50, 9, 9, 0, 'green'), true)
                ],
                water: [sea],
                tee: { x: 10, z: 4 }, cup: { x: 33, z: 54.5 }
            });
        })()
    });

    /* Light gravity (0.7, the one low weight), over the bands of a gas giant, and three balloons to
       stand on. Each of the first two has a pad in it: the floor throws the
       ball and at this weight it stays thrown for two seconds. The second
       balloon's pad is off to one side — land beside it and take two more,
       or come down on it still running and be thrown on to the third.
       The chipper is in the bag (the owner, v1.195.0): at this weight a
       pitch hangs long enough to be a choice, not a shortcut. */
    add({
        id: 'gasgiant', title: 'Balloon Hop', world: 'Living Balloons over a Gas Giant', kind: 'alien', tier: 2,
        caption: 'Light gravity, three balloons and nothing under them for a thousand miles.',
        theme: 'gasgiant',
        hole: world({
            name: 'Balloon Hop', par: 3, bag: ['putter', 'mallet', 'chipper'], gravity: 0.7,
            blurb: 'The pads throw the ball and at this weight it stays thrown. Balloon to balloon — or both hops in one.',
            pads: [
                disc(4, 3.2, 3.2), sprung(4, 5.4, 0.9, 10.7),
                disc(4, 17, 5), sprung(6.4, 18.8, 1.1, 10.7),
                (function () {
                    var p = disc(10, 30, 4.6);
                    p.bumps = [channel(10, 30, 4.2, 2.2, 0.6)];
                    return p;
                })()
            ],
            extra: A.arc(4, 17, 4.8, 0.12 * Math.PI, 0.88 * Math.PI, { drawn: 'rail', h: 0.7 })
                .concat(A.arc(10, 30, 4.45, -0.15 * Math.PI, 0.95 * Math.PI, { drawn: 'rail', h: 0.9 })),
            tee: { x: 4, z: 1.6 }, cup: { x: 10, z: 30 }
        })
    });

    /* The sea floor, and the water is moving. Between the tee and the flag
       are two currents running opposite ways across the line, with a bank of
       slack water between them: the first sets east, the second sets back
       west. A current does not stop a ball, it carries it — sideways, for as
       long as the ball is in it — so a putt across one is aimed upstream of
       where it is meant to land, and the slower it is struck the further
       upstream that has to be.

       The safe hole is three putts: over the first current to the slack, over
       the second to the green, and in. The bold one is a single putt through
       both, which bends east and then back west round the clump of weed
       standing on the slack exactly where the straight line goes. A ball that
       dies in a current is taken to the pocket of sand at its end.

       It was a race round a walled bank until v1.158.0, with a gap in the
       weed to step off through. The sand the race was made of took the
       ball's own pace in a yard, so nothing could be steered off it (the
       owner: "impossible with the mallet"), and the chipper went straight
       over the weed ("too easy with pitch"). So the currents are slick now,
       the bag is the two putters, and there is nothing to pitch over. */
    add({
        id: 'abyss', title: 'Slack Water', world: 'Kelp Cathedral', kind: 'ocean', tier: 2,
        caption: 'Two currents across the line, one each way, and a bank of still water between them.',
        theme: 'abyss',
        hole: world({
            name: 'Slack Water', grounded: true, par: 3, bag: ROLL, gravity: 0.7,
            blurb: 'A current carries the ball sideways for as long as it is in it. Aim upstream and stop on the slack — or go through both in one, round the weed.',
            pads: [
                pad(4, 0, 6, 4, 0, 'green'),
                belt(0, 4, 14, 3.4, 2.6, 0, { kind: 'wood' }),
                pad(14, 4, 3, 3.4, 0, 'sand'),
                pad(1.5, 7.4, 11, 2.6, 0, 'green'),
                belt(0, 10, 14, 3.4, -2.6, 0, { kind: 'wood' }),
                pad(-3, 10, 3, 3.4, 0, 'sand'),
                pad(2.5, 13.4, 9, 5, 0, 'green')
            ],
            extra: [
                // the weed on the slack, on the straight line
                bumper(7, 8.7, 0.55),
                // the tee bank
                kerb(4, 0, 10, 0), kerb(4, 0, 4, 4), kerb(10, 0, 10, 4),
                // the first current's near side, and its pocket
                kerb(0, 4, 4, 4), kerb(10, 4, 17, 4), kerb(0, 4, 0, 7.4), kerb(17, 4, 17, 7.4), kerb(12.5, 7.4, 17, 7.4),
                kerb(0, 7.4, 1.5, 7.4),
                // the ends of the slack
                kerb(1.5, 7.4, 1.5, 10), kerb(12.5, 7.4, 12.5, 10),
                // the second current's far side, and its pocket
                kerb(-3, 10, 1.5, 10), kerb(-3, 10, -3, 13.4), kerb(-3, 13.4, 2.5, 13.4), kerb(14, 10, 14, 13.4), kerb(12.5, 10, 14, 10),
                kerb(11.5, 13.4, 14, 13.4),
                // the green
                kerb(2.5, 13.4, 2.5, 18.4), kerb(11.5, 13.4, 11.5, 18.4), kerb(2.5, 18.4, 11.5, 18.4)
            ],
            tee: { x: 7, z: 1.5 }, cup: { x: 7, z: 16.2 }
        })
    });

    /* A fair on a frozen river. The loop is the ride, and what comes out of
       it comes out on to a hexagonal rink: a band of green round the edge,
       ice inside it, and one round rug of green in the middle with the flag
       in it. Ice carries a ball; the green round the boards and the rug are
       what stop it. So the shot is the weight that gets round the loop, and
       anything too firm is caught by the band before it comes back.

       Until v1.187.1 it was a square rink with ice wall to wall, an ice lane
       up to the loop and a bar turning over the rug. A ball short of the loop
       slid all the way back to the tee, and one past the rug went off the
       back boards and back down the lane: "too hard and a bit frustrating".
       The lane is green up to the loop now and ice only after it, the boards
       are lined with green, and the bar is gone.

       v1.194.0 put a bar back, the gentle way (the owner: "some kind of
       spinning thing … not too hard, it's about timing, so the loop should
       get you on line to sink"). The cup is on the loop's exit line now, so
       any weight that gets round drops straight out of it — and the bar
       turning slowly beside that line is the timing. Its hub is off the
       line, so it closes it for a moment each half turn rather than always;
       about six strokes in ten that make the loop find it open. */
    (function () {
        var R = 6.2, cx = 2, cz = 13 + R * Math.cos(Math.PI / 6), band = 1, k, a0, a1, out = [];
        // Round the hexagon, leaving the south side open where the lane comes in.
        for (k = 0; k < 6; k++) {
            a0 = k / 6 * TAU; a1 = (k + 1) / 6 * TAU;
            if (k === 4) continue;
            out.push(kerb(cx + Math.cos(a0) * R, cz + Math.sin(a0) * R, cx + Math.cos(a1) * R, cz + Math.sin(a1) * R));
        }
        out.push(kerb(cx - R / 2, 13, 0, 13), kerb(4, 13, cx + R / 2, 13));
        out.push(kerb(0, 0, 4, 0), kerb(0, 0, 0, 13), kerb(4, 0, 4, 13));
        // The loop puts a straight ball out at x = 2.5 (its foot plus `shift`),
        // and the rug and the cup are on that line.
        var line = 2.5;
        /* The rink is not level (v1.226.2, the owner: "flat"): a rise of ice
           on its west side, so a ball out of the loop is bent off the line
           to the right, more the slower it goes. The cup is right of the
           line on the rug, so only the weight whose bend ends there drops;
           firmer runs past it to the band, softer is turned away early. */
        var HILL = { cx: cx - 3.4, cz: cz + 0.6, r: 4.6, a: 0.6 };
        var CUPX = 3.9;
        var rug = circle(CUPX - 0.3, cz + 0.4, 2.2, 'green');
        rug.layer = 2; rug.bumps = [HILL];
        // The bar on the ice, hung off to the right of that line so only its
        // tip crosses it: shut for about two fifths of each half turn, open
        // for the rest. A hub on the line would shut it every time round.
        out.push(spinner(4.3, 14.9, 3.8, 0.3, { spin: 0.8 }));
        add({
            id: 'carnival', title: 'Loop and Rink', world: 'Carnival on the Frozen River', kind: 'city', tier: 2,
            caption: 'A loop-the-loop on a frozen river that puts the ball on line for the flag, and a slow bar turning across the line on the rink.',
            theme: 'carnival',
            hole: world({
                name: 'Loop and Rink', grounded: true, par: 3, bag: ROLL,
                blurb: 'Hit it straight and the loop puts the ball on line for the flag. The bar on the ice swings across that line — time it, and the ice carries the ball to the cup.',
                pads: [
                    pad(0, 0, 4, 4, 0, 'green'),
                    pad(0, 4, 4, 4, 0, 'wood'),
                    pad(0, 8, 4, 5, 0, 'ice'),
                    (function () { var p = ngon(cx, cz, R, 6, 'green'); p.bumps = [HILL]; return p; })(),
                    (function () { var p = ngon(cx, cz, R - band / Math.cos(Math.PI / 6), 6, 'ice', 1); p.bumps = [HILL]; return p; })(),
                    rug
                ],
                loops: [loop(1.5, 8, 0, 1.1, 1)],
                extra: out,
                tee: { x: 1.5, z: 2 }, cup: { x: CUPX, z: cz + 0.6 }
            })
        });
    })();

    /* A fairy ring. Eight toadstools round the flag with less than a ball
       and a half between any two, so the way in along the floor is a needle —
       and the big flat cap in front of them is a trampoline. Roll over it at
       the right pace and you come down inside the ring. Bumpers in a wood
       fire the ball like bumpers anywhere.

       v1.226.2 (the owner: "Make it a bit harder please and fix the weird
       floating thing"): no ground is found under it in the leaf litter, so
       the disc hung in the air with its edge showing; it stands on a stump
       down into the leaves now (`plinth`). And the flag stands on a crown
       inside the ring (CR in radius, CA high), and the cap is smaller. */
    var CR = 2.6, CA = 0.3;
    add({
        id: 'mushroom', title: 'The Fairy Ring', world: 'Spore Rain', kind: 'wild', tier: 2,
        caption: 'Toadstools in a ring round the flag, and one big cap in front of them that throws.',
        theme: 'mushroom',
        hole: world({
            name: 'The Fairy Ring', grounded: true, plinth: 7, par: 3, bag: ROLL,
            blurb: 'The ring round the flag is a needle to thread, and the flag stands on a crown. The big cap in front of it throws the ball over.',
            pads: [
                (function () {
                    var p = disc(6, 9.5, 9.5); p.round = { sw: 6, se: 6, nw: 9.5, ne: 9.5 };
                    p.bumps = [{ cx: 6, cz: 13.6, r: CR, a: CA }];
                    return p;
                })(),
                sprung(6, 8.2, 0.95, 6.4)
            ],
            extra: (function () {
                var out = [], i, a;
                for (i = 0; i < 8; i++) {
                    a = (i + 0.5) / 8 * TAU;
                    out.push(bumper(6 + Math.sin(a) * 1.75, 13.6 + Math.cos(a) * 1.75, 0.62));
                }
                out.push(post(2.6, 6.2), post(9.4, 6.2), post(1.4, 11.5), post(10.6, 11.5));
                return out;
            })(),
            tee: { x: 6, z: 1.6 }, cup: { x: 6, z: 13.6 }
        })
    });

    /* An orrery: a brass table, one arm hinged at the spindle in the
       middle, and a brass rim round the table to play off. The arm lies to
       the left of the spindle, swings up over the top and down to the
       right, and comes back: on the left it is out of the way, on the right
       it is across the straight line to the flag. So the bold putt is
       straight past the hub while the arm is on its way back over to the
       left, and it is a one. The safe way is out to the right wide of the
       arm's reach, or off the rim — a two either way.

       (A first redraw in the same version had one arm turning right round
       on the spindle. An arm that is a whole diameter crosses any line
       near the middle of the table at almost every angle, so the window for
       getting past it was an instant, not a gap; this swings, and a gap is
       half of every swing.)

       It was three arms at three speeds until v1.160.0, the longest of them
       reaching nearly to the edge of the table, and the hub standing on the
       straight line to the flag: no line was clear of all of them at once,
       the edge of the table was off the world, and the caddie could not
       make it in under two (the owner: "borderline cruel"). */
    add({
        id: 'orrery', title: 'The Orrery', world: 'Library with a Brass Orrery', kind: 'interior', tier: 2,
        caption: 'One brass arm swinging over the spindle and back, a rim to play off, and the flag past the arm.',
        theme: 'orrery',
        hole: world({
            name: 'The Orrery', grounded: true, par: 3, bag: ROLL,
            blurb: 'The arm swings over to the right and back. Putt straight past the hub while it is on the left — or go round wide of it and off the rim.',
            pads: [disc(9, 10, 9.4)],
            extra: (function () {
                var out = [A.flipper(9 - 2.03, 10, 4.4, { rest: 0, arc: Math.PI, speed: 0.9, hinge: 1 }),
                    wall(8.4, 9.4, 1.2, 1.2, 0.9, { base: -0.1, kind: 'meteor' })];
                // the rim: twenty straight lengths round the table's edge
                var n = 20, r = 9.15, k, a0, a1;
                for (k = 0; k < n; k++) {
                    a0 = k / n * TAU; a1 = (k + 1) / n * TAU;
                    out.push(kerb(9 + Math.sin(a0) * r, 10 + Math.cos(a0) * r, 9 + Math.sin(a1) * r, 10 + Math.cos(a1) * r, 0, 0.45));
                }
                return out;
            })(),
            tee: { x: 9, z: 4.8 }, cup: { x: 11.8, z: 15.8 }
        })
    });

    /* Four landings that do not agree which way is up. The tee's has two
       doors in the floor. The right-hand one comes out on a landing whose
       own door is dead ahead, and that one comes out in front of the flag:
       two doors on one putt, if the weight is right for the last of it. The
       left-hand door is the top of the house, and the way down from there is
       the stair. */
    add({
        id: 'stairs', title: 'Three Doors Down', world: 'Stairway Everywhere', kind: 'after', tier: 3,
        caption: 'Four landings, three doors in the floor and one staircase. After M. C. Escher.',
        theme: 'stairs',
        hole: world({
            name: 'Three Doors Down', par: 3, bag: ROLL,
            blurb: 'Two doors in the floor. The right one leads through another to the flag in one putt; the left is the long way down the stairs.',
            pads: [
                pad(0, 0, 7, 7, 0, 'green'),
                pad(12, 0, 6, 7, 2.2, 'green'),
                pad(0, 13, 6, 6, 4, 'green'),
                pad(6, 14.5, 5.5, 3, 4, 'wood', -0.5, 0),
                pad(11.5, 12, 7, 8, 1.25, 'green')
            ],
            warps: [
                pipe(5.7, 5.7, 15, 1.4, 0, 0.5),
                pipe(15, 5.6, 13, 14.5, Math.PI / 4, 0.6),
                pipe(1.4, 5.7, 2, 14.2, Math.PI / 2, 0.5)
            ],
            extra: [
                kerb(0, 0, 7, 0), kerb(0, 0, 0, 7), kerb(7, 0, 7, 7), kerb(0, 7, 7, 7),
                kerb(12, 0, 18, 0, 2.2), kerb(12, 0, 12, 7, 2.2), kerb(18, 0, 18, 7, 2.2), kerb(12, 7, 18, 7, 2.2),
                kerb(0, 13, 6, 13, 4), kerb(0, 13, 0, 19, 4), kerb(0, 19, 6, 19, 4),
                kerb(6, 13, 6, 14.5, 4), kerb(6, 17.5, 6, 19, 4),
                kerb(11.5, 12, 18.5, 12, 1.25),
                kerb(11.5, 17.5, 11.5, 20, 1.25), kerb(11.5, 12, 11.5, 14.5, 1.25)
            ],
            tee: { x: 2.2, z: 1.2 }, cup: { x: 16, z: 17.4 }
        })
    });

    /* A marble run in an attic. Three wooden chutes, each tipping the other
       way and each ending in a drop on to the one below, and a tin tray at
       the bottom with the flag in it. A ball let go at the top will get to
       the tray by itself, and it gets there four and a half metres from the
       flag whatever was done to it — which was the whole hole until v1.157.0,
       and the owner's word for it was "no skill ceiling": every line and
       every weight from the tee finished on the same spot.

       So the first turn has a board across its corner and a hatch in its far
       rail. The board turns a ball that comes down the right-hand side of
       the top chute square along the turn's outside edge, where the turn's
       tilt does not have time to bring it back to the second chute, and it
       goes out through the hatch: three metres of air and down on to the
       tray, running at the flag. Down the left and it is the long way round
       as before. The right line is a tap-in; the right line at the right
       weight is the ace (tools/portal-check.mjs has the window); and the
       edge of the hatch is the attic floor.

       Coming round that turn is also what sets the world's dominoes going
       (PLACES → event). */
    add({
        id: 'attic', title: 'The Marble Run', world: 'Marble Run, Falling Dominoes', kind: 'home', tier: 1,
        caption: 'Three wooden chutes in an attic and a tin tray at the bottom. There is a hatch at the first turn.',
        theme: 'attic',
        hole: world({
            name: 'The Marble Run', grounded: true, par: 3, bag: ['putter', 'chipper', 'wedge'],
            blurb: 'Let it go down the left and the run takes it the long way round to the tray. Firm down the right-hand side and it leaves by the hatch at the first turn, and lands by the flag.',
            pads: [
                pad(0, 0, 3.4, 3.4, 6.6, 'green'),
                pad(3.4, 0.4, 10, 2.6, 6.6, 'wood', -0.2, 0),
                pad(13.4, 0.4, 3, 6.2, 4.2, 'wood', 0.1, -0.15),
                pad(3.4, 4, 10, 2.6, 1.4, 'wood', 0.18, 0),
                pad(0.4, 4, 3, 4, 1.2, 'wood', 0, -0.1),
                pad(0.4, 8, 3, 2.6, 0.75, 'wood', -0.08, 0),
                pad(3.4, 8, 6, 2.6, 0.5, 'wood', -0.08, 0),
                pad(9.4, 6.8, 7, 7, 0, 'green')
            ],
            extra: [
                kerb(0, 0, 3.4, 0, 6.6), kerb(0, 0, 0, 3.4, 6.6), kerb(0, 3.4, 3.4, 3.4, 6.6),
                kerb(3.4, 0.4, 16.4, 0.4, 4.2, 3.0), kerb(3.4, 3, 13.4, 3, 4.6, 2.6),
                kerb(16.4, 0.4, 16.4, 6.6, 3.2, 2.4), kerb(13.4, 6.6, 15.0, 6.6, 3.2, 1.4),
                kerb(13.9, 0.4, 16.4, 2.9, 4.0, 1.6),
                kerb(3.4, 4, 13.4, 4, 1.4, 2.4), kerb(3.4, 6.6, 13.4, 6.6, 1.4, 2.4),
                kerb(0.4, 4, 0.4, 10.6, 0.5, 1.6), kerb(0.4, 4, 3.4, 4, 1.2, 1.0), kerb(0.4, 10.6, 3.4, 10.6, 0.5, 0.9),
                kerb(3.4, 6.6, 3.4, 8, 0.5, 1.5), kerb(13.4, 3, 13.4, 4, 3.2, 2.6),
                kerb(3.4, 8, 9.4, 8, 0.1, 1.0), kerb(3.4, 10.6, 9.4, 10.6, 0.1, 1.0),
                kerb(9.4, 6.8, 16.4, 6.8), kerb(16.4, 6.8, 16.4, 13.8), kerb(9.4, 13.8, 16.4, 13.8),
                kerb(9.4, 6.8, 9.4, 8), kerb(9.4, 10.6, 9.4, 13.8),
                post(12.6, 10.4), post(12.2, 12.4), post(13.0, 8.2)
            ],
            tee: { x: 1.4, z: 1.7 }, cup: { x: 14.2, z: 12.9 }
        })
    });

    /* Three black holes at the corners of a triangle, and the cup at the one
       point between them where they cancel. Any line in is a line past two of
       them. The saddle between a pair is the door; through it square and at
       pace and the third stops you about where the flag is. */
    add({
        id: 'threebody', title: 'The Three-Body Problem', world: 'Airbrushed Black Hole', kind: 'alien', tier: 3,
        caption: 'Three black holes and the one still point between them. That is where the flag is.',
        theme: 'threebody',
        hole: world({
            name: 'The Three-Body Problem', grounded: true, par: 3, bag: ROLL,
            blurb: 'The cup is where three pulls cancel. Come in through the gap between two of them, square, and the third will stop you.',
            pads: [pad(0, 0, 18, 22, 0, 'glass')],
            wells: [
                { x: 5.4, z: 9.4, pull: 15, core: 0.75 },
                { x: 12.6, z: 9.4, pull: 15, core: 0.75 },
                { x: 9, z: 15.6, pull: 15, core: 0.75 }
            ],
            tee: { x: 3.5, z: 2 }, cup: { x: 9, z: 11.5 }
        })
    });

    /* A sunset among a hundred hot-air balloons, and a par five flown from
       deck to deck at seven tenths of a g, where everything carries half as
       far again as it does at home. Two ways across. The long way is three
       easy carries round to the left: a peanut-shaped deck, a long oval,
       then the green's deck, each a full five-iron and each wide enough to
       hold one. The short way is straight down the middle: a driver on to a
       plank barely four wide, and a second driver from it the length of the
       green's deck — two strokes, if both hold. From the plank the oval is a
       short way back to the long way. Short is the sky.

       Until v1.162.3 it was four round decks in a row, each smaller than the
       last, and one way to play it (the owner: "quite nice", but make the
       shapes more interesting, lose a disc, and give it two paths). */
    add({
        id: 'clouds', title: 'Deck to Deck', world: 'The Cloud Armada', kind: 'sky', tier: 3,
        caption: 'A par five across the decks in the sky, at seven tenths of a g: three easy carries round, or two big ones straight.',
        theme: 'clouds',
        hole: world({
            name: 'Deck to Deck', par: 5, long: true, gravity: 0.7,
            blurb: 'Everything flies half as far again up here. Three five-irons round the left, or a driver on to the plank and another at the flag.',
            pads: [
                disc(8, 4, 5.5, 0, 'fairway'),
                A.road({ x: 8, z: 46, w: 4.4, dir: 0, y: -1.5, kind: 'fairway', caps: true }, [['line', 22]]),
                disc(-9, 31, 7.5, 0.6, 'fairway'),
                disc(-13, 40, 6.5, 0.6, 'fairway'),
                rounded(-13, 70, 15, 22, 1.2, 'fairway'),
                rounded(8, 100, 14, 24, 1.8, 'fairway'),
                circle(8, 102, 5, 'green', 1.8)
            ],
            tee: { x: 8, z: 3 }, cup: { x: 8, z: 102 }
        })
    });

    /* The forge, and the last of a journey that gets this far. A conveyor
       runs down the middle of the floor at a hammer that slides across it;
       past the hammer is a launch pad, a low wall, a
       river of iron, and the anvil, a bowl with the flag in it. A ball kept
       on the belt the whole way arrives fast, and if it rolls over the pad
       it is thrown over the wall and the iron and comes down in the bowl:
       all of it on one swing, if the line is right and the hammer is out of
       the way. Off the belt it slows on the floor and stops at the wall, and
       the pad is a short putt away.

       Until v1.161.0 nothing reached the anvil from the tee at all — the belt
       delivered every ball at a crawl a yard short of the pad, and the pad
       only throws a ball up, so the carry was never there — and it was a par
       four the caddie played in two putts. Then, with the belt quicker, its
       walls funnelled every line on to the pad and it was a giveaway. The
       walls are gone and the pad is a hand right of the middle.

       The owner, v1.222.0 (fun 4, difficulty 5, eight strokes and a give-up
       on a par three): "the bounce pad is too small and hard to hit … the
       scale of the map is a bit off, [the world] should be smaller". The pad
       went from 0.4 to 0.75 across its middle (the ace share from the tee
       0.29% → about 0.5%, an opener's), and the world is drawn at 2.3 golf
       units a unit rather than 1.8 (PLACES), so the hall stands round the
       hole rather than over it. */
    add({
        id: 'forge', title: 'The Forge', world: 'Black Glass and Lava', kind: 'bizarre', tier: 3,
        caption: 'A conveyor at a hammer, a launch pad past it, a river of iron and an anvil with the flag in it.',
        theme: 'forge',
        hole: world({
            name: 'The Forge', grounded: true, par: 3, bag: ROLL,
            blurb: 'Stay on the belt, past the hammer and over the little pad, and it throws you over the iron into the anvil. Off the belt is a putt to the pad.',
            pads: [
                pad(0, 0, 6, 5, 0, 'green'),
                belt(1.5, 5, 3, 9, 0, 7),
                pad(0, 5, 1.5, 9, 0, 'green'), pad(4.5, 5, 1.5, 9, 0, 'green'),
                pad(0, 14, 6, 6, 0, 'green'),
                sprung(3.4, 17, 0.75, 12.7),
                (function () {
                    var p = disc(3, 26.6, 4.2, 1.2);
                    p.bumps = [channel(3, 26.6, 3.9, 2.0, 0.7)];
                    return p;
                })()
            ],
            water: [A.rect(-6, 19.6, 18, 2.8, -0.3)],
            extra: [
                kerb(0, 0, 6, 0), kerb(0, 0, 0, 20), kerb(6, 0, 6, 20),
                slider(1.5, 9.4, 1.5, 0.5, { axis: 'x', amp: 1.6, speed: 1.4, h: 0.8 }),
                kerb(0, 19.3, 6, 19.3, 0, 0.5)
            ],
            tee: { x: 3, z: 2 }, cup: { x: 3, z: 26.6 }
        })
    });

    /* Sculpted to its world, the second that is, and the tour's one hole
       about height. The Obsidian Forge has a river of lava in a canyon and
       one bridge of black glass over it, forty metres up. The tee is on the
       west end of that bridge. The green is far below on the east bank,
       where the canyon has run out and the ground is level beside the
       river — so the whole hole is downhill, and the east bank between is a
       ridge that falls away south with the lava along its right side.

       Two ways down. Along the bridge and round: a putt's width of glass
       with the canyon either side, then the ridge. Or straight at it: a
       drive off the bridge, across the corner of the canyon, to land on the
       ridge and run. All of the ground is the world's (tour-ground.js); what
       is laid on it is a tee, the deck, a strip down the ridge and a green.

       The ground runs 115 units out, past anything the driver reaches.
       It stopped at fifty-six when the hole was made; once the long game
       flew real air (v1.224.0) a full drive carried past that edge, where
       the world still showed ground and the ball fell through it into the
       lava (the owner: "too short runway for the driver"). The first 66 x 64
       is the bake as it was; the rest is the same placing baked again. */
    add({
        id: 'ironriver', title: 'The Iron River', world: 'Black Glass and Lava', kind: 'bizarre', tier: 3,
        caption: 'A par four off a bridge of black glass, across a canyon of lava and down the far bank. The canyon is the world\'s own.',
        theme: 'ironriver',
        hole: (function () {
            var G = (G3.TOUR_GROUND || {}).ironriver, field = G ? [{ grid: G }] : [];
            function on(p, inlay) { p.field = field; if (inlay) p.inlay = true; return p; }
            var ground = on(pad(-8, -8, 123, 123, 0, 'fairway'));
            ground.ghost = true;
            var lava = A.rect(-30, -30, 175, 175, 0.15);
            lava.ghost = true;
            // Lava, not water (README → "Lava, and the crust"): the same
            // drop, but it is called lava and spits embers.
            lava.lava = true;
            return world({
                name: 'The Iron River', par: 4, long: true,
                blurb: 'Off the bridge. Along it and round is the long way; across the corner of the canyon is a drive that has to carry the iron and hold the ridge.',
                pads: [
                    ground,
                    // the deck: no wider than the glass it is laid on
                    on(pad(3.5, -1.2, 26, 2.4, 0, 'fairway'), true),
                    on(pad(31, 5, 8, 31, 0, 'fairway'), true),
                    on(pad(34, 40, 8, 8, 0, 'green'), true)
                ],
                water: [lava],
                tee: { x: 5, z: 0 }, cup: { x: 38, z: 44 }
            });
        })()
    });

    /* Sculpted to its world, the third that is. The Kelp Cathedral is a
       trench: a level floor a few strides wide and two banks that climb away
       from it for as far as the kelp grows. So the hole is a half-pipe.
       The tee is up on the head wall, the drive runs down into the trench,
       and nothing hit along it is ever lost — the banks hand it back to the
       floor. The green is not on the floor. It is a shelf cut into the east
       bank, four units up, and the ball has to be sent up the bank to it
       with the weight to stop: short and it comes all the way back down. */
    add({
        id: 'nave', title: 'The Nave', world: 'Kelp Cathedral, the trench', kind: 'ocean', tier: 2,
        caption: 'A par four down the floor of a sea trench, to a green cut into its bank. The trench is the world\'s own.',
        theme: 'nave',
        hole: (function () {
            var G = (G3.TOUR_GROUND || {}).nave, field = G ? [{ grid: G }] : [];
            function on(p, inlay) { p.field = field; if (inlay) p.inlay = true; return p; }
            var ground = on(pad(-24, -3, 48, 79, 0, 'fairway'));
            ground.ghost = true;
            return world({
                name: 'The Nave', par: 4, long: true,
                blurb: 'Down the head wall and along the floor: the banks send everything back to the middle. The green is a shelf up the left bank, and what does not stay on it comes all the way down.',
                pads: [
                    ground,
                    on(pad(-1.5, -1.5, 3, 3, 0, 'fairway'), true),
                    on(pad(-3, 14, 6, 38, 0, 'fairway'), true),
                    on(pad(-20, 60, 8, 8, 0, 'green'), true)
                ],
                tee: { x: 0, z: 0 }, cup: { x: -16, z: 64 }
            });
        })()
    });

    /* Sculpted to its world, the fourth that is, and the first sculpted to
       a world's *things* rather than its land. The Breakfast Kingdom is a
       laid table, and this hole is played on the tablecloth itself: the
       sample that was baked took the top of everything solid on it
       (world-ground --any), so the dish, the sugar cubes, the plate and the
       teapot are the hole's own ground, as high as they stand.

       From the mat the straight line at the flag is shut by a row of sugar
       cubes. Left of them is a gate one cube wide, and through it an alley
       between the teapot and the rim of the plate, with the cup at its far
       end. Or chip the cubes. Either side of the table is the floor. */
    add({
        id: 'table', title: 'The Sugar Gate', world: 'Breakfast Kingdom, the cloth', kind: 'home', tier: 1,
        caption: 'A par three on the tablecloth itself, through a gate of sugar cubes. The breakfast things are the world\'s own.',
        theme: 'table',
        hole: (function () {
            var G = (G3.TOUR_GROUND || {}).table, field = G ? [{ grid: G }] : [];
            function on(p, inlay) { p.field = field; if (inlay) p.inlay = true; return p; }
            var cloth = on(pad(-9.6, -0.8, 15.7, 28.4, 0, 'fairway'));
            cloth.ghost = true;
            return world({
                name: 'The Sugar Gate', par: 3, bag: LOFT,
                blurb: 'The cubes shut the straight line. Thread the gate on their left and run the alley between the teapot and the plate \u2014 or chip the lot.',
                pads: [
                    cloth,
                    on(pad(-0.8, -0.6, 1.6, 1.4, 0, 'fairway'), true),
                    on(pad(-1.7, 24.4, 2.4, 2.4, 0, 'green'), true)
                ],
                tee: { x: 0, z: 0 }, cup: { x: -0.5, z: 25.6 }
            });
        })()
    });

    /* ── five more worlds (v1.159.0) ──────────────────────────────────────
       Five of Portals' other worlds, each a small place with one strong
       thing in it — the kind a mini hole stands in best — and each hole one
       mechanic the tour did not have. Written in one pass and measured
       (tools/portal-check.mjs, tools/tee-sweep.mjs); none has been played on
       a phone yet. HANDOFF.md has the designs and what is left to check. */

    /* A river that runs with the shot, and faster than a putt by the end of
       it: three reaches, each quicker than the last, and then the fall. The
       green is a still pool off the last reach. Nothing stops in the river,
       so the putt is not at the flag — it is across the stream at the bank
       above the pool, at a pace that has it there as the water brings it
       down. There is an eddy of sand half way for anyone who would rather
       take two, and a bar of shingle at the bottom where everything that
       missed the pool fetches up: from there it is a putt back up against
       the stream. */
    add({
        id: 'rapids', title: 'Shoot the Rapids', world: 'Paper Boat Rapids', kind: 'wild', tier: 2,
        caption: 'A river that runs with the shot, a still pool off its last reach, and a bar of shingle below.',
        theme: 'rapids',
        hole: world({
            name: 'Shoot the Rapids', grounded: true, par: 3, bag: ROLL,
            blurb: 'The river takes the ball and nothing stops in it. Putt across the stream so the water brings you down to the pool — miss and it is the shingle at the bottom.',
            pads: [
                pad(0, 0, 5, 3, 0, 'green'),
                belt(0, 3, 5, 5, 0, 1.2, { kind: 'wood' }),
                belt(0, 8, 5, 5, 0, 1.9, { kind: 'wood' }),
                belt(0, 13, 5, 7, 0, 2.6, { kind: 'wood' }),
                pad(5, 14.5, 5, 5.5, 0, 'green'),
                pad(5, 8.5, 2.6, 3, 0, 'sand'),
                pad(0, 20, 5, 2.6, 0, 'sand')
            ],
            extra: [
                kerb(0, 0, 5, 0), kerb(0, 0, 0, 22.6), kerb(0, 22.6, 5, 22.6), kerb(5, 20, 5, 22.6),
                kerb(5, 0, 5, 8.5), kerb(5, 11.5, 5, 14.5),
                kerb(5, 8.5, 7.6, 8.5), kerb(7.6, 8.5, 7.6, 11.5), kerb(5, 11.5, 7.6, 11.5),
                kerb(5, 14.5, 10, 14.5), kerb(10, 14.5, 10, 20), kerb(5, 20, 10, 20),
                bumper(2.6, 10.5, 0.7)
            ],
            tee: { x: 1.2, z: 1.5 }, cup: { x: 6.4, z: 17.6 }
        })
    });

    /* A model railway in an attic, and the hole goes straight across both
       its tracks. A train runs on each, opposite ways and at different
       speeds, and each is as long as the lane is wide: the crossing is open
       for a little over a third of the time. One train is a matter of
       waiting. Both on one putt is the two gaps coming round together, and
       a weight that is through the second before it shuts.

       It is laid on the Attic Line's own level crossing (PLACES, v1.179.0).
       That world's up line and down line run side by side through the town,
       fourteen toy centimetres apart, and the hole's two tracks are five
       units apart: at 2.8 centimetres to the unit they are the same two
       tracks, so the hole's trains run along the world's rails, between its
       crossing lamps, and the lane is the road. The rails stand on a bank
       five centimetres over the table, so the lane is a block that deep
       (`plinth`), and the tin cars that queue at the gates are put away:
       two of them waited inside it. Until then it hung in the air beside
       the trestle past the table's edge, at a size where one sleeper of
       the world's track was as wide as the lane (the owner: "weak scaling
       and the minigolf is placed really bad").

       The trains are trains since v1.201.0 (the owner: "why can't it be a
       real train … continuous one direction but with gaps"). Until then
       each was a yellow block shuttling across the lane on a sine. Now an
       engine and its coaches run one way along the world's rails, round a
       twenty-unit run: the near one is an engine and a coach, quicker, and
       leaves the lane open about half the time; the far one has two
       coaches, is slower, and leaves it open a little less. Their beats
       (5.9 and 7.7 seconds) do not divide, so the two gaps line up a
       different way every time round.

       v1.226.2 (the owner, look 5 but difficulty 1: "would be nicer if the
       rails were above the fairway and if the [trains] were tighter. It's
       too easy"): each train is two coaches longer, so the near one leaves
       the lane open about a third of the time and the far one about a
       quarter, and the track is drawn across the lane (`track`,
       render.js → addTrack), so the trains run on rails over it. */
    add({
        id: 'railway', title: 'The Level Crossing', world: 'The Attic Line', kind: 'home', tier: 1,
        caption: 'A straight putt over two tracks of a model railway, with a train on each.',
        theme: 'railway',
        hole: world({
            name: 'The Level Crossing', grounded: true, plinth: 1.85, par: 3, bag: ROLL,
            blurb: 'Two tracks, two trains, opposite ways. Wait for one and stop between them — or go when both gaps come round together.',
            pads: [pad(0, 0, 5, 18, 0, 'green')],
            extra: [
                kerb(0, 0, 5, 0), kerb(0, 18, 5, 18),
                kerb(0, 0, 0, 5.2), kerb(5, 0, 5, 5.2),
                kerb(0, 6.8, 0, 10.2), kerb(5, 6.8, 5, 10.2),
                kerb(0, 11.8, 0, 18), kerb(5, 11.8, 5, 18),
                post(1.4, 14.2), post(3.6, 14.2)
            ].concat(
                train(2.5, 5.5, 1.0, { amp: 10, speed: 3.4, at: 4, cars: [2.2, 1.8, 1.8, 1.8], track: [0, 5] }),
                train(2.5, 10.5, 1.0, { amp: 10, speed: -2.6, at: -7, livery: 1, cars: [2.2, 1.8, 1.8, 1.8, 1.8], track: [0, 5] })
            ),
            tee: { x: 2.5, z: 1.5 }, cup: { x: 2.5, z: 15.8 }
        })
    });

    /* Ile flottante: meringue islands in a bowl of custard. An island is a
       green and plays like one; the custard takes whatever lands in it and
       keeps it, like a bunker, and it is a long splash out. So the hole is
       pitching: island to island the safe way, three short carries, each on
       to a target a few strides across — or one long pitch from the tee
       island to the flag's, over all of it.
       (It was a putting hole on slow custard in the first draft; no surface
       here is slow and still playable, so it became this.) */
    add({
        id: 'custard', title: 'Île Flottante', world: 'The Floating Islands', kind: 'bizarre', tier: 2,
        caption: 'Meringue islands in custard. Pitch from one to the next, or all the way in one.',
        theme: 'custard',
        hole: (function () {
            /* v1.226.2 (the owner: fun 1, difficulty 4, look 5, `clip,edges,flat`).
               The islands were greens laid flat into the custard, the same
               height and nearly the same colour, so where one ended could
               not be seen, and the whole bowl was one level sheet. Each is a
               table of meringue now (`mesa`), standing ISLE_H out of the
               custard with a short slope round it, a little bigger than it
               was, and the hole is lifted clear of the world's own island,
               which stood up through the tee. */
            var ISLE_H = 0.45, ISLE_RUN = 1.0;
            var isles = [[3, 3, 2.8], [9.6, 5.8, 2.5], [3.6, 10, 2.5], [9.4, 13.1, 2.9]];
            var bowl = pad(0, 0, 13, 17, 0, 'sand');
            bowl.bumps = isles.map(function (q) { return mesa(q[0], q[1], q[2], ISLE_RUN, ISLE_H); });
            function isle(q) { var p = disc(q[0], q[1], q[2], ISLE_H, 'green'); p.inlay = true; return p; }
            return world({
                name: 'Île Flottante', par: 3, bag: LOFT,
                blurb: 'The islands are greens and the custard keeps whatever lands in it. Hop island to island — or pitch the whole bowl in one.',
                pads: [bowl].concat(isles.map(isle)),
                extra: [
                    kerb(0, 0, 13, 0), kerb(0, 0, 0, 17), kerb(13, 0, 13, 17), kerb(0, 17, 13, 17)
                ],
                tee: { x: 3, z: 2.6 }, cup: { x: 9.4, z: 13.6 }
            });
        })()
    });

    /* One face of a pyramid, as courses of stone, each a step higher than
       the last, with a ramp at alternate ends. Run the ramps and it is a
       zig-zag: east, west, and up the last slope to the cap and the flag.
       Or pitch it: a wedge carries on to the third course, and the third
       course's back half is one slope up to the cap, so a pitch with the
       right weight on it runs up on to the top and at the flag. A ball that
       comes back off a course comes down to the one below, not out. */
    add({
        id: 'pyramid', title: 'The Stepped Side', world: 'The Great Pyramid of Giza', kind: 'city', tier: 3,
        caption: 'Four courses of stone and a ramp at alternate ends. The flag is on the top one.',
        theme: 'pyramid',
        hole: world({
            name: 'The Stepped Side', grounded: true, par: 3, bag: LOFT,
            blurb: 'Run the ramps and it is a zig-zag to the top. Or pitch on to the third course and let the slope run it up to the flag.',
            pads: (function () {
                // Four courses each D deep and H higher than the last; the
                // cap is the fifth. (Three units and one high until
                // v1.161.0, which put the cap out of a wedge's reach.)
                var D = 2.0, H = 0.65, r = 1 / D * H;
                return [
                    pad(0, 0, 12, D, 0, 'green'), pad(0, D, 9, D, 0, 'green'),
                    pad(9, D, 3, D, 0, 'wood', 0, r),
                    pad(0, 2 * D, 12, D, H, 'wood'), pad(3, 3 * D, 9, D, H, 'wood'),
                    pad(0, 3 * D, 3, D, H, 'wood', 0, r),
                    // the third course: its back half is one slope up to the cap
                    pad(0, 4 * D, 12, D, 2 * H, 'wood'), pad(0, 5 * D, 12, D, 2 * H, 'wood', 0, r),
                    pad(0, 6 * D, 12, 4, 3 * H, 'green')
                ];
            })(),
            extra: (function () {
                var D = 2.0, H = 0.65;
                return [
                    // the risers
                    wall(0, 2 * D - 0.3, 9, 0.3, H + 0.1, { base: -0.1 }),
                    wall(3, 4 * D - 0.3, 9, 0.3, H + 0.1, { base: H - 0.1 }),
                    // the sides
                    kerb(0, 0, 12, 0), kerb(0, 0, 0, 2 * D), kerb(12, 0, 12, 2 * D, 0, 1.4),
                    kerb(0, 2 * D, 0, 4 * D, H, 1.4), kerb(12, 2 * D, 12, 4 * D, H),
                    kerb(0, 4 * D, 0, 6 * D, 2 * H), kerb(12, 4 * D, 12, 6 * D, 2 * H, 1.4),
                    kerb(0, 6 * D, 0, 6 * D + 4, 3 * H), kerb(12, 6 * D, 12, 6 * D + 4, 3 * H),
                    kerb(0, 6 * D + 4, 12, 6 * D + 4, 3 * H, 1.2)
                ];
            })(),
            tee: { x: 2, z: 2.6 }, cup: { x: 2.4, z: 12.6 }
        })
    });

    /* The moon, in dry dock, over a canal in the harbour town below it, at
       the game's own weight. A pitch across the water from the tee box: land
       it on the deck short of the green and it runs on to the cup, land it
       in the water and it is gone, and the low wall at the back stops only
       the gentle ones.

       Until v1.168.5 it was played at a sixth of a g, and the owner: "no
       fun", because "you don't know what to expect as a user if the rules
       for the swing you learn suddenly change". Gravity that is not the
       game's belongs on the few holes built round it (the gravity course),
       not on a tour hole you meet once.

       v1.226.2 (the owner: "Can't see [the hole] due to overlapping texture
       and too easy and short", fun 1, eight strokes on the par three). The
       green's dish went 0.12 under the dock's stone floor, so the world was
       drawn over the cup, and the felt was the floor's own grey: the hole
       stood on the floor rather than over it (`lift` now), and the felt is
       green. And it is two canals now, not one: from the tee box over the
       first on to a deck, and from the deck over the second to a flat
       green with the low wall behind (the dish went: it gathered a chip
       from the deck into the cup one time in two). Neither carry is long, but
       each is on to something four units across with water short, long
       and both sides, and the tee box is too far out for the flag in one. */
    add({
        id: 'drydock', title: 'Dry Dock', world: 'The Moon in Dry Dock', kind: 'alien', tier: 3,
        caption: 'The moon in dry dock overhead, and two canals to pitch across below it.',
        theme: 'drydock',
        hole: world({
            name: 'Dry Dock', plinth: 0.85, par: 3, bag: LOFT,
            blurb: 'Two canals. Pitch on to the deck between them, then on to the green \u2014 short, long or wide is wet.',
            pads: [
                pad(0, 0, 5, 5, 0, 'wood'),
                rounded(2.5, 11.75, 4.5, 8.5, 0, 'green'),
                rounded(2.5, 22.5, 5, 5, 0, 'green')
            ],
            water: [A.rect(-5, 5, 15, 20, -0.35)],
            extra: [
                kerb(0, 0, 5, 0), kerb(0, 0, 0, 5), kerb(5, 0, 5, 5),
                kerb(0, 25, 5, 25, 0, 0.6)
            ],
            tee: { x: 2.5, z: 2 }, cup: { x: 2.5, z: 22.5 }
        })
    });

    /* ── three more worlds (v1.209.0) ─────────────────────────────────────
       Chosen for the one thing each does that no tour hole did: a current
       that goes round, a wall that curves up to meet you, and ground that
       is pressed up from underneath. */

    /* A deck over the eye of a whirlpool off Norway. The water goes round
       anticlockwise and in: a ball on the deck is carried round the eye as
       well as drawn to it, and what reaches the eye goes down with the
       barrels. So nothing is putted at the flag. The putt is sent wide,
       upstream, and the current bends it round; too slow and it is drawn in,
       too firm and it is flung off the far side of the deck. */
    add({
        id: 'maelstrom', title: 'The Maelstrom', world: 'Down the Maelstrom', kind: 'ocean', tier: 3,
        caption: 'A deck over the eye of a whirlpool. The water carries everything round, and in.',
        theme: 'maelstrom',
        hole: world({
            name: 'The Maelstrom', par: 3, bag: ROLL,
            blurb: 'The current goes round and in. Putt wide of the eye and let the water bend it to the flag — slow is drawn down, firm is flung off.',
            pads: [disc(0, 0, 7.5, 0, 'green')],
            wells: [{ x: 0, z: 0, pull: 4, core: 0.8, swirl: 14, reach: 4.8 }],
            extra: A.arc(0, 0, 7.3, 0.05 * Math.PI, 0.95 * Math.PI, { drawn: 'rail', h: 0.6 }),
            tee: { x: 0, z: -6 }, cup: { x: 0, z: 5.4 }
        })
    });

    /* Inside a snow globe, seconds after somebody shook it. The floor is
       snow and the glass curves up out of it all the way round, so a ball
       sent at the wall climbs it, runs round and comes back down further
       on. Three firs stand in the middle across the straight line. Round
       them along the floor is two putts; up the glass and round in one,
       at the weight that brings it down off the bank by the flag, is the
       ace. The flag is a little right of the firs, so it is the right-hand
       glass that brings it down there; too hard and it rattles along the
       rail at the top of the bank. */
    add({
        id: 'globe', title: 'The Snow Globe', world: 'The Shaken Globe', kind: 'home', tier: 2,
        caption: 'Inside a snow globe. Three firs in the middle, and the glass curving up all round.',
        theme: 'globe',
        hole: world({
            name: 'The Snow Globe', par: 3, bag: ROLL,
            blurb: 'The firs shut the straight line. Walk round them on the floor \u2014 or send it up the glass and let the curve bring it round to the flag.',
            pads: [(function () {
                var p = disc(0, 0, 6.2, 0, 'green');
                p.bumps = [channel(0, 0, 6.2, 1.9, 1.3)];
                return p;
            })()],
            extra: A.arc(0, 0, 6.2, 0, TAU, { drawn: 'rail', h: 0.5, base: 1.2, n: 32 }).concat([
            ]).concat(fir(0, 0, 0.8, 2.4), fir(-0.9, 0.6, 0.6, 1.9), fir(0.9, 0.6, 0.6, 1.9)),
            tee: { x: 0, z: -3.8 }, cup: { x: 0.9, z: 3.6 }
        })
    });

    /* A pin art toy the size of a country, and somebody's knuckles pressed
       up into it from below: four ridges of pins across the board, each a
       little higher than the last, with a level valley between each pair.
       A ball stops in a valley or nowhere, so the whole hole is the weight.
       The flag is in the third valley; the last ridge is the highest, and
       over it is off the end of the board. */
    add({
        id: 'pins', title: 'The Knuckles', world: 'The Country of Pins', kind: 'bizarre', tier: 2,
        caption: 'A pin art board pressed up from below: four ridges, three valleys, and the flag in the last of them.',
        theme: 'pins',
        hole: world({
            name: 'The Knuckles', par: 3, bag: ROLL,
            blurb: 'Every ball finishes in a valley between the ridges. The flag is in the third: it is all in the weight.',
            pads: [(function () {
                var p = pad(0, 0, 6, 19, 0, 'green');
                p.bumps = [
                    A.trough(0, 4.6, 6, 4.6, 1.1, 0.25),
                    A.trough(0, 8.2, 6, 8.2, 1.1, 0.38),
                    A.trough(0, 11.8, 6, 11.8, 1.1, 0.5),
                    A.trough(0, 15.4, 6, 15.4, 1.1, 0.9)
                ];
                return p;
            })()],
            extra: [kerb(0, 0, 0, 19, 0, 1.2), kerb(6, 0, 6, 19, 0, 1.2), kerb(0, 0, 6, 0)],
            tee: { x: 3, z: 1.6 }, cup: { x: 3, z: 13.6 }
        })
    });

    /* The first hole the forge made that the owner kept (batch 1, b1-03:
       "look 5/5 … easy, too short … have some hazard so it's some kind of
       challenge / strategy"). The ground is Storm over the Savanna's own,
       read and baked by tools/forge.mjs: the tee is in a shallow basin, the
       country climbs away to the right and the back. Finished by hand with
       tools/forge-finish.mjs: the forge's cup was ten units out on the floor
       of the basin, where a putt rolled in; it is up on the slope at the
       back left now, and the rain has filled the basin between. The line is
       over the water and has to hold a green on a hill, short of which
       everything runs back into the pond; the dry way is right, up the
       slope and down on to the green, and it costs a stroke. Off screen it
       borrows the cloud armada's set piece: it is the storm's world. */
    add({
        id: 'savanna', title: 'The Rain Pond', world: 'Storm over the Savanna', kind: 'wild', tier: 2,
        caption: 'A par three on the savanna\'s own ground, over a pond the storm has filled, to a green up the hill.',
        theme: 'savanna',
        hole: (function () {
            var G = (G3.TOUR_GROUND || {}).savanna, field = G ? [{ grid: G }] : [];
            function on(p, inlay) { p.field = field; if (inlay) p.inlay = true; return p; }
            var ground = on(pad(-8, -3, 16, 21, 0, 'fairway'));
            ground.ghost = true;
            return world({
                name: 'The Rain Pond', par: 3, bag: LOFT,
                blurb: 'The storm has filled the hollow between you and the hill. Carry it and hold the green on the slope \u2014 short runs back into the water. Or go right, up the hill, and come down on it.',
                pads: [
                    ground,
                    on(pad(-1, -1, 2, 2, 0, 'fairway'), true),
                    on(pad(-4, 1, 6, 6.5, 0, 'fairway'), true),
                    on(pad(-6, 7.5, 6, 5.9, 0, 'fairway'), true),
                    on(pad(-5.5, 13.5, 3, 3, 0, 'green'), true)
                ],
                // Drawn to its waterline on the grid (render.js → addPondOnGrid).
                water: G ? [Object.assign(A.rect(-8.25, 2.25, 6, 9.5, 0.5), { grid: G })] : [],
                tee: { x: 0, z: 0 }, cup: { x: -4, z: 15 }
            });
        })()
    });

    /* The second hole the forge made that the owner kept (batch 2, b2-03:
       "keep · fun 3/5 · look 4/5 · short, camera"). The ground is Ahead of
       the Fire's own, read and baked by tools/forge.mjs on the planet's
       night side, with the Fire coming round behind the palace: a long
       valley with a bank climbing away down the left. Finished by hand with
       tools/forge-finish.mjs for `short`: the forge's cup was thirty-eight
       units out on the valley floor, where the owner made three on a par
       four; it is at fifty now, on the foot of the left bank, so a second
       shot missed right runs down off the green into the valley. The
       camera half of the note was the seat (render.js → seatLead, and
       sightLift's fix), not the hole.

       v1.222.0, the owner: "cool map but too straight and boring layout"
       (fun 1, difficulty 1, a two on the par four). The tee is on the right
       of the valley now (7, 1), so the line to the green runs across it,
       and two basins are dug into the floor and flooded (forge-finish --dig,
       level-floored): one across the valley where a drive comes down, the
       other short and right of the green. Carry the first or play round it
       on the right; the second takes a long second shot that drifts. */
    add({
        id: 'fire', title: 'Before the Fire', world: 'Ahead of the Fire', kind: 'alien', tier: 2,
        caption: 'A par four across a valley on Echronedal\'s night side, past two pools, with the Fire coming round behind the palace. The valley is the world\'s own.',
        theme: 'fire',
        hole: (function () {
            var G = (G3.TOUR_GROUND || {}).fire, field = G ? [{ grid: G }] : [];
            function on(p, inlay) { p.field = field; if (inlay) p.inlay = true; return p; }
            var ground = on(pad(-12, -3, 24, 59, 0, 'fairway'));
            ground.ghost = true;
            return world({
                name: 'Before the Fire', par: 4, long: true,
                blurb: 'Across the valley in the dark, with the Fire on the horizon. A pool lies where a drive comes down: carry it or go round it on the right. The green is on the foot of the bank, with a second pool short and right of it.',
                pads: [
                    ground,
                    on(pad(6, 0, 2, 2, 0, 'fairway'), true),
                    on(pad(-1, 2, 10.5, 24, 0, 'fairway'), true),
                    on(pad(-6.5, 26, 10.5, 21.9, 0, 'fairway'), true),
                    on(pad(-7, 48, 6, 6, 0, 'green'), true)
                ],
                // Drawn to its waterline on the grid (render.js → addPondOnGrid).
                water: G ? [Object.assign(A.rect(-2.5, 27.5, 9, 20, -0.04), { grid: G })] : [],
                tee: { x: 7, z: 1 }, cup: { x: -4, z: 51 }
            });
        })()
    });

    /* The Pop-Up Book — the forge's b4-07, kept as the owner played it
       (v1.229.0: "keep · fun 4/5 · difficulty 2 · look 4/5", an ace on
       their one play). The ground is The Pop-Up Book Opens' own, read and
       baked by tools/forge.mjs: a paper river down the right, flooded, and
       the kingdom's folded card standing on the left. It is the first keep
       forged with the world's things hard and out (forge.mjs → solidOf,
       outsOf), so they come with the ground (tour-ground.js → `outs`,
       `solid`; `marks` below), and the first with its fairway and green
       painted on the world (`paint`), as it was rated. Nothing moved: a
       keep with no note. */
    add({
        id: 'popup', title: 'The Pop-Up Book', world: 'The Pop-Up Book Opens', kind: 'bizarre', tier: 2,
        caption: 'A long par three across one sheet of paper folded into a kingdom, with a paper river down the right. The folds are the world\'s own.',
        theme: 'popup',
        hole: (function () {
            var G = (G3.TOUR_GROUND || {}).popup, field = G ? [{ grid: G }] : [];
            function on(p, inlay) { p.field = field; if (inlay) p.inlay = true; return p; }
            var ground = on(pad(-12, -3, 24, 56, 0, 'fairway'));
            ground.ghost = true;
            var h = world({
                name: 'The Pop-Up Book', par: 3, long: true,
                blurb: 'Down the page between the folds. The river runs the whole right side; the card kingdom stands on the left, and its towers are paper you can hit. The green sits left, against the fold.',
                pads: [
                    ground,
                    on(pad(-4, -1, 2, 2, 0, 'fairway'), true),
                    on(pad(-7.5, 1, 7, 15.23, 0, 'fairway'), true),
                    on(pad(-9.5, 16.23, 7, 13.13, 0, 'fairway'), true),
                    on(pad(-10, 29.46, 6, 6, 0, 'green'), true)
                ],
                // Drawn to its waterline on the grid (render.js → addPondOnGrid).
                water: G ? [Object.assign(A.rect(4.5, -3.5, 8, 52, 0.586), { grid: G })] : [],
                tee: { x: -3, z: 0 }, cup: { x: -7, z: 32.46 }
            });
            marks(h, G);
            h.paint = true;
            return h;
        })()
    });

    /* ── the shelves ────────────────────────────────────────────────────── */

    var KINDS = {
        home: 'At home', wild: 'Wilderness', ocean: 'Oceans', sky: 'Skies', city: 'Cities',
        interior: 'Interiors', alien: 'Alien', bizarre: 'Bizarre', after: 'After an artist'
    };

    /* ── the palettes ───────────────────────────────────────────────────── */

    var THEMES = {
        /* The forge's palette for this world as the owner rated it (forge.js →
           themeFor: the attic's stand-in, its grass turned to the paper's
           violet ink), kept as it was: look 4/5. */
        popup: {
            sky: [0x3a2a1e, 0xc98f58], fog: 0xb07d4c,
            sun: 0xffd9a0, sunPos: [-10, 9, 4], ambient: 0xa87c50, ambientI: 0.72,
            grass: ['#6f4c8a', '#62437a'], rail: 0x7a542e,
            cloudLum: 0.3, birds: false, motes: true,
            surroundY: -0.42, surround: 'floor', floor: '#3d2817',
            water: 0x2b6f8f, side: '#4a3019'
        },
        /* The forge's palette for this world (forge.js → themeFor: the
           paper-river stand-in), with the grass turned from its teal to the
           savanna's dry gold and the water to the storm's slate. */
        savanna: {
            sky: [0x7fb6d8, 0xe9f4e2], fog: 0xd8eed8,
            sun: 0xfff5dc, sunPos: [8, 12, -5], ambient: 0xa8d0b8, ambientI: 0.75,
            grass: ['#a08f3e', '#8f7f36'], rail: 0xf3e9d2,
            birds: false,
            surroundY: -6, surround: 'floor', floor: '#8a7a4a',
            water: 0x4a6a78, side: '#c9b98a'
        },
        /* The forge's palette for this world as the owner rated it (forge.js →
           themeFor: Great A'Tuin's night, the grass turned to the world's
           own hue), kept as it was: look 4/5. */
        fire: {
            sky: [0x050816, 0x1b2a55], fog: 0x1b2a55,
            sun: 0xfff6dc, sunPos: [-9, 12, 7], ambient: 0x6c86c8, ambientI: 0.6,
            grass: ['#608a4c', '#557a43'], rail: 0xe7d9a8,
            stars: 1, cloudLum: 0.1, birds: false,
            surroundY: -60, surround: 'floor', floor: '#070b1c',
            water: 0x2b6f8f, side: '#5a4a2e'
        },
        breakfast: {
            sky: [0xf2c98a, 0xfff1d6], fog: 0xfff1d6,
            sun: 0xfff0cf, sunPos: [10, 13, -6], ambient: 0xf6d9b0, ambientI: 0.7,
            grass: ['#c8463c', '#b93d34'], rail: 0xfaf6ea,
            surroundY: -7, surround: 'floor', floor: '#8a5a36',
            water: 0xf4ead0, side: '#e8dcc0', birds: false, motes: true
        },
        turtle: {
            sky: [0x050816, 0x1b2a55], fog: 0x1b2a55,
            sun: 0xfff6dc, sunPos: [-9, 12, 7], ambient: 0x6c86c8, ambientI: 0.6,
            grass: ['#3fa56a', '#36945e'], rail: 0xe7d9a8,
            stars: 1, cloudLum: 0.1, birds: false,
            surroundY: -60, surround: 'floor', floor: '#070b1c',
            water: 0x2b6f8f, side: '#5a4a2e'
        },
        gasgiant: {
            sky: [0x2b1a4a, 0xf0a868], fog: 0xe89a62,
            sun: 0xffe2b8, sunPos: [8, 9, 10], ambient: 0xd08a7a, ambientI: 0.75,
            grass: ['#7a5cc0', '#6e51b2'], rail: 0xffe9c2, machine: 0x7ef0ff,
            stars: 0.5, cloudLum: 0.9, birds: false,
            surroundY: -60, surround: 'floor', floor: '#c9794a',
            water: 0xd9864a, side: '#4a2f6e'
        },
        abyss: {
            sky: [0x021420, 0x0b4f66], fog: 0x0a4358,
            sun: 0x9fe8ff, sunPos: [3, 18, 4], ambient: 0x2a8aa0, ambientI: 0.85,
            grass: ['#14453d', '#103832'], rail: 0x1f7a68, machine: 0x5cd8e6,
            cloudLum: 0.08, birds: false,
            surroundY: -0.42, surround: 'rock', ground: '#0c3440',
            water: 0x0d5f78, side: '#09282e'
        },
        // The same sea, for the hole that lies on its bed: sand, not a mat.
        // The green is the bed's own weed-dark green, a shade lighter so it
        // still reads. The hex is very dark because this sea's cyan light
        // more than doubles it: the old #378c7d glowed like a turquoise sheet
        // laid on the trench.
        nave: {
            sky: [0x021420, 0x0b4f66], fog: 0x0a4358,
            sun: 0x9fe8ff, sunPos: [3, 18, 4], ambient: 0x2a8aa0, ambientI: 0.85,
            grass: ['#142a1f', '#11241a'], rail: 0x3fe0b0, machine: 0x8dfcff,
            cloudLum: 0.08, birds: false,
            surroundY: -0.42, surround: 'rock', ground: '#0c3440',
            water: 0x0d5f78, side: '#0e4a52'
        },
        carnival: {
            sky: [0x121634, 0x6b4a8a], fog: 0x5a4380,
            sun: 0xffd9a8, sunPos: [7, 11, -8], ambient: 0x8e8fd8, ambientI: 0.85,
            grass: ['#c0392b', '#a93226'], rail: 0xffd166, machine: 0xff5aa0,
            stars: 0.8, cloudLum: 0.3, birds: false,
            surroundY: -0.42, surround: 'rock', ground: '#b8cfe6',
            water: 0x2a6f9c, side: '#9db8d2'
        },
        mushroom: {
            sky: [0x0c1a14, 0x2f5a3c], fog: 0x26492f,
            sun: 0xd8ffc0, sunPos: [-6, 14, 5], ambient: 0x5fae7a, ambientI: 0.78,
            grass: ['#1e4d26', '#183f1f'], rail: 0x8c7b5c, machine: 0xd94848,
            stars: 0.3, cloudLum: 0.15, birds: false,
            surroundY: -0.42, surround: 'floor', floor: '#14301c',
            // The slab's side is the stump it stands on (the hole's `plinth`).
            water: 0x2b6f8f, side: '#5a3c24'
        },
        orrery: {
            sky: [0x140c08, 0x2c1b12], fog: 0x24160e,
            sun: 0xffcfa0, sunPos: [5, 13, -5], ambient: 0x8f6542, ambientI: 0.68,
            grass: ['#0a1f16', '#081912'], rail: 0x4a2c11, machine: 0x7a5020,
            rock: 0x6e481f, flipperBody: 0x6e481f, flipperTrim: 0x241408, flipperPin: 0x8a5a24,
            stars: 0.4, cloudLum: 0.08, birds: false,
            surroundY: -0.42, surround: 'floor', floor: '#24150d',
            water: 0x2b6f8f, side: '#1c0e06'
        },
        /* The world is pale rose stone under a periwinkle evening, not the
           white Escher print the first theme guessed at: the landings are
           its stone a shade into shadow, so the white ball still reads. */
        stairs: {
            sky: [0x6f78d8, 0xd8c8e8], fog: 0xb8b0e0,
            sun: 0xffe6c8, sunPos: [-8, 12, -6], ambient: 0xaaa6e6, ambientI: 0.8,
            grass: ['#c4a196', '#b8958b'], rail: 0xf0e2d4, machine: 0x3a2f4a,
            cloudLum: 1, birds: false, motes: false,
            surroundY: -40, surround: 'floor', floor: '#d8c8d8',
            water: 0x9a978c, side: '#9a88a8'
        },
        attic: {
            sky: [0x3a2a1e, 0xc98f58], fog: 0xb07d4c,
            sun: 0xffd9a0, sunPos: [-10, 9, 4], ambient: 0xa87c50, ambientI: 0.72,
            grass: ['#2b4a48', '#243f3d'], rail: 0x7a542e,
            cloudLum: 0.3, birds: false, motes: true,
            surroundY: -0.42, surround: 'floor', floor: '#3d2817',
            water: 0x2b6f8f, side: '#4a3019'
        },
        /* The world is a 1970s paperback cover in seven inks (ink black,
           ultramarine, magenta, cadmium orange, cream, teal, ice), flat and
           unglowing. The sheet is its ink black ruled in its orange, the
           three wells are painted in its disc's orange and magenta, and the
           hole is turned so the cover's own black hole stands behind the
           flag: the three little ones in front of the big one. */
        threebody: {
            sky: [0x02030a, 0x1a0f2e], fog: 0x120a22,
            sun: 0xffe2a6, sunPos: [-7, 11, 9], ambient: 0xbfd4ff, ambientI: 0.7,
            grass: ['#0d0a1e', '#0a0818'], rail: 0xffb347,
            glow: true, motes: false,
            glass: { color: 0x04040c, emissive: 0x000000, specular: 0x1c2b8f },
            wellHot: 0xff6a14, wellCool: 0xd4226b,
            grid: { colour: '#ffb347', floor: '#5a3cff', every: 1, floorEvery: 3 },
            grade: { bloom: 0.14, threshold: 0.7, rays: 0, exposure: 0.8, contrast: 1.05,
                saturation: 1.05, vignette: 0.25, grain: 0, aberration: 0,
                lift: [0, 0, 0], tint: [1, 1, 1] },
            machine: 0xffb347, stars: 1, cloudLum: 0.1, birds: false,
            surroundY: -0.42, surround: 'floor', floor: '#04030c',
            water: 0xffb347, side: '#08081a'
        },
        clouds: {
            sky: [0x2f7fe0, 0xffd9c2], fog: 0xffe6d6,
            sun: 0xfff3d8, sunPos: [10, 10, 9], ambient: 0xbfd8ff, ambientI: 0.8,
            grass: ['#9fd8c0', '#8fcbb2'], rail: 0xffffff,
            cloudLum: 1.1,
            surroundY: -60, surround: 'floor', floor: '#ffe6d6',
            water: 0x9fd0ff, side: '#d6e2f2'
        },
        forge: {
            sky: [0x120806, 0x7a2a12], fog: 0x6a2410,
            sun: 0xffa860, sunPos: [0, 9, 12], ambient: 0x9a4a30, ambientI: 0.8,
            grass: ['#4a4a52', '#404048'], rail: 0x2a2a30, machine: 0xffd24a,
            stars: 0.2, cloudLum: 0.2, birds: false,
            surroundY: -0.42, surround: 'rock', ground: '#1c1412',
            water: 0xff5a1a, side: '#2c2224'
        },
        /* The same forge, for the hole that is laid on its rock rather than
           built over it: the strips are black glass, not a factory floor,
           and the light is cooler so they do not go the colour of the lava. */
        ironriver: {
            sky: [0x120806, 0x7a2a12], fog: 0x6a2410,
            sun: 0xffe2c4, sunPos: [0, 9, 12], ambient: 0x8a6a70, ambientI: 0.75,
            grass: ['#3a3d48', '#30333d'], rail: 0x2a2a30, machine: 0xffd24a,
            stars: 0.2, cloudLum: 0.2, birds: false,
            surroundY: -0.42, surround: 'rock', ground: '#1c1412',
            water: 0xff5a1a, side: '#2c2224'
        }
    };
    // The same breakfast, for the hole on the cloth itself: gingham, not felt.
    // The five worlds of v1.159.0.
    THEMES.rapids = {
        sky: [0x7fb6d8, 0xe9f4e2], fog: 0xd8ecd8,
        sun: 0xfff6dc, sunPos: [8, 12, -5], ambient: 0xa8d0b8, ambientI: 0.75,
        grass: ['#4f9e58', '#458f4e'], rail: 0xf3ead2,
        surroundY: -6, surround: 'floor', floor: '#3f7f9a',
        water: 0x4fa8c8, side: '#c9b98a', birds: false
    };
    THEMES.railway = {
        sky: [0x2e2218, 0xb98a58], fog: 0xa07448,
        sun: 0xffe0b0, sunPos: [-8, 10, 6], ambient: 0xa07a52, ambientI: 0.72,
        grass: ['#244a22', '#1e3f1c'], rail: 0x5c1c14, machine: 0xb02820,
        cloudLum: 0.3, birds: false, motes: true,
        surroundY: -0.42, surround: 'floor', floor: '#4a321e',
        water: 0x2b6f8f, side: '#4a321e'
    };
    THEMES.custard = {
        sky: [0xf6dc8a, 0xfff6d8], fog: 0xfff0c0,
        sun: 0xfff4d0, sunPos: [6, 14, -4], ambient: 0xf8e2a8, ambientI: 0.8,
        /* Meringue white on a custard that is a shade deeper than the
           world's own, so an island's edge reads (v1.226.2: `edges`). */
        grass: ['#fffdf8', '#f7f1e6'], rail: 0xb8742a,
        surroundY: -5, surround: 'floor', floor: '#e8c860',
        water: 0xf0d060, side: '#e2c070', sand: '#d9a531', birds: false
    };
    THEMES.pyramid = {
        sky: [0x3f8fd8, 0xf6e2b8], fog: 0xf0dcb0,
        sun: 0xfff2cc, sunPos: [9, 14, -8], ambient: 0xe8cfa0, ambientI: 0.7,
        grass: ['#c9a25e', '#bd9654'], rail: 0xe6cf9a,
        surroundY: -0.42, surround: 'floor', floor: '#d9bd84',
        water: 0x3f8fb8, side: '#c4a468', birds: false
    };
    THEMES.drydock = {
        sky: [0x04060c, 0x1c2430], fog: 0x141a24,
        /* Lit for the harbour town in the sun the world is, not the night
           on the moon the first theme guessed at. */
        sun: 0xfff0d8, sunPos: [-6, 12, 8], ambient: 0xb8c4d8, ambientI: 0.8,
        grass: ['#3f7d4a', '#386f42'], rail: 0xf0b030, machine: 0xf0b030,
        stars: 0.5, cloudLum: 0.1, birds: false,
        /* The dock's stone is 0.8 under the hole (PLACES `lift`): the
           canals' water stops just below it rather than hanging sixty
           units down as a black wall. */
        surroundY: -0.9, surround: 'floor', floor: '#141a24',
        water: 0x2a3a52, side: '#4a5260'
    };
    /* The whirlpool: a deck of wet green-black planking over a sea of
       green water and white foam, and the eye painted foam and deep water
       rather than fire. */
    THEMES.maelstrom = {
        sky: [0x0a1c1a, 0x5f8f86], fog: 0x3f6f68,
        sun: 0xe8fff4, sunPos: [-6, 13, 7], ambient: 0x7fb8a8, ambientI: 0.8,
        grass: ['#1f5a4a', '#1a4f41'], rail: 0xd8efe4, machine: 0xeafff6,
        wellHot: 0xeafff6, wellCool: 0x0b4a3c,
        cloudLum: 0.4, birds: false,
        surroundY: -60, surround: 'floor', floor: '#0e3a32',
        water: 0x1f6a5a, side: '#123c33'
    };
    /* The snow globe: snow underfoot, a frosted glass rail, and the cold
       blue evening light of the village in it. */
    THEMES.globe = {
        sky: [0x1a2a4a, 0xc8d8f0], fog: 0xb8c8e4,
        sun: 0xfff2dc, sunPos: [7, 12, -6], ambient: 0xb0c4ec, ambientI: 0.85,
        grass: ['#eef3fa', '#e2e9f4'], rail: 0xcfe6ff,
        cloudLum: 0.8, birds: false, motes: true,
        surroundY: -0.42, surround: 'floor', floor: '#dfe7f2',
        water: 0x8fb0d8, side: '#c8d4e6'
    };
    /* The pin board: its own violet pins with brass heads, under a dusk
       that is all violet. */
    THEMES.pins = {
        sky: [0x120a2e, 0x6a4ab8], fog: 0x4a347e,
        sun: 0xffe2a8, sunPos: [-7, 12, 6], ambient: 0x8a78d0, ambientI: 0.8,
        grass: ['#5a46a8', '#50409a'], rail: 0xe8b84a, machine: 0xe8b84a,
        stars: 0.4, cloudLum: 0.3, birds: false,
        surroundY: -0.42, surround: 'floor', floor: '#2a1e58',
        water: 0x6a5ac8, side: '#3a2c78'
    };
    THEMES.table = {};
    Object.keys(THEMES.breakfast).forEach(function (k) { THEMES.table[k] = THEMES.breakfast[k]; });
    THEMES.table.grass = ['#8fa9d6', '#829dcc'];
    G3.THEMES = G3.THEMES || {};
    Object.keys(THEMES).forEach(function (k) { G3.THEMES[k] = THEMES[k]; });
    /* No weather in a world that has none: a clear sky and a fair one, the
       way the moon has it (weather.js, BY_THEME). */
    G3.PORTAL_SKIES = {};
    Object.keys(THEMES).forEach(function (k) { G3.PORTAL_SKIES[k] = ['clear', 'fair']; });
    G3.PORTAL_SKIES.clouds = ['golden', 'clear', 'fair'];
    G3.PORTAL_SKIES.breakfast = ['golden', 'clear'];
    G3.PORTAL_SKIES.abyss = ['mist', 'fair'];

    /* ── journeys ───────────────────────────────────────────────────────── */

    var LENGTH = 6;

    function byId(id) {
        for (var i = 0; i < WORLDS.length; i++) if (WORLDS[i].id === id) return WORLDS[i];
        return null;
    }

    function course(id, ref, list, extra) {
        var holes = list.map(function (w) { return w.hole; });
        var c = {
            id: id, group: 'portals', name: 'World Tour',
            blurb: 'Six holes, each in a world of its own.',
            theme: list[0].theme, holes: holes, isPortals: true,
            worlds: list.map(function (w) { return w.id; }),
            themes: list.map(function (w) { return w.theme; }),
            from: list.map(function (w) { return { id: 'world-' + w.id, index: 0 }; })
        };
        for (var k in extra) c[k] = extra[k];
        return c;
    }

    /* A journey: LENGTH worlds, no two alike, climbing.

       Each is picked the way the original picks its next world — worlds this
       save has not been to weigh four times one it has holed out in once,
       nine times one it has twice (the same 1/(1+plays)² the showcase's dice
       use) — and never the same shelf twice running, so a journey moves
       between kinds of place as well as between places. Then the six are put
       in order of what they ask, so the first door opens on something gentle
       and the last on something that is not. */
    /* `avoid` (world ids) is left out of the pool when enough is left without
       it — "six new holes" after a tour means six that tour did not have. */
    function dealJourney(rng, save, first, avoid) {
        rng = rng || Math.random;
        var pool = WORLDS.slice(), out = [], last = null, i, w;
        if (avoid && avoid.length) {
            var fresh = pool.filter(function (x) { return avoid.indexOf(x.id) < 0 || x.id === first; });
            if (fresh.length >= LENGTH) pool = fresh;
        }
        function weight(x) {
            var rec = save && save.holes ? save.holes['world-' + x.id + ':0'] : null;
            var n = rec ? rec.plays || 0 : 0;
            return 1 / ((1 + n) * (1 + n));
        }
        if (first && byId(first)) {
            w = byId(first);
            out.push(w); pool.splice(pool.indexOf(w), 1); last = w.kind;
        }
        while (out.length < LENGTH && pool.length) {
            var cand = pool.filter(function (x) { return x.kind !== last; });
            if (!cand.length) cand = pool;
            var total = 0, r;
            for (i = 0; i < cand.length; i++) total += weight(cand[i]);
            r = rng() * total;
            for (i = 0; i < cand.length; i++) { r -= weight(cand[i]); if (r <= 0) break; }
            w = cand[Math.min(i, cand.length - 1)];
            out.push(w); pool.splice(pool.indexOf(w), 1); last = w.kind;
        }
        var head = first && byId(first) ? out.shift() : null;
        out.sort(function (a, b) { return a.tier - b.tier; });
        if (head) out.unshift(head);
        return course('portals', 'portals', out, {});
    }

    G3.portals = {
        WORLDS: WORLDS, KINDS: KINDS, LENGTH: LENGTH,
        byId: byId,
        // …and by the Portals world its hole is played in.
        byWorld: function (world) {
            for (var i = 0; i < WORLDS.length; i++) {
                if (WORLDS[i].hole.place && WORLDS[i].hole.place.world === world) return WORLDS[i];
            }
            return null;
        },
        deal: dealJourney,
        // How a world hole is made open, unrailed and hung in the air — endless.js builds its lanes with it.
        world: world,
        // Every world as one course: the turntable, the suite and the lab.
        library: function () {
            return G3.PORTAL_LIBRARY ||
                (G3.PORTAL_LIBRARY = course('portal-library', 'portal-library', WORLDS, { name: 'Every world' }));
        },
        // One world on its own, from the gallery: a course of one hole.
        single: function (id) {
            var w = byId(id) || WORLDS[0];
            return course('world-' + w.id, 'world-' + w.id, [w], { name: w.title, single: true });
        }
    };

    // The journey in play, the way G3.SHOWCASE is.
    G3.JOURNEY = null;

    var plain = G3.courseById;
    G3.courseById = function (id) {
        id = String(id);
        if (id === 'portals') return G3.JOURNEY || (G3.JOURNEY = dealJourney());
        if (id === 'portal-library') return G3.portals.library();
        if (id.indexOf('world-') === 0 && byId(id.slice(6))) {
            if (!G3.WORLD_ONE || G3.WORLD_ONE.id !== id) G3.WORLD_ONE = G3.portals.single(id.slice(6));
            return G3.WORLD_ONE;
        }
        return plain(id);
    };

})(window.G3);
