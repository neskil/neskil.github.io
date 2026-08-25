/* The house band: a smooth jazz quartet, synthesised, playing until the tab
   goes away.

   The game used to have one continuous sound — filtered noise standing in for
   wind — and a noise floor that never resolves is the kind of sound you notice
   only as irritation. This is the other half of the answer: something with a
   pulse and a harmony, quiet enough to sit under the game, arranged so that
   nothing repeats on a loop short enough to hear.

   There are no audio files. Four players, all oscillators and noise:

     · a Rhodes, comping two or three chords a bar and never on the beat;
     · an upright bass, walking quarter notes and approaching the next root
       chromatically, which is most of what makes a walking line sound walked;
     · brushes — a swirl on two and four and a ride pattern in swing eighths;
     · a horn, which is silent most of the time. It takes a phrase every few
       bars out of the notes the current chord allows and then shuts up, on
       the grounds that a melody that plays continuously over a game is a
       melody you will mute inside a minute.

   **Timing is scheduled, never fired from a timer.** A `setInterval` looks a
   bar ahead and books every note against `ctx.currentTime`; the interval only
   has to be roughly on time, and Web Audio places the note exactly. That is
   also why a throttled background tab cannot make it stumble — see resync().

   audio.js owns the context, the master gain and the mute; this file is handed
   somewhere to plug in and does not know the game exists. */
