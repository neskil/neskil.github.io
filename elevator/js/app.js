// Tiny Elevator Tycoon — the page: the building drawn on a canvas, the panel
// you program the cars from, and the day's report card.
import {
    LEVELS, RULES, STEP, defaultRules, createSim, step, finished, score, runDay,
} from './sim.js';

const $ = (id) => document.getElementById(id);
const canvas = $('building');
const ctx = canvas.getContext('2d');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const CAR_NAMES = ['A', 'B', 'C'];
const CAR_COLOURS = ['#f59e0b', '#38bdf8', '#a78bfa'];

/* ── Saved progress ── */
function load(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch (e) { return fallback; }
}
function save(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* private mode */ }
}
const best = load('elevator.best', {});        // { levelId: { stars, avgWait } }
const savedRules = load('elevator.rules', {}); // { levelId: rules }

/* ── State ── */
let level = LEVELS[0];
let rules = null;
let sim = null;
let running = false;
let speed = 4;
let acc = 0;
const walkers = [];     // people walking off after arriving, for show
const puffs = [];       // people giving up and taking the stairs

function rulesFor(L) {
    const r = savedRules[L.id];
    if (r && r.cars && r.cars.length === L.cars) return JSON.parse(JSON.stringify(r));
    return defaultRules(L);
}

/* ── Level picker ── */
function renderLevels() {
    const box = $('levels');
    box.textContent = '';
    LEVELS.forEach((L, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'level';
        b.setAttribute('aria-pressed', String(L === level));
        const got = best[L.id] ? best[L.id].stars : 0;
        const prevStars = i === 0 ? 1 : (best[LEVELS[i - 1].id] ? best[LEVELS[i - 1].id].stars : 0);
        const locked = i > 0 && prevStars === 0;
        b.disabled = locked;
        b.title = locked ? 'Get a star on the level before to open this one' : L.blurb;
        b.innerHTML = `<span class="lv-num">${i + 1}</span><span class="lv-name">${L.name}</span><span class="lv-stars" aria-label="${got} of 3 stars">${'★'.repeat(got)}<span class="dim">${'★'.repeat(3 - got)}</span></span>`;
        if (locked) b.querySelector('.lv-num').textContent = '🔒';
        b.addEventListener('click', () => pickLevel(L));
        box.appendChild(b);
    });
    const total = Object.values(best).reduce((n, b) => n + (b.stars || 0), 0);
    $('total').textContent = `★ ${total} / ${LEVELS.length * 3}`;
}

function pickLevel(L) {
    level = L;
    rules = rulesFor(L);
    $('lv-title').textContent = L.name;
    $('lv-blurb').textContent = L.blurb;
    $('lv-facts').textContent = `${L.floors} floors · ${L.cars} ${L.cars === 1 ? 'car' : 'cars'} of ${L.capacity} · patience ${L.patience}s · ★★ under ${L.stars[0]}s · ★★★ under ${L.stars[1]}s with nobody lost`;
    renderLevels();
    renderProgram();
    reset();
}

/* ── The program panel ── */
function segmented(name, options, value, onPick, disabled) {
    const wrap = document.createElement('div');
    wrap.className = 'seg';
    wrap.setAttribute('role', 'radiogroup');
    wrap.setAttribute('aria-label', name);
    for (const [id, label, help] of options) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.title = help;
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(id === value));
        b.disabled = disabled;
        b.addEventListener('click', () => onPick(id));
        wrap.appendChild(b);
    }
    return wrap;
}

function renderProgram() {
    const box = $('program');
    box.textContent = '';
    const locked = running || (sim && sim.t > 0 && !finished(sim));
    rules.cars.forEach((car, i) => {
        const row = document.createElement('div');
        row.className = 'car-rules';
        const head = document.createElement('div');
        head.className = 'car-head';
        head.innerHTML = `<span class="car-chip" style="--c:${CAR_COLOURS[i]}">${CAR_NAMES[i]}</span> Car ${CAR_NAMES[i]}`;
        row.appendChild(head);
        const set = (key) => (v) => { car[key] = v; changed(); };
        const fields = [['Goes to', 'strategy'], ['Serves', 'zone'], ['When idle', 'park']];
        for (const [label, key] of fields) {
            // A one-car building has nothing to split into zones.
            if (key === 'zone' && level.cars === 1) continue;
            const f = document.createElement('div');
            f.className = 'field';
            const l = document.createElement('span');
            l.className = 'field-label';
            l.textContent = label;
            f.append(l, segmented(label, RULES[key], car[key], set(key), locked));
            row.appendChild(f);
        }
        box.appendChild(row);
    });
    if (level.cars > 1) {
        const f = document.createElement('div');
        f.className = 'field share';
        const l = document.createElement('span');
        l.className = 'field-label';
        l.textContent = 'Cars share calls';
        f.append(l, segmented('Cars share calls', [
            ['off', 'Off', 'Every car chases every call: they can arrive in a bunch.'],
            ['on', 'On', 'A call is claimed by the first car to head for it; the others leave it be.'],
        ], rules.share ? 'on' : 'off', (v) => { rules.share = v === 'on'; changed(); }, locked));
        box.appendChild(f);
    }
    $('locked-hint').hidden = !locked;
}

