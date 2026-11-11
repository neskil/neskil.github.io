// Gait Lab: the page. Bodies, physics and evolution are js/sim.js.

import * as S from './sim.js';

const $ = (id) => document.getElementById(id);
const canvas = $('stage'), ctx = canvas.getContext('2d');
const chart = $('chart'), cctx = chart.getContext('2d');
const query = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const GHOSTS = [3, 8, 15, 24, 36, 48, 59];        // ranks shown behind the champion

let presetKey = 'biped';
let spec = S.settle(S.PRESETS[presetKey]);
let pop = null;
let raceState = null;       // { worlds, hold }
let skip = 1, speed = 2;
let busy = false, token = 0;
let camX = 0;

// ── Evolution, a generation at a time so a long skip never freezes the page ──
function restart(newSpec) {
    if (newSpec) spec = S.settle(newSpec);
    const seed = query.has('seed') ? +query.get('seed') : (Math.random() * 2 ** 31) | 0;
    pop = S.createPopulation(spec, seed);
    raceState = null; camX = 0;
    token++;
    nextRace(1);
}

function nextRace(generations) {
    const mine = ++token;
    busy = true;
    let left = generations;
    const work = () => {
        if (mine !== token) return;
        const until = performance.now() + 24;
        while (left > 0 && performance.now() < until) { S.evolve(pop); left--; }
        if (left > 0) { caption(); drawChart(); setTimeout(work, 0); return; }
        busy = false;
        const worlds = [0, ...GHOSTS].filter(i => i < pop.ranked.length).map(i => S.createWorld(spec, pop.ranked[i].genome));
        raceState = { worlds, hold: 0 };
        camX = 0;
        stats(); caption(); drawChart();
    };
    work();
}

function stats() {
    const gen = pop.history.length;
    $('s-gen').textContent = gen;
    $('s-rec').innerHTML = pop.record.toFixed(1) + '<span>m</span>';
    if (pop.ranked) $('s-hz').innerHTML = S.tempoHz(pop.ranked[0].genome).toFixed(1) + '<span>beats/s</span>';
}

function caption() {
    const gen = pop.history.length;
    let text;
    if (busy && gen > 0) text = 'Racing generations nobody is watching…';
    else if (gen <= 1) text = 'Sixty random sets of reflexes. Most of them fall over; the one in colour fell furthest.';
    else if (gen <= 4) text = 'The better half had children, each a shuffle of two parents with a few mistakes copied in.';
    else {
        const first = Math.max(pop.history[0].best, 0.1), now = pop.history[gen - 1].best;
        const avg0 = pop.history[0].mean, avg = pop.history[gen - 1].mean;
        text = now > first * 1.3
            ? `The best now goes ${(now / first).toFixed(1)}× as far as the best random one did. The average went from ${avg0.toFixed(1)} m to ${avg.toFixed(1)} m.`
            : 'Still looking for something better than a lucky first guess. It can take a while, then come all at once.';
    }
    $('caption').innerHTML = `<b>Generation ${Math.max(gen, 1)}</b>${text}`;
}

// ── Drawing the race ──
let W = 0, H = 0, PX = 100, groundY = 0;
function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [canvas, chart]) {
        const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    }
    W = canvas.width; H = canvas.height;
    PX = H / 3.6;                                   // 3.6 m of world top to bottom
    groundY = H * 0.8;
}
const sx = (x) => W * 0.36 + (x - camX) * PX;
const sy = (y) => groundY - y * PX;

