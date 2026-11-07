// USA Quiz Night — the page. Rules live in game.js; this file draws them,
// talks and listens if asked to, and keeps everything worth keeping in
// localStorage: the game in progress (a reload mid-quiz loses nothing), the
// undo history, which questions have been asked, and the all-time table.

import * as G from './game.js';
import { QUESTIONS, CATEGORIES } from './questions.js';

const $ = (id) => document.getElementById(id);
const COLORS = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#fb923c'];
const LENGTHS = [
    { rounds: 3, label: 'Quick' },
    { rounds: 5, label: 'Normal' },
    { rounds: 8, label: 'Long' },
    { rounds: 12, label: 'Marathon' },
];
const KEYS = {
    game: 'usa-quiz.game',
    undo: 'usa-quiz.undo',
    setup: 'usa-quiz.setup',
    seen: 'usa-quiz.seen',
    stats: 'usa-quiz.stats',
    sound: 'usa-quiz.sound',
    voice: 'usa-quiz.voice',
};
const UNDO_DEPTH = 30;

// Storage can throw (private mode, blocked site data); the game must still run.
const store = {
    get(k, fallback) {
        try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const initial = (name) => esc((name.trim()[0] || '?').toUpperCase());
const possessive = (name) => esc(name) + (/s$/i.test(name) ? '’' : '’s');
const fine = () => matchMedia('(pointer: fine)').matches;

// ── Setup state ─────────────────────────────────────────────────────────

const allCats = Object.keys(CATEGORIES);
let setup = store.get(KEYS.setup, null) || {};
{
    const names = Array.isArray(setup.names) && setup.names.length >= G.MIN_PLAYERS ? setup.names.slice(0, G.MAX_PLAYERS) : G.DEFAULT_PLAYERS.slice();
    const levels = names.map((_, i) => (Array.isArray(setup.levels) && G.LEVELS.includes(setup.levels[i]) ? setup.levels[i] : 'mix'));
    setup = {
        names,
        levels,
        starter: setup.starter === 'first' ? 'first' : 'random',
        rounds: LENGTHS.some((l) => l.rounds === setup.rounds) ? setup.rounds : 5,
        cats: Array.isArray(setup.cats) && setup.cats.some((c) => allCats.includes(c)) ? setup.cats.filter((c) => allCats.includes(c)) : allCats.slice(),
    };
}
const saveSetup = () => store.set(KEYS.setup, setup);

let game = G.repair(store.get(KEYS.game, null), QUESTIONS);
let undo = game ? store.get(KEYS.undo, []) : [];
let soundOn = store.get(KEYS.sound, true);
let voiceOn = store.get(KEYS.voice, false);

const bankIds = new Set(QUESTIONS.map((q) => q.id));
const getSeen = () => store.get(KEYS.seen, []).filter((id) => bankIds.has(id));

// ── Sound: tiny synth blips, no files ───────────────────────────────────

let audio = null;
function blip(kind) {
    if (!soundOn) return;
    try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        const notes = { right: [523, 659, 784], star: [523, 659, 784, 1047], wrong: [196, 147], end: [392, 523, 659, 784, 1047] }[kind];
        const t0 = audio.currentTime;
        notes.forEach((f, i) => {
            const o = audio.createOscillator();
            const g = audio.createGain();
            o.type = kind === 'wrong' ? 'sawtooth' : 'triangle';
            o.frequency.value = f;
            const t = t0 + i * (kind === 'wrong' ? 0.16 : 0.09);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(kind === 'wrong' ? 0.06 : 0.12, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
            o.connect(g).connect(audio.destination);
            o.start(t);
            o.stop(t + 0.3);
        });
    } catch { /* no audio, no problem */ }
}

// ── Voice out: the quiz reads aloud ─────────────────────────────────────

const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
let voice = null;
function pickVoice() {
    if (!synth) return null;
    const all = synth.getVoices();
    return all.find((v) => v.lang === 'en-US' && /natural|google|samantha|aria|jenny/i.test(v.name))
        || all.find((v) => v.lang === 'en-US')
        || all.find((v) => v.lang && v.lang.startsWith('en'))
        || null;
}
if (synth) synth.addEventListener?.('voiceschanged', () => { voice = pickVoice(); });

/** Speak; each call replaces what is being said unless `queue` is set. */
function say(text, queue = false) {
    if (!voiceOn || !synth || !text) return;
    if (!queue) synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[★⭐🌟🎉👉➜]/gu, ''));
    voice = voice || pickVoice();
    if (voice) u.voice = voice;
    u.lang = 'en-US';
    u.rate = 1;
    synth.speak(u);
}
const sayChoices = (queue) => say(game.choices
    .map((c, i) => (game.struck.includes(c) ? '' : `${i + 1}: ${c}.`)).filter(Boolean).join(' '), queue);

