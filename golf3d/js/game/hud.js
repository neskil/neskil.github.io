/* game/hud.js — the chrome around the canvas.
 *
 * Everything in this file reads the game and writes the DOM. Nothing in it
 * decides anything: no strokes, no state, no shots. That one rule is what
 * makes the scoreboard, the overlay, the modals and the club panel safe to
 * edit — if a change here can alter what a stroke costs, it belongs in
 * game.js instead.
 *
 * ## What it can ask the game to do
 *
 * game.js hands it an `api` at boot and it cannot reach the game any other
 * way. That object is the complete list of what a control on this page is
 * allowed to set in motion:
 *
 *     api.state()          the round, read-only
 *     api.clubById(id)     a club out of the config, by id
 *     api.newRound(id)     start a course — the menu and "play again"
 *
 * A control that needs anything else gets a line added there, rather than this
 * file reaching into the game.
 *
 * ## Two scoreboards, on purpose
 *
 * The bar along the top is the one you read between shots; `#stage-hud` is the
 * compact overlay carrying the same four live figures for the layouts where
 * the bar is gone — fullscreen, and the immersive phone layout where the
 * canvas owns the viewport. `sync()` writes both together, so they cannot
 * disagree.
 *
 * `syncCompact()` is the one place that decides which layout is on. The
 * stylesheet answers the same question in its media queries; the two are held
 * to the same three conditions deliberately.
 *
 * Depends on config.js, scoring.js, audio.js, render.js and bag.js. Loaded
 * before game.js, which calls `init()`.
 */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var S = G3.scoring;
    var A = G3.audio;
    var R = G3.render;

    /* Everything game.js lets the chrome ask for. Set once, by init(). */
    var api = null;

    /* The round in progress, or null before one starts. Read, never written. */
    function st() { return api ? api.state() : null; }

    function $(id) { return document.getElementById(id); }

    /* ── the figures ───────────────────────────────────────────────────── */

    function toast(msg, kind) {
        var el = $('toast');
        el.textContent = msg;
        el.className = 'toast show' + (kind ? ' ' + kind : '');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { el.className = 'toast'; }, 2300);
    }

    function sync() {
        var hole = st().course.holes[st().holeIndex];
        var t = S.totals(st().scores, st().course.holes);
        $('course-name').textContent = st().course.name;
        $('hole-num').textContent = (st().holeIndex + 1) + ' / ' + st().course.holes.length;
        $('hole-name').textContent = hole.name;
        $('hole-par').textContent = hole.par;
        $('hole-strokes').textContent = st().strokes;
        $('total-strokes').textContent = t.strokes;

        var vs = $('total-vspar');
        vs.textContent = t.played ? S.formatVsPar(t.vsPar) : '—';
        vs.className = 'stat-value ' + (t.vsPar < 0 ? 'under' : t.vsPar > 0 ? 'over' : 'level');

        var rec = S.courseRecord(st().save, st().course.id);
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
        $('shud-hole').textContent = (st().holeIndex + 1) + '/' + st().course.holes.length;
        $('shud-par').textContent = 'Par ' + hole.par;
        $('shud-strokes').textContent = st().strokes + (st().strokes === 1 ? ' stroke' : ' strokes');
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
        if (!st() || !st().world) return;
        var hole = st().course.holes[st().holeIndex];
        var b = st().world.ball;
        $('hc-eyebrow').textContent = st().course.name + ' · Hole ' +
            (st().holeIndex + 1) + ' of ' + st().course.holes.length;
        $('hc-name').textContent = hole.name;
        $('hc-blurb').textContent = hole.blurb;
        $('hc-meta').textContent = 'Par ' + hole.par + ' · ' +
            Math.hypot(hole.cup.x - b.x, hole.cup.z - b.z).toFixed(1) + ' m' +
            (st().weather ? ' · ' + st().weather.icon + ' ' + st().weather.label : '');
        $('hole-card').classList.add('show');
        // The card and the overlay's drawer say the same thing; whichever was
        // asked for last is the one that says it.
        toggleDetail(false);
        clearTimeout(holeCardTimer);
        holeCardTimer = setTimeout(hideHoleCard, 4600);
    }

    /* The hole card carries the sky, so a change of weather rewrites it —
       but only if it is on screen. Putting it back up would be a second
       announcement of something that has already been said. */
    function showHoleCardIfShowing() {
        if ($('hole-card').classList.contains('show')) showHoleCard();
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

    /* Five of the seven chips live behind ☰ when the bar is compact. Overview
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
    function toggleDetail(force) {
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
        if (!W || !st().weather) return;
        $('sky-icon').textContent = st().weather.icon;
        $('sky-label').textContent = st().weather.label;
        $('shud-sky').textContent = st().weather.icon + ' ' + st().weather.label;
    }

    function syncWind() {
        var W = G3.weather;
        if (!W || !st().weather) return;
        var kph = W.windSpeedKph();
        $('sky-wind').textContent = '· ' + (kph < 4 ? 'still' : kph + ' km/h');
    }

    // How far there is left to go, which is the number the club choice is
    // really about. Updated every frame while the ball is rolling.
    function syncDistance() {
        var b = st().world.ball, cup = st().course.holes[st().holeIndex].cup;
        var d = Math.hypot(cup.x - b.x, cup.z - b.z);
        var text = st().world.sunk ? 'in' : d.toFixed(1) + ' m';
        $('to-cup').textContent = text;
        $('shud-dist').textContent = text;
    }

    function syncPower() {
        var club = st().club;
        var frac = Math.max(0, Math.min(1, st().aim.power / club.power));
        var hot = frac > C.OVERSWING;
        // Green through amber to red, and the same hue the arrow and the ring
        // are wearing out on the course.
        var hue = hot ? 0 : 120 * (1 - frac / C.OVERSWING);
        $('power-fill').style.width = (frac * 100).toFixed(1) + '%';
        $('power-fill').style.color = $('power-fill').style.background = 'hsl(' + hue + ' 85% 55%)';
        $('power-val').textContent = Math.round(frac * 100) + '%';
        $('power-fill').parentNode.classList.toggle('hot', hot);
        $('power-track').setAttribute('aria-valuenow', Math.round(frac * 100));
        syncSwing();
    }

    /* Swing is the only thing that plays a stroke, so it says plainly when it
       cannot: nothing loaded, or the ball is still moving. */
    function syncSwing() {
        var btn = $('btn-swing');
        if (!btn) return;
        var ready = st().phase === 'aim' && st().aim.power >= C.MIN_POWER;
        btn.disabled = !ready;
        btn.classList.toggle('ready', ready);
    }

    /* The club in hand lives in the bag now — a modelled one, parked in front
       of the camera (see bag.js). What stays in the DOM is the line of text
       under the meter, which doubles as the announcement for anyone who cannot
       see the bag at all. */
    function syncClubs() {
        if (G3.bag) G3.bag.setSelected(st().club.id);
        $('club-hint').textContent = st().club.name + ' — ' + st().club.blurb;
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
        var id = (G3.bag && G3.bag.state.hover) || st().club.id;
        var club = api.clubById(id);
        $('picker-name').textContent = club.name;
        $('picker-blurb').textContent = club.blurb;
        // Short on purpose: the club itself now carries the same line in its
        // own hand (bag.js), so this is the backup for a screen reader and a
        // reminder, not the only place to read it.
        $('picker-stats').innerHTML =
            '<b>' + club.key + '</b> · pwr <b>' + club.power + '</b> · loft <b>' +
            Math.round(club.loft * 180 / Math.PI) + '°</b>' +
            (club.id === st().club.id ? ' · <b>in hand</b>' : '');
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

    function toggleOverview() {
        R.cam.overview = !R.cam.overview;
        $('btn-view').classList.toggle('on', R.cam.overview);
    }

    /* ── fullscreen ─────────────────────────────────────────────────────── */

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
        setMuteIcon(A.toggleMute());
    }

    /* ── menus, cards and the banner ────────────────────────────────────── */

    function openMenu() {
        var save = st() ? st().save : S.load();
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
            btn.addEventListener('click', function () { api.newRound(course.id); });
            host.appendChild(btn);
        });
        $('menu').className = 'modal show';
    }

    function closeMenu() { $('menu').className = 'modal'; }

    function openCard(res) {
        var holes = st().course.holes;
        var rows = '', i, sc, t;
        for (i = 0; i < holes.length; i++) {
            sc = st().scores[i];
            t = typeof sc === 'number' ? S.term(sc, holes[i].par) : null;
            rows += '<tr><td class="n">' + (i + 1) + '</td>' +
                '<td class="nm">' + holes[i].name + '</td>' +
                '<td>' + holes[i].par + '</td>' +
                '<td class="' + (t ? (sc === 1 ? 'ace' : t.kind === 'over' ? 'over' : t.kind === 'par' ? 'level' : 'under') : '') + '">' +
                (typeof sc === 'number' ? sc : '—') + '</td></tr>';
        }
        var tot = res ? res.totals : S.totals(st().scores, holes);
        var par = S.coursePar(holes);
        $('card-title').textContent = res ? 'Round complete' : 'Scorecard';
        $('card-sub').textContent = st().course.name + (res && res.isBest ? ' — a new personal best.' : '');
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

    /* The banner over the hole when a putt drops. game.js works out what to
       call the score (scoring.js names it); this puts the words on screen. */
    function showBanner(term, strokes, par, isLast) {
        $('banner-term').textContent = term.label;
        $('banner-term').className = 'banner-term ' + term.kind;
        $('banner-detail').textContent = strokes + (strokes === 1 ? ' stroke' : ' strokes') +
            ' · par ' + par;
        $('banner-next').textContent = isLast ? 'See the card →' : 'Next hole →';
        $('banner').className = 'banner show';
    }

    function hideBanner() { $('banner').className = 'banner'; }

    function setMuteIcon(muted) {
        $('mute-icon').textContent = muted ? '🔇' : '🔊';
        $('btn-mute').setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    }


    /* Every control that only ever changes the chrome, wired in one place.
       game.js binds the ones that change the game; between the two lists,
       every interactive element on the page is accounted for exactly once. */
    /* ── wiring ─────────────────────────────────────────────────────────── */

    function bindChrome() {
        $('btn-courses').addEventListener('click', openMenu);
        $('btn-card').addEventListener('click', function () { openCard(null); });
        $('btn-view').addEventListener('click', toggleOverview);
        $('btn-full').addEventListener('click', toggleFullscreen);
        $('btn-help').addEventListener('click', openHowTo);
        $('btn-help-2').addEventListener('click', openHowTo);
        $('btn-mute').addEventListener('click', toggleMute);
        $('hole-name').addEventListener('click', showHoleCard);
        $('hud-toggle').addEventListener('click', function () { toggleDetail(); });
        $('btn-menu').addEventListener('click', toggleTopMenu);
        $('card-close').addEventListener('click', closeCard);
        $('howto-close').addEventListener('click', closeHowTo);
        $('howto').addEventListener('click', function (e) { if (e.target === this) closeHowTo(); });
        $('fs-prompt-go').addEventListener('click', function () { dismissFsPrompt(true); toggleFullscreen(); });
        $('fs-prompt-dismiss').addEventListener('click', function () { dismissFsPrompt(true); });

        // Anything picked out of the ☰ menu is the last thing it was for…
        $('topbar-menu').addEventListener('click', closeTopMenu);
        // …and a press anywhere else shuts it, the way a menu should.
        document.addEventListener('pointerdown', function (e) {
            if (!$('topbar-menu').classList.contains('open')) return;
            if (e.target && e.target.closest && e.target.closest('.topbar-actions')) return;
            closeTopMenu();
        }, true);

        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);

        syncCompact();
        // syncCompact() has just made the query; now follow it.
        if (compactQuery) {
            if (compactQuery.addEventListener) compactQuery.addEventListener('change', syncCompact);
            else if (compactQuery.addListener) compactQuery.addListener(syncCompact);
        }
    }

    function init(gameApi) {
        api = gameApi;
    }

    G3.hud = {
        init: init,
        bindChrome: bindChrome,

        // the figures
        sync: sync,
        syncDistance: syncDistance,
        syncPower: syncPower,
        syncSwing: syncSwing,
        syncClubs: syncClubs,
        syncPicker: syncPicker,
        syncWeather: syncWeather,
        syncWind: syncWind,

        // the layout
        syncCompact: syncCompact,
        toggleTopMenu: toggleTopMenu,
        closeTopMenu: closeTopMenu,
        toggleDetail: toggleDetail,
        measurePickerBand: measurePickerBand,

        // the things that appear and go away again
        toast: toast,
        showHoleCard: showHoleCard,
        showHoleCardIfShowing: showHoleCardIfShowing,
        hideHoleCard: hideHoleCard,
        showBanner: showBanner,
        hideBanner: hideBanner,
        openMenu: openMenu,
        closeMenu: closeMenu,
        openCard: openCard,
        closeCard: closeCard,
        openHowTo: openHowTo,
        closeHowTo: closeHowTo,
        seenHowTo: seenHowTo,
        wantsMenuAfterHowTo: function () { return menuAfterHowTo; },
        setMenuAfterHowTo: function (v) { menuAfterHowTo = !!v; },
        maybeShowFsPrompt: maybeShowFsPrompt,
        dismissFsPrompt: dismissFsPrompt,

        // the chips
        toggleOverview: toggleOverview,
        toggleFullscreen: toggleFullscreen,
        onFullscreenChange: onFullscreenChange,
        fullscreenElement: fullscreenElement,
        toggleMute: toggleMute,
        setMuteIcon: setMuteIcon
    };

})(window.G3);
