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
        // A round hill: a centre and a reach, like a post, but ground.
        { key: 'hills',   label: 'Hill',   round: true, hill: true, color: '#7fae6a' },
        { key: 'slopes',  label: 'Slope',  round: false, color: '#8fbf9f' },
        { key: 'ice',     label: 'Ice',    round: false, color: '#bfe4f2' },
        // A lane down the mountain with a slide on a clock: a rectangle, plus
        // which way is downhill and when the slides come.
        { key: 'avalanches', label: 'Chute', round: false, color: '#dbe7f2' },
        // Ground that moves: a rectangle with a direction and a pace.
        { key: 'belts',   label: 'Belt',   round: false, color: '#4b525c' },
        // Ground that turns: a centre and a radius, grabbed like a hill.
        { key: 'turntables', label: 'Turntable', round: true, turn: true, color: '#1d1d22' },
        { key: 'sand',    label: 'Sand',   round: false, color: '#e3ca92' },
        { key: 'water',   label: 'Water',  round: false, color: '#1b6d9e' },
        { key: 'lava',    label: 'Lava',   round: false, color: '#f05a1a' },
        // A geyser is a point: its size is VENT_R, the same on every hole.
        { key: 'vents',   label: 'Geyser', round: false, point: true, color: '#c9c2b8' },
        // Two mouths rather than one shape: each end is grabbed on its own.
        { key: 'tunnels', label: 'Tunnel', round: false, pair: true, color: '#a78bfa' },
        // A wall at an angle: two ends like a tunnel, and a body to grab.
        { key: 'rails',   label: 'Rail',   round: false, pair: true, body: true, color: '#8a5a34' },
        // A curved wall: a centre, a radius and the angles it runs between.
        { key: 'arcs',    label: 'Curve',  round: false, arc: true, color: '#9c4f36' },
        // A solid shape: always a polygon, and what stands in it.
        { key: 'blocks',  label: 'Block',  round: false, block: true, color: '#3d6b2c' },
        { key: 'walls',   label: 'Wall',   round: false, color: '#6d4a2e' },
        { key: 'bumpers', label: 'Post',   round: true,  color: '#f59e0b' },
        // A turnstile: a pivot and the reach of its arms, grabbed like a post.
        { key: 'spinners', label: 'Spinner', round: true, spin: true, color: '#fbbf24' }
    ];
    var KIND_KEYS = KINDS.map(function (k) { return k.key; });
    // The order courses.js lists them in, which is not the order they are
    // painted in. The export follows the file; the sidebar follows the paint.
    var EXPORT_ORDER = ['walls', 'rails', 'arcs', 'blocks', 'water', 'lava', 'sand', 'rough', 'ice', 'bumpers', 'slopes', 'hills',
                        'tunnels', 'avalanches', 'vents', 'spinners', 'belts', 'turntables'];
    // What a block may have standing in it. See props.js.
    var LOOKS = ['bed', 'tree', 'hedge', 'rock', 'castle', 'windmill', 'fan', 'tent', 'carousel', 'wheel', 'mirror', 'hut', 'pyramid', 'palm', 'snowman', 'lighthouse', 'book', 'pencil', 'tonearm', 'mug', 'inkpot', 'planet'];
    // The zones that may be drawn as polygons. Walls at an angle are rails,
    // and a slope's rules are written for edges that run with the axes.
    var POLY_KINDS = { water: 1, lava: 1, sand: 1, rough: 1, ice: 1 };
    function kindOf(key) {
        for (var i = 0; i < KINDS.length; i++) if (KINDS[i].key === key) return KINDS[i];
        return null;
    }

    var MIN_SIDE = 20;          // the thinnest rectangle the substep cap can protect
    var DEFAULT_RECT = {
        walls: [26, 160], water: [200, 140], sand: [180, 160],
        rough: [240, 170], ice: [220, 180], slopes: [260, 220],
        lava: [200, 140], avalanches: [120, 420], blocks: [120, 100], belts: [260, 70]
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
            walls: [], water: [], sand: [], rough: [], ice: [], bumpers: [], slopes: [], tunnels: [], rails: [],
            lava: [], avalanches: [], vents: [], arcs: [], blocks: [], hills: [], spinners: [], belts: [], turntables: []
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
        // A biome of the hole's own, if it names one the game knows.
        if (typeof h.theme === 'string' && GOLF.scenery && GOLF.scenery.THEMES[h.theme]) out.theme = h.theme;
        KIND_KEYS.forEach(function (k) {
            out[k] = (Array.isArray(h[k]) ? h[k] : []).map(function (s) { return cloneShape(k, s); });
        });
        return out;
    }

    function num(v, dflt) { return typeof v === 'number' && isFinite(v) ? v : dflt; }

    function cloneShape(kind, s) {
        if (kind === 'bumpers') return { x: num(s.x, 0), y: num(s.y, 0), r: num(s.r, C.BUMPER_MIN_R) };
        if (kind === 'tunnels') return { x: num(s.x, 0), y: num(s.y, 0), tx: num(s.tx, 0), ty: num(s.ty, 0) };
        if (kind === 'rails') return { x: num(s.x, 0), y: num(s.y, 0), tx: num(s.tx, 0), ty: num(s.ty, 0), w: num(s.w, 24) };
        if (kind === 'vents') return { x: num(s.x, 0), y: num(s.y, 0), every: num(s.every, 3), at: num(s.at, 0), run: num(s.run, 1) };
        if (kind === 'hills') return { x: num(s.x, 0), y: num(s.y, 0), r: num(s.r, 90), a: num(s.a, 120) };
        if (kind === 'turntables') return { x: num(s.x, 0), y: num(s.y, 0), r: num(s.r, 110), speed: num(s.speed, 1.5) };
        if (kind === 'spinners') {
            return { x: num(s.x, 0), y: num(s.y, 0), r: num(s.r, 100), arms: Math.max(1, Math.min(4, Math.round(num(s.arms, 2)))),
                     speed: num(s.speed, 1), phase: num(s.phase, 0), w: num(s.w, 20) };
        }
        if (kind === 'arcs') {
            return { x: num(s.x, 0), y: num(s.y, 0), r: num(s.r, 120), from: num(s.from, 180), to: num(s.to, 360), w: num(s.w, 24) };
        }
        if (kind === 'blocks') {
            return { look: LOOKS.indexOf(s.look) >= 0 ? s.look : 'bed',
                     pts: (Array.isArray(s.pts) ? s.pts : []).map(function (v) { return num(v, 0); }), w: num(s.w, 20) };
        }
        if (POLY_KINDS[kind] && Array.isArray(s.pts)) return { pts: s.pts.map(function (v) { return num(v, 0); }) };
        var o = { x: num(s.x, 0), y: num(s.y, 0), w: num(s.w, MIN_SIDE), h: num(s.h, MIN_SIDE) };
        if (kind === 'slopes') {
            o.ax = num(s.ax, 0); o.ay = num(s.ay, 120);
            if (s.wind) o.wind = true;
        }
        if (kind === 'belts') {
            o.dir = ['down', 'up', 'left', 'right'].indexOf(s.dir) >= 0 ? s.dir : 'right';
            o.speed = num(s.speed, 140);
        }
        if (kind === 'avalanches') {
            o.dir = ['down', 'up', 'left', 'right'].indexOf(s.dir) >= 0 ? s.dir : 'down';
            o.every = num(s.every, 4);
            o.at = num(s.at, 0);
            if (typeof s.len === 'number') o.len = s.len;
        }
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
        return { world: editWorld, aim: { active: false, angle: 0, power: 0 }, trail: [], theme: S.hole.theme || 'parkland' };
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

        if (S.sel.kind === 'bumpers' || S.sel.kind === 'hills' || S.sel.kind === 'spinners' || S.sel.kind === 'turntables') {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r + 3, 0, Math.PI * 2);
            ctx.stroke();
            grip(s.x + s.r, s.y);
        } else if (S.sel.kind === 'arcs') {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineWidth = s.w + 6;
            ctx.strokeStyle = 'rgba(88,166,255,0.35)';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, s.from * Math.PI / 180, s.to * Math.PI / 180);
            ctx.stroke();
            ctx.restore();
            ctx.beginPath();
            ctx.arc(s.x, s.y, 5 / view.scale, 0, Math.PI * 2);
            ctx.stroke();
            var mid = arcGrip(s);
            grip(mid.x, mid.y);
        } else if (S.sel.kind === 'vents') {
            ctx.beginPath();
            ctx.arc(s.x, s.y, C.VENT_R + 6, 0, Math.PI * 2);
            ctx.stroke();
        } else if (s.pts) {
            ctx.beginPath();
            for (var pi = 0; pi < s.pts.length; pi += 2) ctx.lineTo(s.pts[pi], s.pts[pi + 1]);
            ctx.closePath();
            ctx.stroke();
            for (pi = 0; pi < s.pts.length; pi += 2) grip(s.pts[pi], s.pts[pi + 1]);
        } else if (S.sel.kind === 'rails') {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineWidth = s.w + 6;
            ctx.strokeStyle = 'rgba(88,166,255,0.35)';
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.tx, s.ty);
            ctx.stroke();
            ctx.restore();
            grip(s.x, s.y);
            grip(s.tx, s.ty);
        } else if (S.sel.kind === 'tunnels') {
            // Both mouths ringed; the one in hand ringed twice.
            [['a', s.x, s.y], ['b', s.tx, s.ty]].forEach(function (m) {
                ctx.beginPath();
                ctx.arc(m[1], m[2], C.TUNNEL_R + 8, 0, Math.PI * 2);
                ctx.stroke();
                if (S.sel.end === m[0]) {
                    ctx.beginPath();
                    ctx.arc(m[1], m[2], C.TUNNEL_R + 13, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
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

    // Where a curve's radius is grabbed: halfway round it.
    function arcGrip(s) {
        var m = (s.from + s.to) / 2 * Math.PI / 180;
        return { x: s.x + Math.cos(m) * s.r, y: s.y + Math.sin(m) * s.r };
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
        if (k.arc) {
            ctx.setLineDash([]);
            ctx.lineCap = 'round';
            ctx.lineWidth = 24;
            ctx.strokeStyle = 'rgba(156,79,54,0.6)';
            ctx.beginPath();
            ctx.arc(drag.preview.x, drag.preview.y, drag.preview.r, Math.PI, Math.PI * 2);
            ctx.stroke();
        } else if (k.round || k.point) {
            ctx.beginPath();
            ctx.arc(drag.preview.x, drag.preview.y, k.point ? C.VENT_R : drag.preview.r, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
        } else if (k.body) {
            ctx.setLineDash([]);
            ctx.lineCap = 'round';
            ctx.lineWidth = 24;
            ctx.strokeStyle = 'rgba(138,90,52,0.6)';
            ctx.beginPath();
            ctx.moveTo(drag.preview.x, drag.preview.y);
            ctx.lineTo(drag.preview.tx, drag.preview.ty);
            ctx.stroke();
        } else if (k.pair) {
            ctx.beginPath();
            ctx.moveTo(drag.preview.x, drag.preview.y);
            ctx.lineTo(drag.preview.tx, drag.preview.ty);
            ctx.stroke();
            [[drag.preview.x, drag.preview.y], [drag.preview.tx, drag.preview.ty]].forEach(function (m) {
                ctx.beginPath();
                ctx.arc(m[0], m[1], C.TUNNEL_R, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
            });
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
        if (kindOf(S.sel.kind).pair || kindOf(S.sel.kind).point) return null;   // an end or a vent is moved, not resized
        if (s.pts) {
            for (var v = 0; v < s.pts.length; v += 2) {
                if (Math.abs(wx - s.pts[v]) <= tol && Math.abs(wy - s.pts[v + 1]) <= tol) return { id: 'v', index: v };
            }
            return null;
        }
        if (S.sel.kind === 'bumpers' || S.sel.kind === 'hills' || S.sel.kind === 'spinners' || S.sel.kind === 'turntables') {
            if (Math.abs(wx - (s.x + s.r)) <= tol && Math.abs(wy - s.y) <= tol) return { id: 'r' };
            return null;
        }
        if (S.sel.kind === 'arcs') {
            var g = arcGrip(s);
            if (Math.abs(wx - g.x) <= tol && Math.abs(wy - g.y) <= tol) return { id: 'r' };
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
                if (kind.pair) {
                    var reach = kind.body ? s.w / 2 + 4 : C.TUNNEL_R + 5;
                    if (Math.hypot(wx - s.x, wy - s.y) <= reach) return { kind: kind.key, idx: j, end: 'a' };
                    if (Math.hypot(wx - s.tx, wy - s.ty) <= reach) return { kind: kind.key, idx: j, end: 'b' };
                    if (kind.body && P.circleRail(wx, wy, 2, s)) return { kind: kind.key, idx: j, end: 'body' };
                } else if (kind.arc) {
                    if (P.arcRails(s).some(function (seg) { return P.circleRail(wx, wy, 2, seg); })) return { kind: kind.key, idx: j };
                } else if (s.pts) {
                    if (P.pointInPoly(wx, wy, s.pts) ||
                        (kind.block && P.blockRails(s).some(function (seg) { return P.circleRail(wx, wy, 2, seg); }))) {
                        return { kind: kind.key, idx: j };
                    }
                } else if (kind.point) {
                    if (Math.hypot(wx - s.x, wy - s.y) <= C.VENT_R + 4) return { kind: kind.key, idx: j };
                } else if (kind.round) {
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
                type: handle.id === 'r' ? 'radius' : handle.id === 'v' ? 'vertex' : 'resize',
                id: handle.id, index: handle.index, orig: JSON.parse(JSON.stringify(s))
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
            var bx = hit.end === 'b' ? sh.tx : sh.x, by = hit.end === 'b' ? sh.ty : sh.y;
            // Polygons and a rail's body move as a whole, from where they
            // were when the drag began.
            drag = { type: 'move', dx: bx - p.wx, dy: by - p.wy, ox: p.wx, oy: p.wy, orig: JSON.parse(JSON.stringify(sh)) };
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
            if (k.point) {
                drag.preview = { x: drag.x0, y: drag.y0 };
            } else if (k.arc || k.hill || k.spin || k.turn) {
                drag.preview = { x: drag.x0, y: drag.y0, r: drag.moved ? Math.max(40, Math.round(Math.hypot(p.wx - drag.x0, p.wy - drag.y0))) : 110 };
            } else if (k.round) {
                var rad = Math.max(C.BUMPER_MIN_R, Math.round(Math.hypot(p.wx - drag.x0, p.wy - drag.y0)));
                drag.preview = { x: drag.x0, y: drag.y0, r: drag.moved ? rad : C.BUMPER_MIN_R + 10 };
            } else if (k.pair) {
                // From the mouth you pressed to the one you let go on.
                drag.preview = { x: drag.x0, y: drag.y0, tx: clampX(snapVal(p.wx, e)), ty: clampY(snapVal(p.wy, e)) };
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

        var o = drag.orig, ddx = snapVal(p.wx - drag.ox, e), ddy = snapVal(p.wy - drag.oy, e);
        if (drag.type === 'move' && s.pts) {
            for (var q = 0; q < s.pts.length; q += 2) { s.pts[q] = o.pts[q] + ddx; s.pts[q + 1] = o.pts[q + 1] + ddy; }
        } else if (drag.type === 'move' && kindOf(S.sel.kind).pair && S.sel.end === 'body') {
            s.x = o.x + ddx; s.y = o.y + ddy; s.tx = o.tx + ddx; s.ty = o.ty + ddy;
        } else if (drag.type === 'move' && kindOf(S.sel.kind).pair) {
            var mx = snapVal(p.wx + drag.dx, e), my = snapVal(p.wy + drag.dy, e);
            // A tunnel mouth stays on the field; a rail may run to its edge.
            if (S.sel.kind === 'tunnels') { mx = clampX(mx); my = clampY(my); }
            else { mx = Math.max(0, Math.min(C.WORLD_W, mx)); my = Math.max(0, Math.min(C.WORLD_H, my)); }
            if (S.sel.end === 'b') { s.tx = mx; s.ty = my; } else { s.x = mx; s.y = my; }
        } else if (drag.type === 'vertex') {
            s.pts[drag.index] = Math.max(0, Math.min(C.WORLD_W, snapVal(p.wx, e)));
            s.pts[drag.index + 1] = Math.max(0, Math.min(C.WORLD_H, snapVal(p.wy, e)));
        } else if (drag.type === 'move') {
            s.x = snapVal(p.wx + drag.dx, e);
            s.y = snapVal(p.wy + drag.dy, e);
        } else if (drag.type === 'radius' && (S.sel.kind === 'hills' || S.sel.kind === 'arcs' || S.sel.kind === 'spinners' || S.sel.kind === 'turntables')) {
            s.r = Math.max(40, Math.round(Math.hypot(snapVal(p.wx, e) - s.x, snapVal(p.wy, e) - s.y)));
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
        if (k.point) {
            shape = { x: clampX(d.x0), y: clampY(d.y0), every: 3, at: 0, run: 1 };
        } else if (k.hill) {
            shape = { x: d.x0, y: d.y0, r: d.preview ? d.preview.r : 110, a: 120 };
        } else if (k.spin) {
            shape = { x: d.x0, y: d.y0, r: d.preview ? Math.min(d.preview.r, 160) : 100, arms: 2, speed: 1, phase: 0, w: 20 };
        } else if (k.turn) {
            shape = { x: d.x0, y: d.y0, r: d.preview ? Math.max(50, Math.min(d.preview.r, 200)) : 110, speed: 1.5 };
        } else if (k.arc) {
            shape = { x: d.x0, y: d.y0, r: d.preview ? d.preview.r : 110, from: 180, to: 360, w: 24 };
        } else if (k.round) {
            shape = { x: d.x0, y: d.y0, r: d.preview ? d.preview.r : C.BUMPER_MIN_R + 10 };
        } else if (k.pair) {
            // A click with no drag puts the far end a sensible walk away.
            var reachOut = k.body ? 160 : 300;
            shape = d.moved && d.preview
                ? { x: d.x0, y: d.y0, tx: d.preview.tx, ty: d.preview.ty }
                : { x: d.x0, y: d.y0, tx: clampX(d.x0 + (d.x0 < C.WORLD_W / 2 ? reachOut : -reachOut)), ty: clampY(d.y0 + (k.body ? 80 : 0)) };
            if (k.body) shape.w = 24;
        } else if (d.moved && d.preview) {
            shape = { x: d.preview.x, y: d.preview.y, w: Math.max(MIN_SIDE, d.preview.w), h: Math.max(MIN_SIDE, d.preview.h) };
        } else {
            var def = DEFAULT_RECT[kind] || [120, 120];
            shape = { x: snapVal(d.x0 - def[0] / 2, e), y: snapVal(d.y0 - def[1] / 2, e), w: def[0], h: def[1] };
        }
        if (kind === 'slopes') { shape.ax = 0; shape.ay = 150; }
        if (kind === 'avalanches') { shape.dir = 'down'; shape.every = 4; shape.at = 0; }
        if (kind === 'belts') { shape.dir = shape.w >= shape.h ? 'right' : 'down'; shape.speed = 140; }
        // A block is a shape from the start: four corners to drag about.
        if (kind === 'blocks') {
            shape = { look: 'bed', pts: [shape.x, shape.y, shape.x + shape.w, shape.y, shape.x + shape.w, shape.y + shape.h, shape.x, shape.y + shape.h], w: 20 };
        }
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
            theme: S.hole.theme || 'parkland',
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
        // Same overswing the game applies: playtesting a hole with a truer
        // stroke than the player gets would be testing a different hole.
        var fired = play.aim.angle + P.scatter(play.aim.power, Math.random());
        if (play.aim.power >= C.MIN_POWER && P.launch(play.world, fired, play.aim.power)) {
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
            var burnt = w.lava;
            w.lava = false;
            play.strokes += C.WATER_PENALTY;
            w.ball.x = w.origin.x; w.ball.y = w.origin.y;
            w.ball.vx = w.ball.vy = 0;
            w.splash = false;
            play.splashAt = 0;
            play.trail = [];
            toast(burnt ? 'Lava — one stroke penalty' : 'Water — one stroke penalty', 'bad');
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
        if (kind === 'tunnels') {
            return Math.round(s.x) + ',' + Math.round(s.y) + ' ⇄ ' + Math.round(s.tx) + ',' + Math.round(s.ty);
        }
        if (kind === 'rails') {
            return Math.round(s.x) + ',' + Math.round(s.y) + ' — ' + Math.round(s.tx) + ',' + Math.round(s.ty) + '  w ' + Math.round(s.w);
        }
        if (kind === 'vents') return '@ ' + Math.round(s.x) + ',' + Math.round(s.y) + '  blows ' + s.run + 's of ' + s.every + 's';
        if (kind === 'hills') return (s.a < 0 ? 'bowl' : 'mound') + ' r ' + Math.round(s.r) + ' @ ' + Math.round(s.x) + ',' + Math.round(s.y);
        if (kind === 'turntables') return 'r ' + Math.round(s.r) + ' @ ' + Math.round(s.x) + ',' + Math.round(s.y) + '  ' + s.speed + ' rad/s';
        if (kind === 'spinners') return s.arms + ' arms r ' + Math.round(s.r) + ' @ ' + Math.round(s.x) + ',' + Math.round(s.y) + '  ' + s.speed + ' rad/s';
        if (kind === 'arcs') return 'r ' + Math.round(s.r) + ' @ ' + Math.round(s.x) + ',' + Math.round(s.y) + '  ' + Math.round(s.from) + '°→' + Math.round(s.to) + '°';
        if (kind === 'blocks') return s.look + ' · ' + s.pts.length / 2 + ' corners';
        if (s.pts) return 'polygon · ' + s.pts.length / 2 + ' corners';
        var base = Math.round(s.w) + '×' + Math.round(s.h) + ' @ ' + Math.round(s.x) + ',' + Math.round(s.y);
        if (kind === 'slopes') base += '  ↘ ' + Math.round(s.ax) + ',' + Math.round(s.ay) + (s.wind ? ' (wind)' : '');
        if (kind === 'avalanches') base += '  ' + ({ down: '↓', up: '↑', left: '←', right: '→' }[s.dir] || '↓') + ' every ' + s.every + 's';
        if (kind === 'belts') base += '  ' + ({ down: '↓', up: '↑', left: '←', right: '→' }[s.dir] || '→') + ' ' + s.speed + 'px/s';
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
                    '<i class="swatch' + (k.round || k.point || (k.pair && !k.body) ? ' round' : '') + '" style="background:' + k.color + '"></i>' +
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
                    : 'A slow ball topples in, a firm one at the middle hits the back and drops, one that catches the edge rides the lip and may spin out.') +
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
        } else if (S.sel.kind === 'hills') {
            html += numRow('x', 'x', s.x) + numRow('y', 'y', s.y) +
                numRow('radius', 'r', s.r, 5, 'How far out the hill reaches') +
                numRow('pull', 'a', s.a, 10, 'Steepest pull, halfway out, px/s² — positive is a mound, negative a bowl') +
                '<div class="hint" style="margin-top:6px">A mound sheds the ball off its sides; a bowl gathers it to ' +
                'the middle, where it can come to rest. Keep it clear of the cushion and of anything solid — it would ' +
                'hold the ball against them for ever.</div>';
        } else if (S.sel.kind === 'turntables') {
            html += numRow('centre x', 'x', s.x) + numRow('centre y', 'y', s.y) +
                numRow('radius', 'r', s.r, 5, '50 to 200') +
                numRow('speed', 'speed', s.speed, 0.1, 'Radians a second, clockwise when positive — 0.5 to 3') +
                '<div class="hint" style="margin-top:6px">A record on its player: ground that turns. A putt across it ' +
                'comes off bent the way it turns, and a ball left on it is flung off the rim — so keep the disc and a ' +
                'ball\'s width and a half round it clear of anything solid, the cushion, the tee and the cup.</div>';
        } else if (S.sel.kind === 'spinners') {
            html += numRow('pivot x', 'x', s.x) + numRow('pivot y', 'y', s.y) +
                numRow('arm length', 'r', s.r, 5) +
                numRow('arms', 'arms', s.arms, 1, 'One to four') +
                numRow('speed', 'speed', s.speed, 0.1, 'Radians a second, clockwise when positive — 0.3 to 3') +
                numRow('phase', 'phase', s.phase, 0.1, 'Where the first arm points at the start, in radians') +
                numRow('thickness', 'w', s.w, 1, 'Nothing thinner than ' + MIN_SIDE + 'px') +
                '<div class="hint" style="margin-top:6px">A turnstile laid flat: its arms bat the ball on as they come ' +
                'round. Keep the whole disc it sweeps, and a ball\'s width round it, clear of anything solid, the cushion, ' +
                'the tee and the cup — an arm must never be able to crush a ball.</div>';
        } else if (S.sel.kind === 'arcs') {
            html += numRow('centre x', 'x', s.x) + numRow('centre y', 'y', s.y) +
                numRow('radius', 'r', s.r, 5) +
                numRow('from °', 'from', s.from, 5, 'Where the curve starts: degrees clockwise from pointing right') +
                numRow('to °', 'to', s.to, 5, 'Where it ends — always more than from, and no more than a full turn past it') +
                numRow('thickness', 'w', s.w, 1, 'Nothing thinner than ' + MIN_SIDE + 'px') +
                '<div class="hint" style="margin-top:6px">A wall bent round an arc, collided as a chain of short rails. ' +
                'Drag it to move the centre, the grip halfway round to change the radius. A ball sent along the inside ' +
                'of a curve rides it round.</div>';
        } else if (S.sel.kind === 'blocks') {
            html += '<div class="row"><span class="lbl">look</span><span class="field"><select data-field="look">' +
                LOOKS.map(function (l) { return '<option value="' + l + '"' + (s.look === l ? ' selected' : '') + '>' + l + '</option>'; }).join('') +
                '</select></span></div>' +
                numRow('kerb', 'w', s.w, 1, 'The edge the ball meets, as thick as a rail: nothing under ' + MIN_SIDE + 'px') +
                '<div class="hint">A solid shape of ' + s.pts.length / 2 + ' corners: the ball meets its kerb, and what ' +
                'is inside is only scenery. A fan blows down the nearest wind; a windmill\'s door paths run to any ' +
                'tunnel mouth beside it.</div>' +
                '<div class="row" style="margin-top:6px">' +
                '<button class="btn" id="btn-pt-add" style="flex:1">+ corner</button>' +
                '<button class="btn" id="btn-pt-drop" style="flex:1"' + (s.pts.length <= 6 ? ' disabled' : '') + '>− corner</button>' +
                '<button class="btn" id="btn-round" style="flex:1" title="Cut every corner in two — twice over, a hexagon is a pebble">Round it</button></div>';
        } else if (S.sel.kind === 'rails') {
            html += numRow('from x', 'x', s.x) + numRow('from y', 'y', s.y) +
                numRow('to x', 'tx', s.tx) + numRow('to y', 'ty', s.ty) +
                numRow('thickness', 'w', s.w, 1, 'Nothing thinner than ' + MIN_SIDE + 'px') +
                '<div class="hint" style="margin-top:6px">A wall at any angle, collided as a capsule: round at both ' +
                'ends. Drag an end to move it, the middle to move the whole rail. It may run to the cushion.</div>';
        } else if (s.pts) {
            html += '<div class="hint">A polygon of ' + s.pts.length / 2 + ' corners. Drag a corner to move it, ' +
                'the inside to move the whole shape.</div>' +
                '<div class="row" style="margin-top:6px">' +
                '<button class="btn" id="btn-pt-add" style="flex:1">+ corner</button>' +
                '<button class="btn" id="btn-pt-drop" style="flex:1"' + (s.pts.length <= 6 ? ' disabled' : '') + '>− corner</button>' +
                '<button class="btn" id="btn-square" style="flex:1">Square it</button></div>';
        } else if (S.sel.kind === 'vents') {
            html += numRow('x', 'x', s.x) + numRow('y', 'y', s.y) +
                numRow('every', 'every', s.every, 0.1, 'Seconds from one eruption to the next') +
                numRow('blows for', 'run', s.run, 0.1, 'Seconds it blows each time') +
                numRow('first at', 'at', s.at, 0.1, 'When in the hole\'s clock the first eruption starts') +
                '<div class="hint" style="margin-top:6px">A ball over the vent while it blows is thrown up for ' +
                C.VENT_AIR + 's and carries on in the air on the line it had. Keep it on open ground: off water, lava, ' +
                'slopes and chutes, clear of walls, and well off the tee and the cup.</div>';
        } else if (S.sel.kind === 'tunnels') {
            html += numRow('mouth x', 'x', s.x) + numRow('mouth y', 'y', s.y) +
                numRow('far x', 'tx', s.tx) + numRow('far y', 'ty', s.ty) +
                '<div class="hint" style="margin-top:6px">It runs both ways and keeps the shot: whatever speed and ' +
                'heading the ball goes down one mouth with, it comes up the other with. Keep each mouth clear of ' +
                'walls, posts, water, slopes, the tee and the cup.</div>';
        } else {
            html += numRow('x', 'x', s.x) + numRow('y', 'y', s.y) +
                numRow('width', 'w', s.w, 1, 'Nothing thinner than ' + MIN_SIDE + 'px') +
                numRow('height', 'h', s.h, 1, 'Nothing thinner than ' + MIN_SIDE + 'px');
        }

        if (S.sel.kind === 'slopes') {
            html += '<div class="subhead">Break</div>' +
                numRow('accel x', 'ax', s.ax, 10, 'Constant acceleration while the ball is inside, px/s²') +
                numRow('accel y', 'ay', s.ay, 10, 'Positive is downward — y grows toward the bottom of the field') +
                '<div class="row"><label class="lbl"><input type="checkbox" data-field="wind"' + (s.wind ? ' checked' : '') +
                '> it is wind, not ground — put a fan block at its head</label></div>' +
                '<div class="hint" style="margin-top:6px">A slope must not reach a cushion or a wall it can pin the ball ' +
                'against: a ball inside a slope zone is never counted as at rest, so it would rattle there for ever.</div>';
        }

        if (S.sel.kind === 'belts') {
            html += '<div class="subhead">Running</div>' +
                '<div class="row"><span class="lbl">runs</span><span class="field"><select data-field="dir">' +
                ['right', 'left', 'down', 'up'].map(function (d) {
                    return '<option value="' + d + '"' + (s.dir === d ? ' selected' : '') + '>' + d + '</option>';
                }).join('') + '</select></span></div>' +
                numRow('speed', 'speed', s.speed, 10, 'Pixels a second, 40 to 320') +
                '<div class="hint" style="margin-top:6px">Ground that moves: a ball on it comes up to its pace and rides ' +
                'it to the end. The far end has to run out onto open grass — not into the cushion or anything solid — and ' +
                'nothing else may lie on a belt.</div>';
        }

        if (S.sel.kind === 'avalanches') {
            html += '<div class="subhead">Slides</div>' +
                '<div class="row"><span class="lbl">downhill</span><span class="field"><select data-field="dir">' +
                ['down', 'up', 'left', 'right'].map(function (d) {
                    return '<option value="' + d + '"' + (s.dir === d ? ' selected' : '') + '>' + d + '</option>';
                }).join('') + '</select></span></div>' +
                numRow('every', 'every', s.every, 0.1, 'Seconds from one slide setting off to the next') +
                numRow('first at', 'at', s.at, 0.1, 'When in the hole\'s clock the first slide sets off') +
                '<div class="hint" style="margin-top:6px">A slide runs the chute at ' + C.AVALANCHE_SPEED + 'px/s and ' +
                'carries whatever it is over out of the foot. Every point must lie clear for ' + C.AVALANCHE_CLEAR +
                's of each cycle, and one slide must be gone before the next sets off.</div>';
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

        if (POLY_KINDS[S.sel.kind] && !s.pts) {
            html += '<div class="row" style="margin-top:8px"><button class="btn" id="btn-poly" style="flex:1" ' +
                'title="Turn the rectangle into four corners you can drag anywhere — banks on the slant">' +
                '◆ Make it a polygon</button></div>';
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
        var mk = $('btn-poly');
        if (mk) mk.addEventListener('click', function () {
            snapshot();
            var r = selShape();
            list(S.sel.kind)[S.sel.idx] = { pts: [r.x, r.y, r.x + r.w, r.y, r.x + r.w, r.y + r.h, r.x, r.y + r.h] };
            refreshAll();
        });
        var add = $('btn-pt-add');
        if (add) add.addEventListener('click', function () {
            // A new corner halfway along the longest edge: the one with the
            // most room to be bent.
            snapshot();
            var pts = selShape().pts, best = 0, len = -1;
            for (var i = 0; i < pts.length; i += 2) {
                var j = (i + 2) % pts.length, d = Math.hypot(pts[j] - pts[i], pts[j + 1] - pts[i + 1]);
                if (d > len) { len = d; best = i; }
            }
            var nj = (best + 2) % pts.length;
            pts.splice(best + 2, 0, Math.round((pts[best] + pts[nj]) / 2), Math.round((pts[best + 1] + pts[nj + 1]) / 2));
            refreshAll();
        });
        var drop = $('btn-pt-drop');
        if (drop) drop.addEventListener('click', function () {
            snapshot();
            var pts = selShape().pts;
            if (pts.length > 6) pts.splice(pts.length - 2, 2);
            refreshAll();
        });
        var rnd = $('btn-round');
        if (rnd) rnd.addEventListener('click', function () {
            snapshot();
            var b = selShape(), pts = b.pts, out = [];
            for (var i = 0; i < pts.length; i += 2) {
                var ax = pts[i], ay = pts[i + 1], bx = pts[(i + 2) % pts.length], by = pts[(i + 3) % pts.length];
                out.push(Math.round(ax * 0.75 + bx * 0.25), Math.round(ay * 0.75 + by * 0.25),
                         Math.round(ax * 0.25 + bx * 0.75), Math.round(ay * 0.25 + by * 0.75));
            }
            b.pts = out;
            refreshAll();
        });
        var sq = $('btn-square');
        if (sq) sq.addEventListener('click', function () {
            snapshot();
            var pts = selShape().pts, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            for (var i = 0; i < pts.length; i += 2) {
                x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]);
                y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]);
            }
            list(S.sel.kind)[S.sel.idx] = { x: x0, y: y0, w: Math.max(MIN_SIDE, x1 - x0), h: Math.max(MIN_SIDE, y1 - y0) };
            refreshAll();
        });
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
            var v = (f === 'amp' || f === 'speed' || f === 'phase') && target.move
                ? target.move[f]
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
        if (f === 'dir') { target.dir = el.value; return; }
        if (f === 'look') { target.look = el.value; return; }
        if (f === 'wind') {
            if (el.checked) target.wind = true; else delete target.wind;
            return;
        }
        if ((f === 'amp' || f === 'speed' || f === 'phase') && target.move) {
            target.move[f] = parseFloat(el.value) || 0;
            return;
        }
        if (f === 'arms') { target.arms = Math.max(1, Math.min(4, Math.round(parseFloat(el.value) || 2))); return; }

        var v = parseFloat(el.value);
        if (!isFinite(v)) return;
        if (f === 'w' || f === 'h') v = Math.max(MIN_SIDE, v);
        if (f === 'r') v = Math.max(S.sel.kind === 'turntables' ? 50 : S.sel.kind === 'hills' || S.sel.kind === 'arcs' || S.sel.kind === 'spinners' ? 40 : C.BUMPER_MIN_R, v);
        if ((S.sel.kind === 'tee' || S.sel.kind === 'hole') && f === 'x') v = clampX(v);
        if ((S.sel.kind === 'tee' || S.sel.kind === 'hole') && f === 'y') v = clampY(v);
        target[f] = v;
    }

    function duplicateSelection() {
        var s = selShape();
        if (!s) return;
        snapshot();
        var copy = JSON.parse(JSON.stringify(s));
        if (copy.pts) {
            for (var i = 0; i < copy.pts.length; i++) copy.pts[i] += 30;
        } else {
            copy.x += 30; copy.y += 30;
        }
        if (kindOf(S.sel.kind).pair) { copy.tx += 30; copy.ty += 30; }
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
        // Curves and blocks are rails underneath: every rule a rail is held
        // to, they are too.
        var solids = P.railsOf(h);
        function add(level, label, why) { out.push({ level: level, label: label, why: why || '' }); }
        function ok(cond, label, why) { add(cond ? 'pass' : 'fail', label, cond ? '' : why); }

        var rects = [], polys = [];
        ['walls', 'water', 'lava', 'sand', 'rough', 'ice', 'slopes', 'avalanches'].forEach(function (k) {
            h[k].forEach(function (r) { (r.pts ? polys : rects).push({ k: k, r: r }); });
        });

        add(h.name && h.blurb ? 'pass' : 'warn', 'it has a name and a blurb',
            h.name && h.blurb ? '' : 'every hole carries both, though the scoreboard shows only the name for now');
        ok(h.par >= 2 && h.par <= 5, 'par is between 2 and 5', 'par is ' + h.par);

        var thin = rects.filter(function (o) { return Math.min(o.r.w, o.r.h) < MIN_SIDE; });
        ok(thin.length === 0, 'every rectangle is at least ' + MIN_SIDE + 'px thick',
            thin.length + ' too thin — the substep cap cannot stop a ball crossing them');

        /* Polygons (generator.js → validateHole, ported): three corners at
           least, nothing narrower than a rectangle is allowed to be — twice
           the area over the perimeter, which is a strip's width — and only
           in the zones that may have corners. */
        if (polys.length) {
            var slim = polys.filter(function (o) {
                var p = o.r.pts, area = 0, perim = 0;
                for (var i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
                    area += p[j] * p[i + 1] - p[i] * p[j + 1];
                    perim += Math.hypot(p[i] - p[j], p[i + 1] - p[j + 1]);
                }
                return p.length < 6 || !perim || Math.abs(area) / perim < 10;
            });
            ok(slim.length === 0, 'every polygon is at least ' + MIN_SIDE + 'px across',
                slim.length + ' too thin, or with fewer than three corners');
            ok(polys.every(function (o) { return POLY_KINDS[o.k]; }), 'only water, lava, sand, rough and ice have corners',
                'a wall at an angle is a rail; a slope and a chute stay rectangles');
        }
        if (h.arcs.length) {
            ok(h.arcs.every(function (a) { var sw = a.to - a.from; return sw > 0 && sw <= 360; }),
                'every curve sweeps forwards, and no more than a full turn', 'to has to be more than from');
            ok(h.arcs.every(function (a) { return a.r > a.w; }), 'every curve is wider than it is thick',
                'the inside of the bend would be solid');
        }
        if (h.blocks.length) {
            ok(h.blocks.every(function (b) { return b.pts.length >= 6 && b.pts.length % 2 === 0; }),
                'every block has three corners at least', 'add a corner');
            ok(h.blocks.every(function (b) {
                for (var i = 0; i < b.pts.length; i += 2) {
                    if (b.pts[i] < -1 || b.pts[i] > C.WORLD_W + 1 || b.pts[i + 1] < -1 || b.pts[i + 1] > C.WORLD_H + 1) return false;
                }
                return true;
            }), 'every block is on the field', 'a corner is off the edge');
        }
        if (h.hills.length) {
            var edge2 = C.BALL_R + 1;
            ok(h.hills.every(function (hl) { return hl.r >= 40 && hl.a !== 0; }), 'every hill is big enough and pulls',
                'under 40px across or with no pull, it is not a hill');
            ok(h.hills.every(function (hl) {
                return hl.x - hl.r >= edge2 && hl.y - hl.r >= edge2 && hl.x + hl.r <= C.WORLD_W - edge2 && hl.y + hl.r <= C.WORLD_H - edge2;
            }), 'no hill reaches the cushion', 'it would hold a ball against it for ever');
            ok(!h.hills.some(function (hl) {
                var reach = hl.r + C.BALL_R;
                return h.walls.some(function (w) {
                    var a = w.move ? Math.abs(w.move.amp) : 0;
                    var env = !w.move ? w : w.move.axis === 'y'
                        ? { x: w.x, y: w.y - a, w: w.w, h: w.h + a * 2 }
                        : { x: w.x - a, y: w.y, w: w.w + a * 2, h: w.h };
                    return P.circleRect(hl.x, hl.y, reach, env) !== null;
                }) || h.bumpers.some(function (b) { return P.circleCircle(hl.x, hl.y, reach, b) !== null; }) ||
                    solids.some(function (r) { return P.circleRail(hl.x, hl.y, reach, r) !== null; });
            }), 'nothing solid stands on a hill', 'a hill pulls the ball against whatever is on it, for ever');
            ok(!h.hills.some(function (hl) { return Math.hypot(h.tee.x - hl.x, h.tee.y - hl.y) < hl.r + C.BALL_R; }),
                'the tee is off every hill', 'a ball teed up on a hill would not stay there');
        }
        /* Spinners and belts — generator.js → validateHole, ported. An arm
           must never be able to crush a ball, so its whole sweep and a
           ball's width round it is open grass; a belt must put the ball
           down on open grass at its far end. */
        if (h.spinners.length) {
            ok(h.spinners.every(function (sp) {
                return sp.r >= 40 && sp.arms >= 1 && sp.arms <= 4 && Math.abs(sp.speed) >= 0.3 && Math.abs(sp.speed) <= 3 && sp.w >= MIN_SIDE;
            }), 'every spinner is a sane size and pace', 'arms 40px or longer, one to four of them, 0.3 to 3 rad/s, ' + MIN_SIDE + 'px thick');
            var cramped = h.spinners.filter(function (sp, si) {
                var room = P.sweepOf(sp) + C.BALL_R * 2 + 4;
                if (sp.x - room < 0 || sp.y - room < 0 || sp.x + room > C.WORLD_W || sp.y + room > C.WORLD_H) return true;
                return h.walls.some(function (w) {
                    var a = w.move ? Math.abs(w.move.amp) : 0;
                    var env = !w.move ? w : w.move.axis === 'y'
                        ? { x: w.x, y: w.y - a, w: w.w, h: w.h + a * 2 }
                        : { x: w.x - a, y: w.y, w: w.w + a * 2, h: w.h };
                    return P.circleRect(sp.x, sp.y, room, env) !== null;
                }) || h.bumpers.some(function (b) { return P.circleCircle(sp.x, sp.y, room, b) !== null; }) ||
                    solids.some(function (r) { return P.circleRail(sp.x, sp.y, room, r) !== null; }) ||
                    h.spinners.some(function (o, oi) { return oi !== si && Math.hypot(o.x - sp.x, o.y - sp.y) < room + P.sweepOf(o); });
            });
            ok(cramped.length === 0, 'every spinner sweeps open grass', cramped.length + ' could crush a ball against something — or the cushion');
            ok(!h.spinners.some(function (sp) {
                var sw = P.sweepOf(sp);
                return Math.hypot(h.tee.x - sp.x, h.tee.y - sp.y) < sw + C.BALL_R + 12 ||
                    Math.hypot(h.hole.x - sp.x, h.hole.y - sp.y) < sw + C.HOLE_R + 12 ||
                    h.tunnels.some(function (t) {
                        return Math.hypot(t.x - sp.x, t.y - sp.y) < sw + C.TUNNEL_R + C.BALL_R ||
                            Math.hypot(t.tx - sp.x, t.ty - sp.y) < sw + C.TUNNEL_R + C.BALL_R;
                    });
            }), 'the tee, the cup and every mouth are out of every sweep', 'an arm would hit a ball before it was played');
        }
        if (h.belts.length) {
            ok(h.belts.every(function (bt) { return bt.speed >= 40 && bt.speed <= 320; }), 'every belt runs at a pace you can ride',
                '40 to 320 px/s');
            var dead = h.belts.filter(function (bt) {
                var d = P.chuteDir(bt), reach = C.BALL_R * 3 + 4;
                var foot = d.x > 0 ? { x: bt.x + bt.w, y: bt.y, w: reach, h: bt.h }
                         : d.x < 0 ? { x: bt.x - reach, y: bt.y, w: reach, h: bt.h }
                         : d.y > 0 ? { x: bt.x, y: bt.y + bt.h, w: bt.w, h: reach }
                         : { x: bt.x, y: bt.y - reach, w: bt.w, h: reach };
                if (foot.x < 0 || foot.y < 0 || foot.x + foot.w > C.WORLD_W || foot.y + foot.h > C.WORLD_H) return true;
                return h.walls.some(function (w) { return P.circleRect(foot.x + foot.w / 2, foot.y + foot.h / 2, Math.max(foot.w, foot.h) / 2, w) !== null; }) ||
                    solids.some(function (r) { return P.circleRail(foot.x + foot.w / 2, foot.y + foot.h / 2, Math.min(foot.w, foot.h) / 2, r) !== null; });
            });
            ok(dead.length === 0, 'every belt runs out onto open grass', dead.length + ' run into the cushion or something solid');
            ok(!h.belts.some(function (bt) {
                return P.circleRect(h.tee.x, h.tee.y, C.BALL_R + 4, bt) || P.circleRect(h.hole.x, h.hole.y, C.HOLE_R + 12, bt);
            }), 'the tee and the cup are off every belt', 'nothing rests on a belt');
        }

        /* Turntables — generator.js → validateHole, ported. A platter flings
           what it holds off its rim, so it and a ball's width and a half
           round it are on the field and clear of anything solid. */
        if (h.turntables.length) {
            ok(h.turntables.every(function (tt) { return tt.r >= 50 && tt.r <= 200 && Math.abs(tt.speed) >= 0.5 && Math.abs(tt.speed) <= 3; }),
                'every turntable is a sane size and pace', 'a radius of 50 to 200, 0.5 to 3 rad/s');
            var crowded = h.turntables.filter(function (tt) {
                var room = tt.r + C.BALL_R * 3;
                if (tt.x - room < 0 || tt.y - room < 0 || tt.x + room > C.WORLD_W || tt.y + room > C.WORLD_H) return true;
                return h.walls.some(function (w) {
                    var a = w.move ? Math.abs(w.move.amp) : 0;
                    var env = !w.move ? w : w.move.axis === 'y'
                        ? { x: w.x, y: w.y - a, w: w.w, h: w.h + a * 2 }
                        : { x: w.x - a, y: w.y, w: w.w + a * 2, h: w.h };
                    return P.circleRect(tt.x, tt.y, room, env) !== null;
                }) || h.bumpers.some(function (b) { return Math.hypot(b.x - tt.x, b.y - tt.y) < room + b.r; }) ||
                    solids.some(function (r) { return P.circleRail(tt.x, tt.y, room, r) !== null; }) ||
                    h.spinners.some(function (sp) { return Math.hypot(sp.x - tt.x, sp.y - tt.y) < room + P.sweepOf(sp); });
            });
            ok(crowded.length === 0, 'every turntable has open grass round it', crowded.length + ' would fling a ball into something, or the cushion');
            ok(!h.turntables.some(function (tt) {
                return Math.hypot(h.tee.x - tt.x, h.tee.y - tt.y) < tt.r + C.BALL_R + 12 ||
                    Math.hypot(h.hole.x - tt.x, h.hole.y - tt.y) < tt.r + C.HOLE_R + 12;
            }), 'the tee and the cup are off every turntable', 'nothing rests on a turntable');
        }

        /* A shape running along the cushion meets it or leaves a ball's
           width: a sliver narrower than the ball is where a hard shot wedges
           one and leaves it overlapping the wall (generator.js, ported). */
        var crack = C.BALL_R * 2 + 1;
        var slivers = h.rails.map(function (r) { return [r]; }).concat(h.arcs.map(P.arcRails), h.blocks.map(P.blockRails))
            .filter(function (links) {
                var near = [Infinity, Infinity, Infinity, Infinity], touch = [false, false, false, false];
                links.forEach(function (r) {
                    var hw = r.w / 2, L = Math.hypot(r.tx - r.x, r.ty - r.y) || 1;
                    var flatX = Math.abs(r.ty - r.y) / L < 0.6, flatY = Math.abs(r.tx - r.x) / L < 0.6;
                    [[flatX, Math.min(r.y, r.ty) - hw], [flatX, C.WORLD_H - Math.max(r.y, r.ty) - hw],
                     [flatY, Math.min(r.x, r.tx) - hw], [flatY, C.WORLD_W - Math.max(r.x, r.tx) - hw]].forEach(function (c, side) {
                        if (c[1] <= 0.5) touch[side] = true;
                        else if (c[0]) near[side] = Math.min(near[side], c[1]);
                    });
                });
                return near.some(function (gap, side) { return !touch[side] && gap < crack; });
            });
        ok(slivers.length === 0, 'nothing leaves a sliver against the cushion narrower than a ball',
            slivers.length + ' shape(s) run along the cushion ' + 'too close to it — touch it, or leave ' + Math.ceil(crack) + 'px');

        if (solids.length) {
            var railThin = solids.filter(function (r) { return !(r.w >= MIN_SIDE); });
            ok(railThin.length === 0, 'every rail, curve and kerb is at least ' + MIN_SIDE + 'px thick',
                railThin.length + ' too thin for the substep cap to protect');
            ok(solids.every(function (r) {
                return [r.x, r.tx].every(function (x) { return x >= -1 && x <= C.WORLD_W + 1; }) &&
                    [r.y, r.ty].every(function (y) { return y >= -1 && y <= C.WORLD_H + 1; });
            }), 'every rail ends on the field', 'a rail end is off the edge');
        }

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
        }) || solids.some(function (r) {
            return P.circleRail(h.tee.x, h.tee.y, C.BALL_R, r) !== null;
        }) || h.bumpers.some(function (b) {
            return P.circleCircle(h.tee.x, h.tee.y, C.BALL_R, b) !== null;
        }) || P.zoneAt(h.water, h.tee.x, h.tee.y) !== null || P.zoneAt(h.lava, h.tee.x, h.tee.y) !== null ||
            P.inBlock(h, h.tee.x, h.tee.y) !== null;
        ok(!teeBlocked, 'the ball does not start in a wall, a post, a lake or lava');

        var cupBlocked = h.walls.some(function (w) {
            return P.circleRect(h.hole.x, h.hole.y, C.HOLE_R, P.wallRect(w, 0)) !== null;
        }) || solids.some(function (r) {
            return P.circleRail(h.hole.x, h.hole.y, C.HOLE_R, r) !== null;
        }) || h.bumpers.some(function (b) {
            return P.circleCircle(h.hole.x, h.hole.y, C.HOLE_R, b) !== null;
        }) || P.zoneAt(h.water, h.hole.x, h.hole.y) !== null || P.zoneAt(h.lava, h.hole.x, h.hole.y) !== null ||
            P.inBlock(h, h.hole.x, h.hole.y) !== null;
        ok(!cupBlocked, 'the cup is clear of walls, posts, water and lava',
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

        /* Tunnels — generator.js → validateHole, ported. A mouth needs a
           ball's width and a half of clear grass round it over the whole of
           any gate's travel, must not sit on a slope (a ball the hill held
           over it would go down without being played), and must keep off the
           tee, well off the cup, and off every other mouth. */
        if (h.tunnels.length) {
            var TR = C.TUNNEL_R, edge = C.BALL_R + 1, mouths = [];
            h.tunnels.forEach(function (t) { mouths.push({ x: t.x, y: t.y }, { x: t.tx, y: t.ty }); });
            var short = h.tunnels.filter(function (t) { return Math.hypot(t.tx - t.x, t.ty - t.y) < TR * 6; });
            ok(short.length === 0, 'every tunnel goes somewhere', short.length + ' with its two mouths too close together');
            ok(mouths.every(function (m) {
                return m.x - TR > edge && m.x + TR < C.WORLD_W - edge && m.y - TR > edge && m.y + TR < C.WORLD_H - edge;
            }), 'every tunnel mouth is on the field', 'a mouth runs over the cushion');
            var crowded = mouths.filter(function (m) {
                return h.walls.some(function (w) {
                    var a = w.move ? Math.abs(w.move.amp) : 0;
                    var env = !w.move ? w : w.move.axis === 'y'
                        ? { x: w.x, y: w.y - a, w: w.w, h: w.h + a * 2 }
                        : { x: w.x - a, y: w.y, w: w.w + a * 2, h: w.h };
                    return P.circleRect(m.x, m.y, TR + C.BALL_R, env) !== null;
                }) || h.bumpers.some(function (b) {
                    return P.circleCircle(m.x, m.y, TR + C.BALL_R, b) !== null;
                }) || solids.some(function (r) {
                    return P.circleRail(m.x, m.y, TR + C.BALL_R, r) !== null;
                }) || h.water.concat(h.lava).some(function (r) {
                    return touches(m.x, m.y, TR + C.BALL_R, r);
                });
            });
            ok(crowded.length === 0, 'tunnel mouths are clear of walls, posts, water and lava',
                crowded.length + ' mouth(s) crowded — a gate\'s whole travel counts');
            ok(!mouths.some(function (m) {
                return h.slopes.some(function (r) { return touches(m.x, m.y, TR, r); }) || P.inHill(h.hills, m.x, m.y, TR);
            }), 'no tunnel mouth sits on a slope or a hill', 'a ball the slope holds over a mouth goes down it unplayed');
            ok(!mouths.some(function (m) {
                return Math.hypot(m.x - h.tee.x, m.y - h.tee.y) < TR + C.BALL_R + 12 ||
                       Math.hypot(m.x - h.hole.x, m.y - h.hole.y) < TR + C.HOLE_R + 40;
            }), 'tunnel mouths keep off the tee and the cup', 'move the mouth further away');
            var touching = 0;
            mouths.forEach(function (m, mi) {
                mouths.forEach(function (o, oi) {
                    if (oi > mi && Math.hypot(m.x - o.x, m.y - o.y) < TR * 2 + C.BALL_R * 2) touching++;
                });
            });
            ok(touching === 0, 'no two tunnel mouths overlap', touching + ' pair(s) too close');
        }

        /* Avalanche chutes — generator.js → validateHole, ported. A slide
           has to be something you can wait out: every point clear for
           AVALANCHE_CLEAR seconds a cycle, one slide gone before the next
           sets off, and the tee and the cup off the chute. */
        if (h.avalanches.length) {
            var clash = h.avalanches.filter(function (a) {
                var L = a.dir === 'left' || a.dir === 'right' ? a.w : a.h, len = a.len || C.AVALANCHE_LEN;
                return !(a.every > 0) || a.every < (L + len) / C.AVALANCHE_SPEED;
            });
            ok(clash.length === 0, 'one slide at a time in every chute',
                clash.length + ' chute(s) send the next slide before the last has cleared — slow them down');
            var shut = h.avalanches.filter(function (a) {
                return a.every - (a.len || C.AVALANCHE_LEN) / C.AVALANCHE_SPEED < C.AVALANCHE_CLEAR;
            });
            ok(shut.length === 0, 'every chute lies clear long enough to cross',
                shut.length + ' chute(s) are covered too much of the time');
            ok(!h.avalanches.some(function (a) {
                return P.circleRect(h.tee.x, h.tee.y, C.BALL_R + 12, a) || P.circleRect(h.hole.x, h.hole.y, C.HOLE_R + 24, a);
            }), 'the tee and the cup are off every chute', 'a slide would carry the ball off before it was played, or out of the cup');
        }

        /* Geysers — ported the same way. A vent is a disc of open ground:
           blowing for part of its cycle, off the edge, clear of anything
           solid, wet or burning, off slopes and chutes, off the tee and well
           off the cup. */
        if (h.vents.length) {
            var VR = C.VENT_R, rim = C.BALL_R + 1;
            ok(h.vents.every(function (v) { return v.every > 0 && v.run > 0.3 && v.run <= v.every - 0.8; }),
                'every geyser blows for part of its cycle', 'one never rests, or never blows');
            ok(h.vents.every(function (v) {
                return v.x - VR > rim && v.x + VR < C.WORLD_W - rim && v.y - VR > rim && v.y + VR < C.WORLD_H - rim;
            }), 'every geyser is on the field', 'a vent runs over the cushion');
            ok(!h.vents.some(function (v) {
                return h.walls.some(function (w) { return P.circleRect(v.x, v.y, VR + C.BALL_R, P.wallRect(w, 0)) !== null; }) ||
                    h.bumpers.some(function (b) { return P.circleCircle(v.x, v.y, VR + C.BALL_R, b) !== null; }) ||
                    solids.some(function (r) { return P.circleRail(v.x, v.y, VR + C.BALL_R, r) !== null; }) ||
                    h.water.concat(h.lava, h.slopes, h.avalanches).some(function (z) { return touches(v.x, v.y, VR, z); }) ||
                    P.inHill(h.hills, v.x, v.y, VR);
            }), 'geysers stand on open ground', 'a vent touches a wall, a post, water, lava, a slope or a chute');
            ok(!h.vents.some(function (v) {
                return Math.hypot(v.x - h.tee.x, v.y - h.tee.y) < VR + C.BALL_R + 12 ||
                       Math.hypot(v.x - h.hole.x, v.y - h.hole.y) < VR + C.HOLE_R + 40;
            }), 'geysers keep off the tee and the cup', 'move the vent further away');
        }

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
            ok(h.slopes.every(function (sl) { return Math.hypot(sl.ax, sl.ay) >= C.REST_PULL * 4; }), 'every slope pulls',
                'one is too gentle to be told from flat ground');
        }
        /* The same for a hill: dropped anywhere on it, a ball comes to rest —
           off a mound, or at the bottom of a bowl. */
        var stuckOn = null;
        h.hills.forEach(function (hl) {
            for (var k = 0; k < 9 && !stuckOn; k++) {
                var ang = k / 8 * Math.PI * 2, d = k === 8 ? hl.r * 0.1 : hl.r * 0.5;
                var w3 = P.createWorld(h, { x: hl.x + Math.cos(ang) * d, y: hl.y + Math.sin(ang) * d }, 0);
                w3.moving = true;
                P.settle(w3, C.MAX_SHOT_SECONDS);
                if (w3.moving) stuckOn = { x: Math.round(w3.ball.x), y: Math.round(w3.ball.y) };
            }
        });
        if (h.hills.length) {
            ok(!stuckOn, 'a ball left on a hill always comes to rest',
                stuckOn ? 'one was still rolling at ' + stuckOn.x + ',' + stuckOn.y : '');
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

        // The straight putt: aimed at the flag, it must never drop.
        var straight = P.straightAce(h);
        ok(!straight, 'a putt struck straight at the cup never holes out',
            straight ? 'one at ' + Math.round(straight.power / C.SAFE_POWER * 100) + '% weight' +
                (straight.at ? ', ' + straight.at.toFixed(1) + 's into the clock' : '') +
                ' drops — put something on the line' : '');

        return out;
    }

    // A circle reaching into a zone, rectangle or polygon.
    function touches(x, y, rad, z) {
        if (!z.pts) return P.circleRect(x, y, rad, z) !== null;
        if (P.pointInPoly(x, y, z.pts)) return true;
        for (var i = 0, j = z.pts.length - 2; i < z.pts.length; j = i, i += 2) {
            if (P.circleRail(x, y, rad, { x: z.pts[j], y: z.pts[j + 1], tx: z.pts[i], ty: z.pts[i + 1], w: 0 })) return true;
        }
        return false;
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
        if (kind === 'tunnels') return 'tunnel(' + n(s.x) + ', ' + n(s.y) + ', ' + n(s.tx) + ', ' + n(s.ty) + ')';
        if (kind === 'rails') return 'rail(' + n(s.x) + ', ' + n(s.y) + ', ' + n(s.tx) + ', ' + n(s.ty) + ', ' + n(s.w) + ')';
        if (kind === 'vents') return 'vent(' + n(s.x) + ', ' + n(s.y) + ', ' + n(s.every) + ', ' + n(s.at) + ', ' + n(s.run) + ')';
        if (kind === 'hills') {
            return (s.a < 0 ? 'bowl(' : 'mound(') + n(s.x) + ', ' + n(s.y) + ', ' + n(s.r) + ', ' + n(Math.abs(s.a)) + ')';
        }
        if (kind === 'arcs') return 'arc(' + n(s.x) + ', ' + n(s.y) + ', ' + n(s.r) + ', ' + n(s.from) + ', ' + n(s.to) + ', ' + n(s.w) + ')';
        if (kind === 'spinners') {
            return 'spinner(' + n(s.x) + ', ' + n(s.y) + ', ' + n(s.r) + ', ' + n(s.arms) + ', ' + n(s.speed) + ', ' +
                phaseSource(s.phase) + ', ' + n(s.w) + ')';
        }
        if (kind === 'turntables') return 'turntable(' + n(s.x) + ', ' + n(s.y) + ', ' + n(s.r) + ', ' + n(s.speed) + ')';
        if (kind === 'belts') return 'belt(' + n(s.x) + ', ' + n(s.y) + ', ' + n(s.w) + ', ' + n(s.h) + ', ' + q(s.dir) + ', ' + n(s.speed) + ')';
        if (kind === 'blocks') return 'block(' + q(s.look) + ', [' + s.pts.map(n).join(', ') + ']' + (s.w === 20 ? '' : ', ' + n(s.w)) + ')';
        if (kind === 'avalanches') {
            if (typeof s.len === 'number') {
                return '{ x: ' + n(s.x) + ', y: ' + n(s.y) + ', w: ' + n(s.w) + ', h: ' + n(s.h) + ', dir: ' + q(s.dir) +
                    ', every: ' + n(s.every) + ', at: ' + n(s.at) + ', len: ' + n(s.len) + ' }';
            }
            return 'chute(' + n(s.x) + ', ' + n(s.y) + ', ' + n(s.w) + ', ' + n(s.h) + ', ' + q(s.dir) + ', ' + n(s.every) + ', ' + n(s.at) + ')';
        }
        if (s.pts) return 'poly(' + s.pts.map(n).join(', ') + ')';
        if (kind === 'slopes') {
            return '{ x: ' + n(s.x) + ', y: ' + n(s.y) + ', w: ' + n(s.w) + ', h: ' + n(s.h) +
                ', ax: ' + n(s.ax) + ', ay: ' + n(s.ay) + (s.wind ? ', wind: true' : '') + ' }';
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
        if (h.theme) lines.push('    theme: ' + q(h.theme) + ',');
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
        var tunnel = function (x, y, tx, ty) { return { x: x, y: y, tx: tx, ty: ty }; };
        var rail = function (x, y, tx, ty, w) { return { x: x, y: y, tx: tx, ty: ty, w: w || 24 }; };
        var poly = function () { return { pts: Array.prototype.slice.call(arguments) }; };
        var chute = function (x, y, w, h, dir, every, at) { return { x: x, y: y, w: w, h: h, dir: dir, every: every, at: at || 0 }; };
        var vent = function (x, y, every, at, run) { return { x: x, y: y, every: every, at: at || 0, run: run || 1 }; };
        // The shapes courses.js writes curves with, from courses.js itself.
        var H = GOLF.helpers;
        var fn = new Function('r', 'post', 'tunnel', 'rail', 'poly', 'chute', 'vent',
            'arc', 'block', 'mound', 'bowl', 'shape', 'smooth', 'oval', 'ring', 'spinner', 'belt', 'turntable', 'return (' + text + ');');
        var obj = fn(r, post, tunnel, rail, poly, chute, vent, H.arc, H.block, H.mound, H.bowl, H.shape, H.smooth, H.oval,
            H.ring, H.spinner, H.belt, H.turntable);
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
        $('f-theme').value = S.hole.theme || '';
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

    // The biomes a hole may wear, beside "the course's own".
    GOLF.scenery.ORDER.forEach(function (k) {
        var opt = document.createElement('option');
        opt.value = k;
        opt.textContent = GOLF.scenery.THEMES[k].name;
        $('f-theme').appendChild(opt);
    });

    ['f-name', 'f-blurb', 'f-par', 'f-theme'].forEach(function (id) {
        $(id).addEventListener('change', function () {
            snapshot();
            if (id === 'f-par') S.hole.par = Math.max(1, Math.round(+$(id).value || 3));
            else if (id === 'f-theme') {
                if ($(id).value) S.hole.theme = $(id).value; else delete S.hole.theme;
            } else S.hole[id === 'f-name' ? 'name' : 'blurb'] = $(id).value;
            syncCardFields();
            refreshAll();
        });
    });

    $('btn-load').addEventListener('click', function () {
        var v = $('load-select').value;
        if (v === '') return;
        // "courseId:index" rather than a bare index: the rack holds more than
        // one course now, and an index alone stopped naming a hole.
        var at = v.split(':');
        var course = GOLF.COURSES.filter(function (c) { return c.id === at[0]; })[0];
        if (!course) return;
        var src = course.holes[+at[1]];
        loadHole(src, course.id + ' hole ' + (+at[1] + 1));
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
        var prompt = 'I am building a hole for Pocket Links, a 2D mini golf game. ' +
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
        '5': 'ice', '6': 'bumpers', '7': 'slopes', '8': 'tee', '9': 'hole', '0': 'tunnels',
        'l': 'rails', 'L': 'rails', 'h': 'lava', 'H': 'lava',
        'a': 'avalanches', 'A': 'avalanches', 'y': 'vents', 'Y': 'vents',
        'c': 'arcs', 'C': 'arcs', 'b': 'blocks', 'B': 'blocks', 'm': 'hills', 'M': 'hills',
        't': 'spinners', 'T': 'spinners', 'k': 'belts', 'K': 'belts', 'o': 'turntables', 'O': 'turntables'
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
                if (s && s.pts) {
                    for (var q = 0; q < s.pts.length; q += 2) { s.pts[q] += dx; s.pts[q + 1] += dy; }
                } else if (s) { s.x += dx; s.y += dy; }
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
        GOLF.COURSES.forEach(function (course) {
            var group = document.createElement('optgroup');
            group.label = course.name;
            course.holes.forEach(function (h, i) {
                var opt = document.createElement('option');
                opt.value = course.id + ':' + i;
                opt.textContent = (i + 1) + '. ' + h.name + ' (par ' + h.par + ')';
                group.appendChild(opt);
            });
            $('load-select').appendChild(group);
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

        var everyShipped = GOLF.COURSES.reduce(function (all, c) {
            return all.concat(c.holes.map(function (h, i) {
                return { hole: h, tag: c.id + ' hole ' + (i + 1) + ' (' + h.name + ')' };
            }));
        }, []);

        everyShipped.forEach(function (entry) {
            var round = parseHole(buildOut(normalize(entry.hole)));
            var a = JSON.stringify(normalize(entry.hole)), b = JSON.stringify(round);
            check(entry.tag + ' survives an export/parse round trip', a === b,
                'differs after the round trip');
        });

        var shipped = everyShipped.map(function (e) { return runChecks(normalize(e.hole)); });
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

        var open = normalize({ name: 'Open', blurb: 'Nothing on it.', par: 2, tee: { x: 200, y: 320 }, hole: { x: 600, y: 320 } });
        check('a hole with nothing on the straight line is caught', runChecks(open).some(function (c) {
            return c.level === 'fail' && /straight at the cup/.test(c.label);
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

        var bad5 = normalize(GOLF.COURSE[0]);
        bad5.rails.push({ x: bad5.tee.x - 40, y: bad5.tee.y, tx: bad5.tee.x + 40, ty: bad5.tee.y, w: 24 });
        check('a rail across the tee is caught', runChecks(bad5).some(function (c) {
            return c.level === 'fail' && /does not start/.test(c.label);
        }));

        var bad6 = normalize(GOLF.COURSE[0]);
        bad6.water.push({ pts: [400, 100, 600, 100, 600, 104] });
        check('a sliver of a polygon is caught', runChecks(bad6).some(function (c) {
            return c.level === 'fail' && /polygon/.test(c.label);
        }));

        var bad4 = normalize(GOLF.COURSE[0]);
        bad4.tunnels.push({ x: bad4.hole.x + 20, y: bad4.hole.y, tx: 300, ty: 120 });
        check('a tunnel mouth on the cup is caught', runChecks(bad4).some(function (c) {
            return c.level === 'fail' && /tee and the cup/.test(c.label);
        }));

        var bad7 = normalize(GOLF.COURSE[0]);
        bad7.avalanches.push({ x: bad7.tee.x - 60, y: 0, w: 120, h: 400, dir: 'down', every: 4, at: 0 });
        check('a chute over the tee is caught', runChecks(bad7).some(function (c) {
            return c.level === 'fail' && /off every chute/.test(c.label);
        }));

        var bad8 = normalize(GOLF.COURSE[0]);
        bad8.vents.push({ x: bad8.hole.x + 10, y: bad8.hole.y, every: 3, at: 0, run: 1 });
        check('a geyser on the cup is caught', runChecks(bad8).some(function (c) {
            return c.level === 'fail' && /geysers keep off/.test(c.label);
        }));

        var bad9 = normalize(GOLF.COURSE[0]);
        bad9.arcs.push({ x: 480, y: 320, r: 100, from: 90, to: 10, w: 24 });
        check('a curve that runs backwards is caught', runChecks(bad9).some(function (c) {
            return c.level === 'fail' && /sweeps forwards/.test(c.label);
        }));

        var bad10 = normalize(GOLF.COURSE[0]);
        bad10.blocks.push({ look: 'bed', pts: [bad10.tee.x - 60, bad10.tee.y - 60, bad10.tee.x + 60, bad10.tee.y - 60,
            bad10.tee.x + 60, bad10.tee.y + 60, bad10.tee.x - 60, bad10.tee.y + 60], w: 20 });
        check('a block round the tee is caught', runChecks(bad10).some(function (c) {
            return c.level === 'fail' && /does not start/.test(c.label);
        }));

        var bad11 = normalize(GOLF.COURSE[0]);
        bad11.hills.push({ x: 60, y: 60, r: 90, a: 140 });
        check('a hill that reaches the cushion is caught', runChecks(bad11).some(function (c) {
            return c.level === 'fail' && /cushion/.test(c.label);
        }));

        var withAll = normalize({ name: 'All', blurb: 'b', par: 3, theme: 'meadow', tee: { x: 120, y: 320 }, hole: { x: 840, y: 320 },
            arcs: [{ x: 480, y: 320, r: 160, from: 200, to: 340, w: 24 }],
            blocks: [{ look: 'windmill', pts: [440, 500, 520, 500, 520, 580, 440, 580], w: 22 }],
            hills: [{ x: 480, y: 330, r: 90, a: -60 }],
            slopes: [{ x: 600, y: 60, w: 200, h: 80, ax: -120, ay: 0, wind: true }],
            spinners: [{ x: 700, y: 400, r: 80, arms: 3, speed: -1.2, phase: Math.PI / 2, w: 22 }],
            belts: [{ x: 300, y: 40, w: 220, h: 60, dir: 'left', speed: 150 }],
            turntables: [{ x: 200, y: 470, r: 90, speed: -1.5 }] });
        check('curves, blocks, hills, spinners, belts, a turntable, a wind and a biome survive the round trip',
            JSON.stringify(parseHole(buildOut(withAll))) === JSON.stringify(withAll));

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
