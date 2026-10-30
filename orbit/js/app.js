// Pocket Orbit — the page: the system drawn on a canvas, the flight controls,
// the mission card and telemetry, the autopilot's "Show me", and a little sound.
import * as S from './sim.js';
import { createPilot, fly } from './pilot.js';

const $ = (id) => document.getElementById(id);
const canvas = $('sky');
const ctx = canvas.getContext('2d');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const TIME_SCALE = 0.5;             // simulation time per real second at 1×
const WARPS = [1, 3, 10, 30, 100];
const SECONDS_PER_UNIT = S.KM / (S.MS / 1000);   // 800 km at 2 km/s: 400 s
const TRAIL_MAX = 700;

/* ── Saved progress ── */
function load(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch (e) { return fallback; }
}
function save(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* private mode */ }
}
const best = load('orbit.best', {});    // { levelId: { stars, dv } }
let soundOn = load('orbit.sound', true);

/* ── State ── */
const st = {
    level: null,
    game: null,
    demo: null,             // the autopilot, while "Show me" is flying
    caption: '',
    warpIndex: 0,
    warpTo: null,           // sim time a "warp to" is heading for
    shownWarp: 1,
    paused: false,
    fine: false,
    shift: false,
    held: [],               // burn directions held, most recent last
    pick: null,             // a target picked by tapping, overriding the goal's
    trail: [],
    pred: null,
    cam: { x: 0, y: 0, scale: 80, blend: 0, mode: 'auto' },
    zoom: 1,
    tip: 0,
    resultTimer: 0,
};

/* ── Formatting ── */
const fmt = (n) => Math.round(n).toLocaleString('en');
const km = (u) => `${fmt(u * S.KM)} km`;
const mps = (u) => `${fmt(u * S.MS)} m/s`;
function clock(t) {
    const s = t * SECONDS_PER_UNIT;
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return `${h}h ${String(m).padStart(2, '0')}m`;
}
const starText = (n) => `${'★'.repeat(n)}<span class="dim">${'★'.repeat(3 - n)}</span>`;

/* ── Targets ── */
function target() {
    const g = st.game;
    if (st.pick) return st.pick;
    return S.goalTarget(g);
}
const targetName = (t) => (t === 'moon' ? 'Moon' : t.name);
const targetColor = (t) => (t === 'moon' ? '#cbd5e1' : t.color);

/* ── Levels ── */
function unlocked(i) {
    const L = S.LEVELS[i];
    if (i === 0 || L.free) return true;
    return !!best[S.LEVELS[i - 1].id];
}

function renderLevels() {
    const box = $('levels');
    box.textContent = '';
    S.LEVELS.forEach((L, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lv';
        const open = unlocked(i);
        b.disabled = !open;
        const got = best[L.id] ? best[L.id].stars : 0;
        const num = L.free ? '∞' : String(i + 1);
        b.innerHTML = `<span class="lv-top"><span class="lv-num">${open ? num : '🔒'}</span><span class="lv-name">${L.name}</span>`
            + (L.free ? '' : `<span class="lv-stars" aria-label="${got} of 3 stars">${starText(got)}</span>`) + '</span>'
            + `<span class="lv-blurb">${open ? L.blurb : 'Finish the mission before to open this one.'}</span>`;
        b.addEventListener('click', () => { closeLevels(); startLevel(L); });
        box.appendChild(b);
    });
    const total = Object.values(best).reduce((n, b) => n + (b.stars || 0), 0);
    $('total').textContent = `★ ${total}/${(S.LEVELS.length - 1) * 3}`;
}

function openLevels() {
    renderLevels();
    $('levels-overlay').hidden = false;
    $('levels').querySelector('.lv:not(:disabled)')?.focus();
}
function closeLevels() { $('levels-overlay').hidden = true; }

function startLevel(L, { demo = false } = {}) {
    st.level = L;
    st.game = S.createGame(L);
    st.demo = demo ? createPilot() : null;
    st.caption = '';
    st.warpIndex = 0;
    st.warpTo = null;
    st.paused = false;
    st.held.length = 0;
    st.pick = null;
    st.trail.length = 0;
    st.tip = 0;
    st.zoom = 1;
    clearTimeout(st.resultTimer);
    $('result').hidden = true;
    const i = S.LEVELS.indexOf(L);
    $('m-num').textContent = L.free ? 'Sandbox' : `Mission ${i + 1}`;
    $('m-name').textContent = L.name;
    renderGoals();
    renderFuelTicks();
    renderTip();
    try {
        const url = new URL(location.href);
        url.searchParams.set('level', L.id);
        url.searchParams.delete('demo');
        history.replaceState(null, '', url);
    } catch (e) { /* file:// in some browsers */ }
    syncButtons();
}

function renderGoals() {
    const g = st.game;
    const ul = $('m-goals');
    ul.textContent = '';
    const goals = g.level.goals;
    if (!goals.length) {
        const li = document.createElement('li');
        li.className = 'now';
        const n = g.world.stations.length;
        li.textContent = `Stations visited: ${g.visited.size} of ${n}`;
        ul.appendChild(li);
        return;
    }
    goals.forEach((G, i) => {
        const li = document.createElement('li');
        li.textContent = G.text;
        li.className = i < g.goalIndex ? 'done' : i === g.goalIndex ? 'now' : '';
        ul.appendChild(li);
    });
}

