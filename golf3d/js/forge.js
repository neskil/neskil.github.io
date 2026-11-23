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
     G3.forge.dev()           is dev mode on (game.js owns the switch)
     G3.forge.notes()/note()  the verdicts (localStorage)
     G3.forge.exportText()    the new notes, as text to paste ({ all: true } for every one)
     G3.forge.markSent(keys)  what Copy does to what it copied
     G3.forge.logPlay()/stats()  play stats per map, under the notes' keys
     G3.forge.catalogue()     every map there is: the batch, the tour, the courses */
(function (G3) {
    'use strict';

    var A = G3.authoring, PW = G3.portals;
    var DATA = G3.FORGE || { batch: 0, recipe: {}, maps: [] };
    // The game's own dev mode (game.js → setDev), which the ☰ menu's Dev mode chip switches.
    var DEV_KEY = (G3.CONFIG && G3.CONFIG.DEV_KEY) || 'loftLinks.dev';
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
        /* A map finished by hand may carry its own colours (forge-finish
           --palette), merged over the stand-in: b1-09's world is a night
           planet lit by a ring of fire, and green grass under a blue sea
           was "ugly". Colours are hex strings, numbers where THEMES has
           numbers (sky, fog, sun, ambient, water). */
        if (m.palette) for (k in m.palette) th[k] = m.palette[k];
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
        var gr = m.green || 1.3;
        pads.push(on(A.pad(m.cup.x - gr, m.cup.z - gr, 2 * gr, 2 * gr, 0, 'green')));
        // `long` (batch 2 on): a long-game hole, the full bag (no `bag` at all).
        var bags = { roll: ['putter', 'mallet'], loft: ['putter', 'mallet', 'chipper', 'wedge'] };
        var said = [];
        if (m.water) said.push('water lies in the hollows');
        if (m.outs) said.push('the world’s own things are out of bounds: a ball that stops among them is played again');
        var h = PW.world({
            name: m.title, par: m.par, long: !!m.long, bag: m.long ? undefined : (bags[m.bag] || bags.loft),
            blurb: m.blurb || ('A hole the forge laid on this world’s own ground' + (said.length ? '; ' + said.join(', and ') : '') +
                '. Not approved yet: play it and say what you think.'),
            pads: pads, tee: { x: m.tee.x, z: m.tee.z }, cup: { x: m.cup.x, z: m.cup.z },
            // A pond in the grid's hollows: drawn to its waterline (render.js → addPondOnGrid).
            water: (m.water || []).map(function (w) { var r = A.rect(w[0], w[1], w[2], w[3], w[4]); r.grid = G; return r; })
        });
        // The world's things off the line (forge.mjs → outsOf): grid cells a
        // ball may cross and may not stop in (physics.markOutOfBounds).
        if (m.outs && m.outs.length) h.outGrid = outGrid(G, m.outs);
        return h;
    }
    function outGrid(G, cells) {
        var on = {};
        cells.forEach(function (k) { on[k] = 1; });
        return { x0: G.x0, z0: G.z0, d: G.d, nx: G.nx, nz: G.nz, on: on, n: cells.length };
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

    function dev() { try { return localStorage.getItem(DEV_KEY) === '1'; } catch (e) { return false; } }

    /* Which rating belongs to which map. A map is rated under a key made from
       what it *is* — its world, anchor, tee, cup, par, bag, strips and every
       height of its ground — so a map that changes in any way (fixed by
       hand, re-forged, renumbered when a batch is kept in part) is a new map
       with no rating, and an old rating never lands on it (the owner: "give
       the maps a new id when you update them"). The key is `forge:` and a
       hash of that, and the export prints it beside the map's name.
       Batch 1 shipped keyed by `<batch>:<id>` and was rated under it while
       this was written, so batch 1 keeps that. */
    function hashOf(str) {
        var h = 2166136261;
        for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
        return (h >>> 0).toString(36);
    }
    function keyFor(m, batch) {
        if (batch === 1) return '1:' + m.id;
        var what = [m.world, m.u, m.at, m.tee, m.cup, m.par, m.bag, m.strips, m.grid];
        /* A map finished by hand (tools/forge-finish.mjs → `finished`) may
           differ only in its water or its outs, which the list above left
           out; so for those maps they count too. Maps without `finished`
           keep the key they were first rated under. */
        if (m.finished) what.push(m.finished, m.water || null, m.outs || null, m.green || null);
        return 'forge:' + hashOf(JSON.stringify(what));
    }
    var KEYS = null;
    function keyOf(id) {
        if (!KEYS) { KEYS = {}; DATA.maps.forEach(function (m) { KEYS[m.id] = keyFor(m, DATA.batch); }); }
        return KEYS[id] || DATA.batch + ':' + id;
    }
    // { '<key>': { verdict, fun, difficulty, look, issues[], note, strokes, at } }
    function notes() { return load(NOTES_KEY, {}) || {}; }
    function noteFor(id) { return notes()[keyOf(id)] || null; }
    function note(id, n) {
        var all = notes();
        n.at = n.at || new Date().toISOString();
        all[keyOf(id)] = n;
        store(NOTES_KEY, all);
        return n;
    }
    function clear() { store(NOTES_KEY, {}); }

    /* Released holes (the owner: "also support doing this feedback for
       already released maps"): the same form on any tour or course hole in
       dev mode, keyed by the hole's home — `released:<course>:<n>`, from
       game.js → holeRef — so a hole is the same hole wherever it is met. The
       note carries its own title, place and par for the export. */
    var RATE_ALL_KEY = 'loftLinks.rateAll';
    function releasedKey(ref) { return 'released:' + ref.id + ':' + ref.index; }
    function noteAt(key) { return notes()[key] || null; }
    function noteKey(key, n) {
        var all = notes();
        n.at = n.at || new Date().toISOString();
        all[key] = n;
        store(NOTES_KEY, all);
        return n;
    }
    // Ask after every released hole too, not only the forge's (off until switched on).
    function rateAll() { return load(RATE_ALL_KEY, false) === true; }
    function setRateAll(on) { store(RATE_ALL_KEY, !!on); }
    function released() {
        var all = notes();
        return Object.keys(all).filter(function (k) { return k.indexOf('released:') === 0; });
    }

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

    /* ── play stats (the owner: "keep track of play stats") ──────────

       Every hole finished on this device, forge map or released, under the
       same key its verdict is kept under: how often, how it went, when. The
       save (scoring.js) already counts plays and a best for released holes,
       so a hole played before this log existed still shows; the log adds
       the forge's maps, gave-ups, an average and the last few cards. */
    var LOG_KEY = 'loftLinks.playLog';
    var KEEP = 12;
    function playLog() { return load(LOG_KEY, {}) || {}; }
    function logPlay(key, strokes, par, pickedUp, meta) {
        if (!key) return null;
        var all = playLog(), r = all[key] || { plays: 0, holed: 0, gaveUp: 0, total: 0, best: null, last: [] };
        r.plays++;
        if (pickedUp) r.gaveUp++;
        else {
            r.holed++; r.total += strokes;
            if (r.best === null || strokes < r.best) r.best = strokes;
        }
        r.last = (r.last || []).concat([pickedUp ? 'x' : strokes]).slice(-KEEP);
        r.par = par; r.at = new Date().toISOString();
        if (meta) { r.title = meta.title; r.where = meta.where; }
        all[key] = r;
        store(LOG_KEY, all);
        return r;
    }
    function clearLog() { store(LOG_KEY, {}); }
    // The log's record for a key, folded with what the save knows about a released hole.
    function stats(key, save) {
        var r = playLog()[key] || null, out = r ? {
            plays: r.plays, holed: r.holed, gaveUp: r.gaveUp, best: r.best, last: r.last || [], at: r.at || null,
            avg: r.holed ? r.total / r.holed : null, par: r.par
        } : { plays: 0, holed: 0, gaveUp: 0, best: null, last: [], at: null, avg: null };
        if (key.indexOf('released:') === 0 && save && save.holes) {
            var h = save.holes[key.slice(9)];
            if (h) {
                if ((h.plays || 0) > out.plays) out.plays = h.plays;
                if (typeof h.best === 'number' && (out.best === null || h.best < out.best)) out.best = h.best;
                out.stars = h.stars || 0;
            }
        }
        return out;
    }
    function statText(s, par) {
        if (!s || !s.plays) return '';
        par = par || s.par;
        var bits = ['played ' + s.plays];
        if (s.best !== null) bits.push('best ' + s.best + (par ? ' (' + (s.best - par === 0 ? 'E' : (s.best > par ? '+' : '') + (s.best - par)) + ')' : ''));
        if (s.avg !== null) bits.push('avg ' + (Math.round(s.avg * 10) / 10));
        if (s.gaveUp) bits.push('gave up ' + s.gaveUp);
        if (s.last && s.last.length > 1) bits.push('cards ' + s.last.join(','));
        return bits.join(' · ');
    }

    /* ── every map there is, for the dev panel's list ───────────────────

       The forge's batch, the World Tour's holes and every course hole, each
       with the key its notes and stats live under, where to play it and the
       hole itself for the plan. Endless is not here: it is made up as it is
       played, so there is no map to come back to. */
    var CAT = null;
    function catalogue() {
        if (CAT) return CAT;
        var out = [];
        maps().forEach(function (w, i) {
            out.push({ key: keyOf(w.id), kind: 'forge', group: 'New maps', label: w.title, where: w.id + ' \u00B7 ' + w.map.world,
                par: w.map.par, play: ['forge', i], hole: w.hole, theme: w.theme, forge: w, ref: w.id });
        });
        ((PW && PW.WORLDS) || []).forEach(function (w) {
            out.push({ key: 'released:world-' + w.id + ':0', kind: 'tour', group: 'World Tour', label: w.title,
                where: w.world, par: w.hole.par, play: ['world-' + w.id, 0], hole: w.hole, theme: w.theme,
                ref: 'world-' + w.id + ':0' });
        });
        (G3.COURSES || []).forEach(function (c) {
            c.holes.forEach(function (h, i) {
                out.push({ key: 'released:' + c.id + ':' + i, kind: 'course', group: c.name, label: h.name || ('Hole ' + (i + 1)),
                    where: c.name + ' · hole ' + (i + 1), par: h.par, play: [c.id, i], hole: h,
                    theme: h.theme || (c.themes && c.themes[i]) || c.theme, ref: c.id + ':' + i });
            });
        });
        CAT = out;
        return out;
    }
    function entry(key) {
        var L = catalogue();
        for (var i = 0; i < L.length; i++) if (L[i].key === key) return L[i];
        return null;
    }

    /* ── sent (the owner: "mark feedback as sent, automatic when you copy
       it") ── a note copied out carries `sent`; saving it again (a re-rate)
       writes a fresh note without one, so it is new again. The copy is of
       the new notes only, unless asked for all of them. */
    function unsent() {
        var all = notes();
        return Object.keys(all).filter(function (k) { return !all[k].sent; });
    }
    function markSent(keys) {
        var all = notes(), at = new Date().toISOString();
        (keys || []).forEach(function (k) { if (all[k]) all[k].sent = at; });
        store(NOTES_KEY, all);
    }

    function line(n) {
        return n.verdict + ' · fun ' + n.fun + '/5 · difficulty ' + n.difficulty + ' · look ' + n.look + '/5' +
            (n.strokes ? ' · ' + (/^gave/.test(n.strokes) ? n.strokes : 'took ' + n.strokes) : '') +
            (n.issues && n.issues.length ? ' · issues ' + n.issues.join(',') : '') +
            (n.note ? ' · note: ' + n.note.replace(/\s+/g, ' ') : '');
    }

    /* The paste for Claude. `opts.all` repeats notes already sent; without
       it only the new ones go, and the forge's batch is still listed in full
       (a map already sent says so) so the batch reads whole. Returns the
       text; `exportFor` also returns the keys it carried, to mark sent. */
    function exportFor(opts) {
        var everything = !!(opts && opts.all), save = opts && opts.save;
        var all = notes(), L = maps(), lines = [], keys = [];
        function want(k) { return all[k] && (everything || !all[k].sent); }
        function stat(k, par) { var t = statText(stats(k, save), par); return t ? ' · ' + t : ''; }
        var sentBefore = Object.keys(all).filter(function (k) { return all[k].sent; }).length;
        // The first lines are for Claude, so the paste is the whole prompt.
        lines.push('FORGE FEEDBACK · Loft Links · batch ' + DATA.batch + ' · build v' + (G3.VERSION || '?') +
            (everything ? ' · everything' : sentBefore ? ' · new since last copy (' + sentBefore + ' sent before, not repeated)' : ''));
        lines.push('Claude: this is my feedback on the forge’s new maps (and maybe released ones). Read golf3d/FORGE-FEEDBACK.md in neskil/neskil.github.io and follow it: sum it up, move keeps into the World Tour, adjust the recipe, forge the next batch and ship it to master.');
        lines.push('recipe ' + JSON.stringify(DATA.recipe || {}));
        L.forEach(function (w) {
            var k = keyOf(w.id), n = all[k], m = w.map;
            var head = w.id + (k.indexOf('forge:') === 0 ? ' [' + k + ']' : '') + ' · ' + w.title + ' · ' + m.world + ' · par ' + m.par +
                ' · gen ' + JSON.stringify(m.gen || {});
            if (!n) { lines.push(head + ' · (not rated)' + stat(k, m.par)); return; }
            if (!want(k)) { lines.push(head + ' · (sent already: ' + n.verdict + ')'); return; }
            keys.push(k);
            lines.push(head + ' · ' + line(n) + stat(k, m.par));
        });
        var rel = released().filter(want);
        if (rel.length) {
            lines.push('RELEASED MAPS');
            rel.forEach(function (k) {
                var n = all[k];
                keys.push(k);
                lines.push(k.slice(9) + ' · ' + (n.title || '?') + ' · ' + (n.where || '?') + ' · par ' + (n.par || '?') + ' · ' + line(n) + stat(k, n.par));
            });
        }
        // Earlier batches' notes still in the browser, so nothing is lost.
        var mine = {};
        L.forEach(function (w) { mine[keyOf(w.id)] = true; });
        Object.keys(all).forEach(function (k) {
            if (mine[k] || k.indexOf('released:') === 0 || !want(k)) return;
            var n = all[k];
            keys.push(k);
            lines.push('(older) ' + k + ' · ' + n.verdict + ' · fun ' + n.fun + ' · difficulty ' + n.difficulty + ' · look ' + n.look +
                (n.issues && n.issues.length ? ' · issues ' + n.issues.join(',') : '') + (n.note ? ' · note: ' + n.note : ''));
        });
        return { text: lines.join('\n'), keys: keys };
    }
    function exportText(opts) { return exportFor(opts).text; }

    G3.forge = {
        DATA: DATA, ISSUES: ISSUES, VERDICTS: VERDICTS,
        maps: maps, byId: byId, holeOf: holeOf, outGrid: outGrid,
        dev: dev,
        notes: notes, noteFor: noteFor, note: note, clear: clear, nextUnrated: nextUnrated,
        keyOf: keyOf, keyFor: keyFor, releasedKey: releasedKey, noteAt: noteAt, noteKey: noteKey,
        rateAll: rateAll, setRateAll: setRateAll, released: released,
        exportText: exportText, exportFor: exportFor, unsent: unsent, markSent: markSent,
        playLog: playLog, logPlay: logPlay, clearLog: clearLog, stats: stats, statText: statText,
        catalogue: catalogue, entry: entry,
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
