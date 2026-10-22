/* Synthesised sound effects — no audio files to ship, and nothing is created
   until the first putt, because browsers refuse to start an AudioContext
   before a gesture and a suspended context logs a warning on every load. */
(function (GOLF) {
    'use strict';

    var ctx = null;
    var muted = false;

    try {
        muted = localStorage.getItem('miniGolf.muted') === '1';
    } catch (e) { /* ignore */ }

    function ensure() {
        if (muted) return null;
        if (!ctx) {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
        }
        if (ctx.state === 'suspended' && !document.hidden) ctx.resume();
        // The course's soundscape waits for the first sound a player asked
        // for: that is the gesture the browser wants before anything plays.
        if (amb.want.length && !amb.on && !document.hidden) startAmbience();
        return ctx;
    }

    function tone(freq, dur, type, gain, slideTo, out, at) {
        var c = ensure();
        if (!c) return;
        var t0 = c.currentTime + (at || 0);
        var o = c.createOscillator(), g = c.createGain();
        o.type = type || 'sine';
        o.frequency.setValueAtTime(freq, t0);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(gain || 0.2, t0 + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g).connect(out || c.destination);
        o.start(t0);
        o.stop(t0 + dur + 0.02);
    }

    // Filtered white noise, which is most of what a golf course sounds like:
    // sand, splashes and the thump of a ball into a cup.
    function noise(dur, freq, q, gain, type, out, at) {
        var c = ensure();
        if (!c) return;
        var n = Math.floor(c.sampleRate * dur);
        var buf = c.createBuffer(1, n, c.sampleRate);
        var d = buf.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        var src = c.createBufferSource();
        src.buffer = buf;
        var f = c.createBiquadFilter();
        f.type = type || 'bandpass';
        f.frequency.value = freq;
        f.Q.value = q || 1;
        var g = c.createGain();
        g.gain.value = gain || 0.2;
        src.connect(f).connect(g).connect(out || c.destination);
        src.start(c.currentTime + (at || 0));
    }

    /* ── the course's own sound ─────────────────────────────────────────

       Under the shots, very quietly, the place the course is in: birds over
       the parkland, surf and gulls by the sea, wind through the wood and
       over the snow, crickets and an owl after dark. Two kinds of thing: a
       *bed* that runs the whole time (wind, surf), looped noise breathing
       slowly in and out; and *calls* that come now and then (a phrase of
       birdsong, a gull, a hoot), each scheduling the next at random.

       It is all on one bus, so the mute button and a hidden tab can take it
       down in one go: nobody wants a beach playing from a background tab. */
    var amb = { want: [], on: false, bus: null, beds: [], timers: [] };
    var AMB_LEVEL = 0.55;

    function rnd(a, b) { return a + Math.random() * (b - a); }

    function later(fn, lo, hi) {
        amb.timers.push(setTimeout(function () { if (amb.on) fn(); }, rnd(lo, hi) * 1000));
    }

    // A pan per call, so a chorus comes from round the course, not a point.
    function placed(pan) {
        if (!ctx.createStereoPanner) return amb.bus;
        var p = ctx.createStereoPanner();
        p.pan.value = pan;
        p.connect(amb.bus);
        return p;
    }

    // Looped noise through a filter, its level breathing on a slow wave.
    function bed(freq, q, type, level, depth, rate) {
        var n = Math.floor(ctx.sampleRate * 4);
        var buf = ctx.createBuffer(1, n, ctx.sampleRate);
        var d = buf.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        var src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        var f = ctx.createBiquadFilter();
        f.type = type;
        f.frequency.value = freq;
        f.Q.value = q;
        var g = ctx.createGain();
        g.gain.value = level;
        var lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
        lfo.frequency.value = rate;
        lfoGain.gain.value = depth;
        lfo.connect(lfoGain).connect(g.gain);
        src.connect(f).connect(g).connect(amb.bus);
        src.start();
        lfo.start();
        amb.beds.push(src, lfo);
    }

    var SCAPES = {
        birds: function call() {
            var out = placed(rnd(-0.7, 0.7)), base = rnd(2600, 4200), notes = 2 + (Math.random() * 4 | 0);
            for (var i = 0; i < notes; i++) {
                var f = base * rnd(0.85, 1.2);
                tone(f, rnd(0.05, 0.11), 'sine', rnd(0.012, 0.022), f * rnd(0.75, 1.35), out, i * rnd(0.08, 0.15));
            }
            later(call, 2.5, 8);
        },
        sea: function () { bed(520, 0.6, 'lowpass', 0.05, 0.035, 0.11); },
        gulls: function call() {
            var out = placed(rnd(-0.8, 0.8));
            for (var i = 0; i < 2 + (Math.random() * 2 | 0); i++) {
                tone(rnd(1350, 1550), 0.2, 'triangle', 0.012, rnd(950, 1100), out, i * 0.24);
            }
            later(call, 9, 22);
        },
        wind: function () { bed(380, 0.5, 'bandpass', 0.035, 0.025, 0.07); },
        crickets: function call() {
            var out = placed(rnd(-0.6, 0.6)), f = rnd(4200, 4800);
            for (var i = 0; i < 3; i++) tone(f, 0.028, 'sine', 0.006, null, out, i * 0.055);
            later(call, 0.7, 1.6);
        },
        owl: function call() {
            var out = placed(rnd(-0.5, 0.5));
            tone(395, 0.32, 'sine', 0.03, 360, out, 0);
            tone(380, 0.5, 'sine', 0.028, 340, out, 0.55);
            later(call, 14, 30);
        },
        crows: function call() {
            var out = placed(rnd(-0.8, 0.8));
            for (var i = 0; i < 2; i++) tone(rnd(560, 640), 0.18, 'sawtooth', 0.006, 470, out, i * 0.3);
            later(call, 12, 26);
        },
        woodpecker: function call() {
            var out = placed(rnd(-0.8, 0.8));
            for (var i = 0; i < 9; i++) noise(0.014, 1900, 6, 0.05, 'bandpass', out, i * 0.048);
            later(call, 14, 30);
        }
    };

    function startAmbience() {
        stopAmbience();
        if (!ctx || muted) return;
        amb.on = true;
        amb.bus = ctx.createGain();
        amb.bus.gain.setValueAtTime(0.0001, ctx.currentTime);
        amb.bus.connect(ctx.destination);
        // Faded in, never switched on: a soundscape that starts with a bang
        // is a sound effect.
        amb.bus.gain.exponentialRampToValueAtTime(AMB_LEVEL, ctx.currentTime + 2.5);
        amb.want.forEach(function (k) {
            if (!SCAPES[k]) return;
            // Calls start at a random moment; beds start now.
            if (k === 'sea' || k === 'wind') SCAPES[k]();
            else later(SCAPES[k], 0.5, 3);
        });
    }

    function stopAmbience() {
        amb.on = false;
        amb.timers.forEach(clearTimeout);
        amb.timers = [];
        amb.beds.forEach(function (n) { try { n.stop(); } catch (e) { /* already stopped */ } });
        amb.beds = [];
        if (amb.bus) { try { amb.bus.disconnect(); } catch (e) { /* ignore */ } }
        amb.bus = null;
    }

    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('visibilitychange', function () {
            if (!ctx) return;
            if (document.hidden) { stopAmbience(); ctx.suspend(); }
            else if (!muted) { ctx.resume(); if (amb.want.length) startAmbience(); }
        });
    }

    var A = {
        putt: function (power) {
            var p = Math.max(0.15, Math.min(1, power));
            tone(150 + p * 190, 0.09, 'triangle', 0.16 + p * 0.1, 70);
            noise(0.05, 1400, 1.5, 0.05 + p * 0.06);
        },
        bounce: function (speed) {
            var p = Math.max(0.1, Math.min(1, speed / 700));
            tone(320 + p * 220, 0.06, 'square', 0.03 + p * 0.05, 180);
        },
        // A bumper is a bell, not a thud: the ball leaves it faster than it
        // arrived at any wall, and the ear should hear that before the eye
        // works out where the ball went.
        bumper: function (speed) {
            var p = Math.max(0.15, Math.min(1, speed / 700));
            tone(880, 0.12, 'square', 0.05 + p * 0.07, 1320);
            tone(1318.5, 0.09, 'sine', 0.03 + p * 0.05);
        },
        sand: function () { noise(0.22, 2600, 0.7, 0.09, 'highpass'); },
        splash: function () {
            noise(0.4, 900, 0.6, 0.2);
            tone(420, 0.35, 'sine', 0.1, 90);
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
        // Round the rim and out: two quick knocks against the cup's edge.
        lip: function () {
            noise(0.04, 1800, 4, 0.08);
            setTimeout(function () { tone(620, 0.05, 'triangle', 0.07, 380); }, 55);
            setTimeout(function () { noise(0.03, 1500, 4, 0.05); }, 110);
        },
        // Down one mouth, up the other: a low swoop that comes back up.
        tunnel: function () {
            tone(520, 0.16, 'sine', 0.09, 140);
            setTimeout(function () { tone(160, 0.18, 'sine', 0.08, 640); }, 120);
            noise(0.3, 500, 0.8, 0.05, 'lowpass');
        },
        // Out of strokes. Two notes down, kindly: it is a rule, not a scolding.
        pickup: function () {
            tone(392, 0.18, 'triangle', 0.1);
            setTimeout(function () { tone(311.1, 0.3, 'triangle', 0.09); }, 160);
        },
        // A new best on a hole, one bright note per star.
        stars: function (n) {
            for (var i = 0; i < Math.max(1, n); i++) {
                (function (k) {
                    setTimeout(function () { tone(1046.5 * Math.pow(1.26, k), 0.16, 'sine', 0.09); }, 260 + k * 110);
                })(i);
            }
        },
        // A course opens.
        unlock: function () {
            [392, 523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
                setTimeout(function () { tone(f, 0.28, 'square', 0.05); tone(f * 2, 0.2, 'sine', 0.04); }, 500 + i * 70);
            });
        },
        /* A buzz in the hand, on the phones that can. It goes quiet with the
           sound, because the mute button is the one switch a player has for
           "stop making things happen to me". */
        buzz: function (pattern) {
            if (muted || !navigator.vibrate) return;
            try { navigator.vibrate(pattern); } catch (e) { /* not allowed yet */ }
        },
        /* The soundscape for the course on screen, as a list of SCAPES.
           Asking for the one already playing changes nothing, so a new hole
           on the same course does not restart the birds. */
        ambience: function (list) {
            var want = (list || []).filter(function (k) { return !!SCAPES[k]; });
            if (want.join() === amb.want.join() && (amb.on || !ctx)) return;
            amb.want = want;
            if (ctx && !muted && !document.hidden) startAmbience();
            else stopAmbience();
        },
        soundscape: function () { return amb.want.slice(); },
        ambiencePlaying: function () { return amb.on; },
        toggleMute: function () {
            muted = !muted;
            try { localStorage.setItem('miniGolf.muted', muted ? '1' : '0'); } catch (e) { /* ignore */ }
            if (muted) stopAmbience();
            else if (ctx && amb.want.length) { ctx.resume(); startAmbience(); }
            return muted;
        },
        isMuted: function () { return muted; }
    };

    GOLF.audio = A;

})(window.GOLF);
