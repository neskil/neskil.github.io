// Paper Plane Glider — the page: fold, shape, fly.
//
// The plane is a list of fold steps (fold.js), folded from a fresh sheet
// every time anything changes: a step added, tuned, moved or deleted. So the
// timeline in the fold panel is the design, and the paper on the table, the
// live model beside it and the plane in the office are all just what that
// list folds into right now.
import {
    analyze, build, foldMirrored, resolveStep, recognise, describeStep, sameStep,
    DESIGNS, STEP_KINDS, encodeSteps, decodeSteps,
} from './fold.js';
import { makePlane, DEFAULT_TRIM, balanceWord, MISSIONS, dailyChallenge, inBin, fly as simulate } from './flight.js';
import { buildModel, sideSprite } from './model.js';
import { FoldView } from './foldview.js';
import { ShapeView } from './shapeview.js';
import { FlyView } from './flyview.js';

const $ = (id) => document.getElementById(id);

/* ── Saved state ── */
const KEY = 'paperplane.v3';
function loadJSON(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch (e) { return fallback; } }
const saved = loadJSON(KEY, {});
function persist() {
    try {
        localStorage.setItem(KEY, JSON.stringify({
            steps: state.steps, design: state.design, trim: state.trim, aim: fly.aim,
            missions: state.missions, hangar: state.hangar, mode: state.mode, mission: state.mission,
        }));
        localStorage.setItem('paperplane.best', JSON.stringify(state.best));
        localStorage.setItem('paperplane.daily', JSON.stringify(state.daily));
    } catch (e) { /* private mode: nothing is remembered */ }
}

const state = {
    step: 'fold',
    design: saved.design || 'dart',
    steps: Array.isArray(saved.steps) ? saved.steps : [],
    ok: [],
    paper: null,
    an: null,
    plane: null,
    model: null,
    trim: { ...DEFAULT_TRIM, ...(saved.trim || {}) },
    mirror: true,
    under: false,
    pending: null,      // a step chosen from the library or the guide, being animated
    mode: saved.mode || 'free',
    mission: saved.mission || MISSIONS[0].id,
    missions: saved.missions || {},
    best: loadJSON('paperplane.best', null),
    daily: loadJSON('paperplane.daily', null),
    challenge: dailyChallenge(new Date()),
    hangar: Array.isArray(saved.hangar) ? saved.hangar.filter(h => Array.isArray(h.steps)) : [],
};
if (state.best && !Array.isArray(state.best.path)) state.best = null;
if (!state.daily || state.daily.key !== state.challenge.key) state.daily = { key: state.challenge.key, error: null, binned: false };

/* ── Views ── */
const foldView = new FoldView($('fold-canvas'), {
    canFold: () => state.step === 'fold',
    mirror: () => state.mirror,
    onFold: (S, T, mirrored) => commitFold(S, T, mirrored),
    onMessage: (t) => say(t, 'warn'),
});
const liveView = new ShapeView($('live-canvas'), { labels: false });
const shapeView = new ShapeView($('shape-canvas'));
const fly = new FlyView($('fly-canvas'), {
    onAim: (aim) => { $('aim').textContent = `${aim.angle}° · ${aim.speed.toFixed(1)} m/s`; },
    onLanded: (r) => landed(r),
    onThrow: () => { $('banner').hidden = true; },
    ghost: () => (state.mode === 'free' ? state.best : null),
});
fly.setAim(saved.aim || {});

/* ── Folding ── */

/** Folds the whole design again from a fresh sheet and redraws everything
    that depends on it. */
function rebuild() {
    const r = build(state.steps);
    state.paper = r.paper;
    state.ok = r.ok;
    state.an = analyze(r.paper);
    foldView.setPaper(state.paper, state.an.cg);
    renderTimeline();
    updateGuide();
    updateFoldStats();
    refreshPlane();
}

/** A fold has been made on the table (dragged, or chosen and animated). */
function commitFold(S, T, mirrored) {
    let step = state.pending;
    state.pending = null;
    if (!step) {
        if (mirrored && foldMirrored(state.paper, S, T, state.under).error === 'crosses') {
            say('That crease would cross the middle. Turn mirroring off, or fold straight across.', 'warn');
            foldView.draw();
            return;
        }
        step = recognise(state.paper, S, T, mirrored, state.under);
    }
    const before = state.steps.length;
    state.steps = [...state.steps, step];
    rebuild();
    if (!state.ok[before]) {
        state.steps = state.steps.slice(0, before);
        rebuild();
        say('That would not fold anything.', 'warn');
        return;
    }
    flashRow(before);
    persist();
}

