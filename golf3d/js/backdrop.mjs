/* The live worlds behind the tour's holes.

   Each hole of the world tour is played inside a world from Ethan Mollick's
   Portals (github.com/emollick/ai-portals, CC BY-NC-SA 4.0), and this is the
   file that makes that literal: the world's own module is loaded, built by
   Portals' own engine and drawn with its own three.js (r170, an ES module —
   vendor/portals/, unmodified) into a canvas of its own. render.js then
   paints that canvas behind the hole as the scene's background. Two
   renderers, one picture: the golf is this game's, the place is theirs.

   Nothing here is needed to play. It is a module, loaded after everything
   else, and until a world has finished building — or on a machine where it
   never will — the hole stands under its theme's own sky with the simple
   set piece worlds.js builds. `G3.backdrop` is what the classic scripts see.

   The camera is the golf camera, carried into the world: a hole is given a
   place on the world's flight path (`u`), and the seat behind the ball on the
   tee is put on the path there, looking the way the flight looks. Every move
   the golf camera makes from that seat the world camera makes too, times
   `scale` (world units to a golf unit), so the hole and the world turn as
   one thing. */
import * as THREE from 'three';
import { Engine } from '../vendor/portals/src/core/engine.js';
/* Portals' own list of its worlds: what each is called and how its camera is
   to be treated (nearThrough, media…), and how to load it. A world is built
   from its own entry here, the way Portals builds it. */
import { WORLDS as REGISTRY } from '../vendor/portals/src/worlds/index.js';
const REG = {};
for (const d of REGISTRY) REG[d.id] = d;
function defFor(id) {
    return REG[id] ? { ...REG[id] } : { id, name: id, load: () => import('../vendor/portals/src/worlds/' + id + '.js') };
}

const G3 = window.G3;
const canvas = document.createElement('canvas');
const size = { w: 640, h: 360 };
let engine = null, cur = null, wanted = null, loading = null, failed = {};
/* The next world, built ahead (prepare, below): kept beside `cur` and never
   drawn until it is asked for, and `early` while its build may only take a
   slice of each frame because a hole is still being played in front of it. */
let spare = null, early = false, aside = null;
/* Held: the player is in the middle of something (a stroke being drawn, a
   ball in the air) and a world being built aside gets no time at all until
   they are done. game.js says so every frame (`hold`). */
let held = false, slices = 0;   // frames a build aside has been given, for stats()
let clock = 0;
const ev = { on: false, t: 0 };
const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
const info = { near: 0.1, far: 5000, scale: 1, w: 2, h: 2 };
let qualityTier = 'auto', depthScale = 0.5, worldBloom = true, shadowEvery = 1, frameTick = 0;

function applyQuality() {
    const T = (G3.CONFIG && G3.CONFIG.QUALITY_TIERS && G3.CONFIG.QUALITY_TIERS[qualityTier]) || null;
    depthScale = T ? T.depthScale : (qualityTier === 'high' || qualityTier === 'ultra' ? 1.0 : 0.5);
    worldBloom = T ? T.worldBloom !== false : (qualityTier !== 'low');
    shadowEvery = T ? (T.shadowEvery || 1) : 1;
    if (engine) {
        if (engine.post && engine.post.bloom) {
            engine.post.bloom.enabled = worldBloom && engine.rtType === THREE.HalfFloatType;
        }
        engine._resize();
    }
}

let lastDepthTex = null;

function boot() {
    if (engine) return engine;
    engine = new Engine(canvas, [], {
        freeze: true, hold: true, single: true, quality: 'medium', pixelRatio: 1,   // one level everywhere: a hole is baked to this level's ground
        samples: 0, checkShaders: false
    });
    for (const rt of [engine.post.composer.renderTarget1, engine.post.composer.renderTarget2]) {
        rt.depthTexture = new THREE.DepthTexture(size.w, size.h);
        rt.depthTexture.minFilter = THREE.NearestFilter;
        rt.depthTexture.magFilter = THREE.NearestFilter;
    }
    engine.post.guard.material.depthTest = engine.post.guard.material.depthWrite = false;
    engine.post.final.material.depthTest = engine.post.final.material.depthWrite = false;
    const rpRender = engine.post.renderPass.render.bind(engine.post.renderPass);
    engine.post.renderPass.render = (renderer, writeBuffer, readBuffer, dt, mask) => {
        renderer.autoClearDepth = true;
        rpRender(renderer, writeBuffer, readBuffer, dt, mask);
        renderer.autoClearDepth = false;
        lastDepthTex = readBuffer.depthTexture || null;
    };
    // The engine sizes itself to the window; this one is sized to the stage.
    engine._resize = function () {
        const w = size.w, h = size.h;
        if (w < 2 || h < 2) return;
        this.w = w; this.h = h;
        // Twice the height: the picture in the top half, its depth below.
        this.renderer.setPixelRatio(1); this.renderer.setSize(w, 2 * h, false);
        const dw = Math.max(2, Math.round(w * depthScale)), dh = Math.max(2, Math.round(h * depthScale));
        depthRT.setSize(dw, dh);
        this.post.setSize(w, h, 1);
        this.portalRT.setSize(w, h);
        this.camera.aspect = this.portalCam.aspect = w / h;
    };
    applyQuality();
    /* How long a build may hold the page between two frames. The engine is
       made `hold`, which says "as long as it likes" — right for a world
       built behind the closed portal, where nothing else is on screen. A
       world built ahead while a hole is still on screen is built a few
       milliseconds a frame instead, the way Portals builds its next world
       during a flight — and gentler still when a live world is already
       being drawn every frame. */
    engine._budget = function () { return early ? (cur ? 3.5 : (coarse ? 4 : 6)) : 1e9; };
    /* …and none at all while held. A build only goes on when the engine
       hands it the next frame (its waiters, released in `_tick`), so a held
       frame simply does not release them: the build stands where it is,
       mid-step, and picks up again on the first frame after. Only a build
       aside is held — one somebody is waiting behind the portal for is not. */
    const tick = engine._tick;
    engine._tick = function (now) {
        if (held && early) { requestAnimationFrame(engine._tick); return; }
        if (early) slices++;
        tick(now);
    };
    // The engine names each step of a build as it starts it; that is what
    // the loading bar follows (track, below).
    const perf = engine.perf, setPhase = perf.setPhase.bind(perf);
    perf.setPhase = (p) => { setPhase(p); track(p); };
    return engine;
}

/* ── how far along a build is ───────────────────────────────────────────

   The engine says which step of a build it is on (fetch, leaf, build,
   compile, warm) but not how far through it, so the bar is an estimate:
   each step is given the time it took on this device last time — for this
   world if it has been built here before, else the device's running
   average over every world — and a step still running creeps towards its
   end, never past it. The times are kept between visits, so the second
   visit's bar is closer to the truth than the first. A guess that runs
   long only slows the bar down; it never runs backwards (game.js keeps the
   bar monotonic). */
