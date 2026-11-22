// The forge's eyes: load Portals worlds in a headless browser and sample the
// ground ahead of their flights, as candidate patches for a hole. Used by
// tools/forge.mjs; runnable on its own to look at one world:
//
//   node golf3d/tools/forge-sample.mjs glider-country            # prints the patches
//
// Needs the local server on 8899 (python3 -m http.server 8899 from the repo
// root). A world is loaded through the game by borrowing a tour hole's page
// and swapping its world for the one asked for (a request intercept: nothing
// on disk changes), so it is built exactly as the game builds it.
import { createRequire } from 'node:module';
const require = createRequire('/opt/');
const { chromium } = require('playwright');

/* One patch is a rectangle of the hole's own ground, golf units: x across
   (-W/2..W/2), z along the line of play (-BACK..L), sampled every `d`. Its
   origin (the tee) is `ahead` scale-units in front of the flight's point at
   `u`, and its +z runs along the flight's heading turned by `turn`. */
export async function samplePatches(browser, world, recipe) {
    const p = await browser.newPage({ viewport: { width: 320, height: 240 } });
    await p.addInitScript(() => { try { localStorage.setItem('loftLinks.tutorial', 'done'); } catch (e) { /* ignore */ } });
    await p.route(/js\/portals\.js/, async (route) => {
        const r = await route.fetch();
        const t = (await r.text()).replace(/"carnival": \["carnival-on-the-frozen-river", \{[^\]]*\}\]/,
            `"carnival": ["${world}", {"u": 0.5, "scale": 1.8}]`);
        await route.fulfill({ response: r, body: t });
    });
    let out = null;
    try {
        await p.goto('http://localhost:8899/golf3d/index.html?world=carnival&fly=0&demo=0&live=1', { timeout: 120000 });
        await p.waitForFunction(() => window.G3 && G3.render && G3.render.live && G3.backdrop.current, null, { timeout: 150000 });
        out = await p.evaluate((R) => {
            const B = G3.backdrop, D = B.debug();
            // The world's own scale: how fast its flight goes and how high
            // over the ground (backdrop.mjs → autoScale, the same rule).
            const below = [];
            for (let u = 0.08; u <= 0.92; u += 0.07) {
                const q = B.pathAt(u), g = B.groundAt(q[0], q[2], q[1]);
                if (g !== null) below.push(q[1] - g);
            }
            below.sort((a, b) => a - b);
            let s = Math.min(3, Math.max(0.6, D.length / Math.max(5, D.duration) / 9));
            if (below.length >= 4) s = Math.min(s * 1.6, below[below.length >> 1] / (4.2 * 0.8));
            s = Math.max(0.5, Math.min(3, s)) * (R.scaleK || 1);
            const patches = [];
            for (const u of R.us) for (const turn of R.turns) {
                const a = B.pathAt(u), b = B.pathAt(Math.min(1, u + 0.01));
                let hx = b[0] - a[0], hz = b[2] - a[2];
                const hl = Math.hypot(hx, hz) || 1; hx /= hl; hz /= hl;
                const yaw = Math.atan2(hx, hz) + turn, c = Math.cos(yaw), sn = Math.sin(yaw);
                const ox = a[0] + Math.sin(yaw) * R.ahead * s, oz = a[2] + Math.cos(yaw) * R.ahead * s;
                const nx = Math.round(R.W / R.d) + 1, nz = Math.round((R.L + R.back) / R.d) + 1;
                const h = new Array(nx * nz);
                let miss = 0;
                for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
                    const gx = -R.W / 2 + i * R.d, gz = -R.back + k * R.d;
                    const wx = ox + s * (gx * c + gz * sn), wz = oz + s * (-gx * sn + gz * c);
                    const g = B.groundAt(wx, wz, a[1]);
                    h[k * nx + i] = g === null ? null : +g.toFixed(3);
                    if (g === null) miss++;
                }
                patches.push({ u, turn, yaw, scale: s, ox, oz, flightY: a[1], nx, nz, d: R.d, x0: -R.W / 2, z0: -R.back, h, miss });
            }
            return { world: D.id, scale: s, patches };
        }, recipe);
    } catch (e) {
        out = { world, error: String(e.message || e).slice(0, 160) };
    }
    await p.close();
    return out;
}

if (import.meta.url === 'file://' + process.argv[1]) {
    const world = process.argv[2];
    const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    const r = await samplePatches(b, world, { us: [0.3, 0.5, 0.7], turns: [0], ahead: 3, W: 14, L: 24, back: 3, d: 1, scaleK: 1 });
    await b.close();
    if (r.error) { console.log(r.error); process.exit(1); }
    console.log(world, 'scale', r.scale.toFixed(2));
    for (const q of r.patches) {
        const v = q.h.filter((x) => x !== null);
        const lo = Math.min(...v), hi = Math.max(...v);
        console.log(`u ${q.u} turn ${q.turn} miss ${q.miss}/${q.h.length} relief ${((hi - lo) / q.scale).toFixed(2)} golf units, flight ${((q.flightY - lo) / q.scale).toFixed(1)} over`);
    }
}
