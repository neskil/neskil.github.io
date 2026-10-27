/* The swing gate: what a shot past a full swing costs you.

   The overdraw used to be a dice roll. Wind the meter past 100% and the
   physics rolled two numbers — how far off line, and how far off weight —
   scaled by how far past you were. It was honest about the trade (more reach,
   less control) and it was the right trade, but the player had no part in it.
   You wound it up, you pressed Swing, and the game decided. A shot you cannot
   influence is not a risk you took, it is weather.

   So the roll becomes a **gate**. Past a full swing, Swing no longer plays the
   shot: it starts a marker moving along the meter you just loaded, and you
   press again to strike. Where you strike it is where the dice used to be.

   Three things make that worth doing rather than merely different:

   - **The target is the full-swing mark.** The white line at 100% is already
     on the bar and already means "a full swing". So the rule needs no
     explaining: wind past it if you want the distance, but you have to strike
     it *at* a full swing to keep the line. The furniture was already there.
   - **The envelope is the old one.** A total miss costs exactly the spray the
     dice used to roll at that overdraw (`physics.spray`), so nothing about how
     wild a thrash can get has changed — only who decides. Tuning stays in one
     place, in CONFIG, where it already was.
   - **A miss bends as well as pushes.** Early pulls the shot and draws it in
     the air; late pushes it and fades it (`world.spin`). A mishit that keeps
     curving is a mishit you can read from the tee, and it is the difference
     between "the game moved my ball" and "I came over the top of it".

   **One gate, always the same.** There used to be four — tempo, a return
   that only counted on the way down, a double press, and one where the
   marker went dark — rotating hole by hole. Each was learnable on its own;
   together they were the game changing its mind: the same button did a
   different thing on every hole, nothing on the screen said which, and the
   owner's verdict was "random, hard, and not fun". A timing test is only fair
   when you know what is being tested, so now there is one: a single pass up
   the bar, strike on the line.

   The swing styles at the bottom — the touch swing, the arcade arc and the
   needle — are other ways to hit it, and every one lands in the same place:
   a number from -1 to 1 that `apply` turns into the same push, pull and bend.

   None of this file knows about the DOM or three.js. It is arithmetic over a
   plain object, so tests.html covers it with no browser at all. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;

    /* Where a full swing sits on a bar that runs to the end of the overdraw.
       The white line the player can already see, as a fraction. */
    function markAt() { return 1 / (1 + C.OVERDRAW); }

    /* The same shape of exponential the spray is built on, and its own
       constant. Sharing SPRAY_CURVE outright made "harder" and "wilder" bend
       together, which reads well and played badly: the spray is allowed to be
       nothing for most of the meter and everything at the end, because the
       player is not being asked to *do* anything about it. The gate is, and a
       demand that goes from comfortable to impossible over the last few pixels
       of wind-up is one nobody can meet. So it keeps the ramp and takes the
       cliff out — see CONFIG.SWING.CURVE. */
    function ease(over) {
        var t = Math.max(0, Math.min(1, over || 0));
        var k = C.SWING.CURVE;
        return (Math.exp(k * t) - 1) / (Math.exp(k) - 1);
    }

    // Half-width of the zone, and how fast the marker crosses it. Both are the
    // difficulty, and both are read off the same curve.
    function windowFor(over) {
        var e = ease(over);
        return C.SWING.WIN_MAX + (C.SWING.WIN_MIN - C.SWING.WIN_MAX) * e;
    }

    function speedFor(over) {
        var e = ease(over);
        return C.SWING.SPEED_MIN + (C.SWING.SPEED_MAX - C.SWING.SPEED_MIN) * e;
    }

    /* Is the gate even armed? The first sliver of overdraw is free — it always
       was, the spray curve starts at nothing — and a gate over a shot that
       cannot go wrong is a hoop to jump through for no reason. */
    function arms(over) { return (over || 0) > C.SWING.ARM; }

    function start(over) {
        return {
            over: Math.max(0, Math.min(1, over || 0)),
            mark: markAt(),
            win: windowFor(over),
            speed: speedFor(over),
            pos: 0,
            done: false,
            struck: false,      // did a press end it, or did it run out
            off: 0,             // signed timing error, -1 early … +1 late
            perfect: false
        };
    }

    /* One frame of the marker. It ends on its own if the swing runs out —
       Swing has been pressed, the club is moving, and a player who does
       nothing has not cancelled the shot, they have missed it. Running out is
       the late edge of a total miss, which is the same thing the dice could
       already hand you at this overdraw. */
    function tick(g, dt) {
        if (g.done) return g;
        g.pos += g.speed * dt;
        if (g.pos >= 1) { g.pos = 1; return finish(g, false); }
        return g;
    }

    function press(g) {
        if (g.done) return g;
        return finish(g, true, errAgainst(g, g.mark));
    }

    /* How far off a press is, signed and normalised so that ±1 is the worst
       miss the bar can hold. Divided by the *bar*, not by the window: a wider
       window is more room to be perfect in, not a different scale of error,
       and a near miss at the end of the overdraw has to cost more than the
       same distance does at the start of it. */
    function errAgainst(g, target) {
        var raw = g.pos - target;
        // Inside the window there is no error at all. That is what the window
        // is: not a softer landing, a clean strike.
        if (Math.abs(raw) <= g.win) return 0;
        var over = raw > 0 ? raw - g.win : raw + g.win;
        return Math.max(-1, Math.min(1, over / C.SWING.MISS_SPAN));
    }

    function finish(g, struck, off) {
        g.done = true;
        g.struck = !!struck;
        g.off = struck ? (off || 0) : 1;      // ran out = late, and all the way
        g.perfect = g.struck && g.off === 0;
        return g;
    }

    /* What the gate does to the shot. Three consequences from one number, and
       every one of them scaled by `physics.spray` at this overdraw — so the
       worst a gate can do to you is exactly the worst the dice used to do,
       and the tuning still lives in CONFIG where it always did.

         line   early pulls, late pushes.
         spin   and the same miss bends it the same way in the air, so the
                mistake keeps happening after the ball has left.
         weight a mishit is always lighter, never heavier: catching one thin
                is a shot that comes up short, and "your miss went further"
                is not a thing golf should ever say.

       A clean strike returns the shot untouched. That is the prize, and it is
       the whole reason to take the gate on. */
    function apply(shot, g) {
        var s = G3.physics.spray(g ? g.over : 0);
        var off = g ? g.off : 0;
        if (!off) return { yaw: shot.yaw, power: shot.power, spin: 0 };
        /* +yaw is left on screen, and so is +spin (physics bends a ball
           toward rising yaw). Early is left — a pull that draws — so the sign
           is flipped: `off` is negative for early. It ran the other way until
           shot shaping drew a draw in the preview and put the two side by
           side: every word the game said about a miss was right, and every
           ball went the opposite way. */
        return {
            yaw: shot.yaw - off * s.yaw,
            power: shot.power * (1 - Math.abs(off) * s.power),
            spin: -off * s.yaw * C.SWING.SPIN
        };
    }

    /* ── shot shaping ─────────────────────────────────────────────────────

       Everything above is what a swing costs you by accident. This is what
       you ask the ball to do on purpose, picked before the shot from the
       shapes the club in hand can play (CONFIG `shapes` on each club):

         draw      starts right of the aim and curves back left onto it
         fade      the mirror of it, and lands soft where a draw runs on
         backspin  the same flight, and it stops dead where it lands
         topped    caught on the way up: low, skidding, and it runs

       The bends are the same sidespin a mishit gets (`world.spin`) and the
       stop is the same backspin a club already carries (`bite`), so nothing
       here is new to the simulation — only to the player.

       **A shape has to be struck.** Asking for one arms the gate even inside
       a full swing (`armsShape`), at a difficulty of its own (SHAPE.GATE) or
       the overdraw's if that is harder. Strike it clean and the ball does
       exactly what the chip said; miss and the shape goes wrong in the way
       that shape goes wrong — early over-cooks it, late under-cooks it — on
       top of the push or pull any miss already costs (`apply`). That is the
       difference between a menu and a shot: the preview shows what you asked
       for, and the timing decides whether you get it.

       The draw and the fade **land on your line**. The ball starts out half
       the turn to one side of the aim, so the arrow still points at the target
       and the shape is the way the ball gets there — round the tree, not past
       the flag. The turn over the whole flight is fixed (SHAPE.TURN), so a
       draw is the same picture at half a swing and at a full one; the spin is
       worked out from the flight time, 2·v·sin(loft)/g on flat ground, capped
       (SHAPE.SPIN_MAX) for the short flights that would want a corkscrew. */
    var SHAPES = ['straight', 'draw', 'fade', 'backspin', 'topped'];

    function bendOf(name) { return name === 'draw' ? 1 : name === 'fade' ? -1 : 0; }

    // Does this shot need striking? Any shape at all, or the overdraw's own rule.
    function armsShape(name, over) {
        return (!!name && name !== 'straight') || arms(over);
    }

    // How hard the gate for this shot is: the shape's own difficulty, or the
    // overdraw's if the meter has gone further than that.
    function shapeOver(name, over) {
        return (name && name !== 'straight') ? Math.max(C.SHAPE.GATE, over || 0) : (over || 0);
    }

    /* `shot` is { yaw, power, spin } — the shot after the gate's push or pull,
       if there was a gate. `off` is that gate's timing (−1 early … +1 late,
       0 clean); it decides how much of the shape arrives. Returns the shot to
       launch, plus `loft`, `bite`, and `bend` (how far off the aim it starts). */
    function shape(shot, name, loft, bite, grav, off, hole) {
        var S = C.SHAPE;
        var out = { yaw: shot.yaw, power: shot.power, spin: shot.spin || 0,
                    loft: loft || 0, bite: bite || 0, bend: 0 };
        off = off || 0;
        if (name === 'backspin') {
            // A clean one bites; a miss catches it thin and the spin is gone.
            out.bite = Math.min(0.95, out.bite + S.BACKSPIN * (1 - Math.abs(off)));
            out.power *= 1 - Math.abs(off) * S.MISS_POWER;
            return out;
        }
        if (name === 'topped') {
            // Early digs it in harder still; late gets under it and it rises.
            var low = Math.max(0.05, Math.min(1, S.TOPPED_LOFT * (1 + off)));
            out.loft = out.loft * low;
            out.topped = true;          // struck on the top: no backspin, no lift
            out.power *= S.TOPPED_POWER * (1 - Math.abs(off) * S.MISS_POWER);
            return out;
        }
        var dir = bendOf(name);
        // The time it is in the air to bend in: the long clubs' lifted flight
        // hangs for longer than the arc's formula, and is flown to say so.
        var t = hole && G3.physics ? G3.physics.hangTime(hole, out.power, out.loft)
            : 2 * out.power * Math.sin(out.loft) / (grav || C.GRAVITY);
        if (!dir || !(t > 0)) return out;
        var spin = Math.min(S.SPIN_MAX, S.TURN / (C.SPIN_ACCEL * t));
        // The start line is set for the shape that was asked for; what the
        // strike delivers is the bend. Early is left, as every miss is: it
        // over-turns a draw into a hook and stops a fade turning at all. Late
        // is right: the draw hangs out on its start line, the fade slices.
        out.bend = -dir * spin * C.SPIN_ACCEL * t / 2;
        out.yaw += out.bend;
        out.spin += dir * spin * Math.max(0, 1 - dir * off * S.MISS_TURN);
        if (dir < 0) out.bite = Math.min(0.95, out.bite + S.FADE_BITE * (1 - Math.abs(off)));
        return out;
    }

    /* ── the touch swing ──────────────────────────────────────────────────

       A swing you make with your thumb instead of a meter you stop: press,
       pull straight down to take the club back, and swipe up through where
       you started to hit it. The pull is the power — the same meter fills as
       you go, with the full swing at the same white line — and the swipe up
       is the strike. A mouse drag is the same gesture, so it plays on a
       desktop as it does on a phone.

       Three things are read off the swipe, and each has a setting (CONFIG
       SWIPE, game.js "touch swing settings"), because which of them is fun is
       what is being found out:

         line     the *angle* of the through-swing, from the bottom of the
                  pull to where the thumb crosses back over its start. Drift
                  right and the ball is pushed right and fades; left, pulled
                  and drawn. An angle does not care how big the phone is or
                  how long the pull was. How much lean is forgiven is `feel`.
         timing   'rhythm': the swipe up at the same pace as the pull down.
                  'snap': the swipe up in about the same short time however
                  far you pulled — so a long pull wants a fast swipe and a
                  short one a gentle one, and length and speed together make
                  the shot. Rushed pulls the ball left; quitting on it pushes
                  it right and costs distance. 'off' reads no timing at all.
         bow      with shapes on, a swipe that bends on purpose is a shaped
                  shot: bow out to the right and come back, and the ball does
                  the same — starts right, draws back left. Bow left for a
                  fade. Too little is a straight shot, too much over-cooks it.

       Everything is read from the samples of the gesture, so it is all
       arithmetic here and all testable without a thumb. */

    // How much of the meter a pull of `pulled` pixels has loaded, out of a
    // lane `lane` pixels long. The lane is the whole meter, overdraw and all.
    function swipeLoad(pulled, lane) {
        if (!(lane > 0)) return 0;
        return Math.max(0, Math.min(1, (pulled || 0) / lane));
    }

    /* The through-swing, as an angle off straight up: 0 dead straight,
       positive drifting right on screen. `turn` is the bottom of the
       backswing and `cross` where the thumb came back over the start. */
    function swipeAngle(turn, cross) {
        var up = turn.y - cross.y;
        if (!(up > 0)) return 0;
        return Math.atan2(cross.x - turn.x, up);
    }

    function feelOf(name) { return C.SWIPE.FEEL[name] || C.SWIPE.FEEL[C.SWIPE.DEFAULT.feel]; }

    // How crooked a swipe may be and still be clean — narrower the further
    // the meter was pulled, on the gate's own curve.
    function swipeTol(over, feel) {
        return feelOf(feel).TOL * (1 - C.SWIPE.TIGHTEN * ease(over));
    }

    /* The line as the gate's number: 0 inside the tolerance, then out to ±1
       over the feel's SPAN. Right is +, which is the gate's "late": both push
       the ball right (`apply`), so a swipe that drifts right sends the ball
       the way the thumb went. */
    function swipeOff(angle, over, feel) {
        var a = Math.abs(angle || 0), tol = swipeTol(over, feel);
        if (a <= tol) return 0;
        return Math.min(1, (a - tol) / feelOf(feel).SPAN) * (angle > 0 ? 1 : -1);
    }

    /* How long each half of the swing took, from the samples [x, y, t]: the
       pull from the press to where it first reached nine-tenths of its depth,
       and the swipe from where it last left the bottom tenth to the crossing.
       Measured that way so a pause — holding at the bottom to steady the
       thumb, or resting before pulling — is not counted as a slow swing. */
    function swipeTimes(pts, y0, lowY, crossT) {
        var depth = lowY - y0, tb = 0, td = 0, i;
        if (!(depth > 0) || !pts || pts.length < 2) return { back: 0, through: 0 };
        var t0 = pts[0][2];
        for (i = 0; i < pts.length; i++) {
            if (pts[i][1] - y0 >= 0.9 * depth) { tb = (pts[i][2] - t0) / 0.9; break; }
        }
        for (i = pts.length - 1; i >= 0; i--) {
            if (pts[i][1] >= lowY - 0.1 * depth) { td = (crossT - pts[i][2]) / 0.9; break; }
        }
        return { back: Math.max(0, tb), through: Math.max(0, td) };
    }

    /* The timing, as a signed amount: 0 clean, negative rushed, positive
       lazy (quit on it), out to ±1. Read in doublings (log2), because "twice
       too fast" and "half as fast" are the same size of mistake. */
    function swipeTempo(times, mode) {
        var T = C.SWIPE.TIMING[mode];
        if (!T || !(times.through > 0)) return { amount: 0, ratio: 1, said: null };
        var ratio = mode === 'rhythm'
            ? (times.back > 0 ? times.back / times.through : 1)        // >1: the swipe was the quicker half
            : T.TARGET / times.through;                                // >1: quicker than the target
        var l = Math.log(ratio) / Math.LN2 - Math.log(T.IDEAL || 1) / Math.LN2;
        var a = Math.abs(l);
        var amount = a <= T.TOL ? 0 : Math.min(1, (a - T.TOL) / T.SPAN) * (l > 0 ? -1 : 1);
        return { amount: amount, ratio: ratio, said: amount < 0 ? 'rushed' : amount > 0 ? 'lazy' : 'clean' };
    }

    /* How far the through-swing bowed out from the straight line between its
       ends, as a fraction of its length: + out to the right, − to the left.
       The biggest excursion, signed, rather than an average — a bow is a
       shape you draw, and its belly is what you meant. */
    function swipeBow(path, turn, cross) {
        var dx = cross.x - turn.x, dy = cross.y - turn.y;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (!(len > 0) || !path) return 0;
        var best = 0;
        for (var i = 0; i < path.length; i++) {
            // Signed distance from the chord; with the chord running up the
            // screen, positive is to the right of it.
            var d = ((path[i][0] - turn.x) * dy - (path[i][1] - turn.y) * dx) / len;
            if (Math.abs(d) > Math.abs(best)) best = d;
        }
        return -best / len;
    }

    /* The bow as a shape: null below the threshold (a straight swing), else
       draw for a bow to the right, fade to the left, with an `off` on the
       scale `shape` reads — 0 when the bow is about right, over-cooked when it
       is too big (early: a draw turns into a hook), under-cooked when it is
       too small (late: the draw hangs out on its start line). */
    function swipeShape(bow, allowed) {
        var B = C.SWIPE.BOW, a = Math.abs(bow || 0);
        if (a < B.MIN) return null;
        var name = bow > 0 ? 'draw' : 'fade';
        if (allowed && allowed.indexOf(name) < 0) return null;
        var e = a - B.IDEAL, m = Math.abs(e);
        var cook = m <= B.TOL ? 0 : Math.min(1, (m - B.TOL) / B.SPAN) * (e > 0 ? 1 : -1);
        // Over-cooked is "early" for a draw and "late" for a fade (swing.js
        // `shape`): both mean more bend than asked for.
        return { name: name, off: name === 'draw' ? -cook : cook, cook: cook };
    }

    /* Was it a swing at all? A scribble — loops, zig-zags, a thumb playing
       with the screen — is not a crooked swing to be graded, it is a junk
       one, and golf has a word for each of the two ways it comes off: a duff
       (dribbled a few feet) or a shank (squirted off sideways). Either way the
       stroke counts and the ball goes nowhere much, which is the point — it
       costs a stroke to play about, not a hole.

       Read from the whole gesture: how much longer its path was than a pull
       and a swipe of the same depth would be (`ratio`, with JUNK.SLACK px of
       forgiveness so jitter on a short putt is not a scribble), and how many
       times it changed between going down and going up (`turns`; a swing is
       one). Samples closer than JUNK.STEP px to the last one kept are skipped
       first, so the shake in a thumb does not add up to a path. */
    function swipeMess(pts, y0, depth) {
        var J = C.SWIPE.JUNK;
        if (!pts || pts.length < 2) return { ratio: 0, turns: 0, junk: false };
        var last = pts[0], len = 0, turns = 0, dir = 0, ext = pts[0][1];
        for (var i = 1; i < pts.length; i++) {
            var p = pts[i], dx = p[0] - last[0], dy = p[1] - last[1];
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < J.STEP) continue;
            len += d;
            last = p;
            if (dir >= 0) {
                if (p[1] >= ext) { ext = p[1]; dir = 1; }
                else if (dir === 1 && ext - p[1] > J.HYST) { turns++; dir = -1; ext = p[1]; }
            } else {
                if (p[1] <= ext) ext = p[1];
                else if (p[1] - ext > J.HYST) { turns++; dir = 1; ext = p[1]; }
            }
        }
        var ratio = len / (2 * Math.max(0, depth || 0) + J.SLACK);
        return { ratio: ratio, turns: turns, junk: ratio > J.RATIO || turns > J.TURNS };
    }

    /* What a junk swing does: the one place in the swing that is a dice roll,
       on purpose — a scribble has no line to read, so there is nothing to be
       fair about. A duff goes about straight and barely moves; a shank leaves
       at a right angle-ish, usually to the right, and not far either. Never
       less than the least the physics will launch, or the stroke would not
       count at all. `rand` defaults to Math.random; the tests hand in one. */
    function swipeJunk(rand) {
        var r = rand || Math.random, J = C.SWIPE.JUNK;
        if (r() < J.DUFF) {
            return { kind: 'duff', power: J.DUFF_POWER[0] + (J.DUFF_POWER[1] - J.DUFF_POWER[0]) * r(),
                     yaw: (r() * 2 - 1) * J.DUFF_YAW };
        }
        var side = r() < J.SHANK_RIGHT ? -1 : 1;           // +yaw is left
        return { kind: 'shank', power: J.SHANK_POWER[0] + (J.SHANK_POWER[1] - J.SHANK_POWER[0]) * r(),
                 yaw: side * (J.SHANK_YAW[0] + (J.SHANK_YAW[1] - J.SHANK_YAW[0]) * r()) };
    }

    /* Everything a swipe says, from the gesture's samples. `g` is
         { pts: [[x, y, t]…] the whole gesture, x0, y0 where it started,
           low: { x, y } the bottom of the pull, cross: { x, y, t } the strike,
           through: [[x, y]…] the swipe up only }
       and `opt` is { over, feel, timing, shapes: names the club can bend, or
       null for none }. */
    function swipeRead(g, opt) {
        opt = opt || {};
        var over = Math.max(0, Math.min(1, opt.over || 0));
        var angle = swipeAngle(g.low, g.cross);
        var line = swipeOff(angle, over, opt.feel);
        var times = swipeTimes(g.pts, g.y0, g.low.y, g.cross.t);
        var tempo = swipeTempo(times, opt.timing);
        var bow = swipeBow(g.through, g.low, g.cross);
        var shape = opt.shapes ? swipeShape(bow, opt.shapes) : null;
        // Rushing comes over the top and pulls it; quitting on it blocks it
        // right. On top of whatever the line already did.
        var off = Math.max(-1, Math.min(1, line + tempo.amount * C.SWIPE.TIMING.LINE));
        var weight = 1 - Math.max(0, tempo.amount) * C.SWIPE.TIMING.POWER_LOSS;
        var mess = swipeMess(g.pts, g.y0, g.low.y - g.y0);
        return {
            angle: angle, line: line, times: times, tempo: tempo, timing: opt.timing || 'off',
            bow: bow, shape: mess.junk ? null : shape, off: off, weight: weight, over: over, feel: opt.feel,
            mess: mess, junk: mess.junk ? swipeJunk(opt.rand) : null,
            perfect: !mess.junk && off === 0 && tempo.amount === 0 && (!shape || shape.cook === 0)
        };
    }

    /* The read as a gate, the shape `apply` and `shape` read. Inside a full
       swing the meter's gate never arms and the spray there is nothing —
       right for a shot stopped on the line, wrong for one swiped: a crooked
       swipe has to cost *something* or the straightness is decoration. So
       the envelope has a floor (the feel's FLOOR), and it is still the old
       spray curve, so a thrash costs what it always did. */
    function swiped(over, off, feel) {
        var o = Math.max(0, Math.min(1, over || 0));
        off = Math.max(-1, Math.min(1, off || 0));
        return { over: Math.max(feelOf(feel).FLOOR, o), off: off, done: true,
                 struck: true, perfect: off === 0, swipe: true };
    }

    function swipeGate(read) {
        var g = swiped(read.over, read.off, read.feel);
        g.perfect = read.perfect;
        g.weight = read.weight;
        if (read.junk) { g.junk = read.junk; g.perfect = false; return (g.read = read, g); }
        if (read.shape) { g.shapeName = read.shape.name; g.shapeOff = read.shape.off; }
        g.read = read;
        return g;
    }

    /* Why it went where it went, one short line per thing that was read:
       what it was, what it said, and whether that was good. game.js prints it
       on a small card after the shot, beside a drawing of the swipe — short,
       because the card sits over the course the ball is flying across. */
    function swipeReport(read, power) {
        var out = [];
        if (read.junk) {
            out.push({ what: 'Swing', says: 'a scribble, not a swing — ' +
                (read.junk.kind === 'duff' ? 'duffed' : 'shanked'), tier: 'bad' });
            out.push({ what: 'Path', says: read.mess.ratio.toFixed(1) + '× a clean swing\'s', tier: 'bad' });
            return out;
        }
        var deg = Math.round(Math.abs(read.angle) * 180 / Math.PI);
        var side = read.angle > 0 ? 'right' : 'left';
        out.push(read.line === 0
            ? { what: 'Line', says: deg ? 'straight (' + deg + '° ' + side + ')' : 'dead straight', tier: 'good' }
            : { what: 'Line', says: deg + '° ' + side + ' — ' + (read.angle > 0 ? 'pushed' : 'pulled'),
                tier: Math.abs(read.line) < 0.5 ? 'meh' : 'bad' });
        var t = read.tempo, tm = read.times;
        if (read.timing === 'rhythm' && t.said) {
            var r = t.ratio;
            out.push(t.said === 'clean'
                ? { what: 'Tempo', says: 'even', tier: 'good' }
                : t.said === 'rushed'
                    ? { what: 'Tempo', says: 'rushed — up ' + r.toFixed(1) + '× quicker', tier: t.amount > -0.5 ? 'meh' : 'bad' }
                    : { what: 'Tempo', says: 'lazy — up ' + (1 / r).toFixed(1) + '× slower', tier: t.amount < 0.5 ? 'meh' : 'bad' });
        } else if (read.timing === 'snap' && t.said) {
            var ms = Math.round(tm.through * 1000) + ' ms';
            out.push(t.said === 'clean'
                ? { what: 'Speed', says: 'crisp, ' + ms, tier: 'good' }
                : t.said === 'rushed'
                    ? { what: 'Speed', says: 'snatched, ' + ms, tier: t.amount > -0.5 ? 'meh' : 'bad' }
                    : { what: 'Speed', says: 'quit on it, ' + ms, tier: t.amount < 0.5 ? 'meh' : 'bad' });
        }
        if (read.shape) {
            var nm = read.shape.name;
            out.push(read.shape.cook === 0
                ? { what: 'Shape', says: nm + ' — clean', tier: 'good' }
                : read.shape.cook > 0
                    ? { what: 'Shape', says: nm + ' — too much, ' + (nm === 'draw' ? 'hooks' : 'slices'), tier: 'meh' }
                    : { what: 'Shape', says: nm + ' — too little', tier: 'meh' });
        }
        if (power) {
            var pc = Math.round(power.frac * 100);
            var lost = Math.round((1 - read.weight) * 100);
            out.push({ what: 'Power', says: pc + '%' + (lost ? ', −' + lost + '% lazy' : ''),
                       tier: lost ? 'meh' : pc > 100 ? 'hot' : 'good' });
        }
        return out;
    }

    /* ── the arcade arc ────────────────────────────────────────────────────

       The three-press swing every arcade golf game has had since the eighties,
       drawn as a half-dial over the ball. Press once and the needle climbs
       round the dial; press again to set the power where it is; it swings
       back, and the third press — as it comes back to where it started — is
       the strike. Power and accuracy are both timing, and neither is hidden:
       the full swing is the same white line, past it is the same hatched
       overdraw, and the zone you strike in is drawn at the start of the dial.

       `pos` runs 0 at the start to 1 at the end of the dial (the whole meter,
       overdraw included), and on the way back it may run on past 0 into a
       short tail (ARC.TAIL) before the swing is over — that is "late". Leaving
       the needle to go round on its own sets the most power there is, which
       is a thrash, and that is what it costs. */
    function overOfFrac(f) {
        return Math.max(0, Math.min(1, ((f || 0) * (1 + C.OVERDRAW) - 1) / C.OVERDRAW));
    }

    function arcWin(over) {
        var A = C.ARC;
        return A.WIN_MAX + (A.WIN_MIN - A.WIN_MAX) * ease(over);
    }

    // `shape` is the shot shape asked for, which makes the zone the shape's.
    function arcStart(shape) {
        return { phase: 'up', pos: 0, power: 0, shape: shape || 'straight',
                 over: 0, win: arcWin(0), done: false, struck: false, off: 0, perfect: false };
    }

    function arcSet(a) {
        a.power = a.pos;
        a.over = shapeOver(a.shape, overOfFrac(a.power));
        a.win = arcWin(a.over);
        a.phase = 'down';
    }

    function arcTick(a, dt) {
        if (a.done) return a;
        if (a.phase === 'up') {
            a.pos += C.ARC.SPEED * dt;
            if (a.pos >= 1) { a.pos = 1; arcSet(a); }
        } else {
            a.pos -= C.ARC.BACK * dt;
            if (a.pos <= -C.ARC.TAIL) { a.pos = -C.ARC.TAIL; arcEnd(a, false, 1); }
        }
        return a;
    }

    function arcPress(a) {
        if (a.done) return a;
        if (a.phase === 'up') { arcSet(a); return a; }
        // Still above the start is early, past it is late: early pulls, as
        // every miss in the game does.
        var e = Math.abs(a.pos);
        var off = e <= a.win ? 0 : Math.min(1, (e - a.win) / C.ARC.SPAN) * (a.pos > 0 ? -1 : 1);
        return arcEnd(a, true, off);
    }

    function arcEnd(a, struck, off) {
        a.done = true;
        a.phase = 'done';
        a.struck = struck;
        a.off = off;
        a.perfect = struck && off === 0;
        return a;
    }

    // The finished arc in the shape `apply` and `shape` read, floored like the
    // swipe so a mistimed strike inside a full swing still costs something.
    function arcGate(a) {
        return { over: Math.max(C.ARC.FLOOR, a.over), off: a.off, done: true,
                 struck: a.struck, perfect: a.perfect, arc: true };
    }

    /* ── the needle ───────────────────────────────────────────────────────

       Pull down to load, as the touch swing does; let go and a needle starts
       sweeping side to side over a fan above the ball, and a tap anywhere is
       the strike. Where the needle is when you tap is where the ball goes:
       left of the middle pulls it left and draws it, right pushes it right
       and fades it. It is the one style where the miss is a *place* on the
       screen rather than a time, so it is the easiest of them to read.

       The sweep is a triangle wave rather than a pendulum: a needle that slows
       at the ends and races through the middle spends the least time exactly
       where you want to tap. It starts at the left edge, so the first pass is
       one you can watch coming. The further the meter was pulled, the quicker
       the sweep and the narrower the middle. */
    function needleStart(over) {
        var N = C.NEEDLE, e = ease(over);
        return { over: Math.max(0, Math.min(1, over || 0)), t: 0, pos: -1,
                 period: N.PERIOD_MAX + (N.PERIOD_MIN - N.PERIOD_MAX) * e,
                 win: N.WIN_MAX + (N.WIN_MIN - N.WIN_MAX) * e,
                 done: false, struck: false, off: 0, perfect: false };
    }

    function needleTick(n, dt) {
        if (n.done) return n;
        n.t += dt;
        var u = (n.t / n.period) % 1;
        n.pos = -1 + 2 * (u < 0.5 ? u * 2 : 2 - u * 2);
        return n;
    }

    function needlePress(n) {
        if (n.done) return n;
        var a = Math.abs(n.pos);
        n.off = a <= n.win ? 0 : Math.min(1, (a - n.win) / C.NEEDLE.SPAN) * (n.pos < 0 ? -1 : 1);
        n.done = n.struck = true;
        n.perfect = n.off === 0;
        return n;
    }

    function needleGate(n) {
        return { over: Math.max(C.NEEDLE.FLOOR, n.over), off: n.off, done: true,
                 struck: n.struck, perfect: n.perfect, needle: true };
    }

    /* ── the grade ───────────────────────────────────────────────────────

       One word for how a strike went, whichever style made it, popped up over
       the stage the moment the ball leaves. The toast underneath says which
       way it went; this says how well, in the size a glance takes in. */
    function grade(g) {
        if (!g) return null;
        if (!g.struck) return { word: 'Whiff', tier: 'bad' };
        if (g.junk) return { word: g.junk.kind === 'duff' ? 'Duffed' : 'Shanked', tier: 'bad' };
        if (g.perfect) return { word: 'Perfect', tier: 'perfect' };
        var a = Math.abs(g.off);
        if (a < 0.2) return { word: 'Great', tier: 'great' };
        if (a < 0.45) return { word: 'Good', tier: 'good' };
        if (a < 0.75) return { word: g.off < 0 ? 'Pulled' : 'Pushed', tier: 'off' };
        return { word: 'Sprayed', tier: 'bad' };
    }

    G3.swing = {
        arms: arms,
        markAt: markAt,
        windowFor: windowFor,
        speedFor: speedFor,
        start: start,
        tick: tick,
        press: press,
        apply: apply,
        SHAPES: SHAPES,
        bendOf: bendOf,
        armsShape: armsShape,
        shapeOver: shapeOver,
        shape: shape,
        swipeLoad: swipeLoad,
        swipeAngle: swipeAngle,
        swipeTol: swipeTol,
        swipeOff: swipeOff,
        swipeTimes: swipeTimes,
        swipeTempo: swipeTempo,
        swipeBow: swipeBow,
        swipeShape: swipeShape,
        swipeMess: swipeMess,
        swipeJunk: swipeJunk,
        swipeRead: swipeRead,
        swipeGate: swipeGate,
        swipeReport: swipeReport,
        swiped: swiped,
        overOfFrac: overOfFrac,
        arcWin: arcWin,
        arcStart: arcStart,
        arcTick: arcTick,
        arcPress: arcPress,
        arcGate: arcGate,
        needleStart: needleStart,
        needleTick: needleTick,
        needlePress: needlePress,
        needleGate: needleGate,
        grade: grade
    };

})(window.G3);
