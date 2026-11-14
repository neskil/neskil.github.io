// A tour hole in its live world, photographed: one load, one picture per
// camera patch. Needs a server at the repo root (python3 -m http.server 8899)
// and takes a minute or two per world on SwiftShader.
//
//   node golf3d/tools/world-shot.mjs /tmp/out turtle '{"dist":9,"pitch":0.46}' '{"dist":40,"pitch":0.8}'
//   node golf3d/tools/world-shot.mjs /tmp/out attic '{"dist":12,"pitch":0.5}' play   # then the world's event
//
// Writes <out>-<world>-<n>.png and prints G3.backdrop.debug() for each.
import { createRequire } from 'node:module';
const require = createRequire('/opt/');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = await import('playwright')); }
const [out, w, ...patches] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 640, height: 470 } });
p.on('pageerror', (e) => console.log(w, 'PAGEERR', e.message.slice(0, 300)));
p.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/TUNNEL|GPU stall|INVALID|KHR_parallel|ReadPixels|flatShading|Multiple inst/.test(m.text())) console.log(w, m.type(), m.text().slice(0, 240)); });
await p.goto('http://localhost:8899/golf3d/index.html?world=' + w + '&fly=0&demo=0&live=1');
try { await p.waitForFunction(() => window.G3 && G3.render && G3.render.live, null, { timeout: 90000 }); } catch (e) { console.log(w, 'NOT LIVE'); }
let i = 0;
for (const patch of patches.length ? patches : ['{}']) {
  await p.evaluate((j) => { if (j === 'play') G3.backdrop.play(); else G3.render.setCam(JSON.parse(j)); }, patch);
  await p.waitForTimeout(patch === 'play' ? 45000 : 6000);
  console.log(w, patch, await p.evaluate(() => JSON.stringify(G3.backdrop.debug(), (k, v) => typeof v === 'number' ? +v.toFixed(1) : v)));
  await p.screenshot({ path: `${out}-${w}-${i++}.png` });
}
await b.close();