function scenery() {
    const g = ctx.createLinearGradient(0, 0, 0, groundY);
    g.addColorStop(0, '#0b1326'); g.addColorStop(1, '#1b2b4d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, groundY);
    // Two ridges of hills at different depths, so distance covered reads as motion.
    for (const [depth, color, amp, base] of [[0.12, '#16233f', 0.5, 0.95], [0.3, '#12203a', 0.32, 0.5]]) {
        ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, groundY);
        for (let px = 0; px <= W; px += 8) {
            const wx = (px - W * 0.36) / PX + camX * depth * 3;
            const hgt = base + amp * (Math.sin(wx * 0.7) + 0.5 * Math.sin(wx * 1.9 + 1) + 0.25 * Math.sin(wx * 4.3 + 2));
            ctx.lineTo(px, groundY - hgt * PX * 0.6);
        }
        ctx.lineTo(W, groundY); ctx.fill();
    }
    const gg = ctx.createLinearGradient(0, groundY, 0, H);
    gg.addColorStop(0, '#1f3a34'); gg.addColorStop(1, '#0f1f24');
    ctx.fillStyle = gg; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.strokeStyle = 'rgba(52,211,153,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
    // A post every metre, a number every five.
    ctx.font = `600 ${Math.round(H * 0.032)}px Inter, sans-serif`; ctx.textAlign = 'center';
    const from = Math.floor(camX - W * 0.36 / PX) - 1, to = from + Math.ceil(W / PX) + 2;
    for (let m = from; m <= to; m++) {
        const x = sx(m), big = m % 5 === 0;
        ctx.strokeStyle = big ? 'rgba(226,232,240,0.45)' : 'rgba(226,232,240,0.16)'; ctx.lineWidth = big ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(x, groundY); ctx.lineTo(x, groundY + (big ? 14 : 7) * H / 400); ctx.stroke();
        if (big) { ctx.fillStyle = 'rgba(226,232,240,0.6)'; ctx.fillText(m + ' m', x, groundY + H * 0.085); }
    }
}

function flag(x, color, label) {
    const px = sx(x);
    if (px < -40 || px > W + 40) return;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, groundY); ctx.lineTo(px, groundY - PX * 0.75); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px, groundY - PX * 0.75); ctx.lineTo(px + PX * 0.22, groundY - PX * 0.66); ctx.lineTo(px, groundY - PX * 0.57); ctx.fill();
    ctx.font = `600 ${Math.round(H * 0.028)}px Inter, sans-serif`; ctx.textAlign = 'left';
    ctx.fillText(label, px + 5, groundY - PX * 0.8);
}

