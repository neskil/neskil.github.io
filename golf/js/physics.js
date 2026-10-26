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
    var LN_AIR = Math.log(C.FRICTION_AIR);

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

    /* ── avalanches ──────────────────────────────────────────────────────

       A chute is a rectangle with a downhill — `dir` is 'down', 'up',
       'left' or 'right' on the field — and every `every` seconds, starting
       at `at`, a slide comes down it: a band of snow `len` long running the
       length of the chute at AVALANCHE_SPEED. Whatever the band is over it
       carries, at the band's own pace, out of the bottom of the chute.

       It is a band rather than the whole chute switching on because a band
       can be watched coming. The chute is clear for most of its cycle and
       every point of it is covered for len / speed seconds of each one —
       the gap between two slides is the shot. One slide in a chute at a
       time: the rule book holds `every` to at least the time a slide takes
       to clear the chute, so the arithmetic below need only ask about the
       most recent one. */
    function chuteLength(a) { return a.dir === 'left' || a.dir === 'right' ? a.w : a.h; }

    // How far down the chute a point is, from its head.
    function chuteAlong(a, x, y) {
        if (a.dir === 'up') return a.y + a.h - y;
        if (a.dir === 'left') return a.x + a.w - x;
        if (a.dir === 'right') return x - a.x;
        return y - a.y;
    }

    function chuteDir(a) {
        if (a.dir === 'up') return { x: 0, y: -1 };
        if (a.dir === 'left') return { x: -1, y: 0 };
        if (a.dir === 'right') return { x: 1, y: 0 };
        return { x: 0, y: 1 };
    }

    // Seconds since the latest slide set off from the head of the chute.
    function slideClock(a, t) {
        var every = a.every > 0 ? a.every : 1;
        var u = (t - (a.at || 0)) % every;
        return u < 0 ? u + every : u;
    }

    /* The stretch of the chute the slide covers at time t, as distances
       from the head — `{ from, to }`, or null while the chute is clear. */
    function slideAt(a, t) {
        var len = a.len || C.AVALANCHE_LEN;
        var front = slideClock(a, t) * C.AVALANCHE_SPEED;
        var L = chuteLength(a);
        if (front - len >= L) return null;
        return { from: Math.max(0, front - len), to: Math.min(L, front) };
    }

    function sweptBy(list, x, y, t) {
        if (!list) return null;
        for (var i = 0; i < list.length; i++) {
            var a = list[i];
            if (!pointInRect(x, y, a)) continue;
            var band = slideAt(a, t);
            if (!band) continue;
            var p = chuteAlong(a, x, y);
            if (p >= band.from && p <= band.to) return a;
        }
        return null;
    }

    /* ── geysers ────────────────────────────────────────────────────────

       A vent, `{ x, y, every, at, run }`, blows for `run` seconds of every
       `every`, starting at `at`. A ball rolling over it while it blows is
       thrown up for VENT_AIR seconds and carries on in the air on the line
       it had — over the lava, the water, the sand, whatever is beyond — and
       comes down where the air drops it. A ball rolling over it while it
       is quiet rolls over a grate. Nothing is added to the ball's speed:
       the vent lifts, it does not push, so the invariant that nothing hands
       the ball energy holds here as it does at the skip. */
    function ventBlowing(v, t) {
        var every = v.every > 0 ? v.every : 1;
        var u = (t - (v.at || 0)) % every;
        if (u < 0) u += every;
        return u < (v.run || 1);
    }

    function ventAt(list, x, y, t) {
        if (!list) return null;
        var r2 = C.VENT_R * C.VENT_R;
        for (var i = 0; i < list.length; i++) {
            var v = list[i], dx = x - v.x, dy = y - v.y;
            if (dx * dx + dy * dy <= r2 && ventBlowing(v, t)) return v;
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

    /* ── curves and blocks ───────────────────────────────────────────────

       A wall does not have to be straight, and an obstacle does not have to
       be a box. Both are rails underneath, so neither costs a collision test
       of its own:

         arcs     a curved wall, `{ x, y, r, from, to, w }`: the arc of radius
                  r round (x, y) from `from` to `to` degrees — clockwise on
                  the screen, 0 pointing right — laid as a chain of rails no
                  more than ARC_STEP degrees or ARC_SEG pixels long. Each link
                  ends where the next begins, and a rail is round at both
                  ends, so the chain has no seam to slip through and no
                  corner to bounce off: at 8° a link stands at most a pixel
                  off the true curve.
         blocks   a solid shape, `{ pts, w, look }`: a polygon whose every
                  edge is a rail w thick. The ball meets the edges; the inside
                  is somewhere it can never be, and that is where the picture
                  puts a flower bed, a windmill or a fan — `look` is only
                  ever read by the renderer.

       The chain of an arc or a block is built once per world and kept with
       a box round it, so a ball nowhere near a curve does not pay for its
       twenty links. A hole's plain rails are read from the hole as they
       always were. */
    var ARC_STEP = 8, ARC_SEG = 32;
    var DEG = Math.PI / 180;

    function arcRails(a) {
        var sweep = a.to - a.from, w = a.w || 24;
        var n = Math.max(1, Math.ceil(Math.max(Math.abs(sweep) / ARC_STEP, Math.abs(sweep) * DEG * a.r / ARC_SEG)));
        var out = [], px = a.x + Math.cos(a.from * DEG) * a.r, py = a.y + Math.sin(a.from * DEG) * a.r;
        for (var i = 1; i <= n; i++) {
            var t = (a.from + sweep * i / n) * DEG;
            var qx = a.x + Math.cos(t) * a.r, qy = a.y + Math.sin(t) * a.r;
            out.push({ x: px, y: py, tx: qx, ty: qy, w: w });
            px = qx; py = qy;
        }
        return out;
    }

    function blockRails(b) {
        var p = b.pts, w = b.w || 20, out = [];
        for (var i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
            out.push({ x: p[j], y: p[j + 1], tx: p[i], ty: p[i + 1], w: w });
        }
        return out;
    }

    // Every capsule a hole is walled with: its rails, its curves and the
    // edges of its blocks. What the rule book, the caddie's map and the
    // decoration ask about; the integrator uses the boxed form below.
    function railsOf(h) {
        var out = (h.rails || EMPTY).slice();
        (h.arcs || EMPTY).forEach(function (a) { out.push.apply(out, arcRails(a)); });
        (h.blocks || EMPTY).forEach(function (b) { out.push.apply(out, blockRails(b)); });
        return out;
    }

    // Inside a block: the hollow behind its edges, where no ball can be.
    function inBlock(h, x, y) {
        var list = h.blocks || EMPTY;
        for (var i = 0; i < list.length; i++) {
            if (pointInPoly(x, y, list[i].pts)) return list[i];
        }
        return null;
    }

    function chains(course) {
        var out = [];
        function keep(list) {
            if (!list.length) return;
            var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, w = 0;
            list.forEach(function (s) {
                x0 = Math.min(x0, s.x, s.tx); x1 = Math.max(x1, s.x, s.tx);
                y0 = Math.min(y0, s.y, s.ty); y1 = Math.max(y1, s.y, s.ty);
                w = Math.max(w, s.w);
            });
            var pad = w / 2 + C.BALL_R + 2;
            out.push({ x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad, rails: list });
        }
        (course.arcs || EMPTY).forEach(function (a) { keep(arcRails(a)); });
        (course.blocks || EMPTY).forEach(function (b) { keep(blockRails(b)); });
        return out;
    }

    /* ── hills ──────────────────────────────────────────────────────────

       A slope is a plane tipped one way. A hill is round: `{ x, y, r, a }`,
       a mound if `a` is positive and a bowl if it is negative, and either
       way the ground is level at the middle and level again at the rim and
       steepest halfway between, where it pulls the ball `|a|` px/s² away
       from the middle or towards it. The profile is a cosine, so the pull
       is a sine of the distance out: nothing jumps as the ball rolls on or
       off it.

       A bowl is where a ball can come to rest on a hill — at the bottom,
       where the ground is level. That is a different rule from a slope's
       (nothing rests on a slope, ever) and the same rule underneath: see
       `pull` and the rest check in `substep`. */
    function hillPull(list, x, y, out) {
        if (!list) return out;
        for (var i = 0; i < list.length; i++) {
            var hl = list[i], dx = x - hl.x, dy = y - hl.y, d2 = dx * dx + dy * dy;
            if (d2 >= hl.r * hl.r || d2 < 1e-12) continue;
            var d = Math.sqrt(d2), s = hl.a * Math.sin(Math.PI * d / hl.r) / d;
            out.x += dx * s;
            out.y += dy * s;
        }
        return out;
    }

    // Everything the ground does to a ball standing at (x, y): the slope it
    // is on and every hill it is on, summed.
    function pull(course, x, y) {
        var out = { x: 0, y: 0 };
        var s = zoneAt(course.slopes, x, y);
        if (s) { out.x += s.ax; out.y += s.ay; }
        return hillPull(course.hills, x, y, out);
    }

    function inHill(list, x, y, pad) {
        if (!list) return null;
        for (var i = 0; i < list.length; i++) {
            var hl = list[i];
            if (Math.hypot(x - hl.x, y - hl.y) < hl.r + (pad || 0)) return hl;
        }
        return null;
    }

    /* ── spinners ───────────────────────────────────────────────────────

       A spinner is a turnstile laid flat on the green: `arms` rails out
       from a pivot, `r` long and `w` thick, turning at `speed` radians a
       second (clockwise on the screen when positive) from `phase`. Each arm
       is a rail at the angle the clock says, and it pushes the way a gate
       does — a moving thing handing the ball its own speed along the line
       it meets it on — so a ball is batted out of the way rather than
       swallowed. The rule book keeps everything solid out of its sweep, so
       an arm can only ever bat a ball into open grass, never crush it. */
    function spinnerArms(s, t) {
        var out = [], n = Math.max(1, s.arms | 0), w = s.w || 20, a0 = (s.phase || 0) + s.speed * t;
        for (var i = 0; i < n; i++) {
            var a = a0 + i * Math.PI * 2 / n;
            out.push({ x: s.x, y: s.y, tx: s.x + Math.cos(a) * s.r, ty: s.y + Math.sin(a) * s.r, w: w });
        }
        return out;
    }

    // Everything an arm sweeps: the disc round the pivot its tips draw.
    function sweepOf(s) { return s.r + (s.w || 20) / 2; }

    /* ── belts ──────────────────────────────────────────────────────────

       A belt is a rectangle of ground that moves: `dir` (down, up, left or
       right on the field) at `speed` px/s. On it the ball's grip on the
       ground is the same as on grass, but the ground under it is going
       somewhere, so it is the ball's speed *relative to the belt* that the
       friction takes away: left alone on a belt, a ball comes up to the
       belt's pace and rides it to the end. Nothing rests on a belt; the rule
       book makes sure every belt runs out onto open grass. */
    function beltAt(list, x, y) { return zoneAt(list, x, y); }

    function beltVelocity(bt) {
        var d = chuteDir(bt);
        return { x: d.x * bt.speed, y: d.y * bt.speed };
    }

    /* ── world ──────────────────────────────────────────────────────────── */

    function createWorld(course, from, time) {
        return {
            course: course,
            // The curves and blocks, laid as boxed chains of rails. See above.
            chains: chains(course),
            // z is the height of the ball's centre above the green; it only
            // ever changes at the cup.
            ball: { x: from.x, y: from.y, vx: 0, vy: 0, z: C.BALL_R, vz: 0 },
            origin: { x: from.x, y: from.y },   // where this shot was played from
            time: time || 0,
            moving: false,
            sunk: false,
            splash: false,
            // A splash into lava rather than water: the same stroke and
            // replay, said differently.
            lava: false,
            /* Seconds left in the air off a skip, and how long that hop was
               all told — the renderer reads the pair as how high the ball is.
               `skips` counts this shot's, for the call-out and the pitch. */
            air: 0,
            airMax: 0,
            skips: 0,
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
        world.lava = false;
        world.air = world.airMax = 0;
        world.skips = 0;
        return true;
    }

    function speedOf(b) { return Math.hypot(b.vx, b.vy); }

    /* The strongest knock of a substep, for the effects: where the ball met
       the thing, which way it was pushed off, and how hard it arrived along
       that normal. `events.bounce` stays a plain flag for everything that
       only asks whether there was one. */
    function knock(events, b, nx, ny, vn) {
        if (events.impact && events.impact.vn >= vn) return;
        events.impact = { x: b.x - nx * C.BALL_R, y: b.y - ny * C.BALL_R, nx: nx, ny: ny, vn: vn };
    }

    /* How long a hop off the water lasts at this speed. See SKIP_AIR. */
    function hopTime(speed) {
        return C.SKIP_AIR * speed / C.MAX_POWER;
    }

    /* ── integration ────────────────────────────────────────────────────── */

    function hitRails(b, rails, events) {
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
                knock(events, b, rh.nx, rh.ny, -rn);
            }
        }
    }

    function substep(world, dt, events) {
        var b = world.ball, course = world.course;
        world.time += dt;

        // Off a skip the ball is over everything on the ground: no slope
        // pulls it and no surface holds it, only the air.
        var aloft = world.air > 0;
        if (aloft) {
            world.air -= dt;
            if (world.air <= 0) world.air = 0;
        }

        // The ground's pull: the slope under the ball, and the hills.
        var ground = aloft ? null : pull(course, b.x, b.y);
        if (ground) {
            b.vx += ground.x * dt;
            b.vy += ground.y * dt;
        }

        // A slide over the ball takes it: whatever it was doing, it is soon
        // doing the slide's pace down the chute.
        var slide = aloft ? null : sweptBy(course.avalanches, b.x, b.y, world.time);
        if (slide) {
            var sd = chuteDir(slide), grip = 1 - Math.exp(-C.AVALANCHE_GRIP * dt);
            b.vx += (sd.x * C.AVALANCHE_SPEED - b.vx) * grip;
            b.vy += (sd.y * C.AVALANCHE_SPEED - b.vy) * grip;
            events.swept = slide;
        }

        // Surface, worst first: a bunker under a frozen pond is the worse
        // news of the two, and rough is what is left when nothing else claims
        // the ball. One lookup wins outright — surfaces do not blend.
        var k = C.FRICTION_GRASS, lnK = LN_GRASS;
        if (aloft) {
            k = C.FRICTION_AIR; lnK = LN_AIR;
        } else if (zoneAt(course.sand, b.x, b.y)) {
            k = C.FRICTION_SAND; lnK = LN_SAND;
        } else if (zoneAt(course.ice, b.x, b.y)) {
            k = C.FRICTION_ICE; lnK = LN_ICE;
        } else if (zoneAt(course.rough, b.x, b.y)) {
            k = C.FRICTION_ROUGH; lnK = LN_ROUGH;
        }

        // A belt is grass that moves: the friction works on the ball's speed
        // over the belt, and the belt's own speed carries it as well.
        var belt = aloft ? null : beltAt(course.belts, b.x, b.y), bu = null;
        if (belt) {
            k = C.FRICTION_GRASS; lnK = LN_GRASS;
            bu = beltVelocity(belt);
            b.vx -= bu.x; b.vy -= bu.y;
        }

        var decay = Math.pow(k, dt);
        var travel = (decay - 1) / lnK;  // ∫₀^dt k^s ds

        b.x += b.vx * travel;
        b.y += b.vy * travel;
        b.vx *= decay;
        b.vy *= decay;
        if (bu) {
            b.x += bu.x * dt; b.y += bu.y * dt;
            b.vx += bu.x; b.vy += bu.y;
        }

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
                knock(events, b, hit.nx, hit.ny, -vn);
            }
            var wv = wallVelocity(course.walls[i], world.time);
            var wn = wv.x * hit.nx + wv.y * hit.ny;
            if (wn > 0) {
                b.vx += wv.x;
                b.vy += wv.y;
                events.bounce = true;
                knock(events, b, hit.nx, hit.ny, wn);
            }
        }

        // Rails: walls at an angle. They hold still, so the response is the
        // static half of the wall's — resolve, then reflect. Then the curves
        // and blocks, which are rails too, a box at a time.
        hitRails(b, course.rails || EMPTY, events);
        var ch = world.chains || (world.chains = chains(course));
        for (var ci = 0; ci < ch.length; ci++) {
            var c = ch[ci];
            if (b.x < c.x0 || b.x > c.x1 || b.y < c.y0 || b.y > c.y1) continue;
            hitRails(b, c.rails, events);
        }

        // Spinners: rails at the angle the clock says, which push. The
        // response is worked in the arm's own frame — the ball's speed
        // relative to the arm where they touch is what is reflected.
        var spins = course.spinners || EMPTY;
        for (var si = 0; si < spins.length; si++) {
            var sp = spins[si];
            if (Math.hypot(b.x - sp.x, b.y - sp.y) > sweepOf(sp) + C.BALL_R) continue;
            var arms = spinnerArms(sp, world.time);
            for (var ai = 0; ai < arms.length; ai++) {
                var ah = circleRail(b.x, b.y, C.BALL_R, arms[ai]);
                if (!ah) continue;
                b.x += ah.nx * ah.depth;
                b.y += ah.ny * ah.depth;
                // Where the arm touches the ball, and how fast that point moves.
                var cx = b.x - ah.nx * C.BALL_R, cy = b.y - ah.ny * C.BALL_R;
                var ux = -sp.speed * (cy - sp.y), uy = sp.speed * (cx - sp.x);
                var an = (b.vx - ux) * ah.nx + (b.vy - uy) * ah.ny;
                if (an < 0) {
                    b.vx -= (1 + C.RESTITUTION) * an * ah.nx;
                    b.vy -= (1 + C.RESTITUTION) * an * ah.ny;
                    events.bounce = true;
                    knock(events, b, ah.nx, ah.ny, -an);
                }
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
                knock(events, b, bump.nx, bump.ny, -bn);
            }
        }

        // Cushions. The field edge is solid on all four sides.
        if (b.x < C.BALL_R) { b.x = C.BALL_R; knock(events, b, 1, 0, Math.abs(b.vx)); b.vx = Math.abs(b.vx) * C.RESTITUTION; events.bounce = true; }
        if (b.x > C.WORLD_W - C.BALL_R) { b.x = C.WORLD_W - C.BALL_R; knock(events, b, -1, 0, Math.abs(b.vx)); b.vx = -Math.abs(b.vx) * C.RESTITUTION; events.bounce = true; }
        if (b.y < C.BALL_R) { b.y = C.BALL_R; knock(events, b, 0, 1, Math.abs(b.vy)); b.vy = Math.abs(b.vy) * C.RESTITUTION; events.bounce = true; }
        if (b.y > C.WORLD_H - C.BALL_R) { b.y = C.WORLD_H - C.BALL_R; knock(events, b, 0, -1, Math.abs(b.vy)); b.vy = -Math.abs(b.vy) * C.RESTITUTION; events.bounce = true; }

        // Still in the air: nothing on the ground below can have it yet —
        // not a tunnel, not the cup, not the water it is skipping over.
        if (world.air > 0) return;
        if (aloft) events.land = { x: b.x, y: b.y, wet: !!(zoneAt(course.water, b.x, b.y) || zoneAt(course.lava, b.x, b.y)) };

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

        // A vent blowing under the ball throws it up, on the line it had.
        var vent = ventAt(course.vents, b.x, b.y, world.time);
        if (vent) {
            world.air = world.airMax = C.VENT_AIR;
            events.vent = { x: vent.x, y: vent.y };
            return;
        }

        // Lava takes the ball whatever its speed: nothing skips on rock.
        if (zoneAt(course.lava, b.x, b.y)) {
            b.vx = b.vy = 0;
            world.air = world.airMax = 0;
            world.splash = true;
            world.lava = true;
            world.moving = false;
            events.splash = true;
            events.lava = true;
            return;
        }

        if (zoneAt(course.water, b.x, b.y)) {
            // Fast enough, and it skips: some of the speed goes into the
            // water and the rest carries it up and on.
            var sv = speedOf(b);
            if (sv >= C.SKIP_SPEED) {
                world.air = world.airMax = hopTime(sv);
                b.vx *= C.SKIP_KEEP;
                b.vy *= C.SKIP_KEEP;
                world.skips++;
                events.skip = { x: b.x, y: b.y, n: world.skips, speed: sv };
                return;
            }
            b.vx = b.vy = 0;
            world.air = world.airMax = 0;
            world.splash = true;
            world.moving = false;
            events.splash = true;
            return;
        }

        // At rest — unless the ground under it is steep enough to get it
        // going again, in which case gravity has not finished with it and
        // stopping here would let the ball hang on a hillside, or it is off
        // the green, in which case it is on its way into the cup or bouncing
        // back out of it. Every slope pulls far harder than REST_PULL, so
        // nothing ever rests on one; a bowl's bottom is level, so a ball can.
        if (speedOf(b) < C.STOP_SPEED && !slide && !belt && grounded(b, course.hole) &&
            (!ground || Math.hypot(ground.x, ground.y) < C.REST_PULL)) {
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
                if (e > 0) {
                    vr *= C.RIM_KEEP; vt *= C.RIM_KEEP; b.vz *= C.RIM_KEEP;
                    events.rim = Math.max(events.rim || 0, -vn);
                }
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
        // A spinner's tip moves whether the ball does or not, and must not
        // jump past it between two steps either.
        var sweep = 0, spins = world.course.spinners || EMPTY;
        for (var si = 0; si < spins.length; si++) {
            if (Math.hypot(b.x - spins[si].x, b.y - spins[si].y) < sweepOf(spins[si]) + C.BALL_R * 4) {
                sweep = Math.max(sweep, Math.abs(spins[si].speed) * sweepOf(spins[si]));
            }
        }
        var steps = Math.min(
            C.MAX_SUBSTEPS,
            Math.max(1, Math.ceil((speedOf(b) + fall + sweep) * dt / (C.BALL_R * 0.5)))
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
        spinnerArms: spinnerArms,
        sweepOf: sweepOf,
        beltAt: beltAt,
        beltVelocity: beltVelocity,
        arcRails: arcRails,
        blockRails: blockRails,
        railsOf: railsOf,
        inBlock: inBlock,
        hillPull: hillPull,
        pull: pull,
        inHill: inHill,
        mouthAt: mouthAt,
        chuteLength: chuteLength,
        chuteAlong: chuteAlong,
        chuteDir: chuteDir,
        slideClock: slideClock,
        slideAt: slideAt,
        sweptBy: sweptBy,
        ventBlowing: ventBlowing,
        ventAt: ventAt,
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
        hopTime: hopTime,
        grounded: grounded,
        groundAt: groundAt
    };

})(window.GOLF);