/** Plays a step's fold on the table, then adds it. */
function playStep(step) {
    const r = resolveStep(state.paper, step);
    if (!r) { say('There is nothing to fold for that here.', 'warn'); return; }
    state.pending = step;
    foldView.play(r.S, r.T, { mirrored: r.mirrored });
}

/** How far the sheet is along its design: the leading steps that match. */
function guideProgress() {
    const d = DESIGNS.find(x => x.id === state.design);
    if (!d) return { design: null, done: 0, own: state.steps.length > 0 };
    let k = 0;
    for (const st of state.steps) {
        if (!d.steps[k] || !sameStep(st, d.steps[k])) return { design: d, done: k, own: true };
        k++;
    }
    return { design: d, done: k, own: false };
}

function updateGuide() {
    const g = guideProgress();
    const box = $('guide');
    let show = false;
    if (!g.design) {
        foldView.setGuide(null);
        box.innerHTML = state.steps.length
            ? `<b>Your own design.</b> ${state.steps.length} fold${state.steps.length > 1 ? 's' : ''}. Tune them in the list, or keep folding.`
            : '<b>Free fold.</b> Drag any corner or edge of the sheet to where it should land, or add folds from the list.';
    } else if (g.own) {
        foldView.setGuide(null);
        box.innerHTML = `<b>Your own variation.</b> It started as a ${g.design.name}; the list is what you have now.`;
    } else if (g.done >= g.design.steps.length) {
        foldView.setGuide(null);
        box.innerHTML = `<b>${g.design.name} folded.</b> Tune any fold in the list and watch the model change, or fold it in half and shape it.`;
        $('to-shape').classList.add('pulse');
    } else {
        const st = g.design.steps[g.done];
        const r = resolveStep(state.paper, st);
        foldView.setGuide(r ? { S: r.S, T: r.T, mirrored: r.mirrored } : null);
        box.innerHTML = `<span class="step-no">Step ${g.done + 1} of ${g.design.steps.length}</span> ${st.say}`;
        show = !!r;
    }
    $('show-me').hidden = !show;
    document.querySelector('[data-act="show"]').hidden = !show;
    const no = box.querySelector('.step-no');
    $('guide-mini').textContent = (no ? no.textContent + ': ' : '') + [...box.childNodes].filter(n => n !== no).map(n => n.textContent).join('').trim();
}

/* ── The timeline: the design as a list you can edit ── */
function renderTimeline() {
    const list = $('timeline');
    list.textContent = '';
    if (!state.steps.length) {
        list.innerHTML = '<li class="tl-empty">No folds yet. A flat sheet tumbles: fold some paper towards the nose.</li>';
        return;
    }
    state.steps.forEach((st, i) => {
        const li = document.createElement('li');
        li.className = 'tl-row' + (state.ok[i] ? '' : ' tl-skipped');
        li.dataset.i = i;
        const head = document.createElement('div');
        head.className = 'tl-head';
        head.innerHTML = `<span class="tl-no">${i + 1}</span><span class="tl-name">${describeStep(st)}</span><span class="tl-badge">skipped</span>`;
        const tools = document.createElement('span');
        tools.className = 'tl-tools';
        const btn = (label, aria, fn, disabled) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'tl-btn';
            b.textContent = label;
            b.setAttribute('aria-label', aria);
            b.disabled = !!disabled;
            b.addEventListener('click', fn);
            tools.appendChild(b);
        };
        btn('▲', `Move fold ${i + 1} earlier`, () => moveStep(i, -1), i === 0);
        btn('▼', `Move fold ${i + 1} later`, () => moveStep(i, 1), i === state.steps.length - 1);
        btn('✕', `Remove fold ${i + 1}`, () => removeStep(i));
        head.appendChild(tools);
        li.appendChild(head);
        const kind = STEP_KINDS[st.kind];
        if (kind.param) {
            const range = document.createElement('input');
            range.type = 'range';
            range.min = kind.min;
            range.max = kind.max;
            range.step = kind.step;
            range.value = st[kind.param] ?? kind.def;
            range.setAttribute('aria-label', `${describeStep(st)}: ${kind.param === 'reach' ? 'how far' : 'how deep'}`);
            range.addEventListener('input', () => tuneStep(i, kind.param, +range.value));
            range.addEventListener('change', () => persist());
            li.appendChild(range);
        }
        list.appendChild(li);
    });
}

