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
        return { courses: {}, holes: {}, rounds: 0, aces: 0, balls: ['tour-white'], freeBalls: [], ball: 'tour-white', club: 'club-stock', cele: 'cele-classic', bag: 'bag-stock' };
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

    function normIdList(list, requiredId) {
        var out = [], seen = {}, i, id;
        if (requiredId) {
            out.push(requiredId);
            seen[requiredId] = true;
        }
        if (Array.isArray(list)) {
            for (i = 0; i < list.length; i++) {
                id = list[i];
                if (typeof id === 'string' && id && !seen[id]) {
                    seen[id] = true;
                    out.push(id);
                }
            }
        }
        return out;
    }

    // A save one level deep, so a record folded in never edits the one it came from.
    function copySave(prev) {
        var next = {
            courses: {},
            holes: {},
            rounds: prev.rounds || 0,
            aces: prev.aces || 0,
            balls: normIdList(prev.balls, 'tour-white'),
            freeBalls: normIdList(prev.freeBalls, null),
            ball: typeof prev.ball === 'string' && prev.ball ? prev.ball : 'tour-white',
            club: typeof prev.club === 'string' && prev.club ? prev.club : 'club-stock',
            cele: typeof prev.cele === 'string' && prev.cele ? prev.cele : 'cele-classic',
            bag: typeof prev.bag === 'string' && prev.bag ? prev.bag : 'bag-stock'
        }, id;
        for (id in prev.courses) {
            if (Object.prototype.hasOwnProperty.call(prev.courses, id)) next.courses[id] = prev.courses[id];
        }
        for (id in prev.holes || {}) {
            if (Object.prototype.hasOwnProperty.call(prev.holes, id)) next.holes[id] = prev.holes[id];
        }
        if (!ownsBall(next, next.ball)) next.ball = 'tour-white';
        if (!ownsBall(next, next.club)) next.club = 'club-stock';
        if (!ownsBall(next, next.cele)) next.cele = 'cele-classic';
        if (!ownsBall(next, next.bag)) next.bag = 'bag-stock';
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
            s.balls = normIdList(d.balls, 'tour-white');
            s.freeBalls = normIdList(d.freeBalls, null);
            if (typeof d.ball === 'string' && ownsBall(s, d.ball)) s.ball = d.ball;
            if (typeof d.club === 'string' && ownsBall(s, d.club)) s.club = d.club;
            if (typeof d.cele === 'string' && ownsBall(s, d.cele)) s.cele = d.cele;
            if (typeof d.bag === 'string' && ownsBall(s, d.bag)) s.bag = d.bag;
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

    function defaultCourses() {
        if (coursesCache()) return coursesCache();
        return [];
    }
    function coursesCache() {
        if (!G3.COURSE_GROUPS || !G3.coursesInGroup) return null;
        var list = [];
        G3.COURSE_GROUPS.forEach(function (g) {
            G3.coursesInGroup(g.id).forEach(function (c) { list.push(c); });
        });
        return list;
    }

    /* Total stars earned across every course and World Tour hole — matches the
       progression bar in the course picker (`game.js -> pickables`), and never
       decreases when stars are spent in the Pro Shop. */
    function earnedStars(saveData, courses, worlds) {
        var cs = courses || defaultCourses();
        var ws = worlds || (G3.portals && G3.portals.WORLDS) || [];
        var got = 0, max = 0, i;
        for (i = 0; i < cs.length; i++) {
            var st = courseStars(saveData, cs[i]);
            got += st.got;
            max += st.max;
        }
        for (i = 0; i < ws.length; i++) {
            var rec = holeRecord(saveData, 'world-' + ws[i].id, 0);
            got += rec.stars || 0;
            max += 3;
        }
        return { got: got, max: max };
    }

    // The catalog is everything the wallet buys: balls, club finishes and celebrations.
    function findBall(catalog, id) {
        var list = catalog || G3.SHOP_ITEMS || G3.BALLS || [];
        for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
        return null;
    }

    // The four free items, one per shelf, that every save owns.
    function isFree(id) { return id === 'tour-white' || id === 'club-stock' || id === 'cele-classic' || id === 'bag-stock'; }

    // Which slot of the save an item is equipped on.
    function slotOf(b) { return b && (b.kind === 'club' || b.kind === 'cele' || b.kind === 'bag') ? b.kind : 'ball'; }

    function ownsBall(saveData, ballId) {
        if (isFree(ballId)) return true;
        var list = saveData && saveData.balls;
        var free = saveData && saveData.freeBalls;
        return (Array.isArray(list) && list.indexOf(ballId) !== -1) ||
               (Array.isArray(free) && free.indexOf(ballId) !== -1);
    }

    function equippedBall(saveData, catalog) {
        var id = saveData && typeof saveData.ball === 'string' ? saveData.ball : 'tour-white';
        if (!ownsBall(saveData, id) || !findBall(catalog, id)) return 'tour-white';
        return id;
    }

    function spentStars(saveData, catalog) {
        var list = saveData && Array.isArray(saveData.balls) ? saveData.balls : [];
        var seen = {}, total = 0, i, b;
        for (i = 0; i < list.length; i++) {
            var id = list[i];
            if (seen[id] || isFree(id)) continue;
            seen[id] = true;
            b = findBall(catalog, id);
            if (b && b.cost > 0) total += b.cost;
        }
        return total;
    }

    function availableStars(saveData, courses, worlds, catalog) {
        var earned = earnedStars(saveData, courses, worlds).got;
        return Math.max(0, earned - spentStars(saveData, catalog));
    }

    /* ── achievements ──────────────────────────────────────────────────

       How far the player is towards a lock in balls.js (`G3.SHOP_LOCKS`).
       Counted from the save alone, so it is the same answer in the shop, on
       the card and in the tests. `have` is capped at `need`. */
    function lockProgress(saveData, key, courses, worlds) {
        var sv = saveData || emptySave();
        var cs = courses || defaultCourses();
        var played = function (id) { var r = sv.courses && sv.courses[id]; return !!(r && r.rounds > 0); };
        var n = 0, i, j;
        // Different holes finished, wherever they were (the Easter egg's unlock).
        if (key === 'holes') {
            for (var hk in sv.holes || {}) {
                if (Object.prototype.hasOwnProperty.call(sv.holes, hk) && sv.holes[hk] && sv.holes[hk].plays > 0) n++;
            }
            return n;
        }
        // Holes aced, each counted once however often (balls.js LOCKS.ace).
        if (key === 'ace') {
            for (i = 0; i < cs.length; i++) {
                for (j = 0; j < cs[i].holes.length; j++) if (holeRecord(sv, cs[i].id, j).best === 1) n++;
            }
            var aw = worlds || (G3.portals && G3.portals.WORLDS) || [];
            for (i = 0; i < aw.length; i++) if (holeRecord(sv, 'world-' + aw[i].id, 0).best === 1) n++;
            return n;
        }
        if (key === 'rounds') return sv.rounds || 0;
        if (key === 'under') {
            for (var id in sv.courses || {}) {
                if (!Object.prototype.hasOwnProperty.call(sv.courses, id)) continue;
                var r = sv.courses[id];
                if (r && r.rounds > 0 && typeof r.bestVsPar === 'number' && r.bestVsPar < 0) return 1;
            }
            return 0;
        }
        if (key === 'kinds') {
            var groups = {};
            for (i = 0; i < cs.length; i++) if (cs[i].group && played(cs[i].id)) groups[cs[i].group] = true;
            for (var g in groups) if (Object.prototype.hasOwnProperty.call(groups, g)) n++;
            return n;
        }
        if (key === 'courses') {
            for (i = 0; i < cs.length; i++) if (played(cs[i].id)) n++;
            return n;
        }
        if (key === 'perfect') {
            for (i = 0; i < cs.length; i++) {
                var three = 0;
                for (j = 0; j < cs[i].holes.length; j++) if (holeRecord(sv, cs[i].id, j).stars >= 3) three++;
                n = Math.max(n, three);
            }
            return n;
        }
        if (key === 'tour') {
            var ws = worlds || (G3.portals && G3.portals.WORLDS) || [];
            for (i = 0; i < ws.length; i++) if (holeRecord(sv, 'world-' + ws[i].id, 0).stars > 0) n++;
            return n;
        }
        return 0;
    }

    /* `{ locked, met, have, need, text }` for one shop item. An item with no
       lock, or one already owned, is never locked. */
    function lockStatus(saveData, itemId, opts) {
        var o = opts || {};
        var b = findBall(o.catalog, itemId);
        var L = b && b.lock && G3.SHOP_LOCKS ? G3.SHOP_LOCKS[b.lock] : null;
        if (!L) return { locked: false, met: true, have: 0, need: 0, text: '' };
        var have = Math.min(L.need, lockProgress(saveData, b.lock, o.courses, o.worlds));
        var met = have >= L.need;
        return { locked: !met && !ownsBall(saveData, itemId), met: met, have: have, need: L.need, text: L.text };
    }

    /* Buy any item in any order as soon as availableStars >= its cost and its
       achievement (if it has one) is met, and equip it immediately. Returns
       `{ ok, reason?, save, need? }`; reason is 'insufficient' or
       'achievement'. */
    function buyBall(prev, ballId, opts) {
        var o = opts || {};
        var b = findBall(o.catalog, ballId);
        if (!b) return { ok: false, reason: 'missing', save: prev };
        if (ownsBall(prev, ballId)) {
            var eq = equipBall(prev, ballId, o.catalog);
            return { ok: true, alreadyOwned: true, save: eq.save };
        }
        // A secret is found, never bought (balls.js, the Easter egg).
        if (b.secret && !o.found) return { ok: false, reason: 'secret', save: prev };
        var ls = lockStatus(prev, ballId, o);
        if (ls.locked) return { ok: false, reason: 'achievement', lock: ls, save: prev };
        var avail = availableStars(prev, o.courses, o.worlds, o.catalog);
        if (avail < b.cost) {
            return { ok: false, reason: 'insufficient', need: b.cost - avail, save: prev };
        }
        var next = copySave(prev);
        if (next.balls.indexOf(ballId) === -1) next.balls.push(ballId);
        next[slotOf(b)] = ballId;
        return { ok: true, alreadyOwned: false, save: next, spent: b.cost };
    }

    function equipBall(prev, ballId, catalog) {
        if (!ownsBall(prev, ballId) || !findBall(catalog, ballId)) {
            return { ok: false, reason: 'locked', save: prev };
        }
        var next = copySave(prev);
        next[slotOf(findBall(catalog, ballId))] = ballId;
        return { ok: true, save: next };
    }

    function equippedClub(saveData) {
        var id = saveData && typeof saveData.club === 'string' ? saveData.club : 'club-stock';
        var f = findBall(null, id);
        if (!ownsBall(saveData, id) || !f || f.kind !== 'club') return 'club-stock';
        return id;
    }

    /* The secrets the save has earned and does not have yet, given without
       being equipped: `{ save, given: [items] }`. A secret's `unlock` names a
       lockProgress key and how much of it. */
    function grantSecrets(prev) {
        var list = G3.SHOP_ITEMS || [], next = prev, given = [], i, b;
        for (i = 0; i < list.length; i++) {
            b = list[i];
            if (!b.secret || !b.unlock || ownsBall(next, b.id)) continue;
            if (lockProgress(next, b.unlock.key) < b.unlock.need) continue;
            if (next === prev) next = copySave(prev);
            next.balls.push(b.id);
            given.push(b);
        }
        return { save: next, given: given };
    }

    function equippedBag(saveData) {
        var id = saveData && typeof saveData.bag === 'string' ? saveData.bag : 'bag-stock';
        var f = findBall(null, id);
        if (!ownsBall(saveData, id) || !f || f.kind !== 'bag') return 'bag-stock';
        return id;
    }

    function equippedCele(saveData) {
        var id = saveData && typeof saveData.cele === 'string' ? saveData.cele : 'cele-classic';
        var f = findBall(null, id);
        if (!ownsBall(saveData, id) || !f || f.kind !== 'cele') return 'cele-classic';
        return id;
    }

    /* Dev-mode unlocks sit in `freeBalls` rather than `balls`, so unlocking
       cosmetics to test shaders never adds phantom star debt to `spentStars`. */
    function unlockBallFree(prev, ballId, catalog) {
        var b = findBall(catalog, ballId);
        if (!b) return { ok: false, reason: 'missing', save: prev };
        var next = copySave(prev);
        if (!ownsBall(next, ballId)) next.freeBalls.push(ballId);
        next[slotOf(b)] = ballId;
        return { ok: true, save: next };
    }

    function unlockAllBallsFree(prev, catalog) {
        var list = catalog || G3.SHOP_ITEMS || G3.BALLS || [];
        var next = copySave(prev);
        for (var i = 0; i < list.length; i++) {
            var id = list[i].id;
            if (!ownsBall(next, id)) next.freeBalls.push(id);
        }
        return { ok: true, save: next };
    }

    function resetFreeBalls(prev) {
        var next = copySave(prev);
        next.freeBalls = [];
        if (!ownsBall(next, next.ball)) next.ball = 'tour-white';
        if (!ownsBall(next, next.club)) next.club = 'club-stock';
        if (!ownsBall(next, next.cele)) next.cele = 'cele-classic';
        if (!ownsBall(next, next.bag)) next.bag = 'bag-stock';
        return { ok: true, save: next };
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
        totalStars: totalStars,
        earnedStars: earnedStars,
        spentStars: spentStars,
        availableStars: availableStars,
        ownsBall: ownsBall,
        equippedBall: equippedBall,
        buyBall: buyBall,
        equipBall: equipBall,
        equippedClub: equippedClub,
        equippedCele: equippedCele,
        equippedBag: equippedBag,
        grantSecrets: grantSecrets,
        lockProgress: lockProgress,
        lockStatus: lockStatus,
        unlockBallFree: unlockBallFree,
        unlockAllBallsFree: unlockAllBallsFree,
        resetFreeBalls: resetFreeBalls
    };

})(window.G3);
