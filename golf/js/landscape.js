/* The place a hole is played in: turf, hazards, walls, posts, decoration,
   trees and weather, drawn in the biome its course belongs to (scenery.js).
   render.js draws the ball, the aim and the effects on top, and owns the
   frame; this owns everything that would still be there with no ball on it.

   Three rules hold the whole file together.

   **Light comes from the top left of the screen, not of the world.** On a
   phone held upright the board is drawn a quarter turn round (game.js →
   resize), and a shadow that fell down-right in the world would fall up-right
   on the glass. So every offset that means "towards the light" or "away from
   it" goes through `sv`, which turns a screen offset into a world one.

   **Height is drawn on the side facing the viewer.** A wall is a block, and
   its near face shows below its top on screen. The top face stays exactly on
   the wall's footprint, so nothing about where the ball can go has moved, and
   because the near face hangs towards the viewer and the ball is drawn after
   every wall, a ball is never hidden behind one: north of a wall it is clear
   of it, south of it it is in front of it.

   **What does not move is drawn once.** The ground — turf, the green, rough,
   bunkers, ice, slopes, decals — and every wall that holds still are painted
   into two canvases per hole and blitted each frame. Water, posts, gates,
   trees and clouds move, and are drawn live. The editor hands over no key to
   cache under, because its hole changes under the mouse, and gets everything
   drawn live instead. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;
    var P = GOLF.physics;
    var SC = GOLF.scenery;

    var W = C.WORLD_W, H = C.WORLD_H;
    var EXT = 7;          // how far a wall's near face shows, world px

    /* ── the view ───────────────────────────────────────────────────────── */

    // Screen right and screen down, as world directions.
    function viewOf(turned) {
        return turned
            ? { turned: true, rx: 0, ry: 1, dx: -1, dy: 0 }
            : { turned: false, rx: 1, ry: 0, dx: 0, dy: 1 };
    }

    // `a` pixels to the right and `b` down the screen, in world units.
    function sv(v, a, b) { return { x: v.rx * a + v.dx * b, y: v.ry * a + v.dy * b }; }

    // Deterministic noise, so a hole's grass sits in the same place every
    // time it is loaded and the course does not shimmer on a replay.
    function hash(n) {
        var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    function roundRect(g, x, y, w, h, r) {
        var rr = Math.max(0, Math.min(r, w / 2, h / 2));
        g.beginPath();
        g.moveTo(x + rr, y);
        g.arcTo(x + w, y, x + w, y + h, rr);
        g.arcTo(x + w, y + h, x, y + h, rr);
        g.arcTo(x, y + h, x, y, rr);
        g.arcTo(x, y, x + w, y, rr);
        g.closePath();
    }

    /* A gradient across a box from its lit corner to its shaded one, in
       whichever world direction the screen's top left currently is. */
    function lit(g, R, v, a, b) {
        var d = sv(v, -1, -1), n = Math.hypot(d.x, d.y);
        var ux = d.x / n, uy = d.y / n;
        var ext = Math.abs(ux) * R.w / 2 + Math.abs(uy) * R.h / 2;
        var cx = R.x + R.w / 2, cy = R.y + R.h / 2;
        var grad = g.createLinearGradient(cx + ux * ext, cy + uy * ext, cx - ux * ext, cy - uy * ext);
        grad.addColorStop(0, a);
        grad.addColorStop(0.3, 'rgba(255,255,255,0)');
        grad.addColorStop(1, b);
        return grad;
    }

    /* ── outlines, drawn ───────────────────────────────────────────────

       A zone list becomes one path: every loop scenery.outline found, each
       corner rounded off by up to `R` — less where an edge is too short to
       take it. The rounding is a few pixels of picture at a corner and
       nothing else: the physics tests the rectangles and polygons
       themselves, which is the same bargain the bunkers have always made
       with their 34px corners. */
    function loopPath(g, loops, R) {
        g.beginPath();
        for (var k = 0; k < loops.length; k++) {
            var loop = loops[k], n = loop.length;
            var p = loop[n - 1], q = loop[0];
            g.moveTo((p.x + q.x) / 2, (p.y + q.y) / 2);
            for (var i = 0; i < n; i++) {
                var a = loop[i], b = loop[(i + 1) % n], z = loop[(i + n - 1) % n];
                var r = Math.min(R, Math.hypot(a.x - z.x, a.y - z.y) / 2, Math.hypot(b.x - a.x, b.y - a.y) / 2);
                g.arcTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2, r);
            }
            g.closePath();
        }
    }

    function boundsOf(loops) {
        var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
        loops.forEach(function (l) {
            l.forEach(function (p) {
                if (p.x < b.x0) b.x0 = p.x; if (p.x > b.x1) b.x1 = p.x;
                if (p.y < b.y0) b.y0 = p.y; if (p.y > b.y1) b.y1 = p.y;
            });
        });
        return b;
    }

    function areaOf(loops) {
        return loops.reduce(function (t, l) { return t + SC.signedArea(l); }, 0);
    }

    /* ── turf ───────────────────────────────────────────────────────────

       One static image per hole and biome: the base colour drifts a few
       degrees per hole — high summer at one end of the course, a shaded
       valley at the other — the mow angle and stripe width come from the
       hole too, so a hole is recognisable from its lawn before you have read
       its name. Kept apart from the rest of the ground so the editor, which
       redraws its hazards live, still gets the lawn for free. */
    var turf = null, turfKey = null;

    function makeTurf(seed, theme) {
        var c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        var g = c.getContext('2d');

        var hue = theme.turf.h + Math.round((hash(seed) - 0.5) * 14);
        var lum = theme.turf.l + Math.round(hash(seed + 9) * 5);
        g.fillStyle = 'hsl(' + hue + ', ' + theme.turf.s + '%, ' + lum + '%)';
        g.fillRect(0, 0, W, H);

        var angle = -0.55 + hash(seed + 3) * 1.1;
        var band = 44 + Math.round(hash(seed + 5) * 34);
        g.save();
        g.translate(W / 2, H / 2);
        g.rotate(angle);
        g.translate(-W, -H);
        var bands = Math.ceil(W * 3 / band);
        for (var i = 0; i < bands; i++) {
            g.fillStyle = i % 2 ? 'rgba(255,255,255,0.040)' : 'rgba(0,0,0,0.040)';
            g.fillRect(i * band, 0, band, H * 3);
        }
        // A hairline at each stripe boundary — the cut edge the mower leaves.
        g.strokeStyle = 'rgba(0,0,0,0.05)';
        g.lineWidth = 1;
        for (i = 0; i < bands; i++) {
            g.beginPath();
            g.moveTo(i * band, 0);
            g.lineTo(i * band, H * 3);
            g.stroke();
        }
        g.restore();

        // Speckle: a few thousand one-pixel blades so flat colour does not
        // read as plastic when the ball rolls over it.
        for (var n = 0; n < 3000; n++) {
            var x = hash(seed * 31 + n) * W, y = hash(seed * 17 + n * 3.7) * H;
            g.fillStyle = hash(n * 5.3) < 0.5 ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.065)';
            g.fillRect(x, y, 1.6, 1.6);
        }
        // Hoar frost: a second, paler speckle on a winter lawn.
        if (theme.turf.frost) {
            g.fillStyle = 'rgba(240, 250, 255, ' + theme.turf.frost + ')';
            for (n = 0; n < 2600; n++) {
                g.fillRect(hash(seed * 13 + n * 1.9) * W, hash(seed * 29 + n * 2.3) * H, 1.4, 1.4);
            }
        }

        var vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,0,0,0.36)');
        g.fillStyle = vg;
        g.fillRect(0, 0, W, H);
        return c;
    }

    function turfFor(seed, theme) {
        var key = seed + '/' + theme.name;
        if (!turf || turfKey !== key) { turf = makeTurf(seed, theme); turfKey = key; }
        return turf;
    }

    /* The putting green: a disc of shorter grass around the cup, mown in
       rings. Decoration in the strict sense — the physics has never heard of
       it — and the one piece of the picture that tells you where the hole is
       from across the field. Faded at the rim rather than cut off at it: a
       hard circle of paler grass reads as a target painted on the field. */
    function drawGreen(g, hole) {
        var R = 96;
        g.save();
        g.beginPath();
        g.arc(hole.x, hole.y, R, 0, Math.PI * 2);
        g.clip();
        var grad = g.createRadialGradient(hole.x, hole.y, 6, hole.x, hole.y, R);
        grad.addColorStop(0, 'rgba(214, 255, 214, 0.15)');
        grad.addColorStop(0.62, 'rgba(200, 250, 200, 0.10)');
        grad.addColorStop(1, 'rgba(190, 245, 190, 0)');
        g.fillStyle = grad;
        g.fillRect(hole.x - R, hole.y - R, R * 2, R * 2);
        g.lineWidth = 6;
        for (var r = 14; r < R - 8; r += 16) {
            g.strokeStyle = 'rgba(255,255,255,' + (0.05 * (1 - r / R)).toFixed(3) + ')';
            g.beginPath();
            g.arc(hole.x, hole.y, r, 0, Math.PI * 2);
            g.stroke();
        }
        g.restore();
    }

    // The tee is a mat, not a chalk circle: the first thing a hole is about
    // should look like something you would stand on.
    function drawTee(g, tee, v) {
        g.save();
        var s = sv(v, 2, 3);
        g.fillStyle = 'rgba(0,0,0,0.25)';
        roundRect(g, tee.x - 17 + s.x, tee.y - 17 + s.y, 34, 34, 7);
        g.fill();
        roundRect(g, tee.x - 17, tee.y - 17, 34, 34, 7);
        g.fillStyle = '#1f4f2c';
        g.fill();
        g.strokeStyle = 'rgba(190, 240, 190, 0.35)';
        g.lineWidth = 1.5;
        g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.35)';
        g.lineWidth = 2;
        g.setLineDash([3, 4]);
        g.beginPath();
        g.arc(tee.x, tee.y, 11, 0, Math.PI * 2);
        g.stroke();
        g.restore();
    }

    /* ── the zones ──────────────────────────────────────────────────────── */

    /* Rough: darker, denser, tufted, so "this will cost you" is legible at a
       glance — the same information a bunker's rake lines carry. */
    function drawRough(g, list, theme) {
        if (!list.length) return;
        var loops = SC.outline(list, true);
        var b = boundsOf(loops);
        g.save();
        loopPath(g, loops, 14);
        g.fillStyle = theme.rough.fill;
        g.fill();
        g.clip();
        var seed = b.x0 * 7 + b.y0 * 13 + b.x1;
        var tufts = Math.min(900, Math.round(Math.abs(areaOf(loops)) / 620));
        g.strokeStyle = theme.rough.tuft;
        g.lineWidth = 1.6;
        g.lineCap = 'round';
        g.beginPath();
        for (var i = 0; i < tufts * 2; i++) {
            var x = b.x0 + hash(seed + i) * (b.x1 - b.x0);
            var y = b.y0 + hash(seed + i * 2.7 + 1) * (b.y1 - b.y0);
            var lean = (hash(seed + i * 3.1) - 0.5) * 5;
            g.moveTo(x, y);
            g.lineTo(x + lean, y - 5 - hash(seed + i * 1.3) * 4);
        }
        g.stroke();
        g.restore();
        g.save();
        loopPath(g, loops, 14);
        g.strokeStyle = theme.rough.edge;
        g.lineWidth = 2;
        g.stroke();
        g.restore();
    }

    /* A bunker is a hollow, and reads as one: the lit lip on the far side,
       a shadow under the near one (an inner stroke pushed towards the light,
       clipped to the sand), and rake lines across the whole of it. */
    function drawSand(g, list, theme, v) {
        if (!list.length) return;
        var loops = SC.outline(list, true);
        var b = boundsOf(loops);
        g.save();
        loopPath(g, loops, 34);
        g.fillStyle = theme.sand.base;
        g.fill();
        g.clip();
        var grad = g.createLinearGradient(0, b.y0, 0, b.y1);
        grad.addColorStop(0, 'rgba(255,255,255,0.22)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(120,90,40,0.18)');
        g.fillStyle = grad;
        g.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
        g.strokeStyle = theme.sand.rake;
        g.lineWidth = 2;
        for (var y = b.y0 + 10; y < b.y1; y += 15) {
            g.beginPath();
            var span = b.x1 - b.x0;
            g.moveTo(b.x0, y);
            g.bezierCurveTo(b.x0 + span * 0.33, y - 6, b.x0 + span * 0.66, y + 6, b.x1, y);
            g.stroke();
        }
        // The hollow: the lip's shadow, thrown down-right off the lit edge.
        var s = sv(v, 3, 4);
        g.translate(s.x, s.y);
        loopPath(g, loops, 34);
        g.translate(-s.x, -s.y);
        g.strokeStyle = theme.sand.lip;
        g.lineWidth = 7;
        g.stroke();
        g.restore();
    }

    /* Ice through three cues rather than colour alone: a pale fill, a rim of
       hard frost, and hairline fractures placed from the shape's own
       coordinates, so the sheet does not crawl about between frames. */
    function drawIce(g, list) {
        if (!list.length) return;
        var loops = SC.outline(list, true);
        var b = boundsOf(loops);
        g.save();
        loopPath(g, loops, 18);
        g.fillStyle = '#bfe4f2';
        g.fill();
        g.clip();
        var grad = g.createLinearGradient(b.x0, b.y0, b.x1, b.y1);
        grad.addColorStop(0, 'rgba(255,255,255,0.55)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.10)');
        grad.addColorStop(1, 'rgba(96,165,250,0.35)');
        g.fillStyle = grad;
        g.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
        g.strokeStyle = 'rgba(255,255,255,0.55)';
        g.lineWidth = 1.4;
        var cracks = Math.max(5, Math.round(Math.abs(areaOf(loops)) / 7000));
        for (var i = 0; i < cracks; i++) {
            var sx = b.x0 + ((i * 97 + 31) % 100) / 100 * (b.x1 - b.x0);
            var sy = b.y0 + ((i * 61 + 17) % 100) / 100 * (b.y1 - b.y0);
            var a = (i * 1.7) % (Math.PI * 2), len = 26 + (i % 3) * 22;
            g.beginPath();
            g.moveTo(sx, sy);
            g.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len);
            g.lineTo(sx + Math.cos(a) * len + Math.cos(a + 1.1) * len * 0.6,
                     sy + Math.sin(a) * len + Math.sin(a + 1.1) * len * 0.6);
            g.stroke();
        }
        g.restore();
        g.save();
        loopPath(g, loops, 18);
        g.strokeStyle = 'rgba(240,253,255,0.75)';
        g.lineWidth = 3;
        g.stroke();
        g.restore();
    }

    function drawSlope(g, s) {
        var mag = Math.hypot(s.ax, s.ay);
        if (mag < 1) return;
        var ux = s.ax / mag, uy = s.ay / mag;
        g.save();
        roundRect(g, s.x, s.y, s.w, s.h, 8);
        g.clip();
        // Light at the high end, shadow at the low end: the cue a real green
        // gives you.
        var grad = g.createLinearGradient(s.x + s.w / 2 - ux * s.w / 2, s.y + s.h / 2 - uy * s.h / 2,
                                          s.x + s.w / 2 + ux * s.w / 2, s.y + s.h / 2 + uy * s.h / 2);
        grad.addColorStop(0, 'rgba(255,255,255,0.11)');
        grad.addColorStop(1, 'rgba(0,0,0,0.20)');
        g.fillStyle = grad;
        g.fillRect(s.x, s.y, s.w, s.h);
        // Chevrons pointing downhill.
        g.strokeStyle = 'rgba(255,255,255,0.16)';
        g.lineWidth = 2.5;
        g.lineCap = 'round';
        var step = 58;
        for (var y = s.y + step / 2; y < s.y + s.h; y += step) {
            for (var x = s.x + step / 2; x < s.x + s.w; x += step) {
                g.save();
                g.translate(x, y);
                g.rotate(Math.atan2(uy, ux));
                g.beginPath();
                g.moveTo(-8, -7); g.lineTo(2, 0); g.lineTo(-8, 7);
                g.stroke();
                g.restore();
            }
        }
        g.restore();
    }

    /* ── water ──────────────────────────────────────────────────────────

       All of a hole's water in one shape: the outline of every rectangle and
       polygon in the list, with a shore round the outside only, so a lake
       built of six boxes is one lake. Depth is a shadow inside the far bank;
       the surface moves. What lives on it depends on the biome — a pond has
       reeds and lily pads and sometimes a duck, the sea has surf. */
    /* Water lies below the grass. Seen from above and in front, the way
       the walls are, that shows as the face of the far bank standing above
       the waterline: the surface is the water's own outline moved a few
       pixels down the screen, and what it uncovers along the top of every
       pond is earth, sand, stone or snow. Only the picture moves; the
       physics' water is where it always was, bank face and all. */
    function bankDepth(theme) { return theme.water.kind === 'sea' ? 4 : 8; }

    function surfacePath(g, loops, v, theme) {
        var dn = sv(v, 0, bankDepth(theme));
        g.translate(dn.x, dn.y);
        loopPath(g, loops, 22);
        g.translate(-dn.x, -dn.y);
    }

    /* The part of the water that holds still — the shore, the bank's face,
       the body and the depth under the near bank — is painted into the
       ground layer once. */
    function drawWaterBed(g, list, theme, v) {
        if (!list || !list.length) return;
        var loops = SC.outline(list, true);
        var b = boundsOf(loops);
        var w = theme.water, sea = w.kind === 'sea';
        g.save();
        loopPath(g, loops, 22);
        g.strokeStyle = w.shore;
        g.lineWidth = sea ? 14 : 8;
        g.lineJoin = 'round';
        g.stroke();
        // The bank's face: lit along the lip, darker down to the waterline.
        g.fillStyle = w.bank || '#5d4a2f';
        g.fill();
        g.clip();
        g.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        g.lineWidth = 3;
        g.stroke();
        surfacePath(g, loops, v, theme);
        g.strokeStyle = 'rgba(0, 0, 0, 0.32)';
        g.lineWidth = 7;
        g.stroke();
        // The surface, below it.
        var grad = g.createLinearGradient(0, b.y0, 0, b.y1);
        grad.addColorStop(0, w.top);
        grad.addColorStop(1, w.deep);
        g.fillStyle = grad;
        g.fill();
        g.clip();
        // Depth: the bank's shadow on the water nearest the light.
        var s = sv(v, 4, 6);
        g.save();
        g.translate(s.x, s.y);
        loopPath(g, loops, 22);
        g.restore();
        g.strokeStyle = 'rgba(0, 20, 40, 0.28)';
        g.lineWidth = 12;
        g.stroke();
        if (sea) {
            g.strokeStyle = 'rgba(255, 255, 255, 0.14)';
            loopPath(g, loops, 22);
            g.lineWidth = 22;
            g.stroke();
        }
        // The waterline catches the light.
        surfacePath(g, loops, v, theme);
        g.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        g.lineWidth = 2;
        g.stroke();
        g.restore();
    }

    /* The part that moves: the surface, and what lives on it. Where the
       browser can, the surface is water.js's shader; where it cannot, it is
       the rows of waves and the dashed surf this has always drawn. */
    function drawWater(g, list, theme, v, t, clock, dec, opts) {
        if (!list || !list.length) return;
        var loops = SC.outline(list, true);
        var b = boundsOf(loops);
        var w = theme.water, sea = w.kind === 'sea';

        g.save();
        loopPath(g, loops, 22);
        g.clip();
        surfacePath(g, loops, v, theme);
        g.clip();

        var shaded = !!(GOLF.water && GOLF.water.draw(g, list, theme, v, opts && opts.still ? 0 : clock, opts));
        if (!shaded) plainSurface(g, b, w, sea, loops, t, clock);
        if (dec && dec.moon) moon(g, dec.moon, v);

        if (dec) {
            var i;
            for (i = 0; i < dec.pads.length; i++) {
                if (w.pads === 'leaf') floatingLeaf(g, dec.pads[i], clock, theme);
                else pad(g, dec.pads[i], clock);
            }
            for (i = 0; i < dec.ducks.length; i++) duck(g, dec.ducks[i], clock);
        }
        g.restore();

        // Reeds and rocks at the edge stand up out of the water, over the
        // shoreline, so they are drawn after the clip comes off.
        if (dec) {
            if (w.edge === 'rocks') {
                for (var k = 0; k < dec.shore.length; k++) if (dec.shore[k].big) rock(g, dec.shore[k], v, w.snow);
            } else {
                reeds(g, dec.shore, v, clock);
            }
        }
    }

    function plainSurface(g, b, w, sea, loops, t, clock) {
        // Every row of waves in one path and one stroke: on a phone the
        // stroke calls, not the points, were most of what water cost.
        g.strokeStyle = w.wave;
        g.lineWidth = 2;
        g.beginPath();
        var x0 = Math.max(b.x0, 0), x1 = Math.min(b.x1, W);
        for (var row = Math.max(b.y0, 0) + 15; row < Math.min(b.y1, H); row += 32) {
            g.moveTo(x0, row + Math.sin(x0 * 0.05 + t * 1.6 + row * 0.4) * 3);
            for (var x = x0 + 12; x <= x1 + 11; x += 12) {
                g.lineTo(x, row + Math.sin(x * 0.05 + t * 1.6 + row * 0.4) * 3);
            }
        }
        g.stroke();

        if (sea) {
            // Surf: a broken white line running round just inside the shore.
            loopPath(g, loops, 22);
            g.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            g.lineWidth = 5;
            g.setLineDash([14, 10]);
            g.lineDashOffset = -clock * 12;
            g.stroke();
            g.setLineDash([]);
        }
    }

    /* The moon on a pond after dark: a soft pale glow on the deepest water,
       drawn before the waves so the ripples run across it. */
    function moon(g, m, v) {
        var up = sv(v, -26, -18);
        var x = m.x + up.x, y = m.y + up.y;
        var glow = g.createRadialGradient(x, y, 2, x, y, 40);
        glow.addColorStop(0, 'rgba(240, 244, 255, 0.55)');
        glow.addColorStop(0.3, 'rgba(235, 240, 255, 0.22)');
        glow.addColorStop(1, 'rgba(235, 240, 255, 0)');
        g.fillStyle = glow;
        g.fillRect(x - 40, y - 40, 80, 80);
    }

    // An autumn pond has no lily pads; it has the leaves the trees dropped.
    function floatingLeaf(g, p, clock, theme) {
        var pal = theme.leaves;
        g.save();
        g.translate(p.x + Math.sin(clock * 0.3 + p.a) * 3, p.y + Math.cos(clock * 0.25 + p.a) * 2);
        g.rotate(p.a + Math.sin(clock * 0.4 + p.a) * 0.2);
        var L0 = p.r * 0.9;
        g.fillStyle = 'rgba(0, 20, 30, 0.25)';
        g.beginPath(); g.ellipse(2, 2, L0, L0 * 0.45, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = pal[((p.a * 10) | 0) % pal.length];
        g.beginPath(); g.ellipse(0, 0, L0, L0 * 0.45, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(60, 25, 5, 0.45)';
        g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(-L0 - 3, 0); g.lineTo(L0, 0); g.stroke();
        g.restore();
    }

    function pad(g, p, clock) {
        var bob = Math.sin(clock * 0.8 + p.a) * 0.06;
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.a + bob);
        g.fillStyle = 'rgba(0, 30, 20, 0.25)';
        g.beginPath();
        g.ellipse(2, 2, p.r, p.r * 0.92, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#4f9a4a';
        g.beginPath();
        g.moveTo(0, 0);
        g.arc(0, 0, p.r, 0.35, Math.PI * 2 - 0.05);
        g.closePath();
        g.fill();
        g.strokeStyle = 'rgba(200, 255, 190, 0.35)';
        g.lineWidth = 1;
        g.stroke();
        if (p.flower) {
            g.fillStyle = '#f9a8d4';
            for (var i = 0; i < 6; i++) {
                g.beginPath();
                g.ellipse(Math.cos(i * 1.05) * 2.6, Math.sin(i * 1.05) * 2.6, 2.4, 1.3, i * 1.05, 0, Math.PI * 2);
                g.fill();
            }
            g.fillStyle = '#fde68a';
            g.beginPath();
            g.arc(0, 0, 1.4, 0, Math.PI * 2);
            g.fill();
        }
        g.restore();
    }

    // A duck paddling round the deepest part of a pond, with its wake.
    function duck(g, d, clock) {
        var a = clock * 0.22 + d.p;
        var x = d.x + Math.cos(a) * d.r, y = d.y + Math.sin(a) * d.r * 0.7;
        var head = a + Math.PI / 2;
        g.save();
        g.translate(x, y);
        g.rotate(head);
        g.scale(1.45, 1.45);
        g.strokeStyle = 'rgba(255,255,255,0.22)';
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(-8, -3); g.lineTo(-22, -9);
        g.moveTo(-8, 3); g.lineTo(-22, 9);
        g.stroke();
        g.fillStyle = 'rgba(0,0,0,0.25)';
        g.beginPath();
        g.ellipse(1.5, 2, 8.5, 5.5, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#8a6a4a';
        g.beginPath();
        g.ellipse(0, 0, 8.5, 5.5, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#d8d2c4';
        g.beginPath();
        g.ellipse(-1, 0, 4.5, 3.2, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#1f6b3a';
        g.beginPath();
        g.arc(7, 0, 3.4, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#f59e0b';
        g.beginPath();
        g.moveTo(9.5, -1.2); g.lineTo(13, 0); g.lineTo(9.5, 1.2);
        g.closePath();
        g.fill();
        g.restore();
    }

    // Reeds stand *up* — towards the top of the screen, whichever way the
    // board is turned — and lean a little in the wind. Every clump on the
    // hole in three strokes: the stems, and the seed heads.
    function reeds(g, list, v, clock) {
        if (!list.length) return;
        var up = sv(v, 0, -1), right = sv(v, 1, 0);
        var stems = new Segments(), heads = new Segments();
        for (var c = 0; c < list.length; c++) {
            var s = list[c];
            var sway = Math.sin(clock * 1.2 + s.r * 9) * 1.6;
            var n = s.big ? 5 : 3;
            for (var i = 0; i < n; i++) {
                var off = (i - (n - 1) / 2) * 3.2;
                var len = 11 + ((s.r * 97 + i * 13) % 7);
                var bx = s.x + right.x * off, by = s.y + right.y * off;
                var tx = bx + up.x * len + right.x * (sway + off * 0.4), ty = by + up.y * len + right.y * (sway + off * 0.4);
                stems.seg(bx, by, tx, ty);
                if (i % 2 === 0) heads.seg(tx - up.x * 4, ty - up.y * 4, tx - up.x * 0.5, ty - up.y * 0.5);
            }
        }
        g.save();
        g.lineCap = 'round';
        g.strokeStyle = '#64993f';
        g.lineWidth = 1.6;
        stems.stroke(g);
        g.strokeStyle = '#6b4423';
        g.lineWidth = 3;
        heads.stroke(g);
        g.restore();
    }

    // A list of line segments laid into one path at stroke time.
    function Segments() { this.p = []; }
    Segments.prototype.seg = function (a, b, c, d) { this.p.push(a, b, c, d); };
    Segments.prototype.stroke = function (g) {
        g.beginPath();
        for (var i = 0; i < this.p.length; i += 4) { g.moveTo(this.p[i], this.p[i + 1]); g.lineTo(this.p[i + 2], this.p[i + 3]); }
        g.stroke();
    };

    function rock(g, s, v, snowy) {
        var sh = sv(v, 2, 3);
        var r = 6 + s.r * 5;
        g.save();
        g.fillStyle = 'rgba(0,0,0,0.25)';
        g.beginPath();
        g.ellipse(s.x + sh.x, s.y + sh.y, r, r * 0.8, s.a, 0, Math.PI * 2);
        g.fill();
        var hl = sv(v, -r * 0.3, -r * 0.35);
        var grad = g.createRadialGradient(s.x + hl.x, s.y + hl.y, 1, s.x, s.y, r);
        grad.addColorStop(0, '#c7c2b8');
        grad.addColorStop(1, '#6f6a62');
        g.fillStyle = grad;
        g.beginPath();
        g.ellipse(s.x, s.y, r, r * 0.8, s.a, 0, Math.PI * 2);
        g.fill();
        if (snowy) {
            // Snow lies on the lit top of the stone.
            // Only a cap of it: a white stone is a ball sitting by the water.
            g.save();
            g.beginPath();
            g.ellipse(s.x, s.y, r, r * 0.8, s.a, 0, Math.PI * 2);
            g.clip();
            g.fillStyle = 'rgba(244, 249, 255, 0.85)';
            g.beginPath();
            g.ellipse(s.x + hl.x * 1.6, s.y + hl.y * 1.6, r * 0.8, r * 0.55, s.a, 0, Math.PI * 2);
            g.fill();
            g.restore();
        }
        g.restore();
    }

    /* ── decals ─────────────────────────────────────────────────────────

       Flat things in the grass, painted into the ground once per hole. Each
       biome has its own few, and they are small enough to be texture rather
       than objects — nothing here is in the way of anything, by placement
       (scenery.decor) and by size. */
    var PETALS = ['#f9a8d4', '#c084fc', '#fde047', '#ffffff', '#fb7185', '#93c5fd'];

    function drawDecals(g, list, theme) {
        for (var i = 0; i < list.length; i++) decal(g, list[i], theme);
    }

    function decal(g, d, theme) {
        g.save();
        // Out on the fairway everything is drawn faint: texture, not things.
        if (d.soft) g.globalAlpha = 0.5;
        g.translate(d.x, d.y);
        g.rotate(d.a);
        g.scale(d.s, d.s);
        var k;
        switch (d.kind) {
            case 'daisy':
                g.fillStyle = '#ffffff';
                for (k = 0; k < 6; k++) { g.beginPath(); g.ellipse(Math.cos(k * 1.05) * 2.4, Math.sin(k * 1.05) * 2.4, 1.8, 0.9, k * 1.05, 0, Math.PI * 2); g.fill(); }
                g.fillStyle = '#facc15'; g.beginPath(); g.arc(0, 0, 1.3, 0, Math.PI * 2); g.fill();
                break;
            case 'flower':
            case 'poppy':
            case 'cornflower':
            case 'bloom':
                g.fillStyle = d.kind === 'poppy' ? '#ef4444' : d.kind === 'cornflower' ? '#60a5fa' :
                    d.kind === 'bloom' ? (d.t < 0.5 ? '#e879f9' : '#fbbf24') : PETALS[(d.t * PETALS.length) | 0];
                for (k = 0; k < 5; k++) { g.beginPath(); g.arc(Math.cos(k * 1.26) * 2.2, Math.sin(k * 1.26) * 2.2, 1.9, 0, Math.PI * 2); g.fill(); }
                g.fillStyle = d.kind === 'poppy' ? '#1f2937' : '#fde68a';
                g.beginPath(); g.arc(0, 0, 1.2, 0, Math.PI * 2); g.fill();
                break;
            case 'clover':
                g.fillStyle = 'rgba(30, 90, 40, 0.55)';
                for (k = 0; k < 3; k++) { g.beginPath(); g.arc(Math.cos(k * 2.09) * 2.2, Math.sin(k * 2.09) * 2.2, 2.1, 0, Math.PI * 2); g.fill(); }
                break;
            case 'leaf':
                var pal = theme.leaves;
                g.fillStyle = pal[(d.t * pal.length) | 0];
                g.beginPath(); g.ellipse(0, 0, 5, 2.4, 0, 0, Math.PI * 2); g.fill();
                g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 0.7;
                g.beginPath(); g.moveTo(-5, 0); g.lineTo(5, 0); g.stroke();
                break;
            case 'stone':
                g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(1, 1.5, 7, 5, 0, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#b8b2a5'; g.beginPath(); g.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2); g.fill();
                g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.ellipse(-2, -1.5, 3, 1.8, 0, 0, Math.PI * 2); g.fill();
                break;
            case 'pebble':
                g.fillStyle = '#d6d0c4';
                for (k = 0; k < 3; k++) { g.beginPath(); g.ellipse(k * 3 - 3, (k % 2) * 2, 1.8, 1.3, 0, 0, Math.PI * 2); g.fill(); }
                break;
            case 'shell':
                g.fillStyle = '#fbe3cf';
                g.beginPath(); g.moveTo(0, 2.5); g.arc(0, 2.5, 5, Math.PI * 1.1, Math.PI * 1.9); g.closePath(); g.fill();
                g.strokeStyle = 'rgba(180, 120, 90, 0.6)'; g.lineWidth = 0.6;
                for (k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(0, 2.5); g.lineTo(k * 1.8, -1.8); g.stroke(); }
                break;
            case 'starfish':
                g.fillStyle = '#f97316';
                g.beginPath();
                for (k = 0; k < 10; k++) {
                    var rr = k % 2 ? 1.6 : 4.6, aa = k * Math.PI / 5;
                    g.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
                }
                g.closePath(); g.fill();
                break;
            case 'cone':
                g.fillStyle = '#7c4a22'; g.beginPath(); g.ellipse(0, 0, 4, 2.6, 0, 0, Math.PI * 2); g.fill();
                g.strokeStyle = 'rgba(40, 20, 5, 0.6)'; g.lineWidth = 0.6;
                for (k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * 1.4, -2.4); g.lineTo(k * 1.4 + 1, 2.4); g.stroke(); }
                break;
            case 'snowclump':
                // A drift, long and low and soft at the edge — never a round
                // white thing the size of a ball.
                g.fillStyle = 'rgba(236, 244, 252, 0.32)';
                g.beginPath(); g.ellipse(0, 0, 17, 5, 0, 0, Math.PI * 2); g.fill();
                g.fillStyle = 'rgba(244, 249, 255, 0.45)';
                g.beginPath(); g.ellipse(-3, -0.5, 10, 3, 0, 0, Math.PI * 2); g.fill();
                break;
            case 'frost':
                g.strokeStyle = 'rgba(240, 250, 255, 0.8)'; g.lineWidth = 0.8;
                g.beginPath();
                for (k = 0; k < 3; k++) { var fa = k * Math.PI / 3; g.moveTo(-Math.cos(fa) * 3.5, -Math.sin(fa) * 3.5); g.lineTo(Math.cos(fa) * 3.5, Math.sin(fa) * 3.5); }
                g.stroke();
                break;
            case 'toadstool':
                g.fillStyle = '#dc2626'; g.beginPath(); g.arc(0, 0, 3, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#ffffff';
                g.beginPath(); g.arc(-1, -0.8, 0.7, 0, Math.PI * 2); g.arc(1.2, 0.4, 0.6, 0, Math.PI * 2); g.fill();
                break;
        }
        g.restore();
    }

    /* ── walls ──────────────────────────────────────────────────────────

       A material per biome, each a top colour, a near-face colour and a
       texture: timber sleepers in the parkland, brick in the garden,
       driftwood by the sea, logs in the wood, a clipped hedge in the meadow,
       dry stone in the autumn, logs under snow in the winter, layered
       sandstone in the desert.
       A wall that moves keeps its hazard stripes whatever it is made of — a
       player who gets hit by one should at least have known it was coming. */
    var MATERIAL = {
        timber:    { top: '#6d4a2e', side: '#3c2715', move: '#8a5a34', grain: 'rgba(60,36,16,0.22)', hi: 'rgba(255,236,200,0.22)' },
        brick:     { top: '#9c4f36', side: '#5a2b1b', move: '#b0623f', grain: 'rgba(240,220,200,0.35)', hi: 'rgba(255,220,200,0.25)' },
        driftwood: { top: '#ae9c80', side: '#685b47', move: '#c2ac84', grain: 'rgba(80,65,45,0.30)', hi: 'rgba(255,250,235,0.32)' },
        log:       { top: '#7a4c2b', side: '#3b230e', move: '#8f5a33', grain: 'rgba(35,18,6,0.40)', hi: 'rgba(240,200,150,0.20)' },
        hedge:     { top: '#2f6d33', side: '#163a1a', move: '#3f8040', grain: 'rgba(10,40,12,0.40)', hi: 'rgba(200,255,180,0.18)' },
        stone:     { top: '#8d8f88', side: '#4a4b46', move: '#a3a59c', grain: 'rgba(35,35,30,0.45)', hi: 'rgba(255,255,245,0.24)' },
        snowlog:   { top: '#eef4f8', side: '#4b3423', move: '#f6f9fb', grain: 'rgba(110,140,175,0.30)', hi: 'rgba(255,255,255,0.7)' },
        sandstone: { top: '#c9854f', side: '#7a4526', move: '#d99a62', grain: 'rgba(110,52,22,0.36)', hi: 'rgba(255,226,190,0.30)' }
    };

    function material(theme) { return MATERIAL[theme.wall] || MATERIAL.timber; }

    function drawWall(g, wall, t, theme, v) {
        var R = P.wallRect(wall, t);
        var m = material(theme);
        var moving = !!wall.move;
        var seed = wall.x * 3.1 + wall.y * 7.7 + wall.w;

        // Shadow, then the near face hanging towards the viewer, then the top.
        var s1 = sv(v, 5, 8), s2 = sv(v, 9, 13);
        g.save();
        g.fillStyle = 'rgba(0,0,0,0.12)';
        roundRect(g, R.x + s2.x - 2, R.y + s2.y - 2, R.w + 4, R.h + 4, 9);
        g.fill();
        g.fillStyle = 'rgba(0,0,0,0.24)';
        roundRect(g, R.x + s1.x, R.y + s1.y, R.w, R.h, 7);
        g.fill();
        var ex = v.dx * EXT, ey = v.dy * EXT;
        roundRect(g, R.x + Math.min(0, ex), R.y + Math.min(0, ey), R.w + Math.abs(ex), R.h + Math.abs(ey), 6);
        g.fillStyle = m.side;
        g.fill();
        roundRect(g, R.x, R.y, R.w, R.h, 6);
        g.fillStyle = moving ? m.move : m.top;
        g.fill();
        g.clip();
        texture(g, R, theme.wall, m, seed);
        g.fillStyle = lit(g, R, v, 'rgba(255,255,255,0.26)', 'rgba(0,0,0,0.30)');
        g.fillRect(R.x, R.y, R.w, R.h);
        if (moving) {
            g.strokeStyle = 'rgba(251,191,36,0.55)';
            g.lineWidth = 5;
            for (var d = -R.h; d < R.w + R.h; d += 18) {
                g.beginPath();
                g.moveTo(R.x + d, R.y);
                g.lineTo(R.x + d + R.h, R.y + R.h);
                g.stroke();
            }
        }
        g.restore();
        g.save();
        roundRect(g, R.x + 0.5, R.y + 0.5, R.w - 1, R.h - 1, 6);
        g.strokeStyle = m.hi;
        g.lineWidth = 1;
        g.stroke();
        g.restore();
    }

    // The face of a wall, in its own material. Lines run along its length.
    function texture(g, R, kind, m, seed) {
        var along = R.w >= R.h;
        var len = along ? R.w : R.h, wid = along ? R.h : R.w;
        function line(a0, b0, a1, b1) {
            if (along) { g.moveTo(R.x + a0, R.y + b0); g.lineTo(R.x + a1, R.y + b1); }
            else { g.moveTo(R.x + b0, R.y + a0); g.lineTo(R.x + b1, R.y + a1); }
        }
        var k, a;
        g.strokeStyle = m.grain;
        g.lineWidth = 1;
        g.beginPath();
        if (kind === 'brick') {
            g.lineWidth = 1.4;
            for (k = 10; k < wid; k += 10) line(0, k, len, k);
            for (k = 0; k * 10 < wid; k++) {
                for (a = (k % 2) * 11; a < len; a += 22) line(a, k * 10, a, Math.min(wid, k * 10 + 10));
            }
        } else if (kind === 'hedge') {
            g.stroke();
            for (k = 0; k < len * wid / 26; k++) {
                var hx = hash(seed + k) * len, hy = hash(seed + k * 1.7) * wid;
                g.fillStyle = hash(seed + k * 2.3) < 0.5 ? 'rgba(80,150,70,0.55)' : 'rgba(15,55,20,0.45)';
                g.beginPath();
                if (along) g.arc(R.x + hx, R.y + hy, 2.4, 0, Math.PI * 2);
                else g.arc(R.x + hy, R.y + hx, 2.4, 0, Math.PI * 2);
                g.fill();
            }
            // A few flowers in the clipping.
            for (k = 0; k < len / 40; k++) {
                var fx = hash(seed + k * 9.1) * len, fy = hash(seed + k * 4.3) * wid;
                g.fillStyle = hash(seed + k) < 0.5 ? '#fbcfe8' : '#fef9c3';
                g.beginPath();
                if (along) g.arc(R.x + fx, R.y + fy, 1.6, 0, Math.PI * 2);
                else g.arc(R.x + fy, R.y + fx, 1.6, 0, Math.PI * 2);
                g.fill();
            }
            g.beginPath();
        } else if (kind === 'stone') {
            // Dry stone: two courses of uneven stones, each its own shade.
            g.stroke();
            var rows = Math.max(1, Math.round(wid / 11)), rh = wid / rows;
            for (k = 0; k < rows; k++) {
                for (a = -(hash(seed + k) * 8); a < len; ) {
                    var sw = 9 + hash(seed + a * 0.37 + k * 5.1) * 12;
                    var tone = hash(seed + a * 0.71 + k * 3.3);
                    g.fillStyle = tone < 0.33 ? 'rgba(255,255,240,0.14)' : tone < 0.66 ? 'rgba(0,0,0,0.10)' : 'rgba(120,110,90,0.16)';
                    var bx0 = Math.max(0, a) + 0.8, bx1 = Math.min(len, a + sw) - 0.8;
                    if (bx1 > bx0) {
                        if (along) roundRect(g, R.x + bx0, R.y + k * rh + 0.8, bx1 - bx0, rh - 1.6, 2.5);
                        else roundRect(g, R.x + k * rh + 0.8, R.y + bx0, rh - 1.6, bx1 - bx0, 2.5);
                        g.fill();
                        g.stroke();
                    }
                    a += sw;
                }
            }
            g.beginPath();
        } else if (kind === 'snowlog') {
            // Snow on a log: soft blue hollows where it lies thinner.
            g.stroke();
            for (k = 0; k < len / 14; k++) {
                var sx2 = hash(seed + k * 2.9) * len, sy2 = hash(seed + k * 6.1) * wid;
                g.fillStyle = 'rgba(150, 180, 215, 0.22)';
                g.beginPath();
                if (along) g.ellipse(R.x + sx2, R.y + sy2, 5, 2.2, 0, 0, Math.PI * 2);
                else g.ellipse(R.x + sy2, R.y + sx2, 2.2, 5, 0, 0, Math.PI * 2);
                g.fill();
            }
            g.beginPath();
        } else if (kind === 'sandstone') {
            // Strata: bands of rock laid down along the wall, gently wavy.
            for (k = 3; k < wid; k += 4 + hash(seed + k) * 3) {
                var amp = 1 + hash(seed + k * 4) * 1.5;
                for (a = 0; a < len; a += 12) line(a, k + Math.sin(a * 0.08 + k) * amp, Math.min(len, a + 12), k + Math.sin((a + 12) * 0.08 + k) * amp);
            }
        } else if (kind === 'log') {
            for (k = 4; k < wid; k += 3 + hash(seed + k) * 4) line(0, k, len, k + (hash(seed + k * 3) - 0.5) * 2);
            g.stroke();
            // Sawn ends: rings at both ends of the length.
            g.fillStyle = '#c49a6c';
            var rr = wid / 2 - 1.5;
            [rr + 1, len - rr - 1].forEach(function (e) {
                g.beginPath();
                if (along) g.ellipse(R.x + e, R.y + wid / 2, rr * 0.55, rr, 0, 0, Math.PI * 2);
                else g.ellipse(R.x + wid / 2, R.y + e, rr, rr * 0.55, 0, 0, Math.PI * 2);
                g.fill();
            });
            g.beginPath();
        } else {
            // Timber and driftwood: grain, and driftwood's knots.
            for (k = 7; k < wid; k += 7) line(0, k, len, k + (kind === 'driftwood' ? (hash(seed + k) - 0.5) * 3 : 0));
            if (kind === 'driftwood') {
                g.stroke();
                g.fillStyle = 'rgba(80,65,45,0.35)';
                for (k = 0; k < len / 60; k++) {
                    var kx = hash(seed + k * 5) * len, ky = hash(seed + k * 7) * wid;
                    g.beginPath();
                    if (along) g.ellipse(R.x + kx, R.y + ky, 3, 1.6, 0, 0, Math.PI * 2);
                    else g.ellipse(R.x + ky, R.y + kx, 1.6, 3, 0, 0, Math.PI * 2);
                    g.fill();
                }
                g.beginPath();
            }
        }
        g.stroke();
    }

    /* A rail is a wall laid at an angle: the same material, the same near
       face and shadow, drawn along its spine. The ends are round because the
       physics collides it as a capsule, and a square end drawn over a round
       one would bounce the ball off a corner nobody can see. */
    function drawRail(g, r, theme, v) {
        var m = material(theme);
        var ang = Math.atan2(r.ty - r.y, r.tx - r.x);
        var L = Math.hypot(r.tx - r.x, r.ty - r.y);
        var hw = r.w / 2;
        function capsule(ox, oy, grow) {
            g.save();
            g.translate(r.x + ox, r.y + oy);
            g.rotate(ang);
            roundRect(g, -hw - grow, -hw - grow, L + r.w + grow * 2, r.w + grow * 2, hw + grow);
            g.restore();
        }
        var s1 = sv(v, 5, 8), s2 = sv(v, 9, 13);
        g.save();
        capsule(s2.x, s2.y, 2); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fill();
        capsule(s1.x, s1.y, 0); g.fillStyle = 'rgba(0,0,0,0.24)'; g.fill();
        g.fillStyle = m.side;
        capsule(v.dx * EXT, v.dy * EXT, 0); g.fill();
        capsule(v.dx * EXT / 2, v.dy * EXT / 2, 0); g.fill();
        capsule(0, 0, 0);
        g.fillStyle = m.top;
        g.fill();
        g.clip();
        g.translate(r.x, r.y);
        g.rotate(ang);
        texture(g, { x: -hw, y: -hw, w: L + r.w, h: r.w }, theme.wall === 'brick' ? 'timber' : theme.wall, m, r.x + r.y);
        g.restore();
        g.save();
        capsule(0, 0, 0);
        // Lit along its upper edge, shaded along its lower, in screen terms.
        var mid = { x: (r.x + r.tx) / 2, y: (r.y + r.ty) / 2 };
        g.fillStyle = lit(g, { x: mid.x - L / 2 - hw, y: mid.y - L / 2 - hw, w: L + r.w, h: L + r.w }, v,
            'rgba(255,255,255,0.22)', 'rgba(0,0,0,0.28)');
        g.fill();
        g.strokeStyle = m.hi;
        g.lineWidth = 1;
        g.stroke();
        g.restore();
    }

    /* ── bumpers ────────────────────────────────────────────────────────

       The ring is the post — it is what the ball meets, drawn true to the
       radius the simulation uses, pulsing orange on every card so that
       "livelier than a wall" reads the same in every biome. The cap inside
       it is the biome's: a brass post, a flowerpot, a buoy, a toadstool, a
       hay bale, a pumpkin, a snowman, a barrel cactus, a lamp. It is drawn
       a little up and left of the ring, so it stands on the grass rather
       than being painted on it. */
    function drawBumper(g, b, t, theme, v) {
        var pulse = 0.5 + Math.sin(t * 2.2 + b.x * 0.03) * 0.5;
        var sh = sv(v, 3, 4), up = sv(v, -1, -1.5);
        var cx = b.x + up.x, cy = b.y + up.y, r = b.r - 3.5;
        g.save();
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.beginPath();
        g.ellipse(b.x + sh.x, b.y + sh.y, b.r * 1.02, b.r * 0.92, 0, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        g.strokeStyle = 'rgba(249,115,22,' + (0.55 + pulse * 0.35) + ')';
        g.lineWidth = 3;
        g.stroke();

        var hl = sv(v, -r * 0.35, -r * 0.4);
        var grad, k;
        switch (theme.bumper) {
            case 'pot':
                grad = g.createRadialGradient(cx + hl.x, cy + hl.y, r * 0.15, cx, cy, r);
                grad.addColorStop(0, '#e08a5b'); grad.addColorStop(1, '#8a3a1c');
                g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#3b2616'; g.beginPath(); g.arc(cx, cy, r * 0.66, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#4c9a3f';
                for (k = 0; k < 5; k++) {
                    var la = k * 1.26 + b.x * 0.01;
                    g.beginPath(); g.ellipse(cx + Math.cos(la) * r * 0.35, cy + Math.sin(la) * r * 0.35, r * 0.34, r * 0.16, la, 0, Math.PI * 2); g.fill();
                }
                g.fillStyle = '#f472b6'; g.beginPath(); g.arc(cx, cy, r * 0.2, 0, Math.PI * 2); g.fill();
                break;
            case 'buoy':
                g.fillStyle = '#f8fafc'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#dc2626';
                for (k = 0; k < 2; k++) { g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r, k * Math.PI + 0.4, k * Math.PI + 0.4 + Math.PI / 2); g.closePath(); g.fill(); }
                grad = g.createRadialGradient(cx + hl.x, cy + hl.y, r * 0.1, cx, cy, r);
                grad.addColorStop(0, 'rgba(255,255,255,0.45)'); grad.addColorStop(1, 'rgba(0,0,0,0.25)');
                g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#475569'; g.beginPath(); g.arc(cx, cy, r * 0.22, 0, Math.PI * 2); g.fill();
                break;
            case 'mushroom':
                grad = g.createRadialGradient(cx + hl.x, cy + hl.y, r * 0.1, cx, cy, r);
                grad.addColorStop(0, '#f87171'); grad.addColorStop(1, '#991b1b');
                g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#fff7ed';
                for (k = 0; k < 6; k++) {
                    var sa = k * 1.05 + 0.3, sd = r * (k % 2 ? 0.55 : 0.3);
                    g.beginPath(); g.arc(cx + Math.cos(sa) * sd, cy + Math.sin(sa) * sd, r * (k % 2 ? 0.16 : 0.12), 0, Math.PI * 2); g.fill();
                }
                break;
            case 'hay':
                g.fillStyle = '#d8b04a'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
                g.strokeStyle = 'rgba(140, 100, 20, 0.7)'; g.lineWidth = 1.3;
                g.beginPath();
                for (k = 0; k < 40; k++) { var ha = k * 0.45, hr = r * k / 40; g.lineTo(cx + Math.cos(ha) * hr, cy + Math.sin(ha) * hr); }
                g.stroke();
                grad = g.createRadialGradient(cx + hl.x, cy + hl.y, r * 0.1, cx, cy, r);
                grad.addColorStop(0, 'rgba(255,250,210,0.4)'); grad.addColorStop(1, 'rgba(90,60,10,0.3)');
                g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
                break;
            case 'pumpkin':
                grad = g.createRadialGradient(cx + hl.x, cy + hl.y, r * 0.1, cx, cy, r);
                grad.addColorStop(0, '#fdba74'); grad.addColorStop(1, '#c2410c');
                g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
                // The ribs, running in to the stalk.
                g.strokeStyle = 'rgba(124, 45, 18, 0.55)'; g.lineWidth = 1.3;
                g.beginPath();
                for (k = 0; k < 8; k++) {
                    var pa = k * Math.PI / 4;
                    g.moveTo(cx + Math.cos(pa) * r * 0.22, cy + Math.sin(pa) * r * 0.22);
                    g.quadraticCurveTo(cx + Math.cos(pa + 0.2) * r * 0.7, cy + Math.sin(pa + 0.2) * r * 0.7, cx + Math.cos(pa) * r * 0.96, cy + Math.sin(pa) * r * 0.96);
                }
                g.stroke();
                g.fillStyle = '#4d7c0f'; g.beginPath(); g.arc(cx, cy, r * 0.2, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#65a30d'; g.beginPath(); g.ellipse(cx + r * 0.28, cy - r * 0.08, r * 0.26, r * 0.12, 0.5, 0, Math.PI * 2); g.fill();
                break;
            case 'snowman':
                // Seen the way the walls are, from above and in front: the
                // body, the head stacked on it and so higher up the screen,
                // coal eyes and buttons, a carrot nose and a red scarf.
                var down = Math.atan2(v.dy, v.dx);
                var hd = sv(v, 0, -r * 0.4), hx = cx + hd.x, hy = cy + hd.y, hr = r * 0.52;
                grad = g.createRadialGradient(cx + hl.x, cy + hl.y, r * 0.1, cx, cy, r);
                grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, '#b4c6d8');
                g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#1f2937';
                [0.3, 0.62].forEach(function (d) { var bt = sv(v, 0, r * d); g.beginPath(); g.arc(cx + bt.x, cy + bt.y, r * 0.07, 0, Math.PI * 2); g.fill(); });
                g.fillStyle = 'rgba(60, 90, 120, 0.25)'; g.beginPath(); g.arc(hx, hy + 0, hr * 1.05, 0, Math.PI * 2); g.fill();
                grad = g.createRadialGradient(hx + hl.x * 0.5, hy + hl.y * 0.5, r * 0.05, hx, hy, hr);
                grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, '#c6d4e3');
                g.fillStyle = grad; g.beginPath(); g.arc(hx, hy, hr, 0, Math.PI * 2); g.fill();
                g.strokeStyle = '#c81e1e'; g.lineWidth = r * 0.14; g.lineCap = 'round';
                g.beginPath(); g.arc(hx, hy, hr * 0.98, down - 1.05, down + 1.05); g.stroke();
                g.fillStyle = '#111827';
                [-1, 1].forEach(function (sd) { var e = sv(v, sd * hr * 0.36, -hr * 0.12); g.beginPath(); g.arc(hx + e.x, hy + e.y, r * 0.065, 0, Math.PI * 2); g.fill(); });
                var n0 = sv(v, 0, hr * 0.22), n1 = sv(v, hr * 0.62, hr * 0.36), nw = sv(v, 0, hr * 0.1);
                g.fillStyle = '#f97316';
                g.beginPath(); g.moveTo(hx + n0.x - nw.x, hy + n0.y - nw.y); g.lineTo(hx + n1.x, hy + n1.y); g.lineTo(hx + n0.x + nw.x, hy + n0.y + nw.y); g.closePath(); g.fill();
                break;
            case 'cactus':
                grad = g.createRadialGradient(cx + hl.x, cy + hl.y, r * 0.1, cx, cy, r);
                grad.addColorStop(0, '#86c06a'); grad.addColorStop(1, '#2f6b35');
                g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
                g.strokeStyle = 'rgba(20, 60, 25, 0.55)'; g.lineWidth = 1.1;
                g.beginPath();
                for (k = 0; k < 12; k++) { var ca = k * Math.PI / 6; g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ca) * r, cy + Math.sin(ca) * r); }
                g.stroke();
                g.fillStyle = 'rgba(255, 250, 220, 0.8)';
                for (k = 0; k < 12; k++) {
                    var ta = k * Math.PI / 6 + 0.26;
                    g.fillRect(cx + Math.cos(ta) * r * 0.72 - 0.6, cy + Math.sin(ta) * r * 0.72 - 0.6, 1.2, 1.2);
                }
                g.fillStyle = '#f472b6';
                for (k = 0; k < 5; k++) { g.beginPath(); g.arc(cx + Math.cos(k * 1.26) * r * 0.16, cy + Math.sin(k * 1.26) * r * 0.16, r * 0.14, 0, Math.PI * 2); g.fill(); }
                g.fillStyle = '#fde68a'; g.beginPath(); g.arc(cx, cy, r * 0.09, 0, Math.PI * 2); g.fill();
                break;
            case 'lamp':
                // A lantern globe, lit: the light it throws is ambience.js's.
                grad = g.createRadialGradient(cx + hl.x * 0.4, cy + hl.y * 0.4, r * 0.05, cx, cy, r);
                grad.addColorStop(0, '#fffbeb'); grad.addColorStop(0.45, '#fde68a'); grad.addColorStop(1, '#d97706');
                g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
                g.strokeStyle = 'rgba(60, 40, 20, 0.6)'; g.lineWidth = 1.2;
                g.beginPath();
                for (k = 0; k < 4; k++) { var la2 = k * Math.PI / 2 + 0.4; g.moveTo(cx + Math.cos(la2) * r * 0.3, cy + Math.sin(la2) * r * 0.3); g.lineTo(cx + Math.cos(la2) * r, cy + Math.sin(la2) * r); }
                g.stroke();
                g.fillStyle = '#3f2d1c'; g.beginPath(); g.arc(cx, cy, r * 0.22, 0, Math.PI * 2); g.fill();
                break;
            default:
                grad = g.createRadialGradient(cx + hl.x, cy + hl.y, b.r * 0.15, b.x, b.y, b.r);
                grad.addColorStop(0, '#fde68a'); grad.addColorStop(0.55, '#f59e0b'); grad.addColorStop(1, '#b45309');
                g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
                g.fillStyle = 'rgba(255,255,255,' + (0.25 + pulse * 0.45) + ')';
                g.beginPath(); g.arc(cx, cy, b.r * 0.32, 0, Math.PI * 2); g.fill();
        }
        g.restore();
    }

    /* ── trees, clouds and the rim ──────────────────────────────────────

       The crowns of trees that stand just off the course, reaching in over
       its edge — the one thing drawn over the ball. scenery.decor keeps them
       far from the tee, the cup and every mouth, and a crown the ball rolls
       under goes thin, so it can cover a stretch of cushion and never the
       ball on it. Their shadows are on the ground layer. */
    var CANOPY = {
        oak: ['#2f6f2f', '#3d8a3a', '#255a26'],
        blossom: ['#3f7d3a', '#57994d', '#2c5e2a'],
        palm: ['#4d8c2b', '#6aa33a', '#3a6e21'],
        pine: ['#1d4a2b', '#25603a', '#163a22'],
        willow: ['#7aa84a', '#8fbd58', '#5f8c3a'],
        maple: ['#b8471f', '#e98a2e', '#8f2f14', '#d9a03a'],
        snowpine: ['#1f4a38', '#2a5f48', '#173a2c'],
        acacia: ['#6c7f2e', '#8a9a40', '#4f5f22'],
        nightoak: ['#16302c', '#21453b', '#0f2420']
    };

    function drawCanopyShadows(g, list, v) {
        var s = sv(v, 18, 26);
        g.save();
        g.fillStyle = 'rgba(0, 20, 0, 0.18)';
        for (var i = 0; i < list.length; i++) {
            g.beginPath();
            g.arc(list[i].x + s.x, list[i].y + s.y, list[i].r * 0.95, 0, Math.PI * 2);
            g.fill();
        }
        g.restore();
    }

    function drawCanopies(g, list, theme, v, clock, ball) {
        var pal = CANOPY[theme.canopy] || CANOPY.oak;
        for (var i = 0; i < list.length; i++) {
            var c = list[i];
            var near = ball ? Math.hypot(ball.x - c.x, ball.y - c.y) - c.r : 999;
            g.save();
            g.globalAlpha = near < 24 ? 0.32 : near < 70 ? 0.32 + (near - 24) / 46 * 0.6 : 0.92;
            g.translate(c.x, c.y);
            g.rotate(Math.sin(clock * 0.5 + c.p) * 0.025);
            if (theme.canopy === 'palm') palm(g, c.r, pal, c.p);
            else if (theme.canopy === 'pine' || theme.canopy === 'snowpine') pine(g, c.r, pal, c.p, theme.canopy === 'snowpine');
            else crown(g, c.r, pal, c.p, theme.canopy, v);
            g.restore();
        }
    }

    // A broadleaf crown: overlapping clumps, lit on the side towards the light.
    function crown(g, R, pal, p, kind, v) {
        var lightDir = sv(v, -1, -1);
        // An acacia is wide and flat: more, smaller clumps spread further.
        var flat = kind === 'acacia', n = flat ? 14 : 9;
        for (var k = 0; k < n; k++) {
            var a = k * 0.7 + p, d = k === 0 ? 0 : R * (flat ? 0.45 + hash(p * 10 + k) * 0.45 : 0.35 + hash(p * 10 + k) * 0.35);
            var x = Math.cos(a) * d, y = Math.sin(a) * d, r = R * (flat ? 0.28 + hash(p * 7 + k) * 0.14 : 0.42 + hash(p * 7 + k) * 0.2);
            var grad = g.createRadialGradient(x + lightDir.x * r * 0.4, y + lightDir.y * r * 0.4, r * 0.1, x, y, r);
            // A maple turns unevenly, clump by clump.
            var lit0 = kind === 'maple' ? pal[1 + (k % 3)] : pal[1];
            grad.addColorStop(0, lit0);
            grad.addColorStop(1, pal[kind === 'maple' ? (k % 2 ? 2 : 0) : 2]);
            g.fillStyle = grad;
            g.beginPath();
            g.arc(x, y, r, 0, Math.PI * 2);
            g.fill();
        }
        if (kind === 'blossom') {
            // A cherry in flower: blossom dotted over a green crown.
            for (var f = 0; f < 70; f++) {
                var fa = hash(p * 3 + f) * Math.PI * 2, fd = Math.sqrt(hash(p * 5 + f * 1.3)) * R * 0.92;
                g.fillStyle = f % 3 ? '#fbcfe8' : '#f472b6';
                g.beginPath();
                g.arc(Math.cos(fa) * fd, Math.sin(fa) * fd, 2.4 + hash(f) * 1.6, 0, Math.PI * 2);
                g.fill();
            }
        }
        if (kind === 'willow') {
            g.strokeStyle = 'rgba(200, 240, 150, 0.35)';
            g.lineWidth = 1.2;
            for (var s = 0; s < 40; s++) {
                var sa = s * 0.157 + p;
                g.beginPath();
                g.moveTo(Math.cos(sa) * R * 0.3, Math.sin(sa) * R * 0.3);
                g.lineTo(Math.cos(sa) * R * 0.98, Math.sin(sa) * R * 0.98);
                g.stroke();
            }
        }
    }

    function palm(g, R, pal, p) {
        for (var k = 0; k < 8; k++) {
            var a = k * Math.PI / 4 + p;
            g.save();
            g.rotate(a);
            g.fillStyle = pal[k % 3];
            g.beginPath();
            g.moveTo(0, 0);
            g.quadraticCurveTo(R * 0.5, -R * 0.26, R, 0);
            g.quadraticCurveTo(R * 0.5, R * 0.26, 0, 0);
            g.fill();
            g.strokeStyle = 'rgba(30, 60, 15, 0.5)';
            g.lineWidth = 1;
            g.beginPath();
            g.moveTo(0, 0);
            g.lineTo(R * 0.95, 0);
            g.stroke();
            g.restore();
        }
        g.fillStyle = '#7c5a2e';
        g.beginPath();
        g.arc(0, 0, R * 0.1, 0, Math.PI * 2);
        g.fill();
    }

    function pine(g, R, pal, p, snowy) {
        for (var layer = 0; layer < 3; layer++) {
            var r = R * (1 - layer * 0.28);
            g.fillStyle = pal[layer % 3];
            g.beginPath();
            for (var k = 0; k < 24; k++) {
                var a = k * Math.PI / 12 + p + layer * 0.2;
                var rr = k % 2 ? r * 0.78 : r;
                g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
            }
            g.closePath();
            g.fill();
            if (snowy) {
                // Snow along the tips of each tier of branches.
                g.fillStyle = 'rgba(245, 250, 255, 0.9)';
                for (k = 0; k < 24; k += 2) {
                    var sa = k * Math.PI / 12 + p + layer * 0.2;
                    g.beginPath();
                    g.ellipse(Math.cos(sa) * r * 0.84, Math.sin(sa) * r * 0.84, r * 0.11, r * 0.06, sa + Math.PI / 2, 0, Math.PI * 2);
                    g.fill();
                }
            }
        }
    }

    /* Clouds: soft shadows drifting over everything, trees included — two
       on most days, more over the meadow, none over the desert or after
       dark. Wind runs across the screen, not across the world, so on a
       turned phone they still drift the way the eye expects. Still under
       reduced motion — there is no clock to move them. */
    function drawClouds(g, clock, v, seed, count) {
        var span = W + H;
        var n = typeof count === 'number' ? count : 2;
        g.save();
        for (var i = 0; i < n; i++) {
            var lane = hash(seed + i * 3.3);
            var along = ((clock * (6 + i * 2.5) + hash(seed + i) * span) % (span + 500)) - 250;
            var across = (0.15 + lane * 0.7);
            var p = v.turned
                ? { x: W - across * W, y: along * H / span * 1.2 }
                : { x: along * W / span * 1.2, y: across * H };
            var r = 110 + hash(seed + i * 7) * 70;
            var grad = g.createRadialGradient(p.x, p.y, r * 0.15, p.x, p.y, r);
            grad.addColorStop(0, 'rgba(0, 15, 10, 0.10)');
            grad.addColorStop(1, 'rgba(0, 15, 10, 0)');
            g.fillStyle = grad;
            g.beginPath();
            g.ellipse(p.x, p.y, r * 1.3, r * 0.8, i, 0, Math.PI * 2);
            g.fill();
        }
        g.restore();
    }

    /* The rim: the course's edge as a built thing in the biome's material,
       in the strip the ball never reaches the middle of, with the shadow it
       throws onto the field along the two edges nearest the light. */
    var RIM = {
        paint: { face: '#23412a', hi: 'rgba(200, 240, 200, 0.25)' },
        brick: { face: '#8a432d', hi: 'rgba(255, 220, 200, 0.3)' },
        plank: { face: '#9c8a6d', hi: 'rgba(255, 250, 230, 0.35)' },
        log: { face: '#5b3820', hi: 'rgba(240, 200, 150, 0.25)' },
        hedge: { face: '#24552a', hi: 'rgba(200, 255, 180, 0.22)' },
        stone: { face: '#75766f', hi: 'rgba(255, 255, 240, 0.3)', joints: 'rgba(30, 30, 25, 0.5)' },
        snow: { face: '#e4edf3', hi: 'rgba(255, 255, 255, 0.6)' },
        adobe: { face: '#b06f45', hi: 'rgba(255, 220, 180, 0.32)' },
        night: { face: '#1a2232', hi: 'rgba(160, 180, 220, 0.22)' }
    };

    function drawRim(g, theme, v) {
        var rim = RIM[theme.rim] || RIM.paint;
        g.save();
        // The rim's shadow on the field, inside its two lit edges.
        var top = sv(v, 0, -1), left = sv(v, -1, 0);
        [top, left].forEach(function (e) {
            var gx0, gy0, gx1, gy1;
            if (e.y < 0) { gx0 = 0; gy0 = 8; gx1 = 0; gy1 = 22; }
            else if (e.y > 0) { gx0 = 0; gy0 = H - 8; gx1 = 0; gy1 = H - 22; }
            else if (e.x < 0) { gx0 = 8; gy0 = 0; gx1 = 22; gy1 = 0; }
            else { gx0 = W - 8; gy0 = 0; gx1 = W - 22; gy1 = 0; }
            var grad = g.createLinearGradient(gx0, gy0, gx1, gy1);
            grad.addColorStop(0, 'rgba(0,0,0,0.28)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            g.fillStyle = grad;
            g.fillRect(Math.min(gx0, gx1), Math.min(gy0, gy1), e.y ? W : 14, e.y ? 14 : H);
        });
        g.strokeStyle = rim.face;
        g.lineWidth = 9;
        g.strokeRect(4.5, 4.5, W - 9, H - 9);
        g.strokeStyle = rim.hi;
        g.lineWidth = 1.5;
        g.strokeRect(1, 1, W - 2, H - 2);
        g.strokeStyle = 'rgba(0,0,0,0.35)';
        g.lineWidth = 1.5;
        g.strokeRect(9, 9, W - 18, H - 18);
        if (theme.rim === 'brick' || theme.rim === 'stone') {
            // Joints: regular for brick, uneven for dry stone.
            var stone = theme.rim === 'stone';
            g.strokeStyle = rim.joints || 'rgba(240, 220, 200, 0.3)';
            g.lineWidth = 1;
            g.beginPath();
            for (var x = 20; x < W; x += stone ? 14 + hash(x) * 16 : 22) { g.moveTo(x, 0); g.lineTo(x, 9); g.moveTo(x + 7, H - 9); g.lineTo(x + 7, H); }
            for (var y = 20; y < H; y += stone ? 14 + hash(y + 3) * 16 : 22) { g.moveTo(0, y); g.lineTo(9, y); g.moveTo(W - 9, y + 5); g.lineTo(W, y + 5); }
            g.stroke();
        }
        g.restore();
    }

    /* ── the static layers ──────────────────────────────────────────────

       Painted once per hole, biome, resolution and orientation, and blitted
       every frame after that. `res` is one or two cache pixels per world
       pixel — two once the board's backing store is near double density —
       so the cache is sharp where the screen can show it, and the blit is
       one-to-one on a phone rather than resampling an odd ratio every frame. */
    var cache = { key: null, ground: null, solids: null, decor: null, box: null };

    // A cached canvas covering `box` of the world (all of it by default).
    function layer(res, paint, box) {
        box = box || { x: 0, y: 0, w: W, h: H };
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(box.w * res));
        c.height = Math.max(1, Math.round(box.h * res));
        var g = c.getContext('2d');
        g.setTransform(res, 0, 0, res, -box.x * res, -box.y * res);
        paint(g);
        return c;
    }

    /* Where the still walls are, with room for their shadows and near
       faces. The solid layer is blitted every frame, and most of a field has
       no wall on it: a full-field image of transparent pixels was the single
       most expensive thing on the page for drawing a few planks. */
    function solidsBox(course) {
        var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        (course.walls || []).forEach(function (w) {
            if (w.move) return;
            x0 = Math.min(x0, w.x); y0 = Math.min(y0, w.y); x1 = Math.max(x1, w.x + w.w); y1 = Math.max(y1, w.y + w.h);
        });
        (course.rails || []).forEach(function (r) {
            var h = r.w / 2;
            x0 = Math.min(x0, r.x - h, r.tx - h); y0 = Math.min(y0, r.y - h, r.ty - h);
            x1 = Math.max(x1, r.x + h, r.tx + h); y1 = Math.max(y1, r.y + h, r.ty + h);
        });
        if (x0 === Infinity) return null;
        var pad = 20;
        x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
        x1 = Math.min(W, x1 + pad); y1 = Math.min(H, y1 + pad);
        return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }

    function paintGround(g, course, theme, v, seed, dec) {
        g.drawImage(turfFor(seed, theme), 0, 0, W, H);
        drawGreen(g, course.hole);
        drawRough(g, course.rough || [], theme);
        for (var i = 0; i < (course.slopes || []).length; i++) drawSlope(g, course.slopes[i]);
        drawIce(g, course.ice || []);
        drawSand(g, course.sand || [], theme, v);
        drawWaterBed(g, course.water, theme, v);
        drawDecals(g, dec.decals, theme);
        drawCanopyShadows(g, dec.canopies, v);
        drawTee(g, course.tee, v);
        grade(g, theme, v, false);
    }

    function paintSolids(g, course, theme, v) {
        var i, rails = course.rails || [];
        for (i = 0; i < rails.length; i++) drawRail(g, rails[i], theme, v);
        for (i = 0; i < course.walls.length; i++) if (!course.walls[i].move) drawWall(g, course.walls[i], 0, theme, v);
        grade(g, theme, v, true);
    }

    /* The light of the hour: a tint across the whole field from the
       screen's lit corner to its far one — gold in the autumn and the
       desert, cold blue in the snow. Painted into the still layers, so it
       costs a frame nothing; on the walls' layer it is laid only where there
       is paint already, or it would tint the air round them. */
    function grade(g, theme, v, atop) {
        if (!theme.grade) return;
        var d = sv(v, -1, -1), n = Math.hypot(d.x, d.y), ux = d.x / n, uy = d.y / n;
        var ext = Math.abs(ux) * W / 2 + Math.abs(uy) * H / 2;
        var grad = g.createLinearGradient(W / 2 + ux * ext, H / 2 + uy * ext, W / 2 - ux * ext, H / 2 - uy * ext);
        grad.addColorStop(0, theme.grade.a);
        grad.addColorStop(1, theme.grade.b);
        g.save();
        if (atop) g.globalCompositeOperation = 'source-atop';
        g.fillStyle = grad;
        g.fillRect(0, 0, W, H);
        g.restore();
    }

    /* Everything under the ball that `frame` would otherwise draw piece by
       piece, as two calls: the ground before the water, the still walls
       after it. Moving walls, posts, the cup and tunnels are render.js's. */
    function scene(course, theme, v, opts) {
        var res = opts.res > 0 ? opts.res : 1;
        var key = opts.key ? [opts.key, theme.name, res.toFixed(2), v.turned ? 1 : 0].join('|') : null;
        if (!key || cache.key !== key) {
            cache.decor = SC.decor(course, theme);
            cache.ground = cache.solids = null;
            cache.box = solidsBox(course);
            if (key) {
                cache.ground = layer(res, function (g) { paintGround(g, course, theme, v, opts.seed, cache.decor); });
                if (cache.box) cache.solids = layer(res, function (g) { paintSolids(g, course, theme, v); }, cache.box);
            }
            cache.key = key;
        }
        return {
            decor: cache.decor,
            ground: function (g) {
                if (cache.ground) g.drawImage(cache.ground, 0, 0, W, H);
                else paintGround(g, course, theme, v, opts.seed, cache.decor);
            },
            solids: function (g) {
                if (cache.solids) g.drawImage(cache.solids, cache.box.x, cache.box.y, cache.box.w, cache.box.h);
                else if (!key || cache.box) paintSolids(g, course, theme, v);
            }
        };
    }

    GOLF.landscape = {
        viewOf: viewOf,
        sv: sv,
        roundRect: roundRect,
        scene: scene,
        drawWater: drawWater,
        drawWall: drawWall,
        drawRail: drawRail,
        drawBumper: drawBumper,
        drawCanopies: drawCanopies,
        drawClouds: drawClouds,
        drawRim: drawRim,
        layer: layer,
        hash: hash,
        MATERIAL: MATERIAL,
        RIM: RIM,
        CANOPY: CANOPY
    };

})(window.GOLF);