/* Tuning re-folds the sheet on every slider tick. The list itself is not
   rebuilt mid-drag (that would pull the slider out from under the pointer);
   only the labels and the skipped marks follow along. */
let tuneFrame = 0;
function tuneStep(i, param, value) {
    state.steps = state.steps.map((st, k) => (k === i ? { ...st, [param]: value } : st));
    cancelAnimationFrame(tuneFrame);
    tuneFrame = requestAnimationFrame(() => {
        const r = build(state.steps);
        state.paper = r.paper;
        state.ok = r.ok;
        state.an = analyze(r.paper);
        foldView.setPaper(state.paper, state.an.cg);
        document.querySelectorAll('#timeline .tl-row').forEach((row, k) => {
            row.classList.toggle('tl-skipped', !state.ok[k]);
            row.querySelector('.tl-name').textContent = describeStep(state.steps[k]);
        });
        updateGuide();
        updateFoldStats();
        refreshPlane();
    });
}

function moveStep(i, by) {
    const j = i + by;
    if (j < 0 || j >= state.steps.length) return;
    const steps = [...state.steps];
    [steps[i], steps[j]] = [steps[j], steps[i]];
    state.steps = steps;
    rebuild();
    flashRow(j);
    persist();
}

function removeStep(i) {
    state.steps = state.steps.filter((_, k) => k !== i);
    rebuild();
    persist();
}

function flashRow(i) {
    const row = document.querySelector(`#timeline .tl-row[data-i="${i}"]`);
    if (!row) return;
    row.classList.remove('tl-flash');
    void row.offsetWidth;
    row.classList.add('tl-flash');
}

document.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => {
    const kind = b.dataset.add;
    if (kind === 'under') { playStep({ kind: 'nose', d: 60, under: true }); return; }
    const def = STEP_KINDS[kind];
    playStep({ kind, [def.param]: def.def });
}));

function updateFoldStats() {
    const an = state.an;
    let maxLayers = 0;
    for (const v of an.layers) if (v > maxLayers) maxLayers = v;
    const len = an.bounds.y1 - an.bounds.y0;
    $('stat-folds').textContent = state.ok.filter(Boolean).length;
    $('stat-layers').textContent = maxLayers;
    $('stat-length').textContent = (len / 10).toFixed(1) + ' cm';
    $('stat-balance').textContent = Math.round((an.cg[1] - an.bounds.y0) / Math.max(1, len) * 100) + '% back';
    $('undo').disabled = !state.steps.length;
}

$('show-me').addEventListener('click', () => {
    const g = guideProgress();
    if (!g.design || g.own || g.done >= g.design.steps.length) return;
    const { say: _say, ...step } = g.design.steps[g.done];
    playStep(step);
});
document.querySelector('[data-act="show"]').addEventListener('click', () => $('show-me').click());
$('undo').addEventListener('click', () => { if (!state.steps.length) return; state.steps = state.steps.slice(0, -1); rebuild(); persist(); });
document.querySelector('[data-act="undo"]').addEventListener('click', () => $('undo').click());
document.querySelector('[data-act="next"]').addEventListener('click', () => go('shape'));
$('restart').addEventListener('click', () => { state.steps = []; rebuild(); persist(); say('A fresh sheet.'); });
$('mirror').addEventListener('click', () => { state.mirror = !state.mirror; syncToggles(); });
$('under').addEventListener('click', () => { state.under = !state.under; syncToggles(); });
function syncToggles() {
    $('mirror').setAttribute('aria-pressed', String(state.mirror));
    $('mirror').textContent = state.mirror ? '⇋ Mirror: on' : '⇋ Mirror: off';
    $('under').setAttribute('aria-pressed', String(state.under));
    $('under').textContent = state.under ? '↧ Fold under' : '↥ Fold over';
}

