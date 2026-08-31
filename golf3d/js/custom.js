/* The hole the editor is playtesting, if there is one.

   level-editor.html writes its document to localStorage and opens the game at
   `?course=custom`. This reads that back, puts it through the same `build` the
   file's own holes go through, and files it as a one-hole course — so a
   playtest is the real game on the real hole, with the real bag, the real
   scorecard and the real camera, rather than a second renderer pretending.

   Nothing here runs unless the key is there, and a key that will not parse is
   dropped rather than allowed to break the boot: a stale playtest from an
   older editor must never cost somebody a game of golf. */
(function (G3) {
    'use strict';

    var KEY = 'g3.playtest.v1';
    var A = G3.authoring;

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

    var doc = read();
    if (!doc || !doc.pads || !doc.pads.length) return;

    var hole;
    try {
        hole = A.build({
            name: doc.name || 'Playtest',
            blurb: doc.blurb || 'Straight out of the editor.',
            par: doc.par || 3,
            needsLoft: !!doc.needsLoft,
            flat: !!doc.flat,
            pads: doc.pads,
            extra: doc.extra || [],
            water: doc.water || [],
            gaps: doc.gaps || [],
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
        if (tag) tag.textContent = 'Playtest — the hole open in the editor.';
        var chip = document.getElementById('chip-editor');
        if (chip) {
            chip.title = 'Back to the hole editor';
            chip.innerHTML = '←<span class="chip-text"> Editor</span>';
        }
    });

    G3.COURSES.push({
        id: 'custom',
        group: 'mini',
        name: 'Playtest',
        blurb: 'The hole open in the editor. It is here because you asked for it.',
        theme: G3.THEMES[doc.theme] ? doc.theme : 'seaside',
        holes: [hole],
        playtest: true
    });

})(window.G3);
