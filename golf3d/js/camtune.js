/* The dev camera panel: sliders over the long game's camera, for the owner
   to dial in on a phone while playing and send back (v1.238.0: "give me some
   dev controls for this so I can control it easier … give me some feedback
   and sliders and I'll get back to you").

   Dev mode only (☰ → Dev → Camera tuning). Every slider writes straight
   into G3.CONFIG, which render.js reads every frame, so a change is seen on
   the next shot with nothing to reload. What is dialled in is kept in this
   browser (CONFIG.CAM_TUNE_KEY) and put back on the next visit while dev mode
   is on; "Copy" puts the values on the clipboard to paste into a message, and
   "Reset" goes back to the shipped ones. Nothing here is read by the game
   with dev mode off. */
(function (G3) {
    'use strict';
    var C = G3.CONFIG;

    var EVERY = ['driver', 'iron5', 'iron', 'iron9', 'chipper', 'wedge'];

    /* One row per knob. `path` is under G3.CONFIG. A row with `pick` is a
       choice of `[label, value]`s. */
    var ROWS = [
        { head: 'Irons, wedges, pitches' },
        { path: 'LONG_CAM.LEASH', label: 'Wait before following', min: 0, max: 50, step: 0.5, unit: ' u',
          says: 'How far the ball gets from the camera before it starts to follow. 50 stays put until the ball is down.' },
        { path: 'LONG_CAM.FOLLOW', label: 'Follow pace', min: 0.5, max: 5, step: 0.1,
          says: 'How quickly it gets going and settles. Lower is softer.' },
        { path: 'LONG_CAM.MAX', label: 'Top speed', min: 3, max: 40, step: 1, unit: ' u/s',
          says: 'Never faster than this. The ball itself flies at 15 to 35.' },
        { path: 'LONG_CAM.GAZE', label: 'Look smoothing', min: 1, max: 14, step: 0.5,
          says: 'How tightly the view turns after the ball. Lower is smoother.' },
        { head: 'Short game' },
        { path: 'LONG_CAM.NEAR', label: 'Short game inside', min: 0, max: 80, step: 5, unit: ' m',
          says: 'A shot from this close to the flag holds the camera still first.' },
        { path: 'LONG_CAM.HOLD', label: 'Hold for', min: 0, max: 3, step: 0.1, unit: ' s',
          says: 'Seconds the camera stays still after a short-game strike.' },
        { head: 'Riding' },
        { path: 'LONG_CAM.RIDE', label: 'Rides with the ball', pick: [['Driver', ['driver']], ['Every club', EVERY], ['None', []]],
          says: 'Which clubs the camera flies behind. The rest are held, then followed.' },
        { path: 'LONG_CAM.DIST', label: 'Distance behind the ball', min: 3, max: 16, step: 0.5, unit: ' u',
          says: 'How far behind a riding shot it flies, and where the backswing puts it.' },
        { head: 'After the shot' },
        { path: 'LONG_CAM.ABOVE', label: 'Come down from above', min: 0, max: 5, step: 0.25, unit: ' u',
          says: 'How high the camera arrives over the ball before it settles. 0 is off.' },
        { path: 'LONG_CAM.ABOVE_T', label: 'Settle over', min: 0.3, max: 4, step: 0.1, unit: ' s',
          says: 'How long it takes to come down once the ball has stopped.' },
        { head: 'Zoom' },
        { path: 'LONG_BALL.SEAT', label: 'Camera distance', min: 0.3, max: 1.2, step: 0.05, unit: '×',
          says: 'How far back the camera sits on a long hole, the same everywhere on it. Higher is further out.' },
        { path: 'LONG_CAM.FOV', label: 'Lens', min: 36, max: 70, step: 1, unit: '°',
          says: 'The long game\'s field of view. Lower is a longer lens: flatter, closer. Higher is wider.' },
        { path: 'LONG_CAM.TRACK', label: 'Zoom with the ball', min: 0, max: 1, step: 0.05, unit: '×',
          says: 'While the camera waits, zoom in as the ball flies away so it keeps its size, like a TV camera. 0 is a fixed lens: the ball shrinks, then grows back as the camera walks up.' },
        { path: 'LONG_CAM.PUNCH', label: 'Strike flinch', min: 0, max: 1.5, step: 0.1, unit: '×',
          says: 'The lunge at the ball and back when you hit it, on a long hole. 0 is off.' },
        { path: 'SPEED_LENS', label: 'Speed zoom', min: 0, max: 1.5, step: 0.1, unit: '×',
          says: 'How much the view widens while the ball is fast: mini golf, and a shot while the camera rides it.' },
        { head: 'Ball size' },
        { path: 'LONG_BALL.BALL', label: 'Ball', min: 0.25, max: 1, step: 0.05, unit: '×',
          says: 'The long game\'s ball, as a share of the mini golf ball: its real size, tee to cup. Takes effect at once; the next shot settles it.' },
        { path: 'LONG_BALL.CUP', label: 'Cup', min: 0.3, max: 1, step: 0.05, unit: '×',
          says: 'The long game\'s cup, as a share of the mini golf cup. The green is cut for it when the next hole loads.' }
    ];

    /* Whole camera feels to try one after another (v1.249.0, the owner: "can
       you prepare 5 different presets for me to test"). Every one keeps the
       lens still under a shot: no speed zoom and no strike flinch, the two
       zooms nobody asked for. A preset names only what it changes; the
       rest is put back to the shipped value, so they never mix. */
    var PRESETS = [
        { id: 'now', name: 'Now', says: 'What ships today, zooms and all. The one to compare against.', set: {} },
        { id: 'steady', name: '1 Steady', says: 'Waits a moment, then follows close and quick, so the ball barely shrinks. No zooms.',
          set: { 'LONG_CAM.LEASH': 3, 'LONG_CAM.FOLLOW': 2.4, 'LONG_CAM.MAX': 20, 'LONG_CAM.GAZE': 6, 'LONG_CAM.HOLD': 0.8,
                 'LONG_CAM.ABOVE': 0.5, 'LONG_CAM.ABOVE_T': 1.6, 'LONG_CAM.TRACK': 0.3, 'LONG_CAM.PUNCH': 0,
                 'SPEED_LENS': 0 } },
        { id: 'ride', name: '2 Ride along', says: 'The camera flies behind every shot, irons and wedges too. The ball stays one size the whole way.',
          set: { 'LONG_CAM.RIDE': EVERY, 'LONG_CAM.DIST': 7, 'LONG_CAM.FOV': 55, 'LONG_CAM.ABOVE': 0.75,
                 'LONG_CAM.PUNCH': 0, 'SPEED_LENS': 0 } },
        { id: 'tripod', name: '3 Tripod', says: 'Stands where you hit it and only turns to watch, the whole flight. Walks up once the ball is down.',
          set: { 'LONG_CAM.RIDE': [], 'LONG_CAM.LEASH': 50, 'LONG_CAM.FOLLOW': 1.6, 'LONG_CAM.MAX': 14, 'LONG_CAM.GAZE': 5,
                 'LONG_CAM.ABOVE': 0, 'LONG_CAM.FOV': 50, 'LONG_CAM.PUNCH': 0, 'SPEED_LENS': 0 } },
        { id: 'tv', name: '4 Broadcast', says: 'Tripod, but it zooms in after the ball like a TV camera, so it never gets small. Zooms back out as it walks up.',
          set: { 'LONG_CAM.RIDE': [], 'LONG_CAM.LEASH': 50, 'LONG_CAM.FOLLOW': 1.6, 'LONG_CAM.MAX': 14, 'LONG_CAM.GAZE': 6,
                 'LONG_CAM.ABOVE': 0, 'LONG_CAM.FOV': 50, 'LONG_CAM.TRACK': 0.85, 'LONG_CAM.PUNCH': 0, 'SPEED_LENS': 0 } },
        { id: 'film', name: '5 Cinematic', says: 'Slow and floaty: a longer wait, a soft glide after the ball, a half zoom with it, and a slow settle from above.',
          set: { 'LONG_CAM.LEASH': 10, 'LONG_CAM.FOLLOW': 1.1, 'LONG_CAM.MAX': 9, 'LONG_CAM.GAZE': 3.5, 'LONG_CAM.HOLD': 1.2,
                 'LONG_CAM.DIST': 10, 'LONG_CAM.ABOVE': 1.5, 'LONG_CAM.ABOVE_T': 2.2, 'LONG_CAM.FOV': 48,
                 'LONG_CAM.TRACK': 0.5, 'LONG_CAM.PUNCH': 0, 'SPEED_LENS': 0 } }
    ];

    function get(path) {
        var o = C, k = path.split('.'), i;
        for (i = 0; i < k.length - 1; i++) o = o[k[i]];
        return o[k[k.length - 1]];
    }
    function set(path, v) {
        var o = C, k = path.split('.'), i;
        for (i = 0; i < k.length - 1; i++) o = o[k[i]];
        o[k[k.length - 1]] = v;
    }
    function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

    // The shipped values, read before anything stored is put back.
    var SHIPPED = {};
    ROWS.forEach(function (r) { if (r.path) SHIPPED[r.path] = JSON.parse(JSON.stringify(get(r.path))); });

    function devOn() {
        try { return localStorage.getItem(C.DEV_KEY) === '1'; } catch (e) { return false; }
    }
    function load() {
        try { return JSON.parse(localStorage.getItem(C.CAM_TUNE_KEY) || '{}') || {}; } catch (e) { return {}; }
    }
    function save() {
        var out = {};
        ROWS.forEach(function (r) {
            if (r.path && JSON.stringify(get(r.path)) !== JSON.stringify(SHIPPED[r.path])) out[r.path] = get(r.path);
        });
        try { localStorage.setItem(C.CAM_TUNE_KEY, JSON.stringify(out)); } catch (e) { /* no storage */ }
    }
    // Put back what was dialled in, dev mode only, and only paths still here.
    if (devOn()) {
        var kept = load();
        ROWS.forEach(function (r) { if (r.path && kept[r.path] !== undefined) set(r.path, kept[r.path]); });
    }

    function fmt(row, v) {
        var d = row.step < 0.1 ? 2 : row.step < 1 ? 1 : 0;
        return Number(v).toFixed(d) + (row.unit || '');
    }

    var panel = null;
    function build() {
        panel = document.createElement('div');
        panel.id = 'cam-tune';
        panel.className = 'cam-tune';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Camera tuning');
        var head = document.createElement('div');
        head.className = 'ct-head';
        head.innerHTML = '<b>Camera</b><span class="ct-ver">v' + G3.VERSION + '</span>' +
            '<button type="button" data-a="copy">Copy</button>' +
            '<button type="button" data-a="reset">Reset</button>' +
            '<button type="button" data-a="fold" aria-label="Fold">–</button>' +
            '<button type="button" data-a="close" aria-label="Close">✕</button>';
        panel.appendChild(head);
        var body = document.createElement('div');
        body.className = 'ct-body';
        var ps = document.createElement('div');
        ps.className = 'ct-sec';
        ps.textContent = 'Presets';
        body.appendChild(ps);
        var grid = document.createElement('div');
        grid.className = 'ct-presets';
        PRESETS.forEach(function (pr) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = pr.name;
            b.setAttribute('data-p', pr.id);
            b.addEventListener('click', function () { apply(pr.id); });
            pr.btn = b;
            grid.appendChild(b);
        });
        body.appendChild(grid);
        presetSays = document.createElement('p');
        presetSays.className = 'ct-says ct-psays';
        body.appendChild(presetSays);
        ROWS.forEach(function (r) {
            if (r.head) {
                var h = document.createElement('div');
                h.className = 'ct-sec';
                h.textContent = r.head;
                body.appendChild(h);
                return;
            }
            var row = document.createElement('label');
            row.className = 'ct-row';
            var top = document.createElement('span');
            top.className = 'ct-top';
            var name = document.createElement('span');
            name.textContent = r.label;
            var val = document.createElement('output');
            top.appendChild(name);
            top.appendChild(val);
            row.appendChild(top);
            var input;
            if (r.pick) {
                input = document.createElement('select');
                r.pick.forEach(function (o, i) {
                    var op = document.createElement('option');
                    op.value = String(i);
                    op.textContent = o[0];
                    input.appendChild(op);
                });
                input.addEventListener('change', function () {
                    set(r.path, r.pick[+input.value][1].slice());
                    show(r);
                    save();
                    markPreset();
                });
            } else {
                input = document.createElement('input');
                input.type = 'range';
                input.min = r.min; input.max = r.max; input.step = r.step;
                input.value = get(r.path);
                val.textContent = fmt(r, get(r.path));
                input.addEventListener('input', function () {
                    set(r.path, parseFloat(input.value));
                    val.textContent = fmt(r, input.value);
                    save();
                    markPreset();
                });
            }
            r.input = input; r.out = val;
            if (r.pick) show(r);
            row.appendChild(input);
            var says = document.createElement('span');
            says.className = 'ct-says';
            says.textContent = r.says;
            row.appendChild(says);
            body.appendChild(row);
        });
        var note = document.createElement('p');
        note.className = 'ct-note';
        note.textContent = 'Changes apply from the next shot and are kept on this phone. Copy, then paste the values into a message.';
        body.appendChild(note);
        panel.appendChild(body);
        markPreset();

        head.addEventListener('click', function (e) {
            var a = e.target && e.target.getAttribute('data-a');
            if (a === 'copy') copy(e.target);
            else if (a === 'reset') reset();
            else if (a === 'fold') panel.classList.toggle('folded');
            else if (a === 'close') close();
        });
        /* The panel is over the course: a drag on a slider must not reach
           the game's own swipe and aim, which listen on the page. */
        ['pointerdown', 'pointermove', 'pointerup', 'touchstart', 'touchmove', 'touchend',
         'mousedown', 'mousemove', 'mouseup', 'wheel', 'keydown'].forEach(function (t) {
            panel.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true });
        });
        document.body.appendChild(panel);
    }

    var presetSays = null;
    // A pick row's value, shown: the choice it matches, or "Custom".
    function show(r) {
        var v = get(r.path), i, at = -1;
        for (i = 0; i < r.pick.length; i++) if (same(r.pick[i][1], v)) at = i;
        if (r.input) r.input.value = at >= 0 ? String(at) : '';
        if (r.out) r.out.textContent = at >= 0 ? r.pick[at][0] : 'Custom';
    }
    // Every knob back on its slider, after something other than a slider set it.
    function refresh() {
        ROWS.forEach(function (r) {
            if (!r.path || !r.input) return;
            if (r.pick) show(r);
            else { r.input.value = get(r.path); r.out.textContent = fmt(r, get(r.path)); }
        });
        markPreset();
    }
    // The preset the knobs are on now, if they are on one.
    function current() {
        for (var i = 0; i < PRESETS.length; i++) {
            var pr = PRESETS[i], ok = true;
            ROWS.forEach(function (r) {
                if (!r.path) return;
                var want = pr.set[r.path] !== undefined ? pr.set[r.path] : SHIPPED[r.path];
                if (!same(get(r.path), want)) ok = false;
            });
            if (ok) return pr;
        }
        return null;
    }
    function markPreset() {
        if (!panel) return;
        var on = current();
        PRESETS.forEach(function (pr) { if (pr.btn) pr.btn.classList.toggle('on', pr === on); });
        if (presetSays) presetSays.textContent = on ? on.says : 'Custom: your own mix of the knobs below.';
    }
    /* A preset: every knob to the shipped value, then the preset's own on
       top, so nothing from the last one is left behind. */
    function apply(id) {
        var pr = null;
        PRESETS.forEach(function (p) { if (p.id === id) pr = p; });
        if (!pr) return false;
        ROWS.forEach(function (r) {
            if (!r.path) return;
            var v = pr.set[r.path] !== undefined ? pr.set[r.path] : SHIPPED[r.path];
            set(r.path, JSON.parse(JSON.stringify(v)));
        });
        save();
        refresh();
        return true;
    }

    function values() {
        var out = {}, pr = current();
        ROWS.forEach(function (r) { if (r.path) out[r.path] = get(r.path); });
        return 'Loft Links camera v' + G3.VERSION + ' · ' + (pr ? pr.name : 'Custom') + '\n' + JSON.stringify(out, null, 1);
    }
    function copy(btn) {
        var text = values(), done = function () {
            btn.textContent = 'Copied';
            setTimeout(function () { btn.textContent = 'Copy'; }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
        } else { fallback(text); done(); }
    }
    function fallback(text) {
        var t = document.createElement('textarea');
        t.value = text;
        t.setAttribute('readonly', '');
        t.style.position = 'fixed'; t.style.top = '0'; t.style.opacity = '0';
        document.body.appendChild(t);
        t.select();
        try { document.execCommand('copy'); } catch (e) { /* nothing more to try */ }
        document.body.removeChild(t);
    }
    function reset() {
        ROWS.forEach(function (r) {
            if (r.path) set(r.path, JSON.parse(JSON.stringify(SHIPPED[r.path])));
        });
        try { localStorage.removeItem(C.CAM_TUNE_KEY); } catch (e) { /* no storage */ }
        refresh();
    }

    function open() {
        if (!panel) build();
        panel.hidden = false;
        panel.classList.remove('folded');
    }
    function close() { if (panel) panel.hidden = true; }

    G3.camTune = { open: open, close: close, values: values, rows: ROWS, presets: PRESETS, apply: apply,
                   get preset() { var p = current(); return p ? p.id : null; } };
})(window.G3);
