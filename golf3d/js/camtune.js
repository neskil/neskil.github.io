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

    /* One row per knob. `path` is under G3.CONFIG. A row with `on` is a
       switch: `on`/`off` are the values it writes. */
    var ROWS = [
        { head: 'Irons, wedges, pitches' },
        { path: 'LONG_CAM.LEASH', label: 'Wait before following', min: 0, max: 25, step: 0.5, unit: ' u',
          says: 'How far the ball gets from the camera before it starts to follow.' },
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
        { head: 'Driver' },
        { path: 'LONG_CAM.RIDE', label: 'Driver rides with the ball', on: ['driver'], off: [],
          says: 'On: the camera flies behind a drive. Off: held, then followed, like the irons.' },
        { path: 'LONG_CAM.DIST', label: 'Distance behind the ball', min: 3, max: 16, step: 0.5, unit: ' u',
          says: 'How far behind a drive it rides, and where the backswing puts it.' },
        { head: 'After the shot' },
        { path: 'LONG_CAM.ABOVE', label: 'Come down from above', min: 0, max: 5, step: 0.25, unit: ' u',
          says: 'How high the camera arrives over the ball before it settles. 0 is off.' },
        { path: 'LONG_CAM.ABOVE_T', label: 'Settle over', min: 0.3, max: 4, step: 0.1, unit: ' s',
          says: 'How long it takes to come down once the ball has stopped.' },
        { head: 'Zoom' },
        { path: 'LONG_LOOK.SEAT', label: 'Address distance', min: 0.3, max: 1.2, step: 0.05, unit: '×',
          says: 'How far behind the ball you stand to hit, on a long hole. Higher is further out.' },
        { path: 'SPEED_LENS', label: 'Speed zoom', min: 0, max: 1.5, step: 0.1, unit: '×',
          says: 'How much the view widens while the ball is fast. 0 keeps one zoom throughout.' }
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
    function isOn(row) { var v = get(row.path); return !!(v && v.length); }

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
            var input = document.createElement('input');
            if (r.on) {
                input.type = 'checkbox';
                input.checked = isOn(r);
                val.textContent = input.checked ? 'On' : 'Off';
                input.addEventListener('change', function () {
                    set(r.path, (input.checked ? r.on : r.off).slice());
                    val.textContent = input.checked ? 'On' : 'Off';
                    save();
                });
            } else {
                input.type = 'range';
                input.min = r.min; input.max = r.max; input.step = r.step;
                input.value = get(r.path);
                val.textContent = fmt(r, get(r.path));
                input.addEventListener('input', function () {
                    set(r.path, parseFloat(input.value));
                    val.textContent = fmt(r, input.value);
                    save();
                });
            }
            r.input = input; r.out = val;
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

    function values() {
        var out = {};
        ROWS.forEach(function (r) { if (r.path) out[r.path] = get(r.path); });
        return 'Loft Links camera v' + G3.VERSION + '\n' + JSON.stringify(out, null, 1);
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
            if (!r.path) return;
            set(r.path, JSON.parse(JSON.stringify(SHIPPED[r.path])));
            if (!r.input) return;
            if (r.on) { r.input.checked = isOn(r); r.out.textContent = r.input.checked ? 'On' : 'Off'; }
            else { r.input.value = get(r.path); r.out.textContent = fmt(r, get(r.path)); }
        });
        try { localStorage.removeItem(C.CAM_TUNE_KEY); } catch (e) { /* no storage */ }
    }

    function open() {
        if (!panel) build();
        panel.hidden = false;
        panel.classList.remove('folded');
    }
    function close() { if (panel) panel.hidden = true; }

    G3.camTune = { open: open, close: close, values: values, rows: ROWS };
})(window.G3);
