/* The repo, measured.
 *
 * Baked at authoring time rather than read at runtime: a static page cannot
 * walk its own repository, and there is no build step to generate this on
 * deploy. Regenerate with `node tools/update-city.mjs` when the shape of the
 * site changes — the numbers are a portrait, not a dashboard, and a month-stale
 * line count still tells you which building is the tall one.
 *
 * loc counts .html/.js/.css/.md tracked by git, excluding vendored code
 * (three.js, Phaser, the old Monaco drop) — otherwise every 3D project is the
 * same height, and that height is three.js.
 *
 * files is tracked non-binary files. touched is the last commit date for the
 * folder; commits is how many commits have touched it.
 *
 * Measured 2026-11-28.
 */
window.VizCity = (function () {
    'use strict';

    /* id, label, href, files, loc, touched (ISO), commits */
    var RAW = [
        ['surprise',     'Surprise',          '../surprise/index.html',             37, 169640, '2026-11-20',   1],
        ['golf3d',       'Loft Links',        '../golf3d/index.html',               73,  92131, '2026-11-28', 122],
        ['cargo-lander', 'Cargo Lander',      '../cargo-lander/index.html',         59,  33840, '2026-11-20',   1],
        ['golf',         'Pocket Links',      '../golf/index.html',                 25,  30938, '2026-11-20',   1],
        ['supply-chain', 'Supply Chain',      '../supply-chain/index.html',         36,  18979, '2026-11-20',   1],
        ['3d-engine',    'Yard Master',       '../3d-engine-poc/index.html',        48,  18205, '2026-11-20',   1],
        ['car',          'Car Costs',         '../car/index.html',                  14,   9498, '2026-11-20',   1],
        ['cargo-packer', 'Cargo Packer',      '../cargo-packer/index.html',         28,   9041, '2026-11-20',   1],
        ['viz-poc',      'Data Room',         'index.html',                         20,   7357, '2026-11-20',   1],
        ['home',         'Landing page',      '../index.html',                       3,   6739, '2026-11-28',  72],
        ['paper-plane',  'Paper Plane',       '../paper-plane/index.html',          12,   5437, '2026-11-20',   1],
        ['bil',          'Leasa · Hyra · Köpa', '../bil/index.html',                   9,   4244, '2026-11-20',   1],
        ['terrarium',    'Terrarium',         '../terrarium/index.html',             6,   3412, '2026-11-20',   1],
        ['orbit',        'Pocket Orbit',      '../orbit/index.html',                 6,   3176, '2026-11-20',   1],
        ['sand',         'Sand Clock',        '../sand/index.html',                  4,   3011, '2026-11-20',   1],
        ['usa-quiz',     'USA Quiz Night',    '../usa-quiz/index.html',              5,   2757, '2026-11-20',   1],
        ['converter',    'Converter',         '../converter/index.html',             1,   2273, '2026-11-20',   1],
        ['elevator',     'Elevator Tycoon',   '../elevator/index.html',              4,   1648, '2026-11-20',   1],
        ['wow',          'WoW Countdown',     '../wow/index.html',                   2,   1644, '2026-11-20',   1],
        ['cv',           'CV',                '../cv/index.html',                    2,   1190, '2026-11-20',   1],
        ['games',        'Game Library',      '../games/index.html',                 2,   1168, '2026-11-20',   1],
        ['fika',         'Fika Generator',    '../fika/index.html',                  5,   1107, '2026-11-20',   1],
        ['gait',         'Gait Lab',          '../gait/index.html',                  4,   1058, '2026-11-20',   1],
        ['math',         'Unit Cheatsheet',   '../math/index.html',                  1,    980, '2026-11-20',   1],
        ['name-song',    'Sound of Name',     '../name-song/index.html',             4,    934, '2026-11-20',   1],
        ['sc-legacy',    'Supply Chain 1',    '../supply-chain-legacy/index.html',   2,    837, '2026-11-20',   1]
    ];

    var now = Date.parse('2026-11-28');
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
