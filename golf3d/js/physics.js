/* physics.js — the simulation, and the only thing that decides where a ball
   goes.

   ## The layer rule

   No three.js, no canvas, no DOM, no game. Nothing in this file may reach for
   any of them, and render-tests.html fails if it does — because that rule is
   what lets tests.html play four hundred assertions' worth of golf with no
   GPU at all, and what lets the renderer draw a *true* preview arc by cloning
   the world and running it forward with this same code.

   ## Sections

     pads     the ground: flat and tilted quads, and what is under the ball
     walls    boxes that may slide or spin, and circle-vs-box in the xz plane
     world    creating, cloning and launching
     the step advance(), which is the integrator and the only one there is

   Read by game.js, render/hole.js, render/aim.js, courses.js and both test
   pages. Depends on config.js and nothing else.

   The simulation. No three.js, no canvas, no DOM — everything in here is a
   pure function of a world object, which is what lets tests.html play whole
   rounds headlessly and lets the renderer draw a predicted arc by cloning the
   world and running it forward.

   The one rule worth protecting, inherited from the 2D game: the game loop,
   the renderer and the tests must never grow their own copy of the
   integrator. Everything calls advance(), which subdivides whatever dt it is
   handed into steps small enough that the ball cannot pass through a wall. A
   frame at 8fps and a fixed 1/120 test step therefore produce the same
   physics, only sampled differently.

   The 3D part, in one paragraph: the course is a set of axis-aligned pads,
   each of which is a flat or tilted quad. While the ball is grounded it lives
   exactly on the pad under it and only x/z are integrated — the height comes
   from the pad, and the pad's gradient supplies the acceleration, which is how
   a breaking green and a ramp are the same piece of code. When the ground
   falls away (a ledge, the lip of a ramp, a lofted shot) the ball goes
   airborne, gravity takes over, and it lands on whatever pad it meets. Walls
   are boxes with a base and a top, so a ball above a rail flies over it.
   That is the whole model. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;

    // Rolling under exponential drag has a closed form, so a substep uses it
    // rather than "decay the velocity, then move at the new velocity". That
    // shortcut carries an O(dt) bias which only vanishes while the substep cap
    // is subdividing; below walking pace the cap stops firing and a 30Hz
    // caller quietly rolls the ball short of a 120Hz one. With the integral,
    // distance over a substep is exact at any dt.
    var LN = {};
    (function () {
        for (var k in C.FRICTION) {
            if (Object.prototype.hasOwnProperty.call(C.FRICTION, k)) LN[k] = Math.log(C.FRICTION[k]);
        }
    })();

    function frictionOf(kind) {
        return C.FRICTION[kind] !== undefined ? C.FRICTION[kind] : C.FRICTION_DEFAULT;
    }
    function lnFrictionOf(kind) {
        return LN[kind] !== undefined ? LN[kind] : Math.log(C.FRICTION_DEFAULT);
    }

    /* ── pads: the ground ───────────────────────────────────────────────── */

    /* A pad is { x, z, w, d, y, sx, sz, kind }: an axis-aligned footprint,
       a height at its (x, z) corner, and a gradient. Height anywhere on it is
       that plane evaluated at the point. Tilt both components and you get a
       diagonal fall line, which is all a breaking green is. */
    function padHeight(pad, x, z) {
        return pad.y + (pad.sx || 0) * (x - pad.x) + (pad.sz || 0) * (z - pad.z);
    }

    function padContains(pad, x, z) {
        return x >= pad.x && x <= pad.x + pad.w && z >= pad.z && z <= pad.z + pad.d;
    }

    /* The floor of the cup, as a pad the rest of the code can treat like any
       other. It has no footprint of its own: surfaceUnder() hands it back for
       points inside the cup, and its friction is what stops a ball that has
       dropped in from rattling about down there. */
    var CUP_PAD = { x: 0, z: 0, w: 0, d: 0, y: 0, kind: 'cup', sx: 0, sz: 0 };

    /* The pad the ball is standing on: the highest one under the point that is
       not above `ceil`. The ceiling is what makes bridges work — a ball on the
       ground below a walkway must not be teleported onto it, and a ball on the
       walkway must not fall through to the ground.

       Inside the cup there is no green at all — the ground there is the floor
       of the hole, a cup's depth below. That one substitution is what makes the
       cup a hole rather than a rule: a ball whose centre crosses the rim runs
       out of support and falls, exactly as it would over any other edge. */
    function surfaceUnder(hole, x, z, ceil) {
        var best = null, bestY = -Infinity, pads = hole.pads, i, h;
        for (i = 0; i < pads.length; i++) {
            if (!padContains(pads[i], x, z)) continue;
            h = padHeight(pads[i], x, z);
            if (h > ceil) continue;
            if (h > bestY) { bestY = h; best = pads[i]; }
        }

        var cup = hole.cup;
        if (cup && best !== null && Math.abs(bestY - cup.y) < 0.06) {
            var cdx = x - cup.x, cdz = z - cup.z;
            if (cdx * cdx + cdz * cdz < C.HOLE_R * C.HOLE_R) {
                var floor = cup.y - C.CUP_DEPTH;
                return floor > ceil ? null : { pad: CUP_PAD, y: floor };
            }
        }
        return best ? { pad: best, y: bestY } : null;
    }

    // Highest pad at a point, ignoring any ceiling. Used to place the ball and
    // the cup from course data that only carries x/z.
    function surfaceTop(hole, x, z) {
        return surfaceUnder(hole, x, z, Infinity);
    }

    function waterAt(hole, x, z) {
        var w = hole.water, i;
        if (!w) return null;
        for (i = 0; i < w.length; i++) {
            if (x >= w[i].x && x <= w[i].x + w[i].w && z >= w[i].z && z <= w[i].z + w[i].d) return w[i];
        }
        return null;
    }

    /* ── walls: boxes that may slide or spin ────────────────────────────── */

    /* A wall is authored as an unrotated footprint (min corner + size) plus a
       base and a height, so a course reads like the 2D one. `yaw` rotates it
       about its own centre, `move` slides it on a sine, `spin` turns it. The
       renderer calls this same function for the mesh transform, so a blade the
       player sees and the blade the ball hits cannot drift apart. */
    function wallBox(w, t, out) {
        var cx = w.x + w.w / 2, cz = w.z + w.d / 2;
        var yaw = w.yaw || 0;
        var vx = 0, vz = 0, spin = 0;

        if (w.move) {
            var o = Math.sin(t * w.move.speed + (w.move.phase || 0)) * w.move.amp;
            var v = Math.cos(t * w.move.speed + (w.move.phase || 0)) * w.move.amp * w.move.speed;
            if (w.move.axis === 'z') { cz += o; vz = v; } else { cx += o; vx = v; }
        }
        if (w.spin) {
            spin = w.spin;
            yaw += w.spin * t;
        }
        // `out` lets the solver reuse one object across thousands of substeps.
        // Callers that keep the result (the renderer) simply omit it.
        var B = out || {};
        B.cx = cx; B.cz = cz;
        B.hw = w.w / 2; B.hd = w.d / 2;
        B.yaw = yaw; B.spin = spin;
        B.vx = vx; B.vz = vz;
        B.base = w.base || 0;
        B.top = (w.base || 0) + w.h;
        B.reach = Math.hypot(w.w, w.d) / 2;   // bounding radius, for early rejection
        B.src = w;
        return B;
    }

    /* Circle vs (possibly rotated) box, in the xz plane. Returns the outward
       normal in world space and the penetration depth, or null.

       The degenerate case matters: if the ball's centre has ended up inside
       the box — a spinning blade can sweep over a resting ball — there is no
       closest-point direction to use, so it escapes through the nearest face
       instead. Without that branch the ball sticks inside the wall and the
       reflection flips sign every step. */
    function circleBox(px, pz, r, B) {
        var s = Math.sin(B.yaw), c = Math.cos(B.yaw);
        var rx = px - B.cx, rz = pz - B.cz;
        // Inverse of THREE's Y rotation, so `yaw` means the same thing to the
        // physics and to the mesh.
        var lx = rx * c - rz * s;
        var lz = rx * s + rz * c;

        var qx = Math.max(-B.hw, Math.min(lx, B.hw));
        var qz = Math.max(-B.hd, Math.min(lz, B.hd));
        var dx = lx - qx, dz = lz - qz;
        var d2 = dx * dx + dz * dz;
        var nlx, nlz, depth;

        if (d2 > r * r) return null;

        if (d2 > 1e-12) {
            var d = Math.sqrt(d2);
            nlx = dx / d; nlz = dz / d;
            depth = r - d;
        } else {
            var left = lx + B.hw, right = B.hw - lx;
            var back = lz + B.hd, front = B.hd - lz;
            var m = Math.min(left, right, back, front);
            if (m === left) { nlx = -1; nlz = 0; depth = left + r; }
            else if (m === right) { nlx = 1; nlz = 0; depth = right + r; }
            else if (m === back) { nlx = 0; nlz = -1; depth = back + r; }
            else { nlx = 0; nlz = 1; depth = front + r; }
        }

        // Back to world: the forward rotation.
        return {
            nx: nlx * c + nlz * s,
            nz: -nlx * s + nlz * c,
            depth: depth,
            // Contact point, needed for the surface velocity of a spinner.
            cx: B.cx + (qx * c + qz * s),
            cz: B.cz + (-qx * s + qz * c)
        };
    }

    /* Velocity of the wall's surface at a contact point: its slide velocity
       plus ω × r for the spin. This is what lets a windmill blade knock a
       resting ball along instead of pinning it against the floor. */
    function wallPointVelocity(B, x, z) {
        var rx = x - B.cx, rz = z - B.cz;
        return { x: B.vx + B.spin * rz, z: B.vz - B.spin * rx };
    }

    /* ── world ──────────────────────────────────────────────────────────── */

    function ballTop(hole, x, z) {
        var s = surfaceTop(hole, x, z);
        return (s ? s.y : 0) + C.BALL_R;
    }

    function createWorld(hole, from, time) {
        var y = from.y !== undefined ? from.y : ballTop(hole, from.x, from.z);
        return {
            hole: hole,
            ball: { x: from.x, y: y, z: from.z, vx: 0, vy: 0, vz: 0 },
            origin: { x: from.x, y: y, z: from.z },  // where this shot was played from
            time: time || 0,
            grounded: true,
            moving: false,
            slowFor: 0,
            sunk: false,
            splash: false,
            out: false
        };
    }

    function cloneWorld(w) {
        var b = w.ball;
        return {
            hole: w.hole,
            ball: { x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, vz: b.vz },
            origin: { x: w.origin.x, y: w.origin.y, z: w.origin.z },
            time: w.time,
            grounded: w.grounded,
            slowFor: w.slowFor,
            moving: w.moving,
            sunk: w.sunk,
            splash: w.splash,
            out: w.out
        };
    }

    /* Aim is a compass yaw in the xz plane; loft lifts the shot out of it.
       A lofted ball leaves the ground immediately, which is the whole point —
       it is how you carry a rail, a bunker or a pond instead of going round. */
    function launch(world, yaw, power, loft) {
        var p = Math.max(0, Math.min(C.MAX_POWER, power));
        if (p < C.MIN_POWER) return false;
        var l = Math.max(0, Math.min(C.MAX_LOFT, loft || 0));
        var flat = Math.cos(l) * p;
        var b = world.ball;
        world.origin.x = b.x; world.origin.y = b.y; world.origin.z = b.z;
        b.vx = Math.sin(yaw) * flat;
        b.vz = Math.cos(yaw) * flat;
        b.vy = Math.sin(l) * p;
        world.moving = true;
        world.splash = false;
        world.out = false;
        if (b.vy > 0.01) world.grounded = false;
        return true;
    }

    function speedOf(b) { return Math.hypot(b.vx, b.vy, b.vz); }
    function groundSpeed(b) { return Math.hypot(b.vx, b.vz); }

    /* ── the step ───────────────────────────────────────────────────────── */

    var SCRATCH = {};

    function collideWalls(world, dt, events) {
        var b = world.ball, walls = world.hole.walls, i, w, B, hit, vn, wv, wn, dx, dz, reach;
        for (i = 0; i < walls.length; i++) {
            w = walls[i];
            // A ball flying over a rail, or rolling under a raised beam, does
            // not touch it. Vertical overlap first: it is the cheapest test,
            // and it needs none of the trigonometry.
            if (b.y - C.BALL_R >= (w.base || 0) + w.h || b.y + C.BALL_R <= (w.base || 0)) continue;

            B = wallBox(w, world.time, SCRATCH);
            // Then a bounding-circle reject, which is what keeps a hole with
            // twenty rails from costing twenty box transforms per substep.
            dx = b.x - B.cx; dz = b.z - B.cz;
            reach = B.reach + C.BALL_R;
            if (dx * dx + dz * dz > reach * reach) continue;

            hit = circleBox(b.x, b.z, C.BALL_R, B);
            if (!hit) continue;

            b.x += hit.nx * hit.depth;
            b.z += hit.nz * hit.depth;

            vn = b.vx * hit.nx + b.vz * hit.nz;
            if (vn < 0) {
                b.vx -= (1 + C.RESTITUTION) * vn * hit.nx;
                b.vz -= (1 + C.RESTITUTION) * vn * hit.nz;
                events.bounce = true;
            }
            wv = wallPointVelocity(B, hit.cx, hit.cz);
            wn = wv.x * hit.nx + wv.z * hit.nz;
            if (wn > 0) {
                b.vx += wv.x;
                b.vz += wv.z;
                events.bounce = true;
                events.struck = true;
            }
        }
    }

    /* The cup, in three pieces of geometry and no rules at all.

       The rim is the circle where the green ends, and it is an *edge*: the ball
       is a sphere, so the nearest point of that circle is what it can touch.
       Everything the old capture test used to fake falls out of this one
       collision. A ball whose centre is still outside the rim rests on it and
       rolls past. A slow ball crossing the rim loses its support, drops, and
       the inside of the edge nudges it toward the middle. A fast one is only a
       few centimetres down by the time it reaches the far edge, catches it on
       the way through, and is thrown up and out — a lip-out that nobody wrote.

       Below the rim the shaft is a cylinder the ball can bounce around inside,
       and its floor is a pad like any other (see surfaceUnder). "Holed" is then
       a statement about geometry rather than a threshold: the ball is under the
       rim and has not got the vertical speed to climb back out. */
    function cupContact(world, events) {
        var b = world.ball, cup = world.hole.cup;
        var dx = b.x - cup.x, dz = b.z - cup.z;
        var d = Math.hypot(dx, dz);
        // Out of reach of the rim: nothing about the cup applies, whatever
        // height the ball is at. (Testing the height here instead would hand
        // the shaft to every ball on a level below the green.)
        if (d > C.HOLE_R + C.BALL_R) return false;

        var ux = d > 1e-9 ? dx / d : 1, uz = d > 1e-9 ? dz / d : 0;
        var e = 1 + C.CUP_RESTITUTION;

        // The rim edge: distance from the ball's centre to the nearest point of
        // the rim circle, in the plane that contains both.
        var rx = d - C.HOLE_R, ry = b.y - cup.y;
        var rd = Math.hypot(rx, ry);
        if (rd < C.BALL_R && rd > 1e-9) {
            var nx = (rx / rd) * ux, ny = ry / rd, nz = (rx / rd) * uz;
            var depth = C.BALL_R - rd;
            b.x += nx * depth; b.y += ny * depth; b.z += nz * depth;
            var vn = b.vx * nx + b.vy * ny + b.vz * nz;
            if (vn < 0) {
                b.vx -= e * vn * nx;
                b.vy -= e * vn * ny;
                b.vz -= e * vn * nz;
                events.rim = true;
            }
        }

        // The shaft wall, once the ball's centre is under the green and inside
        // the mouth of the hole.
        if (b.y < cup.y && d < C.HOLE_R) {
            var maxR = C.HOLE_R - C.BALL_R;
            if (d > maxR) {
                b.x = cup.x + ux * maxR;
                b.z = cup.z + uz * maxR;
                var vr = b.vx * ux + b.vz * uz;
                if (vr > 0) {
                    b.vx -= e * vr * ux;
                    b.vz -= e * vr * uz;
                    events.rim = true;
                }
            }
            // Under the rim with no way back up: that is the ball holed.
            var apex = b.y + (b.vy > 0 ? (b.vy * b.vy) / (2 * C.GRAVITY) : 0);
            if (b.y + C.BALL_R < cup.y - 0.01 && apex < cup.y - 0.02) {
                b.y = cup.y - C.CUP_DEPTH + C.BALL_R;
                b.vx = b.vy = b.vz = 0;
                world.sunk = true;
                world.moving = false;
                events.sunk = true;
                return true;
            }
        }
        return false;
    }

    function drown(world, events) {
        var b = world.ball;
        var w = waterAt(world.hole, b.x, b.z);
        if (!w || b.y - C.BALL_R > w.y) return false;
        b.y = w.y;
        b.vx = b.vy = b.vz = 0;
        world.splash = true;
        world.moving = false;
        events.splash = true;
        return true;
    }

    function substep(world, dt, events) {
        var b = world.ball, hole = world.hole;
        world.time += dt;

        if (world.grounded) {
            var here = surfaceUnder(hole, b.x, b.z, b.y + C.STEP_UP);
            if (!here) {                       // the pad vanished under us
                world.grounded = false;
                b.vy = 0;
            } else {
                var pad = here.pad;
                var sx = pad.sx || 0, sz = pad.sz || 0;

                // Downhill acceleration on a tilted plane, projected into the
                // horizontal: g * gradient / (1 + |gradient|²).
                if (sx || sz) {
                    var k = C.GRAVITY / (1 + sx * sx + sz * sz);
                    b.vx -= k * sx * dt;
                    b.vz -= k * sz * dt;
                }

                var fr = frictionOf(pad.kind);
                var decay = Math.pow(fr, dt);
                var travel = (decay - 1) / lnFrictionOf(pad.kind);   // ∫₀^dt k^s ds
                var climb = b.vx * sx + b.vz * sz;                   // rise rate along the lie

                var nx = b.x + b.vx * travel;
                var nz = b.z + b.vz * travel;
                var lift = b.y + C.STEP_UP;
                var next = surfaceUnder(hole, nx, nz, lift);

                // A kerb taller than STEP_UP stops the ball. Walls do this job
                // properly; this is the backstop for pads that simply end in a
                // step, resolved one axis at a time so the bounce is sane. The
                // extra lookups only happen when there really is ground ahead
                // that the ball cannot climb, which is rare.
                if (!next && surfaceUnder(hole, nx, nz, Infinity)) {
                    if (!surfaceUnder(hole, nx, b.z, lift) && surfaceUnder(hole, nx, b.z, Infinity)) {
                        nx = b.x; b.vx = -b.vx * C.RESTITUTION; events.bounce = true;
                    }
                    if (!surfaceUnder(hole, b.x, nz, lift) && surfaceUnder(hole, b.x, nz, Infinity)) {
                        nz = b.z; b.vz = -b.vz * C.RESTITUTION; events.bounce = true;
                    }
                    next = surfaceUnder(hole, nx, nz, lift);
                }

                b.x = nx; b.z = nz;
                b.vx *= decay;
                b.vz *= decay;

                if (!next) {
                    // Ran off the edge. Keep whatever vertical rate the lie was
                    // giving us, so leaving the lip of a ramp is a jump and
                    // walking off a ledge is a drop.
                    world.grounded = false;
                    b.vy = climb > 0 ? climb : 0;
                } else if (next.y + C.BALL_R < b.y - C.DROP) {
                    world.grounded = false;
                    b.vy = climb > 0 ? climb : 0;
                } else {
                    b.y = next.y + C.BALL_R;
                }
            }
        } else {
            b.vy -= C.GRAVITY * dt;
            b.x += b.vx * dt;
            b.z += b.vz * dt;
            b.y += b.vy * dt;

            var land = surfaceUnder(hole, b.x, b.z, b.y);
            if (land && b.y - C.BALL_R <= land.y) {
                b.y = land.y + C.BALL_R;
                var impact = -b.vy;
                b.vx *= C.LAND_GRIP;
                b.vz *= C.LAND_GRIP;
                b.vy = impact * C.BOUNCE;
                events.land = true;
                if (b.vy < C.LAND_REST) {
                    b.vy = 0;
                    world.grounded = true;
                }
            }
        }

        collideWalls(world, dt, events);

        if (cupContact(world, events)) return;
        if (drown(world, events)) return;

        if (b.y < C.OOB_Y) {
            b.vx = b.vy = b.vz = 0;
            world.out = true;
            world.moving = false;
            events.out = true;
            return;
        }

        /* At rest — unless it is sitting on a slope, in which case gravity has
           not finished with it and stopping here would leave the ball hanging
           on a hillside.

           The timer covers the two states where "grounded" never becomes true
           but the ball has plainly stopped: leaning on something on a slope,
           and perched on the lip of the cup with the ground missing under it.
           Without it those shots would run until the clock ran out. */
        var slow = speedOf(b) < C.STOP_SPEED;
        if (!slow) {
            world.slowFor = 0;
        } else {
            world.slowFor += dt;
            var lie = surfaceUnder(hole, b.x, b.z, b.y + C.STEP_UP);
            var steep = lie && (Math.abs(lie.pad.sx || 0) > 0.02 || Math.abs(lie.pad.sz || 0) > 0.02);
            if ((world.grounded && !steep) || world.slowFor > C.SLOPE_SETTLE) {
                b.vx = b.vy = b.vz = 0;
                if (world.moving) events.rest = true;
                world.moving = false;
            }
        }
    }

    /* Subdivide dt so the ball never travels more than half its radius per
       step, which is what keeps it from crossing a wall between samples. The
       cap is a safety valve: at MAX_SUBSTEPS and full power a step is ~0.01
       units, far inside the margin. */
    function advance(world, dt, events) {
        events = events || {};
        if (world.sunk || world.splash || world.out) return events;

        var steps = Math.min(
            C.MAX_SUBSTEPS,
            Math.max(1, Math.ceil(speedOf(world.ball) * dt / (C.BALL_R * 0.5)))
        );
        var h = dt / steps, i;
        for (i = 0; i < steps; i++) {
            substep(world, h, events);
            if (world.sunk || world.splash || world.out) break;
        }
        return events;
    }

    function done(w) { return w.sunk || w.splash || w.out || !w.moving; }

    // Run a world forward until the ball stops, drowns, drops or falls off.
    // Used by the tests and the practice bot; the game advances per frame.
    function settle(world, maxSeconds, dt) {
        dt = dt || C.SIM_DT;
        var limit = Math.ceil((maxSeconds || C.MAX_SHOT_SECONDS) / dt), i;
        for (i = 0; i < limit; i++) {
            advance(world, dt);
            if (done(world)) break;
        }
        return world;
    }

    function simulateShot(hole, from, yaw, power, loft, time) {
        var w = createWorld(hole, from, time);
        if (!launch(w, yaw, power, loft)) return w;
        return settle(w);
    }

    /* Sample the next few seconds of a shot for the aiming preview. It stops
       where the shot stops being a shot and starts being a roll — a landing,
       the water, the cup — because drawing the whole roll would turn the game
       into a calculator.

       A wall is the exception. If you are lined up against a rail then the
       rail *is* the shot, and stopping the dots at the paint tells you nothing
       about the half you actually care about. So the path rides through the
       first ricochet and carries on, the point where it turns is tagged
       `bounce` so the dots can mark the kiss, and the window is opened a
       little further so the way out is long enough to aim by — a ball that
       spends its whole window reaching the wall would otherwise come off it in
       three dots. A second wall inside that window is where honest prediction
       ends, so that is where it stops. */
    function previewPath(world, yaw, power, loft, seconds) {
        var w = cloneWorld(world);
        if (!launch(w, yaw, power, loft)) return [];
        var pts = [{ x: w.ball.x, y: w.ball.y, z: w.ball.z }];
        var steps = Math.ceil((seconds || 0.7) / C.SIM_DT);
        var grant = Math.ceil(steps * 0.6);
        var turn = -1, i, ev, p;
        for (i = 0; i < steps; i++) {
            ev = advance(w, C.SIM_DT, {});
            p = { x: w.ball.x, y: w.ball.y, z: w.ball.z };
            pts.push(p);
            if (ev.land || ev.splash || ev.sunk || ev.out || !w.moving) break;
            if (!ev.bounce) continue;
            // Contact can span two steps while the ball is still against the
            // wall; that is one ricochet, not two.
            if (turn >= 0 && i > turn + 1) break;
            if (turn < 0) { turn = i; p.bounce = true; steps += grant; }
        }
        return pts;
    }

    G3.physics = {
        padHeight: padHeight,
        padContains: padContains,
        surfaceUnder: surfaceUnder,
        surfaceTop: surfaceTop,
        waterAt: waterAt,
        wallBox: wallBox,
        circleBox: circleBox,
        wallPointVelocity: wallPointVelocity,
        ballTop: ballTop,
        createWorld: createWorld,
        cloneWorld: cloneWorld,
        launch: launch,
        advance: advance,
        settle: settle,
        done: done,
        simulateShot: simulateShot,
        previewPath: previewPath,
        speedOf: speedOf,
        groundSpeed: groundSpeed,
        frictionOf: frictionOf
    };

})(window.G3);
