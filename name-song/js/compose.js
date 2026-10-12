// Sound of Your Name — turning a word into a tune. No audio and no DOM here:
// this returns a score, and the page plays and draws it.
//
// Two rules, so it can be explained in a sentence. Each letter is always the
// same step of the scale — so "Ann" and "Anna" open the same way — and vowels
// are held while consonants move on. Everything else (the key, the mode, the
// tempo, the chords under it, the instrument) comes from the name as a whole,
// so no two names sound alike even when they share letters.

export const MAX_LETTERS = 40;

export const MODES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    pentatonic: [0, 2, 4, 7, 9],
};

export const KEYS = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

export const INSTRUMENTS = ['bell', 'pluck', 'reed', 'glass'];

// Chord roots as scale steps, four bars round and round.
const PROGRESSIONS = [
    [0, 5, 3, 4],   // I vi IV V
    [0, 3, 4, 0],   // I IV V I
    [0, 4, 5, 3],   // I V vi IV
    [5, 3, 0, 4],   // vi IV I V
    [0, 2, 3, 4],   // I iii IV V
];

const VOWELS = new Set('aeiouy');

/** Letters and digits only, lower-cased, with accents taken off the letter
    and kept as a flag — an å is an a with an ornament, not a different note. */
export function letters(text) {
    const out = [];
    for (const ch of String(text || '').normalize('NFD')) {
        if (/\p{M}/u.test(ch)) { if (out.length) out[out.length - 1].accent = true; continue; }
        const c = ch.toLowerCase();
        if (/[a-z]/.test(c)) out.push({ ch: c, accent: false });
        else if (/[0-9]/.test(c)) out.push({ ch: c, accent: false });
        else if (/[\s\-_.'’]/.test(c) && out.length && out[out.length - 1].ch !== ' ') out.push({ ch: ' ', accent: false });
        if (out.filter(l => l.ch !== ' ').length >= MAX_LETTERS) break;
    }
    while (out.length && out[out.length - 1].ch === ' ') out.pop();
    return out;
}

/** The step of the scale each letter always plays, 0..9 (about an octave and
    a half). Multiplying by 7 mod 10 scatters neighbouring letters so the
    alphabet is not a scale. */
export function letterStep(ch) {
    if (/[0-9]/.test(ch)) return Number(ch);
    const i = ch.charCodeAt(0) - 97;
    return (i * 7) % 10;
}

export function hash(text) {
    let h = 2166136261;
    for (const ch of text) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
    return h >>> 0;
}

/** Scale step (can run past the octave) to a MIDI note. */
export function stepToMidi(step, root, mode) {
    const s = MODES[mode];
    const oct = Math.floor(step / s.length);
    return root + s[((step % s.length) + s.length) % s.length] + 12 * oct;
}

export function compose(text) {
    const ls = letters(text);
    const word = ls.map(l => l.ch).join('');
    if (!word.trim()) return null;
    const h = hash(word);
    const modeNames = Object.keys(MODES);
    const mode = modeNames[h % modeNames.length];
    const key = (h >>> 3) % 12;
    const root = 57 + ((key + 3) % 12);        // A3..G♯4: the melody sits round middle C
    const tempo = 84 + ((h >>> 7) % 49);        // 84..132 bpm
    const instrument = INSTRUMENTS[(h >>> 13) % INSTRUMENTS.length];
    const progression = PROGRESSIONS[(h >>> 17) % PROGRESSIONS.length];
    const beat = 60 / tempo;

    const notes = [];
    let t = 0;
    for (let k = 0; k < ls.length; k++) {
        const { ch, accent } = ls[k];
        if (ch === ' ') { t += 0.5 * beat; continue; }
        const vowel = VOWELS.has(ch);
        const step = letterStep(ch);
        const midi = stepToMidi(step, root, mode);
        const next = ls[k + 1];
        // A doubled letter is one longer note; the last letter rings on.
        if (next && next.ch === ch && !next.accent && !accent) {
            ls[k + 1] = { ...next, tied: true };
        }
        if (ls[k].tied) {
            const prev = notes[notes.length - 1];
            prev.dur += vowel ? beat : 0.5 * beat;
            t += vowel ? beat : 0.5 * beat;
            continue;
        }
        let dur = vowel ? beat : 0.5 * beat;
        const last = k === ls.length - 1;
        const endOfWord = last || (next && next.ch === ' ');
        if (endOfWord) dur += 0.5 * beat;
        if (last) dur = Math.max(dur, 2 * beat);
        if (accent) {
            // The ring or dots: a quick grace note a step above, stolen from the note's start.
            notes.push({ t, dur: 0.12 * beat, midi: stepToMidi(step + 1, root, mode), vel: 0.45, letter: '', grace: true });
        }
        notes.push({ t: accent ? t + 0.12 * beat : t, dur: accent ? dur - 0.12 * beat : dur, midi, vel: vowel ? 0.85 : 0.65, letter: ch, step });
        t += dur;
    }
    // The last note rings on — also when it is a doubled letter, which the
    // tie above has already folded into the note before.
    const final = notes[notes.length - 1];
    if (final && final.dur < 2 * beat) {
        t += 2 * beat - final.dur;
        final.dur = 2 * beat;
    }
    // Round the tune up to whole bars of four beats, so a loop lands on the one.
    const bars = Math.max(1, Math.ceil(t / (4 * beat) - 1e-9));
    const length = bars * 4 * beat;
    const chords = [];
    for (let b = 0; b < bars; b++) {
        const deg = progression[b % progression.length];
        const s = MODES[mode];
        // A triad from the scale: root, third and fifth by step, an octave down.
        const triad = [0, 2, 4].map(d => stepToMidi(deg + d, root - 12, mode));
        if (s.length === 5) triad[1] = stepToMidi(deg + 1, root - 12, mode);  // pentatonic: stack what is there
        chords.push({ t: b * 4 * beat, dur: 4 * beat, notes: triad, bass: stepToMidi(deg, root - 24, mode) });
    }
    return {
        text: ls.map(l => l.ch).join(''),
        hash: h, key: KEYS[root % 12], root, mode, tempo, beat, instrument,
        notes, chords, length,
        hue: h % 360,
        petals: 5 + (h >>> 21) % 4,
    };
}

export function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

export function noteName(m) {
    return ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'][((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
}
