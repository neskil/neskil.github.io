/* The hole editor.

   It runs on the game's own modules — config.js for the constants, physics.js
   for the simulation, render.js for the picture — and owns no copy of any of
   them. That is the whole design: a hole that looks right in here looks right
   in play because the same renderer drew it, and a hole that plays right in
   here plays right in the game because the same integrator moved the ball.
   The editor's job is only to let you push rectangles about and then tell you
   the truth about what you built.

   The checks in the Check panel are the rules from tests.html, ported one for
   one. A hole that passes here is a hole the suite will accept, which is the
   point: finding out at the editor rather than at the test run.

   ES5-flavoured, like the rest of golf/. No build step, no dependencies. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;
    var P = GOLF.physics;
    var R = GOLF.render;

    /* ── the vocabulary ─────────────────────────────────────────────────── */

    /* Everything a hole is made of, in the order render.js paints it. The
       list order matters twice: the sidebar groups by it, and hit-testing
       walks it backwards so a post on top of a bunker is what you grab. */
    var KINDS = [
        { key: 'rough',   label: 'Rough',  round: false, color: '#1c6b39' },
        { key: 'slopes',  label: 'Slope',  round: false, color: '#8fbf9f' },
        { key: 'ice',     label: 'Ice',    round: false, color: '#bfe4f2' },
        { key: 'sand',    label: 'Sand',   round: false, color: '#e3ca92' },
        { key: 'water',   label: 'Water',  round: false, color: '#1b6d9e' },
        { key: 'walls',   label: 'Wall',   round: false, color: '#6d4a2e' },
        { key: 'bumpers', label: 'Post',   round: true,  color: '#f59e0b' }
    ];
    var KIND_KEYS = KINDS.map(function (k) { return k.key; });
    // The order courses.js lists them in, which is not the order they are
    // painted in. The export follows the file; the sidebar follows the paint.
    var EXPORT_ORDER = ['walls', 'water', 'sand', 'rough', 'ice', 'bumpers', 'slopes'];
    function kindOf(key) {
        for (var i = 0; i < KINDS.length; i++) if (KINDS[i].key === key) return KINDS[i];
        return null;
    }

    var MIN_SIDE = 20;          // the thinnest rectangle the substep cap can protect
    var DEFAULT_RECT = {
        walls: [26, 160], water: [200, 140], sand: [180, 160],
        rough: [240, 170], ice: [220, 180], slopes: [260, 220]
    };
    var HANDLE = 6;             // hit radius for a resize grip, in screen pixels
    var SAVE_KEY = 'miniGolf.editor.v1';
    var PLAYTEST_KEY = 'miniGolf.playtest.v1';

    /* ── DOM ────────────────────────────────────────────────────────────── */

    function $(id) { return document.getElementById(id); }

    var stage = $('stage');
    var canvas = $('board');
    var ctx = canvas.getContext('2d');

    /* ── state ──────────────────────────────────────────────────────────── */

    /* S is the whole editable document and nothing else, because undo is a
       JSON round-trip of it. Anything that must survive an undo lives here;
       anything that must not (the view, the pointer, the play session) lives
       outside it. */
    var S = {
        hole: null,
        sel: null,       // {kind, idx} | {kind:'tee'} | {kind:'hole'} | null
        tool: 'select',
        snap: 10,
        grid: false,
        loadedFrom: ''
    };

    var view = { x: 0, y: 0, scale: 1 };
    var mouse = { wx: 0, wy: 0, sx: 0, sy: 0, down: false };
    var drag = null;       // {type:'move'|'resize'|'draw'|'pan'|'marker'|'radius', …}
    var mode = 'edit';     // 'edit' | 'play'
    var animate = true;    // does the clock run in edit mode
    var clock = 0;         // edit-mode world time, so moving walls swing
    var spaceHeld = false;
    var play = null;       // the play-mode session, see enterPlay()
    var dpr = 1;

    /* ── the hole model ─────────────────────────────────────────────────── */

    function blankHole() {
        return {
            name: 'New Hole',
            blurb: 'Say what makes it worth playing.',
            par: 3,
            tee: { x: 140, y: 320 },
            hole: { x: 820, y: 320 },
            walls: [], water: [], sand: [], rough: [], ice: [], bumpers: [], slopes: []
        };
    }

    /* Same normaliser courses.js applies, for the same reason: every consumer
       downstream gets to loop without a guard. */
    function normalize(h) {
        var out = {
            name: typeof h.name === 'string' ? h.name : 'New Hole',
            blurb: typeof h.blurb === 'string' ? h.blurb : '',
            par: typeof h.par === 'number' ? h.par : 3,
            tee: { x: num(h.tee && h.tee.x, 140), y: num(h.tee && h.tee.y, 320) },
            hole: { x: num(h.hole && h.hole.x, 820), y: num(h.hole && h.hole.y, 320) }
        };
        KIND_KEYS.forEach(function (k) {
            out[k] = (Array.isArray(h[k]) ? h[k] : []).map(function (s) { return cloneShape(k, s); });
        });
        return out;
    }

    function num(v, dflt) { return typeof v === 'number' && isFinite(v) ? v : dflt; }

    function cloneShape(kind, s) {
        if (kind === 'bumpers') return { x: num(s.x, 0), y: num(s.y, 0), r: num(s.r, C.BUMPER_MIN_R) };
        var o = { x: num(s.x, 0), y: num(s.y, 0), w: num(s.w, MIN_SIDE), h: num(s.h, MIN_SIDE) };
        if (kind === 'slopes') { o.ax = num(s.ax, 0); o.ay = num(s.ay, 120); }
        if (kind === 'walls' && s.move) {
            o.move = {
                axis: s.move.axis === 'x' ? 'x' : 'y',
                amp: num(s.move.amp, 100),
                speed: num(s.move.speed, 1.3),
                phase: num(s.move.phase, 0)
            };
        }
        return o;
    }

    function list(kind) { return S.hole[kind]; }
    function selShape() {
        if (!S.sel || !S.sel.kind || S.sel.kind === 'tee' || S.sel.kind === 'hole') return null;
        return list(S.sel.kind)[S.sel.idx] || null;
    }

    /* ── history ────────────────────────────────────────────────────────── */

    /* Coarse-grained on purpose: one entry per gesture, not per frame. A drag
       snapshots on pointerdown and never again, so undo rewinds the whole
       move rather than a hundred pixels of it. */
    var undoStack = [], redoStack = [];

    function snapshot() {
        undoStack.push(JSON.stringify({ hole: S.hole, sel: S.sel }));
        if (undoStack.length > 60) undoStack.shift();
        redoStack.length = 0;
        syncHistoryButtons();
    }

    function applyHistory(from, to) {
        if (!from.length) return;
        to.push(JSON.stringify({ hole: S.hole, sel: S.sel }));
        var d = JSON.parse(from.pop());
        S.hole = d.hole;
        S.sel = d.sel;
        clampSelection();
        syncHistoryButtons();
        refreshAll();
    }

    function undo() { applyHistory(undoStack, redoStack); }
    function redo() { applyHistory(redoStack, undoStack); }

    function syncHistoryButtons() {
        $('btn-undo').disabled = !undoStack.length;
        $('btn-redo').disabled = !redoStack.length;
    }

    function clampSelection() {
        if (!S.sel) return;
        if (S.sel.kind === 'tee' || S.sel.kind === 'hole') return;
        var l = list(S.sel.kind);
        if (!l || S.sel.idx >= l.length) S.sel = null;
    }

    /* ── geometry helpers ───────────────────────────────────────────────── */

    function w2s(wx, wy) { return { x: wx * view.scale + view.x, y: wy * view.scale + view.y }; }
    function s2w(sx, sy) { return { x: (sx - view.x) / view.scale, y: (sy - view.y) / view.scale }; }

    function snapVal(v, e) {
        var step = S.snap;
        if (e && e.altKey) step = 1;
        else if (e && e.shiftKey) step = S.snap * 5;
        return Math.round(v / step) * step;
    }

    // A rectangle with a negative width is a rectangle drawn right to left.
    // Fix it here rather than teaching every consumer about it.
    function fixRect(r) {
        if (r.w < 0) { r.x += r.w; r.w = -r.w; }
        if (r.h < 0) { r.y += r.h; r.h = -r.h; }
        return r;
    }

    function rectHit(r, wx, wy, pad) {
        pad = pad || 0;
        return wx >= r.x - pad && wx <= r.x + r.w + pad && wy >= r.y - pad && wy <= r.y + r.h + pad;
    }

    /* The eight grips on a rectangle, as world points. Named by the corner or
       edge they pull, which is also which of x/y/w/h they touch. */
    function rectHandles(r) {
        var cx = r.x + r.w / 2, cy = r.y + r.h / 2;
        return [
            { id: 'nw', x: r.x, y: r.y }, { id: 'n', x: cx, y: r.y }, { id: 'ne', x: r.x + r.w, y: r.y },
            { id: 'w', x: r.x, y: cy }, { id: 'e', x: r.x + r.w, y: cy },
            { id: 'sw', x: r.x, y: r.y + r.h }, { id: 's', x: cx, y: r.y + r.h }, { id: 'se', x: r.x + r.w, y: r.y + r.h }
        ];
    }

    function resizeRect(orig, id, wx, wy) {
        var r = { x: orig.x, y: orig.y, w: orig.w, h: orig.h };
        if (id === 'nw' || id === 'w' || id === 'sw') { r.w = orig.x + orig.w - wx; r.x = wx; }
        if (id === 'ne' || id === 'e' || id === 'se') r.w = wx - orig.x;
        if (id === 'nw' || id === 'n' || id === 'ne') { r.h = orig.y + orig.h - wy; r.y = wy; }
        if (id === 'sw' || id === 's' || id === 'se') r.h = wy - orig.y;
        return fixRect(r);
    }

    /* ── the view ───────────────────────────────────────────────────────── */

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = stage.clientWidth;
        var h = Math.max(80, stage.clientHeight - 24);   // the status strip
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
    }

    function fitView() {
        var w = canvas.clientWidth, h = canvas.clientHeight;
        view.scale = Math.min((w - 48) / C.WORLD_W, (h - 48) / C.WORLD_H);
        view.x = (w - C.WORLD_W * view.scale) / 2;
        view.y = (h - C.WORLD_H * view.scale) / 2;
        syncStatus();
    }

    function zoomAt(factor, sx, sy) {
        var before = s2w(sx, sy);
        view.scale = Math.max(0.15, Math.min(4, view.scale * factor));
        var after = s2w(sx, sy);
        view.x += (after.x - before.x) * view.scale;
        view.y += (after.y - before.y) * view.scale;
        syncStatus();
    }

    /* ── drawing ────────────────────────────────────────────────────────── */

    /* The green is drawn by render.js, exactly as the game draws it — that is
       the point of the editor sharing the game's modules rather than owning a
       schematic view of its own. Everything below the frame() call is
       editor furniture layered on top: grid, selection, grips, and the ghosts
       that show where a moving wall travels. */
    function draw(dt) {
        var state = mode === 'play' ? play : editState();

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        ctx.fillStyle = '#0a0f14';
        ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

        ctx.save();
        ctx.translate(view.x, view.y);
        ctx.scale(view.scale, view.scale);

        R.frame(ctx, state, dt);

        if (S.grid) drawGrid();
        if (mode === 'edit') {
            drawTravelGhosts();
            drawSelection();
            drawDraft();
        }

        ctx.restore();
    }

    // Edit mode parks the ball on the tee and runs its own clock, so the
    // gates swing without anything integrating a ball nobody has hit.
    var editWorld = null;
    function editState() {
        if (!editWorld) editWorld = P.createWorld(S.hole, S.hole.tee, 0);
        editWorld.course = S.hole;
        editWorld.time = clock;
        editWorld.ball.x = S.hole.tee.x;
        editWorld.ball.y = S.hole.tee.y;
        editWorld.sunk = false;
        return { world: editWorld, aim: { active: false, angle: 0, power: 0 }, trail: [] };
    }

    function drawGrid() {
        var step = S.snap < 10 ? 20 : S.snap * 2;
        ctx.save();
        ctx.lineWidth = 1 / view.scale;
        ctx.strokeStyle = 'rgba(255,255,255,0.09)';
        ctx.beginPath();
        for (var x = step; x < C.WORLD_W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, C.WORLD_H); }
        for (var y = step; y < C.WORLD_H; y += step) { ctx.moveTo(0, y); ctx.lineTo(C.WORLD_W, y); }
        ctx.stroke();
        ctx.restore();
    }

    /* Where a moving wall gets to at the two ends of its travel. A sine
       spends most of its time near its extremes, so these ghosts are the two
       positions that actually matter — including the one that decides whether
       the hole seals shut. */
    function drawTravelGhosts() {
        var walls = S.hole.walls;
        ctx.save();
        ctx.setLineDash([6 / view.scale, 5 / view.scale]);
        ctx.lineWidth = 1.5 / view.scale;
        ctx.strokeStyle = 'rgba(251,191,36,0.55)';
        for (var i = 0; i < walls.length; i++) {
            var w = walls[i];
            if (!w.move) continue;
            [-1, 1].forEach(function (s) {
                var o = s * w.move.amp;
                var rx = w.move.axis === 'y' ? w.x : w.x + o;
                var ry = w.move.axis === 'y' ? w.y + o : w.y;
                ctx.strokeRect(rx, ry, w.w, w.h);
            });
        }
        ctx.restore();
    }

    function drawSelection() {
        if (!S.sel) return;
        ctx.save();
        ctx.lineWidth = 2 / view.scale;
        ctx.strokeStyle = '#58a6ff';

        if (S.sel.kind === 'tee' || S.sel.kind === 'hole') {
            var p = S.hole[S.sel.kind];
            ctx.beginPath();
            ctx.arc(p.x, p.y, (S.sel.kind === 'tee' ? 15 : C.HOLE_R + 4), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            return;
        }

        var s = selShape();
        if (!s) { ctx.restore(); return; }

        if (S.sel.kind === 'bumpers') {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r + 3, 0, Math.PI * 2);
            ctx.stroke();
            grip(s.x + s.r, s.y);
        } else {
            ctx.strokeRect(s.x, s.y, s.w, s.h);
            rectHandles(s).forEach(function (h) { grip(h.x, h.y); });
        }
        ctx.restore();

        function grip(x, y) {
            var r = HANDLE / view.scale;
            ctx.fillStyle = '#0d1117';
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
            ctx.strokeStyle = '#58a6ff';
            ctx.lineWidth = 1.5 / view.scale;
            ctx.strokeRect(x - r, y - r, r * 2, r * 2);
        }
    }

    // The rectangle being dragged out right now, before it exists.
    function drawDraft() {
        if (!drag || drag.type !== 'draw' || !drag.preview) return;
        var k = kindOf(drag.kind);
        ctx.save();
        ctx.setLineDash([7 / view.scale, 5 / view.scale]);
        ctx.lineWidth = 2 / view.scale;
        ctx.strokeStyle = k.color;
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        if (k.round) {
            ctx.beginPath();
            ctx.arc(drag.preview.x, drag.preview.y, drag.preview.r, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
        } else {
            ctx.fillRect(drag.preview.x, drag.preview.y, drag.preview.w, drag.preview.h);
            ctx.strokeRect(drag.preview.x, drag.preview.y, drag.preview.w, drag.preview.h);
        }
        ctx.restore();
    }

    /* ── hit testing ────────────────────────────────────────────────────── */

    function hitHandle(wx, wy) {
        if (!S.sel || S.sel.kind === 'tee' || S.sel.kind === 'hole') return null;
        var s = selShape();
        if (!s) return null;
        var tol = (HANDLE + 3) / view.scale;
        if (S.sel.kind === 'bumpers') {
            if (Math.abs(wx - (s.x + s.r)) <= tol && Math.abs(wy - s.y) <= tol) return { id: 'r' };
            return null;
        }
        var hs = rectHandles(s);
        for (var i = 0; i < hs.length; i++) {
            if (Math.abs(wx - hs[i].x) <= tol && Math.abs(wy - hs[i].y) <= tol) return hs[i];
        }
        return null;
    }

    function hitMarker(wx, wy) {
        var tol = 16 / view.scale;
        if (Math.hypot(wx - S.hole.hole.x, wy - S.hole.hole.y) <= Math.max(C.HOLE_R, tol)) return 'hole';
        if (Math.hypot(wx - S.hole.tee.x, wy - S.hole.tee.y) <= Math.max(14, tol)) return 'tee';
        return null;
    }

    // Backwards through the paint order, so the thing drawn on top is the
    // thing you grab.
    function hitShape(wx, wy) {
        for (var i = KINDS.length - 1; i >= 0; i--) {
            var kind = KINDS[i], l = list(kind.key);
            for (var j = l.length - 1; j >= 0; j--) {
                var s = l[j];
                if (kind.round) {
                    if (Math.hypot(wx - s.x, wy - s.y) <= s.r) return { kind: kind.key, idx: j };
                } else if (rectHit(s, wx, wy)) {
                    return { kind: kind.key, idx: j };
                }
            }
        }
        return null;
    }

    /* ── pointer ────────────────────────────────────────────────────────── */

    function pointerWorld(e) {
        var r = canvas.getBoundingClientRect();
        var sx = e.clientX - r.left, sy = e.clientY - r.top;
        var w = s2w(sx, sy);
        return { sx: sx, sy: sy, wx: w.x, wy: w.y };
    }

    function onDown(e) {
        var p = pointerWorld(e);
        mouse.down = true;
        canvas.setPointerCapture(e.pointerId);

        // Panning wins over everything: middle button, space, or alt+drag.
        if (e.button === 1 || spaceHeld || (e.altKey && S.tool === 'select')) {
            drag = { type: 'pan', sx: p.sx, sy: p.sy, vx: view.x, vy: view.y };
            return;
        }

        if (mode === 'play') { playDown(p); return; }

        if (S.tool === 'tee' || S.tool === 'hole') {
            snapshot();
            S.hole[S.tool].x = clampX(snapVal(p.wx, e));
            S.hole[S.tool].y = clampY(snapVal(p.wy, e));
            S.sel = { kind: S.tool };
            setTool('select');
            refreshAll();
            return;
        }

        if (S.tool !== 'select') {
            drag = {
                type: 'draw', kind: S.tool,
                x0: snapVal(p.wx, e), y0: snapVal(p.wy, e),
                moved: false, preview: null, event: e
            };
            return;
        }

        var handle = hitHandle(p.wx, p.wy);
        if (handle) {
            var s = selShape();
            drag = {
                type: handle.id === 'r' ? 'radius' : 'resize',
                id: handle.id, orig: JSON.parse(JSON.stringify(s))
            };
            return;
        }

        var marker = hitMarker(p.wx, p.wy);
        if (marker) {
            S.sel = { kind: marker };
            drag = { type: 'marker', which: marker, dx: S.hole[marker].x - p.wx, dy: S.hole[marker].y - p.wy };
            refreshSidebar();
            return;
        }

        var hit = hitShape(p.wx, p.wy);
        if (hit) {
            S.sel = hit;
            var sh = list(hit.kind)[hit.idx];
            drag = { type: 'move', dx: sh.x - p.wx, dy: sh.y - p.wy };
            refreshSidebar();
        } else {
            S.sel = null;
            refreshSidebar();
        }
    }

    function onMove(e) {
        var p = pointerWorld(e);
        mouse.wx = p.wx; mouse.wy = p.wy; mouse.sx = p.sx; mouse.sy = p.sy;
        syncStatus();

        if (!drag) return;

        if (drag.type === 'pan') {
            view.x = drag.vx + (p.sx - drag.sx);
            view.y = drag.vy + (p.sy - drag.sy);
            return;
        }
        if (mode === 'play') { playMove(p); return; }

        if (drag.type === 'draw') {
            var k = kindOf(drag.kind);
            drag.moved = Math.abs(p.wx - drag.x0) > 3 || Math.abs(p.wy - drag.y0) > 3;
            if (k.round) {
                var rad = Math.max(C.BUMPER_MIN_R, Math.round(Math.hypot(p.wx - drag.x0, p.wy - drag.y0)));
                drag.preview = { x: drag.x0, y: drag.y0, r: drag.moved ? rad : C.BUMPER_MIN_R + 10 };
            } else {
                drag.preview = fixRect({
                    x: drag.x0, y: drag.y0,
                    w: snapVal(p.wx, e) - drag.x0, h: snapVal(p.wy, e) - drag.y0
                });
            }
            return;
        }

        // Selecting something is not an edit. The undo entry is taken here,
        // at the first pixel of movement, so a stack of clicks does not fill
        // the history with entries that restore nothing.
        if (!drag.snapped) { snapshot(); drag.snapped = true; }

        if (drag.type === 'marker') {
            S.hole[drag.which].x = clampX(snapVal(p.wx + drag.dx, e));
            S.hole[drag.which].y = clampY(snapVal(p.wy + drag.dy, e));
            onHoleEdited();
            return;
        }

        var s = selShape();
        if (!s) return;

        if (drag.type === 'move') {
            s.x = snapVal(p.wx + drag.dx, e);
            s.y = snapVal(p.wy + drag.dy, e);
        } else if (drag.type === 'radius') {
            s.r = Math.max(C.BUMPER_MIN_R, Math.round(Math.abs(snapVal(p.wx, e) - s.x)));
        } else if (drag.type === 'resize') {
            var r = resizeRect(drag.orig, drag.id, snapVal(p.wx, e), snapVal(p.wy, e));
            s.x = r.x; s.y = r.y; s.w = Math.max(MIN_SIDE, r.w); s.h = Math.max(MIN_SIDE, r.h);
        }
        onHoleEdited();
    }

    function onUp(e) {
        mouse.down = false;
        if (canvas.hasPointerCapture && canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
        }
        if (mode === 'play' && drag && drag.type !== 'pan') { playUp(); drag = null; return; }

        if (drag && drag.type === 'draw') {
            commitDraw(drag, e);
        }
        drag = null;
    }

    /* A click without a drag still makes a shape — at a sane default size,
       centred where you clicked. Nobody wants to discover that a tap produced
       a 0x0 wall. */
    function commitDraw(d, e) {
        var kind = d.kind, k = kindOf(kind);
        snapshot();
        var shape;
        if (k.round) {
            shape = { x: d.x0, y: d.y0, r: d.preview ? d.preview.r : C.BUMPER_MIN_R + 10 };
        } else if (d.moved && d.preview) {
            shape = { x: d.preview.x, y: d.preview.y, w: Math.max(MIN_SIDE, d.preview.w), h: Math.max(MIN_SIDE, d.preview.h) };
        } else {
            var def = DEFAULT_RECT[kind] || [120, 120];
            shape = { x: snapVal(d.x0 - def[0] / 2, e), y: snapVal(d.y0 - def[1] / 2, e), w: def[0], h: def[1] };
        }
        if (kind === 'slopes') { shape.ax = 0; shape.ay = 150; }
        list(kind).push(shape);
        S.sel = { kind: kind, idx: list(kind).length - 1 };
        refreshAll();
    }

    function clampX(v) { return Math.max(C.BALL_R + 2, Math.min(C.WORLD_W - C.BALL_R - 2, v)); }
    function clampY(v) { return Math.max(C.BALL_R + 2, Math.min(C.WORLD_H - C.BALL_R - 2, v)); }

    canvas.addEventListener('pointerdown', function (e) { e.preventDefault(); onDown(e); });
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', function () { drag = null; mouse.down = false; });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    canvas.addEventListener('wheel', function (e) {
        e.preventDefault();
        var r = canvas.getBoundingClientRect();
        zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
        syncStatus();
    }, { passive: false });

    /* ── play mode ──────────────────────────────────────────────────────── */

    /* Not a preview of the game: the game. Same integrator, same constants,
       same slingshot drag. The only thing missing is the scorecard, because
       one hole is not a round. */
    function enterPlay() {
        mode = 'play';
        play = {
            world: P.createWorld(S.hole, S.hole.tee, 0),
            aim: { active: false, angle: 0, power: 0, origin: null },
            trail: [],
            strokes: 0,
            splashAt: 0,
            done: false
        };
        R.effects.clear();
        syncModeUI();
    }

    function exitPlay() {
        mode = 'edit';
        play = null;
        R.effects.clear();
        syncModeUI();
    }

    function resetBall() {
        if (mode !== 'play') return;
        enterPlay();
        toast('Back on the tee');
    }

    function playDown(p) {
        if (play.done) { enterPlay(); return; }
        if (play.world.moving) return;
        play.aim.origin = { x: p.wx, y: p.wy };
        aimFrom(p.wx, p.wy);
        drag = { type: 'aim' };
    }

    function playMove(p) {
        if (!play.aim.active) return;
        aimFrom(p.wx, p.wy);
    }

    function playUp() {
        if (!play.aim.active) return;
        if (play.aim.power >= C.MIN_POWER && P.launch(play.world, play.aim.angle, play.aim.power)) {
            play.strokes++;
            play.trail = [];
        }
        play.aim.active = false;
        play.aim.power = 0;
        play.aim.origin = null;
    }

    // The game's own slingshot: the ball leaves along the line from the
    // pointer back to wherever the drag started.
    function aimFrom(wx, wy) {
        var o = play.aim.origin || play.world.ball;
        var dx = o.x - wx, dy = o.y - wy;
        play.aim.angle = Math.atan2(dy, dx);
        play.aim.power = Math.min(Math.hypot(dx, dy), C.DRAG_MAX) / C.DRAG_MAX * C.MAX_POWER;
        play.aim.active = true;
    }

    function stepPlay(dt, now) {
        var w = play.world;
        P.advance(w, dt, {});
        if (w.moving) {
            play.trail.push({ x: w.ball.x, y: w.ball.y });
            if (play.trail.length > 20) play.trail.shift();
        } else if (play.trail.length) {
            play.trail.shift();
        }
        if (w.splash && !play.splashAt) play.splashAt = now;
        if (w.splash && now - play.splashAt > 550) {
            play.strokes += C.WATER_PENALTY;
            w.ball.x = w.origin.x; w.ball.y = w.origin.y;
            w.ball.vx = w.ball.vy = 0;
            w.splash = false;
            play.splashAt = 0;
            play.trail = [];
            toast('Water — one stroke penalty', 'bad');
        }
        if (w.sunk && !play.done) {
            play.done = true;
            R.effects.sink(S.hole.hole.x, S.hole.hole.y);
            toast('Holed in ' + play.strokes + ' against a par of ' + S.hole.par, 'good');
        }
    }

    /* ── sidebar: the shape list ────────────────────────────────────────── */

    function refreshAll() {
        refreshSidebar();
        updateOut();
        scheduleSave();
    }

    // Called from a drag, where rebuilding the whole sidebar every frame
    // would fight the inputs the user is not touching.
    function onHoleEdited() {
        updateInspectorValues();
        updateOut();
        scheduleSave();
    }

    function refreshSidebar() {
        renderShapeList();
        renderInspector();
        syncStatus();
    }

    function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    function shapeSummary(kind, s) {
        if (kind === 'bumpers') return 'r ' + Math.round(s.r) + ' @ ' + Math.round(s.x) + ',' + Math.round(s.y);
        var base = Math.round(s.w) + '×' + Math.round(s.h) + ' @ ' + Math.round(s.x) + ',' + Math.round(s.y);
        if (kind === 'slopes') base += '  ↘ ' + Math.round(s.ax) + ',' + Math.round(s.ay);
        if (kind === 'walls' && s.move) base += '  ↔ ' + s.move.axis + ' ' + Math.round(s.move.amp);
        return base;
    }

    function renderShapeList() {
        var html = '';
        var markers = [
            { kind: 'tee', label: 'Tee', p: S.hole.tee },
            { kind: 'hole', label: 'Cup', p: S.hole.hole }
        ];
        markers.forEach(function (m) {
            var on = S.sel && S.sel.kind === m.kind;
            html += '<div class="sitem' + (on ? ' active' : '') + '" data-marker="' + m.kind + '">' +
                '<span class="sname">' + (m.kind === 'tee' ? '⛳ ' : '◉ ') + m.label + '</span>' +
                '<span class="smeta">' + Math.round(m.p.x) + ',' + Math.round(m.p.y) + '</span></div>';
        });

        var total = 0;
        KINDS.forEach(function (k) {
            var l = list(k.key);
            total += l.length;
            l.forEach(function (s, i) {
                var on = S.sel && S.sel.kind === k.key && S.sel.idx === i;
                html += '<div class="sitem' + (on ? ' active' : '') + '" data-kind="' + k.key + '" data-idx="' + i + '">' +
                    '<i class="swatch' + (k.round ? ' round' : '') + '" style="background:' + k.color + '"></i>' +
                    '<span class="sname">' + k.label + ' ' + (i + 1) +
                    (k.key === 'walls' && s.move ? ' <span class="smeta">(moves)</span>' : '') + '</span>' +
                    '<span class="smeta">' + esc(shapeSummary(k.key, s)) + '</span>' +
                    '<span class="xbtn" data-del="1" title="Delete">×</span></div>';
            });
        });
        if (!total) html += '<div class="empty">No hazards yet — pick a tool and drag one out.</div>';
        $('shape-list').innerHTML = html;
    }

    $('shape-list').addEventListener('click', function (e) {
        var row = e.target.closest ? e.target.closest('.sitem') : null;
        if (!row) return;
        if (row.dataset.marker) {
            S.sel = { kind: row.dataset.marker };
            refreshSidebar();
            return;
        }
        var kind = row.dataset.kind, idx = +row.dataset.idx;
        if (e.target.dataset && e.target.dataset.del) {
            snapshot();
            list(kind).splice(idx, 1);
            if (S.sel && S.sel.kind === kind && S.sel.idx === idx) S.sel = null;
            else clampSelection();
            refreshAll();
            return;
        }
        S.sel = { kind: kind, idx: idx };
        refreshSidebar();
    });

    /* ── sidebar: the inspector ─────────────────────────────────────────── */

    function numRow(label, field, value, step, title) {
        return '<div class="row"><span class="lbl"' + (title ? ' title="' + esc(title) + '"' : '') + '>' + label + '</span>' +
            '<span class="field"><input type="number" data-field="' + field + '" step="' + (step || 1) +
            '" value="' + (Math.round(value * 1000) / 1000) + '"></span></div>';
    }

    function renderInspector() {
        var box = $('inspector');
        if (!S.sel) {
            box.innerHTML = '<div class="subhead">Selection</div><div class="hint">Nothing selected. Click a shape on the green, or a row above.</div>';
            return;
        }

        if (S.sel.kind === 'tee' || S.sel.kind === 'hole') {
            var p = S.hole[S.sel.kind];
            box.innerHTML = '<div class="subhead">' + (S.sel.kind === 'tee' ? 'Tee' : 'Cup') + '</div>' +
                numRow('x', 'x', p.x) + numRow('y', 'y', p.y) +
                '<div class="hint" style="margin-top:6px">' +
                (S.sel.kind === 'tee'
                    ? 'Where the ball starts. It must not sit in a wall, a post or a lake.'
                    : 'The cup pulls the ball in below ' + C.CAPTURE_SPEED + 'px/s; faster than that and the rim spits it back out.') +
                '</div>';
            return;
        }

        var s = selShape();
        if (!s) { box.innerHTML = ''; return; }
        var k = kindOf(S.sel.kind);
        var html = '<div class="subhead">' + k.label + ' ' + (S.sel.idx + 1) + '</div>';

        if (S.sel.kind === 'bumpers') {
            html += numRow('x', 'x', s.x) + numRow('y', 'y', s.y) +
                numRow('radius', 'r', s.r, 1, 'Below ' + C.BUMPER_MIN_R + 'px the substep cap cannot stop a ball tunnelling through');
        } else {
            html += numRow('x', 'x', s.x) + numRow('y', 'y', s.y) +
                numRow('width', 'w', s.w, 1, 'Nothing thinner than ' + MIN_SIDE + 'px') +
                numRow('height', 'h', s.h, 1, 'Nothing thinner than ' + MIN_SIDE + 'px');
        }

        if (S.sel.kind === 'slopes') {
            html += '<div class="subhead">Break</div>' +
                numRow('accel x', 'ax', s.ax, 10, 'Constant acceleration while the ball is inside, px/s²') +
                numRow('accel y', 'ay', s.ay, 10, 'Positive is downward — y grows toward the bottom of the field') +
                '<div class="hint" style="margin-top:6px">A slope must not reach a cushion or a wall it can pin the ball ' +
                'against: a ball inside a slope zone is never counted as at rest, so it would rattle there for ever.</div>';
        }

        if (S.sel.kind === 'walls') {
            html += '<div class="subhead">Movement</div>' +
                '<div class="row"><label class="lbl"><input type="checkbox" data-field="moves"' +
                (s.move ? ' checked' : '') + '> this wall moves</label></div>';
            if (s.move) {
                html += '<div class="row"><span class="lbl">axis</span><span class="field">' +
                    '<select data-field="axis"><option value="y"' + (s.move.axis === 'y' ? ' selected' : '') +
                    '>y — a gate that rises and falls</option><option value="x"' + (s.move.axis === 'x' ? ' selected' : '') +
                    '>x — a door that slides</option></select></span></div>' +
                    numRow('amplitude', 'amp', s.move.amp, 5, 'Half the total travel, in pixels') +
                    numRow('speed', 'speed', s.move.speed, 0.05, 'Radians per second') +
                    numRow('phase', 'phase', s.move.phase, 0.1, 'Where in the cycle it starts, in radians') +
                    '<div class="row"><button class="btn" id="btn-shut">Hang it shut at one end</button></div>' +
                    '<div class="hint" style="margin-top:6px">A sine spends most of its time near its extremes, so a door ' +
                    'parked mid-swing over its doorway is open almost always. Hang it so the shut position is one end of ' +
                    'the travel (phase −π/2) and it closes, dwells, then opens.</div>';
            }
        }

        html += '<div class="row" style="margin-top:8px">' +
            '<button class="btn" id="btn-dup" style="flex:1">Duplicate</button>' +
            '<button class="btn del" id="btn-drop" style="flex:1">Delete</button></div>';

        box.innerHTML = html;

        var shut = $('btn-shut');
        if (shut) shut.addEventListener('click', function () {
            snapshot();
            selShape().move.phase = -Math.PI / 2;
            refreshAll();
        });
        $('btn-dup').addEventListener('click', duplicateSelection);
        $('btn-drop').addEventListener('click', deleteSelection);
    }

    // Push new numbers into the fields without rebuilding them, so a drag
    // does not steal focus from an input the user is typing in.
    function updateInspectorValues() {
        var box = $('inspector');
        var inputs = box.querySelectorAll('input[type=number]');
        if (!inputs.length) return;
        var target = S.sel && (S.sel.kind === 'tee' || S.sel.kind === 'hole') ? S.hole[S.sel.kind] : selShape();
        if (!target) return;
        for (var i = 0; i < inputs.length; i++) {
            var f = inputs[i].dataset.field;
            var v = f === 'amp' || f === 'speed' || f === 'phase'
                ? (target.move ? target.move[f] : null)
                : target[f];
            if (v === null || v === undefined || document.activeElement === inputs[i]) continue;
            inputs[i].value = Math.round(v * 1000) / 1000;
        }
        renderShapeList();
    }

    $('inspector').addEventListener('change', function (e) {
        var f = e.target.dataset && e.target.dataset.field;
        if (!f) return;
        snapshot();
        applyField(f, e.target);
        refreshAll();
    });

    function applyField(f, el) {
        var target = (S.sel.kind === 'tee' || S.sel.kind === 'hole') ? S.hole[S.sel.kind] : selShape();
        if (!target) return;

        if (f === 'moves') {
            if (el.checked) target.move = { axis: 'y', amp: 100, speed: 1.3, phase: -Math.PI / 2 };
            else delete target.move;
            return;
        }
        if (f === 'axis') { target.move.axis = el.value; return; }
        if (f === 'amp' || f === 'speed' || f === 'phase') {
            target.move[f] = parseFloat(el.value) || 0;
            return;
        }

        var v = parseFloat(el.value);
        if (!isFinite(v)) return;
        if (f === 'w' || f === 'h') v = Math.max(MIN_SIDE, v);
        if (f === 'r') v = Math.max(C.BUMPER_MIN_R, v);
        if ((S.sel.kind === 'tee' || S.sel.kind === 'hole') && f === 'x') v = clampX(v);
        if ((S.sel.kind === 'tee' || S.sel.kind === 'hole') && f === 'y') v = clampY(v);
        target[f] = v;
    }

    function duplicateSelection() {
        var s = selShape();
        if (!s) return;
        snapshot();
        var copy = JSON.parse(JSON.stringify(s));
        copy.x += 30; copy.y += 30;
        list(S.sel.kind).push(copy);
        S.sel = { kind: S.sel.kind, idx: list(S.sel.kind).length - 1 };
        refreshAll();
    }

    function deleteSelection() {
        if (!S.sel || S.sel.kind === 'tee' || S.sel.kind === 'hole') return;
        snapshot();
        list(S.sel.kind).splice(S.sel.idx, 1);
        S.sel = null;
        refreshAll();
    }

    /* ── the checks ─────────────────────────────────────────────────────── */

    /* These are the rules from tests.html, ported one for one, plus the two
       the suite states as prose and measures rather than asserts per hole:
       that a ball left on a slope always comes to rest, and that a full-power
       shot settles inside MAX_SHOT_SECONDS. Finding a broken hole here is the
       same finding, an hour earlier. */
    function runChecks(h) {
        var out = [];
        function add(level, label, why) { out.push({ level: level, label: label, why: why || '' }); }
        function ok(cond, label, why) { add(cond ? 'pass' : 'fail', label, cond ? '' : why); }

        var rects = [];
        ['walls', 'water', 'sand', 'rough', 'ice', 'slopes'].forEach(function (k) {
            h[k].forEach(function (r) { rects.push({ k: k, r: r }); });
        });

        add(h.name && h.blurb ? 'pass' : 'warn', 'it has a name and a blurb',
            h.name && h.blurb ? '' : 'the scoreboard shows both');
        ok(h.par >= 2 && h.par <= 5, 'par is between 2 and 5', 'par is ' + h.par);

        var thin = rects.filter(function (o) { return Math.min(o.r.w, o.r.h) < MIN_SIDE; });
        ok(thin.length === 0, 'every rectangle is at least ' + MIN_SIDE + 'px thick',
            thin.length + ' too thin — the substep cap cannot stop a ball crossing them');

        var small = h.bumpers.filter(function (b) { return b.r < C.BUMPER_MIN_R; });
        ok(small.length === 0, 'every post is at least ' + C.BUMPER_MIN_R + 'px across the radius',
            small.length + ' too small for the substep cap to protect');

        var stray = rects.filter(function (o) {
            return o.r.x + o.r.w <= 0 || o.r.y + o.r.h <= 0 || o.r.x >= C.WORLD_W || o.r.y >= C.WORLD_H;
        });
        add(stray.length === 0 ? 'pass' : 'warn', 'every shape is on the field',
            stray.length ? stray.length + ' sit entirely outside the ' + C.WORLD_W + '×' + C.WORLD_H + ' field' : '');

        var margin = C.BALL_R + 1;
        ok(h.tee.x > margin && h.tee.x < C.WORLD_W - margin && h.tee.y > margin && h.tee.y < C.WORLD_H - margin,
            'the tee is inside the field');
        ok(h.hole.x > C.HOLE_R && h.hole.x < C.WORLD_W - C.HOLE_R &&
            h.hole.y > C.HOLE_R && h.hole.y < C.WORLD_H - C.HOLE_R, 'the cup is inside the field');

        var teeBlocked = h.walls.some(function (w) {
            return P.circleRect(h.tee.x, h.tee.y, C.BALL_R, P.wallRect(w, 0)) !== null;
        }) || h.bumpers.some(function (b) {
            return P.circleCircle(h.tee.x, h.tee.y, C.BALL_R, b) !== null;
        }) || P.zoneAt(h.water, h.tee.x, h.tee.y) !== null;
        ok(!teeBlocked, 'the ball does not start in a wall, a post or a lake');

        var cupBlocked = h.walls.some(function (w) {
            return P.circleRect(h.hole.x, h.hole.y, C.HOLE_R, P.wallRect(w, 0)) !== null;
        }) || h.bumpers.some(function (b) {
            return P.circleCircle(h.hole.x, h.hole.y, C.HOLE_R, b) !== null;
        }) || P.zoneAt(h.water, h.hole.x, h.hole.y) !== null;
        ok(!cupBlocked, 'the cup is clear of walls, posts and water',
            'a flag half-buried is unputtable from one side');

        var pinched = [];
        h.bumpers.forEach(function (a, ai) {
            h.bumpers.forEach(function (b, bi) {
                if (bi <= ai) return;
                var gap = Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r;
                if (gap > 0 && gap < C.BALL_R * 2 + 6) pinched.push(gap);
            });
        });
        ok(pinched.length === 0, 'no two posts leave a slot the ball cannot use',
            pinched.length + ' gap(s), tightest ' + (pinched.length ? pinched.reduce(function (m, g) { return Math.min(m, g); }, Infinity).toFixed(1) : '—') + 'px');

        ok(Math.hypot(h.hole.x - h.tee.x, h.hole.y - h.tee.y) > 100,
            'tee and cup are not on top of each other');

        var moving = h.walls.filter(function (w) { return w.move; });
        var strays = moving.filter(function (w) {
            for (var t = 0; t < 2 * Math.PI / w.move.speed; t += 0.05) {
                var Rr = P.wallRect(w, t);
                if (Rr.x < -1 || Rr.y < -1 || Rr.x + Rr.w > C.WORLD_W + 1 || Rr.y + Rr.h > C.WORLD_H + 1) return true;
            }
            return false;
        });
        ok(strays.length === 0, 'moving walls stay on the field',
            strays.length + ' leave it at some phase of the swing');

        var sealed = moving.filter(function (w) {
            var vertical = w.move.axis === 'y';
            for (var t = 0; t < 2 * Math.PI / w.move.speed; t += 0.05) {
                var Rr = P.wallRect(w, t);
                var gap = vertical ? Math.max(Rr.y, C.WORLD_H - (Rr.y + Rr.h))
                                   : Math.max(Rr.x, C.WORLD_W - (Rr.x + Rr.w));
                if (gap < C.BALL_R * 3) return true;
            }
            return false;
        });
        ok(sealed.length === 0, 'moving gates always leave a way past',
            sealed.length + ' seal the field shut at some phase');

        /* A ball at rest on a slope is not at rest — the stop check skips
           slope zones, so a ball pinned at the foot of one against a wall or
           a cushion rattles there for ever and the hole never hands itself
           back. Rather than guess at the geometry, drop a ball on the slope
           and see whether it ever stops. */
        var hung = null;
        h.slopes.forEach(function (sl) {
            if (hung) return;
            for (var gx = 1; gx <= 3 && !hung; gx++) {
                for (var gy = 1; gy <= 3 && !hung; gy++) {
                    var x = sl.x + sl.w * gx / 4, y = sl.y + sl.h * gy / 4;
                    var w = P.createWorld(h, { x: x, y: y }, 0);
                    w.moving = true;
                    P.settle(w, C.MAX_SHOT_SECONDS);
                    if (w.moving) hung = { x: Math.round(x), y: Math.round(y) };
                }
            }
        });
        if (h.slopes.length) {
            ok(!hung, 'a ball left on a slope always comes to rest',
                hung ? 'one dropped at ' + hung.x + ',' + hung.y + ' never settled — the slope reaches something it can pin the ball against' : '');
        }

        /* Friction is the only thing that ends a shot and the game loop has no
           timeout, so a rink full of bumpers is where a hole quietly stops
           being playable. Fire a fan of full-power shots and time the worst. */
        var slowest = 0, unsettled = 0;
        for (var a = 0; a < 24; a++) {
            var w2 = P.simulateShot(h, h.tee, a / 24 * Math.PI * 2, C.MAX_POWER, 0);
            if (w2.moving) unsettled++;
            slowest = Math.max(slowest, w2.time);
        }
        ok(unsettled === 0, 'every full-power shot settles inside ' + C.MAX_SHOT_SECONDS + 's',
            unsettled + ' of 24 were still rolling at the limit');
        add('pass', 'slowest of 24 full-power shots: ' + slowest.toFixed(1) + 's', '');

        return out;
    }

    /* The suite's bot, unchanged in substance: a greedy player tries a fan of
       candidate shots, keeps the one that finishes nearest the cup, and plays
       it for real. If the hole is sealed off, unreachable, or has a cup buried
       where nothing can settle, it never holes out.

       The two details that keep it from being a coin toss are here too — a
       random wait before striking, because the gate holes are only solvable
       with timing, and an escape from local minima, because a mini golf hole
       is made of them. */
    function mulberry32(seed) {
        return function () {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function playHoleBot(hole, rand, opts) {
        var pos = { x: hole.tee.x, y: hole.tee.y };
        var time = 0, shots = 0;
        var prevD = Math.hypot(pos.x - hole.hole.x, pos.y - hole.hole.y);

        while (shots < opts.maxShots) {
            var best = null, first = null;
            for (var k = 0; k < opts.tries; k++) {
                var toHole = Math.atan2(hole.hole.y - pos.y, hole.hole.x - pos.x);
                var angle = rand() < 0.65 ? toHole + (rand() - 0.5) * 0.9 : rand() * Math.PI * 2;
                var power = C.MIN_POWER + rand() * (C.MAX_POWER - C.MIN_POWER);
                var wait = rand() * 3;

                var w = P.simulateShot(hole, pos, angle, power, time + wait);
                if (w.sunk) { best = { w: w, d: -1 }; break; }
                if (w.splash) continue;
                var d = Math.hypot(w.ball.x - hole.hole.x, w.ball.y - hole.hole.y);
                if (!best || d < best.d) best = { w: w, d: d };
                if (!first) first = { w: w, d: d };
            }
            if (!best) { time += 1; shots++; continue; }

            var pick = (first && best.d >= prevD - 5) ? first : best;
            shots++;
            pos = { x: pick.w.ball.x, y: pick.w.ball.y };
            time = pick.w.time;
            prevD = pick.d < 0 ? 0 : pick.d;
            if (pick.w.sunk) return shots;
        }
        return null;
    }

    function botBest(hole, attempts) {
        var best = null;
        for (var a = 0; a < (attempts || 3); a++) {
            var shots = playHoleBot(hole, mulberry32(20260815 + a * 104729), { maxShots: 10, tries: 60 });
            if (shots !== null && (best === null || shots < best)) best = shots;
        }
        return best;
    }

    var lastReport = null, lastBot = undefined;

    function renderReport() {
        var box = $('report'), sum = $('report-summary');
        if (!lastReport) {
            box.innerHTML = '';
            sum.className = 'busy';
            sum.textContent = 'Not run yet.';
            return;
        }
        var fails = lastReport.filter(function (c) { return c.level === 'fail'; }).length;
        var warns = lastReport.filter(function (c) { return c.level === 'warn'; }).length;
        sum.className = fails ? 'bad' : 'ok';
        sum.textContent = fails
            ? fails + ' problem' + (fails === 1 ? '' : 's') + (warns ? ', ' + warns + ' to look at' : '')
            : 'All clear' + (warns ? ', ' + warns + ' to look at' : '') + '.';

        var html = lastReport.map(function (c) {
            return '<div class="check ' + c.level + '"><span class="mark">' +
                (c.level === 'pass' ? '✓' : c.level === 'warn' ? '!' : '✕') + '</span><span>' +
                esc(c.label) + (c.why ? ' <span class="why">— ' + esc(c.why) + '</span>' : '') + '</span></div>';
        }).join('');

        if (lastBot !== undefined) {
            html += lastBot === null
                ? '<div class="check fail"><span class="mark">✕</span><span>the bot could not hole out in ten shots, three times over ' +
                  '<span class="why">— the hole may be sealed off, or the cup buried where nothing settles</span></span></div>'
                : '<div class="check pass"><span class="mark">✓</span><span>the bot holed out in ' + lastBot +
                  ' <span class="why">— which makes a par of ' + Math.max(2, Math.min(5, lastBot)) + ' about right</span></span></div>';
        }
        box.innerHTML = html;
    }

    function runChecksUI() {
        $('report-summary').className = 'busy';
        $('report-summary').textContent = 'Checking…';
        $('report').innerHTML = '';
        setTimeout(function () {
            lastReport = runChecks(S.hole);
            renderReport();
        }, 20);
    }

    function runBotUI() {
        $('report-summary').className = 'busy';
        $('report-summary').textContent = 'The bot is playing the hole…';
        setTimeout(function () {
            if (!lastReport) lastReport = runChecks(S.hole);
            lastBot = botBest(S.hole, 3);
            renderReport();
        }, 20);
    }

    /* ── export ─────────────────────────────────────────────────────────── */

    /* Emitted the way courses.js is written by hand: the r() and post()
       helpers for the plain shapes, a spelled-out literal for anything with
       extra fields, and a list left out entirely when the hole does not use
       it. The output is meant to be pasted straight into the COURSE array. */
    function n(v) {
        var r = Math.round(v * 1000) / 1000;
        return String(r);
    }

    function shapeSource(kind, s) {
        if (kind === 'bumpers') return 'post(' + n(s.x) + ', ' + n(s.y) + ', ' + n(s.r) + ')';
        if (kind === 'slopes') {
            return '{ x: ' + n(s.x) + ', y: ' + n(s.y) + ', w: ' + n(s.w) + ', h: ' + n(s.h) +
                ', ax: ' + n(s.ax) + ', ay: ' + n(s.ay) + ' }';
        }
        if (kind === 'walls' && s.move) {
            return '{ x: ' + n(s.x) + ', y: ' + n(s.y) + ', w: ' + n(s.w) + ', h: ' + n(s.h) +
                ', move: { axis: ' + q(s.move.axis) + ', amp: ' + n(s.move.amp) +
                ', speed: ' + n(s.move.speed) + ', phase: ' + phaseSource(s.move.phase) + ' } }';
        }
        return 'r(' + n(s.x) + ', ' + n(s.y) + ', ' + n(s.w) + ', ' + n(s.h) + ')';
    }

    // -1.5707963 in a source file is noise; -Math.PI / 2 is the intent.
    function phaseSource(p) {
        var named = [
            [Math.PI / 2, 'Math.PI / 2'], [-Math.PI / 2, '-Math.PI / 2'],
            [Math.PI, 'Math.PI'], [-Math.PI, '-Math.PI'],
            [Math.PI / 4, 'Math.PI / 4'], [-Math.PI / 4, '-Math.PI / 4']
        ];
        for (var i = 0; i < named.length; i++) {
            if (Math.abs(p - named[i][0]) < 1e-6) return named[i][1];
        }
        return n(p);
    }

    function q(s) { return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"; }

    function buildOut(h) {
        h = h || S.hole;
        var lines = [];
        lines.push('{');
        lines.push('    name: ' + q(h.name) + ',');
        lines.push('    blurb: ' + q(h.blurb) + ',');
        lines.push('    par: ' + h.par + ',');
        lines.push('    tee: { x: ' + n(h.tee.x) + ', y: ' + n(h.tee.y) + ' },');
        lines.push('    hole: { x: ' + n(h.hole.x) + ', y: ' + n(h.hole.y) + ' }');

        EXPORT_ORDER.forEach(function (k) {
            var l = h[k];
            if (!l.length) return;
            var parts = l.map(function (s) { return shapeSource(k, s); });
            var oneLine = '    ' + k + ': [' + parts.join(', ') + ']';
            lines[lines.length - 1] += ',';
            if (oneLine.length <= 96) {
                lines.push(oneLine);
            } else {
                lines.push('    ' + k + ': [');
                parts.forEach(function (p, i) {
                    lines.push('        ' + p + (i === parts.length - 1 ? '' : ','));
                });
                lines.push('    ]');
            }
        });

        lines.push('}');
        return lines.join('\n');
    }

    function updateOut() { $('out').value = buildOut(); }

    /* ── import ─────────────────────────────────────────────────────────── */

    /* Accepts what courses.js contains: a hole literal, with or without the
       r() and post() helpers, with or without a trailing comma, and with or
       without the surrounding braces. Evaluated through new Function with
       only the helpers and Math in scope — this is a local tool reading text
       its own user pasted, not a sandbox. */
    function parseHole(src) {
        var text = String(src).trim().replace(/;+\s*$/, '').replace(/,\s*$/, '');
        if (!text) throw new Error('nothing to parse');
        if (text.charAt(0) !== '{') text = '{' + text + '}';
        var r = function (x, y, w, h) { return { x: x, y: y, w: w, h: h }; };
        var post = function (x, y, rad) { return { x: x, y: y, r: rad }; };
        var fn = new Function('r', 'post', 'return (' + text + ');');
        var obj = fn(r, post);
        if (!obj || typeof obj !== 'object') throw new Error('that is not a hole');
        return normalize(obj);
    }

    function loadHole(h, label) {
        S.hole = normalize(h);
        S.sel = null;
        S.loadedFrom = label || '';
        undoStack.length = 0;
        redoStack.length = 0;
        syncHistoryButtons();
        lastReport = null; lastBot = undefined;
        renderReport();
        editWorld = null;
        if (mode === 'play') enterPlay();
        syncCardFields();
        refreshAll();
    }

    function syncCardFields() {
        $('f-name').value = S.hole.name;
        $('f-blurb').value = S.hole.blurb;
        $('f-par').value = S.hole.par;
    }

    /* ── persistence ────────────────────────────────────────────────────── */

    /* One key, and every write wrapped: a browser with storage disabled
       should cost you the autosave, not the session. */
    var saveTimer = null;
    function scheduleSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
            try {
                localStorage.setItem(SAVE_KEY, JSON.stringify({ hole: S.hole, loadedFrom: S.loadedFrom }));
            } catch (e) { /* private mode, quota — not worth a crash */ }
        }, 400);
    }

    function restoreSaved() {
        try {
            var raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;
            var d = JSON.parse(raw);
            return d && d.hole ? d : null;
        } catch (e) { return null; }
    }

    /* ── chrome ─────────────────────────────────────────────────────────── */

    function toast(msg, kind) {
        var el = $('toast');
        el.textContent = msg;
        el.className = 'show' + (kind ? ' ' + kind : '');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { el.className = ''; }, 2200);
    }

    function syncStatus() {
        $('st-x').textContent = Math.round(mouse.wx);
        $('st-y').textContent = Math.round(mouse.wy);
        $('st-snap').textContent = S.snap;
        $('st-zoom').textContent = Math.round(view.scale * 100) + '%';
        var sel = 'nothing selected';
        if (S.sel) {
            if (S.sel.kind === 'tee') sel = 'tee';
            else if (S.sel.kind === 'hole') sel = 'cup';
            else {
                var k = kindOf(S.sel.kind);
                var s = selShape();
                sel = k ? k.label + ' ' + (S.sel.idx + 1) + (s ? ' · ' + shapeSummary(S.sel.kind, s) : '') : '—';
            }
        }
        $('st-sel').textContent = sel;
    }

    function syncHud() {
        var el = $('hud');
        if (mode === 'play') {
            el.className = 'play';
            el.innerHTML = '<div class="big">' + play.strokes + ' stroke' + (play.strokes === 1 ? '' : 's') + '</div>' +
                '<div>par ' + S.hole.par + (play.done ? ' · holed out' : '') + '</div>' +
                '<div style="color:#8b949e">R puts it back on the tee</div>';
        } else {
            el.className = '';
            var counts = KINDS.map(function (k) { return list(k.key).length; }).reduce(function (a, b) { return a + b; }, 0);
            el.innerHTML = '<div class="big">' + esc(S.hole.name) + '</div>' +
                '<div>par ' + S.hole.par + ' · ' + counts + ' shape' + (counts === 1 ? '' : 's') +
                (animate ? '' : ' · clock paused') + '</div>';
        }
    }

    function setTool(t) {
        S.tool = t;
        var btns = document.querySelectorAll('#tools .btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].className = 'btn' + (btns[i].dataset.tool === t ? ' on' : '');
        }
        canvas.style.cursor = t === 'select' ? 'default' : 'crosshair';
    }

    function setSnap(v) {
        S.snap = v;
        var btns = document.querySelectorAll('[data-snap]');
        for (var i = 0; i < btns.length; i++) {
            btns[i].className = 'btn' + (+btns[i].dataset.snap === v ? ' on' : '');
        }
        syncStatus();
    }

    function syncModeUI() {
        $('mode-edit').className = 'btn' + (mode === 'edit' ? ' on' : '');
        $('mode-play').className = 'btn' + (mode === 'play' ? ' on' : '');
        $('anim-wrap').style.display = mode === 'edit' ? '' : 'none';
        canvas.style.cursor = mode === 'play' ? 'crosshair' : (S.tool === 'select' ? 'default' : 'crosshair');
    }

    /* ── wiring ─────────────────────────────────────────────────────────── */

    document.querySelectorAll('#tools .btn').forEach(function (b) {
        b.addEventListener('click', function () {
            if (mode === 'play') exitPlay();
            setTool(b.dataset.tool);
        });
    });
    document.querySelectorAll('[data-snap]').forEach(function (b) {
        b.addEventListener('click', function () { setSnap(+b.dataset.snap); });
    });

    $('mode-edit').addEventListener('click', function () { if (mode !== 'edit') exitPlay(); });
    $('mode-play').addEventListener('click', function () { if (mode !== 'play') enterPlay(); });
    $('btn-anim').addEventListener('click', function () {
        animate = !animate;
        $('btn-anim').className = 'btn' + (animate ? '' : ' on');
        $('btn-anim').textContent = animate ? '⏸ Clock' : '▶ Clock';
    });
    $('btn-grid').addEventListener('click', function () {
        S.grid = !S.grid;
        $('btn-grid').className = 'btn' + (S.grid ? ' on' : '');
    });

    $('btn-undo').addEventListener('click', undo);
    $('btn-redo').addEventListener('click', redo);
    $('btn-zoom-in').addEventListener('click', function () { zoomAt(1.2, canvas.clientWidth / 2, canvas.clientHeight / 2); });
    $('btn-zoom-out').addEventListener('click', function () { zoomAt(1 / 1.2, canvas.clientWidth / 2, canvas.clientHeight / 2); });
    $('btn-fit').addEventListener('click', fitView);

    $('btn-check').addEventListener('click', runChecksUI);
    $('btn-bot').addEventListener('click', runBotUI);

    ['f-name', 'f-blurb', 'f-par'].forEach(function (id) {
        $(id).addEventListener('change', function () {
            snapshot();
            if (id === 'f-par') S.hole.par = Math.max(1, Math.round(+$(id).value || 3));
            else S.hole[id === 'f-name' ? 'name' : 'blurb'] = $(id).value;
            syncCardFields();
            refreshAll();
        });
    });

    $('btn-load').addEventListener('click', function () {
        var v = $('load-select').value;
        if (v === '') return;
        var src = GOLF.COURSE[+v];
        loadHole(src, 'hole ' + (+v + 1));
        fitView();
        toast('Loaded “' + src.name + '”');
    });

    $('btn-blank').addEventListener('click', function () {
        loadHole(blankHole(), '');
        fitView();
        toast('Blank field');
    });

    $('btn-paste').addEventListener('click', function () {
        try {
            loadHole(parseHole($('paste-in').value), 'pasted');
            fitView();
            toast('Parsed', 'good');
        } catch (err) {
            toast('Could not parse that: ' + err.message, 'bad');
        }
    });

    $('btn-copy').addEventListener('click', function () {
        var out = $('out');
        navigator.clipboard.writeText(out.value).then(function () {
            toast('Copied — paste it into GOLF.COURSE in js/courses.js', 'good');
        }, function () {
            out.select();
            toast('Select-and-copy: the clipboard said no', 'bad');
        });
    });

    $('btn-download').addEventListener('click', function () {
        var name = (S.hole.name || 'hole').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        var blob = new Blob([buildOut() + '\n'], { type: 'text/javascript' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = (name || 'hole') + '.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    $('btn-copy-ai').addEventListener('click', function () {
        var prompt = 'I am building a hole for Pocket Links, an eighteen-hole 2D mini golf game. ' +
            'A hole is pure data: axis-aligned rectangles, round posts and two points, on a fixed ' +
            C.WORLD_W + '×' + C.WORLD_H + ' field where y grows downward.\n\n' +
            '```javascript\n' + buildOut() + '\n```\n\n' +
            'The vocabulary, in full:\n' +
            '- `walls` — solid, bounce. `move: { axis, amp, speed, phase }` makes one oscillate: on `y` a gate that rises and falls, on `x` a door that slides.\n' +
            '- `water` — splash, one penalty stroke, replay the shot.\n' +
            '- `sand` — heavy friction. `rough` — half the roll of grass.\n' +
            '- `ice` — about three times the roll of grass.\n' +
            '- `bumpers` — round posts `{x, y, r}`, bouncier than a wall.\n' +
            '- `slopes` — `{x, y, w, h, ax, ay}`, a constant acceleration, i.e. a breaking green.\n\n' +
            'Rules the test suite enforces, all of which the hole must keep:\n' +
            '- No rectangle thinner than ' + MIN_SIDE + 'px and no post under a radius of ' + C.BUMPER_MIN_R + 'px — ' +
            'below that the substepping cannot stop the ball tunnelling through.\n' +
            '- A moving gate must leave a gap of at least ' + (C.BALL_R * 3) + 'px along its axis at every phase, and must stay on the field over its whole travel.\n' +
            '- A slope must not reach a cushion or a wall it can press the ball against: a ball inside a slope zone is never counted as at rest, so it would rattle there for ever.\n' +
            '- The tee must not sit in a wall, a post or a lake, and the cup must be clear of all three.\n' +
            '- Every full-power shot has to settle inside ' + C.MAX_SHOT_SECONDS + ' seconds; friction is the only thing that ends a shot.\n\n' +
            'Please make the changes I ask for below and reply with only the complete hole literal in one javascript code block, so I can paste it back into the editor. ' +
            'Keep anything I did not ask about unchanged.\n\n' +
            'My requested changes are: [TYPE YOUR CHANGES HERE]';
        navigator.clipboard.writeText(prompt).then(function () {
            toast('Copied the hole with a prompt around it', 'good');
        }, function () { toast('The clipboard said no', 'bad'); });
    });

    $('btn-playtest').addEventListener('click', function () {
        try {
            sessionStorage.setItem(PLAYTEST_KEY, JSON.stringify(S.hole));
            window.location.href = 'index.html?playtest=1';
        } catch (e) {
            toast('Could not hand the hole over — session storage is blocked', 'bad');
        }
    });

    /* ── keyboard ───────────────────────────────────────────────────────── */

    var TOOL_KEYS = {
        '1': 'walls', '2': 'water', '3': 'sand', '4': 'rough',
        '5': 'ice', '6': 'bumpers', '7': 'slopes', '8': 'tee', '9': 'hole'
    };

    window.addEventListener('keydown', function (e) {
        if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
        var k = e.key;

        if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'Z')) {
            e.preventDefault();
            if (e.shiftKey) redo(); else undo();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && (k === 'y' || k === 'Y')) { e.preventDefault(); redo(); return; }
        if ((e.ctrlKey || e.metaKey) && (k === 'd' || k === 'D')) { e.preventDefault(); duplicateSelection(); return; }
        if (e.ctrlKey || e.metaKey) return;

        if (k === ' ') { spaceHeld = true; e.preventDefault(); return; }
        if (k === 'f' || k === 'F') { fitView(); return; }
        if (k === 'g' || k === 'G') { $('btn-grid').click(); return; }
        if (k === 'p' || k === 'P') { if (mode !== 'play') enterPlay(); return; }
        if (k === 'e' || k === 'E') { if (mode !== 'edit') exitPlay(); return; }
        if (k === 'r' || k === 'R') { resetBall(); return; }

        if (mode === 'play') return;

        if (k === 'v' || k === 'V') { setTool('select'); return; }
        if (TOOL_KEYS[k]) { setTool(TOOL_KEYS[k]); return; }
        if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); deleteSelection(); return; }

        if (k.indexOf('Arrow') === 0 && S.sel) {
            e.preventDefault();
            var step = e.shiftKey ? S.snap * 5 : S.snap;
            var dx = k === 'ArrowLeft' ? -step : k === 'ArrowRight' ? step : 0;
            var dy = k === 'ArrowUp' ? -step : k === 'ArrowDown' ? step : 0;
            snapshot();
            if (S.sel.kind === 'tee' || S.sel.kind === 'hole') {
                S.hole[S.sel.kind].x = clampX(S.hole[S.sel.kind].x + dx);
                S.hole[S.sel.kind].y = clampY(S.hole[S.sel.kind].y + dy);
            } else {
                var s = selShape();
                if (s) { s.x += dx; s.y += dy; }
            }
            refreshAll();
        }
    });

    window.addEventListener('keyup', function (e) { if (e.key === ' ') spaceHeld = false; });

    /* ── sidebar resize ─────────────────────────────────────────────────── */

    (function () {
        var handle = $('sidebar-resize-handle'), bar = $('sidebar'), active = false;
        handle.addEventListener('pointerdown', function (e) {
            active = true;
            handle.classList.add('active');
            handle.setPointerCapture(e.pointerId);
            e.preventDefault();
        });
        window.addEventListener('pointermove', function (e) {
            if (!active) return;
            bar.style.width = Math.max(260, Math.min(720, e.clientX)) + 'px';
            resize();
        });
        window.addEventListener('pointerup', function () {
            if (!active) return;
            active = false;
            handle.classList.remove('active');
        });
    })();

    /* ── loop ───────────────────────────────────────────────────────────── */

    var lastT = 0;

    function loop(now) {
        requestAnimationFrame(loop);
        var dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 0.016;
        lastT = now;

        if (mode === 'play') stepPlay(dt, now);
        else if (animate) clock += dt;

        draw(dt);
        syncHud();
    }

    /* ── boot ───────────────────────────────────────────────────────────── */

    function boot() {
        GOLF.COURSE.forEach(function (h, i) {
            var opt = document.createElement('option');
            opt.value = i;
            opt.textContent = (i + 1) + '. ' + h.name + ' (par ' + h.par + ')';
            $('load-select').appendChild(opt);
        });

        var saved = restoreSaved();
        S.hole = normalize(saved ? saved.hole : GOLF.COURSE[0]);
        S.loadedFrom = saved ? saved.loadedFrom : 'hole 1';

        setTool('select');
        setSnap(10);
        syncModeUI();
        syncHistoryButtons();
        syncCardFields();
        refreshAll();
        renderReport();

        resize();
        fitView();
        window.addEventListener('resize', function () { resize(); });
        requestAnimationFrame(loop);

        if (saved) toast('Picked up where you left off');
        if (/[?&]runTests=1/.test(window.location.search)) selfTest();
    }

    /* ── self-tests (?runTests=1) ───────────────────────────────────────── */

    /* The editor's own logic, not the game's — tests.html covers the game.
       What can break in here and not be noticed by eye is the round trip:
       a hole exported and re-parsed has to be the same hole, or the export
       button quietly loses a hazard. */
    function selfTest() {
        var out = [], pass = 0, fail = 0;
        function check(name, cond, why) {
            if (cond) { pass++; out.push('<div class="t-pass">✓ ' + name + '</div>'); }
            else { fail++; out.push('<div class="t-fail">✕ ' + name + (why ? ' — ' + why : '') + '</div>'); }
        }

        GOLF.COURSE.forEach(function (h, i) {
            var round = parseHole(buildOut(normalize(h)));
            var a = JSON.stringify(normalize(h)), b = JSON.stringify(round);
            check('hole ' + (i + 1) + ' (' + h.name + ') survives an export/parse round trip', a === b,
                'differs after the round trip');
        });

        var shipped = GOLF.COURSE.map(function (h) { return runChecks(normalize(h)); });
        var broken = shipped.filter(function (rep) {
            return rep.some(function (c) { return c.level === 'fail'; });
        });
        check('every shipped hole passes the editor checks', broken.length === 0,
            broken.length + ' of ' + shipped.length + ' reported a failure');

        // And the checks have to actually catch something, or they are decoration.
        var bad = normalize(GOLF.COURSE[0]);
        bad.walls.push({ x: 300, y: 300, w: 6, h: 100 });
        check('a too-thin wall is caught', runChecks(bad).some(function (c) {
            return c.level === 'fail' && /thick/.test(c.label);
        }));

        var bad2 = normalize(GOLF.COURSE[0]);
        bad2.tee = { x: bad2.hole.x, y: bad2.hole.y };
        check('a tee on top of the cup is caught', runChecks(bad2).some(function (c) {
            return c.level === 'fail' && /on top of each other/.test(c.label);
        }));

        var bad3 = normalize(GOLF.COURSE[0]);
        bad3.walls.push({ x: 400, y: 0, w: 26, h: C.WORLD_H, move: { axis: 'y', amp: 10, speed: 1, phase: 0 } });
        check('a gate that seals the field is caught', runChecks(bad3).some(function (c) {
            return c.level === 'fail' && /way past/.test(c.label);
        }));

        // Undo has to restore the shape that was there, not merely a shape.
        var before = JSON.stringify(S.hole);
        snapshot();
        S.hole.walls.push({ x: 100, y: 100, w: 40, h: 40 });
        undo();
        check('undo restores the hole exactly', JSON.stringify(S.hole) === before);
        redo();
        check('redo puts the change back', S.hole.walls.length === JSON.parse(before).walls.length + 1);
        undo();

        check('the bot can hole out on the first shipped hole', botBest(normalize(GOLF.COURSE[0]), 3) !== null);

        var el = $('selftest');
        el.style.display = 'block';
        el.innerHTML = '<h2 id="selftest-summary">' + pass + ' passed / ' + fail + ' failed</h2>' + out.join('');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();

    // Exposed for the self-tests and for poking at the editor from a console.
    GOLF.editor = {
        state: S,
        buildOut: buildOut,
        parseHole: parseHole,
        runChecks: runChecks,
        botBest: botBest,
        loadHole: loadHole
    };

})(window.GOLF);
