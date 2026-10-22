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

    /* A zone is a rectangle, or — for the shorelines and bunkers that should
       not have to be drawn in steps — a polygon, `{ pts: [x0, y0, x1, y1, …] }`.
       Crossing-number test: a ray to the right of the point crosses an odd
       number of edges from inside. Cheap enough to run at every substep. */
    function pointInPoly(x, y, pts) {
        var inside = false;
        for (var i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
            var xi = pts[i], yi = pts[i + 1], xj = pts[j], yj = pts[j + 1];
            if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
        }
        return inside;
    }

    function inZone(z, x, y) {
        return z.pts ? pointInPoly(x, y, z.pts) : pointInRect(x, y, z);
    }

    function zoneAt(list, x, y) {
        if (!list) return null;
        for (var i = 0; i < list.length; i++) {
            if (inZone(list[i], x, y)) return list[i];
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

    /* Circle vs a rail: a wall laid at any angle, `{ x, y, tx, ty, w }` — the
       two ends of its spine and its thickness. Collided as a capsule, which
       is the box-and-post vocabulary's one extension that keeps both of its
       promises: the closest point on a segment is a clamp and a dot product,
       so it is as cheap as the box test, and as obviously correct. Same
       contract as the others: outward normal and depth, or null. A centre
       that has landed exactly on the spine leaves by the spine's normal. */
    function circleRail(cx, cy, rad, s) {
        var ex = s.tx - s.x, ey = s.ty - s.y;
        var L2 = ex * ex + ey * ey;
        var t = L2 > 0 ? ((cx - s.x) * ex + (cy - s.y) * ey) / L2 : 0;
        if (t < 0) t = 0; else if (t > 1) t = 1;
        var dx = cx - (s.x + ex * t), dy = cy - (s.y + ey * t);
        var d2 = dx * dx + dy * dy;
        var reach = rad + s.w / 2;
        if (d2 > reach * reach) return null;
        if (d2 > 1e-9) {
            var d = Math.sqrt(d2);
            return { nx: dx / d, ny: dy / d, depth: reach - d };
        }
        var L = Math.sqrt(L2) || 1;
        return { nx: -ey / L, ny: ex / L, depth: reach };
    }

    /* ── world ──────────────────────────────────────────────────────────── */

    function createWorld(course, from, time) {
        return {
            course: course,
            // z is the height of the ball's centre above the green; it only
            // ever changes at the cup.
            ball: { x: from.x, y: from.y, vx: 0, vy: 0, z: C.BALL_R, vz: 0 },
            origin: { x: from.x, y: from.y },   // where this shot was played from
            time: time || 0,
            moving: false,
            sunk: false,
            splash: false,
            /* The tunnel mouth the ball is standing in, if any — the one it
               just came out of, or the one it was struck from. That mouth
               cannot take it until it has left it; without the latch a ball
               coming out of one end would be inside that end's catch and go
               straight back down it. */
            tunnelLock: null
        };
    }

    /* ── tunnels ────────────────────────────────────────────────────────

       A tunnel is two mouths, `{ x, y }` and `{ tx, ty }`, and it runs both
       ways. The ball's centre over a mouth takes it in; it comes out of the
       other one at the same speed, on the same heading. Nothing about the
       shot changes but where it is, which is what keeps the rule that
       nothing may hand the ball energy: a tunnel is a door, not a cannon. */
    function mouthAt(tunnels, x, y) {
        if (!tunnels) return null;
        var r2 = C.TUNNEL_R * C.TUNNEL_R;
        for (var i = 0; i < tunnels.length; i++) {
            var t = tunnels[i];
            var ax = x - t.x, ay = y - t.y;
            if (ax * ax + ay * ay <= r2) return { x: t.x, y: t.y, ox: t.tx, oy: t.ty };
            var bx = x - t.tx, by = y - t.ty;
            if (bx * bx + by * by <= r2) return { x: t.tx, y: t.ty, ox: t.x, oy: t.y };
        }
        return null;
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
        // A ball struck from inside a mouth is leaving it, not entering it.
        var m = mouthAt(world.course.tunnels, world.ball.x, world.ball.y);
        world.tunnelLock = m ? { x: m.x, y: m.y } : null;
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

        // Rails: walls at an angle. They hold still, so the response is the
        // static half of the wall's — resolve, then reflect.
        var rails = course.rails || EMPTY;
        for (var ri = 0; ri < rails.length; ri++) {
            var rh = circleRail(b.x, b.y, C.BALL_R, rails[ri]);
            if (!rh) continue;
            b.x += rh.nx * rh.depth;
            b.y += rh.ny * rh.depth;
            var rn = b.vx * rh.nx + b.vy * rh.ny;
            if (rn < 0) {
                b.vx -= (1 + C.RESTITUTION) * rn * rh.nx;
                b.vy -= (1 + C.RESTITUTION) * rn * rh.ny;
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

        // Tunnels. Only a ball that is going somewhere can fall into one: a
        // ball put back at the spot it was played from after a splash may be
        // sitting in a mouth, and the next launch latches that mouth.
        var tunnels = course.tunnels || EMPTY;
        if (tunnels.length && (b.vx || b.vy)) {
            var lock = world.tunnelLock;
            if (lock && Math.hypot(b.x - lock.x, b.y - lock.y) > C.TUNNEL_R) {
                world.tunnelLock = lock = null;
            }
            var m = mouthAt(tunnels, b.x, b.y);
            if (m && !(lock && lock.x === m.x && lock.y === m.y)) {
                b.x = m.ox;
                b.y = m.oy;
                world.tunnelLock = { x: m.ox, y: m.oy };
                events.tunnel = { x: m.x, y: m.y, tx: m.ox, ty: m.oy };
            }
        }

        if (cup(world, b, course.hole, dt, events)) return;

        if (zoneAt(course.water, b.x, b.y)) {
            b.vx = b.vy = 0;
            world.splash = true;
            world.moving = false;
            events.splash = true;
            return;
        }

        // At rest — unless it is sitting on a slope, in which case gravity has
        // not finished with it and stopping here would let the ball hang on a
        // hillside, or it is off the green, in which case it is on its way
        // into the cup or bouncing back out of it.
        if (speedOf(b) < C.STOP_SPEED && !zoneAt(course.slopes, b.x, b.y) && grounded(b, course.hole)) {
            b.vx = b.vy = 0;
            if (world.moving) events.rest = true;
            world.moving = false;
        }
    }

    /* ── the cup ─────────────────────────────────────────────────────────

       Everywhere else the ball rolls on the plane of the green and its
       height never changes. Over the hole there is nothing under it, so it
       falls; and the edge of the hole — the lip — is a circle at the
       green's own level that the ball can lean on, ride round, hit and
       climb back out over. That one circle is all a lip-out is:

         - a slow ball creeping over the edge leans on the lip, which tips it
           in towards the middle: it topples in.
         - a ball running along the edge leans on the lip from inside, and
           the lip pushes it inward — the push that bends its line round the
           cup. Slow enough and it drops before it gets round; too quick and
           its own momentum carries it back out over the far side: round the
           world and out.
         - a ball struck firmly at the middle crosses the hole before it has
           fallen far, meets the back of the lip, and is knocked up and back:
           it drops if the knock was soft, and hops out over the lip if not.

       Round the hole the green is worn into a shallow funnel — CUP_BEVEL
       wide, CUP_FALL deep — the way real turf goes round a real cup. It is a
       banked track: a ball running round it at the right pace is held on it
       by the bank, circles while the grass slows it, and either spirals in
       over the lip or, if it came in too fast, runs back up and out. That is
       the ball that goes round the world.

       Nothing here is scripted; those are three ways for a sphere to meet
       a circle. The rest of the hole never notices: a ball more than a
       radius from the lip is on the green at the green's height. */
    function cup(world, b, hole, dt, events) {
        var R = C.HOLE_R, r = C.BALL_R, F = C.CUP_FALL;
        if (b.z === undefined) { b.z = r; b.vz = 0; }
        var dx = b.x - hole.x, dy = b.y - hole.y, d = Math.hypot(dx, dy);
        if (d >= R + Math.max(r, C.CUP_BEVEL) && b.z <= r && b.vz <= 0) { b.z = r; b.vz = 0; return false; }
        var ux = d > 1e-9 ? dx / d : 1, uy = d > 1e-9 ? dy / d : 0;

        // The ground under the ball: the green, the funnel down to the lip,
        // or — over the hole — nothing at all.
        var floor = groundAt(hole, b.x, b.y);
        if (floor !== null && floor < 0 && b.z <= r + floor + 0.01 && b.vz <= 1) {
            // On the funnel: downhill towards the hole. What the pull gives
            // the ball, the drop in its height pays for.
            var pull = C.CUP_GRAVITY * F / C.CUP_BEVEL * dt;
            b.vx -= ux * pull;
            b.vy -= uy * pull;
        }

        b.vz -= C.CUP_GRAVITY * dt;
        b.z += b.vz * dt;
        // Back on the ground: a hop out of the cup lands, and dies quickly.
        if (floor !== null && b.z < r + floor) {
            b.z = r + floor;
            b.vz = b.vz < -60 ? -b.vz * 0.3 : 0;
        }

        // The lip, in the plane through the cup's centre and the ball's: the
        // edge is the point (R, -F) at the foot of the funnel, the ball's
        // centre is (d, z).
        var ex = d - R, ez = b.z + F, ed = Math.hypot(ex, ez);
        if (ed < r && ed > 1e-9) {
            var nr = ex / ed, nz = ez / ed, push = r - ed;
            b.x += ux * nr * push;
            b.y += uy * nr * push;
            b.z += nz * push;
            var vr = b.vx * ux + b.vy * uy, vt = b.vy * ux - b.vx * uy;
            var vn = vr * nr + b.vz * nz;
            if (vn < 0) {
                // A knock bounces; leaning and sliding along the lip, step
                // after step, does not — or every substep of a ball riding
                // over the back of the cup would kick it higher.
                var e = vn < -C.RIM_KNOCK ? C.RIM_RESTITUTION : 0;
                var j = -(1 + e) * vn;
                // The push out of the lip lifted it; that height is paid for
                // out of its speed, or leaning on the lip would be a ladder.
                var before = Math.sqrt(Math.max(0, b.vx * b.vx + b.vy * b.vy + b.vz * b.vz - 2 * C.CUP_GRAVITY * Math.max(0, nz * push)));
                vr += j * nr;
                b.vz += j * nz;
                // Riding the lip scrubs speed off along it.
                vt *= Math.max(0, 1 - C.RIM_DRAG * j);
                // Never faster than before the knock: the lip turns the fall
                // into a roll and the roll into a hop, and adds to neither.
                var after = Math.hypot(vr, vt, b.vz);
                if (after > before && after > 0) { vr *= before / after; vt *= before / after; b.vz *= before / after; }
                // And a real knock — the back of the cup — takes pace off.
                if (e > 0) { vr *= C.RIM_KEEP; vt *= C.RIM_KEEP; b.vz *= C.RIM_KEEP; }
                b.vx = vr * ux - vt * uy;
                b.vy = vr * uy + vt * ux;
                events.lip = true;
            }
        }

        // Below the lip the cup's wall holds it; and once it is down, it
        // is in.
        if (b.z < -F) {
            d = Math.hypot(b.x - hole.x, b.y - hole.y);
            if (d > R - r && d > 1e-9) {
                var k = (R - r) / d;
                b.x = hole.x + (b.x - hole.x) * k;
                b.y = hole.y + (b.y - hole.y) * k;
            }
        }
        if (b.z < -F - r * C.CUP_DOWN) {
            b.x = hole.x;
            b.y = hole.y;
            b.vx = b.vy = 0;
            b.z = r;
            b.vz = 0;
            world.sunk = true;
            world.moving = false;
            events.sunk = true;
            return true;
        }
        return false;
    }

    // On the green and resting on it, rather than over the cup or above it
    // — and not on the funnel, which nothing can rest on.
    function grounded(b, hole) {
        var d = Math.hypot(b.x - hole.x, b.y - hole.y);
        if (d < C.HOLE_R + C.CUP_BEVEL) return false;
        if (b.z === undefined) return true;
        return Math.abs(b.z - C.BALL_R) <= 0.01 && Math.abs(b.vz) <= 1;
    }

    // The height of the ground at a point, relative to the green: 0 on the
    // green, sloping down the funnel to -CUP_FALL at the lip, and null over
    // the hole, where there is none.
    function groundAt(hole, x, y) {
        var d = Math.hypot(x - hole.x, y - hole.y);
        if (d >= C.HOLE_R + C.CUP_BEVEL) return 0;
        if (d < C.HOLE_R) return null;
        return -C.CUP_FALL * (C.HOLE_R + C.CUP_BEVEL - d) / C.CUP_BEVEL;
    }

    /* Subdivide dt so the ball never travels more than half its radius per
       step, which is what keeps it from crossing a wall between samples. The
       cap is a safety valve: at MAX_SUBSTEPS and full power a step is ~0.4px,
       far inside the margin. */
    function advance(world, dt, events) {
        events = events || {};
        if (world.sunk || world.splash) return events;

        var b = world.ball, fall = b.vz ? Math.abs(b.vz) : 0;
        var steps = Math.min(
            C.MAX_SUBSTEPS,
            Math.max(1, Math.ceil((speedOf(b) + fall) * dt / (C.BALL_R * 0.5)))
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
        pointInPoly: pointInPoly,
        inZone: inZone,
        zoneAt: zoneAt,
        circleRail: circleRail,
        mouthAt: mouthAt,
        circleRect: circleRect,
        circleCircle: circleCircle,
        spread: spread,
        scatter: scatter,
        createWorld: createWorld,
        launch: launch,
        advance: advance,
        settle: settle,
        simulateShot: simulateShot,
        speedOf: speedOf,
        grounded: grounded,
        groundAt: groundAt
    };

})(window.GOLF);
