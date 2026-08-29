/* Six courses of six holes, as data.

   A hole is a set of pads (the ground), a set of walls (things that bounce),
   a set of water rectangles (things that punish), a tee and a cup. Everything
   else — where the rails go, how high the cup sits, where the camera should
   look — is derived below, because a hole that has to repeat itself is a hole
   that will one day disagree with itself.

   Five of the six courses are mini golf. The last one, Ashdown Park, is the
   long game — tee, fairway, rough, sand, trees, green — and it is authored
   through `bands` and `tree` rather than a hole at a time; see the comment
   above them. It uses the same pads, the same walls and the same solver as
   everything else, which is the point: a parkland hole is not a different
   game, it is the same one written wider.

     pad     an axis-aligned patch of ground, flat or tilted. `kind` picks the
             friction: green (quickest), fairway (mown longer, so a driver
             runs about a fifth less), wood (bridges: slick), sand (a bunker
             eats a shot), rough. Pads do not overlap unless one is a bridge
             clearly above another.
     wall    a box with a base and a height. `yaw` turns it, `move` slides it
             on a sine, `spin` rotates it. A ball higher than the top flies
             over; a ball under the base rolls beneath.
     water   a rectangle with a surface height. There is no pad above it, so
             the ball falls in and splashes: one stroke, replay the shot.

   Rails are generated, not authored. `enclose()` walks the boundary of the
   pad union and puts a rail on every edge that does not have a neighbouring
   pad at the same height — so a hole is drawn by listing its floor, and the
   fences follow. Where a hole wants an open edge (a shoreline, a ledge, a
   drop) it lists a `gaps` rectangle and no rail is built inside it.

   Three rules a new hole has to respect, all asserted in tests.html rather
   than left to memory:

   - No wall thinner than 0.24 units. Substepping caps ball travel at half a
     radius (0.08) per step, which is what stops the ball tunnelling. A
     thinner wall is outside that guarantee.
   - A moving gate or a spinning blade must always leave a gap wider than the
     ball. It is easy to write an amplitude that seals the hole shut at one
     phase of the sine and only fails for players with bad timing; the bot in
     tests.html plays every hole with random timing and will not finish one
     that can be closed.
   - A hole flagged `needsLoft` has to stay unplayable along the floor. The
     bot replays those with the lofted clubs taken out of the bag and has to
     fail; a rail that shrinks or a step that flattens would otherwise quietly
     open a ground route and nobody would notice the hole had lost its point.
     Holes without the flag are free to have a flat answer, and several
     deliberately do. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;

    /* ── authoring helpers ──────────────────────────────────────────────── */

    function pad(x, z, w, d, y, kind, sx, sz) {
        return { x: x, z: z, w: w, d: d, y: y || 0, kind: kind || 'green', sx: sx || 0, sz: sz || 0 };
    }

    function wall(x, z, w, d, h, opts) {
        var o = opts || {};
        return {
            x: x, z: z, w: w, d: d, h: h === undefined ? 0.6 : h,
            base: o.base === undefined ? -0.4 : o.base,
            yaw: o.yaw || 0,
            move: o.move || null,
            spin: o.spin || 0,
            kind: o.kind || 'rail'
        };
    }

    // A blade or bat that turns about its own centre, authored the way you
    // think about it: middle, length, thickness.
    function spinner(cx, cz, len, thick, opts) {
        var o = opts || {};
        return wall(cx - len / 2, cz - thick / 2, len, thick, o.h || 0.6, {
            base: o.base === undefined ? -0.1 : o.base,
            spin: o.spin === undefined ? 1.6 : o.spin,
            yaw: o.yaw || 0,
            kind: 'blade'
        });
    }

    // A gate that slides back and forth on a sine.
    function slider(x, z, w, d, opts) {
        var o = opts || {};
        return wall(x, z, w, d, o.h || 0.6, {
            base: o.base === undefined ? -0.1 : o.base,
            move: { axis: o.axis || 'x', amp: o.amp, speed: o.speed, phase: o.phase || 0 },
            kind: 'gate'
        });
    }

    /* A bar held up off the ground on two posts, returned as the three walls it
       is made of. A rolling ball passes under the bar and a lofted one does
       not, which makes it the one obstacle in the game that punishes loft
       instead of rewarding it: the underside clears a resting ball's crown and
       the first hop after a chip, and the top is out of reach of the highest
       club in the bag. Put one in front of a green and the wedge becomes the
       wrong answer.

       The posts are real walls rather than scenery, for the same reason the
       blades are: a leg the ball passes through is a leg that lies about where
       the hole is. They also do the explaining. A bar hanging in mid-air reads
       as a wall from the tee however carefully it is lit — put it on two legs
       and it reads as a doorway, which is the one thing the player has to
       understand before taking the shot. Author them at the edges of the lane
       and they cost nothing to play through. */
    function beam(x, z, w, d, opts) {
        var o = opts || {};
        var base = o.base === undefined ? 0.55 : o.base;
        var h = o.h === undefined ? 1.35 : o.h;
        var t = o.post === undefined ? 0.28 : o.post;
        var flat = w >= d;                       // which way the bar runs
        function post(px, pz) {
            return wall(px, pz, flat ? t : w, flat ? d : t, base + 0.4,
                { base: -0.4, kind: 'beam' });
        }
        return [
            wall(x, z, w, d, h, { base: base, kind: 'beam' }),
            post(x, z),
            flat ? post(x + w - t, z) : post(x, z + d - t)
        ];
    }

    // Four walls round a rectangle: a pen with no door, so the only way in is
    // over the top. Authored as the outer footprint, like a wall.
    function pen(x, z, w, d, opts) {
        var o = opts || {};
        var t = o.t === undefined ? 0.30 : o.t;
        var b = { base: o.base === undefined ? -0.1 : o.base, kind: o.kind || 'rail' };
        var h = o.h === undefined ? 0.65 : o.h;
        return [
            wall(x, z, w, t, h, b),
            wall(x, z + d - t, w, t, h, b),
            wall(x, z + t, t, d - 2 * t, h, b),
            wall(x + w - t, z + t, t, d - 2 * t, h, b)
        ];
    }

    /* A bumper: a short square post the ball comes off at speed, and the one
       obstacle on the crazy courses that is not there to stop you. A rail
       redirects a ball along itself; a post standing in open ground sends it
       somewhere neither of you chose, and a field of them is a hole you play
       by percentage rather than by line.

       Square rather than round because the solver only knows boxes, and 0.5
       across because that is comfortably over the 0.24 the substepping
       guarantees while still being small enough that the gaps between them are
       the hole rather than the walls are. */
    function bumper(cx, cz, size, opts) {
        var o = opts || {};
        var s = size === undefined ? 0.5 : size;
        return wall(cx - s / 2, cz - s / 2, s, s, o.h === undefined ? 0.5 : o.h,
            { base: -0.1, kind: 'bumper' });
    }

    /* A funnel green: a flat floor, four ramps up to a rim, and four corners
       that are the two ramps beside them added together. That last part is the
       whole trick — a corner built as the sum of its neighbours meets both of
       them exactly, so the nine pads tile without a single step for the ball to
       stub its toe on, and the seams are invisible to the physics as well as
       the eye. Land anywhere inside and the ground does the rest.

       `outer` is the width of the whole dish, `flat` the floor in the middle
       (which is where the cup goes — the tests want the mouth of the cup a
       clear radius inside one pad, and a cup on a seam would not be), and
       `rise` how far the rim stands above the floor. */
    function bowl(cx, cz, outer, flat, rise) {
        var a = outer / 2, b = flat / 2, run = a - b, k = rise / run;
        function q(x, z, w, d, y, sx, sz) { return pad(x, z, w, d, y, 'green', sx, sz); }
        return [
            q(cx - b, cz - b, flat, flat, 0, 0, 0),               // the floor
            q(cx - a, cz - b, run, flat, rise, -k, 0),            // west ramp
            q(cx + b, cz - b, run, flat, 0, k, 0),                // east ramp
            q(cx - b, cz - a, flat, run, rise, 0, -k),            // south ramp
            q(cx - b, cz + b, flat, run, 0, 0, k),                // north ramp
            q(cx - a, cz - a, run, run, 2 * rise, -k, -k),        // and the corners
            q(cx + b, cz - a, run, run, rise, k, -k),
            q(cx - a, cz + b, run, run, rise, -k, k),
            q(cx + b, cz + b, run, run, 0, k, k)
        ];
    }

    /* ── the long game ──────────────────────────────────────────────────

       Everything above is mini golf: a lane, a rail, an obstacle in the middle
       of it. The parkland course at the bottom of this file is not, and it is
       authored differently, because a full-size hole is not a lane — it is a
       stack of strips running from the tee up to the green, and the interest
       is in which strip you land on.

       `bands` lays them out. A row is a depth followed by cells laid west to
       east from x = 0: [width, kind] and, for a bunker, [width, kind, y]. A
       null kind leaves a hole in the ground, which is where a lake goes — the
       water rectangle goes under it and the shoreline into `gaps`, exactly as
       on the older holes.

       Two things fall out of this for free. Cells of different kinds at the
       same height are neighbours, so `enclose` puts no rail between a fairway
       and its rough: the only rails a parkland hole gets are the ones around
       the outside of the whole property, which is what the boundary fence of a
       real course is. And a bunker sitting a hand's breadth below the grass is
       a step the ball can roll into and — just — climb back out of, because
       DIP is inside CONFIG.STEP_UP. Any deeper and a bunker would be a well. */
    var DIP = -0.12;

    function bands(z0, rows) {
        var pads = [], z = z0, i, j, row, c, x;
        for (i = 0; i < rows.length; i++) {
            row = rows[i];
            x = 0;
            for (j = 1; j < row.length; j++) {
                c = row[j];
                if (c[1]) pads.push(pad(x, z, c[0], row[0], c[2] || 0, c[1]));
                x += c[0];
            }
            z += row[0];
        }
        return merge(pads);
    }

    /* Bands are how a hole is *written*; they are not how it should be drawn.
       Eight rows of a course that is rough down the left the whole way is
       eight identical strips of rough, and each one costs a slab, a stack of
       grass shells and a walk round its own boundary. So the rows are glued
       back together afterwards: two pads of the same kind, the same width and
       the same height, one ending where the other begins, are one pad.

       This is invisible everywhere else. The seam it removes was a seam the
       physics could not feel and the eye could not see — the surfaces tile in
       world space — and `enclose` gives exactly the same rails either way,
       because it already refused to fence an edge with a neighbour behind it. */
    function merge(pads) {
        var changed = true, i, j, a, b;
        while (changed) {
            changed = false;
            for (i = 0; i < pads.length && !changed; i++) {
                for (j = i + 1; j < pads.length && !changed; j++) {
                    a = pads[i]; b = pads[j];
                    if (a.kind !== b.kind || a.x !== b.x || a.w !== b.w || a.y !== b.y) continue;
                    if (a.sx || a.sz || b.sx || b.sz) continue;
                    if (Math.abs(a.z + a.d - b.z) > 1e-9 && Math.abs(b.z + b.d - a.z) > 1e-9) continue;
                    a.d += b.d;
                    a.z = Math.min(a.z, b.z);
                    pads.splice(j, 1);
                    changed = true;
                }
            }
        }
        return pads;
    }

    /* A tree, authored by its middle the way you would point at one.

       The solid part is the trunk and only the trunk. That is not a shortcut:
       nothing in the bag lifts a ball much above a metre and a half — the
       wedge tops out at about 1.6 — so a tree is a thing you go *round*, and
       making the canopy solid as well would only mean the ball stopping in
       mid-air. The trunk is well over the 0.24 the substepping guarantees, and
       the renderer puts the canopy on top of it. */
    function tree(cx, cz, opts) {
        var o = opts || {};
        var t = o.t === undefined ? 0.62 : o.t;
        return wall(cx - t / 2, cz - t / 2, t, t, o.h === undefined ? 2.4 : o.h,
            { base: -0.4, kind: 'tree' });
    }

    // A stand of them along a line. A treeline is never one tree.
    function treeline(x0, z0, x1, z1, n, opts) {
        var out = [], i, f;
        for (i = 0; i < n; i++) {
            f = n === 1 ? 0.5 : i / (n - 1);
            out.push(tree(x0 + (x1 - x0) * f, z0 + (z1 - z0) * f, opts));
        }
        return out;
    }

    /* ── the open country ───────────────────────────────────────────────

       Everything above is a floor plan: rectangles of ground with fences round
       them, which is what mini golf is and what a parkland hole turned out to
       be as well. Whinstone Links is neither. It is one piece of rolling
       ground running to the horizon, and the three things it needed are all
       here.

       `hill` is a hump: a rise of `a` at (cx, cz) fading to nothing at radius
       r. Add them to a pad's `bumps` and the pad stops being flat — physics.js
       explains the profile, and the short version is that it is smooth at the
       top and smooth at the foot, so a course made of them has no creases in
       it anywhere. A negative `a` is a hollow, which is the same thing and
       does most of the work: dunes are the walls of the hollows between them.

       `dunes` scatters a field of them from a seed, so the ground is different
       on every hole and the same on every load. It takes a list of circles to
       stay out of — a green wants flat ground, and so does a tee — because a
       hump that wandered under the pin would be a hole nobody authored.

       `green` is a disc: a round green laid into the ground rather than cut
       out of it. It overlaps the terrain under it on purpose and wins, because
       `surfaceUnder` prefers an inlay at the same height (physics.js). That is
       the one thing on this course that is not just data — and it is what
       makes a round green possible at all, since the alternative is cutting a
       circular hole in a rectangle and there is no rectangle that does that. */

    function hill(cx, cz, r, a) { return { cx: cx, cz: cz, r: r, a: a }; }

    /* A ring of humps standing round a point. Overlapping, they add into one
       continuous rim rather than a circle of molehills, which is a punchbowl
       green — and with `a` negative, a dell. `radius` has to be more than `r`
       clear of anything that must stay flat, because a hump's tail reaches
       back that far. */
    function ring(cx, cz, radius, r, a, n) {
        var out = [], i, t;
        for (i = 0; i < n; i++) {
            t = i / n * Math.PI * 2;
            out.push(hill(cx + Math.cos(t) * radius, cz + Math.sin(t) * radius, r, a));
        }
        return out;
    }

    // A small deterministic generator, so a hole's dunes are the same dunes
    // every time the page loads. Nothing here may ever call Math.random: a
    // course that reshuffles itself is a course the tests cannot make any
    // statement about.
    function seeded(seed) {
        var t = seed >>> 0;
        return function () {
            t = (t + 0x6d2b79f5) >>> 0;
            var x = Math.imul(t ^ (t >>> 15), 1 | t);
            x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
            return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
        };
    }

    /* A field of humps.

       `grad` is the steepest gradient a single hump reaches, not its height —
       which is the number that decides how the course plays, because it is
       what CONFIG.HOLD is compared against. A hump's peak gradient is
       a·π/2r, so asking for a gradient rather than a height is what stops a
       small hump from being a cone and a large one from being a lawn: they
       come out the same steepness and different sizes, which is what a dune
       field looks like. Overlapping humps add, so the ground between them
       reaches half again as steep, and that is where the interest is. */
    function dunes(area, n, seed, opts) {
        var o = opts || {};
        var rnd = seeded(seed);
        var clear = o.clear || [];
        var lo = o.r === undefined ? 5 : o.r, hi = o.rMax === undefined ? 11 : o.rMax;
        var grad = o.grad === undefined ? 0.2 : o.grad;
        var out = [], tries = 0, i;
        while (out.length < n && tries++ < n * 40) {
            var r = lo + rnd() * (hi - lo);
            var cx = area.x + rnd() * area.w;
            var cz = area.z + rnd() * area.d;
            // Fade to nothing before the edge of the ground, or the horizon
            // gets a lip on it where the terrain meets the country beyond.
            if (cx - r < area.x || cx + r > area.x + area.w) continue;
            if (cz - r < area.z || cz + r > area.z + area.d) continue;
            var ok = true;
            for (i = 0; i < clear.length; i++) {
                var c = clear[i];
                if (Math.hypot(cx - c.x, cz - c.z) < r + c.r) { ok = false; break; }
            }
            if (!ok) continue;
            // Hollows outnumber hills, because a links is a field of dips with
            // the ground between them left standing.
            var g = grad * (0.5 + rnd() * 0.5) * (rnd() < 0.58 ? -1 : 1);
            out.push(hill(cx, cz, r, g * 2 * r / Math.PI));
        }
        return out;
    }

    // A rectangle of rolling ground.
    function ground(x, z, w, d, kind, bumps) {
        var p = pad(x, z, w, d, 0, kind);
        p.bumps = bumps || [];
        return p;
    }

    // A round green, laid into whatever it is standing on.
    function circle(cx, cz, r, kind, y) {
        var p = pad(cx - r, cz - r, 2 * r, 2 * r, y || 0, kind || 'green');
        p.r = r;
        p.inlay = true;
        return p;
    }

    function keep(x, z, r) { return { x: x, z: z, r: r }; }

    function rect(x, z, w, d, y) { return { x: x, z: z, w: w, d: d, y: y === undefined ? -0.6 : y }; }

    /* ── relief on a drawn hole ─────────────────────────────────────────

       `dunes` above shapes open country, where nothing has an edge that
       matters: the ground runs to the fog in every direction and a hump may
       land wherever it likes. A drawn hole is the opposite. Every edge on one
       means something — a rail is generated from where the ground *stops*, a
       step is the difference between two pads, a shoreline is a pad edge
       beside a water rectangle, and a ramp meets the flat at a seam the ball
       rolls over. Move any of those by a centimetre and the hole stops being
       the hole that was tested.

       So relief here obeys one rule that `dunes` does not need: **a hump lives
       entirely inside one pad**. The raised cosine is exactly zero at its own
       radius, so a hump whose disc fits inside a pad's footprint cannot change
       the height of that pad's edge by anything at all. Every rail, every
       step, every shoreline, every ramp junction and every bridge comes out
       exactly as authored, and only the middle of the ground rolls. That is
       what makes it safe to switch on for thirty holes that were drawn flat.

       Two more rules come from the tests rather than the geometry. Nothing
       rolls under the tee or the cup — a lie has to be readable from where you
       are standing, and a cup has to sit on ground that will hold a ball
       beside it. And the gradient stays well inside the surface's own angle of
       repose (CONFIG.HOLD), because a green that sheds a ball everywhere is
       not a green, it is a roof. */

    /* How much room there is at a point before the pad runs out — the
       largest hump that can stand there without touching the edge. Zero on
       the boundary, largest in the middle, negative outside, and the same
       answer for a disc pad as for a rectangular one. */
    function roomIn(pad, cx, cz) {
        if (pad.r) {
            return pad.r - Math.hypot(cx - (pad.x + pad.w / 2), cz - (pad.z + pad.d / 2));
        }
        return Math.min(cx - pad.x, pad.x + pad.w - cx,
                        cz - pad.z, pad.z + pad.d - cz);
    }

    /* Scatter humps inside one pad, and only inside it.

       `grad` asks for a steepest gradient and `amp` for a height; a caller
       gives one or the other. Gradient is the right currency for grass, where
       what matters is whether the ball stays put, and height is the right one
       for a bunker floor, where what matters is how deep the thing is.

       The spot is picked first and the size second, which is the whole reason
       this fills a mini golf lane at all. Drawing a radius and then hunting
       for somewhere to put it throws away nineteen spots in twenty on ground
       six units wide with a tee at one end of it — and it throws away the
       *interesting* ones, the corners and the edges, because those are exactly
       where a large hump does not fit. Asking a spot how much room it has and
       sizing the hump to the answer keeps them, and it makes the humps shrink
       towards the edges of a pad on their own, which is what ground does.

       Peaks do not stack. A new hump keeps clear of the middle of every one
       already placed and is sized to stay clear of it, so two of them add
       across their skirts — where the interesting ground is — and never at
       their summits, where the sum would be twice what was asked for and
       nobody would notice until a green stopped holding. */
    function relief(pad, rnd, opts) {
        var lo = opts.r, hi = Math.max(opts.r, opts.rMax);
        var clear = opts.clear || [], out = [], tries = 0, i, r, cx, cz, a, room, d;
        while (out.length < opts.n && tries++ < opts.n * 120) {
            cx = pad.x + rnd() * pad.w;
            cz = pad.z + rnd() * pad.d;
            room = roomIn(pad, cx, cz);
            for (i = 0; i < clear.length && room >= lo; i++) {
                d = Math.hypot(cx - clear[i].x, cz - clear[i].z) - clear[i].r;
                if (d < room) room = d;
            }
            for (i = 0; i < out.length && room >= lo; i++) {
                d = Math.hypot(cx - out[i].cx, cz - out[i].cz);
                if (d < out[i].r * 0.7) { room = -1; break; }
                if (d / 0.7 < room) room = d / 0.7;
            }
            if (room < lo) continue;
            r = lo + rnd() * (Math.min(hi, room) - lo);
            a = opts.amp === undefined
                ? opts.grad * (0.45 + rnd() * 0.55) * 2 * r / Math.PI
                : opts.amp * (0.55 + rnd() * 0.45);
            // Hollows outnumber hills, on grass because a hollow is what the
            // eye reads as ground rather than as an obstacle, and in sand
            // because a bunker is a hole with a lip on it.
            if (rnd() < opts.hollow) a = -a; else a *= (opts.up === undefined ? 1 : opts.up);
            out.push(hill(cx, cz, r, a));
        }
        return out;
    }

    // Which surfaces roll. Sand gets `scoop` instead, boards stay boards, and
    // the cup floor is not a pad anybody authored.
    var ROLLS = { green: 1, fairway: 1, rough: 1 };
    var MIN_ROLL_AREA = 18;      // square units of pad before it is worth rolling
    var MIN_ROLL_SIDE = 3.6;     // …and how narrow it is allowed to be

    /* Gentle undulation across the grass of a drawn hole. The numbers are
       small on purpose: 0.075 of gradient is a little over four degrees, and
       CONFIG.HOLD.green is 0.18, so the steepest ground a putt ever crosses is
       still comfortably inside what a green will hold a stopped ball on. What
       it changes is not where the ball ends up so much as how the hole reads —
       light and shade across a surface that used to be one flat tone. */
    function contour(pads, spec) {
        var o = spec || {}, i, p, span, n, b;
        var rnd = seeded(o.seed || 7);
        var lo = o.r === undefined ? 1.1 : o.r;
        var hi = o.rMax === undefined ? 2.9 : o.rMax;
        for (i = 0; i < pads.length; i++) {
            p = pads[i];
            if (!ROLLS[p.kind]) continue;
            // A ramp, a bank and an inlaid green are shapes somebody drew on
            // purpose; this is for the ground that was left flat.
            if (p.sx || p.sz || p.r || p.inlay) continue;
            /* Big enough for the roll to be ground rather than an ambush.
               A stepping stone is a place you have to land the ball and have
               it *stay*, and a hollow across most of one is not undulation, it
               is a funnel pointing at the water — Tidewater's middle island is
               3.4 units across and the bot stopped being able to finish the
               hole the moment it got one. Anything narrower than a mini golf
               lane keeps the shape it was drawn with. */
            span = Math.min(p.w, p.d) / 2;
            if (span < lo || p.w * p.d < MIN_ROLL_AREA || Math.min(p.w, p.d) < MIN_ROLL_SIDE) continue;
            n = Math.max(1, Math.round(p.w * p.d * (o.density === undefined ? 0.055 : o.density)));
            b = relief(p, rnd, {
                r: lo, rMax: hi, n: n, clear: o.clear,
                grad: o.grad === undefined ? 0.075 : o.grad, hollow: 0.58
            });
            if (b.length) p.bumps = (p.bumps || []).concat(b);
        }
        return pads;
    }

    /* And the bunkers. A bunker used to be a beige rectangle a hand's breadth
       below the grass, which is a step you can see and a shape you cannot: from
       the tee it read as a patch of the wrong colour rather than as a hole in
       the ground. What it was missing is the thing that makes a real one
       legible at two hundred yards — a floor that dishes away from you and a
       lip standing over it, so the near edge is in light and the far wall is
       in shadow.

       Both are humps inside the sand's own footprint, which means the cut edge
       where the sand meets the grass is exactly where it was, the rails are
       exactly where they were, and nothing about the hole's plan has moved.
       Three quarters of them are hollows and the rest are the low shoulders
       between, kept to a fraction of the depth, because sand piled higher than
       that stops reading as sand.

       Depth is bounded and tests.html measures it: the floor of a bunker may
       fall away smoothly, but never further than SCOOP below its own rim, and
       never at a gradient sand would not hold a ball on. A single hollow is
       authored at rather less than SCOOP because two of them still add across
       their skirts — `relief` keeps their summits apart, not their tails — and
       the number the test enforces is the one on the finished ground rather
       than the one that was asked for. */
    var SCOOP = 0.15;
    var SCOOP_AMP = SCOOP * 0.78;

    function scoop(pads, spec) {
        var o = spec || {}, i, p, span, lo, hi, area, n, b;
        var rnd = seeded(o.seed || 11);
        var depth = o.depth === undefined ? SCOOP_AMP : o.depth;
        for (i = 0; i < pads.length; i++) {
            p = pads[i];
            if (p.kind !== 'sand' || p.sx || p.sz) continue;
            /* An inlaid bunker keeps its flat floor, and this is the one place
               in the file where the renderer gets a vote.

               A bunker cut out of `bands` is a real gap in the ground: the
               fairway beside it stops at its edge and there is nothing under
               the sand to see. An inlay is not — it is laid *into* a pad that
               carries straight on underneath it, and the pad under it is drawn
               as well. render.cutUnder takes the ground away under an inlay,
               but it takes it away a *triangle* at a time and only where a
               triangle is wholly inside — so a grid cell's worth of fairway
               survives all the way round the rim, which is exactly where a
               dish is shallowest and would show it. Until the terrain mesh can
               be punched to the circle itself, an inlay is flush or it is
               wrong. What
               these bunkers get instead is the rest of the pass: the raked
               sheet and the height field under it (textures.sandTexture), which
               is most of what was missing from them anyway. */
            if (p.inlay) continue;
            span = (p.r ? p.r : Math.min(p.w, p.d) / 2) - 0.1;
            if (span < 0.5) continue;
            /* The floor first, and it is not scattered. Every bunker gets one
               hollow at its own middle, at the full depth and as wide as the
               sand is — because a bunker whose floor came out of a dice roll
               is a bunker that is sometimes a saucer and sometimes nothing at
               all, and the first pass shipped one at seven centimetres that
               read as flat from four metres away. The scatter is what happens
               *around* it: a couple more hollows and the low shoulders between
               them, kept out of the middle so they break up the rim rather
               than deepening the bowl. */
            b = [hill(p.x + p.w / 2, p.z + p.d / 2, span, -depth)];
            lo = Math.max(0.45, span * 0.45);
            hi = span * 0.85;
            area = p.r ? Math.PI * p.r * p.r : p.w * p.d;
            n = Math.max(0, Math.round(area * 0.13) - 1);
            if (n && hi > lo) {
                b = b.concat(relief(p, rnd, {
                    r: lo, rMax: hi, n: n, amp: depth * 0.55, hollow: 0.6, up: 0.5,
                    clear: [keep(p.x + p.w / 2, p.z + p.d / 2, span * 0.5)]
                }));
            }
            p.bumps = (p.bumps || []).concat(b);
        }
        return pads;
    }

    /* ── landforms ──────────────────────────────────────────────────────

       `contour` above is undulation: humps small enough to live inside one pad
       and gentle enough that what they change is how the ground *reads* rather
       than where the ball ends up. That is the right thing for a mini golf
       lane and much too polite for a full-size hole, where the shape of the
       country is supposed to be the hole. A crest you have to carry, a hollow
       that gathers, a punchbowl, a spiral of ground that will not let you read
       the putt — those are landforms, and they are bigger than any one pad.

       Which is exactly the problem `contour` was written to dodge. A hump that
       crosses from the fairway to the rough beside it leaves the two at
       different heights along their shared edge, and `enclose` reads that
       difference as a place where the ground stops: a fence, straight down the
       middle of a hole nobody fenced.

       `shape` is the way out, and it is the trick `moor` already plays on the
       links. Give **every pad on the hole the same field**, and the height of
       the ground becomes a function of where you are standing rather than of
       which strip you happen to be standing on. The seams stop existing — for
       the solver, for `enclose` and for the eye — and a crest can run clean
       across a hole from boundary to boundary.

       Two rules survive from `relief`, and they are the ones that matter:

       - **A landform's disc lies wholly inside the property.** The raised
         cosine is exactly zero at its own radius, so a hump that fits inside
         the outer footprint cannot move the outer edge by anything at all, and
         the boundary fence comes out exactly where it was drawn.
       - **Nothing rolls under the tee or the cup.** Same reason as before, and
         now it is checked rather than remembered: tests.html walks the ground a
         patch-width out from every cup and fails a hole whose green has been
         given a slope it will not hold a ball on. */

    function shape(pads, bumps) {
        var i;
        for (i = 0; i < pads.length; i++) {
            pads[i].bumps = (pads[i].bumps || []).concat(bumps);
        }
        return pads;
    }

    /* A ridge: overlapping humps along a line, which is how you get one long
       crest rather than a row of molehills. Each contributes a fraction of the
       height and they add along the line, so `a` is what one hump is worth and
       the crest itself comes out rather more. */
    function ridge(x0, z0, x1, z1, r, a, n) {
        var out = [], i, f;
        for (i = 0; i < n; i++) {
            f = n === 1 ? 0.5 : i / (n - 1);
            out.push(hill(x0 + (x1 - x0) * f, z0 + (z1 - z0) * f, r, a));
        }
        return out;
    }

    /* A whorl: humps and hollows walked out along a spiral, alternating sign.
       It is the one landform here with no natural analogue and it is worth
       having anyway — ground that corkscrews away from you reads as one
       readable slope from the tee and turns out to be four of them, so a putt
       across it breaks twice in opposite directions.

       Alternating the sign is what keeps it playable as well as what makes it
       turn: neighbouring humps on the spiral cancel across their skirts rather
       than adding, so the field stays inside the gradient a fairway will hold
       a ball on even where the arms of the spiral overlap. */
    function whorl(cx, cz, r0, r1, r, a, n, turns) {
        var out = [], i, f, t, rad;
        for (i = 0; i < n; i++) {
            f = n === 1 ? 0 : i / (n - 1);
            t = f * (turns === undefined ? 1.5 : turns) * Math.PI * 2;
            rad = r0 + (r1 - r0) * f;
            out.push(hill(cx + Math.cos(t) * rad, cz + Math.sin(t) * rad, r, i % 2 ? -a : a));
        }
        return out;
    }

    /* A ravine: a strip of ground lying well below what is either side of it,
       with both long seams left bare so it plays as a drop rather than as a
       walled trench. Deeper than CONFIG.STEP_UP by an order of magnitude, so a
       ball that goes in is not putted out of it — it is flown out, or it is
       played backwards, and either way it has cost you the hole. Which is what
       a barranca is for.

       It comes with its own gaps, because getting those wrong is the one way
       to build this badly: grown far enough to open both long seams and inset
       from the ends, so the boundary rail at either end of the ravine floor
       stays where it is and the hole does not quietly acquire a hole in its
       own fence. */
    function ravine(x, z, w, d, depth, kind) {
        var m = 0.45, inset = 0.6;
        return {
            pad: pad(x, z, w, d, -(depth === undefined ? 0.95 : depth), kind || 'rough'),
            gaps: [
                { x: x + inset, z: z - m, w: w - 2 * inset, d: 2 * m },
                { x: x + inset, z: z + d - m, w: w - 2 * inset, d: 2 * m }
            ]
        };
    }

    /* A seed from the hole's own name, so a hole's ground is the same ground
       on every load, no two holes on a course share a shape, and renaming one
       is the only thing that reshapes it. Nothing in this file may ever call
       Math.random — a course that reshuffles itself is a course the tests
       cannot make any statement about. */
    function nameSeed(name) {
        var h = 2166136261, i;
        for (i = 0; i < name.length; i++) {
            h ^= name.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    /* ── rail generation ────────────────────────────────────────────────── */

    var RAIL_T = 0.30;          // thickness — comfortably over the tunnelling floor
    var RAIL_H = 0.45;          // …and height, about three ball radii of kerb
    var STEP = 0.25;            // boundary sampling resolution
    var PROBE = 0.12;           // how far outside the edge we look for a neighbour

    function heightAt(pads, x, z, skip) {
        var best = null, i, h;
        for (i = 0; i < pads.length; i++) {
            if (pads[i] === skip) continue;
            if (!G3.physics.padContains(pads[i], x, z)) continue;
            h = G3.physics.padHeight(pads[i], x, z);
            if (best === null || h > best) best = h;
        }
        return best;
    }

    function inAny(rects, x, z) {
        var i;
        for (i = 0; i < (rects || []).length; i++) {
            if (x >= rects[i].x && x <= rects[i].x + rects[i].w &&
                z >= rects[i].z && z <= rects[i].z + rects[i].d) return true;
        }
        return false;
    }

    /* Walk one edge of one pad, emit a rail wherever the ground simply stops.
       Contiguous samples merge into a single wall so a straight boundary is
       one box and not forty. */
    function edgeRails(pads, p, side, gaps, out) {
        var along = (side === 'n' || side === 's') ? p.w : p.d;
        var n = Math.max(1, Math.round(along / STEP));
        var step = along / n;
        var run = null, i, t0, t1, mid, px, pz, ex, ez, hHere, hOut, open;

        for (i = 0; i < n; i++) {
            t0 = i * step; t1 = t0 + step; mid = (t0 + t1) / 2;

            if (side === 's') { ex = p.x + mid; ez = p.z; px = ex; pz = p.z - PROBE; }
            else if (side === 'n') { ex = p.x + mid; ez = p.z + p.d; px = ex; pz = ez + PROBE; }
            else if (side === 'w') { ex = p.x; ez = p.z + mid; px = p.x - PROBE; pz = ez; }
            else { ex = p.x + p.w; ez = p.z + mid; px = ex + PROBE; pz = ez; }

            hHere = G3.physics.padHeight(p, ex, ez);
            hOut = heightAt(pads, px, pz, p);
            // A neighbour at roughly the same height means the ground carries
            // on and no rail belongs here. A neighbour far below is a drop the
            // hole presumably meant, so it gets a rail unless it is in a gap.
            open = hOut !== null && Math.abs(hOut - hHere) < 0.3;
            if (!open && inAny(gaps, ex, ez)) open = true;

            if (open) {
                if (run) { out.push(railFor(p, side, run, pads)); run = null; }
            } else if (run) {
                run.t1 = t1; run.hi = Math.max(run.hi, hHere); run.lo = Math.min(run.lo, hHere);
            } else {
                run = { t0: t0, t1: t1, hi: hHere, lo: hHere };
            }
        }
        if (run) out.push(railFor(p, side, run, pads));
    }

    function railFor(p, side, run, pads) {
        // Overhang the ends by a thickness so corners meet and seal. Walls are
        // allowed to overlap; the solver resolves them one at a time.
        var a = run.t0 - RAIL_T, b = run.t1 + RAIL_T;
        var base = run.lo - 0.35;
        var h = (run.hi - run.lo) + RAIL_H + 0.35;
        if (side === 's') return wall(p.x + a, p.z - RAIL_T, b - a, RAIL_T, h, { base: base });
        if (side === 'n') return wall(p.x + a, p.z + p.d, b - a, RAIL_T, h, { base: base });
        if (side === 'w') return wall(p.x - RAIL_T, p.z + a, RAIL_T, b - a, h, { base: base });
        return wall(p.x + p.w, p.z + a, RAIL_T, b - a, h, { base: base });
    }

    function enclose(pads, gaps) {
        var out = [], i;
        for (i = 0; i < pads.length; i++) {
            edgeRails(pads, pads[i], 's', gaps, out);
            edgeRails(pads, pads[i], 'n', gaps, out);
            edgeRails(pads, pads[i], 'w', gaps, out);
            edgeRails(pads, pads[i], 'e', gaps, out);
        }
        return out;
    }

    function grow(r, m) {
        return { x: r.x - m, z: r.z - m, w: r.w + 2 * m, d: r.d + 2 * m };
    }

    // Shorelines want to be open: a rail along the water's edge would turn a
    // pond into a bumper.
    function shore(r, m) { return grow(r, m === undefined ? 0.45 : m); }

    /* And so does a ledge you are meant to be able to fall off. A pad standing
       proud of its neighbour gets a rail on both sides of the step by default,
       and on a tabletop green that rail is the difference between "land it up
       there" and "bounce it off the kerb and hope". Hand the same rectangle to
       `brink` and the step is left bare. */
    function brink(r, m) { return grow(r, m === undefined ? 0.35 : m); }

    /* ── hole assembly ──────────────────────────────────────────────────── */

    /* How much flat ground the tee and the cup keep around them. The cup's is
       the larger of the two and it is not only about the lie: the renderer
       cuts the hole out of a flat patch and stitches that patch into the
       rolling ground around it (render.addTerrain), and CUP_FLAT is the
       promise that the patch it needs is genuinely flat. TEE_FLAT is smaller
       because a tee only has to be somewhere you can read the shot from. */
    var CUP_FLAT = 1.25;
    var TEE_FLAT = 1.1;
    /* And how much of that clearing the renderer's patch actually takes: the
       half-width of the flat square it cuts the cup out of and stitches into
       the rolling ground. Comfortably inside CUP_FLAT, comfortably outside
       CONFIG.HOLE_R, and asserted to fit within every cup's own pad. */
    var CUP_PATCH = 0.8;

    function build(h) {
        var P = G3.physics;
        h.water = h.water || [];

        /* Relief, before anything is derived from the ground.

           Every drawn hole gets it — the five mini golf courses and the
           parkland one alike — off a seed made from the hole's own name, with
           the tee and the cup kept flat. An open hole does not: Whinstone
           shapes its own country through `moor`, and running this over it as
           well would be two authors arguing about the same field.

           A hole may opt out with `flat: true` if its whole point is a
           surface you can read. Nothing does yet, and the option exists so
           that the day one does, the answer is a word rather than a special
           case in here.

           `shaped: true` opts out for the opposite reason: the hole has been
           given a field of its own through `shape`, and running this over the
           top of it would be two authors arguing about the same ground — the
           same argument `open` avoids on the links. Its bunkers still get
           their dish, because `scoop` works inside one pad and has no opinion
           about the country around it; a shaped hole calls it itself. */
        if (!h.open && !h.flat && !h.shaped) {
            var seed = nameSeed(h.name);
            var keeps = [keep(h.tee.x, h.tee.z, TEE_FLAT), keep(h.cup.x, h.cup.z, CUP_FLAT)];
            scoop(h.pads, { seed: seed ^ 0x5bf03635 });
            contour(h.pads, {
                seed: seed,
                clear: keeps,
                // The long game is played over a lot more ground, so its humps
                // are longer and thinner: the same steepness spread over three
                // times the run, which is a fairway rather than a lawn.
                r: h.long ? 1.5 : 1.0,
                rMax: h.long ? 6 : 2.9,
                density: h.long ? 0.04 : 0.11,
                grad: h.long ? 0.07 : 0.075
            });
        }

        /* An open hole is not enclosed — that is what open means. There is no
           edge for `enclose` to find a rail for anyway: the ground runs past
           the fog in every direction, and what keeps the ball on the course is
           `fence`, a line you are only punished for stopping beyond. */
        h.walls = (h.open ? [] : enclose(h.pads, h.gaps || [])).concat(h.extra || []);

        /* Is this the long game? A hole made of fairway and rough is one you
           walk down with a bag; a hole made entirely of green is a lane you
           putt along, whatever else is in the way. The difference matters to
           exactly one thing — whether arriving on a green should hand you the
           putter (game.autoPutt) — and it is a property of the ground rather
           than of the course it happens to be filed under, so it is read off
           the pads rather than written on each hole by hand. */
        h.longGame = h.pads.some(function (p) {
            return p.kind === 'fairway' || p.kind === 'rough';
        });

        var t = P.surfaceTop(h, h.tee.x, h.tee.z);
        var c = P.surfaceTop(h, h.cup.x, h.cup.z);
        h.tee.y = t ? t.y : 0;
        h.cup.y = c ? c.y : 0;

        /* Bounds are what the camera frames and what the sun's shadow camera
           covers. On a fenced hole they are the ground, because the ground is
           the hole. On an open one the ground is most of a county and framing
           it would show the player a postage stamp in the middle of a field,
           so the boundary counts as the hole instead — grown by a little, so
           the stakes are inside the picture rather than on the edge of it. */
        var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, i, p;
        if (h.open && h.fence) {
            var rects = P.fenceRects(h), m = 3, q, f;
            for (q = 0; q < rects.length; q++) {
                f = rects[q];
                minX = Math.min(minX, f.x - m); maxX = Math.max(maxX, f.x + f.w + m);
                minZ = Math.min(minZ, f.z - m); maxZ = Math.max(maxZ, f.z + f.d + m);
            }
            h.bounds = { minX: minX, maxX: maxX, minZ: minZ, maxZ: maxZ };
            return h;
        }
        for (i = 0; i < h.pads.length; i++) {
            p = h.pads[i];
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x + p.w);
            minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z + p.d);
        }
        h.bounds = { minX: minX, maxX: maxX, minZ: minZ, maxZ: maxZ };
        return h;
    }

    /* ── course one: Seaside Green ──────────────────────────────────────── */

    var seaside = [
        build({
            name: 'Sea Legs', par: 3,
            blurb: 'Right, then left, then in. Find your pace before the sea does.',
            pads: [pad(0, 0, 6, 15)],
            extra: [
                wall(-0.2, 5.4, 3.6, 0.35, 0.55, { base: -0.1 }),
                wall(2.6, 9.4, 3.6, 0.35, 0.55, { base: -0.1 })
            ],
            tee: { x: 4.4, z: 1.6 }, cup: { x: 1.6, z: 13 }
        }),
        build({
            name: 'The Bend', par: 3,
            blurb: 'Left turn at the top. The corner rail is your friend.',
            pads: [pad(0, 0, 4.5, 9), pad(0, 9, 13, 4.5)],
            tee: { x: 2.25, z: 1.5 }, cup: { x: 11.5, z: 11.25 }
        }),
        build({
            name: 'Low Tide', par: 3,
            blurb: 'The bridge is the safe way. Loft is the short way.',
            pads: [pad(0, 0, 5, 5), pad(3.5, 5, 1.5, 4, 0, 'wood'), pad(0, 9, 5, 6)],
            water: [rect(0, 5, 3.5, 4, -0.55)],
            gaps: [shore(rect(0, 5, 3.5, 4))],
            tee: { x: 1.6, z: 2 }, cup: { x: 2.3, z: 12.5 }
        }),
        build({
            name: 'Sandbar', par: 3,
            blurb: 'A lane of grass through the beach. Or take the sand and suffer.',
            pads: [
                pad(0, 0, 6, 5),
                pad(0, 5, 4.5, 2.5, 0, 'sand'), pad(4.5, 5, 1.5, 2.5),
                pad(0, 7.5, 6, 7.5)
            ],
            tee: { x: 3, z: 2 }, cup: { x: 1.8, z: 13 }
        }),
        build({
            name: 'The Break', par: 3,
            blurb: 'The whole green leans east. Aim at nothing you can see.',
            pads: [pad(0, 0, 7, 14, 0.85, 'green', -0.12, 0)],
            tee: { x: 1.2, z: 1.6 }, cup: { x: 5.4, z: 11.5 }
        }),
        build({
            name: 'The Jetty', par: 3,
            blurb: 'A plank over the shallows. Nothing to bounce off but nerve.',
            pads: [
                pad(0, 0, 6, 6),
                pad(2.2, 6, 1.7, 5, 0, 'wood'),
                pad(0, 11, 6, 5)
            ],
            water: [rect(-1, 6, 8, 5, -0.7)],
            gaps: [shore(rect(-1, 6, 8, 5), 0.6)],
            tee: { x: 3, z: 2 }, cup: { x: 3, z: 13.5 }
        })
    ];

    /* ── course two: Quarry Ridge ───────────────────────────────────────── */

    var quarry = [
        build({
            name: 'Step Up', par: 3,
            blurb: 'Hit it up the ramp. Half measures roll back to you.',
            pads: [
                pad(0, 0, 6, 5),
                pad(0, 5, 6, 3, 0, 'green', 0, 0.3),
                pad(0, 8, 6, 6, 0.9)
            ],
            tee: { x: 3, z: 1.5 }, cup: { x: 3, z: 12 }
        }),
        build({
            name: 'The Drop', par: 3,
            blurb: 'Over the edge and down. Too gentle and you are swimming.',
            pads: [pad(0, 0, 5, 4, 3), pad(0, 6, 8, 8)],
            water: [rect(-2, 4, 12, 2, -0.9)],
            gaps: [shore(rect(-2, 4, 12, 2), 0.6)],
            tee: { x: 2.5, z: 1.5 }, cup: { x: 4.5, z: 11 }
        }),
        build({
            name: 'Switchback', par: 4,
            blurb: 'Up the ramp, hard left, and try not to come back down.',
            pads: [
                pad(0, 0, 4, 10),
                pad(0, 10, 4, 4, 0, 'green', 0, 0.3),
                pad(0, 14, 10, 4, 1.2)
            ],
            tee: { x: 2, z: 1.5 }, cup: { x: 8.4, z: 16 }
        }),
        build({
            name: 'The Ledge', par: 3,
            blurb: 'A metre and a half of quarry road with a long way down either side.',
            pads: [
                pad(0, 0, 5, 4, 1),
                pad(1.6, 4, 1.8, 7, 1),
                pad(0, 11, 6, 5, 1)
            ],
            water: [rect(-4, 4, 14, 7, -1.2)],
            gaps: [shore(rect(-4, 4, 14, 7), 0.6)],
            tee: { x: 2.5, z: 1.5 }, cup: { x: 3, z: 13.5 }
        }),
        build({
            name: 'Halfpipe', par: 3, bag: ['putter', 'mallet'],
            blurb: 'The gutter is blocked halfway. Ride a bank round it — flat clubs only.',
            pads: [
                pad(0, 0, 2.5, 15, 1.25, 'green', -0.5, 0),
                pad(2.5, 0, 2, 15),
                pad(4.5, 0, 2.5, 15, 0, 'green', 0.5, 0)
            ],
            extra: [wall(2.5, 7.6, 2, 0.4, 0.55, { base: -0.1 })],
            tee: { x: 3.5, z: 1.5 }, cup: { x: 3.5, z: 13 }
        }),
        build({
            name: 'The Cannon', par: 3,
            blurb: 'The ramp is not a suggestion. Hit it flat out and fly the gap.',
            pads: [
                pad(0, 0, 6, 4),
                pad(1.2, 4, 3.6, 2.5, 0, 'wood', 0, 0.45),
                pad(0, 9.5, 7, 7)
            ],
            water: [rect(-3, 6.5, 14, 3, -0.9)],
            gaps: [shore(rect(-3, 6.5, 14, 3), 0.7)],
            tee: { x: 3, z: 1.5 }, cup: { x: 3.5, z: 12.6 }
        })
    ];

    /* ── course three: Windmill Works ───────────────────────────────────── */

    var works = [
        build({
            name: 'First Gear', par: 3,
            blurb: 'One gate, one gap, and it does not wait for you.',
            pads: [pad(0, 0, 6, 14)],
            extra: [
                wall(0, 6.8, 1.5, 0.4, 0.6, { base: -0.1 }),
                wall(4.5, 6.8, 1.5, 0.4, 0.6, { base: -0.1 }),
                slider(1.6, 6.8, 1.4, 0.4, { amp: 0.75, speed: 1.6 })
            ],
            tee: { x: 3, z: 1.6 }, cup: { x: 3, z: 12 }
        }),
        build({
            name: 'The Mill', par: 3, bag: ['putter', 'mallet'],
            blurb: 'Sixty centimetres of daylight either side of the blade — and no way over it.',
            pads: [pad(0, 0, 5, 15)],
            extra: [spinner(2.5, 8, 3.6, 0.4, { spin: 1.7 })],
            tee: { x: 2.5, z: 1.6 }, cup: { x: 2.5, z: 13 }
        }),
        build({
            name: 'Double Doors', par: 3, bag: ['putter', 'driver', 'iron'],
            blurb: 'Two gates, out of step on purpose, and nothing in the bag that clears them.',
            pads: [pad(0, 0, 6, 16)],
            extra: [
                wall(0, 5, 1.4, 0.4, 0.6, { base: -0.1 }),
                wall(4.6, 5, 1.4, 0.4, 0.6, { base: -0.1 }),
                slider(1.5, 5, 1.5, 0.4, { amp: 0.8, speed: 1.5 }),
                wall(0, 10.5, 1.4, 0.4, 0.6, { base: -0.1 }),
                wall(4.6, 10.5, 1.4, 0.4, 0.6, { base: -0.1 }),
                slider(1.5, 10.5, 1.5, 0.4, { amp: 0.8, speed: 1.9, phase: Math.PI })
            ],
            tee: { x: 3, z: 1.5 }, cup: { x: 3, z: 14 }
        }),
        build({
            name: 'Turnstile', par: 4,
            blurb: 'Two blades and a bunker between them. Patience beats power.',
            pads: [
                pad(0, 0, 5, 6),
                pad(0, 6, 5, 3, 0, 'sand'),
                pad(0, 9, 5, 8)
            ],
            extra: [
                spinner(2.5, 4, 3.4, 0.4, { spin: -1.5 }),
                spinner(2.5, 11.5, 3.4, 0.4, { spin: 2.1 })
            ],
            tee: { x: 2.5, z: 1.4 }, cup: { x: 2.5, z: 15 }
        }),
        build({
            name: 'The Sweeper', par: 3,
            blurb: 'The bar runs the length of the floor. Do not be under it.',
            pads: [pad(0, 0, 7, 15)],
            extra: [
                slider(0.4, 7, 6.2, 0.4, { axis: 'z', amp: 3.2, speed: 1.1 })
            ],
            tee: { x: 3.5, z: 1.5 }, cup: { x: 5.4, z: 13 }
        }),
        build({
            name: 'Grand Finale', par: 4,
            blurb: 'Ramp, blade, water, green. In that order, if you please.',
            pads: [
                pad(0, 0, 6, 6),
                pad(0, 6, 6, 2.5, 0, 'wood', 0, 0.4),
                pad(0, 8.5, 6, 4, 1),
                pad(0, 16, 8, 6)
            ],
            water: [rect(-3, 12.5, 14, 3.5, -0.9)],
            gaps: [shore(rect(-3, 12.5, 14, 3.5), 0.7)],
            extra: [spinner(3, 10.5, 3.6, 0.4, { spin: 1.9, base: 0.9 })],
            tee: { x: 3, z: 1.5 }, cup: { x: 4, z: 19.5 }
        })
    ];

    /* ── course four: Tidewater Reach ───────────────────────────────────

       The loft course. Every hole here is built round the one thing a chip can
       do that a putt cannot — leave the ground — and each asks for it in a
       different way: carry it, drop it, land it on top of something, or (once,
       on purpose) resist the urge and keep it down. Almost nothing on this
       course can be reached along the floor, so the bag stops being a choice of
       how hard and becomes a choice of how high. */

    var tidewater = [
        build({
            name: 'Stepping Stones', par: 3, needsLoft: true,
            blurb: 'Two carries, three islands. There is no way round the water.',
            pads: [
                pad(0, 0, 5.5, 4.5),
                pad(1.2, 7, 3.4, 3.4),
                pad(0, 13.5, 6, 5.5)
            ],
            water: [rect(-4, 4.5, 14, 9, -0.7)],
            tee: { x: 2.75, z: 1.8 }, cup: { x: 3, z: 16.5 }
        }),
        build({
            name: 'Short Side', par: 3, needsLoft: true,
            blurb: 'Sand at the front, a kerb on the green, two metres behind the pin.',
            pads: [
                pad(0, 0, 6, 6),
                pad(0, 6, 6, 3, 0, 'sand'),
                pad(0, 9, 6, 3.6, 0, 'green', 0, 0.16)
            ],
            extra: [wall(-0.1, 8.75, 6.2, 0.3, 0.55, { base: -0.1 })],
            tee: { x: 3, z: 3.6 }, cup: { x: 3, z: 10.4 }
        }),
        build({
            name: 'The Letterbox', par: 3, needsLoft: true,
            blurb: 'Four walls and no door. Post it through the top.',
            pads: [pad(0, 0, 7, 13)],
            extra: pen(1.8, 6.5, 3.8, 3.8, { h: 0.6 }),
            tee: { x: 3.5, z: 1.6 }, cup: { x: 3.7, z: 8.4 }
        }),
        build({
            name: 'Tabletop', par: 3, needsLoft: true,
            blurb: 'The green is a metre up with nothing to run up. Land it or swim.',
            pads: [
                pad(0, 0, 6, 5.5),
                /* The apron runs under the table rather than up to it — pads
                   are allowed to overlap when one is clearly above the other,
                   which is the same rule that makes a bridge work. It turns a
                   missed wedge from a swim into a chip, and it is the reason
                   this hole is hard rather than cruel. */
                pad(0.2, 7.6, 6.6, 7.4),
                pad(1.2, 9, 4.6, 4.6, 0.9)
            ],
            water: [rect(-4, 5.5, 14, 9, -0.7)],
            gaps: [
                { x: 0.05, z: 5.1, w: 5.9, d: 0.8 },       // the tee's own shoreline
                { x: 0.6, z: 8.5, w: 5.8, d: 1.0 }         // …and the front of the table
            ],
            tee: { x: 3, z: 4.2 }, cup: { x: 3.5, z: 11.6 }
        }),
        build({
            name: 'Under the Boardwalk', par: 4,
            blurb: 'Too tall to fly, and it stands high enough that a putt runs under. Land it short.',
            pads: [
                pad(0, 0, 6, 5),
                pad(0, 5, 6, 2.6, 0, 'sand'),
                pad(0, 7.6, 6, 9)
            ],
            /* The bar stops short of the rails on both sides. Partly so there
               is a second way through for anyone who would rather thread a
               gap than trust the run-out, and partly for the camera: a bar
               this tall spanning the whole fairway hides the flag and half the
               hole behind it from the tee, and a hole you cannot see is not a
               hole you can plan. */
            extra: beam(0.75, 11.2, 4.5, 0.5),
            tee: { x: 3, z: 1.6 }, cup: { x: 3, z: 14.5 }
        }),
        build({
            name: 'The Reach', par: 4, needsLoft: true,
            blurb: 'Out to the rock, then into the crater. It gathers what it catches.',
            pads: [
                pad(0, 0, 6, 5),
                pad(0.8, 7.5, 4.4, 4.4)
            ].concat(bowl(3, 18.6, 7.2, 2.2, 0.5)),
            water: [rect(-5, 5, 16, 18, -0.7)],
            tee: { x: 3, z: 1.8 }, cup: { x: 3, z: 18.6 }
        })
    ];

    /* ── course five: Highland Steps ─────────────────────────────────────

       The same lesson from the other side. Tidewater asks you to fly things
       that are missing; Highland asks you to fly things that are in the way,
       and hands the ground back as a tool: a bank to throw the ball at, a ramp
       that stops short of the summit, a shelf worth the climb. Three of the six
       cannot be finished any other way than through the air. The other three
       keep a route along the floor on purpose — a course where every shot is
       the same shot is not varied, it is uniform. */

    var highland = [
        build({
            name: 'Stairway', par: 4, needsLoft: true,
            blurb: 'Three steps, no ramp. Loft is the only way up a wall you cannot climb.',
            pads: [
                pad(0, 0, 5.5, 4.2),
                pad(0, 4.2, 5.5, 3.4, 0.4),
                pad(0, 7.6, 5.5, 3.4, 0.8),
                pad(0, 11, 5.5, 4.6, 1.15)
            ],
            /* One strip per riser, each stopping just short of the side rails.
               A gap wide enough to reach x = 0 opens the *side* of the hole as
               well as the step, and the ball then quietly falls off the hill
               at three specific heights. */
            gaps: [
                { x: 0.05, z: 3.8, w: 5.4, d: 0.8 },
                { x: 0.05, z: 7.2, w: 5.4, d: 0.8 },
                { x: 0.05, z: 10.6, w: 5.4, d: 0.8 }
            ],
            tee: { x: 2.75, z: 1.5 }, cup: { x: 2.75, z: 13.2 }
        }),
        build({
            name: 'The Backboard', par: 3,
            blurb: 'The front door is bricked up. Throw it at the hill and let the hill hand it back.',
            pads: [
                pad(0, 0, 6, 8),
                pad(0, 8, 6, 3.4),                              // the shelf, and the pin
                pad(0, 11.4, 6, 2.6, 0, 'green', 0, 0.42)       // the hill behind it
            ],
            extra: [wall(0.9, 9.4, 4.2, 0.32, 0.62, { base: -0.1 })],
            tee: { x: 3, z: 3.4 }, cup: { x: 3, z: 10.6 }
        }),
        build({
            name: 'Over the Top', par: 3, needsLoft: true,
            blurb: 'Nothing goes round it and one club in the bag goes over it.',
            pads: [
                pad(0, 0, 6, 7),
                pad(0, 7, 6, 5.5, 0, 'green', 0, 0.08),   // and it climbs on the far side
                pad(0, 12.5, 6, 2.5, 0, 'sand')           // no reward for over-clubbing it
            ],
            extra: [wall(-0.2, 5, 6.4, 0.4, 1.0, { base: -0.1 })],
            tee: { x: 3, z: 1.8 }, cup: { x: 3, z: 11.2 }
        }),
        build({
            name: 'The Gorge', par: 3,
            blurb: 'Three metres of nothing, and a green that leans away east.',
            pads: [
                pad(0, 0, 6, 6.4),
                pad(0, 9.7, 6.5, 7.3, 0, 'green', 0.10, 0)
            ],
            water: [rect(-3, 6.4, 12, 3.3, -2.4)],
            gaps: [shore(rect(-3, 6.4, 12, 3.3), 0.6)],
            tee: { x: 3, z: 4.2 }, cup: { x: 4.6, z: 13 }
        }),
        build({
            name: 'Two Roads', par: 4,
            blurb: 'The low road goes under the bar. The high road wants a chip first.',
            pads: [
                pad(0, 0, 6, 5),
                pad(0, 5, 3, 9),
                pad(3, 5, 3, 9, 0.5),
                pad(0, 14, 6, 5)
            ],
            gaps: [
                { x: 2.5, z: 4.6, w: 1, d: 9.8 },          // the step between the roads
                { x: 2.5, z: 4.6, w: 3.4, d: 0.9 },        // the face you chip up on to
                { x: 0.05, z: 13.6, w: 5.9, d: 0.8 }       // and the drop off the far end
            ],
            extra: beam(-0.3, 9, 3.2, 0.5),
            tee: { x: 1.4, z: 1.6 }, cup: { x: 3, z: 16.5 }
        }),
        build({
            name: 'Crown', par: 4, needsLoft: true,
            blurb: 'The ramp gets you to the shoulder. The last half metre is yours to fly.',
            pads: [
                pad(0, 0, 6, 5),
                pad(0, 5, 6, 3, 0, 'green', 0, 0.28),
                /* The shoulder keeps climbing, gently. A ball that crests the
                   ramp runs out of steam on it and rolls back a metre or two,
                   which is the room the chip up to the summit needs — parked
                   against the face there is no shot at all. */
                pad(0, 8, 7, 4, 0.84, 'green', 0, 0.03),
                pad(1, 12, 5, 5, 1.4)
            ],
            water: [rect(-3, 11.6, 13, 10, -2.3)],
            gaps: [brink({ x: 1, z: 12, w: 5, d: 5 }, 0.4)],
            tee: { x: 3, z: 1.6 }, cup: { x: 3.5, z: 14.4 }
        })
    ];

    /* ── course six: Ashdown Park ────────────────────────────────────────

       Not mini golf. Six holes of the long game at the same scale as the rest
       of the bag: a driver runs about twenty-one units off a fairway and about
       fifteen out of rough, so a par 4 here is a drive and an approach and a
       par 5 is three shots, which is the only definition of par that means
       anything.

       The vocabulary is the whole point of the course. Fairway is quick, rough
       is not, sand is where the shot goes to die, and the trees are solid. Miss
       the short grass and you do not lose the ball — you lose the club you
       wanted to hit next. */

    var rgh = 'rough', fwy = 'fairway', snd = 'sand', grn = 'green';

    var parkland = [
        build({
            name: 'Opening Drive', par: 4, long: true,
            blurb: 'Straight away, then a bunker exactly where the flag is. Pick a side.',
            pads: bands(0, [
                [5,  [3.5, rgh], [8, fwy], [7.5, rgh]],
                [11, [3.5, rgh], [8, fwy], [7.5, rgh]],
                [6,  [4.5, rgh], [9, fwy], [5.5, rgh]],
                [4,  [7, rgh], [9, fwy], [3, rgh]],
                [3,  [7, rgh], [2, fwy], [3.5, snd, DIP], [3.5, fwy], [3, rgh]],
                [9,  [6, rgh], [10, grn], [3, rgh]],
                [3,  [19, rgh]]
            ]),
            extra: [].concat(
                treeline(1.7, 8, 1.7, 24, 5),
                treeline(17.3, 24, 17.3, 34, 3)
            ),
            tee: { x: 7.5, z: 2.5 }, cup: { x: 11.5, z: 33.5 }
        }),
        build({
            name: 'Over the Water', par: 3, long: true,
            blurb: 'The pond is on the line to the pin. The dry way in is from the right.',
            pads: bands(0, [
                [4,   [3, rgh], [8, fwy], [3, rgh]],
                [4,   [2, rgh], [6.8, null], [2.2, fwy], [3, rgh]],
                [3,   [2, rgh], [2.5, snd, DIP], [7.5, grn], [2, rgh]],
                [7,   [2, rgh], [10, grn], [2, rgh]],
                [4,   [14, rgh]]
            ]),
            water: [rect(2, 4, 6.8, 4, -0.55)],
            gaps: [shore(rect(2, 4, 6.8, 4))],
            tee: { x: 9.5, z: 2 }, cup: { x: 6, z: 14 }
        }),
        build({
            name: 'Long Meadow', par: 5, long: true,
            blurb: 'Three shots if you lay up, two and a prayer if you do not.',
            pads: bands(0, [
                [5,  [4, rgh], [9, fwy], [7, rgh]],
                [13, [4, rgh], [9, fwy], [7, rgh]],
                [4,  [4, rgh], [6, fwy], [3, snd, DIP], [7, rgh]],
                [8,  [5, rgh], [10, fwy], [5, rgh]],
                [4,  [3, snd, DIP], [2, rgh], [10, fwy], [5, rgh]],
                [8,  [6, rgh], [10, fwy], [4, rgh]],
                [4,  [6, rgh], [3, fwy], [3, snd, DIP], [4, fwy], [4, rgh]],
                [9,  [5, rgh], [11, grn], [4, rgh]],
                [3,  [20, rgh]]
            ]),
            extra: [].concat(
                treeline(2, 6, 2, 28, 6),
                treeline(18.3, 8, 18.3, 23, 4),
                [tree(18, 47.5), tree(18, 53)]
            ),
            tee: { x: 8.5, z: 2.5 }, cup: { x: 10.5, z: 50.5 }
        }),
        build({
            name: 'The Elbow', par: 4, long: true,
            blurb: 'It turns left around an oak that has been there longer than the course.',
            pads: bands(0, [
                [5,  [11, rgh], [8, fwy], [3, rgh]],
                [12, [11, rgh], [8, fwy], [3, rgh]],
                [5,  [4, rgh], [4, snd, DIP], [11, fwy], [3, rgh]],
                [6,  [2, rgh], [11, fwy], [9, rgh]],
                [9,  [1.5, rgh], [10, grn], [10.5, rgh]],
                [3,  [22, rgh]]
            ]),
            extra: [].concat(
                [tree(10.7, 15.5, { t: 0.8, h: 2.8 })],
                treeline(9.4, 8, 9.4, 13, 3),
                treeline(2, 14, 2, 21, 3),
                treeline(20, 26, 20, 36, 4)
            ),
            tee: { x: 15, z: 2.5 }, cup: { x: 6, z: 32.5 }
        }),
        build({
            name: 'Short Stuff', par: 3, long: true,
            blurb: 'One full club to a small green in a ring of sand. Nothing else works.',
            pads: bands(0, [
                [4,   [3, rgh], [8, fwy], [3, rgh]],
                [3,   [14, rgh]],
                [2.5, [3.5, rgh], [7, snd, DIP], [3.5, rgh]],
                [8.5, [2.5, rgh], [2, snd, DIP], [5, grn], [2, snd, DIP], [2.5, rgh]],
                [3.5, [2.5, rgh], [9, grn], [2.5, rgh]],
                [3,   [14, rgh]]
            ]),
            extra: treeline(12.6, 19, 12.6, 23, 2),
            tee: { x: 7, z: 2 }, cup: { x: 7, z: 15 }
        }),
        build({
            name: 'Homeward', par: 4, long: true,
            blurb: 'Water all down the right for as long as the hole lasts.',
            pads: bands(0, [
                [5,  [4, rgh], [9, fwy], [7, rgh]],
                [4,  [4, rgh], [9, fwy], [2, rgh], [5, null]],
                [10, [4, rgh], [8, fwy], [2, rgh], [6, null]],
                [5,  [4, rgh], [8, fwy], [2, rgh], [6, null]],
                [4,  [5, rgh], [3, fwy], [3, snd, DIP], [3, fwy], [6, null]],
                [8,  [5, rgh], [10, grn], [5, rgh]],
                [3,  [20, rgh]]
            ]),
            water: [rect(15, 5, 5, 4, -0.55), rect(14, 9, 6, 19, -0.55)],
            gaps: [shore(rect(14, 5, 6, 23))],
            extra: [].concat(
                treeline(2, 6, 2, 27, 6),
                [tree(17.5, 32), tree(17.5, 35.5)]
            ),
            tee: { x: 8.5, z: 2.5 }, cup: { x: 10, z: 32 }
        })
    ];

    /* ── course seven: Whinstone Links ───────────────────────────────────

       An open course. There are no rails on it anywhere, because there is
       nothing for a rail to be built on: the ground is one piece of rolling
       country that runs past the fog in every direction, and what keeps you on
       the hole is a line of white stakes and the rule that you may cross it
       but not stop beyond it.

       Everything about it falls out of the two things the engine learned to
       do. The ground has humps in it (`dunes`), so the lie is different
       everywhere and a shot that finishes on a slope is a shot played from a
       slope. And a surface now holds a stopped ball only up to its own angle
       of repose (CONFIG.HOLD), so the humps are not decoration — land on the
       shoulder of one and the ball will not stay there. That is the course:
       aim at the flat parts.

       The greens are discs laid into the ground rather than cut out of it,
       and the dune field is told to keep away from them, so a green is a flat
       round table in rolling country — which is what a green is. The bunkers
       are the same trick with sand in them. */

    function moor(spec) {
        var flat = [keep(spec.tee.x, spec.tee.z, 4.5)].concat(spec.flat || []);
        var bumps = (spec.bumps || []).concat(dunes(spec.area, spec.n, spec.seed,
            { clear: flat, r: spec.r, rMax: spec.rMax, a: spec.a }));
        var pads = bands(0, spec.strips), i;
        // One field of humps, shared by every strip on the hole. The height of
        // the ground is a function of where you are and not of which strip you
        // happen to be standing on, so the seams between them are invisible to
        // the ball as well as to the eye — and the mown line can wander across
        // the contours instead of being cut to fit them.
        for (i = 0; i < pads.length; i++) pads[i].bumps = bumps;
        /* No scoop out here: every hazard on this course is an inlay, and an
           inlay is laid into ground that is drawn underneath it (see the note
           in `scoop`). Whinstone's bunkers are flat sand on rolling country,
           which is at least what a links bunker often is. */
        return pads.concat(spec.inlays || []);
    }

    var whinstone = [
        build({
            name: 'The Whins', par: 4, open: true,
            blurb: 'Rolling all the way. There is no flat lie out there but the one you pick.',
            pads: moor({
                tee: { x: 31, z: 16 }, seed: 4101, n: 62,
                area: { x: 3, z: 3, w: 56, d: 78 },
                r: 5, rMax: 11, grad: 0.21,
                strips: [[84, [20, rgh], [22, fwy], [20, rgh]]],
                flat: [keep(31, 50, 7.5), keep(31, 38, 4.2), keep(38.5, 45, 3.8)],
                inlays: [
                    circle(31, 50, 5.2, grn),
                    circle(31, 38, 2.7, snd),
                    circle(38.5, 45, 2.3, snd)
                ]
            }),
            fence: { x: 11, z: 7, w: 40, d: 58 },
            tee: { x: 31, z: 16 }, cup: { x: 31, z: 50 }
        }),
        build({
            name: 'The Ait', par: 3, open: true,
            blurb: 'An island in a burn. Seven units of carry, and no way to lay up.',
            /* The one hole on the course that is target golf rather than
               ground golf, and it exists because the 7 iron does. Nothing else
               in the bag flies nine units, so nothing else gets over the
               water — and the iron only manages it at very nearly a full
               swing, because carry falls off with the square of the speed
               while roll only falls off with the speed. Take something off it
               and you are wet: that trade is the whole hole.

               The ground round the moat is left flat on purpose. Dunes here
               would be a second thing to read on a hole that already asks for
               one exact shot, and a hollow beside the water would sit below
               the surface of it and look like a hole in the world. */
            pads: moor({
                tee: { x: 26, z: 22 }, seed: 6421, n: 26,
                area: { x: 3, z: 3, w: 46, d: 58 },
                r: 4.5, rMax: 9, grad: 0.22,
                strips: [
                    [23.5, [52, fwy]],
                    [5.5, [12, fwy], [28, null], [12, fwy]],
                    [18, [12, fwy], [4, null], [20, fwy], [4, null], [12, fwy]],
                    [5, [12, fwy], [28, null], [12, fwy]],
                    [12, [52, fwy]]
                ],
                flat: [keep(26, 38, 22)],
                inlays: [circle(26, 39, 5.4, grn)]
            }),
            water: [
                rect(12, 23.5, 28, 5.5, -0.55),
                rect(12, 29, 4, 18, -0.55),
                rect(36, 29, 4, 18, -0.55),
                rect(12, 47, 28, 5, -0.55)
            ],
            fence: { x: 8, z: 8, w: 36, d: 52 },
            tee: { x: 26, z: 22 }, cup: { x: 26, z: 39 }
        }),
        build({
            name: 'The Punchbowl', par: 4, open: true,
            blurb: 'The green sits in a bowl. Anything on the banks comes back to it.',
            pads: moor({
                tee: { x: 30, z: 14 }, seed: 3313, n: 55,
                area: { x: 3, z: 3, w: 54, d: 74 },
                r: 5, rMax: 10, grad: 0.20,
                strips: [
                    [34, [18, rgh], [24, fwy], [18, rgh]],
                    [46, [22, rgh], [20, fwy], [18, rgh]]
                ],
                flat: [keep(28, 47, 13), keep(38, 30, 4)],
                /* The bowl is authored rather than scattered: a ring of humps
                   standing round the green, close enough to run together into
                   one rim and far enough out that none of their tails reaches
                   the green itself. The dune field is kept away from all of
                   it, so this is the only thing shaping the ground there. */
                bumps: ring(28, 47, 12.5, 6.5, 1.3, 8),
                inlays: [circle(28, 47, 5.4, grn), circle(38, 30, 2.6, snd)]
            }),
            fence: { x: 10, z: 6, w: 40, d: 54 },
            tee: { x: 30, z: 14 }, cup: { x: 28, z: 47 }
        }),
        build({
            name: 'Stake and Ditch', par: 3, open: true,
            blurb: 'Out of bounds down the whole right side. The stakes are not a suggestion.',
            pads: moor({
                tee: { x: 20, z: 12 }, seed: 9091, n: 38,
                area: { x: 3, z: 3, w: 44, d: 48 },
                r: 4.5, rMax: 9, grad: 0.21,
                strips: [[54, [13, rgh], [17, fwy], [20, rgh]]],
                flat: [keep(22, 27, 7), keep(21, 19.5, 3.8), keep(15.5, 24, 3.3)],
                inlays: [
                    circle(22, 27, 4.6, grn),
                    circle(21, 19.5, 2.2, snd),
                    circle(15.5, 24, 2, snd)
                ]
            }),
            fence: { x: 8, z: 5, w: 22, d: 36 },
            tee: { x: 20, z: 12 }, cup: { x: 22, z: 27 }
        }),
        build({
            name: 'Elbow Point', par: 5, open: true,
            blurb: 'It turns left at the point. Cut the corner and you are off the course.',
            /* A dogleg with nothing to bend it. There are no trees on a links
               and no room for a hazard big enough to matter, so what turns
               this hole is the boundary itself: `fence` is two rectangles that
               overlap in an L, and the inside of the elbow is simply not the
               golf course. Which is how a real links does it too — the line of
               white stakes is the architecture. */
            pads: moor({
                tee: { x: 52, z: 14 }, seed: 5519, n: 76,
                area: { x: 3, z: 3, w: 70, d: 82 },
                r: 5, rMax: 11, grad: 0.20,
                strips: [
                    [52, [38, rgh], [24, fwy], [14, rgh]],
                    [14, [12, rgh], [50, fwy], [14, rgh]],
                    [10, [12, rgh], [30, fwy], [34, rgh]],
                    [12, [76, rgh]]
                ],
                flat: [keep(24, 68, 8), keep(44, 40, 4), keep(34, 62, 4), keep(19, 61, 3.8)],
                inlays: [
                    circle(24, 68, 5.4, grn),
                    circle(44, 40, 2.6, snd),
                    circle(34, 62, 2.5, snd),
                    circle(19, 61, 2.2, snd)
                ]
            }),
            fence: [
                { x: 38, z: 8, w: 28, d: 54 },
                { x: 10, z: 52, w: 40, d: 26 }
            ],
            tee: { x: 52, z: 14 }, cup: { x: 24, z: 68 }
        }),
        build({
            name: 'Home Ground', par: 4, open: true,
            blurb: 'The last of it turns right at the burnside, and the ground pushes you left.',
            pads: moor({
                tee: { x: 16, z: 12 }, seed: 2237, n: 54,
                area: { x: 3, z: 3, w: 54, d: 58 },
                r: 5, rMax: 10, grad: 0.21,
                strips: [
                    [30, [8, rgh], [22, fwy], [30, rgh]],
                    [10, [8, rgh], [36, fwy], [16, rgh]],
                    [14, [22, rgh], [30, fwy], [8, rgh]],
                    [10, [60, rgh]]
                ],
                flat: [keep(40, 44, 8), keep(26, 38, 4), keep(44, 36, 3.6)],
                inlays: [
                    circle(40, 44, 5, grn),
                    circle(26, 38, 2.6, snd),
                    circle(44, 36, 2.2, snd)
                ]
            }),
            fence: [
                { x: 8, z: 6, w: 22, d: 38 },
                { x: 24, z: 34, w: 30, d: 24 }
            ],
            tee: { x: 16, z: 12 }, cup: { x: 40, z: 44 }
        })
    ];


    /* ── course eight: Pinball Parlour ───────────────────────────────────

       The first course on the list that is not trying to be a golf course at
       all. Everything else here — even Windmill Works with its blades — is
       laid out as a lane you play *down*: aim, judge the pace, allow for the
       one thing in the way. A pinball table is the opposite proposition. The
       obstacles are not between you and the cup, they *are* the route, and the
       right shot is often the one fired at a post rather than at the flag.

       That is what `bumper` is for, and it is the only new piece of vocabulary
       the course needed. Everything else is a wall, a ramp and a gate that the
       first seven courses already had — which is the point: crazy golf is not
       a different engine, it is the same one with the aiming taken away. */

    var parlour = [
        build({
            name: 'Plunger Lane', par: 3,
            blurb: 'Down the chute at pace, into the pins, and let the table decide.',
            pads: [
                pad(0, 0, 2.4, 9, 1, 'wood', 0, -1 / 9),
                pad(2.4, 0, 4.6, 9),
                pad(0, 9, 7, 9)
            ],
            extra: [bumper(1.6, 12), bumper(3.5, 13.7), bumper(5.4, 12)],
            tee: { x: 1.2, z: 1.2 }, cup: { x: 3.5, z: 16.6 }
        }),
        build({
            name: 'Bumper City', par: 3, bag: ['putter', 'mallet'],
            blurb: 'Eight posts, no line through them, and the ball stays on the table.',
            pads: [pad(0, 0, 7, 16)],
            extra: [
                bumper(1.5, 5), bumper(3.5, 6.2), bumper(5.5, 5),
                bumper(2.4, 9), bumper(4.6, 9),
                bumper(1.4, 11.8), bumper(3.5, 12.6), bumper(5.6, 11.8)
            ],
            tee: { x: 3.5, z: 1.5 }, cup: { x: 3.5, z: 14.4 }
        }),
        build({
            name: 'The Flippers', par: 3,
            blurb: 'Two bats over the middle of the table, and they are not on your side.',
            pads: [pad(0, 0, 6.5, 16)],
            extra: [
                spinner(1.7, 7.6, 2.6, 0.4, { spin: 1.9 }),
                spinner(4.8, 10.6, 2.6, 0.4, { spin: -2.3 }),
                bumper(3.2, 4.4)
            ],
            tee: { x: 3.25, z: 1.5 }, cup: { x: 2.2, z: 14.2 }
        }),
        build({
            name: 'Tilt', par: 3,
            blurb: 'The whole table leans into the gutter. Nothing you leave short stays put.',
            pads: [
                pad(0, 0, 1.8, 15, 0, 'sand'),
                pad(1.8, 0, 5.2, 15, 0, 'green', 0.1, 0)
            ],
            extra: [bumper(3.4, 6.5), bumper(5.4, 9.5)],
            tee: { x: 5.6, z: 1.6 }, cup: { x: 3.2, z: 12.8 }
        }),
        build({
            name: 'The Trap', par: 3, needsLoft: true,
            blurb: 'A box with no door. There is exactly one way in and it is upwards.',
            pads: [pad(0, 0, 6, 16)],
            extra: pen(1.5, 10.6, 3.6, 3.6, { h: 0.7 }).concat([
                bumper(1.6, 6), bumper(4.4, 6)
            ]),
            tee: { x: 3, z: 1.5 }, cup: { x: 3.3, z: 12.4 }
        }),
        build({
            name: 'Jackpot', par: 4,
            blurb: 'Pins, a gate, a bar to roll under and one more post on the flag.',
            pads: [pad(0, 0, 7, 21)],
            extra: [].concat(
                [bumper(1.8, 5), bumper(5.2, 5)],
                [
                    wall(0, 9, 2, 0.4, 0.6, { base: -0.1 }),
                    wall(5, 9, 2, 0.4, 0.6, { base: -0.1 }),
                    slider(2.1, 9, 1.6, 0.4, { amp: 0.85, speed: 1.7 })
                ],
                beam(1.2, 14.5, 4.6, 0.5),
                [bumper(3.5, 17.1)]
            ),
            tee: { x: 3.5, z: 1.5 }, cup: { x: 3.5, z: 19.3 }
        })
    ];

    /* ── course nine: Clockwork Court ────────────────────────────────────

       Windmill Works asks you to find the gap. This one asks you to find the
       *moment*: every hole on it is a mechanism running at its own rate, and
       the shot that works at one phase of the sine is the shot that comes
       straight back at you a second later. There is nothing here the engine
       could not already do — blades, gates, beams and steps — and that is the
       course. Timing is the whole of it. */

    var clockwork = [
        build({
            name: 'Escapement', par: 3,
            blurb: 'Two blades turning against each other. There is a beat; find it.',
            pads: [pad(0, 0, 5.5, 15)],
            extra: [
                spinner(1.6, 7.5, 2.6, 0.4, { spin: 1.8 }),
                spinner(3.9, 10.5, 2.6, 0.4, { spin: -2.4 })
            ],
            tee: { x: 2.75, z: 1.5 }, cup: { x: 2.75, z: 13.3 }
        }),
        build({
            name: 'Pendulum', par: 3,
            blurb: 'One plank over the water and one bar sweeping across it.',
            pads: [
                pad(0, 0, 6, 7),
                pad(1.9, 7, 2.2, 4, 0, 'wood'),
                pad(0, 11, 6, 7)
            ],
            water: [rect(-3, 7, 12, 4, -0.8)],
            gaps: [shore(rect(-3, 7, 12, 4), 0.7)],
            extra: [slider(2.4, 8.6, 1.2, 0.4, { amp: 2.4, speed: 1.3 })],
            tee: { x: 3, z: 1.5 }, cup: { x: 3, z: 15 }
        }),
        build({
            name: 'The Cogs', par: 4,
            blurb: 'Three of them, all at different rates. Two is luck; three is a plan.',
            pads: [pad(0, 0, 6, 20)],
            extra: [
                spinner(3, 5, 3.4, 0.4, { spin: 1.5 }),
                spinner(3, 10, 3.4, 0.4, { spin: -2.1 }),
                spinner(3, 15, 3.4, 0.4, { spin: 2.7 })
            ],
            tee: { x: 3, z: 1.5 }, cup: { x: 3, z: 18.4 }
        }),
        build({
            name: 'Ratchet', par: 4, needsLoft: true,
            blurb: 'Three terraces, each a step too tall to roll up. It only goes one way.',
            pads: [
                pad(0, 0, 5, 5),
                pad(0, 5, 5, 4, 0.55),
                pad(0, 9, 5, 4, 1.1),
                pad(0, 13, 5, 5, 1.65)
            ],
            extra: [
                spinner(2.5, 7, 3, 0.4, { spin: 1.6, base: 0.45 }),
                spinner(2.5, 11, 3, 0.4, { spin: -2.0, base: 1 })
            ],
            tee: { x: 2.5, z: 1.6 }, cup: { x: 2.5, z: 16 }
        }),
        build({
            name: 'The Long Hand', par: 3, bag: ['putter', 'mallet'],
            blurb: 'One blade the width of the court, turning slowly. Slowly is worse.',
            pads: [pad(0, 0, 7, 16)],
            extra: [spinner(3.5, 8, 6.4, 0.4, { spin: 0.8 })],
            tee: { x: 3.5, z: 1.5 }, cup: { x: 3.5, z: 14 }
        }),
        build({
            name: 'Midnight', par: 4,
            blurb: 'Gate, blade, bar, cup. All four are counting, and none of them wait.',
            pads: [pad(0, 0, 6, 22)],
            extra: [].concat(
                [
                    wall(0, 5, 1.5, 0.4, 0.6, { base: -0.1 }),
                    wall(4.5, 5, 1.5, 0.4, 0.6, { base: -0.1 }),
                    slider(1.6, 5, 1.4, 0.4, { amp: 0.8, speed: 1.9 })
                ],
                [spinner(3, 11, 3.6, 0.4, { spin: -1.7 })],
                beam(0.7, 16, 4.6, 0.5)
            ),
            tee: { x: 3, z: 1.5 }, cup: { x: 3, z: 19.6 }
        })
    ];

    /* ── course ten: Dunmore Heath ───────────────────────────────────────

       The long game again, and deliberately not a second Ashdown Park.

       Ashdown is a parkland course, and what defines a parkland hole is what
       stands *beside* the fairway: trees, and a lot of them. The ground under
       it is nearly flat, because a hole whose interest is in the trees does
       not need any other kind. Dunmore is the opposite proposition on both
       counts. There is almost nothing in the air here. What there is instead
       is the ground itself — a crest across the driving line, a hollow that
       gathers everything short, a punchbowl green, a spiral of country that
       breaks a putt twice in opposite directions, and one ravine that is not a
       hazard so much as a decision.

       All of it is one field per hole, shared by every strip (`shape`), which
       is what lets a crest run clean from boundary to boundary without the
       rail generator finding a cliff down the middle of the fairway. The holes
       are half again the size of Ashdown's for the same reason: a landform
       needs room to be a landform, and a ridge with six units either side of
       it is a speed bump.

       And the rough is heather. It is `rough` like anywhere else — the engine
       has one word for it — but the fairways here are narrow and it runs right
       up to their edge, so missing one does not lose you the ball. It loses
       you the club you wanted to hit next. */

    var dunmore = [
        (function () {
            /* One crest at driving distance, and a hollow left of the green
               that gathers everything hit short and safe. The crest is four
               overlapping humps rather than one wide one because a single
               raised cosine wide enough to cross a hole is also tall enough
               in the middle to be a pimple; four at a third of the height
               each add along their line into a ridge with a flat top. */
            var field = ridge(5, 13, 17, 13, 5, 0.42, 4)
                .concat([hill(3, 30, 3, -0.7)]);
            var pads = bands(0, [
                [6,  [7, rgh], [8, fwy], [7, rgh]],
                [12, [7, rgh], [8, fwy], [7, rgh]],
                [6,  [6, rgh], [4, snd, DIP], [6, fwy], [6, rgh]],
                [7,  [6, rgh], [10, fwy], [6, rgh]],
                [6,  [6, rgh], [10, grn], [6, rgh]],
                [3,  [22, rgh]]
            ]);
            return build({
                name: 'Bell Heather', par: 4, long: true, shaped: true,
                blurb: 'A ridge across the driving line, and a hollow left of the green for anything timid.',
                pads: shape(scoop(pads, { seed: 3 }), field),
                extra: treeline(2, 7, 2, 22, 4),
                tee: { x: 11, z: 3 }, cup: { x: 11, z: 35.5 }
            });
        })(),
        (function () {
            /* A punchbowl, and the shape of it is decided by one rule the
               tests enforce rather than by taste: ground may not be steeper
               than the surface it is cut into will hold a ball on. A rim
               steep enough to feed a ball back to the pin is far steeper than
               a green holds — so the rim is not on the green. It stands out
               in the heather, which holds better than twice as much, and the
               green is the small flat disc of ground in the middle that every
               one of the six humps stops short of. Which is what a punchbowl
               is: a small green at the bottom of a bowl of something else. */
            var field = ring(10, 21.5, 6.5, 3.5, 0.85, 6);
            var pads = bands(0, [
                [5, [6, rgh], [8, fwy], [6, rgh]],
                [6, [4, rgh], [12, snd, DIP], [4, rgh]],
                [8, [20, rgh]],
                [5, [8, rgh], [4, grn], [8, rgh]],
                [9, [20, rgh]]
            ]);
            return build({
                name: 'The Waste', par: 3, long: true, shaped: true,
                blurb: 'Sand where the fairway should be, and a small green at the bottom of a bowl.',
                pads: shape(scoop(pads, { seed: 5 }), field),
                tee: { x: 10, z: 2.5 }, cup: { x: 10, z: 21.5 }
            });
        })(),
        (function () {
            var field = [hill(4.5, 30, 4.5, -0.95)]
                .concat(ridge(5, 28.5, 17, 28.5, 4.5, 0.36, 4));
            var pads = bands(0, [
                [6,  [4, rgh], [8, fwy], [10, rgh]],
                [12, [4, rgh], [8, fwy], [10, rgh]],
                [6,  [5, rgh], [4, snd, DIP], [9, fwy], [4, rgh]],
                [7,  [8, rgh], [11, fwy], [3, rgh]],
                [6,  [9, rgh], [10, grn], [3, rgh]],
                [3,  [22, rgh]]
            ]);
            return build({
                name: 'Gorse Corner', par: 4, long: true, shaped: true,
                blurb: 'It bends right around a stand of gorse, over a hollow that keeps what it takes.',
                pads: shape(scoop(pads, { seed: 7 }), field),
                extra: [].concat(
                    treeline(10.5, 16, 10.7, 23, 3),
                    treeline(1.8, 9, 1.8, 26, 4),
                    [tree(20, 28), tree(20, 32)]
                ),
                tee: { x: 7, z: 3 }, cup: { x: 14, z: 35 }
            });
        })(),
        (function () {
            /* The whorl, and the reason this hole is a par 5 rather than a
               long par 4: the spiral sits in the middle of the second shot,
               so the lie you get for the third is decided by which arm of it
               you finished on. From the tee it looks like one slope. */
            var field = ridge(5, 12, 17, 12, 4.5, 0.36, 4)
                .concat(whorl(11, 33, 2, 5, 5, 0.38, 9, 1.5))
                .concat([hill(19, 46, 3, -0.6)]);
            var pads = bands(0, [
                [6,  [5, rgh], [9, fwy], [8, rgh]],
                [12, [6, rgh], [8, fwy], [8, rgh]],
                [4,  [6, rgh], [4, snd, DIP], [6, fwy], [6, rgh]],
                [14, [7, rgh], [9, fwy], [6, rgh]],
                [8,  [8, rgh], [9, fwy], [5, rgh]],
                [5,  [7, rgh], [10, fwy], [5, rgh]],
                [6,  [6, rgh], [11, grn], [5, rgh]],
                [3,  [22, rgh]]
            ]);
            return build({
                name: 'Long Ling', par: 5, long: true, shaped: true,
                blurb: 'Fifty units of heather with the ground turning under it. It breaks both ways.',
                pads: shape(scoop(pads, { seed: 11 }), field),
                extra: [].concat(
                    treeline(2, 9, 2, 32, 6),
                    [tree(20, 47), tree(20, 51)]
                ),
                tee: { x: 9.5, z: 3 }, cup: { x: 11.5, z: 54 }
            });
        })(),
        (function () {
            /* The ravine. It is not a water hazard and it is not a bunker: it
               is ground, a metre below the ground either side of it, that you
               are perfectly entitled to play out of and will wish you had not
               had to. Lay up short of it and the hole is a comfortable par
               five in four shots; take it on and it is a par four. */
            var cut = ravine(0, 17, 20, 5, 0.95);
            var field = ridge(4, 9, 16, 9, 4, 0.34, 3)
                .concat([hill(17.5, 29, 2.5, -0.6)]);
            var pads = bands(0, [
                [6,  [4, rgh], [9, fwy], [7, rgh]],
                [11, [4, rgh], [9, fwy], [7, rgh]],
                [5,  [20, null]],
                [6,  [4, rgh], [10, fwy], [6, rgh]],
                [7,  [5, rgh], [10, grn], [5, rgh]],
                [3,  [20, rgh]]
            ]).concat([cut.pad]);
            return build({
                name: 'The Ravine', par: 4, long: true, shaped: true,
                blurb: 'A dry gulley across the whole hole. Carry it, lay up short of it, or play out of it.',
                pads: shape(scoop(pads, { seed: 13 }), field),
                gaps: cut.gaps,
                extra: [].concat(
                    treeline(1.7, 8, 1.7, 15, 3),
                    [tree(18.3, 30), tree(18.3, 34)]
                ),
                tee: { x: 9.5, z: 3 }, cup: { x: 10, z: 32.5 }
            });
        })(),
        (function () {
            /* Uphill, and the rise is one hump wide enough to be a hillside:
               ten units of radius, which puts its steepest ground at about
               a fifth and its top well out of sight of the tee. The green sits
               beyond the far shoulder with a mound either side of it, so the
               approach is blind and the two ways of missing it are not the
               same miss. */
            var field = [hill(11, 17, 10, 1.5), hill(3, 32, 3, 0.75), hill(19.5, 31, 2.5, 0.55)];
            var pads = bands(0, [
                [6,  [5, rgh], [9, fwy], [8, rgh]],
                [12, [6, rgh], [8, fwy], [8, rgh]],
                [6,  [6, rgh], [9, fwy], [7, rgh]],
                [5,  [5, rgh], [4, fwy], [4, snd, DIP], [4, fwy], [5, rgh]],
                [8,  [6, rgh], [11, grn], [5, rgh]],
                [3,  [22, rgh]]
            ]);
            return build({
                name: 'The Beacon', par: 4, long: true, shaped: true,
                blurb: 'A whole hillside standing in the middle of the fairway. The green is behind it.',
                pads: shape(scoop(pads, { seed: 17 }), field),
                extra: [].concat(
                    treeline(1.8, 8, 1.8, 24, 4),
                    treeline(20.2, 26, 20.2, 34, 3)
                ),
                tee: { x: 10, z: 3 }, cup: { x: 11.5, z: 34 }
            });
        })()
    ];

    /* Ten courses is far too long a list to read as one list, and the three
       kinds of golf on it are not variations of each other — a mini golf hole
       is one swing and a putt, a crazy golf hole is a machine you have to time,
       and a links hole is a drive and an approach. So the group is not a
       heading any more, it is a filter: the picker opens on one kind at a
       time, and a player who came for windmills never scrolls past forty holes
       of parkland to reach them.

       `tint` is the group's colour in that picker and `icon` its mark. Both
       live here rather than in the menu, so a new course arrives already filed
       and a new group arrives already dressed. */
    G3.COURSE_GROUPS = [
        {
            id: 'mini', name: 'Mini golf', icon: '\u2691',
            tint: '#7dd3fc',
            blurb: 'Lanes, rails and one swing to the green. Where the pace is learned.'
        },
        {
            id: 'crazy', name: 'Crazy golf', icon: '\u2699',
            tint: '#f0abfc',
            blurb: 'Blades, gates, posts and pendulums. Aim less; time it better.'
        },
        {
            id: 'long', name: 'Long game', icon: '\u27FF',
            tint: '#86efac',
            blurb: 'Full-size holes. Fairway, rough, sand and trees, two shots to most greens.'
        }
    ];

    G3.COURSES = [
        {
            id: 'seaside',
            group: 'mini',
            name: 'Seaside Green',
            blurb: 'Six flat-ish holes by the water. Learn the pace here.',
            theme: 'seaside',
            holes: seaside
        },
        {
            id: 'quarry',
            group: 'mini',
            name: 'Quarry Ridge',
            blurb: 'Ramps, ledges and a long way down. Bring loft.',
            theme: 'quarry',
            holes: quarry
        },
        {
            id: 'tidewater',
            group: 'mini',
            name: 'Tidewater Reach',
            blurb: 'Water where the fairway should be. Six holes you have to fly.',
            theme: 'lagoon',
            holes: tidewater
        },
        {
            id: 'highland',
            group: 'mini',
            name: 'Highland Steps',
            blurb: 'Up the hill in stages, over what will not move.',
            theme: 'highland',
            holes: highland
        },
        {
            id: 'works',
            group: 'crazy',
            name: 'Windmill Works',
            blurb: 'Everything moves. Nothing waits.',
            theme: 'works',
            holes: works
        },
        {
            id: 'parlour',
            group: 'crazy',
            name: 'Pinball Parlour',
            blurb: 'A table, not a course. Play off the posts, because there is no line past them.',
            theme: 'arcade',
            holes: parlour
        },
        {
            id: 'clockwork',
            group: 'crazy',
            name: 'Clockwork Court',
            blurb: 'Six mechanisms, each running at its own rate. Timing is the whole of it.',
            theme: 'clockwork',
            holes: clockwork
        },
        {
            id: 'parkland',
            group: 'long',
            name: 'Ashdown Park',
            blurb: 'The long game: fairway, rough, sand and trees. Two shots to most greens.',
            theme: 'parkland',
            holes: parkland
        },
        {
            id: 'whinstone',
            group: 'long',
            name: 'Whinstone Links',
            blurb: 'Open country, no fences, rolling ground. Aim at the flat parts.',
            theme: 'links',
            holes: whinstone
        },
        {
            id: 'dunmore',
            group: 'long',
            name: 'Dunmore Heath',
            blurb: 'Narrow fairways on an open hillside. Miss one and the heather has you.',
            theme: 'heath',
            holes: dunmore
        }
    ];

    /* The courses of one group, in the order they are written above. */
    G3.coursesInGroup = function (groupId) {
        return G3.COURSES.filter(function (c) { return c.group === groupId; });
    };

    /* The one after this, wrapping round the end of the whole list — what a
       finished round offers next. */
    G3.nextCourseId = function (id) {
        for (var i = 0; i < G3.COURSES.length; i++) {
            if (G3.COURSES[i].id === id) return G3.COURSES[(i + 1) % G3.COURSES.length].id;
        }
        return G3.COURSES[0].id;
    };

    /* The bag a hole is played out of.

       Most holes are played out of the whole bag and say nothing. A hole that
       names one is naming what it is *about*: "The Long Green" is a putting
       hole, and handing the player a wedge there is handing them the answer to
       a question the hole was asking. Taking the loft away is the cheapest
       obstacle in the game — no geometry, no moving part, nothing to
       collide with — and it is the only one that changes what the *player*
       has to do rather than what the ball has to get past.

       Named as ids out of CONFIG.ALL_CLUBS, in the order they should appear in
       the bag, so a hole can hand out a club the default bag does not have as
       easily as it can take four away. An unknown id is dropped rather than
       silently swapped for another club: a hole asking for something that does
       not exist should come up short, not come up wrong. */
    G3.bagFor = function (hole) {
        if (!hole || !hole.bag) return C.CLUBS;
        var out = [];
        hole.bag.forEach(function (id) {
            for (var i = 0; i < C.ALL_CLUBS.length; i++) {
                if (C.ALL_CLUBS[i].id === id) { out.push(C.ALL_CLUBS[i]); return; }
            }
        });
        return out.length ? out : C.CLUBS;
    };

    G3.courseById = function (id) {
        for (var i = 0; i < G3.COURSES.length; i++) {
            if (G3.COURSES[i].id === id) return G3.COURSES[i];
        }
        return G3.COURSES[0];
    };

    G3.authoring = {
        pad: pad, wall: wall, spinner: spinner, slider: slider,
        beam: beam, pen: pen, bumper: bumper, bowl: bowl, bands: bands, tree: tree,
        hill: hill, ring: ring, ridge: ridge, whorl: whorl, ravine: ravine,
        shape: shape, dunes: dunes, ground: ground, circle: circle, keep: keep,
        rect: rect, enclose: enclose, shore: shore, brink: brink, build: build,
        contour: contour, scoop: scoop, relief: relief,
        RAIL_T: RAIL_T, SCOOP: SCOOP,
        CUP_FLAT: CUP_FLAT, TEE_FLAT: TEE_FLAT, CUP_PATCH: CUP_PATCH
    };

})(window.G3);
