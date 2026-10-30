/* The bot — a greedy player made of nothing but physics.

   It was written for tests.html, where it is the strongest thing the suite
   says: every hole on every course can actually be holed out, out of the bag
   that hole hands out, by something with no knowledge of the course beyond
   what the physics will tell it. A hole that stops being solvable stops being
   a hole, and this is what notices.

   It lives here rather than inside the suite because the game plays it too.
   The simulation mode in game.js hands it the ball where the player left it
   and plays its answers on the real course, at real speed, so you can watch
   the same thing the tests only ever counted.

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
       is the other half of the fix BLOCKED starts. */
    function bestShot(hole, from, time, bag, opts) {
        opts = opts || {};
        var seconds = opts.seconds || SECONDS;
        var dt = opts.dt || DT;
        var fan = opts.fan || 16;
        var sims = 0;
        var cup = hole.cup;
        var base = Math.atan2(cup.x - from.x, cup.z - from.z);
        // All four kinds of motion — a flipper (`swing`) and a windmill's
        // `sails` are timing holes too, and this once asked about two of them
        // (golf3d/CLAUDE.md, "a wall may move four ways").
        var moves = hole.walls.some(function (wl) { return wl.move || wl.spin || wl.swing || wl.sails; });
        var waits = moves ? [0, 0.45, 0.95, 1.5] : [0];
        var here = d2(from, cup);
        var best = null;
        var pool = opts.hands ? [] : null;
        bag = bag || C.CLUBS;

        function consider(yaw, club, power, wait) {
            // The club's own backspin, so the bot is playing the clubs the
            // player is handed rather than five-sixths of them.
            sims++;
            var w = trial(hole, from, yaw, power, club.loft, time + wait, club.bite,
                          { seconds: seconds, dt: dt });
            if (!w) return;
            var moved = Math.hypot(w.ball.x - from.x, w.ball.z - from.z);
            var s;
            if (w.sunk) s = -1000;
            else if (w.splash || w.out) s = 500 + d2(w.origin, cup);
            else s = d2(w.ball, cup) +
                (blockedLie(hole, w.ball, cup, w.time) ? BLOCKED : 0);
            if (!w.sunk && moved < 1 && s >= here) return;
            if (pool) pool.push({ s: s, yaw: yaw, club: club, power: power, wait: wait, world: w });
            if (!best || s < best.s) {
                best = { s: s, yaw: yaw, club: club, power: power, wait: wait, world: w };
            }
        }

        var i;
        bag.forEach(function (club) {
            for (i = 0; i < fan; i++) {
                [0.35, 0.7, 1].forEach(function (f) {
                    consider(base + (i / fan) * Math.PI * 2, club, club.power * f, 0);
                });
            }
        });

        var b0 = best;
        if (!b0) return null;
        [-2, -1, 0, 1, 2].forEach(function (k) {
            bag.forEach(function (club) {
                /* 0.9 because a window can sit between the last two: Deadlift's
                   second step takes the mallet at 90–99% and nothing either
                   side of it, and a bot that only tried 75 and 100 reported a
                   hole nobody could finish. */
                [0.25, 0.5, 0.75, 0.9, 1].forEach(function (f) {
                    waits.forEach(function (wait) {
                        consider(b0.yaw + k * 0.11, club, club.power * f, wait);
                    });
                });
            });
        });
        var b1 = best;
        [-3, -2, -1, 0, 1, 2, 3].forEach(function (k) {
            [-0.7, -0.35, 0, 0.35, 0.7].forEach(function (dp) {
                waits.forEach(function (wait) {
                    consider(b1.yaw + k * 0.03, b1.club,
                        Math.max(C.MIN_POWER, Math.min(b1.club.power, b1.power + dp)), wait);
                });
            });
        });
        if (pool && best) best = steady(hole, from, time, pool, opts, function (n) { sims += n; });
        if (best) best.sims = sims;
        return best;
    }

    /* The hands' half of the choice. Every candidate the search found is
       ranked by strokes left (toGo) rather than by distance, the best dozen
       distinct ones are each played `opts.tries` more times through mishit,
       and the lowest average wins — so a safe line to the fat of an island
       beats a perfect one past the edge of it. */
    function steady(hole, from, time, pool, opts, count) {
        var rnd = opts.rng || Math.random, hands = opts.hands;
        var tries = opts.tries || 8, keep = opts.keep || 12;
        var seconds = opts.seconds || SECONDS, dt = opts.dt || DT;
        var here = toGo(hole, { ball: from, time: time }, 0);
        pool.forEach(function (c) { c.e = toGo(hole, c.world, here); });
        pool.sort(function (a, b) { return a.e - b.e; });
        var picked = [], i, j, c, q, sum, w, m;
        for (i = 0; i < pool.length && picked.length < keep; i++) {
            c = pool[i];
            if (picked.some(function (o) {
                return o.club === c.club && Math.abs(o.yaw - c.yaw) < 0.02 &&
                    Math.abs(o.power - c.power) < 0.25;
            })) continue;
            picked.push(c);
        }
        var best = null;
        for (i = 0; i < picked.length; i++) {
            c = picked[i]; sum = 0;
            for (j = 0; j < tries; j++) {
                m = mishit(c.club, c.yaw, c.power, hands, rnd);
                w = trial(hole, from, m.yaw, m.power, c.club.loft, time + c.wait, c.club.bite,
                          { seconds: seconds, dt: dt });
                sum += w ? toGo(hole, w, here) : 1 + here;
            }
            count(tries);
            q = sum / tries;
            if (!best || q < best.mean) { best = c; best.mean = q; }
        }
        return best;
    }

    /* A whole hole, played out in simulation. `from` and `time` are where and
       when to start, so the game can hand it a ball halfway down a fairway;
       left out, it starts on the tee. */
    function play(hole, maxStrokes, bag, opts) {
        opts = opts || {};
        var from = opts.from ||
            { x: hole.tee.x, z: hole.tee.z, y: hole.tee.y + C.BALL_R };
        var time = opts.time || 0, strokes = 0, penalties = 0, s, shot;
        var shots = [];
        for (s = 0; s < maxStrokes; s++) {
            shot = bestShot(hole, from, time, bag, opts);
            if (!shot) break;
            if (opts.hands) {
                // Meant is not played: strike the chosen shot through the
                // same hands the choice was made with.
                var m = mishit(shot.club, shot.yaw, shot.power, opts.hands, opts.rng || Math.random);
                var hit = trial(hole, from, m.yaw, m.power, shot.club.loft, time + shot.wait,
                                shot.club.bite, { seconds: opts.seconds || SECONDS, dt: opts.dt || DT });
                if (hit) shot = { s: shot.s, yaw: m.yaw, power: m.power, club: shot.club,
                                  wait: shot.wait, world: hit, meant: shot, sims: shot.sims };
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
        bestShot: bestShot,
        play: play
    };
})(window.G3);
