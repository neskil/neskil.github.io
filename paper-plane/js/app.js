// Paper Plane Glider — the page: fold it, throw it, watch it go down the office.
import { DEFAULT_FOLD, ROOM, DT, makePlane, fly, dailyChallenge, inBin } from './flight.js';

const $ = (id) => document.getElementById(id);
const canvas = $('room');
const ctx = canvas.getContext('2d');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const MAX_SPEED = 12;
const SAMPLE = DT * 6;   // seconds between recorded path points

/* ── Saved bits ── */
function load(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch (e) { return fallback; }
}
function save(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* private mode */ }
}

const state = {
    fold: { ...DEFAULT_FOLD, ...load('paperplane.fold', {}) },
    aim: { angle: 8, speed: 7, ...load('paperplane.aim', {}) },
    mode: 'distance',
    best: load('paperplane.best', null),          // { distance, path }
    daily: load('paperplane.daily', null),        // { key, error, binned, distance }
    challenge: dailyChallenge(new Date()),
    flight: null,       // the throw being played back
    playT: 0,
    last: null,         // the last finished throw
    dragging: null,
    camX: -1.6,
};
if (!state.daily || state.daily.key !== state.challenge.key) state.daily = { key: state.challenge.key, error: null, binned: false, distance: null };

/* ── The fold panel ── */
const shapeIn = $('shape'), noseIn = $('nose'), flapsIn = $('flaps');
shapeIn.value = state.fold.shape;
noseIn.value = state.fold.nose;
flapsIn.value = state.fold.flaps;

function readFold() {
    state.fold = { shape: +shapeIn.value, nose: +noseIn.value, flaps: +flapsIn.value };
    save('paperplane.fold', state.fold);
    describeFold();
    drawFold();
}
[shapeIn, noseIn, flapsIn].forEach(i => i.addEventListener('input', readFold));

function describeFold() {
    const f = state.fold;
    $('shape-val').textContent = f.shape < 0.25 ? 'Broad glider' : f.shape > 0.75 ? 'Narrow dart' : 'Classic';
    const g = (f.nose * 0.9).toFixed(1);
    $('nose-val').textContent = f.nose === 0 ? 'None' : `${g} g` + (f.nose >= 1 ? ` · ${Math.floor(f.nose)} clip${Math.floor(f.nose) > 1 ? 's' : ''}` : ' · a bit of tape');
    const mm = Math.round(f.flaps * 8);
    $('flaps-val').textContent = mm === 0 ? 'Flat' : mm > 0 ? `${mm} mm up` : `${-mm} mm down`;
}

/* Top-down sketch of the fold: the outline follows the wing shape, the clips
   sit on the nose and the flaps tilt at the trailing edge. */
function drawFold() {
    const svg = $('fold');
    const p = makePlane(state.fold);
    const L = 150;
    const span = Math.min(170, Math.sqrt(p.area * p.aspect) * 520);
    const sweep = 1 - state.fold.shape;      // broad wing: tips reach further forward
    const tipFront = 30 + (1 - sweep) * 70;  // y of the wingtip's leading edge
    const cx = 100, top = 20, tail = top + L;
    const pts = [
        [cx, top],
        [cx + span / 2, top + tipFront],
        [cx + span / 2, tail - 6],
        [cx + 7, tail],
        [cx, tail - 4],
        [cx - 7, tail],
        [cx - span / 2, tail - 6],
        [cx - span / 2, top + tipFront],
    ];
    const flapY = tail - 6;
    const flapW = Math.min(30, span / 2 - 14);
    const tilt = state.fold.flaps * 7;
    const clips = [];
    const n = Math.ceil(state.fold.nose - 1e-6);
    for (let k = 0; k < n; k++) {
        const frac = Math.min(1, state.fold.nose - k);
        clips.push(`<rect x="${cx - 5}" y="${top + 8 + k * 9}" width="10" height="${6 * frac + 1}" rx="2" fill="none" stroke="#94a3b8" stroke-width="1.6" opacity="${0.4 + 0.6 * frac}"/>`);
    }
    svg.innerHTML = `
        <polygon points="${pts.map(q => q.join(',')).join(' ')}" fill="#f8fafc" fill-opacity="0.92" stroke="#cbd5e1" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M${cx} ${top} L${cx} ${tail - 4}" stroke="#94a3b8" stroke-width="1"/>
        <path d="M${cx} ${top + 4} L${cx + span / 4} ${tail - 6} M${cx} ${top + 4} L${cx - span / 4} ${tail - 6}" stroke="#cbd5e1" stroke-width="0.8" stroke-dasharray="3 3"/>
        ${[-1, 1].map(s => `<rect x="${s > 0 ? cx + span / 2 - flapW - 4 : cx - span / 2 + 4}" y="${flapY - 7}" width="${flapW}" height="7"
            fill="${state.fold.flaps > 0.05 ? '#38bdf8' : state.fold.flaps < -0.05 ? '#f472b6' : '#e2e8f0'}" fill-opacity="0.55"
            transform="skewY(${s * tilt})" transform-origin="${cx} ${flapY}"/>`).join('')}
        ${clips.join('')}
        <text x="${cx}" y="${tail + 22}" text-anchor="middle" fill="#64748b" font-size="11" font-family="Inter, sans-serif">top view · nose up</text>`;
}