function renderFuelTicks() {
    const L = st.level;
    const bar = $('fuel-bar');
    bar.querySelectorAll('.tick').forEach((t) => t.remove());
    if (!Number.isFinite(L.dv)) return;
    // The bar is fuel left; a tick sits where the fuel left would mean you had
    // spent that star's allowance, so the bar running past a tick loses it.
    [[L.stars[0], '★★'], [L.stars[1], '★★★']].forEach(([dv, label]) => {
        const t = document.createElement('div');
        t.className = 'tick';
        t.style.left = `${((L.dv - dv) / L.dv) * 100}%`;
        t.title = `${label} if you spend under ${mps(dv)}`;
        t.innerHTML = `<span>${label}</span>`;
        bar.appendChild(t);
    });
}

function renderTip() {
    const tips = st.level.tips;
    const tip = $('m-tip');
    tip.textContent = tips[st.tip % tips.length];
    if (tips.length > 1) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = `tip ${(st.tip % tips.length) + 1}/${tips.length} ›`;
        b.addEventListener('click', () => { st.tip++; renderTip(); });
        tip.appendChild(b);
    }
}

/* ── The loop ── */
let lastTs = 0;
function frame(ts) {
    const dt = Math.min(0.05, Math.max(0, (ts - lastTs) / 1000));
    lastTs = ts;
    update(dt);
    draw(ts / 1000);
    hud(ts);
    requestAnimationFrame(frame);
}

function playerCmd() {
    if (!st.held.length) return null;
    return { dir: st.held[st.held.length - 1], fine: st.fine || st.shift, target: target() };
}

function update(dt) {
    const g = st.game;
    const overlay = !$('levels-overlay').hidden;
    if (st.paused || overlay || g.status !== 'flying') {
        sound.thrust(false);
        return;
    }
    const simDt = dt * TIME_SCALE;
    st.shownWarp = 1;
    if (st.demo) {
        const r = fly(st.demo, g);
        st.caption = r.caption;
        if (r.cmd) S.step(g, simDt, r.cmd);
        else stepWarping(g, simDt, Number.isFinite(r.wakeAt) ? r.wakeAt : null, 1.2);
    } else {
        const cmd = playerCmd();
        if (cmd) {
            st.warpIndex = 0;
            st.warpTo = null;
            S.step(g, simDt, cmd);
        } else if (st.warpTo != null) {
            if (st.warpTo - g.t <= 1e-3) st.warpTo = null;
            else stepWarping(g, simDt, st.warpTo, 0.8);
        } else {
            st.shownWarp = WARPS[st.warpIndex];
            S.step(g, simDt * st.shownWarp);
        }
    }
    sound.thrust(!!g.burning, (st.demo ? false : st.fine || st.shift));
    if (!g.docked) {
        const last = st.trail[st.trail.length - 1];
        if (!last || Math.hypot(last.x - g.ship.x, last.y - g.ship.y) > 0.004) {
            st.trail.push({ x: g.ship.x, y: g.ship.y });
            if (st.trail.length > TRAIL_MAX) st.trail.shift();
        }
    }
    for (const e of g.events) onEvent(e);
    g.events.length = 0;
}

/** Coast towards `until` as fast as is comfortable, slowing so it takes about `ease` real seconds to land. */
function stepWarping(g, simDt, until, ease) {
    if (until == null) { S.step(g, simDt); return; }
    const left = until - g.t;
    if (left <= 0) return;
    const w = Math.max(1, Math.min(WARPS[WARPS.length - 1], left / (TIME_SCALE * ease)));
    st.shownWarp = w;
    S.step(g, Math.min(left, simDt * w));
}

function onEvent(e) {
    const g = st.game;
    if (e.type === 'dock') {
        const s = S.station(g, e.station);
        toast(`Docked at ${s.name}`, 'good');
        sound.chime([660, 880]);
        if (st.pick === s) st.pick = null;
        renderGoals();
    } else if (e.type === 'undock') {
        toast('Undocked');
    } else if (e.type === 'goal') {
        if (g.status !== 'won') toast(`✓ ${e.text}`, 'good');
        if (S.goal(g)?.type === 'dock') st.pick = null;
        renderGoals();
    } else if (e.type === 'won') {
        sound.chime([523, 659, 784, 1047]);
        renderGoals();
        finish(true, e.stars);
    } else if (e.type === 'empty') {
        toast('Out of fuel', 'warn');
    } else if (e.type === 'crash' || e.type === 'moon' || e.type === 'escape') {
        sound.crash();
        finish(false);
    }
}

function finish(won, stars = 0) {
    const g = st.game, L = st.level;
    st.held.length = 0;
    syncButtons();
    if (won && !st.demo) {
        const prev = best[L.id];
        if (!prev || stars > prev.stars || (stars === prev.stars && g.dvUsed < prev.dv)) {
            best[L.id] = { stars, dv: g.dvUsed };
            save('orbit.best', best);
        }
    }
    clearTimeout(st.resultTimer);
    st.resultTimer = setTimeout(() => showResult(won, stars), won ? 900 : 1400);
}

