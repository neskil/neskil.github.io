/* Props: the shapes that are not boxes, and the things standing on the
   course that say what a hazard does.

   Three kinds of ground and two kinds of wall arrived together, and this
   file draws all of them so landscape.js does not have to grow by half:

     curves   a wall bent round an arc, drawn as one band in the biome's own
              material rather than as the chain of rails it is collided as.
     blocks   a solid shape with something in it: a flower bed edged in the
              biome's brick or timber, a hedge, a rock, a windmill or a fan.
              The ball only ever meets the edge — which is drawn as a kerb —
              so whatever grows or stands inside can be as busy as it likes
              without ever hiding the ball.
     hills    round mounds and bowls, shaded pixel by pixel from the same
              light the walls are lit by, so a hill reads as a hill before
              anyone has read a lesson about it.
     wind     a slope that is air rather than ground: a pale lane with
              streaks blowing down it, and — because a force with no cause
              reads as the game cheating — a fan at its head to blow them.
     gates    a moving wall slides in a track, so the track is drawn in the
              ground under its whole travel: a gate is shown to move before
              it is ever seen moving.

   What does not move is painted into landscape.js's cached layers (the
   ground and the still walls); what does — the streaks, a fan's rotor, a
   windmill's sails — is drawn live, off the screen's clock, and stands
   still under prefers-reduced-motion. The sails are the one thing here
   drawn over the ball, and like a tree's crown they go thin when the ball
   rolls under them. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;
    var P = GOLF.physics;
    var DEG = Math.PI / 180;
    var TAU = Math.PI * 2;
    var EXT = 7;   // a wall's near face, as landscape.js draws it

    function sv(v, a, b) { return { x: v.rx * a + v.dx * b, y: v.ry * a + v.dy * b }; }

    function hash(n) {
        var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    function material(kind) {
        var M = GOLF.landscape.MATERIAL;
        return M[kind] || M.timber;
    }

    /* ── outlines ───────────────────────────────────────────────────────── */

    function trace(g, pts, ox, oy) {
        g.beginPath();
        for (var i = 0; i < pts.length; i += 2) g.lineTo(pts[i] + ox, pts[i + 1] + oy);
        g.closePath();
    }

    function boxOf(pts) {
        var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
        for (var i = 0; i < pts.length; i += 2) {
            b.x0 = Math.min(b.x0, pts[i]); b.x1 = Math.max(b.x1, pts[i]);
            b.y0 = Math.min(b.y0, pts[i + 1]); b.y1 = Math.max(b.y1, pts[i + 1]);
        }
        return b;
    }

    // How far a point is from the nearest edge of an outline.
    function edgeDist(pts, x, y) {
        var best = Infinity;
        for (var i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
            var ax = pts[j], ay = pts[j + 1], ex = pts[i] - ax, ey = pts[i + 1] - ay;
            var L2 = ex * ex + ey * ey, t = L2 ? ((x - ax) * ex + (y - ay) * ey) / L2 : 0;
            t = t < 0 ? 0 : t > 1 ? 1 : t;
            best = Math.min(best, Math.hypot(x - ax - ex * t, y - ay - ey * t));
        }
        return best;
    }

    /* The roomiest point inside an outline and how much room it has: where
       a windmill stands or a fan turns, which on a lopsided bed is not its
       centroid. A coarse grid and then a finer one round the best of it. */
    function pole(pts) {
        var b = boxOf(pts), best = { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, r: 0 };
        var step = Math.max(b.x1 - b.x0, b.y1 - b.y0) / 16;
        for (var pass = 0; pass < 2; pass++) {
            var cx = best.x, cy = best.y, span = pass ? step : Math.max(b.x1 - b.x0, b.y1 - b.y0) / 2;
            var s = pass ? step / 6 : step;
            for (var x = cx - span; x <= cx + span; x += s) {
                for (var y = cy - span; y <= cy + span; y += s) {
                    if (!P.pointInPoly(x, y, pts)) continue;
                    var d = edgeDist(pts, x, y);
                    if (d > best.r) best = { x: x, y: y, r: d };
                }
            }
        }
        return best;
    }

    /* ── what grows in a bed ────────────────────────────────────────────

       A bed is edged in the biome's own wall — brick in the garden, timber
       in the park, driftwood by the sea — and planted with what grows
       there. A big one gets a tree in the middle. */
    var BEDS = {
        parkland: { kerb: 'timber', soil: '#4a3a26', plants: ['shrub', 'shrub', 'flowers'], flowers: ['#fef3c7', '#ffffff', '#fde047'] },
        garden:   { kerb: 'brick', soil: '#5b4030', plants: ['flowers', 'flowers', 'topiary'], flowers: ['#f472b6', '#fb7185', '#fde047', '#c084fc', '#ffffff'] },
        seaside:  { kerb: 'driftwood', soil: '#d9c08a', plants: ['marram', 'marram', 'pebble', 'shell'], flowers: ['#fbcfe8'] },
        woodland: { kerb: 'log', soil: '#3b2b1c', plants: ['fern', 'fern', 'mushroom', 'stump'], flowers: ['#fde68a'] },
        meadow:   { kerb: 'timber', soil: '#4d5a2a', plants: ['tuft', 'flowers', 'flowers'], flowers: ['#fde047', '#ffffff', '#93c5fd', '#f9a8d4'] },
        autumn:   { kerb: 'stone', soil: '#4a3222', plants: ['shrub', 'pumpkin', 'leaves'], flowers: ['#f59e0b', '#b45309'] },
        winter:   { kerb: 'snowlog', soil: '#e8eef3', plants: ['snowpine', 'drift'], flowers: ['#ffffff'] },
        alpine:   { kerb: 'granite', soil: '#dfe7ee', plants: ['snowpine', 'boulder', 'drift'], flowers: ['#ffffff'] },
        desert:   { kerb: 'sandstone', soil: '#d8b27a', plants: ['cactus', 'pebble', 'agave'], flowers: ['#f472b6'] },
        volcanic: { kerb: 'basalt', soil: '#2a2422', plants: ['ember', 'boulder', 'stump'], flowers: ['#fb923c'] },
        night:    { kerb: 'stone', soil: '#2c3328', plants: ['shrub', 'flowers'], flowers: ['#e0e7ff', '#c7d2fe'] },
        // A planter on the desk; a hydroponics tray on the ship.
        study:    { kerb: 'book', soil: '#3b2a1c', plants: ['shrub', 'flowers'], flowers: ['#fef3c7', '#fda4af'] },
        space:    { kerb: 'hull', soil: '#10131c', plants: ['boulder', 'pebble'], flowers: ['#a5f3fc'] }
    };
    var SHRUB = {
        parkland: ['#1f5a2a', '#3f8a46'], garden: ['#22602e', '#4f9a4f'], meadow: ['#3a6a26', '#6a9a3a'],
        autumn: ['#8f2f14', '#e98a2e'], night: ['#12302a', '#21453b'], woodland: ['#1d4a2b', '#2f6a3a'],
        study: ['#21592a', '#47a052']
    };
    // A rock in the biome it lies in.
    /* What a rock is made of where it stands: the stone's colour lit and
       in shade, the dark in the cracks between boulders, and what grows or
       lies on it — snow, moss, lichen, the strata of sandstone, craters, or
       the volcano's glow coming up through the gaps. */
    var ROCK = {
        space: { kind: 'granite', top: '#868b99', side: '#3a3d48', gap: '#1d1f27', on: 'crater' },
        alpine: { kind: 'granite', top: '#a1aab2', side: '#4f565d', gap: '#2c3136', snow: true, on: 'snow' },
        winter: { kind: 'granite', top: '#adb6be', side: '#59626b', gap: '#353b42', snow: true, on: 'snow' },
        volcanic: { kind: 'basalt', top: '#4a4546', side: '#1b1819', gap: '#2a0c04', glow: true, on: 'ember' },
        desert: { kind: 'sandstone', top: '#d08f58', side: '#7a4526', gap: '#4d2a16', on: 'strata' },
        seaside: { kind: 'stone', top: '#a6a195', side: '#55514a', gap: '#2f2c27', on: 'lichen' },
        study: { kind: 'stone', top: '#9b968c', side: '#4d4a44', gap: '#2a2824', on: 'none' },
        _: { kind: 'stone', top: '#999b93', side: '#4a4b46', gap: '#282a25', on: 'moss' }
    };

    // Two hex colours mixed, `t` of the way from a to b.
    function mixHex(a, b, t) {
        var A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
        var r = Math.round(((A >> 16) & 255) + ((((B >> 16) & 255) - ((A >> 16) & 255)) * t));
        var gg = Math.round(((A >> 8) & 255) + ((((B >> 8) & 255) - ((A >> 8) & 255)) * t));
        var bl = Math.round((A & 255) + (((B & 255) - (A & 255)) * t));
        return 'rgb(' + r + ', ' + gg + ', ' + bl + ')';
    }

    function bedOf(theme) { return BEDS[theme.id] || BEDS.parkland; }

    function shadowDot(g, x, y, r, v) {
        var s = sv(v, r * 0.35, r * 0.5);
        g.fillStyle = 'rgba(0, 0, 0, 0.28)';
        g.beginPath();
        g.ellipse(x + s.x, y + s.y, r, r * 0.9, 0, 0, Math.PI * 2);
        g.fill();
    }

    function ball3d(g, x, y, r, dark, light, v) {
        var l = sv(v, -r * 0.35, -r * 0.35);
        var grad = g.createRadialGradient(x + l.x, y + l.y, r * 0.1, x, y, r);
        grad.addColorStop(0, light);
        grad.addColorStop(1, dark);
        g.fillStyle = grad;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
    }

    function plant(g, kind, x, y, r, theme, v, seed) {
        var bed = bedOf(theme), i, a;
        var up = sv(v, 0, -1);
        switch (kind) {
        case 'shrub':
        case 'topiary':
            var sh = SHRUB[theme.id] || SHRUB.parkland;
            shadowDot(g, x, y, r, v);
            if (kind === 'topiary') {
                ball3d(g, x, y, r, sh[0], sh[1], v);
            } else {
                for (i = 0; i < 4; i++) {
                    a = seed * 3 + i * 1.7;
                    ball3d(g, x + Math.cos(a) * r * 0.35, y + Math.sin(a) * r * 0.35, r * 0.68, sh[0], sh[1], v);
                }
            }
            break;
        case 'flowers':
            g.fillStyle = 'rgba(30, 80, 30, 0.85)';
            g.beginPath();
            g.arc(x, y, r * 0.8, 0, Math.PI * 2);
            g.fill();
            for (i = 0; i < 7; i++) {
                a = seed * 5 + i * 0.9;
                var d = r * (0.2 + hash(seed + i) * 0.6);
                g.fillStyle = bed.flowers[(i + (seed * 7 | 0)) % bed.flowers.length];
                g.beginPath();
                g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.6 + hash(seed * 3 + i) * 1.4, 0, Math.PI * 2);
                g.fill();
            }
            break;
        case 'marram':
        case 'tuft':
            g.strokeStyle = kind === 'marram' ? 'rgba(190, 200, 120, 0.95)' : 'rgba(110, 160, 60, 0.95)';
            g.lineWidth = 1.3;
            g.lineCap = 'round';
            g.beginPath();
            for (i = 0; i < 7; i++) {
                var lean = (i - 3) * 0.32 + (hash(seed + i) - 0.5) * 0.3;
                g.moveTo(x, y);
                g.quadraticCurveTo(x + up.x * r * 0.6 + up.y * lean * r * 0.3, y + up.y * r * 0.6 - up.x * lean * r * 0.3,
                                   x + up.x * r + up.y * lean * r, y + up.y * r - up.x * lean * r);
            }
            g.stroke();
            break;
        case 'pebble':
        case 'boulder':
            var rk = ROCK[theme.id] || ROCK._;
            shadowDot(g, x, y, r * 0.9, v);
            g.fillStyle = rk.top;
            g.beginPath();
            for (i = 0; i < 7; i++) {
                a = i / 7 * Math.PI * 2;
                var rr = r * (0.75 + hash(seed + i * 1.3) * 0.3);
                g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.85);
            }
            g.closePath();
            g.fill();
            var hl = sv(v, -r * 0.3, -r * 0.3);
            g.fillStyle = 'rgba(255, 255, 255, 0.22)';
            g.beginPath();
            g.ellipse(x + hl.x, y + hl.y, r * 0.45, r * 0.3, 0, 0, Math.PI * 2);
            g.fill();
            if (rk.snow) {
                g.fillStyle = 'rgba(245, 250, 255, 0.9)';
                g.beginPath();
                g.ellipse(x + hl.x * 0.6, y + hl.y * 0.6, r * 0.55, r * 0.32, 0, 0, Math.PI * 2);
                g.fill();
            }
            break;
        case 'shell':
            g.fillStyle = hash(seed) < 0.5 ? '#fde2e4' : '#fff7ed';
            g.beginPath();
            g.moveTo(x, y + r * 0.5);
            g.arc(x, y, r * 0.6, Math.PI * 0.85, Math.PI * 2.15);
            g.closePath();
            g.fill();
            g.strokeStyle = 'rgba(160, 110, 90, 0.5)';
            g.lineWidth = 0.8;
            g.beginPath();
            for (i = -2; i <= 2; i++) { g.moveTo(x, y + r * 0.45); g.lineTo(x + i * r * 0.22, y - r * 0.45); }
            g.stroke();
            break;
        case 'fern':
            g.strokeStyle = '#3f7d34';
            g.lineWidth = 1.4;
            g.lineCap = 'round';
            for (i = 0; i < 6; i++) {
                a = seed + i * Math.PI / 3;
                var ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r;
                g.beginPath();
                g.moveTo(x, y);
                g.lineTo(ex, ey);
                for (var k = 1; k < 4; k++) {
                    var px = x + Math.cos(a) * r * k / 4, py = y + Math.sin(a) * r * k / 4, l = r * 0.28 * (1 - k / 5);
                    g.moveTo(px, py); g.lineTo(px + Math.cos(a + 1.1) * l, py + Math.sin(a + 1.1) * l);
                    g.moveTo(px, py); g.lineTo(px + Math.cos(a - 1.1) * l, py + Math.sin(a - 1.1) * l);
                }
                g.stroke();
            }
            break;
        case 'mushroom':
            shadowDot(g, x, y, r * 0.7, v);
            ball3d(g, x, y, r * 0.7, '#9f1d1d', '#f87171', v);
            g.fillStyle = '#fff7ed';
            for (i = 0; i < 4; i++) {
                a = seed + i * 1.6;
                g.beginPath();
                g.arc(x + Math.cos(a) * r * 0.35, y + Math.sin(a) * r * 0.35, r * 0.12, 0, Math.PI * 2);
                g.fill();
            }
            break;
        case 'stump':
            shadowDot(g, x, y, r * 0.75, v);
            g.fillStyle = theme.id === 'volcanic' ? '#1c1916' : '#6b4423';
            g.beginPath();
            g.arc(x, y, r * 0.75, 0, Math.PI * 2);
            g.fill();
            g.strokeStyle = theme.id === 'volcanic' ? 'rgba(255, 120, 40, 0.45)' : 'rgba(210, 170, 120, 0.7)';
            g.lineWidth = 1;
            for (i = 1; i < 4; i++) {
                g.beginPath();
                g.arc(x, y, r * 0.75 * i / 4, 0, Math.PI * 2);
                g.stroke();
            }
            break;
        case 'pumpkin':
            shadowDot(g, x, y, r * 0.8, v);
            g.fillStyle = '#ea7a1c';
            g.beginPath();
            g.ellipse(x, y, r * 0.85, r * 0.7, 0, 0, Math.PI * 2);
            g.fill();
            g.strokeStyle = 'rgba(140, 60, 10, 0.6)';
            g.lineWidth = 1;
            for (i = -1; i <= 1; i++) {
                g.beginPath();
                g.ellipse(x + i * r * 0.3, y, r * 0.25, r * 0.66, 0, 0, Math.PI * 2);
                g.stroke();
            }
            g.fillStyle = '#4d7c0f';
            g.fillRect(x - 1.5, y - r * 0.8, 3, r * 0.3);
            break;
        case 'leaves':
            for (i = 0; i < 9; i++) {
                a = seed * 2 + i * 0.7;
                g.fillStyle = ['#b8471f', '#e98a2e', '#d9a03a'][i % 3];
                g.beginPath();
                g.ellipse(x + Math.cos(a) * r * hash(seed + i), y + Math.sin(a) * r * hash(seed + i), 2.6, 1.5, a, 0, Math.PI * 2);
                g.fill();
            }
            break;
        case 'snowpine':
            shadowDot(g, x, y, r, v);
            g.save();
            g.translate(x, y);
            GOLF.landscape.pine(g, r, GOLF.landscape.CANOPY.snowpine, seed, true);
            g.restore();
            break;
        case 'drift':
            g.fillStyle = 'rgba(150, 180, 215, 0.35)';
            var ds = sv(v, 2, 3);
            g.beginPath();
            g.ellipse(x + ds.x, y + ds.y, r, r * 0.6, 0, 0, Math.PI * 2);
            g.fill();
            g.fillStyle = '#f8fbff';
            g.beginPath();
            g.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2);
            g.fill();
            break;
        case 'cactus':
            shadowDot(g, x, y, r * 0.7, v);
            ball3d(g, x, y, r * 0.7, '#2f6b2a', '#6fbf5a', v);
            g.strokeStyle = 'rgba(20, 60, 20, 0.6)';
            g.lineWidth = 0.9;
            g.beginPath();
            for (i = 0; i < 8; i++) {
                a = i * Math.PI / 4;
                g.moveTo(x, y);
                g.lineTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7);
            }
            g.stroke();
            if (hash(seed) < 0.4) {
                g.fillStyle = '#f472b6';
                g.beginPath();
                g.arc(x, y, r * 0.18, 0, Math.PI * 2);
                g.fill();
            }
            break;
        case 'agave':
            g.fillStyle = '#7f9f6a';
            for (i = 0; i < 7; i++) {
                a = seed + i * Math.PI * 2 / 7;
                g.beginPath();
                g.moveTo(x + Math.cos(a + 0.35) * r * 0.2, y + Math.sin(a + 0.35) * r * 0.2);
                g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
                g.lineTo(x + Math.cos(a - 0.35) * r * 0.2, y + Math.sin(a - 0.35) * r * 0.2);
                g.closePath();
                g.fill();
            }
            break;
        case 'ember':
            plant(g, 'boulder', x, y, r, theme, v, seed);
            g.fillStyle = 'rgba(255, 140, 40, 0.85)';
            for (i = 0; i < 4; i++) {
                g.beginPath();
                g.arc(x + (hash(seed + i) - 0.5) * r, y + (hash(seed + i * 2) - 0.5) * r, 1.3, 0, Math.PI * 2);
                g.fill();
            }
            break;
        }
    }

    /* ── kerbs ──────────────────────────────────────────────────────────

       The edge of a block is a band w wide along every edge of its
       outline, which is exactly what the physics collides; canvas draws it
       as a stroke with round joins. Its texture is drawn the same way:
       thin strokes inside the band are grain running along it, and a
       dashed stroke as wide as the band is a row of joints across it. */
    function kerbTexture(g, pts, w, kind, m, seed) {
        g.save();
        g.lineJoin = 'round';
        trace(g, pts, 0, 0);
        function along(width, color, lw) {
            g.lineWidth = width + lw;
            g.strokeStyle = color;
            g.stroke();
            g.lineWidth = width - lw;
            g.strokeStyle = m.top;
            g.stroke();
        }
        function joints(dash, gap, color, offset) {
            g.setLineDash([dash, gap]);
            g.lineDashOffset = offset || 0;
            g.lineWidth = w - 2;
            g.strokeStyle = color;
            g.stroke();
            g.setLineDash([]);
        }
        if (kind === 'brick') {
            joints(1.4, 10, m.grain);
            along(w * 0.04 + 1.4, m.grain, 1.4);
        } else if (kind === 'stone' || kind === 'granite') {
            joints(1.6, 11 + hash(seed) * 5, m.grain);
            if (kind === 'granite') {
                g.setLineDash([6, 9]);
                g.lineWidth = w * 0.5;
                g.strokeStyle = 'rgba(245, 250, 255, 0.55)';
                g.stroke();
                g.setLineDash([]);
            }
        } else if (kind === 'basalt') {
            joints(1.5, 9, 'rgba(0, 0, 0, 0.45)');
            along(w * 0.2, m.grain, 1.2);
        } else if (kind === 'hedge') {
            g.setLineDash([2.4, 4.5]);
            g.lineWidth = w * 0.7;
            g.strokeStyle = 'rgba(80, 150, 70, 0.6)';
            g.stroke();
            g.lineDashOffset = 3;
            g.lineWidth = w * 0.35;
            g.strokeStyle = 'rgba(15, 55, 20, 0.5)';
            g.stroke();
            g.setLineDash([]);
        } else {
            // Timber, driftwood, logs, sandstone: grain along the band.
            along(w * 0.5, m.grain, 1);
            along(w * 0.2, m.grain, 0.8);
            if (kind === 'timber' || kind === 'driftwood') joints(1.2, 46, m.grain, seed % 40);
        }
        g.restore();
    }

    // The solid, before anything stands on it: shadow, a near face rising
    // `rise` towards the viewer, a lit kerb and the inside filled with `fill`.
    function solid(g, pts, w, m, v, rise, fill) {
        var s1 = sv(v, 5, 8), s2 = sv(v, 9, 13);
        g.save();
        g.lineJoin = 'round';
        trace(g, pts, s2.x, s2.y);
        g.fillStyle = g.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        g.lineWidth = w + 4;
        g.fill(); g.stroke();
        trace(g, pts, s1.x, s1.y);
        g.fillStyle = g.strokeStyle = 'rgba(0, 0, 0, 0.24)';
        g.lineWidth = w;
        g.fill(); g.stroke();
        g.fillStyle = g.strokeStyle = m.side;
        for (var k = rise; k > 0; k -= 2) {
            trace(g, pts, v.dx * k, v.dy * k);
            g.fill(); g.stroke();
        }
        // Lit on the edge towards the light, shaded on the far one.
        var l = sv(v, -1.3, -1.3);
        trace(g, pts, l.x, l.y);
        g.strokeStyle = m.hi;
        g.stroke();
        trace(g, pts, -l.x, -l.y);
        g.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        g.stroke();
        trace(g, pts, 0, 0);
        g.fillStyle = fill;
        g.fill();
        g.lineWidth = w - 2.6;
        g.strokeStyle = m.top;
        g.stroke();
        g.restore();
    }

    // A soft shadow just inside the kerb, so a bed sits below its edging.
    function hollow(g, pts, w, alpha) {
        g.save();
        trace(g, pts, 0, 0);
        g.clip();
        g.lineJoin = 'round';
        g.lineWidth = w + 9;
        g.strokeStyle = 'rgba(0, 0, 0, ' + alpha + ')';
        g.stroke();
        g.restore();
    }

    /* Spots inside an outline with room for something `r` across, seeded,
       no closer together than `apart`. With `band`, only within that much
       of the kerb: the border planting of a bed too big to fill. */
    function spots(pts, w, r, n, seed, apart, band) {
        var b = boxOf(pts), out = [];
        apart = apart || r * 1.5;
        for (var t = 0; t < n * 14 && out.length < n; t++) {
            var x = b.x0 + hash(seed + t * 1.31) * (b.x1 - b.x0), y = b.y0 + hash(seed + t * 2.17 + 5) * (b.y1 - b.y0);
            if (!P.pointInPoly(x, y, pts)) continue;
            var e = edgeDist(pts, x, y);
            if (e < w / 2 + r || (band && e > w / 2 + r + band)) continue;
            var ok = true;
            for (var i = 0; i < out.length && ok; i++) if (Math.hypot(out[i].x - x, out[i].y - y) < apart) ok = false;
            if (ok) out.push({ x: x, y: y });
        }
        return out;
    }

    function tree(g, x, y, r, theme, v, seed, kind) {
        kind = kind || theme.canopy;
        var pal = GOLF.landscape.CANOPY[kind] || GOLF.landscape.CANOPY.oak;
        var ts = sv(v, r * 0.25, r * 0.35);
        g.fillStyle = 'rgba(0, 20, 0, 0.25)';
        g.beginPath();
        g.arc(x + ts.x, y + ts.y, r * 0.9, 0, Math.PI * 2);
        g.fill();
        g.save();
        g.translate(x, y);
        if (kind === 'pine' || kind === 'snowpine' || kind === 'charred') {
            GOLF.landscape.pine(g, r, pal, seed, kind === 'snowpine');
        } else if (kind === 'palm') {
            GOLF.landscape.palm(g, r, pal, seed);
        } else {
            GOLF.landscape.crown(g, r, pal, seed, kind, v);
        }
        g.restore();
    }

    /* ── blocks ─────────────────────────────────────────────────────────── */

    function blockSeed(b) { return b.pts[0] * 1.7 + b.pts[1] * 3.1 + b.pts.length; }

    function drawBlock(g, b, theme, v, course) {
        var w = b.w || 20, pts = b.pts, seed = blockSeed(b), bed = bedOf(theme);
        var look = b.look || 'bed', m, i;
        if (look === 'hedge') {
            m = material('hedge');
            solid(g, pts, w, m, v, 12, m.top);
            g.save();
            trace(g, pts, 0, 0);
            g.clip();
            var bb = boxOf(pts);
            for (i = 0; i < (bb.x1 - bb.x0) * (bb.y1 - bb.y0) / 30; i++) {
                g.fillStyle = hash(seed + i) < 0.5 ? 'rgba(80, 150, 70, 0.55)' : 'rgba(15, 55, 20, 0.45)';
                g.beginPath();
                g.arc(bb.x0 + hash(seed + i * 1.7) * (bb.x1 - bb.x0), bb.y0 + hash(seed + i * 2.9) * (bb.y1 - bb.y0), 2.6, 0, Math.PI * 2);
                g.fill();
            }
            g.restore();
            kerbTexture(g, pts, w, 'hedge', m, seed);
            return;
        }
        if (look === 'rock') {
            outcrop(g, pts, w, theme, v, seed);
            return;
        }
        /* The funfair's: a big top, a carousel and a big wheel, each on a
           painted platform. The carousel's canopy and the wheel turn, so
           those are drawn live (see machines and over); this is what holds
           still under them. */
        if (look === 'tent' || look === 'carousel' || look === 'wheel') {
            m = { top: '#5b2a6e', side: '#2a1033', hi: 'rgba(255, 220, 255, 0.45)', grain: 'rgba(255, 210, 120, 0.4)' };
            solid(g, pts, w, m, v, 8, '#3a2147');
            // Bulbs round the platform's edge.
            g.save();
            trace(g, pts, 0, 0);
            g.setLineDash([2.4, 9]);
            g.lineCap = 'round';
            g.lineWidth = 3;
            g.strokeStyle = '#fde68a';
            g.stroke();
            g.restore();
            if (look === 'tent') bigTop(g, pole(pts), v, seed);
            if (look === 'wheel') wheelStand(g, pole(pts), v);
            return;
        }
        /* A mirror: a polished panel in a dark frame, with the fair's
           lights caught in it as streaks of colour and a sheen across. */
        if (look === 'mirror') {
            m = { top: '#3b4250', side: '#1c2129', hi: 'rgba(255, 255, 255, 0.5)', grain: 'rgba(0, 0, 0, 0.3)' };
            solid(g, pts, w, m, v, 8, '#b8c4d4');
            g.save();
            trace(g, pts, 0, 0);
            g.clip();
            var mb = boxOf(pts), span = Math.max(mb.x1 - mb.x0, mb.y1 - mb.y0);
            var mg = g.createLinearGradient(mb.x0, mb.y0, mb.x1, mb.y1);
            mg.addColorStop(0, '#e2e8f0');
            mg.addColorStop(0.45, '#94a3b8');
            mg.addColorStop(0.55, '#cbd5e1');
            mg.addColorStop(1, '#64748b');
            g.fillStyle = mg;
            g.fillRect(mb.x0, mb.y0, mb.x1 - mb.x0, mb.y1 - mb.y0);
            ['rgba(244, 63, 94, 0.35)', 'rgba(34, 211, 238, 0.35)', 'rgba(250, 204, 21, 0.35)'].forEach(function (c, k) {
                g.strokeStyle = c;
                g.lineWidth = 3;
                g.beginPath();
                var off = (hash(seed + k) - 0.5) * span;
                g.moveTo(mb.x0 + off, mb.y1);
                g.lineTo(mb.x0 + off + span, mb.y1 - span);
                g.stroke();
            });
            g.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            g.lineWidth = 2;
            g.beginPath();
            g.moveTo(mb.x0, mb.y0 + span * 0.3);
            g.lineTo(mb.x0 + span * 0.3, mb.y0);
            g.stroke();
            g.restore();
            return;
        }
        /* A hut: a small timber shack with its roof to the viewer — in the
           snow a fishing hut with a white roof and a stovepipe, elsewhere a
           beach hut or a shed — on a plank deck. */
        if (look === 'hut') {
            m = material(theme.id === 'winter' || theme.id === 'alpine' ? 'snowlog' : 'timber');
            solid(g, pts, w, m, v, EXT, '#8b6b4a');
            shack(g, pole(pts), v, theme, seed);
            return;
        }
        /* A pyramid seen from above: four faces running up to an apex,
           each as light as it faces the light, and the courses of stone
           showing as steps. */
        if (look === 'pyramid') {
            m = { top: '#d9a066', side: '#8a5a2b', hi: 'rgba(255, 236, 200, 0.5)', grain: 'rgba(120, 70, 30, 0.35)' };
            solid(g, pts, w, m, v, 10, '#d9a066');
            pyramid(g, pts, v);
            return;
        }
        if (look === 'snowman') {
            snowman(g, pole(pts), w, v, seed);
            return;
        }
        // The desk's things, long and round, and a planet.
        if (look === 'book' || look === 'pencil' || look === 'tonearm') {
            deskProp(g, pts, w, v, look, seed);
            return;
        }
        if (look === 'mug' || look === 'inkpot' || look === 'planet') {
            roundProp(g, pole(pts), w, v, look, seed);
            return;
        }
        if (look === 'lighthouse') {
            lighthouse(g, pole(pts), w, v);
            return;
        }
        // The fun ones: an igloo in a snowbank, a parasol on the sand, a
        // scarecrow in a vegetable patch, a rocket on its pad.
        if (look === 'igloo' || look === 'parasol' || look === 'scarecrow' || look === 'rocket') {
            funProp(g, pts, w, v, look, seed);
            return;
        }
        if (look === 'castle') {
            m = { top: '#e6cf98', side: '#b8975a', hi: 'rgba(255, 250, 230, 0.55)', grain: 'rgba(150, 110, 60, 0.3)' };
            solid(g, pts, w, m, v, 9, '#dcc48c');
            sandcastle(g, pole(pts), v, seed);
            return;
        }
        if (look === 'fan') {
            m = { top: '#8a96a3', side: '#3f4851', hi: 'rgba(255, 255, 255, 0.45)', grain: 'rgba(20, 25, 30, 0.45)' };
            solid(g, pts, w, m, v, 9, '#1f2731');
            // Rivets round the housing.
            g.save();
            trace(g, pts, 0, 0);
            g.setLineDash([2, 13]);
            g.lineWidth = 2.6;
            g.strokeStyle = 'rgba(230, 236, 242, 0.75)';
            g.stroke();
            g.restore();
            var fp = pole(pts);
            g.fillStyle = '#0c1117';
            g.beginPath();
            g.arc(fp.x, fp.y, fanRadius(fp), 0, Math.PI * 2);
            g.fill();
            return;
        }
        // A bed — and the paving a windmill stands on.
        var kerb = look === 'windmill' ? (theme.id === 'garden' ? 'brick' : 'stone') : bed.kerb;
        m = material(kerb);
        solid(g, pts, w, m, v, EXT, look === 'windmill' ? '#b9b3a6' : bed.soil);
        hollow(g, pts, w, look === 'windmill' ? 0.18 : 0.32);
        kerbTexture(g, pts, w, kerb, m, seed);
        if (look === 'windmill') {
            paving(g, pts, seed);
            tower(g, pole(pts), v);
            return;
        }
        g.save();
        trace(g, pts, 0, 0);
        g.clip();
        /* A small bed is planted all over. A big one is a copse: trees
           through the middle, and the flowers and shrubs along its edge
           where they can be seen — a bed of three hundred shrubs is a
           carpet, not a garden. */
        var room = pole(pts), area = Math.abs(polyArea(pts));
        // A palm is a palm in any biome: an oasis is not an oasis without one.
        var big = look === 'tree' || look === 'palm' || room.r > 48;
        var trees = big ? spots(pts, w, 30, Math.max(1, Math.round(area / 9000)), seed + 1, 62) : [];
        if (big && !trees.length) trees = [{ x: room.x, y: room.y }];
        var plants = spots(pts, w, 9, Math.round(area / 520), seed, 13.5, big ? 26 : 0);
        plants.forEach(function (p, n) {
            for (var q = 0; q < trees.length; q++) if (Math.hypot(p.x - trees[q].x, p.y - trees[q].y) < 30) return;
            plant(g, bed.plants[(hash(seed + n * 3.7) * bed.plants.length) | 0], p.x, p.y, 6 + hash(seed + n) * 4, theme, v, seed + n);
        });
        trees.forEach(function (p, n) {
            var tr = Math.min(Math.max(20, edgeDist(pts, p.x, p.y) - w / 2 - 2), 30 + hash(seed + n * 1.9) * 16);
            tree(g, p.x, p.y, look === 'palm' ? Math.max(tr, Math.min(room.r + 8, 46)) : tr, theme, v, seed + n * 2.3,
                look === 'palm' ? 'palm' : null);
        });
        g.restore();
    }

    /* ── rocks ──────────────────────────────────────────────────────────

       A rock is an outcrop of boulders rather than a slab: rounded stones
       packed into the outline and out to the kerb the ball meets, each lit
       on the side towards the light with a crack of shade where it sits on
       its neighbour, the nearer ones over the further. Small ones are a
       single stone. What lies on them is the place's: see ROCK. */

    // An outline pushed out by d, each corner along the bisector of its edges.
    function grown(pts, d) {
        var n = pts.length / 2, out = [], sgn = polyArea(pts) > 0 ? 1 : -1;
        for (var i = 0; i < n; i++) {
            var a = (i - 1 + n) % n, c = (i + 1) % n;
            var x = pts[i * 2], y = pts[i * 2 + 1];
            var e1x = x - pts[a * 2], e1y = y - pts[a * 2 + 1], e2x = pts[c * 2] - x, e2y = pts[c * 2 + 1] - y;
            var l1 = Math.hypot(e1x, e1y) || 1, l2 = Math.hypot(e2x, e2y) || 1;
            var n1x = sgn * e1y / l1, n1y = -sgn * e1x / l1, n2x = sgn * e2y / l2, n2y = -sgn * e2x / l2;
            var mx = n1x + n2x, my = n1y + n2y, ml = Math.hypot(mx, my) || 1;
            mx /= ml; my /= ml;
            var k = Math.min(2, 1 / Math.max(0.5, mx * n1x + my * n1y));
            out.push(x + mx * d * k, y + my * d * k);
        }
        return out;
    }

    // A lumpy round stone's outline, as a closed smooth path.
    function stonePath(g, x, y, r, seed) {
        var n = 8, q = [], sq = 0.78 + hash(seed + 0.5) * 0.18, rot = hash(seed + 0.25) * TAU;
        for (var i = 0; i < n; i++) {
            var a = i / n * TAU + hash(seed) * TAU, rr = r * (0.8 + hash(seed + i * 1.37) * 0.28);
            var ox = Math.cos(a) * rr, oy = Math.sin(a) * rr * sq;
            q.push({ x: x + ox * Math.cos(rot) - oy * Math.sin(rot), y: y + ox * Math.sin(rot) + oy * Math.cos(rot) });
        }
        g.beginPath();
        var m0 = { x: (q[n - 1].x + q[0].x) / 2, y: (q[n - 1].y + q[0].y) / 2 };
        g.moveTo(m0.x, m0.y);
        for (i = 0; i < n; i++) {
            var p = q[i], nx = q[(i + 1) % n];
            g.quadraticCurveTo(p.x, p.y, (p.x + nx.x) / 2, (p.y + nx.y) / 2);
        }
        g.closePath();
    }

    function boulder(g, x, y, r, rk, v, seed) {
        var lt = sv(v, -1, -1), dn = sv(v, 1, 1.3);
        // The crack of shade it casts on whatever it sits against.
        stonePath(g, x + dn.x * r * 0.16, y + dn.y * r * 0.16, r * 1.02, seed);
        g.fillStyle = 'rgba(0, 0, 0, 0.32)';
        g.fill();
        stonePath(g, x, y, r, seed);
        var tone = (hash(seed + 6.6) - 0.5) * 0.16;
        var face = tone > 0 ? mixHex(rk.top, '#ffffff', tone) : mixHex(rk.top, rk.side, -tone);
        var gr = g.createRadialGradient(x + lt.x * r * 0.3, y + lt.y * r * 0.3, r * 0.2, x, y, r * 1.05);
        gr.addColorStop(0, mixHex(rk.top, '#ffffff', 0.16 + tone));
        gr.addColorStop(0.55, face);
        gr.addColorStop(1, mixHex(rk.top, rk.side, 0.62));
        g.fillStyle = gr;
        g.fill();
        g.save();
        g.clip();
        stoneDetails(g, x, y, r, rk, v, seed);
        g.restore();
        // Lit along the top edge, darker along the bottom.
        stonePath(g, x, y, r, seed);
        rimLight(g, x, y, r, v);
    }

    function rimLight(g, x, y, r, v) {
        var lt = sv(v, -1, -1);
        var rim = g.createLinearGradient(x + lt.x * r, y + lt.y * r, x - lt.x * r, y - lt.y * r);
        rim.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        rim.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
        rim.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
        rim.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
        g.strokeStyle = rim;
        g.lineWidth = 1.3;
        g.stroke();
    }

    // What lies on a stone, inside its clip: see ROCK.
    function stoneDetails(g, x, y, r, rk, v, seed) {
        var lt = sv(v, -1, -1), on = rk.on, k;
        if (on === 'snow') {
            // A cap of snow on the top of the stone, soft at its edge.
            var sx = x + lt.x * r * 0.42, sy = y + lt.y * r * 0.5;
            var sg = g.createRadialGradient(sx, sy, r * 0.1, sx, sy, r * 0.66);
            sg.addColorStop(0, '#ffffff');
            sg.addColorStop(0.62, 'rgba(240, 246, 252, 0.95)');
            sg.addColorStop(1, 'rgba(225, 235, 245, 0)');
            g.fillStyle = sg;
            g.beginPath();
            g.ellipse(sx, sy, r * 0.74, r * 0.5, 0, 0, TAU);
            g.fill();
        } else if (on === 'moss' || on === 'lichen') {
            var cols = on === 'moss' ? ['rgba(96, 132, 56, 0.32)', 'rgba(124, 160, 70, 0.26)'] : ['rgba(226, 150, 48, 0.6)', 'rgba(214, 200, 96, 0.5)'];
            for (k = 0; k < (on === 'moss' ? (hash(seed + 8) < 0.5 ? 0 : 2) : 5); k++) {
                var ma = hash(seed + k * 3.1) * TAU, md = hash(seed + k * 5.7) * r * 0.6;
                g.fillStyle = cols[k % 2];
                g.beginPath();
                g.arc(x + Math.cos(ma) * md + lt.x * r * 0.2, y + Math.sin(ma) * md + lt.y * r * 0.2,
                      (on === 'moss' ? 0.22 : 0.08) * r + hash(seed + k) * r * (on === 'moss' ? 0.18 : 0.08), 0, TAU);
                g.fill();
            }
        } else if (on === 'strata') {
            g.lineWidth = Math.max(1, r * 0.07);
            for (k = -1; k <= 1; k++) {
                g.strokeStyle = k ? 'rgba(120, 60, 25, 0.13)' : 'rgba(255, 225, 180, 0.15)';
                g.beginPath();
                g.moveTo(x - r, y + k * r * 0.32 + (hash(seed + k) - 0.5) * 3);
                g.quadraticCurveTo(x, y + k * r * 0.32 - r * 0.12, x + r, y + k * r * 0.32 + (hash(seed + k + 9) - 0.5) * 3);
                g.stroke();
            }
        } else if (on === 'crater') {
            for (k = 0; k < 2; k++) {
                var ca = hash(seed + k * 7) * TAU, cd = hash(seed + k * 11) * r * 0.45, cr = r * (0.14 + hash(seed + k * 13) * 0.14);
                var cx = x + Math.cos(ca) * cd, cy = y + Math.sin(ca) * cd;
                g.fillStyle = 'rgba(0, 0, 0, 0.28)';
                g.beginPath(); g.arc(cx, cy, cr, 0, TAU); g.fill();
                g.strokeStyle = 'rgba(255, 255, 255, 0.28)';
                g.lineWidth = 1;
                g.beginPath(); g.arc(cx, cy, cr, -Math.PI * 0.1, Math.PI * 0.6); g.stroke();
            }
        } else if (on === 'ember' && hash(seed + 4) < 0.6) {
            // A seam of the heat underneath showing through the stone.
            g.strokeStyle = 'rgba(255, 110, 30, 0.6)';
            g.lineWidth = 1.2;
            g.beginPath();
            var ex = x + (hash(seed + 1) - 0.5) * r, ey = y + (hash(seed + 2) - 0.5) * r;
            g.moveTo(ex, ey);
            for (k = 0; k < 3; k++) { ex += (hash(seed + k * 3) - 0.5) * r * 0.8; ey += (hash(seed + k * 5) - 0.5) * r * 0.8; g.lineTo(ex, ey); }
            g.stroke();
        }
        // Grain: a dusting of light and dark flecks.
        for (k = 0; k < r * 1.2; k++) {
            g.fillStyle = hash(seed + k * 0.77) < 0.5 ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.14)';
            g.fillRect(x + (hash(seed + k * 1.9) - 0.5) * r * 1.8, y + (hash(seed + k * 2.3) - 0.5) * r * 1.8, 1.2, 1.2);
        }
    }

    /* A rock too small to be a heap is one stone the shape of its outline:
       shaded across, with ridges running out from its crown to its
       corners, lit on one side and in shade on the other. */
    function monolith(g, out, rk, v, seed) {
        var c = pole(out), bb = boxOf(out), R = Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0) / 2, lt = sv(v, -1, -1);
        var cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2;
        trace(g, out, 0, 0);
        var gr = g.createRadialGradient(c.x + lt.x * R * 0.3, c.y + lt.y * R * 0.3, R * 0.1, cx, cy, R * 1.1);
        gr.addColorStop(0, mixHex(rk.top, '#ffffff', 0.2));
        gr.addColorStop(0.5, rk.top);
        gr.addColorStop(1, mixHex(rk.top, rk.side, 0.6));
        g.fillStyle = gr;
        g.fill();
        g.save();
        g.clip();
        // Ridges from the crown to every other corner.
        var n = out.length / 2, every = n > 8 ? Math.round(n / 5) : 1;
        for (var i = 0; i < n; i += every) {
            var vx = out[i * 2], vy = out[i * 2 + 1];
            var lit = ((vx - c.x) * lt.x + (vy - c.y) * lt.y) > 0;
            g.strokeStyle = lit ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.2)';
            g.lineWidth = 1.2;
            g.beginPath();
            g.moveTo(c.x + lt.x * 2, c.y + lt.y * 2);
            g.lineTo(vx, vy);
            g.stroke();
        }
        stoneDetails(g, c.x, c.y, Math.max(c.r, R * 0.7), rk, v, seed);
        g.restore();
        trace(g, out, 0, 0);
        rimLight(g, cx, cy, R, v);
    }

    function outcrop(g, pts, w, theme, v, seed) {
        var rk = ROCK[theme.id] || ROCK._;
        var m = { top: rk.top, side: rk.side, hi: 'rgba(255, 255, 255, 0.3)', grain: 'rgba(0, 0, 0, 0.3)' };
        solid(g, pts, w, m, v, 11, rk.gap);
        var out = grown(pts, w / 2 - 1.5), bb = boxOf(out);
        g.save();
        trace(g, out, 0, 0);
        g.clip();
        // The gaps: dark, or on the volcano lit from below.
        if (rk.on === 'ember') {
            var room = pole(pts);
            var eg = g.createRadialGradient(room.x, room.y, 2, room.x, room.y, Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0) * 0.6);
            eg.addColorStop(0, '#ff7a1a');
            eg.addColorStop(0.5, '#a3260a');
            eg.addColorStop(1, '#3a0d04');
            g.fillStyle = eg;
        } else {
            g.fillStyle = mixHex(rk.gap, rk.side, 0.55);
        }
        g.fillRect(bb.x0 - 2, bb.y0 - 2, bb.x1 - bb.x0 + 4, bb.y1 - bb.y0 + 4);
        // The stones: packed in big ones first, then smaller ones into the
        // room they leave, each allowed to sit a little on its neighbours;
        // a size to suit the outcrop's narrow way, and a lone stone for a
        // rock too small to be a heap.
        var narrow = Math.min(bb.x1 - bb.x0, bb.y1 - bb.y0), wide = Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0);
        var size = Math.max(8, Math.min(28, narrow * 0.5)), stones = [];
        if (wide < 96 || wide < size * 2.3) {
            monolith(g, out, rk, v, seed);
        } else {
            var tries = Math.ceil(Math.abs(polyArea(out)) / (size * size) * 60);
            for (var t = 0; t < tries; t++) {
                var n = seed + t * 1.618;
                var r = size * (1.3 - 0.85 * t / tries) * (0.85 + hash(n + 5.5) * 0.3);
                var x = bb.x0 + hash(n) * (bb.x1 - bb.x0), y = bb.y0 + hash(n + 2.2) * (bb.y1 - bb.y0);
                if (!P.pointInPoly(x, y, out) && edgeDist(out, x, y) > r * 0.4) continue;
                var free = true;
                for (var q = 0; q < stones.length && free; q++) {
                    if (Math.hypot(stones[q].x - x, stones[q].y - y) < (stones[q].r + r) * 0.62) free = false;
                }
                if (free) stones.push({ x: x, y: y, r: r, s: n });
            }
        }
        var down = sv(v, 0.35, 1);
        stones.sort(function (a, b) { return (a.x * down.x + a.y * down.y) - (b.x * down.x + b.y * down.y); });
        stones.forEach(function (st) { boulder(g, st.x, st.y, st.r, rk, v, st.s); });
        // A touch of shade over the whole outcrop's far side.
        var lt = sv(v, -1, -1), sh = g.createLinearGradient(bb.x0 + (lt.x < 0 ? 0 : bb.x1 - bb.x0), bb.y0 + (lt.y < 0 ? 0 : bb.y1 - bb.y0),
            bb.x0 + (lt.x < 0 ? bb.x1 - bb.x0 : 0), bb.y0 + (lt.y < 0 ? bb.y1 - bb.y0 : 0));
        sh.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
        sh.addColorStop(1, 'rgba(0, 0, 0, 0.14)');
        g.fillStyle = sh;
        g.fillRect(bb.x0, bb.y0, bb.x1 - bb.x0, bb.y1 - bb.y0);
        g.restore();
    }

    function polyArea(pts) {
        var a = 0;
        for (var i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) a += pts[j] * pts[i + 1] - pts[i] * pts[j + 1];
        return a / 2;
    }

    function paving(g, pts, seed) {
        var b = boxOf(pts);
        g.save();
        trace(g, pts, 0, 0);
        g.clip();
        g.strokeStyle = 'rgba(80, 74, 64, 0.35)';
        g.lineWidth = 1;
        g.beginPath();
        for (var y = b.y0; y < b.y1; y += 13) {
            g.moveTo(b.x0, y); g.lineTo(b.x1, y);
            for (var x = b.x0 + ((y - b.y0) / 13 % 2) * 9; x < b.x1; x += 18) { g.moveTo(x, y); g.lineTo(x, y + 13); }
        }
        g.stroke();
        g.restore();
    }

    /* A sandcastle, the kind built with a bucket: a keep, a turret at each
       corner and a flag. Every wall of it rises towards the viewer the way
       the course's walls do. */
    function prism(g, x, y, w, h, rise, top, side, v) {
        for (var k = rise; k > 0; k -= 1.5) {
            g.fillStyle = side;
            g.fillRect(x + v.dx * k, y + v.dy * k, w, h);
        }
        g.fillStyle = top;
        g.fillRect(x, y, w, h);
    }

    function turret(g, x, y, r, rise, v) {
        for (var k = rise; k > 0; k -= 1.5) {
            g.fillStyle = '#c4a468';
            g.beginPath();
            g.arc(x + v.dx * k, y + v.dy * k, r, 0, Math.PI * 2);
            g.fill();
        }
        g.fillStyle = '#efdcaa';
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
        // The bucket's ridges, as a ring of notches.
        g.fillStyle = 'rgba(150, 110, 60, 0.45)';
        for (var i = 0; i < 8; i++) {
            var a = i * Math.PI / 4;
            g.beginPath();
            g.arc(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.16, 0, Math.PI * 2);
            g.fill();
        }
    }

    function sandcastle(g, p, v, seed) {
        var s = Math.min(p.r * 1.05, 46), x0 = p.x - s / 2, y0 = p.y - s / 2;
        if (s < 14) return;
        var sh = sv(v, 8, 12);
        g.save();
        g.fillStyle = 'rgba(0, 0, 0, 0.18)';
        g.fillRect(x0 + sh.x, y0 + sh.y, s, s);
        prism(g, x0, y0, s, s, 12, '#ead39c', '#c4a468', v);
        // Battlements round the keep's top.
        g.fillStyle = 'rgba(120, 90, 45, 0.45)';
        for (var i = 0; i < 4; i++) {
            var t = i / 4 + 0.125;
            g.fillRect(x0 + s * t - 2, y0, 4, 3); g.fillRect(x0 + s * t - 2, y0 + s - 3, 4, 3);
            g.fillRect(x0, y0 + s * t - 2, 3, 4); g.fillRect(x0 + s - 3, y0 + s * t - 2, 3, 4);
        }
        var tr = s * 0.24;
        [[x0, y0], [x0 + s, y0], [x0, y0 + s], [x0 + s, y0 + s]].forEach(function (c) { turret(g, c[0], c[1], tr, 16, v); });
        // A gate on the near side, and a flag on a stick.
        var gate = sv(v, 0, s / 2 + 8);
        g.fillStyle = '#7a5a2e';
        g.beginPath();
        g.arc(p.x + gate.x, p.y + gate.y, s * 0.13, Math.PI, 0);
        g.fill();
        var up = sv(v, 0, -1), side = sv(v, 1, 0);
        var fx = p.x + up.x * 26, fy = p.y + up.y * 26;
        g.strokeStyle = '#6b4a2a';
        g.lineWidth = 1.6;
        g.beginPath();
        g.moveTo(p.x, p.y);
        g.lineTo(fx, fy);
        g.stroke();
        g.fillStyle = hash(seed) < 0.5 ? '#ef4444' : '#3b82f6';
        g.beginPath();
        g.moveTo(fx, fy);
        g.lineTo(fx + side.x * 13 - up.x * 4, fy + side.y * 13 - up.y * 4);
        g.lineTo(fx - up.x * 8, fy - up.y * 8);
        g.closePath();
        g.fill();
        g.restore();
    }

    /* A snowman seen from above and a little in front: three balls of
       snow stacked away from the viewer, each smaller than the one under
       it, all inside the bottom one — which is the block, rail and all —
       with stick arms, a scarf, a carrot and a hat. */
    /* A snowman of three balls, the big one on the ground and each above
       sitting into the one below, seen from above and a little in front:
       stick arms, coal buttons, a scarf wound once round the neck with its
       end hanging down the front, a carrot nose and a top hat. */
    function snowman(g, p, w, v, seed) {
        var r0 = p.r + w / 2, F = standFrame(p, v);
        var rb = r0, rm = r0 * 0.7, rh = r0 * 0.5, hm = r0 * 0.62, hh = r0 * 1.12;
        var scarf = ['#dc2626', '#2563eb', '#16a34a', '#9333ea'][(hash(seed) * 4) | 0];
        g.save();
        g.lineCap = 'round';
        g.lineJoin = 'round';
        // Shadow, and the skirt of trodden snow it stands in.
        var s0 = F.at(0, 0, 0), sd = sv(v, 1, 0.8);
        g.fillStyle = 'rgba(30, 50, 75, 0.22)';
        g.beginPath(); g.ellipse(s0.x + sd.x * r0 * 0.5, s0.y + sd.y * r0 * 0.5, r0 * 1.15, r0 * 0.75, Math.atan2(sd.y, sd.x), 0, TAU); g.fill();
        function ball(h, r) {
            var c = F.at(0, 0, h), l = sv(v, -0.38, -0.42);
            var gr = g.createRadialGradient(c.x + l.x * r, c.y + l.y * r, r * 0.08, c.x, c.y, r);
            gr.addColorStop(0, '#ffffff');
            gr.addColorStop(0.6, '#eef3f8');
            gr.addColorStop(1, '#b7c6d6');
            g.fillStyle = gr;
            g.beginPath(); g.arc(c.x, c.y, r, 0, TAU); g.fill();
            g.strokeStyle = 'rgba(100, 125, 155, 0.45)';
            g.lineWidth = 1;
            g.stroke();
            return c;
        }
        ball(0, rb);
        // Stick arms out of the middle ball, each with two twigs at its end.
        g.strokeStyle = '#5b3a1e';
        g.lineWidth = Math.max(1.8, r0 * 0.07);
        [-1, 1].forEach(function (d) {
            var a0 = F.at(d * rm * 0.75, 0, hm), a1 = F.at(d * rb * 1.25, -rb * 0.1, hm + r0 * 0.28);
            g.beginPath(); g.moveTo(a0.x, a0.y); g.lineTo(a1.x, a1.y); g.stroke();
            var t1 = F.at(d * rb * 1.42, -rb * 0.1, hm + r0 * 0.48), t2 = F.at(d * rb * 1.45, -rb * 0.05, hm + r0 * 0.16);
            g.beginPath(); g.moveTo(a1.x, a1.y); g.lineTo(t1.x, t1.y); g.moveTo(a1.x, a1.y); g.lineTo(t2.x, t2.y); g.stroke();
        });
        var mid = ball(hm, rm);
        // Coal buttons down the front of the middle ball.
        g.fillStyle = '#1f2937';
        for (var i = 0; i < 3; i++) {
            var bt = F.at(0, rm * (0.55 - i * 0.04), hm - rm * (0.35 - i * 0.32));
            g.beginPath(); g.arc(bt.x, bt.y, Math.max(1.3, r0 * 0.06), 0, TAU); g.fill();
        }
        // The scarf: a band round the neck, and its end down the front.
        var nk = F.at(0, 0, (hm + hh) / 2 + r0 * 0.05);
        g.strokeStyle = scarf;
        g.lineWidth = Math.max(3, r0 * 0.2);
        g.beginPath(); g.ellipse(nk.x, nk.y, rh * 1.02, rh * 0.5, F.rot, 0.05, Math.PI - 0.05); g.stroke();
        var e0 = F.at(rh * 0.45, rh * 0.75, (hm + hh) / 2), e1 = F.at(rh * 0.7, rm * 0.9, hm - rm * 0.1);
        g.lineWidth = Math.max(2.6, r0 * 0.17);
        g.beginPath(); g.moveTo(e0.x, e0.y); g.lineTo(e1.x, e1.y); g.stroke();
        g.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        g.lineWidth = Math.max(1, r0 * 0.05);
        [0.4, 0.7].forEach(function (k) {
            var c = { x: e0.x + (e1.x - e0.x) * k, y: e0.y + (e1.y - e0.y) * k }, R = F.R;
            g.beginPath(); g.moveTo(c.x - R.x * r0 * 0.08, c.y - R.y * r0 * 0.08); g.lineTo(c.x + R.x * r0 * 0.08, c.y + R.y * r0 * 0.08); g.stroke();
        });
        var head = ball(hh, rh);
        // Coal eyes and smile, and a carrot nose pointing out of the picture.
        g.fillStyle = '#111827';
        [-1, 1].forEach(function (d) {
            var e = F.at(d * rh * 0.32, rh * 0.5, hh + rh * 0.12);
            g.beginPath(); g.arc(e.x, e.y, Math.max(1.2, r0 * 0.055), 0, TAU); g.fill();
        });
        for (i = -2; i <= 2; i++) {
            var m = F.at(i * rh * 0.16, rh * 0.82, hh - rh * 0.3 + Math.abs(i) * rh * 0.06);
            g.beginPath(); g.arc(m.x, m.y, Math.max(0.8, r0 * 0.035), 0, TAU); g.fill();
        }
        var n0 = F.at(0, rh * 0.75, hh - rh * 0.02), n1 = F.at(rh * 0.15, rh * 1.6, hh - rh * 0.2);
        g.fillStyle = '#f97316';
        g.beginPath();
        g.moveTo(n0.x - F.R.x * rh * 0.14, n0.y - F.R.y * rh * 0.14 - 1);
        g.lineTo(n0.x + F.R.x * rh * 0.14, n0.y + F.R.y * rh * 0.14 + 1);
        g.lineTo(n1.x, n1.y);
        g.closePath();
        g.fill();
        // The top hat: brim, crown and a band round it.
        var hb = hh + rh * 0.62, HF = standFrame(F.at(0, -rh * 0.1, 0), v);
        ringAt(g, HF, hb, rh * 0.95, '#111827');
        drumPath(g, HF, hb, rh * 0.6, hb + rh * 0.95, rh * 0.58);
        g.fillStyle = drumShade(g, HF, hb, rh * 0.6, '#4b5563', '#030712');
        g.fill();
        bandPath(g, HF, hb + rh * 0.08, rh * 0.6, hb + rh * 0.28, rh * 0.6);
        g.fillStyle = scarf;
        g.fill();
        ringAt(g, HF, hb + rh * 0.95, rh * 0.58, '#1f2937');
        g.restore();
    }

    /* Round things that stand up off the ground — a lighthouse, a
       snowman, an igloo — are drawn in the view the huts are: from above and
       a little in front, so a level circle is an ellipse half as deep as it
       is wide and height runs up the screen. F(a, b, h) is the point `a`
       across, `b` back into the picture and `h` up off the ground. */
    function standFrame(p, v) {
        var R = sv(v, 1, 0), D = sv(v, 0, 1), U = sv(v, 0, -1);
        return {
            R: R, U: U, rot: Math.atan2(R.y, R.x),
            at: function (a, b, h) { return { x: p.x + R.x * a + D.x * b * 0.55 + U.x * h, y: p.y + R.y * a + D.y * b * 0.55 + U.y * h }; }
        };
    }

    function ringAt(g, F, h, r, fill) {
        var c = F.at(0, 0, h);
        g.beginPath();
        g.ellipse(c.x, c.y, r, r * 0.55, F.rot, 0, TAU);
        if (fill) { g.fillStyle = fill; g.fill(); }
    }

    // The side of an upright frustum from height h0 (radius r0) to h1 (r1),
    // as one closed outline: the near half of the bottom rim, up one side,
    // the far half of the top rim, and down the other.
    function drumPath(g, F, h0, r0, h1, r1) {
        var a0 = F.at(0, 0, h0), a1 = F.at(0, 0, h1);
        g.beginPath();
        g.ellipse(a0.x, a0.y, r0, r0 * 0.55, F.rot, 0, Math.PI);
        g.ellipse(a1.x, a1.y, r1, r1 * 0.55, F.rot, Math.PI, TAU);
        g.closePath();
    }

    // A band round a drum between two heights, as much of it as faces the
    // viewer: the near halves of the two rims.
    function bandPath(g, F, h0, r0, h1, r1) {
        var a0 = F.at(0, 0, h0), a1 = F.at(0, 0, h1);
        g.beginPath();
        g.ellipse(a0.x, a0.y, r0, r0 * 0.55, F.rot, 0, Math.PI);
        g.ellipse(a1.x, a1.y, r1, r1 * 0.55, F.rot, Math.PI, 0, true);
        g.closePath();
    }

    // Lit from the left, in shade on the right, across a drum.
    function drumShade(g, F, h, r, light, dark) {
        var c = F.at(0, 0, h), gr = g.createLinearGradient(c.x - F.R.x * r, c.y - F.R.y * r, c.x + F.R.x * r, c.y + F.R.y * r);
        gr.addColorStop(0, light);
        gr.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
        gr.addColorStop(1, dark);
        return gr;
    }

    /* A lighthouse on its rock: a tower in red and white bands narrowing
       as it rises, a black gallery with its railing, the lantern lit
       behind its glass and a red cap — and its long shadow over the grass.
       The foot of the tower is the block. */
    function lighthouse(g, p, w, v) {
        var r0 = p.r + w / 2, F = standFrame(p, v), H = r0 * 1.55, rb = r0 * 0.74, rt = r0 * 0.46;
        g.save();
        // The shadow, long and to the lower right.
        var s0 = F.at(0, 0, 0), sd = sv(v, 1, 0.7);
        g.fillStyle = 'rgba(20, 40, 60, 0.24)';
        g.beginPath();
        g.ellipse(s0.x + sd.x * r0 * 0.9, s0.y + sd.y * r0 * 0.9, r0 * 1.5, r0 * 0.6, Math.atan2(sd.y, sd.x), 0, TAU);
        g.fill();
        // The rock it stands on.
        ringAt(g, F, 0, r0, '#8d8a80');
        ringAt(g, F, 2, r0 * 0.96, '#a8a49a');
        g.fillStyle = 'rgba(0, 0, 0, 0.18)';
        for (var k = 0; k < 7; k++) {
            var q = F.at(Math.cos(k * 0.9) * r0 * 0.8, Math.sin(k * 0.9) * r0 * 0.8, 2);
            g.beginPath(); g.arc(q.x, q.y, 1.6 + (k % 3), 0, TAU); g.fill();
        }
        // The tower, banded, and shaded across.
        drumPath(g, F, 2, rb, H, rt);
        g.fillStyle = '#f8fafc';
        g.fill();
        g.save();
        g.clip();
        for (var b = 0; b < 4; b++) {
            var hA = 2 + (H - 2) * (b * 2 + 1) / 8, hB = 2 + (H - 2) * (b * 2 + 2) / 8;
            var rA = rb + (rt - rb) * (hA / H), rB = rb + (rt - rb) * (hB / H);
            bandPath(g, F, hA, rA, hB, rB);
            g.fillStyle = '#dc2626';
            g.fill();
        }
        drumPath(g, F, 2, rb, H, rt);
        g.fillStyle = drumShade(g, F, H / 2, rb, 'rgba(255, 255, 255, 0.35)', 'rgba(15, 23, 42, 0.45)');
        g.fill();
        g.restore();
        drumPath(g, F, 2, rb, H, rt);
        g.strokeStyle = 'rgba(15, 23, 42, 0.45)';
        g.lineWidth = 1;
        g.stroke();
        // A door at the foot and a window up the near side.
        var d = F.at(0, rb * 0.95, 2);
        g.fillStyle = '#1f2937';
        g.beginPath();
        g.moveTo(d.x - F.R.x * rb * 0.18, d.y - F.R.y * rb * 0.18);
        g.lineTo(d.x - F.R.x * rb * 0.18 + F.U.x * H * 0.2, d.y - F.R.y * rb * 0.18 + F.U.y * H * 0.2);
        g.lineTo(d.x + F.R.x * rb * 0.18 + F.U.x * H * 0.2, d.y + F.R.y * rb * 0.18 + F.U.y * H * 0.2);
        g.lineTo(d.x + F.R.x * rb * 0.18, d.y + F.R.y * rb * 0.18);
        g.fill();
        var wn = F.at(0, (rb + rt) / 2 * 0.95, H * 0.58);
        g.fillStyle = '#1e293b';
        g.fillRect(wn.x - 1.6, wn.y - 2.4, 3.2, 4.8);
        // The gallery: a black deck, wider than the tower, and its railing.
        ringAt(g, F, H, rt * 1.35, '#1f2937');
        ringAt(g, F, H + 1.2, rt * 1.25, '#374151');
        g.strokeStyle = 'rgba(203, 213, 225, 0.8)';
        g.lineWidth = 0.8;
        for (var i = 0; i < 12; i++) {
            var a = i / 12 * TAU, q0 = F.at(Math.cos(a) * rt * 1.28, Math.sin(a) * rt * 1.28, H + 1), q1 = F.at(Math.cos(a) * rt * 1.28, Math.sin(a) * rt * 1.28, H + 5);
            g.beginPath(); g.moveTo(q0.x, q0.y); g.lineTo(q1.x, q1.y); g.stroke();
        }
        ringAt(g, F, H + 5, rt * 1.28);
        g.stroke();
        // The lantern: glass, lit, under a red cap with a vent on top.
        var lh = r0 * 0.38, lr = rt * 0.82, lc = F.at(0, 0, H + lh / 2);
        var glow = g.createRadialGradient(lc.x, lc.y, 1, lc.x, lc.y, r0 * 1.4);
        glow.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
        glow.addColorStop(1, 'rgba(254, 240, 138, 0)');
        g.fillStyle = glow;
        g.beginPath(); g.arc(lc.x, lc.y, r0 * 1.4, 0, TAU); g.fill();
        drumPath(g, F, H + 1, lr, H + lh, lr);
        var lg = drumShade(g, F, H + lh / 2, lr, 'rgba(255, 255, 255, 0.9)', 'rgba(202, 138, 4, 0.9)');
        g.fillStyle = '#fde047';
        g.fill();
        g.fillStyle = lg;
        g.fill();
        g.strokeStyle = '#1f2937';
        g.lineWidth = 0.8;
        for (i = -1; i <= 1; i++) {
            var m0 = F.at(i * lr * 0.6, lr * 0.85, H + 1), m1 = F.at(i * lr * 0.6, lr * 0.85, H + lh);
            g.beginPath(); g.moveTo(m0.x, m0.y); g.lineTo(m1.x, m1.y); g.stroke();
        }
        drumPath(g, F, H + lh, lr * 1.12, H + lh + r0 * 0.28, lr * 0.2);
        g.fillStyle = drumShade(g, F, H + lh, lr, '#f87171', '#7f1d1d');
        g.fill();
        ringAt(g, F, H + lh, lr * 1.12);
        g.strokeStyle = '#7f1d1d';
        g.stroke();
        var tip = F.at(0, 0, H + lh + r0 * 0.3);
        g.fillStyle = '#1f2937';
        g.beginPath(); g.arc(tip.x, tip.y, 1.6, 0, TAU); g.fill();
        g.restore();
    }

    /* The fun props. Each is drawn on a ground of its own — a snowbank, a
       patch of sand, a tilled bed, a launch pad — which is the block's
       outline and its kerb, and the thing itself stands at the roomiest
       point of it, seen from above and a little in front. */
    function funProp(g, pts, w, v, look, seed) {
        var p = pole(pts), R = Math.max(12, Math.min(p.r * 0.95, 48)), F = standFrame(p, v), i, k, q;
        g.save();
        g.lineCap = 'round';
        g.lineJoin = 'round';
        if (look === 'igloo') {
            solid(g, pts, w, { top: '#eef4fa', side: '#9fb4c8', hi: 'rgba(255, 255, 255, 0.8)', grain: 'rgba(100, 130, 160, 0.3)' }, v, 8, '#f6f9fc');
            // Drifts on the bank.
            g.save(); trace(g, pts, 0, 0); g.clip();
            g.fillStyle = 'rgba(150, 180, 210, 0.22)';
            for (i = 0; i < 6; i++) {
                q = { x: p.x + (hash(seed + i) - 0.5) * p.r * 2.2, y: p.y + (hash(seed + i * 2.3) - 0.5) * p.r * 2.2 };
                g.beginPath(); g.ellipse(q.x, q.y, 18 + hash(seed + i * 3) * 18, 5, 0.2, 0, TAU); g.fill();
            }
            g.restore();
            // Shadow, then the dome.
            var sd = sv(v, 1, 0.8), s0 = F.at(0, 0, 0);
            g.fillStyle = 'rgba(40, 70, 100, 0.25)';
            g.beginPath(); g.ellipse(s0.x + sd.x * R * 0.4, s0.y + sd.y * R * 0.4, R * 1.15, R * 0.7, Math.atan2(sd.y, sd.x), 0, TAU); g.fill();
            var dc = F.at(0, 0, R * 0.38);
            function dome() {
                g.beginPath();
                g.ellipse(s0.x, s0.y, R, R * 0.55, F.rot, 0, Math.PI);
                g.ellipse(dc.x, dc.y, R, R * 0.92, F.rot, Math.PI, TAU);
                g.closePath();
            }
            dome();
            var lt = sv(v, -0.4, -0.5), dg = g.createRadialGradient(dc.x + lt.x * R * 0.7, dc.y + lt.y * R * 0.7, R * 0.1, dc.x, dc.y, R * 1.15);
            dg.addColorStop(0, '#ffffff'); dg.addColorStop(0.6, '#e6eef6'); dg.addColorStop(1, '#a9bdd1');
            g.fillStyle = dg; g.fill();
            // The courses of snow blocks: rings round the dome, and the joints
            // between blocks staggered course by course.
            g.save(); dome(); g.clip();
            g.strokeStyle = 'rgba(110, 140, 175, 0.45)';
            g.lineWidth = 1;
            for (k = 1; k <= 4; k++) {
                var hk = R * 0.38 * (k / 2.2), rk = Math.sqrt(Math.max(0, 1 - (k / 5) * (k / 5))) * R, ck = F.at(0, 0, hk + (k - 1) * R * 0.05);
                g.beginPath(); g.ellipse(ck.x, ck.y, rk, rk * 0.55, F.rot, 0, Math.PI); g.stroke();
                for (var j = -3; j <= 3; j++) {
                    var a = Math.PI / 2 + (j + (k % 2) * 0.5) * 0.42;
                    if (a < 0.15 || a > Math.PI - 0.15) continue;
                    var b0 = F.at(Math.cos(a) * rk, Math.sin(a) * rk, hk + (k - 1) * R * 0.05);
                    var b1 = F.at(Math.cos(a) * rk * 0.92, Math.sin(a) * rk * 0.92, hk + (k - 1) * R * 0.05 + R * 0.2);
                    g.beginPath(); g.moveTo(b0.x, b0.y); g.lineTo(b1.x, b1.y); g.stroke();
                }
            }
            g.restore();
            dome();
            g.strokeStyle = 'rgba(90, 120, 155, 0.6)'; g.lineWidth = 1.2; g.stroke();
            // The way in: a short tunnel out of the near side, dark inside.
            var tw = R * 0.42, t0 = F.at(0, R * 0.75, 0), t1 = F.at(0, R * 1.25, 0);
            g.fillStyle = '#e9f0f7';
            g.beginPath();
            g.ellipse(t1.x, t1.y, tw, tw * 0.55, F.rot, 0, Math.PI);
            g.lineTo(t1.x - F.R.x * tw + F.U.x * tw * 0.9, t1.y - F.R.y * tw + F.U.y * tw * 0.9);
            g.lineTo(t0.x - F.R.x * tw + F.U.x * tw * 0.9, t0.y - F.R.y * tw + F.U.y * tw * 0.9);
            g.lineTo(t0.x + F.R.x * tw + F.U.x * tw * 0.9, t0.y + F.R.y * tw + F.U.y * tw * 0.9);
            g.lineTo(t1.x + F.R.x * tw + F.U.x * tw * 0.9, t1.y + F.R.y * tw + F.U.y * tw * 0.9);
            g.closePath(); g.fill();
            g.strokeStyle = 'rgba(90, 120, 155, 0.5)'; g.stroke();
            var mo = F.at(0, R * 1.25, tw * 0.45);
            g.fillStyle = '#26323f';
            g.beginPath(); g.ellipse(mo.x, mo.y, tw * 0.62, tw * 0.62, F.rot, Math.PI, TAU); g.lineTo(mo.x + F.R.x * tw * 0.62, mo.y + F.R.y * tw * 0.62 + tw * 0.4);
            g.lineTo(mo.x - F.R.x * tw * 0.62, mo.y - F.R.y * tw * 0.62 + tw * 0.4); g.closePath(); g.fill();
        } else if (look === 'parasol') {
            solid(g, pts, w, { top: '#ead7a4', side: '#b8975a', hi: 'rgba(255, 250, 230, 0.55)', grain: 'rgba(150, 110, 60, 0.3)' }, v, 7, '#efdcab');
            var paint = ['#e11d48', '#2563eb', '#16a34a', '#f59e0b'][(hash(seed) * 4) | 0];
            // A striped towel half under it, and a bucket.
            var ta = sv(v, 1, 0.35), tl = Math.hypot(ta.x, ta.y); ta = { x: ta.x / tl, y: ta.y / tl };
            var tn = { x: -ta.y, y: ta.x }, tc = { x: p.x + ta.x * R * 0.35 + tn.x * R * 0.35, y: p.y + ta.y * R * 0.35 + tn.y * R * 0.35 };
            g.save(); g.translate(tc.x, tc.y); g.rotate(Math.atan2(ta.y, ta.x));
            for (i = 0; i < 6; i++) {
                g.fillStyle = i % 2 ? '#ffffff' : ['#0ea5e9', '#f97316', '#a855f7'][(hash(seed + 1) * 3) | 0];
                g.fillRect(-R * 0.9 + i * R * 0.3, -R * 0.38, R * 0.3, R * 0.76);
            }
            g.restore();
            var bk = F.at(-R * 0.85, R * 0.6, 0);
            g.fillStyle = '#facc15'; g.beginPath(); g.arc(bk.x, bk.y, Math.max(3, R * 0.14), 0, TAU); g.fill();
            g.strokeStyle = '#b45309'; g.lineWidth = 1; g.stroke();
            // The parasol's shadow, then the canopy in eight panels.
            var top = F.at(0, 0, R * 0.9), ps = sv(v, R * 0.35, R * 0.5);
            g.fillStyle = 'rgba(80, 60, 20, 0.28)';
            g.beginPath(); g.arc(p.x + ps.x, p.y + ps.y, R * 0.95, 0, TAU); g.fill();
            g.strokeStyle = '#e5e7eb'; g.lineWidth = 2;
            g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(top.x, top.y); g.stroke();
            for (i = 0; i < 8; i++) {
                var a0 = i / 8 * TAU, a1 = (i + 1) / 8 * TAU;
                g.fillStyle = i % 2 ? '#ffffff' : paint;
                g.beginPath();
                g.moveTo(top.x, top.y);
                g.lineTo(top.x + Math.cos(a0) * R, top.y + Math.sin(a0) * R * 0.8);
                g.quadraticCurveTo(top.x + Math.cos((a0 + a1) / 2) * R * 0.92, top.y + Math.sin((a0 + a1) / 2) * R * 0.74,
                                   top.x + Math.cos(a1) * R, top.y + Math.sin(a1) * R * 0.8);
                g.closePath(); g.fill();
            }
            var cg = g.createRadialGradient(top.x - R * 0.3, top.y - R * 0.3, R * 0.1, top.x, top.y, R);
            cg.addColorStop(0, 'rgba(255, 255, 255, 0.3)'); cg.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
            g.fillStyle = cg;
            g.beginPath(); g.ellipse(top.x, top.y, R, R * 0.8, 0, 0, TAU); g.fill();
            g.fillStyle = '#f8fafc'; g.beginPath(); g.arc(top.x, top.y, 2.4, 0, TAU); g.fill();
        } else if (look === 'scarecrow') {
            // A tilled vegetable patch: furrows, and rows of cabbages.
            solid(g, pts, w, material('timber'), v, EXT, '#5b3a22');
            g.save(); trace(g, pts, 0, 0); g.clip();
            var bb = boxOf(pts);
            g.strokeStyle = 'rgba(30, 15, 5, 0.35)'; g.lineWidth = 3;
            for (var fy = bb.y0 + 8; fy < bb.y1; fy += 14) { g.beginPath(); g.moveTo(bb.x0, fy); g.lineTo(bb.x1, fy); g.stroke(); }
            for (fy = bb.y0 + 15; fy < bb.y1; fy += 14) {
                for (var fx = bb.x0 + 10 + (fy % 28 ? 0 : 7); fx < bb.x1; fx += 16) {
                    if (Math.hypot(fx - p.x, fy - p.y) < R * 0.5) continue;
                    g.fillStyle = hash(fx * 0.3 + fy) < 0.5 ? '#4d7c2f' : '#6b9b3a';
                    g.beginPath(); g.arc(fx, fy, 3.6, 0, TAU); g.fill();
                    g.fillStyle = 'rgba(190, 230, 140, 0.5)';
                    g.beginPath(); g.arc(fx - 1, fy - 1, 1.4, 0, TAU); g.fill();
                }
            }
            g.restore();
            // The scarecrow: post, crossbar in a check shirt, straw hands, a
            // sack head under a straw hat, and a crow on one arm.
            var H = R * 1.25, s1 = F.at(0, 0, 0), sh2 = sv(v, 1, 0.8);
            g.strokeStyle = 'rgba(0, 0, 0, 0.25)'; g.lineWidth = 3;
            g.beginPath(); g.moveTo(s1.x, s1.y); g.lineTo(s1.x + sh2.x * H * 0.8, s1.y + sh2.y * H * 0.8); g.stroke();
            var post0 = F.at(0, 0, 0), post1 = F.at(0, 0, H);
            g.strokeStyle = '#7c5a36'; g.lineWidth = 3;
            g.beginPath(); g.moveTo(post0.x, post0.y); g.lineTo(post1.x, post1.y); g.stroke();
            var aL = F.at(-R * 0.75, 0, H * 0.72), aR = F.at(R * 0.75, 0, H * 0.72);
            g.strokeStyle = '#b91c1c'; g.lineWidth = Math.max(4, R * 0.18);
            g.beginPath(); g.moveTo(aL.x, aL.y); g.lineTo(aR.x, aR.y); g.stroke();
            g.strokeStyle = 'rgba(255, 255, 255, 0.35)'; g.lineWidth = 1;
            for (k = -3; k <= 3; k++) {
                q = F.at(k * R * 0.2, 0, H * 0.72);
                g.beginPath(); g.moveTo(q.x, q.y - R * 0.08); g.lineTo(q.x, q.y + R * 0.08); g.stroke();
            }
            var body0 = F.at(0, 0, H * 0.4), body1 = F.at(0, 0, H * 0.78);
            g.strokeStyle = '#b91c1c'; g.lineWidth = Math.max(7, R * 0.34);
            g.beginPath(); g.moveTo(body0.x, body0.y); g.lineTo(body1.x, body1.y); g.stroke();
            g.strokeStyle = '#eab308'; g.lineWidth = 1.2;
            [aL, aR, body0].forEach(function (e, n) {
                for (var t = -2; t <= 2; t++) {
                    var dx = n < 2 ? (n ? 1 : -1) * 5 : t * 1.5, dy = n < 2 ? t * 1.5 : 5;
                    g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(e.x + dx, e.y + dy); g.stroke();
                }
            });
            var hd = F.at(0, 0, H * 0.95);
            g.fillStyle = '#d6b98c'; g.beginPath(); g.arc(hd.x, hd.y, R * 0.2, 0, TAU); g.fill();
            g.fillStyle = '#3f2a14';
            g.beginPath(); g.arc(hd.x - R * 0.07, hd.y + R * 0.02, 1.3, 0, TAU); g.arc(hd.x + R * 0.07, hd.y + R * 0.02, 1.3, 0, TAU); g.fill();
            var HF2 = standFrame(F.at(0, 0, 0), v), hb = H * 1.05;
            ringAt(g, HF2, hb, R * 0.36, '#ca8a04');
            drumPath(g, HF2, hb, R * 0.2, hb + R * 0.2, R * 0.16);
            g.fillStyle = '#eab308'; g.fill();
            // The crow.
            var cr = F.at(R * 0.62, 0, H * 0.72 + 3);
            g.fillStyle = '#111827';
            g.beginPath(); g.ellipse(cr.x, cr.y - 2, 4.5, 3, -0.3, 0, TAU); g.fill();
            g.beginPath(); g.arc(cr.x + 4, cr.y - 5, 2.4, 0, TAU); g.fill();
            g.fillStyle = '#f59e0b';
            g.beginPath(); g.moveTo(cr.x + 6, cr.y - 5.5); g.lineTo(cr.x + 9, cr.y - 4.8); g.lineTo(cr.x + 6, cr.y - 4.2); g.fill();
        } else {
            // A launch pad: concrete, its ring of hazard stripes, and the
            // rocket standing on it.
            solid(g, pts, w, { top: '#9ca3af', side: '#4b5563', hi: 'rgba(255, 255, 255, 0.45)', grain: 'rgba(0, 0, 0, 0.3)' }, v, 7, '#6b7280');
            g.save(); trace(g, pts, 0, 0); g.clip();
            g.strokeStyle = '#facc15'; g.lineWidth = 6; g.setLineDash([8, 8]);
            g.beginPath(); g.arc(p.x, p.y, R * 0.92, 0, TAU); g.stroke();
            g.setLineDash([]);
            g.fillStyle = 'rgba(0, 0, 0, 0.35)';
            g.beginPath(); g.arc(p.x, p.y, R * 0.5, 0, TAU); g.fill();
            g.restore();
            var rr = R * 0.32, RH = R * 1.9, sd2 = sv(v, 1, 0.7), base = F.at(0, 0, 0);
            g.fillStyle = 'rgba(0, 0, 0, 0.3)';
            g.beginPath(); g.ellipse(base.x + sd2.x * RH * 0.45, base.y + sd2.y * RH * 0.45, RH * 0.55, rr * 0.9, Math.atan2(sd2.y, sd2.x), 0, TAU); g.fill();
            // Fins: two out to the sides and one towards the viewer.
            g.fillStyle = '#dc2626';
            [-1, 1].forEach(function (d) {
                var f0 = F.at(d * rr, 0, RH * 0.32), f1 = F.at(d * rr * 2.1, 0, 0), f2 = F.at(d * rr, 0, 0);
                g.beginPath(); g.moveTo(f0.x, f0.y); g.lineTo(f1.x, f1.y); g.lineTo(f2.x, f2.y); g.closePath(); g.fill();
            });
            drumPath(g, F, 0, rr, RH * 0.72, rr);
            g.fillStyle = drumShade(g, F, RH * 0.36, rr, 'rgba(255, 255, 255, 1)', '#94a3b8');
            g.fillStyle = '#f1f5f9'; g.fill();
            g.fillStyle = drumShade(g, F, RH * 0.36, rr, 'rgba(255, 255, 255, 0.6)', 'rgba(30, 41, 59, 0.45)'); g.fill();
            bandPath(g, F, RH * 0.1, rr, RH * 0.17, rr); g.fillStyle = '#dc2626'; g.fill();
            bandPath(g, F, RH * 0.6, rr, RH * 0.66, rr); g.fillStyle = '#dc2626'; g.fill();
            var nf = F.at(0, rr * 0.4, 0), fn0 = F.at(0, rr, RH * 0.3), fn1 = F.at(0, rr * 1.9, 0);
            g.fillStyle = '#b91c1c';
            g.beginPath(); g.moveTo(fn0.x, fn0.y); g.lineTo(fn1.x, fn1.y); g.lineTo(nf.x, nf.y); g.closePath(); g.fill();
            // The nose cone and a porthole.
            drumPath(g, F, RH * 0.72, rr, RH, 0.5);
            g.fillStyle = '#dc2626'; g.fill();
            g.fillStyle = drumShade(g, F, RH * 0.8, rr, 'rgba(255, 255, 255, 0.5)', 'rgba(60, 0, 0, 0.45)'); g.fill();
            var ph = F.at(0, rr * 0.9, RH * 0.48);
            g.fillStyle = '#1e3a8a'; g.beginPath(); g.arc(ph.x, ph.y, rr * 0.38, 0, TAU); g.fill();
            g.strokeStyle = '#cbd5e1'; g.lineWidth = 1.4; g.stroke();
            g.fillStyle = 'rgba(255, 255, 255, 0.6)'; g.beginPath(); g.arc(ph.x - rr * 0.12, ph.y - rr * 0.12, rr * 0.1, 0, TAU); g.fill();
        }
        g.restore();
    }

    /* The long axis of an outline: the direction of its longest edge, its
       middle, and how far it reaches along and across that direction. */
    function axisOf(pts) {
        var best = 0, ux = 1, uy = 0, cx = 0, cy = 0, n = pts.length / 2, i;
        for (i = 0; i < pts.length; i += 2) {
            var j = (i + 2) % pts.length, ex = pts[j] - pts[i], ey = pts[j + 1] - pts[i + 1], L = Math.hypot(ex, ey);
            if (L > best) { best = L; ux = ex / L; uy = ey / L; }
            cx += pts[i] / n; cy += pts[i + 1] / n;
        }
        var a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
        for (i = 0; i < pts.length; i += 2) {
            var dx = pts[i] - cx, dy = pts[i + 1] - cy, a = dx * ux + dy * uy, b = -dx * uy + dy * ux;
            a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b);
        }
        return { cx: cx + ux * (a0 + a1) / 2 - uy * (b0 + b1) / 2, cy: cy + uy * (a0 + a1) / 2 + ux * (b0 + b1) / 2,
                 ux: ux, uy: uy, len: a1 - a0, wid: b1 - b0 };
    }

    /* A book lying shut, a pencil and a record player's tone arm: each the
       block's own outline, with the rail round it, drawn as the thing. */
    function deskProp(g, pts, w, v, look, seed) {
        var ax = axisOf(pts), L = ax.len + w, Wd = ax.wid + w;
        var COVERS = ['#7f2a2a', '#1f4e79', '#2f5d3a', '#6b4a8a', '#8a5a1f', '#0f5e63'];
        var cover = COVERS[(hash(seed) * COVERS.length) | 0];
        var m = look === 'book' ? { top: cover, side: '#efe4c8', hi: 'rgba(255, 235, 215, 0.3)', grain: 'rgba(0,0,0,0.2)' }
              : look === 'pencil' ? { top: '#f4c430', side: '#a87d12', hi: 'rgba(255, 250, 210, 0.45)', grain: 'rgba(0,0,0,0.2)' }
              : { top: '#3a3f47', side: '#1c1f24', hi: 'rgba(255, 255, 255, 0.35)', grain: 'rgba(0,0,0,0.2)' };
        solid(g, pts, w, m, v, EXT, m.top);
        g.save();
        g.translate(ax.cx, ax.cy);
        g.rotate(Math.atan2(ax.uy, ax.ux));
        var hl = L / 2, hw = Wd / 2, i;
        if (look === 'book') {
            // Cloth: a fine weave across the cover.
            g.save();
            g.beginPath(); g.rect(-hl + 1, -hw + 1, L - 2, Wd - 2); g.clip();
            g.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            g.lineWidth = 1;
            for (i = -hl; i < hl + Wd; i += 3) { g.beginPath(); g.moveTo(i, -hw); g.lineTo(i - Wd, hw); g.stroke(); }
            // Lit towards the top of the cover, shaded towards the bottom.
            var cg = g.createLinearGradient(0, -hw, 0, hw);
            cg.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
            cg.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
            g.fillStyle = cg;
            g.fillRect(-hl, -hw, L, Wd);
            g.restore();
            // The spine along the top edge, rounded, with raised bands.
            var sg = g.createLinearGradient(0, -hw, 0, -hw + 14);
            sg.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
            sg.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
            sg.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
            g.fillStyle = sg;
            g.fillRect(-hl + 1, -hw + 1, L - 2, 13);
            g.fillStyle = 'rgba(250, 215, 120, 0.55)';
            for (i = 0; i < 4; i++) g.fillRect(-hl + L * (0.18 + i * 0.21), -hw + 2, 3, 11);
            // A gold frame, a label with the title on it, and gold corners.
            g.strokeStyle = 'rgba(250, 215, 120, 0.55)';
            g.lineWidth = 1.2;
            g.strokeRect(-hl + 8, -hw + 19, L - 16, Wd - 26);
            var lw = Math.min(L * 0.42, 110), lh2 = Math.min(Wd * 0.22, 22);
            g.fillStyle = '#efe4c8';
            g.fillRect(-lw / 2, 4 - lh2 / 2, lw, lh2);
            g.strokeStyle = 'rgba(120, 90, 40, 0.6)';
            g.lineWidth = 0.8;
            g.strokeRect(-lw / 2 + 2, 4 - lh2 / 2 + 2, lw - 4, lh2 - 4);
            g.fillStyle = 'rgba(60, 40, 20, 0.7)';
            g.fillRect(-lw * 0.32, 4 - 1.5, lw * 0.64, 2);
            g.fillStyle = 'rgba(250, 215, 120, 0.85)';
            [[-hl + 1, hw - 1, 1, -1], [hl - 1, hw - 1, -1, -1], [hl - 1, -hw + 14, -1, 1]].forEach(function (c) {
                g.beginPath(); g.moveTo(c[0], c[1]); g.lineTo(c[0] + c[2] * 10, c[1]); g.lineTo(c[0], c[1] + c[3] * 10); g.closePath(); g.fill();
            });
            // A ribbon bookmark out of the bottom edge.
            var rx = -hl + L * (0.3 + hash(seed + 2) * 0.4);
            g.fillStyle = ['#b91c1c', '#facc15', '#1d4ed8'][(hash(seed + 4) * 3) | 0];
            g.beginPath();
            g.moveTo(rx - 3, hw - 2); g.lineTo(rx + 3, hw - 2); g.lineTo(rx + 3, hw + 12); g.lineTo(rx, hw + 9); g.lineTo(rx - 3, hw + 12);
            g.closePath(); g.fill();
        } else if (look === 'pencil') {
            // Facets down the length, the lit one paler, a sharpened end and
            // an eraser in its ferrule.
            g.fillStyle = 'rgba(255, 245, 190, 0.45)';
            g.fillRect(-hl + 26, -hw * 0.33, L - 48, hw * 0.4);
            g.strokeStyle = 'rgba(120, 80, 0, 0.35)';
            g.lineWidth = 1;
            g.beginPath(); g.moveTo(-hl + 26, -hw * 0.33); g.lineTo(hl - 22, -hw * 0.33);
            g.moveTo(-hl + 26, hw * 0.33); g.lineTo(hl - 22, hw * 0.33); g.stroke();
            g.fillStyle = 'rgba(40, 20, 0, 0.55)';
            g.fillRect(-hl + 40, -1, 26, 2);
            g.fillStyle = '#e8c49a';
            g.beginPath(); g.moveTo(hl - 22, -hw); g.lineTo(hl + 2, 0); g.lineTo(hl - 22, hw); g.closePath(); g.fill();
            g.fillStyle = '#374151';
            g.beginPath(); g.moveTo(hl - 6, -hw * 0.3); g.lineTo(hl + 2, 0); g.lineTo(hl - 6, hw * 0.3); g.closePath(); g.fill();
            g.fillStyle = '#b8bec8'; g.fillRect(-hl + 14, -hw, 12, Wd);
            g.fillStyle = 'rgba(0, 0, 0, 0.2)';
            for (i = 0; i < 3; i++) g.fillRect(-hl + 16 + i * 4, -hw, 1, Wd);
            g.fillStyle = '#f9a8b4'; g.fillRect(-hl, -hw, 14, Wd);
            g.fillStyle = 'rgba(255, 255, 255, 0.35)'; g.fillRect(-hl + 2, -hw + 2, 10, hw * 0.5);
        } else {
            /* The arm lying in its rest on a brushed plinth: the pivot and
               its counterweight at one end, a chrome tube with a crank near
               the head, and the headshell with its finger lift. */
            g.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            g.lineWidth = 1;
            for (i = -hw + 3; i < hw; i += 2.5) { g.beginPath(); g.moveTo(-hl + 3, i); g.lineTo(hl - 3, i); g.stroke(); }
            var px = -hl + Math.max(hw * 1.2, 16), pr = Math.max(hw * 0.95, 11);
            g.fillStyle = '#111317';
            g.beginPath(); g.arc(px, 0, pr, 0, TAU); g.fill();
            var pg = g.createRadialGradient(px - pr * 0.3, -pr * 0.3, 1, px, 0, pr * 0.7);
            pg.addColorStop(0, '#f1f5f9'); pg.addColorStop(1, '#64748b');
            g.fillStyle = pg;
            g.beginPath(); g.arc(px, 0, pr * 0.62, 0, TAU); g.fill();
            // Counterweight behind the pivot.
            var cw = Math.max(hw * 0.75, 9);
            g.fillStyle = '#1f2937';
            g.fillRect(-hl + 2, -cw / 2, px - (-hl + 2) - pr * 0.4, cw);
            g.fillStyle = 'rgba(255, 255, 255, 0.18)';
            g.fillRect(-hl + 2, -cw / 2, px - (-hl + 2) - pr * 0.4, cw * 0.3);
            // The tube, cranked near the head.
            var hx = hl - 26, kx = hx - Math.min(40, L * 0.18), tube = Math.max(3, hw * 0.28);
            g.lineCap = 'round';
            g.strokeStyle = '#94a3b8';
            g.lineWidth = tube;
            g.beginPath(); g.moveTo(px, 0); g.lineTo(kx, 0); g.lineTo(hx, -hw * 0.35); g.stroke();
            g.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            g.lineWidth = tube * 0.35;
            g.beginPath(); g.moveTo(px + pr * 0.6, -tube * 0.25); g.lineTo(kx, -tube * 0.25); g.lineTo(hx, -hw * 0.35 - tube * 0.25); g.stroke();
            // Headshell, cartridge and finger lift.
            g.save();
            g.translate(hx, -hw * 0.35);
            g.rotate(-0.25);
            g.fillStyle = '#111827';
            g.fillRect(-2, -hw * 0.5, 24, hw);
            g.fillStyle = '#b91c1c';
            g.fillRect(6, -hw * 0.3, 10, hw * 0.6);
            g.strokeStyle = '#cbd5e1';
            g.lineWidth = 1.5;
            g.beginPath(); g.moveTo(14, -hw * 0.5); g.quadraticCurveTo(18, -hw * 0.95, 24, -hw * 0.85); g.stroke();
            g.restore();
            g.lineCap = 'butt';
        }
        g.restore();
    }

    /* A mug of coffee, an ink pot and a planet: round, the block's disc
       and its rail. */
    function roundProp(g, p, w, v, look, seed) {
        var r0 = p.r + w / 2, sh = sv(v, Math.min(7, r0 * 0.2), Math.min(10, r0 * 0.3)), lt = sv(v, -0.35, -0.4), gr, k;
        g.save();
        g.fillStyle = 'rgba(0, 0, 0, 0.28)';
        g.beginPath(); g.arc(p.x + sh.x, p.y + sh.y, r0, 0, TAU); g.fill();
        if (look === 'mug') {
            var glaze = ['#f1f5f9', '#fca5a5', '#93c5fd', '#fde68a'][(hash(seed) * 4) | 0];
            var hd = sv(v, 1, 0.2), hx = p.x + hd.x * r0 * 0.95, hy = p.y + hd.y * r0 * 0.95;
            g.strokeStyle = glaze; g.lineWidth = Math.max(4, r0 * 0.16);
            g.beginPath(); g.arc(hx, hy, r0 * 0.32, 0, TAU); g.stroke();
            gr = g.createRadialGradient(p.x + lt.x * r0, p.y + lt.y * r0, r0 * 0.1, p.x, p.y, r0);
            gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, glaze);
            g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, r0, 0, TAU); g.fill();
            g.fillStyle = '#3b2312'; g.beginPath(); g.arc(p.x, p.y, r0 * 0.8, 0, TAU); g.fill();
            g.strokeStyle = 'rgba(214, 160, 100, 0.55)'; g.lineWidth = 2;
            g.beginPath(); g.arc(p.x, p.y, r0 * 0.66, 0.4, 5.2); g.stroke();
            g.fillStyle = 'rgba(255, 255, 255, 0.22)';
            g.beginPath(); g.ellipse(p.x + lt.x * r0 * 0.35, p.y + lt.y * r0 * 0.35, r0 * 0.28, r0 * 0.12, -0.7, 0, TAU); g.fill();
            // A wisp of steam.
            var up = sv(v, 0.3, -1);
            g.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            g.lineWidth = 2.2; g.lineCap = 'round';
            g.beginPath();
            g.moveTo(p.x, p.y);
            g.bezierCurveTo(p.x + up.x * r0 * 0.5 + 6, p.y + up.y * r0 * 0.5, p.x + up.x * r0 - 6, p.y + up.y * r0, p.x + up.x * r0 * 1.5, p.y + up.y * r0 * 1.5);
            g.stroke();
        } else if (look === 'inkpot') {
            /* A glass ink pot, the ink glossy inside it and a drip down its
               near side, and a quill standing in it. */
            gr = g.createRadialGradient(p.x + lt.x * r0, p.y + lt.y * r0, r0 * 0.1, p.x, p.y, r0);
            gr.addColorStop(0, 'rgba(235, 245, 255, 0.98)'); gr.addColorStop(0.7, 'rgba(160, 185, 210, 0.95)'); gr.addColorStop(1, 'rgba(90, 115, 145, 0.95)');
            g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, r0, 0, TAU); g.fill();
            g.strokeStyle = 'rgba(255, 255, 255, 0.6)'; g.lineWidth = 1.5;
            g.beginPath(); g.arc(p.x, p.y, r0 * 0.92, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
            g.fillStyle = '#1e293b'; g.beginPath(); g.arc(p.x, p.y, r0 * 0.7, 0, TAU); g.fill();
            var ig = g.createRadialGradient(p.x + lt.x * r0 * 0.4, p.y + lt.y * r0 * 0.4, 1, p.x, p.y, r0 * 0.6);
            ig.addColorStop(0, '#3b4ba8'); ig.addColorStop(1, '#0b1033');
            g.fillStyle = ig; g.beginPath(); g.arc(p.x, p.y, r0 * 0.58, 0, TAU); g.fill();
            g.fillStyle = 'rgba(255, 255, 255, 0.45)';
            g.beginPath(); g.ellipse(p.x + lt.x * r0 * 0.3, p.y + lt.y * r0 * 0.3, r0 * 0.2, r0 * 0.07, -0.7, 0, TAU); g.fill();
            var dd = sv(v, 0.25, 1);
            g.fillStyle = 'rgba(15, 23, 70, 0.9)';
            g.beginPath();
            g.moveTo(p.x + dd.x * r0 * 0.55 - 3, p.y + dd.y * r0 * 0.55);
            g.lineTo(p.x + dd.x * r0 * 0.55 + 3, p.y + dd.y * r0 * 0.55);
            g.lineTo(p.x + dd.x * r0 * 1.02, p.y + dd.y * r0 * 1.02);
            g.closePath(); g.fill();
            g.beginPath(); g.arc(p.x + dd.x * r0 * 1.02, p.y + dd.y * r0 * 1.02, 2.4, 0, TAU); g.fill();
            // The quill: shaft out of the ink, leaning up and right, and its vane.
            var qd = sv(v, 0.55, -1), ql = Math.hypot(qd.x, qd.y); qd = { x: qd.x / ql, y: qd.y / ql };
            var qn = { x: -qd.y, y: qd.x }, Lq = r0 * 2.1, q0 = { x: p.x + qd.x * r0 * 0.1, y: p.y + qd.y * r0 * 0.1 };
            g.lineCap = 'round';
            g.strokeStyle = '#e7e0cf'; g.lineWidth = 1.6;
            g.beginPath(); g.moveTo(q0.x, q0.y); g.lineTo(q0.x + qd.x * Lq, q0.y + qd.y * Lq); g.stroke();
            g.fillStyle = '#f8f5ec';
            g.beginPath();
            g.moveTo(q0.x + qd.x * Lq * 0.3, q0.y + qd.y * Lq * 0.3);
            g.quadraticCurveTo(q0.x + qd.x * Lq * 0.6 + qn.x * r0 * 0.5, q0.y + qd.y * Lq * 0.6 + qn.y * r0 * 0.5, q0.x + qd.x * Lq * 1.05, q0.y + qd.y * Lq * 1.05);
            g.quadraticCurveTo(q0.x + qd.x * Lq * 0.65 - qn.x * r0 * 0.3, q0.y + qd.y * Lq * 0.65 - qn.y * r0 * 0.3, q0.x + qd.x * Lq * 0.3, q0.y + qd.y * Lq * 0.3);
            g.fill();
            g.strokeStyle = 'rgba(120, 110, 95, 0.45)'; g.lineWidth = 0.7;
            for (k = 0; k < 7; k++) {
                var t = 0.38 + k * 0.09, bx = q0.x + qd.x * Lq * t, by = q0.y + qd.y * Lq * t;
                g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + qn.x * r0 * 0.3 + qd.x * 4, by + qn.y * r0 * 0.3 + qd.y * 4); g.stroke();
            }
            g.lineCap = 'butt';
        } else {
            /* A planet: banded, lit from one side, with a thin bright rim of
               atmosphere — and on most, a ring that passes behind it and in
               front of it, as a ring does. */
            var hue = Math.floor(hash(seed) * 360), ringed = hash(seed + 3) < 0.6, tilt = -0.4 + (hash(seed + 5) - 0.5) * 0.3;
            function ring(from, to) {
                g.lineWidth = Math.max(3, r0 * 0.12);
                g.strokeStyle = 'rgba(230, 220, 200, 0.75)';
                g.beginPath(); g.ellipse(p.x, p.y, r0 * 1.05, r0 * 0.32, tilt, from, to); g.stroke();
                g.lineWidth = Math.max(1.5, r0 * 0.05);
                g.strokeStyle = 'rgba(180, 160, 130, 0.6)';
                g.beginPath(); g.ellipse(p.x, p.y, r0 * 0.9, r0 * 0.26, tilt, from, to); g.stroke();
            }
            if (ringed) ring(Math.PI, TAU);
            g.save();
            g.beginPath(); g.arc(p.x, p.y, r0 * 0.8, 0, TAU); g.clip();
            g.fillStyle = 'hsl(' + hue + ', 55%, 52%)';
            g.fillRect(p.x - r0, p.y - r0, r0 * 2, r0 * 2);
            for (k = -3; k <= 3; k++) {
                g.fillStyle = k % 2 ? 'hsla(' + (hue + 20) + ', 60%, 40%, 0.55)' : 'hsla(' + (hue - 15) + ', 50%, 70%, 0.35)';
                g.beginPath();
                g.ellipse(p.x, p.y + k * r0 * 0.24, r0 * 1.1, r0 * 0.07 + hash(seed + k) * r0 * 0.04, 0, 0, TAU);
                g.fill();
            }
            if (hash(seed + 7) < 0.5) {
                g.fillStyle = 'hsla(' + (hue + 180) + ', 45%, 60%, 0.55)';
                g.beginPath(); g.ellipse(p.x + r0 * 0.25, p.y + r0 * 0.2, r0 * 0.16, r0 * 0.09, 0, 0, TAU); g.fill();
            }
            gr = g.createRadialGradient(p.x + lt.x * r0, p.y + lt.y * r0, r0 * 0.1, p.x, p.y, r0 * 0.8);
            gr.addColorStop(0, 'rgba(255, 255, 255, 0.25)'); gr.addColorStop(1, 'rgba(0, 0, 20, 0.6)');
            g.fillStyle = gr; g.fillRect(p.x - r0, p.y - r0, r0 * 2, r0 * 2);
            g.restore();
            g.strokeStyle = 'hsla(' + hue + ', 80%, 85%, 0.45)';
            g.lineWidth = 1.5;
            g.beginPath(); g.arc(p.x, p.y, r0 * 0.8, Math.PI * 0.9, Math.PI * 1.75); g.stroke();
            if (ringed) ring(0, Math.PI);
        }
        g.restore();
    }

    /* A hut seen from above and a little in front: a pitched roof with
       its ridge across the view, the upper plane catching the light, and
       under the near eave the front wall with its door and a window. What
       kind of hut is the place's — a striped beach hut by the sea, a
       fishing hut with snow on its roof, icicles and a stovepipe on the
       ice, a slate-roofed shed, and on a big plot a red barn. */
    function shack(g, p, v, theme, seed) {
        var s = Math.min(p.r * 1.3, 130);
        if (s < 14) return;
        var snow = theme.id === 'winter' || theme.id === 'alpine';
        var kind = snow ? 'fishing' : theme.id === 'seaside' ? 'beach' : s > 100 ? 'barn' : 'shed';
        var paint = ['#e11d48', '#2563eb', '#16a34a', '#f59e0b', '#0ea5e9'][(hash(seed) * 5) | 0];
        var half = s / 2, wallH = Math.max(9, s * 0.2), eave = Math.max(2.5, s * 0.06), ridge = -wallH - s * 0.04;
        var wall = kind === 'beach' ? paint : kind === 'fishing' ? '#9a3412' : kind === 'barn' ? '#b91c1c' : '#8b5a2b';
        var roofHi = kind === 'fishing' ? '#ffffff' : kind === 'beach' ? mixHex(paint, '#ffffff', 0.2) : kind === 'barn' ? '#8b929c' : '#6b7480';
        var roofLo = kind === 'fishing' ? '#d6e0ea' : kind === 'beach' ? mixHex(paint, '#000000', 0.22) : kind === 'barn' ? '#5d636c' : '#4b535d';
        function Q(a, b) { var o = sv(v, a, b); return { x: p.x + o.x, y: p.y + o.y }; }
        function poly(list, fill) {
            g.beginPath();
            list.forEach(function (q) { var o = Q(q[0], q[1]); g.lineTo(o.x, o.y); });
            g.closePath();
            if (fill) { g.fillStyle = fill; g.fill(); }
        }
        function line(a0, b0, a1, b1) { var o = Q(a0, b0), e = Q(a1, b1); g.moveTo(o.x, o.y); g.lineTo(e.x, e.y); }
        g.save();
        g.lineJoin = 'round';
        // Its shadow on the deck.
        poly([[-half + 5, -half - wallH + 9], [half + 9, -half - wallH + 9], [half + 9, half + 8], [-half + 5, half + 8]], 'rgba(0, 0, 0, 0.26)');
        // The front wall under the near eave.
        var fy0 = half - wallH, fy1 = half;
        poly([[-half, fy0], [half, fy0], [half, fy1], [-half, fy1]], wall);
        g.save();
        poly([[-half, fy0], [half, fy0], [half, fy1], [-half, fy1]]);
        g.clip();
        g.lineWidth = 1;
        if (kind === 'beach') {
            // Painted boards, every other one white.
            for (var bx = -half, n = 0; bx < half; bx += s / 9, n++) {
                if (n % 2) poly([[bx, fy0], [bx + s / 9, fy0], [bx + s / 9, fy1], [bx, fy1]], 'rgba(255, 255, 255, 0.85)');
            }
        } else {
            // Boards, as lines along the wall.
            g.strokeStyle = 'rgba(0, 0, 0, 0.22)';
            g.beginPath();
            for (var by = fy0 + 3; by < fy1; by += 3.2) line(-half, by, half, by);
            g.stroke();
        }
        // Shade from the eave.
        poly([[-half, fy0], [half, fy0], [half, fy0 + 3], [-half, fy0 + 3]], 'rgba(0, 0, 0, 0.25)');
        g.restore();
        // The door, and a window beside it.
        var dw = Math.max(5, s * (kind === 'barn' ? 0.34 : 0.2)), dh = wallH * 0.82;
        poly([[-dw / 2, fy1 - dh], [dw / 2, fy1 - dh], [dw / 2, fy1], [-dw / 2, fy1]], kind === 'barn' ? '#7f1d1d' : 'rgba(45, 28, 18, 0.92)');
        g.strokeStyle = kind === 'barn' ? '#f8fafc' : 'rgba(255, 255, 255, 0.35)';
        g.lineWidth = kind === 'barn' ? 1.6 : 0.8;
        g.beginPath();
        if (kind === 'barn') {
            line(-dw / 2, fy1 - dh, dw / 2, fy1); line(dw / 2, fy1 - dh, -dw / 2, fy1); line(0, fy1 - dh, 0, fy1);
        } else {
            line(-dw / 2, fy1 - dh, dw / 2, fy1 - dh); line(-dw / 2, fy1 - dh, -dw / 2, fy1); line(dw / 2, fy1 - dh, dw / 2, fy1);
        }
        g.stroke();
        if (s > 34 && kind !== 'barn') {
            var wx = half * 0.55, ww = Math.max(4, s * 0.12), wh = wallH * 0.4;
            poly([[wx - ww / 2, fy0 + wallH * 0.25], [wx + ww / 2, fy0 + wallH * 0.25], [wx + ww / 2, fy0 + wallH * 0.25 + wh], [wx - ww / 2, fy0 + wallH * 0.25 + wh]],
                kind === 'fishing' ? '#fde68a' : '#bfdbfe');
            g.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            g.lineWidth = 0.8;
            g.beginPath(); line(wx, fy0 + wallH * 0.25, wx, fy0 + wallH * 0.25 + wh); g.stroke();
        }
        // The roof: the far plane up to the ridge, lit; the near plane down
        // to the eave, in shade; and the ridge cap along the top.
        var top = -half - wallH - eave, low = half - wallH + eave * 0.6;
        poly([[-half - eave, top], [half + eave, top], [half + eave, ridge], [-half - eave, ridge]], roofHi);
        poly([[-half - eave, ridge], [half + eave, ridge], [half + eave, low], [-half - eave, low]], roofLo);
        g.save();
        poly([[-half - eave, top], [half + eave, top], [half + eave, low], [-half - eave, low]]);
        g.clip();
        g.lineWidth = 1;
        if (kind === 'barn') {
            // Corrugated: ribs running down from the ridge.
            g.strokeStyle = 'rgba(20, 20, 25, 0.28)';
            g.beginPath();
            for (var cx = -half; cx < half + eave; cx += 5) { line(cx, top, cx, low); }
            g.stroke();
        } else if (kind === 'shed') {
            // Slates: rows parallel to the ridge, each row's joints offset.
            g.strokeStyle = 'rgba(0, 0, 0, 0.28)';
            g.beginPath();
            var row = 0;
            for (var ry = top + 4; ry < low; ry += 4, row++) {
                line(-half - eave, ry, half + eave, ry);
                for (var rx = -half - eave + (row % 2) * 3; rx < half + eave; rx += 6) line(rx, ry - 4, rx, ry);
            }
            g.stroke();
        } else if (kind === 'beach') {
            g.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            g.beginPath();
            for (var bx2 = -half; bx2 < half + eave; bx2 += 4.5) line(bx2, top, bx2, low);
            g.stroke();
        } else {
            // Snow, drifted deeper at the ridge, blue in its hollows.
            g.fillStyle = 'rgba(148, 178, 210, 0.25)';
            for (var k = 0; k < 5; k++) {
                var o = Q(-half + hash(seed + k) * s, ridge + 3 + hash(seed + k * 3) * (low - ridge - 5));
                g.beginPath(); g.ellipse(o.x, o.y, s * 0.12, 2.2, 0, 0, TAU); g.fill();
            }
        }
        g.restore();
        g.strokeStyle = kind === 'beach' ? '#ffffff' : 'rgba(0, 0, 0, 0.3)';
        g.lineWidth = kind === 'beach' ? 2.4 : 1.6;
        g.beginPath(); line(-half - eave, ridge, half + eave, ridge); g.stroke();
        g.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        g.lineWidth = 1;
        g.beginPath(); poly([[-half - eave, top], [half + eave, top], [half + eave, low], [-half - eave, low]]); g.stroke();
        if (kind === 'fishing') {
            // Icicles along the near eave.
            g.fillStyle = 'rgba(226, 240, 252, 0.95)';
            for (var ix = -half; ix < half; ix += 4 + hash(seed + ix) * 3) {
                var len = 2 + hash(seed + ix * 1.7) * 4;
                poly([[ix, low], [ix + 2, low], [ix + 1, low + len]], 'rgba(226, 240, 252, 0.95)');
            }
        }
        if (kind === 'fishing' || (kind === 'shed' && s > 40)) {
            // A stovepipe through the far plane, and its smoke.
            var pipe = Q(half * 0.45, top + (ridge - top) * 0.45);
            var pr = Math.max(2.4, s * 0.05);
            g.fillStyle = '#334155';
            g.beginPath(); g.ellipse(pipe.x, pipe.y, pr, pr * 0.8, 0, 0, TAU); g.fill();
            g.fillStyle = '#0f172a';
            g.beginPath(); g.ellipse(pipe.x, pipe.y - 0.5, pr * 0.6, pr * 0.45, 0, 0, TAU); g.fill();
            var up = sv(v, 0.6, -1);
            for (k = 0; k < 3; k++) {
                g.fillStyle = 'rgba(226, 232, 240, ' + (0.45 - k * 0.12) + ')';
                g.beginPath();
                g.arc(pipe.x + up.x * (5 + k * 6), pipe.y + up.y * (5 + k * 6), 2.6 + k * 1.6, 0, TAU);
                g.fill();
            }
        }
        g.restore();
    }

    function pyramid(g, pts, v) {
        var p = pole(pts), ld = sv(v, -1, -1), ln = Math.hypot(ld.x, ld.y);
        g.save();
        trace(g, pts, 0, 0);
        g.clip();
        for (var i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
            var ax = pts[j], ay = pts[j + 1], bx = pts[i], by = pts[i + 1];
            // A face's outward normal, and how squarely it meets the light.
            var nx = by - ay, ny = -(bx - ax), nn = Math.hypot(nx, ny) || 1;
            var lit = (nx * ld.x + ny * ld.y) / nn / ln;
            var sign = polyArea(pts) > 0 ? 1 : -1;
            lit *= sign;
            g.fillStyle = lit > 0 ? 'rgba(255, 245, 220, ' + (0.35 * lit).toFixed(3) + ')' : 'rgba(60, 30, 10, ' + (-0.4 * lit).toFixed(3) + ')';
            g.beginPath();
            g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo(p.x, p.y);
            g.closePath();
            g.fill();
            // Courses of stone, as steps parallel to the face's foot.
            g.strokeStyle = 'rgba(110, 65, 25, 0.35)';
            g.lineWidth = 1;
            g.beginPath();
            for (var k = 1; k < 8; k++) {
                var f = k / 8;
                g.moveTo(ax + (p.x - ax) * f, ay + (p.y - ay) * f);
                g.lineTo(bx + (p.x - bx) * f, by + (p.y - by) * f);
            }
            g.stroke();
            g.strokeStyle = 'rgba(80, 45, 15, 0.45)';
            g.beginPath();
            g.moveTo(ax, ay); g.lineTo(p.x, p.y);
            g.stroke();
        }
        g.fillStyle = '#f5deb3';
        g.beginPath();
        g.arc(p.x, p.y, 3, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }

    /* A big top seen from above: a cone of red and white stripes from a
       king pole, its skirt scalloped, a pennant at the top. */
    function bigTop(g, p, v, seed) {
        var R = Math.min(p.r - 2, 70);
        if (R < 14) return;
        var sh = sv(v, 8, 12);
        g.save();
        g.fillStyle = 'rgba(0, 0, 0, 0.3)';
        g.beginPath();
        g.arc(p.x + sh.x, p.y + sh.y, R, 0, Math.PI * 2);
        g.fill();
        var n = 12;
        for (var i = 0; i < n; i++) {
            var a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
            g.fillStyle = i % 2 ? '#f8fafc' : '#dc2626';
            g.beginPath();
            g.moveTo(p.x, p.y);
            g.arc(p.x, p.y, R, a0, a1);
            g.closePath();
            g.fill();
        }
        // Scallops round the skirt.
        for (i = 0; i < n * 2; i++) {
            var a = (i + 0.5) / (n * 2) * Math.PI * 2;
            g.fillStyle = i % 2 ? '#fbbf24' : '#b91c1c';
            g.beginPath();
            g.arc(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R, R * 0.09, 0, Math.PI * 2);
            g.fill();
        }
        // Lit from the top left: the cone's near side darker.
        var l = sv(v, -R * 0.4, -R * 0.4);
        var grad = g.createRadialGradient(p.x + l.x, p.y + l.y, R * 0.1, p.x, p.y, R);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.30)');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(p.x, p.y, R, 0, Math.PI * 2);
        g.fill();
        var up = sv(v, 0, -1), side = sv(v, 1, 0);
        g.strokeStyle = '#6b4a2a';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(p.x, p.y);
        g.lineTo(p.x + up.x * 16, p.y + up.y * 16);
        g.stroke();
        g.fillStyle = hash(seed) < 0.5 ? '#22d3ee' : '#fbbf24';
        g.beginPath();
        g.moveTo(p.x + up.x * 16, p.y + up.y * 16);
        g.lineTo(p.x + up.x * 12 + side.x * 12, p.y + up.y * 12 + side.y * 12);
        g.lineTo(p.x + up.x * 8, p.y + up.y * 8);
        g.closePath();
        g.fill();
        g.restore();
    }

    /* A carousel's canopy, turning: coloured panels round a gilt crown,
       and the horses' poles showing at its rim. Live, on the screen's clock. */
    function carousel(g, b, clock) {
        var p = pole(b.pts), R = Math.min(p.r - 2, 66);
        if (R < 14) return;
        var turn = clock * 0.6, n = 10, cols = ['#e11d48', '#fbbf24', '#2563eb', '#f8fafc', '#16a34a'];
        g.save();
        for (var i = 0; i < n; i++) {
            var a0 = turn + i / n * Math.PI * 2, a1 = turn + (i + 1) / n * Math.PI * 2;
            g.fillStyle = cols[i % cols.length];
            g.beginPath();
            g.moveTo(p.x, p.y);
            g.arc(p.x, p.y, R, a0, a1);
            g.closePath();
            g.fill();
            // A pole and a horse's head showing at the rim.
            var am = (a0 + a1) / 2;
            g.fillStyle = '#fde68a';
            g.beginPath();
            g.arc(p.x + Math.cos(am) * R * 0.86, p.y + Math.sin(am) * R * 0.86, R * 0.05, 0, Math.PI * 2);
            g.fill();
        }
        g.strokeStyle = 'rgba(60, 20, 40, 0.5)';
        g.lineWidth = 1;
        g.beginPath();
        g.arc(p.x, p.y, R, 0, Math.PI * 2);
        g.stroke();
        g.fillStyle = '#fbbf24';
        g.beginPath();
        g.arc(p.x, p.y, R * 0.22, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#b45309';
        g.beginPath();
        g.arc(p.x, p.y, R * 0.1, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }

    /* A big wheel: its stand is painted with the platform, and the wheel
       itself — a rim, spokes and swinging gondolas — turns live over the
       ball like a windmill's sails, going thin when the ball is under it. */
    function wheelOf(p) { var r = Math.min(p.r - 4, 40); return { x: p.x, y: p.y, r: r, len: r * 2.4 }; }

    function wheelStand(g, p, v) {
        var t = wheelOf(p);
        if (t.r < 10) return;
        g.save();
        g.strokeStyle = '#94a3b8';
        g.lineWidth = 5;
        g.lineCap = 'round';
        var foot = sv(v, 0, t.r * 0.9), side = sv(v, t.r * 0.7, 0);
        g.beginPath();
        g.moveTo(t.x, t.y); g.lineTo(t.x + foot.x + side.x, t.y + foot.y + side.y);
        g.moveTo(t.x, t.y); g.lineTo(t.x + foot.x - side.x, t.y + foot.y - side.y);
        g.stroke();
        g.restore();
    }

    function bigWheel(g, b, v, clock, ball) {
        var t = wheelOf(pole(b.pts));
        if (t.r < 10) return;
        var R = t.len, near = ball ? Math.hypot(ball.x - t.x, ball.y - t.y) - R : 999;
        var turn = clock * 0.25, n = 10, cols = ['#f43f5e', '#fbbf24', '#22d3ee', '#a3e635', '#c084fc'];
        g.save();
        g.globalAlpha = near < 0 ? 0.32 : near < 50 ? 0.32 + near / 50 * 0.6 : 0.92;
        g.strokeStyle = '#cbd5e1';
        g.lineWidth = 3;
        g.beginPath();
        g.arc(t.x, t.y, R, 0, Math.PI * 2);
        g.moveTo(t.x + R * 0.82, t.y);
        g.arc(t.x, t.y, R * 0.82, 0, Math.PI * 2);
        g.stroke();
        g.lineWidth = 1.4;
        g.beginPath();
        for (var i = 0; i < n; i++) {
            var a = turn + i / n * Math.PI * 2;
            g.moveTo(t.x, t.y);
            g.lineTo(t.x + Math.cos(a) * R, t.y + Math.sin(a) * R);
        }
        g.stroke();
        // Lights on the rim, and a gondola hanging from each spoke's end.
        var down = sv(v, 0, 1);
        for (i = 0; i < n; i++) {
            a = turn + i / n * Math.PI * 2;
            var gx = t.x + Math.cos(a) * R, gy = t.y + Math.sin(a) * R;
            g.fillStyle = cols[i % cols.length];
            g.beginPath();
            g.ellipse(gx + down.x * 7, gy + down.y * 7, 7, 6, 0, 0, Math.PI * 2);
            g.fill();
            g.fillStyle = '#fef3c7';
            g.beginPath();
            g.arc(t.x + Math.cos(a + Math.PI / n) * R, t.y + Math.sin(a + Math.PI / n) * R, 2, 0, Math.PI * 2);
            g.fill();
        }
        g.fillStyle = '#e2e8f0';
        g.beginPath();
        g.arc(t.x, t.y, 6, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }

    /* The windmill: a whitewashed tower with its door to the viewer, a
       thatched cap, and — drawn live, over the ball — four sails turning.
       Its height hangs towards the viewer like every wall's near face. */
    function towerOf(p) { return { x: p.x, y: p.y, r: Math.min(p.r - 4, 44), tall: Math.min(p.r - 4, 44) * 0.75 }; }

    function tower(g, p, v) {
        var t = towerOf(p), k;
        if (t.r < 10) return;
        var sh = sv(v, 10, 14);
        g.save();
        g.fillStyle = 'rgba(0, 0, 0, 0.25)';
        g.beginPath();
        g.ellipse(t.x + sh.x + v.dx * t.tall * 0.5, t.y + sh.y + v.dy * t.tall * 0.5, t.r * 1.05, t.r * 1.05, 0, 0, Math.PI * 2);
        g.fill();
        // The body: the cap's circle swept down to the ground.
        for (k = t.tall; k > 0; k -= 1.5) {
            var f = k / t.tall;
            g.fillStyle = 'rgb(' + Math.round(196 + 30 * (1 - f)) + ',' + Math.round(186 + 28 * (1 - f)) + ',' + Math.round(168 + 24 * (1 - f)) + ')';
            g.beginPath();
            g.arc(t.x + v.dx * k, t.y + v.dy * k, t.r * 0.86, 0, Math.PI * 2);
            g.fill();
        }
        // A door at the foot of the near face and a window above it.
        var dr = sv(v, 0, t.tall + t.r * 0.86 - 7), win = sv(v, 0, t.tall * 0.45 + t.r * 0.86 - 6);
        g.fillStyle = '#4a2c16';
        GOLF.landscape.roundRect(g, t.x + dr.x - t.r * 0.2, t.y + dr.y - 9, t.r * 0.4, 13, 5);
        g.fill();
        g.fillStyle = '#2b3a4a';
        GOLF.landscape.roundRect(g, t.x + win.x - 4, t.y + win.y - 4, 8, 8, 1.5);
        g.fill();
        // The cap: thatch, lit from the top left.
        var l = sv(v, -t.r * 0.35, -t.r * 0.35);
        var grad = g.createRadialGradient(t.x + l.x, t.y + l.y, t.r * 0.1, t.x, t.y, t.r);
        grad.addColorStop(0, '#a77b45');
        grad.addColorStop(1, '#5a3d1e');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = 'rgba(50, 30, 10, 0.45)';
        g.lineWidth = 1;
        g.beginPath();
        for (k = 0; k < 24; k++) {
            var a = k / 24 * Math.PI * 2;
            g.moveTo(t.x + Math.cos(a) * t.r * 0.18, t.y + Math.sin(a) * t.r * 0.18);
            g.lineTo(t.x + Math.cos(a) * t.r * 0.98, t.y + Math.sin(a) * t.r * 0.98);
        }
        g.stroke();
        g.fillStyle = '#3b2611';
        g.beginPath();
        g.arc(t.x, t.y, t.r * 0.18, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }

    // How far the sails reach from the cap: never as far as the doorstep,
    // so a tunnel mouth at the door is never under one.
    function sailLength(t) { return t.r * 2.3; }

    // Everything a windmill's sails sweep: a disc round its cap.
    // Everything drawn over the ball from a block: a windmill's sails, a big
    // wheel. Nothing a hole is about may sit under it.
    function sailReach(b) {
        if (b.look === 'wheel') {
            var wl = wheelOf(pole(b.pts));
            return { x: wl.x, y: wl.y, r: wl.r < 10 ? 0 : wl.len + 10 };
        }
        var t = towerOf(pole(b.pts));
        return { x: t.x, y: t.y, r: t.r < 10 ? 0 : sailLength(t) };
    }

    // A point on a sail: `u` of the way out along its stock, `s` across.
    function sailPoint(ox, oy, ca, sa, len) {
        return function (u, s) { return { x: ox + ca * u * len - sa * s * len, y: oy + sa * u * len + ca * s * len }; };
    }

    function sails(g, b, v, clock, ball) {
        var t = towerOf(pole(b.pts));
        if (t.r < 10) return;
        var hx = t.x, hy = t.y, len = sailLength(t);
        var near = ball ? Math.hypot(ball.x - hx, ball.y - hy) - len : 999;
        g.save();
        g.globalAlpha = near < 0 ? 0.35 : near < 50 ? 0.35 + near / 50 * 0.55 : 0.9;
        var turn = clock * 0.9 + blockSeed(b);
        // The shadow the sails throw, then the sails.
        var sh = sv(v, 16, 24);
        for (var pass = 0; pass < 2; pass++) {
            for (var i = 0; i < 4; i++) {
                var a = turn + i * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
                var at = sailPoint(hx + (pass ? 0 : sh.x), hy + (pass ? 0 : sh.y), ca, sa, len);
                var p0 = at(0.22, 0), p1 = at(1, 0), q1 = at(1, 0.24), q0 = at(0.22, 0.2);
                if (!pass) {
                    g.fillStyle = 'rgba(0, 0, 0, 0.16)';
                    g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.lineTo(q1.x, q1.y); g.lineTo(q0.x, q0.y); g.fill();
                    continue;
                }
                g.fillStyle = 'rgba(246, 238, 220, 0.92)';
                g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.lineTo(q1.x, q1.y); g.lineTo(q0.x, q0.y); g.closePath(); g.fill();
                // The lattice the cloth is laced to.
                g.strokeStyle = 'rgba(92, 60, 30, 0.75)';
                g.lineWidth = 1;
                g.beginPath();
                for (var u = 0.3; u < 1; u += 0.1) {
                    var m0 = at(u, 0), m1 = at(u, 0.2 + (u - 0.22) * 0.05);
                    g.moveTo(m0.x, m0.y); g.lineTo(m1.x, m1.y);
                }
                var e0 = at(0.22, 0.1), e1 = at(1, 0.12);
                g.moveTo(e0.x, e0.y); g.lineTo(e1.x, e1.y);
                g.moveTo(q0.x, q0.y); g.lineTo(q1.x, q1.y);
                g.stroke();
                // The stock, the spar the sail hangs on.
                var s0 = at(0, 0);
                g.strokeStyle = '#5a3a1c';
                g.lineWidth = 3;
                g.beginPath(); g.moveTo(s0.x, s0.y); g.lineTo(p1.x, p1.y); g.stroke();
            }
        }
        g.fillStyle = '#3b2611';
        g.beginPath();
        g.arc(hx, hy, 5, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }

    /* ── the fan, and the wind it makes ─────────────────────────────────

       A wind is a slope whose pull is air rather than ground (`wind: true`).
       The ball meets exactly the same thing; what the player is shown is
       different, and that is the whole point of having two. A tilt in a
       top-down game is a convention you have to be told; a fan with streaks
       pouring out of it is not. */
    function fanRadius(p) { return Math.max(8, Math.min(p.r - 2, 40)); }

    // Which way a fan blows: down the nearest wind on the hole.
    function fanWind(b, course) {
        var p = pole(b.pts), best = null, bd = Infinity;
        (course.slopes || []).forEach(function (s) {
            if (!s.wind) return;
            var cx = Math.max(s.x, Math.min(p.x, s.x + s.w)), cy = Math.max(s.y, Math.min(p.y, s.y + s.h));
            var d = Math.hypot(cx - p.x, cy - p.y);
            if (d < bd) { bd = d; best = s; }
        });
        return best;
    }

    function rotor(g, b, course, clock) {
        var p = pole(b.pts), r = fanRadius(p), s = fanWind(b, course);
        var mag = s ? Math.hypot(s.ax, s.ay) : 120;
        var spin = clock * (6 + mag / 40) + blockSeed(b);
        g.save();
        g.beginPath();
        g.arc(p.x, p.y, r, 0, Math.PI * 2);
        g.clip();
        // A blur of where the blades have just been, then the blades.
        for (var pass = 0; pass < 2; pass++) {
            g.fillStyle = pass ? '#c6ced8' : 'rgba(198, 206, 216, 0.25)';
            for (var i = 0; i < 4; i++) {
                var a = spin + i * Math.PI / 2 - (pass ? 0 : 0.35);
                g.beginPath();
                g.moveTo(p.x, p.y);
                g.arc(p.x, p.y, r * 0.92, a, a + (pass ? 0.55 : 0.9));
                g.closePath();
                g.fill();
            }
        }
        g.restore();
        // The guard over it: rings and spokes.
        g.save();
        g.strokeStyle = 'rgba(225, 232, 240, 0.8)';
        g.lineWidth = 1.2;
        g.beginPath();
        for (var k = 1; k <= 3; k++) {
            g.moveTo(p.x + r * k / 3, p.y);
            g.arc(p.x, p.y, r * k / 3, 0, Math.PI * 2);
        }
        for (k = 0; k < 8; k++) {
            var sa = k * Math.PI / 4;
            g.moveTo(p.x, p.y);
            g.lineTo(p.x + Math.cos(sa) * r, p.y + Math.sin(sa) * r);
        }
        g.stroke();
        g.fillStyle = '#e5e7eb';
        g.beginPath();
        g.arc(p.x, p.y, Math.max(3, r * 0.14), 0, Math.PI * 2);
        g.fill();
        // Which way it blows: a chevron on the housing, downwind.
        if (s) {
            var u = Math.atan2(s.ay, s.ax), cr = r + (b.w || 20) * 0.1;
            var tipx = p.x + Math.cos(u) * (cr + 2), tipy = p.y + Math.sin(u) * (cr + 2);
            g.fillStyle = 'rgba(251, 191, 36, 0.95)';
            g.beginPath();
            g.moveTo(tipx + Math.cos(u) * 7, tipy + Math.sin(u) * 7);
            g.lineTo(tipx + Math.cos(u + 2.3) * 7, tipy + Math.sin(u + 2.3) * 7);
            g.lineTo(tipx + Math.cos(u - 2.3) * 7, tipy + Math.sin(u - 2.3) * 7);
            g.closePath();
            g.fill();
        }
        g.restore();
    }

    // The lane the wind blows down: a pale tint and its edges marked, still.
    function windLane(g, s) {
        var mag = Math.hypot(s.ax, s.ay);
        if (mag < 1) return;
        var ux = s.ax / mag, uy = s.ay / mag;
        g.save();
        GOLF.landscape.roundRect(g, s.x, s.y, s.w, s.h, 10);
        g.fillStyle = 'rgba(214, 236, 255, 0.16)';
        g.fill();
        g.clip();
        g.strokeStyle = 'rgba(230, 244, 255, 0.28)';
        g.lineWidth = 2;
        g.setLineDash([10, 12]);
        g.beginPath();
        if (Math.abs(ux) > Math.abs(uy)) {
            g.moveTo(s.x, s.y + 3); g.lineTo(s.x + s.w, s.y + 3);
            g.moveTo(s.x, s.y + s.h - 3); g.lineTo(s.x + s.w, s.y + s.h - 3);
        } else {
            g.moveTo(s.x + 3, s.y); g.lineTo(s.x + 3, s.y + s.h);
            g.moveTo(s.x + s.w - 3, s.y); g.lineTo(s.x + s.w - 3, s.y + s.h);
        }
        g.stroke();
        g.restore();
    }

    function streaks(g, s, clock) {
        var mag = Math.hypot(s.ax, s.ay);
        if (mag < 1) return;
        var ux = s.ax / mag, uy = s.ay / mag, px = -uy, py = ux;
        // Extent along the wind and across it.
        var along = Math.abs(ux) * s.w + Math.abs(uy) * s.h, across = Math.abs(px) * s.w + Math.abs(py) * s.h;
        var cx = s.x + s.w / 2, cy = s.y + s.h / 2;
        var n = Math.max(8, Math.min(60, Math.round(along * across / 4200)));
        var speed = 70 + mag * 0.55;
        g.save();
        g.beginPath();
        g.rect(s.x, s.y, s.w, s.h);
        g.clip();
        g.lineCap = 'round';
        g.lineWidth = 2;
        for (var i = 0; i < n; i++) {
            var u = (hash(i * 1.7 + s.x) + clock * speed / along) % 1;
            var c = (hash(i * 3.1 + s.y) - 0.5) * across * 0.92;
            var len = 22 + hash(i * 5.3) * 34;
            var a = Math.sin(Math.PI * u) * 0.7;
            var sx = cx + ux * (u * along - along / 2) + px * c, sy = cy + uy * (u * along - along / 2) + py * c;
            var wob = Math.sin(clock * 3 + i) * 2.5;
            g.strokeStyle = 'rgba(240, 250, 255, ' + a.toFixed(2) + ')';
            g.beginPath();
            g.moveTo(sx, sy);
            g.quadraticCurveTo(sx + ux * len * 0.5 + px * wob, sy + uy * len * 0.5 + py * wob, sx + ux * len, sy + uy * len);
            g.stroke();
        }
        g.restore();
    }

    /* ── hills ──────────────────────────────────────────────────────────

       Lit the way a sphere is lit: the hill's height is a cosine of the
       distance out, its normal follows from that, and every pixel is
       brightened or darkened by how much more or less it faces the light
       than flat grass does. The light is the screen's top left, so a turned
       phone turns the shading with it. Painted once into the ground. */
    /* The shading is a picture of the hill alone, so it is kept: the game
       paints it once into a cached layer anyway, but the editor draws live,
       every frame, and a hill being dragged about would otherwise make a
       canvas a frame. */
    var shades = {}, shadeKeys = [];

    /* In space a hill is gravity: a bowl is a well and a mound a field
       that pushes away, drawn as rings closing in on the middle — tighter
       where it pulls hardest — and the chevrons any hill has. */
    function gravityRings(g, hl, v) {
        var R = hl.r, well = hl.a < 0;
        g.save();
        var glow = g.createRadialGradient(hl.x, hl.y, 0, hl.x, hl.y, R);
        glow.addColorStop(0, well ? 'rgba(150, 110, 255, 0.28)' : 'rgba(255, 160, 90, 0.20)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        g.fillStyle = glow;
        g.beginPath(); g.arc(hl.x, hl.y, R, 0, TAU); g.fill();
        g.lineWidth = 1.3;
        for (var k = 1; k <= 7; k++) {
            var rr = R * (1 - Math.pow(k / 8, 0.7));
            g.strokeStyle = (well ? 'rgba(180, 160, 255, ' : 'rgba(255, 190, 140, ') + (0.08 + k * 0.035).toFixed(3) + ')';
            g.beginPath(); g.arc(hl.x, hl.y, Math.max(2, rr), 0, TAU); g.stroke();
        }
        g.strokeStyle = 'rgba(200, 200, 255, 0.07)';
        g.beginPath();
        for (k = 0; k < 16; k++) {
            var a = k / 16 * TAU;
            g.moveTo(hl.x + Math.cos(a) * R * 0.12, hl.y + Math.sin(a) * R * 0.12);
            g.lineTo(hl.x + Math.cos(a) * R, hl.y + Math.sin(a) * R);
        }
        g.stroke();
        g.restore();
    }

    function drawHill(g, hl, v, theme) {
        if (theme && theme.id === 'space') return gravityRings(g, hl, v);
        var R = hl.r, n = Math.max(8, Math.ceil(R)), sign = hl.a > 0 ? 1 : -1;
        if (typeof document === 'undefined') return;
        var key = [R, hl.a, v.turned ? 1 : 0].join('|'), c = shades[key];
        if (!c) {
            c = shades[key] = shade(R, n, sign, hl.a, v);
            shadeKeys.push(key);
            if (shadeKeys.length > 24) delete shades[shadeKeys.shift()];
        }
        paintHill(g, hl, v, c, sign);
    }

    function shade(R, n, sign, a, v) {
        var c = document.createElement('canvas');
        c.width = c.height = n;
        var x2 = c.getContext('2d'), img = x2.createImageData(n, n), d = img.data;
        var ld = sv(v, -1, -1), ll = Math.hypot(ld.x, ld.y), el = 0.85;
        var lx = ld.x / ll * Math.cos(el), ly = ld.y / ll * Math.cos(el), lz = Math.sin(el);
        var k = Math.max(0.45, Math.min(1.3, Math.abs(a) / 150)) * 0.8 * sign;
        for (var j = 0; j < n; j++) {
            for (var i = 0; i < n; i++) {
                var wx = ((i + 0.5) / n * 2 - 1) * R, wy = ((j + 0.5) / n * 2 - 1) * R, dist = Math.hypot(wx, wy);
                if (dist >= R || dist < 1e-6) continue;
                var slope = k * Math.sin(Math.PI * dist / R);
                var nx = slope * wx / dist, ny = slope * wy / dist, nz = 1;
                var nn = Math.hypot(nx, ny, nz);
                var shade = (nx * lx + ny * ly + nz * lz) / nn - lz;
                var o = (j * n + i) * 4, alpha = Math.min(0.55, Math.abs(shade) * 1.5);
                if (shade > 0) { d[o] = 236; d[o + 1] = 255; d[o + 2] = 200; alpha *= 0.75; } else { d[o] = 0; d[o + 1] = 25; d[o + 2] = 5; }
                d[o + 3] = Math.round(alpha * 255);
            }
        }
        x2.putImageData(img, 0, 0);
        return c;
    }

    function paintHill(g, hl, v, c, sign) {
        var R = hl.r;
        g.save();
        g.drawImage(c, hl.x - R, hl.y - R, R * 2, R * 2);
        // Contours: the hill's height in rings, closer where it is steep.
        g.lineWidth = 1.2;
        [0.2, 0.42, 0.62, 0.82].forEach(function (lvl, q) {
            var rad = R / Math.PI * Math.acos(2 * lvl - 1);
            g.strokeStyle = 'rgba(255, 255, 255, ' + (0.05 + q * 0.012).toFixed(3) + ')';
            g.beginPath();
            g.arc(hl.x, hl.y, rad, 0, Math.PI * 2);
            g.stroke();
        });
        // And downhill, as every slope says it: chevrons round the steepest ring.
        g.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        g.lineWidth = 2.5;
        g.lineCap = 'round';
        var count = Math.max(6, Math.round(R / 14));
        for (var q = 0; q < count; q++) {
            var a = q / count * Math.PI * 2 + 0.3, cx = hl.x + Math.cos(a) * R * 0.5, cy = hl.y + Math.sin(a) * R * 0.5;
            g.save();
            g.translate(cx, cy);
            g.rotate(sign > 0 ? a : a + Math.PI);
            g.beginPath();
            g.moveTo(-6, -6); g.lineTo(2, 0); g.lineTo(-6, 6);
            g.stroke();
            g.restore();
        }
        g.restore();
    }

    /* ── gates ──────────────────────────────────────────────────────────

       The track a gate slides in, laid in the ground under its whole
       travel: a sunken channel the gate's own thickness, two steel runners
       down it and a stop at each end. A moving wall no longer has to be
       caught moving to be known for one. */
    function travel(w) {
        var amp = Math.abs(w.move.amp);
        return w.move.axis === 'y'
            ? { x: w.x, y: w.y - amp, w: w.w, h: w.h + amp * 2, vertical: true }
            : { x: w.x - amp, y: w.y, w: w.w + amp * 2, h: w.h, vertical: false };
    }

    function drawTrack(g, w) {
        var t = travel(w);
        g.save();
        GOLF.landscape.roundRect(g, t.x - 3, t.y - 3, t.w + 6, t.h + 6, 8);
        g.fillStyle = 'rgba(0, 0, 0, 0.16)';
        g.fill();
        GOLF.landscape.roundRect(g, t.x - 3, t.y - 1, t.w + 6, t.h + 4, 8);
        g.strokeStyle = 'rgba(255, 255, 255, 0.10)';
        g.lineWidth = 1;
        g.stroke();
        g.strokeStyle = 'rgba(205, 210, 215, 0.42)';
        g.lineWidth = 2;
        g.beginPath();
        if (t.vertical) {
            g.moveTo(t.x + t.w * 0.3, t.y); g.lineTo(t.x + t.w * 0.3, t.y + t.h);
            g.moveTo(t.x + t.w * 0.7, t.y); g.lineTo(t.x + t.w * 0.7, t.y + t.h);
        } else {
            g.moveTo(t.x, t.y + t.h * 0.3); g.lineTo(t.x + t.w, t.y + t.h * 0.3);
            g.moveTo(t.x, t.y + t.h * 0.7); g.lineTo(t.x + t.w, t.y + t.h * 0.7);
        }
        g.stroke();
        g.fillStyle = 'rgba(40, 40, 40, 0.55)';
        var ends = t.vertical ? [[t.x + t.w / 2, t.y + 2], [t.x + t.w / 2, t.y + t.h - 2]] : [[t.x + 2, t.y + t.h / 2], [t.x + t.w - 2, t.y + t.h / 2]];
        ends.forEach(function (e) {
            g.beginPath();
            g.arc(e[0], e[1], 3.2, 0, Math.PI * 2);
            g.fill();
        });
        g.restore();
    }

    /* ── spinners ───────────────────────────────────────────────────────

       A turnstile laid flat. Its track — the ring its tips run round — is
       sunk in the grass like a gate's, so the disc it sweeps is plain
       before an arm ever comes round; the arms are drawn live, off the
       world's clock, because where they are is a fact of play, and they
       wear the moving wall's hazard stripes on the biome's own material. */
    function drawSpinTrack(g, sp) {
        var R = P.sweepOf(sp);
        g.save();
        g.strokeStyle = 'rgba(0, 0, 0, 0.16)';
        g.lineWidth = 10;
        g.beginPath();
        g.arc(sp.x, sp.y, R - 4, 0, Math.PI * 2);
        g.stroke();
        g.strokeStyle = 'rgba(205, 210, 215, 0.35)';
        g.lineWidth = 1.6;
        g.beginPath();
        g.arc(sp.x, sp.y, R - 1, 0, Math.PI * 2);
        g.moveTo(sp.x + R - 8, sp.y);
        g.arc(sp.x, sp.y, R - 8, 0, Math.PI * 2);
        g.stroke();
        // A faint wash over the whole sweep: this is the arms' ground.
        g.fillStyle = 'rgba(0, 0, 0, 0.05)';
        g.beginPath();
        g.arc(sp.x, sp.y, R, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }

    function drawSpinner(g, sp, t, theme, v) {
        var m = material(theme.wall), arms = P.spinnerArms(sp, t), hw = (sp.w || 20) / 2;
        var s1 = sv(v, 5, 8);
        g.save();
        g.lineCap = 'round';
        // Shadows, then the near faces, then the tops.
        arms.forEach(function (a) {
            g.strokeStyle = 'rgba(0, 0, 0, 0.26)';
            g.lineWidth = hw * 2;
            g.beginPath(); g.moveTo(a.x + s1.x, a.y + s1.y); g.lineTo(a.tx + s1.x, a.ty + s1.y); g.stroke();
        });
        arms.forEach(function (a) {
            g.strokeStyle = m.side;
            g.lineWidth = hw * 2;
            g.beginPath(); g.moveTo(a.x + v.dx * EXT, a.y + v.dy * EXT); g.lineTo(a.tx + v.dx * EXT, a.ty + v.dy * EXT); g.stroke();
        });
        arms.forEach(function (a) {
            g.strokeStyle = m.move;
            g.lineWidth = hw * 2;
            g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(a.tx, a.ty); g.stroke();
            // Hazard stripes across the arm.
            var L = Math.hypot(a.tx - a.x, a.ty - a.y), ux = (a.tx - a.x) / L, uy = (a.ty - a.y) / L;
            g.strokeStyle = 'rgba(251, 191, 36, 0.6)';
            g.lineWidth = 4;
            g.lineCap = 'butt';
            g.beginPath();
            for (var d = hw + 6; d < L; d += 14) {
                var cx = a.x + ux * d, cy = a.y + uy * d;
                g.moveTo(cx - uy * hw * 0.8 - ux * 3, cy + ux * hw * 0.8 - uy * 3);
                g.lineTo(cx + uy * hw * 0.8 + ux * 3, cy - ux * hw * 0.8 + uy * 3);
            }
            g.stroke();
            g.lineCap = 'round';
            g.strokeStyle = m.hi;
            g.lineWidth = 1;
            g.beginPath(); g.moveTo(a.x - uy * hw, a.y + ux * hw); g.lineTo(a.tx - uy * hw, a.ty + ux * hw); g.stroke();
        });
        // The hub: the post it all turns on.
        var l = sv(v, -hw * 0.3, -hw * 0.3);
        var grad = g.createRadialGradient(sp.x + l.x, sp.y + l.y, 1, sp.x, sp.y, hw + 4);
        grad.addColorStop(0, '#f5f0e0');
        grad.addColorStop(1, '#6b6f76');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(sp.x, sp.y, hw + 4, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#2b2f36';
        g.beginPath();
        g.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }

    /* ── belts ──────────────────────────────────────────────────────────

       A conveyor: a rubber band between two steel lips with a roller at
       each end, painted once, and slats across it running the way it runs,
       drawn live — the belt says which way and how fast by doing it. */
    function beltAxis(bt) {
        var d = P.chuteDir(bt);
        return { d: d, along: d.x ? bt.w : bt.h, across: d.x ? bt.h : bt.w };
    }

    function drawBeltBase(g, bt, v) {
        var sh = sv(v, 4, 6);
        g.save();
        g.fillStyle = 'rgba(0, 0, 0, 0.25)';
        GOLF.landscape.roundRect(g, bt.x + sh.x, bt.y + sh.y, bt.w, bt.h, 8);
        g.fill();
        GOLF.landscape.roundRect(g, bt.x, bt.y, bt.w, bt.h, 8);
        g.fillStyle = '#2b2f36';
        g.fill();
        // The steel lips along both sides, and a roller at each end.
        var ax = beltAxis(bt);
        g.fillStyle = '#9aa3ad';
        if (ax.d.x) {
            g.fillRect(bt.x, bt.y, bt.w, 4); g.fillRect(bt.x, bt.y + bt.h - 4, bt.w, 4);
        } else {
            g.fillRect(bt.x, bt.y, 4, bt.h); g.fillRect(bt.x + bt.w - 4, bt.y, 4, bt.h);
        }
        g.fillStyle = '#5b636d';
        if (ax.d.x) {
            g.fillRect(bt.x, bt.y + 4, 8, bt.h - 8); g.fillRect(bt.x + bt.w - 8, bt.y + 4, 8, bt.h - 8);
        } else {
            g.fillRect(bt.x + 4, bt.y, bt.w - 8, 8); g.fillRect(bt.x + 4, bt.y + bt.h - 8, bt.w - 8, 8);
        }
        g.restore();
    }

    function drawBeltSlats(g, bt, t) {
        var ax = beltAxis(bt), gap = 16, off = ((bt.speed * t) % gap + gap) % gap;
        g.save();
        g.beginPath();
        if (ax.d.x) g.rect(bt.x + 8, bt.y + 4, bt.w - 16, bt.h - 8);
        else g.rect(bt.x + 4, bt.y + 8, bt.w - 8, bt.h - 16);
        g.clip();
        g.strokeStyle = 'rgba(150, 160, 172, 0.55)';
        g.lineWidth = 3;
        g.beginPath();
        for (var p = -gap; p < ax.along + gap; p += gap) {
            // Distance along the belt in the direction it runs.
            var q = p + off;
            if (ax.d.x > 0) { g.moveTo(bt.x + q, bt.y); g.lineTo(bt.x + q, bt.y + bt.h); }
            else if (ax.d.x < 0) { g.moveTo(bt.x + bt.w - q, bt.y); g.lineTo(bt.x + bt.w - q, bt.y + bt.h); }
            else if (ax.d.y > 0) { g.moveTo(bt.x, bt.y + q); g.lineTo(bt.x + bt.w, bt.y + q); }
            else { g.moveTo(bt.x, bt.y + bt.h - q); g.lineTo(bt.x + bt.w, bt.y + bt.h - q); }
        }
        g.stroke();
        // Chevrons down the middle, pointing the way it goes.
        g.strokeStyle = 'rgba(251, 191, 36, 0.55)';
        g.lineWidth = 2.5;
        g.lineJoin = 'round';
        var size = Math.min(ax.across * 0.22, 10), step = 46, coff = ((bt.speed * t) % step + step) % step;
        for (var c = -step; c < ax.along + step; c += step) {
            var u = c + coff, cx, cy;
            if (ax.d.x) { cx = ax.d.x > 0 ? bt.x + u : bt.x + bt.w - u; cy = bt.y + bt.h / 2; }
            else { cx = bt.x + bt.w / 2; cy = ax.d.y > 0 ? bt.y + u : bt.y + bt.h - u; }
            g.beginPath();
            g.moveTo(cx - ax.d.x * size - ax.d.y * size, cy - ax.d.y * size - ax.d.x * size);
            g.lineTo(cx, cy);
            g.lineTo(cx - ax.d.x * size + ax.d.y * size, cy - ax.d.y * size + ax.d.x * size);
            g.stroke();
        }
        g.restore();
    }

    /* ── curves ─────────────────────────────────────────────────────────

       A curved wall is drawn as what it stands for — one band round the
       arc, round at both ends — and not as the chain of short rails the
       physics meets it as. At eight degrees a link the two never differ by
       more than a pixel. */
    function band(g, a, ox, oy, grow) {
        var hw = (a.w || 24) / 2 + grow, f = a.from * DEG, t = a.to * DEG;
        var cx = a.x + ox, cy = a.y + oy;
        g.beginPath();
        g.arc(cx, cy, a.r + hw, f, t, false);
        g.arc(cx + Math.cos(t) * a.r, cy + Math.sin(t) * a.r, hw, t, t + Math.PI, false);
        g.arc(cx, cy, Math.max(0.1, a.r - hw), t, f, true);
        g.arc(cx + Math.cos(f) * a.r, cy + Math.sin(f) * a.r, hw, f + Math.PI, f + Math.PI * 2, false);
        g.closePath();
    }

    function drawArc(g, a, theme, v) {
        var m = material(theme.wall), hw = (a.w || 24) / 2;
        var s1 = sv(v, 5, 8), s2 = sv(v, 9, 13), seed = a.x * 3.1 + a.y * 1.3;
        g.save();
        band(g, a, s2.x, s2.y, 2); g.fillStyle = 'rgba(0, 0, 0, 0.12)'; g.fill();
        band(g, a, s1.x, s1.y, 0); g.fillStyle = 'rgba(0, 0, 0, 0.24)'; g.fill();
        g.fillStyle = m.side;
        for (var k = EXT; k > 0; k -= 2) { band(g, a, v.dx * k, v.dy * k, 0); g.fill(); }
        band(g, a, 0, 0, 0);
        g.fillStyle = m.top;
        g.fill();
        g.clip();
        // Grain along the curve, joints across it.
        var f = a.from * DEG, t = a.to * DEG, kind = theme.wall, i;
        g.strokeStyle = m.grain;
        g.lineWidth = kind === 'brick' ? 1.4 : 1;
        g.beginPath();
        var rings = kind === 'brick' ? [0] : kind === 'stone' || kind === 'granite' || kind === 'basalt' || kind === 'hedge' ? [] : [-hw * 0.55, -hw * 0.15, hw * 0.25, hw * 0.6];
        rings.forEach(function (off) {
            g.moveTo(a.x + Math.cos(f) * (a.r + off), a.y + Math.sin(f) * (a.r + off));
            g.arc(a.x, a.y, a.r + off, f, t, false);
        });
        var gap = { brick: 11, stone: 14, granite: 16, basalt: 10, timber: 70, driftwood: 60, log: 0, snowlog: 0, sandstone: 0, hedge: 0 }[kind] || 0;
        if (gap) {
            var len = (t - f) * a.r;
            for (var sAlong = gap / 2, row = 0; sAlong < len; sAlong += gap, row++) {
                var ang = f + sAlong / a.r;
                var inner = kind === 'brick' ? (row % 2 ? 0 : -hw) : -hw, outer = kind === 'brick' ? (row % 2 ? hw : 0) : hw;
                g.moveTo(a.x + Math.cos(ang) * (a.r + inner), a.y + Math.sin(ang) * (a.r + inner));
                g.lineTo(a.x + Math.cos(ang) * (a.r + outer), a.y + Math.sin(ang) * (a.r + outer));
            }
        }
        g.stroke();
        if (kind === 'hedge') {
            for (i = 0; i < (t - f) * a.r / 3; i++) {
                var ha = f + hash(seed + i) * (t - f), hr = a.r + (hash(seed + i * 2.3) - 0.5) * hw * 2;
                g.fillStyle = hash(seed + i * 3.3) < 0.5 ? 'rgba(80, 150, 70, 0.55)' : 'rgba(15, 55, 20, 0.45)';
                g.beginPath();
                g.arc(a.x + Math.cos(ha) * hr, a.y + Math.sin(ha) * hr, 2.4, 0, Math.PI * 2);
                g.fill();
            }
        }
        if (kind === 'granite' || kind === 'snowlog') {
            g.strokeStyle = 'rgba(245, 250, 255, 0.6)';
            g.lineWidth = hw * 0.7;
            g.setLineDash([7, 10]);
            g.beginPath();
            g.arc(a.x, a.y, a.r, f, t, false);
            g.stroke();
            g.setLineDash([]);
        }
        // Lit on the side towards the light.
        var bx = { x: a.x - a.r - hw, y: a.y - a.r - hw, w: (a.r + hw) * 2, h: (a.r + hw) * 2 };
        var d = sv(v, -1, -1), n = Math.hypot(d.x, d.y);
        var grad = g.createLinearGradient(a.x + d.x / n * a.r, a.y + d.y / n * a.r, a.x - d.x / n * a.r, a.y - d.y / n * a.r);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
        g.fillStyle = grad;
        g.fillRect(bx.x, bx.y, bx.w, bx.h);
        g.restore();
        g.save();
        band(g, a, 0, 0, 0);
        g.strokeStyle = m.hi;
        g.lineWidth = 1;
        g.stroke();
        g.restore();
    }

    /* ── what landscape.js and render.js call ───────────────────────────── */

    // Into the cached ground: hills, the wind's lanes, the gates' tracks.
    /* Who made the hill. A mound on grass gets a molehill at its peak and
       the mole that dug it — unless the tee or the cup is up there, which
       is no place for anybody to be standing. */
    var MOLES = { parkland: 1, garden: 1, woodland: 1, meadow: 1, autumn: 1, night: 1 };

    function mole(g, x, y, v, seed) {
        var sh = sv(v, 3, 4), up = sv(v, 0, -1), side = sv(v, 1, 0);
        g.save();
        g.fillStyle = 'rgba(0, 0, 0, 0.22)';
        g.beginPath();
        g.ellipse(x + sh.x, y + sh.y, 15, 12, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#5b3b22';
        g.beginPath();
        g.ellipse(x, y, 15, 12, 0, 0, Math.PI * 2);
        g.fill();
        // Crumbs of turned earth round the heap.
        g.fillStyle = '#6e4a2c';
        for (var i = 0; i < 9; i++) {
            var a = seed + i * 0.7, d = 14 + hash(seed + i) * 6;
            g.beginPath();
            g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, 1.6 + hash(i) * 1.4, 0, Math.PI * 2);
            g.fill();
        }
        g.fillStyle = '#3d2715';
        g.beginPath();
        g.ellipse(x, y, 8, 6, 0, 0, Math.PI * 2);
        g.fill();
        // The mole, out to see who is putting over its roof.
        var hx = x + up.x * 2, hy = y + up.y * 2;
        g.fillStyle = '#3a3a40';
        g.beginPath();
        g.arc(hx, hy, 6, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#f9a8d4';
        g.beginPath();
        g.arc(hx - up.x * 4.5, hy - up.y * 4.5, 2, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#f1f5f9';
        [-1, 1].forEach(function (k) {
            g.beginPath();
            g.arc(hx + side.x * k * 2.4 - up.x * 1.2, hy + side.y * k * 2.4 - up.y * 1.2, 0.9, 0, Math.PI * 2);
            g.fill();
        });
        g.fillStyle = '#f5d0c5';
        [-1, 1].forEach(function (k) {
            g.beginPath();
            g.ellipse(hx + side.x * k * 6 - up.x * 4, hy + side.y * k * 6 - up.y * 4, 2.6, 1.8, 0, 0, Math.PI * 2);
            g.fill();
        });
        g.restore();
    }

    /* A gravel path from a tunnel mouth to the windmill it runs through:
       the door is where the tunnel goes, and the path says so. */
    function millPaths(g, course) {
        (course.blocks || []).forEach(function (b) {
            if (b.look !== 'windmill') return;
            var p = pole(b.pts);
            (course.tunnels || []).forEach(function (t) {
                [[t.x, t.y], [t.tx, t.ty]].forEach(function (m) {
                    if (Math.hypot(m[0] - p.x, m[1] - p.y) > p.r + 110) return;
                    g.save();
                    g.lineCap = 'round';
                    g.strokeStyle = 'rgba(70, 55, 35, 0.35)';
                    g.lineWidth = 34;
                    g.beginPath(); g.moveTo(m[0], m[1]); g.lineTo(p.x, p.y); g.stroke();
                    g.strokeStyle = '#cbbd9c';
                    g.lineWidth = 28;
                    g.stroke();
                    g.fillStyle = 'rgba(110, 95, 70, 0.45)';
                    var len = Math.hypot(m[0] - p.x, m[1] - p.y);
                    for (var k = 0; k < len / 3; k++) {
                        var u = hash(m[0] + k) , q = (hash(m[1] + k * 1.7) - 0.5) * 24;
                        var ux = (p.x - m[0]) / len, uy = (p.y - m[1]) / len;
                        g.fillRect(m[0] + ux * u * len - uy * q, m[1] + uy * u * len + ux * q, 1.6, 1.6);
                    }
                    g.restore();
                });
            });
        });
    }

    /* A turntable, from above: a record on its platter. The plinth's rim,
       the vinyl with its grooves, the sheen of the light on it — which
       stays where the light is while the record turns under it, as it does
       on a real one — and arrows printed round the rim the way it turns, so
       it is known for a turntable and its direction before a ball is near
       it. The label and the spindle turn, and are drawn live. */
    function drawPlatter(g, tt, v) {
        var sh = sv(v, 5, 8), r = tt.r, cw = tt.speed > 0 ? 1 : -1, k;
        g.save();
        g.fillStyle = 'rgba(0, 0, 0, 0.3)';
        g.beginPath(); g.arc(tt.x + sh.x, tt.y + sh.y, r + 7, 0, TAU); g.fill();
        g.fillStyle = '#9aa1a8';
        g.beginPath(); g.arc(tt.x, tt.y, r + 6, 0, TAU); g.fill();
        g.fillStyle = '#5b6168';
        g.beginPath(); g.arc(tt.x, tt.y, r + 2.5, 0, TAU); g.fill();
        var vinyl = g.createRadialGradient(tt.x, tt.y, r * 0.3, tt.x, tt.y, r);
        vinyl.addColorStop(0, '#1d1d22'); vinyl.addColorStop(1, '#0c0c0f');
        g.fillStyle = vinyl;
        g.beginPath(); g.arc(tt.x, tt.y, r, 0, TAU); g.fill();
        // Grooves, with a gap between two tracks.
        g.lineWidth = 0.8;
        for (var rr = r * 0.38; rr < r - 4; rr += 3.2) {
            g.strokeStyle = Math.abs(rr - r * 0.7) < 3 ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.045)';
            g.beginPath(); g.arc(tt.x, tt.y, rr, 0, TAU); g.stroke();
        }
        // The light's sheen: two opposite wedges, still while the record turns.
        var lt = Math.atan2(sv(v, -1, -1).y, sv(v, -1, -1).x);
        [lt, lt + Math.PI].forEach(function (a) {
            var gl = g.createRadialGradient(tt.x, tt.y, r * 0.35, tt.x, tt.y, r);
            gl.addColorStop(0, 'rgba(255, 255, 255, 0)');
            gl.addColorStop(0.6, 'rgba(210, 225, 255, 0.10)');
            gl.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
            g.fillStyle = gl;
            g.beginPath(); g.moveTo(tt.x, tt.y); g.arc(tt.x, tt.y, r, a - 0.35, a + 0.35); g.closePath(); g.fill();
        });
        // Which way it turns, round the plinth.
        g.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        g.lineWidth = 1.6;
        g.lineCap = 'round';
        for (k = 0; k < 6; k++) {
            var a0 = k / 6 * TAU, rx = r + 4.2;
            var px = tt.x + Math.cos(a0) * rx, py = tt.y + Math.sin(a0) * rx;
            var tx = -Math.sin(a0) * cw, ty = Math.cos(a0) * cw, nx = Math.cos(a0), ny = Math.sin(a0);
            g.beginPath();
            g.moveTo(px - tx * 3 + nx * 2, py - ty * 3 + ny * 2);
            g.lineTo(px + tx * 2, py + ty * 2);
            g.lineTo(px - tx * 3 - nx * 2, py - ty * 3 - ny * 2);
            g.stroke();
        }
        g.restore();
    }

    // The label and the spindle, turning on the world's clock.
    function drawLabel(g, tt, t) {
        var r = tt.r * 0.33, a = tt.speed * t, seed = tt.x * 0.7 + tt.y * 1.3;
        var hue = Math.floor(hash(seed) * 360);
        g.save();
        g.translate(tt.x, tt.y);
        g.rotate(a);
        g.fillStyle = 'hsl(' + hue + ', 70%, 52%)';
        g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
        g.fillStyle = 'hsl(' + hue + ', 75%, 38%)';
        g.beginPath(); g.arc(0, 0, r, -0.9, 0.9); g.lineTo(0, 0); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255, 255, 255, 0.8)';
        g.fillRect(-r * 0.55, -r * 0.5, r * 1.1, r * 0.12);
        g.fillRect(-r * 0.4, -r * 0.3, r * 0.8, r * 0.08);
        g.fillRect(-r * 0.3, r * 0.4, r * 0.6, r * 0.08);
        g.restore();
        var sp = P.spindleOf(tt);
        var gr = g.createRadialGradient(sp.x - 2, sp.y - 2, 1, sp.x, sp.y, sp.r);
        gr.addColorStop(0, '#f8fafc'); gr.addColorStop(1, '#64748b');
        g.fillStyle = gr;
        g.beginPath(); g.arc(sp.x, sp.y, sp.r, 0, TAU); g.fill();
    }

    /* ── skaters ─────────────────────────────────────────────────────────

       A skater is the one thing on the rack with a mind of its own, so it
       is drawn as somebody: a bobble hat, a scarf streaming behind, a
       striped jumper and a hockey stick held down on the ice in front —
       the stick is what says a ball that comes near will be played. Its lap
       is cut into the ice as a pair of blade marks, so where it goes can be
       read before it gets there. The figure keeps the world's clock: where
       a skater is, is a fact of play. */
    var KIT = [
        { jumper: '#dc2626', band: '#fef2f2', hat: '#1e3a8a', bobble: '#ffffff', scarf: ['#facc15', '#1e3a8a'] },
        { jumper: '#0f766e', band: '#ccfbf1', hat: '#ea580c', bobble: '#fde68a', scarf: ['#ea580c', '#fff7ed'] },
        { jumper: '#6d28d9', band: '#ede9fe', hat: '#db2777', bobble: '#fce7f3', scarf: ['#db2777', '#ffffff'] },
        { jumper: '#1d4ed8', band: '#dbeafe', hat: '#16a34a', bobble: '#ffffff', scarf: ['#16a34a', '#facc15'] }
    ];

    var SKATER_SCALE = 1.45;

    function lapPoint(sk, a) {
        return { x: sk.x + sk.rx * Math.cos(a), y: sk.y + sk.ry * Math.sin((sk.eight ? 2 : 1) * a) };
    }

    // Blade marks: two fine lines a stride apart round the lap, broken
    // where a blade lifted, and a fan of scuffs where it turns hardest.
    function drawLap(g, sk) {
        var n = 160, i, pts = [];
        for (i = 0; i <= n; i++) pts.push(lapPoint(sk, i / n * TAU));
        g.save();
        g.lineCap = 'round';
        [-2.2, 2.2].forEach(function (off, k) {
            g.strokeStyle = 'rgba(255, 255, 255, ' + (k ? 0.6 : 0.45) + ')';
            g.lineWidth = 1;
            g.setLineDash([22 + k * 7, 5, 9, 4]);
            g.lineDashOffset = k * 11;
            g.beginPath();
            for (i = 0; i <= n; i++) {
                var a = pts[i], b = pts[Math.min(n, i + 1)], c = pts[Math.max(0, i - 1)];
                var dx = b.x - c.x, dy = b.y - c.y, L = Math.hypot(dx, dy) || 1;
                var wob = Math.sin(i * 0.9 + k * 2) * 0.6;
                g.lineTo(a.x - dy / L * (off + wob), a.y + dx / L * (off + wob));
            }
            g.stroke();
        });
        g.setLineDash([]);
        // A faint polish where the blades have worn the lap.
        g.strokeStyle = 'rgba(255, 255, 255, 0.13)';
        g.lineWidth = 12;
        g.beginPath();
        pts.forEach(function (p) { g.lineTo(p.x, p.y); });
        g.stroke();
        g.restore();
    }

    function drawSkater(g, sk, i, world, v) {
        var t = world.time, P = GOLF.physics;
        var at = P.skaterAt(sk, t), sp = Math.hypot(at.vx, at.vy) || 1, hx = at.vx / sp, hy = at.vy / sp;
        var px = -hy, py = hx;                       // across the skater, to its right
        var up = sv(v, 0, -1), kit = KIT[i % KIT.length], ball = world.ball;
        // Hopping over a ball at rest on the lap, as a good sport would.
        var lift = 0;
        if (!world.moving && !world.sunk) {
            var bd = Math.hypot(ball.x - at.x, ball.y - at.y);
            if (bd < 34) lift = Math.sin((1 - bd / 34) * Math.PI / 2) * 8;
        }
        var held = world.held && world.held.i === i ? world.held : null;
        // The stick: wound back in the last moments of a dribble, swung
        // through just after the pass.
        var wind = held ? Math.max(0, 1 - (held.until - t) / 0.22) : 0;
        var since = world.passed && world.passed[i] ? t - world.passed[i] : 9;
        var follow = since < 0.3 ? 1 - since / 0.3 : 0;
        var stride = Math.sin(t * 7 + i * 1.7);
        // The figure is laid out in small units — along the heading, across
        // it, and up off the ice — and drawn SK times over.
        var SK = SKATER_SCALE, INK = 'rgba(15, 23, 42, 0.55)';
        function X(a, b, u) { return at.x + (hx * a + px * b + up.x * u) * SK + up.x * lift; }
        function Y(a, b, u) { return at.y + (hy * a + py * b + up.y * u) * SK + up.y * lift; }
        // A limb: a stroke with a soft dark edge, so it reads on white ice.
        function limb(pts, w, color) {
            [[INK, w + 1.4], [color, w]].forEach(function (pass) {
                g.strokeStyle = pass[0];
                g.lineWidth = pass[1] * SK;
                g.beginPath();
                pts.forEach(function (q) { g.lineTo(X(q[0], q[1], q[2]), Y(q[0], q[1], q[2])); });
                g.stroke();
            });
        }
        function blob(a, b, u, r, color, edge) {
            g.beginPath();
            g.arc(X(a, b, u), Y(a, b, u), r * SK, 0, TAU);
            g.fillStyle = color;
            g.fill();
            if (edge !== false) { g.strokeStyle = INK; g.lineWidth = 0.7 * SK; g.stroke(); }
        }
        g.save();
        g.lineCap = 'round';
        g.lineJoin = 'round';
        // Shadow on the ice, staying put while the skater hops.
        var sh = sv(v, 5, 6);
        g.fillStyle = 'rgba(30, 55, 85, 0.24)';
        g.beginPath();
        g.ellipse(at.x + sh.x, at.y + sh.y, 15 - lift * 0.4, 9 - lift * 0.3, Math.atan2(hy, hx), 0, TAU);
        g.fill();
        // Legs and skates: the one pushing off swings out and back.
        [-1, 1].forEach(function (side) {
            var push = Math.max(0, stride * side);
            var fa = -push * 4 + (1 - push) * 1.2, fb = side * (3 + push * 3.5);
            limb([[0.5, side * 2.2, 10], [fa + 0.4, fb * 0.9, 5], [fa, fb, 1.6]], 3.2, '#1f2937');
            // Blade, then boot on it.
            g.strokeStyle = '#64748b';
            g.lineWidth = 0.9 * SK;
            g.beginPath();
            g.moveTo(X(fa - 3.6, fb, 0), Y(fa - 3.6, fb, 0));
            g.lineTo(X(fa + 3.8, fb, 0), Y(fa + 3.8, fb, 0));
            g.stroke();
            limb([[fa - 2.2, fb, 1.3], [fa + 2.2, fb, 1.3]], 2.8, '#f8fafc');
        });
        // The stick: hands at the chest, blade on the ice ahead and a
        // little to the right, where the ball is played.
        var reach = P.reachOf();
        var ba = (reach - C.BALL_R - 1) / SK - wind * 7 + follow * 5, bb = 2.5 + wind * 2 - follow * 3, bu = wind * 5 + follow * 2;
        var ha = 6, hb = 2.2, hu = 12.5;
        limb([[ha - 3, hb - 1.6, hu + 3], [ba, bb, bu]], 1.7, '#b7791f');
        limb([[ba, bb, bu], [ba + 1.4, bb - 4.5, bu]], 2.4, '#111827');
        // The scarf, streaming out behind and rippling as it goes.
        function scarf() {
            for (var k = 0; k < 4; k++) {
                var w0 = Math.sin(t * 9 - k * 0.9) * k * 0.55, w1 = Math.sin(t * 9 - (k + 1) * 0.9) * (k + 1) * 0.55;
                limb([[-0.5 - k * 2.5, w0 - 1, 18 - k * 0.6], [-0.5 - (k + 1) * 2.5, w1 - 1, 18 - (k + 1) * 0.6]], 2.3, kit.scarf[k % 2]);
            }
        }
        // Behind the body when it streams up the screen, in front when down.
        var trailsAway = -(hx * up.x + hy * up.y) > 0;
        if (trailsAway) scarf();
        // The body: a jumper leaning into the stride, shaded away from the
        // light, with a stripe across the chest.
        limb([[0.8, 0, 10.2], [2.4, 0, 16.6]], 8.6, kit.jumper);
        g.strokeStyle = 'rgba(0, 0, 0, 0.16)';
        g.lineWidth = 3.4 * SK;
        g.beginPath();
        g.moveTo(X(0.8, 2.3, 10.2), Y(0.8, 2.3, 10.2));
        g.lineTo(X(2.4, 2.3, 16.6), Y(2.4, 2.3, 16.6));
        g.stroke();
        g.strokeStyle = kit.band;
        g.lineWidth = 1.5 * SK;
        g.beginPath();
        g.moveTo(X(1.9, -4.2, 14.4), Y(1.9, -4.2, 14.4));
        g.lineTo(X(1.9, 4.2, 14.4), Y(1.9, 4.2, 14.4));
        g.stroke();
        // Arms out to the stick, and mittens on it.
        [-1, 1].forEach(function (side) {
            var hand = side < 0 ? [ha - 3, hb - 1.6, hu + 3] : [ha, hb, hu];
            limb([[2.2, side * 4, 16], [3.2 + (hand[0] - 3.2) * 0.5, side * 4.4 + (hand[1] - side * 4.4) * 0.4, (16 + hand[2]) / 2 - 1], hand], 2.3, kit.jumper);
            blob(hand[0], hand[1], hand[2], 1.5, kit.hat);
        });
        if (!trailsAway) scarf();
        // Head, and a bobble hat pulled down over it: the crown, a turned-up
        // band at the brim and the bobble on top.
        var toward = hx * -up.x + hy * -up.y;
        blob(3.2, 0, 20.8, 3.6, '#f1c6a3');
        if (toward > 0.25) {
            g.fillStyle = '#1f2937';
            [-1, 1].forEach(function (side) {
                g.beginPath();
                g.arc(X(5.6, side * 1.3, 20), Y(5.6, side * 1.3, 20), 0.5 * SK, 0, TAU);
                g.fill();
            });
            g.fillStyle = 'rgba(244, 114, 182, 0.55)';
            [-1, 1].forEach(function (side) {
                g.beginPath();
                g.arc(X(5.2, side * 2.4, 19.2), Y(5.2, side * 2.4, 19.2), 0.7 * SK, 0, TAU);
                g.fill();
            });
        }
        g.beginPath();
        g.ellipse(X(2.7, 0, 22.4), Y(2.7, 0, 22.4), 3.7 * SK, 3.3 * SK, Math.atan2(up.y, up.x), 0, TAU);
        g.fillStyle = kit.hat;
        g.fill();
        g.strokeStyle = INK;
        g.lineWidth = 0.7 * SK;
        g.stroke();
        // Ribs on the crown.
        g.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        g.lineWidth = 0.6 * SK;
        [-1.6, 0, 1.6].forEach(function (b) {
            g.beginPath();
            g.moveTo(X(2.7, b, 24.6), Y(2.7, b, 24.6));
            g.lineTo(X(2.7, b * 1.15, 20.4), Y(2.7, b * 1.15, 20.4));
            g.stroke();
        });
        limb([[3.4, -3.3, 20.4], [3.9, 0, 19.9], [3.4, 3.3, 20.4]], 1.6, kit.band);
        blob(2.5, 0, 26.2, 1.8, kit.bobble);
        g.restore();
    }

    /* All of them, under the ball: a skater stands up off the ice, but the
       ball is the one thing on the course that is never hidden. */
    function skaters(g, world, v) {
        var list = world.course.skaters || [];
        for (var i = 0; i < list.length; i++) drawSkater(g, list[i], i, world, v);
    }

    function ground(g, course, theme, v) {
        var i;
        millPaths(g, course);
        for (i = 0; i < (course.skaters || []).length; i++) drawLap(g, course.skaters[i]);
        for (i = 0; i < (course.belts || []).length; i++) drawBeltBase(g, course.belts[i], v);
        for (i = 0; i < (course.turntables || []).length; i++) drawPlatter(g, course.turntables[i], v);
        for (i = 0; i < (course.spinners || []).length; i++) drawSpinTrack(g, course.spinners[i]);
        for (i = 0; i < (course.hills || []).length; i++) {
            var hl = course.hills[i];
            drawHill(g, hl, v, theme);
            if (hl.a > 0 && MOLES[theme.id] && Math.hypot(course.hole.x - hl.x, course.hole.y - hl.y) > 60 &&
                Math.hypot(course.tee.x - hl.x, course.tee.y - hl.y) > 60) mole(g, hl.x, hl.y, v, hl.x + hl.y);
        }
        for (i = 0; i < (course.walls || []).length; i++) if (course.walls[i].move) drawTrack(g, course.walls[i]);
    }

    // Into the cached still walls: curves and blocks.
    function solids(g, course, theme, v) {
        var i;
        for (i = 0; i < (course.arcs || []).length; i++) drawArc(g, course.arcs[i], theme, v);
        for (i = 0; i < (course.blocks || []).length; i++) drawBlock(g, course.blocks[i], theme, v, course);
    }

    // How far past its footprint a look reaches, as a share of its size.
    var TALL = { lighthouse: 2, snowman: 1.2, igloo: 0.6, inkpot: 1.4, mug: 1, rocket: 1.8, scarecrow: 1.2, parasol: 0.5 };

    // The box the still walls' layer has to cover for these.
    function extent(course) {
        var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
        (course.arcs || []).forEach(function (a) {
            var r = a.r + (a.w || 24) / 2 + 16;
            b.x0 = Math.min(b.x0, a.x - r); b.x1 = Math.max(b.x1, a.x + r);
            b.y0 = Math.min(b.y0, a.y - r); b.y1 = Math.max(b.y1, a.y + r);
        });
        (course.blocks || []).forEach(function (k) {
            // Things that stand up — a lighthouse and its glow, a snowman's
            // hat — reach well past their footprint.
            var bb = boxOf(k.pts), tall = TALL[k.look] || 0;
            var pad = (k.w || 20) / 2 + 40 + tall * Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0);
            b.x0 = Math.min(b.x0, bb.x0 - pad); b.x1 = Math.max(b.x1, bb.x1 + pad);
            b.y0 = Math.min(b.y0, bb.y0 - pad); b.y1 = Math.max(b.y1, bb.y1 + pad);
        });
        return b.x0 === Infinity ? null : b;
    }

    // Live, under the ball: the wind's streaks and the belts' slats.
    function air(g, course, clock) {
        (course.slopes || []).forEach(function (s) { if (s.wind) streaks(g, s, clock); });
        (course.belts || []).forEach(function (bt) { drawBeltSlats(g, bt, clock); });
    }

    // Live, on the still walls: a fan's rotor, and the spinners' arms —
    // those on the world's clock `t`, because where an arm is is a fact
    // of play.
    function machines(g, course, clock, t, theme, v) {
        (course.blocks || []).forEach(function (b) {
            if (b.look === 'fan') rotor(g, b, course, clock);
            if (b.look === 'carousel') carousel(g, b, clock);
        });
        (course.spinners || []).forEach(function (sp) { drawSpinner(g, sp, t, theme, v); });
        (course.turntables || []).forEach(function (tt) { drawLabel(g, tt, t); });
    }

    // Live, over the ball: a windmill's sails.
    function over(g, course, v, clock, ball) {
        (course.blocks || []).forEach(function (b) {
            if (b.look === 'windmill') sails(g, b, v, clock, ball);
            if (b.look === 'wheel') bigWheel(g, b, v, clock, ball);
        });
    }

    GOLF.props = {
        ground: ground,
        solids: solids,
        extent: extent,
        air: air,
        machines: machines,
        over: over,
        windLane: windLane,
        pole: pole,
        skaters: skaters,
        sailReach: sailReach,
        travel: travel,
        BEDS: BEDS
    };

})(window.GOLF);
