// Sand Clock — the page: drawing the world, painting into it, the hourglass timer.
import {
    M, MATERIALS, createWorld, step, paint, flip, clear, explode, get,
    hourglass, volcano, garden, lab, sandAbove, count,
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
const TAP = pack(255, 255, 255);
const DRAIN = pack(244, 63, 94);
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
    // Taps: a bright notch where each one sits, so you can find it to remove.
    for (const e of world.emitters) {
        if (!e.user) continue;
        for (let dx = -1; dx <= 1; dx++) {
            const x = e.x + dx;
            if (x >= 0 && x < W && e.y < H) pixels[e.y * W + x] = e.t === M.EMPTY ? DRAIN : TAP;
        }
    }
    // The brush outline under a hovering mouse, so you see what a click covers.
    if (hover && !pointer) {
        const r = mode === 'blast' ? BLAST_R : brush;
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            const d = dx * dx + dy * dy;
            if (d > r * r + r || d <= (r - 1) * (r - 1) + (r - 1)) continue;
            const x = hover.x + dx, y = hover.y + dy;
            if (x < 0 || y < 0 || x >= W || y >= H) continue;
            // Half whatever is under it plus a grey: a ring that shows on sand and sky alike.
            const k = y * W + x;
            pixels[k] = (((pixels[k] >>> 1) & 0x7f7f7f) + 0xff505050) >>> 0;
        }
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
// Keys 1–0 for the first ten, Shift+1–4 for the next four, E for the eraser.
const TOOLS = [
    M.SAND, M.WATER, M.STONE, M.LAVA, M.PLANT, M.FIRE, M.OIL, M.ICE, M.WOOD, M.STEAM,
    M.ACID, M.GUNPOWDER, M.SALT, M.SNOW, M.EMPTY,
];
const ABOUT = {
    [M.SAND]: 'Piles up; lava fires it into glass',
    [M.WATER]: 'Flows and levels; puts out fire, feeds plants',
    [M.STONE]: 'Solid; lava cooled by water turns to it',
    [M.LAVA]: 'Slow and hot; boils water, lights what burns',
    [M.PLANT]: 'Drinks water and grows, sometimes flowers',
    [M.FIRE]: 'Burns plants, oil and wood; sets off gunpowder',
    [M.OIL]: 'Floats on water and burns fast',
    [M.ICE]: 'Freezes water it touches; melts in heat',
    [M.WOOD]: 'Solid fuel that burns slowly',
    [M.STEAM]: 'Rises, cools and rains back down',
    [M.ACID]: 'Eats anything but glass; water dilutes it',
    [M.GUNPOWDER]: 'Explodes at a spark — lay a trail as a fuse',
    [M.SALT]: 'Melts ice and snow; dissolves in water',
    [M.SNOW]: 'Drifts down and settles; melts near heat',
    [M.EMPTY]: 'Removes anything',
};
const keyFor = (n) => n < 9 ? String(n + 1) : n === 9 ? '0' : n < 14 ? '⇧' + (n - 9) : 'E';
const palette = document.getElementById('palette');
let tool = M.SAND;
let brush = 3;

TOOLS.forEach((t, n) => {
    const m = MATERIALS[t];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tool';
    b.dataset.tool = t;
    b.title = `${m.name} — ${ABOUT[t]} (${keyFor(n)})`;
    const sw = document.createElement('span');
    sw.className = 'swatch' + (t === M.EMPTY ? ' swatch-erase' : '');
    if (t !== M.EMPTY) sw.style.background = `rgb(${m.color.join(',')})`;
    const key = document.createElement('span');
    key.className = 'key';
    key.textContent = keyFor(n);
    b.append(sw, document.createTextNode(m.name), key);
    b.addEventListener('click', () => pick(t));
    palette.appendChild(b);
});

function pick(t) {
    if (!TOOLS.includes(t)) t = t === M.FLOWER ? M.PLANT : t === M.GLASS ? M.STONE : M.SAND;
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
const BRUSHES = [1, 3, 6, 11];
function nudgeBrush(d) {
    const k = Math.max(0, Math.min(BRUSHES.length - 1, BRUSHES.indexOf(brush) + d));
    setBrush(BRUSHES[k]);
}

/* ── Mode ──
   Pour paints while you drag; Tap fits a tap that keeps pouring the material
   on its own (an eraser tap is a drain); Blast sets off an explosion. */
let mode = 'pour';
const BLAST_R = 9;
const MAX_TAPS = 12;
function setMode(m) {
    mode = m;
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
}
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
setMode('pour');

function toggleTap(c) {
    const near = world.emitters.findIndex(e => e.user && Math.abs(e.x - c.x) <= 3 && Math.abs(e.y - c.y) <= 3);
    if (near >= 0) { world.emitters.splice(near, 1); return; }
    const taps = world.emitters.filter(e => e.user);
    if (taps.length >= MAX_TAPS) world.emitters.splice(world.emitters.indexOf(taps[0]), 1);
    world.emitters.push({ x: c.x, y: c.y, t: tool, rate: tool === M.EMPTY ? 1 : 0.6, spread: Math.min(brush, 3), user: true });
}

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

let hover = null;
canvas.addEventListener('pointerdown', (e) => {
    const c = cellAt(e);
    e.preventDefault();
    // Eyedropper: Alt-click or middle-click picks up whatever is under the cursor.
    if (e.altKey || e.button === 1) {
        const t = get(world, c.x, c.y);
        if (t !== M.EMPTY) pick(t);
        return;
    }
    if (e.button === 0 && mode === 'tap') { toggleTap(c); return; }
    if (e.button === 0 && mode === 'blast') { explode(world, c.x, c.y, BLAST_R); return; }
    canvas.setPointerCapture(e.pointerId);
    pointer = { id: e.pointerId, erase: e.button === 2, last: null, at: c };
    strokeTo(pointer.at);
});
canvas.addEventListener('pointermove', (e) => {
    hover = e.pointerType === 'mouse' ? cellAt(e) : null;
    if (!pointer || e.pointerId !== pointer.id) return;
    pointer.at = cellAt(e);
    strokeTo(pointer.at);
});
const endStroke = (e) => { if (pointer && e.pointerId === pointer.id) pointer = null; };
canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointercancel', endStroke);
canvas.addEventListener('pointerleave', () => { hover = null; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    nudgeBrush(e.deltaY < 0 ? 1 : -1);
}, { passive: false });

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
    else if (name === 'lab') lab(world);
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
    else if (e.key === 't' || e.key === 'T') setMode(mode === 'tap' ? 'pour' : 'tap');
    else if (e.key === 'b' || e.key === 'B') setMode(mode === 'blast' ? 'pour' : 'blast');
    else if (e.key === '[') nudgeBrush(-1);
    else if (e.key === ']') nudgeBrush(1);
    else if (/^Digit[0-9]$/.test(e.code)) {
        // By code, not key: Shift+1 is "!" on one layout and "+" on another.
        const d = +e.code[5];
        const n = e.shiftKey ? 9 + d : d === 0 ? 9 : d - 1;
        if (TOOLS[n] !== undefined && (!e.shiftKey || n < 14)) pick(TOOLS[n]);
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
setScene(['hourglass', 'volcano', 'garden', 'lab', 'empty'].includes(initial) ? initial : 'hourglass');
requestAnimationFrame(frame);
