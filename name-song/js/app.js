// Sound of Your Name — the page: a small Web Audio synth and the rosette.
import { compose, midiToFreq, MAX_LETTERS } from './compose.js';

const $ = (id) => document.getElementById(id);
const canvas = $('rose');
const g = canvas.getContext('2d');
const input = $('name');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let song = null;
let pinned = null;   // a fixed playhead position, for screenshots (?at=)

/* ── Audio ──
   Built on the first press of Play (browsers keep audio locked until then).
   Everything goes through one master gain, with a send to a reverb whose
   impulse is just decaying noise — a room without needing a file. */
let audio = null;
function setupAudio() {
    if (audio) return audio;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    const verb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 2.4);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    verb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    verb.connect(wet).connect(master);
    audio = { ctx, master, verb };
    return audio;
}

function voice(out, t, dur, freq, vel, kind) {
    const { ctx, verb } = audio;
    const amp = ctx.createGain();
    amp.connect(out);
    amp.connect(verb);
    const oscs = [];
    const env = (attack, peak, release) => {
        amp.gain.setValueAtTime(0, t);
        amp.gain.linearRampToValueAtTime(peak, t + attack);
        amp.gain.setTargetAtTime(0, t + Math.max(attack, dur), release);
    };
    const osc = (type, f, gain = 1) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = f;
        let node = o;
        if (gain !== 1) { const gn = ctx.createGain(); gn.gain.value = gain; o.connect(gn); node = gn; }
        oscs.push(o);
        return node;
    };
    if (kind === 'bell') {
        osc('sine', freq).connect(amp);
        osc('sine', freq * 2.76, 0.18).connect(amp);
        osc('sine', freq * 5.4, 0.05).connect(amp);
        amp.gain.setValueAtTime(0, t);
        amp.gain.linearRampToValueAtTime(0.32 * vel, t + 0.005);
        amp.gain.setTargetAtTime(0, t + 0.01, 0.35 + dur * 0.4);
    } else if (kind === 'pluck') {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(freq * 8, t);
        f.frequency.setTargetAtTime(freq * 1.5, t, 0.12);
        osc('triangle', freq).connect(f);
        osc('sawtooth', freq, 0.25).connect(f);
        f.connect(amp);
        amp.gain.setValueAtTime(0, t);
        amp.gain.linearRampToValueAtTime(0.34 * vel, t + 0.004);
        amp.gain.setTargetAtTime(0, t + 0.01, 0.22 + dur * 0.2);
    } else if (kind === 'reed') {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = Math.min(4000, freq * 4);
        f.Q.value = 2;
        osc('sawtooth', freq, 0.6).connect(f);
        osc('square', freq * 1.003, 0.25).connect(f);
        f.connect(amp);
        env(0.03, 0.17 * vel, 0.08);
    } else {
        // glass: soft sines, a slow swell and a long tail
        osc('sine', freq).connect(amp);
        osc('sine', freq * 3, 0.08).connect(amp);
        osc('sine', freq * 2.001, 0.12).connect(amp);
        env(0.04, 0.26 * vel, 0.5);
    }
    const stop = t + dur + 3;
    oscs.forEach(o => { o.start(t); o.stop(stop); });
    return { oscs, amp, stop };
}

function pad(out, t, dur, midis, bassMidi) {
    const { ctx } = audio;
    const amp = ctx.createGain();
    amp.connect(out);
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(0.045, t + 0.4);
    amp.gain.setValueAtTime(0.045, t + dur - 0.3);
    amp.gain.linearRampToValueAtTime(0, t + dur + 0.2);
    const oscs = midis.map(m => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = midiToFreq(m);
        o.connect(amp);
        return o;
    });
    const bamp = ctx.createGain();
    bamp.connect(out);
    bamp.gain.setValueAtTime(0, t);
    bamp.gain.linearRampToValueAtTime(0.13, t + 0.03);
    bamp.gain.setTargetAtTime(0.05, t + 0.05, 0.6);
    bamp.gain.setTargetAtTime(0, t + dur - 0.1, 0.08);
    const b = ctx.createOscillator();
    b.type = 'triangle';
    b.frequency.value = midiToFreq(bassMidi);
    b.connect(bamp);
    oscs.push(b);
    oscs.forEach(o => { o.start(t); o.stop(t + dur + 0.5); });
    return { oscs, amp };
}

/* ── Playback ──
   One pass of the song is scheduled ahead at a time; a timer queues the next
   pass shortly before this one ends, so looping is seamless and stopping
   only ever has one pass to cancel. */
const play = { on: false, start: 0, loop: true, bus: null, timer: null, passes: 0 };

