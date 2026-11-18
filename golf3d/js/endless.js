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

    var A = G3.authoring, PW = G3.portals, C = G3.CONFIG;
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

       Laid on a grid of 3.4-unit cells, in pieces. A piece is one cell of
       lane, or a room two cells square: a plaza the lane opens into, or a
       fork with a divider down it. Each hole is first given a shape — a
       blueprint saying which pieces in what order (SHAPES below) — and the
       pieces are then laid one after another from the tee, each entered
       through one edge and left through another, onto cells nobody has used:
       so a lane can wind, double back on itself as a hairpin, open into a
       room or stop at a gap and carry on beyond it through a pipe, and never
       cross itself. Then each piece is given its height (level, a step down,
       or a ramp on a straight cell), its business (nothing, or a thing from
       the lists below, more often and harder the further into the round),
       a kerb on every edge that does not lead on, and a rounded corner
       wherever the lane turns or ends with nothing round it. */

    var DIRS = { N: [0, 1], E: [1, 0], S: [0, -1], W: [-1, 0] };
    function dirOf(v) { return v[1] > 0 ? 'N' : v[1] < 0 ? 'S' : v[0] > 0 ? 'E' : 'W'; }
    function right(h) { var v = DIRS[h]; return dirOf([v[1], -v[0]]); }
    function left(h) { var v = DIRS[h]; return dirOf([-v[1], v[0]]); }
    function key(i, j) { return i + ',' + j; }
    // One edge of the grid, named the same from either side.
    function edgeKey(i, j, h) {
        return h === 'N' ? 'h' + i + ',' + (j + 1) : h === 'S' ? 'h' + i + ',' + j :
            h === 'E' ? 'v' + (i + 1) + ',' + j : 'v' + i + ',' + j;
    }

    /* The shapes, each `min` far enough into the round (d) before it is dealt
       and `w` how often after that. The same shape is not dealt twice running
       (course → add passes the last one). */
    var SHAPES = [
        { id: 'lane', min: 0, w: 2.6 },
        { id: 'plaza', min: 0, w: 2.4 },
        { id: 'cascade', min: 0.05, w: 1.3 },
        { id: 'hairpin', min: 0.1, w: 1.7 },
        { id: 'room', min: 0.12, w: 2 },
        { id: 'fork', min: 0.2, w: 1.9 },
        { id: 'pipe', min: 0.25, w: 1.5 }
    ];
    function shapeFor(r, d, avoid) {
        var pool = SHAPES.filter(function (s) { return s.min <= d + 1e-9 && s.id !== avoid; });
        var total = 0, i;
        for (i = 0; i < pool.length; i++) total += pool[i].w;
        var x = r() * total;
        for (i = 0; i < pool.length; i++) { x -= pool[i].w; if (x <= 0) return pool[i].id; }
        return pool[pool.length - 1].id;
    }

    /* A shape as the pieces it is laid from, in order. A cell's `go` says how
       it may leave: 'auto' winds the way a lane does (north, then a run of at
       most two cells east or west, then north again), 'straight' goes on,
       'turn' goes left or right, 'south' turns back towards the tee. */
    function blueprint(r, d, shape) {
        var L = [], k, n;
        function cell(go, o) { var c = o || {}; c.t = 'cell'; c.go = go; L.push(c); return c; }
        function room(role, exit) { L.push({ t: 'room', role: role, exit: exit }); }
        cell('straight', { first: true });
        switch (shape) {
            case 'plaza':
                n = 1 + Math.floor(r() * (1.5 + d * 2));
                for (k = 0; k < n; k++) cell('auto');
                room('plaza', null);
                break;
            case 'room':
                n = 1 + Math.floor(r() * 2);
                for (k = 0; k < n; k++) cell('auto');
                room('room', pick(r, ['ahead', 'across', 'side', 'across']));
                n = 1 + Math.floor(r() * (1.5 + d));
                for (k = 0; k < n; k++) cell(k === n - 1 ? 'end' : 'auto');
                break;
            case 'fork':
                if (r() < 0.6) cell('auto');
                room('fork', r() < 0.7 ? 'ahead' : 'across');
                n = 1 + Math.floor(r() * (1.5 + d));
                for (k = 0; k < n; k++) cell(k === n - 1 ? 'end' : 'auto');
                break;
            case 'hairpin':
                // Out, across and back: the two legs side by side with one kerb between them.
                n = 1 + Math.floor(r() * 2);
                for (k = 0; k < n; k++) cell('straight');
                cell('turn');
                if (r() < 0.35) cell('straight');
                cell('south');
                for (k = 0; k < n - 1; k++) cell('straight');
                cell('end');
                break;
            case 'cascade':
                // Downhill all the way: a step or a ramp down into nearly every cell.
                n = 3 + Math.floor(r() * (1.5 + d * 2));
                for (k = 0; k < n; k++) cell(k === n - 1 ? 'end' : 'auto', { fall: true });
                break;
            case 'pipe':
                // Two islands and nothing between them but a pipe.
                n = Math.floor(r() * 2);
                for (k = 0; k < n; k++) cell('auto');
                cell('straight', { mouth: true });
                cell('straight', { landing: true, gap: true });
                if (r() < 0.4) room('plaza', null);
                else {
                    n = 1 + Math.floor(r() * (1 + d));
                    for (k = 0; k < n; k++) cell(k === n - 1 ? 'end' : 'auto');
                }
                break;
            default:   // 'lane'
                n = 3 + Math.floor(r() * (2 + d * 3.2));
                for (k = 0; k < n; k++) cell(k === n - 1 ? 'end' : 'auto');
        }
        return L;
    }

    /* Lay a blueprint on the grid. Each piece goes where the last one left
       off; a cell's way out is chosen among those that lead to a free cell,
       a room is put on whichever side of its entrance has room for it.
       Nothing goes south of the tee's row (the seat is behind it) or more
       than four cells either side. Null when the blueprint will not fit,
       and the caller deals again. */
    function lay(r, specs) {
        var occ = {}, pieces = [], open = {};
        var ci = 0, cj = 0, h = 'N', run = 0, k;
        function free(i, j) { return j >= 0 && j <= 11 && Math.abs(i) <= 4 && occ[key(i, j)] === undefined; }
        for (k = 0; k < specs.length; k++) {
            var s = specs[k], last = k === specs.length - 1, v;
            if (s.gap) {
                // The air between two islands: kept empty so nothing is laid across it.
                if (!free(ci, cj)) return null;
                occ[key(ci, cj)] = -1;
                v = DIRS[h]; ci += v[0]; cj += v[1];
            }
            if (!free(ci, cj)) return null;
            var P = { spec: s, t: s.t, din: h, k: k, cells: [] };
            if (s.t === 'cell') {
                P.cells.push({ i: ci, j: cj });
                if (!last) {
                    var opts = [];
                    if (s.go === 'straight') opts = [h];
                    else if (s.go === 'turn') opts = r() < 0.5 ? [left(h), right(h)] : [right(h), left(h)];
                    else if (s.go === 'south') opts = [left(h) === 'S' ? left(h) : right(h)];
                    else {
                        // A lane's own winding.
                        if (h === 'S') opts = r() < 0.5 ? ['E', 'W'] : ['W', 'E'];
                        else if (h === 'N') opts = r() < 0.42 + 0.2 * (s.d || 0) + 0.12 ? (r() < 0.5 ? ['E', 'W', 'N'] : ['W', 'E', 'N']) : ['N', 'E', 'W'];
                        else if (run >= 2 || (run >= 1 && r() < 0.55)) opts = ['N', h];
                        else opts = [h, 'N'];
                    }
                    if (s.mouth) opts = [h];
                    var out = null;
                    for (var o = 0; o < opts.length; o++) {
                        if (opts[o] === 'S' && s.go !== 'south') continue;
                        v = DIRS[opts[o]];
                        var ni = ci + v[0], nj = cj + v[1];
                        if (s.mouth) { ni += v[0]; nj += v[1]; }
                        if (free(ni, nj) && !(s.mouth && !free(ci + v[0], cj + v[1]))) { out = opts[o]; break; }
                    }
                    if (!out) return null;
                    P.dout = out;
                }
                occ[key(ci, cj)] = pieces.length;
                if (P.dout) {
                    if (!s.mouth) open[edgeKey(ci, cj, P.dout)] = true;
                    v = DIRS[P.dout];
                    run = P.dout === 'N' ? 0 : (P.dout === h ? run + 1 : 1);
                    h = P.dout; ci += v[0]; cj += v[1];
                }
            } else {
                // A room: the entrance cell, the one beyond it, and the pair beside them.
                var fv = DIRS[h], sides = r() < 0.5 ? [left(h), right(h)] : [right(h), left(h)], placed = false;
                for (var si = 0; si < 2 && !placed; si++) {
                    var sd = sides[si], sv = DIRS[sd];
                    var cs = [[ci, cj], [ci + fv[0], cj + fv[1]], [ci + sv[0], cj + sv[1]], [ci + fv[0] + sv[0], cj + fv[1] + sv[1]]];
                    if (!cs.every(function (c) { return free(c[0], c[1]); })) continue;
                    var ex = null, exits = [];
                    if (!last) {
                        var want = s.exit;
                        exits = { ahead: [cs[1], h], across: [cs[3], h], side: [cs[3], sd] };
                        var order = [want, 'across', 'ahead', 'side'];
                        for (var e = 0; e < order.length && !ex; e++) {
                            var X = exits[order[e]], xv = DIRS[X[1]];
                            if (s.role === 'fork' && order[e] === 'side') continue;
                            if (free(X[0][0] + xv[0], X[0][1] + xv[1])) ex = { cell: X[0], dir: X[1], kind: order[e] };
                        }
                        if (!ex) continue;
                    }
                    placed = true;
                    P.side = sd;
                    cs.forEach(function (c) { P.cells.push({ i: c[0], j: c[1] }); occ[key(c[0], c[1])] = pieces.length; });
                    if (ex) {
                        P.exit = ex.kind; P.dout = ex.dir;
                        open[edgeKey(ex.cell[0], ex.cell[1], ex.dir)] = true;
                        xv = DIRS[ex.dir];
                        run = ex.dir === 'N' ? 0 : 1;
                        h = ex.dir; ci = ex.cell[0] + xv[0]; cj = ex.cell[1] + xv[1];
                    }
                }
                if (!placed) return null;
            }
            pieces.push(P);
        }
        return { pieces: pieces, occ: occ, open: open };
    }

    /* Where a piece is. `f` is the way along it and `s` the way to its right,
       both signed, so at(F, a, b) is a units along from its middle and b to
       the right. A room's middle is the middle of its four cells, and its
       entrance is at b = -S/2: the side it was put on is +s. */
    function frameOf(P) {
        var i0 = Infinity, j0 = Infinity, i1 = -Infinity, j1 = -Infinity;
        P.cells.forEach(function (c) { i0 = Math.min(i0, c.i); j0 = Math.min(j0, c.j); i1 = Math.max(i1, c.i); j1 = Math.max(j1, c.j); });
        var h = P.t === 'cell' && P.dout && P.dout !== P.din && P.k === 0 ? P.dout : P.din, f = DIRS[h];
        var x0 = i0 * S, z0 = j0 * S, w = (i1 - i0 + 1) * S, dd = (j1 - j0 + 1) * S;
        var sv = P.t === 'room' ? DIRS[P.side] : [f[1], -f[0]];
        return { x0: x0, z0: z0, w: w, d: dd, cx: x0 + w / 2, cz: z0 + dd / 2, f: f, s: sv, h: h,
            l: [Math.abs(f[1]), Math.abs(f[0])] };
    }
    function at(F, a, b) { return [F.cx + F.f[0] * a + F.s[0] * b, F.cz + F.f[1] * a + F.s[1] * b]; }
    // The yaw that lays a bank's length along the piece's `f`.
    function along(F) { return F.f[0] !== 0 ? 0 : Math.PI / 2; }

    // Every wall stood on the piece's carpet, not on golf's zero.
    function lift(ws, y) {
        (Array.isArray(ws) ? ws : [ws]).forEach(function (w) {
            w.base += y;
            if (w.sails) w.sails.hy += y;
        });
        return ws;
    }

    /* A kerb along a segment, a hair longer than it so neighbours close the
       corner. `y0`/`y1` is the floor it stands on at either end; `lo0`/`lo1`,
       when two pieces at different heights share it, the lower floor — the
       kerb reaches down to that one too, or a ball on the low side rolls
       under it. */
    function kerb(x0, z0, x1, z1, y0, y1, kind, lo0, lo1, up, dip) {
        var out = [], len = Math.hypot(x1 - x0, z1 - z0), yaw = -Math.atan2(z1 - z0, x1 - x0);
        if (len < 0.05) return out;
        if (lo0 === undefined) { lo0 = y0; lo1 = y1; }
        // Ground shaped against it (a mound, a dish, a camber): up to a rail over the highest of it, down to the lowest.
        up = Math.max(0, up || 0); dip = Math.min(0, dip || 0);
        if (Math.abs(y1 - y0) < 0.01 && Math.abs(lo1 - lo0) < 0.01) {
            var b0 = Math.min(y0, lo0) + dip;
            out.push(A.bank((x0 + x1) / 2, (z0 + z1) / 2, len + 0.3, yaw, { base: b0 - 0.1, h: y0 + up - b0 + RAIL + 0.1, t: 0.3, kind: kind }));
            return out;
        }
        // Along a ramp: short lengths, each as tall as the climb across it.
        var n = Math.max(2, Math.ceil(len / 0.85)), i;
        for (i = 0; i < n; i++) {
            var a = i / n, b = (i + 1) / n, ya = y0 + (y1 - y0) * a, yb = y0 + (y1 - y0) * b;
            var lo = Math.min(ya, yb, lo0 + (lo1 - lo0) * a, lo0 + (lo1 - lo0) * b) + dip, hi = Math.max(ya, yb) + up;
            out.push(A.bank(x0 + (x1 - x0) * (a + b) / 2, z0 + (z1 - z0) * (a + b) / 2, len / n + 0.3, yaw,
                { base: lo - 0.1, h: hi - lo + RAIL + 0.1, t: 0.3, kind: kind }));
        }
        return out;
    }
    // A board from p to q, stood on the floor: a divider, a funnel's side.
    function board(p, q, o) {
        var dx = q[0] - p[0], dz = q[1] - p[1], len = Math.hypot(dx, dz), t = (o && o.t) || 0.28;
        return A.bank((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, len + t, -Math.atan2(dz, dx),
            { t: t, h: (o && o.h) || RAIL + 0.1, kind: o && o.kind });
    }
    function slingAt(F, a0, a1, side, inner, rail) {
        var rb = rail || 1.52, P1 = at(F, a0, side * rb), P2 = at(F, a1, side * rb), P3 = at(F, a1, side * inner);
        return A.slingshot({ x: P1[0], z: P1[1] }, { x: P3[0], z: P3[1] }, { x: P2[0], z: P2[1] });
    }

    /* The things a cell can hold. Each is `min` far enough into the round
       before it is dealt, and `w` how often after that. Every one leaves a
       way through along the floor: a blade turns out of the way, a gate
       slides, a post has a gap either side wider than two balls. `names`
       are what a hole built round one is called, one picked per hole. */
    var THINGS = [
        { id: 'bumpers', min: 0, w: 1.6, names: ['Pinball', 'Pop Bumpers', 'The Arcade'], says: 'bumpers' },
        { id: 'posts', min: 0, w: 1.4, names: ['The Posts', 'Goalmouth', 'The Picket'], says: 'a row of posts' },
        { id: 'hump', min: 0, w: 1.6, names: ['The Hump', 'Camel Back', 'The Rise'], says: 'a hump' },
        { id: 'moguls', min: 0, w: 1.4, names: ['Moguls', 'The Washboard', 'Bumpy Ride'], says: 'moguls' },
        { id: 'slalom', min: 0.05, w: 1.5, names: ['Slalom', 'The Weave', 'Gates of Rubber'], says: 'a slalom' },
        { id: 'sand', min: 0.08, w: 1.2, names: ['The Bunker', 'Beach Break', 'Sandbox'], says: 'a bunker' },
        { id: 'spinner', min: 0.15, w: 2.2, names: ['The Rotor', 'Propeller', 'The Turnstile'], says: 'a turning blade' },
        { id: 'camber', min: 0.15, w: 1.2, names: ['The Camber', 'Side Hill', 'The Lean'], says: 'a banked side' },
        { id: 'gate', min: 0.2, w: 1.7, names: ['The Gatehouse', 'Portcullis', 'Shutter'], says: 'a sliding gate' },
        { id: 'funnel', min: 0.2, w: 1.3, names: ['The Funnel', 'Bottleneck', 'The Throat'], says: 'a funnel' },
        { id: 'chicane', min: 0.25, w: 1.6, names: ['The Chicane', 'Zig Zag', 'Dog Teeth'], says: 'a chicane' },
        { id: 'sling', min: 0.25, w: 1.3, names: ['Slingshots', 'Kickers', 'Rubber Band'], says: 'slingshots' },
        { id: 'belt', min: 0.3, w: 1.6, names: ['The Conveyor', 'Travelator', 'Baggage Claim'], says: 'a moving belt' },
        { id: 'mill', min: 0.3, w: 1.8, names: ['The Windmill', 'Old Dutch', 'Mill Race'], says: 'a windmill' },
        { id: 'twin', min: 0.35, w: 1.3, names: ['Twin Rotors', 'Egg Beater', 'The Mixer'], says: 'twin blades' },
        { id: 'ice', min: 0.35, w: 1, names: ['The Glaze', 'Rink', 'Black Ice'], says: 'a cell of ice' },
        { id: 'plank', min: 0.45, w: 1.4, names: ['The Plank', 'Tightrope', 'Walk the Plank'], says: 'a plank with no rails' },
        { id: 'flipper', min: 0.55, w: 1.4, names: ['The Flipper', 'Tilt', 'Paddle'], says: 'a flipper' }
    ];
    var THING = {};
    THINGS.forEach(function (t) { THING[t.id] = t; });
    var ROLLING = { bumpers: 1, hump: 1, moguls: 1 };   // what may stand on a ramp
    function deal(r, d, flat, y, not) {
        var pool = THINGS.filter(function (t) {
            if (t.min > d + 1e-9 || t.id === not) return false;
            if (t.id === 'mill') return flat && Math.abs(y) < 1e-9;
            return flat || ROLLING[t.id];
        });
        var total = 0, i;
        for (i = 0; i < pool.length; i++) total += pool[i].w;
        var x = r() * total;
        for (i = 0; i < pool.length; i++) { x -= pool[i].w; if (x <= 0) return pool[i]; }
        return pool[pool.length - 1];
    }

    /* What a room holds. A room in the middle of a hole (`room`) has a
       centrepiece to be got round or through; a plaza has the cup in it and
       something about the cup. */
    var ROOMS = {
        room: [
            { id: 'island', w: 2, names: ['The Island', 'Roundabout', 'Traffic Circle'], says: 'a block to go round' },
            { id: 'pinball', w: 2, names: ['Pinball Room', 'The Table', 'Multiball'], says: 'a room of bumpers' },
            { id: 'bigblade', w: 1.6, min: 0.2, names: ['The Big Wheel', 'Helicopter', 'The Sweeper'], says: 'a long blade turning' },
            { id: 'moguls', w: 1.4, names: ['Mogul Field', 'Bumpy Square', 'The Paddock'], says: 'a field of humps' },
            { id: 'baffle', w: 1.6, names: ['The Baffle', 'Switchboard', 'Zag'], says: 'a wall to get round' },
            { id: 'bunkers', w: 1.2, names: ['Beach Room', 'The Dunes', 'Twin Traps'], says: 'bunkers' }
        ],
        plaza: [
            { id: 'island', w: 2, names: ['Behind the Wall', 'Hide and Seek', 'The Screen'], says: 'a block in front of the cup' },
            { id: 'corral', w: 1.8, names: ['The Corral', 'Stonehenge', 'The Crown'], says: 'a ring of posts round the cup' },
            { id: 'mesa', w: 1.6, names: ['The Volcano', 'Table Top', 'The Summit'], says: 'a cup on a mound' },
            { id: 'bowl', w: 1.6, names: ['The Basin', 'Punchbowl', 'The Saucer'], says: 'a bowl round the cup' },
            { id: 'pinball', w: 1.6, names: ['Jackpot', 'Bonus Round', 'Tilt Table'], says: 'bumpers before the cup' },
            { id: 'bunkers', w: 1.3, names: ['Oasis', 'Sand Trap', 'The Beach'], says: 'bunkers round the cup' },
            { id: 'bigblade', w: 1.2, min: 0.3, names: ['The Carousel', 'Merry Go Round', 'The Wheel'], says: 'a long blade turning over the green' }
        ]
    };
    function dealRoom(r, d, role) {
        var pool = ROOMS[role].filter(function (t) { return !t.min || t.min <= d + 1e-9; });
        var total = 0, i;
        for (i = 0; i < pool.length; i++) total += pool[i].w;
        var x = r() * total;
        for (i = 0; i < pool.length; i++) { x -= pool[i].w; if (x <= 0) return pool[i]; }
        return pool[pool.length - 1];
    }

    // Small humps scattered over a box of half-sizes (ha, hb) round (a0, b0), clear of its edges.
    function moguls(r, F, n, ha, hb, keepOff) {
        var out = [], tries = 0;
        while (out.length < n && tries++ < 40) {
            var rr = 0.7 + r() * 0.35, a = (r() * 2 - 1) * (ha - rr), b = (r() * 2 - 1) * (hb - rr), q = at(F, a, b);
            if (keepOff && Math.hypot(q[0] - keepOff[0], q[1] - keepOff[1]) < rr + keepOff[2]) continue;
            if (out.some(function (m) { return Math.hypot(m.cx - q[0], m.cz - q[1]) < m.r + rr - 0.3; })) continue;
            out.push(A.hill(q[0], q[1], rr, 0.12 + r() * 0.1));
        }
        return out;
    }

    /* The ground a cup stands in: a mound (a > 0) or a dish (a < 0) that is
       dead level for TOP all round the cup — wider than the cup's flat patch
       (render.js → addTerrain), so the patch lies on the level instead of
       standing out of a slope as a square — and then rises or falls to the
       carpet over a long raised cosine, a ramp a putt can ride. The flank
       stops short of the way into the piece (`room`, how far that edge is
       from the cup), so the carpet meets the lane before it on the level.
       Drawn on a fine grid, or the ring comes out an octagon. */
    var CUP_TOP = 0.85, CUP_RUN = 1.8;
    function land(p, cup, a, room) {
        var run = Math.max(0.9, Math.min(CUP_RUN, room - 0.1 - CUP_TOP));
        p.bumps = [A.mesa(cup.x, cup.z, CUP_TOP, run, a)];
        p.res = 0.2;
    }

    function generate(seed, n, entry, avoid) {
        var r = rng(seed), d = Math.min(1, n / 14);
        var shape = shapeFor(r, d, avoid), laid = null, tries = 0, specs;
        while (!laid && tries++ < 12) {
            specs = blueprint(r, d, shape);
            specs.forEach(function (s) { s.d = d; });
            laid = lay(r, specs);
            if (!laid && tries === 6) shape = 'lane';
        }
        if (!laid) { specs = blueprint(rng(seed ^ 0x5bd1e995), 0, 'lane'); laid = lay(r, specs); }
        var pieces = laid.pieces, occ = laid.occ, open = laid.open, last = pieces.length - 1;
        var kerbKind = r() < 0.25 ? 'beam' : 'rail';

        // Heights: a step down into a piece, or a ramp along a straight cell.
        var y = 0;
        pieces.forEach(function (P, k) {
            P.ys = y; P.ye = y; P.ramp = 0; P.step = false;
            if (k === 0) return;
            var s = P.spec, straight = P.t === 'cell' && P.dout && P.dout === P.din;
            var rampP = s.fall ? 0.45 : 0.16 + 0.12 * d, stepP = s.fall ? 0.75 : 0.18 + 0.14 * d;
            if (s.landing) {
                // Over the gap, the far island is higher or lower than the near one.
                var dy = (r() < 0.6 ? -1 : 1) * (0.5 + r() * 0.7);
                y = Math.max(LOW + 0.6, Math.min(HIGH - 0.4, y + dy));
                P.ys = P.ye = y;
                return;
            }
            if (straight && k < last && !s.mouth && pieces[k + 1].t === 'cell' && r() < rampP) {
                var up = s.fall ? false : r() < 0.5, rise = 0.55 + r() * 0.3;
                if (up && y + rise > HIGH) up = false;
                if (!up && y - rise < LOW) up = true;
                if (y + (up ? rise : -rise) <= HIGH && y + (up ? rise : -rise) >= LOW) {
                    P.ramp = up ? 1 : -1; P.ye = y + (up ? rise : -rise);
                }
            } else if (r() < stepP && y - 0.5 >= LOW) {
                y -= 0.45 + r() * 0.35;
                P.ys = P.ye = y; P.step = true;
            }
            y = P.ye;
        });
        var cellAt = {};
        pieces.forEach(function (P) { P.cells.forEach(function (c) { cellAt[key(c.i, c.j)] = P; }); });
        function heightAt(P, x, z) {
            if (!P.ramp) return P.ys;
            var F = P.F, t = P.din === 'N' ? (z - F.z0) / S : P.din === 'S' ? (F.z0 + S - z) / S :
                P.din === 'E' ? (x - F.x0) / S : (F.x0 + S - x) / S;
            return P.ys + (P.ye - P.ys) * Math.max(0, Math.min(1, t));
        }

        var pads = [], extra = [], warps = [], used = [], says = [];
        var tee, cup, cupThing = 'plain', room = null, lastThing = null;
        pieces.forEach(function (P, k) {
            var F = frameOf(P), s = P.spec, kind = 'green';
            P.F = F;
            var straight = P.t === 'cell' && !!P.dout && P.dout === P.din, flat = !P.ramp;
            var w = [], q, b, p, thing = null;

            if (P.t === 'room') {
                P.thing = thing = dealRoom(r, d, s.role === 'fork' ? 'room' : s.role);
                if (s.role === 'fork') thing = P.thing = { id: 'fork', names: ['The Fork', 'Two Ways', 'Split Decision'], says: 'a fork' };
                room = P;
                p = A.pad(F.x0, F.z0, F.w, F.d, P.ys, 'green');
                pads.push(p);
                P.pad = p;
                buildRoom(P, F, p, w, k === last);
                lift(w, P.ys);
                extra = extra.concat(w);
                used.push(thing);
                if (k === 0) tee = { x: F.cx, z: F.z0 + 1.0 };
                return;
            }

            if (k > 0 && k < last && straight && !s.mouth && !s.landing && r() < 0.42 + 0.45 * d) thing = deal(r, d, flat, P.ys, lastThing && lastThing.id);
            if (k > 0 && k < last && !straight && !s.landing && r() < 0.12 * d) thing = THING.bumpers;
            P.thing = thing; lastThing = thing;
            if (thing) used.push(thing);
            // The carpet: tilted along a ramp.
            if (thing && thing.id === 'plank') {
                p = A.pad(F.x0 + (F.l[0] ? (S - 1.25) / 2 : 0), F.z0 + (F.l[1] ? (S - 1.25) / 2 : 0),
                    F.l[0] ? 1.25 : S, F.l[1] ? 1.25 : S, P.ys, 'wood');
            } else if (thing && thing.id === 'belt') {
                var sp = 1.3 + r() * 0.8, dir = r() < 0.25 * d ? -0.5 : 1;
                p = A.belt(F.x0, F.z0, S, S, F.f[0] * sp * dir, F.f[1] * sp * dir, { y: P.ys, kind: 'wood' });
            } else {
                if (thing && thing.id === 'ice') kind = 'ice';
                var sx = 0, sz = 0, y0 = P.ys, g = (P.ye - P.ys) / S;
                if (P.ramp) {
                    if (P.din === 'N') sz = g;
                    else if (P.din === 'S') { sz = -g; y0 = P.ye; }
                    else if (P.din === 'E') sx = g;
                    else { sx = -g; y0 = P.ye; }
                }
                p = A.pad(F.x0, F.z0, S, S, y0, kind, sx, sz);
            }
            pads.push(p);
            P.pad = p;

            // What stands in it.
            if (thing) switch (thing.id) {
                case 'bumpers':
                    b = r() < 0.5 ? 1 : -1;
                    q = at(F, -0.5, 0.75 * b); w.push(A.bumper(q[0], q[1], 0.5));
                    q = at(F, 0.6, -0.75 * b); w.push(A.bumper(q[0], q[1], 0.5));
                    if (d > 0.4 && straight) { q = at(F, 0.05, 0); w.push(A.bumper(q[0], q[1], 0.45)); }
                    break;
                case 'posts':
                    [-1.05, 0, 1.05].forEach(function (o) { var q2 = at(F, 0, o); w.push(A.post(q2[0], q2[1], 0.36)); });
                    break;
                case 'slalom':
                    b = r() < 0.5 ? 1 : -1;
                    [-1.0, 0, 1.0].forEach(function (a, i) { var q2 = at(F, a, (i % 2 ? -1 : 1) * b * 0.62); w.push(A.post(q2[0], q2[1], 0.34)); });
                    break;
                case 'hump':
                    q = at(F, 0, (r() - 0.5) * 0.8);
                    p.bumps = [A.hill(q[0], q[1], 1.35, 0.32 + 0.2 * r())];
                    break;
                case 'moguls':
                    p.bumps = moguls(r, F, 3, S / 2, S / 2);
                    break;
                case 'camber':
                    // The floor banked up against one rail, fading out at either end of the cell.
                    b = r() < 0.5 ? 1 : -1;
                    var c0 = at(F, -0.35, b * S / 2), c1 = at(F, 0.35, b * S / 2);
                    p.bumps = [A.trough(c0[0], c0[1], c1[0], c1[1], 1.4, 0.24 + 0.08 * r())];
                    break;
                case 'sand':
                    var along2 = F.f[1] !== 0, ra = 0.85 + r() * 0.2, rb = 1.05 + r() * 0.25;
                    q = at(F, 0, (r() - 0.5) * 0.7);
                    var sp2 = A.circle(q[0], q[1], along2 ? ra : rb, 'sand', P.ys, along2 ? rb : ra);
                    pads.push(sp2);
                    break;
                case 'spinner':
                    w.push(A.spinner(F.cx, F.cz, S * 0.58, 0.3, { spin: (r() < 0.5 ? 1 : -1) * (1.1 + 0.8 * r() + 0.5 * d) }));
                    break;
                case 'twin':
                    var sv2 = (r() < 0.5 ? 1 : -1) * (1.2 + 0.6 * r());
                    q = at(F, 0, -0.85); w.push(A.spinner(q[0], q[1], 1.3, 0.26, { spin: sv2 }));
                    q = at(F, 0, 0.85); w.push(A.spinner(q[0], q[1], 1.3, 0.26, { spin: -sv2 }));
                    break;
                case 'gate':
                    q = at(F, 0, 0);
                    var gw = S * 0.5, al = F.f[0] !== 0;
                    w.push(A.slider(q[0] - (al ? 0.15 : gw / 2), q[1] - (al ? gw / 2 : 0.15), al ? 0.3 : gw, al ? gw : 0.3,
                        { axis: al ? 'z' : 'x', amp: S * 0.27, speed: 1.2 + 0.8 * r(), phase: r() * TAU }));
                    break;
                case 'funnel':
                    // Two boards angled in from the rails to a throat two balls and a bit wide.
                    var th = 0.42 + 0.1 * r(), fa = (r() - 0.5) * 0.6;
                    w.push(board(at(F, fa - 1.0, -1.55), at(F, fa + 0.45, -th)));
                    w.push(board(at(F, fa - 1.0, 1.55), at(F, fa + 0.45, th)));
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
                case 'sling':
                    b = r() < 0.5 ? 1 : -1;
                    w = w.concat(slingAt(F, -1.2, 0.1, b, 0.85), slingAt(F, -0.1, 1.2, -b, 0.85));
                    break;
                case 'mill':
                    // Only on a north-running cell at golf's zero: a windmill faces down the lane.
                    if (P.din === 'N') {
                        w = w.concat(A.mill(F.x0, F.cz + 0.3, S, { gap: 1.3, speed: 0.7 + 0.5 * r(), len: 1.45, deep: 1.0 }));
                    } else {
                        w.push(A.spinner(F.cx, F.cz, S * 0.58, 0.3, { spin: 1.4 }));
                        P.thing = thing = THING.spinner;
                        used[used.length - 1] = thing;
                    }
                    break;
                case 'flipper':
                    b = r() < 0.5 ? 1 : -1;
                    q = at(F, 0.2, 0);
                    w.push(A.flipper(q[0], q[1], S * 0.62, { rest: F.f[0] !== 0 ? Math.PI / 2 : 0, arc: 1.1 * b, speed: 1.4 + r(), hinge: 1, phase: r() * TAU }));
                    break;
            }

            // A pipe: the mouth near the far end of the near island, the far end on the landing.
            if (s.mouth) {
                var mr = 0.62 - 0.12 * d, mo = (r() - 0.5) * 1.3;
                q = at(F, 0.55, mo);
                P.mouth = { x: q[0], z: q[1], r: mr };
            }
            if (s.landing) {
                var M = pieces[k - 1].mouth, lq = at(F, -0.6, 0);
                warps.push(A.pipe(M.x, M.z, lq[0], lq[1], Math.atan2(F.f[0], F.f[1]), M.r));
                says.push('a pipe across the gap');
            }
            lift(w, P.ys);
            extra = extra.concat(w);

            if (k === 0) tee = { x: F.cx, z: F.z0 + 1.0 };
            if (k === last) {
                var o = (r() - 0.5) * 1.1, ahead = 0.15 + r() * 0.5;
                cupThing = d < 0.2 ? pick(r, ['plain', 'bowl', 'sand']) : pick(r, ['plain', 'bowl', 'volcano', 'guard', 'volcano', 'sand']);
                // A mound or a dish wants the cup back from the way in, for the room to rise or fall in.
                if (cupThing === 'bowl' || cupThing === 'volcano') { o = (r() - 0.5) * 0.5; ahead = 0.45 + r() * 0.2; }
                q = at(F, ahead, o);
                cup = { x: q[0], z: q[1] };
                if (cupThing === 'bowl') land(p, cup, -(0.2 + 0.06 * r()), S / 2 + ahead);
                if (cupThing === 'volcano') land(p, cup, 0.24 + 0.08 * r(), S / 2 + ahead);
                if (cupThing === 'guard') {
                    var g1 = at(F, ahead - 0.95, o - 0.5), g2 = at(F, ahead - 0.95, o + 0.5);
                    extra = extra.concat(lift([A.post(g1[0], g1[1], 0.34), A.post(g2[0], g2[1], 0.34)], P.ys));
                }
                if (cupThing === 'sand') {
                    // A pot bunker either side of the front of the cup.
                    var s1 = at(F, ahead - 0.7, o - 1.0), s2 = at(F, ahead - 0.7, o + 1.0);
                    [s1, s2].forEach(function (sq) {
                        var bb = at(F, 0, 0), lim = S / 2 - 0.5;
                        var la = (sq[0] - bb[0]) * F.s[0] + (sq[1] - bb[1]) * F.s[1];
                        if (Math.abs(la) > lim) return;
                        pads.push(A.circle(sq[0], sq[1], 0.45, 'sand', P.ys));
                    });
                }
            }
        });

        /* A room's business. `w` collects its walls in golf's zero (lifted
           with the rest), `p` is its carpet. A plaza puts the cup somewhere in
           it, away from the door, and arranges its centrepiece round that. */
        function buildRoom(P, F, p, w, isLast) {
            var id = P.thing.id, q, b, i;
            if (P.spec.role === 'fork') {
                // A divider down the middle with a way round either end. The
                // door's own channel is the short way and has something in it;
                // the other is clear and a bank further.
                var half = S - 1.45;
                w.push(board(at(F, -half, 0), at(F, half, 0), { t: 0.3, kind: kerbKind }));
                var direct = P.exit === 'across' ? 1 : -1, other = -direct;
                var hard = pick(r, d > 0.4 ? ['gate', 'spinner', 'posts', 'flipper', 'mill'] : ['gate', 'spinner', 'posts', 'bumpers']);
                if (hard === 'mill' && !(P.din === 'N' && Math.abs(P.ys) < 1e-9)) hard = 'spinner';
                var cq = at(F, 0.2, direct * S / 2);
                if (hard === 'gate') {
                    var al = F.f[0] !== 0, gw = S * 0.5;
                    w.push(A.slider(cq[0] - (al ? 0.15 : gw / 2), cq[1] - (al ? gw / 2 : 0.15), al ? 0.3 : gw, al ? gw : 0.3,
                        { axis: al ? 'z' : 'x', amp: S * 0.24, speed: 1.3 + 0.7 * r(), phase: r() * TAU }));
                } else if (hard === 'spinner') {
                    w.push(A.spinner(cq[0], cq[1], S * 0.55, 0.3, { spin: (r() < 0.5 ? 1 : -1) * (1.3 + 0.6 * r()) }));
                } else if (hard === 'flipper') {
                    w.push(A.flipper(cq[0], cq[1], S * 0.6, { rest: F.f[0] !== 0 ? Math.PI / 2 : 0, arc: (r() < 0.5 ? 1 : -1) * 1.1, speed: 1.4 + r(), hinge: 1, phase: r() * TAU }));
                } else if (hard === 'mill') {
                    var mx = F.cx + F.s[0] * direct * S / 2 - S / 2;
                    w = w.concat(A.mill(mx, F.cz + 0.3, S, { gap: 1.3, speed: 0.7 + 0.5 * r(), len: 1.45, deep: 1.0 }));
                } else if (hard === 'posts') {
                    [-0.8, 0, 0.8].forEach(function (o, k2) { var q2 = at(F, 0.2 + (k2 % 2) * 0.5, direct * S / 2 + o); w.push(A.post(q2[0], q2[1], 0.34)); });
                } else {
                    q = at(F, -0.2, direct * S / 2 - 0.6); w.push(A.bumper(q[0], q[1], 0.5));
                    q = at(F, 0.6, direct * S / 2 + 0.6); w.push(A.bumper(q[0], q[1], 0.5));
                }
                // The long way may carry you: a belt down it, or a hump in it.
                if (r() < 0.45) {
                    var bv = 1.2 + r() * 0.6;
                    var bx = at(F, 0, other * S / 2);
                    var lat = S - 0.5, lng = 2 * half, ew = F.l[0] ? lat : lng, ns = F.l[0] ? lng : lat;
                    var belt = A.belt(bx[0] - ew / 2, bx[1] - ns / 2, ew, ns, F.f[0] * bv, F.f[1] * bv, { y: P.ys + 0.01, kind: 'wood' });
                    // Laid as a strip over the room's carpet, standing a hair proud of it.
                    pads.push(belt);
                    P.longWay = 'belt';
                } else {
                    q = at(F, 0, other * S / 2);
                    p.bumps = [A.hill(q[0], q[1], 1.2, 0.18 + 0.1 * r())];
                    P.longWay = 'hump';
                }
                P.hard = hard;
                return;
            }

            // Where the cup goes in a plaza: in the far half, off the door's side.
            if (isLast) {
                var ca = 0.5 + r() * 1.1, cb = (r() * 2 - 1) * 1.4;
                if (id === 'island' || id === 'pinball') { ca = 1.3 + r() * 0.5; cb = (0.3 + r() * 1.0) * (r() < 0.6 ? 1 : -1); }
                if (id === 'mesa' || id === 'bowl') { ca = 0.3 + r() * 0.9; cb = (r() * 2 - 1) * 1.0; }
                if (id === 'bigblade') { ca = 1.6 + r() * 0.3; cb = (r() * 2 - 1) * 1.4; }
                q = at(F, ca, cb);
                cup = { x: q[0], z: q[1] };
                P.cupAB = [ca, cb];
            }
            switch (id) {
                case 'island':
                    // A block turned on its corner: round it on either side.
                    var bs = 1.25 + r() * 0.3, ia = isLast ? P.cupAB[0] - 1.95 : (r() - 0.5) * 0.6,
                        ib = isLast ? P.cupAB[1] * 0.5 : (r() - 0.5) * 0.8;
                    q = at(F, ia, ib);
                    w.push(A.bank(q[0], q[1], bs, Math.PI / 4, { t: bs, h: RAIL + 0.15, kind: kerbKind }));
                    if (!isLast && r() < 0.5) {
                        q = at(F, ia + 1.6, ib - 1.4); w.push(A.post(q[0], q[1], 0.36));
                        q = at(F, ia + 1.6, ib + 1.4); w.push(A.post(q[0], q[1], 0.36));
                    }
                    break;
                case 'pinball':
                    var spots = isLast ? [[-0.6, -0.9], [-0.6, 0.9], [0.3, 0], [-1.5, 0]] :
                        [[-0.9, -1.0], [-0.9, 1.0], [0, 0], [0.9, -1.0], [0.9, 1.0]];
                    spots.forEach(function (sp) {
                        var qq = at(F, sp[0] + (r() - 0.5) * 0.3, sp[1] + (r() - 0.5) * 0.3);
                        if (cup && Math.hypot(qq[0] - cup.x, qq[1] - cup.z) < 1.1) return;
                        w.push(A.bumper(qq[0], qq[1], 0.5));
                    });
                    if (!isLast) {
                        // Kickers on the side rails, clear of a door in either.
                        w = w.concat(slingAt(F, -0.9, 0.6, -1, -S + 0.85, S - 0.15));
                        if (P.exit !== 'side') w = w.concat(slingAt(F, -0.9, 0.6, 1, S - 0.85, S - 0.15));
                    }
                    break;
                case 'bigblade':
                    q = isLast ? at(F, -0.2, 0) : at(F, 0, 0);
                    w.push(A.spinner(q[0], q[1], S * 1.0, 0.3, { spin: (r() < 0.5 ? 1 : -1) * (0.9 + 0.5 * r()) }));
                    break;
                case 'moguls':
                    p.bumps = moguls(r, F, 6, S, S);
                    break;
                case 'baffle':
                    // A wall from one side across most of the room, the gap on the side away from the door.
                    b = P.exit === 'across' || P.exit === 'side' ? 1 : (r() < 0.5 ? 1 : -1);
                    var gap = 1.5;
                    w.push(board(at(F, 0, -b * S), at(F, 0, b * (S - gap)), { t: 0.3, kind: kerbKind }));
                    q = at(F, -1.2, b * (S - 0.9)); w.push(A.post(q[0], q[1], 0.36));
                    break;
                case 'bunkers':
                    var spotsB = isLast ? [[P.cupAB[0] - 1.2, P.cupAB[1] - 0.9], [P.cupAB[0] - 0.5, P.cupAB[1] + 1.3]] :
                        [[-0.6, -0.9], [0.9, 1.0]];
                    spotsB.forEach(function (sp) {
                        var sa = Math.max(-S + 1.4, Math.min(S - 1.6, sp[0])), sb = Math.max(-S + 1.6, Math.min(S - 1.6, sp[1]));
                        var qq = at(F, sa, sb), rr = 0.6 + r() * 0.25;
                        if (cup && Math.hypot(qq[0] - cup.x, qq[1] - cup.z) < rr + C.HOLE_R + 0.35) return;
                        pads.push(A.circle(qq[0], qq[1], rr, 'sand', P.ys, rr * (1.1 + r() * 0.3)));
                    });
                    break;
                case 'corral':
                    // Eight posts round the cup with two of them missing: find the doorway.
                    var gapAt = Math.floor(r() * 8), R = 1.15;
                    for (i = 0; i < 8; i++) {
                        if (i === gapAt || i === (gapAt + 3 + Math.floor(r() * 3)) % 8) continue;
                        var ang = i / 8 * TAU;
                        var pa = P.cupAB[0] + Math.cos(ang) * R, pb = P.cupAB[1] + Math.sin(ang) * R;
                        if (Math.abs(pa) > S - 0.35 || Math.abs(pb) > S - 0.35 ||
                            Math.hypot(Math.max(0, Math.abs(pa) - (S - 2)), Math.max(0, Math.abs(pb) - (S - 2))) > 2 - 0.35) continue;
                        q = at(F, pa, pb);
                        w.push(A.post(q[0], q[1], 0.34));
                    }
                    break;
                case 'mesa':
                    land(p, cup, 0.3 + 0.08 * r(), P.cupAB[0] + S);
                    break;
                case 'bowl':
                    land(p, cup, -(0.22 + 0.06 * r()), P.cupAB[0] + S);
                    q = at(F, P.cupAB[0] - 1.9, P.cupAB[1] + (r() < 0.5 ? 1 : -1) * 0.7);
                    var bump = A.bumper(q[0], q[1], 0.5);
                    // On the dish's side: stood on the ground there, not on the rim's level.
                    bump.base += G3.physics.padHeight(p, q[0], q[1]) - P.ys;
                    w.push(bump);
                    break;
            }
        }

        // The kerbs: every side of every cell that neither leads on nor is inside its own room.
        var keys = {}, round = {};
        function empty(i, j) { return occ[key(i, j)] === undefined; }
        /* The corners with nothing round them get cut off, on any piece flat
           and plain enough — and how is the hole's own: all rounded, all at
           forty-five degrees, all left square, or a mix of the three
           (the owner, v1.185.0: "variation is the key"). */
        var cornerStyle = pick(r, ['round', 'round', 'cham', 'cham', 'square', 'mix', 'mix', 'mix']);
        pieces.forEach(function (P, k) {
            if (P.ramp || (P.thing && !{ bumpers: 1, hump: 1, moguls: 1, island: 1, pinball: 1, corral: 1, mesa: 1, bowl: 1, bunkers: 1, baffle: 1, bigblade: 1, fork: 1 }[P.thing.id])) return;
            if (P.t === 'cell' && P.pad && (P.pad.push || P.pad.kind === 'wood')) return;
            var F = P.F, out = {}, any = false, cham = {}, anyCham = false;
            var cs = [['sw', F.x0, F.z0, -1, -1], ['se', F.x0 + F.w, F.z0, 1, -1], ['nw', F.x0, F.z0 + F.d, -1, 1], ['ne', F.x0 + F.w, F.z0 + F.d, 1, 1]];
            cs.forEach(function (c) {
                // The piece's own cell at this corner, and the three round it.
                var oi = Math.round(c[1] / S) - (c[3] > 0 ? 1 : 0), oj = Math.round(c[2] / S) - (c[4] > 0 ? 1 : 0);
                if (!empty(oi + c[3], oj) || !empty(oi, oj + c[4]) || !empty(oi + c[3], oj + c[4])) return;
                var style = cornerStyle === 'mix' ? pick(r, ['round', 'cham', 'square']) : cornerStyle;
                if (style === 'square') return;
                var R = P.t === 'room' ? 2.0 : (k === 0 ? 1.1 : k === last ? 1.4 : S / 2);
                if (P.t === 'cell' && P.mouth) R = 1.1;
                out[c[0]] = R; any = true;
                if (style === 'cham') { cham[c[0]] = true; anyCham = true; }
                round[c[1] + ',' + c[2]] = { R: R, sx: c[3], sz: c[4], y: P.ys, cham: style === 'cham', P: P };
            });
            if (any) P.pad.round = out;
            if (anyCham) P.pad.cham = cham;
        });
        /* How far the ground along a kerb's foot rises over its floor and
           falls under it: [up, dip], read a hair inside the pad's edge. */
        function shaped(P, pts) {
            var pad = P && P.pad, up = 0, dip = 0;
            if (!pad || !pad.bumps) return [0, 0];
            var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2;
            pts.forEach(function (q) {
                var dx = cx - q[0], dz = cz - q[1], l = Math.hypot(dx, dz) || 1;
                var x = q[0] + dx / l * 0.12, z = q[1] + dz / l * 0.12;
                var g = G3.physics.padHeight(pad, x, z) - heightAt(P, x, z);
                up = Math.max(up, g); dip = Math.min(dip, g);
            });
            return [up, dip];
        }
        /* …and over the whole of a piece's outline, so all its kerbs rise
           together and a step in the rail falls at a joint between pieces
           rather than half-way along one. */
        function pieceShape(P) {
            if (!P) return [0, 0];
            if (P.shp) return P.shp;
            var up = 0, dip = 0;
            P.cells.forEach(function (c) {
                var x0 = c.i * S, z0 = c.j * S, x1 = x0 + S, z1 = z0 + S;
                [[[x0, z0], [x1, z0], 0, -1], [[x1, z0], [x1, z1], 1, 0], [[x1, z1], [x0, z1], 0, 1], [[x0, z1], [x0, z0], -1, 0]].forEach(function (e) {
                    if (cellAt[key(c.i + e[2], c.j + e[3])] === P) return;          // inside its own room
                    var pts = samples(e[0], e[1], 12).filter(function (q) { return G3.physics.padContains(P.pad, q[0] + Math.sign(P.F.cx - q[0]) * 0.13, q[1] + Math.sign(P.F.cz - q[1]) * 0.13); });
                    var g = shaped(P, pts);
                    up = Math.max(up, g[0]); dip = Math.min(dip, g[1]);
                });
            });
            return (P.shp = [up, dip]);
        }
        function samples(a, b, n) {
            var out = [], i;
            for (i = 0; i <= n; i++) out.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
            return out;
        }
        function rails(P, k) {
            P.cells.forEach(function (c) {
                if (P.thing && P.thing.id === 'plank') return;
                var x0 = c.i * S, z0 = c.j * S, x1 = x0 + S, z1 = z0 + S;
                [['N', [x0, z1], [x1, z1], [0, 1]], ['S', [x0, z0], [x1, z0], [0, -1]],
                 ['E', [x1, z0], [x1, z1], [1, 0]], ['W', [x0, z0], [x0, z1], [-1, 0]]].forEach(function (sd) {
                    var ek = edgeKey(c.i, c.j, sd[0]);
                    if (open[ek] || keys[ek]) return;
                    var nb = cellAt[key(c.i + sd[3][0], c.j + sd[3][1])];
                    if (nb === P) return;                                      // inside its own room
                    var a = sd[1].slice(), b = sd[2].slice();
                    var ya = heightAt(P, a[0], a[1]), yb = heightAt(P, b[0], b[1]), la = ya, lb = yb;
                    if (nb) {
                        // Two pieces side by side that do not lead into each other: one kerb, from the
                        // lower floor up to a rail's height over the higher.
                        var na = heightAt(nb, a[0], a[1]), nb2 = heightAt(nb, b[0], b[1]);
                        la = Math.min(ya, na); lb = Math.min(yb, nb2);
                        ya = Math.max(ya, na); yb = Math.max(yb, nb2);
                    }
                    keys[ek] = true;
                    // Stop short of a rounded corner; the curve is its own kerb.
                    var ra = round[a[0] + ',' + a[1]], rb = round[b[0] + ',' + b[1]];
                    var ux = (b[0] - a[0]) / S, uz = (b[1] - a[1]) / S;
                    if (ra) { a[0] += ux * ra.R; a[1] += uz * ra.R; }
                    if (rb) { b[0] -= ux * rb.R; b[1] -= uz * rb.R; }
                    var g1 = pieceShape(P), g2 = pieceShape(nb);
                    extra = extra.concat(kerb(a[0], a[1], b[0], b[1], ya, yb, kerbKind, la, lb,
                        Math.max(g1[0], g2[0]), Math.min(g1[1], g2[1])));
                });
            });
        }
        pieces.forEach(rails);
        Object.keys(round).forEach(function (kk) {
            var c = round[kk], xy = kk.split(',').map(Number);
            var cx = xy[0] - c.sx * c.R, cz = xy[1] - c.sz * c.R;
            // The two ends of the cut, on the pad's two sides.
            var e0 = [xy[0], cz], e1 = [cx, xy[1]];
            if (c.cham) {
                // Cut at forty-five degrees: one straight kerb across the corner.
                var gc = pieceShape(c.P);
                extra = extra.concat(kerb(e0[0], e0[1], e1[0], e1[1], c.y, c.y, kerbKind, c.y, c.y, gc[0], gc[1]));
                return;
            }
            var a0 = c.sx > 0 ? (c.sz > 0 ? 0 : -Math.PI / 2) : (c.sz > 0 ? Math.PI / 2 : Math.PI);
            var ga = pieceShape(c.P);
            extra = extra.concat(A.arc(cx, cz, c.R, a0, a0 + Math.PI / 2,
                { t: 0.3, h: RAIL + 0.1 + ga[0] - ga[1], base: c.y + ga[1] - 0.1, drawn: kerbKind, kind: kerbKind }));
        });

        // Par: two for the putt that is left, and one for every way the lane makes you work.
        var cellsN = pieces.reduce(function (s, P) { return s + (P.t === 'room' ? 2.5 : 1); }, 0);
        var turns = pieces.filter(function (P) { return P.t === 'cell' && P.dout && P.dout !== P.din; }).length;
        // Two turns the same way round, one after the other, double the lane back on itself: a hairpin.
        var senses = pieces.filter(function (P) { return P.t === 'cell' && P.dout && P.dout !== P.din; })
            .map(function (P) { return P.dout === left(P.din) ? 'L' : 'R'; });
        var uturn = senses.some(function (x, i) { return i > 0 && x === senses[i - 1]; });
        var hard = used.filter(function (t) { return ['mill', 'plank', 'flipper', 'gate', 'twin', 'fork'].indexOf(t.id) >= 0; }).length;
        var par = Math.max(2, Math.min(5, 2 + (cellsN >= 7 ? 1 : 0) + (turns >= 4 ? 1 : 0) + (hard >= 2 ? 1 : 0) +
            (uturn ? 1 : 0)));

        // A name: the hole's own shape where that is the point of it, else the thing it is built round.
        var main = used.length ? used[Math.floor(r() * used.length)] : null;
        var SHAPE_NAMES = {
            hairpin: ['The Hairpin', 'Out and Back', 'U-Turn', 'The Paperclip'],
            cascade: ['The Cascade', 'Staircase', 'Downhill Run', 'The Falls'],
            pipe: ['The Wormhole', 'Mind the Gap', 'Down the Pipe', 'The Crossing']
        };
        var name;
        if (SHAPE_NAMES[shape] && (r() < 0.65 || !main)) name = pick(r, SHAPE_NAMES[shape]);
        else if (room && r() < 0.7) name = pick(r, room.thing.names);
        else if (main) name = pick(r, main.names);
        else name = turns >= 3 ? 'The Switchback' : pieces.some(function (P) { return P.step; }) ? 'The Cascade' : pick(r, ['The Lane', 'Straight Shot', 'The Runway']);
        if (cupThing === 'volcano' && !main && !SHAPE_NAMES[shape]) name = 'The Volcano';

        var lead = [];
        if (shape === 'hairpin') lead.push('out and back round a hairpin');
        else if (turns) lead.push(turns === 1 ? 'one turn' : turns + ' turns');
        var steps = pieces.filter(function (P) { return P.step; }).length, ramps = pieces.filter(function (P) { return P.ramp; }).length;
        if (steps) lead.push(steps === 1 ? 'a step down' : steps + ' steps down');
        if (ramps) lead.push(ramps === 1 ? 'a ramp' : ramps + ' ramps');
        lead = lead.concat(says);
        var seen = {};
        used.forEach(function (t) {
            if (seen[t.id]) return;
            seen[t.id] = true;
            if (t.id === 'fork') {
                var fk = room;
                lead.push('a fork: ' + ({ gate: 'a gate', spinner: 'a blade', posts: 'posts', flipper: 'a flipper', mill: 'a windmill', bumpers: 'bumpers' }[fk.hard]) +
                    ' the short way, ' + (fk.longWay === 'belt' ? 'a belt' : 'a hump') + ' the long way');
            } else lead.push(t.says);
        });
        if (cupThing === 'volcano') lead.push('a cup on a mound');
        if (cupThing === 'bowl') lead.push('a bowl round the cup');
        if (cupThing === 'guard') lead.push('two posts guarding the cup');
        if (cupThing === 'sand') lead.push('pot bunkers by the cup');
        var blurb = (lead.length ? cap(list(lead)) + '.' : 'A straight lane.') + ' Riding through ' + entry.name +
            (entry.line ? ': ' + entry.line.charAt(0).toLowerCase() + entry.line.slice(1) : '.');

        var hole = PW.world({
            name: name, par: par, bag: ['putter', 'mallet'],
            blurb: blurb, pads: pads, extra: extra, tee: tee, cup: cup, warps: warps.length ? warps : undefined
        });
        hole.scene = entry.scene; hole.theme = entry.theme; hole.inWorld = entry.name;
        hole.endless = { seed: seed, n: n, shape: shape, cells: pieces.reduce(function (s, P) { return s + P.cells.length; }, 0),
            turns: turns, things: used.map(function (t) { return t.id; }), cup: cupThing, corners: cornerStyle };
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
            var k = c.holes.length, w = nextWorld(), was = c.holes[k - 1];
            var h = generate(mix(seed, k + 1), k, w, was && was.endless.shape);
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
        THINGS: THINGS, SHAPES: SHAPES, ROOMS: ROOMS, S: S
    };

    G3.ENDLESS = null;
    var plain = G3.courseById;
    G3.courseById = function (id) {
        if (String(id) === 'endless') return G3.ENDLESS || (G3.ENDLESS = course());
        return plain(id);
    };
})(window.G3);
