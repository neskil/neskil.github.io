/* A hole drawn small, from the hole's own data.

   The course picker shows every hole of every card as a thumbnail, and a
   thumbnail is not a small screenshot: `render.js` paints mown stripes, turf
   speckle, rake lines, a waving pennant and a vignette, none of which survives
   being shrunk to eighty pixels — at that size they are noise on top of the
   one thing the picture has to say, which is *what shape is this hole and what
   is in the way*. So this is a second, deliberately flat drawing of the same
   rectangles: no texture, no animation, no clock. A plan, not a photograph.

   It cannot drift from the hole it is a plan of, because it reads the same
   arrays physics.js does — a hole that grows a bunker grows one here too. What
   it can drift from is the *renderer*, and that is the trade: a moving gate is
   drawn at rest here, and the drawing says so with hatching rather than by
   pretending it knows where the gate is right now.

   Every plan is cached, keyed by course, hole and pixel size, so opening the
   picker twice costs one set of drawings. The draw's key carries its seed —
   two draws are two different courses under one id, and a cache that did not
   know that would hand the second one the first one's pictures. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;

    /* Flat, and not the game's palette. On the board the point of a colour is
       to look like grass under a low sun; here the point is that sand, water,
       ice and rough are four things you can tell apart in a strip eighty
       pixels wide. So they are pushed further apart than the board's are, and
       the board's darkening vignette — which would turn the corners of a
       thumbnail to mud — is left out entirely. */
    var INK = {
        grass:  '#2e6b41',
        green:  '#3f8a53',
        rough:  '#1c4a2a',
        sand:   '#dfc78f',
        water:  '#1b6d9e',
        ice:    '#c6e6f2',
        wall:   '#6d4a2e',
        move:   '#c98a3c',
        bumper: '#f0a52a',
        slope:  'rgba(255, 255, 255, 0.14)',
        tee:    '#f8fafc',
        cup:    '#0b1a0d',
        flag:   '#ef4444'
    };

    var cache = {};

    function rects(g, list, fill) {
        g.fillStyle = fill;
        for (var i = 0; i < list.length; i++) {
            g.fillRect(list[i].x, list[i].y, list[i].w, list[i].h);
        }
    }

    /* The whole plan, drawn in world coordinates. The caller has already
       scaled the context to the canvas, so everything below is in the same
       960x640 the hole itself is written in and nothing here has to know how
       big the thumbnail is. */
    function paint(g, hole) {
        g.fillStyle = INK.grass;
        g.fillRect(0, 0, C.WORLD_W, C.WORLD_H);

        // The putting green. Decoration on the board and decoration here, but
        // it is what makes the flag findable before the eye has found the pin.
        g.fillStyle = INK.green;
        g.beginPath();
        g.arc(hole.hole.x, hole.hole.y, 84, 0, Math.PI * 2);
        g.fill();

        rects(g, hole.rough, INK.rough);
        rects(g, hole.sand, INK.sand);
        rects(g, hole.ice, INK.ice);
        rects(g, hole.water, INK.water);

        /* A slope is a tint plus the arrow that says which way it sheds —
           direction is the whole of what a slope does, and a plain grey wash
           would say only that something is different there. */
        var i, s;
        for (i = 0; i < hole.slopes.length; i++) {
            s = hole.slopes[i];
            g.fillStyle = INK.slope;
            g.fillRect(s.x, s.y, s.w, s.h);
            arrow(g, s);
        }

        /* Walls last of the rectangles: they are the only thing on the field
           the ball cannot pass through, so nothing is allowed to cover one.
           A moving wall wears stripes rather than a position — where a gate
           happens to be is a fact about the clock, and a plan has none. */
        for (i = 0; i < hole.walls.length; i++) {
            var w = hole.walls[i];
            g.fillStyle = w.move ? INK.move : INK.wall;
            g.fillRect(w.x, w.y, w.w, w.h);
            if (w.move) stripe(g, w);
        }

        for (i = 0; i < hole.bumpers.length; i++) {
            var b = hole.bumpers[i];
            g.fillStyle = INK.bumper;
            g.beginPath();
            g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            g.fill();
        }

        /* The tee and the pin, both drawn far larger than life. A ball is
           three quarters of a pixel in a thumbnail and a cup is a pixel and a
           half, and where the shot starts and where it has to end is the
           first thing anyone asks of a plan — so they are drawn at the size
           of the question rather than at the size of the thing. */
        g.fillStyle = INK.cup;
        g.beginPath();
        g.arc(hole.hole.x, hole.hole.y, 19, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = '#f1f5f9';
        g.lineWidth = 9;
        g.beginPath();
        g.moveTo(hole.hole.x, hole.hole.y);
        g.lineTo(hole.hole.x, hole.hole.y - 76);
        g.stroke();
        g.fillStyle = INK.flag;
        g.beginPath();
        g.moveTo(hole.hole.x + 4, hole.hole.y - 76);
        g.lineTo(hole.hole.x + 58, hole.hole.y - 60);
        g.lineTo(hole.hole.x + 4, hole.hole.y - 44);
        g.closePath();
        g.fill();

        g.fillStyle = INK.tee;
        g.beginPath();
        g.arc(hole.tee.x, hole.tee.y, 17, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = 'rgba(4, 18, 10, 0.45)';
        g.lineWidth = 5;
        g.stroke();
    }

    // Downhill, in the middle of the zone it belongs to. Sized to the zone so
    // a wide shallow tilt does not get the same mark as a narrow steep one.
    function arrow(g, s) {
        var a = Math.atan2(s.ay, s.ax);
        var len = Math.min(s.w, s.h) * 0.34;
        if (len < 14) return;
        var cx = s.x + s.w / 2, cy = s.y + s.h / 2;
        g.save();
        g.translate(cx, cy);
        g.rotate(a);
        g.fillStyle = 'rgba(255, 255, 255, 0.55)';
        g.beginPath();
        g.moveTo(len, 0);
        g.lineTo(-len * 0.5, -len * 0.55);
        g.lineTo(-len * 0.5, len * 0.55);
        g.closePath();
        g.fill();
        g.restore();
    }

    // Hazard stripes across a moving wall, clipped to it.
    function stripe(g, w) {
        g.save();
        g.beginPath();
        g.rect(w.x, w.y, w.w, w.h);
        g.clip();
        g.strokeStyle = 'rgba(20, 12, 4, 0.55)';
        g.lineWidth = 7;
        var span = w.w + w.h;
        for (var d = -w.h; d < span; d += 18) {
            g.beginPath();
            g.moveTo(w.x + d, w.y);
            g.lineTo(w.x + d + w.h, w.y + w.h);
            g.stroke();
        }
        g.restore();
    }

    /* One plan at one size, made on demand and kept. `stamp` is whatever tells
       two courses sharing an id apart — the draw's seed — so a re-roll gets
       its own pictures instead of the last draw's. */
    function plan(courseId, index, w, h, stamp) {
        var key = courseId + '/' + (stamp === null || stamp === undefined ? '-' : stamp) +
                  '/' + index + '/' + w + 'x' + h;
        if (cache[key]) return cache[key];

        var course = null;
        for (var i = 0; i < GOLF.COURSES.length; i++) {
            if (GOLF.COURSES[i].id === courseId) { course = GOLF.COURSES[i]; break; }
        }
        var hole = course && course.holes[index];
        if (!hole) return null;

        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var g = c.getContext('2d');
        g.setTransform(w / C.WORLD_W, 0, 0, h / C.WORLD_H, 0, 0);
        paint(g, hole);
        cache[key] = c;
        return c;
    }

    /* Draw one into a canvas already on the page, sized from its own CSS box
       so a plan is sharp on a retina screen and cheap on a phone. Called after
       the dialog is up: a canvas with no laid-out width has nothing to be
       measured against and would be drawn at one pixel. */
    function into(canvas, courseId, index, stamp) {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = Math.max(24, Math.round((canvas.clientWidth || 90) * dpr));
        var h = Math.max(16, Math.round(w * C.WORLD_H / C.WORLD_W));
        canvas.width = w;
        canvas.height = h;
        var src = plan(courseId, index, w, h, stamp);
        if (src) canvas.getContext('2d').drawImage(src, 0, 0);
    }

    GOLF.plan = { paint: paint, plan: plan, into: into };

})(window.GOLF);
