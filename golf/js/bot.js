/* The caddie — a planner made of nothing but physics.

   tests.html has carried a bot for as long as there have been courses: a
   breadth-first search over shots that is the suite's proof every hole can be
   holed out. This is the same idea, moved out of the suite so the game can
   play it on the real course, at real speed, from wherever the ball is
   standing — the way Loft Links' caddie does. game.js hands it the ball and
   strikes the shot it answers with through the same door a finger does.

   It searches rather than walks, for the reason the suite gives: greed has
   local minima, and a mini golf course is made of them — the wall you have to
   play away from, the moat you have to go round. So every stroke is planned
   as a whole line to the cup, shallowest first, and only the first shot of it
   is played. The next stroke plans again from wherever that one really
   stopped, which is what keeps a line through a moving gate honest: the gate
   is wherever it is by then, not wherever the plan last saw it.

   **It never overswings.** Past SAFE_POWER the ball leaves on a line the dice
   choose, and a plan made on a line the dice then move is not a plan. Inside
   the safe zone the arrow is the line, so the shot that is struck is the shot
   that was simulated — and the safe zone already coasts further than the
   field is long, so there is no hole it cannot reach. The suite plays the
   whole dial because it is asking a different question: whether a hole can be
   finished at all, not whether it can be finished on purpose.

   Pure, the way physics.js is: numbers in, numbers out, no canvas, no DOM.
   Every candidate is a whole world created, launched and settled, which is
   why the budget is a parameter — a frame the player is waiting on cannot
   afford what the suite can. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;
    var P = GOLF.physics;

    var CELL = 48;     // world px; a shot has to move about this far to be progress
    var VISITS = 2;    // arrivals in one cell, for timing round the moving gates

    var GRID = 10;     // world px per square of the walking map
    var BEAM = 14;     // lies looked on from at each depth of the search

    // Small, fast and seeded, so the same lie plays the same way twice.
    function mulberry32(a) {
        return function () {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            var t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    /* ── the walking map ─────────────────────────────────────────────────

       How far the cup is from a point *on foot*: round the walls, the posts
       and the water rather than through them, and through a tunnel for
       nothing. It is what the search ranks lies by, and straight-line
       distance is exactly the wrong ruler on the holes that make a search
       necessary — a ball on the far side of a long wall is a few inches from
       the cup and a whole leg away from it.

       A flood out from the cup over a grid, once per hole and kept. Moving
       walls are left out of it: where a gate is depends on when you ask, and
       a door that is shut now is open in a second. */
    var maps = typeof WeakMap === 'function' ? new WeakMap() : null;

    // A drawn hole may leave out the lists it does not use; physics.js reads
    // them the same forgiving way.
    var NONE = [];

    function blocked(course, x, y) {
        var r = C.BALL_R * 0.8, i;
        var walls = course.walls || NONE, rails = course.rails || NONE, posts = course.bumpers || NONE;
        if (P.zoneAt(course.water, x, y)) return true;
        for (i = 0; i < walls.length; i++) {
            if (!walls[i].move && P.circleRect(x, y, r, walls[i])) return true;
        }
        for (i = 0; i < rails.length; i++) {
            if (P.circleRail(x, y, r, rails[i])) return true;
        }
        for (i = 0; i < posts.length; i++) {
            if (P.circleCircle(x, y, r, posts[i])) return true;
        }
        return false;
    }

    function walkingMap(course) {
        var m = maps && maps.get(course);
        if (m) return m;
        var cols = Math.ceil(C.WORLD_W / GRID), rows = Math.ceil(C.WORLD_H / GRID);
        var n = cols * rows, i;
        var wall = new Uint8Array(n), dist = new Float64Array(n);
        for (i = 0; i < n; i++) {
            dist[i] = Infinity;
            wall[i] = blocked(course, (i % cols + 0.5) * GRID, (Math.floor(i / cols) + 0.5) * GRID) ? 1 : 0;
        }
        function at(x, y) {
            return Math.min(rows - 1, Math.max(0, Math.floor(y / GRID))) * cols +
                   Math.min(cols - 1, Math.max(0, Math.floor(x / GRID)));
        }
        // Each mouth leads to the other for free.
        var door = {};
        (course.tunnels || NONE).forEach(function (t) {
            var a = at(t.x, t.y), b = at(t.tx, t.ty);
            (door[a] = door[a] || []).push(b);
            (door[b] = door[b] || []).push(a);
        });
        // Dijkstra with a binary heap; eight neighbours, so a diagonal costs
        // its diagonal and the field is not measured in city blocks.
        var heap = [], keys = [];
        function push(c, d) {
            heap.push(c); keys.push(d);
            var k = heap.length - 1;
            while (k > 0) {
                var p = (k - 1) >> 1;
                if (keys[p] <= keys[k]) break;
                var tc = heap[p]; heap[p] = heap[k]; heap[k] = tc;
                var td = keys[p]; keys[p] = keys[k]; keys[k] = td;
                k = p;
            }
        }
        function pop() {
            var top = heap[0], last = heap.pop(), lk = keys.pop();
            if (heap.length) {
                heap[0] = last; keys[0] = lk;
                var k = 0;
                for (;;) {
                    var l = 2 * k + 1, r = l + 1, s = k;
                    if (l < heap.length && keys[l] < keys[s]) s = l;
                    if (r < heap.length && keys[r] < keys[s]) s = r;
                    if (s === k) break;
                    var tc = heap[s]; heap[s] = heap[k]; heap[k] = tc;
                    var td = keys[s]; keys[s] = keys[k]; keys[k] = td;
                    k = s;
                }
            }
            return top;
        }
        var start = at(course.hole.x, course.hole.y);
        dist[start] = 0;
        push(start, 0);
        var STEPS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
                     [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
        while (heap.length) {
            var d0 = keys[0], c = pop();
            if (d0 > dist[c]) continue;
            var cx = c % cols, cy = Math.floor(c / cols);
            for (i = 0; i < 8; i++) {
                var nx = cx + STEPS[i][0], ny = cy + STEPS[i][1];
                if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
                var nc = ny * cols + nx;
                if (wall[nc]) continue;
                var nd = d0 + STEPS[i][2] * GRID;
                if (nd < dist[nc]) { dist[nc] = nd; push(nc, nd); }
            }
            (door[c] || []).forEach(function (o) {
                if (d0 < dist[o]) { dist[o] = d0; push(o, d0); }
            });
        }
        m = { cols: cols, rows: rows, dist: dist };
        if (maps) maps.set(course, m);
        return m;
    }

    /* The walk from (x, y) to the cup. A ball resting against a wall has its
       centre a radius off the paint, which can be inside a square the map
       counts as wall, so the nearest open square round it answers instead —
       and anywhere the map cannot reach at all is far, not nowhere. */
    function walk(map, x, y) {
        var cx = Math.floor(x / GRID), cy = Math.floor(y / GRID), best = Infinity;
        for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
                var ax = cx + dx, ay = cy + dy;
                if (ax < 0 || ay < 0 || ax >= map.cols || ay >= map.rows) continue;
                var d = map.dist[ay * map.cols + ax];
                if (d < best) best = d;
            }
        }
        return best === Infinity ? 1e6 : best;
    }

    /* One candidate, played out: from `ball`, aimed along `aim`, struck at
       `time`. A fresh world is the whole of the state that carries from one
       shot to the next — `launch` resets everything else a shot accumulates. */
    function trial(course, ball, time, aim, power) {
        var w = P.createWorld(course, ball, time);
        if (!P.launch(w, aim, power)) return null;
        return P.settle(w);
    }

    /* A shot from `s` before it is played: the line, the weight and the wait.
       Most go somewhere near the cup and the rest anywhere at all, because the
       way round a wall starts by facing away from the flag. The suite's
       spread, for the suite's reason. */
    function candidate(s, cup, rand, gates) {
        var toCup = Math.atan2(cup.y - s.y, cup.x - s.x);
        return {
            aim: rand() < 0.65 ? toCup + (rand() - 0.5) * 0.9 : rand() * Math.PI * 2,
            power: C.MIN_POWER + rand() * (C.SAFE_POWER - C.MIN_POWER),
            wait: gates ? rand() * 3 : 0
        };
    }

    /* The shots worth trying first from where the ball really is: at the cup,
       at a ladder of weights round the one that coasts exactly that far on
       grass (v / -ln k). On an open green one of these is the putt, and
       finding it in the first dozen tries rather than the first thousand is
       what keeps an easy stroke quick. */
    function direct(s, cup, gates) {
        var out = [], toCup = Math.atan2(cup.y - s.y, cup.x - s.x);
        var v = Math.hypot(cup.x - s.x, cup.y - s.y) * -Math.log(C.FRICTION_GRASS);
        [-0.03, 0, 0.03].forEach(function (da) {
            [0.85, 1, 1.1, 1.25, 1.45].forEach(function (k) {
                (gates ? [0, 0.6, 1.2, 1.8, 2.4] : [0]).forEach(function (wait) {
                    out.push({ aim: toCup + da, wait: wait,
                               power: Math.min(C.SAFE_POWER, Math.max(C.MIN_POWER, v * k)) });
                });
            });
        });
        return out;
    }

    /* The search. `ball` is where it stands and `time` the earliest moment
       the first shot can be struck. `opts.strokes` is how many are left before
       the pick-up, and `opts.gap` the beat the game spends between one shot
       stopping and the next being struck — so the clock the plan's later
       shots are timed on is the clock the game will really keep.

       Answers the whole of the shortest line it found to the cup, as
       `{ shots, line, sims }`. Each shot is `{ aim, power, wait, at, from, to }`:
       the line and the weight, the world time to strike on, where the ball
       has to be standing for it and where it comes to rest (null for the one
       that drops). The physics is deterministic at a fixed step, so the game
       can play the line out a shot at a time, and has only to check that the
       ball really stopped where the plan said before trusting the next one.

       When it finds no line inside its budget it answers the way to whichever
       lie it reached nearest the cup on foot, with `line` 0 — a caddie that
       refuses to swing is no use to anybody watching. Null only when nothing
       it tried went anywhere at all. */
    function bestShot(course, ball, time, opts) {
        opts = opts || {};
        var budget = opts.budget || 2400;
        var fan = opts.fan || 24;
        var strokes = Math.max(1, opts.strokes || 6);
        var gap = opts.gap || 0;
        var rand = mulberry32(opts.seed || 1);
        var cup = course.hole;
        var gates = (course.walls || NONE).some(function (w) { return w.move; });
        var cols = Math.ceil(C.WORLD_W / CELL);
        var map = walkingMap(course);
        var visits = {};
        var sims = 0;
        var near = null;

        function cell(x, y) { return Math.floor(y / CELL) * cols + Math.floor(x / CELL); }

        // Back up the chain of lies to the ball, a shot at a time.
        function answer(lie, last, line) {
            var shots = last ? [last] : [];
            for (var l = lie; l && l.shot; l = l.prev) shots.unshift(l.shot);
            return shots.length ? { shots: shots, line: line, sims: sims } : null;
        }

        var root = { x: ball.x, y: ball.y, time: time, prev: null, shot: null };
        visits[cell(ball.x, ball.y)] = 1;
        var level = [root];

        /* A depth at a time, so the first cup it drops into is the fewest
           strokes it found. Every lie one stroke on is kept, one per cell —
           twice for the moving gates, where a dead end at one phase of a
           sweeping bar is a way through at another — but only the BEAM of
           them nearest the cup on foot are looked on from. Without the beam
           the second stroke alone is a hundred lies and the budget is spent
           before the third is ever tried, which is the whole of a hole with
           three bridges on it. */
        for (var depth = 0; depth < strokes && level.length; depth++) {
            var next = [];
            for (var head = 0; head < level.length; head++) {
                var s = level[head];
                var tries = s === root ? direct(s, cup, gates) : [];
                // The first stroke is the one played for certain, so it gets
                // the widest look.
                var n = s === root ? fan * 4 : fan;
                for (var k = 0; k < n; k++) tries.push(candidate(s, cup, rand, gates));
                for (var j = 0; j < tries.length; j++) {
                    if (sims >= budget) return answer(near, null, 0);
                    var c = tries[j];
                    var at = s.time + c.wait;
                    var w = trial(course, s, at, c.aim, c.power);
                    sims++;
                    if (!w) continue;
                    var shot = { aim: c.aim, power: c.power, wait: c.wait, at: at,
                                 from: { x: s.x, y: s.y }, to: null };
                    if (w.sunk) return answer(s, shot, depth + 1);
                    // A splash is a stroke and a replay from where it was
                    // played: never an edge worth following.
                    if (w.splash) continue;
                    var ci = cell(w.ball.x, w.ball.y);
                    if ((visits[ci] || 0) >= VISITS) continue;
                    visits[ci] = (visits[ci] || 0) + 1;
                    shot.to = { x: w.ball.x, y: w.ball.y, time: w.time };
                    var lie = { x: w.ball.x, y: w.ball.y, time: w.time + gap, prev: s, shot: shot,
                                walk: walk(map, w.ball.x, w.ball.y) };
                    if (!near || lie.walk < near.walk) near = lie;
                    next.push(lie);
                }
            }
            next.sort(function (a, b) { return a.walk - b.walk; });
            level = next.slice(0, BEAM);
        }
        return answer(near, null, 0);
    }

    GOLF.bot = {
        CELL: CELL,
        VISITS: VISITS,
        BEAM: BEAM,
        walkingMap: walkingMap,
        walk: walk,
        mulberry32: mulberry32,
        bestShot: bestShot
    };

})(window.GOLF);
