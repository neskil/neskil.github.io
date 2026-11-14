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
/* A mark left while a world is building and taken away once it has been
   drawn (or the page is left in the ordinary way). If it is still there at
   the next visit the build killed the page, and render.js does not try
   again until asked. */
const MARK = 'golf3d.worldBuilding';
const mark = (v) => { try { v ? localStorage.setItem(MARK, v) : localStorage.removeItem(MARK); } catch (e) { /* ignore */ } };
window.addEventListener('pagehide', () => mark(null));
const info = { near: 0.1, far: 5000, scale: 1, w: 2, h: 2 };

function boot() {
    if (engine) return engine;
    engine = new Engine(canvas, [], {
        freeze: true, hold: true, single: true, quality: 'medium', pixelRatio: 1,   // one level everywhere: a hole is baked to this level's ground
        samples: 0, checkShaders: false
    });
    // The engine sizes itself to the window; this one is sized to the stage.
    engine._resize = function () {
        const w = size.w, h = size.h;
        if (w < 2 || h < 2) return;
        this.w = w; this.h = h;
        // Twice the height: the picture in the top half, its depth below.
        this.renderer.setPixelRatio(1); this.renderer.setSize(w, 2 * h, false);
        depthRT.setSize(w, h);
        this.post.setSize(w, h, 1);
        this.portalRT.setSize(w, h);
        this.camera.aspect = this.portalCam.aspect = w / h;
    };
    engine._resize();
    /* How long a build may hold the page between two frames. The engine is
       made `hold`, which says "as long as it likes" — right for a world
       built behind the closed portal, where nothing else is on screen. A
       world built ahead while a hole is still on screen is built a few
       milliseconds a frame instead, the way Portals builds its next world
       during a flight. */
    engine._budget = function () { return early ? (coarse ? 4 : 6) : 1e9; };
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
    uniforms: { t: { value: depthRT.texture } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: 'uniform sampler2D t; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(t, vUv).rgb, 1.); }'
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
const _white = new THREE.Color(0xffffff), _keep = new THREE.Color();
function drawDepth(W, c, w, h) {
    const r = engine.renderer, sc = W.scene;
    // What is not solid is found now and again, not every frame.
    if (!W.soft || (W.softAt = (W.softAt || 0) + 1) > 90) {
        W.soft = []; W.softAt = 0;
        sc.traverse(o => { if ((o.isMesh || o.isPoints || o.isLine || o.isSprite) && !solid(o)) W.soft.push(o); });
    }
    const hid = [];
    for (const o of W.soft) if (o.visible) { o.visible = false; hid.push(o); }
    const bg = sc.background, om = sc.overrideMaterial, ac = r.autoClear, a = r.getClearAlpha();
    r.getClearColor(_keep);
    depthMat.uniforms.uNear.value = c.near; depthMat.uniforms.uFar.value = c.far;
    try {
        sc.background = null; sc.overrideMaterial = depthMat;
        r.setRenderTarget(depthRT); r.setClearColor(_white, 1); r.autoClear = true;
        r.render(sc, c);
        r.setRenderTarget(null); r.setViewport(0, 0, w, h); r.autoClear = false;
        r.render(blitScene, blitCam);
    } finally {
        sc.background = bg; sc.overrideMaterial = om; r.autoClear = ac; r.setClearColor(_keep, a);
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
    const inStrip = (gx, gz) => rects.some((r) => gx > r[0] && gx < r[2] && gz > r[1] && gz < r[3]);
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
    const def = { id, name: id, load: () => import('../vendor/portals/src/worlds/' + id + '.js') };
    mark(id);
    const job = loading = E._load(def, seedOf(id));
    let W = null;
    try { W = await job; } catch (e) { failed[id] = true; console.warn('backdrop: ' + id + ' did not build', e); }
    if (loading === job) loading = null;
    if (!W) { mark(null); return false; }
    learn(id);
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
    const def = { id, name: id, load: () => import('../vendor/portals/src/worlds/' + id + '.js') };
    // One world kept aside at a time.
    dropSpare();
    early = true; aside = id;
    mark(id);
    const was = wanted;
    const job = loading = E._load(def, seedOf(id));
    let W = null;
    try { W = await job; } catch (e) { failed[id] = true; console.warn('backdrop: ' + id + ' did not build', e); }
    if (loading === job) loading = null;
    early = false; aside = null;
    mark(null);
    if (!W) return false;
    learn(id);
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
    mark(cur.def.id);
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
    A.scale = Math.max(0.4, Math.min(60, A.height / seat.h));
    _yaw.setFromAxisAngle(_up, turn);
    _q.set(seat.cx - seat.x, 0, seat.cz - seat.z).multiplyScalar(A.scale).applyQuaternion(_yaw);
    const g = groundUnder(W, A.x + _q.x, A.py + 40 * A.scale, A.z + _q.z);
    A.ground = g === null ? under : g;
    // The hole's ground is not the seat's: how far apart they are, in golf
    // units, is how badly the hole would be buried or left in the air.
    A.step = Math.abs(A.ground - under) / A.scale;
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
    if (!W.anchor || W.anchor.key !== place) { W.anchor = anchorFor(W, place, seat); W.anchor.key = place; }
    const A = W.anchor, c = engine.camera;
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
    c.fov = cam.fov; c.aspect = w / h; c.far = W.cam.far;
    c.near = Math.min(c.far * 0.5, Math.max(W.cam.near, (clear > 0 ? clear : 0) * A.scale));
    c.updateProjectionMatrix();
    c.updateMatrixWorld(true);
    clock += dt; W.time += dt;
    try { if (W.world.update) W.world.update(dt, W.time, c, uNow); }
    catch (e) { if (!W._err) { W._err = 1; console.warn('backdrop update', e); } }
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
        engine.renderer.setViewport(0, h, w, h);
        engine.post.render(W.scene, c, W.post, clock, 1);
        // The picture is what matters: if the depth pass cannot be drawn on
        // this machine the world is still shown, behind everything.
        if (!W.flat) { try { drawDepth(W, c, w, h); } catch (e) { W.flat = true; console.warn('backdrop depth', e); } }
    } catch (e) { failed[W.def.id] = true; cur = null; console.warn('backdrop draw', e); return false; }
    if (!W.shown) { W.shown = (W.shown0 = (W.shown0 || 0) + 1) > 3; if (W.shown) mark(null); }
    info.near = c.near; info.far = c.far; info.scale = A.scale; info.w = w; info.h = h;
    return true;
}

G3.backdrop = {
    canvas, want, prepare, frame, info,
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
    // A place edited by hand (the console, a tuning script): work it out again.
    reanchor() { if (cur) cur.anchor = null; },
    // For placing a hole: what the world is and where the hole ended up in it.
    debug() { return cur ? { id: cur.def.id, length: cur.path.length, duration: cur.duration, cam: cur.cam, anchor: cur.anchor && { u: cur.anchor.u, x: cur.anchor.x, y: cur.anchor.y, z: cur.anchor.z, ground: cur.anchor.ground, height: cur.anchor.height, step: cur.anchor.step, scale: cur.anchor.scale } } : null; }
};
window.dispatchEvent(new Event('g3-backdrop'));
