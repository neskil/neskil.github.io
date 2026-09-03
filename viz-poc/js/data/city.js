/* The repo, measured.
 *
 * Baked at authoring time rather than read at runtime: a static page cannot
 * walk its own repository, and there is no build step to generate this on
 * deploy. Regenerate by hand when the shape of the site changes — the numbers
 * are a portrait, not a dashboard, and a month-stale line count still tells
 * you which building is the tall one.
 *
 * loc counts .html/.js/.css/.md tracked by git, excluding vendored code
 * (three.js, Phaser, the old Monaco drop) — otherwise every 3D project is the
 * same height, and that height is three.js.
 *
 * files is tracked non-binary files. touched is the last commit date for the
 * folder; commits is how many commits have touched it.
 *
 * Measured 2026-09-02.
 */
window.VizCity = (function () {
    'use strict';

    /* id, label, href, files, loc, touched (ISO), commits */
    var RAW = [
        ['cargo-lander', 'Cargo Lander',   '../cargo-lander/index.html',        53, 29689, '2026-08-28',   5],
        ['golf3d',       'Loft Links',     '../golf3d/index.html',              28, 29012, '2026-09-02', 102],
        ['3d-engine',    'Yard Master',    '../3d-engine-poc/index.html',       48, 18138, '2026-08-21',  12],
        ['supply-chain', 'Supply Chain',   '../supply-chain/index.html',        34, 17731, '2026-08-09',   3],
        ['car',          'Car Costs',      '../car/index.html',                 14,  9437, '2026-08-16',   5],
        ['surprise',     'Surprise',       '../surprise/index.html',            37,  8396, '2026-08-09',   3],
        ['golf',         'Pocket Links',   '../golf/index.html',                14,  6663, '2026-08-21',   8],
        ['home',         'Landing page',   '../index.html',                      1,  5237, '2026-09-02',  43],
        ['converter',    'Converter',      '../converter/index.html',            1,  2233, '2026-08-09',   2],
        ['viz-poc',      'Data Room',      'index.html',                         7,  2023, '2026-09-02',   2],
        ['cv',           'CV',             '../cv/index.html',                   2,  1160, '2026-08-08',   1],
        ['games',        'Game Library',   '../games/index.html',                2,  1135, '2026-08-08',   1],
        ['math',         'Unit Cheatsheet','../math/index.html',                 2,   939, '2026-08-08',   1],
        ['sc-legacy',    'Supply Chain 1', '../supply-chain-legacy/index.html',  2,   835, '2026-08-08',   1]
    ];

    var now = Date.parse('2026-09-02');
    var DAY = 86400000;

    var blocks = RAW.map(function (r) {
        return {
            id: r[0], label: r[1], href: r[2],
            files: r[3], loc: r[4], touched: r[5], commits: r[6],
            ageDays: Math.max(0, Math.round((now - Date.parse(r[5])) / DAY))
        };
    });

    var maxLoc = 0, maxAge = 1;
    blocks.forEach(function (b) {
        if (b.loc > maxLoc) maxLoc = b.loc;
        if (b.ageDays > maxAge) maxAge = b.ageDays;
    });

    return { blocks: blocks, maxLoc: maxLoc, maxAge: maxAge };
})();
