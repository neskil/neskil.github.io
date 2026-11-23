// Does the world's drawn ground follow a forged map's grid? The ball rolls on
// the grid (forge.js → holeOf) and the world is pressed to it (backdrop.mjs →
// sculpt); where the press falls short, what is seen and what is played part,
// which is what the owner's `clip` verdicts and "the ground doesn't follow the
// geometry" (b1-02) are about. This loads each map live, as the game does, and
// reads the world's ground back at every cell of the grid.
//
//   node golf3d/tools/forge-sculpt.mjs b2-02            # one map
//   node golf3d/tools/forge-sculpt.mjs all              # the batch
//   node golf3d/tools/forge-sculpt.mjs b2-02 --map      # …and a plan: . within 0.05, o within 0.2, + world above, - world below
//
// Needs the local server on 8899. Reports |world − grid| in golf units: the
// median, the 90th percentile and the worst cell. Batch 2's maps run about
// 0.01 / 0.04 / 0.1; a worst cell over half a unit is a step the ball does
// not see.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire('/opt/');
const { chromium } = require('playwright');
const here = dirname(fileURLToPath(import.meta.url));
let ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!ids.length || ids[0] === 'all') {
    const t = readFileSync(join(here, '..', 'js', 'forge-maps.js'), 'utf8');
    ids = JSON.parse(t.match(/window\.G3\.FORGE = (\{[\s\S]*\});\s*$/)[1]).maps.map((m) => m.id);
}
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const id of ids) {

  const p = await b.newPage({ viewport: { width: 320, height: 240 } });
  await p.addInitScript(() => { try { localStorage.setItem('loftLinks.tutorial', 'done'); } catch (e) {} });
  await p.goto('http://localhost:8899/golf3d/index.html?course=forge-' + id + '&fly=0&demo=0&live=1', { timeout: 120000, waitUntil: 'commit' });
  await p.waitForFunction(() => window.G3 && G3.backdrop && G3.backdrop.current && G3.render.live, null, { timeout: 150000 });
  await p.waitForTimeout(8000);
  const r = await p.evaluate((id) => {
    const m = G3.forge.byId(id).map, g = m.grid, a = m.at, c = Math.cos(a.yaw), sn = Math.sin(a.yaw);
    const diffs = [], rows = [];
    // The ray starts three units over the hole's highest ground: from higher it meets a canopy first (b2-12's bamboo).
    let top = -Infinity; g.h.forEach((v) => { top = Math.max(top, v); });
    for (let k = 0; k < g.nz; k++) { let row = '';
      for (let i = 0; i < g.nx; i++) {
        const gx = g.x0 + i * g.d, gz = g.z0 + k * g.d;
        const wx = a.x + a.scale * (gx * c + gz * sn), wz = a.z + a.scale * (-gx * sn + gz * c);
        const y = G3.backdrop.groundAt(wx, wz, a.y + (top + 3) * a.scale);
        if (y === null || y === undefined) { row += '?'; continue; }
        const d = (y - a.y) / a.scale - g.h[k * g.nx + i];
        diffs.push(Math.abs(d));
        row += Math.abs(d) < 0.05 ? '.' : Math.abs(d) < 0.2 ? 'o' : d > 0 ? '+' : '-';
      } rows.push(row); }
    diffs.sort((x, y) => x - y);
    return { n: diffs.length, med: diffs[diffs.length >> 1], p90: diffs[Math.floor(diffs.length * 0.9)], max: diffs[diffs.length - 1], rows: rows.reverse() };
  }, id);
  console.log(`${id}: ${r.n} cells, |world − grid| median ${r.med.toFixed(3)}, 90% ${r.p90.toFixed(3)}, max ${r.max.toFixed(2)} golf units`);
  if (process.argv.includes('--map')) console.log(r.rows.join('\n'));
  await p.close();
}
await b.close();