function showResult(won, stars) {
    const g = st.game, L = st.level;
    const i = S.LEVELS.indexOf(L);
    const next = S.LEVELS[i + 1];
    $('res-mission').textContent = L.free ? 'Sandbox' : `Mission ${i + 1} · ${L.name}`;
    $('res-stars').innerHTML = won ? starText(stars) : '';
    const fails = { crash: 'Burned up on reentry', moon: 'Hit the Moon', escape: 'Lost to deep space' };
    $('res-title').textContent = won ? (st.demo ? 'That’s how it’s done' : 'Mission complete') : fails[g.status];
    const lines = [];
    if (won) {
        lines.push(`Δv spent <b>${mps(g.dvUsed)}</b> of ${mps(L.dv)}`);
        lines.push(`★★ under ${mps(L.stars[0])} · ★★★ under ${mps(L.stars[1])}`);
        lines.push(`Mission time <b>${clock(g.t)}</b>`);
        if (st.demo) lines.push('Flown by the autopilot. Your turn.');
        else if (best[L.id]) lines.push(`Your best: <b>${mps(best[L.id].dv)}</b>`);
    } else {
        const hints = {
            crash: 'Keep periapsis above the haze: the air starts at 96 km.',
            moon: 'Aim for a periapsis around the Moon, not at it. Watch the ghost.',
            escape: 'Past escape speed the path never comes back. Burn retrograde sooner.',
        };
        lines.push(hints[g.status]);
    }
    $('res-lines').innerHTML = lines.map((l) => `<div>${l}</div>`).join('');
    $('res-next').hidden = !won || !next || st.demo;
    $('res-retry').textContent = st.demo ? '▶ Fly it yourself' : '↺ Try again';
    $('result').hidden = false;
    (won && next && !st.demo ? $('res-next') : $('res-retry')).focus();
}

/* ── Toasts ── */
function toast(text, kind = '') {
    const box = $('toasts');
    const el = document.createElement('div');
    el.className = `toast tape ${kind}`;
    el.textContent = text;
    box.appendChild(el);
    setTimeout(() => el.remove(), 2700);
    while (box.children.length > 3) box.firstChild.remove();
}

/* ── Camera ── */
/** The part of the screen the panels leave free, which the camera centres on. */
function viewBox() {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    let top = 56;
    let bottom = H - ($('controls').offsetHeight || 0);
    // On a narrow screen the panels span the width, so keep clear of them.
    const card = $('mission').getBoundingClientRect();
    if (card.width > W * 0.5) top = Math.max(top, card.bottom);
    const tel = $('telemetry').getBoundingClientRect();
    if (tel.height && tel.width > W * 0.5) bottom = Math.min(bottom, tel.top);
    const cy = (top + bottom) / 2;
    const half = Math.max(80, Math.min(W / 2, (bottom - top) / 2) - 14);
    return { W, H, cx: W / 2, cy, half };
}

/**
 * Where the camera wants to be: `sys` is the wide view (the planet and every
 * orbit that matters, or the Moon's neighbourhood while you are inside its
 * pull), and `ship` says whether to close in on the ship instead, which Auto
 * does near a station so docking is something you can see.
 */
function wanted() {
    const g = st.game;
    const s = g.ship;
    const tgt = target();
    let near = false;
    if (tgt && tgt !== 'moon') {
        const T = S.stationState(g.world, tgt, g.t);
        near = Math.hypot(T.x - s.x, T.y - s.y) < 0.45;
    }
    const mode = st.cam.mode;
    const ship = mode === 'ship' || (mode === 'auto' && near);
    const ref = S.reference(g);
    if (ref.body === 'moon' && mode === 'auto') return { ship, sys: { x: ref.x, y: ref.y, radius: S.SOI * 1.15 } };
    const o = S.elements(s.x, s.y, s.vx, s.vy);
    let R = Math.max(1.6, Math.hypot(s.x, s.y));
    if (o.bound) R = Math.max(R, Math.min(o.ra, S.MOON.a + 2));
    for (const x of g.world.stations) if (x.parent !== 'moon') R = Math.max(R, x.a);
    if (g.world.moon && (tgt === 'moon' || (o.bound && o.ra > 4) || !o.bound || mode === 'system')) R = Math.max(R, S.MOON.a + S.SOI * 0.6);
    return { ship, sys: { x: 0, y: 0, radius: R * 1.1 } };
}

const SHIP_VIEW = 0.42;     // radius of the close-up, in planet radii

function updateCamera(dt) {
    const g = st.game;
    const want = wanted();
    const { half } = viewBox();
    const k = reduceMotion.matches ? 1 : 1 - Math.exp(-dt * 4);
    const c = st.cam;
    const ease = (v, to) => (v == null ? to : v + (to - v) * k);
    c.blend = ease(c.blend, want.ship ? 1 : 0);
    c.fx = ease(c.fx, want.sys.x);
    c.fy = ease(c.fy, want.sys.y);
    c.logSys = ease(c.logSys, Math.log(half / want.sys.radius));
    c.logScale = ease(c.logScale, Math.log(half / (want.ship ? SHIP_VIEW : want.sys.radius)));
    const sSys = Math.exp(c.logSys) * st.zoom;
    c.scale = Math.exp(c.logScale) * st.zoom;
    // Slide the ship from where the wide view shows it to the middle of the
    // screen as the blend runs, so it never leaves the screen on the way in.
    const f = (1 - c.blend) * sSys / c.scale;
    c.x = g.ship.x - (g.ship.x - c.fx) * f;
    c.y = g.ship.y - (g.ship.y - c.fy) * f;
}

/* ── Drawing ── */
let vb = viewBox();
const sx = (x) => vb.cx + (x - st.cam.x) * st.cam.scale;
const sy = (y) => vb.cy - (y - st.cam.y) * st.cam.scale;

function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    document.documentElement.style.setProperty('--controls-h', `${$('controls').offsetHeight}px`);
}

// A fixed sky: the same stars every visit.
const starsBg = (() => {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    return Array.from({ length: 260 }, () => ({ x: rnd(), y: rnd(), r: rnd() * 1.1 + 0.2, a: rnd() * 0.6 + 0.2, tw: rnd() * 6 }));
})();

