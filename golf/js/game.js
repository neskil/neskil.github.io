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

    /* ── round state ────────────────────────────────────────────────────── */

    function newRound() {
        state = {
            holeIndex: 0,
            strokes: 0,
            scores: [],
            world: null,
            aim: { active: false, angle: 0, power: 0, keyboard: false },
            trail: [],
            save: S.load(),
            phase: 'aim',          // aim | rolling | holed | finished
            splashAt: 0
        };
        loadHole(0);
        closeCard();
        syncHud();
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
        state.aim.angle = Math.atan2(hole.hole.y - hole.tee.y, hole.hole.x - hole.tee.x);
        state.phase = 'aim';
        R.effects.clear();
        $('banner').classList.remove('show');
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
        if (!P.launch(state.world, a.angle, power)) return;

        state.strokes++;
        state.phase = 'rolling';
        state.trail = [];
        a.active = false;
        a.power = 0;
        A.putt(power / C.MAX_POWER);
        // Divot: whatever the ball is standing on sprays backwards.
        var inSand = P.zoneAt(state.world.course.sand, state.world.ball.x, state.world.ball.y);
        (inSand ? R.effects.sand : R.effects.turf)(state.world.ball.x, state.world.ball.y, a.angle + Math.PI);
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
        var res = S.recordRound(state.save, state.scores, GOLF.COURSE);
        state.save = S.save(res.save);
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
        $('card-sub').textContent = res
            ? t.strokes + ' strokes, ' + S.formatVsPar(t.vsPar) + ' · best ' +
              (state.save.best === null ? '—' : state.save.best) +
              ' · ' + state.save.rounds + ' round' + (state.save.rounds === 1 ? '' : 's') +
              ' · ' + state.save.aces + ' ace' + (state.save.aces === 1 ? '' : 's')
            : 'Through ' + t.played + ' hole' + (t.played === 1 ? '' : 's');
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
        var b = state.world.ball;
        // Pull back away from the target, slingshot style: the ball leaves
        // along the line from the pointer to the ball.
        var dx = b.x - p.x, dy = b.y - p.y;
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
            aimFrom(toWorld(e));
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
        }
        canvas.addEventListener('pointerup', release);
        canvas.addEventListener('pointercancel', function () {
            state.aim.active = false;
            state.aim.power = 0;
        });

        /* Keyboard play is a first-class path, not an afterthought: aim with
           the arrows, set power with up/down, hit with space. It is also the
           only way to play this precisely on a trackpad. */
        window.addEventListener('keydown', function (e) {
            if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
            var a = state.aim;
            var k = e.key;

            if (k === 'm' || k === 'M') { setMuted(A.toggleMute()); return; }
            if (k === 'r' || k === 'R') { restartHole(); return; }
            if (k === 'Escape') { closeCard(); return; }

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

    function setMuted(m) {
        $('btn-mute').textContent = m ? '🔇' : '🔊';
        $('btn-mute').setAttribute('aria-label', m ? 'Unmute' : 'Mute');
    }

    /* ── loop ───────────────────────────────────────────────────────────── */

    function resize() {
        var wrap = $('stage');
        var w = wrap.clientWidth;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        scale = w / C.WORLD_W;
        canvas.width = Math.round(C.WORLD_W * scale * dpr);
        canvas.height = Math.round(C.WORLD_H * scale * dpr);
        canvas.style.height = Math.round(C.WORLD_H * scale) + 'px';
        ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    }

    var lastT = 0;

    function loop(now) {
        requestAnimationFrame(loop);
        var dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 0.016;
        lastT = now;

        var w = state.world;
        var ev = P.advance(w, dt, {});

        if (ev.bounce && now - lastBounceAt > 45) {
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

        ctx.clearRect(0, 0, C.WORLD_W, C.WORLD_H);
        R.frame(ctx, state, dt);
    }

    /* ── boot ───────────────────────────────────────────────────────────── */

    function init() {
        canvas = $('board');
        ctx = canvas.getContext('2d');

        newRound();
        bindInput();
        setMuted(A.isMuted());

        $('banner-next').addEventListener('click', advanceHole);
        $('btn-restart').addEventListener('click', restartHole);
        $('btn-card').addEventListener('click', function () { openCard(null); });
        $('btn-mute').addEventListener('click', function () { setMuted(A.toggleMute()); });
        $('card-close').addEventListener('click', closeCard);
        $('card-again').addEventListener('click', function () { newRound(); });
        $('scorecard').addEventListener('click', function (e) {
            if (e.target === $('scorecard')) closeCard();
        });

        window.addEventListener('resize', resize);
        resize();
        requestAnimationFrame(loop);
    }

    GOLF.game = { init: init, newRound: newRound, getState: function () { return state; } };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window.GOLF);
