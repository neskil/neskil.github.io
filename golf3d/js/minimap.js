/* A hole drawn flat, from the same data the ball stands on.

   This is not a second copy of the course. Every pixel below is a question put
   to `physics.surfaceUnder` — the function the simulation uses to decide what
   the ball is rolling on — so a plan cannot disagree with the hole it is a
   plan of. A pad shape the renderer learns to draw, a bunker that moves, a
   green that becomes a disc: all of it turns up here for free, and none of it
   can turn up here *wrong*.

   That decision costs something. Sampling a surface per pixel is slower than
   filling a few rectangles would be, and on a links hole with sixty humps
   under the point it is a great deal slower. It buys two things worth having.
   The rolling ground draws itself — the shading below is the real gradient at
   the pixel, so a dune reads as a dune rather than as a flat green rectangle.
   And there is nothing to keep in step: the day a hole grows a shape nobody
   here has heard of, the map already knows what it looks like.

   The cost is paid once. A drawn hole is kept, keyed by course and index, and
   handed back as a canvas the caller blits — the course picker asks for
   forty-two of these in one go and the second time it opens it asks for none. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG, P = G3.physics;

    /* Flat colours, not the theme's. A plan is a diagram: it has to say
       fairway-rough-sand-green at a glance and at the size of a thumbnail, and
       the palette that makes a course beautiful under a low sun is the wrong
       one for that — Windmill Works is played after dark and its plan would be
       a black square. So every course is drawn in the same daylight, and what
       tells them apart is their shape. */
    var INK = {
        green:   [126, 196, 104],
        fairway: [ 96, 158,  76],
        rough:   [ 60, 104,  54],
        sand:    [222, 204, 154],
        wood:    [176, 132,  80],
        ice:     [188, 218, 234],
        cup:     [ 24,  32,  20]
    };
    /* And the machinery, which is not a surface at all — a belt is a board and
       a launch pad is a board, and on a plan the thing that matters about
       either is that it is *not* a board. So they are drawn in one hot colour
       over whatever they are made of, because on a thumbnail the question a
       player is asking is "what does that do to my ball", and a wooden
       rectangle three pixels wide answers it wrong. */
    var MACHINE = [244, 122, 178];
    var WATER = [46, 118, 158];
    var BEYOND = [30, 44, 36];        // ground outside the boundary
    var RAIL = [232, 236, 230];
    var TREE = [46, 84, 44];

    // Light from the north-west, the way every map in the world is lit.
    var LX = -0.55, LY = 0.66, LZ = -0.51;

    var cache = {};

    function shade(pad, x, z) {
        var g = P.padGrad(pad, x, z, { x: 0, z: 0 });
        // Surface normal of a height field is (-dh/dx, 1, -dh/dz), normalised.
        var nx = -g.x, ny = 1, nz = -g.z;
        var inv = 1 / Math.sqrt(nx * nx + 1 + nz * nz);
        var lam = (nx * LX + ny * LY + nz * LZ) * inv;
        // Never all the way to black: this is a map, and a shaded face still
        // has to say what it is made of.
        return 0.72 + 0.46 * Math.max(0, lam);
    }

    /* What has to fit in the frame.

       `hole.bounds` is what the *camera* frames, and on an open hole that is
       deliberately the boundary rather than the ground, which is right there
       and right here. On a fenced hole it is the pads — and a pad is not the
       whole hole. A pond reaches past the shore it is cut into, a rail stands
       outside the pad it fences, and both were being sliced off the edge of
       the plan. So on a fenced hole the pads' bounds are grown by whatever
       water and walls stick out of them, and on an open one they are left
       alone, because the ground there runs to the horizon and framing *that*
       would draw a hole the size of a full stop. */
    function extent(hole) {
        var b = hole.bounds;
        var out = { minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ };
        if (hole.open) return out;
        function grow(x, z, w, d) {
            out.minX = Math.min(out.minX, x); out.maxX = Math.max(out.maxX, x + w);
            out.minZ = Math.min(out.minZ, z); out.maxZ = Math.max(out.maxZ, z + d);
        }
        var i, r, B;
        for (i = 0; i < (hole.water || []).length; i++) {
            r = hole.water[i];
            grow(r.x, r.z, r.w, r.d);
        }
        for (i = 0; i < hole.walls.length; i++) {
            B = P.wallBox(hole.walls[i], 0);
            // Half-extents about the centre, and a rotated wall reaches as far
            // as its diagonal, which is what a spinning blade actually sweeps.
            r = Math.hypot(B.hw, B.hd);
            grow(B.cx - r, B.cz - r, r * 2, r * 2);
        }
        return out;
    }

    /* One hole, drawn to fit `w` by `h`. The scale is the same on both axes —
       a plan that stretched a hole to fill its frame would be lying about the
       one thing a plan is for. */
    function render(hole, w, h) {
        var cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        var g = cv.getContext('2d');
        var img = g.createImageData(w, h);
        var d = img.data;

        var b = extent(hole);
        var pad = 1.5;
        var wx = (b.maxX - b.minX) + pad * 2, wz = (b.maxZ - b.minZ) + pad * 2;
        var scale = Math.min(w / wx, h / wz);
        var ox = (b.minX - pad) - (w / scale - wx) / 2;
        var oz = (b.minZ - pad) - (h / scale - wz) / 2;

        var px, py, i, x, z, surf, col, lit, pond, outside;
        for (py = 0; py < h; py++) {
            z = oz + (py + 0.5) / scale;
            for (px = 0; px < w; px++) {
                x = ox + (px + 0.5) / scale;
                i = (py * w + px) * 4;

                surf = P.surfaceUnder(hole, x, z, Infinity);
                pond = P.waterAt(hole, x, z);
                if (surf && pond && surf.y <= pond.y + 0.01) surf = null;

                if (!surf) {
                    if (!pond) continue;                  // nothing here: transparent
                    col = WATER; lit = 1;
                } else {
                    col = (surf.pad.push || surf.pad.spring)
                        ? MACHINE
                        : (INK[surf.pad.kind] || INK.green);
                    lit = shade(surf.pad, x, z);
                }

                // Beyond the stakes the ground is still ground, and still has
                // to be legible — it is where your ball goes. It just is not
                // the golf course, so it loses its colour rather than its light.
                outside = P.outOfBounds(hole, x, z);
                if (outside) {
                    d[i] = (col[0] * 0.35 + BEYOND[0] * 0.65) * lit;
                    d[i + 1] = (col[1] * 0.35 + BEYOND[1] * 0.65) * lit;
                    d[i + 2] = (col[2] * 0.35 + BEYOND[2] * 0.65) * lit;
                } else {
                    d[i] = Math.min(255, col[0] * lit);
                    d[i + 1] = Math.min(255, col[1] * lit);
                    d[i + 2] = Math.min(255, col[2] * lit);
                }
                d[i + 3] = 255;
            }
        }
        g.putImageData(img, 0, 0);

        /* Walls on top, because they are things standing on the ground rather
           than ground, and because at this size a rail sampled per pixel would
           come out as a dotted line. A tree is drawn as its canopy rather than
           its trunk: the trunk is what the ball hits and the canopy is what you
           are looking at from above. */
        function toX(v) { return (v - ox) * scale; }
        function toY(v) { return (v - oz) * scale; }
        var k, wl, B;
        for (k = 0; k < hole.walls.length; k++) {
            wl = hole.walls[k];
            B = P.wallBox(wl, 0);
            if (wl.kind === 'tree') {
                g.fillStyle = 'rgb(' + TREE.join(',') + ')';
                g.beginPath();
                g.arc(toX(B.cx), toY(B.cz), Math.max(1.6, B.hw * 2.4 * scale), 0, 6.283);
                g.fill();
                continue;
            }
            g.save();
            g.translate(toX(B.cx), toY(B.cz));
            g.rotate(-B.yaw);
            g.fillStyle = wl.kind === 'blade' ? '#d8523f'
                : wl.kind === 'gate' ? '#e0a13a'
                : wl.kind === 'beam' ? '#9a6a3c'
                : 'rgb(' + RAIL.join(',') + ')';
            g.fillRect(-B.hw * scale, -B.hd * scale,
                Math.max(1, B.hw * 2 * scale), Math.max(1, B.hd * 2 * scale));
            g.restore();
        }

        /* The pipes, drawn as both ends and the line between them. On the
           ground a mouth is a hole you have to find; on a plan it is the only
           thing that explains why the hole is shaped the way it is, so the
           plan gives away what the tee does not — where you come out. */
        var ws = hole.warps || [], q, wp;
        for (q = 0; q < ws.length; q++) {
            wp = ws[q];
            g.strokeStyle = 'rgba(244,122,178,0.45)';
            g.lineWidth = Math.max(1, 0.12 * scale);
            g.setLineDash([Math.max(2, 0.5 * scale), Math.max(2, 0.5 * scale)]);
            g.beginPath();
            g.moveTo(toX(wp.x), toY(wp.z));
            g.lineTo(toX(wp.tx), toY(wp.tz));
            g.stroke();
            g.setLineDash([]);
            g.fillStyle = 'rgb(244,122,178)';
            g.beginPath();
            g.arc(toX(wp.x), toY(wp.z), Math.max(2, wp.r * scale), 0, 6.283);
            g.fill();
            g.fillStyle = 'rgba(16,20,26,0.9)';
            g.beginPath();
            g.arc(toX(wp.x), toY(wp.z), Math.max(1, wp.r * 0.6 * scale), 0, 6.283);
            g.fill();
        }

        // The tee, and the hole itself. Both are drawn at a size you can see
        // rather than at a size that is true: a 0.4-unit cup on a hole eighty
        // units long is a third of a pixel.
        var r = Math.max(2.2, C.HOLE_R * scale);
        g.fillStyle = 'rgba(255,255,255,0.85)';
        g.beginPath();
        g.arc(toX(hole.tee.x), toY(hole.tee.z), Math.max(1.8, r * 0.8), 0, 6.283);
        g.fill();

        g.fillStyle = '#12160f';
        g.beginPath();
        g.arc(toX(hole.cup.x), toY(hole.cup.z), r, 0, 6.283);
        g.fill();
        g.strokeStyle = '#ffffff';
        g.lineWidth = Math.max(1, r * 0.45);
        g.stroke();

        return cv;
    }

    /* How wide a hole is against how deep, which is what a frame drawn round
       it should be shaped like. Clamped, because a plan of a hole eleven times
       as deep as it is wide would be a frame nobody can put in a layout. */
    function aspect(hole, lo, hi) {
        var b = extent(hole);
        var a = (b.maxX - b.minX + 3) / Math.max(0.001, b.maxZ - b.minZ + 3);
        return Math.max(lo === undefined ? 0.4 : lo, Math.min(hi === undefined ? 1.6 : hi, a));
    }

    /* The drawn plan for one hole, made on demand and kept. Keyed by course
       and index rather than by the hole object, so a page that never opens the
       picker never pays for it and one that opens it twice pays once. */
    function map(courseId, index, w, h) {
        var key = courseId + '/' + index + '/' + w + 'x' + h;
        if (cache[key]) return cache[key];
        var course = G3.courseById(courseId);
        var hole = course.holes[index];
        if (!hole) return null;
        cache[key] = render(hole, w, h);
        return cache[key];
    }

    // Draw one into an existing canvas, sized by its own CSS box so the plan
    // is sharp on a retina screen and cheap on a phone. `shape` asks the canvas
    // to take the hole's own proportions first, so a lane does not sit in a
    // letterbox with two thirds of the frame empty.
    function into(canvas, courseId, index, shape) {
        if (shape) {
            var course = G3.courseById(courseId);
            if (course.holes[index]) {
                canvas.style.aspectRatio = aspect(course.holes[index], 0.42, 1.7).toFixed(3);
            }
        }
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = Math.max(24, Math.round(canvas.clientWidth * dpr));
        var h = Math.max(24, Math.round(canvas.clientHeight * dpr));
        if (!canvas.clientWidth) { w = canvas.width; h = canvas.height; }
        canvas.width = w; canvas.height = h;
        var src = map(courseId, index, w, h);
        if (!src) return;
        canvas.getContext('2d').drawImage(src, 0, 0);
    }

    G3.minimap = { render: render, map: map, into: into, aspect: aspect };

})(window.G3);
