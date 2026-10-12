// Sand Clock — the page: drawing the world, painting into it, the hourglass timer.
import {
    M, MATERIALS, createWorld, step, paint, flip, clear,
    hourglass, volcano, garden, sandAbove, count,
} from './sim.js';

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const stage = document.getElementById('stage');
const timerEl = document.getElementById('timer');
const pauseBtn = document.getElementById('pause');
const flipBtn = document.getElementById('flip');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ── World size ──
   Fixed at load from the space the stage has, about 240 cells across on a
   desktop and never coarser than 3px a cell on a phone. A resize rescales the
   canvas rather than rebuilding the world, so nothing you made is lost to
   rotating a phone. */
const box = stage.getBoundingClientRect();
const CELL = Math.max(3, Math.round(Math.min(box.width / 240, box.height / 160)));
const W = Math.max(60, Math.floor(box.width / CELL));
const H = Math.max(60, Math.floor(box.height / CELL));
canvas.width = W;
canvas.height = H;

const world = createWorld(W, H);
const image = ctx.createImageData(W, H);
const pixels = new Uint32Array(image.data.buffer);

/* ── Colour ──
   Each material gets 256 pre-mixed shades so a cell's colour is one table
   lookup by its shade byte. Packed ABGR, which is RGBA on every little-endian
   machine a browser runs on. */
function pack(r, g, b) {
    return (255 << 24) | (Math.min(255, b) << 16) | (Math.min(255, g) << 8) | Math.min(255, r);
}
const BG = pack(10, 13, 24);
const shades = MATERIALS.map((m) => {
    const out = new Uint32Array(256);
    const spread = m.id === M.WATER || m.id === M.GLASS ? 0.12 : m.id === M.STONE ? 0.3 : 0.24;
    for (let s = 0; s < 256; s++) {
        const k = 1 - spread / 2 + (s / 255) * spread;
        out[s] = pack(m.color[0] * k | 0, m.color[1] * k | 0, m.color[2] * k | 0);
    }
    return out;
});
// Flowers come in three colours, chosen by the cell's shade byte.
const FLOWER_COLOURS = [[244, 114, 182], [250, 204, 21], [240, 240, 250]];
for (let s = 0; s < 256; s++) {
    const c = FLOWER_COLOURS[s % 3];
    shades[M.FLOWER][s] = pack(c[0], c[1], c[2]);
}
const firePal = new Uint32Array(64);
for (let i = 0; i < 64; i++) {
    const t = i / 63;  // 0 = dying, 1 = fresh
    firePal[i] = pack(255, 60 + 180 * t | 0, 20 + 60 * t * t | 0);
}

function render() {
    const { type, shade, life, tick } = world;
    for (let i = 0; i < type.length; i++) {
        const t = type[i];
        if (t === M.EMPTY) { pixels[i] = BG; continue; }
        if (t === M.FIRE) { pixels[i] = firePal[Math.min(63, life[i])]; continue; }
        if (t === M.LAVA) {
            // A slow boil: each cell's shade drifts with time so the surface churns.
            pixels[i] = shades[t][(shade[i] + tick * 3) & 255];
            continue;
        }
        if (t === M.WATER) {
            pixels[i] = shades[t][(shade[i] + (tick >> 1)) & 255];
            continue;
        }
        pixels[i] = shades[t][shade[i]];
    }
    ctx.putImageData(image, 0, 0);
}

function fit() {
    const r = stage.getBoundingClientRect();
    const scale = Math.min(r.width / W, r.height / H);
    canvas.style.width = Math.floor(W * scale) + 'px';
    canvas.style.height = Math.floor(H * scale) + 'px';
}
// The stage, not the window: the header wraps to two rows on a phone once the
// fonts land, which shrinks the stage without any resize event at all.
new ResizeObserver(fit).observe(stage);
fit();

/* ── Tools ── */
const TOOLS = [
    M.SAND, M.WATER, M.STONE, M.LAVA, M.PLANT, M.FIRE, M.OIL, M.ICE, M.WOOD, M.STEAM, M.EMPTY,
];
const palette = document.getElementById('palette');
let tool = M.SAND;
let brush = 3;

TOOLS.forEach((t, n) => {
    const m = MATERIALS[t];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tool';
    b.dataset.tool = t;
    b.title = m.name + (n < 9 ? ` (${n + 1})` : n === 9 ? ' (0)' : ' (E)');
    const sw = document.createElement('span');
    sw.className = 'swatch' + (t === M.EMPTY ? ' swatch-erase' : '');
    if (t !== M.EMPTY) sw.style.background = `rgb(${m.color.join(',')})`;
    b.append(sw, document.createTextNode(m.name));
    b.addEventListener('click', () => pick(t));
    palette.appendChild(b);
});

function pick(t) {
    tool = t;
    palette.querySelectorAll('.tool').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.tool === t)));
}
pick(M.SAND);

