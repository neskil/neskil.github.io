// Rides and companions: things that travel with the camera from world to world.
// A ride is a small vehicle model seen at the edges of the frame (a balloon basket, a prow, a
// cockpit); a companion flies or runs along the path ahead (paper cranes, a lantern, a ribbon).
// Both live inside the current world's scene, so that world's own lights, fog and depth apply.
import * as THREE from 'three';
import * as core from '../kit/core.js';
import { RIDES, COMPANIONS } from '../extras.js';

const { clamp, smoothstep, makeRng, makeNoise, hashSeed } = core;
const Y = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _t0 = new THREE.Vector3(), _t1 = new THREE.Vector3(), _r = new THREE.Vector3(), _up = new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _c = new THREE.Color();

// What the world's own light rig looks like, so extras can match it.
export function scanLights(scene) {
  const out = { has: false, key: new THREE.Color(1, 1, 1), keyIntensity: 0, keyDir: new THREE.Vector3(0.4, 0.8, 0.4), ambient: new THREE.Color(0, 0, 0), level: 0 };
  scene.traverse((o) => {
    if (!o.isLight || !o.visible) return;
    out.has = true;
    if (o.isDirectionalLight && o.intensity > out.keyIntensity) {
      out.keyIntensity = o.intensity; out.key.copy(o.color);
      out.keyDir.copy(o.position).sub(o.target ? o.target.position : _a.set(0, 0, 0)).normalize();
    } else if (o.isHemisphereLight) { out.ambient.add(_c.copy(o.color).lerp(o.groundColor, 0.5).multiplyScalar(o.intensity)); }
    else if (o.isAmbientLight) { out.ambient.add(_c.copy(o.color).multiplyScalar(o.intensity)); }
  });
  const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  out.level = lum(out.ambient) + lum(out.key) * out.keyIntensity * 0.5;
  return out;
}

const compatible = (def, media) => !def.media || !def.media.length || def.media.some((m) => media.includes(m));

export class Extras {
  constructor(engine) {
    this.e = engine;
    this.ride = null;        // active ride instance { def, inst, presence }
    this.comp = null;        // active companion instance
    this.rideQuat = new THREE.Quaternion(); this.rideInit = false;
    this.fill = { value: new THREE.Color(0, 0, 0) }; // extra self-light for extras in worlds without lamps
    this._fillTarget = new THREE.Color(0, 0, 0);
    this.state = { speed: 0, turn: 0, u: 0, presence: 1, crossing: 0, remaining: 0, entered: 0, prev: null, portalColor: '#9fd0ff', camera: null, world: null, light: null, path: null, dist: 0, length: 1, ahead: null, fill: this.fill };
    this.state.ahead = (d, out) => { const s = this.state; return s.path.posAtDist(clamp(s.dist + d, 0, s.length), out); };
  }

  // ----- choosing -----
  _chooseRide(W, prevId) {
    const set = this.e.settings.ride, media = W.media, rng = W.xrng;
    if (set === 'off' || W.world.ride === 'none') return null;
    if (set === 'auto' && this.e.gentle) return null;   // a gentle flight (the steady camera, or calm only) has no surprise rides (they rock and bank); one chosen by name still comes
    const ok = RIDES.filter((d) => compatible(d, media));
    if (set && set !== 'auto') { const d = RIDES.find((r) => r.id === set); return d && (this.e.opts.freeze || compatible(d, media)) ? d : null; }
    if (!ok.length) return null;
    const prev = ok.find((d) => d.id === prevId);
    // A ride travels on with the viewer for a world or two, then is put away. How often a new one turns up grows
    // with how many there are to choose from, so a small collection is a treat and not a fixture.
    if (prev && rng.chance(0.5)) return prev;
    const wanted = ok.find((d) => d.id === W.world.ride);
    if (wanted && rng.chance(0.8)) return wanted;
    if (!rng.chance(Math.min(0.5, 0.08 * ok.length))) return null;
    const other = ok.filter((d) => d.id !== prevId);
    return rng.pick(other.length ? other : ok);
  }
  _chooseCompanion(W, prevId) {
    const set = this.e.settings.companion, rng = W.xrng;
    if (set === 'off' || W.world.companion === 'none') return null;
    const ok = COMPANIONS.filter((d) => compatible(d, W.media));
    if (set && set !== 'auto') { const d = COMPANIONS.find((r) => r.id === set); return d && (this.e.opts.freeze || compatible(d, W.media)) ? d : null; }
    if (!ok.length) return null;
    const prev = ok.find((d) => d.id === prevId);
    if (prev && rng.chance(0.5)) return prev;
    if (!rng.chance(Math.min(0.4, 0.08 * ok.length))) return null;
    const other = ok.filter((d) => d.id !== prevId);
    return rng.pick(other.length ? other : ok);
  }

