// Engine: flies the camera through a world, shows the next world through the exit portal,
// swaps worlds at the crossing, and keeps doing that forever.
import * as THREE from 'three';
import { Post, normalizePost, blendPost, POST_DEFAULTS } from './post.js';
import { Portal } from './portal.js';
import { installSafeMath } from './safemath.js';
import { TIERS, QUALITY_LEVELS, Governor, guessTier, ratioFor, fovFor, isMobile } from './quality.js';
import * as core from '../kit/core.js';
import { Extras } from './extras.js';
import { StyleLens } from './style.js';
import { Perf } from './perf.js';
import { tierOf, poolOf, pickNext, tourNext, seriesNext, lastUnseen, firstWorld } from './pick.js';

const { clamp, smoothstep, bell, makeRng, makeNoise, hashSeed } = core;
const _p = new THREE.Vector3(), _a = new THREE.Vector3(), _d = new THREE.Vector3(), _t0 = new THREE.Vector3(), _t1 = new THREE.Vector3();
const _r = new THREE.Vector3(), _up = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
const _Gi = new THREE.Matrix4(), _C = new THREE.Matrix4();
const _qs = new THREE.Quaternion(), _M = new THREE.Matrix4(), _e = new THREE.Euler(), _v4 = new THREE.Vector4(), _poi = new THREE.Vector3();
const Y = new THREE.Vector3(0, 1, 0);
// The steady camera's turn: no faster than STEADY_TURN (radians a second) whatever a world's gaze asks, until the gaze
// has run more than STEADY_LAG ahead of it (so a hairpin cannot leave it looking backwards for long).
const STEADY_TURN = 30 * Math.PI / 180, STEADY_LAG = 60 * Math.PI / 180, _qp = new THREE.Quaternion();
// ... and never faster than STEADY_TOP however far the gaze has run ahead (a firm ceiling: readings of the steady camera
// still peaked above 90 degrees a second in a few worlds). STEADY_LEVEL: the rate (a second) at which the steady camera's
// horizon is put back level: a slerp between two level gazes passes through tilted ones (up to 12 degrees of roll were
// read on the steady camera), and a crossing can hand over a tilted view; eased, so neither is ever a jolt.
const STEADY_TOP = 60 * Math.PI / 180, STEADY_LEVEL = 12, _lf = new THREE.Vector3(), _lq = new THREE.Quaternion(), _lm = new THREE.Matrix4(), _l0 = new THREE.Vector3();
// The ordinary (sweeping) camera's one limit: it never turns faster than SWEEP_TOP. A generous ceiling that clips only
// the whips (tools/turns.mjs, 9 Oct: the peak turn is 43 degrees a second in the middle world and under 150 in nine of
// ten; a few hairpins whipped the view at 300 to 390 for under a second). The gaze catches up within the next second.
const SWEEP_TOP = 150 * Math.PI / 180;
// Through a portal the camera keeps the direction it came in with, and the new world's first gaze can lie some degrees off
// that (about one world in twenty by ten degrees or more): the turn toward it starts from rest and reaches its usual rate
// over ARRIVE_EASE seconds, so a crossing never begins with a swing at the turn's full speed.
const ARRIVE_EASE = 1;
// ARRIVE_SPEED: through a portal the speed is carried over in metres a second, and two worlds' own speeds can differ by half or
// double; it is brought to the new world's over this many seconds, with a slow start, so no crossing is followed by a surge or a brake.
const ARRIVE_SPEED = 4;
// DOOR_FLOOR: before a portal into a slower world the pace comes down to that world's opening pace, but never under this share of
// the cruise of the world being left (frame(), THE DOORWAY); the eased arrival above applies only while the flight is speeding up:
// one that arrives faster than the new world's pace comes down at the usual rate, so it does not rush through a slow world's opening.
const DOOR_FLOOR = 0.15;


// A world may return pace(u): how fast to travel at u (0 to 1 along its path) compared with its average, so it can
// linger where it is best and hurry through a link. Clamped to 0.35..2.5 and scaled so the world still lasts its duration.
function makePace(fn) {
  const N = 64, p = new Float32Array(N + 1); let inv = 0;
  for (let i = 0; i <= N; i++) { let v; try { v = +fn(i / N); } catch (e) { v = 1; } p[i] = Number.isFinite(v) ? clamp(v, 0.35, 2.5) : 1; }
  for (let i = 0; i < N; i++) inv += 2 / (p[i] + p[i + 1]);
  const k = inv / N;
  return (u) => { const x = clamp(u, 0, 1) * N, i = Math.min(N - 1, Math.floor(x)); return (p[i] + (p[i + 1] - p[i]) * (x - i)) * k; };
}

// What a world is given as ctx.portalView: the picture of the world that follows it (docs/WORLD_GUIDE.md, "Seeing the
// next world"). The engine keeps one up to date only for a world that has read it, and only while that world is the
// one on screen. Until there is a picture the texture is one black pixel, so a world drawn as somebody's next world is
// never handed the buffer it is being drawn into.
class PortalView {
  constructor(blank) {
    this.rect = new THREE.Vector4(0, 0, 1, 1); this.matrix = new THREE.Matrix4(); this.gain = new THREE.Vector3(1, 1, 1);
    this.used = false; this._blank = this._tex = blank; this._live = false;
  }
  get texture() { this.used = true; return this._tex; }
  get live() { this.used = true; return this._live; }
  set(tex) { this._tex = tex || this._blank; this._live = !!tex; if (!tex) this.gain.set(1, 1, 1); }
}

