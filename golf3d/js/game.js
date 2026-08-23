/* game.js — the round, the shot, and the loop that drives both.
 *
 * ## Where things are
 *
 * This is the top layer and the only one that decides anything. Under it:
 *
 *     config.js      every tuning constant. Nothing else holds a number.
 *     physics.js     the simulation. Pure — no THREE, no DOM.
 *     courses.js     the eighteen holes, as data.
 *     scoring.js     scorecard arithmetic and the save file.
 *     audio.js       synthesised sound.
 *     weather.js     the sky, the wind, and what is drifting in the air.
 *     render.js      the picture (and render/* under it).
 *     bag.js         the club picker.
 *     game/hud.js    the DOM chrome: scoreboard, overlay, modals, panels.
 *
 * What is left here is the four things that are genuinely the game's:
 *
 *   - **the round** — which course, which hole, how many strokes
 *   - **the shot** — what pressing Swing means, and what a settled ball costs
 *   - **input** — pointer, keyboard and the power slider
 *   - **the loop** — advance the simulation, then draw a frame
 *
 * ## The one rule
 *
 * `state` is the whole of the game. It lives here and nowhere else: hud.js is
 * handed a read-only accessor, and render.js is handed a world and an aim a
 * frame at a time. Nothing outside this file writes a stroke, a score or a
 * ball position. Anything that wants to has to go through a function here,
 * which is what keeps "what did that cost me" answerable by reading one file.
 *
 * A shot is simulated at a fixed step regardless of frame rate, so a 144Hz
 * monitor and a 30fps phone roll the ball exactly the same distance — see
 * `CONFIG.SIM_DT`. `?course=&hole=&weather=` open any hole directly, which is
 * how you get to hole 14 without playing thirteen.
 */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var P = G3.physics;
    var S = G3.scoring;
    var A = G3.audio;
    var R = G3.render;
    var H = G3.hud;

    var canvas;
    var state = null;
    var raf = 0, last = 0;
    var lastBounceAt = 0, lastLandAt = 0, lastRimAt = 0;

    function $(id) { return document.getElementById(id); }

    function clubById(id) {
        for (var i = 0; i < C.CLUBS.length; i++) {
            if (C.CLUBS[i].id === id) return C.CLUBS[i];
        }
        return C.CLUBS[0];
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
            aim: { yaw: 0, power: 0, show: true },
            club: clubById(state && state.club ? state.club.id : C.DEFAULT_CLUB),
            drag: null,
            save: state && state.save ? state.save : S.load(),
            phase: 'aim'
        };
        H.closeMenu();
        H.closeCard();
        loadHole(0);
        H.maybeShowFsPrompt();
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
        state.aim.show = true;
        // Point the player at the cup to begin with; it is a suggestion, not a
        // solution — the cup is rarely straight ahead of anything.
        state.aim.yaw = Math.atan2(hole.cup.x - hole.tee.x, hole.cup.z - hole.tee.z);
        look = null;

        // The sky is part of the hole: chosen from the course and the hole
        // number, so it is the same sky every time you come back to this one.
        state.weather = G3.weather
            ? G3.weather.pick(state.course.id, i, state.course.theme)
            : null;
        R.buildHole(hole, state.course.theme, state.weather);
        A.ambience(state.weather);
        R.setCam({ yaw: state.aim.yaw, dist: 9, pitch: 0.46, overview: false });
        R.state.lastBall.set(state.world.ball.x, state.world.ball.y, state.world.ball.z);
        H.hideBanner();
        H.sync();
        H.showHoleCard();
    }

    /* ── the shot ───────────────────────────────────────────────────────── */

    function shoot() {
        if (state.phase !== 'aim') return;
        if (state.aim.power < C.MIN_POWER) return;
        var b = state.world.ball;
        var frac = state.aim.power / state.club.power;
        var lie = P.surfaceUnder(state.world.hole, b.x, b.z, b.y + C.STEP_UP);
        if (!P.launch(state.world, state.aim.yaw, state.aim.power, state.club.loft)) return;

        H.hideHoleCard();
        state.strokes++;
        state.phase = 'rolling';
        H.syncSwing();
        // Everything that says "that was a hit": the spray off the club, the
        // camera flinching, and a thump that grows with the swing.
        R.divot(b.x, b.y - C.BALL_R, b.z, state.aim.yaw, frac, lie && lie.pad.kind);
        R.punch(frac);
        A.putt(frac);
        state.aim.power = 0;
        H.sync();
    }

    /* Picking a club is picking a loft and a ceiling on power. The power
       already loaded is kept as a fraction of the swing, so swapping clubs
       mid-aim changes the shot rather than resetting it. */
    function pickClub(club) {
        if (!club || club === state.club) return;
        var frac = state.aim.power / state.club.power;
        state.club = club;
        state.aim.power = Math.min(club.power, frac * club.power);
        H.syncClubs();
        H.syncPower();
    }

    // dir is +1 or -1; wraps round the bag either way, so a swipe the wrong
    // way just walks backward instead of doing nothing.
    function cycleClub(dir) {
        if (!state) return;
        var n = C.CLUBS.length;
        var i = (C.CLUBS.indexOf(state.club) + dir + n) % n;
        pickClub(C.CLUBS[i]);
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
        if (ev.rim && now - lastRimAt > 55) {
            lastRimAt = now;
            A.rim(P.speedOf(b));
        }
        if (ev.out) A.out();
        if (ev.sunk) R.sinkAt(b.x, b.y + C.CUP_DEPTH, b.z);
    }

    function endShot() {
        var w = state.world;
        if (w.sunk) { holeComplete(); return; }

        if (w.splash || w.out) {
            state.strokes += w.splash ? C.WATER_PENALTY : C.OOB_PENALTY;
            H.toast(w.splash ? 'Water — one stroke penalty' : 'Out of play — one stroke penalty', 'bad');
            state.world = P.createWorld(w.hole, w.origin, w.time);
            R.state.lastBall.set(w.origin.x, w.origin.y, w.origin.z);
        }
        state.phase = 'aim';
        H.sync();
    }

    function holeComplete() {
        var hole = state.course.holes[state.holeIndex];
        state.scores[state.holeIndex] = state.strokes;
        state.phase = 'holed';
        H.syncSwing();

        var t = S.term(state.strokes, hole.par);
        if (t.kind === 'ace') A.ace(); else A.sink();

        H.showBanner(t, state.strokes, hole.par,
            state.holeIndex === state.course.holes.length - 1);
        H.sync();
    }

    function nextHole() {
        H.hideBanner();
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
        H.openCard(res);
    }

    function restartHole() {
        if (state.phase === 'finished') return;
        loadHole(state.holeIndex);
        H.toast('Hole restarted');
    }

    /* W, or the chip under the hole name. It sets an override that lasts the
       round, so a player who wants to see all six holes in the rain can. The
       hole is rebuilt because half of the weather is baked into materials. */
    function cycleWeather() {
        var W = G3.weather;
        if (!W || !state || !state.world) return;
        W.cycle(state.course.theme);
        state.weather = W.pick(state.course.id, state.holeIndex, state.course.theme);
        R.buildHole(state.course.holes[state.holeIndex], state.course.theme, state.weather);
        A.ambience(state.weather);
        H.syncWeather();
        H.showHoleCardIfShowing();
        H.toast(state.weather.icon + '  ' + state.weather.label);
    }

    /* ── input ──────────────────────────────────────────────────────────────

       Three separate things, in the order you do them: aim, load, swing.

       Dragging the course only ever moves the camera and the aim with it —
       sideways turns, up and down tilts — so no gesture out on the glass can
       cost a stroke. Power is loaded on the meter at the bottom, which is a
       real slider you can drag, tab to and nudge with the arrows. The shot
       waits for the Swing button (or space).

       This replaced a slingshot: press, pull away, let go. The pull was one
       fluid gesture and read well on a desktop, but it fused aim and power
       into a single throw you could not correct — every adjustment to one was
       an adjustment to both, and a finger leaving the glass a pixel early was
       a played stroke. Splitting the three lets you line the shot up, look
       around it from any angle, and only then commit. */

    /* Multitouch still matters, but it has far less to lose now: a second
       finger on the glass means pinch-to-zoom, and it takes over from a look
       drag rather than throwing away a loaded shot. A pinch holds the input
       until every finger is off the glass, so a leftover thumb cannot start
       turning the camera on its own. */
    var look = null;         // { id, x, y, yaw, pitch } while dragging the view
    var bagGesture = null;   // { id, x, y, hit, fired } while a press on the
                              // bag or a club is still deciding tap vs. swipe

    var pointers = {};       // live pointers on the canvas, keyed by pointerId
    var pinchIds = null;     // the two the pinch is measuring, so lifting a
                             // third finger cannot swap the pair under it
    var pinchDist = 0;       // their spread at the last sample; 0 = unseeded
    var pinching = false;    // a pinch owns the input until all fingers lift

    function pinchSpread() {
        if (!pinchIds) return 0;
        var a = pointers[pinchIds[0]], b = pointers[pinchIds[1]];
        if (!a || !b) return 0;
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    // Pick the pair to measure and reseed the spread, so the first move after
    // a change of fingers is a delta of zero rather than a lurch.
    function seedPinch() {
        var k = Object.keys(pointers);
        pinchIds = k.length >= 2 ? [k[0], k[1]] : null;
        pinchDist = pinchSpread();
    }

    // Pointer position as three.js wants it: -1..1 with y up.
    function ndcX(e) {
        var r = canvas.getBoundingClientRect();
        return ((e.clientX - r.left) / r.width) * 2 - 1;
    }
    function ndcY(e) {
        var r = canvas.getBoundingClientRect();
        return -((e.clientY - r.top) / r.height) * 2 + 1;
    }

    function onHover(e) {
        if (pinching || look) return;
        if (!G3.bag || !R.pickAt) return;
        var hit = R.pickAt(ndcX(e), ndcY(e));
        var was = G3.bag.state.hover;
        G3.bag.setHover(hit && hit !== 'bag' ? hit : null);
        canvas.style.cursor = hit ? 'pointer' : '';
        // The panel above the row names whatever is under the pointer, so a
        // change of hover is a change of text.
        if (G3.bag.state.hover !== was) H.syncPicker();
    }

    // Put the view back where the drag found it. Used when a pinch takes the
    // gesture over, or when the system cancels it out from under us.
    function cancelLook() {
        if (!look || !state) return;
        state.aim.yaw = look.yaw;
        R.cam.pitch = look.pitch;
        look = null;
    }

    function onDown(e) {
        // A pointer that has already gone cannot be captured; that is not a
        // reason to lose track of it.
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        H.hideHoleCard();
        if (!state) return;

        if (Object.keys(pointers).length >= 2) {
            // Two fingers mean zoom; the look drag they interrupt goes back to
            // where it started rather than ending somewhere half-turned.
            cancelLook();
            pinching = true;
            seedPinch();
            return;
        }
        if (pinching) return;

        // The bag is in front of everything else, so it is asked first: a
        // press that lands on it is a press on the picker, not a shot. Which
        // of those it turns into waits for the release — a swipe over it
        // switches clubs instead, so both gestures share the same press.
        var hit = R.pickAt ? R.pickAt(ndcX(e), ndcY(e)) : null;
        if (hit) {
            bagGesture = { id: e.pointerId, x: e.clientX, y: e.clientY, hit: hit, fired: false };
            return;
        }
        // A press anywhere else shuts the picker rather than turning the view,
        // so the drag that dismisses it cannot also swing the camera round.
        if (G3.bag && G3.bag.isExpanded()) {
            G3.bag.setExpanded(false);
            H.syncPicker();
            return;
        }

        // Looking around is allowed at any time — while the ball rolls too,
        // since the camera is following it and you may want another angle on
        // where it is going.
        look = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: state.aim.yaw, pitch: R.cam.pitch };
    }

    function onMove(e) {
        var p = pointers[e.pointerId];
        if (!p) { onHover(e); return; }
        p.x = e.clientX;
        p.y = e.clientY;

        if (pinching) {
            var d = pinchSpread();
            if (pinchDist > 0 && d > 0) zoom((pinchDist - d) * 0.02);
            pinchDist = d;
            return;
        }

        if (bagGesture && bagGesture.id === e.pointerId) {
            var bdx = e.clientX - bagGesture.x, bdy = e.clientY - bagGesture.y;
            // A clean, mostly-sideways flick past the deadzone is a swipe;
            // anything smaller is still open for a tap on release. Fires once
            // per press, same as a key press would.
            if (!bagGesture.fired && Math.abs(bdx) > 26 && Math.abs(bdx) > Math.abs(bdy) * 1.4) {
                bagGesture.fired = true;
                cycleClub(bdx < 0 ? 1 : -1);
            }
            return;
        }

        if (look && look.id === e.pointerId) {
            // Screen-right spins the view to the right, and dragging down
            // lifts the camera, the way pushing the ground away would.
            state.aim.yaw = look.yaw - (e.clientX - look.x) * 0.008;
            R.cam.pitch = Math.max(0.06, Math.min(1.3, look.pitch + (e.clientY - look.y) * 0.004));
        }
    }

    function onUp(e) {
        if (bagGesture && bagGesture.id === e.pointerId) {
            var fired = bagGesture.fired, hit = bagGesture.hit;
            bagGesture = null;
            forget(e.pointerId);
            if (fired) return;
            if (hit === 'bag') {
                G3.bag.toggle();
                A.tick(G3.bag.isExpanded() ? 0.7 : 0.3);
                H.syncPicker();
            } else {
                pickClub(clubById(hit));
                G3.bag.setExpanded(false);
                A.tick(1);
                H.syncPicker();
            }
            return;
        }
        if (look && look.id === e.pointerId) look = null;
        forget(e.pointerId);
    }

    // The system took the pointer away — a palm, a notification, an edge
    // swipe. Nothing was loaded, so this only puts the view back.
    function onCancel(e) {
        if (bagGesture && bagGesture.id === e.pointerId) { bagGesture = null; forget(e.pointerId); return; }
        if (look && look.id === e.pointerId) cancelLook();
        forget(e.pointerId);
    }

    function forget(id) {
        delete pointers[id];
        if (!pinching) return;
        if (pinchIds && (pinchIds[0] === String(id) || pinchIds[1] === String(id))) seedPinch();
        // The pinch is over only once the glass is clear, so the finger still
        // resting there cannot start a shot on its own.
        if (!Object.keys(pointers).length) { pinching = false; pinchIds = null; pinchDist = 0; }
    }

    /* ── loading the shot ───────────────────────────────────────────────────

       The meter is the only thing that sets power now, so it has to behave
       like a control rather than a readout: press anywhere along it to load
       that much, drag to trim, and the same nudges the arrow keys use. It
       carries a slider role, so a keyboard or a screen reader gets the same
       three moves as a thumb. */

    function setPower(v) {
        if (!state) return;
        state.aim.power = Math.max(0, Math.min(state.club.power, v));
        H.syncPower();
    }

    function nudgePower(by) {
        setPower(state.aim.power + by);
        // A tick on the way up, the way the drawn bow used to sound.
        if (by > 0) A.tick(Math.max(0.1, state.aim.power / state.club.power));
    }

    function nudgeAim(by) {
        if (!state || state.phase !== 'aim') return;
        state.aim.yaw += by;
    }

    function powerFromEvent(e) {
        var track = $('power-track');
        var r = track.getBoundingClientRect();
        if (!r.width) return;
        setPower(((e.clientX - r.left) / r.width) * state.club.power);
    }

    var powerDrag = 0;       // pointerId owning the meter, 0 when nobody is

    function onPowerDown(e) {
        if (!state) return;
        powerDrag = e.pointerId;
        try { $('power-track').setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        powerFromEvent(e);
        e.preventDefault();
    }
    function onPowerMove(e) {
        if (powerDrag !== e.pointerId) return;
        powerFromEvent(e);
    }
    function onPowerUp(e) {
        if (powerDrag !== e.pointerId) return;
        powerDrag = 0;
    }
    function onPowerKey(e) {
        var fine = e.shiftKey;
        // The window handler would otherwise nudge a second time.
        e.stopPropagation();
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { nudgePower(fine ? -0.15 : -0.55); e.preventDefault(); }
        else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { nudgePower(fine ? 0.15 : 0.55); e.preventDefault(); }
        else if (e.key === 'Home') { setPower(0); e.preventDefault(); }
        else if (e.key === 'End') { setPower(state.club.power); e.preventDefault(); }
        else if (e.key === 'Enter' || e.key === ' ') { shoot(); e.preventDefault(); }
    }

    function zoom(delta) {
        R.cam.dist = Math.max(4, Math.min(24, R.cam.dist + delta));
    }

    function onKey(e) {
        if (!state) return;
        var fine = e.shiftKey;
        var k = e.key;

        if (k === 'm' || k === 'M') { H.toggleMute(); return; }
        if (k === 'r' || k === 'R') { restartHole(); return; }
        if (k === 'v' || k === 'V') { H.toggleOverview(); return; }
        if (k === 'f' || k === 'F') { H.toggleFullscreen(); return; }
        if (k === 'w' || k === 'W') { cycleWeather(); return; }
        if (k === '?' || k === 'h' || k === 'H') { H.openHowTo(); return; }
        if (k === 'Escape') {
            if (G3.bag && G3.bag.isExpanded()) { G3.bag.setExpanded(false); H.syncPicker(); return; }
            H.closeHowTo();
            return;
        }
        if (k >= '1' && k <= '9') {
            var byKey = C.CLUBS.filter(function (c) { return c.key === k; })[0];
            if (byKey) { pickClub(byKey); if (G3.bag) G3.bag.setExpanded(false); H.syncPicker(); return; }
        }
        if (k === 'c' || k === 'C') {
            // C cycles; with the bag open it walks the row instead of shutting
            // it, which is how you compare two clubs without the mouse.
            cycleClub(1);
            H.syncPicker();
            return;
        }
        if (k === 'Escape') {
            H.closeTopMenu();
            if (G3.bag && G3.bag.isExpanded()) { G3.bag.setExpanded(false); H.syncPicker(); }
            H.hideHoleCard();
            return;
        }
        if (k === 'b' || k === 'B') {
            if (G3.bag) { G3.bag.toggle(); H.syncPicker(); }
            return;
        }
        if (state.phase === 'holed' && (k === 'Enter' || k === ' ')) { e.preventDefault(); nextHole(); return; }
        if (state.phase !== 'aim') return;

        if (k === 'ArrowLeft') { nudgeAim(fine ? 0.008 : 0.035); e.preventDefault(); }
        else if (k === 'ArrowRight') { nudgeAim(fine ? -0.008 : -0.035); e.preventDefault(); }
        else if (k === 'ArrowUp') { nudgePower(fine ? 0.15 : 0.55); e.preventDefault(); }
        else if (k === 'ArrowDown') { nudgePower(fine ? -0.15 : -0.55); e.preventDefault(); }
        else if (k === ' ') { shoot(); e.preventDefault(); }
    }

    /* ── loop ───────────────────────────────────────────────────────────── */

    function loop(now) {
        raf = requestAnimationFrame(loop);
        var dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!state || !state.world) return;

        if (state.phase === 'rolling') {
            var ev = P.advance(state.world, dt, {});
            handleEvents(ev);
            H.syncDistance();
            if (P.done(state.world)) endShot();
        } else {
            // Gates and blades keep their own time whether or not the ball is
            // rolling, so the preview you aim with is the course you will hit.
            state.world.time += dt;
        }

        // The wind gusts whether or not anything is happening, so the readout
        // under the hole name is refreshed on the frame rather than the shot.
        H.syncWind();

        // The camera sits behind the aim, so turning one turns the other.
        R.cam.yaw = state.aim.yaw;
        R.frame(dt, state.world, {
            show: state.phase === 'aim',
            yaw: state.aim.yaw,
            power: state.aim.power,
            loft: state.club.loft
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

        /* What the chrome is allowed to ask the game to do. This object is the
           whole of it — hud.js has no other way in — so it doubles as the list
           of what a button on the page can set in motion. */
        H.init({
            state: function () { return state; },
            clubById: clubById,
            newRound: newRound
        });

        /* ── the course ─────────────────────────────────────────────────── */
        canvas.addEventListener('pointerdown', onDown);
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', onUp);
        canvas.addEventListener('pointercancel', onCancel);
        canvas.addEventListener('wheel', function (e) {
            e.preventDefault();
            zoom(e.deltaY * 0.004);
        }, { passive: false });
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', function () {
            R.resize();
            H.syncCompact();
            H.measurePickerBand();
        });

        /* ── the shot ───────────────────────────────────────────────────── */
        $('btn-swing').addEventListener('click', shoot);
        $('btn-aim-left').addEventListener('click', function () { nudgeAim(0.035); });
        $('btn-aim-right').addEventListener('click', function () { nudgeAim(-0.035); });
        $('power-track').addEventListener('pointerdown', onPowerDown);
        $('power-track').addEventListener('pointermove', onPowerMove);
        $('power-track').addEventListener('pointerup', onPowerUp);
        $('power-track').addEventListener('pointercancel', onPowerUp);
        $('power-track').addEventListener('keydown', onPowerKey);

        /* ── the round ──────────────────────────────────────────────────── */
        $('banner-next').addEventListener('click', nextHole);
        $('btn-restart').addEventListener('click', restartHole);
        $('btn-weather').addEventListener('click', cycleWeather);
        $('shud-sky').addEventListener('click', cycleWeather);
        $('card-again').addEventListener('click', function () { newRound(state.course.id); });
        $('menu-close').addEventListener('click', function () {
            // Nothing to go back to before a round has started.
            if (state && state.world) H.closeMenu();
        });

        /* ── the chrome ─────────────────────────────────────────────────── */
        H.bindChrome();
        H.setMuteIcon(A.isMuted());

        var q = params();
        state = { save: S.load() };
        // ?weather=rain holds for the whole round, the same as picking it with
        // W would; anything unrecognised is simply ignored.
        if (q.weather && G3.weather) G3.weather.setOverride(q.weather);
        if (q.course) {
            newRound(q.course);
            if (q.hole) {
                var i = Math.max(1, Math.min(state.course.holes.length, parseInt(q.hole, 10) || 1));
                loadHole(i - 1);
            }
        } else {
            // Something has to be on screen behind the menu, and the first hole
            // of the first course is as good an advert as any. A first-time
            // player gets the rules before the course list.
            newRound(G3.COURSES[0].id);
            if (H.seenHowTo()) {
                H.openMenu();
            } else {
                H.setMenuAfterHowTo(true);
                H.openHowTo();
            }
        }

        // One measurement before the first frame, so the bag stands in the
        // right corner of the round rather than the frame after it.
        H.measurePickerBand();

        last = performance.now();
        raf = requestAnimationFrame(loop);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();

    /* What the page and the console can do to a round in progress. Everything
       else is private — including `state`, which is readable and not writable
       on purpose. */
    G3.game = {
        newRound: newRound,
        restartHole: restartHole,
        pickClub: pickClub,
        shoot: shoot,
        cycleWeather: cycleWeather,
        toggleFullscreen: function () { H.toggleFullscreen(); },
        openHowTo: function () { H.openHowTo(); },
        get state() { return state; }
    };

})(window.G3);
