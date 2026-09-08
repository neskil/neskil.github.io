#!/usr/bin/env node
// Drive turntable.html headlessly and write one contact sheet per course.
//
//   node golf3d/tools/turntable.mjs                 # every course, into a temp dir
//   node golf3d/tools/turntable.mjs seaside quarry  # just these
//   node golf3d/tools/turntable.mjs quarry --hole 4 --tile 620 --views graze,hero
//   node golf3d/tools/turntable.mjs --out /tmp/sheets --tile 380 --weather clear
//
// The sheets are pictures for a person to look at, so they land outside the
// repo — `check-site.mjs` holds every .html in the tree to the house rules and
// a generated browsing page is not a page of the site. What *is* committed is
// the page they come from and the audit printed under each row: the machine's
// half of the answer travels with the repo, and the eye's half is regenerated
// in a couple of minutes whenever somebody wants it.
//
// Chrome's own --screenshot takes the viewport, so the window is sized to the
// sheet rather than the sheet to the window.

import { mkdir, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { startServer } from '../../tools/serve.mjs';
import { findChrome } from '../../tools/chrome.mjs';

const run = promisify(execFile);
const args = process.argv.slice(2);
const opt = (name, fallback) => {
    const i = args.indexOf('--' + name);
    if (i < 0) return fallback;
    const v = args[i + 1];
    args.splice(i, 2);
    return v;
};
const outDir = resolve(opt('out', join(tmpdir(), 'loft-links-turntable')));
const tile = Number(opt('tile', 300));
const weather = opt('weather', '');
const views = opt('views', 'tee,plan,n,e,s,w,graze,hero');
const hole = opt('hole', '');
const wanted = args.filter((a) => !a.startsWith('--'));

// Every course id, read from the file rather than listed here, so a fifteenth
// course is picked up without an edit.
async function courseIds(origin) {
    const res = await fetch(`${origin}/golf3d/js/courses.js`);
    const src = await res.text();
    const block = src.slice(src.indexOf('G3.COURSES = ['));
    return [...block.matchAll(/id:\s*'([a-z0-9-]+)'/g)].map((m) => m[1]);
}

const COLS = views.split(',').length;
const TILE_H = Math.round(tile * 0.66);

async function shoot(chrome, origin, id, rows) {
    const url = `${origin}/golf3d/turntable.html?course=${id}&tile=${tile}` +
        `&views=${views}` + (weather ? `&weather=${weather}` : '') +
        (hole ? `&hole=${hole}` : '');
    const file = join(outDir, `${id}.png`);
    const width = COLS * (tile + 4) + 40;
    // Each row is a strip of stills plus the audit line under it, and the page
    // has a heading of its own — measured generously, since a screenshot that
    // clips the last hole is a screenshot nobody trusts.
    const height = rows * (TILE_H + 34) + 150;
    await run(chrome, [
        '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
        '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader',
        '--hide-scrollbars', '--mute-audio', '--no-first-run', '--disable-extensions',
        '--disable-background-networking', '--disable-component-update',
        '--disable-default-apps', '--disable-sync', '--metrics-recording-only',
        `--window-size=${width},${height}`,
        '--virtual-time-budget=120000',
        `--screenshot=${file}`,
        url
    ], { timeout: 300000, maxBuffer: 32 * 1024 * 1024 });
    return file;
}

async function main() {
    await mkdir(outDir, { recursive: true });
    const { origin, close } = await startServer(0);
    const chrome = findChrome();
    try {
        const ids = wanted.length ? wanted : await courseIds(origin);
        console.log(`Shooting ${ids.length} course${ids.length === 1 ? '' : 's'} into ${outDir}`);
        const index = [];
        for (const id of ids) {
            const started = Date.now();
            const file = await shoot(chrome, origin, id, hole ? 1 : 6);
            index.push(id);
            console.log(`  ${id.padEnd(12)} → ${file}  (${((Date.now() - started) / 1000).toFixed(1)}s)`);
        }
        // A page to flick through them in, since eight angles of six holes is
        // more than fits on a screen and a folder of PNGs is not a review.
        await writeFile(join(outDir, 'index.html'),
            '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
            '<title>Loft Links — contact sheets</title>' +
            '<style>body{background:#061422;color:#eaf6ff;font-family:ui-monospace,monospace;padding:12px}' +
            'h2{font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;color:#7fd4ff}' +
            'img{max-width:100%;display:block;margin-bottom:18px;border:1px solid #ffffff1a}</style></head><body>' +
            index.map((id) => `<h2>${id}</h2><img src="${id}.png" alt="${id}">`).join('\n') +
            '</body></html>');
        console.log(`\nOpen ${join(outDir, 'index.html')}`);
    } finally {
        await close();
    }
}

main().catch((err) => { console.error(err); process.exit(1); });
