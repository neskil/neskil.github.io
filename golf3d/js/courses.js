/* Fourteen courses of six holes, as data.

   A hole is a set of pads (the ground), a set of walls (things that bounce),
   a set of water rectangles (things that punish), a tee and a cup. Everything
   else — where the rails go, how high the cup sits, where the camera should
   look — is derived below, because a hole that has to repeat itself is a hole
   that will one day disagree with itself.

   Three of the fourteen courses are mini golf, three are crazy golf, three
   are adventure golf and five are the long game — tee, fairway, rough, sand,
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
   The same rule runs across a group: the three mini courses are in order of
   how much they ask for, and so are the crazy, the adventure and the long
   ones.

   **A hole is not the hole beside it.** Eighty-four holes on one list is
   eighty-four chances to write the same corridor again, and the way out is the
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
            sails: o.sails || null,
            kind: o.kind || 'rail'
        };
    }

    /* A windmill: a mill house across the lane with one door in it, and four
       sails turning in front of the door (physics.millSail for how the ball
       meets them). The house is an `aperture` of brick wings, a door's width
       apart and as deep as a tunnel, with no lintel: the tower the renderer
       stands over the doorway is the lintel, from the wings' height up to the
       cap. The sails hang on a hub just in front of it, high enough that a
       sail pointing straight down clears the floor by a hand and the ball by
       nothing. `speed` is radians a second, so a sail comes past the door
       every π/2/speed seconds; the default `phase` starts them in the X a
       windmill is drawn in, with the door open.

       The sails' wall is the whole disc they turn in, two lengths across and
       a sail's thickness deep: that is what every reject and every overlap
       test sees, and the solver narrows it to the one sail that is down. */
    function mill(x, z, w, opts) {
        var o = opts || {};
        var gap = o.gap === undefined ? 1.3 : o.gap;
        var at = o.at === undefined ? w / 2 : o.at;
        var deep = o.deep === undefined ? 1.6 : o.deep;
        var len = o.len === undefined ? 2.3 : o.len;
        var hy = len + (o.clear === undefined ? 0.15 : o.clear);
        var hx = x + at, hz = z - 0.25;
        var sail = wall(hx - len, hz - 0.15, 2 * len, 0.3, 2 * len + 0.3, {
            base: hy - len - 0.15, kind: 'sails',
            sails: { hx: hx, hy: hy, len: len, speed: o.speed || 0.8,
                     phase: o.phase === undefined ? Math.PI / 4 : o.phase, width: o.width || 0.5,
                     house: { z: z, deep: deep, top: 1.1 } }
        });
        return aperture(x, z, w, deep, { gap: gap, at: at, h: 1.1, kind: 'mill' })
            .concat([sail]);
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
       because that is the point it turns about.

       Unless it says `hinge`: -1 hinges it at its west end and +1 at its
       east (as it lies at `rest`), and then it is the real thing, a bat
       turning about a pin at one end (physics.wallBox) — the Parlour's, since
       v1.126.0. Still authored by its middle at rest, so a hinged flipper and
       a centred one drawn on the same plan stand in the same place. */
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
        if (o.hinge) {
            var arm = o.hinge * (len / 2 - t / 2);
            w.swing.hinge = { x: cx + Math.cos(rest) * arm, z: cz - Math.sin(rest) * arm };
            w.swing.reach = -arm;
        }
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
            { base: -0.1, kind: o.kind || 'bumper' });
    }

    /* A rubber post: round like a bumper and with nothing behind it, so it
       turns the ball and keeps a rail's share of its speed rather than firing
       it (physics.popBumper). The piece to stand in front of the bumpers. */
    function post(cx, cz, size) {
        return bumper(cx, cz, size === undefined ? 0.34 : size, { kind: 'post', h: 0.42 });
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

    /* A curved rail: an arc of short banks round (cx, cz) at radius R, from
       angle a0 to a1 (radians, measured as atan2(z, x)). The solver has no
       curve in it and does not need one — a ball meeting an arc of sixteen
       chords is turned round it a chord at a time, and at five or six degrees
       a chord the turn reads as a curve to the eye and to the ball alike.
       Each bank is a rail's thickness longer than its chord so neighbours
       overlap: a gap between two would be a hole in the rail exactly where the
       ball is pressing hardest. `n` defaults to one chord per ten degrees.

       `drawn` asks the renderer to draw the arc as the one curve it is
       (render.addBend), finished round at both ends, rather than as its
       chords — which side-on read as a fan of flat boards. Its value is what
       the curve is made of, any of the renderer's wall kinds ('rock' for
       quarry stone). A curved wall standing on its own, like The
       Backboard's, wants it; a rail along an edge does not need it. */
    function arc(cx, cz, R, a0, a1, opts) {
        var o = opts || {}, out = [], i, t0, t1, tm, chord;
        var n = o.n || Math.max(3, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 18)));
        var t = o.t === undefined ? 0.34 : o.t;
        var bend = o.drawn ? {
            cx: cx, cz: cz, R: R, a0: Math.min(a0, a1), a1: Math.max(a0, a1), t: t,
            base: o.base === undefined ? -0.1 : o.base, h: o.h === undefined ? 0.62 : o.h,
            kind: o.drawn, cap0: true, cap1: true
        } : null;
        for (i = 0; i < n; i++) {
            t0 = a0 + (a1 - a0) * i / n;
            t1 = a0 + (a1 - a0) * (i + 1) / n;
            tm = (t0 + t1) / 2;
            chord = 2 * R * Math.sin(Math.abs(t1 - t0) / 2);
            // A bank's length runs along local x, and THREE's yaw turns local x
            // to (cos yaw, -sin yaw) — so the tangent at tm is yaw -tm - π/2.
            out.push(bank(cx + Math.cos(tm) * R, cz + Math.sin(tm) * R, chord + t,
                -tm - Math.PI / 2, { t: t, h: o.h, base: o.base, kind: o.kind }));
            if (bend) out[i].bend = bend;
        }
        return out;
    }

    /* Curved ground, for the drawn holes: the same raised cosine a hump is,
       laid along a spine (physics.padHeight has the rule). `trough` runs it
       along a segment — with `a` below zero on a pad lifted by -a it is a
       half-pipe, a floor that curves up into both walls — and `channel` runs
       it round a circle or an arc of one, which is a banked turn when the
       outside of the ring is the high side. Both carry a cx/cz as well — the
       middle of the segment, the centre of the ring — for anything that only
       wants to know roughly where a bump is; `r` is still the profile's
       radius, the distance from the spine at which it meets the pad. */
    function trough(x0, z0, x1, z1, r, a) {
        return { line: [x0, z0, x1, z1], r: r, a: a,
            cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 };
    }
    function channel(cx, cz, R, r, a, a0, a1) {
        var g = { cx: cx, cz: cz, R: R };
        if (a0 !== undefined) { g.a0 = a0; g.a1 = a1; }
        return { ring: g, r: r, a: a, cx: cx, cz: cz };
    }

    /* A road that bends: a pad laid along a centreline instead of over a
       rectangle (physics.laneHas has the shape). It is written the way you
       would drive it — set off from (x, z) heading along `dir`, then a list
       of pieces:

         ['line', length, opts]          straight on
         ['arc', radius, turn, opts]     round a radius through `turn` radians

       `dir` and `turn` are yaws, the same sense a shot's aim is measured in:
       0 is up the hole (+z), and a positive turn swings the road towards +x.
       Each piece leaves in the direction the last one arrived in, so however
       it is written the road has no kink in it — which is the whole reason
       it is authored as a drive and not as a list of points.

       `o` is the rest of the pad: `w` its width, `y`, `kind`, and `caps`
       for round ends — true for both, or 'start' or 'end' (a road that stops
       in mid-air looks better stopping in a curve; one that runs on under a
       green wants to stop square, short of the cup). A piece's opts:

         bank   (arc) the outside of the turn raised by this much — a
                `channel` along the outer edge whose profile reaches to the
                inner one, so the inside of the turn is a flat gutter and the
                outside a lip. It eases in and out past the ends of the arc
                (the channel's rounded end), so a straight before and after a
                banked turn meets it without a step. `{ a, r, lip, span }`
                sets the profile's radius, how far outside the edge its spine
                runs, and the stretch of the turn it runs along, as fractions
                of it ([0, 1] by default) — the ease is the channel's rounded
                end, about `r` long, so a turn that has to be level where it
                finishes stops its spine short of the end by that much.
         kerb   'in', 'out' or 'both': a rail along that side, laid by
                `enclose` off the ground (laneRails) — a road gets none
                otherwise, because a road on a ledge is a brink on both sides
                unless somebody says it is not. On a straight, in and out are
                the sides of the nearest turn (the next one, else the last).

       Arcs of more than half a turn are cut in two, because that is the
       widest wedge laneHas can test without an atan2. */
    function road(o, pieces) {
        var P = G3.physics, hw = o.w / 2, x = o.x, z = o.z, yaw = o.dir || 0, s = 0;
        var ux = Math.sin(yaw), uz = Math.cos(yaw), segs = [], bumps = [];
        pieces.forEach(function (pc) {
            var opt, len, R, turn, parts, k, dt, side, cx, cz, a0, a1, g, first;
            if (pc[0] === 'line') {
                opt = pc[2] || {};
                len = pc[1];
                segs.push({ x0: x, z0: z, ux: ux, uz: uz, len: len, s0: s, kerb: opt.kerb });
                x += ux * len; z += uz * len; s += len;
                return;
            }
            R = pc[1]; turn = pc[2]; opt = pc[3] || {};
            parts = Math.max(1, Math.ceil(Math.abs(turn) / Math.PI - 1e-9));
            first = segs.length;
            for (k = 0; k < parts; k++) {
                dt = turn / parts;
                // A positive turn is clockwise in atan2's sense: its centre is
                // on the road's +x side when heading up the hole.
                side = dt > 0 ? 1 : -1;
                cx = x + side * R * uz; cz = z - side * R * ux;
                a0 = Math.atan2(z - cz, x - cx);
                a1 = a0 - dt;
                g = {
                    cx: cx, cz: cz, R: R, a0: a0, sweep: -dt, len: R * Math.abs(dt), s0: s,
                    turn: -side, kerb: opt.kerb,
                    in2: R > hw ? (R - hw) * (R - hw) : 0, out2: (R + hw) * (R + hw),
                    sx: Math.cos(a0), sz: Math.sin(a0), ex: Math.cos(a1), ez: Math.sin(a1)
                };
                segs.push(g);
                x = cx + Math.cos(a1) * R; z = cz + Math.sin(a1) * R;
                yaw += dt; ux = Math.sin(yaw); uz = Math.cos(yaw);
                s += g.len;
            }
            if (opt.bank) {
                // One channel for the whole authored turn: two meeting at a
                // cut would each round off there and add up to a hump.
                var b = typeof opt.bank === 'number' ? { a: opt.bank } : opt.bank;
                var lip = b.lip || 0, g0 = segs[first], span = b.span || [0, 1];
                var from = g0.a0 + g0.sweep * parts * span[0], to = g0.a0 + g0.sweep * parts * span[1];
                bumps.push(channel(g0.cx, g0.cz, R + hw + lip, b.r || 2 * hw + lip, b.a,
                    Math.min(from, to), Math.max(from, to)));
            }
        });
        var lane = { hw: hw, segs: segs, length: s, x0: o.x, z0: o.z, x1: x, z1: z,
                     cap0: o.caps === true || o.caps === 'start',
                     cap1: o.caps === true || o.caps === 'end' };
        // `in`/`out` on a straight borrow the sense of the nearest turn.
        segs.forEach(function (g, i) {
            if (g.R || !g.kerb || g.kerb === 'both') return;
            var j, near = null;
            for (j = i + 1; j < segs.length && !near; j++) if (segs[j].R) near = segs[j];
            for (j = i - 1; j >= 0 && !near; j--) if (segs[j].R) near = segs[j];
            g.kerbSide = near ? (g.kerb === 'in' ? -near.turn : near.turn) : 0;
        });
        var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        P.laneOutline(lane, 0.1).forEach(function (q) {
            minX = Math.min(minX, q[0]); maxX = Math.max(maxX, q[0]);
            minZ = Math.min(minZ, q[1]); maxZ = Math.max(maxZ, q[1]);
        });
        var p = pad(minX, minZ, maxX - minX, maxZ - minZ, o.y, o.kind);
        p.lane = lane;
        if (bumps.length) p.bumps = bumps;
        return p;
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

    /* A gathering green in nine pads: the outer rim sits flush at the height of
       the ground it meets, four ramps slope down to a sunken flat floor, and four
       banked corner pads complete the gather without any step. Unlike bowl(),
       which stands proud as an island crater, a dish can be laid directly into a
       lane or fairway at height `y` (default 0) while keeping the center flat for
       the cup and the slopes within green repose limits. */
    function dish(cx, cz, outer, flat, depth, y) {
        var base = y || 0;
        var d = depth === undefined ? 0.08 : depth;
        var f = flat === undefined ? 2.6 : flat;
        var a = outer / 2, b = f / 2, run = a - b, k = d / run;
        function q(x, z, w, dpad, ypad, sx, sz) { return pad(x, z, w, dpad, ypad, 'green', sx, sz); }
        var floorY = base - d;
        return [
            q(cx - b, cz - b, f, f, floorY, 0, 0),                         // sunken flat floor
            q(cx - a, cz - b, run, f, base, -k, 0),                       // west ramp
            q(cx + b, cz - b, run, f, floorY, k, 0),                      // east ramp
            q(cx - b, cz - a, f, run, base, 0, -k),                       // south ramp
            q(cx - b, cz + b, f, run, floorY, 0, k),                      // north ramp
            q(cx - a, cz - a, run, run, base + d, -k, -k),                // SW corner
            q(cx + b, cz - a, run, run, base, k, -k),                     // SE corner
            q(cx - a, cz + b, run, run, base, -k, k),                     // NW corner
            q(cx + b, cz + b, run, run, floorY, k, k)                     // NE corner
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

    /* A loop-the-loop, by its foot: the ball rolls in at (x, z) heading along
       `yaw`, goes round a circle of radius R (the path of its middle) and
       comes out `shift` to the right of where it went in, still heading along
       `yaw`. physics.js has the rule ("the loop"), and its one number to
       remember: the foot wants about √(5·g·R) of speed and the boards take
       some off, so a 1.1 loop wants about 14 — a firm mallet, never a putter. */
    function loop(x, z, yaw, R, shift) {
        return { x: x, z: z, yaw: yaw || 0, R: R === undefined ? 1.1 : R,
            shift: shift === undefined ? 1 : shift };
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

    function bands(z0, rows, x0, opts) {
        var pads = [], z = z0, y = 0, i, j, row, spec, sz, c, x, p, cells, plan = [];
        for (i = 0; i < rows.length; i++) {
            row = rows[i];
            spec = typeof row[0] === 'number' ? { d: row[0] } : row[0];
            if (spec.y !== undefined) y = spec.y;
            sz = spec.sz || 0;
            x = x0 || 0;
            cells = [];
            for (j = 1; j < row.length; j++) {
                c = row[j];
                p = c[1] ? pad(x, z, c[0], spec.d, y + (c[2] || 0), c[1], 0, sz) : null;
                if (p) pads.push(p);
                cells.push({ x0: x, x1: x + c[0], kind: c[1] || null, dy: c[2] || 0, pad: p });
                x += c[0];
            }
            plan.push({ z: z, d: spec.d, cells: cells });
            z += spec.d;
            y += sz * spec.d;
        }
        if (opts && opts.mow) mow(plan, opts.mow);
        return merge(pads);
    }

    /* ── the mown line ────────────────────────────────────────────────────

       A row is how a hole is written, and a fairway written in rows is a
       stack of rectangles: dead straight down both sides, stepping sideways
       wherever one row is wider than the next, and stopping in a straight
       line across the hole at either end. Nothing mown looks like that. A
       greenkeeper follows the ground and the eye, and what he leaves is a
       ribbon — swelling and narrowing, bending where the hole bends, and
       rounded off at each end.

       So once the rows are laid, every run of rows with one fairway in each is
       given one (physics.mowEdge says what one is), and the cells on either
       side of it are cut to its edges. What decides the shape:

       - **The rows still say where the fairway is.** The ribbon's centre and
         width are each row's own, held through the middle of the row and eased
         into the next across the seam, so a dogleg written as three rows each
         a unit further left comes out as one bend.
       - **The edges wander, each its own way.** Three long sines a side, nine
         to twenty-three units, at most `MOW_AMP` — and never more than a third
         of the rough beside the fairway or an eighth of the fairway itself,
         because a fairway that wanders off its own row is a different hole.
       - **The ends are round**, over `MOW_END` or less: a quarter-ellipse,
         which meets the hole square at its tip. Only where there is rough on
         both sides and rough beyond the end, though. A fairway that runs up
         to the lip of a canyon or the bank of a lake stops where it was
         written, because there the straight edge is the hazard's and not the
         mower's.
       - **Only rough gives way.** A side is curved only where every row of
         the run has rough beside the fairway at the same level. A null cell
         is a hole in the world and its edge is not the mower's to move.

       None of it changes a height. Fairway and rough in one row are the same
       plane and the same field (that is what `bands` and `shape` are for), so
       moving the line between them moves what the ground is made of and
       nowhere where it is. */
    var MOW_AMP = 0.9;
    var MOW_WAVES = [[9, 0.25], [14.5, 0.4], [23, 0.35]];  // wavelength, share of amp
    var MOW_BLEND = 2.5;    // half-length of the ease across a seam between rows
    var MOW_END = 2.5;      // how far a rounded end reaches back into the run
    var MOW_KEEP = 0.5;     // the least rough a curve may leave beside it
    var MOW_LEAST = 1;      // …and the least fairway, measured from its far edge

    function mow(plan, seed) {
        var rnd = seeded(typeof seed === 'number' ? seed : 1), i = 0, j, k, run, a, b;
        function fairwayOf(row) {
            var hit = -1, q;
            for (q = 0; q < row.cells.length; q++) {
                if (row.cells[q].kind !== 'fairway') continue;
                if (hit >= 0) return -1;            // two fairways in one row: leave it
                hit = q;
            }
            return hit;
        }
        while (i < plan.length) {
            k = fairwayOf(plan[i]);
            if (k < 0) { i++; continue; }
            run = [{ row: plan[i], k: k }];
            for (j = i + 1; j < plan.length; j++) {
                k = fairwayOf(plan[j]);
                if (k < 0) break;
                a = run[run.length - 1].row.cells[run[run.length - 1].k];
                b = plan[j].cells[k];
                if (b.x1 <= a.x0 + 1 || b.x0 >= a.x1 - 1) break;   // not the same fairway
                run.push({ row: plan[j], k: k });
            }
            ribbon(run, plan[i - 1], plan[j], rnd);
            i = j;
        }
    }

    // Rough the whole way across a cell's width, at its level: the only thing
    // a fairway may round its end off into.
    function roughAcross(row, cell) {
        if (!row) return false;
        var q, c, any = false;
        for (q = 0; q < row.cells.length; q++) {
            c = row.cells[q];
            if (c.x1 <= cell.x0 - MOW_KEEP || c.x0 >= cell.x1 + MOW_KEEP) continue;
            if (c.kind !== 'rough' || c.dy !== cell.dy) return false;
            any = true;
        }
        return any;
    }

    function ribbon(run, before, after, rnd) {
        var n = run.length, k, e, cell, west, east, W = true, E = true;
        var widest = 0, narrow = Infinity, ampW = MOW_AMP, ampE = MOW_AMP;
        for (k = 0; k < n; k++) {
            e = run[k];
            cell = e.row.cells[e.k];
            west = e.row.cells[e.k - 1];
            east = e.row.cells[e.k + 1];
            if (!west || west.kind !== 'rough' || west.dy !== cell.dy) W = false;
            else ampW = Math.min(ampW, (west.x1 - west.x0) / 3);
            if (!east || east.kind !== 'rough' || east.dy !== cell.dy) E = false;
            else ampE = Math.min(ampE, (east.x1 - east.x0) / 3);
            narrow = Math.min(narrow, cell.x1 - cell.x0);
            widest = Math.max(widest, cell.x1 - cell.x0);
        }
        if (!W && !E) return;
        ampW = Math.min(ampW, narrow / 8);
        ampE = Math.min(ampE, narrow / 8);

        var first = run[0].row.cells[run[0].k], last = run[n - 1].row.cells[run[n - 1].k];
        var r = {
            z0: run[0].row.z,
            z1: run[n - 1].row.z + run[n - 1].row.d,
            c: [], h: [], w: [], e: [],
            t0: 0, t1: 0
        };
        if (W && E && roughAcross(before, first)) {
            r.t0 = Math.min(MOW_END, (first.x1 - first.x0) * 0.4, run[0].row.d);
        }
        if (W && E && roughAcross(after, last)) {
            r.t1 = Math.min(MOW_END, (last.x1 - last.x0) * 0.4, run[n - 1].row.d);
        }
        for (k = 0; k < n; k++) {
            var row = run[k].row, c = row.cells[run[k].k];
            var lin = k ? Math.min(MOW_BLEND, row.d / 2, run[k - 1].row.d / 2) : 0;
            var lout = k < n - 1 ? Math.min(MOW_BLEND, row.d / 2, run[k + 1].row.d / 2) : 0;
            r.c.push([row.z + lin, (c.x0 + c.x1) / 2], [row.z + row.d - lout, (c.x0 + c.x1) / 2]);
            r.h.push([row.z + lin, (c.x1 - c.x0) / 2], [row.z + row.d - lout, (c.x1 - c.x0) / 2]);
        }
        for (k = 0; k < MOW_WAVES.length; k++) {
            r.w.push([Math.PI * 2 / MOW_WAVES[k][0], (W ? ampW : 0) * MOW_WAVES[k][1], rnd() * Math.PI * 2]);
            r.e.push([Math.PI * 2 / MOW_WAVES[k][0], (E ? ampE : 0) * MOW_WAVES[k][1], rnd() * Math.PI * 2]);
        }

        // One edge object per seam per row, held by the pads on both sides.
        for (k = 0; k < n; k++) {
            e = run[k];
            cell = e.row.cells[e.k];
            west = e.row.cells[e.k - 1];
            east = e.row.cells[e.k + 1];
            // A side that is not mown keeps the cell's own straight edge.
            if (W) {
                cell.pad.west = west.pad.east =
                    { r: r, s: -1, lo: west.x0 + MOW_KEEP, hi: cell.x1 - MOW_LEAST };
            }
            if (E) {
                cell.pad.east = east.pad.west =
                    { r: r, s: 1, lo: cell.x0 + MOW_LEAST, hi: east.x1 - MOW_KEEP };
            }
        }
    }

    // Two edges are the same edge if a pad on either side would be cut alike.
    function sameEdge(a, b) {
        if (!a || !b) return !a && !b;
        return a.r === b.r && a.s === b.s && a.lo === b.lo && a.hi === b.hi;
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

        /* The fairway is mown rather than ruled (see `mow`), unless a hole
           says otherwise. Its wander is seeded off the rows themselves, so a
           hole is the same hole on every load and two holes written alike
           still do not share an edge. */
        return {
            pads: bands(z0 - s, out, -w,
                { mow: o.mow === false ? 0 : (o.mow || rowSeed(rows)) }),
            fence: { x: 0, z: z0, w: span, d: depth }
        };
    }

    function rowSeed(rows) {
        var t = JSON.stringify(rows), h = 2166136261, i;
        for (i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
        return (h >>> 0) % 100000 + 1;
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
                    if (!sameEdge(a.west, b.west) || !sameEdge(a.east, b.east)) continue;
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
        if (o.palm) w.palm = true;                // drawn as a palm (render.addTree)
        return w;
    }

    /* A stand of them along a line. A treeline is never one tree — and where
       the line runs up a slope, `y0`/`y1` walk the ground up with it. */
    /* A wood: trees scattered through an oval round (cx, cz), seeded so it is
       the same wood every load, no two trunks closer than `gap`, and none in
       a `clear` circle (keep(x, z, r): a fairway's line, a green, a tee).
       What a parkland uses at the edge of play instead of a line of stakes:
       a ball that strays into one is not out, it is among trunks, and the
       shot out is the penalty. Trunks are solid (see `tree`), canopies are
       not, and `build` seats every one on the ground. */
    function forest(cx, cz, rx, rz, n, seed, opts) {
        var o = opts || {}, rnd = seeded(seed || 1), out = [], tries = 0, a, r, x, z, i, ok;
        var gap = o.gap || 1.6, clear = o.clear || [];
        while (out.length < n && tries++ < n * 40) {
            a = rnd() * Math.PI * 2; r = Math.sqrt(rnd());
            x = cx + Math.cos(a) * rx * r; z = cz + Math.sin(a) * rz * r;
            ok = true;
            for (i = 0; i < out.length && ok; i++) {
                if (Math.hypot(out[i].x + out[i].w / 2 - x, out[i].z + out[i].d / 2 - z) < gap) ok = false;
            }
            for (i = 0; i < clear.length && ok; i++) {
                if (Math.hypot(clear[i].x - x, clear[i].z - z) < clear[i].r) ok = false;
            }
            if (ok) out.push(tree(x, z, { t: 0.42 + rnd() * 0.3, h: 2.6 + rnd() * 1.4 }));
        }
        return out;
    }

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

    /* ── decor: props drawn for atmosphere, not simulated ───────────────
       Solid scenery (trees, rocks) collides with the ball and must stand
       on the ground under it. Decor props are the other kind: purely
       visual dressings drawn by render.js that the physics simulation has
       never heard of, placed off the pads (or in the water) with an explicit
       y height. */
    function decor(kind, x, z, y, opts) {
        if (typeof y === 'object' && y !== null && opts === undefined) {
            opts = y;
            y = undefined;
        }
        var hasY = y !== undefined;
        var o = opts || {};
        if (!hasY && o.y !== undefined) hasY = true;
        return {
            kind: kind,
            x: x, z: z,
            y: y !== undefined ? y : (o.y !== undefined ? o.y : 0),
            explicitY: hasY,
            yaw: o.yaw || 0,
            pitch: o.pitch || 0,
            roll: o.roll || 0,
            scale: o.scale || 1,
            variant: o.variant || 0,
            // The arcade's dressings carry a little more: a skyline's length
            // and a marquee's words (render.addDecor).
            w: o.w || 0,
            text: o.text || ''
        };
    }

    function buoy(x, z, y, opts) { return decor('buoy', x, z, y, opts); }
    function piling(x, z, y, opts) { return decor('piling', x, z, y, opts); }
    function bench(x, z, y, opts) { return decor('bench', x, z, y, opts); }
    function boat(x, z, y, opts) { return decor('boat', x, z, y, opts); }
    function sailboat(x, z, y, opts) { return decor('sailboat', x, z, y, opts); }
    function bin(x, z, y, opts) { return decor('bin', x, z, y, opts); }
    function barrel(x, z, y, opts) { return decor('barrel', x, z, y, opts); }
    function crate(x, z, y, opts) { return decor('crate', x, z, y, opts); }
    function palm(x, z, y, opts) { return decor('palm', x, z, y, opts); }
    function pine(x, z, y, opts) { return decor('pine', x, z, y, opts); }
    function sign(x, z, y, opts) { return decor('sign', x, z, y, opts); }
    function windmill(x, z, y, opts) { return decor('windmill', x, z, y, opts); }
    /* The arcade's own (Pinball Parlour): a city of lit towers standing on the
       basement floor behind a table, an upright cabinet with its screen on, a
       neon marquee with words in it, and a lamp let into the baize — a round
       insert or (variant 1) an arrow along `yaw` — which is how a pinball
       table tells you where the shot is without saying so. Lamps chase: each
       lights a beat after the one before it in the list. */
    function skyline(x, z, y, opts) { return decor('skyline', x, z, y, opts); }
    function cabinet(x, z, y, opts) { return decor('cabinet', x, z, y, opts); }
    function marquee(x, z, y, opts) { return decor('marquee', x, z, y, opts); }
    function lamp(x, z, y, opts) { return decor('lamp', x, z, y, opts); }
    // And the rest of the room: a jukebox, a claw machine, a fruit machine.
    function jukebox(x, z, y, opts) { return decor('jukebox', x, z, y, opts); }
    function claw(x, z, y, opts) { return decor('claw', x, z, y, opts); }
    function fruit(x, z, y, opts) { return decor('fruit', x, z, y, opts); }

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
        /* The footprint is the shape's bounding box, so it is also where the
           semi-axes come from: equal for anything a compass drew, which is
           every disc the editor makes (it squares one up before it gets here)
           and different for an oval. `r` is the circle the shape is
           guaranteed to stay inside and `rIn` the one it is guaranteed to
           fill, and on an oval they come off different axes. */
        p.rx = p.w / 2;
        p.rz = p.d / 2;
        p.r = Math.max(p.rx, p.rz);
        var rnd = seeded(Math.round(cx * 733 + cz * 9173 + p.r * 51419));
        var terms = [], i;
        for (i = 0; i < WAVE_LOBES.length; i++) {
            terms.push([WAVE_LOBES[i], WAVE * WAVE_SHARE[i], rnd() * Math.PI * 2]);
        }
        p.wave = { bite: WAVE, terms: terms };
        p.rIn = Math.min(p.rx, p.rz) * (1 - 2 * WAVE);
        return p;
    }

    /* A round green, laid into whatever it is standing on. Round-ish: see
       WAVE above for the shape of its edge, and physics.padRadius for the one
       function that answers where that edge is.

       `rz` makes it an oval instead, which is what most bunkers want: sand is
       scraped out of a slope, so it runs along the hill rather than round it,
       and four circles in a row is a string of beads. `r` is then the
       half-width across the hole and `rz` the half-length down it. */
    function circle(cx, cz, r, kind, y, rz) {
        var b = rz || r;
        var p = pad(cx - r, cz - b, 2 * r, 2 * b, y || 0, kind || 'green');
        p.r = Math.max(r, b);
        p.inlay = true;
        return shapeDisc(p);
    }

    /* The same disc, laid into ground that is already there rather than at a
       height somebody worked out by hand.

       `circle` builds a disc that stands on its own — level, and at whatever
       `y` the call names. That is fine on a hole whose green sits on a flat
       shelf and a trap on one written in `bands`, because a row may tilt and
       the level of the fifth row is the sum of the four above it. An inlay is
       only an inlay while it is *flush*: a level disc laid on a row falling at
       a fifth is a table with daylight under one edge and its rim buried at
       the other, and a copied `y` goes stale the first time a row above it is
       retilted — the same second copy of the height field that `build` seats
       trees off the ground to avoid.

       So this reads the ground instead. The pad under the disc's middle hands
       over its cross-fall, and the disc's own level is set to what that plane
       is worth at the disc's origin, which makes `padHeight` give the two the
       same answer everywhere they overlap.

       A bunker takes the ground's humps as well, so it lies on the hillside it
       was cut into rather than across it — the field is the same function on
       both, so they agree to the float. A *green* does not, and cannot: a disc
       with humps in it is drawn as terrain, which is the one path that cannot
       punch a cup out of itself. So a green goes where the field is flat —
       which is where the tests already insist a green goes — and `tests.html`
       measures every inlay against the ground under it rather than trusting
       this note. */
    function inlay(pads, cx, cz, r, kind, rz) {
        var host = null, hy = -Infinity, i, p, h;
        for (i = 0; i < pads.length; i++) {
            p = pads[i];
            if (p.inlay || !G3.physics.padContains(p, cx, cz)) continue;
            h = G3.physics.padHeight(p, cx, cz);
            if (h > hy) { hy = h; host = p; }
        }
        var d = circle(cx, cz, r, kind, 0, rz);
        if (!host) return d;
        d.sx = host.sx || 0;
        d.sz = host.sz || 0;
        if (d.kind !== 'green' && host.bumps && host.bumps.length) {
            d.bumps = host.bumps.slice();
        }
        // Level it last: whatever the plane and the humps add at the middle
        // with the disc standing at zero is exactly what it has to be lowered
        // by to meet the ground there.
        d.y = 0;
        d.y = hy - G3.physics.padHeight(d, cx, cz);
        return d;
    }

    function keep(x, z, r) { return { x: x, z: z, r: r }; }

    /* A pond that is a hollow in the ground with water in it, rather than a
       rectangle of water in a hole in the ground — which is what every pond
       in the game was, and why from above they were all boxes.

       `lobes` are hollows, [x, z, r, depth] each; overlapping two or three is
       what makes a pond a blob instead of a circle. They are laid into every
       ground pad (like `shape`), and the water's level is set just under the
       *lowest* point of their rims as the ground stood before them — so on a
       hillside the water stops where the downhill rim does rather than
       spilling out of the hollow, and the shoreline is wherever the ground
       crosses that level: curved, and different on every side. The water is
       the hollows' bounding box marked `dip`, because its bed is ground
       (physics.drown asks only "inside the box and below the surface?", and
       the audit and the renderer know a dip from a channel). Call it before
       the inlays: a green or a bunker laid afterwards takes the ground as
       the hollows left it. Returns the water, for the hole's `water`. */
    function pond(pads, lobes, opts) {
        var o = opts || {}, P = G3.physics, i, k, L, x, z, a, lo = Infinity, h;
        function ground(px, pz) {
            var best = -Infinity, j, p;
            for (j = 0; j < pads.length; j++) {
                p = pads[j];
                if (p.inlay || !P.padContains(p, px, pz)) continue;
                best = Math.max(best, P.padHeight(p, px, pz));
            }
            return best;
        }
        for (i = 0; i < lobes.length; i++) {
            L = lobes[i];
            for (k = 0; k < 32; k++) {
                a = k / 32 * Math.PI * 2;
                x = L[0] + Math.cos(a) * L[2]; z = L[1] + Math.sin(a) * L[2];
                h = ground(x, z);
                if (h > -Infinity && h < lo) lo = h;
            }
        }
        var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        var bumps = lobes.map(function (L) {
            minX = Math.min(minX, L[0] - L[2]); maxX = Math.max(maxX, L[0] + L[2]);
            minZ = Math.min(minZ, L[1] - L[2]); maxZ = Math.max(maxZ, L[1] + L[2]);
            return hill(L[0], L[1], L[2], -L[3]);
        });
        /* …and round the edge of the box, which is what is drawn. On ground
           with a fall across it the box's downhill corner stands lower than
           any point on any rim, and a level set off the rims alone is water
           laid over the grass in that corner (audit → water-spills). */
        for (k = 0; k <= 40; k++) {
            a = k / 40;
            [[minX + (maxX - minX) * a, minZ], [minX + (maxX - minX) * a, maxZ],
             [minX, minZ + (maxZ - minZ) * a], [maxX, minZ + (maxZ - minZ) * a]].forEach(function (q) {
                h = ground(q[0], q[1]);
                if (h > -Infinity && h < lo) lo = h;
            });
        }
        carve(pads, bumps, { rock: o.rock });
        var w = rect(minX, minZ, maxX - minX, maxZ - minZ, lo - (o.freeboard === undefined ? 0.08 : o.freeboard));
        w.dip = true;
        return w;
    }

    /* `shape`, for humps that reach only part of a hole: each ground pad is
       handed only the ones that touch it. A hump is exactly zero past its own
       radius, so the ground is the same either way; a pad merely stops
       summing forty lobes of a lake a hundred units away every time the ball
       asks it how high it is. Inlays are left alone, as `shape` leaves them
       to `inlay` — lay those afterwards.

       `opts.rock` marks every pad it touched as one whose steep ground is
       bare rock (render.js → addTerrain), which is how a carved canyon gets
       the red walls a cut one had for free from its skirts. */
    function carve(pads, bumps, opts) {
        var rock = !!(opts && opts.rock);
        pads.forEach(function (p) {
            if (p.inlay) return;
            var near = bumps.filter(function (b) {
                return b.cx + b.r > p.x && b.cx - b.r < p.x + p.w &&
                       b.cz + b.r > p.z && b.cz - b.r < p.z + p.d;
            });
            if (!near.length) return;
            shape([p], near);
            if (rock) p.rock = true;
        });
        return pads;
    }

    /* A canyon that bends, carved into the ground rather than cut out of it.

       `ravine` is a box: a floor, a bank, and a sheer near wall that is the
       edge of the row before it — which is what makes it a hazard (README →
       "The gorge") and also why every canyon on Redstone was ruled. A wall
       that curves cannot be the edge of a pad, so this one is ground: two
       chains of hollows down the same bent line. The near chain is narrow
       and deep, and its steep side is the lip; the far chain is wide and
       shallow and sits further across, and its long gentle side is the bank
       a ball is played back up. So the asymmetry survives the curve — sheer
       enough on the near side that a drive pitching there goes down rather
       than across, banked enough on the far one that a ball in the bottom is
       two shots lost and not the round.

       `pts` is the line of the near lip, [x, z] each, and the canyon opens on
       the side the line turns left towards (+z for a line running +x). The
       lobes wander a little off it from the seed. Returns the humps, for
       `carve`. The whole carve reaches about 0.6 short of the line and
       10·scale beyond it. */
    function gully(pts, seed, opts) {
        var o = opts || {}, rnd = seeded(seed || 1), out = [], i, k, a, b, len, n, f, nx, nz, w;
        var wob = o.wobble === undefined ? 0.12 : o.wobble, sc = o.scale || 1;
        /* Four chains, each further across, wider and shallower than the one
           before: the first is the near wall and the rest are the floor
           ramping up into the bank. Two were tried first — a narrow deep
           chain and a wide shallow one — and they leave a V in the bottom:
           a narrow hollow is as steep on its far side as its near, so the
           climb out of the floor was two in places and a ball rolled back
           into it off every club in the bag. These keep the climb under
           0.85 over forty seeds (the cut gorge's bank was 0.73) with the
           near wall at about 2.2, 2.9 to 3.2 units deep and ten across.
           `scale` narrows the whole section and makes it shallower by the
           same factor, which leaves every slope where it was. */
        var chains = (o.chains || [
            { r: 2.0, a: 0.9, off: 1.4 }, { r: 2.6, a: 0.7, off: 2.6 },
            { r: 3.4, a: 0.55, off: 3.9 }, { r: 4.2, a: 0.4, off: 5.2 }
        ]).map(function (c) { return { r: c.r * sc, a: c.a * sc, off: c.off * sc }; });
        chains.forEach(function (c) {
            for (i = 0; i + 1 < pts.length; i++) {
                a = pts[i]; b = pts[i + 1];
                len = Math.hypot(b[0] - a[0], b[1] - a[1]);
                n = Math.max(1, Math.ceil(len / (c.r * 0.6)));
                nx = -(b[1] - a[1]) / len; nz = (b[0] - a[0]) / len;
                for (k = i ? 1 : 0; k <= n; k++) {
                    f = k / n; w = c.off + (rnd() - 0.5) * wob * c.r;
                    out.push(hill(a[0] + (b[0] - a[0]) * f + nx * w, a[1] + (b[1] - a[1]) * f + nz * w,
                                  c.r * (0.9 + rnd() * 0.2), -c.a * (0.9 + rnd() * 0.2)));
                }
            }
        });
        return out;
    }

    /* A burn: `pond`'s lobes strung along a line, which is what PLAN.md
       always said a burn was and what every hole wrote out by hand. Each
       lobe is nudged off the line and sized from the seed, so the water
       wanders a little and its banks are never parallel — a straight burn
       of equal circles is a string of beads, and that is the box again.
       `pts` is the course of it, [x, z] each; the lobes go `r` at most
       ~0.7 of a radius apart so the water never pinches shut between two. */
    function burn(pts, r, depth, seed) {
        var rnd = seeded(seed || 1), out = [], i, k, a, b, len, n, f, nx, nz, s;
        for (i = 0; i + 1 < pts.length; i++) {
            a = pts[i]; b = pts[i + 1];
            len = Math.hypot(b[0] - a[0], b[1] - a[1]);
            n = Math.max(1, Math.ceil(len / (r * 0.7)));
            nx = -(b[1] - a[1]) / len; nz = (b[0] - a[0]) / len;
            for (k = i ? 1 : 0; k <= n; k++) {
                f = k / n; s = (rnd() - 0.5) * 0.5 * r;
                out.push([a[0] + (b[0] - a[0]) * f + nx * s, a[1] + (b[1] - a[1]) * f + nz * s,
                          r * (0.8 + rnd() * 0.35), depth * (0.85 + rnd() * 0.3)]);
            }
        }
        return out;
    }

    /* A mere: one body of water's worth of lobes, for `pond`. A handful of
       big hollows always comes out as a handful of circles — the shoreline
       of each is its own, and where two meet there is a waist — so this
       packs a lot of small ones, overlapping by most of their width, inside
       an outline that wobbles round the ellipse (rx, rz) on two seeded
       harmonics. They add, so `depth` is what the middle comes to rather
       than what one lobe is worth, and the shore is the outline give or
       take half a lobe, curved everywhere and different on every side. */
    function mere(cx, cz, rx, rz, depth, seed) {
        var rnd = seeded(seed || 1), out = [], x, z, u, v, t, edge;
        var r = Math.min(rx, rz) * 0.6, step = r * 0.75;
        var p2 = rnd() * 6.283, p3 = rnd() * 6.283, w2 = 0.12 + rnd() * 0.12, w3 = 0.06 + rnd() * 0.1;
        for (z = -rz; z <= rz + 1e-9; z += step) {
            for (x = -rx; x <= rx + 1e-9; x += step) {
                u = x + (rnd() - 0.5) * step * 0.7;
                v = z + (rnd() - 0.5) * step * 0.7;
                t = Math.atan2(v / rz, u / rx);
                edge = 1 + w2 * Math.sin(2 * t + p2) + w3 * Math.sin(3 * t + p3);
                if (Math.hypot(u / rx, v / rz) > edge - 0.3) continue;
                out.push([cx + u, cz + v, r * (0.8 + rnd() * 0.4), depth * 0.3 * (0.8 + rnd() * 0.4)]);
            }
        }
        return out;
    }

    /* Room round a pond's lobes, as `forest` clearings: a wood planted
       across a hollow puts trunks in the water. */
    function clearOf(lobes, pad) {
        return lobes.map(function (L) { return keep(L[0], L[1], L[2] + (pad || 0.8)); });
    }

    /* The stakes moved out to where the wood ends. Round two of the long game
       (PLAN.md §0): the line of play stays where it was and the boundary
       goes `w` further out on the west and `e` on the east, so what a sliced
       drive meets first is trees rather than a white post — not out, just
       among trunks, and the shot out is the penalty. */
    function widen(fence, w, e) {
        return { x: fence.x - w, z: fence.z, w: fence.w + w + e, d: fence.d };
    }

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
       CONFIG.HOLD.green is 0.22, so the steepest ground a putt ever crosses is
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
            // For the tests, which hold every one of these to a hole that
            // asked to roll — see `rolling` in build.
            b.forEach(function (m) { m.contour = true; });
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
            /* An inlaid bunker is never dished — it lies on whatever ground it
               was laid into (see `inlay`) and adds no hollow of its own — and
               this is the one place in the file where the renderer gets a vote.

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
        /* A rounded corner at either end of this edge takes its own rail
           (`cornerRails`), so the straight one stops where the curve starts:
           exactly there, not at the nearest sample, or the two would leave a
           chink between them a ball could find. */
        var rc = p.round || {};
        var rS = (side === 'e' ? rc.se : side === 'n' ? rc.nw : rc.sw) || 0;
        var rE = (side === 's' ? rc.se : side === 'w' ? rc.nw : rc.ne) || 0;

        for (i = 0; i < n; i++) {
            t0 = i * step; t1 = t0 + step; mid = (t0 + t1) / 2;
            if (mid < rS) continue;
            if (mid > along - rE) {
                if (run) { run.t1 = along - rE; out.push(railFor(p, side, run, pads)); run = null; }
                continue;
            }
            if (t0 < rS) t0 = rS;

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

    /* The rail round a rounded corner: an arc of chords (`arc`) on the same
       line the straight rails stand on — a rail's half-thickness outside the
       edge — and built to the same height rule as `railFor`, off the ground
       at both ends of the curve and in the middle of it.

       A `gaps` rectangle opens a curve the way it opens a straight edge: a
       chord whose foot on the ground's edge is in one is left out, and each
       run of chords either side is a kerb of its own. `roundCorners` never
       rounds a corner near a gap, so only a hole that writes its own
       `pad.round` can ask for this — a curved lip with nothing on it, which
       is The Backboard's (v1.127.0). */
    function cornerRails(p, out, gaps) {
        var P = G3.physics, c = p.round, k, r, cx, cz, a0, lo, hi, j, a, y;
        var spec = [['sw', 0, 0, Math.PI], ['se', 1, 0, Math.PI * 1.5],
                    ['ne', 1, 1, 0], ['nw', 0, 1, Math.PI / 2]];
        for (k = 0; k < spec.length; k++) {
            r = c[spec[k][0]];
            if (!r) continue;
            cx = spec[k][1] ? p.x + p.w - r : p.x + r;
            cz = spec[k][2] ? p.z + p.d - r : p.z + r;
            a0 = spec[k][3];
            lo = Infinity; hi = -Infinity;
            for (j = 0; j <= 2; j++) {
                a = a0 + j * Math.PI / 4;
                y = P.padHeight(p, cx + Math.cos(a) * r * 0.98, cz + Math.sin(a) * r * 0.98);
                lo = Math.min(lo, y); hi = Math.max(hi, y);
            }
            /* The chords are what the ball meets; `bend` is what the eye
               does. The renderer draws one smooth kerb per bend instead of
               the chords, which side-on read as a fan of flat boards. */
            var n = Math.max(4, Math.ceil(r / 0.22)), da = Math.PI / 2 / n, i0 = 0, i;
            for (i = 0; i <= n; i++) {
                a = a0 + (i + 0.5) * da;
                if (i < n && !inAny(gaps, cx + Math.cos(a) * r, cz + Math.sin(a) * r)) continue;
                if (i > i0) kerb(a0 + i0 * da, a0 + i * da, i - i0,
                    i0 > 0 || past(a0, 1), i < n || past(a0 + Math.PI / 2, -1));
                i0 = i + 1;
            }
        }
        // Whether the straight edge just past one end of the curve is open.
        function past(e, s) {
            var x = cx + Math.cos(e) * r + s * Math.sin(e) * 0.15, z = cz + Math.sin(e) * r - s * Math.cos(e) * 0.15;
            return inAny(gaps, x, z);
        }
        // `cap0`/`cap1`: an end that stops at a gap rather than running on
        // into the next rail, which the renderer finishes round.
        function kerb(from, to, m, cap0, cap1) {
            var bend = { cx: cx, cz: cz, R: r + RAIL_T / 2, a0: from, a1: to,
                         t: RAIL_T, base: lo - 0.35, h: (hi - lo) + RAIL_H + 0.35,
                         cap0: cap0, cap1: cap1 };
            arc(cx, cz, bend.R, bend.a0, bend.a1, {
                t: RAIL_T, n: m, base: bend.base, h: bend.h, kind: 'rail'
            }).forEach(function (w) { w.bend = bend; out.push(w); });
        }
    }

    /* Whether the floor carries on just past one end of a run of rail, on the
       line the rail stands on: a pad there at this edge's height. */
    function floorPast(pads, p, side, t, dir) {
        var s = t + dir * PROBE, o = RAIL_T / 2, along = (side === 'n' || side === 's') ? p.w : p.d;
        var e = Math.max(0, Math.min(along, t)), x, z, ex, ez, h;
        if (side === 's') { x = p.x + s; z = p.z - o; ex = p.x + e; ez = p.z; }
        else if (side === 'n') { x = p.x + s; z = p.z + p.d + o; ex = p.x + e; ez = p.z + p.d; }
        else if (side === 'w') { x = p.x - o; z = p.z + s; ex = p.x; ez = p.z + e; }
        else { x = p.x + p.w + o; z = p.z + s; ex = p.x + p.w; ez = p.z + e; }
        h = heightAt(pads, x, z, p);
        return h !== null && Math.abs(h - G3.physics.padHeight(p, ex, ez)) < 0.3;
    }

    function railFor(p, side, run, pads) {
        /* Overhang the ends by a thickness so an outside corner meets and
           seals: the two rails' ends between them fill the square where the
           corner is. Walls are allowed to overlap; the solver resolves them
           one at a time.

           Not where the floor carries on past the end, though — an inside
           corner, where a five-wide tee pad meets an eight-wide green, or
           the place a neighbour opens the edge. The rail on the other side
           of that corner already fills the square, so an overhang there is
           a stub of rail standing on the next pad's floor, and the two stubs
           crossing were the X every inside corner on the mini courses wore
           (v1.127.0). */
        var a = run.t0 - (floorPast(pads, p, side, run.t0, -1) ? 0 : RAIL_T);
        var b = run.t1 + (floorPast(pads, p, side, run.t1, 1) ? 0 : RAIL_T);
        var base = run.lo - 0.35;
        var h = (run.hi - run.lo) + RAIL_H + 0.35;
        if (side === 's') return wall(p.x + a, p.z - RAIL_T, b - a, RAIL_T, h, { base: base });
        if (side === 'n') return wall(p.x + a, p.z + p.d, b - a, RAIL_T, h, { base: base });
        if (side === 'w') return wall(p.x - RAIL_T, p.z + a, RAIL_T, b - a, h, { base: base });
        return wall(p.x + p.w, p.z + a, RAIL_T, b - a, h, { base: base });
    }

    /* The kerbs along a road (courses.road), wherever a piece asked for one
       and nowhere else — a road's box is not its outline, so the edge walk
       above has nothing to say about it. The same rail the edge walk would
       build, on the same line (a half-thickness outside the edge) and to the
       same height rule as `railFor`, off the ground along that edge. A kerb
       round a turn is `arc`'s chords with one `bend` the renderer draws as a
       single smooth kerb, exactly as a rounded corner's is; one along a
       straight is a turned rail. */
    function laneRails(p, out) {
        var P = G3.physics, L = p.lane, at = [0, 0, 0, 0];
        L.segs.forEach(function (g) {
            if (!g.kerb) return;
            var sides = g.kerb === 'both' ? [1, -1]
                : g.R ? [g.kerb === 'in' ? -g.turn : g.turn] : [g.kerbSide];
            sides.forEach(function (side) {
                if (!side) return;
                var lo = Infinity, hi = -Infinity, k, y, off = side * (L.hw - 0.02);
                for (k = 0; k <= 6; k++) {
                    P.lanePoint(L, g.s0 + g.len * k / 6, at);
                    y = P.padHeight(p, at[0] + at[2] * off, at[1] + at[3] * off);
                    lo = Math.min(lo, y); hi = Math.max(hi, y);
                }
                var base = lo - 0.35, h = (hi - lo) + RAIL_H + 0.35;
                if (!g.R) {
                    P.lanePoint(L, g.s0 + g.len / 2, at);
                    var m = side * (L.hw + RAIL_T / 2);
                    // Marked, as a bend is, so nothing mistakes it for a
                    // turned rail somebody placed (the editor's import).
                    var kb = bank(at[0] + at[2] * m, at[1] + at[3] * m, g.len + RAIL_T,
                        Math.atan2(-g.uz, g.ux), { t: RAIL_T, h: h, base: base });
                    kb.lane = true;
                    out.push(kb);
                    return;
                }
                // The + side is the inside of a turn whose sweep is negative.
                var Rk = g.R + (side === -g.turn ? -1 : 1) * (L.hw + RAIL_T / 2);
                var a0 = Math.min(g.a0, g.a0 + g.sweep), a1 = Math.max(g.a0, g.a0 + g.sweep);
                var bend = { cx: g.cx, cz: g.cz, R: Rk, a0: a0, a1: a1,
                             t: RAIL_T, base: base, h: h, lane: true };
                arc(g.cx, g.cz, Rk, a0, a1, {
                    t: RAIL_T, n: Math.max(4, Math.ceil(Rk * (a1 - a0) / 0.35)),
                    base: base, h: h, kind: 'rail'
                }).forEach(function (w) { w.bend = bend; out.push(w); });
            });
        });
    }

    function enclose(pads, gaps) {
        var out = [], i;
        for (i = 0; i < pads.length; i++) {
            if (pads[i].lane) { laneRails(pads[i], out); continue; }
            edgeRails(pads, pads[i], 's', gaps, out);
            edgeRails(pads, pads[i], 'n', gaps, out);
            edgeRails(pads, pads[i], 'w', gaps, out);
            edgeRails(pads, pads[i], 'e', gaps, out);
            if (pads[i].round) cornerRails(pads[i], out, gaps);
        }
        return out;
    }

    /* ── rounded corners ──

       Every drawn hole used to be drawn with a set square: a lane is a
       rectangle, a dogleg is two of them, and from above a course read as a
       diagram of itself — the owner's word for the mini courses was "boxes".
       Real crazy golf is built of kerb that bends, and the outside corner of
       a lane is where it bends first.

       So `build` rounds the corners of a fenced hole that are *outside*
       corners: the ones where both edges meeting there are rails and the
       ground simply stops. That is decided from the ground rather than
       written on each hole, because which corners are exposed is a fact
       about the pads, and an author asked to list them would miss the ones
       a later edit exposed. A corner keeps its square when anything about
       it is load-bearing:

       - **a neighbour or a gap** along either edge near it, or across the
         diagonal — a pad that carries on, a shoreline left open, a brink you
         are meant to fall off. Rounding there would cut a notch in a floor or
         a rail into an edge that is meant to be bare;
       - **anything standing in the corner** — a rail laid across it on
         purpose (Sea Legs turns the ball off one), a gate whose sweep
         reaches it, a blade — since the curve would cut the ground out from
         under it or leave a stub of it poking out through the kerb;
       - **the tee or the cup** near it, so neither's flat ever loses ground;
       - **a pad that is not a plain slab**: a disc, contoured ground, a mown
         fairway, a belt, a launch pad, a hovering platform. Each of those
         already draws its own outline.

       The radius is ROUND, or a quarter of the pad's narrow side if that is
       smaller, so a two-unit plank keeps a corner a plank would have. A hole
       may set its own (`round: 0.6`) or keep every corner square
       (`round: 0`). Physics (`padContains`), the rails (`cornerRails`), the
       renderer and the minimap all read the one field, `pad.round`. */
    var ROUND = 1.1;

    function roundCorners(h) {
        var R = h.round === undefined ? ROUND : h.round, pads = h.pads, gaps = h.gaps || [];
        var stood = (h.extra || []).map(function (w) {
            // Everything a wall can reach, as a box: its own footprint grown
            // to the circle it turns in, and stretched by however far it slides.
            var cx = w.x + w.w / 2, cz = w.z + w.d / 2;
            var e = (w.yaw || w.spin || w.swing) ? Math.hypot(w.w, w.d) / 2 : 0;
            var ex = e || w.w / 2, ez = e || w.d / 2, amp = w.move ? Math.abs(w.move.amp || 0) : 0;
            if (w.move && w.move.axis === 'z') ez += amp; else ex += amp;
            return { x: cx - ex, z: cz - ez, w: ex * 2, d: ez * 2 };
        });
        if (!R) return;
        pads.forEach(function (p) {
            if (p.r || p.lane || p.bumps || p.field || p.inlay || p.west || p.east || p.voids ||
                p.push || p.spring || p.hover || p.round) return;
            var r = Math.min(R, Math.min(p.w, p.d) / 4), out = {}, any = false;
            if (r < 0.45) return;
            [['sw', p.x, p.z, -1, -1], ['se', p.x + p.w, p.z, 1, -1],
             ['nw', p.x, p.z + p.d, -1, 1], ['ne', p.x + p.w, p.z + p.d, 1, 1]].forEach(function (c) {
                if (exposed(p, c[1], c[2], c[3], c[4], r)) { out[c[0]] = r; any = true; }
            });
            if (any) p.round = out;
        });

        function bare(x, z) {
            return heightAt(pads, x, z, null) === null && !inAny(gaps, x, z);
        }
        function exposed(p, X, Z, sx, sz, r) {
            var reach = r + 0.6, s, u, v, i;
            if (!bare(X + sx * PROBE, Z + sz * PROBE)) return false;
            for (s = 0; s <= reach; s += 0.1) {
                // Outside each edge, and on it (a gap is tested at the edge).
                if (!bare(X - sx * s, Z + sz * PROBE) || inAny(gaps, X - sx * s, Z)) return false;
                if (!bare(X + sx * PROBE, Z - sz * s) || inAny(gaps, X, Z - sz * s)) return false;
            }
            // Nothing else claims the square the curve gives up.
            for (u = 0.05; u < r; u += 0.15) {
                for (v = 0.05; v < r; v += 0.15) {
                    if (heightAt(pads, X - sx * u, Z - sz * v, p) !== null) return false;
                }
            }
            for (i = 0; i < stood.length; i++) {
                var b = stood[i], x0 = Math.min(X, X - sx * reach), z0 = Math.min(Z, Z - sz * reach);
                if (b.x < x0 + reach && b.x + b.w > x0 && b.z < z0 + reach && b.z + b.d > z0) return false;
            }
            // The ground the curve gives up all lies within `r` of the corner.
            if (Math.hypot(h.tee.x - X, h.tee.z - Z) < r + TEE_FLAT + 0.3) return false;
            if (Math.hypot(h.cup.x - X, h.cup.z - Z) < r + CUP_FLAT + 0.3) return false;
            return true;
        }
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
        // A loop stands on its foot and its far foot, and both want the
        // floor level under them or the track meets the ground at a step.
        for (i = 0; i < (h.loops || []).length; i++) {
            var lp = h.loops[i], lr = lp.R + 0.6;
            out.push(keep(lp.x, lp.z, lr));
            out.push(keep(lp.x + Math.cos(lp.yaw) * lp.shift, lp.z - Math.sin(lp.yaw) * lp.shift, lr));
        }
        return out;
    }

    /* ── hummocks ──────────────────────────────────────────────────────

       The landforms a long hole is written with are the shape of the hole —
       the crest you carry, the shelf the green sits on — and between them the
       rough was a set of tilted planes: the ground you miss the fairway on,
       and the flattest-looking part of the picture. Real rough is the bit
       nobody mows *because* it is lumpy: old spoil, rabbit scrapes, the
       country the course was cut out of.

       So every shaped open hole gets a scatter of hummocks and hollows in its
       rough, from a seed made of its name. They follow three rules, and each
       is there because breaking it would change the hole rather than dress it:

       - **Rough only, and only gentle rough.** Every sample over a hummock's
         disc, out past its rim, has to land on rough lying at no more than a
         quarter of a gradient — never on fairway, a green, sand, water or the
         bluff a tee stands on, and never off the edge of the ground. The
         fairway's ribbon is the line of play and it stays the shape it was
         written.
       - **Clear of the tee and the cup** by their own flat clearings and a
         unit more.
       - **Gentle.** `HUMMOCK.grad` is the steepest any one gets, a third of
         what rough holds a ball on, and one only goes where the ground under
         it — the row's tilt and the hole's own landforms together — leaves
         room for it below `HOLD.rough`. A ball in the rough is in a lie rather
         than rolling round the bottom of a bowl.

       They are added to the ground pads they can reach and nowhere else —
       every one of them, fairway included, so wherever two pads meet they
       agree on the height. Trees and rocks are seated afterwards, so they
       stand on the hummocks and not through them. */
    var HUMMOCK = { r: 2.4, rMax: 5.4, grad: 0.13, density: 0.014, grow: 8, clear: 0.6, tilt: 0.25 };

    function hummocks(h) {
        var P = G3.physics, f = h.fence;
        if (!f) return;
        var rnd = seeded(nameSeed(h.name) ^ 0x2c1b3c6d);
        var ground = h.pads.filter(function (p) { return !p.inlay; });
        var inlays = h.pads.filter(function (p) { return p.inlay; });
        var ax = f.x - HUMMOCK.grow, az = f.z - HUMMOCK.grow;
        var aw = f.w + HUMMOCK.grow * 2, ad = f.d + HUMMOCK.grow * 2;
        var want = Math.round(aw * ad * HUMMOCK.density), tries = want * 14, made = [];
        var r, cx, cz, a, i, ok, q;

        function rough(x, z) {
            var any = false, k, p;
            for (k = 0; k < inlays.length; k++) if (P.padContains(inlays[k], x, z)) return false;
            if (P.waterAt(h, x, z)) return false;
            for (k = 0; k < ground.length; k++) {
                p = ground[k];
                if (!P.padContains(p, x, z)) continue;
                // A disc that stands (a mesa, an island) is ground of its
                // own with walls, drawn as a solid disc; humps would make it
                // terrain, and a disc of terrain is drawn for the ground
                // round it, not for a table three units up.
                if (p.kind !== 'rough' || p.stands) return false;
                if (Math.abs(p.sx || 0) + Math.abs(p.sz || 0) > HUMMOCK.tilt) return false;
                // The row's tilt is not the only slope already there: a hole's
                // own landforms run through its rough, and a hummock on the
                // flank of a massif adds to the massif.
                if (P.slopeAt(p, x, z) + HUMMOCK.grad > G3.CONFIG.HOLD.rough * 0.95) return false;
                any = true;
            }
            return any;
        }
        function roughDisc(x, z, R) {
            if (!rough(x, z)) return false;
            for (var k = 0; k < 16; k++) {
                var t = k / 16 * Math.PI * 2;
                if (!rough(x + Math.cos(t) * R, z + Math.sin(t) * R)) return false;
                if (!rough(x + Math.cos(t) * R * 0.55, z + Math.sin(t) * R * 0.55)) return false;
            }
            return true;
        }

        while (made.length < want && tries-- > 0) {
            r = HUMMOCK.r + (HUMMOCK.rMax - HUMMOCK.r) * rnd();
            cx = ax + aw * rnd();
            cz = az + ad * rnd();
            if (Math.hypot(cx - h.tee.x, cz - h.tee.z) < r + TEE_FLAT + 1) continue;
            if (Math.hypot(cx - h.cup.x, cz - h.cup.z) < r + CUP_FLAT + 1) continue;
            for (i = 0, ok = true; i < made.length && ok; i++) {
                if (Math.hypot(cx - made[i].cx, cz - made[i].cz) < (r + made[i].r) * 0.7) ok = false;
            }
            if (!ok || !roughDisc(cx, cz, r + HUMMOCK.clear)) continue;
            a = HUMMOCK.grad * 2 * r / Math.PI * (0.55 + 0.45 * rnd());
            var m = hill(cx, cz, r, rnd() < 0.35 ? -a : a);
            m.hummock = true;           // for the tests, which measure these alone
            made.push(m);
        }

        // Onto every piece of ground a hummock can reach — and that reach
        // includes how far a mown edge can carry a pad past its own cell.
        for (q = 0; q < ground.length; q++) {
            if (ground[q].stands) continue;
            var p = ground[q], x0 = p.west ? p.west.lo : p.x, x1 = p.east ? p.east.hi : p.x + p.w;
            var mine = made.filter(function (m) {
                var dx = Math.max(x0 - m.cx, 0, m.cx - x1), dz = Math.max(p.z - m.cz, 0, m.cz - p.z - p.d);
                return dx * dx + dz * dz < m.r * m.r;
            });
            if (mine.length) p.bumps = (p.bumps || []).concat(mine);
        }
        h.hummocks = made.length;
    }

    /* ── the dressing ───────────────────────────────────────────────────

       A golf course is full of small things that are not the hole: the
       markers either side of the tee, the rake somebody left by the bunker, a
       ball washer and a bin by the tee and a cart parked behind it, flowers in
       the rough and scrub out in the country past the stakes. None of it
       matters to the ball and all of it says somebody looks after this
       place.

       Every open hole is dressed here from a seed made of its name, after it
       is built — so the tee markers stand either side of where the tee ended
       up and the flowers grow on the ground the hummocks made. It is a list of
       its own (`h.dressing`) rather than more `decor`, because decor is
       authored and this is not: the editor shows what somebody placed, and
       this is regenerated from the hole every time it is built.

       Nothing in it is solid, so nothing in it may stand where a ball is
       played *through* something you can see. Flowers stand in the rough a
       ball is already in trouble in, tee markers beside the tee rather than in
       front of it, and a rake lies on the grass outside the sand. Anything
       with real height to it stands either behind the tee — nobody plays a
       stroke backwards — or out of bounds, where the ball has already cost
       you a stroke by being there. Distance plates let into the fairway were
       tried and left out for the same reason: they lie on the line of play,
       which is exactly where the ball would roll through them. `tests.html`
       holds every item to these rules. */
    var DRESS = { flowers: 0.0045, shrubs: 0.009 };

    function dress(h) {
        var P = G3.physics, out = [], rnd = seeded(nameSeed(h.name) ^ 0x6a09e667);
        var tee = h.tee, cup = h.cup, f = h.fence, i, k, x, z, r, ok, t;
        var dx = cup.x - tee.x, dz = cup.z - tee.z, L = Math.hypot(dx, dz) || 1;
        var ux = dx / L, uz = dz / L, px = uz, pz = -ux;

        // What the ground is made of here, or null off it or in the water.
        function kindAt(qx, qz) {
            if (P.waterAt(h, qx, qz)) return null;
            var g = P.surfaceTop(h, qx, qz);
            // Ground that is out wherever it is (Redstone's floor and its
            // bare rock) grows nothing and has nothing parked on it.
            return g ? (g.pad.oob ? 'oob' : g.pad.kind) : null;
        }
        function standOn(qx, qz) { var k = kindAt(qx, qz); return !!k && k !== 'oob'; }
        function nearWall(qx, qz, m) {
            for (var w = 0; w < h.walls.length; w++) {
                var wl = h.walls[w];
                if (qx > wl.x - m && qx < wl.x + wl.w + m && qz > wl.z - m && qz < wl.z + wl.d + m) return true;
            }
            return false;
        }
        function clearOfDecor(qx, qz, m) {
            for (var q = 0; q < h.decor.length; q++) {
                if (Math.hypot(h.decor[q].x - qx, h.decor[q].z - qz) < m) return false;
            }
            return true;
        }
        function item(kind, qx, qz, o) {
            var it = { kind: kind, x: qx, z: qz, yaw: 0, variant: 0 }, key;
            for (key in o || {}) it[key] = o[key];
            out.push(it);
            return it;
        }
        // Every sample round a disc lands on one of the kinds allowed.
        function discOf(qx, qz, rr, kinds) {
            if (kinds.indexOf(kindAt(qx, qz)) < 0) return false;
            for (var a = 0; a < 10; a++) {
                var b = a / 10 * Math.PI * 2;
                if (kinds.indexOf(kindAt(qx + Math.cos(b) * rr, qz + Math.sin(b) * rr)) < 0) return false;
            }
            return true;
        }

        /* The tee: a marker either side of it, a little forward, in one of
           the three colours a set of tees comes in. */
        var box = Math.floor(rnd() * 3);
        for (k = -1; k <= 1; k += 2) {
            x = tee.x + px * 1.5 * k + ux * 0.35;
            z = tee.z + pz * 1.5 * k + uz * 0.35;
            if (standOn(x, z)) item('teemarker', x, z, { variant: box });
        }
        // …and a ball washer and a bin behind it, off to one side.
        var side = rnd() < 0.5 ? -1 : 1;
        x = tee.x - ux * 1.9 + px * 2.7 * side;
        z = tee.z - uz * 1.9 + pz * 2.7 * side;
        if (standOn(x, z) && clearOfDecor(x, z, 1.8) && !nearWall(x, z, 0.4)) {
            item('washer', x, z, { yaw: Math.atan2(ux, uz) });
            x += px * 0.75 * side - ux * 0.3;
            z += pz * 0.75 * side - uz * 0.3;
            if (standOn(x, z)) item('bin', x, z);
        }

        // …and a cart parked further back on the other side, facing up the
        // hole, wherever there is level ground and nothing growing there.
        x = tee.x - ux * 4.6 - px * 3.2 * side;
        z = tee.z - uz * 4.6 - pz * 3.2 * side;
        if (standOn(x, z) && clearOfDecor(x, z, 2.6) && !nearWall(x, z, 1.4)) {
            var cg = P.surfaceTop(h, x, z);
            if (cg && P.slopeAt(cg.pad, x, z) < 0.12) {
                item('cart', x, z, { yaw: Math.atan2(ux, uz) + (rnd() - 0.5) * 0.6, variant: Math.floor(rnd() * 2) });
            }
        }

        /* A rake by every bunker, on the grass beyond its rim on the far side
           from the tee, lying roughly along the edge — which is where they
           end up. */
        for (i = 0; i < h.pads.length; i++) {
            var b = h.pads[i];
            if (b.kind !== 'sand' || !b.r) continue;
            var bx = b.x + b.w / 2, bz = b.z + b.d / 2;
            var th = Math.atan2(bz - tee.z, bx - tee.x) + (rnd() - 0.5) * 1.6;
            var rr = P.padRadius(b, th) + 0.55;
            x = bx + Math.cos(th) * rr;
            z = bz + Math.sin(th) * rr;
            k = kindAt(x, z);
            if (k === 'rough' || k === 'fairway') {
                item('rake', x, z, { yaw: -th + (rnd() - 0.5) * 0.5, variant: rnd() < 0.5 ? 0 : 1 });
            }
        }

        if (!f) return out;
        var area = f.w * f.d;

        /* Flowers in the rough: patches, each a seeded clump, kept off the
           fairway's edge, out of the trees, and away from where you stand to
           play. */
        var want = Math.max(6, Math.min(16, Math.round(area * DRESS.flowers)));
        for (t = 0, k = 0; k < want && t < want * 30; t++) {
            r = 0.7 + rnd() * 0.9;
            x = f.x - 3 + (f.w + 6) * rnd();
            z = f.z - 3 + (f.d + 6) * rnd();
            if (Math.hypot(x - tee.x, z - tee.z) < 3.5 || Math.hypot(x - cup.x, z - cup.z) < 5) continue;
            if (!discOf(x, z, r + 0.6, ['rough']) || nearWall(x, z, r + 0.3)) continue;
            item('flowers', x, z, { r: r, variant: Math.floor(rnd() * 3), seed: Math.floor(rnd() * 1e6) });
            k++;
        }

        /* Scrub, out in the country past the stakes: the one thing in here
           with any height to it, so the one thing kept entirely out of
           bounds. */
        want = Math.max(8, Math.min(22, Math.round(area * DRESS.shrubs)));
        for (t = 0, k = 0; k < want && t < want * 40; t++) {
            r = 0.45 + rnd() * 0.55;
            x = f.x - 8 + (f.w + 16) * rnd();
            z = f.z - 8 + (f.d + 16) * rnd();
            for (i = 0, ok = true; i < 9 && ok; i++) {
                var sa = i / 8 * Math.PI * 2, sr = i ? r + 0.4 : 0;
                if (!P.outOfBounds(h, x + Math.cos(sa) * sr, z + Math.sin(sa) * sr)) ok = false;
                if (!kindAt(x + Math.cos(sa) * sr, z + Math.sin(sa) * sr)) ok = false;
            }
            if (!ok || nearWall(x, z, r)) continue;
            item('shrub', x, z, { r: r, variant: Math.floor(rnd() * 3), seed: Math.floor(rnd() * 1e6) });
            k++;
        }
        return out;
    }

    function build(h) {
        var P = G3.physics, i;
        h.water = h.water || [];
        h.decor = (h.decor || []).slice();

        /* Bunkers, and — on a hole that asks for it — relief, before anything
           is derived from the ground.

           A drawn hole is laid flat. It used to be the other way round: every
           mini golf lane got `contour`'s gentle humps off a seed made from its
           name, and what that bought was light and shade across the grass at
           the price of a putt that wanders for no reason the hole can give. A
           mini golf lane is a carpet; the obstacles are the point, and a
           green that breaks is one more thing to read that nobody built. So
           undulation is something a hole says it wants, with `rolling: true`,
           and the reason is written beside the word — see the few that do.

           The long game is unaffected: every one of its holes is `open` and
           `shaped`, and gets its country from `shape`, `moor` and the
           hummocks below rather than from here. `shaped: true` on a drawn hole
           opts out for the same reason — it has a field of its own, and
           running this over the top of it would be two authors arguing about
           the same ground.

           Bunkers keep their dish whatever the hole says: `scoop` works inside
           one pad, has no opinion about the country round it, and a bunker
           without a floor reads as a patch of the wrong colour (see SCOOP). */
        if (!h.open && !h.shaped) {
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
            if (h.rolling) contour(h.pads, {
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

        if (h.open && h.shaped && !h.calm) hummocks(h);

        /* An open hole is not enclosed — that is what open means. There is no
           edge for `enclose` to find a rail for anyway: the ground runs past
           the fog in every direction, and what keeps the ball on the course is
           `fence`, a line you are only punished for stopping beyond. */
        if (!h.open) roundCorners(h);
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
           putter (game.syncLie) — and it is a property of the ground rather
           than of the course it happens to be filed under, so it is read off
           the pads rather than written on each hole by hand. */
        h.longGame = h.pads.some(function (p) {
            return p.kind === 'fairway' || p.kind === 'rough';
        });

        var t = P.surfaceTop(h, h.tee.x, h.tee.z);
        var c = P.surfaceTop(h, h.cup.x, h.cup.z);
        h.tee.y = t ? t.y : 0;
        h.cup.y = c ? c.y : 0;

        // The long game gets dressed once it is finished being built: what is
        // laid out depends on where the ground, the trees and the cup ended up.
        // Not on a hole that is not a place (Challenge mode's `bare`): a
        // boulder and a heron have no business in a grid world.
        if (h.open && !h.bare) h.dressing = dress(h);

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

    /* ── mini golf, the first of three: Seaside Green ─────────────────────

       The first six holes anybody plays, and they are in the order they are in
       for one reason: each is harder than the one before it. That is the shape
       every course in this file is written to — a hole that introduces a thing,
       a hole or two that develops it, and a sixth that asks for all of it at
       once — and it is why the sixth hole here is a jetty with a bend in it
       and the first is a lane with a rail across the corner of it that turns
       the ball for you.

       Difficulty is not one number. On this course it is added a piece at a
       time and each piece is a different kind of trouble: an angle that does
       the turning, ground that does it, a gate that moves, water that costs
       you a stroke outright, a lane that runs away from you, and finally a
       plank over the sea with a turn in the middle of it.

       **Every hole has two ways to play it.** Two putts that cannot go wrong,
       and one line that can drop for an ace if you are brave with it: off the
       angle, shaving the corner, past the gate, over the bridge, across the
       bay, down the whole jetty in one. A perfect player takes the ace every
       time, which is why the bot's card here is nearly all ones; a person
       takes it when they fancy it, and the safe two is always there.

       **The bag is a putter and a mallet** — mini golf's own bag now, for
       every mini course (CONFIG.MINI_BAG), and this course is where it was
       worked out — with the pitch added on the two holes where flying is the
       point. This is mini golf, and the long game's bag made it something else: the driver at a third of a swing is a putt with
       twenty units of reach, and it was the club the bot holed The Bend and
       The Zigzag with. The putter alone cannot be the answer either — it runs
       eight units at full, and nothing on a thirteen-unit lane can be holed
       in one with it — so the mallet is the risky club and the putter the
       safe one, and the holes are sized to that: every ace line here is
       inside what a mallet reaches after the rail it uses. */

    var MINI_LOFT = ['putter', 'mallet', 'chipper'];

    var seaside = [
        build({
            /* The first hole anybody plays, and it is a bounce hole: one lane,
               one baffle, and a rail across the far corner set at forty-five
               degrees, which turns a ball running north into one running east
               and puts it on the pin.

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

               Eleven and a half long rather than thirteen, and that is the
               bag: the ace is the mallet up the open side and off the angle,
               and at thirteen the bank took enough out of the ball that it
               died short of the pin. The safe way is the putter twice — up the
               open side, and then across.

               An angled wall standing still was Pinball Parlour's invention
               and this is the other thing it is good for. There a bank is a
               slingshot that throws the ball somewhere neither of you chose;
               here it is a mirror, aimed on purpose, which is the friendliest
               use an angle has. */
            name: 'Sea Legs', par: 3,
            blurb: 'Up the open side and off the angle — the corner turns it for you.',
            pads: [pad(0, 0, 6, 11.5)],
            extra: [
                // The baffle: in from the east rail, the west side left open.
                wall(2.3, 5.65, 3.7, 0.3, 0.55, { base: -0.1 }),
                /* The kicker, across the far corner. Long enough that both
                   ends bury themselves in the rails it meets, or the triangle
                   behind it would be a pocket a ball could find its way into
                   and a corner nobody could play out of. */
                bank(1, 10.4, 3.6, -Math.PI / 4, { t: 0.3, h: 0.55 })
            ],
            tee: { x: 1.5, z: 1.5 }, cup: { x: 4.4, z: 10.5 },
            decor: [
                sign(0.4, 0.6, { yaw: 0.6 }),
                buoy(-3.5, 6.8),
                boat(-3.8, 3.2, { yaw: 0.8 }),
                piling(7.8, 4.0),
                boat(8.4, 9.0, { yaw: -0.4 })
            ]
        }),
        build({
            /* A corner, and the first ground on the course that is *for*
               something. The top leg is a slipway: it falls away from the
               corner towards the cup, about a twentieth, so a ball that gets
               round the bend at any pace at all is carried on down to the pin.
               That is the whole of the help, and it is enough to change how
               the hole is played — the job is no longer to judge the weight
               all the way to the flag, it is to get the ball onto the slope.

               The slipway runs *along* x and the corner square stays flat,
               because the two share a seam down the corner's east edge and
               they only meet without a step where the fall runs across that
               seam rather than along it (the same rule as the Horseshoe's
               lean). The bottom leg meets the flat corner on a level edge, so
               it stays flat too.

               The safe two is a putt into the corner and a putt down the
               slope. The ace is the narrow side: a line that shaves the inside
               corner of the bend, onto the slipway and down it — the putter
               will do it, and so will the mallet off the outside rail. Clip
               the corner and you are back where you started. */
            name: 'The Bend', par: 3,
            blurb: 'Turn at the top and the slipway does the rest. Shave the corner if you dare.',
            pads: [
                pad(0, 0, 4.5, 7),
                pad(0, 7, 4.5, 4.5),
                pad(4.5, 7, 6.5, 4.5, 0, 'green', -0.06, 0)
            ],
            tee: { x: 2.25, z: 1.5 }, cup: { x: 10.2, z: 9.25 },
            decor: [
                buoy(6.5, 3.8, { variant: 1 }),
                piling(-1.6, 5.5),
                boat(-3.2, 3.0, { yaw: 0.6 }),
                // A dinghy drawn up at the foot of the slipway.
                boat(12.7, 9.0, { yaw: 1.5 }),
                sailboat(13.5, 4.5, { yaw: -1.2 })
            ]
        }),
        build({
            /* The first thing on the game that moves, and the slowest: a gate
               that drifts across the top of the lane about once every nine
               seconds and never shuts it. Two units long in a lane six wide,
               so there is always room past it on one side or the other — it is
               a preview of the crazy courses, not a test of timing, and
               waiting for it costs nothing but a moment.

               It replaced The Zigzag, two bars of beach with the gap at
               opposite ends, and keeps one of them: a bar of sand across the
               lane with the gap at the east end. The safe two is plain — a
               putt up through the gap, and a putt past the gate when it is out
               of the way.

               The ace used to be the line at the flag, timed past the gate,
               and that made it a hole with no question in it: a mallet struck
               straight at the pin dropped at the right moment (README → "The
               hole lab"). So the tee and the pin have both moved, and the
               sand does the refusing. The tee stands in line with the end of
               the bar and the pin a little west of that line, right behind
               the gate's track, so the shot at the flag crosses the whole
               depth of the sand — two and a half units of it — and a full
               mallet comes out the other side at a walking pace and stops
               short of the gate's track. (It was two until v1.126.0, when the
               mallet got stronger and a full one ran through two.) Nothing on the line was added to stop it; it is
               the beach that was always there, and the flag now stands where
               the beach is in the way.

               The ace is a bank. Aim up and to the right, at the east rail
               where it runs past the gap; the rail turns the ball back out
               through the middle of the gap, and it runs on across the
               gate's track to the pin. The rail takes some of the angle off
               the way back, so the line is several degrees wide and wants
               the top third of the dial — a line and a weight a person can
               find again. And a moment: the gate drifts across right in
               front of the flag, and the bank only gets past it while the
               gate is down at the west end of its run, so it is the first
               hole on the game where the bold shot waits for the clock and
               the safe one does not have to. */
            name: 'Harbour Gate', par: 3,
            blurb: 'Through the gap in the beach, then past the gate. It drifts; it never shuts.',
            pads: [
                pad(0, 0, 6, 4),
                pad(0, 4, 4, 2.6, 0, 'sand'), pad(4, 4, 2, 2.6),
                pad(0, 6.6, 6, 5.9)
            ],
            extra: [slider(1.6, 8.6, 2.0, 0.4, { amp: 1.5, speed: 0.7 })],
            tee: { x: 4, z: 2.4 }, cup: { x: 3.1, z: 9.6 },
            decor: [
                piling(-1.8, 5.0),
                piling(7.8, 7.0),
                buoy(7.5, 3.0),
                buoy(-3.2, 10.0),
                boat(-4.5, 3.0, { yaw: 0.8 })
            ]
        }),
        build({
            /* Water, and the first time the bag has anything that flies in
               it. The tide is out of the bay between the tee and the far
               green, all but one channel: an inlet that runs on up the
               middle of the far green, between a lawn on the west and the
               bridge's landing on the east, and stops just short of the flag.
               So the far green goes round the head of the inlet, and it is
               set off to the west of the tee — a lawn wider than the tee box,
               come down to the water where a pitch can reach it.

               It was a rectangle with a band of water straight across it and
               the pin straight over the water from the tee, and the pitch at
               the flag dropped nine times out of ten: the short way and the
               ace were the same shot (README → "The hole lab"). The inlet is
               the fix. A pitch carries about eight units from this tee and
               the inlet runs on for nearly eleven, so a pitch at the flag
               comes down in the channel, every weight of it, and costs a
               stroke. The shot at the flag along the ground is in the bay
               before it has started.

               Three ways round it, then:

               - **The bridge, which is the safe way.** A putt up the plank
                 with the rail on the right, and a putt round the head of the
                 inlet to the pin. The landing has the inlet on its inside for
                 as long as the bridge does, so even the safe way is a putt
                 with water beside it — but a slow one is never in.
               - **Loft, which is the short way.** A pitch over the bay onto
                 the bridge's landing or the lawn, and a putt. It cannot be
                 the ace, because the inlet is between where it lands and the
                 cup.
               - **The mallet, which is the ace.** The idea the old hole had
                 and the one worth keeping: across the bridge and all the way
                 to the cup. Aim up and to the right, onto the plank and into
                 its rail; the rail turns the ball back up the landing, along
                 the edge of the inlet, and round the head of it into the cup.
                 Too much angle and the ball is off the landing into the
                 channel, too little and it runs past the pin on the east —
                 a line a few degrees wide that wants the top of the dial, and
                 water on the side the miss goes. */
            name: 'Low Tide', par: 3, bag: MINI_LOFT,
            blurb: 'The bridge is the safe way. Loft is the short way.',
            pads: [
                pad(0, 0, 5, 5),
                pad(3.5, 5, 1.5, 4, 0, 'wood'),
                pad(-2, 8.5, 3.5, 7.1),
                pad(1.5, 12.4, 2, 3.2),
                pad(3.5, 9, 1.5, 6.6)
            ],
            water: [rect(-2, 5, 3.5, 3.5, -0.55), rect(1.5, 5, 2, 7.4, -0.55)],
            gaps: [shore(rect(-2, 5, 3.5, 3.5)), shore(rect(1.5, 5, 2, 7.4))],
            tee: { x: 2.5, z: 1.5 }, cup: { x: 2.9, z: 14.2 },
            decor: [
                piling(3.2, 5.5, -0.55),
                piling(3.2, 8.5, -0.55),
                piling(3.2, 10.6, -0.55),
                buoy(2.4, 9.4, -0.55),
                buoy(-0.6, 6.6, -0.55),
                boat(-1.6, 2.4, { yaw: 0.7 }),
                buoy(-3.4, 11.0)
            ]
        }),
        build({
            /* The first hole on the course that is not played towards the
               flag. It goes up one leg, across the top and back down the
               other, round a block of ground that is simply not there — and
               the whole of the return leg falls away to the sea wall, so the
               shot down it is aimed at the inside rail and allowed to drift.

               The cup is by the sea wall too, at the foot of the lean, which
               is what makes the lean worth having: everything on that leg
               ends up against the wall, and so does the pin. Two routes to it.
               Round, which is long and cannot go wrong; or a pitch across the
               bay that lands on the cup's line, anywhere across the leg, and
               lets the slope roll it the rest of the way — that one is the
               ace, and the price of a short one is the sea.

               The lean has to be along x rather than along z, and that is not
               a preference: the return leg shares its whole western edge with
               the top of the horseshoe, and two pads only meet without a step
               where the tilt runs *along* the seam rather than across it.
               Anything else and `enclose` finds a cliff there and fences the
               corner off. */
            name: 'The Horseshoe', par: 4, bag: MINI_LOFT,
            blurb: 'Round the long way, or over the bay. It all leans to the sea wall, and so does the cup.',
            pads: [
                pad(0, 0, 4.5, 12),
                pad(4.5, 8, 4, 4),
                pad(8.5, 0, 4.5, 12, 0, 'green', -0.09, 0)
            ],
            tee: { x: 2.25, z: 1.5 }, cup: { x: 12.2, z: 2.4 },
            decor: [
                sailboat(6.5, 3.5, { yaw: 0.5 }),
                piling(6.5, 6.5),
                buoy(6.5, 1.0)
            ]
        }),
        build({
            /* A plank over the shallows with a kink in it, and no rail on any
               of it. Nothing flies here — the bag is the putter and the mallet
               again — so the jetty is the only road, and the hole is nerve:
               the safe way is a putt along each plank in turn. The three
               planks overlap by a whisker on one line down the middle, and a
               mallet hit dead straight down that line runs the length of the
               jetty onto the far green. Off it by a degree is the sea.

               That line used to end at the pin, which made the bold shot a
               putt at the flag (README → "The hole lab"). The pin is further
               east, at the back of the far green, and the green leans a
               fiftieth to it: the line down the planks is the same line, and
               the lean brings it in, which makes it the long shot it always
               should have been on the last hole of the card — and the first
               plank is a few centimetres wider, so the whisker the planks
               overlap by is a line rather than a fluke. Aimed at the
               flag, a putt is off the first plank before the turn. The lean
               turns about the middle of the last plank, so where the plank
               meets the green there is no lip to trip on. */
            name: 'The Jetty', par: 4,
            blurb: 'A plank over the shallows with a turn in it, and nothing to bounce off but nerve.',
            pads: [
                pad(0, 0, 6, 5.5),
                pad(1.3, 5.5, 2.05, 3.6, 0, 'wood'),
                pad(1.3, 9.1, 3.6, 1.9, 0, 'wood'),
                pad(3, 11, 1.9, 3.2, 0, 'wood'),
                pad(0, 14.2, 6, 5, 0.079, 'green', -0.02, 0)
            ],
            water: [rect(-1, 5.5, 8, 8.7, -0.7)],
            gaps: [shore(rect(-1, 5.5, 8, 8.7), 0.6)],
            tee: { x: 3, z: 2 }, cup: { x: 4.3, z: 18.5 },
            decor: [
                piling(-0.2, 6.2, -0.7),
                piling(5.4, 10.5, -0.7),
                piling(2.2, 13.5, -0.7),
                buoy(-3.5, 9.0, -0.7),
                buoy(8.5, 11.0, -0.7, { variant: 1 }),
                boat(6.8, 7.0, -0.7, { yaw: -0.6 })
            ]
        })
    ];

    /* ── crazy golf, the first of three: Windmill Works ──────────────── */

    var works = [
        build({
            /* The opener, and it still says one thing: there is a gate, it
               has a gap, and the gap does not wait for you. What it used to
               leave out is what to do if you would rather not. A lane with a
               gate across all of it is a hole with one shot on it, and the
               first hole on a timing course is where somebody is going to
               find out they cannot time it.

               So the wall stops short of the east rail and the way round it
               is sand: always open, a metre and more wide, and nothing gets
               through a bunker on the run — a ball sent that way stops in it.
               What it costs is the next shot. The pin is tucked to the west,
               the far side from the bunker, so the way round leaves the
               longest putt on the hole, and played out of sand, whose pace is
               the one nobody can judge. The bot holes it from there; people
               mostly do not. */
            name: 'First Gear', par: 3,
            blurb: 'One gate, one gap, and it does not wait for you. Or go round through the sand, and putt out of it.',
            pads: [
                pad(0, 0, 7.5, 6.8),
                pad(0, 6.8, 5.3, 3),
                pad(5.3, 6.8, 2.2, 3, 0, 'sand'),
                pad(0, 9.8, 7.5, 5)
            ],
            extra: [
                wall(0, 6.8, 1.5, 0.4, 0.6, { base: -0.1 }),
                wall(4.5, 6.8, 0.8, 0.4, 0.6, { base: -0.1 }),
                slider(1.6, 6.8, 1.4, 0.4, { amp: 0.75, speed: 1.6 })
            ],
            tee: { x: 3, z: 1.6 }, cup: { x: 2.4, z: 12.6 },
            decor: [
                sign(4.8, 1.0, { yaw: -0.4 }),
                crate(-1.8, 3.5, { yaw: 0.3 }),
                barrel(-1.8, 2.5),
                crate(7.8, 3.5, { yaw: -0.4 }),
                barrel(7.8, 4.5)
            ]
        }),
        build({
            /* The hole the course is named after, and for eighty releases it
               was a blade on a stick with a windmill stood beside the lane as
               scenery. Now it is the mill: a whitewashed house across the
               whole lane with one door in it, and the sails coming round in
               front of the door, each one sweeping down across it and up
               again (`mill`, physics.millSail).

               A sail straight down shuts the door; a quarter turn later there
               is daylight under two of them, and that is the shot — the oldest
               one in crazy golf. Too early and the sail coming down takes the
               ball across the front of the house; too late and the next one
               does. Through the door is a tunnel the depth of the house, and
               the green behind it falls away a little to the pin, so the pace
               that beats the sails is the pace that finishes near the flag.

               The whole lawn falls to the east as well, a thirtieth, and the
               pin is over on that side behind the brick. With the pin straight
               through the door the putt at the flag was the ace at almost any
               moment (README → "The hole lab"); now a putt at the flag curls
               into the wall, and the shot is still the door — allowed for on
               the way in, and the same fall takes it across to the pin on the
               way out. Both halves of the lawn lean together because a fall
               along the seam between them would be a lip across the door. */
            name: 'The Mill', par: 3,
            blurb: 'The windmill: one door, four sails coming down across it. Wait for the daylight between two of them.',
            pads: [
                pad(0, 0, 7, 10.6, 0, 'green', -0.03, 0),
                pad(0, 10.6, 7, 6.4, 0, 'green', -0.03, -0.02)
            ],
            extra: mill(0, 9, 7, { gap: 1.3, speed: 0.8 }),
            tee: { x: 3.5, z: 1.6 }, cup: { x: 5.4, z: 14.6 },
            decor: [
                crate(-2.0, 3.0),
                barrel(-2.0, 4.0),
                barrel(8.6, 12.4),
                crate(8.8, 13.6, { yaw: 0.4 })
            ]
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
            /* The bar runs the length of the floor, and a ball it catches is
               a ball it carries — back towards the tee, usually, at the pace
               the bar was doing. That was the whole hole, and the whole hole
               was one shot: wait for the bar to turn at the far end and run
               the putt in behind it.

               The lay-by is the second shot. A bay off the west side of the
               floor, halfway up, where the bar does not reach: putt into it,
               watch the bar go by, and run the rest. It is the slow way and
               it is never a three-putt; the run from the tee is a two at best
               and a walk back down the lane at worst. */
            name: 'The Sweeper', par: 3,
            blurb: 'The bar sweeps the length of the floor. Run in behind it, or pull into the lay-by and let it go past.',
            pads: [
                pad(0, 0, 7, 16),
                (function () {
                    // A D-shaped bay, rounded on the outside like a kerb.
                    var p = pad(-2.6, 6, 2.6, 4.2);
                    p.round = { sw: 1.7, nw: 1.7 };
                    return p;
                })()
            ],
            extra: [
                slider(0.4, 7.8, 6.2, 0.4, { axis: 'z', amp: 3.4, speed: 1.1 })
            ],
            tee: { x: 3.5, z: 1.5 }, cup: { x: 5.2, z: 14 }
        }),
        build({
            /* A green with a fence round it and two ways in: the turnstile in
               the front, or the gate at the back. That is the whole hole, and
               it is meant to be read in one look from the tee.

               It used to be north, east, north with a blade in each leg and a
               bunker between them — three things to get past and none of them
               a choice, at twenty-odd units of lane that no ball in the bag
               could cover in one, so nothing on it could be holed from the tee
               whatever you did. Turning was the right instinct and a corridor
               with two spinners in it was not the way to have it.

                 the turnstile  one bar turning on a post in the gate, the
                                only way through the front fence. Time it
                                and you are on the green in one shot, and
                                the ace is on: the lawn leans a
                                thirtieth to the east and the pin is
                                tucked behind the fence on that side, so
                                the line is at the gate rather than the
                                flag and the fall carries the ball across
                                to the cup (The Mill's trick, README → "The
                                hole lab"). A putt at the flag meets the
                                fence. Mistime it and the bar sends you
                                back down the lawn.
                 the way round  the lawn carries on up the east side,
                                past the corner of the fence and round to
                                the gate in the back of it, which is wide
                                and has nothing in it. Nothing here moves
                                and nothing on it can go wrong — and it is
                                too far round to finish in one, so it is a
                                putt to the back and a putt down to the
                                pin. A stroke dearer than the ace, and a
                                stroke cheaper than the bar.

               Fifth on the course because it is the first hole here that hands
               you the choice between the two: First Gear's sand is a way round
               the gate that costs you the putt after it, and this is a way
               round that costs you exactly one shot and gives up the ace. The
               bar is slow and short, so the front door is a fair bet rather
               than a dare; the dare is the last hole's. */
            name: 'Turnstile', par: 3,
            blurb: 'A fenced green with a turnstile in the front. Time the bar and go for it, or walk round to the back gate.',
            pads: [pad(0, 0, 9, 15, 0, 'green', -0.03, 0)],
            extra: [].concat(
                // the front fence, with the gate the turnstile turns in
                aperture(0, 7, 5.4, 0.4, { gap: 2.1, at: 2.2, h: 0.62 }),
                // the east fence, and the back one, with the gate between
                [
                    wall(5.0, 7.4, 0.4, 4.0, 0.62, { base: -0.1 }),
                    wall(0, 11.0, 2.2, 0.4, 0.62, { base: -0.1 })
                ],
                [spinner(2.2, 7.2, 1.8, 0.3, { spin: 1.1 })]
            ),
            tee: { x: 3.0, z: 1.6 }, cup: { x: 4.1, z: 10.2 },
            decor: [
                sign(-1.6, 5.6, { yaw: 0.4 }),
                barrel(-1.8, 8.2),
                crate(-1.8, 9.4, { yaw: 0.3 }),
                crate(10.6, 3.4, { yaw: -0.4 })
            ]
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

    /* ── mini golf, the last of three: Tidewater Reach ────────────────────

       The loft course. Every hole here is built round the one thing a chip can
       do that a putt cannot — leave the ground — and each asks for it in a
       different way: carry it, drop it, land it on top of something, or (once,
       on purpose) resist the urge and keep it down. Almost nothing on this
       course can be reached along the floor, so the bag stops being a choice of
       how hard and becomes a choice of how high. */

    var tidewater = [
        build({
            /* Two stones and a green across a bay, and the green is the one
               thing on the hole you can carry to from the tee — just. It lies
               across the far side, off to the right and end on to you, with
               its near end at the very limit of a full pitch; the pin is
               tucked at that end, a stride behind the front rail with the
               water in front of it. So the hole is read sideways rather than
               down a lane, and every shot on it is a different length.

               The safe way is the big stone, half left and a soft pitch away:
               a fat target with a rail round it to stop against, and from it
               the second comes in along the length of the green, so a pitch
               anywhere near the line stays on and leaves a putt. The little
               stone, half right, sits on the line at the flag: a smaller
               target for the same carry, and from it the pitch is a tap over
               a stride of water. Either way it is two carries and a putt,
               which is par, and nothing on the floor gets off the tee.

               The bold way carries the lot, and the ace is a bank, not a
               pitch at the flag. Nothing stops beside a pin that close to the
               front: a full pitch at the flag either drops in the water or
               lands past the cup and runs on into the back rail, which it
               meets at an angle and leaves for the far end of the green. Aim
               at the near end instead, a few degrees left of the flag, with
               nine tenths of a full swing or more, and the back rail sends it
               back down across the green to the cup. The lab's window is four
               and a half degrees wide across the top tenth of the dial — about
               one shot in seven hundred of the sweep, a skill hole's share and
               the most giving on this course, which is right for the hole that
               opens it. Short of the green is the bay; on the green but off
               the line is a putt for two.

               It used to be the stones and a green out of reach of everything
               from the tee: two carries and a putt, and no ace at all (the lab
               said 0.000%), which was a gap on the first hole of a course
               that is about what a pitch can do. */
            name: 'Stepping Stones', par: 3, needsLoft: true,
            blurb: 'Two stones on the way across: the big one is safe, the little one short. Or carry it all to the near end and let the back rail bring it to the pin.',
            pads: [
                pad(0, 0, 5.5, 4.5),            // the tee
                pad(3.0, 5.3, 3.6, 3.4),        // the big stone, half left from the tee
                pad(-2.4, 5.0, 1.8, 1.8),       // the little one, half right, on the flag's line
                pad(-7, 7.6, 7.8, 2.6)          // the green, end on, off to the right
            ],
            water: [rect(-9, 4.5, 20, 5.7, -0.7)],
            tee: { x: 2.75, z: 1.8 }, cup: { x: -2.3, z: 8.8 },
            decor: [
                palm(-5.8, 11.6),
                palm(3.4, 12.0, { yaw: 2 }),
                buoy(-4.6, 5.6, -0.7),
                sailboat(9.4, 9.4, { yaw: 0.8 }),
                piling(-5.6, 7.0, -0.7),
                piling(8.0, 4.9, -0.7)
            ]
        }),
        build({
            /* Short-sided: the pin is tucked in behind the sand on the right,
               a step from the bank at the back, and the whole of the left of
               the green is open. Two pitches, and neither of them is at the
               flag.

               The safe one is to the fat of the green on the left and two
               putts across. The bold one is to the same green, but to the
               near edge of it, just left of the bunker: the whole green
               leans to the right — a fortieth, the same fall from the left
               rail to the right one, so every seam meets level (README → "A
               lean across a seam is a lip") — and a pitch landed by the sand
               runs on up the green and is carried round behind the bunker to
               the pin. That is the ace: a line a few degrees left of the flag
               and most of a full swing, the slope doing the turning, the way
               The Mill's lawn does. Land it further left and the slope only
               brings it part of the way; land it in the sand and it is a
               bunker shot.

               A pitch straight at the flag is in the sand, because the bunker
               runs as deep as the club carries on that line, and the back of
               the bunker is a revetted face of sleepers — knee-high timber
               along its far edge, the board a real pot bunker has. It is what
               keeps the pin hidden: without it a pitch into the sand kicked up
               off the first bounce, hopped out over the lip and ran into the
               cup, and the hole's ace was the shot at the flag again — which
               is what it had been before this layout, a full pitch at the pin
               (the hole lab had it at 96% of a swing). The bay is narrower
               than it was so the green can be deeper, which is what gives the
               slope room to work.

               It used to be a pitch at the flag over the bay and the bunker,
               with a club-length to stop in before the bank behind the pin
               sent it back — and before that, seven units of lane with the
               sand straight across it. */
            name: 'Short Side', par: 3, needsLoft: true,
            blurb: 'The pin hides behind the sand on the right, and the green leans towards it. Land on the fat of the green, or land it by the sand and let the slope bring it round.',
            pads: [
                pad(1, 0, 6, 4.5),
                pad(-1, 7, 7.2, 6, 0.3, 'green', -0.025, 0),          // the fat of the green
                pad(6.2, 7, 4.8, 3.2, 0.12, 'sand', -0.025, 0),       // the trap, short right
                pad(6.2, 10.2, 4.8, 2.8, 0.12, 'green', -0.025, 0),   // the pin's shelf
                pad(-1, 13, 12, 1.6, 0.3, 'green', -0.025, 0.2)       // the bank behind it all
            ],
            water: [rect(-5, 4.5, 20, 2.5, -0.7)],
            gaps: [shore(rect(1, 4.5, 6, 0.01), 0.4)],
            // the bunker's revetted back face, between the sand and the pin
            extra: [wall(6.2, 9.92, 4.8, 0.28, 0.7, { base: -0.1, kind: 'beam' })],
            tee: { x: 4, z: 1.8 }, cup: { x: 7.2, z: 12.3 },
            decor: [
                palm(-2.4, 14.5),
                palm(12.4, 13.8, { yaw: 1.4 }),
                buoy(-1.5, 6.0, -0.7),
                boat(9.8, 5.6, -0.7, { yaw: -0.5 }),
                piling(0.2, 5.0, -0.7)
            ]
        }),
        build({
            /* A boathouse across the bay with the pin indoors, and two ways in:
               the letterbox or the front door. That is the whole hole, and it
               is what you see from the tee — a timber front with a slot in it
               and the pin framed in the slot, and off to your left a jetty
               running up to a door.

               Post it, and it is the bold line. The slot is two units wide and
               a little over one high, and nothing on the ground reaches it, so
               the question is the weight rather than the line: a pitch at about
               four fifths, or a wedge a touch harder, is in the slot. Short or
               long hits the front, and the front stands in the water — a miss
               is a stroke and the same shot again. Through it, the back rail is
               a unit and a bit behind the pin, so everything that gets in on
               the line comes back off it to the cup or leaves a tap.

               Knock, and it is the safe one. The jetty is a fat target over
               half the water; from it the door is a putt, and through the door
               the pin is six units away across the room, and from all but one
               corner of the jetty there is no straight line through the door to
               it. Three, nearly always, against the two the letterbox nearly
               always gives you.

               The front is four units tall because it has to be. The pitch and
               the wedge both climb past three and a half since the flight got
               its height (v1.111.0), so anything lower is a wall you lob — from
               the front of the tee, or from the jetty over the door — and then
               the letterbox is decoration. Four is out of reach of a full swing
               from anywhere on the hole; a thrash past it sails the house.

               It used to be a pen at the end of an L-shaped lane — four rails
               round the cup, which was a chip over a kerb with nothing to read
               from the tee and nothing to decide. */
            name: 'The Letterbox', par: 3, needsLoft: true,
            blurb: 'The pin is indoors. Post it through the letterbox from the tee, or land on the jetty and knock at the door.',
            pads: [
                pad(0, 0, 5, 3.4),                  // the tee
                pad(-1, 6.4, 10.6, 6),              // the boathouse floor
                pad(6.6, 1.6, 2.4, 4.8)             // the jetty up to the front door
            ],
            water: [rect(-6, -2, 24, 8.41, -0.7)],
            gaps: [{ x: -1.2, z: 6.2, w: 11, d: 0.4 }],     // the front is the front rail
            /* One front in two apertures, because an aperture has one opening:
               the letterbox (sill and lintel — README's "window", laid long and
               low) on the tee's line, and the door (a doorway, with the lintel
               every doorway gets) at the head of the jetty. */
            extra: [].concat(
                aperture(-1, 6.4, 6.4, 0.3, { gap: 2.0, at: 3.5, sill: 0.5, head: 1.7, h: 4.1, kind: 'beam' }),
                aperture(5.4, 6.4, 4.2, 0.3, { gap: 1.4, at: 2.4, sill: 0, head: 1.0, h: 4.1, kind: 'beam' })
            ),
            tee: { x: 2.5, z: 1.6 }, cup: { x: 2.5, z: 11.3 },
            decor: [
                buoy(5.6, 4.6, -0.7),
                piling(10.8, 3.0, -0.7),
                sailboat(13.5, 6.5, { yaw: -0.6 }),
                palm(-2.2, 13.2),
                palm(11.6, 13.4, { yaw: 2.4 })
            ]
        }),
        build({
            /* A long table a metre up, out to the right across the far side
               of the bay, with a timber backboard along its back edge and the
               pin at its far right-hand end, in front of the board.

               The pin is out of reach on its own line. The table runs away
               from the tee as it goes right, so the line at the flag crosses
               the front of it a little further off than a pitch carries up a
               metre: a shot at the flag comes down on the apron in front of
               the table, however hard it is hit, and runs away underneath.
               The near end of the table, on the left, is well within reach.

               So the bold line is a bank. Land on the left half of the table
               with most of a full swing, run on up into the backboard, and it
               hands the ball back down and to the right, along the table to
               the pin — the angle in is the angle out, off a flat board, a
               line you can read from the tee (golf README, "A bank to learn on
               is flat"). Too far left and it comes back down the table short
               of the pin; too far right and it comes off the board too wide
               and runs off the far end of the table.

               The safe way is the one the hole always had: land short on the
               apron to the left and chip up. The board makes that chip kinder
               than it was, because a chip up that runs on is stopped at the
               back of the table instead of rolling off it.

               It used to be a deeper table with the pin in the middle of it,
               and the only ace was a full pitch at the flag that landed on the
               front edge and ran in (the hole lab had it at 96% of a swing). */
            name: 'Tabletop', par: 3, needsLoft: true,
            blurb: 'The green is a metre up, out to the right, with a board along the back. Land on the near end and bank it off the board, or land short and chip.',
            pads: [
                pad(0, 0, 6, 4.5),
                /* The apron runs under the table rather than up to it — pads
                   are allowed to overlap when one is clearly above the other,
                   which is the same rule that makes a bridge work. It turns a
                   missed wedge from a swim into a chip, and it is the reason
                   this hole is hard rather than cruel. The table is out to the
                   right of the apron rather than in the middle of it, so the
                   safe pitch and the brave one are aimed at different places,
                   and the three edges without a board are brinks: short or wide
                   rolls off on to the apron, which is a chip back rather than a
                   kerb that saves you. */
                pad(0.5, 7.5, 12, 8),
                pad(5.6, 8.2, 5.8, 2.6, 0.9)
            ],
            water: [rect(-5, 4.5, 23, 3, -0.7), rect(-5, 7.5, 5.5, 9, -0.7), rect(12.5, 7.5, 6, 9, -0.7)],
            gaps: [
                { x: 0.05, z: 4.1, w: 5.9, d: 0.8 },       // the tee's own shoreline
                brink({ x: 5.6, z: 8.2, w: 5.8, d: 2.6 }, 0.4)   // …and every edge of the table
            ],
            // the backboard: a timber board standing on the back edge of the table
            extra: [wall(5.6, 10.5, 5.8, 0.3, 0.7, { base: 0.8, kind: 'beam' })],
            tee: { x: 3.4, z: 3.2 }, cup: { x: 10.5, z: 9.2 },
            decor: [
                palm(-1.6, 15.4),
                palm(13.2, 16.0, { yaw: 1.8 }),
                buoy(12.8, 5.5, -0.7),
                boat(-2.8, 5.8, -0.7, { yaw: 0.9 })
            ]
        }),
        build({
            /* The joke at the course's expense, now with a corner in it. The
               boardwalk stands across the top leg in front of the pin, too
               tall to fly and high enough off the boards that a putt runs
               under it — so the club that has answered every other hole is the
               wrong one. Round is two or three putts up the leg, through the
               sand and along under the bar. Short is a pitch over the inside
               of the corner that lands in front of the bar and runs on under
               it, and that is the ace. Land it past the bar and it is sitting
               behind the pin with a putt back. */
            name: 'Under the Boardwalk', par: 4,
            bag: ['putter', 'mallet', 'chipper', 'wedge'],   // a lofted route is part of the hole
            blurb: 'Round the corner and under the boardwalk. Pitch the corner if you like — but land it short and let it run.',
            pads: [
                pad(0, 0, 5, 4.4),
                pad(0, 4.4, 5, 1.8, 0, 'sand'),
                pad(0, 6.2, 5, 5.8),
                pad(5, 7, 10, 5)
            ],
            water: [rect(5, -2, 12, 9, -0.7)],
            /* The bar stops short of the rails on both sides. Partly so there
               is a second way through for anyone who would rather thread a
               gap than trust the run-out, and partly for the camera: a bar
               this tall spanning the whole lane hides the flag behind it. */
            extra: beam(10.6, 7.6, 0.5, 3.8),
            tee: { x: 2.5, z: 1.6 }, cup: { x: 13.2, z: 9.5 },
            decor: [
                piling(7.5, 3.0, -0.7),
                piling(11.0, 3.0, -0.7),
                buoy(9.2, 5.0, -0.7, { variant: 1 }),
                palm(-1.8, 9.6),
                palm(16.4, 12.4, { yaw: 1.1 })
            ]
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

    /* ── mini golf, the second of three: Quarry Ridge ─────────────────────

       Height, both ways: ground that is missing and ground that is in the
       way. It was two courses — Quarry Ridge, ramps and ledges with a long way
       down, and Highland Steps, walls and banks to fly or throw the ball at —
       and they were teaching the same lesson from either side, so the best
       six of their twelve holes are one card now (v1.122.0). The six that
       went were the straight lanes the hole lab had no ace on (Step Up,
       Halfpipe, The Gorge, Two Roads, Crown) and Stairway, whose ace was a
       chip at the flag.

       The order is the climb: a bank that hands the ball back (The Backboard),
       a drop with a backboard of its own (The Drop), a quarter-pipe that turns
       what climbs it (Switchback), a wall only the chipper goes over (Over the
       Top), a road banked round a bend over the pool (The Ledge), and the
       cannon to finish. Four of the six are played along the floor; the two
       that want loft say so from the tee. */

    var quarry = [
        build({
            /* The front door is bricked up, so the ball goes round the end of
               the wall and the curved backboard behind the pin hands it back.

               The owner's word for the last version was "a good concept that
               is lacking in execution", and it was: a five-wide tee box
               butted into an eight-wide green, a straight bar of rail across
               the front of the cup, and a half-ring of bank behind it that
               nobody could see from the tee — with the rails at the join of
               the two boxes running past each other in an X (railFor, which
               every inside corner on the mini courses wore until v1.127.0).

               So it is one table now, and no part of it is square (v1.127.0):

               - **The table** is a single slab nine across and thirteen long,
                 its near corners rounded and its far end a half circle. There
                 is no join between the tee and the green to have a corner in.
               - **The door** is a crescent of brick round the front of the
                 cup, two units out from it and finished round at both ends
                 (`arc`'s `drawn`). It closes every line from the tee at the
                 pin, so the putt at the flag dies on it.
               - **The backboard** is the half circle: from a unit and a half
                 out from the cup the green rises to six tenths at the edge,
                 on a ring centred on the cup (`channel`), so whatever climbs it comes
                 back down the slope at the pin — the bank is a central force,
                 and a ball that slows to a stop on it has nothing left to go
                 anywhere but the middle. A stone board stands round the far
                 side of it from the north round to the west.
               - **The lip** is the rest of it. From the north-east round to
                 the east there is no board, and down the whole east side
                 there is no rail (`gaps`, which `cornerRails` honours since
                 v1.127.0): the quarry edge.

               The near end of the door is the bold way: up the east side
               between the brick and the drop, firm, and the bank brings it
               back to the pin. Too firm goes over the lip and off the edge,
               which is a stroke; short of the right weight climbs a little
               way, comes back and stops a short putt from the pin. The far end is the
               safe way, the long way round on the walled side, soft: the bank
               there stops at the north, so a ball round the west end runs out
               on flat green behind the door and leaves a putt back round it.
               The bank used to run the whole half circle, and then the far
               end was a free ace off the west rail as well, with nothing to
               lose for it.

               The hole lab, full sweep: the mallet aces 0.35% of it, a
               tutorial hole's share for the course's first hole, and the
               widest window is the shot — from straight up the table at 88%
               of the mallet to twenty-six degrees out towards the edge at
               half, a weight for every line, with the lip over the top of
               each. No putt at the flag drops. It was 0.075% in three thin
               windows, the widest of them off the east rail. */
            name: 'The Backboard', par: 3,
            blurb: 'The front door is bricked up. Send it round the end of the wall and let the curved bank hand it back.',
            pads: [(function () {
                var p = pad(0, 0, 9, 13);
                p.round = { sw: 2.2, se: 2.2, nw: 4.5, ne: 4.5 };
                p.bumps = [channel(4.5, 8.5, 4.5, 3.0, 0.6, -0.2, 1.9)];
                p.res = 0.45;
                return p;
            })()],
            gaps: [
                rect(-1, 8.48, 11, 10),         // the far curve, which the board stands on instead
                rect(8.8, 2.2, 1, 6.31)         // and the quarry edge down the east side
            ],
            extra: arc(4.5, 8.5, 2.0, -2.97, -0.7, { t: 0.4, h: 0.72, drawn: 'mill' })
                .concat(arc(4.5, 8.5, 4.5 + 0.17, 70 * Math.PI / 180, Math.PI,
                    { t: 0.34, base: -0.35, h: 1.55, drawn: 'rock' })),
            tee: { x: 6.2, z: 2.2 }, cup: { x: 4.5, z: 8.5 },
            decor: [
                crate(10.6, 11.6, { yaw: 0.5 }),
                crate(11.3, 10.7, { yaw: -0.2 }),
                barrel(10.2, 12.9),
                barrel(-1.6, 3.2),
                crate(-1.9, 4.4, { yaw: 0.3 }),
                sign(8.3, -0.9, { yaw: -0.5 })
            ]
        }),
        build({
            /* Rolling, and it is the one mini golf hole that is. The drop
               decides whether you get across; the green below decides how
               close you finish, and a flat one would make that a matter of
               pace alone.

               And there is a second way down. Straight off the front of the
               pillar is the short way — over the pool and onto the green, and
               too gentle is a swim. Or down the stair of planks off the east
               side of it, a drop at a time, which cannot put you in the water
               and leaves a long putt back across the green. The pin is on the
               near side, over the pool, so the stair is the long way round.

               A stair rather than a sloped chute because of the rails: a rail
               is a level box as tall as the highest ground it guards, so the
               sides of a chute falling two units came out as one blank wall
               the height of the pillar. A step at a time, each rail is a
               step's height.

               The short way is no longer at the flag. Off the front of the
               pillar straight at the pin was the ace (README → "The hole lab"),
               so a block of quarry stone stands on that line below the pool,
               tall enough that the drop cannot clear it, and the pin is in its
               lee with a bank across the green to the west of it: the drop is
               aimed at the bank, which turns it east along the back of the
               block to the pin. */
            name: 'The Drop', par: 3, rolling: true,
            blurb: 'Over the edge and down — too gentle and you are swimming. Or take the stair down the side, and the long putt.',
            pads: [
                pad(0, 0, 5, 4, 2.4),
                pad(5, 1, 1.6, 2, 1.8, 'wood'),                   // the stair
                pad(6.6, 1, 1.6, 2, 1.2, 'wood'),
                pad(8.2, 1, 1.8, 2, 0.6, 'wood'),
                pad(10, 0, 3.5, 6),
                pad(-1, 6, 14.5, 8)
            ],
            water: [rect(-3, 4, 13, 2, -0.9)],
            /* The pool's edge, and one strip per riser of the stair, each
               short of the stair's sides so its rails stay. */
            gaps: [
                shore(rect(-3, 4, 13, 2), 0.6),
                { x: 4.6, z: 1.05, w: 0.8, d: 1.9 },
                { x: 6.2, z: 1.05, w: 0.8, d: 1.9 },
                { x: 7.8, z: 1.05, w: 0.8, d: 1.9 },
                { x: 9.6, z: 1.05, w: 0.8, d: 1.9 }
            ],
            extra: [
                bank(0.6, 11.0, 3.0, -Math.PI / 4),
                wall(2.7, 8.0, 1.2, 1.2, 1.5, { base: -0.3 })
            ],
            tee: { x: 2.5, z: 1.5 }, cup: { x: 3.6, z: 10.8 }
        }),
        build({
            /* A quarter-pipe across the whole hole, and the shelf on top of
               it. The face is a curve rather than a ramp: flat where it
               leaves the floor and steepening all the way to the lip, so it
               reads as something you send the ball up rather than along, and
               it is wood, so a ball that does not reach the top comes back
               down it to you. It used to be a straight ramp a metre and a
               fifth tall with a banked turn at the top, and the mallet could
               not get over it, let alone round the turn to the pin.

               The flag is up on the shelf over the far right of the face, and
               the face is what decides whether you reach it. Climbing it on a
               slant takes the uphill half of the ball's pace and leaves the
               sideways half alone, so the ball comes over the lip turned
               across the face — and the less it had left, the more it turned.
               Aimed at the flag, the face swings it off the right-hand end of
               the shelf into the pool. Aimed left of it, the weight is the
               whole shot: soft and it rolls back down the face, firm enough
               and it comes over the lip swinging right onto the pin, harder
               and it runs straight on past it and off the back. Every aim up
               the left half of the face has its own weight; none of them is
               a full whack. The safe way is square up the face at the left
               end, onto the shelf short of the pin, and a putt along it.

               The trough is the half-pipe's own profile, laid on its side:
               its spine is the foot of the face, on the pad's south edge, and
               its radius is twice the face's depth, so the pad ends halfway
               up the curve — the steep half, at the lip — and is lifted by
               twice the shelf's height to put that point level with the
               shelf. The back of the shelf and the far end of the face and
               the shelf are brinks over the quarry pool; the rail on the left
               is the only edge up there that is not a swim. */
            name: 'Switchback', par: 3,
            blurb: 'A quarter-pipe up to the shelf, and it turns whatever climbs it on a slant. Too soft rolls back down; too firm is the pool.',
            pads: [
                pad(0, 0, 9, 4),
                (function () {
                    var p = pad(0, 4, 9, 2.2, 1.4, 'wood');      // the face, up to 0.7
                    p.bumps = [trough(-1, 4, 10, 4, 4.4, -1.4)];
                    return p;
                })(),
                pad(0, 6.2, 9, 3.5, 0.7)                         // the shelf
            ],
            water: [rect(-2, 9.7, 14, 3, -0.9), rect(9, 4, 3, 5.7, -0.9)],
            gaps: [
                brink({ x: 0, z: 9.7, w: 9, d: 0 }, 0.4),         // off the back…
                { x: 8.6, z: 4.1, w: 0.8, d: 6 }                  // …and the far end
            ],
            tee: { x: 1.5, z: 1.2 }, cup: { x: 7.2, z: 7.7 }
        }),
        build({
            /* A wall nothing goes round and one club goes over — and the wall
               runs across the lane at a slant, so where you go over it decides
               how much green there is to land on. Over the near end, by the
               pin, there are three units before the sand; over the far end
               there is the whole of the green, and a putt back. It used to be
               square across the lane, which made it the same carry from
               everywhere. */
            name: 'Over the Top', par: 3, needsLoft: true,
            blurb: 'A slanted wall, and one club goes over it. Over the near end is short; over the far end is safe.',
            pads: [
                pad(0, 0, 7, 4),
                pad(0, 4, 7, 8.5, 0, 'green', 0, 0.04),    // climbs gently to the back
                pad(0, 12.5, 7, 2.5, 0, 'sand')             // no reward for over-clubbing it
            ],
            /* Long enough that both ends bury themselves in the rails, so
               there is no way round at either end. */
            extra: [bank(3.5, 6.6, 8.2, Math.atan2(3.2, 7), { t: 0.4, h: 1.15 })],
            tee: { x: 5.2, z: 1.6 }, cup: { x: 1.8, z: 10.6 }
        }),
        build({
            /* A road round the quarry face, banked like a velodrome, and the
               green hanging off the end of the bend over the drop (v1.126.0).

               It used to be four rectangles making two metres of road with
               two right angles in it, every edge a brink except the outside
               of the first corner, which kept its wall so the corner could be
               held. The lab found no ace on it at all, and the owner's
               verdict was the fair one: where is the risk and the reward? A
               right angle with a wall on it is a bank shot or two putts, and
               neither is a decision. So the corners went, and the road is a
               `road` now — a pad laid along a curved centreline
               (physics.laneHas), a straight up the hole and a quarter-turn
               round to the left, with no corner anywhere along it.

               The turn is the hole. Its outside is raised (a `bank`, the
               channel laid along the outer edge) and is a bare lip with the
               quarry pool under it; its inside is a flat gutter with a kerb,
               and the kerb carries on down the straight. So the weight is the
               whole shot, and the three weights do three different things:

               - **soft** — anything the putter has, and the mallet's first
                 half — climbs the bank, runs out of pace and comes back down
                 it into the gutter, where the kerb holds it. Safe, and no
                 nearer than a putt: nothing that slow gets round.
               - **firm** — the mallet at about three fifths — rides the bank
                 high round the bend, and the bank turns it through the
                 quarter it needs on to the green and the pin, which is set
                 where the turned ball arrives.
               - **too firm** is quicker than the bank can turn, and goes
                 straight on over the lip: a stroke, and the shot again.

               The putt at the flag is across the crook of the bend, over the
               pool. And the green itself is a brink all round (`gaps`), so a
               firm ball that gets round and misses the cup is in the water
               behind it as well. It was a par four played in stages; it is a
               par three now, two safe putts or the mallet and nerve, which is
               the shape of every other hole on the card.

               The bank stops short of the end of the turn (`span`) so that
               its rounded end has faded to nothing before the green: the cup
               has to sit on level ground, and an inlaid green has to lie
               flush with the road it is laid over. */
            name: 'The Ledge', par: 3,
            blurb: 'A quarry road banked round the bend. Firm rides the bank to the pin; too firm goes over the lip.',
            pads: [
                road({ x: 2.5, z: 0.2, dir: 0, w: 2.4, y: 1, caps: 'start' }, [
                    ['line', 4, { kerb: 'in' }],
                    ['arc', 3.2, Math.PI / 2, {
                        kerb: 'in', bank: { a: 0.9, lip: 0.5, r: 2.6, span: [0, 0.7] }
                    }],
                    ['line', 0.7, { kerb: 'in' }]
                ]),
                // On a pillar of its own, and laid over the end of the road.
                Object.assign(circle(7.6, 7.4, 1.7, 'green', 1), { stands: true })
            ],
            water: [rect(-1.5, 1.6, 12.8, 9.4, -1.2)],
            gaps: [brink({ x: 5.9, z: 5.7, w: 3.4, d: 3.4 })],
            tee: { x: 2.5, z: 1.4 }, cup: { x: 7.6, z: 7.1 }
        }),
        build({
            /* The finisher, and it is the only hole on the course that asks
               for the shot to be *over*-hit. The ramp stands in the left of the
               tee and the green across the gap runs off to the right, with the
               pin at its far end under a curved rail, so the cannon only gets
               you over: fired straight, the last of it is a putt along the
               green. Fired across at an angle, the rail brings it round to the
               pin. And there is beach behind, so a shot that clears the water
               by four is no better than one that clears it by one.

               The other way over is the plank on the right — a board laid
               across the gap, a putter's width, with no rails on it. That is
               the safe way, if a plank over a quarry pool is anybody's idea of
               safe.

               The pin is round under the rail, not in front of it. Where it
               was, the ramp fired straight at the flag dropped (README → "The
               hole lab"); a unit further round, the only way in is the one
               this hole was built for — across at an angle and round the
               rail. */
            name: 'The Cannon', par: 3,
            blurb: 'Flat out up the ramp and fly the gap, or walk the plank on the right. The green runs away to the pin either way.',
            pads: [
                pad(0, 0, 10, 4),
                pad(0.8, 4, 3.6, 2.5, 0, 'wood', 0, 0.45),
                pad(7.6, 4, 1.2, 5.8, 0, 'wood'),          // the plank
                pad(0, 9.8, 10.5, 5),
                pad(0, 14.8, 10.5, 2.2, 0, 'sand')
            ],
            water: [rect(-3, 4, 16, 5.8, -0.9)],
            gaps: [shore(rect(-3, 4, 16, 5.8), 0.7)],
            extra: arc(7.6, 12, 2.6, -0.15, Math.PI / 2 + 0.3, { h: 0.55 }),
            tee: { x: 3, z: 1.5 }, cup: { x: 9.2, z: 12.2 }
        })
    ];

    /* ── the long game, the first of three: Ashdown Park ──────────────────

       Not mini golf. Six holes of the long game at the same scale as the rest
       of the bag: a driver runs about thirty units off a fairway, twenty-four
       out of rough and more off every bluff, so a par 4 here is fifty to sixty
       units — a drive and an approach — and a par 5 is three shots, which is
       the only definition of par that means anything. The figures and why
       they are what they are: README → "Ashdown Park".

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

       And the stakes are six units further out than that (`widen`), behind a
       wood on each side (`forest`): what a sliced drive meets first on a park
       is trees, and the shot out from among them is the penalty. The old
       ruler-straight treelines are ragged strips of the same trees, and every
       piece of water is a hollow with a shoreline (`burn`, `mere`) where it
       used to be a box.

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
            /* Downhill off a bluff, along the floor of the park, over a burn
               and back up on to a shelf the green sits on. The crest is still
               what the first shot reads off — run the ball over it and it
               gathers speed down the far side — but the burn is what the drive
               is *about*: it lies across the hole exactly where a full one off
               the bluff runs out, so the honest drive is the one throttled to
               stop short of it, and the approach is a carry over moving water
               to a green two units up. */
            var field = [].concat(
                ridge(5, 19, 14, 21, 4.5, 0.30, 4),
                massif(-6, 18, 12, 2.2, 5),
                [hill(19, 61, 2.2, 0.4)]
            );
            var park = commons(0, [
                [{ d: 5, y: 4.0 },      [3.5, rgh], [8, fwy], [9.5, rgh]],
                [{ d: 3, sz: -0.7 },    [21, rgh]],
                [{ d: 6, sz: -0.15 },   [3.5, rgh], [8, fwy], [9.5, rgh]],
                [13,                    [3.5, rgh], [8, fwy], [9.5, rgh]],
                [6,                     [4.5, rgh], [9, fwy], [7.5, rgh]],
                [9,                     [21, rgh]],
                [6,                     [5, rgh], [10, fwy], [6, rgh]],
                [{ d: 6, sz: 0.3 },     [6, rgh], [10, fwy], [5, rgh]],
                [12,                    [6, rgh], [10, fwy], [5, rgh]],
                [4,                     [21, rgh]]
            ]);
            var ground = shape(scoop(park.pads, { seed: 21 }), field);
            /* The burn runs the width of the park in a hollow of its own,
               wandering a unit either way, where it used to be a slot cut out
               of the ground with a sheet of water at the bottom of it. */
            var lobes = burn([[-8.5, 37.8], [2, 36.9], [9, 38.2], [16, 37.1], [29.5, 37.9]], 2.2, 1.1, 5101);
            var lake = pond(ground, lobes);
            var wet = clearOf(lobes);
            return build({
                name: 'Opening Drive', par: 4, long: true, shaped: true, open: true,
                blurb: 'Off the bluff and over the crest — but stop it short of the burn. Then carry it up to the shelf.',
                pads: ground.concat([
                    inlay(ground, 7, 55.5, 1.8, snd, 1.4),
                    inlay(ground, 11, 61, 4.6, grn, 4.0)
                ]),
                fence: widen(park.fence, 6, 6),
                water: [lake],
                extra: [].concat(
                    forest(1.6, 22, 0.9, 8.5, 6, 5103, { gap: 2.2 }),
                    forest(19.6, 23.5, 0.9, 7.5, 5, 5107, { gap: 2.2 }),
                    forest(-3, 38, 2.4, 25, 12, 5109, { gap: 2.4, clear: wet.concat([keep(-2, 10, 5)]) }),
                    forest(24, 40, 2.4, 25, 12, 5113, { gap: 2.4, clear: wet.concat([keep(21.5, 10, 2)]) }),
                    crags(-2, 10, 3.5, 6, 7101, { s: 1.4, h: 1.1 }),
                    [tree(1.6, 3), tree(2.4, 67), tree(19, 67)]
                ),
                tee: { x: 7.5, z: 2.5 }, cup: { x: 11.5, z: 61 },
                decor: [
                    sign(5.5, 2.5, { yaw: 0.2 }),
                    bench(5.2, 4.2, { yaw: 0.3 }),
                    bin(5.2, 5.5),
                    pine(21.5, 10.0, { yaw: 0.7 })
                ]
            });
        })(),
        (function () {
            /* Hell's Half Acre, which is Pine Valley's seventh and the best
               argument in golf against the second shot being a formality: a
               belt of sand twelve units deep lying across the fairway exactly
               where a good drive comes down. Off the bluff a full driver lands
               in it and stays, so the tee shot is a lay-up — three quarters of
               a swing, short of the near lip — and the second is the one that
               carries it. Then a long third to a green with a pond off its
               left shoulder, which is where an approach pulled away from the
               sand on the right finishes. The hollow short of the belt
               gathers the timid drive. */
            var field = [].concat(
                ridge(5, 16, 14, 16, 4.5, 0.28, 4),
                massif(28, 26, 13, 2.4, 5),
                [hill(9, 21, 2.5, -0.36), hill(19.5, 60, 3, 0.45)]
            );
            var park = commons(0, [
                [{ d: 5, y: 3.2 },      [4, rgh], [9, fwy], [9, rgh]],
                [{ d: 4, sz: -0.65 },   [22, rgh]],
                [14,                    [4, rgh], [9, fwy], [9, rgh]],
                [4,                     [4, rgh], [10, fwy], [8, rgh]],
                [14,                    [3, rgh], [16, fwy], [3, rgh]],
                [6,                     [5, rgh], [11, fwy], [6, rgh]],
                [{ d: 8, sz: 0.2 },     [6, rgh], [11, fwy], [5, rgh]],
                [12,                    [6, rgh], [11, fwy], [5, rgh]],
                [5,                     [5, rgh], [12, fwy], [5, rgh]],
                [10,                    [6, rgh], [11, fwy], [5, rgh]],
                [3,                     [22, rgh]]
            ], { e: 18 });
            var ground = shape(scoop(park.pads, { seed: 25 }), field);
            // The pond off the green's left shoulder, reaching out into the
            // park rather than stopping at the property line in a straight edge.
            var lobes = mere(-0.6, 76.6, 4.4, 3.6, 2.0, 5215);
            var lake = pond(ground, lobes);
            var wet = clearOf(lobes);
            return build({
                name: 'Long Meadow', par: 5, long: true, shaped: true, open: true,
                blurb: 'A belt of sand where the drive comes down. Lay up short of it, carry it with the second, and keep left of the pond.',
                /* The belt is one oval twenty units wide rather than a
                   rectangle, and wider than the fairway on purpose: an ellipse
                   gives back its ends, so a belt that only just spanned the
                   mown grass would leave a way through at each edge and the
                   hole's whole argument with it. */
                pads: ground.concat([
                    inlay(ground, 11, 34, 10, snd, 6),
                    inlay(ground, 15.5, 60, 1.8, snd, 2.2),
                    inlay(ground, 11.5, 77, 5.0, grn, 4.0)
                ]),
                fence: widen(park.fence, 6, 6),
                water: [lake],
                extra: [].concat(
                    forest(2, 17.5, 0.9, 8.5, 5, 5201, { gap: 2.2 }),
                    forest(20.3, 19, 0.8, 7, 4, 5203, { gap: 2.2 }),
                    forest(20.3, 47.5, 0.8, 4.5, 3, 5207, { gap: 2.2 }),
                    crags(1.5, 5, 2.4, 4, 7107, { s: 1.2, h: 0.9 }),
                    forest(1.6, 59, 0.9, 7, 4, 5209, { gap: 2.2, clear: wet }),
                    forest(-3, 42, 2.4, 30, 12, 5211, { gap: 2.4, clear: wet.concat([keep(1.5, 5, 4)]) }),
                    forest(25, 45, 2.4, 30, 12, 5213, { gap: 2.4 }),
                    [tree(3, 84), tree(19.5, 84)]
                ),
                tee: { x: 8.5, z: 2.5 }, cup: { x: 11.5, z: 77 }
            });
        })(),
        (function () {
            /* A dogleg that is one. The tee is on a bluff at the east end of
               the property, the fairway runs north and then turns hard left
               along the top of the hole to a green on a shelf, and the inside
               of the corner is a pond behind a line of oaks.

               Three ways to play it. Round the corner: a drive to the turn,
               short of the bunker that waits for the ones that run through it,
               and a long iron across. At the flag: a carry over the oaks and
               the water that leaves a pitch, if it gets there. Or the half-way
               house that is the actual wager — how much of the corner you are
               prepared to take on. */
            var field = [].concat(
                massif(46, 22, 13, 2.3, 5),
                massif(-11, 30, 12, 2.2, 5),
                [hill(5.5, 58.5, 2.4, 0.4)]
            );
            var park = commons(-6, [
                [{ d: 6, y: 3.4 },      [20, rgh], [9, fwy], [5, rgh]],
                [5,                     [20, rgh], [9, fwy], [5, rgh]],
                [{ d: 4, sz: -0.65 },   [34, rgh]],
                [9.5,                   [19, rgh], [11, fwy], [4, rgh]],
                [14.5,                  [19, rgh], [11, fwy], [4, rgh]],
                [4,                     [19, rgh], [11, fwy], [4, rgh]],
                [7,                     [3, rgh], [27, fwy], [4, rgh]],
                [{ d: 3, sz: 0.25 },    [3, rgh], [12, fwy], [19, rgh]],
                [9,                     [2, rgh], [14, fwy], [18, rgh]],
                [4,                     [34, rgh]]
            ]);
            var ground = shape(scoop(park.pads, { seed: 27 }), field);
            // The pond inside the corner, its long side under the oaks.
            var lobes = mere(8.6, 25.8, 4.8, 6.6, 2.0, 5321);
            var lake = pond(ground, lobes);
            var wet = clearOf(lobes);
            return build({
                name: 'The Elbow', par: 4, long: true, shaped: true, open: true,
                blurb: 'Off the bluff and hard left at the top. Go round the corner, or over the oaks and the pond inside it.',
                pads: ground.concat([
                    inlay(ground, 27, 40.5, 1.8, snd, 1.6),
                    inlay(ground, 15, 51.5, 1.4, snd, 1.6),
                    inlay(ground, 9, 51.5, 4.4, grn, 3.6)
                ]),
                fence: widen(park.fence, 6, 6),
                water: [lake],
                extra: [].concat(
                    [tree(17.5, 34.5, { t: 0.9, h: 3 })],
                    forest(17.2, 23.8, 0.7, 8.6, 8, 5301, { gap: 1.9, clear: wet }),
                    forest(1.5, 46, 0.9, 9.5, 5, 5303, { gap: 2.2 }),
                    forest(32.6, 27, 0.8, 16, 7, 5307, { gap: 2.2 }),
                    forest(-3, 38, 2.4, 20, 10, 5309, { gap: 2.4, clear: wet }),
                    forest(37, 26, 2.4, 26, 10, 5311, { gap: 2.4, clear: [keep(30, 50, 4)] }),
                    crags(30, 50, 3, 5, 7113, { s: 1.3, h: 1.0 })
                ),
                tee: { x: 24.5, z: -3.5 }, cup: { x: 9, z: 51.5 }
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
                ridge(4.5, 27, 13.5, 27, 2.0, 0.45, 5),
                massif(-9, 20, 11, 2.1, 5),
                [hill(1.6, 22.5, 1.6, -0.23)]
            );
            var park = commons(0, [
                [{ d: 3.5, y: 4.2 },    [3, rgh], [9, fwy], [6, rgh]],
                [{ d: 2, sz: -1.35 },   [18, rgh]],
                [8,                     [2.5, rgh], [7.5, rgh], [2.5, fwy], [5.5, rgh]],
                [{ d: 2, sz: 0.24 },    [2.5, rgh], [13, fwy], [2.5, rgh]],
                [3,                     [4.1, rgh], [11.4, fwy], [2.5, rgh]],
                [6.5,                   [2.5, rgh], [10, fwy], [5.5, rgh]],
                [4,                     [18, rgh]]
            ], { w: 22 });
            var ground = shape(scoop(park.pads, { seed: 23 }), field);
            /* The pond is three hollows in the floor of the dell rather than a
               rectangle cut out of it — a blob with a bay on the near side and
               a long tail towards the green. */
            var lake = pond(ground, [[6.2, 9.4, 3.3, 1.15], [4.3, 11.0, 2.3, 0.95], [8.0, 7.4, 1.8, 0.8]]);
            return build({
                name: 'Over the Water', par: 3, long: true, shaped: true, open: true,
                blurb: 'Off a high bluff and over eight units of pond to a round green on a shelf. The dry way is down the right.',
                pads: ground.concat([
                    inlay(ground, 2.8, 17.5, 1.5, snd, 1.4),
                    inlay(ground, 14, 21.8, 1.6, snd, 2.5),
                    circle(7.5, 20.5, 3.6, grn, 1.98)
                ]),
                fence: widen(park.fence, 5, 5),
                water: [lake],
                extra: [].concat(
                    forest(16.6, 10, 0.7, 6, 4, 5401, { gap: 2.2 }),
                    forest(-3, 16, 2, 10, 7, 5403, { gap: 2.4, clear: [keep(-5, 18, 4.5)] }),
                    forest(21.5, 15, 2, 11, 7, 5407, { gap: 2.4 }),
                    crags(-5, 18, 3.5, 5, 7119, { s: 1.4, h: 1.1 }),
                    [tree(1.2, 3)]
                ),
                tee: { x: 10.5, z: 1.75 }, cup: { x: 7.5, z: 21 }
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
                fence: widen(park.fence, 5, 5),
                extra: [].concat(
                    forest(1.4, 17.5, 0.7, 8.5, 5, 5501, { gap: 2.2, clear: [keep(1.2, 15, 3.6)] }),
                    forest(18.6, 17.5, 0.7, 8.5, 5, 5503, { gap: 2.2, clear: [keep(18.8, 22, 3.6)] }),
                    forest(-2.5, 18, 2, 10, 7, 5507, { gap: 2.4, clear: [keep(1.2, 15, 4.6)] }),
                    forest(22.5, 18, 2, 10, 7, 5509, { gap: 2.4, clear: [keep(18.8, 22, 4.4)] }),
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
                [hill(6, 27, 1.9, -0.22), hill(6.5, 34, 2.2, 0.35)]
            );
            /* The tee box is four and a half units deeper than it was
               built, and the tee the same distance further back: a livelier
               landing (CONFIG.LAND_FIRM) ran the drive on up the climb to the
               green instead of stopping at the foot of it, which is where the
               second shot lives. `mow` pins the seed the original rows gave,
               so the fairway's edge is the same edge; the rough's hummocks
               are dealt again, because they keep clear of the tee. */
            var park = commons(-10.5, [
                [{ d: 10.5, y: 1.6 },   [4, rgh], [9, fwy], [9, rgh]],
                [5,                     [4, rgh], [9, fwy], [9, rgh]],
                [{ d: 4, sz: -0.09 },   [4, rgh], [9, fwy], [9, rgh]],
                [{ d: 4, sz: -0.09 },   [4, rgh], [8, fwy], [10, rgh]],
                [{ d: 4, sz: -0.09 },   [4, rgh], [7, fwy], [11, rgh]],
                [{ d: 4, sz: -0.09 },   [4, rgh], [6, fwy], [12, rgh]],
                [{ d: 4, sz: -0.09 },   [4, rgh], [7, fwy], [11, rgh]],
                [4,  [5, rgh], [10, fwy], [7, rgh]],
                [10, [5, rgh], [11, fwy], [6, rgh]],
                [{ d: 4, sz: 0.15 }, [6, rgh], [11, fwy], [5, rgh]],
                [9,  [5, rgh], [12, fwy], [5, rgh]],
                [5,  [22, rgh]]
            ], { e: 5, w: 24, mow: 13344 });
            /* The lake is three pools stepping down the fall, each in its own
               hollow and at its own level — one sheet of water cannot lie on
               ground that drops two units along it, which is why it used to
               be five boxes in a staircase. Every pool stays a unit or more
               off the mown line, so the shoreline is in the rough. */
            var ground = shape(tilt(scoop(park.pads, { seed: 29 }), -0.055, 0, 22, 0), field);
            var pools = [
                mere(19.0, 8.0, 4.4, 2.4, 3.4, 5611),
                mere(17.8, 15.6, 4.6, 2.4, 3.6, 5613),
                mere(18.4, 22.9, 4.4, 2.4, 3.6, 5617)
            ];
            var lakes = pools.map(function (L) { return pond(ground, L); });
            return build({
                name: 'Homeward', par: 4, long: true, shaped: true, open: true,
                blurb: 'Three pools step down the right and the ground falls into them. Bite off what you dare.',
                pads: ground.concat([
                    inlay(ground, 6.4, 45.6, 1.3, snd, 1.4),
                    inlay(ground, 18.9, 50.5, 1.2, snd, 1.5),
                    inlay(ground, 12.5, 48, 4.8, grn, 3.6)
                ]),
                fence: widen(park.fence, 6, 3),
                water: lakes,
                extra: [].concat(
                    forest(2, 24, 0.9, 16, 9, 5601, { gap: 2.2 }),
                    forest(-3, 26, 2.4, 24, 11, 5603, { gap: 2.4, clear: [keep(1.4, 46, 4)] }),
                    crags(1.4, 46, 3, 5, 7137, { s: 1.3, h: 1.0 }),
                    [tree(21.4, 45.5), tree(21.4, 53.5), tree(23.6, 30.5), tree(24.2, 36)]
                ),
                tee: { x: 8.5, z: -8 }, cup: { x: 12.5, z: 48 }
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
            { clear: flat, r: spec.r, rMax: spec.rMax, grad: spec.grad }));
        // The strips start at z0, or at 0 — a hole lengthened from the tee end
        // starts them further back and every other coordinate stays put.
        var pads = bands(spec.z0 || 0, spec.strips, 0, { mow: spec.seed || 1 }), i, d;
        // One field of humps, shared by every strip on the hole. The height of
        // the ground is a function of where you are and not of which strip you
        // happen to be standing on, so the seams between them are invisible to
        // the ball as well as to the eye — and the mown line can wander across
        // the contours instead of being cut to fit them.
        for (i = 0; i < pads.length; i++) pads[i].bumps = bumps;
        /* No scoop out here: every hazard on this course is an inlay, and an
           inlay is laid into ground that is drawn underneath it (see the note
           in `scoop`). But a bunker does take the dunes, the same rule
           `inlay` keeps: sand lying on the country it was cut into, rather
           than a flat plate laid across the top of it with one edge buried
           wherever a dune's tail runs under. A green does not — it carries
           the cup, and is kept flat instead.

           An inlay is written `[cx, cz, r, kind, rz]` and laid with `inlay`,
           which reads the level off the ground under it: the course is no
           longer all at one height (two of its tees are up in the dunes and
           one green is on a shelf), and a disc told its height by hand is a
           second copy of the height field. */
        var lay = spec.inlays || [], out = [];
        for (i = 0; i < lay.length; i++) {
            d = lay[i];
            if (d.length !== undefined) {
                out.push(inlay(pads, d[0], d[1], d[2], d[3], d[4]));
                continue;
            }
            if (d.kind !== 'green') d.bumps = bumps.slice();
            out.push(d);
        }
        return pads.concat(out);
    }

    /* A row of clearings along a line, for the dune field to stay out of. A
       burn's banks have to stand above its water: a hollow running down to
       the edge of one would sit below the surface and read as a hole in the
       world, so the dunes are kept off the whole length of it. */
    function banks(x0, x1, z, r) {
        var out = [], n = Math.max(1, Math.ceil((x1 - x0) / r)), i;
        for (i = 0; i <= n; i++) out.push(keep(x0 + (x1 - x0) * i / n, z, r));
        return out;
    }

    var whinstone = [
        build({
            /* The opener, and the one hole out here with no water on it — the
               ground and the sand are the whole of it. Three pots sit in the
               middle of the landing ground exactly where a full drive comes
               down, and they split it into two routes: wide to the left of
               them, which leaves the longer approach over the bunker short of
               the green, or narrow down the right between the pots and the
               stakes, which leaves the open line in. The green stands on a
               shelf a unit up at the end, so the approach is an uphill shot
               to a flat table and anything short runs back down the bank. */
            name: 'The Whins', par: 4, open: true,
            blurb: 'Three pots split the landing ground: wide to the left of them, or tight down the stakes for the open line. The green is up on a shelf.',
            pads: moor({
                tee: { x: 31, z: 12 }, seed: 4101, n: 60,
                area: { x: 3, z: 3, w: 56, d: 80 },
                r: 5, rMax: 11, grad: 0.21,
                strips: [
                    [28, [21, rgh], [20, fwy], [21, rgh]],
                    [24, [16, rgh], [28, fwy], [18, rgh]],
                    [{ d: 6, sz: 0.16 }, [20, rgh], [20, fwy], [22, rgh]],
                    [18, [21, rgh], [20, fwy], [21, rgh]],
                    [10, [62, rgh]]
                ],
                flat: [keep(34, 66, 7.5), keep(30.5, 41, 3.4), keep(35.5, 45.5, 3.2),
                       keep(25.5, 46, 3), keep(28.5, 61, 3.2)],
                inlays: [
                    [34, 66, 5, grn],
                    [30.5, 41, 1.9, snd],
                    [35.5, 45.5, 1.7, snd],
                    [25.5, 46, 1.5, snd],
                    [28.5, 61, 1.9, snd, 1.2]
                ]
            }),
            fence: { x: 12, z: 4, w: 34, d: 76 },
            tee: { x: 31, z: 12 }, cup: { x: 35, z: 67.5 }
        }),
        (function () {
          /* The burn runs from just past the neck to beyond the stakes, kept
             inside its own seven-unit row so no hollow reaches the fairway
             either side of it, and wandering a unit up and down the hole. */
          var lobes = burn([[23, 37.6], [31, 37.0], [40, 38.1], [49, 37.2], [56, 37.7]], 2.2, 1.2, 3319);
          var ground;
          return build({
            /* The bowl is the same bowl, and the hole in front of it is new: a
               burn seven units across lying over the line where a full drive
               runs out. Throttle the drive to stop short of it and the second
               carries the water and is fed down to the pin by the banks. Or
               take the neck of dry ground down the left between the end of
               the burn and the stakes, which is a full drive's worth of
               fairway six units wide and leaves a short pitch in from the
               side. */
            name: 'The Punchbowl', par: 4, open: true,
            blurb: 'A burn across the hole where the drive runs out, and the green in a bowl beyond it. Lay up and carry it, or thread the dry neck down the left.',
            pads: ground = moor({
                tee: { x: 30, z: 10 }, seed: 3313, n: 52,
                area: { x: 3, z: 3, w: 54, d: 80 },
                r: 5, rMax: 10, grad: 0.20,
                strips: [
                    [34, [16, rgh], [24, fwy], [20, rgh]],
                    [7, [14, rgh], [6, fwy], [40, rgh]],
                    [43, [20, rgh], [20, fwy], [20, rgh]]
                ],
                flat: [keep(28, 62, 13), keep(38, 26, 3.6)]
                    .concat(banks(14, 56, 37.5, 6)),
                /* The bowl is authored rather than scattered: a ring of humps
                   standing round the green, close enough to run together into
                   one rim and far enough out that none of their tails reaches
                   the green itself. The dune field is kept away from all of
                   it, so this is the only thing shaping the ground there. */
                bumps: ring(28, 62, 12.5, 6.5, 1.3, 8),
                inlays: [[28, 62, 5.4, grn], [38, 26, 2.2, snd, 1.6]]
            }),
            water: [pond(ground, lobes)],
            fence: { x: 12, z: 4, w: 36, d: 76 },
            tee: { x: 30, z: 10 }, cup: { x: 28.5, z: 62.5 }
          });
        })(),
        build({
            /* The hole that used to be here was called Stake and Ditch and it
               was a corridor: one strip of fairway, a bunker either side and
               a boundary drawn tight down the right, which made the whole hole
               a rule rather than a piece of ground. So the stakes stayed and
               the ground arrived. `massif` puts a whinstone dune the size of a
               hill down the right of it — the rock the course is named for,
               and the reason there are outcrops on the crest of it — and the
               boundary runs along the foot, which makes the two halves of the
               hole one question instead of two.

               A dune this size cannot be flown and is not meant to be: nothing
               in the bag gets above about three units, so four and a half of
               sandhill is a thing you go round. What it does instead is throw
               anything that lands on its flank straight back down — into the
               fairway if you were lucky and over the line if you were not.
               Away from it, two pots wait on the left exactly where the drive
               comes down. And the green is the longest and thinnest on the
               course, threaded between a bunker either side: the approach
               is a question of line rather than of length. */
            name: 'The Sandhill', par: 4, open: true,
            blurb: 'A whinstone dune down the right with the stakes along its foot, two pots on the left where the drive comes down, and a long thin green between two bunkers.',
            pads: moor({
                tee: { x: 15, z: 8 }, seed: 7717, n: 46,
                area: { x: 3, z: 3, w: 52, d: 78 },
                r: 5, rMax: 10, grad: 0.21,
                bumps: massif(34, 36, 15, 3.8, 6),
                strips: [
                    [36, [7, rgh], [19, fwy], [32, rgh]],
                    [20, [5, rgh], [19, fwy], [34, rgh]],
                    [18, [7, rgh], [15, fwy], [36, rgh]],
                    [10, [58, rgh]]
                ],
                flat: [keep(34, 36, 16), keep(15, 64, 8), keep(9.5, 39, 3.4),
                       keep(14, 44.5, 3), keep(20, 59, 3), keep(9.8, 63.5, 3)],
                inlays: [
                    [15, 64, 2.8, grn, 6.2],
                    [9.5, 39, 2.2, snd],
                    [14, 44.5, 1.7, snd],
                    [20, 59, 1.6, snd, 1.3],
                    [9.8, 63.5, 1.4, snd, 1.9]
                ]
            }),
            extra: [].concat(
                crags(34, 36, 5, 7, 7717, { s: 1.6, h: 1.2 }),
                crags(30, 22, 4, 4, 7727, { s: 1.2, h: 0.9 })
            ),
            fence: { x: 4, z: 4, w: 24, d: 74 },
            tee: { x: 15, z: 8 }, cup: { x: 15, z: 66.5 }
        }),
        (function () {
          var ground;
          return build({
            /* A dogleg right round the pool where the burn widens, off a tee
               on top of a dune three units high. The fairway runs north off
               the dune and turns hard right along the top to the green, and
               the inside of the corner is the pool: go up the left and round,
               or carry as much of the water as you dare and come down in the
               rough beyond it, a club nearer the flag. The stakes run round
               the back of the pool, so there is no way round it on the right —
               the corner is water or it is the long way.

               The height is a hump under the tee rather than a raised row. A
               row is the width of the property, and a links tee lifted on one
               is a tabletop across the whole hole with a bank down three sides
               of it; a dune is a dune. The fall off its face is what buys the
               carry, and the carry is what puts the pool in reach at all. */
            name: 'Burnside', par: 4, open: true,
            blurb: 'Off a tee up in the dunes and hard right round the burn pool. Go the long way round, or carry as much of the water as you dare.',
            pads: ground = moor({
                tee: { x: 13, z: 4 }, seed: 2237, n: 50, z0: -6,
                area: { x: 3, z: -3, w: 58, d: 79 },
                r: 5, rMax: 10, grad: 0.21,
                bumps: [hill(13, 4, 9.5, 3)],
                strips: [
                    [12, [64, rgh]],
                    [15, [6, rgh], [14, fwy], [44, rgh]],
                    [12, [6, rgh], [14, fwy], [44, rgh]],
                    [10, [6, rgh], [14, fwy], [44, rgh]],
                    [16, [6, rgh], [44, fwy], [14, rgh]],
                    [4, [10, rgh], [30, fwy], [24, rgh]],
                    [16, [64, rgh]]
                ],
                flat: [keep(13, 4, 10), keep(31, 27, 11), keep(41, 54, 7),
                       keep(31, 38, 3.2), keep(10, 52, 3.4), keep(35.5, 49.5, 3)],
                inlays: [
                    [41, 54, 4.6, grn],
                    [31, 38, 1.8, snd],
                    [10, 52, 2.0, snd],
                    [35.5, 49.5, 1.5, snd]
                ]
            }),
            // The pool in the corner, in a hollow rather than a box: its
            // hollows stop a unit and more short of the fairway on the left.
            water: [pond(ground, mere(31, 27, 6.6, 5.2, 2.2, 2241))],
            extra: [].concat(
                crags(46, 25, 4, 6, 2237, { s: 1.4, h: 1.0 }),
                crags(44, 37, 2.5, 3, 2239, { s: 1.1, h: 0.8 })
            ),
            fence: [
                { x: 3, z: -3, w: 21, d: 68 },
                { x: 3, z: 31, w: 51, d: 34 }
            ],
            tee: { x: 13, z: 4 }, cup: { x: 41.5, z: 54.5 }
          });
        })(),
        (function () {
          /* The moat is a ring of water round a round island now, which is
             what an ait is: a burn that splits round a hump of ground. The
             near bank is where the old one was — seven units of carry off
             the tee — and the island is rough round the green.

             The island is a disc of its own standing 0.45 above the ground
             the ring is cut into, rather than ground the ring was cut round.
             A pond is drawn and drowned as its bounding box (anything in it
             and below the surface is wet), and the box of a ring covers its
             middle: on level ground the cup's floor would be under the water
             and a holed putt a splash. Up on its own disc the whole cup is
             above the surface, and the island's bank drops straight into the
             burn, which is what the bank of an ait does. */
          var ring = [], k, ground, isle;
          for (k = 0; k <= 16; k++) {
              ring.push([26 + Math.sin(k / 16 * Math.PI * 2) * 12.6,
                         39 - Math.cos(k / 16 * Math.PI * 2) * 12.0]);
          }
          return build({
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
            pads: ground = moor({
                tee: { x: 26, z: 22 }, seed: 6421, n: 26,
                area: { x: 3, z: 3, w: 46, d: 58 },
                r: 4.5, rMax: 9, grad: 0.22,
                /* The ground stops under the island — a square inside its
                   disc, and the green inside the square — so the green is
                   laid into the island and nothing else. */
                strips: [
                    [22.5, [12, rgh], [28, fwy], [12, rgh]],
                    [9.7, [52, rgh]],
                    [13.6, [19.2, rgh], [13.6, null], [19.2, rgh]],
                    [18.2, [52, rgh]]
                ],
                flat: [keep(26, 38, 22)]
            }).concat([
                isle = shapeDisc(Object.assign(pad(16.4, 29.4, 19.2, 19.2, 0.45, rgh), { r: 9.6, stands: true })),
                circle(26, 39, 5.4, grn, 0.45)
            ]),
            water: [pond(ground.filter(function (p) { return p !== isle && !p.inlay; }),
                         burn(ring, 2.5, 1.3, 6427))],
            fence: { x: 8, z: 8, w: 36, d: 52 },
            tee: { x: 26, z: 22 }, cup: { x: 26, z: 39 }
          });
        })(),
        (function () {
          var ground;
          return build({
            /* A three-shotter that turns left at the point. Two pots wait in
               the landing ground with the stakes close on the right, and the
               inside of the elbow is a pool lying in country that is not the
               golf course. From the drive the second is the wager: up the
               fairway and round the corner, which leaves a long third, or
               across the end of the pool to the far fairway, which leaves a
               pitch if it gets over. The green is out on the point itself,
               with a long bunker across its front and the water close behind
               it, so the third has to be flown and stopped. */
            name: 'Elbow Point', par: 5, open: true,
            blurb: 'Hard left at the point, round a pool in the elbow. Go round, or carry the end of it with the second — then a green between the sand and the water.',
            pads: ground = moor({
                tee: { x: 60, z: 8 }, seed: 5519, n: 70,
                area: { x: 3, z: 6, w: 74, d: 85 },
                r: 5, rMax: 11, grad: 0.20,
                strips: [
                    [4, [80, rgh]],
                    [26, [50, rgh], [18, fwy], [12, rgh]],
                    [24, [52, rgh], [16, fwy], [12, rgh]],
                    [4, [50, rgh], [18, fwy], [12, rgh]],
                    [14, [22, rgh], [46, fwy], [12, rgh]],
                    [4, [30, rgh], [30, fwy], [20, rgh]],
                    [18, [80, rgh]]
                ],
                flat: [keep(42, 42, 15), keep(16, 67, 10.5), keep(27, 67, 7),
                       keep(35, 67, 5), keep(56, 38, 3.2), keep(64, 42, 3)],
                inlays: [
                    [27, 67, 4.8, grn],
                    [35, 67, 1.5, snd, 4.2],
                    [56, 38, 1.8, snd],
                    [64, 42, 1.6, snd]
                ]
            }),
            // The pool in the elbow and the water behind the green, each a
            // hollow kept a unit and more off the mown line.
            water: [
                pond(ground, mere(41.5, 41.5, 5.4, 8.8, 2.4, 5523)),
                pond(ground, mere(15.2, 67, 3.1, 7.8, 2.3, 5527))
            ],
            extra: [].concat(
                crags(22, 32, 6, 7, 5519, { s: 1.5, h: 1.1 }),
                crags(28, 84, 3, 4, 5521, { s: 1.2, h: 0.9 })
            ),
            fence: [
                { x: 46, z: 2, w: 28, d: 79 },
                { x: 8, z: 54, w: 66, d: 27 }
            ],
            tee: { x: 60, z: 8 }, cup: { x: 26, z: 67.5 }
          });
        })()
    ];


    /* ── crazy golf, the second of three: Pinball Parlour ─────────────────

       The first course on the list that is not trying to be a golf course at
       all. Everything else here — even Windmill Works with its blades — is
       laid out as a lane you play *down*: aim, judge the pace, allow for the
       one thing in the way. A pinball table is the opposite proposition. The
       obstacles are not between you and the cup, they *are* the route, and the
       right shot is often the one fired at a post rather than at the flag.

       That is what `bumper` is for, and it is the only new piece of vocabulary
       the course needed. Everything else is a wall, a ramp and a gate that the
       first seven courses already had — which is the point: crazy golf is not
       a different engine, it is the same one with the aiming taken away.

       Since v1.126.0 the course is played in the order of what each table
       adds, one piece at a time: the chute and three bumpers, then banks and
       rubber posts, then both round a block of bumpers you bank into, then
       height, then bats that move, and the finisher with a hole in the table
       and all the rest. */

    /* The room round a table: uprights along both sides on the basement
       floor, facing in, and a marquee over the far end with the hole's name
       on it. Every hole on the Parlour wears it, so the course is a room
       rather than six tables floating in the dark (the owner: "there is no
       fun decor or props"). `kinds` is what stands along the walls, taken in
       turn, so each room is furnished differently and six holes are six
       rooms. */
    function arcadeRoom(W, L, text, seed, kinds) {
        var out = [], k, n = Math.max(2, Math.round(L / 4.5)), v = seed || 0;
        var ks = kinds || [cabinet];
        for (k = 0; k < n; k++) {
            var z = 2.5 + k * (L - 4) / (n - 1);
            out.push(ks[k % ks.length](-1.5, z, { yaw: Math.PI / 2, scale: 1.3, variant: (v + k) % 4 }));
            out.push(ks[(k + 1) % ks.length](W + 1.5, z, { yaw: -Math.PI / 2, scale: 1.3, variant: (v + k + 2) % 4 }));
        }
        if (text) out.push(marquee(W / 2, L + 1.6, { w: 3.4, scale: 1.5, text: text }));
        return out;
    }

    var parlour = [
        build({
            name: 'Plunger Lane', par: 3,
            blurb: 'Down the chute at pace, into the pins, and let the table decide.',
            pads: [
                pad(0, 0, 2.4, 9, 1, 'wood', 0, -1 / 9),
                pad(2.4, 0, 4.6, 9),
                pad(0, 9, 7, 9)
            ],
            /* The middle pin a quarter of a unit west of where it stood, which
               is the width of the gap the line out of the chute at the flag
               used to thread (README → "The hole lab"). The shot now is the
               one the plunger is for: off the chute's wall and through the
               pins on the inside of it. The pins are a size up since they went
               round (physics.popBumper): a circle inscribed in the old square
               opened the gap again by the width of its corners. */
            extra: [bumper(1.6, 12, 0.6), bumper(3.25, 13.7, 0.6), bumper(5.4, 12, 0.6)],
            decor: arcadeRoom(7, 18, 'PLUNGER LANE', 0),
            tee: { x: 1.2, z: 1.2 }, cup: { x: 3.5, z: 16.6 }
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
            decor: arcadeRoom(9, 16, 'SLINGSHOTS', 3, [claw, jukebox]),
            tee: { x: 4.5, z: 1.5 }, cup: { x: 4.5, z: 14.2 }
        }),
        (function () {
            /* A city block of pop bumpers with the pin in the middle of it,
               and the doors into the block on the diagonals.

               It was eight square posts in a diamond and a kicker up each side
               lane (v1.70.0 to v1.122.0), and the hole lab never found an ace
               on it: the kickers turned a ball that came straight up a lane,
               and nothing on the table sent one straight up a lane. The posts
               were boxes, and a field of boxes is a field of little walls.

               Now the posts are round and three of them fire (physics.
               popBumper), and they stand round the cup at three, twelve and
               nine o'clock with a rubber post at six — the one in front, on
               the line from the tee, and passive, because a kick there would
               make every glancing line an ace at any weight. Two more rubber
               posts stand in the street halfway up and shade the doors from
               the tee, so nothing goes in on a straight line.

               What does go in is the bank. Off either side rail, about four
               units up, the ball comes back across the table on the diagonal
               and through the bottom door of the block on that side — a
               mallet at two thirds of the swing or more. The lamps let into
               the baize say so: a chase of arrows to each rail and back to
               the block, which is what the inserts on a real table are for.
               Short of the block is a putt through a door; hit at the
               bumpers and they hand it back at walking pace; and behind the
               block are the two drains, which is where a ball that comes off
               the top of the dome too hard ends up. */
            var W = 7, L = 12.5, cx = 3.5, cz = 7.8, R = 0.72;
            var p = pad(0, 0, W, L);
            p.round = { nw: W / 2, ne: W / 2, sw: 1.4, se: 1.4 };
            function at(deg, r) {
                var t = deg * Math.PI / 180;
                return { x: cx + Math.cos(t) * r, z: cz + Math.sin(t) * r };
            }
            p.voids = [60, 120].map(function (deg) {
                var q = at(deg, 1.9);
                return { x: q.x, z: q.z, r: 0.5 };
            });
            var front = at(-90, R), east = at(0, R), north = at(90, R), west = at(180, R);
            var lamps = [], k;
            // The chase to each rail and back to the block, mirrored.
            [1, -1].forEach(function (sx) {
                var out = Math.atan2(0.8 * sx, 0.6), back = Math.atan2(-0.64 * sx, 0.77);
                lamps.push(lamp(cx + sx * 1.15, 2.3, 0.006, { yaw: out, variant: 1 }));
                lamps.push(lamp(cx + sx * 1.95, 2.9, 0.006, { yaw: out, variant: 1 }));
                lamps.push(lamp(cx + sx * 2.55, 5.0, 0.006, { yaw: back, variant: 3 }));
                lamps.push(lamp(cx + sx * 1.9, 5.8, 0.006, { yaw: back, variant: 3 }));
            });
            // And the block itself, ringed in round inserts.
            for (k = 0; k < 8; k++) {
                var q = at(22.5 + k * 45, 1.35);
                if (k === 1 || k === 2) continue;           // the drains are there
                lamps.push(lamp(q.x, q.z, 0.006, { variant: 4 }));
            }
            return build({
                name: 'Bumper City', par: 3,
                blurb: 'The pin is in a block of pop bumpers with its doors on the diagonals. Bank it off a side rail and through one; anything else, the bumpers hand back.',
                pads: [p],
                extra: [
                    post(front.x, front.z),
                    bumper(east.x, east.z), bumper(north.x, north.z), bumper(west.x, west.z),
                    post(cx - 0.4, 4.4), post(cx + 0.4, 4.4),
                    bumper(1.3, 9.9), bumper(5.7, 9.9)
                ],
                decor: lamps.concat([skyline(cx, 15.6, { w: 13 })], arcadeRoom(W, L, 'BUMPER CITY', 0)),
                tee: { x: cx, z: 1.4 }, cup: { x: cx, z: cz }
            });
        })(),
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
            /* The steep ramp wants more pace than a putter has in it, and the
               mini bag (CONFIG.MINI_BAG) has nothing else that rolls; the
               mallet is the club that makes the steep way a choice. */
            bag: ['putter', 'mallet', 'chipper', 'wedge'],
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
            decor: arcadeRoom(9, 18, 'TWO RAMPS', 1, [jukebox, cabinet]),
            /* The pin was at x 6.6 until the stubs of rail crossed at every
               inside corner came out (railFor): two of them had been
               narrowing the steep ramp's mouth, and without them the putt at
               the flag went up it and dropped. */
            tee: { x: 4.5, z: 1.6 }, cup: { x: 6.9, z: 15 }
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
                /* Bats now, not blades (v1.126.0): each hinged at the rail
                   end like a real flipper, resting tip-down and flicking up
                   through a radian on a rate of its own, so the two open the
                   table on a pattern rather than on a beat. */
                flipper(1.7, 8.6, 2.6, { hinge: -1, rest: 0.5, arc: -1.0, speed: 1.9 }),
                flipper(4.8, 11.4, 2.6, { hinge: 1, rest: -0.5, arc: 1.0, speed: 2.3 }),
                bumper(3.5, 3.2)
            ],
            decor: arcadeRoom(7, 16, 'FLIPPERS', 2, [cabinet, claw]),
            tee: { x: 3.5, z: 1.5 }, cup: { x: 2.2, z: 14.4 }
        }),
        (function () {
            /* The finisher: the jackpot is a hole in the table.

               It was a straight wall across a rectangle with a door in it, a
               window over it and five square posts (v1.70.0 to v1.122.0), and
               the owner called it what it was — weird, and boxes. The idea
               worth keeping was the most pinball thing there is: a ball that
               drops down a hole in the playfield and comes out somewhere
               across the room.

               So that is the hole now. The pin stands in the vault, a curved
               wall round the front and sides of it, open only at the back
               under the dome. The mouth is low on the left, behind a pop
               bumper on the line to it and a rubber post beside it, and it
               comes out at the top of the dome firing straight down at the
               pin. A pipe keeps the pace it was given (physics.warpUnder), so
               finding the mouth is the line and the run in from the dome is
               the weight: firm enough that it carries through the gap behind
               the bumper, soft enough that what comes out the far end stops
               at the pin rather than running on into the vault wall.

               The safe way is the long one: a putt to the foot of the vault,
               a second round the end of it and up behind, and in from the
               back. Nothing on the table goes in on a straight line — the
               vault is in the way of a putt at the flag and its wall stands
               higher than a pitch at the flag comes down. Par is three now;
               it was four with three doors and none of them led anywhere. */
            var W = 9.4, L = 19, cx = 4.7, cz = 15.4, mx = 1.4, mz = 8.4;
            var p = pad(0, 0, W, L);
            p.round = { nw: 4.5, ne: 4.5, sw: 1.8, se: 1.8 };   // just short of a dome: the cup keeps its flat
            var lamps = [], k, dx = mx - cx, dz = mz - 1.5, yaw = Math.atan2(dx, dz);
            // A chase from the tee to the mouth, round the near side of the
            // bumper, and a ring of inserts round the mouth itself.
            for (k = 0; k < 4; k++) {
                lamps.push(lamp(cx + dx * (0.16 + k * 0.13) - 0.45, 1.5 + dz * (0.16 + k * 0.13),
                    0.006, { yaw: yaw, variant: 1 }));
            }
            for (k = 0; k < 6; k++) {
                var t = k / 6 * Math.PI * 2;
                lamps.push(lamp(mx + Math.cos(t) * 0.85, mz + Math.sin(t) * 0.85, 0.006, { variant: 6 }));
            }
            return build({
                name: 'Jackpot', par: 3,
                bag: ['putter', 'mallet', 'chipper', 'wedge'],
                blurb: 'The pin is in the vault and the vault opens at the back. Go round, or find the hole in the table — it comes out over the pin.',
                pads: [p],
                warps: [pipe(mx, mz, cx, cz + 2.75, Math.PI, 0.45)],
                extra: [].concat(
                    arc(cx, cz, 2.6, 175 * Math.PI / 180, 365 * Math.PI / 180, { h: 1.3, t: 0.3 }),
                    [bumper(2.6, 6.4), bumper(6.8, 6.4), post(mx - 0.7, mz - 0.6), bumper(4.7, 9.6),
                     bumper(1.6, 15.2), bumper(7.8, 15.2)]
                ),
                decor: lamps.concat(arcadeRoom(W, L, 'JACKPOT', 2, [fruit])),
                tee: { x: cx, z: 1.5 }, cup: { x: cx, z: cz }
            });
        })()
    ];

    /* ── crazy golf, the last of three: Clockwork Court ────────────────────

       Windmill Works asks you to find the gap and Pinball Parlour makes the
       furniture the route. This one asks for the *moment*. It is three courses
       folded into one (v1.122.0): Clockwork Court's single mechanisms, The
       Belfry's pairs geared to each other and The Millrace's machines over
       water had become eighteen holes asking one question, most of them a
       straight lane with a machine across it. These are the six with a shape
       to them as well as a clock.

       - **Pendulum** — one bar over a plank, the shortest statement of it.
       - **Three Against Two** — two bells round a corner, the corner fixing
         how long you take between them.
       - **Change Ringing** — two doors with a different clock behind each:
         pick the beat you can count.
       - **The Weir** and **Full Flow** — the mill race under the machinery, so
         a mistimed shot is a stroke rather than a bounce, and laying up short
         of the machine is a real choice.
       - **Midnight** — two weights at two rates, or the long way round.

       Two rules carried over from The Belfry, and both are load-bearing:
       nothing here can shut a hole (every mechanism leaves a window in its own
       line at every phase — the tests demand it of the whole file), and the
       rates are small whole numbers a player can hear, because a pattern
       nobody can count reads as random. */

    var clockwork = [
        build({
            /* One plank and one bar across it, and a bank at the end of the
               plank that turns a ball coming off it west, to a pin tucked by
               the west rail. With the pin at the end of the plank the putt at
               the flag ran straight down the boards and in (README → "The hole
               lab"), and from the tee the plank is the only line there is — so
               the bank does the turning: straight down the plank, past the
               bar, and off the bank to the pin. A putt at the flag runs off
               the side of the plank. A lean would have done it more gently and
               left a lip where the plank meets the green. The tee is west of
               the plank's middle (v1.126.0), so the line at the flag leaves
               the boards before the bar can knock it back on to them. */
            name: 'Pendulum', par: 3,
            blurb: 'One plank over the water and one bar sweeping across it.',
            pads: [
                pad(0, 0, 6, 7),
                pad(1.9, 7, 2.2, 4, 0, 'wood'),
                pad(0, 11, 6, 7)
            ],
            water: [rect(-3, 7, 12, 4, -0.8)],
            gaps: [shore(rect(-3, 7, 12, 4), 0.7)],
            extra: [
                slider(2.4, 8.6, 1.2, 0.4, { amp: 2.4, speed: 1.3 }),
                bank(3.2, 12.8, 2.2, Math.PI / 4)
            ],
            tee: { x: 2.4, z: 1.5 }, cup: { x: 1.0, z: 12.8 }
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
        }),
        build({
            /* The last hole on the course asks for the whole of it — two
               things moving at their own rates, and the moment they agree —
               and offers a way out of the question for a stroke.

               It used to be a court nine wide and twenty-four long with a
               spine down the middle and six pieces of furniture either side
               of it: a gate and a bat on one, a door, a bar to roll under and
               a bumper on the other. Neither side could be holed in one, so
               the choice between them was a choice between two ways of taking
               three, and nobody could see from the tee what any of it was for.

               Now the spine splits the court into a narrow lane and a wide
               one, and the green runs across the top of both.

                 the clock lane  two weights swinging across it, the near one
                                 at two radians a second and the far one at
                                 one and a third, so they line up out of the
                                 way only now and then — that is midnight.
                                 Straight up the middle when they do, off
                                 the bank in the corner at the top, and along
                                 to the pin: the ace, and it wants the whole
                                 mallet. Miss the first weight and it sends
                                 you back to the tee; miss the second and you
                                 are halfway up a lane with a clock still
                                 running in front of you.
                 the long way    nothing moves in it. Up the wide lane and
                                 out onto the green beside the pin, and a putt.
                                 It cannot be holed in one — the pin is round
                                 the end of the spine from it — so it is a two,
                                 every time, which is a stroke worse than the
                                 ace and a stroke better than the weight.

               The pin sits just round the end of the spine, so a putt at the
               flag runs down the lane's east side into the far weight's post
               (README → "The hole lab"). A ball that glances off the spine is
               stopped by that post before it can slide up to the top. */
            name: 'Midnight', par: 3,
            blurb: 'The clock lane: two weights at two rates, then the bank to the pin. Or the long way, and a putt.',
            pads: [pad(0, 0, 7.5, 14)],
            extra: [
                // the spine, between the clock lane and the long way
                wall(2.4, 3.6, 0.4, 6.6, 0.62, { base: -0.1 }),
                // two weights at two rates
                slider(0.6, 5.0, 0.8, 0.4, { amp: 0.6, speed: 2.0 }),
                slider(0.6, 8.0, 0.8, 0.4, { amp: 0.6, speed: 1.3 }),
                // the far weight's post, which catches a putt at the flag
                wall(2.0, 8.0, 0.4, 0.4, 0.62, { base: -0.1 }),
                // and the bank that turns the lane onto the pin
                bank(1.0, 12.2, 2.0, -Math.PI / 4)
            ],
            tee: { x: 1.0, z: 1.6 }, cup: { x: 3.0, z: 12.0 }
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
               on — a putter runs thirty-odd units on ice — by pointing you
               away from the flag. The pin is on a mat of grass beside the
               tee, on the far side of the racking down the middle of the
               store, and the only way to it is up the ice, round the banked
               end and back down the other side: thirty units to cover a gap
               of four.

               It was a straight lane with a stack of ice blocks in the
               middle, there only because the putt at the flag would otherwise
               have been the ace (README → "The hole lab"), and nobody could
               say what it was for. Here what is between you and the pin is
               the store itself, and the question is the course's: where do
               you want the ball to run out of speed? Not on the ice — short
               of the pace and it stops halfway down the far aisle, and a ball
               on ice is a ball nothing has stopped — and not past the mat,
               which ends at an open door. On the mat.

               The end is banked (a `channel` round the curve, laid on both
               aisles where they meet it so the seam is one surface), which is
               what lets a ball round it without the rail taking its pace:
               the bank turns it and the ice keeps the rest. The mallet is the
               ace, firm enough to come all the way home; the putter at full
               gets round and leaves a putt from the far aisle or the mat. */
            name: 'Cold Store', par: 3,
            blurb: 'The pin is beside you, behind the racking. Putt away from it — the ice brings the ball all the way round. Stop it on the grass.',
            pads: (function () {
                var W = 8, L = 15, R = W / 2, aisle = 3.2, mat = 2.8, cz = L - R;
                var bend = channel(R, cz, R, 1.6, 0.35, 0, Math.PI);
                function banked(p) { p.bumps = [bend]; return p; }
                var end = banked(pad(0, cz, W, R, 0, ice));
                end.round = { nw: R, ne: R };
                return [
                    pad(0, 0, aisle, 3),                                    // the tee
                    banked(pad(0, 3, aisle, cz - 3, 0, ice)),               // up
                    end,                                                    // round
                    banked(pad(W - aisle, mat, aisle, cz - mat, 0, ice)),   // and back
                    pad(W - aisle, 0, aisle, mat)                           // the mat
                ];
            })(),
            gaps: [brink({ x: 4.8, z: 0, w: 3.2, d: 0 }, 0.4)],         // the door
            extra: [wall(3.2, -0.2, 1.6, 11.2, 0.8, { base: -0.1 })],   // the racking
            tee: { x: 1.6, z: 1.5 }, cup: { x: 6.4, z: 1.5 }
        }),
        build({
            /* Grit across the ice, with a gap in it. Sand keeps four
               thousandths of the ball's speed per second, so the strip is not
               an obstacle you cross slowly — it is one you do not cross at
               all. The gap is a metre and a half wide at the far side, which
               makes this the first hole on the course where the line matters
               as much as the weight. The strip is 2.2 deep: at 1.6, the mallet
               of v1.126.0 (CONFIG, EXTRA_CLUBS) crossed it at full swing on
               the line at the flag and stopped at the pin. */
            name: 'The Salt Line', par: 3,
            blurb: 'A bar of grit across the ice with one gap in it. Sand does not let go.',
            pads: [
                pad(0, 0, 6, 2.5),
                pad(0, 2.5, 6, 6.5, 0, ice),
                pad(0, 9, 4.4, 2.2, 0, 'sand'), pad(4.4, 9, 1.6, 2.2, 0, ice),
                pad(0, 11.2, 6, 7.4, 0, ice),
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
               how far down the gutter that turns out to be.

               A pillar stands on the sheet where the putt aimed at the flag
               crosses it, so that putt is not the ace any more: the aces are
               aimed north of the flag and let the fall bring them down past
               the pillar to the gutter, or come off the rail beside the ledge
               first. The pillar stands square on that line rather than with
               its corner in it — a corner sent the putt at the flag north to
               the back rail and round into the gutter, once the stronger
               mallet of v1.126.0 had the pace to get there. */
            name: 'The Draught', par: 3,
            blurb: 'The whole sheet falls east and ice holds nothing. The gutter at the bottom is the hole.',
            pads: [
                pad(0, 0, 2.4, 9, 0.72),
                pad(2.4, 0, 5.6, 18, 0.72, ice, -0.12857, 0),
                pad(8, 0, 2.6, 18)
            ],
            extra: [wall(4.3, 7.5, 1.0, 1.0, 1.1, { base: -0.3 })],
            tee: { x: 1.2, z: 2 }, cup: { x: 9.3, z: 15 }
        }),
        build({
            /* And the first travelator: a belt running across the ice at the
               turn, which is the one thing on this course that can move a ball
               that has stopped. Too slow into it and the belt is the whole of
               your second shot; too fast and it puts you in the grit on the
               far side.

               The belt is also a governor. Whatever pace a ball brings to it,
               it leaves at the belt's, and the grass at the end took that pace
               off at one spot — which is where the pin used to be, so two
               shots in every hundred from the tee were aces, a putt at the
               flag among them (README → "The hole lab"). The pin is a unit
               further on now, past where the belt's pace dies, and a pillar
               stands in the ice where the putt at the flag comes off the east
               wall. What is left is the line up the west side, hit firmly
               enough to bring some pace of its own to the belt. */
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
            extra: [wall(2.9, 6.4, 1.2, 1.2, 0.9, { base: -0.1 })],
            tee: { x: 2.5, z: 1.6 }, cup: { x: 14.4, z: 13.7 }
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
            /* The finisher, and it asks the course's two questions at once:
               where do you want the ball to run out of speed, and when do you
               reach for the Checker. It was a bobsleigh hall into a loop,
               which was Helter Skelter's ride brought indoors and asked
               neither.

               The green is a dais across the middle of the room, eight tenths
               of a unit up, with a sheer face towards the tee and one way up
               it along the ground: a ramp of ice on the left. Ice on a slope
               holds nothing (CONFIG.HOLD.ice), so a putt up the ramp has one
               place to stop and it is the top. Short of the pace and the ramp
               hands it back to your feet; over it, across the dais and down
               the ice behind to the grit at the back of the room, which is a
               lie nothing in the bag but the Checker gets out of. That is the
               bold line: the mallet in off the left wall, so it climbs the
               ramp at an angle and carries on across the dais to the pin
               with the last of its pace.

               Or don't putt. The Checker flies the face and sits down on the
               grass, and the only thing it asks is enough: short of the dais
               it hits the face and the ice brings it home, and a full one
               flies the lot into the grit. Anything from most of a swing to
               all of one lands on the dais and leaves a putt — the safe two,
               and now and then it pitches by the pin and stays.

               The pin went back a quarter of a unit in v1.126.0: with the
               stronger mallet a full putt at the flag found the left wall,
               the ramp and the pin on its own, which is the bold line played
               by accident. */
            name: 'The Cold Room', par: 3,
            bag: ['putter', 'mallet', 'checker'],
            blurb: 'The green is up on a dais. Putt up the ice ramp and stop it at the top, or fly the face with the Checker and let it sit.',
            pads: [
                pad(0, 0, 8, 3),                                 // the tee
                pad(0, 3, 8, 0.5, 0, ice),
                pad(0, 3.5, 3.4, 3, 0, ice, 0, 0.8 / 3),         // the ramp
                pad(3.4, 3.5, 4.6, 3, 0, ice),                   // under the face
                pad(0, 6.5, 8, 5, 0.8),                          // the dais
                pad(0, 11.5, 8, 3, 0.8, ice, 0, -0.8 / 3),       // and down the back
                pad(0, 14.5, 8, 1.5, 0, ice),
                pad(0, 16, 8, 2, 0, 'sand')                      // the grit
            ],
            tee: { x: 1, z: 1.5 }, cup: { x: 4.8, z: 8.85 }
        })
    ];

    /* ── adventure golf, the second of three: Cinder Cone ──────────────────

       Icehouse Yard takes the friction away. This one leaves the floor as
       grippy as a green and bolts machinery to it — launch pads, belts, a pipe
       and a loop — on the side of a mountain, so most of it is pointing
       downhill. It was two courses, Helter Skelter's fairground and Cinder
       Cone's volcano, built from the same four machines; the best six of their
       twelve are one card now (v1.122.0). Of the six that went, three were the
       pad holes whose ace was the putt at the flag (Bounce Alley, The
       Gravitron, Fumarole) and three were lanes with no ace at all
       (Crosstown, Lava Tube, The Scree).

       Each machine is met on its own before they are combined: the pad over a
       wall (The Springboard), a belt running back at you (The Ash Slide), the
       pipe (Through the Pipe), the loop (Loop the Loop), and a vent in the
       floor of a hollow (Blowhole). Then Caldera asks for all of it: up the
       vent, along the rim on the belt — the one piece of ground on the
       mountain that is level — and in through the tube.

       None of it can be aimed off the way a rail can. You cannot bank off a
       belt or put spin on a pipe; the decision each one offers is whether to
       be on it and how fast, and after that it is simply what happens next. */

    var cinder = [
        build({
            /* Launch pads, introduced the only honest way: a wall with no way
               round it, a pad in front of the wall, and a bag with no loft in
               it at all. The ball goes over because the floor throws it over,
               and the first time it happens is worth the whole course.

               The pad and the tee are over on the west side, the pin is over
               on the east, and a bank across the far west corner turns a ball
               running up the lane on to the pin — Sea Legs' kicker. A pad
               throws a ball up and leaves its heading alone, so with the tee,
               the pad and the pin in a row the putt at the flag was the ace
               (README → "The hole lab"); out of line, the pad is the way over
               and the bank the way in, and the safe two is over and a putt
               across. */
            name: 'The Springboard', par: 3,
            blurb: 'A wall too tall to fly and a bag with nothing that flies. Stand on the pad instead.',
            pads: [
                pad(0, 0, 7, 20),
                sprung(1.6, 8.6, 1.2, 10.2)
            ],
            extra: [
                wall(-0.2, 10.2, 7.4, 0.4, 1.35, { base: -0.1 }),
                bank(1.1, 18.9, 3.1, -Math.PI / 4)
            ],
            tee: { x: 1.4, z: 1.6 }, cup: { x: 6.2, z: 18.9 }
        }),
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
               being true on the third hole.

               A block of tuff sits on the line past the ash, because the mallet
               straight at the flag used to be the ace and the hole asked how
               hard and never where (README → "The hole lab"). The line now is
               off a side wall: across the ash at an angle, which is a longer
               crossing, so it wants nearly all of the mallet. */
            name: 'The Ash Slide', par: 3,
            blurb: 'A band of ash running back down at you. A full swing of the putter just gets over; anything less is returned.',
            pads: [
                pad(0, 0, 6, 5),
                belt(0, 5, 6, 2.5, 0, -4),
                pad(0, 7.5, 6, 7)
            ],
            extra: [wall(2.55, 9.15, 0.9, 0.9, 0.7, { base: -0.1 })],
            tee: { x: 3, z: 1.5 }, cup: { x: 3, z: 12 }
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
            /* A loop-the-loop, and the one ride on the course the ball goes
               *round* rather than along or over. The boards run up to its foot
               so a firm mallet arrives with its pace, and the pace is the whole
               question: about fourteen at the foot carries the ball over the
               top and out of the far side running at the pin; much less and it
               comes off near the top, falls inside the loop and is back on the
               boards on whichever side it lands — usually the near one, rolling
               back to you. A putter cannot get it round at all.

               And there is a way that does not need the nerve: the belt lane
               up the east side, running back at you, which a firm putt or a
               soft mallet climbs and comes out on the green a long putt from
               the flag. Too much through the loop, or up the lane, and the
               sand at the back has it.

               The ride stands in a housing — a block either side of it, and
               one across the mouth of the way out — so the only road north
               between the blocks is through the mouth. Up and Over, a launch
               pad on to a gallery, stood here before it; Bounce Alley and
               The Springboard already ask the launch pad's question. */
            name: 'Loop the Loop', par: 3,
            blurb: 'Hit it hard enough and the loop takes it over the top and out at the pin. Not quite, and it comes back to you.',
            pads: [
                pad(0, 0, 7, 3.5, 1),                          // the deck
                pad(0, 3.5, 7, 4, 1, 'wood', 0, -0.25),        // the drop
                pad(0, 7.5, 5.5, 3.9, 0, 'wood'),              // under the ride
                belt(5.5, 7.5, 1.5, 3.9, 0, -6),               // the long way, against the run
                pad(0, 11.4, 7, 6.6),
                pad(0, 18, 7, 1.6, 0, 'sand')
            ],
            loops: [loop(2.5, 9.7, 0, 1.1, 1)],
            /* The housing. Low, and kept out from under the track: the back
               half of the loop comes down beside the mouth, so all that
               stands between the two lanes there is a thin divider. */
            extra: [
                wall(0, 8, 1.95, 3.2, 0.6, { base: -0.1 }),         // west
                wall(2.86, 8, 2.64, 0.5, 0.6, { base: -0.1 }),      // across the way out
                wall(2.86, 8.5, 0.24, 0.95, 0.6, { base: -0.1 }),   // between the lanes
                wall(4.08, 8.5, 1.42, 2.7, 0.6, { base: -0.1 })     // and east
            ],
            tee: { x: 3.3, z: 1.5 }, cup: { x: 3.5, z: 15 }
        }),
        build({
            /* A blowhole: a hollow in the lawn with a vent at the bottom of
               it, and the green on a shelf above the far side. It was three
               vents scattered over a lane, which was a hole you either missed
               or accepted, and the putt at the flag dropped (README → "The
               hole lab").

               The hollow is the hole. Its sides fall into the floor from
               every direction, so the vent at the bottom is the one thing on
               the card you cannot miss: anything rolled into the hollow is
               gathered on to it and thrown up the face — the mountain running
               everything downhill, and the vent the only way up. What you own
               is the pace you bring. The vent throws the ball the same height
               every time and hands it back travelling as it was, so a ball
               that comes in slowly is thrown on to the front of the shelf and
               one that comes in hot is thrown off the back of it. Too slow to
               clear the face, and it falls back in and the blowhole coughs it
               up again, weaker each time, until it settles at the bottom.

               And the hollow bends the line. A ball that comes in down one
               side is turned by that side towards the middle, so the shot
               aimed at the pin is pulled off it on the way to the vent and
               lands wide. The ace is a firm mallet in down the right-hand
               side of the hollow, which turns it back across the vent at the
               pin — with nothing on the right of the shelf and nothing behind
               it. The safe way is a gentle putt down the middle: it is
               gathered, thrown on to the front of the shelf, and leaves a
               putt for two. */
            name: 'Blowhole', par: 3,
            blurb: 'Everything rolls into the hollow and the vent at the bottom throws it up on to the shelf. How far depends on how hard you came in.',
            pads: (function () {
                // A hollow in nine pads, most of a `dish`: the floor, a ramp
                // off each side and the two corners at the tee end, with the
                // shelf's face where the far ramp would be.
                var W = 9, cx = 4.5, cz = 9.5, b = 1.3, a = 4.5, run = a - b,
                    dep = 0.8, k = dep / run;
                return [
                    pad(0, 0, W, cz - a),                                  // the tee
                    pad(cx - b, cz - b, 2 * b, 2 * b, -dep),               // the floor
                    pad(cx - a, cz - b, run, 2 * b, 0, 'green', -k, 0),    // west side
                    pad(cx + b, cz - b, run, 2 * b, -dep, 'green', k, 0),  // east side
                    pad(cx - b, cz - a, 2 * b, run, 0, 'green', 0, -k),    // the near side
                    pad(cx - a, cz - a, run, run, dep, 'green', -k, -k),   // and its corners
                    pad(cx + b, cz - a, run, run, 0, 'green', k, -k),
                    sprung(cx, cz, 1.1, 10, -dep),                         // the blowhole
                    pad(0, cz + b, 7.8, 7, 0.6)                            // the shelf
                ];
            })(),
            gaps: [
                brink({ x: 0, z: 17.8, w: 7.8, d: 0 }, 0.4),       // off the back
                brink({ x: 7.8, z: 11.3, w: 0, d: 6.5 }, 0.4),     // and off the right
                /* The hollow's two near corners are the two sides added
                   together, so they rise out of the lawn towards the fence
                   rather than falling into the hollow — the shoulders either
                   side of its mouth. Open, not railed: a rail on a seam is a
                   box as tall as the highest ground it guards, and these were
                   two of them standing either side of the hollow. The face
                   turns a ball just as a rail would. */
                { x: 0, z: 4.8, w: 3.2, d: 0.4 },
                { x: 5.8, z: 4.8, w: 3.2, d: 0.4 }
            ],
            tee: { x: 2, z: 1.8 }, cup: { x: 6.6, z: 14.4 }
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
               hardly matters how hard the shot on to the rim is hit: whatever
               lands on the belt comes out of the tube at four and a bit units
               a second, which is a putt's worth of pace across the crater
               floor. The machine spends the shot for you, and the only thing
               you own is getting on to it — and, since v1.126.0, *where*.

               Rebuilt in v1.126.0 on two notes from the owner: the caddie got
               stuck here, and the block that stood in front of the pin was "a
               stupid box". Both came from where the vent was.

               The caddie first. The lawn used to run on half a unit past the
               vent to an open shore, and a ball that came off the vent too
               soft dropped on to that strip — past the machine, with the lake
               in front of it and the vent behind it. The way on from there is
               two shots, back off the lip and through the vent again, and a
               search that scores a shot by how near the pin it finishes cannot
               see two shots: it shuffled the ball a unit east and a unit west
               along the lip until it ran out of strokes. With the mallet at
               seventeen it went there off the tee every time. So the lawn ends
               at the vent now. Its far end is a half circle with the vent laid
               into the top of it, railed all the way round, and there is no
               grass past the machine for a ball to stop on; the curve hands a
               ball running up either side of the lawn on to the vent, where
               the square corners used to keep it beside it.

               Then the box. The vent stood on the line from the tee to the
               pin, and a launch pad leaves a ball's heading alone, so the putt
               at the flag went through the vent and flew the crater at the pin
               (README → "The hole lab"). The block was there to stop that, and
               the stronger mallet flew it. Now the pin is out of the vent's
               reach instead: the crater floor is wider, the cup is in its far
               half under the end of the rim, and every line through the vent
               from the tee comes down in the near half and leaves a putt
               across. The putt at the flag misses the vent altogether and
               finishes on the rail.

               And the tube is the ace now, which it never was. Twelve units of
               belt is not quite enough for a ball to reach the belt's own
               pace, so a ball that lands at the near end and rides all of it
               comes out of the tube a little quicker than one that lands half
               way along. The tube points at the pin from three and a half
               units off — the quick ones reach it and the rest stop a putt
               short. Aim a few degrees left of the middle of the vent with a
               bit over half a mallet, land at the start of the belt, and it is
               in: a skill hole's share of the sweep, all of it through the
               tube. */
            name: 'Caldera', par: 3,
            blurb: 'Up the vent, along the rim on the scree, and in through the tube. There is no other road into the crater.',
            pads: [
                (function () {
                    // The lawn's far end is a half circle round the vent.
                    var p = pad(0, 0, 8, 10);
                    p.round = { sw: 1.1, se: 1.1, nw: 4, ne: 4 };
                    return p;
                })(),
                /* A ball's width short of the top of the curve rather than
                   touching it: a ball against the rail there is still over
                   the vent, and the grass, which is cut round the vent as a
                   hole in its outline, cannot triangulate a hole that touches
                   the edge (it drew the lawn's corner off and grass over the
                   vent). */
                sprung(4, 8.55, 1.3, 10.4),
                pad(0, 11, 2, 3.5, 2.2, 'wood'),
                belt(2, 11, 12, 3.5, 3.5, 0, { y: 2.2, kind: 'wood' }),
                pad(14, 11, 3.4, 3.5, 2.2, 'wood'),
                pad(0, 15, 12, 10, 1)
            ],
            water: [rect(-2, 10, 22, 5, -0.8)],
            gaps: [
                { x: -0.6, z: 10.7, w: 8.6, d: 0.6 },    // the face of the rim, where you land
                { x: -1, z: 14.7, w: 21, d: 0.9 }        // and the crater's own
            ],
            warps: [pipe(15.7, 12.75, 7.5, 17, Math.atan2(10 - 7.5, 19.5 - 17), 0.95)],
            tee: { x: 4, z: 2 }, cup: { x: 10, z: 19.5 }
        })
    ];

    /* ── adventure golf, the last of three: Apogee Yard ────────────────────

       The other two adventure courses change the floor. Icehouse takes the
       friction out of it and Cinder Cone bolts machinery to it on a hillside —
       and both leave the ball alone. This one leaves the floor alone and
       changes what the ball *weighs*.

       `hole.gravity` was written for one hole on Helter Skelter (The
       Gravitron, gone since v1.122.0) and it is the
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
            needsLoft: true,   // a carry: there is no road along the floor
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
               floor and a rim, with the rim doing the job the ground cannot.
               It is an island, and there is nothing behind it, which is the
               whole reason the rim is worth having.

               One pad, and round: a `channel` laid on the rim curves down to a
               flat floor wide enough for the cup's clearing. It was nine flat
               pads — a `bowl`, floor, ramps and corners — and from the demo
               camera on a phone the facets read as a crumpled sheet.

               And round all the way out now: every corner is rounded to half
               the pad's width, so the ground is a circle with the crest of the
               rim on its edge and the rail curved along the crest. It was a
               round bowl in a square box, which is a crater in a packing case. */
            name: 'The Crater', par: 3, gravity: 0.45,
            needsLoft: true,   // a carry: there is no road along the floor
            blurb: 'Nothing stops out here. The rim of the crater is the only thing that will.',
            pads: [pad(0, 0, 8, 8), (function () {
                var p = pad(1.4, 20.4, 7.2, 7.2, 0);
                p.bumps = [channel(5, 24, 3.6, 2.2, 0.55)];
                p.round = { sw: 3.6, se: 3.6, nw: 3.6, ne: 3.6 };
                return p;
            })()],
            gaps: [{ x: -1, z: 7.6, w: 10, d: 1 }],
            tee: { x: 4, z: 2 }, cup: { x: 5, z: 24 }
        }),
        build({
            /* The heavy hole with a motor in it. Two steps of one point two
               and no ramp on to either — the same shape Highland's Stairway
               is, except that there the answer is a club that flies and here
               there is no such thing. What is left is the floor throwing the
               ball for you, and it is throwing something twice as heavy: a
               launch pad rated at fifteen reaches six and a quarter units at
               home and two and a half at the two and two fifths of a g this
               hole is played at, so a step of one point two is a step it
               clears with daylight to spare by the time the ball has travelled
               far enough forward to land on it. (It was thirteen, which was
               enough only for the old flat driver skimming in at full pace.)

               The pads are the Helter Skelter pads turned up a notch, and the
               rest of the difference is what is standing on them. */
            name: 'Deadlift', par: 3, gravity: 2.4,
            /* It used to be played with the long game's bag, and — against
               everything above — holed with the driver flown over both steps.
               With the mallet alone the pads did lift a rolled ball a step at
               a time, but each pad stood two units short of its riser, so a
               ball that missed one ran on past it and jammed against the step
               behind, and nothing in a mini bag gets it off that.

               So each pad is up against its riser now, and two banks in front
               of each step make a funnel that turns any ball rolling at the
               step on to the pad. The hole is what the comment always said it
               was: a floor that throws the ball for you, a step at a time. The
               bot holes it in three from anywhere on the bottom floor and in
               two from the middle step. */
            blurb: 'Two steps up, no ramps, and the pads have twice the weight to lift. Roll it at the step and let the funnel find the pad.',
            pads: [
                pad(0, 0, 7, 10),
                sprung(3.5, 8.7, 1.2, 15),
                pad(0, 10, 7, 6, 1.2),
                sprung(3.5, 14.7, 1.2, 15, 1.2),
                pad(0, 16, 7, 8, 2.4)
            ],
            extra: [
                bank(1.2, 9, 2.9, -0.62), bank(5.8, 9, 2.9, 0.62),
                bank(1.2, 15, 2.9, -0.62, { base: 1.1 }), bank(5.8, 15, 2.9, 0.62, { base: 1.1 })
            ],
            tee: { x: 3.5, z: 2 }, cup: { x: 3.5, z: 20.5 }
        }),
        build({
            /* Orbit, which replaced The Mouth — a pipe hole the owner called
               no fun, and he was right: twenty-four units of nothing and one
               way across it is a puzzle with one answer, not a shot.

               This is a shot. A gravity anomaly sits in the middle of the yard
               (`wells`, physics.js) and the cup is round the far side of it, so
               the straight line runs into the thing and the good line runs
               past it: close enough that it bends the ball in towards the pin,
               not so close that it keeps it. At half a g the pull is most of
               what the ball feels, which is the reason it is on this course. */
            name: 'Orbit', par: 3, gravity: 0.5,
            blurb: 'A gravity well in the middle of the yard and the cup round the back of it. Swing past and let it hand you the pin.',
            pads: [pad(0, 0, 16, 22)],
            wells: [{ x: 8.5, z: 11, pull: 13, core: 0.85 }],
            tee: { x: 4, z: 2 }, cup: { x: 10.5, z: 19.5 }
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
       are wide for the same reason: a landform needs room to be a landform,
       and a ridge with six units either side of it is a speed bump.

       The two things it borrows from the courses either side of it are the
       ones that turned out to be about ground rather than about furniture. A
       green may be a disc laid into the heather (Whinstone’s trick), and a row
       of `bands` may tilt and carry its level into the next one, so a hole
       climbs to a shelf or lies on the side of a hill instead of standing on a
       table. **The Beacon** is entirely the second of those: twenty units of
       fairway rising at a ninth, and a green you cannot see from the tee
       because it is over the shoulder of the climb rather than behind a hump
       somebody drew.

       It has water now, too, and moorland water rather than parkland water:
       a burn down the inside of Gorse Corner, a tarn on the summit beside the
       Beacon's green, and on Long Ling a burn across the lay-up and a pond off
       the green. And a hole is built for the bag it is played with (PLAN.md
       §0): the trouble is where a drive off that tee comes down.

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
            /* A crest across the driving line, and the bells beyond it: two
               pot bunkers seven units deep lying exactly where a full drive
               off a flat tee runs out, with a neck of fairway under two units
               wide between them on the line to the flag. Thread it, go round
               either side, or stop short of the pair — and then a climb on to
               the shelf the green sits on, with a hollow off its right side.

               The crest is overlapping humps rather than one wide one because
               a single raised cosine wide enough to cross a hole is also tall
               enough in the middle to be a pimple; three at a third of the
               height each add along their line into a ridge with a flat top.
               It sits in a flat row, and so do the bells (an inlay across a
               row seam is not flush). */
            var field = ridge(5, 17, 17, 17, 6, 0.6, 3)
                .concat(massif(-3.5, 15, 11, 2.5, 5))
                .concat([hill(20.5, 55, 3, -0.6), hill(19, 22, 3, -0.5)]);
            var heath = commons(0, [
                [6,                     [7, rgh], [8, fwy], [7, rgh]],
                [18,                    [7, rgh], [8, fwy], [7, rgh]],
                [16,                    [5, rgh], [12, fwy], [5, rgh]],
                [3,                     [6, rgh], [10, fwy], [6, rgh]],
                [{ d: 5, sz: 0.24 },    [6, rgh], [10, fwy], [6, rgh]],
                [14,                    [6, rgh], [10, fwy], [6, rgh]],
                [3,                     [22, rgh]]
            ]);
            var ground = shape(scoop(heath.pads, { seed: 3 }), field);
            return build({
                name: 'Bell Heather', par: 4, long: true, shaped: true, open: true,
                blurb: 'Over the ridge and between the bells — or short of them. Then a climb to a shelf with a hollow beside it.',
                pads: ground.concat([
                    inlay(ground, 8.3, 32.5, 1.9, snd, 3.6),
                    inlay(ground, 13.9, 33.5, 1.9, snd, 3.6),
                    inlay(ground, 11.5, 55.5, 4.6, grn, 3.4)
                ]),
                fence: widen(heath.fence, 5, 5),
                extra: [].concat(
                    forest(2, 12, 0.6, 5, 3, 8103, { gap: 2.2, clear: [keep(1.5, 19, 4.4)] }),
                    forest(-3, 38, 1.8, 16, 7, 8105, { gap: 2.6, clear: [keep(1.5, 19, 5)] }),
                    forest(25, 40, 1.8, 15, 7, 8107, { gap: 2.6, clear: [keep(20.5, 16, 4.5)] }),
                    crags(1.5, 19, 3.4, 5, 8101, { s: 1.3, h: 1.0 }),
                    crags(20.5, 16, 3, 4, 8117, { s: 1.15, h: 0.9 }),
                    [tree(2.2, 55), tree(4, 58)]
                ),
                tee: { x: 11, z: 2 }, cup: { x: 11.5, z: 55.5 }
            });
        })(),
        (function () {
            /* A real dogleg. North off a knoll, then hard right along the top
               to a green that is wide across the second leg and shallow from
               the south. The inside of the corner is a moorland burn with gorse
               on its far bank, and beyond the gorse a strip of fairway that
               runs up to the turn.

               Two ways round. The long way is the fairway up the left to the
               corner — a full drive runs through it into the bunker at the
               top, so it is three quarters of a swing — and an approach along
               the length of the green. The short way is a full drive over the
               burn on to the strip: only a full one carries it (anything less
               is wet), and it leaves the approach across the green's shallow
               side rather than down its length.

               The whole hillside falls away to the left (`tilt`), a thirtieth
               of a unit for every one across, so the safe side is also the side
               the ground is taking you to. */
            var field = [hill(-2, 41, 4, -0.7)]
                .concat(massif(35, 18, 11, 2.0, 5));
            var heath = commons(0, [
                [{ d: 5, y: 1.6 },     [2, rgh], [8, fwy], [26, rgh]],
                [{ d: 3, sz: -0.45 },  [36, rgh]],
                [14,                   [2, rgh], [9, fwy], [25, rgh]],
                [14,                   [2, rgh], [9, fwy], [6, rgh], [6, fwy], [13, rgh]],
                [8,                    [2, rgh], [28, fwy], [6, rgh]],
                [{ d: 3, sz: 0.25 },   [18, rgh], [14, fwy], [4, rgh]],
                [10,                   [20, rgh], [14, fwy], [2, rgh]],
                [3,                    [36, rgh]]
            ], { e: 14 });
            var ground = shape(tilt(scoop(heath.pads, { seed: 7 }), 0.032, 0, 0, 0), field);
            /* The burn runs down the inside of the corner in a hollow of its
               own, narrow enough that its banks stay off both fairways. */
            var lobes = burn([[14.1, 9.6], [13.8, 17], [14.2, 25], [14, 33.4]], 1.9, 1.1, 8313);
            var wet = clearOf(lobes, 0.5);
            return build({
                name: 'Gorse Corner', par: 4, long: true, shaped: true, open: true,
                blurb: 'A dogleg right round a burn and a bank of gorse. Go round, or carry the burn to the strip of fairway beyond it.',
                pads: ground.concat([
                    inlay(ground, 6, 40, 1.6, snd, 2.0),
                    inlay(ground, 28, 51, 4.4, grn, 2.2)
                ]),
                fence: widen(heath.fence, 5, 5),
                water: [pond(ground, lobes)],
                extra: [].concat(
                    forest(16.9, 15, 0.45, 5, 4, 8315, { gap: 2, clear: wet }),
                    forest(25, 25, 0.7, 9, 6, 8317, { gap: 2.2, clear: [keep(30, 26, 4)] }),
                    forest(1, 21.5, 0.6, 12.5, 5, 8319, { gap: 2.2 }),
                    forest(-3, 30, 1.8, 20, 8, 8321, { gap: 2.6 }),
                    forest(39, 32, 1.8, 20, 8, 8323, { gap: 2.6 }),
                    crags(30, 26, 3, 5, 8311, { s: 1.3, h: 1.0 }),
                    [tree(35, 48), tree(35, 54)]
                ),
                tee: { x: 6, z: 2.5 }, cup: { x: 28, z: 51 }
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
               you and it is higher than both of you. It is long and thin —
               ten units down the line and under five across — and it lies on
               the summit beside a tarn, so a pulled approach is wet and a
               pushed one is on the mound off its right side. A pot bunker on
               the face of the climb waits where the drive stops.

               The climb is what makes this a three-shot par four for anybody:
               a driver launched off a slope of a fifth lands almost at once,
               so the second goes a dozen units up the hill rather than thirty.
               That is the hole, and it is why it is shorter than the others. */
            var field = [].concat(
                massif(-4, 21, 10, 1.7, 5),
                [hill(20.5, 51, 2.5, 0.45), hill(6.5, 35, 3.6, 0.4)]
            );
            var heath = commons(0, [
                [6,                     [5, rgh], [9, fwy], [8, rgh]],
                [{ d: 9,  sz: 0.14 },   [6, rgh], [8, fwy], [8, rgh]],
                [{ d: 11, sz: 0.21 },   [6, rgh], [8, fwy], [8, rgh]],
                [{ d: 6,  sz: 0.15 },   [6, rgh], [9, fwy], [7, rgh]],
                [{ d: 5, sz: -0.07 },   [5, rgh], [12, fwy], [5, rgh]],
                [5,                     [6, rgh], [11, fwy], [5, rgh]],
                [16,                    [10, rgh], [10, fwy], [2, rgh]],
                [3,                     [22, rgh]]
            ]);
            var ground = shape(scoop(heath.pads, { seed: 17 }), field);
            // The tarn on the summit, in a hollow and off the green's left.
            var tarn = mere(5.4, 50.5, 2.4, 6.4, 1.9, 8241);
            var lake = pond(ground, tarn);
            return build({
                name: 'The Beacon', par: 4, long: true, shaped: true, open: true,
                blurb: 'Four units of climb, and over the top a long thin green with a tarn beside it.',
                pads: ground.concat([
                    inlay(ground, 14.5, 21, 1.5, snd, 2.2),
                    inlay(ground, 13.5, 51, 2.3, grn, 5.0)
                ]),
                fence: widen(heath.fence, 5, 5),
                water: [lake],
                extra: [].concat(
                    forest(1.8, 16, 0.6, 8, 4, 8243, { gap: 2.2 }),
                    forest(20.2, 33, 0.6, 5, 4, 8245, { gap: 2.2 }),
                    forest(-3, 30, 1.8, 16, 7, 8247, { gap: 2.6, clear: [keep(2.6, 28, 5.2), keep(-1.5, 50, 3.6)].concat(clearOf(tarn)) }),
                    forest(25, 30, 1.8, 16, 7, 8249, { gap: 2.6, clear: [keep(19.4, 24, 4.2)] }),
                    crags(2.6, 28, 3.6, 6, 8231, { s: 1.4, h: 1.1 }),
                    crags(19.4, 24, 3, 4, 8237, { s: 1.2, h: 0.95 }),
                    crags(-1.5, 50, 2.5, 4, 8239, { s: 1.2, h: 0.9 })
                ),
                tee: { x: 10, z: 3 }, cup: { x: 13.5, z: 53 }
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
                [{ d: 4, sz: -0.1 },    [20, rgh]],
                [20,                    [20, rgh]]
            ], { w: 16, e: 16 });
            var ground = shape(scoop(heath.pads, { seed: 5 }), field);
            return build({
                name: 'The Waste', par: 3, long: true, shaped: true, open: true,
                blurb: 'Off a shelf, over the waste, to a round green at the bottom of a bowl between two hills.',
                pads: ground.concat([
                    inlay(ground, 10, 10, 8, snd, 2.0),
                    circle(10, 21, 3.0, grn, 0.3)
                ]),
                fence: widen(heath.fence, 4, 4),
                extra: [].concat(
                    crags(-4, 17, 3.5, 6, 8353, { s: 1.4, h: 1.1 }),
                    crags(24, 15, 3.2, 5, 8363, { s: 1.3, h: 1.0 })
                ),
                tee: { x: 10, z: 2.5 }, cup: { x: 10, z: 21 }
            });
        })(),
        (function () {
            /* Three shots and each its own question. The drive goes over a
               shoulder and down the far side; the second is a lay-up, because
               a moorland burn seven units wide lies across the hole where a
               full one off the valley floor would run out and nothing in the
               bag carries it from there; and the third is a full club over the
               whorl to a green with a pond off its left side.

               The whorl sits in the middle of the third shot, so the lie you
               get for the approach is decided by which arm of it you finished
               on. From the tee it looks like one slope. And a swale across the
               front of the green, which is the Biarritz idea done in grass
               rather than in a putting surface: three overlapping hollows lying
               across the line, so a running approach is thrown up in the air
               short of the green and the only shot that gets close is the one
               that carries all of it. Both sit in flat rows; the burn's banks
               are a unit of rough either side, the way Ashdown's is. */
            var field = ridge(5, 17.5, 17, 17.5, 5.5, 0.55, 3)
                .concat(massif(-5, 40, 12, 2.1, 5))
                .concat(whorl(11, 69.5, 1.5, 3, 3.2, 0.3, 9, 1.5))
                .concat(ridge(10, 84, 16, 84, 2.5, -0.38, 3))
                .concat([hill(19.5, 17, 2.5, -0.55)]);
            var heath = commons(0, [
                [6,                     [5, rgh], [9, fwy], [8, rgh]],
                [{ d: 6, sz: 0.19 },    [6, rgh], [8, fwy], [8, rgh]],
                [11,                    [6, rgh], [8, fwy], [8, rgh]],
                [{ d: 5, sz: -0.22 },   [6, rgh], [8, fwy], [8, rgh]],
                [4,                     [6, rgh], [10, fwy], [6, rgh]],
                [{ d: 5, sz: -0.16 },   [7, rgh], [9, fwy], [6, rgh]],
                [17,                    [7, rgh], [9, fwy], [6, rgh]],
                [9,                     [22, rgh]],
                [13,                    [7, rgh], [9, fwy], [6, rgh]],
                [{ d: 4, sz: 0.16 },    [7, rgh], [10, fwy], [5, rgh]],
                [16,                    [9, rgh], [10, fwy], [3, rgh]],
                [3,                     [22, rgh]]
            ], { w: 16 });
            var ground = shape(scoop(heath.pads, { seed: 11 }), field);
            /* The burn across the valley and the pond off the green's left,
               each in a hollow: the burn kept inside its own nine-unit row,
               the pond a unit and more off the mown line. */
            var water = [
                pond(ground, burn([[-11, 58.7], [0, 58.0], [9, 59.1], [18, 58.2], [31, 58.8]], 2.2, 1.2, 8379)),
                pond(ground, mere(3.4, 88, 2.4, 6, 2.0, 8381))
            ];
            return build({
                name: 'Long Ling', par: 5, long: true, shaped: true, open: true,
                blurb: 'Over a shoulder, then lay up short of the burn. A long third over the whorl and the swale, with a pond off the left of the green.',
                pads: ground.concat([
                    inlay(ground, 8, 30, 2.0, snd),
                    inlay(ground, 16, 49, 1.5, snd, 2.0),
                    inlay(ground, 12.5, 90, 3.6, grn, 3.2)
                ]),
                fence: widen(heath.fence, 5, 5),
                water: water,
                extra: [].concat(
                    forest(2, 20.5, 0.6, 11.5, 6, 8383, { gap: 2.2 }),
                    forest(-3.5, 32, 1.8, 18, 8, 8385, { gap: 2.6 }),
                    forest(25, 34, 1.8, 18, 8, 8387, { gap: 2.6, clear: [keep(19.6, 15, 4.6)] }),
                    crags(19.6, 15, 3.2, 5, 8377, { s: 1.3, h: 1.0 }),
                    [tree(20, 87), tree(20, 92)]
                ),
                tee: { x: 9.5, z: 3 }, cup: { x: 12.5, z: 90 }
            });
        })(),
        (function () {
            /* The ravine. It is not a water hazard and it is not a bunker: it
               is ground, two units below the ground either side of it, that
               you are perfectly entitled to play out of and will wish you had
               not had to.

               The tee is on a bluff three and a half units up, and that is what
               makes it a wager rather than a lay-up: off that height a full
               drive carries the whole gorge and only just — a seventh off the
               swing lands on the far bank and rolls back to the floor. So take
               it on and the hole is a drive and a pitch; lay up short of the
               near lip and the second is a full drive over it, and the green is
               a third.

               The far bank climbs to a shelf, with a cross bunker short of it
               and the ground falling away behind, so the approach is uphill
               and has to stop between the two. The gorge is carved (`gully`)
               on a line that bends a unit either way, inside a band of rough
               of its own, and it runs off both edges of the ground — so there
               is no way round it, and the stakes stand back. */
            var cut = gully([[-16, 23.4], [-5, 22.9], [4, 23.7], [12, 22.9], [21, 23.6], [36, 23.1]], 8305, { scale: 0.9 });
            var field = massif(24, 12, 11, 1.8, 5)
                .concat([hill(17.5, 38, 2.5, -0.6), hill(2.5, 59, 2.4, 0.5)]);
            var heath = commons(0, [
                [{ d: 5, y: 3.6 },      [4, rgh], [9, fwy], [7, rgh]],
                [{ d: 4, sz: -0.6 },    [20, rgh]],
                [{ d: 6, sz: -0.2 },    [4, rgh], [9, fwy], [7, rgh]],
                [7,                     [4, rgh], [9, fwy], [7, rgh]],
                [12,                    [20, rgh]],
                [{ d: 5, sz: 0.22 },    [4, rgh], [10, fwy], [6, rgh]],
                [{ d: 4, sz: 0.13 },    [4, rgh], [10, fwy], [6, rgh]],
                [8,                     [4, rgh], [11, fwy], [5, rgh]],
                [{ d: 3, sz: 0.25 },    [5, rgh], [10, fwy], [5, rgh]],
                [10,                    [5, rgh], [10, fwy], [5, rgh]],
                [{ d: 3, sz: -0.3 },    [20, rgh]]
            ], { e: 16 });
            return build({
                name: 'The Ravine', par: 4, long: true, shaped: true, open: true,
                blurb: 'Off the tee and over a gorge two units deep, or lay up short of it. The green sits on a shelf behind a bunker.',
                pads: (function (g) {
                    return g.concat([
                        inlay(g, 10, 48.5, 3.0, snd, 1.6),
                        inlay(g, 10, 59.5, 4.4, grn, 3.4)
                    ]);
                }(carve(shape(scoop(heath.pads, { seed: 13 }), field), cut, { rock: true }))),
                fence: widen(heath.fence, 5, 5),
                extra: [].concat(
                    forest(1.7, 15, 0.5, 5, 3, 8299, { gap: 2.2 }),
                    forest(-3, 34, 1.8, 18, 7, 8301, { gap: 2.6, clear: [keep(2.4, 38, 4.5)] }),
                    forest(23, 34, 1.8, 18, 7, 8303, { gap: 2.6, clear: [keep(17.6, 40, 4)] }),
                    crags(2.4, 38, 3, 5, 8291, { s: 1.2, h: 0.8 }),
                    crags(17.6, 40, 2.6, 4, 8297, { s: 1.1, h: 0.75 }),
                    [tree(18.3, 58), tree(18.3, 61)]
                ),
                tee: { x: 9.5, z: 2.5 }, cup: { x: 10, z: 59.5 }
            });
        })()
    ];


    /* ── the long game, the fourth of four: Redstone Canyon ────────────────

       Ashdown Park is a park, Whinstone is a dune field and Dunmore is a moor.
       All three are made of ground that rises: a crest, a shoulder, a hillside
       with the green over the top of it. This one is made of ground that is
       *missing*.

       It was built first as a plain with gorges carved into it — two or three
       units down, banked on the far side so a ball in the bottom could be
       played out — and the owner sent it back with one line: the Grand
       Canyon ones want some really high cliffs. A carved gorge cannot have
       them. Its walls are ground, and ground that steep is a cosine with a
       grassy lip; past three units deep it is also a trap, because nothing in
       the bag climbs out of a lie at the foot of a wall.

       So since v1.130.0 the course is built the other way up. The floor of
       the canyon is the bottom of the world (`CANYON_FLOOR`, four units down,
       with the Colorado's thread of water in it), and every piece of ground
       that is played stands on its own walls out of it: a plateau, a rim, a
       bench, a butte, each a `butte` — a disc that `stands`, so its face is
       rock the ball bounces off, and `sheer`, so the face goes all the way
       down. The holes are what is left standing. The faces are four to
       fourteen units tall and banded by height (themes → `strata`), so the
       same beds run level across every wall on the hole, which is what makes
       it read as a canyon rather than as a table.

       Two rules came with it, and both are about the floor:

       - **The floor is out of play wherever it is** (`pad.oob`). A ball that
         goes over an edge falls the whole height of the wall, lands where you
         can see it, and costs a stroke and the shot again — the same as
         water. That is the hazard every hole is built round, and it is also
         the answer to the lie the carved gorges had: there is no foot of a
         tall wall anywhere on the course that a ball can be played from. The
         walls that stand *on* playable ground are short ones — a band behind
         a green, a rim beside a fairway — and the target is always away from
         them.
       - **Nothing standing overlaps anything at its own height.** Two slabs
         with their tops at one level flicker against each other, so where a
         step joins two pieces of ground it is a real step, and a bridge sits
         a hair under the ground at either end of it.

       The rough is scrub and the furniture is stone: `crags` and nothing
       else, which is what a canyon rim has on it — kept well in from the
       edges, because a stone half over the drop is a stone in mid-air
       (audit → prop-afloat). */

    var CANYON_FLOOR = -4;   // the bottom of the canyon, and out of play
    var MESA = 3.2;          // how far a mesa stands above the ground round it

    /* A piece of the canyon country standing on its own walls: Coral Keys'
       `cliff` without the beach under it. The edge is `coast`'s seeded
       wave — `wild` how much, `bays` the canyon let in further — and `sx`/`sz`
       tilt it about its own middle, which keeps `y` the height there. */
    function butte(cx, cz, rx, rz, y, o) {
        o = o || {};
        var p = coast(circle(cx, cz, rx, o.kind || 'rough', y, rz),
            o.wild === undefined ? 0.06 : o.wild, keySeed(cx, cz, rx, o), o.bays);
        p.inlay = false;
        p.stands = true;
        p.sheer = true;
        if (o.sx || o.sz) {
            p.sx = o.sx || 0;
            p.sz = o.sz || 0;
            p.y = y - p.sx * (cx - p.x) - p.sz * (cz - p.z);
        }
        return p;
    }

    /* Bare rock: a piece of the country that is out of play wherever it is
       (`oob`), drawn without grass on it. */
    function rock(p) { p.oob = true; return p; }

    /* A butte nobody plays — a temple, in the canyon's own word: tiers of
       bare rock, each standing inside the one below it, so its skyline steps
       in the way the beds it is cut from do rather than standing up as one
       drum. `r` is the base's half-width, `top` the height of the cap. */
    function temple(cx, cz, r, top, o) {
        o = o || {};
        var tiers = o.tiers || [[1, 0.45], [0.72, 0.76], [0.46, 1]];
        return tiers.map(function (t, i) {
            return rock(butte(cx + (o.lean || 0) * i, cz + (o.leanZ || 0) * i, r * t[0], r * t[0] * (o.rz || 1.15),
                CANYON_FLOOR + (top - CANYON_FLOOR) * t[1], { wild: 0.13, seed: (o.seed || 0) + i * 37 + 5 }));
        });
    }

    /* The bench a rim stands on: the same outline grown by `grow`, `drop`
       under the top, and bare — so the wall under a plateau is two cliffs
       with a step of rock between them, as the canyon's are, and a ball
       that goes over the edge is out on the step or on the floor alike. */
    function ledge(p, drop, grow, seed) {
        var cx = p.x + p.w / 2, cz = p.z + p.d / 2;
        return rock(butte(cx, cz, p.rx + grow, p.rz + grow,
            G3.physics.padHeight(p, cx, cz) - drop, { wild: 0.1, seed: seed || 11 }));
    }

    /* A Redstone hole: the pieces it is made of, stood on the canyon floor.
       The floor runs eighteen units past the stakes, so a ball that crosses
       the boundary lands on something, and it is out of play everywhere —
       inside the stakes as well as past them. `river` is the water in the
       bottom: `burn`'s lobes laid into the floor as a pond, so it is held in
       by the floor's own ground. */
    function redrock(h) {
        var f = h.fence, M = 18;
        var floor = pad(f.x - M, f.z - M, f.w + 2 * M, f.d + 2 * M, CANYON_FLOOR, 'rough');
        floor.oob = true;
        var ground = [floor];
        var r = h.river;
        var water = r ? [pond(ground, burn(r.pts, r.r, r.depth, r.seed))] : [];
        return build({
            name: h.name, par: h.par, long: true, shaped: true, open: true,
            blurb: h.blurb,
            pads: ground.concat(h.pads),
            fence: f,
            water: water,
            extra: h.extra || [],
            tee: h.tee, cup: h.cup
        });
    }

    var redstone = [
        (function () {
            /* The introduction, and it says the one thing the player has to
               understand before any of the other five make sense: the canyon
               lies exactly where a drive comes down, and there is nothing at
               the bottom of it but the floor.

               The gorge is nine units across, starting fourteen out, and the
               far side stands a unit and a half higher than the tee — so the
               first thing on the hole is its far wall, six units of red rock
               square across the line, with the river at the foot of it. That
               is the whole of the drive: only a struck driver is still high
               enough twenty-four units out to land on top, and anything less
               meets the wall and goes down it. Carry it and the second is a
               short iron. Lay up on the near side (a seven iron) and the
               second has to climb over the wall and still leaves a putt — par
               either way, and the birdie is for the drive.

               Long is a cliff band three units over the far plateau, so a hot
               approach comes back off rock rather than going over the back.
               Three temples stand round it, the tallest nine and a half units
               up: the first piece of Grand Canyon anybody sees. */
            var near = butte(10, 1, 15, 14, 0.6, { wild: 0.07, bays: [[-6, 8, 0.1, 0.3], [27, -4, 0.08, 0.3]] });
            var far = butte(11, 43, 15, 20, 2.0, { wild: 0.07, bays: [[-6, 40, 0.1, 0.25], [28, 52, 0.09, 0.3]] });
            var band = rock(butte(12, 66, 14, 6.5, 5.4, { wild: 0.1 }));
            return redrock({
                name: 'First Cut', par: 4,
                blurb: 'A canyon right where the drive comes down. Carry all of it, or lay up and carry it with the second.',
                pads: [near, far, band, ledge(near, 2.0, 2.0, 1), ledge(far, 2.4, 2.0, 2)].concat(
                    temple(-8, 20, 5, 9.4),
                    temple(35, 26, 6.5, 7.6, { seed: 3, lean: 0.6 }),
                    temple(-16, 46, 7, 6.4, { seed: 5, leanZ: -0.8 }), [
                    lay(near, 10, 2.5, 4.6, 8.5, 'fairway'),
                    lay(far, 11, 35.5, 5.2, 8.5, 'fairway'),
                    lay(far, 16.6, 49, 1.5, 1.2, 'sand', { wild: 0.05 }),
                    lay(far, 11.5, 54, 4.6, 4.4, 'green', { wild: 0.05 })
                ]),
                fence: { x: -2, z: -6, w: 26, d: 68 },
                river: { pts: [[-16, 19.8], [0, 19.0], [14, 20.2], [28, 19.2], [39, 20.0]], r: 1.8, depth: 0.6, seed: 9105 },
                extra: [].concat(
                    crags(1.5, -2, 2.2, 4, 9101, { s: 1.3, h: 1.0 }),
                    crags(19.5, 4, 2.2, 3, 9107, { s: 1.2, h: 0.9 }),
                    crags(21, 37, 2.2, 4, 9109, { s: 1.2, h: 0.9 })
                ),
                tee: { x: 10, z: 0 }, cup: { x: 12, z: 54.5 }
            });
        })(),
        (function () {
            /* The same canyon turned a quarter turn, so it is not something to
               get over — it is the edge of the hole, running down the whole
               west side of it, and the plateau leans at it.

               The fairway is a ledge: the rim and a drop of six units on the
               left, a band of rock three units high on the right, and a
               bunker where the drive comes down on the side everybody bails
               to. A thirtieth of a unit of cross-fall for every one across is
               not much to look at, and it is all a ball rolling out on the
               left needs to find the edge.

               The green is the canyon's: out on a point below the rim, with
               the drop on three sides of it, so the approach is played out
               over the void at a target that has nothing behind it. A step
               of a few tenths down from the plateau joins them, and the way
               in from the right is the only one with ground under it. */
            var main = butte(11.5, 27, 13.5, 34, 2.0, { wild: 0.06, sx: 0.02,
                bays: [[-6, 24, 0.1, 0.35], [-6, 40, 0.08, 0.3]] });
            var point = butte(0.5, 56, 8.4, 6.4, 1.4, { wild: 0.05 });
            return redrock({
                name: 'The Rim', par: 4,
                blurb: 'The canyon runs the length of the hole down the left, and the green is out on a point over it.',
                pads: [main, point, ledge(main, 2.4, 2.4, 3), ledge(point, 1.3, 1.8, 4),
                    rock(butte(28, 28, 6.5, 30, 5.4, { wild: 0.08 }))].concat(
                    temple(-16, 32, 5, 9.8, { seed: 7 }),
                    temple(-19, 4, 6.5, 7.0, { seed: 9, lean: -0.7 }), [
                    lay(main, 10, 17, 4.6, 19, 'fairway'),
                    lay(main, 8.5, 44, 4, 6, 'fairway'),
                    lay(main, 16.8, 33, 1.4, 2.4, 'sand', { wild: 0.05 }),
                    lay(point, 0, 56.2, 4.4, 4.0, 'green', { wild: 0.05 })
                ]),
                fence: { x: -7, z: -5, w: 33, d: 69 },
                river: { pts: [[-6, -19], [-5, 8], [-8, 30], [-10, 56], [-9, 79]], r: 1.8, depth: 0.6, seed: 9221 },
                extra: [].concat(
                    crags(20.5, 12, 2.2, 4, 9211, { s: 1.3, h: 1.0 }),
                    crags(18.5, 46, 2.2, 3, 9217, { s: 1.2, h: 0.9 })
                ),
                tee: { x: 11.5, z: 3 }, cup: { x: -0.5, z: 56.4 }
            });
        })(),
        (function () {
            /* A par three off a rim seven units up, across a gorge with the
               river in it, to a green on a mesa five units below the tee.

               Straight at the pin is a long downhill carry over the drop, and
               only a full iron gets there: the fall adds a quarter to every
               club, so a five iron at three quarters is the shot. The other
               way across is the stone bridge — a bench off to the east, a
               short iron away, joined to the green's mesa by an arch of rock
               two and a half units wide with the river running under it. Lay
               up on the bench and the second is a pitch over the gap or a putt
               down the bridge. Long is a cliff band behind the green, set into
               the mesa so there is no slot between them, that hands a hot one
               back; anything else that misses is on the floor. */
            var tee = butte(10, 0, 9, 7.5, 7.2, { wild: 0.05 });
            var mesa = butte(8, 24, 7.6, 6.4, 2.2, { wild: 0.06 });
            var bench = butte(23.5, 14.5, 5.5, 5, 3.0, { wild: 0.05 });
            /* The bridge: a road (a pad laid along a curve), drawn as a deck
               with daylight under it. Its ends lie inside the bench and the
               mesa, and it stands four tenths under the one and over the
               other — two pads sharing ground at one level would leave the
               ball's footing to the order they were written in — so the way
               across is two small steps down, and a putt only goes one way. */
            var bridge = road({ x: 19.4, z: 16.6, dir: -0.62, w: 2.6, y: 2.6, kind: 'fairway' },
                [['arc', 10, -0.85]]);
            bridge.hover = true;
            return redrock({
                name: 'Stone Bridge', par: 3,
                blurb: 'Off the rim and down on to a mesa over the river. Or out to the bench and across the stone bridge.',
                pads: [tee, mesa, bench, bridge, ledge(tee, 2.8, 2.0, 5), ledge(mesa, 1.9, 1.6, 6),
                    rock(butte(8, 33.6, 9.5, 5.5, 4.6, { wild: 0.1 }))].concat(
                    temple(-9, 20, 5.5, 9.0, { seed: 11 }),
                    temple(32, 33, 5.5, 8.4, { seed: 13, lean: 0.5 }), [
                    lay(tee, 10, 4.2, 2.0, 1.8, 'fairway'),
                    lay(bench, 23.5, 14.5, 3.6, 3.3, 'fairway'),
                    lay(mesa, 8, 23.6, 4.8, 4.0, 'green', { wild: 0.05 })
                ]),
                fence: { x: -2, z: -6, w: 33, d: 46 },
                river: { pts: [[-17, 13.5], [-2, 12.8], [11, 14.2], [16.6, 21], [19.5, 32], [24, 55]], r: 1.6, depth: 0.6, seed: 9303 },
                extra: [].concat(
                    crags(14.5, -2.5, 1.4, 3, 9301, { s: 1.2, h: 0.9 }),
                    crags(26.5, 11.5, 1.4, 3, 9307, { s: 1.1, h: 0.8 })
                ),
                tee: { x: 10, z: 4.2 }, cup: { x: 7.5, z: 24 }
            });
        })(),
        (function () {
            /* The canyon takes a bite out of the east half of the hole
               rather than crossing all of it, so for the first time there is a
               way round as well as a way over — and the two are not the same
               hole.

               The tee is up on a mesa, which is what makes the carry a
               question at all: two units of fall put a full drive's carry at
               about thirty, and the line at the flag crosses ten units of
               bite that end about thirty out — so a struck drive is just over
               and a mis-hit is in the bottom. What it buys is the pin dead
               ahead and nothing between.

               Round it is the west lane, seven and a half units wide, with
               rough waiting where a full drive down it runs out and a spring
               — the one oasis on the course — lying across the corner between
               there and a green set off to the east. So the safe drive is the
               one with the approach over water, and the brave one has
               none. Hugging the lip of the bite on the way past is the third
               answer, and the shortest, and the one with no margin either
               side.

               The far bank climbs and the near one does not, which is the rule
               every crossing on this course is built to — a near wall wide
               enough to play out of is a ramp a drive skips clean across the
               canyon off, and a far wall that does not climb is a two-unit
               cliff between a ball and the rest of the hole. */
            /* The bite is carved (`gully`): it starts in a rounded end just
               east of the west lane — six units of fairway now, where it was
               seven and a half, which is what buys the end cap room to be a
               slope rather than a cliff — and runs out of the east side of
               the ground. Its line hardly wanders: it is held between two
               rows of fairway, so a unit either way would put a hollow on one
               of them. */
            var cut = gully([[13.6, 22.3], [20, 21.9], [28, 22.5], [42, 22.0]], 9403, { scale: 0.8 });
            var field = massif(-7, 28, 12, 2.3, 5)
                .concat(massif(36, 42, 12, 2.2, 5))
                .concat([hill(2.2, 15, 2.6, 0.4), hill(22.5, 15, 3, 0.45)]);
            var land = commons(-6, [
                [{ d: 6, y: 2.0 },     [3, rgh], [9, fwy], [14, rgh]],
                [5,                    [3, rgh], [9, fwy], [14, rgh]],
                [{ d: 4, sz: -0.5 },   [26, rgh]],
                [12,                   [3, rgh], [15, fwy], [8, rgh]],
                [10,                   [3, rgh], [6, fwy], [17, rgh]],
                [6,                    [3, rgh], [17, fwy], [6, rgh]],
                [2,                    [9, rgh], [12, fwy], [5, rgh]],
                [{ d: 4, sz: 0.12 },   [9, rgh], [12, fwy], [5, rgh]],
                [8,                    [16, rgh], [8, fwy], [2, rgh]],
                [8,                    [3, rgh], [21, fwy], [2, rgh]],
                [3,                    [26, rgh]]
            ], { m: 14 });
            var ground = carve(shape(land.pads, field), cut, { rock: true });
            /* The spring is a pool in a hollow, held inside its own cell of
               rough with fairway on three sides of it — which is why it is
               smaller than the box it used to be. */
            var spring = pond(ground, mere(12.1, 47, 2.4, 2.3, 1.9, 9413));
            return build({
                name: 'Long Way Round', par: 4, long: true, shaped: true, open: true,
                blurb: 'Off the mesa with the canyon eating the right half of the fairway. Carry it at the flag, or go round and come in over the spring.',
                pads: ground.concat([
                    inlay(ground, 20.5, 52, 4.2, grn, 4.2)
                ]),
                fence: widen(land.fence, 5, 5),
                water: [spring],
                extra: [].concat(
                    crags(4.5, 42, 2.6, 5, 9401, { s: 1.3, h: 1.0 }),
                    crags(23.5, 40, 2.6, 4, 9407, { s: 1.25, h: 0.95 }),
                    crags(1.4, 52, 2.4, 4, 9411, { s: 1.2, h: 0.9 })
                ),
                tee: { x: 7.5, z: -3.5 }, cup: { x: 20.5, z: 53 }
            });
        })(),
        (function () {
            /* The canyon meanders, so it crosses twice and the fairway
               between the crossings is an island sixteen units long, set off
               to the east of the line, with a wall at each end of it.

               The first crossing is the drive's. The tee is on a mesa and the
               canyon begins twenty-two units out, so a full one off the top
               just reaches the island and anything less is in the bottom —
               or it is laid up short on the plain, and the hole becomes a six
               with a canyon in front of each of the next two shots. The
               second crossing is the second shot's, played from the island
               back west to the last leg, and the green is round behind a
               bunker short-right. Switchback because the fairway does: west,
               east, west. */
            /* Both crossings are carved (`gully`), each in an eleven-unit
               band of rough so it has room to bend — which took a unit off
               the plain before the first, two off the island and one off the
               last leg, and moved nothing else — and both run out of both
               sides of the ground, so neither has a way round. */
            var one = gully([[-16, 25.2], [-4, 24.6], [8, 25.8], [19, 24.7], [30, 25.6], [46, 25.0]], 9503, { scale: 0.85 });
            var two = gully([[-16, 50.4], [-3, 51.2], [9, 50.1], [21, 51.0], [33, 50.2], [46, 50.8]], 9505, { scale: 0.85 });
            var field = massif(38, 16, 12, 2.2, 5)
                .concat(massif(-9, 44, 11, 2.0, 5))
                .concat(massif(38, 74, 12, 2.3, 5))
                .concat([hill(16, 43, 3.2, -0.4), hill(26, 13, 3, 0.45), hill(24, 64, 3, 0.4)]);
            var land = commons(0, [
                [{ d: 5, y: 2.0 },     [3, rgh], [10, fwy], [17, rgh]],
                [{ d: 4, sz: -0.5 },   [30, rgh]],
                [15,                   [3, rgh], [13, fwy], [14, rgh]],
                [11,                   [30, rgh]],
                [14,                   [9, rgh], [14, fwy], [7, rgh]],
                [11,                   [30, rgh]],
                [10,                   [5, rgh], [14, fwy], [11, rgh]],
                [{ d: 4, sz: 0.15 },   [4, rgh], [13, fwy], [13, rgh]],
                [14,                   [4, rgh], [13, fwy], [13, rgh]],
                [3,                    [30, rgh]]
            ], { w: 14, e: 14 });
            return build({
                name: 'Switchback', par: 5, long: true, shaped: true, open: true,
                blurb: 'Off the mesa and over the canyon to an island of fairway, over it again, and back the other way to the green.',
                pads: (function (g) {
                    return g.concat([
                        inlay(g, 14.5, 77.5, 1.4, snd, 1.8),
                        inlay(g, 9.5, 81, 4.6, grn, 4.4)
                    ]);
                }(carve(shape(land.pads, field), one.concat(two), { rock: true }))),
                fence: widen(land.fence, 5, 5),
                extra: [].concat(
                    crags(1.8, 40, 2.6, 5, 9501, { s: 1.3, h: 1.0 }),
                    crags(27, 44, 2.6, 5, 9507, { s: 1.25, h: 0.95 }),
                    crags(25, 82, 2.6, 4, 9511, { s: 1.15, h: 0.85 })
                ),
                tee: { x: 8, z: 2.5 }, cup: { x: 9.5, z: 82 }
            });
        })(),
        (function () {
            /* The finish, and the course's real dogleg. The inside of the
               corner is a mesa: a table of scrub eighteen units by thirty-four
               standing MESA units above the fairway on sheer walls, which is
               higher than anything in the bag lifts a ball, so it is not
               carried, it is gone round. The tee is in the south-east corner,
               the fairway runs up the right of the mesa, and the hole turns
               hard left round its north-east corner — so the second shot is
               the wager: as tight to that corner as you dare, where a ball
               short and left meets rock and comes back, or wide and safe and
               a longer third.

               Then the canyon, across the whole hole at the end of the second
               leg, and a short climb on to the shelf the green is cut into: a
               ring of low rises round it, so the green is the floor of a
               hollow and a ball that reaches the rim is fed in.

               A mesa is a pad with a height of its own rather than a
               landform, because a landform is a slope and the one thing this
               needs is a wall: ground lifted clear of STEP_UP is a kerb the
               ball cannot climb, and the cut face is drawn in the canyon's
               rock colour. It is an oval disc that `stands` (below), not a
               bands cell, since a cell is a box. */
            /* The canyon is carved (`gully`) in an eleven-unit band and runs
               out of both sides. The mesa is no longer a bands cell: a cell
               is a box, and a box is the one shape a mesa never is. It is an
               oval disc of scrub standing MESA up on its own (the way The
               Ait's island stands), its edge waved like every other disc's
               and its walls the skirt colour — inscribed in the box it used
               to be, so it stays a unit clear of the fairway up its east
               side. */
            var cut = gully([[-14, 55.9], [-2, 56.5], [9, 55.7], [20, 56.4], [31, 55.8], [50, 56.2]], 9603, { scale: 0.85 });
            var mesa = shapeDisc(Object.assign(pad(3, 12, 18.5, 34, MESA, rgh), { r: 17, stands: true }));
            var field = massif(48, 24, 12, 2.2, 5)
                .concat(massif(-10, 70, 11, 2.1, 5))
                .concat(ring(9, 81, 7.4, 3.2, 0.42, 8))
                .concat([hill(12, 29, 5, 0.5), hill(30, 52, 3, -0.35)]);
            var land = commons(0, [
                [6,                    [22, rgh], [12, fwy], [4, rgh]],
                [6,                    [22, rgh], [12, fwy], [4, rgh]],
                [18,                   [22, rgh], [12, fwy], [4, rgh]],
                [16,                   [22, rgh], [14, fwy], [2, rgh]],
                [9,                    [3, rgh], [31, fwy], [4, rgh]],
                [11,                   [38, rgh]],
                [{ d: 4, sz: 0.3 },    [3, rgh], [14, fwy], [21, rgh]],
                [22,                   [3, rgh], [14, fwy], [21, rgh]],
                [3,                    [38, rgh]]
            ], { m: 12 });
            return build({
                name: 'Redstone', par: 5, long: true, shaped: true, open: true,
                blurb: 'Up the right of a mesa nothing flies, round its corner as tight as you dare, then over the canyon to a green in a hollow on the far shelf.',
                pads: (function (g) {
                    return g.concat([
                        mesa,
                        inlay(g, 9, 81, 4.0, grn, 4.0)
                    ]);
                }(carve(shape(land.pads, field), cut, { rock: true }))),
                fence: widen(land.fence, 5, 5),
                extra: [].concat(
                    crags(10, 18, 2.6, 5, 9601, { s: 1.35, h: 1.05 }),
                    crags(15, 40, 2.6, 4, 9607, { s: 1.25, h: 0.95 }),
                    crags(18.4, 28, 1.8, 4, 9613, { s: 1.3, h: 1.1 }),
                    crags(33, 72, 2.8, 4, 9611, { s: 1.2, h: 0.9 })
                ),
                tee: { x: 28, z: 3 }, cup: { x: 9.5, z: 82 }
            });
        })()
    ];

    /* Eighteen courses is far too long a list to read as one list, and the
       four kinds of golf on it are not variations of each other — a mini golf hole
       is one swing and a putt, a crazy golf hole is a machine you have to time,
       and a links hole is a drive and an approach. So the group is not a
       heading any more, it is a filter: the picker opens on one kind at a
       time, and a player who came for windmills never scrolls past fifty-four
       holes of parkland to reach them.

       `tint` is the group's colour in that picker and `icon` its mark. Both
       live here rather than in the menu, so a new course arrives already filed
       and a new group arrives already dressed. */
    /* ── Coral Keys: the long game round a coast ───────────────────────────

       Every other long course is one piece of country with trouble cut into
       it. This one is islands in a lagoon, and it was built twice.

       The first time (v1.95.0–v1.111) it was a string of small keys with
       nothing between them, so every shot was a carry to a target a few units
       across. The perfect bot played it ten under par; people found it too
       hard, and both were right. A player who strikes every ball where it
       meant to can thread anything, so the bot never saw what the course
       actually was — and with a person's misses (CONFIG.BOT_HANDS,
       tools/human-check.mjs) it averaged six over, with two balls in the sea
       a round on the worst holes. There was no shot on the card that was
       safe, so there was no shot on it that was brave either.

       So each hole is one big island now, and the sea is let into it rather
       than laid between pieces of it: a cove, a bay, a lagoon in the crook of
       a crescent. Every hole has a way round on dry land and a line across the
       water that saves a shot, and which one to take is the hole — the old
       "carry it or splash" became "carry it, or play round it a stroke
       longer". And the islands have height: a tee up on a headland, a shelf
       of turf above the beach, a green on a clifftop with the sea on three
       sides of it. A cliff is the other kind of trouble a coast has, and it
       is a kinder one than water — come up short of a shelf and the ball
       drops back on to the beach below it, a shot down rather than a stroke
       and a shot.

       An island is a disc of beach (`island`) with grass laid into it
       (`lay`), and the beach is still the mercy: sand holds whatever lands on
       it, so a ball that runs through the grass stops before the shore. Its
       outline is `coast` — the same seeded wave as before, gentler, because
       a big island is not a pebble — and its bays are dips in that outline
       (`bays`: physics.padRadius), so the physics, the shallows, the minimap
       and the slab are all drawn off the one shoreline. A disc is drawn from
       its own middle, so a bay always points at it; an island the shape of a
       C is a disc with one very deep bay.

       A cliff (`cliff`) is a disc that stands on the island, with sides
       (`stands`, as Redstone's mesa does), and grass laid on top of it.
       `sheer` is a sea cliff: one that hangs over the edge of its island and
       goes all the way down into the water (render.addPad).

       The water is one sheet under the lot, and the stakes are off: there is
       nowhere to go out of bounds that is not already wet. */
    var KEY_SEA = -0.6, KEY_SHORE = -0.28;
    // The shallows round an island, as the renderer draws them (render.addShelf):
    // a band on the water's surface, `out` units wide.
    var KEY_SHELF = { y: KEY_SEA + 0.02, out: 2.4 };
    /* A coastline rather than a mown edge. `shapeDisc` gives every disc the
       same gentle wobble; this is the same wave turned up and dealt per disc,
       seeded off where it is so it is the same island on every load. `wild`
       is how much — the most the shore comes in, as a fraction of the radius,
       is twice it — and `bays` are the sea let in further still, each named
       by a point it points at, how deep as a fraction of the radius, and how
       wide as a half-angle. The edge only ever bites inwards, so everything
       that measures a disc from outside by `pad.r` stays true, and `rIn` is
       the circle no bite can reach. */
    function coast(p, wild, seed, bays) {
        var rnd = seeded(seed), lobes = [1, 2, 3, 5], w = [], sum = 0, i, deep = 0;
        var cx = p.x + p.w / 2, cz = p.z + p.d / 2;
        for (i = 0; i < lobes.length; i++) { w.push(0.3 + rnd()); sum += w[i]; }
        p.wave = { bite: wild, terms: lobes.map(function (n, k) {
            return [n, wild * w[k] / sum, rnd() * Math.PI * 2];
        }) };
        if (bays && bays.length) {
            p.wave.bays = bays.map(function (b) {
                deep += b[2];
                return [Math.atan2(b[1] - cz, b[0] - cx), b[2], b[3]];
            });
        }
        p.rIn = Math.max(0.2, Math.min(p.rx, p.rz) * (1 - 2 * wild - deep));
        return p;
    }
    function keySeed(cx, cz, rx, o) {
        return Math.round(cx * 977 + cz * 7919 + rx * 131) + ((o && o.seed) || 0);
    }
    /* The island: flat beach at the shore line, with shallows round it. */
    function island(cx, cz, rx, rz, o) {
        o = o || {};
        var p = coast(circle(cx, cz, rx, 'sand', KEY_SHORE, rz),
            o.wild === undefined ? 0.05 : o.wild, keySeed(cx, cz, rx, o), o.bays);
        p.inlay = false;
        p.shelf = KEY_SHELF;
        return p;
    }
    /* Ground standing `h` above the beach, with sides: a headland the tee is
       on, a shelf above the fairway, a clifftop green. Scrub on top unless it
       says otherwise, so grass laid on it reads as mown. */
    function cliff(cx, cz, rx, rz, h, o) {
        o = o || {};
        var p = coast(circle(cx, cz, rx, o.kind || 'rough', KEY_SHORE + h, rz),
            o.wild === undefined ? 0.06 : o.wild, keySeed(cx, cz, rx, o), o.bays);
        p.inlay = false;
        p.stands = true;
        if (o.sheer) { p.sheer = true; p.shelf = KEY_SHELF; }
        return p;
    }
    /* Grass laid into an island or on top of a cliff: fairway, green, rough. */
    function lay(host, cx, cz, rx, rz, kind, o) {
        o = o || {};
        return coast(inlay([host], cx, cz, rx, kind, rz),
            o.wild === undefined ? 0.08 : o.wild, keySeed(cx, cz, rx, o) + 17, o.bays);
    }
    function palms(list) {
        return list.map(function (t, k) {
            return tree(t[0], t[1], { h: 2.8 + ((k * 7 + Math.round(t[0] + t[1])) % 5) * 0.2, palm: true });
        });
    }
    function keys(name, par, blurb, pads, trees, tee, cup) {
        var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        pads.forEach(function (p) {
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x + p.w);
            minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z + p.d);
        });
        // Far enough out that the edge of the hole's water is lost in the
        // haze rather than drawn across the sea in front of the camera.
        var M = 140;
        return build({
            name: name, par: par, long: true, open: true, calm: true, stakes: false,
            blurb: blurb,
            pads: pads,
            water: [rect(minX - M, minZ - M, maxX - minX + 2 * M, maxZ - minZ + 2 * M, KEY_SEA)],
            fence: { x: minX - 2, z: minZ - 2, w: maxX - minX + 4, d: maxZ - minZ + 4 },
            extra: palms(trees),
            tee: tee, cup: cup
        });
    }

    var coral = [
        (function () {
            var land = island(13, 18, 15, 17, { bays: [[32, 13.5, 0.85, 0.55]] });
            var head = cliff(9, 1, 4.4, 3.6, 2.6, { sheer: true });
            return keys('Landfall', 3, 'Over the cove at the flag, or round it on dry land and a pitch. The island is all yours either way.', [
                land, head,
                lay(head, 9, 1, 2.4, 2, 'fairway'),
                lay(land, 5, 19, 4.5, 7.5, 'fairway'),
                lay(land, 18.5, 28, 3.2, 2.8, 'green', { wild: 0.05 }),
                lay(land, 14, 9, 3.5, 2.5, 'rough', { wild: 0.14 }),
                lay(land, 10, 30, 3, 2, 'rough', { wild: 0.14 })
            ], [[9.5, 30], [11, 30.6], [2.5, 22]], { x: 9, z: 0.8 }, { x: 19, z: 28.5 });
        })(),

        (function () {
            var land = island(15, 39.5, 13, 39);
            var head = cliff(16, 3, 4.5, 3.6, 2.6, { sheer: true });
            var shelf = cliff(8, 52, 7, 25, 1.4, { sheer: true });
            return keys('The Shelf', 4, 'A shelf of turf above the beach, with the sea under its far edge. Drive up on to it for the open look, or stay low and pitch up.', [
                land, head, shelf,
                lay(head, 16, 3, 2.4, 2, 'fairway'),
                lay(shelf, 8.5, 44, 4.2, 13, 'fairway'),
                lay(shelf, 9, 65, 3.2, 3, 'green', { wild: 0.05 }),
                lay(land, 20, 36.5, 5, 16, 'fairway'),
                lay(land, 18, 13, 4, 4.5, 'rough', { wild: 0.14 }),
                lay(land, 21, 62, 3.5, 5, 'rough', { wild: 0.14 })
            ], [[21, 60], [22, 63.5], [18, 12]], { x: 16, z: 2.8 }, { x: 9, z: 65.5 });
        })(),

        (function () {
            var land = island(16, 17, 18, 17.5, { bays: [[16, 43, 0.7, 0.95]] });
            var head = cliff(16, 2.5, 4.4, 3.4, 2.6, { sheer: true });
            var key = island(16, 34.5, 6.5, 6.5);
            return keys('The Atoll', 4, 'A crescent of reef round a lagoon, and the green on a key in the middle of it. Drive the key, or take a horn and pitch across.', [
                land, head, key,
                lay(head, 16, 2.6, 2.4, 1.9, 'fairway'),
                lay(land, 16, 12.5, 7, 3.5, 'fairway'),
                lay(land, 5, 21.5, 3.2, 4.5, 'fairway'),
                lay(land, 27, 21.5, 3.2, 4.5, 'fairway'),
                lay(key, 16, 34.5, 4.2, 3.8, 'green', { wild: 0.05 }),
                lay(land, 6, 11, 3, 2.5, 'rough', { wild: 0.14 }),
                lay(land, 26, 11, 3, 2.5, 'rough', { wild: 0.14 })
            ], [[5.5, 11], [26.5, 11], [3, 22]], { x: 16, z: 2.4 }, { x: 16.5, z: 34.5 });
        })(),

        (function () {
            var land = island(15, 32, 13, 30, { bays: [[40, 69, 0.6, 0.6]] });
            var home = island(19, 83.5, 14, 14.5);
            var head = cliff(16, 3, 4.6, 3.6, 2.6, { sheer: true });
            return keys('Two Ways Home', 5, 'Two islands and a lagoon between them. Over it at the flag in two, or up the right and across the gap in three.', [
                land, home, head,
                lay(head, 16, 3, 2.4, 2, 'fairway'),
                lay(land, 14.5, 34, 5, 9.5, 'fairway'),
                lay(land, 11.5, 50, 3.5, 4, 'fairway'),
                lay(home, 12.5, 79, 3.5, 5.5, 'fairway'),
                lay(home, 24, 87, 4.4, 4, 'green', { wild: 0.05 }),
                lay(land, 22.5, 22, 2.8, 4, 'rough', { wild: 0.14 }),
                lay(home, 25, 77, 3, 3, 'rough', { wild: 0.14 })
            ], [[22.5, 21], [22, 24], [25, 77]], { x: 16, z: 2.8 }, { x: 24.5, z: 87.5 });
        })(),

        (function () {
            var stack = cliff(14, 4, 4.2, 3.8, 2.6, { sheer: true });
            var land = island(19, 54, 20, 24.5, { bays: [[24, 26.5, 0.55, 0.55]] });
            return keys('The Cape', 4, 'The shore runs across the line on a slant. Bite off as much water as you dare — the more you carry, the less is left.', [
                stack, land,
                lay(stack, 14, 4, 2.4, 2.2, 'fairway'),
                lay(land, 11, 48.5, 5, 11, 'fairway'),
                lay(land, 27, 66, 4.4, 4, 'green', { wild: 0.05 }),
                lay(land, 30, 54, 4, 3, 'rough', { wild: 0.14 }),
                lay(land, 12, 70, 3, 2.5, 'rough', { wild: 0.14 })
            ], [[30, 54], [31.5, 55], [12, 70]], { x: 14, z: 4 }, { x: 27.5, z: 67.5 });
        })(),

        (function () {
            var land = island(18, 39, 16, 36, { bays: [[44, 46.5, 0.78, 0.6]] });
            var head = cliff(14, 3, 4.4, 3.6, 2.6, { sheer: true });
            var point = cliff(29, 65, 7, 8, 1.1, { sheer: true });
            return keys('Round the Point', 4, 'Up the long arm and across to a green on the clifftop, or cut the corner over the bay. Short is the beach; long is the sea.', [
                land, head, point,
                lay(head, 14, 3, 2.4, 2, 'fairway'),
                lay(land, 11, 39, 5.5, 15.5, 'fairway'),
                lay(point, 29.5, 65.5, 4.4, 3.8, 'green', { wild: 0.05 }),
                lay(land, 15, 63, 4, 3, 'rough', { wild: 0.14 }),
                lay(land, 24, 26, 3, 4, 'rough', { wild: 0.14 })
            ], [[15, 63], [24, 25.5], [24.5, 27.5]], { x: 14, z: 2.8 }, { x: 30, z: 66.5 });
        })()
    ];

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
            blurb: 'Ramps, ledges, banks and walls, and a long way down off most of them. Height, both ways.',
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
            blurb: 'Bars, bells and a mill race, each machine running at its own rate. Timing is the whole of it.',
            theme: 'clockwork',
            holes: clockwork
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
            id: 'cinder',
            group: 'adventure',
            name: 'Cinder Cone',
            blurb: 'Launch pads, belts, a pipe and a loop on the side of a mountain. The floor decides; you only decide how hard.',
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
        },
        {
            id: 'keys',
            group: 'long',
            name: 'Coral Keys',
            blurb: 'Six holes across a lagoon, and no fairway between the islands — only the next island. Every shot is a carry.',
            theme: 'lagoon',
            holes: coral
        }
    ];

    /* Which game a hole belongs to, on the hole itself — the showcase deals
       holes out of their courses into a round of its own, so the course is
       not there to be asked once a hole is being played. Mini golf, crazy
       golf and adventure golf are one game played with one bag
       (CONFIG.MINI_BAG); the long game is another. See G3.bagFor. */
    G3.COURSES.forEach(function (c) {
        if (C.MINI_GROUPS.indexOf(c.group) < 0) return;
        c.holes.forEach(function (h) { h.mini = true; });
    });

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

       The list is eighteen courses long and most players walk it in the order
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
       of the eighteen wants one of the other four. */
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
            blurb: 'Any course on the list except the one you are playing, leaning towards the ones you have played least.',
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
       the moment you have played all eighteen, and "beat a best" means nothing
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
    /* ── leaning towards what you have not played ────────────────────────

       The dice are weighted by the save file. A hole's weight is
       1 / (1 + plays)², so a hole you have never played is four times as
       likely as one you have played once and nine times as likely as one you
       have played twice — never zero, because a favourite coming round again
       is part of a shuffle too. A course weighs what its holes weigh on
       average, which counts showcase holes played out of it as well as full
       rounds on it; a save written before holes were counted falls back to
       its rounds, so an old save leans the same way from the first draw.

       With no save, or with everything played equally, every weight is the
       same and the pick is exactly the even one it always was — which is
       what the tests holding the dice rely on. */
    function holePlays(save, id, index) {
        var h = save && save.holes ? save.holes[id + ':' + index] : null;
        return h && typeof h.plays === 'number' && h.plays > 0 ? h.plays : 0;
    }

    function weightOf(plays) { return 1 / ((1 + plays) * (1 + plays)); }

    G3.holeWeight = function (save, id, index) { return weightOf(holePlays(save, id, index)); };

    G3.courseWeight = function (save, course) {
        var rounds = roundsOn(save, course.id), sum = 0, i;
        for (i = 0; i < course.holes.length; i++) {
            sum += weightOf(Math.max(rounds, holePlays(save, course.id, i)));
        }
        return course.holes.length ? sum / course.holes.length : 1;
    };

    /* One index out of a list of weights. `n` is clamped rather than trusted,
       for the reason randomCourseId gives; equal weights give
       floor(n × length), the unweighted pick to the last digit. */
    function weightedIndex(weights, n) {
        var total = 0, i;
        for (i = 0; i < weights.length; i++) total += weights[i];
        if (!(total > 0)) return 0;
        var at = (typeof n === 'number' && n >= 0 && n < 1 ? n : 0) * total;
        for (i = 0; i < weights.length; i++) {
            at -= weights[i];
            if (at < 0) return i;
        }
        return weights.length - 1;
    }
    G3.weightedIndex = weightedIndex;

    G3.randomCourseId = function (opts) {
        var draw = G3.shuffleDraw(opts);
        var rng = (opts && opts.rng) || Math.random;
        var save = (opts && opts.save) || null;
        var i = weightedIndex(draw.courses.map(function (c) { return G3.courseWeight(save, c); }), rng());
        return draw.courses[Math.max(0, Math.min(draw.courses.length - 1, i))].id;
    };

    G3.shuffleModeById = function (id) {
        for (var i = 0; i < G3.SHUFFLE_MODES.length; i++) {
            if (G3.SHUFFLE_MODES[i].id === id) return G3.SHUFFLE_MODES[i];
        }
        return G3.SHUFFLE_MODES[0];
    };

    /* ── the showcase: the game in eight holes ───────────────────────────

       A hundred and eight holes is a lot to ask anybody to walk before they
       know what is in them, and the order they are written in shows you six
       holes of one kind of golf before it shows you a second. The showcase is
       the other way in, and it is what a new game plays: two holes from every
       kind, mini golf first and the long game last, each out of a different
       course and each in its own course's world and sky. Eight holes, four
       kinds, eight courses, and a new deal every round.

       It is a course in every way the rest of the game asks about — an id
       `courseById` answers to, a list of holes, a par — with three more
       things on it. `from` says where each hole came from, which is what the
       sky and the plans are keyed by (a hole has the same weather and the same
       drawn plan whether you meet it here or at home). `themes` is the world
       each one is drawn in. And `isShowcase`, for the card and the records,
       which judge it against par: two deals do not have the same par, so the
       fewest strokes is not a record of anything.

       It is deliberately not in G3.COURSES. Nothing lists it, nothing draws
       it, and `nextCourseId` cannot hand it out; it is reached by name. The
       playtest course is never dealt either — it is somebody's draft, and it
       is filed under mini golf only so the picker has a shelf for it. */
    G3.SHOWCASE_PER_KIND = 2;

    /* `save` leans the deal towards holes you have played least (see the
       weights above the shuffle's dice): the course by how much of it you
       have seen, then the hole within it by its own count. Left out, the
       deal is the even one. */
    G3.dealShowcase = function (rng, save) {
        var rnd = rng || Math.random;
        var holes = [], from = [], themes = [];
        G3.COURSE_GROUPS.forEach(function (group) {
            var pool = G3.coursesInGroup(group.id).filter(function (c) { return !c.playtest; });
            for (var k = 0; k < G3.SHOWCASE_PER_KIND && pool.length; k++) {
                var c = weightedIndex(pool.map(function (p) { return G3.courseWeight(save, p); }), rnd());
                var course = pool.splice(c, 1)[0];
                var i = weightedIndex(course.holes.map(function (h, j) {
                    return G3.holeWeight(save, course.id, j);
                }), rnd());
                holes.push(course.holes[i]);
                from.push({ id: course.id, index: i });
                themes.push(course.theme);
            }
        });
        return {
            id: 'showcase',
            group: 'showcase',
            name: 'Showcase',
            blurb: 'Two holes from every kind of golf, each out of a different course. A new deal every round.',
            theme: themes[0],
            themes: themes,
            from: from,
            holes: holes,
            isShowcase: true
        };
    };

    /* The deal on the table. `courseById('showcase')` deals one the first time
       it is asked and then keeps answering with it — Play again is the same
       eight holes — until something deals a fresh one in its place. */
    G3.SHOWCASE = null;

    /* ── Challenge mode ──────────────────────────────────────────────────

       Six holes on ground that is a mathematical function rather than a
       place (physics.js, "surfaces that are a function"): a sea of sine
       ridges, an egg crate, a ripple from a stone dropped in, a saddle you
       play over the pass of, two wells, and a field you tee off a platform
       hovering above, a spiral and a volcano. Each deal picks its own
       holes out of a curated library, so the
       same eight families make a different six holes every round (see the
       library below: the variants are curated, the deal is not).

       Wherever the cup is, the ground there is made flat: the field is faded
       out by a `calm` round the cup and round the tee, flat inside CUP_FLAT
       and full strength a couple of units further out, so the cup is cut into
       level ground the way every other cup is. tests.html plays every variant
       in the library with the bot.

       Played out of the lofted mini bag, because a surface like this is
       half read and half flown, and drawn in the `neon` theme. */
    var CHALLENGE_BAG = ['putter', 'mallet', 'chipper', 'wedge'];
    var CHALLENGE_CALM = { r0: CUP_FLAT + 0.2, r1: CUP_FLAT + 2.2 };

    function calmAround(pts) {
        return pts.map(function (q) {
            return { x: q.x, z: q.z, r0: CHALLENGE_CALM.r0, r1: CHALLENGE_CALM.r1 };
        });
    }

    /* The library: eight families, two or three curated variants each.
       Every one is a hole somebody chose — the field's numbers, the tee and
       the cup — rather than a roll of the dice, because a random cup on a
       random sea is more often a dull hole than a strange one. What a deal
       does is pick six of the eight families and one variant out of each
       (dealChallenge), so a round is still a surprise and every hole in it is
       one that has been looked at.

       Two things to know when adding one. The calm round the cup flattens
       the field down to the pad's own height — the field's *middle*, not its
       top — so a cup at the summit of a hill is cut into a crater, which is
       exactly what the Volcano family is. And the bot has to hole it: the
       suite plays every variant in the library. */
    var TAU = Math.PI * 2;
    function ph(k, x) { return 1.5 * Math.PI - k * x; }   // a wave's trough at x

    var CHALLENGE_LIBRARY = [
        { family: 'sine', variants: [
            { name: 'Sine Sea', par: 3, f: [0, 0, 12, 22], tee: [6, 2], cup: [6, 18.5],
              blurb: 'Ridge after ridge across the line. Pace it to crest the last one and no more.',
              field: [{ wave: [0, TAU / 5.5], a: 0.42, ph: 0.6 }, { wave: [TAU / 12, 0], a: 0.1, ph: 1.3 }] },
            { name: 'Crosscurrent', par: 3, f: [0, 0, 12, 22], tee: [6, 2], cup: [9.4, 17.5],
              blurb: 'The ridges run slantwise, and every one of them turns the ball a little more.',
              field: [{ wave: [TAU / 5 * 0.6, TAU / 5 * 0.8], a: 0.36, ph: 2.1 }] },
            { name: 'Long Swell', par: 3, f: [0, 0, 12, 22], tee: [6, 2], cup: [9.6, 18.5],
              blurb: 'Three gutters running the length of it. The cup is in the next one over.',
              field: [{ wave: [TAU / 3.6, 0], a: 0.32, ph: ph(TAU / 3.6, 6) }] }
        ] },
        { family: 'crate', variants: [
            { name: 'Egg Crate', par: 3, f: [0, 0, 13, 22], tee: [6.5, 2], cup: [8.2, 17.2],
              blurb: 'Two seas crossed. Every hollow is a trap and every crest a ramp.',
              field: [{ wave: [TAU / 6, 0], a: 0.36, ph: 0.4 }, { wave: [0, TAU / 6], a: 0.36, ph: 2.2 }] },
            { name: 'Waffle', par: 3, f: [0, 0, 13, 22], tee: [6.5, 2], cup: [3.8, 19],
              blurb: 'The same crossed seas, finer: forty little hollows between you and the flag.',
              field: [{ wave: [TAU / 3.8, 0], a: 0.19, ph: 1.0 }, { wave: [0, TAU / 3.8], a: 0.19, ph: 0.2 }] }
        ] },
        { family: 'ripple', variants: [
            { name: 'Stone in a Pond', par: 3, f: [0, 0, 14, 22], tee: [7, 2], cup: [7, 19.5],
              blurb: 'Rings running out from where the stone went in. Ride one round, or cut across them.',
              field: [{ ripple: [7, 10.5], k: TAU / 4.2, a: 0.52, fall: 0.07 }] },
            { name: 'Bullseye', par: 3, f: [0, 0, 14, 22], tee: [7, 2], cup: [7, 15.5],
              blurb: 'Rings round the cup itself. Each one you cross takes pace off; too few and it rolls back out.',
              field: [{ ripple: [7, 15.5], k: TAU / 3.4, a: 0.4, fall: 0.03 }] },
            { name: 'Two Stones', par: 3, f: [0, 0, 14, 22], tee: [7, 2], cup: [10.5, 19],
              blurb: 'Two stones, two sets of rings, and where they cross the water stands up.',
              field: [{ ripple: [4, 9], k: TAU / 4, a: 0.38, fall: 0.05 }, { ripple: [10, 12.5], k: TAU / 4, a: 0.38, fall: 0.05 }] }
        ] },
        { family: 'saddle', variants: [
            { name: 'The Pass', par: 4, f: [0, 0, 14, 26], tee: [7, 2], cup: [7, 22.5],
              blurb: 'A saddle: walls up either side, the ground falling away both ends. Over the pass, and stop.',
              field: [{ saddle: [7, 13], a: 1.1, s: 9 }, { wave: [TAU / 7, TAU / 11], a: 0.1, ph: 0.8 }] },
            { name: 'Shoulder', par: 3, f: [0, 0, 14, 26], tee: [7, 2], cup: [11.6, 13.5],
              blurb: 'The cup is up on the saddle\'s shoulder. Too soft and it slides back into the pass.',
              field: [{ saddle: [7, 13], a: 1.3, s: 8 }] }
        ] },
        { family: 'wells', variants: [
            { name: 'Twin Wells', par: 4, f: [0, 0, 14, 24], tee: [7, 2], cup: [7, 21],
              blurb: 'Two wells in a rolling floor, and they take anything that comes near.',
              field: [{ gauss: [4.6, 9.5], a: -1.5, s: 1.9 }, { gauss: [9.6, 15], a: -1.5, s: 1.9 },
                      { wave: [TAU / 8, TAU / 6], a: 0.14, ph: 1.7 }] },
            { name: 'Gravity Assist', par: 4, f: [0, 0, 14, 24], tee: [7, 2], cup: [7, 21],
              blurb: 'One deep well dead on the line. Go round it, or use its rim to bend the ball in.',
              field: [{ gauss: [7, 12], a: -1.9, s: 2.6 }] }
        ] },
        { family: 'hover', variants: [
            { name: 'Hover', par: 3, f: [0, 5, 14, 19], tee: [7, 2], cup: [7, 17.5],
              hover: [5.5, 0.5, 3, 3, 2.6],
              blurb: 'Off a platform hanging in the air, down on to a field of interference.',
              field: [{ wave: [TAU / 7, TAU / 7 * 0.6], a: 0.3, ph: 0.5 }, { wave: [-TAU / 7 * 0.7, TAU / 7], a: 0.25, ph: 2.4 }] },
            { name: 'High Wire', par: 3, f: [0, 6, 14, 19], tee: [7, 2], cup: [10.2, 21.5],
              hover: [5.5, 0.5, 3, 3, 3.4],
              blurb: 'Higher up, further out, and the field below is an egg crate. Land it on a crest.',
              field: [{ wave: [TAU / 5, 0], a: 0.26, ph: 0.9 }, { wave: [0, TAU / 5], a: 0.26, ph: 2.6 }] }
        ] },
        { family: 'spiral', variants: [
            { name: 'Whirlpool', par: 3, f: [0, 0, 16, 18], tee: [8, 1.8], cup: [8, 11],
              blurb: 'Two grooves winding into the cup. Drop into one and let it carry you round.',
              field: [{ spiral: [8, 11], k: TAU / 3.2, n: 2, a: 0.45 }] },
            { name: 'Galaxy', par: 3, f: [0, 0, 16, 18], tee: [2.5, 2], cup: [9, 11],
              blurb: 'Three arms, and you are teeing off at the edge of one. Across them, or along?',
              field: [{ spiral: [9, 11], k: TAU / 3.6, n: 3, a: 0.46 }] }
        ] },
        { family: 'blackhole', variants: [
            { name: 'Event Horizon', par: 3, f: [0, 0, 16, 22], tee: [8, 2], cup: [8, 19.5],
              blurb: 'A black hole dead on the line. Go round it close enough that it bends you in, not so close it keeps you.',
              field: [{ wave: [TAU / 7, TAU / 9], a: 0.1, ph: 0.4 }],
              wells: [{ x: 8, z: 10.5, pull: 26, core: 0.85 }] },
            { name: 'Slingshot', par: 3, f: [0, 0, 16, 22], tee: [3, 2], cup: [4.5, 19],
              blurb: 'The cup is behind you as far as the straight line goes. The well off to the right is the road.',
              field: [{ wave: [0, TAU / 8], a: 0.12, ph: 1.1 }],
              wells: [{ x: 11, z: 10, pull: 30, core: 0.9 }] },
            { name: 'Binary', par: 3, f: [0, 0, 16, 22], tee: [8, 2], cup: [8, 19.5],
              blurb: 'Two of them, and the only straight line on the hole runs between.',
              field: [],
              wells: [{ x: 4.5, z: 10, pull: 20, core: 0.8 }, { x: 11.5, z: 12, pull: 20, core: 0.8 }] }
        ] },
        { family: 'holes', variants: [
            { name: 'Swiss Cheese', par: 3, f: [0, 0, 15, 22], tee: [7.5, 2], cup: [8.5, 19],
              blurb: 'Holes in the floor and nothing under them. Read the crate and keep clear of the dark.',
              field: [{ wave: [TAU / 6, 0], a: 0.22, ph: 0.8 }, { wave: [0, TAU / 6], a: 0.22, ph: 2.0 }],
              voids: [[4.5, 7.5, 1.3], [10.5, 9, 1.6], [6.5, 13, 1.2], [11, 15.5, 1.0], [3.5, 16.5, 1.1]] },
            { name: 'Bridgework', par: 3, f: [0, 0, 16, 22], tee: [8, 2], cup: [8, 19],
              blurb: 'A row of holes across the hole and a thread of glass between each. Roll a bridge, or fly the lot.',
              field: [{ wave: [0, TAU / 7], a: 0.12, ph: 0.3 }],
              voids: [[1.6, 11, 2.05], [5.9, 11, 2.05], [10.1, 11, 2.05], [14.4, 11, 2.05]] }
        ] },
        { family: 'volcano', variants: [
            { name: 'Volcano', par: 3, f: [0, 0, 16, 18], tee: [8, 2], cup: [8, 11],
              blurb: 'Up the cone and into the crater. Not enough and it comes back down to you.',
              field: [{ gauss: [8, 11], a: 2.1, s: 3 }] },
            { name: 'Caldera', par: 3, f: [0, 0, 16, 18], tee: [8, 2], cup: [8, 11.5],
              blurb: 'A broad cone with rings round its foot, and the crater at the top of it.',
              field: [{ gauss: [8, 11.5], a: 1.7, s: 3.6 }, { ripple: [8, 11.5], k: TAU / 3, a: 0.26, fall: 0.02 }] }
        ] }
    ];

    /* How far the glass runs on past the play area. No rails and no stakes
       (the owner: "it doesn't have to have rails and should continue
       further", and "no need for out of bounds pins"): the surface simply
       carries on, a ball that runs off the hole runs on over more of the same
       function until it stops or comes back, and the only way out is off the
       edge of the glass altogether — so the boundary is the glass, and there
       is nothing to mark. */
    var CHALLENGE_RUN = 14;

    function challengeHole(v, hue) {
        var f = { x: v.f[0], z: v.f[1], w: v.f[2], d: v.f[3] }, m = CHALLENGE_RUN;
        var tee = { x: v.tee[0], z: v.tee[1] }, cup = { x: v.cup[0], z: v.cup[1] };
        var field = pad(f.x - m, f.z - m, f.w + 2 * m, f.d + 2 * m, 0, 'glass');
        field.field = v.field;
        field.calm = calmAround(v.hover ? [cup] : [cup, tee]);
        field.hue = hue;
        if (v.voids) field.voids = v.voids.map(function (q) { return { x: q[0], z: q[1], r: q[2] }; });
        var pads = [field];
        if (v.hover) {
            var hv = pad(v.hover[0], v.hover[1], v.hover[2], v.hover[3], v.hover[4], 'glass');
            hv.hover = true;
            pads.push(hv);
        }
        return build({
            name: v.name, par: v.par, blurb: v.blurb,
            shaped: true, open: true, calm: true, bare: true, mini: true, bag: CHALLENGE_BAG.slice(),
            fence: { x: field.x, z: field.z, w: field.w, d: field.d }, stakes: false,
            wells: v.wells ? v.wells.map(function (w) { return { x: w.x, z: w.z, pull: w.pull, core: w.core }; }) : undefined,
            pads: pads, tee: tee, cup: cup
        });
    }

    // A colour range per family, so a round walks round the wheel.
    var CHALLENGE_HUES = [[0.78, 0.25], [0.52, 0.22], [0.92, 0.2], [0.08, 0.18],
                          [0.62, 0.3], [0.3, 0.2], [0.85, 0.35], [0.7, 0.1], [0.45, 0.25], [0.0, 0.12]];

    function challengeCourse(id, ref, holes, extra) {
        var c = {
            id: id, group: 'challenge', name: 'Challenge',
            blurb: 'Six mathematical surfaces in a grid world. A new six every round.',
            theme: 'neon', holes: holes, isChallenge: true,
            from: holes.map(function (h, i) { return { id: ref, index: i }; })
        };
        for (var k in extra) c[k] = extra[k];
        return c;
    }

    /* Every variant in the library as one course, for the turntable and the
       suite — the one place all of them are played and photographed. */
    G3.challengeLibrary = function () {
        var holes = [];
        CHALLENGE_LIBRARY.forEach(function (fam) {
            fam.variants.forEach(function (v) { holes.push(challengeHole(v, CHALLENGE_HUES[CHALLENGE_LIBRARY.indexOf(fam)])); });
        });
        return challengeCourse('challenge-library', 'challenge-library', holes, {});
    };

    /* A deal: six of the eight families, in the library's order (it climbs —
       the plain seas first, the hover and the volcano late), and one curated
       variant out of each. Seeded, so a seed is a deal. */
    G3.dealChallenge = function (seed) {
        if (seed === undefined) seed = Math.floor(Math.random() * 1e9);
        var rnd = seeded(seed), pool = CHALLENGE_LIBRARY.map(function (f, i) { return i; });
        while (pool.length > 6) pool.splice(Math.floor(rnd() * pool.length), 1);
        var holes = pool.map(function (i) {
            var fam = CHALLENGE_LIBRARY[i];
            return challengeHole(fam.variants[Math.floor(rnd() * fam.variants.length)], CHALLENGE_HUES[i]);
        });
        /* Keyed by the deal, not by 'challenge': the plans and the skies are
           cached by course id and hole number, and hole 3 of this deal is not
           hole 3 of the last one. */
        return challengeCourse('challenge', 'challenge-' + seed, holes, { seed: seed });
    };

    // The deal in play, the same way G3.SHOWCASE is.
    G3.CHALLENGE = null;

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
        if (!hole) return C.CLUBS;
        var ids = hole.bag ||
            (hole.mini ? (hole.needsLoft ? C.MINI_LOFT_BAG : C.MINI_BAG) : null);
        if (!ids) return C.CLUBS;
        var out = [];
        ids.forEach(function (id) {
            for (var i = 0; i < C.ALL_CLUBS.length; i++) {
                if (C.ALL_CLUBS[i].id === id) { out.push(C.ALL_CLUBS[i]); return; }
            }
        });
        return out.length ? out : C.CLUBS;
    };

    /* ── driving range: free practice sandbox ────────────────────────── */

    /* The targets are data rather than five anonymous greens: the renderer
       stands a distance board behind each one and game.js reports which of
       them a ball stopped on, both off this one list. `dist` is the distance
       from the tee to the middle of the green in metres as the range reads
       them (CONFIG.LONG_M to the unit), and is what the board says —
       tests.html measures it, so a green moved without its number fails.
       Fifty metres apart, out to the 250 a full drive just about reaches. */
    var RANGE_TEE = { x: 10, z: 5 };
    var RANGE_TARGETS = [
        { dist: 50,  x: 7, z: 12.1, w: 6,  d: 4 },
        { dist: 100, x: 6, z: 20.7, w: 8,  d: 5 },
        { dist: 150, x: 5, z: 29.3, w: 10, d: 6 },
        { dist: 200, x: 5, z: 38.4, w: 10, d: 6 },
        { dist: 250, x: 4, z: 47.5, w: 12, d: 6 }
    ];

    var rangeHole = build({
        name: 'Driving Range',
        par: 0,
        open: true,
        blurb: 'Targets at 50 to 250 m, unlimited balls, and the swing school.',
        bag: ['driver', 'iron5', 'iron', 'iron9', 'chipper', 'wedge', 'putter', 'mallet', 'checker'],
        pads: [
            pad(7, 2, 6, 6, 0.1, 'wood'),                         // elevated tee deck
            pad(8.5, 3.5, 3, 3, 0.14, 'green'),                   // tee mat
            pad(-15, 0, 50, 80, 0, 'fairway'),                    // wide main fairway
            pad(-25, -5, 10, 90, 0, 'rough'),                     // west rough
            pad(35, -5, 10, 90, 0, 'rough'),                      // east rough
            pad(-15, 80, 50, 15, 0, 'rough')                      // back rough
        ].concat(RANGE_TARGETS.map(function (t) {
            return pad(t.x, t.z, t.w, t.d, 0.05, 'green');
        })).concat([
            // Practice bunkers
            pad(18, 22, 6, 7, -0.15, 'sand'),
            pad(-6, 32, 6, 7, -0.15, 'sand'),
            pad(19, 44, 6, 7, -0.15, 'sand')
        ]),
        tee: RANGE_TEE,
        cup: { x: 10, z: 41.4 }                                // on the 200
    });
    rangeHole.targets = RANGE_TARGETS.map(function (t) {
        return { dist: t.dist, x0: t.x, z0: t.z, x1: t.x + t.w, z1: t.z + t.d };
    });

    var rangeCourse = {
        id: 'range',
        group: 'practice',
        name: 'Driving Range',
        blurb: 'Targets at 50 to 250 m, unlimited balls, and the swing school.',
        theme: 'parkland',
        isRange: true,
        holes: [rangeHole]
    };
    G3.RANGE_COURSE = rangeCourse;

    G3.courseById = function (id) {
        if (id === 'range') return G3.RANGE_COURSE;
        if (id === 'showcase') return G3.SHOWCASE || (G3.SHOWCASE = G3.dealShowcase());
        if (id === 'challenge-library') {
            return G3.CHALLENGE_LIBRARY || (G3.CHALLENGE_LIBRARY = G3.challengeLibrary());
        }
        if (id === 'challenge' || String(id).indexOf('challenge-') === 0) {
            return G3.CHALLENGE || (G3.CHALLENGE = G3.dealChallenge());
        }
        for (var i = 0; i < G3.COURSES.length; i++) {
            if (G3.COURSES[i].id === id) return G3.COURSES[i];
        }
        return G3.COURSES[0];
    };

    G3.authoring = {
        pad: pad, wall: wall, spinner: spinner, slider: slider,
        beam: beam, pen: pen, bumper: bumper, post: post, bank: bank, arc: arc,
        trough: trough, channel: channel, road: road, bowl: bowl, dish: dish, bands: bands, tilt: tilt,
        commons: commons,
        sprung: sprung, belt: belt, pipe: pipe, pipes: pipes, loop: loop,
        aperture: aperture, flipper: flipper, mill: mill,
        tree: tree, treeline: treeline, forest: forest, crag: crag, crags: crags,
        decor: decor, buoy: buoy, piling: piling, bench: bench, boat: boat, bin: bin,
        hill: hill, ring: ring, pond: pond, burn: burn, mere: mere, carve: carve, gully: gully, clearOf: clearOf, widen: widen, ridge: ridge, whorl: whorl, ravine: ravine,
        shape: shape, dunes: dunes, ground: ground, circle: circle, inlay: inlay, dress: dress,
        keep: keep,
        shapeDisc: shapeDisc,
        rect: rect, enclose: enclose, shore: shore, brink: brink, build: build,
        contour: contour, scoop: scoop, relief: relief,
        buoy: buoy, piling: piling, bench: bench, boat: boat, sailboat: sailboat, bin: bin,
        barrel: barrel, crate: crate, palm: palm, pine: pine, sign: sign, windmill: windmill,
        skyline: skyline, cabinet: cabinet, marquee: marquee, lamp: lamp,
        jukebox: jukebox, claw: claw, fruit: fruit,
        RAIL_T: RAIL_T, SCOOP: SCOOP,
        CUP_FLAT: CUP_FLAT, TEE_FLAT: TEE_FLAT, CUP_PATCH: CUP_PATCH
    };

})(window.G3);
