// The ground of a Portals world, read off its own geometry: a coarse map for
// finding a spot, or a fine grid for sculpting a hole to it.
//
//   node golf3d/tools/world-ground.mjs turtle                       # map: 30 x 30 over ±300
//   node golf3d/tools/world-ground.mjs turtle --box -60,-240,60,-60 --step 4 --json out.json
//
//   … --any            everything solid, not only broad ground: a table's plates, a floor's furniture
//   … --from 40        cast from this height (under a roof, a canopy)
//
// `turtle` is a tour hole's id (its world is loaded through the game, live).
// Needs the local server on 8899 (python3 -m http.server 8899 from the repo
// root) and a Chromium; heights are world units, null over nothing.
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/opt/');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = await import('playwright')); }
const args = process.argv.slice(2), id = args[0];
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const box = val('--box', '-300,-300,300,300').split(',').map(Number), step = +val('--step', 20);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 320, height: 240 } });
await p.goto('http://localhost:8899/golf3d/index.html?world=' + id + '&fly=0&demo=0&live=1');
await p.waitForFunction(() => window.G3 && G3.render && G3.render.live, null, { timeout: 120000 });
const any = args.includes('--any'), from = val('--from') === undefined ? null : +val('--from');
const out = await p.evaluate(([box, step, any, from]) => {
    const B = G3.backdrop, rows = [];
    for (let z = box[1]; z <= box[3] + 1e-6; z += step) {
        const row = [];
        for (let x = box[0]; x <= box[2] + 1e-6; x += step) { const h = B.groundAt(x, z, from, any); row.push(h === null ? null : +h.toFixed(2)); }
        rows.push(row);
    }
    return { rows, path: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((u) => B.pathAt(u).map((v) => Math.round(v))) };
}, [box, step, any, from]);
await b.close();
if (val('--json')) { writeFileSync(val('--json'), JSON.stringify({ box, step, rows: out.rows })); console.log('wrote', val('--json'), out.rows.length + ' x ' + out.rows[0].length); }
else {
    console.log('path (u=0..1):', out.path.map((q) => q.join(',')).join('  '));
    console.log('x: ' + out.rows[0].map((_, i) => String(box[0] + i * step).padStart(5)).join(''));
    out.rows.forEach((r, k) => console.log(String(box[1] + k * step).padStart(5) + ' ' + r.map((h) => h === null ? '    .' : String(Math.round(h)).padStart(5)).join('')));
}
