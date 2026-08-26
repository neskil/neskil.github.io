/* Six courses of six holes, as data.

   A hole is a set of pads (the ground), a set of walls (things that bounce),
   a set of water rectangles (things that punish), a tee and a cup. Everything
   else — where the rails go, how high the cup sits, where the camera should
   look — is derived below, because a hole that has to repeat itself is a hole
   that will one day disagree with itself.

   Five of the six courses are mini golf. The last one, Ashdown Park, is the
   long game — tee, fairway, rough, sand, trees, green — and it is authored
   through `bands` and `tree` rather than a hole at a time; see the comment
   above them. It uses the same pads, the same walls and the same solver as
   everything else, which is the point: a parkland hole is not a different
   game, it is the same one written wider.

     pad     an axis-aligned patch of ground, flat or tilted. `kind` picks the
             friction: green (quickest), fairway (mown longer, so a driver
             runs about a fifth less), wood (bridges: slick), sand (a bunker
             eats a shot), rough. Pads do not overlap unless one is a bridge
             clearly above another.
     wall    a box with a base and a height. `yaw` turns it, `move` slides it
             on a sine, `spin` rotates it. A ball higher than the top flies
             over; a ball under the base rolls beneath.
     water   a rectangle with a surface height. There is no pad above it, so
             the ball falls in and splashes: one stroke, replay the shot.

   Rails are generated, not authored. `enclose()` walks the boundary of the
   pad union and puts a rail on every edge that does not have a neighbouring
   pad at the same height — so a hole is drawn by listing its floor, and the
   fences follow. Where a hole wants an open edge (a shoreline, a ledge, a
   drop) it lists a `gaps` rectangle and no rail is built inside it.

   Three rules a new hole has to respect, all asserted in tests.html rather
   than left to memory:

   - No wall thinner than 0.24 units. Substepping caps ball travel at half a
     radius (0.08) per step, which is what stops the ball tunnelling. A
     thinner wall is outside that guarantee.
   - A moving gate or a spinning blade must always leave a gap wider than the
     ball. It is easy to write an amplitude that seals the hole shut at one
     phase of the sine and only fails for players with bad timing; the bot in
     tests.html plays every hole with random timing and will not finish one
     that can be closed.
   - A hole flagged `needsLoft` has to stay unplayable along the floor. The
     bot replays those with the lofted clubs taken out of the bag and has to
     fail; a rail that shrinks or a step that flattens would otherwise quietly
     open a ground route and nobody would notice the hole had lost its point.
     Holes without the flag are free to have a flat answer, and several
     deliberately do. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;

    /* ── authoring helpers ──────────────────────────────────────────────── */

    function pad(x, z, w, d, y, kind, sx, sz) {
        return { x: x, z: z, w: w, d: d, y: y || 0, kind: kind || 'green', sx: sx || 0, sz: sz || 0 };
    }

    function wall(x, z, w, d, h, opts) {
        var o = opts || {};
        return {
            x: x, z: z, w: w, d: d, h: h === undefined ? 0.6 : h,
            base: o.base === undefined ? -0.4 : o.base,
            yaw: o.yaw || 0,
            move: o.move || null,
            spin: o.spin || 0,
            kind: o.kind || 'rail'
        };
    }

    // A blade or bat that turns about its own centre, authored the way you
    // think about it: middle, length, thickness.
    function spinner(cx, cz, len, thick, opts) {
        var o = opts || {};
        return wall(cx - len / 2, cz - thick / 2, len, thick, o.h || 0.6, {
            base: o.base === undefined ? -0.1 : o.base,
            spin: o.spin === undefined ? 1.6 : o.spin,
            yaw: o.yaw || 0,
            kind: 'blade'
        });
    }

    // A gate that slides back and forth on a sine.
    function slider(x, z, w, d, opts) {
        var o = opts || {};
        return wall(x, z, w, d, o.h || 0.6, {
            base: o.base === undefined ? -0.1 : o.base,
            move: { axis: o.axis || 'x', amp: o.amp, speed: o.speed, phase: o.phase || 0 },
            kind: 'gate'
        });
    }

    /* A bar held up off the ground on two posts, returned as the three walls it
       is made of. A rolling ball passes under the bar and a lofted one does
       not, which makes it the one obstacle in the game that punishes loft
       instead of rewarding it: the underside clears a resting ball's crown and
       the first hop after a chip, and the top is out of reach of the highest
       club in the bag. Put one in front of a green and the wedge becomes the
       wrong answer.

       The posts are real walls rather than scenery, for the same reason the
       blades are: a leg the ball passes through is a leg that lies about where
       the hole is. They also do the explaining. A bar hanging in mid-air reads
       as a wall from the tee however carefully it is lit — put it on two legs
       and it reads as a doorway, which is the one thing the player has to
       understand before taking the shot. Author them at the edges of the lane
       and they cost nothing to play through. */
    function beam(x, z, w, d, opts) {
        var o = opts || {};
        var base = o.base === undefined ? 0.55 : o.base;
        var h = o.h === undefined ? 1.35 : o.h;
        var t = o.post === undefined ? 0.28 : o.post;
        var flat = w >= d;                       // which way the bar runs
        function post(px, pz) {
            return wall(px, pz, flat ? t : w, flat ? d : t, base + 0.4,
                { base: -0.4, kind: 'beam' });
        }
        return [
            wall(x, z, w, d, h, { base: base, kind: 'beam' }),
            post(x, z),
            flat ? post(x + w - t, z) : post(x, z + d - t)
        ];
    }

    // Four walls round a rectangle: a pen with no door, so the only way in is
    // over the top. Authored as the outer footprint, like a wall.
    function pen(x, z, w, d, opts) {
        var o = opts || {};
        var t = o.t === undefined ? 0.30 : o.t;
        var b = { base: o.base === undefined ? -0.1 : o.base, kind: o.kind || 'rail' };
        var h = o.h === undefined ? 0.65 : o.h;
        return [
            wall(x, z, w, t, h, b),
            wall(x, z + d - t, w, t, h, b),
            wall(x, z + t, t, d - 2 * t, h, b),
            wall(x + w - t, z + t, t, d - 2 * t, h, b)
        ];
    }

    /* A funnel green: a flat floor, four ramps up to a rim, and four corners
       that are the two ramps beside them added together. That last part is the
       whole trick — a corner built as the sum of its neighbours meets both of
       them exactly, so the nine pads tile without a single step for the ball to
       stub its toe on, and the seams are invisible to the physics as well as
       the eye. Land anywhere inside and the ground does the rest.

       `outer` is the width of the whole dish, `flat` the floor in the middle
       (which is where the cup goes — the tests want the mouth of the cup a
       clear radius inside one pad, and a cup on a seam would not be), and
       `rise` how far the rim stands above the floor. */
    function bowl(cx, cz, outer, flat, rise) {
        var a = outer / 2, b = flat / 2, run = a - b, k = rise / run;
        function q(x, z, w, d, y, sx, sz) { return pad(x, z, w, d, y, 'green', sx, sz); }
        return [
            q(cx - b, cz - b, flat, flat, 0, 0, 0),               // the floor
            q(cx - a, cz - b, run, flat, rise, -k, 0),            // west ramp
            q(cx + b, cz - b, run, flat, 0, k, 0),                // east ramp
            q(cx - b, cz - a, flat, run, rise, 0, -k),            // south ramp
            q(cx - b, cz + b, flat, run, 0, 0, k),                // north ramp
            q(cx - a, cz - a, run, run, 2 * rise, -k, -k),        // and the corners
            q(cx + b, cz - a, run, run, rise, k, -k),
            q(cx - a, cz + b, run, run, rise, -k, k),
            q(cx + b, cz + b, run, run, 0, k, k)
        ];
    }

    /* ── the long game ──────────────────────────────────────────────────

       Everything above is mini golf: a lane, a rail, an obstacle in the middle
       of it. The parkland course at the bottom of this file is not, and it is
       authored differently, because a full-size hole is not a lane — it is a
       stack of strips running from the tee up to the green, and the interest
       is in which strip you land on.

       `bands` lays them out. A row is a depth followed by cells laid west to
       east from x = 0: [width, kind] and, for a bunker, [width, kind, y]. A
       null kind leaves a hole in the ground, which is where a lake goes — the
       water rectangle goes under it and the shoreline into `gaps`, exactly as
       on the older holes.

       Two things fall out of this for free. Cells of different kinds at the
       same height are neighbours, so `enclose` puts no rail between a fairway
       and its rough: the only rails a parkland hole gets are the ones around
       the outside of the whole property, which is what the boundary fence of a
       real course is. And a bunker sitting a hand's breadth below the grass is
       a step the ball can roll into and — just — climb back out of, because
       DIP is inside CONFIG.STEP_UP. Any deeper and a bunker would be a well. */
    var DIP = -0.12;

    function bands(z0, rows) {
        var pads = [], z = z0, i, j, row, c, x;
        for (i = 0; i < rows.length; i++) {
            row = rows[i];
            x = 0;
            for (j = 1; j < row.length; j++) {
                c = row[j];
                if (c[1]) pads.push(pad(x, z, c[0], row[0], c[2] || 0, c[1]));
                x += c[0];
            }
            z += row[0];
        }
        return merge(pads);
    }

    /* Bands are how a hole is *written*; they are not how it should be drawn.
       Eight rows of a course that is rough down the left the whole way is
       eight identical strips of rough, and each one costs a slab, a stack of
       grass shells and a walk round its own boundary. So the rows are glued
       back together afterwards: two pads of the same kind, the same width and
       the same height, one ending where the other begins, are one pad.

       This is invisible everywhere else. The seam it removes was a seam the
       physics could not feel and the eye could not see — the surfaces tile in
       world space — and `enclose` gives exactly the same rails either way,
       because it already refused to fence an edge with a neighbour behind it. */
    function merge(pads) {
        var changed = true, i, j, a, b;
        while (changed) {
            changed = false;
            for (i = 0; i < pads.length && !changed; i++) {
                for (j = i + 1; j < pads.length && !changed; j++) {
                    a = pads[i]; b = pads[j];
                    if (a.kind !== b.kind || a.x !== b.x || a.w !== b.w || a.y !== b.y) continue;
                    if (a.sx || a.sz || b.sx || b.sz) continue;
                    if (Math.abs(a.z + a.d - b.z) > 1e-9 && Math.abs(b.z + b.d - a.z) > 1e-9) continue;
                    a.d += b.d;
                    a.z = Math.min(a.z, b.z);
                    pads.splice(j, 1);
                    changed = true;
                }
            }
        }
        return pads;
    }

    /* A tree, authored by its middle the way you would point at one.

       The solid part is the trunk and only the trunk. That is not a shortcut:
       nothing in the bag lifts a ball much above a metre and a half — the
       wedge tops out at about 1.6 — so a tree is a thing you go *round*, and
       making the canopy solid as well would only mean the ball stopping in
       mid-air. The trunk is well over the 0.24 the substepping guarantees, and
       the renderer puts the canopy on top of it. */
    function tree(cx, cz, opts) {
        var o = opts || {};
        var t = o.t === undefined ? 0.62 : o.t;
        return wall(cx - t / 2, cz - t / 2, t, t, o.h === undefined ? 2.4 : o.h,
            { base: -0.4, kind: 'tree' });
    }

    // A stand of them along a line. A treeline is never one tree.
    function treeline(x0, z0, x1, z1, n, opts) {
        var out = [], i, f;
        for (i = 0; i < n; i++) {
            f = n === 1 ? 0.5 : i / (n - 1);
            out.push(tree(x0 + (x1 - x0) * f, z0 + (z1 - z0) * f, opts));
        }
        return out;
    }

    function rect(x, z, w, d, y) { return { x: x, z: z, w: w, d: d, y: y === undefined ? -0.6 : y }; }

    /* ── rail generation ────────────────────────────────────────────────── */

    var RAIL_T = 0.30;          // thickness — comfortably over the tunnelling floor
    var RAIL_H = 0.45;          // …and height, about three ball radii of kerb
    var STEP = 0.25;            // boundary sampling resolution
    var PROBE = 0.12;           // how far outside the edge we look for a neighbour

    function heightAt(pads, x, z, skip) {
        var best = null, i, h;
        for (i = 0; i < pads.length; i++) {
            if (pads[i] === skip) continue;
            if (!G3.physics.padContains(pads[i], x, z)) continue;
            h = G3.physics.padHeight(pads[i], x, z);
            if (best === null || h > best) best = h;
        }
        return best;
    }

    function inAny(rects, x, z) {
        var i;
        for (i = 0; i < (rects || []).length; i++) {
            if (x >= rects[i].x && x <= rects[i].x + rects[i].w &&
                z >= rects[i].z && z <= rects[i].z + rects[i].d) return true;
        }
        return false;
    }

    /* Walk one edge of one pad, emit a rail wherever the ground simply stops.
       Contiguous samples merge into a single wall so a straight boundary is
       one box and not forty. */
    function edgeRails(pads, p, side, gaps, out) {
        var along = (side === 'n' || side === 's') ? p.w : p.d;
        var n = Math.max(1, Math.round(along / STEP));
        var step = along / n;
        var run = null, i, t0, t1, mid, px, pz, ex, ez, hHere, hOut, open;

        for (i = 0; i < n; i++) {
            t0 = i * step; t1 = t0 + step; mid = (t0 + t1) / 2;

            if (side === 's') { ex = p.x + mid; ez = p.z; px = ex; pz = p.z - PROBE; }
            else if (side === 'n') { ex = p.x + mid; ez = p.z + p.d; px = ex; pz = ez + PROBE; }
            else if (side === 'w') { ex = p.x; ez = p.z + mid; px = p.x - PROBE; pz = ez; }
            else { ex = p.x + p.w; ez = p.z + mid; px = ex + PROBE; pz = ez; }

            hHere = G3.physics.padHeight(p, ex, ez);
            hOut = heightAt(pads, px, pz, p);
            // A neighbour at roughly the same height means the ground carries
            // on and no rail belongs here. A neighbour far below is a drop the
            // hole presumably meant, so it gets a rail unless it is in a gap.
            open = hOut !== null && Math.abs(hOut - hHere) < 0.3;
            if (!open && inAny(gaps, ex, ez)) open = true;

            if (open) {
                if (run) { out.push(railFor(p, side, run, pads)); run = null; }
            } else if (run) {
                run.t1 = t1; run.hi = Math.max(run.hi, hHere); run.lo = Math.min(run.lo, hHere);
            } else {
                run = { t0: t0, t1: t1, hi: hHere, lo: hHere };
            }
        }
        if (run) out.push(railFor(p, side, run, pads));
    }

    function railFor(p, side, run, pads) {
        // Overhang the ends by a thickness so corners meet and seal. Walls are
        // allowed to overlap; the solver resolves them one at a time.
        var a = run.t0 - RAIL_T, b = run.t1 + RAIL_T;
        var base = run.lo - 0.35;
        var h = (run.hi - run.lo) + RAIL_H + 0.35;
        if (side === 's') return wall(p.x + a, p.z - RAIL_T, b - a, RAIL_T, h, { base: base });
        if (side === 'n') return wall(p.x + a, p.z + p.d, b - a, RAIL_T, h, { base: base });
        if (side === 'w') return wall(p.x - RAIL_T, p.z + a, RAIL_T, b - a, h, { base: base });
        return wall(p.x + p.w, p.z + a, RAIL_T, b - a, h, { base: base });
    }

    function enclose(pads, gaps) {
        var out = [], i;
        for (i = 0; i < pads.length; i++) {
            edgeRails(pads, pads[i], 's', gaps, out);
            edgeRails(pads, pads[i], 'n', gaps, out);
            edgeRails(pads, pads[i], 'w', gaps, out);
            edgeRails(pads, pads[i], 'e', gaps, out);
        }
        return out;
    }

    function grow(r, m) {
        return { x: r.x - m, z: r.z - m, w: r.w + 2 * m, d: r.d + 2 * m };
    }

    // Shorelines want to be open: a rail along the water's edge would turn a
    // pond into a bumper.
    function shore(r, m) { return grow(r, m === undefined ? 0.45 : m); }

    /* And so does a ledge you are meant to be able to fall off. A pad standing
       proud of its neighbour gets a rail on both sides of the step by default,
       and on a tabletop green that rail is the difference between "land it up
       there" and "bounce it off the kerb and hope". Hand the same rectangle to
       `brink` and the step is left bare. */
    function brink(r, m) { return grow(r, m === undefined ? 0.35 : m); }

    /* ── hole assembly ──────────────────────────────────────────────────── */

    function build(h) {
        var P = G3.physics;
        h.water = h.water || [];
        h.walls = enclose(h.pads, h.gaps || []).concat(h.extra || []);

        var t = P.surfaceTop(h, h.tee.x, h.tee.z);
        var c = P.surfaceTop(h, h.cup.x, h.cup.z);
        h.tee.y = t ? t.y : 0;
        h.cup.y = c ? c.y : 0;

        var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, i, p;
        for (i = 0; i < h.pads.length; i++) {
            p = h.pads[i];
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x + p.w);
            minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z + p.d);
        }
        h.bounds = { minX: minX, maxX: maxX, minZ: minZ, maxZ: maxZ };
        return h;
    }

    /* ── course one: Seaside Green ──────────────────────────────────────── */

    var seaside = [
        build({
            name: 'Sea Legs', par: 3,
            blurb: 'Right, then left, then in. Find your pace before the sea does.',
            pads: [pad(0, 0, 6, 15)],
            extra: [
                wall(-0.2, 5.4, 3.6, 0.35, 0.55, { base: -0.1 }),
                wall(2.6, 9.4, 3.6, 0.35, 0.55, { base: -0.1 })
            ],
            tee: { x: 4.4, z: 1.6 }, cup: { x: 1.6, z: 13 }
        }),
        build({
            name: 'The Bend', par: 3,
            blurb: 'Left turn at the top. The corner rail is your friend.',
            pads: [pad(0, 0, 4.5, 9), pad(0, 9, 13, 4.5)],
            tee: { x: 2.25, z: 1.5 }, cup: { x: 11.5, z: 11.25 }
        }),
        build({
            name: 'Low Tide', par: 3,
            blurb: 'The bridge is the safe way. Loft is the short way.',
            pads: [pad(0, 0, 5, 5), pad(3.5, 5, 1.5, 4, 0, 'wood'), pad(0, 9, 5, 6)],
            water: [rect(0, 5, 3.5, 4, -0.55)],
            gaps: [shore(rect(0, 5, 3.5, 4))],
            tee: { x: 1.6, z: 2 }, cup: { x: 2.3, z: 12.5 }
        }),
        build({
            name: 'Sandbar', par: 3,
            blurb: 'A lane of grass through the beach. Or take the sand and suffer.',
            pads: [
                pad(0, 0, 6, 5),
                pad(0, 5, 4.5, 2.5, 0, 'sand'), pad(4.5, 5, 1.5, 2.5),
                pad(0, 7.5, 6, 7.5)
            ],
            tee: { x: 3, z: 2 }, cup: { x: 1.8, z: 13 }
        }),
        build({
            name: 'The Break', par: 3,
            blurb: 'The whole green leans east. Aim at nothing you can see.',
            pads: [pad(0, 0, 7, 14, 0.85, 'green', -0.12, 0)],
            tee: { x: 1.2, z: 1.6 }, cup: { x: 5.4, z: 11.5 }
        }),
        build({
            name: 'The Jetty', par: 3,
            blurb: 'A plank over the shallows. Nothing to bounce off but nerve.',
            pads: [
                pad(0, 0, 6, 6),
                pad(2.2, 6, 1.7, 5, 0, 'wood'),
                pad(0, 11, 6, 5)
            ],
            water: [rect(-1, 6, 8, 5, -0.7)],
            gaps: [shore(rect(-1, 6, 8, 5), 0.6)],
            tee: { x: 3, z: 2 }, cup: { x: 3, z: 13.5 }
        })
    ];

    /* ── course two: Quarry Ridge ───────────────────────────────────────── */

    var quarry = [
        build({
            name: 'Step Up', par: 3,
            blurb: 'Hit it up the ramp. Half measures roll back to you.',
            pads: [
                pad(0, 0, 6, 5),
                pad(0, 5, 6, 3, 0, 'green', 0, 0.3),
                pad(0, 8, 6, 6, 0.9)
            ],
            tee: { x: 3, z: 1.5 }, cup: { x: 3, z: 12 }
        }),
        build({
            name: 'The Drop', par: 3,
            blurb: 'Over the edge and down. Too gentle and you are swimming.',
            pads: [pad(0, 0, 5, 4, 3), pad(0, 6, 8, 8)],
            water: [rect(-2, 4, 12, 2, -0.9)],
            gaps: [shore(rect(-2, 4, 12, 2), 0.6)],
            tee: { x: 2.5, z: 1.5 }, cup: { x: 4.5, z: 11 }
        }),
        build({
            name: 'Switchback', par: 4,
            blurb: 'Up the ramp, hard left, and try not to come back down.',
            pads: [
                pad(0, 0, 4, 10),
                pad(0, 10, 4, 4, 0, 'green', 0, 0.3),
                pad(0, 14, 10, 4, 1.2)
            ],
            tee: { x: 2, z: 1.5 }, cup: { x: 8.4, z: 16 }
        }),
        build({
            name: 'The Ledge', par: 3,
            blurb: 'A metre and a half of quarry road with a long way down either side.',
            pads: [
                pad(0, 0, 5, 4, 1),
                pad(1.6, 4, 1.8, 7, 1),
                pad(0, 11, 6, 5, 1)
            ],
            water: [rect(-4, 4, 14, 7, -1.2)],
            gaps: [shore(rect(-4, 4, 14, 7), 0.6)],
            tee: { x: 2.5, z: 1.5 }, cup: { x: 3, z: 13.5 }
        }),
        build({
            name: 'Halfpipe', par: 3,
            blurb: 'The gutter is blocked halfway. Ride a bank round it.',
            pads: [
                pad(0, 0, 2.5, 15, 1.25, 'green', -0.5, 0),
                pad(2.5, 0, 2, 15),
                pad(4.5, 0, 2.5, 15, 0, 'green', 0.5, 0)
            ],
            extra: [wall(2.5, 7.6, 2, 0.4, 0.55, { base: -0.1 })],
            tee: { x: 3.5, z: 1.5 }, cup: { x: 3.5, z: 13 }
        }),
        build({
            name: 'The Cannon', par: 3,
            blurb: 'The ramp is not a suggestion. Hit it flat out and fly the gap.',
            pads: [
                pad(0, 0, 6, 4),
                pad(1.2, 4, 3.6, 2.5, 0, 'wood', 0, 0.45),
                pad(0, 9.5, 7, 7)
            ],
            water: [rect(-3, 6.5, 14, 3, -0.9)],
            gaps: [shore(rect(-3, 6.5, 14, 3), 0.7)],
            tee: { x: 3, z: 1.5 }, cup: { x: 3.5, z: 12.6 }
        })
    ];

    /* ── course three: Windmill Works ───────────────────────────────────── */

    var works = [
        build({
            name: 'First Gear', par: 3,
            blurb: 'One gate, one gap, and it does not wait for you.',
            pads: [pad(0, 0, 6, 14)],
            extra: [
                wall(0, 6.8, 1.5, 0.4, 0.6, { base: -0.1 }),
                wall(4.5, 6.8, 1.5, 0.4, 0.6, { base: -0.1 }),
                slider(1.6, 6.8, 1.4, 0.4, { amp: 0.75, speed: 1.6 })
            ],
            tee: { x: 3, z: 1.6 }, cup: { x: 3, z: 12 }
        }),
        build({
            name: 'The Mill', par: 3,
            blurb: 'Sixty centimetres of daylight on either side of the blade. Pick one.',
            pads: [pad(0, 0, 5, 15)],
            extra: [spinner(2.5, 8, 3.6, 0.4, { spin: 1.7 })],
            tee: { x: 2.5, z: 1.6 }, cup: { x: 2.5, z: 13 }
        }),
        build({
            name: 'Double Doors', par: 3,
            blurb: 'Two gates, out of step on purpose.',
            pads: [pad(0, 0, 6, 16)],
            extra: [
                wall(0, 5, 1.4, 0.4, 0.6, { base: -0.1 }),
                wall(4.6, 5, 1.4, 0.4, 0.6, { base: -0.1 }),
                slider(1.5, 5, 1.5, 0.4, { amp: 0.8, speed: 1.5 }),
                wall(0, 10.5, 1.4, 0.4, 0.6, { base: -0.1 }),
                wall(4.6, 10.5, 1.4, 0.4, 0.6, { base: -0.1 }),
                slider(1.5, 10.5, 1.5, 0.4, { amp: 0.8, speed: 1.9, phase: Math.PI })
            ],
            tee: { x: 3, z: 1.5 }, cup: { x: 3, z: 14 }
        }),
        build({
            name: 'Turnstile', par: 4,
            blurb: 'Two blades and a bunker between them. Patience beats power.',
            pads: [
                pad(0, 0, 5, 6),
                pad(0, 6, 5, 3, 0, 'sand'),
                pad(0, 9, 5, 8)
            ],
            extra: [
                spinner(2.5, 4, 3.4, 0.4, { spin: -1.5 }),
                spinner(2.5, 11.5, 3.4, 0.4, { spin: 2.1 })
            ],
            tee: { x: 2.5, z: 1.4 }, cup: { x: 2.5, z: 15 }
        }),
        build({
            name: 'The Sweeper', par: 3,
            blurb: 'The bar runs the length of the floor. Do not be under it.',
            pads: [pad(0, 0, 7, 15)],
            extra: [
                slider(0.4, 7, 6.2, 0.4, { axis: 'z', amp: 3.2, speed: 1.1 })
            ],
            tee: { x: 3.5, z: 1.5 }, cup: { x: 5.4, z: 13 }
        }),
        build({
            name: 'Grand Finale', par: 4,
            blurb: 'Ramp, blade, water, green. In that order, if you please.',
            pads: [
                pad(0, 0, 6, 6),
                pad(0, 6, 6, 2.5, 0, 'wood', 0, 0.4),
                pad(0, 8.5, 6, 4, 1),
                pad(0, 16, 8, 6)
            ],
            water: [rect(-3, 12.5, 14, 3.5, -0.9)],
            gaps: [shore(rect(-3, 12.5, 14, 3.5), 0.7)],
            extra: [spinner(3, 10.5, 3.6, 0.4, { spin: 1.9, base: 0.9 })],
            tee: { x: 3, z: 1.5 }, cup: { x: 4, z: 19.5 }
        })
    ];

    /* ── course four: Tidewater Reach ───────────────────────────────────

       The loft course. Every hole here is built round the one thing a chip can
       do that a putt cannot — leave the ground — and each asks for it in a
       different way: carry it, drop it, land it on top of something, or (once,
       on purpose) resist the urge and keep it down. Almost nothing on this
       course can be reached along the floor, so the bag stops being a choice of
       how hard and becomes a choice of how high. */

    var tidewater = [
        build({
            name: 'Stepping Stones', par: 3, needsLoft: true,
            blurb: 'Two carries, three islands. There is no way round the water.',
            pads: [
                pad(0, 0, 5.5, 4.5),
                pad(1.2, 7, 3.4, 3.4),
                pad(0, 13.5, 6, 5.5)
            ],
            water: [rect(-4, 4.5, 14, 9, -0.7)],
            tee: { x: 2.75, z: 1.8 }, cup: { x: 3, z: 16.5 }
        }),
        build({
            name: 'Short Side', par: 3, needsLoft: true,
            blurb: 'Sand at the front, a kerb on the green, two metres behind the pin.',
            pads: [
                pad(0, 0, 6, 6),
                pad(0, 6, 6, 3, 0, 'sand'),
                pad(0, 9, 6, 3.6, 0, 'green', 0, 0.16)
            ],
            extra: [wall(-0.1, 8.75, 6.2, 0.3, 0.55, { base: -0.1 })],
            tee: { x: 3, z: 3.6 }, cup: { x: 3, z: 10.4 }
        }),
        build({
            name: 'The Letterbox', par: 3, needsLoft: true,
            blurb: 'Four walls and no door. Post it through the top.',
            pads: [pad(0, 0, 7, 13)],
            extra: pen(1.8, 6.5, 3.8, 3.8, { h: 0.6 }),
            tee: { x: 3.5, z: 1.6 }, cup: { x: 3.7, z: 8.4 }
        }),
        build({
            name: 'Tabletop', par: 3, needsLoft: true,
            blurb: 'The green is a metre up with nothing to run up. Land it or swim.',
            pads: [
                pad(0, 0, 6, 5.5),
                /* The apron runs under the table rather than up to it — pads
                   are allowed to overlap when one is clearly above the other,
                   which is the same rule that makes a bridge work. It turns a
                   missed wedge from a swim into a chip, and it is the reason
                   this hole is hard rather than cruel. */
                pad(0.2, 7.6, 6.6, 7.4),
                pad(1.2, 9, 4.6, 4.6, 0.9)
            ],
            water: [rect(-4, 5.5, 14, 9, -0.7)],
            gaps: [
                { x: 0.05, z: 5.1, w: 5.9, d: 0.8 },       // the tee's own shoreline
                { x: 0.6, z: 8.5, w: 5.8, d: 1.0 }         // …and the front of the table
            ],
            tee: { x: 3, z: 4.2 }, cup: { x: 3.5, z: 11.6 }
        }),
        build({
            name: 'Under the Boardwalk', par: 4,
            blurb: 'Too tall to fly, and it stands high enough that a putt runs under. Land it short.',
            pads: [
                pad(0, 0, 6, 5),
                pad(0, 5, 6, 2.6, 0, 'sand'),
                pad(0, 7.6, 6, 9)
            ],
            /* The bar stops short of the rails on both sides. Partly so there
               is a second way through for anyone who would rather thread a
               gap than trust the run-out, and partly for the camera: a bar
               this tall spanning the whole fairway hides the flag and half the
               hole behind it from the tee, and a hole you cannot see is not a
               hole you can plan. */
            extra: beam(0.75, 11.2, 4.5, 0.5),
            tee: { x: 3, z: 1.6 }, cup: { x: 3, z: 14.5 }
        }),
        build({
            name: 'The Reach', par: 4, needsLoft: true,
            blurb: 'Out to the rock, then into the crater. It gathers what it catches.',
            pads: [
                pad(0, 0, 6, 5),
                pad(0.8, 7.5, 4.4, 4.4)
            ].concat(bowl(3, 18.6, 7.2, 2.2, 0.5)),
            water: [rect(-5, 5, 16, 18, -0.7)],
            tee: { x: 3, z: 1.8 }, cup: { x: 3, z: 18.6 }
        })
    ];

    /* ── course five: Highland Steps ─────────────────────────────────────

       The same lesson from the other side. Tidewater asks you to fly things
       that are missing; Highland asks you to fly things that are in the way,
       and hands the ground back as a tool: a bank to throw the ball at, a ramp
       that stops short of the summit, a shelf worth the climb. Three of the six
       cannot be finished any other way than through the air. The other three
       keep a route along the floor on purpose — a course where every shot is
       the same shot is not varied, it is uniform. */

    var highland = [
        build({
            name: 'Stairway', par: 4, needsLoft: true,
            blurb: 'Three steps, no ramp. Loft is the only way up a wall you cannot climb.',
            pads: [
                pad(0, 0, 5.5, 4.2),
                pad(0, 4.2, 5.5, 3.4, 0.4),
                pad(0, 7.6, 5.5, 3.4, 0.8),
                pad(0, 11, 5.5, 4.6, 1.15)
            ],
            /* One strip per riser, each stopping just short of the side rails.
               A gap wide enough to reach x = 0 opens the *side* of the hole as
               well as the step, and the ball then quietly falls off the hill
               at three specific heights. */
            gaps: [
                { x: 0.05, z: 3.8, w: 5.4, d: 0.8 },
                { x: 0.05, z: 7.2, w: 5.4, d: 0.8 },
                { x: 0.05, z: 10.6, w: 5.4, d: 0.8 }
            ],
            tee: { x: 2.75, z: 1.5 }, cup: { x: 2.75, z: 13.2 }
        }),
        build({
            name: 'The Backboard', par: 3,
            blurb: 'The front door is bricked up. Throw it at the hill and let the hill hand it back.',
            pads: [
                pad(0, 0, 6, 8),
                pad(0, 8, 6, 3.4),                              // the shelf, and the pin
                pad(0, 11.4, 6, 2.6, 0, 'green', 0, 0.42)       // the hill behind it
            ],
            extra: [wall(0.9, 9.4, 4.2, 0.32, 0.62, { base: -0.1 })],
            tee: { x: 3, z: 3.4 }, cup: { x: 3, z: 10.6 }
        }),
        build({
            name: 'Over the Top', par: 3, needsLoft: true,
            blurb: 'Nothing goes round it and one club in the bag goes over it.',
            pads: [
                pad(0, 0, 6, 7),
                pad(0, 7, 6, 5.5, 0, 'green', 0, 0.08),   // and it climbs on the far side
                pad(0, 12.5, 6, 2.5, 0, 'sand')           // no reward for over-clubbing it
            ],
            extra: [wall(-0.2, 5, 6.4, 0.4, 1.0, { base: -0.1 })],
            tee: { x: 3, z: 1.8 }, cup: { x: 3, z: 11.2 }
        }),
        build({
            name: 'The Gorge', par: 3,
            blurb: 'Three metres of nothing, and a green that leans away east.',
            pads: [
                pad(0, 0, 6, 6.4),
                pad(0, 9.7, 6.5, 7.3, 0, 'green', 0.10, 0)
            ],
            water: [rect(-3, 6.4, 12, 3.3, -2.4)],
            gaps: [shore(rect(-3, 6.4, 12, 3.3), 0.6)],
            tee: { x: 3, z: 4.2 }, cup: { x: 4.6, z: 13 }
        }),
        build({
            name: 'Two Roads', par: 4,
            blurb: 'The low road goes under the bar. The high road wants a chip first.',
            pads: [
                pad(0, 0, 6, 5),
                pad(0, 5, 3, 9),
                pad(3, 5, 3, 9, 0.5),
                pad(0, 14, 6, 5)
            ],
            gaps: [
                { x: 2.5, z: 4.6, w: 1, d: 9.8 },          // the step between the roads
                { x: 2.5, z: 4.6, w: 3.4, d: 0.9 },        // the face you chip up on to
                { x: 0.05, z: 13.6, w: 5.9, d: 0.8 }       // and the drop off the far end
            ],
            extra: beam(-0.3, 9, 3.2, 0.5),
            tee: { x: 1.4, z: 1.6 }, cup: { x: 3, z: 16.5 }
        }),
        build({
            name: 'Crown', par: 4, needsLoft: true,
            blurb: 'The ramp gets you to the shoulder. The last half metre is yours to fly.',
            pads: [
                pad(0, 0, 6, 5),
                pad(0, 5, 6, 3, 0, 'green', 0, 0.28),
                /* The shoulder keeps climbing, gently. A ball that crests the
                   ramp runs out of steam on it and rolls back a metre or two,
                   which is the room the chip up to the summit needs — parked
                   against the face there is no shot at all. */
                pad(0, 8, 7, 4, 0.84, 'green', 0, 0.03),
                pad(1, 12, 5, 5, 1.4)
            ],
            water: [rect(-3, 11.6, 13, 10, -2.3)],
            gaps: [brink({ x: 1, z: 12, w: 5, d: 5 }, 0.4)],
            tee: { x: 3, z: 1.6 }, cup: { x: 3.5, z: 14.4 }
        })
    ];

    /* ── course six: Ashdown Park ────────────────────────────────────────

       Not mini golf. Six holes of the long game at the same scale as the rest
       of the bag: a driver runs about twenty-one units off a fairway and about
       fifteen out of rough, so a par 4 here is a drive and an approach and a
       par 5 is three shots, which is the only definition of par that means
       anything.

       The vocabulary is the whole point of the course. Fairway is quick, rough
       is not, sand is where the shot goes to die, and the trees are solid. Miss
       the short grass and you do not lose the ball — you lose the club you
       wanted to hit next. */

    var rgh = 'rough', fwy = 'fairway', snd = 'sand', grn = 'green';

    var parkland = [
        build({
            name: 'Opening Drive', par: 4,
            blurb: 'Straight away, then a bunker exactly where the flag is. Pick a side.',
            pads: bands(0, [
                [5,  [3.5, rgh], [8, fwy], [7.5, rgh]],
                [11, [3.5, rgh], [8, fwy], [7.5, rgh]],
                [6,  [4.5, rgh], [9, fwy], [5.5, rgh]],
                [4,  [7, rgh], [9, fwy], [3, rgh]],
                [3,  [7, rgh], [2, fwy], [3.5, snd, DIP], [3.5, fwy], [3, rgh]],
                [9,  [6, rgh], [10, grn], [3, rgh]],
                [3,  [19, rgh]]
            ]),
            extra: [].concat(
                treeline(1.7, 8, 1.7, 24, 5),
                treeline(17.3, 24, 17.3, 34, 3)
            ),
            tee: { x: 7.5, z: 2.5 }, cup: { x: 11.5, z: 33.5 }
        }),
        build({
            name: 'Over the Water', par: 3,
            blurb: 'The pond is on the line to the pin. The dry way in is from the right.',
            pads: bands(0, [
                [4,   [3, rgh], [8, fwy], [3, rgh]],
                [4,   [2, rgh], [6.8, null], [2.2, fwy], [3, rgh]],
                [3,   [2, rgh], [2.5, snd, DIP], [7.5, grn], [2, rgh]],
                [7,   [2, rgh], [10, grn], [2, rgh]],
                [4,   [14, rgh]]
            ]),
            water: [rect(2, 4, 6.8, 4, -0.55)],
            gaps: [shore(rect(2, 4, 6.8, 4))],
            tee: { x: 9.5, z: 2 }, cup: { x: 6, z: 14 }
        }),
        build({
            name: 'Long Meadow', par: 5,
            blurb: 'Three shots if you lay up, two and a prayer if you do not.',
            pads: bands(0, [
                [5,  [4, rgh], [9, fwy], [7, rgh]],
                [13, [4, rgh], [9, fwy], [7, rgh]],
                [4,  [4, rgh], [6, fwy], [3, snd, DIP], [7, rgh]],
                [8,  [5, rgh], [10, fwy], [5, rgh]],
                [4,  [3, snd, DIP], [2, rgh], [10, fwy], [5, rgh]],
                [8,  [6, rgh], [10, fwy], [4, rgh]],
                [4,  [6, rgh], [3, fwy], [3, snd, DIP], [4, fwy], [4, rgh]],
                [9,  [5, rgh], [11, grn], [4, rgh]],
                [3,  [20, rgh]]
            ]),
            extra: [].concat(
                treeline(2, 6, 2, 28, 6),
                treeline(18.3, 8, 18.3, 23, 4),
                [tree(18, 47.5), tree(18, 53)]
            ),
            tee: { x: 8.5, z: 2.5 }, cup: { x: 10.5, z: 50.5 }
        }),
        build({
            name: 'The Elbow', par: 4,
            blurb: 'It turns left around an oak that has been there longer than the course.',
            pads: bands(0, [
                [5,  [11, rgh], [8, fwy], [3, rgh]],
                [12, [11, rgh], [8, fwy], [3, rgh]],
                [5,  [4, rgh], [4, snd, DIP], [11, fwy], [3, rgh]],
                [6,  [2, rgh], [11, fwy], [9, rgh]],
                [9,  [1.5, rgh], [10, grn], [10.5, rgh]],
                [3,  [22, rgh]]
            ]),
            extra: [].concat(
                [tree(10.7, 15.5, { t: 0.8, h: 2.8 })],
                treeline(9.4, 8, 9.4, 13, 3),
                treeline(2, 14, 2, 21, 3),
                treeline(20, 26, 20, 36, 4)
            ),
            tee: { x: 15, z: 2.5 }, cup: { x: 6, z: 32.5 }
        }),
        build({
            name: 'Short Stuff', par: 3,
            blurb: 'One full club to a small green in a ring of sand. Nothing else works.',
            pads: bands(0, [
                [4,   [3, rgh], [8, fwy], [3, rgh]],
                [3,   [14, rgh]],
                [2.5, [3.5, rgh], [7, snd, DIP], [3.5, rgh]],
                [8.5, [2.5, rgh], [2, snd, DIP], [5, grn], [2, snd, DIP], [2.5, rgh]],
                [3.5, [2.5, rgh], [9, grn], [2.5, rgh]],
                [3,   [14, rgh]]
            ]),
            extra: treeline(12.6, 19, 12.6, 23, 2),
            tee: { x: 7, z: 2 }, cup: { x: 7, z: 15 }
        }),
        build({
            name: 'Homeward', par: 4,
            blurb: 'Water all down the right for as long as the hole lasts.',
            pads: bands(0, [
                [5,  [4, rgh], [9, fwy], [7, rgh]],
                [4,  [4, rgh], [9, fwy], [2, rgh], [5, null]],
                [10, [4, rgh], [8, fwy], [2, rgh], [6, null]],
                [5,  [4, rgh], [8, fwy], [2, rgh], [6, null]],
                [4,  [5, rgh], [3, fwy], [3, snd, DIP], [3, fwy], [6, null]],
                [8,  [5, rgh], [10, grn], [5, rgh]],
                [3,  [20, rgh]]
            ]),
            water: [rect(15, 5, 5, 4, -0.55), rect(14, 9, 6, 19, -0.55)],
            gaps: [shore(rect(14, 5, 6, 23))],
            extra: [].concat(
                treeline(2, 6, 2, 27, 6),
                [tree(17.5, 32), tree(17.5, 35.5)]
            ),
            tee: { x: 8.5, z: 2.5 }, cup: { x: 10, z: 32 }
        })
    ];

    G3.COURSES = [
        {
            id: 'seaside',
            name: 'Seaside Green',
            blurb: 'Six flat-ish holes by the water. Learn the pace here.',
            theme: 'seaside',
            holes: seaside
        },
        {
            id: 'quarry',
            name: 'Quarry Ridge',
            blurb: 'Ramps, ledges and a long way down. Bring loft.',
            theme: 'quarry',
            holes: quarry
        },
        {
            id: 'works',
            name: 'Windmill Works',
            blurb: 'Everything moves. Nothing waits.',
            theme: 'works',
            holes: works
        },
        {
            id: 'tidewater',
            name: 'Tidewater Reach',
            blurb: 'Water where the fairway should be. Six holes you have to fly.',
            theme: 'lagoon',
            holes: tidewater
        },
        {
            id: 'highland',
            name: 'Highland Steps',
            blurb: 'Up the hill in stages, over what will not move.',
            theme: 'highland',
            holes: highland
        },
        {
            id: 'parkland',
            name: 'Ashdown Park',
            blurb: 'The long game: fairway, rough, sand and trees. Two shots to most greens.',
            theme: 'parkland',
            holes: parkland
        }
    ];

    G3.courseById = function (id) {
        for (var i = 0; i < G3.COURSES.length; i++) {
            if (G3.COURSES[i].id === id) return G3.COURSES[i];
        }
        return G3.COURSES[0];
    };

    G3.authoring = {
        pad: pad, wall: wall, spinner: spinner, slider: slider,
        beam: beam, pen: pen, bowl: bowl, bands: bands, tree: tree,
        rect: rect, enclose: enclose, shore: shore, brink: brink, build: build,
        RAIL_T: RAIL_T
    };

})(window.G3);