function changed() {
    savedRules[level.id] = rules;
    save('elevator.rules', savedRules);
    reset();
}

/* ── Running a day ── */
function reset() {
    running = false;
    sim = createSim(level, rules);
    walkers.length = 0;
    puffs.length = 0;
    acc = 0;
    $('result').hidden = true;
    updateButtons();
    renderProgram();
    updateStats();
}

function updateButtons() {
    $('run').textContent = running ? '⏸ Pause' : (sim && sim.t > 0 && !finished(sim) ? '▶ Resume' : '▶ Run the day');
    document.querySelectorAll('[data-speed]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.speed === speed)));
}

$('run').addEventListener('click', () => {
    if (sim && finished(sim) && sim.t > 0) reset();
    running = !running;
    updateButtons();
    renderProgram();
});
$('reset').addEventListener('click', reset);
$('instant').addEventListener('click', () => {
    // Same rules, same arrivals: the report card without the wait.
    reset();
    const r = runDay(level, rules);
    showResult(r);
});
document.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => { speed = +b.dataset.speed; updateButtons(); }));

function updateStats() {
    if (!sim) return;
    const r = score(sim);
    const riding = sim.cars.reduce((n, c) => n + c.riders.length, 0);
    $('st-time').textContent = fmt(sim.t);
    $('st-waiting').textContent = sim.waiting.length;
    $('st-riding').textContent = riding;
    $('st-served').textContent = sim.done.length;
    $('st-lost').textContent = sim.gaveUp.length;
    $('st-wait').textContent = sim.done.length ? r.avgWait.toFixed(1) + 's' : '—';
}

function fmt(t) {
    const s = Math.floor(t);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function showResult(r) {
    running = false;
    updateButtons();
    renderProgram();
    const prev = best[level.id];
    const improved = !prev || r.stars > prev.stars || (r.stars === prev.stars && r.avgWait < prev.avgWait);
    if (improved) {
        best[level.id] = { stars: r.stars, avgWait: r.avgWait };
        save('elevator.best', best);
    }
    $('res-stars').innerHTML = '★'.repeat(r.stars) + `<span class="dim">${'★'.repeat(3 - r.stars)}</span>`;
    $('res-title').textContent = r.stars === 3 ? 'Flawless.' : r.stars === 2 ? 'Smooth day.' : r.stars === 1 ? 'Everyone got there. Mostly.' : 'The stairs were busy today.';
    const lines = [
        ['Average wait', r.avgWait.toFixed(1) + 's', r.avgWait <= level.stars[1] ? 'good' : r.avgWait <= level.stars[0] ? 'ok' : 'bad'],
        ['Longest wait', r.maxWait.toFixed(1) + 's', ''],
        ['Average trip, door to door', r.avgTrip.toFixed(1) + 's', ''],
        ['Took the stairs', `${r.gaveUp} of ${r.people}`, r.gaveUp === 0 ? 'good' : r.gaveUp / r.people <= level.maxGaveUp ? 'ok' : 'bad'],
        ['Floors travelled', String(r.floorsTravelled), ''],
    ];
    $('res-lines').innerHTML = lines.map(([k, v, c]) => `<div class="res-line ${c}"><span>${k}</span><b>${v}</b></div>`).join('');
    $('res-hint').textContent = hint(r);
    const next = LEVELS[LEVELS.indexOf(level) + 1];
    $('res-next').hidden = !next || r.stars === 0;
    $('result').hidden = false;
    renderLevels();
}

/* A nudge, not the answer: what the numbers suggest trying next. */
function hint(r) {
    if (r.stars === 3) return improvedText();
    if (r.gaveUp > 0 && rules.cars.every(c => c.strategy === 'oldest')) return 'People are giving up while the cars run errands in arrival order. Try a strategy that stops for people on the way.';
    if (level.cars > 1 && !rules.share) return 'Two cars answering the same call is one car wasted. Try letting them share calls.';
    if (rules.cars.every(c => c.park === 'stay') && (level.traffic === 'morning' || level.traffic === 'party')) return 'Most people start in the lobby today. Where should an idle car wait?';
    if (r.maxWait > level.patience * 0.75) return 'Someone waited a very long time. Nearest-call is quick on average but can leave a far floor waiting; a sweep is fairer.';
    if (level.cars > 1 && rules.cars.every(c => c.zone === 'all')) return 'Try giving one car the upper floors as an express.';
    return 'Small changes matter: try one rule at a time and watch the average.';
}
function improvedText() {
    return 'Three stars. The arrivals are the same every run, so that was all your program.';
}

$('res-again').addEventListener('click', reset);
$('res-next').addEventListener('click', () => {
    const next = LEVELS[LEVELS.indexOf(level) + 1];
    if (next) pickLevel(next);
});

/* ── Drawing ── */
let W = 0, H = 0, dpr = 1;
function fit() {
    const box = canvas.parentElement.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = box.width;
    H = box.height;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
}
new ResizeObserver(fit).observe(canvas.parentElement);
fit();

function layout() {
    const F = level.floors;
    // On a phone the stats sit in a strip along the bottom; leave room for it.
    const top = 30, bottom = H - (W < 640 ? 58 : 14);
    const fh = (bottom - top) / F;
    const lobbyW = Math.min(150, W * 0.3);
    const shaftW = Math.min(64, (W - lobbyW - 120) / level.cars - 10);
    const shaftsX = lobbyW + 28;
    return {
        F, fh, top, bottom,
        floorY: (f) => bottom - (f + 1) * fh,  // top edge of floor f
        lobbyW, shaftW, shaftsX,
        shaftX: (i) => shaftsX + i * (shaftW + 12),
        exitX: shaftsX + level.cars * (shaftW + 12) + 8,
    };
}

function person(x, y, s, colour, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(x, y - s * 1.55, s * 0.42, 0, 6.283);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x - s * 0.45, y - s * 1.05, s * 0.9, s * 1.05, s * 0.3);
    ctx.fill();
    ctx.globalAlpha = 1;
}

