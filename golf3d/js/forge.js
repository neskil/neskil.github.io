/* The forge — new World Tour holes made by a tool rather than by hand, for
   the owner to play through and judge one at a time (dev mode only).

   tools/forge.mjs reads a Portals world's own ground ahead of its flight
   (tools/forge-sample.mjs), keeps the patch with the most playable shape,
   bakes it into a height grid the way the hand-made sculpted holes were
   (The Nave, The Sugar Gate), levels a tee and a green on it and lets the
   bot and the hole lab pick the cup. It writes the batch to forge-maps.js
   as plain data. This file turns that data into holes — the same `world()`
   every tour hole is built with, a `ghost` pad carrying the grid and inlays
   for the tee, the fairway paint and the green — and keeps the owner's
   verdicts in localStorage until they are copied out and pasted to Claude,
   whose next batch is forged with a recipe adjusted by them.

   Nothing here touches the DOM or three.js: tests.html builds and plays the
   batch with the bot, and game.js draws the dev panel and the form.

     G3.forge.maps()          the batch, built: [{ id, title, world, hole, place, map }]
     G3.forge.byId(id)
     G3.forge.dev()/setDev()  the dev mode switch (localStorage)
     G3.forge.notes()/note()  the verdicts (localStorage)
     G3.forge.exportText()    everything, as text to paste */
