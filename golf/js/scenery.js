/* Scenery: what a course looks like, as opposed to what it does.

   Every hole is boxes, posts, polygons and two points, and physics.js never
   needs to know any more than that. A player does: a field of flat blue
   rectangles is a diagram of a hole rather than a place, and five courses
   drawn in one palette are one course wearing five names. So each card has a
   *biome* — parkland, garden, seaside, woodland, meadow — and this file is
   everything the renderer needs to dress a hole in one: the palettes and
   materials, the outline of each hazard as one rounded shape rather than a
   stack of rectangles, and where the decoration goes.

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
       has to read the same on every card. */
    var THEMES = {
        parkland: {
            name: 'Parkland',
            turf: { h: 132, s: 46, l: 33 },
            rough: { fill: 'rgba(9, 46, 22, 0.55)', tuft: 'rgba(126, 200, 130, 0.30)', edge: 'rgba(8, 40, 20, 0.5)' },
            sand: { base: '#e3ca92', rake: 'rgba(160, 125, 60, 0.18)', lip: 'rgba(120, 90, 40, 0.35)' },
            water: { kind: 'pond', top: '#1b6d9e', deep: '#0e4468', wave: 'rgba(190, 235, 255, 0.22)', shore: 'rgba(226, 202, 146, 0.85)' },
            wall: 'timber', bumper: 'brass', rim: 'paint', canopy: 'oak',
            decals: ['daisy', 'daisy', 'clover', 'clover', 'leaf'],
            backdrop: '#05150c', plan: '#2e6b41'
        },
        garden: {
            name: 'Garden',
            turf: { h: 118, s: 50, l: 36 },
            rough: { fill: 'rgba(18, 60, 24, 0.5)', tuft: 'rgba(150, 215, 140, 0.32)', edge: 'rgba(20, 50, 20, 0.45)' },
            sand: { base: '#e8d4a6', rake: 'rgba(150, 120, 70, 0.16)', lip: 'rgba(130, 100, 50, 0.3)' },
            water: { kind: 'pond', top: '#1e8a8f', deep: '#0f5257', wave: 'rgba(200, 245, 240, 0.24)', shore: 'rgba(200, 190, 170, 0.9)' },
            wall: 'brick', bumper: 'pot', rim: 'brick', canopy: 'blossom',
            decals: ['flower', 'flower', 'flower', 'clover', 'stone'],
            backdrop: '#0b1610', plan: '#357a43'
        },
        seaside: {
            name: 'Seaside',
            turf: { h: 84, s: 40, l: 39 },
            rough: { fill: 'rgba(80, 90, 40, 0.42)', tuft: 'rgba(215, 220, 150, 0.38)', edge: 'rgba(70, 70, 30, 0.4)' },
            sand: { base: '#f0dfb4', rake: 'rgba(170, 140, 90, 0.16)', lip: 'rgba(150, 120, 70, 0.28)' },
            water: { kind: 'sea', top: '#1ba9bd', deep: '#0b4f74', wave: 'rgba(225, 252, 255, 0.30)', shore: 'rgba(245, 230, 190, 0.95)' },
            wall: 'driftwood', bumper: 'buoy', rim: 'plank', canopy: 'palm',
            decals: ['shell', 'shell', 'pebble', 'starfish', 'pebble'],
            backdrop: '#052126', plan: '#5f7f3d'
        },
        woodland: {
            name: 'Woodland',
            turf: { h: 140, s: 38, l: 27 },
            rough: { fill: 'rgba(10, 35, 18, 0.58)', tuft: 'rgba(110, 170, 110, 0.28)', edge: 'rgba(5, 25, 10, 0.55)' },
            sand: { base: '#cfb68a', rake: 'rgba(120, 95, 55, 0.2)', lip: 'rgba(100, 75, 40, 0.38)' },
            water: { kind: 'stream', top: '#24727d', deep: '#103a44', wave: 'rgba(180, 230, 230, 0.20)', shore: 'rgba(140, 115, 80, 0.85)' },
            wall: 'log', bumper: 'mushroom', rim: 'log', canopy: 'pine',
            decals: ['leaf', 'leaf', 'leaf', 'cone', 'toadstool'],
            backdrop: '#040f0a', plan: '#28583a'
        },
        meadow: {
            name: 'Meadow',
            turf: { h: 100, s: 46, l: 36 },
            rough: { fill: 'rgba(40, 70, 20, 0.5)', tuft: 'rgba(190, 225, 130, 0.34)', edge: 'rgba(30, 55, 15, 0.45)' },
            sand: { base: '#e6cf98', rake: 'rgba(160, 125, 60, 0.17)', lip: 'rgba(120, 90, 40, 0.32)' },
            water: { kind: 'pond', top: '#2a7fa8', deep: '#164968', wave: 'rgba(200, 240, 255, 0.24)', shore: 'rgba(210, 195, 150, 0.85)' },
            wall: 'hedge', bumper: 'hay', rim: 'hedge', canopy: 'willow',
            decals: ['poppy', 'cornflower', 'daisy', 'clover', 'poppy'],
            backdrop: '#08170c', plan: '#4a7a35'
        }
    };
    var ORDER = ['parkland', 'garden', 'seaside', 'woodland', 'meadow'];
    ORDER.forEach(function (k) { THEMES[k].id = k; });

    /* The biome a course is drawn in. A card names its own; the draw takes
       one from its seed, so a re-deal can come up as the seaside and a link
       to a seed always comes up as the same place. Anything else — the
       editor's draft, a playtest — is parkland, which is how the game has
       always looked. */
    function themeOf(course) {
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
                   Never in a hazard, never near the tee, the cup or a mouth.
         shore     reeds, lily pads, foam and rocks — in the water, where the
                   ball has already been lost — and a duck on a big pond.
         canopies  the crowns of trees standing just off the field, reaching
                   over its edge: the one thing drawn *above* the ball, and so
                   the one held furthest from everything a hole is about. */

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

    // Everything decoration must keep away from: the tee, the cup, and both
    // mouths of every tunnel. `pad` is added to the clearance each needs.
    function keepouts(hole) {
        var k = [{ x: hole.tee.x, y: hole.tee.y, r: 46 }, { x: hole.hole.x, y: hole.hole.y, r: 56 }];
        (hole.tunnels || []).forEach(function (t) {
            k.push({ x: t.x, y: t.y, r: C.TUNNEL_R + 22 }, { x: t.tx, y: t.ty, r: C.TUNNEL_R + 22 });
        });
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
            (hole.rails || []).some(function (r) { return P.circleRail(x, y, pad, r) !== null; }) ||
            (hole.bumpers || []).some(function (b) { return P.circleCircle(x, y, pad, b) !== null; });
    }

    function decor(hole, theme) {
        var rand = rng(holeSeed(hole));
        var keep = keepouts(hole);
        var W = C.WORLD_W, H = C.WORLD_H;
        var out = { decals: [], shore: [], pads: [], ducks: [], canopies: [] };

        /* Decals grow in patches, the way flowers and fallen leaves do: a
           dozen or so centres, each with a handful round it, and a few
           strays. Spread evenly they read as confetti. */
        function plain(x, y) {
            if (x < 14 || y < 14 || x > W - 14 || y > H - 14) return false;
            if (!clearOf(keep, x, y, 0)) return false;
            if (P.zoneAt(hole.water, x, y) || P.zoneAt(hole.sand, x, y) || P.zoneAt(hole.ice, x, y) ||
                P.zoneAt(hole.slopes, x, y)) return false;
            return !onSolid(hole, x, y, 10);
        }
        var patches = 9 + ((rand() * 6) | 0);
        for (var n = 0; n < patches * 4 && out.decals.length < 90; n++) {
            var cx = 30 + rand() * (W - 60), cy = 30 + rand() * (H - 60);
            if (!plain(cx, cy)) continue;
            var kind = theme.decals[(rand() * theme.decals.length) | 0];
            var tint = rand(), count = n < patches ? 4 + ((rand() * 7) | 0) : 1;
            for (var q = 0; q < count; q++) {
                var ang = rand() * Math.PI * 2, dist = Math.sqrt(rand()) * 26;
                var x = cx + Math.cos(ang) * dist, y = cy + Math.sin(ang) * dist;
                if (!plain(x, y)) continue;
                out.decals.push({ kind: kind, x: x, y: y, s: 0.75 + rand() * 0.55, a: rand() * Math.PI * 2, t: tint });
            }
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
            if (theme.water.kind !== 'sea') {
                for (var m = 0; m < 60 && out.pads.length < 9; m++) {
                    var lx = rand() * W, ly = rand() * H;
                    if (!P.zoneAt(water, lx, ly) || shoreDistance(loops, lx, ly) < 24) continue;
                    out.pads.push({ x: lx, y: ly, r: 7 + rand() * 6, a: rand() * Math.PI * 2, flower: rand() < 0.35 });
                }
                // A duck on any pond with room to paddle: round the deepest
                // point of the water, never near enough the shore to touch it.
                var deep = null;
                for (var gx = 20; gx < W; gx += 20) {
                    for (var gy = 20; gy < H; gy += 20) {
                        if (!P.zoneAt(water, gx, gy)) continue;
                        var sd = shoreDistance(loops, gx, gy);
                        if (!deep || sd > deep.d) deep = { x: gx, y: gy, d: sd };
                    }
                }
                if (deep && deep.d > 46) out.ducks.push({ x: deep.x, y: deep.y, r: Math.min(60, deep.d - 26), p: rand() * 6 });
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
        return out;
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
        holeSeed: holeSeed,
        shoreDistance: shoreDistance
    };

})(window.GOLF);