  _ctx(W, label) {
    const seed = hashSeed(W.seed + ':' + label);
    const fill = this.fill;
    // lit(material): lets a standard material glow faintly by its own colour where a world has no lamps
    const lit = (mat) => {
      const prev = mat.onBeforeCompile;
      mat.onBeforeCompile = (sh, r) => {
        if (prev) prev(sh, r);
        sh.uniforms.uExtraFill = fill;
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uExtraFill;')
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uExtraFill;');
      };
      return mat;
    };
    return { THREE, core, seed, rng: makeRng(seed), noise: makeNoise(seed ^ 0x2545f491), renderer: this.e.renderer, yield: () => this.e._yield(), fill, lit, light: W.light, world: { id: W.def.id, category: W.def.category, media: W.media } };
  }

  async _make(def, W, kind) {
    const mod = def.build ? def : (await def.load()).default;
    const inst = await mod.build(this._ctx(W, kind + ':' + def.id));
    inst.object.traverse((o) => { o.frustumCulled = false; o.castShadow = false; o.receiveShadow = false; });
    return { def: { ...def, ...mod }, inst, presence: 0, kind };
  }

  // Called while world W is being loaded: decide what travels through it and get it ready.
  async prepare(W, incoming) {
    W.xrng = makeRng(hashSeed(W.seed + ':extras'));
    W.light = scanLights(W.scene);
    W.extras = { ride: null, comp: null };
    const prevRide = incoming ? incoming.extras?.ride : null, prevComp = incoming ? incoming.extras?.comp : null;
    const rd = this._chooseRide(W, prevRide?.def.id), cd = this._chooseCompanion(W, prevComp?.def.id);
    try { if (rd) W.extras.ride = prevRide && prevRide.def.id === rd.id ? prevRide : await this._make(rd, W, 'ride'); } catch (e) { console.error('ride failed', rd.id, e); }
    try { if (cd) W.extras.comp = prevComp && prevComp.def.id === cd.id ? prevComp : await this._make(cd, W, 'companion'); } catch (e) { console.error('companion failed', cd.id, e); }
    W.xwarm = [];
    for (const x of [W.extras.ride, W.extras.comp]) {
      if (!x) continue;
      // A new ride or companion sits in the world's scene while the engine prepares it (Engine._prepare makes its
      // programs, uploads its textures and geometry a little per frame); the engine takes it out again afterwards.
      if (x !== prevRide && x !== prevComp && this.e.opts.prepare !== false) { W.scene.add(x.inst.object); W.xwarm.push(x.inst.object); continue; }
      // one that is already travelling: compiled for this world's lights and for the kind of buffer worlds are drawn into
      const r = this.e.renderer; let done = null;
      try { r.setRenderTarget(this.e._warmRT); done = r.compileAsync(x.inst.object, this.e.camera, W.scene); } catch (e) { /* compiled on first use instead */ } finally { r.setRenderTarget(null); }
      try { await done; } catch (e) { /* as above */ }
    }
  }

  _fillFor(W) {
    const L = W.light, f = this._fillTarget;
    if (!L || !L.has) { const fog = W.scene.fog; if (fog) f.copy(fog.color).multiplyScalar(0.6).addScalar(0.08); else f.setScalar(0.45); }
    else f.setScalar(clamp(0.12 - L.level * 0.2, 0.015, 0.12));
  }