// The planet is Earth from above the North Pole: NASA's Blue Marble,
// reprojected (see README), with a cloud layer that turns a little faster.
function image(src) {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    return img;
}
const earthImg = image('img/earth.webp');
const cloudImg = image('img/clouds.webp');
const ready = (img) => img.complete && img.naturalWidth > 0;
const craters = [[0.3, 0.2, 0.18], [-0.35, -0.1, 0.22], [0.05, -0.45, 0.13], [-0.1, 0.45, 0.1], [0.5, -0.25, 0.09]];
const SUN = { x: -0.8, y: 0.6 };

let lastDraw = 0;
function draw(now) {
    const dt = Math.min(0.1, now - lastDraw || 0);
    lastDraw = now;
    vb = viewBox();
    updateCamera(dt);
    const g = st.game;
    const W = vb.W, H = vb.H;
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.5, H * 0.5, Math.max(W, H));
    bg.addColorStop(0, '#15140f');
    bg.addColorStop(1, '#060605');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    for (const s of starsBg) {
        const tw = reduceMotion.matches ? 1 : 0.75 + 0.25 * Math.sin(now * 1.3 + s.tw);
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = '#efe4c8';
        ctx.fillRect(s.x * W, s.y * H, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    const tgt = target();
    st.pred = S.predict(g, tgt, { maxSteps: 4000 });

    drawOrbits(g, tgt);
    drawPlanet(g);
    if (g.world.moon) drawMoon(g);
    drawTrail();
    drawPrediction(g);
    drawApses(g);
    drawClosest(g, tgt);
    for (const s of g.world.stations) drawStation(g, s, s === tgt);
    if (tgt === 'moon') drawBrackets(S.moonState(g.world, g.t), Math.max(12, S.MOON.radius * st.cam.scale + 6), '#cbd5e1');
    drawDocking(g, tgt);
    drawShip(g, now);
}

function circle(x, y, r) {
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), r, 0, Math.PI * 2);
}

function drawOrbits(g, tgt) {
    ctx.lineWidth = 1;
    if (g.world.moon) {
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.12)';
        circle(0, 0, S.MOON.a * st.cam.scale);
        ctx.stroke();
    }
    for (const s of g.world.stations) {
        const centre = s.parent === 'moon' ? S.moonState(g.world, g.t) : { x: 0, y: 0 };
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = s === tgt ? 0.4 : 0.16;
        ctx.setLineDash([4, 5]);
        circle(centre.x, centre.y, s.a * st.cam.scale);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
}

function drawPlanet(g) {
    const r = S.R_PLANET * st.cam.scale;
    const x = sx(0), y = sy(0);
    if (x + r * 1.3 < 0 || x - r * 1.3 > vb.W || y + r * 1.3 < 0 || y - r * 1.3 > vb.H) return;
    const atm = S.R_ATM * st.cam.scale;
    const halo = ctx.createRadialGradient(x, y, r * 0.98, x, y, atm * 1.05);
    halo.addColorStop(0, 'rgba(125, 211, 252, 0.45)');
    halo.addColorStop(0.7, 'rgba(56, 189, 248, 0.12)');
    halo.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, atm * 1.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    const sea = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    sea.addColorStop(0, '#1d4ed8');
    sea.addColorStop(1, '#172554');
    ctx.fillStyle = sea;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    // Anticlockwise seen from the pole, as the real one turns.
    const spin = g.t * 0.05;
    const layer = (img, turn, alpha) => {
        if (!ready(img)) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-turn);
        ctx.globalAlpha = alpha;
        ctx.drawImage(img, -r, -r, r * 2, r * 2);
        ctx.restore();
    };
    layer(earthImg, spin, 1);
    layer(cloudImg, spin * 1.15 + 0.6, 0.8);
    const limb = ctx.createRadialGradient(x, y, r * 0.55, x, y, r);
    limb.addColorStop(0, 'rgba(2, 6, 23, 0)');
    limb.addColorStop(0.85, 'rgba(2, 6, 23, 0.18)');
    limb.addColorStop(1, 'rgba(56, 189, 248, 0.35)');
    ctx.fillStyle = limb;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    const night = ctx.createLinearGradient(x + SUN.x * r, y - SUN.y * r, x - SUN.x * r, y + SUN.y * r);
    night.addColorStop(0, 'rgba(2, 6, 23, 0)');
    night.addColorStop(0.45, 'rgba(2, 6, 23, 0.05)');
    night.addColorStop(0.75, 'rgba(2, 6, 23, 0.6)');
    night.addColorStop(1, 'rgba(2, 6, 23, 0.82)');
    ctx.fillStyle = night;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
}

function drawMoon(g) {
    const m = S.moonState(g.world, g.t);
    const r = Math.max(6, S.MOON.radius * st.cam.scale);
    const x = sx(m.x), y = sy(m.y);
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.18)';
    ctx.setLineDash([2, 6]);
    circle(m.x, m.y, S.SOI * st.cam.scale);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = '#6b7280';
    for (const [cx, cy, cr] of craters) {
        ctx.beginPath();
        ctx.arc(x + cx * r, y - cy * r, cr * r, 0, Math.PI * 2);
        ctx.fill();
    }
    const night = ctx.createLinearGradient(x + SUN.x * r, y - SUN.y * r, x - SUN.x * r, y + SUN.y * r);
    night.addColorStop(0.4, 'rgba(2, 6, 23, 0)');
    night.addColorStop(1, 'rgba(2, 6, 23, 0.75)');
    ctx.fillStyle = night;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
    if (r < 10) label('Moon', x, y + r + 12, '#cbd5e1');
}

