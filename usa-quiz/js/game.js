// USA Quiz Night — the rules, with no DOM.
//
// A question goes to one player. Right: they score and the next question
// starts with the next player round the table. Wrong (or a pass): the same
// question goes to the next player, until someone gets it or everyone has had
// a go. Answering without the alternatives earns a star on top of the point.
//
// Two rules fall out of playing on one shared screen:
//   • Once the alternatives are on screen everybody has seen them, so nobody
//     after that can earn a star on that question.
//   • Every wrong pick is struck out. With two struck, the last alternative is
//     no secret, so the question ends there rather than handing out a free point.
//
// State is a plain object so it can go straight into localStorage and back.

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const DEFAULT_PLAYERS = ['Åsa', 'Niklas', 'Johan', 'Lena'];

/** djb2 over the question text: a stable id that survives reordering the bank. */
export function questionId(q) {
    let h = 5381;
    for (const ch of q.q) h = ((h * 33) ^ ch.codePointAt(0)) >>> 0;
    return q.c + '-' + h.toString(36);
}

// ── Free-answer matching ────────────────────────────────────────────────

/** Lower case, no accents, no punctuation, no leading article, single spaces. */
export function normalize(text) {
    return String(text)
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/\bst\.?\s/g, 'saint ')
        .replace(/\bmt\.?\s/g, 'mount ')
        .replace(/(?<!\d)\.|\.(?!\d)/g, '')
        .replace(/[^a-z0-9.\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^(the|a|an) /, '');
}

export function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        const cur = [i];
        for (let j = 1; j <= b.length; j++) {
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        prev = cur;
    }
    return prev[b.length];
}

/** How many typos a target of this length forgives. Short words get none: Iowa is not Ohio. */
export function tolerance(len) {
    if (len <= 4) return 0;
    if (len <= 8) return 1;
    return 2;
}

const isNumeric = (s) => /^\d+(\.\d+)?$/.test(String(s));

/** Every string a free answer may match: the answer itself plus its aliases. */
export function targets(q) {
    return [q.a, ...(q.ok || [])];
}

/**
 * Does a typed answer count? Numbers must match exactly (a year off by one is
 * wrong); words forgive a typo or two, and the spaces in them.
 */
const digits = (s) => (s.match(/\d+(\.\d+)?/g) || []).join(' ');

export function checkFree(q, text) {
    // A Swede writes 1,6 for 1.6.
    const said = normalize(String(text).replace(/(\d),(\d)/g, '$1.$2'));
    if (!said) return false;
    const all = targets(q);
    // A number answer is found in whatever was typed around it: "4 years", "about 3.8".
    const nums = (said.match(/\d+(\.\d+)?/g) || []).map(Number);
    if (nums.length === 1 && all.some((t) => isNumeric(t) && Number(t) === nums[0])) return true;
    if (all.every(isNumeric)) return false;
    const squash = (s) => s.replace(/ /g, '');
    const a = squash(said);
    // A typo is forgiven only if the answer is still nearer the right one than
    // any wrong alternative: "Baseball" is two letters from "Basketball", and
    // North Dakota two from South Dakota.
    const nearestWrong = Math.min(Infinity, ...(q.w || []).map((w) => levenshtein(a, squash(normalize(w)))));
    for (const t of all) {
        const want = normalize(t);
        if (said === want) return true;
        if (isNumeric(want)) continue;
        // Typos are forgiven in the letters, never in the numbers: 30 October is not Halloween.
        if (digits(said) !== digits(want)) continue;
        const b = squash(want);
        const d = levenshtein(a, b);
        if (d === 0 || (d <= tolerance(b.length) && d < nearestWrong)) return true;
    }
    return false;
}

// ── Picking questions ───────────────────────────────────────────────────

export function shuffle(list, rng = Math.random) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * `count` question ids from the chosen categories: ones not seen in earlier
 * games first, then the rest, and never two of the same category back to back
 * when it can be helped.
 */
export function pickQuestions(bank, { count, cats = null, seen = [], rng = Math.random }) {
    const pool = bank.filter((q) => !cats || cats.includes(q.c));
    const seenSet = new Set(seen);
    const fresh = shuffle(pool.filter((q) => !seenSet.has(q.id)), rng);
    const old = shuffle(pool.filter((q) => seenSet.has(q.id)), rng);
    const chosen = fresh.concat(old).slice(0, count);
    // Spread categories: greedily take the first one that differs from the last.
    const out = [];
    const rest = chosen.slice();
    while (rest.length) {
        const last = out.length ? out[out.length - 1].c : null;
        const i = Math.max(0, rest.findIndex((q) => q.c !== last));
        out.push(rest.splice(i, 1)[0]);
    }
    return out.map((q) => q.id);
}

// ── The game ────────────────────────────────────────────────────────────