document.querySelectorAll('[data-brush]').forEach(b => {
    b.addEventListener('click', () => setBrush(+b.dataset.brush));
});
function setBrush(r) {
    brush = r;
    document.querySelectorAll('[data-brush]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.brush === r)));
}
setBrush(3);

/* ── Painting ──
   Holding still keeps pouring — that is what a tap of sand should do — and a
   fast stroke is filled in between samples so it reads as a line, not dots. */
let pointer = null;

function cellAt(e) {
    const r = canvas.getBoundingClientRect();
    return {
        x: Math.floor((e.clientX - r.left) / r.width * W),
        y: Math.floor((e.clientY - r.top) / r.height * H),
    };
}

function strokeTo(c) {
    const from = pointer.last || c;
    const steps = Math.max(1, Math.ceil(Math.hypot(c.x - from.x, c.y - from.y) / Math.max(1, brush / 2)));
    for (let s = 1; s <= steps; s++) {
        const x = Math.round(from.x + (c.x - from.x) * s / steps);
        const y = Math.round(from.y + (c.y - from.y) * s / steps);
        paint(world, x, y, brush, pointer.erase ? M.EMPTY : tool, pointer.erase || tool === M.EMPTY);
    }
    pointer.last = c;
}

canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointer = { id: e.pointerId, erase: e.button === 2, last: null, at: cellAt(e) };
    strokeTo(pointer.at);
    e.preventDefault();
});
canvas.addEventListener('pointermove', (e) => {
    if (!pointer || e.pointerId !== pointer.id) return;
    pointer.at = cellAt(e);
    strokeTo(pointer.at);
});
const endStroke = (e) => { if (pointer && e.pointerId === pointer.id) pointer = null; };
canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointercancel', endStroke);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

/* ── The hourglass ──
   The clock counts simulation steps, not wall time: the neck passes one grain
   a step, so a step count is the honest reading of the glass, and pausing or
   a slow frame cannot put it out. */
let glass = null;  // { neckY, steps, done }

function setScene(name) {
    glass = null;
    if (name === 'hourglass') {
        const { neckY } = hourglass(world);
        glass = { neckY, steps: 0, done: false };
    } else if (name === 'volcano') volcano(world);
    else if (name === 'garden') garden(world);
    else clear(world);
    flipBtn.hidden = !glass;
    document.querySelectorAll('[data-scene]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scene === name)));
    updateTimer();
}

function turnOver() {
    flip(world);
    if (glass) {
        glass.neckY = H - 1 - glass.neckY;
        glass.steps = 0;
        glass.done = false;
    }
    stage.classList.remove('turning');
    void stage.offsetWidth;
    if (!reduceMotion.matches) stage.classList.add('turning');
}

function fmt(steps) {
    const s = Math.floor(steps / 60);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

let timerShown = '';
function updateTimer() {
    let text = '';
    if (glass) {
        text = glass.done
            ? `⌛ ${fmt(glass.steps)} — turn it over`
            : `⏳ ${fmt(glass.steps)}`;
    } else {
        const n = count(world, M.SAND);
        text = n ? `${n.toLocaleString()} grains` : '';
    }
    if (text !== timerShown) { timerEl.textContent = text; timerShown = text; }
}

document.querySelectorAll('[data-scene]').forEach(b => b.addEventListener('click', () => setScene(b.dataset.scene)));
flipBtn.addEventListener('click', turnOver);

let paused = false;
function setPaused(p) {
    if (p === paused) return;
    paused = p;
    pauseBtn.textContent = p ? 'Play' : 'Pause';
    pauseBtn.setAttribute('aria-pressed', String(p));
}
pauseBtn.addEventListener('click', () => setPaused(!paused));
document.getElementById('clear').addEventListener('click', () => setScene('empty'));

window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (e.key === ' ') { setPaused(!paused); e.preventDefault(); }
    else if (e.key === 'f' || e.key === 'F') { if (glass) turnOver(); }
    else if (e.key === 'e' || e.key === 'E') pick(M.EMPTY);
    else if (/^[0-9]$/.test(e.key)) {
        const n = e.key === '0' ? 9 : +e.key - 1;
        if (TOOLS[n] !== undefined) pick(TOOLS[n]);
    }
});

/* ── Loop ──
   The simulation runs at a fixed 60 steps a second whatever the display does,
   so the hourglass takes the same time on a 144Hz monitor as on a phone; a
   slow frame catches up a few steps at most rather than spiralling. */
const STEP_MS = 1000 / 60;
let acc = 0;
let last = performance.now();

function frame(now) {
    acc += Math.min(100, now - last);
    last = now;
    if (pointer && pointer.at) strokeTo(pointer.at);
    if (!paused) {
        let n = 0;
        while (acc >= STEP_MS && n < 4) {
            step(world);
            acc -= STEP_MS;
            n++;
            if (glass && !glass.done) {
                glass.steps++;
                // Checked every step so the reading is exact, and cheap: it
                // only scans the rows above the neck.
                if (sandAbove(world, glass.neckY) === 0) glass.done = true;
            }
        }
        if (n === 4) acc = 0;
    } else acc = 0;
    render();
    updateTimer();
    requestAnimationFrame(frame);
}

const initial = new URLSearchParams(location.search).get('scene') || 'hourglass';
setScene(['hourglass', 'volcano', 'garden', 'empty'].includes(initial) ? initial : 'hourglass');
requestAnimationFrame(frame);