/* ── Modes ── */
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
function setMode(m) {
    state.mode = m;
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    state.camX = -1.6;
    updateBoard();
}

function world() {
    return state.mode === 'daily' ? { fans: state.challenge.fans } : null;
}

/* ── Scoreboard ── */
function updateBoard() {
    const r = state.last;
    $('last').textContent = r ? `${r.distance.toFixed(1)} m` : '—';
    $('air').textContent = r ? `${r.time.toFixed(1)} s` : '—';
    if (state.mode === 'distance') {
        $('goal-label').textContent = 'Longest throw';
        $('goal').textContent = state.best ? `${state.best.distance.toFixed(1)} m` : '—';
    } else {
        $('goal-label').textContent = `Today’s bin · ${state.challenge.bin.toFixed(1)} m`;
        $('goal').textContent = state.daily.binned ? '🎯 In!' : state.daily.error != null ? `${state.daily.error.toFixed(2)} m off` : '—';
    }
    $('daily-note').hidden = state.mode !== 'daily';
    $('daily-note').textContent = state.challenge.fans.length
        ? `A desk fan is blowing upward at ${state.challenge.fans[0].x.toFixed(1)} m. New bin every day at midnight UTC.`
        : 'No fans today, just the bin. New bin every day at midnight UTC.';
}

function banner(text, kind = '') {
    const b = $('banner');
    b.textContent = text;
    b.dataset.kind = kind;
    b.hidden = false;
    b.classList.remove('pop');
    void b.offsetWidth;
    b.classList.add('pop');
}

/* ── Throwing ── */
function throwIt() {
    if (state.flight) return;
    const r = fly(state.fold, state.aim.angle, state.aim.speed, world());
    state.flight = r;
    state.playT = 0;
    $('banner').hidden = true;
    save('paperplane.aim', state.aim);
}

function finishFlight() {
    const r = state.flight;
    state.flight = null;
    state.last = r;
    // Remembered so the camera lingers on the landing before heading home.
    state.lastFinish = performance.now();
    let msg = `${r.distance.toFixed(1)} m in ${r.time.toFixed(1)} s`;
    let kind = '';
    if (r.distance < 0.5) { msg = 'Straight into the carpet. More flap up, or less nose?'; kind = 'meh'; }
    if (state.mode === 'distance') {
        if (!state.best || r.distance > state.best.distance) {
            state.best = { distance: r.distance, path: r.path.filter((_, i) => i % 2 === 0) };
            save('paperplane.best', state.best);
            msg = `New best · ${msg}`;
            kind = 'best';
        }
    } else {
        const err = Math.abs(r.distance - state.challenge.bin);
        if (inBin(r.distance, state.challenge)) {
            state.daily.binned = true;
            state.daily.error = 0;
            msg = '🎯 In the bin!';
            kind = 'best';
        } else {
            if (!state.daily.binned && (state.daily.error == null || err < state.daily.error)) state.daily.error = err;
            msg = r.distance < state.challenge.bin ? `${err.toFixed(2)} m short` : `${err.toFixed(2)} m long`;
        }
        state.daily.distance = r.distance;
        save('paperplane.daily', state.daily);
    }
    if (r.stalls > 2 && kind !== 'best') msg += ' · it stalled — try more nose weight';
    if (r.bonks > 0 && kind !== 'best') msg += ' · bonked the ceiling';
    banner(msg, kind);
    updateBoard();
}

