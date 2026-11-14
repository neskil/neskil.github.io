#!/usr/bin/env node
// Regenerate viz-poc/js/data/city.js from the repository's actual files and git history.
//
//   node tools/update-city.mjs

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const PROJECTS = [
    { id: 'cargo-lander', label: 'Cargo Lander',   href: '../cargo-lander/index.html',        paths: ['cargo-lander'] },
    { id: 'golf3d',       label: 'Loft Links',     href: '../golf3d/index.html',              paths: ['golf3d'] },
    { id: '3d-engine',    label: 'Yard Master',    href: '../3d-engine-poc/index.html',       paths: ['3d-engine-poc'] },
    { id: 'supply-chain', label: 'Supply Chain',   href: '../supply-chain/index.html',        paths: ['supply-chain'] },
    { id: 'golf',         label: 'Pocket Links',   href: '../golf/index.html',                paths: ['golf'] },
    { id: 'car',          label: 'Car Costs',      href: '../car/index.html',                 paths: ['car'] },
    { id: 'bil',          label: 'Leasa · Hyra · Köpa', href: '../bil/index.html',            paths: ['bil'] },
    { id: 'paper-plane',  label: 'Paper Plane',    href: '../paper-plane/index.html',         paths: ['paper-plane'] },
    { id: 'surprise',     label: 'Surprise',       href: '../surprise/index.html',            paths: ['surprise'] },
    { id: 'home',         label: 'Landing page',   href: '../index.html',                     paths: ['index.html', 'style.css', 'js'] },
    { id: 'sand',         label: 'Sand Clock',     href: '../sand/index.html',                paths: ['sand'] },
    { id: 'cargo-packer', label: 'Cargo Packer',   href: '../cargo-packer/index.html',        paths: ['cargo-packer'] },
    { id: 'terrarium',    label: 'Terrarium',      href: '../terrarium/index.html',           paths: ['terrarium'] },
    { id: 'viz-poc',      label: 'Data Room',      href: 'index.html',                        paths: ['viz-poc'] },
    { id: 'elevator',     label: 'Elevator Tycoon',href: '../elevator/index.html',            paths: ['elevator'] },
    { id: 'wow',          label: 'WoW Countdown',  href: '../wow/index.html',                 paths: ['wow'] },
    { id: 'fika',         label: 'Fika Generator', href: '../fika/index.html',                paths: ['fika'] },
    { id: 'name-song',    label: 'Sound of Name',  href: '../name-song/index.html',           paths: ['name-song'] },
    { id: 'orbit',        label: 'Pocket Orbit',   href: '../orbit/index.html',               paths: ['orbit'] },
    { id: 'erosion',      label: 'Erosion Box',    href: '../erosion/index.html',             paths: ['erosion'] },
    { id: 'gait',         label: 'Walker Lab',     href: '../gait/index.html',                paths: ['gait'] },
    { id: 'black-hole',   label: 'Black Hole',     href: '../black-hole/index.html',          paths: ['black-hole'] },
    { id: 'usa-quiz',     label: 'USA Map Quiz',   href: '../usa-quiz/index.html',            paths: ['usa-quiz'] },
    { id: 'converter',    label: 'Converter',      href: '../converter/index.html',           paths: ['converter'] },
    { id: 'cv',           label: 'CV',             href: '../cv/index.html',                  paths: ['cv'] },
    { id: 'games',        label: 'Game Library',   href: '../games/index.html',               paths: ['games'] },
    { id: 'math',         label: 'Unit Cheatsheet',href: '../math/index.html',                paths: ['math'] },
    { id: 'sc-legacy',    label: 'Supply Chain 1', href: '../supply-chain-legacy/index.html', paths: ['supply-chain-legacy'] },
];

function walkFiles(relPath, out = []) {
    const full = join(ROOT, relPath);
    let st;
    try { st = statSync(full); } catch { return out; }
    if (st.isFile()) {
        out.push(relPath.replace(/\\/g, '/'));
        return out;
    }
    for (const entry of readdirSync(full, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || entry.name === 'vendor') continue;
        walkFiles(join(relPath, entry.name), out);
    }
    return out;
}

function isVendored(p) {
    return /(^|\/)(vendor|phaser\.min\.js|jquery\.min\.js|fontawesome)/i.test(p);
}

const rows = [];
let latestIso = '2026-01-01';

for (const proj of PROJECTS) {
    const allFiles = [];
    for (const p of proj.paths) walkFiles(p, allFiles);
    const nonBinary = allFiles.filter(f => !isVendored(f) && /\.(html|js|mjs|css|md|txt|json|sh)$/i.test(f));
    const codeFiles = nonBinary.filter(f => /\.(html|js|mjs|css|md)$/i.test(f));
    let loc = 0;
    for (const f of codeFiles) {
        const content = readFileSync(join(ROOT, f), 'utf8');
        loc += content.split(/\r?\n/).length;
    }

    const logOut = execFileSync('git', ['log', '--format=%ad', '--date=short', '--', ...proj.paths], {
        cwd: ROOT,
        encoding: 'utf8',
    }).trim();
    const dates = logOut ? logOut.split(/\r?\n/) : ['2026-09-02'];
    const touched = dates[0];
    const commits = dates.length;
    if (touched > latestIso) latestIso = touched;

    rows.push({
        id: proj.id,
        label: proj.label,
        href: proj.href,
        files: nonBinary.length,
        loc,
        touched,
        commits,
    });
}

rows.sort((a, b) => b.loc - a.loc);

const rawLines = rows.map(r => {
    const id = `'${r.id}',`.padEnd(15);
    const label = `'${r.label}',`.padEnd(20);
    const href = `'${r.href}',`.padEnd(36);
    const files = String(r.files).padStart(3);
    const loc = String(r.loc).padStart(6);
    const commits = String(r.commits).padStart(3);
    return `        [${id} ${label} ${href} ${files}, ${loc}, '${r.touched}', ${commits}]`;
}).join(',\n');

const out = `/* The repo, measured.
 *
 * Baked at authoring time rather than read at runtime: a static page cannot
 * walk its own repository, and there is no build step to generate this on
 * deploy. Regenerate with \`node tools/update-city.mjs\` when the shape of the
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
 * Measured ${latestIso}.
 */
window.VizCity = (function () {
    'use strict';

    /* id, label, href, files, loc, touched (ISO), commits */
    var RAW = [
${rawLines}
    ];

    var now = Date.parse('${latestIso}');
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
`;

writeFileSync(join(ROOT, 'viz-poc/js/data/city.js'), out);
console.log(`Updated viz-poc/js/data/city.js with ${rows.length} blocks (measured ${latestIso})`);
