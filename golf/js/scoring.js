/* Scorecard arithmetic and the save file. Pure except for the two functions
   that touch localStorage, which swallow their errors — a browser with
   storage disabled should cost you your records, not your round. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;

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
       can show a running score mid-round without pretending the unplayed
       holes were birdies. */
    function totals(scores, course) {
        var strokes = 0, par = 0, played = 0;
        for (var i = 0; i < course.length; i++) {
            if (typeof scores[i] !== 'number') continue;
            strokes += scores[i];
            par += course[i].par;
            played++;
        }
        return { strokes: strokes, par: par, vsPar: strokes - par, played: played };
    }

    function emptySave() {
        return { best: null, bestVsPar: null, rounds: 0, aces: 0, bestCard: null };
    }

    function load() {
        try {
            var raw = localStorage.getItem(C.SAVE_KEY);
            if (!raw) return emptySave();
            var d = JSON.parse(raw);
            var s = emptySave();
            if (typeof d.best === 'number') s.best = d.best;
            if (typeof d.bestVsPar === 'number') s.bestVsPar = d.bestVsPar;
            if (typeof d.rounds === 'number') s.rounds = d.rounds;
            if (typeof d.aces === 'number') s.aces = d.aces;
            if (Array.isArray(d.bestCard)) s.bestCard = d.bestCard;
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

    /* Fold a finished round into the save. Returns the new save plus whether
       this round beat the record, because the end-of-round screen wants to
       make a fuss about it. */
    function recordRound(prev, scores, course) {
        var t = totals(scores, course);
        var next = {
            best: prev.best,
            bestVsPar: prev.bestVsPar,
            rounds: (prev.rounds || 0) + 1,
            aces: (prev.aces || 0) + scores.filter(function (s) { return s === 1; }).length,
            bestCard: prev.bestCard
        };
        var isBest = next.best === null || t.strokes < next.best;
        if (isBest) {
            next.best = t.strokes;
            next.bestVsPar = t.vsPar;
            next.bestCard = scores.slice();
        }
        return { save: next, isBest: isBest, totals: t };
    }

    GOLF.scoring = {
        term: term,
        formatVsPar: formatVsPar,
        totals: totals,
        emptySave: emptySave,
        load: load,
        save: save,
        recordRound: recordRound
    };

})(window.GOLF);
