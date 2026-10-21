/* The ace replay — the tape.

   A hole in one is over in a second and a half, and the player spent all of it
   looking at the ball from behind. So every shot is recorded as it is played —
   where the ball was, how fast it was going, and what it hit, once per physics
   step — and when one of them goes in, it is played back: struck from the tee
   with the camera chasing it, then a cut to a seat beside the cup to watch it
   arrive, the last of it in slow motion.

   Played back, not re-simulated. The live roll ran on frame times nobody kept,
   and physics.advance sub-steps by speed, so the same shot run again at any
   other clock is a slightly different roll — the kind that lips out. The tape
   is the shot that went in, and the moving walls are driven off its own clock
   (`time`), so the windmill is where it was when the ball went through it.

   Pure, the way flyover.js is: numbers in, numbers out, no three.js and no
   DOM. Which seat the cup camera can actually see from is a question about the
   picture, so this offers the seats in order and render.js picks the first
   one with a clear view. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var P = G3.physics;

    // Event bits on a frame: what the step that ended there ran into.
    var BOUNCE = 1, LAND = 2, RIM = 4, SUNK = 8;

    function flat(dx, dz) { return Math.sqrt(dx * dx + dz * dz); }

    /* A new tape, at the moment of the strike: the world has just been
       launched, so the ball is still on the tee and already has its speed.
       `shot` is what the replay needs to strike it again — the line it left on
       (`yaw`), how hard (`feel`, 0..1) and what it was struck off (`kind`). */
    function begin(world, shot) {
        var b = world.ball;
        var tape = {
            hole: world.hole,
            t0: world.time,
            yaw: shot.yaw, feel: shot.feel, kind: shot.kind || null,
            frames: [],
            sunk: false,
            full: false,
            cutT: 0
        };
        tape.frames.push(frame(0, b, 0));
        return tape;
    }

    function frame(t, b, ev) {
        return { t: t, x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, vz: b.vz, ev: ev };
    }

    // One step of the live roll, after physics has advanced it. `ev` is the
    // events object that step filled.
    function record(tape, world, ev) {
        if (!tape || tape.full) return;
        if (tape.frames.length >= C.REPLAY.MAX_FRAMES) { tape.full = true; return; }
        var bits = 0;
        if (ev) {
            if (ev.bounce) bits |= BOUNCE;
            if (ev.land) bits |= LAND;
            if (ev.rim) bits |= RIM;
            if (ev.sunk) bits |= SUNK;
        }
        tape.frames.push(frame(world.time - tape.t0, world.ball, bits));
        if (world.sunk) tape.sunk = true;
    }

    // Seconds of tape, strike to stop.
    function length(tape) {
        var f = tape.frames;
        return f.length ? f[f.length - 1].t : 0;
    }

    /* Whether this tape is one worth showing: it went in, on the hole asked
       about, and every step of it is on the tape. */
    function playable(tape, hole) {
        return !!(tape && tape.sunk && !tape.full && tape.hole === hole && tape.frames.length > 1);
    }

    /* When the picture cuts to the cup, in tape seconds. The first moment the
       ball comes inside the cut radius *and stays inside it* — a pipe can carry
       it past the cup and back, and a cup camera watching the ball leave is
       watching the wrong thing — and never so late that there is less than
       CUT_LEAD of the shot left to watch from there. */
    function cutTime(tape) {
        var R = C.REPLAY, f = tape.frames, cup = tape.hole.cup;
        var tee = tape.hole.tee;
        var span = flat(cup.x - tee.x, cup.z - tee.z);
        var radius = Math.max(R.CUT_MIN, Math.min(R.CUT_MAX, span * R.CUT_SHARE));
        var at = length(tape), i;
        for (i = f.length - 1; i >= 0; i--) {
            if (flat(f[i].x - cup.x, f[i].z - cup.z) > radius) break;
            at = f[i].t;
        }
        return Math.max(0, Math.min(at, length(tape) - R.CUT_LEAD));
    }

    // Close the tape once the ball has gone in. Returns it, for chaining.
    function finish(tape) {
        if (tape) tape.cutT = cutTime(tape);
        return tape;
    }

    /* The ball `t` seconds into the tape, into `out`, which is also returned:
       {x,y,z,vx,vy,vz} linearly between the two frames either side, `time` on
       the world's own clock, and `i`, the last frame at or before `t` — the
       caller fires each frame's events once as `i` passes it. Clamped at both
       ends: before the strike the ball is on the tee, after the end it is
       wherever it stopped. */
    function sample(tape, t, out) {
        var f = tape.frames, n = f.length;
        out = out || {};
        var lo = 0, hi = n - 1, mid;
        if (t <= f[0].t) hi = 0;
        else if (t >= f[n - 1].t) lo = hi = n - 1;
        else {
            while (hi - lo > 1) {
                mid = (lo + hi) >> 1;
                if (f[mid].t <= t) lo = mid; else hi = mid;
            }
        }
        var a = f[lo], b = f[hi];
        var u = hi > lo && b.t > a.t ? (t - a.t) / (b.t - a.t) : 0;
        out.x = a.x + (b.x - a.x) * u;
        out.y = a.y + (b.y - a.y) * u;
        out.z = a.z + (b.z - a.z) * u;
        out.vx = a.vx + (b.vx - a.vx) * u;
        out.vy = a.vy + (b.vy - a.vy) * u;
        out.vz = a.vz + (b.vz - a.vz) * u;
        out.i = hi === lo ? lo : (u >= 1 ? hi : lo);
        out.time = tape.t0 + Math.max(f[0].t, Math.min(f[n - 1].t, t));
        return out;
    }

    /* How fast the tape runs `t` seconds in: full speed until the cut, then
       easing down to SLOW over the last few units to the cup. Read off the
       ball's distance rather than the clock, so a long putt and a dropped wedge
       both slow down for the same part of the picture. */
    function rate(tape, t, ball) {
        var R = C.REPLAY;
        if (t < tape.cutT) return 1;
        var cup = tape.hole.cup;
        var d = flat(ball.x - cup.x, ball.z - cup.z);
        var u = Math.max(0, Math.min(1, (R.SLOW_FROM - d) / (R.SLOW_FROM - R.SLOW_AT)));
        u = u * u * (3 - 2 * u);
        return 1 + (R.SLOW - 1) * u;
    }

    /* Where the cup camera may stand, best first, for a ball arriving from
       `from`. Beyond the cup and off to one side of the line in: far enough
       round that the flagstick is not between the camera and the ball, near
       enough to the line that the ball is still coming *at* the picture. Then
       wider, then square on, and the two straight ones last, because a ball
       rolling straight down the lens is a ball hidden behind the pin. Each is
       lifted clear of whatever ground is under it. */
    var ANGLES = [0.55, -0.55, 0.95, -0.95, 0.3, -0.3, 1.4, -1.4, 2.0, -2.0, 0, Math.PI];

    function seats(hole, from) {
        var R = C.REPLAY, cup = hole.cup;
        var dx = cup.x - from.x, dz = cup.z - from.z, d = flat(dx, dz);
        // A ball dropped straight in from above has no line in; the hole's own
        // line is the next best thing.
        if (d < 1e-3) { dx = cup.x - hole.tee.x; dz = cup.z - hole.tee.z; d = flat(dx, dz) || 1; }
        var ux = dx / d, uz = dz / d, out = [], i;
        for (i = 0; i < ANGLES.length; i++) {
            var c = Math.cos(ANGLES[i]), s = Math.sin(ANGLES[i]);
            var px = cup.x + (ux * c - uz * s) * R.SEAT_DIST;
            var pz = cup.z + (uz * c + ux * s) * R.SEAT_DIST;
            var top = P.surfaceTop(hole, px, pz);
            var ground = top ? Math.max(top.y, cup.y) : cup.y;
            out.push({ x: px, y: ground + R.SEAT_UP, z: pz });
        }
        return out;
    }

    G3.replay = {
        begin: begin,
        record: record,
        finish: finish,
        playable: playable,
        length: length,
        sample: sample,
        rate: rate,
        seats: seats,
        cutTime: cutTime,
        BOUNCE: BOUNCE, LAND: LAND, RIM: RIM, SUNK: SUNK
    };

})(window.G3);
