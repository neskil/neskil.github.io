/* The hole lab — what a hole is like to play, measured rather than guessed.

   Pocket Links (../golf/) built this first and drew it in hole-lab.html: a
   sweep of every line and every weight from the tee, which says whether an
   ace exists and how wide its windows are, and the putt aimed straight at the
   flag, which says whether the hole asks a question at all. This is the same
   measure for a game with a bag in it, so a sweep here is one per club, and a
   "straight putt" is any club that keeps the ball down, aimed at the pin.

   It answers a different question from the bot. The bot is a perfect player
   and its card says what par is; it will hole a shot one line in a thousand
   wide every time it is asked to. What it cannot say is whether that line is
   a *shot* — something a person reads off the tee and can repeat — or a
   fluke, or whether the hole gives the ace away to anybody who putts at the
   flag. That is a share of the sweep, and the numbers the 2D card settled on
   (README → "The hole lab") are the line it is measured against.

   Pure, like physics.js and bot.js: no three.js, no DOM. The page
   (hole-lab.html) and the command-line run (tools/hole-lab.mjs) both call
   these and draw or print what comes back. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var P = G3.physics;
    var DEG = Math.PI / 180;

    /* The bot's step, not SIM_DT: a person's roll is advanced a 60 Hz frame
       at a time (game.js), and `advance` sub-steps by speed rather than to a
       clock, so this is the roll a player gets. The ceiling is the game's own,
       because ice rolls a long time and a sweep that gave up at the bot's
       twelve seconds would count a slow ace as a miss. */
    var DT = 1 / 60;
    var SECONDS = C.MAX_SHOT_SECONDS;

    /* The longest beat on the hole, in seconds, or 0 when nothing on it moves.
       All four kinds of motion (golf3d/CLAUDE.md, "a wall may move four ways");
       four sails come round every quarter turn, so their beat is a quarter. */
    function beat(hole) {
        var T = 0;
        hole.walls.forEach(function (w) {
            if (w.move && w.move.speed) T = Math.max(T, 2 * Math.PI / Math.abs(w.move.speed));
            if (w.spin) T = Math.max(T, 2 * Math.PI / Math.abs(w.spin));
            if (w.swing && w.swing.speed) T = Math.max(T, 2 * Math.PI / Math.abs(w.swing.speed));
            if (w.sails && w.sails.speed) T = Math.max(T, Math.PI / 2 / Math.abs(w.sails.speed));
        });
        return T;
    }

    // `n` moments spread over the slowest beat, or the one moment there is.
    function moments(hole, n) {
        var T = beat(hole), out = [], i;
        if (!T) return [0];
        for (i = 0; i < n; i++) out.push(+(T * i / n).toFixed(3));
        return out;
    }

    function tee(hole) {
        return { x: hole.tee.x, z: hole.tee.z, y: hole.tee.y + C.BALL_R };
    }

    function shoot(hole, club, yaw, power, at) {
        var w = P.createWorld(hole, tee(hole), at || 0);
        if (!P.launch(w, yaw, power, club.loft, club.bite)) return null;
        return P.settle(w, SECONDS, DT);
    }

    /* A club that keeps the ball on the ground: the putt, in this game's
       terms. Nine degrees is the line tests.html draws between the putters
       and everything that flies (its LOFTED), so "a putt" means one thing. */
    function rolls(club) { return (club.loft || 0) < 9 * DEG; }

    /* Every line in `step` degrees and every weight in `weights`ths of a full
       swing, out of every club in the bag, at each moment. `from`/`to` slice
       the compass so the command-line run can deal it out to several workers
       and add up what comes back. Never past a full swing: the overdraw is the
       dice's line, not the player's. */
    function sweep(hole, opts) {
        opts = opts || {};
        var step = opts.step || 0.5;
        var weights = opts.weights || 50;
        var bag = opts.bag || G3.bagFor(hole);
        var at = opts.moments || moments(hole, opts.n || 4);
        var a0 = opts.from || 0, a1 = opts.to === undefined ? 360 : opts.to;
        var sims = 0, aces = [], per = {};
        bag.forEach(function (club) {
            var row = per[club.id] = { sims: 0, aces: 0 };
            at.forEach(function (t) {
                var a, k, w;
                for (a = a0; a < a1 - 1e-9; a += step) {
                    for (k = 1; k <= weights; k++) {
                        w = shoot(hole, club, a * DEG, club.power * k / weights, t);
                        sims++; row.sims++;
                        if (w && w.sunk) {
                            row.aces++;
                            aces.push({ club: club.id, a: +a.toFixed(3), p: k / weights, at: t });
                        }
                    }
                }
            });
        });
        return { sims: sims, aces: aces, per: per, step: step, weights: weights, moments: at };
    }

    /* Aces next to each other in angle, out of one club at one moment, are one
       window: a line a person can find again. Widest first. */
    function windows(aces, step) {
        step = step || 0.5;
        var out = [];
        aces.slice().sort(function (x, y) {
            return x.club < y.club ? -1 : x.club > y.club ? 1 : x.at - y.at || x.a - y.a;
        }).forEach(function (s) {
            var w = out[out.length - 1];
            if (w && w.club === s.club && w.at === s.at && s.a - w.a1 <= step * 2 + 1e-9) {
                w.a1 = s.a; w.n++;
                w.p0 = Math.min(w.p0, s.p); w.p1 = Math.max(w.p1, s.p);
            } else {
                out.push({ club: s.club, at: s.at, a0: s.a, a1: s.a, p0: s.p, p1: s.p, n: 1 });
            }
        });
        return out.sort(function (x, y) { return y.n - x.n; });
    }

    /* The shot aimed straight at the flag: every weight in fiftieths, half a
       degree either side, at twelve moments of the slowest beat — the same
       net the 2D rule casts. Answers the first one that drops, or null.

       Out of the clubs that roll unless `lofted` asks for the rest. A putt at
       the pin that drops is a hole with no question in it; a pitch at the pin
       that drops is, on a hole built to be flown, sometimes the bold line the
       hole was built round — so the two are reported apart. */
    function straight(hole, opts) {
        opts = opts || {};
        var bag = (opts.bag || G3.bagFor(hole)).filter(function (c) {
            return opts.lofted ? !rolls(c) : rolls(c);
        });
        var at = moments(hole, opts.n || 12);
        var yaw = Math.atan2(hole.cup.x - hole.tee.x, hole.cup.z - hole.tee.z);
        var i, j, k, t, d, w, club;
        for (i = 0; i < bag.length; i++) {
            club = bag[i];
            for (j = 0; j < at.length; j++) {
                t = at[j];
                for (k = 1; k <= 50; k++) {
                    for (d = -0.5; d <= 0.5; d += 0.5) {
                        w = shoot(hole, club, yaw + d * DEG, club.power * k / 50, t);
                        if (w && w.sunk) return { club: club.id, power: k / 50, off: d, at: t };
                    }
                }
            }
        }
        return null;
    }

    /* One shot, as the points it passed through, for drawing. */
    function path(hole, club, yaw, power, at) {
        var w = P.createWorld(hole, tee(hole), at || 0);
        var pts = [[w.ball.x, w.ball.z, w.ball.y]];
        if (!P.launch(w, yaw, power, club.loft, club.bite)) return pts;
        var limit = Math.ceil(SECONDS / DT), n;
        for (n = 0; n < limit && !P.done(w); n++) {
            P.advance(w, DT);
            pts.push([w.ball.x, w.ball.z, w.ball.y]);
        }
        return pts;
    }

    /* What the share of the sweep says, in the 2D card's words. Over 1% the
       hole gives it away; under 0.03% the ace is a fluke and the hole is a
       staged one whether it means to be or not. */
    function verdict(share) {
        if (!share) return 'none';
        if (share > 0.01) return 'giveaway';
        if (share < 0.0003) return 'fluke';
        if (share >= 0.003) return 'tutorial';
        if (share >= 0.001) return 'skill';
        return 'closer';
    }

    function clubById(id) {
        for (var i = 0; i < C.ALL_CLUBS.length; i++) if (C.ALL_CLUBS[i].id === id) return C.ALL_CLUBS[i];
        return null;
    }

    G3.lab = {
        DT: DT,
        SECONDS: SECONDS,
        beat: beat,
        moments: moments,
        shoot: shoot,
        sweep: sweep,
        windows: windows,
        straight: straight,
        path: path,
        verdict: verdict,
        clubById: clubById
    };
})(window.G3);