export class Engine {
  constructor(canvas, registry, opts = {}) {
    this.registry = registry;
    this.opts = opts;
    this.settings = { speed: 1, strangeness: 0.5, paused: false, ride: 'auto', companion: 'auto', style: 'auto', styleStrength: 1, kinds: null, calmOnly: false, hour: 'any', order: 'new', camera: opts.camera === 'steady' ? 'steady' : 'sweeping' };
    this.calm = this.settings.camera === 'steady' ? 1 : 0;   // eases toward the setting, so a change mid-flight is a glide and not a jolt
    this.events = { world: () => {}, status: () => {}, quality: () => {} };
    const renderer = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' });
    installSafeMath(renderer, opts.safeMath);
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Direct3D takes a flat varying from a triangle's first corner and WebGL from its last. Unless the page says the
    // first will do, the browser adds a geometry shader to every program that has a flat varying (the portal's own,
    // for one) and compiles it the first time the program draws. Every flat varying here is the same at all corners
    // of a triangle (docs/WORLD_GUIDE.md asks worlds for that), so either corner is right.
    if (opts.provoking !== false) try { const gl = renderer.getContext(), pv = gl.getExtension('WEBGL_provoking_vertex'); this.firstCorner = !!pv; if (pv) pv.provokingVertexWEBGL(pv.FIRST_VERTEX_CONVENTION_WEBGL); } catch (e) { /* older browsers: nothing to do */ }
    renderer.info.autoReset = false;
    // reading back each program's compile log on first use makes the page wait for the graphics process; test pages keep it
    renderer.debug.checkShaderErrors = opts.checkShaders !== false;
    this.perf = new Perf();
    this.w = window.innerWidth; this.h = window.innerHeight;
    // graphics quality (see quality.js): test pages pin the pixel ratio and the antialiasing, the live page does not
    this.fixedPR = opts.pixelRatio || 0; this.fixedSamples = opts.samples;
    this.autoGuess = opts.freeze || this.fixedPR ? 'high' : guessTier(renderer);
    this.qualitySetting = QUALITY_LEVELS.includes(opts.quality) ? opts.quality : 'auto';
    this.tier = this.qualitySetting === 'auto' ? (QUALITY_LEVELS.includes(opts.autoTier) ? opts.autoTier : this.autoGuess) : this.qualitySetting;
    this.mobile = isMobile();
    this.gov = new Governor();
    this._limits(); this.pr = this.maxPR;
    // without a float colour buffer (a few old phones) the picture is drawn in 8 bits: duller highlights, but it runs
    const ext = renderer.extensions;
    this.rtType = ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float') ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.floatLinear = ext.has('OES_texture_float_linear');
    renderer.setPixelRatio(this.pr); renderer.setSize(this.w, this.h, false);
    this.camera = new THREE.PerspectiveCamera(POST_DEFAULTS.fov, this.w / this.h, 0.3, 4000);
    this.portalCam = new THREE.PerspectiveCamera(POST_DEFAULTS.fov, this.w / this.h, 0.3, 4000);
    this.portalCam.matrixAutoUpdate = false;
    this.samples = this._samplesFor(this.tier);
    this.post = new Post(renderer, this.w, this.h, this.pr, this.samples, this.rtType);
    this.portalRT = this._makePortalRT();
    this._blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); this._blank.needsUpdate = true;
    // a 16-pixel buffer of the same kind as the ones worlds are drawn into: programs are compiled for it and a new
    // world's first draws go into it (see _prepare)
    this._warmRT = new THREE.WebGLRenderTarget(16, 16, { type: this.rtType });
    this._warmCam = new THREE.PerspectiveCamera(60, 1, 0.3, 4000); this._warmCam.layers.set(31);
    this._postReady = opts.prepare === false ? null : this.post.prewarm(this._warmRT, this.camera);
    this.postNow = normalizePost();
    this.camQuat = new THREE.Quaternion(); this.camInit = false; this.arrived = Infinity;   // seconds flown since the last crossing (_swap)
    this.time = 0; this.speed = 0; this.blend = 0; this.reveal = 0; this.fade = 0;
    this.cur = null; this.next = null; this.count = 0; this._waiters = []; this._trash = []; this._slice = -1e9;
    this.session = opts.seed ?? Math.floor(Math.random() * 1e9);
    this.pickRng = makeRng(hashSeed('pick:' + this.session));
    this.bags = [[], [], []]; this.visits = {}; this.lastId = null; this.recent = []; this.boost = 0;
    this.series = null; this.seriesFailed = new Set();   // a made series being flown, and worlds that failed to load (pick.js seriesNext)
    // { world id: when this viewer last saw it, ms } kept by the page between visits, or null (a journey link replays its own order)
    this.seen = opts.seen || null;
    this.extras = new Extras(this); this.style = new StyleLens(this);
    this.stats = {}; this.fps = 0;
    window.addEventListener('resize', () => this._resize());
    // a phone may take the graphics context away (another app, low memory); the page reloads when it comes back
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.lost = true; this.events.status({ lost: true }); });
    canvas.addEventListener('webglcontextrestored', () => this.events.status({ restored: true }));
    this._last = performance.now();
    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
  }

  _makePortalRT() {
    // sized as the drawing buffer is (three.js takes the whole part of width x pixel ratio), so a shader that reckons with the
    // buffer's height stands on the same pixel in the portal's picture as in the frame
    const rt = new THREE.WebGLRenderTarget(Math.floor(this.w * this.pr), Math.floor(this.h * this.pr), { type: this.rtType, samples: this.samples });
    rt.scissorTest = true; return rt;
  }
  // A feed world's next world is drawn into a buffer of that world's own, feedScale times the size of the picture
  // (its size follows the picture's when it is next drawn into), until the opening takes up more of the frame than
  // that: from then on into the full-size buffer every opening uses, so the crossing is never out of a coarse picture.
  _feedBuf(W) { return W.feedRT && !W.full ? W.feedRT : this.portalRT; }
  _fitFeed(W) {
    const rt = W.feedRT, w = Math.max(2, Math.round(this.portalRT.width * W.feedScale)), h = Math.max(2, Math.round(this.portalRT.height * W.feedScale));
    if (rt.width !== w || rt.height !== h) rt.setSize(w, h);
    if (rt.samples !== this.samples) { rt.samples = this.samples; rt.dispose(); }
  }
  _own(tex) { return tex === this.portalRT.texture || tex === this._blank; }   // textures of the engine's that a world's materials may hold
  // antialiasing: phones go without below 'high' (their dense screens hide the stair-steps, and antialiased float
  // buffers are where phone graphics drivers most often fail)
  _samplesFor(tier) { return this.fixedSamples ?? (this.mobile && (tier === 'low' || tier === 'medium') ? 0 : TIERS[tier].samples); }
  // the sharpest and the coarsest resolution the current quality level allows in this window
  _limits() {
    const t = TIERS[this.tier];
    this.maxPR = this.fixedPR || ratioFor(this.tier, this.w, this.h);
    this.minPR = this.fixedPR || Math.max(0.35, this.maxPR * t.floor);
    this.adaptive = !this.fixedPR && !this.opts.freeze && t.adapt;
  }
  _resize(force) {
    const w = window.innerWidth, h = window.innerHeight;
    if (!force && w === this.w && h === this.h) return;
    if (w < 2 || h < 2) return;
    if (w !== this.w || h !== this.h) { const frac = this.pr / this.maxPR; this.w = w; this.h = h; this._limits(); this.pr = clamp(this.maxPR * frac, this.minPR, this.maxPR); }
    this.renderer.setPixelRatio(this.pr); this.renderer.setSize(w, h, false);
    this.post.setSize(w, h, this.pr);
    this.portalRT.setSize(Math.floor(w * this.pr), Math.floor(h * this.pr));
    this.camera.aspect = this.portalCam.aspect = w / h;
  }
  // Hands the page back until the next frame has been drawn. Asked for again within a few milliseconds of the last
  // hand-back it returns at once, so a world can ask as often as it likes (every loop pass if it wants) and its
  // build is cut into pieces of a few milliseconds without taking a frame for each ask.
  // kit: a list of dear steps the kit left for this build (the sky's bake, see makeSky): one of them runs straight
  // after each real hand-back, at the start of a fresh slice, so none of them rides on the back of the world's own work.
  _yield(kit) {
    const A = this.cur, ms = A && A.def.antechamber ? this._anteMs() : Math.min(6, this._budget());
    if (performance.now() - this._slice < ms) return Promise.resolve();
    const p = new Promise((r) => this._waiters.push(r));
    // (a step may answer false: its shader is still being compiled by the browser; it stays first in the list)
    return kit && kit.length ? p.then(() => { const f = kit[0]; if (f && f() !== false) kit.shift(); }) : p;
  }
  _frame() { return new Promise((r) => this._waiters.push(r)); }   // always waits for the next frame
  // How long world 1's load may hold the page between two frames of the antechamber: as long again as the frames have
  // been taking to come round (_gap, kept in _tick), and never under 12 ms. The antechamber costs almost nothing to
  // draw, so on a 60 Hz screen that is most of every frame; on a slow machine the load still gets half of the time.
  _anteMs() { return Math.max(12, (this._gap || 16.7) * 0.5); }

  // ---------- world selection ----------
  // The choosing itself is in pick.js (no graphics in it, so tools/ordertest.mjs runs the same code in node): the pool
  // (kinds, calm only, favourites only: this.hearts, a Set of ids the page keeps), new-to-you first across all tiers, the
  // best bands first in a sitting, the strangeness tiers, the bags, the contrast with the world on screen.
  _tier(def) { return tierOf(def); }
  _pool() { return poolOf(this); }
  _pick() { return pickNext(this); }
  // The last world of the pool this viewer had not seen is on its way: say so once in a sitting (the page shows the line).
  _complete(def) { const n = this._saidAll ? 0 : lastUnseen(this, def); if (n) { this._saidAll = true; this.events.allSeen?.(n, def); } }
  // The world a sitting opens on, for the page to hand to start() (defs: every world the page has). Undefined when there is none to choose.
  _first(defs) { const def = firstWorld(this, defs || this.registry); if (def) this._complete(def); return def; }

  // ---------- loading ----------
  async _load(def, seed) {
    const W = { def, seed, ready: false, time: 0, dist: 0, view: new PortalView(this._blank), flight: { rate: 1 } };
    let t0 = performance.now();
    const kit = [];   // dear kit steps of this build (renderer.kitDefer while it builds); all run before the world is used
    const ctx = {
      THREE, core, seed, rng: makeRng(seed), noise: makeNoise(seed ^ 0x5bd1e995), renderer: this.renderer,
      index: this.count, aspect: this.w / this.h, yield: () => this._yield(kit), frame: () => this._frame(), portalView: W.view,
      // true while this world is the next one, seen through the portal of the world on screen; false from the crossing
      // on (and always for the world a journey starts in). A field on this object: _swap changes it.
      through: !!this.cur,
      // the viewer's graphics level: detail (0.6 on low, 0.8 on medium, 1 above) is a hint for thinning particles,
      // instances and ray-march steps; never use it to remove the things a world is about
      quality: { level: this.tier, detail: TIERS[this.tier].detail, mobile: this.mobile },
      // flight.rate: how many times the world's own pace the flight runs at this frame, read in update(): 1 at the usual
      // pace and in every still; the viewer's Pace setting (0.4 to 2.5), times 5 while hurrying to the portal (2 on a calm
      // journey), eased as the speed is; under 1 while the flight waits before a portal with no world behind it yet. For a
      // world that keeps a clock of its own beside a route that runs by u: advance that clock by dt * ctx.flight.rate.
      flight: W.flight,
      // from: the world on screen while this one is built, which is the world this one is entered from: { id, def, world
      // (what its build() returned) }, or null for the world a journey starts in. suite: this world's place in a made series,
      // { id, part, of } (part 1 is the first), or null. Both for worlds built to follow one another (docs/WORLD_GUIDE.md).
      from: this.cur && !this.cur.def.antechamber ? { id: this.cur.def.id, def: this.cur.def, world: this.cur.world } : null,
      suite: Array.isArray(def.suite) ? { id: def.suite[0], part: def.suite[1], of: def.suite[2] } : null,
    };
    // hints a world may honour so that visits differ and the viewer's wishes carry across worlds
    const vr = makeRng(hashSeed(seed + ':vary'));
    // a journey from the list may name the hour of a step (opts.tourHours { id: hour }, from design/suites.json hours): it
    // goes before the viewer's own Hour while the journey lasts, so that a journey can run from dawn to night
    const stepHour = this.opts && this.opts.tourHours ? this.opts.tourHours[def.id] : undefined;
    let hour = stepHour || this.settings.hour || 'any';
    if (hour === 'clock') { const h = new Date().getHours(); hour = h < 5 ? 'night' : h < 8 ? 'dawn' : h < 16 ? 'day' : h < 20 ? 'golden' : 'night'; }
    ctx.vary = { hour, rare: vr.chance(0.125), density: vr.range(0.7, 1.3), mood: vr() };
    const perf = this.perf, phase = (p) => perf.setPhase(p ? p + ':' + def.id : '');
    // (a series is the registry's word, never the module's: suite, next and member are laid over the module's fields)
    // (so is the title: the registry's name, which design/titles.json may set, goes before the module's own)
    if (!def.build) { phase('fetch'); const mod = await def.load(); def = W.def = { ...def, ...mod.default, name: def.name || mod.default.name, ownName: mod.default.name, suite: def.suite, next: def.next, member: def.member }; t0 = performance.now(); }
    // The flora kit's default leaf picture, drawn in short steps before the build and kept for the visit: a world that
    // asks the kit for it in one piece (windMaterial with no map) used to hold the page 40 to 100 ms for it. The kit is
    // asked for once a visit; if it has not arrived by now (this world did not bring it in), nothing waits for it.
    if (!this._flora) { this._flora = import('../kit/flora.js').then((m) => (this._floraKit = m)).catch(() => null); }
    if (!this._leafDrawn) {
      const tLeaf = performance.now();
      if (!this._floraKit) await new Promise((r) => setTimeout(r, 0));
      if (this._floraKit) { phase('leaf'); try { this._leafDrawn = await this._floraKit.prepareLeafTexture({}, () => this._yield(), 2); } catch (e) { this._leafDrawn = true; console.warn('leaf picture', e); } }
      t0 += performance.now() - tLeaf;   // (not this world's build time)
    }
    phase('build'); const nLong = perf.longs.length;
    W.ctx = ctx;
    let world; this.renderer.kitDefer = kit;
    // (what is left of the kit's steps, one a frame; a step that says "not yet" is asked again each frame and after
    // three hundred such frames it is told to run whatever the state of its shader)
    try { world = await def.build(ctx); for (let held = 0; kit.length;) { await this._frame(); if (kit[0](held > 300) === false) held++; else kit.shift(); } }
    finally { phase(''); if (this.renderer.kitDefer === kit) this.renderer.kitDefer = null; }
    W.jsMs = performance.now() - t0;
    W.stepMs = perf.longs.slice(nLong).reduce((m, l) => Math.max(m, l.ms), 0);
    W.world = world; W.scene = world.scene; W.path = world.path;
    W.duration = world.duration ?? 40;
    W.pace = typeof world.pace === 'function' ? makePace(world.pace) : null;
    W.post = normalizePost(world.post);
    // nearThrough may also come from the registry (design/near-through.json, the owner's table): a world whose own camera
    // spec names none takes the table's, so the cure of the level cut inside an opening needs no edit of the world's file
    const c = world.camera || {};
    W.cam = { nearThrough: c.nearThrough > 0 ? +c.nearThrough : def.nearThrough > 0 ? +def.nearThrough : null, near: c.near ?? 0.3, far: c.far ?? 4000, fov: c.fov ?? W.post.fov, ahead: c.lookAhead ?? clamp(W.path.length * 0.05, 8, 40), sway: c.sway ?? 1, bank: c.bank ?? 1, lookArc: c.lookArc === true };
    W.post.fov = W.cam.fov;
    W.pois = world.pois || [];
    W.entry = W.path.frameAt(0); W.exit = W.path.frameAt(1, undefined, world.portal?.tilt === true); W.exitInv = W.exit.clone().invert();
    W.portalSpec = { ...(world.portal || {}) };
    // the look of the portal itself: the world's own choice, else a seeded pick (plain test pages keep the classic ring)
    if (this.opts.portalStyle) W.portalSpec.style = this.opts.portalStyle;
    else if (!W.portalSpec.style && Portal.pickStyle && !this.opts.freeze && !this.opts.single) W.portalSpec.style = Portal.pickStyle(makeRng(hashSeed(seed + ':portal')), def);
    W.portal = new Portal(W.portalSpec); W.portal.place(W.exit); W.scene.add(W.portal.group);
    // portal.feed: the next world is drawn whole, for as long as this world is on screen, for it to show as it likes
    // (see _renderPortal). The buffers are made here, not in the frame that first draws into them.
    W.feed = !!W.portalSpec.feed; W.feedScale = clamp(+W.portalSpec.feedScale || 0.5, 0.1, 1);
    if (W.feed) {
      if (W.feedScale < 1) { W.feedRT = new THREE.WebGLRenderTarget(2, 2, { type: this.rtType, samples: this.samples }); this._fitFeed(W); }
      try { if (W.feedRT) this.renderer.initRenderTarget(W.feedRT); this.renderer.initRenderTarget(this.portalRT); this.renderer.setRenderTarget(null); } catch (e) { /* made on first use instead */ }
    }
    W.portal.setTexture((W.feedRT || this.portalRT).texture);
    W.revealDist = W.portalSpec.revealDistance ?? Math.min(W.path.length * 0.5, 320);
    // portal.drawWithin (metres, optional): the exit is not drawn at all while more than this much of the route is left to
    // fly (a far opening against a graded sky reads as a disc); it reads the route's distance left, never the lens or a clock.
    // Not for a feed world, whose opening is shown by its own `show`.
    W.drawWithin = !W.feed && typeof W.portalSpec.drawWithin === 'number' && isFinite(W.portalSpec.drawWithin) ? W.portalSpec.drawWithin : null;
    if (W.drawWithin != null) W.portal.group.visible = W.path.length <= W.drawWithin;
    // ... and from there it opens about its own middle over the next metres of route (drawIn; none where it is drawn from
    // the route's start): in a tall window the place where it is first drawn can be inside the picture
    // (portal.drawIn, metres, optional: the world's own word on that stretch, 0 to 14; 0 where the place of its first
    // drawing is hidden in every window and the hiding ends sooner than the opening would, so the exit stands whole)
    W.drawIn = W.drawWithin != null && W.path.length > W.drawWithin ? (typeof W.portalSpec.drawIn === 'number' && isFinite(W.portalSpec.drawIn) ? Math.max(0, Math.min(14, W.portalSpec.drawIn)) : Math.max(1, Math.min(14, W.drawWithin * 0.25))) : 0;
    W.media = world.media || def.media || ['air'];
    this._fit(W.scene);
    try { await this.extras.prepare(W, this.cur); } catch (e) { console.warn('extras', e); }
    try { if (!def.antechamber) await this.style.prepare(W); } catch (e) { console.warn('style', e); }   // no art style in the antechamber, not even one chosen by name (it says ride, companion and style 'none' itself; only this one is not the world's to refuse)
    await this._frame();
    if (this.opts.prepare === false) { phase('compile'); try { await this.renderer.compileAsync(W.scene, this.camera); } catch (e) { console.warn('compile', e); } phase(''); }   // ?prep=0: the old way, for comparison
    else try { await this._prepare(W); } catch (e) { console.warn('prepare', e); } finally { phase(''); }
    for (const o of W.xwarm || []) o.removeFromParent();   // rides and companions prepared with the world; Extras.enter puts them back
    W.buildMs = performance.now() - t0; W.ready = true;
    perf.load(W.loadRec = { id: def.id, build: Math.round(W.jsMs), step: W.stepMs, compile: Math.round(W.compileMs || 0), programs: W.programs || 0, warm: Math.round(W.warmMs || 0), objects: W.objects || 0, late: (W.late || []).length });
    return W;
  }

  // ---------- getting a world ready without stalling the one on screen ----------
  // Everything a freshly built world needs from the graphics card is asked for a little at a time, between frames
  // of the world being shown: its shader programs (the browser compiles them in the background where it can), then
  // its textures, then its geometry and each program's first use, by drawing a few objects per frame into a
  // 16-pixel buffer nobody sees. Without this the first frame that shows the world through the portal does all of
  // it at once and the journey freezes, for seconds on some machines. Nothing here changes what is drawn.
  //
  // How much to do per frame, in ms of this thread's time. No limit while nothing is on screen (the first world,
  // behind the veil), on test pages, and when the camera is about to need the world; more as the reveal gets close.
  _budget() {
    const A = this.cur;
    if (!A || this.opts.freeze || this.opts.hold || this.settings.paused) return 1e9;
    // In the antechamber world 1 is wanted soon, but its portal is on screen and should keep drifting. On a machine that
    // draws it smoothly the load goes in pieces (_anteMs); where frames come slower than ten a second there is no
    // smoothness to keep, and the load's graphics work is done at once.
    if (A.def.antechamber) return this._gap > 100 ? 1e9 : this._anteMs();
    const remaining = A.path.length - A.dist, secs = (remaining - 45) / Math.max(1, this.speed);
    if (secs < 1.5) return 1e9;
    return remaining < A.revealDist * 1.2 || secs < 6 ? 10 : 4;
  }
  async _prepare(W) {
    const r = this.renderer, scene = W.scene, perf = this.perf, id = W.def.id, draws = [], lights = [];
    scene.updateMatrixWorld(true);
    scene.traverse((o) => { if (o.isMesh || o.isPoints || o.isLine || o.isSprite) draws.push(o); });
    scene.traverseVisible((o) => { if (o.isLight) lights.push(o); });
    // an object that draws the scene itself before it is drawn (a mirror) goes last: by then the rest is in place
    const own = (o) => (o.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender ? 1 : 0);
    draws.sort((a, b) => own(a) - own(b));
    // a shadow drawn once and kept (autoUpdate off) must still get its one full drawing after the warm-up
    const baked = lights.filter((l) => l.shadow && l.shadow.autoUpdate === false).map((l) => [l.shadow, l.shadow.needsUpdate]);
    W.objects = draws.length;

    // 1. Shader programs. A program is specific to the kind of buffer it draws into, and every world is drawn into a
    //    linear float buffer, never straight to the screen: so the buffer is set while they are created. (Compiled
    //    with no buffer set they come out as screen programs, none of which is ever used, and the real ones are
    //    then compiled inside the first frame that shows the world.)
    perf.setPhase('compile:' + id);
    let t0 = performance.now(), i = 0;
    const before = new Set(r.info.programs);
    const some = { traverseVisible() {}, traverse: (fn) => { const t = performance.now(), ms = this._budget(); while (i < draws.length) { try { fn(draws[i++]); } catch (e) { console.warn('compile', id, e); } if (performance.now() - t > ms) break; } } };
    while (i < draws.length) {
      r.setRenderTarget(this._warmRT);
      try { r.compile(some, this.camera, scene); } finally { r.setRenderTarget(null); }
      if (i < draws.length) await this._frame();
    }
    //    The shadow pass draws each caster with a depth material of three's own, which no scene holds: its programs
    //    used to be made inside the warm-up draws below, linked and used in one call, and the page stood still for
    //    each. _shadowPrograms makes them here, to be waited for with the rest.
    await this._shadowPrograms(W, draws, lights);
    const fresh = r.info.programs.filter((p) => !before.has(p));
    W.programs = fresh.length;
    for (let n = 0; n < 2400; n++) {                           // at most a minute; a program that never reports is used as it is
      let pending = 0; for (const p of fresh) { try { if (!p.isReady()) pending++; } catch (e) { /* disposed meanwhile */ } }
      if (!pending) break;
      await new Promise((res) => setTimeout(res, 25));
    }
    W.compileMs = performance.now() - t0;

    // 2. Textures: about a megapixel per frame.
    perf.setPhase('warm:' + id); t0 = performance.now();
    const texs = new Set();
    const tex = (v) => { if (!v) return; if (Array.isArray(v)) { for (const x of v) tex(x); return; } if (v.isTexture && !v.isRenderTargetTexture && !v.isDepthTexture && !v.isFramebufferTexture && !v.isVideoTexture && v.image && v !== this.portalRT.texture) texs.add(v); };
    for (const o of draws) for (const m of Array.isArray(o.material) ? o.material : [o.material]) { if (!m) continue; for (const k in m) { const v = m[k]; if (v && v.isTexture) tex(v); } if (m.uniforms) for (const k in m.uniforms) tex(m.uniforms[k]?.value); }
    tex(scene.background); tex(scene.environment);
    let px = 0, t = performance.now();
    for (const x of texs) {
      const im = Array.isArray(x.image) ? x.image[0] : x.image, n = ((im && im.width) || 1) * ((im && im.height) || 1) * (x.isCubeTexture ? 6 : 1) * ((im && im.depth) || 1);
      if (px && this._budget() < 1e6 && (px + n > 1.2e6 || performance.now() - t > this._budget())) { await this._frame(); px = 0; t = performance.now(); }
      try { r.initTexture(x); } catch (e) { /* drawn the usual way later */ }
      px += n;
    }
    if (px) await this._frame();

    // 3. Geometry and first use: a few objects at a time are put on a layer only the warm-up camera sees and drawn.
    //    The lights stay in, since the number of lights is part of which program a material uses.
    const cam = this._warmCam; W.entry.decompose(cam.position, cam.quaternion, cam.scale); cam.scale.set(1, 1, 1);
    cam.near = W.cam.near; cam.far = W.cam.far; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    const size = (o) => { const g = o.geometry, n = g ? (g.index ? g.index.count : g.attributes?.position?.count || 0) : 0; return n * (o.isInstancedMesh ? Math.min(Math.max(1, o.count), 64) : 1); };
    //    While a world is on screen, one small batch goes out per frame and the next waits until the graphics
    //    process has finished the last (_gpuIdle): what a first draw costs there (a driver's own shader work, uploads)
    //    does not show in this thread's time, and a burst of first draws can hold frames back for seconds.
    const label = (o) => { const m = Array.isArray(o.material) ? o.material[0] : o.material; return (o.name || (m && (m.name || m.type)) || o.type || '').slice(0, 40); };
    let j = 0, many = 4;
    while (j < draws.length) {
      const ms = this._budget(), paced = ms < 1e6; t = performance.now();
      const lm = lights.map((l) => l.layers.mask); for (const l of lights) l.layers.enable(31);
      try {
        do {
          const batch = [], tb = performance.now(); let verts = 0;
          while (j < draws.length && batch.length < (paced ? Math.min(many, 3) : many) && verts < 150000) { const o = draws[j++]; batch.push(o); verts += size(o); }
          if (paced) perf.setPhase('warm:' + id + ':' + label(batch[0]));
          this._warmDraw(scene, cam, batch);
          const took = performance.now() - tb;                  // a batch that overran is followed by smaller ones
          many = took > ms * 2 ? Math.max(1, many >> 1) : took < ms * 0.5 ? Math.min(8, many + 1) : many;
        } while (!paced && j < draws.length && performance.now() - t < ms);
      } finally { lights.forEach((l, k) => { l.layers.mask = lm[k]; }); for (const [sh, need] of baked) sh.needsUpdate = need; }
      if (paced) await this._gpuIdle(); else if (j < draws.length) await this._frame();
    }
    W.warmMs = performance.now() - t0;
    // (programs made after the wait above, inside the warm-up draws: each was linked and used at once. For the
    // performance report; none is expected.)
    W.late = r.info.programs.filter((p) => !before.has(p) && !fresh.includes(p)).map((p) => p.name || '?');
    perf.setPhase('');
  }
  // The depth programs of the shadow pass, made ahead of their first use. three picks a depth material of its own for
  // each caster and gives it some of the caster's material state at each draw (WebGLShadowMap getDepthMaterial); the
  // program it then asks for is found in a cache that every material shares, by a key made of the material's state,
  // the object's kind and the lights. So a depth material of OURS is given the same state for each kind of caster
  // and compiled with the same lights, under a buffer as the shadow map is: three finds its program made and ready.
  // (A world's own customDepthMaterial is compiled as itself, with the state three would give it.) Ours are kept
  // while the world lives (W.depthMats), since a program nobody holds is deleted, and freed with the world.
  async _shadowPrograms(W, draws, lights) {
    const r = this.renderer, made = W.depthMats = [];
    if (!r.shadowMap.enabled) return;
    const dirs = lights.some((l) => l.castShadow && !l.isPointLight), points = lights.some((l) => l.castShadow && l.isPointLight);
    if (!dirs && !points) return;
    const vsm = r.shadowMap.type === THREE.VSMShadowMap, flip = { [THREE.FrontSide]: THREE.BackSide, [THREE.BackSide]: THREE.FrontSide, [THREE.DoubleSide]: THREE.DoubleSide };
    const items = [], seen = new Set(), id = (x) => (x ? x.uuid : 0);
    for (const o of draws) {
      if (!(o.isMesh || o.isLine || o.isPoints) || !(o.castShadow || (o.receiveShadow && vsm))) continue;
      const g = o.geometry; if (!g || !g.attributes) continue;
      // what of the object goes into a program's key (generously: a kind too many costs one look in the cache)
      const kind = [o.type, o.isInstancedMesh ? 1 : 0, o.instanceColor ? 1 : 0, o.morphTexture ? 1 : 0, o.isSkinnedMesh ? 1 : 0, o.isBatchedMesh ? 1 : 0,
        Object.keys(g.attributes).sort().join(','), g.attributes.color ? g.attributes.color.itemSize : 0, Object.keys(g.morphAttributes || {}).sort().join(','), g.morphTargetsRelative ? 1 : 0].join('|');
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!m) continue;
        for (const point of [false, true]) {
          if (point ? !points : !dirs) continue;
          const custom = point ? o.customDistanceMaterial : o.customDepthMaterial;
          const side = m.shadowSide !== null && m.shadowSide !== undefined ? m.shadowSide : vsm ? m.side : flip[m.side];
          const sig = [kind, point ? 1 : 0, id(custom), side, m.wireframe ? 1 : 0, id(m.alphaMap), m.alphaTest > 0 ? 1 : 0, id(m.map), m.clipShadows ? 1 : 0, id(m.displacementMap), m.displacementScale !== 0 ? 1 : 0].join('|');
          if (seen.has(sig)) continue; seen.add(sig);
          const d = custom !== undefined ? custom : point ? new THREE.MeshDistanceMaterial() : new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
          if (custom === undefined) made.push(d);
          d.wireframe = m.wireframe; d.side = side; d.alphaMap = m.alphaMap; d.alphaTest = m.alphaTest; d.map = m.map;
          d.clipShadows = m.clipShadows; d.clippingPlanes = m.clippingPlanes; d.clipIntersection = m.clipIntersection;
          d.displacementMap = m.displacementMap; d.displacementScale = m.displacementScale; d.displacementBias = m.displacementBias;
          d.wireframeLinewidth = m.wireframeLinewidth; d.linewidth = m.linewidth;
          items.push(Object.create(o, { material: { value: d } }));   // the caster itself, seen with the depth material
        }
      }
    }
    if (!items.length) return;
    const none = this._noScene || (this._noScene = new THREE.Scene());   // the shadow pass draws under no scene: no fog, no environment
    let k = 0;
    const some = { traverseVisible: (fn) => { for (const l of lights) fn(l); },
      traverse: (fn) => { const t = performance.now(), ms = this._budget(); while (k < items.length) { try { fn(items[k++]); } catch (e) { console.warn('compile depth', W.def.id, e); } if (performance.now() - t > ms) break; } } };
    while (k < items.length) {
      r.setRenderTarget(this._warmRT);
      try { r.compile(some, this.camera, none); } catch (e) { console.warn('compile depth', W.def.id, e); k = items.length; } finally { r.setRenderTarget(null); }
      if (k < items.length) await this._frame();
    }
    // three keeps the lights it was handed in the render state of the scene it compiled under, and that scene lives as long as the
    // page: a light's parent is its world, so the last world to come this way stayed whole in main memory (every geometry's arrays)
    // long after it was left, until the next world with a shadow came. One more compile of nothing under the same scene leaves the
    // list empty; it makes no program and draws nothing. (Found and proved in the page by the performance pass, 10-10.)
    try { r.compile({ traverseVisible() {}, traverse() {} }, this.camera, none); } catch (e) { /* nothing was kept */ }
  }
  // Waits, a frame at a time and without blocking, until the graphics process has finished everything sent so far.
  async _gpuIdle() {
    const gl = this.renderer.getContext();
    if (!gl.fenceSync) return this._frame();
    const s = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush();
    try { for (let n = 0; n < 900; n++) { await this._frame(); if (this._budget() >= 1e6 || gl.clientWaitSync(s, 0, 0) !== gl.TIMEOUT_EXPIRED) break; } }
    finally { gl.deleteSync(s); }
  }
  _warmDraw(scene, cam, batch) {
    const r = this.renderer, keep = [], shown = [];
    for (const o of batch) {
      keep.push(o.layers.mask, o.frustumCulled); o.layers.enable(31); o.frustumCulled = false;
      for (let p = o; p; p = p.parent) if (p.visible === false) { p.visible = true; shown.push(p); }   // things a world keeps hidden until their moment
    }
    r.setRenderTarget(this._warmRT);
    try { r.render(scene, cam); } catch (e) { console.warn('warm', e); }
    r.setRenderTarget(null);
    batch.forEach((o, k) => { o.layers.mask = keep[k * 2]; o.frustumCulled = keep[k * 2 + 1]; });
    for (const p of shown) p.visible = false;
  }
  // Fits a freshly built scene to the machine: shadow maps no larger than the quality level allows, and float
  // textures set to nearest-neighbour lookups where the GPU cannot blend them (they would read as black).
  _fit(scene) {
    const cap = TIERS[this.tier].shadow, fl = this.floatLinear;
    const tex = (v) => { if (v && v.isTexture && v.type === THREE.FloatType && (v.magFilter !== THREE.NearestFilter || v.minFilter !== THREE.NearestFilter)) { v.magFilter = v.minFilter = THREE.NearestFilter; v.generateMipmaps = false; v.needsUpdate = true; } };
    scene.traverse((o) => {
      if (o.isLight && o.shadow && o.castShadow) {
        const ms = o.shadow.mapSize, m = Math.max(ms.x, ms.y);
        if (m > cap) { ms.multiplyScalar(cap / m).round(); if (o.shadow.map) { o.shadow.map.dispose(); o.shadow.map = null; } }
      }
      if (!fl && o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        for (const k in m) tex(m[k]);
        if (m.uniforms) for (const k in m.uniforms) tex(m.uniforms[k]?.value);
      }
    });
  }
  _queueNext(def) {
    // a shared tour's worlds come first, in their order (opts.tour); then the world after this one in a made series; then the picker chooses
    def = def || tourNext(this) || seriesNext(this) || this._pick();
    this._complete(def);
    const n = (this.visits[def.id] = (this.visits[def.id] || 0) + 1);
    const seed = this.opts.fixedSeed ?? hashSeed(this.session + ':' + def.id + ':' + n);
    const slot = (this.next = { ready: false, def });
    this._load(def, seed).then((W) => { if (this.next === slot) this.next = W; else this._dispose(W); })
      .catch((e) => { console.error('world failed', def.id, e); this.events.status({ error: def.id + ': ' + e.message }); if (this.tourDef === def) this.tourDef = null; this.seriesFailed.add(def.id); if (this.next === slot) { this.next = null; if (!this.opts.freeze) setTimeout(() => this._queueNext(), 200); } });
  }
  // firstDef may be the antechamber (def.antechamber: the place between worlds that a visit opens in, src/worlds/_antechamber.js)
  // with the journey's first world as nextDef. The antechamber is not a world of the journey: it is not counted (count stays 0,
  // so the world behind its portal is world 1), not announced (events.antechamber, never events.world) and not remembered by
  // the picker; that first world is remembered here as the journey's first, as if it had been started in.
  async start(firstDef, nextDef) {
    const def = firstDef || this._pick(), ante = !!def.antechamber;
    if (!ante) { this.lastId = def.id; this.visits[def.id] = 1; }
    const seed = this.opts.fixedSeed ?? hashSeed(this.session + ':' + def.id + ':1');
    const W = await this._load(def, seed);   // if the antechamber cannot be had this rejects with nothing remembered, and the page starts in world 1 as it used to
    try { await this._postReady; } catch (e) { /* made on first use instead */ }
    const one = ante ? nextDef : def; if (one) { this.lastId = one.id; this.recent.push(one.id); }
    this.cur = W; this.count = ante ? 0 : 1; this.speed = ante ? 2 : W.path.length / W.duration;   // the antechamber's drift starts from near rest
    this.extras.enter(W, null); this.style.enter(W);
    if (ante) this.events.antechamber?.(W); else this.events.world(W, this.count);
    if (nextDef !== null) this._queueNext(nextDef);
    return W;
  }

  // The world just left is cleared away a little per frame, starting once the new world's opening has settled:
  // freeing half a million triangles and their textures in one frame is a stall of its own.
  _clear() {
    const t = this._trash[0], t0 = performance.now(), W = t.W;
    if (t0 < t.at && this._trash.length < 2) return;
    const ms = this._trash.length > 2 || this.opts.freeze ? 1e9 : this._trash.length > 1 ? 6 : 1.5;   // worlds crossed in a hurry are not allowed to pile up
    if (!t.list) {
      this.extras.release(W);
      try { W.world.dispose?.(); } catch (e) { console.warn(e); }
      W.portal?.dispose(); W.feedRT?.dispose();
      if (W.depthMats) { for (const d of W.depthMats) d.dispose(); W.depthMats = null; }
      if (W.ctx) W.ctx.from = null;   // a world let go lets go of the world before it, or every world of a journey stays in memory through this chain
      t.list = []; W.scene.traverse((o) => { if (o.geometry || o.material || (o.isLight && o.shadow?.map)) t.list.push(o); });
    }
    while (t.list.length && performance.now() - t0 < ms) this._free(t.list.pop());
    if (!t.list.length) {
      if (W.scene.background?.isTexture) W.scene.background.dispose();
      if (W.scene.environment?.isTexture) W.scene.environment.dispose();
      for (const K of [this.cur, this.next]) { const f = K?.ctx?.from; if (f && f.world === W.world) f.world = null; }   // cleared: id and def stay readable, its arrays go
      this._trash.shift();
    }
    this.perf.mark('clear', performance.now() - t0);
  }
  _free(o) {
    if (o.geometry) o.geometry.dispose();
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of mats) {
      for (const k in m) { const v = m[k]; if (v && v.isTexture && !this._own(v)) v.dispose(); }
      if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k]?.value; if (v && v.isTexture && !this._own(v)) v.dispose(); }
      m.dispose();
    }
    if (o.isLight && o.shadow?.map) o.shadow.map.dispose();
  }
  _dispose(W) {
    this.extras.release(W);
    try { W.world.dispose?.(); } catch (e) { console.warn(e); }
    if (W.ctx) W.ctx.from = null;
    W.portal?.dispose(); W.feedRT?.dispose();
    if (W.depthMats) { for (const d of W.depthMats) d.dispose(); W.depthMats = null; }
    W.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of mats) {
        for (const k in m) { const v = m[k]; if (v && v.isTexture && !this._own(v)) v.dispose(); }
        if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k]?.value; if (v && v.isTexture && !this._own(v)) v.dispose(); }
        m.dispose();
      }
      if (o.isLight && o.shadow?.map) o.shadow.map.dispose();
    });
    if (W.scene.background?.isTexture) W.scene.background.dispose();
    if (W.scene.environment?.isTexture) W.scene.environment.dispose();
  }

  // ---------- camera ----------
  // Gentle: the visitor's one comfort choice (the steady camera, or 'calm worlds only', which includes it). It means the
  // steady camera with its level horizon and firm ceiling, no surprise rides (core/extras.js) and a gentler hurry.
  get gentle() { return this.settings.camera === 'steady' || !!this.settings.calmOnly; }
  // The camera's slow turn toward the gaze of _pose, one step of dt seconds. A steady camera (calm) also turns more
  // slowly, and its turn has a ceiling: with calm 0 this is the plain slerp and nothing else. tools/calm.mjs replays
  // flights with this same function.
  _turn(q, target, dt) {
    const calm = this.calm, ease = this.arrived < ARRIVE_EASE ? smoothstep(0, ARRIVE_EASE, this.arrived) : 1;   // 1 except just through a portal
    _qp.copy(q);
    if (!(calm > 0)) {
      q.slerp(target, 1 - Math.exp(-dt * (2.6 - 1.5 * this.calm) * ease));
      if (_qp.angleTo(q) > dt * SWEEP_TOP) q.copy(_qp).rotateTowards(target, dt * SWEEP_TOP);
      return q;
    }
    q.slerp(target, 1 - Math.exp(-dt * (2.6 - 1.5 * calm) * ease));
    // the ceiling: STEADY_TURN while the gaze is within STEADY_LAG of the camera; past that the excess is followed at
    // the slerp's own rate, so the ceiling rises smoothly and the turn is never faster than the plain slerp's
    // (and STEADY_TOP at the most)
    const max = dt * Math.min(STEADY_TOP, STEADY_TURN + 1.1 * Math.max(0, _qp.angleTo(target) - STEADY_LAG)) / calm;
    if (_qp.angleTo(q) > max) q.copy(_qp).rotateTowards(target, max);
    // the level horizon: the same gaze with the world's up, by calm's share (not where the gaze is nearly straight up or down)
    _lf.set(0, 0, -1).applyQuaternion(q);
    if (Math.abs(_lf.y) < 0.985) { _lm.lookAt(_l0, _lf, Y); _lq.setFromRotationMatrix(_lm); q.slerp(_lq, calm * (1 - Math.exp(-dt * STEADY_LEVEL))); }
    return q;
  }
  _pose(W, d, outPos, outQuat) {
    const path = W.path, L = path.length, u = clamp(d / L, 0, 1);
    // calm (0..1) is the viewer's 'steady camera': the gaze rests further down the route so that bends swing it
    // less, climbs and dives tip it less, set pieces pull it less, and the horizon stays level with no drift.
    // The route itself is the world's and does not change.
    const calm = this.calm, ahead = Math.min(W.cam.ahead * (1 + 2.4 * calm), Math.max(W.cam.ahead, L * 0.22));
    path.posAtDist(d, outPos);
    path.posAtDist(d + ahead, _a);
    _d.subVectors(_a, outPos).normalize();
    if (calm > 0) { _d.y *= 1 - 0.45 * calm; _d.normalize(); }
    const guard = smoothstep(0, 0.04, u) * (1 - smoothstep(0.93, 0.985, u));
    for (const poi of W.pois) {
      // a look with steady: true keeps its whole weight for the steady camera too (a set piece the route loops away
      // from would otherwise leave that camera's frame for seconds: the first artist styles crew's finding, 8 Oct);
      // the steady camera's slower turn, its ceiling, longer reach, damped pitch and level horizon are unchanged
      const w = bell(u, poi.from ?? 0, poi.to ?? 1, poi.fade ?? 0.3) * (poi.weight ?? 0.5) * guard * (poi.steady ? 1 : 1 - 0.65 * calm);
      if (w <= 0.001) continue;
      const at = typeof poi.at === 'function' ? poi.at(W.time, u) : poi.at;
      if (at.isVector3) _poi.copy(at); else _poi.set(at[0], at[1], at[2]);
      _poi.sub(outPos).normalize();
      // the mix is of plain vectors: with a target far behind the eye (over about 110 degrees off the gaze so far) it stays on
      // the target until the look's weight has fallen to about a half and then flips to the route within a frame or two,
      // and the eased camera swings 100 degrees and more in under a second (the deep time crew's finding, 8 Oct). A look
      // with arc: true (or every look of a world with camera.lookArc: true) is mixed ALONG THE ANGLE instead: the gaze
      // turns toward the target by the weight's share of the angle between them, so it lets go evenly. No world has it
      // unless it sets it; where the angle is small the two mixes are nearly the same.
      if (poi.arc ?? W.cam.lookArc) {
        const ang = Math.acos(clamp(_d.dot(_poi), -1, 1));
        if (ang > 1e-4) {
          _s.crossVectors(_d, _poi);
          if (_s.lengthSq() < 1e-8) _s.copy(Y); else _s.normalize();   // straight behind: turn about the vertical
          _d.applyAxisAngle(_s, ang * Math.min(1, w)).normalize();
        }
      } else _d.multiplyScalar(1 - w).addScaledVector(_poi, w).normalize();
    }
    path.tangentAtDist(d, _t0); path.tangentAtDist(d + W.cam.ahead, _t1);
    const turn = _t0.z * _t1.x - _t0.x * _t1.z;
    const bank = clamp(-turn * 0.55, -0.28, 0.28) * W.cam.bank * (1 - calm);
    _r.crossVectors(_d, Y).normalize();
    _up.copy(Y).addScaledVector(_r, bank).normalize();
    _m.lookAt(outPos, _a.copy(outPos).add(_d), _up);
    outQuat.setFromRotationMatrix(_m);
    const t = this.time, sw = W.cam.sway * (this.opts.freeze ? 0 : 1) * (1 - calm);
    _e.set(sw * (0.011 * Math.sin(t * 0.31 + 0.7) + 0.006 * Math.sin(t * 0.73)), sw * (0.018 * Math.sin(t * 0.23) + 0.009 * Math.sin(t * 0.47 + 1.3)), sw * 0.008 * Math.sin(t * 0.19 + 2.1));
    outQuat.multiply(_qs.setFromEuler(_e));
  }

  _swap() {
    const A = this.cur, B = this.next;
    _M.multiplyMatrices(B.entry, A.exitInv);
    _M.decompose(_p, _q, _s);
    this.camQuat.premultiply(_q);
    B.dist = A.dist - A.path.length;
    // a hurry ends at the portal: the speed carried into the next world is no more than this world's own unhurried pace at its end,
    // and into a slower world no more than the doorway's pace (frame(): the next world's opening pace, or DOOR_FLOOR of this cruise)
    if (this.boost) { const vA = (A.path.length / A.duration) * this.settings.speed; this.speed = Math.min(this.speed, vA * (A.pace ? A.pace(1) : 1), Math.max((B.path.length / B.duration) * this.settings.speed * (B.pace ? B.pace(0) : 1), DOOR_FLOOR * vA)); }
    this.cur = B; this.next = null; this.count++; this.blend = 0; this.reveal = 0; this.boost = 0; this.arrived = 0;
    A.view.set(null); A.shown = null; B.ctx.through = false;
    const ts = performance.now();
    // out of the antechamber the journey begins: world 1 (count went from 0 to 1 above) is entered as a first world is, from
    // nowhere, and the frame-rate governor starts its count here (it was not fed in the antechamber, see frame())
    const begin = !!A.def.antechamber; if (begin) this.gov.reset(performance.now());
    this.extras.onSwap(_q, _M); this.extras.enter(B, begin ? null : A); this.style.enter(B);
    this._trash.push({ W: A, at: performance.now() + 700 });
    this.events.world(B, this.count);
    this.perf.mark('swap', performance.now() - ts);
    if (!this.opts.single) setTimeout(() => this._queueNext(), 1200);
  }

  // Renders the next world into the portal texture. Returns false when the portal is off screen.
  //
  // Seen exactly, a far portal is a keyhole: from 40 m a 7 m opening shows ten degrees either side of the next
  // world's entry axis, which is usually its haze. So while the opening is small on screen the next world is drawn
  // by a camera that stands on the viewer's line to the opening but closer to it (the 'lens'): the opening then
  // holds a wide view of the world ahead. The camera slides back to the viewer's own position as the opening
  // grows, and is exactly the viewer's from about one and a half portal widths out, so the crossing is seamless.
  // portal.lens (0..1, default 1) on a world turns this down; 0 is the exact window.
  //
  // A feed world (portal.feed) is given the next world whole: drawn every frame over the whole of the world's own
  // buffer, whether or not the opening is in view, by the camera above or, if the world sets portal.feedPose (a
  // camera matrix in its own space) or portal.feedFov, by that one. The last 3 m are the engine's again, so every
  // crossing is the exact window. A world that has read ctx.portalView is told where the picture is in the buffer
  // (rect) and how to find a point of its own space in it (matrix).
  _renderPortal(A, B, dt) {
    const cam = this.camera, P = A.portal, rim = P.rim, G = P.group.matrixWorld, feed = A.feed;
    let minX = 1, maxX = -1, minY = 1, maxY = -1, minDepth = Infinity, behind = false, fit = 0, cx = 0, cy = 0, rimIn = Infinity;
    for (let i = rim.length - 1; i >= 0; i--) {                 // the last rim point is the centre: it comes first
      const p = rim[i];
      _v4.set(p.x, p.y, p.z, 1).applyMatrix4(G).applyMatrix4(cam.matrixWorldInverse);
      const depth = -_v4.z; if (depth < minDepth) minDepth = depth;
      _v4.applyMatrix4(cam.projectionMatrix);
      if (_v4.w <= 0.0001) { behind = true; continue; }
      const x = _v4.x / _v4.w, y = _v4.y / _v4.w;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (i === rim.length - 1) { cx = x; cy = y; }
      else {                                                    // how far the picture may be widened before this point leaves the frame
        const t = Math.max(Math.abs(x), Math.abs(y)); if (t < rimIn) rimIn = t;
        const dx = x - cx, dy = y - cy;
        fit = Math.max(fit, dx > 0 ? dx / Math.max(1e-4, 1 - cx) : dx / Math.min(-1e-4, -1 - cx), dy > 0 ? dy / Math.max(1e-4, 1 - cy) : dy / Math.min(-1e-4, -1 - cy));
      }
    }
    this.rimIn = rimIn;   // the rim point nearest the middle of the frame, in half-frames: under 1, a point of the rim is in the picture
    if (behind) { if (minDepth < -P.boundR * 2 && !feed) return false; minX = minY = -1; maxX = maxY = 1; }
    if (!feed && (maxX < -1 || minX > 1 || maxY < -1 || minY > 1)) return false;

    const pc = this.portalCam, last = feed && A.path.length - A.dist < 3;
    // full size from the next frame on (the world has this frame's texture already) once the opening is that large
    if (feed && A.feedRT && !A.full) A.goFull = last || Math.max(Math.min(maxX, 1) - Math.max(minX, -1), Math.min(maxY, 1) - Math.max(minY, -1)) > A.feedScale * 2;
    _M.multiplyMatrices(B.entry, A.exitInv);
    const own = feed && !last ? A.world.portal : null, pose = own && own.feedPose && own.feedPose.isMatrix4 ? own.feedPose : null;
    const lens = this.opts.lens ?? A.portalSpec.lens ?? 1;
    let s = 1;
    if (!pose && lens > 0 && !behind && Math.abs(cx) < 1 && Math.abs(cy) < 1) {
      _p.setFromMatrixPosition(cam.matrixWorld).applyMatrix4(_Gi.copy(G).invert());   // the viewer in portal space
      const d = _p.length(), d0 = P.boundR * 1.5;
      const want = Math.pow(1 + (d / d0) * (d / d0), -0.225 * lens);                    // far off, the camera stands at about d0^.45 * d^.55
      s = Math.min(1, Math.max(want, fit * 1.12));
    }
    if (pose) pc.matrixWorld.multiplyMatrices(_M, pose);
    else if (s < 0.999) {
      _C.copy(cam.matrixWorld).setPosition(_p.multiplyScalar(s).applyMatrix4(G));
      pc.matrixWorld.multiplyMatrices(_M, _C);
    } else pc.matrixWorld.multiplyMatrices(_M, cam.matrixWorld);
    // a world that asks for nearThrough is drawn with everything before its entry in the picture, so this camera must not
    // stand lower than that entry: from below, the ground before the entry is drawn from underneath. Swing it up about the
    // entry's centre to the entry's height, place and gaze together, so the opening keeps its place in the picture; the
    // swing eases out between 10 and 3 m, so the crossing stays the exact window.
    if (!pose && !feed && B.cam.nearThrough != null) {
      _a.setFromMatrixPosition(B.entry); _d.setFromMatrixPosition(pc.matrixWorld).sub(_a);
      const h = Math.hypot(_d.x, _d.z), dist = Math.hypot(h, _d.y);
      if (_d.y < 0 && h > 1e-3 && dist > 3) {
        const k = clamp((dist - 3) / 7, 0, 1), phi = Math.atan2(-_d.y, h) * k * k * (3 - 2 * k);
        _t0.set(-_d.z / h, 0, _d.x / h);
        _m.makeRotationAxis(_t0, phi).setPosition(0, 0, 0);
        _t1.copy(_a).applyMatrix4(_m); _m.setPosition(_a.x - _t1.x, _a.y - _t1.y, _a.z - _t1.z);   // the turn about the entry's centre
        pc.matrixWorld.premultiply(_m);
      }
    }
    pc.matrixWorld.decompose(pc.position, pc.quaternion, pc.scale);
    // the local matrix too: a world's update() may ask the camera for its direction or position, which makes
    // three.js rebuild matrixWorld from the local matrix, and a stale one put this camera at the world's origin
    pc.matrix.copy(pc.matrixWorld);
    pc.matrixWorldInverse.copy(pc.matrixWorld).invert();
    _C.multiplyMatrices(pc.matrixWorldInverse, B.entry);        // portal space to the next world's camera
    if (s < 0.999) {                                            // where the opening is in that camera's picture
      minX = minY = 1; maxX = maxY = -1; minDepth = Infinity;
      for (const p of rim) {
        _v4.set(p.x, p.y, p.z, 1).applyMatrix4(_C);
        const depth = -_v4.z; if (depth < minDepth) minDepth = depth;
        _v4.applyMatrix4(cam.projectionMatrix);
        if (_v4.w <= 0.0001) { minX = minY = -1; maxX = maxY = 1; continue; }
        const x = _v4.x / _v4.w, y = _v4.y / _v4.w;
        if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    pc.fov = own && own.feedFov > 0 ? clamp(own.feedFov, 5, 170) : cam.fov; pc.aspect = cam.aspect; pc.far = B.cam.far;
    // camera.nearThrough on the next world: draw it from that near distance, so its ground or sea in front of its entry is
    // in the picture (for a path that starts lower above the surface than the opening is tall); otherwise from the opening's nearest point
    pc.near = pose ? B.cam.near : B.cam.nearThrough != null ? B.cam.nearThrough : Math.max(B.cam.near, minDepth * 0.96);
    pc.updateProjectionMatrix();
    P.setNextView(_C.premultiply(pc.projectionMatrix));
    const V = A.view.used ? A.view : null;
    if (V) V.matrix.multiplyMatrices(_C, A.exitInv);
    this.lensNow = s;
    B.time += dt;
    // (on a pause a world that has been updated once stands as it was last drawn: see frame())
    if (!(B._ran && this.settings.paused && !this.opts.freeze)) { B._ran = true; try { B.world.update?.(dt, B.time, pc, 0); } catch (e) { if (!B._err) { B._err = 1; console.error(e); } } }
    if (B.feed) B.portal.group.visible = B.world.portal.show !== false;
    const rt = this._feedBuf(A); if (rt === A.feedRT) this._fitFeed(A);
    const W = rt.width, H = rt.height, pad = 3;
    let x0 = 0, x1 = W, y0 = 0, y1 = H;
    if (!feed) {
      // The looks of the portal look the next world's picture up a little outside the opening: the ring's ripple by up to
      // 0.016 of the whole picture, the lens and the film by up to 0.035 of the opening's half size, and the sixteen rim
      // points lie up to 0.02 of it inside the true rim. Outside the box this buffer still holds an older picture (the
      // last one drawn whole), which showed as a stray patch just inside the rim. So the box is grown by what they reach.
      const padX = pad + Math.ceil(0.017 * W + 0.03 * (maxX - minX) * 0.5 * W), padY = pad + Math.ceil(0.017 * H + 0.03 * (maxY - minY) * 0.5 * H);
      x0 = clamp(Math.floor((minX * 0.5 + 0.5) * W) - padX, 0, W); x1 = clamp(Math.ceil((maxX * 0.5 + 0.5) * W) + padX, 0, W);
      y0 = clamp(Math.floor((minY * 0.5 + 0.5) * H) - padY, 0, H); y1 = clamp(Math.ceil((maxY * 0.5 + 0.5) * H) + padY, 0, H);
      if (x1 - x0 < 1 || y1 - y0 < 1) return false;
    }
    rt.scissor.set(x0, y0, x1 - x0, y1 - y0);
    if (V) V.rect.set(x0 / W, y0 / H, (x1 - x0) / W, (y1 - y0) / H);
    const first = !B.drawn, n0 = first ? this.renderer.info.programs.length : 0, t0 = first ? performance.now() : 0;
    this.renderer.setRenderTarget(rt);
    this.renderer.render(B.scene, pc);
    this.renderer.setRenderTarget(null);
    if (first) {   // programs made here were missed by _prepare: each one is a stall on a slow shader compiler
      B.drawn = true; if (B.loadRec) B.loadRec.late = this.renderer.info.programs.length - n0;
      this.perf.mark('first-draw:' + B.def.id, performance.now() - t0);
    }
    return true;
  }

  // ---------- frame ----------
  _tick(now) {
    requestAnimationFrame(this._tick);
    const gap = now - this._last, raw = Math.min(Math.max(0.1, this.opts.maxDt || 0), gap / 1000); this._last = now;
    this._gap = this._gap == null ? 16.7 : this._gap + (Math.min(gap, 1000) - this._gap) * 0.2;   // how often frames come round, smoothed (see _anteMs)
    if (!this.opts.hold) {   // hold: freeze-mode harness renders on demand only
      // the antechamber's frames are left out of the stall recorder as paused ones are: they cost almost nothing, and the 'usual frame' they would set would make world 1's ordinary frames look like stalls
      if (this.cur) this.perf.frame(now, gap, { id: this.cur.def.id, u: this.stats.u || 0, paused: this.settings.paused || !!this.opts.freeze || !!this.cur.def.antechamber });
      this.frame(raw);
    }
    const ws = this._waiters; this._waiters = [];
    for (const r of ws) setTimeout(() => { this._slice = performance.now(); r(); }, 0);
  }

  // carried: the step of a frame in which the portal was crossed (below). The flight has been advanced and the journey's
  // clock counted; the frame then goes on as an ordinary frame of the arriving world with that step, so that no world,
  // ride or companion is handed a step of nought in flight (only the still page hands one).
  frame(raw, carried) {
    const A = this.cur;
    if (!A || this.lost) return;
    const frozen = !!this.opts.freeze, cross = carried != null;
    const dt = cross ? carried : frozen ? (this.opts.stepDt ?? 0) : (this.settings.paused ? 0 : Math.min(raw, this.opts.maxDt || 0.05));
    if (!cross) this.time += dt;
    const L = A.path.length, B = this.next && this.next.ready ? this.next : null;

    if (!frozen && !cross) {
      let target = (L / A.duration) * this.settings.speed * (this.boost ? (this.gentle ? 2 : 5) : 1);   // hurrying to the portal is gentler on a gentle flight
      if (A.pace) target *= A.pace(A.dist / L);
      const remaining = L - A.dist;
      // The antechamber's portal is where a visit waits for its first world, and the wait has to look meant: while that world is
      // not ready the drift slows as the square of the way left to a point 14 m short of the portal, so it never halts and
      // never arrives; from the moment the world is ready it goes in at its own pace (about 8 s in all if the world was ready by 2.5 s).
      if (A.def.antechamber) { if (!B) { const g = clamp((remaining - 14) / 30, 0, 1); target *= g * g; } }
      else if (!B) { target *= smoothstep(1, 45, remaining); if (remaining < 30) this.perf.wait(dt * 1000); }
      else {
        // THE DOORWAY: a portal into a slower world is entered slowly. Over the last stretch (from 2.5 s of this world's cruise before
        // the portal to 0.4 s before it; the speed follows the asked pace about 0.7 s behind, hence the 0.4) the pace falls
        // smoothly toward the next world's own opening pace, never under DOOR_FLOOR of this world's cruise, so a fast world
        // does not throw the flight into a small room at many times that room's pace. Into a faster world nothing changes here.
        const vA = (L / A.duration) * this.settings.speed, door = Math.max((B.path.length / B.duration) * this.settings.speed * (B.pace ? B.pace(0) : 1), DOOR_FLOOR * vA);
        if (door < target) target = door + (target - door) * smoothstep(vA * 0.4, vA * 2.5, remaining);
        // A CROSSING WAITS FOR ITS BLEND: the lens and colour of the two worlds meet at 0.8 a second at the most (below), and the
        // portal is not reached before they have met. It only binds where the next world was ready late, close to the portal.
        if (this.blend < 0.98) target = Math.min(target, Math.max(remaining, 0.5) * 0.72 / (1 - this.blend));
      }
      this.speed += (target - this.speed) * (1 - Math.exp(-dt * (this.arrived < ARRIVE_SPEED && target > this.speed ? 0.45 + 0.95 * smoothstep(0, ARRIVE_SPEED, this.arrived) : 1.4)));
      A.dist += this.speed * dt;
      if (B && A.dist >= L - 0.45) { this._swap(); return this.frame(raw, dt); }
      if (!B && A.dist > L - 1) A.dist = L - 1;
    }

    const cam = this.camera, u = clamp(A.dist / L, 0, 1), remaining = L - A.dist;
    const calmTo = this.settings.camera === 'steady' || this.settings.calmOnly ? 1 : 0;   // a calm journey always flies with the steady camera
    this.calm = frozen ? calmTo : this.calm + clamp(calmTo - this.calm, -raw * 0.7, raw * 0.7);
    this._pose(A, A.dist, cam.position, _q);
    if (!this.camInit || frozen) { this.camQuat.copy(_q); this.camInit = true; }
    else { this.arrived += dt; this._turn(this.camQuat, _q, dt); }
    cam.quaternion.copy(this.camQuat);

    // a feed world shows the next world itself, so its opening is open as soon as there is a next world
    const revealT = B ? (A.feed ? 1 : 1 - smoothstep(A.revealDist * 0.6, A.revealDist, remaining)) : 0;
    // the world's own grade, exposure and field of view give way to the next world's over this many metres (portal.blendDistance)
    // where either world's post is flat (no tone curve), a long blend mixes a tone curve in or out and shows as wrong colours
    // for the last fifth of the flight (dark inks go black): such a pair blends over the last 25 m unless the world says otherwise
    const flatPair = A.post.flat > 0.5 || (B && B.post.flat > 0.5);
    const bd = A.portalSpec.blendDistance, blendDist = bd != null ? Math.max(1, +bd || 0) : Math.min(L * 0.22, flatPair ? 25 : 140);
    const blendT = B ? 1 - smoothstep(0, blendDist, remaining) : 0;
    if (frozen) { this.reveal = this.opts.forceReveal != null && B ? this.opts.forceReveal : revealT; this.blend = blendT; }
    else {
      const k = 1 - Math.exp(-dt * 2.2);
      this.reveal += (revealT - this.reveal) * k;
      // (flown fast, a short blend would pass in a few frames and the forced line below would land most of it in one: the blend is
      // also begun no later than 2.2 s before the portal at the speed flown, which the rate here can follow)
      const blendTo = B ? Math.max(blendT, 1 - smoothstep(0, 2.2, remaining / Math.max(this.speed, 1))) : 0;
      // (never faster than 0.8 a second, unless the portal is nearer than that allows: then just fast enough to be whole at the portal, so a hurry never ends in a jump of lens and colour)
      this.blend += clamp(blendTo - this.blend, -dt * 0.8, dt * Math.max(0.8, B ? (1 - this.blend) / Math.max(remaining / Math.max(this.speed, 1), dt) : 0));
      if (remaining < 3 && B) this.blend = Math.max(this.blend, blendT);
    }
    if (A.feed && !A.portal.group.visible) this.reveal = revealT;   // nothing to ease while the opening is hidden
    blendPost(A.post, B ? B.post : A.post, B ? this.blend : 0, this.postNow);
    // how much of the glow laid over the opening the opening takes back (portal.js, wash()); _renderPortal turns it down as the
    // opening comes to fill the frame (see there)
    const dewash = B ? (this.opts.dewash ?? A.portalSpec.dewash ?? (A.feed ? 0 : 0.85)) : 0;
    A.portal.setDewash(this.post.bloomTexture, dewash);
    if (B) {   // inside the opening the next world is shown at its own exposure and tint, within limits, not at this world's
      const n = this.postNow, g = B.post.exposure / Math.max(1e-3, n.exposure), lim = (x) => clamp(x, 0.45, 2.2);
      A.portal.setGain(lim(g * B.post.tint.r / Math.max(0.05, n.tint.r)), lim(g * B.post.tint.g / Math.max(0.05, n.tint.g)), lim(g * B.post.tint.b / Math.max(0.05, n.tint.b)));
    }
    cam.fov = fovFor(this.postNow.fov, cam.aspect); cam.far = A.cam.far;
    // THE LENS'S NEAR PLANE NEVER REACHES THE OPENING. The worlds cross 0.45 m before the line's end; a world whose near distance
    // is longer than the lens then stands from the opening had the opening cut away before the crossing (all at once where the
    // lens looks square at it, from one side where it looks aslant) and the old world drawn again behind it for a frame or two
    // (found by the first Seven Wonders crew, 11-09). So where the opening is within the near plane's reach, the near plane is
    // held short of the opening's plane: on a plane the depth along the gaze is least at a corner of the frame, so the four
    // corner rays give the least depth at which the opening can stand in the picture, and the near distance stays under nine
    // tenths of it. It only ever shortens the world's own near distance, and only where the opening's plane is within the
    // near plane's reach and the lens within that reach of the opening's bounding circle: no still moves but one set in the
    // last metre or two before an opening. A world's update() runs after this and may narrow the field of view (two do);
    // it must never widen it, or the corners here stand too far in.
    { const n = this.extras.near(A.cam.near), R = A.portal.boundR || 12; let zmin = Infinity;
      const ty = Math.tan(cam.fov * Math.PI / 360), tx = ty * cam.aspect, reach = 1.2 * n * Math.hypot(1, tx, ty);   // the near plane's farthest corner stands n * hypot(1, tx, ty) from the lens; a fifth more for the nine tenths below
      if (remaining < Math.max(4 * n, reach) + 1 + R) {
        const e = A.exitInv.elements, P = cam.position, pz = e[2] * P.x + e[6] * P.y + e[10] * P.z + e[14];   // the lens in the opening's own space: z is its distance from the plane
        const out = Math.max(0, Math.hypot(e[0] * P.x + e[4] * P.y + e[8] * P.z + e[12], e[1] * P.x + e[5] * P.y + e[9] * P.z + e[13]) - R);   // and how far it stands outside the bounding circle
        if (pz * pz + out * out < reach * reach) for (let i = 0; i < 4; i++) {
          _s.set(i & 1 ? tx : -tx, i & 2 ? ty : -ty, -1).applyQuaternion(cam.quaternion);   // a corner ray; its length along the gaze is 1
          const d = -pz / (e[2] * _s.x + e[6] * _s.y + e[10] * _s.z);
          if (d > 0 && d < zmin) zmin = d;
        }
      }
      cam.near = Math.min(n, Math.max(0.02, zmin * 0.9)); }
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true);

    if (A.goFull && !A.full) { A.full = true; A.portal.setTexture(this.portalRT.texture); }   // a feed grown large: see _feedBuf
    // ctx.portalView for the world's update(): the texture is the real one only while it holds a picture of the next
    // world (a feed world's is drawn below, before the world itself; another world's was drawn last frame)
    if (A.view.used) { const V = A.view; V.set(B && (A.feed || A.shown === B) ? this._feedBuf(A).texture : null); if (B) V.gain.copy(A.portal._shared.uGain.value); }
    A.time += dt;
    A.flight.rate = frozen || A.def.antechamber ? 1 : this.speed / Math.max(1e-6, (L / A.duration) * (A.pace ? A.pace(u) : 1));   // ctx.flight
    // ON A PAUSE the world, the ride and the companion are not updated: they stand as they were last drawn. (A step of
    // nought is how the still page asks for a settled picture, and much code answers it by letting every eased value jump
    // to its target: on a pause that showed as wheels, smoke, flocks and lights hopping in the first paused frame.)
    const stand = this.settings.paused && !frozen;
    if (!(stand && A._ran)) { A._ran = true; try { A.world.update?.(dt, A.time, cam, u); } catch (e) { if (!A._err) { A._err = 1; console.error(e); this.events.status({ error: A.def.id + ' update: ' + e.message }); } } }
    if (A.feed) A.portal.group.visible = remaining < 3 || A.world.portal.show !== false;   // the last metres are the crossing's
    else if (A.drawWithin != null) { A.portal.group.visible = remaining <= A.drawWithin; if (A.drawIn) A.portal.setGrow(0.04 + 0.96 * smoothstep(0, A.drawIn, A.drawWithin - remaining)); }
    A.portal.setTime(this.time); A.portal.setReveal(this.reveal); A.portal.setNear?.(1 - smoothstep(4, 30, remaining));
    this.extras.update(dt, A, B, cam, u, remaining, this.speed, stand);
    this.style.update(dt, A, u, frozen);

    this.renderer.info.reset();
    // Every shader program should exist before the frame that needs it (see _prepare). Programs the loader made
    // since the last frame are expected; any that appear while this frame is drawn were compiled in view, which is
    // a pause on machines where compiling is slow. The recorder names them.
    const known = this._known || (this._known = new WeakSet()), progs = this.renderer.info.programs;
    for (const p of progs) known.add(p);
    const t1 = performance.now();
    let portalTris = 0, portalCalls = 0, drew = false;
    if (B && (A.feed || this.reveal > 0.002)) {
      drew = this._renderPortal(A, B, dt);
      // THE TAKE-BACK ENDS WHERE THE OPENING FILLS THE FRAME. What the opening takes back is this world's glow lying over it: the
      // rim's, a bright sky's beside it. Once no point of the rim is left in the frame there is none of that, only the glow of the
      // opening's own picture, and taking that back answers itself a frame late: a bright next world swung light and dark by
      // turns over the last metres, and the rim's glow, gone from the frame, was still taken out of its edge as a dark blot. So
      // the take-back falls from whole to nought as the rim point nearest the middle of the frame goes from 0.8 to 1.2
      // half-frames out; at the portal nothing is taken back and the last frame before it is the first one after it.
      if (drew && dewash > 0) A.portal.setDewash(this.post.bloomTexture, dewash * (1 - smoothstep(0.8, 1.2, this.rimIn)));
      portalTris = this.renderer.info.render.triangles; portalCalls = this.renderer.info.render.calls;
    }
    if (A.view.used) A.shown = drew ? B : null;
    const t2 = performance.now();
    this.fade = Math.min(1, this.fade + (frozen ? 1 : raw * 0.6));
    this.post.render(A.scene, cam, this.postNow, this.time, this.fade);
    const t3 = performance.now(); let fresh = null;
    for (const p of progs) if (!known.has(p)) { known.add(p); (fresh || (fresh = [])).push((p.type || '?') + (p.name ? ':' + p.name : '')); }
    if (fresh) this.perf.shaders(A.def.id, u, fresh, t3 - t1); else { this.perf.mark('portal-draw', t2 - t1); this.perf.mark('draw', t3 - t2); }
    const info = this.renderer.info;
    this.stats = { id: A.def.id, seed: A.seed, u, triangles: info.render.triangles - portalTris, calls: info.render.calls - portalCalls, portalTris, portalCalls,
      ride: this.extras.ride?.def.id, companion: this.extras.comp?.def.id, style: this.style.activeId,
      buildMs: Math.round(A.buildMs), jsMs: Math.round(A.jsMs), geometries: info.memory.geometries, textures: info.memory.textures, programs: info.programs?.length,
      pr: Math.round(this.pr * 100) / 100, quality: this.tier, fps: Math.round(this.fps), size: Math.floor(this.w * this.pr) + 'x' + Math.floor(this.h * this.pr), aa: this.samples, next: B?.def.id, lens: Math.round((this.lensNow ?? 1) * 100) / 100, view: A.view.used ? +A.view._live : undefined };

    if (this._trash.length) this._clear();
    if (this.adaptive && dt > 0 && !this.boost && !A.def.antechamber) this._adapt(raw);   // frames while hurrying to the portal say nothing about the usual load, nor do the antechamber's (near free to draw, with world 1 being built between them)
  }

  // test aid: renders the current view into a float buffer and counts pixels that are not finite or absurd
  badPixels(w = 400, h = 225) {
    const r = this.renderer, A = this.cur;
    const rt = this._badRT || (this._badRT = new THREE.WebGLRenderTarget(w, h, { type: THREE.FloatType }));
    const prev = r.getRenderTarget(); r.setRenderTarget(rt); r.clear(); r.render(A.scene, this.camera); r.setRenderTarget(prev);
    const px = new Float32Array(w * h * 4); r.readRenderTargetPixels(rt, 0, 0, w, h, px);
    let nan = 0, inf = 0, neg = 0, big = 0, max = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let i = 0; i < w * h; i++) {
      const a = px[i * 4], b = px[i * 4 + 1], c = px[i * 4 + 2]; let bad = false;
      if (a !== a || b !== b || c !== c) { nan++; bad = true; }
      else if (!isFinite(a) || !isFinite(b) || !isFinite(c)) { inf++; bad = true; }
      else { const m = Math.max(a, b, c); if (m > max) max = m; if (m > 400) { big++; bad = true; } if (Math.min(a, b, c) < -0.01) neg++; }
      if (bad) { const x = i % w, y = (i / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    return { nan, inf, big, neg, max: Math.round(max * 10) / 10, box: x1 >= 0 ? [x0, y0, x1, y1] : null };
  }

  // settings that shape a world changed: rebuild the waiting world if the viewer has not seen it yet
  refresh() {
    const n = this.next; if (!n || this.reveal > 0.01 || this.opts.single) return;
    this.next = null; if (n.ready) this._dispose(n);
    this.recent.pop(); this.lastId = this.cur?.def.id; this._queueNext();
  }
  // q: 'auto' or one of QUALITY_LEVELS. On 'auto' the level is the engine's guess for this machine (or the level
  // it settled on last time, autoTier), and it steps down by itself if frames stay slow.
  setQuality(q, autoTier) {
    this.qualitySetting = QUALITY_LEVELS.includes(q) ? q : 'auto';
    const tier = this.qualitySetting === 'auto' ? (QUALITY_LEVELS.includes(autoTier) ? autoTier : this.autoGuess) : this.qualitySetting;
    this._setTier(tier);
  }
  _setTier(tier) {
    this.tier = tier; this._limits(); this.pr = this.maxPR;
    this.gov.reset(performance.now());
    const samples = this._samplesFor(tier);
    if (samples !== this.samples) {
      this.samples = samples; this.post.setSamples(samples);
      this.portalRT.samples = samples; this.portalRT.dispose();   // rebuilt with the new antialiasing on its next use
    }
    this._resize(true);
    this.events.quality(this.tier, this.qualitySetting);
  }
  // hurry to the next portal (the viewer still never steers)
  skip() { if (this.next && this.next.ready) this.boost = 1; }

  // adaptive resolution and, on 'auto', the step down a level (the rules are in quality.js)
  _adapt(raw) {
    const g = this.gov, a = g.tick(raw, performance.now(), { pr: this.pr, minPR: this.minPR, maxPR: this.maxPR, canDown: this.qualitySetting === 'auto' && this.tier !== 'low' });
    this.fps = g.fps;
    if (!a) return;
    const t0 = performance.now();
    if (a.down) this._setTier(QUALITY_LEVELS[QUALITY_LEVELS.indexOf(this.tier) - 1]);
    else if (Math.abs(a.pr - this.pr) > 0.005) { this.pr = a.pr; this._resize(true); }
    this.perf.mark('resize', performance.now() - t0 + 1);
  }
}
