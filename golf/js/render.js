/* Everything that draws. Reads state, never writes it — the only mutable
   thing in here is the particle list, which is visual-only and deliberately
   kept out of the simulation so a dropped frame can never change a score.

   The turf is generated into an offscreen canvas and blitted, rather than
   redrawn per frame; see makeTurf for why it is rebuilt once per hole. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;
    var P = GOLF.physics;

    /* The turf is one static 960x640 image, generated offscreen and blitted.
       Regenerating the stripes, the speckle and the vignette every frame was
       the single most expensive thing on the page, for a picture that never
       changes *within* a hole.

       It does change *between* holes: the mow angle, the stripe width and the
       green's depth are derived from the hole index, so eighteen holes do not
       all look like the same lawn photographed eighteen times. One canvas is
       kept, rebuilt on hole change — caching all eighteen would be 44MB of
       bitmap to avoid a 4ms redraw nobody sees. */
    var turf = null;
    var turfKey = -1;

    // Deterministic noise, so a hole's blades of grass sit in the same place
    // every time it is loaded and the course does not shimmer on replay.
    function hash(n) {
        var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    function makeTurf(seed) {
        var c = document.createElement('canvas');
        c.width = C.WORLD_W;
        c.height = C.WORLD_H;
        var g = c.getContext('2d');

        // Base colour drifts a few degrees per hole: high summer at one end of
        // the course, a shaded valley at the other.
        var hue = 132 + Math.round((hash(seed) - 0.5) * 14);
        var lum = 33 + Math.round(hash(seed + 9) * 5);
        g.fillStyle = 'hsl(' + hue + ', 46%, ' + lum + '%)';
        g.fillRect(0, 0, C.WORLD_W, C.WORLD_H);

        // Mower stripes. The angle and width come from the seed, so a hole is
        // recognisable from its lawn before you have read its name.
        var angle = -0.55 + hash(seed + 3) * 1.1;
        var band = 44 + Math.round(hash(seed + 5) * 34);
        g.save();
        g.translate(C.WORLD_W / 2, C.WORLD_H / 2);
        g.rotate(angle);
        g.translate(-C.WORLD_W, -C.WORLD_H);
        for (var i = 0; i < Math.ceil(C.WORLD_W * 3 / band); i++) {
            g.fillStyle = i % 2 ? 'rgba(255,255,255,0.040)' : 'rgba(0,0,0,0.040)';
            g.fillRect(i * band, 0, band, C.WORLD_H * 3);
        }
        // A hairline at each stripe boundary — the cut edge the mower leaves.
        g.strokeStyle = 'rgba(0,0,0,0.05)';
        g.lineWidth = 1;
        for (i = 0; i < Math.ceil(C.WORLD_W * 3 / band); i++) {
            g.beginPath();
            g.moveTo(i * band, 0);
            g.lineTo(i * band, C.WORLD_H * 3);
            g.stroke();
        }
        g.restore();

        // Speckle: a few thousand one-pixel blades so flat colour does not
        // read as plastic when the ball rolls over it.
        for (var n = 0; n < 3000; n++) {
            var x = hash(seed * 31 + n) * C.WORLD_W, y = hash(seed * 17 + n * 3.7) * C.WORLD_H;
            g.fillStyle = hash(n * 5.3) < 0.5 ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.065)';
            g.fillRect(x, y, 1.6, 1.6);
        }

        var v = g.createRadialGradient(C.WORLD_W / 2, C.WORLD_H / 2, C.WORLD_H * 0.35,
                                       C.WORLD_W / 2, C.WORLD_H / 2, C.WORLD_H * 0.95);
        v.addColorStop(0, 'rgba(0,0,0,0)');
        v.addColorStop(1, 'rgba(0,0,0,0.40)');
        g.fillStyle = v;
        g.fillRect(0, 0, C.WORLD_W, C.WORLD_H);

        return c;
    }

    /* The putting green: a disc of shorter grass around the cup, mown in
       rings. It is decoration in the strict sense — the physics has never
       heard of it — but it is the one piece of the picture that tells you
       where the hole *is* from across the field, before you have found the
       flag among the hazards. */
    function drawGreen(g, hole) {
        var R = 96;
        g.save();
        g.beginPath();
        g.arc(hole.x, hole.y, R, 0, Math.PI * 2);
        g.clip();

        // Faded at the rim rather than cut off at it: a hard circle of paler
        // grass reads as a target painted on the field, and the eye goes to
        // the edge instead of to the cup.
        var grad = g.createRadialGradient(hole.x, hole.y, 6, hole.x, hole.y, R);
        grad.addColorStop(0, 'rgba(214, 255, 214, 0.15)');
        grad.addColorStop(0.62, 'rgba(200, 250, 200, 0.10)');
        grad.addColorStop(1, 'rgba(190, 245, 190, 0)');
        g.fillStyle = grad;
        g.fillRect(hole.x - R, hole.y - R, R * 2, R * 2);

        // Mown in rings, the way a green actually is, and fading with them.
        g.lineWidth = 6;
        for (var r = 14; r < R - 8; r += 16) {
            g.strokeStyle = 'rgba(255,255,255,' + (0.05 * (1 - r / R)).toFixed(3) + ')';
            g.beginPath();
            g.arc(hole.x, hole.y, r, 0, Math.PI * 2);
            g.stroke();
        }
        g.restore();
    }

    /* Rough. Darker, denser, and drawn with tufts rather than a flat fill so
       that "this will cost you" is legible at a glance — the same information
       the bunker's rake lines carry. */
    function drawRough(g, s) {
        g.save();
        roundRect(g, s.x, s.y, s.w, s.h, 14);
        g.clip();

        g.fillStyle = 'rgba(9, 46, 22, 0.55)';
        g.fillRect(s.x, s.y, s.w, s.h);

        var seed = s.x * 7 + s.y * 13 + s.w;
        var tufts = Math.min(420, Math.round(s.w * s.h / 620));
        g.strokeStyle = 'rgba(126, 200, 130, 0.30)';
        g.lineWidth = 1.6;
        g.lineCap = 'round';
        g.beginPath();
        for (var i = 0; i < tufts; i++) {
            var x = s.x + hash(seed + i) * s.w;
            var y = s.y + hash(seed + i * 2.7 + 1) * s.h;
            var lean = (hash(seed + i * 3.1) - 0.5) * 5;
            g.moveTo(x, y);
            g.lineTo(x + lean, y - 5 - hash(seed + i * 1.3) * 4);
        }
        g.stroke();
        g.restore();

        g.save();
        roundRect(g, s.x, s.y, s.w, s.h, 14);
        g.strokeStyle = 'rgba(8, 40, 20, 0.5)';
        g.lineWidth = 2;
        g.stroke();
        g.restore();
    }

    function roundRect(g, x, y, w, h, r) {
        var rr = Math.min(r, w / 2, h / 2);
        g.beginPath();
        g.moveTo(x + rr, y);
        g.arcTo(x + w, y, x + w, y + h, rr);
        g.arcTo(x + w, y + h, x, y + h, rr);
        g.arcTo(x, y + h, x, y, rr);
        g.arcTo(x, y, x + w, y, rr);
        g.closePath();
    }

    /* ── course furniture ───────────────────────────────────────────────── */

    function drawSand(g, s) {
        g.save();
        roundRect(g, s.x, s.y, s.w, s.h, 34);
        g.fillStyle = '#e3ca92';
        g.fill();
        g.clip();
        var grad = g.createLinearGradient(s.x, s.y, s.x, s.y + s.h);
        grad.addColorStop(0, 'rgba(255,255,255,0.30)');
        grad.addColorStop(0.45, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(120,90,40,0.28)');
        g.fillStyle = grad;
        g.fillRect(s.x, s.y, s.w, s.h);
        // Rake lines. Seeded off the rectangle so they do not crawl between frames.
        g.strokeStyle = 'rgba(160,125,60,0.18)';
        g.lineWidth = 2;
        for (var i = 10; i < s.h; i += 15) {
            g.beginPath();
            g.moveTo(s.x, s.y + i);
            g.bezierCurveTo(s.x + s.w * 0.33, s.y + i - 6, s.x + s.w * 0.66, s.y + i + 6, s.x + s.w, s.y + i);
            g.stroke();
        }
        g.restore();
    }

    /* Ice reads as ice through three cues rather than colour alone: a pale
       fill, a rim of hard frost, and hairline fractures. The fractures are
       derived from the rectangle's own coordinates rather than from
       Math.random, so the sheet does not crawl about between frames. */
    function drawIce(g, s) {
        g.save();
        roundRect(g, s.x, s.y, s.w, s.h, 18);
        g.fillStyle = '#bfe4f2';
        g.fill();
        g.clip();

        var grad = g.createLinearGradient(s.x, s.y, s.x + s.w, s.y + s.h);
        grad.addColorStop(0, 'rgba(255,255,255,0.55)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.10)');
        grad.addColorStop(1, 'rgba(96,165,250,0.35)');
        g.fillStyle = grad;
        g.fillRect(s.x, s.y, s.w, s.h);

        g.strokeStyle = 'rgba(255,255,255,0.55)';
        g.lineWidth = 1.4;
        for (var i = 0; i < 7; i++) {
            var sx = s.x + ((i * 97 + 31) % 100) / 100 * s.w;
            var sy = s.y + ((i * 61 + 17) % 100) / 100 * s.h;
            var a = (i * 1.7) % (Math.PI * 2);
            var len = 26 + (i % 3) * 22;
            g.beginPath();
            g.moveTo(sx, sy);
            g.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len);
            g.lineTo(sx + Math.cos(a) * len + Math.cos(a + 1.1) * len * 0.6,
                     sy + Math.sin(a) * len + Math.sin(a + 1.1) * len * 0.6);
            g.stroke();
        }
        g.restore();

        g.save();
        roundRect(g, s.x, s.y, s.w, s.h, 18);
        g.strokeStyle = 'rgba(240,253,255,0.75)';
        g.lineWidth = 3;
        g.stroke();
        g.restore();
    }

    /* A bumper. The cap is drawn a couple of pixels up and left of the collision
       circle so it reads as a post standing on the green rather than a disc
       painted on it — but the ring, which is what the ball actually meets, is
       drawn true to the radius the simulation uses. */
    function drawBumper(g, b, t) {
        var pulse = 0.5 + Math.sin(t * 2.2 + b.x * 0.03) * 0.5;

        g.save();
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.beginPath();
        g.ellipse(b.x + 3, b.y + 4, b.r * 1.02, b.r * 0.92, 0, 0, Math.PI * 2);
        g.fill();

        g.beginPath();
        g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        g.strokeStyle = 'rgba(249,115,22,' + (0.55 + pulse * 0.35) + ')';
        g.lineWidth = 3;
        g.stroke();

        var grad = g.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.15, b.x, b.y, b.r);
        grad.addColorStop(0, '#fde68a');
        grad.addColorStop(0.55, '#f59e0b');
        grad.addColorStop(1, '#b45309');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(b.x - 1, b.y - 1.5, b.r - 3.5, 0, Math.PI * 2);
        g.fill();

        g.fillStyle = 'rgba(255,255,255,' + (0.25 + pulse * 0.45) + ')';
        g.beginPath();
        g.arc(b.x - 1, b.y - 1.5, b.r * 0.32, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }

    /* All of a hole's water in one pass rather than rect by rect. A moat is
       built from several overlapping rectangles, and drawing each one as its
       own rounded, outlined shape left notches and doubled shorelines wherever
       two of them met. Filling the union in a single path merges them, and
       growing that union by a few pixels underneath produces a shoreline that
       follows the outside edge only. */
    function drawWaterAll(g, list, t) {
        if (!list.length) return;
        var i, minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
        for (i = 0; i < list.length; i++) {
            minX = Math.min(minX, list[i].x); maxX = Math.max(maxX, list[i].x + list[i].w);
            minY = Math.min(minY, list[i].y); maxY = Math.max(maxY, list[i].y + list[i].h);
        }

        g.save();
        g.fillStyle = 'rgba(226,202,146,0.8)';
        g.beginPath();
        for (i = 0; i < list.length; i++) g.rect(list[i].x - 3, list[i].y - 3, list[i].w + 6, list[i].h + 6);
        g.fill();

        g.beginPath();
        for (i = 0; i < list.length; i++) g.rect(list[i].x, list[i].y, list[i].w, list[i].h);
        var grad = g.createLinearGradient(0, minY, 0, maxY);
        grad.addColorStop(0, '#1b6d9e');
        grad.addColorStop(1, '#0e4468');
        g.fillStyle = grad;
        g.fill();
        g.clip();

        g.strokeStyle = 'rgba(190,235,255,0.22)';
        g.lineWidth = 2;
        for (var row = minY + 11; row < maxY; row += 22) {
            g.beginPath();
            for (var x = minX; x <= maxX; x += 8) {
                g.lineTo(x, row + Math.sin(x * 0.05 + t * 1.6 + row * 0.4) * 3);
            }
            g.stroke();
        }
        g.restore();
    }

    function drawSlope(g, s) {
        var mag = Math.hypot(s.ax, s.ay);
        if (mag < 1) return;
        var ux = s.ax / mag, uy = s.ay / mag;

        g.save();
        roundRect(g, s.x, s.y, s.w, s.h, 8);
        g.clip();
        // Light at the high end, shadow at the low end: the same cue a real
        // green gives you.
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

    /* A wall is a timber sleeper standing on the grass. Everything about the
       drawing says "above the surface": a shadow cast down-right, a lit top
       and left edge, a dark underside. The light direction is the same one the
       ball, the posts and the cup use — the picture only reads as 3D if
       nothing in it disagrees about where the sun is. */
    function drawWall(g, wall, t) {
        var R = P.wallRect(wall, t);

        g.save();
        g.shadowColor = 'rgba(0,0,0,0.5)';
        g.shadowBlur = 14;
        g.shadowOffsetX = 4;
        g.shadowOffsetY = 6;
        roundRect(g, R.x, R.y, R.w, R.h, 6);
        g.fillStyle = wall.move ? '#8a5a34' : '#6d4a2e';
        g.fill();
        g.restore();

        g.save();
        roundRect(g, R.x, R.y, R.w, R.h, 6);
        g.clip();
        var grad = g.createLinearGradient(R.x, R.y, R.x + R.w, R.y + R.h);
        grad.addColorStop(0, 'rgba(255,255,255,0.30)');
        grad.addColorStop(0.22, 'rgba(255,255,255,0.06)');
        grad.addColorStop(1, 'rgba(0,0,0,0.34)');
        g.fillStyle = grad;
        g.fillRect(R.x, R.y, R.w, R.h);

        // Grain, along the long axis of the timber.
        var along = R.w > R.h;
        g.strokeStyle = 'rgba(60,36,16,0.22)';
        g.lineWidth = 1;
        g.beginPath();
        for (var k = 7; k < (along ? R.h : R.w); k += 7) {
            if (along) { g.moveTo(R.x, R.y + k); g.lineTo(R.x + R.w, R.y + k); }
            else { g.moveTo(R.x + k, R.y); g.lineTo(R.x + k, R.y + R.h); }
        }
        g.stroke();
        // Hazard stripes mark the walls that move, so a player who gets hit by
        // one at least knew it was coming.
        if (wall.move) {
            g.strokeStyle = 'rgba(251,191,36,0.5)';
            g.lineWidth = 5;
            for (var d = -R.h; d < R.w + R.h; d += 18) {
                g.beginPath();
                g.moveTo(R.x + d, R.y);
                g.lineTo(R.x + d + R.h, R.y + R.h);
                g.stroke();
            }
        }
        g.restore();

        // Lit top edge, dark base. Two hairlines do more for the sense of
        // height than any amount of gradient.
        g.save();
        roundRect(g, R.x + 0.5, R.y + 0.5, R.w - 1, R.h - 1, 6);
        g.strokeStyle = 'rgba(255,236,200,0.22)';
        g.lineWidth = 1;
        g.stroke();
        g.restore();
    }

    function drawHole(g, hole, t, ball) {
        // Cup.
        g.save();
        g.beginPath();
        g.arc(hole.x, hole.y, C.HOLE_R, 0, Math.PI * 2);
        var grad = g.createRadialGradient(hole.x, hole.y - 3, 2, hole.x, hole.y, C.HOLE_R);
        grad.addColorStop(0, '#000');
        grad.addColorStop(0.75, '#0b1a0d');
        grad.addColorStop(1, '#16341a');
        g.fillStyle = grad;
        g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.22)';
        g.lineWidth = 2;
        g.stroke();
        g.restore();

        // Proximity ring: swells as the ball closes in. Free feedback on
        // whether a slow roll is actually on line.
        if (ball) {
            var d = Math.hypot(ball.x - hole.x, ball.y - hole.y);
            if (d < 150) {
                g.save();
                g.globalAlpha = (1 - d / 150) * 0.5;
                g.strokeStyle = '#fde68a';
                g.lineWidth = 2;
                g.beginPath();
                g.arc(hole.x, hole.y, C.HOLE_R + 6 + Math.sin(t * 4) * 3, 0, Math.PI * 2);
                g.stroke();
                g.restore();
            }
        }

        // Pole and pennant. The wave is a travelling sine along the flag's
        // length, anchored at the pole so it does not detach.
        g.save();
        g.strokeStyle = 'rgba(0,0,0,0.25)';
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(hole.x, hole.y);
        g.lineTo(hole.x + 26, hole.y + 10);
        g.stroke();

        g.strokeStyle = '#f1f5f9';
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(hole.x, hole.y);
        g.lineTo(hole.x, hole.y - 62);
        g.stroke();

        g.beginPath();
        g.moveTo(hole.x + 1, hole.y - 62);
        for (var i = 0; i <= 10; i++) {
            var px = i / 10;
            g.lineTo(hole.x + 1 + px * 40, hole.y - 60 + px * 9 + Math.sin(t * 6 - px * 3.2) * px * 5);
        }
        for (var j = 10; j >= 0; j--) {
            var qx = j / 10;
            g.lineTo(hole.x + 1 + qx * 40, hole.y - 42 + qx * 4 + Math.sin(t * 6 - qx * 3.2) * qx * 5);
        }
        g.closePath();
        g.fillStyle = '#ef4444';
        g.fill();
        g.restore();
    }

    /* The trail tapers rather than running at one width and one alpha: drawn
       as segments so the oldest end can fade to nothing, which reads as speed
       instead of as a piece of string tied to the ball. */
    function drawTrail(g, trail) {
        if (!trail || trail.length < 2) return;
        g.save();
        g.lineCap = 'round';
        for (var i = 1; i < trail.length; i++) {
            var f = i / (trail.length - 1);
            g.globalAlpha = 0.05 + f * 0.4;
            g.lineWidth = 1 + f * 3;
            g.strokeStyle = '#ffffff';
            g.beginPath();
            g.moveTo(trail[i - 1].x, trail[i - 1].y);
            g.lineTo(trail[i].x, trail[i].y);
            g.stroke();
        }
        g.restore();
    }

    /* The dimples turn with the roll — `spin` is distance travelled over the
       radius, i.e. the angle a real ball would have turned through. It is the
       cheapest possible cue that the ball is rolling and not sliding, and at
       rest it leaves the ball sitting at whatever angle it stopped at. */
    function drawBall(g, ball, spin) {
        g.save();
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.beginPath();
        g.ellipse(ball.x + 2.5, ball.y + 3.5, C.BALL_R * 1.05, C.BALL_R * 0.9, 0, 0, Math.PI * 2);
        g.fill();

        var grad = g.createRadialGradient(ball.x - 2.5, ball.y - 3, 1, ball.x, ball.y, C.BALL_R);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.6, '#eef2f5');
        grad.addColorStop(1, '#b9c4cc');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(ball.x, ball.y, C.BALL_R, 0, Math.PI * 2);
        g.fill();

        g.beginPath();
        g.arc(ball.x, ball.y, C.BALL_R, 0, Math.PI * 2);
        g.clip();
        g.fillStyle = 'rgba(120,140,155,0.35)';
        for (var i = 0; i < 5; i++) {
            var a = spin + i * (Math.PI * 2 / 5);
            var dx = Math.cos(a) * C.BALL_R * 0.52;
            var dy = Math.sin(a) * C.BALL_R * 0.52 - 1;
            g.beginPath();
            g.arc(ball.x + dx, ball.y + dy, 1.25, 0, Math.PI * 2);
            g.fill();
        }
        g.restore();

        g.save();
        g.fillStyle = 'rgba(255,255,255,0.9)';
        g.beginPath();
        g.arc(ball.x - 2.4, ball.y - 2.8, 1.7, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }

    /* ── aiming ─────────────────────────────────────────────────────────── */

    /* The aim arrow points, and that is all it does.

       It used to be the ball's real path for the next 0.6 seconds, dashed on
       screen and stopped at the first bounce, and the pull-back was drawn as a
       band whose length was the power. Between them they answered the two
       questions a golf shot is made of — how far will this go, and where does
       it come off that wall — so the shot was read rather than judged. The
       arrow is now a fixed length at every power: it tells you the line, and
       leaves the weight to your hands. */
    function drawAim(g, world, aim, t, lastFrac) {
        var b = world.ball;
        var frac = Math.max(0, Math.min(1, aim.power / C.MAX_POWER));
        var angle = aim.angle;
        var ring = C.AIM_RING_R;
        var ux = Math.cos(angle), uy = Math.sin(angle);
        var tail = ring + C.AIM_RING_W / 2 + 9;
        // Square root: generous where the touch shots are, compressed at the
        // top where nobody is trying to tell 90% from 95% by eye.
        var tip = tail + C.AIM_ARROW + (C.AIM_ARROW_FULL - C.AIM_ARROW) * Math.sqrt(frac);

        /* The guide ray, out to the edge of the field. Direction only: it does
           not stop at a wall, because where the ball comes off a wall is the
           question the hole is asking.

           Past SAFE_POWER it opens into the cone the shot can actually leave
           in. The scatter is not a surprise the game springs on you after the
           fact — it is drawn, to scale, in the moment you are deciding how far
           to pull, which is the only way a risk is a choice rather than a
           trick. */
        var cone = P.spread(aim.power);
        g.save();
        // The cone is a warning, not a hint: it earns twice the ink the plain
        // ray gets, or the one drawing on screen that says "this shot may not
        // go where you are pointing" is the faintest thing on the field.
        g.globalAlpha = cone > 0 ? C.AIM_GUIDE_ALPHA * 2.2 : C.AIM_GUIDE_ALPHA;
        g.strokeStyle = cone > 0 ? '#fb7185' : '#ffffff';
        g.lineWidth = 1.5;
        g.setLineDash([2, 9]);
        g.lineDashOffset = -t * 18;
        for (var e = -1; e <= 1; e++) {
            if (e !== 0 && cone === 0) continue;
            var ea = angle + e * cone;
            g.beginPath();
            g.moveTo(b.x + Math.cos(ea) * tip, b.y + Math.sin(ea) * tip);
            g.lineTo(b.x + Math.cos(ea) * 1600, b.y + Math.sin(ea) * 1600);
            g.stroke();
        }
        g.restore();

        if (cone > 0) {
            g.save();
            g.globalAlpha = 0.13;
            g.fillStyle = '#fb7185';
            g.beginPath();
            g.moveTo(b.x + ux * tip, b.y + uy * tip);
            g.arc(b.x, b.y, 1600, angle - cone, angle + cone);
            g.closePath();
            g.fill();
            g.restore();
        }

        g.save();
        g.translate(b.x, b.y);
        g.rotate(angle);

        g.setLineDash([7, 7]);
        g.lineDashOffset = -t * 26;
        g.strokeStyle = 'rgba(0,0,0,0.30)';
        g.lineWidth = 5;
        g.lineCap = 'butt';
        g.beginPath();
        g.moveTo(tail, 0);
        g.lineTo(tip, 0);
        g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.9)';
        g.lineWidth = 2.5;
        g.beginPath();
        g.moveTo(tail, 0);
        g.lineTo(tip, 0);
        g.stroke();

        g.setLineDash([]);
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.beginPath();
        g.moveTo(tip + 14, 1.5);
        g.lineTo(tip - 3, -6.5);
        g.lineTo(tip - 3, 9.5);
        g.closePath();
        g.fill();
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.moveTo(tip + 13, 0);
        g.lineTo(tip - 3, -7.5);
        g.lineTo(tip - 3, 7.5);
        g.closePath();
        g.fill();
        g.restore();

        /* The power gauge. A ring, not a hairline arc: a track to read the
           empty part against, a fill that runs green through amber to red, a
           head that marks the exact level, and quarter ticks so "about a
           third" is a thing the eye can actually say. No number — the ball
           still has to be judged, only now the dial can be read. */
        var a0 = -Math.PI * 0.75, span = Math.PI * 1.5;
        var hue = 130 - frac * 130;

        g.save();
        g.lineCap = 'round';

        g.strokeStyle = 'rgba(0,0,0,0.45)';
        g.lineWidth = C.AIM_RING_W + 4;
        g.beginPath();
        g.arc(b.x, b.y, ring, a0, a0 + span);
        g.stroke();

        g.strokeStyle = 'rgba(255,255,255,0.14)';
        g.lineWidth = C.AIM_RING_W;
        g.beginPath();
        g.arc(b.x, b.y, ring, a0, a0 + span);
        g.stroke();

        if (frac > 0.001) {
            g.strokeStyle = 'hsl(' + hue + ', 88%, 56%)';
            g.lineWidth = C.AIM_RING_W;
            g.beginPath();
            g.arc(b.x, b.y, ring, a0, a0 + span * frac);
            g.stroke();

            var ha = a0 + span * frac;
            g.fillStyle = '#ffffff';
            g.beginPath();
            g.arc(b.x + Math.cos(ha) * ring, b.y + Math.sin(ha) * ring, C.AIM_RING_W * 0.42, 0, Math.PI * 2);
            g.fill();
        }

        // Where the safe zone ends. Everything clockwise of this line is
        // borrowed distance.
        var sf = C.SAFE_POWER / C.MAX_POWER;
        g.strokeStyle = 'rgba(251,113,133,0.85)';
        g.lineWidth = 2.5;
        var sa = a0 + span * sf, sx = Math.cos(sa), sy = Math.sin(sa);
        g.beginPath();
        g.moveTo(b.x + sx * (ring - C.AIM_RING_W / 2 - 4), b.y + sy * (ring - C.AIM_RING_W / 2 - 4));
        g.lineTo(b.x + sx * (ring + C.AIM_RING_W / 2 + 4), b.y + sy * (ring + C.AIM_RING_W / 2 + 4));
        g.stroke();

        g.strokeStyle = 'rgba(0,0,0,0.35)';
        g.lineWidth = 2;
        for (var q = 1; q <= 3; q++) {
            var ta = a0 + span * (q / 4);
            var cx = Math.cos(ta), cy = Math.sin(ta);
            g.beginPath();
            g.moveTo(b.x + cx * (ring - C.AIM_RING_W / 2), b.y + cy * (ring - C.AIM_RING_W / 2));
            g.lineTo(b.x + cx * (ring + C.AIM_RING_W / 2), b.y + cy * (ring + C.AIM_RING_W / 2));
            g.stroke();
        }

        /* Where the last shot on this hole was struck. Without a number on the
           dial, "a bit harder than that one" is the only language the player
           has for weight, and this is what gives them it. */
        if (typeof lastFrac === 'number') {
            var la = a0 + span * Math.max(0, Math.min(1, lastFrac));
            var lx = Math.cos(la), ly = Math.sin(la);
            g.strokeStyle = '#fbbf24';
            g.lineWidth = 2.5;
            g.beginPath();
            g.moveTo(b.x + lx * (ring - C.AIM_RING_W / 2 - 3), b.y + ly * (ring - C.AIM_RING_W / 2 - 3));
            g.lineTo(b.x + lx * (ring + C.AIM_RING_W / 2 + 3), b.y + ly * (ring + C.AIM_RING_W / 2 + 3));
            g.stroke();
        }
        g.restore();
    }

    /* ── particles ──────────────────────────────────────────────────────── */

    var particles = [];
    var rings = [];

    function burst(x, y, opts) {
        var n = opts.count || 14;
        for (var i = 0; i < n; i++) {
            var a = opts.angle === undefined ? Math.random() * Math.PI * 2
                                             : opts.angle + (Math.random() - 0.5) * (opts.spread || 1.2);
            var sp = (opts.speed || 120) * (0.4 + Math.random() * 0.8);
            particles.push({
                x: x, y: y,
                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.lift || 0),
                life: 0, max: opts.life || 0.7,
                size: (opts.size || 3) * (0.6 + Math.random() * 0.8),
                color: Array.isArray(opts.color) ? opts.color[(Math.random() * opts.color.length) | 0] : opts.color,
                gravity: opts.gravity === undefined ? 220 : opts.gravity,
                square: !!opts.square
            });
        }
    }

    function updateParticles(dt) {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.life += dt;
            if (p.life >= p.max) { particles.splice(i, 1); continue; }
            p.vy += p.gravity * dt;
            p.vx *= 0.99;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
    }

    function updateRings(g, dt) {
        for (var i = rings.length - 1; i >= 0; i--) {
            var r = rings[i];
            r.life += dt;
            if (r.life >= r.max) { rings.splice(i, 1); continue; }
            var f = r.life / r.max;
            g.save();
            g.globalAlpha = (1 - f) * 0.8;
            g.strokeStyle = '#fde68a';
            g.lineWidth = 3 * (1 - f) + 1;
            g.beginPath();
            g.arc(r.x, r.y, r.r + f * 26, 0, Math.PI * 2);
            g.stroke();
            g.restore();
        }
    }

    function drawParticles(g) {
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            g.save();
            g.globalAlpha = Math.max(0, 1 - p.life / p.max);
            g.fillStyle = p.color;
            if (p.square) {
                g.translate(p.x, p.y);
                g.rotate(p.life * 8);
                g.fillRect(-p.size, -p.size * 0.6, p.size * 2, p.size * 1.2);
            } else {
                g.beginPath();
                g.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                g.fill();
            }
            g.restore();
        }
    }

    var CONFETTI = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#f87171', '#a78bfa'];

    var effects = {
        sink: function (x, y) {
            burst(x, y, { count: 26, color: ['#ffffff', '#fde68a', '#86efac'], speed: 150, life: 0.8, size: 3, lift: 60 });
        },
        confetti: function (w, h) {
            // Ninety squares tumbling across the screen is exactly the kind of
            // thing prefers-reduced-motion exists to turn off. The sound and
            // the banner still land, so nothing is lost but the shower.
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            for (var i = 0; i < 90; i++) {
                particles.push({
                    x: Math.random() * w, y: -20 - Math.random() * h * 0.5,
                    vx: (Math.random() - 0.5) * 90, vy: 60 + Math.random() * 140,
                    life: 0, max: 2.6 + Math.random(),
                    size: 3 + Math.random() * 3,
                    color: CONFETTI[(Math.random() * CONFETTI.length) | 0],
                    gravity: 55, square: true
                });
            }
        },
        splash: function (x, y) {
            burst(x, y, { count: 20, color: ['#bae6fd', '#7dd3fc', '#e0f2fe'], speed: 130, life: 0.6, size: 3, lift: 70, gravity: 320 });
        },
        sand: function (x, y, angle) {
            burst(x, y, { count: 9, color: ['#e3ca92', '#cdb277'], speed: 70, life: 0.45, size: 2.5, angle: angle, spread: 1.6, gravity: 200 });
        },
        turf: function (x, y, angle) {
            burst(x, y, { count: 7, color: ['#4ade80', '#3f9d55', '#86efac'], speed: 60, life: 0.4, size: 2, angle: angle, spread: 1.4, gravity: 200 });
        },
        // A ring that expands and fades where the ball met a post. Particles
        // alone read as "something happened"; the ring says where.
        ring: function (x, y, r) {
            rings.push({ x: x, y: y, r: r, life: 0, max: 0.45 });
        },
        spark: function (x, y) {
            burst(x, y, { count: 10, color: ['#fde68a', '#fb923c', '#ffffff'], speed: 150, life: 0.3, size: 2, gravity: 0 });
        },
        clear: function () { particles.length = 0; rings.length = 0; }
    };

    /* ── frame ──────────────────────────────────────────────────────────── */

    var spin = 0;

    function frame(g, state, dt) {
        var course = state.world.course;
        var t = state.world.time;

        // The editor hands frame() a state of its own making, with no hole
        // number in it. Defaulting keeps the seed a number: NaN here would
        // reach hsl() and paint the whole field transparent.
        var key = typeof state.holeIndex === 'number' ? state.holeIndex : 0;
        if (!turf || turfKey !== key) {
            turfKey = key;
            turf = makeTurf(key + 1);
        }
        g.drawImage(turf, 0, 0);

        var i;
        drawGreen(g, course.hole);
        for (i = 0; i < course.rough.length; i++) drawRough(g, course.rough[i]);
        for (i = 0; i < course.slopes.length; i++) drawSlope(g, course.slopes[i]);
        for (i = 0; i < course.ice.length; i++) drawIce(g, course.ice[i]);
        for (i = 0; i < course.sand.length; i++) drawSand(g, course.sand[i]);
        drawWaterAll(g, course.water, t);

        // Tee marker.
        g.save();
        g.strokeStyle = 'rgba(255,255,255,0.35)';
        g.lineWidth = 2;
        g.setLineDash([3, 4]);
        g.beginPath();
        g.arc(course.tee.x, course.tee.y, 13, 0, Math.PI * 2);
        g.stroke();
        g.restore();

        drawHole(g, course.hole, t, state.world.ball);
        for (i = 0; i < course.walls.length; i++) drawWall(g, course.walls[i], t);
        for (i = 0; i < course.bumpers.length; i++) drawBumper(g, course.bumpers[i], t);

        updateParticles(dt);
        updateRings(g, dt);
        drawParticles(g);

        spin += P.speedOf(state.world.ball) * dt / C.BALL_R;
        if (!state.world.sunk) {
            drawTrail(g, state.trail);
            drawBall(g, state.world.ball, spin);
        }
        if (state.aim && state.aim.active && !state.world.moving && !state.world.sunk) {
            drawAim(g, state.world, state.aim, t, state.lastFrac);
        }

        // Field frame, drawn last so nothing spills over the cushions.
        g.save();
        g.strokeStyle = 'rgba(20,40,20,0.85)';
        g.lineWidth = 8;
        g.strokeRect(4, 4, C.WORLD_W - 8, C.WORLD_H - 8);
        g.strokeStyle = 'rgba(255,255,255,0.10)';
        g.lineWidth = 2;
        g.strokeRect(8, 8, C.WORLD_W - 16, C.WORLD_H - 16);
        g.restore();
    }

    GOLF.render = { frame: frame, effects: effects, roundRect: roundRect };

})(window.GOLF);