// ── Voice in: say the answer ────────────────────────────────────────────

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let listening = null;

/** Listen once; `onText(final)` gets the best guess, `onPart` the words so far. */
function listen(button, onText, onPart = () => {}) {
    if (!SR) return;
    if (listening) { listening.stop(); return; }
    if (synth) synth.cancel();
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let heard = '';
    rec.onresult = (e) => {
        heard = Array.from(e.results).map((r) => r[0].transcript).join(' ').trim();
        onPart(heard);
    };
    rec.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('The microphone is blocked for this page');
        else if (e.error === 'no-speech') toast('Didn’t hear anything. Try again?');
    };
    rec.onend = () => {
        listening = null;
        document.querySelectorAll('.mic').forEach((b) => b.classList.remove('live'));
        if (heard) onText(heard);
    };
    listening = rec;
    button.classList.add('live');
    try { rec.start(); } catch { listening = null; button.classList.remove('live'); }
}

// ── Top-bar switches ────────────────────────────────────────────────────

function renderSwitches() {
    $('sound').textContent = soundOn ? '🔊' : '🔇';
    $('sound').setAttribute('aria-pressed', String(soundOn));
    $('voice').hidden = !synth;
    $('voice').setAttribute('aria-pressed', String(voiceOn));
    $('voice').classList.toggle('on', voiceOn);
    $('reread').hidden = !(synth && voiceOn);
    $('mic').hidden = !SR;
    if (game && !$('play').hidden && game.phase === 'ask') $('mic-choice').hidden = G.starOpen(game, QUESTIONS) || !SR;
}
$('sound').addEventListener('click', () => {
    soundOn = !soundOn;
    store.set(KEYS.sound, soundOn);
    renderSwitches();
});
$('voice').addEventListener('click', () => {
    voiceOn = !voiceOn;
    store.set(KEYS.voice, voiceOn);
    renderSwitches();
    if (voiceOn) say(game && !$('play').hidden ? 'Reading aloud.' : 'Reading aloud. Have fun!');
    else if (synth) synth.cancel();
});

// ── Little effects ──────────────────────────────────────────────────────

let toastTimer;
function toast(html, ms = 2200) {
    const el = $('toast');
    el.innerHTML = html;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

function confetti(count = 60) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#ef4444', '#f8fafc', '#3b82f6', '#fbbf24'];
    for (let i = 0; i < count; i++) {
        const el = document.createElement('i');
        el.className = 'confetti';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.background = colors[i % colors.length];
        el.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
        el.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
        el.style.animationDuration = (1.8 + Math.random() * 1.6) + 's';
        el.style.animationDelay = Math.random() * 0.4 + 's';
        el.style.borderRadius = Math.random() < 0.4 ? '50%' : '2px';
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
    }
}

function shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
}

function show(screen) {
    for (const id of ['setup', 'play', 'over']) $(id).hidden = id !== screen;
    window.scrollTo({ top: 0 });
}

// ── Setup screen ────────────────────────────────────────────────────────

