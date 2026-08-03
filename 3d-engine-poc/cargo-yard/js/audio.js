(function (window) {
    'use strict';

    // Procedural WebAudio — no samples, nothing to download.
    //
    // The engine used to spawn a fresh oscillator every animation frame the
    // throttle was held, which is sixty nodes a second and audibly granular.
    // It is now one long-lived drone whose gain and pitch follow road speed.
    const CY = window.CY = window.CY || {};

    let ctx = null;
    let master = null;
    let muted = false;

    let engine = null;      // { osc, sub, gain, filter }
    let engineTarget = 0;   // 0..1, set by the vehicle each frame

    function context() {
        if (!ctx) {
            const Ctor = window.AudioContext || window.webkitAudioContext;
            if (!Ctor) return null;
            ctx = new Ctor();
            master = ctx.createGain();
            master.gain.value = muted ? 0 : 0.3;
            master.connect(ctx.destination);
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function clunk() {
        if (muted) return;
        const c = context();
        if (!c) return;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, c.currentTime + 0.18);
        gain.gain.setValueAtTime(0.8, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.2);
        osc.connect(gain); gain.connect(master);
        osc.start(); osc.stop(c.currentTime + 0.22);
    }

    function hiss(duration, freq, level) {
        if (muted) return;
        const c = context();
        if (!c) return;
        const len = Math.floor(c.sampleRate * (duration || 0.15));
        const buffer = c.createBuffer(1, len, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        const noise = c.createBufferSource();
        noise.buffer = buffer;
        const filter = c.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = freq || 1200;
        filter.Q.value = 3.0;
        const gain = c.createGain();
        gain.gain.setValueAtTime(level || 0.15, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + (duration || 0.15));
        noise.connect(filter); filter.connect(gain); gain.connect(master);
        noise.start();
    }

    function hydraulic() { hiss(0.15, 1200, 0.15); }

    function blip(freq, duration, type) {
        if (muted) return;
        const c = context();
        if (!c) return;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freq, c.currentTime);
        gain.gain.setValueAtTime(0.14, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, c.currentTime + (duration || 0.1));
        osc.connect(gain); gain.connect(master);
        osc.start(); osc.stop(c.currentTime + (duration || 0.1) + 0.02);
    }

    // Game feedback ------------------------------------------------------
    function good() { blip(660, 0.09); blip(990, 0.12); }
    function bad() { blip(150, 0.16, 'sawtooth'); }
    function fanfare(stars) {
        const notes = [523, 659, 784, 1047];
        for (let i = 0; i <= Math.max(0, stars); i++) {
            const f = notes[Math.min(i, notes.length - 1)];
            window.setTimeout(function () { blip(f, 0.22, 'triangle'); }, i * 130);
        }
    }

    // Engine -------------------------------------------------------------
    function ensureEngine() {
        const c = context();
        if (!c || engine) return engine;
        const osc = c.createOscillator();
        const sub = c.createOscillator();
        const filter = c.createBiquadFilter();
        const gain = c.createGain();
        osc.type = 'sawtooth';
        sub.type = 'sine';
        osc.frequency.value = 55;
        sub.frequency.value = 27.5;
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        gain.gain.value = 0;
        osc.connect(filter); sub.connect(filter);
        filter.connect(gain); gain.connect(master);
        osc.start(); sub.start();
        engine = { osc: osc, sub: sub, gain: gain, filter: filter };
        return engine;
    }

    // load is 0..1 — the vehicle's |speed| over its top speed.
    function setEngineLoad(load) {
        engineTarget = Math.max(0, Math.min(1, load || 0));
        if (engineTarget > 0.01) ensureEngine();
    }

    // Driven from the render loop so the drone glides instead of stepping.
    function update(delta) {
        if (!engine || !ctx) return;
        const now = ctx.currentTime;
        const level = muted ? 0 : engineTarget * 0.16;
        engine.gain.gain.setTargetAtTime(level, now, 0.08);
        engine.osc.frequency.setTargetAtTime(52 + engineTarget * 48, now, 0.12);
        engine.sub.frequency.setTargetAtTime(26 + engineTarget * 24, now, 0.12);
        engine.filter.frequency.setTargetAtTime(320 + engineTarget * 900, now, 0.12);
    }

    function setMuted(next) {
        muted = !!next;
        if (master) master.gain.value = muted ? 0 : 0.3;
        return muted;
    }

    function toggleMute() { return setMuted(!muted); }

    CY.audio = {
        clunk: clunk,
        hiss: hiss,
        hydraulic: hydraulic,
        blip: blip,
        good: good,
        bad: bad,
        fanfare: fanfare,
        setEngineLoad: setEngineLoad,
        update: update,
        setMuted: setMuted,
        toggleMute: toggleMute,
        isMuted: function () { return muted; }
    };

})(window);
