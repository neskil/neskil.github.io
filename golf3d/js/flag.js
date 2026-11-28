/* The flag on the pin: what is printed on it, and how it moves.

   Two halves, and only the first touches a canvas.

   **The print.** Every course flies its own flag (the owner, v1.257.0: "make
   the flag a bit more fun, a text on it 'neskil golf inc' … vary them per
   map/set of courses"). A design is a cloth colour, an ink, an accent, a
   motif and up to two lines of type plus a small line under them; `paint`
   draws one on a canvas, hoist on the left, with a sleeve where it meets the
   pole. The house name is on every one of them; the course says the rest.
   render.js keys its texture on the design, so a round of six holes paints
   one canvas.

   **The cloth.** A grid of particles stepped with Verlet integration and
   held together by distance constraints (stretch, shear and bend), with the
   hoist column nailed to the pole. Each triangle feels the air blowing
   through it — pressure along its normal, scaled by how squarely it faces
   the air — and that is all it takes for the flag to stream downwind,
   flutter at the fly and hang on a still day. Nothing is scripted: the wind
   comes from weather.js, and the pin's own movement (the celebration launches
   it like a rocket) is subtracted as relative air. It is all plain arrays and
   arithmetic with no three.js in it, so tests.html steps it for real.

   The cloth is the Medium-and-up look; Low keeps the old travelling sine
   (render.js → flapFlag) so the coolest setting does no simulation at all. */
