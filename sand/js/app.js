// Sand Clock — the page: drawing the world, the material picker and tools,
// the hourglass timer, and the settings (detail, speed, gravity, sharing).
import * as S from './sim.js';

const { M, MATERIALS } = S;

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const stage = document.getElementById('stage');
const spritesEl = document.getElementById('sprites');
const timerEl = document.getElementById('timer');
const pauseBtn = document.getElementById('pause');
const flipBtn = document.getElementById('flip');
const aboutEl = document.getElementById('about');
const toastEl = document.getElementById('toast');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const store = {
    get(k) { try { return localStorage.getItem('sand.' + k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem('sand.' + k, v); } catch { /* private mode */ } },
};

let toastTimer = 0;
function toast(text) {
    toastEl.textContent = text;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2600);
}

/* ── Detail ──
   The world's size is set from the space the stage has and a detail level:
   how many cells across a desktop gets, and the smallest a cell may be on a
   phone. "Auto" times a busy test world once and takes the finest level this
   machine can step in a few milliseconds, and steps back down a level if
   frames start running long. A change of level copies the world across, so
   nothing you made is lost; a resize only rescales the canvas. */
const DETAIL = [
    { id: 'coarse', name: 'Coarse', across: 160, min: 5 },
    { id: 'normal', name: 'Normal', across: 240, min: 3 },
    { id: 'fine', name: 'Fine', across: 400, min: 2 },
    { id: 'ultra', name: 'Ultra', across: 720, min: 1 },
];
const box = stage.getBoundingClientRect();
function sizeFor(id) {
    const d = DETAIL.find(l => l.id === id) || DETAIL[1];
    const cell = Math.max(d.min, Math.min(box.width / d.across, box.height / (d.across * 2 / 3)));
    return { W: Math.max(60, Math.floor(box.width / cell)), H: Math.max(60, Math.floor(box.height / cell)) };
}
const NORMAL_W = sizeFor('normal').W;

/** Milliseconds a step takes per cell with everything awake and moving. */
function benchmark() {
    const w = S.createWorld(200, 120, S.mulberry32(9));
    for (let i = 0; i < w.type.length; i++) {
        const r = (Math.imul(i, 2654435761) >>> 0) / 4294967296;
        w.type[i] = r < 0.3 ? M.SAND : r < 0.6 ? M.WATER : 0;
    }
    // Warm the JIT up first, then take the best of a few timed runs: the
    // first steps of a page are slow for reasons that have nothing to do
    // with the machine.
    for (let k = 0; k < 12; k++) S.step(w);
    let best = Infinity;
    for (let run = 0; run < 3; run++) {
        const t0 = performance.now();
        for (let k = 0; k < 6; k++) { S.wakeAll(w); S.step(w); }
        best = Math.min(best, (performance.now() - t0) / 6);
    }
    return best / w.type.length;
}
function autoLevel() {
    const per = benchmark();
    // Budget: half the world busy at once must step in about 5ms.
    let pick = DETAIL[0].id;
    for (const d of DETAIL) {
        const { W, H } = sizeFor(d.id);
        if (W * H * per * 0.5 <= 5) pick = d.id;
    }
    return pick;
}

let detailChoice = store.get('detail') || 'auto';
if (!['auto', ...DETAIL.map(d => d.id)].includes(detailChoice)) detailChoice = 'auto';
let level = detailChoice === 'auto' ? autoLevel() : detailChoice;
let { W, H } = sizeFor(level);
let world = S.createWorld(W, H);
let image, pixels;
let scale = 1;  // how many cells one "normal" cell is at this level: brushes scale by it

function sizeCanvas() {
    canvas.width = W;
    canvas.height = H;
    image = ctx.createImageData(W, H);
    pixels = new Uint32Array(image.data.buffer);
    scale = W / NORMAL_W;
    fit();
}

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
// A charged wire glows white at the head of a pulse and fades behind it.
const LIVE_WIRE = [0, pack(120, 170, 255), pack(170, 205, 255), pack(220, 235, 255), pack(255, 255, 255)];
const WHITE = pack(255, 255, 255);