function schedulePass(at) {
    const bus = play.bus;
    for (const c of song.chords) pad(bus, at + c.t, c.dur, c.notes, c.bass);
    for (const n of song.notes) voice(bus, at + n.t, n.dur, midiToFreq(n.midi), n.vel, song.instrument);
}

function startPlaying() {
    if (!song) return;
    const a = setupAudio();
    a.ctx.resume();
    stopPlaying(true);
    play.bus = a.ctx.createGain();
    play.bus.connect(a.master);
    play.on = true;
    play.start = a.ctx.currentTime + 0.08;
    play.passes = 1;
    schedulePass(play.start);
    play.timer = setInterval(() => {
        const now = a.ctx.currentTime;
        const nextAt = play.start + play.passes * song.length;
        if (nextAt - now > 0.4) return;
        if (!play.loop) {
            if (now > nextAt + 1.5) stopPlaying();
            return;
        }
        schedulePass(nextAt);
        play.passes++;
    }, 100);
    syncButton();
}

function stopPlaying(quiet = false) {
    clearInterval(play.timer);
    play.timer = null;
    if (play.bus && audio) {
        const bus = play.bus, t = audio.ctx.currentTime;
        bus.gain.setTargetAtTime(0, t, 0.06);
        setTimeout(() => bus.disconnect(), 600);
    }
    play.bus = null;
    play.on = false;
    if (!quiet) syncButton();
}

function syncButton() {
    $('play').textContent = play.on ? '■ Stop' : '▶ Play';
    $('play').setAttribute('aria-pressed', String(play.on));
}

$('play').addEventListener('click', () => (play.on ? stopPlaying() : startPlaying()));
$('loop').addEventListener('click', () => {
    play.loop = !play.loop;
    $('loop').setAttribute('aria-pressed', String(play.loop));
});

/* ── The rosette ──
   Time runs round the circle, one lap per pass of the song; each note is a
   petal at its moment, further out the higher it is. The tune is drawn as a
   line through the petals and repeated round the circle `petals` times. */
let W = 0, H = 0, dpr = 1;
function fit() {
    const box = canvas.parentElement.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = Math.floor(Math.min(box.width, box.height));
    W = H = size;
    canvas.width = canvas.height = Math.floor(size * dpr);
    canvas.style.width = canvas.style.height = size + 'px';
}
new ResizeObserver(fit).observe(canvas.parentElement);
fit();

function geometry(n) {
    const lo = Math.min(...song.notes.map(x => x.midi)), hi = Math.max(...song.notes.map(x => x.midi));
    const R = W / 2;
    const rr = (m) => R * (0.3 + 0.5 * (hi === lo ? 0.5 : (m - lo) / (hi - lo)));
    const ang = (t) => -Math.PI / 2 + (t / song.length) * Math.PI * 2;
    return { R, rr, ang };
}

