/* Three courses of six holes, as data.

   A hole is a set of pads (the ground), a set of walls (things that bounce),
   a set of water rectangles (things that punish), a tee and a cup. Everything
   else — where the rails go, how high the cup sits, where the camera should
   look — is derived below, because a hole that has to repeat itself is a hole
   that will one day disagree with itself.

     pad     an axis-aligned patch of ground, flat or tilted. `kind` picks the
             friction: green, wood (bridges: slick), sand (a bunker eats a
             shot), rough. Pads do not overlap unless one is a bridge clearly
             above another.
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

   Two rules a new hole has to respect, both asserted in tests.html rather
   than left to memory:

   - No wall thinner than 0.24 units. Substepping caps ball travel at half a
     radius (0.08) per step, which is what stops the ball tunnelling. A
     thinner wall is outside that guarantee.
   - A moving gate or a spinning blade must always leave a gap wider than the
     ball. It is easy to write an amplitude that seals the hole shut at one
     phase of the sine and only fails for players with bad timing; the bot in
     tests.html plays every hole with random timing and will not finish one
     that can be closed. */
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

    // Shorelines want to be open: a rail along the water's edge would turn a
    // pond into a bumper.
    function shore(r, m) {
        m = m === undefined ? 0.45 : m;
        return { x: r.x - m, z: r.z - m, w: r.w + 2 * m, d: r.d + 2 * m };
    }

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
            name: 'Sea Legs', par: 2,
            blurb: 'Straight up the strip. Find your pace before the sea does.',
            pads: [pad(0, 0, 5, 14)],
            tee: { x: 2.5, z: 2 }, cup: { x: 2.5, z: 11.6 }
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
                pad(0, 5, 6, 3, 0, 'green', 0, 0.5),
                pad(0, 8, 6, 6, 1.5)
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
                pad(0, 10, 4, 4, 0, 'green', 0, 0.375),
                pad(0, 14, 10, 4, 1.5)
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
            blurb: 'Two banks and a gutter. Use the walls, they are doing the work.',
            pads: [
                pad(0, 0, 2.5, 15, 1.25, 'green', -0.5, 0),
                pad(2.5, 0, 2, 15),
                pad(4.5, 0, 2.5, 15, 0, 'green', 0.5, 0)
            ],
            tee: { x: 3.5, z: 1.5 }, cup: { x: 3.5, z: 13 }
        }),
        build({
            name: 'The Cannon', par: 3,
            blurb: 'The ramp is not a suggestion. Hit it flat out and fly the gap.',
            pads: [
                pad(0, 0, 6, 6),
                pad(1.5, 6, 3, 3, 0, 'wood', 0, 0.55),
                pad(0, 14, 7, 6)
            ],
            water: [rect(-3, 9, 14, 5, -0.9)],
            gaps: [shore(rect(-3, 9, 14, 5), 0.7), { x: 1.2, z: 8.4, w: 3.6, d: 1.2 }],
            tee: { x: 3, z: 1.5 }, cup: { x: 3.5, z: 17.5 }
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
                pad(1.5, 6, 3, 2.5, 0, 'wood', 0, 0.4),
                pad(0, 8.5, 6, 4, 1),
                pad(0, 16, 8, 6)
            ],
            water: [rect(-3, 12.5, 14, 3.5, -0.9)],
            gaps: [shore(rect(-3, 12.5, 14, 3.5), 0.7), { x: 1.2, z: 8, w: 3.6, d: 1 }],
            extra: [spinner(3, 10.5, 3.6, 0.4, { spin: 1.9, base: 0.9 })],
            tee: { x: 3, z: 1.5 }, cup: { x: 4, z: 19.5 }
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
        rect: rect, enclose: enclose, shore: shore, build: build,
        RAIL_T: RAIL_T
    };

})(window.G3);
