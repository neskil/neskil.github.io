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
    var lastBounceAt = 0, lastLandAt = 0, lastRimAt = 0;

    function $(id) { return document.getElementById(id); }

    function clubById(id) {
        for (var i = 0; i < C.CLUBS.length; i++) {
            if (C.CLUBS[i].id === id) return C.CLUBS[i];
        }
        return C.CLUBS[0];
    }

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
            aim: { yaw: 0, power: 0, show: false, lock: false },
            club: clubById(state && state.club ? state.club.id : C.DEFAULT_CLUB),
            drag: null,
            save: state && state.save ? state.save : S.load(),
            phase: 'aim'
        };
        closeMenu();
        closeCard();
        loadHole(0);
        maybeShowFsPrompt();
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
        camYaw = 0;
        camDrag = null;
        state.aim.lock = false;
        var lockBtn = $('btn-lock-aim');
        if (lockBtn) { lockBtn.classList.remove('on'); lockBtn.textContent = '🔓 Aim'; }

        // The sky is part of the hole: chosen from the course and the hole
        // number, so it is the same sky every time you come back to this one.
        state.weather = G3.weather
            ? G3.weather.pick(state.course.id, i, state.course.theme)
            : null;
        R.buildHole(hole, state.course.theme, state.weather);
        A.ambience(state.weather);
        R.setCam({ yaw: state.aim.yaw, dist: 9, pitch: 0.46, overview: false });
        R.state.lastBall.set(state.world.ball.x, state.world.ball.y, state.world.ball.z);
        hideBanner();
        syncHud();
    }

    /* ── the shot ───────────────────────────────────────────────────────── */

    function shoot() {
        if (state.phase !== 'aim') return;
        if (state.aim.power < C.MIN_POWER) return;
        var b = state.world.ball;
        var frac = state.aim.power / state.club.power;
        var lie = P.surfaceUnder(state.world.hole, b.x, b.z, b.y + C.STEP_UP);
        if (!P.launch(state.world, state.aim.yaw, state.aim.power, state.club.loft)) return;

        state.strokes++;
        state.phase = 'rolling';
        state.aim.show = false;
        // Everything that says "that was a hit": the spray off the club, the
        // camera flinching, and a thump that grows with the swing.
        R.divot(b.x, b.y - C.BALL_R, b.z, state.aim.yaw, frac, lie && lie.pad.kind);
        R.punch(frac);
        A.putt(frac);
        state.aim.power = 0;
        syncHud();
    }

    /* Picking a club is picking a loft and a ceiling on power. The power
       already loaded is kept as a fraction of the swing, so swapping clubs
       mid-aim changes the shot rather than resetting it. */
    function pickClub(club) {
        if (!club || club === state.club) return;
        var frac = state.aim.power / state.club.power;
        state.club = club;
        state.aim.power = Math.min(club.power, frac * club.power);
        syncClubs();
        syncPower();
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

        syncDistance();
        syncClubs();
        syncPower();
        syncWeather();

        // The compact overlay carries the same figures as the scoreboard, for
        // the layouts where the scoreboard is off screen — fullscreen, and the
        // immersive phone layout where the canvas owns the viewport.
        $('shud-hole').textContent = 'Hole ' + (state.holeIndex + 1) + '/' + state.course.holes.length;
        $('shud-name').textContent = hole.name;
        $('shud-par').textContent = 'Par ' + hole.par;
        $('shud-strokes').textContent = state.strokes + (state.strokes === 1 ? ' stroke' : ' strokes');
    }

    /* What the sky is doing, in words, under the hole's name. The wind figure
       is live — it is the same number the flag is answering to, so a gust you
       can see on the cloth is a gust you can read off the panel. */
    function syncWeather() {
        var W = G3.weather;
        if (!W || !state.weather) return;
        $('sky-icon').textContent = state.weather.icon;
        $('sky-label').textContent = state.weather.label;
        $('shud-sky').textContent = state.weather.icon + ' ' + state.weather.label;
    }

    function syncWind() {
        var W = G3.weather;
        if (!W || !state.weather) return;
        var kph = W.windSpeedKph();
        $('sky-wind').textContent = '· ' + (kph < 4 ? 'still' : kph + ' km/h');
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
        syncWeather();
        toast(state.weather.icon + '  ' + state.weather.label);
    }

    // How far there is left to go, which is the number the club choice is
    // really about. Updated every frame while the ball is rolling.
    function syncDistance() {
        var b = state.world.ball, cup = state.course.holes[state.holeIndex].cup;
        var d = Math.hypot(cup.x - b.x, cup.z - b.z);
        var text = state.world.sunk ? 'in' : d.toFixed(1) + ' m';
        $('to-cup').textContent = text;
        $('shud-dist').textContent = text;
    }

    function syncPower() {
        var club = state.club;
        var frac = Math.max(0, Math.min(1, state.aim.power / club.power));
        var hot = frac > C.OVERSWING;
        // Green through amber to red, and the same hue the arrow and the ring
        // are wearing out on the course.
        var hue = hot ? 0 : 120 * (1 - frac / C.OVERSWING);
        $('power-fill').style.width = (frac * 100).toFixed(1) + '%';
        $('power-fill').style.color = $('power-fill').style.background = 'hsl(' + hue + ' 85% 55%)';
        $('power-val').textContent = Math.round(frac * 100) + '%';
        $('power-fill').parentNode.classList.toggle('hot', hot);
    }

    /* The club in hand lives in the bag now — a modelled one, parked in front
       of the camera (see bag.js). What stays in the DOM is the line of text
       under the meter, which doubles as the announcement for anyone who cannot
       see the bag at all. */
    function syncClubs() {
        if (G3.bag) G3.bag.setSelected(state.club.id);
        $('club-hint').textContent = state.club.name + ' — ' + state.club.blurb;
        syncPicker();
    }

    /* The written half of the club picker. The clubs are modelled and turning
       on the canvas; what each one is *for* is text, and text belongs in the
       DOM where it can be read, selected and announced. */
    function syncPicker() {
        var open = !!(G3.bag && G3.bag.isExpanded());
        var el = $('picker');
        el.className = 'picker' + (open ? ' show' : '');
        el.setAttribute('aria-hidden', open ? 'false' : 'true');
        if (!open) return;

        // Whichever club is under the pointer, or the one in hand.
        var id = (G3.bag && G3.bag.state.hover) || state.club.id;
        var club = clubById(id);
        $('picker-name').textContent = club.name;
        $('picker-blurb').textContent = club.blurb;
        $('picker-stats').innerHTML =
            'key <b>' + club.key + '</b> · loft <b>' + Math.round(club.loft * 180 / Math.PI) + '°</b>' +
            ' · full swing <b>' + club.power + '</b>' +
            (club.id === state.club.id ? ' · <b>in hand</b>' : '');
    }

    /* ── input ──────────────────────────────────────────────────────────────

       The shot is a slingshot, and it is one gesture: press anywhere, pull away
       from where you want the ball to go, let go. How far you pull is how hard
       you hit; the *direction* you pull is the direction you do not go.

       Two things make that feel right rather than fiddly. The camera holds
       still for the whole pull — it used to swing one-to-one with sideways
       drag, which spun the world under your thumb just as you were trying to
       be precise — and it eases in behind the shot once the ball is away. And
       power comes from the length of the pull rather than its vertical part, so
       a pull in any direction loads the shot and the aim comes out of the angle
       for free. That is worth a full turn of aim in one gesture, without ever
       touching the camera. */

    /* Multitouch is the part that used to bite. A second finger landing on the
       glass would throw away whatever pull was loaded, leave the power meter
       stuck at the number it died on, and snap the camera round to the
       half-drawn angle — a shot lost to the hand that was only holding the
       phone. Three rules fix it:

         · One finger owns the shot. The pull follows *that* pointer and no
           other, from press to release, so a stray touch cannot move the aim.
         · A loaded pull outranks a pinch. Once the pull is past the deadzone
           the second finger is ignored; before that there is nothing to lose,
           so two fingers mean zoom.
         · A pinch holds the input until every finger is off the glass. A
           leftover finger from a pinch cannot start a shot, which is what
           stopped the aim jumping when one thumb came up before the other.

       Anything that cancels a pull — a pinch that takes it, a pointercancel
       from the system — puts the aim back exactly where the pull found it. */

    /* Locking the aim hands the same swipe to the camera instead of the shot:
       state.aim.yaw stops moving, and the drag that would otherwise load a
       pull turns state.camYaw — a free offset added on top of the locked aim
       for display only — so looking around never touches power or arms a
       shot. Unlocking bakes that offset back into the aim, so the camera does
       not snap and the direction you were just looking becomes the one you
       are aiming. */
    var camYaw = 0;
    var camDrag = null;      // { id, x, startYaw } while locked and dragging
    var bagGesture = null;   // { id, x, y, hit, fired } while a press on the
                              // bag or a club is still deciding tap vs. swipe

    function setAimLock(on) {
        if (!state) return;
        if (state.aim.lock && !on) state.aim.yaw += camYaw;
        state.aim.lock = on;
        camYaw = 0;
        camDrag = null;
        var btn = $('btn-lock-aim');
        if (btn) {
            btn.classList.toggle('on', on);
            btn.textContent = on ? '🔒 Aim' : '🔓 Aim';
        }
    }
    function toggleAimLock() { setAimLock(!(state && state.aim.lock)); }

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
        if (pinching) return;
        if (state && state.drag) return;
        if (!G3.bag || !R.pickAt) return;
        var hit = R.pickAt(ndcX(e), ndcY(e));
        var was = G3.bag.state.hover;
        G3.bag.setHover(hit && hit !== 'bag' ? hit : null);
        canvas.style.cursor = hit ? 'pointer' : '';
        // The panel above the row names whatever is under the pointer, so a
        // change of hover is a change of text.
        if (G3.bag.state.hover !== was) syncPicker();
    }

    // Undo a pull as if it had never started: same aim, same power, same
    // camera. Used when a pinch takes the gesture or the system cancels it.
    function cancelDrag() {
        if (!state || !state.drag) return;
        state.aim.yaw = state.drag.yaw;
        state.aim.power = state.drag.power;
        state.aim.show = state.drag.show;
        state.drag = null;
        syncPower();
    }

    function onDown(e) {
        // A pointer that has already gone cannot be captured; that is not a
        // reason to lose track of it.
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        if (!state) return;

        if (Object.keys(pointers).length >= 2) {
            // A pull worth keeping is worth more than the zoom this would be.
            if (state.drag && state.aim.power > 0) return;
            cancelDrag();
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
        // A press anywhere else shuts the picker; it does not also play a shot,
        // because a click meant for a club that missed should not cost a stroke.
        if (G3.bag && G3.bag.isExpanded()) {
            G3.bag.setExpanded(false);
            syncPicker();
            return;
        }

        if (state.phase !== 'aim') return;

        if (state.aim.lock) {
            // Locked, the same press turns the camera instead of the shot: no
            // power, no drag, so releasing it can never fire.
            camDrag = { id: e.pointerId, x: e.clientX, startYaw: camYaw };
            return;
        }

        state.drag = {
            id: e.pointerId, x: e.clientX, y: e.clientY, notch: 0,
            yaw: state.aim.yaw, power: state.aim.power, show: state.aim.show,
            camYaw: R.cam.yaw
        };
        state.aim.show = true;
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

        if (camDrag && camDrag.id === e.pointerId) {
            // Screen-right spins the view the same way a shot pull would send
            // the ball the other way, so a swipe here reads like the one you
            // already know: right goes right.
            camYaw = camDrag.startYaw - (e.clientX - camDrag.x) * 0.012;
            return;
        }

        if (!state || !state.drag || state.drag.id !== e.pointerId) return;
        var dx = e.clientX - state.drag.x;
        var dy = e.clientY - state.drag.y;
        var pull = Math.hypot(dx, dy);

        if (pull < C.DRAG_DEADZONE) {
            // Too small to mean anything: leave the aim where it was rather
            // than letting a twitch spin it.
            state.aim.power = 0;
            syncPower();
            return;
        }

        /* The ball leaves along the reverse of the pull. Screen-right is world
           -x with the camera behind the ball, which is why pulling toward the
           bottom-right sends it away to the left. */
        state.aim.yaw = state.drag.camYaw + Math.atan2(dx, dy);
        state.aim.power = Math.min(1, pull / C.DRAG_MAX) * state.club.power;

        // A ratchet as the power winds on, one notch per tenth. It is the
        // difference between a slider and a drawn bow.
        var notch = Math.floor((state.aim.power / state.club.power) * 10);
        if (notch !== state.drag.notch) {
            state.drag.notch = notch;
            if (notch > 0) A.tick(notch / 10);
        }
        syncPower();
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
                syncPicker();
            } else {
                pickClub(clubById(hit));
                G3.bag.setExpanded(false);
                A.tick(1);
                syncPicker();
            }
            return;
        }
        if (camDrag && camDrag.id === e.pointerId) {
            camDrag = null;
            forget(e.pointerId);
            return;
        }
        var owned = !!(state && state.drag && state.drag.id === e.pointerId);
        forget(e.pointerId);
        if (!owned) return;
        state.drag = null;
        if (state.aim.power >= C.MIN_POWER) shoot();
        else { state.aim.power = 0; syncPower(); }
    }

    // The system took the pointer away — a palm, a notification, an edge
    // swipe. That is not a shot, so put the aim back.
    function onCancel(e) {
        if (bagGesture && bagGesture.id === e.pointerId) { bagGesture = null; forget(e.pointerId); return; }
        if (camDrag && camDrag.id === e.pointerId) { camDrag = null; forget(e.pointerId); return; }
        var owned = !!(state && state.drag && state.drag.id === e.pointerId);
        forget(e.pointerId);
        if (owned) cancelDrag();
    }

    function forget(id) {
        delete pointers[id];
        if (!pinching) return;
        if (pinchIds && (pinchIds[0] === String(id) || pinchIds[1] === String(id))) seedPinch();
        // The pinch is over only once the glass is clear, so the finger still
        // resting there cannot start a shot on its own.
        if (!Object.keys(pointers).length) { pinching = false; pinchIds = null; pinchDist = 0; }
    }

    function zoom(delta) {
        R.cam.dist = Math.max(4, Math.min(24, R.cam.dist + delta));
    }

    function onKey(e) {
        if (!state) return;
        var fine = e.shiftKey;
        var k = e.key;

        if (k === 'm' || k === 'M') { toggleMute(); return; }
        if (k === 'r' || k === 'R') { restartHole(); return; }
        if (k === 'v' || k === 'V') { toggleOverview(); return; }
        if (k === 'f' || k === 'F') { toggleFullscreen(); return; }
        if (k === 'w' || k === 'W') { cycleWeather(); return; }
        if (k === '?' || k === 'h' || k === 'H') { openHowTo(); return; }
        if (k === 'Escape') {
            if (G3.bag && G3.bag.isExpanded()) { G3.bag.setExpanded(false); syncPicker(); return; }
            closeHowTo();
            return;
        }
        if (k >= '1' && k <= '9') {
            var byKey = C.CLUBS.filter(function (c) { return c.key === k; })[0];
            if (byKey) { pickClub(byKey); if (G3.bag) G3.bag.setExpanded(false); syncPicker(); return; }
        }
        if (k === 'c' || k === 'C') {
            // C cycles; with the bag open it walks the row instead of shutting
            // it, which is how you compare two clubs without the mouse.
            cycleClub(1);
            syncPicker();
            return;
        }
        if (k === 'b' || k === 'B') {
            if (G3.bag) { G3.bag.toggle(); syncPicker(); }
            return;
        }
        if (k === 'l' || k === 'L') {
            toggleAimLock();
            return;
        }

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

    /* Fullscreen is on the stage, not the document, so the canvas and every
       overlay inside it (power, clubs, banner, toast) come along and the page
       chrome does not. Vendor-prefixed for the Safaris that still need it. */
    function fullscreenElement() {
        return document.fullscreenElement || document.webkitFullscreenElement || null;
    }

    function toggleFullscreen() {
        var stage = $('stage');
        if (fullscreenElement()) {
            (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else if (stage.requestFullscreen || stage.webkitRequestFullscreen) {
            (stage.requestFullscreen || stage.webkitRequestFullscreen).call(stage);
        } else {
            toast('This browser will not do fullscreen here');
        }
    }

    function onFullscreenChange() {
        var on = !!fullscreenElement();
        $('btn-full').classList.toggle('on', on);
        document.body.classList.toggle('is-full', on);
        if (on) dismissFsPrompt(false);
        // The canvas has a new size the moment the browser swaps modes, and
        // again when it swaps back.
        setTimeout(function () { R.resize(); }, 60);
    }

    /* The chip in the topbar does the same job, but it is one small icon among
       six others and easy to never notice. This is the same offer said once,
       plainly, right where a round starts — and it remembers being waved off,
       so it is not something to dismiss twice. */
    function fsPromptDismissed() {
        try { return localStorage.getItem(C.FS_PROMPT_KEY) === '1'; } catch (e) { return false; }
    }
    function dismissFsPrompt(remember) {
        $('fs-prompt').classList.remove('show');
        if (remember) { try { localStorage.setItem(C.FS_PROMPT_KEY, '1'); } catch (e) { /* ignore */ } }
    }
    function maybeShowFsPrompt() {
        if (fsPromptDismissed() || fullscreenElement()) return;
        if (!($('stage').requestFullscreen || $('stage').webkitRequestFullscreen)) return;
        $('fs-prompt').classList.add('show');
    }

    var menuAfterHowTo = false;

    function openHowTo() { $('howto').className = 'modal show'; }

    function closeHowTo() {
        $('howto').className = 'modal';
        try { localStorage.setItem(C.SEEN_KEY, '1'); } catch (e) { /* ignore */ }
        // On a first visit the rules come before the course list, so the list
        // is what you get when you have read them.
        if (menuAfterHowTo) { menuAfterHowTo = false; openMenu(); }
    }

    function seenHowTo() {
        try { return localStorage.getItem(C.SEEN_KEY) === '1'; } catch (e) { return true; }
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
            syncDistance();
            if (P.done(state.world)) endShot();
        } else {
            // Gates and blades keep their own time whether or not the ball is
            // rolling, so the preview you aim with is the course you will hit.
            state.world.time += dt;
        }

        // The wind gusts whether or not anything is happening, so the readout
        // under the hole name is refreshed on the frame rather than the shot.
        syncWind();

        R.cam.yaw = state.drag ? state.drag.camYaw : state.aim.yaw + (state.aim.lock ? camYaw : 0);
        R.frame(dt, state.world, {
            show: state.phase === 'aim' && (state.aim.show || state.aim.power > 0),
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

        canvas.addEventListener('pointerdown', onDown);
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', onUp);
        canvas.addEventListener('pointercancel', onCancel);
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
        $('btn-lock-aim').addEventListener('click', toggleAimLock);
        $('fs-prompt-go').addEventListener('click', function () { dismissFsPrompt(true); toggleFullscreen(); });
        $('fs-prompt-dismiss').addEventListener('click', function () { dismissFsPrompt(true); });
        $('btn-full').addEventListener('click', toggleFullscreen);
        $('btn-help').addEventListener('click', openHowTo);
        $('btn-help-2').addEventListener('click', openHowTo);
        $('btn-mute').addEventListener('click', toggleMute);
        $('btn-weather').addEventListener('click', cycleWeather);
        $('howto-close').addEventListener('click', closeHowTo);
        $('howto').addEventListener('click', function (e) { if (e.target === this) closeHowTo(); });
        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        $('card-close').addEventListener('click', closeCard);
        $('card-again').addEventListener('click', function () { newRound(state.course.id); });
        $('menu-close').addEventListener('click', function () {
            if (state && state.world) closeMenu();
        });

        if (A.isMuted()) $('btn-mute').textContent = '🔇';

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
            if (seenHowTo()) {
                openMenu();
            } else {
                menuAfterHowTo = true;
                openHowTo();
            }
        }

        last = performance.now();
        raf = requestAnimationFrame(loop);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();

    G3.game = {
        newRound: newRound,
        restartHole: restartHole,
        pickClub: pickClub,
        toggleFullscreen: toggleFullscreen,
        openHowTo: openHowTo,
        get state() { return state; }
    };

})(window.G3);