  // World W has just become the current world.
  enter(W, from) {
    const next = W.extras || { ride: null, comp: null };
    for (const [slot, x] of [['ride', next.ride], ['comp', next.comp]]) {
      const old = this[slot];
      if (old && old !== x) { old.inst.object.removeFromParent(); this._free(old); }
      if (x) { W.scene.add(x.inst.object); if (old !== x) x.presence = this.e.opts.freeze ? 1 : 0; }
      this[slot] = x || null;
    }
    this._fillFor(W); if (!from) this.fill.value.copy(this._fillTarget);
    this.state.entered = 0;
    this.state.prev = from ? { id: from.def.id, category: from.def.category, color: from.portalSpec.color || '#9fd0ff' } : null;
    this.state.portalColor = W.portalSpec.color || '#9fd0ff';
  }
  onSwap(q, M) {
    this.rideQuat.premultiply(q);
    if (this.comp && this.comp.inst.onSwap) { try { this.comp.inst.onSwap(M); } catch (e) { console.warn(e); } }
  }
  // A world that was prepared is being thrown away: free what only it was going to use.
  release(W) {
    const x = W.extras; if (!x) return;
    for (const k of ['ride', 'comp']) if (x[k] && x[k] !== this.ride && x[k] !== this.comp && !x[k].inst.object.parent) this._free(x[k]);
    W.extras = null;
  }
  _free(x) {
    if (x.freed) return; x.freed = true;
    try { x.inst.dispose?.(); } catch (e) { console.warn(e); }
    x.inst.object.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of mats) { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k]?.value; if (v && v.isTexture) v.dispose(); } m.dispose(); }
    });
  }

  // near plane the camera needs so the ride is not clipped
  near(worldNear) { return this.ride ? Math.min(worldNear, this.ride.def.near ?? 0.45) : worldNear; }

  update(dt, A, B, cam, u, remaining, speed, stand) {   // stand: a pause; a ride or companion updated once before is left as it was last drawn
    const s = this.state, path = A.path, d = A.dist, frozen = !!this.e.opts.freeze;
    s.entered += dt; s.speed = speed; s.u = u; s.remaining = remaining; s.camera = cam; s.light = A.light; s.path = path; s.dist = d; s.length = path.length;
    s.world = A.def; s.crossing = 1 - smoothstep(0, 40, remaining);
    this.fill.value.lerp(this._fillTarget, frozen ? 1 : 1 - Math.exp(-dt * 1.5));
    // the vehicle points along the path (the camera's gaze is free to look around inside it)
    path.tangentAtDist(d, _t0); path.tangentAtDist(Math.min(d + 14, path.length), _t1);
    const turn = _t0.z * _t1.x - _t0.x * _t1.z; s.turn = turn;
    _a.copy(_t0).lerp(_t1, 0.35).normalize();
    _r.crossVectors(_a, Y).normalize(); _up.copy(Y).addScaledVector(_r, clamp(-turn * 0.5, -0.3, 0.3)).normalize();
    _m.lookAt(_b.set(0, 0, 0), _a, _up); _q.setFromRotationMatrix(_m);
    // ...but mostly turns with the gaze, so its parts stay at the edges of the frame (def.gaze: 0 = locked to the path, 1 = locked to the view)
    _q.slerp(cam.quaternion, this.ride ? (this.ride.def.gaze ?? 0.7) : 0.7);
    if (!this.rideInit || frozen) { this.rideQuat.copy(_q); this.rideInit = true; } else this.rideQuat.slerp(_q, 1 - Math.exp(-dt * 3.2));

    const R = this.ride;
    if (R) {
      const leaving = B && B.extras && B.extras.ride !== R;
      const target = leaving ? smoothstep(22, 70, remaining) : 1;
      R.presence = frozen ? 1 : R.presence + clamp(target - R.presence, -dt * 0.9, dt * 0.45);
      s.presence = R.presence;
      const o = R.inst.object, st = R.def.stow || [0, -3.2, 0.6], k = 1 - smoothstep(0, 1, R.presence);
      o.quaternion.copy(this.rideQuat);
      o.position.set(st[0] * k, st[1] * k, st[2] * k).applyQuaternion(this.rideQuat).add(cam.position);
      o.visible = R.presence > 0.002;
      if (!(stand && R._ran)) { R._ran = true; try { R.inst.update?.(dt, A.time, s); } catch (e) { if (!R._err) { R._err = 1; console.error(e); } } }
    }
    const C = this.comp;
    if (C) {
      const leaving = B && B.extras && B.extras.comp !== C;
      C.presence = frozen ? 1 : C.presence + clamp((leaving ? smoothstep(10, 60, remaining) : 1) - C.presence, -dt * 0.8, dt * 0.4);
      s.presence = C.presence;
      if (!(stand && C._ran)) { C._ran = true; try { C.inst.update?.(dt, A.time, s); } catch (e) { if (!C._err) { C._err = 1; console.error(e); } } }
    }
  }
}
