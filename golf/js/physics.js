/* The simulation. No canvas, no DOM, no input — everything in here is a pure
   function of a world object, which is what lets tests.html run thousands of
   shots headlessly and lets a bot play the whole course between two frames.

   The one rule worth protecting: the game loop and the tests must never have
   their own copies of the integrator. Both call advance(), which subdivides
   whatever dt it is handed into steps small enough that the ball cannot pass
   through a wall. A frame at 8fps and a fixed 1/120 test step therefore
   produce the same physics, only sampled differently. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;

    // Rolling under exponential drag has a closed form, so the substep uses it
    // rather than "decay the velocity, then move at the new velocity". That
    // shortcut carries an O(dt) bias, which only vanishes while the substep
    // cap is subdividing — below ~110px/s the cap stops firing and a 30Hz
    // caller quietly rolls the ball a couple of pixels short of a 120Hz one.
    // With the integral, distance over a substep is exact at any dt.
    var LN_GRASS = Math.log(C.FRICTION_GRASS);
    var LN_SAND = Math.log(C.FRICTION_SAND);
    var LN_ICE = Math.log(C.FRICTION_ICE);
    var LN_ROUGH = Math.log(C.FRICTION_ROUGH);

    var EMPTY = [];

    /* ── geometry ───────────────────────────────────────────────────────── */

    // A moving wall's rectangle at time t. Static walls are returned as-is so
    // callers never have to care which kind they are holding.
    function wallRect(w, t) {
        if (!w.move) return w;
        var o = Math.sin(t * w.move.speed + (w.move.phase || 0)) * w.move.amp;
        return w.move.axis === 'y'
            ? { x: w.x, y: w.y + o, w: w.w, h: w.h }
            : { x: w.x + o, y: w.y, w: w.w, h: w.h };
    }

    // Derivative of the above: how fast the wall itself is travelling, so a
    // gate can knock a resting ball along instead of swallowing it.
    function wallVelocity(w, t) {
        if (!w.move) return { x: 0, y: 0 };
        var d = Math.cos(t * w.move.speed + (w.move.phase || 0)) * w.move.amp * w.move.speed;
        return w.move.axis === 'y' ? { x: 0, y: d } : { x: d, y: 0 };
    }

    function pointInRect(x, y, R) {
        return x >= R.x && x <= R.x + R.w && y >= R.y && y <= R.y + R.h;
    }

    function zoneAt(list, x, y) {
        if (!list) return null;
        for (var i = 0; i < list.length; i++) {
            if (pointInRect(x, y, list[i])) return list[i];
        }
        return null;
    }

    /* Circle vs axis-aligned box. Returns the outward normal and penetration
       depth, or null. The degenerate case matters: if the ball's center has
       ended up inside the box (a moving wall can sweep over a resting ball)
       there is no closest-point direction to use, so it escapes through the
       nearest face instead. Without that branch the ball sticks inside the
       wall and the reflection flips sign every step. */
    function circleRect(cx, cy, rad, R) {
        var px = Math.max(R.x, Math.min(cx, R.x + R.w));
        var py = Math.max(R.y, Math.min(cy, R.y + R.h));
        var dx = cx - px, dy = cy - py;
        var d2 = dx * dx + dy * dy;
        if (d2 > rad * rad) return null;

        if (d2 > 1e-9) {
            var d = Math.sqrt(d2);
            return { nx: dx / d, ny: dy / d, depth: rad - d };
        }

        var left = cx - R.x, right = R.x + R.w - cx;
        var top = cy - R.y, bottom = R.y + R.h - cy;
        var m = Math.min(left, right, top, bottom);
        if (m === left) return { nx: -1, ny: 0, depth: left + rad };
        if (m === right) return { nx: 1, ny: 0, depth: right + rad };
        if (m === top) return { nx: 0, ny: -1, depth: top + rad };
        return { nx: 0, ny: 1, depth: bottom + rad };
    }

    /* Circle vs circle, for bumpers. Same contract as circleRect: outward
       normal and penetration depth, or null. The concentric case cannot
       happen from play — a bumper is far wider than a substep of travel — but
       it is answered anyway so the function is total. */
    function circleCircle(cx, cy, rad, B) {
        var dx = cx - B.x, dy = cy - B.y;
        var d2 = dx * dx + dy * dy;
        var sum = rad + B.r;
        if (d2 > sum * sum) return null;
        if (d2 < 1e-9) return { nx: 1, ny: 0, depth: sum };
        var d = Math.sqrt(d2);
        return { nx: dx / d, ny: dy / d, depth: sum - d };
    }

    /* ── world ──────────────────────────────────────────────────────────── */

    function createWorld(course, from, time) {
        return {
            course: course,
            ball: { x: from.x, y: from.y, vx: 0, vy: 0 },
            origin: { x: from.x, y: from.y },   // where this shot was played from
            time: time || 0,
            moving: false,
            sunk: false,
            splash: false
        };
    }

    /* ── the overswing ──────────────────────────────────────────────────

       How far off line a shot at this power may stray, in radians. Zero
       through the whole of the safe zone, then quadratic to SPREAD_MAX at the
       top of the dial, so the boundary is not a cliff you fall off — the first
       few pixels of extra pull cost almost nothing, and the last ones cost
       everything. */
    function spread(power) {
        if (power <= C.SAFE_POWER) return 0;
        var over = Math.min(1, (power - C.SAFE_POWER) / (C.MAX_POWER - C.SAFE_POWER));
        return C.SPREAD_MAX * over * over;
    }

    /* The deviation for one particular shot. `u` is a uniform sample in [0,1)
       and is passed in rather than drawn here, because everything else in this
       file is a pure function of its arguments and this is what keeps it that
       way: the game draws from Math.random, the bot from its seeded PRNG, and
       the tests from whatever they need to prove.

       Squaring the signed offset concentrates the result near the middle. A
       uniform draw would put the ball on the edge of the cone as often as on
       the line, which reads as the shot being taken away from you rather than
       as a shot you did not quite control. */
    function scatter(power, u) {
        var d = u * 2 - 1;
        return d * Math.abs(d) * spread(power);
    }

    function launch(world, angle, power) {
        var p = Math.max(0, Math.min(C.MAX_POWER, power));
        if (p < C.MIN_POWER) return false;
        world.origin.x = world.ball.x;
        world.origin.y = world.ball.y;
        world.ball.vx = Math.cos(angle) * p;
        world.ball.vy = Math.sin(angle) * p;
        world.moving = true;
        world.splash = false;
        return true;
    }

    function speedOf(b) { return Math.hypot(b.vx, b.vy); }

    /* ── integration ────────────────────────────────────────────────────── */

    function substep(world, dt, events) {
        var b = world.ball, course = world.course;
        world.time += dt;

        var slope = zoneAt(course.slopes, b.x, b.y);
        if (slope) {
            b.vx += slope.ax * dt;
            b.vy += slope.ay * dt;
        }

        // Surface, worst first: a bunker under a frozen pond is the worse
        // news of the two, and rough is what is left when nothing else claims
        // the ball. One lookup wins outright — surfaces do not blend.
        var k = C.FRICTION_GRASS, lnK = LN_GRASS;
        if (zoneAt(course.sand, b.x, b.y)) {
            k = C.FRICTION_SAND; lnK = LN_SAND;
        } else if (zoneAt(course.ice, b.x, b.y)) {
            k = C.FRICTION_ICE; lnK = LN_ICE;
        } else if (zoneAt(course.rough, b.x, b.y)) {
            k = C.FRICTION_ROUGH; lnK = LN_ROUGH;
        }

        var decay = Math.pow(k, dt);
        var travel = (decay - 1) / lnK;  // ∫₀^dt k^s ds

        b.x += b.vx * travel;
        b.y += b.vy * travel;
        b.vx *= decay;
        b.vy *= decay;

        // Walls. Resolve the overlap first, then reflect, then add the wall's
        // own motion along the normal so a sweeping gate pushes rather than
        // pins. Solved one wall at a time; overlapping wall rectangles are
        // allowed and simply resolve over consecutive substeps.
        for (var i = 0; i < course.walls.length; i++) {
            var R = wallRect(course.walls[i], world.time);
            var hit = circleRect(b.x, b.y, C.BALL_R, R);
            if (!hit) continue;

            b.x += hit.nx * hit.depth;
            b.y += hit.ny * hit.depth;

            var vn = b.vx * hit.nx + b.vy * hit.ny;
            if (vn < 0) {
                b.vx -= (1 + C.RESTITUTION) * vn * hit.nx;
                b.vy -= (1 + C.RESTITUTION) * vn * hit.ny;
                events.bounce = true;
            }
            var wv = wallVelocity(course.walls[i], world.time);
            var wn = wv.x * hit.nx + wv.y * hit.ny;
            if (wn > 0) {
                b.vx += wv.x;
                b.vy += wv.y;
                events.bounce = true;
            }
        }

        // Bumpers. A post the ball comes off faster than it comes off wood,
        // which is what makes them worth avoiding: they do not merely block a
        // line, they choose a new one for you.
        var bumpers = course.bumpers || EMPTY;
        for (var j = 0; j < bumpers.length; j++) {
            var bump = circleCircle(b.x, b.y, C.BALL_R, bumpers[j]);
            if (!bump) continue;

            b.x += bump.nx * bump.depth;
            b.y += bump.ny * bump.depth;

            var bn = b.vx * bump.nx + b.vy * bump.ny;
            if (bn < 0) {
                b.vx -= (1 + C.BUMPER_RESTITUTION) * bn * bump.nx;
                b.vy -= (1 + C.BUMPER_RESTITUTION) * bn * bump.ny;
                events.bumper = true;
            }
        }

        // Cushions. The field edge is solid on all four sides.
        if (b.x < C.BALL_R) { b.x = C.BALL_R; b.vx = Math.abs(b.vx) * C.RESTITUTION; events.bounce = true; }
        if (b.x > C.WORLD_W - C.BALL_R) { b.x = C.WORLD_W - C.BALL_R; b.vx = -Math.abs(b.vx) * C.RESTITUTION; events.bounce = true; }
        if (b.y < C.BALL_R) { b.y = C.BALL_R; b.vy = Math.abs(b.vy) * C.RESTITUTION; events.bounce = true; }
        if (b.y > C.WORLD_H - C.BALL_R) { b.y = C.WORLD_H - C.BALL_R; b.vy = -Math.abs(b.vy) * C.RESTITUTION; events.bounce = true; }

        // The cup. Inside the rim the ball is pulled toward the center, which
        // is what makes a slow ball on a bad line still drop and a fast one
        // curl around the lip and come out the far side.
        var dx = course.hole.x - b.x, dy = course.hole.y - b.y;
        var d = Math.hypot(dx, dy);
        if (d < C.HOLE_R) {
            var sp = speedOf(b);
            if (sp < C.CAPTURE_SPEED) {
                b.x = course.hole.x;
                b.y = course.hole.y;
                b.vx = b.vy = 0;
                world.sunk = true;
                world.moving = false;
                events.sunk = true;
                return;
            }
            if (d > 1e-6) {
                var pull = C.CUP_PULL * (1 - d / C.HOLE_R) * dt;
                b.vx += (dx / d) * pull;
                b.vy += (dy / d) * pull;
                events.lip = true;
            }
        }

        if (zoneAt(course.water, b.x, b.y)) {
            b.vx = b.vy = 0;
            world.splash = true;
            world.moving = false;
            events.splash = true;
            return;
        }

        // At rest — unless it is sitting on a slope, in which case gravity has
        // not finished with it and stopping here would let the ball hang on a
        // hillside.
        if (speedOf(b) < C.STOP_SPEED && !zoneAt(course.slopes, b.x, b.y)) {
            b.vx = b.vy = 0;
            if (world.moving) events.rest = true;
            world.moving = false;
        }
    }

    /* Subdivide dt so the ball never travels more than half its radius per
       step, which is what keeps it from crossing a wall between samples. The
       cap is a safety valve: at MAX_SUBSTEPS and full power a step is ~0.4px,
       far inside the margin. */
    function advance(world, dt, events) {
        events = events || {};
        if (world.sunk || world.splash) return events;

        var steps = Math.min(
            C.MAX_SUBSTEPS,
            Math.max(1, Math.ceil(speedOf(world.ball) * dt / (C.BALL_R * 0.5)))
        );
        var h = dt / steps;
        for (var i = 0; i < steps; i++) {
            substep(world, h, events);
            if (world.sunk || world.splash) break;
        }
        return events;
    }

    // Run a world forward until the ball stops, drowns, or drops. Used by the
    // tests and by the practice bot; the game itself advances per frame.
    function settle(world, maxSeconds) {
        var dt = C.SIM_DT;
        var limit = Math.ceil((maxSeconds || C.MAX_SHOT_SECONDS) / dt);
        for (var i = 0; i < limit; i++) {
            advance(world, dt);
            if (world.sunk || world.splash || !world.moving) break;
        }
        return world;
    }

    function simulateShot(course, from, angle, power, time) {
        var w = createWorld(course, from, time);
        if (!launch(w, angle, power)) return w;
        return settle(w);
    }

    /* There is deliberately no trajectory preview in here. An earlier version
       cloned the world and ran the next 0.6s forward so the renderer could
       dash the ball's path on screen, which quietly answered the two questions
       the game is made of — how hard, and off which cushion. The clone is gone
       with it; nothing else needed one. */

    GOLF.physics = {
        wallRect: wallRect,
        wallVelocity: wallVelocity,
        pointInRect: pointInRect,
        zoneAt: zoneAt,
        circleRect: circleRect,
        circleCircle: circleCircle,
        spread: spread,
        scatter: scatter,
        createWorld: createWorld,
        launch: launch,
        advance: advance,
        settle: settle,
        simulateShot: simulateShot,
        speedOf: speedOf
    };

})(window.GOLF);