$('throw').addEventListener('click', throwIt);

/* Drag anywhere on the room to aim: pull back like a slingshot, let go to
   throw. The arrow shows the launch; length is speed. */
canvas.addEventListener('pointerdown', (e) => {
    if (state.flight) return;
    canvas.setPointerCapture(e.pointerId);
    state.dragging = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
});
canvas.addEventListener('pointermove', (e) => {
    const d = state.dragging;
    if (!d || d.id !== e.pointerId) return;
    const dx = d.x0 - e.clientX, dy = e.clientY - d.y0;
    if (Math.hypot(dx, dy) < 8) return;
    d.moved = true;
    const reach = Math.min(canvas.clientWidth, canvas.clientHeight) * 0.45;
    state.aim.speed = Math.round(Math.min(MAX_SPEED, Math.max(2, Math.hypot(dx, dy) / reach * MAX_SPEED)) * 10) / 10;
    state.aim.angle = Math.round(Math.max(-15, Math.min(60, Math.atan2(dy, Math.max(1, dx)) * 180 / Math.PI)));
    syncAim();
});
canvas.addEventListener('pointerup', (e) => {
    const d = state.dragging;
    state.dragging = null;
    if (d && d.moved) throwIt();
});
canvas.addEventListener('pointercancel', () => { state.dragging = null; });

function syncAim() {
    $('aim').textContent = `${state.aim.angle}° · ${state.aim.speed.toFixed(1)} m/s`;
}

window.addEventListener('keydown', (e) => {
    if (e.target.closest('input')) return;
    const k = e.key;
    if (k === ' ' || k === 'Enter') { throwIt(); e.preventDefault(); }
    else if (k === 'ArrowUp') { state.aim.angle = Math.min(60, state.aim.angle + 1); syncAim(); e.preventDefault(); }
    else if (k === 'ArrowDown') { state.aim.angle = Math.max(-15, state.aim.angle - 1); syncAim(); e.preventDefault(); }
    else if (k === 'ArrowRight') { state.aim.speed = Math.min(MAX_SPEED, Math.round((state.aim.speed + 0.2) * 10) / 10); syncAim(); e.preventDefault(); }
    else if (k === 'ArrowLeft') { state.aim.speed = Math.max(2, Math.round((state.aim.speed - 0.2) * 10) / 10); syncAim(); e.preventDefault(); }
});

/* ── Drawing the office ── */
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

function scale() { return (H - 34) / (ROOM.ceiling + 0.25); }

