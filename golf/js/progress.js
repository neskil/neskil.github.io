/* Progression: stars, which courses are open, and the lessons a first round
   teaches. No DOM and no canvas — localStorage is the only thing it touches,
   and every touch is wrapped, so tests.html can drive it directly.

   The shape is the classic one. A new player is handed one course and a
   reason to finish it; finishing holes earns stars; stars open the next
   card. Three decisions keep that from turning into a wall:

   **Stars are read, not stored.** They come off each course's own per-hole
   bests (scoring.js), so there is one record of how well you played a hole
   and one way to read it. Nothing here can disagree with the scorecard.

   **Nothing a player had is taken away.** Anyone with a save from before
   this file existed is a veteran, and a veteran starts with every course
   open — locking the Wild Nine on somebody who has a record on it would be
   the game forgetting them. For the same reason a course, once started, is
   granted for good: raising a threshold later cannot shut a door on a round
   already in progress.

   **The lock is a nudge, not a gate.** A link that names a course is an
   invitation and opens it, and the picker carries a way to open everything
   at once for the visitor who came to look rather than to climb. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;
    var S = GOLF.scoring;

    /* The things a first round has to be told about, in the order they are
       likely to turn up. `gates` is a moving wall rather than a list of its
       own, because a wall that holds still needs no introduction. */
    var LESSONS = ['rough', 'sand', 'water', 'ice', 'gates', 'bumpers', 'slopes', 'tunnels'];
    // Everything a player of the old game has already met.
    var OLD_LESSONS = ['rough', 'sand', 'water', 'ice', 'gates', 'bumpers', 'slopes'];

    var state = null;

    function blank() {
        return { v: 1, all: false, granted: {}, seen: {}, coached: false, veteran: false };
    }

    function read() {
        try {
            var raw = localStorage.getItem(C.PROGRESS_KEY);
            if (!raw) return null;
            var d = JSON.parse(raw);
            if (!d || d.v !== 1) return null;
            var s = blank();
            s.all = d.all === true;
            s.coached = d.coached === true;
            s.veteran = d.veteran === true;
            if (d.granted && typeof d.granted === 'object') {
                Object.keys(d.granted).forEach(function (k) { if (d.granted[k]) s.granted[k] = true; });
            }
            if (d.seen && typeof d.seen === 'object') {
                Object.keys(d.seen).forEach(function (k) { if (d.seen[k]) s.seen[k] = true; });
            }
            return s;
        } catch (e) {
            return null;
        }
    }

    function write() {
        try { localStorage.setItem(C.PROGRESS_KEY, JSON.stringify(state)); } catch (e) { /* storage off */ }
    }

    /* Has this browser played before progression existed? Any of the old
       keys says so. It has to be asked before the game writes anything of
       its own on boot — the draw's seed is remembered on every load, and a
       first visit would otherwise look like a second one. */
    function hasHistory() {
        try {
            for (var i = 0; i < localStorage.length; i++) {
                if (/^miniGolf\.(save|round|course|draw)\.v1/.test(localStorage.key(i))) return true;
            }
        } catch (e) { /* storage off: nobody has played here */ }
        return false;
    }

    /* Read the stored progress, or start it. Safe to call more than once:
       only the first call can make somebody a veteran. */
    function init() {
        if (state) return state;
        state = read();
        if (state) return state;
        state = blank();
        if (hasHistory()) {
            state.veteran = true;
            state.all = true;
            state.coached = true;
            OLD_LESSONS.forEach(function (k) { state.seen[k] = true; });
        }
        write();
        return state;
    }

    function get() { return state || init(); }

    // Forget everything held in memory; the next call reads storage afresh.
    // For the suite, which rewrites storage under the module's feet.
    function reload() { state = null; return init(); }

    /* ── stars ──────────────────────────────────────────────────────────── */

    // A draw holds no record, so it holds no stars either.
    function recorded() {
        return GOLF.COURSES.filter(function (c) { return c.record !== false; });
    }

    function starsOn(course) {
        if (course.record === false) return { got: 0, max: 0 };
        return S.courseStars(S.load(course.id), course.holes);
    }

    function totalStars() {
        var got = 0, max = 0;
        recorded().forEach(function (c) {
            var s = starsOn(c);
            got += s.got;
            max += s.max;
        });
        return { got: got, max: max };
    }

    /* ── unlocks ────────────────────────────────────────────────────────── */

    // The stars a course asks for, off the course's own card.
    function need(course) { return course && course.unlock > 0 ? course.unlock : 0; }

    /* `total` may be handed in by a caller pricing the whole rack at once,
       which saves reading every save file once per card. */
    function isOpen(course, total) {
        if (!course) return false;
        if (GOLF.PLAYTEST) return true;
        var st = get();
        if (!need(course) || st.all || st.granted[course.id]) return true;
        return (typeof total === 'number' ? total : totalStars().got) >= need(course);
    }

    function openIds(total) {
        var got = typeof total === 'number' ? total : totalStars().got;
        return GOLF.COURSES.filter(function (c) { return isOpen(c, got); })
            .map(function (c) { return c.id; });
    }

    /* The cheapest locked course, and how far off it is — the goal the title
       screen dangles. Null once everything is open. */
    function nextUnlock(total) {
        var got = typeof total === 'number' ? total : totalStars().got;
        var best = null;
        GOLF.COURSES.forEach(function (c) {
            if (isOpen(c, got)) return;
            if (!best || need(c) < need(best)) best = c;
        });
        return best ? { course: best, need: need(best), short: need(best) - got } : null;
    }

    /* Courses that opened between two readings of openIds. Each one is
       granted on the spot, so a door the stars opened stays open whatever
       happens to the thresholds afterwards. */
    function opened(before, total) {
        var now = openIds(total);
        var fresh = GOLF.COURSES.filter(function (c) {
            return now.indexOf(c.id) >= 0 && before.indexOf(c.id) < 0;
        });
        fresh.forEach(function (c) { grant(c.id); });
        return fresh;
    }

    function grant(id) {
        var st = get();
        if (st.granted[id]) return;
        st.granted[id] = true;
        write();
    }

    function unlockAll() {
        get().all = true;
        write();
    }

    function everythingOpen() {
        return GOLF.COURSES.every(function (c) { return isOpen(c); });
    }

    /* ── lessons ────────────────────────────────────────────────────────── */

    // What there is to be taught on this hole, in lesson order.
    function kindsOn(hole) {
        return LESSONS.filter(function (k) {
            if (k === 'gates') return (hole.walls || []).some(function (w) { return !!w.move; });
            return (hole[k] || []).length > 0;
        });
    }

    function unseen(hole) {
        var st = get();
        return kindsOn(hole).filter(function (k) { return !st.seen[k]; });
    }

    function markSeen(kind) {
        var st = get();
        if (st.seen[kind]) return;
        st.seen[kind] = true;
        write();
    }

    function coached() { return get().coached; }

    function markCoached() {
        var st = get();
        if (st.coached) return;
        st.coached = true;
        write();
    }

    /* The course a newcomer is pointed at: the one card that says it is the
       place to start, or the head of the rack if none does. */
    function starter() {
        for (var i = 0; i < GOLF.COURSES.length; i++) {
            if (GOLF.COURSES[i].starter) return GOLF.COURSES[i];
        }
        return GOLF.COURSES[0];
    }

    GOLF.progress = {
        LESSONS: LESSONS,
        init: init,
        get: get,
        reload: reload,
        starsOn: starsOn,
        totalStars: totalStars,
        need: need,
        isOpen: isOpen,
        openIds: openIds,
        nextUnlock: nextUnlock,
        opened: opened,
        grant: grant,
        unlockAll: unlockAll,
        everythingOpen: everythingOpen,
        kindsOn: kindsOn,
        unseen: unseen,
        markSeen: markSeen,
        coached: coached,
        markCoached: markCoached,
        starter: starter
    };

})(window.GOLF);