function drawTrail() {
    const t = st.trail;
    if (t.length < 2) return;
    ctx.lineWidth = 1.5;
    const chunk = 40;
    for (let i = 0; i < t.length - 1; i += chunk) {
        ctx.strokeStyle = `rgba(214, 196, 150, ${0.05 + 0.3 * (i / t.length)})`;
        ctx.beginPath();
        ctx.moveTo(sx(t[i].x), sy(t[i].y));
        for (let j = i + 1; j <= Math.min(i + chunk, t.length - 1); j++) ctx.lineTo(sx(t[j].x), sy(t[j].y));
        ctx.stroke();
    }
}

function drawPrediction(g) {
    const p = st.pred;
    if (!p) return;
    const pts = p.pts;
    const n = pts.length / 2;
    if (n < 2) return;
    const bad = p.end === 'crash' || p.end === 'moon';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    const chunk = Math.max(8, Math.ceil(n / 30));
    for (let i = 0; i < n - 1; i += chunk) {
        const f = i / n;
        const a = 0.95 - 0.6 * f;
        ctx.strokeStyle = bad && f > 0.6 ? `rgba(229, 83, 61, ${a})` : `rgba(243, 222, 170, ${a})`;
        ctx.beginPath();
        ctx.moveTo(sx(pts[i * 2]), sy(pts[i * 2 + 1]));
        for (let j = i + 1; j <= Math.min(i + chunk, n - 1); j++) ctx.lineTo(sx(pts[j * 2]), sy(pts[j * 2 + 1]));
        ctx.stroke();
    }
    ctx.setLineDash([]);
    if (p.end) {
        const x = sx(pts[pts.length - 2]), y = sy(pts[pts.length - 1]);
        const text = { crash: 'Reentry', moon: 'Impact', escape: 'Escape' }[p.end];
        const col = p.end === 'escape' ? '#ffb53f' : '#e5533d';
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5);
        ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5);
        ctx.stroke();
        label(text, x, y - 10, col);
    }
}

function drawApses(g) {
    if (g.docked) return;
    const o = S.shipOrbit(g);
    if (o.e < 0.005) return;
    const ref = o.ref;
    const body = ref.body === 'moon' ? S.MOON.radius : S.R_PLANET;
    const mark = (r, ang, name) => {
        const x = sx(ref.x + Math.cos(ang) * r), y = sy(ref.y + Math.sin(ang) * r);
        ctx.fillStyle = '#f3e7c9';
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        label(`${name} ${km(r - body)}`, x, y - 9, '#ffb53f');
    };
    if (o.rp > body * 0.2) mark(o.rp, o.argPe, 'Pe');
    if (o.bound && o.ra < (ref.body === 'moon' ? S.SOI * 1.2 : S.ESCAPE_R)) mark(o.ra, o.argPe + Math.PI, 'Ap');
}

function drawClosest(g, tgt) {
    const c = st.pred && st.pred.closest;
    if (!c || !tgt) return;
    const T = S.targetState(g.world, tgt, g.t);
    if (Math.hypot(T.x - g.ship.x, T.y - g.ship.y) < 0.3 || c.t - g.t < 0.2) return;
    const col = targetColor(tgt);
    const ax = sx(c.ship.x), ay = sy(c.ship.y), bx = sx(c.target.x), by = sy(c.target.y);
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.85;
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#f3e7c9';
    ctx.beginPath();
    ctx.arc(ax, ay, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = col;
    const r = tgt === 'moon' ? Math.max(6, S.MOON.radius * st.cam.scale) : 6;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    label(`closest ${km(c.d)}`, (ax + bx) / 2, (ay + by) / 2 - 8, col);
}

function drawStation(g, s, isTarget) {
    const S0 = S.stationState(g.world, s, g.t);
    const x = sx(S0.x), y = sy(S0.y);
    if (x < -40 || y < -40 || x > vb.W + 40 || y > vb.H + 40) return;
    const big = st.cam.scale > 600;
    const k = big ? 1.8 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.atan2(S0.y, S0.x));
    ctx.fillStyle = s.color;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.5;
    ctx.fillRect(-3 * k, -3 * k, 6 * k, 6 * k);
    ctx.globalAlpha = 0.8;
    ctx.fillRect(-1 * k, -11 * k, 2 * k, 6 * k);
    ctx.fillRect(-1 * k, 5 * k, 2 * k, 6 * k);
    ctx.globalAlpha = 1;
    ctx.restore();
    if (g.docked === s.id) {
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 10 * k, 0, Math.PI * 2);
        ctx.stroke();
    }
    if (isTarget) drawBrackets(S0, 13 * k, s.color);
    label(s.name, x, y + 20 * k, s.color);
}

function drawBrackets(p, r, col) {
    const x = sx(p.x), y = sy(p.y);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    const l = r * 0.45;
    for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        ctx.beginPath();
        ctx.moveTo(x + dx * r, y + dy * (r - l));
        ctx.lineTo(x + dx * r, y + dy * r);
        ctx.lineTo(x + dx * (r - l), y + dy * r);
        ctx.stroke();
    }
}

