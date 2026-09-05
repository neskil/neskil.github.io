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
        var moves = hole.walls.some(function (wl) { return wl.move || wl.spin; });
        var waits = moves ? [0, 0.45, 0.95, 1.5] : [0];
        var here = d2(from, cup);
        var best = null;
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
                [0.25, 0.5, 0.75, 1].forEach(function (f) {
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
        if (best) best.sims = sims;
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
        bestShot: bestShot,
        play: play
    };
})(window.G3);