(function (G3) {
    'use strict';

    var A = G3.authoring, PW = G3.portals;
    var DATA = G3.FORGE || { batch: 0, recipe: {}, maps: [] };
    var DEV_KEY = 'loftLinks.devMode';
    var NOTES_KEY = 'loftLinks.forgeNotes';

    // A palette for a world with no tour hole: Endless's stand-in for it,
    // its grass turned to the world's own hue so the paint belongs there.
    function hsl(h, s, l) {
        function f(n) {
            var k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
            var c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
            return ('0' + Math.round(c * 255).toString(16)).slice(-2);
        }
        return '#' + f(0) + f(8) + f(4);
    }
    function themeFor(m) {
        var key = 'forge-' + m.id;
        if (G3.THEMES[key]) return key;
        var w = G3.endless && G3.endless.world(m.world);
        var base = G3.THEMES[(w && w.theme) || 'clouds'] || G3.THEMES.clouds, th = {}, k;
        for (k in base) th[k] = base[k];
        var hue = w && w.tone ? w.tone[0] : 0.33, sat = Math.max(0.25, Math.min(0.6, (w && w.tone ? w.tone[1] : 0.2) * 2.4));
        th.grass = [hsl(hue, sat, 0.42), hsl(hue, sat, 0.37)];
        G3.THEMES[key] = th;
        if (G3.PORTAL_SKIES) G3.PORTAL_SKIES[key] = ['clear', 'fair'];
        return key;
    }

    /* A forged map to a hole. The ground is one `ghost` pad over the whole
       baked patch (fairway, the way a sculpted hole's is since v1.183.0);
       the inlays on it are what is painted on the world — the tee, the
       strips of fairway along the line the forge chose — and the green. */
    function holeOf(m) {
        var G = m.grid, field = [{ grid: G }];
        function on(p) { p.field = field; p.inlay = true; return p; }
        var ground = A.pad(G.x0, G.z0, (G.nx - 1) * G.d, (G.nz - 1) * G.d, 0, 'fairway');
        ground.field = field; ground.ghost = true;
        var pads = [ground, on(A.pad(m.tee.x - 1, m.tee.z - 1, 2, 2, 0, 'fairway'))];
        (m.strips || []).forEach(function (r) { pads.push(on(A.pad(r[0], r[1], r[2] - r[0], r[3] - r[1], 0, 'fairway'))); });
        pads.push(on(A.pad(m.cup.x - 1.3, m.cup.z - 1.3, 2.6, 2.6, 0, 'green')));
        var bags = { roll: ['putter', 'mallet'], loft: ['putter', 'mallet', 'chipper', 'wedge'] };
        return PW.world({
            name: m.title, par: m.par, bag: bags[m.bag] || bags.loft,
            blurb: m.blurb || 'A hole the forge laid on this world’s own ground. Not approved yet: play it and say what you think.',
            pads: pads, tee: { x: m.tee.x, z: m.tee.z }, cup: { x: m.cup.x, z: m.cup.z }
        });
    }

    var BUILT = null;
    function maps() {
        if (BUILT) return BUILT;
        BUILT = DATA.maps.map(function (m) {
            var w = G3.endless && G3.endless.world(m.world);
            var theme = themeFor(m), hole = holeOf(m);
            var place = { world: m.world, u: m.u, at: m.at, reach: m.reach || 2.5 };
            hole.place = place; hole.theme = theme; hole.forge = m.id;
            hole.scene = (w && w.scene) || 'clouds';
            hole.worldId = 'forge-' + m.id;
            hole.inWorld = (w && w.name) || m.world;
            return { id: m.id, title: m.title, world: hole.inWorld, theme: theme, hole: hole, place: place, map: m };
        });
        return BUILT;
    }
    function byId(id) {
        var L = maps();
        for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i];
        return null;
    }

    // The batch as one course, played in order: hole n is map n.
    function course(list, id, name) {
        return {
            id: id, group: 'portals', name: name, isPortals: true, isForge: true,
            blurb: 'New maps from the forge, not approved yet.',
            theme: list[0].theme, holes: list.map(function (w) { return w.hole; }),
            worlds: list.map(function (w) { return w.id; }),
            themes: list.map(function (w) { return w.theme; }),
            from: list.map(function (w) { return { id: 'forge-' + w.id, index: 0 }; })
        };
    }

    /* ── what the owner says ────────────────────────────────────────── */

    function load(key, fallback) {
        try { var v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    }
    function store(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* private window */ } }

    function dev() { return load(DEV_KEY, false) === true; }
    function setDev(on) { store(DEV_KEY, !!on); }

    // { '<batch>:<id>': { verdict, fun, difficulty, look, issues[], note, strokes, at } }
    function notes() { return load(NOTES_KEY, {}) || {}; }
    function keyOf(id) { return DATA.batch + ':' + id; }
    function noteFor(id) { return notes()[keyOf(id)] || null; }
    function note(id, n) {
        var all = notes();
        n.at = n.at || new Date().toISOString();
        all[keyOf(id)] = n;
        store(NOTES_KEY, all);
        return n;
    }
    function clear() { store(NOTES_KEY, {}); }

    // The first map of the batch with no verdict yet, or -1.
    function nextUnrated() {
        var L = maps();
        for (var i = 0; i < L.length; i++) if (!noteFor(L[i].id)) return i;
        return -1;
    }

    /* The form's choices, one place for game.js and the export alike. Each
       issue names a part of the recipe it would move (forge.mjs reads the
       pasted text back; the names are what it looks for). */
    var ISSUES = [
        ['edges', 'Couldn’t see where the hole was'],
        ['bumpy', 'Ground too bumpy'],
        ['flat', 'Too flat / boring'],
        ['long', 'Too long'],
        ['short', 'Too short'],
        ['hard', 'Too hard'],
        ['easy', 'Too easy'],
        ['clip', 'Clipping / floating'],
        ['stuck', 'Ball got stuck'],
        ['camera', 'Bad view / camera'],
        ['ugly', 'Paint looked wrong'],
        ['nice-spot', 'Great spot in the world']
    ];
    var VERDICTS = [['keep', 'Keep'], ['fix', 'Keep if fixed'], ['drop', 'Drop']];

    function exportText() {
        var all = notes(), L = maps(), lines = [];
        lines.push('FORGE FEEDBACK · batch ' + DATA.batch + ' · recipe ' + JSON.stringify(DATA.recipe || {}));
        L.forEach(function (w) {
            var n = all[keyOf(w.id)];
            var m = w.map;
            var head = w.id + ' · ' + w.title + ' · ' + m.world + ' · par ' + m.par +
                ' · gen ' + JSON.stringify(m.gen || {});
            if (!n) { lines.push(head + ' · (not rated)'); return; }
            lines.push(head + ' · ' + n.verdict + ' · fun ' + n.fun + '/5 · difficulty ' + n.difficulty +
                ' · look ' + n.look + '/5' + (n.strokes ? ' · took ' + n.strokes : '') +
                (n.issues && n.issues.length ? ' · issues ' + n.issues.join(',') : '') +
                (n.note ? ' · note: ' + n.note.replace(/\s+/g, ' ') : ''));
        });
        // Earlier batches' notes still in the browser, so nothing is lost.
        Object.keys(all).forEach(function (k) {
            if (k.indexOf(DATA.batch + ':') === 0) return;
            var n = all[k];
            lines.push('(older) ' + k + ' · ' + n.verdict + ' · fun ' + n.fun + ' · difficulty ' + n.difficulty + ' · look ' + n.look +
                (n.issues && n.issues.length ? ' · issues ' + n.issues.join(',') : '') + (n.note ? ' · note: ' + n.note : ''));
        });
        return lines.join('\n');
    }

    G3.forge = {
        DATA: DATA, ISSUES: ISSUES, VERDICTS: VERDICTS,
        maps: maps, byId: byId, holeOf: holeOf,
        dev: dev, setDev: setDev,
        notes: notes, noteFor: noteFor, note: note, clear: clear, nextUnrated: nextUnrated,
        exportText: exportText,
        course: function () { var L = maps(); return L.length ? course(L, 'forge', 'New maps · batch ' + DATA.batch) : null; }
    };

    var plain = G3.courseById;
    G3.courseById = function (id) {
        id = String(id);
        if (id === 'forge') return G3.FORGE_COURSE || (G3.FORGE_COURSE = G3.forge.course());
        if (id.indexOf('forge-') === 0 && byId(id.slice(6))) {
            var w = byId(id.slice(6)), c = course([w], id, w.title);
            c.single = true;
            return c;
        }
        return plain(id);
    };
})(window.G3);
