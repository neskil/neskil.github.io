/* Scenery: what a course looks like, as opposed to what it does.

   Every hole is boxes, posts, polygons and two points, and physics.js never
   needs to know any more than that. A player does: a field of flat blue
   rectangles is a diagram of a hole rather than a place, and five courses
   drawn in one palette are one course wearing five names. So each card has a
   *biome* — parkland, garden, seaside, woodland, meadow, autumn, winter,
   the mountain, desert, a volcano, a moonlit night — and this file is everything the renderer needs
   to dress a hole in one: the palettes and materials, the outline of each
   hazard as one rounded shape rather than a stack of rectangles, and where
   the decoration goes.

   It is DOM-free and deterministic, which is what lets tests.html hold it to
   the one rule decoration has to keep: it may never sit where it could hide
   the ball, the cup, the tee or a tunnel mouth. Flat things (flowers in the
   grass, lily pads on a pond) may go anywhere they are not in the way; the
   only things that stand over the field are tree canopies at its edge, and
   those are kept well clear of every point a hole is about and fade when the
   ball rolls under them. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;
    var P = GOLF.physics;

    /* ── the biomes ─────────────────────────────────────────────────────

       Turf is a hue/saturation/lightness the hole number drifts a few
       degrees around; water, sand and rough are fills the renderer uses as
       given. `wall` and `bumper` name a material and a cap the renderer
       knows how to draw. A bumper keeps its pulsing orange ring in every
       biome — the ring is the part the ball meets, and "livelier than a wall"
       has to read the same on every card.

       What grows where is two lists. `border` is the showy dressing —
       flowers, shells, toadstools — and it grows only round the edges of a
       hole: in the rough, along the cushion, at the foot of a wall. `lawn` is
       what is allowed out on the open fairway, and it is all quiet: clover, a
       leaf, a pebble, drawn faint. The fairway is where the ball is read, and
       a daisy the size of a ball beside it is a second ball.

       Water has two looks. The fills above are the plain one, drawn where
       the browser has no WebGL; `bank`, `bed` and `sky` are for water.js,
       which draws the surface as a shader — the bank's face above the
       waterline, the bed seen through the water, the sky it reflects — and
       `clear`, `flow` and `skin` say how clear it is, whether it runs, and
       whether it has frozen at the edges.

       The rest is the air over the course. `ambient` is what lives in it,
       drawn by ambience.js; `sound` the soundscape audio.js plays under the
       shots; `clouds` how many shadows drift over; `grade` a tint of light
       across the whole field, from the screen's lit corner to its far one;
       and `night` makes it dark, with the lamps lit. */
    var THEMES = {
        parkland: {
            name: 'Parkland',
            turf: { h: 132, s: 46, l: 33 },
            rough: { fill: 'rgba(9, 46, 22, 0.55)', tuft: 'rgba(126, 200, 130, 0.30)', edge: 'rgba(8, 40, 20, 0.5)' },
            sand: { base: '#e3ca92', rake: 'rgba(160, 125, 60, 0.18)', lip: 'rgba(120, 90, 40, 0.35)' },
            water: { kind: 'pond', top: '#1b6d9e', deep: '#0e4468', wave: 'rgba(190, 235, 255, 0.22)', shore: 'rgba(226, 202, 146, 0.85)', bank: '#5d4a2f', bed: '#8a7a55', sky: '#bfe3f5' },
            wall: 'timber', bumper: 'brass', rim: 'paint', canopy: 'oak',
            border: ['daisy', 'daisy', 'clover'], lawn: ['clover'],
            leaves: ['#6f8f3a', '#8a7b3a', '#5e7d33'],
            ambient: [{ kind: 'butterfly', n: 2 }, { kind: 'bird', n: 1 }], sound: ['birds'],
            backdrop: '#05150c', plan: '#2e6b41'
        },
        garden: {
            name: 'Garden',
            turf: { h: 118, s: 50, l: 36 },
            rough: { fill: 'rgba(18, 60, 24, 0.5)', tuft: 'rgba(150, 215, 140, 0.32)', edge: 'rgba(20, 50, 20, 0.45)' },
            sand: { base: '#e8d4a6', rake: 'rgba(150, 120, 70, 0.16)', lip: 'rgba(130, 100, 50, 0.3)' },
            water: { kind: 'pond', top: '#1e8a8f', deep: '#0f5257', wave: 'rgba(200, 245, 240, 0.24)', shore: 'rgba(200, 190, 170, 0.9)', bank: '#8d8676', bed: '#9a8f70', sky: '#c8eef0' },
            wall: 'brick', bumper: 'pot', rim: 'brick', canopy: 'blossom',
            border: ['flower', 'flower', 'flower', 'stone'], lawn: ['clover'],
            leaves: ['#6f8f3a', '#8a7b3a', '#5e7d33'],
            ambient: [{ kind: 'petal', n: 10 }, { kind: 'butterfly', n: 2 }], sound: ['birds'],
            backdrop: '#0b1610', plan: '#357a43'
        },
        seaside: {
            name: 'Seaside',
            turf: { h: 84, s: 40, l: 39 },
            rough: { fill: 'rgba(80, 90, 40, 0.42)', tuft: 'rgba(215, 220, 150, 0.38)', edge: 'rgba(70, 70, 30, 0.4)' },
            sand: { base: '#f0dfb4', rake: 'rgba(170, 140, 90, 0.16)', lip: 'rgba(150, 120, 70, 0.28)' },
            water: { kind: 'sea', top: '#1ba9bd', deep: '#0b4f74', wave: 'rgba(225, 252, 255, 0.30)', shore: 'rgba(245, 230, 190, 0.95)', edge: 'rocks', pads: false, duck: false, bank: '#d6bd88', bed: '#e9d7a7', sky: '#d6f6ff', clear: 1.4 },
            wall: 'driftwood', bumper: 'buoy', rim: 'plank', canopy: 'palm',
            border: ['shell', 'shell', 'starfish', 'pebble'], lawn: ['pebble'],
            leaves: ['#6f8f3a', '#8a7b3a', '#5e7d33'],
            ambient: [{ kind: 'gull', n: 2 }], sound: ['sea', 'gulls'],
            backdrop: '#052126', plan: '#5f7f3d'
        },
        woodland: {
            name: 'Woodland',
            turf: { h: 140, s: 38, l: 27 },
            rough: { fill: 'rgba(10, 35, 18, 0.58)', tuft: 'rgba(110, 170, 110, 0.28)', edge: 'rgba(5, 25, 10, 0.55)' },
            sand: { base: '#cfb68a', rake: 'rgba(120, 95, 55, 0.2)', lip: 'rgba(100, 75, 40, 0.38)' },
            water: { kind: 'stream', top: '#24727d', deep: '#103a44', wave: 'rgba(180, 230, 230, 0.20)', shore: 'rgba(140, 115, 80, 0.85)', bank: '#4a3624', bed: '#6b5a3c', sky: '#a5cdc7', flow: 16 },
            wall: 'log', bumper: 'mushroom', rim: 'log', canopy: 'pine',
            border: ['leaf', 'leaf', 'cone', 'toadstool'], lawn: ['leaf'],
            leaves: ['#c2742f', '#d9a441', '#8a4b1f', '#b5502e', '#9a6b2a'],
            ambient: [{ kind: 'leaf', n: 6 }], sound: ['wind', 'woodpecker'],
            backdrop: '#040f0a', plan: '#28583a'
        },
        meadow: {
            name: 'Meadow',
            turf: { h: 100, s: 46, l: 36 },
            rough: { fill: 'rgba(40, 70, 20, 0.5)', tuft: 'rgba(190, 225, 130, 0.34)', edge: 'rgba(30, 55, 15, 0.45)' },
            sand: { base: '#e6cf98', rake: 'rgba(160, 125, 60, 0.17)', lip: 'rgba(120, 90, 40, 0.32)' },
            water: { kind: 'pond', top: '#2a7fa8', deep: '#164968', wave: 'rgba(200, 240, 255, 0.24)', shore: 'rgba(210, 195, 150, 0.85)', bank: '#6b5434', bed: '#8f7d52', sky: '#c6e8f7' },
            wall: 'hedge', bumper: 'hay', rim: 'hedge', canopy: 'willow',
            border: ['poppy', 'cornflower', 'daisy', 'poppy'], lawn: ['clover'],
            leaves: ['#6f8f3a', '#8a7b3a', '#5e7d33'],
            ambient: [{ kind: 'butterfly', n: 3 }, { kind: 'fluff', n: 9 }], sound: ['birds', 'crickets'],
            clouds: 3,
            backdrop: '#08170c', plan: '#4a7a35'
        },
        autumn: {
            name: 'Autumn',
            turf: { h: 86, s: 36, l: 33 },
            rough: { fill: 'rgba(72, 48, 16, 0.46)', tuft: 'rgba(226, 172, 92, 0.32)', edge: 'rgba(60, 38, 12, 0.45)' },
            sand: { base: '#dcc08a', rake: 'rgba(150, 110, 55, 0.18)', lip: 'rgba(120, 80, 35, 0.34)' },
            water: { kind: 'pond', top: '#2a6378', deep: '#13384a', wave: 'rgba(210, 235, 240, 0.20)', shore: 'rgba(170, 140, 95, 0.85)', pads: 'leaf', bank: '#5a4026', bed: '#7a6340', sky: '#ead6b4' },
            wall: 'stone', bumper: 'pumpkin', rim: 'stone', canopy: 'maple',
            border: ['leaf', 'leaf', 'leaf', 'toadstool'], lawn: ['leaf'],
            leaves: ['#d9622b', '#e8a33a', '#b8361f', '#c98a2e', '#8f3a1a'],
            ambient: [{ kind: 'leaf', n: 13 }], sound: ['wind', 'crows'],
            grade: { a: 'rgba(255, 176, 80, 0.12)', b: 'rgba(110, 40, 0, 0.10)' },
            backdrop: '#140d05', plan: '#6b6a2e'
        },
        winter: {
            name: 'Winter',
            turf: { h: 158, s: 20, l: 39, frost: 0.10 },
            rough: { fill: 'rgba(36, 52, 74, 0.46)', tuft: 'rgba(236, 246, 255, 0.46)', edge: 'rgba(28, 42, 62, 0.5)' },
            sand: { base: '#d7d0bf', rake: 'rgba(120, 110, 95, 0.18)', lip: 'rgba(90, 85, 75, 0.3)' },
            water: { kind: 'pond', top: '#2d6a8e', deep: '#15344d', wave: 'rgba(220, 240, 255, 0.22)', shore: 'rgba(240, 248, 255, 0.92)', edge: 'rocks', snow: true, pads: false, duck: false, bank: '#e3ecf2', bed: '#7d8a94', sky: '#dbe9f5', skin: true },
            wall: 'snowlog', bumper: 'snowman', rim: 'snow', canopy: 'snowpine',
            border: ['snowclump', 'snowclump', 'cone'], lawn: ['frost'],
            leaves: ['#6f8f3a', '#8a7b3a', '#5e7d33'],
            ambient: [{ kind: 'snow', n: 70 }], sound: ['wind'],
            clouds: 1,
            grade: { a: 'rgba(215, 232, 255, 0.10)', b: 'rgba(30, 60, 120, 0.12)' },
            backdrop: '#081320', plan: '#5c7c7c'
        },
        alpine: {
            name: 'Alpine',
            turf: { h: 150, s: 22, l: 40, frost: 0.14 },
            rough: { fill: 'rgba(214, 228, 240, 0.38)', tuft: 'rgba(255, 255, 255, 0.55)', edge: 'rgba(120, 145, 170, 0.45)' },
            // Deep snow, blue in its hollows: what the bunkers are up here.
            sand: { base: '#e6edf3', rake: 'rgba(110, 140, 180, 0.22)', lip: 'rgba(90, 120, 160, 0.32)' },
            water: { kind: 'pond', top: '#3a8fb0', deep: '#123a56', wave: 'rgba(225, 245, 255, 0.24)', shore: 'rgba(235, 244, 252, 0.92)', edge: 'rocks', snow: true, pads: false, duck: false, bank: '#d9e4ec', bed: '#6b7c88', sky: '#d4e6f5', clear: 1.3, skin: true },
            wall: 'granite', bumper: 'boulder', rim: 'granite', canopy: 'snowpine',
            border: ['snowclump', 'stone', 'cornflower', 'snowclump'], lawn: ['frost'],
            leaves: ['#6f8f3a', '#8a7b3a', '#5e7d33'],
            ambient: [{ kind: 'snow', n: 40 }, { kind: 'bird', n: 1 }], sound: ['wind'],
            clouds: 2,
            grade: { a: 'rgba(230, 240, 255, 0.10)', b: 'rgba(20, 50, 110, 0.14)' },
            backdrop: '#0a1626', plan: '#4f7570'
        },
        desert: {
            name: 'Desert',
            turf: { h: 76, s: 40, l: 36 },
            rough: { fill: 'rgba(150, 104, 48, 0.44)', tuft: 'rgba(242, 208, 142, 0.38)', edge: 'rgba(120, 78, 32, 0.45)' },
            sand: { base: '#eab77c', rake: 'rgba(170, 100, 40, 0.2)', lip: 'rgba(150, 80, 30, 0.32)' },
            water: { kind: 'pond', top: '#1fa5a8', deep: '#0b5a64', wave: 'rgba(220, 255, 250, 0.26)', shore: 'rgba(238, 205, 150, 0.92)', pads: false, duck: false, bank: '#c48a55', bed: '#e2c48e', sky: '#f3e4c4', clear: 1.5 },
            wall: 'sandstone', bumper: 'cactus', rim: 'adobe', canopy: 'acacia',
            border: ['pebble', 'stone', 'bloom', 'pebble'], lawn: ['pebble'],
            leaves: ['#8a7b3a', '#a08a4a', '#6f6a3a'],
            ambient: [{ kind: 'tumbleweed', n: 1 }, { kind: 'dust', n: 18 }], sound: ['wind'],
            clouds: 0,
            grade: { a: 'rgba(255, 196, 118, 0.13)', b: 'rgba(150, 50, 10, 0.10)' },
            backdrop: '#1a0f06', plan: '#8a7a3a'
        },
        volcanic: {
            name: 'Volcanic',
            turf: { h: 88, s: 22, l: 26 },
            rough: { fill: 'rgba(28, 20, 16, 0.5)', tuft: 'rgba(170, 160, 140, 0.30)', edge: 'rgba(20, 12, 8, 0.5)' },
            // Ash: grey, soft, and a ball goes nowhere in it.
            sand: { base: '#8f8983', rake: 'rgba(40, 36, 32, 0.22)', lip: 'rgba(25, 20, 16, 0.38)' },
            // Where a course here has water it is a hot spring.
            water: { kind: 'pond', top: '#2bb3a4', deep: '#0d5856', wave: 'rgba(230, 255, 250, 0.26)', shore: 'rgba(200, 190, 170, 0.8)', edge: 'rocks', pads: false, duck: false, bank: '#3a3230', bed: '#5a524a', sky: '#f2c9a2', clear: 1.3 },
            wall: 'basalt', bumper: 'obsidian', rim: 'basalt', canopy: 'charred',
            border: ['ember', 'stone', 'pebble', 'ember'], lawn: ['pebble'],
            leaves: ['#5a4a3a', '#6b5a44', '#4a3a2a'],
            ambient: [{ kind: 'ember', n: 26 }, { kind: 'ash', n: 30 }], sound: ['rumble', 'blorp'],
            clouds: 0,
            grade: { a: 'rgba(255, 140, 60, 0.10)', b: 'rgba(70, 0, 0, 0.16)' },
            backdrop: '#140806', plan: '#4e4a33'
        },
        night: {
            name: 'Moonlit',
            turf: { h: 150, s: 32, l: 28 },
            rough: { fill: 'rgba(4, 22, 26, 0.5)', tuft: 'rgba(120, 190, 170, 0.26)', edge: 'rgba(2, 16, 20, 0.5)' },
            sand: { base: '#cbc2a2', rake: 'rgba(110, 100, 80, 0.2)', lip: 'rgba(80, 70, 55, 0.34)' },
            water: { kind: 'pond', top: '#1a5276', deep: '#0a2340', wave: 'rgba(205, 225, 255, 0.24)', shore: 'rgba(170, 175, 160, 0.7)', duck: false, moon: true, bank: '#252b33', bed: '#2e3a3a', sky: '#22345a' },
            wall: 'timber', bumper: 'lamp', rim: 'night', canopy: 'nightoak',
            border: ['daisy', 'clover', 'clover'], lawn: ['clover'],
            leaves: ['#4f6f3a', '#5a6b3a', '#3e5d33'],
            ambient: [{ kind: 'firefly', n: 22 }], sound: ['crickets', 'owl'],
            clouds: 0,
            night: { dark: 'rgba(6, 10, 36, 0.46)', far: 'rgba(4, 6, 26, 0.62)' },
            backdrop: '#03060f', plan: '#24455a'
        }
    };
    var ORDER = ['parkland', 'garden', 'seaside', 'woodland', 'meadow', 'autumn', 'winter', 'alpine', 'desert', 'volcanic', 'night'];
    ORDER.forEach(function (k) { THEMES[k].id = k; });

    /* The biome a course is drawn in. A card names its own; the draw takes
       one from its seed, so a re-deal can come up as the seaside and a link
       to a seed always comes up as the same place. Anything else — the
       editor's draft, a playtest — is parkland, which is how the game has
       always looked. A hole that names a biome of its own wears that one
       instead of its card's. */
    function themeOf(course, hole) {
        // A hole may wear a biome of its own: the Short Six walks a first
        // visit through the places the rest of the rack is set in.
        if (hole && hole.theme && THEMES[hole.theme]) return THEMES[hole.theme];
        if (!course) return THEMES.parkland;
        if (course.theme && THEMES[course.theme]) return THEMES[course.theme];
        if (typeof course.seed === 'number') return THEMES[ORDER[course.seed % ORDER.length]];
        return THEMES.parkland;
    }

    function themeNamed(name) { return THEMES[name] || THEMES.parkland; }

    /* ── outlines ───────────────────────────────────────────────────────

       A lake on the board is a list of rectangles that overlap, and drawn
       one by one it is a staircase of boxes with a seam wherever two meet.
       What a player should see is the lake: one shape, one shoreline. This
       turns a list of zones into the loops that bound their union — the
       rectangles merged on the grid of their own edges, every polygon as a
       loop of its own — which the renderer then draws as a single path with
       its corners rounded off.

       Every loop comes back clockwise on screen, except the holes a ring of
       rectangles leaves in its middle (an island in a moat), which run the
       other way. Filled as one non-zero path, overlaps add up and islands
       stay dry. */
    function outline(list, bleed) {
        var rects = [], loops = [];
        for (var i = 0; i < list.length; i++) {
            var z = bleed ? bleedZone(list[i]) : list[i];
            if (z.pts) loops.push(clockwise(toPoints(z.pts)));
            else rects.push(z);
        }
        return rectLoops(rects).concat(loops);
    }

    /* A zone that runs to the edge of the field is not bounded there — the
       cushion is. Drawn as it stands, a lake that meets the cushion grows a
       shoreline along it, and its rounded corners leave notches of grass
       against the rim. So for the picture only, any side within a few pixels
       of the field's edge is pushed well past it, under the rim and off the
       canvas. */
    var BLEED = 40;

    function bleedZone(z) {
        if (z.pts) {
            var p = z.pts.slice();
            for (var i = 0; i < p.length; i += 2) {
                if (p[i] <= 2) p[i] = -BLEED; else if (p[i] >= C.WORLD_W - 2) p[i] = C.WORLD_W + BLEED;
                if (p[i + 1] <= 2) p[i + 1] = -BLEED; else if (p[i + 1] >= C.WORLD_H - 2) p[i + 1] = C.WORLD_H + BLEED;
            }
            return { pts: p };
        }
        var x0 = z.x <= 2 ? -BLEED : z.x, y0 = z.y <= 2 ? -BLEED : z.y;
        var x1 = z.x + z.w >= C.WORLD_W - 2 ? C.WORLD_W + BLEED : z.x + z.w;
        var y1 = z.y + z.h >= C.WORLD_H - 2 ? C.WORLD_H + BLEED : z.y + z.h;
        return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }

    function toPoints(flat) {
        var out = [];
        for (var i = 0; i + 1 < flat.length; i += 2) out.push({ x: flat[i], y: flat[i + 1] });
        return out;
    }

    // Shoelace, in screen coordinates (y down): positive is clockwise.
    function signedArea(pts) {
        var a = 0;
        for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) a += pts[j].x * pts[i].y - pts[i].x * pts[j].y;
        return a / 2;
    }

    function clockwise(pts) { return signedArea(pts) < 0 ? pts.slice().reverse() : pts; }

    function rectLoops(rects) {
        if (!rects.length) return [];
        var xs = [], ys = [], i, j, k;
        rects.forEach(function (r) { xs.push(r.x, r.x + r.w); ys.push(r.y, r.y + r.h); });
        xs = uniq(xs); ys = uniq(ys);
        var nx = xs.length - 1, ny = ys.length - 1;
        var cov = [];
        for (i = 0; i < nx; i++) {
            cov[i] = [];
            for (j = 0; j < ny; j++) {
                var cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + ys[j + 1]) / 2;
                cov[i][j] = false;
                for (k = 0; k < rects.length; k++) {
                    if (P.pointInRect(cx, cy, rects[k])) { cov[i][j] = true; break; }
                }
            }
        }
        function on(a, b) { return a >= 0 && b >= 0 && a < nx && b < ny && cov[a][b]; }

        // Every cell side with open ground beyond it is an edge of the union,
        // directed so the covered side is on its right: clockwise on screen.
        var edges = [], from = {};
        function edge(x1, y1, x2, y2) {
            var e = { x1: x1, y1: y1, x2: x2, y2: y2, used: false };
            edges.push(e);
            (from[x1 + ',' + y1] = from[x1 + ',' + y1] || []).push(e);
        }
        for (i = 0; i < nx; i++) {
            for (j = 0; j < ny; j++) {
                if (!cov[i][j]) continue;
                var x0 = xs[i], x1 = xs[i + 1], y0 = ys[j], y1 = ys[j + 1];
                if (!on(i, j - 1)) edge(x0, y0, x1, y0);
                if (!on(i + 1, j)) edge(x1, y0, x1, y1);
                if (!on(i, j + 1)) edge(x1, y1, x0, y1);
                if (!on(i - 1, j)) edge(x0, y1, x0, y0);
            }
        }

        var loops = [];
        edges.forEach(function (start) {
            if (start.used) return;
            var loop = [], e = start, guard = edges.length + 4;
            while (e && !e.used && guard-- > 0) {
                e.used = true;
                loop.push({ x: e.x1, y: e.y1 });
                var next = from[e.x2 + ',' + e.y2] || [];
                var dx = e.x2 - e.x1, dy = e.y2 - e.y1, pick = null, best = -Infinity;
                // Where two cells meet only at a corner, two edges leave the
                // same point; take the sharpest right turn, which keeps each
                // loop round its own cells instead of figure-of-eighting.
                for (var n = 0; n < next.length; n++) {
                    if (next[n].used) continue;
                    var ox = next[n].x2 - next[n].x1, oy = next[n].y2 - next[n].y1;
                    var turn = dx * oy - dy * ox;
                    if (turn > best) { best = turn; pick = next[n]; }
                }
                e = pick;
            }
            loops.push(simplify(loop));
        });
        return loops.filter(function (l) { return l.length >= 3; });
    }

    function uniq(a) {
        return a.sort(function (p, q) { return p - q; }).filter(function (v, i, s) { return i === 0 || v !== s[i - 1]; });
    }

    // Drop the points where a straight edge was only cut by the grid.
    function simplify(loop) {
        var out = [];
        for (var i = 0; i < loop.length; i++) {
            var a = loop[(i + loop.length - 1) % loop.length], b = loop[i], c = loop[(i + 1) % loop.length];
            if ((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x) !== 0) out.push(b);
        }
        return out;
    }

    /* ── decoration ─────────────────────────────────────────────────────

       All of it from a seed made of the hole itself, so a hole wears the
       same flowers every time it is loaded and the board does not shimmer
       on a replay. Three kinds:

         decals    flat on the grass or the rough: flowers, leaves, shells.
                   Never in a hazard, never near the tee, the cup or a mouth,
                   and never a flower out on the fairway — see `border`.
         shore     reeds, lily pads, foam and rocks — in the water, where the
                   ball has already been lost — and a duck on a big pond.
         canopies  the crowns of trees standing just off the field, reaching
                   over its edge: the one thing drawn *above* the ball, and so
                   the one held furthest from everything a hole is about.
         lamps     after dark, the lanterns along the cushion. */

    function rng(seed) {
        return function () {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    // A seed from the hole's own layout: same hole, same scenery.
    function holeSeed(hole) {
        var h = 2166136261;
        var s = Math.round(hole.tee.x) + ',' + Math.round(hole.tee.y) + ',' + Math.round(hole.hole.x) + ',' +
            Math.round(hole.hole.y) + ',' + (hole.name || '');
        for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
        return h >>> 0;
    }

    // Everything decoration must keep away from: the tee, the cup, both
    // mouths of every tunnel and every vent. `pad` is added to the clearance
    // each needs.
    function keepouts(hole) {
        var k = [{ x: hole.tee.x, y: hole.tee.y, r: 46 }, { x: hole.hole.x, y: hole.hole.y, r: 56 }];
        (hole.tunnels || []).forEach(function (t) {
            k.push({ x: t.x, y: t.y, r: C.TUNNEL_R + 22 }, { x: t.tx, y: t.ty, r: C.TUNNEL_R + 22 });
        });
        (hole.vents || []).forEach(function (v) { k.push({ x: v.x, y: v.y, r: C.VENT_R + 22 }); });
        return k;
    }

    function clearOf(list, x, y, pad) {
        for (var i = 0; i < list.length; i++) {
            if (Math.hypot(x - list[i].x, y - list[i].y) < list[i].r + (pad || 0)) return false;
        }
        return true;
    }

    // Under something solid, or touching it.
    function onSolid(hole, x, y, pad) {
        return (hole.walls || []).some(function (w) { return P.circleRect(x, y, pad, P.wallRect(w, 0)) !== null; }) ||
            P.railsOf(hole).some(function (r) { return P.circleRail(x, y, pad, r) !== null; }) ||
            (hole.bumpers || []).some(function (b) { return P.circleCircle(x, y, pad, b) !== null; }) ||
            !!P.inBlock(hole, x, y);
    }

    function decor(hole, theme) {
        var rand = rng(holeSeed(hole));
        var keep = keepouts(hole);
        var W = C.WORLD_W, H = C.WORLD_H;
        var out = { decals: [], shore: [], pads: [], ducks: [], canopies: [], lamps: [], moon: null };

        /* Decals grow in patches, the way flowers and fallen leaves do: a
           handful of centres, each with a few round it. Spread evenly they
           read as confetti, and spread over the fairway they read as balls.
           So the patches grow only in the borders, and the open grass gets a
           few faint strays of the biome's quiet kinds and nothing else. */
        function plain(x, y) {
            if (x < 14 || y < 14 || x > W - 14 || y > H - 14) return false;
            if (!clearOf(keep, x, y, 0)) return false;
            if (P.zoneAt(hole.water, x, y) || P.zoneAt(hole.sand, x, y) || P.zoneAt(hole.ice, x, y) ||
                P.zoneAt(hole.slopes, x, y) || P.zoneAt(hole.lava, x, y) || P.zoneAt(hole.avalanches, x, y) ||
                P.inHill(hole.hills, x, y) || P.zoneAt(hole.belts, x, y) ||
                (hole.spinners || []).some(function (sp) { return Math.hypot(x - sp.x, y - sp.y) < P.sweepOf(sp) + 6; })) return false;
            return !onSolid(hole, x, y, 10);
        }
        var patches = 5 + ((rand() * 4) | 0);
        for (var n = 0, placed = 0; n < 80 && placed < patches && out.decals.length < BORDER_MAX; n++) {
            var cx = 30 + rand() * (W - 60), cy = 30 + rand() * (H - 60);
            if (!plain(cx, cy) || !border(hole, cx, cy)) continue;
            placed++;
            var kind = theme.border[(rand() * theme.border.length) | 0];
            var tint = rand(), count = 3 + ((rand() * 4) | 0);
            for (var q = 0; q < count; q++) {
                var ang = rand() * Math.PI * 2, dist = Math.sqrt(rand()) * 22;
                var x = cx + Math.cos(ang) * dist, y = cy + Math.sin(ang) * dist;
                if (!plain(x, y) || !border(hole, x, y)) continue;
                out.decals.push({ kind: kind, x: x, y: y, s: 0.7 + rand() * 0.4, a: rand() * Math.PI * 2, t: tint });
            }
        }
        for (var st = 0, lawn = 0; st < 40 && lawn < LAWN_MAX; st++) {
            var lx0 = 30 + rand() * (W - 60), ly0 = 30 + rand() * (H - 60);
            if (!plain(lx0, ly0) || border(hole, lx0, ly0)) continue;
            out.decals.push({ kind: theme.lawn[(rand() * theme.lawn.length) | 0], x: lx0, y: ly0,
                s: 0.6 + rand() * 0.3, a: rand() * Math.PI * 2, t: rand(), soft: true });
            lawn++;
        }

        // The water: dressing round its shore and on its open middle.
        var water = hole.water || [];
        if (water.length) {
            var loops = outline(water, true);
            loops.forEach(function (loop) {
                for (var i = 0; i < loop.length; i++) {
                    var a = loop[i], b = loop[(i + 1) % loop.length];
                    var len = Math.hypot(b.x - a.x, b.y - a.y);
                    var ux = (b.x - a.x) / (len || 1), uy = (b.y - a.y) / (len || 1);
                    // Clockwise loops have the water on their right.
                    var nx = -uy, ny = ux;
                    // In clumps with open shore between them, not a fence.
                    for (var d = 14 + rand() * 50; d < len - 14; d += 50 + rand() * 110) {
                        var bunch = 1 + ((rand() * 3) | 0);
                        for (var e = 0; e < bunch; e++) {
                            var along = d + e * (7 + rand() * 6), inset = 7 + rand() * 6;
                            var px = a.x + ux * along + nx * inset, py = a.y + uy * along + ny * inset;
                            if (px < 12 || py < 12 || px > W - 12 || py > H - 12 || !P.zoneAt(water, px, py)) continue;
                            out.shore.push({ x: px, y: py, a: Math.atan2(ny, nx), r: rand(), big: rand() < 0.4 });
                        }
                    }
                }
            });
            if (theme.water.pads !== false) {
                for (var m = 0; m < 60 && out.pads.length < 9; m++) {
                    var lx = rand() * W, ly = rand() * H;
                    if (!P.zoneAt(water, lx, ly) || shoreDistance(loops, lx, ly) < 24) continue;
                    out.pads.push({ x: lx, y: ly, r: 7 + rand() * 6, a: rand() * Math.PI * 2, flower: rand() < 0.35 });
                }
            }
            /* The deepest point of the water, if it has room: where a duck
               paddles round, and where the moon sits on a pond after dark —
               never near enough the shore for either to touch it. */
            var deep = null;
            if (theme.water.duck !== false || theme.water.moon) {
                for (var gx = 20; gx < W; gx += 20) {
                    for (var gy = 20; gy < H; gy += 20) {
                        if (!P.zoneAt(water, gx, gy)) continue;
                        var sd = shoreDistance(loops, gx, gy);
                        if (!deep || sd > deep.d) deep = { x: gx, y: gy, d: sd };
                    }
                }
            }
            if (deep && deep.d > 46) {
                var lap = { x: deep.x, y: deep.y, r: Math.min(60, deep.d - 26), p: rand() * 6 };
                if (theme.water.duck !== false) out.ducks.push(lap);
                if (theme.water.moon) out.moon = lap;
            }
        }

        /* Canopies, from a fixed set of places just off the field: the four
           corners and a point along each side. A spot is used only if
           nothing a hole is about is within reach of the crown, and at most
           three are — the edge of a course should look lived-in, not
           overgrown. */
        var spots = [
            [-30, -30], [W + 30, -30], [-30, H + 30], [W + 30, H + 30],
            [W * 0.3, -46], [W * 0.7, H + 46], [-46, H * 0.62], [W + 46, H * 0.38]
        ];
        shuffle(spots, rand);
        for (var c = 0; c < spots.length && out.canopies.length < 3; c++) {
            var rad = 78 + rand() * 26;
            var sx = spots[c][0], sy = spots[c][1];
            if (!clearOf(keep, sx, sy, rad + 120)) continue;
            out.canopies.push({ x: sx, y: sy, r: rad, p: rand() * 6 });
        }

        // Lanterns on the cushion, at the corners and halfway along each
        // side. They are on the rim, which the ball only ever grazes.
        if (theme.night) {
            [[10, 10], [W / 2, 6], [W - 10, 10], [W - 6, H / 2], [W - 10, H - 10], [W / 2, H - 6], [10, H - 10], [6, H / 2]]
                .forEach(function (p) { out.lamps.push({ x: p[0], y: p[1], p: rand() * 6 }); });
        }
        return out;
    }

    /* The borders of a hole, where flowers may grow: the band along the
       cushion, the rough, and the foot of every wall and post. Everything
       else is fairway. */
    var EDGE = 58, BORDER_MAX = 44, LAWN_MAX = 9;

    function border(hole, x, y) {
        if (x < EDGE || y < EDGE || x > C.WORLD_W - EDGE || y > C.WORLD_H - EDGE) return true;
        if (P.zoneAt(hole.rough, x, y)) return true;
        return onSolid(hole, x, y, 34);
    }

    /* ── the water's own depth ───────────────────────────────────────────

       How far each point of the water is from its shore, on a coarse grid
       over the water's box: water.js reads it as depth, so the shallows
       are clear and the middle is dark, and as the band the foam draws in.
       Measured from the physics' own test of what is water, so the shader
       and the ball agree; the edge of the field is not a shore — a lake
       that meets the cushion carries on under it. */
    var FIELD_CELL = 4;

    function waterBox(list) {
        var loops = outline(list, true), x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        loops.forEach(function (l) {
            l.forEach(function (p) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); });
        });
        if (x0 === Infinity) return null;
        // A cell of dry ground all round, so a pond's own edge is a shore.
        var pad = FIELD_CELL * 2;
        x0 = Math.max(0, Math.floor(x0 - pad)); y0 = Math.max(0, Math.floor(y0 - pad));
        x1 = Math.min(C.WORLD_W, Math.ceil(x1 + pad)); y1 = Math.min(C.WORLD_H, Math.ceil(y1 + pad));
        return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }

    function shoreField(list, box, cell) {
        cell = cell || FIELD_CELL;
        var cols = Math.max(1, Math.ceil(box.w / cell)), rows = Math.max(1, Math.ceil(box.h / cell));
        var d = new Float32Array(cols * rows), INF = 1e9, i, j, k;
        for (j = 0; j < rows; j++) {
            for (i = 0; i < cols; i++) {
                var x = Math.min(box.x + (i + 0.5) * cell, C.WORLD_W - 0.5), y = Math.min(box.y + (j + 0.5) * cell, C.WORLD_H - 0.5);
                d[j * cols + i] = P.zoneAt(list, x, y) ? INF : 0;
            }
        }
        // Two chamfer passes. Off the grid is never a shore.
        var D = Math.SQRT2;
        function at(a, b) { return a < 0 || b < 0 || a >= cols || b >= rows ? INF : d[b * cols + a]; }
        for (j = 0; j < rows; j++) {
            for (i = 0; i < cols; i++) {
                k = j * cols + i;
                if (d[k] === 0) continue;
                d[k] = Math.min(d[k], at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + D, at(i + 1, j - 1) + D);
            }
        }
        for (j = rows - 1; j >= 0; j--) {
            for (i = cols - 1; i >= 0; i--) {
                k = j * cols + i;
                if (d[k] === 0) continue;
                d[k] = Math.min(d[k], at(i + 1, j) + 1, at(i, j + 1) + 1, at(i + 1, j + 1) + D, at(i - 1, j + 1) + D);
            }
        }
        for (k = 0; k < d.length; k++) d[k] = d[k] >= INF ? 999 : d[k] * cell;
        return { cols: cols, rows: rows, cell: cell, box: box, d: d };
    }

    function shoreDistance(loops, x, y) {
        var best = Infinity;
        loops.forEach(function (loop) {
            for (var i = 0; i < loop.length; i++) {
                var a = loop[i], b = loop[(i + 1) % loop.length];
                var hit = P.circleRail(x, y, 1e6, { x: a.x, y: a.y, tx: b.x, ty: b.y, w: 0 });
                if (hit) best = Math.min(best, 1e6 - hit.depth);
            }
        });
        return best;
    }

    function shuffle(a, rand) {
        for (var i = a.length - 1; i > 0; i--) {
            var j = (rand() * (i + 1)) | 0, t = a[i];
            a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    GOLF.scenery = {
        THEMES: THEMES,
        ORDER: ORDER,
        themeOf: themeOf,
        themeNamed: themeNamed,
        outline: outline,
        signedArea: signedArea,
        decor: decor,
        bleedZone: bleedZone,
        keepouts: keepouts,
        border: border,
        BORDER_MAX: BORDER_MAX,
        LAWN_MAX: LAWN_MAX,
        holeSeed: holeSeed,
        shoreDistance: shoreDistance,
        waterBox: waterBox,
        shoreField: shoreField,
        FIELD_CELL: FIELD_CELL
    };

})(window.GOLF);
