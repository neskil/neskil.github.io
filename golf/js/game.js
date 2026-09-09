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

    var canvas, ctx, scale = 1;
    var state = null;
    var lastBounceAt = 0;
    var lastSandAt = 0;

    /* ── helpers ────────────────────────────────────────────────────────── */

    function $(id) { return document.getElementById(id); }

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
        if (!wanted) {
            try { wanted = localStorage.getItem(C.COURSE_KEY); } catch (e) { /* storage off */ }
        }
        // selectCourse answers null for an id that is not on the rack, which
        // is the whole handling it needs: stay on the default.
        if (wanted) GOLF.selectCourse(wanted);
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
        return !GOLF.PLAYTEST && !(course && course.record === false);
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
    }

    /* Switching is not destructive and does not ask. The card for the course
       you are leaving was written when you holed out on it, and each course
       resumes from its own key, so coming back puts you on the tee of the
       hole you left — the same promise a refresh makes. Every route onto a
       course goes through here: the picker, the die, and the boot. */
    function playCourse(id, how, startAt) {
        if (!GOLF.selectCourse(id)) return false;
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
        var pool = GOLF.COURSES.filter(function (c) { return c.id !== GOLF.COURSE_ID; });
        if (!pool.length) return null;
        return pool[Math.floor(Math.random() * pool.length)].id;
    }

    // Answers whether it actually dealt one, so a caller that latches itself
    // against a second press does not stay latched on a press that did
    // nothing.
    function dealRandomCourse() {
        if (GOLF.PLAYTEST) return false;
        var id = randomCourseId();
        if (!id) { toast('Only one course on the rack'); return false; }
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
        drawCourses();
        $('menu').classList.add('show');
        var first = $('menu-list').querySelector('.cc-head');
        if (first) { try { first.focus(); } catch (e) { /* ignore */ } }
        drawPlans();
    }

    function closeMenu() { $('menu').classList.remove('show'); }

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
    function courseMeta(course) {
        var bits = [course.holes.length + ' holes', 'par ' + GOLF.coursePar(course.holes)];
        if (course.record === false) {
            // A draw holds no record, and saying "best —" for ever reads as a
            // record nobody has managed rather than as a rule.
            bits.push('not recorded');
        } else {
            var rec = S.load(course.id);
            bits.push('best ' + (rec.best === null
                ? '\u2014'
                : rec.best + ' (' + S.formatVsPar(rec.bestVsPar) + ')'));
        }
        var seed = typeof course.seed === 'number' ? course.seed : null;
        var carry = S.loadRound(course.holes, course.id, seed);
        if (carry) bits.push('resumes at hole ' + (carry.holeIndex + 1));
        return bits.join(' \u00b7 ');
    }

    function drawCourses() {
        var host = $('menu-list');
        host.innerHTML = '';

        GOLF.COURSES.forEach(function (course) {
            var here = course.id === GOLF.COURSE_ID;
            // Open from the start on a wide screen, where a strip of plans has
            // never crowded anything out. On a phone only the card you are
            // standing on starts open.
            var opened = !document.body.classList.contains('compact-ui') || here;
            var stripId = 'cc-holes-' + course.id;
            var card = document.createElement('div');
            card.className = 'course-card' + (here ? ' playing' : '') +
                (opened ? ' expanded' : '');

            var topRow = document.createElement('div');
            topRow.className = 'cc-top';

            // The head is the whole card except the plans: pressing it starts
            // this course the way choosing it from the old menu did, which is
            // to say from wherever you left it.
            var head = document.createElement('button');
            head.type = 'button';
            head.className = 'cc-head';
            head.innerHTML =
                '<span class="cc-name">' + course.name +
                (here ? '<span class="cc-here">playing</span>' : '') + '</span>' +
                '<span class="cc-blurb">' + course.blurb + '</span>' +
                '<span class="cc-meta">' + courseMeta(course) + '</span>';
            head.addEventListener('click', function () { takeCourse(course.id); });
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
                cell.title = hole.name + ' \u2014 par ' + hole.par;
                // Read back by the plan pass rather than counted out of the
                // DOM, so the order above is free to change.
                cell.setAttribute('data-course', course.id);
                cell.setAttribute('data-hole', i);
                cell.innerHTML =
                    '<canvas class="cc-map" aria-hidden="true"></canvas>' +
                    '<span class="cc-num">' + (i + 1) + '</span>' +
                    '<span class="cc-par">' + hole.par + '</span>';
                cell.addEventListener('click', function () { takeCourse(course.id, i); });
                strip.appendChild(cell);
            });
            card.appendChild(strip);
            host.appendChild(card);
        });

        host.scrollTop = 0;
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
       call into the round store goes through these two and stops here. */
    function storeRound(i) {
        if (!GOLF.PLAYTEST) S.saveRound(i, state.scores, GOLF.COURSE);
    }

    function clearStoredRound() {
        if (!GOLF.PLAYTEST) S.clearRound();
    }

    /* `resume` is true on boot and on any switch that did not name a hole.
       Every other caller — the Play again button, a plan pressed in the
       picker — means a new round and says so; `startAt` is where that new
       round tees off, which is the first hole unless a plan named another. */
    function newRound(resume, startAt) {
        var carry = (resume && !GOLF.PLAYTEST) ? S.loadRound(GOLF.COURSE) : null;
        if (!carry) clearStoredRound();
        state = {
            holeIndex: 0,
            strokes: 0,
            scores: [],
            world: null,
            aim: { active: false, angle: 0, power: 0, keyboard: false, origin: null },
            trail: [],
            save: S.load(),
            phase: 'aim',          // aim | rolling | holed | finished
            lastFrac: null,        // weight of the last shot on this hole, 0..1
            splashAt: 0
        };
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
        R.effects.clear();
        $('banner').classList.remove('show');
        storeRound(i);
        syncHud();
    }

    function syncHud() {
        var hole = GOLF.COURSE[state.holeIndex];
        $('hole-num').textContent = (state.holeIndex + 1) + ' / ' + GOLF.COURSE.length;
        $('hole-name').textContent = hole.name;
        $('hole-blurb').textContent = hole.blurb;
        $('hole-par').textContent = hole.par;
        $('hole-strokes').textContent = state.strokes;

        var t = S.totals(state.scores, GOLF.COURSE);
        $('total-strokes').textContent = t.strokes;
        var vs = $('total-vspar');
        vs.textContent = t.played ? S.formatVsPar(t.vsPar) : '—';
        vs.className = 'stat-value ' + (t.played === 0 ? '' : t.vsPar < 0 ? 'under' : t.vsPar > 0 ? 'over' : 'level');

        var best = $('best-round');
        best.textContent = state.save.best === null
            ? '—'
            : state.save.best + ' (' + S.formatVsPar(state.save.bestVsPar) + ')';
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
        a.active = false;
        a.power = 0;
        a.origin = null;
        A.putt(power / C.MAX_POWER);
        // Divot: whatever the ball is standing on sprays backwards.
        var inSand = P.zoneAt(state.world.course.sand, state.world.ball.x, state.world.ball.y);
        (inSand ? R.effects.sand : R.effects.turf)(state.world.ball.x, state.world.ball.y, fired + Math.PI);
        syncHud();
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
        state.trail = [];
        state.phase = 'aim';
        toast('Water hazard — one stroke penalty', 'bad');
        syncHud();
    }

    function holeComplete() {
        var hole = GOLF.COURSE[state.holeIndex];
        state.scores[state.holeIndex] = state.strokes;
        state.phase = 'holed';

        var term = S.term(state.strokes, hole.par);
        R.effects.sink(hole.hole.x, hole.hole.y);
        if (term.kind === 'ace') {
            A.ace();
            R.effects.confetti(C.WORLD_W, C.WORLD_H);
        } else {
            A.sink();
            if (term.kind === 'great' || term.kind === 'good') R.effects.confetti(C.WORLD_W, C.WORLD_H);
        }

        var last = state.holeIndex === GOLF.COURSE.length - 1;
        // Written now rather than on the next tee, so closing the tab on the
        // banner keeps the hole you just finished.
        if (!last) storeRound(state.holeIndex + 1);
        $('banner-term').textContent = term.label;
        $('banner-term').className = 'banner-term ' + term.kind;
        $('banner-detail').textContent = state.strokes + ' stroke' + (state.strokes === 1 ? '' : 's') +
            ' · par ' + hole.par;
        $('banner-next').textContent = last ? 'See scorecard' : 'Next hole →';
        $('banner').classList.add('show');
        syncHud();
    }

    function advanceHole() {
        if (state.phase !== 'holed') return;
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

    /* ── scorecard ──────────────────────────────────────────────────────── */

    function openCard(res) {
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
        } else if (!isRecorded()) {
            // Not an apology: a draw nobody else has played has no record to
            // beat, and pretending otherwise would put a nine-hole score up
            // against the eighteen.
            summary = t.strokes + ' strokes, ' + S.formatVsPar(t.vsPar) +
                ' · not recorded — no two draws are the same course';
        } else {
            summary = t.strokes + ' strokes, ' + S.formatVsPar(t.vsPar) + ' · best ' +
                (state.save.best === null ? '—' : state.save.best) +
                ' · ' + state.save.rounds + ' round' + (state.save.rounds === 1 ? '' : 's') +
                ' · ' + state.save.aces + ' ace' + (state.save.aces === 1 ? '' : 's');
        }
        $('card-sub').textContent = summary;
        $('card-again').style.display = res ? '' : 'none';
        $('scorecard').classList.add('show');
    }

    function closeCard() { $('scorecard').classList.remove('show'); }

    /* ── input ──────────────────────────────────────────────────────────── */

    function toWorld(e) {
        var r = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - r.left) / r.width * C.WORLD_W,
            y: (e.clientY - r.top) / r.height * C.WORLD_H
        };
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
            if (!state.aim.active || state.aim.keyboard || state.phase !== 'aim') return;
            aimFrom(toWorld(e));
        });

        function release(e) {
            if (!state.aim.active || state.aim.keyboard) return;
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
            if (k === 'r' || k === 'R') { restartHole(); return; }
            if (k === 'c' || k === 'C') { openMenu(); return; }
            if (k === 'd' || k === 'D') { dealRandomCourse(); return; }
            if (k === 'g' || k === 'G') { newDraw(); return; }
            // One key shuts whatever is open, and the panel counts: a ☰ left
            // hanging over the board is chrome with no way off it on a
            // keyboard.
            if (k === 'Escape') { closeCard(); closeMenu(); closeTopMenu(); return; }

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
        if (state.phase === 'finished') return;
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
        var meter = $('power').offsetHeight + 10;   // always on, even in fullscreen
        var room = window.innerHeight - top - pad - meter;
        var tight = !full && (room - chromeH) < C.WORLD_H * 0.7;
        document.body.classList.toggle('is-tight', tight);

        var availH = room - ((full || tight) ? 0 : chromeH);
        var availW = wrap.clientWidth;
        scale = Math.max(0.3, Math.min(availW / C.WORLD_W, availH / C.WORLD_H));

        // Keep the backing store sane: a 4K monitor at devicePixelRatio 2 would
        // otherwise ask for a 10-megapixel canvas to redraw sixty times a second.
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (scale * dpr > 3) dpr = 3 / scale;

        canvas.width = Math.round(C.WORLD_W * scale * dpr);
        canvas.height = Math.round(C.WORLD_H * scale * dpr);
        canvas.style.width = Math.round(C.WORLD_W * scale) + 'px';
        canvas.style.height = Math.round(C.WORLD_H * scale) + 'px';
        ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
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

    function syncFullscreen() {
        var on = !!fullscreenEl();
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
        var ev = P.advance(w, dt, {});

        if (ev.bumper && now - lastBounceAt > 45) {
            lastBounceAt = now;
            A.bumper(P.speedOf(w.ball));
            R.effects.spark(w.ball.x, w.ball.y);
            R.effects.ring(w.ball.x, w.ball.y, C.BALL_R + 6);
        } else if (ev.bounce && now - lastBounceAt > 45) {
            lastBounceAt = now;
            A.bounce(P.speedOf(w.ball));
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
            R.effects.splash(w.ball.x, w.ball.y);
            state.splashAt = now;
        }
        if (w.splash && now - state.splashAt > 650) penaltyReset();

        if (ev.sunk && state.phase === 'rolling') holeComplete();
        if (ev.rest && state.phase === 'rolling') {
            state.phase = 'aim';
            state.aim.angle = Math.atan2(w.course.hole.y - w.ball.y, w.course.hole.x - w.ball.x);
        }

        syncPower();
        ctx.clearRect(0, 0, C.WORLD_W, C.WORLD_H);
        R.frame(ctx, state, dt);
    }

    /* ── boot ───────────────────────────────────────────────────────────── */

    function init() {
        canvas = $('board');
        ctx = canvas.getContext('2d');

        markSafeZone();
        // Before bootCourse and before the picker: a stored preference of
        // 'draw' has to find a card to select, and the picker has to be able
        // to list one.
        bootDraw();
        bootCourse();
        bindCoursePicker();
        bindTopMenu();
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
        $('btn-card').addEventListener('click', function () { openCard(null); });
        $('btn-mute').addEventListener('click', function () { setMuted(A.toggleMute()); });
        $('card-close').addEventListener('click', closeCard);
        $('card-again').addEventListener('click', function () { newRound(false); });
        $('scorecard').addEventListener('click', function (e) {
            if (e.target === $('scorecard')) closeCard();
        });

        window.addEventListener('resize', resize);
        // The ☰ threshold and the board's size are two answers to the same
        // question — how much room is there — so one listener asks both.
        window.addEventListener('resize', syncCompact);
        resize();
        requestAnimationFrame(loop);
    }

    GOLF.game = {
        init: init,
        newRound: newRound,
        playCourse: playCourse,
        randomCourseId: randomCourseId,
        newDraw: newDraw,
        openMenu: openMenu,
        closeMenu: closeMenu,
        getState: function () { return state; }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window.GOLF);
