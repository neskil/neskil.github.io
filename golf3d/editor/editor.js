/* The 3D hole editor.

   It runs on the game's own modules — config.js for the constants, courses.js
   for the authoring helpers and `build`, physics.js for the solver, render.js
   for the picture — and owns no copy of any of them. That is the whole design:
   a hole that looks right in here looks right in play because the same
   renderer drew it, and a hole that plays right in here plays right in the
   game because the same integrator moved the ball.

   Two pictures of one hole, side by side. The left is a plan you draw on,
   because rectangles on the floor is what a hole in this game *is* — pads,
   walls, water, gaps — and dragging them about in perspective would be a
   worse way to say the same thing. The right is `render.buildHole` on the
   result, rebuilt as you draw, because the plan cannot tell you how a ramp
   reads from the tee and the renderer can.

   What the editor deliberately does not draw is the rails. `enclose()` fences
   the edge of the ground and the editor shows you what it produced, greyed;
   the way to move a rail is to move the ground under it, or to cut a `gap`.
   An editor that let you push a generated rail about would be an editor that
   lies about how the file works.

   The checks in the Check panel are the rules from tests.html, ported one for
   one, and the bot is the same greedy player. A hole that passes here is a
   hole the suite will accept, which is the point: finding out at the editor
   rather than at the test run.

   ES5-flavoured, like the rest of golf3d/. No build step, no dependencies. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var P = G3.physics;
    var A = G3.authoring;
    var R = G3.render;

    /* ── the vocabulary ─────────────────────────────────────────────────── */

    /* The four lists a hole is drawn from, in the order the plan paints them.
       Hit-testing walks it backwards, so a wall lying on a pad is the thing
       you grab. `gaps` are last because they are an annotation on the rails
       rather than a part of the hole, and you have to be able to pick one up
       off whatever it is sitting on. */
    var LISTS = [
        { key: 'pads',  label: 'Ground', color: '#4a9a52' },
        { key: 'water', label: 'Water',  color: '#1b6d9e' },
        { key: 'extra', label: 'Wall',   color: '#6d4a2e' },
        { key: 'gaps',  label: 'Gap',    color: '#b58bff' }
    ];
    var LIST_KEYS = LISTS.map(function (l) { return l.key; });

    // What each surface looks like from above. The 3D pane has the real
    // materials; these only have to be told apart at a glance.
    var PAD_COLOR = {
        green: '#4a9a52', fairway: '#3f7d43', rough: '#2b5a30',
        sand: '#c8b184', wood: '#8a6337', cup: '#4a9a52'
    };

    var MIN_SIDE = 0.24;       // the thinnest wall the substep cap can protect
    var HANDLE = 6;            // hit radius for a resize grip, in screen pixels
    var SAVE_KEY = 'g3.editor.v1';
    var PLAYTEST_KEY = 'g3.playtest.v1';

    /* ── DOM ────────────────────────────────────────────────────────────── */

    function $(id) { return document.getElementById(id); }

    var stage = $('stage');
    var planCanvas = $('plan');
    var ctx = planCanvas.getContext('2d');
    var viewCanvas = $('view');

    /* ── state ──────────────────────────────────────────────────────────── */

    /* S is the whole editable document and nothing else, because undo is a
       JSON round-trip of it. Anything that must survive an undo lives here;
       anything that must not (the view, the pointer, the play session, the
       built hole) lives outside it. */
    var S = {
        hole: null,
        sel: null,        // {key, idx} | {key:'tee'} | {key:'cup'} | null
        tool: 'select',
        padKind: 'green',
        snap: 0.5,
        grid: false,
        loadedFrom: ''
    };

    var view = { x: 0, z: 0, scale: 40 };   // world → plan pixels
    var mouse = { wx: 0, wz: 0, sx: 0, sy: 0 };
    var drag = null;        // {type:'move'|'resize'|'draw'|'pan'|'marker', …}
    var mode = 'edit';      // 'edit' | 'play'
    var animate = true;     // does the clock run in edit mode
    var spaceHeld = false;
    var dpr = 1;

    /* The built hole: `build()` on a deep copy of S.hole. It is derived, never
       edited — every change to the document throws it away and makes another,
       because `build` mutates what it is handed (relief, rails, bounds) and a
       hole built twice from its own output is a hole that has drifted. */
    var built = null;
    var buildError = null;
    var world = null;       // the physics world the preview and play mode share
    var aim = { show: true, yaw: 0, power: 0, loft: 0, over: 0 };
    var club = C.CLUBS[1] || C.CLUBS[0];
    var play = null;        // {strokes, phase} while mode === 'play'
    var gl = false;         // did the 3D pane get a context
    var needsRebuild = false;
    var last = 0;

    /* ── the hole model ─────────────────────────────────────────────────── */

    function blankHole() {
        return {
            name: 'New Hole',
            blurb: 'Say what makes it worth playing.',
            par: 3,
            theme: 'seaside',
            weather: 'fair',
            needsLoft: false,
            flat: false,
            pads: [{ x: 0, z: 0, w: 6, d: 14, y: 0, kind: 'green', sx: 0, sz: 0 }],
            extra: [],
            water: [],
            gaps: [],
            tee: { x: 3, z: 1.5 },
            cup: { x: 3, z: 12 }
        };
    }

    function num(v, dflt) { return typeof v === 'number' && isFinite(v) ? v : dflt; }

    /* The same normaliser `build` would want, for the same reason courses.js
       has one: every consumer downstream gets to loop without a guard. */
    function normalize(h) {
        h = h || {};
        var out = {
            name: typeof h.name === 'string' ? h.name : 'New Hole',
            blurb: typeof h.blurb === 'string' ? h.blurb : '',
            par: Math.max(2, Math.min(6, Math.round(num(h.par, 3)))),
            theme: G3.THEMES[h.theme] ? h.theme : 'seaside',
            weather: (G3.weather && G3.weather.KINDS[h.weather]) ? h.weather : 'fair',
            needsLoft: !!h.needsLoft,
            flat: !!h.flat,
            /* An open hole — Whinstone's country, authored by `moor` rather
               than by a list of pads — has no rails and a fence instead. The
               editor cannot *write* one, and it can carry one: the two fields
               ride along untouched so a links hole loaded in here still builds,
               plays and previews as the open hole it is, rather than being
               quietly fenced in. The export says so rather than pretending. */
            open: !!h.open,
            fence: h.fence || null,
            tee: { x: num(h.tee && h.tee.x, 3), z: num(h.tee && h.tee.z, 1.5) },
            cup: { x: num(h.cup && h.cup.x, 3), z: num(h.cup && h.cup.z, 12) }
        };
        LIST_KEYS.forEach(function (k) {
            out[k] = (Array.isArray(h[k]) ? h[k] : []).map(function (s) { return cloneShape(k, s); });
        });
        return out;
    }

    function cloneShape(key, s) {
        var o = {
            x: num(s.x, 0), z: num(s.z, 0),
            w: Math.max(MIN_SIDE, num(s.w, 1)), d: Math.max(MIN_SIDE, num(s.d, 1))
        };
        if (key === 'pads') {
            o.y = num(s.y, 0);
            o.kind = PAD_COLOR[s.kind] ? s.kind : 'green';
            o.sx = num(s.sx, 0);
            o.sz = num(s.sz, 0);
            /* A round pad — `circle()` in the file — is a square pad carrying a
               radius, and it is the one kind allowed to overlap the ground it
               is laid into. Both facts have to survive the round trip, or a
               green laid on a fairway comes back as a square arguing with it. */
            if (s.r) { o.r = num(s.r, 0.5); o.inlay = true; squareUp(o); }
            else if (s.inlay) o.inlay = true;
        }
        if (key === 'water') o.y = num(s.y, -0.6);
        if (key === 'extra') {
            o.h = num(s.h, 0.6);
            o.base = num(s.base, -0.4);
            o.yaw = num(s.yaw, 0);
            o.spin = num(s.spin, 0);
            o.kind = typeof s.kind === 'string' ? s.kind : 'rail';
            if (s.move) {
                o.move = {
                    axis: s.move.axis === 'z' ? 'z' : 'x',
                    amp: num(s.move.amp, 1.5),
                    speed: num(s.move.speed, 1.1),
                    phase: num(s.move.phase, 0)
                };
            }
        }
        return o;
    }

    /* A disc's rectangle is its bounding box, so the two have to agree after
       anything that moves or resizes it — and so does its edge, which is not
       quite a circle (courses.shapeDisc). Re-cutting it here rather than
       drawing a circle and hoping is what makes the plan, the preview and the
       exported `circle()` call agree about where the green stops. */
    function squareUp(p) {
        if (!p.r) return;
        var cx = p.x + p.w / 2, cz = p.z + p.d / 2;
        p.r = Math.max(MIN_SIDE, Math.min(p.w, p.d) / 2);
        p.w = p.d = p.r * 2;
        p.x = cx - p.r; p.z = cz - p.r;
        A.shapeDisc(p);
    }

    function list(key) { return S.hole[key]; }

    function selShape() {
        if (!S.sel || S.sel.key === 'tee' || S.sel.key === 'cup') return null;
        return list(S.sel.key)[S.sel.idx] || null;
    }

    /* The hole the game would see. `build` mutates its argument — it scoops
       and contours the pads, derives the rails, measures the bounds — so it
       is only ever handed a throwaway copy of the document. */
    function rebuild() {
        var src = JSON.parse(JSON.stringify(S.hole));
        var h = {
            name: src.name, blurb: src.blurb, par: src.par,
            needsLoft: src.needsLoft, flat: src.flat,
            open: src.open, fence: src.fence,
            pads: src.pads, extra: src.extra, water: src.water, gaps: src.gaps,
            tee: { x: src.tee.x, z: src.tee.z },
            cup: { x: src.cup.x, z: src.cup.z }
        };
        buildError = null;
        try {
            built = A.build(h);
        } catch (e) {
            buildError = e && e.message ? e.message : String(e);
            built = null;
        }
        return built;
    }

    /* ── history ────────────────────────────────────────────────────────── */

    var past = [], future = [];

    function snapshot() { return JSON.stringify(S.hole); }

    function pushHistory() {
        past.push(snapshot());
        if (past.length > 120) past.shift();
        future.length = 0;
        syncHistoryButtons();
    }

    function restore(json) {
        S.hole = normalize(JSON.parse(json));
        S.sel = null;
        changed(true);
    }

    function undo() {
        if (!past.length) return;
        future.push(snapshot());
        restore(past.pop());
        toast('Undo');
    }

    function redo() {
        if (!future.length) return;
        past.push(snapshot());
        restore(future.pop());
        toast('Redo');
    }

    function syncHistoryButtons() {
        $('btn-undo').disabled = !past.length;
        $('btn-redo').disabled = !future.length;
    }

    /* Every edit funnels through here: rebuild the hole, repaint the plan,
       refresh the sidebar, save. `hard` also tears down the 3D pane's scene,
       which is everything except a drag in progress. */
    function changed(hard) {
        rebuild();
        if (hard !== false) needsRebuild = true;
        syncSidebar();
        savePlan();
        draw();
    }

    /* ── the view ───────────────────────────────────────────────────────── */

    function sx(x) { return (x - view.x) * view.scale; }
    function sz(z) { return (z - view.z) * view.scale; }
    function wx(px) { return px / view.scale + view.x; }
    function wz(py) { return py / view.scale + view.z; }

    function fit() {
        var b = bounds();
        var w = planCanvas.clientWidth, h = planCanvas.clientHeight;
        var m = 40;
        var s = Math.min((w - m * 2) / Math.max(0.5, b.maxX - b.minX),
                         (h - m * 2) / Math.max(0.5, b.maxZ - b.minZ));
        view.scale = Math.max(6, Math.min(160, s));
        view.x = (b.minX + b.maxX) / 2 - w / 2 / view.scale;
        view.z = (b.minZ + b.maxZ) / 2 - h / 2 / view.scale;
        draw();
    }

    function bounds() {
        var b = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
        var any = false;
        LIST_KEYS.forEach(function (k) {
            list(k).forEach(function (s) {
                any = true;
                b.minX = Math.min(b.minX, s.x); b.maxX = Math.max(b.maxX, s.x + s.w);
                b.minZ = Math.min(b.minZ, s.z); b.maxZ = Math.max(b.maxZ, s.z + s.d);
            });
        });
        if (!any) return { minX: -2, maxX: 10, minZ: -2, maxZ: 16 };
        return b;
    }

    function zoomBy(f, ax, ay) {
        var bx = wx(ax), bz = wz(ay);
        view.scale = Math.max(6, Math.min(220, view.scale * f));
        view.x = bx - ax / view.scale;
        view.z = bz - ay / view.scale;
        draw();
    }

    /* ── the plan ───────────────────────────────────────────────────────── */

    function resizePlan() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = planCanvas.clientWidth, h = planCanvas.clientHeight;
        planCanvas.width = Math.max(1, Math.round(w * dpr));
        planCanvas.height = Math.max(1, Math.round(h * dpr));
        draw();
    }

    function rectPath(s) {
        ctx.beginPath();
        ctx.rect(sx(s.x), sz(s.z), s.w * view.scale, s.d * view.scale);
    }

    /* Pads are rectangles unless they carry a radius, in which case they are
       the disc `circle()` made and have to read as one — waved edge and all,
       walked off the same physics.padRadius the ball rolls off, so the plan
       cannot promise a shape the hole does not have. */
    function padPath(p) {
        if (!p.r) { rectPath(p); return; }
        var cx = sx(p.x + p.w / 2), cz = sz(p.z + p.d / 2);
        var n = Math.max(32, Math.round(p.r * view.scale)), i, a, rr;
        ctx.beginPath();
        for (i = 0; i <= n; i++) {
            a = i / n * Math.PI * 2;
            rr = P.padRadius(p, a) * view.scale;
            ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cz + Math.sin(a) * rr);
        }
        ctx.closePath();
    }

    function drawGrid() {
        var step = S.snap >= 1 ? 1 : (view.scale > 60 ? 0.5 : 1);
        while (step * view.scale < 14) step *= 2;
        var w = planCanvas.clientWidth, h = planCanvas.clientHeight;
        ctx.lineWidth = 1;
        var x0 = Math.floor(view.x / step) * step, x, z;
        for (x = x0; sx(x) < w; x += step) {
            ctx.strokeStyle = Math.abs(x) < 1e-6 ? '#3f4b57' : '#1b2129';
            ctx.beginPath(); ctx.moveTo(sx(x), 0); ctx.lineTo(sx(x), h); ctx.stroke();
        }
        var z0 = Math.floor(view.z / step) * step;
        for (z = z0; sz(z) < h; z += step) {
            ctx.strokeStyle = Math.abs(z) < 1e-6 ? '#3f4b57' : '#1b2129';
            ctx.beginPath(); ctx.moveTo(0, sz(z)); ctx.lineTo(w, sz(z)); ctx.stroke();
        }
    }

    // A wall, drawn where the solver says it is: `wallBox` is what turns the
    // yaw, the slide and the spin into a rectangle in the world, so a gate
    // half way through its stroke is drawn half way through its stroke.
    function drawWallBox(wl, t, fill, stroke, dash) {
        var B = P.wallBox(wl, t);
        ctx.save();
        ctx.translate(sx(B.cx), sz(B.cz));
        ctx.rotate(-B.yaw);
        var w = wl.w * view.scale, d = wl.d * view.scale;
        ctx.beginPath();
        ctx.rect(-w / 2, -d / 2, w, d);
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1.5;
            if (dash) ctx.setLineDash(dash);
            ctx.stroke();
        }
        ctx.restore();
    }

    function draw() {
        var w = planCanvas.clientWidth, h = planCanvas.clientHeight;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0f14';
        ctx.fillRect(0, 0, w, h);
        if (S.grid) drawGrid();

        var t = world ? world.time : 0;

        // Water sits under everything the ball can stand on, so it is painted
        // first and its outline again afterwards: a bridge over a pond has to
        // read as a bridge, and the shoreline has to stay visible under it.
        list('water').forEach(function (q) {
            ctx.fillStyle = 'rgba(27,109,158,.75)';
            rectPath(q); ctx.fill();
        });

        // The ground. A pad that is tilted or raised says so on its face,
        // because height is the one thing a plan cannot show.
        list('pads').forEach(function (p) {
            ctx.fillStyle = PAD_COLOR[p.kind] || PAD_COLOR.green;
            ctx.globalAlpha = 0.85;
            padPath(p); ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(0,0,0,.45)';
            ctx.lineWidth = 1;
            padPath(p); ctx.stroke();
            if ((p.sx || p.sz) && p.w * view.scale > 26) drawSlopeArrow(p);
            if (p.y && p.w * view.scale > 34 && p.d * view.scale > 18) {
                ctx.fillStyle = 'rgba(255,255,255,.55)';
                ctx.font = '10px monospace';
                ctx.fillText('y ' + p.y.toFixed(2), sx(p.x) + 4, sz(p.z) + 12);
            }
        });

        list('water').forEach(function (q) {
            ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 1;
            rectPath(q); ctx.stroke();
        });

        // The generated rails, greyed and unselectable: this is `enclose`
        // showing its work, not part of the document.
        if (built) {
            var authored = list('extra').length;
            built.walls.forEach(function (wl, i) {
                if (i >= built.walls.length - authored) return;
                drawWallBox(wl, t, 'rgba(120,132,145,.35)', 'rgba(160,175,190,.55)');
            });
        }

        // The walls you wrote. A mover also draws the box it swings through,
        // dashed, because the whole question about a gate is what it does at
        // the other end of the stroke.
        list('extra').forEach(function (wl, i) {
            var selected = S.sel && S.sel.key === 'extra' && S.sel.idx === i;
            if (wl.move || wl.spin) {
                drawWallBox(wl, t + 1.4, null, 'rgba(210,153,34,.5)', [4, 3]);
                drawWallBox(wl, t + 2.8, null, 'rgba(210,153,34,.35)', [4, 3]);
            }
            drawWallBox(wl, t, '#6d4a2e', selected ? '#58a6ff' : 'rgba(0,0,0,.6)');
        });

        // Gaps: the rectangles that tell `enclose` to leave the edge open.
        list('gaps').forEach(function (g) {
            ctx.save();
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = '#b58bff'; ctx.lineWidth = 1.5;
            rectPath(g); ctx.stroke();
            ctx.restore();
            ctx.fillStyle = 'rgba(181,139,255,.10)';
            rectPath(g); ctx.fill();
        });

        drawMarker(S.hole.tee.x, S.hole.tee.z, '#e6edf3', 'T');
        drawMarker(S.hole.cup.x, S.hole.cup.z, '#f2c744', 'H');

        // The ball, wherever the shared world has left it.
        if (world) {
            ctx.beginPath();
            ctx.arc(sx(world.ball.x), sz(world.ball.z), Math.max(2.5, C.BALL_R * view.scale), 0, 7);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }

        drawSelection();
        syncStatus();
    }

    function drawSlopeArrow(p) {
        var cx = sx(p.x + p.w / 2), cz = sz(p.z + p.d / 2);
        var g = Math.hypot(p.sx, p.sz);
        if (!g) return;
        // Downhill, which is the direction a ball left on it would go.
        var ux = -p.sx / g, uz = -p.sz / g;
        var len = Math.min(p.w, p.d) * view.scale * 0.32;
        ctx.strokeStyle = 'rgba(255,255,255,.7)';
        ctx.fillStyle = 'rgba(255,255,255,.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - ux * len, cz - uz * len);
        ctx.lineTo(cx + ux * len, cz + uz * len);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + ux * len, cz + uz * len);
        ctx.lineTo(cx + ux * len * 0.6 - uz * len * 0.25, cz + uz * len * 0.6 + ux * len * 0.25);
        ctx.lineTo(cx + ux * len * 0.6 + uz * len * 0.25, cz + uz * len * 0.6 - ux * len * 0.25);
        ctx.fill();
    }

    function drawMarker(x, z, color, letter) {
        var px = sx(x), pz = sz(z);
        ctx.beginPath();
        ctx.arc(px, pz, 7, 0, 7);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.fillStyle = '#0d1117';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(letter, px, pz + 0.5);
        ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    }

    function drawSelection() {
        if (!S.sel) return;
        if (S.sel.key === 'tee' || S.sel.key === 'cup') {
            var m = S.hole[S.sel.key];
            ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(sx(m.x), sz(m.z), 11, 0, 7); ctx.stroke();
            return;
        }
        var s = selShape();
        if (!s) return;
        ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 2;
        rectPath(s); ctx.stroke();
        // Corner grips, which is where a resize starts.
        corners(s).forEach(function (c) {
            ctx.fillStyle = '#58a6ff';
            ctx.fillRect(c.px - 3, c.pz - 3, 6, 6);
        });
    }

    function corners(s) {
        return [
            { hx: -1, hz: -1, px: sx(s.x), pz: sz(s.z) },
            { hx: 1, hz: -1, px: sx(s.x + s.w), pz: sz(s.z) },
            { hx: -1, hz: 1, px: sx(s.x), pz: sz(s.z + s.d) },
            { hx: 1, hz: 1, px: sx(s.x + s.w), pz: sz(s.z + s.d) }
        ];
    }

    /* ── hit-testing ────────────────────────────────────────────────────── */

    function markerAt(px, pz) {
        var names = ['cup', 'tee'], i, m;
        for (i = 0; i < names.length; i++) {
            m = S.hole[names[i]];
            if (Math.hypot(px - sx(m.x), pz - sz(m.z)) <= 10) return names[i];
        }
        return null;
    }

    function shapeAt(px, pz) {
        var x = wx(px), z = wz(pz), i, k, arr, s;
        for (k = LISTS.length - 1; k >= 0; k--) {
            arr = list(LISTS[k].key);
            for (i = arr.length - 1; i >= 0; i--) {
                s = arr[i];
                if (x >= s.x && x <= s.x + s.w && z >= s.z && z <= s.z + s.d) {
                    return { key: LISTS[k].key, idx: i };
                }
            }
        }
        return null;
    }

    function gripAt(px, pz) {
        var s = selShape();
        if (!s) return null;
        var found = null;
        corners(s).forEach(function (c) {
            if (Math.abs(px - c.px) <= HANDLE && Math.abs(pz - c.pz) <= HANDLE) found = c;
        });
        return found;
    }

    /* ── pointer ────────────────────────────────────────────────────────── */

    function snapped(v, e) {
        if (e && e.altKey) return v;
        var step = S.snap * (e && e.shiftKey ? 4 : 1);
        return Math.round(v / step) * step;
    }

    function planPoint(e) {
        var r = planCanvas.getBoundingClientRect();
        return { px: e.clientX - r.left, pz: e.clientY - r.top };
    }

    function onPlanDown(e) {
        planCanvas.setPointerCapture(e.pointerId);
        var p = planPoint(e);
        mouse.sx = p.px; mouse.sy = p.pz;

        if (e.button === 1 || spaceHeld) {
            drag = { type: 'pan', px: p.px, pz: p.pz, vx: view.x, vz: view.z };
            return;
        }
        if (mode === 'play') return;

        if (S.tool === 'tee' || S.tool === 'cup') {
            pushHistory();
            S.hole[S.tool].x = snapped(wx(p.px), e);
            S.hole[S.tool].z = snapped(wz(p.pz), e);
            S.sel = { key: S.tool };
            setTool('select');
            changed();
            return;
        }

        var mk = markerAt(p.px, p.pz);
        if (mk && S.tool === 'select') {
            pushHistory();
            S.sel = { key: mk };
            drag = { type: 'marker', which: mk };
            changed();
            return;
        }

        var grip = gripAt(p.px, p.pz);
        if (grip && S.tool === 'select') {
            pushHistory();
            var s0 = selShape();
            drag = {
                type: 'resize', hx: grip.hx, hz: grip.hz,
                x0: s0.x, z0: s0.z, w0: s0.w, d0: s0.d
            };
            return;
        }

        if (S.tool === 'select') {
            var hit = shapeAt(p.px, p.pz);
            S.sel = hit;
            if (hit) {
                pushHistory();
                var s = selShape();
                drag = { type: 'move', ox: wx(p.px) - s.x, oz: wz(p.pz) - s.z };
            }
            changed();
            return;
        }

        // A tool with a rectangle behind it: drag one out.
        pushHistory();
        var nx = snapped(wx(p.px), e), nz = snapped(wz(p.pz), e);
        var shape = cloneShape(S.tool, defaultsFor(S.tool, nx, nz));
        list(S.tool).push(shape);
        S.sel = { key: S.tool, idx: list(S.tool).length - 1 };
        drag = { type: 'draw', ax: nx, az: nz };
        changed();
    }

    function defaultsFor(key, x, z) {
        var o = { x: x, z: z, w: MIN_SIDE, d: MIN_SIDE };
        if (key === 'pads') { o.kind = S.padKind; o.y = 0; }
        if (key === 'water') o.y = -0.6;
        if (key === 'extra') { o.h = 0.6; o.base = -0.1; }
        return o;
    }

    function onPlanMove(e) {
        var p = planPoint(e);
        mouse.sx = p.px; mouse.sy = p.pz;
        mouse.wx = wx(p.px); mouse.wz = wz(p.pz);

        if (!drag) {
            planCanvas.style.cursor = spaceHeld ? 'grab'
                : (S.tool !== 'select' ? 'crosshair'
                : (gripAt(p.px, p.pz) ? 'nwse-resize'
                : (markerAt(p.px, p.pz) || shapeAt(p.px, p.pz) ? 'move' : 'default')));
            syncStatus();
            return;
        }

        if (drag.type === 'pan') {
            view.x = drag.vx - (p.px - drag.px) / view.scale;
            view.z = drag.vz - (p.pz - drag.pz) / view.scale;
            draw();
            return;
        }
        if (drag.type === 'marker') {
            var m = S.hole[drag.which];
            m.x = snapped(wx(p.px), e);
            m.z = snapped(wz(p.pz), e);
            changed(false);
            return;
        }
        var s = selShape();
        if (!s) return;

        if (drag.type === 'move') {
            s.x = snapped(wx(p.px) - drag.ox, e);
            s.z = snapped(wz(p.pz) - drag.oz, e);
        } else if (drag.type === 'draw') {
            var bx = snapped(wx(p.px), e), bz = snapped(wz(p.pz), e);
            s.x = Math.min(drag.ax, bx); s.z = Math.min(drag.az, bz);
            s.w = Math.max(MIN_SIDE, Math.abs(bx - drag.ax));
            s.d = Math.max(MIN_SIDE, Math.abs(bz - drag.az));
        } else if (drag.type === 'resize') {
            var gx = snapped(wx(p.px), e), gz = snapped(wz(p.pz), e);
            if (drag.hx < 0) { var rx = drag.x0 + drag.w0; s.x = Math.min(gx, rx - MIN_SIDE); s.w = rx - s.x; }
            else { s.w = Math.max(MIN_SIDE, gx - drag.x0); s.x = drag.x0; }
            if (drag.hz < 0) { var rz = drag.z0 + drag.d0; s.z = Math.min(gz, rz - MIN_SIDE); s.d = rz - s.z; }
            else { s.d = Math.max(MIN_SIDE, gz - drag.z0); s.z = drag.z0; }
        }
        if (S.sel.key === 'pads') squareUp(s);
        changed(false);
    }

    function onPlanUp() {
        if (drag && drag.type !== 'pan') {
            // A rectangle nobody actually dragged out is a misclick, not a
            // shape. Undo it rather than leaving a speck on the hole.
            var s = selShape();
            if (drag.type === 'draw' && s && s.w <= MIN_SIDE && s.d <= MIN_SIDE) {
                list(S.sel.key).splice(S.sel.idx, 1);
                S.sel = null;
                past.pop();
            }
            needsRebuild = true;
            changed();
        }
        drag = null;
    }

    /* ── the sidebar ────────────────────────────────────────────────────── */

    function syncSidebar() {
        syncShapeList();
        syncInspector();
        syncCard();
        syncExport();
        syncHistoryButtons();
    }

    function syncCard() {
        $('f-name').value = S.hole.name;
        $('f-blurb').value = S.hole.blurb;
        $('f-par').value = S.hole.par;
        $('f-theme').value = S.hole.theme;
        $('f-weather').value = S.hole.weather;
        $('f-needsloft').checked = S.hole.needsLoft;
        $('f-flat').checked = S.hole.flat;
        $('f-padkind').value = S.padKind;
    }

    function syncShapeList() {
        var host = $('shape-list');
        host.innerHTML = '';
        var total = 0;
        LISTS.forEach(function (L) {
            list(L.key).forEach(function (s, i) {
                total++;
                var row = document.createElement('div');
                row.className = 'sitem' + (S.sel && S.sel.key === L.key && S.sel.idx === i ? ' active' : '');
                var sw = document.createElement('i');
                sw.className = 'swatch';
                sw.style.background = L.key === 'pads' ? (PAD_COLOR[s.kind] || L.color) : L.color;
                var name = document.createElement('span');
                name.className = 'sname';
                name.textContent = (L.key === 'pads' ? s.kind : L.label) + ' ' +
                    (s.r ? '\u2300' + (s.r * 2).toFixed(2)
                         : s.w.toFixed(2) + '×' + s.d.toFixed(2));
                var meta = document.createElement('span');
                meta.className = 'smeta';
                meta.textContent = '@' + s.x.toFixed(1) + ',' + s.z.toFixed(1);
                var x = document.createElement('span');
                x.className = 'xbtn';
                x.textContent = '×';
                x.title = 'Delete';
                x.addEventListener('click', function (ev) {
                    ev.stopPropagation();
                    pushHistory();
                    list(L.key).splice(i, 1);
                    S.sel = null;
                    changed();
                });
                row.appendChild(sw); row.appendChild(name); row.appendChild(meta); row.appendChild(x);
                row.addEventListener('click', function () {
                    S.sel = { key: L.key, idx: i };
                    changed(false);
                });
                host.appendChild(row);
            });
        });
        if (!total) {
            var e = document.createElement('div');
            e.className = 'empty';
            e.textContent = 'Nothing drawn yet — pick a tool and drag on the plan.';
            host.appendChild(e);
        }
    }

    /* The inspector writes straight into the shape and rebuilds on each
       keystroke, which is what makes a slope something you can dial in while
       watching the 3D pane rather than something you guess and re-run. */
    function field(host, label, get, set, step) {
        var row = document.createElement('div');
        row.className = 'row';
        var lb = document.createElement('span');
        lb.className = 'lbl';
        lb.textContent = label;
        var input = document.createElement('input');
        input.type = 'number';
        input.step = step === undefined ? 0.05 : step;
        input.className = 'field';
        input.value = get();
        input.addEventListener('input', function () {
            var v = parseFloat(input.value);
            if (!isFinite(v)) return;
            set(v);
            changed();
        });
        input.addEventListener('focus', pushHistory);
        row.appendChild(lb); row.appendChild(input);
        host.appendChild(row);
        return input;
    }

    function pick(host, label, options, get, set) {
        var row = document.createElement('div');
        row.className = 'row';
        var lb = document.createElement('span');
        lb.className = 'lbl';
        lb.textContent = label;
        var sel = document.createElement('select');
        options.forEach(function (o) {
            var opt = document.createElement('option');
            opt.value = o; opt.textContent = o;
            sel.appendChild(opt);
        });
        sel.value = get();
        sel.addEventListener('change', function () {
            pushHistory();
            set(sel.value);
            changed();
        });
        row.appendChild(lb); row.appendChild(sel);
        host.appendChild(row);
    }

    function syncInspector() {
        var host = $('inspector');
        host.innerHTML = '';
        if (!S.sel) return;

        if (S.sel.key === 'tee' || S.sel.key === 'cup') {
            var m = S.hole[S.sel.key];
            head(host, S.sel.key === 'tee' ? 'Tee' : 'Cup');
            field(host, 'x', function () { return m.x; }, function (v) { m.x = v; });
            field(host, 'z', function () { return m.z; }, function (v) { m.z = v; });
            if (built) {
                var pad = S.sel.key === 'cup' ? ownPad(built.cup) : null;
                var lie = P.surfaceTop(built, m.x, m.z);
                if (pad) note(host, 'cut into the ' + pad.kind + ' at y ' + built.cup.y.toFixed(2));
                else note(host, lie ? 'sits at y ' + lie.y.toFixed(2) + ' on ' + (lie.pad.kind || 'green')
                                    : 'nothing under it — the ball would fall through');
            }
            return;
        }
        var s = selShape();
        if (!s) return;
        var L = LISTS.filter(function (l) { return l.key === S.sel.key; })[0];
        head(host, L.label);
        field(host, 'x', function () { return s.x; }, function (v) { s.x = v; });
        field(host, 'z', function () { return s.z; }, function (v) { s.z = v; });
        field(host, 'w', function () { return s.w; }, function (v) { s.w = Math.max(MIN_SIDE, v); });
        field(host, 'd', function () { return s.d; }, function (v) { s.d = Math.max(MIN_SIDE, v); });

        if (S.sel.key === 'pads') {
            pick(host, 'kind', ['green', 'fairway', 'rough', 'sand', 'wood'],
                function () { return s.kind; }, function (v) { s.kind = v; });
            field(host, 'y', function () { return s.y; }, function (v) { s.y = v; });
            head(host, 'Tilt');
            field(host, 'sx', function () { return s.sx; }, function (v) { s.sx = v; }, 0.05);
            field(host, 'sz', function () { return s.sz; }, function (v) { s.sz = v; }, 0.05);
            note(host, 'A tilt is rise per unit across the pad: 0.3 is a ramp, ' +
                 '0.12 is a green that breaks. Positive sx falls towards −x.');
        }
        if (S.sel.key === 'water') {
            field(host, 'y', function () { return s.y; }, function (v) { s.y = v; });
            note(host, 'The surface height. Leave no pad above it and the ball ' +
                 'falls in — and cut a gap over the shoreline, or the rail fences the pond.');
        }
        if (S.sel.key === 'extra') {
            field(host, 'h', function () { return s.h; }, function (v) { s.h = Math.max(0.05, v); });
            field(host, 'base', function () { return s.base; }, function (v) { s.base = v; });
            field(host, 'yaw', function () { return s.yaw; }, function (v) { s.yaw = v; }, 0.05);
            field(host, 'spin', function () { return s.spin; }, function (v) { s.spin = v; }, 0.1);
            head(host, 'Slide');
            var row = document.createElement('div');
            row.className = 'row';
            var lb = document.createElement('label');
            lb.className = 'lbl';
            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = !!s.move;
            cb.addEventListener('change', function () {
                pushHistory();
                s.move = cb.checked ? { axis: 'x', amp: 1.5, speed: 1.1, phase: 0 } : null;
                if (!cb.checked) delete s.move;
                changed();
                syncInspector();
            });
            lb.appendChild(cb);
            lb.appendChild(document.createTextNode(' slides on a sine'));
            row.appendChild(lb);
            host.appendChild(row);
            if (s.move) {
                pick(host, 'axis', ['x', 'z'], function () { return s.move.axis; },
                    function (v) { s.move.axis = v; });
                field(host, 'amp', function () { return s.move.amp; }, function (v) { s.move.amp = v; });
                field(host, 'speed', function () { return s.move.speed; }, function (v) { s.move.speed = v; }, 0.1);
                field(host, 'phase', function () { return s.move.phase; }, function (v) { s.move.phase = v; }, 0.1);
            }
            note(host, 'Anything that moves has to leave the ball a way past at ' +
                 'every phase of its stroke — the checks below prove it, and the bot will not finish a hole that can shut.');
        }
        if (S.sel.key === 'gaps') {
            note(host, 'No rail is built inside this rectangle. Grow it a little ' +
                 'past whatever it is opening — a shoreline wants about 0.45 of slack.');
        }
    }

    function head(host, text) {
        var d = document.createElement('div');
        d.className = 'subhead';
        d.textContent = text;
        host.appendChild(d);
    }

    function note(host, text) {
        var d = document.createElement('div');
        d.className = 'hint';
        d.style.marginTop = '6px';
        d.textContent = text;
        host.appendChild(d);
    }

    function syncStatus() {
        $('st-x').textContent = mouse.wx.toFixed(2);
        $('st-z').textContent = mouse.wz.toFixed(2);
        $('st-snap').textContent = S.snap;
        $('st-zoom').textContent = Math.round(view.scale / 40 * 100) + '%';
        $('st-sel').textContent = S.sel
            ? (S.sel.key === 'tee' || S.sel.key === 'cup' ? 'the ' + S.sel.key
               : S.sel.key + ' #' + (S.sel.idx + 1))
            : 'nothing selected';

        var hud = $('hud');
        if (mode === 'play' && play) {
            hud.className = 'play';
            hud.innerHTML = '<div class="big">' + play.strokes + ' stroke' +
                (play.strokes === 1 ? '' : 's') + '</div><div>par ' + S.hole.par + ' · ' +
                club.name + '</div>';
        } else {
            hud.className = '';
            var pars = built ? (built.bounds.maxX - built.bounds.minX).toFixed(1) + ' × ' +
                (built.bounds.maxZ - built.bounds.minZ).toFixed(1) : '—';
            hud.innerHTML = '<div class="big">' + S.hole.name + '</div><div>par ' +
                S.hole.par + ' · ' + pars + ' units' +
                (buildError ? ' · <span style="color:#f85149">' + buildError + '</span>' : '') +
                '</div>';
        }
    }

    function toast(msg, cls) {
        var el = $('toast');
        el.textContent = msg;
        el.className = 'show ' + (cls || '');
        clearTimeout(el._t);
        el._t = setTimeout(function () { el.className = cls || ''; }, 1800);
    }

    /* ── the 3D pane ────────────────────────────────────────────────────── */

    function initView() {
        if (!window.THREE) return false;
        try {
            R.init(viewCanvas);
        } catch (e) {
            return false;
        }
        gl = true;
        return true;
    }

    function resizeView() {
        if (!gl) return;
        var w = viewCanvas.clientWidth, h = viewCanvas.clientHeight;
        viewCanvas.width = Math.max(1, Math.round(w * dpr));
        viewCanvas.height = Math.max(1, Math.round(h * dpr));
        R.resize();
    }

    /* One rebuild of the scene, and a fresh world on the tee to go with it.
       Called from the frame loop rather than from the edit, so dragging a pad
       across the plan costs one scene rebuild per frame at worst instead of
       one per pointer event. */
    function rebuildView() {
        needsRebuild = false;
        if (!built) return;
        if (G3.weather) G3.weather.setOverride(S.hole.weather);
        var keep = world ? { x: world.ball.x, z: world.ball.z } : null;
        if (gl) {
            R.buildHole(built, S.hole.theme, G3.weather ? G3.weather.KINDS[S.hole.weather] : null);
        }
        var from = (mode === 'play' && keep && P.surfaceTop(built, keep.x, keep.z))
            ? keep : { x: built.tee.x, z: built.tee.z };
        world = P.createWorld(built, from, world ? world.time : 0);
        if (mode !== 'play') {
            aim.yaw = Math.atan2(built.cup.x - built.tee.x, built.cup.z - built.tee.z);
        }
        if (gl) R.setCam({ yaw: aim.yaw, dist: 9, pitch: 0.46, view: 0, mode: 'follow', lock: false });
    }

    function loop(now) {
        requestAnimationFrame(loop);
        var dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        if (needsRebuild && !drag) rebuildView();
        if (!world) return;

        if (mode === 'play' && play && play.phase === 'rolling') {
            P.advance(world, dt, {});
            if (P.done(world)) endShot();
            draw();
        } else if (animate || mode === 'play') {
            world.time += dt;
            // Only the plan's moving parts need repainting on the clock, and
            // only if the hole has any.
            if (list('extra').some(function (w) { return w.move || w.spin; })) draw();
        }

        if (!gl) return;
        aim.show = mode === 'play' && play && play.phase === 'aim';
        aim.loft = club.loft;
        aim.power = mode === 'play' && play ? play.power : 0;
        aim.over = P.overdraw(aim.power, club.power);
        R.cam.yaw = aim.yaw;
        R.frame(dt, world, aim);
    }

    /* ── play mode ──────────────────────────────────────────────────────── */

    function setMode(next) {
        if (mode === next) return;
        mode = next;
        $('mode-edit').classList.toggle('on', mode === 'edit');
        $('mode-play').classList.toggle('on', mode === 'play');
        $('play-bar').classList.toggle('show', mode === 'play');
        if (mode === 'play') {
            S.sel = null;
            play = { strokes: 0, phase: 'aim', power: club.power * 0.5 };
            $('play-power').value = 0.5;
            resetBall();
        } else {
            play = null;
            needsRebuild = true;
        }
        changed(false);
    }

    function resetBall() {
        if (!built) return;
        world = P.createWorld(built, { x: built.tee.x, z: built.tee.z }, world ? world.time : 0);
        aim.yaw = Math.atan2(built.cup.x - built.tee.x, built.cup.z - built.tee.z);
        if (play) { play.phase = 'aim'; play.strokes = 0; play.done = false; }
        if (gl) R.setCam({ yaw: aim.yaw, dist: 9, pitch: 0.46, view: 0, mode: 'follow', lock: false });
        $('play-msg').textContent = '';
        draw();
    }

    function hit() {
        if (mode !== 'play' || !play || play.phase !== 'aim') return;
        // A holed ball is the end of that round of the hole, not a lie to play
        // the next shot from: the next press puts it back on the tee.
        if (play.done) { resetBall(); return; }
        var power = Math.max(C.MIN_POWER, play.power);
        var shot = P.sprayShot(aim.yaw, power, P.overdraw(power, club.power));
        if (!P.launch(world, shot.yaw, shot.power, club.loft)) return;
        play.strokes++;
        play.phase = 'rolling';
        $('play-msg').textContent = '';
    }

    function endShot() {
        play.phase = 'aim';
        if (world.sunk) {
            play.done = true;
            $('play-msg').textContent = 'Holed in ' + play.strokes +
                ' (par ' + S.hole.par + ') — hit again to start over';
            toast('Holed in ' + play.strokes, 'good');
        } else if (world.splash) {
            $('play-msg').textContent = 'In the water — one stroke, replay it';
            play.strokes++;
            world = P.createWorld(built, { x: world.origin.x, z: world.origin.z, y: world.origin.y }, world.time);
        } else if (world.out) {
            $('play-msg').textContent = 'Out of play — one stroke, replay it';
            play.strokes++;
            world = P.createWorld(built, { x: world.origin.x, z: world.origin.z, y: world.origin.y }, world.time);
        } else {
            var d = Math.hypot(world.ball.x - built.cup.x, world.ball.z - built.cup.z);
            $('play-msg').textContent = d.toFixed(1) + ' units from the cup';
            aim.yaw = Math.atan2(built.cup.x - world.ball.x, built.cup.z - world.ball.z);
        }
        draw();
    }

    // Dragging the 3D pane turns the aim, which is the game's own gesture.
    var look = null;
    function onViewDown(e) {
        viewCanvas.setPointerCapture(e.pointerId);
        look = { x: e.clientX, y: e.clientY, yaw: aim.yaw, pitch: gl ? R.cam.pitch : 0 };
    }
    function onViewMove(e) {
        if (!look) return;
        aim.yaw = look.yaw - (e.clientX - look.x) * 0.008;
        if (gl) {
            R.cam.pitch = Math.max(0.08, Math.min(1.25, look.pitch + (e.clientY - look.y) * 0.004));
        }
    }
    function onViewUp() { look = null; }

    /* ── the checks ─────────────────────────────────────────────────────── */

    /* The rules from tests.html, ported one for one. Each returns
       {ok, warn, text, why}; the panel prints them in order. */

    function edgeDist(pad, x, z) {
        if (pad.r) {
            // Off the disc's own waved edge, not off the circle it is cut from.
            var dx = x - (pad.x + pad.w / 2), dz = z - (pad.z + pad.d / 2);
            return P.padRadius(pad, Math.atan2(dz, dx)) - Math.hypot(dx, dz);
        }
        return Math.min(x - pad.x, pad.x + pad.w - x, z - pad.z, pad.z + pad.d - z);
    }

    // The pad the cup was sunk into, which is not what `surfaceTop` answers at
    // the cup itself: there the surface is the bottom of the shaft.
    function ownPad(cup) {
        var own = null;
        if (!built) return null;
        built.pads.forEach(function (p) {
            if (P.padContains(p, cup.x, cup.z) &&
                Math.abs(P.padHeight(p, cup.x, cup.z) - cup.y) < 0.06) own = p;
        });
        return own;
    }

    // The widest stretch of open ground along a line at a moment in time —
    // what proves a gate cannot seal a hole shut. Straight out of tests.html.
    function widestGap(h, z, t) {
        var step = 0.05, best = 0, run = 0, x;
        var boxes = h.walls.map(function (wl) { return P.wallBox(wl, t); });
        for (x = h.bounds.minX; x <= h.bounds.maxX; x += step) {
            var floor = P.surfaceUnder(h, x, z, Infinity);
            var open = !!floor;
            if (open) {
                for (var i = 0; i < boxes.length && open; i++) {
                    var B = boxes[i];
                    if (floor.y + C.BALL_R <= B.base || floor.y >= B.top) continue;
                    if (P.circleBox(x, z, C.BALL_R, B)) open = false;
                }
            }
            if (open) { run += step; best = Math.max(best, run); } else { run = 0; }
        }
        return best;
    }

    function runChecks() {
        var out = [];
        function add(ok, text, why, warn) {
            out.push({ ok: ok, warn: warn && !ok, text: text, why: why || '' });
        }

        if (!built) {
            add(false, 'the hole builds', buildError || 'build() threw');
            return out;
        }
        add(true, 'the hole builds');

        // Tee and cup stand on something.
        var t = P.surfaceTop(built, built.tee.x, built.tee.z);
        var c = P.surfaceTop(built, built.cup.x, built.cup.z);
        add(!!t, 'the tee is on the ground', t ? '' : 'nothing under it');
        add(!!c, 'the cup is on the ground', c ? '' : 'nothing under it');

        /* The whole mouth of the cup has to be inside one pad, and on ground
           that rolls it has to be clear of the flat square the renderer cuts
           the cup out of as well. `surfaceTop` at the cup answers with the
           synthetic cup pad rather than the ground it was sunk into, so the
           owning pad is found the way tests.html finds it. */
        var own = ownPad(built.cup);
        if (own) {
            var clear = edgeDist(own, built.cup.x, built.cup.z);
            add(clear > C.HOLE_R + 0.05, 'the mouth of the cup is clear of the pad edge',
                'only ' + clear.toFixed(2) + ' to the edge');
            if (own.bumps && own.bumps.length) {
                add(clear > A.CUP_PATCH + 0.05, 'and clear of the flat patch it is cut into',
                    'only ' + clear.toFixed(2) + ' for a patch of ' + A.CUP_PATCH);
            }
        }

        // Neither end may be inside a wall — a cup buried in a rail cannot be
        // holed, and a tee inside one launches from a bounce.
        var teeBlocked = false, cupBlocked = false;
        built.walls.forEach(function (wl) {
            var B = P.wallBox(wl, 0);
            if (built.tee.y + C.BALL_R > B.base && built.tee.y < B.top &&
                P.circleBox(built.tee.x, built.tee.z, C.BALL_R, B)) teeBlocked = true;
            if (built.cup.y + C.BALL_R > B.base && built.cup.y < B.top &&
                P.circleBox(built.cup.x, built.cup.z, C.HOLE_R, B)) cupBlocked = true;
        });
        add(!teeBlocked, 'the tee is not inside a wall');
        add(!cupBlocked, 'the cup is not inside a wall');

        // Nothing thinner than the substep cap can protect.
        var minThick = Infinity, thinnest = null;
        built.walls.forEach(function (wl) {
            var m = Math.min(wl.w, wl.d);
            if (m < minThick) { minThick = m; thinnest = wl; }
        });
        if (thinnest) {
            add(minThick >= 0.24, 'no wall is thinner than 0.24',
                'thinnest is ' + minThick.toFixed(3) + ' at ' +
                thinnest.x.toFixed(1) + ',' + thinnest.z.toFixed(1));
        }

        // A gate or a blade always leaves a way past.
        var movers = built.walls.filter(function (wl) { return wl.move || wl.spin; });
        if (movers.length) {
            var worst = Infinity, at = 0;
            movers.forEach(function (wl) {
                var z = wl.z + wl.d / 2;
                for (var k = 0; k < 32; k++) {
                    var g = widestGap(built, z, k * 0.25);
                    if (g < worst) { worst = g; at = k * 0.25; }
                }
            });
            add(worst > C.BALL_R * 2 + 0.05, 'the moving parts always leave a way past',
                'narrowest is ' + worst.toFixed(2) + ' at t=' + at.toFixed(2) +
                ', and the ball is ' + (C.BALL_R * 2).toFixed(2) + ' across');
        }

        // Pads that overlap at the same height are two floors arguing.
        var pads = built.pads, clash = null;
        for (var i = 0; i < pads.length && !clash; i++) {
            for (var j = i + 1; j < pads.length; j++) {
                var a = pads[i], b = pads[j];
                if (a.x + a.w <= b.x + 1e-6 || b.x + b.w <= a.x + 1e-6) continue;
                if (a.z + a.d <= b.z + 1e-6 || b.z + b.d <= a.z + 1e-6) continue;
                if (a.inlay || b.inlay) continue;   // an inlay is laid *into* the ground below it
                if (Math.abs((a.y || 0) - (b.y || 0)) < 0.3) { clash = [i, j]; break; }
            }
        }
        add(!clash, 'no two pads overlap at the same height',
            clash ? 'pads #' + (clash[0] + 1) + ' and #' + (clash[1] + 1) : '', true);

        /* Water with ground over all of it is water the ball never reaches.
           Over *some* of it is a bridge, which is a hole rather than a
           mistake, so the whole rectangle is sampled and only a pond that is
           covered end to end is worth mentioning. */
        var covered = null;
        built.water.forEach(function (q, qi) {
            if (covered !== null) return;
            var open = false;
            for (var a = 0.1; a < 1 && !open; a += 0.2) {
                for (var e = 0.1; e < 1; e += 0.2) {
                    var s = P.surfaceUnder(built, q.x + q.w * a, q.z + q.d * e, Infinity);
                    if (!s || s.y <= q.y) { open = true; break; }
                }
            }
            if (!open) covered = qi;
        });
        add(covered === null, 'the water is reachable',
            covered === null ? '' : 'water #' + (covered + 1) + ' has ground over it', true);

        // The cup is not in the water, and neither is the tee.
        if (c) {
            add(!P.waterAt(built, built.cup.x, built.cup.z), 'the cup is dry');
        }

        // Par is in the range the scorecard draws.
        add(S.hole.par >= 2 && S.hole.par <= 6, 'par is between 2 and 6');

        // And a hole nobody can see the end of is a hole nobody plays twice.
        var span = Math.hypot(built.cup.x - built.tee.x, built.cup.z - built.tee.z);
        add(span > 2, 'the cup is a shot away from the tee',
            'only ' + span.toFixed(1) + ' units', true);

        return out;
    }

    function renderReport(rows, summary, cls) {
        var host = $('report');
        host.innerHTML = '';
        rows.forEach(function (r) {
            var d = document.createElement('div');
            d.className = 'check ' + (r.ok ? 'pass' : (r.warn ? 'warn' : 'fail'));
            var m = document.createElement('span');
            m.className = 'mark';
            m.textContent = r.ok ? '✓' : (r.warn ? '!' : '✗');
            var txt = document.createElement('span');
            txt.textContent = r.text;
            if (!r.ok && r.why) {
                var why = document.createElement('span');
                why.className = 'why';
                why.textContent = ' — ' + r.why;
                txt.appendChild(why);
            }
            d.appendChild(m); d.appendChild(txt);
            host.appendChild(d);
        });
        var el = $('report-summary');
        el.textContent = summary;
        el.className = cls;
    }

    function check() {
        var rows = runChecks();
        var bad = rows.filter(function (r) { return !r.ok && !r.warn; }).length;
        var warn = rows.filter(function (r) { return r.warn; }).length;
        renderReport(rows,
            bad ? '✗ ' + bad + ' failed' + (warn ? ', ' + warn + ' to look at' : '')
                : (warn ? '! ' + warn + ' to look at, nothing failed' : '✓ all ' + rows.length + ' passed'),
            bad ? 'bad' : (warn ? 'busy' : 'ok'));
        return rows;
    }

    /* ── the bot ────────────────────────────────────────────────────────── */

    /* The greedy player from tests.html, unchanged in substance: fan out
       candidate shots, keep the one that finishes nearest the cup, refine
       twice, repeat. It plays out of the bag the player gets, so a hole it
       cannot finish is a hole that cannot be finished with the clubs that
       exist. It runs a stroke at a time on a timer, because a hole takes a
       second or two of solid simulation and a frozen editor looks broken. */
    var BOT_DT = 1 / 60, BOT_SECONDS = 12, BLOCKED = 4;

    function d2(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }

    function trial(h, from, yaw, power, loft, time) {
        var w = P.createWorld(h, from, time);
        if (!P.launch(w, yaw, power, loft)) return null;
        P.settle(w, BOT_SECONDS, BOT_DT);
        return w;
    }

    function blockedLie(h, ball, cup, time) {
        var dx = cup.x - ball.x, dz = cup.z - ball.z;
        var len = Math.hypot(dx, dz);
        if (len < 1e-6) return false;
        var px = ball.x + dx / len * (C.BALL_R + 0.2);
        var pz = ball.z + dz / len * (C.BALL_R + 0.2);
        for (var i = 0; i < h.walls.length; i++) {
            var B = P.wallBox(h.walls[i], time);
            if (ball.y - C.BALL_R >= B.top || ball.y + C.BALL_R <= B.base) continue;
            if (P.circleBox(px, pz, C.BALL_R, B)) return true;
        }
        return false;
    }

    function bestShot(h, from, time, bag) {
        var cup = h.cup;
        var base = Math.atan2(cup.x - from.x, cup.z - from.z);
        var moves = h.walls.some(function (wl) { return wl.move || wl.spin; });
        var waits = moves ? [0, 0.45, 0.95, 1.5] : [0];
        var here = d2(from, cup);
        var best = null;
        bag = bag || C.CLUBS;

        function consider(yaw, cl, power, wait) {
            var w = trial(h, from, yaw, power, cl.loft, time + wait);
            if (!w) return;
            var moved = Math.hypot(w.ball.x - from.x, w.ball.z - from.z);
            var s;
            if (w.sunk) s = -1000;
            else if (w.splash || w.out) s = 500 + d2(w.origin, cup);
            else s = d2(w.ball, cup) + (blockedLie(h, w.ball, cup, w.time) ? BLOCKED : 0);
            if (!w.sunk && moved < 1 && s >= here) return;
            if (!best || s < best.s) best = { s: s, yaw: yaw, club: cl, power: power, wait: wait, world: w };
        }

        var i, N = 16;
        bag.forEach(function (cl) {
            for (i = 0; i < N; i++) {
                [0.35, 0.7, 1].forEach(function (f) {
                    consider(base + (i / N) * Math.PI * 2, cl, cl.power * f, 0);
                });
            }
        });
        var b0 = best;
        if (!b0) return null;
        [-2, -1, 0, 1, 2].forEach(function (k) {
            bag.forEach(function (cl) {
                [0.25, 0.5, 0.75, 1].forEach(function (f) {
                    waits.forEach(function (wait) { consider(b0.yaw + k * 0.11, cl, cl.power * f, wait); });
                });
            });
        });
        var b1 = best;
        [-3, -2, -1, 0, 1, 2, 3].forEach(function (k) {
            [-0.7, -0.35, 0, 0.35, 0.7].forEach(function (dp) {
                waits.forEach(function (wait) {
                    consider(b1.yaw + k * 0.03, b1.club,
                        Math.max(C.MIN_POWER, Math.min(b1.club.power, b1.power + dp)), wait);
                });
            });
        });
        return best;
    }

    function runBot() {
        if (!built) { toast('Nothing to play — the hole does not build', 'bad'); return; }
        var h = built;
        var flatBag = C.CLUBS.filter(function (cl) { return cl.loft < 10 * Math.PI / 180; });
        var rows = check();
        var el = $('report-summary');
        el.className = 'busy';
        el.textContent = 'The bot is playing…';

        var state = {
            from: { x: h.tee.x, z: h.tee.z, y: h.tee.y + C.BALL_R },
            time: 0, strokes: 0, penalties: 0, bag: null, phase: 'full', max: 8
        };
        var t0 = performance.now();

        function finish(sunk, strokes) {
            if (state.phase === 'full') {
                rows.push({
                    ok: sunk, text: 'the bot holes out with the clubs it has (par ' + h.par + ')',
                    why: sunk ? '' : 'gave up after ' + strokes + ' strokes'
                });
                if (sunk) {
                    rows.push({
                        ok: strokes <= h.par + 2, warn: strokes > h.par + 2,
                        text: 'and does it in a plausible number of strokes',
                        why: 'took ' + strokes
                    });
                }
                if (S.hole.needsLoft && flatBag.length >= 2) {
                    state = {
                        from: { x: h.tee.x, z: h.tee.z, y: h.tee.y + C.BALL_R },
                        time: 0, strokes: 0, penalties: 0, bag: flatBag, phase: 'flat', max: 10
                    };
                    setTimeout(step, 0);
                    return;
                }
            } else {
                rows.push({
                    ok: !sunk, text: 'and cannot be played along the floor',
                    why: sunk ? 'the flat bag holed out in ' + strokes : ''
                });
            }
            var bad = rows.filter(function (r) { return !r.ok && !r.warn; }).length;
            var warn = rows.filter(function (r) { return r.warn; }).length;
            renderReport(rows,
                (bad ? '✗ ' + bad + ' failed' : (warn ? '! ' + warn + ' to look at' : '✓ all ' + rows.length + ' passed')) +
                ' — ' + Math.round(performance.now() - t0) + 'ms with the bot',
                bad ? 'bad' : (warn ? 'busy' : 'ok'));
        }

        function step() {
            if (state.strokes >= state.max) { finish(false, state.strokes + state.penalties); return; }
            var shot = bestShot(h, state.from, state.time, state.bag);
            if (!shot) { finish(false, state.strokes + state.penalties); return; }
            state.strokes++;
            state.time = shot.world.time;
            if (shot.world.sunk) { finish(true, state.strokes + state.penalties); return; }
            if (shot.world.splash || shot.world.out) {
                state.penalties++;
                state.from = { x: shot.world.origin.x, z: shot.world.origin.z, y: shot.world.origin.y };
            } else {
                state.from = { x: shot.world.ball.x, z: shot.world.ball.z, y: shot.world.ball.y };
            }
            el.textContent = 'The bot is playing… ' + (state.strokes + state.penalties) + ' strokes';
            setTimeout(step, 0);
        }

        setTimeout(step, 0);
    }

    /* ── export ─────────────────────────────────────────────────────────── */

    function n(v) {
        // Short numbers: the file is read by people, and 3.5000000000000004 is
        // what a chain of snaps leaves behind.
        var r = Math.round(v * 1000) / 1000;
        return String(r);
    }

    function padCall(p) {
        if (p.r) {
            return 'circle(' + [n(p.x + p.w / 2), n(p.z + p.d / 2), n(p.r),
                "'" + p.kind + "'", n(p.y)].join(', ') + ')';
        }
        var args = [n(p.x), n(p.z), n(p.w), n(p.d)];
        var needKind = p.kind !== 'green', needSlope = p.sx || p.sz;
        if (p.y || needKind || needSlope) args.push(n(p.y));
        if (needKind || needSlope) args.push("'" + p.kind + "'");
        if (needSlope) { args.push(n(p.sx)); args.push(n(p.sz)); }
        return 'pad(' + args.join(', ') + ')';
    }

    function wallCall(w) {
        var opts = [];
        if (w.base !== -0.4) opts.push('base: ' + n(w.base));
        if (w.yaw) opts.push('yaw: ' + n(w.yaw));
        if (w.spin) opts.push('spin: ' + n(w.spin));
        if (w.kind && w.kind !== 'rail') opts.push("kind: '" + w.kind + "'");
        if (w.move) {
            opts.push('move: { axis: \'' + w.move.axis + '\', amp: ' + n(w.move.amp) +
                ', speed: ' + n(w.move.speed) +
                (w.move.phase ? ', phase: ' + n(w.move.phase) : '') + ' }');
        }
        return 'wall(' + [n(w.x), n(w.z), n(w.w), n(w.d), n(w.h)].join(', ') +
            (opts.length ? ', { ' + opts.join(', ') + ' }' : '') + ')';
    }

    function exportSource() {
        var h = S.hole;
        var L = [];
        if (h.open) {
            L.push('/* An open hole. Its ground is a snapshot of pads: the file writes this');
            L.push('   country with moor()/dunes()/bands() instead, and `fence` below is what');
            L.push('   keeps the ball on it. Paste this as a starting point, not as the hole. */');
        }
        L.push('build({');
        L.push("    name: '" + h.name.replace(/'/g, "\\'") + "', par: " + h.par +
            (h.needsLoft ? ', needsLoft: true' : '') + (h.flat ? ', flat: true' : '') + ',');
        if (h.blurb) L.push("    blurb: '" + h.blurb.replace(/'/g, "\\'") + "',");
        L.push('    pads: [');
        h.pads.forEach(function (p, i) {
            L.push('        ' + padCall(p) + (i < h.pads.length - 1 ? ',' : ''));
        });
        L.push('    ],');
        if (h.extra.length) {
            L.push('    extra: [');
            h.extra.forEach(function (w, i) {
                L.push('        ' + wallCall(w) + (i < h.extra.length - 1 ? ',' : ''));
            });
            L.push('    ],');
        }
        if (h.water.length) {
            L.push('    water: [' + h.water.map(function (q) {
                return 'rect(' + [n(q.x), n(q.z), n(q.w), n(q.d), n(q.y)].join(', ') + ')';
            }).join(', ') + '],');
        }
        if (h.gaps.length) {
            L.push('    gaps: [' + h.gaps.map(function (g) {
                return 'rect(' + [n(g.x), n(g.z), n(g.w), n(g.d)].join(', ') + ')';
            }).join(', ') + '],');
        }
        if (h.open) {
            L.push('    open: true,');
            if (h.fence && !h.fence.length) {
                L.push('    fence: { x: ' + n(h.fence.x) + ', z: ' + n(h.fence.z) +
                    ', w: ' + n(h.fence.w) + ', d: ' + n(h.fence.d) + ' },');
            }
        }
        L.push('    tee: { x: ' + n(h.tee.x) + ', z: ' + n(h.tee.z) + ' }, ' +
            'cup: { x: ' + n(h.cup.x) + ', z: ' + n(h.cup.z) + ' }');
        L.push('})');
        return L.join('\n');
    }

    function syncExport() { $('out').value = exportSource(); }

    /* Reading a hole back out of the file. The literal is evaluated with the
       game's own authoring helpers in scope, so anything courses.js can write
       — pad(), wall(), spinner(), slider(), beam(), rect(), shore() — parses,
       and `build` is stubbed to hand the plain object straight back rather
       than deriving from it. What arrives is the document; the editor derives
       the rest itself. */
    function parseSource(text) {
        var names = [], vals = [];
        Object.keys(A).forEach(function (k) {
            if (typeof A[k] === 'function' && k !== 'build') { names.push(k); vals.push(A[k]); }
        });
        names.push('build'); vals.push(function (h) { return h; });
        var body = 'return (' + text.replace(/^\s*[\r\n]+/, '').replace(/;\s*$/, '') + ');';
        var fn = Function.apply(null, names.concat([body]));
        var h = fn.apply(null, vals);
        if (!h || !h.pads) throw new Error('that is not a hole — no pads in it');
        // `extra` may hold arrays (beam() returns three walls), so flatten.
        var flat = [];
        (h.extra || []).forEach(function (w) {
            if (Array.isArray(w)) flat.push.apply(flat, w); else flat.push(w);
        });
        h.extra = flat;
        return normalize(h);
    }

    /* ── loading the courses that ship ──────────────────────────────────── */

    /* A hole in courses.js has already been through `build` — its pads carry
       relief, its walls include the generated rails — so it cannot be handed
       back to the editor as a document. What can: the authored fields, with
       the rails dropped and the pads' bumps stripped. It is the same hole to
       within the relief `build` will put back, which is derived from the name
       and therefore identical. */
    function documentFrom(course, h) {
        var authoredWalls = h.walls.filter(function (wl) { return wl.kind !== 'rail'; });
        return normalize({
            name: h.name, blurb: h.blurb, par: h.par, theme: course.theme,
            open: h.open, fence: h.fence,
            weather: S.hole ? S.hole.weather : 'fair',
            needsLoft: h.needsLoft, flat: h.flat,
            pads: h.pads.map(function (p) {
                return { x: p.x, z: p.z, w: p.w, d: p.d, y: p.y, kind: p.kind,
                    sx: p.sx, sz: p.sz, r: p.r, inlay: p.inlay };
            }),
            extra: authoredWalls,
            water: h.water,
            gaps: h.gaps || [],
            tee: h.tee, cup: h.cup
        });
    }

    function fillLoadSelect() {
        var sel = $('load-select');
        G3.COURSES.forEach(function (course, ci) {
            course.holes.forEach(function (h, hi) {
                var o = document.createElement('option');
                o.value = ci + ':' + hi;
                o.textContent = course.name + ' — ' + (hi + 1) + '. ' + h.name;
                sel.appendChild(o);
            });
        });
    }

    function loadSelected() {
        var v = $('load-select').value;
        if (!v) { toast('Pick a hole first'); return; }
        var parts = v.split(':');
        var course = G3.COURSES[+parts[0]], h = course.holes[+parts[1]];
        pushHistory();
        S.hole = documentFrom(course, h);
        S.loadedFrom = course.id + '/' + h.name;
        S.sel = null;
        changed();
        fit();
        toast(S.hole.open
            ? 'Loaded ' + h.name + ' — an open hole: its ground is a snapshot, not its source'
            : 'Loaded ' + h.name);
    }

    /* ── persistence and playtest ───────────────────────────────────────── */

    function savePlan() {
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(S.hole)); } catch (e) { /* ignore */ }
    }

    function loadPlan() {
        try {
            var raw = localStorage.getItem(SAVE_KEY);
            if (raw) return normalize(JSON.parse(raw));
        } catch (e) { /* ignore */ }
        return null;
    }

    /* The game reads this key on boot (js/custom.js) and files whatever it
       finds as a one-hole course of its own, so Playtest is the real game on
       the real hole rather than a second renderer pretending. */
    function playtest() {
        var rows = check();
        var bad = rows.filter(function (r) { return !r.ok && !r.warn; });
        if (bad.length) { toast('Fix the checks first: ' + bad[0].text, 'bad'); return; }
        try {
            localStorage.setItem(PLAYTEST_KEY, JSON.stringify({
                hole: S.hole, source: exportSource(), at: Date.now()
            }));
        } catch (e) {
            toast('Could not hand the hole over: ' + e.message, 'bad');
            return;
        }
        /* &fly=0, because a playtest is a loop: draw, look, change, look again,
           and a five-second sweep over a hole you have been staring at all
           afternoon is five seconds on every one of those turns. */
        window.open('index.html?course=custom&hole=1&fly=0&weather=' +
                    encodeURIComponent(S.hole.weather), '_blank');
    }

    /* ── keys ───────────────────────────────────────────────────────────── */

    var TOOL_KEYS = { '1': 'pads', '2': 'extra', '3': 'water', '4': 'gaps', '5': 'tee', '6': 'cup' };

    function onKey(e) {
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

        if (e.key === ' ') { spaceHeld = true; return; }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (e.shiftKey) redo(); else undo();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            duplicate();
            return;
        }
        if (e.key === 'v' || e.key === 'V') { setTool('select'); return; }
        if (TOOL_KEYS[e.key]) { setTool(TOOL_KEYS[e.key]); return; }
        if (e.key === 'e' || e.key === 'E') { setMode('edit'); return; }
        if (e.key === 'p' || e.key === 'P') { setMode('play'); return; }
        if (e.key === 'g' || e.key === 'G') { S.grid = !S.grid; $('btn-grid').classList.toggle('on', S.grid); draw(); return; }
        if (e.key === 'f' || e.key === 'F') { fit(); return; }
        if (mode === 'play') {
            if (e.key === 'r' || e.key === 'R') { resetBall(); return; }
            if (e.key === 'Enter') { hit(); return; }
            return;
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (S.sel && S.sel.key !== 'tee' && S.sel.key !== 'cup') {
                e.preventDefault();
                pushHistory();
                list(S.sel.key).splice(S.sel.idx, 1);
                S.sel = null;
                changed();
            }
            return;
        }
        var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        if (d) {
            e.preventDefault();
            var step = S.snap * (e.shiftKey ? 4 : 1);
            pushHistory();
            if (S.sel && (S.sel.key === 'tee' || S.sel.key === 'cup')) {
                S.hole[S.sel.key].x += d[0] * step;
                S.hole[S.sel.key].z += d[1] * step;
            } else {
                var s = selShape();
                if (!s) { past.pop(); return; }
                s.x += d[0] * step;
                s.z += d[1] * step;
            }
            changed();
        }
    }

    function duplicate() {
        var s = selShape();
        if (!s) return;
        pushHistory();
        var copy = cloneShape(S.sel.key, JSON.parse(JSON.stringify(s)));
        copy.x += S.snap * 2; copy.z += S.snap * 2;
        list(S.sel.key).push(copy);
        S.sel = { key: S.sel.key, idx: list(S.sel.key).length - 1 };
        changed();
    }

    function setTool(tool) {
        S.tool = tool;
        [].forEach.call(document.querySelectorAll('#tools .btn'), function (b) {
            b.classList.toggle('on', b.dataset.tool === tool);
        });
    }

    /* ── wiring ─────────────────────────────────────────────────────────── */

    function boot() {
        // The tool buttons speak the document's own list names; `select`,
        // `tee` and `cup` are the three that are not lists.
        var TOOL_FOR = { select: 'select', pad: 'pads', extra: 'extra', water: 'water', gaps: 'gaps', tee: 'tee', cup: 'cup' };
        [].forEach.call(document.querySelectorAll('#tools .btn'), function (b) {
            b.dataset.tool = TOOL_FOR[b.dataset.tool] || b.dataset.tool;
            b.addEventListener('click', function () { setTool(b.dataset.tool); });
        });
        [].forEach.call(document.querySelectorAll('[data-snap]'), function (b) {
            b.addEventListener('click', function () {
                S.snap = parseFloat(b.dataset.snap);
                [].forEach.call(document.querySelectorAll('[data-snap]'), function (o) {
                    o.classList.toggle('on', o === b);
                });
                syncStatus();
            });
        });

        // The sky and the theme lists come from the game rather than from a
        // copy in here, so a new theme turns up in the editor by existing.
        var themeSel = $('f-theme');
        Object.keys(G3.THEMES).forEach(function (id) {
            var o = document.createElement('option');
            o.value = id; o.textContent = id;
            themeSel.appendChild(o);
        });
        var wSel = $('f-weather');
        if (G3.weather) {
            Object.keys(G3.weather.KINDS).forEach(function (id) {
                var o = document.createElement('option');
                o.value = id; o.textContent = G3.weather.KINDS[id].label;
                wSel.appendChild(o);
            });
        }
        var clubSel = $('play-club');
        C.CLUBS.forEach(function (cl) {
            var o = document.createElement('option');
            o.value = cl.id; o.textContent = cl.name;
            clubSel.appendChild(o);
        });
        clubSel.value = club.id;
        clubSel.addEventListener('change', function () {
            C.CLUBS.forEach(function (cl) { if (cl.id === clubSel.value) club = cl; });
            if (play) play.power = club.power * parseFloat($('play-power').value);
            syncStatus();
        });
        $('play-power').addEventListener('input', function () {
            if (play) play.power = club.power * parseFloat(this.value);
        });
        $('play-hit').addEventListener('click', hit);
        $('play-reset').addEventListener('click', resetBall);

        ['f-name', 'f-blurb', 'f-par', 'f-theme', 'f-weather', 'f-needsloft', 'f-flat'].forEach(function (id) {
            var el = $(id);
            el.addEventListener('focus', pushHistory);
            el.addEventListener('change', readCard);
            el.addEventListener('input', readCard);
        });
        $('f-padkind').addEventListener('change', function () {
            S.padKind = this.value;
            if (S.tool === 'select') setTool('pads');
        });

        $('btn-undo').addEventListener('click', undo);
        $('btn-redo').addEventListener('click', redo);
        $('mode-edit').addEventListener('click', function () { setMode('edit'); });
        $('mode-play').addEventListener('click', function () { setMode('play'); });
        $('btn-anim').addEventListener('click', function () {
            animate = !animate;
            this.classList.toggle('on', animate);
            this.textContent = animate ? '⏸' : '▶';
        });
        $('btn-grid').addEventListener('click', function () {
            S.grid = !S.grid;
            this.classList.toggle('on', S.grid);
            draw();
        });
        $('btn-load').addEventListener('click', loadSelected);
        $('btn-blank').addEventListener('click', function () {
            pushHistory();
            S.hole = blankHole();
            S.sel = null;
            changed();
            fit();
        });
        $('btn-check').addEventListener('click', check);
        $('btn-bot').addEventListener('click', runBot);
        $('btn-playtest').addEventListener('click', playtest);
        $('btn-copy').addEventListener('click', function () {
            copy(exportSource(), 'Hole copied — paste it into js/courses.js');
        });
        $('btn-copy-ai').addEventListener('click', function () {
            copy('Here is a hole for golf3d/js/courses.js (Loft Links). Add it to the ' +
                 'right course array, keep the authoring helpers, and re-run tests.html.\n\n' +
                 exportSource() + '\n', 'Copied with a prompt for an assistant');
        });
        $('btn-download').addEventListener('click', function () {
            var blob = new Blob([exportSource() + '\n'], { type: 'text/plain' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = S.hole.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.js';
            a.click();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        });
        $('btn-paste').addEventListener('click', function () {
            var text = $('paste-in').value.trim();
            if (!text) { toast('Nothing to parse'); return; }
            try {
                var h = parseSource(text);
                pushHistory();
                S.hole = h;
                S.sel = null;
                changed();
                fit();
                toast('Parsed ' + h.name, 'good');
            } catch (e) {
                toast('Could not parse that: ' + e.message, 'bad');
            }
        });

        $('btn-zoom-in').addEventListener('click', function () {
            zoomBy(1.25, planCanvas.clientWidth / 2, planCanvas.clientHeight / 2);
        });
        $('btn-zoom-out').addEventListener('click', function () {
            zoomBy(0.8, planCanvas.clientWidth / 2, planCanvas.clientHeight / 2);
        });
        $('btn-fit').addEventListener('click', fit);

        planCanvas.addEventListener('pointerdown', onPlanDown);
        planCanvas.addEventListener('pointermove', onPlanMove);
        planCanvas.addEventListener('pointerup', onPlanUp);
        planCanvas.addEventListener('pointercancel', onPlanUp);
        planCanvas.addEventListener('wheel', function (e) {
            e.preventDefault();
            var p = planPoint(e);
            zoomBy(e.deltaY < 0 ? 1.12 : 0.89, p.px, p.pz);
        }, { passive: false });
        planCanvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

        viewCanvas.addEventListener('pointerdown', onViewDown);
        viewCanvas.addEventListener('pointermove', onViewMove);
        viewCanvas.addEventListener('pointerup', onViewUp);
        viewCanvas.addEventListener('pointercancel', onViewUp);
        viewCanvas.addEventListener('wheel', function (e) {
            e.preventDefault();
            if (gl) R.cam.dist = Math.max(3, Math.min(40, R.cam.dist + e.deltaY * 0.01));
        }, { passive: false });

        window.addEventListener('keydown', onKey);
        window.addEventListener('keyup', function (e) { if (e.key === ' ') spaceHeld = false; });
        window.addEventListener('resize', function () { resizePlan(); resizeView(); });

        paneButtons();
        splitter();
        sidebarResize();

        fillLoadSelect();
        S.hole = loadPlan() || blankHole();
        setTool('select');
        changed();
        resizePlan();

        if (!initView()) $('view-fallback').className = 'show';
        resizeView();
        needsRebuild = true;
        fit();
        check();

        last = performance.now();
        requestAnimationFrame(loop);
    }

    function readCard() {
        S.hole.name = $('f-name').value || 'New Hole';
        S.hole.blurb = $('f-blurb').value;
        S.hole.par = Math.max(2, Math.min(6, parseInt($('f-par').value, 10) || 3));
        S.hole.theme = $('f-theme').value;
        S.hole.weather = $('f-weather').value;
        S.hole.needsLoft = $('f-needsloft').checked;
        S.hole.flat = $('f-flat').checked;
        // The name seeds the relief, so renaming a hole reshapes its ground —
        // which is exactly what happens in the file, and worth seeing here.
        needsRebuild = true;
        rebuild();
        savePlan();
        syncExport();
        draw();
    }

    function copy(text, msg) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () { toast(msg, 'good'); },
                function () { fallbackCopy(text, msg); });
        } else {
            fallbackCopy(text, msg);
        }
    }

    function fallbackCopy(text, msg) {
        var ta = $('out');
        ta.value = text;
        ta.select();
        try { document.execCommand('copy'); toast(msg, 'good'); }
        catch (e) { toast('Copy failed — select the box and copy by hand', 'bad'); }
        syncExport();
    }

    function paneButtons() {
        var panes = $('panes');
        var map = { 'pane-both': '', 'pane-plan-only': 'only-plan', 'pane-view-only': 'only-view' };
        Object.keys(map).forEach(function (id) {
            $(id).addEventListener('click', function () {
                panes.className = map[id];
                Object.keys(map).forEach(function (o) { $(o).classList.toggle('on', o === id); });
                setTimeout(function () { resizePlan(); resizeView(); }, 0);
            });
        });
    }

    function splitter() {
        var el = $('splitter'), dragging = false;
        el.addEventListener('pointerdown', function (e) {
            dragging = true;
            el.classList.add('active');
            el.setPointerCapture(e.pointerId);
        });
        el.addEventListener('pointermove', function (e) {
            if (!dragging) return;
            var r = $('panes').getBoundingClientRect();
            var f = Math.max(0.15, Math.min(0.85, (e.clientX - r.left) / r.width));
            $('pane-plan').style.flex = '1 1 ' + (f * 100) + '%';
            $('pane-view').style.flex = '1 1 ' + ((1 - f) * 100) + '%';
            resizePlan(); resizeView();
        });
        el.addEventListener('pointerup', function () { dragging = false; el.classList.remove('active'); });
    }

    function sidebarResize() {
        var handle = $('sidebar-resize-handle'), bar = $('sidebar'), dragging = false;
        handle.addEventListener('pointerdown', function (e) {
            dragging = true;
            handle.classList.add('active');
            handle.setPointerCapture(e.pointerId);
        });
        handle.addEventListener('pointermove', function (e) {
            if (!dragging) return;
            bar.style.width = Math.max(260, Math.min(720, e.clientX)) + 'px';
            resizePlan(); resizeView();
        });
        handle.addEventListener('pointerup', function () { dragging = false; handle.classList.remove('active'); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();

    // What the self-test in tests.html reaches for.
    G3.editor = {
        get hole() { return S.hole; },
        set hole(h) { S.hole = normalize(h); changed(); },
        blankHole: blankHole,
        normalize: normalize,
        parseSource: parseSource,
        exportSource: exportSource,
        documentFrom: documentFrom,
        runChecks: runChecks,
        get built() { return built; }
    };

})(window.G3);
