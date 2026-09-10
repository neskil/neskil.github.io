/* Seventeen courses of six holes, as data.

   A hole is a set of pads (the ground), a set of walls (things that bounce),
   a set of water rectangles (things that punish), a tee and a cup. Everything
   else — where the rails go, how high the cup sits, where the camera should
   look — is derived below, because a hole that has to repeat itself is a hole
   that will one day disagree with itself.

   Four of the seventeen courses are mini golf, five are crazy golf, four are
   adventure golf and four are the long game — tee, fairway, rough, sand,
   trees, green — authored through `bands` and `tree` rather than a hole at a
   time; see the comment above them. They use the same pads, the same walls
   and the same solver as everything else, which is the point: a parkland hole
   is not a different game, it is the same one written wider.

   ── two rules about the order things are in ──

   **A course gets harder as you play it.** Hole one introduces something, the
   middle of the card develops it, and the sixth asks for all of it at once —
   so a course is not six variations on a theme, it is a climb. That is why the
   holes are in the order they are written in rather than the order they were
   built in, and why moving one is a change to the course rather than a tidy-up.
   The same rule runs across a group: the four mini courses are in order of how
   much they ask for, and so are the five crazy ones, the three adventure ones
   and the three long ones.

   **A hole is not the hole beside it.** A hundred and two holes on one list is a
   hundred and two
   chances to write the same corridor again, and the way out is the
   plan rather than the furniture: a hole that turns, a hole that goes round
   something, a hole played over a corner, a hole with two ways to the green
   and a reason to pick one. If a new hole's plan can be described as "a lane
   with an X in the middle", it needs a different X *and* a different lane.

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

    /* A wall, and the three ways it is allowed to move: `move` slides it,
       `spin` turns it round, `swing` sweeps it between two angles and rests at
       each. All three are options here because all three are things the solver
       reads off a wall — flipper() below is a nicer way to say the third, not
       the only way. It was the only way, which meant a hole editor writing a
       wall out longhand could say two of the three and quietly lose the flipper
       on the way back in. */
    function wall(x, z, w, d, h, opts) {
        var o = opts || {};
        return {
            x: x, z: z, w: w, d: d, h: h === undefined ? 0.6 : h,
            base: o.base === undefined ? -0.4 : o.base,
            yaw: o.yaw || 0,
            move: o.move || null,
            spin: o.spin || 0,
            swing: o.swing || null,
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

    /* ── a hole in the wall ─────────────────────────────────────────────

       Every wall in this file until now was solid from its base to its top,
       and every obstacle was therefore something to go *round*, or over, or
       under (`beam`). An aperture is the fourth thing: a wall you go
       **through**, at a place somebody chose.

       It is four walls and no new physics — jambs either side of the opening,
       a sill under it and a lintel over it — and each of the four is left out
       when it would have no size, so one function writes all of these:

         a doorway     sill 0: the opening starts at the floor, and a putt
                       through it is the whole shot. Aim, and nothing else.
         a letterbox   sill above the ball: nothing on the ground gets through
                       and the club is chosen by how high the slot is.
         a window      sill above the ball *and* a lintel over it, which is a
                       hoop you shoot through by any other name: too low and
                       you hit the sill, too high and you hit the lintel, and
                       the shot is a weight rather than a line. It is the only
                       obstacle in the game a rolling ball cannot pass and a
                       lofted one can — the exact inverse of `beam`, which is
                       the only one the other way round.
         a portcullis  the whole wall, when the opening is nothing.

       The one number worth watching is `gap` against the jambs: a wall may not
       be thinner than 0.24 anywhere (the substepping guarantee), so an opening
       that leaves less than that either side is one the tests reject rather
       than one the ball tunnels through. */
    function aperture(x, z, w, d, opts) {
        var o = opts || {};
        var base = o.base === undefined ? -0.1 : o.base;
        var h = o.h === undefined ? 1.4 : o.h;
        var gap = o.gap === undefined ? 1.2 : o.gap;
        var sill = o.sill === undefined ? 0 : o.sill;
        var head = o.head === undefined ? h : o.head;
        var kind = o.kind || 'rail';
        var flat = w >= d;                       // which way the wall runs
        var span = flat ? w : d;
        /* Where the opening is, measured from the wall's own start. Centred
           unless a hole says otherwise — and holes do say otherwise, because a
           door in the middle of a lane is a door on the line you were already
           aiming down. */
        var at = o.at === undefined ? span / 2 : o.at;
        var jamb = at - gap / 2;
        var far = span - at - gap / 2;
        var out = [];

        function piece(px, pz, pw, pd, pb, ph) {
            if (ph <= 1e-6 || pw <= 1e-6 || pd <= 1e-6) return;
            out.push(wall(px, pz, pw, pd, ph, { base: pb, kind: kind }));
        }

        if (flat) {
            piece(x, z, jamb, d, base, h);
            piece(x + w - far, z, far, d, base, h);
        } else {
            piece(x, z, w, jamb, base, h);
            piece(x, z + d - far, w, far, base, h);
        }
        var ox = flat ? x + jamb : x, oz = flat ? z : z + jamb;
        var ow = flat ? gap : w, od = flat ? d : gap;
        piece(ox, oz, ow, od, base, sill);                    // under the window
        piece(ox, oz, ow, od, base + head, h - head);         // and over it
        return out;
    }

    /* A flipper: a bat that sweeps between two angles and **stops at each of
       them**, which is the whole of what separates it from a blade. A spinner
       is always coming round again, so the shot at one is a gap in a cycle; a
       flipper rests, sweeps, and rests, so the shot at one is a moment — and
       the two feel nothing alike to play even though they are the same box
       turning.

       It turns about its own middle, the way every blade in this file does,
       because that is what the solver's rotated box actually is. A real
       flipper is hinged at one end and this is not that: what it is is a bat
       with a rest, and the rest is the part a player is timing.

       `rest` is where it sits and `arc` how far it sweeps, both in radians;
       `speed` is the rate of the sine driving it, so it is at one end of its
       travel every π/speed seconds. Authored by the middle, like `spinner`,
       because that is the point it turns about. */
    function flipper(cx, cz, len, opts) {
        var o = opts || {};
        var t = o.t === undefined ? 0.34 : o.t;
        var rest = o.rest || 0;
        var arc = o.arc === undefined ? 1.0 : o.arc;
        var w = wall(cx - len / 2, cz - t / 2, len, t, o.h === undefined ? 0.6 : o.h,
            { base: o.base === undefined ? -0.1 : o.base, kind: 'blade' });
        w.swing = {
            from: rest, to: rest + arc,
            speed: o.speed === undefined ? 2.2 : o.speed,
            phase: o.phase || 0
        };
        return w;
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

    /* A bank: a wall standing at an angle, authored by its middle, its length
       and how far round it is turned.

       The solver has understood a rotated box since the first blade — a
       spinner is one, turned a little further every frame — and until now
       nothing standing *still* had ever used it. So every fence in this file
       ran due north or due east, and the holes came out looking like the
       corridors they were drawn as.

       An angled wall is a different thing to play, not just a different thing
       to look at. A rail square across the lane sends the ball back the way it
       came, and one turned thirty degrees sends it somewhere neither of you
       chose — which is what a pinball table does to a ball, and what the face
       of a bunker does to one that finds it. Two of them facing each other
       make a throat the ball is thrown out of rather than gathered into. */
    function bank(cx, cz, len, yaw, opts) {
        var o = opts || {};
        var t = o.t === undefined ? 0.34 : o.t;
        return wall(cx - len / 2, cz - t / 2, len, t, o.h === undefined ? 0.62 : o.h,
            { base: o.base === undefined ? -0.1 : o.base, yaw: yaw, kind: o.kind || 'rail' });
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

    /* ── ground that does something ─────────────────────────────────────

       Everything above is furniture: a thing standing on the floor that the
       ball hits. These three are the floor itself doing something, which is a
       different proposition to play against — you cannot bounce off a
       travelator or aim at a pipe the way you aim at a rail, you can only
       decide whether to be on it. physics.js holds the rules; this is the
       vocabulary a hole is written in.

       **`sprung`** is a launch pad: touch it, go up. It is a disc laid into
       the floor rather than a slab standing on it, so a lane can have one in
       the middle of it without being cut into three, and `build` keeps the
       ground under it flat for the reason written there. `v` is an upward
       speed and sqrt(2·GRAVITY·h) is what reaches height h — so 8.5 clears
       two units and 10.4 clears three.

       **`belt`** is a travelator: a pad with an acceleration on it. Author it
       as a strip the ball crosses (a belt running across the hole is a hazard)
       or as a lane it rides (one running down the hole is a lift). It is a
       plain pad, not an inlay, so it tiles with its neighbours like any other
       piece of ground.

       **`pipe`** is a mouth and where it puts you. One way — `pipes()` returns
       the pair when a hole wants two-way — because a chute is as useful as a
       pipe and a one-way list is the honest shape for both. The exit direction
       belongs to the pipe rather than to the ball for the reason in
       physics.js: the far end has to be aimable.

       All three carry the rule that makes them safe to scatter about a hole:
       none of them is a wall, so none of them can shut a hole, and the ball's
       route past any of them is the floor it is standing on. */

    function sprung(cx, cz, r, v, y) {
        var p = pad(cx - r, cz - r, 2 * r, 2 * r, y || 0, 'wood');
        p.r = r;
        p.rIn = r;          // a clean circle: a trampoline is not a wavy green
        p.inlay = true;
        p.spring = v === undefined ? 8.5 : v;
        return p;
    }

    function belt(x, z, w, d, ax, az, opts) {
        var o = opts || {};
        var p = pad(x, z, w, d, o.y || 0, o.kind || 'wood');
        p.push = { x: ax, z: az };
        return p;
    }

    function pipe(x, z, tx, tz, yaw, r) {
        return { x: x, z: z, r: r === undefined ? 0.85 : r, tx: tx, tz: tz, yaw: yaw || 0 };
    }

    // Both ends of a two-way one, each pointing away from the other.
    function pipes(ax, az, bx, bz, r) {
        var yaw = Math.atan2(bx - ax, bz - az);
        return [
            pipe(ax, az, bx, bz, yaw, r),
            pipe(bx, bz, ax, az, yaw + Math.PI, r)
        ];
    }

    /* ── the long game ──────────────────────────────────────────────────

       Everything above is mini golf: a lane, a rail, an obstacle in the middle
       of it. The parkland course at the bottom of this file is not, and it is
       authored differently, because a full-size hole is not a lane — it is a
       stack of strips running from the tee up to the green, and the interest
       is in which strip you land on.

       `bands` lays them out. A row is a depth followed by cells laid west to
       east from x = 0: [width, kind] and, for a bunker, [width, kind, dy]. A
       null kind leaves a hole in the ground, which is where a lake goes — the
       water rectangle goes under it and the shoreline into `gaps`, exactly as
       on the older holes.

       Two things fall out of this for free. Cells of different kinds at the
       same height are neighbours, so `enclose` puts no rail between a fairway
       and its rough: the only rails a parkland hole gets are the ones around
       the outside of the whole property, which is what the boundary fence of a
       real course is. And a bunker sitting a hand's breadth below the grass is
       a step the ball can roll into and — just — climb back out of, because
       DIP is inside CONFIG.STEP_UP. Any deeper and a bunker would be a well.

       ── the row that climbs ──

       A row may be written as an options object instead of a bare depth, and
       that is how a hole gets height in it:

         [{ d: 5, sz: 0.16 }, [6, rgh], [10, fwy], [3, rgh]]

       `sz` tilts the whole row along the line of play, and the level carries
       over into the next row on its own — write the rises and the terraces
       follow. `y` sets the level outright where a hole would rather say it
       than count it. A cell's third number stays what it always was, an offset
       from whatever the row is standing at, so DIP is still DIP on a fairway
       that is a metre above the tee.

       The reason the tilt belongs to the *row* rather than to the cell is the
       one thing that could go wrong with it: every cell in a row shares a
       z-range, so a row-wide tilt leaves every west–east seam at exactly the
       height it was, and `enclose` still finds no rail between a fairway and
       its rough. A cell that tilted on its own would step away from its
       neighbour and fence itself in. */
    var DIP = -0.12;

    function bands(z0, rows, x0) {
        var pads = [], z = z0, y = 0, i, j, row, spec, sz, c, x;
        for (i = 0; i < rows.length; i++) {
            row = rows[i];
            spec = typeof row[0] === 'number' ? { d: row[0] } : row[0];
            if (spec.y !== undefined) y = spec.y;
            sz = spec.sz || 0;
            x = x0 || 0;
            for (j = 1; j < row.length; j++) {
                c = row[j];
                if (c[1]) pads.push(pad(x, z, c[0], spec.d, y + (c[2] || 0), c[1], 0, sz));
                x += c[0];
            }
            z += spec.d;
            y += sz * spec.d;
        }
        return merge(pads);
    }

    /* ── the country a hole stands in ─────────────────────────────────────

       `bands` writes a property and `enclose` fences it, and on a mini golf
       lane that fence *is* the hole — the rail is the thing you play the
       angles off. On a full-size one it is a lie. A parkland hole is not a
       bathtub with trees painted down the sides of it: the ground carries on
       past the last cut of rough into country that is nobody's fairway, and
       what stops you going there is a rule rather than a kerb.

       Whinstone already plays that way, and the only reason it could is that
       its ground runs a dozen units past its boundary in every direction.
       `commons` hands a hole written in rows the same thing without rewriting
       it: a margin of rough on both ends of every row, and a flat apron before
       the first row and after the last.

       The margins belonging to the *rows* is the whole trick. A strip of
       country leaves the property at exactly the height and the tilt of the
       row it continues, so there is no step anywhere down either side of the
       hole — and therefore nothing for a rail to be built on even if one were
       asked for. The head apron stands at the level the first row starts from
       and the tail apron carries on at the level the last one ended, so the
       two ends are seamless as well. And the x origin moves out to -m, so
       every coordinate the hole was already written in is exactly where it
       always was.

       What comes back is the ground and the boundary that goes with it: the
       property line the rows themselves describe, which is where the rail used
       to stand and is now a line of white stakes. The four margins are
       separately settable because one hole in twelve wants less of one — a
       lake at the boundary has to have a bank above its own surface, and on a
       hole that tilts, ground twelve units further down the fall is twelve
       units lower. */
    function commons(z0, rows, opts) {
        var o = opts || {}, kind = o.kind || 'rough';
        var m = o.m === undefined ? 12 : o.m;
        var w = o.w === undefined ? m : o.w;     // west, east, near, far
        var e = o.e === undefined ? m : o.e;
        var s = o.s === undefined ? m : o.s;
        var f = o.f === undefined ? m : o.f;
        var out = [], i, j, row, rw, span = 0, depth = 0, y0;

        for (i = 0; i < rows.length; i++) {
            for (j = 1, rw = 0; j < rows[i].length; j++) rw += rows[i][j][0];
            if (rw > span) span = rw;
            depth += typeof rows[i][0] === 'number' ? rows[i][0] : rows[i][0].d;
        }
        y0 = typeof rows[0][0] === 'number' ? 0 : (rows[0][0].y || 0);

        out.push([{ d: s, y: y0 }, [w + span + e, kind]]);
        for (i = 0; i < rows.length; i++) {
            row = rows[i];
            for (j = 1, rw = 0; j < row.length; j++) rw += row[j][0];
            out.push([row[0]].concat([[w, kind]], row.slice(1),
                                     [[e + span - rw, kind]]));
        }
        out.push([f, [w + span + e, kind]]);

        return {
            pads: bands(z0 - s, out, -w),
            fence: { x: 0, z: z0, w: span, d: depth }
        };
    }

    /* And the other axis, which is not a row at all: a cross-fall laid over a
       whole hole at once.

       A sidehill lie is the one piece of golf ground `bands` could never write,
       because a slope across the hole is a slope *within* every row, and a cell
       that tilted west to east would end at a different height from the cell
       beside it — a step down the length of the hole, and a rail down the
       middle of it. Tilting every pad together is what fixes that: each one is
       lifted by the plane's own height at its corner, so the surfaces still
       meet exactly where they used to and the only thing that changed is that
       the hole is now on the side of a hill.

       It composes with everything else. Bunkers are dished before this runs
       (`scoop` has no opinion about ground it has not been shown yet, and skips
       a pad that is already tilted), landforms are added after it, and the
       gradient the tests measure is the sum — so a cross-fall spends part of
       the surface's angle of repose and the field has to live inside the rest.
       Which is exactly the trade a sidehill lie is. */
    function tilt(pads, sx, sz, ox, oz) {
        var i, p;
        for (i = 0; i < pads.length; i++) {
            p = pads[i];
            p.y += (sx || 0) * (p.x - (ox || 0)) + (sz || 0) * (p.z - (oz || 0));
            p.sx = (p.sx || 0) + (sx || 0);
            p.sz = (p.sz || 0) + (sz || 0);
        }
        return pads;
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
       the renderer puts the canopy on top of it.

       `y` is the ground the tree is standing on, and it matters the moment a
       hole has terraces in it: a trunk is placed off its own base rather than
       off the ground under it, so a tree on a shelf a metre up is a tree buried
       to the knee unless it is told where the shelf is.

       Leave `y` out and `build` looks the ground up instead, which is the
       answer that cannot go stale. Carrying the number by hand was fine while
       the parkland course was a table with a step in it; on ground that climbs
       four units and falls into a gorge it is a second copy of the height
       field kept in step by memory, and it was not being kept — trees stood a
       clear two units in the air on holes whose rows had been retilted, and
       nothing in the suite said so. The number is still worth having where a
       tree is meant to stand somewhere other than on the ground under its own
       middle; everywhere else, omitting it is now the better answer. */
    function tree(cx, cz, opts) {
        var o = opts || {};
        var t = o.t === undefined ? 0.62 : o.t;
        var w = wall(cx - t / 2, cz - t / 2, t, t, o.h === undefined ? 2.4 : o.h,
            { base: (o.y || 0) - 0.4, kind: 'tree' });
        if (o.y === undefined) w.seat = 0.4;      // how far its base sinks
        return w;
    }

    /* A stand of them along a line. A treeline is never one tree — and where
       the line runs up a slope, `y0`/`y1` walk the ground up with it. */
    function treeline(x0, z0, x1, z1, n, opts) {
        var out = [], i, f, o = opts || {}, y0 = o.y0, y1 = o.y1, c;
        for (i = 0; i < n; i++) {
            f = n === 1 ? 0.5 : i / (n - 1);
            c = o;
            if (y0 !== undefined) {
                c = { t: o.t, h: o.h, y: y0 + ((y1 === undefined ? y0 : y1) - y0) * f };
            }
            out.push(tree(x0 + (x1 - x0) * f, z0 + (z1 - z0) * f, c));
        }
        return out;
    }

    /* A rock, and the reason it exists is that two of the three long courses
       have no trees on them and are not supposed to look empty. A heath has
       stone in it and so does a links, and a boulder is the one piece of
       scenery that belongs on ground whose whole subject is its own shape: it
       stands on the skyline of a crest and tells you there is a crest.

       Where a tree is solid only in its trunk, a rock is solid all the way up.
       That is not a special case, it is the ordinary one — a canopy is the
       exception, and it is an exception because nothing in the bag can fly
       over it, so a solid one would only ever mean the ball stopping in
       mid-air. A boulder is under a metre high and every lofted club in the
       bag clears it, so what is drawn is what the ball hits.

       Authored by its middle like a tree, and `y` is the ground it stands on
       for the same reason: a rock is placed off its own base, so one on a
       shelf a metre up is buried to the shoulder unless it is told where the
       shelf is. render.js shakes its lumps out of where it stands, so an
       outcrop is an outcrop rather than three copies of one stone. */
    function crag(cx, cz, opts) {
        var o = opts || {};
        var s = o.s === undefined ? 1.15 : o.s;
        var w = wall(cx - s / 2, cz - s / 2, s, s, o.h === undefined ? 0.85 : o.h,
            { base: (o.y || 0) - 0.3, kind: 'rock' });
        if (o.y === undefined) w.seat = 0.3;
        return w;
    }

    var CRAG_TRIES = 12;         // …rolls of the dice before a stone settles
    /* How much of the smaller of two stones the larger is allowed to cover.
       Overlapping is the whole trick — stones that merely touch read as a row
       of cobbles rather than as an outcrop — but two that share half their
       footprint are one stone drawn twice, with the seam between the two
       surfaces flickering wherever they cross and the smaller sometimes
       swallowed outright. Half is the line: below it an outcrop, above it a
       duplicate. */
    var CRAG_SHARE = 0.5;

    /* An outcrop: a scatter of them about a point, from a seed, so a hole gets
       a group of stones of different sizes rather than a row of identical
       ones. Deterministic like everything else in this file — a course that
       reshuffles itself is a course the tests cannot make a statement about. */
    function crags(cx, cz, spread, n, seed, opts) {
        var rnd = seeded(seed), out = [], i, o = opts || {}, t, x, z, s, h, k, ok;
        var j, b, bs, ox, oz;
        for (i = 0; i < n; i++) {
            /* Rejection sampling, and the loop is the point. The scatter used
               to take the first spot the dice gave it, and on a six-stone
               outcrop that meant a pair landing within a few centimetres of
               each other about once a hole — which the turntable's plan view
               shows as one lumpy stone and the audit reports as
               `stone-on-stone`. Rolling again costs nothing here (this runs
               once, at load) and it is still the same outcrop on every load,
               because the retries come out of the same seeded stream. */
            for (k = 0; k < CRAG_TRIES; k++) {
                t = rnd() * Math.PI * 2;
                x = cx + Math.cos(t) * spread * (0.3 + rnd() * 0.7);
                z = cz + Math.sin(t) * spread * (0.3 + rnd() * 0.7);
                s = (o.s === undefined ? 1.15 : o.s) * (0.6 + rnd() * 0.8);
                h = (o.h === undefined ? 0.85 : o.h) * (0.6 + rnd() * 0.7);
                ok = true;
                for (j = 0; j < out.length && ok; j++) {
                    b = out[j]; bs = Math.min(b.w, b.d);
                    ox = Math.min(x + s / 2, b.x + b.w) - Math.max(x - s / 2, b.x);
                    oz = Math.min(z + s / 2, b.z + b.d) - Math.max(z - s / 2, b.z);
                    if (ox <= 0 || oz <= 0) continue;
                    if (Math.min(ox, oz) / Math.min(s, bs) >= CRAG_SHARE) ok = false;
                }
                if (ok) break;
            }
            out.push(crag(x, z, { s: s, h: h, y: o.y }));
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

    /* A mountain, rather than a hump with ambitions.

       One raised cosine is the wrong shape for a landform this size, and the
       arithmetic is what says so: its steepest flank is a*PI/2r, so four units
       of height on a radius of ten reaches a gradient of 0.63 and is a cone
       nothing stays on. Widening it until the flank is holdable fixes the
       gradient and costs the shape — a cosine broad enough to be safe is a
       pudding, and a pudding read from the tee is not a mountain.

       So a massif is a broad base with a ring of shoulders standing on it at a
       little under half its radius. The base carries the height at a gradient
       the ground can hold; the shoulders are a fifth of it apiece, they add on
       the way up the flank where the interest is, and they leave the summit
       alone — which is what gives the thing a skyline instead of a dome.

       `a` is what the *base* is worth, so the top comes out higher than the
       number asked for, and the gradient that matters is the sum. Both are
       measured on the finished height field by tests.html rather than trusted
       from here. The rule of thumb the courses are written against: a peak of
       `a` on a radius of about 2*a*PI/HOLD is one a fairway will still hold a
       stopped ball on, and anything steeper belongs in the rough — which is
       the honest reason you play round a mountain rather than over it. */
    function massif(cx, cz, r, a, n) {
        return [hill(cx, cz, r, a)].concat(
            ring(cx, cz, r * 0.42, r * 0.4, a * 0.2, n === undefined ? 5 : n));
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

    /* How far off its own circle a disc is allowed to wander, as a fraction
       of its radius, and in how many lobes.

       A green is not a circle and a bunker is not a coin. Both are drawn here
       as a disc with three low harmonics laid over the rim — two, three and
       five lobes, so no two of them line up and the outline never repeats
       inside one turn — and the whole of it bites *inwards*: the radius runs
       from r down to r(1 - 2·WAVE) and never out past r. That is what keeps
       the rest of the file honest. Every clearance on a hole is measured
       against the disc's own r — the dune field is told to keep away from a
       green by radius, a cup is asserted to have room inside one, the tests
       walk a green's rim looking for the boundary — and a shape that stays
       inside that circle cannot invalidate any of them.

       The phases come off the disc's own position and size, so a hole looks
       the same every time it is built, and two greens on one course do not
       come out as the same shape turned round. */
    var WAVE = 0.075;
    var WAVE_LOBES = [2, 3, 5];
    var WAVE_SHARE = [0.5, 0.3, 0.2];

    /* Give a disc pad the edge it is going to be drawn and rolled off, from
       where it stands and how big it is. Every disc goes through here — the
       ones `circle()` builds below and the ones the hole editor draws — so a
       hole looks the same in the editor as it does in the game, and moving a
       green two units along re-cuts its edge rather than sliding a stencil. */
    function shapeDisc(p) {
        var cx = p.x + p.w / 2, cz = p.z + p.d / 2;
        var rnd = seeded(Math.round(cx * 733 + cz * 9173 + p.r * 51419));
        var terms = [], i;
        for (i = 0; i < WAVE_LOBES.length; i++) {
            terms.push([WAVE_LOBES[i], WAVE * WAVE_SHARE[i], rnd() * Math.PI * 2]);
        }
        p.wave = { bite: WAVE, terms: terms };
        p.rIn = p.r * (1 - 2 * WAVE);
        return p;
    }

    // A round green, laid into whatever it is standing on. Round-ish: see
    // WAVE above for the shape of its edge, and physics.padRadius for the
    // one function that answers where that edge is.
    function circle(cx, cz, r, kind, y) {
        var p = pad(cx - r, cz - r, 2 * r, 2 * r, y || 0, kind || 'green');
        p.r = r;
        p.inlay = true;
        return shapeDisc(p);
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
            var dx = cx - (pad.x + pad.w / 2), dz = cz - (pad.z + pad.d / 2);
            // Off the wavy edge rather than off the circle it is cut from —
            // see WAVE above; on a plain disc the two are the same number.
            return G3.physics.padRadius(pad, Math.atan2(dz, dx)) - Math.hypot(dx, dz);
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
            // purpose; this is for the ground that was left flat. So is a
            // travelator: a belt with a hump in it is a machine somebody has
            // dropped, and the ball would take the hump's word over the
            // motor's.
            if (p.sx || p.sz || p.r || p.inlay || p.push || p.spring) continue;
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
            // The inner radius on a disc, not the outer one: a hollow as wide
            // as the circle would reach past the wave's troughs (see WAVE).
            span = (p.r ? p.rIn || p.r : Math.min(p.w, p.d) / 2) - 0.1;
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
            area = p.r ? Math.PI * span * span : p.w * p.d;
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
       own fence.

       `along` turns it a quarter turn. A gulley *across* the hole is a carry
       and a decision taken once; one running *down* the side of it is a
       lateral hazard you are flirting with on every shot, and the only thing
       that differs between them is which pair of seams is the long one. So it
       is the same helper with the gaps put on the other two edges, rather than
       a second one that would drift.

       ── why a deep one needs banks ──

       `bank` is the width the two walls take out of `d`, and below about a
       unit of depth it is worth nothing: a ball at the foot of a low step gets
       out with a wedge and the wall may as well be vertical. Past that it is
       the difference between a hazard and a hole in the rules, and the bot is
       what proved it. A gorge two units deep with vertical sides collects a
       drive, the ball rolls to the far wall and comes to rest hard against it,
       and from there *no shot in the bag gets out*: a wedge leaves the ground
       at 58 degrees and needs a unit and a half of run before it is two units
       up, and there is nothing in front of the ball but wall. It played eight
       strokes from the same square foot of gravel.

       So the walls are ground rather than cliff: a strip either side, tilted
       at depth/bank, which the ball rolls down and can be pitched — or driven
       — back up. Nothing holds a stopped ball on a slope that steep (see
       CONFIG.HOLD), so what a deep gorge costs is still the whole hole; what
       it no longer costs is the round.

       The two sides want different answers, though, which is why `bank` may be
       a pair rather than a number. A near wall wide enough to play out of is
       also a ramp: a drive pitching on to it at fifty degrees reflects forward
       and up, sails the whole gorge and lands beside the flag, and the hazard
       has quietly stopped being one — the bot went tee to green off the first
       swing and holed out in two on a par four. So the near side is a lip,
       steep enough to throw a ball that lands on it back up rather than
       across, and the far side is the bank you get out on. Which is also the
       way round a real barranca is cut, since the near side is the one the
       water was undercutting. */
    function ravine(x, z, w, d, depth, opts) {
        var o = typeof opts === 'string' ? { kind: opts } : (opts || {});
        var m = 0.45, inset = 0.6;
        var dep = depth === undefined ? 0.95 : depth;
        var bs = o.bank || 0;
        var bn = bs.length ? bs[0] : bs, bf = bs.length ? bs[1] : bs;
        var kind = o.kind || 'rough';
        var along = !!o.along;
        var fx = x + (along ? bn : 0), fz = z + (along ? 0 : bn);
        var fw = w - (along ? bn + bf : 0), fd = d - (along ? 0 : bn + bf);
        var floor = pad(fx, fz, fw, fd, -dep, kind);
        var walls = [];
        if (along) {
            if (bn > 0) walls.push(pad(x, z, bn, d, 0, kind, -dep / bn, 0));
            if (bf > 0) walls.push(pad(x + w - bf, z, bf, d, -dep, kind, dep / bf, 0));
        } else {
            if (bn > 0) walls.push(pad(x, z, w, bn, 0, kind, 0, -dep / bn));
            if (bf > 0) walls.push(pad(x, z + d - bf, w, bf, -dep, kind, 0, dep / bf));
        }
        return {
            pad: floor,
            pads: [floor].concat(walls),
            gaps: along ? [
                { x: x - m, z: z + inset, w: 2 * m, d: d - 2 * inset },
                { x: x + w - m, z: z + inset, w: 2 * m, d: d - 2 * inset }
            ] : [
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

    /* How far a stone or a trunk has to stand above the highest ground under
       its own footprint. A ball's radius, near enough: less than that and the
       thing is a bump in the grass with a wall inside it. */
    var PROUD = 0.16;

    /* Every circle on a hole that has to stand on flat ground: the footprint
       of anything with a motor in it, plus a little for the rim. */
    function machineKeeps(h, out) {
        var i, p, r;
        for (i = 0; i < h.pads.length; i++) {
            p = h.pads[i];
            if (!p.spring && !p.push) continue;
            r = p.r ? p.r : Math.hypot(p.w, p.d) / 2;
            out.push(keep(p.x + p.w / 2, p.z + p.d / 2, r + 0.3));
        }
        for (i = 0; i < (h.warps || []).length; i++) {
            out.push(keep(h.warps[i].x, h.warps[i].z, h.warps[i].r + 0.5));
            out.push(keep(h.warps[i].tx, h.warps[i].tz, h.warps[i].r + 0.5));
        }
        return out;
    }

    function build(h) {
        var P = G3.physics, i;
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
            /* And flat under the machinery, for a reason the tee and the cup
               only half share. A launch pad and a pipe mouth are laid *into*
               the floor as inlays, and an inlay wins a tie in `surfaceUnder`
               and loses outright to ground that has been lifted above it — so
               a single hump under a trampoline does not make it a lumpy
               trampoline, it makes it a trampoline the ball rolls straight
               over without ever touching. Machinery on rolling ground also
               simply looks wrong: a belt follows the floor it is bolted to and
               a hump is not a floor anybody bolts a belt to. */
            machineKeeps(h, keeps);
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

        /* And whatever grows out of the ground is put on the ground. A tree or
           a rock authored without a `y` carries a `seat` — how far its base
           sinks below the surface it stands on — and this is the one place
           that number meets the height field. See `tree` for why it is worth
           doing here rather than in the hole: the alternative is every author
           keeping a copy of the ground in their head, and on a course with
           four units of climb on it that copy goes stale the first time a row
           is retilted. tests.html measures the result rather than trusting it. */
        for (i = 0; i < h.walls.length; i++) {
            var wl = h.walls[i];
            if (!wl.seat) continue;
            var seat = P.surfaceTop(h, wl.x + wl.w / 2, wl.z + wl.d / 2);
            if (!seat) continue;
            wl.base = seat.y - wl.seat;
            /* …and never so deep that the ground closes over it.

               The middle is the right place to seat a stone and the wrong
               place to *check* one. On a hump or a hillside the ground under a
               boulder's shoulders stands higher than the ground under its
               navel, and a low stone seated off its middle can end up entirely
               beneath a surface that rises across its own footprint — which is
               a solid thing the ball hits and the player cannot see, the one
               rule scenery is not allowed to break.

               So the footprint gets measured, and what gives is the stone's
               *height* rather than where it is standing. Lifting it instead
               was the first answer and it is the wrong one: clearing the
               uphill shoulder by raising the whole box opens the same gap
               again on the downhill side, which is a boulder hovering over the
               grass. Growing it keeps the base exactly where the ground put it
               and pushes the top out through the high side, which is what a
               half-buried stone on a hillside actually looks like. Flat ground
               measures the same everywhere and nothing happens at all, which
               is why the thirty-odd holes with trees on them are untouched. */
            var hi = seat.y, sx, sz, g;
            for (sx = 0; sx <= 4; sx++) {
                for (sz = 0; sz <= 4; sz++) {
                    g = P.surfaceTop(h, wl.x + wl.w * sx / 4, wl.z + wl.d * sz / 4);
                    if (g && g.y > hi) hi = g.y;
                }
            }
            if (wl.base + wl.h < hi + PROUD) wl.h = hi + PROUD - wl.base;
        }

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
        var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, p;
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

    /* ── mini golf, the first of four: Seaside Green ──────────────────────

       The first six holes anybody plays, and they are in the order they are in
       for one reason: each is harder than the one before it. That is the shape
       every course in this file is written to — a hole that introduces a thing,
       a hole or two that develops it, and a sixth that asks for all of it at
       once — and it is why the sixth hole here is a jetty with a bend in it
       and the first is a lane with a rail across the corner of it that turns
       the ball for you.

       Difficulty is not one number. On this course it is added a piece at a
       time and each piece is a different kind of trouble: an angle that does
       the work, a corner that does not, sand that costs you a stroke of
       control, water
       that costs you a stroke outright, a lane that runs away from you, and
       finally a plank over the sea with a turn in the middle of it. */

    var seaside = [
        build({
            /* The first hole anybody plays, and it is now a bounce hole: one
               lane, one baffle, and a rail across the far corner set at
               forty-five degrees, which turns a ball running north into one
               running east and puts it on the pin.

               It was a flat six-by-fifteen slab with two bars across it, and
               everything wrong with that was in the first impression rather
               than in the golf. A lane with two staggered gaps is a hole you
               solve by tapping twice; nothing about it says what the game is
               for. An angled wall does, in one shot and without a word of
               explanation: aim at the corner rather than at the flag, and the
               corner does the turning.

               Three things keep it the easiest hole on the card:

               - **The angle is a right angle.** Forty-five degrees turns a
                 north-bound ball due east, so where it ends up is a line
                 anybody can read off the tee — the bank's face is the mirror,
                 and the flag is on the other side of it.
               - **The aim is worth something and the miss is cheap.** Where
                 the ball meets the bank is where it turns, so a hit an eighth
                 of the lane too low runs east an eighth of the lane short of
                 the pin. There is nothing to fall off and nothing to lose a
                 stroke to: a bad one leaves a putt.
               - **The baffle only takes the straight line away.** It reaches
                 in from the east rail and leaves the whole west side open, so
                 there is one obvious road up the hole and one obvious thing
                 to do at the top of it.

               An angled wall standing still was Pinball Parlour's invention
               and this is the other thing it is good for. There a bank is a
               slingshot that throws the ball somewhere neither of you chose;
               here it is a mirror, aimed on purpose, which is the friendliest
               use an angle has. */
            name: 'Sea Legs', par: 3,
            blurb: 'Up the left and off the angle — the corner turns it for you.',
            pads: [pad(0, 0, 6, 13)],
            extra: [
                // The baffle: in from the east rail, the west side left open.
                wall(2.3, 6.4, 3.7, 0.3, 0.55, { base: -0.1 }),
                /* The kicker, across the far corner. Long enough that both
                   ends bury themselves in the rails it meets, or the triangle
                   behind it would be a pocket a ball could find its way into
                   and a corner nobody could play out of. */
                bank(1, 11.9, 3.6, -Math.PI / 4, { t: 0.3, h: 0.55 })
            ],
            tee: { x: 1.5, z: 1.5 }, cup: { x: 4.4, z: 12 }
        }),
        build({
            name: 'The Bend', par: 3,
            blurb: 'Left turn at the top. The corner rail is your friend.',
            pads: [pad(0, 0, 4.5, 9), pad(0, 9, 13, 4.5)],
            tee: { x: 2.25, z: 1.5 }, cup: { x: 11.5, z: 11.25 }
        }),
        build({
            /* Two bars of beach with the gap in a different place in each, so
               the lane through them is not a lane at all — it is two turns,
               and a ball played straight at the flag finishes in the second
               one. Cheap to build and it is the first hole here that cannot be
               solved by hitting it hard down the middle. */
            name: 'The Zigzag', par: 3,
            blurb: 'Two bars of beach, and the gap moves. Straight at the flag is sand.',
            pads: [
                pad(0, 0, 6, 4.5),
                pad(0, 4.5, 4, 2.5, 0, 'sand'), pad(4, 4.5, 2, 2.5),
                pad(0, 7, 6, 2),
                pad(0, 9, 2, 2.5), pad(2, 9, 4, 2.5, 0, 'sand'),
                pad(0, 11.5, 6, 5)
            ],
            tee: { x: 3, z: 1.8 }, cup: { x: 3, z: 14.5 }
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
            /* The first hole on the course that is not played towards the
               flag. It goes up one leg, across the top and back down the
               other, round a block of ground that is simply not there — and
               the whole of the return leg falls away to the sea wall, so the
               shot down it is aimed at the inside rail and allowed to drift.

               The lean has to be along x rather than along z, and that is not
               a preference: the return leg shares its whole western edge with
               the top of the horseshoe, and two pads only meet without a step
               where the tilt runs *along* the seam rather than across it.
               Anything else and `enclose` finds a cliff there and fences the
               corner off. */
            name: 'The Horseshoe', par: 4,
            blurb: 'Up one leg, across the top, back down the other — and it leans at the wall.',
            pads: [
                pad(0, 0, 4.5, 12),
                pad(4.5, 8, 4, 4),
                pad(8.5, 0, 4.5, 12, 0, 'green', -0.09, 0)
            ],
            tee: { x: 2.25, z: 1.5 }, cup: { x: 10.8, z: 2.4 }
        }),
        build({
            name: 'The Jetty', par: 4,
            blurb: 'A plank over the shallows with a turn in it, and nothing to bounce off but nerve.',
            pads: [
                pad(0, 0, 6, 5.5),
                pad(1.3, 5.5, 1.9, 3.6, 0, 'wood'),
                pad(1.3, 9.1, 3.6, 1.9, 0, 'wood'),
                pad(3, 11, 1.9, 3.2, 0, 'wood'),
                pad(0, 14.2, 6, 5)
            ],
            water: [rect(-1, 5.5, 8, 8.7, -0.7)],
            gaps: [shore(rect(-1, 5.5, 8, 8.7), 0.6)],
            tee: { x: 3, z: 2 }, cup: { x: 3.6, z: 16.8 }
        })
    ];

    /* ── mini golf, the second of four: Quarry Ridge ─────────────────── */

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
            /* The road turns now, and that is the whole difference between
               this and the hole it replaced. A straight ledge is one shot you
               either hit straight or do not; a ledge with a corner in it is
               two, and the second is played from wherever the first left you.

               Every edge of the road is a brink — one gap rectangle covers all
               of it — except the outside of the bend, which keeps its wall.
               That is not mercy: a corner with nothing on the outside of it is
               a corner nobody can hold, and the wall is the thing you aim at
               rather than the thing that saves you. */
            name: 'The Ledge', par: 4,
            blurb: 'Two metres of quarry road with a corner in it, and a long way down off every edge.',
            pads: [
                pad(0, 0, 5, 4, 1),
                pad(1.4, 4, 2.2, 5, 1),
                pad(1.4, 9, 6.8, 2.4, 1),
                pad(6, 11.4, 5.2, 5, 1)
            ],
            water: [rect(-4, 4, 16, 7.4, -1.2)],
            gaps: [{ x: -4, z: 3.4, w: 16, d: 7.9 }],
            tee: { x: 2.5, z: 1.5 }, cup: { x: 8.6, z: 13.9 }
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
            /* The finisher, and it is the only hole on the course that asks
               for the shot to be *over*-hit. What is new is behind the green:
               the far bank used to run on for seven units, so a cannon shot
               that cleared the water by four was as good as one that cleared
               it by one. Now there is beach back there, and the gap is wider
               than it was. */
            name: 'The Cannon', par: 3,
            blurb: 'The ramp is not a suggestion. Flat out, fly the gap — and stop before the sand.',
            pads: [
                pad(0, 0, 6, 4),
                pad(1.2, 4, 3.6, 2.5, 0, 'wood', 0, 0.45),
                pad(0, 9.8, 7, 5),
                pad(0, 14.8, 7, 2.5, 0, 'sand')
            ],
            water: [rect(-3, 6.5, 14, 3.3, -0.9)],
            gaps: [shore(rect(-3, 6.5, 14, 3.3), 0.7)],
            tee: { x: 3, z: 1.5 }, cup: { x: 3.5, z: 12.5 }
        })
    ];

    /* ── crazy golf, the first of five: Windmill Works ───────────────── */

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
            /* This used to be Double Doors, which was First Gear played twice
               with the second gate out of phase — a fine idea and the third
               hole on the course to ask the same question. What stands here
               instead is the first wall in the file the ball goes *through*:
               solid across the lane, with one doorway in it, over on the right
               where the tee shot is not already pointing.

               And then a blade behind it, which is what makes the two halves
               of the hole different questions rather than the same one twice.
               The door is a line and the blade is a moment, and neither is any
               use without the other. */
            name: 'Through the Wall', par: 3,
            blurb: 'One door in the wall, off to the right, and one blade behind it. Line first, then the moment.',
            pads: [pad(0, 0, 7, 18)],
            extra: [].concat(
                aperture(-0.2, 6, 7.4, 0.4, { gap: 1.5, at: 5.4, h: 1.7, head: 1.15 }),
                [spinner(3.5, 11, 3.8, 0.4, { spin: 1.6 })]
            ),
            tee: { x: 2.2, z: 1.6 }, cup: { x: 3.5, z: 15.4 }
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
            /* The hole the course needed and did not have: one that turns.
               Five of the six here were a lane with a mechanism in the middle
               of it, which is five ways of asking the same question, so this
               one goes north, then east, then north again — and the second
               blade stands in the corner, where you cannot back off and wait
               for it because the ball has to be somewhere while you do.

               The bunker keeps a line through it, on the far side of the lane.
               A band of sand across the whole floor is not a decision, it is a
               toll; two metres of grass past the edge of it is. */
            name: 'Turnstile', par: 4,
            blurb: 'North, east, north — with a blade in the lane, a blade in the corner and sand between them.',
            pads: [
                pad(0, 0, 5, 8),
                pad(0, 8, 3.2, 3.5, 0, 'sand'), pad(3.2, 8, 1.8, 3.5),
                pad(0, 11.5, 5, 4),
                pad(5, 11.5, 7, 4),
                pad(7, 15.5, 5, 4)
            ],
            extra: [
                spinner(2.5, 4, 3.4, 0.4, { spin: -1.5 }),
                spinner(8.5, 13.5, 3.4, 0.4, { spin: 2.1 })
            ],
            tee: { x: 2.5, z: 1.4 }, cup: { x: 9.5, z: 17.6 }
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

    /* ── mini golf, the third of four: Tidewater Reach ────────────────────

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
            /* The rock has moved out to the east, so the hole turns twice
               before it arrives anywhere: out to the right off the tee, then
               back across the water to the left. The carry off the rock is
               four units and diagonal, which is most of a wedge, and the
               crater is what makes that fair — land anywhere in the dish and
               the ground finishes the shot for you. */
            name: 'The Reach', par: 4, needsLoft: true,
            blurb: 'Out to the rock, back over the water, into the crater. It gathers what it catches.',
            pads: [
                pad(0, 0, 6, 5),
                pad(4.6, 6.6, 4.4, 4.4)
            ].concat(bowl(3, 18.6, 7.2, 2.2, 0.5)),
            water: [rect(-5, 5, 16, 18, -0.7)],
            tee: { x: 3, z: 1.8 }, cup: { x: 3, z: 18.6 }
        })
    ];

    /* ── mini golf, the last of four: Highland Steps ──────────────────────

       The same lesson from the other side. Tidewater asks you to fly things
       that are missing; Highland asks you to fly things that are in the way,
       and hands the ground back as a tool: a bank to throw the ball at, a ramp
       that stops short of the summit, a shelf worth the climb. Three of the six
       cannot be finished any other way than through the air. The other three
       keep a route along the floor on purpose — a course where every shot is
       the same shot is not varied, it is uniform. */

    var highland = [
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
                /* The summit, and it is smaller than it was with the pin
                   tucked into the back of it. The last hole on the hardest
                   mini course should not be a chip at the middle of a table:
                   long is the loch, short is the loch, and the only part of
                   the top that holds a ball is the part you have to be brave
                   to aim at. */
                pad(1.2, 12, 4.4, 4.6, 1.45)
            ],
            water: [rect(-3, 11.6, 13, 10, -2.3)],
            gaps: [brink({ x: 1.2, z: 12, w: 4.4, d: 4.6 }, 0.4)],
            tee: { x: 3, z: 1.6 }, cup: { x: 2.6, z: 15.2 }
        })
    ];

    /* ── the long game, the first of three: Ashdown Park ──────────────────

       Not mini golf. Six holes of the long game at the same scale as the rest
       of the bag: a driver runs about twenty-one units off a fairway and about
       fifteen out of rough, so a par 4 here is a drive and an approach and a
       par 5 is three shots, which is the only definition of par that means
       anything.

       The vocabulary is the whole point of the course. Fairway is quick, rough
       is not, sand is where the shot goes to die, and the trees are solid. Miss
       the short grass and you do not lose the ball — you lose the club you
       wanted to hit next.

       ── there is no fence on it ──

       The first two passes at this course were fenced, because `bands` writes
       a property and `enclose` fences a property, and nobody had asked whether
       a full-size hole wanted one. It does not. A rail down both sides of a
       parkland hole is a bathtub with trees painted on it: it stops the ball
       where a real course would let it run, it reads as a kerb from the tee,
       and it makes six holes on a hillside look like six lanes of mini golf
       drawn wide.

       So every hole here is written through `commons` now — the same rows as
       before with a dozen units of country added round the outside of them —
       and declares `open: true` with the old rail line as its `fence`. What
       used to be a wall you could play the angles off is a line of white
       stakes you may cross and are only punished for stopping beyond, which is
       both what a real boundary is and, incidentally, the thing that made
       these holes harder without a single hazard being moved.

       ── the park is on a hill ──

       The first pass at this course was flat, and flat is what a floor plan
       gets you: six corridors of mown grass with trees down the side and a
       bunker where the interest was supposed to be. Whinstone Links, two
       courses later, is the argument against it — a hole whose ground is
       doing something is a hole you have to read before you can play it.

       So the park has height in it now, and it comes from three places that
       stack rather than compete. `bands` rows tilt and carry their level into
       the next row, so a hole climbs to a shelf or falls off a bluff and the
       terraces come out as real ground rather than as a step with a fence on
       it. `shape` lays one landform field across every pad of a hole, so a
       crest or a gathering hollow runs clean from the rough to the fairway and
       back. And `tilt` puts a whole hole on the side of a hill, which is the
       one piece of golf ground `bands` could never write.

       Two of the holes are round: the greens on **Over the Water** and **The
       Dell** are discs laid into the ground the way the links greens are, and
       the reason is not decoration. A rectangle has a near edge and a far edge
       and the same answer from every angle; a circle in a ring of trouble has
       a side you should be on, and finding it is the shot.

       The shapes themselves are borrowed, because the good ones were settled a
       century ago and are worth stealing from: a cross bunker no drive can
       carry (Pine Valley's Hell's Half Acre), a green blind in a hollow
       between two mounds (Lahinch's Dell), and a hole bent round the edge of a
       lake where the honest question is how much of it you are prepared to
       take on (the Cape). */

    var rgh = 'rough', fwy = 'fairway', snd = 'sand', grn = 'green';

    var parkland = [
        (function () {
            /* Downhill off a bluff, along the floor of the park, and back up
               on to a shelf the green sits on. The crest halfway down is what
               makes the drive a decision: run the ball over it and the hole
               shortens by four units, come up on the near side of it and the
               approach is played blind over the top. */
            var field = [].concat(
                ridge(5, 19, 14, 21, 4.5, 0.30, 4),
                massif(-6, 18, 12, 2.2, 5),
                [hill(3, 33, 3, -0.6), hill(18.5, 41, 2.5, 0.5)]
            );
            var park = commons(0, [
                [{ d: 5, y: 4.0 },      [3.5, rgh], [8, fwy], [9.5, rgh]],
                [{ d: 3, sz: -0.7 },    [21, rgh]],
                [{ d: 6, sz: -0.15 },   [3.5, rgh], [8, fwy], [9.5, rgh]],
                [10,                    [3.5, rgh], [8, fwy], [9.5, rgh]],
                [5,                     [4.5, rgh], [9, fwy], [7.5, rgh]],
                [3,                     [7, rgh], [2, fwy], [3.5, snd, DIP], [3.5, fwy], [5, rgh]],
                [{ d: 5, sz: 0.24 },    [6, rgh], [10, fwy], [5, rgh]],
                [9,                     [6, rgh], [10, grn], [5, rgh]],
                [4,                     [21, rgh]]
            ]);
            return build({
                name: 'Opening Drive', par: 4, long: true, shaped: true, open: true,
                blurb: 'Three units down off the bluff, over the crest, and back up to a green on a shelf.',
                pads: shape(scoop(park.pads, { seed: 21 }), field),
                fence: park.fence,
                extra: [].concat(
                    treeline(1.7, 14, 1.7, 27, 5),
                    treeline(19.5, 16, 19.5, 29, 4),
                    crags(-2, 10, 3.5, 6, 7101, { s: 1.4, h: 1.1 }),
                    [tree(1.6, 3), tree(2.4, 47.5), tree(19, 47.5)]
                ),
                tee: { x: 7.5, z: 2.5 }, cup: { x: 11.5, z: 41.5 }
            });
        })(),
        (function () {
            /* Hell's Half Acre, which is Pine Valley's seventh and the best
               argument in golf against the second shot being a formality: a
               belt of sand four units deep lying across the fairway at the end
               of a good drive. Nothing in the bag carries it from behind it —
               the longest carry here is about nine and a half units and that is
               the iron flat out — so the hole is three shots for everybody, and
               the only question is whether you lay up short of the belt with
               something you can control or run out of fairway trying to get
               closer to it. The hollow at twenty-six gathers the timid one. */
            var field = [].concat(
                ridge(5, 16, 14, 16, 4.5, 0.28, 4),
                massif(28, 26, 13, 2.4, 5),
                [hill(9, 28.5, 2.5, -0.36), hill(20, 41, 3, 0.45)]
            );
            var park = commons(0, [
                [{ d: 5, y: 3.2 },      [4, rgh], [9, fwy], [9, rgh]],
                [{ d: 4, sz: -0.65 },   [22, rgh]],
                [13,                    [4, rgh], [9, fwy], [9, rgh]],
                [4,                     [4, rgh], [7, fwy], [3, snd, DIP], [8, rgh]],
                [5,                     [5, rgh], [10, fwy], [7, rgh]],
                [4,                     [4, rgh], [14, snd, DIP], [4, rgh]],
                [{ d: 8, sz: 0.2 },     [6, rgh], [11, fwy], [5, rgh]],
                [5,                     [6, rgh], [11, fwy], [5, rgh]],
                [9,                     [5, rgh], [12, grn], [5, rgh]],
                [3,                     [22, rgh]]
            ], { e: 18 });
            return build({
                name: 'Long Meadow', par: 5, long: true, shaped: true, open: true,
                blurb: 'A belt of sand across the fairway that no club carries. Lay up, then pitch it.',
                pads: shape(scoop(park.pads, { seed: 25 }), field),
                fence: park.fence,
                extra: [].concat(
                    treeline(2, 9, 2, 30, 6),
                    treeline(20.3, 12, 20.3, 26, 4),
                    crags(1.5, 5, 2.4, 4, 7107, { s: 1.2, h: 0.9 }),
                    [tree(3, 53), tree(19.5, 54)]
                ),
                tee: { x: 8.5, z: 2.5 }, cup: { x: 11, z: 52.5 }
            });
        })(),
        (function () {
            /* It still turns left around the oak, and the oak still cannot be
               flown by anything in the bag, which is what makes a dogleg a
               dogleg rather than a suggestion. What is new is the ground: the
               tee stands on a bluff, the corner sits under a shoulder of high
               rough that will not let a cut drive run out, and the green is on
               a shelf four fifths of a unit above the fairway with sand eating
               into its front left. */
            var field = [].concat(
                ridge(12, 13, 18, 15, 3.5, 0.26, 3),
                massif(30, 20, 13, 2.3, 5),
                [hill(18, 19, 3.5, 0.45), hill(17, 35, 3, -0.5)]
            );
            var park = commons(0, [
                [{ d: 5, y: 3.4 },      [12, rgh], [8, fwy], [2, rgh]],
                [{ d: 4, sz: -0.65 },   [22, rgh]],
                [9.5,                   [12, rgh], [8, fwy], [2, rgh]],
                [5,                     [4, rgh], [4, snd, DIP], [12, fwy], [2, rgh]],
                [{ d: 6, sz: 0.22 },    [2, rgh], [12, fwy], [8, rgh]],
                [3,                     [2, rgh], [3, snd, DIP], [9, fwy], [8, rgh]],
                [7,                     [2, rgh], [11, grn], [9, rgh]],
                [3,                     [22, rgh]]
            ], { e: 20 });
            return build({
                name: 'The Elbow', par: 4, long: true, shaped: true, open: true,
                blurb: 'Off a bluff, left around an oak older than the course, then two units up to a shelf.',
                pads: shape(scoop(park.pads, { seed: 27 }), field),
                fence: park.fence,
                extra: [].concat(
                    [tree(11.9, 16, { t: 0.9, h: 3 })],
                    treeline(9.6, 10, 10.4, 15, 3),
                    treeline(1.5, 12, 1.5, 23, 4),
                    treeline(20.5, 30, 20.5, 37, 3),
                    crags(19.5, 20, 3, 5, 7113, { s: 1.3, h: 1.0 })
                ),
                tee: { x: 16, z: 2.5 }, cup: { x: 7, z: 36 }
            });
        })(),
        (function () {
            /* The pond hole, and the green is a disc now: a round table on a
               shelf a third of a unit above the water, with sand short-left,
               sand long-right and a bank behind it that will hold a strong one
               up. Only the iron carries the water on the line to the flag —
               carry falls off with the square of the speed, so taking anything
               off it is how you get wet — and the dry way in is still out to
               the right, off the tongue of fairway the pond does not reach. */
            var field = [].concat(
                ridge(4.5, 22, 13.5, 22, 2.0, 0.45, 5),
                massif(-9, 16, 11, 2.1, 5),
                [hill(1.6, 18, 1.6, -0.23)]
            );
            var park = commons(0, [
                [{ d: 3.5, y: 4.2 },    [3, rgh], [9, fwy], [6, rgh]],
                [{ d: 2, sz: -1.35 },   [18, rgh]],
                [4,                     [2.5, rgh], [7.5, null], [2.5, fwy], [5.5, rgh]],
                [{ d: 2, sz: 0.24 },    [2.5, rgh], [13, fwy], [2.5, rgh]],
                [3,                     [1.5, rgh], [2.6, snd, DIP], [11.4, fwy], [2.5, rgh]],
                [5.5,                   [2.5, rgh], [10, fwy], [3, snd, DIP], [2.5, rgh]],
                [4,                     [18, rgh]]
            ], { w: 22 });
            return build({
                name: 'Over the Water', par: 3, long: true, shaped: true, open: true,
                blurb: 'Off a high bluff, over the pond in the bottom, on to a round green on a shelf.',
                pads: shape(scoop(park.pads, { seed: 23 }), field)
                    .concat([circle(7.5, 16, 3.6, grn, 1.98)]),
                fence: park.fence,
                water: [rect(2.5, 5.5, 7.5, 4, 1.0)],
                extra: [].concat(
                    treeline(16.6, 4, 16.6, 12, 3),
                    crags(-5, 14, 3.5, 5, 7119, { s: 1.4, h: 1.1 }),
                    [tree(1.2, 3)]
                ),
                tee: { x: 10.5, z: 1.75 }, cup: { x: 7.5, z: 16.5 }
            });
        })(),
        (function () {
            /* The Dell, which is Lahinch's fifth and the most honest blind hole
               ever built: a green lying in a hollow between two mounds, with
               nothing to aim at but the top of the flag. There is no sand on
               it and it does not need any — the trouble is that you cannot see
               where the ball finished, and the ring of ground round the green
               will feed a good one in and hold a bad one out.

               The ring is authored rather than scattered, for the same reason
               Whinstone's punchbowl is: eight humps standing far enough out
               that not one of their tails reaches the putting surface, so the
               green is a flat round table at the bottom of a bowl of heath. */
            var field = ring(10, 21, 6.4, 3.4, 1.2, 8)
                .concat(massif(-8, 21, 12, 2.4, 5))
                .concat(massif(28, 21, 12, 2.4, 5));
            var park = commons(0, [
                [{ d: 4, y: 3.2 },      [5, rgh], [10, fwy], [5, rgh]],
                [{ d: 3, sz: -0.88 },   [20, rgh]],
                [3,                     [6, rgh], [8, fwy], [6, rgh]],
                [20,                    [20, rgh]]
            ], { m: 18 });
            return build({
                name: 'The Dell', par: 3, long: true, shaped: true, open: true,
                blurb: 'Blind, off a bluff into a dell between two hills. The top of the flag is all you get.',
                pads: shape(park.pads, field).concat([circle(10, 21, 3.0, grn, 0.56)]),
                fence: park.fence,
                extra: [].concat(
                    treeline(1.4, 9, 1.4, 26, 5),
                    treeline(18.6, 9, 18.6, 26, 5),
                    crags(1.2, 15, 3, 5, 7127, { s: 1.3, h: 1.0 }),
                    crags(18.8, 22, 3, 4, 7131, { s: 1.2, h: 0.95 })
                ),
                tee: { x: 10, z: 2 }, cup: { x: 10, z: 21 }
            });
        })(),
        (function () {
            /* The Cape: a lake eating diagonally into the fairway from the
               right, and a tee shot that is a wager rather than a target. Every
               unit of water you take on is a unit off the approach, and the
               shoreline moves further across the hole the further down it you
               go, so there is no line that is safe all the way — only a line
               you are prepared to defend.

               The whole park tilts into the lake as well (`tilt`), a
               twenty-fifth of a unit of fall for every one across, which is
               the thing that makes the wager honest: a drive that finishes on
               the fairway is still on ground running towards the water, and
               the approach is played off a sidehill lie every time.

               The cross-fall is the reason this is the one hole on the course
               that does not take a full margin of country on both sides. The
               lake lies at the bottom of the fall and the ground beyond it
               keeps falling, so a twelve-unit apron out there would finish
               half a unit under the surface of the water. It gets five, and
               the lake gets a far bank the width of a fairway instead of a
               drowned one. */
            var field = [].concat(
                ridge(3, 12, 8, 15, 3.0, 0.25, 3),
                massif(-10, 20, 13, 2.6, 5),
                [hill(6, 27, 1.9, -0.22), hill(8, 39.5, 2.2, 0.4)]
            );
            var park = commons(0, [
                [{ d: 5, y: 1.6 },      [4, rgh], [9, fwy], [9, rgh]],
                [{ d: 4, sz: -0.09 },   [4, rgh], [9, fwy], [3, rgh], [6, null]],
                [{ d: 4, sz: -0.09 },   [4, rgh], [8, fwy], [2, rgh], [8, null]],
                [{ d: 4, sz: -0.09 },   [4, rgh], [7, fwy], [2, rgh], [9, null]],
                [{ d: 4, sz: -0.09 },   [4, rgh], [6, fwy], [2, rgh], [10, null]],
                [{ d: 4, sz: -0.09 },   [4, rgh], [7, fwy], [2, rgh], [9, null]],
                [4,  [5, rgh], [3, fwy], [3, snd, DIP], [4, fwy], [7, rgh]],
                [8,  [5, rgh], [11, grn], [6, rgh]],
                [5,  [22, rgh]]
            ], { e: 5, w: 24 });
            return build({
                name: 'Homeward', par: 4, long: true, shaped: true, open: true,
                blurb: 'The lake cuts across the hole and the ground falls into it. Bite off what you dare.',
                pads: shape(tilt(scoop(park.pads, { seed: 29 }), -0.055, 0, 22, 0), field),
                fence: park.fence,
                water: [
                    rect(16, 5, 6, 4, -0.55),
                    rect(14, 9, 8, 4, -0.7),
                    rect(13, 13, 9, 4, -0.85),
                    rect(12, 17, 10, 4, -1.0),
                    rect(13, 21, 9, 4, -1.1)
                ],
                extra: [].concat(
                    treeline(2, 8, 2, 26, 6),
                    crags(1.4, 30, 3, 5, 7137, { s: 1.3, h: 1.0 }),
                    [tree(19.5, 33), tree(19.5, 36)]
                ),
                tee: { x: 8.5, z: 2.5 }, cup: { x: 10.5, z: 33 }
            });
        })()
    ];

    /* ── the long game, the second of three: Whinstone Links ──────────────

       The course that taught the other two how to be open. There are no rails
       on it anywhere, because there is nothing for a rail to be built on: the
       ground is one piece of rolling country that runs past the fog in every
       direction, and what keeps you on the hole is a line of white stakes and
       the rule that you may cross it but not stop beyond it. Ashdown and
       Dunmore borrow the second half of that through `commons`; what they
       cannot borrow is the first, and it is the whole of this course.

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
            /* The hole that used to be here was called Stake and Ditch and it
               was a corridor. One strip of fairway, a green at the end of it,
               a bunker either side and a boundary drawn tight down the right —
               and the boundary was the whole hole, which is to say the whole
               hole was a rule rather than a piece of ground. Measured against
               its neighbours it was also the flattest thing on the property by
               a factor of three: a unit and a quarter of relief where the rest
               of the course has three and a half, on a course whose entire
               argument is that the ground is the hazard.

               So the stakes stayed and the ground arrived. `massif` puts a
               whinstone dune the size of a hill down the right of it — the
               rock the course is named for, and the reason there are outcrops
               on the crest of it — and the boundary runs along the foot,
               which makes the two halves of the hole one question instead of
               two. Everything you gain by playing away from the dune you give
               back to the stakes.

               A dune this size cannot be flown and is not meant to be: nothing
               in the bag gets above about three units, so four and a half of
               sandhill is a thing you go round. What it does instead is throw
               anything that lands on its flank straight back down — into the
               fairway if you were lucky and over the line if you were not. */
            name: 'The Sandhill', par: 4, open: true,
            blurb: 'A whinstone dune the size of a hill down the right, and the stakes along the foot of it.',
            pads: moor({
                tee: { x: 15, z: 10 }, seed: 7717, n: 44,
                area: { x: 3, z: 3, w: 52, d: 54 },
                r: 5, rMax: 10, grad: 0.21,
                bumps: massif(33, 30, 15, 3.8, 6),
                strips: [
                    [30, [7, rgh], [19, fwy], [32, rgh]],
                    [16, [5, rgh], [19, fwy], [34, rgh]],
                    [14, [58, rgh]]
                ],
                flat: [keep(33, 30, 16), keep(14, 50, 7.5),
                       keep(13.5, 26, 3.6), keep(9, 41, 3.2)],
                inlays: [
                    circle(14, 50, 5.0, grn),
                    circle(13.5, 26, 2.4, snd),
                    circle(9, 41, 2.2, snd)
                ]
            }),
            extra: [].concat(
                crags(33, 30, 5, 7, 7717, { s: 1.6, h: 1.2 }),
                crags(27, 20, 4, 4, 7727, { s: 1.2, h: 0.9 })
            ),
            fence: { x: 4, z: 5, w: 24, d: 52 },
            tee: { x: 15, z: 10 }, cup: { x: 14, z: 50 }
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
        })
    ];


    /* ── crazy golf, the second of five: Pinball Parlour ──────────────────

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
            /* Tilt was a leaning table with two posts on it, and the lean was
               the whole hole — which meant there was one shot on it and the
               only question was whether you had hit it hard enough.

               Two ramps and a drain is the same table with a decision in it.
               The shallow ramp on the left is five units long and forgiving
               and puts you at the back of the deck; the steep one on the right
               is three and wants real pace and puts you beside the pin. Between
               them is the drain, which is sand, and sand keeps four thousandths
               of the ball's speed — miss both and the next shot is played from
               a standing start in a hole. */
            name: 'Two Ramps', par: 3,
            blurb: 'Two ways up to the deck, one steep and one long, and a drain down the middle of them.',
            pads: [
                pad(0, 0, 9, 7),
                pad(0.6, 7, 2.4, 5, 0, 'wood', 0, 0.24),
                pad(3.4, 7, 2.2, 5, 0, 'sand'),
                pad(6, 7, 2.4, 3, 0, 'wood', 0, 0.4),
                pad(6, 10, 2.4, 2, 1.2),
                pad(0, 12, 9, 6, 1.2)
            ],
            extra: [bumper(4.5, 4.2)],
            tee: { x: 4.5, z: 1.6 }, cup: { x: 6.6, z: 15 }
        }),
        build({
            /* Two banks across the mouth of the table, set as a V that opens
               towards the tee, and they are what turns this from a lane with
               blades in it into a table. There is no way down either side any
               more: everything is gathered into a window a metre wide, and the
               bats are on the other side of it. */
            name: 'The Flippers', par: 3,
            blurb: 'Banks that funnel you in, and two bats waiting on the other side of the gap.',
            pads: [pad(0, 0, 7, 16)],
            extra: [
                bank(1.8, 5.4, 2.6, 0.5),
                bank(5.2, 5.4, 2.6, -0.5),
                spinner(1.7, 8.6, 2.6, 0.4, { spin: 1.9 }),
                spinner(4.8, 11.4, 2.6, 0.4, { spin: -2.3 }),
                bumper(3.5, 3.2)
            ],
            tee: { x: 3.5, z: 1.5 }, cup: { x: 2.2, z: 14.4 }
        }),
        build({
            /* The box with no door has gone next door to Tidewater, where a
               hole that can only be answered upwards belongs. What stands here
               instead is the piece of pinball furniture the file could not
               write until `bank` existed: two rails set across the table at
               thirty-five degrees, apex towards the player, with a post in the
               throat between them.

               So there are four ways past and not one of them is straight. A
               window either side of the post, half a metre of aim each and the
               bank right there to throw a near miss across the table; or round
               the outside, which is wider and twice as long and lands you in
               the pair of posts guarding the pin. Nothing here moves. It does
               not need to — an angled wall is a machine for turning a good
               line into somebody else's. */
            name: 'The Slingshots', par: 3,
            blurb: 'Two banks pointing the wrong way, a post in the throat, and no straight line anywhere.',
            pads: [pad(0, 0, 9, 16)],
            extra: [
                bank(2.2, 8.2, 3.2, -0.6),
                bank(6.8, 8.2, 3.2, 0.6),
                bumper(4.5, 7.6, 0.6),
                bumper(2.2, 12.4), bumper(6.8, 12.4)
            ],
            tee: { x: 4.5, z: 1.5 }, cup: { x: 4.5, z: 14.2 }
        }),
        build({
            /* The finisher, and the one hole on the course with two honest
               routes to the flag. A wall across the table with a doorway cut in
               the left of it and a window cut in the right, and the two are
               different shots rather than two of the same:

                 the door    is on the floor and a metre wide. A putt goes
                             through it and nothing else does, so it is a line,
                             and it puts you on the far side with the pace you
                             chose.
                 the window  starts half a unit up and is wider. Nothing on the
                             ground gets through, so it is a weight — and the
                             ball arrives on the other side already in the air,
                             which is a different lie again.

               A gate would have been the obvious thing here and this course has
               one already. A wall with two ways through it is the thing a gate
               cannot be: a choice that is still a choice after you have made
               it.

               And a third way, because this is a pinball table and a ball
               vanishing down a hole to reappear somewhere across the room is
               the most pinball thing there is. The mouth is tucked behind the
               left-hand post where nobody aims on purpose, and it comes out
               past the wall on the right — so the luckiest shot on the hole is
               a bad one, which is also true of pinball. */
            name: 'Jackpot', par: 4,
            blurb: 'A door on the floor, a window in the air, and a hole in the table for the lucky. Three ways past one wall.',
            pads: [pad(0, 0, 9.4, 21)],
            warps: [pipe(1.4, 6.6, 7.7, 13.4, 0, 0.85)],
            extra: [].concat(
                [bumper(2.2, 5), bumper(7.2, 5)],
                aperture(-0.2, 9.6, 4.9, 0.4, { gap: 1.1, at: 2.3, h: 1.7, head: 1.1 }),
                aperture(4.7, 9.6, 5.1, 0.4, { gap: 1.7, at: 2.4, h: 1.6, sill: 0.5, head: 1.45 }),
                [bumper(2.6, 14.4), bumper(6.8, 14.4)],
                [bumper(4.7, 17.6)]
            ),
            tee: { x: 4.7, z: 1.5 }, cup: { x: 4.7, z: 19.4 }
        })
    ];

    /* ── crazy golf, the third of five: Clockwork Court ───────────────────

       Windmill Works asks you to find the gap. This one asks you to find the
       *moment*: every hole on it is a mechanism running at its own rate, and
       the shot that works at one phase of the sine is the shot that comes
       straight back at you a second later. There is nothing here the engine
       could not already do — blades, gates, beams and steps — and that is the
       course. Timing is the whole of it. */

    var clockwork = [
        build({
            /* Two bats rather than two blades, and that one word is the whole
               difference. A blade is always coming round again, so the shot at
               one is a gap in a cycle and the skill is counting. A bat sweeps,
               *stops*, and sweeps back — so the shot is a moment, and the skill
               is seeing it coming. An escapement is the part of a clock that
               turns a continuous push into a series of stops, which is exactly
               what has happened to this hole.

               They are half a beat apart and each leaves a different side of
               the court open at rest, so the two stops are not the same stop
               and a ball through the first is not automatically through the
               second. */
            name: 'Escapement', par: 3,
            blurb: 'Two bats, half a beat apart. They stop at each end of the sweep, and the stop is the shot.',
            pads: [pad(0, 0, 6, 15)],
            extra: [
                flipper(1.8, 6.6, 3.0, { rest: -0.55, arc: 1.1, speed: 2.1 }),
                flipper(4.2, 10.2, 3.0, { rest: 0.55, arc: -1.1, speed: 2.1, phase: Math.PI })
            ],
            tee: { x: 3, z: 1.5 }, cup: { x: 3, z: 13.2 }
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
            /* The Long Hand was one blade the width of the court turning
               slowly, and slowly was indeed worse — but it was also one
               obstacle in a rectangle, which is what three other holes on this
               course already were.

               The gearbox keeps the slow blade and gives it something to
               guard: a door in a wall, off to the right, with the blade
               sweeping across the front of it. There is one line through the
               door and the blade is on it for most of the cycle, so the hole
               is aim and timing at once rather than either on its own. No loft
               in the bag, because a wall you can chip is not a wall. */
            name: 'The Gearbox', par: 3, bag: ['putter', 'mallet'],
            blurb: 'One door, one slow blade turning across the front of it, and nothing in the bag that goes over.',
            pads: [pad(0, 0, 7, 17)],
            extra: [].concat(
                aperture(-0.2, 9.4, 7.4, 0.4, { gap: 1.5, at: 5.0, h: 1.7, head: 1.15 }),
                [spinner(4.8, 6.6, 4.0, 0.4, { spin: 1.0 })]
            ),
            tee: { x: 2.2, z: 1.5 }, cup: { x: 4.8, z: 14.4 }
        }),
        build({
            /* Three blades used to stand on the same centreline, which made
               this a lane with three of the same obstacle in it — and worse,
               one route: the middle. Offsetting them alternately is the whole
               fix. Each one now has a comfortable side and a tight one, and
               they are not the same side, so the way through is a weave with a
               clock on it rather than three attempts at the same gap. */
            name: 'The Cogs', par: 4,
            blurb: 'Three of them, at three rates, and none of them lined up with the last. Two is luck; three is a plan.',
            pads: [pad(0, 0, 6, 21)],
            extra: [
                spinner(2.6, 5, 3.6, 0.4, { spin: 1.5 }),
                spinner(3.4, 10, 3.6, 0.4, { spin: -2.1 }),
                spinner(2.6, 15, 3.6, 0.4, { spin: 2.7 })
            ],
            tee: { x: 3, z: 1.5 }, cup: { x: 4.6, z: 19 }
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
            /* The last hole on the last timing course, and it is the only one
               here that offers a way round rather than a way through. The court
               is nine wide and split down the middle for its whole length:
               everything the hole has is on one side or the other, and the two
               sides are different problems.

                 the west lane  a sliding gate and then a bat, both of them
                                fast. Two moments, and they are eight units
                                apart, which is long enough that arriving at
                                the second with the pace the first wanted is
                                the actual difficulty.
                 the east lane  no clock at all — a door in a wall and a bar to
                                roll under. Nothing on that side is timed and
                                nothing on it is wide.

               So the choice is not "which is easier", it is "which kind of
               hard": a hole that asks whether you would rather count or aim,
               at midnight, with everything running. */
            name: 'Midnight', par: 4,
            blurb: 'Two lanes to the same flag: one with a clock on it, one with a door. Count, or aim.',
            pads: [pad(0, 0, 9, 24)],
            extra: [].concat(
                // the spine, with a way into each lane at the top
                [wall(4.3, 3.4, 0.4, 14.4, 0.62, { base: -0.1 })],
                // west: a gate, then a bat
                [
                    wall(0, 6.6, 1.1, 0.4, 0.6, { base: -0.1 }),
                    wall(3.1, 6.6, 1.2, 0.4, 0.6, { base: -0.1 }),
                    slider(1.2, 6.6, 1.5, 0.4, { amp: 0.62, speed: 2.0 })
                ],
                [flipper(2.15, 13.4, 2.6, { rest: -0.5, arc: 1.0, speed: 2.4 })],
                // east: a door and a bar, neither of which is counting
                aperture(4.7, 7.6, 4.5, 0.4, { gap: 1.2, at: 1.5, h: 1.7, head: 1.1 }),
                beam(5.1, 14.2, 3.6, 0.5),
                [bumper(6.6, 20.4)]
            ),
            tee: { x: 4.5, z: 1.6 }, cup: { x: 4.5, z: 21.8 }
        })
    ];

    /* ── crazy golf, the fourth of five: The Millrace ──────────────────────

       The other three timing courses are played over a floor. Windmill Works
       asks you to find the gap, Clockwork Court asks you to find the moment,
       Pinball Parlour asks for neither and makes the furniture the route — and
       on all three of them a mistimed shot is a bounce. The blade throws the
       ball back down the lane, you walk after it, and you have lost a stroke
       of position and nothing else.

       Here every machine stands over water, and that one change is the whole
       course. The mill is driven by the river, so the river runs through every
       hole on it: along the lane, under the crossing, round the outside of the
       bend. What that does to the golf is turn timing from a matter of
       *position* into a matter of *price*. A window you would take on any of
       the other three courses is a window you have to mean here, because the
       cost of being wrong is a stroke and the shot again from where you played
       it.

       Which makes laying up a real option for the first time on a crazy golf
       course. Three of these six can be played short of the machine on purpose
       and the fourth shot from there is an easy one; the card says par and the
       water says whether you believed it. */

    var millrace = [
        build({
            /* The opener says the rule of the course in one picture: the race
               runs down the east side of the lane for its whole length, there
               is no rail between the two, and the paddle sweeps out over the
               water and back across the lane.

               It is the friendliest arrangement of that rule. The paddle turns
               about a point west of the middle of the lane, so the two ways
               past it are not the same size: a metre and a bit against the
               west rail, and rather more than two on the east — where the
               river is. Play away from the water and you are threading the
               narrow side; take the room and you are playing along the bank.
               Nothing on the hole is tight, and the choice it asks for is the
               one every other hole here asks for again. */
            name: 'Headrace', par: 3,
            blurb: 'The race runs down the whole east side and the paddle sweeps across the rest. Pick a side.',
            pads: [pad(0, 0, 7, 16)],
            water: [rect(7, -1, 6, 18, -0.7)],
            gaps: [{ x: 6.6, z: -1, w: 0.8, d: 18 }],
            extra: [spinner(3.0, 8, 3.6, 0.4, { spin: 1.3 })],
            tee: { x: 2.2, z: 1.6 }, cup: { x: 2.6, z: 13.6 }
        }),
        build({
            /* Two crossings and one gate for both of them, which is a nicer
               problem than a gate on one crossing: whichever plank the gate is
               sitting on, the other one is open, so the hole can never be shut
               and the only question is which way to go and when.

               The numbers are the hole. The planks are at 1.0 and 5.8, the
               gate is 2.4 wide and swings 2.4 either side of 3.3, so it covers
               the west plank exactly at one end of its travel and the east one
               exactly at the other. And a sine *dwells* at the ends of its
               travel and crosses the middle at speed — so the gate rests on
               one plank, hurries over the water, and rests on the other, which
               means the moment when both crossings are open is a moment rather
               than a state. A ball that sets off for the plank the gate is
               leaving arrives after it has gone; one that sets off for the
               plank it is heading for arrives to find it shut. That is the
               entire hole, and it is readable from the tee, which is what a
               second hole on a course ought to be. */
            name: 'Two Planks', par: 3,
            blurb: 'One gate for two crossings. It cannot shut both, and it is always on its way to one of them.',
            pads: [
                pad(0, 0, 9, 7),
                pad(1, 7, 2.2, 4, 0, 'wood'),
                pad(5.8, 7, 2.2, 4, 0, 'wood'),
                pad(0, 11, 9, 7)
            ],
            water: [rect(-2, 7, 13, 4, -0.8)],
            gaps: [shore(rect(-2, 7, 13, 4), 0.7)],
            extra: [slider(3.3, 8.6, 2.4, 0.4, { amp: 2.4, speed: 1.1 })],
            tee: { x: 4.5, z: 1.6 }, cup: { x: 4.5, z: 15 }
        }),
        build({
            /* The wheel itself, and the one hole on the course with no way
               round: a single plank over the race with the undershot wheel
               turning on top of it. The wheel is longer than the plank is
               wide, so at the bottom of every turn it covers the crossing
               completely and its ends are out over the water either side.

               It turns at 0.9, which is a seven-second revolution, and it
               shuts the crossing for about a second and a half of each one.
               That is not long. It is also the only crossing there is, and the
               wheel sweeps a ball off the plank as readily as it stops one —
               so a shot that sets off a beat early does not come back down the
               lane the way a mistimed shot does in the works, it goes in the
               race. That is the difference between this hole and every
               windmill in the file. */
            name: 'The Undershot', par: 3,
            blurb: 'One plank, one wheel on it, and no dry way round. Count the turn before you hit it.',
            pads: [
                pad(0, 0, 7, 7),
                pad(2, 7, 3, 5, 0, 'wood'),
                pad(0, 12, 7, 7)
            ],
            water: [rect(-3, 7, 13, 5, -0.8)],
            gaps: [shore(rect(-3, 7, 13, 5), 0.7)],
            extra: [spinner(3.5, 9.5, 4.2, 0.42, { spin: 0.9 })],
            tee: { x: 3.5, z: 1.6 }, cup: { x: 3.4, z: 15.4 }
        }),
        build({
            /* Over the weir, which is the one place on a mill where the water
               is doing the falling rather than the turning. The face is a
               plank ramp: slick, and steeper than anything holds a ball on, so
               whatever goes over the top arrives at the bottom with pace it
               did not choose — and the tailrace is open down the whole east
               side of the lower lane, with a bat standing at the foot of the
               fall.

               The bat is what makes the drop a decision instead of a slide.
               A ball that reaches it at rest is turned east, at the race; the
               same ball half a beat later is turned west, on to the side of
               the lane the pin is on. It is not stopped by the thing either
               way — it is *sent*, and which of those two it is, is the hole.
               Which is also the whole reason this course is built out of water
               rather than rails: the price of reading it wrong is a stroke
               rather than a walk. */
            name: 'The Weir', par: 4,
            blurb: 'Down the face and into the bat at the bottom. It will send you at the pin or at the race.',
            pads: [
                pad(0, 0, 6, 8, 1.1),
                pad(0, 8, 6, 2.5, 1.1, 'wood', 0, -0.44),
                pad(0, 10.5, 7, 10)
            ],
            water: [rect(7, 9, 5, 12, -0.7)],
            gaps: [{ x: 6.6, z: 9, w: 0.8, d: 12 }],
            extra: [flipper(3.2, 13.2, 3.0, { rest: -0.5, arc: 1.05, speed: 2.0 })],
            tee: { x: 3, z: 1.8 }, cup: { x: 2.6, z: 18 }
        }),
        build({
            /* The turn, and the water is on the outside of it — which is what
               a tailrace is: the channel the wheel throws its water into,
               running away from the mill along the bottom of the bend.

               A corner with a hazard on the outside is a different shot from a
               corner with a rail there, and the difference is that the rail
               forgives an overcooked one. Nothing here does. The blade in the
               straight decides when you may set off; the bat in the corner
               decides where the ball goes when it arrives, and the corner has
               no back wall to catch a ball the bat sends wide. */
            name: 'The Tailrace', par: 4,
            blurb: 'North, then east along the channel — with a blade to time and a bat where the rail should be.',
            pads: [pad(0, 0, 5, 12), pad(5, 8, 9, 4)],
            water: [rect(5, 12, 10, 4, -0.7)],
            gaps: [{ x: 5.0, z: 11.6, w: 9.2, d: 0.8 }],
            extra: [
                spinner(2.5, 5.5, 3.2, 0.4, { spin: 1.6 }),
                flipper(7.6, 10, 2.8, { rest: 0.4, arc: -1.0, speed: 1.9 })
            ],
            tee: { x: 2.5, z: 1.6 }, cup: { x: 12, z: 10 }
        }),
        build({
            /* The finisher, and the only hole on the course that offers a dry
               way to the green. The pond is nine wide and six deep with a
               plank across the middle of it and a gate on the plank; east of
               the water there is a bank you can walk round, and it is twice as
               far and it lands you in sand.

               The gate is narrower than the plank on purpose. It cannot shut
               the crossing — there is always seventy centimetres of daylight
               at one end or the other — so the short way is never *closed*,
               it is only ever tight, which is a harder thing to decline than a
               shut door. And both roads finish at the same wheel in front of
               the pin, because a hole with two routes should ask the same last
               question of each of them. */
            name: 'Full Flow', par: 4,
            blurb: 'The plank and the gate, or the long dry bank and the sand. Both of them end at the wheel.',
            pads: [
                pad(0, 0, 12, 7),
                pad(1.2, 7, 2.4, 6, 0, 'wood'),
                pad(7, 7, 5, 6),
                pad(0, 13, 7, 8),
                pad(7, 13, 5, 2.5, 0, 'sand'),
                pad(7, 15.5, 5, 5.5)
            ],
            water: [rect(-2, 7, 9, 6, -0.8)],
            gaps: [shore(rect(-2, 7, 9, 6), 0.7)],
            extra: [
                slider(1.55, 9.4, 1.7, 0.4, { amp: 1.15, speed: 1.8 }),
                spinner(3.4, 14.8, 3.8, 0.42, { spin: 1.5 })
            ],
            tee: { x: 5, z: 1.8 }, cup: { x: 3.4, z: 17.6 }
        })
    ];

    /* ── crazy golf, the fifth of five: The Belfry ─────────────────────────

       Four courses of machinery already ask four different questions. Windmill
       Works asks you to find the gap, which is a question about *where*.
       Clockwork Court asks you to find the moment, which is a question about
       *when*. Pinball Parlour asks neither and makes the furniture the route.
       The Millrace asks what being wrong costs.

       This one asks a fifth, and it is the only one that cannot be answered by
       looking at one machine: **every hole here has two of them, geared to each
       other.** Two gates at two rates, two bells at three against two, four
       shutters a quarter-beat apart, a door on each side of a wall with a
       different clock behind it. Each machine on its own is an easy one —
       there is always a way past every single obstacle on this course, and
       most of them are wide. What is not easy is arriving at the second one
       having set off at the right moment for the first.

       So the skill is counting bars rather than beats. A ball that clears the
       opening gate on the first stroke of the cycle reaches the second gate
       half a beat later than one that cleared it on the last, and the second
       gate does not care which of those you did — it is running to its own
       time, and the two only agree every so often. Change ringing is exactly
       that arithmetic and it is where the course gets its name: bells rung not
       as a tune but as a sequence of permutations, and you wait for the one you
       want to come round.

       Two things keep it fair, and both are load-bearing:

       - **Nothing here can shut a hole.** Every mechanism leaves a window in
         its own line at every phase — the tests demand that of the whole file,
         and here it is also the design, because a course about compound timing
         with a shut door on it would be a course about waiting.
       - **The rates are small whole numbers.** 2:1, 3:2, 1:4, and a wave of
         four bats a quarter of a cycle apart. A player can hear those; nobody
         can count 7:5, and a pattern nobody can count is a pattern that reads
         as random — which is the one thing a timing course must never be. */

    var belfry = [
        build({
            /* The plainest statement of the idea: two gates in the same lane,
               the far one running at half the rate of the near one.

               Each is a gate the near end of Windmill Works would have been
               happy with — a slider between two jambs, a metre and a half of
               daylight at the tightest — and either of them alone is a shot
               anybody makes. Together they are a different thing, because the
               far gate goes through one cycle for every two of the near one:
               the pair only shows you the same picture every other beat, and a
               ball let through the first at the wrong end of its swing arrives
               at the second exactly when it is closing.

               The second gate starts half a cycle out of phase, which is what
               puts the good window somewhere other than the start of the
               pattern. Without that the answer to the hole is "hit it at once"
               and the arithmetic never comes up. */
            name: 'Half Time', par: 3,
            blurb: 'Two gates, and the far one runs at half the rate of the near one. They agree every other beat.',
            pads: [pad(0, 0, 6, 17)],
            extra: [
                wall(0, 6, 1.5, 0.4, 0.6, { base: -0.1 }),
                wall(4.5, 6, 1.5, 0.4, 0.6, { base: -0.1 }),
                slider(1.6, 6, 1.4, 0.4, { amp: 0.75, speed: 2.0 }),
                wall(0, 11, 1.5, 0.4, 0.6, { base: -0.1 }),
                wall(4.5, 11, 1.5, 0.4, 0.6, { base: -0.1 }),
                slider(3.0, 11, 1.4, 0.4, { amp: 0.75, speed: 1.0, phase: Math.PI })
            ],
            tee: { x: 3, z: 1.6 }, cup: { x: 3, z: 14.6 }
        }),
        build({
            /* Three against two, which is the first rhythm anybody learns that
               cannot be tapped with one hand: the two bells come back into step
               every third turn of the fast one and every second turn of the
               slow one, and in between they are never quite where they were.

               It is played round a corner rather than down a lane, and the
               corner is what makes the ratio matter. On a straight hole the
               second machine is simply further away, so hitting the ball
               harder is a way of choosing when you arrive at it. Here the ball
               has to stop turning before it goes east, so the time between the
               two bells is set by the corner rather than by the club — and the
               only thing left to choose is which turn of the fast bell you set
               off on. */
            name: 'Three Against Two', par: 3,
            blurb: 'Two bells at three against two, with a corner between them to fix how long you take.',
            pads: [pad(0, 0, 5, 10), pad(5, 6, 7, 4)],
            extra: [
                spinner(2.5, 5, 3.2, 0.4, { spin: 2.1 }),
                spinner(8, 8, 3.2, 0.4, { spin: 1.4 })
            ],
            tee: { x: 2.5, z: 1.5 }, cup: { x: 10.5, z: 8 }
        }),
        build({
            /* Rounds — the bells struck in order from the treble down, which
               is where change ringing starts and the only sequence in it
               anybody can hear without being told. Four shutters across the
               lane, each a quarter of a cycle behind the one before it, so the
               open side travels away from you down the hole at a fixed rate.
               Set off on the beat and the gap stays in front of the ball the
               whole way — about two fifths of every cycle is a departure that
               rides it clean to the cup. Set off on any of the rest and the
               first shutter is across the lane when you get there, which costs
               a bounce and nothing else. That is the trade the hole is built
               on: an ace is on the table, and missing it leaves you playing
               the same hole again from four units up it.

               **The shutters are not evenly spaced, and that is the hole.** A
               ball is not a metronome — it is slowing down the whole time — so
               a wave moving at a constant rate can only be ridden by a ball
               whose gaps shrink to match. On a floor with a friction of k the
               ball's speed decays by e^(-k·d) over a distance d, so a quarter
               of a cycle later it has covered e^(-kT) of what it covered
               before: the spacing is geometric, and every gap here is 0.70 of
               the one before it. Four units, then 2.8, then 1.94.

               Which is also why the floor is boards. On grass a ball loses
               1.2 of speed per unit and the gaps would have to more than halve
               each time — three shutters in the space of two — and the fourth
               would be somewhere the ball was barely moving. On planks it
               loses 0.6, and the geometry above comes out at a spacing you can
               see from the tee and read as a wave. The speed the whole hole is
               drawn around is 7.9 at the first shutter, which is what a full
               swing of the putter has left by the time it gets there.

               Nothing here can shut the lane: a shutter is 3.6 of a 6-unit
               floor and slides 1.2 either way, so there are 2.4 units of
               daylight at one side or the other at every phase, and the
               tightest moment is 1.2 down each. Being wrong costs a bounce,
               not the hole. */
            name: 'Rounds', par: 4,
            blurb: 'Four shutters, each a quarter-beat behind the last, opening away from you. The gaps shrink because the ball is slowing.',
            pads: [pad(0, 0, 6, 22, 0, 'wood')],
            extra: [
                slider(1.2, 6.0, 3.6, 0.4, { amp: 1.2, speed: 2.6, phase: Math.PI / 2 }),
                slider(1.2, 10.0, 3.6, 0.4, { amp: 1.2, speed: 2.6, phase: 0 }),
                slider(1.2, 12.8, 3.6, 0.4, { amp: 1.2, speed: 2.6, phase: -Math.PI / 2 }),
                slider(1.2, 14.74, 3.6, 0.4, { amp: 1.2, speed: 2.6, phase: -Math.PI })
            ],
            tee: { x: 1.2, z: 1.6 }, cup: { x: 1.2, z: 19 }
        }),
        build({
            /* Two doors in one wall, and a different clock behind each of
               them: a bat on the left running fast, a bell on the right
               running slow. Neither door is harder to hit than the other. What
               differs is what you have to know before you take the shot,
               because the machine behind a door is the one thing a door hides.

               So this is the course's question asked backwards. Everywhere
               else the two machines are both in front of you and the problem
               is fitting them together; here the second one is out of sight
               from the tee and the first thing to work out is which of them
               you would rather be arriving at. The wall is far enough up the
               hole that a lay-up short of it is a real option and the two
               doors are then a metre apart — which is the polite version of
               this hole, and the card says par three either way. */
            name: 'Change Ringing', par: 3,
            blurb: 'Two doors in one wall with a different clock behind each. Pick the one whose beat you can count.',
            pads: [pad(0, 0, 8, 18)],
            extra: [].concat(
                aperture(-0.2, 7, 4.4, 0.4, { gap: 1.4, at: 2.2, h: 1.7, head: 1.15 }),
                aperture(4.2, 7, 4.0, 0.4, { gap: 1.4, at: 2.0, h: 1.7, head: 1.15 }),
                [
                    flipper(2.0, 10.4, 2.6, { rest: -0.45, arc: 0.95, speed: 2.4 }),
                    spinner(6.2, 11, 3.0, 0.4, { spin: 1.5 })
                ]
            ),
            tee: { x: 4, z: 1.6 }, cup: { x: 4, z: 15.4 }
        }),
        build({
            /* The tenor is the deepest bell in a ring and the slowest, and it
               is what the others are rung against. So: one of them, five units
               long and turning at 0.7 — nine seconds a revolution, which is
               slower than anything else in the file — with a small one in the
               straight before it going four times as fast.

               Four to one is the easiest ratio on the course to hear and the
               hardest to use, because the fast bell is the one you have to get
               past first and it hands you four different departure times per
               turn of the slow one. Three of them are wrong. The dogleg is
               what makes that a decision rather than a guess: the elbow is
               somewhere to stop, so a player who does not fancy the maths can
               play two shots and take the tenor on its own. */
            name: 'The Tenor', par: 4,
            blurb: 'A small bell at four to one in front of the biggest one in the tower. Or stop in the elbow and take them one at a time.',
            pads: [pad(0, 0, 6, 9), pad(0, 9, 13, 5)],
            extra: [
                spinner(3, 5, 2.4, 0.35, { spin: 2.8 }),
                spinner(7, 11.5, 5.0, 0.5, { spin: 0.7 })
            ],
            tee: { x: 3, z: 1.5 }, cup: { x: 11, z: 11.5 }
        }),
        build({
            /* The finisher, and the one hole here with two ways round rather
               than two things in a row. The frame the bells hang in stands in
               the middle of the floor — solid, six units of it, no way through
               — and the two lanes past it are a different rhythm each.

               The west lane has a bell swinging across it at 2.4, so the
               window comes round every one and a third seconds and is gone
               again; the east lane has a bat at 1.2 that rests, sweeps and
               rests, so its window is long and it comes round half as often.
               Fast and often against slow and roomy. Both lanes rejoin in
               front of the green.

               That is the whole course in one hole and it is deliberately not
               a hard one: the last hole on a card should be the one you can
               tell somebody about afterwards, and "I went round the other
               side" is a better story than a shot nobody could have made. */
            name: 'Full Circle', par: 4,
            blurb: 'The bell frame splits the floor. Fast and often on the west, slow and roomy on the east.',
            pads: [pad(0, 0, 11, 21)],
            extra: [
                wall(4, 7, 3, 6, 0.75, { base: -0.1 }),
                slider(1.0, 10, 1.4, 0.4, { amp: 0.9, speed: 2.4 }),
                flipper(9.0, 10, 3.0, { rest: 0.5, arc: -1.0, speed: 1.2 })
            ],
            tee: { x: 5.5, z: 1.6 }, cup: { x: 5.5, z: 18 }
        })
    ];

    /* ── adventure golf, the first of three: Icehouse Yard ────────────────

       A fourth kind of golf, and the thing it has that the other three do not
       is a floor with an opinion. Mini golf gives you a lane and a rail, crazy
       golf gives you a machine to time, the long game gives you country to
       read — and all three of them are played on ground that sits still and
       waits. Here the ground is the obstacle: a surface that will not let the
       ball stop, a belt that carries it somewhere it did not ask to go, a pad
       that throws it in the air, a pipe that puts it somewhere else entirely.

       This course is the first of those, and it is one idea all the way
       through: **nothing stops.** A putter at full power runs eight and a half
       units on a green and thirty-two on ice, so every hole here is about
       weight and none of them is about reach. What that turns into, hole by
       hole, is a course where the interesting question is always *where do I
       want the ball to stop*, and the only honest answers are grass, sand, or
       something the ball has run out of speed before reaching.

       The grip numbers are in config.js and they are the whole course: ice
       keeps 72% of its speed per second where a green keeps 30%, and holds a
       stopped ball on a gradient of about two thirds of a degree. Flat ice is
       somewhere a ball can rest. Tilted ice is a one-way street, and The
       Draught is nothing but that. */

    var ice = 'ice';

    var icehouse = [
        build({
            /* The opener, and it teaches the one number the course is built
               on by giving you nowhere to hide from it: twenty units of bare
               ice with a patch of grass at the end. Half a swing of the putter
               is already too much. */
            name: 'Cold Store', par: 3,
            blurb: 'Twenty units of ice and a patch of grass at the end of it. Half a swing is too much.',
            pads: [
                pad(0, 0, 6, 3),
                pad(0, 3, 6, 17, 0, ice),
                pad(0, 20, 6, 6)
            ],
            tee: { x: 3, z: 1.5 }, cup: { x: 3, z: 23 }
        }),
        build({
            /* Grit across the ice, with a gap in it. Sand keeps four
               thousandths of the ball's speed per second, so the strip is not
               an obstacle you cross slowly — it is one you do not cross at
               all. The gap is a metre and a half wide at the far side, which
               makes this the first hole on the course where the line matters
               as much as the weight. */
            name: 'The Salt Line', par: 3,
            blurb: 'A bar of grit across the ice with one gap in it. Sand does not let go.',
            pads: [
                pad(0, 0, 6, 2.5),
                pad(0, 2.5, 6, 6.5, 0, ice),
                pad(0, 9, 4.4, 1.6, 0, 'sand'), pad(4.4, 9, 1.6, 1.6, 0, ice),
                pad(0, 10.6, 6, 8, 0, ice),
                pad(0, 18.6, 6, 5)
            ],
            tee: { x: 2, z: 1.4 }, cup: { x: 3.4, z: 21 }
        }),
        build({
            /* Iced ground with a fall on it, which is a different object
               altogether from iced ground that is flat. CONFIG.HOLD.ice is a
               gradient of about two thirds of a degree, so a sheet with any
               tilt at all is somewhere the ball cannot stop — it is a chute
               with no walls. The whole hole is one: a ledge to play from, a
               sheet falling away east, and a gutter of ordinary grass at the
               bottom of it with the pin in it. Land anywhere on the ice and
               the ice decides where you finish; the only choice you have is
               how far down the gutter that turns out to be. */
            name: 'The Draught', par: 3,
            blurb: 'The whole sheet falls east and ice holds nothing. The gutter at the bottom is the hole.',
            pads: [
                pad(0, 0, 2.4, 9, 0.72),
                pad(2.4, 0, 5.6, 18, 0.72, ice, -0.12857, 0),
                pad(8, 0, 2.6, 18)
            ],
            tee: { x: 1.2, z: 2 }, cup: { x: 9.3, z: 15 }
        }),
        build({
            /* And the first travelator: a belt running across the ice at the
               turn, which is the one thing on this course that can move a ball
               that has stopped. Too slow into it and the belt is the whole of
               your second shot; too fast and it puts you in the grit on the
               far side. */
            name: 'The Sluice', par: 3,
            blurb: 'A belt across the corner, and grit on the far side of it. Let it take you round.',
            pads: [
                pad(0, 0, 5, 4),
                pad(0, 4, 5, 8, 0, ice),
                belt(0, 12, 5, 3.4, 7.5, 0),
                pad(0, 15.4, 5, 2.6, 0, 'sand'),
                pad(5, 12, 6, 3.4, 0, ice),
                pad(11, 12, 5, 3.4)
            ],
            tee: { x: 2.5, z: 1.6 }, cup: { x: 13.4, z: 13.7 }
        }),
        build({
            /* The Checker's hole, and the reason the club exists. The green is
               a sheet of ice standing half a unit above everything around it:
               there is no running a ball up on to it, because there is nothing
               to run up, and there is no stopping one on it either, because it
               is ice. The bag is a putter that cannot get there, an iron that
               gets there and keeps going, and one club that arrives and stays. */
            name: 'Glass Table', par: 3, needsLoft: true,
            bag: ['putter', 'iron', 'checker'],
            blurb: 'An iced table with nothing to run up and nothing to stop on. One club in the bag arrives and stays.',
            pads: [
                pad(0, 0, 9, 7),
                pad(1, 8.4, 7, 7, 0.55, ice)
            ],
            gaps: [brink({ x: 1, z: 8.4, w: 7, d: 7 }, 0.4)],
            tee: { x: 4.5, z: 2 }, cup: { x: 4.5, z: 11.9 }
        }),
        build({
            /* The finisher: a long iced hall, a belt at the corner that is the
               only way round it, and a green of honest grass at the far end —
               the first flat, grippy, ordinary ground the course has offered in
               six holes, and by now it reads as a reward. */
            name: 'The Cold Room', par: 4,
            blurb: 'Down the hall, round the belt, and out on to the only grass in the building.',
            pads: [
                pad(0, 0, 5, 3),
                pad(0, 3, 5, 9, 0, ice),
                belt(0, 12, 5, 4, 6.5, 0),
                pad(0, 16, 5, 3, 0, 'sand'),
                pad(5, 12, 9, 4, 0, ice),
                pad(14, 12, 6, 4)
            ],
            extra: [wall(5, 16, 9, 0.34, 0.55, { base: -0.1 })],
            tee: { x: 2.5, z: 1.5 }, cup: { x: 17, z: 14 }
        })
    ];

    /* ── adventure golf, the second of three: Helter Skelter ───────────────

       The other half of the idea. Icehouse Yard takes the friction away and
       changes nothing else; this one leaves the floor exactly as grippy as a
       green has always been and gives it machinery instead — launch pads,
       travelators and pipes.

       All three are the ground rather than things standing on it, and that is
       what makes them a different proposition to play against. A rail is
       something you can aim at: hit it at the right angle and it gives you
       back a shot you chose. None of these will. You cannot bank off a belt
       or put spin on a pipe; the only decision any of them offers is whether
       to be on it, and after that they are simply what happens next. Which is
       exactly what a fairground ride is, and why the course is one. */

    var skelter = [
        build({
            /* Launch pads, introduced the only honest way: a wall with no way
               round it, a pad in front of the wall, and a bag with no loft in
               it at all. The ball goes over because the floor throws it over,
               and the first time it happens is worth the whole course. */
            name: 'The Springboard', par: 3, bag: ['putter', 'mallet'],
            blurb: 'A wall too tall to fly and a bag with nothing that flies. Stand on the pad instead.',
            pads: [
                pad(0, 0, 6, 20),
                sprung(3, 8.6, 1.3, 10.2)
            ],
            extra: [wall(-0.2, 10.2, 6.4, 0.4, 1.35, { base: -0.1 })],
            tee: { x: 3, z: 1.6 }, cup: { x: 3, z: 16.5 }
        }),
        build({
            /* And the pipes. Eleven units of water, which is more than
               anything in the bag carries — the iron is the longest flight in
               the game at about nine and a half — so the mouth is not a short
               cut, it is the hole. It sits off the middle of the floor on
               purpose: a pipe you cannot miss is a corridor with extra steps. */
            name: 'Through the Pipe', par: 3,
            blurb: 'Nothing in the bag carries this. Find the mouth; it comes out facing the pin.',
            pads: [
                pad(0, 0, 8, 10),
                pad(0, 21, 8, 9)
            ],
            water: [rect(-2, 10, 12, 11, -0.8)],
            gaps: [shore(rect(-2, 10, 12, 11), 0.6)],
            warps: [pipe(5.6, 7.4, 2.4, 24, 0, 0.95)],
            tee: { x: 2.6, z: 1.6 }, cup: { x: 4, z: 28 }
        }),
        build({
            /* Three belts across the floor, running east, west and east. A
               ball putted straight at the flag arrives a long way east of it,
               and the amount it arrives east by depends on how hard it was
               hit — a slow ball spends longer on each belt and is thrown
               further. So the aim and the weight stop being two decisions and
               become one, which is a thing no rail in this file has ever
               managed to do. */
            name: 'Crosstown', par: 4,
            blurb: 'Three walkways, running three ways. Aim where the flag is not.',
            pads: [
                pad(0, 0, 14, 6),
                belt(0, 6, 14, 3, 7, 0),
                pad(0, 9, 14, 2),
                belt(0, 11, 14, 3, -7, 0),
                pad(0, 14, 14, 2),
                belt(0, 16, 14, 3, 7, 0),
                pad(0, 19, 14, 7)
            ],
            tee: { x: 7, z: 2 }, cup: { x: 7, z: 23 }
        }),
        build({
            /* Two moats and two launch pads, and the pads are the bridges.
               Getting on to one is a putt; getting off it well is a matter of
               how fast you were going when you did, because a launch pad
               throws the ball straight up and hands the crossing to whatever
               forward speed it already had.

               It is deliberately *not* flagged `needsLoft`, and the reason is
               worth writing down because it looks like an oversight: the flag
               means "there is no route along the floor", and a launch pad is a
               route along the floor. The bot proved it — handed a bag with no
               loft in it at all, it holed this in one. Which is the nicest
               thing that could be said about the mechanic. */
            name: 'Bounce Alley', par: 3,
            blurb: 'Two moats, two launch pads and no bridge. The pace you arrive at is the distance you fly.',
            pads: [
                pad(0, 0, 8, 6),
                sprung(4, 4.4, 1.3, 9.8),
                pad(0, 11, 8, 5),
                sprung(4, 13.6, 1.3, 9.8),
                pad(0, 21, 8, 7)
            ],
            water: [rect(-2, 6, 12, 5, -0.8), rect(-2, 16, 12, 5, -0.8)],
            gaps: [shore(rect(-2, 6, 12, 5), 0.6), shore(rect(-2, 16, 12, 5), 0.6)],
            tee: { x: 4, z: 1.6 }, cup: { x: 4, z: 25 }
        }),
        build({
            /* Up on to the gallery, along it on the belt, and off the end of
               it. The window on the first shot is the whole hole: too slow and
               the pad drops you back where you started, too hard and you are
               still climbing when you reach the front of the gallery and you
               hit the face of it. */
            name: 'Up and Over', par: 4,
            blurb: 'A pad on to the gallery, a walkway along it, and a drop off the far end.',
            pads: [
                pad(0, 0, 6, 9),
                sprung(3, 7.4, 1.3, 10.2),
                pad(0, 10.6, 6, 3, 1.8),
                belt(0, 13.6, 6, 5, 0, 9, { y: 1.8 }),
                pad(0, 18.6, 6, 3, 1.8),
                pad(0, 21.6, 8, 7)
            ],
            gaps: [brink({ x: 0, z: 10.6, w: 6, d: 11 }, 0.4)],
            tee: { x: 3, z: 2 }, cup: { x: 4, z: 25 }
        }),
        build({
            /* Gravity is a number, and this is the hole that changes it.

               Two fifths of a g. Nothing about the course is different — same
               pads, same friction, same angle of repose, same solver — and
               everything about playing it is, because carry goes as 1/g and so
               does apex. A launch pad rated at seven throws the ball three and
               a half units up instead of one and a half and hangs it there for
               two seconds, and a moat seven units across stops being a carry
               and becomes a flight.

               The bag is a putter and a mallet, which is to say no loft at all,
               and that is what keeps the hole honest: in a third of a g a wedge
               carries twenty units and every hazard here is decoration. The
               only thing that puts the ball in the air is the floor, and the
               only thing that decides where it lands is how hard you hit it
               before you got there. The putter reaches the far island. The
               mallet flies it into the second moat. That is the hole.

               A doorway on the middle island, off to the left, because a hole
               where the only skill is weight is half a hole — you have to land
               on the island *and* be able to get from where you landed to the
               second pad. */
            name: 'The Gravitron', par: 4, gravity: 0.4,
            bag: ['putter', 'mallet'],
            blurb: 'Two fifths of a g. The pads throw you three times as far and nothing in the bag flies at all.',
            pads: [
                pad(0, 0, 9, 7),
                sprung(4.5, 5.4, 1.4, 7.2),
                pad(0, 14, 9, 7),
                sprung(4.5, 19.4, 1.4, 7.2),
                pad(0, 28, 9, 8)
            ],
            water: [rect(-2, 7, 13, 7, -0.8), rect(-2, 21, 13, 7, -0.8)],
            gaps: [shore(rect(-2, 7, 13, 7), 0.6), shore(rect(-2, 21, 13, 7), 0.6)],
            extra: aperture(-0.2, 16.8, 9.4, 0.4, { gap: 1.5, at: 2.6, h: 1.7, head: 1.15 }),
            tee: { x: 4.5, z: 1.8 }, cup: { x: 4.5, z: 32 }
        })
    ];

    /* ── adventure golf, the last of three: Cinder Cone ────────────────────

       Icehouse Yard takes the friction away. Helter Skelter leaves the floor
       alone and bolts machinery to it. This one puts both on the side of a
       mountain and points everything downhill.

       The idea is one sentence: **the mountain is trying to put the ball back
       at the bottom.** Every belt below the rim has the fall in it — one
       running straight back at the tee, two more pushing south and east off
       the side of a shelf — and every vent throws the ball up a step it could
       not have climbed. So the question on an Icehouse hole is where you want
       to run out of speed, the question on a Helter Skelter hole is whether to
       be on the machine, and the question here is whether you have brought
       enough with you, because the ground is spending it for you the whole way
       up.

       The exception is the last hole, and it is the reward for the other five:
       the belt round the rim of the crater is the one piece of ground on the
       mountain that is level, and it is the only one that carries the ball
       where it wants to go.

       Nothing on the course is new physics. A belt with a negative push is the
       same belt Crosstown rides, turned to face you; a vent is Skelter's
       launch pad with the fairground taken off it. What is new is that they
       are all pulling the same way, which is what a hill is. */

    var cinder = [
        build({
            /* The first hole states the arithmetic and nothing else: two and a
               half units of ash running back down the slope at four units per
               second squared, three and a half units in front of the tee.

               Those three numbers are the hole, and they were picked by
               playing it rather than by working it out. A full swing of the
               putter reaches the ash with about six of pace left, crosses with
               two, and stops three short of the pin — so the hole asks for
               everything the flattest club in the bag has and still leaves you
               a putt. Four fifths of the same swing is handed back to your
               feet. And a driver at full power is worse than either: it
               crosses, hits the far rail and comes all the way home, which is
               the other half of the lesson and the half this course keeps
               coming back to. Nothing is lost by being short here. That stops
               being true on the third hole. */
            name: 'The Ash Slide', par: 3,
            blurb: 'A band of ash running back down at you. A full swing of the putter just gets over; anything less is returned.',
            pads: [
                pad(0, 0, 6, 5),
                belt(0, 5, 6, 2.5, 0, -4),
                pad(0, 7.5, 6, 7)
            ],
            tee: { x: 3, z: 1.5 }, cup: { x: 3, z: 12 }
        }),
        build({
            /* And the vent, which is the other half of the vocabulary: the
               only thing on the mountain that moves a ball *up* it.

               The shelf stands 1.8 above the lawn and is drawn as a bridge
               over it, so the ground carries on underneath — a ball that comes
               up short lands back on the lawn rather than in a hazard, and the
               shot is simply taken again. That is deliberate for a second
               hole. What is not forgiving is the window: the vent is worth
               2.45 units of height and holds the ball above the level of the
               shelf for a little over half a second, so what it wants is a
               ball arriving at somewhere between four and ten units per second
               — fast enough to cross the three and a half units of open air
               before it comes back down, slow enough not to cross the shelf as
               well. A full putter is at the top of that window and a driver is
               a long way over it.

               Both ends of the shelf are open and its sides are not, which is
               what makes it a landing rather than a tray. Coming up short and
               going long cost exactly the same thing here, which is nothing
               but the shot: the lawn runs on underneath from the tee to the
               back of the hole, so a ball that misses the shelf at either end
               lands on grass and is played again from where it stops. */
            name: 'Fumarole', par: 3,
            blurb: 'The vent is the lift, and the shelf is open at both ends. Arrive with the pace it wants.',
            pads: [
                pad(0, 0, 7, 24),
                sprung(3.5, 7.6, 1.3, 9.4),
                pad(0, 11, 7, 5, 1.8)
            ],
            gaps: [
                brink({ x: 0, z: 11, w: 7, d: 0 }, 0.4),
                brink({ x: 0, z: 16, w: 7, d: 0 }, 0.4)
            ],
            tee: { x: 3.5, z: 2 }, cup: { x: 3.5, z: 13.6 }
        }),
        build({
            /* Eleven units of crater lake, which is more than anything in the
               bag carries, and two tube mouths side by side in the ash in
               front of it. One of them comes out on the far shore facing the
               pin. The other comes out where you started.

               A pipe with a bad end on it is the hole Jackpot was making the
               same point with on the pinball table: the luckiest-looking line
               is a bad one, and a course made of machinery you cannot aim
               ought to have at least one machine that is not on your side. It
               is the third hole rather than the sixth because the punishment
               is only distance — the ball comes out on grass, facing the way
               you were, with the whole hole still in front of it.

               Which mouth is which is not marked, and it does not have to be:
               they are three and a half units apart, and a player who takes
               the wrong one takes the other next time. */
            name: 'Lava Tube', par: 3,
            blurb: 'Two mouths in the ash and eleven units of lake. One of them comes out at the pin; one comes out here.',
            pads: [
                pad(0, 0, 9, 10),
                pad(0, 21, 9, 9)
            ],
            water: [rect(-2, 10, 13, 11, -0.8)],
            gaps: [shore(rect(-2, 10, 13, 11), 0.6)],
            warps: [
                pipe(2.6, 8, 3.2, 23, 0, 0.9),
                pipe(6.4, 8, 7.8, 2.2, Math.PI, 0.9)
            ],
            tee: { x: 2.2, z: 1.8 }, cup: { x: 4.6, z: 26.5 }
        }),
        build({
            /* A shelf cut across the face of the cone, with the drop on the
               east side of it for its whole length and two bands of scree
               running over it. The belts push south and east at once — down
               the fall and off the edge — which is what makes them different
               from anything on Crosstown, where a travelator across the hole
               is a hazard you can aim off and the worst it costs is the line.
               Here the worst it costs is the ball.

               Five units of shelf is not much road. What keeps it playable is
               that the push is gentle and the bands are thin: a ball crossing
               one at any real pace is on it for a third of a second and comes
               off a metre south and east of where it would have been, which is
               a correction you can take on the tee if you know it is coming.
               A ball that stops on one does not stop on it for long. */
            name: 'The Scree', par: 4,
            blurb: 'A shelf with the drop down one side and two bands of scree running across it. Aim off, and keep moving.',
            pads: [
                pad(0, 0, 5, 9, 1.2),
                belt(0, 9, 5, 2.5, 3, -2.5, { y: 1.2 }),
                pad(0, 11.5, 5, 4, 1.2),
                belt(0, 15.5, 5, 2.5, 3, -2.5, { y: 1.2 }),
                pad(0, 18, 5, 6, 1.2)
            ],
            water: [rect(5, -1, 6, 26, 0.1)],
            gaps: [{ x: 4.6, z: -1, w: 0.8, d: 26 }],
            tee: { x: 2.4, z: 2 }, cup: { x: 2.4, z: 21.5 }
        }),
        build({
            /* Three vents in twenty units of ash, and this time none of them
               is a lift — they are simply in the way. A launch pad is the one
               obstacle in the game that does not stop a ball, redirect it or
               slow it down: it throws the ball in the air and hands it back
               travelling exactly as it was, a second and a half later and a
               long way further on. So a hole made of them is not a hole you
               steer past, it is a hole you either miss or accept.

               They are staggered so that the line round the first is the line
               into the second, which is the only way three of anything is a
               plan rather than three attempts at the same shot. And they are
               rated low — 7.6 is a bounce a unit and a half high — because a
               vent you cannot survive is a coin toss, and a vent that costs
               you the length of the hole is a hole. */
            name: 'Blowhole', par: 3,
            blurb: 'Three vents and no way to steer once one has you. The line round the first is the line into the second.',
            pads: [
                pad(0, 0, 8, 20),
                sprung(2.4, 6.5, 1.1, 7.6),
                sprung(5.8, 10.5, 1.1, 7.6),
                sprung(3.2, 14.5, 1.1, 7.6)
            ],
            tee: { x: 4, z: 1.8 }, cup: { x: 5.8, z: 17.6 }
        }),
        build({
            /* The finisher, and it is the whole course in one hole: the vent
               to get up, the scree to be carried along, the tube to get in.

               The crater floor has no way into it along the ground. The rim
               stands 2.2 above the lake that rings it and keeps its inner rail
               all the way round, so the pin is reached by riding the rim east
               until the tube swallows you — or, for anybody who would rather
               not trust the machinery, by flying the whole thing from the lawn,
               which is a shot that exists and is not a comfortable one.

               The belt is what makes the ride readable. A travelator has a
               speed of its own that a ball approaches from either side, so it
               does not matter how hard the second shot is hit: everything
               arrives at the mouth at about six units per second and comes out
               of the far end at the same, which is a putt's worth of pace
               across a crater floor eleven wide. The machine spends the shot
               for you, and the only thing you own is getting on to it. */
            name: 'Caldera', par: 4,
            blurb: 'Up the vent, along the rim on the scree, and in through the tube. There is no other road into the crater.',
            pads: [
                pad(0, 0, 8, 10),
                sprung(4, 8.2, 1.3, 10.4),
                pad(0, 11, 2, 3.5, 2.2, 'wood'),
                belt(2, 11, 12, 3.5, 3.5, 0, { y: 2.2, kind: 'wood' }),
                pad(14, 11, 3.4, 3.5, 2.2, 'wood'),
                pad(0, 15, 9, 10, 1)
            ],
            water: [rect(-2, 10, 22, 5, -0.8)],
            gaps: [
                { x: -1, z: 9.5, w: 21, d: 1.0 },        // the lawn's shoreline
                { x: -0.6, z: 10.7, w: 8.6, d: 0.6 },    // the face of the rim, where you land
                { x: -1, z: 14.7, w: 21, d: 0.9 }        // and the crater's own
            ],
            warps: [pipe(15.7, 12.75, 4, 18, 0, 0.95)],
            tee: { x: 4, z: 2 }, cup: { x: 4.5, z: 21.5 }
        })
    ];

    /* ── adventure golf, the fourth of four: Apogee Yard ───────────────────

       The other three adventure courses change the floor. Icehouse takes the
       friction out of it, Helter Skelter bolts machinery to it and Cinder Cone
       tilts the whole thing downhill — and all three leave the ball alone. This
       one leaves the floor alone and changes what the ball *weighs*.

       `hole.gravity` was written for one hole on Helter Skelter and it is the
       cheapest hole-shaped idea in the file: nothing about the course changes
       and everything about playing it does. Carry goes as 1/g and so does
       apex, so half a g is a bag where every club reaches twice as far and
       flies twice as high, and two g is a bag where the longest flight in the
       game is under six units. The angle of repose does not move at all —
       `HOLD` is a gradient, and a gradient does not care what the ball weighs
       — so the ground under all six holes is ordinary ground.

       What that does to a hole is worth stating, because it is the whole card:

       - **Light gravity takes distance away as a defence.** A moat nothing
         could carry at home is a formality at half a g, so the holes that are
         light are defended by what you have to *stop* on — a small target with
         a long way down behind it — rather than by how far away it is.
       - **Heavy gravity gives it back, and takes the air.** At two g nothing
         in the bag flies six units or rises much above a knee, so a gap in the
         floor is a wall: the only road is the floor, and the machinery that
         throws a ball three units up at home barely clears a step.

       So the card alternates — light, heavy, light, heavy — and finishes with
       the two lightest holes on it, where the ball is in the air for the best
       part of four seconds and the longest club on the hole is a putter.

       There is no water anywhere on the yard. A ball that leaves the ground
       here falls past `OOB_Y` and comes back as a stroke, which is the same
       price a splash costs and the honest one for a course with no sea on it. */

    var apogee = [
        build({
            /* The introduction, and it is one number said out loud: half a g.
               Fourteen units of nothing between the two slabs — more than the
               iron carries at home and more than the driver does — and at half
               a g every club in the bag flies it with room to spare.

               Nothing else is on the hole on purpose. The first tee of a
               course whose whole idea is that the ball weighs less should be a
               shot the player has already played somewhere else, so that what
               they notice is the only thing that has changed. */
            name: 'Hang Time', par: 3, gravity: 0.5,
            blurb: 'Half a g. The gap is wider than anything in the bag carries at home — hit it anyway.',
            pads: [
                pad(0, 0, 8, 9),
                pad(0, 23, 10, 10)
            ],
            gaps: [{ x: -1, z: 8.6, w: 12, d: 14.8 }],
            tee: { x: 4, z: 2 }, cup: { x: 5, z: 28 }
        }),
        build({
            /* And the other way, which is the half of the idea nobody expects.
               At two g the longest flight in the bag is the driver's, and it is
               five and a half units; a wedge rises about as high as the rail
               beside it. So the eight units of gap here cannot be flown by
               anything, at any power, and the plank is not the safe route — it
               is the only one.

               It is off to the east, so the hole is three shots long in the
               shape of a Z: out to the plank, across it, back to the pin. A
               heavy ball is the one thing in this game that makes a putt the
               brave shot. */
            name: 'Dead Weight', par: 3, gravity: 2,
            blurb: 'Twice the weight, and nothing in the bag flies six units. The plank is the road.',
            pads: [
                pad(0, 0, 7, 8),
                pad(4.4, 8, 1.8, 8, 0, 'wood'),
                pad(0, 16, 7, 8)
            ],
            gaps: [{ x: -1, z: 7.6, w: 9, d: 8.8 }],
            tee: { x: 2.2, z: 2 }, cup: { x: 2.4, z: 21 }
        }),
        build({
            /* Light again, and this time the hole is what you have to stop on.

               A ball that arrives on a flat green at half a g arrives with the
               same speed it would have had at home and then keeps every bit of
               it for twice as long a bounce, so the green here is a crater: a
               floor, four ramps and four corners, with the rim doing the job
               the ground cannot. It is an island, and there is nothing behind
               it, which is the whole reason the rim is worth having. */
            name: 'The Crater', par: 3, gravity: 0.45,
            blurb: 'Nothing stops out here. The rim of the crater is the only thing that will.',
            pads: [pad(0, 0, 8, 8)].concat(bowl(5, 24, 7.2, 3, 0.55)),
            gaps: [{ x: -1, z: 7.6, w: 10, d: 1 }],
            tee: { x: 4, z: 2 }, cup: { x: 5, z: 24 }
        }),
        build({
            /* The heavy hole with a motor in it. Two steps of one point two
               and no ramp on to either — the same shape Highland's Stairway
               is, except that there the answer is a club that flies and here
               there is no such thing. What is left is the floor throwing the
               ball for you, and it is throwing something twice as heavy: a
               launch pad rated at thirteen reaches four and three quarter
               units at home and just under two at the two and two fifths of a
               g this hole is played at, so a step of one point two is a step
               it clears with about half a ball's worth of daylight by the time
               the ball has travelled far enough forward to land on it.

               Nothing has been done to the pads. They are the Helter Skelter
               pads, at the Helter Skelter ratings, and the whole difference is
               what is standing on them. */
            name: 'Deadlift', par: 3, gravity: 2.4,
            blurb: 'Two steps up, no ramps, and the pads have twice the weight to lift.',
            pads: [
                pad(0, 0, 7, 10),
                sprung(3.5, 8, 1.2, 13),
                pad(0, 10, 7, 6, 1.2),
                sprung(3.5, 14, 1.2, 13, 1.2),
                pad(0, 16, 7, 8, 2.4)
            ],
            tee: { x: 3.5, z: 2 }, cup: { x: 3.5, z: 20.5 }
        }),
        build({
            /* The pipe, and the reason it is on this course rather than on
               Helter Skelter's: a mouth swallows a ball that is on the floor
               and lets a lofted one sail over the top (`WARP_MOUTH`), and at
               two fifths of a g almost nothing wants to be on the floor. The
               bag has one lofted club in it, and the temptation to use it is
               the hole.

               Twenty-four units of nothing, which is more than the chipper
               carries even at this weight, so the mouth is the only way off
               the tee. It comes out on the shelf in the middle facing the pin,
               and what is left is the second crossing — twelve units, which is
               exactly what the chipper is in the bag for. Two ways of keeping
               the ball down, one after the other, and they are not the same
               shot. */
            name: 'The Mouth', par: 4, gravity: 0.4,
            bag: ['putter', 'mallet', 'chipper'],
            blurb: 'The mouth only takes a ball that is on the floor, and out here almost nothing is.',
            pads: [
                pad(0, 0, 9, 10),
                pad(0, 34, 9, 8),
                pad(0, 54, 10, 10)
            ],
            gaps: [
                { x: -1, z: 9.6, w: 12, d: 24.8 },
                { x: -1, z: 41.6, w: 13, d: 12.8 }
            ],
            warps: [pipe(6.4, 7.4, 4.5, 37, 0, 0.95)],
            tee: { x: 2.6, z: 2 }, cup: { x: 5, z: 59 }
        }),
        build({
            /* The finish, and the lightest hole on the card. Three tenths of a
               g: a launch pad rated at ten and a half throws the ball nine and
               a half units into the air and holds it there for the best part
               of four seconds, and everything it does in that time was decided
               before it left the ground.

               The bag is a putter and a mallet, which is to say nothing that
               flies, and that is what makes the hole legible. The only thing
               putting the ball in the air is the floor; the only thing you
               choose is how fast it is going when it gets there. Two thirds of
               a putter lands on the front of the shelf and rolls to the pin. A
               full one is forty units and gone, and the mallet is not a club
               on this hole at all.

               The band of dust across the back is the only mercy on the yard
               and it is a grudging one: sand keeps four thousandths of the
               ball's speed in a second, so anything that reaches it stops
               where it lands — on the hole, out of position, and a long way
               from the flag. The shelf is also narrower than the tee and set
               off to the east of it, so the flight is a line as well as a
               weight. */
            name: 'Apogee', par: 3, gravity: 0.3,
            bag: ['putter', 'mallet'],
            blurb: 'The pad throws it nine units up and the flight lasts four seconds. Everything is decided before it leaves.',
            pads: [
                pad(0, 0, 8, 8),
                sprung(4, 5.2, 1.4, 10.5),
                pad(3, 22, 8, 18),
                pad(3, 40, 8, 6, 0, 'sand')
            ],
            gaps: [{ x: -1, z: 7.6, w: 14, d: 14.8 }],
            tee: { x: 4, z: 2 }, cup: { x: 7.5, z: 36 }
        })
    ];

    /* ── the long game, the last of three: Dunmore Heath ──────────────────

       The long game again, and deliberately not a second Ashdown Park.

       Ashdown is a park with a hillside under it: trees down both sides, a
       terrace or two, and the shape of the country as the setting rather than
       as the hole. Dunmore has almost nothing in the air. What it has instead
       is the ground itself — a crest across the driving line, a hollow that
       gathers everything short, a punchbowl, a spiral of country that breaks a
       putt twice in opposite directions, one ravine that is not a hazard so
       much as a decision, and a fairway that climbs a hillside for twenty
       units and hides the green over the top of it.

       All of it is one field per hole, shared by every strip (`shape`), which
       is what lets a crest run clean from boundary to boundary without the
       rail generator finding a cliff down the middle of the fairway. The holes
       are half again the size of Ashdown’s for the same reason: a landform
       needs room to be a landform, and a ridge with six units either side of
       it is a speed bump.

       The two things it borrows from the courses either side of it are the
       ones that turned out to be about ground rather than about furniture. A
       green may be a disc laid into the heather (Whinstone’s trick), and a row
       of `bands` may tilt and carry its level into the next one, so a hole
       climbs to a shelf or lies on the side of a hill instead of standing on a
       table. **The Beacon** is entirely the second of those: twenty units of
       fairway rising at a ninth, and a green you cannot see from the tee
       because it is over the shoulder of the climb rather than behind a hump
       somebody drew.

       And the rough is heather. It is `rough` like anywhere else — the engine
       has one word for it — but the fairways here are narrow and it runs right
       up to their edge, so missing one does not lose you the ball. It loses
       you the club you wanted to hit next.

       There is no fence on this one either, for the reasons written over
       Ashdown Park, and it costs more here than it does there: a hole whose
       fairways are this narrow with heather this close to them is a hole where
       the difference between the rough and the boundary is a couple of units
       of run. */

    var dunmore = [
        (function () {
            /* One crest at driving distance, a hollow in the heather to the
               right of it, and a climb on to the shelf the green sits on. The
               crest is four overlapping humps rather than one wide one because
               a single raised cosine wide enough to cross a hole is also tall
               enough in the middle to be a pimple; four at a third of the
               height each add along their line into a ridge with a flat top. */
            var field = ridge(5, 19, 17, 19, 6.5, 0.7, 3)
                .concat(massif(-3.5, 15, 11, 2.5, 5))
                .concat([hill(3, 40, 3.4, -0.8), hill(19, 22, 3, -0.55)]);
            var heath = commons(0, [
                [6,                     [7, rgh], [8, fwy], [7, rgh]],
                [{ d: 6, sz: 0.19 },    [7, rgh], [8, fwy], [7, rgh]],
                [14,                    [7, rgh], [8, fwy], [7, rgh]],
                [{ d: 5, sz: -0.23 },   [6, rgh], [4, snd, DIP], [6, fwy], [6, rgh]],
                [{ d: 5, sz: 0.2 },     [6, rgh], [10, fwy], [6, rgh]],
                [3,                     [6, rgh], [10, fwy], [6, rgh]],
                [6,                     [6, rgh], [10, grn], [6, rgh]],
                [3,                     [22, rgh]]
            ]);
            return build({
                name: 'Bell Heather', par: 4, long: true, shaped: true, open: true,
                blurb: 'A ridge across the driving line, then a climb to a shelf with a hollow beside it.',
                pads: shape(scoop(heath.pads, { seed: 3 }), field),
                fence: heath.fence,
                extra: [].concat(
                    treeline(2, 7, 2, 22, 4),
                    crags(1.5, 19, 3.4, 5, 8101, { s: 1.3, h: 1.0 }),
                    crags(20.5, 16, 3, 4, 8117, { s: 1.15, h: 0.9 }),
                    [tree(2.2, 41), tree(19.8, 41.5)]
                ),
                tee: { x: 11, z: 3 }, cup: { x: 11, z: 41 }
            });
        })(),
        (function () {
            /* The hole bends right around a stand of gorse, and the whole
               hillside falls away to the left of it (`tilt`) — a thirtieth
               of a unit down for every one across, which is not much to look
               at and is the difference between a drive that holds the corner
               and one that finishes in the heather at the bottom. Every shot
               on the hole is played off a sidehill lie, and the hollow at the
               end of it keeps whatever the slope hands over. */
            var field = [hill(4.5, 33, 4.5, -0.95)]
                .concat(massif(28, 20, 12, 2.0, 5))
                .concat(ridge(5, 31.5, 17, 31.5, 4.5, 0.29, 4));
            var heath = commons(0, [
                [6,                    [4, rgh], [8, fwy], [10, rgh]],
                [{ d: 8, sz: 0.12 },   [4, rgh], [8, fwy], [10, rgh]],
                [{ d: 7, sz: -0.19 },  [4, rgh], [8, fwy], [10, rgh]],
                [{ d: 6, sz: -0.14 },  [5, rgh], [4, snd, DIP], [9, fwy], [4, rgh]],
                [7,                    [8, rgh], [11, fwy], [3, rgh]],
                [6,                    [9, rgh], [10, grn], [3, rgh]],
                [3,                    [22, rgh]]
            ], { e: 18 });
            return build({
                name: 'Gorse Corner', par: 4, long: true, shaped: true, open: true,
                blurb: 'It bends right around the gorse, and the whole hillside falls away to the left.',
                pads: shape(tilt(scoop(heath.pads, { seed: 7 }), 0.032, 0, 0, 0), field),
                fence: heath.fence,
                extra: [].concat(
                    treeline(10.5, 16, 10.7, 23, 3),
                    treeline(1.8, 9, 1.8, 26, 4),
                    crags(19.5, 17, 3, 5, 8311, { s: 1.3, h: 1.0 }),
                    [tree(20, 31), tree(20, 35)]
                ),
                tee: { x: 7, z: 3 }, cup: { x: 14, z: 38 }
            });
        })(),
        (function () {
            /* Uphill, and the hill is the hole. Twenty units of fairway rising
               at a ninth of a unit for every one along it — not a hump with a
               summit but a hillside with a top, which is a different thing to
               play up and the reason this is written as tilted rows rather
               than as one wide raised cosine. A cosine broad enough to cross
               the hole is steeper in its middle than a fairway will hold a
               stopped ball on; a constant grade at a ninth is inside it the
               whole way, and it climbs a unit and a half.

               The green is over the shoulder rather than behind anything, so
               the approach is blind for the honest reason: the ground between
               you and it is higher than both of you. A mound at each side of
               the green and a hollow short-left make the two ways of missing
               it different misses. */
            var field = [].concat(
                massif(-4, 21, 10, 1.7, 5),
                [hill(3, 39.5, 3, 0.7), hill(19.5, 39, 2.5, 0.6),
                 hill(6.5, 35, 3.6, 0.4)]
            );
            var heath = commons(0, [
                [6,                     [5, rgh], [9, fwy], [8, rgh]],
                [{ d: 9,  sz: 0.14 },   [6, rgh], [8, fwy], [8, rgh]],
                [{ d: 11, sz: 0.21 },   [6, rgh], [8, fwy], [8, rgh]],
                [{ d: 6,  sz: 0.15 },   [6, rgh], [9, fwy], [7, rgh]],
                [{ d: 5, sz: -0.07 },   [5, rgh], [4, fwy], [4, snd, DIP], [4, fwy], [5, rgh]],
                [8,                     [6, rgh], [11, grn], [5, rgh]],
                [3,                     [22, rgh]]
            ]);
            return build({
                name: 'The Beacon', par: 4, long: true, shaped: true, open: true,
                blurb: 'Four units of climb over twenty-six, and the green is over the top of it.',
                pads: shape(scoop(heath.pads, { seed: 17 }), field),
                fence: heath.fence,
                extra: [].concat(
                    treeline(1.8, 8, 1.8, 24, 4),
                    treeline(20.2, 30, 20.2, 40, 4),
                    crags(2.6, 28, 3.6, 6, 8231, { s: 1.4, h: 1.1 }),
                    crags(19.4, 24, 3, 4, 8237, { s: 1.2, h: 0.95 })
                ),
                tee: { x: 10, z: 3 }, cup: { x: 11.5, z: 41 }
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
               is: a small green at the bottom of a bowl of something else.

               The green is a disc rather than a rectangle for the same reason
               Whinstone’s are: a bowl is round, and a square green at the
               bottom of a round one reads as a mistake from the tee. Every
               hump on the ring is placed to stop exactly at its rim — nothing
               may roll under an inlay, because an inlay wins a tie in
               `surfaceUnder` and loses outright to ground that has been lifted
               above it. */
            var field = ring(10, 21, 6.5, 3.5, 1.4, 6)
                .concat(massif(-6, 20, 12, 2.2, 5))
                .concat(massif(27, 17, 11, 1.9, 5));
            var heath = commons(0, [
                [{ d: 5, y: 3.1 },      [6, rgh], [8, fwy], [6, rgh]],
                [{ d: 3, sz: -0.8 },    [20, rgh]],
                [{ d: 4, sz: -0.1 },    [4, rgh], [12, snd, DIP], [4, rgh]],
                [20,                    [20, rgh]]
            ], { w: 16, e: 16 });
            return build({
                name: 'The Waste', par: 3, long: true, shaped: true, open: true,
                blurb: 'Off a shelf, over the waste, to a round green at the bottom of a bowl between two hills.',
                pads: shape(scoop(heath.pads, { seed: 5 }), field)
                    .concat([circle(10, 21, 3.0, grn, 0.3)]),
                fence: heath.fence,
                extra: [].concat(
                    crags(-4, 17, 3.5, 6, 8353, { s: 1.4, h: 1.1 }),
                    crags(24, 15, 3.2, 5, 8363, { s: 1.3, h: 1.0 })
                ),
                tee: { x: 10, z: 2.5 }, cup: { x: 10, z: 21 }
            });
        })(),
        (function () {
            /* The whorl, and the reason this hole is a par 5 rather than a
               long par 4: the spiral sits in the middle of the second shot,
               so the lie you get for the third is decided by which arm of it
               you finished on. From the tee it looks like one slope.

               And then a swale across the front of the green, which is the
               Biarritz idea done in grass rather than in a putting surface:
               three overlapping hollows lying across the line, so a running
               approach is thrown up in the air a unit short of the shelf and
               the only shot that gets close is the one that carries all of it. */
            var field = ridge(5, 17.5, 17, 17.5, 5.5, 0.55, 3)
                .concat(massif(-5, 40, 12, 2.1, 5))
                .concat(whorl(11, 47, 1.8, 3.5, 4, 0.3, 9, 1.5))
                .concat(ridge(8, 54.4, 16, 54.4, 2.5, -0.38, 3))
                .concat([hill(19.5, 17, 2.5, -0.55)]);
            var heath = commons(0, [
                [6,                     [5, rgh], [9, fwy], [8, rgh]],
                [{ d: 6, sz: 0.19 },    [6, rgh], [8, fwy], [8, rgh]],
                [11,                    [6, rgh], [8, fwy], [8, rgh]],
                [{ d: 5, sz: -0.22 },   [6, rgh], [8, fwy], [8, rgh]],
                [4,                     [6, rgh], [4, snd, DIP], [6, fwy], [6, rgh]],
                [{ d: 5, sz: -0.16 },   [7, rgh], [9, fwy], [6, rgh]],
                [20,                    [7, rgh], [9, fwy], [6, rgh]],
                [{ d: 4, sz: 0.16 },    [7, rgh], [10, fwy], [5, rgh]],
                [7,                     [6, rgh], [11, grn], [5, rgh]],
                [3,                     [22, rgh]]
            ], { w: 16 });
            return build({
                name: 'Long Ling', par: 5, long: true, shaped: true, open: true,
                blurb: 'Fifty-five units of heather over a shoulder and down the other side, with a swale across the last of it.',
                pads: shape(scoop(heath.pads, { seed: 11 }), field),
                fence: heath.fence,
                extra: [].concat(
                    treeline(2, 9, 2, 32, 6),
                    crags(19.6, 15, 3.2, 5, 8377, { s: 1.3, h: 1.0 }),
                    [tree(20, 60), tree(20, 64)]
                ),
                tee: { x: 9.5, z: 3 }, cup: { x: 11.5, z: 64.5 }
            });
        })(),
        (function () {
            /* The ravine. It is not a water hazard and it is not a bunker: it
               is ground, a metre below the ground either side of it, that you
               are perfectly entitled to play out of and will wish you had not
               had to. Lay up short of it and the hole is a comfortable par
               five in four shots; take it on and it is a par four.

               The far bank climbs, which is what turns the second half of it
               into a second decision: the green sits two thirds of a unit
               above the crossing with a mound at its left shoulder, so the
               approach is uphill and blind to the surface whichever side of
               the ravine you play it from. */
            var cut = ravine(0, 17, 20, 13.4, 2.2, { bank: [0, 3.2] });
            var field = ridge(4, 9, 16, 9, 4, 0.34, 3)
                .concat(massif(24, 14, 11, 1.8, 5))
                .concat([hill(17.5, 33, 2.5, -0.6), hill(2.0, 42, 2.4, 0.5)]);
            var heath = commons(0, [
                [6,                     [4, rgh], [9, fwy], [7, rgh]],
                [11,                    [4, rgh], [9, fwy], [7, rgh]],
                [13.4,                  [20, null]],
                [{ d: 5, sz: 0.22 },    [4, rgh], [10, fwy], [6, rgh]],
                [{ d: 4, sz: 0.13 },    [4, rgh], [10, fwy], [6, rgh]],
                [7,                     [5, rgh], [10, grn], [5, rgh]],
                [3,                     [20, rgh]]
            ], { e: 16 });
            return build({
                name: 'The Ravine', par: 4, long: true, shaped: true, open: true,
                blurb: 'A gorge two units deep across the whole hole, and the far bank climbs out of it.',
                pads: shape(scoop(heath.pads.concat(cut.pads), { seed: 13 }), field),
                fence: heath.fence,
                extra: [].concat(
                    treeline(1.7, 8, 1.7, 15, 3),
                    crags(2.4, 23, 3, 5, 8291, { s: 1.2, h: 0.8 }),
                    crags(17.6, 24, 2.6, 4, 8297, { s: 1.1, h: 0.75 }),
                    [tree(18.3, 42), tree(18.3, 45)]
                ),
                tee: { x: 9.5, z: 3 }, cup: { x: 10, z: 43 }
            });
        })()
    ];


    /* ── the long game, the fourth of four: Redstone Canyon ────────────────

       Ashdown Park is a park, Whinstone is a dune field and Dunmore is a moor.
       All three are made of ground that rises: a crest, a shoulder, a hillside
       with the green over the top of it. This one is made of ground that is
       *missing*.

       Dunmore's last hole is the whole idea in one: a gorge two units deep
       across the fairway, which is not a water hazard and not a bunker but
       ground you are entitled to play out of and will wish you had not had to.
       It is the best decision on that card and it happens once. Here it
       happens six times, and the point of the course is that a canyon is a
       different question every time depending on where it runs:

       - **across** the hole, and it is a carry with a lay-up beside it;
       - **along** it, and it is an edge every shot on the hole is played away
         from;
       - **down the middle** of it, and it is two routes — a high road round it
         and a low road through it that is shorter and costs a climb;
       - **twice**, and the fairway is a chain of islands;
       - and once with the green on the far lip, where the canyon is not
         something to get past but the thing you have to stop beside.

       `ravine` writes all of them. It is one helper, `opts.along` turns it a
       quarter turn, and `opts.bank` is how much of its depth each long side
       spends climbing out — a number, or `[near, far]`. Past about a unit of
       depth that is not decoration: nothing in the bag gets a ball out of a
       lie hard against a two-unit cliff, so a wall the ball can come back up
       has to be a ramp, and a *near* wall wide enough to play out of is a ramp
       a drive bounces clean across the canyon off. Which is why every crossing
       here is sheer on the near side and banked on the far one, and why the
       one hole you are meant to play *along* the floor of is banked on both.

       The rough is scrub — `rough` like everywhere else, the engine has one
       word for it — and what stands in it is stone rather than timber. There
       are no trees on the course at all: `crags` is the whole of its furniture,
       which is what a canyon rim has on it. */

    var redstone = [
        (function () {
            /* The introduction, and it says the one thing the player has to
               understand before any of the other five make sense: the canyon
               is not reachable from the tee and it is not avoidable either.

               Nothing in the bag carries twelve units, so the drive cannot fly
               it — but a full drive *runs* into it, because the fairway in
               front of it is only fourteen units long and the driver's total
               is thirty. So the tee shot is the decision: how close to the lip
               do you want to leave yourself, knowing the second shot has to
               carry from wherever you stop to the far bank. Stop at the lip
               and the carry is nine units, which is an iron. Bail out to the
               front of the fairway and it is fourteen, which is nothing. */
            var cut = ravine(0, 18, 22, 9.5, 1.8, { bank: [0, 2.6] });
            var field = ridge(4, 10, 18, 10, 5, 0.36, 3)
                .concat(massif(27, 15, 11, 2.1, 5))
                .concat([hill(2.2, 38, 2.8, -0.6), hill(20, 33, 3, 0.45)]);
            var land = commons(0, [
                [6,                    [5, rgh], [11, fwy], [6, rgh]],
                [12,                   [5, rgh], [11, fwy], [6, rgh]],
                [9.5,                  [22, null]],
                [{ d: 4, sz: 0.18 },   [5, rgh], [11, fwy], [6, rgh]],
                [4,                    [5, rgh], [11, fwy], [6, rgh]],
                [7,                    [6, rgh], [11, grn], [5, rgh]],
                [3,                    [22, rgh]]
            ], { e: 14 });
            return build({
                name: 'First Cut', par: 4, long: true, shaped: true, open: true,
                blurb: 'A canyon at the end of the fairway. The drive decides how long the carry is going to be.',
                pads: shape(land.pads.concat(cut.pads), field),
                fence: land.fence,
                extra: [].concat(
                    crags(2.6, 11, 3, 5, 9101, { s: 1.3, h: 1.0 }),
                    crags(19.4, 34, 2.8, 4, 9107, { s: 1.2, h: 0.9 }),
                    crags(19.6, 9, 2.6, 3, 9109, { s: 1.1, h: 0.8 })
                ),
                tee: { x: 10, z: 3 }, cup: { x: 11, z: 40 }
            });
        })(),
        (function () {
            /* The same canyon turned a quarter turn, so it is not something to
               get over — it is the edge of the hole, running down the whole
               west side of it, and the fairway leans at it.

               A thirtieth of a unit of cross-fall for every one across is not
               much to look at and it is the difference between a drive that
               holds the fairway and one that is in the bottom of the canyon
               with a two-unit wall between it and the pin. The east wall is
               banked, so a ball down there is not lost — it is two shots from
               where it should have been.

               **The rows do not climb on this hole and they do not on The
               Narrows either, and that is a rule rather than a preference.** A
               ravine is authored at absolute heights — its lip is zero and its
               floor is `-depth` — while a row that tilts carries its level
               into the next one, so a canyon that runs *along* thirty units of
               climbing ground has its lip at nought where the fairway beside
               it has reached two and a half. What that builds is not a canyon:
               it is a trench with a cliff on the inside of it that nothing in
               the bag can escape. A crossing is immune, because it lives
               inside one row. The height on a hole with a canyon down the side
               of it therefore comes from the field and from the depth of the
               cut, and the cross-fall — which lifts every pad, the canyon's
               included — is the one tilt that is safe to lay over it. */
            var cut = ravine(0, 6, 6.5, 38, 2, { along: true, bank: [0, 2.6] });
            /* No hollow anywhere near the fairway on this one. The massif
               east of the property is already spending a fifth of what the
               fairway will hold by the time its skirt reaches the short grass,
               and a dish laid on top of that is the one arithmetic in this
               file that is nobody's number until it is measured — the gradients
               add where their signs agree. The shape of this hole is the cut
               down the west side of it; it does not need a second idea. */
            var field = massif(28, 24, 12, 2.2, 5)
                .concat(ridge(8, 14, 20, 14, 5, 0.3, 3));
            var land = commons(0, [
                [6,                     [6.5, null], [11, fwy], [5, rgh]],
                [10,                    [6.5, null], [11, fwy], [5, rgh]],
                [10,                    [6.5, null], [11, fwy], [5, rgh]],
                [6,                     [6.5, null], [12, fwy], [4, rgh]],
                [4,                     [6.5, null], [12, fwy], [4, rgh]],
                [8,                     [6.5, null], [10, grn], [5.5, rgh]],
                [3,                     [22, rgh]]
            ], { w: 15 });
            return build({
                name: 'The Rim', par: 4, long: true, shaped: true, open: true,
                blurb: 'The canyon runs the length of the hole down the left, and the fairway leans at it.',
                pads: shape(tilt(land.pads.concat(cut.pads), -0.032, 0, 22, 0), field),
                fence: land.fence,
                extra: [].concat(
                    crags(20, 12, 3, 5, 9211, { s: 1.3, h: 1.0 }),
                    crags(19.5, 30, 2.8, 4, 9217, { s: 1.2, h: 0.9 }),
                    crags(2.5, 44, 3, 4, 9219, { s: 1.25, h: 0.95 })
                ),
                tee: { x: 13, z: 3 }, cup: { x: 12, z: 41 }
            });
        })(),
        (function () {
            /* A par three over the canyon, and the green is on the far lip
               rather than a comfortable distance beyond it. There is no bail
               out long — the ground behind the green climbs into the massif
               and feeds anything hot back at the pin — so the shot is a carry
               of about eleven units that has to stop inside twenty. That is
               the iron, and it is very nearly the only club that does it. */
            var cut = ravine(0, 8, 20, 11, 2.1, { bank: [0, 3] });
            var field = massif(-5, 18, 12, 2.4, 5)
                .concat(massif(25, 26, 11, 2.2, 5))
                .concat([hill(10, 32.5, 4, 0.4)]);
            var land = commons(0, [
                [8,                    [6, rgh], [8, fwy], [6, rgh]],
                [11,                   [20, null]],
                [{ d: 4, sz: 0.2 },    [5, rgh], [10, fwy], [5, rgh]],
                [7,                    [5, rgh], [10, grn], [5, rgh]],
                [6,                    [20, rgh]]
            ], { w: 14, e: 14 });
            return build({
                name: 'Stone Bridge', par: 3, long: true, shaped: true, open: true,
                blurb: 'Eleven units of canyon and a green on the far lip. Short is the bottom; long is the wall.',
                pads: shape(land.pads.concat(cut.pads), field),
                fence: land.fence,
                extra: [].concat(
                    crags(2.4, 13, 3, 5, 9301, { s: 1.35, h: 1.05 }),
                    crags(17.6, 13, 2.8, 4, 9307, { s: 1.2, h: 0.9 }),
                    crags(18, 32, 2.6, 3, 9311, { s: 1.15, h: 0.85 })
                ),
                tee: { x: 10, z: 3.5 }, cup: { x: 10, z: 26 }
            });
        })(),
        (function () {
            /* The canyon takes a bite out of the east half of the hole
               rather than crossing all of it, so for the first time there is a
               way round as well as a way over — and the two are not the same
               hole.

               Round it is seven units of fairway down the west side, no carry
               at all, and it leaves the approach coming in across the corner
               to a green set off to the east. Over it is a carry of eight
               units from the fairway to the far bank, and what it buys is the
               pin dead ahead. That is the trade the whole hole is: a shot you
               do not have to play, or a shot at the flag.

               The far bank climbs and the near one does not, which is the rule
               every crossing on this course is built to — a near wall wide
               enough to play out of is a ramp a drive skips clean across the
               canyon off, and a far wall that does not climb is a two-unit
               cliff between a ball and the rest of the hole. */
            var cut = ravine(11, 22, 11, 10, 1.8, { bank: [0, 2.6] });
            var field = massif(-6, 24, 12, 2.3, 5)
                .concat(ridge(4, 14, 4, 34, 4, 0.3, 3))
                .concat([hill(5, 44, 3.5, -0.5), hill(19, 12, 3.2, 0.5)]);
            var land = commons(0, [
                [10,                   [4, rgh], [12, fwy], [6, rgh]],
                [12,                   [4, rgh], [12, fwy], [6, rgh]],
                [10,                   [4, rgh], [7, fwy], [11, null]],
                [6,                    [4, rgh], [12, fwy], [6, rgh]],
                [{ d: 5, sz: 0.18 },   [4, rgh], [12, fwy], [6, rgh]],
                [8,                    [9, rgh], [10, grn], [3, rgh]],
                [3,                    [22, rgh]]
            ], { m: 14 });
            return build({
                name: 'Long Way Round', par: 4, long: true, shaped: true, open: true,
                blurb: 'The canyon eats the east half of the fairway. Go round it, or go at the flag.',
                pads: shape(land.pads.concat(cut.pads), field),
                fence: land.fence,
                extra: [].concat(
                    crags(2.6, 26, 3, 5, 9401, { s: 1.3, h: 1.0 }),
                    crags(19.4, 38, 3, 5, 9407, { s: 1.25, h: 0.95 }),
                    crags(2.8, 46, 2.8, 4, 9411, { s: 1.2, h: 0.9 })
                ),
                tee: { x: 9, z: 4 }, cup: { x: 15, z: 48 }
            });
        })(),
        (function () {
            /* The canyon meanders, so it crosses twice and the fairway between
               the two crossings is an island twelve units long with a wall at
               each end of it. Landing on it is the hole: short is the first
               canyon, long is the second, and there is no run-out either way
               because both far banks climb.

               The island is also the only flat ground on the hole, which is
               what makes the third shot the easy one and the second the shot
               nobody wants to play twice. */
            var one = ravine(0, 14, 22, 8, 1.7, { bank: [0, 2.4] });
            var two = ravine(0, 34, 22, 8.5, 1.9, { bank: [0, 2.6] });
            var field = massif(28, 20, 12, 2.2, 5)
                .concat(massif(-6, 34, 11, 2.0, 5))
                .concat([hill(20, 45, 3, 0.45), hill(2.5, 26, 2.6, -0.45)]);
            var land = commons(0, [
                [6,                    [5, rgh], [12, fwy], [5, rgh]],
                [8,                    [5, rgh], [12, fwy], [5, rgh]],
                [8,                    [22, null]],
                [12,                   [5, rgh], [12, fwy], [5, rgh]],
                [8.5,                  [22, null]],
                [{ d: 4, sz: 0.18 },   [5, rgh], [12, fwy], [5, rgh]],
                [8,                    [6, rgh], [11, grn], [5, rgh]],
                [3,                    [22, rgh]]
            ], { w: 14, e: 14 });
            return build({
                name: 'Switchback', par: 5, long: true, shaped: true, open: true,
                blurb: 'It crosses twice, and the fairway between the crossings is twelve units of island.',
                pads: shape(land.pads.concat(one.pads).concat(two.pads), field),
                fence: land.fence,
                extra: [].concat(
                    crags(2.6, 20, 3, 5, 9501, { s: 1.3, h: 1.0 }),
                    crags(19.4, 40, 3, 5, 9507, { s: 1.25, h: 0.95 }),
                    crags(3, 46, 2.6, 3, 9511, { s: 1.15, h: 0.85 })
                ),
                tee: { x: 11, z: 3 }, cup: { x: 11, z: 50 }
            });
        })(),
        (function () {
            /* The finish, and the only hole where the canyon is behind you
               once it is crossed. Everything after it climbs: four units of it
               over the last twenty, onto the mesa the green sits on, with the
               surface out of sight from anywhere below the last rise.

               A par five that is really a par four with a canyon in front of
               it. The carry is the same eleven units it has been all day and
               the difference is that this time there are two more shots to
               play afterwards, uphill, off ground that is tilted the whole
               way. */
            var cut = ravine(0, 16, 22, 10, 2, { bank: [0, 2.8] });
            var field = massif(-6, 40, 13, 2.6, 5)
                .concat(ridge(5, 44, 17, 44, 5, 0.34, 3))
                .concat([hill(20.5, 10, 3.2, -0.5)]);
            var land = commons(0, [
                [6,                     [5, rgh], [12, fwy], [5, rgh]],
                [10,                    [5, rgh], [12, fwy], [5, rgh]],
                [10,                    [22, null]],
                [{ d: 6, sz: 0.2 },     [5, rgh], [11, fwy], [6, rgh]],
                [{ d: 8, sz: 0.16 },    [5, rgh], [11, fwy], [6, rgh]],
                [{ d: 6, sz: 0.14 },    [6, rgh], [10, fwy], [6, rgh]],
                [8,                     [6, rgh], [11, grn], [5, rgh]],
                [3,                     [22, rgh]]
            ], { e: 15 });
            return build({
                name: 'Redstone', par: 5, long: true, shaped: true, open: true,
                blurb: 'Over the canyon, then four units of climb onto the mesa the green is cut into.',
                pads: shape(land.pads.concat(cut.pads), field),
                fence: land.fence,
                extra: [].concat(
                    crags(2.6, 9, 3, 5, 9601, { s: 1.35, h: 1.05 }),
                    crags(19.4, 33, 3, 4, 9607, { s: 1.25, h: 0.95 }),
                    crags(2.8, 44, 2.8, 4, 9611, { s: 1.2, h: 0.9 })
                ),
                tee: { x: 11, z: 3 }, cup: { x: 11, z: 52 }
            });
        })()
    ];

    /* Seventeen courses is far too long a list to read as one list, and the
       four kinds of golf on it are not variations of each other — a mini golf hole
       is one swing and a putt, a crazy golf hole is a machine you have to time,
       and a links hole is a drive and an approach. So the group is not a
       heading any more, it is a filter: the picker opens on one kind at a
       time, and a player who came for windmills never scrolls past fifty-four
       holes of parkland to reach them.

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
            blurb: 'Blades, gates, posts and pendulums — and, on the last course, a river under every one of them. Aim less; time it better.'
        },
        {
            /* The fourth kind, and the newest. The other three are all played
               on ground that sits still: mini golf hands you a lane and a
               rail, crazy golf a machine to time, the long game country to
               read. Here the floor is the obstacle — it will not let the ball
               stop, or it carries it off, or it throws it in the air, or it
               puts it somewhere else entirely. */
            id: 'adventure', name: 'Adventure golf', icon: '\u21AF',
            tint: '#fbbf24',
            blurb: 'Ice, travelators, launch pads, pipes and steam vents. The floor is not on your side.'
        },
        {
            id: 'long', name: 'Long game', icon: '\u27FF',
            tint: '#86efac',
            blurb: 'Full-size holes and no fences on any of them. Two shots to most greens, and a line of stakes where the course stops.'
        }
    ];

    /* The picker's fifth tab, and the only one that is not a shelf of courses:
       the draw itself. It is described here, beside the four kinds, because
       the picker dresses every tab out of the same four fields — mark, name,
       tint, blurb — and the one tab whose colour and wording lived in game.js
       would be the one that drifted away from the rest of the row.

       `id` is deliberately not a group any course belongs to: nothing filters
       by it, `coursesInGroup('shuffle')` is empty on purpose, and the count on
       the tab is how many courses the current mode could hand you rather than
       how many are filed under it. The mark is the shuffle arrows rather than
       a die for the same reason the "Anything" chip is not one — see
       SHUFFLE_MODES below. */
    G3.SHUFFLE_GROUP = {
        id: 'shuffle', name: 'Surprise me', icon: '\u21C4',
        tint: '#c4b5fd',
        blurb: 'Let the picker choose. Say what it is allowed to draw from, and whether it keeps drawing at the end of every round.'
    };

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
            id: 'millrace',
            group: 'crazy',
            name: 'The Millrace',
            blurb: 'Every machine on the course stands over water. A mistimed shot is not a bounce here; it is a stroke.',
            theme: 'mill',
            holes: millrace
        },
        {
            id: 'belfry',
            group: 'crazy',
            name: 'The Belfry',
            blurb: 'Two machines on every hole, geared to each other. Count bars rather than beats.',
            theme: 'belfry',
            holes: belfry
        },
        {
            id: 'icehouse',
            group: 'adventure',
            name: 'Icehouse Yard',
            blurb: 'Nothing stops. Six holes where the only question is where you want to run out of speed.',
            theme: 'icehouse',
            holes: icehouse
        },
        {
            id: 'skelter',
            group: 'adventure',
            name: 'Helter Skelter',
            blurb: 'Launch pads, walkways and pipes. The floor decides; you only decide how hard.',
            theme: 'fairground',
            holes: skelter
        },
        {
            id: 'cinder',
            group: 'adventure',
            name: 'Cinder Cone',
            blurb: 'Everything on the mountain runs downhill. The vents are the only way up it.',
            theme: 'volcano',
            holes: cinder
        },
        {
            id: 'apogee',
            group: 'adventure',
            name: 'Apogee Yard',
            blurb: 'Six holes and six weights of ball. The course never moves; what the ball does in the air is a different game on every one.',
            theme: 'lunar',
            holes: apogee
        },
        {
            id: 'parkland',
            group: 'long',
            name: 'Ashdown Park',
            blurb: 'The long game: fairway, rough, sand and trees. No fence anywhere — the country carries on past the stakes.',
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
            blurb: 'Narrow fairways on an open hillside. Miss one and the heather has you; miss it badly and the heath does.',
            theme: 'heath',
            holes: dunmore
        },
        {
            id: 'redstone',
            group: 'long',
            name: 'Redstone Canyon',
            blurb: 'Six holes built round ground that is missing. Carry it, play along it, or go down into it — the canyon asks a different question on every one.',
            theme: 'canyon',
            holes: redstone
        }
    ];

    /* The courses of one group, in the order they are written above. */
    G3.coursesInGroup = function (groupId) {
        return G3.COURSES.filter(function (c) { return c.group === groupId; });
    };

    /* A kind by its id, or null. The picker needs the *name* of a group it
       only holds the id of — "same kind" says which kind out loud. */
    G3.groupById = function (groupId) {
        for (var i = 0; i < G3.COURSE_GROUPS.length; i++) {
            if (G3.COURSE_GROUPS[i].id === groupId) return G3.COURSE_GROUPS[i];
        }
        return null;
    };

    /* The one after this, wrapping round the end of the whole list — what a
       finished round offers next. */
    G3.nextCourseId = function (id) {
        for (var i = 0; i < G3.COURSES.length; i++) {
            if (G3.COURSES[i].id === id) return G3.COURSES[(i + 1) % G3.COURSES.length].id;
        }
        return G3.COURSES[0].id;
    };

    /* ── shuffle: the course picked for you ──────────────────────────────

       The list is seventeen courses long and most players walk it in the order
       it is written, which is the order it was *built* in — Seaside Green
       first because it was the first one that existed. Shuffle is the other
       way through it: finish a round and the next course is drawn rather than
       chosen, and the reveal is half of it.

       The draw is a pure function of a mode, where you are standing and what
       the save file says, with the random source handed in — so the tests can
       hold the dice and this file never has to guess what a fair coin looks
       like. Everything that reads a DOM or a localStorage lives in game.js.

       Four modes, because "random" on its own answers the wrong question after
       the first few rounds. Who has just finished Windmill Works wants either
       more of the same or deliberately not-the-same, and who has played eleven
       of the seventeen wants one of the other four. */
    /* Each mode says three things, and the picker prints all three on the
       option itself rather than hiding any of them in a `title`: a phone has
       no hover, so a tooltip is not a shorter explanation — it is no
       explanation.

       `blurb` is what the mode does. `eased` is what it says instead once it
       has run out and widened, which is the honest half — a count that has
       fallen to nothing needs a sentence, not a zero. `blurbKind` is an extra
       clause the picker appends when it can fill it in; "same kind" is the one
       mode whose meaning moves with where you are standing, and naming the
       kind beats pointing at it. */
    G3.SHUFFLE_MODES = [
        {
            /* The mark is a scatter rather than a die: the button beside
               these already carries the die, and U+2684 is missing from the
               page's own font — so a die here is a tofu box on the one chip
               that is selected by default. */
            id: 'any', name: 'Anything', icon: '\u2733',
            blurb: 'Any course on the list, except the one you are playing.',
            eased: 'Nowhere else to go — this draws from all of them.'
        },
        {
            id: 'kind', name: 'Same kind', icon: '\u2261',
            blurb: 'Stays with the kind of golf you are playing.',
            blurbKind: 'Right now that is %s.',
            eased: 'Nothing else of this kind — this draws from all of them.'
        },
        {
            id: 'fresh', name: 'New to you', icon: '\u2726',
            blurb: 'Only courses you have never finished a round on.',
            eased: 'You have finished a round on all of them — this draws from the ones you have played least.'
        },
        {
            id: 'record', name: 'Beat a best', icon: '\u2605',
            blurb: 'Only courses you already hold a record on.',
            eased: 'No records to beat yet — this draws from all of them.'
        }
    ];

    /* Rounds finished on a course, out of a save file that may be missing,
       empty, or from a version that had never heard of this course. */
    function roundsOn(save, id) {
        var rec = save && save.courses ? save.courses[id] : null;
        return rec && typeof rec.rounds === 'number' ? rec.rounds : 0;
    }

    /* What a mode would actually draw from, and whether it had to give ground
       to get there.

       `opts`: `mode`, `from` (the course you are on, never drawn), `group`
       (which kind `kind` means — the open tab in the picker, not necessarily
       the group of `from`), `kinds` (the kinds of golf the draw may use at
       all) and `save`.

       `kinds` and `mode` are two different questions and both are asked here.
       A mode narrows by *history* — where you have been, what you hold a
       record on — and the answer moves as you play. `kinds` narrows by what
       the courses *are*, and that answer does not move: someone who does not
       want the long game does not want it drawn on any mode, and told the
       picker so once. So it is filtered before the mode rather than being a
       fifth mode, which is also the only shape under which "same kind" and
       "only these kinds" can both be true at the same time.

       **A mode never comes back empty.** "New to you" stops meaning anything
       the moment you have played all seventeen, and "beat a best" means nothing
       before the first round is finished; a picker whose button does nothing
       on press is worse than one that quietly widens its net. So each mode has
       a written-down fallback and says when it took it, and `eased` is what
       lets the button say the net has been widened instead of quietly lying
       about what it is drawing from. */
    G3.shuffleDraw = function (opts) {
        opts = opts || {};
        var save = opts.save || null;
        var from = opts.from || null;
        var mode = 'any', i;
        for (i = 0; i < G3.SHUFFLE_MODES.length; i++) {
            if (G3.SHUFFLE_MODES[i].id === opts.mode) mode = opts.mode;
        }

        /* Never the course you are standing on: "surprise me" that hands you
           back the hole you are looking at is the one result nobody wants.
           Filtered first, so every mode below inherits it. */
        var pool = G3.COURSES.filter(function (c) { return c.id !== from; });

        /* …and then only the kinds of golf the draw has been left. The ticks
           are the player's, so they are read rather than trusted: an id no
           group answers to is dropped, and `kinds` left out entirely means
           every kind, which is what a save file written before this existed —
           and every caller that does not care — is saying.

           A set that leaves nothing to draw from is not a set this can
           honour, and the answer is the same one the modes give: use every
           kind and say so, rather than come back empty. `widened` is that
           admission, and it is deliberately not `eased` — the two say the net
           was widened for different reasons and the picker prints them in
           different places. */
        var allKinds = G3.COURSE_GROUPS.map(function (g) { return g.id; });
        var kinds = allKinds.filter(function (id) {
            return !opts.kinds || opts.kinds.indexOf(id) >= 0;
        });
        var widened = false;
        var ofKind = pool.filter(function (c) { return kinds.indexOf(c.group) >= 0; });
        if (ofKind.length) pool = ofKind;
        else { kinds = allKinds; widened = true; }

        var list = pool, eased = false;

        if (mode === 'kind') {
            var group = opts.group ||
                (from && G3.courseById(from) ? G3.courseById(from).group : null);
            list = pool.filter(function (c) { return c.group === group; });
            if (!list.length) { list = pool; eased = true; }
        } else if (mode === 'fresh') {
            list = pool.filter(function (c) { return roundsOn(save, c.id) === 0; });
            if (!list.length) {
                /* Played everything: fall back to the ones played least rather
                   than to anything at all. It is the same intent — go where you
                   have been least — and it keeps working for the rest of the
                   save file's life. */
                var least = Infinity;
                pool.forEach(function (c) { least = Math.min(least, roundsOn(save, c.id)); });
                list = pool.filter(function (c) { return roundsOn(save, c.id) === least; });
                eased = true;
            }
        } else if (mode === 'record') {
            list = pool.filter(function (c) { return roundsOn(save, c.id) > 0; });
            if (!list.length) { list = pool; eased = true; }
        }

        // One course on the list and you are on it. Cannot happen today; it is
        // one line, and the alternative is a draw that returns nothing.
        if (!list.length) { list = G3.COURSES; eased = true; }

        return {
            mode: mode, courses: list, eased: eased,
            kinds: kinds, widened: widened
        };
    };

    /* The kinds of golf a set of ticks actually leaves the draw, in the order
       the picker prints them, with anything unrecognised dropped — the same
       normalising `shuffleDraw` does, for the caller that has to *say* what
       the draw is allowed rather than make one. A tick list that leaves
       nothing comes back empty here rather than widened: the sentence for
       "you have ruled out everything" is not the sentence for "these two",
       and the picker needs to be able to tell them apart. */
    G3.shuffleKinds = function (kinds) {
        return G3.COURSE_GROUPS.filter(function (g) {
            return !kinds || kinds.indexOf(g.id) >= 0;
        });
    };

    /* One course out of that draw. `rng` is anything that returns 0 ≤ n < 1;
       it defaults to Math.random and is clamped rather than trusted, because a
       source that returns exactly 1 (or nothing at all) should cost you a
       slightly unfair draw, not an undefined course id. */
    G3.randomCourseId = function (opts) {
        var draw = G3.shuffleDraw(opts);
        var rng = (opts && opts.rng) || Math.random;
        var n = rng();
        var i = Math.floor((typeof n === 'number' && n >= 0 && n < 1 ? n : 0) * draw.courses.length);
        return draw.courses[Math.max(0, Math.min(draw.courses.length - 1, i))].id;
    };

    G3.shuffleModeById = function (id) {
        for (var i = 0; i < G3.SHUFFLE_MODES.length; i++) {
            if (G3.SHUFFLE_MODES[i].id === id) return G3.SHUFFLE_MODES[i];
        }
        return G3.SHUFFLE_MODES[0];
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
        beam: beam, pen: pen, bumper: bumper, bank: bank, bowl: bowl, bands: bands, tilt: tilt,
        commons: commons,
        sprung: sprung, belt: belt, pipe: pipe, pipes: pipes,
        aperture: aperture, flipper: flipper,
        tree: tree, treeline: treeline, crag: crag, crags: crags,
        hill: hill, ring: ring, ridge: ridge, whorl: whorl, ravine: ravine,
        shape: shape, dunes: dunes, ground: ground, circle: circle, keep: keep,
        shapeDisc: shapeDisc,
        rect: rect, enclose: enclose, shore: shore, brink: brink, build: build,
        contour: contour, scoop: scoop, relief: relief,
        RAIL_T: RAIL_T, SCOOP: SCOOP,
        CUP_FLAT: CUP_FLAT, TEE_FLAT: TEE_FLAT, CUP_PATCH: CUP_PATCH
    };

})(window.G3);
