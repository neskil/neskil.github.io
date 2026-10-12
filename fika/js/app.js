// Fika Generator — the table: three cards, dealt face down and turned over.
import { PASTRIES, DRINKS, TOPICS, deal, encode, decode, specialDay, daySeed, mulberry32 } from './deck.js';
import { drawing } from './art.js';

const $ = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const SUITS = ['pastry', 'drink', 'topic'];

/* The calendar date where the visitor is, carried in UTC fields so the deck
   can compare it with fixed days without time zones getting involved. */
function today() {
    const n = new Date();
    return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
}

const state = {
    hand: null,
    keep: { pastry: false, drink: false, topic: false },
    dealing: false,
    rng: mulberry32((Date.now() ^ (Math.random() * 1e9)) >>> 0),
};

/* ── Card faces ── */
function face(suit, i) {
    if (suit === 'topic') {
        return `<div class="suit">Samtalsämne · <span>something to talk about</span></div>
            <div class="art">${drawing({ art: 'talk' })}</div>
            <p class="topic">${TOPICS[i]}</p>`;
    }
    const c = suit === 'pastry' ? PASTRIES[i] : DRINKS[i];
    return `<div class="suit">${suit === 'pastry' ? 'Fikabröd · <span>something to eat</span>' : 'Dryck · <span>something to drink</span>'}</div>
        <div class="art">${drawing(c)}</div>
        <h2 class="name">${c.name}</h2>
        <div class="say">“${c.say}” · ${c.en}</div>
        <p class="line">${c.line}</p>`;
}

function render(hand) {
    SUITS.forEach(s => {
        const el = document.querySelector(`[data-suit="${s}"] .face-front .content`);
        el.innerHTML = face(s, hand[s]);
    });
    document.title = `${PASTRIES[hand.pastry].name} & ${DRINKS[hand.drink].name} — Fika Generator`;
}

function setUp(suit, up) {
    document.querySelector(`[data-suit="${suit}"]`).classList.toggle('up', up);
}

const wait = (ms) => new Promise(r => setTimeout(r, reduceMotion.matches ? Math.min(ms, 60) : ms));

/* Dealing turns the unkept cards face down, swaps what is under them while
   they are face down, and turns them back over one at a time. */
async function dealHand(seeded = false) {
    if (state.dealing) return;
    state.dealing = true;
    $('deal').disabled = true;
    const keep = {};
    for (const s of SUITS) if (state.keep[s] && state.hand) keep[s] = state.hand[s];
    const rng = seeded ? mulberry32(daySeed(today())) : state.rng;
    const next = deal(rng, today(), seeded ? {} : keep, seeded ? null : state.hand);
    if (seeded) state.keep = { pastry: false, drink: false, topic: false };
    syncKeeps();

    const changing = SUITS.filter(s => !state.hand || state.hand[s] !== next[s] || !document.querySelector(`[data-suit="${s}"]`).classList.contains('up'));
    changing.forEach(s => setUp(s, false));
    if (changing.length) await wait(450);
    // A shuffle wiggle while they are face down.
    const table = $('table');
    if (!reduceMotion.matches) {
        table.classList.remove('shuffle');
        void table.offsetWidth;
        table.classList.add('shuffle');
    }
    await wait(350);
    state.hand = next;
    render(next);
    for (const s of SUITS) {
        if (!changing.includes(s)) continue;
        setUp(s, true);
        await wait(260);
    }
    history.replaceState(null, '', `?fika=${encode(next)}`);
    $('share').disabled = false;
    state.dealing = false;
    $('deal').disabled = false;
    $('deal').textContent = '✨ Deal again';
}

/* ── Keeping a card ── */
function syncKeeps() {
    document.querySelectorAll('[data-keep]').forEach(b => {
        const on = state.keep[b.dataset.keep];
        b.setAttribute('aria-pressed', String(on));
        b.textContent = on ? '🔒 Kept' : '🔓 Keep';
        b.disabled = !state.hand;
    });
}
document.querySelectorAll('[data-keep]').forEach(b => b.addEventListener('click', (e) => {
    e.stopPropagation();
    state.keep[b.dataset.keep] = !state.keep[b.dataset.keep];
    syncKeeps();
}));

// Tapping a face-down card deals; tapping a dealt one turns just that one.
document.querySelectorAll('.fcard').forEach(card => card.addEventListener('click', () => {
    if (state.dealing) return;
    if (!state.hand) { dealHand(); return; }
    const s = card.dataset.suit;
    if (state.keep[s]) return;
    const others = {};
    for (const o of SUITS) if (o !== s) others[o] = true;
    const before = { ...state.keep };
    state.keep = { ...state.keep, ...others };
    dealHand().then(() => { state.keep = before; syncKeeps(); });
}));

$('deal').addEventListener('click', () => dealHand());
$('daily').addEventListener('click', () => dealHand(true));

/* ── Sharing ── */
$('share').addEventListener('click', async () => {
    const url = location.href;
    try {
        if (navigator.share && matchMedia('(pointer: coarse)').matches) {
            await navigator.share({ title: 'Fika?', text: 'Fika?', url });
            return;
        }
        await navigator.clipboard.writeText(url);
        flash('Link copied');
    } catch (e) {
        flash('Copy the address bar to share');
    }
});

function flash(text) {
    const t = $('toast');
    t.textContent = text;
    t.hidden = false;
    clearTimeout(flash.timer);
    flash.timer = setTimeout(() => { t.hidden = true; }, 1800);
}

/* ── The fika timer ──
   Fifteen minutes is a proper fika. The ring empties as it runs. */
let timer = null;
$('timer').addEventListener('click', () => {
    if (timer) { stopTimer(); return; }
    const end = Date.now() + 15 * 60 * 1000;
    $('timer').setAttribute('aria-pressed', 'true');
    const tick = () => {
        const left = Math.max(0, end - Date.now());
        const m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60;
        $('timer-text').textContent = `${m}:${String(s).padStart(2, '0')}`;
        $('ring').style.strokeDashoffset = String(113 * (1 - left / (15 * 60 * 1000)));
        if (left === 0) {
            stopTimer();
            $('timer-text').textContent = 'Back to it';
            flash('Fika’s over. Back to it, refreshed.');
        }
    };
    tick();
    timer = setInterval(tick, 1000);
});
function stopTimer() {
    clearInterval(timer);
    timer = null;
    $('timer').setAttribute('aria-pressed', 'false');
    $('timer-text').textContent = '15:00';
    $('ring').style.strokeDashoffset = '0';
}

/* ── Start ── */
const special = specialDay(today());
if (special) {
    $('special').hidden = false;
    $('special').innerHTML = `<b>Idag: ${special.name}.</b> ${special.note}`;
}
const shared = decode(new URLSearchParams(location.search).get('fika'));
syncKeeps();
if (shared) {
    state.hand = shared;
    render(shared);
    SUITS.forEach(s => setUp(s, true));
    $('share').disabled = false;
    $('deal').textContent = '✨ Deal again';
    syncKeeps();
}
