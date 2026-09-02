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
    function keyframes(hole, ball, seat) {
        var F = C.FLY;
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
    function spend(keys, dur) {
        var F = C.FLY, w = [], total = 0, i, len;
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
        // Floating point, four times over: the last key must land exactly on
        // the duration or the arrival is a hair short of the seat.
        keys[keys.length - 1].t = dur;
    }

    function seconds(d) {
        var F = C.FLY;
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

    // Slow away from the green, quick over the middle, and stopped by the time
    // it reaches the seat — which is the whole hand-off: there is no velocity
    // left to absorb, so the game's own camera simply carries on from here.
    function ease(x) { return x * x * (3 - 2 * x); }

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
    function plan(hole, ball, seat) {
        var d = Math.hypot(hole.cup.x - ball.x, hole.cup.z - ball.z);
        var keys = keyframes(hole, ball, seat);
        var dur = seconds(d);
        spend(keys, dur);
        lift(hole, keys, dur, Math.max(ball.y, hole.cup.y));
        return { keys: keys, dur: dur, out: pose() };
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
        seconds: seconds
    };

})(window.G3);