function render() {
    const { type, shade, life, tick } = world;
    for (let i = 0; i < type.length; i++) {
        const t = type[i];
        if (t === M.EMPTY) { pixels[i] = BG; continue; }
        switch (t) {
            case M.FIRE: pixels[i] = firePal[Math.min(63, life[i])]; break;
            // A slow boil: each cell's shade drifts with time so the surface churns.
            case M.LAVA: pixels[i] = shades[t][(shade[i] + tick * 3) & 255]; break;
            case M.WATER: pixels[i] = shades[t][(shade[i] + (tick >> 1)) & 255]; break;
            case M.VOID: pixels[i] = shades[t][(shade[i] * 7 + tick * 5) & 255]; break;
            case M.METAL: pixels[i] = life[i] ? LIVE_WIRE[Math.min(4, life[i])] : shades[t][shade[i]]; break;
            case M.SPARK: pixels[i] = (tick + shade[i]) & 2 ? WHITE : shades[t][shade[i]]; break;
            case M.CLONER:
                // Once primed, a cloner is flecked with what it makes.
                pixels[i] = life[i] && life[i] <= MATERIALS.length && shade[i] & 1 ? shades[life[i] - 1][shade[i]] : shades[t][shade[i]];
                break;
            default: pixels[i] = shades[t][shade[i]];
        }
    }
    drawOverlay();
    ctx.putImageData(image, 0, 0);
}

/** Half whatever is under it plus a grey: a mark that shows on sand and sky alike. */
function mark(x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const k = y * W + x;
    pixels[k] = (((pixels[k] >>> 1) & 0x7f7f7f) + 0xff505050) >>> 0;
}
function ring(cx, cy, r) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const d = dx * dx + dy * dy;
        if (d > r * r + r || d <= (r - 1) * (r - 1) + (r - 1)) continue;
        mark(cx + dx, cy + dy);
    }
}
function trace(a, b) {
    const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
    for (let s = 0; s <= n; s++) mark(Math.round(a.x + (b.x - a.x) * s / n), Math.round(a.y + (b.y - a.y) * s / n));
}
function drawOverlay() {
    // While drawing a line or box: its outline, before it is laid down.
    if (pointer && !pointer.erase && (mode === 'line' || mode === 'box')) {
        const a = pointer.from, b = pointer.at;
        if (mode === 'line') trace(a, b);
        else {
            const c = { x: b.x, y: a.y }, d = { x: a.x, y: b.y };
            trace(a, c); trace(c, b); trace(b, d); trace(d, a);
        }
        return;
    }
    // The brush outline under a hovering mouse, so you see what a click covers.
    if (hover && !pointer) ring(hover.x, hover.y, reach());
}

function fit() {
    const r = stage.getBoundingClientRect();
    const s = Math.min(r.width / W, r.height / H);
    canvas.style.width = Math.floor(W * s) + 'px';
    canvas.style.height = Math.floor(H * s) + 'px';
    placeSprites();
}
// The stage, not the window: the header wraps to two rows on a phone once the
// fonts land, which shrinks the stage without any resize event at all.
new ResizeObserver(fit).observe(stage);

/* ── Materials ──
   Seven basics are always on show; everything else lives in six groups, each
   a button that opens a small tray of its materials. A group's button takes
   the name of whatever you picked from it and the colour of the last thing
   you did, so what you are using is always visible and one click away. */
const BASICS = [M.SAND, M.WATER, M.STONE, M.WOOD, M.FIRE, M.PLANT, M.EMPTY];
const GROUPS = [
    { id: 'liquids', icon: '💧', name: 'Liquids', items: [M.OIL, M.LAVA, M.ACID, M.HONEY] },
    { id: 'powders', icon: '🧂', name: 'Powders', items: [M.SALT, M.SNOW, M.GUNPOWDER] },
    { id: 'solids', icon: '🧊', name: 'Solids', items: [M.GLASS, M.ICE, M.METAL] },
    { id: 'air', icon: '☁️', name: 'Air', items: [M.STEAM, M.SMOKE, M.CLOUD] },
    { id: 'life', icon: '🌱', name: 'Life', items: [M.SEED, M.ANT, M.FLOWER] },
    { id: 'machines', icon: '⚙️', name: 'Machines', items: [M.BATTERY, M.SPARK, M.CLONER, M.VOID] },
];
const ABOUT = {
    [M.SAND]: 'piles up; lava or lightning fuses it into glass',
    [M.WATER]: 'flows and levels; puts out fire, feeds plants',
    [M.STONE]: 'a solid wall; lava cooled by water turns to it',
    [M.WOOD]: 'a solid wall that burns slowly',
    [M.FIRE]: 'burns plants, oil and wood; sets off gunpowder',
    [M.PLANT]: 'drinks water and grows, sometimes flowers',
    [M.EMPTY]: 'removes anything — or right-drag with any material',
    [M.OIL]: 'floats on water and burns fast',
    [M.LAVA]: 'slow and hot; boils water, lights what burns',
    [M.ACID]: 'eats anything but glass; water dilutes it',
    [M.HONEY]: 'very slow and sticky; ants eat it',
    [M.SALT]: 'melts ice and snow; dissolves in water',
    [M.SNOW]: 'drifts down and settles; melts near heat',
    [M.GUNPOWDER]: 'explodes at a spark — lay a trail as a fuse',
    [M.GLASS]: 'a clear wall that acid and blasts cannot break',
    [M.ICE]: 'freezes the water it touches; melts in heat',
    [M.METAL]: 'carries electricity — run a wire from a battery',
    [M.STEAM]: 'rises, cools and rains back down',
    [M.SMOKE]: 'rises and fades',
    [M.CLOUD]: 'drifts and rains; the cold tool turns it to snow',
    [M.SEED]: 'drop on sand, add water, and it grows into a tree',
    [M.ANT]: 'walks, climbs, digs through sand and eats plants',
    [M.FLOWER]: 'a dab of colour that burns',
    [M.BATTERY]: 'sends a pulse into the metal it touches every second or so',
    [M.SPARK]: 'a jolt: charges metal, lights fires, sets off gunpowder',
    [M.CLONER]: 'copies the first loose thing that touches it, for ever',
    [M.VOID]: 'swallows whatever touches it',
};
const groupOf = (t) => GROUPS.find(g => g.items.includes(t));
const lastIn = Object.fromEntries(GROUPS.map(g => [g.id, g.items[0]]));
const swatchCss = (t) => `rgb(${MATERIALS[t].color.join(',')})`;

