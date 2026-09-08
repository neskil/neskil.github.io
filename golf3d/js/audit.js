/* The geometry audit: everything about a hole that is wrong in a picture and
   right in the data.

   tests.html can already say a hole is built to the rules — the cup is clear of
   its pad edge, no wall is thin enough to tunnel through, the bot can finish
   it. What it has never been able to say is whether the hole *looks* built:
   two pads that miss each other by a centimetre leave a crack in the floor and
   pass every assertion in the file, because nothing the ball does can find it.
   Eighty-four holes is far too many to check that by eye more than once, and
   "more than once" is the only kind of checking worth having.

   So this is the other half, and it is written to one rule: **every finding
   has to be something you would point at on a screenshot.** A rule that cannot
   be seen belongs in tests.html with the rest of the physics; a rule that can
   be seen but not measured belongs on the turntable, which is what
   turntable.html is for. This file is the overlap — seen *and* measured — and
   the two tools are meant to be read together, which is why the sheet prints
   these findings under each hole's row.

   No THREE, no DOM: this is data in, findings out, so tests.html can assert on
   it, turntable.html can caption with it and the inspector can lint with it.

     G3.audit.hole(hole)  -> [ { code, sev, msg, x, z } ]
     G3.audit.all()       -> the same, over every hole, tagged with the course

   `sev` is 'error' for something nobody would ship on purpose and 'warn' for
   something that is usually deliberate and occasionally a mistake. tests.html
   holds the courses to zero errors; the warnings are for a person to read. */
