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
        glass:   [ 26,  32,  56],
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

    function rgbOf(c) {
        if (typeof c === 'number') return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
        if (typeof c === 'string' && c.charAt(0) === '#') {
            var n = parseInt(c.slice(1), 16);
            return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        }
        return [128, 128, 128];
    }

    function mixRgb(a, b, t) {
        return [
            Math.round(a[0] + (b[0] - a[0]) * t),
            Math.round(a[1] + (b[1] - a[1]) * t),
            Math.round(a[2] + (b[2] - a[2]) * t)
        ];
    }

    function liftRgb(c, minLum) {
        var lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
        if (lum >= minLum) return c;
        var add = minLum - lum;
        return [
            Math.min(255, Math.round(c[0] + add)),
            Math.min(255, Math.round(c[1] + add)),
            Math.min(255, Math.round(c[2] + add))
        ];
    }

    /* Each world or themed course tints the diagram towards its own palette
       while keeping surface types distinct and legible on a dark card. */
    function paletteFor(hole, themeName) {
        var key = (hole && (hole.theme || hole.scene)) || themeName;
        var T = key && G3.THEMES ? G3.THEMES[key] : null;
        if (!T) {
            return {
                green: INK.green, fairway: INK.fairway, rough: INK.rough, ghost: [52, 88, 48],
                sand: INK.sand, wood: INK.wood, ice: INK.ice, glass: INK.glass, cup: INK.cup,
                machine: MACHINE, water: WATER, beyond: BEYOND, rail: RAIL,
                wellHot: [255, 106, 20], wellCool: [212, 34, 107], grid: null, key: key
            };
        }
        var t = hole && hole.portal ? 0.74 : 0.42;
        var g0 = T.grass && T.grass[0] ? rgbOf(T.grass[0]) : INK.green;
        var g1 = T.grass && T.grass[1] ? rgbOf(T.grass[1]) : g0;
        var env = rgbOf(T.ground || T.floor || T.side || (T.sky && T.sky[1]) || 0x24342a);
        var green = liftRgb(mixRgb(INK.green, g0, t), 54);
        var fairway = liftRgb(mixRgb(INK.fairway, g1, t), 44);
        var rough = liftRgb(mixRgb(INK.rough, env, t * 0.85), 32);
        var ghost = liftRgb(mixRgb(rough, env, 0.55), 28);
        return {
            green: green,
            fairway: fairway,
            rough: rough,
            ghost: ghost,
            sand: T.sand ? mixRgb(INK.sand, rgbOf(T.sand), 0.78) : INK.sand,
            wood: T.side || T.floor ? mixRgb(INK.wood, rgbOf(T.side || T.floor), hole && hole.portal ? 0.38 : 0.18) : INK.wood,
            ice: INK.ice,
            glass: T.glass && T.glass.color !== undefined ? liftRgb(rgbOf(T.glass.color), 22) : INK.glass,
            cup: INK.cup,
            machine: T.machine !== undefined ? liftRgb(mixRgb(MACHINE, rgbOf(T.machine), 0.7), 85) : MACHINE,
            water: T.water !== undefined ? liftRgb(mixRgb(WATER, rgbOf(T.water), hole && hole.portal ? 0.78 : 0.5), 42) : WATER,
            beyond: liftRgb(mixRgb(BEYOND, env, 0.5), 22),
            rail: T.rail !== undefined ? liftRgb(mixRgb(RAIL, rgbOf(T.rail), hole && hole.portal ? 0.78 : 0.45), 72) : RAIL,
            wellHot: rgbOf(T.wellHot || 0xff6a14),
            wellCool: rgbOf(T.wellCool || 0xd4226b),
            grid: T.grid ? rgbOf(T.grid.colour || 0xffb347) : null,
            key: key
        };
    }

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

    /* The one piece of arithmetic that turns a world coordinate into a pixel
       on a plan of a given size — shared by the renderer below and by anyone
       who needs to put a live marker (a ball, say) on a plan already drawn,
       without re-deriving how that plan was framed. */
    function transform(hole, w, h) {
        var b = extent(hole);
        var pad = 1.5;
        var wx = (b.maxX - b.minX) + pad * 2, wz = (b.maxZ - b.minZ) + pad * 2;
        var scale = Math.min(w / wx, h / wz);
        return {
            ox: (b.minX - pad) - (w / scale - wx) / 2,
            oz: (b.minZ - pad) - (h / scale - wz) / 2,
            scale: scale
        };
    }

    /* One hole, drawn to fit `w` by `h`. The scale is the same on both axes —
       a plan that stretched a hole to fill its frame would be lying about the
       one thing a plan is for. */
    function render(hole, w, h, themeName) {
        var cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        var g = cv.getContext('2d');
        var img = g.createImageData(w, h);
        var d = img.data;

        var pal = paletteFor(hole, themeName);
        var tf = transform(hole, w, h);
        var scale = tf.scale, ox = tf.ox, oz = tf.oz;
        var baseY = hole.tee && isFinite(hole.tee.y) ? hole.tee.y : 0;

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
                    col = pal.water; lit = 1;
                } else {
                    if (surf.pad.push || surf.pad.spring) {
                        col = pal.machine;
                    } else if (surf.pad.ghost) {
                        // Sculpted world ground (turtle, ironriver, nave, table).
                        // On The Sugar Gate (`table`), baked objects standing up
                        // off the cloth (sugar cubes, plate, teapot) read as cream.
                        col = (pal.key === 'table' && surf.y > 0.36) ? [238, 230, 214] : pal.ghost;
                    } else {
                        col = pal[surf.pad.kind] || pal.green;
                    }
                    lit = shade(surf.pad, x, z) *
                        (1 + Math.max(-0.10, Math.min(0.16, (surf.y - baseY) * 0.024)));
                    if (surf.pad.ghost && Math.abs(surf.y - Math.round(surf.y / 1.25) * 1.25) < 0.07) {
                        lit *= 0.88;
                    }
                    if (surf.pad.kind === 'glass' && pal.grid &&
                        (Math.abs(x - Math.round(x)) < 0.07 || Math.abs(z - Math.round(z)) < 0.07)) {
                        col = mixRgb(col, pal.grid, 0.38);
                    }
                }

                // Beyond the stakes the ground is still ground, and still has
                // to be legible — it is where your ball goes. It just is not
                // the golf course, so it loses its colour rather than its light.
                outside = P.outOfBounds(hole, x, z);
                if (outside) {
                    d[i] = (col[0] * 0.35 + pal.beyond[0] * 0.65) * lit;
                    d[i + 1] = (col[1] * 0.35 + pal.beyond[1] * 0.65) * lit;
                    d[i + 2] = (col[2] * 0.35 + pal.beyond[2] * 0.65) * lit;
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

        // Currents and conveyor belts: show which way the belt carries the ball.
        var pi, pd;
        for (pi = 0; pi < (hole.pads || []).length; pi++) {
            pd = hole.pads[pi];
            if (!pd.push || (!pd.push.x && !pd.push.z)) continue;
            var pYaw = Math.atan2(pd.push.x, pd.push.z);
            var pcx = toX(pd.x + pd.w / 2), pcy = toY(pd.z + pd.d / 2);
            var step = Math.max(8, 3.2 * scale), span = Math.max(pd.w, pd.d) * scale;
            var nArr = Math.max(1, Math.min(4, Math.floor(span / step)));
            g.save();
            g.strokeStyle = 'rgba(255,255,255,0.55)';
            g.lineWidth = Math.max(1, 0.14 * scale);
            for (var ai = 0; ai < nArr; ai++) {
                var off = (ai - (nArr - 1) / 2) * step * 0.75;
                var ax = pcx + Math.sin(pYaw) * off, ay = pcy + Math.cos(pYaw) * off;
                var sz = Math.max(2, 0.42 * scale);
                g.beginPath();
                g.moveTo(ax - Math.cos(pYaw) * sz - Math.sin(pYaw) * sz * 0.6,
                         ay + Math.sin(pYaw) * sz - Math.cos(pYaw) * sz * 0.6);
                g.lineTo(ax + Math.sin(pYaw) * sz * 0.6, ay + Math.cos(pYaw) * sz * 0.6);
                g.lineTo(ax + Math.cos(pYaw) * sz - Math.sin(pYaw) * sz * 0.6,
                         ay - Math.sin(pYaw) * sz - Math.cos(pYaw) * sz * 0.6);
                g.stroke();
            }
            g.restore();
        }

        // Gravity wells (The Three-Body Problem, Apogee): accretion ring + dark core.
        var wells = hole.wells || [], wi, wl0;
        for (wi = 0; wi < wells.length; wi++) {
            wl0 = wells[wi];
            var wx = toX(wl0.x), wy = toY(wl0.z);
            var wr = Math.max(2.2, (wl0.core || 0.75) * scale);
            g.strokeStyle = 'rgba(' + pal.wellCool.join(',') + ',0.55)';
            g.lineWidth = Math.max(1.2, wr * 0.55);
            g.beginPath();
            g.arc(wx, wy, wr * 2.1, 0, 6.283);
            g.stroke();
            g.strokeStyle = 'rgb(' + pal.wellHot.join(',') + ')';
            g.lineWidth = Math.max(1.2, wr * 0.45);
            g.beginPath();
            g.arc(wx, wy, wr * 1.35, 0, 6.283);
            g.stroke();
            g.fillStyle = '#05050a';
            g.beginPath();
            g.arc(wx, wy, wr, 0, 6.283);
            g.fill();
        }

        var k, wl, B;
        for (k = 0; k < hole.walls.length; k++) {
            wl = hole.walls[k];
            // Sails are drawn as the line they turn in rather than as the one
            // sail that happens to be down at the start of the clock.
            B = wl.sails ? { cx: wl.x + wl.w / 2, cz: wl.z + wl.d / 2, hw: wl.w / 2, hd: wl.d / 2, yaw: 0 }
                : P.wallBox(wl, 0);
            // A bumper and a rubber post are round (physics.isPost), and the
            // plan says so rather than drawing the box nobody plays.
            if (P.isPost && P.isPost(wl)) {
                g.fillStyle = wl.kind === 'post' ? '#e8e8ee' : 'rgb(' + pal.machine.join(',') + ')';
                g.beginPath();
                g.arc(toX(B.cx), toY(B.cz), Math.max(1.4, B.hw * scale), 0, 6.283);
                g.fill();
                continue;
            }
            // A slingshot is one triangle of rubber, drawn off its face.
            if (wl.kind === 'slingback') continue;
            if (wl.tri) {
                g.fillStyle = '#f0f0f4';
                g.beginPath();
                g.moveTo(toX(wl.tri[0].x), toY(wl.tri[0].z));
                g.lineTo(toX(wl.tri[1].x), toY(wl.tri[1].z));
                g.lineTo(toX(wl.tri[2].x), toY(wl.tri[2].z));
                g.closePath();
                g.fill();
                g.strokeStyle = '#ff4fa3';
                g.lineWidth = Math.max(1, 0.12 * scale);
                g.beginPath();
                g.moveTo(toX(wl.tri[0].x), toY(wl.tri[0].z));
                g.lineTo(toX(wl.tri[1].x), toY(wl.tri[1].z));
                g.stroke();
                continue;
            }
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
                : wl.kind === 'beam' || wl.kind === 'sails' ? '#9a6a3c'
                : wl.kind === 'mill' ? '#ebe4d3'
                : wl.kind === 'meteor' ? (pal.key === 'breakfast' ? '#f7f3e8' : pal.key === 'orrery' ? '#c8963e' : '#6e645e')
                : 'rgb(' + pal.rail.join(',') + ')';
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

        /* The loops, drawn the way they look from straight above: the track
           seen edge-on is a band from one side of the circle to the other,
           stepping across by its corkscrew as it goes. Drawn as its own
           footprint so the plan says why the lane narrows to a mouth there. */
        var ls = hole.loops || [], lp, F, t, th, fw, la;
        for (q = 0; q < ls.length; q++) {
            lp = ls[q];
            F = P.loopFrame(lp);
            g.strokeStyle = 'rgb(244,122,178)';
            g.lineWidth = Math.max(1.5, 0.5 * scale);
            g.beginPath();
            for (t = 0; t <= 48; t++) {
                th = t / 48 * Math.PI * 2;
                fw = lp.R * Math.sin(th);
                la = F.k * th;
                if (t === 0) g.moveTo(toX(lp.x + F.fx * fw + F.lx * la), toY(lp.z + F.fz * fw + F.lz * la));
                else g.lineTo(toX(lp.x + F.fx * fw + F.lx * la), toY(lp.z + F.fz * fw + F.lz * la));
            }
            g.stroke();
        }

        // The tee, and the hole itself. Both are drawn at a size you can see
        // rather than at a size that is true: a 0.4-unit cup on a hole eighty
        // units long is a third of a pixel.
        var r = Math.max(2.5, C.HOLE_R * scale);

        // The tee: a prominent tee box marker (amber circle with white ball & shadow)
        var tx = toX(hole.tee.x), ty = toY(hole.tee.z);
        var tr = Math.max(3.2, r * 1.05);
        g.fillStyle = 'rgba(6, 20, 34, 0.85)';
        g.beginPath();
        g.arc(tx, ty, tr + 1.2, 0, 6.283);
        g.fill();
        g.fillStyle = '#fbbf24';
        g.beginPath();
        g.arc(tx, ty, tr, 0, 6.283);
        g.fill();
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(tx, ty, Math.max(1.5, tr * 0.45), 0, 6.283);
        g.fill();

        // The cup: dark hole with crisp white rim and red pin flag
        var cx = toX(hole.cup.x), cy = toY(hole.cup.z);
        g.fillStyle = '#12160f';
        g.beginPath();
        g.arc(cx, cy, r, 0, 6.283);
        g.fill();
        g.strokeStyle = '#ffffff';
        g.lineWidth = Math.max(1.2, r * 0.45);
        g.stroke();
        g.strokeStyle = '#ef4444';
        g.lineWidth = Math.max(1, r * 0.35);
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(cx, cy - Math.max(4, r * 1.6));
        g.lineTo(cx + Math.max(3, r * 1.1), cy - Math.max(2.8, r * 1.1));
        g.lineTo(cx, cy - Math.max(1.6, r * 0.6));
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
        var course = G3.courseById(courseId);
        var hole = course.holes[index];
        if (!hole) return null;
        var theme = hole.theme || (course.themes && course.themes[index]) || course.theme || '';
        var key = (hole.worldId ? 'world-' + hole.worldId : courseId + '/' + index) + '/' + theme + '/' + w + 'x' + h;
        if (cache[key]) return cache[key];
        cache[key] = render(hole, w, h, theme);
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

    G3.minimap = { render: render, map: map, into: into, aspect: aspect, transform: transform };

})(window.G3);