document.querySelectorAll('[data-design]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.design;
    if (id === state.design && !state.steps.length) return;
    state.design = id;
    const d = DESIGNS.find(x => x.id === id);
    if (d) state.trim.keel = d.keel;
    state.steps = [];
    syncTrimInputs();
    rebuild();
    syncDesigns();
    persist();
}));
function syncDesigns() {
    document.querySelectorAll('[data-design]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.design === state.design)));
    const d = DESIGNS.find(x => x.id === state.design);
    $('design-blurb').textContent = d ? d.blurb : 'No guide: invent your own plane. Corners, edges and the centre line are all things a fold can snap to.';
}

/* ── The plane, from whatever is folded right now ── */
function refreshPlane() {
    state.plane = makePlane(state.an, state.trim);
    state.model = buildModel(state.paper, state.an, state.trim);
    const markers = { cg: state.plane.info.cgY, ac: state.plane.info.acY };
    liveView.setModel(state.model, markers);
    shapeView.setModel(state.model, markers);
    fly.setPlane(state.plane, sideSprite(state.model));
    const i = state.plane.info;
    const b = balanceWord(i.margin);
    // A firm, flat-ish throw, flown for real: the number to beat while folding.
    const test = simulate(state.plane, 5, 8);
    $('live-balance').textContent = b.word;
    $('live-balance').dataset.word = b.word;
    $('live-glide').textContent = '1 : ' + i.glide.toFixed(1);
    $('live-dist').textContent = test.distance.toFixed(1) + ' m';
    $('live-dist').title = `On a 5°, 8 m/s throw with the current shaping${test.stalls > 3 ? ' — it stalls' : ''}`;

    $('sh-span').textContent = (i.span / 10).toFixed(1) + ' cm';
    $('sh-area').textContent = Math.round(i.area / 100) + ' cm²';
    $('sh-aspect').textContent = i.aspect.toFixed(2);
    $('sh-mass').textContent = (i.mass * 1000).toFixed(1) + ' g';
    $('sh-glide').textContent = '1 : ' + i.glide.toFixed(1);
    $('sh-balance').textContent = b.word;
    $('sh-hint').textContent = b.hint + (i.asymmetry > 0.03 ? ' It is lopsided, too, which costs it speed.' : '');
    $('gauge-dot').style.left = (Math.max(0, Math.min(1, (i.margin + 0.15) / 0.5)) * 100) + '%';
    $('keel-val').textContent = i.keel + ' mm';
    const e = state.trim.elevator;
    $('elev-val').textContent = Math.abs(e) < 0.05 ? 'Flat' : e > 0 ? `${Math.round(e * 18)}° up` : `${Math.round(-e * 18)}° down`;
    $('clips-val').textContent = state.trim.clips ? `${state.trim.clips} clip${state.trim.clips > 1 ? 's' : ''}` : 'None';
    $('winglets').setAttribute('aria-pressed', String(state.trim.winglets));
}

$('keel').addEventListener('input', () => { state.trim.keel = +$('keel').value; refreshPlane(); persist(); });
$('elevator').addEventListener('input', () => { state.trim.elevator = +$('elevator').value; refreshPlane(); persist(); });
$('clips').addEventListener('input', () => { state.trim.clips = +$('clips').value; refreshPlane(); persist(); });
$('winglets').addEventListener('click', () => { state.trim.winglets = !state.trim.winglets; refreshPlane(); persist(); });
function syncTrimInputs() {
    $('keel').value = state.trim.keel;
    $('elevator').value = state.trim.elevator;
    $('clips').value = state.trim.clips;
}

/* ── Flying ── */
function world() {
    if (state.mode === 'daily') return { fans: state.challenge.fans, bin: { x: state.challenge.bin, width: state.challenge.binWidth } };
    if (state.mode === 'missions') return MISSIONS.find(m => m.id === state.mission).world;
    return {};
}

function setMode(m) {
    state.mode = m;
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    fly.setWorld(world());
    $('missions').hidden = m !== 'missions';
    renderMissions();
    updateBoard();
    persist();
}
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

function renderMissions() {
    const box = $('mission-list');
    box.textContent = '';
    for (const m of MISSIONS) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mission';
        b.setAttribute('aria-pressed', String(m.id === state.mission));
        b.innerHTML = `<span class="tick">${state.missions[m.id] ? '★' : '☆'}</span><span>${m.name}</span>`;
        b.title = m.goal;
        b.addEventListener('click', () => { state.mission = m.id; fly.setWorld(world()); renderMissions(); updateBoard(); persist(); });
        box.appendChild(b);
    }
    const done = MISSIONS.filter(m => state.missions[m.id]).length;
    $('mission-count').textContent = `${done}/${MISSIONS.length}`;
    $('mission-goal').textContent = MISSIONS.find(m => m.id === state.mission).goal;
}