(function (G3) {
    'use strict';

    var P = G3.physics;

    /* How far apart two things have to be before it counts. All of them are in
       world units, and the ball is 0.16 across the radius, so:

         SEAM   a step the ball feels rather than rolls over. Under this two
                pads are level and any difference is float noise.
         CRACK  a gap between two pads that is too narrow to be a hole in the
                ground on purpose — the ball cannot fall down it, so it is not
                a hazard, it is a line of daylight in the floor.
         RAIL   `courses.enclose` builds no rail where the neighbouring ground
                is within 0.3, so a step taller than SEAM and shorter than this
                is a riser with nothing drawn on it. */
    var SEAM = 0.02;
    var CRACK = 0.08;
    var RAIL = 0.3;
    // A bunker cut out of `bands` sits DIP below the grass by design. That is
    // an authored lip, not a seam nobody meant, and it is the one step in the
    // file that is allowed to go unrailed.
    var DIP = 0.12;
    /* And how far a prop's collision box may stand over the ground beneath its
       downhill side before it reads as floating. It is generous because the
       drawn thing is not the box: `render.addRock` hangs its lumps a couple of
       tenths below the base and `addTree` sinks a trunk into it, so a box that
       clears the ground by a little is a stone still sitting in the grass. */
    var AFLOAT = 0.26;

    function isRect(p) { return !p.r; }

    function fmt(n) { return (Math.round(n * 1000) / 1000).toString(); }
    function at(x, z) { return '(' + (Math.round(x * 100) / 100) + ', ' + (Math.round(z * 100) / 100) + ')'; }

    /* The highest and lowest ground strictly under a footprint, and how many
       samples found any at all. "Strictly under" is the whole point: a rail
       stands just *outside* the pad it fences, so asking what is under a rail
       and getting nothing is the ordinary answer and not a finding. */
    function groundUnder(hole, x, z, w, d) {
        var hi = null, lo = null, n = 0, i, j, g;
        var sx = Math.max(0.15, w / 5), sz = Math.max(0.15, d / 5);
        for (i = x + 0.02; i <= x + w - 0.02 + 1e-9; i += sx) {
            for (j = z + 0.02; j <= z + d - 0.02 + 1e-9; j += sz) {
                g = P.surfaceTop(hole, i, j);
                if (!g) continue;
                n++;
                if (hi === null || g.y > hi) hi = g.y;
                if (lo === null || g.y < lo) lo = g.y;
            }
        }
        return { hi: hi, lo: lo, n: n };
    }

    /* ── the rules ──────────────────────────────────────────────────────── */

    /* Two pads that meet along an edge, and the step between them.

       Anything at or over RAIL gets a rail built on it by `enclose` and reads
       as the terrace it is. Anything under SEAM is level. In between is the
       bad case: a lip the ball trips over, drawn as a hairline where two slabs
       of the same green meet at slightly different heights. It is the single
       easiest thing to write by accident, because the two numbers that made it
       are in different rows of the file. */
    function seams(hole, out) {
        var pads = hole.pads, i, j;
        for (i = 0; i < pads.length; i++) {
            for (j = i + 1; j < pads.length; j++) {
                var a = pads[i], b = pads[j];
                if (!isRect(a) || !isRect(b)) continue;
                if (a.inlay || b.inlay) continue;     // an inlay is measured at its rim, in tests.html
                var edges = [];
                if (Math.abs(a.x + a.w - b.x) < 1e-6 || Math.abs(b.x + b.w - a.x) < 1e-6) {
                    edges.push(['x', Math.abs(a.x + a.w - b.x) < 1e-6 ? a.x + a.w : a.x,
                        Math.max(a.z, b.z), Math.min(a.z + a.d, b.z + b.d)]);
                }
                if (Math.abs(a.z + a.d - b.z) < 1e-6 || Math.abs(b.z + b.d - a.z) < 1e-6) {
                    edges.push(['z', Math.abs(a.z + a.d - b.z) < 1e-6 ? a.z + a.d : a.z,
                        Math.max(a.x, b.x), Math.min(a.x + a.w, b.x + b.w)]);
                }
                for (var e = 0; e < edges.length; e++) {
                    var axis = edges[e][0], on = edges[e][1], t0 = edges[e][2], t1 = edges[e][3];
                    if (t1 - t0 < 0.2) continue;      // corners touching, not an edge
                    var worst = 0, wx = 0, wz = 0, step = Math.min(0.25, (t1 - t0) / 4), t;
                    for (t = t0; t <= t1 + 1e-9; t += step) {
                        var x = axis === 'x' ? on : t, z = axis === 'x' ? t : on;
                        var dh = Math.abs(P.padHeight(a, x, z) - P.padHeight(b, x, z));
                        if (dh > worst) { worst = dh; wx = x; wz = z; }
                    }
                    var sandy = a.kind === 'sand' || b.kind === 'sand';
                    if (sandy && Math.abs(worst - DIP) < 0.02) continue;
                    if (worst > SEAM && worst < RAIL) {
                        out.push({
                            code: 'bare-step', sev: 'warn', x: wx, z: wz,
                            msg: a.kind + '/' + b.kind + ' meet at a ' + fmt(worst) +
                                ' step ' + at(wx, wz) + ', too small for a rail and too big to roll over'
                        });
                    }
                }
            }
        }
    }

    /* Two pads that all but meet. A gap the ball cannot fall through is not a
       hazard, it is a line of the surround showing through the floor — and
       from a plan view it is the most obvious thing on the hole. */
    function cracks(hole, out) {
        var pads = hole.pads, i, j;
        for (i = 0; i < pads.length; i++) {
            for (j = i + 1; j < pads.length; j++) {
                var a = pads[i], b = pads[j];
                if (!isRect(a) || !isRect(b)) continue;
                var gx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
                var gz = Math.max(b.z - (a.z + a.d), a.z - (b.z + b.d));
                var ovx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
                var ovz = Math.min(a.z + a.d, b.z + b.d) - Math.max(a.z, b.z);
                var gap = null, x = 0, z = 0;
                if (gx > 1e-6 && gx < CRACK && gz < 0 && ovz > 0.3) {
                    gap = gx;
                    x = a.x < b.x ? a.x + a.w + gx / 2 : b.x + b.w + gx / 2;
                    z = (Math.max(a.z, b.z) + Math.min(a.z + a.d, b.z + b.d)) / 2;
                } else if (gz > 1e-6 && gz < CRACK && gx < 0 && ovx > 0.3) {
                    gap = gz;
                    z = a.z < b.z ? a.z + a.d + gz / 2 : b.z + b.d + gz / 2;
                    x = (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2;
                }
                if (gap === null) continue;
                // Two floors at different levels are a step, and the gap
                // between them is hidden by the riser. Only level ground shows.
                if (Math.abs(P.padHeight(a, x, z) - P.padHeight(b, x, z)) > RAIL) continue;
                out.push({
                    code: 'crack', sev: 'error', x: x, z: z,
                    msg: 'a ' + fmt(gap) + ' gap between ' + a.kind + ' and ' + b.kind +
                        ' ' + at(x, z) + ' — daylight through the floor'
                });
            }
        }
    }

    /* Scenery has to be where it looks like it is. A tree or a rock is solid,
       so one buried in the ground is an obstacle the ball hits and the player
       cannot see, and one hanging over it is a boulder in mid-air. `build`
       seats anything without a `y` on the ground under its middle; this is
       what measures the result, over the whole footprint rather than at the
       one point the seating used. */
    function props(hole, out) {
        hole.walls.forEach(function (w) {
            if (w.kind !== 'tree' && w.kind !== 'rock') return;
            var cx = w.x + w.w / 2, cz = w.z + w.d / 2;
            var g = groundUnder(hole, w.x, w.z, w.w, w.d);
            if (!g.n) {
                out.push({
                    code: 'prop-adrift', sev: 'error', x: cx, z: cz,
                    msg: 'a ' + w.kind + ' ' + at(cx, cz) + ' stands on no ground at all'
                });
                return;
            }
            if (w.base + w.h < g.hi - SEAM) {
                out.push({
                    code: 'prop-sunk', sev: 'error', x: cx, z: cz,
                    msg: 'a ' + w.kind + ' ' + at(cx, cz) + ' is ' + fmt(g.hi - (w.base + w.h)) +
                        ' under the ground it stands on — solid, and invisible'
                });
            } else if (w.base > g.lo + AFLOAT) {
                out.push({
                    code: 'prop-afloat', sev: 'error', x: cx, z: cz,
                    msg: 'a ' + w.kind + ' ' + at(cx, cz) + ' floats ' + fmt(w.base - g.lo) +
                        ' over the ground under it'
                });
            }
        });
    }

    /* Two stones in the same place. `crags` scatters an outcrop on purpose and
       overlapping is what makes it read as one rather than as a row of
       cobbles — but two that overlap by most of themselves are one stone drawn
       twice, with the seam between them flickering wherever the two surfaces
       cross. Measured against the smaller of the two, so a boulder with a
       pebble at its foot is left alone. */
    function stones(hole, out) {
        var list = hole.walls.filter(function (w) { return w.kind === 'rock' || w.kind === 'tree'; });
        var i, j;
        for (i = 0; i < list.length; i++) {
            for (j = i + 1; j < list.length; j++) {
                var a = list[i], b = list[j];
                var ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
                var oz = Math.min(a.z + a.d, b.z + b.d) - Math.max(a.z, b.z);
                if (ox <= 0 || oz <= 0) continue;
                if (Math.min(a.base + a.h, b.base + b.h) - Math.max(a.base, b.base) <= 0) continue;
                var small = Math.min(a.w, a.d, b.w, b.d);
                var share = Math.min(ox, oz) / small;
                if (share < 0.62) continue;
                out.push({
                    code: 'stone-on-stone', sev: 'warn',
                    x: (a.x + a.w / 2), z: (a.z + a.d / 2),
                    msg: 'two ' + (a.kind === b.kind ? a.kind + 's' : a.kind + ' and ' + b.kind) +
                        ' ' + at(a.x + a.w / 2, a.z + a.d / 2) + ' share ' +
                        Math.round(share * 100) + '% of the smaller one'
                });
            }
        }
    }

    /* Water you cannot see, and water standing above its own bank. The first
       is a rectangle somebody left under the floor — dead data that still
       costs a shader; the second is a pond drawn over the grass beside it,
       which is the one water fault that is obvious from any angle. */
    function ponds(hole, out) {
        (hole.water || []).forEach(function (wr, i) {
            var over = 0, covered = 0, n = 0, x, z, s;
            var sx = Math.max(0.4, wr.w / 6), sz = Math.max(0.4, wr.d / 6);
            for (x = wr.x; x <= wr.x + wr.w + 1e-9; x += sx) {
                for (z = wr.z; z <= wr.z + wr.d + 1e-9; z += sz) {
                    n++;
                    s = P.surfaceTop(hole, x, z);
                    if (!s) continue;
                    covered++;
                    if (wr.y > s.y + 0.01) over++;
                }
            }
            if (n && covered === n) {
                out.push({
                    code: 'water-hidden', sev: 'warn', x: wr.x + wr.w / 2, z: wr.z + wr.d / 2,
                    msg: 'water #' + i + ' is roofed over by ground everywhere — none of it can be seen'
                });
            }
            if (over) {
                out.push({
                    code: 'water-over-land', sev: 'error', x: wr.x + wr.w / 2, z: wr.z + wr.d / 2,
                    msg: 'water #' + i + ' stands above the ground at ' + over + ' of ' + n + ' samples'
                });
            }
        });
    }

    /* A pad narrower than the ball. Nothing can stand on it, the renderer
       still draws a slab for it, and it is almost always the remains of an
       arithmetic slip in a row of `bands`. */
    function slivers(hole, out) {
        hole.pads.forEach(function (p, i) {
            var least = Math.min(p.w, p.d);
            if (least >= 0.32) return;
            out.push({
                code: 'sliver-pad', sev: 'error', x: p.x + p.w / 2, z: p.z + p.d / 2,
                msg: 'pad #' + i + ' (' + p.kind + ') is ' + fmt(p.w) + ' x ' + fmt(p.d) +
                    ' — narrower than the ball'
            });
        });
    }

    /* The same box twice. Two walls in one place draw two coincident faces,
       which flicker against each other from every angle, and the solver pays
       for both. */
    function twins(hole, out) {
        var seen = {}, i, w, k;
        for (i = 0; i < hole.walls.length; i++) {
            w = hole.walls[i];
            k = [w.x, w.z, w.w, w.d, w.h, w.base, w.yaw].join('|');
            if (seen[k] !== undefined) {
                out.push({
                    code: 'twin-wall', sev: 'warn', x: w.x + w.w / 2, z: w.z + w.d / 2,
                    msg: 'walls #' + seen[k] + ' and #' + i + ' are the same box ' +
                        at(w.x + w.w / 2, w.z + w.d / 2)
                });
            } else {
                seen[k] = i;
            }
        }
    }

    function hole(h) {
        var out = [];
        cracks(h, out);
        slivers(h, out);
        props(h, out);
        ponds(h, out);
        seams(h, out);
        stones(h, out);
        twins(h, out);
        return out;
    }

    function all() {
        var out = [];
        G3.COURSES.forEach(function (course) {
            course.holes.forEach(function (h) {
                hole(h).forEach(function (f) {
                    f.course = course.id;
                    f.hole = h.name;
                    out.push(f);
                });
            });
        });
        return out;
    }

    G3.audit = { hole: hole, all: all, SEAM: SEAM, CRACK: CRACK, RAIL: RAIL };

})(window.G3);
