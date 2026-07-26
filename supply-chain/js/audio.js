// Ambient soundscape + generative music.
//
// Owns the shared AudioContext and the two mix buses every sound in the game
// routes through, so `sfx.js`'s one-shots and the ambient bed share one
// context, and so **Music and Sound toggle independently** (the roadmap's
// "music toggle separate from sfx"). `sfx.js` asks this module for its bus
// rather than opening a second context.
//
// Everything is synthesised at runtime — there are no audio assets. That keeps
// the folder self-contained and the repo free of binary blobs, and it lets the
// score react to game state (weather, day/night, traffic) in ways a fixed
// recording can't.
//
// Like sfx.js this is a non-DOM-free module by nature (WebAudio + localStorage
// + a gesture listener), so it sits beside sfx.js in the load order rather than
// with the pure-logic modules. Nothing here reads or writes game state; it only
// *observes* it in update(), so a headless test page can load it safely (no
// gesture ever fires there, so no context is ever created).
window.SC = window.SC || {};

SC.audio = (function () {
    let ctx = null;
    let master = null, musicBus = null, sfxBus = null, ambBus = null;
    let amb = null;            // { wind, rain, hum, humFilter } — built once
    let noiseBuf = null;

    // Music defaults ON: the player already opted into sound by opening a game,
    // and autoplay policy means nothing is audible until they interact anyway.
    let musicOn = localStorage.getItem('scTycoonMusic') !== 'false';
    // Music level as a 0..1 scalar on top of MUSIC_BUS_GAIN, persisted like
    // the on/off flag. Read/written by get/setMusicVolume below (the Options
    // panel's music slider) and applied in applyMusic().
    let musicVolume = localStorage.getItem('scTycoonMusicVol') !== null
        ? Math.max(0, Math.min(1, parseFloat(localStorage.getItem('scTycoonMusicVol'))))
        : 1;

    // --- generative score -------------------------------------------------
    // A slow four-chord loop with a pad, a bass root and a sparse pentatonic
    // melody. The melody scale is fixed A-minor-pentatonic, which is consonant
    // over all four chords, so notes can be picked at random without ever
    // landing on a clash.
    const STEP = 0.5;                 // seconds per scheduler slot
    const STEPS_PER_CHORD = 16;       // → 8s per chord, 32s per loop
    const LOOKAHEAD = 0.4;            // schedule this far past the audio clock
    const PROG = [
        { root: 45, chord: [0, 3, 7, 10] },  // Am7
        { root: 41, chord: [0, 4, 7, 11] },  // Fmaj7
        { root: 48, chord: [0, 4, 7, 11] },  // Cmaj7
        { root: 43, chord: [0, 4, 7, 10] }   // G7
    ];
    const MELODY = [69, 72, 74, 76, 79, 81, 84]; // A minor pentatonic, A4 up
    let stepIdx = 0, nextStepAt = 0;

    const midi = m => 440 * Math.pow(2, (m - 69) / 12);

    // Read the render layer's cosmetic day/night + weather so the score and the
    // ambience track what the player can see. Guarded: render may not be loaded
    // (tests.html) and never is before the first frame.
    function env() {
        const R = SC._render;
        const w = R && R.weather;
        return {
            day: R ? R.dayness : 0.5,
            rain: w && w.type === 'rain' ? w.intensity : 0,
            snow: w && w.type === 'snow' ? w.intensity : 0,
            cloud: w ? w.cloud : 0,
            wind: w ? w.windMag : 0.5
        };
    }

    function makeNoise() {
        const n = ctx.sampleRate * 2;
        const b = ctx.createBuffer(1, n, ctx.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        return b;
    }

    // One looping noise source → filter → gain, parked at silence. Ambience is
    // shaped purely by moving these gains, so no nodes are ever created or
    // destroyed per frame.
    function noiseLayer(type, freq, q, dest) {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        src.loop = true;
        const f = ctx.createBiquadFilter();
        f.type = type;
        f.frequency.value = freq;
        if (q != null) f.Q.value = q;
        const g = ctx.createGain();
        g.gain.value = 0;
        src.connect(f).connect(g).connect(dest);
        src.start(0);
        // `gain` is the AudioParam, not the node — update() only ever ramps it.
        return { gain: g.gain, filter: f };
    }

    function build() {
        master = ctx.createGain();
        master.gain.value = 1;
        master.connect(ctx.destination);

        musicBus = ctx.createGain();
        musicBus.gain.value = musicOn ? 0.32 : 0;
        musicBus.connect(master);

        sfxBus = ctx.createGain();
        sfxBus.gain.value = 1;
        sfxBus.connect(master);

        // Ambience is world sound, not score — it follows the Sound (sfx)
        // toggle, so muting "Sound" silences the world and leaves the music.
        ambBus = ctx.createGain();
        // The context is built on the first gesture, long after sfx.js has
        // restored the saved Sound preference — honour it rather than fading
        // the world in for a player who muted last session.
        ambBus.gain.value = (SC.sfx && SC.sfx.isMuted()) ? 0 : 1;
        ambBus.connect(master);

        noiseBuf = makeNoise();
        amb = {
            wind: noiseLayer('lowpass', 420, null, ambBus),
            rain: noiseLayer('highpass', 1100, null, ambBus),
            hum: noiseLayer('bandpass', 110, 5, ambBus)
        };

        nextStepAt = ctx.currentTime + 0.1;
    }

    function init() {
        if (ctx) {
            if (ctx.state === 'suspended') ctx.resume();
            return ctx;
        }
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            build();
        } catch (e) { ctx = null; /* no audio support — stay silent */ }
        return ctx;
    }
    ['pointerdown', 'keydown'].forEach(ev =>
        document.addEventListener(ev, init, { once: true }));

    // --- voices -----------------------------------------------------------
    function pad(freq, t, dur, cutoff) {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(cutoff, t);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.09, t + 1.4);          // slow swell
        g.gain.setValueAtTime(0.09, t + dur - 1.8);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        f.connect(g).connect(musicBus);
        [0, 1].forEach(i => {
            const o = ctx.createOscillator();
            o.type = 'triangle';
            o.frequency.setValueAtTime(freq * (i ? 1.006 : 0.997), t); // detune
            o.connect(f);
            o.start(t);
            o.stop(t + dur + 0.1);
        });
    }

    function bass(freq, t, dur) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.11, t + 0.5);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(musicBus);
        o.start(t);
        o.stop(t + dur + 0.1);
    }

    function pluck(freq, t, vol) {
        const o = ctx.createOscillator();
        const f = ctx.createBiquadFilter();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, t);
        f.type = 'lowpass';
        f.frequency.setValueAtTime(2400, t);
        f.frequency.exponentialRampToValueAtTime(700, t + 0.9);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
        o.connect(f).connect(g).connect(musicBus);
        o.start(t);
        o.stop(t + 1.2);
    }

    // One scheduler slot. Chords land on the downbeat; the melody is a coin
    // flip per off-step, biased by daylight — busy and bright by day, sparse
    // and dark at night, so the score breathes with the day/night cycle.
    function scheduleStep(i, t) {
        const e = env();
        const ch = PROG[Math.floor(i / STEPS_PER_CHORD) % PROG.length];
        const beat = i % STEPS_PER_CHORD;

        if (beat === 0) {
            const dur = STEP * STEPS_PER_CHORD * 0.98;
            const cutoff = 620 + 900 * e.day - 260 * e.cloud;
            ch.chord.forEach(iv => pad(midi(ch.root + iv + 12), t, dur, cutoff));
            bass(midi(ch.root - 12), t, dur);
        }
        if (beat % 2 === 0 && Math.random() < 0.14 + 0.26 * e.day) {
            pluck(midi(MELODY[(Math.random() * MELODY.length) | 0]), t,
                  0.05 + 0.03 * e.day);
        }
    }

    // --- per-frame ---------------------------------------------------------
    // Called from the main loop every frame (not per sub-step: audio is
    // wall-clock, so fast-forward must not speed the music up).
    function update() {
        if (!ctx || ctx.state !== 'running') return;
        const now = ctx.currentTime;

        if (musicOn) {
            // Catch up if the tab was backgrounded (rAF stops, the audio clock
            // doesn't) rather than dumping a burst of overdue notes at once.
            if (nextStepAt < now - 1) { nextStepAt = now + 0.05; }
            while (nextStepAt < now + LOOKAHEAD) {
                scheduleStep(stepIdx++, nextStepAt);
                nextStepAt += STEP;
            }
        }

        if (!amb) return;
        const e = env();
        const quiet = (SC.state && (SC.state.paused || SC.state.gameOver)) ? 0 : 1;
        // Traffic hum rises with how many trucks are actually rolling, so a
        // busy network is audibly busy. Saturating, not linear — the 30th truck
        // shouldn't be 30× the 1st.
        const rolling = (SC.state && SC.state.trucks)
            ? SC.state.trucks.reduce((n, t) => n + (t.path ? 1 : 0), 0) : 0;
        const traffic = 1 - Math.exp(-rolling / 6);

        const set = (p, v) => p.setTargetAtTime(v, now, 0.6);
        set(amb.wind.gain, quiet * (0.012 + 0.026 * e.cloud + 0.018 * e.wind + 0.02 * e.snow));
        set(amb.rain.gain, quiet * 0.05 * e.rain);
        set(amb.hum.gain, quiet * 0.055 * traffic);
        amb.hum.filter.frequency.setTargetAtTime(95 + 45 * traffic, now, 0.8);
    }

    function applyMusic() {
        if (!musicBus) return;
        musicBus.gain.setTargetAtTime(musicOn ? 0.32 * musicVolume : 0, ctx.currentTime, 0.25);
    }

    return {
        // Shared plumbing for sfx.js.
        ctx: () => ctx || init(),
        sfxBus: () => sfxBus,
        // Ambience follows the Sound toggle (see build()).
        setAmbientMuted(m) {
            if (ambBus) ambBus.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.2);
        },
        update,
        musicEnabled: () => musicOn,
        toggleMusic() {
            musicOn = !musicOn;
            localStorage.setItem('scTycoonMusic', String(musicOn));
            init();
            applyMusic();
            return musicOn;
        },
        setMusicMuted(m) {
            musicOn = !m;
            localStorage.setItem('scTycoonMusic', String(musicOn));
            init();
            applyMusic();
            return musicOn;
        },
        getMusicVolume: () => musicVolume,
        setMusicVolume(v) {
            musicVolume = Math.max(0, Math.min(1, v));
            localStorage.setItem('scTycoonMusicVol', String(musicVolume));
            if (ctx) applyMusic();
            return musicVolume;
        }
    };
})();