function drawRoom(cam) {
    const s = scale();
    const floorY = H - 26;
    const X = (x) => (x - cam) * s;
    const Y = (y) => floorY - y * s;
    const x0 = cam - 1, x1 = cam + W / s + 1;

    // Wall.
    const wall = ctx.createLinearGradient(0, Y(ROOM.ceiling), 0, floorY);
    wall.addColorStop(0, '#1d2433');
    wall.addColorStop(1, '#262f42');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, floorY);

    // Windows every 6 m, with a dusk city behind that scrolls slower.
    for (let k = Math.floor(x0 / 6); k <= Math.ceil(x1 / 6); k++) {
        const wx = k * 6 + 1.5;
        const left = X(wx), right = X(wx + 2.4), top = Y(2.6), bottom = Y(0.95);
        ctx.fillStyle = '#0f1a2e';
        ctx.fillRect(left, top, right - left, bottom - top);
        ctx.save();
        ctx.beginPath();
        ctx.rect(left, top, right - left, bottom - top);
        ctx.clip();
        const sky = ctx.createLinearGradient(0, top, 0, bottom);
        sky.addColorStop(0, '#26355c');
        sky.addColorStop(1, '#c2766a');
        ctx.fillStyle = sky;
        ctx.fillRect(left, top, right - left, bottom - top);
        for (let b = 0; b < 9; b++) {
            const bx = left + ((b * 37 + k * 53) % 100) / 100 * (right - left) - cam * s * 0.15 % 40;
            const bh = (0.25 + ((b * 29 + k * 11) % 50) / 100) * (bottom - top);
            ctx.fillStyle = '#18213a';
            ctx.fillRect(bx, bottom - bh, (right - left) * 0.13, bh);
            ctx.fillStyle = 'rgba(255,214,140,0.5)';
            for (let w = 0; w < 4; w++) ctx.fillRect(bx + 3, bottom - bh + 4 + w * 8, 2, 2);
        }
        ctx.restore();
        ctx.strokeStyle = '#4b5568';
        ctx.lineWidth = 3;
        ctx.strokeRect(left, top, right - left, bottom - top);
        ctx.beginPath();
        ctx.moveTo((left + right) / 2, top);
        ctx.lineTo((left + right) / 2, bottom);
        ctx.stroke();
    }

    // Ceiling and lights.
    ctx.fillStyle = '#121826';
    ctx.fillRect(0, 0, W, Y(ROOM.ceiling));
    for (let k = Math.floor(x0 / 4); k <= Math.ceil(x1 / 4); k++) {
        const lx = X(k * 4 + 2);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(lx - 0.5 * s, Y(ROOM.ceiling), s, 4);
        const glow = ctx.createRadialGradient(lx, Y(ROOM.ceiling) + 4, 2, lx, Y(ROOM.ceiling) + 4, s * 1.4);
        glow.addColorStop(0, 'rgba(255,248,230,0.14)');
        glow.addColorStop(1, 'rgba(255,248,230,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(lx - s * 1.4, Y(ROOM.ceiling), s * 2.8, s * 1.4);
    }

    // Desks and plants as scenery (the plane flies over them).
    for (let k = Math.floor(x0 / 5); k <= Math.ceil(x1 / 5); k++) {
        if (k < 1) continue;
        const dx = k * 5 + 0.6;
        ctx.fillStyle = '#3b3326';
        ctx.fillRect(X(dx), Y(0.74), 1.4 * s, 0.05 * s);
        ctx.fillStyle = '#2b2620';
        ctx.fillRect(X(dx) + 3, Y(0.7), 4, 0.7 * s);
        ctx.fillRect(X(dx + 1.4) - 7, Y(0.7), 4, 0.7 * s);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(X(dx + 0.45), Y(1.1), 0.5 * s, 0.32 * s);
        ctx.fillStyle = '#334155';
        ctx.fillRect(X(dx + 0.68), Y(0.79), 0.04 * s, 0.05 * s);
        if (k % 2 === 0) {
            const px = X(dx + 2.6);
            ctx.fillStyle = '#7c4a2d';
            ctx.fillRect(px - 0.12 * s, Y(0.35), 0.24 * s, 0.35 * s);
            ctx.fillStyle = '#2f7a4c';
            for (let l = 0; l < 6; l++) {
                ctx.beginPath();
                ctx.ellipse(px + Math.cos(l) * 0.12 * s, Y(0.5 + (l % 3) * 0.12), 0.08 * s, 0.18 * s, (l - 2.5) * 0.4, 0, 6.283);
                ctx.fill();
            }
        }
    }

    // Floor with tape marks every metre.
    ctx.fillStyle = '#3a3f4f';
    ctx.fillRect(0, floorY, W, H - floorY);
    ctx.fillStyle = '#1f2330';
    ctx.fillRect(0, floorY - 6, W, 6);
    ctx.font = '600 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let m = Math.max(0, Math.floor(x0)); m <= Math.ceil(x1); m++) {
        const mx = X(m);
        ctx.fillStyle = m % 5 === 0 ? '#facc15' : 'rgba(250,204,21,0.45)';
        ctx.fillRect(mx - 1, floorY, 2, m % 5 === 0 ? 10 : 6);
        if (m % (s < 60 ? 5 : 1) === 0) {
            ctx.fillStyle = m % 5 === 0 ? '#fde68a' : '#94a3b8';
            ctx.fillText(m + ' m', mx, floorY + 11);
        }
    }
    ctx.textAlign = 'left';
    return { X, Y, s, floorY };
}

