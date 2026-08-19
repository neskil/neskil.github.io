/* Synthesised sound effects — no audio files to ship, and nothing is created
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

    var A = {
        putt: function (power) {
            var p = Math.max(0.15, Math.min(1, power));
            tone(150 + p * 190, 0.09, 'triangle', 0.16 + p * 0.1, 70);
            noise(0.05, 1400, 1.5, 0.05 + p * 0.06);
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
            return muted;
        },
        isMuted: function () { return muted; }
    };

    G3.audio = A;

})(window.G3);