(function (G3) {
    'use strict';

    /* ── the print ──────────────────────────────────────────────────────── */

    var HOUSE = 'NESKIL GOLF INC.';

    /* One per course id, plus the places that are not courses. `lines` are
       [text, size] with size a share of the flag's height; `sub` is the small
       line, usually the course talking. */
    var DESIGNS = {
        house:     { cloth: '#d93a36', ink: '#fff8ec', accent: '#7a1714', motif: 'stripes',
                     lines: [['NESKIL', 0.34], ['GOLF INC.', 0.17]], sub: 'Est. on a phone' },
        // Classic
        seaside:   { cloth: '#1f5f9e', ink: '#ffffff', accent: '#e9f3ff', motif: 'waves',
                     lines: [['NESKIL', 0.32], ['GOLF INC.', 0.16]], sub: 'Seaside Green' },
        quarry:    { cloth: '#f2c21b', ink: '#1b1b1b', accent: '#1b1b1b', motif: 'hazard',
                     lines: [['NESKIL', 0.30], ['GOLF INC.', 0.15]], sub: 'Hard hats beyond this point' },
        tidewater: { cloth: '#14857f', ink: '#f4fffd', accent: '#7fd8cf', motif: 'waves',
                     lines: [['NESKIL', 0.32], ['GOLF INC.', 0.16]], sub: 'Bring a towel' },
        // Adventure
        works:     { cloth: '#b8321f', ink: '#fff1d6', accent: '#f0b44a', motif: 'cog',
                     lines: [['NESKIL', 0.30], ['WORKS', 0.20]], sub: 'Mind the sails' },
        parlour:   { cloth: '#c4237f', ink: '#fff6b0', accent: '#4de3ff', motif: 'stars',
                     lines: [['TILT!', 0.40]], sub: 'Neskil Golf Inc. Amusements' },
        clockwork: { cloth: '#20463a', ink: '#e8c77a', accent: '#e8c77a', motif: 'ring',
                     lines: [['NESKIL', 0.28], ['& SONS', 0.17]], sub: 'Est. quarter past' },
        icehouse:  { cloth: '#bfe6f7', ink: '#174a74', accent: '#ffffff', motif: 'snow',
                     lines: [['NESKIL', 0.30], ['ICE CO.', 0.18]], sub: 'Keep frozen' },
        cinder:    { cloth: '#26201e', ink: '#ffb347', accent: '#ff5a1f', motif: 'flames',
                     lines: [['NESKIL', 0.30], ['GOLF INC.', 0.15]], sub: 'Not liable for lava' },
        apogee:    { cloth: '#141c3c', ink: '#f2f4ff', accent: '#ffe27a', motif: 'stars',
                     lines: [['NESKIL', 0.28], ['LUNAR DIV.', 0.15]], sub: 'Golf Inc. · 0.7 g' },
        // Long game
        parkland:  { cloth: '#1d5a32', ink: '#f3e6b4', accent: '#f3e6b4', motif: 'pennant',
                     lines: [['NESKIL', 0.30], ['GOLF CLUB', 0.16]], sub: 'Members & guests' },
        whinstone: { cloth: '#f3d23a', ink: '#1a1a1a', accent: '#1a1a1a', motif: 'check',
                     lines: [['NESKIL', 0.30], ['LINKS', 0.20]], sub: 'Golf Inc. · Est. 2025' },
        dunmore:   { cloth: '#6a3b86', ink: '#f6ecff', accent: '#c79be0', motif: 'stripes',
                     lines: [['NESKIL', 0.30], ['HEATH', 0.20]], sub: 'Mind the heather' },
        redstone:  { cloth: '#c0582f', ink: '#fff2e0', accent: '#7b2f17', motif: 'mesa',
                     lines: [['NESKIL', 0.30], ['GOLF INC.', 0.15]], sub: 'Canyon division' },
        keys:      { cloth: '#ff7a6b', ink: '#ffffff', accent: '#1f9fb0', motif: 'stripes',
                     lines: [['NESKIL', 0.30], ['KEYS', 0.20]], sub: 'Island time' },
        alpine:    { cloth: '#f4f4f0', ink: '#b3262b', accent: '#b3262b', motif: 'peaks',
                     lines: [['NESKIL', 0.30], ['ALPINE', 0.18]], sub: 'Please yodel quietly' },
        range:     { cloth: '#2a2f36', ink: '#ffffff', accent: '#f2c21b', motif: 'target',
                     lines: [['NESKIL', 0.30], ['RANGE', 0.20]], sub: 'Golf Inc. · Balls on us' },
        // Not courses
        tour:      { cloth: '#18203a', ink: '#f2d58a', accent: '#f2d58a', motif: 'globe',
                     lines: [['NESKIL', 0.28], ['WORLD TOUR', 0.15]], sub: null },
        endless:   { cloth: '#3b1f6e', ink: '#ffffff', accent: '#a98bff', motif: 'infinity',
                     lines: [['NESKIL', 0.28], ['ENDLESS', 0.17]], sub: 'No refunds' },
        forge:     { cloth: '#5a4632', ink: '#ffe9c2', accent: '#e8a23c', motif: 'pennant',
                     lines: [['NESKIL', 0.28], ['CUSTOM', 0.17]], sub: null },
        neon:      { cloth: '#0b0f1e', ink: '#5ff3ff', accent: '#ff3fd1', motif: 'grid',
                     lines: [['NESKIL', 0.30], ['GOLF INC.', 0.15]], sub: 'Challenge mode' }
    };

    /* A theme's own course, for a hole that has lost track of where it came
       from (a showcase deal, an editor playtest). */
    var THEME_DESIGN = {
        seaside: 'seaside', quarry: 'quarry', works: 'works', arcade: 'parlour',
        clockwork: 'clockwork', icehouse: 'icehouse', volcano: 'cinder', lunar: 'apogee',
        parkland: 'parkland', links: 'whinstone', heath: 'dunmore', canyon: 'redstone',
        alpine: 'alpine', neon: 'neon'
    };

    var owner = null;          // hole → course id, built on first ask
    function courseOf(hole) {
        if (!owner && G3.COURSES) {
            owner = typeof WeakMap === 'function' ? new WeakMap() : null;
            if (owner) {
                G3.COURSES.forEach(function (c) {
                    c.holes.forEach(function (h) { owner.set(h, c.id); });
                });
                if (G3.RANGE_COURSE) G3.RANGE_COURSE.holes.forEach(function (h) { owner.set(h, 'range'); });
            }
        }
        return owner ? owner.get(hole) : undefined;
    }

    function worldName(id) {
        var I = G3.PORTAL_INDEX || [];
        for (var i = 0; i < I.length; i++) if (I[i][0] === id) return I[i][1];
        return null;
    }

    /* The design a hole flies, as a fresh object with its `key`. */
    function designFor(hole, themeName) {
        var id = hole ? courseOf(hole) : undefined, sub;
        if (!id && hole) {
            if (hole.endless) id = 'endless';
            else if (hole.forge) id = 'forge';
            else if (hole.place) id = 'tour';
            else if (themeName === 'lagoon') id = hole.longGame ? 'keys' : 'tidewater';
            else id = THEME_DESIGN[themeName];
        }
        var d = DESIGNS[id] || DESIGNS.house, out = {}, k;
        for (k in d) out[k] = d[k];
        if ((id === 'tour' || id === 'forge') && hole && hole.place) {
            sub = worldName(hole.place.world);
            out.sub = sub || (id === 'tour' ? 'Golf Inc.' : 'Made by hand');
        }
        out.id = DESIGNS[id] ? id : 'house';
        out.key = out.id + '|' + (out.sub || '');
        return out;
    }

    /* ── painting ───────────────────────────────────────────────────────── */

    var FONT = '"Barlow Semi Condensed", "Arial Narrow", "Helvetica Neue", Arial, sans-serif';

    function star(g, x, y, r, pts) {
        g.beginPath();
        for (var i = 0; i < pts * 2; i++) {
            var a = -Math.PI / 2 + i * Math.PI / pts, rr = i % 2 ? r * 0.45 : r;
            g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        g.closePath();
        g.fill();
    }

    // A tiny repeatable random, so a flag is painted the same every time.
    function rng(seed) {
        var s = seed >>> 0 || 1;
        return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    }

    function motif(g, d, W, H, x0) {
        var a = d.accent, i, x, y, r, rand = rng(d.id.length * 977 + W);
        g.save();
        g.fillStyle = a;
        g.strokeStyle = a;
        switch (d.motif) {
        case 'stripes':
            g.globalAlpha = 0.9;
            g.fillRect(x0, H * 0.06, W, H * 0.06);
            g.fillRect(x0, H * 0.88, W, H * 0.06);
            break;
        case 'waves':
            g.globalAlpha = 0.35;
            for (var b = 0; b < 2; b++) {
                g.beginPath();
                g.moveTo(x0, H);
                for (x = x0; x <= W; x += 4) {
                    g.lineTo(x, H * (0.84 + b * 0.07) + Math.sin(x / W * Math.PI * 6 + b * 1.7) * H * 0.035);
                }
                g.lineTo(W, H);
                g.closePath();
                g.fill();
            }
            break;
        case 'hazard':
            g.beginPath();
            g.rect(x0, 0, W, H * 0.13);
            g.rect(x0, H * 0.87, W, H * 0.13);
            g.clip();
            for (x = x0 - H; x < W + H; x += H * 0.2) {
                g.beginPath();
                g.moveTo(x, 0); g.lineTo(x + H * 0.1, 0); g.lineTo(x + H * 0.1 + H, H); g.lineTo(x + H, H);
                g.closePath();
                g.fill();
            }
            break;
        case 'cog':
            g.globalAlpha = 0.22;
            x = W * 0.8; y = H * 0.5; r = H * 0.42;
            g.beginPath();
            for (i = 0; i < 24; i++) {
                var ang = i / 24 * Math.PI * 2, rr = i % 2 ? r : r * 0.82;
                g.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
            }
            g.closePath();
            g.fill();
            g.globalAlpha = 1;
            g.fillStyle = d.cloth;            // the hub, in the cloth's own colour
            g.beginPath(); g.arc(x, y, r * 0.38, 0, Math.PI * 2); g.fill();
            break;
        case 'stars':
            for (i = 0; i < 16; i++) {
                g.globalAlpha = 0.35 + rand() * 0.5;
                star(g, x0 + rand() * (W - x0), rand() * H, H * (0.018 + rand() * 0.035), 5);
            }
            break;
        case 'ring':
            g.globalAlpha = 0.5;
            g.lineWidth = H * 0.025;
            g.beginPath(); g.arc(W * 0.55, H * 0.5, H * 0.44, 0, Math.PI * 2); g.stroke();
            for (i = 0; i < 12; i++) {
                var t = i / 12 * Math.PI * 2;
                g.beginPath();
                g.moveTo(W * 0.55 + Math.cos(t) * H * 0.40, H * 0.5 + Math.sin(t) * H * 0.40);
                g.lineTo(W * 0.55 + Math.cos(t) * H * 0.35, H * 0.5 + Math.sin(t) * H * 0.35);
                g.stroke();
            }
            break;
        case 'snow':
            for (i = 0; i < 40; i++) {
                g.globalAlpha = 0.5 + rand() * 0.5;
                g.beginPath(); g.arc(x0 + rand() * (W - x0), rand() * H, H * (0.008 + rand() * 0.014), 0, Math.PI * 2); g.fill();
            }
            break;
        case 'flames':
            g.beginPath();
            g.moveTo(x0, H);
            for (x = x0, i = 0; x <= W + 20; x += W * 0.05, i++) {
                g.lineTo(x, H * (i % 2 ? 0.70 + rand() * 0.06 : 0.86));
            }
            g.lineTo(W, H);
            g.closePath();
            g.fill();
            g.fillStyle = '#ffd04a';
            g.beginPath();
            g.moveTo(x0, H);
            for (x = x0 + W * 0.025, i = 0; x <= W + 20; x += W * 0.05, i++) {
                g.lineTo(x, H * (i % 2 ? 0.82 + rand() * 0.04 : 0.93));
            }
            g.lineTo(W, H);
            g.closePath();
            g.fill();
            break;
        case 'pennant':
            g.globalAlpha = 0.9;
            g.lineWidth = H * 0.018;
            g.strokeRect(x0 + H * 0.05, H * 0.07, W - x0 - H * 0.12, H * 0.86);
            break;
        case 'check':
            var cs = H / 8;
            for (y = 0; y < 8; y++) {
                for (x = 0; x < 2; x++) if ((x + y) % 2 === 0) g.fillRect(W - cs * (x + 1), y * cs, cs, cs);
            }
            break;
        case 'mesa':
            g.globalAlpha = 0.6;
            g.beginPath();
            g.moveTo(x0, H);
            g.lineTo(x0, H * 0.86); g.lineTo(W * 0.3, H * 0.86); g.lineTo(W * 0.36, H * 0.76);
            g.lineTo(W * 0.62, H * 0.76); g.lineTo(W * 0.68, H * 0.86); g.lineTo(W * 0.8, H * 0.86);
            g.lineTo(W * 0.84, H * 0.80); g.lineTo(W * 0.94, H * 0.80); g.lineTo(W, H * 0.88); g.lineTo(W, H);
            g.closePath();
            g.fill();
            break;
        case 'peaks':
            g.globalAlpha = 0.85;
            g.beginPath();
            g.moveTo(x0, H);
            g.lineTo(x0, H * 0.92); g.lineTo(W * 0.32, H * 0.72); g.lineTo(W * 0.46, H * 0.84);
            g.lineTo(W * 0.66, H * 0.64); g.lineTo(W * 0.86, H * 0.86); g.lineTo(W, H * 0.78); g.lineTo(W, H);
            g.closePath();
            g.fill();
            break;
        case 'target':
            g.globalAlpha = 0.25;
            for (i = 4; i > 0; i--) {
                g.globalAlpha = i % 2 ? 0.25 : 0.12;
                g.beginPath(); g.arc(W * 0.84, H * 0.5, H * 0.11 * i, 0, Math.PI * 2); g.fill();
            }
            break;
        case 'globe':
            g.globalAlpha = 0.28;
            g.lineWidth = H * 0.014;
            x = W * 0.82; y = H * 0.5; r = H * 0.36;
            g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
            for (i = 1; i < 3; i++) {
                g.beginPath(); g.ellipse(x, y, r * i / 3, r, 0, 0, Math.PI * 2); g.stroke();
                g.beginPath(); g.moveTo(x - r, y + (i - 1.5) * r * 0.9); g.lineTo(x + r, y + (i - 1.5) * r * 0.9); g.stroke();
            }
            g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.stroke();
            break;
        case 'infinity':
            g.globalAlpha = 0.22;
            g.font = '700 ' + Math.round(H * 0.9) + 'px ' + FONT;
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillText('∞', W * 0.6, H * 0.52);
            break;
        case 'grid':
            g.globalAlpha = 0.35;
            g.lineWidth = Math.max(1, H * 0.006);
            for (x = x0; x < W; x += H / 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
            for (y = 0; y < H; y += H / 8) { g.beginPath(); g.moveTo(x0, y); g.lineTo(W, y); g.stroke(); }
            break;
        }
        g.restore();
    }

    // Sets the biggest font no larger than `px` that keeps `text` inside `max`.
    function fit(g, text, weight, px, max) {
        var size = px;
        g.font = weight + ' ' + Math.round(size) + 'px ' + FONT;
        var w = g.measureText(text).width;
        if (w > max) {
            size = Math.max(8, size * max / w);
            g.font = weight + ' ' + Math.round(size) + 'px ' + FONT;
        }
        return size;
    }

    /* Draws design `d` on a canvas: the front in the top half and the back
       in the bottom half (render.js picks the half by which face it is
       drawing). The back is the front laid out in a mirror — sleeve on the
       right, where the pole is from that side — with the type the right way
       round. Each half is painted in a space `aspect` times as wide as it is
       tall and squeezed into the canvas, so a power-of-two canvas can carry
       a flag that is not 2:1 without the type or the circles stretching. */
    function paint(canvas, d, aspect) {
        var g = canvas.getContext('2d'), CW = canvas.width, CH = canvas.height / 2;
        var H = CH, W = Math.round(H * (aspect || 1.77)), sx = CW / W;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, CW, CH * 2);
        for (var half = 0; half < 2; half++) {
            var back = half === 1;
            // The cloth, the motif and the sleeve: mirrored on the back.
            g.setTransform(back ? -sx : sx, 0, 0, 1, back ? CW : 0, half * CH);
            cloth(g, d, W, H);
            // The type, never mirrored.
            g.setTransform(sx, 0, 0, 1, 0, half * CH);
            type(g, d, W, H, back);
        }
        g.setTransform(1, 0, 0, 1, 0, 0);
        return canvas;
    }

    var SLEEVE = 0.055;        // of the flag's width

    function cloth(g, d, W, H) {
        var sleeve = Math.round(W * SLEEVE);
        g.save();
        g.beginPath(); g.rect(0, 0, W, H); g.clip();
        g.fillStyle = d.cloth;
        g.fillRect(0, 0, W, H);
        motif(g, d, W, H, sleeve);

        // The sleeve the pole goes through, with its stitching.
        g.fillStyle = 'rgba(0,0,0,0.18)';
        g.fillRect(0, 0, sleeve, H);
        g.fillStyle = 'rgba(255,255,255,0.10)';
        g.fillRect(sleeve * 0.15, 0, sleeve * 0.25, H);
        g.strokeStyle = 'rgba(0,0,0,0.25)';
        g.lineWidth = Math.max(1, W / 400);
        g.setLineDash([W / 90, W / 120]);
        g.beginPath(); g.moveTo(sleeve + W * 0.01, 0); g.lineTo(sleeve + W * 0.01, H); g.stroke();
        g.setLineDash([]);

        // A whisper of weave over everything, so it reads as cloth up close.
        g.globalAlpha = 0.05;
        g.fillStyle = '#000';
        var step = Math.max(2, Math.round(H / 144));
        for (var yy = 0; yy < H; yy += step * 2) g.fillRect(0, yy, W, step);
        g.restore();
    }

    // One or two lines and the small one, stacked and centred off the sleeve.
    function type(g, d, W, H, back) {
        var sleeve = W * SLEEVE;
        var cx = back ? (W - sleeve) / 2 : sleeve + (W - sleeve) / 2, max = (W - sleeve) * 0.84;
        var rows = d.lines.map(function (l) { return { text: l[0], px: l[1] * H, weight: '800' }; });
        if (d.sub) rows.push({ text: d.sub, px: H * 0.085, weight: '600', sub: true });
        var gap = H * 0.035, total = 0;
        rows.forEach(function (r) { r.size = fit(g, r.text, r.weight, r.px, max); total += r.size * 0.86; });
        total += gap * (rows.length - 1);
        var y = H / 2 - total / 2;
        g.save();
        g.textAlign = 'center';
        g.textBaseline = 'alphabetic';
        rows.forEach(function (r) {
            g.font = r.weight + ' ' + Math.round(r.size) + 'px ' + FONT;
            y += r.size * 0.86;
            // A faint shadow under the ink, as a print sits in the weave.
            g.fillStyle = 'rgba(0,0,0,0.22)';
            g.fillText(r.text, cx + r.size * 0.03, y + r.size * 0.03);
            g.fillStyle = d.ink;
            g.globalAlpha = r.sub ? 0.88 : 1;
            g.fillText(r.text, cx, y);
            g.globalAlpha = 1;
            y += gap;
        });
        g.restore();
    }

    /* The font the type is set in has to be loaded before a canvas can use
       it; `whenFont(cb)` calls back once it is (or straight away when it
       already is, or when the browser cannot say). */
    function whenFont(cb) {
        var spec = '800 40px "Barlow Semi Condensed"';
        try {
            if (!document.fonts || document.fonts.check(spec)) return false;
            document.fonts.load(spec).then(function () { cb(); }, function () {});
            return true;
        } catch (e) { return false; }
    }

    /* ── the cloth ──────────────────────────────────────────────────────── */

    var STEP = 1 / 90;         // the substep, seconds
    var GRAVITY = 9.8;
    var DAMP = 0.992;          // velocity kept per substep
    var AERO = 6.0;            // air pressure per unit (normal speed × speed), per unit of cloth mass
    var MAX_ACC = 300;         // nothing in the air pushes harder than this
    var MAX_AIR = 24;          // …nor blows faster

    /* A cols × rows sheet w wide and h tall, hoist at x = 0 hanging down
       from y = 0, lying in the z = 0 plane. */
    function create(cols, rows, w, h) {
        var n = cols * rows, i, j, k;
        var c = {
            cols: cols, rows: rows, w: w, h: h, n: n,
            pos: new Float32Array(n * 3), prev: new Float32Array(n * 3),
            rest: new Float32Array(n * 3), acc: new Float32Array(n * 3),
            pinned: new Uint8Array(n), left: 0, t: 0, iters: 6
        };
        for (j = 0; j < rows; j++) {
            for (i = 0; i < cols; i++) {
                k = j * cols + i;
                c.rest[k * 3] = i / (cols - 1) * w;
                c.rest[k * 3 + 1] = -j / (rows - 1) * h;
                c.rest[k * 3 + 2] = 0;
                c.pinned[k] = i === 0 ? 1 : 0;
            }
        }
        var A = [], B = [], L = [], S = [];
        function link(i0, j0, i1, j1, stiff) {
            if (i1 < 0 || i1 >= cols || j1 < 0 || j1 >= rows) return;
            var a = j0 * cols + i0, b = j1 * cols + i1;
            if (c.pinned[a] && c.pinned[b]) return;
            var dx = c.rest[b * 3] - c.rest[a * 3], dy = c.rest[b * 3 + 1] - c.rest[a * 3 + 1];
            A.push(a); B.push(b); L.push(Math.sqrt(dx * dx + dy * dy)); S.push(stiff);
        }
        for (j = 0; j < rows; j++) {
            for (i = 0; i < cols; i++) {
                link(i, j, i + 1, j, 1);         // stretch
                link(i, j, i, j + 1, 1);
                link(i, j, i + 1, j + 1, 0.03);  // shear: barely there, as in a weave
                link(i + 1, j, i, j + 1, 0.03);
                link(i, j, i + 2, j, 0.2);       // bend: soft, so it can fold
                link(i, j, i, j + 2, 0.2);
            }
        }
        c.ca = new Int32Array(A); c.cb = new Int32Array(B);
        c.cl = new Float32Array(L); c.cs = new Float32Array(S);
        pose(c, 0);
        return c;
    }

    /* Lays the sheet out flat, turned `yaw` about the pole (0 = along +x,
       turning as three.js turns about y), hanging a little, and at rest. */
    function pose(c, yaw) {
        var cs = Math.cos(yaw), sn = Math.sin(yaw), k, x, y, droop;
        for (k = 0; k < c.n; k++) {
            x = c.rest[k * 3];
            y = c.rest[k * 3 + 1];
            droop = 0.5 * x * x / (c.w || 1);
            c.pos[k * 3] = x * cs;
            c.pos[k * 3 + 1] = y - droop;
            c.pos[k * 3 + 2] = -x * sn;
            if (c.pinned[k]) { c.pos[k * 3] = x; c.pos[k * 3 + 1] = y; c.pos[k * 3 + 2] = 0; }
        }
        c.prev.set(c.pos);
        c.left = 0;
    }

    /* One substep. `air` is the air's velocity through the pole's frame. */
    function substep(c, air) {
        var P = c.pos, Q = c.prev, F = c.acc, cols = c.cols, rows = c.rows;
        var h = STEP, inv = 1 / h, n = c.n, k, i, j;
        var mass = (c.w * c.h) / n;            // per particle, in units of cloth areal density
        c.t += h;
        for (k = 0; k < n; k++) { F[k * 3] = 0; F[k * 3 + 1] = -GRAVITY; F[k * 3 + 2] = 0; }

        // The air through every triangle: a gust that travels down the
        // cloth, and a little sideways flutter, so a steady wind still flaps.
        var t = c.t, ax0 = air.x, ay0 = air.y, az0 = air.z;
        var speed0 = Math.sqrt(ax0 * ax0 + ay0 * ay0 + az0 * az0);
        for (j = 0; j < rows - 1; j++) {
            for (i = 0; i < cols - 1; i++) {
                var a = j * cols + i, b = a + 1, d = a + cols, e = d + 1;
                var gust = 1 + 0.22 * Math.sin(t * 6.3 - i * 0.9 + j * 0.4) + 0.12 * Math.sin(t * 2.1 + j);
                var side = (speed0 * 0.07 + 0.25) * Math.sin(t * 9.7 - i * 1.3);
                tri(a, b, d, gust, side);
                tri(b, e, d, gust, side);
            }
        }
        function tri(p0, p1, p2, gust, side) {
            var x0 = P[p0 * 3], y0 = P[p0 * 3 + 1], z0 = P[p0 * 3 + 2];
            var ux = P[p1 * 3] - x0, uy = P[p1 * 3 + 1] - y0, uz = P[p1 * 3 + 2] - z0;
            var vx = P[p2 * 3] - x0, vy = P[p2 * 3 + 1] - y0, vz = P[p2 * 3 + 2] - z0;
            var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
            var len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            if (len < 1e-9) return;
            var area = len * 0.5;
            nx /= len; ny /= len; nz /= len;
            // The triangle's own velocity, the mean of its corners'.
            var vxm = ((P[p0 * 3] - Q[p0 * 3]) + (P[p1 * 3] - Q[p1 * 3]) + (P[p2 * 3] - Q[p2 * 3])) * inv / 3;
            var vym = ((P[p0 * 3 + 1] - Q[p0 * 3 + 1]) + (P[p1 * 3 + 1] - Q[p1 * 3 + 1]) + (P[p2 * 3 + 1] - Q[p2 * 3 + 1])) * inv / 3;
            var vzm = ((P[p0 * 3 + 2] - Q[p0 * 3 + 2]) + (P[p1 * 3 + 2] - Q[p1 * 3 + 2]) + (P[p2 * 3 + 2] - Q[p2 * 3 + 2])) * inv / 3;
            var rx = ax0 * gust - vxm, ry = ay0 * gust - vym, rz = az0 * gust + side - vzm;
            var rs = Math.sqrt(rx * rx + ry * ry + rz * rz);
            var vn = nx * rx + ny * ry + nz * rz;
            var f = AERO * vn * rs * area / (3 * mass);
            // Plus a touch of skin friction along the air, which is what
            // turns a sheet edge-on to the wind back round into it.
            var s = 0.06 * rs * area / (3 * mass);
            var fx = nx * f + rx * s, fy = ny * f + ry * s, fz = nz * f + rz * s;
            F[p0 * 3] += fx; F[p0 * 3 + 1] += fy; F[p0 * 3 + 2] += fz;
            F[p1 * 3] += fx; F[p1 * 3 + 1] += fy; F[p1 * 3 + 2] += fz;
            F[p2 * 3] += fx; F[p2 * 3 + 1] += fy; F[p2 * 3 + 2] += fz;
        }

        // Verlet.
        var h2 = h * h;
        for (k = 0; k < n; k++) {
            if (c.pinned[k]) continue;
            var fx2 = F[k * 3], fy2 = F[k * 3 + 1], fz2 = F[k * 3 + 2];
            var fm = Math.sqrt(fx2 * fx2 + fy2 * fy2 + fz2 * fz2);
            if (fm > MAX_ACC) { fx2 *= MAX_ACC / fm; fy2 *= MAX_ACC / fm; fz2 *= MAX_ACC / fm; }
            for (var ax = 0; ax < 3; ax++) {
                var q = k * 3 + ax, p = P[q];
                P[q] = p + (p - Q[q]) * DAMP + (ax === 0 ? fx2 : ax === 1 ? fy2 : fz2) * h2;
                Q[q] = p;
            }
        }

        // The constraints, relaxed in turn; the hoist goes back on the pole.
        var CA = c.ca, CB = c.cb, CL = c.cl, CS = c.cs, m = CA.length, it, pa, pb;
        for (it = 0; it < c.iters; it++) {
            for (var r = 0; r < m; r++) {
                pa = CA[r]; pb = CB[r];
                var dx = P[pb * 3] - P[pa * 3], dy = P[pb * 3 + 1] - P[pa * 3 + 1], dz = P[pb * 3 + 2] - P[pa * 3 + 2];
                var dl = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dl < 1e-9) continue;
                var diff = (dl - CL[r]) / dl * CS[r];
                var wa = c.pinned[pa] ? 0 : 1, wb = c.pinned[pb] ? 0 : 1, ws = wa + wb;
                if (!ws) continue;
                var ka = diff * wa / ws, kb = diff * wb / ws;
                P[pa * 3] += dx * ka; P[pa * 3 + 1] += dy * ka; P[pa * 3 + 2] += dz * ka;
                P[pb * 3] -= dx * kb; P[pb * 3 + 1] -= dy * kb; P[pb * 3 + 2] -= dz * kb;
            }
        }
        for (k = 0; k < n; k++) {
            if (!c.pinned[k]) continue;
            P[k * 3] = Q[k * 3] = c.rest[k * 3];
            P[k * 3 + 1] = Q[k * 3 + 1] = c.rest[k * 3 + 1];
            P[k * 3 + 2] = Q[k * 3 + 2] = 0;
        }
    }

    /* Advances the cloth by `dt` seconds of air `air` ({x, y, z}, units a
       second, in the pole's frame) in fixed substeps — at most eight a call,
       so a long hitch is dropped rather than paid for. A sheet that has gone
       non-finite (it never should) is laid out again downwind. */
    var _air = { x: 0, y: 0, z: 0 };
    function step(c, dt, air) {
        var ax = isFinite(air.x) ? air.x : 0, ay = isFinite(air.y) ? air.y : 0, az = isFinite(air.z) ? air.z : 0;
        var s = Math.sqrt(ax * ax + ay * ay + az * az), k = s > MAX_AIR ? MAX_AIR / s : 1;
        _air.x = ax * k; _air.y = ay * k; _air.z = az * k;
        c.left = Math.min(c.left + Math.max(0, dt || 0), STEP * 8);
        var steps = 0;
        while (c.left >= STEP) { substep(c, _air); c.left -= STEP; steps++; }
        var last = c.pos[c.n * 3 - 1] + c.pos[c.n * 3 - 2];
        if (!isFinite(last)) pose(c, Math.atan2(-_air.z, _air.x));
        return steps;
    }

    // Runs `secs` of the same air at once — a hole's flag starts flying.
    function settle(c, secs, air) {
        var yaw = Math.atan2(-air.z, air.x);
        pose(c, isFinite(yaw) ? yaw : 0);
        for (var t = 0; t < secs; t += STEP * 8) step(c, STEP * 8, air);
    }

    /* ── level of detail: a finer sheet drawn through the coarse one ─────

       Up close the flag is drawn on a grid `k` times finer, every vertex a
       Catmull-Rom blend of the sixteen particles round it, so a fold is a
       curve and not a crease; the simulation itself stays coarse. `smooth`
       builds the weights once and `fill` writes the positions each frame. */
    function smooth(c, k) {
        function axis(nCoarse) {
            var nf = (nCoarse - 1) * k + 1, idx = new Int32Array(nf * 4), wt = new Float32Array(nf * 4);
            for (var f = 0; f < nf; f++) {
                var g = f / k, i1 = Math.min(nCoarse - 2, Math.floor(g)), t = g - i1;
                var t2 = t * t, t3 = t2 * t;
                var w = [(-t3 + 2 * t2 - t) / 2, (3 * t3 - 5 * t2 + 2) / 2, (-3 * t3 + 4 * t2 + t) / 2, (t3 - t2) / 2];
                for (var q = 0; q < 4; q++) {
                    idx[f * 4 + q] = Math.max(0, Math.min(nCoarse - 1, i1 - 1 + q));
                    wt[f * 4 + q] = w[q];
                }
            }
            return { n: nf, idx: idx, wt: wt };
        }
        return { k: k, x: axis(c.cols), y: axis(c.rows) };
    }

    function fill(c, S, out) {
        var X = S.x, Y = S.y, P = c.pos, cols = c.cols, o = 0;
        for (var fj = 0; fj < Y.n; fj++) {
            for (var fi = 0; fi < X.n; fi++) {
                var px = 0, py = 0, pz = 0;
                for (var b = 0; b < 4; b++) {
                    var wy = Y.wt[fj * 4 + b], row = Y.idx[fj * 4 + b] * cols;
                    if (!wy) continue;
                    for (var a = 0; a < 4; a++) {
                        var w = wy * X.wt[fi * 4 + a];
                        if (!w) continue;
                        var p = (row + X.idx[fi * 4 + a]) * 3;
                        px += P[p] * w; py += P[p + 1] * w; pz += P[p + 2] * w;
                    }
                }
                out[o++] = px; out[o++] = py; out[o++] = pz;
            }
        }
        return out;
    }

    G3.flag = {
        HOUSE: HOUSE,
        DESIGNS: DESIGNS,
        designFor: designFor,
        paint: paint,
        whenFont: whenFont,
        create: create,
        pose: pose,
        step: step,
        settle: settle,
        smooth: smooth,
        fill: fill,
        STEP: STEP
    };
})(window.G3 = window.G3 || {});