function drawDocking(g, tgt) {
    if (!tgt || tgt === 'moon' || g.docked) return;
    const T = S.stationState(g.world, tgt, g.t);
    const d = Math.hypot(T.x - g.ship.x, T.y - g.ship.y);
    if (d > 0.45) return;
    const rel = Math.hypot(g.ship.vx - T.vx, g.ship.vy - T.vy);
    const ok = rel < S.DOCK_SPEED;
    ctx.strokeStyle = ok ? 'rgba(74, 222, 128, 0.8)' : 'rgba(251, 191, 36, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 4]);
    circle(T.x, T.y, S.DOCK_DIST * st.cam.scale);
    ctx.stroke();
    ctx.setLineDash([]);
    // Velocity relative to the station: where you are drifting, and how fast.
    const vx = g.ship.vx - T.vx, vy = g.ship.vy - T.vy;
    if (rel > 1e-4) {
        const len = Math.min(90, 12 + rel / S.DOCK_SPEED * 18);
        const ux = vx / rel, uy = -vy / rel;
        const x0 = sx(g.ship.x), y0 = sy(g.ship.y);
        const x1 = x0 + ux * len, y1 = y0 + uy * len;
        ctx.strokeStyle = ok ? '#4ade80' : '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x1 - ux * 7 - uy * 4, y1 - uy * 7 + ux * 4);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - ux * 7 + uy * 4, y1 - uy * 7 - ux * 4);
        ctx.stroke();
    }
}

function drawShip(g, now) {
    if (g.status === 'crash' || g.status === 'moon') return;
    const x = sx(g.ship.x), y = sy(g.ship.y);
    const ref = S.reference(g);
    let dx = g.ship.vx - ref.vx, dy = g.ship.vy - ref.vy;
    if (g.burning) { dx = g.burning.x; dy = g.burning.y; }
    const a = Math.atan2(-dy, dx);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    if (g.burning) {
        const f = 9 + (reduceMotion.matches ? 2 : Math.sin(now * 40) * 2 + 2);
        const flame = ctx.createLinearGradient(-5, 0, -5 - f, 0);
        flame.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
        flame.addColorStop(1, 'rgba(249, 115, 22, 0)');
        ctx.fillStyle = flame;
        ctx.beginPath();
        ctx.moveTo(-5, -3);
        ctx.lineTo(-5 - f, 0);
        ctx.lineTo(-5, 3);
        ctx.fill();
    }
    ctx.fillStyle = '#e8dcc0';
    ctx.strokeStyle = '#d23b2f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-5, -5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function label(text, x, y, col) {
    ctx.font = '12px "Share Tech Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(6, 6, 5, 0.9)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = col;
    ctx.fillText(text, x, y);
}

/* ── HUD ── */
let lastHud = 0;
function hud(ts) {
    if (ts - lastHud < 100) return;
    lastHud = ts;
    const g = st.game, L = st.level;
    const o = S.shipOrbit(g);
    const body = o.ref.body === 'moon' ? S.MOON.radius : S.R_PLANET;
    $('t-clock').textContent = clock(g.t);
    $('t-ref').textContent = g.docked ? `docked: ${S.station(g, g.docked).name}` : o.ref.body === 'moon' ? 'the Moon' : 'the planet';
    $('t-alt').textContent = km(o.r - body);
    $('t-speed').textContent = mps(Math.hypot(g.ship.vx - o.ref.vx, g.ship.vy - o.ref.vy));
    $('t-ap').textContent = o.bound ? km(o.ra - body) : 'escaping';
    $('t-pe').textContent = km(o.rp - body);
    const tgt = target();
    document.querySelectorAll('.tgt-row').forEach((e) => { e.hidden = !tgt; });
    if (tgt) {
        const T = S.targetState(g.world, tgt, g.t);
        $('t-name').textContent = targetName(tgt);
        $('t-dist').textContent = km(Math.hypot(T.x - g.ship.x, T.y - g.ship.y));
        const rel = Math.hypot(g.ship.vx - T.vx, g.ship.vy - T.vy);
        const dk = $('t-dockable');
        dk.textContent = mps(rel);
        dk.className = tgt === 'moon' ? '' : rel < S.DOCK_SPEED ? 'ok' : 'no';
        const c = st.pred && st.pred.closest;
        $('t-closest').textContent = c ? `${km(c.d)} in ${clock(c.t - g.t)}` : '—';
    }
    // Fuel
    const fin = Number.isFinite(L.dv);
    $('fuel-left').textContent = fin ? mps(S.fuelLeft(g)) : `∞ · spent ${mps(g.dvUsed)}`;
    $('fuel-used').style.width = fin ? `${Math.min(100, (g.dvUsed / L.dv) * 100)}%` : '0%';
    $('fuel').classList.toggle('spent', fin && g.dvUsed > L.stars[0]);
    // Warp
    $('warp').textContent = st.paused ? 'paused' : `${st.shownWarp >= 10 ? Math.round(st.shownWarp) : Math.round(st.shownWarp * 10) / 10}×`;
    // Caption
    const cap = $('caption');
    let text = '';
    if (st.demo && g.status === 'flying') text = st.caption || '…';
    else if (g.status === 'flying' && !st.paused) text = coach(g, o, tgt);
    cap.hidden = !text;
    cap.textContent = text;
    cap.classList.toggle('demo', !!st.demo);
    document.documentElement.style.setProperty('--tele-h', `${$('telemetry').offsetHeight}px`);
    if (!L.goals.length) renderGoals();
    syncTargetKeys(tgt);
}

