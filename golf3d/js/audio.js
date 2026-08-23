/* audio.js — every sound the game makes, synthesised.

   No audio files ship and none are fetched. Two halves: one-shot effects (the
   strike, a bounce, a rim, the cup) and the weather's bed, a continuous wind
   and rain loop whose two gains follow the sky.

   Read by game.js and game/hud.js. Depends on config.js. Touches nothing else
   — it is handed numbers and makes a noise.

   Synthesised sound effects — no audio files to ship, and nothing is created
   until the first putt, because browsers refuse to start an AudioContext
   before a gesture and a suspended context logs a warning on every load.

   Same shape as the 2D game's audio module, retuned: this course has bigger
   drops, so it needs a landing thud and a machinery hum the flat one did not. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var ctx = null;
    var muted = false;

    try {
        muted = localStorage.getItem(C.MUTE_KEY) === '1';
    } catch (e) { /* ignore */ }

    function ensure() {
        if (muted) return null;
        if (!ctx) {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
        }
        if (ctx.state === 'suspended') ctx.resume();
        // The weather asked for a sound bed before there was a context to put
        // it in — which is always, since the weather is chosen when the hole
        // loads and the context cannot exist until the player has touched
        // something. First effect of the round is what actually starts it.
        if (pending && !bed) startBed();
        return ctx;
    }

    function tone(freq, dur, type, gain, slideTo) {
        var c = ensure();
        if (!c) return;
        var o = c.createOscillator(), g = c.createGain();
        o.type = type || 'sine';
        o.frequency.setValueAtTime(freq, c.currentTime);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
        g.gain.setValueAtTime(0.0001, c.currentTime);
        g.gain.exponentialRampToValueAtTime(gain || 0.2, c.currentTime + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
        o.connect(g).connect(c.destination);
        o.start();
        o.stop(c.currentTime + dur + 0.02);
    }

    // Filtered white noise, which is most of what a golf course sounds like:
    // sand, splashes and the thump of a ball into a cup.
    function noise(dur, freq, q, gain, type) {
        var c = ensure();
        if (!c) return;
        var n = Math.floor(c.sampleRate * dur);
        var buf = c.createBuffer(1, n, c.sampleRate);
        var d = buf.getChannelData(0), i;
        for (i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        var src = c.createBufferSource();
        src.buffer = buf;
        var f = c.createBiquadFilter();
        f.type = type || 'bandpass';
        f.frequency.value = freq;
        f.Q.value = q || 1;
        var g = c.createGain();
        g.gain.value = gain || 0.2;
        src.connect(f).connect(g).connect(c.destination);
        src.start();
    }

    /* ── the bed ────────────────────────────────────────────────────────

       Everything above is a sound that happens. This is the sound that is
       always happening: wind through the noise floor, and rain on top of it
       when there is rain. Both are the same second of looped white noise
       through different filters — a lowpass so narrow it is more of a hiss
       than a sound for the wind, and a bandpass up in the sibilance for the
       rain — with the wind's cutoff and gain riding a slow LFO so it breathes
       instead of sitting there.

       One buffer, two filters, two gains, and it never restarts: changing the
       weather ramps the gains and leaves the loop running, which is why a
       squall can arrive without a click. */
    var bed = null;
    var pending = null;

    function noiseLoop(c, seconds) {
        var n = Math.floor(c.sampleRate * seconds);
        var buf = c.createBuffer(1, n, c.sampleRate);
        var d = buf.getChannelData(0), i, last = 0;
        for (i = 0; i < n; i++) {
            // Brown-ish rather than white: a flat spectrum reads as static,
            // and the low end is what makes it read as air.
            last = (last + (Math.random() * 2 - 1) * 0.14) * 0.985;
            d[i] = last;
        }
        // Crossfade the tail into the head so the loop point is inaudible.
        var fade = Math.min(n >> 3, Math.floor(c.sampleRate * 0.25));
        for (i = 0; i < fade; i++) {
            var k = i / fade;
            d[i] = d[i] * k + d[n - fade + i] * (1 - k);
        }
        return buf;
    }

    function startBed() {
        var c = ctx;
        if (!c || bed) return;
        var src = c.createBufferSource();
        src.buffer = noiseLoop(c, 4);
        src.loop = true;

        var windF = c.createBiquadFilter();
        windF.type = 'lowpass';
        windF.frequency.value = 420;
        windF.Q.value = 0.6;
        var windG = c.createGain();
        windG.gain.value = 0;

        var rainF = c.createBiquadFilter();
        rainF.type = 'bandpass';
        rainF.frequency.value = 3200;
        rainF.Q.value = 0.35;
        var rainG = c.createGain();
        rainG.gain.value = 0;

        src.connect(windF).connect(windG).connect(c.destination);
        src.connect(rainF).connect(rainG).connect(c.destination);

        // The gust: one slow oscillator on the wind's gain and another, slower
        // still, on its cutoff. Nothing else in the game breathes, and without
        // this the wind is a fan.
        var lfo = c.createOscillator();
        lfo.frequency.value = 0.07;
        var lfoG = c.createGain();
        lfoG.gain.value = 0;
        lfo.connect(lfoG).connect(windG.gain);

        var lfo2 = c.createOscillator();
        lfo2.frequency.value = 0.041;
        var lfo2G = c.createGain();
        lfo2G.gain.value = 160;
        lfo2.connect(lfo2G).connect(windF.frequency);

        src.start();
        lfo.start();
        lfo2.start();
        bed = { windG: windG, rainG: rainG, lfoG: lfoG, windF: windF };
        if (pending) applyBed(pending);
    }

    function applyBed(w) {
        if (!bed || !ctx) return;
        var t = ctx.currentTime;
        var wind = Math.max(0, Math.min(1, (w && w.wind) || 0));
        var rain = Math.max(0, Math.min(1, (w && w.rain) || 0));
        // Two seconds to cross over, which is about how long a hole takes to
        // load and long enough that nobody hears it happen.
        bed.windG.gain.cancelScheduledValues(t);
        bed.windG.gain.setTargetAtTime(0.010 + wind * 0.055, t, 0.9);
        bed.rainG.gain.cancelScheduledValues(t);
        bed.rainG.gain.setTargetAtTime(rain * 0.075, t, 0.9);
        bed.lfoG.gain.setTargetAtTime(0.006 + wind * 0.030, t, 0.9);
        bed.windF.frequency.setTargetAtTime(320 + wind * 520, t, 0.9);
    }

    var A = {
        /* The weather hands over its own record and the bed reads two numbers
           off it. Called on every hole load, whether or not there is a context
           yet: if there is not, the profile is remembered and the first putt
           of the round starts the loop. */
        ambience: function (w) {
            pending = w || null;
            if (muted) { if (bed) applyBed(null); return; }
            if (ctx && !bed) startBed();
            applyBed(pending);
        },

        /* The strike. Three layers, because one oscillator sounds like a
           doorbell: the click of the face, a body that drops in pitch with the
           power behind it, and a thump you feel more than hear on a big one. */
        putt: function (power) {
            var p = Math.max(0.15, Math.min(1, power));
            noise(0.035, 2600 - p * 900, 1.2, 0.05 + p * 0.07, 'bandpass');
            tone(190 + p * 210, 0.1, 'triangle', 0.15 + p * 0.12, 60);
            if (p > 0.45) tone(90 + p * 40, 0.16, 'sine', 0.06 + p * 0.12, 40);
        },

        /* One notch of the ratchet as the shot is wound back. Quiet, short and
           rising, so a long pull sounds like a long pull. */
        tick: function (frac) {
            var p = Math.max(0, Math.min(1, frac));
            tone(420 + p * 620, 0.028, 'square', 0.022 + p * 0.03);
        },
        bounce: function (speed) {
            var p = Math.max(0.1, Math.min(1, speed / 12));
            tone(320 + p * 220, 0.06, 'square', 0.03 + p * 0.05, 180);
        },
        land: function (speed) {
            var p = Math.max(0.1, Math.min(1, speed / 10));
            noise(0.07, 180 + p * 120, 1.2, 0.05 + p * 0.07, 'lowpass');
        },
        // The rattle of the rim: the ball catching the edge of the cup and
        // either dropping or being thrown back out.
        rim: function (speed) {
            var p = Math.max(0.1, Math.min(1, speed / 8));
            tone(520 + p * 260, 0.05, 'triangle', 0.05 + p * 0.06, 240);
            noise(0.05, 900, 2.5, 0.04 + p * 0.05);
        },
        sand: function () { noise(0.22, 2600, 0.7, 0.09, 'highpass'); },
        splash: function () {
            noise(0.4, 900, 0.6, 0.2);
            tone(420, 0.35, 'sine', 0.1, 90);
        },
        out: function () {
            tone(300, 0.5, 'sawtooth', 0.08, 60);
        },
        sink: function () {
            noise(0.09, 260, 3, 0.16);               // the ball hitting the cup
            [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
                setTimeout(function () { tone(f, 0.22, 'sine', 0.13); }, 70 + i * 85);
            });
        },
        ace: function () {
            [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) {
                setTimeout(function () { tone(f, 0.35, 'triangle', 0.15); }, i * 90);
            });
        },
        toggleMute: function () {
            muted = !muted;
            try { localStorage.setItem(C.MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* ignore */ }
            // The bed is a loop, not an effect: muting has to reach in and
            // turn it down, because nothing is going to stop asking for it.
            applyBed(muted ? null : pending);
            return muted;
        },
        isMuted: function () { return muted; }
    };

    G3.audio = A;

})(window.G3);
