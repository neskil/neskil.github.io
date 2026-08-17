/* Everything that draws. Reads state, never writes it — the only mutable
   thing in here is the particle list, which is visual-only and deliberately
   kept out of the simulation so a dropped frame can never change a score.

   The turf is generated once into an offscreen canvas at load and blitted
   after that. It is a static 960x640 image: regenerating the stripes, the
   speckle and the vignette every frame was the single most expensive thing
   on the page, for a picture that never changes. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;
    var P = GOLF.physics;

    var turf = null;

    function makeTurf() {
        var c = document.createElement('canvas');
        c.width = C.WORLD_W;
        c.height = C.WORLD_H;
        var g = c.getContext('2d');

        g.fillStyle = '#2e7a40';
        g.fillRect(0, 0, C.WORLD_W, C.WORLD_H);

        // Mower stripes, angled so they read as a groundskeeper's work rather
        // than as a CSS gradient.
        g.save();
        g.translate(C.WORLD_W / 2, C.WORLD_H / 2);
        g.rotate(-0.22);
        g.translate(-C.WORLD_W, -C.WORLD_H);
        for (var i = 0; i < 40; i++) {
            g.fillStyle = i % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.035)';
            g.fillRect(i * 62, 0, 62, C.WORLD_H * 3);
        }
        g.restore();

        // Speckle: a few thousand one-pixel blades so flat colour does not
        // read as plastic when the ball rolls over it.
        for (var n = 0; n < 2600; n++) {
            var x = Math.random() * C.WORLD_W, y = Math.random() * C.WORLD_H;
            g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
            g.fillRect(x, y, 1.6, 1.6);
        }

        var v = g.createRadialGradient(C.WORLD_W / 2, C.WORLD_H / 2, C.WORLD_H * 0.35,
                                       C.WORLD_W / 2, C.WORLD_H / 2, C.WORLD_H * 0.95);
        v.addColorStop(0, 'rgba(0,0,0,0)');
        v.addColorStop(1, 'rgba(0,0,0,0.38)');
        g.fillStyle = v;
        g.fillRect(0, 0, C.WORLD_W, C.WORLD_H);

        return c;
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

    function drawWall(g, wall, t) {
        var R = P.wallRect(wall, t);
        g.save();
        g.shadowColor = 'rgba(0,0,0,0.45)';
        g.shadowBlur = 12;
        g.shadowOffsetY = 5;
        roundRect(g, R.x, R.y, R.w, R.h, 6);
        g.fillStyle = wall.move ? '#8a5a34' : '#6d4a2e';
        g.fill();
        g.restore();

        g.save();
        roundRect(g, R.x, R.y, R.w, R.h, 6);
        g.clip();
        var grad = g.createLinearGradient(R.x, R.y, R.x, R.y + R.h);
        grad.addColorStop(0, 'rgba(255,255,255,0.28)');
        grad.addColorStop(0.18, 'rgba(255,255,255,0.05)');
        grad.addColorStop(1, 'rgba(0,0,0,0.30)');
        g.fillStyle = grad;
        g.fillRect(R.x, R.y, R.w, R.h);
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

    function drawBall(g, ball, trail) {
        if (trail && trail.length > 1) {
            g.save();
            g.strokeStyle = 'rgba(255,255,255,0.28)';
            g.lineWidth = 3;
            g.lineCap = 'round';
            g.beginPath();
            for (var i = 0; i < trail.length; i++) {
                if (i === 0) g.moveTo(trail[i].x, trail[i].y); else g.lineTo(trail[i].x, trail[i].y);
            }
            g.globalAlpha = 0.45;
            g.stroke();
            g.restore();
        }

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
    function drawAim(g, world, aim, t) {
        var b = world.ball;
        var frac = aim.power / C.MAX_POWER;
        var angle = aim.angle;
        var tip = C.AIM_ARROW;
        var tail = C.BALL_R + 7;

        g.save();
        g.translate(b.x, b.y);
        g.rotate(angle);

        // Shaft. It crawls forward so the arrow reads as live while aiming,
        // but the dashes are a fixed count — nothing here scales with power.
        g.setLineDash([6, 7]);
        g.lineDashOffset = -t * 26;
        g.strokeStyle = 'rgba(255,255,255,0.8)';
        g.lineWidth = 2.5;
        g.lineCap = 'butt';
        g.beginPath();
        g.moveTo(tail, 0);
        g.lineTo(tip, 0);
        g.stroke();

        g.setLineDash([]);
        g.fillStyle = 'rgba(255,255,255,0.9)';
        g.beginPath();
        g.moveTo(tip + 11, 0);
        g.lineTo(tip - 2, -6.5);
        g.lineTo(tip - 2, 6.5);
        g.closePath();
        g.fill();
        g.restore();

        // Power arc around the ball: green through amber to red, so the meter
        // is readable without reading a number. Kept — it is a dial, not a
        // distance, and a keyboard player has no drag in their hand to feel.
        var hue = 130 - frac * 130;
        g.save();
        g.lineCap = 'round';
        g.strokeStyle = 'rgba(0,0,0,0.35)';
        g.lineWidth = 6;
        g.beginPath();
        g.arc(b.x, b.y, C.BALL_R + 9, -Math.PI * 0.75, Math.PI * 0.75);
        g.stroke();
        g.strokeStyle = 'hsl(' + hue + ', 85%, 55%)';
        g.lineWidth = 5;
        g.beginPath();
        g.arc(b.x, b.y, C.BALL_R + 9, -Math.PI * 0.75, -Math.PI * 0.75 + Math.PI * 1.5 * frac);
        g.stroke();
        g.restore();
    }

    /* ── particles ──────────────────────────────────────────────────────── */

    var particles = [];

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
        spark: function (x, y) {
            burst(x, y, { count: 10, color: ['#fde68a', '#fb923c', '#ffffff'], speed: 150, life: 0.3, size: 2, gravity: 0 });
        },
        clear: function () { particles.length = 0; }
    };

    /* ── frame ──────────────────────────────────────────────────────────── */

    function frame(g, state, dt) {
        var course = state.world.course;
        var t = state.world.time;

        if (!turf) turf = makeTurf();
        g.drawImage(turf, 0, 0);

        var i;
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
        drawParticles(g);

        if (!state.world.sunk) drawBall(g, state.world.ball, state.trail);
        if (state.aim && state.aim.active && !state.world.moving && !state.world.sunk) {
            drawAim(g, state.world, state.aim, t);
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
