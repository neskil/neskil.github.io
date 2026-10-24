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
    var AMB = GOLF.ambience;
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
        // The funnel: the turf falls away for a few pixels round the lip
        // (physics.groundAt), shaded as a soft dip so the slope that tips a
        // slow ball in is a thing you can see.
        g.save();
        var fun = g.createRadialGradient(hole.x, hole.y, C.HOLE_R, hole.x, hole.y, C.HOLE_R + C.CUP_BEVEL + 2);
        fun.addColorStop(0, 'rgba(0,0,0,0.26)');
        fun.addColorStop(0.55, 'rgba(0,0,0,0.08)');
        fun.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = fun;
        g.beginPath();
        g.arc(hole.x, hole.y, C.HOLE_R + C.CUP_BEVEL + 2, 0, Math.PI * 2);
        g.fill();
        g.restore();
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

    /* The ball rolls. `spin` is its orientation — a rotation from the
       ball's own frame to the world's, x and y on the green and z up out of
       it — turned every frame about the axis a ball rolling without
       slipping turns about (up × velocity), through distance over radius.
       Its marks are fixed to the sphere: dimples scattered over it, and a
       triple track of alignment stripes. Only the half
       facing up is drawn, each mark squashed and faded as it turns towards
       the edge, while the shading and the glint stay with the light — which
       is what makes it read as a ball turning over rather than a picture of
       one spinning on the spot. At pace the marks fade into a blur, since a
       ball turning a third of a revolution a frame would otherwise strobe
       and appear to roll backwards. */
    var ROLL_DOTS = (function () {
        var out = [], n = 64, gold = Math.PI * (3 - Math.sqrt(5));
        for (var i = 0; i < n; i++) {
            var z = 1 - (2 * i + 1) / n, rr = Math.sqrt(1 - z * z), a = i * gold;
            out.push([Math.cos(a) * rr, Math.sin(a) * rr, z]);
        }
        return out;
    })();
    var ROLL_LINE = 36;

    function rolled() { return { m: [1, 0, 0, 0, 1, 0, 0, 0, 1], blur: 0, n: 0 }; }

    // Turn the ball through a frame's roll: Rodrigues about the horizontal
    // axis (-vy, vx, 0), applied in the world frame.
    function roll(o, vx, vy, dt) {
        var sp = Math.hypot(vx, vy), ang = sp * dt / C.BALL_R;
        o.blur = ang;
        if (ang < 1e-6) return;
        var ax = -vy / sp, ay = vx / sp, c = Math.cos(ang), s = Math.sin(ang), t = 1 - c;
        var R = [t * ax * ax + c, t * ax * ay, s * ay,
                 t * ax * ay, t * ay * ay + c, -s * ax,
                 -s * ay, s * ax, c];
        var m = o.m, out = new Array(9);
        for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) {
            out[i * 3 + j] = R[i * 3] * m[j] + R[i * 3 + 1] * m[3 + j] + R[i * 3 + 2] * m[6 + j];
        }
        o.m = out;
        // A frame's rounding at a time adds up; straighten the axes now and
        // then so the ball does not slowly turn into an egg.
        if (++o.n % 120 === 0) orthonormal(o.m);
    }

    function orthonormal(m) {
        var c0 = [m[0], m[3], m[6]], c1 = [m[1], m[4], m[7]];
        var l = Math.hypot(c0[0], c0[1], c0[2]);
        c0 = [c0[0] / l, c0[1] / l, c0[2] / l];
        var d = c0[0] * c1[0] + c0[1] * c1[1] + c0[2] * c1[2];
        c1 = [c1[0] - d * c0[0], c1[1] - d * c0[1], c1[2] - d * c0[2]];
        l = Math.hypot(c1[0], c1[1], c1[2]);
        c1 = [c1[0] / l, c1[1] / l, c1[2] / l];
        var c2 = [c0[1] * c1[2] - c0[2] * c1[1], c0[2] * c1[0] - c0[0] * c1[2], c0[0] * c1[1] - c0[1] * c1[0]];
        m[0] = c0[0]; m[3] = c0[1]; m[6] = c0[2];
        m[1] = c1[0]; m[4] = c1[1]; m[7] = c1[2];
        m[2] = c2[0]; m[5] = c2[1]; m[8] = c2[2];
    }

    /* The marks on the sphere, drawn over the ball at (x, y): a fine cover
       of dimples, and a triple track — three parallel stripes, blue, red,
       blue, part of the way round, as the alignment balls have them. On a
       party ball in colour the stripes are white. */
    var TRACKS = [
        { off: -0.27, ink: 'rgba(37,99,235,0.85)', alt: 'rgba(255,255,255,0.7)', w: 0.85 },
        { off: 0, ink: 'rgba(225,29,72,0.9)', alt: 'rgba(255,255,255,0.85)', w: 1.05 },
        { off: 0.27, ink: 'rgba(37,99,235,0.85)', alt: 'rgba(255,255,255,0.7)', w: 0.85 }
    ];
    var TRACK_ARC = Math.PI * 0.62;
    function drawMarks(g, x, y, o, tinted, R) {
        var m = o.m, r = R || C.BALL_R;
        // Clear below a sixth of a turn a frame, gone to a haze by half.
        var clear = Math.max(0.12, Math.min(1, 1 - (o.blur - 0.9) / 1.6));
        function at(p) {
            return [m[0] * p[0] + m[1] * p[1] + m[2] * p[2],
                    m[3] * p[0] + m[4] * p[1] + m[5] * p[2],
                    m[6] * p[0] + m[7] * p[1] + m[8] * p[2]];
        }
        g.fillStyle = tinted ? 'rgba(0,0,0,0.22)' : 'rgba(110,128,145,0.34)';
        for (var i = 0; i < ROLL_DOTS.length; i++) {
            var q = at(ROLL_DOTS[i]);
            if (q[2] < 0.08) continue;
            g.globalAlpha = clear * Math.min(1, q[2] * 1.6);
            g.beginPath();
            g.ellipse(x + q[0] * r * 0.94, y + q[1] * r * 0.94, 0.72 * Math.max(0.25, q[2]), 0.72,
                Math.atan2(q[1], q[0]), 0, Math.PI * 2);
            g.fill();
        }
        g.lineCap = 'round';
        for (var t = 0; t < TRACKS.length; t++) {
            var tr = TRACKS[t], c = Math.sqrt(1 - tr.off * tr.off), prev = null;
            g.strokeStyle = tinted ? tr.alt : tr.ink;
            g.lineWidth = tr.w * r / C.BALL_R;
            for (var k = 0; k <= ROLL_LINE; k++) {
                var a = -TRACK_ARC + 2 * TRACK_ARC * k / ROLL_LINE;
                var p = at([Math.sin(a) * c, tr.off, Math.cos(a) * c]);
                if (prev && prev[2] > 0 && p[2] > 0) {
                    g.globalAlpha = clear * Math.min(1, (prev[2] + p[2]) * 1.2);
                    g.beginPath();
                    g.moveTo(x + prev[0] * r * 0.97, y + prev[1] * r * 0.97);
                    g.lineTo(x + p[0] * r * 0.97, y + p[1] * r * 0.97);
                    g.stroke();
                }
                prev = p;
            }
        }
        g.globalAlpha = 1;
    }

    /* A party plays in colour. The white ball is the one the game has
       always had; a coloured one keeps the same highlight and dimples and
       takes its body from the player's colour, with a dark rim so that an
       orange ball on sand or a blue one on ice is still a ball. */
    /* `pose` is what is happening to the ball rather than where it is:
       `lift` 0..1 is how high a skip has it (it grows, and its shadow falls
       further away and fainter), `squash` flattens it against whatever it
       just hit, along `nx, ny`, and `drown` 0..1 is how far under the water
       it has gone. All three are drawing only — the physics never sees them. */
    /* And it has a height. Over the cup the ball is a sphere with a centre
       `z` above the green (physics.cup), and the drawing follows it: hopping
       out over the back it rises up the screen and leaves its shadow behind
       on the turf; dropping in it sinks down the screen, darker and a touch
       smaller, and the near side of the cup covers whatever of it is below
       the green. Everywhere else z is the radius and none of this shows. */
    function drawBall(g, ball, spin, color, v, pose, hole) {
        var r = C.BALL_R, h = ball.z === undefined ? 0 : ball.z - r;
        var hop = Math.max(0, h), dip = Math.max(0, -h);
        if (hop < 0.05 && dip < 0.05) return drawBallAt(g, ball, ball, spin, color, v, pose, 0, 0);
        var off = L.sv(v, 0, dip * 0.55 - hop);
        var at = { x: ball.x + off.x, y: ball.y + off.y };
        var deep = Math.min(1, dip / (2 * r));
        g.save();
        // Below the green: what the cup's near wall hides. The part still
        // above the green is the cap the turf has not reached yet.
        if (hole && dip > r) {
            var z = r - dip, cap = Math.sqrt(Math.max(0, r * r - z * z));
            g.beginPath();
            g.arc(hole.x, hole.y, C.HOLE_R, 0, Math.PI * 2);
            g.moveTo(ball.x + cap, ball.y);
            g.arc(ball.x, ball.y, cap, 0, Math.PI * 2);
            g.clip();
        }
        var k = 1 - 0.14 * deep;
        g.translate(at.x, at.y);
        g.scale(k, k);
        g.translate(-at.x, -at.y);
        drawBallAt(g, ball, at, spin, color, v, pose, hop, dip);
        if (deep > 0) {
            g.fillStyle = 'rgba(0,0,0,' + (0.62 * deep).toFixed(3) + ')';
            g.beginPath();
            g.arc(at.x, at.y, r + 0.5, 0, Math.PI * 2);
            g.fill();
        }
        g.restore();
    }

    // The ball itself, drawn at `at`, its shadow on the ground under
    // `ground`: pushed further out and fainter the higher it flies, gone
    // once the ball is down in the dark of the cup or under the water.
    function drawBallAt(g, ground, ball, spin, color, v, pose, hop, dip) {
        pose = pose || NO_POSE;
        var lift = pose.lift || 0, drown = pose.drown || 0, sq = pose.squash || 0;
        var R = C.BALL_R * (1 + lift * 0.4) * (1 - drown * 0.6);
        var reach = 1 + lift * 3.2;
        var sh = L.sv(v, 2.5 * reach + hop * 0.5, 3.5 * reach + hop * 0.7), hl = L.sv(v, -2.5, -3), glint = L.sv(v, -2.4, -2.8);
        var shade0 = drown ? 0 : (0.35 - lift * 0.17) * Math.max(0.3, 1 - hop / 28) * Math.max(0, 1 - dip / C.BALL_R);
        g.save();
        if (drown) g.globalAlpha = Math.max(0, 1 - drown);
        if (sq) {
            var turn = Math.atan2(pose.ny, pose.nx);
            g.translate(ball.x, ball.y);
            g.rotate(turn);
            g.scale(1 - sq * 0.3, 1 + sq * 0.16);
            g.rotate(-turn);
            g.translate(-ball.x, -ball.y);
        }
        g.save();
        if (shade0 > 0) {
            g.fillStyle = 'rgba(0,0,0,' + shade0.toFixed(3) + ')';
            g.beginPath();
            g.ellipse(ground.x + sh.x, ground.y + sh.y, R * (1.05 + hop * 0.01), R * (0.9 + hop * 0.01), 0, 0, Math.PI * 2);
            g.fill();
        }

        var tinted = color && color !== C.PLAYER_COLORS[0];
        var grad = g.createRadialGradient(ball.x + hl.x, ball.y + hl.y, 1, ball.x, ball.y, R);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(tinted ? 0.35 : 0.6, tinted ? color : '#eef2f5');
        grad.addColorStop(1, tinted ? shade(color) : '#b9c4cc');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(ball.x, ball.y, R, 0, Math.PI * 2);
        g.fill();
        if (tinted) {
            g.strokeStyle = 'rgba(10, 20, 14, 0.55)';
            g.lineWidth = 1.2;
            g.stroke();
        }

        g.beginPath();
        g.arc(ball.x, ball.y, R, 0, Math.PI * 2);
        g.clip();
        drawMarks(g, ball.x, ball.y, spin, tinted, R);
        // The shading again, faintly, over the marks: they sit on the
        // sphere, so they darken towards its edge with everything else.
        var rim = g.createRadialGradient(ball.x + hl.x, ball.y + hl.y, R * 0.4, ball.x, ball.y, R);
        rim.addColorStop(0, 'rgba(0,0,0,0)');
        rim.addColorStop(1, 'rgba(40,55,70,0.22)');
        g.fillStyle = rim;
        g.fillRect(ball.x - R, ball.y - R, R * 2, R * 2);
        // Going under: the water closes over it from the outside in.
        if (drown) {
            g.fillStyle = 'rgba(56, 120, 160,' + (drown * 0.8).toFixed(3) + ')';
            g.fillRect(ball.x - R, ball.y - R, R * 2, R * 2);
        }
        g.restore();

        g.fillStyle = 'rgba(255,255,255,0.9)';
        g.beginPath();
        g.arc(ball.x + glint.x, ball.y + glint.y, 1.7, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }

    var NO_POSE = {};

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

        /* The guide ray: a short, fading run past the arrowhead. It used to
           go on to the edge of the field, and a ruled line across the whole
           hole is the putt read for you — the player only had to lay it on
           the cup. Now it says which way the arrow is pointing for a hand's
           width more and then leaves the line to your eye.

           Past SAFE_POWER it opens into the cone the shot can actually leave
           in. The scatter is not a surprise the game springs on you after the
           fact — it is drawn, to scale, in the moment you are deciding how far
           to pull, which is the only way a risk is a choice rather than a
           trick. Its edges and fill run further than the plain ray
           (AIM_CONE_LEN) before fading, so the warning is plain at a glance;
           the centre line stops with the ray all the same. */
        var cone = P.spread(aim.power);
        var far = tip + C.AIM_GUIDE_LEN, wide = tip + C.AIM_CONE_LEN;
        var colour = cone > 0 ? '251,113,133' : '255,255,255';
        function fade(a, ea, to) {
            var x0 = b.x + Math.cos(ea) * tip, y0 = b.y + Math.sin(ea) * tip;
            var grad = g.createLinearGradient(x0, y0, b.x + Math.cos(ea) * to, b.y + Math.sin(ea) * to);
            grad.addColorStop(0, 'rgba(' + colour + ',' + a + ')');
            grad.addColorStop(1, 'rgba(' + colour + ',0)');
            return grad;
        }
        g.save();
        // The cone is a warning, not a hint: it earns twice the ink the plain
        // ray gets, or the one drawing on screen that says "this shot may not
        // go where you are pointing" is the faintest thing on the field.
        var ink = cone > 0 ? C.AIM_GUIDE_ALPHA * 2.2 : C.AIM_GUIDE_ALPHA;
        g.lineWidth = 1.5;
        g.setLineDash([2, 9]);
        g.lineDashOffset = -t * 18;
        for (var e = -1; e <= 1; e++) {
            if (e !== 0 && cone === 0) continue;
            var ea = angle + e * cone, to = e === 0 ? far : wide;
            g.strokeStyle = fade(ink, ea, to);
            g.beginPath();
            g.moveTo(b.x + Math.cos(ea) * tip, b.y + Math.sin(ea) * tip);
            g.lineTo(b.x + Math.cos(ea) * to, b.y + Math.sin(ea) * to);
            g.stroke();
        }
        g.restore();

        if (cone > 0) {
            g.save();
            var halo = g.createRadialGradient(b.x, b.y, tip, b.x, b.y, wide);
            halo.addColorStop(0, 'rgba(251,113,133,0.16)');
            halo.addColorStop(0.6, 'rgba(251,113,133,0.08)');
            halo.addColorStop(1, 'rgba(251,113,133,0)');
            g.fillStyle = halo;
            g.beginPath();
            g.moveTo(b.x + ux * tip, b.y + uy * tip);
            g.arc(b.x, b.y, wide, angle - cone, angle + cone);
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

    /* A ring is gold and grows 26px unless it says otherwise. One that
       starts with a negative life waits that long before it shows, which is
       how a splash sends its ripples out one after another. */
    function addRing(x, y, r, opts) {
        opts = opts || {};
        rings.push({
            x: x, y: y, r: r, life: -(opts.delay || 0), max: opts.life || 0.45,
            color: opts.color || '#fde68a', grow: opts.grow === undefined ? 26 : opts.grow,
            width: opts.width || 3, alpha: opts.alpha || 0.8
        });
    }

    function updateRings(g, dt) {
        for (var i = rings.length - 1; i >= 0; i--) {
            var r = rings[i];
            r.life += dt;
            if (r.life >= r.max) { rings.splice(i, 1); continue; }
            if (r.life < 0) continue;
            var f = r.life / r.max;
            g.save();
            g.globalAlpha = (1 - f) * r.alpha;
            g.strokeStyle = r.color;
            g.lineWidth = r.width * (1 - f) + 1;
            g.beginPath();
            g.arc(r.x, r.y, r.r + easeOut(f) * r.grow, 0, Math.PI * 2);
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
    var SPRAY = ['#bae6fd', '#7dd3fc', '#e0f2fe', '#ffffff'];
    var FOAM = '#e0f2fe';

    /* The ball's own state between frames — a knock it is still flattened
       from, and how long it has been going under. Both are spent in a few
       tenths of a second; `clear` drops them with everything else. */
    var squash = null;
    var drown = null;

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
        /* In: a crown of spray thrown up and falling back, three ripples
           going out one after another, and the ball sinking where it went in
           for as long as the game holds the frame before the replay. */
        splash: function (x, y) {
            burst(x, y, { count: 26, color: SPRAY, speed: 150, life: 0.7, size: 3, lift: 150, gravity: 420 });
            burst(x, y, { count: 12, color: SPRAY, speed: 60, life: 0.5, size: 2, lift: 220, gravity: 520 });
            for (var k = 0; k < 3; k++) {
                addRing(x, y, C.BALL_R, { color: FOAM, grow: 34 + k * 14, life: 0.9, delay: k * 0.16, width: 2.5, alpha: 0.7 });
            }
            // And the shader's own rings, in the water itself.
            if (GOLF.water) GOLF.water.ripple(x, y, 1);
            drown = { life: 0 };
        },
        /* Off the top: a ripple where it touched, and spray thrown out to
           both sides like a wake. Each skip after the first is a little
           smaller — `n` counts them. */
        skip: function (x, y, angle, n) {
            var k = Math.max(0.5, 1 - (n - 1) * 0.2);
            addRing(x, y, C.BALL_R * 0.6, { color: FOAM, grow: 30 * k, life: 0.65, width: 3, alpha: 0.95 });
            addRing(x, y, C.BALL_R * 0.4, { color: FOAM, grow: 48 * k, life: 0.9, delay: 0.1, width: 2, alpha: 0.6 });
            burst(x, y, { count: Math.round(13 * k), color: SPRAY, speed: 150 * k, life: 0.5, size: 2.8, angle: angle + 1.1, spread: 0.6, lift: 50, gravity: 300 });
            burst(x, y, { count: Math.round(13 * k), color: SPRAY, speed: 150 * k, life: 0.5, size: 2.8, angle: angle - 1.1, spread: 0.6, lift: 50, gravity: 300 });
            burst(x, y, { count: Math.round(6 * k), color: SPRAY, speed: 40, life: 0.45, size: 2.2, lift: 140, gravity: 480 });
        },
        /* Into the lava: no spray, a flare and smoke, and embers thrown up
           and falling back — and the ball going under all the same. */
        burn: function (x, y) {
            burst(x, y, { count: 22, color: ['#fde047', '#fb923c', '#ef4444', '#ffffff'], speed: 130, life: 0.8, size: 2.6, lift: 160, gravity: 380 });
            burst(x, y, { count: 10, color: ['rgba(60, 50, 45, 0.7)', 'rgba(110, 100, 95, 0.6)'], speed: 30, life: 1.2, size: 6, lift: 70, gravity: -20 });
            addRing(x, y, C.BALL_R, { color: '#fdba74', grow: 30, life: 0.6, width: 3, alpha: 0.9 });
            drown = { life: 0 };
        },
        // Thrown up by a geyser: a burst of spray and a ring at the vent.
        vent: function (x, y) {
            burst(x, y, { count: 24, color: SPRAY, speed: 110, life: 0.8, size: 2.6, lift: 260, gravity: 420 });
            addRing(x, y, C.VENT_R, { color: '#ffffff', grow: 26, life: 0.5, width: 3, alpha: 0.8 });
        },
        // Caught by a slide: snow thrown up round the ball.
        swept: function (x, y) {
            burst(x, y, { count: 16, color: ['#ffffff', '#e2ecf6', '#cbd8e6'], speed: 90, life: 0.6, size: 3, lift: 60, gravity: 160 });
        },
        // Down on dry ground after a skip.
        land: function (x, y, angle) {
            burst(x, y, { count: 12, color: ['#4ade80', '#3f9d55', '#86efac', '#e2e8f0'], speed: 95, life: 0.45, size: 2.4, angle: angle + Math.PI, spread: 2.4, gravity: 200 });
            addRing(x, y, C.BALL_R, { color: '#ffffff', grow: 16, life: 0.35, width: 2, alpha: 0.7 });
        },
        // `p` is the shot's share of the dial, so a tap barely scuffs the
        // ground and a full swing tears some of it up.
        sand: function (x, y, angle, p) {
            p = p === undefined ? 0.5 : p;
            burst(x, y, { count: Math.round(5 + p * 10), color: ['#e3ca92', '#cdb277'], speed: 50 + p * 50, life: 0.45, size: 2.5, angle: angle, spread: 1.6, gravity: 200 });
        },
        turf: function (x, y, angle, p) {
            p = p === undefined ? 0.5 : p;
            burst(x, y, { count: Math.round(4 + p * 10), color: ['#4ade80', '#3f9d55', '#86efac'], speed: 40 + p * 50, life: 0.4, size: 2, angle: angle, spread: 1.4, gravity: 200 });
        },
        /* The strike: a white ring off the ball that grows with the swing,
           and past the safe line a second, hotter one — the overswing is
           felt in the hand before the ball shows where it went. */
        strike: function (x, y, angle, p, hot) {
            addRing(x, y, C.BALL_R + 2, { color: '#ffffff', grow: 10 + p * 26, life: 0.28 + p * 0.12, width: 1.5 + p * 2.5, alpha: 0.9 });
            if (hot) addRing(x, y, C.BALL_R + 4, { color: '#fb923c', grow: 34, life: 0.42, delay: 0.04, width: 3, alpha: 0.8 });
            if (p > 0.45) {
                burst(x, y, { count: Math.round(p * 6), color: '#ffffff', speed: 120 + p * 160, life: 0.22, size: 1.4, angle: angle, spread: 0.35, gravity: 0 });
            }
        },
        /* A knock off a wall, a rail or a post: chips off the thing at the
           point of contact, thrown back along the way the ball came off, and
           the ball flattened against it for a moment. `s` is 0..1, how hard. */
        impact: function (x, y, nx, ny, s, post) {
            var a = Math.atan2(ny, nx);
            burst(x, y, {
                count: Math.round(4 + s * 12),
                color: post ? ['#fde68a', '#fb923c', '#ffffff'] : ['#f1f5f9', '#cbd5e1', '#d6c3a1'],
                speed: 60 + s * 180, life: 0.35, size: 2 + s * 1.4, angle: a, spread: 1.8, gravity: post ? 0 : 140
            });
            if (s > 0.4) addRing(x, y, 3, { color: post ? '#fde68a' : '#ffffff', grow: 12 + s * 14, life: 0.28, width: 2.5, alpha: 0.75 });
            if (!squash || s >= squash.s * (1 - squash.life / 0.16)) squash = { nx: nx, ny: ny, s: s, life: 0 };
        },
        // A ring that expands and fades where the ball met a post. Particles
        // alone read as "something happened"; the ring says where.
        ring: function (x, y, r) {
            addRing(x, y, r);
        },
        spark: function (x, y) {
            burst(x, y, { count: 10, color: ['#fde68a', '#fb923c', '#ffffff'], speed: 150, life: 0.3, size: 2, gravity: 0 });
        },
        // Down one mouth and up the other: a puff where it went in, a ring
        // where it came out, in the tunnel's own colour.
        tunnel: function (x, y, tx, ty, ink) {
            burst(x, y, { count: 10, color: [ink || '#a78bfa', '#ffffff'], speed: 80, life: 0.35, size: 2, gravity: 0 });
            burst(tx, ty, { count: 14, color: [ink || '#a78bfa', '#ffffff'], speed: 140, life: 0.45, size: 2.2, gravity: 0 });
            addRing(tx, ty, C.TUNNEL_R, { life: 0.4 });
        },
        // A best on a hole: gold, and upward.
        stars: function (x, y) {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            burst(x, y, { count: 30, color: ['#fbbf24', '#fde68a', '#ffffff'], speed: 190, life: 1.0, size: 3, lift: 120, gravity: 160 });
        },
        clear: function () { particles.length = 0; rings.length = 0; squash = drown = null; }
    };

    /* What the ball looks like this frame, from the world and the knocks
       above. Spends the squash as it goes. */
    function poseOf(world, dt) {
        var pose = { lift: 0, squash: 0, nx: 1, ny: 0, drown: 0 };
        if (world.air > 0 && world.airMax > 0) {
            // A geyser throws the ball far higher than a skip does.
            pose.lift = Math.sin(Math.PI * (1 - world.air / world.airMax)) * (world.airMax > 0.3 ? 1.7 : 1);
        }
        if (squash) {
            squash.life += dt;
            var left = 1 - squash.life / 0.16;
            if (left <= 0) squash = null;
            else {
                // Flat at once, then back to round: the release is the slow part.
                pose.squash = squash.s * left * left;
                pose.nx = squash.nx;
                pose.ny = squash.ny;
            }
        }
        if (world.splash && drown) {
            drown.life += dt;
            pose.drown = Math.min(1, drown.life / 0.55);
        } else if (!world.splash) {
            drown = null;
        }
        return pose;
    }

    /* ── frame ──────────────────────────────────────────────────────────── */

    var spin = rolled();
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
        var ball = state.world.sunk ? null : state.world.ball;
        var still = !!(motionQuery && motionQuery.matches);
        // The life over a course is the game's, not the editor's: a
        // butterfly crossing a hole you are building is in the way.
        var life = AMB && !!state.sceneKey;
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
        L.drawWater(g, course.water, theme, v, t, clock, scene.decor, { key: state.sceneKey, res: state.res || 1, still: still });
        L.drawLava(g, course.lava, v, still ? 0 : clock);
        // The slides and the geysers keep the world's clock, not the
        // screen's: they are hazards, and where one is is a fact of play.
        L.drawSlides(g, course.avalanches, t, v, still ? 0 : clock);
        L.drawVents(g, course.vents, t, v, still ? 0 : clock);
        // The wind's streaks blow on the screen's clock: they are what a
        // wind looks like, not where it is.
        if (GOLF.props) GOLF.props.air(g, course, still ? 0 : clock);
        drawTunnels(g, course.tunnels, t, v);
        drawHole(g, course.hole, t, state.world.ball, v);
        if (life) AMB.under(g, theme, v, clock, still);
        scene.solids(g);
        for (i = 0; i < course.walls.length; i++) {
            if (course.walls[i].move) L.drawWall(g, course.walls[i], t, theme, v);
        }
        for (i = 0; i < course.bumpers.length; i++) L.drawBumper(g, course.bumpers[i], t, theme, v);
        if (GOLF.props) GOLF.props.machines(g, course, still ? 0 : clock);
        // After dark, the dark: over the course, under the ball.
        if (AMB) AMB.light(g, course, theme, v, ball, scene.decor, { key: state.sceneKey, res: state.res || 1 });

        updateParticles(dt);
        updateRings(g, dt);
        drawParticles(g);

        roll(spin, state.world.ball.vx, state.world.ball.vy, dt);
        var pose = poseOf(state.world, dt || 0);
        if (!state.world.sunk) {
            drawTrail(g, state.trail, state.ballColor);
            drawBall(g, state.world.ball, spin, state.ballColor, v, pose, course.hole);
        }
        if (state.aim && state.aim.active && !state.world.moving && !state.world.sunk) {
            drawAim(g, state.world, state.aim, t, state.lastFrac);
        } else if (state.coach && !state.world.moving && !state.world.sunk) {
            drawCoach(g, state.world.ball, state.aim.angle, clock);
        }

        // Over the ball: the course's edge, the trees reaching over it, what
        // lives in the air, and the weather over everything. A crown the
        // ball is under goes thin, and so does anything flying past it.
        L.drawRim(g, theme, v);
        if (GOLF.props) GOLF.props.over(g, course, v, still ? 0 : clock, ball);
        L.drawCanopies(g, scene.decor.canopies, theme, v, clock, ball);
        if (life) AMB.over(g, theme, v, clock, ball, still, scene.decor);
        L.drawClouds(g, still ? 0 : clock, v, key + 1, theme.clouds);
        g.restore();
    }

    GOLF.render = { frame: frame, effects: effects, roundRect: roundRect, tunnelInk: tunnelInk, roll: roll, rolled: rolled };

})(window.GOLF);