function draw(now) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    if (!song) {
        g.fillStyle = '#64748b';
        g.font = '500 15px Inter, sans-serif';
        g.textAlign = 'center';
        g.fillText('Type a name to hear it', W / 2, H / 2);
        return;
    }
    const { R, rr, ang } = geometry();
    const cx = W / 2, cy = H / 2;
    const hue = song.hue;
    const pos = pinned != null ? pinned
        : play.on && audio ? ((audio.ctx.currentTime - play.start) % song.length + song.length) % song.length : -1;

    // Glow behind.
    const bg = g.createRadialGradient(cx, cy, 0, cx, cy, R);
    bg.addColorStop(0, `hsla(${hue}, 70%, 40%, 0.28)`);
    bg.addColorStop(1, `hsla(${hue}, 70%, 20%, 0)`);
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);

    // Bars: a faint ring split by chord, tinted by chord root.
    song.chords.forEach((c, i) => {
        g.strokeStyle = `hsla(${(hue + (c.bass % 12) * 30) % 360}, 60%, 60%, 0.22)`;
        g.lineWidth = R * 0.05;
        g.beginPath();
        g.arc(cx, cy, R * 0.2, ang(c.t) + 0.03, ang(c.t + c.dur) - 0.03);
        g.stroke();
    });

    const main = song.notes.filter(n => !n.grace);
    g.save();
    g.translate(cx, cy);
    for (let k = 0; k < song.petals; k++) {
        g.save();
        g.rotate((k / song.petals) * Math.PI * 2);
        const echo = k === 0 ? 1 : 0.22;
        // The tune as a line, petal to petal.
        g.strokeStyle = `hsla(${hue}, 80%, 72%, ${0.55 * echo})`;
        g.lineWidth = k === 0 ? 1.6 : 1;
        g.beginPath();
        main.forEach((n, i) => {
            const a = ang(n.t + n.dur / 2), r = rr(n.midi);
            i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        });
        g.closePath();
        g.stroke();
        // Petals.
        for (const n of song.notes) {
            const a0 = ang(n.t), a1 = ang(n.t + n.dur), am = (a0 + a1) / 2;
            const r = rr(n.midi);
            const active = pos >= n.t && pos < n.t + n.dur;
            // Capped: a two-beat final note in a short name would otherwise sweep a quarter of the circle.
            const len = Math.min(R * 0.32, Math.max(6, (a1 - a0) * r * 0.9)) * (active ? 1.25 : 1);
            const wid = (n.grace ? 3 : 6 + n.vel * 6) * (active ? 1.4 : 1);
            g.save();
            g.rotate(am);
            g.translate(r, 0);
            g.fillStyle = `hsla(${(hue + (n.step || 0) * 22) % 360}, 80%, ${active ? 75 : 62}%, ${(active ? 1 : 0.85) * echo})`;
            if (active && k === 0) { g.shadowColor = g.fillStyle; g.shadowBlur = 24; }
            g.beginPath();
            g.ellipse(0, 0, wid, len / 2, 0, 0, Math.PI * 2);
            g.fill();
            g.restore();
        }
        g.restore();
    }
    // Letters round the edge, at their notes.
    g.fillStyle = '#e2e8f0';
    g.font = `600 ${Math.max(11, R * 0.07)}px Outfit, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const n of main) {
        const a = ang(n.t + n.dur / 2);
        const active = pos >= n.t && pos < n.t + n.dur;
        g.globalAlpha = active ? 1 : 0.6;
        g.fillText(n.letter.toUpperCase(), Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9);
    }
    g.globalAlpha = 1;
    // Playhead.
    if (pos >= 0) {
        const a = ang(pos);
        g.strokeStyle = 'rgba(255,255,255,0.5)';
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(Math.cos(a) * R * 0.24, Math.sin(a) * R * 0.24);
        g.lineTo(Math.cos(a) * R * 0.84, Math.sin(a) * R * 0.84);
        g.stroke();
    }
    g.restore();
}

function loop(now) {
    draw(now);
    requestAnimationFrame(loop);
}

/* ── The name ── */
function update(restart = true) {
    const text = input.value.slice(0, MAX_LETTERS + 10);
    song = compose(text);
    const params = new URLSearchParams(location.search);
    if (text.trim()) params.set('n', text.trim()); else params.delete('n');
    history.replaceState(null, '', params.toString() ? '?' + params : location.pathname);
    if (song) {
        $('facts').innerHTML = `<b>${song.key} ${song.mode}</b> · ${song.tempo} bpm · ${song.instrument} · ${song.notes.filter(n => !n.grace).length} notes`;
        document.title = `${text.trim()} — Sound of Your Name`;
    } else {
        $('facts').textContent = 'Letters and numbers make notes; everything else is a pause or nothing.';
    }
    $('play').disabled = !song;
    $('save').disabled = !song;
    if (play.on && restart) { song ? startPlaying() : stopPlaying(); }
}

let debounce = null;
input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(update, 180);
});
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); update(false); startPlaying(); }
});

document.querySelectorAll('[data-try]').forEach(b => b.addEventListener('click', () => {
    input.value = b.dataset.try;
    update(false);
    startPlaying();
}));

$('share').addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(location.href);
        $('share').textContent = '✓ Link copied';
    } catch (e) {
        $('share').textContent = 'Copy the address bar';
    }
    setTimeout(() => { $('share').textContent = '🔗 Share'; }, 1600);
});

$('save').addEventListener('click', () => {
    // A square picture of the rosette with the name under it, on a dark card.
    const size = 1080;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const x = c.getContext('2d');
    x.fillStyle = '#0b0f1a';
    x.fillRect(0, 0, size, size);
    x.drawImage(canvas, 90, 40, size - 180, size - 180);
    x.fillStyle = '#f1f5f9';
    x.font = '800 64px Outfit, sans-serif';
    x.textAlign = 'center';
    x.fillText(input.value.trim(), size / 2, size - 70);
    x.fillStyle = '#94a3b8';
    x.font = '500 26px Inter, sans-serif';
    x.fillText(`${song.key} ${song.mode} · ${song.tempo} bpm`, size / 2, size - 28);
    const a = document.createElement('a');
    a.download = `${input.value.trim().replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase() || 'name'}-song.png`;
    a.href = c.toDataURL('image/png');
    a.click();
});

/* ── Start ── */
const q = new URLSearchParams(location.search);
input.value = q.get('n') || 'Neskil';
update(false);
syncButton();
$('loop').setAttribute('aria-pressed', 'true');
requestAnimationFrame(loop);
// ?at=1.2 pins the playhead there without sound — for screenshots.
if (q.has('at') && Number.isFinite(Number(q.get('at')))) pinned = Number(q.get('at'));
