// USA Quiz Night — the page. Rules live in game.js; this file draws them and
// remembers the game in localStorage, so a reload mid-quiz loses nothing.

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
const KEYS = { game: 'usa-quiz.game', setup: 'usa-quiz.setup', seen: 'usa-quiz.seen', sound: 'usa-quiz.sound' };

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

// ── Setup state ─────────────────────────────────────────────────────────

const allCats = Object.keys(CATEGORIES);
let setup = store.get(KEYS.setup, null) || {};
setup = {
    names: Array.isArray(setup.names) && setup.names.length >= G.MIN_PLAYERS ? setup.names.slice(0, G.MAX_PLAYERS) : G.DEFAULT_PLAYERS.slice(),
    rounds: LENGTHS.some((l) => l.rounds === setup.rounds) ? setup.rounds : 5,
    cats: Array.isArray(setup.cats) && setup.cats.some((c) => allCats.includes(c)) ? setup.cats.filter((c) => allCats.includes(c)) : allCats.slice(),
};
const saveSetup = () => store.set(KEYS.setup, setup);

let game = G.repair(store.get(KEYS.game, null), QUESTIONS);
let soundOn = store.get(KEYS.sound, true);

// ── Sound: two tiny synth blips, no files ──────────────────────────────

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

function renderSound() {
    $('sound').textContent = soundOn ? '🔊' : '🔇';
    $('sound').setAttribute('aria-pressed', String(soundOn));
}
$('sound').addEventListener('click', () => {
    soundOn = !soundOn;
    store.set(KEYS.sound, soundOn);
    renderSound();
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

// ── Screens ─────────────────────────────────────────────────────────────

function show(screen) {
    for (const id of ['setup', 'play', 'over']) $(id).hidden = id !== screen;
    window.scrollTo({ top: 0 });
}

// ── Setup screen ────────────────────────────────────────────────────────

function renderSetup() {
    $('bank-size').textContent = QUESTIONS.length;
    $('resume-box').hidden = !(game && game.phase !== 'over');

    const list = $('players');
    list.innerHTML = setup.names.map((n, i) => `
        <div class="player-row" style="--pc:${COLORS[i]}">
            <span class="dot">${initial(n)}</span>
            <input type="text" value="${esc(n)}" data-i="${i}" maxlength="16" aria-label="Player ${i + 1} name">
            ${setup.names.length > G.MIN_PLAYERS ? `<button type="button" class="remove" data-rm="${i}" aria-label="Remove ${esc(n)}">✕</button>` : ''}
        </div>`).join('');
    $('add-player').hidden = setup.names.length >= G.MAX_PLAYERS;

    $('lengths').innerHTML = LENGTHS.map((l) =>
        `<button type="button" class="chip" data-rounds="${l.rounds}" aria-pressed="${l.rounds === setup.rounds}">${l.label}<small>${l.rounds * setup.names.length} q</small></button>`).join('');
    $('length-hint').textContent = `${setup.rounds} rounds: everyone starts ${setup.rounds} questions, ${setup.rounds * setup.names.length} in all.`;

    $('cats').innerHTML = allCats.map((c) => {
        const n = QUESTIONS.filter((q) => q.c === c).length;
        return `<button type="button" class="chip" data-cat="${c}" aria-pressed="${setup.cats.includes(c)}">${CATEGORIES[c].icon} ${CATEGORIES[c].name}<small>${n}</small></button>`;
    }).join('');
}

$('players').addEventListener('input', (e) => {
    const i = Number(e.target.dataset.i);
    if (Number.isNaN(i)) return;
    setup.names[i] = e.target.value;
    e.target.previousElementSibling.textContent = (e.target.value.trim()[0] || '?').toUpperCase();
    saveSetup();
});
$('players').addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]');
    if (!rm) return;
    setup.names.splice(Number(rm.dataset.rm), 1);
    saveSetup();
    renderSetup();
});
$('add-player').addEventListener('click', () => {
    if (setup.names.length >= G.MAX_PLAYERS) return;
    setup.names.push('');
    saveSetup();
    renderSetup();
    $('players').querySelector(`input[data-i="${setup.names.length - 1}"]`).focus();
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

function startGame() {
    const names = setup.names.map((n, i) => n.trim() || `Player ${i + 1}`);
    const count = setup.rounds * names.length;
    const pool = QUESTIONS.filter((q) => setup.cats.includes(q.c));
    // Fewer questions than asked for in a narrow pick: trim to whole rounds.
    const usable = Math.min(count, pool.length - (pool.length % names.length));
    if (usable < names.length) return toast('Not enough questions in those categories');
    const order = G.pickQuestions(QUESTIONS, { count: usable, cats: setup.cats, seen: store.get(KEYS.seen, []) });
    game = G.newGame({ names, order, bank: QUESTIONS, starter: Math.floor(Math.random() * names.length) });
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

function save() { store.set(KEYS.game, game); }

function markSeen(id) {
    const seen = store.get(KEYS.seen, []);
    if (seen.includes(id)) return;
    seen.push(id);
    // Everything seen means start the cycle over rather than repeat the same order.
    store.set(KEYS.seen, seen.length >= QUESTIONS.length ? [] : seen);
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
        else if (a.mode === 'free') what = `${esc(p.name)} typed <q>${esc(a.text)}</q>`;
        else what = `${esc(p.name)} picked <q>${esc(a.text)}</q>`;
        const mark = a.right ? `<span class="good">✓${a.mode === 'free' ? ' ⭐' : ''}${a.credited ? ' (counted)' : ''}</span>` : a.mode === 'pass' ? '' : '<span class="bad">✗</span>';
        return `<li>${dot}<span>${what}</span>${mark}</li>`;
    }).join('');
}

function renderPlay(enter = false, bump = -1) {
    const q = G.question(game, QUESTIONS);
    const cat = CATEGORIES[q.c];
    $('qcat').textContent = `${cat.icon} ${cat.name}`;
    $('qnum').textContent = `Question ${game.qi + 1} of ${game.order.length}`;
    $('qprog').style.width = (game.qi / game.order.length) * 100 + '%';
    $('qtext').textContent = q.q;
    renderBoard(bump);
    renderLog();

    const asking = game.phase === 'ask';
    $('ask').hidden = !asking;
    $('result').hidden = asking;

    if (asking) {
        const pi = G.currentPlayer(game);
        const p = game.players[pi];
        const turn = $('turn');
        turn.style.setProperty('--pc', COLORS[pi]);
        const sub = game.turn === 0
            ? (G.starOpen(game, QUESTIONS) ? 'Type it for a star, or open the alternatives.' : 'Pick one of the alternatives.')
            : `Passed on from ${esc(game.players[(pi - 1 + game.players.length) % game.players.length].name)}. Still worth a point.`;
        turn.innerHTML = `<span class="dot">${initial(p.name)}</span><div><div class="who">${possessive(p.name)} turn</div><div class="sub">${sub}</div></div>`;
        if (enter) {
            turn.classList.remove('enter');
            void turn.offsetWidth;
            turn.classList.add('enter');
        }

        const starOpen = G.starOpen(game, QUESTIONS);
        $('free-zone').hidden = !starOpen;
        const choices = $('choices');
        choices.hidden = starOpen;
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
            if (matchMedia('(pointer: fine)').matches) $('free-input').focus();
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
    if (matchMedia('(pointer: fine)').matches) $('next').focus();
}

/** After any move: save, sound, and redraw. */
function afterMove(right, kind, player) {
    if (game.phase !== 'ask') markSeen(game.order[game.qi]);
    save();
    if (right) {
        $('toast').classList.remove('show');
        blip(kind === 'free' ? 'star' : 'right');
        confetti(kind === 'free' ? 90 : 45);
        renderPlay(false, player);
        return;
    }
    blip('wrong');
    shake($('qcard'));
    if (game.phase === 'ask') {
        const next = game.players[G.currentPlayer(game)];
        toast(kind === 'pass' ? `Passed. Over to ${esc(next.name)}!` : `Wrong! Over to ${esc(next.name)} 👉`);
    }
    renderPlay(true);
}

$('free-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('free-input').value;
    if (!text.trim()) { $('free-input').focus(); return; }
    const player = G.currentPlayer(game);
    const right = G.answerFree(game, QUESTIONS, text);
    if (right === null) return;
    afterMove(right, 'free', player);
});

$('show-alts').addEventListener('click', () => {
    G.showAlternatives(game);
    save();
    renderPlay();
});

$('choices').addEventListener('click', (e) => {
    const b = e.target.closest('[data-choice]');
    if (!b || b.disabled) return;
    pick(Number(b.dataset.choice));
});

function pick(i) {
    const choice = game.choices[i];
    const player = G.currentPlayer(game);
    const right = G.answerChoice(game, QUESTIONS, choice);
    if (right === null) return;
    afterMove(right, 'choice', player);
}

$('pass').addEventListener('click', () => {
    G.pass(game);
    afterMove(false, 'pass');
});

$('result').addEventListener('click', (e) => {
    if (e.target.closest('#next')) return next();
    const c = e.target.closest('[data-credit]');
    if (c) {
        const at = game.attempts[Number(c.dataset.credit)];
        if (G.creditAttempt(game, Number(c.dataset.credit))) {
            save();
            blip('star');
            confetti(60);
            renderPlay(false, at.player);
        }
    }
});

function next() {
    G.nextQuestion(game, QUESTIONS);
    save();
    if (game.phase === 'over') {
        show('over');
        renderOver();
        return;
    }
    renderPlay(true);
    toast(`${possessive(game.players[G.currentPlayer(game)].name)} turn to start`, 1600);
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
    if (e.target.tagName === 'INPUT') return;
    if (game.phase === 'ask' && !$('choices').hidden && /^[1-3]$/.test(e.key)) {
        const b = $('choices').querySelector(`[data-choice="${Number(e.key) - 1}"]`);
        if (b && !b.disabled) pick(Number(e.key) - 1);
    }
});

// ── Final screen ────────────────────────────────────────────────────────

function renderOver() {
    const rows = G.standings(game);
    const top = rows.filter((r) => r.place === 1);
    const played = Math.min(game.qi + 1, game.order.length);
    $('final-title').textContent = top.length > 1
        ? `It’s a tie! ${top.map((r) => r.name).join(' & ')} 🤝`
        : `🏆 ${top[0].name} wins!`;
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
}

$('again').addEventListener('click', () => {
    setup.names = game.players.map((p) => p.name);
    saveSetup();
    startGame();
});
$('to-setup').addEventListener('click', () => {
    store.del(KEYS.game);
    game = null;
    renderSetup();
    show('setup');
});

// ── Boot ────────────────────────────────────────────────────────────────

renderSound();
renderSetup();
show('setup');
