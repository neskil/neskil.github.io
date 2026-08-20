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

    /* A playtest is the editor handing over a single hole. It is not a round:
       it must neither resume the one you have going nor overwrite it, so every
       call into the round store goes through these two and stops here. */
    function storeRound(i) {
        if (!GOLF.PLAYTEST) S.saveRound(i, state.scores, GOLF.COURSE);
    }

    function clearStoredRound() {
        if (!GOLF.PLAYTEST) S.clearRound();
    }

    /* `resume` is true only on boot. Every other caller — the Play again
       button, a fresh start — means a new round and says so. */
    function newRound(resume) {
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
            splashAt: 0
        };
        if (carry) state.scores = carry.scores;
        loadHole(carry ? carry.holeIndex : 0);
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
        if (!P.launch(state.world, a.angle, power)) return;

        state.strokes++;
        state.phase = 'rolling';
        state.trail = [];
        a.active = false;
        a.power = 0;
        a.origin = null;
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
        if (GOLF.PLAYTEST) {
            res = { save: state.save, isBest: false, totals: S.totals(state.scores, GOLF.COURSE) };
        } else {
            clearStoredRound();
            res = S.recordRound(state.save, state.scores, GOLF.COURSE);
            state.save = S.save(res.save);
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
        var btn = $('btn-full');
        btn.textContent = on ? '⤡' : '⛶';
        btn.setAttribute('aria-label', on ? 'Leave fullscreen' : 'Fullscreen');
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
    function syncPower() {
        var a = state.aim;
        var showing = a.active && state.phase === 'aim';
        var frac = showing ? Math.max(0, Math.min(1, a.power / C.MAX_POWER)) : 0;
        var el = $('power');
        el.classList.toggle('show', showing);
        $('power-fill').style.clipPath = 'inset(0 ' + ((1 - frac) * 100).toFixed(1) + '% 0 0)';
        el.classList.toggle('hot', frac > 0.82);
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

        newRound(true);
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