const STEPS = ['fetch', 'leaf', 'build', 'compile', 'warm'];
const DEFAULT_MS = { fetch: 1500, leaf: 200, build: 3000, compile: 3000, warm: 1500 };
const TIMES = 'golf3d.worldTimes';
let job = null, times = null;
function loadTimes() {
    if (times) return times;
    try { times = JSON.parse(localStorage.getItem(TIMES) || 'null'); } catch (e) { times = null; }
    if (!times || typeof times !== 'object') times = {};
    if (!times.avg) times.avg = { ...DEFAULT_MS };
    if (!times.w) times.w = {};
    return times;
}
function saveTimes() { try { localStorage.setItem(TIMES, JSON.stringify(times)); } catch (e) { /* ignore */ } }
function track(p) {
    const now = performance.now();
    const m = /^([a-z]+):([^:]+)/.exec(p || '');
    if (job && job.step) { job.ms[job.step] = (job.ms[job.step] || 0) + now - job.t; job.step = null; }
    if (!m || STEPS.indexOf(m[1]) < 0) return;
    if (!job || job.id !== m[2]) job = { id: m[2], ms: {}, step: null, t: now, done: false };
    job.step = m[1]; job.t = now;
}
// A build that finished: what each step took goes into the record.
function learn(id) {
    if (!job || job.id !== id) return;
    track('');
    const T = loadTimes(), mine = {};
    for (const k of STEPS) {
        const v = job.ms[k] || 0;
        mine[k] = Math.round(v);
        // the fetch of a world already in the cache says nothing about the network
        if (k === 'fetch' && v < 50) continue;
        T.avg[k] = Math.round(T.avg[k] * 0.6 + v * 0.4);
    }
    T.w[id] = mine;
    saveTimes();
    job.done = true;
}
/* 0…1 for the world `id`: 1 once it is built, null when nothing is known
   about it (it has not started and is not waiting behind another build). */
function progress(id) {
    if (!id) return null;
    if ((cur && cur.def.id === id) || (spare && spare.def.id === id)) return { p: 1, step: 'show' };
    if (!job || job.id !== id || job.done) return loading || wanted === id ? { p: 0, step: 'queue' } : null;
    const T = loadTimes(), own = T.w[id], now = performance.now();
    const expect = (k) => Math.max(80, own && own[k] ? own[k] : T.avg[k]);
    let total = 0, got = 0;
    for (const k of STEPS) {
        const e = expect(k); total += e;
        if (k === job.step) {
            const ran = (job.ms[k] || 0) + now - job.t;
            got += e * (1 - Math.exp(-1.4 * ran / e)) * 0.97;
        } else if (job.ms[k] !== undefined || STEPS.indexOf(k) < STEPS.indexOf(job.step || 'warm')) got += e;
    }
    return { p: Math.min(0.98, got / total), step: job.step || 'build' };
}

/* ── depth ──────────────────────────────────────────────────────────────

   The hole and the world are drawn by two renderers that share nothing, so
   for the world to stand in front of the hole as well as behind it the
   world has to say how far away each of its pixels is. After the picture,
   the world is drawn once more with one plain material that writes distance
   from the camera (16 bits on a log scale, in red and green) into a buffer,
   and that buffer is copied into the bottom half of the canvas. render.js
   reads both halves from the one texture and writes the distance into its
   own depth buffer before it draws the hole (`addWorldPlate`).

   Only what is solid is drawn: glows, sprites, particles, sky domes and
   anything cut out by an alpha map are left out, because a plain material
   would draw each as the whole sheet it is cut from. */
const depthRT = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const depthMat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { uNear: { value: 0.1 }, uFar: { value: 5000 } },
    vertexShader: `
        #include <common>
        #include <skinning_pars_vertex>
        varying float vZ;
        void main() {
            #include <skinbase_vertex>
            #include <begin_vertex>
            #include <skinning_vertex>
            #include <project_vertex>
            vZ = -mvPosition.z;
        }`,
    fragmentShader: `
        uniform float uNear, uFar;
        varying float vZ;
        void main() {
            float n = clamp(log(max(vZ, uNear) / uNear) / log(uFar / uNear), 0., 1.) * 65534.;
            float hi = floor(n / 256.);
            gl_FragColor = vec4(hi / 255., floor(n - hi * 256.) / 255., 0., 1.);
        }`
});
const blitScene = new THREE.Scene(), blitCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const blitMat = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: {
        t: { value: depthRT.texture },
        uNear: { value: 0.1 },
        uFar: { value: 5000 },
        uHw: { value: 0 }
    },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `
        uniform sampler2D t;
        uniform float uNear, uFar, uHw;
        varying vec2 vUv;
        void main() {
            if (uHw > 0.5) {
                float d = texture2D(t, vUv).r;
                if (d >= 0.999999) { gl_FragColor = vec4(1., 1., 0., 1.); return; }
                float vZ = (uFar * uNear) / max(uFar - d * (uFar - uNear), 1e-6);
                float n = clamp(log(max(vZ, uNear) / uNear) / log(uFar / uNear), 0., 1.) * 65534.;
                float hi = floor(n / 256.);
                gl_FragColor = vec4(hi / 255., floor(n - hi * 256.) / 255., 0., 1.);
            } else {
                gl_FragColor = vec4(texture2D(t, vUv).rgb, 1.);
            }
        }`
});
{ const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blitMat); q.frustumCulled = false; blitScene.add(q); }

