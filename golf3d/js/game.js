/* Game loop, input and the DOM chrome around the canvas.

   The split that matters: this file decides *when* a shot happens and what a
   score means, physics.js decides where the ball goes, render.js decides what
   it looks like. Nothing here integrates anything, so a stutter, a background
   tab or a slow phone can lose frames without ever changing an outcome.

   One wrinkle the flat game did not have: the clock keeps running while you
   aim. Gates slide and blades turn whether or not you have hit the ball, so
   world.time advances every frame and the predicted path is drawn from the
   same clock the shot will be played on. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var P = G3.physics;
    var S = G3.scoring;
    var A = G3.audio;
    var R = G3.render;

    var canvas;
    var state = null;
    var raf = 0, last = 0;
    var lastBounceAt = 0, lastLandAt = 0;

    function $(id) { return document.getElementById(id); }

    function toast(msg, kind) {
        var el = $('toast');
        el.textContent = msg;
        el.className = 'toast show' + (kind ? ' ' + kind : '');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { el.className = 'toast'; }, 2300);
    }

    /* ── round state ────────────────────────────────────────────────────── */

    function newRound(courseId) {
        var course = G3.courseById(courseId);
        state = {
            course: course,
            holeIndex: 0,
            strokes: 0,
            scores: [],
            world: null,
            aim: { yaw: 0, power: 0, loft: 0, show: false, dragging: false },
            drag: null,
            save: state && state.save ? state.save : S.load(),
            phase: 'aim'
        };
        closeMenu();
        closeCard();
        loadHole(0);
    }

    function loadHole(i) {
        var hole = state.course.holes[i];
        state.holeIndex = i;
        state.strokes = 0;
        // Only x/z: createWorld puts the ball on top of the pad, and the tee's
        // own y is the ground there, not the ball's centre.
        state.world = P.createWorld(hole, { x: hole.tee.x, z: hole.tee.z }, 0);
        state.phase = 'aim';
        state.aim.power = 0;
        state.aim.show = false;
        // Point the player at the cup to begin with; it is a suggestion, not a
        // solution — the cup is rarely straight ahead of anything.
        state.aim.yaw = Math.atan2(hole.cup.x - hole.tee.x, hole.cup.z - hole.tee.z);

        R.buildHole(hole, state.course.theme);
        R.setCam({ yaw: state.aim.yaw, dist: 9, pitch: 0.46, overview: false });
        R.state.lastBall.set(state.world.ball.x, state.world.ball.y, state.world.ball.z);
        hideBanner();
        syncHud();
    }

    /* ── the shot ───────────────────────────────────────────────────────── */

    function shoot() {
        if (state.phase !== 'aim') return;
        if (state.aim.power < C.MIN_POWER) return;
        if (!P.launch(state.world, state.aim.yaw, state.aim.power, state.aim.loft)) return;
        state.strokes++;
        state.phase = 'rolling';
        state.aim.show = false;
        A.putt(state.aim.power / C.MAX_POWER);
        state.aim.power = 0;
        syncHud();
    }

    function handleEvents(ev) {
        var b = state.world.ball, now = performance.now();
        if (ev.bounce && now - lastBounceAt > 60) {
            lastBounceAt = now;
            A.bounce(P.groundSpeed(b));
        }
        if (ev.land && now - lastLandAt > 70) {
            lastLandAt = now;
            A.land(P.speedOf(b));
            var s = P.surfaceUnder(state.world.hole, b.x, b.z, b.y + C.STEP_UP);
            if (s && s.pad.kind === 'sand') R.sandAt(b.x, b.y - C.BALL_R, b.z);
        }
        if (ev.splash) {
            R.splashAt(b.x, b.y, b.z);
            A.splash();
        }
        if (ev.out) A.out();
        if (ev.sunk) R.sinkAt(b.x, b.y, b.z);
    }

    function endShot() {
        var w = state.world;
        if (w.sunk) { holeComplete(); return; }

        if (w.splash || w.out) {
            state.strokes += w.splash ? C.WATER_PENALTY : C.OOB_PENALTY;
            toast(w.splash ? 'Water — one stroke penalty' : 'Out of play — one stroke penalty', 'bad');
            state.world = P.createWorld(w.hole, w.origin, w.time);
            R.state.lastBall.set(w.origin.x, w.origin.y, w.origin.z);
        }
        state.phase = 'aim';
        syncHud();
    }

    function holeComplete() {
        var hole = state.course.holes[state.holeIndex];
        state.scores[state.holeIndex] = state.strokes;
        state.phase = 'holed';
        R.hideBall();
        R.setFlagDown(true);

        var t = S.term(state.strokes, hole.par);
        if (t.kind === 'ace') A.ace(); else A.sink();

        var last = state.holeIndex === state.course.holes.length - 1;
        $('banner-term').textContent = t.label;
        $('banner-term').className = 'banner-term ' + t.kind;
        $('banner-detail').textContent = state.strokes + (state.strokes === 1 ? ' stroke' : ' strokes') +
            ' · par ' + hole.par;
        $('banner-next').textContent = last ? 'See the card →' : 'Next hole →';
        $('banner').className = 'banner show';
        syncHud();
    }

    function nextHole() {
        hideBanner();
        if (state.holeIndex < state.course.holes.length - 1) {
            loadHole(state.holeIndex + 1);
        } else {
            finishRound();
        }
    }

    function finishRound() {
        var res = S.recordRound(state.save, state.course.id, state.scores, state.course.holes);
        state.save = S.save(res.save);
        state.phase = 'finished';
        openCard(res);
    }

    function hideBanner() { $('banner').className = 'banner'; }

    function restartHole() {
        if (state.phase === 'finished') return;
        loadHole(state.holeIndex);
        toast('Hole restarted');
    }

    /* ── HUD ────────────────────────────────────────────────────────────── */

    function syncHud() {
        var hole = state.course.holes[state.holeIndex];
        var t = S.totals(state.scores, state.course.holes);
        $('course-name').textContent = state.course.name;
        $('hole-num').textContent = (state.holeIndex + 1) + ' / ' + state.course.holes.length;
        $('hole-name').textContent = hole.name;
        $('hole-blurb').textContent = hole.blurb;
        $('hole-par').textContent = hole.par;
        $('hole-strokes').textContent = state.strokes;
        $('total-strokes').textContent = t.strokes;

        var vs = $('total-vspar');
        vs.textContent = t.played ? S.formatVsPar(t.vsPar) : '—';
        vs.className = 'stat-value ' + (t.vsPar < 0 ? 'under' : t.vsPar > 0 ? 'over' : 'level');

        var rec = S.courseRecord(state.save, state.course.id);
        $('best-round').textContent = rec.best === null
            ? '—'
            : rec.best + ' (' + S.formatVsPar(rec.bestVsPar) + ')';
        syncPower();
    }

    function syncPower() {
        var frac = Math.max(0, Math.min(1, state.aim.power / C.MAX_POWER));
        $('power-fill').style.width = (frac * 100).toFixed(1) + '%';
        $('power-fill').style.background = 'hsl(' + (120 - 120 * frac) + ' 85% 55%)';
        $('loft-val').textContent = Math.round(state.aim.loft * 180 / Math.PI) + '°';
        $('loft').value = Math.round(state.aim.loft * 180 / Math.PI);
    }

    /* ── input ──────────────────────────────────────────────────────────── */

    var YAW_PER_PX = 0.0065;
    var pointers = {};
    var pinchDist = 0;

    function onDown(e) {
        canvas.setPointerCapture(e.pointerId);
        pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        if (Object.keys(pointers).length === 2) {
            pinchDist = twoFingerDistance();
            state.drag = null;
            return;
        }
        if (state.phase !== 'aim') return;
        state.drag = { x: e.clientX, y: e.clientY, yaw: state.aim.yaw };
        state.aim.show = true;
    }

    function twoFingerDistance() {
        var k = Object.keys(pointers);
        if (k.length < 2) return 0;
        var a = pointers[k[0]], b = pointers[k[1]];
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function onMove(e) {
        if (!pointers[e.pointerId]) return;
        pointers[e.pointerId].x = e.clientX;
        pointers[e.pointerId].y = e.clientY;

        if (Object.keys(pointers).length === 2) {
            var d = twoFingerDistance();
            if (pinchDist > 0) zoom((pinchDist - d) * 0.02);
            pinchDist = d;
            return;
        }
        if (!state.drag) return;
        var dx = e.clientX - state.drag.x;
        var dy = e.clientY - state.drag.y;
        // Drag right, aim right: screen-right is -x when the camera sits behind
        // the ball, so the yaw goes the other way.
        state.aim.yaw = state.drag.yaw - dx * YAW_PER_PX;
        state.aim.power = Math.max(0, Math.min(1, dy / C.DRAG_MAX)) * C.MAX_POWER;
        syncPower();
    }

    function onUp(e) {
        delete pointers[e.pointerId];
        pinchDist = 0;
        if (!state.drag) return;
        state.drag = null;
        if (state.aim.power >= C.MIN_POWER) shoot();
        else { state.aim.power = 0; syncPower(); }
    }

    function zoom(delta) {
        R.cam.dist = Math.max(4, Math.min(24, R.cam.dist + delta));
    }

    function setLoft(deg) {
        state.aim.loft = Math.max(0, Math.min(C.MAX_LOFT, deg * Math.PI / 180));
        syncPower();
    }

    function onKey(e) {
        if (!state) return;
        var fine = e.shiftKey;
        var k = e.key;

        if (k === 'm' || k === 'M') { toggleMute(); return; }
        if (k === 'r' || k === 'R') { restartHole(); return; }
        if (k === 'v' || k === 'V') { toggleOverview(); return; }
        if (k === '[') { setLoft(Math.round(state.aim.loft * 180 / Math.PI) - 5); return; }
        if (k === ']') { setLoft(Math.round(state.aim.loft * 180 / Math.PI) + 5); return; }

        if (state.phase === 'holed' && (k === 'Enter' || k === ' ')) { e.preventDefault(); nextHole(); return; }
        if (state.phase !== 'aim') return;

        if (k === 'ArrowLeft') { state.aim.yaw += fine ? 0.008 : 0.035; state.aim.show = true; e.preventDefault(); }
        else if (k === 'ArrowRight') { state.aim.yaw -= fine ? 0.008 : 0.035; state.aim.show = true; e.preventDefault(); }
        else if (k === 'ArrowUp') {
            state.aim.power = Math.min(C.MAX_POWER, state.aim.power + (fine ? 0.15 : 0.55));
            state.aim.show = true; syncPower(); e.preventDefault();
        } else if (k === 'ArrowDown') {
            state.aim.power = Math.max(0, state.aim.power - (fine ? 0.15 : 0.55));
            state.aim.show = true; syncPower(); e.preventDefault();
        } else if (k === ' ') {
            shoot(); e.preventDefault();
        }
    }

    function toggleOverview() {
        R.cam.overview = !R.cam.overview;
        $('btn-view').classList.toggle('on', R.cam.overview);
    }

    function toggleMute() {
        var m = A.toggleMute();
        $('btn-mute').textContent = m ? '🔇' : '🔊';
        $('btn-mute').setAttribute('aria-label', m ? 'Unmute' : 'Mute');
    }

    /* ── menus and cards ────────────────────────────────────────────────── */

    function openMenu() {
        var save = state ? state.save : S.load();
        var host = $('menu-list');
        host.innerHTML = '';
        G3.COURSES.forEach(function (course) {
            var rec = S.courseRecord(save, course.id);
            var par = S.coursePar(course.holes);
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'course-card';
            btn.innerHTML =
                '<span class="cc-name">' + course.name + '</span>' +
                '<span class="cc-blurb">' + course.blurb + '</span>' +
                '<span class="cc-meta">' + course.holes.length + ' holes · par ' + par +
                ' · best ' + (rec.best === null ? '—' : rec.best + ' (' + S.formatVsPar(rec.bestVsPar) + ')') +
                '</span>';
            btn.addEventListener('click', function () { newRound(course.id); });
            host.appendChild(btn);
        });
        $('menu').className = 'modal show';
    }

    function closeMenu() { $('menu').className = 'modal'; }

    function openCard(res) {
        var holes = state.course.holes;
        var rows = '', i, sc, t;
        for (i = 0; i < holes.length; i++) {
            sc = state.scores[i];
            t = typeof sc === 'number' ? S.term(sc, holes[i].par) : null;
            rows += '<tr><td class="n">' + (i + 1) + '</td>' +
                '<td class="nm">' + holes[i].name + '</td>' +
                '<td>' + holes[i].par + '</td>' +
                '<td class="' + (t ? (sc === 1 ? 'ace' : t.kind === 'over' ? 'over' : t.kind === 'par' ? 'level' : 'under') : '') + '">' +
                (typeof sc === 'number' ? sc : '—') + '</td></tr>';
        }
        var tot = res ? res.totals : S.totals(state.scores, holes);
        var par = S.coursePar(holes);
        $('card-title').textContent = res ? 'Round complete' : 'Scorecard';
        $('card-sub').textContent = state.course.name + (res && res.isBest ? ' — a new personal best.' : '');
        $('card-body').innerHTML =
            '<table class="card-table"><thead><tr><th></th><th>Hole</th><th>Par</th><th>Score</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
            '<tfoot><tr><td></td><td>Total</td><td>' + par + '</td><td>' + tot.strokes + '</td></tr>' +
            '<tr><td></td><td>To par</td><td></td><td class="' +
            (tot.vsPar < 0 ? 'under' : tot.vsPar > 0 ? 'over' : 'level') + '">' +
            S.formatVsPar(tot.vsPar) + '</td></tr></tfoot></table>';
        $('scorecard').className = 'modal show';
    }

    function closeCard() { $('scorecard').className = 'modal'; }

    /* ── loop ───────────────────────────────────────────────────────────── */

    function loop(now) {
        raf = requestAnimationFrame(loop);
        var dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!state || !state.world) return;

        if (state.phase === 'rolling') {
            var ev = P.advance(state.world, dt, {});
            handleEvents(ev);
            if (P.done(state.world)) endShot();
        } else {
            // Gates and blades keep their own time whether or not the ball is
            // rolling, so the preview you aim with is the course you will hit.
            state.world.time += dt;
        }

        R.cam.yaw = state.aim.yaw;
        R.frame(dt, state.world, {
            show: state.phase === 'aim' && (state.aim.show || state.aim.power > 0),
            yaw: state.aim.yaw,
            power: state.aim.power,
            loft: state.aim.loft
        });
    }

    /* ── boot ───────────────────────────────────────────────────────────── */

    function params() {
        var out = {};
        (location.search || '').replace(/^\?/, '').split('&').forEach(function (kv) {
            if (!kv) return;
            var p = kv.split('=');
            out[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
        });
        return out;
    }

    function boot() {
        canvas = $('board');
        if (!window.THREE) {
            $('fallback').className = 'fallback show';
            return;
        }
        try {
            R.init(canvas);
        } catch (e) {
            $('fallback').className = 'fallback show';
            return;
        }

        canvas.addEventListener('pointerdown', onDown);
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', onUp);
        canvas.addEventListener('pointercancel', onUp);
        canvas.addEventListener('wheel', function (e) {
            e.preventDefault();
            zoom(e.deltaY * 0.004);
        }, { passive: false });
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', function () { R.resize(); });

        $('banner-next').addEventListener('click', nextHole);
        $('btn-restart').addEventListener('click', restartHole);
        $('btn-courses').addEventListener('click', openMenu);
        $('btn-card').addEventListener('click', function () { openCard(null); });
        $('btn-view').addEventListener('click', toggleOverview);
        $('btn-mute').addEventListener('click', toggleMute);
        $('card-close').addEventListener('click', closeCard);
        $('card-again').addEventListener('click', function () { newRound(state.course.id); });
        $('menu-close').addEventListener('click', function () {
            if (state && state.world) closeMenu();
        });
        $('loft').addEventListener('input', function () { setLoft(parseFloat(this.value)); });

        if (A.isMuted()) $('btn-mute').textContent = '🔇';

        var q = params();
        state = { save: S.load() };
        if (q.course) {
            newRound(q.course);
            if (q.hole) {
                var i = Math.max(1, Math.min(state.course.holes.length, parseInt(q.hole, 10) || 1));
                loadHole(i - 1);
            }
        } else {
            // Something has to be on screen behind the menu, and the first hole
            // of the first course is as good an advert as any.
            newRound(G3.COURSES[0].id);
            openMenu();
        }

        last = performance.now();
        raf = requestAnimationFrame(loop);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();

    G3.game = { newRound: newRound, restartHole: restartHole, get state() { return state; } };

})(window.G3);
