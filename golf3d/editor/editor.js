/* The 3D hole editor.

   It runs on the game's own modules — config.js for the constants, courses.js
   for the authoring helpers and `build`, physics.js for the solver, render.js
   for the picture — and owns no copy of any of them. That is the whole design:
   a hole that looks right in here looks right in play because the same
   renderer drew it, and a hole that plays right in here plays right in the
   game because the same integrator moved the ball.

   Two pictures of one hole, side by side. The left is a plan you draw on,
   supporting multiple orthographic projections:
   - Top-down [X/Z]: standard floor plan
   - Side elevation [Z/Y]: vertical profile showing true slopes, ramps, water depth,
     clearances under beams, tree/rock silhouettes, and allowing direct height editing
   - Front cross-section [X/Y]: lateral tilt and cross-slopes

   The right is `render.buildHole` on the result, rebuilt as you draw, equipped with
   comprehensive 3D perspective presets (Tee sightline, Cup reverse, Top, Front,
   Side, 5° Graze angle, Hero 40° isometric, and free Orbit with pan/zoom) plus
   an interactive 3D orientation gizmo.

   Full placement vocabulary:
   - Pads (rectangles, circular discs, travelator belts, launch spring trampolines)
   - Walls (rails, angled banks, pinball bumpers, spinning blades, sliding gates,
     flipper bats, overhead beams on posts, trees, rocks)
   - Water pools & Gap rail suppressors
   - Warp pipes (mouth, destination exit, trajectory line and exit yaw angle)
   - Visual decor props (nautical buoys, timber pilings, clubhouse benches, boats, bins)

   The checks in the Check panel are the rules from tests.html, ported one for
   one, and the bot is the same greedy player. A hole that passes here is a
   hole the suite will accept.

   ES5-flavoured, like the rest of golf3d/. No build step, no dependencies. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var P = G3.physics;
    var A = G3.authoring;
    var R = G3.render;

    /* ── the vocabulary ─────────────────────────────────────────────────── */

    /* The six lists a hole is drawn from, in the order the plan paints them.
       Hit-testing walks it backwards, so a wall or decor lying on a pad is the
       thing you grab. `gaps` are after extra because they cut holes in rails,
       `warps` and `decor` are on top. */
    var LISTS = [
        { key: 'pads',  label: 'Ground', color: '#4a9a52' },
        { key: 'water', label: 'Water',  color: '#1b6d9e' },
        { key: 'extra', label: 'Wall',   color: '#6d4a2e' },
        { key: 'gaps',  label: 'Gap',    color: '#b58bff' },
        { key: 'warps', label: 'Pipe',   color: '#79c0ff' },
        { key: 'decor', label: 'Decor',  color: '#e3b341' }
    ];
    var LIST_KEYS = LISTS.map(function (l) { return l.key; });

    // What each surface looks like from above. The 3D pane has the real
    // materials; these only have to be told apart at a glance.
    var PAD_COLOR = {
        green: '#4a9a52', fairway: '#3f7d43', rough: '#2b5a30',
        sand: '#c8b184', wood: '#8a6337', cup: '#4a9a52'
    };

    var EXTRA_KIND_COLOR = {
        rail: '#6d4a2e',
        bumper: '#f0409a',
        blade: '#d8523f',
        gate: '#e0a13a',
        beam: '#9a6a3c',
        tree: '#2d6a3f',
        rock: '#7a7a85'
    };

    var DECOR_KIND_LABEL = {
        buoy: 'Buoy',
        piling: 'Piling',
        bench: 'Bench',
        boat: 'Boat',
        sailboat: 'Sailboat',
        bin: 'Bin',
        barrel: 'Barrel',
        crate: 'Crate',
        palm: 'Palm',
        pine: 'Pine',
        sign: 'Sign',
        windmill: 'Windmill'
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
    var gizmoCanvas = $('view-gizmo');
    var gizmoCtx = gizmoCanvas ? gizmoCanvas.getContext('2d') : null;

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
        decorKind: 'buoy',
        snap: 0.5,
        grid: false,
        loadedFrom: ''
    };

    var planProj = 'top';                         // 'top' | 'side' | 'front'
    var view = { x: 0, z: 0, y: 0, scale: 40 };   // world → plan pixels
    var cam = {
        preset: 'tee',
        target: { x: 3, y: 0, z: 7 },
        dist: 12,
        yaw: 0,
        pitch: 0.46
    };
    var mouse = { wx: 0, wz: 0, wy: 0, sx: 0, sy: 0 };
    var drag = null;        // {type:'move'|'resize'|'draw'|'pan'|'marker'|'move_elev'|'move_front', …}
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
            warps: [],
            decor: [],
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
        s = s || {};
        if (key === 'warps') {
            return {
                x: num(s.x, 0), z: num(s.z, 0),
                tx: num(s.tx, s.x !== undefined ? s.x : 0),
                tz: num(s.tz, s.z !== undefined ? s.z + 4 : 4),
                r: Math.max(0.2, num(s.r, 0.85)),
                yaw: num(s.yaw, 0)
            };
        }
        if (key === 'decor') {
            return {
                kind: typeof s.kind === 'string' ? s.kind : (S.decorKind || 'buoy'),
                x: num(s.x, 0), z: num(s.z, 0),
                y: num(s.y, 0),
                yaw: num(s.yaw, 0),
                pitch: num(s.pitch, 0),
                roll: num(s.roll, 0),
                scale: num(s.scale, 1),
                variant: num(s.variant, 0)
            };
        }
        var o = {
            x: num(s.x, 0), z: num(s.z, 0),
            w: Math.max(MIN_SIDE, num(s.w, 1)), d: Math.max(MIN_SIDE, num(s.d, 1))
        };
        if (key === 'pads') {
            o.y = num(s.y, 0);
            o.kind = PAD_COLOR[s.kind] ? s.kind : 'green';
            o.sx = num(s.sx, 0);
            o.sz = num(s.sz, 0);
            if (s.push) o.push = { x: num(s.push.x, 0), z: num(s.push.z, 0) };
            if (s.spring) o.spring = num(s.spring, 8.5);
            if (s.r && o.spring) {
                o.r = num(s.r, 0.5); o.rIn = o.r; o.inlay = true;
                o.w = o.d = o.r * 2;
            } else if (s.r) { o.r = num(s.r, 0.5); o.inlay = true; squareUp(o); }
            else if (s.inlay) o.inlay = true;
        }
        if (key === 'water') o.y = num(s.y, -0.6);
        if (key === 'extra') {
            o.h = num(s.h, 0.6);
            o.base = num(s.base, -0.4);
            o.yaw = num(s.yaw, 0);
            o.spin = num(s.spin, 0);
            o.kind = typeof s.kind === 'string' ? s.kind : 'rail';
            if (s.seat !== undefined) o.seat = num(s.seat, 0.4);
            if (s.move) {
                o.move = {
                    axis: s.move.axis === 'z' ? 'z' : 'x',
                    amp: num(s.move.amp, 1.5),
                    speed: num(s.move.speed, 1.1),
                    phase: num(s.move.phase, 0)
                };
            }
            if (s.swing) {
                o.swing = {
                    from: num(s.swing.from, 0),
                    to: num(s.swing.to, 1),
                    speed: num(s.swing.speed, 2.2),
                    phase: num(s.swing.phase, 0)
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
        // Except a trampoline, which sprung() cuts as a clean circle on
        // purpose: a scalloped launch pad is a launch pad with a bite out of
        // one side, and the bite is where the ball rolls off instead of up.
        if (p.spring) { p.rIn = p.r; delete p.wave; return; }
        A.shapeDisc(p);
    }

    function list(key) { return S.hole[key]; }

    function selShape() {
        if (!S.sel || S.sel.key === 'tee' || S.sel.key === 'cup') return null;
        return (list(S.sel.key) || [])[S.sel.idx] || null;
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
            warps: src.warps || [],
            decor: src.decor || [],
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
    function sy(y) {
        var h = planCanvas.clientHeight;
        return h / 2 - (y - (view.y || 0)) * view.scale;
    }

    function wx(px) { return px / view.scale + view.x; }
    function wz(py) { return py / view.scale + view.z; }
    function wy(py) {
        var h = planCanvas.clientHeight;
        return -(py - h / 2) / view.scale + (view.y || 0);
    }

    function fit() {
        var b = bounds();
        var w = planCanvas.clientWidth, h = planCanvas.clientHeight;
        var m = 40;
        if (planProj === 'side') {
            var s = Math.min((w - m * 2) / Math.max(0.5, b.maxZ - b.minZ),
                             (h - m * 2) / Math.max(2, b.maxY - b.minY + 2));
            view.scale = Math.max(6, Math.min(160, s));
            view.z = (b.minZ + b.maxZ) / 2 - w / 2 / view.scale;
            view.y = (b.minY + b.maxY) / 2;
        } else if (planProj === 'front') {
            var s = Math.min((w - m * 2) / Math.max(0.5, b.maxX - b.minX),
                             (h - m * 2) / Math.max(2, b.maxY - b.minY + 2));
            view.scale = Math.max(6, Math.min(160, s));
            view.x = (b.minX + b.maxX) / 2 - w / 2 / view.scale;
            view.y = (b.minY + b.maxY) / 2;
        } else {
            var s = Math.min((w - m * 2) / Math.max(0.5, b.maxX - b.minX),
                             (h - m * 2) / Math.max(0.5, b.maxZ - b.minZ));
            view.scale = Math.max(6, Math.min(160, s));
            view.x = (b.minX + b.maxX) / 2 - w / 2 / view.scale;
            view.z = (b.minZ + b.maxZ) / 2 - h / 2 / view.scale;
        }
        draw();
    }

    function bounds() {
        var b = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity, minY: -0.8, maxY: 2.5 };
        var any = false;
        LIST_KEYS.forEach(function (k) {
            (list(k) || []).forEach(function (s) {
                any = true;
                if (k === 'warps') {
                    var r = s.r || 0.85;
                    b.minX = Math.min(b.minX, s.x - r, s.tx - r);
                    b.maxX = Math.max(b.maxX, s.x + r, s.tx + r);
                    b.minZ = Math.min(b.minZ, s.z - r, s.tz - r);
                    b.maxZ = Math.max(b.maxZ, s.z + r, s.tz + r);
                } else if (k === 'decor') {
                    b.minX = Math.min(b.minX, s.x - 1); b.maxX = Math.max(b.maxX, s.x + 1);
                    b.minZ = Math.min(b.minZ, s.z - 1); b.maxZ = Math.max(b.maxZ, s.z + 1);
                    b.minY = Math.min(b.minY, s.y || 0); b.maxY = Math.max(b.maxY, (s.y || 0) + 1.5);
                } else {
                    b.minX = Math.min(b.minX, s.x); b.maxX = Math.max(b.maxX, s.x + s.w);
                    b.minZ = Math.min(b.minZ, s.z); b.maxZ = Math.max(b.maxZ, s.z + s.d);
                    if (s.y !== undefined) {
                        b.minY = Math.min(b.minY, s.y);
                        b.maxY = Math.max(b.maxY, s.y + (s.h || 0) + ((s.sz || 0) > 0 ? s.sz * s.d : 0));
                    }
                }
            });
        });
        if (S.hole && S.hole.tee) {
            b.minX = Math.min(b.minX, S.hole.tee.x - 1); b.maxX = Math.max(b.maxX, S.hole.tee.x + 1);
            b.minZ = Math.min(b.minZ, S.hole.tee.z - 1); b.maxZ = Math.max(b.maxZ, S.hole.tee.z + 1);
        }
        if (S.hole && S.hole.cup) {
            b.minX = Math.min(b.minX, S.hole.cup.x - 1); b.maxX = Math.max(b.maxX, S.hole.cup.x + 1);
            b.minZ = Math.min(b.minZ, S.hole.cup.z - 1); b.maxZ = Math.max(b.maxZ, S.hole.cup.z + 1);
        }
        if (!any) return { minX: -2, maxX: 10, minZ: -2, maxZ: 16, minY: -0.8, maxY: 2.5 };
        return b;
    }

    function zoomBy(f, ax, ay) {
        if (planProj === 'side') {
            var bz = wz(ax), by = wy(ay);
            view.scale = Math.max(6, Math.min(220, view.scale * f));
            view.z = bz - ax / view.scale;
            view.y = by + (ay - planCanvas.clientHeight / 2) / view.scale;
        } else if (planProj === 'front') {
            var bx = wx(ax), by = wy(ay);
            view.scale = Math.max(6, Math.min(220, view.scale * f));
            view.x = bx - ax / view.scale;
            view.y = by + (ay - planCanvas.clientHeight / 2) / view.scale;
        } else {
            var bx = wx(ax), bz = wz(ay);
            view.scale = Math.max(6, Math.min(220, view.scale * f));
            view.x = bx - ax / view.scale;
            view.z = bz - ay / view.scale;
        }
        draw();
    }

    function setPlanProj(proj) {
        if (planProj === proj) return;
        planProj = proj;
        [].forEach.call(document.querySelectorAll('#plan-proj-bar .btn'), function (b) {
            b.classList.toggle('on', b.dataset.proj === proj);
        });
        var tag = $('plan-tag');
        if (tag) {
            tag.textContent = proj === 'side' ? 'elevation profile (side Z/Y)'
                : proj === 'front' ? 'cross-section (front X/Y)'
                : 'plan (top-down X/Z)';
        }
        fit();
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
        var w = planCanvas.clientWidth, h = planCanvas.clientHeight;
        ctx.lineWidth = 1;

        if (planProj === 'side') {
            // Horizontal is Z, vertical is Y (elevation)
            var stepZ = S.snap >= 1 ? 1 : (view.scale > 60 ? 0.5 : 1);
            while (stepZ * view.scale < 14) stepZ *= 2;
            var z0 = Math.floor(view.z / stepZ) * stepZ, z;
            for (z = z0; sz(z) < w; z += stepZ) {
                ctx.strokeStyle = Math.abs(z) < 1e-6 ? '#3f4b57' : '#1b2129';
                ctx.beginPath(); ctx.moveTo(sz(z), 0); ctx.lineTo(sz(z), h); ctx.stroke();
            }
            // Elevation lines along Y
            var stepY = 0.5;
            if (view.scale < 25) stepY = 1.0;
            var minY = wy(h), maxY = wy(0);
            var y0 = Math.floor(minY / stepY) * stepY, y;
            ctx.font = '9px monospace';
            for (y = y0; y <= maxY; y += stepY) {
                var py = sy(y);
                ctx.strokeStyle = Math.abs(y) < 1e-6 ? '#4e5d6c' : '#1b2129';
                ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
                ctx.fillStyle = Math.abs(y) < 1e-6 ? '#8b949e' : '#484f58';
                ctx.fillText((y >= 0 ? '+' : '') + y.toFixed(1) + 'm', 6, py - 3);
            }
            return;
        }

        if (planProj === 'front') {
            // Horizontal is X, vertical is Y
            var stepX = S.snap >= 1 ? 1 : (view.scale > 60 ? 0.5 : 1);
            while (stepX * view.scale < 14) stepX *= 2;
            var x0 = Math.floor(view.x / stepX) * stepX, x;
            for (x = x0; sx(x) < w; x += stepX) {
                ctx.strokeStyle = Math.abs(x) < 1e-6 ? '#3f4b57' : '#1b2129';
                ctx.beginPath(); ctx.moveTo(sx(x), 0); ctx.lineTo(sx(x), h); ctx.stroke();
            }
            var stepY = 0.5;
            if (view.scale < 25) stepY = 1.0;
            var minY = wy(h), maxY = wy(0);
            var y0 = Math.floor(minY / stepY) * stepY, y;
            ctx.font = '9px monospace';
            for (y = y0; y <= maxY; y += stepY) {
                var py = sy(y);
                ctx.strokeStyle = Math.abs(y) < 1e-6 ? '#4e5d6c' : '#1b2129';
                ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
                ctx.fillStyle = Math.abs(y) < 1e-6 ? '#8b949e' : '#484f58';
                ctx.fillText((y >= 0 ? '+' : '') + y.toFixed(1) + 'm', 6, py - 3);
            }
            return;
        }

        // Top-down view
        var step = S.snap >= 1 ? 1 : (view.scale > 60 ? 0.5 : 1);
        while (step * view.scale < 14) step *= 2;
        var x0 = Math.floor(view.x / step) * step, x;
        for (x = x0; sx(x) < w; x += step) {
            ctx.strokeStyle = Math.abs(x) < 1e-6 ? '#3f4b57' : '#1b2129';
            ctx.beginPath(); ctx.moveTo(sx(x), 0); ctx.lineTo(sx(x), h); ctx.stroke();
        }
        var z0 = Math.floor(view.z / step) * step, z;
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

    function drawTopView() {
        var t = world ? world.time : 0;

        // Water sits under everything the ball can stand on
        list('water').forEach(function (q) {
            ctx.fillStyle = 'rgba(27,109,158,.75)';
            rectPath(q); ctx.fill();
        });

        // The ground pads
        list('pads').forEach(function (p) {
            ctx.fillStyle = PAD_COLOR[p.kind] || PAD_COLOR.green;
            ctx.globalAlpha = 0.85;
            padPath(p); ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(0,0,0,.45)';
            ctx.lineWidth = 1;
            padPath(p); ctx.stroke();
            if (p.push) drawPushArrow(p);
            if (p.spring) drawSpring(p);
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

        // Generated rails, greyed and unselectable
        if (built) {
            var authored = list('extra').length;
            built.walls.forEach(function (wl, i) {
                if (i >= built.walls.length - authored) return;
                drawWallBox(wl, t, 'rgba(120,132,145,.35)', 'rgba(160,175,190,.55)');
            });
        }

        // The authored walls and obstacles
        list('extra').forEach(function (wl, i) {
            var selected = S.sel && S.sel.key === 'extra' && S.sel.idx === i;
            var fill = EXTRA_KIND_COLOR[wl.kind] || '#6d4a2e';
            var stroke = selected ? '#58a6ff' : 'rgba(0,0,0,.6)';

            if (wl.move || wl.spin || wl.swing) {
                drawWallBox(wl, t + 1.4, null, 'rgba(210,153,34,.5)', [4, 3]);
                drawWallBox(wl, t + 2.8, null, 'rgba(210,153,34,.35)', [4, 3]);
            }

            if (wl.kind === 'tree') {
                // Circular canopy with central trunk collider
                var cx = sx(wl.x + wl.w / 2), cz = sz(wl.z + wl.d / 2);
                var rCanopy = Math.max(8, 1.2 * view.scale);
                ctx.save();
                ctx.fillStyle = 'rgba(45, 106, 63, 0.7)';
                ctx.beginPath(); ctx.arc(cx, cz, rCanopy, 0, 7); ctx.fill();
                ctx.strokeStyle = selected ? '#58a6ff' : 'rgba(30, 80, 45, 0.9)';
                ctx.lineWidth = selected ? 2 : 1;
                ctx.stroke();
                drawWallBox(wl, t, '#4a3525', '#241a12');
                ctx.restore();
            } else if (wl.kind === 'rock') {
                var cx = sx(wl.x + wl.w / 2), cz = sz(wl.z + wl.d / 2);
                var rRock = Math.max(6, (Math.min(wl.w, wl.d) / 2) * view.scale);
                ctx.save();
                ctx.fillStyle = '#7a7a85';
                ctx.strokeStyle = selected ? '#58a6ff' : '#4b4b54';
                ctx.lineWidth = selected ? 2 : 1;
                ctx.beginPath(); ctx.arc(cx, cz, rRock, 0, 7); ctx.fill(); ctx.stroke();
                ctx.restore();
            } else if (wl.kind === 'bumper') {
                drawWallBox(wl, t, '#f0409a', selected ? '#58a6ff' : '#a02060');
                var cx = sx(wl.x + wl.w / 2), cz = sz(wl.z + wl.d / 2);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(cx, cz, Math.max(2, 0.12 * view.scale), 0, 7); ctx.fill();
            } else {
                drawWallBox(wl, t, fill, stroke);
            }
        });

        // Gaps
        list('gaps').forEach(function (g) {
            ctx.save();
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = '#b58bff'; ctx.lineWidth = 1.5;
            rectPath(g); ctx.stroke();
            ctx.restore();
            ctx.fillStyle = 'rgba(181,139,255,.10)';
            rectPath(g); ctx.fill();
        });

        drawPipes();
        drawDecor();
        drawMarker(S.hole.tee.x, S.hole.tee.z, '#e6edf3', 'T');
        drawMarker(S.hole.cup.x, S.hole.cup.z, '#f2c744', 'H');

        // Ball
        if (world) {
            ctx.beginPath();
            ctx.arc(sx(world.ball.x), sz(world.ball.z), Math.max(2.5, C.BALL_R * view.scale), 0, 7);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#000000'; ctx.lineWidth = 0.5; ctx.stroke();
        }
    }

    function drawSideElevation() {
        var w = planCanvas.clientWidth, h = planCanvas.clientHeight;

        // Ground baseline y = 0
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, sy(0)); ctx.lineTo(w, sy(0)); ctx.stroke();

        // 1. Water
        list('water').forEach(function (q) {
            var z0 = sz(q.z), z1 = sz(q.z + q.d);
            var ySurf = sy(q.y), yBed = sy(q.y - 0.7);
            ctx.fillStyle = 'rgba(27,109,158,.45)';
            ctx.fillRect(Math.min(z0, z1), Math.min(ySurf, yBed), Math.abs(z1 - z0), Math.abs(yBed - ySurf));
            ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(z0, ySurf); ctx.lineTo(z1, ySurf); ctx.stroke();
        });

        // 2. Pads (ground slabs & slopes)
        list('pads').forEach(function (p) {
            var z0 = p.z, z1 = p.z + p.d;
            var szSlope = p.sz || 0;
            var y0 = p.y, y1 = p.y + szSlope * p.d;
            var px0 = sz(z0), py0 = sy(y0);
            var px1 = sz(z1), py1 = sy(y1);
            var depth = 0.35 * view.scale;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(px0, py0);
            ctx.lineTo(px1, py1);
            ctx.lineTo(px1, py1 + depth);
            ctx.lineTo(px0, py0 + depth);
            ctx.closePath();
            ctx.fillStyle = PAD_COLOR[p.kind] || PAD_COLOR.green;
            ctx.globalAlpha = 0.85;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(px0, py0); ctx.lineTo(px1, py1); ctx.stroke();
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Push arrows on slope
            if (p.push && Math.abs(p.push.z) > 0.1) {
                var midX = (px0 + px1) / 2, midY = (py0 + py1) / 2;
                var dir = p.push.z > 0 ? 1 : -1;
                ctx.strokeStyle = 'rgba(240,180,60,.9)';
                ctx.fillStyle = 'rgba(240,180,60,.9)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(midX - dir * 12, midY);
                ctx.lineTo(midX + dir * 12, midY);
                ctx.stroke();
            }
            if (p.spring) {
                var midX = (px0 + px1) / 2, midY = (py0 + py1) / 2;
                ctx.strokeStyle = 'rgba(240,180,60,.9)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(midX, midY + depth);
                ctx.lineTo(midX, midY + depth + 14);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(midX, midY - 6);
                ctx.lineTo(midX, midY - 18);
                ctx.lineTo(midX - 4, midY - 12);
                ctx.moveTo(midX, midY - 18);
                ctx.lineTo(midX + 4, midY - 12);
                ctx.stroke();
            }
            ctx.restore();
        });

        // 3. Walls / Obstacles in side elevation
        list('extra').forEach(function (wl, i) {
            var selected = S.sel && S.sel.key === 'extra' && S.sel.idx === i;
            var z0 = sz(wl.z), z1 = sz(wl.z + wl.d);
            var yBase = sy(wl.base !== undefined ? wl.base : -0.4);
            var yTop = sy((wl.base !== undefined ? wl.base : -0.4) + wl.h);
            var left = Math.min(z0, z1), width = Math.max(4, Math.abs(z1 - z0));
            var top = Math.min(yBase, yTop), height = Math.abs(yBase - yTop);

            ctx.save();
            if (wl.kind === 'beam') {
                ctx.fillStyle = '#9a6a3c';
                ctx.strokeStyle = selected ? '#58a6ff' : '#332211';
                ctx.lineWidth = 1.5;
                // Overhead bar: base 0.55, h 1.35
                var barTop = sy(1.35), barBot = sy(0.55);
                ctx.fillRect(left, Math.min(barTop, barBot), width, Math.abs(barBot - barTop));
                ctx.strokeRect(left, Math.min(barTop, barBot), width, Math.abs(barBot - barTop));
                // Posts at ends
                var postW = Math.max(3, 0.28 * view.scale);
                var postBot = sy(wl.base !== undefined ? wl.base : -0.4);
                ctx.fillRect(left, Math.min(barBot, postBot), postW, Math.abs(postBot - barBot));
                ctx.fillRect(left + width - postW, Math.min(barBot, postBot), postW, Math.abs(postBot - barBot));
            } else if (wl.kind === 'tree') {
                var trunkW = Math.max(4, 0.3 * view.scale);
                ctx.fillStyle = '#4a3525';
                ctx.fillRect(left + width / 2 - trunkW / 2, top, trunkW, height);
                ctx.fillStyle = '#2d6a3f';
                ctx.beginPath();
                ctx.arc(left + width / 2, top - 8, Math.max(10, width * 0.8), 0, 7);
                ctx.fill();
            } else if (wl.kind === 'rock') {
                ctx.fillStyle = '#7a7a85';
                ctx.strokeStyle = selected ? '#58a6ff' : '#444';
                ctx.beginPath();
                ctx.arc(left + width / 2, yBase, width * 0.5, Math.PI, 0);
                ctx.fill(); ctx.stroke();
            } else if (wl.kind === 'bumper') {
                ctx.fillStyle = '#f0409a';
                ctx.strokeStyle = selected ? '#58a6ff' : '#881144';
                ctx.fillRect(left, top, width, height);
                ctx.strokeRect(left, top, width, height);
            } else {
                ctx.fillStyle = EXTRA_KIND_COLOR[wl.kind] || '#6d4a2e';
                ctx.strokeStyle = selected ? '#58a6ff' : 'rgba(0,0,0,0.6)';
                ctx.lineWidth = 1.5;
                ctx.fillRect(left, top, width, height);
                ctx.strokeRect(left, top, width, height);
            }
            ctx.restore();
        });

        // 4. Decor in side view
        (list('decor') || []).forEach(function (d, i) {
            var pz = sz(d.z), py = sy(d.y || 0);
            var selected = S.sel && S.sel.key === 'decor' && S.sel.idx === i;
            ctx.save();
            ctx.strokeStyle = selected ? '#58a6ff' : '#e3b341';
            ctx.fillStyle = '#e3b341';
            ctx.beginPath();
            ctx.arc(pz, py, 6, 0, 7);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '9px monospace';
            ctx.fillText(d.kind, pz + 8, py + 3);
            ctx.restore();
        });

        // 5. Pipes in side view
        (list('warps') || []).forEach(function (w) {
            var z0 = sz(w.z), z1 = sz(w.tz);
            var y0 = sy(0), y1 = sy(0);
            ctx.save();
            ctx.strokeStyle = '#79c0ff';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(z0, y0, 5, 0, 7); ctx.stroke();
            ctx.beginPath(); ctx.arc(z1, y1, 5, 0, 7); ctx.stroke();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = 'rgba(121,192,255,0.5)';
            ctx.beginPath();
            ctx.moveTo(z0, y0);
            ctx.quadraticCurveTo((z0 + z1) / 2, Math.max(y0, y1) + 25, z1, y1);
            ctx.stroke();
            ctx.restore();
        });

        // 6. Tee and Cup
        var teePad = P.surfaceTop(built || S.hole, S.hole.tee.x, S.hole.tee.z);
        var teeY = teePad ? teePad.y : 0;
        var pzTee = sz(S.hole.tee.z), pyTee = sy(teeY);
        ctx.fillStyle = '#e6edf3';
        ctx.beginPath(); ctx.arc(pzTee, pyTee, 6, 0, 7); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.stroke();

        var cupY = built && built.cup ? built.cup.y : 0;
        var pzCup = sz(S.hole.cup.z), pyCup = sy(cupY);
        ctx.fillStyle = '#f2c744';
        ctx.beginPath(); ctx.arc(pzCup, pyCup, 6, 0, 7); ctx.fill();
        ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pzCup, pyCup); ctx.lineTo(pzCup, pyCup - 22); ctx.stroke();
        ctx.fillStyle = '#f2c744';
        ctx.beginPath(); ctx.moveTo(pzCup, pyCup - 22); ctx.lineTo(pzCup + 10, pyCup - 17); ctx.lineTo(pzCup, pyCup - 12); ctx.fill();

        // 7. Ball
        if (world) {
            ctx.beginPath();
            ctx.arc(sz(world.ball.z), sy(world.ball.y), Math.max(2.5, C.BALL_R * view.scale), 0, 7);
            ctx.fillStyle = '#ffffff'; ctx.fill();
            ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
        }
    }

    function drawFrontElevation() {
        var w = planCanvas.clientWidth, h = planCanvas.clientHeight;

        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, sy(0)); ctx.lineTo(w, sy(0)); ctx.stroke();

        list('water').forEach(function (q) {
            var x0 = sx(q.x), x1 = sx(q.x + q.w);
            var ySurf = sy(q.y), yBed = sy(q.y - 0.7);
            ctx.fillStyle = 'rgba(27,109,158,.45)';
            ctx.fillRect(Math.min(x0, x1), Math.min(ySurf, yBed), Math.abs(x1 - x0), Math.abs(yBed - ySurf));
            ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x0, ySurf); ctx.lineTo(x1, ySurf); ctx.stroke();
        });

        list('pads').forEach(function (p) {
            var x0 = p.x, x1 = p.x + p.w;
            var sxSlope = p.sx || 0;
            var y0 = p.y, y1 = p.y + sxSlope * p.w;
            var px0 = sx(x0), py0 = sy(y0);
            var px1 = sx(x1), py1 = sy(y1);
            var depth = 0.35 * view.scale;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(px0, py0);
            ctx.lineTo(px1, py1);
            ctx.lineTo(px1, py1 + depth);
            ctx.lineTo(px0, py0 + depth);
            ctx.closePath();
            ctx.fillStyle = PAD_COLOR[p.kind] || PAD_COLOR.green;
            ctx.globalAlpha = 0.85;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(px0, py0); ctx.lineTo(px1, py1); ctx.stroke();
            ctx.restore();
        });

        list('extra').forEach(function (wl, i) {
            var selected = S.sel && S.sel.key === 'extra' && S.sel.idx === i;
            var x0 = sx(wl.x), x1 = sx(wl.x + wl.w);
            var yBase = sy(wl.base !== undefined ? wl.base : -0.4);
            var yTop = sy((wl.base !== undefined ? wl.base : -0.4) + wl.h);
            var left = Math.min(x0, x1), width = Math.max(4, Math.abs(x1 - x0));
            var top = Math.min(yBase, yTop), height = Math.abs(yBase - yTop);

            ctx.save();
            ctx.fillStyle = EXTRA_KIND_COLOR[wl.kind] || '#6d4a2e';
            ctx.strokeStyle = selected ? '#58a6ff' : 'rgba(0,0,0,0.6)';
            ctx.lineWidth = 1.5;
            ctx.fillRect(left, top, width, height);
            ctx.strokeRect(left, top, width, height);
            ctx.restore();
        });

        (list('decor') || []).forEach(function (d, i) {
            var px = sx(d.x), py = sy(d.y || 0);
            var selected = S.sel && S.sel.key === 'decor' && S.sel.idx === i;
            ctx.save();
            ctx.strokeStyle = selected ? '#58a6ff' : '#e3b341';
            ctx.fillStyle = '#e3b341';
            ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill(); ctx.stroke();
            ctx.restore();
        });

        var pxTee = sx(S.hole.tee.x), pyTee = sy(0);
        ctx.fillStyle = '#e6edf3';
        ctx.beginPath(); ctx.arc(pxTee, pyTee, 6, 0, 7); ctx.fill();

        var pxCup = sx(S.hole.cup.x), pyCup = sy(0);
        ctx.fillStyle = '#f2c744';
        ctx.beginPath(); ctx.arc(pxCup, pyCup, 6, 0, 7); ctx.fill();

        if (world) {
            ctx.beginPath();
            ctx.arc(sx(world.ball.x), sy(world.ball.y), Math.max(2.5, C.BALL_R * view.scale), 0, 7);
            ctx.fillStyle = '#ffffff'; ctx.fill();
        }
    }

    function draw() {
        var w = planCanvas.clientWidth, h = planCanvas.clientHeight;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0f14';
        ctx.fillRect(0, 0, w, h);
        if (S.grid) drawGrid();

        if (planProj === 'side') {
            drawSideElevation();
        } else if (planProj === 'front') {
            drawFrontElevation();
        } else {
            drawTopView();
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

    function drawPushArrow(p) {
        var cx = sx(p.x + p.w / 2), cz = sz(p.z + p.d / 2);
        var g = Math.sqrt(p.push.x * p.push.x + p.push.z * p.push.z);
        if (!g) return;
        var ux = p.push.x / g, uz = p.push.z / g;
        var len = Math.min(p.w, p.d) * view.scale * 0.4;
        ctx.strokeStyle = 'rgba(240,180,60,.9)';
        ctx.fillStyle = 'rgba(240,180,60,.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - ux * len, cz - uz * len);
        ctx.lineTo(cx + ux * len, cz + uz * len);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + ux * len, cz + uz * len);
        ctx.lineTo(cx + ux * len * 0.55 - uz * len * 0.3, cz + uz * len * 0.55 + ux * len * 0.3);
        ctx.lineTo(cx + ux * len * 0.55 + uz * len * 0.3, cz + uz * len * 0.55 - ux * len * 0.3);
        ctx.fill();
    }

    function drawSpring(p) {
        var cx = sx(p.x + p.w / 2), cz = sz(p.z + p.d / 2);
        var r = (p.r || Math.min(p.w, p.d) / 2) * view.scale;
        ctx.strokeStyle = 'rgba(240,180,60,.9)';
        ctx.lineWidth = 2;
        var k;
        for (k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.arc(cx, cz, r * (0.35 + k * 0.3), 0, 7);
            ctx.stroke();
        }
    }

    function drawPipes() {
        var ws = S.hole.warps;
        if (!ws || !ws.length) return;
        ctx.save();
        ws.forEach(function (w, i) {
            var selected = S.sel && S.sel.key === 'warps' && S.sel.idx === i;
            var ax = sx(w.x), az = sz(w.z), bx = sx(w.tx), bz = sz(w.tz);
            var r = Math.max(3, (w.r || 0.85) * view.scale);
            ctx.setLineDash([5, 4]);
            ctx.strokeStyle = selected ? '#58a6ff' : 'rgba(121,192,255,.45)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ax, az); ctx.lineTo(bx, bz); ctx.stroke();
            ctx.setLineDash([]);
            ctx.strokeStyle = selected ? '#58a6ff' : '#79c0ff';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(ax, az, r, 0, 7); ctx.stroke();
            ctx.fillStyle = 'rgba(121,192,255,.18)';
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(bx - r * 0.6, bz - r * 0.6); ctx.lineTo(bx + r * 0.6, bz + r * 0.6);
            ctx.moveTo(bx + r * 0.6, bz - r * 0.6); ctx.lineTo(bx - r * 0.6, bz + r * 0.6);
            ctx.stroke();

            // Exit direction arrow
            if (w.yaw !== undefined) {
                var yaw = w.yaw;
                var arrowLen = Math.max(12, r * 1.4);
                var arrowEx = bx + Math.sin(yaw) * arrowLen;
                var arrowEz = bz + Math.cos(yaw) * arrowLen;
                ctx.strokeStyle = '#79c0ff';
                ctx.beginPath(); ctx.moveTo(bx, bz); ctx.lineTo(arrowEx, arrowEz); ctx.stroke();
            }
        });
        ctx.restore();
    }

    function drawDecor() {
        var decs = S.hole.decor;
        if (!decs || !decs.length) return;
        ctx.save();
        decs.forEach(function (d, i) {
            var px = sx(d.x), pz = sz(d.z);
            var selected = S.sel && S.sel.key === 'decor' && S.sel.idx === i;
            var scale = (d.scale || 1) * view.scale * 0.45;
            ctx.save();
            ctx.translate(px, pz);
            ctx.rotate(-(d.yaw || 0));

            ctx.lineWidth = 1.5;
            if (d.kind === 'buoy') {
                ctx.fillStyle = d.variant === 1 ? '#e3b341' : '#f0523e';
                ctx.strokeStyle = selected ? '#58a6ff' : '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, Math.max(4, scale), 0, 7);
                ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, Math.max(2, scale * 0.45), 0, 7);
                ctx.fill();
            } else if (d.kind === 'piling') {
                ctx.fillStyle = '#6d4a2e';
                ctx.strokeStyle = selected ? '#58a6ff' : '#000000';
                [-scale * 0.5, 0, scale * 0.5].forEach(function (dx, k) {
                    var dy = (k % 2 === 0 ? -scale * 0.3 : scale * 0.3);
                    ctx.beginPath();
                    ctx.arc(dx, dy, Math.max(2.5, scale * 0.35), 0, 7);
                    ctx.fill(); ctx.stroke();
                });
            } else if (d.kind === 'bench') {
                ctx.fillStyle = '#8a6337';
                ctx.strokeStyle = selected ? '#58a6ff' : '#2b1d0c';
                ctx.fillRect(-scale * 1.0, -scale * 0.35, scale * 2.0, scale * 0.7);
                ctx.strokeRect(-scale * 1.0, -scale * 0.35, scale * 2.0, scale * 0.7);
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.moveTo(-scale * 1.0, 0); ctx.lineTo(scale * 1.0, 0);
                ctx.stroke();
            } else if (d.kind === 'boat' || d.kind === 'rowboat') {
                ctx.fillStyle = '#a67c52';
                ctx.strokeStyle = selected ? '#58a6ff' : '#332211';
                ctx.beginPath();
                ctx.moveTo(0, -scale * 1.4);
                ctx.bezierCurveTo(scale * 0.8, -scale * 0.5, scale * 0.7, scale * 0.9, 0, scale * 1.2);
                ctx.bezierCurveTo(-scale * 0.7, scale * 0.9, -scale * 0.8, -scale * 0.5, 0, -scale * 1.4);
                ctx.fill(); ctx.stroke();
                ctx.strokeStyle = 'rgba(0,0,0,0.4)';
                ctx.beginPath();
                ctx.moveTo(-scale * 0.5, 0); ctx.lineTo(scale * 0.5, 0);
                ctx.stroke();
            } else if (d.kind === 'sailboat') {
                ctx.fillStyle = '#f0f3f6';
                ctx.strokeStyle = selected ? '#58a6ff' : '#234455';
                ctx.beginPath();
                ctx.moveTo(0, -scale * 1.6);
                ctx.bezierCurveTo(scale * 0.7, -scale * 0.6, scale * 0.65, scale * 1.0, 0, scale * 1.4);
                ctx.bezierCurveTo(-scale * 0.65, scale * 1.0, -scale * 0.7, -scale * 0.6, 0, -scale * 1.6);
                ctx.fill(); ctx.stroke();
                // Boom & Sail
                ctx.strokeStyle = '#388bfd';
                ctx.lineWidth = 2.0;
                ctx.beginPath();
                ctx.moveTo(0, -scale * 0.2); ctx.lineTo(scale * 0.6, scale * 0.7);
                ctx.stroke();
                // Mast
                ctx.fillStyle = '#23262a';
                ctx.beginPath(); ctx.arc(0, -scale * 0.2, Math.max(2, scale * 0.2), 0, 7); ctx.fill();
            } else if (d.kind === 'barrel') {
                ctx.fillStyle = '#7a4e28';
                ctx.strokeStyle = selected ? '#58a6ff' : '#2a1a0d';
                ctx.beginPath();
                ctx.arc(0, 0, Math.max(3.5, scale * 0.65), 0, 7);
                ctx.fill(); ctx.stroke();
                ctx.strokeStyle = 'rgba(0,0,0,0.35)';
                ctx.beginPath(); ctx.arc(0, 0, Math.max(2, scale * 0.4), 0, 7); ctx.stroke();
            } else if (d.kind === 'crate') {
                ctx.fillStyle = '#a87842';
                ctx.strokeStyle = selected ? '#58a6ff' : '#3d2510';
                var cs = Math.max(4, scale * 0.65);
                ctx.fillRect(-cs, -cs, cs * 2, cs * 2);
                ctx.strokeRect(-cs, -cs, cs * 2, cs * 2);
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.moveTo(-cs, -cs); ctx.lineTo(cs, cs);
                ctx.moveTo(cs, -cs); ctx.lineTo(-cs, cs);
                ctx.stroke();
            } else if (d.kind === 'palm') {
                ctx.fillStyle = '#2ea44f';
                ctx.strokeStyle = selected ? '#58a6ff' : '#145c26';
                ctx.beginPath();
                for (var f = 0; f < 6; f++) {
                    var fa = f * Math.PI / 3;
                    var fl = scale * 1.3;
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(fa) * fl, Math.sin(fa) * fl);
                }
                ctx.stroke();
                ctx.fillStyle = '#7a5127';
                ctx.beginPath(); ctx.arc(0, 0, Math.max(2.5, scale * 0.35), 0, 7); ctx.fill(); ctx.stroke();
            } else if (d.kind === 'pine') {
                ctx.fillStyle = '#236938';
                ctx.strokeStyle = selected ? '#58a6ff' : '#0d381b';
                ctx.beginPath();
                var pts = 8;
                for (var pIdx = 0; pIdx < pts * 2; pIdx++) {
                    var pa = pIdx * Math.PI / pts;
                    var pr = (pIdx % 2 === 0) ? scale * 1.2 : scale * 0.6;
                    var px0 = Math.cos(pa) * pr, py0 = Math.sin(pa) * pr;
                    if (pIdx === 0) ctx.moveTo(px0, py0); else ctx.lineTo(px0, py0);
                }
                ctx.closePath();
                ctx.fill(); ctx.stroke();
            } else if (d.kind === 'sign') {
                ctx.fillStyle = '#c79c5e';
                ctx.strokeStyle = selected ? '#58a6ff' : '#452a10';
                ctx.fillRect(-scale * 0.8, -scale * 0.3, scale * 1.6, scale * 0.6);
                ctx.strokeRect(-scale * 0.8, -scale * 0.3, scale * 1.6, scale * 0.6);
                ctx.fillStyle = '#452a10';
                ctx.beginPath(); ctx.arc(0, scale * 0.4, Math.max(2, scale * 0.2), 0, 7); ctx.fill();
            } else if (d.kind === 'windmill') {
                ctx.fillStyle = '#d9d2c5';
                ctx.strokeStyle = selected ? '#58a6ff' : '#575147';
                var ws = Math.max(5, scale * 0.85);
                ctx.fillRect(-ws, -ws, ws * 2, ws * 2);
                ctx.strokeRect(-ws, -ws, ws * 2, ws * 2);
                ctx.strokeStyle = selected ? '#58a6ff' : '#9e2a2b';
                ctx.lineWidth = 2.0;
                var bl = scale * 1.6;
                ctx.beginPath();
                ctx.moveTo(-bl, 0); ctx.lineTo(bl, 0);
                ctx.moveTo(0, -bl); ctx.lineTo(0, bl);
                ctx.stroke();
                ctx.fillStyle = '#e8a598';
                ctx.fillRect(bl * 0.4, -scale * 0.2, bl * 0.5, scale * 0.4);
                ctx.fillRect(-bl * 0.9, -scale * 0.2, bl * 0.5, scale * 0.4);
                ctx.fillRect(-scale * 0.2, bl * 0.4, scale * 0.4, bl * 0.5);
                ctx.fillRect(-scale * 0.2, -bl * 0.9, scale * 0.4, bl * 0.5);
            } else { // bin
                ctx.fillStyle = '#484f58';
                ctx.strokeStyle = selected ? '#58a6ff' : '#21262d';
                ctx.beginPath();
                ctx.arc(0, 0, Math.max(3.5, scale * 0.6), 0, 7);
                ctx.fill(); ctx.stroke();
            }

            if (selected) {
                ctx.strokeStyle = '#58a6ff';
                ctx.lineWidth = 2;
                var arrLen = Math.max(14, scale * 1.6);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -arrLen);
                ctx.lineTo(-3, -arrLen + 5);
                ctx.moveTo(0, -arrLen);
                ctx.lineTo(3, -arrLen + 5);
                ctx.stroke();
            }

            ctx.restore();
            if (view.scale > 30) {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(d.kind, px, pz + scale + 10);
            }
        });
        ctx.restore();
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
        if (planProj === 'side') {
            if (S.sel.key === 'tee' || S.sel.key === 'cup') {
                var m = S.hole[S.sel.key];
                var pz = sz(m.z), py = sy(0);
                ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(pz, py, 11, 0, 7); ctx.stroke();
                return;
            }
            var s = selShape();
            if (!s) return;
            var z0 = sz(s.z), z1 = sz(s.z + (s.d || (s.r ? s.r * 2 : 2)));
            var y0 = sy(s.y !== undefined ? s.y : (s.base !== undefined ? s.base : 0));
            var y1 = sy((s.y !== undefined ? s.y : (s.base !== undefined ? s.base : 0)) + (s.h || 0.6));
            ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 2;
            ctx.strokeRect(Math.min(z0, z1), Math.min(y0, y1), Math.abs(z1 - z0), Math.abs(y0 - y1));
            return;
        }

        if (planProj === 'front') {
            if (S.sel.key === 'tee' || S.sel.key === 'cup') {
                var m = S.hole[S.sel.key];
                var px = sx(m.x), py = sy(0);
                ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(px, py, 11, 0, 7); ctx.stroke();
                return;
            }
            var s = selShape();
            if (!s) return;
            var x0 = sx(s.x), x1 = sx(s.x + (s.w || (s.r ? s.r * 2 : 2)));
            var y0 = sy(s.y !== undefined ? s.y : (s.base !== undefined ? s.base : 0));
            var y1 = sy((s.y !== undefined ? s.y : (s.base !== undefined ? s.base : 0)) + (s.h || 0.6));
            ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 2;
            ctx.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y0 - y1));
            return;
        }

        // Top view selection
        if (S.sel.key === 'tee' || S.sel.key === 'cup') {
            var m = S.hole[S.sel.key];
            ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(sx(m.x), sz(m.z), 11, 0, 7); ctx.stroke();
            return;
        }
        var s = selShape();
        if (!s) return;
        ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 2;
        if (S.sel.key === 'decor') {
            ctx.beginPath(); ctx.arc(sx(s.x), sz(s.z), Math.max(8, (s.scale || 1) * view.scale * 0.5), 0, 7); ctx.stroke();
            return;
        }
        if (S.sel.key === 'warps') {
            var r = (s.r || 0.85) * view.scale;
            ctx.beginPath(); ctx.arc(sx(s.x), sz(s.z), r + 4, 0, 7); ctx.stroke();
            ctx.beginPath(); ctx.arc(sx(s.tx), sz(s.tz), r + 4, 0, 7); ctx.stroke();
            return;
        }
        if (s.r) {
            padPath(s); ctx.stroke();
        } else {
            rectPath(s); ctx.stroke();
        }
        // Corner grips
        corners(s).forEach(function (c) {
            ctx.fillStyle = '#58a6ff';
            ctx.fillRect(c.px - 3, c.pz - 3, 6, 6);
        });
    }

    function corners(s) {
        if (!s) return [];
        if (s.r) {
            var cx = sx(s.x + s.w / 2), cz = sz(s.z + s.d / 2);
            var r = s.r * view.scale;
            return [
                { hx: -1, hz: 0, px: cx - r, pz: cz },
                { hx: 1, hz: 0, px: cx + r, pz: cz },
                { hx: 0, hz: -1, px: cx, pz: cz - r },
                { hx: 0, hz: 1, px: cx, pz: cz + r }
            ];
        }
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
            if (!m) continue;
            if (planProj === 'side') {
                if (Math.hypot(px - sz(m.z), pz - sy(0)) <= 12) return names[i];
            } else if (planProj === 'front') {
                if (Math.hypot(px - sx(m.x), pz - sy(0)) <= 12) return names[i];
            } else {
                if (Math.hypot(px - sx(m.x), pz - sz(m.z)) <= 10) return names[i];
            }
        }
        return null;
    }

    function shapeAt(px, pz) {
        var i, k, arr, s;
        if (planProj === 'side') {
            var z = wz(px), y = wy(pz);
            for (k = LISTS.length - 1; k >= 0; k--) {
                arr = list(LISTS[k].key) || [];
                for (i = arr.length - 1; i >= 0; i--) {
                    s = arr[i];
                    if (LISTS[k].key === 'decor') {
                        if (Math.hypot(px - sz(s.z), pz - sy(s.y || 0)) <= 14) return { key: 'decor', idx: i };
                    } else if (LISTS[k].key === 'warps') {
                        if (Math.hypot(px - sz(s.z), pz - sy(0)) <= 12 || Math.hypot(px - sz(s.tz), pz - sy(0)) <= 12) {
                            return { key: 'warps', idx: i };
                        }
                    } else if (LISTS[k].key === 'extra') {
                        var yb = s.base !== undefined ? s.base : -0.4, yt = yb + (s.h || 0.6);
                        if (z >= s.z && z <= s.z + s.d && y >= yb - 0.25 && y <= yt + 0.25) {
                            return { key: 'extra', idx: i };
                        }
                    } else if (LISTS[k].key === 'pads') {
                        var padY = (s.y || 0) + (s.sz || 0) * (z - s.z);
                        if (z >= s.z && z <= s.z + s.d && Math.abs(y - padY) <= 0.45) {
                            return { key: 'pads', idx: i };
                        }
                    } else if (LISTS[k].key === 'water') {
                        if (z >= s.z && z <= s.z + s.d && y <= (s.y || -0.6) + 0.2 && y >= (s.y || -0.6) - 0.7) {
                            return { key: 'water', idx: i };
                        }
                    } else if (z >= s.z && z <= s.z + s.d) {
                        return { key: LISTS[k].key, idx: i };
                    }
                }
            }
            return null;
        }

        if (planProj === 'front') {
            var x = wx(px), y = wy(pz);
            for (k = LISTS.length - 1; k >= 0; k--) {
                arr = list(LISTS[k].key) || [];
                for (i = arr.length - 1; i >= 0; i--) {
                    s = arr[i];
                    if (LISTS[k].key === 'decor') {
                        if (Math.hypot(px - sx(s.x), pz - sy(s.y || 0)) <= 14) return { key: 'decor', idx: i };
                    } else if (LISTS[k].key === 'warps') {
                        if (Math.hypot(px - sx(s.x), pz - sy(0)) <= 12 || Math.hypot(px - sx(s.tx), pz - sy(0)) <= 12) {
                            return { key: 'warps', idx: i };
                        }
                    } else if (LISTS[k].key === 'extra') {
                        var yb = s.base !== undefined ? s.base : -0.4, yt = yb + (s.h || 0.6);
                        if (x >= s.x && x <= s.x + s.w && y >= yb - 0.25 && y <= yt + 0.25) {
                            return { key: 'extra', idx: i };
                        }
                    } else if (LISTS[k].key === 'pads') {
                        var padY = (s.y || 0) + (s.sx || 0) * (x - s.x);
                        if (x >= s.x && x <= s.x + s.w && Math.abs(y - padY) <= 0.45) {
                            return { key: 'pads', idx: i };
                        }
                    } else if (x >= s.x && x <= s.x + s.w) {
                        return { key: LISTS[k].key, idx: i };
                    }
                }
            }
            return null;
        }

        // Top view
        var x = wx(px), z = wz(pz);
        for (k = LISTS.length - 1; k >= 0; k--) {
            arr = list(LISTS[k].key) || [];
            for (i = arr.length - 1; i >= 0; i--) {
                s = arr[i];
                if (LISTS[k].key === 'decor') {
                    if (Math.hypot(x - s.x, z - s.z) <= Math.max(0.55, (s.scale || 1) * 0.8)) return { key: 'decor', idx: i };
                } else if (LISTS[k].key === 'warps') {
                    var r = s.r || 0.85;
                    if (Math.hypot(x - s.x, z - s.z) <= r || Math.hypot(x - s.tx, z - s.tz) <= r) {
                        return { key: 'warps', idx: i };
                    }
                } else if (LISTS[k].key === 'extra' && s.yaw) {
                    var B = P.wallBox(s, 0);
                    if (P.circleBox(x, z, 0.2, B)) return { key: 'extra', idx: i };
                } else if (s.r) {
                    var cx = s.x + s.w / 2, cz = s.z + s.d / 2;
                    if (Math.hypot(x - cx, z - cz) <= s.r) return { key: LISTS[k].key, idx: i };
                } else if (x >= s.x && x <= s.x + s.w && z >= s.z && z <= s.z + s.d) {
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

    function listKeyForTool(tool) {
        if (tool === 'pads' || tool === 'pad' || tool === 'disc' || tool === 'belt' || tool === 'sprung') return 'pads';
        if (tool === 'extra' || tool === 'bumper' || tool === 'spinner' || tool === 'slider' || tool === 'flipper' || tool === 'beam' || tool === 'tree' || tool === 'rock') return 'extra';
        if (tool === 'water') return 'water';
        if (tool === 'gaps') return 'gaps';
        if (tool === 'pipe' || tool === 'warps') return 'warps';
        if (tool === 'decor') return 'decor';
        return null;
    }

    function defaultsFor(key, x, z) {
        var o = { x: x, z: z, w: MIN_SIDE, d: MIN_SIDE };
        if (key === 'pads' || key === 'pad') {
            o = { x: x, z: z, w: 4, d: 4, y: 0, kind: S.padKind, sx: 0, sz: 0 };
        } else if (key === 'disc') {
            o = { x: x - 1.5, z: z - 1.5, w: 3, d: 3, r: 1.5, inlay: true, kind: S.padKind, y: 0, sx: 0, sz: 0 };
        } else if (key === 'belt') {
            o = { x: x, z: z, w: 2, d: 5, y: 0, kind: S.padKind === 'green' ? 'wood' : S.padKind, push: { x: 0, z: 3 } };
        } else if (key === 'sprung') {
            o = { x: x - 0.8, z: z - 0.8, w: 1.6, d: 1.6, r: 0.8, rIn: 0.8, inlay: true, kind: 'wood', y: 0, spring: 8.5 };
        } else if (key === 'extra') {
            o = { x: x, z: z, w: 3, d: 0.34, h: 0.6, base: -0.1, kind: 'rail', yaw: 0 };
        } else if (key === 'bumper') {
            o = { x: x - 0.25, z: z - 0.25, w: 0.5, d: 0.5, h: 0.5, base: -0.1, kind: 'bumper', yaw: 0 };
        } else if (key === 'spinner') {
            o = { x: x - 1.25, z: z - 0.15, w: 2.5, d: 0.3, h: 0.6, base: -0.1, spin: 1.6, kind: 'blade', yaw: 0 };
        } else if (key === 'slider') {
            o = { x: x - 1.25, z: z - 0.15, w: 2.5, d: 0.3, h: 0.6, base: -0.1, move: { axis: 'x', amp: 1.5, speed: 1.1, phase: 0 }, kind: 'gate', yaw: 0 };
        } else if (key === 'flipper') {
            o = { x: x - 1.1, z: z - 0.17, w: 2.2, d: 0.34, h: 0.6, base: -0.1, swing: { from: -0.5, to: 0.5, speed: 2.2, phase: 0 }, kind: 'blade', yaw: 0 };
        } else if (key === 'beam') {
            o = { x: x - 1.5, z: z - 0.14, w: 3.0, d: 0.28, h: 1.35, base: 0.55, kind: 'beam', yaw: 0 };
        } else if (key === 'tree') {
            o = { x: x - 0.31, z: z - 0.31, w: 0.62, d: 0.62, h: 2.4, base: -0.4, kind: 'tree', seat: 0.4 };
        } else if (key === 'rock') {
            o = { x: x - 0.575, z: z - 0.575, w: 1.15, d: 1.15, h: 0.85, base: -0.3, kind: 'rock', seat: 0.3 };
        } else if (key === 'water') {
            o = { x: x, z: z, w: 4, d: 4, y: -0.6 };
        } else if (key === 'gaps') {
            o = { x: x, z: z, w: 2, d: 2 };
        } else if (key === 'pipe') {
            o = { x: x, z: z, tx: x, tz: z + 4, r: 0.85, yaw: 0 };
        } else if (key === 'decor') {
            var dKind = S.decorKind || 'buoy';
            var isAquatic = (dKind === 'buoy' || dKind === 'piling' || dKind === 'boat' || dKind === 'rowboat' || dKind === 'sailboat');
            var initY = 0;
            if (S.hole) {
                var wtr = P.waterAt ? P.waterAt(S.hole, x, z) : null;
                var st = P.surfaceTop ? P.surfaceTop(S.hole, x, z) : null;
                var thm = G3.THEMES && G3.THEMES[S.hole.theme];
                if (isAquatic) {
                    if (wtr) initY = wtr.y;
                    else if (thm && thm.surroundY !== undefined) initY = thm.surroundY;
                    else if (st) initY = st.y;
                } else {
                    if (st) initY = st.y;
                    else if (wtr) initY = wtr.y;
                    else if (thm && thm.surroundY !== undefined) initY = thm.surroundY;
                }
            }
            o = { kind: dKind, x: x, z: z, y: Math.round(initY * 100) / 100, yaw: 0, pitch: 0, roll: 0, scale: 1, variant: 0 };
        }
        return o;
    }

    function onPlanDown(e) {
        planCanvas.setPointerCapture(e.pointerId);
        var p = planPoint(e);
        mouse.sx = p.px; mouse.sy = p.pz;

        if (e.button === 1 || spaceHeld) {
            drag = { type: 'pan', px: p.px, pz: p.pz, vx: view.x, vz: view.z, vy: view.y };
            return;
        }
        if (mode === 'play') return;

        // Elevation Profile Side View (Z / Y)
        if (planProj === 'side') {
            var mk = markerAt(p.px, p.pz);
            if (mk && S.tool === 'select') {
                pushHistory();
                S.sel = { key: mk };
                drag = { type: 'marker_elev', which: mk };
                changed();
                return;
            }
            var hit = shapeAt(p.px, p.pz);
            S.sel = hit;
            if (hit) {
                pushHistory();
                var s = selShape();
                var currentY = s.y !== undefined ? s.y : (s.base !== undefined ? s.base : 0);
                drag = { type: 'move_elev', oz: wz(p.px) - s.z, oy: wy(p.pz) - currentY };
            }
            changed();
            return;
        }

        // Front Cross-Section View (X / Y)
        if (planProj === 'front') {
            var mk = markerAt(p.px, p.pz);
            if (mk && S.tool === 'select') {
                pushHistory();
                S.sel = { key: mk };
                drag = { type: 'marker_front', which: mk };
                changed();
                return;
            }
            var hit = shapeAt(p.px, p.pz);
            S.sel = hit;
            if (hit) {
                pushHistory();
                var s = selShape();
                var currentY = s.y !== undefined ? s.y : (s.base !== undefined ? s.base : 0);
                drag = { type: 'move_front', ox: wx(p.px) - s.x, oy: wy(p.pz) - currentY };
            }
            changed();
            return;
        }

        // Standard Top-Down Plan View (X / Z)
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
                x0: s0.x, z0: s0.z, w0: s0.w, d0: s0.d, r0: s0.r
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

        // Tool placement
        pushHistory();
        var nx = snapped(wx(p.px), e), nz = snapped(wz(p.pz), e);
        var targetListKey = listKeyForTool(S.tool);
        if (!targetListKey) return;

        var shapeData = defaultsFor(S.tool, nx, nz);
        var shape = cloneShape(targetListKey, shapeData);
        list(targetListKey).push(shape);
        S.sel = { key: targetListKey, idx: list(targetListKey).length - 1 };

        if (S.tool === 'pipe') {
            drag = { type: 'pipe_drag', ax: nx, az: nz };
        } else if (S.tool === 'disc' || S.tool === 'sprung') {
            drag = { type: 'disc_drag', ax: nx, az: nz };
        } else if (['bumper', 'tree', 'rock', 'decor'].indexOf(S.tool) !== -1) {
            // Instant stamped objects
            drag = null;
        } else {
            // Rect drag
            shape.w = MIN_SIDE; shape.d = MIN_SIDE;
            drag = { type: 'draw', ax: nx, az: nz };
        }
        changed();
    }

    function onPlanMove(e) {
        var p = planPoint(e);
        mouse.sx = p.px; mouse.sy = p.pz;
        mouse.wx = wx(p.px); mouse.wz = wz(p.pz); mouse.wy = wy(p.pz);

        if (!drag) {
            planCanvas.style.cursor = spaceHeld ? 'grab'
                : (S.tool !== 'select' ? 'crosshair'
                : (gripAt(p.px, p.pz) ? 'nwse-resize'
                : (markerAt(p.px, p.pz) || shapeAt(p.px, p.pz) ? 'move' : 'default')));
            syncStatus();
            return;
        }

        if (drag.type === 'pan') {
            if (planProj === 'side') {
                view.z = drag.vz - (p.px - drag.px) / view.scale;
                view.y = (drag.vy || 0) + (p.pz - drag.pz) / view.scale;
            } else if (planProj === 'front') {
                view.x = drag.vx - (p.px - drag.px) / view.scale;
                view.y = (drag.vy || 0) + (p.pz - drag.pz) / view.scale;
            } else {
                view.x = drag.vx - (p.px - drag.px) / view.scale;
                view.z = drag.vz - (p.pz - drag.pz) / view.scale;
            }
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
        if (drag.type === 'marker_elev') {
            var m = S.hole[drag.which];
            m.z = snapped(wz(p.px), e);
            changed(false);
            return;
        }
        if (drag.type === 'marker_front') {
            var m = S.hole[drag.which];
            m.x = snapped(wx(p.px), e);
            changed(false);
            return;
        }

        var s = selShape();
        if (!s) return;

        if (drag.type === 'move_elev') {
            s.z = snapped(wz(p.px) - drag.oz, e);
            var ny = Math.round((wy(p.pz) - drag.oy) * 10) / 10;
            if (s.base !== undefined) s.base = ny; else s.y = ny;
            changed(false);
            return;
        }

        if (drag.type === 'move_front') {
            s.x = snapped(wx(p.px) - drag.ox, e);
            var ny = Math.round((wy(p.pz) - drag.oy) * 10) / 10;
            if (s.base !== undefined) s.base = ny; else s.y = ny;
            changed(false);
            return;
        }

        if (drag.type === 'move') {
            s.x = snapped(wx(p.px) - drag.ox, e);
            s.z = snapped(wz(p.pz) - drag.oz, e);
        } else if (drag.type === 'pipe_drag') {
            var bx = snapped(wx(p.px), e), bz = snapped(wz(p.pz), e);
            s.tx = bx; s.tz = bz;
            s.yaw = Math.atan2(bx - s.x, bz - s.z);
        } else if (drag.type === 'disc_drag') {
            var bx = snapped(wx(p.px), e), bz = snapped(wz(p.pz), e);
            var rad = Math.max(0.5, Math.hypot(bx - drag.ax, bz - drag.az));
            s.r = rad; s.w = rad * 2; s.d = rad * 2;
            s.x = drag.ax - rad; s.z = drag.az - rad;
        } else if (drag.type === 'draw') {
            var bx = snapped(wx(p.px), e), bz = snapped(wz(p.pz), e);
            s.x = Math.min(drag.ax, bx); s.z = Math.min(drag.az, bz);
            s.w = Math.max(MIN_SIDE, Math.abs(bx - drag.ax));
            s.d = Math.max(MIN_SIDE, Math.abs(bz - drag.az));
        } else if (drag.type === 'resize') {
            var gx = snapped(wx(p.px), e), gz = snapped(wz(p.pz), e);
            if (s.r) {
                var cx = s.x + s.w / 2, cz = s.z + s.d / 2;
                var nr = Math.max(MIN_SIDE, Math.hypot(gx - cx, gz - cz));
                s.r = nr; s.w = nr * 2; s.d = nr * 2;
                s.x = cx - nr; s.z = cz - nr;
            } else {
                if (drag.hx < 0) { var rx = drag.x0 + drag.w0; s.x = Math.min(gx, rx - MIN_SIDE); s.w = rx - s.x; }
                else if (drag.hx > 0) { s.w = Math.max(MIN_SIDE, gx - drag.x0); s.x = drag.x0; }
                if (drag.hz < 0) { var rz = drag.z0 + drag.d0; s.z = Math.min(gz, rz - MIN_SIDE); s.d = rz - s.z; }
                else if (drag.hz > 0) { s.d = Math.max(MIN_SIDE, gz - drag.z0); s.z = drag.z0; }
            }
        }
        if (S.sel.key === 'pads') squareUp(s);
        changed(false);
    }

    function onPlanUp() {
        if (drag && drag.type !== 'pan') {
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
        if ($('f-decorkind')) $('f-decorkind').value = S.decorKind || 'buoy';
    }

    function syncShapeList() {
        var host = $('shape-list');
        host.innerHTML = '';
        var total = 0;
        LISTS.forEach(function (L) {
            (list(L.key) || []).forEach(function (s, i) {
                total++;
                var row = document.createElement('div');
                row.className = 'sitem' + (S.sel && S.sel.key === L.key && S.sel.idx === i ? ' active' : '');
                var sw = document.createElement('i');
                sw.className = 'swatch' + (s.r ? ' round' : '');
                if (L.key === 'pads') sw.style.background = PAD_COLOR[s.kind] || L.color;
                else if (L.key === 'extra') sw.style.background = EXTRA_KIND_COLOR[s.kind] || L.color;
                else sw.style.background = L.color;

                var name = document.createElement('span');
                name.className = 'sname';

                var does = s.swing ? ' flipper' : s.spin ? ' blade' : s.move ? ' gate'
                    : s.spring ? ' sprung' : s.push ? ' belt' : '';
                var label = L.label;
                if (L.key === 'pads') label = s.kind;
                else if (L.key === 'extra' && s.kind && s.kind !== 'rail') label = s.kind;
                else if (L.key === 'decor') label = (DECOR_KIND_LABEL[s.kind] || s.kind);

                var dims = '';
                if (L.key === 'warps') dims = '⌀' + ((s.r || 0.85) * 2).toFixed(2);
                else if (L.key === 'decor') dims = 'x' + (s.scale || 1).toFixed(1);
                else if (s.r) dims = '⌀' + (s.r * 2).toFixed(2);
                else dims = s.w.toFixed(2) + '×' + s.d.toFixed(2);

                name.textContent = label + ' ' + dims + does;
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

    function toggle(host, label, on, set) {
        var row = document.createElement('div');
        row.className = 'row';
        var lb = document.createElement('label');
        lb.className = 'lbl';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = on;
        cb.addEventListener('change', function () {
            pushHistory();
            set(cb.checked);
            changed();
            syncInspector();
        });
        lb.appendChild(cb);
        lb.appendChild(document.createTextNode(' ' + label));
        row.appendChild(lb);
        host.appendChild(row);
        return cb;
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
        head(host, (s.kind || L.label));

        if (S.sel.key === 'warps') {
            head(host, 'Entrance (Mouth)');
            field(host, 'x', function () { return s.x; }, function (v) { s.x = v; });
            field(host, 'z', function () { return s.z; }, function (v) { s.z = v; });
            field(host, 'radius (r)', function () { return s.r; }, function (v) { s.r = Math.max(0.2, v); }, 0.05);

            head(host, 'Exit (Destination)');
            field(host, 'tx', function () { return s.tx; }, function (v) { s.tx = v; });
            field(host, 'tz', function () { return s.tz; }, function (v) { s.tz = v; });
            field(host, 'exit yaw (rad)', function () { return s.yaw; }, function (v) { s.yaw = v; }, 0.1);
            note(host, 'A warp pipe is a one-way chute: enters at mouth (x,z) and exits at destination (tx,tz) facing yaw.');
            return;
        }

        if (S.sel.key === 'decor') {
            pick(host, 'kind', ['buoy', 'piling', 'bench', 'boat', 'sailboat', 'bin', 'barrel', 'crate', 'palm', 'pine', 'sign', 'windmill'],
                function () { return s.kind; }, function (v) { s.kind = v; });
            field(host, 'x', function () { return s.x; }, function (v) { s.x = v; });
            field(host, 'z', function () { return s.z; }, function (v) { s.z = v; });
            field(host, 'y (height)', function () { return s.y || 0; }, function (v) { s.y = v; }, 0.05);

            var snapRow = document.createElement('div');
            snapRow.className = 'row';
            var btnAuto = document.createElement('button');
            btnAuto.className = 'btn';
            btnAuto.textContent = 'Auto-snap elevation';
            btnAuto.title = 'Snap elevation to the ground or water surface top under (x, z)';
            btnAuto.style.flex = '1';
            btnAuto.addEventListener('click', function () {
                pushHistory();
                var kind = s.kind;
                var isAquatic = (kind === 'buoy' || kind === 'piling' || kind === 'boat' || kind === 'rowboat' || kind === 'sailboat');
                var defY = 0;
                if (S.hole) {
                    var w = P.waterAt ? P.waterAt(S.hole, s.x, s.z) : null;
                    var surfTop = P.surfaceTop ? P.surfaceTop(S.hole, s.x, s.z) : null;
                    var thm = G3.THEMES && G3.THEMES[S.hole.theme];
                    if (isAquatic) {
                        if (w) defY = w.y;
                        else if (thm && thm.surroundY !== undefined) defY = thm.surroundY;
                        else if (surfTop) defY = surfTop.y;
                    } else {
                        if (surfTop) defY = surfTop.y;
                        else if (w) defY = w.y;
                        else if (thm && thm.surroundY !== undefined) defY = thm.surroundY;
                    }
                }
                s.y = Math.round(defY * 100) / 100;
                changed();
                syncInspector();
            });
            snapRow.appendChild(btnAuto);
            host.appendChild(snapRow);

            field(host, 'yaw (rad)', function () { return s.yaw || 0; }, function (v) { s.yaw = v; }, 0.1);

            var yawRow = document.createElement('div');
            yawRow.className = 'row'; yawRow.style.gap = '3px';
            [
                { l: '0°', r: 0 },
                { l: '45°', r: 0.785 },
                { l: '90°', r: 1.571 },
                { l: '180°', r: 3.142 },
                { l: '270°', r: 4.712 }
            ].forEach(function (item) {
                var btn = document.createElement('button');
                btn.className = 'btn'; btn.textContent = item.l;
                btn.style.flex = '1';
                btn.addEventListener('click', function () {
                    pushHistory(); s.yaw = item.r; changed(); syncInspector();
                });
                yawRow.appendChild(btn);
            });
            host.appendChild(yawRow);

            field(host, 'scale', function () { return s.scale || 1; }, function (v) { s.scale = Math.max(0.1, v); }, 0.1);
            field(host, 'variant', function () { return s.variant || 0; }, function (v) { s.variant = Math.round(v); }, 1);
            note(host, 'Atmospheric visual dressing prop: non-colliding, rendered directly in 3D.');
            return;
        }

        if (s.r) {
            field(host, 'radius (r)', function () { return s.r; }, function (v) { s.r = Math.max(MIN_SIDE, v); squareUp(s); });
            field(host, 'center x', function () { return s.x + s.w / 2; }, function (v) { s.x = v - s.w / 2; });
            field(host, 'center z', function () { return s.z + s.d / 2; }, function (v) { s.z = v - s.d / 2; });
        } else {
            field(host, 'x', function () { return s.x; }, function (v) { s.x = v; });
            field(host, 'z', function () { return s.z; }, function (v) { s.z = v; });
            field(host, 'w (width)', function () { return s.w; }, function (v) { s.w = Math.max(MIN_SIDE, v); });
            field(host, 'd (depth)', function () { return s.d; }, function (v) { s.d = Math.max(MIN_SIDE, v); });
        }

        if (S.sel.key === 'pads') {
            pick(host, 'kind', ['green', 'fairway', 'rough', 'sand', 'wood'],
                function () { return s.kind; }, function (v) { s.kind = v; });

            // Shape toggle: Rectangle vs Circular Disc
            var shapeRow = document.createElement('div');
            shapeRow.className = 'row';
            var shLbl = document.createElement('span'); shLbl.className = 'lbl'; shLbl.textContent = 'Shape:';
            var btnRect = document.createElement('button'); btnRect.className = 'btn' + (!s.r ? ' on' : ''); btnRect.textContent = 'Rect';
            var btnDisc = document.createElement('button'); btnDisc.className = 'btn' + (s.r ? ' on' : ''); btnDisc.textContent = 'Disc';
            btnRect.addEventListener('click', function () {
                pushHistory();
                delete s.r; delete s.rIn; delete s.wave; s.inlay = false;
                changed();
                syncInspector();
            });
            btnDisc.addEventListener('click', function () {
                pushHistory();
                s.r = Math.max(MIN_SIDE, Math.min(s.w, s.d) / 2);
                s.inlay = true;
                squareUp(s);
                changed();
                syncInspector();
            });
            shapeRow.appendChild(shLbl); shapeRow.appendChild(btnRect); shapeRow.appendChild(btnDisc);
            host.appendChild(shapeRow);

            field(host, 'y (height)', function () { return s.y; }, function (v) { s.y = v; });
            head(host, 'Tilt & Slopes');

            // Quick slope buttons
            var slopeRow = document.createElement('div');
            slopeRow.className = 'row';
            slopeRow.style.flexWrap = 'wrap'; slopeRow.style.gap = '3px';
            var slopes = [
                { name: 'Flat', sx: 0, sz: 0 },
                { name: 'Ramp +Z', sx: 0, sz: 0.3 },
                { name: 'Ramp -Z', sx: 0, sz: -0.3 },
                { name: 'Tilt +X', sx: 0.12, sz: 0 },
                { name: 'Tilt -X', sx: -0.12, sz: 0 }
            ];
            slopes.forEach(function (sl) {
                var btn = document.createElement('button');
                btn.className = 'btn'; btn.textContent = sl.name;
                btn.addEventListener('click', function () {
                    pushHistory();
                    s.sx = sl.sx; s.sz = sl.sz;
                    changed();
                    syncInspector();
                });
                slopeRow.appendChild(btn);
            });
            host.appendChild(slopeRow);

            field(host, 'sx (tilt X)', function () { return s.sx; }, function (v) { s.sx = v; }, 0.05);
            field(host, 'sz (tilt Z)', function () { return s.sz; }, function (v) { s.sz = v; }, 0.05);

            head(host, 'Machinery');
            toggle(host, 'runs like a travelator (belt)', !!s.push, function (on) {
                s.push = on ? { x: 0, z: 3 } : null;
                if (!on) delete s.push;
            });
            if (s.push) {
                field(host, 'push x', function () { return s.push.x; }, function (v) { s.push.x = v; }, 0.5);
                field(host, 'push z', function () { return s.push.z; }, function (v) { s.push.z = v; }, 0.5);
            }
            toggle(host, 'throws the ball up (sprung)', !!s.spring, function (on) {
                if (!on) { delete s.spring; return; }
                s.spring = 8.5;
                s.kind = 'wood';
                s.sx = s.sz = 0;
                s.r = Math.max(MIN_SIDE, Math.min(s.w, s.d) / 2);
                s.rIn = s.r;
                s.inlay = true;
                s.w = s.d = s.r * 2;
                delete s.wave;
            });
            if (s.spring) {
                field(host, 'launch velocity', function () { return s.spring; }, function (v) { s.spring = Math.max(0, v); }, 0.5);
            }
        }

        if (S.sel.key === 'water') {
            field(host, 'y (water level)', function () { return s.y; }, function (v) { s.y = v; });
        }

        if (S.sel.key === 'extra') {
            pick(host, 'kind', ['rail', 'bumper', 'blade', 'gate', 'beam', 'tree', 'rock'],
                function () { return s.kind || 'rail'; }, function (v) { s.kind = v; });
            field(host, 'h (height)', function () { return s.h; }, function (v) { s.h = Math.max(0.05, v); });
            field(host, 'base', function () { return s.base; }, function (v) { s.base = v; });
            field(host, 'yaw (rad)', function () { return s.yaw; }, function (v) { s.yaw = v; }, 0.05);

            // Quick yaw presets
            var yawRow = document.createElement('div');
            yawRow.className = 'row'; yawRow.style.gap = '3px';
            [0, 0.785, 1.57, 2.356, 3.14].forEach(function (rad, k) {
                var btn = document.createElement('button');
                btn.className = 'btn'; btn.textContent = [ '0°', '45°', '90°', '135°', '180°' ][k];
                btn.addEventListener('click', function () {
                    pushHistory(); s.yaw = rad; changed(); syncInspector();
                });
                yawRow.appendChild(btn);
            });
            host.appendChild(yawRow);

            if (s.kind === 'blade' || s.spin) {
                field(host, 'spin (rad/s)', function () { return s.spin; }, function (v) { s.spin = v; }, 0.1);
            }

            head(host, 'Slide');
            toggle(host, 'slides on a sine (gate)', !!s.move, function (on) {
                s.move = on ? { axis: 'x', amp: 1.5, speed: 1.1, phase: 0 } : null;
                if (!on) delete s.move;
            });
            if (s.move) {
                pick(host, 'axis', ['x', 'z'], function () { return s.move.axis; }, function (v) { s.move.axis = v; });
                field(host, 'amp', function () { return s.move.amp; }, function (v) { s.move.amp = v; });
                field(host, 'speed', function () { return s.move.speed; }, function (v) { s.move.speed = v; }, 0.1);
                field(host, 'phase', function () { return s.move.phase; }, function (v) { s.move.phase = v; }, 0.1);
            }

            head(host, 'Swing');
            toggle(host, 'sweeps between angles (flipper)', !!s.swing, function (on) {
                s.swing = on ? { from: -0.5, to: 0.5, speed: 2.2, phase: 0 } : null;
                if (!on) delete s.swing;
            });
            if (s.swing) {
                field(host, 'from', function () { return s.swing.from; }, function (v) { s.swing.from = v; }, 0.05);
                field(host, 'to', function () { return s.swing.to; }, function (v) { s.swing.to = v; }, 0.05);
                field(host, 'speed', function () { return s.swing.speed; }, function (v) { s.swing.speed = v; }, 0.1);
                field(host, 'phase', function () { return s.swing.phase; }, function (v) { s.swing.phase = v; }, 0.1);
            }
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

    /* ── the 3D pane & camera ────────────────────────────────────────────── */

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
        drawGizmo();
    }

    function applyCam(instant) {
        if (!gl) return;
        R.setCam({
            mode: 'editor',
            target: { x: cam.target.x, y: cam.target.y, z: cam.target.z },
            dist: cam.dist,
            yaw: cam.yaw,
            pitch: cam.pitch,
            instant: !!instant
        });
        drawGizmo();
    }

    function setCamPreset(preset) {
        cam.preset = preset;
        [].forEach.call(document.querySelectorAll('#view-preset-bar .btn'), function (b) {
            b.classList.toggle('on', b.dataset.preset === preset);
        });

        var b = bounds();
        var cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
        var span = Math.max(b.maxX - b.minX, b.maxZ - b.minZ);

        if (preset === 'tee') {
            var tx = S.hole.tee.x, tz = S.hole.tee.z;
            var hx = S.hole.cup.x, hz = S.hole.cup.z;
            var yaw = Math.atan2(hx - tx, hz - tz);
            var dist = Math.max(7, Math.hypot(hx - tx, hz - tz) * 0.7);
            cam.target = { x: (tx + hx) / 2, y: 0.2, z: (tz + hz) / 2 };
            cam.yaw = yaw; cam.pitch = 0.32; cam.dist = dist;
        } else if (preset === 'cup') {
            var tx = S.hole.tee.x, tz = S.hole.tee.z;
            var hx = S.hole.cup.x, hz = S.hole.cup.z;
            var yaw = Math.atan2(tx - hx, tz - hz);
            var dist = Math.max(7, Math.hypot(hx - tx, hz - tz) * 0.7);
            cam.target = { x: (tx + hx) / 2, y: 0.2, z: (tz + hz) / 2 };
            cam.yaw = yaw; cam.pitch = 0.32; cam.dist = dist;
        } else if (preset === 'top') {
            cam.target = { x: cx, y: 0, z: cz };
            cam.yaw = 0; cam.pitch = 1.52;
            cam.dist = Math.max(10, span * 1.15);
        } else if (preset === 'front') {
            cam.target = { x: cx, y: 0.5, z: cz };
            cam.yaw = 0; cam.pitch = 0.12;
            cam.dist = Math.max(8, span * 1.1);
        } else if (preset === 'side') {
            cam.target = { x: cx, y: 0.5, z: cz };
            cam.yaw = Math.PI / 2; cam.pitch = 0.12;
            cam.dist = Math.max(8, span * 1.1);
        } else if (preset === 'graze') {
            var tx = S.hole.tee.x, tz = S.hole.tee.z;
            var hx = S.hole.cup.x, hz = S.hole.cup.z;
            var yaw = Math.atan2(hx - tx, hz - tz);
            cam.target = { x: tx + (hx - tx) * 0.25, y: 0.1, z: tz + (hz - tz) * 0.25 };
            cam.yaw = yaw; cam.pitch = 0.08; cam.dist = 7;
        } else if (preset === 'hero') {
            cam.target = { x: cx, y: 0.2, z: cz };
            cam.yaw = Math.PI * 0.25; cam.pitch = 0.65;
            cam.dist = Math.max(10, span * 1.15);
        }
        applyCam(true);
    }

    function focusObject() {
        var b = bounds();
        var target = { x: (b.minX + b.maxX) / 2, y: 0.2, z: (b.minZ + b.maxZ) / 2 };
        var dist = Math.max(10, Math.max(b.maxX - b.minX, b.maxZ - b.minZ) * 1.1);

        if (S.sel) {
            if (S.sel.key === 'tee' || S.sel.key === 'cup') {
                var m = S.hole[S.sel.key];
                target = { x: m.x, y: 0.2, z: m.z };
                dist = 6;
            } else if (S.sel.key === 'decor') {
                var d = (S.hole.decor || [])[S.sel.idx];
                if (d) { target = { x: d.x, y: d.y || 0, z: d.z }; dist = 5; }
            } else if (S.sel.key === 'warps') {
                var w = (S.hole.warps || [])[S.sel.idx];
                if (w) { target = { x: (w.x + w.tx) / 2, y: 0, z: (w.z + w.tz) / 2 }; dist = Math.max(6, Math.hypot(w.tx - w.x, w.tz - w.z) * 1.3); }
            } else {
                var s = selShape();
                if (s) {
                    target = { x: s.x + s.w / 2, y: s.y || s.base || 0, z: s.z + s.d / 2 };
                    dist = Math.max(5, Math.max(s.w, s.d) * 1.6);
                }
            }
        }
        cam.target = target;
        cam.dist = dist;
        applyCam(true);
        toast('Camera focused', 'good');
    }

    function drawGizmo() {
        if (!gizmoCtx) return;
        var g = gizmoCtx;
        var cx = 24, cy = 24, radius = 17;
        g.clearRect(0, 0, 48, 48);

        var yaw = cam.yaw, pitch = cam.pitch;
        var lookDir = { x: Math.sin(yaw) * Math.cos(pitch), y: -Math.sin(pitch), z: Math.cos(yaw) * Math.cos(pitch) };
        var right = { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) };
        var up = { x: Math.sin(pitch) * Math.sin(yaw), y: Math.cos(pitch), z: Math.sin(pitch) * Math.cos(yaw) };

        var axes = [
            { id: 'x', label: 'X', col: '#f85149', v: { x: 1, y: 0, z: 0 } },
            { id: 'y', label: 'Y', col: '#56d364', v: { x: 0, y: 1, z: 0 } },
            { id: 'z', label: 'Z', col: '#58a6ff', v: { x: 0, y: 0, z: 1 } }
        ];

        axes.forEach(function (a) {
            a.sx = cx + (a.v.x * right.x + a.v.y * right.y + a.v.z * right.z) * radius;
            a.sy = cy - (a.v.x * up.x + a.v.y * up.y + a.v.z * up.z) * radius;
            a.depth = a.v.x * lookDir.x + a.v.y * lookDir.y + a.v.z * lookDir.z;
        });

        axes.sort(function (a, b) { return a.depth - b.depth; });

        // Center dot
        g.fillStyle = 'rgba(255,255,255,0.2)';
        g.beginPath(); g.arc(cx, cy, 3, 0, 7); g.fill();

        axes.forEach(function (a) {
            g.strokeStyle = a.col;
            g.lineWidth = 2;
            g.beginPath(); g.moveTo(cx, cy); g.lineTo(a.sx, a.sy); g.stroke();
            g.fillStyle = a.col;
            g.beginPath(); g.arc(a.sx, a.sy, 6, 0, 7); g.fill();
            g.fillStyle = '#0d1117';
            g.font = 'bold 8px sans-serif';
            g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillText(a.label, a.sx, a.sy);
        });
    }

    function onGizmoClick(e) {
        var r = gizmoCanvas.getBoundingClientRect();
        var px = e.clientX - r.left, py = e.clientY - r.top;
        var cx = 24, cy = 24;
        var dx = px - cx, dy = py - cy;
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal snap: Side view (+X or -X)
            cam.preset = 'side';
            cam.yaw = dx > 0 ? Math.PI / 2 : -Math.PI / 2;
            cam.pitch = 0.12;
        } else {
            // Vertical snap: Top view (+Y) or Front view (+Z)
            if (dy < 0) {
                cam.preset = 'top';
                cam.yaw = 0; cam.pitch = 1.52;
            } else {
                cam.preset = 'front';
                cam.yaw = 0; cam.pitch = 0.12;
            }
        }
        [].forEach.call(document.querySelectorAll('#view-preset-bar .btn'), function (b) {
            b.classList.toggle('on', b.dataset.preset === cam.preset);
        });
        applyCam(true);
    }

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
            applyCam(true);
        } else {
            if (gl) R.setCam({ yaw: aim.yaw, dist: 9, pitch: 0.46, view: 0, mode: 'follow', lock: false });
        }
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
            if (list('extra').some(function (w) { return w.move || w.spin || w.swing; })) draw();
        }

        if (!gl) return;
        if (mode === 'play') {
            aim.show = play && play.phase === 'aim';
            aim.loft = club.loft;
            aim.power = play ? play.power : 0;
            aim.over = P.overdraw(aim.power, club.power);
            R.cam.yaw = aim.yaw;
        } else {
            aim.show = false;
        }
        R.frame(dt, world, aim);
        drawGizmo();
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

    var look = null;
    function onViewDown(e) {
        viewCanvas.setPointerCapture(e.pointerId);
        var isPan = (e.button === 1 || e.button === 2 || e.shiftKey);
        look = {
            isPan: isPan,
            x: e.clientX, y: e.clientY,
            yaw: mode === 'play' ? aim.yaw : cam.yaw,
            pitch: mode === 'play' ? (gl ? R.cam.pitch : 0.46) : cam.pitch,
            targetX: cam.target.x, targetY: cam.target.y, targetZ: cam.target.z
        };
    }

    function onViewMove(e) {
        if (!look) return;
        if (mode === 'play') {
            aim.yaw = look.yaw - (e.clientX - look.x) * 0.008;
            if (gl) R.cam.pitch = Math.max(0.08, Math.min(1.25, look.pitch + (e.clientY - look.y) * 0.004));
            return;
        }

        if (look.isPan) {
            // 3D camera pan
            var rightX = Math.cos(cam.yaw), rightZ = -Math.sin(cam.yaw);
            var fwdX = -Math.sin(cam.yaw), fwdZ = -Math.cos(cam.yaw);
            var panFactor = cam.dist * 0.0018;
            var dx = (e.clientX - look.x) * panFactor;
            var dy = (e.clientY - look.y) * panFactor;
            cam.target.x = look.targetX - rightX * dx + fwdX * dy * Math.sin(cam.pitch);
            cam.target.z = look.targetZ - rightZ * dx + fwdZ * dy * Math.sin(cam.pitch);
            cam.target.y = look.targetY + dy * Math.cos(cam.pitch);
            cam.preset = 'orbit';
        } else {
            // 3D camera orbit
            cam.yaw = look.yaw - (e.clientX - look.x) * 0.008;
            cam.pitch = Math.max(0.04, Math.min(1.54, look.pitch + (e.clientY - look.y) * 0.006));
            cam.preset = 'orbit';
        }
        [].forEach.call(document.querySelectorAll('#view-preset-bar .btn'), function (b) {
            b.classList.toggle('on', b.dataset.preset === 'orbit');
        });
        applyCam(true);
    }

    function onViewUp() { look = null; }

    /* ── the checks ─────────────────────────────────────────────────────── */

    function edgeDist(pad, x, z) {
        if (pad.r) {
            var dx = x - (pad.x + pad.w / 2), dz = z - (pad.z + pad.d / 2);
            return P.padRadius(pad, Math.atan2(dz, dx)) - Math.hypot(dx, dz);
        }
        return Math.min(x - pad.x, pad.x + pad.w - x, z - pad.z, pad.z + pad.d - z);
    }

    function ownPad(cup) {
        var own = null;
        if (!built) return null;
        built.pads.forEach(function (p) {
            if (P.padContains(p, cup.x, cup.z) &&
                Math.abs(P.padHeight(p, cup.x, cup.z) - cup.y) < 0.06) own = p;
        });
        return own;
    }

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

        var t = P.surfaceTop(built, built.tee.x, built.tee.z);
        var c = P.surfaceTop(built, built.cup.x, built.cup.z);
        add(!!t, 'the tee is on the ground', t ? '' : 'nothing under it');
        add(!!c, 'the cup is on the ground', c ? '' : 'nothing under it');

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

        var movers = built.walls.filter(function (wl) { return wl.move || wl.spin || wl.swing; });
        if (movers.length) {
            var worst = Infinity, at = 0;
            movers.forEach(function (wl) {
                var z = wl.z + wl.d / 2;
                var period = wl.spin ? (2 * Math.PI / Math.abs(wl.spin))
                    : wl.swing ? (2 * Math.PI / Math.abs(wl.swing.speed || 1))
                    : (2 * Math.PI / Math.abs(wl.move.speed || 1));
                for (var k = 0; k < 32; k++) {
                    var t = period * k / 32;
                    var g = widestGap(built, z, t);
                    if (g < worst) { worst = g; at = t; }
                }
            });
            add(worst > C.BALL_R * 2 + 0.05, 'the moving parts always leave a way past',
                'narrowest is ' + worst.toFixed(2) + ' at t=' + at.toFixed(2) +
                ', and the ball is ' + (C.BALL_R * 2).toFixed(2) + ' across');
        }

        var pads = built.pads, clash = null;
        for (var i = 0; i < pads.length && !clash; i++) {
            for (var j = i + 1; j < pads.length; j++) {
                var a = pads[i], b = pads[j];
                if (a.x + a.w <= b.x + 1e-6 || b.x + b.w <= a.x + 1e-6) continue;
                if (a.z + a.d <= b.z + 1e-6 || b.z + b.d <= a.z + 1e-6) continue;
                if (a.inlay || b.inlay) continue;
                if (Math.abs((a.y || 0) - (b.y || 0)) < 0.3) { clash = [i, j]; break; }
            }
        }
        add(!clash, 'no two pads overlap at the same height',
            clash ? 'pads #' + (clash[0] + 1) + ' and #' + (clash[1] + 1) : '', true);

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

        if (c) add(!P.waterAt(built, built.cup.x, built.cup.z), 'the cup is dry');
        add(S.hole.par >= 2 && S.hole.par <= 6, 'par is between 2 and 6');

        var span = Math.hypot(built.cup.x - built.tee.x, built.cup.z - built.tee.z);
        add(span > 2, 'the cup is a shot away from the tee',
            'only ' + span.toFixed(1) + ' units', true);

        var badDecor = null;
        var VALID_DECS = ['buoy', 'piling', 'bench', 'boat', 'rowboat', 'sailboat', 'bin', 'barrel', 'crate', 'palm', 'pine', 'sign', 'windmill'];
        (S.hole.decor || []).forEach(function (d, di) {
            if (badDecor) return;
            if (VALID_DECS.indexOf(d.kind) === -1) {
                badDecor = 'decor #' + (di + 1) + ' has unknown kind ' + d.kind;
            } else if (!isFinite(d.x) || !isFinite(d.z) || !isFinite(d.y)) {
                badDecor = 'decor #' + (di + 1) + ' has non-finite coords';
            } else if (Math.hypot(d.x - built.tee.x, d.z - built.tee.z) < 0.6) {
                badDecor = (DECOR_KIND_LABEL[d.kind] || d.kind) + ' #' + (di + 1) + ' is within 0.6m of the tee';
            } else if (Math.hypot(d.x - built.cup.x, d.z - built.cup.z) < 0.6) {
                badDecor = (DECOR_KIND_LABEL[d.kind] || d.kind) + ' #' + (di + 1) + ' is within 0.6m of the cup';
            }
        });
        add(!badDecor, 'decor clears the tee and cup', badDecor || '', false);

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
        var r = Math.round(v * 1000) / 1000;
        return String(r);
    }

    function padCall(p) {
        if (p.spring) {
            return 'sprung(' + [n(p.x + p.w / 2), n(p.z + p.d / 2),
                n(p.r || Math.min(p.w, p.d) / 2), n(p.spring), n(p.y)].join(', ') + ')';
        }
        if (p.push) {
            var bo = [];
            if (p.y) bo.push('y: ' + n(p.y));
            if (p.kind !== 'wood') bo.push("kind: '" + p.kind + "'");
            return 'belt(' + [n(p.x), n(p.z), n(p.w), n(p.d),
                n(p.push.x), n(p.push.z)].join(', ') +
                (bo.length ? ', { ' + bo.join(', ') + ' }' : '') + ')';
        }
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
        if (w.seat !== undefined) opts.push('seat: ' + n(w.seat));
        if (w.move) {
            opts.push('move: { axis: \'' + w.move.axis + '\', amp: ' + n(w.move.amp) +
                ', speed: ' + n(w.move.speed) +
                (w.move.phase ? ', phase: ' + n(w.move.phase) : '') + ' }');
        }
        if (w.swing) {
            opts.push('swing: { from: ' + n(w.swing.from) + ', to: ' + n(w.swing.to) +
                ', speed: ' + n(w.swing.speed) +
                (w.swing.phase ? ', phase: ' + n(w.swing.phase) : '') + ' }');
        }
        return 'wall(' + [n(w.x), n(w.z), n(w.w), n(w.d), n(w.h)].join(', ') +
            (opts.length ? ', { ' + opts.join(', ') + ' }' : '') + ')';
    }

    function decorCall(d) {
        var opts = [];
        if (d.yaw) opts.push('yaw: ' + n(d.yaw));
        if (d.pitch) opts.push('pitch: ' + n(d.pitch));
        if (d.roll) opts.push('roll: ' + n(d.roll));
        if (d.scale !== 1 && d.scale !== undefined) opts.push('scale: ' + n(d.scale));
        if (d.variant) opts.push('variant: ' + n(d.variant));
        var optStr = opts.length ? ', { ' + opts.join(', ') + ' }' : '';
        var validHelpers = ['buoy', 'piling', 'bench', 'boat', 'sailboat', 'bin', 'barrel', 'crate', 'palm', 'pine', 'sign', 'windmill'];
        var args = [n(d.x), n(d.z)];
        if (d.y && d.y !== 0) {
            args.push(n(d.y));
        }
        if (validHelpers.indexOf(d.kind) !== -1) {
            return d.kind + '(' + args.join(', ') + optStr + ')';
        }
        return "decor('" + d.kind + "', " + [n(d.x), n(d.z), n(d.y || 0)].join(', ') + optStr + ')';
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
        if (h.warps && h.warps.length) {
            L.push('    warps: [');
            h.warps.forEach(function (w, i) {
                L.push('        pipe(' + [n(w.x), n(w.z), n(w.tx), n(w.tz),
                    n(w.yaw), n(w.r)].join(', ') + ')' +
                    (i < h.warps.length - 1 ? ',' : ''));
            });
            L.push('    ],');
        }
        if (h.decor && h.decor.length) {
            L.push('    decor: [');
            h.decor.forEach(function (d, i) {
                L.push('        ' + decorCall(d) + (i < h.decor.length - 1 ? ',' : ''));
            });
            L.push('    ],');
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
        var flat = [];
        (h.extra || []).forEach(function (w) {
            if (Array.isArray(w)) flat.push.apply(flat, w); else flat.push(w);
        });
        h.extra = flat;
        return normalize(h);
    }

    /* ── loading the courses that ship ──────────────────────────────────── */

    function documentFrom(course, h) {
        var authoredWalls = (h.extra && h.extra.length) ? h.extra
            : h.walls.filter(function (wl) { return wl.kind !== 'rail' || wl.move || wl.spin || wl.swing || wl.yaw; });
        return normalize({
            name: h.name, blurb: h.blurb, par: h.par, theme: course.theme,
            open: h.open, fence: h.fence,
            weather: S.hole ? S.hole.weather : 'fair',
            needsLoft: h.needsLoft, flat: h.flat,
            pads: h.pads.map(function (p) {
                return { x: p.x, z: p.z, w: p.w, d: p.d, y: p.y, kind: p.kind,
                    sx: p.sx, sz: p.sz, r: p.r, inlay: p.inlay,
                    push: p.push, spring: p.spring };
            }),
            extra: authoredWalls,
            water: h.water,
            gaps: h.gaps || [],
            warps: h.warps || [],
            decor: h.decor || [],
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
        setCamPreset('tee');
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
        window.open('index.html?course=custom&hole=1&fly=0&weather=' +
                    encodeURIComponent(S.hole.weather), '_blank');
    }

    /* ── keys ───────────────────────────────────────────────────────────── */

    var TOOL_KEYS = {
        '1': 'pad', '2': 'extra', '3': 'water', '4': 'gaps', '5': 'tee', '6': 'cup',
        '7': 'pipe', '8': 'bumper', '9': 'tree', '0': 'rock'
    };

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
        if (e.key === 'd' || e.key === 'D') { setTool('decor'); return; }
        if (TOOL_KEYS[e.key]) { setTool(TOOL_KEYS[e.key]); return; }
        if (e.key === 'e' || e.key === 'E') { setMode('edit'); return; }
        if (e.key === 'p' || e.key === 'P') { setMode('play'); return; }
        if (e.key === 'g' || e.key === 'G') { S.grid = !S.grid; $('btn-grid').classList.toggle('on', S.grid); draw(); return; }
        if (e.key === 'f' || e.key === 'F') { fit(); focusObject(); return; }
        if (mode === 'play') {
            if (e.key === 'r' || e.key === 'R') { resetBall(); return; }
            if (e.key === 'Enter') { hit(); return; }
            return;
        }
        if (e.key === 'r' || e.key === 'R') {
            if (S.sel && S.sel.key) {
                var sObj = selShape();
                if (sObj && sObj.yaw !== undefined) {
                    e.preventDefault();
                    pushHistory();
                    var step = e.shiftKey ? Math.PI / 12 : Math.PI / 4;
                    sObj.yaw = (sObj.yaw || 0) + step;
                    if (sObj.yaw >= Math.PI * 2) sObj.yaw -= Math.PI * 2;
                    sObj.yaw = Math.round(sObj.yaw * 1000) / 1000;
                    changed();
                    syncInspector();
                    return;
                }
            }
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

        // Show/hide contextual rows for Surface and Prop selection
        var rowPad = $('row-padkind');
        var rowDecor = $('row-decorkind');
        if (rowPad) rowPad.style.display = (tool === 'pad' || tool === 'disc' || tool === 'belt' || tool === 'sprung') ? '' : 'none';
        if (rowDecor) rowDecor.style.display = (tool === 'decor') ? '' : 'none';
    }

    /* ── wiring ─────────────────────────────────────────────────────────── */

    function boot() {
        [].forEach.call(document.querySelectorAll('#tools .btn'), function (b) {
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

        // Projection buttons in plan pane
        [].forEach.call(document.querySelectorAll('#plan-proj-bar .btn'), function (b) {
            b.addEventListener('click', function () {
                setPlanProj(b.dataset.proj);
            });
        });

        // 3D View Presets
        [].forEach.call(document.querySelectorAll('#view-preset-bar .btn[data-preset]'), function (b) {
            b.addEventListener('click', function () {
                setCamPreset(b.dataset.preset);
            });
        });

        if ($('btn-focus-3d')) {
            $('btn-focus-3d').addEventListener('click', focusObject);
        }

        if (gizmoCanvas) {
            gizmoCanvas.addEventListener('click', onGizmoClick);
        }

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
            if (S.tool === 'select') setTool('pad');
        });
        if ($('f-decorkind')) {
            $('f-decorkind').addEventListener('change', function () {
                S.decorKind = this.value;
                if (S.tool === 'select') setTool('decor');
            });
        }

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
            setCamPreset('tee');
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
                setCamPreset('tee');
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
        $('btn-fit').addEventListener('click', function () {
            fit();
            focusObject();
        });

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
        viewCanvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        viewCanvas.addEventListener('wheel', function (e) {
            e.preventDefault();
            if (gl) {
                cam.dist = Math.max(2, Math.min(60, cam.dist + e.deltaY * 0.015));
                applyCam(true);
            }
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
        setCamPreset('tee');
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

    G3.editor = {
        get hole() { return S.hole; },
        set hole(h) { S.hole = normalize(h); changed(); },
        blankHole: blankHole,
        normalize: normalize,
        parseSource: parseSource,
        exportSource: exportSource,
        documentFrom: documentFrom,
        runChecks: runChecks,
        get built() { return built; },
        setCamPreset: setCamPreset,
        setPlanProj: setPlanProj,
        focusObject: focusObject
    };

})(window.G3);
