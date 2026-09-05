/* The simulation. No three.js, no canvas, no DOM — everything in here is a
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
    // The steepest lie this surface will hold a stopped ball on. See CONFIG.HOLD.
    function holdOf(kind) {
        return C.HOLD[kind] !== undefined ? C.HOLD[kind] : C.HOLD_DEFAULT;
    }

    /* How hard down is, on this hole.

       One number, and it is the cheapest hole-shaped idea in the file: nothing
       about the course changes and everything about playing it does. At a
       third of a g a wedge hangs for three seconds and carries twenty units, a
       launch pad throws the ball three times as high, and a ramp that used to
       stop a ball rolls it off the end — because carry goes as 1/g, apex goes
       as 1/g, and the gradient a surface will hold a ball on does not move at
       all. Every club in the bag is a different club and not one of their
       numbers changed.

       It belongs to the hole rather than to a zone the ball wanders in and out
       of, and that is a design decision rather than a shortcut: gravity you
       can be half inside is gravity nobody can aim in, and the first thing a
       player does with a shot they cannot predict is stop trying. */
    function gravityOf(hole) {
        return C.GRAVITY * (hole && hole.gravity ? hole.gravity : 1);
    }

    /* ── pads: the ground ───────────────────────────────────────────────── */

    /* A pad is { x, z, w, d, y, sx, sz, kind }: an axis-aligned footprint, a
       height at its (x, z) corner, and a gradient. Height anywhere on it is
       that plane evaluated at the point. Tilt both components and you get a
       diagonal fall line, which is all a breaking green is.

       Two things may be added to that, and neither changes anything the solver
       does — which is the point of putting them here. The whole simulation
       asks the ground exactly two questions, "how high are you" and "which way
       do you fall", and as long as those two agree with each other it does not
       care what shape the answer came from.

         bumps   a list of { cx, cz, r, a }: a rise of `a` at (cx, cz) fading
                 to nothing at radius r. The profile is a raised cosine,
                 a·(cos(πt) + 1)/2 for t = distance / r, because it is the
                 cheapest curve that is flat at the top *and* flat where it
                 meets the ground. Both matter: a crease at the summit is a
                 ridge the ball feels and nobody drew, and a crease at the foot
                 is a step at the edge of every hill on the course. Negative
                 `a` is a hollow. Overlap them and they add, which is how a
                 field of dunes is written — see `dunes()` in courses.js.

         r       a radius: the pad is the disc inscribed in its footprint
                 rather than the footprint itself. Greens want to be round, and
                 a round green on rolling ground is the difference between a
                 golf course and a diagram of one. A disc still carries the
                 x/z/w/d of its bounding square, so everything that only wants
                 to know how much room a pad takes up — the hole's bounds, the
                 renderer's placement, the eject-from-a-face backstop — needs
                 to know nothing about it.

       Nothing above is a special case anywhere else in this file. A ramp, a
       breaking green, a dune field and a crowned green are all one code path,
       and the only function that had to learn anything new is padGrad.

       ── ground that does something ──

       Two more, and they are a different kind of thing: the ones above change
       where the ground *is*, and these change what it does to a ball sitting
       on it. They still live on the pad rather than in a list of gadgets
       somewhere, because the alternative is a second kind of object with its
       own footprint, its own overlap rules and its own place in every lookup —
       and a travelator is not an object standing on the floor, it *is* the
       floor.

         push    { x, z }: an acceleration applied to a grounded ball, in units
                 per second squared. A belt. It is not a shove — it is a force
                 the ball is under the whole time it is on the pad, so drag
                 balances it at |push| / -ln(friction) and the belt has a
                 speed of its own that a ball approaches from either side.
                 A pad with one is never a lie that holds: see the rest check
                 at the bottom of substep, and the reason a belt you can fall
                 asleep on is not a belt.

         spring  an upward speed, in units per second, given to any ball that
                 touches the pad — rolling on to it or landing on it, because a
                 trampoline does not care how you arrived. sqrt(2·GRAVITY·h) is
                 what reaches height h, so 8.5 clears two units. It fades on
                 each firing within a shot (CONFIG.SPRING_DECAY) and that is
                 the whole of what stops a ball bouncing until the clock does.

       And one that belongs to the hole rather than to a pad, because it is a
       relation between two places and not a property of either:

         warps   [{ x, z, r, tx, tz, yaw }]: a mouth of radius r at (x, z) that
                 puts the ball down at (tx, tz) travelling along `yaw` at the
                 speed it arrived with. One way, so a two-way pipe is written
                 as two of them and a chute is written as one. */
    function padHeight(pad, x, z) {
        var h = pad.y + (pad.sx || 0) * (x - pad.x) + (pad.sz || 0) * (z - pad.z);
        var b = pad.bumps, i, m, dx, dz, q;
        if (b) {
            for (i = 0; i < b.length; i++) {
                m = b[i];
                dx = x - m.cx; dz = z - m.cz;
                q = dx * dx + dz * dz;
                // The cheap reject first: on a course-sized dune field most
                // humps are nowhere near the point and never cost a sqrt.
                if (q >= m.r * m.r) continue;
                h += m.a * 0.5 * (Math.cos(Math.PI * Math.sqrt(q) / m.r) + 1);
            }
        }
        return h;
    }

    /* Which way the ground falls, as (dh/dx, dh/dz). For a plain pad this is
       just its tilt; a hump adds its own radial slope, dh/dd = -aπ/2r·sin(πd/r)
       spread over the direction from its middle. Written into `out` because
       the grounded branch of the integrator asks for it on every substep and
       an allocation per substep is an allocation per substep. */
    var _grad = { x: 0, z: 0 };
    function padGrad(pad, x, z, out) {
        out = out || _grad;
        out.x = pad.sx || 0;
        out.z = pad.sz || 0;
        var b = pad.bumps, i, m, dx, dz, q, d, k;
        if (b) {
            for (i = 0; i < b.length; i++) {
                m = b[i];
                dx = x - m.cx; dz = z - m.cz;
                q = dx * dx + dz * dz;
                if (q >= m.r * m.r) continue;
                d = Math.sqrt(q);
                if (d < 1e-6) continue;          // the summit is flat
                k = -m.a * 0.5 * Math.PI / m.r * Math.sin(Math.PI * d / m.r) / d;
                out.x += k * dx;
                out.z += k * dz;
            }
        }
        return out;
    }

    // How steep the ground is here, as a gradient. Only the settling rule and
    // the tests need the magnitude on its own.
    function slopeAt(pad, x, z) {
        var g = padGrad(pad, x, z, _slope);
        return Math.sqrt(g.x * g.x + g.z * g.z);
    }
    var _slope = { x: 0, z: 0 };

    /* How far a round pad reaches in one direction, which is not the same
       answer in every direction.

       A green is a shape that was mown rather than one that was compassed, so
       an inlaid disc carries a handful of low harmonics — its `wave` — that
       pull the edge in and out again over the course of a turn. The angle is
       measured the way the renderer measures it, atan2(dz, dx), so the outline
       the ball rolls off is the outline that was drawn.

       The one rule the wave obeys is that it only ever bites **inwards**: the
       radius runs between `pad.rIn` and `pad.r` and never past it. Everything
       that reasons about a disc from the outside — the dune field's keep-outs,
       the room a cup needs, the tests that walk a green's rim for out of
       bounds — measures against pad.r, and a shape that stays inside that
       circle cannot break any of them. A pad with no wave is the circle it
       always was. */
    function padRadius(pad, ang) {
        var w = pad.wave, i, s;
        if (!w) return pad.r;
        s = -w.bite;
        for (i = 0; i < w.terms.length; i++) {
            s += w.terms[i][1] * Math.sin(w.terms[i][0] * ang + w.terms[i][2]);
        }
        return pad.r * (1 + s);
    }

    function padContains(pad, x, z) {
        if (pad.r) {
            var dx = x - (pad.x + pad.w / 2), dz = z - (pad.z + pad.d / 2);
            var q = dx * dx + dz * dz;
            /* The two cheap answers first. This is asked of every pad on the
               hole on every substep, and the trigonometry above is only worth
               paying for in the band between the wave's troughs and its
               crests — which is a tenth of the disc. */
            if (q > pad.r * pad.r) return false;
            if (!pad.wave || q <= pad.rIn * pad.rIn) return true;
            var rr = padRadius(pad, Math.atan2(dz, dx));
            return q <= rr * rr;
        }
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
    var INLAY_EPS = 1e-6;

    function surfaceUnder(hole, x, z, ceil) {
        var best = null, bestY = -Infinity, pads = hole.pads, i, h;
        for (i = 0; i < pads.length; i++) {
            if (!padContains(pads[i], x, z)) continue;
            h = padHeight(pads[i], x, z);
            if (h > ceil) continue;
            /* Highest wins, as it always has. The second clause is the one
               exception the game allows to "pads must not overlap": a pad
               marked `inlay` is laid *into* the one below it at the same
               height — a round green on rolling ground — and takes the tie.

               Without it the lookup would be deciding between two pads that
               are the same height by whichever came first in the array, which
               is the order-dependence the overlap rule exists to prevent. With
               it the answer is the same whatever the order, and the surface is
               continuous either way: an inlay only ever changes what the
               ground is *made of* underfoot, never where it is. */
            if (h > bestY + INLAY_EPS ||
                (pads[i].inlay && h > bestY - INLAY_EPS)) {
                bestY = h; best = pads[i];
            }
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

    /* Is the ball's centre inside the ground at this point? Pads are surfaces
       rather than solids, so "inside" has to be said in terms of them: there
       is ground here, and every bit of it is above the centre — nothing to
       stand on, and a face between the ball and the daylight. Being under a
       bridge is not this: there the deck is above the ball but the ground
       below is what surfaceUnder hands back, so it never fires.

       The centre, not the crown. A sphere resting on a surface has its centre
       a radius above it, so a centre below the surface is a ball that is in
       the hillside rather than on it — and measuring from the crown instead
       leaves a radius-deep band around every riser where the ball is already
       inside the face and nothing has noticed. */
    function inFace(hole, x, z, y) {
        return !surfaceUnder(hole, x, z, y) && !!surfaceUnder(hole, x, z, Infinity);
    }

    /* Last resort for a ball that is inside a face and cannot be got out by
       undoing the step that put it there — one that came down the face itself,
       or arrived by some route where the previous position was buried too.
       Shove the centre through the nearest edge of the pad it is under,
       preferring an edge that leaves it in the open.

       Without this the ball has nowhere to go: every step restores a position
       that is itself inside the hill, so it sinks until it is out of the
       world. That is the ball falling through the terrace risers. */
    function ejectFromFace(hole, b, events) {
        var s = surfaceUnder(hole, b.x, b.z, Infinity);
        if (!s || s.pad === CUP_PAD || !s.pad.w || !s.pad.d) return;
        var pad = s.pad, r = C.BALL_R;
        var ways = [
            { d: b.x - pad.x, x: pad.x - r, z: b.z, nx: -1, nz: 0 },
            { d: pad.x + pad.w - b.x, x: pad.x + pad.w + r, z: b.z, nx: 1, nz: 0 },
            { d: b.z - pad.z, x: b.x, z: pad.z - r, nx: 0, nz: -1 },
            { d: pad.z + pad.d - b.z, x: b.x, z: pad.z + pad.d + r, nx: 0, nz: 1 }
        ];
        ways.sort(function (a, c) { return a.d - c.d; });
        var pick = ways[0], i;
        for (i = 0; i < ways.length; i++) {
            if (!inFace(hole, ways[i].x, ways[i].z, b.y)) { pick = ways[i]; break; }
        }
        b.x = pick.x; b.z = pick.z;
        if (pick.nx && b.vx * pick.nx < 0) b.vx = -b.vx * C.RESTITUTION;
        if (pick.nz && b.vz * pick.nz < 0) b.vz = -b.vz * C.RESTITUTION;
        events.bounce = true;
    }

    /* Out of bounds, the way a real course means it: a line you may cross,
       and are only punished for stopping beyond.

       The older courses do not need this — they are fenced, and a ball that
       leaves one has physically fallen out of the world, which OOB_Y already
       catches in mid-air. An open course has no fence and no cliff: the ground
       runs to the horizon, so nothing ever falls off it and there has to be a
       boundary that is a *rule* rather than a shape. `hole.fence` is that
       rectangle, and this is checked once, when the ball comes to rest, so a
       ball that runs across the line and back is exactly as fine as it would
       be with a white stake beside it.

       It may also be a *list* of rectangles, in which case in-bounds is inside
       any of them. That is not generality for its own sake: two overlapping
       rectangles make an L, and an L is a dogleg — a hole that bends because
       cutting the corner puts you off the property, which is exactly how a
       real course bends a hole it has no room to bend with trees. */
    function inRect(f, x, z) {
        return x >= f.x && x <= f.x + f.w && z >= f.z && z <= f.z + f.d;
    }

    function outOfBounds(hole, x, z) {
        var f = hole.fence, i;
        if (!f) return false;
        if (f.length === undefined) return !inRect(f, x, z);
        for (i = 0; i < f.length; i++) if (inRect(f[i], x, z)) return false;
        return true;
    }

    // The boundary as a list, whatever it was authored as. The renderer walks
    // it to plant the stakes and the hole's bounds are its extent.
    function fenceRects(hole) {
        var f = hole.fence;
        if (!f) return [];
        return f.length === undefined ? [f] : f;
    }

    function markOutOfBounds(world, events) {
        var b = world.ball;
        if (world.sunk || world.splash || world.out) return;
        if (!outOfBounds(world.hole, b.x, b.z)) return;
        world.out = true;
        events.out = true;
    }

    /* The mouth the ball is over, if any, and only if the ball is low enough
       to go down it. A pipe is a hole in the floor: a putt finds it and a
       lofted shot sails across the top of it, which is what makes "keep it
       down" a thing a hole can ask for without a single wall.

       The exit is placed on whatever ground is at the far end and the ball
       leaves along the pipe's own yaw at the speed it went in. Not the
       direction it arrived from: a pipe has a mouth, and coming out of one
       pointing wherever you happened to enter would make the far end
       unaimable — which is the one thing the far end has to be. */
    function warpUnder(hole, b) {
        var ws = hole.warps, i, w, s;
        if (!ws) return null;
        for (i = 0; i < ws.length; i++) {
            w = ws[i];
            var dx = b.x - w.x, dz = b.z - w.z;
            if (dx * dx + dz * dz > w.r * w.r) continue;
            s = surfaceUnder(hole, b.x, b.z, b.y + C.STEP_UP);
            if (!s || b.y - C.BALL_R > s.y + C.WARP_MOUTH) continue;
            return w;
        }
        return null;
    }

    function takeWarp(world, events) {
        var b = world.ball;
        var w = warpUnder(world.hole, b);
        if (!w) return;
        var sp = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
        var out = surfaceTop(world.hole, w.tx, w.tz);
        b.x = w.tx; b.z = w.tz;
        b.y = (out ? out.y : 0) + C.BALL_R;
        b.vx = Math.sin(w.yaw) * sp;
        b.vz = Math.cos(w.yaw) * sp;
        b.vy = 0;
        world.grounded = true;
        world.warpFor = C.WARP_LOCK;
        events.warp = true;
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
        /* A flipper: a bat that sweeps between two angles instead of going
           round. It is the third way a wall is allowed to move and the first
           one with a *rest*, which is the whole of why it plays differently
           from a blade — a spinner is always coming round again and the shot
           is a gap in a cycle, a flipper stops at each end and the shot is a
           moment. Eased at both ends by the cosine, because a bat that
           reversed at full speed would be a bat that teleports.

           `spin` is set to the angular rate rather than to zero, so the solver
           gives the ball the same shove off a moving flipper as it does off a
           blade (wallPointVelocity). A bat that swept through the ball without
           hitting it would look exactly like this and play like a wall. */
        if (w.swing) {
            var sw = w.swing;
            var ph = t * sw.speed + (sw.phase || 0);
            var half = (sw.to - sw.from) / 2;
            yaw += sw.from + half * (1 - Math.cos(ph));
            spin += half * Math.sin(ph) * sw.speed;
        }
        // `out` lets a caller reuse one object rather than allocate per call —
        // the solver across thousands of substeps, the renderer once per mover
        // per frame. Omitting it is for the one-off: a test, an inspector.
        var B = out || {};
        B.cx = cx; B.cz = cz;
        B.hw = w.w / 2; B.hd = w.d / 2;
        B.yaw = yaw; B.spin = spin;
        B.vx = vx; B.vz = vz;
        B.base = w.base || 0;
        B.top = (w.base || 0) + w.h;
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
            spin: 0,            // sidespin, signed; bends the ball in flight only
            slowFor: 0,
            sunk: false,
            splash: false,
            out: false,
            sprung: 0,          // springs fired this shot; each is worth less
            warpFor: 0,         // seconds before a mouth will swallow again
            overCup: false      // has the ball been over the mouth? see cupContact
        };
    }

    function cloneWorld(w) {
        var b = w.ball;
        return {
            hole: w.hole,
            ball: { x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, vz: b.vz, bite: b.bite || 0 },
            origin: { x: w.origin.x, y: w.origin.y, z: w.origin.z },
            time: w.time,
            grounded: w.grounded,
            spin: w.spin || 0,
            slowFor: w.slowFor,
            moving: w.moving,
            sunk: w.sunk,
            splash: w.splash,
            out: w.out,
            sprung: w.sprung || 0,
            warpFor: w.warpFor || 0,
            overCup: w.overCup
        };
    }

    /* Aim is a compass yaw in the xz plane; loft lifts the shot out of it.
       A lofted ball leaves the ground immediately, which is the whole point —
       it is how you carry a rail, a bunker or a pond instead of going round.

       `bite` is backspin, and it is the third number a shot has ever carried.
       It is the fraction of the ball's *ground* speed that the first landing
       takes away, spent once and gone — which is what backspin does and, more
       to the point, the only property that separates two clubs of the same
       loft and the same power. The simulation still does not hear the word
       "club": it is handed an angle, a speed and now a number for how much the
       first bounce costs. config.js decides which club supplies which. */
    function launch(world, yaw, power, loft, bite) {
        /* The ceiling is the longest club's ceiling, plus its overdraw, plus
           what a clean strike at the top of that overdraw is worth (deliver).
           The meter is allowed past a full swing and the gate is allowed to
           pay out on top of it, so the simulation has to be too — a clamp that
           knows about only the first two silently ate the whole of the prize
           on the one club big enough to reach it. */
        var top = C.MAX_POWER * (1 + C.OVERDRAW) * (1 + C.OVER_GAIN);
        var p = Math.max(0, Math.min(top, power));
        if (p < C.MIN_POWER) return false;
        var l = Math.max(0, Math.min(C.MAX_LOFT, loft || 0));
        var flat = Math.cos(l) * p;
        var b = world.ball;
        world.origin.x = b.x; world.origin.y = b.y; world.origin.z = b.z;
        b.vx = Math.sin(yaw) * flat;
        b.vz = Math.cos(yaw) * flat;
        b.vy = Math.sin(l) * p;
        b.bite = Math.max(0, Math.min(0.95, bite || 0));
        world.moving = true;
        world.spin = 0;
        world.splash = false;
        world.out = false;
        world.overCup = false;
        world.sprung = 0;
        world.warpFor = 0;
        if (b.vy > 0.01) world.grounded = false;
        return true;
    }

    /* ── overdraw ───────────────────────────────────────────────────────

       How far past a full swing the meter was wound, as 0 at the ceiling and 1
       at the very end of the overdraw. Everything about spray is expressed in
       this number rather than in raw power, because a putter thrashed and a
       driver thrashed are the same mistake. */
    function overdraw(power, ceiling) {
        if (!ceiling || !C.OVERDRAW) return 0;
        return Math.max(0, Math.min(1, (power / ceiling - 1) / C.OVERDRAW));
    }

    /* What the club actually delivers, given what the meter says. Below a full
       swing these are the same number and always have been. Above one the
       meter's linear reading is topped up by CONFIG.OVER_GAIN, squared in the
       overdraw so that almost all of it sits at the very end — the same place
       the spray curve puts almost all of the risk.

       Both the shot and the preview of it go through here, or the cone would
       be drawing a shorter ball than the one that gets played. */
    function deliver(power, ceiling) {
        var t = overdraw(power, ceiling);
        if (!t) return power;
        return power * (1 + C.OVER_GAIN * t * t);
    }

    /* How wild the shot gets, as the half-angle it can leave off line by and
       the fraction of its weight it can be out by. Nothing at or inside a full
       swing sprays at all — inside 100% the ball goes exactly where the cone
       points, which is the whole reason to stay there. Past it the two numbers
       climb on an exponential rather than in step with the meter: a curve that
       is nearly flat where the overdraw starts and near vertical where it
       ends. See CONFIG.SPRAY_*. */
    function spray(over) {
        var t = Math.max(0, Math.min(1, over || 0));
        if (t <= 0) return { yaw: 0, power: 0 };
        var k = C.SPRAY_CURVE;
        var e = (Math.exp(k * t) - 1) / (Math.exp(k) - 1);
        return { yaw: C.SPRAY_YAW * e, power: C.SPRAY_POWER * e };
    }

    /* The shot that is actually played, given the one that was asked for. Two
       draws, not one: a thrashed shot misses left-or-right and heavy-or-light
       independently, the way a real one does — pull it and catch it thin and
       you have made two mistakes, not the same mistake twice. `rand` returns
       [0, 1) and defaults to Math.random; the tests hand in something
       repeatable. Inside a full swing this returns its arguments untouched. */
    function sprayShot(yaw, power, over, rand) {
        var s = spray(over);
        if (!s.yaw && !s.power) return { yaw: yaw, power: power };
        var r = rand || Math.random;
        return {
            yaw: yaw + (r() * 2 - 1) * s.yaw,
            power: power * (1 + (r() * 2 - 1) * s.power)
        };
    }

    /* Length of a vector, by sqrt of the sum of squares rather than by
       Math.hypot — here and everywhere else in this file that sits inside the
       substep.

       They are not the same function. hypot rescales its arguments first, so
       that a vector whose components would square to infinity, or underflow to
       nothing, still comes back with the right answer; it pays for that guard
       on every call, and measured in V8 it costs some fifteen times the sqrt.
       Nothing the solver holds is anywhere near those magnitudes — a ball's
       speed is single digits and a hole is under a hundred units across — so
       the guard buys accuracy that is already there and the sqrt is exact over
       the whole range. The substep asks for this on every step and the wall
       loop asked for one per wall, which is why it was worth a third of the
       preview path. */
    function speedOf(b) { return Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz); }
    function groundSpeed(b) { return Math.sqrt(b.vx * b.vx + b.vz * b.vz); }

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

            /* Then the bounding-circle reject, which is what keeps a hole with
               twenty rails from costing twenty box transforms per substep —
               and it has to be read off the wall's own numbers to do that,
               because the transform *is* the expensive half. It used to be
               measured from the box wallBox had already built, so every wall
               on the hole paid the whole transform to be told it was nowhere
               near; that reject cost more than the collision it was skipping.

               The radius is the half-perimeter rather than the half-diagonal,
               which is never smaller and wants no square root — a rail, which
               is long and thin, is the shape it is tightest on, and on a post
               the slack is a few centimetres of a hole. A wall that slides
               carries its whole travel in there as well, so the circle covers
               it wherever on the stroke the clock has put it; one that turns,
               or that swings, does not move its middle at all. */
            dx = b.x - (w.x + w.w / 2); dz = b.z - (w.z + w.d / 2);
            reach = (w.w + w.d) / 2 + (w.move ? Math.abs(w.move.amp) : 0) + C.BALL_R;
            if (dx * dx + dz * dz > reach * reach) continue;

            B = wallBox(w, world.time, SCRATCH);
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
        var b = world.ball, hole = world.hole, cup = hole.cup;
        var dx = b.x - cup.x, dz = b.z - cup.z;
        var d = Math.sqrt(dx * dx + dz * dz);
        // Out of reach of the rim: nothing about the cup applies, whatever
        // height the ball is at. (Testing the height here instead would hand
        // the shaft to every ball on a level below the green.)
        if (d > C.HOLE_R + C.BALL_R) { world.overCup = false; return false; }

        /* The mouth of the cup is open from above and from nowhere else.

           The shaft is modelled as a cylinder with no sides above the rim,
           which is fine while the only way to reach it is across the green.
           Give a hole a raised green with an open edge — a tabletop, a summit,
           a crater wall — and a ball can fly in *under* the putting surface,
           arrive inside the mouth on the way past, and be counted as holed
           from below. That is a hole in one that never touched the green.

           So the shaft only accepts a ball that has been over it: centre
           inside the mouth, at or above the rim. A putt crossing the lip
           qualifies, a lob dropping in qualifies, and a shot passing beneath
           the green does not. The flag clears as soon as the ball is out of
           reach of the rim again, so a lip-out cannot bank the permission. */
        if (d < C.HOLE_R && b.y >= cup.y) world.overCup = true;

        var ux = d > 1e-9 ? dx / d : 1, uz = d > 1e-9 ? dz / d : 0;
        var e = 1 + C.CUP_RESTITUTION;

        // The rim edge: distance from the ball's centre to the nearest point of
        // the rim circle, in the plane that contains both.
        var rx = d - C.HOLE_R, ry = b.y - cup.y;
        var rd = Math.sqrt(rx * rx + ry * ry);
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
        // the mouth of the hole — and only for a ball that came in through it.
        if (b.y < cup.y && d < C.HOLE_R && world.overCup) {
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
            var apex = b.y + (b.vy > 0 ? (b.vy * b.vy) / (2 * gravityOf(hole)) : 0);
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

    /* What a spring is worth this time. Each firing within one shot is worth
       SPRING_DECAY of the last, and once it would be under the speed a landing
       settles at the pad has nothing left to give and behaves like ground.
       Bounded, deterministic, and the reason a trampoline cannot hold a shot
       open until MAX_SHOT_SECONDS closes it. */
    function springKick(world, pad) {
        if (!pad || !pad.spring) return 0;
        var v = pad.spring * Math.pow(C.SPRING_DECAY, world.sprung);
        return v > C.LAND_REST ? v : 0;
    }

    // Scratch for the gradient under the ball: written before it is read on
    // every substep, never held on to.
    var _lie = { x: 0, z: 0 };

    function substep(world, dt, events) {
        var b = world.ball, hole = world.hole;
        var grav = gravityOf(hole);
        world.time += dt;

        if (world.grounded) {
            var here = surfaceUnder(hole, b.x, b.z, b.y + C.STEP_UP);
            if (!here) {                       // the pad vanished under us
                world.grounded = false;
                b.vy = 0;
            } else {
                var pad = here.pad;
                /* The gradient of the ground under the ball rather than the
                   pad's own tilt, so a hump accelerates the ball exactly as a
                   ramp does and neither this line nor anything below it knows
                   the difference. */
                var g = padGrad(pad, b.x, b.z, _lie);
                var sx = g.x, sz = g.z;

                // Downhill acceleration on a tilted plane, projected into the
                // horizontal: g * gradient / (1 + |gradient|²).
                if (sx || sz) {
                    var k = grav / (1 + sx * sx + sz * sz);
                    b.vx -= k * sx * dt;
                    b.vz -= k * sz * dt;
                }

                /* And the belt, which is the same idea with a different cause:
                   a slope accelerates the ball because of where the ground is
                   and a travelator because of what it is doing, and neither of
                   them is anything the rest of the step needs to know about.
                   Drag balances it — see the note in config.js — so a pad with
                   a push has a speed rather than a shove, and a ball put down
                   on one against the run of it is turned round rather than
                   stopped. */
                if (pad.push) {
                    b.vx += pad.push.x * dt;
                    b.vz += pad.push.z * dt;
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
                    // Rolled on to a launch pad. A trampoline does not ask how
                    // you got there, so this is the same event as landing on
                    // one and it goes through the same counter.
                    var roll = springKick(world, next.pad);
                    if (roll) {
                        world.grounded = false;
                        world.sprung++;
                        b.vy = roll;
                        events.land = true;
                    }
                }
            }
        } else {
            var px = b.x, pz = b.z, py = b.y;
            /* Sidespin, and only here: a ball bends in the air and rolls where
               the ground tells it to. The push is square to where the ball is
               going and proportional to how fast it is going, so the curve is
               at its hardest off the clubface and eases as the shot runs out —
               which is why a bent shot looks like a banana and not an arc of a
               circle. */
            if (world.spin) {
                var gs = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
                if (gs > 1e-4) {
                    // Both components come off the velocity as it was: turning
                    // one and then reading it back to turn the other is a
                    // rotation of the wrong thing by the wrong amount.
                    var ovx = b.vx, ovz = b.vz;
                    var sa = C.SPIN_ACCEL * world.spin * gs * dt;
                    b.vx += (ovz / gs) * sa;
                    b.vz += (-ovx / gs) * sa;
                }
            }
            b.vy -= grav * dt;
            b.x += b.vx * dt;
            b.z += b.vz * dt;
            b.y += b.vy * dt;

            var land = surfaceUnder(hole, b.x, b.z, b.y);

            /* A cliff met in mid-air. Pads are surfaces, not solids, so
               nothing in the model stops a ball flying into the *side* of
               something: it sails on through the hillside and out of the
               world underneath. That is how a ball vanishes into a terrace
               riser, and how one used to arrive in the mouth of a raised cup
               from below and be counted as holed.

               There is no support at the ball's own height (that is what a
               null `land` means) and yet there is ground here, so the centre
               is inside something. The one thing left to decide is which way
               it got in, and the height it started the step at says so: a
               centre that was above this ground has come down onto the top of
               it and wants a landing, and one that was below it has flown into
               the face and wants a wall.

               The face is resolved one axis at a time, like the kerb backstop
               on the ground, so a glancing blow slides along it instead of
               stopping dead — and if that still leaves the ball inside (it
               came down the face itself, say), it is pushed out bodily rather
               than left to sink. It costs a lookup, and only over a void or a
               riser, which is the only place the ball can be inside
               anything. */
            if (!land) {
                var col = surfaceUnder(hole, b.x, b.z, Infinity);
                if (col && py >= col.y) {
                    land = col;             // came down on top of it
                } else if (col) {
                    if (inFace(hole, b.x, pz, b.y)) {
                        b.x = px; b.vx = -b.vx * C.RESTITUTION; events.bounce = true;
                    }
                    if (inFace(hole, px, b.z, b.y)) {
                        b.z = pz; b.vz = -b.vz * C.RESTITUTION; events.bounce = true;
                    }
                    if (inFace(hole, b.x, b.z, b.y)) ejectFromFace(hole, b, events);
                    land = surfaceUnder(hole, b.x, b.z, b.y);
                }
            }

            if (land && b.y - C.BALL_R <= land.y) {
                b.y = land.y + C.BALL_R;
                var impact = -b.vy;
                var kick = springKick(world, land.pad);
                if (kick) {
                    // A launch pad keeps the run on: it is a thing you cross
                    // on the way somewhere, not a thing you land in.
                    world.sprung++;
                    b.vy = kick;
                } else {
                    b.vx *= C.LAND_GRIP;
                    b.vz *= C.LAND_GRIP;
                    b.vy = impact * C.BOUNCE;
                }
                /* Backspin, spent on the first thing the ball touches. It is
                   taken off the ground speed rather than off the bounce,
                   because what a checked wedge does is arrive and stay — the
                   hop is the same hop and the run after it is not. */
                if (b.bite) {
                    b.vx *= (1 - b.bite);
                    b.vz *= (1 - b.bite);
                    b.bite = 0;
                }
                /* Most of the bend does not survive the ground. What is left
                   still shapes a second hop; nothing survives to the roll,
                   where the slope is the only thing entitled to steer.

                   It comes off a launch pad as well as off ordinary ground,
                   and deliberately: a trampoline is contact, and a shot that
                   kept its whole curve through one would come off the pad
                   bending exactly as hard as it arrived — which is not what
                   anything hitting anything does. */
                world.spin *= C.SPIN_LAND;
                events.land = true;
                if (b.vy < C.LAND_REST) {
                    b.vy = 0;
                    world.grounded = true;
                }
            }
        }

        collideWalls(world, dt, events);

        /* And the pipes, after the walls have had their say — a mouth set into
           the floor beside a rail should swallow the ball that has just come
           off the rail, not the one that is still inside it. */
        if (world.warpFor > 0) world.warpFor -= dt;
        else takeWarp(world, events);

        if (cupContact(world, events)) return;
        if (drown(world, events)) return;

        if (b.y < C.OOB_Y) {
            b.vx = b.vy = b.vz = 0;
            world.out = true;
            world.moving = false;
            events.out = true;
            return;
        }

        /* At rest — if the ground under the ball will hold it there.

           This is the one place static friction lives (CONFIG.HOLD). The drag
           above is proportional to speed and so has nothing to say about a
           stopped ball; asked on its own it would let one sit anywhere,
           including halfway up a ramp. So a slow ball is at rest when the lie
           beneath it is shallower than its surface's angle of repose, and
           otherwise it is not at rest at all — it creeps on downhill until it
           finds somewhere that is, which is what a ball does.

           Two timers cover the cases with no lie to ask. A ball that is not
           grounded has nothing under it to hold it — leaning on a rail, or
           perched on the lip of the cup with the green missing beneath — and
           settles on the short one. And a grounded ball that has crept at
           under walking pace for STUCK seconds is not on a hillside at all,
           it is jammed against something; without that backstop a ball wedged
           against a rail on a bank would run out the shot clock. */
        var slow = speedOf(b) < C.STOP_SPEED;
        if (!slow) {
            world.slowFor = 0;
        } else {
            world.slowFor += dt;
            var settled;
            if (world.grounded) {
                var lie = surfaceUnder(hole, b.x, b.z, b.y + C.STEP_UP);
                /* A travelator is never a lie that holds, whatever its
                   gradient says. The drag above is the only thing that ever
                   balances a belt, and drag is zero at zero speed — so without
                   this a ball that arrived slowly enough would be declared at
                   rest on a moving floor and sit there, which is both wrong
                   and the exact bug a player would report as "the belt is
                   broken". The STUCK backstop still catches a ball the belt is
                   holding against a wall, because that one really has stopped. */
                settled = (lie && !lie.pad.push &&
                        slopeAt(lie.pad, b.x, b.z) <= holdOf(lie.pad.kind)) ||
                    world.slowFor > C.STUCK;
            } else {
                settled = world.slowFor > C.SLOPE_SETTLE;
            }
            if (settled) {
                b.vx = b.vy = b.vz = 0;
                if (world.moving) events.rest = true;
                world.moving = false;
                markOutOfBounds(world, events);
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

    function simulateShot(hole, from, yaw, power, loft, time, bite) {
        var w = createWorld(hole, from, time);
        if (!launch(w, yaw, power, loft, bite)) return w;
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
    function previewPath(world, yaw, power, loft, seconds, bite) {
        var w = cloneWorld(world);
        if (!launch(w, yaw, power, loft, bite)) return [];
        var pts = [{ x: w.ball.x, y: w.ball.y, z: w.ball.z }];
        var steps = Math.ceil((seconds || 0.7) / C.SIM_DT);
        var grant = Math.ceil(steps * 0.6);
        var turn = -1, i, ev, p;
        for (i = 0; i < steps; i++) {
            ev = advance(w, C.SIM_DT, {});
            // A pipe is where the prediction stops. Carrying on would draw a
            // dotted line straight across the hole from one mouth to the
            // other, which is a picture of the ball travelling through ground
            // it never touches.
            if (ev.warp) break;
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
        padRadius: padRadius,
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
        overdraw: overdraw,
        deliver: deliver,
        spray: spray,
        sprayShot: sprayShot,
        advance: advance,
        settle: settle,
        done: done,
        simulateShot: simulateShot,
        previewPath: previewPath,
        speedOf: speedOf,
        groundSpeed: groundSpeed,
        frictionOf: frictionOf,
        holdOf: holdOf,
        gravityOf: gravityOf,
        padGrad: padGrad,
        slopeAt: slopeAt,
        outOfBounds: outOfBounds,
        fenceRects: fenceRects,
        warpUnder: warpUnder,
        springKick: springKick
    };

})(window.G3);