function updateBoard() {
    const r = fly.last;
    $('last').textContent = r ? `${r.distance.toFixed(1)} m` : '—';
    $('air').textContent = r ? `${r.time.toFixed(1)} s` : '—';
    if (state.mode === 'free') {
        $('goal-label').textContent = 'Longest throw';
        $('goal').textContent = state.best ? `${state.best.distance.toFixed(1)} m` : '—';
    } else if (state.mode === 'daily') {
        $('goal-label').textContent = `Today’s bin · ${state.challenge.bin.toFixed(1)} m`;
        $('goal').textContent = state.daily.binned ? '🎯 In!' : state.daily.error != null ? `${state.daily.error.toFixed(2)} m off` : '—';
    } else {
        $('goal-label').textContent = 'Missions';
        $('goal').textContent = `${MISSIONS.filter(m => state.missions[m.id]).length} / ${MISSIONS.length} ★`;
    }
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

function landed(r) {
    let msg = `${r.distance.toFixed(1)} m in ${r.time.toFixed(1)} s`;
    let kind = '';
    if (state.mode === 'free') {
        if (!state.best || r.distance > state.best.distance) {
            state.best = { distance: r.distance, path: r.path.filter((_, i) => i % 2 === 0) };
            msg = `New best · ${msg}`;
            kind = 'best';
        }
    } else if (state.mode === 'daily') {
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
    } else {
        const m = MISSIONS.find(x => x.id === state.mission);
        if (m.check(r, m.world)) {
            const first = !state.missions[m.id];
            state.missions[m.id] = true;
            msg = `★ ${m.name}${first ? ' — done!' : ''}`;
            kind = 'best';
            renderMissions();
        } else {
            msg = `${m.goal.replace(/\.$/, '')}: not yet · ${msg}`;
        }
    }
    if (kind !== 'best') {
        if (r.stalls > 3) msg += ' · it stalled — move weight forward or bend the elevator down';
        else if (r.bonks) msg += ' · bonked the ceiling';
    }
    banner(msg, kind);
    updateBoard();
    persist();
}

$('throw').addEventListener('click', () => fly.throwIt());
window.addEventListener('keydown', (e) => {
    if (state.step !== 'fly' || e.target.closest('input')) return;
    const a = fly.aim;
    if (e.key === ' ' || e.key === 'Enter') { fly.throwIt(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { fly.setAim({ angle: Math.min(60, a.angle + 1) }); e.preventDefault(); }
    else if (e.key === 'ArrowDown') { fly.setAim({ angle: Math.max(-15, a.angle - 1) }); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { fly.setAim({ speed: Math.min(12, Math.round((a.speed + 0.2) * 10) / 10) }); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { fly.setAim({ speed: Math.max(2, Math.round((a.speed - 0.2) * 10) / 10) }); e.preventDefault(); }
});

/* ── The hangar: planes you have kept ── */
function renderHangar() {
    const box = $('hangar-list');
    box.textContent = '';
    if (!state.hangar.length) {
        box.innerHTML = '<p class="note">Planes you keep land here.</p>';
        return;
    }
    state.hangar.forEach((h, i) => {
        const row = document.createElement('div');
        row.className = 'hangar-row';
        const load = document.createElement('button');
        load.type = 'button';
        load.className = 'chip';
        load.textContent = `✈ ${h.name}`;
        load.title = h.steps.map(describeStep).join(' → ');
        load.addEventListener('click', () => {
            state.steps = h.steps;
            state.trim = { ...DEFAULT_TRIM, ...h.trim };
            state.design = h.design || 'free';
            syncDesigns();
            syncTrimInputs();
            rebuild();
            say(`${h.name} is back on the table.`);
            persist();
        });
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'chip chip-x';
        del.textContent = '✕';
        del.setAttribute('aria-label', `Throw away ${h.name}`);
        del.addEventListener('click', () => { state.hangar.splice(i, 1); renderHangar(); persist(); });
        row.append(load, del);
        box.appendChild(row);
    });
}

$('keep').addEventListener('click', () => {
    const d = DESIGNS.find(x => x.id === state.design);
    const g = guideProgress();
    const base = d && !g.own ? d.name : 'My plane';
    const n = state.hangar.filter(h => h.name.startsWith(base)).length + 1;
    state.hangar.unshift({ name: n > 1 ? `${base} ${n}` : base, steps: state.steps, trim: { ...state.trim }, design: state.design });
    state.hangar = state.hangar.slice(0, 8);
    renderHangar();
    persist();
    say('Kept in the hangar.');
});

$('share').addEventListener('click', async () => {
    const t = state.trim;
    const url = new URL(location.href);
    url.search = '';
    url.searchParams.set('plane', encodeSteps(state.steps));
    url.searchParams.set('trim', [t.keel, t.elevator, t.winglets ? 1 : 0, t.clips].join(','));
    try {
        await navigator.clipboard.writeText(url.toString());
        say('Link copied: whoever opens it gets this exact plane.');
    } catch (e) {
        say('Copy this: ' + url.toString());
    }
});

/* ── The page's three steps ── */
function go(step) {
    state.step = step;
    document.querySelectorAll('[data-step]').forEach(b => b.setAttribute('aria-current', String(b.dataset.step === step)));
    for (const s of ['fold', 'shape', 'fly']) $(`step-${s}`).hidden = s !== step;
    liveView.visible = step === 'fold';
    shapeView.visible = step === 'shape';
    fly.visible = step === 'fly';
    refreshPlane();
    if (step === 'shape') { shapeView.fit(); shapeView.spin = true; }
    if (step === 'fly') { fly.fit(); fly.setWorld(world()); updateBoard(); }
    if (step === 'fold') { foldView.fit(); liveView.fit(); $('to-shape').classList.remove('pulse'); }
    window.scrollTo({ top: 0 });
}
document.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => go(b.dataset.step)));
$('to-shape').addEventListener('click', () => go('shape'));
$('to-fly').addEventListener('click', () => go('fly'));
$('back-fold').addEventListener('click', () => go('fold'));
$('back-shape').addEventListener('click', () => go('shape'));

let sayTimer = null;
function say(text, kind = '') {
    const t = $('toast');
    t.textContent = text;
    t.dataset.kind = kind;
    t.hidden = false;
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => { t.hidden = true; }, 3200);
}

/* ── Start ── */
const q = new URLSearchParams(location.search);
if (q.has('plane')) {
    const steps = decodeSteps(q.get('plane'));
    if (steps) { state.steps = steps; state.design = 'free'; }
    const t = (q.get('trim') || '').split(',').map(Number);
    if (t.length === 4 && t.every(Number.isFinite)) state.trim = { keel: t[0], elevator: t[1], winglets: t[2] === 1, clips: t[3] };
}
if (q.has('design')) {
    const d = DESIGNS.find(x => x.id === q.get('design'));
    if (d) {
        state.design = d.id;
        state.trim.keel = d.keel;
        const upto = Math.min(d.steps.length, Number(q.get('steps') ?? d.steps.length));
        state.steps = d.steps.slice(0, upto).map(({ say: _s, ...st }) => st);
    }
}
syncDesigns();
syncToggles();
syncTrimInputs();
renderHangar();
rebuild();
setMode(['free', 'missions', 'daily'].includes(q.get('mode')) ? q.get('mode') : state.mode);
if (q.has('mission') && MISSIONS.some(m => m.id === q.get('mission'))) { state.mission = q.get('mission'); fly.setWorld(world()); renderMissions(); }
go(['fold', 'shape', 'fly'].includes(q.get('step')) ? q.get('step') : 'fold');
if (q.has('throw') && state.step === 'fly') {
    const [a, sp] = q.get('throw').split(',').map(Number);
    if (Number.isFinite(a) && Number.isFinite(sp)) { fly.setAim({ angle: a, speed: sp }); setTimeout(() => fly.throwIt(), 300); }
}
