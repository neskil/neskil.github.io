/* The bot — a greedy player made of nothing but physics.

   It was written for tests.html, where it is the strongest thing the suite
   says: every hole on every course can actually be holed out, out of the bag
   that hole hands out, by something with no knowledge of the course beyond
   what the physics will tell it. A hole that stops being solvable stops being
   a hole, and this is what notices.

   It lives here rather than inside the suite because the game plays it too.
   The simulation mode in game.js hands it the ball where the player left it
   and plays its answers on the real course, at real speed, so you can watch
   the same thing the tests only ever counted. There it plays with a plan
   (`Planner`, "the plan" below): the same search, scored by a route to the
   cup rather than by the distance to it, because a greedy player is stuck
   for good wherever the road goes away from the flag first.

   Pure, the way physics.js and flyover.js are pure: numbers in, numbers out,
   no three.js and no DOM. Every shot it considers is a whole world created,
   launched and settled — thousands of them per stroke — which is why the fan
   is a parameter (`opts.fan`): the suite can afford the wide one, and a frame
   the player is waiting on cannot. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var P = G3.physics;

    var SECONDS = 12;     // long enough for any shot on any hole to come to rest
    var DT = 1 / 60;

    /* A shot that finishes jammed against a rail is genuinely worth about a
       stroke less than the same distance in the open, and this is that stroke.

       Without it the bot gets stuck: a ball resting against a wall has no shot
       that goes forward at all — it would have to climb the paint inside its
       own radius — so every legal shot scores worse than standing still, and a
       greedy player replays the same nothing until it runs out of strokes. A
       human looks at that lie and plays sideways, giving up a stroke on
       purpose. Telling the bot to see the lie is the honest version of that. */
    var BLOCKED = 4;

    function d2(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }

    /* Is there a wall right in front of the ball, between it and the cup? Only
       in front counts; one behind or beside costs nothing to play from. */
    function blockedLie(hole, ball, cup, time) {
        var dx = cup.x - ball.x, dz = cup.z - ball.z;
        var len = Math.hypot(dx, dz);
        if (len < 1e-6) return false;
        var px = ball.x + dx / len * (C.BALL_R + 0.2);
        var pz = ball.z + dz / len * (C.BALL_R + 0.2);
        var i, B;
        for (i = 0; i < hole.walls.length; i++) {
            B = P.wallBox(hole.walls[i], time);
            if (ball.y - C.BALL_R >= B.top || ball.y + C.BALL_R <= B.base) continue;
            if (P.circleBox(px, pz, C.BALL_R, B)) return true;
        }
        return false;
    }

    /* ── hands ───────────────────────────────────────────────────────

       Everything above and below this plays a perfect stroke: the ball leaves
       on exactly the line and the weight that were chosen. That is right for
       the suite, which is asking whether a hole can be done at all, and wrong
       for the question a course designer asks, which is whether it is fair.
       A perfect striker happily threads a ball between two splashes, because
       in its world there is no splash either side of the line it chose.

       `opts.hands` (CONFIG.BOT_HANDS) gives it a person's misses: every shot
       it plays leaves off line and off weight by a normal draw, and it picks
       its shot knowing that — each of the best candidates is played several
       more times with the same misses, and the one with the best *average*
       wins. So a hole whose only good line is a needle shows up as strokes on
       the card and balls in the sea, rather than as an eagle. */
    function gauss(rnd) {
        var u = Math.max(1e-9, rnd()), v = rnd();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    function handFor(club, hands) {
        return club.loft > 0 || !hands.putt ? hands : hands.putt;
    }

    /* The stroke actually played, given the one meant. Never past the club's
       full swing: a person swinging at the top of the meter misses short, not
       long, and the overdraw is a decision of its own rather than a miss. */
    function mishit(club, yaw, power, hands, rnd) {
        var h = handFor(club, hands);
        return {
            yaw: yaw + gauss(rnd) * h.yaw,
            power: Math.max(C.MIN_POWER, Math.min(club.power, power * (1 + gauss(rnd) * h.power)))
        };
    }

    /* And the moment: how far either side of the beat it meant to strike on
       a person actually strikes (`hands.time`). Drawn only on a hole where
       something moves, so every still hole keeps the very same draws, and
       never before the ball can be struck at all. */
    function late(hole, hands, rnd, wait) {
        if (!hands.time || !moving(hole)) return 0;
        return Math.max(-wait, gauss(rnd) * hands.time);
    }

    /* About how many strokes are left from a finish — the scale a noisy shot
       has to be judged on, where distance to the cup alone would call a ball
       in the sea "500 units away" and let one splash in eight outweigh
       everything else. Rough numbers, and they only have to rank: holed is
       nothing, on the green is a putt or two by length, off it is a chip or a
       drive's worth of distance plus a putt, worse out of sand and rough, and
       a splash is a stroke plus playing again from where it was struck. */
    function toGo(hole, w, here) {
        if (w.sunk) return 0;
        if (w.splash || w.out) return 1 + here;
        var d = d2(w.ball, hole.cup);
        var lie = P.surfaceUnder(hole, w.ball.x, w.ball.z, w.ball.y + 0.05);
        var kind = lie ? lie.pad.kind : 'rough';
        if (kind === 'green') return d < 0.3 ? 1 : 1 + Math.min(1.2, (d - 0.3) / 12);
        return 1.8 + d / 26 + (kind === 'sand' ? 0.35 : kind === 'rough' ? 0.15 : 0) +
            (blockedLie(hole, w.ball, hole.cup, w.time) ? 1 : 0);
    }

    /* What a ball at `from` is standing in. Out of a bunker the long clubs
       have a lower ceiling (physics.fromLie), and a bot that did not know
       would plan a drive the game will not play — so every stroke it chooses
       or strikes is capped by this, misses included. */
    function lieAt(hole, from) {
        var under = P.surfaceUnder(hole, from.x, from.z, from.y + C.STEP_UP);
        return under ? under.pad.kind : null;
    }

    /* One candidate, played out in a throwaway world. */
    function trial(hole, from, yaw, power, loft, time, bite, opts) {
        var w = P.createWorld(hole, from, time);
        if (!P.launch(w, yaw, power, loft, bite)) return null;
        P.settle(w, opts.seconds, opts.dt);
        return w;
    }

    /* The search. Fan out candidate shots around the line to the cup, keep the
       one that ends nearest it, then refine twice around that — the refinements
       are what give it the precision to actually hole out rather than to get
       close.

       It plays out of the bag it is handed, so this is a claim about the clubs
       that exist rather than about any loft the physics would accept.

       Holes with moving parts get candidates that wait before striking: a bot
       that always fires at t=0 would report a false failure on a timing hole.
       And a chosen shot has to go somewhere — that is the `moved` rule, and it
       is the other half of the fix BLOCKED starts.

       It is a queue of candidates worked through a few at a time — `run(n)`
       takes at most n more and says when it is finished — so the game can
       spread the caddie's choice over frames rather than stop the world for
       it. `bestShot` is the same search run to the end in one go, candidate
       for candidate the search it always was. */
    function Search(hole, from, time, bag, opts) {
        opts = opts || {};
        var self = this, fan = opts.fan || 16, cup = hole.cup, i;
        var base = Math.atan2(cup.x - from.x, cup.z - from.z);
        this.hole = hole; this.from = from; this.time = time; this.opts = opts;
        this.seconds = opts.seconds || SECONDS;
        this.dt = opts.dt || DT;
        this.sims = 0;
        // All four kinds of motion — a flipper (`swing`) and a windmill's
        // `sails` are timing holes too, and this once asked about two of them
        // (golf3d/CLAUDE.md, "a wall may move four ways").
        this.waits = moving(hole) ? [0, 0.45, 0.95, 1.5] : [0];
        /* `opts.score` is the planner's (see "the plan", below): strokes to
           go from wherever a candidate comes to rest, read off the route it
           found, in place of the distance to the cup. Everything else about
           the search is the same search. */
        this.score = opts.score || null;
        this.here = this.score ? opts.here : d2(from, cup);
        this.best = null;
        this.pool = opts.hands ? [] : null;
        bag = bag || C.CLUBS;
        this.lie = lieAt(hole, from);
        // A club the lie will not take is not in the bag for this stroke —
        // the driver in a bunker (physics.playable) — as it is not in the
        // player's.
        var allowed = bag.filter(function (c) { return P.playable(c, self.lie); });
        this.bag = allowed.length ? allowed : bag;
        this.queue = []; this.qi = 0; this.stage = 0;
        this.done = false; this.result = null;
        // A shot the planner has already played (`opts.seed`) is not played
        // twice: its world comes with it.
        if (opts.seed) {
            opts.seed.forEach(function (c) {
                self.queue.push({ yaw: c.yaw, club: c.club, power: c.power, wait: 0, world: c.world });
            });
        } else {
            this.bag.forEach(function (club) {
                for (i = 0; i < fan; i++) {
                    [0.35, 0.7, 1].forEach(function (f) {
                        self.queue.push({ yaw: base + (i / fan) * Math.PI * 2, club: club,
                                          power: self.top(club) * f, wait: 0 });
                    });
                }
            });
        }
    }

    // The fan is spread over the swing the lie allows, not the club's whole
    // one, or two of every three tries out of a bunker are the cap.
    Search.prototype.top = function (club) { return Math.min(club.power, P.lieCeiling(club, this.lie)); };

    Search.prototype.trial = function (yaw, club, power, wait) {
        var memo = this.opts.memo, w;
        if (memo) {
            w = memo(yaw, club, power, wait);
            if (w !== undefined) return w;
        }
        this.sims++;
        return trial(this.hole, this.from, yaw, power, club.loft, this.time + wait, club.bite,
                     { seconds: this.seconds, dt: this.dt });
    };

    Search.prototype.consider = function (c) {
        var hole = this.hole, from = this.from, cup = hole.cup, s, w, moved;
        if (c.steady !== undefined) return this.mishit(c);
        // The club's own backspin, so the bot is playing the clubs the
        // player is handed rather than five-sixths of them.
        var power = P.fromLie(c.power, c.club, this.lie);
        w = c.world !== undefined ? c.world : this.trial(c.yaw, c.club, power, c.wait);
        if (!w) return;
        moved = Math.hypot(w.ball.x - from.x, w.ball.z - from.z);
        if (w.sunk) s = -1000;
        else if (this.score) s = w.splash || w.out ? 1 + this.here : this.score(w);
        else if (w.splash || w.out) s = 500 + d2(w.origin, cup);
        else s = d2(w.ball, cup) +
            (blockedLie(hole, w.ball, cup, w.time) ? BLOCKED : 0) +
            (this.opts.penalty ? this.opts.penalty(w) : 0);
        if (!w.sunk && moved < 1 && s >= this.here) return;
        c = { s: s, yaw: c.yaw, club: c.club, power: power, wait: c.wait, world: w };
        if (this.pool) this.pool.push(c);
        if (!this.best || s < this.best.s) this.best = c;
    };

    Search.prototype.next = function () {
        var self = this, b = this.best, waits = this.waits;
        this.queue = []; this.qi = 0;
        if (this.stage === 0) {
            if (!b) return this.finish(null);
            // A holed shot cannot be beaten, so the planner stops at one; the
            // greedy search refines on regardless, as it always has.
            if (this.score && !this.pool && b.s === -1000) return this.finish(b);
            this.stage = 1;
            [-2, -1, 0, 1, 2].forEach(function (k) {
                self.bag.forEach(function (club) {
                    /* 0.9 because a window can sit between the last two:
                       Deadlift's second step takes the mallet at 90–99% and
                       nothing either side of it, and a bot that only tried
                       75 and 100 reported a hole nobody could finish. */
                    [0.25, 0.5, 0.75, 0.9, 1].forEach(function (f) {
                        waits.forEach(function (wait) {
                            self.queue.push({ yaw: b.yaw + k * 0.11, club: club,
                                              power: self.top(club) * f, wait: wait });
                        });
                    });
                });
            });
        } else if (this.stage === 1) {
            this.stage = 2;
            [-3, -2, -1, 0, 1, 2, 3].forEach(function (k) {
                [-0.7, -0.35, 0, 0.35, 0.7].forEach(function (dp) {
                    waits.forEach(function (wait) {
                        self.queue.push({ yaw: b.yaw + k * 0.03, club: b.club,
                            power: Math.max(C.MIN_POWER, Math.min(self.top(b.club), b.power + dp)),
                            wait: wait });
                    });
                });
            });
        } else if (this.stage === 2 && this.pool && b) {
            this.stage = 3;
            this.steady();
        } else if (this.stage === 3) {
            var i, q, best = null;
            for (i = 0; i < this.picked.length; i++) {
                q = this.sums[i] / this.tries;
                if (!best || q < best.mean) { best = this.picked[i]; best.mean = q; }
            }
            this.finish(best);
        } else {
            this.finish(b);
        }
    };

    /* The hands' half of the choice. Every candidate the search found is
       ranked by strokes left (toGo, or the planner's value) rather than by
       distance, the best dozen distinct ones are each played `opts.tries`
       more times through mishit, and the lowest average wins — so a safe
       line to the fat of an island beats a perfect one past the edge of it.
       The misses are drawn up front, in the order they always were, so the
       same seed is the same round however the playing of them is sliced. */
    Search.prototype.steady = function () {
        var opts = this.opts, hole = this.hole, rnd = opts.rng || Math.random, hands = opts.hands;
        var tries = opts.tries || 8, keep = opts.keep || 12, pool = this.pool, self = this;
        var value = this.value = opts.value || toGo;
        var here = this.vhere = value(hole, { ball: this.from, time: this.time }, 0);
        pool.forEach(function (c) { c.e = value(hole, c.world, here); });
        pool.sort(function (a, b) { return a.e - b.e; });
        var picked = [], i, j, c, m;
        for (i = 0; i < pool.length && picked.length < keep; i++) {
            c = pool[i];
            if (picked.some(function (o) {
                return o.club === c.club && Math.abs(o.yaw - c.yaw) < 0.02 &&
                    Math.abs(o.power - c.power) < 0.25;
            })) continue;
            picked.push(c);
        }
        this.picked = picked; this.tries = tries; this.sums = [];
        for (i = 0; i < picked.length; i++) {
            c = picked[i];
            this.sums.push(0);
            for (j = 0; j < tries; j++) {
                m = mishit(c.club, c.yaw, c.power, hands, rnd);
                self.queue.push({ steady: i, yaw: m.yaw, club: c.club,
                                  power: P.fromLie(m.power, c.club, this.lie),
                                  wait: c.wait + late(hole, hands, rnd, c.wait) });
            }
        }
    };

    Search.prototype.mishit = function (c) {
        this.sims++;
        var w = trial(this.hole, this.from, c.yaw, c.power, c.club.loft, this.time + c.wait, c.club.bite,
                      { seconds: this.seconds, dt: this.dt });
        this.sums[c.steady] += w ? this.value(this.hole, w, this.vhere) : 1 + this.vhere;
    };

    Search.prototype.finish = function (best) {
        if (best) best.sims = this.sims;
        this.result = best;
        this.done = true;
    };

    // Take at most n more candidates; true once the search is finished.
    Search.prototype.run = function (n) {
        while (n > 0 && !this.done) {
            if (this.qi >= this.queue.length) { this.next(); continue; }
            this.consider(this.queue[this.qi++]);
            n--;
        }
        return this.done;
    };

    function bestShot(hole, from, time, bag, opts) {
        var s = new Search(hole, from, time, bag, opts);
        s.run(Infinity);
        return s.result;
    }

    /* ── the plan ────────────────────────────────────────────────────────

       Everything above is greedy: of the shots it tries, it plays the one
       that finishes nearest the cup. That is the right answer on most holes
       and exactly the wrong one wherever the road first goes away from the
       flag or across it — a plank off to one side, a vent behind the ball, a
       belt along a rim, a pipe, the long way round a wall. The owner watched
       it fail twice in the same way. On Dead Weight it ran the tee shot up to
       the edge of the gap, straight at the cup, and then putted a unit east
       and a unit west along the brink until it was out of strokes: every
       forward shot from there falls off, the plank was a unit and a half to
       the east, and a unit and a half to the east is *further* from the cup.
       On the old Caldera it was the lawn's lip past the vent, with the lake
       in front and the only way out two shots long — back, then over the
       vent. A sideways putt passes the `moved` rule (it goes somewhere), so
       nothing stopped it but the stroke limit.

       So the caddie makes a plan. Positions are the nodes of a graph and
       shots are its edges, each one a stroke:

       - **Value of a position.** `estimate` is a rough strokes-to-go read
         off the distance and the lie — a putt or two by length on a green, a
         drive's worth plus a putt off it. It is blind to gaps and machinery,
         and it only has to be a guess: it is what the search is steered by,
         not what it decides on.
       - **The graph.** A position is expanded by playing a fan of shots from
         it (every club, a dozen lines — fewer when the bag is long — and
         four weights) and then short refinements round the three most
         promising: the same coarse-then-fine shape as the greedy search,
         because a plank is a needle that a coarse fan walks straight past.
         The ball's own lie gets a denser fan and the greedy search's second
         stage on top, so whatever the greedy search would have found is in
         the graph too. Where each shot comes to rest is a child; rests within
         half a unit of each other, on the same level, are one node, so two
         ways to the same spot share what was learned from it. A splash or a
         ball off the edge is no edge at all, and a shot that finds the cup
         marks the node as one stroke from home — and, struck perfectly,
         ends its expansion there, since nothing can beat it.
       - **The route.** A* over that graph from the ball: the open position
         with the fewest strokes so far plus its estimate is expanded next,
         until a route to the cup is found that nothing open could beat, or
         the budget of simulated shots (`PLAN_SIMS`, `REPLAN_SIMS`) is spent.
         Then every node's value is backed up from its children — the fewest
         strokes to the cup through anything expanded, the estimate where the
         search stopped — which is Dijkstra run backwards from the cup.
       - **Hands.** A route found by perfect strikes is a route for a perfect
         striker, so with `opts.hands` the plan does not choose the shot: the
         greedy search does, told where the traps are (`pick`).
       - **The shot.** The greedy search is run once more from the ball, with
         the backed-up value in place of the distance (`opts.score`). So it
         still refines and still holes out, but what it refines towards is
         the first shot of the best route rather than the nearest finish.
       - **Replanning.** The planner keeps its graph for the hole. Every shot
         plans again from where the ball actually is, and a node it has
         expanded before costs nothing to cross, so later shots are cheap.
         A lie it has already played from is worth a stroke more each time —
         a stall breaker, in case a plan ever points back the way it came.
       - **Honest.** Every edge is a shot `physics` played out of the bag the
         hole hands out, struck at the moment it would be struck (a node
         carries the time its ball stopped, plus `opts.gap` for the walk up
         to it). Nothing is random but the hands' own draw, so the same hole
         gives the same plan. And where the plan has nothing to say — every
         child unexplored, or no shot at all — the search is the greedy
         search it always was.

       All of it is resumable, because the game cannot freeze for a second
       and a half: `begin` roots a plan at the ball, `step(n)` spends at most
       n more simulated shots on the route and says when it is finished, and
       `pick` hands back the choosing as a Search to run in slices too
       (`choose` is the two in one go). The answer depends only on the
       budget, never on how the steps were sliced, so the game's frames and
       a headless `play` get the same plan. */
    var PLAN_SIMS = 1800;     // the first shot on a hole: the whole graph to build
    var REPLAN_SIMS = 700;    // every shot after it, most of the graph cached
    var DEPTH = 6;            // no route is planned past six strokes
    var NEAR = 0.5;           // rests closer than this are one node…
    var LEVEL = 0.3;          // …if they are on the same level
    var LOOK = 0.9;           // how far a candidate looks for a node's value

    /* Strokes to go, by eye. Holed is nothing; on a putting surface — and on
       a drawn hole that is everything but the sand — a stroke and a twelfth
       of one per unit; off a long-game green, toGo's chip-and-a-putt. Unlike
       toGo it is not capped, because the search has to tell twenty units
       from forty. */
    function estimate(hole, x, y, z) {
        var d = Math.hypot(x - hole.cup.x, z - hole.cup.z);
        var lie = P.surfaceUnder(hole, x, z, y + 0.05);
        var kind = lie ? lie.pad.kind : 'rough';
        if (!hole.longGame || kind === 'green') {
            return 1 + Math.max(0, d - 0.3) / 12 + (kind === 'sand' ? 0.35 : 0);
        }
        return 1.8 + d / 26 + (kind === 'sand' ? 0.35 : kind === 'rough' ? 0.15 : 0);
    }

    function moving(hole) {
        return hole.walls.some(function (wl) { return wl.move || wl.spin || wl.swing || wl.sails; });
    }

    function Planner(hole, bag, opts) {
        opts = opts || {};
        this.hole = hole;
        this.bag = bag || C.CLUBS;
        this.opts = opts;
        this.fan = opts.fan || 16;
        /* The ball's own lie is fanned out densely: 72 lines shared between
           the clubs (36 each for a putter and a mallet), never fewer than the
           fan. An ace off a bank is a window a few degrees wide (Bumper City's
           mallet off the side rail is three), and the root is the one node
           whose shot is actually played. Everywhere else a long bag gets a
           coarser fan, 48 lines between the clubs and never under six: seven
           clubs at a dozen lines is a third of a second of the long game's
           physics for every node, and most of them are a driver from a lie a
           wedge's length from the pin. */
        this.rootFan = opts.rootFan || Math.max(this.fan, Math.round(72 / this.bag.length));
        this.innerFan = Math.min(this.fan, Math.max(6, Math.round(48 / this.bag.length)));
        this.gap = opts.gap || 0;
        this.moves = moving(hole);
        this.nodes = [];
        this.cells = {};
        this.visits = [];
        this.memo = {};
        this.gen = 0;
        this.sims = 0;
    }

    Planner.prototype.cellKey = function (i, j) { return i + ',' + j; };

    // The node nearest a position within r on the same level, or null.
    Planner.prototype.near = function (b, r) {
        var k = Math.ceil(r / NEAR), ci = Math.floor(b.x / NEAR), cj = Math.floor(b.z / NEAR);
        var best = null, bd = r, i, j, list, n, m, d;
        for (i = -k; i <= k; i++) {
            for (j = -k; j <= k; j++) {
                list = this.cells[this.cellKey(ci + i, cj + j)];
                if (!list) continue;
                for (m = 0; m < list.length; m++) {
                    n = list[m];
                    if (Math.abs(n.y - b.y) >= LEVEL) continue;
                    d = Math.hypot(n.x - b.x, n.z - b.z);
                    if (d < bd) { bd = d; best = n; }
                }
            }
        }
        return best;
    };

    Planner.prototype.node = function (b, t) {
        var n = this.near(b, NEAR);
        if (n) return n;
        n = { x: b.x, y: b.y, z: b.z, t: t, est: estimate(this.hole, b.x, b.y, b.z),
              edges: null, sinks: false, value: 0, g: 0, gen: 0, shut: 0 };
        var key = this.cellKey(Math.floor(b.x / NEAR), Math.floor(b.z / NEAR));
        (this.cells[key] || (this.cells[key] = [])).push(n);
        this.nodes.push(n);
        return n;
    };

    /* A shot the root has already played, by what it was: on a hole with no
       clock the same line, club, weight and wait is the same world, so the
       choosing does not play it again. */
    function memoKey(yaw, club, power, wait) { return yaw + '|' + club.id + '|' + power + '|' + wait; }

    /* One node's expansion, a shot at a time. The root's is the greedy
       search's own first two stages, the fan at the root's density, kept
       whole — worlds, splashes and all — so `pick` can hand it straight
       back to the search as its fan (`opts.seed`) instead of playing it
       again. */
    function Expansion(pl, node, time, root) {
        var hole = pl.hole, from = { x: node.x, y: node.y, z: node.z };
        var base = Math.atan2(hole.cup.x - from.x, hole.cup.z - from.z);
        var fan = root ? pl.rootFan : pl.innerFan;
        var powers = root ? [0.35, 0.7, 1] : [0.25, 0.5, 0.75, 1];
        // The lie's rules, as the search has them: no club the lie will not
        // take, and every swing spread over what the lie allows.
        var lie = this.lie = lieAt(hole, from);
        var bag = pl.bag.filter(function (c) { return P.playable(c, lie); });
        var q = [], i;
        this.top = function (club) { return Math.min(club.power, P.lieCeiling(club, lie)); };
        this.bag = bag.length ? bag : pl.bag;
        this.bag.forEach(function (club) {
            for (i = 0; i < fan; i++) {
                powers.forEach(function (f) {
                    q.push({ yaw: base + (i / fan) * Math.PI * 2, club: club, power: this.top(club) * f });
                }, this);
            }
        }, this);
        this.pl = pl; this.node = node; this.from = from; this.time = time; this.root = root;
        this.queue = q; this.qi = 0; this.stage = 0; this.done = false;
        this.rests = []; this.seed = root ? [] : null;
        // Struck perfectly, a shot into the cup ends the expansion: nothing
        // can beat it. With hands it might well be beaten, so it does not.
        this.quit = !pl.opts.hands;
    }

    Expansion.prototype.run = function (n) {
        var pl = this.pl, hole = pl.hole, from = this.from, used = 0, c, w, moved;
        while (used < n && !this.done) {
            if (this.qi >= this.queue.length) { this.next(); continue; }
            c = this.queue[this.qi++];
            used++;
            w = trial(hole, from, c.yaw, c.power, c.club.loft, this.time, c.club.bite,
                      { seconds: pl.opts.seconds || SECONDS, dt: pl.opts.dt || DT });
            if (this.seed) {
                this.seed.push({ yaw: c.yaw, club: c.club, power: c.power, world: w });
                if (!pl.moves) pl.memo[memoKey(c.yaw, c.club, c.power, 0)] = w;
            }
            if (!w || w.splash || w.out) continue;
            if (w.sunk) {
                this.node.sinks = true;
                if (this.quit) this.finish();
                continue;
            }
            moved = Math.hypot(w.ball.x - from.x, w.ball.z - from.z);
            if (moved < 0.3) continue;
            this.rests.push({ c: c, x: w.ball.x, y: w.ball.y, z: w.ball.z, t: w.time,
                              e: estimate(hole, w.ball.x, w.ball.y, w.ball.z) });
        }
        pl.sims += used;
        return used;
    };

    Expansion.prototype.next = function () {
        var self = this, top = [], i, r;
        this.queue = [];
        this.qi = 0;
        /* The root's second stage is the greedy search's: every club at five
           weights, a little either side of the finish nearest the cup. Off a
           headland tee the coarse fan is every shot in the sea but the ones
           that stay on the tee, and the fairway the greedy search finds from
           there has to be in the graph for the plan to know it is there
           (Coral Keys' Cape shuffled round its tee without this). */
        if (this.stage === 0 && this.root && !this.node.sinks) {
            this.stage = 1;
            var hole = this.pl.hole, cup = hole.cup, from = this.from, here = d2(from, cup), b0 = null;
            this.seed.forEach(function (c) {
                var w = c.world, sc;
                if (!w) return;
                if (w.splash || w.out) sc = 500 + d2(w.origin, cup);
                else sc = d2(w.ball, cup) + (blockedLie(hole, w.ball, cup, w.time) ? BLOCKED : 0);
                if (d2(w.ball, from) < 1 && sc >= here) return;
                if (!b0 || sc < b0.s) b0 = { s: sc, c: c };
            });
            this.b0 = b0;
            if (b0) {
                [-2, -1, 1, 2].forEach(function (k) {
                    self.bag.forEach(function (club) {
                        [0.25, 0.5, 0.75, 0.9, 1].forEach(function (f) {
                            self.queue.push({ yaw: b0.c.yaw + k * 0.11, club: club, power: self.top(club) * f });
                        });
                    });
                });
            }
            if (this.queue.length) return;
        }
        /* Elsewhere, the refinements: the three most promising distinct
           finishes, each tried a little either side and a little firmer and
           softer. That is how a plank gets found from its foot. */
        if (this.stage === 0 && !this.root && !this.node.sinks) {
            this.stage = 1;
            var sorted = this.rests.slice().sort(function (a, b) { return a.e - b.e; });
            for (i = 0; i < sorted.length && top.length < 3; i++) {
                r = sorted[i];
                if (top.some(function (o) {
                    return o.c.club === r.c.club && Math.abs(o.c.yaw - r.c.yaw) < 0.04;
                })) continue;
                top.push(r);
            }
            top.forEach(function (o) {
                [-0.1, -0.05, 0.05, 0.1].forEach(function (dy) {
                    self.queue.push({ yaw: o.c.yaw + dy, club: o.c.club, power: o.c.power });
                });
                [0.85, 1.15].forEach(function (f) {
                    self.queue.push({ yaw: o.c.yaw, club: o.c.club,
                        power: Math.max(C.MIN_POWER, Math.min(self.top(o.c.club), o.c.power * f)) });
                });
            });
            if (this.queue.length) return;
        }
        this.finish();
    };

    // The rests become children. With hands, the root remembers which of
    // them the greedy search would have played for (see `pick`).
    Expansion.prototype.finish = function () {
        var self = this, pl = this.pl, kids = [], w = this.b0 && this.b0.c.world;
        this.rests.forEach(function (r) {
            var n = pl.node(r, r.t);
            if (n !== self.node && kids.indexOf(n) < 0) kids.push(n);
        });
        this.node.edges = kids;
        if (this.root && pl.opts.hands && w && !w.sunk && !w.splash && !w.out) {
            pl.must = pl.near(w.ball, NEAR);
        }
        this.queue = [];
        this.qi = 0;
        this.done = true;
    };

    /* Root a plan at the ball. The first shot on a hole gets the big
       budget, every later one the small one, because by then most of the
       graph it needs is already built. */
    Planner.prototype.begin = function (from, time) {
        this.gen++;
        this.from = { x: from.x, y: from.y, z: from.z };
        this.time = time;
        /* A long bag's shots are the dear ones — seven clubs to a fan, and
           the long game's ground several times the work a step of a lane is
           — so past four clubs the budget shrinks with the bag. There the
           greedy search on its own is most of the way to the answer anyway:
           open ground, and the root's own two stages are in the graph. */
        var scale = this.bag.length > 4 ? 2 / this.bag.length : 1;
        this.budget = Math.round(scale * (this.nodes.length ? (this.opts.replanSims || REPLAN_SIMS)
                                                            : (this.opts.planSims || PLAN_SIMS)));
        this.spent = 0;
        this.found = Infinity;
        this.open = [];
        this.must = null;
        this.finished = false;
        var root = this.root = { x: from.x, y: from.y, z: from.z, t: time,
            est: estimate(this.hole, from.x, from.y, from.z),
            edges: null, sinks: false, value: 0, g: 0, gen: this.gen, shut: 0 };
        this.exp = new Expansion(this, root, time, true);
        this.rootExp = this.exp;
    };

    Planner.prototype.settle = function (n) {
        var self = this, g = n.g + 1;
        n.shut = this.gen;
        if (n.sinks) this.found = Math.min(this.found, g);
        if (g >= DEPTH) return;
        n.edges.forEach(function (k) {
            if (k.gen === self.gen && k.g <= g) return;
            k.gen = self.gen;
            k.g = g;
            self.open.push({ n: k, f: g + k.est });
        });
    };

    Planner.prototype.pop = function () {
        var i, bi = -1, e;
        for (i = 0; i < this.open.length; i++) {
            e = this.open[i];
            if (e.n.shut === this.gen || e.f !== e.n.g + e.n.est) continue;  // stale
            if (bi < 0 || e.f < this.open[bi].f) bi = i;
        }
        if (bi < 0) { this.open.length = 0; return null; }
        e = this.open[bi];
        this.open.splice(bi, 1);
        return e;
    };

    // Spend at most n simulated shots; true once the route is worked out.
    Planner.prototype.step = function (n) {
        var e, used, m;
        while (n > 0 && !this.finished) {
            if (this.exp) {
                used = this.exp.run(n);
                n -= used;
                this.spent += used;
                if (!this.exp.done) continue;
                this.settle(this.exp.node);
                this.exp = null;
                continue;
            }
            // With hands, the greedy search's own landing is looked at first.
            if (this.must) {
                m = this.must;
                this.must = null;
                if (!m.edges) { this.exp = new Expansion(this, m, m.t + this.gap, false); continue; }
            }
            e = this.pop();
            if (!e || e.f >= this.found || this.spent >= this.budget) { this.finished = true; break; }
            if (e.n.edges) { this.settle(e.n); continue; }      // learned on an earlier shot
            this.exp = new Expansion(this, e.n, e.n.t + this.gap, false);
        }
        return this.finished;
    };

    /* Back the values up from the cup: the fewest strokes home through
       anything expanded, and the estimate where the search stopped. A node
       with nowhere to go — every shot off it in the water — is a trap, worth
       its estimate and four strokes more. */
    Planner.prototype.values = function () {
        var all = this.nodes.concat([this.root]), changed = true, sweep, i, n, v, j;
        for (i = 0; i < all.length; i++) {
            n = all[i];
            n.value = !n.edges ? n.est : n.sinks ? 1 : Infinity;
        }
        for (sweep = 0; changed && sweep < all.length; sweep++) {
            changed = false;
            for (i = 0; i < all.length; i++) {
                n = all[i];
                if (!n.edges || n.sinks) continue;
                v = n.value;
                for (j = 0; j < n.edges.length; j++) v = Math.min(v, 1 + n.edges[j].value);
                if (v < n.value - 1e-9) { n.value = v; changed = true; }
            }
        }
        for (i = 0; i < all.length; i++) if (all[i].value === Infinity) all[i].value = all[i].est + 4;
    };

    // Strokes to go from a rest, by the plan: the nearest node's value, or
    // the estimate out where it has none; a stroke more per earlier visit.
    Planner.prototype.valueAt = function (b) {
        var n = this.near(b, LOOK), v = n ? n.value : estimate(this.hole, b.x, b.y, b.z), i, p;
        for (i = 0; i < this.visits.length; i++) {
            p = this.visits[i];
            if (Math.abs(p.y - b.y) < LEVEL && Math.hypot(p.x - b.x, p.z - b.z) < NEAR) v += 1;
        }
        return v;
    };

    /* The choosing: the search from the ball, scored by the plan, handed
       back to run (`Search.run`) and then to `finish`. On a hole with
       nothing moving the root's fan is handed over already played, and
       the root's own refinements are remembered (`opts.memo`); on one with
       a clock the world has moved on while the plan was being made, so it
       is all played again, at the game's own fan, at the moment the shot
       will actually be struck.

       With hands it is a different search. A route found by perfect
       strikes is a route for a perfect striker, and the first plan with
       hands played as if it were one: a third of a stroke a hole worse than
       the greedy player on Coral Keys, where every good line has the sea
       either side. Pricing the route through the misses (six struck per
       shot on it) was tried and did not help — six draws is noise, and the
       caddie spent strokes moving the ball to wherever the noise had been
       kind. Scoring the misses by the plan's values instead of `toGo` did
       not help either: what differs is which shots are tried, and a wider
       pool hands `steady` more lines that are perfect when perfect and
       nothing like it when missed. So with hands the caddie is the greedy
       player — its own fan, its own scoring, `steady` on `toGo` — told
       where the traps are. A trap is the stall's own shape: a lie the plan
       has expanded and found no shot from that finishes nearer the cup by
       more than a tenth of a stroke — the brink, the lip, a shelf with only
       water past it — and it costs at least a stroke, in distance to the
       greedy search and in strokes to `steady`, as does a lie already
       played from. (Measured against the estimate instead, every green the
       coarse fan failed to hole out on read as a trap, and the caddie
       steered away from the pin.) And so a trap cannot go unseen for being
       the greedy search's own choice, that landing is expanded first
       (`must`).

       Told where the traps are is not always enough: on Dead Weight with
       hands the greedy player still ran up to the brink and then took the
       long way off it. So the plan's own choosing is run as well, its misses
       drawn from a seed of its own so the caller's draw is untouched, and
       it is played instead when the plan reckons the greedy shot's intended
       finish at least half a stroke worse than its own. Where the plan has
       found nothing to say, that is the greedy search shot for shot. */
    Planner.prototype.pick = function (from, time) {
        var self = this, hole = this.hole, cup = hole.cup, o = {}, k, memo = this.memo;
        this.values();
        for (k in this.opts) o[k] = this.opts[k];
        this.picking = { from: from, time: time };
        if (this.opts.hands) {
            var per = hole.longGame ? 26 : 12;     // estimate's units to the stroke
            var trap = function (b) {
                var n = self.near(b, LOOK), v = 0, i, p;
                if (n && n.edges && !n.sinks && !n.edges.some(function (k) { return k.est < n.est - 0.1; })) {
                    v = Math.max(1, n.value - n.est);
                }
                for (i = 0; i < self.visits.length; i++) {
                    p = self.visits[i];
                    if (Math.abs(p.y - b.y) < LEVEL && Math.hypot(p.x - b.x, p.z - b.z) < NEAR) v += 1;
                }
                return v;
            };
            o.penalty = function (w) { return per * trap(w.ball); };
            o.value = function (h, w, here) {
                var g = toGo(h, w, here);
                return w.sunk || w.splash || w.out ? g : g + trap(w.ball);
            };
            var greedy = new Search(hole, from, time, this.bag, o), plain = {};
            for (k in this.opts) plain[k] = this.opts[k];
            plain.rng = seeded(7919 * (this.visits.length + 1) + this.gen);
            var planned = this.planned(from, time, plain);
            var meant = function (s) {
                var w = s && s.world;
                if (!w) return Infinity;
                if (w.sunk) return 0;
                if (w.splash || w.out) return 1 + self.valueAt(from);
                // Never better than the eye says: a perfect strike's shortcut
                // is no reason to leave the greedy shot.
                return Math.max(self.valueAt(w.ball), estimate(hole, w.ball.x, w.ball.y, w.ball.z));
            };
            return new Pair(greedy, planned, function (a, b) {
                return !a ? b : !b ? a : meant(b) < meant(a) - 0.5 ? b : a;
            });
        }
        return this.planned(from, time, o);
    };

    // The plan's own choosing, scored by its values.
    Planner.prototype.planned = function (from, time, o) {
        var self = this, hole = this.hole, cup = hole.cup, memo = this.memo;
        o.fan = this.moves ? this.fan : this.rootFan;
        o.here = this.root.value;
        o.seed = this.moves ? null : this.rootExp.seed;
        o.memo = this.moves ? null : function (yaw, club, power, wait) { return memo[memoKey(yaw, club, power, wait)]; };
        o.score = function (w) { return self.valueAt(w.ball) + d2(w.ball, cup) / 1000; };
        o.value = function (h, w, here) {
            if (w.sunk) return 0;
            if (w.splash || w.out) return 1 + here;
            return self.valueAt(w.ball);
        };
        return new Search(hole, from, time, this.bag, o);
    };

    /* Two searches run one after the other, and a rule to pick between
       their answers — the hands' choosing (`pick`). It runs in slices like
       either one alone, and counts the shots of both. */
    function Pair(a, b, rule) { this.a = a; this.b = b; this.rule = rule; this.done = false; this.result = null; }

    Pair.prototype.run = function (n) {
        if (this.done) return true;
        if (!this.a.run(n) || !this.b.run(n)) return false;
        var r = this.rule(this.a.result, this.b.result);
        if (r) r.sims = (this.a.result ? this.a.result.sims : 0) + (this.b.result ? this.b.result.sims : 0);
        this.result = r;
        this.done = true;
        return true;
    };

    // A small seeded draw (human-check.mjs's), for misses that must not
    // disturb the caller's own.
    function seeded(seed) {
        var a = seed >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) >>> 0;
            var t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    Planner.prototype.finish = function (search) {
        var p = this.picking, shot = search.result;
        if (!shot) shot = bestShot(this.hole, p.from, p.time, this.bag, this.opts);
        if (shot) {
            shot.sims += this.spent;
            shot.planned = this.root.value;
            shot.nodes = this.nodes.length;
        }
        this.visits.push({ x: p.from.x, y: p.from.y, z: p.from.z });
        this.memo = {};
        return shot;
    };

    Planner.prototype.choose = function (from, time) {
        var s = this.pick(from, time);
        s.run(Infinity);
        return this.finish(s);
    };

    // All of it at once, for anything that is not drawing frames meanwhile.
    Planner.prototype.shot = function (from, time) {
        this.begin(from, time);
        this.step(Infinity);
        return this.choose(from, time);
    };

    /* A whole hole, played out in simulation. `from` and `time` are where and
       when to start, so the game can hand it a ball halfway down a fairway;
       left out, it starts on the tee. */
    function play(hole, maxStrokes, bag, opts) {
        opts = opts || {};
        var from = opts.from ||
            { x: hole.tee.x, z: hole.tee.z, y: hole.tee.y + C.BALL_R };
        var time = opts.time || 0, strokes = 0, penalties = 0, s, shot;
        var shots = [];
        // `opts.plan` plays it with a plan (above), kept for the whole hole.
        var planner = opts.plan ? new Planner(hole, bag, opts) : null;
        for (s = 0; s < maxStrokes; s++) {
            shot = planner ? planner.shot(from, time) : bestShot(hole, from, time, bag, opts);
            if (!shot) break;
            if (opts.hands) {
                // Meant is not played: strike the chosen shot through the
                // same hands the choice was made with.
                var m = mishit(shot.club, shot.yaw, shot.power, opts.hands, opts.rng || Math.random);
                m.power = P.fromLie(m.power, shot.club, lieAt(hole, from));
                var hit = trial(hole, from, m.yaw, m.power, shot.club.loft,
                                time + shot.wait + late(hole, opts.hands, opts.rng || Math.random, shot.wait),
                                shot.club.bite, { seconds: opts.seconds || SECONDS, dt: opts.dt || DT });
                if (hit) shot = { s: shot.s, yaw: m.yaw, power: m.power, club: shot.club,
                                  wait: shot.wait, world: hit, meant: shot, sims: shot.sims,
                                  planned: shot.planned };
            }
            strokes++;
            shots.push(shot);
            time = shot.world.time;
            if (shot.world.sunk) {
                return { sunk: true, strokes: strokes + penalties, shots: shots };
            }
            if (shot.world.splash || shot.world.out) {
                penalties++;
                from = { x: shot.world.origin.x, z: shot.world.origin.z, y: shot.world.origin.y };
            } else {
                from = { x: shot.world.ball.x, z: shot.world.ball.z, y: shot.world.ball.y };
            }
        }
        return { sunk: false, strokes: strokes + penalties, shots: shots };
    }

    G3.bot = {
        BLOCKED: BLOCKED,
        SECONDS: SECONDS,
        DT: DT,
        blockedLie: blockedLie,
        mishit: mishit,
        estimate: estimate,
        bestShot: bestShot,
        Planner: Planner,
        PLAN_SIMS: PLAN_SIMS,
        REPLAN_SIMS: REPLAN_SIMS,
        play: play
    };
})(window.G3);
