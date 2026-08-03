/**
 * game/audio.js — procedural sound, no asset files.
 *
 * Everything is synthesised on a shared AudioContext created lazily on the
 * first sound, so the page never trips a browser's autoplay policy.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};

    let ctx = null;
    let master = null;
    let muted = false;
    let lastEngine = 0;

    function context() {
        if (!ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
            master = ctx.createGain();
            master.gain.value = muted ? 0 : 0.28;
            master.connect(ctx.destination);
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function tone(type, freqFrom, freqTo, duration, gain) {
        if (muted) return;
        const c = context();
        if (!c) return;

        const osc = c.createOscillator();
        const env = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freqFrom, c.currentTime);
        if (freqTo !== freqFrom) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(freqTo, 1), c.currentTime + duration);
        }
        env.gain.setValueAtTime(gain, c.currentTime);
        env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

        osc.connect(env);
        env.connect(master);
        osc.start();
        osc.stop(c.currentTime + duration + 0.02);
    }

    function noise(duration, filterHz, q, gain) {
        if (muted) return;
        const c = context();
        if (!c) return;

        const size = Math.floor(c.sampleRate * duration);
        const buffer = c.createBuffer(1, size, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;

        const src = c.createBufferSource();
        src.buffer = buffer;

        const filter = c.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = filterHz;
        filter.Q.value = q;

        const env = c.createGain();
        env.gain.setValueAtTime(gain, c.currentTime);
        env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

        src.connect(filter);
        filter.connect(env);
        env.connect(master);
        src.start();
    }

    const Audio = {
        /** Twistlocks engaging — a unit set down. */
        lock: function () {
            tone('triangle', 150, 32, 0.20, 0.7);
            noise(0.08, 2200, 2.0, 0.10);
        },
        /** Unit lifted back off the stack. */
        lift: function () {
            tone('sine', 320, 620, 0.12, 0.22);
        },
        /** Rejected placement. */
        reject: function () {
            tone('square', 180, 120, 0.14, 0.16);
        },
        /** Rotation click. */
        click: function () {
            tone('square', 900, 700, 0.05, 0.07);
        },
        hydraulic: function () {
            noise(0.15, 1200, 3.0, 0.12);
        },
        engine: function () {
            const now = Date.now();
            if (now - lastEngine < 110) return;
            lastEngine = now;
            tone('sawtooth', 56, 84, 0.14, 0.10);
        },
        /** Mission complete fanfare — pitch rises with the medal. */
        fanfare: function (medal) {
            const base = medal === 'gold' ? 523.25 : medal === 'silver' ? 440 : 392;
            const steps = medal === 'gold' ? [0, 4, 7, 12] : medal === 'silver' ? [0, 4, 7] : [0, 5];
            steps.forEach(function (semi, i) {
                setTimeout(function () {
                    tone('triangle', base * Math.pow(2, semi / 12), base * Math.pow(2, semi / 12), 0.34, 0.22);
                }, i * 130);
            });
        },
        toggleMute: function () {
            muted = !muted;
            if (master) master.gain.value = muted ? 0 : 0.28;
            return muted;
        },
        setMuted: function (value) {
            muted = !!value;
            if (master) master.gain.value = muted ? 0 : 0.28;
            return muted;
        },
        isMuted: function () { return muted; }
    };

    Cargo3D.Audio = Audio;
})(window);
