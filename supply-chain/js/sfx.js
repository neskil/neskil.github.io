// Tiny WebAudio synth for UI feedback. Follows the cargo-lander audio
// pattern: lazy init on first user gesture (autoplay policy) and a mute
// flag persisted in localStorage.
window.SC = window.SC || {};

SC.sfx = (function() {
    let ctx = null;
    let muted = localStorage.getItem('scTycoonMuted') === 'true';

    function init() {
        if (ctx) {
            if (ctx.state === 'suspended') ctx.resume();
            return;
        }
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { /* no audio support — stay silent */ }
    }
    ['pointerdown', 'keydown'].forEach(ev =>
        document.addEventListener(ev, init, { once: true }));

    function tone(freq, dur, type, vol, delay) {
        if (!ctx || muted) return;
        const t0 = ctx.currentTime + (delay || 0);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(vol || 0.15, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + dur);
    }

    const sounds = {
        click:    () => tone(600, 0.06, 'sine', 0.08),
        build:    () => { tone(220, 0.12, 'square', 0.06); tone(330, 0.1, 'square', 0.05, 0.06); },
        demolish: () => tone(160, 0.18, 'sawtooth', 0.07),
        cash:     () => { tone(880, 0.09, 'sine', 0.12); tone(1320, 0.14, 'sine', 0.12, 0.08); },
        error:    () => tone(140, 0.2, 'sawtooth', 0.1),
        craft:    () => tone(520, 0.08, 'triangle', 0.07),
        unlock:   () => { tone(523, 0.1, 'sine', 0.1); tone(659, 0.1, 'sine', 0.1, 0.09); tone(784, 0.16, 'sine', 0.1, 0.18); },
        expire:   () => { tone(300, 0.12, 'triangle', 0.09); tone(210, 0.2, 'triangle', 0.09, 0.1); }
    };

    return {
        play(name) { if (sounds[name]) sounds[name](); },
        toggleMute() {
            muted = !muted;
            localStorage.setItem('scTycoonMuted', String(muted));
            return muted;
        },
        isMuted: () => muted
    };
})();
