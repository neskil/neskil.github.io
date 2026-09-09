/* Scorecard arithmetic and the save file. Pure except for the two functions
   that touch localStorage, which swallow their errors — a browser with
   storage disabled should cost you your records, not your round. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;

    /* ── one save file per course ───────────────────────────────────────

       Six holes, nine and eighteen are not comparable totals: a six-hole
       round would take the eighteen-hole record the first time anyone played
       one, and a card written for one course cannot be resumed on another. So
       every key below is qualified by the course being played.

       The first course on the rack keeps the bare key it has always had,
       which is what leaves the record a player already has where they left
       it — and what keeps the landing page reading `miniGolf.save.v1` for
       its stat chip without knowing any of this.

       The course defaults to the one being played, and every caller that
       cares about a *different* one names it: the picker asks four courses
       for their records at once, and none of that is allowed to move
       `GOLF.COURSE_ID` — swapping the global to read a key would swap the
       card under the player's feet. */
    function key(base, courseId) {
        var id = courseId === undefined ? GOLF.COURSE_ID : courseId;
        var first = GOLF.COURSES && GOLF.COURSES[0].id;
        return (!id || id === first) ? base : base + '.' + id;
    }

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

    function load(courseId) {
        try {
            var raw = localStorage.getItem(key(C.SAVE_KEY, courseId));
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
            localStorage.setItem(key(C.SAVE_KEY), JSON.stringify(data));
        } catch (e) { /* private mode, quota, whatever — not worth a crash */ }
        return data;
    }

    /* ── the round in progress ──────────────────────────────────────────

       Eighteen holes is a long sitting, and a browser tab is a fragile place
       to keep one: a refresh, a phone locking, a laptop lid. The card is
       written to its own key after every hole so the round survives all three.

       What is *not* stored is the state of the hole you are standing on — no
       ball position, no stroke count, no clock for the moving gates. Resuming
       mid-flight would mean serialising the whole world and trusting it to
       still be legal after a course edit; resuming at the tee of that hole is
       a rule that fits in a sentence and cannot be wrong. You get the hole
       back, not the lie. */

    /* The seed is stored with the card for the one course that has one. A
       generated draw keeps its round under the same key every time, and no
       two draws are the same field, so without this a re-roll would offer
       the round from the last draw to the next one — a scorecard for holes
       that no longer exist. Null for every hand-built course, which costs
       them nothing. */
    function saveRound(holeIndex, scores, course) {
        try {
            localStorage.setItem(key(C.ROUND_KEY), JSON.stringify({
                holes: course.length,
                seed: typeof GOLF.COURSE_SEED === 'number' ? GOLF.COURSE_SEED : null,
                holeIndex: holeIndex,
                scores: Array.prototype.slice.call(scores, 0, course.length)
            }));
        } catch (e) { /* not worth a crash */ }
    }

    /* Returns a resumable round, or null. Null covers every kind of nonsense:
       no save, corrupt JSON, a card from a course with a different number of
       holes (the eighteen-hole rewrite invalidated every nine-hole save), a
       card from another draw of the procedural course, an index off the end,
       and a round that had not actually started.

       The two optional arguments are the picker's: it asks every course on
       the rack whether it has a round waiting, and it has to ask about a card
       that is not the one loaded. Left out, they mean the course being
       played, which is what every other caller wants. */
    function loadRound(course, courseId, courseSeed) {
        try {
            var raw = localStorage.getItem(key(C.ROUND_KEY, courseId));
            if (!raw) return null;
            var d = JSON.parse(raw);
            if (!d || !Array.isArray(d.scores) || d.holes !== course.length) return null;
            var want = courseSeed === undefined ? GOLF.COURSE_SEED : courseSeed;
            var seed = typeof want === 'number' ? want : null;
            if ((typeof d.seed === 'number' ? d.seed : null) !== seed) return null;
            if (typeof d.holeIndex !== 'number' || d.holeIndex < 1 || d.holeIndex >= course.length) return null;

            var scores = [], played = 0;
            for (var i = 0; i < course.length; i++) {
                if (typeof d.scores[i] === 'number' && d.scores[i] > 0) { scores[i] = d.scores[i]; played++; }
            }
            if (!played) return null;
            return { holeIndex: d.holeIndex, scores: scores };
        } catch (e) {
            return null;
        }
    }

    function clearRound() {
        try { localStorage.removeItem(key(C.ROUND_KEY)); } catch (e) { /* ignore */ }
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
        key: key,
        term: term,
        formatVsPar: formatVsPar,
        totals: totals,
        emptySave: emptySave,
        load: load,
        save: save,
        saveRound: saveRound,
        loadRound: loadRound,
        clearRound: clearRound,
        recordRound: recordRound
    };

})(window.GOLF);