function moodColour(wait) {
    // Green while patient, through amber, to red as they are about to give up.
    const k = Math.min(1, wait / level.patience);
    return `hsl(${Math.round(130 - 130 * k)}, 70%, ${58 - k * 6}%)`;
}

function draw() {
    const g = layout();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Floors.
    for (let f = 0; f < g.F; f++) {
        const y = g.floorY(f);
        ctx.fillStyle = f % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.045)';
        ctx.fillRect(0, y, W, g.fh);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(0, y + g.fh - 1, W, 1);
        ctx.fillStyle = '#64748b';
        ctx.font = `600 ${Math.min(12, g.fh * 0.4)}px Outfit, sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillText(f === 0 ? 'L' : String(f), 8, y + g.fh / 2);
    }

    // Call buttons beside the shafts.
    for (let f = 0; f < g.F; f++) {
        const y = g.floorY(f) + g.fh / 2;
        const up = sim.waiting.some(p => p.from === f && p.to > f);
        const down = sim.waiting.some(p => p.from === f && p.to < f);
        const bx = g.shaftsX - 14;
        ctx.fillStyle = up ? '#fbbf24' : 'rgba(255,255,255,0.12)';
        ctx.beginPath(); ctx.moveTo(bx, y - 2); ctx.lineTo(bx + 4, y - 7); ctx.lineTo(bx + 8, y - 2); ctx.fill();
        ctx.fillStyle = down ? '#fbbf24' : 'rgba(255,255,255,0.12)';
        ctx.beginPath(); ctx.moveTo(bx, y + 2); ctx.lineTo(bx + 4, y + 7); ctx.lineTo(bx + 8, y + 2); ctx.fill();
    }

    // People waiting, in a queue out from the shafts.
    const s = Math.max(4, Math.min(8, g.fh * 0.32));
    const byFloor = new Map();
    for (const p of sim.waiting) {
        if (!byFloor.has(p.from)) byFloor.set(p.from, []);
        byFloor.get(p.from).push(p);
    }
    for (const [f, ps] of byFloor) {
        const base = g.floorY(f) + g.fh - 3;
        const room = Math.floor((g.lobbyW - 26) / (s * 1.25));
        ps.forEach((p, k) => {
            if (k >= room) return;
            const x = g.shaftsX - 26 - k * s * 1.25;
            person(x, base, s, moodColour(sim.t - p.t));
        });
        if (ps.length > room) {
            ctx.fillStyle = '#fca5a5';
            ctx.font = `600 ${Math.min(11, g.fh * 0.38)}px Outfit, sans-serif`;
            ctx.fillText(`+${ps.length - room}`, 22, base - s);
        }
    }

    // Shafts and cars.
    sim.cars.forEach((c, i) => {
        const x = g.shaftX(i);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(x, g.top, g.shaftW, g.bottom - g.top);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.strokeRect(x + 0.5, g.top + 0.5, g.shaftW - 1, g.bottom - g.top - 1);
        // Cable.
        const cy = g.bottom - (c.pos + 1) * g.fh;
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(x + g.shaftW / 2 - 0.5, g.top, 1, cy - g.top + 2);
        // Car body.
        const pad = 3;
        const ch = g.fh - pad * 2;
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = CAR_COLOURS[i];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x + pad, cy + pad, g.shaftW - pad * 2, ch, 4);
        ctx.fill();
        ctx.stroke();
        // Riders as dots.
        const per = Math.max(1, Math.floor((g.shaftW - 12) / 7));
        c.riders.forEach((p, k) => {
            const rx = x + 8 + (k % per) * 7;
            const ry = cy + pad + ch - 6 - Math.floor(k / per) * 7;
            ctx.fillStyle = CAR_COLOURS[i];
            ctx.beginPath();
            ctx.arc(rx, ry, 2.4, 0, 6.283);
            ctx.fill();
        });
        // Doors: two panels that slide apart while open.
        const open = c.state === 'doors' ? Math.min(1, (c.timer > 0.6 ? 1 : c.timer / 0.6)) : 0;
        const dw = (g.shaftW - pad * 2) / 2 * (1 - open);
        ctx.fillStyle = 'rgba(148,163,184,0.35)';
        ctx.fillRect(x + pad, cy + pad, dw, ch);
        ctx.fillRect(x + g.shaftW - pad - dw, cy + pad, dw, ch);
        // Name and load.
        ctx.fillStyle = CAR_COLOURS[i];
        ctx.font = `700 11px Outfit, sans-serif`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(CAR_NAMES[i], x + 2, g.top - 8);
        ctx.fillStyle = '#94a3b8';
        ctx.font = `500 10px Inter, sans-serif`;
        ctx.fillText(`${c.riders.length}/${level.capacity}`, x + 14, g.top - 8);
    });

    // Arrivals walking off to the right; give-ups puffing off up the stairs.
    for (let k = walkers.length - 1; k >= 0; k--) {
        const w = walkers[k];
        w.x += 40 * w.dt;
        w.a -= 0.6 * w.dt;
        w.dt = 0;
        if (w.a <= 0) { walkers.splice(k, 1); continue; }
        person(g.exitX + w.x, g.floorY(w.floor) + g.fh - 3, s, '#86efac', w.a);
    }
    ctx.font = `${Math.round(s * 2.2)}px sans-serif`;
    ctx.textBaseline = 'middle';
    for (let k = puffs.length - 1; k >= 0; k--) {
        const p = puffs[k];
        p.y -= 18 * p.dt;
        p.a -= 0.5 * p.dt;
        p.dt = 0;
        if (p.a <= 0) { puffs.splice(k, 1); continue; }
        ctx.globalAlpha = p.a;
        ctx.fillText('😤', 22 + p.x, g.floorY(p.floor) + g.fh / 2 + p.y);
        ctx.globalAlpha = 1;
    }
}

/* ── Loop ── */
let last = performance.now();
function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (running && sim) {
        acc += dt * speed;
        let n = 0;
        while (acc >= STEP && n < 400) {
            step(sim);
            acc -= STEP;
            n++;
            for (const e of sim.events) {
                if (e.kind === 'arrive') walkers.push({ floor: e.floor, x: 0, a: 1, dt: 0 });
                if (e.kind === 'stairs') puffs.push({ floor: e.floor, x: Math.random() * 30, y: 0, a: 1, dt: 0 });
            }
            sim.events.length = 0;
            if (finished(sim) || sim.t > level.day * 3) {
                showResult(score(sim));
                break;
            }
        }
        updateStats();
    }
    const visualDt = reduceMotion.matches ? dt * 4 : dt;
    walkers.forEach(w => { w.dt = visualDt; });
    puffs.forEach(p => { p.dt = visualDt; });
    draw();
    requestAnimationFrame(loop);
}

/* ── Start ── */
const first = LEVELS.find(L => !best[L.id]) || LEVELS[0];
const idx = LEVELS.indexOf(first);
// Never start on a level that is still locked.
pickLevel(idx > 0 && !(best[LEVELS[idx - 1].id] || {}).stars ? LEVELS[0] : first);
requestAnimationFrame(loop);

// ?run starts the day straight away — for screenshots.
const q = new URLSearchParams(location.search);
if (q.has('level')) { const L = LEVELS.find(x => x.id === q.get('level')); if (L) pickLevel(L); }
if (q.has('rules')) {
    // ?rules=collective.all.lobby,nearest.high.stay;share — a program in the URL.
    const [cars, share] = q.get('rules').split(';');
    const parsed = cars.split(',').map(c => { const [strategy, zone, park] = c.split('.'); return { strategy, zone, park }; });
    if (parsed.length === level.cars) { rules = { share: share === 'share', cars: parsed }; renderProgram(); reset(); }
}
if (q.has('run')) { speed = +q.get('run') || 4; running = true; updateButtons(); renderProgram(); }
