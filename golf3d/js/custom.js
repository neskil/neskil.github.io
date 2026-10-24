/* The hole the editor is playtesting, if there is one.

   level-editor.html writes its document to localStorage and opens the game at
   `?course=custom`. This reads that back, puts it through the same `build` the
   file's own holes go through, and files it as a one-hole course — so a
   playtest is the real game on the real hole, with the real bag, the real
   scorecard and the real camera, rather than a second renderer pretending.

   Nothing here runs unless the key is there, and a key that will not parse is
   dropped rather than allowed to break the boot: a stale playtest from an
   older editor must never cost somebody a game of golf.

   Or the hole comes in a link (v1.102.0): the editor's Share button writes
   the whole document into the URL's fragment, `#hole=v1.…`, and this reads it
   back before it looks in localStorage — so a hole goes to a friend as a link
   and nothing has to be hosted anywhere. The fragment never leaves the
   browser, so the hole is not sent to the server that serves the page. */
(function (G3) {
    'use strict';

    var KEY = 'g3.playtest.v1';
    var A = G3.authoring;

    /* ── a hole in a link ──

       The editor's document as JSON, every number cut to a millimetre, as
       UTF-8 (a hole may be called anything), in URL-safe base64 with a version
       on the front so a later format can be told from this one. Nothing is
       compressed: a hole of a dozen pieces is two or three kilobytes, which
       every browser's address bar takes, and staying synchronous is what lets
       the course be filed before the game boots. */
    var LINK = 'hole=';
    function cut(k, v) { return typeof v === 'number' ? Math.round(v * 1000) / 1000 : v; }
    function encode(doc) {
        var bytes = new TextEncoder().encode(JSON.stringify(doc, cut)), s = '', i;
        for (i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
        return 'v1.' + btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function decode(str) {
        if (typeof str !== 'string' || str.indexOf('v1.') !== 0) return null;
        try {
            var b = str.slice(3).replace(/-/g, '+').replace(/_/g, '/'), i;
            while (b.length % 4) b += '=';
            var raw = atob(b), bytes = new Uint8Array(raw.length);
            for (i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
            var doc = JSON.parse(new TextDecoder().decode(bytes));
            return doc && doc.pads && doc.pads.length && doc.tee && doc.cup ? doc : null;
        } catch (e) { return null; }
    }
    function fromHash(hash) {
        var h = hash === undefined ? (location.hash || '') : hash, at = h.indexOf(LINK);
        return at < 0 ? null : decode(h.slice(at + LINK.length).split('&')[0]);
    }
    // The page next to this one that a link opens: the game or the editor.
    function link(doc, page) {
        var here = location.href.split('#')[0].split('?')[0];
        var dir = here.slice(0, here.lastIndexOf('/') + 1);
        var q = page === 'editor' ? 'level-editor.html'
            : 'index.html?course=custom&hole=1' + (doc.weather ? '&weather=' + encodeURIComponent(doc.weather) : '');
        return dir + q + '#' + LINK + encode(doc);
    }
    G3.holeLink = { encode: encode, decode: decode, fromHash: fromHash, link: link };

    function read() {
        var raw;
        try { raw = localStorage.getItem(KEY); } catch (e) { return null; }
        if (!raw) return null;
        try {
            var saved = JSON.parse(raw);
            return saved && saved.hole ? saved.hole : null;
        } catch (e) { return null; }
    }

    /* Only when the page was actually asked for it. The course list is the
       game's shop window and a half-finished lane from somebody's editor
       session has no business standing in it — or in `nextCourseId`, which
       would otherwise offer it at the end of a round. */
    if ((location.search || '').indexOf('course=custom') < 0) return;

    var shared = fromHash();
    var doc = shared || read();
    if (!doc || !doc.pads || !doc.pads.length) return;

    var hole;
    try {
        hole = A.build({
            name: doc.name || 'Playtest',
            blurb: doc.blurb || 'Straight out of the editor.',
            par: doc.par || 3,
            needsLoft: !!doc.needsLoft,
            rolling: !!doc.rolling,
            /* Everything the editor can draw — pipes, loops, the dressing and
               an open hole's stakes included. This used to stop at the
               water and the gaps, so a hole playtested with a pipe or a loop
               in it arrived without one. */
            open: !!doc.open, fence: doc.fence || undefined,
            pads: doc.pads,
            extra: doc.extra || [],
            water: doc.water || [],
            gaps: doc.gaps || [],
            warps: doc.warps || [],
            loops: doc.loops || [],
            decor: doc.decor || [],
            tee: { x: doc.tee.x, z: doc.tee.z },
            cup: { x: doc.cup.x, z: doc.cup.z }
        });
    } catch (e) {
        return;
    }

    /* A playtest round says so, and the editor chip becomes the way back to
       the hole you are testing rather than a way out of the game. */
    document.addEventListener('DOMContentLoaded', function () {
        var tag = document.querySelector('.tagline');
        if (tag) tag.textContent = shared ? 'A shared hole — somebody built this in the editor.'
            : 'Playtest — the hole open in the editor.';
        var chip = document.getElementById('chip-editor');
        if (chip) {
            chip.title = shared ? 'Open this hole in the editor' : 'Back to the hole editor';
            chip.innerHTML = shared ? '&#9998;<span class="chip-text"> Edit it</span>'
                : '←<span class="chip-text"> Editor</span>';
            if (shared) chip.href = link(doc, 'editor');
        }
    });

    G3.COURSES.push({
        id: 'custom',
        group: 'mini',
        name: shared ? 'Shared hole' : 'Playtest',
        blurb: shared ? 'A hole somebody sent you, built in the editor.'
            : 'The hole open in the editor. It is here because you asked for it.',
        theme: G3.THEMES[doc.theme] ? doc.theme : 'seaside',
        holes: [hole],
        playtest: true
    });

})(window.G3);
