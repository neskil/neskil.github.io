/* Game loop, input and the DOM chrome around the canvas.

   The split that matters: this file decides *when* a shot happens and what a
   score means, physics.js decides where the ball goes, render.js decides what
   it looks like. Nothing here integrates anything, so a stutter, a background
   tab or a slow phone can lose frames without ever changing an outcome. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;
    var P = GOLF.physics;
    var S = GOLF.scoring;
    var A = GOLF.audio;
    var R = GOLF.render;
    var PR = GOLF.progress;
    var SC = GOLF.scenery;

    var canvas, ctx, scale = 1;
    var state = null;
    var lastBounceAt = 0;
    var lastSandAt = 0;
    var lastRimAt = 0;
    // The board is drawn a quarter-turn round when the screen is taller than
    // it is wide. See resize().
    var turned = false;
    var shake = 0;
    // Backing-store pixels per world pixel, for the renderer's cached layers.
    var pixels = 1;

    /* ── helpers ────────────────────────────────────────────────────────── */

    function $(id) { return document.getElementById(id); }

    function courseById(id) {
        for (var i = 0; i < GOLF.COURSES.length; i++) {
            if (GOLF.COURSES[i].id === id) return GOLF.COURSES[i];
        }
        return null;
    }

    /* Asked once and kept: a query's `matches` stays live, and the motion
       one is read every frame. */
    var coarseQuery = window.matchMedia ? window.matchMedia('(pointer: coarse)') : null;
    var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    // A finger rather than a mouse: what the lessons and the title say about
    // how to play is worded for the hand that is holding the thing.
    function coarse() { return !!(coarseQuery && coarseQuery.matches); }

    function reducedMotion() { return !!(motionQuery && motionQuery.matches); }

    // Stars as text: filled for earned, hollow for the rest of the three.
    function starText(n) {
        return '\u2605\u2605\u2605'.slice(0, n) + '\u2606\u2606\u2606'.slice(0, 3 - n);
    }

    function toast(msg, kind) {
        var el = $('toast');
        el.textContent = msg;
        el.className = 'toast show' + (kind ? ' ' + kind : '');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { el.className = 'toast'; }, 2200);
    }

    /* ── which card is being played ──────────────────────────────────────

       Chosen once, on boot, and nowhere else: everything downstream goes on
       reading GOLF.COURSE and never learns there was a choice. A playtest
       has already replaced GOLF.COURSE with the single hole the editor
       handed over, so it opts out of all of this — the picker included,
       which would otherwise swap the course out from under a draft. */

    function bootCourse() {
        if (GOLF.PLAYTEST) return;
        var wanted = (/[?&]course=([\w-]+)/.exec(window.location.search) || [])[1];
        // ?course=random is the die by link: a shareable "surprise me" that
        // does not name a card, so it cannot go stale when the rack changes.
        if (wanted === 'random') {
            var id = randomCourseId();
            if (id) GOLF.selectCourse(id);
            return;
        }
        // A link that names a course is an invitation, and an invitation is
        // a key: whoever sent it wanted you on that card, stars or no stars.
        if (wanted) {
            if (GOLF.selectCourse(wanted)) PR.grant(wanted);
            return;
        }
        try { wanted = localStorage.getItem(C.COURSE_KEY); } catch (e) { /* storage off */ }
        // selectCourse answers null for an id that is not on the rack, which
        // is the whole handling it needs: stay on the default.
        var course = wanted && courseById(wanted);
        if (course && PR.isOpen(course)) { GOLF.selectCourse(wanted); return; }
        /* Nowhere remembered. A veteran stays on the head of the rack, which
           is where the game always put them; a first visit is pointed at the
           card that says it is the place to start. */
        if (!PR.get().veteran) GOLF.selectCourse(PR.starter().id);
    }

    /* Whether this load was asked for something in particular. A link that
       names a course, a seed or a playtest has already answered the
       question the title screen asks, so it goes straight to the tee. */
    function deepLinked() {
        return GOLF.PLAYTEST || /[?&](course|seed|playtest)=/.test(window.location.search);
    }

    /* ── the draw ────────────────────────────────────────────────────────

       The procedural card. generator.js builds it and never touches the
       rack; this is the one place that puts one on. The seed comes from the
       URL, then from storage, then from a coin — so a link is reproducible,
       a refresh gives you back the course you were playing, and a first
       visit gets something nobody has seen. */

    function bootDraw() {
        if (GOLF.PLAYTEST || !GOLF.installDraw) return;
        var G = GOLF.generator;
        var wanted = (/[?&]seed=([\w-]+)/.exec(window.location.search) || [])[1];
        var seed = G.seedFrom(wanted);
        // Somebody shared a draw: like a course link, it opens what it names.
        if (seed !== null) PR.grant(G.DRAW_ID);
        if (seed === null) {
            try { seed = G.seedFrom(localStorage.getItem(C.DRAW_KEY)); } catch (e) { /* storage off */ }
        }
        if (seed === null) seed = G.randomSeed();
        rememberSeed(GOLF.installDraw(seed).seed);
    }

    function rememberSeed(seed) {
        try { localStorage.setItem(C.DRAW_KEY, GOLF.generator.seedLabel(seed)); } catch (e) { /* storage off */ }
    }

    /* Deal a fresh one. The round in progress under the old seed is not
       cleared and does not have to be: scoring.js will not hand a card
       written for one draw to another, so `newRound(true)` here starts
       clean of its own accord. */
    function newDraw() {
        if (GOLF.PLAYTEST || !GOLF.installDraw) return;
        var card = courseById(GOLF.generator.DRAW_ID);
        if (card && !PR.isOpen(card)) { lockedToast(card); return; }
        var course = GOLF.installDraw(GOLF.generator.randomSeed());
        rememberSeed(course.seed);
        if (!playCourse(course.id, null)) return;
        toast('New draw — seed ' + GOLF.generator.seedLabel(course.seed));
    }

    /* A draw is not a course you can hold a record on: no two of them are
       the same field, so a best round across them would measure which seeds
       were kind rather than who played well. The card says so itself, which
       keeps the rule with the course rather than in a list of ids here. */
    function isRecorded() {
        var course = currentCourse();
        // A party is everybody's round and so nobody's record — and a sitting
        // the caddie has played in is nobody's either. See startAuto.
        return !GOLF.PLAYTEST && !autoUsed && !(course && course.record === false) && !(state && state.party);
    }

    function currentCourse() {
        for (var i = 0; i < GOLF.COURSES.length; i++) {
            if (GOLF.COURSES[i].id === GOLF.COURSE_ID) return GOLF.COURSES[i];
        }
        return null;
    }

    function syncCourse() {
        var course = currentCourse();
        var tagline = document.querySelector('.tagline');
        if (tagline && course) tagline.textContent = course.name + ' — ' + course.blurb;
        // The letterbox round the board is the biome's too.
        $('stage').style.background = themeFor(course).backdrop;
    }

    /* ── scenery ────────────────────────────────────────────────────────

       Every course has a biome of its own, and that is how it is drawn —
       unless the player has picked one scenery for all of them, from the
       picker's Scenery row or with S. Only the look changes: the holes,
       the records and the stars are the course's whatever it is wearing. */
    var scenery = '';
    try { scenery = localStorage.getItem(C.SCENERY_KEY) || ''; } catch (e) { /* storage off */ }
    if (!SC.THEMES[scenery]) scenery = '';

    function themeFor(course) { return scenery ? SC.themeNamed(scenery) : SC.themeOf(course); }

    function setScenery(id, quiet) {
        scenery = SC.THEMES[id] ? id : '';
        try {
            if (scenery) localStorage.setItem(C.SCENERY_KEY, scenery);
            else localStorage.removeItem(C.SCENERY_KEY);
        } catch (e) { /* storage off */ }
        if (state && state.world) {
            state.theme = themeFor(currentCourse()).id;
            A.ambience(SC.themeNamed(state.theme).sound);
        }
        syncCourse();
        if ($('menu').classList.contains('show')) drawScenery();
        if (!quiet) toast(scenery ? 'Scenery: ' + SC.themeNamed(scenery).name + ', on every course' : 'Scenery: each course its own');
    }

    // S steps through them: each course's own, then every biome in turn.
    function nextScenery() {
        var all = [''].concat(SC.ORDER);
        setScenery(all[(all.indexOf(scenery) + 1) % all.length]);
    }

    // A thumbnail of a biome: its grass, its water and its walls.
    function swatch(theme) {
        var t = theme.turf, wall = GOLF.landscape.MATERIAL[theme.wall] || GOLF.landscape.MATERIAL.timber;
        return 'linear-gradient(135deg, hsl(' + t.h + ', ' + t.s + '%, ' + t.l + '%) 0 52%, ' +
            theme.water.top + ' 52% 76%, ' + wall.top + ' 76% 100%)';
    }

    function drawScenery() {
        var host = $('scenery-list');
        if (!host) return;
        host.innerHTML = '';
        var own = GOLF.COURSES.filter(function (c) { return c.theme; }).map(function (c) {
            var t = SC.themeNamed(c.theme).turf;
            return 'hsl(' + t.h + ', ' + t.s + '%, ' + t.l + '%)';
        });
        [''].concat(SC.ORDER).forEach(function (id) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'sc-pick';
            b.setAttribute('role', 'radio');
            b.setAttribute('aria-checked', id === scenery ? 'true' : 'false');
            b.dataset.theme = id;
            var chip = document.createElement('span');
            chip.className = 'sc-swatch';
            chip.style.background = id ? swatch(SC.THEMES[id]) : 'conic-gradient(' + own.join(', ') + ')';
            var name = document.createElement('span');
            name.textContent = id ? SC.THEMES[id].name : 'Each course\u2019s own';
            b.appendChild(chip);
            b.appendChild(name);
            b.addEventListener('click', function () { setScenery(id); });
            host.appendChild(b);
        });
    }

    /* Switching is not destructive and does not ask. The card for the course
       you are leaving was written when you holed out on it, and each course
       resumes from its own key, so coming back puts you on the tee of the
       hole you left — the same promise a refresh makes. Every route onto a
       course goes through here: the picker, the die, and the boot. */
    function playCourse(id, how, startAt) {
        var card = courseById(id);
        if (card && !PR.isOpen(card)) { lockedToast(card); return false; }
        var wasParty = !!(state && state.party);
        if (!GOLF.selectCourse(id)) return false;
        // Once started, a course is yours for good — see progress.js.
        PR.grant(id);
        closeTitle();
        // The picker asked the question this is the answer to, so it goes
        // away here rather than at each of the four buttons that can start a
        // course — the die and the re-deal are also reachable by key, with
        // the dialog open and nothing else to shut it.
        closeMenu();
        try { localStorage.setItem(C.COURSE_KEY, GOLF.COURSE_ID); } catch (e) { /* storage off */ }
        /* Naming a hole is asking to start there, which is a new round and
           not a resumed one — a card with the first six holes filled in and a
           player who teed off on the seventh is a total that means nothing.
           Naming only a course is the old promise: you get back the round you
           left. */
        var named = typeof startAt === 'number';
        newRound(!named, named ? startAt : 0);
        syncCourse();
        // A party left for a solo card is not thrown away: it is saved after
        // every turn, and the menu offers it back.
        if (wasParty) { toast('Party saved \u2014 resume it from the menu'); return true; }
        if (how) {
            // newRound has already toasted a resume; say both things at once
            // rather than letting one message wipe the other off the screen.
            var course = currentCourse();
            toast(how + ' — ' + (course ? course.name : id) +
                  (state.holeIndex > 0
                      ? (named ? ', from hole ' : ', resumed at hole ') + (state.holeIndex + 1)
                      : ''));
        }
        return true;
    }

    /* A rack you have to name a card from before you can play it is a menu.
       The die is the other way round: press it and something you did not
       choose comes up. It never deals the card already under you — a press
       that changed nothing would read as a broken button rather than as luck
       — so with one course on the rack there is nothing to deal. */
    function randomCourseId() {
        // Only what is open: a die that dealt a locked card would be a door
        // that slams in your face at random.
        var pool = GOLF.COURSES.filter(function (c) { return c.id !== GOLF.COURSE_ID && PR.isOpen(c); });
        if (!pool.length) return null;
        return pool[Math.floor(Math.random() * pool.length)].id;
    }

    // Answers whether it actually dealt one, so a caller that latches itself
    // against a second press does not stay latched on a press that did
    // nothing.
    function dealRandomCourse() {
        if (GOLF.PLAYTEST) return false;
        var id = randomCourseId();
        if (!id) { toast('Only one course open \u2014 earn stars to open more'); return false; }
        return playCourse(id, 'Random draw');
    }

    /* ── the course picker ───────────────────────────────────────────────

       What used to be a <select> naming four cards. A menu of names is the
       one control that can tell you nothing about what it is offering: how
       long a round is, what the field has on it, what you last went round it
       in, whether there is a round of yours already waiting on it — and it
       cannot offer a hole at all, only a course. So the choice is a dialog
       now, one card per course, and every hole on every card is a plan you
       can press.

       It is built fresh each time it opens rather than kept and shown. The
       records change as you play, the resume line changes every hole, and the
       draw is a different course every time it is re-rolled; a picker built
       once at boot would be wrong about all three by the second round. */

    // One press per opening. Loading a course is the longest thing a button on
    // this page starts, and on a phone that has not repainted yet the second
    // impatient tap lands on whichever card has slid under it.
    var menuTaking = false;

    function openMenu() {
        if (GOLF.PLAYTEST) return;
        menuTaking = false;
        // The picker is the menu's own second page; it does not stack on it.
        closeTitle();
        closeParty();
        cancelAim();
        drawCourses();
        drawScenery();
        $('menu').classList.add('show');
        var first = $('menu-list').querySelector('.cc-head');
        if (first) { try { first.focus(); } catch (e) { /* ignore */ } }
        drawPlans();
    }

    function closeMenu() { shut('menu'); }

    /* Take a dialog down, and take the focus out of it with it: a focused
       button inside a dialog nobody can see is where a keyboard or a screen
       reader would otherwise be left standing. */
    function shut(id) {
        var el = $(id);
        el.classList.remove('show');
        var f = document.activeElement;
        if (f && f !== document.body && el.contains(f)) { try { f.blur(); } catch (e) { /* ignore */ } }
    }

    /* Every way out of the picker goes through here, so the latch is set in
       one place rather than at each of the two kinds of button. */
    function takeCourse(id, hole) {
        if (menuTaking) return;
        menuTaking = true;
        playCourse(id, 'Course', hole);
    }

    /* What one card says about itself under the blurb: length, par, the
       record, and the round waiting on it if there is one. The record line is
       the reason `scoring.js` takes a course id — all five are priced at once
       and none of it may move `GOLF.COURSE_ID`, which is the pointer the ball
       is rolling on. */
    function courseMeta(course, open) {
        var bits = [course.holes.length + ' holes', 'par ' + GOLF.coursePar(course.holes)];
        if (course.record === false) {
            // A draw holds no record, and saying "best —" for ever reads as a
            // record nobody has managed rather than as a rule.
            bits.push('not recorded');
        } else {
            var rec = S.load(course.id);
            var st = S.courseStars(rec, course.holes);
            bits.push('\u2605 ' + st.got + '/' + st.max);
            bits.push('best ' + (rec.best === null
                ? '\u2014'
                : rec.best + ' (' + S.formatVsPar(rec.bestVsPar) + ')'));
        }
        if (!open) return bits.join(' \u00b7 ');
        var seed = typeof course.seed === 'number' ? course.seed : null;
        var carry = S.loadRound(course.holes, course.id, seed);
        if (carry) bits.push('resumes at hole ' + (carry.holeIndex + 1));
        return bits.join(' \u00b7 ');
    }

    /* Said wherever a locked card is pressed, so the answer to "why can't I"
       is always the same sentence: how many, and how many more. */
    function lockedToast(course) {
        var need = PR.need(course);
        var short = need - PR.totalStars().got;
        toast('\uD83D\uDD12 ' + course.name + ' opens at ' + need + ' \u2605 \u2014 ' +
              short + ' more to go', 'bad');
    }

    function drawCourses() {
        var host = $('menu-list');
        host.innerHTML = '';
        // Priced once for the whole rack: every card asks the same question.
        var total = PR.totalStars().got;

        GOLF.COURSES.forEach(function (course) {
            var here = course.id === GOLF.COURSE_ID;
            var open = PR.isOpen(course, total);
            var save = course.record === false ? null : S.load(course.id);
            // Open from the start on a wide screen, where a strip of plans has
            // never crowded anything out. On a phone only the card you are
            // standing on starts open.
            var opened = !document.body.classList.contains('compact-ui') || here;
            var stripId = 'cc-holes-' + course.id;
            var card = document.createElement('div');
            card.className = 'course-card' + (here ? ' playing' : '') +
                (opened ? ' expanded' : '') + (open ? '' : ' locked');

            var topRow = document.createElement('div');
            topRow.className = 'cc-top';

            // The head is the whole card except the plans: pressing it starts
            // this course the way choosing it from the old menu did, which is
            // to say from wherever you left it.
            var head = document.createElement('button');
            head.type = 'button';
            head.className = 'cc-head';
            /* A locked card still shows everything — the plans, the par, the
               blurb. What is coming is the reason to keep going, and a grey
               box that says "locked" gives nobody a reason. */
            var badge = here ? '<span class="cc-here">playing</span>'
                : !open ? '<span class="cc-lock">\uD83D\uDD12 ' + PR.need(course) + ' \u2605</span>'
                : course.starter && total === 0 && !PR.get().veteran ? '<span class="cc-here">start here</span>'
                : '';
            head.innerHTML =
                '<span class="cc-name">' + course.name + badge + '</span>' +
                '<span class="cc-blurb">' + course.blurb + '</span>' +
                '<span class="cc-meta">' + courseMeta(course, open) +
                (open ? '' : ' \u00b7 opens at ' + PR.need(course) + ' \u2605, ' +
                    (PR.need(course) - total) + ' to go') + '</span>';
            head.addEventListener('click', function () {
                if (!open) { lockedToast(course); return; }
                takeCourse(course.id);
            });
            topRow.appendChild(head);

            /* Only the strip folds, and only on a compact screen. Fifty-one
               plans stacked flat is four screens of scrolling on a phone
               before you have reached the last card; folded, the whole rack
               is one. The head stays a full-width button either way, so a
               folded card still costs one tap to start. */
            var toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'cc-toggle';
            toggle.setAttribute('aria-controls', stripId);
            toggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
            toggle.setAttribute('aria-label', 'Hole plans for ' + course.name);
            toggle.title = 'Show hole plans';
            toggle.textContent = '⌄';
            toggle.addEventListener('click', function () {
                var open = card.classList.toggle('expanded');
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
                // The plans in a strip that was folded when the dialog opened
                // were skipped for having no laid-out box; now there is one.
                if (open) drawPlans(card);
            });
            topRow.appendChild(toggle);

            /* The draw is the one card on the rack that can be replaced rather
               than merely chosen, so it is the one card that carries a second
               button. It sits on the card it re-rolls instead of in the bar,
               where "New draw" was a chip nobody could place until they had
               pressed it once. */
            if (GOLF.installDraw && course.id === GOLF.generator.DRAW_ID) {
                var again = document.createElement('button');
                again.type = 'button';
                again.className = 'cc-redraw';
                again.title = 'Deal nine holes nobody has played (G)';
                again.innerHTML = '\u2726<span> Re-deal</span>';
                again.disabled = !open;
                again.addEventListener('click', function () {
                    if (menuTaking) return;
                    menuTaking = true;
                    newDraw();
                });
                topRow.appendChild(again);
            }
            card.appendChild(topRow);

            var strip = document.createElement('div');
            strip.className = 'cc-holes';
            strip.id = stripId;
            course.holes.forEach(function (hole, i) {
                var cell = document.createElement('button');
                cell.type = 'button';
                cell.className = 'cc-hole';
                var got = save ? S.stars(save.holes[i], hole.par) : 0;
                cell.title = hole.name + ' \u2014 par ' + hole.par +
                    (save && typeof save.holes[i] === 'number' ? ' \u2014 best ' + save.holes[i] : '');
                cell.disabled = !open;
                // Read back by the plan pass rather than counted out of the
                // DOM, so the order above is free to change.
                cell.setAttribute('data-course', course.id);
                cell.setAttribute('data-hole', i);
                /* The stars a hole has given you, on its own plan — the level
                   select every game with stars has, and the reason to go back
                   to the hole you bogeyed rather than on to the next card. */
                cell.innerHTML =
                    '<canvas class="cc-map" aria-hidden="true"></canvas>' +
                    (save ? '<span class="cc-stars' + (got ? '' : ' none') + '" aria-label="' + got +
                        ' of 3 stars">' + starText(got) + '</span>' : '') +
                    '<span class="cc-num">' + (i + 1) + '</span>' +
                    '<span class="cc-par">' + hole.par + '</span>';
                cell.addEventListener('click', function () { takeCourse(course.id, i); });
                strip.appendChild(cell);
            });
            card.appendChild(strip);
            host.appendChild(card);
        });

        /* The way past the ladder, for whoever came to look rather than to
           climb. Two presses, because it cannot be taken back and one stray
           tap on a phone should not spend somebody's progression for them. */
        var foot = $('menu-unlock');
        foot.hidden = PR.everythingOpen();
        foot.classList.remove('armed');
        foot.textContent = 'Open every course';
        host.scrollTop = 0;
    }

    function unlockEverything() {
        var foot = $('menu-unlock');
        if (!foot.classList.contains('armed')) {
            foot.classList.add('armed');
            foot.textContent = 'Press again to open them all \u2014 stars still count';
            return;
        }
        PR.unlockAll();
        drawCourses();
        drawPlans();
        toast('Every course is open');
    }

    /* Draw the plans in `root`, or in the whole list. plan.js caches what it
       draws, so a second opening of the picker pays for none of it and a card
       unfolded twice is drawn once.

       On the first opening this is put off a frame: the dialog has just been
       filled with fifty-one canvases, and rasterising them all before the
       browser has painted anything is the difference between a picker that
       opens and a picker that hesitates. Unfolding one card is not that —
       nine plans at most, wanted the instant the strip is open — so that
       path draws where it stands. */
    function drawPlans(root) {
        if (!GOLF.plan) return;
        var draw = function () {
            var cells = (root || $('menu-list')).querySelectorAll('.cc-hole');
            for (var k = 0; k < cells.length; k++) {
                // A folded strip lays nothing out. Drawing into it would cache
                // a plan one pixel wide under the size the strip will have.
                if (!cells[k].clientWidth) continue;
                var id = cells[k].getAttribute('data-course');
                var course = null;
                for (var j = 0; j < GOLF.COURSES.length; j++) {
                    if (GOLF.COURSES[j].id === id) { course = GOLF.COURSES[j]; break; }
                }
                GOLF.plan.into(cells[k].querySelector('.cc-map'), id,
                    parseInt(cells[k].getAttribute('data-hole'), 10),
                    course && typeof course.seed === 'number' ? course.seed : null);
            }
        };
        if (root) draw(); else requestAnimationFrame(draw);
    }

    function bindCoursePicker() {
        // A playtest is one hole handed over by the editor. There is no rack
        // to pick from and no round to swap out from under a draft.
        if (GOLF.PLAYTEST) {
            $('btn-courses').hidden = true;
            return;
        }
        $('btn-courses').addEventListener('click', openMenu);
        $('menu-close').addEventListener('click', closeMenu);
        $('menu-unlock').addEventListener('click', unlockEverything);
        $('menu-shuffle').addEventListener('click', function () {
            if (menuTaking) return;
            menuTaking = dealRandomCourse();
        });
        $('menu').addEventListener('click', function (e) {
            if (e.target === $('menu')) closeMenu();
        });
    }

    /* ── the ☰ panel ─────────────────────────────────────────────────────

       Compact chrome: a phone, a coarse pointer, or fullscreen on anything.
       Four of the five chips fold behind ☰ and fullscreen stays out, because
       it is the one you reach for with a shot half aimed. Off a compact
       screen the panel is `display: contents` and the chips are simply the row
       they always were — nothing here has to be undone. */

    var compactQuery = null;

    function syncCompact() {
        if (!compactQuery && window.matchMedia) {
            compactQuery = window.matchMedia(
                '(max-width: 760px), (max-height: 560px), (pointer: coarse)');
        }
        var on = (compactQuery ? compactQuery.matches : false) || !!fullscreenEl();
        document.body.classList.toggle('compact-ui', on);
        if (!on) closeTopMenu();
    }

    function closeTopMenu() {
        $('topbar-menu').classList.remove('open');
        $('btn-menu').classList.remove('on');
        $('btn-menu').setAttribute('aria-expanded', 'false');
    }

    function toggleTopMenu() {
        var el = $('topbar-menu');
        var open = !el.classList.contains('open');
        el.classList.toggle('open', open);
        $('btn-menu').classList.toggle('on', open);
        $('btn-menu').setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function bindTopMenu() {
        $('btn-menu').addEventListener('click', toggleTopMenu);
        // Anything pressed inside the panel has answered the question the
        // panel was asking, so the panel goes away with it.
        $('topbar-menu').addEventListener('click', closeTopMenu);
        document.addEventListener('pointerdown', function (e) {
            if (!$('topbar-menu').classList.contains('open')) return;
            if ($('topbar-menu').contains(e.target) || $('btn-menu').contains(e.target)) return;
            closeTopMenu();
        });
        syncCompact();
    }

    /* ── round state ────────────────────────────────────────────────────── */

    /* A playtest is the editor handing over a single hole. It is not a round:
       it must neither resume the one you have going nor overwrite it, so every
       call into the round store goes through these two and stops here. A
       party keeps a round of its own (see saveParty) and stays out of the
       solo one for the same reason. */
    function storeRound(i) {
        if (!GOLF.PLAYTEST && !autoUsed && !state.party) S.saveRound(i, state.scores, GOLF.COURSE);
    }

    /* Autoplay keeps out of both, for the playtest's reason: a round the
       caddie has had a hand in is not one to hand back on a refresh, and a
       course it walks onto must not throw away the round you left there. */
    function clearStoredRound() {
        if (!GOLF.PLAYTEST && !autoUsed) S.clearRound();
    }

    function blankState() {
        return {
            holeIndex: 0,
            strokes: 0,
            scores: [],
            world: null,
            aim: { active: false, angle: 0, power: 0, keyboard: false, origin: null },
            trail: [],
            save: S.load(),
            phase: 'aim',          // aim | rolling | holed | finished
            lastFrac: null,        // weight of the last shot on this hole, 0..1
            splashAt: 0,
            party: null,           // see startParty
            ballColor: C.PLAYER_COLORS[0],
            coach: false,          // the first-shot ghost, see render.drawCoach
            shot: null,            // what the shot in flight has done, for the call-outs
            lipping: false,
            turned: turned,
            res: pixels
        };
    }

    /* `resume` is true on boot and on any switch that did not name a hole.
       Every other caller — the Play again button, a plan pressed in the
       picker — means a new round and says so; `startAt` is where that new
       round tees off, which is the first hole unless a plan named another. */
    function newRound(resume, startAt) {
        var carry = (resume && !GOLF.PLAYTEST) ? S.loadRound(GOLF.COURSE) : null;
        if (!carry) clearStoredRound();
        state = blankState();
        if (carry) state.scores = carry.scores;
        var at = Math.max(0, Math.min(GOLF.COURSE.length - 1, startAt || 0));
        loadHole(carry ? carry.holeIndex : at);
        closeCard();
        syncHud();
        if (carry) {
            toast('Round resumed at hole ' + (carry.holeIndex + 1));
        }
    }

    function loadHole(i) {
        var hole = GOLF.COURSE[i];
        /* A new tee is a new walk for the caddie: whatever it was in the
           middle of was planned for a hole that is not there any more, and
           Autoplay starts it again on this one next frame. */
        stopSim(null);
        if (auto) { auto.playing = false; auto.wait = 0; }
        state.holeIndex = i;
        state.strokes = 0;
        state.world = P.createWorld(hole, hole.tee, 0);
        state.trail = [];
        state.aim.active = false;
        state.aim.power = 0;
        state.aim.keyboard = false;
        state.aim.origin = null;
        state.aim.angle = Math.atan2(hole.hole.y - hole.tee.y, hole.hole.x - hole.tee.x);
        state.lastFrac = null;
        state.phase = 'aim';
        state.shot = null;
        state.lipping = false;
        if (state.party) {
            var who = state.party.players[state.party.order[state.party.pos]];
            state.ballColor = who.color;
        }
        // Which biome to dress it in, and the key its painted layers are
        // cached under: a different hole, card or draw is a different picture.
        state.theme = themeFor(currentCourse()).id;
        A.ambience(SC.themeNamed(state.theme).sound);
        state.sceneKey = (GOLF.PLAYTEST ? 'playtest' : GOLF.COURSE_ID) + '/' +
            (typeof GOLF.COURSE_SEED === 'number' ? GOLF.COURSE_SEED : '-') + '/' + i;
        R.effects.clear();
        $('banner').classList.remove('show');
        storeRound(i);
        // The ghost stroke is for somebody who has never taken one, and the
        // editor's playtest is by definition somebody who has.
        state.coach = !GOLF.PLAYTEST && !auto && !PR.coached();
        // The lessons are for the player, and are spent by being shown; a
        // caddie walking past a hazard has not taught anybody anything.
        if (auto) hideLessons(); else showLessons(hole);
        syncHud();
    }

    function syncHud() {
        var hole = GOLF.COURSE[state.holeIndex];
        $('hole-num').textContent = (state.holeIndex + 1) + ' / ' + GOLF.COURSE.length;
        $('hole-name').textContent = hole.name;
        $('hole-blurb').textContent = hole.blurb;
        $('hole-par').textContent = hole.par;
        $('hole-strokes').textContent = state.strokes;
        // The allowance, always on show: a rule you find out about by
        // running into it reads as the game cheating.
        $('hole-limit').textContent = '/' + S.strokeLimit(hole.par);

        // Your best here, in stars — the thing this hole can still give you.
        var stars = $('hole-stars');
        if (isRecorded()) {
            var mine = state.save.holes[state.holeIndex];
            var got = S.stars(mine, hole.par);
            stars.textContent = starText(got);
            stars.className = 'stat-stars' + (got ? '' : ' none');
            stars.setAttribute('aria-label', typeof mine === 'number'
                ? 'Your best here: ' + mine + ', ' + got + ' of 3 stars' : 'Not yet played');
            stars.title = typeof mine === 'number' ? 'Your best here: ' + mine : 'Not yet played';
        } else {
            stars.textContent = '';
            stars.title = '';
        }

        var t = S.totals(state.scores, GOLF.COURSE);
        $('total-strokes').textContent = t.strokes;
        var vs = $('total-vspar');
        vs.textContent = t.played ? S.formatVsPar(t.vsPar) : '—';
        vs.className = 'stat-value ' + (t.played === 0 ? '' : t.vsPar < 0 ? 'under' : t.vsPar > 0 ? 'over' : 'level');

        var best = $('best-round');
        best.textContent = state.save.best === null
            ? '—'
            : state.save.best + ' (' + S.formatVsPar(state.save.bestVsPar) + ')';
        syncParty();
    }

    /* ── lessons ────────────────────────────────────────────────────────

       The legend under the board says what every hazard does, and nobody
       reads a legend before they have a reason to. So each one is also said
       once, on the first tee where it is in play, in the corner of the board
       — and the stroke itself is shown on the very first tee of all, by the
       ghost in render.drawCoach and a line here that says it in words. The
       card never takes a press and never covers the ball's side of the
       field for long: it goes with the first shot, or by itself. */
    var LESSONS = {
        rough:   ['sw-rough', 'Rough', 'halves the roll.'],
        sand:    ['sw-sand', 'Bunker', 'all but stops the ball. Hit out firmly.'],
        water:   ['sw-water', 'Water', 'costs a stroke and a replay — unless you hit it hard enough to skip across.'],
        ice:     ['sw-ice', 'Ice', 'triples the roll. Go softer.'],
        gates:   ['sw-move', 'Gate', 'will not wait for you. Time the gap.'],
        bumpers: ['sw-bump', 'Bumper', 'livelier than a wall — it picks a new line.'],
        slopes:  ['sw-slope', 'Slope', 'arrows point downhill. Aim above the cup.'],
        tunnels: ['sw-tunnel', 'Tunnel', 'out of the mouth the same colour, same speed, same line.']
    };

    /* The card goes wherever on the *screen* is furthest from both the ball
       and the cup: a corner if one is clear, otherwise the middle of an edge,
       which on a turned phone board is the side of the field halfway up the
       hole. A fixed corner was always over one of the two on some hole — and
       on a turned board the top-left corner is the cup's end of nearly every
       one. A corner gets a little credit, because it covers less field. */
    var SPOTS = {
        tl: [0, 0], tc: [0.5, 0], tr: [1, 0], ml: [0, 0.5],
        mr: [1, 0.5], bl: [0, 1], bc: [0.5, 1], br: [1, 1]
    };

    function placeLessons(hole) {
        var best = 'tl', far = -Infinity;
        Object.keys(SPOTS).forEach(function (k) {
            var fx = SPOTS[k][0], fy = SPOTS[k][1];
            // The world point under that spot on the screen (see toWorld).
            var wx = turned ? (1 - fy) * C.WORLD_W : fx * C.WORLD_W;
            var wy = turned ? fx * C.WORLD_H : fy * C.WORLD_H;
            var d = Math.min(Math.hypot(wx - hole.tee.x, wy - hole.tee.y),
                             Math.hypot(wx - hole.hole.x, wy - hole.hole.y));
            if (fx !== 0.5 && fy !== 0.5) d += 60;
            if (d > far + 1) { far = d; best = k; }
        });
        var el = $('tip');
        el.className = 'tip at-' + best + (el.classList.contains('show') ? ' show' : '');
    }

    function showLessons(hole) {
        var items = [];
        if (state.coach) {
            items.push(['sw-ball', 'Your shot:', coarse()
                ? 'drag back from anywhere, away from the flag, and let go.'
                : 'drag back and let go — or ← → aim, ↑ ↓ power, Space hits.']);
        }
        // Two at most, and one beside the stroke: a first tee that explains
        // five things has explained none of them.
        var fresh = PR.unseen(hole).slice(0, state.coach ? 1 : 2);
        fresh.forEach(function (k) {
            items.push(LESSONS[k]);
            PR.markSeen(k);
        });
        var el = $('tip');
        clearTimeout(showLessons._t);
        el.classList.remove('show');
        placeLessons(hole);
        if (!items.length) return;
        el.innerHTML = items.map(function (it) {
            return '<div class="tip-item"><i class="' + it[0] + '"></i><span><b>' + it[1] +
                '</b> ' + it[2] + '</span></div>';
        }).join('');
        el.classList.add('show');
        // The stroke lesson waits for the stroke; a hazard note does not.
        if (!state.coach) showLessons._t = setTimeout(hideLessons, 9000);
    }

    function hideLessons() {
        clearTimeout(showLessons._t);
        $('tip').classList.remove('show');
    }

    /* ── shots ──────────────────────────────────────────────────────────── */

    function takeShot() {
        if (state.phase !== 'aim') return;
        var a = state.aim;
        var power = a.power;
        if (power < C.MIN_POWER) return;

        /* The overswing. Past SAFE_POWER the ball leaves on a line of its own
           choosing, within the cone the aim drawing has been showing all along.
           The luck is drawn here rather than inside physics.js, which stays a
           pure function of its arguments; the ball is then simply launched
           along the angle that came out, so nothing downstream — the
           integrator, the tests, the bot — has to know a die was rolled. */
        var fired = a.angle + P.scatter(power, Math.random());
        if (!P.launch(state.world, fired, power)) return;

        state.strokes++;
        state.phase = 'rolling';
        state.lastFrac = power / C.MAX_POWER;
        state.trail = [];
        // What this shot does on its way, for the call-out if it drops.
        state.shot = { from: { x: state.world.ball.x, y: state.world.ball.y }, banks: 0, posts: 0, tunnels: 0, skips: 0, lipped: false };
        state.lipping = false;
        a.active = false;
        a.power = 0;
        a.origin = null;
        if (state.coach) {
            state.coach = false;
            // The caddie's first stroke is not the player's.
            if (!sim) PR.markCoached();
        }
        hideLessons();
        var frac = power / C.MAX_POWER, hot = power > C.SAFE_POWER;
        A.putt(frac);
        // Divot: whatever the ball is standing on sprays backwards, more of
        // it the harder the swing.
        var bx = state.world.ball.x, by = state.world.ball.y;
        var inSand = P.zoneAt(state.world.course.sand, bx, by);
        (inSand ? R.effects.sand : R.effects.turf)(bx, by, fired + Math.PI, frac);
        R.effects.strike(bx, by, fired, frac, hot);
        // The overswing kicks a little in the hand.
        if (hot) {
            shake = Math.max(shake, 0.2 + 0.3 * (power - C.SAFE_POWER) / (C.MAX_POWER - C.SAFE_POWER));
            A.buzz(12);
        }
        syncHud();
    }

    // Out of strokes? Asked whenever a shot has finished without dropping.
    function outOfStrokes() {
        return state.strokes >= S.strokeLimit(GOLF.COURSE[state.holeIndex].par);
    }

    function penaltyReset() {
        state.strokes += C.WATER_PENALTY;
        var w = state.world;
        var o = w.origin;
        w.ball.x = o.x;
        w.ball.y = o.y;
        w.ball.vx = w.ball.vy = 0;
        w.splash = false;
        w.moving = false;
        w.air = w.airMax = 0;
        state.trail = [];
        state.phase = 'aim';
        syncHud();
        if (outOfStrokes()) { holeComplete(true); return; }
        toast('Water hazard — one stroke penalty', 'bad');
        warnLastStroke();
    }

    function warnLastStroke() {
        if (state.strokes === S.strokeLimit(GOLF.COURSE[state.holeIndex].par) - 1) {
            toast('Last stroke — miss and you pick up', 'bad');
        }
    }

    /* What the drop was made of, said under the score. Only the notable
       things, and at most two: a bank shot through a tunnel is a story, a
       list of five adjectives is a receipt. */
    function callout(hole) {
        var s = state.shot;
        if (!s) return '';
        var bits = [];
        if (s.skips) bits.push(s.skips > 1 ? s.skips + ' skips across the water' : 'skipped across');
        if (s.tunnels) bits.push(s.tunnels > 1 ? 'through ' + s.tunnels + ' tunnels' : 'through the tunnel');
        if (s.posts >= 3) bits.push('pinball wizard');
        else if (s.posts) bits.push('off the post');
        if (s.banks >= 3) bits.push(s.banks + '-cushion bank');
        else if (s.banks === 2) bits.push('two-cushion bank');
        else if (s.banks === 1) bits.push('bank shot');
        if (Math.hypot(hole.hole.x - s.from.x, hole.hole.y - s.from.y) > 460) bits.push('from downtown');
        if (!bits.length) return '';
        var line = bits.slice(0, 2).join(', ');
        return line.charAt(0).toUpperCase() + line.slice(1) + '!';
    }

    /* `pickedUp` is the allowance running out: the ball never dropped, and
       the card is written with one more than the limit. Everything else about
       the end of a hole is the same either way, which is the point — a
       pick-up is a score, not a failure state. */
    function holeComplete(pickedUp) {
        var hole = GOLF.COURSE[state.holeIndex];
        if (pickedUp) state.strokes = S.pickupScore(hole.par);
        state.scores[state.holeIndex] = state.strokes;
        state.phase = 'holed';
        hideLessons();

        var term = S.term(state.strokes, hole.par);
        if (pickedUp) {
            A.pickup();
        } else {
            R.effects.sink(hole.hole.x, hole.hole.y);
            if (term.kind === 'ace') {
                A.ace();
                A.buzz([30, 50, 30, 50, 90]);
                R.effects.confetti(C.WORLD_W, C.WORLD_H);
            } else {
                A.sink();
                A.buzz(25);
                if (term.kind === 'great' || term.kind === 'good') R.effects.confetti(C.WORLD_W, C.WORLD_H);
            }
        }

        /* Stars, and the doors they open. Folded into the save on the spot
           rather than at the end of the round, so a hole played from a plan
           in the picker counts and closing the tab after a birdie keeps it. */
        var starsLine = '', note = '';
        if (isRecorded()) {
            var before = PR.openIds();
            var rec = S.recordHole(state.save, state.holeIndex, state.strokes);
            state.save = S.save(rec.save);
            var got = S.stars(state.strokes, hole.par);
            var had = S.stars(rec.before, hole.par);
            starsLine = '<span class="bs-stars" aria-label="' + got + ' of 3 stars">' + starText(got) + '</span>';
            if (rec.before !== null && rec.improved) {
                starsLine += '<span class="bs-best">new best — was ' + rec.before + '</span>';
            } else if (rec.before !== null && !rec.improved && had > got) {
                starsLine += '<span class="bs-was">your best here: ' + rec.before + '</span>';
            }
            if (got > had) {
                A.stars(got - had);
                R.effects.stars(hole.hole.x, hole.hole.y);
            }
            var fresh = PR.opened(before);
            if (fresh.length) {
                note = '🔓 ' + fresh.map(function (c) { return c.name; }).join(' and ') +
                    (fresh.length > 1 ? ' are' : ' is') + ' now open';
                A.unlock();
                A.buzz([20, 40, 20, 40, 60]);
            }
        }

        var detail = state.strokes + ' stroke' + (state.strokes === 1 ? '' : 's') + ' · par ' + hole.par;
        if (pickedUp) detail = 'Out of strokes — that goes down as ' + state.strokes + ' · par ' + hole.par;
        var said = pickedUp ? '' : callout(hole);
        if (said) detail += ' · ' + said;

        var last = state.holeIndex === GOLF.COURSE.length - 1;
        var next = 'Next hole →';
        if (state.party) {
            var who = currentPlayer();
            detail = who.name + ' · ' + detail;
            var turn = nextTurn();
            if (!turn) {
                next = 'See scorecard';
            } else if (turn.holeIndex === state.holeIndex) {
                next = state.party.players[turn.order[turn.pos]].name + '’s turn →';
            }
            // The last putt of a hole shows the whole group's scores on it.
            if (!turn || turn.holeIndex !== state.holeIndex) note = holeBoard(state.holeIndex);
            saveParty(turn);
        } else {
            if (last) next = 'See scorecard';
            // Written now rather than on the next tee, so closing the tab on the
            // banner keeps the hole you just finished.
            if (!last) storeRound(state.holeIndex + 1);
        }

        $('banner-term').textContent = term.label;
        $('banner-term').className = 'banner-term ' + term.kind;
        $('banner-detail').textContent = detail;
        $('banner-stars').innerHTML = starsLine;
        $('banner-note').innerHTML = note;
        // A door opening is the biggest thing a hole can do, and looks it.
        $('banner-note').className = 'banner-note' + (/now open/.test(note) ? ' unlock' : '');
        $('banner-next').textContent = next;
        $('banner').classList.add('show');
        syncHud();
        // Keyboard players get the button under their hand, so Enter goes on.
        if (!coarse()) { try { $('banner-next').focus({ preventScroll: true }); } catch (e) { /* old engines */ } }
    }

    function advanceHole() {
        if (state.phase !== 'holed') return;
        if (state.party) {
            var turn = nextTurn();
            if (!turn) { finishRound(); return; }
            state.party.order = turn.order;
            state.party.pos = turn.pos;
            state.scores = state.party.cards[turn.order[turn.pos]];
            loadHole(turn.holeIndex);
            toast(currentPlayer().name + ' — your shot');
            return;
        }
        if (state.holeIndex === GOLF.COURSE.length - 1) {
            finishRound();
        } else {
            loadHole(state.holeIndex + 1);
        }
    }

    function finishRound() {
        /* A playtest is one hole handed over by the editor, and a one-hole
           "round" of three strokes would walk straight into the best-round
           record. So it is scored and shown, and never written down. */
        var res;
        if (state.party) {
            clearParty();
            state.phase = 'finished';
            $('banner').classList.remove('show');
            openPartyCard(true);
            R.effects.confetti(C.WORLD_W, C.WORLD_H);
            syncHud();
            return;
        }
        if (!GOLF.PLAYTEST) clearStoredRound();
        if (isRecorded()) {
            res = S.recordRound(state.save, state.scores, GOLF.COURSE);
            state.save = S.save(res.save);
        } else {
            res = { save: state.save, isBest: false, totals: S.totals(state.scores, GOLF.COURSE) };
        }
        state.phase = 'finished';
        $('banner').classList.remove('show');
        openCard(res);
        if (res.isBest) R.effects.confetti(C.WORLD_W, C.WORLD_H);
        syncHud();
    }

    /* ── the party ──────────────────────────────────────────────────────

       Pass-and-play for two to four. The rule is the one most mini golf is
       played by: everybody plays the hole out in turn, from the tee, and the
       best score on a hole has the honour on the next — ties keep the order
       they had. Only one ball is ever on the field, so nothing about the
       simulation has to know there is more than one player; a party is a
       running order and one card per name, and `state.scores` is simply
       pointed at whichever card is up. */

    function currentPlayer() {
        var p = state.party;
        return p.players[p.order[p.pos]];
    }

    /* Where the party goes after the turn just played: the next name on this
       hole, or the first tee of the next one with the honour re-sorted.
       Null when that was the last putt of the round. */
    function nextTurn() {
        var p = state.party;
        if (p.pos + 1 < p.order.length) {
            return { holeIndex: state.holeIndex, order: p.order, pos: p.pos + 1 };
        }
        if (state.holeIndex === GOLF.COURSE.length - 1) return null;
        var h = state.holeIndex;
        var order = p.order.slice().sort(function (a, b) {
            var d = p.cards[a][h] - p.cards[b][h];
            return d !== 0 ? d : p.order.indexOf(a) - p.order.indexOf(b);
        });
        return { holeIndex: h + 1, order: order, pos: 0 };
    }

    function holeBoard(h) {
        var p = state.party;
        return p.order.map(function (i) {
            var pl = p.players[i];
            return '<span class="hb"><i style="background:' + pl.color + '"></i>' + esc(pl.name) +
                ' <b>' + p.cards[i][h] + '</b></span>';
        }).join('');
    }

    function esc(text) {
        return String(text).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function syncParty() {
        var el = $('party-strip');
        if (!state.party) {
            if (!el.hidden) { el.hidden = true; el.innerHTML = ''; requestAnimationFrame(resize); }
            return;
        }
        var p = state.party;
        var wasHidden = el.hidden;
        el.hidden = false;
        el.innerHTML = p.order.map(function (i, k) {
            var pl = p.players[i];
            var t = S.totals(p.cards[i], GOLF.COURSE);
            var up = k === p.pos && state.phase !== 'finished';
            return '<span class="ps' + (up ? ' up' : '') + (k < p.pos ? ' done' : '') + '">' +
                '<i style="background:' + pl.color + '"></i><span class="ps-name">' + esc(pl.name) + '</span>' +
                '<b>' + (t.played ? S.formatVsPar(t.vsPar) : 'E') + '</b></span>';
        }).join('');
        if (wasHidden) requestAnimationFrame(resize);
    }

    /* A party is saved after every turn under its own key, so a refresh, a
       locked phone or a quick solo hole in between costs nobody their round.
       Like the solo round, what comes back is the tee of the turn that was
       next — never a ball in mid-field. */
    function saveParty(turn) {
        if (GOLF.PLAYTEST || !state.party) return;
        if (turn === null) { clearParty(); return; }
        var t = turn || { holeIndex: state.holeIndex, order: state.party.order, pos: state.party.pos };
        try {
            localStorage.setItem(C.PARTY_KEY, JSON.stringify({
                course: GOLF.COURSE_ID,
                seed: typeof GOLF.COURSE_SEED === 'number' ? GOLF.COURSE_SEED : null,
                holes: GOLF.COURSE.length,
                players: state.party.players,
                cards: state.party.cards,
                holeIndex: t.holeIndex,
                order: t.order,
                pos: t.pos
            }));
        } catch (e) { /* storage off */ }
    }

    function clearParty() {
        try { localStorage.removeItem(C.PARTY_KEY); } catch (e) { /* storage off */ }
    }

    // A stored party, or null for anything that would not make sense to
    // resume: a course that is gone or has changed length, a draw since
    // re-dealt, or a roster or running order that does not add up.
    function loadParty() {
        try {
            var d = JSON.parse(localStorage.getItem(C.PARTY_KEY) || 'null');
            if (!d || !Array.isArray(d.players) || !Array.isArray(d.cards) || !Array.isArray(d.order)) return null;
            var course = courseById(d.course);
            if (!course || course.holes.length !== d.holes) return null;
            var seed = typeof course.seed === 'number' ? course.seed : null;
            if ((typeof d.seed === 'number' ? d.seed : null) !== seed) return null;
            var n = d.players.length;
            if (n < 2 || n > C.MAX_PLAYERS || d.cards.length !== n || d.order.length !== n) return null;
            if (!(d.holeIndex >= 0 && d.holeIndex < d.holes) || !(d.pos >= 0 && d.pos < n)) return null;
            var seen = {};
            for (var i = 0; i < n; i++) {
                if (!(d.order[i] >= 0 && d.order[i] < n) || seen[d.order[i]]) return null;
                seen[d.order[i]] = true;
                if (!d.players[i] || typeof d.players[i].name !== 'string') return null;
                d.players[i].color = C.PLAYER_COLORS[i];
                if (!Array.isArray(d.cards[i])) return null;
            }
            return d;
        } catch (e) {
            return null;
        }
    }

    function beginParty(courseId, players, cards, holeIndex, order, pos) {
        if (!GOLF.selectCourse(courseId)) return false;
        // A party plays its own shots.
        stopAuto(null);
        PR.grant(courseId);
        try { localStorage.setItem(C.COURSE_KEY, GOLF.COURSE_ID); } catch (e) { /* storage off */ }
        closeTitle();
        closeMenu();
        closeParty();
        closeCard();
        state = blankState();
        state.party = { players: players, cards: cards, order: order, pos: pos };
        state.scores = cards[order[pos]];
        loadHole(holeIndex);
        syncCourse();
        saveParty();
        return true;
    }

    function startParty(courseId, names) {
        var players = names.map(function (name, i) {
            return { name: name, color: C.PLAYER_COLORS[i] };
        });
        var order = players.map(function (p, i) { return i; });
        var cards = players.map(function () { return []; });
        if (!beginParty(courseId, players, cards, 0, order, 0)) return false;
        toast(players[0].name + ' has the honour');
        return true;
    }

    function resumeParty() {
        var d = loadParty();
        if (!d) { toast('That party can’t be picked up again'); clearParty(); drawTitle(); return false; }
        if (!beginParty(d.course, d.players, d.cards, d.holeIndex, d.order, d.pos)) return false;
        toast('Party resumed — ' + currentPlayer().name + ' to play hole ' + (d.holeIndex + 1));
        return true;
    }

    /* The party dialog: who is playing and where. The roster is kept between
       parties, because the people round a phone on a Friday are usually the
       people round it the Friday after. */
    var roster = null;
    var partyCourse = null;

    function loadRoster() {
        try {
            var d = JSON.parse(localStorage.getItem(C.PLAYERS_KEY) || 'null');
            if (Array.isArray(d) && d.length >= 2 && d.length <= C.MAX_PLAYERS) {
                return d.map(function (n, i) { return typeof n === 'string' && n.trim() ? n.slice(0, 14) : 'Player ' + (i + 1); });
            }
        } catch (e) { /* storage off */ }
        return ['Player 1', 'Player 2'];
    }

    function openParty() {
        if (GOLF.PLAYTEST) return;
        closeTitle();
        closeMenu();
        cancelAim();
        roster = loadRoster();
        if (!partyCourse || !PR.isOpen(courseById(partyCourse))) {
            var here = currentCourse();
            partyCourse = here && PR.isOpen(here) ? here.id : PR.starter().id;
        }
        drawParty();
        $('party').classList.add('show');
        var first = $('party-players').querySelector('input');
        // A phone would put its keyboard up over the dialog it just opened;
        // only a desktop gets the caret dropped in for it.
        if (first && !coarse()) { try { first.focus(); first.select(); } catch (e) { /* ignore */ } }
    }

    function closeParty() { shut('party'); }

    function readRoster() {
        var inputs = $('party-players').querySelectorAll('input');
        for (var i = 0; i < inputs.length; i++) {
            roster[i] = inputs[i].value.trim().slice(0, 14) || 'Player ' + (i + 1);
        }
    }

    function drawParty() {
        var host = $('party-players');
        host.innerHTML = '';
        roster.forEach(function (name, i) {
            var row = document.createElement('div');
            row.className = 'party-row';
            row.innerHTML = '<i class="party-ball" style="background:' + C.PLAYER_COLORS[i] + '"></i>' +
                '<input type="text" maxlength="14" autocomplete="off" spellcheck="false" ' +
                'aria-label="Player ' + (i + 1) + ' name" value="' + esc(name) + '">' +
                (roster.length > 2
                    ? '<button type="button" class="party-del" aria-label="Remove ' + esc(name) + '">×</button>'
                    : '');
            var del = row.querySelector('.party-del');
            if (del) del.addEventListener('click', function () {
                readRoster();
                roster.splice(i, 1);
                drawParty();
            });
            row.querySelector('input').addEventListener('keydown', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); goParty(); }
            });
            host.appendChild(row);
        });
        $('party-add').hidden = roster.length >= C.MAX_PLAYERS;

        var list = $('party-courses');
        list.innerHTML = '';
        var total = PR.totalStars().got;
        GOLF.COURSES.forEach(function (course) {
            if (!PR.isOpen(course, total)) return;
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'party-course' + (course.id === partyCourse ? ' on' : '');
            b.setAttribute('role', 'radio');
            b.setAttribute('aria-checked', course.id === partyCourse ? 'true' : 'false');
            b.innerHTML = '<span>' + course.name + '</span><small>' + course.holes.length + ' holes · par ' +
                GOLF.coursePar(course.holes) + '</small>';
            b.addEventListener('click', function () {
                readRoster();
                partyCourse = course.id;
                drawParty();
            });
            list.appendChild(b);
        });
    }

    function goParty() {
        readRoster();
        try { localStorage.setItem(C.PLAYERS_KEY, JSON.stringify(roster)); } catch (e) { /* storage off */ }
        startParty(partyCourse, roster.slice());
    }

    function bindParty() {
        $('party-add').addEventListener('click', function () {
            readRoster();
            if (roster.length < C.MAX_PLAYERS) roster.push('Player ' + (roster.length + 1));
            drawParty();
            var inputs = $('party-players').querySelectorAll('input');
            var last = inputs[inputs.length - 1];
            if (last && !coarse()) { try { last.focus(); last.select(); } catch (e) { /* ignore */ } }
        });
        $('party-back').addEventListener('click', function () { closeParty(); openTitle(); });
        $('party-go').addEventListener('click', goParty);
        $('party').addEventListener('click', function (e) {
            if (e.target === $('party')) closeParty();
        });
    }

    /* ── the title screen ───────────────────────────────────────────────

       The first thing a visit sees, and what Esc or the ★ chip brings back.
       It does the three things a classic title does — says what the game
       is, says how far you have got, and puts the obvious next thing under
       one press — and nothing else: the course list is the picker's job and
       the party roster is the party dialog's. The obvious next thing is
       "Continue" when there is a round to continue, "Start here" for a first
       visit, and "Tee off" otherwise, and it is always the course already
       drawn behind the dialog, so pressing it changes nothing but the
       dialog. */

    function titleOpen() { return $('title').classList.contains('show'); }

    function openTitle() {
        if (GOLF.PLAYTEST) return;
        closeMenu();
        closeCard();
        closeParty();
        closeTopMenu();
        cancelAim();
        drawTitle();
        $('title').classList.add('show');
        // The keyboard gets the obvious button under Enter; a touch screen,
        // which has no use for a focus ring, is not given one to look at.
        if (!coarse()) { try { $('title-play').focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    }

    function closeTitle() { shut('title'); }

    function drawTitle() {
        var reset = $('title-reset');
        reset.classList.remove('armed');
        reset.textContent = 'Reset progress';
        var total = PR.totalStars();
        $('tp-stars').textContent = total.got;
        $('tp-max').textContent = total.max;
        $('tp-fill').style.width = (total.max ? total.got / total.max * 100 : 0).toFixed(1) + '%';
        var next = PR.nextUnlock(total.got);
        $('tp-next').textContent = next
            ? next.course.name + ' opens at ' + next.need + ' ★ — ' + next.short + ' to go'
            : 'Every course is open.';

        var course = currentCourse();
        var name = course ? course.name : 'this course';
        var label, sub;
        var started = state.scores.some(function (s) { return typeof s === 'number'; }) || state.strokes > 0;
        if (state.party && state.phase !== 'finished') {
            label = 'Continue party';
            sub = name + ' · hole ' + (state.holeIndex + 1) + ' · ' + currentPlayer().name + '’s shot';
        } else if (started && state.phase !== 'finished') {
            label = 'Continue';
            sub = name + ' · hole ' + (state.holeIndex + 1) + ' of ' + GOLF.COURSE.length;
        } else if (course && course.starter && total.got === 0 && !PR.get().veteran) {
            label = 'Start here';
            sub = name + ' — ' + GOLF.COURSE.length + ' holes, nothing hidden';
        } else {
            label = 'Tee off';
            sub = name + (state.holeIndex > 0 ? ' · hole ' + (state.holeIndex + 1) : '');
        }
        $('title-play').innerHTML = '<span class="tpl-main">▶ ' + label + '</span><span class="tpl-sub">' +
            esc(sub) + '</span>';

        var saved = !state.party && loadParty();
        var resume = $('title-resume-party');
        resume.hidden = !saved;
        if (saved) {
            resume.textContent = 'Resume party — ' + saved.players.map(function (p) { return p.name; }).join(', ') +
                ' · hole ' + (saved.holeIndex + 1);
        }
        $('title-hint').textContent = coarse()
            ? 'Drag back from anywhere on the course and let go. Turn the phone for a wider view, or keep it upright for a taller one.'
            : 'Drag back with the mouse and let go — or aim with ← →, set power with ↑ ↓, and hit with Space. Esc brings this menu back.';
    }

    function bindTitle() {
        if (GOLF.PLAYTEST) { $('btn-title').hidden = true; return; }
        $('btn-title').addEventListener('click', openTitle);
        $('title-play').addEventListener('click', function () {
            closeTitle();
            // A finished round has nothing to continue: the play button is
            // the Play again button then.
            if (state.phase === 'finished') {
                if (state.party) startParty(GOLF.COURSE_ID, state.party.players.map(function (p) { return p.name; }));
                else newRound(false);
            }
        });
        $('title-courses').addEventListener('click', openMenu);
        $('title-party').addEventListener('click', openParty);
        $('title-resume-party').addEventListener('click', resumeParty);
        $('title-intro').addEventListener('click', replayIntro);
        $('title-reset').addEventListener('click', resetProgress);
    }

    /* "Show me again": the ghost stroke and the lessons come back, and the
       first tee of the starter course is where they are shown. Nothing
       earned is touched — it is a fresh round, not a fresh save. */
    function replayIntro() {
        PR.replayIntro();
        playCourse(PR.starter().id, 'The intro', 0);
    }

    /* "Let me climb it again". Two presses, like opening every course, and
       for the same reason: it cannot be taken back. The second press wipes
       the stars, the records and every round in progress, and then boots
       the page again in place — a new draw, the starter course, and the
       title saying Start here — rather than reloading, so a reset that
       fails on a locked-down browser fails without a blank page. */
    function resetProgress() {
        var b = $('title-reset');
        if (!b.classList.contains('armed')) {
            b.classList.add('armed');
            b.textContent = 'Press again \u2014 every star and record goes';
            return;
        }
        PR.resetAll();
        if (GOLF.installDraw) rememberSeed(GOLF.installDraw(GOLF.generator.randomSeed()).seed);
        GOLF.selectCourse(PR.starter().id);
        newRound(false);
        syncCourse();
        drawTitle();
        toast('Progress reset \u2014 a first visit again');
    }

    /* ── scorecard ──────────────────────────────────────────────────────── */

    function openCard(res) {
        if (state.party) { openPartyCard(false); return; }
        $('scorecard').classList.remove('party');
        var t = S.totals(state.scores, GOLF.COURSE);
        var rows = GOLF.COURSE.map(function (h, i) {
            var sc = state.scores[i];
            var cls = '';
            if (typeof sc === 'number') {
                cls = sc === 1 ? 'ace' : sc < h.par ? 'under' : sc > h.par ? 'over' : 'level';
            }
            return '<tr><td class="n">' + (i + 1) + '</td><td class="nm">' + h.name +
                '</td><td>' + h.par + '</td><td class="' + cls + '">' +
                (typeof sc === 'number' ? sc : '—') + '</td></tr>';
        }).join('');

        $('card-body').innerHTML =
            '<table class="card-table"><thead><tr><th>#</th><th>Hole</th><th>Par</th><th>Score</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
            '<tfoot><tr><td colspan="2">Total</td><td>' + GOLF.coursePar() + '</td><td>' + t.strokes + '</td></tr></tfoot>' +
            '</table>';

        var headline = res
            ? (res.isBest ? 'New personal best!' : 'Round complete')
            : 'Scorecard';
        $('card-title').textContent = headline;
        var summary;
        if (!res) {
            summary = 'Through ' + t.played + ' hole' + (t.played === 1 ? '' : 's');
        } else if (autoUsed) {
            summary = t.strokes + ' strokes, ' + S.formatVsPar(t.vsPar) +
                ' · not recorded — the caddie has had the club this session';
        } else if (!isRecorded()) {
            // Not an apology: a draw nobody else has played has no record to
            // beat, and pretending otherwise would put a nine-hole score up
            // against the eighteen.
            summary = t.strokes + ' strokes, ' + S.formatVsPar(t.vsPar) +
                ' · not recorded — no two draws are the same course';
        } else {
            var st = S.courseStars(state.save, GOLF.COURSE);
            summary = t.strokes + ' strokes, ' + S.formatVsPar(t.vsPar) + ' · best ' +
                (state.save.best === null ? '—' : state.save.best) +
                ' · ★ ' + st.got + '/' + st.max +
                ' · ' + state.save.rounds + ' round' + (state.save.rounds === 1 ? '' : 's') +
                ' · ' + state.save.aces + ' ace' + (state.save.aces === 1 ? '' : 's');
        }
        $('card-sub').textContent = summary;
        $('card-again').style.display = res ? '' : 'none';
        $('scorecard').classList.add('show');
    }

    /* A party's card: a column a player, the honour order forgotten, and the
       winner named at the top. Lowest total wins; a tie is said as a tie. */
    function openPartyCard(final) {
        var p = state.party;
        $('scorecard').classList.add('party');
        var head = p.players.map(function (pl) {
            return '<th class="pc"><i style="background:' + pl.color + '"></i>' + esc(pl.name) + '</th>';
        }).join('');
        var rows = GOLF.COURSE.map(function (h, i) {
            return '<tr><td class="n">' + (i + 1) + '</td><td class="nm">' + h.name + '</td><td>' + h.par + '</td>' +
                p.players.map(function (pl, k) {
                    var sc = p.cards[k][i];
                    var cls = typeof sc !== 'number' ? '' : sc === 1 ? 'ace' : sc < h.par ? 'under' : sc > h.par ? 'over' : 'level';
                    return '<td class="pc ' + cls + '">' + (typeof sc === 'number' ? sc : '—') + '</td>';
                }).join('') + '</tr>';
        }).join('');
        var totals = p.players.map(function (pl, k) { return S.totals(p.cards[k], GOLF.COURSE); });
        $('card-body').innerHTML =
            '<table class="card-table party-table"><thead><tr><th>#</th><th class="nm">Hole</th><th>Par</th>' + head +
            '</tr></thead><tbody>' + rows + '</tbody><tfoot><tr><td colspan="2">Total</td><td>' + GOLF.coursePar() +
            '</td>' + totals.map(function (t) { return '<td class="pc">' + t.strokes + '</td>'; }).join('') +
            '</tr></tfoot></table>';

        var low = Math.min.apply(null, totals.map(function (t) { return t.strokes; }));
        var leaders = p.players.filter(function (pl, k) { return totals[k].strokes === low; });
        var names = leaders.map(function (pl) { return pl.name; });
        var lead = names.length === 1 ? names[0] : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
        if (final) {
            $('card-title').textContent = names.length === 1 ? lead + ' wins!' : 'A tie — ' + lead;
        } else {
            $('card-title').textContent = 'Party scorecard';
        }
        $('card-sub').textContent = (final ? '' : 'Through hole ' + (state.holeIndex + 1) + ' · ') +
            p.players.map(function (pl, k) {
                return pl.name + ' ' + totals[k].strokes + ' (' + S.formatVsPar(totals[k].vsPar) + ')';
            }).join(' · ');
        $('card-again').style.display = final ? '' : 'none';
        $('scorecard').classList.add('show');
    }

    function closeCard() { shut('scorecard'); }

    /* ── the caddie ──────────────────────────────────────────────────────

       Autoplay, the way Loft Links has it: the 🤖 chip hands the club to
       `js/bot.js` and it plays — from wherever the ball is standing, and
       then *on*: the next hole when this one drops, and the next course when
       the card runs out. Press it again, or Esc, to take the club back.

       It plays through the same three things a player touches — the line,
       the weight, and the strike — so what you watch is a shot the game
       played, not one drawn on top of it. And it plays it the way a person
       does, over a moment: it stands over the ball, the arrow swings round
       to the line it chose, the ring winds up to the weight, and only then
       does it putt. A shot with no moment before it reads as a glitch.

       **The roll is stepped at SIM_DT while it has the club.** The plan was
       made by settling copies of this world at that step, and `advance`
       subdivides by speed rather than to a fixed clock, so a frame of any
       other length is a slightly different roll — enough, over a long putt,
       to turn the shot it holed into one that lips out. Fixed steps make the
       game's roll the plan's roll to the last bit, which is what lets the
       caddie keep a whole line rather than planning every stroke afresh, and
       what lets it time a gate: the strike lands on the planned instant,
       inside the step, not on whichever frame happens to come after it.

       **It costs you the session's records.** Once the caddie has had the
       club, nothing reaches the save file until the page is reloaded — no
       best, no stars, no doors opened, and no round in progress either, so
       the course it walks onto keeps the round you left there. It is the
       whole sitting rather than the round because by the time a card is
       written there is no telling whose holes those were; erring the other
       way would mean a record set by the bot, which is the one thing a record
       must never be. */

    var sim = null;        // the caddie's turn on this hole, stage by stage
    var auto = null;       // { playing, wait } while Autoplay is walking
    // Whether the caddie has had the club this sitting. Never stored: a
    // reload is a new sitting.
    var autoUsed = false;
    var simAcc = 0;        // frame time not yet stepped, under the caddie

    // The beat from one shot stopping to the next being struck, which the
    // plan's later shots are timed on. See CONFIG.BOT_SLACK.
    function botGap() { return C.BOT_PAUSE + C.BOT_TURN + C.BOT_WIND + C.BOT_SLACK; }

    function syncSim() {
        var btn = $('btn-sim');
        if (!btn) return;
        btn.classList.toggle('on', !!auto);
        btn.setAttribute('aria-pressed', auto ? 'true' : 'false');
        btn.title = auto ? 'Stop Autoplay — take the club back (Esc)'
                         : 'Let the caddie play on — hole after hole, course after course';
    }

    function toggleAuto() {
        if (auto) { stopAuto('Your club again'); return; }
        startAuto();
    }

    function startAuto() {
        if (!GOLF.bot || !state || !state.world) return;
        if (state.party) { toast('Autoplay is for a round on your own — a party plays its own shots'); return; }
        // A ball half aimed by hand is the caddie's to aim now.
        cancelAim();
        closeTopMenu();
        auto = { playing: false, wait: 0 };
        /* The press, not the first shot: somebody who switches this on and
           straight off again has still asked for it. */
        autoUsed = true;
        syncSim();
        syncHud();
        // Said once, on the press: the one thing about it nobody can see
        // coming is what it costs.
        toast('Autoplay — the caddie plays on. Nothing is recorded this session; press 🤖 or Esc to stop.');
    }

    function stopAuto(why) {
        if (!auto) return;
        auto = null;
        stopSim(null);
        syncSim();
        if (why) toast(why);
    }

    function startSim() {
        if (!GOLF.bot || !state || state.phase !== 'aim') return;
        hideLessons();
        // Nor the ghost stroke: it is a demonstration for a first-time hand.
        state.coach = false;
        // `plan` is the line it is playing out, a shot at a time; `shot` the
        // one it is standing over now. Both are filled in by think.
        sim = { stage: 'rest', until: state.world.time + C.BOT_PAUSE, said: false,
                plan: null, shot: null, t: 0, fromAngle: 0, turnDur: 0, restAt: null };
        simAcc = 0;
    }

    function stopSim(why) {
        if (!sim) return;
        sim = null;
        simAcc = 0;
        if (state) cancelAim();
        if (why) toast(why);
    }

    function easeInOut(x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); }

    // The short way round, which is the way a person turns.
    function turnTowards(from, to, f) {
        var d = (to - from) % (Math.PI * 2);
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        return from + d * f;
    }

    /* The next shot of the line in hand, if the ball really is where the line
       said it would be and there is still time to address it before the
       instant it was timed for. Anything else — a gate that shoved the ball
       while it stood, a dialog that held the caddie past its beat, a splash
       the plan never meant — and the line is thrown away and read again. */
    function nextPlanned() {
        var shot = sim.plan && sim.plan[0];
        if (!shot) return null;
        var b = state.world.ball;
        if (Math.hypot(b.x - shot.from.x, b.y - shot.from.y) > 0.01) return null;
        if (shot.at < state.world.time + C.BOT_TURN + C.BOT_WIND) return null;
        return shot;
    }

    function readHole() {
        var w = state.world, hole = GOLF.COURSE[state.holeIndex];
        var t0 = performance.now();
        var left = S.strokeLimit(hole.par) - state.strokes;
        /* Planned for the world the address is about to arrive in, not the
           one it is standing in: every gate on the hole will have moved by
           the time the ring has wound up, and a shot chosen for the wrong
           moment is chosen against a different hole. */
        var found = GOLF.bot.bestShot(hole, { x: w.ball.x, y: w.ball.y },
            w.time + C.BOT_TURN + C.BOT_WIND,
            { strokes: left, gap: botGap(), budget: C.BOT_BUDGET,
              seed: 1 + state.holeIndex * 7919 + state.strokes * 104729 });
        if (!found) return null;
        sim.plan = found.shots;
        var ms = Math.round(performance.now() - t0);
        toast(found.line
            ? 'The caddie sees it in ' + found.line + ' · ' + found.sims + ' shots tried in ' + ms + 'ms'
            : 'No clean line from here — the caddie plays for position');
        return sim.plan[0];
    }

    /* One frame of the caddie's turn, `beat` seconds of world time long — the
       clock its shots are timed on, so the pauses are too. Only `think` costs
       anything, and only when it has to read the hole again. */
    function tickSim(beat) {
        if (state.phase === 'holed' || state.phase === 'finished') { stopSim(null); return; }
        // A dialog over the board holds the caddie where it stands; whatever
        // it was addressing is read again when the board comes back.
        if (dialogOpen()) {
            if (sim.stage !== 'watch' && sim.stage !== 'rest') { sim.stage = 'think'; sim.said = false; cancelAim(); }
            return;
        }
        var a = state.aim;
        if (sim.stage === 'rest') {
            if (state.world.time >= sim.until) { sim.stage = 'think'; sim.said = false; }
            return;
        }
        if (sim.stage === 'think') {
            if (state.phase !== 'aim') return;
            var shot = nextPlanned();
            if (!shot) {
                // Said on one frame, read on the next, so the moment the
                // search holds the world still lands under a message.
                if (!sim.said) { sim.said = true; toast('The caddie is reading the green…'); return; }
                shot = readHole();
                if (!shot) { stopSim('The caddie cannot see a shot from there'); return; }
            }
            sim.plan.shift();
            sim.shot = shot;
            sim.stage = 'turn';
            sim.t = 0;
            sim.fromAngle = a.angle;
            // A two-degree correction takes almost none of the turn; what is
            // left of BOT_TURN is spent standing over the ball.
            sim.turnDur = Math.max(0.15, Math.min(C.BOT_TURN,
                Math.abs(turnTowards(a.angle, shot.aim, 1) - a.angle) / C.BOT_TURN_RATE));
            a.active = true;
            a.keyboard = true;
            a.origin = null;
            a.power = 0;
            return;
        }
        if (sim.stage === 'turn') {
            sim.t += beat;
            a.active = true;
            a.angle = turnTowards(sim.fromAngle, sim.shot.aim, easeInOut(sim.t / sim.turnDur));
            if (sim.t < C.BOT_TURN) return;
            a.angle = sim.shot.aim;
            sim.stage = 'wind';
            sim.t = 0;
            return;
        }
        if (sim.stage === 'wind') {
            sim.t += beat;
            // Up the ring rather than onto it: the arrow on the green grows
            // out of the ball the way it does under a finger.
            a.power = sim.shot.power * easeInOut(sim.t / C.BOT_WIND);
            if (sim.t < C.BOT_WIND) return;
            a.power = sim.shot.power;
            sim.stage = 'wait';
            return;
        }
        if (sim.stage === 'wait') return;      // struck from the step loop, on the instant
        // 'watch': the roll is the game's business until it ends.
        if (state.phase === 'aim') {
            sim.stage = 'rest';
            sim.until = (sim.restAt !== null ? sim.restAt : state.world.time) + C.BOT_PAUSE;
            sim.restAt = null;
        }
    }

    /* The strike, from inside the step loop: on the planned instant to the
       step, through the same door a released finger goes through. Inside the
       safe zone the overswing has nothing to scatter, so the ball leaves on
       exactly the line that was simulated. */
    function strikePlanned() {
        var w = state.world, shot = sim.shot;
        // Shoved off its spot while it stood — a gate came through — and the
        // shot it was addressing is a shot from somewhere else.
        if (Math.hypot(w.ball.x - shot.from.x, w.ball.y - shot.from.y) > 0.01) {
            sim.plan = null;
            sim.stage = 'think';
            sim.said = false;
            cancelAim();
            return;
        }
        // Within a step of the instant: the clock is set to it, so the gates
        // stand exactly where the plan saw them.
        if (Math.abs(w.time - shot.at) < C.SIM_DT) w.time = shot.at;
        state.aim.angle = shot.aim;
        state.aim.power = shot.power;
        sim.stage = 'watch';
        takeShot();
        // A shot the physics refused would leave it standing here for ever.
        if (state.phase !== 'rolling') stopSim('That shot would not go — your club again');
    }

    /* Autoplay walking a course. `playing` means "the caddie was started on
       this hole", which is not the same as `sim` being alive — and the pair
       is the whole trick: a caddie that has stopped for any reason (holed
       out, out of strokes, no shot it can see) is noticed here without ever
       having to ask which. */
    function tickAuto(beat) {
        if (dialogOpen()) return;
        if (auto.wait > 0) {
            auto.wait -= beat;
            if (auto.wait <= 0) autoNext();
            return;
        }
        if (state.phase === 'holed' || state.phase === 'finished' || (auto.playing && !sim)) {
            auto.wait = C.BOT_HOLD;
            return;
        }
        if (!auto.playing && state.phase === 'aim') {
            auto.playing = true;
            startSim();
        }
    }

    /* The next thing to play: a hole if this card has one left, a course if
       it does not. The card never opens on the way past — it is a modal, and
       a modal would stall the caddie mid-read — and none is written, because
       nothing about this round is being kept anyway. */
    function autoNext() {
        stopSim(null);
        // A caddie that stopped short of the cup picks up, as anybody would.
        if (state.phase !== 'holed' && state.phase !== 'finished') { holeComplete(true); return; }
        if (state.phase === 'holed' && state.holeIndex < GOLF.COURSE.length - 1) {
            loadHole(state.holeIndex + 1);
            return;
        }
        if (GOLF.PLAYTEST) { stopAuto('The caddie has played your hole — the club is yours'); return; }
        var id = nextCourseId();
        // From the first tee: the round it is leaving and the one it lands
        // on were both never going to be kept, and newRound(false) clears
        // nothing while the caddie has had the club.
        if (id && playCourse(id, null, 0)) toast('Autoplay — ' + currentCourse().name);
        else newRound(false);
    }

    /* The next open course down the rack, round to the top after the last.
       Down the list is the order the stars open them, so it is the order the
       game already offers them in; a locked card is skipped, not opened. */
    function nextCourseId() {
        var at = 0, i, c;
        for (i = 0; i < GOLF.COURSES.length; i++) if (GOLF.COURSES[i].id === GOLF.COURSE_ID) at = i;
        for (i = 1; i <= GOLF.COURSES.length; i++) {
            c = GOLF.COURSES[(at + i) % GOLF.COURSES.length];
            if (PR.isOpen(c)) return c.id;
        }
        return null;
    }

    /* ── input ──────────────────────────────────────────────────────────── */

    /* Screen to world. On a turned board the world's left edge is the
       bottom of the screen and its top edge the left, so the two fractions
       swap and one of them runs backwards — the inverse of the transform
       resize() puts on the context. */
    function toWorld(e) {
        var r = canvas.getBoundingClientRect();
        var fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
        if (turned) return { x: (1 - fy) * C.WORLD_W, y: fx * C.WORLD_H };
        return { x: fx * C.WORLD_W, y: fy * C.WORLD_H };
    }

    // Drop a half-drawn shot. Anything that opens over the board calls it,
    // or the release that lands on the dialog's button would also putt.
    function cancelAim() {
        if (!state) return;
        state.aim.active = false;
        state.aim.power = 0;
        state.aim.origin = null;
        state.aim.keyboard = false;
    }

    // Is something open over the board? While it is, the keys that play a
    // shot belong to the dialog — Space and Enter press its buttons.
    function dialogOpen() {
        return titleOpen() || $('menu').classList.contains('show') ||
            $('scorecard').classList.contains('show') || $('party').classList.contains('show');
    }

    function aimFrom(p) {
        // Pull back away from the target, slingshot style: the ball leaves
        // along the line from the pointer to where the drag started. The
        // origin is wherever the finger landed, not the ball, so a shot can
        // be dragged out anywhere there is room — on a phone that means the
        // hand never has to cover the ball it is aiming.
        var o = state.aim.origin || state.world.ball;
        var dx = o.x - p.x, dy = o.y - p.y;
        var dist = Math.hypot(dx, dy);
        state.aim.angle = Math.atan2(dy, dx);
        state.aim.power = Math.min(dist, C.DRAG_MAX) / C.DRAG_MAX * C.MAX_POWER;
        state.aim.active = true;
        state.aim.keyboard = false;
    }

    function bindInput() {
        canvas.addEventListener('pointerdown', function (e) {
            if (auto) { toast('The caddie has the club — press 🤖 or Esc to take it back'); return; }
            if (state.phase !== 'aim') {
                if (state.phase === 'holed') advanceHole();
                return;
            }
            canvas.setPointerCapture(e.pointerId);
            state.aim.origin = toWorld(e);
            aimFrom(state.aim.origin);
            e.preventDefault();
        });

        canvas.addEventListener('pointermove', function (e) {
            if (auto || !state.aim.active || state.aim.keyboard || state.phase !== 'aim') return;
            aimFrom(toWorld(e));
        });

        function release(e) {
            if (auto || !state.aim.active || state.aim.keyboard) return;
            if (canvas.hasPointerCapture && canvas.hasPointerCapture(e.pointerId)) {
                canvas.releasePointerCapture(e.pointerId);
            }
            takeShot();
            state.aim.active = false;
            state.aim.power = 0;
            state.aim.origin = null;
        }
        canvas.addEventListener('pointerup', release);
        canvas.addEventListener('pointercancel', function () {
            state.aim.active = false;
            state.aim.power = 0;
            state.aim.origin = null;
        });

        /* Keyboard play is a first-class path, not an afterthought: aim with
           the arrows, set power with up/down, hit with space. It is also the
           only way to play this precisely on a trackpad. */
        window.addEventListener('keydown', function (e) {
            if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
            var a = state.aim;
            var k = e.key;

            if (k === 'm' || k === 'M') { setMuted(A.toggleMute()); return; }
            if (k === 'f' || k === 'F') { toggleFullscreen(); return; }
            if (k === 'c' || k === 'C') { openMenu(); return; }
            if (k === 'd' || k === 'D') { dealRandomCourse(); return; }
            if (k === 'g' || k === 'G') { newDraw(); return; }
            if (k === 's' || k === 'S') { nextScenery(); return; }
            if (k === 'a' || k === 'A') { if (!dialogOpen()) toggleAuto(); return; }
            /* One key shuts whatever is open, and the panel counts: a ☰ left
               hanging over the board is chrome with no way off it on a
               keyboard. With nothing open it is the pause key every game
               has, and brings the menu up; on the menu it is "back to the
               game". */
            if (k === 'Escape') {
                if (auto && !dialogOpen()) { stopAuto('Your club again'); return; }
                if (titleOpen()) { closeTitle(); return; }
                if (dialogOpen() || $('topbar-menu').classList.contains('open')) {
                    closeCard(); closeMenu(); closeParty(); closeTopMenu();
                    return;
                }
                openTitle();
                return;
            }
            if (dialogOpen()) return;
            if (k === 'r' || k === 'R') { restartHole(); return; }
            // Every key below plays a shot, and the shots are the caddie's.
            if (auto) return;

            if (state.phase === 'holed' && (k === ' ' || k === 'Enter')) {
                e.preventDefault();
                advanceHole();
                return;
            }
            if (state.phase !== 'aim') return;

            if (k === 'ArrowLeft' || k === 'ArrowRight') {
                a.active = true; a.keyboard = true;
                a.angle += (k === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 0.008 : 0.045);
                if (a.power === 0) a.power = C.MAX_POWER * 0.5;
                e.preventDefault();
            } else if (k === 'ArrowUp' || k === 'ArrowDown') {
                a.active = true; a.keyboard = true;
                a.power = Math.max(0, Math.min(C.MAX_POWER,
                    a.power + (k === 'ArrowUp' ? 1 : -1) * C.MAX_POWER * (e.shiftKey ? 0.015 : 0.06)));
                e.preventDefault();
            } else if (k === ' ' || k === 'Enter') {
                if (a.active) takeShot();
                e.preventDefault();
            }
        });
    }

    function restartHole() {
        if (state.phase === 'finished' || state.phase === 'holed') return;
        /* In a party the tee is free but the strokes are not: a restart that
           wiped the count would be a mulligan only the player holding the
           phone could take. Alone, it is what it always was. */
        if (state.party) {
            if (state.phase !== 'aim') return;
            var w = state.world, tee = GOLF.COURSE[state.holeIndex].tee;
            w.ball.x = tee.x; w.ball.y = tee.y; w.ball.vx = w.ball.vy = 0;
            state.trail = [];
            toast('Back to the tee — strokes stand');
            return;
        }
        var penalty = state.strokes > 0 ? ' (strokes reset)' : '';
        loadHole(state.holeIndex);
        toast('Hole restarted' + penalty);
    }

    // Only the icon: the chip carries a label beside it now, and setting the
    // button's text would take the label with it.
    function setMuted(m) {
        $('mute-icon').textContent = m ? '🔇' : '🔊';
        $('btn-mute').setAttribute('aria-label', m ? 'Unmute' : 'Mute');
    }

    /* ── loop ───────────────────────────────────────────────────────────── */

    /* Fit the board to whatever room there is, on both axes.

       It used to scale on width alone, which is right until the window is
       wider than it is tall — then a 3:2 board sized to the width runs off the
       bottom of the screen and you play the first two thirds of the hole. Now
       the smaller of the two ratios wins and the leftover space becomes
       letterboxing, which is why .stage centres its canvas and paints its own
       background. Fullscreen is the same calculation with the chrome hidden,
       so it needs no special case beyond a bigger budget. */
    var chromeH = 0;   // help + legend, remembered from when they were visible

    function resize() {
        var stage = $('stage');
        var wrap = $('wrap');
        var full = !!fullscreenEl();
        /* Side by side when the room is short and wide: a phone on its side,
           or a letterbox of a window. Decided first, because it moves the
           board's top edge and changes which way the leftover room runs. */
        var side = window.innerHeight <= 520 && window.innerWidth >= window.innerHeight * 1.3;
        document.body.classList.toggle('is-side', side);
        var top = stage.getBoundingClientRect().top;

        // Measure the reference text only while it is on screen, and keep the
        // figure: the tight-mode decision below has to be answerable when the
        // very elements it is about are display:none, or it oscillates.
        if (!full && !document.body.classList.contains('is-tight')) {
            var m = 0;
            ['help', 'legend'].forEach(function (id) {
                var el = $(id);
                if (el) m += el.offsetHeight + 14;
            });
            if (m > 0) chromeH = m;
        }

        /* Short window: the key and the shortcuts stand down so the board can
           have their pixels. On a 1440x700 laptop that is the difference
           between a 595px board and a 778px one, and the legend is reference
           material you read once — the board is the game. */
        // The page's own bottom padding is part of the budget; without it the
        // board fits the viewport and the document still scrolls by an inch.
        var pad = full ? 14 : (parseFloat(getComputedStyle(document.body).paddingBottom) || 0) + 4;
        // In the side layout the meter is in the column, not under the board.
        var meter = side ? 0 : $('power').offsetHeight + 10;   // always on, even in fullscreen
        var room = window.innerHeight - top - pad - meter;
        /* Side by side, the board's top edge is not a measurement to trust:
           the stage is centred against the column beside it, so a small
           board sits lower, which leaves less room, which keeps it small —
           an answer that agrees with itself and is wrong. The room is the
           height of the screen less the padding round it, whatever the board
           happens to be this frame. */
        if (side) {
            var box = getComputedStyle(full ? wrap : document.body);
            room = window.innerHeight - (parseFloat(box.paddingTop) || 0) - (parseFloat(box.paddingBottom) || 0) - 4;
        }
        var tight = !full && !side && (room - chromeH) < C.WORLD_H * 0.7;
        document.body.classList.toggle('is-tight', tight);

        var availH = room - ((full || tight || side) ? 0 : chromeH);
        var availW = side ? wrap.clientWidth - $('power').offsetWidth - 10 : wrap.clientWidth;

        /* A phone held upright has a screen the wrong shape for a 3:2 field:
           fitted flat, the board is a strip 260px tall across the top of a
           tall glass. Turned a quarter round it is more than twice the area,
           so it turns — the tee end, which is the left of nearly every hole,
           goes to the bottom of the screen and the shot is played up it, the
           way a phone golf game is held. Nothing in the world changes; the
           context is rotated and toWorld() undoes it for the pointer. Only
           turned when it buys a clear margin, so a window that is roughly
           square does not flip back and forth as it is dragged. */
        var flat = Math.min(availW / C.WORLD_W, availH / C.WORLD_H);
        var upright = Math.min(availW / C.WORLD_H, availH / C.WORLD_W);
        turned = !side && upright > flat * 1.1;
        document.body.classList.toggle('is-turned', turned);
        scale = Math.max(0.3, turned ? upright : flat);

        // Keep the backing store sane: a 4K monitor at devicePixelRatio 2 would
        // otherwise ask for a 10-megapixel canvas to redraw sixty times a second.
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (scale * dpr > 3) dpr = 3 / scale;

        var wide = turned ? C.WORLD_H : C.WORLD_W, tall = turned ? C.WORLD_W : C.WORLD_H;
        canvas.width = Math.round(wide * scale * dpr);
        canvas.height = Math.round(tall * scale * dpr);
        canvas.style.width = Math.round(wide * scale) + 'px';
        canvas.style.height = Math.round(tall * scale) + 'px';
        var k = scale * dpr;
        pixels = k >= 1.75 ? 2 : 1;
        // Turned: world x runs up the screen, world y runs across it.
        if (turned) ctx.setTransform(0, -k, k, 0, 0, C.WORLD_W * k);
        else ctx.setTransform(k, 0, 0, k, 0, 0);
        if (state) {
            state.turned = turned;
            // Turning the board moves every corner of the field, and the
            // lesson card was placed against the old ones.
            placeLessons(GOLF.COURSE[state.holeIndex]);
        }
    }

    /* ── fullscreen ─────────────────────────────────────────────────────── */

    function fullscreenEl() {
        return document.fullscreenElement || document.webkitFullscreenElement || null;
    }

    function canFullscreen() {
        var el = $('wrap');
        return !!(el.requestFullscreen || el.webkitRequestFullscreen);
    }

    function toggleFullscreen() {
        var el = $('wrap');
        if (fullscreenEl()) {
            (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
            var req = el.requestFullscreen || el.webkitRequestFullscreen;
            if (req) {
                // Older Safari resolves nothing and rejects nothing; guard both.
                var r = req.call(el);
                if (r && r.catch) r.catch(function () { toast('Fullscreen was refused'); });
            }
        }
    }

    /* Only the fullscreen element and what is inside it is drawn while it is
       up, and the wrap is what goes up — but the menu, the title, the party
       and the scorecard are the body's, beside it, so a round finished in
       fullscreen opened a scorecard nobody could see. They move in with the
       wrap and back out after
       it. They are fixed to the viewport either way, which in fullscreen is
       the wrap, so where they sit in the page changes nothing about how they
       look. */
    function hostModals(host) {
        var modals = document.querySelectorAll('.modal');
        for (var i = 0; i < modals.length; i++) {
            if (modals[i].parentNode !== host) host.appendChild(modals[i]);
        }
    }

    function syncFullscreen() {
        var on = !!fullscreenEl();
        hostModals(on ? fullscreenEl() : document.body);
        document.body.classList.toggle('is-full', on);
        $('full-icon').textContent = on ? '⤡' : '⛶';
        $('btn-full').setAttribute('aria-label', on ? 'Leave fullscreen' : 'Fullscreen');
        // Fullscreen is compact chrome whatever the screen is: the bar is the
        // only thing standing between the player and a bigger board.
        syncCompact();
        // The browser resizes the element before it fires the event, but the
        // hidden chrome has not been laid out yet on every engine.
        resize();
        requestAnimationFrame(resize);
    }

    /* ── power meter ────────────────────────────────────────────────────── */

    /* The on-canvas gauge is where the eye already is, but it is small and it
       sits under the player's own thumb on a phone. The bar under the board is
       the same value at ten times the size — still no number on it, because
       knowing the power to the percent is not the skill being tested. */
    /* The overswing zone is a fact about the config, not about the shot, so
       the bar is marked once at boot rather than every frame. */
    function markSafeZone() {
        $('power-danger').style.left = (C.SAFE_POWER / C.MAX_POWER * 100).toFixed(2) + '%';
    }

    function syncPower() {
        var a = state.aim;
        var showing = a.active && state.phase === 'aim';
        var frac = showing ? Math.max(0, Math.min(1, a.power / C.MAX_POWER)) : 0;
        var el = $('power');
        el.classList.toggle('show', showing);
        el.classList.toggle('hot', a.power > C.SAFE_POWER);
        $('power-fill').style.clipPath = 'inset(0 ' + ((1 - frac) * 100).toFixed(1) + '% 0 0)';
        $('power-knob').style.left = (frac * 100).toFixed(1) + '%';

        var mark = $('power-last');
        if (typeof state.lastFrac === 'number') {
            mark.hidden = false;
            mark.style.left = (state.lastFrac * 100).toFixed(1) + '%';
        } else {
            mark.hidden = true;
        }
    }

    var lastT = 0;

    function loop(now) {
        requestAnimationFrame(loop);
        var dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 0.016;
        lastT = now;

        var w = state.world;
        var ev, before = w.time;
        if (auto) {
            /* Under the caddie, the step it planned on — see "the caddie".
               What a frame does not use is carried, so the ball still runs
               at real speed on a screen of any refresh rate, and the strike
               is checked before every step rather than once a frame. */
            ev = {};
            simAcc = Math.min(simAcc + dt, 0.1);
            while (simAcc >= C.SIM_DT) {
                simAcc -= C.SIM_DT;
                if (sim && sim.stage === 'wait' && w.time >= sim.shot.at - 1e-6) strikePlanned();
                var rested = !!ev.rest;
                P.advance(w, C.SIM_DT, ev);
                // The step it stopped on, not the frame that noticed: the
                // beat to the next shot is counted from here, as planned.
                if (sim && !rested && ev.rest) sim.restAt = w.time;
            }
        } else {
            ev = P.advance(w, dt, {});
        }
        var shot = state.phase === 'rolling' ? state.shot : null;

        /* A knock. `ev.impact` is the hardest contact of the frame — where,
           which way the ball was pushed off, and how fast it arrived along
           that line, which is what a knock should be measured by: a ball
           glancing down a wall at speed barely touches it. */
        var imp = ev.impact;
        var knockS = imp ? Math.min(1, imp.vn / 700) : 0;
        if (ev.bumper && now - lastBounceAt > 45) {
            lastBounceAt = now;
            A.bumper(P.speedOf(w.ball));
            A.buzz(8);
            R.effects.spark(w.ball.x, w.ball.y);
            R.effects.ring(w.ball.x, w.ball.y, C.BALL_R + 6);
            if (imp) R.effects.impact(imp.x, imp.y, imp.nx, imp.ny, Math.max(0.4, knockS), true);
            if (shot) shot.posts++;
        } else if (ev.bounce && now - lastBounceAt > 45) {
            lastBounceAt = now;
            var hit = P.speedOf(w.ball);
            A.bounce(imp ? imp.vn * 1.3 : hit);
            if (imp && imp.vn > 40) R.effects.impact(imp.x, imp.y, imp.nx, imp.ny, knockS, false);
            if (shot) shot.banks++;
            // A hard knock jolts the frame. A small one would be noise.
            if (hit > 620) shake = Math.max(shake, Math.min(1, (hit - 620) / 500));
        }

        /* Off the water. Each skip ripples, sprays and plips a note higher
           than the last; coming down dry after one is called, because the
           ball cleared a hazard and the player should hear that they did. */
        if (ev.skip) {
            A.skip(ev.skip.n);
            A.buzz(10);
            R.effects.skip(ev.skip.x, ev.skip.y, Math.atan2(w.ball.vy, w.ball.vx), ev.skip.n);
            if (shot) shot.skips = ev.skip.n;
        }
        if (ev.land && !ev.land.wet) {
            A.land();
            R.effects.land(ev.land.x, ev.land.y, Math.atan2(w.ball.vy, w.ball.vx));
            if (w.skips) toast(w.skips > 1 ? w.skips + ' skips — and across!' : 'Skipped across!');
        }

        if (ev.tunnel) {
            A.tunnel();
            var tl = w.course.tunnels, ink = null;
            for (var q = 0; q < tl.length; q++) {
                if ((tl[q].x === ev.tunnel.x && tl[q].y === ev.tunnel.y) ||
                    (tl[q].tx === ev.tunnel.x && tl[q].ty === ev.tunnel.y)) { ink = R.tunnelInk(q); break; }
            }
            R.effects.tunnel(ev.tunnel.x, ev.tunnel.y, ev.tunnel.tx, ev.tunnel.ty, ink);
            // The trail would draw a line across the field from one mouth to
            // the other, which is exactly the journey the ball did not make.
            state.trail = [];
            if (shot) shot.tunnels++;
        }

        // A knock on the back of the cup, heard as it happens.
        if (ev.rim && now - lastRimAt > 60) {
            lastRimAt = now;
            A.rim(ev.rim);
        }

        /* A lip-out: over the rim, too fast to be taken, and out the other
           side. Said out loud, because a ball that ran across the cup and
           kept going looks on a small screen exactly like a ball that
           missed it, and the near thing is half the fun. */
        if (ev.lip) state.lipping = true;
        if (state.lipping && !w.sunk &&
            Math.hypot(w.ball.x - w.course.hole.x, w.ball.y - w.course.hole.y) > C.HOLE_R + 1) {
            state.lipping = false;
            if (shot && !shot.lipped) {
                shot.lipped = true;
                A.lip();
                R.effects.ring(w.course.hole.x, w.course.hole.y, C.HOLE_R);
                toast('Lipped out!');
            }
        }

        if (w.moving) {
            state.trail.push({ x: w.ball.x, y: w.ball.y });
            if (state.trail.length > 20) state.trail.shift();

            if (P.zoneAt(w.course.sand, w.ball.x, w.ball.y) && now - lastSandAt > 90) {
                lastSandAt = now;
                A.sand();
                R.effects.sand(w.ball.x, w.ball.y, Math.atan2(-w.ball.vy, -w.ball.vx));
            }
        } else if (state.trail.length) {
            state.trail.shift();
        }

        if (ev.splash) {
            A.splash();
            A.buzz(50);
            R.effects.splash(w.ball.x, w.ball.y);
            state.splashAt = now;
            shake = Math.max(shake, 0.5);
        }
        if (w.splash && now - state.splashAt > 650) penaltyReset();

        if (ev.sunk && state.phase === 'rolling') holeComplete(false);
        if (ev.rest && state.phase === 'rolling') {
            state.phase = 'aim';
            state.aim.angle = Math.atan2(w.course.hole.y - w.ball.y, w.course.hole.x - w.ball.x);
            if (outOfStrokes()) {
                holeComplete(true);
            } else {
                var near = Math.hypot(w.course.hole.x - w.ball.x, w.course.hole.y - w.ball.y);
                if (near < C.HOLE_R + 16 && shot && !shot.lipped) toast('So close!');
                else warnLastStroke();
            }
        }

        /* The walk between holes is a pause for a person to follow, so it
           runs on the frame; the caddie's own turn runs on the world's clock,
           which is the one its shots were timed on. */
        if (auto) tickAuto(dt);
        if (sim) tickSim(w.time - before);

        syncPower();
        ctx.clearRect(0, 0, C.WORLD_W, C.WORLD_H);
        state.turned = turned;
        state.res = pixels;
        if (shake > 0 && !reducedMotion()) {
            ctx.save();
            ctx.translate((Math.random() - 0.5) * shake * 6, (Math.random() - 0.5) * shake * 6);
            R.frame(ctx, state, dt);
            ctx.restore();
        } else {
            R.frame(ctx, state, dt);
        }
        shake = Math.max(0, shake - dt * 5);
    }

    /* ── boot ───────────────────────────────────────────────────────────── */

    function init() {
        canvas = $('board');
        ctx = canvas.getContext('2d');

        markSafeZone();
        // First of all: whether this browser has played before is read off
        // the keys the old game wrote, and bootDraw is about to write one.
        PR.init();
        // Before bootCourse and before the picker: a stored preference of
        // 'draw' has to find a card to select, and the picker has to be able
        // to list one.
        bootDraw();
        bootCourse();
        bindCoursePicker();
        bindTopMenu();
        bindTitle();
        bindParty();
        newRound(true);
        if (!GOLF.PLAYTEST) syncCourse();
        bindInput();
        setMuted(A.isMuted());

        $('banner-next').addEventListener('click', advanceHole);
        if (canFullscreen()) {
            $('btn-full').addEventListener('click', toggleFullscreen);
            document.addEventListener('fullscreenchange', syncFullscreen);
            document.addEventListener('webkitfullscreenchange', syncFullscreen);
        } else {
            $('btn-full').style.display = 'none';   // iPhone Safari, mostly
        }
        $('btn-restart').addEventListener('click', restartHole);
        $('btn-sim').addEventListener('click', toggleAuto);
        $('btn-card').addEventListener('click', function () { openCard(null); });
        $('btn-mute').addEventListener('click', function () { setMuted(A.toggleMute()); });
        $('card-close').addEventListener('click', closeCard);
        $('card-again').addEventListener('click', function () {
            if (state.party) startParty(GOLF.COURSE_ID, state.party.players.map(function (p) { return p.name; }));
            else newRound(false);
        });
        $('scorecard').addEventListener('click', function (e) {
            if (e.target === $('scorecard')) closeCard();
        });

        window.addEventListener('resize', resize);
        // The ☰ threshold and the board's size are two answers to the same
        // question — how much room is there — so one listener asks both.
        window.addEventListener('resize', syncCompact);
        resize();
        requestAnimationFrame(loop);
        // The clubhouse door, unless the visit was sent somewhere particular.
        if (!deepLinked()) openTitle();
    }

    GOLF.game = {
        init: init,
        newRound: newRound,
        playCourse: playCourse,
        randomCourseId: randomCourseId,
        newDraw: newDraw,
        openMenu: openMenu,
        closeMenu: closeMenu,
        openTitle: openTitle,
        closeTitle: closeTitle,
        openParty: openParty,
        startParty: startParty,
        resumeParty: resumeParty,
        advanceHole: advanceHole,
        // The caddie, for the suites: on, off, and whether it is walking.
        toggleAuto: toggleAuto,
        autoplay: function () { return !!auto; },
        // For ui-tests.html, whose frame is not promised animation frames:
        // the loop is what notices a ball drop, so the suite calls what the
        // loop would, and checks the pointer mapping against the transform.
        holeComplete: holeComplete,
        toWorld: toWorld,
        resize: resize,
        setScenery: setScenery,
        nextScenery: nextScenery,
        scenery: function () { return scenery; },
        getState: function () { return state; }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window.GOLF);
