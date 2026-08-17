/* The 3D simulation: flight, bounce, roll, and the cup.

   Same contract as the 2D engine — no DOM, no three.js, no input. advance()
   is the only integrator, the renderer and the tests both drive it, and it
   subdivides whatever dt it is handed so a slow frame cannot change where the
   ball ends up.

   The ball is in one of two regimes and moves between them on contact:

     airborne  gravity, quadratic drag, and lift from spin. Backspin is what
               makes a ball carry; sidespin is what makes a mistimed strike
               curve, which is the whole point of the accuracy meter.

     rolling   pinned to the surface, pushed downhill by the component of
               gravity along it, slowed by a per-surface rolling resistance.
               Break on a green is not scripted here — the ball is on a hill,
               and the hill does it. */
(function (GOLF) {
    'use strict';

    var K = GOLF.CONFIG3D;
    var T = GOLF.terrain;

    function len3(x, y, z) { return Math.sqrt(x * x + y * y + z * z); }

    function groundY(hole, x, z) { return T.height(hole, x, z) + K.BALL_R; }

    /* ── world ──────────────────────────────────────────────────────────── */

    function createWorld(hole, from) {
        var y = groundY(hole, from.x, from.z);
        return {
            hole: hole,
            ball: { x: from.x, y: y, z: from.z, vx: 0, vy: 0, vz: 0 },
            spin: 0,            // sidespin, signed: + slices right
            backspin: 0,
            airborne: false,
            moving: false,
            time: 0,
            origin: { x: from.x, z: from.z },
            sunk: false,
            splash: false,
            ob: false,
            apex: 0,
            carry: 0
        };
    }

    function cloneWorld(w) {
        var c = createWorld(w.hole, { x: w.ball.x, z: w.ball.z });
        c.ball.x = w.ball.x; c.ball.y = w.ball.y; c.ball.z = w.ball.z;
        c.ball.vx = w.ball.vx; c.ball.vy = w.ball.vy; c.ball.vz = w.ball.vz;
        c.spin = w.spin; c.backspin = w.backspin;
        c.airborne = w.airborne; c.moving = w.moving; c.time = w.time;
        c.origin.x = w.origin.x; c.origin.z = w.origin.z;
        return c;
    }

    /* Strike the ball.

       `dir` is the aim heading in radians, `power` 0..1 from the power meter,
       and `accuracy` the signed miss from the meter's sweet spot, -1..1, which
       becomes sidespin and a small push off the aim line. A dead-centre strike
       is a straight ball; everything else curves, and the curve is the ball's,
       not a fudge applied to the aim. */
    function launch(world, club, dir, power, accuracy) {
        var speed = club.speed * Math.max(0, Math.min(1, power));
        if (speed < 0.05) return false;

        var loft = club.loft * Math.PI / 180;
        // A mis-hit also loses a little speed: catching it off-centre never
        // helped anyone.
        speed *= 1 - Math.min(0.16, Math.abs(accuracy) * 0.2);

        // Push the start line a touch the way the ball will curve, so a slice
        // starts right and keeps going rather than starting straight and
        // hooking back across itself.
        var push = accuracy * 0.055;
        var heading = dir + push;

        var horiz = speed * Math.cos(loft);
        world.ball.vx = Math.sin(heading) * horiz;
        world.ball.vz = Math.cos(heading) * horiz;
        world.ball.vy = speed * Math.sin(loft);

        world.spin = accuracy * club.spin * 0.85;
        world.backspin = club.spin * (0.55 + 0.45 * power);

        world.origin.x = world.ball.x;
        world.origin.z = world.ball.z;
        world.airborne = club.loft > 0;
        world.moving = true;
        world.splash = false;
        world.ob = false;
        world.apex = world.ball.y;
        world.carry = 0;
        return true;
    }

    /* ── flight ─────────────────────────────────────────────────────────── */

    function stepAir(world, dt, events) {
        var b = world.ball;
        var v = len3(b.vx, b.vy, b.vz);

        var ax = 0, ay = -K.GRAVITY, az = 0;

        if (v > 0.001) {
            // Quadratic drag, opposing travel.
            var d = K.DRAG * v;
            ax -= d * b.vx;
            ay -= d * b.vy;
            az -= d * b.vz;

            // Backspin lift: perpendicular to travel, in the vertical plane.
            // This is what keeps a struck ball in the air long enough to carry
            // a sensible distance; without it every club drops like a stone.
            var lift = K.LIFT * world.backspin * v / 1000;
            var hs = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
            if (hs > 0.001) {
                ay += lift * hs / v;
                ax -= lift * (b.vy * b.vx / hs) / v;
                az -= lift * (b.vy * b.vz / hs) / v;
            }

            // Sidespin: horizontal, perpendicular to the ground track.
            if (hs > 0.001 && world.spin !== 0) {
                var m = K.MAGNUS * world.spin * v / 1000;
                ax += m * (b.vz / hs);
                az -= m * (b.vx / hs);
            }
        }

        b.vx += ax * dt; b.vy += ay * dt; b.vz += az * dt;
        b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;

        var decay = Math.pow(K.SPIN_DECAY, dt);
        world.spin *= decay;
        world.backspin *= decay;

        if (b.y > world.apex) world.apex = b.y;

        var floor = groundY(world.hole, b.x, b.z);
        if (b.y <= floor) {
            b.y = floor;
            land(world, events);
        }
    }

    /* Contact. Split the velocity about the surface normal: the normal part
       bounces and loses restitution, the tangential part is scrubbed by the
       surface's grab. Soft ground (sand, rough) kills both, which is why a
       ball plugs in a bunker instead of skipping out of it. */
    function land(world, events) {
        var b = world.ball;
        var n = T.normal(world.hole, b.x, b.z);
        var surf = T.surfaceAt(world.hole, b.x, b.z);
        var p = T.propsFor(surf);

        if (!world.carry) {
            world.carry = Math.hypot(b.x - world.origin.x, b.z - world.origin.z);
        }

        var vn = b.vx * n.x + b.vy * n.y + b.vz * n.z;
        var tx = b.vx - vn * n.x, ty = b.vy - vn * n.y, tz = b.vz - vn * n.z;

        var bounceSpeed = -vn * p.restitution;
        var tangential = len3(tx, ty, tz);

        events.bounce = true;
        events.bounceSurface = surf;
        events.bounceSpeed = Math.abs(vn);

        // Backspin bites on the first bounce and drags the ball back up the
        // slope a little — the reason a wedge checks up near the pin.
        var check = Math.min(0.35, world.backspin / 26000);
        b.vx = tx * p.grab * (1 - check);
        b.vy = ty * p.grab + bounceSpeed * n.y;
        b.vz = tz * p.grab * (1 - check);
        b.vx += bounceSpeed * n.x;
        b.vz += bounceSpeed * n.z;

        world.spin *= 0.45;
        world.backspin *= 0.35;

        // Too slow to leave the ground again: start rolling.
        if (bounceSpeed < 0.55 || tangential < 0.7) {
            world.airborne = false;
            b.y = groundY(world.hole, b.x, b.z);
            var dot = b.vx * n.x + b.vy * n.y + b.vz * n.z;
            b.vx -= dot * n.x; b.vy -= dot * n.y; b.vz -= dot * n.z;
        }
    }

    /* ── rolling ────────────────────────────────────────────────────────── */

    function stepRoll(world, dt, events) {
        var b = world.ball;
        var hole = world.hole;
        var n = T.normal(hole, b.x, b.z);
        var surf = T.surfaceAt(hole, b.x, b.z);
        var p = T.propsFor(surf);

        // Gravity along the surface. On the flat this is zero; on a green it
        // is the break.
        var g = K.GRAVITY;
        var gn = -g * n.y;                 // gravity dotted with the normal
        var ax = -gn * n.x;
        var ay = -g - gn * n.y;
        var az = -gn * n.z;

        b.vx += ax * dt; b.vy += ay * dt; b.vz += az * dt;

        /* Coulomb rolling resistance: a constant deceleration against the
           direction of travel, clamped so it can bring the ball to a stop but
           never push it backwards. This is what lets a ball sit still on a
           slope — the resistance does not fade as the ball slows. */
        var speed = len3(b.vx, b.vy, b.vz);
        if (speed > 1e-9) {
            var drop = p.decel * dt;
            var scale = drop >= speed ? 0 : 1 - drop / speed;
            b.vx *= scale; b.vy *= scale; b.vz *= scale;
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.z += b.vz * dt;

        // Stay glued to the ground, and drop the velocity component that would
        // push the ball into or out of it.
        b.y = groundY(hole, b.x, b.z);
        var m = T.normal(hole, b.x, b.z);
        var dot = b.vx * m.x + b.vy * m.y + b.vz * m.z;
        b.vx -= dot * m.x; b.vy -= dot * m.y; b.vz -= dot * m.z;

        events.rolling = true;
        events.rollSurface = surf;

        /* At rest only if the ball is slow *and* the slope it is sitting on
           cannot get it moving again — gravity along the surface has to lose
           to rolling resistance, or the ball would stop for a frame and then
           trickle on, which is exactly the hanging-on-a-hillside bug the 2D
           engine had in another form. */
        var settled = len3(b.vx, b.vy, b.vz);
        var steep = Math.sqrt(Math.max(0, 1 - m.y * m.y));   // sin of the slope
        if (settled < K.ROLL_STOP && K.GRAVITY * steep < p.decel) {
            b.vx = b.vy = b.vz = 0;
            world.moving = false;
            events.rest = true;
        }
    }

    /* ── hazards and the cup ────────────────────────────────────────────── */

    function checkCup(world, events) {
        var b = world.ball, hole = world.hole;
        var dx = hole.pin.x - b.x, dz = hole.pin.z - b.z;
        var d = Math.hypot(dx, dz);
        if (d > K.CUP_R || world.airborne) return false;

        var speed = len3(b.vx, b.vy, b.vz);
        if (speed < K.CAPTURE_SPEED) {
            b.x = hole.pin.x;
            b.z = hole.pin.z;
            b.y = T.height(hole, b.x, b.z) - 0.05;
            b.vx = b.vy = b.vz = 0;
            world.sunk = true;
            world.moving = false;
            events.sunk = true;
            return true;
        }
        // Over the rim too fast: the cup grabs at it and lets it go.
        if (d > 1e-6) {
            var pull = K.CUP_PULL * (1 - d / K.CUP_R) * (1 / 240);
            b.vx += (dx / d) * pull;
            b.vz += (dz / d) * pull;
            events.lip = true;
        }
        return false;
    }

    function checkTrees(world, events) {
        var trees = world.hole.trees;
        if (!trees) return;
        var b = world.ball;
        for (var i = 0; i < trees.length; i++) {
            var t = trees[i];
            var dx = b.x - t.x, dz = b.z - t.z;
            var d = Math.hypot(dx, dz);
            var r = t.r + K.BALL_R;
            if (d > r || b.y > T.height(world.hole, t.x, t.z) + t.h) continue;

            if (d < 1e-6) { dx = 1; dz = 0; d = 1; }
            var nx = dx / d, nz = dz / d;
            b.x = t.x + nx * r;
            b.z = t.z + nz * r;
            var vn = b.vx * nx + b.vz * nz;
            if (vn < 0) {
                b.vx -= (1 + K.TREE_RESTITUTION) * vn * nx;
                b.vz -= (1 + K.TREE_RESTITUTION) * vn * nz;
                b.vy *= 0.5;
                world.spin = 0;
                events.tree = true;
            }
        }
    }

    function checkHazards(world, events) {
        var b = world.ball;
        if (T.outOfBounds(world.hole, b.x, b.z)) {
            world.ob = true;
            world.moving = false;
            b.vx = b.vy = b.vz = 0;
            events.ob = true;
            return true;
        }
        if (T.surfaceAt(world.hole, b.x, b.z) === T.SURFACE.WATER &&
            b.y <= groundY(world.hole, b.x, b.z) + 0.02) {
            world.splash = true;
            world.moving = false;
            b.vx = b.vy = b.vz = 0;
            events.splash = true;
            return true;
        }
        return false;
    }

    /* ── integration ────────────────────────────────────────────────────── */

    function substep(world, dt, events) {
        world.time += dt;
        if (world.airborne) stepAir(world, dt, events);
        else stepRoll(world, dt, events);

        checkTrees(world, events);
        if (checkHazards(world, events)) return;
        checkCup(world, events);
    }

    function advance(world, dt, events) {
        events = events || {};
        if (world.sunk || world.splash || world.ob) return events;

        var steps = Math.min(K.MAX_SUBSTEPS, Math.max(1, Math.ceil(dt / K.SIM_DT)));
        var h = dt / steps;
        for (var i = 0; i < steps; i++) {
            substep(world, h, events);
            if (world.sunk || world.splash || world.ob || !world.moving) break;
        }
        return events;
    }

    function settle(world, maxSeconds) {
        var limit = Math.ceil((maxSeconds || K.MAX_SHOT_SECONDS) / K.SIM_DT);
        for (var i = 0; i < limit; i++) {
            advance(world, K.SIM_DT);
            if (world.sunk || world.splash || world.ob || !world.moving) break;
        }
        return world;
    }

    function simulateShot(hole, from, club, dir, power, accuracy) {
        var w = createWorld(hole, from);
        if (!launch(w, club, dir, power, accuracy)) return w;
        return settle(w);
    }

    // Sample a shot's path for the flight camera and the tracer line.
    function tracePath(hole, from, club, dir, power, accuracy, everyN) {
        var w = createWorld(hole, from);
        if (!launch(w, club, dir, power, accuracy)) return [];
        var pts = [], n = everyN || 8, i = 0;
        var limit = Math.ceil(K.MAX_SHOT_SECONDS / K.SIM_DT);
        while (i++ < limit) {
            advance(w, K.SIM_DT);
            if (i % n === 0) pts.push({ x: w.ball.x, y: w.ball.y, z: w.ball.z });
            if (w.sunk || w.splash || w.ob || !w.moving) break;
        }
        return pts;
    }

    GOLF.physics3d = {
        createWorld: createWorld,
        cloneWorld: cloneWorld,
        launch: launch,
        advance: advance,
        settle: settle,
        simulateShot: simulateShot,
        tracePath: tracePath,
        groundY: groundY,
        speedOf: function (b) { return len3(b.vx, b.vy, b.vz); }
    };

})(window.GOLF);
