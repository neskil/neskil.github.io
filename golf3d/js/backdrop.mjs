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
let clock = 0;
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
        freeze: true, hold: true, single: true, quality: coarse ? 'low' : 'medium', pixelRatio: 1,
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
    return engine;
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

function seedOf(id) { let h = 2166136261; for (const c of id) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

/* Ask for a world. Resolves true once it is the one being drawn. Asking for
   another while one is building is fine: the last asked for wins, and a
   world nobody is waiting for any more is thrown away as soon as it lands. */
async function want(id) {
    wanted = id;
    if (!id) return false;
    if (cur && cur.def.id === id) return true;
    if (failed[id]) return false;
    if (loading) { try { await loading; } catch (e) { /* its own caller hears */ } return want2(id); }
    return want2(id);
}
async function want2(id) {
    if (wanted !== id) return false;
    if (cur && cur.def.id === id) return true;
    const E = boot();
    const def = { id, name: id, load: () => import('../vendor/portals/src/worlds/' + id + '.js') };
    mark(id);
    const job = loading = E._load(def, seedOf(id));
    let W = null;
    try { W = await job; } catch (e) { failed[id] = true; console.warn('backdrop: ' + id + ' did not build', e); }
    if (loading === job) loading = null;
    if (!W) { mark(null); return false; }
    if (W.portal && W.portal.group) W.portal.group.visible = false;
    if (wanted !== id) { try { E._dispose(W); } catch (e) { /* ignore */ } return want2(wanted); }
    if (cur) { try { E._dispose(cur); } catch (e) { /* ignore */ } }
    cur = W;
    cur.anchor = null;
    return true;
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
function frame(dt, cam, place, seat, w, h) {
    const W = cur;
    if (!W || !engine || engine.lost || !place || W.def.id !== place.world) return false;
    if (w !== size.w || h !== size.h) { size.w = w; size.h = h; engine._resize(); }
    if (!W.anchor || W.anchor.key !== place) { W.anchor = anchorFor(W, place, seat); W.anchor.key = place; }
    const A = W.anchor, c = engine.camera;
    _yaw.setFromAxisAngle(_up, A.turn);
    _p.set(cam.position.x - A.sx, cam.position.y - A.sy, cam.position.z - A.sz)
        .multiplyScalar(A.scale).applyQuaternion(_yaw);
    c.position.set(A.x + _p.x, A.y + _p.y, A.z + _p.z);
    _g.set(cam.quaternion.x, cam.quaternion.y, cam.quaternion.z, cam.quaternion.w);
    c.quaternion.copy(_yaw).multiply(_g);
    c.fov = cam.fov; c.aspect = w / h; c.near = W.cam.near; c.far = W.cam.far;
    c.updateProjectionMatrix();
    c.updateMatrixWorld(true);
    clock += dt; W.time += dt;
    try { if (W.world.update) W.world.update(dt, W.time, c, A.u); }
    catch (e) { if (!W._err) { W._err = 1; console.warn('backdrop update', e); } }
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
    canvas, want, frame, info,
    failed(id) { return !!failed[id]; },
    // The next world's files, fetched while this hole is played: nothing is built.
    fetch(id) { if (id && !failed[id]) import('../vendor/portals/src/worlds/' + id + '.js').catch(() => {}); },
    get current() { return cur ? cur.def.id : null; },
    get building() { return !!loading; },
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