const basicsEl = document.getElementById('basics');
const groupsEl = document.getElementById('groups');
const trayEl = document.getElementById('tray');
let tool = M.SAND;
let brush = 3;

function materialButton(t, key) {
    const m = MATERIALS[t];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tool';
    b.dataset.tool = t;
    b.title = `${m.name} — ${ABOUT[t]}` + (key ? ` (${key})` : '');
    const sw = document.createElement('span');
    sw.className = 'swatch' + (t === M.EMPTY ? ' swatch-erase' : '');
    if (t !== M.EMPTY) sw.style.background = swatchCss(t);
    const name = document.createElement('span');
    name.className = 'tool-name';
    name.textContent = m.name;
    b.append(sw, name);
    if (key) {
        const k = document.createElement('span');
        k.className = 'key';
        k.textContent = key;
        b.append(k);
    }
    b.addEventListener('click', () => { pick(t); closeTray(); });
    return b;
}

BASICS.forEach((t, n) => basicsEl.append(materialButton(t, t === M.EMPTY ? 'E' : String(n + 1))));

GROUPS.forEach((g, n) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tool group-tab';
    b.dataset.group = g.id;
    b.setAttribute('aria-haspopup', 'true');
    b.setAttribute('aria-expanded', 'false');
    b.title = `${g.name}: ${g.items.map(t => MATERIALS[t].name).join(', ')} (⇧${n + 1})`;
    b.innerHTML = `<span class="tab-icon" aria-hidden="true">${g.icon}</span><span class="tool-name"></span><span class="tab-dot" aria-hidden="true"></span>`;
    b.addEventListener('click', () => (openGroup === g ? closeTray() : showTray(g, b)));
    groupsEl.append(b);
});

let openGroup = null;
function showTray(g, tab) {
    openGroup = g;
    const head = document.createElement('p');
    head.className = 'tray-head';
    head.textContent = `${g.icon} ${g.name}`;
    trayEl.replaceChildren(head, ...g.items.map(t => materialButton(t)));
    trayEl.hidden = false;
    groupsEl.querySelectorAll('.group-tab').forEach(b => b.setAttribute('aria-expanded', String(b === tab)));
    // Sit just above the tab, kept inside the dock.
    const dock = trayEl.offsetParent.getBoundingClientRect();
    const r = tab.getBoundingClientRect();
    const width = trayEl.offsetWidth;
    trayEl.style.left = Math.max(8, Math.min(dock.width - width - 8, r.left - dock.left + r.width / 2 - width / 2)) + 'px';
    trayEl.style.bottom = (dock.bottom - r.top + 6) + 'px';
    syncPressed();
}
function closeTray() {
    if (!openGroup) return;
    openGroup = null;
    trayEl.hidden = true;
    groupsEl.querySelectorAll('.group-tab').forEach(b => b.setAttribute('aria-expanded', 'false'));
}

function syncPressed() {
    document.querySelectorAll('#basics .tool, #tray .tool').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.tool === tool)));
    groupsEl.querySelectorAll('.group-tab').forEach((b) => {
        const g = GROUPS.find(x => x.id === b.dataset.group);
        const mine = g.items.includes(tool);
        b.setAttribute('aria-pressed', String(mine));
        b.querySelector('.tool-name').textContent = mine ? MATERIALS[tool].name : g.name;
        b.querySelector('.tab-dot').style.background = swatchCss(lastIn[g.id]);
    });
}