(function (G3) {
    'use strict';

    var BPM = 82;
    var BEAT = 60 / BPM;
    var SWING = 0.63;          // where the offbeat eighth lands inside the beat
    var LOOKAHEAD = 0.6;       // seconds of music booked ahead of the clock
    var TICK = 120;            // …and how often we look, in ms

    /* ── the chart ──────────────────────────────────────────────────────

       Sixteen bars in F, the two eights differing enough that the loop reads
       as a tune rather than a vamp. Each bar is a bass root, a four-note
       piano voicing and the notes the horn may choose from, all as MIDI
       numbers, because a voicing written out is one line to read and a chord
       engine is a file to maintain.

       The voicings are rootless and close, in the octave above middle C,
       which is the register a Rhodes comps in and the reason none of this
       fights the bass. */
    function bar(root, voice, colour) {
        return { root: root, voice: voice, colour: colour };
    }

    var FORM = [
        bar(41, [57, 60, 64, 67], [72, 76, 77, 79, 81]),   // Fmaj9
        bar(43, [58, 62, 65, 69], [74, 77, 79, 81, 82]),   // Gm9
        bar(45, [60, 64, 67, 69], [72, 76, 79, 81, 84]),   // Am7
        bar(38, [54, 60, 63, 69], [75, 78, 81, 84]),       // D7♭9
        bar(43, [58, 62, 65, 69], [74, 77, 79, 82, 86]),   // Gm9
        bar(36, [58, 64, 69, 72], [70, 74, 76, 79, 81]),   // C13
        bar(41, [57, 60, 64, 67], [69, 72, 76, 79, 81]),   // Fmaj9
        bar(38, [57, 60, 64, 65], [72, 74, 76, 77, 81]),   // Dm9
        bar(46, [62, 65, 69, 72], [74, 77, 81, 84]),       // B♭maj9
        bar(46, [61, 65, 68, 72], [73, 77, 80, 84]),       // B♭m7 — the borrowed one
        bar(45, [60, 64, 67, 69], [72, 76, 79, 81]),       // Am7
        bar(38, [54, 60, 63, 69], [75, 78, 81, 84]),       // D7♭9
        bar(43, [58, 62, 65, 69], [74, 77, 79, 81, 82]),   // Gm9
        bar(36, [58, 64, 69, 72], [70, 74, 76, 79, 81]),   // C13
        bar(41, [57, 60, 64, 67], [72, 76, 77, 79, 81]),   // Fmaj9
        bar(36, [58, 64, 69, 72], [70, 74, 76, 79])        // C13, and round again
    ];

    /* Comp patterns, in beats from the top of the bar. Anticipations — the
       .5s and the -0.33s — are the whole character of the thing: a chord
       landing squarely on beat one sounds like a hymn. */
    var COMPS = [
        [0.66, 2.5],
        [1.5, 3.0],
        [0, 2.66],
        [1.66],
        [0.5, 2.0, 3.5],
        [2.33]
    ];

    function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

    /* ── state ──────────────────────────────────────────────────────────── */

    var M = {
        ctx: null, out: null,       // where audio.js told us to plug in
        bus: null, verb: null, send: null,
        on: false,
        timer: 0,
        bar: 0,                     // bars since the band struck up
        next: 0,                    // …and when the next one is due, in ctx time
        hornRest: 4                 // bars until the horn is allowed back in
    };

    /* A room, as an impulse: noise under an exponential decay, which is the
       cheapest convincing reverb there is and the difference between four
       synthesised instruments and a band in a bar. */
    function impulse(c, seconds, decay) {
        var n = Math.floor(c.sampleRate * seconds);
        var buf = c.createBuffer(2, n, c.sampleRate);
        for (var ch = 0; ch < 2; ch++) {
            var d = buf.getChannelData(ch);
            for (var i = 0; i < n; i++) {
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
            }
        }
        return buf;
    }

    function env(g, t, peak, attack, hold, release) {
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
        g.gain.setValueAtTime(Math.max(0.0002, peak), t + attack + hold);
        g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
    }

    function stop(node, t, tail) { node.stop(t + tail + 0.05); }

    /* ── the players ────────────────────────────────────────────────────── */

    /* The Rhodes. A sine for the body, a quiet sine two octaves up for the
       tine, and a third detuned a couple of cents so two of them beat against
       each other — which is the whole trick, and why an electric piano sounds
       warm where a bare sine sounds like a test tone. */
    function rhodes(note, t, gain, dur) {
        var c = M.ctx, f = midi(note);
        var g = c.createGain();
        var lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1400 + f * 2.5;
        g.connect(lp);
        lp.connect(M.bus);
        lp.connect(M.send);

        var a = c.createOscillator(), b = c.createOscillator(), tine = c.createOscillator();
        a.type = b.type = tine.type = 'sine';
        a.frequency.value = f;
        b.frequency.value = f * 1.0015;
        tine.frequency.value = f * 4;
        var tg = c.createGain();
        tg.gain.setValueAtTime(gain * 0.22, t);
        tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        tine.connect(tg).connect(g);
        a.connect(g); b.connect(g);

        env(g, t, gain, 0.012, dur * 0.3, dur);
        a.start(t); b.start(t); tine.start(t);
        stop(a, t, dur * 1.4); stop(b, t, dur * 1.4); stop(tine, t, 0.3);
    }

    /* The bass. A triangle under a low-pass is a plucked string near enough;
       what sells it is the pitch sliding up over the first 40ms, which is the
       finger dragging the string down to the board. */
    function upright(note, t, gain) {
        var c = M.ctx, f = midi(note);
        var o = c.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(f * 0.94, t);
        o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
        var lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 320;
        lp.Q.value = 0.8;
        var g = c.createGain();
        env(g, t, gain, 0.015, BEAT * 0.35, BEAT * 0.5);
        o.connect(lp).connect(g).connect(M.bus);
        o.start(t);
        stop(o, t, BEAT * 1.2);
    }

    /* The horn. Sawtooth through a low-pass that opens with the note and a
       little vibrato arriving late, the way a player leans on a long one. */
    function horn(note, t, gain, dur) {
        var c = M.ctx, f = midi(note);
        var o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(f, t);

        var vib = c.createOscillator(), vibG = c.createGain();
        vib.frequency.value = 5.2;
        vibG.gain.setValueAtTime(0, t);
        vibG.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.5, dur * 0.6));
        vib.connect(vibG).connect(o.frequency);

        var lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.Q.value = 3;
        lp.frequency.setValueAtTime(f * 1.6, t);
        lp.frequency.linearRampToValueAtTime(f * 3.4, t + 0.12);
        lp.frequency.linearRampToValueAtTime(f * 1.8, t + dur);

        var g = c.createGain();
        env(g, t, gain, 0.06, dur * 0.6, dur * 0.5);
        o.connect(lp).connect(g);
        g.connect(M.bus);
        g.connect(M.send);
        o.start(t); vib.start(t);
        stop(o, t, dur * 1.6); stop(vib, t, dur * 1.6);
    }

    // One second of noise, made once and re-used by every brush stroke: a
    // fresh buffer per cymbal hit is a kilobyte of random numbers a beat.
    var noiseBuf = null;
    function noise(c) {
        if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
            var n = Math.floor(c.sampleRate);
            noiseBuf = c.createBuffer(1, n, c.sampleRate);
            var d = noiseBuf.getChannelData(0);
            for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        }
        return noiseBuf;
    }

    function brush(t, gain, freq, q, attack, dur, type) {
        var c = M.ctx;
        var src = c.createBufferSource();
        src.buffer = noise(c);
        src.playbackRate.value = 0.8 + Math.random() * 0.4;
        var f = c.createBiquadFilter();
        f.type = type || 'bandpass';
        f.frequency.value = freq;
        f.Q.value = q;
        var g = c.createGain();
        env(g, t, gain, attack, 0, dur);
        src.connect(f).connect(g);
        g.connect(M.bus);
        g.connect(M.send);
        src.start(t);
        src.stop(t + attack + dur + 0.05);
    }

    /* ── the arrangement ────────────────────────────────────────────────── */

    // Where the offbeat eighth falls. Straight eighths sit at 0.5; swing puts
    // them nearer two thirds, and 0.63 is the lazy end of that.
    function at(barStart, beats) {
        var whole = Math.floor(beats);
        var frac = beats - whole;
        if (frac > 0.4 && frac < 0.6) frac = SWING;
        return barStart + (whole + frac) * BEAT;
    }

    function walk(chord, next, beat) {
        var tones = [chord.root, chord.voice[0] - 12, chord.voice[1] - 12, chord.voice[2] - 12];
        if (beat === 0) return chord.root;
        if (beat === 3) {
            // The approach note: a semitone either side of where the bar is
            // going, picked so the line keeps travelling the way it was.
            return next.root + (Math.random() < 0.5 ? -1 : 1);
        }
        return tones[1 + Math.floor(Math.random() * (tones.length - 1))];
    }

    function playBar(index, t0) {
        var chord = FORM[index % FORM.length];
        var next = FORM[(index + 1) % FORM.length];
        var i;

        // Bass: four to the bar, the first one leaned on.
        for (i = 0; i < 4; i++) {
            upright(walk(chord, next, i), t0 + i * BEAT, i === 0 ? 0.30 : 0.24);
        }

        // Piano: one pattern of the six, dropped an octave now and then so
        // the comp moves around rather than sitting in one band all night.
        var comp = COMPS[Math.floor(Math.random() * COMPS.length)];
        var drop = Math.random() < 0.25 ? -12 : 0;
        for (i = 0; i < comp.length; i++) {
            var when = at(t0, comp[i]);
            var vel = 0.055 + Math.random() * 0.035;
            for (var v = 0; v < chord.voice.length; v++) {
                // A hand does not land four notes at the same instant.
                rhodes(chord.voice[v] + drop, when + v * 0.006, vel, 1.1 + Math.random() * 0.5);
            }
        }

        // Brushes. The ride keeps the swing, the swirl answers on two and four
        // and there is a feathered thump on one you feel rather than hear.
        for (i = 0; i < 4; i++) {
            brush(t0 + i * BEAT, i % 2 ? 0.020 : 0.026, 7200, 0.9, 0.004, 0.22, 'highpass');
            if (i === 1 || i === 3) {
                brush(at(t0, i + 0.5), 0.013, 6400, 0.9, 0.004, 0.16, 'highpass');
                brush(t0 + i * BEAT, 0.030, 1500, 0.5, 0.09, 0.34);
            }
        }

        // The horn, when it has finished resting. Two to four notes off the
        // chord, stepping rather than leaping, and then several bars of
        // nothing — which is the part that keeps it listenable.
        M.hornRest -= 1;
        if (M.hornRest <= 0) {
            var pick = Math.floor(Math.random() * chord.colour.length);
            var start = 0.5 + Math.floor(Math.random() * 2);
            var n = 2 + Math.floor(Math.random() * 3);
            for (i = 0; i < n; i++) {
                var beats = start + i * (Math.random() < 0.6 ? 0.5 : 1);
                if (beats > 3.9) break;
                horn(chord.colour[pick], at(t0, beats), 0.030, 0.28 + Math.random() * 0.45);
                pick = Math.max(0, Math.min(chord.colour.length - 1,
                    pick + (Math.random() < 0.5 ? -1 : 1)));
            }
            M.hornRest = 3 + Math.floor(Math.random() * 4);
        }
    }

    /* The lookahead. Everything above books notes at an absolute time; this is
       the only thing that watches a clock, and all it has to be is roughly
       punctual. */
    function pump() {
        if (!M.on || !M.ctx) return;
        var horizon = M.ctx.currentTime + LOOKAHEAD;
        var guard = 0;
        while (M.next < horizon && guard++ < 4) {
            playBar(M.bar, M.next);
            M.bar += 1;
            M.next += BEAT * 4;
        }
    }

    /* A suspended context stops its clock, and a hidden tab throttles the
       interval to once a second; between them the band can come back to find
       the next bar was due a while ago. Rather than play the backlog at once,
       drop it and come in on the next bar. */
    function resync() {
        if (!M.ctx) return;
        if (M.next < M.ctx.currentTime + 0.05) M.next = M.ctx.currentTime + 0.12;
    }

    G3.music = {
        /* Plug in. `out` is audio.js's master gain — mute and the tab-out duck
           are its business, not ours, and this file has no volume control of
           its own beyond the level the parts are written at. */
        start: function (ctx, out) {
            if (M.on) return;
            if (!ctx || !out) return;
            M.ctx = ctx;
            M.out = out;

            /* Four voices whose loud moments can line up — a comp landing on
               a bass note under a cymbal — so the band goes through a
               compressor before it goes anywhere near the master. It is there
               to stop the peaks poking out of the mix rather than to squash
               anything: at these levels it barely works, and on the one bar in
               twenty where everything lands together it is the difference
               between background music and a thump. */
            M.bus = ctx.createGain();
            M.bus.gain.value = 0.5;
            var comp = ctx.createDynamicsCompressor();
            comp.threshold.value = -22;
            comp.knee.value = 26;
            comp.ratio.value = 3.5;
            comp.attack.value = 0.006;
            comp.release.value = 0.28;
            M.bus.connect(comp).connect(out);

            M.verb = ctx.createConvolver();
            M.verb.buffer = impulse(ctx, 1.9, 2.6);
            var wet = ctx.createGain();
            wet.gain.value = 0.5;
            M.verb.connect(wet).connect(comp);
            M.send = ctx.createGain();
            M.send.gain.value = 0.35;
            M.send.connect(M.verb);

            M.on = true;
            M.bar = 0;
            M.next = ctx.currentTime + 0.25;
            M.timer = setInterval(pump, TICK);
            pump();
        },

        stop: function () {
            if (!M.on) return;
            M.on = false;
            clearInterval(M.timer);
            M.timer = 0;
            // Notes already booked play out over the master gain, which is
            // where the fade lives; the bus is what stops taking new ones.
            if (M.bus) M.bus.disconnect();
            if (M.send) M.send.disconnect();
            if (M.verb) M.verb.disconnect();
            M.bus = M.send = M.verb = null;
        },

        resync: resync,
        get playing() { return M.on; }
    };

})(window.G3);