/** One line of advice for the moment, when there is something worth saying. */
function coach(g, o, tgt) {
    if (g.docked && S.goal(g)) return 'Docked. Any burn undocks you.';
    if (st.pred && st.pred.end === 'crash' && !g.burning) return 'Your path dips into the atmosphere.';
    if (st.pred && st.pred.end === 'escape' && !g.burning) return 'On an escape path: burn retrograde to come back.';
    if (tgt && tgt !== 'moon') {
        const T = S.stationState(g.world, tgt, g.t);
        const d = Math.hypot(T.x - g.ship.x, T.y - g.ship.y);
        const rel = Math.hypot(g.ship.vx - T.vx, g.ship.vy - T.vy);
        if (d < S.DOCK_DIST * 1.5 && rel >= S.DOCK_SPEED) return `Too fast to dock: Match to slow below ${mps(S.DOCK_SPEED)}`;
        if (d < 0.45 && rel > 0.05) return 'Close: Match first to stop drifting, then Approach.';
        if (d < 0.45) return 'Approach in short taps, then Match before you arrive.';
    }
    if (g.empty) return 'Out of fuel. Restart, or let it coast.';
    return '';
}

/* ── Controls ── */
function syncButtons() {
    const flying = st.game.status === 'flying';
    document.querySelectorAll('.key[data-burn]').forEach((b) => {
        b.classList.toggle('held', st.held.includes(b.dataset.burn));
        if (!flying) b.classList.remove('held');
    });
    $('fine').setAttribute('aria-pressed', String(st.fine));
    $('pause').setAttribute('aria-pressed', String(st.paused));
    $('demo').textContent = st.demo ? '■ Take over' : '▶ Show me';
    $('view').textContent = `View: ${{ auto: 'Auto', ship: 'Ship', system: 'System' }[st.cam.mode]}`;
    $('sound').textContent = soundOn ? '🔊' : '🔈';
    $('sound').setAttribute('aria-pressed', String(soundOn));
}

function syncTargetKeys(tgt) {
    const has = !!tgt;
    document.querySelectorAll('.key[data-burn="match"], .key[data-burn="approach"]').forEach((b) => { b.disabled = !has; });
    document.querySelector('.key[data-warpto="meet"]').disabled = !(st.pred && st.pred.closest);
}

function press(dir) {
    if (st.game.status !== 'flying') return;
    if (st.demo) takeOver();
    sound.wake();
    if (!st.held.includes(dir)) st.held.push(dir);
    st.paused = false;
    syncButtons();
}
function release(dir) {
    const i = st.held.indexOf(dir);
    if (i >= 0) st.held.splice(i, 1);
    syncButtons();
}

function takeOver() {
    st.demo = null;
    st.caption = '';
    toast('You have control');
    syncButtons();
}

document.querySelectorAll('.key[data-burn]').forEach((b) => {
    const dir = b.dataset.burn;
    b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        b.setPointerCapture?.(e.pointerId);
        press(dir);
    });
    const up = () => release(dir);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    // Keyboard users: Enter or Space on a focused button gives a short burn.
    b.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); e.stopPropagation(); press(dir); }
    });
    b.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); release(dir); }
    });
});

function setWarp(i) {
    st.warpIndex = Math.max(0, Math.min(WARPS.length - 1, i));
    st.warpTo = null;
    st.paused = false;
    syncButtons();
}

function warpTo(kind) {
    const g = st.game;
    if (g.status !== 'flying') return;
    if (st.demo) takeOver();
    let t = null;
    if (kind === 'meet') {
        const c = st.pred && st.pred.closest;
        if (c) t = c.t;
    } else {
        const o = S.shipOrbit(g);
        const dt = kind === 'ap' ? o.tAp : o.tPe;
        if (dt != null && o.e > 0.005) t = g.t + dt;
    }
    if (t == null) {
        toast(kind === 'meet' ? 'No target to meet' : `No ${kind === 'ap' ? 'apoapsis' : 'periapsis'} to warp to`, 'warn');
        return;
    }
    // Stop a little short, so there is time to start a burn centred on it.
    st.warpTo = Math.max(g.t, t - 0.3);
    st.paused = false;
    syncButtons();
}

$('slower').addEventListener('click', () => setWarp(st.warpIndex - 1));
$('faster').addEventListener('click', () => setWarp(st.warpIndex + 1));
document.querySelectorAll('.key[data-warpto]').forEach((b) => b.addEventListener('click', () => warpTo(b.dataset.warpto)));
$('fine').addEventListener('click', () => { st.fine = !st.fine; syncButtons(); });
$('pause').addEventListener('click', () => { st.paused = !st.paused; syncButtons(); });
$('restart').addEventListener('click', () => startLevel(st.level));
$('demo').addEventListener('click', () => {
    sound.wake();
    if (st.demo) takeOver();
    else startLevel(st.level, { demo: true });
});
$('view').addEventListener('click', () => cycleView());
$('m-fold').addEventListener('click', () => {
    const m = $('mission');
    const folded = m.classList.toggle('folded');
    $('m-fold').textContent = folded ? '▸' : '▾';
    $('m-fold').setAttribute('aria-expanded', String(!folded));
});
$('sound').addEventListener('click', () => { soundOn = !soundOn; save('orbit.sound', soundOn); if (!soundOn) sound.thrust(false); syncButtons(); });
$('open-levels').addEventListener('click', openLevels);
$('close-levels').addEventListener('click', closeLevels);
$('levels-overlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeLevels(); });
$('res-retry').addEventListener('click', () => startLevel(st.level));
$('res-levels').addEventListener('click', () => { $('result').hidden = true; openLevels(); });
$('res-next').addEventListener('click', () => {
    const next = S.LEVELS[S.LEVELS.indexOf(st.level) + 1];
    if (next) startLevel(next);
});

function cycleView() {
    const order = ['auto', 'ship', 'system'];
    st.cam.mode = order[(order.indexOf(st.cam.mode) + 1) % order.length];
    st.zoom = 1;
    syncButtons();
}

const KEYS = { w: 'pro', arrowup: 'pro', s: 'retro', arrowdown: 'retro', a: 'in', arrowleft: 'in', d: 'out', arrowright: 'out', m: 'match', f: 'approach' };
window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'shift') { st.shift = true; return; }
    if (k === 'escape') { closeLevels(); return; }
    if (!$('levels-overlay').hidden || !$('result').hidden) return;
    if (KEYS[k]) {
        e.preventDefault();
        if (!e.repeat) press(KEYS[k]);
        return;
    }
    if (e.repeat) return;
    if (k === ' ') { e.preventDefault(); st.paused = !st.paused; syncButtons(); }
    else if (k === ',' || k === '-') setWarp(st.warpIndex - 1);
    else if (k === '.' || k === '+' || k === '=') setWarp(st.warpIndex + 1);
    else if (k === 'z') warpTo('ap');
    else if (k === 'x') warpTo('pe');
    else if (k === 'c') warpTo('meet');
    else if (k === 'v') cycleView();
    else if (k === 'r') startLevel(st.level);
    else if (k === 'h') $('demo').click();
    else if (k === 'l') openLevels();
    else if (k === 'n') $('sound').click();
});
window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'shift') st.shift = false;
    if (KEYS[k]) release(KEYS[k]);
});
window.addEventListener('blur', () => { st.held.length = 0; st.shift = false; syncButtons(); });

