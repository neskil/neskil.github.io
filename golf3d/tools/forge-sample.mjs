// The forge's eyes: load Portals worlds in a headless browser and sample the
// ground ahead of their flights, as candidate patches for a hole. Used by
// tools/forge.mjs; runnable on its own to look at one world:
//
//   node golf3d/tools/forge-sample.mjs glider-country            # prints the patches
//   node golf3d/tools/forge-sample.mjs still-on-the-sprue --u 0.35 --turn -0.5 --d 0.5 --map
//                                     # …and a plan of what stands on one (o low, O over a unit)
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
    // The world's scene and renderer, for looking straight down on a patch
    // (`stood` below). backdrop.mjs keeps them to itself; this copy of it,
    // served to this page only, hands them over. Nothing on disk changes.
    await p.route(/js\/backdrop\.mjs/, async (route) => {
        const r = await route.fetch();
        await route.fulfill({ response: r, body: (await r.text()) + '\nwindow.__forgeBD = { get cur() { return cur; }, get engine() { return engine; }, THREE };\n' });
    });
    let out = null;
    try {
        await p.goto('http://localhost:8899/golf3d/index.html?world=carnival&fly=0&demo=0&live=1', { timeout: 120000 });
        await p.waitForFunction(() => window.G3 && G3.render && G3.render.live && G3.backdrop.current && window.__forgeBD, null, { timeout: 150000 });
        out = await p.evaluate((R) => {
            const B = G3.backdrop, D = B.debug();
            /* What stands on a patch, seen from straight above. The ground
               probe (groundAt) skips anything small or instanced on purpose,
               so it cannot see a rod, a post or a tree trunk on the line of
               play — and the ball cannot hit any of them; it rolls through
               (b1-10's rods). So the world is drawn from above, orthographic,
               over the patch, and its depth read back: every cell gets the
               height of the highest solid thing over the ground there, in
               golf units. The camera starts `CEIL` units over the patch's
               highest ground, so a canopy above that is not counted and what
               stands under it is. Only what writes depth is drawn, which is
               what the game itself treats as solid (backdrop.mjs →
               markSoftDepth): glows, sprites and water sheets are left out. */
            const CEIL = 5, PX = 2;
            function stood(q, s, c, sn, ox, oz) {
                const { cur, engine, THREE } = window.__forgeBD;
                const v = q.h.filter((x) => x !== null);
                if (!v.length) return null;
                const hi = Math.max(...v), W = (q.nx - 1) * q.d, Lz = (q.nz - 1) * q.d;
                const cx = q.x0 + W / 2, cz = q.z0 + Lz / 2;
                const top = hi + CEIL * s, far = top - Math.min(...v) + 4 * s;
                const cam = new THREE.OrthographicCamera(-(W / 2 + q.d / 2) * s, (W / 2 + q.d / 2) * s, (Lz / 2 + q.d / 2) * s, -(Lz / 2 + q.d / 2) * s, 0, far);
                cam.position.set(ox + s * (cx * c + cz * sn), top, oz + s * (-cx * sn + cz * c));
                // Golf +x to the right of the picture and +z up it.
                cam.up.set(sn, 0, c);
                cam.lookAt(cam.position.x, top - 1, cam.position.z);
                cam.updateMatrixWorld(true);
                const w = q.nx * PX, h = q.nz * PX, r = engine.renderer, sc = cur.scene;
                const rt = new THREE.WebGLRenderTarget(w, h);
                rt.depthTexture = new THREE.DepthTexture(w, h);
                const out = new THREE.WebGLRenderTarget(w, h);
                const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
                    uniforms: { t: { value: rt.depthTexture } },
                    vertexShader: 'varying vec2 v; void main() { v = uv; gl_Position = vec4(position.xy, 0., 1.); }',
                    fragmentShader: 'uniform sampler2D t; varying vec2 v; void main() { float d = texture2D(t, v).r * 65535.; float hi = floor(d / 256.); gl_FragColor = vec4(hi / 255., (d - hi * 256.) / 255., 0., 1.); }'
                }));
                const qs = new THREE.Scene(); qs.add(quad);
                const bg = sc.background, fog = sc.fog, keep = r.getRenderTarget(), ac = r.autoClear;
                const buf = new Uint8Array(w * h * 4);
                try {
                    sc.background = null; sc.fog = null; r.autoClear = true;
                    r.setRenderTarget(rt); r.render(sc, cam);
                    r.setRenderTarget(out); r.render(qs, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));
                    r.readRenderTargetPixels(out, 0, 0, w, h, buf);
                } finally {
                    sc.background = bg; sc.fog = fog; r.autoClear = ac; r.setRenderTarget(keep);
                    rt.depthTexture.dispose(); rt.dispose(); out.dispose(); quad.geometry.dispose(); quad.material.dispose();
                }
                const res = new Array(q.nx * q.nz).fill(0);
                for (let k = 0; k < q.nz; k++) for (let i = 0; i < q.nx; i++) {
                    const g = q.h[k * q.nx + i];
                    if (g === null) continue;
                    let m = 0;
                    for (let a = 0; a < PX; a++) for (let b = 0; b < PX; b++) {
                        // Picture x runs with golf -x (the camera looks down), so mirror it.
                        const px = (q.nx - 1 - i) * PX + b, py = k * PX + a, j = (py * w + px) * 4;
                        const d = (buf[j] * 256 + buf[j + 1]) / 65535;
                        if (d >= 0.9999) continue;
                        m = Math.max(m, (top - d * far - g) / s);
                    }
                    res[k * q.nx + i] = +m.toFixed(2);
                }
                return res;
            }
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
                const q = { u, turn, yaw, scale: s, ox, oz, flightY: a[1], nx, nz, d: R.d, x0: -R.W / 2, z0: -R.back, h, miss };
                try { q.stood = stood(q, s, c, sn, ox, oz); } catch (e) { q.stood = null; q.stoodErr = String(e.message || e).slice(0, 120); }
                patches.push(q);
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
    const world = process.argv[2], one = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
    const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    const r = await samplePatches(b, world, { us: one('--u', '0.3,0.5,0.7').split(',').map(Number), turns: one('--turn', '0').split(',').map(Number), ahead: 3, W: 16, L: +one('--L', 24), back: 3, d: +one('--d', 1), scaleK: 1 });
    await b.close();
    if (r.error) { console.log(r.error); process.exit(1); }
    console.log(world, 'scale', r.scale.toFixed(2));
    for (const q of r.patches) {
        const v = q.h.filter((x) => x !== null);
        const lo = Math.min(...v), hi = Math.max(...v);
        const st = q.stood ? q.stood.filter((x) => x >= 0.15).length : '?';
        console.log(`u ${q.u} turn ${q.turn} miss ${q.miss}/${q.h.length} relief ${((hi - lo) / q.scale).toFixed(2)} golf units, flight ${((q.flightY - lo) / q.scale).toFixed(1)} over, ${st} cells with something standing${q.stoodErr ? ' (' + q.stoodErr + ')' : ''}`);
        if (process.argv.includes('--map') && q.stood) {
            for (let k = q.nz - 1; k >= 0; k--) {
                let row = '';
                for (let i = 0; i < q.nx; i++) { const t = q.stood[k * q.nx + i]; row += t < 0.15 ? '.' : t < 1 ? 'o' : 'O'; }
                console.log('  ' + row);
            }
        }
    }
}
