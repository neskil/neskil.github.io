/* The frame: the ball, the cup, tunnels, the aim, the effects, and the
   order everything is laid down in. Reads state, never writes it — the only
   mutable thing in here is the particle list, which is visual-only and
   deliberately kept out of the simulation so a dropped frame can never change
   a score. The place itself — turf, hazards, walls, posts, trees, weather —
   is landscape.js's, in the biome scenery.js picks. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;
    var P = GOLF.physics;

    var L = GOLF.landscape;
    var SC = GOLF.scenery;
    var roundRect = L.roundRect;
    var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    /* `up` turns the flag. The board is drawn a quarter-turn round on a
       portrait screen (game.js → resize), and everything on it is flat on
       the grass except the flagstick, which stands up — so it is the one
       thing that has to be told which way up the screen is, or it lies on
       its side along the green. */
    function drawHole(g, hole, t, ball, v) {
        var up = v.turned ? Math.PI / 2 : 0;
        var lip = L.sv(v, 0, -3);
        // Cup.
        g.save();
        g.beginPath();
        g.arc(hole.x, hole.y, C.HOLE_R, 0, Math.PI * 2);
        var grad = g.createRadialGradient(hole.x + lip.x, hole.y + lip.y, 2, hole.x, hole.y, C.HOLE_R);
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
        if (up) {
            g.translate(hole.x, hole.y);
            g.rotate(up);
            g.translate(-hole.x, -hole.y);
        }
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
    function drawTrail(g, trail, color) {
        if (!trail || trail.length < 2) return;
        g.save();
        g.lineCap = 'round';
        for (var i = 1; i < trail.length; i++) {
            var f = i / (trail.length - 1);
            g.globalAlpha = 0.05 + f * 0.4;
            g.lineWidth = 1 + f * 3;
            g.strokeStyle = color || '#ffffff';
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
    /* A party plays in colour. The white ball is the one the game has
       always had; a coloured one keeps the same highlight and dimples and
       takes its body from the player's colour, with a dark rim so that an
       orange ball on sand or a blue one on ice is still a ball. */
    function drawBall(g, ball, spin, color, v) {
        var sh = L.sv(v, 2.5, 3.5), hl = L.sv(v, -2.5, -3), dot = L.sv(v, 0, -1), glint = L.sv(v, -2.4, -2.8);
        g.save();
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.beginPath();
        g.ellipse(ball.x + sh.x, ball.y + sh.y, C.BALL_R * 1.05, C.BALL_R * 0.9, 0, 0, Math.PI * 2);
        g.fill();

        var tinted = color && color !== C.PLAYER_COLORS[0];
        var grad = g.createRadialGradient(ball.x + hl.x, ball.y + hl.y, 1, ball.x, ball.y, C.BALL_R);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(tinted ? 0.35 : 0.6, tinted ? color : '#eef2f5');
        grad.addColorStop(1, tinted ? shade(color) : '#b9c4cc');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(ball.x, ball.y, C.BALL_R, 0, Math.PI * 2);
        g.fill();
        if (tinted) {
            g.strokeStyle = 'rgba(10, 20, 14, 0.55)';
            g.lineWidth = 1.2;
            g.stroke();
        }

        g.beginPath();
        g.arc(ball.x, ball.y, C.BALL_R, 0, Math.PI * 2);
        g.clip();
        g.fillStyle = 'rgba(120,140,155,0.35)';
        for (var i = 0; i < 5; i++) {
            var a = spin + i * (Math.PI * 2 / 5);
            var dx = Math.cos(a) * C.BALL_R * 0.52 + dot.x;
            var dy = Math.sin(a) * C.BALL_R * 0.52 + dot.y;
            g.beginPath();
            g.arc(ball.x + dx, ball.y + dy, 1.25, 0, Math.PI * 2);
            g.fill();
        }
        g.restore();

        g.save();
        g.fillStyle = 'rgba(255,255,255,0.9)';
        g.beginPath();
        g.arc(ball.x + glint.x, ball.y + glint.y, 1.7, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }

    // A darker version of a #rrggbb colour, for the underside of a ball.
    function shade(hex) {
        var n = parseInt(hex.slice(1), 16);
        var r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
        return 'rgb(' + Math.round(r * 0.55) + ',' + Math.round(gg * 0.55) + ',' + Math.round(b * 0.55) + ')';
    }

    /* ── tunnels ────────────────────────────────────────────────────────── */

    /* Each pair of mouths wears one colour, and no two pairs on a hole share
       one, because the only question a tunnel asks before you putt into it
       is *where does this come out*. A faint dotted line runs between the
       two — the pipe under the turf — so the answer is on the screen rather
       than in the player's memory of the last time they tried it. */
    function tunnelInk(i) { return C.TUNNEL_COLORS[i % C.TUNNEL_COLORS.length]; }

    function drawTunnels(g, list, t, v) {
        if (!list || !list.length) return;
        var sh = L.sv(v, 2, 3), turn = v.turned ? Math.PI / 2 : 0;
        var R = C.TUNNEL_R;
        var i;
        g.save();
        g.lineWidth = 2;
        g.setLineDash([2, 10]);
        g.lineCap = 'round';
        for (i = 0; i < list.length; i++) {
            g.strokeStyle = tunnelInk(i);
            g.globalAlpha = 0.28;
            g.beginPath();
            g.moveTo(list[i].x, list[i].y);
            g.lineTo(list[i].tx, list[i].ty);
            g.stroke();
        }
        g.restore();

        for (i = 0; i < list.length; i++) {
            mouth(g, list[i].x, list[i].y, tunnelInk(i), t, i);
            mouth(g, list[i].tx, list[i].ty, tunnelInk(i), t, i + 0.5);
        }

        function mouth(gg, x, y, ink, time, k) {
            gg.save();
            // A raised collar, lit from the same top-left as everything else.
            gg.fillStyle = 'rgba(0,0,0,0.35)';
            gg.beginPath();
            gg.arc(x + sh.x, y + sh.y, R + 5, 0, Math.PI * 2);
            gg.fill();
            gg.fillStyle = ink;
            gg.beginPath();
            gg.arc(x, y, R + 5, 0, Math.PI * 2);
            gg.fill();
            var grad = gg.createRadialGradient(x, y, R * 0.2, x, y, R);
            grad.addColorStop(0, '#000000');
            grad.addColorStop(0.7, '#0a0f1a');
            grad.addColorStop(1, '#1e1b3a');
            gg.fillStyle = grad;
            gg.beginPath();
            gg.arc(x, y, R, 0, Math.PI * 2);
            gg.fill();
            // Two arcs turning slowly inside: a mouth, not a cup.
            gg.strokeStyle = ink;
            gg.globalAlpha = 0.55;
            gg.lineWidth = 2;
            var a = time * 1.6 + k * 2;
            gg.beginPath();
            gg.arc(x, y, R * 0.55, a, a + 1.3);
            gg.stroke();
            gg.beginPath();
            gg.arc(x, y, R * 0.55, a + Math.PI, a + Math.PI + 1.3);
            gg.stroke();
            gg.globalAlpha = 1;
            gg.strokeStyle = 'rgba(255,255,255,0.35)';
            gg.lineWidth = 1;
            gg.beginPath();
            gg.arc(x, y, R + 4.5, Math.PI * 1.05 + turn, Math.PI * 1.7 + turn);
            gg.stroke();
            gg.restore();
        }
    }

    /* ── the first shot ─────────────────────────────────────────────────

       A brand-new player is shown the stroke rather than told it: a ghost
       fingertip lands on the ball, pulls back away from the flag, and lets
       go, and a ghost arrow runs out the other way. It loops until the
       first real shot, and then never appears again. Drawn here rather
       than as a DOM overlay so it sits on the ball it is about, on any
       screen and at any scale. */
    function drawCoach(g, ball, angle, t) {
        var p = (t % 2.4) / 2.4;
        var back = angle + Math.PI;
        var ux = Math.cos(back), uy = Math.sin(back);
        var pull = p < 0.62 ? easeOut(p / 0.62) : 1;
        var gone = p < 0.62 ? 0 : (p - 0.62) / 0.38;
        var reach = 18 + pull * 86;

        g.save();
        // The ball, ringed, so the eye knows where to start.
        g.strokeStyle = 'rgba(255,255,255,' + (0.5 + Math.sin(t * 5) * 0.25).toFixed(3) + ')';
        g.lineWidth = 2.5;
        g.beginPath();
        g.arc(ball.x, ball.y, C.BALL_R + 9 + Math.sin(t * 5) * 2, 0, Math.PI * 2);
        g.stroke();

        if (gone === 0) {
            g.setLineDash([5, 6]);
            g.strokeStyle = 'rgba(255,255,255,0.55)';
            g.lineWidth = 2;
            g.beginPath();
            g.moveTo(ball.x, ball.y);
            g.lineTo(ball.x + ux * reach, ball.y + uy * reach);
            g.stroke();
            g.setLineDash([]);
            // The fingertip.
            g.fillStyle = 'rgba(255,255,255,0.85)';
            g.beginPath();
            g.arc(ball.x + ux * reach, ball.y + uy * reach, 11, 0, Math.PI * 2);
            g.fill();
            g.strokeStyle = 'rgba(4,20,12,0.5)';
            g.lineWidth = 2;
            g.stroke();
        }

        // The answer: the way the ball will go, growing with the pull.
        var len = 30 + pull * 80;
        var fx = -ux, fy = -uy;
        g.globalAlpha = gone === 0 ? 0.35 + pull * 0.4 : Math.max(0, 0.75 - gone);
        g.strokeStyle = '#fde68a';
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(ball.x + fx * 16, ball.y + fy * 16);
        g.lineTo(ball.x + fx * (16 + len), ball.y + fy * (16 + len));
        g.stroke();
        g.fillStyle = '#fde68a';
        g.beginPath();
        var hx = ball.x + fx * (16 + len + 12), hy = ball.y + fy * (16 + len + 12);
        g.moveTo(hx, hy);
        g.lineTo(hx - fx * 14 - fy * 8, hy - fy * 14 + fx * 8);
        g.lineTo(hx - fx * 14 + fy * 8, hy - fy * 14 - fx * 8);
        g.closePath();
        g.fill();
        g.restore();
    }

    function easeOut(x) { return 1 - (1 - x) * (1 - x); }

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
        // Down one mouth and up the other: a puff where it went in, a ring
        // where it came out, in the tunnel's own colour.
        tunnel: function (x, y, tx, ty, ink) {
            burst(x, y, { count: 10, color: [ink || '#a78bfa', '#ffffff'], speed: 80, life: 0.35, size: 2, gravity: 0 });
            burst(tx, ty, { count: 14, color: [ink || '#a78bfa', '#ffffff'], speed: 140, life: 0.45, size: 2.2, gravity: 0 });
            rings.push({ x: tx, y: ty, r: C.TUNNEL_R, life: 0, max: 0.4 });
        },
        // A best on a hole: gold, and upward.
        stars: function (x, y) {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            burst(x, y, { count: 30, color: ['#fbbf24', '#fde68a', '#ffffff'], speed: 190, life: 1.0, size: 3, lift: 120, gravity: 160 });
        },
        clear: function () { particles.length = 0; rings.length = 0; }
    };

    /* ── frame ──────────────────────────────────────────────────────────── */

    var spin = 0;
    // The coach's own clock: world time stands still between shots on a hole
    // with nothing moving, and the ghost finger has to keep going.
    var clock = 0;

    function frame(g, state, dt) {
        clock += dt || 0;
        var course = state.world.course;
        var t = state.world.time;
        var v = L.viewOf(!!state.turned);
        var theme = SC.themeNamed(state.theme);
        // The editor hands frame() a state of its own making, with no hole
        // number in it. Defaulting keeps the seed a number: NaN here would
        // reach hsl() and paint the whole field transparent.
        var key = typeof state.holeIndex === 'number' ? state.holeIndex : 0;
        var scene = L.scene(course, theme, v, { key: state.sceneKey, res: state.res || 1, seed: key + 1 });
        var i;

        // Nothing is drawn off the field. The game's canvas is the field, so
        // this costs it nothing; the editor pans and zooms round a margin,
        // and the bled shorelines and the crowns of the trees beside the
        // course would otherwise hang out into it.
        g.save();
        g.beginPath();
        g.rect(0, 0, C.WORLD_W, C.WORLD_H);
        g.clip();

        // Under the ball: the ground, the water, tunnels, the cup, every
        // wall that holds still — then the ones that move, and the posts.
        scene.ground(g);
        L.drawWater(g, course.water, theme, v, t, clock, scene.decor);
        drawTunnels(g, course.tunnels, t, v);
        drawHole(g, course.hole, t, state.world.ball, v);
        scene.solids(g);
        for (i = 0; i < course.walls.length; i++) {
            if (course.walls[i].move) L.drawWall(g, course.walls[i], t, theme, v);
        }
        for (i = 0; i < course.bumpers.length; i++) L.drawBumper(g, course.bumpers[i], t, theme, v);

        updateParticles(dt);
        updateRings(g, dt);
        drawParticles(g);

        spin += P.speedOf(state.world.ball) * dt / C.BALL_R;
        if (!state.world.sunk) {
            drawTrail(g, state.trail, state.ballColor);
            drawBall(g, state.world.ball, spin, state.ballColor, v);
        }
        if (state.aim && state.aim.active && !state.world.moving && !state.world.sunk) {
            drawAim(g, state.world, state.aim, t, state.lastFrac);
        } else if (state.coach && !state.world.moving && !state.world.sunk) {
            drawCoach(g, state.world.ball, state.aim.angle, clock);
        }

        // Over the ball: the course's edge, the trees reaching over it, and
        // the weather over everything. A crown the ball is under goes thin.
        L.drawRim(g, theme, v);
        L.drawCanopies(g, scene.decor.canopies, theme, v, clock, state.world.sunk ? null : state.world.ball);
        L.drawClouds(g, motionQuery && motionQuery.matches ? 0 : clock, v, key + 1);
        g.restore();
    }

    GOLF.render = { frame: frame, effects: effects, roundRect: roundRect, tunnelInk: tunnelInk };

})(window.GOLF);
