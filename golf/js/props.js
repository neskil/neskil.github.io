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
        night:    { kerb: 'stone', soil: '#2c3328', plants: ['shrub', 'flowers'], flowers: ['#e0e7ff', '#c7d2fe'] }
    };
    var SHRUB = {
        parkland: ['#1f5a2a', '#3f8a46'], garden: ['#22602e', '#4f9a4f'], meadow: ['#3a6a26', '#6a9a3a'],
        autumn: ['#8f2f14', '#e98a2e'], night: ['#12302a', '#21453b'], woodland: ['#1d4a2b', '#2f6a3a']
    };
    // A rock in the biome it lies in.
    var ROCK = {
        alpine: { kind: 'granite', top: '#9aa3ab', side: '#4f565d', snow: true },
        winter: { kind: 'granite', top: '#a7b0b8', side: '#59626b', snow: true },
        volcanic: { kind: 'basalt', top: '#3d3a3b', side: '#1b1819', glow: true },
        desert: { kind: 'sandstone', top: '#c9854f', side: '#7a4526' },
        seaside: { kind: 'stone', top: '#9a958a', side: '#55514a' },
        _: { kind: 'stone', top: '#8d8f88', side: '#4a4b46' }
    };

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
            var rk = ROCK[theme.id] || ROCK._;
            m = { top: rk.top, side: rk.side, hi: 'rgba(255, 255, 255, 0.3)', grain: 'rgba(0, 0, 0, 0.3)' };
            solid(g, pts, w, m, v, 11, rk.top);
            g.save();
            trace(g, pts, 0, 0);
            g.lineJoin = 'round';
            g.lineWidth = w;
            g.clip();
            // Facets: lighter on the side towards the light.
            var rb = boxOf(pts), lt = sv(v, -1, -1);
            for (i = 0; i < 18; i++) {
                var fx = rb.x0 + hash(seed + i) * (rb.x1 - rb.x0), fy = rb.y0 + hash(seed + i * 3.3) * (rb.y1 - rb.y0);
                var fr = 10 + hash(seed + i * 7) * 22, lean = (fx - rb.x0) / (rb.x1 - rb.x0 + 1) * lt.x + (fy - rb.y0) / (rb.y1 - rb.y0 + 1) * lt.y;
                g.fillStyle = lean > -0.5 ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.12)';
                g.beginPath();
                for (var k = 0; k < 5; k++) {
                    var a = k / 5 * Math.PI * 2 + i;
                    g.lineTo(fx + Math.cos(a) * fr, fy + Math.sin(a) * fr * 0.8);
                }
                g.fill();
            }
            g.strokeStyle = rk.glow ? 'rgba(255, 110, 40, 0.55)' : 'rgba(0, 0, 0, 0.3)';
            g.lineWidth = 1.2;
            for (i = 0; i < 6; i++) {
                var cx = rb.x0 + hash(seed + i * 5.1) * (rb.x1 - rb.x0), cy = rb.y0 + hash(seed + i * 6.7) * (rb.y1 - rb.y0);
                g.beginPath();
                g.moveTo(cx, cy);
                for (k = 0; k < 3; k++) { cx += (hash(seed + i + k) - 0.5) * 30; cy += (hash(seed + i * 2 + k) - 0.5) * 30; g.lineTo(cx, cy); }
                g.stroke();
            }
            if (rk.snow) {
                g.fillStyle = 'rgba(245, 250, 255, 0.85)';
                var sp = spots(pts, 0, 10, 6, seed + 9);
                sp.forEach(function (p, n) {
                    g.beginPath();
                    g.ellipse(p.x + lt.x * 4, p.y + lt.y * 4, 12 + hash(n) * 10, 6 + hash(n + 1) * 4, 0, 0, Math.PI * 2);
                    g.fill();
                });
            }
            g.restore();
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
        if (look === 'lighthouse') {
            lighthouse(g, pole(pts), w, v);
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
    function snowman(g, p, w, v, seed) {
        var r0 = p.r + w / 2, up = sv(v, 0, -1), side = sv(v, 1, 0), lt = sv(v, -0.35, -0.4), sh = sv(v, Math.min(6, r0 * 0.2), Math.min(9, r0 * 0.3));
        g.save();
        g.fillStyle = 'rgba(30, 50, 75, 0.22)';
        g.beginPath();
        g.arc(p.x + sh.x, p.y + sh.y, r0, 0, Math.PI * 2);
        g.fill();
        function ball(k, rr) {
            var x = p.x + up.x * r0 * k, y = p.y + up.y * r0 * k;
            var gr = g.createRadialGradient(x + lt.x * rr, y + lt.y * rr, rr * 0.08, x, y, rr);
            gr.addColorStop(0, '#ffffff');
            gr.addColorStop(0.65, '#e9f0f7');
            gr.addColorStop(1, '#b4c4d6');
            g.fillStyle = gr;
            g.beginPath();
            g.arc(x, y, rr, 0, Math.PI * 2);
            g.fill();
            return { x: x, y: y, r: rr };
        }
        ball(0, r0);
        // Stick arms, out from the middle ball to the edge of the bottom one.
        var mid = { x: p.x + up.x * r0 * 0.2, y: p.y + up.y * r0 * 0.2 };
        g.strokeStyle = '#5b3a1e';
        g.lineCap = 'round';
        g.lineWidth = 2.2;
        [-1, 1].forEach(function (d) {
            var ex = mid.x + side.x * d * r0 * 0.92 + up.x * r0 * 0.18, ey = mid.y + side.y * d * r0 * 0.92 + up.y * r0 * 0.18;
            g.beginPath();
            g.moveTo(mid.x + side.x * d * r0 * 0.5, mid.y + side.y * d * r0 * 0.5);
            g.lineTo(ex, ey);
            g.moveTo(ex - side.x * d * r0 * 0.14, ey - side.y * d * r0 * 0.14);
            g.lineTo(ex - side.x * d * r0 * 0.04 + up.x * r0 * 0.12, ey - side.y * d * r0 * 0.04 + up.y * r0 * 0.12);
            g.stroke();
        });
        var chest = ball(0.2, r0 * 0.7);
        // Coal buttons down the front.
        g.fillStyle = '#1f2937';
        for (var i = 0; i < 2; i++) {
            g.beginPath();
            g.arc(chest.x - up.x * chest.r * (0.25 + i * 0.35), chest.y - up.y * chest.r * (0.25 + i * 0.35), Math.max(1.5, r0 * 0.05), 0, Math.PI * 2);
            g.fill();
        }
        // The scarf: a ring at the neck and an end hanging down one side.
        var scarf = hash(seed) < 0.5 ? '#dc2626' : '#2563eb';
        var nx = p.x + up.x * r0 * 0.36, ny = p.y + up.y * r0 * 0.36;
        g.fillStyle = scarf;
        g.beginPath();
        g.arc(nx, ny, r0 * 0.5, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = scarf;
        g.lineWidth = Math.max(3, r0 * 0.12);
        g.beginPath();
        g.moveTo(nx + side.x * r0 * 0.3, ny + side.y * r0 * 0.3);
        g.lineTo(nx + side.x * r0 * 0.42 - up.x * r0 * 0.38, ny + side.y * r0 * 0.42 - up.y * r0 * 0.38);
        g.stroke();
        var head = ball(0.4, r0 * 0.44);
        // Eyes and a carrot on the near side of the head.
        g.fillStyle = '#111827';
        [-1, 1].forEach(function (d) {
            g.beginPath();
            g.arc(head.x + side.x * d * head.r * 0.32 - up.x * head.r * 0.12, head.y + side.y * d * head.r * 0.32 - up.y * head.r * 0.12, Math.max(1.4, head.r * 0.1), 0, Math.PI * 2);
            g.fill();
        });
        var nose = { x: head.x - up.x * head.r * 0.35, y: head.y - up.y * head.r * 0.35 };
        g.fillStyle = '#f97316';
        g.beginPath();
        g.moveTo(nose.x + side.x * head.r * 0.12, nose.y + side.y * head.r * 0.12);
        g.lineTo(nose.x - side.x * head.r * 0.12, nose.y - side.y * head.r * 0.12);
        g.lineTo(nose.x - up.x * head.r * 0.6 + side.x * head.r * 0.08, nose.y - up.y * head.r * 0.6 + side.y * head.r * 0.08);
        g.closePath();
        g.fill();
        // A top hat at the back of the head: brim, then crown.
        var hx = head.x + up.x * head.r * 0.45, hy = head.y + up.y * head.r * 0.45;
        g.fillStyle = '#1f2937';
        g.beginPath();
        g.ellipse(hx, hy, head.r * 0.7, head.r * 0.42, Math.atan2(side.y, side.x), 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#374151';
        g.beginPath();
        g.ellipse(hx + up.x * head.r * 0.12, hy + up.y * head.r * 0.12, head.r * 0.42, head.r * 0.28, Math.atan2(side.y, side.x), 0, Math.PI * 2);
        g.fill();
        g.restore();
    }

    /* A lighthouse seen from above and a little in front: a white tower
       with a red band, narrowing as it rises away from the viewer, a dark
       gallery round the top and the lantern lit inside it. The foot of the
       tower is the block. */
    function lighthouse(g, p, w, v) {
        var r0 = p.r + w / 2, up = sv(v, 0, -1), lt = sv(v, -0.35, -0.4), sh = sv(v, Math.min(8, r0 * 0.3), Math.min(12, r0 * 0.4));
        g.save();
        g.fillStyle = 'rgba(20, 40, 60, 0.25)';
        g.beginPath();
        g.arc(p.x + sh.x, p.y + sh.y, r0, 0, Math.PI * 2);
        g.fill();
        function disc(k, rr, a, b) {
            var x = p.x + up.x * r0 * k, y = p.y + up.y * r0 * k;
            var gr = g.createRadialGradient(x + lt.x * rr, y + lt.y * rr, rr * 0.1, x, y, rr);
            gr.addColorStop(0, a);
            gr.addColorStop(1, b);
            g.fillStyle = gr;
            g.beginPath();
            g.arc(x, y, rr, 0, Math.PI * 2);
            g.fill();
            return { x: x, y: y, r: rr };
        }
        disc(0, r0, '#ffffff', '#c9d2dc');
        disc(0.12, r0 * 0.86, '#ef4444', '#991b1b');
        disc(0.22, r0 * 0.72, '#ffffff', '#cbd5e1');
        disc(0.32, r0 * 0.6, '#ef4444', '#991b1b');
        var gal = disc(0.4, r0 * 0.5, '#374151', '#111827');
        var lamp = disc(0.42, r0 * 0.34, '#fef9c3', '#facc15');
        g.fillStyle = 'rgba(253, 224, 71, 0.25)';
        g.beginPath();
        g.arc(lamp.x, lamp.y, gal.r * 1.6, 0, Math.PI * 2);
        g.fill();
        // The cap on the lantern.
        g.fillStyle = '#7f1d1d';
        g.beginPath();
        g.arc(lamp.x + up.x * lamp.r * 0.15, lamp.y + up.y * lamp.r * 0.15, lamp.r * 0.45, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }

    function shack(g, p, v, theme, seed) {
        // As big as its plot allows: a fishing hut on a small one, a barn
        // on a big one.
        var s = Math.min(p.r * 1.3, 130);
        if (s < 14) return;
        var snow = theme.id === 'winter' || theme.id === 'alpine';
        var walls = snow ? '#a0522d' : ['#e11d48', '#2563eb', '#16a34a', '#f59e0b'][(hash(seed) * 4) | 0];
        var x0 = p.x - s / 2, y0 = p.y - s / 2, sh = sv(v, 6, 9);
        g.save();
        g.fillStyle = 'rgba(0, 0, 0, 0.25)';
        g.fillRect(x0 + sh.x, y0 + sh.y, s, s);
        prism(g, x0, y0, s, s, Math.max(14, s * 0.18), snow ? '#f1f5f9' : s > 70 ? '#6b7280' : '#7c4a2a', walls, v);
        if (s > 70 && !snow) {
            // A barn's roof: corrugated, in lines down from the ridge.
            g.strokeStyle = 'rgba(30, 30, 35, 0.35)';
            g.lineWidth = 1;
            g.beginPath();
            for (var c = x0 + 6; c < x0 + s; c += 7) { g.moveTo(c, y0); g.lineTo(c, y0 + s); }
            g.stroke();
        }
        // The roof: two planes meeting at a ridge, lit on one side.
        var lt = sv(v, -1, 0);
        g.fillStyle = 'rgba(0, 0, 0, 0.12)';
        if (Math.abs(lt.x) > Math.abs(lt.y)) g.fillRect(x0 + s / 2, y0, s / 2, s); else g.fillRect(x0, y0 + s / 2, s, s / 2);
        g.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        g.lineWidth = 1.5;
        g.beginPath();
        if (Math.abs(lt.x) > Math.abs(lt.y)) { g.moveTo(x0 + s / 2, y0); g.lineTo(x0 + s / 2, y0 + s); }
        else { g.moveTo(x0, y0 + s / 2); g.lineTo(x0 + s, y0 + s / 2); }
        g.stroke();
        // A door on the near face, and a stovepipe with a wisp.
        var door = sv(v, 0, s / 2 + Math.max(14, s * 0.18) * 0.5);
        g.fillStyle = 'rgba(40, 25, 15, 0.85)';
        g.fillRect(p.x + door.x - s * 0.14, p.y + door.y - s * 0.07, s * 0.28, s * 0.14);
        if (s > 70) {
            // Barn doors: the white cross on each leaf.
            g.strokeStyle = '#f5f5f4';
            g.lineWidth = 2;
            var dx0 = p.x + door.x - s * 0.14, dy0 = p.y + door.y - s * 0.07;
            g.strokeRect(dx0, dy0, s * 0.28, s * 0.14);
            g.beginPath();
            g.moveTo(dx0, dy0); g.lineTo(dx0 + s * 0.28, dy0 + s * 0.14);
            g.moveTo(dx0 + s * 0.28, dy0); g.lineTo(dx0, dy0 + s * 0.14);
            g.stroke();
        }
        var pipe = sv(v, s * 0.22, -s * 0.18);
        g.fillStyle = '#334155';
        g.beginPath();
        g.arc(p.x + pipe.x, p.y + pipe.y, 3.5, 0, Math.PI * 2);
        g.fill();
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

    function drawHill(g, hl, v) {
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

    function ground(g, course, theme, v) {
        var i;
        millPaths(g, course);
        for (i = 0; i < (course.belts || []).length; i++) drawBeltBase(g, course.belts[i], v);
        for (i = 0; i < (course.spinners || []).length; i++) drawSpinTrack(g, course.spinners[i]);
        for (i = 0; i < (course.hills || []).length; i++) {
            var hl = course.hills[i];
            drawHill(g, hl, v);
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

    // The box the still walls' layer has to cover for these.
    function extent(course) {
        var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
        (course.arcs || []).forEach(function (a) {
            var r = a.r + (a.w || 24) / 2 + 16;
            b.x0 = Math.min(b.x0, a.x - r); b.x1 = Math.max(b.x1, a.x + r);
            b.y0 = Math.min(b.y0, a.y - r); b.y1 = Math.max(b.y1, a.y + r);
        });
        (course.blocks || []).forEach(function (k) {
            var bb = boxOf(k.pts), pad = (k.w || 20) / 2 + 40;
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
        sailReach: sailReach,
        travel: travel,
        BEDS: BEDS
    };

})(window.GOLF);
