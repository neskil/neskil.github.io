/* Endless — mini golf with no last hole, riding through every world.

   The World Tour stands a hole at one spot of a world. This is the other way
   round: the hole is made up as it is needed, a railed mini-golf lane of a
   few cells that turns, steps down, climbs a ramp and puts something in the
   way, and it is hung on the world's own flight path (backdrop.mjs → drift)
   so the world goes by under it while it is played — the way Portals flies
   its camera. Every world vendored from Portals is in it, dealt from a
   shuffled bag that is filled again when it runs out, so all seventeen come
   round before any comes round twice and never the same one twice running.

   Two ways out of a world, as in Portals:
     - the flight ends in a portal on the next world, and a hole still being
       played when it gets there rides through it, ball and all
       (`g3-world-cross`, game.js → crossed);
     - a ball holed goes down the cup the way a tour hole's does, and comes
       out on the next hole, in the next world.

   Nothing here touches the DOM or three.js: it builds holes with
   G3.authoring, the same as every other hole, and tests.html plays them
   with the bot. A hole is a function of its seed and its number, so a seed
   is a whole endless round. */
(function (G3) {
    'use strict';

    var A = G3.authoring, PW = G3.portals;
    var TAU = Math.PI * 2;

    var S = 3.4;          // one cell of lane, square
    var LOW = -2.4;       // how far the course may step down below the tee…
    var HIGH = 2.0;       // …and climb above it (OOB_Y is -6)
    var RAIL = 0.5;       // a kerb's height over the carpet

    function rng(seed) {
        var a = seed >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) >>> 0;
            var t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function pick(r, list) { return list[Math.floor(r() * list.length) % list.length]; }
    function mix(a, b) { var h = (a ^ Math.imul(b + 0x9E3779B9, 0x85EBCA6B)) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35) >>> 0; return (h ^ (h >>> 16)) >>> 0; }

    /* ── the worlds ─────────────────────────────────────────────────────

       All of them: every world in vendor/portals, which is the whole of
       Portals' release s8f — 471 worlds, listed for the classic scripts in
       portal-worlds.js (tools/portal-index.mjs writes it from Portals' own
       registry). Seventeen of them have a tour hole, and from that hole a
       palette, a stand-in set piece for when live worlds are off, a scale
       that has been looked at, and anything of the world's own that has to
       be put away from a seat on its flight (`hide`). The rest borrow the
       palette and set piece of the tour world nearest them in kind
       (STAND_IN, by what the world is made of and then its shelf), and are
       scaled by how fast Portals flies through them (backdrop.mjs →
       autoScale): a world flown at a walk is a room, one flown at forty
       metres a second is a country.

       `scale` is how many of the world's units one of the lane's is — how
       big the course is in that world. */
    var SCALE = {
        'breakfast-table': 1.2, 'world-turtle': 2.6, 'storm-bands': 2.2, 'kelp-cathedral': 1.6,
        'carnival-on-the-frozen-river': 1.2, 'spore-rain': 1.3, 'long-library': 0.9,
        'stairway-everywhere': 1.4, 'the-toppling': 0.6, 'airbrush-black-hole': 1.6,
        'cloud-armada': 2.0, 'obsidian-forge': 1.4, 'paper-boat-rapids': 0.9,
        'attic-railway': 0.9, 'islands-in-custard': 1.0, 'pyramid-of-khufu': 1.8,
        'moon-in-dry-dock': 1.4
    };
    var STAND_IN = {
        media: { space: 'threebody', underwater: 'abyss', tiny: 'attic', snow: 'carnival', interior: 'orrery' },
        category: { sky: 'clouds', alien: 'gasgiant', bizarre: 'stairs', prehistoric: 'forge', domestic: 'breakfast',
            artists: 'custard', books: 'turtle', screen: 'carnival', wilderness: 'rapids', ocean: 'rapids',
            city: 'drydock', wonders: 'pyramid', interior: 'orrery' }
    };
    function standIn(media, category) {
        var m = media.split(' '), i;
        for (i = 0; i < m.length; i++) if (STAND_IN.media[m[i]]) return STAND_IN.media[m[i]];
        return STAND_IN.category[category] || 'clouds';
    }
    var WORLDS = null;
    function worlds() {
        if (WORLDS) return WORLDS;
        var tour = {};
        PW.WORLDS.forEach(function (w) {
            var id = w.place && w.place.world;
            if (!id) return;
            var had = tour[id];
            if (had && !(had.sculpted && !w.place.at)) return;
            tour[id] = { theme: w.theme, scene: w.hole.scene || w.id, sculpted: !!w.place.at, hide: w.place.hide || null, name: w.world.replace(/,.*$/, '') };
        });
        var idx = G3.PORTAL_INDEX || [];
        if (!idx.length) idx = Object.keys(tour).sort().map(function (id) { return [id, tour[id].name, '', 0, [0.5, 0.1], 'air', '']; });
        WORLDS = idx.map(function (row) {
            var id = row[0], t = tour[id], th = t ? t.theme : standIn(row[5] || 'air', row[2]);
            return {
                id: id, name: row[1], category: row[2], weird: row[3], tone: row[4], media: row[5], line: row[6],
                theme: th, scene: t ? t.scene : th, hide: t ? t.hide : null, scale: SCALE[id] || null, tour: !!t
            };
        });
        return WORLDS;
    }
    function worldById(id) {
        var L = worlds();
        for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i];
        return null;
    }

    /* ── a hole ─────────────────────────────────────────────────────────

       Laid on a grid of cells. The walk from the tee goes north first, and
       after that north, east or west — never south, so it can never cross
       itself, and it runs at most two cells sideways before it turns north
       again: a lane that winds, not a maze. Then each cell is given its
       height (level, a step down, or a ramp up or down on a straight), and
       its business (nothing, or one thing from the list below, more often
       and harder things the further into the round you are). Every edge of a
       cell that does not lead to the next or the last cell gets a kerb, and
       every corner a bank across its outside, so the ball is turned round it
       the way a mini golf lane turns it. */

    var DIRS = { N: [0, 1], E: [1, 0], W: [-1, 0] };

    function walk(r, n, d) {
        var len = 4 + Math.floor(r() * (2 + d * 3.2));
        var cells = [{ i: 0, j: 0, din: 'N' }], cur = 'N', run = 0, k;
        for (k = 1; k < len; k++) {
            var nd = cur;
            if (k === 1) nd = 'N';
            else if (cur === 'N') {
                if (r() < 0.42 + 0.2 * d) nd = r() < 0.5 ? 'E' : 'W';
            } else if (run >= 2 || (run >= 1 && r() < 0.55)) nd = 'N';
            run = nd === 'N' ? 0 : run + (nd === cur ? 1 : 1);
            if (nd !== cur && nd !== 'N') run = 1;
            var p = cells[k - 1], v = DIRS[nd];
            p.dout = nd;
            cells.push({ i: p.i + v[0], j: p.j + v[1], din: nd });
            cur = nd;
        }
        return cells;
    }

    // Where a cell is: its corner, its middle, and a frame along it.
    function frameOf(c) {
        var f = DIRS[c.dout && c.dout === c.din ? c.din : (c.dout || c.din)], x0 = c.i * S, z0 = c.j * S;
        return { x0: x0, z0: z0, cx: x0 + S / 2, cz: z0 + S / 2, f: f, l: [Math.abs(f[1]), Math.abs(f[0])] };
    }
    function at(F, a, b) { return [F.cx + F.f[0] * a + F.l[0] * b, F.cz + F.f[1] * a + F.l[1] * b]; }

    // Every wall stood on the cell's carpet, not on golf's zero.
    function lift(ws, y) {
        (Array.isArray(ws) ? ws : [ws]).forEach(function (w) {
            w.base += y;
            if (w.sails) w.sails.hy += y;
        });
        return ws;
    }

    // A kerb along a segment, a hair longer than it so neighbours close the corner.
    function kerb(x0, z0, x1, z1, y0, y1) {
        var out = [], len = Math.hypot(x1 - x0, z1 - z0), yaw = -Math.atan2(z1 - z0, x1 - x0);
        if (Math.abs(y1 - y0) < 0.01) {
            out.push(A.bank((x0 + x1) / 2, (z0 + z1) / 2, len + 0.3, yaw, { base: y0 - 0.1, h: RAIL + 0.1, t: 0.3 }));
            return out;
        }
        // Along a ramp: short lengths, each as tall as the climb across it.
        var n = Math.max(2, Math.ceil(len / 0.85)), i;
        for (i = 0; i < n; i++) {
            var a = i / n, b = (i + 1) / n, ya = y0 + (y1 - y0) * a, yb = y0 + (y1 - y0) * b, lo = Math.min(ya, yb);
            out.push(A.bank(x0 + (x1 - x0) * (a + b) / 2, z0 + (z1 - z0) * (a + b) / 2, len / n + 0.3, yaw,
                { base: lo - 0.1, h: Math.abs(yb - ya) + RAIL + 0.1, t: 0.3 }));
        }
        return out;
    }

    /* The things a cell can hold. Each is `min` far enough into the round
       before it is dealt, and `w` how often after that. Every one leaves a
       way through along the floor: a blade turns out of the way, a gate
       slides, a post has a gap either side wider than two balls. */
    var THINGS = [
        { id: 'bumpers', min: 0, w: 2, name: 'Pinball', says: 'bumpers' },
        { id: 'posts', min: 0, w: 2, name: 'The Posts', says: 'a row of posts' },
        { id: 'hump', min: 0, w: 2, name: 'The Hump', says: 'a hump' },
        { id: 'spinner', min: 0.15, w: 3, name: 'The Rotor', says: 'a turning blade' },
        { id: 'gate', min: 0.2, w: 2, name: 'The Gatehouse', says: 'a sliding gate' },
        { id: 'chicane', min: 0.25, w: 2, name: 'The Chicane', says: 'a chicane' },
        { id: 'belt', min: 0.3, w: 2, name: 'The Conveyor', says: 'a moving belt' },
        { id: 'ice', min: 0.35, w: 1, name: 'The Glaze', says: 'a cell of ice' },
        { id: 'mill', min: 0.3, w: 2, name: 'The Windmill', says: 'a windmill' },
        { id: 'plank', min: 0.45, w: 1.5, name: 'The Plank', says: 'a plank with no rails' },
        { id: 'flipper', min: 0.55, w: 1.5, name: 'The Flipper', says: 'a flipper' }
    ];
    function deal(r, d, flat, y) {
        var pool = THINGS.filter(function (t) {
            if (t.min > d + 1e-9) return false;
            if (t.id === 'mill') return flat && Math.abs(y) < 1e-9;
            return flat || t.id === 'bumpers' || t.id === 'hump';
        });
        var total = 0, i;
        for (i = 0; i < pool.length; i++) total += pool[i].w;
        var x = r() * total;
        for (i = 0; i < pool.length; i++) { x -= pool[i].w; if (x <= 0) return pool[i]; }
        return pool[pool.length - 1];
    }

    function generate(seed, n, entry) {
        var r = rng(seed), d = Math.min(1, n / 14);
        var cells = walk(r, n, d), last = cells.length - 1, k;

        // Heights: a step down between two cells, or a ramp along a straight one.
        var y = 0;
        cells.forEach(function (c, k) {
            c.ys = y; c.ye = y; c.ramp = 0; c.step = false;
            if (k === 0) return;
            var straight = c.dout && c.dout === c.din;
            if (straight && k < last && r() < 0.16 + 0.12 * d) {
                var up = r() < 0.5, rise = 0.55 + r() * 0.3;
                if (up && y + rise > HIGH) up = false;
                if (!up && y - rise < LOW) up = true;
                if (y + (up ? rise : -rise) <= HIGH && y + (up ? rise : -rise) >= LOW) {
                    c.ramp = up ? 1 : -1; c.ye = y + (up ? rise : -rise);
                }
            } else if (r() < 0.18 + 0.14 * d && y - 0.5 >= LOW) {
                y -= 0.45 + r() * 0.35;
                c.ys = c.ye = y; c.step = true;
            }
            y = c.ye;
        });

        var pads = [], extra = [], used = [], keys = {};
        var tee, cup, cupThing = 'plain';
        cells.forEach(function (c, k) {
            var F = frameOf(c), straight = !!c.dout && c.dout === c.din, flat = !c.ramp, kind = 'green';
            c.F = F;
            var thing = null;
            if (k > 0 && k < last && straight && r() < 0.42 + 0.45 * d) thing = deal(r, d, flat, c.ys);
            if (k > 0 && k < last && !straight && r() < 0.12 * d) thing = THINGS[0];
            c.thing = thing;
            if (thing) used.push(thing);
            // The carpet: tilted along a ramp.
            var p;
            if (thing && thing.id === 'plank') {
                p = A.pad(F.x0 + (F.l[0] ? (S - 1.25) / 2 : 0), F.z0 + (F.l[1] ? (S - 1.25) / 2 : 0),
                    F.l[0] ? 1.25 : S, F.l[1] ? 1.25 : S, c.ys, 'wood');
            } else if (thing && thing.id === 'belt') {
                var sp = 1.3 + r() * 0.8, dir = r() < 0.25 * d ? -0.5 : 1;
                p = A.belt(F.x0, F.z0, S, S, F.f[0] * sp * dir, F.f[1] * sp * dir, { y: c.ys, kind: 'wood' });
            } else {
                if (thing && thing.id === 'ice') kind = 'ice';
                var sx = 0, sz = 0, y0 = c.ys, g = (c.ye - c.ys) / S;
                if (c.ramp) {
                    if (c.din === 'N') sz = g;
                    else if (c.din === 'E') sx = g;
                    else { sx = -g; y0 = c.ye; }
                }
                p = A.pad(F.x0, F.z0, S, S, y0, kind, sx, sz);
            }
            pads.push(p);

            // What stands in it.
            var w = [], q, b;
            if (thing) switch (thing.id) {
                case 'bumpers':
                    b = r() < 0.5 ? 1 : -1;
                    q = at(F, -0.5, 0.75 * b); w.push(A.bumper(q[0], q[1], 0.5));
                    q = at(F, 0.6, -0.75 * b); w.push(A.bumper(q[0], q[1], 0.5));
                    if (d > 0.4) { q = at(F, 0.05, 0); w.push(A.bumper(q[0], q[1], 0.45)); }
                    break;
                case 'posts':
                    [-1.05, 0, 1.05].forEach(function (o) { var q2 = at(F, 0, o); w.push(A.post(q2[0], q2[1], 0.36)); });
                    break;
                case 'hump':
                    q = at(F, 0, (r() - 0.5) * 0.8);
                    p.bumps = [A.hill(q[0], q[1], 1.35, 0.32 + 0.2 * r())];
                    break;
                case 'spinner':
                    w.push(A.spinner(F.cx, F.cz, S * 0.58, 0.3, { spin: (r() < 0.5 ? 1 : -1) * (1.1 + 0.8 * r() + 0.5 * d) }));
                    break;
                case 'gate':
                    q = at(F, 0, 0);
                    var gw = S * 0.5, along = F.f[0] !== 0;
                    w.push(A.slider(q[0] - (along ? 0.15 : gw / 2), q[1] - (along ? gw / 2 : 0.15), along ? 0.3 : gw, along ? gw : 0.3,
                        { axis: along ? 'z' : 'x', amp: S * 0.27, speed: 1.2 + 0.8 * r(), phase: r() * TAU }));
                    break;
                case 'chicane':
                    // Two boards from either rail, leaving a slot a ball and a half
                    // wide straight down the middle: thread it, or weave round.
                    b = r() < 0.5 ? 1 : -1;
                    q = at(F, -0.7, 0.98 * b);
                    w.push(A.bank(q[0], q[1], S * 0.42, F.f[0] !== 0 ? Math.PI / 2 : 0, { t: 0.3, h: RAIL + 0.1 }));
                    q = at(F, 0.7, -0.98 * b);
                    w.push(A.bank(q[0], q[1], S * 0.42, F.f[0] !== 0 ? Math.PI / 2 : 0, { t: 0.3, h: RAIL + 0.1 }));
                    break;
                case 'mill':
                    // Only on a north-running cell at golf's zero: a windmill faces down the lane.
                    if (c.din === 'N') {
                        w = w.concat(A.mill(F.x0, F.cz + 0.3, S, { gap: 1.3, speed: 0.7 + 0.5 * r(), len: 1.45, deep: 1.0 }));
                    } else {
                        w.push(A.spinner(F.cx, F.cz, S * 0.58, 0.3, { spin: 1.4 }));
                        c.thing = thing = THINGS[3];
                    }
                    break;
                case 'flipper':
                    b = r() < 0.5 ? 1 : -1;
                    q = at(F, 0.2, 0);
                    w.push(A.flipper(q[0], q[1], S * 0.62, { rest: F.f[0] !== 0 ? Math.PI / 2 : 0, arc: 1.1 * b, speed: 1.4 + r(), hinge: 1, phase: r() * TAU }));
                    break;
            }
            lift(w, c.ys);
            extra = extra.concat(w);

            // The bank across a corner's outside.
            if (k > 0 && c.dout && c.dout !== c.din) {
                var fi = DIRS[c.din], fo = DIRS[c.dout], cut = S * 0.36;
                // The corner the ball runs into: far along the way in, away from the way out.
                var kx = F.cx + (fi[0] ? fi[0] : -fo[0]) * S / 2, kz = F.cz + (fi[1] ? fi[1] : -fo[1]) * S / 2;
                var ax = kx - (fi[0] ? fi[0] : -fo[0]) * cut, az = kz, bx = kx, bz = kz - (fi[1] ? fi[1] : -fo[1]) * cut;
                extra = extra.concat(kerb(ax, az, bx, bz, c.ys, c.ys));
            }

            if (k === 0) tee = { x: F.cx, z: F.z0 + 1.0 };
            if (k === last) {
                var o = (r() - 0.5) * 1.1, ahead = 0.15 + r() * 0.5;
                q = at(F, ahead, o);
                cup = { x: q[0], z: q[1] };
                cupThing = d < 0.2 ? pick(r, ['plain', 'bowl']) : pick(r, ['plain', 'bowl', 'volcano', 'guard', 'volcano']);
                if (cupThing === 'bowl') p.bumps = [A.hill(cup.x, cup.z, 1.5, -0.22)];
                if (cupThing === 'volcano') p.bumps = [A.mesa(cup.x, cup.z, 0.75, 1.0, 0.32)];
                if (cupThing === 'guard') {
                    var g1 = at(F, ahead - 0.95, o - 0.5), g2 = at(F, ahead - 0.95, o + 0.5);
                    extra = extra.concat(lift([A.post(g1[0], g1[1], 0.34), A.post(g2[0], g2[1], 0.34)], c.ys));
                }
            }
        });

        // The kerbs: every side of every cell that does not lead on.
        var occ = {};
        cells.forEach(function (c, k) { occ[c.i + ',' + c.j] = k; });
        function rails(c, k) {
            if (c.thing && c.thing.id === 'plank') return;
            var x0 = c.F.x0, z0 = c.F.z0, x1 = x0 + S, z1 = z0 + S;
            var sides = [
                { n: [0, 1], a: [x0, z1], b: [x1, z1] }, { n: [0, -1], a: [x0, z0], b: [x1, z0] },
                { n: [1, 0], a: [x1, z0], b: [x1, z1] }, { n: [-1, 0], a: [x0, z0], b: [x0, z1] }
            ];
            sides.forEach(function (s) {
                var key = occ[(c.i + s.n[0]) + ',' + (c.j + s.n[1])];
                if (key !== undefined && Math.abs(key - k) === 1) return;      // leads on
                var edge = [Math.min(s.a[0], s.b[0]), Math.min(s.a[1], s.b[1]), Math.max(s.a[0], s.b[0]), Math.max(s.a[1], s.b[1])].join(',');
                var ya = heightAt(c, s.a[0], s.a[1]), yb = heightAt(c, s.b[0], s.b[1]);
                if (key !== undefined) {
                    // Two cells side by side that do not lead into each other: one kerb, tall enough for both.
                    var o2 = cells[key];
                    ya = Math.max(ya, heightAt(o2, s.a[0], s.a[1])); yb = Math.max(yb, heightAt(o2, s.b[0], s.b[1]));
                    if (o2.thing && o2.thing.id === 'plank') key = undefined;
                }
                if (keys[edge]) return;
                keys[edge] = true;
                extra = extra.concat(kerb(s.a[0], s.a[1], s.b[0], s.b[1], ya, yb));
            });
        }
        function heightAt(c, x, z) {
            if (!c.ramp) return c.ys;
            var t = c.din === 'N' ? (z - c.F.z0) / S : c.din === 'E' ? (x - c.F.x0) / S : (c.F.x0 + S - x) / S;
            return c.ys + (c.ye - c.ys) * Math.max(0, Math.min(1, t));
        }
        cells.forEach(rails);

        // Par: two for the putt that is left, and one for every way the lane makes you work.
        var turns = cells.filter(function (c) { return c.dout && c.dout !== c.din; }).length;
        var hard = used.filter(function (t) { return ['mill', 'plank', 'flipper', 'gate'].indexOf(t.id) >= 0; }).length;
        var par = Math.max(2, Math.min(5, 2 + (cells.length >= 6 ? 1 : 0) + (turns >= 3 ? 1 : 0) + (hard >= 2 ? 1 : 0)));

        var main = used.length ? used[Math.floor(r() * used.length)] : null;
        var name = main ? main.name : turns >= 3 ? 'The Switchback' : cells.some(function (c) { return c.step; }) ? 'The Cascade' : 'The Lane';
        if (cupThing === 'volcano' && !main) name = 'The Volcano';
        var says = [];
        if (turns) says.push(turns === 1 ? 'one turn' : turns + ' turns');
        var steps = cells.filter(function (c) { return c.step; }).length, ramps = cells.filter(function (c) { return c.ramp; }).length;
        if (steps) says.push(steps === 1 ? 'a step down' : steps + ' steps down');
        if (ramps) says.push(ramps === 1 ? 'a ramp' : ramps + ' ramps');
        var seen = {};
        used.forEach(function (t) { if (!seen[t.id]) { seen[t.id] = true; says.push(t.says); } });
        if (cupThing === 'volcano') says.push('a cup on a mound');
        if (cupThing === 'bowl') says.push('a bowl round the cup');
        if (cupThing === 'guard') says.push('two posts guarding the cup');
        var blurb = (says.length ? cap(list(says)) + '.' : 'A straight lane.') + ' Riding through ' + entry.name +
            (entry.line ? ': ' + entry.line.charAt(0).toLowerCase() + entry.line.slice(1) : '.');

        var hole = PW.world({
            name: name, par: par, bag: ['putter', 'mallet'],
            blurb: blurb, pads: pads, extra: extra, tee: tee, cup: cup
        });
        hole.scene = entry.scene; hole.theme = entry.theme; hole.inWorld = entry.name;
        hole.endless = { seed: seed, n: n, cells: cells.length, turns: turns, things: used.map(function (t) { return t.id; }), cup: cupThing };
        hole.place = placeFor(entry);
        return hole;
    }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function list(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

    // A place that rides (backdrop.mjs → drift), with every world's scale and
    // hide list on it for when it rides through into another.
    function placeFor(entry) {
        var scales = {}, hides = {};
        worlds().forEach(function (w) { if (w.scale) scales[w.id] = w.scale; if (w.hide) hides[w.id] = w.hide; });
        // No `scale` for a world nobody has looked at: backdrop works one out from its flight.
        return { world: entry.id, drift: true, ground: false, scale: entry.scale || null, scales: scales, hides: hides,
            hide: entry.hide, next: null, line: entry.line || '' };
    }

    /* ── a round ────────────────────────────────────────────────────────

       The course `endless` is a round that grows: there is always the hole
       being played and the one after it (so the next world can be built
       aside while this one is played — game.js → prepareAhead), and never a
       last one. `crossed` is the hole riding through its portal: the world
       it is in is now the one the next hole was going to be in, so the next
       hole is dealt again, in the world after. */
    // `first`, a world id, is where the round starts (the query string's ?from=).
    function course(seed, first) {
        seed = (seed === undefined || seed === null || isNaN(seed) ? Math.floor(Math.random() * 4294967296) : seed) >>> 0;
        var r = rng(mix(seed, 0x51ed270b)), bag = [], last = null;
        function nextWorld() {
            var L = worlds(), B = G3.backdrop, tries = 0, id;
            if (first && worldById(first)) { id = first; first = null; last = id; return worldById(id); }
            do {
                if (!bag.length) {
                    bag = L.map(function (w) { return w.id; });
                    for (var i = bag.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = bag[i]; bag[i] = bag[j]; bag[j] = t; }
                    if (bag[0] === last && bag.length > 1) { var t2 = bag[0]; bag[0] = bag[1]; bag[1] = t2; }
                }
                id = bag.shift();
            } while (B && B.failed && B.failed(id) && ++tries < L.length);
            last = id;
            return worldById(id);
        }
        var c = {
            id: 'endless', group: 'portals', name: 'Endless',
            blurb: 'Mini golf made up as you go, riding through every world.',
            isPortals: true, isEndless: true, seed: seed,
            holes: [], worlds: [], themes: [], from: []
        };
        c.theme = null;
        function add() {
            var k = c.holes.length, w = nextWorld(), h = generate(mix(seed, k + 1), k, w);
            c.holes.push(h); c.worlds.push(w.id); c.themes.push(w.theme); c.from.push({ id: 'endless', index: k });
            if (k === 0) c.theme = w.theme;
        }
        // Holes up to and including i + 1.
        c.ensure = function (i) { while (c.holes.length <= i + 1) add(); return c.holes[i]; };
        // Hole i rode through into world `to`: the hole after it is dealt again, elsewhere.
        c.crossed = function (i, to) {
            c.worlds[i] = to;
            last = to;
            var nx = c.holes[i + 1];
            if (nx && nx.place.world === to) {
                c.holes.length = c.worlds.length = c.themes.length = c.from.length = i + 1;
                add();
            }
            c.holes[i].place.next = c.holes[i + 1].place.world;
            return c.holes[i + 1];
        };
        c.ensure(0);
        return c;
    }

    G3.endless = {
        worlds: worlds, world: worldById, generate: generate, course: course, rng: rng, mix: mix,
        THINGS: THINGS, S: S
    };

    G3.ENDLESS = null;
    var plain = G3.courseById;
    G3.courseById = function (id) {
        if (String(id) === 'endless') return G3.ENDLESS || (G3.ENDLESS = course());
        return plain(id);
    };
})(window.G3);
