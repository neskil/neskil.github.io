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
        src.connect(f).connect(g).connect(c.destination);
        src.start();
    }

    var A = {
        putt: function (power) {
            var p = Math.max(0.15, Math.min(1, power));
            tone(150 + p * 190, 0.09, 'triangle', 0.16 + p * 0.1, 70);
            noise(0.05, 1400, 1.5, 0.05 + p * 0.06);
            // A real swing has air in it: the hard ones get a whoosh.
            if (p > 0.55) noise(0.16 + p * 0.08, 3200, 0.7, (p - 0.55) * 0.22, 'highpass');
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
            // ...and the spray coming back down a moment later.
            [140, 210, 300].forEach(function (ms, i) {
                setTimeout(function () { tone(1500 + i * 260, 0.05, 'sine', 0.04, 2400 + i * 200); }, ms);
            });
        },
        // Off the top of the water: a flat slap and a plip that climbs with
        // each skip in the chain, so a second one sounds like a better one.
        skip: function (n) {
            var up = Math.pow(1.19, Math.max(0, n - 1));
            noise(0.05, 2200 * up, 2.5, 0.12);
            tone(620 * up, 0.09, 'sine', 0.09, 1250 * up);
        },
        // Back down on the grass after a skip.
        land: function () {
            noise(0.06, 420, 1, 0.09, 'lowpass');
            tone(190, 0.07, 'sine', 0.06, 110);
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
        toggleMute: function () {
            muted = !muted;
            try { localStorage.setItem('miniGolf.muted', muted ? '1' : '0'); } catch (e) { /* ignore */ }
            return muted;
        },
        isMuted: function () { return muted; }
    };

    GOLF.audio = A;

})(window.GOLF);
