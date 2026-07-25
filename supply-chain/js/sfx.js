// Tiny WebAudio synth for UI feedback. The AudioContext and the mix buses live
// in `audio.js` (loaded just before this) so one-shots, the ambient bed and the
// generative score share one context — this module only synthesises the blips
// and routes them into the sfx bus.
//
// `muted` here is the **Sound** toggle: one-shots *and* the world ambience.
// Music has its own toggle (`SC.audio.toggleMusic`).
window.SC = window.SC || {};

SC.sfx = (function() {
    let muted = localStorage.getItem('scTycoonMuted') === 'true';
    const lastAt = {};   // name → ctx time, for rate-limited sounds

    function bus() {
        const ctx = SC.audio.ctx();
        if (!ctx) return null;
        return { ctx, dest: SC.audio.sfxBus() || ctx.destination };
    }

    function tone(freq, dur, type, vol, delay, endFreq) {
        if (muted) return;
        const b = bus();
        if (!b) return;
        const t0 = b.ctx.currentTime + (delay || 0);
        const osc = b.ctx.createOscillator();
        const gain = b.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
        gain.gain.setValueAtTime(vol || 0.15, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        osc.connect(gain).connect(b.dest);
        osc.start(t0);
        osc.stop(t0 + dur);
    }

    // Short filtered-noise burst — used for the things that shouldn't be a
    // clean pitch (engine puff, tyre roll).
    function noise(dur, filterType, freq, vol, delay) {
        if (muted) return;
        const b = bus();
        if (!b) return;
        const t0 = b.ctx.currentTime + (delay || 0);
        const n = Math.max(1, Math.floor(b.ctx.sampleRate * dur));
        const buf = b.ctx.createBuffer(1, n, b.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        const src = b.ctx.createBufferSource();
        src.buffer = buf;
        const f = b.ctx.createBiquadFilter();
        f.type = filterType;
        f.frequency.setValueAtTime(freq, t0);
        const g = b.ctx.createGain();
        g.gain.setValueAtTime(vol, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        src.connect(f).connect(g).connect(b.dest);
        src.start(t0);
        src.stop(t0 + dur);
    }

    const sounds = {
        click:    () => tone(600, 0.06, 'sine', 0.08),
        build:    () => { tone(220, 0.12, 'square', 0.06); tone(330, 0.1, 'square', 0.05, 0.06); },
        demolish: () => tone(160, 0.18, 'sawtooth', 0.07),
        cash:     () => { tone(880, 0.09, 'sine', 0.12); tone(1320, 0.14, 'sine', 0.12, 0.08); },
        error:    () => tone(140, 0.2, 'sawtooth', 0.1),
        craft:    () => tone(520, 0.08, 'triangle', 0.07),
        unlock:   () => { tone(523, 0.1, 'sine', 0.1); tone(659, 0.1, 'sine', 0.1, 0.09); tone(784, 0.16, 'sine', 0.1, 0.18); },
        expire:   () => { tone(300, 0.12, 'triangle', 0.09); tone(210, 0.2, 'triangle', 0.09, 0.1); },
        // A truck pulling away: an airy diesel puff under a short rising note.
        // Deliberately quiet — dispatch fires this often on a busy map.
        depart:   () => { noise(0.22, 'bandpass', 240, 0.05); tone(120, 0.18, 'triangle', 0.035, 0, 165); },
        // Research finished: a brighter, longer version of `unlock`.
        science:  () => { tone(659, 0.1, 'sine', 0.09); tone(880, 0.1, 'sine', 0.09, 0.1);
                          tone(1109, 0.1, 'sine', 0.09, 0.2); tone(1319, 0.3, 'sine', 0.1, 0.3); },
        // Debt/default warning: a slow two-pulse low alarm, distinct from `error`.
        warn:     () => { tone(196, 0.22, 'square', 0.07); tone(185, 0.3, 'square', 0.07, 0.26); }
    };

    // Some sounds ride on events that can fire several times in one tick
    // (dispatch assigning a batch of jobs). Collapse those into one blip.
    const THROTTLE = { depart: 0.35, craft: 0.12 };

    return {
        play(name) {
            const fn = sounds[name];
            if (!fn || muted) return;
            const gap = THROTTLE[name];
            if (gap) {
                const ctx = SC.audio.ctx();
                if (!ctx) return;
                const now = ctx.currentTime;
                if (lastAt[name] && now - lastAt[name] < gap) return;
                lastAt[name] = now;
            }
            fn();
        },
        toggleMute() {
            muted = !muted;
            localStorage.setItem('scTycoonMuted', String(muted));
            SC.audio.setAmbientMuted(muted); // Sound covers the world ambience too
            return muted;
        },
        isMuted: () => muted
    };
})();
