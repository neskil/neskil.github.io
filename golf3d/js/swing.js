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

   Four gates, rotating by stroke so a round meets all of them, and all four
   are the same golf swing with more or less of it to do:

     tempo    one pass up the bar; strike at the mark.
     return   up to the power you loaded, turn, and strike it on the way down.
     double   the same, plus a press at the top — how well you hit that one
              decides how much room the strike gets.
     fade     tempo, with the marker hidden for the run in. Rhythm, not sight.

   None of this file knows about the DOM or three.js. It is arithmetic over a
   plain object, so tests.html covers it with no browser at all. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;

    /* The four gates in the order a round meets them. Kept as a list rather
       than picked at random: meeting all four in order is how they get
       learned, and a random one can hand you `fade` three times before you
       have seen `tempo` once.

       What is handed to `pick` is the *hole*, not the stroke — see game.js.
       One gate per hole is the difference between learning a rhythm and being
       shown a new one every time you wind the meter up. */
    var VARIANTS = ['tempo', 'return', 'double', 'fade'];

    function pick(n) {
        return VARIANTS[((n | 0) % VARIANTS.length + VARIANTS.length) % VARIANTS.length];
    }

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

    /* `at` is where the meter was loaded to, as a fraction of the whole bar.
       It is the top of the backswing on the gates that have one: the marker
       climbs to the power you actually asked for, not to the end of the bar,
       so a shot wound to 105% has a short swing and one wound to 130% a long
       one. The gate is the shot's shape, not a fixed animation. */
    function start(variant, over, at) {
        var mark = markAt();
        var top = Math.max(mark + 0.04, Math.min(1, at || 1));
        return {
            variant: VARIANTS.indexOf(variant) >= 0 ? variant : 'tempo',
            over: Math.max(0, Math.min(1, over || 0)),
            mark: mark,
            top: top,
            win: windowFor(over),
            speed: speedFor(over),
            pos: 0,
            dir: 1,
            turned: false,      // has it come back off the top yet
            stage: 0,           // 0 = waiting for the top press (double only)
            topOff: 0,          // how far off that press was, once it is made
            done: false,
            struck: false,      // did a press end it, or did it run out
            off: 0,             // signed timing error, -1 early … +1 late
            perfect: false
        };
    }

    /* Is the strike zone live right now? On the gates that turn, only on the
       way down — the marker going *up* is the backswing, and a golfer who
       hits the ball on the way up has not hit the ball. */
    function live(g) {
        if (g.done) return false;
        if (g.variant === 'double' && g.stage === 0) return false;
        if (g.variant === 'return' || g.variant === 'double') return g.turned;
        return true;
    }

    /* Whether the marker is drawn where it is. `fade` puts it out for the run
       in to the line and brings it back after — which is the whole of that
       gate. You have watched it cross most of the bar at a steady speed, so
       you know when it arrives; the dark stretch only stops you checking. It
       comes back rather than staying out because a marker that never returns
       makes a miss unreadable, and a gate you cannot learn from is a gate that
       stays as hard on the hundredth swing as the first. */
    function visible(g) {
        if (g.variant !== 'fade') return true;
        return Math.abs(g.pos - g.mark) > C.SWING.FADE_LEAD;
    }

    // Which mark the next press is being judged against.
    function targetOf(g) {
        return (g.variant === 'double' && g.stage === 0) ? g.top : g.mark;
    }

    /* One frame of the marker. It ends on its own if the swing runs out —
       Swing has been pressed, the club is moving, and a player who does
       nothing has not cancelled the shot, they have missed it. Running out is
       the late edge of a total miss, which is the same thing the dice could
       already hand you at this overdraw. */
    function tick(g, dt) {
        if (g.done) return g;
        g.pos += g.dir * g.speed * dt;

        if (g.dir > 0 && g.pos >= g.top && (g.variant === 'return' || g.variant === 'double')) {
            // The top of the backswing. On `double` a press was due here; not
            // making one is a missed press, judged where the turn happened.
            if (g.variant === 'double' && g.stage === 0) {
                g.stage = 1;
                g.topOff = 1;
            }
            g.pos = g.top;
            g.dir = -1;
            g.turned = true;
            return g;
        }
        if (g.dir > 0 && g.pos >= 1) { g.pos = 1; return finish(g, false); }
        if (g.dir < 0 && g.pos <= 0) { g.pos = 0; return finish(g, false); }
        return g;
    }

    /* A press. On `double` the first one sets the top and the second strikes;
       everywhere else the first one strikes.

       A press while the zone is not live — swinging at the ball on the way
       back — is not free and is not ignored either: it ends the gate as a
       miss on the early side, because that is exactly what it is. */
    function press(g) {
        if (g.done) return g;
        if (g.variant === 'double' && g.stage === 0) {
            g.topOff = errAgainst(g, g.top);
            g.stage = 1;
            return g;
        }
        if (!live(g)) return finish(g, true, -1);
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
        /* The top press, on the gate that has one, does not push the ball
           anywhere by itself — it decides how much room the strike had, which
           `windowFor` cannot know when the gate is built. What it does instead
           is add to the miss: coming off a bad top and then striking clean is
           still a swing that started wrong. */
        if (g.variant === 'double' && g.topOff) {
            var add = Math.abs(g.topOff) * C.SWING.TOP_WEIGHT;
            var sign = g.off !== 0 ? (g.off > 0 ? 1 : -1) : (g.topOff > 0 ? 1 : -1);
            g.off = Math.max(-1, Math.min(1, Math.abs(g.off) + add)) * sign;
        }
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
        return {
            yaw: shot.yaw + off * s.yaw,
            power: shot.power * (1 - Math.abs(off) * s.power),
            spin: off * s.yaw * C.SWING.SPIN
        };
    }

    G3.swing = {
        VARIANTS: VARIANTS,
        pick: pick,
        arms: arms,
        markAt: markAt,
        windowFor: windowFor,
        speedFor: speedFor,
        start: start,
        tick: tick,
        press: press,
        live: live,
        visible: visible,
        targetOf: targetOf,
        apply: apply
    };

})(window.G3);
