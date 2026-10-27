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
    // What a landing keeps, per surface. See CONFIG.LANDING.
    function landingOf(kind) {
        return C.LANDING[kind] || C.LANDING_DEFAULT;
    }
    // What one landing keeps of the ground speed: the surface's whole grip
    // from a real fall, less of it from a hop. See CONFIG.LAND_FIRM.
    function landGrip(grip, impact) {
        return 1 - (1 - grip) * Math.min(1, impact / C.LAND_FIRM);
    }
    // The constant part of the ground's drag, per surface. See CONFIG.ROLL.
    function rollOf(kind) {
        return C.ROLL[kind] !== undefined ? C.ROLL[kind] : C.ROLL_DEFAULT;
    }
    // The speed below which this surface starts to sit a ball down. See CONFIG.SIT.
    function sitOf(kind) {
        return C.SIT[kind] !== undefined ? C.SIT[kind] : C.SIT_DEFAULT;
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
                 as two of them and a chute is written as one.

         loops   [{ x, z, yaw, R, shift }]: a loop-the-loop whose foot is at
                 (x, z), entered rolling along `yaw`. See "the loop" below. */
    /* A bump is a raised cosine of radius r and height a, measured from its
       *spine* — and the spine need not be a point. A hump (cx, cz) is the
       one every dune and hummock is; `line: [x0, z0, x1, z1]` lays the same
       profile along a segment, which is a smooth ridge or, with a below
       zero, a trough with curved sides (a half-pipe); `ring: { cx, cz, R,
       a0, a1 }` lays it round a circle or an arc of one, which is a curved
       channel or a banked turn. Height only ever asks how far the point is
       from the spine, and the slope asks which way, so the three are one
       code path past `spine` and nothing downstream knows the difference.

       `spine` writes the offset from the nearest point of the spine into
       _sp and returns its squared length. */
    var _sp = { x: 0, z: 0 };
    function spine(m, x, z) {
        var dx, dz, t;
        if (m.line) {
            var L = m.line, ex = L[2] - L[0], ez = L[3] - L[1];
            var ll = ex * ex + ez * ez;
            t = ll > 0 ? ((x - L[0]) * ex + (z - L[1]) * ez) / ll : 0;
            t = t < 0 ? 0 : (t > 1 ? 1 : t);
            dx = x - (L[0] + ex * t); dz = z - (L[1] + ez * t);
        } else if (m.ring) {
            var g = m.ring, ox = x - g.cx, oz = z - g.cz;
            var ang = Math.atan2(oz, ox);
            if (g.a0 !== undefined) {
                // An arc: an angle outside it is measured from the nearer
                // end, so the channel stops in a rounded end, not a cliff.
                var span = g.a1 - g.a0, rel = ang - g.a0;
                rel -= Math.floor(rel / (Math.PI * 2)) * Math.PI * 2;
                if (rel > span) ang = (rel - span < Math.PI * 2 - rel) ? g.a1 : g.a0;
            }
            dx = x - (g.cx + Math.cos(ang) * g.R);
            dz = z - (g.cz + Math.sin(ang) * g.R);
        } else {
            dx = x - m.cx; dz = z - m.cz;
        }
        _sp.x = dx; _sp.z = dz;
        return dx * dx + dz * dz;
    }

    /* ── surfaces that are a function ───────────────────────────────

       Challenge mode's ground, and the one kind of pad whose height is not
       a sum of humps: `pad.field` is a list of terms, each a closed-form
       function with a closed-form gradient, and `pad.calm` a list of places
       ({ x, z, r0, r1 }) where the whole field is faded out — flat inside r0,
       full strength past r1, a smoothstep between — because a cup and a tee
       need flat ground wherever the dice put them.

         wave    [kx, kz], a, ph   a·sin(kx·x + kz·z + ph): a sea of ridges
         ripple  [cx, cz], k, a, fall   a·cos(k·r)·e^(-fall·r): a stone in a pond
         saddle  [cx, cz], a, s    a·(dx² - dz²)/s²: a pass between two hills
         gauss   [cx, cz], a, s    a·e^(-r²/2s²): one smooth hill, or a well
         spiral  [cx, cz], k, n, a  a·sin(k·r − n·θ): n grooves winding inwards

       height = plane + bumps + M·F, where F is the sum of the terms and M the
       product of the calm masks; the gradient is M∇F + F∇M, which is the one
       line here that is easy to get wrong, and the suite checks it against a
       finite difference. */
    var _fg = { x: 0, z: 0 }, _mg = { x: 0, z: 0 };
    function fieldAt(terms, x, z, g) {
        var f = 0, i, t, dx, dz, r, v, e, d;
        g.x = 0; g.z = 0;
        for (i = 0; i < terms.length; i++) {
            t = terms[i];
            if (t.wave) {
                v = t.wave[0] * x + t.wave[1] * z + (t.ph || 0);
                f += t.a * Math.sin(v);
                d = t.a * Math.cos(v);
                g.x += d * t.wave[0]; g.z += d * t.wave[1];
            } else if (t.ripple) {
                dx = x - t.ripple[0]; dz = z - t.ripple[1];
                r = Math.sqrt(dx * dx + dz * dz);
                e = Math.exp(-(t.fall || 0) * r);
                f += t.a * Math.cos(t.k * r) * e;
                if (r > 1e-6) {
                    d = t.a * e * (-t.k * Math.sin(t.k * r) - (t.fall || 0) * Math.cos(t.k * r)) / r;
                    g.x += d * dx; g.z += d * dz;
                }
            } else if (t.saddle) {
                dx = x - t.saddle[0]; dz = z - t.saddle[1];
                v = t.a / (t.s * t.s);
                f += v * (dx * dx - dz * dz);
                g.x += 2 * v * dx; g.z -= 2 * v * dz;
            } else if (t.spiral) {
                // a·sin(k·r − n·θ): n arms winding in to the middle. The slope
                // has a radial part and a part round the circle, and the
                // second is 1/r of the angular derivative.
                dx = x - t.spiral[0]; dz = z - t.spiral[1];
                r = Math.sqrt(dx * dx + dz * dz);
                v = t.k * r - t.n * Math.atan2(dz, dx);
                f += t.a * Math.sin(v);
                if (r > 1e-6) {
                    d = t.a * Math.cos(v);
                    var dr = d * t.k / r, dt = -d * t.n / (r * r);
                    g.x += dr * dx - dt * dz;
                    g.z += dr * dz + dt * dx;
                }
            } else if (t.gauss) {
                dx = x - t.gauss[0]; dz = z - t.gauss[1];
                v = t.a * Math.exp(-(dx * dx + dz * dz) / (2 * t.s * t.s));
                f += v;
                g.x -= v * dx / (t.s * t.s); g.z -= v * dz / (t.s * t.s);
            }
        }
        return f;
    }
    function calmAt(calm, x, z, g) {
        var m = 1, i, c, dx, dz, d, u, s, ds, k;
        g.x = 0; g.z = 0;
        if (!calm) return 1;
        for (i = 0; i < calm.length; i++) {
            c = calm[i];
            dx = x - c.x; dz = z - c.z;
            d = Math.sqrt(dx * dx + dz * dz);
            if (d >= c.r1) continue;
            if (d <= c.r0) { g.x = 0; g.z = 0; return 0; }
            u = (d - c.r0) / (c.r1 - c.r0);
            s = u * u * (3 - 2 * u);
            ds = 6 * u * (1 - u) / (c.r1 - c.r0);
            // Product rule over the masks: the running gradient scales by
            // this one, and this one's own slope scales by the running value.
            k = ds * m / d;
            g.x = g.x * s + k * dx;
            g.z = g.z * s + k * dz;
            m *= s;
        }
        return m;
    }

    function padHeight(pad, x, z) {
        var h = pad.y + (pad.sx || 0) * (x - pad.x) + (pad.sz || 0) * (z - pad.z);
        if (pad.field) h += calmAt(pad.calm, x, z, _mg) * fieldAt(pad.field, x, z, _fg);
        var b = pad.bumps, i, m, dx, dz, q;
        if (b) {
            for (i = 0; i < b.length; i++) {
                m = b[i];
                if (m.line || m.ring) {
                    q = spine(m, x, z);
                } else {
                    dx = x - m.cx; dz = z - m.cz;
                    q = dx * dx + dz * dz;
                }
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
        if (pad.field) {
            var fm = calmAt(pad.calm, x, z, _mg), ff = fieldAt(pad.field, x, z, _fg);
            out.x += fm * _fg.x + ff * _mg.x;
            out.z += fm * _fg.z + ff * _mg.z;
        }
        var b = pad.bumps, i, m, dx, dz, q, d, k;
        if (b) {
            for (i = 0; i < b.length; i++) {
                m = b[i];
                if (m.line || m.ring) {
                    q = spine(m, x, z);
                    dx = _sp.x; dz = _sp.z;
                } else {
                    dx = x - m.cx; dz = z - m.cz;
                    q = dx * dx + dz * dz;
                }
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
        var w = pad.wave, i, s, r = pad.r, c, n;
        /* A round pad may be an oval, and a bunker usually is: a circle is
           what a compass draws, and a hollow scraped out of a hillside is
           longer one way than the other. `rx` and `rz` are the semi-axes and
           `pad.r` the longer of the two — which is what everything measuring a
           disc from the outside keeps using, since an ellipse inside its own
           bounding circle can no more break a clearance than a wave can.

           The branch is skipped for a true circle, which is most of them, and
           this is asked on every substep. */
        if (pad.rx && pad.rx !== pad.rz) {
            c = Math.cos(ang) * pad.rz;
            n = Math.sin(ang) * pad.rx;
            r = pad.rx * pad.rz / Math.sqrt(c * c + n * n);
        }
        if (!w) return r;
        s = -w.bite;
        for (i = 0; i < w.terms.length; i++) {
            s += w.terms[i][1] * Math.sin(w.terms[i][0] * ang + w.terms[i][2]);
        }
        return r * (1 + s);
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
        if (z < pad.z || z > pad.z + pad.d) return false;
        /* Holes in the ground (Challenge mode's `voids`): circles where the
           pad is simply not there, so a ball rolling over one drops through. */
        if (pad.voids) {
            for (var vi = 0; vi < pad.voids.length; vi++) {
                var vd = pad.voids[vi], vx = x - vd.x, vz = z - vd.z;
                if (vx * vx + vz * vz < vd.r * vd.r) return false;
            }
        }
        if (!pad.west && !pad.east) {
            if (x < pad.x || x > pad.x + pad.w) return false;
            return !pad.round || !cornerCut(pad, x, z);
        }
        /* A mown edge (courses.mow) — and the clamp bounds first, which are
           every place the curve can reach, so a point well clear of the line
           never pays for the trigonometry. */
        if (x < (pad.west ? pad.west.lo : pad.x)) return false;
        if (x > (pad.east ? pad.east.hi : pad.x + pad.w)) return false;
        return x >= (pad.west ? mowEdge(pad.west, z) : pad.x) &&
               x <= (pad.east ? mowEdge(pad.east, z) : pad.x + pad.w);
    }

    /* A rounded corner (courses.roundCorners): `pad.round` names a radius
       for any of sw, se, nw and ne — s and w being the low z and the low x —
       and the ground in the corner square outside that quarter-circle is not
       there. Asked only of a point already inside the rectangle, so the
       corner is the only thing left to rule on. */
    function cornerCut(pad, x, z) {
        var c = pad.round;
        var west = x < pad.x + pad.w / 2, south = z < pad.z + pad.d / 2;
        var r = south ? (west ? c.sw : c.se) : (west ? c.nw : c.ne);
        if (!r) return false;
        var ox = west ? pad.x + r - x : x - (pad.x + pad.w - r);
        var oz = south ? pad.z + r - z : z - (pad.z + pad.d - r);
        return ox > 0 && oz > 0 && ox * ox + oz * oz > r * r;
    }

    /* ── the mown line ──

       A fairway is not a strip: the mower follows the ground and the eye, and
       the edge it leaves wanders across the hole and rounds off at either end.
       `courses.mow` writes one as a *ribbon* — a centre line and a half-width
       down the hole, each a list of knots eased into one another so a fairway
       that jogs between rows bends instead of stepping, a few long sines on
       each side so the two edges do not wander together, and a quarter-ellipse
       at each end so the fairway finishes in a curve rather than a line across
       the hole.

       A pad carries it as `west` and/or `east`: {r: ribbon, s: -1 or 1, lo,
       hi}. The pad either side of a seam holds the *same* edge object, so the
       fairway and the rough beside it agree to the bit about where one stops
       and the other starts — there is no gap to fall through and no overlap
       for the surface lookup to argue over. `lo` and `hi` clamp the curve
       inside the row cells it was cut between, which is what keeps every pad
       a real pad whatever the sines do.

       Plain data, evaluated here, because this is where the ball asks. The
       pad's own x and w stay the cell it was written as, so everything that
       reads a pad as a rectangle — the editor, the audit's seams — still sees
       the straight row the hole was authored in, and only the two things that
       have to agree about the curve (this, and the terrain the renderer
       draws) ever see it. */
    function knot(list, z) {
        var i, a, b, t;
        if (z <= list[0][0]) return list[0][1];
        for (i = 1; i < list.length; i++) {
            b = list[i];
            if (z > b[0]) continue;
            a = list[i - 1];
            t = b[0] - a[0];
            if (t <= 1e-9) return b[1];
            t = (z - a[0]) / t;
            return a[1] + (b[1] - a[1]) * t * t * (3 - 2 * t);
        }
        return list[list.length - 1][1];
    }

    // How much of its width a ribbon has `d` in from an end rounded over `t`:
    // a quarter-ellipse, so the edge arrives at the tip square to the hole.
    function cap(d, t) {
        if (!t || d >= t) return 1;
        if (d <= 0) return 0;
        d = 1 - d / t;
        return Math.sqrt(1 - d * d);
    }

    function mowEdge(e, z) {
        var r = e.r, w = e.s < 0 ? r.w : r.e, n = 0, i, x;
        for (i = 0; i < w.length; i++) n += w[i][1] * Math.sin(w[i][0] * z + w[i][2]);
        x = knot(r.c, z) + e.s * cap(z - r.z0, r.t0) * cap(r.z1 - z, r.t1) * (knot(r.h, z) + n);
        return x < e.lo ? e.lo : x > e.hi ? e.hi : x;
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

    /* ── the loop ───────────────────────────────────────────────────────

       A loop-the-loop, and the one piece of track in the game the ball rides
       *on the inside of*. Everything else here is a height field — ground is a
       y for every (x, z) — and a height field cannot have a ceiling, so the
       loop is not ground at all: it is a track the ball is carried along, one
       number at a time, the way a pipe is a mouth and an exit.

       What makes it a ride rather than a teleport is that the number is
       honest. The ball's place on the track is an angle θ round the loop
       (0 at the foot, π at the top, 2π back at the foot) and its speed along
       the track obeys the same three things a rolling ball obeys anywhere
       else: gravity along the slope it is on, the boards' drag, and their
       rolling resistance. So the speed at the top is what the speed at the
       foot pays for, which is v² − 4gR less the friction, and that is the
       whole of the skill.

       And the track only holds the ball while the ball is pressing on it. Out
       at angle θ the track has to supply v²/R of push towards the middle of
       the loop and gravity supplies −g·cos θ of it; when v²/R + g·cos θ goes
       negative the track would have to *pull*, it cannot, and the ball comes
       off and falls — which is what a ball that only just reaches the top of
       a loop really does. Too slow to reach a quarter of the way round and it
       never gets that far: it runs back down and out of the mouth the way it
       went in.

       The loop is a corkscrew by `shift`, as every real one is: the track
       steps sideways as it goes round so that the way out runs beside the way
       in rather than through it. The speed is along the whole of that spiral,
       so the arc length per radian is √(R² + (shift/2π)²) rather than R.

       `R` is the radius of the path of the ball's middle. The track's own
       surface is a ball's radius further out, which is what render.js draws. */
    function loopFrame(L) {
        var fx = Math.sin(L.yaw), fz = Math.cos(L.yaw);
        var k = (L.shift || 0) / (2 * Math.PI);
        return { fx: fx, fz: fz, lx: fz, lz: -fx, k: k, re: Math.sqrt(L.R * L.R + k * k) };
    }

    // Where on the loop θ is: the ball's middle, and the unit direction it is
    // travelling when it moves forwards along the track.
    function loopPoint(L, F, base, th, out) {
        var s = Math.sin(th), c = Math.cos(th);
        out.x = L.x + F.fx * L.R * s + F.lx * F.k * th;
        out.z = L.z + F.fz * L.R * s + F.lz * F.k * th;
        out.y = base + L.R * (1 - c);
        out.tx = (F.fx * L.R * c + F.lx * F.k) / F.re;
        out.tz = (F.fz * L.R * c + F.lz * F.k) / F.re;
        out.ty = L.R * s / F.re;
        return out;
    }
    var _lp = { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0 };

    // The height of the ball's middle at the foot of a loop: one ball radius
    // over whatever floor it stands on.
    function loopBase(hole, L) {
        var s = surfaceTop(hole, L.x, L.z);
        return (s ? s.y : 0) + C.BALL_R;
    }

    /* Has a rolling ball just arrived in the mouth? It has to be on the floor,
       inside the lane, at most LOOP_MOUTH past the foot, and going the right
       way — a ball crossing the foot sideways or backwards has not entered a
       loop, it has walked under one. */
    function loopUnder(hole, world) {
        var ls = hole.loops, b = world.ball, i, L, F, rx, rz, fwd, lat, along;
        if (!ls || !world.grounded) return null;
        for (i = 0; i < ls.length; i++) {
            L = ls[i];
            F = loopFrame(L);
            rx = b.x - L.x; rz = b.z - L.z;
            fwd = rx * F.fx + rz * F.fz;
            if (fwd < 0 || fwd > C.LOOP_MOUTH) continue;
            lat = rx * F.lx + rz * F.lz;
            if (lat > C.LOOP_LANE || lat < -C.LOOP_LANE) continue;
            /* Heading up the lane, within forty-five degrees of it. Anything
               more across than that meets the kerbs of the track rather than
               the track, and "more than zero" let a ball rolling dead across
               the foot in with a speed up the lane of 1e-16. */
            along = b.vx * F.fx + b.vz * F.fz;
            if (along <= 0 || along * along < 0.5 * (b.vx * b.vx + b.vz * b.vz)) continue;
            return { loop: L, frame: F, th: fwd / F.re, v: along, base: loopBase(hole, L) };
        }
        return null;
    }

    function takeLoop(world, events) {
        var r = loopUnder(world.hole, world);
        if (!r) return false;
        world.ride = r;
        world.grounded = false;
        events.loop = true;
        placeOnLoop(world);
        return true;
    }

    function placeOnLoop(world) {
        var r = world.ride, b = world.ball;
        loopPoint(r.loop, r.frame, r.base, r.th, _lp);
        b.x = _lp.x; b.y = _lp.y; b.z = _lp.z;
        b.vx = _lp.tx * r.v; b.vy = _lp.ty * r.v; b.vz = _lp.tz * r.v;
    }

    // Off the loop and back on the floor at θ (0 or 2π), rolling along the
    // loop's own line at speed v — forwards out of the far end, or backwards
    // out of the mouth.
    function leaveLoop(world, th, v) {
        var r = world.ride, b = world.ball, F = r.frame;
        loopPoint(r.loop, F, r.base, th, _lp);
        b.x = _lp.x; b.z = _lp.z; b.y = r.base;
        b.vx = F.fx * v; b.vz = F.fz * v; b.vy = 0;
        world.ride = null;
        world.grounded = true;
        world.loopFor = C.LOOP_LOCK;
    }

    function rideLoop(world, dt, events) {
        var r = world.ride, F = r.frame, L = r.loop;
        var grav = gravityOf(world.hole);
        // Gravity along the track: the climb per unit of track is R·sin θ / re.
        r.v -= grav * L.R * Math.sin(r.th) / F.re * dt;
        r.v *= Math.pow(frictionOf('wood'), dt);
        var rr = rollOf('wood') * dt;
        if (r.v > rr) r.v -= rr;
        else if (r.v < -rr) r.v += rr;
        else r.v = 0;
        r.th += r.v * dt / F.re;

        if (r.th >= 2 * Math.PI) {
            leaveLoop(world, 2 * Math.PI, r.v);
            events.loopRound = true;
            return;
        }
        if (r.th <= 0) {
            leaveLoop(world, 0, r.v);
            return;
        }
        /* Is the track still pushing? The push it has to supply towards the
           middle is the speed round the circle squared over R, less what
           gravity already supplies; the circle's share of the speed is R/re
           of it, the rest being the corkscrew's sideways drift. */
        var vc = r.v * L.R / F.re;
        if (vc * vc / L.R + grav * Math.cos(r.th) < 0) {
            placeOnLoop(world);           // the velocity it leaves with
            world.fall = { loop: L, frame: F, base: r.base };
            world.ride = null;
            world.grounded = false;
            world.loopFor = C.LOOP_LOCK;
            events.loopFell = true;
            return;
        }
        placeOnLoop(world);
    }

    /* A ball that has come off the top is falling *inside* the loop, and the
       track is all round it. So it is caught again the moment its middle is
       a radius from the loop's middle: put back on the track at that angle,
       with the part of its velocity that runs along the track and none of the
       part that hit it. That is where a failed loop really goes — down onto
       the far side and out — and without it the ball fell straight through
       the boards. */
    function catchOnLoop(world, events) {
        var f = world.fall, L = f.loop, F = f.frame, b = world.ball;
        var fwd = (b.x - L.x) * F.fx + (b.z - L.z) * F.fz;
        var up = b.y - (f.base + L.R);
        if (fwd * fwd + up * up < L.R * L.R) return false;
        var th = Math.atan2(fwd, -up);
        if (th < 0) th += 2 * Math.PI;
        loopPoint(L, F, f.base, th, _lp);
        world.ride = { loop: L, frame: F, th: th, base: f.base,
            v: b.vx * _lp.tx + b.vy * _lp.ty + b.vz * _lp.tz };
        world.fall = null;
        events.bounce = true;
        placeOnLoop(world);
        return true;
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
        if (w.sails) millSail(w.sails, t, B);
        return B;
    }

    /* A windmill's sails: the fourth way a wall moves, and the first that
       turns in the *upright* plane. Four sails go round a hub in front of the
       mill door, and only one of them can ever reach the ground — the one
       nearest pointing straight down — so the box the ball meets is the foot
       of that one sail: a sail's width across, centred on its tip, starting
       at the tip and reaching a unit up. Which sail it is changes every
       quarter turn; the box does not care which.

       θ is the turn off straight down, and the renderer turns its sails by
       the same θ about the hub (render.addSails), so the tip the eye follows
       is the tip the ball meets. When that sail is down in front of the door
       the door is shut; a quarter turn later it is a gap between two sails
       with daylight under both. `vx` is the tip's own speed across the door,
       so a sail that comes down on a ball shoves it the way the sail is
       going, as a blade would. */
    function millSail(sl, t, B) {
        var q = Math.PI / 2, th = t * sl.speed + (sl.phase || 0);
        var phi = th - q * Math.round(th / q);
        B.cx = sl.hx + sl.len * Math.sin(phi);
        B.vx = sl.len * Math.cos(phi) * sl.speed;
        B.hw = sl.width / 2;
        B.yaw = 0; B.spin = 0;
        B.base = sl.hy - sl.len * Math.cos(phi);
        B.top = B.base + 1;
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
            ride: null,         // on a loop: { loop, frame, th, v, base }
            fall: null,         // off the top of one, and inside it
            loopFor: 0,         // seconds before a loop will take the ball again
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
            ride: w.ride ? { loop: w.ride.loop, frame: w.ride.frame, th: w.ride.th,
                v: w.ride.v, base: w.ride.base } : null,
            loopFor: w.loopFor || 0,
            fall: w.fall,
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
        world.ride = null;
        world.fall = null;
        world.loopFor = 0;
        world.firstLand = null;
        world.carry = 0;
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
            // A sail's own height is in the box rather than on the wall: the
            // wall is the whole disc the sails turn in, and the box is the one
            // sail that is down.
            if (w.sails && (b.y - C.BALL_R >= B.top || b.y + C.BALL_R <= B.base)) continue;
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
                var vy0 = b.vy;
                b.vx -= e * vn * nx;
                b.vy -= e * vn * ny;
                b.vz -= e * vn * nz;
                /* The lip is turf, not a steel edge. A fast ball crossing the
                   mouth is only a hair down when it meets the far side, so the
                   contact normal there is nearly straight up and a rigid
                   reflection turns most of the ball's pace into height: a
                   putt hit through the hole at speed went a unit and a half
                   into the air, over the rail and off the course. The grass
                   on the lip gives the way grass on a landing does — it keeps
                   a share of what it would have thrown upward (C.LIP_GIVE)
                   and no more — so a lip-out is a hop and a lost line, not a
                   launch. */
                if (b.vy > vy0 && b.vy > 0) b.vy = Math.max(vy0, 0) + (b.vy - Math.max(vy0, 0)) * C.LIP_GIVE;
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

    /* ── gravity wells ──

       A hole's `wells` ([{ x, z, pull, core }]) pull the ball towards them
       across the ground, in the air and on the floor alike — a black hole in
       the grid world, a gravity anomaly on the moon. The pull is
       pull / (d² + core²) towards the middle, softened by the core so it is
       finite everywhere; a ball that gets inside the core is gone (`out`, so
       the shot is replayed from where it was played, a stroke down). It is a
       horizontal force only: what holds the ball on the ground is still the
       ground, and gravity is still down. */
    var _well = { x: 0, z: 0 };
    function wellPull(hole, x, z) {
        _well.x = 0; _well.z = 0;
        var ws = hole.wells, i, w, dx, dz, q, k;
        if (!ws) return _well;
        for (i = 0; i < ws.length; i++) {
            w = ws[i];
            dx = w.x - x; dz = w.z - z;
            q = dx * dx + dz * dz;
            k = w.pull / ((q + w.core * w.core) * Math.sqrt(q + 1e-9));
            _well.x += k * dx; _well.z += k * dz;
        }
        return _well;
    }
    function swallowed(world, events) {
        var ws = world.hole.wells, b = world.ball, i, w;
        if (!ws) return false;
        for (i = 0; i < ws.length; i++) {
            w = ws[i];
            if ((b.x - w.x) * (b.x - w.x) + (b.z - w.z) * (b.z - w.z) < w.core * w.core) {
                b.vx = b.vy = b.vz = 0;
                world.out = true;
                world.swallowed = true;
                world.moving = false;
                events.out = true;
                events.swallowed = true;
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

    /* One stretch of v' = -a·v - c, from v0, for at most `t` seconds and never
       below `floor`. v(t) = (v0 + c/a)·e^(-at) - c/a, which holds for a
       negative `a` as well (the sitting-down stretch below can have one), and
       the straight line v0 - c·t when `a` is nothing. Writes the speed it
       ends on, the distance and the time into `out`. */
    function coast(v0, a, c, t, floor, out) {
        var T, q;
        if (Math.abs(a) < 1e-9) {
            T = c > 0 ? Math.min(t, (v0 - floor) / c) : t;
            out.v = v0 - c * T;
            out.cover = (v0 - 0.5 * c * T) * T;
        } else {
            q = c / a;
            T = (floor + q) * (v0 + q) > 0 && Math.abs(floor + q) > 1e-12 ?
                Math.log((v0 + q) / (floor + q)) / a : Infinity;
            T = Math.min(t, T >= 0 ? T : Infinity);
            var e = Math.exp(-a * T);
            out.v = (v0 + q) * e - q;
            out.cover = (v0 + q) * (1 - e) / a - q * T;
        }
        if (out.v < floor) out.v = floor;
        out.t = T;
        return out;
    }

    /* What one step of rolling does to a ball's ground speed on this surface:
       the drag, the rolling resistance, and below CONFIG.SIT the grass
       sitting the ball down. That last one is a rolling resistance that grows
       as the ball slows, from the surface's own c at sit·(1 - c/h) to the
       whole of its hold h = g·HOLD at a standstill, so the ground that will
       keep a stopped ball on a slope is the same ground that stops a slow one
       there — and still linear in v, so the step stays exact. Only on turf,
       which is the long game's (`hole.long`): mini golf's green is felt, and
       its putts are built to the pace they always had. Answers false when the
       surface has nothing to add to the pure drag. */
    var _seg = { v: 0, cover: 0, t: 0 };
    var _run = { v: 0, cover: 0 };
    function runOut(kind, grav, s0, dt, turf, out) {
        var a = -lnFrictionOf(kind), c = rollOf(kind), sit = turf ? sitOf(kind) : 0;
        var h = sit > 0 ? grav * holdOf(kind) : 0;
        var vx = h > c ? sit * (1 - c / h) : 0;       // where sitting down takes over
        if (c <= 0 && vx <= 0) return false;
        var v = s0, left = dt, cover = 0;
        if (v > vx) {
            coast(v, a, c, left, vx, _seg);
            v = _seg.v; cover += _seg.cover; left -= _seg.t;
        }
        if (left > 0 && vx > 0 && v > 0) {
            coast(v, a - h / sit, h, left, 0, _seg);
            v = _seg.v; cover += _seg.cover;
        }
        out.v = v > 0 ? v : 0;
        out.cover = cover;
        return true;
    }

    function substep(world, dt, events) {
        var b = world.ball, hole = world.hole;
        var grav = gravityOf(hole);
        world.time += dt;

        /* On a loop, the loop is the whole of the step: no ground under the
           ball, no walls (the track has kerbs of its own), no cup, and no
           question of being at rest — a ball that has stopped on a loop is
           about to run back down it. */
        if (world.ride) {
            rideLoop(world, dt, events);
            return;
        }
        if (world.grounded) world.fall = null;

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
                if (hole.wells) {
                    var wp = wellPull(hole, b.x, b.z);
                    b.vx += wp.x * dt;
                    b.vz += wp.z * dt;
                }

                var fr = frictionOf(pad.kind);
                var decay = Math.pow(fr, dt);
                var travel = (decay - 1) / lnFrictionOf(pad.kind);   // ∫₀^dt k^s ds

                /* Rolling resistance, the constant half of the drag (CONFIG.ROLL),
                   and the grass sitting the ball down as it slows (CONFIG.SIT).
                   Both keep the speed on v' = -a·v - c, which has an exact
                   solution, so the step stays as frame-rate independent as the
                   pure decay above; runOut has the arithmetic. decay and
                   travel are rewritten as the factors of v0 that this step
                   keeps and covers, so nothing below has to know. */
                var s0 = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
                if (s0 > 1e-9 && runOut(pad.kind, grav, s0, dt, !!hole.long, _run)) {
                    travel = _run.cover / s0;
                    decay = _run.v / s0;
                }
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
                    /* On the ground the ground is the height, so a grounded
                       ball has no vertical speed of its own. The cup's lip can
                       hand one a little as the ball grazes it, and kept, that
                       was counted by speedOf for ever: a ball sitting still
                       beside the hole, never slow enough to be at rest, until
                       the shot clock ran out. */
                    b.vy = 0;
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
            if (hole.wells) {
                var wa = wellPull(hole, b.x, b.z);
                b.vx += wa.x * dt;
                b.vz += wa.z * dt;
            }
            b.x += b.vx * dt;
            b.z += b.vz * dt;
            b.y += b.vy * dt;
            if (world.fall && catchOnLoop(world, events)) return;

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
                if (!world.firstLand) world.firstLand = { x: b.x, y: b.y, z: b.z };
                var impact = -b.vy;
                var kick = springKick(world, land.pad);
                if (kick) {
                    // A launch pad keeps the run on: it is a thing you cross
                    // on the way somewhere, not a thing you land in.
                    world.sprung++;
                    b.vy = kick;
                } else {
                    var lands = landingOf(land.pad.kind);
                    var grip = landGrip(lands.grip, Math.max(0, impact));
                    b.vx *= grip;
                    b.vz *= grip;
                    b.vy = impact * lands.bounce;
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

        // …and the loops, on the same terms: after the walls.
        if (world.loopFor > 0) world.loopFor -= dt;
        else if (hole.loops && takeLoop(world, events)) return;

        if (cupContact(world, events)) return;
        if (drown(world, events)) return;
        if (swallowed(world, events)) return;

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
                /* A well is a slope too, as far as holding the ball goes: its
                   pull over gravity is the gradient it is worth. */
                var wellSlope = 0;
                if (hole.wells) {
                    var wr = wellPull(hole, b.x, b.z);
                    wellSlope = Math.sqrt(wr.x * wr.x + wr.z * wr.z) / grav;
                }
                settled = (lie && !lie.pad.push &&
                        slopeAt(lie.pad, b.x, b.z) + wellSlope <= holdOf(lie.pad.kind)) ||
                    world.slowFor > C.STUCK;
            } else {
                settled = world.slowFor > C.SLOPE_SETTLE;
            }
            if (settled) {
                b.vx = b.vy = b.vz = 0;
                if (world.moving) events.rest = true;
                world.moving = false;
                world.carry = world.firstLand ? Math.hypot(world.firstLand.x - world.origin.x, world.firstLand.z - world.origin.z) : 0;
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
    function previewPath(world, yaw, power, loft, seconds, bite, spin) {
        var w = cloneWorld(world);
        if (!launch(w, yaw, power, loft, bite)) return [];
        // A shaped shot (swing.js) bends from the clubface on; launch() clears
        // the spin, so it goes on after, exactly as the game plays it.
        w.spin = spin || 0;
        var pts = [{ x: w.ball.x, y: w.ball.y, z: w.ball.z }];
        var steps = Math.ceil((seconds || 0.7) / C.SIM_DT);
        var grant = Math.ceil(steps * 0.6);
        var turn = -1, i, ev, p;
        for (i = 0; i < steps; i++) {
            ev = advance(w, C.SIM_DT, {});
            // A pipe is where the prediction stops. Carrying on would draw a
            // dotted line straight across the hole from one mouth to the
            // other, which is a picture of the ball travelling through ground
            // it never touches. A loop is the same, and for a better reason
            // still: a line drawn round it would say whether the shot makes
            // the top, which is the one thing the loop is asking you.
            if (ev.warp || ev.loop) break;
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
        mowEdge: mowEdge,
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
        wellPull: wellPull,
        rollOf: rollOf,
        sitOf: sitOf,
        landingOf: landingOf,
        holdOf: holdOf,
        gravityOf: gravityOf,
        padGrad: padGrad,
        slopeAt: slopeAt,
        outOfBounds: outOfBounds,
        fenceRects: fenceRects,
        warpUnder: warpUnder,
        loopFrame: loopFrame,
        loopPoint: loopPoint,
        loopBase: loopBase,
        springKick: springKick
    };

})(window.G3);