function pick(t) {
    if (!BASICS.includes(t) && !groupOf(t)) t = t === M.SPROUT ? M.SEED : M.SAND;
    tool = t;
    const g = groupOf(t);
    if (g) lastIn[g.id] = t;
    syncPressed();
    describe();
}

/** The line under the dock: what the material in hand does, and the tool. */
function describe() {
    const m = MODES.find(x => x.id === mode);
    const a = document.createElement('strong');
    a.textContent = MATERIALS[tool].name;
    aboutEl.replaceChildren(a, ` — ${ABOUT[tool]}`);
    if (m && m.id !== 'pour') {
        const b = document.createElement('strong');
        b.textContent = m.name;
        aboutEl.append(' · ', b, ` — ${m.tip}`);
    }
}

/* ── Brush and tools ── */
const BRUSHES = [1, 3, 6, 11];
document.querySelectorAll('[data-brush]').forEach(b => b.addEventListener('click', () => setBrush(+b.dataset.brush)));
function setBrush(r) {
    brush = r;
    document.querySelectorAll('[data-brush]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.brush === r)));
}
function nudgeBrush(d) {
    const k = Math.max(0, Math.min(BRUSHES.length - 1, BRUSHES.indexOf(brush) + d));
    setBrush(BRUSHES[k]);
}
/** The brush radius in cells at this detail level. */
const brushCells = () => Math.max(1, Math.round(brush * scale));

const MODES = [
    { id: 'pour', icon: '✋', name: 'Pour', key: 'P', tip: 'drag to pour' },
    { id: 'line', icon: '╱', name: 'Line', key: 'L', tip: 'drag a straight line of it' },
    { id: 'box', icon: '▢', name: 'Box', key: 'R', tip: 'drag out a box — quick containers' },
    { id: 'tap', icon: '🚰', name: 'Tap', key: 'T', tip: 'click to fit a tap that keeps pouring, again to remove; an eraser tap is a drain' },
    { id: 'wind', icon: '🌬️', name: 'Wind', key: 'W', tip: 'drag to blow loose things along' },
    { id: 'heat', icon: '🔥', name: 'Heat', key: 'H', tip: 'hold to boil, melt, ignite and fuse' },
    { id: 'cool', icon: '❄️', name: 'Cold', key: 'C', tip: 'hold to freeze water, set lava, turn clouds to snow' },
    { id: 'bolt', icon: '⚡', name: 'Lightning', key: 'Z', tip: 'click to call down a bolt' },
    { id: 'blast', icon: '💥', name: 'Blast', key: 'B', tip: 'click to set off an explosion' },
];
let mode = 'pour';
const modesEl = document.getElementById('modes');
for (const m of MODES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip mode';
    b.dataset.mode = m.id;
    b.title = `${m.name} — ${m.tip} (${m.key})`;
    b.setAttribute('aria-label', m.name);
    b.innerHTML = `<span class="mode-icon" aria-hidden="true">${m.icon}</span><span class="mode-name">${m.name}</span>`;
    b.addEventListener('click', () => setMode(m.id));
    modesEl.append(b);
}
function setMode(id) {
    mode = id;
    modesEl.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === id)));
    describe();
}
const BLAST_R = 9;
function reach() {
    if (mode === 'blast') return Math.round(BLAST_R * scale);
    if (mode === 'tap' || mode === 'bolt') return Math.max(1, Math.round(scale));
    if (mode === 'line' || mode === 'box') return Math.max(1, Math.round(brushCells() / 2));
    return brushCells();
}

/* ── Taps ──
   A tap pours on its own, up to a quarter of the world of its material, and
   then rests until some has drained, burned or been eaten away, so one left
   running does not end in a screen full of sand. At most MAX_TAPS: a new one
   past that replaces the oldest. Each is marked by a sprite over the canvas. */
const MAX_TAPS = 12;
const TAP_CAP = 0.25;
function toggleTap(c) {
    const near = world.emitters.findIndex(e => e.user && Math.abs(e.x - c.x) <= 3 * scale + 1 && Math.abs(e.y - c.y) <= 3 * scale + 1);
    if (near >= 0) world.emitters.splice(near, 1);
    else {
        const taps = world.emitters.filter(e => e.user);
        if (taps.length >= MAX_TAPS) world.emitters.splice(world.emitters.indexOf(taps[0]), 1);
        const drain = tool === M.EMPTY;
        world.emitters.push({
            x: c.x, y: c.y, t: tool, user: true,
            rate: drain ? 1 : 0.6,
            spread: Math.max(1, Math.round(Math.min(brush, 3) * scale)),
            cap: drain ? 0 : TAP_CAP,
        });
        S.census(world);
    }
    placeSprites();
}
function placeSprites() {
    spritesEl.style.width = canvas.style.width;
    spritesEl.style.height = canvas.style.height;
    spritesEl.style.left = canvas.offsetLeft + 'px';
    spritesEl.style.top = canvas.offsetTop + 'px';
    spritesEl.replaceChildren(...world.emitters.filter(e => e.user).map((e) => {
        const s = document.createElement('span');
        const drain = e.t === M.EMPTY;
        s.className = 'sprite' + (drain ? ' drain' : '');
        s.style.left = ((e.x + 0.5) / W * 100) + '%';
        s.style.top = ((e.y + 0.5) / H * 100) + '%';
        if (!drain) s.style.setProperty('--c', swatchCss(e.t));
        return s;
    }));
}

