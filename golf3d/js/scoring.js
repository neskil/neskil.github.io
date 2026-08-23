/* scoring.js — what a round is worth, and what is remembered of it.

   Pure arithmetic and one localStorage key. No THREE, no DOM — render-tests.html
   checks that, because this file runs in tests.html where neither exists.

   Read by game.js and game/hud.js. Depends on config.js.

   Scorecard arithmetic and the save file. Pure except for the two functions
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
        return { courses: {}, rounds: 0, aces: 0 };
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
       screen wants to make a fuss about it. */
    function recordRound(prev, courseId, scores, holes) {
        var t = totals(scores, holes);
        var was = courseRecord(prev, courseId);
        var aces = 0, i;
        for (i = 0; i < scores.length; i++) if (scores[i] === 1) aces++;

        var next = { courses: {}, rounds: (prev.rounds || 0) + 1, aces: (prev.aces || 0) + aces };
        for (var id in prev.courses) {
            if (Object.prototype.hasOwnProperty.call(prev.courses, id)) next.courses[id] = prev.courses[id];
        }
        var isBest = was.best === null || t.strokes < was.best;
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
        recordRound: recordRound
    };

})(window.G3);
