/* Ambience: the life over a course and the light it is seen by. Snow,
   falling leaves and petals, butterflies, dandelion fluff and dust in the
   air; the shadows of birds and gulls, and a tumbleweed, on the ground; and
   after dark, the night itself, with the lamps lit and fireflies out.

   Three rules, the same ones the rest of the scenery keeps.

   **Nothing here touches play.** It is drawn and nothing else: the physics
   has never heard of a snowflake.

   **Nothing here may hide the ball.** What lives on the ground is drawn
   under the ball. What lives in the air is small, and goes thin round the
   ball the way a tree's crown does, so a flake can drift past it and never
   sit on it.

   **Nothing here keeps state.** Every creature's place is a function of the
   clock and its own number, so there is no list to grow, nothing to reset
   between holes, and a turned phone is the same sky turned. Under reduced
   motion the moving life is not drawn at all — a snowstorm frozen in the
   air is not stillness, it is noise. The lamps and the dark stay. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;
    var L = GOLF.landscape;

    var W = C.WORLD_W, H = C.WORLD_H, TAU = Math.PI * 2;
    var hash = L.hash, sv = L.sv;

    /* ── the screen's own frame ─────────────────────────────────────────

       Snow falls down the glass and wind blows across it, whichever way the
       board is turned. So the moving life is placed in screen terms — a
       field `span` wide and tall as the screen shows it — and turned into
       the world at the last moment. */
    function span(v) { return v.turned ? { w: H, h: W } : { w: W, h: H }; }
    function at(v, sx, sy) { return v.turned ? { x: W - sy, y: sx } : { x: sx, y: sy }; }
    function wrap(a, n) { return a - Math.floor(a / n) * n; }

    // How much of something may show here: none on the ball, all of it a
    // little way off.
    function clear(ball, x, y, r) {
        if (!ball) return 1;
        var d = Math.hypot(ball.x - x, ball.y - y);
        return d <= r ? 0 : d >= r * 3 ? 1 : (d - r) / (r * 2);
    }

    /* A soft round light, drawn once and stamped. A radial gradient per
       firefly per frame was most of what a night cost on a phone. */
    var sprites = {};
    function sprite(name, rgb) {
        if (sprites[name]) return sprites[name];
        var c = document.createElement('canvas');
        c.width = c.height = 64;
        var g = c.getContext('2d');
        var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(' + rgb + ', 1)');
        grad.addColorStop(0.25, 'rgba(' + rgb + ', 0.55)');
        grad.addColorStop(1, 'rgba(' + rgb + ', 0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 64, 64);
        sprites[name] = c;
        return c;
    }

    function stamp(g, img, x, y, r, a) {
        if (a <= 0.01) return;
        g.globalAlpha = a;
        g.drawImage(img, x - r, y - r, r * 2, r * 2);
    }

    /* ── in the air ─────────────────────────────────────────────────── */

    // Snow: bigger flakes are nearer, and fall faster. One path for every
    // flake clear of the ball; the few beside it are drawn one by one.
    function snow(g, n, clock, v, ball) {
        var S = span(v), near = [];
        g.save();
        g.fillStyle = 'rgba(255, 255, 255, 0.85)';
        g.beginPath();
        for (var i = 0; i < n; i++) {
            var size = 0.9 + hash(i * 3.7 + 1) * 1.9;
            var sx = wrap(hash(i * 1.3 + 5) * S.w + clock * 9 + Math.sin(clock * 0.7 + i * 1.9) * 10, S.w + 20) - 10;
            var sy = wrap(hash(i * 2.9 + 2) * S.h + clock * (14 + size * 12), S.h + 20) - 10;
            var p = at(v, sx, sy), a = clear(ball, p.x, p.y, 14);
            if (a <= 0) continue;
            if (a < 1) { near.push(p.x, p.y, size, a); continue; }
            g.moveTo(p.x + size, p.y);
            g.arc(p.x, p.y, size, 0, TAU);
        }
        g.fill();
        for (var k = 0; k < near.length; k += 4) {
            g.globalAlpha = near[k + 3];
            g.beginPath();
            g.arc(near[k], near[k + 1], near[k + 2], 0, TAU);
            g.fill();
        }
        g.restore();
    }

    /* Leaves and petals coming down: blown across the screen, tumbling as
       they go, each with a shadow on the ground a little below it — the
       shadow is what says it is in the air. */
    function falling(g, n, clock, v, ball, pal, petal) {
        var S = span(v), sh = sv(v, 9, 13);
        g.save();
        for (var i = 0; i < n; i++) {
            var len = petal ? 2.6 : 4.2 + hash(i * 5.1) * 1.8;
            var fall = petal ? 9 + hash(i) * 8 : 13 + hash(i * 2.2) * 10;
            var drift = petal ? 13 : 21;
            var sx = wrap(hash(i * 1.7 + 3) * S.w + clock * drift + Math.sin(clock * 0.9 + i * 2.3) * 22, S.w + 40) - 20;
            var sy = wrap(hash(i * 3.1 + 7) * S.h + clock * fall, S.h + 40) - 20;
            var p = at(v, sx, sy), a = clear(ball, p.x, p.y, 16);
            if (a <= 0) continue;
            var spin = clock * (0.8 + hash(i * 9) * 1.4) * (i % 2 ? 1 : -1) + i;
            var flip = Math.max(0.25, Math.abs(Math.cos(clock * (1.6 + hash(i * 4)) + i)));
            g.globalAlpha = a;
            for (var pass = 0; pass < 2; pass++) {
                g.save();
                if (pass === 0) g.translate(p.x + sh.x, p.y + sh.y); else g.translate(p.x, p.y);
                g.rotate(spin);
                g.scale(1, flip);
                g.fillStyle = pass === 0 ? 'rgba(0, 0, 0, 0.14)' : pal[i % pal.length];
                g.beginPath();
                g.ellipse(0, 0, len, len * (petal ? 0.7 : 0.48), 0, 0, TAU);
                g.fill();
                g.restore();
            }
        }
        g.restore();
    }

    // Dandelion fluff, rising slowly on the warm air: a seed and its rays.
    function fluff(g, n, clock, v, ball) {
        var S = span(v);
        g.save();
        g.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        g.fillStyle = 'rgba(255, 255, 250, 0.9)';
        g.lineWidth = 0.7;
        var rays = new Path(), seeds = new Path();
        for (var i = 0; i < n; i++) {
            var sx = wrap(hash(i * 2.1 + 9) * S.w + clock * 11 + Math.sin(clock * 0.6 + i * 1.3) * 18, S.w + 20) - 10;
            var sy = wrap(hash(i * 4.3 + 1) * S.h - clock * 5 + Math.sin(clock * 0.45 + i) * 9, S.h + 20) - 10;
            var p = at(v, sx, sy);
            if (clear(ball, p.x, p.y, 14) < 0.6) continue;
            seeds.dot(p.x, p.y, 1.1);
            for (var k = 0; k < 6; k++) {
                var a = k * TAU / 6 + i;
                rays.line(p.x, p.y, p.x + Math.cos(a) * 3.6, p.y + Math.sin(a) * 3.6);
            }
        }
        rays.stroke(g);
        seeds.fill(g);
        g.restore();
    }

    // Dust in a desert wind: warm motes drifting across.
    function dust(g, n, clock, v, ball) {
        var S = span(v), motes = new Path();
        for (var i = 0; i < n; i++) {
            var sx = wrap(hash(i * 6.1 + 2) * S.w + clock * (24 + hash(i) * 20), S.w + 20) - 10;
            var sy = wrap(hash(i * 1.9 + 8) * S.h + Math.sin(clock * 0.8 + i * 2.7) * 16, S.h);
            var p = at(v, sx, sy);
            if (clear(ball, p.x, p.y, 12) < 0.6) continue;
            motes.dot(p.x, p.y, 0.9 + hash(i * 3) * 0.9);
        }
        g.save();
        g.fillStyle = 'rgba(255, 228, 180, 0.45)';
        motes.fill(g);
        g.restore();
    }

    // Fireflies: each wanders round a home of its own and blinks.
    function fireflies(g, n, clock, ball) {
        var img = sprite('firefly', '214, 255, 140');
        g.save();
        g.globalCompositeOperation = 'lighter';
        for (var i = 0; i < n; i++) {
            var hx = 40 + hash(i * 1.1 + 3) * (W - 80), hy = 40 + hash(i * 2.3 + 7) * (H - 80);
            var x = hx + Math.sin(clock * (0.21 + hash(i * 3) * 0.2) + i) * 46 + Math.sin(clock * 0.9 + i * 2) * 7;
            var y = hy + Math.cos(clock * (0.17 + hash(i * 5) * 0.2) + i * 1.7) * 34 + Math.cos(clock * 1.1 + i) * 6;
            var blink = Math.pow(Math.max(0, Math.sin(clock * (0.9 + hash(i * 7) * 0.8) + i * 2.1)), 3);
            stamp(g, img, x, y, 13, blink * 0.8 * clear(ball, x, y, 12));
        }
        g.restore();
    }

    /* Butterflies: a long, lazy loop over the course with a flutter on top
       of it, wings beating, a shadow under each. */
    var WINGS = ['#fde047', '#ffffff', '#fb923c', '#a5b4fc'];

    function butterflies(g, n, clock, v, ball) {
        var sh = sv(v, 12, 17);
        function path(i, t) {
            var cx = W * (0.25 + hash(i * 4.4) * 0.5), cy = H * (0.25 + hash(i * 6.6) * 0.5);
            return {
                x: cx + Math.sin(t * 0.21 * (1 + i * 0.3) + i * 2) * W * 0.3 + Math.sin(t * 1.3 + i) * 14,
                y: cy + Math.sin(t * 0.29 * (1 + i * 0.2) + i) * H * 0.24 + Math.cos(t * 1.7 + i) * 10
            };
        }
        g.save();
        for (var i = 0; i < n; i++) {
            var p = path(i, clock), q = path(i, clock + 0.05);
            var a = clear(ball, p.x, p.y, 18);
            if (a <= 0) continue;
            var head = Math.atan2(q.y - p.y, q.x - p.x);
            var flap = 0.25 + Math.abs(Math.sin(clock * 15 + i * 3)) * 0.75;
            g.globalAlpha = a;
            for (var pass = 0; pass < 2; pass++) {
                g.save();
                if (pass === 0) g.translate(p.x + sh.x, p.y + sh.y); else g.translate(p.x, p.y);
                g.rotate(head);
                g.fillStyle = pass === 0 ? 'rgba(0, 0, 0, 0.16)' : WINGS[(i + (hash(i * 2) * 4 | 0)) % WINGS.length];
                g.beginPath();
                g.ellipse(-0.5, -3.4 * flap, 2.8, 3.6 * flap, -0.3, 0, TAU);
                g.ellipse(-0.5, 3.4 * flap, 2.8, 3.6 * flap, 0.3, 0, TAU);
                g.fill();
                if (pass === 1) {
                    g.fillStyle = '#3b2f2f';
                    g.fillRect(-3, -0.7, 6, 1.4);
                }
                g.restore();
            }
        }
        g.restore();
    }

    /* ── crossing ────────────────────────────────────────────────────────

       A bird, a gull or a tumbleweed comes by now and then rather than all
       the time: each has a period, and crosses the screen in the first part
       of it. `crossing` says where it is, or null while it is away. */
    function crossing(v, i, clock, kind, period, takes) {
        var S = span(v);
        var phase = wrap(clock + hash(i * 7.7 + kind) * period, period);
        if (phase > takes) return null;
        var u = phase / takes;
        var lane = 0.15 + hash(i * 3.3 + kind + Math.floor((clock + hash(i * 7.7 + kind) * period) / period)) * 0.7;
        var sx = -70 + u * (S.w + 140), sy = lane * S.h + (u - 0.5) * 60;
        var p = at(v, sx, sy);
        return { x: p.x, y: p.y, u: u, dir: { x: v.rx, y: v.ry } };
    }

    // The shadow a bird throws, gliding: a soft V, its wings beating slowly.
    function birdShadows(g, n, clock, v, kind, size) {
        g.save();
        g.strokeStyle = 'rgba(0, 20, 10, 0.18)';
        g.lineCap = 'round';
        g.lineJoin = 'round';
        for (var i = 0; i < n; i++) {
            var c = crossing(v, i, clock, kind, 26 + i * 9, 9);
            if (!c) continue;
            var off = sv(v, 30, 44);
            var beat = 0.6 + Math.sin(clock * 5 + i) * 0.4;
            g.save();
            g.translate(c.x + off.x, c.y + off.y);
            g.rotate(Math.atan2(c.dir.y, c.dir.x));
            g.lineWidth = 3.2 * size;
            g.beginPath();
            g.moveTo(-9 * size, -11 * size * beat);
            g.quadraticCurveTo(-2 * size, -3 * size, 2 * size, 0);
            g.quadraticCurveTo(-2 * size, 3 * size, -9 * size, 11 * size * beat);
            g.stroke();
            g.restore();
        }
        g.restore();
    }

    // A gull itself, high over the course: drawn over everything, so it
    // goes thin when it passes over the ball.
    function gulls(g, n, clock, v, ball) {
        for (var i = 0; i < n; i++) {
            var c = crossing(v, i, clock, 2, 26 + i * 9, 9);
            if (!c) continue;
            var a = clear(ball, c.x, c.y, 22);
            if (a <= 0) continue;
            var beat = Math.sin(clock * 5 + i) * 0.35;
            g.save();
            g.globalAlpha = a;
            g.translate(c.x, c.y);
            g.rotate(Math.atan2(c.dir.y, c.dir.x));
            g.fillStyle = '#f8fafc';
            g.strokeStyle = 'rgba(71, 85, 105, 0.9)';
            g.lineWidth = 1;
            [-1, 1].forEach(function (s) {
                g.beginPath();
                g.moveTo(1, 0);
                g.quadraticCurveTo(-1, s * (7 + beat * 6), -5, s * (14 + beat * 4));
                g.quadraticCurveTo(-2, s * 6, -3, 0);
                g.closePath();
                g.fill();
                g.stroke();
            });
            g.beginPath();
            g.ellipse(0, 0, 6, 2.2, 0, 0, TAU);
            g.fill();
            g.fillStyle = '#f59e0b';
            g.fillRect(5.5, -0.6, 2.2, 1.2);
            g.restore();
        }
    }

    // A tumbleweed bowling across the bottom of the screen, bouncing.
    function tumbleweed(g, n, clock, v) {
        for (var i = 0; i < n; i++) {
            var c = crossing(v, i, clock, 3, 19, 7);
            if (!c) continue;
            var hop = Math.abs(Math.sin(c.u * Math.PI * 6)) * 12;
            var up = sv(v, 0, -hop), sh = sv(v, 4, 5);
            g.save();
            g.fillStyle = 'rgba(0, 0, 0, ' + (0.22 - hop * 0.008).toFixed(3) + ')';
            g.beginPath();
            g.ellipse(c.x + sh.x, c.y + sh.y, 11, 8, 0, 0, TAU);
            g.fill();
            g.translate(c.x + up.x, c.y + up.y);
            g.rotate(c.u * 24);
            g.strokeStyle = 'rgba(150, 108, 58, 0.95)';
            g.lineWidth = 1.2;
            g.beginPath();
            for (var k = 0; k < 9; k++) {
                var a0 = hash(k * 3.1) * TAU, r0 = 5 + hash(k * 5.3) * 6;
                g.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0);
                g.arc(0, 0, r0, a0, a0 + 2 + hash(k) * 2);
            }
            g.stroke();
            g.restore();
        }
    }

    /* ── after dark ───────────────────────────────────────────────────────

       The night is a layer of dark over the course, with the lights cut
       out of it: the lamps along the cushion, the cup, the tee, every post
       (a post is a lamp after dark), the tunnel mouths and the moon on the
       water. It sits over the ground, the walls and the posts and under the
       ball, the aim and everything a shot draws, so the dark can never hide
       the ball or the line it is about to take. Painted once per hole and
       stamped every frame, like the ground. */
    var dark = { key: null, canvas: null };

    function lights(course, theme, dec) {
        var out = [];
        (dec.lamps || []).forEach(function (l) { out.push({ x: l.x, y: l.y, r: 190, k: 0.85 }); });
        out.push({ x: course.hole.x, y: course.hole.y, r: 120, k: 0.9 });
        out.push({ x: course.tee.x, y: course.tee.y, r: 80, k: 0.7 });
        if (theme.bumper === 'lamp') {
            (course.bumpers || []).forEach(function (b) { out.push({ x: b.x, y: b.y, r: b.r + 70, k: 0.85 }); });
        }
        (course.tunnels || []).forEach(function (t) {
            out.push({ x: t.x, y: t.y, r: C.TUNNEL_R + 34, k: 0.5 }, { x: t.tx, y: t.ty, r: C.TUNNEL_R + 34, k: 0.5 });
        });
        if (dec.moon) out.push({ x: dec.moon.x, y: dec.moon.y, r: 70, k: 0.35 });
        return out;
    }

    function paintDark(g, course, theme, v, dec) {
        // The moon is up behind the screen's top left: the far side is darker.
        var d = sv(v, -1, -1), n = Math.hypot(d.x, d.y), ux = d.x / n, uy = d.y / n;
        var ext = Math.abs(ux) * W / 2 + Math.abs(uy) * H / 2;
        var grad = g.createLinearGradient(W / 2 + ux * ext, H / 2 + uy * ext, W / 2 - ux * ext, H / 2 - uy * ext);
        grad.addColorStop(0, theme.night.dark);
        grad.addColorStop(1, theme.night.far);
        g.fillStyle = grad;
        g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = 'destination-out';
        lights(course, theme, dec).forEach(function (l) {
            var rg = g.createRadialGradient(l.x, l.y, l.r * 0.12, l.x, l.y, l.r);
            rg.addColorStop(0, 'rgba(0, 0, 0, ' + l.k + ')');
            rg.addColorStop(1, 'rgba(0, 0, 0, 0)');
            g.fillStyle = rg;
            g.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
        });
        g.globalCompositeOperation = 'source-over';
    }

    /* The light pass, between the course and the ball: the dark after
       nightfall, and the glow of the lamps and of the ball itself — the
       ball carries a little light of its own, so it is never a white dot
       rolling into a black hole. */
    function light(g, course, theme, v, ball, dec, opts) {
        if (!theme.night) return;
        var res = opts && opts.res > 0 ? opts.res : 1;
        var key = opts && opts.key ? [opts.key, theme.name, res.toFixed(2), v.turned ? 1 : 0].join('|') : null;
        if (!key) {
            g.save();
            paintDark(g, course, theme, v, dec);
            g.restore();
        } else {
            if (dark.key !== key) {
                dark.canvas = L.layer(res, function (c) { paintDark(c, course, theme, v, dec); });
                dark.key = key;
            }
            g.drawImage(dark.canvas, 0, 0, W, H);
        }
        var warm = sprite('lamp', '255, 214, 140');
        g.save();
        g.globalCompositeOperation = 'lighter';
        if (theme.bumper === 'lamp') {
            (course.bumpers || []).forEach(function (b) { stamp(g, warm, b.x, b.y, b.r + 22, 0.32); });
        }
        stamp(g, warm, course.hole.x, course.hole.y, 34, 0.22);
        if (ball) stamp(g, sprite('ball', '235, 240, 255'), ball.x, ball.y, 46, 0.22);
        g.restore();
    }

    // The lanterns themselves, on the cushion: over the ball, so they fade
    // when it is against the rim beside one.
    function lamps(g, list, clock, ball) {
        var warm = sprite('lamp', '255, 214, 140');
        for (var i = 0; i < list.length; i++) {
            var l = list[i], a = clear(ball, l.x, l.y, 12);
            if (a <= 0) continue;
            var flicker = 0.85 + Math.sin(clock * 7 + l.p * 3) * 0.05 + Math.sin(clock * 13 + l.p) * 0.04;
            g.save();
            g.globalAlpha = a;
            g.fillStyle = '#2b2116';
            g.beginPath();
            g.arc(l.x, l.y, 6.5, 0, TAU);
            g.fill();
            var grad = g.createRadialGradient(l.x - 1, l.y - 1, 0.5, l.x, l.y, 5);
            grad.addColorStop(0, '#fffbeb');
            grad.addColorStop(1, '#f59e0b');
            g.fillStyle = grad;
            g.beginPath();
            g.arc(l.x, l.y, 4.6, 0, TAU);
            g.fill();
            g.globalCompositeOperation = 'lighter';
            stamp(g, warm, l.x, l.y, 30, 0.5 * flicker * a);
            g.restore();
        }
    }

    /* ── the two passes ─────────────────────────────────────────────── */

    function count(theme, kind) {
        var list = theme.ambient || [];
        for (var i = 0; i < list.length; i++) if (list[i].kind === kind) return list[i].n;
        return 0;
    }

    // On the ground, under the ball: shadows of birds and gulls, tumbleweed.
    function under(g, theme, v, clock, still) {
        if (still) return;
        var n;
        if ((n = count(theme, 'bird'))) birdShadows(g, n, clock, v, 1, 1);
        if ((n = count(theme, 'gull'))) birdShadows(g, n, clock, v, 2, 1.25);
        if ((n = count(theme, 'tumbleweed'))) tumbleweed(g, n, clock, v);
    }

    // In the air, over everything but the clouds.
    function over(g, theme, v, clock, ball, still, dec) {
        if (dec && dec.lamps && dec.lamps.length) lamps(g, dec.lamps, still ? 0 : clock, ball);
        if (still) return;
        var n;
        if ((n = count(theme, 'snow'))) snow(g, n, clock, v, ball);
        if ((n = count(theme, 'leaf'))) falling(g, n, clock, v, ball, theme.leaves, false);
        if ((n = count(theme, 'petal'))) falling(g, n, clock, v, ball, ['#fbcfe8', '#f9a8d4', '#fdf2f8'], true);
        if ((n = count(theme, 'fluff'))) fluff(g, n, clock, v, ball);
        if ((n = count(theme, 'dust'))) dust(g, n, clock, v, ball);
        if ((n = count(theme, 'butterfly'))) butterflies(g, n, clock, v, ball);
        if ((n = count(theme, 'gull'))) gulls(g, n, clock, v, ball);
        if ((n = count(theme, 'firefly'))) fireflies(g, n, clock, ball);
    }

    // Lines and dots gathered into one path each, stroked or filled once.
    function Path() { this.p = []; }
    Path.prototype.line = function (a, b, c, d) { this.p.push(0, a, b, c, d); };
    Path.prototype.dot = function (x, y, r) { this.p.push(1, x, y, r, 0); };
    Path.prototype.trace = function (g) {
        g.beginPath();
        for (var i = 0; i < this.p.length; i += 5) {
            if (this.p[i] === 0) { g.moveTo(this.p[i + 1], this.p[i + 2]); g.lineTo(this.p[i + 3], this.p[i + 4]); }
            else { g.moveTo(this.p[i + 1] + this.p[i + 3], this.p[i + 2]); g.arc(this.p[i + 1], this.p[i + 2], this.p[i + 3], 0, TAU); }
        }
    };
    Path.prototype.stroke = function (g) { this.trace(g); g.stroke(); };
    Path.prototype.fill = function (g) { this.trace(g); g.fill(); };

    GOLF.ambience = {
        under: under,
        light: light,
        over: over,
        lights: lights,
        clear: clear
    };

})(window.GOLF);