/* ── Undo ──
   A snapshot of the cells before each stroke, click or scene change; Ctrl+Z
   or the ↶ button steps back. Snapshots are dropped when the detail level
   changes, since they no longer fit the grid. */
const undoStack = [];
const undoBtn = document.getElementById('undo');
function snapshot() {
    undoStack.push({
        W, H,
        type: world.type.slice(), shade: world.shade.slice(), life: world.life.slice(),
        emitters: world.emitters.map(e => ({ ...e })),
        gx: world.gx, gy: world.gy,
        glass: glass && { ...glass },
        scene,
    });
    if (undoStack.length > 12) undoStack.shift();
    undoBtn.disabled = false;
}
function undo() {
    const s = undoStack.pop();
    undoBtn.disabled = !undoStack.length;
    if (!s || s.W !== W || s.H !== H) return;
    world.type.set(s.type); world.shade.set(s.shade); world.life.set(s.life);
    world.emitters = s.emitters;
    S.setGravity(world, s.gx, s.gy);
    glass = s.glass;
    scene = s.scene;
    flipBtn.hidden = !glass;
    document.querySelectorAll('[data-scene]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scene === scene)));
    syncGravity();
    placeSprites();
    updateTimer(true);
}
undoBtn.addEventListener('click', undo);

/* ── Pointer ──
   Pour, heat and cold keep working while the pointer is held still — that is
   what a tap of sand should do — and a fast stroke is filled in between
   samples so it reads as a line, not dots. Right-drag erases; Alt-click or
   middle-click picks up whatever is under the cursor. */
let pointer = null;
let hover = null;
const holds = () => pointer && (pointer.erase || mode === 'pour' || mode === 'heat' || mode === 'cool');

function cellAt(e) {
    const r = canvas.getBoundingClientRect();
    return {
        x: Math.floor((e.clientX - r.left) / r.width * W),
        y: Math.floor((e.clientY - r.top) / r.height * H),
    };
}

function strokeTo(c) {
    const from = pointer.last || c;
    const r = brushCells();
    if (!pointer.erase && (mode === 'heat' || mode === 'cool')) S.temper(world, c.x, c.y, r, mode === 'heat');
    else S.line(world, from.x, from.y, c.x, c.y, r, pointer.erase ? M.EMPTY : tool, pointer.erase || tool === M.EMPTY);
    pointer.last = c;
}

canvas.addEventListener('pointerdown', (e) => {
    const c = cellAt(e);
    e.preventDefault();
    closeTray();
    closeSettings();
    if (e.altKey || e.button === 1) {
        const t = S.get(world, c.x, c.y);
        if (t !== M.EMPTY) { pick(t); toast(`Picked up ${MATERIALS[tool].name}`); }
        return;
    }
    const erase = e.button === 2;
    snapshot();
    if (!erase) {
        if (mode === 'tap') { toggleTap(c); return; }
        if (mode === 'blast') { S.explode(world, c.x, c.y, Math.round(BLAST_R * scale)); return; }
        if (mode === 'bolt') { S.lightning(world, c.x, c.y); return; }
    }
    canvas.setPointerCapture(e.pointerId);
    pointer = { id: e.pointerId, erase, last: null, at: c, from: c };
    if (holds()) strokeTo(c);
});
canvas.addEventListener('pointermove', (e) => {
    hover = e.pointerType === 'mouse' ? cellAt(e) : null;
    if (!pointer || e.pointerId !== pointer.id) return;
    const c = cellAt(e);
    if (mode === 'wind' && !pointer.erase) {
        const dx = Math.sign(c.x - pointer.at.x), dy = Math.sign(c.y - pointer.at.y);
        if (dx || dy) S.push(world, c.x, c.y, brushCells(), dx, dy);
    }
    pointer.at = c;
    if (holds()) strokeTo(c);
});
function endStroke(e) {
    if (!pointer || e.pointerId !== pointer.id) return;
    if (!pointer.erase && (mode === 'line' || mode === 'box')) {
        const a = pointer.from, b = pointer.at, r = reach();
        const ow = tool === M.EMPTY;
        if (mode === 'line') S.line(world, a.x, a.y, b.x, b.y, r, tool, ow);
        else {
            S.line(world, a.x, a.y, b.x, a.y, r, tool, ow);
            S.line(world, b.x, a.y, b.x, b.y, r, tool, ow);
            S.line(world, b.x, b.y, a.x, b.y, r, tool, ow);
            S.line(world, a.x, b.y, a.x, a.y, r, tool, ow);
        }
    }
    pointer = null;
}
canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointercancel', endStroke);
canvas.addEventListener('pointerleave', () => { hover = null; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    nudgeBrush(e.deltaY < 0 ? 1 : -1);
}, { passive: false });

/* ── Scenes and the hourglass ──
   The clock counts simulation steps, not wall time: the neck passes one grain
   a step, so a step count is the honest reading of the glass, and pausing, a
   slow frame or fast-forward cannot put it out. It only runs with gravity
   pointing down — tip the world over and the glass stops. */
let glass = null;  // { neckY, steps, done }
let scene = 'hourglass';
const SCENES = { hourglass: S.hourglass, volcano: S.volcano, garden: S.garden, lab: S.lab, machines: S.circuit };

function setScene(name, remember = true) {
    if (remember) snapshot();
    scene = name;
    glass = null;
    if (name === 'hourglass') {
        const { neckY } = S.hourglass(world);
        glass = { neckY, steps: 0, done: false };
    } else if (SCENES[name]) SCENES[name](world);
    else S.clear(world);
    // A new scene starts the right way up.
    S.setGravity(world, 0, 1);
    syncGravity();
    flipBtn.hidden = !glass;
    document.querySelectorAll('[data-scene]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scene === name)));
    placeSprites();
    updateTimer(true);
}

function turnOver() {
    snapshot();
    S.flip(world);
    if (glass) {
        glass.neckY = H - 1 - glass.neckY;
        glass.steps = 0;
        glass.done = false;
    }
    placeSprites();
    stage.classList.remove('turning');
    void stage.offsetWidth;
    if (!reduceMotion.matches) stage.classList.add('turning');
}

function fmt(steps) {
    const s = Math.floor(steps / 60);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

let timerShown = '';
let frames = 0;
function updateTimer(now = false) {
    let text = timerShown;
    if (glass) {
        text = world.gy !== 1 ? `⏳ ${fmt(glass.steps)} — tipped over`
            : glass.done ? `⌛ ${fmt(glass.steps)} — turn it over`
            : `⏳ ${fmt(glass.steps)}`;
    } else if (now || frames % 20 === 0) {
        // Counting the whole grid is cheap but not free: a few times a second.
        const n = S.count(world, M.SAND);
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
    pauseBtn.innerHTML = p ? '▶<span class="wide"> Play</span>' : '⏸<span class="wide"> Pause</span>';
    pauseBtn.setAttribute('aria-pressed', String(p));
}
pauseBtn.addEventListener('click', () => setPaused(!paused));
document.getElementById('clear').addEventListener('click', () => setScene('empty'));

/* ── Settings ── */
const settingsEl = document.getElementById('settings');
const settingsBtn = document.getElementById('settings-btn');
function openSettings() {
    closeTray();
    settingsEl.hidden = false;
    settingsBtn.setAttribute('aria-expanded', 'true');
    syncDetail();
}
function closeSettings() {
    settingsEl.hidden = true;
    settingsBtn.setAttribute('aria-expanded', 'false');
}
settingsBtn.addEventListener('click', () => (settingsEl.hidden ? openSettings() : closeSettings()));
document.addEventListener('pointerdown', (e) => {
    if (openGroup && !trayEl.contains(e.target) && !e.target.closest('.group-tab')) closeTray();
    if (!settingsEl.hidden && !settingsEl.contains(e.target) && !e.target.closest('#settings-btn')) closeSettings();
});

// Detail
function syncDetail() {
    settingsEl.querySelectorAll('[data-detail]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.detail === detailChoice)));
    const name = DETAIL.find(d => d.id === level).name;
    document.getElementById('detail-info').textContent =
        `${W} × ${H} = ${(W * H).toLocaleString()} cells` + (detailChoice === 'auto' ? ` · Auto chose ${name}` : '');
}
function applyLevel(next) {
    level = next;
    const size = sizeFor(level);
    if (size.W === W && size.H === H) { syncDetail(); return; }
    ({ W, H } = size);
    undoStack.length = 0;
    undoBtn.disabled = true;
    if (glass) {
        world = S.createWorld(W, H);
        sizeCanvas();
        setScene('hourglass', false);
    } else {
        world = S.resized(world, W, H);
        sizeCanvas();
    }
    syncDetail();
}
settingsEl.querySelectorAll('[data-detail]').forEach(b => b.addEventListener('click', () => {
    detailChoice = b.dataset.detail;
    store.set('detail', detailChoice);
    applyLevel(detailChoice === 'auto' ? autoLevel() : detailChoice);
}));

// Speed
let speed = 1;
settingsEl.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => setSpeed(+b.dataset.speed)));
function setSpeed(s) {
    speed = s;
    settingsEl.querySelectorAll('[data-speed]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.speed === s)));
}

// Gravity
function setGravity(gx, gy) {
    if (world.gx === gx && world.gy === gy) return;
    S.setGravity(world, gx, gy);
    syncGravity();
}
function syncGravity() {
    settingsEl.querySelectorAll('[data-gravity]').forEach((b) => {
        const [gx, gy] = b.dataset.gravity.split(',').map(Number);
        b.setAttribute('aria-pressed', String(gx === world.gx && gy === world.gy));
    });
}
settingsEl.querySelectorAll('[data-gravity]').forEach(b => b.addEventListener('click', () => {
    const [gx, gy] = b.dataset.gravity.split(',').map(Number);
    setGravity(gx, gy);
}));

// Tilt: on a phone, gravity can follow the way the phone is held.
const tiltBtn = document.getElementById('tilt');
let tilting = false;
if ('DeviceOrientationEvent' in window && matchMedia('(pointer: coarse)').matches) tiltBtn.hidden = false;
function onTilt(e) {
    if (e.beta == null || e.gamma == null) return;
    const rad = Math.PI / 180;
    const gx = Math.sin(e.gamma * rad), gy = Math.sin(e.beta * rad);
    const ang = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * rad;
    const sx = gx * Math.cos(ang) + gy * Math.sin(ang);
    const sy = gy * Math.cos(ang) - gx * Math.sin(ang);
    if (Math.hypot(sx, sy) < 0.35) return;  // lying flat: keep what we have
    if (Math.abs(sx) > Math.abs(sy) * 1.2) setGravity(Math.sign(sx), 0);
    else if (Math.abs(sy) > Math.abs(sx) * 1.2) setGravity(0, Math.sign(sy));
}
tiltBtn.addEventListener('click', async () => {
    if (tilting) {
        window.removeEventListener('deviceorientation', onTilt);
        tilting = false;
    } else {
        try {
            if (typeof DeviceOrientationEvent.requestPermission === 'function'
                && await DeviceOrientationEvent.requestPermission() !== 'granted') {
                toast('Motion access was not allowed');
                return;
            }
        } catch { toast('Motion access was not allowed'); return; }
        window.addEventListener('deviceorientation', onTilt);
        tilting = true;
        toast('Tilt your phone to pour');
    }
    tiltBtn.setAttribute('aria-pressed', String(tilting));
});

/* ── Sharing ──
   A link carries the world itself: its cells, deflated and base64'd into the
   hash, plus its size, gravity and taps. Opening the link rebuilds it at the
   opener's own detail level. */
const b64 = {
    enc(bytes) {
        let s = '';
        for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },
    dec(str) {
        const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
        const out = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
        return out;
    },
};
async function pipe(bytes, stream) {
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}
async function shareLink() {
    if (!('CompressionStream' in window)) { toast('This browser cannot make share links'); return; }
    const head = {
        w: W, h: H, gx: world.gx, gy: world.gy,
        taps: world.emitters.map(({ x, y, t, rate, spread, cap, user }) => ({ x, y, t, rate, spread, cap, user })),
    };
    const body = await pipe(world.type, new CompressionStream('deflate-raw'));
    const url = `${location.origin}${location.pathname}#w=${b64.enc(new TextEncoder().encode(JSON.stringify(head)))}.${b64.enc(body)}`;
    history.replaceState(null, '', url);
    try {
        await navigator.clipboard.writeText(url);
        toast(url.length > 60000 ? 'Link copied — a long one; simpler worlds share better' : 'Link copied');
    } catch {
        toast('The link is in the address bar — copy it from there');
    }
}
async function loadLink(hash) {
    const [h64, body] = hash.slice(3).split('.');
    const head = JSON.parse(new TextDecoder().decode(b64.dec(h64)));
    const type = await pipe(b64.dec(body), new DecompressionStream('deflate-raw'));
    if (type.length !== head.w * head.h) throw new Error('bad size');
    let w = S.createWorld(head.w, head.h);
    for (let i = 0; i < type.length; i++) {
        if (type[i] && type[i] < MATERIALS.length) S.set(w, i % head.w, (i / head.w) | 0, type[i]);
    }
    w.gx = head.gx; w.gy = head.gy;
    w.emitters = Array.isArray(head.taps) ? head.taps : [];
    if (w.w !== W || w.h !== H) w = S.resized(w, W, H);
    world = w;
    glass = null;
    scene = 'shared';
    flipBtn.hidden = true;
    document.querySelectorAll('[data-scene]').forEach(x => x.setAttribute('aria-pressed', 'false'));
    syncGravity();
    placeSprites();
    updateTimer(true);
}
document.getElementById('share').addEventListener('click', () => { shareLink().catch(() => toast('Could not make a link')); });

function savePicture() {
    const k = Math.max(1, Math.round(1600 / W));
    const out = document.createElement('canvas');
    out.width = W * k;
    out.height = H * k;
    const c = out.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.drawImage(canvas, 0, 0, out.width, out.height);
    out.toBlob((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'sand-clock.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
}
document.getElementById('save').addEventListener('click', savePicture);

/* ── Keyboard ── */
window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { undo(); e.preventDefault(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (k === 'Escape') { closeTray(); closeSettings(); return; }
    if (k === ' ') { setPaused(!paused); e.preventDefault(); return; }
    if (k === '[') { nudgeBrush(-1); return; }
    if (k === ']') { nudgeBrush(1); return; }
    const arrows = { ArrowDown: [0, 1], ArrowUp: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    if (arrows[k] && !e.target.closest('button')) { setGravity(...arrows[k]); e.preventDefault(); return; }
    if (/^Digit[0-9]$/.test(e.code)) {
        // By code, not key: Shift+1 is "!" on one layout and "+" on another.
        const d = +e.code[5];
        if (e.shiftKey) {
            // Shift+n: the n-th group, and again to step through it.
            const g = GROUPS[d - 1];
            if (!g) return;
            const at = g.items.indexOf(tool);
            pick(at < 0 ? lastIn[g.id] : g.items[(at + 1) % g.items.length]);
        } else if (d >= 1 && d < BASICS.length) pick(BASICS[d - 1]);
        return;
    }
    const lower = k.toLowerCase();
    if (lower === 'e') { pick(M.EMPTY); return; }
    if (lower === 'f') { if (glass) turnOver(); return; }
    if (lower === 'u') { undo(); return; }
    const m = MODES.find(x => x.key.toLowerCase() === lower);
    if (m) setMode(m.id);
});

/* ── Loop ──
   The simulation runs at a fixed 60 steps a second (times the speed setting)
   whatever the display does, so the hourglass takes the same time on a 144Hz
   monitor as on a phone; a slow frame catches up a few steps at most rather
   than spiralling. In Auto detail, a run of slow frames steps down a level. */
const STEP_MS = 1000 / 60;
let acc = 0;
let last = performance.now();
let simMs = 0, simFrames = 0, lastDowngrade = 0;

function frame(now) {
    acc += Math.min(100, now - last) * speed;
    last = now;
    frames++;
    if (holds() && pointer.last) strokeTo(pointer.at);
    if (!paused) {
        const t0 = performance.now();
        const most = Math.ceil(4 * speed);
        let n = 0;
        while (acc >= STEP_MS && n < most) {
            S.step(world);
            acc -= STEP_MS;
            n++;
            if (glass && !glass.done && world.gy === 1) {
                glass.steps++;
                // Checked every step so the reading is exact, and cheap: it
                // only scans the rows above the neck.
                if (S.sandAbove(world, glass.neckY) === 0) glass.done = true;
            }
        }
        if (n === most) acc = 0;
        simMs += (performance.now() - t0) / speed;
        if (++simFrames === 90) {
            const i = DETAIL.findIndex(d => d.id === level);
            if (detailChoice === 'auto' && simMs / simFrames > 12 && i > 0 && now - lastDowngrade > 5000) {
                lastDowngrade = now;
                applyLevel(DETAIL[i - 1].id);
                toast(`Detail lowered to ${DETAIL[i - 1].name} to keep things smooth`);
            }
            simMs = 0; simFrames = 0;
        }
    } else acc = 0;
    render();
    updateTimer();
    requestAnimationFrame(frame);
}

/* ── Start ── */
sizeCanvas();
pick(M.SAND);
setBrush(3);
setMode('pour');
setSpeed(1);
syncDetail();
undoBtn.disabled = true;
const initial = new URLSearchParams(location.search).get('scene') || 'hourglass';
setScene(Object.hasOwn(SCENES, initial) || initial === 'empty' ? initial : 'hourglass', false);
if (location.hash.startsWith('#w=')) loadLink(location.hash).catch(() => toast('That link could not be read'));
requestAnimationFrame(frame);
