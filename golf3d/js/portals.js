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

    // A kerb: a low rail along a segment, for the few edges a world closes.
    function kerb(x0, z0, x1, z1, y, h) {
        var len = Math.hypot(x1 - x0, z1 - z0);
        return bank((x0 + x1) / 2, (z0 + z1) / 2, len, -Math.atan2(z1 - z0, x1 - x0),
            { base: (y || 0) - 0.1, h: h === undefined ? 0.5 : h, t: 0.3 });
    }

    /* Every world is open, calm and unstaked, and its boundary is its own
       extent with room round it: off the edge is off the world, and OOB_Y is
       what ends the shot. `bare` keeps the long game's flowers and herons out
       of places that have no business growing them. */
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
           (its theme's surroundY); the rest hang in the air. */
        h.pads.forEach(function (p) { if (!p.inlay) p.hover = true; });
        h.fence = { x: minX - m, z: minZ - m, w: maxX - minX + 2 * m, d: maxZ - minZ + 2 * m };
        return A.build(h);
    }

    var ROLL = ['putter', 'mallet'];
    var LOFT = ['putter', 'mallet', 'chipper', 'wedge'];

    /* ── the worlds ─────────────────────────────────────────────────────── */

    var WORLDS = [];
    /* Which of Portals' worlds each hole is played inside, and where in it:
       `u` is how far along that world's own flight path the tee stands,
       `scale` its units to one of ours, `lift` and `turn` a nudge up and
       round (backdrop.mjs → anchorFor). */
    var PLACES = {"breakfast": ["breakfast-table"], "turtle": ["world-turtle", {"u": 0.02, "at": {"x": -95.58, "z": 148.41, "y": 150, "yaw": 0.6981, "scale": 2.5}}], "gasgiant": ["storm-bands"], "abyss": ["kelp-cathedral"], "carnival": ["carnival-on-the-frozen-river"], "mushroom": ["spore-rain"], "orrery": ["long-library"], "stairs": ["stairway-everywhere"], "attic": ["the-toppling", {"event": {"from": -0.035, "to": 0.09, "secs": 6, "at": 0.45}}], "threebody": ["airbrush-black-hole"], "clouds": ["cloud-armada"], "forge": ["obsidian-forge"], "table": ["breakfast-table", {"u": 0.3, "at": {"x": -90, "z": -47, "y": 45, "yaw": 3.1416, "scale": 3.5}}], "nave": ["kelp-cathedral", {"u": 0.3, "at": {"x": 0, "z": 50, "y": -41, "yaw": 3.1416, "scale": 3}}], "ironriver": ["obsidian-forge", {"u": 0.5, "at": {"x": -45, "z": 2.5, "y": 0, "yaw": 0, "scale": 2.5}}]};
    function add(w) {
        w.hole.scene = w.scene || w.id; w.hole.worldId = w.id;
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
       units over the sea. The fairway falls away down its spine, through a
       dip, to a ridge; from the ridge the green is across a saddle on the
       next plateau, with the sea left of everything and long of the green.

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
            var ground = on(pad(-6, -4, 52, 70, 0, 'rough'));
            ground.ghost = true;
            var sea = A.rect(-30, -30, 100, 120, 0.15);
            sea.ghost = true;
            return world({
                name: 'Across the Shell', par: 4, long: true,
                blurb: 'Off the crown of the headland, down its spine and through the dip to the ridge. The green is across the saddle to the right — and the sea is left of all of it.',
                pads: [
                    ground,
                    on(pad(6, 1, 8, 22, 0, 'fairway'), true),
                    on(pad(5, 31, 10, 12, 0, 'fairway'), true),
                    on(pad(22, 47, 6, 9, 0, 'fairway'), true),
                    on(pad(28.5, 50, 9, 9, 0, 'green'), true)
                ],
                water: [sea],
                tee: { x: 10, z: 4 }, cup: { x: 33, z: 54.5 }
            });
        })()
    });

    /* A third of a g, over the bands of a gas giant, and three balloons to
       stand on. Each of the first two has a pad in it: the floor throws the
       ball and at this weight it stays thrown for two seconds. The second
       balloon's pad is off to one side — land beside it and take two more,
       or come down on it still running and be thrown on to the third. */
    add({
        id: 'gasgiant', title: 'Balloon Hop', world: 'Living Balloons over a Gas Giant', kind: 'alien', tier: 2,
        caption: 'A third of a g, three balloons and nothing under them for a thousand miles.',
        theme: 'gasgiant',
        hole: world({
            name: 'Balloon Hop', par: 3, bag: ROLL, gravity: 0.35,
            blurb: 'The pads throw the ball and at this weight it stays thrown. Balloon to balloon — or both hops in one.',
            pads: [
                disc(4, 3.2, 3.2), sprung(4, 5.4, 0.9, 7.6),
                disc(4, 17, 5), sprung(6.4, 18.8, 1.1, 7.6),
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

    /* The sea floor, and the water is moving. Two currents and a slack
       between them: one runs north up the west side, one back south down the
       east, and the green is the bank in the middle with weed along both its
       edges and a gap in each. Ride the first and step off through its gap;
       miss it and the top current hands you to the second, which has its gap
       at the far end and a sand pocket past that. The pitch straight over
       the weed is there for anyone who wants it. */
    add({
        id: 'abyss', title: 'Slack Water', world: 'Kelp Cathedral', kind: 'ocean', tier: 2,
        caption: 'Two currents on the sea floor and a bank of still water between them. Step off at the gap.',
        theme: 'abyss',
        hole: world({
            name: 'Slack Water', grounded: true, par: 3, bag: ['putter', 'mallet', 'chipper'], gravity: 0.7,
            blurb: 'The current will take you round. Get off through the gap in the weed — or pitch straight over it.',
            pads: [
                pad(0, 0, 4.5, 5, 0, 'green'),
                belt(0.5, 5, 3, 9, 0, 3.2, { kind: 'sand' }),
                belt(0.5, 14, 12, 3, 3.2, 0, { kind: 'sand' }),
                belt(9.5, 5, 3, 9, 0, -3.2, { kind: 'sand' }),
                pad(3.5, 5.6, 6, 8.4, 0, 'green'),
                pad(8.5, 1, 5, 4, 0, 'sand')
            ],
            extra: [
                // weed: the west edge of the bank, open from z 10.6 to 12.4
                kerb(3.5, 5.6, 3.5, 10.6, 0, 0.7), kerb(3.5, 12.4, 3.5, 14, 0, 0.7),
                // …and the east edge, open from 5.6 to 7.4
                kerb(9.5, 7.4, 9.5, 14, 0, 0.7),
                // the outside of the race
                kerb(0.5, 5, 0.5, 17), kerb(0.5, 17, 12.5, 17), kerb(12.5, 5, 12.5, 17),
                kerb(8.5, 1, 13.5, 1), kerb(13.5, 1, 13.5, 5), kerb(8.5, 1, 8.5, 5),
                kerb(3.5, 5.6, 8.5, 5.6, 0, 0.7)
            ],
            tee: { x: 2, z: 2.2 }, cup: { x: 6.5, z: 9.4 }
        })
    });

    /* A fair on a frozen river. The lane is ice, the loop is the ride, and
       what comes out of the loop comes out on to a rink with one round rug
       of green in the middle of it and the flag in the rug. Nothing stops on
       ice: the rug is the only place a ball comes to rest, so the shot is the
       weight that gets round the loop and no more. A skater goes round. */
    add({
        id: 'carnival', title: 'Loop and Rink', world: 'Carnival on the Frozen River', kind: 'city', tier: 2,
        caption: 'A loop-the-loop on a frozen river, and one rug of green on the rink beyond it.',
        theme: 'carnival',
        hole: world({
            name: 'Loop and Rink', grounded: true, par: 3, bag: ROLL,
            blurb: 'Round the loop and out on to the rink. Nothing stops on ice except on the rug — and the rug is where the flag is.',
            pads: [
                pad(0, 0, 4, 4, 0, 'green'),
                pad(0, 4, 4, 9, 0, 'ice'),
                pad(-3, 13, 11, 10, 0, 'ice'),
                circle(3, 18.5, 1.9, 'green')
            ],
            loops: [loop(1.5, 8, 0, 1.1, 1)],
            extra: [
                kerb(0, 0, 4, 0), kerb(0, 0, 0, 13), kerb(4, 0, 4, 13),
                kerb(-3, 13, 0, 13), kerb(4, 13, 8, 13),
                kerb(-3, 13, -3, 23), kerb(8, 13, 8, 23), kerb(-3, 23, 8, 23),
                spinner(3, 18.5, 5.4, 0.3, { spin: 0.9 })
            ],
            tee: { x: 1.5, z: 2 }, cup: { x: 3, z: 19.4 }
        })
    });

    /* A fairy ring. Eight toadstools round the flag with less than a ball
       and a half between any two, so the way in along the floor is a needle —
       and the big flat cap in front of them is a trampoline. Roll over it at
       the right pace and you come down inside the ring. Bumpers in a wood
       fire the ball like bumpers anywhere. */
    add({
        id: 'mushroom', title: 'The Fairy Ring', world: 'Spore Rain', kind: 'wild', tier: 2,
        caption: 'Toadstools in a ring round the flag, and one big cap in front of them that throws.',
        theme: 'mushroom',
        hole: world({
            name: 'The Fairy Ring', grounded: true, par: 3, bag: ROLL,
            blurb: 'The ring round the flag is a needle to thread. The big cap in front of it throws the ball over.',
            pads: [
                (function () { var p = disc(6, 9.5, 9.5); p.round = { sw: 6, se: 6, nw: 9.5, ne: 9.5 }; return p; })(),
                sprung(6, 8.2, 1.15, 6.4)
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

    /* An orrery: a brass table with three arms turning on one spindle at
       three speeds, the way the planets do, and the flag on the far side of
       all of them. Straight across is through every arm. Round the rim is
       under none of them and half as far again. */
    add({
        id: 'orrery', title: 'The Orrery', world: 'Library with a Brass Orrery', kind: 'interior', tier: 2,
        caption: 'Three brass arms on one spindle, each at its own speed, and the flag across the table.',
        theme: 'orrery',
        hole: world({
            name: 'The Orrery', grounded: true, par: 3, bag: ROLL,
            blurb: 'Three arms sweep the table at three speeds. Wait for the gap and go through the middle, or creep round the rim.',
            pads: [disc(9, 10, 9.4)],
            extra: [
                spinner(9, 10, 5.0, 0.34, { spin: 1.5 }),
                spinner(9, 10, 9.6, 0.34, { spin: -0.8, yaw: 0.7 }),
                spinner(9, 10, 14.4, 0.34, { spin: 0.45, yaw: 1.9 }),
                wall(8.4, 9.4, 1.2, 1.2, 0.9, { base: -0.1, kind: 'meteor' })
            ],
            tee: { x: 9, z: 1.5 }, cup: { x: 9, z: 18.2 }
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
       the tray by itself; what the tee decides is where on the tray. */
    add({
        id: 'attic', title: 'The Marble Run', world: 'Marble Run, Falling Dominoes', kind: 'home', tier: 1,
        caption: 'Three wooden chutes in an attic, each tipping the other way, and a tin tray at the bottom.',
        theme: 'attic',
        hole: world({
            name: 'The Marble Run', grounded: true, par: 3, bag: ['putter', 'chipper', 'wedge'],
            blurb: 'Let it go and the run will take it to the tray, a long putt from the flag. Or pitch straight off the top and miss out all three chutes.',
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
                kerb(16.4, 0.4, 16.4, 6.6, 3.2, 2.4), kerb(13.4, 6.6, 16.4, 6.6, 3.2, 1.4),
                kerb(3.4, 4, 13.4, 4, 1.4, 2.4), kerb(3.4, 6.6, 13.4, 6.6, 1.4, 2.4),
                kerb(0.4, 4, 0.4, 10.6, 0.5, 1.6), kerb(0.4, 4, 3.4, 4, 1.2, 1.0), kerb(0.4, 10.6, 3.4, 10.6, 0.5, 0.9),
                kerb(3.4, 6.6, 3.4, 8, 0.5, 1.5), kerb(13.4, 3, 13.4, 4, 3.2, 2.6),
                kerb(3.4, 8, 9.4, 8, 0.1, 1.0), kerb(3.4, 10.6, 9.4, 10.6, 0.1, 1.0),
                kerb(9.4, 6.8, 16.4, 6.8), kerb(16.4, 6.8, 16.4, 13.8), kerb(9.4, 13.8, 16.4, 13.8),
                kerb(9.4, 6.8, 9.4, 8), kerb(9.4, 10.6, 9.4, 13.8),
                post(12.6, 10.4), post(13.4, 12.6), post(15.2, 10.2)
            ],
            tee: { x: 1.4, z: 1.7 }, cup: { x: 14.3, z: 11.8 }
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

    /* An armada of airships at sunset, and a par five flown from deck to
       deck: three carries of a drive each at seven tenths of a g, where
       everything carries half as far again as it does at home. Each deck is
       smaller than the last and the last is the green. Short is the sky. */
    add({
        id: 'clouds', title: 'Deck to Deck', world: 'The Cloud Armada', kind: 'sky', tier: 3,
        caption: 'A par five across four decks in the sky, at seven tenths of a g.',
        theme: 'clouds',
        hole: world({
            name: 'Deck to Deck', par: 5, long: true, gravity: 0.7,
            blurb: 'Three carries and a putt. Everything flies half as far again up here — pick the club for the gap, not for the yardage you know.',
            pads: [
                disc(8, 6, 6, 0, 'fairway'),
                disc(3, 40, 9, 0, 'fairway'),
                disc(17, 74, 8, 0, 'fairway'),
                disc(8, 106, 7.5, 0, 'fairway'),
                circle(8, 106, 4.8, 'green')
            ],
            tee: { x: 8, z: 4 }, cup: { x: 8, z: 107 }
        })
    });

    /* The forge, and the last of a journey that gets this far. A conveyor
       runs at a hammer that comes down across it; past the hammer the floor
       stops at a river of iron and a pad throws whatever reaches it over to
       the anvil, which is a bowl with the flag in it. All of it on one swing
       if the hammer is up. */
    add({
        id: 'forge', title: 'The Forge', world: 'Black Glass and Lava', kind: 'bizarre', tier: 3,
        caption: 'A conveyor, a hammer, a river of iron and an anvil with a flag in it.',
        theme: 'forge',
        hole: world({
            name: 'The Forge', grounded: true, par: 4, bag: ROLL,
            blurb: 'The belt runs at the hammer. Past it the floor throws you over the iron, on to the anvil.',
            pads: [
                pad(0, 0, 6, 5, 0, 'green'),
                belt(1.5, 5, 3, 9, 0, 2.6),
                pad(0, 14, 6, 6, 0, 'green'),
                sprung(3, 18.4, 1.1, 9.5),
                (function () {
                    var p = disc(3, 29, 4.2, 1.2);
                    p.bumps = [channel(3, 29, 3.9, 2.0, 0.7)];
                    return p;
                })()
            ],
            water: [A.rect(-6, 20, 18, 4.6, -0.3)],
            extra: [
                kerb(0, 0, 6, 0), kerb(0, 0, 0, 5), kerb(6, 0, 6, 5), kerb(0, 5, 1.5, 5), kerb(4.5, 5, 6, 5),
                kerb(1.5, 5, 1.5, 14), kerb(4.5, 5, 4.5, 14),
                kerb(0, 14, 1.5, 14), kerb(4.5, 14, 6, 14), kerb(0, 14, 0, 20), kerb(6, 14, 6, 20),
                slider(1.5, 9.4, 1.6, 0.5, { axis: 'x', amp: 0.7, speed: 1.7, h: 0.8 }),
                bank(1.2, 18.6, 2.6, -0.6), bank(4.8, 18.6, 2.6, 0.6)
            ],
            tee: { x: 3, z: 2 }, cup: { x: 3, z: 29 }
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
       is laid on it is a tee, the deck, a strip down the ridge and a green. */
    add({
        id: 'ironriver', title: 'The Iron River', world: 'Black Glass and Lava', kind: 'bizarre', tier: 3,
        caption: 'A par four off a bridge of black glass, across a canyon of lava and down the far bank. The canyon is the world\'s own.',
        theme: 'ironriver',
        hole: (function () {
            var G = (G3.TOUR_GROUND || {}).ironriver, field = G ? [{ grid: G }] : [];
            function on(p, inlay) { p.field = field; if (inlay) p.inlay = true; return p; }
            var ground = on(pad(-8, -8, 66, 64, 0, 'rough'));
            ground.ghost = true;
            var lava = A.rect(-30, -30, 120, 120, 0.15);
            lava.ghost = true;
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
            var ground = on(pad(-24, -3, 48, 79, 0, 'rough'));
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
                    on(pad(-0.1, 24.5, 2.5, 2.5, 0, 'green'), true)
                ],
                tee: { x: 0, z: 0 }, cup: { x: 1.14, z: 25.7 }
            });
        })()
    });

    /* ── the shelves ────────────────────────────────────────────────────── */

    var KINDS = {
        home: 'At home', wild: 'Wilderness', ocean: 'Oceans', sky: 'Skies', city: 'Cities',
        interior: 'Interiors', alien: 'Alien', bizarre: 'Bizarre', after: 'After an artist'
    };

    /* ── the palettes ───────────────────────────────────────────────────── */

    var THEMES = {
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
            grass: ['#1f8f7a', '#1a806d'], rail: 0x3fe0b0, machine: 0x8dfcff,
            cloudLum: 0.08, birds: false,
            surroundY: -0.42, surround: 'rock', ground: '#0c3440',
            water: 0x0d5f78, side: '#0e4a52'
        },
        // The same sea, for the hole that lies on its bed: sand, not a mat.
        nave: {
            sky: [0x021420, 0x0b4f66], fog: 0x0a4358,
            sun: 0x9fe8ff, sunPos: [3, 18, 4], ambient: 0x2a8aa0, ambientI: 0.85,
            grass: ['#3f9c8c', '#378c7d'], rail: 0x3fe0b0, machine: 0x8dfcff,
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
            sun: 0xd8ffc0, sunPos: [-6, 14, 5], ambient: 0x5fae7a, ambientI: 0.8,
            grass: ['#3b8f45', '#327e3c'], rail: 0xf2e6c8, machine: 0xff5d5d,
            stars: 0.3, cloudLum: 0.15, birds: false,
            surroundY: -0.42, surround: 'floor', floor: '#14301c',
            water: 0x2b6f8f, side: '#3a2a1a'
        },
        orrery: {
            sky: [0x0a0c1c, 0x2a2440], fog: 0x241f38,
            sun: 0xffe4b0, sunPos: [5, 15, -5], ambient: 0x8a7a9c, ambientI: 0.8,
            grass: ['#1f4f4a', '#1a4540'], rail: 0xd9a441,
            stars: 1, cloudLum: 0.08, birds: false,
            surroundY: -0.42, surround: 'floor', floor: '#2a1c16',
            water: 0x2b6f8f, side: '#8a6a2a'
        },
        stairs: {
            sky: [0xd9d4c6, 0xf4f1e8], fog: 0xf0ede3,
            sun: 0xffffff, sunPos: [-8, 12, -6], ambient: 0xcfcabb, ambientI: 0.75,
            grass: ['#8d8a80', '#817e74'], rail: 0x2b2a27, machine: 0x1c1b19,
            cloudLum: 1, birds: false, motes: false,
            surroundY: -40, surround: 'floor', floor: '#e6e2d6',
            water: 0x9a978c, side: '#bdb9ac'
        },
        attic: {
            sky: [0x3a2a1e, 0xc98f58], fog: 0xb07d4c,
            sun: 0xffd9a0, sunPos: [-10, 9, 4], ambient: 0xb98a5c, ambientI: 0.75,
            grass: ['#5d8f8a', '#52807b'], rail: 0xe9c48a,
            cloudLum: 0.3, birds: false, motes: true,
            surroundY: -0.42, surround: 'floor', floor: '#5a3d26',
            water: 0x2b6f8f, side: '#8a5f38'
        },
        threebody: {
            sky: [0x02030a, 0x1a0f2e], fog: 0x120a22,
            sun: 0xffd9a0, sunPos: [-7, 11, 9], ambient: 0x8a6cff, ambientI: 0.8,
            grass: ['#0d0a1e', '#0a0818'], rail: 0xffb347,
            glow: true, motes: false,
            grid: { colour: '#ffb347', floor: '#5a3cff', every: 1, floorEvery: 3 },
            grade: { bloom: 0.22, threshold: 0.62, rays: 0, exposure: 0.74, contrast: 1.12,
                saturation: 1.15, vignette: 0.45, grain: 0.02, aberration: 1.0,
                lift: [0, 0, 0], tint: [1, 1, 1] },
            machine: 0xffb347, stars: 1, cloudLum: 0.1, birds: false,
            surroundY: -0.42, surround: 'floor', floor: '#04030c',
            water: 0xffb347, side: '#150d30'
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
    function dealJourney(rng, save, first) {
        rng = rng || Math.random;
        var pool = WORLDS.slice(), out = [], last = null, i, w;
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