function renderSetup() {
    $('bank-size').textContent = QUESTIONS.length;
    $('resume-box').hidden = !(game && game.phase !== 'over');

    const n = setup.names.length;
    $('players').innerHTML = setup.names.map((name, i) => `
        <div class="player-row" style="--pc:${COLORS[i]}">
            <div class="move">
                <button type="button" data-up="${i}" aria-label="Move ${esc(name)} up" ${i === 0 ? 'disabled' : ''}>▲</button>
                <button type="button" data-down="${i}" aria-label="Move ${esc(name)} down" ${i === n - 1 ? 'disabled' : ''}>▼</button>
            </div>
            <span class="dot">${initial(name)}</span>
            <input type="text" value="${esc(name)}" data-i="${i}" maxlength="16" aria-label="Player ${i + 1} name">
            <select data-level="${i}" aria-label="${possessive(name)} difficulty">
                ${G.LEVELS.map((l) => `<option value="${l}" ${setup.levels[i] === l ? 'selected' : ''}>${G.LEVEL_NAMES[l]}</option>`).join('')}
            </select>
            ${n > G.MIN_PLAYERS ? `<button type="button" class="remove" data-rm="${i}" aria-label="Remove ${esc(name)}">✕</button>` : '<span></span>'}
        </div>`).join('');
    $('add-player').hidden = n >= G.MAX_PLAYERS;

    $('starters').innerHTML = [['random', '🎲 Random'], ['first', `👆 ${esc(setup.names[0].trim() || 'Player 1')} (top of the list)`]]
        .map(([v, label]) => `<button type="button" class="chip" data-starter="${v}" aria-pressed="${setup.starter === v}">${label}</button>`).join('');

    $('lengths').innerHTML = LENGTHS.map((l) =>
        `<button type="button" class="chip" data-rounds="${l.rounds}" aria-pressed="${l.rounds === setup.rounds}">${l.label}<small>${l.rounds * n} q</small></button>`).join('');
    $('length-hint').textContent = `${setup.rounds} rounds: everyone starts ${setup.rounds} questions, ${setup.rounds * n} in all.`;

    $('cats').innerHTML = allCats.map((c) => {
        const count = QUESTIONS.filter((q) => q.c === c).length;
        return `<button type="button" class="chip" data-cat="${c}" aria-pressed="${setup.cats.includes(c)}">${CATEGORIES[c].icon} ${CATEGORIES[c].name}<small>${count}</small></button>`;
    }).join('');

    renderStats();
}

