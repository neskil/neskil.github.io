/* Synthesised sound effects — no audio files to ship, and nothing is created
   until the first putt, because browsers refuse to start an AudioContext
   before a gesture and a suspended context logs a warning on every load.

   Same shape as the 2D game's audio module, retuned: this course has bigger
   drops, so it needs a landing thud and a machinery hum the flat one did not.

   Three rules about when this file is allowed to make a sound, all of them
   about not being the tab somebody is hunting for:

   - **It starts muted.** A game that begins talking to a room is a game that
     gets closed, so the first visit is silent and the speaker chip is the
     invitation. After that the choice is remembered, whichever way it went.
   - **Nothing plays into a tab you are not looking at.** visibilitychange and
     the window's own focus duck the master gain to nothing and then suspend
     the whole context, so a backgrounded round costs no audio thread and,
     more to the point, makes no noise.
   - **The bed is quiet and the band is optional.** Everything routes through
     one master gain, which is the only thing mute, the duck and the fade have
     to touch — see `setAwake`.

   The music itself is in music.js, which owns the notes and knows nothing
   about the game; this file owns the context it plays into. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var ctx = null;
    var master = null;       // everything, effects and bed and band alike
    var muted = true;        // …until localStorage says otherwise
    var music = true;
    var awake = true;        // false while the tab is hidden or unfocused

    try {
        // No stored preference is a first visit, and a first visit is silent.
        var storedMute = localStorage.getItem(C.MUTE_KEY);
        if (storedMute !== null) muted = storedMute === '1';
        music = localStorage.getItem(C.MUSIC_KEY) !== '0';
    } catch (e) { /* ignore */ }

    function ensure() {
        if (muted) return null;
        if (!ctx) {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
            master = ctx.createGain();
            master.gain.value = awake ? 1 : 0;
            master.connect(ctx.destination);
        }
        // A hidden tab has no frames and no input, so nothing should be asking
        // — but a stray timer might, and waking the context to serve it is
        // exactly the noise this file is trying not to make.
        if (!awake) return null;
        if (ctx.state === 'suspended') ctx.resume();
        // The weather asked for a sound bed before there was a context to put
        // it in — which is always, since the weather is chosen when the hole
        // loads and the context cannot exist until the player has touched
        // something. First effect of the round is what actually starts it.
        if (pending && !bed) startBed();
        startMusic();
        return ctx;
    }

    function startMusic() {
        if (!music || muted || !ctx || !G3.music || G3.music.playing) return;
        G3.music.start(ctx, master);
    }

    /* Tab out, and the whole thing goes away: the master gain falls to nothing
       over a tenth of a second — a hard cut clicks — and once it has, the
       context is suspended, which stops the bed's loop, the band's clock and
       the audio thread with them. Coming back is the same in reverse, plus a
       nudge to music.js to stop counting from wherever its clock froze. */
    function setAwake(on) {
        if (awake === on) return;
        awake = on;
        if (!ctx || !master) return;
        var t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setTargetAtTime(on ? 1 : 0, t, 0.04);
        if (on) {
            if (ctx.state === 'suspended') {
                var r = ctx.resume();
                if (r && r.then) r.then(function () { if (G3.music) G3.music.resync(); });
                else if (G3.music) G3.music.resync();
            } else if (G3.music) {
                G3.music.resync();
            }
        } else {
            // Long enough for the fade to finish, short enough that a glance
            // at another tab is silent by the time you get there.
            setTimeout(function () {
                if (!awake && ctx && ctx.state === 'running') ctx.suspend();
            }, 220);
        }
    }

    function watchFocus() {
        document.addEventListener('visibilitychange', function () {
            setAwake(!document.hidden);
        });
        // Alt-tabbing to another application leaves the tab visible, and it is
        // still the same "I am not here" the player means by it.
        window.addEventListener('blur', function () { setAwake(false); });
        window.addEventListener('focus', function () {
            if (!document.hidden) setAwake(true);
        });
    }
    watchFocus();

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
        o.connect(g).connect(master);
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
        src.connect(f).connect(g).connect(master);
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

        src.connect(windF).connect(windG).connect(master);
        src.connect(rainF).connect(rainG).connect(master);

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
        // A third of what it was. The bed used to be the loudest thing in the
        // game and the only one that never stopped, which is the recipe for a
        // sound nobody can name and everybody wants off; under the band it is
        // air rather than hiss, and on a still hole it is barely there at all.
        bed.windG.gain.setTargetAtTime(0.003 + wind * 0.019, t, 0.9);
        bed.rainG.gain.cancelScheduledValues(t);
        bed.rainG.gain.setTargetAtTime(rain * 0.030, t, 0.9);
        bed.lfoG.gain.setTargetAtTime(0.002 + wind * 0.011, t, 0.9);
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
            startMusic();
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
            // The bed and the band are loops, not effects: muting has to reach
            // in and stop them, because nothing is going to stop asking.
            if (muted) {
                if (G3.music) G3.music.stop();
                applyBed(null);
            } else {
                // Unmuting is the gesture the context has been waiting for, so
                // this is where a first-visit round actually gets its sound.
                ensure();
                applyBed(pending);
                startMusic();
            }
            return muted;
        },
        isMuted: function () { return muted; },

        /* The band, separately. Some people want a course with weather on it
           and nothing else, and "sound" and "music" being one switch is how you
           end up with neither. */
        toggleMusic: function () {
            music = !music;
            try { localStorage.setItem(C.MUSIC_KEY, music ? '1' : '0'); } catch (e) { /* ignore */ }
            if (!music) { if (G3.music) G3.music.stop(); }
            else { ensure(); startMusic(); }
            return music;
        },
        hasMusic: function () { return music; }
    };

    G3.audio = A;

})(window.G3);
