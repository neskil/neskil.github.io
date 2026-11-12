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

function boot() {
    if (engine) return engine;
    engine = new Engine(canvas, [], {
        freeze: true, hold: true, single: true, quality: 'medium', pixelRatio: 1,
        samples: 0, checkShaders: false
    });
    // The engine sizes itself to the window; this one is sized to the stage.
    engine._resize = function () {
        const w = size.w, h = size.h;
        if (w < 2 || h < 2) return;
        this.w = w; this.h = h;
        this.renderer.setPixelRatio(1); this.renderer.setSize(w, h, false);
        this.post.setSize(w, h, 1);
        this.portalRT.setSize(w, h);
        this.camera.aspect = this.portalCam.aspect = w / h;
    };
    engine._resize();
    return engine;
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
    const job = loading = E._load(def, seedOf(id));
    let W = null;
    try { W = await job; } catch (e) { failed[id] = true; console.warn('backdrop: ' + id + ' did not build', e); }
    if (loading === job) loading = null;
    if (!W) return false;
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
function groundUnder(W, x, y, z) {
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
            if (o.isInstancedMesh || o.isSkinnedMesh) continue;
            if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
            const sc = o.matrixWorld.getMaxScaleOnAxis();
            if (o.geometry.boundingSphere.radius * sc < 30) continue;
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
    try { engine.post.render(W.scene, c, W.post, clock, 1); }
    catch (e) { failed[W.def.id] = true; cur = null; console.warn('backdrop draw', e); return false; }
    return true;
}

G3.backdrop = {
    canvas, want, frame,
    get current() { return cur ? cur.def.id : null; },
    get building() { return !!loading; },
    // A place edited by hand (the console, a tuning script): work it out again.
    reanchor() { if (cur) cur.anchor = null; },
    // For placing a hole: what the world is and where the hole ended up in it.
    debug() { return cur ? { id: cur.def.id, length: cur.path.length, duration: cur.duration, cam: cur.cam, anchor: cur.anchor && { u: cur.anchor.u, x: cur.anchor.x, y: cur.anchor.y, z: cur.anchor.z, ground: cur.anchor.ground, height: cur.anchor.height, step: cur.anchor.step, scale: cur.anchor.scale } } : null; }
};
window.dispatchEvent(new Event('g3-backdrop'));