function drawFans(v) {
    if (state.mode !== 'daily') return;
    for (const f of state.challenge.fans) {
        const x = v.X(f.x);
        ctx.fillStyle = '#475569';
        ctx.fillRect(x - 0.18 * v.s, v.Y(0.1), 0.36 * v.s, 0.1 * v.s);
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.ellipse(x, v.Y(0.14), 0.22 * v.s, 0.05 * v.s, 0, 0, 6.283);
        ctx.fill();
        // Rising air, drawn as drifting streaks.
        ctx.strokeStyle = 'rgba(148, 197, 255, 0.35)';
        ctx.lineWidth = 1.5;
        const t = performance.now() / 1000;
        for (let k = 0; k < 7; k++) {
            const px = x + (k - 3) / 3 * (f.width / 2) * v.s * 0.8;
            const phase = ((t * f.up * 0.5 + k * 0.37) % 1);
            const y = v.Y(0.2 + phase * (f.height - 0.2));
            ctx.globalAlpha = 1 - phase;
            ctx.beginPath();
            ctx.moveTo(px, y);
            ctx.lineTo(px, y - 0.25 * v.s);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
}

function drawBin(v) {
    if (state.mode !== 'daily') return;
    const c = state.challenge;
    const x = v.X(c.bin);
    const w = c.binWidth * v.s, h = 0.36 * v.s;
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(x - w / 2, v.floorY - h);
    ctx.lineTo(x + w / 2, v.floorY - h);
    ctx.lineTo(x + w * 0.4, v.floorY);
    ctx.lineTo(x - w * 0.4, v.floorY);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 2, v.floorY - h);
    ctx.lineTo(x + w / 2 + 2, v.floorY - h);
    ctx.stroke();
    ctx.fillStyle = '#f472b6';
    ctx.font = '700 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🗑️ ' + c.bin.toFixed(1) + ' m', x, v.floorY - h - 18);
    ctx.textAlign = 'left';
}

function drawThrower(v) {
    const x = v.X(-0.35);
    const s = v.s;
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(x, v.Y(1.62), 0.11 * s, 0, 6.283);
    ctx.fill();
    ctx.fillRect(x - 0.11 * s, v.Y(1.48), 0.22 * s, 0.62 * s);
    ctx.fillRect(x - 0.09 * s, v.Y(0.86), 0.07 * s, 0.86 * s);
    ctx.fillRect(x + 0.02 * s, v.Y(0.86), 0.07 * s, 0.86 * s);
    // The throwing arm follows the aim.
    const a = state.aim.angle * Math.PI / 180;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 0.06 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, v.Y(1.42));
    ctx.lineTo(v.X(0), v.Y(ROOM.release) - Math.sin(a) * 4);
    ctx.stroke();
}