function drawCreature(w, alpha, champion) {
    ctx.globalAlpha = alpha; ctx.lineCap = 'round';
    for (const l of w.links) {
        const ax = sx(w.x[l.a]), ay = sy(w.y[l.a]), bx = sx(w.x[l.b]), by = sy(w.y[l.b]);
        if (!champion) { ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = PX * 0.03; }
        else if (!l.muscle) { ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = PX * 0.045; }
        else {
            // Colour by what the muscle is being told to do, width by how short it is.
            const k = (l.target - l.rest) / (l.rest * S.MAX_PULL);          // -1 pulling … +1 stretching
            ctx.strokeStyle = k < 0 ? mix('#cbd5e1', '#fb7185', -k) : mix('#cbd5e1', '#60a5fa', k);
            ctx.lineWidth = PX * (0.085 - 0.04 * k);
        }
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
    for (let i = 0; i < w.n; i++) {
        const grip = (w.grip[i] - 0.05) / 1.45;
        ctx.beginPath(); ctx.arc(sx(w.x[i]), sy(w.y[i]), PX * (champion ? 0.07 : 0.045), 0, 7);
        ctx.fillStyle = champion ? mix('#f8fafc', '#0b1220', grip) : '#64748b'; ctx.fill();
        if (champion) { ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = PX * 0.018; ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
}

function mix(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    const p = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
    return `rgb(${[0, 1, 2].map(i => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t)).join(',')})`;
}

function drawRace() {
    scenery();
    flag(0, 'rgba(226,232,240,0.5)', 'start');
    // The mark to beat is the best of the generations before this one.
    const before = pop.history.slice(0, -1).reduce((m, h) => Math.max(m, h.best), 0);
    if (before > 1) flag(before + raceState.worlds[0].startX, '#fbbf24', 'to beat: ' + before.toFixed(1) + ' m');
    for (let i = raceState.worlds.length - 1; i > 0; i--) drawCreature(raceState.worlds[i], 0.22, false);
    drawCreature(raceState.worlds[0], 1, true);
    if (busy) veil('Evolving…');
}
function veil(text) {
    ctx.fillStyle = 'rgba(15,23,42,0.55)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'center';
    ctx.font = `700 ${Math.round(H * 0.06)}px Outfit, sans-serif`;
    ctx.fillText(text, W / 2, H / 2);
}

function drawChart() {
    fit();
    const w = chart.width, h = chart.height, hist = pop ? pop.history : [];
    cctx.clearRect(0, 0, w, h);
    if (hist.length < 2) return;
    const top = Math.max(...hist.map(s => s.best), 1) * 1.08, low = Math.min(0, ...hist.map(s => s.mean));
    const px = (i) => 4 + i / (hist.length - 1) * (w - 8), py = (v) => h - 4 - (v - low) / (top - low) * (h - 8);
    cctx.strokeStyle = 'rgba(255,255,255,0.12)'; cctx.lineWidth = 1;
    cctx.beginPath(); cctx.moveTo(0, py(0)); cctx.lineTo(w, py(0)); cctx.stroke();
    for (const [key, color, width] of [['mean', '#94a3b8', 1.5], ['best', '#34d399', 2.5]]) {
        cctx.strokeStyle = color; cctx.lineWidth = width * (window.devicePixelRatio > 1 ? 2 : 1); cctx.lineJoin = 'round';
        cctx.beginPath();
        hist.forEach((s, i) => i ? cctx.lineTo(px(i), py(s[key])) : cctx.moveTo(px(i), py(s[key])));
        cctx.stroke();
    }
}

// ── Building ──
let building = false, tool = 'muscle', draft = null, grab = null, pointer = null;
const B = { px: 150, ox: 0, oy: 0 };            // editor view: metres to pixels
function layoutBuild() {
    B.px = Math.min(W / 4.2, H / 2.9);
    B.ox = W / 2 - 1.3 * B.px; B.oy = H * 0.86;
}
const bx = (x) => B.ox + x * B.px, by = (y) => B.oy - y * B.px;
const snap = (v) => Math.round(v * 20) / 20;
function fromEvent(e) {
    const r = canvas.getBoundingClientRect(), k = canvas.width / r.width;
    const mx = (e.clientX - r.left) * k, my = (e.clientY - r.top) * k;
    return { mx, my, x: snap(Math.max(-0.6, Math.min(3.2, (mx - B.ox) / B.px))), y: snap(Math.max(0, Math.min(2.4, (B.oy - my) / B.px))) };
}
function nodeAt(p) {
    const reach = 22 * (canvas.width / canvas.clientWidth);
    let best = -1, bd = reach;
    draft.nodes.forEach((n, i) => { const d = Math.hypot(bx(n[0]) - p.mx, by(n[1]) - p.my); if (d < bd) { bd = d; best = i; } });
    return best;
}
function linkAt(p) {
    const reach = 12 * (canvas.width / canvas.clientWidth);
    let best = -1, bd = reach;
    draft.links.forEach((l, i) => {
        const a = draft.nodes[l[0]], b = draft.nodes[l[1]];
        const ax = bx(a[0]), ay = by(a[1]), dx = bx(b[0]) - ax, dy = by(b[1]) - ay;
        const t = Math.max(0, Math.min(1, ((p.mx - ax) * dx + (p.my - ay) * dy) / (dx * dx + dy * dy)));
        const d = Math.hypot(ax + t * dx - p.mx, ay + t * dy - p.my);
        if (d < bd) { bd = d; best = i; }
    });
    return best;
}
function setLink(a, b, kind) {
    if (a === b) return;
    const found = draft.links.find(l => (l[0] === a && l[1] === b) || (l[0] === b && l[1] === a));
    if (found) found[2] = kind; else if (draft.links.length < S.MAX_LINKS) draft.links.push([a, b, kind]);
}
function removeNode(i) {
    draft.nodes.splice(i, 1);
    draft.links = draft.links.filter(l => l[0] !== i && l[1] !== i).map(l => [l[0] - (l[0] > i), l[1] - (l[1] > i), l[2]]);
}
function checkDraft() {
    const v = S.validate(draft);
    $('why').textContent = v.why;
    $('btn-go').disabled = !v.ok;
    return v.ok;
}

canvas.addEventListener('pointerdown', (e) => {
    if (!building) return;
    canvas.setPointerCapture(e.pointerId);
    const p = fromEvent(e), n = nodeAt(p);
    pointer = p;
    if (tool === 'erase') {
        if (n >= 0) removeNode(n); else { const l = linkAt(p); if (l >= 0) draft.links.splice(l, 1); }
    } else if (tool === 'move') {
        if (n >= 0) grab = { node: n };
    } else if (n >= 0) {
        grab = { from: n };
    } else {
        const l = linkAt(p);
        if (l >= 0) draft.links[l][2] = tool === 'muscle' ? 1 : 0;       // tap a link to turn it into the other kind
    }
    checkDraft();
});
canvas.addEventListener('pointermove', (e) => {
    if (!building) return;
    pointer = fromEvent(e);
    if (grab && grab.node !== undefined) { draft.nodes[grab.node] = [pointer.x, pointer.y]; checkDraft(); }
});
canvas.addEventListener('pointerup', (e) => {
    if (!building || !grab) return;
    const p = fromEvent(e);
    if (grab.from !== undefined) {
        let to = nodeAt(p);
        if (to < 0 && draft.nodes.length < S.MAX_NODES) {
            const a = draft.nodes[grab.from];
            if (Math.hypot(a[0] - p.x, a[1] - p.y) >= S.MIN_LINK) { draft.nodes.push([p.x, p.y]); to = draft.nodes.length - 1; }
        }
        if (to >= 0) setLink(grab.from, to, tool === 'muscle' ? 1 : 0);
    }
    grab = null;
    checkDraft();
});
canvas.addEventListener('pointercancel', () => { grab = null; });

function drawBuild() {
    layoutBuild();
    ctx.fillStyle = '#0d1528'; ctx.fillRect(0, 0, W, H);
    // A 25 cm grid, with the ground as its bottom line.
    ctx.lineWidth = 1;
    for (let gx = -0.5; gx <= 3.26; gx += 0.25) {
        ctx.strokeStyle = Math.abs(gx % 1) < 1e-6 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)';
        ctx.beginPath(); ctx.moveTo(bx(gx), by(0)); ctx.lineTo(bx(gx), by(2.4)); ctx.stroke();
    }
    for (let gy = 0; gy <= 2.41; gy += 0.25) {
        ctx.strokeStyle = Math.abs(gy % 1) < 1e-6 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)';
        ctx.beginPath(); ctx.moveTo(bx(-0.5), by(gy)); ctx.lineTo(bx(3.25), by(gy)); ctx.stroke();
    }
    ctx.fillStyle = '#16302c'; ctx.fillRect(0, by(0), W, H - by(0));
    ctx.strokeStyle = 'rgba(52,211,153,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, by(0)); ctx.lineTo(W, by(0)); ctx.stroke();

    ctx.lineCap = 'round';
    for (const l of draft.links) {
        const a = draft.nodes[l[0]], b = draft.nodes[l[1]];
        ctx.strokeStyle = l[2] ? '#fb7185' : '#e2e8f0'; ctx.lineWidth = B.px * (l[2] ? 0.07 : 0.04);
        ctx.beginPath(); ctx.moveTo(bx(a[0]), by(a[1])); ctx.lineTo(bx(b[0]), by(b[1])); ctx.stroke();
    }
    if (grab && grab.from !== undefined && pointer) {
        const a = draft.nodes[grab.from];
        ctx.strokeStyle = tool === 'muscle' ? 'rgba(251,113,133,0.6)' : 'rgba(226,232,240,0.6)';
        ctx.setLineDash([8, 8]); ctx.lineWidth = B.px * 0.035;
        ctx.beginPath(); ctx.moveTo(bx(a[0]), by(a[1])); ctx.lineTo(bx(pointer.x), by(pointer.y)); ctx.stroke();
        ctx.setLineDash([]);
    }
    for (const n of draft.nodes) {
        ctx.beginPath(); ctx.arc(bx(n[0]), by(n[1]), B.px * 0.07, 0, 7);
        ctx.fillStyle = '#0f172a'; ctx.fill(); ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = B.px * 0.022; ctx.stroke();
    }
}

function setBuilding(on) {
    building = on;
    document.body.classList.toggle('build', on);
    $('btn-go').hidden = !on;
    $('btn-build').textContent = on ? 'Cancel' : 'Build your own';
    $('why').textContent = '';
    if (on) {
        draft = { nodes: spec.nodes.map(n => [...n]), links: spec.links.map(l => [...l]) };
        token++; busy = false;
        $('caption').innerHTML = '<b>Your creature</b>Drag from a joint to grow a limb. Tap a link to change what it is.';
        checkDraft();
    } else {
        caption();
        if (!raceState) nextRace(1);
    }
    how();
}

function how() {
    $('how').innerHTML = building
        ? '<b>Muscle</b> and <b>Bone</b>: drag from one joint to another, or out into empty space to add a joint. <b>Move</b> drags joints about; <b>Erase</b> takes out a joint or a link. A body with no triangles in it folds flat, which evolution will happily exploit.'
        : 'Each creature has the same body and a different set of reflexes: when each <b>muscle</b> pulls, how hard, how fast the beat is, and which feet <b>grip</b>. Sixty race for ten seconds. The ten percent that got furthest go through untouched, and the rest of the next generation are children of the better half. That is the whole method; the walking is not written anywhere.';
}

// ── Wiring ──
for (const [key, p] of Object.entries(S.PRESETS)) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = p.name; b.dataset.key = key;
    b.addEventListener('click', () => {
        presetKey = key; markPreset();
        if (building) { draft = S.settle(p); checkDraft(); } else restart(p);
    });
    $('presets').appendChild(b);
}
function markPreset() {
    for (const b of $('presets').querySelectorAll('button')) b.setAttribute('aria-pressed', b.dataset.key === presetKey);
}
function pressGroup(id, attr, value) {
    for (const b of $(id).querySelectorAll('button')) b.setAttribute('aria-pressed', b.dataset[attr] === String(value));
}
$('skips').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { skip = +b.dataset.skip; pressGroup('skips', 'skip', skip); } });
$('speeds').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { speed = +b.dataset.speed; pressGroup('speeds', 'speed', speed); } });
for (const b of document.querySelectorAll('[data-tool]')) {
    b.addEventListener('click', () => { tool = b.dataset.tool; for (const o of document.querySelectorAll('[data-tool]')) o.setAttribute('aria-pressed', o === b); });
}
$('btn-build').addEventListener('click', () => setBuilding(!building));
$('btn-go').addEventListener('click', () => {
    if (!checkDraft()) return;
    presetKey = ''; markPreset();
    building = true; setBuilding(false);
    restart(draft);
});
$('btn-restart').addEventListener('click', () => { if (building) setBuilding(false); restart(); });
$('btn-share').addEventListener('click', async () => {
    const btn = $('btn-share');
    const url = location.origin + location.pathname + '?c=' + S.encode(building ? S.settle(draft) : spec);
    history.replaceState(null, '', url);
    try { await navigator.clipboard.writeText(url); btn.textContent = 'Copied'; }
    catch { btn.textContent = 'Link is in the address bar'; }
    setTimeout(() => { btn.textContent = 'Copy link'; }, 1800);
});

