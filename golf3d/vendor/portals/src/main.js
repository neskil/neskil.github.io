import { Engine } from './core/engine.js';
import * as REGISTRY from './worlds/index.js';
const WORLDS = REGISTRY.WORLDS, SUITES = REGISTRY.SUITES || [];   // a tree whose own registry has no list of journeys still loads
import { RIDES, COMPANIONS, STYLES } from './extras.js';
import { QUALITY_NAMES, gpuName } from './core/quality.js';
import { setupAtlas } from './ui/atlas.js';
import { flown, readTour, readSuite, worldLink, suiteLink, journeyLink, copyText, captioned, byline, loadHearts, saveHearts, openAbout, ABOUT_READY } from './ui/share.js';

const q = new URLSearchParams(location.search);
const num = (k, d) => (q.has(k) ? Number(q.get(k)) : d);
const $ = (id) => document.getElementById(id);

// Registry entries carry just enough to choose a world; the module loads when it is needed.
function entryFor(id) {
  const known = WORLDS.find((w) => w.id === id);
  if (known) return known;
  const url = './worlds/' + id + '.js'; // development only: unlisted test and demo worlds
  return { id, name: id, category: 'test', weirdness: 0, load: () => import(url) };
}

async function boot() {
  const only = q.get('world'), nextId = q.get('next');
  const freeze = q.has('freeze');
  const defs = only ? [entryFor(only)].concat(nextId ? [entryFor(nextId)] : []) : WORLDS;
  if (!defs.length) { $('veil-sub').textContent = 'no worlds could be loaded'; window.__shotError = 'no worlds'; return; }

  // remembered choices; test pages (one world, or frozen) ignore them
  let saved = {}; try { saved = JSON.parse(localStorage.getItem('portals.settings') || '{}') || {}; } catch (e) {}
  const plain = !!only || freeze;
  // the level 'auto' settled on last time is trusted for three days, then the machine gets a fresh guess
  let autoTier = !plain && saved.autoTier && Date.now() - saved.autoTier.at < 3 * 864e5 ? saved.autoTier : null;

  // which worlds this viewer has seen on this device, and when: a new visit shows the others first. A journey link
  // (?session=) replays its own order, and test pages keep no memory.
  let seen = null;
  if (!plain && !q.has('session')) { seen = {}; try { const o = JSON.parse(localStorage.getItem('portals.seen') || '{}'); for (const d of defs) if (o && o[d.id] > 0) seen[d.id] = o[d.id]; } catch (e) {} }

  // a journey from the list (?suite=<id>: worlds flown in order, src/ui/share.js readSuite); on a calm-only visit (chosen
  // before, or asked for in the link) its worlds that are not calm are passed over
  const journey = plain ? null : readSuite(q, defs, SUITES, saved.calm === true || (q.has('calm') && q.get('calm') !== '0'));

  const engine = new Engine($('view'), defs, {
    seed: q.has('session') ? num('session') : undefined, seen,
    tourHours: journey ? journey.hours : null,   // the hour a journey names for a step (design/suites.json hours), ahead of the viewer's own Hour while it lasts
    tour: journey ? journey.tour.slice() : readTour(q, defs),   // a journey link's worlds (?tour=id1,id2,...), flown in that order before the picker takes over; its first is the opening world (readTour puts it in ?start=)
    fixedSeed: q.has('seed') ? num('seed') : undefined,
    freeze, single: !!only && !q.has('loop') ? true : false,
    pixelRatio: q.has('pr') ? num('pr') : undefined,
    safeMath: q.get('safe') || undefined,
    maxDt: q.has('maxdt') ? num('maxdt') : undefined,
    samples: q.has('aa') ? num('aa') : (freeze ? 0 : undefined),
    quality: q.get('quality') || (plain ? 'high' : saved.quality), autoTier: autoTier?.tier,
    forceReveal: q.has('reveal') ? num('reveal') : undefined,
    lens: q.has('lens') ? num('lens') : undefined,
    dewash: q.has('dewash') ? num('dewash') : undefined,
    portalStyle: q.get('portalstyle') || undefined,
    // compile logs are read back on test pages and when asked for (?checks=1); on the live page that read makes each new program wait
    checkShaders: plain || q.has('checks') || q.has('debug'),
    prepare: q.get('prep') === '0' ? false : undefined,
    provoking: q.get('pv') === '0' ? false : undefined,   // ?pv=0: flat varyings from the last corner, for comparison
    // a steady camera for anyone the swooping would make queasy: asked for in the link, chosen before, or the system's own
    // 'reduce motion'. Comfort goes one way: a link may ask for the steady camera, but a link's camera=sweeping does not
    // undo the visitor's own steady choice or 'reduce motion' (a test page takes the link's word as it stands)
    camera: plain ? (q.get('camera') || 'sweeping') : (q.get('camera') === 'steady' || saved.camera === 'steady' || ((!saved.camera || !saved.cameraSet) && matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'steady' : 'sweeping'),
  });
  window.__engine = engine;
  if (q.get('guard') === '0') engine.post.guard.enabled = false;   // test aid: shows what an invalid pixel does without the clean-up pass
  if (q.has('strange')) engine.settings.strangeness = num('strange', 0.5);
  // the pace: asked for in the link, else the one chosen on an earlier visit (kept inside the slider's own range). A link's
  // pace is held to the slider's range too (0.4 to 2.5); only a test page (a single world, a frozen one, or one that
  // sets maxdt) may ask for more, and never for a pace that is not a number
  if (q.has('speed')) { const sp = num('speed', 1), test = plain || q.has('maxdt'); engine.settings.speed = Number.isFinite(sp) ? Math.min(test ? 40 : 2.5, Math.max(test ? 0.05 : 0.4, sp)) : 1; } else if (!plain && typeof saved.speed === 'number' && saved.speed >= 0.4 && saved.speed <= 1) engine.settings.speed = saved.speed;   // a slower pace is kept; a fast try does not open the next visit in a rush
  // remembered choices, then anything the link asks for; test pages get no extras unless asked
  for (const k of ['ride', 'companion', 'style', 'hour']) {
    if (plain) engine.settings[k] = k === 'hour' ? 'any' : 'off'; else if (typeof saved[k] === 'string') engine.settings[k] = saved[k];
    if (q.has(k)) engine.settings[k] = q.get(k);
  }
  if (!plain && Array.isArray(saved.kinds) && saved.kinds.length) engine.settings.kinds = new Set(saved.kinds);
  if (!plain && saved.order === 'any') engine.settings.order = 'any';
  // 'Favourites only' chosen on an earlier visit (three or more kept): the engine is told before the opening world is chosen, so the visit opens on a favourite
  if (!plain && saved.order === 'hearts' && !q.has('order') && !q.has('session') && !q.has('tour') && !journey) { const h = loadHearts(); if (defs.reduce((n, d) => n + (h.has(d.id) ? 1 : 0), 0) >= 3) { engine.hearts = h; engine.settings.order = 'hearts'; } }
  // calm worlds only: chosen before, or asked for in the link (?calm=1). A link's calm=0 does not undo the visitor's own
  // choice (a test page takes the link's word as it stands)
  if (!plain && saved.calm === true) engine.settings.calmOnly = true;
  if (q.has('calm') && (plain || q.get('calm') !== '0' || saved.calm !== true)) engine.settings.calmOnly = q.get('calm') !== '0';
  if (engine.settings.calmOnly) engine.calm = 1;
  if (q.has('order')) engine.settings.order = q.get('order') === 'any' ? 'any' : 'new';
  if (q.has('stylek')) engine.settings.styleStrength = num('stylek', 1);

  // ---------- HUD ----------
  const title = $('title'); let titleTimer = 0;
  // The title shown for the world on screen (the title card, a captioned picture, the share menu). A world's build may name
  // its own title (W.world.title: one per hour or edition); the registry's name is the world's title otherwise. The owner's
  // table (design/titles.json) may set both: titles (the name) and cards (what is shown where a build returns given words).
  // A build that returns the world's own old name is shown under the name the table gives.
  const shownTitle = (W) => {
    const d = W.def, t = W.world && W.world.title;
    if (t && d.cards && typeof d.cards[t] === 'string') return d.cards[t];
    if (!t || t === d.ownName) return d.name || d.id;
    return t;
  };
  // The place in a journey, for the title card ("The Long Way Round · 3 of 12"), or '' where the world is in none: a
  // journey from the list while its worlds come in order (the first world outside it after it began ends it, and one
  // line says so and names another journey), or a made series (def.suite, written into the registry).
  const placeIn = (def) => {
    if (journey && !journey.over) {
      const i = journey.worlds.indexOf(def.id);
      if (i > journey.at) { journey.at = i; return journey.title + ' · ' + (i + 1) + ' of ' + journey.worlds.length; }
      if (journey.at >= 0) {
        journey.over = true; engine.opts.tourHours = null;
        const next = SUITES.length > 1 ? SUITES[(SUITES.findIndex((s) => s.id === journey.id) + 1) % SUITES.length] : null;   // the one after it in the list
        setTimeout(() => toast('That was ' + journey.title + (next ? '. Another journey, ' + next.title + ', is in the list of worlds' : ''), 7000), 9000);
      }
    }
    if (Array.isArray(def.suite)) { const s = SUITES.find((x) => x.id === def.suite[0]); if (s) return s.title + ' · ' + def.suite[1] + ' of ' + def.suite[2]; }
    return '';
  };
  engine.events.world = (W, n) => {
    if (seen) { seen[W.def.id] = Date.now(); try { localStorage.setItem('portals.seen', JSON.stringify(seen)); } catch (e) {} }
    flown.push(W.def.id);   // the worlds flown in this sitting, in order: "Copy journey link" writes them (src/ui/share.js)
    $('title-name').textContent = shownTitle(W);
    const after = String(W.world.after || W.def.after || '').split(',')[0].trim();     // 'Katsushika Hokusai, 1760 to 1849' reads "after Katsushika Hokusai"
    const book = String(W.world.book || W.def.book || '').trim(), author = String(W.world.author || W.def.author || '').split(/\s*,\s*and\s+/).map((a) => a.split(',')[0].trim()).filter(Boolean).join(' and ');   // a book world reads "from The Time Machine by H. G. Wells": of each author the name before the first comma (years, centuries, "about", BCE are left out; two authors joined by ", and" both stay)
    $('title-after').textContent = after || book ? (after ? 'after ' + after : 'inspired by ' + book + (author ? ' by ' + author : '')) : byline(W.def, W.world);   // a wonder: its place and year (ui/share.js)
    // what we are looking at, in one short line (the registry's `line`, from design/lines.json; every world has one since
    // 8 Nov 2026); a card with a line stays up a little longer
    const line = (WORLDS.find((w) => w.id === W.def.id) || {}).line || '';
    $('title-line').textContent = line;
    $('title-meta').textContent = placeIn(W.def) || 'World ' + n;
    title.classList.remove('show');
    clearTimeout(titleTimer);
    titleTimer = setTimeout(() => { title.classList.add('show'); titleTimer = setTimeout(() => title.classList.remove('show'), line ? 8500 : 7000); }, 1400);
    if (window.__audio) window.__audio.world(W);
  };
  engine.events.status = (s) => {
    if (s.error) window.__errors = (window.__errors || []).concat(s.error);
    // the browser took the graphics away (common on phones after switching apps): start again when it is back
    if (s.lost) { $('veil').classList.remove('gone'); $('veil-sub').textContent = 'one moment'; }
    if (s.restored) location.reload();
  };
  // The engine has handed out the last world of the pool this viewer had not seen (n: how many there are; def: that world).
  // One quiet line once it is on screen, and not again until the collection has grown (localStorage 'portals.seenAll').
  engine.events.allSeen = (n, def) => {
    let told = 0; try { told = Number(localStorage.getItem('portals.seenAll')) || 0; } catch (e) {}
    if (!(n > told)) return;
    let on = 0; const t = setInterval(() => {
      if (engine.cur?.def.id !== def.id || ++on < 6) return;   // a few seconds in, when its title has come up
      clearInterval(t); try { localStorage.setItem('portals.seenAll', String(n)); } catch (e) {}
      toast('You have now seen all ' + n + (n < defs.length ? ' worlds of your choice' : ' worlds') + '. From here they come round again, the ones you saw longest ago first.', 7000);
    }, 1000);
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && engine.lost) setTimeout(() => { if (engine.lost) location.reload(); }, 1500); });

  const start = q.get('start');
  // the opening world (the choosing is firstWorld in core/pick.js, so tools/ordertest.mjs runs the same code): one of the
  // openers this viewer has not seen (on a calm journey a calm one: the calm openers, or any calm world when no opener is
  // calm); when every opener has been seen, the best of the worlds not seen; then the openers seen longest ago
  const opening = () => engine._first(defs);
  const first = only ? defs[0] : (start ? defs.find((d) => d.id === start) : opening()) || undefined;
  const second = only ? (nextId ? defs[1] || null : (q.has('loop') ? defs[0] : null)) : undefined;
  // Every visit opens in the antechamber: a small place between worlds with one portal ahead and the journey's first world
  // behind it, so the first act is a crossing and the wait for that world is a portal, not a black page. It is not a world
  // of the journey (the engine neither counts nor announces it). Test pages start as they always did; ?ante=0 skips it.
  const ante = !plain && q.get('ante') !== '0' ? { id: '_antechamber', name: '', category: 'between', antechamber: true, weirdness: 0, load: () => import('./worlds/_antechamber.js') } : null;
  if (ante && first && first.load) first.load().catch(() => {});   // world 1's module is fetched meanwhile; the engine builds it once the antechamber is on screen
  engine.events.antechamber = () => { $('veil-sub').textContent = ''; $('veil').style.transitionDuration = '1.4s'; };   // 'finding a world' goes at once, and the veil lifts faster than it does off a world: the picture fades up from black by itself
  // (should the antechamber itself fail to load, the visit starts in world 1 as it did before there was one)
  const W = await engine.start(ante || first, ante ? first : second).catch((e) => { if (!ante) throw e; console.warn('antechamber', e); return engine.start(first, second); });

  if (freeze) {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const raf = () => new Promise((r) => requestAnimationFrame(r));
    // up to five minutes by the clock: on a loaded machine the next world can be ready late, and a still taken before it shows the exit as a flat pane no visitor sees.
    // Meanwhile nothing is drawn (hold): a frozen page shows no visitor anything, and on a software renderer each whole frame of a dear world would cost seconds
    // while the next world's build gets one short slice per frame. The frames still come round, so the build's hand-backs are answered as before.
    if (nextId) { const t0 = performance.now(); engine.opts.hold = true; while (!(engine.next && engine.next.ready) && performance.now() - t0 < 300000) await wait(50); engine.opts.hold = false; }
    $('veil').style.display = 'none'; $('title').style.display = 'none'; $('hud').style.display = 'none';
    // pose the camera at path fraction u and world time t, render, and report stats
    window.__pose = async (u, t) => {
      W.dist = u * W.path.length; W.time = t; engine.time = t;
      if (q.has('nantest') && !W.scene.userData.nanTest) {   // test aid: a few specks that write not-a-number, as a broken shader would on some GPUs
        const THREE = await import('three');
        const g = new THREE.BufferGeometry(); const n = num('nantest', 3) || 3, pos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { const f = W.path.frameAt(Math.min(1, u + 0.01 + 0.012 * i)); pos[i * 3] = f.elements[12] + (i - 1) * 1.5; pos[i * 3 + 1] = f.elements[13] + (i % 2) * 1.2; pos[i * 3 + 2] = f.elements[14]; }
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const m = new THREE.ShaderMaterial({ uniforms: { uZ: { value: 0 } }, depthTest: false, vertexShader: 'void main(){ gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_PointSize=' + num('nansize', 3).toFixed(1) + '; }', fragmentShader: 'uniform float uZ; void main(){ gl_FragColor=vec4(vec3(uZ/uZ),1.); }' });
        const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 999; W.scene.add(pts); W.scene.userData.nanTest = pts;
      }
      engine.opts.hold = true; // render on demand: the software renderer is too slow to free-run
      engine.opts.stepDt = 1 / 60; engine.frame(0);
      engine.opts.stepDt = 0; engine.frame(0);
      if (engine.next) engine.frame(0);   // the opening takes back the previous frame's glow: one more frame lets that settle
      // grab: the harness takes the picture straight from the canvas, in the same task as the render (a browser
      // screenshot of a software-rendered page costs many seconds per picture)
      if (q.has('grab')) window.__png = $('view').toDataURL('image/png');
      else { await raf(); await raf(); await wait(20); }
      window.__stats = q.has('bad') ? { ...engine.stats, bad: engine.badPixels() } : engine.stats;
      if (nextId) window.__stats = { ...window.__stats, nextReady: !!(engine.next && engine.next.ready) };   // false: the exit of this still may be a pane without its world
      return window.__stats;
    };
    // fraction of the picture that changes between world time t and t + gap with the camera held still
    window.__motion = (u, t, gap = 1.5) => {
      const gl = engine.renderer.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
      const grab = (tt) => { W.dist = u * W.path.length; W.time = tt; engine.time = tt; engine.opts.stepDt = 1 / 60; engine.frame(0); engine.opts.stepDt = 0; const px = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
      const a = grab(t), b = grab(t + gap); let changed = 0, n = 0, sum = 0;
      for (let y = 0; y < h; y += 3) for (let x = 0; x < w; x += 3) { const i = (y * w + x) * 4, d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); n++; sum += d; if (d > 36) changed++; }
      return { changedFraction: Math.round((changed / n) * 1000) / 1000, meanDiff: Math.round((sum / n) * 10) / 10 };
    };
    if (!q.has('nopose')) await window.__pose(num('u', 0.3), num('t', 12));
    window.__shotReady = true;
    return;
  }

  $('veil').classList.add('gone');
  if (q.get('hud') === '0') { $('hud').style.display = 'none'; title.style.display = 'none'; }
  const coarse = matchMedia('(pointer: coarse)').matches;

  // keep the screen awake while the journey plays: nobody touches anything for minutes at a time
  let lock = null;
  const keepAwake = async () => {
    try {
      if (!('wakeLock' in navigator)) return;
      if (engine.settings.paused || document.visibilityState !== 'visible') { if (lock) { const l = lock; lock = null; await l.release(); } return; }
      if (!lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); }
    } catch (e) { lock = null; }
  };
  keepAwake(); document.addEventListener('visibilitychange', keepAwake); window.addEventListener('pointerdown', keepAwake, { passive: true });

  const bPause = $('b-pause');
  const setPaused = (p) => { engine.settings.paused = p; bPause.classList.toggle('on', p); bPause.setAttribute('aria-label', p ? 'Play' : 'Pause'); keepAwake(); };
  bPause.onclick = () => setPaused(!engine.settings.paused);
  $('r-speed').value = engine.settings.speed; $('r-speed').oninput = (e) => { engine.settings.speed = Number(e.target.value); }; $('r-speed').onchange = () => save();   // the pace is remembered
  $('r-strange').value = engine.settings.strangeness; $('r-strange').oninput = (e) => { engine.settings.strangeness = Number(e.target.value); };
  const root = document.documentElement, fsOn = root.requestFullscreen || root.webkitRequestFullscreen, fsOff = document.exitFullscreen || document.webkitExitFullscreen;
  const full = () => { try { if (document.fullscreenElement || document.webkitFullscreenElement) fsOff.call(document); else { const r = fsOn.call(root); if (r && r.catch) r.catch(() => {}); } } catch (e) {} };
  if (fsOn) $('b-full').onclick = full; else $('b-full').style.display = 'none';   // an iPhone has no fullscreen: add the page to the home screen instead
  const bSound = $('b-sound');
  const sound = async () => {
    if (!window.__audio) { try { const m = await import('./core/audio.js'); window.__audio = m.createAudio(); window.__audio.world(engine.cur); } catch (e) { console.warn('audio unavailable', e); return; } }
    const on = window.__audio.toggle(); bSound.classList.toggle('on', on); bSound.setAttribute('aria-label', on ? 'Sound off' : 'Sound on');
  };
  bSound.onclick = sound;
  // ---------- more options ----------
  let cameraSet = saved.cameraSet === true || saved.camera === 'steady';   // true once the visitor chose a camera themselves (reduced motion wins over a camera that was only saved along with another option)
  const save = () => { try { localStorage.setItem('portals.settings', JSON.stringify({ ride: engine.settings.ride, companion: engine.settings.companion, style: engine.settings.style, hour: engine.settings.hour, camera: engine.settings.camera, cameraSet, speed: engine.settings.speed, order: engine.settings.order, calm: engine.settings.calmOnly, kinds: engine.settings.kinds ? [...engine.settings.kinds] : [], quality: engine.qualitySetting, autoTier, titles: $('c-titles').checked, caption: $('c-caption').checked })); } catch (e) {} };
  const toast = (msg, ms = 2200) => { let t = $('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); } t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), ms); };
  const fill = (sel, list, key, none) => {
    sel.innerHTML = ''; const add = (v, label) => { const o = document.createElement('option'); o.value = v; o.textContent = label; sel.appendChild(o); };
    add('auto', 'Surprise me'); add('off', none); for (const d of list) add(d.id, d.name);
    sel.value = [...sel.options].some((o) => o.value === engine.settings[key]) ? engine.settings[key] : 'auto';
    sel.onchange = () => { engine.settings[key] = sel.value; save(); engine.refresh(); };
    if (!list.length) sel.closest('label').style.display = 'none';
  };
  fill($('s-style'), STYLES, 'style', 'As it is'); fill($('s-ride'), RIDES, 'ride', 'Just fly'); fill($('s-companion'), COMPANIONS, 'companion', 'Alone');
  // ---------- favourites ----------
  // The heart on the bar (and H) keeps or releases the world on screen; the gallery marks them and can toggle any world.
  // The engine reads this very Set (engine.hearts) when the order is 'Favourites only', which is offered from three on.
  const hearts = plain ? new Set() : engine.hearts || loadHearts(); engine.hearts = hearts;   // test pages keep no memory
  const bHeart = $('b-heart'), oHearts = $('s-order').querySelector('option[value=hearts]');
  const canHeart = (d) => !!d && !d.antechamber && d.category !== 'test' && d.category !== 'between';
  const heartCount = () => defs.reduce((n, d) => n + (hearts.has(d.id) ? 1 : 0), 0);
  const showHearts = () => {
    const d = engine.cur && engine.cur.def, on = !!d && hearts.has(d.id), n = heartCount();
    bHeart.classList.toggle('on', on); bHeart.setAttribute('aria-pressed', String(on)); bHeart.setAttribute('aria-label', on ? 'Release this favourite' : 'Keep this world as a favourite');
    oHearts.disabled = n < 3; oHearts.textContent = n < 3 ? 'Favourites only (keep three first)' : 'Favourites only (' + n + ')';
    $('s-order').value = engine.settings.order;
  };
  // id: any world of the collection (the gallery's hearts); none: the world on screen. Returns whether it is now kept.
  const heart = (id, say = true) => {
    const d = id ? defs.find((x) => x.id === id) : engine.cur && engine.cur.def;
    if (!canHeart(d)) return false;
    const on = !hearts.has(d.id); if (on) hearts.add(d.id); else hearts.delete(d.id);
    if (!plain) saveHearts(hearts);
    // fewer than three left: the journey goes back to 'new to you first' (the engine does the same on its side)
    if (heartCount() < 3 && engine.settings.order === 'hearts') { engine.settings.order = 'new'; save(); engine.refresh(); }
    showHearts();
    if (say) toast(on ? 'Kept as a favourite: ' + (d.name || d.id) : 'No longer a favourite: ' + (d.name || d.id));
    return on;
  };
  bHeart.onclick = () => heart();
  { const onWorld = engine.events.world; engine.events.world = (W, n) => { onWorld(W, n); showHearts(); }; }   // the heart shows the state of each world as it arrives
  // 'Favourites only' chosen on an earlier visit: the choice is read here, after the journey has started, so the world waiting
  // behind the first portal is drawn again from the favourites. A journey link keeps its own order, and a world named
  // by a link (?start=) that is still waiting behind the antechamber's portal is not thrown away.
  if (!plain && saved.order === 'hearts' && heartCount() >= 3 && !q.has('order') && !q.has('session') && !q.has('tour') && engine.settings.order !== 'hearts') {
    engine.settings.order = 'hearts'; if (!(q.has('start') && engine.cur.def.antechamber)) engine.refresh();
  }
  showHearts();
  $('s-order').onchange = (e) => { const v = e.target.value, was = engine.settings.order; engine.settings.order = v === 'any' ? 'any' : v === 'hearts' && heartCount() >= 3 ? 'hearts' : 'new'; save(); if ((was === 'hearts') !== (engine.settings.order === 'hearts')) engine.refresh(); if (engine.settings.order === 'hearts') toast('Favourites only: ' + heartCount() + ' worlds'); };
  $('s-hour').value = engine.settings.hour; $('s-hour').onchange = (e) => { engine.settings.hour = e.target.value; save(); engine.refresh(); };
  // while 'calm only' is on the camera is steady whatever was chosen: the box shows that and waits
  // GENTLE is the steady camera under the name a visitor looks for: the wave button on the bar, the key G (and C as
  // before), the Camera box here. It keeps the horizon level, turns slowly, brings no surprise rides and hurries more
  // gently; turning it on also brings a faster pace back to 1 (the visitor may raise it again).
  const bGentle = $('b-gentle');
  const showCamera = () => { const c = !!engine.settings.calmOnly, g = c || engine.settings.camera === 'steady'; $('s-camera').value = g ? 'steady' : 'sweeping'; $('s-camera').disabled = c; bGentle.classList.toggle('on', g); bGentle.setAttribute('aria-pressed', String(g)); };
  const setCamera = (v, say) => { if (engine.settings.calmOnly) { showCamera(); if (say) toast('Calm only keeps the gentle flight'); return; } engine.settings.camera = v === 'steady' ? 'steady' : 'sweeping'; cameraSet = true;
    if (engine.settings.camera === 'steady' && engine.settings.speed > 1) { engine.settings.speed = 1; $('r-speed').value = 1; }
    showCamera(); save(); if (say) toast(engine.settings.camera === 'steady' ? 'Gentle: steady camera, no rides' : 'Sweeping camera', 3200); };
  showCamera(); $('s-camera').onchange = (e) => setCamera(e.target.value);
  bGentle.onclick = () => setCamera(engine.settings.camera === 'steady' ? 'sweeping' : 'steady', true);
  // One quiet line on a first visit (no saved choices, nothing asked by the link), once, forty seconds in, while the
  // sweeping camera still flies: it says the choice exists and can be tapped. It asks nothing about how anyone feels.
  if (!plain && !Object.keys(saved).length && !q.has('camera') && !q.has('session') && engine.settings.camera !== 'steady') {
    let told = false; try { told = !!localStorage.getItem('portals.gentleTip'); } catch (e) {}
    if (!told) setTimeout(() => {
      if (engine.settings.camera === 'steady' || engine.settings.calmOnly || engine.settings.paused || atlas.isOpen()) return;
      try { localStorage.setItem('portals.gentleTip', '1'); } catch (e) {}
      toast(engine.mobile ? 'Tap here for a gentler flight' : 'For a gentler flight, press G or tap here', 7000);
      const t = $('toast'); t.classList.add('tap'); t.onclick = () => { t.onclick = null; t.classList.remove('tap'); setCamera('steady', true); };
      setTimeout(() => { t.onclick = null; t.classList.remove('tap'); }, 7200);
    }, 40000);
  }
  // graphics: 'Auto' picks a level for this machine and lowers it if frames stay slow; the line under it says what is being drawn
  const qSel = $('s-quality'), qAuto = qSel.querySelector('option[value=auto]');
  const qShow = () => { qSel.value = engine.qualitySetting; qAuto.textContent = engine.qualitySetting === 'auto' ? 'Auto (' + QUALITY_NAMES[engine.tier] + ')' : 'Auto'; };
  engine.events.quality = (tier, setting) => {
    qShow();
    if (setting === 'auto' && !plain) { autoTier = tier === engine.autoGuess ? null : { tier, at: Date.now() }; save(); }
  };
  qShow(); qSel.onchange = (e) => { autoTier = null; engine.setQuality(e.target.value); save(); };
  setInterval(() => { if (!$('panel').hidden) $('q-info').textContent = engine.stats.size ? engine.stats.size.replace('x', ' × ') + (engine.stats.fps ? ' · ' + engine.stats.fps + ' frames a second' : '') : ''; }, 500);
  $('c-titles').checked = saved.titles !== false; document.body.classList.toggle('notitles', !$('c-titles').checked);
  $('c-titles').onchange = (e) => { document.body.classList.toggle('notitles', !e.target.checked); save(); };
  $('c-caption').checked = saved.caption !== false; $('c-caption').onchange = () => save();   // the strip at the foot of saved pictures
  const kinds = [...new Set(defs.map((d) => d.category))].filter((c) => c !== 'test');
  // 'calm only' sits with the kinds: it keeps the journey to worlds whose camera moves gently from arrival to exit, with the
  // steady camera and no surprise rides. It combines with the kinds; it is offered only when the collection has measured worlds.
  if (defs.some((d) => d.calm)) {
    const b = document.createElement('button'); b.textContent = 'calm only'; b.className = 'calm'; b.title = 'Only worlds with gentle camera motion, for anyone who gets queasy. Also turns on the steady camera.';
    b.classList.toggle('on', engine.settings.calmOnly); b.setAttribute('aria-pressed', String(engine.settings.calmOnly));
    b.onclick = () => {
      engine.settings.calmOnly = !engine.settings.calmOnly; b.classList.toggle('on', engine.settings.calmOnly); b.setAttribute('aria-pressed', String(engine.settings.calmOnly));
      toast(engine.settings.calmOnly ? 'Calm worlds only: ' + defs.filter((d) => d.calm).length + ' gentle worlds, steady camera' : 'All worlds again', 3200);
      // a journey from the list passes over its worlds that are not calm from here on (its count on the title card stays)
      if (engine.settings.calmOnly && journey && Array.isArray(engine.opts.tour)) { engine.opts.tour = engine.opts.tour.filter((id) => defs.some((d) => d.id === id && d.calm)); if (engine.tourDef && !engine.tourDef.calm) engine.tourDef = null; }
      showCamera(); save(); engine.refresh();
    };
    $('kinds').appendChild(b);
  }
  for (const c of kinds) {
    // the chip of the kind 'screen' (film, television and music worlds) reads "media"
    const b = document.createElement('button'); b.textContent = c === 'screen' ? 'media' : c; b.dataset.kind = c; const on = () => !engine.settings.kinds || !engine.settings.kinds.size || engine.settings.kinds.has(c);
    b.classList.toggle('on', on());
    b.onclick = () => {
      const set = engine.settings.kinds && engine.settings.kinds.size ? engine.settings.kinds : new Set(kinds);
      if (set.has(c) && set.size > 1) set.delete(c); else set.add(c);
      engine.settings.kinds = set.size === kinds.length ? null : set;
      for (const x of $('kinds').children) if (x.dataset.kind) x.classList.toggle('on', !engine.settings.kinds || engine.settings.kinds.has(x.dataset.kind));
      save(); engine.refresh();
    };
    $('kinds').appendChild(b);
  }
  const more = () => { $('panel').hidden = !$('panel').hidden; if (!$('panel').hidden) shareMenu(false); wake(); };
  // in a narrow window the two sliders move from the bar into the options panel (a phone held sideways counts: with
  // the heart and the share button the bar and both sliders no longer fit beside each other under about 900 px)
  const narrow = matchMedia('(max-width: 900px)');
  const place = () => {
    const ls = $('l-speed'), lt = $('l-strange'), panel = $('panel'), hud = $('hud');
    if (narrow.matches) { panel.prepend(ls, lt); ls.classList.add('slide'); lt.classList.add('slide'); }
    else { hud.insertBefore(ls, bSound); hud.insertBefore(lt, bSound); ls.classList.remove('slide'); lt.classList.remove('slide'); }
  };
  place(); if (narrow.addEventListener) narrow.addEventListener('change', place); else narrow.addListener(place);
  $('b-more').onclick = more;
  // A short performance report to send back when the journey stalls: R, or the button at the foot of the hidden index.
  // It says what the engine was doing each time a frame came late; it holds nothing about the viewer but the
  // graphics card's name, the window size and the browser.
  const report = async () => {
    let gpu = ''; try { gpu = gpuName(engine.renderer); } catch (e) {}
    const text = engine.perf.report([`Portals ${new URL(import.meta.url).searchParams.get('v') || 'dev'} ${new Date().toISOString()}`,
      `${gpu} | ${engine.stats.size} | quality ${engine.tier} (${engine.qualitySetting}) | ${engine.count} worlds | ${navigator.userAgent}`]);
    window.__report = text;
    try { await navigator.clipboard.writeText(text); toast('Performance report copied: paste it to whoever asked', 4200); }
    catch (e) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = 'portals-performance.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 8000); toast('Performance report saved as a file', 4200); }
  };
  // the About: its words are a draft, so its two buttons (the foot of the options, the gallery's head) show only when share.js says it is ready or the address asks (?about=1)
  const aboutOn = ABOUT_READY || (q.has('about') && q.get('about') !== '0'), about = () => openAbout(WORLDS.length);
  if (aboutOn) { $('about-row').hidden = false; $('b-about').onclick = about; }
  // the index of worlds (its button on the bar, I, #worlds, or hold the options button). It marks the worlds seen (not on a journey link, which keeps no memory) and the favourites.
  const atlas = setupAtlas({ worlds: WORLDS, suites: SUITES, engine, setPaused, optionsButton: $('b-more'), onReport: () => report(), seen, hearts, onHeart: (id) => heart(id, false), onAbout: aboutOn ? about : null });
  $('b-worlds').onclick = () => atlas.toggle();   // the gallery button on the bar
  $('b-next').onclick = () => engine.skip();
  const photo = () => {
    engine.frame(0);
    // the caption: the frame is copied to a 2D canvas now, in the task that drew it, and a quiet strip with the world's
    // name and the site's address is drawn at its foot (src/ui/share.js). The antechamber has no name: the address alone.
    const W = engine.cur; let pic = $('view');
    if ($('c-caption').checked && W) { try { pic = captioned(pic, W.def.antechamber ? '' : shownTitle(W), byline(W.def, W.world)); } catch (e) { pic = $('view'); } }
    pic.toBlob(async (blob) => {
      if (!blob) return; const name = engine.cur.def.antechamber ? 'portals.png' : 'portals-' + engine.cur.def.id + '-' + engine.count + '.png';
      // on a phone the share sheet is how a picture reaches the photo library; elsewhere it is a download
      if (coarse && navigator.canShare) { try { const file = new File([blob], name, { type: 'image/png' }); if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Portals' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; } }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 8000); toast('Picture saved');
    }, 'image/png');
  };
  $('b-photo').onclick = photo;
  // ---------- sharing ----------
  // one button on the bar opens a small menu: a link to the world on screen, a link that replays this journey, a picture
  const bShare = $('b-share'), share = $('share');
  function shareMenu(open) { share.hidden = !open; bShare.setAttribute('aria-expanded', String(open)); if (open) { $('panel').hidden = true; wake(); } }
  bShare.onclick = () => shareMenu(share.hidden);
  $('sh-world').onclick = async () => {
    shareMenu(false);
    // the world's own address (its small page carries its name and picture for a preview); the antechamber has none: the site's
    const d = engine.cur.def, named = canHeart(d), name = named ? shownTitle(engine.cur) : 'Portals', url = worldLink(named ? d.id : '');
    // on a phone the share sheet is the way to send a link; elsewhere it is copied
    if (coarse && navigator.share) { try { await navigator.share({ title: named ? name + ' · Portals' : 'Portals', url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    toast((await copyText(url)) ? (named ? 'Link to ' + name + ' copied' : 'Link copied') : 'Could not copy the link');
  };
  $('b-link').onclick = async () => {
    // the worlds flown so far, in order; pressed in the antechamber, before any world, the link opens on the world waiting behind its portal
    shareMenu(false); const n = flown.length, ids = n ? flown : engine.next && canHeart(engine.next.def) ? [engine.next.def.id] : [];
    toast((await copyText(journeyLink(engine, ids))) ? (n > 1 ? 'Journey link copied: these ' + n + ' worlds, then onward' : 'Journey link copied') : 'Could not copy the link', 3200);
  };
  $('sh-photo').onclick = () => { shareMenu(false); photo(); };
  // a link that named its opening world has done its work: out of the address bar with it, so that the address copied
  // later (or a reload) does not hand on a world long gone by. A journey link keeps its session and its worlds.
  if (!plain && /[?&]start=/.test(location.search)) { try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])start=[^&]*&?/, '$1').replace(/[?&]$/, '') + location.hash); } catch (e) {} }
  // the controls show on any movement and fade when left alone (they wait longer while the options are open)
  let idle = 0;
  const rest = () => { clearTimeout(idle); document.body.classList.remove('active'); document.body.classList.add('idle'); shareMenu(false); };
  function wake() { document.body.classList.add('active'); document.body.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(rest, q.has('idle') ? num('idle') * 1000 : !$('panel').hidden ? 25000 : !share.hidden ? 12000 : coarse ? 5000 : 3200); }
  // on a touch screen a tap on the picture shows the controls and a second tap puts them away
  let tapWasActive = false;
  $('view').addEventListener('pointerdown', (e) => { tapWasActive = e.pointerType !== 'mouse' && document.body.classList.contains('active'); shareMenu(false); });   // a press on the picture puts the share menu away
  $('view').addEventListener('click', () => { if (tapWasActive) { tapWasActive = false; $('panel').hidden = true; rest(); } });
  ['mousemove', 'pointerdown', 'keydown', 'touchstart', 'input', 'change'].forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
  if (engine.mobile && window.innerHeight > window.innerWidth * 1.15) setTimeout(() => { if (window.innerHeight > window.innerWidth * 1.15 && !engine.gentle) toast('Turn your phone sideways for a wider view', 5200); }, 6000);
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;   // the browser's own shortcuts (reload, copy) are not ours
    if (atlas.isOpen()) { if (e.key === 'Escape' || e.key === 'i' || e.key === 'I') atlas.close(); return; }
    // a key pressed in a menu, a box or a text field is that control's own: space ticks the box, a letter finds an entry in
    // the menu. A slider keeps only its arrows, so that space still pauses after the pace has been dragged.
    const t = e.target, tag = t && t.tagName, slider = tag === 'INPUT' && t.type === 'range';
    if (e.key === 'Escape') { if (!share.hidden) shareMenu(false); else if (!$('panel').hidden) more(); if (t && t.blur && t !== document.body) t.blur(); return; }
    if (tag === 'SELECT' || tag === 'TEXTAREA' || (tag === 'INPUT' && !slider) || (slider && e.code.startsWith('Arrow'))) return;
    if (tag === 'BUTTON' && t.closest('#panel, #share') && (e.code === 'Space' || e.key === 'Enter')) return;   // space presses the focused button of the options, it does not pause as well
    if (e.key === 'i' || e.key === 'I') atlas.open();
    else if (e.key === 'h' || e.key === 'H') heart();
    else if (e.code === 'Space') { e.preventDefault(); setPaused(!engine.settings.paused); }
    else if (e.key === 'f' || e.key === 'F') full();
    else if (e.key === 's' || e.key === 'S') sound();
    else if (e.key === 'p' || e.key === 'P') photo();
    else if (e.key === 'o' || e.key === 'O') more();
    else if (e.key === 'c' || e.key === 'C' || e.key === 'g' || e.key === 'G') setCamera(engine.settings.camera === 'steady' ? 'sweeping' : 'steady', true);
    else if (e.key === 'r' || e.key === 'R') report();
    else if (e.code === 'ArrowRight') engine.skip();
    else if (e.key === 'd' || e.key === 'D') { const d = $('debug'); d.style.display = d.style.display === 'block' ? 'none' : 'block'; }
  });
  if (q.has('debug')) $('debug').style.display = 'block';
  setInterval(() => { const d = $('debug'); if (d.style.display === 'block') d.textContent = JSON.stringify(engine.stats, null, 1); window.__stats = engine.stats; }, 500);
}

boot().catch((e) => { console.error(e); window.__shotError = String(e && e.stack || e); document.getElementById('veil-sub').textContent = 'something went wrong starting up'; });
