/* The intro flyover — the walk to the tee.

   A hole is a shape before it is a shot, and the one moment a player can be
   shown that shape is before they have played the first one. So a new hole
   opens over the green, sweeps back down the course, and arrives exactly where
   the camera was going to be standing anyway: behind the ball, looking at it.

   Backwards, and deliberately. A broadcast flyover runs tee to green because
   it can cut away at the end; this one cannot cut anywhere, so it runs green
   to tee and its last frame is the first frame of the game. Nothing hands over,
   nothing snaps — the path simply ends at the seat, with the ease taking its
   speed to nothing as it gets there.

   Pure, the way physics.js and swing.js are pure: numbers in, numbers out, no
   three.js and no DOM. It reads the ground through `physics.surfaceTop` and
   nothing else, which is what lets a whole path be planned — and tested —
   with no context to draw it on.

   Two things the caller owns and this file does not: whether a flyover should
   happen at all, and what to do about being interrupted. Both are decisions
   about a player, and there is no player in here. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var P = G3.physics;

    /* ── the shape of the path ──────────────────────────────────────────── */

    /* The sweep: one slow, high orbit round the hole (the owner, v1.188.0:
       "a sweeping grandiose overview of the map and not motion sickness").

       It opens beyond the green, looking back at the cup, and swings round
       the side the course is on — ORBIT_FROM degrees off the line past the
       cup to ORBIT_TO off it behind the tee — looking at the middle of the
       hole all the way, so the whole of it stays in the picture and the
       picture turns only as fast as the camera goes round. It comes down a
       little and in a little as it goes, and ends high behind the tee,
       already facing down the hole, which is the way the seat faces.

       It never lands. The orbit takes ORBIT_SHARE of the run and the leg
       from its end down to the seat is the rest; the cut (`plan.cut`) is
       where the orbit ends, while the camera is still travelling, and
       render.js wipes from there to the seat (render.js → the wipe). The
       seat is still the last key, to the last decimal: the arithmetic of
       the hand-off, and a skip, are unchanged. */
    function orbit(hole, ball, seat, F) {
        var cup = hole.cup;
        var dx = cup.x - ball.x, dz = cup.z - ball.z;
        var d = Math.hypot(dx, dz), ux, uz, n;
        if (d > 0.05) { ux = dx / d; uz = dz / d; } else {
            ux = seat.tx - seat.px; uz = seat.tz - seat.pz;
            n = Math.hypot(ux, uz);
            if (n < 1e-6) { ux = 0; uz = 1; } else { ux /= n; uz /= n; }
            d = 0;
        }
        var b = hole.bounds;
        var bcx = (b.minX + b.maxX) / 2, bcz = (b.minZ + b.maxZ) / 2;
        var reach = Math.hypot((b.maxX - b.minX) / 2, (b.maxZ - b.minZ) / 2);
        // The middle it turns round: the shot's own middle, drawn half way
        // to the middle of the hole's ground.
        var mx = (ball.x + cup.x) / 2, mz = (ball.z + cup.z) / 2;
        mx += (bcx - mx) * 0.5; mz += (bcz - mz) * 0.5;
        var base = Math.max(ball.y, cup.y);
        var R = clamp(Math.max(reach, d * 0.5) * F.ORBIT_R + F.ORBIT_ADD, F.ORBIT_MIN, F.ORBIT_MAX);
        var H = R * F.ORBIT_H;
        // Round the side the course is on, as the bow always was.
        var px = uz, pz = -ux, side = ((bcx - mx) * px + (bcz - mz) * pz) < 0 ? -1 : 1;
        var a0 = F.ORBIT_FROM * Math.PI / 180, a1 = Math.PI - F.ORBIT_TO * Math.PI / 180;
        var keys = [], k, u, a, r, h, lx, lz, w, N = F.ORBIT_KEYS;
        // Where it is looking by the end: a third of the way down the hole.
        var ex = ball.x + ux * d * 0.35, ez = ball.z + uz * d * 0.35;
        for (k = 0; k < N; k++) {
            u = k / (N - 1);
            a = a0 + (a1 - a0) * u;
            r = R * (1 - (1 - F.ORBIT_IN) * u);
            h = H * (F.ORBIT_RISE - (F.ORBIT_RISE - F.ORBIT_FALL) * u);
            var cx = mx + r * (Math.cos(a) * ux + Math.sin(a) * side * px);
            var cz = mz + r * (Math.cos(a) * uz + Math.sin(a) * side * pz);
            // The first key looks at the cup; from there the look moves on to
            // the middle, and over the second half to a third of the way down.
            if (k === 0) { lx = cup.x; lz = cup.z; }
            else {
                w = Math.max(0, u * 2 - 1);
                w = w * w * (3 - 2 * w);
                lx = mx + (ex - mx) * w; lz = mz + (ez - mz) * w;
            }
            keys.push(key(cx, base + h, cz, lx,
                k === 0 ? cup.y + 0.4 : groundAt(hole, lx, lz, base) + 0.5, lz));
        }
        keys.push(key(seat.px, seat.py, seat.pz, seat.tx, seat.ty, seat.tz));
        return keys;
    }

    /* The orbit's clock: its keys evenly through ORBIT_SHARE of the run, the
       seat at the end. Even, because the keys are evenly round the circle and
       the circle is the speed. */
    function spendOrbit(keys, dur, F) {
        var n = keys.length - 1, i;
        for (i = 0; i < n; i++) keys[i].t = dur * F.ORBIT_SHARE * i / (n - 1);
        keys[n].t = dur;
    }

    // The moment of the run whose eased clock reads `tt`: ease is monotone,
    // so halving finds it.
    function unease(tt, dur) {
        var lo = 0, hi = 1, m, i;
        for (i = 0; i < 40; i++) { m = (lo + hi) / 2; if (ease(m) * dur < tt) lo = m; else hi = m; }
        return hi * dur;
    }

    /* Four keys, and each is there for a different reason.

         0  the green      beyond the cup, looking back at it: the shot's
                           destination, before anything about the shot
         1  the carry      the top of the arc, over the middle of the hole,
                           looking down the ground the ball has to cross
         2  the approach   coming down, still travelling, looking at the tee
         3  the seat       exactly where the game is about to put the camera

       The middle two are bowed to one side rather than left on the tee-to-cup
       line, because a dolly straight down the axis of a hole shows you its
       length and nothing else; a hole is wide as well as long. Which side is
       not a coin toss — it is whichever one the course itself is on, so the
       sweep passes over the hole rather than out beyond its edge. */
    function keyframes(hole, ball, seat, F) {
        F = F || C.FLY;
        var cup = hole.cup;
        var dx = cup.x - ball.x, dz = cup.z - ball.z;
        var d = Math.hypot(dx, dz);
        var ux, uz, n;

        if (d > 0.05) {
            ux = dx / d; uz = dz / d;
        } else {
            /* A cup sitting on the tee has no line to fly down. Borrow the
               seat's own bearing so the sweep still has a direction, and let
               every length below fall back to its minimum. */
            ux = seat.tx - seat.px; uz = seat.tz - seat.pz;
            n = Math.hypot(ux, uz);
            if (n < 1e-6) { ux = 0; uz = 1; } else { ux /= n; uz /= n; }
            d = 0;
        }

        var apex = clamp(d * F.LIFT, F.LIFT_MIN, F.LIFT_MAX);
        var past = clamp(d * F.PAST_CUP, F.PAST_MIN, F.PAST_MAX);
        var base = Math.max(ball.y, cup.y);

        // Which side the course is on, measured off the middle of the shot.
        var px = uz, pz = -ux;                       // the line, turned 90°
        var mx = ball.x + ux * d * 0.5, mz = ball.z + uz * d * 0.5;
        var cx = (hole.bounds.minX + hole.bounds.maxX) / 2;
        var cz = (hole.bounds.minZ + hole.bounds.maxZ) / 2;
        var bow = clamp(d * F.BOW, 0, F.BOW_MAX);
        if ((cx - mx) * px + (cz - mz) * pz < 0) bow = -bow;

        function along(s) { return { x: ball.x + ux * d * s, z: ball.z + uz * d * s }; }
        function ground(x, z) { return groundAt(hole, x, z, base); }

        /* Where it stands, and what it is looking at from there. The two are a
           long way apart on purpose: a camera at the apex looking at the ground
           just in front of itself is a map with a tilt on it, and the further
           down the hole it looks the more the picture reads as flying over the
           course rather than hovering above it. So the top of the arc is two
           thirds of the way to the green and looking most of the way back to
           the tee, and by the approach it is already looking at the ball it is
           about to arrive behind — which is the same point the seat looks at,
           so the last of the pan is over before the sweep lands. */
        var k1 = along(0.70), k2 = along(0.26);
        var l1 = along(0.12), l2 = along(0);

        return [
            key(cup.x + ux * past, cup.y + apex * 0.5, cup.z + uz * past,
                cup.x, cup.y + 0.4, cup.z),
            key(k1.x + px * bow, base + apex, k1.z + pz * bow,
                l1.x, ground(l1.x, l1.z) + 1.2, l1.z),
            key(k2.x + px * bow * 0.45, base + apex * 0.55, k2.z + pz * bow * 0.45,
                l2.x, ground(l2.x, l2.z) + 1.0, l2.z),
            key(seat.px, seat.py, seat.pz, seat.tx, seat.ty, seat.tz)
        ];
    }

    function key(px, py, pz, lx, ly, lz) {
        return {
            t: 0,
            p: { x: px, y: py, z: pz }, l: { x: lx, y: ly, z: lz },
            mp: { x: 0, y: 0, z: 0 }, ml: { x: 0, y: 0, z: 0 }
        };
    }

    function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

    // The ground under a point, or the fallback where the course has run out —
    // which happens on the long game, where a hole has no fence and the flyover
    // is free to swing wide of anything anyone built.
    function groundAt(hole, x, z, fallback) {
        var s = P.surfaceTop(hole, x, z);
        return s ? s.y : fallback;
    }

    /* ── time ───────────────────────────────────────────────────────────── */

    /* How long the whole thing runs for, and how that time is shared out.

       The length is off the hole rather than flat: a nine-metre putting lane
       does not need the five seconds Ashdown's par five earns. The share is by
       chord length, softened by a power — straight chord length lets the one
       long leg swallow the run and makes the short ones flick past, and a flat
       share does the opposite. */
    function spend(keys, dur, F) {
        F = F || C.FLY;
        var w = [], total = 0, i, len;
        for (i = 0; i < keys.length - 1; i++) {
            len = Math.hypot(keys[i + 1].p.x - keys[i].p.x,
                             keys[i + 1].p.y - keys[i].p.y,
                             keys[i + 1].p.z - keys[i].p.z);
            len = Math.pow(Math.max(len, 0.001), F.PACE);
            w.push(len);
            total += len;
        }
        keys[0].t = 0;
        for (i = 0; i < w.length; i++) keys[i + 1].t = keys[i].t + dur * w[i] / total;
        // Floating point, a key at a time: the last key must land exactly on
        // the duration or the arrival is a hair short of the seat.
        keys[keys.length - 1].t = dur;
    }

    function seconds(d, F) {
        F = F || C.FLY;
        return clamp(F.BASE_SECONDS + d * F.PER_UNIT, F.MIN_SECONDS, F.MAX_SECONDS);
    }

    /* ── the curve ──────────────────────────────────────────────────────── */

    /* Catmull-Rom, written out as Hermite because the keys are not evenly
       spaced in time and the uniform form assumes they are. A tangent is the
       slope through the neighbours on either side, over the time between them;
       the ends take the one-sided slope. That is what keeps the speed
       continuous across a beat instead of kinking at every key. */
    function retangent(keys) {
        var n = keys.length, i, a, b, h;
        for (i = 0; i < n; i++) {
            a = keys[i === 0 ? 0 : i - 1];
            b = keys[i === n - 1 ? n - 1 : i + 1];
            h = b.t - a.t;
            if (h < 1e-6) h = 1e-6;
            keys[i].mp.x = (b.p.x - a.p.x) / h;
            keys[i].mp.y = (b.p.y - a.p.y) / h;
            keys[i].mp.z = (b.p.z - a.p.z) / h;
            keys[i].ml.x = (b.l.x - a.l.x) / h;
            keys[i].ml.y = (b.l.y - a.l.y) / h;
            keys[i].ml.z = (b.l.z - a.l.z) / h;
        }
    }

    /* Slow away from the green, quick over the middle, and stopped by the time
       it reaches the seat — which is the whole hand-off: there is no velocity
       left to absorb, so the game's own camera simply carries on from here.

       Smootherstep rather than smoothstep, which costs two multiplies and buys
       the second derivative: smoothstep leaves the camera *accelerating* at
       both ends, so the sweep starts with a shove and lands with a lurch, and
       on a phone drawing 30 frames a second those two moments are the whole
       impression of it. This one leaves and arrives with no acceleration
       either, and the only price is a slightly faster middle. */
    function ease(x) { return x * x * x * (x * (x * 6 - 15) + 10); }

    /* Where the camera is and what it is looking at, `t` seconds in. Fills and
       returns the scratch it is handed — nothing here allocates, because this
       runs on every frame of the sweep.

       `seg` and `u` come back on it too: the clearance pass below needs to know
       which pair of keys a sample came from in order to lift them. */
    function sample(keys, dur, t, out) {
        var prog = dur > 0 ? clamp(t / dur, 0, 1) : 1;
        var tt = ease(prog) * dur;
        var n = keys.length, i = 0, a, b, h, u;

        while (i < n - 2 && tt > keys[i + 1].t) i++;
        a = keys[i]; b = keys[i + 1];
        h = b.t - a.t;
        u = h > 1e-6 ? clamp((tt - a.t) / h, 0, 1) : 1;

        var uu = u * u, uuu = uu * u;
        var h00 = 2 * uuu - 3 * uu + 1;
        var h10 = uuu - 2 * uu + u;
        var h01 = -2 * uuu + 3 * uu;
        var h11 = uuu - uu;

        out.px = h00 * a.p.x + h10 * h * a.mp.x + h01 * b.p.x + h11 * h * b.mp.x;
        out.py = h00 * a.p.y + h10 * h * a.mp.y + h01 * b.p.y + h11 * h * b.mp.y;
        out.pz = h00 * a.p.z + h10 * h * a.mp.z + h01 * b.p.z + h11 * h * b.mp.z;
        out.tx = h00 * a.l.x + h10 * h * a.ml.x + h01 * b.l.x + h11 * h * b.ml.x;
        out.ty = h00 * a.l.y + h10 * h * a.ml.y + h01 * b.l.y + h11 * h * b.ml.y;
        out.tz = h00 * a.l.z + h10 * h * a.ml.z + h01 * b.l.z + h11 * h * b.ml.z;
        out.seg = i;
        out.u = u;
        out.prog = prog;
        return out;
    }

    /* ── clearing the ground ────────────────────────────────────────────── */

    /* A path drawn between four points knows nothing about the hill between
       two of them, and a camera through a hillside is the one failure of this
       whole idea that a player cannot un-see. So the curve is walked, and
       wherever it is closer to the ground than it should be, the two keys it
       is between are raised — weighted by how near each one is, which is what
       makes the lift local rather than tipping the whole sweep up.

       Raising the keys moves the curve, which is why this repeats: a lift can
       expose a second dip further along. It converges in two or three passes
       on anything in the file, and stops when a pass changes nothing.

       The requirement fades over the last of the run. The arrival is a camera
       standing on the course, a metre or two above the tee, and it is the one
       point in the path that is not allowed to move. */
    function lift(hole, keys, dur, fallbackY) {
        var F = C.FLY, last = keys.length - 1;
        var probe = pose();
        var pass, s, prog, req, g, need, a, b, moved;

        for (pass = 0; pass < F.LIFT_PASSES; pass++) {
            retangent(keys);
            moved = 0;
            for (s = 0; s <= F.LIFT_SAMPLES; s++) {
                prog = s / F.LIFT_SAMPLES;
                sample(keys, dur, prog * dur, probe);
                req = F.CLEAR * clamp((1 - probe.prog) / F.SETTLE, 0, 1);
                if (req <= 0) continue;
                g = groundAt(hole, probe.px, probe.pz, fallbackY);
                need = g + req - probe.py;
                if (need <= 0.01) continue;
                if (need > moved) moved = need;
                a = keys[probe.seg];
                b = keys[probe.seg + 1];
                if (probe.seg !== last) a.p.y += need * (1 - probe.u);
                if (probe.seg + 1 !== last) b.p.y += need * probe.u;
            }
            if (moved <= 0.01) break;
        }
        retangent(keys);
    }

    function pose() {
        return { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0, seg: 0, u: 0, prog: 0 };
    }

    /* ── the module's face ──────────────────────────────────────────────── */

    /* `seat` is where the game's own camera would be standing this instant:
       {px,py,pz} for the eye and {tx,ty,tz} for what it is looking at, which is
       exactly what render.js's seat maths produces. Handing it in rather than
       working it out here is the point — this file has no opinion about which
       seat the player has chosen, and the path ends wherever that seat is. */
    function plan(hole, ball, seat, opts) {
        var d = Math.hypot(hole.cup.x - ball.x, hole.cup.z - ball.z);
        var F = knobs(opts && opts.tour);
        var keys = null, dur;
        if (opts && opts.line) {
            keys = worldLine(hole, ball, seat, opts.line, F);
            if (keys) dur = clamp(F.LINE_BASE + pathLength(keys) * F.LINE_PER_UNIT,
                                  F.LINE_MIN, F.LINE_MAX);
        }
        if (keys) {
            spend(keys, dur, F);
            lift(hole, keys, dur, Math.max(ball.y, hole.cup.y));
            return { keys: keys, dur: dur, out: pose(), line: true, cut: cutAt(keys, dur) };
        }
        keys = orbit(hole, ball, seat, F);
        dur = seconds(d, F);
        spendOrbit(keys, dur, F);
        lift(hole, keys, dur, Math.max(ball.y, hole.cup.y));
        return { keys: keys, dur: dur, out: pose(), line: false,
                 cut: unease(keys[keys.length - 2].t, dur) };
    }

    /* ── the cut ────────────────────────────────────────────────────────

       Where the sweep stops being flown and is cut instead. The path runs
       green to tee and the seat looks tee to green, so the end of it has to
       pass over the ball and turn the whole view round to face the other
       way — and since the look is pinned to the ball by then, that turn is
       a camera spinning on the spot above it: up to fifty degrees a second
       on a tour hole, for the last three seconds of the run. The owner:
       "it's focusing a bit much on the ball when it spins over … do a quick
       fade to black (or circle in out thing)".

       So render.js wipes from this moment to the seat instead (render.js →
       the wipe). This is the cut on a world's line only; the orbit is cut
       where the orbit ends (`plan`).
       The moment is the first sample in the second half of the run where
       the look turns faster than CUT_TURN degrees a second — read off the
       path rather than set as a share of it, since a straight putting lane
       and a tour hole with a dog-leg turn at very different points — and
       never later than CUT_TAIL from the end, where all that is left is
       the ease settling onto the seat. Pure, like the rest of this file:
       tests.html can hold it to that with no canvas. */
    function cutAt(keys, dur) {
        var F = C.FLY, n = F.CUT_SAMPLES, i, t, dt = dur / n;
        var a = pose(), b = pose(), turn;
        var latest = Math.max(dur * 0.5, dur - F.CUT_TAIL);
        sample(keys, dur, dur * 0.5 - dt, a);
        for (i = Math.ceil(n * 0.5); i <= n; i++) {
            t = i * dt;
            if (t >= latest) break;
            sample(keys, dur, t, b);
            turn = lookTurn(a, b) / dt;
            if (turn > F.CUT_TURN) return t;
            var s = a; a = b; b = s;
        }
        return latest;
    }

    // The angle between two poses' lines of sight, in degrees.
    function lookTurn(a, b) {
        var ax = a.tx - a.px, ay = a.ty - a.py, az = a.tz - a.pz;
        var bx = b.tx - b.px, by = b.ty - b.py, bz = b.tz - b.pz;
        var d = (ax * bx + ay * by + az * bz) /
                (Math.sqrt(ax * ax + ay * ay + az * az) * Math.sqrt(bx * bx + by * by + bz * bz) || 1);
        return Math.acos(clamp(d, -1, 1)) * 180 / Math.PI;
    }

    /* The tour's own numbers: FLY with FLY.TOUR laid over it. A world is the
       thing being shown off on the tour (the owner: "showcase the cool portal
       maps"), so its sweep is slower, opens further out and higher, and leans
       further off the line — more of the world in the picture for longer. */
    var tourKnobs = null;
    function knobs(tour) {
        var F = C.FLY;
        if (!tour || !F.TOUR) return F;
        if (!tourKnobs || tourKnobs.from !== F.TOUR) {
            tourKnobs = {};
            Object.keys(F).forEach(function (k) { tourKnobs[k] = F[k]; });
            Object.keys(F.TOUR).forEach(function (k) { tourKnobs[k] = F.TOUR[k]; });
            tourKnobs.from = F.TOUR;
        }
        return tourKnobs;
    }

    function pathLength(keys) {
        var i, len = 0;
        for (i = 0; i < keys.length - 1; i++) {
            len += Math.hypot(keys[i + 1].p.x - keys[i].p.x, keys[i + 1].p.y - keys[i].p.y,
                              keys[i + 1].p.z - keys[i].p.z);
        }
        return len;
    }

    /* ── the world's own line ───────────────────────────────────────────

       Every world in Portals is flown through along a line its makers drew
       (vendor/portals → makePath), kept clear of the world's things — and a
       tour hole is laid out on that line: the seat on the tee stands on it,
       and the hole runs the way it runs (backdrop.mjs → fitAt). So the line
       carries on past the green, out into the world, and that is where the
       tour's intro starts: LINE_PAST units down it beyond the cup, flown back
       along it — through the world as its makers meant it to be seen — over
       the green and down the hole, until it is LINE_STOP of the way back to
       the tee, where it leaves the line for the same approach and seat the
       ordinary sweep ends on.

       `line` is backdrop.mjs's: the line's points in golf units. It is only
       used if it actually passes over this hole — near the cup and near the
       tee, both within LINE_NEAR — which a world whose hole was placed by
       hand rather than on its line need not do; then this returns null and
       the tour gets the ordinary sweep on its own numbers.

       Every key looks at the ball, all the way in. It used to look along
       the line the way the world's own camera does and swing on to the ball
       over the last of it — and a line that bends near the hole turned the
       picture a hundred and twenty degrees one way and then back the other
       just as it reached the ball (the owner, v1.183.2: "when you get close
       to the ball still rotates a bit weird"). With the ball held in the
       frame, the world goes past behind the hole instead, and the turn left
       is only what the camera's own path round the hole makes. */
    function worldLine(hole, ball, seat, line, F) {
        var pts = line.pts, n = pts ? pts.length : 0;
        if (n < 4) return null;
        var cup = hole.cup, i;
        var dx = cup.x - ball.x, dz = cup.z - ball.z, d = Math.hypot(dx, dz);
        if (d < 4) return null;
        var ux = dx / d, uz = dz / d;
        var ic = nearest(pts, cup.x, cup.z), it = nearest(pts, ball.x, ball.z);
        if (flat(pts[ic], cup) > F.LINE_NEAR || flat(pts[it], ball) > F.LINE_NEAR || ic === it) return null;
        var step = ic > it ? 1 : -1;            // the way the line runs past the cup

        // Out along it beyond the cup, as far as LINE_PAST or the end of it.
        var j = ic, run = 0;
        while (j + step >= 0 && j + step < n && run < F.LINE_PAST) {
            run += seg(pts[j], pts[j + step]);
            j += step;
        }
        if (run < F.LINE_PAST * 0.4) return null;

        /* Back along it to the hole, a key every KEY_STEP units, as long as
           it is still LINE_STOP of the way down the hole from the tee. */
        var chosen = [j], gap = 0;
        for (i = j - step; i !== it; i -= step) {
            gap += seg(pts[i + step], pts[i]);
            if (alongOf(pts[i], ball, ux, uz) < d * F.LINE_STOP) break;
            if (gap >= F.KEY_STEP) { chosen.push(i); gap = 0; }
        }
        if (chosen.length < 2) return null;

        var keys = [], k, a;
        for (k = 0; k < chosen.length; k++) {
            a = pts[chosen[k]];
            keys.push(key(a[0], a[1], a[2], ball.x, ball.y + 0.8, ball.z));
        }

        // The approach and the seat, exactly as the ordinary sweep has them.
        var tail = keyframes(hole, ball, seat, F);
        keys.push(tail[2], tail[3]);
        return keys;
    }

    function flat(p, o) { return Math.hypot(p[0] - o.x, p[2] - o.z); }
    function seg(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); }
    function alongOf(p, o, ux, uz) { return (p[0] - o.x) * ux + (p[2] - o.z) * uz; }
    function nearest(pts, x, z) {
        var i, best = Infinity, bi = 0, dd;
        for (i = 0; i < pts.length; i++) {
            dd = (pts[i][0] - x) * (pts[i][0] - x) + (pts[i][2] - z) * (pts[i][2] - z);
            if (dd < best) { best = dd; bi = i; }
        }
        return bi;
    }

    /* The seat can move under a sweep that is still running — the player has
       not touched anything, but a hole may still be settling the ball onto its
       tee. So the last key is re-read every frame rather than baked at the
       start, and the arrival stays exact. */
    function retarget(p, seat) {
        var k = p.keys[p.keys.length - 1];
        k.p.x = seat.px; k.p.y = seat.py; k.p.z = seat.pz;
        k.l.x = seat.tx; k.l.y = seat.ty; k.l.z = seat.tz;
        retangent(p.keys);
        return p;
    }

    // The pose `t` seconds in, in the plan's own scratch object. Read it, do
    // not keep it: the next call overwrites it.
    function at(p, t) { return sample(p.keys, p.dur, t, p.out); }

    G3.flyover = {
        plan: plan,
        retarget: retarget,
        at: at,
        // For the tests, which have a legitimate interest in the shape of the
        // path and none at all in the arithmetic that draws it.
        seconds: function (d, tour) { return seconds(d, knobs(tour)); }
    };

})(window.G3);