function renderStats() {
    const seen = new Set(getSeen());
    const asked = QUESTIONS.filter((q) => seen.has(q.id));
    const pct = Math.round((asked.length / QUESTIONS.length) * 100);
    const byLevel = [1, 2, 3].map((d) => {
        const all = QUESTIONS.filter((q) => q.d === d);
        return `${G.LEVEL_NAMES[d]} ${all.filter((q) => seen.has(q.id)).length}/${all.length}`;
    }).join(' · ');
    $('asked').innerHTML = `
        <div class="asked-line"><span>Questions asked so far</span><b>${asked.length} of ${QUESTIONS.length}</b></div>
        <div class="progress"><i style="width:${pct}%"></i></div>
        <p class="hint">${byLevel}. New ones always come first; when a level runs out, the ones asked longest ago come back.</p>`;

    const stats = store.get(KEYS.stats, { games: 0, players: {} });
    const rows = Object.entries(stats.players)
        .map(([name, r]) => ({ name, ...r }))
        .sort((a, b) => b.wins - a.wins || (b.points + b.stars) - (a.points + a.stars));
    $('hall').innerHTML = rows.length ? `
        <table>
            <thead><tr><th>Player</th><th title="Games">Games</th><th title="Wins">🏆</th><th title="Points">Pts</th><th title="Stars">⭐</th></tr></thead>
            <tbody>${rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${r.games}</td><td>${r.wins}</td><td>${r.points}</td><td>${r.stars}</td></tr>`).join('')}</tbody>
        </table>
        <p class="hint">${stats.games} game${stats.games === 1 ? '' : 's'} finished on this device.</p>`
        : '<p class="hint">No games finished yet. The all-time table fills in here.</p>';
    $('reset-asked').disabled = !asked.length;
    $('reset-scores').disabled = !rows.length;
}

$('players').addEventListener('input', (e) => {
    const i = Number(e.target.dataset.i);
    if (Number.isNaN(i)) return;
    setup.names[i] = e.target.value;
    e.target.parentElement.querySelector('.dot').textContent = (e.target.value.trim()[0] || '?').toUpperCase();
    saveSetup();
    if (i === 0) $('starters').querySelector('[data-starter="first"]').textContent = `👆 ${e.target.value.trim() || 'Player 1'} (top of the list)`;
});
$('players').addEventListener('change', (e) => {
    const i = Number(e.target.dataset.level);
    if (Number.isNaN(i)) return;
    const v = e.target.value;
    setup.levels[i] = v === 'mix' ? 'mix' : Number(v);
    saveSetup();
});
$('players').addEventListener('click', (e) => {
    const swap = (a, b) => {
        for (const key of ['names', 'levels']) [setup[key][a], setup[key][b]] = [setup[key][b], setup[key][a]];
        saveSetup();
        renderSetup();
    };
    const up = e.target.closest('[data-up]');
    if (up) return swap(Number(up.dataset.up), Number(up.dataset.up) - 1);
    const down = e.target.closest('[data-down]');
    if (down) return swap(Number(down.dataset.down), Number(down.dataset.down) + 1);
    const rm = e.target.closest('[data-rm]');
    if (!rm) return;
    setup.names.splice(Number(rm.dataset.rm), 1);
    setup.levels.splice(Number(rm.dataset.rm), 1);
    saveSetup();
    renderSetup();
});
$('add-player').addEventListener('click', () => {
    if (setup.names.length >= G.MAX_PLAYERS) return;
    setup.names.push('');
    setup.levels.push('mix');
    saveSetup();
    renderSetup();
    $('players').querySelector(`input[data-i="${setup.names.length - 1}"]`).focus();
});
$('starters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-starter]');
    if (!b) return;
    setup.starter = b.dataset.starter;
    saveSetup();
    renderSetup();
});
$('lengths').addEventListener('click', (e) => {
    const b = e.target.closest('[data-rounds]');
    if (!b) return;
    setup.rounds = Number(b.dataset.rounds);
    saveSetup();
    renderSetup();
});
$('cats').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    const c = b.dataset.cat;
    if (setup.cats.includes(c)) {
        if (setup.cats.length === 1) return toast('Keep at least one category');
        setup.cats = setup.cats.filter((x) => x !== c);
    } else setup.cats.push(c);
    saveSetup();
    renderSetup();
});
$('reset-asked').addEventListener('click', () => {
    if (!confirm('Forget which questions have been asked? They can all come up again.')) return;
    store.del(KEYS.seen);
    renderStats();
    toast('Asked questions forgotten');
});
$('reset-scores').addEventListener('click', () => {
    if (!confirm('Clear the all-time table of games, wins, points and stars?')) return;
    store.del(KEYS.stats);
    renderStats();
    toast('Scores reset');
});

function startGame() {
    const names = setup.names.map((n, i) => n.trim() || `Player ${i + 1}`);
    const count = setup.rounds * names.length;
    const pool = QUESTIONS.filter((q) => setup.cats.includes(q.c));
    // Fewer questions than asked for in a narrow pick: trim to whole rounds.
    const usable = Math.min(count, pool.length - (pool.length % names.length));
    if (usable < names.length) return toast('Not enough questions in those categories');
    const starter = setup.starter === 'first' ? 0 : Math.floor(Math.random() * names.length);
    const order = G.pickQuestions(QUESTIONS, {
        count: usable,
        cats: setup.cats,
        seen: getSeen(),
        levels: G.slotLevels(setup.levels, starter, usable),
    });
    game = G.newGame({ names, order, bank: QUESTIONS, starter });
    undo = [];
    save();
    show('play');
    renderPlay(true);
    toast(`${esc(names[game.starter])} starts! 🎬`);
}
$('start').addEventListener('click', startGame);
$('resume').addEventListener('click', () => {
    if (!game) return;
    if (game.phase === 'over') { show('over'); renderOver(); return; }
    show('play');
    renderPlay(true);
});

function save() {
    store.set(KEYS.game, game);
    store.set(KEYS.undo, undo);
}

/** Remember a question as asked, most recent last (so the oldest come back first). */
function markSeen(id) {
    const seen = getSeen().filter((x) => x !== id);
    seen.push(id);
    store.set(KEYS.seen, seen);
}

/** Snapshot the game before a move, so Undo can put it back. */
function checkpoint() {
    undo.push(JSON.stringify(game));
    if (undo.length > UNDO_DEPTH) undo.shift();
}

// ── Play screen ─────────────────────────────────────────────────────────

function renderBoard(bump = -1) {
    const n = game.players.length;
    const b = $('board');
    b.style.setProperty('--n', n);
    b.style.setProperty('--cols', n > 4 ? Math.ceil(n / 2) : n);
    const on = game.phase === 'ask' ? G.currentPlayer(game) : -1;
    b.innerHTML = game.players.map((p, i) => `
        <div class="score${i === on ? ' on' : ''}${i === bump ? ' bump' : ''}" style="--pc:${COLORS[i]}">
            <div class="name">${esc(p.name)}</div>
            <div class="pts">${G.total(p)}</div>
            <div class="stars">${p.stars ? '⭐'.repeat(Math.min(p.stars, 5)) + (p.stars > 5 ? '×' + p.stars : '') : ''}</div>
        </div>`).join('');
}

function renderLog() {
    $('log').innerHTML = game.attempts.map((a) => {
        const p = game.players[a.player];
        const dot = `<span class="dot mini" style="--pc:${COLORS[a.player]}">${initial(p.name)}</span>`;
        let what;
        if (a.mode === 'pass') what = `${esc(p.name)} passed`;
        else if (a.mode === 'free') what = `${esc(p.name)} answered <q>${esc(a.text)}</q>`;
        else what = `${esc(p.name)} picked <q>${esc(a.text)}</q>`;
        const mark = a.right ? `<span class="good">✓${a.mode === 'free' ? ' ⭐' : ''}${a.credited ? ' (counted)' : ''}</span>` : a.mode === 'pass' ? '' : '<span class="bad">✗</span>';
        return `<li>${dot}<span>${what}</span>${mark}</li>`;
    }).join('');
}

function renderPlay(enter = false, bump = -1) {
    const q = G.question(game, QUESTIONS);
    const cat = CATEGORIES[q.c];
    $('qcat').textContent = `${cat.icon} ${cat.name}`;
    $('qlevel').textContent = G.LEVEL_NAMES[q.d];
    $('qlevel').dataset.d = q.d;
    $('qnum').textContent = `Question ${game.qi + 1} of ${game.order.length}`;
    $('qprog').style.width = (game.qi / game.order.length) * 100 + '%';
    $('qtext').textContent = q.q;
    $('undo').disabled = !undo.length;
    renderBoard(bump);
    renderLog();

    const asking = game.phase === 'ask';
    $('ask').hidden = !asking;
    $('result').hidden = asking;

    if (asking) {
        const fresh = !game.attempts.length;
        if (fresh) markSeen(q.id);
        const pi = G.currentPlayer(game);
        const p = game.players[pi];
        const turn = $('turn');
        turn.style.setProperty('--pc', COLORS[pi]);
        const starOpen = G.starOpen(game, QUESTIONS);
        const sub = game.turn === 0
            ? (starOpen ? 'Type or say it for a star, or open the alternatives.' : 'Pick one of the alternatives.')
            : `Passed on from ${esc(game.players[(pi - 1 + game.players.length) % game.players.length].name)}. Still worth a point.`;
        turn.innerHTML = `<span class="dot">${initial(p.name)}</span><div><div class="who">${possessive(p.name)} turn</div><div class="sub">${sub}</div></div>`;
        if (enter) {
            turn.classList.remove('enter');
            void turn.offsetWidth;
            turn.classList.add('enter');
        }

        $('free-zone').hidden = !starOpen;
        const choices = $('choices');
        choices.hidden = starOpen;
        $('mic-choice').hidden = starOpen || !SR;
        if (!starOpen) {
            choices.innerHTML = game.choices.map((c, i) => {
                const struck = game.struck.includes(c);
                const by = struck ? game.attempts.find((a) => a.mode === 'choice' && a.text === c) : null;
                return `<button type="button" class="choice" data-choice="${i}" ${struck ? 'disabled' : ''}>
                    <span class="key">${i + 1}</span><span class="txt">${esc(c)}</span>
                    ${by ? `<span class="tag">✗ ${esc(game.players[by.player].name)}</span>` : ''}
                </button>`;
            }).join('');
        }
        $('nostar').textContent = starOpen ? '' : (q.choiceOnly ? 'Alternatives only on this one.' : 'Alternatives are out: no star this time.');
        if (starOpen) {
            $('free-input').value = '';
            // Don't pop the phone keyboard up over the question unasked.
            if (fine()) $('free-input').focus();
        }
        if (enter && fresh) {
            say(`${p.name}, question ${game.qi + 1}. ${q.q}`);
            if (!starOpen) sayChoices(true);
        }
    } else {
        renderResult();
    }
}

function renderResult() {
    const q = G.question(game, QUESTIONS);
    const last = game.qi + 1 >= game.order.length;
    const nextStarter = game.players[(game.starter + 1) % game.players.length];
    let verdict;
    if (game.winner !== null) {
        const p = game.players[game.winner];
        const won = game.attempts.find((a) => a.right);
        const star = won && won.mode === 'free';
        verdict = `<div class="verdict win"><span class="big">${star ? '🌟' : '🎉'}</span><div>
            <div class="who">${esc(p.name)} got it!</div>
            <div class="sub">${star ? '+1 point and a ⭐ star, with no alternatives' : '+1 point'}</div></div></div>`;
    } else {
        const ended = game.attempts.length < game.players.length;
        verdict = `<div class="verdict lose"><span class="big">🙈</span><div>
            <div class="who">${ended ? 'Only one alternative left' : 'Nobody got it'}</div>
            <div class="sub">${ended ? 'That would be a free point, so the question ends here.' : 'No points on this one.'}</div></div></div>`;
    }
    const credits = game.winner === null
        ? game.attempts.map((a, i) => a.mode === 'free' && !a.right
            ? `<button type="button" data-credit="${i}">Was ${possessive(game.players[a.player].name)} <q>${esc(a.text)}</q> right after all? Tap to count it ⭐</button>` : '').join('')
        : '';
    $('result').innerHTML = `
        ${verdict}
        <p class="answer-line">The answer<b>${esc(q.a)}</b></p>
        ${q.f ? `<div class="fact"><span>💡</span><div><b>Did you know?</b>${esc(q.f)}</div></div>` : ''}
        ${credits ? `<div class="credit">${credits}</div>` : ''}
        <button type="button" class="btn btn-blue next" id="next">${last ? 'See who won 🏆' : `Next question ➜ ${esc(nextStarter.name)} starts`}</button>`;
    if (fine()) $('next').focus();
}

/** What the quiz says once a question is decided. */
function sayResult() {
    const q = G.question(game, QUESTIONS);
    if (game.winner !== null) {
        const p = game.players[game.winner];
        const star = game.attempts.find((a) => a.right)?.mode === 'free';
        say(`Correct! ${p.name} gets a point${star ? ' and a star' : ''}. The answer is ${q.a}.`);
    } else {
        say(`Nobody got it. The answer is ${q.a}.`);
    }
    if (q.f) say(q.f, true);
}

/** After any move: save, sound, speech, and redraw. */
function afterMove(right, kind, player) {
    save();
    if (right) {
        $('toast').classList.remove('show');
        blip(kind === 'free' ? 'star' : 'right');
        confetti(kind === 'free' ? 90 : 45);
        renderPlay(false, player);
        sayResult();
        return;
    }
    blip('wrong');
    shake($('qcard'));
    if (game.phase === 'ask') {
        const next = game.players[G.currentPlayer(game)];
        const line = kind === 'pass' ? `Passed. Over to ${next.name}!` : `Wrong! Over to ${next.name}.`;
        toast(esc(line) + (kind === 'pass' ? '' : ' 👉'));
        say(line);
    } else {
        sayResult();
    }
    renderPlay(true);
}

$('free-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('free-input').value;
    if (!text.trim()) { $('free-input').focus(); return; }
    const player = G.currentPlayer(game);
    const before = JSON.stringify(game);
    const right = G.answerFree(game, QUESTIONS, text);
    if (right === null) return;
    undo.push(before);
    if (undo.length > UNDO_DEPTH) undo.shift();
    afterMove(right, 'free', player);
});

$('show-alts').addEventListener('click', () => {
    checkpoint();
    G.showAlternatives(game);
    save();
    renderPlay();
    sayChoices();
});

$('choices').addEventListener('click', (e) => {
    const b = e.target.closest('[data-choice]');
    if (!b || b.disabled) return;
    pick(Number(b.dataset.choice));
});

function pick(i) {
    const choice = game.choices[i];
    const player = G.currentPlayer(game);
    const before = JSON.stringify(game);
    const right = G.answerChoice(game, QUESTIONS, choice);
    if (right === null) return;
    undo.push(before);
    if (undo.length > UNDO_DEPTH) undo.shift();
    afterMove(right, 'choice', player);
}

$('pass').addEventListener('click', () => {
    checkpoint();
    G.pass(game);
    afterMove(false, 'pass');
});

// Say a typed answer: what was heard goes into the box to be checked and
// fixed before it is sent, since speech recognition mishears names.
$('mic').addEventListener('click', (e) => {
    const input = $('free-input');
    listen(e.currentTarget, (text) => {
        input.value = text;
        input.focus();
        toast('Check it, fix it if it misheard, then press Answer', 2600);
    }, (part) => { input.value = part; });
});

// Say an alternative: "Alaska", or "number three".
$('mic-choice').addEventListener('click', (e) => {
    listen(e.currentTarget, (text) => {
        const open = game.choices.map((c, i) => (game.struck.includes(c) ? -1 : i)).filter((i) => i >= 0);
        const i = G.matchSpoken(game.choices, open, text);
        if (i < 0) {
            toast(`Heard “${esc(text)}”, which isn’t one of them. Try again, or tap one.`, 2800);
            say('Sorry, which one?');
            return;
        }
        toast(`Heard “${esc(text)}”`, 1400);
        pick(i);
    }, (part) => toast(`🎙️ ${esc(part)}…`, 1500));
});

$('reread').addEventListener('click', () => {
    if (!game || $('play').hidden) return;
    const q = G.question(game, QUESTIONS);
    if (game.phase === 'ask') {
        say(`${game.players[G.currentPlayer(game)].name}: ${q.q}`);
        if (game.altsOut) sayChoices(true);
    } else {
        sayResult();
    }
});

$('undo').addEventListener('click', () => {
    if (!undo.length) return;
    game = JSON.parse(undo.pop());
    save();
    if (synth) synth.cancel();
    renderPlay(true);
    toast('↩ Undone');
});

$('result').addEventListener('click', (e) => {
    if (e.target.closest('#next')) return next();
    const c = e.target.closest('[data-credit]');
    if (c) {
        const index = Number(c.dataset.credit);
        const at = game.attempts[index];
        const before = JSON.stringify(game);
        if (G.creditAttempt(game, index)) {
            undo.push(before);
            save();
            blip('star');
            confetti(60);
            renderPlay(false, at.player);
            say(`Counted! ${game.players[at.player].name} gets a point and a star.`);
        }
    }
});

function next() {
    checkpoint();
    G.nextQuestion(game, QUESTIONS);
    save();
    if (game.phase === 'over') {
        show('over');
        renderOver();
        return;
    }
    renderPlay(true);
}

$('quit').addEventListener('click', () => {
    if (!confirm('End this game and see the scores so far?')) return;
    game.phase = 'over';
    save();
    show('over');
    renderOver();
});

document.addEventListener('keydown', (e) => {
    if ($('play').hidden || !game) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); $('undo').click(); return; }
    if (game.phase === 'ask' && !$('choices').hidden && /^[1-3]$/.test(e.key)) {
        const b = $('choices').querySelector(`[data-choice="${Number(e.key) - 1}"]`);
        if (b && !b.disabled) pick(Number(e.key) - 1);
    }
});

// ── Final screen ────────────────────────────────────────────────────────

function renderOver() {
    if (!game.recorded) {
        store.set(KEYS.stats, G.recordGame(store.get(KEYS.stats, null), game));
        game.recorded = true;
        undo = [];
        save();
    }
    const rows = G.standings(game);
    const top = rows.filter((r) => r.place === 1);
    const played = Math.min(game.qi + 1, game.order.length);
    const title = top.length > 1 ? `It’s a tie! ${top.map((r) => r.name).join(' & ')}` : `${top[0].name} wins!`;
    $('final-title').textContent = top.length > 1 ? `${title} 🤝` : `🏆 ${title}`;
    $('final-lead').textContent = `${played} question${played === 1 ? '' : 's'} about the USA. Points plus stars:`;
    const medals = ['🥇', '🥈', '🥉'];
    $('podium').innerHTML = rows.map((r, i) => `
        <div class="place${r.place === 1 ? ' first' : ''}" style="animation-delay:${i * 0.12}s">
            <span class="medal">${medals[r.place - 1] || r.place + '.'}</span>
            <span class="dot" style="--pc:${COLORS[r.index]}">${initial(r.name)}</span>
            <span class="nm">${esc(r.name)}</span>
            <span class="brk">${r.points} pt${r.points === 1 ? '' : 's'}<br>${r.stars} ⭐</span>
            <span class="tot">${r.total}</span>
        </div>`).join('');

    const awards = [];
    const starKing = rows.slice().sort((a, b) => b.stars - a.stars)[0];
    if (starKing.stars > 0 && rows.filter((r) => r.stars === starKing.stars).length === 1) {
        awards.push(`⭐ <b>Star-Spangled Brain:</b> ${esc(starKing.name)}, with ${starKing.stars} answer${starKing.stars === 1 ? '' : 's'} given without any alternatives.`);
    }
    const zero = rows.filter((r) => r.total === 0);
    if (zero.length && zero.length < rows.length) awards.push(`🥔 <b>Honorary Idaho Potato:</b> ${zero.map((r) => esc(r.name)).join(', ')}. Next time!`);
    $('awards').innerHTML = awards.map((a) => `<div>${a}</div>`).join('');

    blip('end');
    confetti(140);
    say(`${title} Congratulations!`);
}

$('again').addEventListener('click', () => {
    setup.names = game.players.map((p) => p.name);
    setup.levels = setup.names.map((_, i) => setup.levels[i] ?? 'mix');
    saveSetup();
    startGame();
});
$('to-setup').addEventListener('click', () => {
    store.del(KEYS.game);
    store.del(KEYS.undo);
    game = null;
    undo = [];
    renderSetup();
    show('setup');
});

// ── Boot ────────────────────────────────────────────────────────────────

renderSwitches();
renderSetup();
show('setup');