/* ── Canvas: tap a station to target it, wheel or pinch to zoom ── */
const pointers = new Map();
let pinch = null;
let tapStart = null;

canvas.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture?.(e.pointerId);
    if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: st.zoom };
        tapStart = null;
    } else {
        tapStart = { x: e.clientX, y: e.clientY };
    }
});
canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        st.zoom = clampZoom(pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d);
    }
});
const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (tapStart && Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y) < 8 && e.type === 'pointerup') tap(e.clientX, e.clientY);
    tapStart = null;
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    st.zoom = clampZoom(st.zoom * Math.exp(-e.deltaY * 0.0015));
}, { passive: false });
const clampZoom = (z) => Math.max(0.2, Math.min(8, z));

function tap(x, y) {
    const g = st.game;
    let bestHit = null, bestD = 28;
    const consider = (t, p) => {
        const d = Math.hypot(sx(p.x) - x, sy(p.y) - y);
        if (d < bestD) { bestD = d; bestHit = t; }
    };
    for (const s of g.world.stations) consider(s, S.stationState(g.world, s, g.t));
    if (g.world.moon) {
        const m = S.moonState(g.world, g.t);
        const r = S.MOON.radius * st.cam.scale;
        const d = Math.hypot(sx(m.x) - x, sy(m.y) - y);
        if (d < Math.max(bestD, r + 6)) { bestHit = 'moon'; bestD = d; }
    }
    if (!bestHit) return;
    const goalT = S.goalTarget(g);
    st.pick = bestHit === goalT || bestHit === st.pick ? null : bestHit;
    if (st.pick || bestHit === goalT) toast(`Target: ${targetName(st.pick || goalT)}`);
}

/* ── Sound: a hiss for the engine and a few tones ── */
const sound = (() => {
    let ac = null, gain = null, filter = null;
    function wake() {
        if (!soundOn) return null;
        if (ac) { if (ac.state === 'suspended') ac.resume(); return ac; }
        try {
            ac = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { return null; }
        const len = ac.sampleRate * 2;
        const buf = ac.createBuffer(1, len, ac.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        filter = ac.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        gain = ac.createGain();
        gain.gain.value = 0;
        src.connect(filter).connect(gain).connect(ac.destination);
        src.start();
        return ac;
    }
    let on = false;
    function thrust(burning, fine = false) {
        if (!ac || !gain) return;
        const want = burning && soundOn;
        if (want === on && !want) return;
        on = want;
        gain.gain.setTargetAtTime(want ? (fine ? 0.04 : 0.12) : 0, ac.currentTime, 0.06);
        filter.frequency.setTargetAtTime(fine ? 350 : 650, ac.currentTime, 0.1);
    }
    function chime(freqs) {
        if (!soundOn || !wake()) return;
        freqs.forEach((f, i) => {
            const o = ac.createOscillator();
            const g = ac.createGain();
            o.type = 'sine';
            o.frequency.value = f;
            const t = ac.currentTime + i * 0.09;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.12, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
            o.connect(g).connect(ac.destination);
            o.start(t);
            o.stop(t + 0.65);
        });
    }
    function crash() {
        if (!soundOn || !wake()) return;
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = 'sawtooth';
        const t = ac.currentTime;
        o.frequency.setValueAtTime(220, t);
        o.frequency.exponentialRampToValueAtTime(40, t + 0.8);
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
        o.connect(g).connect(ac.destination);
        o.start(t);
        o.stop(t + 0.95);
    }
    return { wake, thrust, chime, crash };
})();
window.addEventListener('pointerdown', () => sound.wake(), { once: true });

/* ── Start ── */
window.addEventListener('resize', resize);
if (window.matchMedia('(max-width: 700px)').matches) $('m-fold').click();
const params = new URLSearchParams(location.search);
// A link opens its mission even if it is still locked here: someone sent it.
const firstOpen = S.LEVELS.find((L) => L.id === params.get('level')) || null;
startLevel(firstOpen || S.LEVELS[0], { demo: !!firstOpen && params.get('demo') === '1' });
resize();
renderLevels();
if (!firstOpen) openLevels();
requestAnimationFrame((ts) => { lastTs = ts; lastDraw = ts / 1000; requestAnimationFrame(frame); });