// ── The loop ──
let last = 0, debt = 0;
function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    fit();
    if (building) { drawBuild(); return; }
    if (!raceState) { scenery(); if (busy) veil('Evolving…'); return; }
    const champ = raceState.worlds[0];
    if (!busy) {
        if (champ.t < S.RACE_SECONDS) {
            debt += dt * speed / S.DT;
            const steps = Math.min(Math.floor(debt), 400);
            debt -= steps;
            for (let s = 0; s < steps && champ.t < S.RACE_SECONDS; s++) for (const w of raceState.worlds) S.step(w);
        } else {
            raceState.hold += dt;
            if (raceState.hold > (reduced ? 2.5 : 0.9)) nextRace(skip);
        }
    }
    const lead = S.centre(champ);
    camX += (lead - camX) * Math.min(1, dt * 6);
    $('s-now').innerHTML = (S.distance(champ) + 0).toFixed(1).replace('-0.0', '0.0') + '<span>m</span>';
    drawRace();
}

const shared = query.get('c') && S.decode(query.get('c'));
if (shared) { presetKey = ''; restart(shared); } else restart();
markPreset(); how();
if (query.has('build')) setBuilding(true);
if (query.has('skip')) { skip = +query.get('skip'); pressGroup('skips', 'skip', skip); }
window.addEventListener('resize', drawChart);
requestAnimationFrame(frame);
