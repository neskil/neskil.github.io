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
    var SW = G3.swing;

    var canvas;
    var state = null;
    var raf = 0, last = 0;
    var lastBounceAt = 0, lastLandAt = 0, lastRimAt = 0;

    function $(id) { return document.getElementById(id); }

    /* The bag this hole is played out of, and finding a club inside it. Most
       holes are the whole default bag; some name their own (courses.bagFor),
       and on those a club that is not in the bag is not a club — asking for it
       by id, by number key or by cycling gets you the first one that is. */
    function bag() {
        return (state && state.bag) || C.CLUBS;
    }

    function clubById(id) {
        var b = bag(), i;
        for (i = 0; i < b.length; i++) if (b[i].id === id) return b[i];
        return b[0];
    }

    function toast(msg, kind) {
        var el = $('toast');
        el.textContent = msg;
        el.className = 'toast show' + (kind ? ' ' + kind : '');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { el.className = 'toast'; }, 2300);
    }

    /* ── round state ────────────────────────────────────────────────────── */

    /* A fresh round. `startAt` is which hole to stand on, which is not the
       same as which hole the round starts from — the card still runs from one
       to six and the unplayed ones simply stay blank, exactly as they do when
       you walk in halfway through. It is there so the picker can drop you on
       the hole you came back for. */
    function newRound(courseId, startAt) {
        var course = G3.courseById(courseId);
        var at = Math.max(0, Math.min(course.holes.length - 1, startAt || 0));
        state = {
            course: course,
            holeIndex: at,
            strokes: 0,
            scores: [],
            world: null,
            aim: { yaw: 0, power: 0, show: true },
            bag: C.CLUBS,
            club: clubById(state && state.club ? state.club.id : C.DEFAULT_CLUB),
            drag: null,
            save: state && state.save ? state.save : S.load(),
            phase: 'aim'
        };
        closeMenu();
        closeCard();
        loadHole(at);
        maybeShowFsPrompt();
    }

    function loadHole(i) {
        closeGate();
        var hole = state.course.holes[i];
        state.holeIndex = i;
        state.strokes = 0;
        // Only x/z: createWorld puts the ball on top of the pad, and the tee's
        // own y is the ground there, not the ball's centre.
        state.world = P.createWorld(hole, { x: hole.tee.x, z: hole.tee.z }, 0);
        /* This hole's bag, before anything reads state.club: a hole may hand
           out fewer clubs than the last one, and the club in hand has to be
           one of them. Kept if it survived the change, so walking down a
           course does not keep resetting you to the driver. */
        state.bag = G3.bagFor(hole);
        if (state.bag.indexOf(state.club) < 0) {
            state.club = clubById(state.club ? state.club.id : C.DEFAULT_CLUB);
        }
        if (G3.bag && G3.bag.setBag) {
            G3.bag.setBag(state.bag);
            G3.bag.setSelected(state.club.id);
        }
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
        // A new hole is a new look at it: back to the seat behind the ball,
        // and the dial straightened, whatever angle the last one was left at.
        R.setCam({ yaw: state.aim.yaw, dist: 9, pitch: 0.46, view: 0, mode: 'follow', lock: false });
        syncView();
        syncSeat();
        R.state.lastBall.set(state.world.ball.x, state.world.ball.y, state.world.ball.z);
        hideBanner();
        syncHud();
        showHoleCard();
    }

    /* ── the shot ───────────────────────────────────────────────────────── */

    /* Swing does one of three things, depending on what is already happening:
       plays the shot, opens the gate, or presses it. One button, because the
       gate is part of the swing rather than a second control beside it — and
       because the key, the button and a tap on the meter all arrive here. */
    function shoot() {
        if (gate) { pressGate(); return; }
        if (state.phase !== 'aim') return;
        if (state.aim.power < C.MIN_POWER) { askForPower(); return; }
        var over = P.overdraw(state.aim.power, state.club.power);
        if (SW.arms(over)) { openGate(over); return; }
        strike(null);
    }

    /* The shot itself. `g` is the gate that was just played, or null for a
       swing that never needed one. */
    function strike(g) {
        var b = state.world.ball;
        var frac = state.aim.power / state.club.power;
        var lie = P.surfaceUnder(state.world.hole, b.x, b.z, b.y + C.STEP_UP);
        /* The one place a shot stops being the shot on the meter. Inside a
           full swing this hands back exactly what it was given, so the ball
           goes where the cone said it would. Past one it is the gate that
           decides — the same envelope the dice used to roll (physics.spray),
           handed to whoever was holding the club. */
        var asked = { yaw: state.aim.yaw, power: P.deliver(state.aim.power, state.club.power) };
        var shot = g ? SW.apply(asked, g) : { yaw: asked.yaw, power: asked.power, spin: 0 };
        if (!P.launch(state.world, shot.yaw, shot.power, state.club.loft)) return;
        // launch() clears the spin, so the bend goes on after it.
        state.world.spin = shot.spin || 0;
        if (g) sayStrike(g);

        hideHoleCard();
        state.strokes++;
        state.phase = 'rolling';
        // The gate goes before the button is asked what it says, or Swing
        // spends the whole roll still offering to Strike.
        closeGate();
        syncSwing();
        // Everything that says "that was a hit": the spray off the club, the
        // camera flinching, and a thump that grows with the swing.
        // The spray is the shot's, not the swing's: the divot is thrown along
        // the line the ball actually left on, and the rest of the noise is
        // capped, because a thrash is not four times the thump.
        var feel = Math.min(1, frac);
        R.divot(b.x, b.y - C.BALL_R, b.z, shot.yaw, feel, lie && lie.pad.kind);
        R.punch(feel);
        A.putt(feel);
        state.aim.power = 0;
        syncHud();
    }

    /* ── the swing gate ─────────────────────────────────────────────────────

       Everything the gate needs from the game is here: opening it, ticking it
       on the frame, pressing it, and saying what happened. The gate itself
       (swing.js) knows none of this — it is arithmetic over a plain object,
       which is what lets tests.html cover it without a browser. */
    var gate = null;

    function openGate(over) {
        gate = SW.start(SW.pick(state.strokes), over, state.aim.power / maxPower());
        A.tick(0.5);
        $('power-track').classList.add('gate');
        $('gate').hidden = false;
        $('gate-zone').style.left = ((gate.mark - gate.win) * 100).toFixed(2) + '%';
        $('gate-zone').style.width = (gate.win * 200).toFixed(2) + '%';
        $('gate-name').textContent = GATE_SAYS[gate.variant];
        syncGate();
        syncSwing();
    }

    function closeGate() {
        gate = null;
        $('power-track').classList.remove('gate');
        $('gate').hidden = true;
    }

    function pressGate() {
        if (!gate) return;
        var wasStage = gate.stage;
        SW.press(gate);
        // The press at the top of the backswing is not the strike: it is
        // answered with a tick and the marker keeps going.
        if (!gate.done) { if (gate.stage !== wasStage) A.tick(0.65); syncGate(); return; }
        strike(gate);
    }

    function tickGate(dt) {
        if (!gate) return;
        SW.tick(gate, dt);
        if (gate.done) { strike(gate); return; }
        syncGate();
    }

    function syncGate() {
        if (!gate) return;
        var m = $('gate-mark');
        m.style.left = (gate.pos * 100).toFixed(2) + '%';
        m.hidden = !SW.visible(gate);
        $('gate').classList.toggle('live', SW.live(gate));
        $('gate').classList.toggle('backswing', gate.variant === 'double' && gate.stage === 0);
        // On the gate with a backswing press, the target moves — so the zone
        // has to move with it, or it is pointing at the wrong half of the bar.
        var t = SW.targetOf(gate);
        $('gate-zone').style.left = ((t - gate.win) * 100).toFixed(2) + '%';
    }

    var GATE_SAYS = {
        tempo: 'Strike on the line',
        'return': 'Catch it coming back',
        double: 'Press at the top, then strike',
        fade: 'It goes dark — strike on rhythm'
    };

    /* What the strike was, in the fewest words that are still an answer. The
       ball is about to say the rest of it. */
    function sayStrike(g) {
        if (g.perfect) { toast('Flushed it — all of the overdraw, none of the spray'); return; }
        var a = Math.abs(g.off);
        var way = g.off < 0 ? 'pulled' : 'pushed';
        if (a < 0.34) toast('A touch ' + (g.off < 0 ? 'early' : 'late') + ' — ' + way + ' a little');
        else if (a < 0.75) toast('Off the middle — ' + way + ', and it will bend');
        else toast(g.struck ? 'Thrashed it — ' + way + ' miles' : 'Never swung — the club came through on its own', 'bad');
    }

    /* Picking a club is picking a loft and a ceiling on power. The power
       already loaded is kept as a fraction of the swing, so swapping clubs
       mid-aim changes the shot rather than resetting it. */
    function pickClub(club) {
        if (!club || club === state.club) return;
        var frac = state.aim.power / state.club.power;
        state.club = club;
        state.aim.power = Math.min(maxPower(club), frac * club.power);
        syncClubs();
        syncPower();
    }

    // dir is +1 or -1; wraps round the bag either way, so a swipe the wrong
    // way just walks backward instead of doing nothing.
    function cycleClub(dir) {
        if (!state) return;
        var b = bag(), n = b.length;
        var i = (b.indexOf(state.club) + dir + n) % n;
        pickClub(b[i]);
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
        autoPutt();
        syncHud();
    }

    /* On the green, take the putter out.

       Nobody walks up to a ball twelve feet from the pin holding a driver, and
       until now the game made you remember not to: the club stayed in your
       hand from the tee all the way to the hole, so the commonest thing that
       happened on Ashdown Park's greens was a full swing nobody meant to play.
       Arriving on a putting surface now hands you the putter, once, and you
       are free to put it back — this only ever fires the moment a shot ends,
       so a club chosen after that is a club you keep.

       It fires on the **long game only**, and that restriction is the whole
       reason this is safe. Five of the seven courses are mini golf, where the
       floor is green from the tee mat to the cup and choosing loft over the
       thing in the way is the entire game — switching to a putter every time
       the ball stopped would be fighting the player on every stroke of
       Tidewater and Highland. `hole.longGame` is read off the ground rather
       than off the course id (courses.build), so a hole with fairway and rough
       on it gets this and a lane does not. */
    function autoPutt() {
        var hole = state.world.hole;
        if (!hole.longGame) return;
        var putter = null, b = bag(), i;
        for (i = 0; i < b.length; i++) if (b[i].id === 'putter') putter = b[i];
        if (!putter || state.club === putter) return;
        var b = state.world.ball;
        var lie = P.surfaceUnder(hole, b.x, b.z, b.y + C.STEP_UP);
        if (!lie || lie.pad.kind !== 'green') return;
        pickClub(putter);
        toast('On the green — putter');
    }

    function holeComplete() {
        var hole = state.course.holes[state.holeIndex];
        state.scores[state.holeIndex] = state.strokes;
        state.phase = 'holed';
        syncSwing();

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
        closeGate();
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
        // immersive phone layout where the canvas owns the viewport. Only the
        // four that move during a shot are on the line; the name, the blurb
        // and the sky are in the half that opens.
        $('shud-hole').textContent = (state.holeIndex + 1) + '/' + state.course.holes.length;
        $('shud-par').textContent = 'Par ' + hole.par;
        $('shud-strokes').textContent = state.strokes + (state.strokes === 1 ? ' stroke' : ' strokes');
        $('shud-name').textContent = hole.name;
        $('shud-blurb').textContent = hole.blurb;
    }

    /* ── the hole card ──────────────────────────────────────────────────── */

    /* What a hole is only needs saying once. It is said here, when the hole
       loads, and then it leaves — rather than sitting under the name for the
       whole round. The name in the scoreboard and the overlay's own drawer
       both ask for it back, so nothing is lost by letting it go. */
    var holeCardTimer = 0;

    function showHoleCard() {
        if (!state || !state.world) return;
        var hole = state.course.holes[state.holeIndex];
        var b = state.world.ball;
        $('hc-name').textContent = hole.name;
        $('hc-blurb').textContent = hole.blurb;
        if (G3.minimap) G3.minimap.into($('hc-map'), state.course.id, state.holeIndex, true);
        /* A restricted bag is the first thing to know about a hole and the one
           thing the picture of it cannot show: walking to the tee of a putting
           hole with the wedge in your hand and finding out at the top of the
           backswing is not a puzzle, it is a surprise. So the card names the
           clubs whenever there are not five of them. */
        $('hc-meta').textContent = 'Par ' + hole.par + ' · ' +
            Math.hypot(hole.cup.x - b.x, hole.cup.z - b.z).toFixed(1) + ' m' +
            (state.bag !== C.CLUBS
                ? ' · ' + state.bag.map(function (c) { return c.name; }).join(' + ') + ' only'
                : '') +
            (state.weather ? ' · ' + state.weather.icon + ' ' + state.weather.label : '');
        $('hole-card').classList.add('show');
        // The card and the overlay's drawer say the same thing; whichever was
        // asked for last is the one that says it.
        toggleHudDetail(false);
        clearTimeout(holeCardTimer);
        holeCardTimer = setTimeout(hideHoleCard, 3400);
    }

    function hideHoleCard() {
        clearTimeout(holeCardTimer);
        $('hole-card').classList.remove('show');
    }

    /* ── the collapsible chrome ─────────────────────────────────────────── */

    /* Compact chrome is on wherever the immersive layout is: a narrow window,
       a touch screen, or fullscreen on anything. The stylesheet answers the
       same three questions in its media queries; this is the one place that
       decides, so the topbar's two modes cannot disagree with each other. */
    var compactQuery = null;

    function syncCompact() {
        if (!compactQuery && window.matchMedia) {
            compactQuery = window.matchMedia('(max-width: 900px), (pointer: coarse)');
        }
        var on = (compactQuery ? compactQuery.matches : false) || !!fullscreenElement();
        var was = document.body.classList.contains('compact-ui');
        document.body.classList.toggle('compact-ui', on);
        if (!on) closeTopMenu();
        // Compact chrome takes the topbar out of the flow, which hands the
        // canvas the height it was standing in. That is a new size for the
        // renderer, and one nothing else would tell it about: the window has
        // not changed, only what is in it.
        if (was !== on) { R.resize(); measurePickerBand(); }
    }

    /* Six of the eight chips live behind ☰ when the bar is compact. The view
       and fullscreen stay out, because those are the two you reach for with a
       shot half aimed. */
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

    /* The overlay's second half: the hole's name, what it is, and the sky.
       Shut by default, because none of it changes while you play. */
    function toggleHudDetail(force) {
        var hud = $('stage-hud');
        var open = typeof force === 'boolean' ? force : !hud.classList.contains('open');
        if (open) hideHoleCard();
        hud.classList.toggle('open', open);
        $('hud-detail').hidden = !open;
        $('hud-toggle').setAttribute('aria-expanded', open ? 'true' : 'false');
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

    var lastWind = null;

    function syncWind() {
        var W = G3.weather;
        if (!W || !state.weather) return;
        var kph = W.windSpeedKph();
        var text = '· ' + (kph < 4 ? 'still' : kph + ' km/h');
        if (text === lastWind) return;
        lastWind = text;
        $('sky-wind').textContent = text;
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
        if ($('hole-card').classList.contains('show')) showHoleCard();
        toast(state.weather.icon + '  ' + state.weather.label);
    }

    /* How far there is left to go, which is the number the club choice is
       really about. Updated every frame while the ball is rolling — and, like
       syncWind above, spending most of those frames writing the string that is
       already there, which is a layout the browser did not need to do. Both
       are one string compare away from being free, so that is what they are. */
    var lastDistance = null;

    function syncDistance() {
        var b = state.world.ball, cup = state.course.holes[state.holeIndex].cup;
        var d = Math.hypot(cup.x - b.x, cup.z - b.z);
        var text = state.world.sunk ? 'in' : d.toFixed(1) + ' m';
        if (text === lastDistance) return;
        lastDistance = text;
        $('to-cup').textContent = text;
        $('shud-dist').textContent = text;
    }

    /* The meter reads in fractions of the club in hand, and it runs past 100%:
       the track is the ceiling plus the overdraw, with the full-swing mark
       drawn where 100% actually falls on it. Everything left of that mark is a
       shot the game will honour exactly; everything right of it buys distance
       with accuracy, and says so — the number keeps counting up, the fill goes
       hard red, and the track pulses. */
    function syncPower() {
        var club = state.club;
        var frac = Math.max(0, state.aim.power / maxPower(club));   // of the track
        var swing = Math.max(0, state.aim.power / club.power);      // of a full swing
        var over = swing > 1;
        var hot = swing > C.OVERSWING;
        // Green through amber to red, and the same hue the arrow is wearing
        // out on the course. Past a full swing it is red and stays red —
        // there is nothing left to grade.
        var hue = hot ? 0 : 120 * (1 - swing / C.OVERSWING);
        var light = over ? 55 + Math.round(P.overdraw(state.aim.power, club.power) * 12) : 55;
        $('power-fill').style.width = (frac * 100).toFixed(1) + '%';
        $('power-fill').style.color = $('power-fill').style.background =
            'hsl(' + hue + ' 85% ' + light + '%)';
        // The handle rides the leading edge of the fill, because that is where
        // the value is and therefore where a hand would be holding it.
        $('power-grip').style.left = (frac * 100).toFixed(1) + '%';
        $('power-fill').parentNode.classList.toggle('loaded', state.aim.power > 0);
        $('power-val').textContent = state.aim.power.toFixed(1);
        $('power-val').parentNode.classList.toggle('over', over);
        $('power-fill').parentNode.classList.toggle('hot', hot);
        $('power-fill').parentNode.classList.toggle('over', over);
        $('power-track').setAttribute('aria-valuenow', Math.round(swing * 100));
        // The number alone does not say what 100% means on this track, and a
        // screen reader is the one place the white line is invisible.
        $('power-track').setAttribute('aria-valuetext', Math.round(swing * 100) + '%' +
            (over ? ' — past a full swing, the shot will spray' : ' of a full swing'));
        syncSwing();
    }

    /* Where 100% falls on a track that runs to 100% + the overdraw. The mark
       and the shaded stretch past it are placed from the constant rather than
       from a number in the stylesheet, so retuning OVERDRAW moves them. */
    function placePowerMarks() {
        var at = (100 / (1 + C.OVERDRAW)).toFixed(2) + '%';
        var mark = $('power-max'), zone = $('power-over');
        if (mark) mark.style.left = at;
        if (zone) zone.style.left = at;
        $('power-track').setAttribute('aria-valuemax', Math.round(100 * (1 + C.OVERDRAW)));
    }

    /* One tick per unit of power, every fifth one brighter — so the groove is
       a ruler with the club's own numbers on it rather than a bar that is
       60% of something.

       This is the difference between the two ends of the bag being told apart
       and not: a putter's thirteen widely spaced marks and a driver's forty-one
       tight ones are visibly different instruments before either is loaded, and
       once one is, the fill has crossed a countable number of them. The old
       groove had a mark every 16 screen pixels, which counted the bar and not
       the shot, and read identically whatever was in your hand. */
    function drawPowerTicks(club) {
        var top = maxPower(club);
        if (!(top > 0)) return;
        var step = 100 / top;                 // one unit of power, as a % of the track
        /* Below about four pixels a tick stops being a mark and starts being a
           moiré, so the minor ones drop out and the fives carry the scale on
           their own. Four rather than six: a driver's forty-one marks packed
           tight *is* the reading — a club with a lot of power looks like one —
           and thinning them to eight throws that away to buy legibility of
           marks nobody counts one at a time anyway. */
        var w = $('power-track').getBoundingClientRect().width || 320;
        var minor = (w * step / 100) >= 4;
        var layers = [];
        if (minor) {
            layers.push('repeating-linear-gradient(90deg, rgba(255,255,255,0.11) 0 1px,' +
                ' transparent 1px, transparent ' + step.toFixed(4) + '%)');
        }
        layers.push('repeating-linear-gradient(90deg, rgba(255,255,255,0.30) 0 1px,' +
            ' transparent 1px, transparent ' + (step * 5).toFixed(4) + '%)');
        $('power-track').style.backgroundImage = layers.join(',');
        $('power-of').textContent = '/ ' + club.power;
    }

    /* Swing is the only thing that plays a stroke, so it says plainly when it
       cannot: nothing loaded, or the ball is still moving. */
    function syncSwing() {
        var btn = $('btn-swing');
        if (!btn) return;
        var aiming = state.phase === 'aim';
        var ready = aiming && (gate || state.aim.power >= C.MIN_POWER);
        btn.textContent = gate ? 'Strike' : 'Swing';
        btn.classList.toggle('striking', !!gate);
        /* Disabled only while the stroke is somebody else's — the ball is
           rolling, or the hole is over. Standing over an empty meter it stays
           pressable on purpose: a disabled button gives a touchscreen nothing
           at all back, which is exactly what a press that missed gives, and the
           player cannot tell the two apart. Pressed, it says what is missing
           (askForPower); aria-disabled says the same to a screen reader without
           taking the press away. */
        btn.disabled = !aiming;
        btn.classList.toggle('ready', ready);
        btn.classList.toggle('unready', aiming && !ready);
        btn.setAttribute('aria-disabled', ready ? 'false' : 'true');
    }

    /* The club in hand lives in the bag now — a modelled one, parked in front
       of the camera (see bag.js). What stays in the DOM is the line of text
       under the meter, which doubles as the announcement for anyone who cannot
       see the bag at all. */
    function syncClubs() {
        if (G3.bag) G3.bag.setSelected(state.club.id);
        $('club-hint').textContent = state.club.name + ' — ' + state.club.blurb;
        /* And the pill at the top of the stage says it in the club's own
           colour. The modelled bag has always carried this, and carries it
           better — but it is in the corner, it is small, and on a phone the
           meter stands in front of it. Which club is in your hand is the one
           thing you have to know before every single shot, so it is also
           written where the other two per-shot readings are. */
        $('club-name').textContent = state.club.name;
        $('club-loft').textContent = Math.round(state.club.loft * 180 / Math.PI) + '°';
        $('club-chip').style.setProperty('--club',
            (G3.bag && G3.bag.look ? G3.bag.look(state.club.id).name : '#eaf6ff'));
        $('club-chip').setAttribute('aria-label',
            'Club in hand: ' + state.club.name + '. Press to pick another.');
        drawPowerTicks(state.club);
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
        // Four turning clubs are hard enough to read without the overlay, the
        // hole card and the fullscreen offer sitting on top of them.
        $('stage').classList.toggle('picker-open', open);
        if (!open) return;
        hideHoleCard();
        measurePickerBand();

        // Whichever club is under the pointer, or the one in hand.
        var id = (G3.bag && G3.bag.state.hover) || state.club.id;
        var club = clubById(id);
        $('picker-name').textContent = club.name;
        $('picker-blurb').textContent = club.blurb;
        /* The same two figures the club's own card carries (bag.js), written
           out rather than abbreviated: `pwr 14 · loft 22°` was the data with
           the meaning left off, and this is the line a screen reader reads
           aloud. The card draws them; this says them. */
        $('picker-stats').innerHTML =
            'Key <b>' + club.key + '</b> · loft <b>' +
            Math.round(club.loft * 180 / Math.PI) + '°</b> · full swing <b>' +
            club.power + '</b>' +
            (club.id === state.club.id ? ' · <b>in hand</b>' : '');
    }

    /* How much of the stage the club panel and the shot controls have taken,
       as fractions of its height. The clubs come out of the bag into whatever
       is left between them, and both of those are text and buttons — a font
       size, a line count and a phone away from anything the renderer could
       work out for itself. So they are measured and handed over rather than
       guessed at, which is what stops the row landing under the panel naming
       it on a screen nobody tested. */
    function measurePickerBand() {
        if (!G3.bag || !G3.bag.setBand) return;
        var stage = $('stage').getBoundingClientRect();
        var ctl = document.querySelector('.controls');
        if (!stage.height || !ctl) return;
        var text = $('picker-stats').getBoundingClientRect();
        var bar = ctl.getBoundingClientRect();
        G3.bag.setBand(
            (text.bottom - stage.top) / stage.height + 0.02,
            (stage.bottom - bar.top) / stage.height + 0.02
        );
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
    var pinching = false;    // a pinch owns the input until the glass clears

    /* ── keeping the ledger honest ──────────────────────────────────────────

       Everything above is bookkeeping about fingers that are *supposed* to
       still be on the glass, and a phone will not always say when one leaves.
       A release outside the canvas, a capture taken away by a system gesture,
       the fullscreen switch in the topbar, the notification shade, a palm
       that grazed the screen — each can end a touch without a pointerup ever
       arriving here.

       Left unswept, one missed release is permanent: the ghost finger keeps
       its entry, the next real press counts two pointers and turns into a
       pinch, and from then on *every* drag on the course does nothing at all
       while the meter and the dial — which own their own captures — carry on
       working. That is what "the middle of the screen stopped registering"
       is, and why it never comes back until the page is reloaded. So the
       ledger is swept from every direction there is. */

    // Nothing is on the glass. Used whenever the page has been away or the
    // window has stopped being the thing the finger was touching.
    function clearPointers() {
        pointers = {};
        pinching = false;
        pinchIds = null;
        pinchDist = 0;
        bagGesture = null;
        cancelLook();
        look = null;
    }

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
        if (G3.bag.state.hover !== was) syncPicker();
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
        /* The primary pointer is the first finger of a gesture, which the
           browser only calls primary when no other one is down. So the glass
           was empty an instant ago whatever this ledger believes, and
           anything still in it is a ghost. This is the sweep that matters:
           it is the one that runs on the very press that a stale entry would
           otherwise turn into a pinch. */
        if (e.isPrimary) clearPointers();
        // A pointer that has already gone cannot be captured; that is not a
        // reason to lose track of it.
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        hideHoleCard();
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
            syncPicker();
            return;
        }

        // Looking around is allowed at any time — while the ball rolls too,
        // since the camera is following it and you may want another angle on
        // where it is going. It does not start until the pointer has actually
        // travelled: see onMove.
        look = { id: e.pointerId, x: e.clientX, y: e.clientY,
                 yaw: state.aim.yaw, pitch: R.cam.pitch, live: false,
                 slop: e.pointerType === 'mouse' ? 2 : 7 };
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
            /* A finger never lands and lifts on the same pixel, so without a
               deadzone every tap on the course was also a small, unasked-for
               turn of the aim — a shot that drifts each time you touch the
               glass reads as controls with a mind of their own. Past the
               deadzone the origin is moved to where the drag took, so taking
               it costs nothing: no jump, and the first pixel of real drag is
               the first pixel of turn. */
            if (!look.live) {
                if (Math.abs(e.clientX - look.x) < look.slop &&
                    Math.abs(e.clientY - look.y) < look.slop) return;
                look.live = true;
                look.x = e.clientX;
                look.y = e.clientY;
            }
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
                syncPicker();
            } else {
                pickClub(clubById(hit));
                G3.bag.setExpanded(false);
                A.tick(1);
                syncPicker();
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

    /* The net, and only the net: by the time this runs the canvas has usually
       handled the release already and there is nothing left to close. What it
       is here for is the release the canvas never saw — a capture that was
       never granted, a finger lifted over the topbar. That is an ordinary end
       to the drag, not a cancelled one, so the view stays where the drag left
       it; cancelLook would snap it back, which is its own kind of "it didn't
       register". */
    function onRelease(e) {
        if (!pointers[e.pointerId]) return;
        if (bagGesture && bagGesture.id === e.pointerId) bagGesture = null;
        if (look && look.id === e.pointerId) look = null;
        forget(e.pointerId);
    }

    function forget(id) {
        delete pointers[id];
        if (!pinching) return;
        var left = Object.keys(pointers);
        if (left.length >= 2) {
            if (pinchIds && (pinchIds[0] === String(id) || pinchIds[1] === String(id))) seedPinch();
            return;
        }
        /* One finger left, or none: there is nothing left to measure, so the
           pinch is over. It used to hold on until the glass was completely
           clear, which was one missed release away from owning the input for
           good. The finger still down does not inherit a look drag — it never
           asked for one — but the next press it makes is a fresh gesture
           again rather than a second helping of a pinch. */
        pinching = false;
        pinchIds = null;
        pinchDist = 0;
    }

    /* ── loading the shot ───────────────────────────────────────────────────

       The meter is the only thing that sets power now, so it has to behave
       like a control rather than a readout: press anywhere along it to load
       that much, drag to trim, and the same nudges the arrow keys use. It
       carries a slider role, so a keyboard or a screen reader gets the same
       three moves as a thumb. */

    /* The end of the meter, which is past a full swing: the club's ceiling
       plus its overdraw. Loading into that last stretch is deliberate — it is
       the only way to get more out of a club than it has, and it is the only
       way to miss with one (see CONFIG.OVERDRAW). */
    function maxPower(club) {
        return (club || state.club).power * (1 + C.OVERDRAW);
    }

    function setPower(v) {
        if (!state) return;
        // The club is already moving: what is loaded is what is going to be
        // hit, and a meter that could still be trimmed mid-swing would make
        // the gate a formality.
        if (gate) return;
        state.aim.power = Math.max(0, Math.min(maxPower(), v));
        syncPower();
    }

    function nudgePower(by) {
        setPower(state.aim.power + by);
        // A tick on the way up, the way the drawn bow used to sound.
        if (by > 0) A.tick(Math.max(0.1, state.aim.power / state.club.power));
    }

    function nudgeAim(by) {
        if (!state || state.phase !== 'aim' || gate) return;
        state.aim.yaw += by;
    }

    function powerFromEvent(e) {
        var track = $('power-track');
        var r = track.getBoundingClientRect();
        if (!r.width) return;
        setPower(((e.clientX - r.left) / r.width) * maxPower());
    }

    var powerDrag = 0;       // pointerId owning the meter, 0 when nobody is

    /* The press is taken on the band around the meter rather than on the
       painted bar, so a thumb landing a few pixels high still lands on it.
       The value is still read off the bar itself — powerFromEvent measures the
       track — so the band is slop and nothing else. */
    function onPowerDown(e) {
        if (!state) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        powerDrag = e.pointerId;
        try { $('power-hit').setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        // The cursor turns closed for as long as the meter is being held, which
        // is the one bit of feedback a mouse can give that a finger cannot.
        $('power-hit').classList.add('dragging');
        $('power-track').classList.add('dragging');
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
        $('power-hit').classList.remove('dragging');
        $('power-track').classList.remove('dragging');
    }

    /* Swing pressed with nothing loaded. The button is no longer disabled for
       it — a dead button and a press that missed look identical under a thumb
       — so this is the answer it gives instead: the meter flashes and says
       what to do with it. */
    function askForPower() {
        var track = $('power-track');
        track.classList.remove('asking');
        void track.offsetWidth;      // restart the flash rather than swallow it
        track.classList.add('asking');
        clearTimeout(askForPower._t);
        askForPower._t = setTimeout(function () {
            track.classList.remove('asking');
        }, 950);
        A.tick(0.2);
    }

    function onPowerKey(e) {
        var fine = e.shiftKey;
        // The window handler would otherwise nudge a second time.
        e.stopPropagation();
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { nudgePower(fine ? -0.15 : -0.55); e.preventDefault(); }
        else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { nudgePower(fine ? 0.15 : 0.55); e.preventDefault(); }
        else if (e.key === 'Home') { setPower(0); e.preventDefault(); }
        // End is a full swing, not the end of the track: the overdraw past it
        // is a decision, and a keyboard should have to make it on purpose too.
        else if (e.key === 'End') { setPower(e.shiftKey ? maxPower() : state.club.power); e.preventDefault(); }
        else if (e.key === 'Enter' || e.key === ' ') { shoot(); e.preventDefault(); }
    }

    function zoom(delta) {
        R.cam.dist = Math.max(4, Math.min(24, R.cam.dist + delta));
    }

    /* ── press and hold ─────────────────────────────────────────────────────

       The four nudge buttons — two for the aim, two for the view — move things
       by a fixed step, and a step is small on purpose. On a keyboard that is
       fine: the key repeats. Under a thumb it was eleven separate taps to walk
       the camera round the ball, and a tap that has to be repeated eleven
       times is a tap you stop trusting somewhere around the fourth.

       So they repeat while held. The press is taken on pointerdown rather than
       on click, which also means the nudge lands the moment the finger does
       instead of on release — the same change that makes the rest of the
       overlay feel like it is listening. */
    function holdToRepeat(id, step, every) {
        var el = $(id), wait = 0, tick = 0;

        function stop() {
            clearTimeout(wait);
            clearInterval(tick);
            wait = tick = 0;
        }

        el.addEventListener('pointerdown', function (e) {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            // Held past the edge of a 46px button is still held: the capture
            // keeps the repeat running and guarantees the release arrives.
            try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
            stop();
            step();
            wait = setTimeout(function () { tick = setInterval(step, every); }, 340);
            e.preventDefault();
        });
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (name) {
            el.addEventListener(name, stop);
        });

        /* No click handler, so the keyboard needs its own way in. Taking the
           default on keydown is what stops the browser synthesising a click on
           top of this, and stopping propagation is what keeps space from also
           reaching the window handler and playing the shot. */
        el.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            e.stopPropagation();
            step();
        });
    }

    /* ── the view dial ──────────────────────────────────────────────────────

       Aiming and looking used to be one gesture, so every side-on look at a
       hole was also a shot pointed sideways. They are two things now: the drag
       on the course turns the shot (and the camera comes with it, as before),
       and this turns the camera off the shot line and leaves it there. Zero is
       straight behind the ball; half a turn either way stands you in front of
       it looking back. The knob is where you are standing, so sliding it right
       walks you round to the right of the shot — and the shot itself lies away
       to the left of the screen from there, which is the point of standing
       there at all. */

    var VIEW_MAX = Math.PI;          // half a turn either way is the whole circle
    var VIEW_STEP = Math.PI / 12;    // 15° a press, which is a useful nudge

    function setView(rad) {
        R.cam.view = Math.max(-VIEW_MAX, Math.min(VIEW_MAX, rad));
        syncView();
    }

    function nudgeView(by) { setView(R.cam.view + by); }

    /* Straight: back behind the ball, and level with where a hole starts. The
       zoom is left alone — it is its own control, and someone who has pinched
       in on a green rarely wants that undone as well. The lock comes off with
       it: straight means straight behind the ball, and a locked camera is
       standing wherever the shot has since turned away from. */
    function straightenView() {
        R.cam.pitch = 0.46;
        if (look) look.pitch = 0.46;
        R.setLock(false);
        setView(0);
        A.tick(0.5);
    }

    /* The lock. The dial answers "how far round the ball am I standing"; this
       answers "round from *what*" — from the shot, which turns the camera with
       it, or from a fixed direction in the world, which does not.

       Unlocked is the game's own habit and the right one while you are playing
       a shot: turn the aim and the camera comes with you, so left is always
       left. It is the wrong one the moment you stop playing and start reading
       — on the overview especially, where a drag to aim swings the entire hole
       round under you and there is no way to look at the map and aim at the
       same time. Locked, the shot turns underneath a camera that stays put.

       The renderer hands back the dial offset that keeps the picture still
       across the change (R.setLock), and setView takes it from there. */
    function toggleLock() {
        setView(R.setLock(!R.cam.lock));
        A.tick(R.cam.lock ? 0.8 : 0.3);
        toast(R.cam.lock
            ? 'Camera locked — the shot turns, the view stays'
            : 'Camera unlocked — it turns with the aim again');
    }

    function syncView() {
        var locked = R.cam.lock;
        var deg = Math.round(R.cam.view * 180 / Math.PI);
        var straight = deg === 0;
        var side = deg > 0 ? 'right' : 'left';
        // Both ends of the dial are the same place — in front of the ball,
        // looking back down the shot — so both ends say so.
        var where = straight ? 'Straight'
            : Math.abs(deg) === 180 ? 'Head on'
            : Math.abs(deg) + '° ' + side;
        /* The dial always means "how far round from the reference", and the
           lock is what changes the reference: the shot while it is off, the
           bearing it was locked at while it is on. So the number stays the
           dial's own and stays true — it is only measured from somewhere else,
           which is what the word in front of it says. */
        $('view-knob').style.left = (50 + (R.cam.view / VIEW_MAX) * 50) + '%';
        $('view-val').textContent = locked ? 'Locked · ' + where : where;
        $('viewctl').classList.toggle('off-axis', !straight || locked);
        $('viewctl').classList.toggle('locked', locked);
        $('btn-view-lock').textContent = locked ? '🔒' : '🔓';
        $('btn-view-lock').classList.toggle('on', locked);
        $('btn-view-lock').setAttribute('aria-pressed', locked ? 'true' : 'false');
        $('btn-view-lock').setAttribute('aria-label',
            locked ? 'Unlock the camera from the aim' : 'Lock the camera so the aim stops turning it');
        var from = locked ? 'the locked view' : 'the shot';
        var track = $('view-track');
        track.setAttribute('aria-valuenow', String(deg));
        track.setAttribute('aria-valuetext', (locked ? 'Camera locked. ' : '') + (straight
            ? (locked ? 'Straight along the locked view' : 'Straight behind the ball')
            : Math.abs(deg) === 180 ? 'Turned right round, looking back along ' + from
            : Math.abs(deg) + ' degrees to the ' + side + ' of ' + from));
    }

    /* The track is absolute, the way the power meter is: press anywhere along
       it to stand there, drag to walk round. The press is taken on the dial
       rather than the track, because the ⌖ covers the middle of it — which is
       exactly where the knob sits when the view is straight, and a control you
       cannot start dragging from its resting position is no control at all. A
       press that lands on the ⌖ is a reset until it has travelled; past that
       it becomes a drag, and the release is no longer a press of the button. */
    var viewDrag = 0;          // pointerId working the dial, 0 when nobody is
    var viewHomePress = false; // it landed on the ⌖ and has not moved yet
    var viewTravelled = false; // ...and once it has, the release is not a reset
    var viewStartX = 0;

    function viewFromEvent(e) {
        var r = $('view-track').getBoundingClientRect();
        if (!r.width) return;
        setView((((e.clientX - r.left) / r.width) * 2 - 1) * VIEW_MAX);
    }

    function grabView(id) {
        try { $('view-dial').setPointerCapture(id); } catch (err) { /* ignore */ }
    }

    function onViewDown(e) {
        viewDrag = e.pointerId;
        viewTravelled = false;
        viewStartX = e.clientX;
        viewHomePress = !!(e.target && e.target.closest && e.target.closest('.view-home'));
        if (viewHomePress) return;    // leave the button its click
        grabView(e.pointerId);
        viewFromEvent(e);
        e.preventDefault();
    }
    function onViewMove(e) {
        if (viewDrag !== e.pointerId) return;
        // A press on the ⌖ is not captured — it may be about to be a click —
        // so its release can happen off the dial and never reach onViewUp. A
        // mouse moving back over the dial with no button held is that release.
        if (e.pointerType === 'mouse' && !e.buttons) { onViewUp(e); return; }
        if (viewHomePress) {
            if (Math.abs(e.clientX - viewStartX) < 6) return;
            viewHomePress = false;
            viewTravelled = true;
            grabView(e.pointerId);
        }
        viewFromEvent(e);
    }
    function onViewUp(e) {
        if (viewDrag !== e.pointerId) return;
        viewDrag = 0;
        viewHomePress = false;
    }
    function onViewKey(e) {
        var fine = e.shiftKey;
        e.stopPropagation();   // the window handler would otherwise nudge twice
        var step = fine ? VIEW_STEP / 5 : VIEW_STEP;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { nudgeView(-step); e.preventDefault(); }
        else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { nudgeView(step); e.preventDefault(); }
        else if (e.key === 'Home' || e.key === '0') { straightenView(); e.preventDefault(); }
        else if (e.key === 'Enter' || e.key === ' ') { straightenView(); e.preventDefault(); }
    }

    function onKey(e) {
        if (!state) return;
        var fine = e.shiftKey;
        var k = e.key;

        if (k === 'l' || k === 'L') { toggleLock(); return; }
        if (k === ',' || k === '<') { nudgeView(-VIEW_STEP); return; }
        if (k === '.' || k === '>') { nudgeView(VIEW_STEP); return; }
        if (k === '0') { straightenView(); return; }
        if (k === 'm' || k === 'M') { toggleMute(); return; }
        if (k === 'j' || k === 'J') { toggleMusic(); return; }
        if (k === 'o' || k === 'O') { toggleWater(); return; }
        if (k === 'p' || k === 'P') { toggleFps(); return; }
        if (k === 'r' || k === 'R') { restartHole(); return; }
        if (k === 'v' || k === 'V') { cycleSeat(); return; }
        if (k === 'f' || k === 'F') { toggleFullscreen(); return; }
        if (k === 'w' || k === 'W') { cycleWeather(); return; }
        if (k === '?' || k === 'h' || k === 'H') { openHowTo(); return; }
        if (k === 'Escape') {
            if (G3.bag && G3.bag.isExpanded()) { G3.bag.setExpanded(false); syncPicker(); return; }
            closeHowTo();
            return;
        }
        if (k >= '1' && k <= '9') {
            var byKey = bag().filter(function (c) { return c.key === k; })[0];
            if (byKey) { pickClub(byKey); if (G3.bag) G3.bag.setExpanded(false); syncPicker(); return; }
        }
        if (k === 'c' || k === 'C') {
            // C cycles; with the bag open it walks the row instead of shutting
            // it, which is how you compare two clubs without the mouse.
            cycleClub(1);
            syncPicker();
            return;
        }
        if (k === 'Escape') {
            closeTopMenu();
            if (G3.bag && G3.bag.isExpanded()) { G3.bag.setExpanded(false); syncPicker(); }
            hideHoleCard();
            return;
        }
        if (k === 'b' || k === 'B') {
            if (G3.bag) { G3.bag.toggle(); syncPicker(); }
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

    /* Three seats, one key: follow, side on, overview. The chip says which one
       you are in rather than which one you would get, because a control that
       names somewhere you are not is a control you press twice.

       And the chip says it *once*. Switching seats used to toast the new one
       as well, which put the word Overview in a dark pill a thumb's width from
       the chip that had just started saying Overview — the same label twice,
       across the top of the course, for the one change on screen that needs no
       announcing because you are looking straight at it.

       The seat and the dial above the power meter are two different questions
       — which one you are sitting in, and how far round from it you have
       walked — so they have a sync each: this one and `syncView`. */
    function cycleSeat() {
        R.cycleView();
        syncSeat();
    }

    function syncSeat() {
        var mode = R.cam.mode;
        $('btn-view').textContent = R.viewLabel(mode);
        $('btn-view').classList.toggle('on', mode !== 'follow');
    }

    /* Fullscreen is taken on the viewport rather than the stage: the topbar,
       the overlay and the modals live inside it, so every control comes along
       and there is no mode where the course is on screen but Overview,
       Courses or the scorecard are not. Vendor-prefixed for the Safaris that
       still need it. */
    function fullscreenElement() {
        return document.fullscreenElement || document.webkitFullscreenElement || null;
    }

    function toggleFullscreen() {
        var el = $('viewport');
        if (fullscreenElement()) {
            (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else if (el.requestFullscreen || el.webkitRequestFullscreen) {
            (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
        } else {
            toast('This browser will not do fullscreen here');
        }
    }

    function onFullscreenChange() {
        var on = !!fullscreenElement();
        $('btn-full').classList.toggle('on', on);
        document.body.classList.toggle('is-full', on);
        syncCompact();
        if (on) dismissFsPrompt(false);
        // The canvas has a new size the moment the browser swaps modes, and
        // again when it swaps back.
        setTimeout(function () { R.resize(); measurePickerBand(); }, 60);
    }

    /* The chip in the topbar does the same job, but it is one small icon among
       six others and easy to never notice. This is the same offer said once,
       plainly, right where a round starts — and it remembers being waved off,
       so it is not something to dismiss twice. */
    var fsPromptTimer = 0;

    function fsPromptDismissed() {
        try { return localStorage.getItem(C.FS_PROMPT_KEY) === '1'; } catch (e) { return false; }
    }
    function dismissFsPrompt(remember) {
        clearTimeout(fsPromptTimer);
        $('fs-prompt').classList.remove('show');
        if (remember) { try { localStorage.setItem(C.FS_PROMPT_KEY, '1'); } catch (e) { /* ignore */ } }
    }
    /* Said once, after the hole has introduced itself, and then gone by itself:
       an offer that has to be dismissed to stop being in the way is a second
       thing to do before playing, and two things arriving at once on the same
       corner of a phone is neither of them being read. */
    function maybeShowFsPrompt() {
        if (fsPromptDismissed() || fullscreenElement()) return;
        if (!($('stage').requestFullscreen || $('stage').webkitRequestFullscreen)) return;
        clearTimeout(fsPromptTimer);
        fsPromptTimer = setTimeout(function () {
            if (fsPromptDismissed() || fullscreenElement()) return;
            $('fs-prompt').classList.add('show');
            fsPromptTimer = setTimeout(function () {
                $('fs-prompt').classList.remove('show');
            }, 9000);
        }, 5200);
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
        syncSound();
        // The round starts silent (audio.js), so the first unmute is the first
        // time anyone hears there is a band in here at all.
        if (!m) toast(A.hasMusic() ? 'Sound on — smooth jazz and all' : 'Sound on');
    }

    function toggleMusic() {
        var on = A.toggleMusic();
        syncSound();
        if (on && A.isMuted()) toast('Jazz on — but the sound is muted (M)');
        else toast(on ? 'Jazz on' : 'Jazz off');
    }

    /* Both chips, from whatever audio.js currently believes — which is also
       what the page loads with, since the mute is remembered and the music is
       remembered separately. */
    function syncSound() {
        var m = A.isMuted(), j = A.hasMusic();
        $('mute-icon').textContent = m ? '🔇' : '🔊';
        $('btn-mute').setAttribute('aria-label', m ? 'Unmute' : 'Mute');
        $('btn-mute').classList.toggle('on', !m);
        $('btn-music').classList.toggle('on', j && !m);
        $('btn-music').setAttribute('aria-label', j ? 'Turn the music off' : 'Turn the music on');
    }

    /* ── the water switch ───────────────────────────────────────────────── */

    /* Reflections, crest foam, sun glitter and a Fresnel-honest transparency,
       against a plain sea that is the same waves and one flat sky colour. It
       is a fill-rate bill and nothing else — no geometry changes, no gameplay
       — so it is a switch rather than a quality preset, and it lives next to
       the sound chips because it is the same kind of decision: something you
       turn off when the machine is struggling or the fan is loud.

       Read from storage before the first hole is built, so nothing is ever
       compiled twice on the way in. */
    function prettyWaterWanted() {
        try { return localStorage.getItem(C.WATER_KEY) !== '1'; } catch (e) { return true; }
    }

    function toggleWater() {
        var on = !R.prettyWater;
        R.setWaterQuality(on);
        try { localStorage.setItem(C.WATER_KEY, on ? '0' : '1'); } catch (e) { /* ignore */ }
        syncWater();
        toast(on ? 'Fancy water on — reflections, foam and glitter'
                 : 'Fancy water off — kinder to the frame rate');
    }

    function syncWater() {
        var on = R.prettyWater;
        $('btn-water').classList.toggle('on', on);
        $('water-icon').textContent = on ? '≈' : '~';
        $('btn-water').setAttribute('aria-label',
            on ? 'Turn the fancy water off' : 'Turn the fancy water on');
    }

    /* ── the frame-rate readout ─────────────────────────────────────────── */

    /* One number, averaged over half a second and written to the DOM only when
       it changes. Averaging is the whole point: an instantaneous 1/dt on a
       phone flickers through a fifteen-frame range and reads as noise, and a
       readout you cannot hold still is a readout you cannot compare against
       the last time you looked. Half a second is long enough to settle and
       short enough that a stutter still shows up as one.

       It costs a counter and, twice a second, one textContent. Nothing here
       measures anything the frame was not already doing. */
    var fpsAcc = 0, fpsFrames = 0, fpsShown = -1;

    function fpsWanted() {
        try { return localStorage.getItem(C.FPS_KEY) !== '1'; } catch (e) { return true; }
    }

    function toggleFps() {
        var on = $('fps').hidden;          // hidden now means we are turning it on
        try { localStorage.setItem(C.FPS_KEY, on ? '0' : '1'); } catch (e) { /* ignore */ }
        syncFps();
        toast(on ? 'Frame rate on' : 'Frame rate off');
    }

    function syncFps() {
        var on = fpsWanted();
        $('fps').hidden = !on;
        $('btn-fps').classList.toggle('on', on);
        $('btn-fps').setAttribute('aria-pressed', on ? 'true' : 'false');
        $('btn-fps').setAttribute('aria-label', on ? 'Hide the frame rate' : 'Show the frame rate');
        if (!on) { fpsAcc = 0; fpsFrames = 0; fpsShown = -1; }
    }

    function tickFps(dt) {
        if ($('fps').hidden) return;
        fpsAcc += dt;
        fpsFrames++;
        if (fpsAcc < 0.5) return;
        var fps = Math.round(fpsFrames / fpsAcc);
        fpsAcc = 0;
        fpsFrames = 0;
        if (fps === fpsShown) return;
        fpsShown = fps;
        var el = $('fps');
        el.textContent = fps + ' fps';
        el.classList.toggle('low', fps < 45 && fps >= 30);
        el.classList.toggle('bad', fps < 30);
    }

    /* ── the view row, folded ───────────────────────────────────────────── */

    /* What the row is *set to* is worth a glance on every hole; changing it is
       worth a press on very few. So the label carries the reading and the row
       hides behind it. A phone starts folded because a phone is where those
       pixels are worth the most, and anything wider starts open because there
       the row costs nothing — but one press either way is remembered, and from
       then on it is the player's answer on every screen. */
    function viewCtlOpenByDefault() {
        return !(window.matchMedia && window.matchMedia('(max-width: 640px), (pointer: coarse)').matches);
    }

    function viewCtlWanted() {
        try {
            var v = localStorage.getItem(C.VIEWCTL_KEY);
            if (v === '1') return true;
            if (v === '0') return false;
        } catch (e) { /* ignore */ }
        return viewCtlOpenByDefault();
    }

    function toggleViewCtl() {
        var open = $('viewctl').classList.contains('collapsed');
        try { localStorage.setItem(C.VIEWCTL_KEY, open ? '1' : '0'); } catch (e) { /* ignore */ }
        syncViewCtl(open);
    }

    function syncViewCtl(open) {
        if (open === undefined) open = viewCtlWanted();
        $('viewctl').classList.toggle('collapsed', !open);
        // The class goes on the stage as well as on the row, because the two
        // things that have to move out of the row's way — the hole's figures
        // and the hole card — sit *above* it in the DOM and cannot be reached
        // from it with a sibling selector.
        $('stage').classList.toggle('view-collapsed', !open);
        $('view-toggle').setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    /* ── menus and cards ────────────────────────────────────────────────── */

    /* The course picker, and the only one there is: finishing a round opens
       this rather than a second list of its own, so there is one place where
       courses are chosen and it always shows the same records.

       It used to be a list of names, and names were doing a job they could not
       do. "Quarry Ridge — ramps, ledges and a long way down" tells you almost
       nothing next to a picture of Halfpipe, so each course carries six plans,
       drawn by minimap.js out of the hole data, and each plan is also a way in:
       the card's head starts the round from the first tee, a plan starts it on
       that hole, which is what you want when you have come back to practise the
       one that beat you.

       And it used to be one scroll with headings in it. At seven courses that
       was already long; at ten it stopped being a picker at all, because the
       three kinds of golf on the list are not variations of each other and
       nobody arrives wanting to browse all of them. So the headings became
       tabs: one kind on screen at a time, its own colour running through the
       cards, and the plans for the other two never drawn — which is also why
       the picker opens faster than it did with seven courses on it.

       `suggestId` is the course the picker is nudging you towards — the one
       after the round you have just finished. It picks the opening tab and is
       marked inside it, rather than pre-selected: the whole point of coming
       back to this list is that you might want a different one, and possibly a
       different kind. */

    var menuGroup = null;      // which tab is open
    var menuSuggest = null;    // …and the course being offered, if any

    function groupOf(id) {
        var c = G3.courseById(id);
        return c ? c.group : G3.COURSE_GROUPS[0].id;
    }

    function openMenu(suggestId) {
        menuSuggest = suggestId || null;
        menuGroup = suggestId ? groupOf(suggestId) :
            (state && state.course ? groupOf(state.course.id) : G3.COURSE_GROUPS[0].id);
        drawTabs();
        var focus = drawCourses();
        $('menu').className = 'modal show';
        // Keyboard and screen reader land on the course being offered, or on
        // the first one in the open tab if nothing is.
        if (focus) { try { focus.focus(); } catch (e) { /* ignore */ } }
        drawPlans();
    }

    /* The tabs. Each carries the group's mark, its name and how many courses
       are filed under it, and the one holding the course on offer carries a
       dot as well — so a player who has just finished the last mini golf course
       can see that what is up next is behind another tab, which is the one
       thing a filtered list can hide from you. */
    function drawTabs() {
        var host = $('menu-tabs');
        host.innerHTML = '';
        G3.COURSE_GROUPS.forEach(function (group) {
            var courses = G3.coursesInGroup(group.id);
            if (!courses.length) return;
            var on = group.id === menuGroup;
            var tab = document.createElement('button');
            tab.type = 'button';
            tab.className = 'menu-tab' + (on ? ' on' : '');
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', on ? 'true' : 'false');
            tab.setAttribute('aria-controls', 'menu-list');
            tab.style.setProperty('--cg-tint', group.tint);
            tab.innerHTML =
                '<span class="mt-icon" aria-hidden="true">' + group.icon + '</span>' +
                '<span class="mt-name">' + group.name + '</span>' +
                '<span class="mt-count">' + courses.length + '</span>' +
                (menuSuggest && groupOf(menuSuggest) === group.id && !on
                    ? '<span class="mt-dot" title="up next"></span>' : '');
            tab.addEventListener('click', function () {
                if (menuGroup === group.id) return;
                menuGroup = group.id;
                drawTabs();
                drawCourses();
                drawPlans();
            });
            host.appendChild(tab);
        });
        var g = G3.COURSE_GROUPS.filter(function (x) { return x.id === menuGroup; })[0];
        $('menu-tab-blurb').textContent = g ? g.blurb : '';
        $('menu-list').style.setProperty('--cg-tint', g ? g.tint : '#7dd3fc');
    }

    /* The cards of the open tab. Returns what focus should land on. */
    function drawCourses() {
        var save = state ? state.save : S.load();
        var host = $('menu-list');
        host.innerHTML = '';
        var focus = null, firstHead = null;

        G3.coursesInGroup(menuGroup).forEach(function (course) {
            var rec = S.courseRecord(save, course.id);
            var par = S.coursePar(course.holes);
            // Expanded from the start on a wide screen, where the strip of
            // plans never crowded anything out. On a phone every card starts
            // closed except the one the picker is nudging you towards, so
            // opening the list costs one screen rather than four.
            var opened = !document.body.classList.contains('compact-ui') || course.id === menuSuggest;
            var card = document.createElement('div');
            card.className = 'course-card' + (course.id === menuSuggest ? ' up-next' : '') +
                (opened ? ' expanded' : '');

            var stripId = 'cc-holes-' + course.id;

            var topRow = document.createElement('div');
            topRow.className = 'cc-top';

            var top = document.createElement('button');
            top.type = 'button';
            top.className = 'cc-head';
            top.innerHTML =
                '<span class="cc-name">' + course.name +
                (course.id === menuSuggest ? '<span class="cc-next">up next</span>' : '') + '</span>' +
                '<span class="cc-blurb">' + course.blurb + '</span>' +
                '<span class="cc-meta">' + course.holes.length + ' holes · par ' + par +
                ' · best ' + (rec.best === null ? '—' : rec.best + ' (' + S.formatVsPar(rec.bestVsPar) + ')') +
                '</span>';
            top.addEventListener('click', function () { newRound(course.id); });
            topRow.appendChild(top);

            // Only the strip of hole plans collapses — the head above stays
            // a one-tap "start from hole 1", same as before this button
            // existed, so folding a card away never costs that shortcut.
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
            });
            topRow.appendChild(toggle);
            card.appendChild(topRow);

            var strip = document.createElement('div');
            strip.className = 'cc-holes';
            strip.id = stripId;
            /* The cells are shaped like the course's own holes. A mini golf
               lane is two and a half times as deep as it is wide and a links
               hole is nearly square; one aspect ratio for both letterboxes
               whichever it was not chosen for, and six thin green ribbons in
               six square frames is a picker that shows you nothing. Averaged
               over the course and clamped, because one odd hole should not
               reshape the other five. */
            var shape = 0;
            course.holes.forEach(function (hole) {
                var b = hole.bounds;
                shape += (b.maxX - b.minX) / Math.max(0.001, b.maxZ - b.minZ);
            });
            shape = Math.max(0.4, Math.min(1.5, shape / course.holes.length));
            strip.style.setProperty('--cc-shape', shape.toFixed(3));

            course.holes.forEach(function (hole, i) {
                var cell = document.createElement('button');
                cell.type = 'button';
                cell.className = 'cc-hole';
                cell.title = hole.name + ' — par ' + hole.par;
                // The plan pass below reads these rather than counting its
                // way through the DOM, so the ordering above is free to change.
                cell.setAttribute('data-course', course.id);
                cell.setAttribute('data-hole', i);
                cell.innerHTML =
                    '<canvas class="cc-map"></canvas>' +
                    '<span class="cc-num">' + (i + 1) + '</span>' +
                    '<span class="cc-par">' + hole.par + '</span>';
                cell.addEventListener('click', function () { newRound(course.id, i); });
                strip.appendChild(cell);
            });
            card.appendChild(strip);
            host.appendChild(card);
            if (!firstHead) firstHead = top;
            if (course.id === menuSuggest) focus = top;
        });

        host.scrollTop = 0;
        return focus || firstHead;
    }

    /* Drawn after the modal is up, so the canvases have a laid-out size to be
       measured against — and one frame later, so the picker appears at once
       rather than after a tab's worth of holes has been rasterised. Only the
       open tab is drawn, which is most of what made this cheap again. */
    function drawPlans() {
        if (!G3.minimap) return;
        var host = $('menu-list');
        requestAnimationFrame(function () {
            var cells = host.querySelectorAll('.cc-hole'), k;
            for (k = 0; k < cells.length; k++) {
                G3.minimap.into(cells[k].querySelector('.cc-map'),
                    cells[k].getAttribute('data-course'),
                    parseInt(cells[k].getAttribute('data-hole'), 10));
            }
        });
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
        /* A finished round is the moment to offer another course, and the
           offer is the picker itself rather than a one-off button: the list
           is where the records live and where the categories are. Mid-round
           the same card is just a scorecard, so the button goes away. */
        var next = $('card-next');
        if (res) {
            next.hidden = false;
            next.textContent = 'Next: ' + G3.courseById(G3.nextCourseId(state.course.id)).name;
        } else {
            next.hidden = true;
        }
        $('scorecard').className = 'modal show';
    }

    function closeCard() { $('scorecard').className = 'modal'; }

    /* ── loop ───────────────────────────────────────────────────────────── */

    var intent = { show: false, yaw: 0, power: 0, loft: 0, over: 0 };

    function loop(now) {
        raf = requestAnimationFrame(loop);
        var raw = (now - last) / 1000;
        var dt = Math.min(0.05, raw);
        last = now;
        /* Counted off the raw delta, not the clamped one, and before the
           early-out. The clamp is the physics' business — it is what stops a
           dropped second from teleporting the ball through a wall — and it
           puts a floor of 20 under anything measured through it, which is a
           readout that goes blind at exactly the frame rate worth reading.
           And a frame the game had nothing to do on is still a frame the
           machine drew, which is the kind around a stall. */
        tickFps(raw);
        if (!state || !state.world) return;

        if (state.phase === 'rolling') {
            var ev = P.advance(state.world, dt, {});
            handleEvents(ev);
            syncDistance();
            if (P.done(state.world)) endShot();
        } else {
            tickGate(dt);
            // Gates and blades keep their own time whether or not the ball is
            // rolling, so the preview you aim with is the course you will hit.
            state.world.time += dt;
        }

        // The wind gusts whether or not anything is happening, so the readout
        // under the hole name is refreshed on the frame rather than the shot.
        syncWind();

        // The camera rides the aim, so turning one turns the other; how far
        // round the ball it stands from there is the view dial's business
        // (R.cam.view), and the renderer puts the two together.
        R.cam.yaw = state.aim.yaw;
        // One object, refilled: the renderer reads it within the call and the
        // preview compares its fields against the last frame's, so handing it a
        // fresh literal every frame was sixty allocations a second for nothing.
        intent.show = state.phase === 'aim';
        intent.yaw = state.aim.yaw;
        // What the club delivers, not what the meter reads: past a full swing
        // the two are different (physics.deliver) and the cone has to draw the
        // ball that is going to be played.
        intent.power = P.deliver(state.aim.power, state.club.power);
        intent.loft = state.club.loft;
        // How far past a full swing this is, 0..1. The renderer opens the cone
        // by exactly the spread physics would apply — the club's ceiling is
        // the only part of that sum the renderer has no way to know.
        intent.over = P.overdraw(state.aim.power, state.club.power);
        R.frame(dt, state.world, intent);

        // After the frame, so the inspector's outlines are placed from the
        // same clock the course was just drawn on.
        if (G3.debug && G3.debug.on) G3.debug.frame(state.world, dt);
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
        // The same capture that keeps a drag alive off the edge of the canvas
        // can be taken away without a pointerup — the dial and the meter both
        // learned this already, and the course is the one that pays most for
        // it, because the ghost it leaves behind reads as a pinch.
        canvas.addEventListener('lostpointercapture', onCancel);
        /* And the net under all of it. A release the canvas never hears about
           still reaches the window, so the ledger closes the entry either
           way; and a page that goes away — tabbed out, backgrounded,
           fullscreen switched under a finger — comes back to a clear glass
           rather than to whatever was down when it left. */
        window.addEventListener('pointerup', onRelease);
        window.addEventListener('pointercancel', onRelease);
        window.addEventListener('blur', clearPointers);
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) return;
            clearPointers();
            /* And throw away the half-measured frame-rate window with it. A
               backgrounded tab stops being asked for frames, so the gap either
               side of it is not a slow frame — it is no frame at all, and
               averaging it in would report single figures for the first half
               second back. A genuinely long frame, on the other hand, is
               exactly what the number is for, so nothing here judges one by
               its length. */
            fpsAcc = 0;
            fpsFrames = 0;
        });
        canvas.addEventListener('wheel', function (e) {
            e.preventDefault();
            zoom(e.deltaY * 0.004);
        }, { passive: false });
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', function () {
            R.resize();
            syncCompact();
            measurePickerBand();
            if (state) drawPowerTicks(state.club);
        });

        $('banner-next').addEventListener('click', nextHole);
        $('btn-restart').addEventListener('click', restartHole);
        // Wrapped: openMenu takes the course to nudge towards, and a click
        // handler would otherwise hand it an Event.
        $('btn-courses').addEventListener('click', function () { openMenu(); });
        $('btn-card').addEventListener('click', function () { openCard(null); });
        $('btn-view').addEventListener('click', cycleSeat);
        $('btn-swing').addEventListener('click', shoot);
        holdToRepeat('btn-aim-left', function () { nudgeAim(0.035); }, 60);
        holdToRepeat('btn-aim-right', function () { nudgeAim(-0.035); }, 60);
        holdToRepeat('btn-view-left', function () { nudgeView(-VIEW_STEP); }, 110);
        holdToRepeat('btn-view-right', function () { nudgeView(VIEW_STEP); }, 110);
        $('btn-view-lock').addEventListener('click', toggleLock);
        $('view-toggle').addEventListener('click', toggleViewCtl);
        // Naming the club and changing it are the same button: the pill opens
        // the picker, which is where the choice already lives.
        $('club-chip').addEventListener('click', function () {
            if (G3.bag) { G3.bag.toggle(); syncPicker(); }
        });
        $('btn-fps').addEventListener('click', toggleFps);
        // A drag that started on the ⌖ and walked away is not a press of it.
        $('btn-view-home').addEventListener('click', function () {
            if (viewTravelled) { viewTravelled = false; return; }
            straightenView();
        });
        $('view-dial').addEventListener('pointerdown', onViewDown);
        $('view-dial').addEventListener('pointermove', onViewMove);
        $('view-dial').addEventListener('pointerup', onViewUp);
        $('view-dial').addEventListener('pointercancel', onViewUp);
        // A capture can be taken away without a pointerup ever arriving — a
        // system gesture, the element re-laid-out under the finger. Left
        // unhandled the control stays "held" and the next press is ignored,
        // which is the other half of "it stopped registering".
        $('view-dial').addEventListener('lostpointercapture', onViewUp);
        $('view-track').addEventListener('keydown', onViewKey);
        $('power-hit').addEventListener('pointerdown', onPowerDown);
        $('power-hit').addEventListener('pointermove', onPowerMove);
        $('power-hit').addEventListener('pointerup', onPowerUp);
        $('power-hit').addEventListener('pointercancel', onPowerUp);
        $('power-hit').addEventListener('lostpointercapture', onPowerUp);
        $('power-track').addEventListener('keydown', onPowerKey);
        placePowerMarks();
        $('fs-prompt-go').addEventListener('click', function () { dismissFsPrompt(true); toggleFullscreen(); });
        $('fs-prompt-dismiss').addEventListener('click', function () { dismissFsPrompt(true); });
        $('btn-full').addEventListener('click', toggleFullscreen);
        $('btn-help').addEventListener('click', openHowTo);
        $('btn-help-2').addEventListener('click', openHowTo);
        $('btn-mute').addEventListener('click', toggleMute);
        $('btn-music').addEventListener('click', toggleMusic);
        $('btn-water').addEventListener('click', toggleWater);
        $('btn-weather').addEventListener('click', cycleWeather);
        $('shud-sky').addEventListener('click', cycleWeather);
        $('hole-name').addEventListener('click', showHoleCard);
        $('hud-toggle').addEventListener('click', function () { toggleHudDetail(); });
        $('btn-menu').addEventListener('click', toggleTopMenu);
        // Anything picked out of the menu is the last thing the menu is for.
        $('topbar-menu').addEventListener('click', closeTopMenu);
        // A press anywhere else shuts it, the way a menu should.
        document.addEventListener('pointerdown', function (e) {
            if (!$('topbar-menu').classList.contains('open')) return;
            if (e.target && e.target.closest && e.target.closest('.topbar-actions')) return;
            closeTopMenu();
        }, true);
        syncFps();
        syncViewCtl();
        syncCompact();
        if (compactQuery) {
            if (compactQuery.addEventListener) compactQuery.addEventListener('change', syncCompact);
            else if (compactQuery.addListener) compactQuery.addListener(syncCompact);
        }
        $('howto-close').addEventListener('click', closeHowTo);
        $('howto').addEventListener('click', function (e) { if (e.target === this) closeHowTo(); });
        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        $('card-close').addEventListener('click', closeCard);
        $('card-again').addEventListener('click', function () { newRound(state.course.id); });
        $('card-next').addEventListener('click', function () {
            closeCard();
            openMenu(G3.nextCourseId(state.course.id));
        });
        $('menu-close').addEventListener('click', function () {
            if (state && state.world) closeMenu();
        });

        // Before the first buildHole, so the sea is compiled once, the way the
        // player left it.
        R.setWaterQuality(prettyWaterWanted());

        syncSound();
        syncWater();
        syncView();
        syncSeat();

        var q = params();
        state = { save: S.load() };
        // ?weather=rain holds for the whole round, the same as picking it with
        // W would; anything unrecognised is simply ignored.
        if (q.weather && G3.weather) G3.weather.setOverride(q.weather);
        if (q.course) {
            var course = G3.courseById(q.course);
            var at = q.hole
                ? Math.max(1, Math.min(course.holes.length, parseInt(q.hole, 10) || 1)) - 1
                : 0;
            newRound(q.course, at);
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

        // The course inspector (debug.js), which installs its own key and
        // pointer handling and draws nothing until it is switched on.
        if (G3.debug) G3.debug.init(canvas);

        // One measurement before the first frame, so the bag stands in the
        // right corner of the round rather than the frame after it.
        measurePickerBand();

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
        get state() { return state; },
        /* The swing gate, for the inspector and for a driver that has to time
           a strike without a thumb. Read-only from out here in the sense that
           matters: pressing it still goes through `shoot`, which is the one
           path a strike may take. */
        get gate() { return gate; }
    };

})(window.G3);