function solid(o) {
    if (!o.isMesh) return false;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!m) return false;
    if (m.depthWrite === false || m.depthTest === false || m.side === THREE.BackSide) return false;
    if (m.transparent && (m.opacity < 0.6 || m.blending !== THREE.NormalBlending)) return false;
    if (m.alphaTest > 0 || m.alphaMap) return false;
    return true;
}
function markSoftDepth(W) {
    if (W.softAt !== undefined && (W.softAt = W.softAt + 1) <= 90) return;
    W.softAt = 0;
    W.scene.traverse((o) => {
        if (!o.material) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
            if (!m) continue;
            if (o.isPoints || o.isLine || o.isSprite || m.side === THREE.BackSide ||
                (m.transparent && (m.isShaderMaterial || m.isRawShaderMaterial || m.opacity < 0.6 || m.blending !== THREE.NormalBlending || m.alphaMap))) {
                m.depthWrite = false;
            }
        }
    });
}
const _white = new THREE.Color(0xffffff), _keep = new THREE.Color();
function drawDepth(W, c, w, h) {
    const r = engine.renderer, sc = W.scene;
    if (lastDepthTex) {
        const ac = r.autoClear;
        blitMat.uniforms.t.value = lastDepthTex;
        blitMat.uniforms.uNear.value = c.near;
        blitMat.uniforms.uFar.value = c.far;
        blitMat.uniforms.uHw.value = 1;
        try {
            r.setRenderTarget(null); r.setViewport(0, 0, w, h); r.autoClear = false;
            r.render(blitScene, blitCam);
        } finally {
            r.autoClear = ac;
            r.setRenderTarget(null);
        }
        return;
    }
    // Fallback when hardware depth texture is unavailable.
    if (!W.soft) {
        W.soft = [];
        sc.traverse(o => { if ((o.isMesh || o.isPoints || o.isLine || o.isSprite) && !solid(o)) W.soft.push(o); });
    }
    const hid = [];
    for (const o of W.soft) if (o.visible) { o.visible = false; hid.push(o); }
    const bg = sc.background, om = sc.overrideMaterial, ac = r.autoClear, a = r.getClearAlpha();
    const smAuto = r.shadowMap.autoUpdate;
    r.getClearColor(_keep);
    depthMat.uniforms.uNear.value = c.near; depthMat.uniforms.uFar.value = c.far;
    blitMat.uniforms.t.value = depthRT.texture; blitMat.uniforms.uHw.value = 0;
    try {
        sc.background = null; sc.overrideMaterial = depthMat;
        r.shadowMap.autoUpdate = false;
        r.setRenderTarget(depthRT); r.setClearColor(_white, 1); r.autoClear = true;
        r.render(sc, c);
        r.setRenderTarget(null); r.setViewport(0, 0, w, h); r.autoClear = false;
        r.render(blitScene, blitCam);
    } finally {
        sc.background = bg; sc.overrideMaterial = om; r.autoClear = ac; r.setClearColor(_keep, a);
        r.shadowMap.autoUpdate = smAuto;
        r.setRenderTarget(null);
        for (const o of hid) o.visible = true;
    }
}

/* ── the hole's ground, put into the world ──────────────────────────────

   A sculpted hole is played on a copy of the world's ground, baked once
   (tools/bake-ground.mjs): smoothed a little, with a tee and a green
   levelled into it. The world's own terrain is not that copy — and laid one
   over the other the differences showed as a green hanging in the air over
   a slope, or a ball rolling a hand above the turf. So the world is edited
   to agree. Once per hole, every vertex of its ground inside the hole's
   plan is moved to the height the bake has there, feathered back to the
   world's own shape over a few units outside it; what stands in the strips
   the hole mows (`place.clear`: trees, stones, tufts, all instanced) is
   taken out. After this the world's picture *is* the hole's ground, and
   render.js paints the fairways on it.

   vendor/portals/ is not touched: this moves vertices of the world as it
   was built in memory, for this visit. */
