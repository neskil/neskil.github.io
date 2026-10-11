/* Swing school: the driving range's lessons.

   The overdraw is the one mechanic in the game that the screen cannot explain
   by itself. Up to the white line the ball goes where the cone points; past it
   Swing starts a timing gate instead of playing the shot, and the gate is one
   of four rhythms that rotate *by hole* out on the courses (swing.js → pick).
   Met there, cold, the rotation reads as the game changing its mind: four
   different things happen when you press the same button, and nothing says
   why. The range is where nothing is at stake, so it is where each of them is
   taught on its own, one at a time, with a small goal so the lesson ends.

   The lessons are, in order:

     line     inside the white line — the shot that never sprays.
     tempo    one pass; strike as the marker crosses the line.
     return   up to your power and back; it only counts coming down.
     double   a press at the top, then the strike.
     fade     tempo with the marker dark over the line.

   Nothing here knows about the DOM or three.js. game.js owns the panel and the
   meter; this owns what a lesson is, what counts as passing it, and what to
   say while the marker is moving — so tests.html can check all three without
   a browser. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;

    /* `gate` is the swing.js variant a lesson pins the range to — null for the
       one that is about staying out of the gate. `load` is where "Load it for
       me" puts the meter, as a fraction of a full swing: far enough past the
       line to arm the gate (CONFIG.SWING.ARM), not so far that the first try
       is the hardest version of it. `need` is how many it takes. */
    var LESSONS = [
        {
            id: 'line', title: 'The white line', gate: null, load: 1, need: 2,
            text: 'Up to the white line on the meter there is no luck at all: ' +
                  'the ball goes exactly where the cone points. ' +
                  'Land a ball on any of the target greens without going past the line.',
            goal: 'balls on a target green, inside the line'
        },
        {
            id: 'tempo', title: 'Tempo', gate: 'tempo', load: 1.12, need: 3,
            text: 'Load past the white line into the striped stretch. Now Swing ' +
                  'does not hit — it starts a marker along the meter. ' +
                  'Press again as it crosses the white line.',
            goal: 'clean strikes'
        },
        {
            id: 'return', title: 'Return', gate: 'return', load: 1.12, need: 3,
            text: 'The marker climbs to the power you loaded, turns, and comes back. ' +
                  'Going up is the backswing and does not count — ' +
                  'strike as it crosses the line on the way down.',
            goal: 'clean strikes'
        },
        {
            id: 'double', title: 'Double', gate: 'double', load: 1.12, need: 3,
            text: 'Two presses. The first at the top, as the marker turns; the second ' +
                  'on the line coming down. A sloppy top press eats into the strike.',
            goal: 'clean strikes'
        },
        {
            id: 'fade', title: 'Fade', gate: 'fade', load: 1.12, need: 3,
            text: 'Tempo, but the marker goes dark just before the line. ' +
                  'You have seen how fast it moves — strike on the rhythm, not on sight.',
            goal: 'clean strikes'
        }
    ];

    /* The question the whole school exists to answer, said once at the top of
       the panel: why the same button does four different things. */
    var WHY = 'Past the white line a shot goes up to ' +
        Math.round(((1 + C.OVERDRAW) * (1 + C.OVER_GAIN) - 1) * 100) +
        '% further — if you time it. Out on the courses the timing changes ' +
        'every hole, round the four in turn, so a round tests all of them. ' +
        'Here you can practise one at a time.';

    function byId(id) {
        for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].id === id) return LESSONS[i];
        return LESSONS[0];
    }

    /* The gate a range shot past the line should open. A lesson that pins one
       gets it; the line lesson, which is not about the gate at all, gets the
       simplest one rather than a surprise. */
    function variantFor(id) { return byId(id).gate || 'tempo'; }

    /* A strike that passes: inside the window, or near enough that the game
       already calls it "a touch early" rather than a miss (game.js →
       sayStrike). Running out of swing never passes. */
    function clean(g) {
        return !!(g && g.done && g.struck && Math.abs(g.off) < 0.34);
    }

    /* What to do *now*, while the marker is moving. This is the half a
       paragraph cannot do: the gates that turn are only learnable when the
       game says "now" at the moment that matters. */
    function stepFor(g) {
        if (!g || g.done) return '';
        switch (g.variant) {
            case 'return':
                return g.turned ? 'Coming down — strike on the line!' : 'Backswing… wait for the turn';
            case 'double':
                if (g.stage === 0) return 'Press as it reaches the top';
                return 'Now strike on the line';
            case 'fade':
                return Math.abs(g.pos - g.mark) > C.SWING.FADE_LEAD && g.pos < g.mark
                    ? 'Watch the speed…' : 'Dark — strike on rhythm';
            default:
                return 'Strike as it crosses the line';
        }
    }

    // A progress record that came out of storage, or nothing: whatever it was,
    // what comes back has a count for every lesson and nothing else.
    function normalise(raw) {
        var out = {};
        LESSONS.forEach(function (l) {
            var n = raw && typeof raw[l.id] === 'number' ? raw[l.id] : 0;
            out[l.id] = Math.max(0, Math.min(l.need, Math.floor(n)));
        });
        return out;
    }

    // One more towards a lesson. Returns true the moment it completes, once.
    function credit(progress, id) {
        var l = byId(id);
        if (progress[l.id] >= l.need) return false;
        progress[l.id]++;
        return progress[l.id] >= l.need;
    }

    function passed(progress, id) { return progress[id] >= byId(id).need; }

    // Where to start: the first lesson not yet passed, or the first one again.
    function firstOpen(progress) {
        for (var i = 0; i < LESSONS.length; i++) if (!passed(progress, LESSONS[i].id)) return LESSONS[i].id;
        return LESSONS[0].id;
    }

    function allPassed(progress) {
        for (var i = 0; i < LESSONS.length; i++) if (!passed(progress, LESSONS[i].id)) return false;
        return true;
    }

    G3.school = {
        LESSONS: LESSONS,
        WHY: WHY,
        byId: byId,
        variantFor: variantFor,
        clean: clean,
        stepFor: stepFor,
        normalise: normalise,
        credit: credit,
        passed: passed,
        firstOpen: firstOpen,
        allPassed: allPassed
    };

})(window.G3);