function drawPlane(v, x, y, pitch, alpha = 1) {
    const s = v.s;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(v.X(x), v.Y(y));
    ctx.rotate(-pitch);
    const len = 0.3 * s;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(len * 0.5, 0);
    ctx.lineTo(-len * 0.5, -len * 0.12);
    ctx.lineTo(-len * 0.5, len * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Keel.
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(len * 0.45, 0.5);
    ctx.lineTo(-len * 0.45, len * 0.06);
    ctx.lineTo(-len * 0.3, len * 0.14);
    ctx.closePath();
    ctx.fill();
    // Clips on the nose.
    if (state.fold.nose > 0.1) {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(len * 0.28, -2, len * 0.12, 4);
    }
    ctx.restore();
}

function drawPath(v, path, upto, style) {
    if (!path || path.length < 2) return;
    ctx.strokeStyle = style;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    const n = Math.min(path.length, upto);
    for (let k = 0; k < n; k++) {
        const [x, y] = path[k];
        k ? ctx.lineTo(v.X(x), v.Y(y)) : ctx.moveTo(v.X(x), v.Y(y));
    }
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawAim(v) {
    if (state.flight) return;
    const a = state.aim.angle * Math.PI / 180;
    const len = state.aim.speed / MAX_SPEED * 2.2;
    const x0 = v.X(0), y0 = v.Y(ROOM.release);
    const x1 = x0 + Math.cos(a) * len * v.s, y1 = y0 - Math.sin(a) * len * v.s;
    ctx.strokeStyle = state.dragging && state.dragging.moved ? '#facc15' : 'rgba(250,204,21,0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - Math.cos(a - 0.4) * 10, y1 + Math.sin(a - 0.4) * 10);
    ctx.lineTo(x1 - Math.cos(a + 0.4) * 10, y1 + Math.sin(a + 0.4) * 10);
    ctx.fill();
}

/* ── Loop ── */
let lastNow = performance.now();
function frame(now) {
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let px = 0, py = ROOM.release, pitch = state.aim.angle * Math.PI / 180, upto = 0;
    const f = state.flight;
    if (f) {
        // Real time, so a six-second flight takes six seconds; reduced motion
        // plays it at triple speed rather than not at all.
        state.playT += dt * (reduceMotion.matches ? 3 : 1);
        const idx = state.playT / SAMPLE;
        const i = Math.min(f.path.length - 1, Math.floor(idx));
        const j = Math.min(f.path.length - 1, i + 1);
        const t = idx - Math.floor(idx);
        const [x0, y0, p0] = f.path[i], [x1, y1, p1] = f.path[j];
        px = x0 + (x1 - x0) * t;
        py = y0 + (y1 - y0) * t;
        pitch = p0 + (p1 - p0) * t;
        upto = i + 1;
        if (i >= f.path.length - 1) finishFlight();
    } else if (state.last) {
        const end = state.last.path[state.last.path.length - 1];
        px = end[0]; py = end[1]; pitch = end[2];
    }

    // The camera leads the plane, and eases back to the thrower between throws.
    const s = scale();
    const viewW = W / s;
    const lingering = !f && state.last && now - (state.lastFinish || 0) < 2500;
    const want = f ? Math.max(-1.6, px - viewW * 0.38) : lingering ? state.camX : -1.6;
    state.camX += (want - state.camX) * Math.min(1, dt * (f ? 6 : 1.2));

    const v = drawRoom(state.camX);
    drawFans(v);
    drawBin(v);
    if (state.mode === 'distance' && state.best) {
        drawPath(v, state.best.path, Infinity, 'rgba(250, 204, 21, 0.3)');
        const end = state.best.path[state.best.path.length - 1];
        ctx.fillStyle = 'rgba(250,204,21,0.7)';
        ctx.font = '600 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('best ' + state.best.distance.toFixed(1) + ' m', v.X(end[0]), v.floorY - 18);
        ctx.textAlign = 'left';
    }
    if (f) drawPath(v, f.path, upto, 'rgba(226, 232, 240, 0.5)');
    else if (state.last) drawPath(v, state.last.path, Infinity, 'rgba(226, 232, 240, 0.25)');
    drawThrower(v);
    drawAim(v);
    if (f || state.last) drawPlane(v, px, py, pitch);
    else drawPlane(v, 0, ROOM.release, pitch);

    requestAnimationFrame(frame);
}

document.addEventListener('visibilitychange', () => { lastNow = performance.now(); });

/* ── Start ── */
const q = new URLSearchParams(location.search);
if (q.get('mode') === 'daily') setMode('daily'); else setMode('distance');
describeFold();
drawFold();
syncAim();
updateBoard();
requestAnimationFrame(frame);
// ?throw=angle,speed throws on load — for screenshots.
if (q.has('throw')) {
    const [a, sp] = q.get('throw').split(',').map(Number);
    if (Number.isFinite(a) && Number.isFinite(sp)) { state.aim = { angle: a, speed: sp }; syncAim(); setTimeout(throwIt, 300); }
}
if (q.has('fold')) {
    const [sh, no, fl] = q.get('fold').split(',').map(Number);
    if ([sh, no, fl].every(Number.isFinite)) { shapeIn.value = sh; noseIn.value = no; flapsIn.value = fl; readFold(); }
}