export function newGame({ names, order, bank, rng = Math.random, starter = 0 }) {
    if (names.length < MIN_PLAYERS || names.length > MAX_PLAYERS) throw new Error('bad player count');
    const s = {
        players: names.map((name) => ({ name, points: 0, stars: 0 })),
        order: order.slice(),
        qi: 0,
        starter: starter % names.length,
        phase: 'ask',
    };
    startQuestion(s, bank, rng);
    return s;
}

const byId = (bank, id) => bank.find((q) => q.id === id);

function startQuestion(s, bank, rng) {
    const q = byId(bank, s.order[s.qi]);
    s.turn = 0;
    s.attempts = [];
    s.struck = [];
    // A question with no star on offer opens straight on its alternatives.
    s.altsOut = !!q.choiceOnly;
    s.winner = null;
    s.choices = shuffle([q.a, ...q.w], rng);
    s.phase = 'ask';
}

export function question(s, bank) {
    return byId(bank, s.order[s.qi]);
}

export function currentPlayer(s) {
    return (s.starter + s.turn) % s.players.length;
}

/** Can the player on turn still go for a star? */
export function starOpen(s, bank) {
    return s.phase === 'ask' && !s.altsOut && !question(s, bank).choiceOnly;
}

export function showAlternatives(s) {
    if (s.phase !== 'ask') return s;
    s.altsOut = true;
    return s;
}

export function remaining(s) {
    return s.choices.filter((c) => !s.struck.includes(c));
}

function advance(s) {
    s.turn++;
    if (s.turn >= s.players.length || (s.altsOut && remaining(s).length <= 1)) {
        s.phase = 'result';
        s.turn = Math.min(s.turn, s.players.length - 1);
    }
}

function win(s, player, star) {
    s.players[player].points += 1;
    if (star) s.players[player].stars += 1;
    s.winner = player;
    s.phase = 'result';
}

/** Pick one of the alternatives. Returns whether it was right. */
export function answerChoice(s, bank, choice) {
    if (s.phase !== 'ask' || !s.altsOut || s.struck.includes(choice) || !s.choices.includes(choice)) return null;
    const q = question(s, bank);
    const player = currentPlayer(s);
    const right = choice === q.a;
    s.attempts.push({ player, mode: 'choice', text: choice, right });
    if (right) win(s, player, false);
    else {
        s.struck.push(choice);
        advance(s);
    }
    return right;
}

/** Answer without alternatives. Returns whether it counted. */
export function answerFree(s, bank, text) {
    if (!starOpen(s, bank) || !String(text).trim()) return null;
    const q = question(s, bank);
    const player = currentPlayer(s);
    const right = checkFree(q, text);
    s.attempts.push({ player, mode: 'free', text: String(text).trim(), right });
    if (right) win(s, player, true);
    else advance(s);
    return right;
}

export function pass(s) {
    if (s.phase !== 'ask') return s;
    s.attempts.push({ player: currentPlayer(s), mode: 'pass', text: '', right: false });
    advance(s);
    return s;
}

/**
 * On the result screen: the table agrees a typed answer was right after all
 * ("Mt Rushmore, S. Dakota" is South Dakota). Only while nobody has won the
 * question, and only a typed answer — a picked alternative is what it is.
 */
export function creditAttempt(s, index) {
    const at = s.attempts[index];
    if (s.phase !== 'result' || s.winner !== null || !at || at.mode !== 'free' || at.right) return false;
    at.right = true;
    at.credited = true;
    win(s, at.player, true);
    return true;
}

/** Move on. The next question starts with the player after the last starter. */
export function nextQuestion(s, bank, rng = Math.random) {
    if (s.phase !== 'result') return s;
    s.qi++;
    if (s.qi >= s.order.length) {
        s.phase = 'over';
        return s;
    }
    s.starter = (s.starter + 1) % s.players.length;
    startQuestion(s, bank, rng);
    return s;
}

export const total = (p) => p.points + p.stars;

/** Players best first, with shared places for ties. */
export function standings(s) {
    const rows = s.players.map((p, i) => ({ ...p, index: i, total: total(p) }));
    rows.sort((a, b) => b.total - a.total || b.stars - a.stars || a.index - b.index);
    let place = 0;
    rows.forEach((r, i) => {
        if (i === 0 || r.total !== rows[i - 1].total || r.stars !== rows[i - 1].stars) place = i + 1;
        r.place = place;
    });
    return rows;
}

/** Drop ids a changed bank no longer has, so an old saved game still loads. */
export function repair(s, bank) {
    if (!s || !Array.isArray(s.order) || !Array.isArray(s.players)) return null;
    const ids = new Set(bank.map((q) => q.id));
    const current = s.order[s.qi];
    if (s.phase !== 'over' && !ids.has(current)) return null;
    return s;
}
