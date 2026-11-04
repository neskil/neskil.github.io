/* Scorecard arithmetic and the save file. Pure except for the two functions
   that touch localStorage, which swallow their errors — a browser with storage
   disabled should cost you your records, not your round.

   Records are kept per course rather than per round, because a personal best
   at Seaside Green says nothing about Windmill Works and merging them would
   just reward playing the easy one. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;

    /* Golf names the first few scores and gives up after that, which is about
       right: nobody has a word for eight over. */
    function term(strokes, par) {
        if (strokes === 1) return { label: 'Hole in One!', kind: 'ace' };
        var d = strokes - par;
        if (d <= -3) return { label: 'Albatross', kind: 'great' };
        if (d === -2) return { label: 'Eagle', kind: 'great' };
        if (d === -1) return { label: 'Birdie', kind: 'good' };
        if (d === 0) return { label: 'Par', kind: 'par' };
        if (d === 1) return { label: 'Bogey', kind: 'over' };
        if (d === 2) return { label: 'Double Bogey', kind: 'over' };
        if (d === 3) return { label: 'Triple Bogey', kind: 'over' };
        return { label: '+' + d, kind: 'over' };
    }

    function formatVsPar(n) {
        if (n === 0) return 'E';
        return (n > 0 ? '+' : '') + n;
    }

    /* Totals over however many holes have actually been played, so the header
       can show a running score mid-round without pretending the unplayed holes
       were birdies. */
    function totals(scores, holes) {
        var strokes = 0, par = 0, played = 0, i;
        for (i = 0; i < holes.length; i++) {
            if (typeof scores[i] !== 'number') continue;
            strokes += scores[i];
            par += holes[i].par;
            played++;
        }
        return { strokes: strokes, par: par, vsPar: strokes - par, played: played };
    }

    function coursePar(holes) {
        var p = 0, i;
        for (i = 0; i < holes.length; i++) p += holes[i].par;
        return p;
    }

    function emptyCourse() {
        return { best: null, bestVsPar: null, bestCard: null, rounds: 0 };
    }

    function emptySave() {
        return { courses: {}, holes: {}, rounds: 0, aces: 0 };
    }

    /* ── stars, and the holes behind them ──────────────────────────────

       The same three stars the 2D game next door gives: three for beating
       par, two for matching it, one for getting it down at all and none for
       a pick-up. Under par rather than "an ace" for the third, because on a
       par two those are the same thing and on a par five they are not — and
       a star only luck can get you is not a goal.

       A pick-up is scored at par + PICKUP and reads as no star. A ball holed
       with exactly that last stroke scores the same number and reads the same
       way: one star lost on a hole played eight over is cheaper than a second
       field on every card to tell the two apart.

       Kept per hole, by its home course and its number, so a hole is the same
       hole whether it was met at home or in a showcase deal — and `plays` is
       what the showcase and the shuffle read to lean towards holes you have
       not seen. */
    function stars(score, par) {
        if (typeof score !== 'number' || score < 1 || score >= par + C.PICKUP) return 0;
        if (score < par) return 3;
        if (score === par) return 2;
        return 1;
    }

    function starText(n) {
        var s = '', i;
        for (i = 0; i < 3; i++) s += i < n ? '\u2605' : '\u2606';
        return s;
    }

    function holeKey(courseId, index) { return courseId + ':' + index; }

    function emptyHole() { return { plays: 0, best: null, stars: 0 }; }

    function holeRecord(saveData, courseId, index) {
        var h = saveData && saveData.holes ? saveData.holes[holeKey(courseId, index)] : null;
        return h || emptyHole();
    }

    /* Fold one finished hole into the save. `scored: false` counts the play
       and nothing else — a pass-and-play hole was still seen, so the showcase
       should still lean away from it, but whose stars would they be? */
    function recordHole(prev, courseId, index, score, par, opts) {
        var scored = !(opts && opts.scored === false);
        var was = holeRecord(prev, courseId, index);
        var got = scored ? stars(score, par) : 0;
        var next = copySave(prev);
        var isBest = scored && typeof score === 'number' && (was.best === null || score < was.best);
        next.holes[holeKey(courseId, index)] = {
            plays: (was.plays || 0) + 1,
            best: isBest ? score : was.best,
            stars: Math.max(was.stars || 0, got)
        };
        return { save: next, stars: got, was: was, isBest: isBest, moreStars: got > (was.stars || 0) };
    }

    // Stars held on a course, out of three a hole.
    function courseStars(saveData, course) {
        var got = 0, i;
        for (i = 0; i < course.holes.length; i++) got += holeRecord(saveData, course.id, i).stars;
        return { got: got, max: course.holes.length * 3 };
    }

    function totalStars(saveData, courses) {
        var got = 0, max = 0;
        courses.forEach(function (c) {
            var s = courseStars(saveData, c);
            got += s.got; max += s.max;
        });
        return { got: got, max: max };
    }

    // A save one level deep, so a record folded in never edits the one it came from.
    function copySave(prev) {
        var next = { courses: {}, holes: {}, rounds: prev.rounds || 0, aces: prev.aces || 0 }, id;
        for (id in prev.courses) {
            if (Object.prototype.hasOwnProperty.call(prev.courses, id)) next.courses[id] = prev.courses[id];
        }
        for (id in prev.holes || {}) {
            if (Object.prototype.hasOwnProperty.call(prev.holes, id)) next.holes[id] = prev.holes[id];
        }
        return next;
    }

    function load() {
        try {
            var raw = localStorage.getItem(C.SAVE_KEY);
            if (!raw) return emptySave();
            var d = JSON.parse(raw);
            var s = emptySave();
            if (typeof d.rounds === 'number') s.rounds = d.rounds;
            if (typeof d.aces === 'number') s.aces = d.aces;
            if (d.courses && typeof d.courses === 'object') {
                for (var id in d.courses) {
                    if (!Object.prototype.hasOwnProperty.call(d.courses, id)) continue;
                    var c = d.courses[id], e = emptyCourse();
                    if (typeof c.best === 'number') e.best = c.best;
                    if (typeof c.bestVsPar === 'number') e.bestVsPar = c.bestVsPar;
                    if (typeof c.rounds === 'number') e.rounds = c.rounds;
                    if (Array.isArray(c.bestCard)) e.bestCard = c.bestCard;
                    s.courses[id] = e;
                }
            }
            if (d.holes && typeof d.holes === 'object') {
                for (var k in d.holes) {
                    if (!Object.prototype.hasOwnProperty.call(d.holes, k)) continue;
                    var h = d.holes[k], o = emptyHole();
                    if (!h || typeof h !== 'object') continue;
                    if (typeof h.plays === 'number' && h.plays >= 0) o.plays = Math.floor(h.plays);
                    if (typeof h.best === 'number') o.best = h.best;
                    if (typeof h.stars === 'number') o.stars = Math.max(0, Math.min(3, Math.floor(h.stars)));
                    s.holes[k] = o;
                }
            }
            return s;
        } catch (e) {
            return emptySave();
        }
    }

    function save(data) {
        try {
            localStorage.setItem(C.SAVE_KEY, JSON.stringify(data));
        } catch (e) { /* private mode, quota, whatever — not worth a crash */ }
        return data;
    }

    function courseRecord(saveData, id) {
        return saveData.courses[id] || emptyCourse();
    }

    /* Fold a finished round into the save. Returns the new save plus whether
       this round beat the record for that course, because the end-of-round
       screen wants to make a fuss about it.

       `byPar` judges the round against par instead of by strokes, for a
       course whose holes are not the same holes every time — the showcase.
       Two deals add up to different pars, so the fewest strokes would be a
       record of the easiest deal rather than of the best round. */
    function recordRound(prev, courseId, scores, holes, opts) {
        var byPar = !!(opts && opts.byPar);
        var t = totals(scores, holes);
        var was = courseRecord(prev, courseId);
        var aces = 0, i;
        for (i = 0; i < scores.length; i++) if (scores[i] === 1) aces++;

        var next = copySave(prev);
        next.rounds = (prev.rounds || 0) + 1;
        next.aces = (prev.aces || 0) + aces;
        var isBest = byPar
            ? was.bestVsPar === null || t.vsPar < was.bestVsPar
            : was.best === null || t.strokes < was.best;
        next.courses[courseId] = {
            best: isBest ? t.strokes : was.best,
            bestVsPar: isBest ? t.vsPar : was.bestVsPar,
            bestCard: isBest ? scores.slice() : was.bestCard,
            rounds: (was.rounds || 0) + 1
        };
        return { save: next, isBest: isBest, totals: t };
    }

    G3.scoring = {
        term: term,
        formatVsPar: formatVsPar,
        totals: totals,
        coursePar: coursePar,
        emptySave: emptySave,
        emptyCourse: emptyCourse,
        courseRecord: courseRecord,
        load: load,
        save: save,
        recordRound: recordRound,
        stars: stars,
        starText: starText,
        holeRecord: holeRecord,
        recordHole: recordHole,
        courseStars: courseStars,
        totalStars: totalStars
    };

})(window.G3);