const _m4 = new THREE.Matrix4(), _inv = new THREE.Matrix4(), _n = new THREE.Vector3(), _s3 = new THREE.Vector3();
function sculpt(W, place) {
    const G = place.grid, at = place.at, s = at.scale || 1, c = Math.cos(at.yaw || 0), sn = Math.sin(at.yaw || 0);
    const toGolf = (wx, wz) => { const dx = (wx - at.x) / s, dz = (wz - at.z) / s; return [dx * c - dz * sn, dx * sn + dz * c]; };
    const x1 = G.x0 + (G.nx - 1) * G.d, z1 = G.z0 + (G.nz - 1) * G.d, F = 3;
    const gridAt = (gx, gz) => {
        const fx = Math.max(0, Math.min(G.nx - 1.001, (gx - G.x0) / G.d)), fz = Math.max(0, Math.min(G.nz - 1.001, (gz - G.z0) / G.d));
        const ix = Math.floor(fx), iz = Math.floor(fz), ux = fx - ix, uz = fz - iz, h = G.h, k = iz * G.nx + ix;
        return (h[k] * (1 - ux) + h[k + 1] * ux) * (1 - uz) + (h[k + G.nx] * (1 - ux) + h[k + G.nx + 1] * ux) * uz;
    };
    const rects = place.clear || [];
    // A box, or a road's band: [x0, z0, x1, z1, 'cap', radius] (render.js → the clearing).
    const inCap = (gx, gz, r) => {
        const ax = r[2] - r[0], az = r[3] - r[1], t = Math.max(0, Math.min(1, ((gx - r[0]) * ax + (gz - r[1]) * az) / (ax * ax + az * az || 1)));
        return Math.hypot(gx - r[0] - ax * t, gz - r[1] - az * t) < r[5];
    };
    const inStrip = (gx, gz) => rects.some((r) => r[4] === 'cap' ? inCap(gx, gz, r) : gx > r[0] && gx < r[2] && gz > r[1] && gz < r[3]);
    W.scene.updateMatrixWorld(true);
    let moved = 0, cleared = 0;
    const undo = W.undo = [];
    /* `press: false` is a hole played on ground that is already what the
       bake says, with things standing on it that the bake also has (a laid
       table): pressing the cloth to those heights drew it up over every cup
       and plate. Such a hole only has its strips cleared. */
    const press = place.press !== false;
    W.scene.traverse((o) => {
        if (!o.isMesh || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
        const m = Array.isArray(o.material) ? o.material[0] : o.material;
        if (!m || m.side === THREE.BackSide || (m.transparent && m.depthWrite === false)) return;
        if (o.isInstancedMesh) {
            let any = false;
            for (let i = 0; i < o.count; i++) {
                o.getMatrixAt(i, _m4);
                _p.setFromMatrixPosition(_m4).applyMatrix4(o.matrixWorld);
                const g = toGolf(_p.x, _p.z);
                if (!inStrip(g[0], g[1])) continue;
                if (!any) { const keep = o.instanceMatrix.array.slice(); undo.push(() => { o.instanceMatrix.array.set(keep); o.instanceMatrix.needsUpdate = true; }); }
                _s3.setFromMatrixPosition(_m4);
                _m4.makeScale(0, 0, 0).setPosition(_s3);
                o.setMatrixAt(i, _m4); any = true; cleared++;
            }
            if (any) o.instanceMatrix.needsUpdate = true;
            return;
        }
        if (o.isSkinnedMesh || !press) return;
        if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
        if (o.geometry.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis() < 30) return;
        const pos = o.geometry.attributes.position, nor = o.geometry.attributes.normal;
        _inv.copy(o.matrixWorld).invert();
        let n = 0;
        const was = pos.array.slice(), wasN = nor ? nor.array.slice() : null;
        for (let i = 0; i < pos.count; i++) {
            _p.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
            const g = toGolf(_p.x, _p.z);
            const e = Math.hypot(Math.max(G.x0 - g[0], g[0] - x1, 0), Math.max(G.z0 - g[1], g[1] - z1, 0));
            if (e >= F) continue;
            // Ground only: the top of the land, not a cliff's face or a bridge's underside.
            if (nor) { _n.fromBufferAttribute(nor, i).transformDirection(o.matrixWorld); if (_n.y < 0.35) continue; }
            const gy = gridAt(g[0], g[1]), diff = at.y + gy * s - _p.y;
            // …and only where the bake is this ground: not a sea bed under
            // a sea the bake stopped at, not the far side of a cliff it rounded.
            // `reach` is how far, in the hole's units, the land may be moved:
            // a groomed hole (tools/groom-ground.mjs) fills its own dips.
            if (Math.abs(diff) > (place.reach || 1.6) * s || (gy <= 0.02 && diff > 0)) continue;
            const u = e / F, w = 1 - u * u * (3 - 2 * u);
            _p.y += diff * w;
            _p.applyMatrix4(_inv);
            pos.setXYZ(i, _p.x, _p.y, _p.z); n++;
        }
        if (n) {
            pos.needsUpdate = true; moved += n;
            if (nor) o.geometry.computeVertexNormals();
            o.geometry.computeBoundingSphere(); o.geometry.computeBoundingBox();
            undo.push(() => {
                pos.array.set(was); pos.needsUpdate = true;
                if (wasN) { o.geometry.attributes.normal.array.set(wasN); o.geometry.attributes.normal.needsUpdate = true; }
                o.geometry.computeBoundingSphere(); o.geometry.computeBoundingBox();
            });
        }
    });
    W.soft = null;
    return { moved, cleared };
}

// Put the world back the way its makers left it.
function unsculpt(W) {
    if (!W.undo) return;
    for (const f of W.undo) { try { f(); } catch (e) { /* a mesh that has gone */ } }
    W.undo = null; W.soft = null;
}

function seedOf(id) { let h = 2166136261; for (const c of id) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

/* Ask for a world. Resolves true once it is the one being drawn. Asking for
   another while one is building is fine: the last asked for wins, and a
   world nobody is waiting for any more is thrown away as soon as it lands. */
async function want(id) {
    wanted = id;
    // Whatever is asked for now is wanted on screen: no more slices. (A hole
    // with no world wants nothing built, so a world being built aside for
    // later keeps to its slices under it — and so does a hole asking again
    // for the world it already has: a restart, the live switch. That used to
    // take the slices off the next world's build half way through it, and
    // the rest of it then held the page for seconds while the hole was
    // being played.)
    if (id && !(cur && cur.def.id === id)) early = false;
    // A hole with no world (a demo hole, a drawn course) keeps the spare:
    // nothing else is being built for it, and it is the tour's next world.
    if (spare && id && spare.def.id !== id) dropSpare();
    if (!id) return false;
    if (cur && cur.def.id === id) return true;
    if (spare) return takeSpare();
    if (failed[id]) return false;
    if (loading) { try { await loading; } catch (e) { /* its own caller hears */ } return want2(id); }
    return want2(id);
}
async function want2(id) {
    if (wanted !== id) return false;
    if (cur && cur.def.id === id) return true;
    if (spare && spare.def.id === id) return takeSpare();
    const E = boot();
    const def = defFor(id);
    const job = loading = E._load(def, seedOf(id));
    let W = null;
    try { W = await job; } catch (e) { failed[id] = true; console.warn('backdrop: ' + id + ' did not build', e); }
    if (loading === job) loading = null;
    if (!W) return false;
    learn(id);
    if (W.ctx) W.ctx.through = true;
    if (W.portal && W.portal.group) W.portal.group.visible = false;
    if (wanted !== id) { try { E._dispose(W); } catch (e) { /* ignore */ } return want2(wanted); }
    if (cur) { try { E._dispose(cur); } catch (e) { /* ignore */ } }
    cur = W;
    cur.anchor = null;
    return true;
}

/* Build the next hole's world while this one is still on screen — from the
   sink, during the celebration and the dive into the cup, so that the
   portal has less to hide. Nothing is shown: the world is kept aside, and
   `want` swaps it in at once when the next hole asks for it. Asking for
   anything else throws it away. Peak memory is what it always was (a
   world has always been built while the last one still stood); it is held
   a little longer. Refused while anything else is building. */
async function prepare(id) {
    if (!id || failed[id] || loading || (cur && cur.def.id === id) || (spare && spare.def.id === id)) return false;
    const E = boot();
    const def = defFor(id);
    // One world kept aside at a time.
    dropSpare();
    early = true; aside = id;
    const was = wanted;
    const job = loading = E._load(def, seedOf(id));
    let W = null;
    try { W = await job; } catch (e) { failed[id] = true; console.warn('backdrop: ' + id + ' did not build', e); }
    if (loading === job) loading = null;
    early = false; aside = null;
    if (!W) return false;
    learn(id);
    if (W.ctx) W.ctx.through = true;
    if (W.portal && W.portal.group) W.portal.group.visible = false;
    // Still on its way to being wanted (the hole it is for, or this one still
    // being played, or nothing at all yet — the demo or the menu, before the
    // tour has started), or asked for meanwhile — a `want` waiting on this
    // build runs after this line and finds it.
    if (wanted === id || wanted === was || !wanted || (cur && wanted === cur.def.id)) { spare = W; return true; }
    try { E._dispose(W); } catch (e) { /* ignore */ }
    return false;
}
function takeSpare() {
    if (cur) { try { engine._dispose(cur); } catch (e) { /* ignore */ } }
    cur = spare; spare = null;
    cur.anchor = null;
    // Built is not drawn: the first frames are the risky ones as well.
    return true;
}
function dropSpare() {
    if (!spare) return;
    try { engine._dispose(spare); } catch (e) { /* ignore */ }
    spare = null;
}

const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _t = new THREE.Vector3();
const _yaw = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _g = new THREE.Quaternion();

/* Where the hole stands in the world: the seat on the tee is on the path at
   `u`, and the hole runs the way the path does. Worked out once per hole. */
function anchorFor(W, place, seat) {
    /* A hole sculpted to a spot says exactly where it is: golf's origin at a
       point of the world, golf's +z along a compass heading, golf's y = 0 at
       a height, and the scale. Its ground was baked from the world's at that
       same placing (tools/bake-ground.mjs), so nothing is searched for. */
    if (place.at) {
        const s = place.at.scale || 1, turn = place.at.yaw || 0;
        _yaw.setFromAxisAngle(_up, turn);
        _q.set(seat.x, 0, seat.z).multiplyScalar(s).applyQuaternion(_yaw);
        return { x: place.at.x + _q.x, y: place.at.y, z: place.at.z + _q.z, turn, u: place.u === undefined ? 0.3 : place.u,
            sx: seat.x, sy: 0, sz: seat.z, scale: s, ground: place.at.y, height: null, py: place.at.y };
    }
    const fit = place.u === undefined ? bestU(W, seat) : fitAt(W, place.u, seat, place);
    const A = fit || fitAt(W, 0.35, seat, { ground: false });
    if (place.scale) A.scale = place.scale;
    A.turn += (place.turn || 0);
    A.x += (place.dx || 0); A.z += (place.dz || 0);
    A.y = A.ground !== null && place.ground !== false
        ? A.ground + (place.lift || 0)
        : A.py - (place.drop === undefined ? seat.h : place.drop) * A.scale + (place.lift || 0);
    return A;
}

/* The fit at one point of the flight. The seat behind the ball is put where
   the flight is, looking the way it looks — so the first thing a player sees
   from the tee is a view the world's makers composed — and the hole is laid
   out ahead and below, on whatever the world has there: a ray straight down
   through the world's own geometry under the seat says how high the flight is
   over the ground, and **that height sets the scale**. A seat is `seat.h`
   golf units over its tee, so a flight forty metres up makes a golf unit
   ten metres and the hole a course laid across the country below, and one
   skimming a table top makes it a toy on the table. Then a second ray, under
   the middle of the hole, is the ground the hole stands on.

   `A.y` (set by anchorFor) is the world height of golf's y = 0. */
function fitAt(W, u, seat, place) {
    W.path.pointAt(u, _p);
    W.path.pointAt(Math.min(1, u + 0.01), _q);
    _t.copy(_q).sub(_p); _t.y = 0;
    if (_t.lengthSq() < 1e-8) _t.set(0, 0, -1);
    _t.normalize();
    // The golf seat looks along (sin yaw, cos yaw); turn that on to the path.
    const turn = Math.atan2(_t.x, _t.z) - seat.yaw;
    const A = { x: _p.x, py: _p.y, y: 0, z: _p.z, turn, u, sx: seat.x, sy: 0, sz: seat.z,
        scale: 1, ground: null, height: null };
    if (place && place.ground === false) return A;
    const under = groundUnder(W, _p.x, _p.y, _p.z);
    if (under === null) return A;
    A.height = _p.y - under;
    A.scale = Math.max(1.2, Math.min(6, A.height / seat.h));
    _yaw.setFromAxisAngle(_up, turn);
    _q.set(seat.cx - seat.x, 0, seat.cz - seat.z).multiplyScalar(A.scale).applyQuaternion(_yaw);
    const castY = Math.min(A.py, under + Math.max(6, A.height * 0.5));
    const g = groundUnder(W, A.x + _q.x, castY, A.z + _q.z);
    A.step = g === null ? 0 : Math.abs(g - under) / A.scale;
    A.ground = (g !== null && Math.abs(g - under) <= Math.max(4, A.height * 0.6)) ? g : under;
    return A;
}

/* …and which point. A world says (`place.u`) or the flight is searched: the
   place where it passes lowest over ground that is nearly level from the
   seat to the middle of the hole — the lowest, because near the ground is
   where a world's detail is, and level, because a hole laid across a cliff
   edge is half buried. The ends are left out: a flight starts and finishes
   inside a portal. */
function bestU(W, seat) {
    let best = null, score = Infinity;
    for (let u = 0.12; u <= 0.86; u += 0.04) {
        const A = fitAt(W, u, seat, null);
        if (A.ground === null || A.height < 1.5) continue;
        const s = A.height * (1 + A.step);
        if (s < score) { score = s; best = A; }
    }
    return best;
}

const _ray = new THREE.Raycaster(), _down = new THREE.Vector3(0, -1, 0);
function groundUnder(W, x, y, z, any) {
    try {
        _ray.set(_t.set(x, y, z), _down);
        _ray.camera = engine.camera;
        _ray.far = 4000;
        const hits = _ray.intersectObjects(W.scene.children, true);
        for (const h of hits) {
            const o = h.object, m = Array.isArray(o.material) ? o.material[0] : o.material;
            if (!o.isMesh || !m || m.side === THREE.BackSide) continue;
            // Ground, not furniture: a lantern, a bird or a cloud puff under
            // the flight is not somewhere to lay a hole. Only something
            // broad counts — and nothing instanced, which is always a crowd.
            // (`any` asks for whatever is solid instead — the top of a loaf,
            // a book, a stall — for a hole that plays over a world's things.)
            if (o.isSkinnedMesh) continue;
            if (!any) {
                if (o.isInstancedMesh) continue;
                if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
                const sc = o.matrixWorld.getMaxScaleOnAxis();
                if (o.geometry.boundingSphere.radius * sc < 30) continue;
            } else if (m.alphaTest > 0 || m.alphaMap || (m.transparent && m.opacity < 0.6)) continue;
            if (m.transparent && m.depthWrite === false) continue;
            let v = o, shown = true;
            while (v) { if (!v.visible) { shown = false; break; } v = v.parent; }
            if (!shown) continue;
            // Not a roof: the face has to look up.
            if (h.face && h.face.normal) {
                _q.copy(h.face.normal).transformDirection(o.matrixWorld);
                if (_q.y < 0.3) continue;
            }
            return h.point.y;
        }
    } catch (e) { console.warn('backdrop ground', e); }
    return null;
}

/* One frame: `cam` is the golf camera (r128 — only its numbers are read),
   `seat` the pose behind the ball on the tee. Returns false when there is
   nothing to show. */
function frame(dt, cam, place, seat, w, h, clear) {
    const W = cur;
    if (!W || !engine || engine.lost || !place || W.def.id !== place.world) return false;
    if (w !== size.w || h !== size.h) { size.w = w; size.h = h; engine._resize(); }
    let crossed = null;
    if (place.drift) crossed = drift(W, place, seat, dt);
    else if (!W.anchor || W.anchor.key !== place) { W.anchor = anchorFor(W, place, seat); W.anchor.key = place; }
    const A = cur.anchor, c = engine.camera;
    if (crossed) return frameOf(cur, place, dt, cam, w, h, clear, A, c, crossed);
    return frameOf(W, place, dt, cam, w, h, clear, A, c, null);
}
function frameOf(W, place, dt, cam, w, h, clear, A, c, crossed) {
    /* One world can hold two holes (the breakfast table has The Butter
       Knife and The Sugar Gate), and a world is kept between them. So what
       one hole does to the world's ground is undone before the next hole is
       drawn in it: the first version left the cloth pressed to the last
       hole's shape, and The Butter Knife was played on The Sugar Gate's. */
    if (W.sculptFor !== place) {
        unsculpt(W);
        W.sculptFor = place;
        info.sculpt = null;
        if (place.at && place.grid) try { info.sculpt = sculpt(W, place); } catch (e) { console.warn('backdrop sculpt', e); }
    }
    /* A world's own event, set going by the golf (render.js → stepPlace):
       most of what moves in a Portals world moves with `u`, how far along
       its flight the camera is, so an event is a run of `u` either side of
       where the hole stands. Held at its start until played. */
    let uNow = A.u;
    if (crossed) window.dispatchEvent(new CustomEvent('g3-world-cross', { detail: crossed }));
    if (place.event) {
        if (ev.on && ev.t < 1) ev.t = Math.min(1, ev.t + dt / (place.event.secs || 5));
        const k = ev.t * ev.t * (3 - 2 * ev.t);
        uNow = A.u + (place.event.from || 0) + ((place.event.to || 0) - (place.event.from || 0)) * k;
    }
    _yaw.setFromAxisAngle(_up, A.turn);
    _p.set(cam.position.x - A.sx, cam.position.y - A.sy, cam.position.z - A.sz)
        .multiplyScalar(A.scale).applyQuaternion(_yaw);
    c.position.set(A.x + _p.x, A.y + _p.y, A.z + _p.z);
    _g.set(cam.quaternion.x, cam.quaternion.y, cam.quaternion.z, cam.quaternion.w);
    c.quaternion.copy(_yaw).multiply(_g);
    // `clear`, in golf units, is how much in front of the camera is left
    // out of the world (render.js: just over half the way to the ball), so
    // nothing of the world's stands between the player and the shot.
    const aspect = cam.aspect || (w / h);
    c.fov = cam.fov; c.aspect = aspect; c.far = W.cam.far;
    c.near = Math.min(c.far * 0.5, Math.max(W.cam.near, (clear > 0 ? clear : 0) * A.scale));
    c.updateProjectionMatrix();
    c.updateMatrixWorld(true);
    clock += dt; W.time += dt;
    if (W.ctx) W.ctx.through = true;
    try { if (W.world.update) W.world.update(dt, W.time, c, uNow); }
    catch (e) { if (!W._err) { W._err = 1; console.warn('backdrop update', e); } }
    if (c.fov !== cam.fov || c.aspect !== aspect) {
        c.fov = cam.fov; c.aspect = aspect;
        c.updateProjectionMatrix();
    }
    c.updateMatrixWorld(true);
    /* What the world's own flight carries along with its camera (a ship
       flown from behind, a boat ridden) is, from the tee, a hull across the
       bottom of the picture: `place.hide` names it, and after the world has
       posed it for the frame it is put away. */
    if (place.hide) {
        // Kept on the world, not the place: a place outlives its world, and
        // a list kept on it held a thrown-away world's whole scene in memory.
        if (!W.hid || W.hid.place !== place) W.hid = { place, list: place.hide.map((n) => W.scene.getObjectByName(n)).filter(Boolean) };
        for (const o of W.hid.list) o.visible = false;
    }
    try {
        markSoftDepth(W);
        if (engine.post.stylePass && engine.post.stylePass.material) {
            engine.post.stylePass.material.depthTest = engine.post.stylePass.material.depthWrite = false;
        }
        frameTick++;
        const sm = engine.renderer.shadowMap;
        if (shadowEvery > 1 && W.shown) {
            sm.autoUpdate = false;
            if (frameTick % shadowEvery === 0) sm.needsUpdate = true;
        } else {
            sm.autoUpdate = true;
        }
        if (place.drift) portalFor(W, place, dt, c);
        engine.renderer.setViewport(0, h, w, h);
        engine.post.render(W.scene, c, W.post, clock, 1);
        // The picture is what matters: if the depth pass cannot be drawn on
        // this machine the world is still shown, behind everything.
        if (!W.flat) { try { drawDepth(W, c, w, h); } catch (e) { W.flat = true; console.warn('backdrop depth', e); } }
    } catch (e) { failed[W.def.id] = true; cur = null; console.warn('backdrop draw', e); return false; }
    if (!W.shown) { W.shown = (W.shown0 = (W.shown0 || 0) + 1) > 3; }
    info.near = c.near; info.far = c.far; info.scale = A.scale; info.w = w; info.h = h;
    return true;
}

/* ── the drift: a hole riding the flight ─────────────────────────────────

   Endless mode (endless.js) does not stand a hole at one spot of a world:
   it hangs the course on the world's own flight and lets it ride, the way
   Portals flies its camera — the seat behind the tee is on the line, and the
   line goes on. So the world goes by while the hole is played: the hole is
   the carpet and the world is the journey under it.

   The ride is the flight's own, slowed (`DRIFT.PACE` of the world's cruise,
   and the world's own pace along it), and the heading follows the line a
   little behind, so a bend swings the world round the hole rather than
   snapping it. And the flight ends where Portals' does, in a portal on the
   next world. The game says which world that is (`place.next`) and builds
   it aside (prepare); once it is built the opening shows it, drawn by the
   engine's own portal pass, and the hole rides through — the world changes
   under the ball mid-hole, and the game hears `g3-world-cross`. A next
   world not built yet holds the hole short of the portal, slowing in as
   the square of the way left, the way Portals' antechamber waits.

   `DROP` is how far under the line the lane hangs, as a share of the seat's
   height. It was 0.55 — the line half way between the lane and the seat —
   and that put the lane down among whatever the world has under its flight:
   on the water in the sea of ice, on the snow behind the eagle (the owner:
   "situated a bit low on the flight path"). Portals keeps the room round
   its line clear of its things, so that is where the lane belongs: the line
   runs a little over the lane's floor, about through its kerbs, and the
   seat is the rest of its height over it. */
const DRIFT = { PACE: 0.42, START: 0.02, TURN: 0.7, SCALE: 1.6, DROP: 0.15 };
const _M = new THREE.Matrix4(), _dq = new THREE.Quaternion(), _ds = new THREE.Vector3(), _f = new THREE.Vector3();
function wrapA(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
function headingAt(W, d, seat) {
    const L = W.path.length, ahead = W.cam.ahead || 12;
    W.path.posAtDist(Math.min(d, L), _p);
    W.path.posAtDist(Math.min(d + ahead, L), _q);
    _t.copy(_q).sub(_p); _t.y = 0;
    if (_t.lengthSq() < 1e-4) { W.path.tangentAtDist(Math.min(d, L - 0.01), _t); _t.y = 0; }
    if (_t.lengthSq() < 1e-8) _t.set(0, 0, 1);
    return Math.atan2(_t.x, _t.z) - seat.yaw;
}
function drift(W, place, seat, dt) {
    const L = W.path.length;
    let D = place.ride;
    const scaleTo = scaleFor(W, place, seat);
    if (!D || D.world !== W.def.id) {
        if (!D) D = place.ride = { d: L * (place.u === undefined ? DRIFT.START : place.u), turn: null, scale: scaleTo, t: 0, crossed: 0 };
        D.world = W.def.id;
    }
    D.t += dt;
    const ready = !!(spare && place.next && spare.def.id === place.next);
    let v = (L / Math.max(5, W.duration)) * DRIFT.PACE * (W.pace ? W.pace(Math.min(1, D.d / L)) : 1) * (place.pace || 1);
    // Nothing to go through yet: come in to rest a little short of the portal.
    const stop = L - Math.min(18, L * 0.08);
    if (!ready) {
        const room = Math.max(0, stop - D.d), ease = Math.min(1, room / Math.max(6, L * 0.08));
        v *= ease * ease;
        if (D.d + v * dt > stop) v = Math.max(0, (stop - D.d) / Math.max(dt, 1e-3));
    }
    D.d += v * Math.min(dt, 0.1);
    let crossed = null;
    if (ready && D.d >= L) {
        // Through. The world changes and the hole does not: everything the
        // camera was carried out by is carried through the opening by the
        // same matrix the engine crosses with (exit → the next entry).
        const B = spare, from = W.def.id;
        _M.multiplyMatrices(B.entry, W.exitInv);
        _M.decompose(_ds, _dq, _s3);
        _f.set(0, 0, 1).applyQuaternion(_dq);
        if (D.turn !== null) D.turn = wrapA(D.turn + Math.atan2(_f.x, _f.z));
        D.d -= L; D.world = B.def.id; D.crossed++;
        spare = null;
        const old = cur;
        cur = B;
        cur.anchor = null;
        if (W.portal && W.portal.group) W.portal.group.visible = false;
        // Put away after this frame, not in the middle of it.
        setTimeout(() => { try { engine._dispose(old); } catch (e) { /* ignore */ } }, 0);
        place.world = B.def.id; place.next = null;
        if (place.hides) place.hide = place.hides[B.def.id] || null;
        crossed = { from, to: B.def.id };
        return driftPose(cur, place, seat, D, 0) || crossed;
    }
    driftPose(W, place, seat, D, dt);
    return null;
}
function driftPose(W, place, seat, D, dt) {
    const L = W.path.length, d = Math.max(0, D.d);
    const want = headingAt(W, d, seat);
    if (D.turn === null) D.turn = want;
    else D.turn = wrapA(D.turn + wrapA(want - D.turn) * (1 - Math.exp(-dt * DRIFT.TURN)));
    const target = scaleFor(W, place, seat);
    D.scale += (target - D.scale) * (1 - Math.exp(-dt / DRIFT.SCALE));
    W.path.posAtDist(Math.min(d, L + 2), _p);
    const drop = place.drop === undefined ? seat.h * DRIFT.DROP : place.drop;
    const A = W.anchor && W.anchor.key === place ? W.anchor : (W.anchor = { key: place });
    A.x = _p.x; A.y = _p.y - drop * D.scale; A.z = _p.z; A.py = _p.y;
    A.turn = D.turn; A.u = Math.min(1, d / L); A.sx = seat.x; A.sy = 0; A.sz = seat.z;
    A.scale = D.scale; A.ground = null; A.height = null;
    return null;
}
/* How big the lane is in a world nobody has sized it for by hand: as big as
   the room round the flight allows. The lane hangs `DRIFT.DROP` of a seat
   under the line and the seat sits the rest over it, so the ground under
   the line and whatever roof is over it (a library's ceiling, a cave's)
   bound it, the roof with a unit to spare over the seat: the middle of a
   handful of soundings along the flight, so one bridge or one chasm does
   not decide it. A world with
   nothing under its flight at all (a sky, space) is sized by how fast
   Portals flies it instead: a walk is a room, forty metres a second a
   country. */
const _upRay = new THREE.Raycaster(), _upDir = new THREE.Vector3(0, 1, 0);
function roofOver(W, x, y, z) {
    try {
        _upRay.set(_t.set(x, y, z), _upDir); _upRay.far = 400; _upRay.camera = engine.camera;
        for (const h of _upRay.intersectObjects(W.scene.children, true)) {
            const o = h.object, m = Array.isArray(o.material) ? o.material[0] : o.material;
            if (!o.isMesh || !m || o.isSkinnedMesh || o.isInstancedMesh) continue;
            if (m.side === THREE.BackSide || (m.transparent && m.depthWrite === false)) continue;
            if (m.alphaTest > 0 || m.alphaMap || (m.transparent && m.opacity < 0.6)) continue;
            let v = o, shown = true;
            while (v) { if (!v.visible) { shown = false; break; } v = v.parent; }
            if (!shown) continue;
            return h.point.y - y;
        }
    } catch (e) { /* none */ }
    return null;
}
function autoScale(W, seat) {
    if (W.autoScale) return W.autoScale;
    const below = [], above = [], h = seat.h || 4.2;
    W.scene.updateMatrixWorld(true);
    for (let u = 0.08; u <= 0.92; u += 0.07) {
        W.path.pointAt(u, _p);
        const px = _p.x, py = _p.y, pz = _p.z;
        const g = groundUnder(W, px, py, pz);
        if (g !== null) below.push(py - g);
        const r = roofOver(W, px, py + 0.05, pz);
        if (r !== null) above.push(r);
    }
    const mid = (a) => { a.sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
    const speed = W.path.length / Math.max(5, W.duration);
    let s = Math.min(3, Math.max(0.6, speed / 9));
    if (below.length >= 4) s = Math.min(s * 1.6, mid(below) / (h * 0.8));
    if (above.length >= 4) s = Math.min(s, mid(above) / (h * (1 - DRIFT.DROP) + 1));
    W.autoScale = Math.max(0.35, Math.min(3, s));
    W.autoWhy = { speed: Math.round(speed * 10) / 10, below: below.length ? Math.round(mid(below) * 10) / 10 : null, above: above.length ? Math.round(mid(above) * 10) / 10 : null };
    return W.autoScale;
}
function scaleFor(W, place, seat) {
    return (place.scales && place.scales[W.def.id]) || autoScale(W, seat);
}

/* The opening at the end of the flight, with the next world in it: the
   engine's own portal pass (vendor/portals/src/core/engine.js →
   _renderPortal), driven here because this engine is never left to run its
   own frame. Shown once the next world is built and the hole is within the
   world's own reveal distance of it. */
function portalFor(W, place, dt, c) {
    const P = W.portal;
    if (!P || !P.group) return;
    const B = spare && place.next && spare.def.id === place.next ? spare : null;
    const D = place.ride, L = W.path.length, left = D ? L - D.d : L;
    const reveal = B ? 1 - smoothstep(W.revealDist * 0.6, W.revealDist, left) : 0;
    P.group.visible = !!B && (reveal > 0.002 || W.feed);
    if (!P.group.visible) return;
    try {
        if (P.setTime) P.setTime(clock);
        if (P.setReveal) P.setReveal(W.feed ? 1 : reveal);
        if (P.setNear) P.setNear(1 - smoothstep(4, 30, left));
        if (P.setGain) {
            const g = B.post.exposure / Math.max(1e-3, W.post.exposure), lim = (x) => Math.max(0.45, Math.min(2.2, x));
            P.setGain(lim(g * B.post.tint.r / Math.max(0.05, W.post.tint.r)), lim(g * B.post.tint.g / Math.max(0.05, W.post.tint.g)), lim(g * B.post.tint.b / Math.max(0.05, W.post.tint.b)));
        }
        if (P.setDewash && engine.post.bloomTexture) P.setDewash(engine.post.bloomTexture, W.feed ? 0 : 0.85);
        if (B.ctx) B.ctx.through = true;
        engine._renderPortal(W, B, dt);
    } catch (e) { if (!W._perr) { W._perr = 1; console.warn('backdrop portal', e); } P.group.visible = false; }
}
function smoothstep(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

/* The world's own flight, in golf units: the line Portals flies its camera
   along, brought back through the same anchor `frame` carries the golf
   camera out by (the inverse of it). Portals keeps that line clear of its
   world's things, so it is the one path through a world a camera is known
   to fit down — which is what the tour's intro flies (flyover.js → plan,
   `line`). `n` + 1 samples from u = 0 to 1, as [x, y, z], and `u`, where on
   it the hole stands. Null without a built world for this place. */
function line(place, seat, n) {
    const W = cur;
    if (!W || !engine || !place || !seat || W.def.id !== place.world || !W.path || place.drift) return null;
    if (!W.anchor || W.anchor.key !== place) { W.anchor = anchorFor(W, place, seat); W.anchor.key = place; }
    const A = W.anchor, N = Math.max(8, n || 240), pts = [];
    _yaw.setFromAxisAngle(_up, -A.turn);
    for (let i = 0; i <= N; i++) {
        W.path.pointAt(i / N, _p);
        _p.set(_p.x - A.x, _p.y - A.y, _p.z - A.z).applyQuaternion(_yaw).multiplyScalar(1 / A.scale);
        pts.push([_p.x + A.sx, _p.y + A.sy, _p.z + A.sz]);
    }
    return { pts, u: A.u, scale: A.scale, at: !!place.at };
}

/* A point of the world, [x, y, z] in its own coordinates, in golf units on
   the hole: the same inverse `line` takes. Null without the world built. */
function toHole(place, seat, v) {
    const W = cur;
    if (!W || !engine || !place || !seat || !v || W.def.id !== place.world || place.drift) return null;
    if (!W.anchor || W.anchor.key !== place) { W.anchor = anchorFor(W, place, seat); W.anchor.key = place; }
    const A = W.anchor;
    _yaw.setFromAxisAngle(_up, -A.turn);
    _p.set(v[0] - A.x, v[1] - A.y, v[2] - A.z).applyQuaternion(_yaw).multiplyScalar(1 / A.scale);
    return { x: _p.x + A.sx, y: _p.y + A.sy, z: _p.z + A.sz };
}

G3.backdrop = {
    canvas, want, prepare, frame, info,
    setQuality(t) { qualityTier = t || 'auto'; applyQuality(); },
    // Auto's rung says whether the world blooms (render.js → syncLiveScale).
    setAutoBloom(on) {
        if (qualityTier !== 'auto' || worldBloom === on) return;
        worldBloom = on;
        if (engine && engine.post && engine.post.bloom) engine.post.bloom.enabled = on && engine.rtType === THREE.HalfFloatType;
    },
    get quality() { return qualityTier; },
    /* The world renderer made, and nothing built in it: its context, its
       targets and its first resize, which are one long synchronous step a
       phone feels. game.js asks for it under the loading screen, since the
       demo's tour warm-up (game.js → warmTour) would otherwise make it a
       second after the loader lifts, in front of the demo. */
    warm() { boot(); },
    failed(id) { return !!failed[id]; },
    play() { ev.on = true; },
    rewind() { ev.on = false; ev.t = 0; },
    // The next world's files, fetched while this hole is played: nothing is built.
    fetch(id) { if (id && !failed[id]) import('../vendor/portals/src/worlds/' + id + '.js').catch(() => {}); },
    get current() { return cur ? cur.def.id : null; },
    // The current world has been drawn (not merely built, which a world
    // swapped in from `prepare` is until its first frames).
    get shown() { return !!(cur && cur.shown); },
    get ahead() { return spare ? spare.def.id : null; },
    drop() { dropSpare(); },
    get building() { return !!loading; },
    // The world being built aside, if one is.
    get aside() { return aside; },
    /* Hold a build aside where it is (true) or let it go on (false): see
       `held`. Cheap enough to be said every frame. */
    hold(on) { held = !!on; },
    // A build aside finished at full speed rather than in slices (a headless driver, the console).
    hurry() { early = false; },
    get held() { return held && early; },
    // What the world renderer holds, for a driver watching memory over a tour.
    stats() {
        if (!engine) return null;
        const i = engine.renderer.info;
        return { geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs ? i.programs.length : 0,
            current: cur ? cur.def.id : null, spare: spare ? spare.def.id : null, aside, slices };
    },
    progress,
    /* The world's own ground, for sculpting a hole to it (tools/world-ground.mjs):
       the height under a point in world coordinates, or null over nothing. */
    groundAt(x, z, from, any) { return cur ? groundUnder(cur, x, from === undefined || from === null ? 2000 : from, z, any) : null; },
    pathAt(u) { if (!cur) return null; const v = cur.path.pointAt(u, new THREE.Vector3()); return [v.x, v.y, v.z]; },
    line, toHole,
    // A place edited by hand (the console, a tuning script): work it out again.
    reanchor() { if (cur) cur.anchor = null; },
    // How far along its world a riding hole is (endless.js), 0…1, and whether the next world is in the portal.
    ride(place) { if (!place || !place.ride || !cur || !cur.path) return null; return { u: Math.min(1, place.ride.d / cur.path.length), ready: !!(spare && place.next && spare.def.id === place.next), crossed: place.ride.crossed }; },
    DRIFT,
    // For placing a hole: what the world is and where the hole ended up in it.
    debug() { return cur ? { auto: cur.autoScale || null, why: cur.autoWhy || null, id: cur.def.id, length: cur.path.length, duration: cur.duration, cam: cur.cam, anchor: cur.anchor && { u: cur.anchor.u, x: cur.anchor.x, y: cur.anchor.y, z: cur.anchor.z, ground: cur.anchor.ground, height: cur.anchor.height, step: cur.anchor.step, scale: cur.anchor.scale, turn: cur.anchor.turn, sx: cur.anchor.sx, sz: cur.anchor.sz } } : null; }
};
window.dispatchEvent(new Event('g3-backdrop'));
