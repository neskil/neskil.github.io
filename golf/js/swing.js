/* The swing meter.

   Three states, driven entirely by when the player lets go and when they tap:

     idle     nothing happening; aim freely.
     power    the marker climbs 0 -> 1. Hold too long and it turns and comes
              back down, so overholding costs you rather than capping out.
              Releasing locks the power.
     accuracy the marker races back down toward a sweet spot. Tapping stops it;
              how far from the sweet spot you stopped it is the strike quality,
              signed, and becomes sidespin in physics3d.launch.

   Kept as a pure state machine with an explicit clock — tick(dt) rather than
   reading the wall clock — so tests can drive it frame by frame and assert the
   timing rather than trying to press buttons at the right moment. */
(function (GOLF) {
    'use strict';

    // Seconds for a full sweep of each phase. The accuracy sweep is fast: it
    // should feel like a reflex, not a decision.
    var POWER_SECONDS = 1.15;
    var ACCURACY_SECONDS = 0.62;

    // How wide the perfect zone is, as a fraction of the bar.
    var SWEET_SPOT = 0.055;

    function create() {
        return {
            phase: 'idle',      // idle | power | accuracy | done
            marker: 0,          // 0..1, what the bar draws
            dir: 1,             // which way the marker is travelling
            power: 0,           // locked at the end of the power phase
            accuracy: 0,        // signed miss, -1..1, locked at the strike
            perfect: false
        };
    }

    function reset(s) {
        s.phase = 'idle';
        s.marker = 0;
        s.dir = 1;
        s.power = 0;
        s.accuracy = 0;
        s.perfect = false;
        return s;
    }

    // Press and hold: start the power sweep. Ignored unless idle, so a stray
    // click during the accuracy phase cannot restart the swing.
    function begin(s) {
        if (s.phase !== 'idle') return false;
        s.phase = 'power';
        s.marker = 0;
        s.dir = 1;
        s.perfect = false;
        return true;
    }

    /* Let go: lock the power and hand over to the accuracy sweep, which starts
       from wherever the power marker was. A big swing therefore gives you a
       longer run back to the sweet spot than a gentle one — more time to react,
       but also more time to get it wrong. */
    function release(s) {
        if (s.phase !== 'power') return false;
        s.power = s.marker;
        s.phase = 'accuracy';
        s.dir = -1;
        return true;
    }

    /* Tap: strike. The miss is signed — stopping the marker before the sweet
       spot is a late, open-faced strike that pushes the ball right; after it,
       an early closed face that pulls it left. */
    function strike(s) {
        if (s.phase !== 'accuracy') return false;
        var miss = (s.marker - SWEET_SPOT) / (1 - SWEET_SPOT);
        s.accuracy = Math.max(-1, Math.min(1, miss));
        s.perfect = Math.abs(s.marker - SWEET_SPOT) <= SWEET_SPOT;
        if (s.perfect) s.accuracy = 0;
        s.phase = 'done';
        return true;
    }

    /* Advance the clock. Returns 'timeout' if the accuracy marker ran off the
       bottom without a tap, which counts as a fully mistimed strike — the
       player still hit it, just badly. Not doing this would let someone hold
       the game hostage by never tapping. */
    function tick(s, dt) {
        if (s.phase === 'power') {
            s.marker += s.dir * dt / POWER_SECONDS;
            if (s.marker >= 1) { s.marker = 1; s.dir = -1; }
            else if (s.marker <= 0 && s.dir < 0) { s.marker = 0; s.dir = 1; }
            return null;
        }
        if (s.phase === 'accuracy') {
            s.marker -= dt / ACCURACY_SECONDS;
            if (s.marker <= 0) {
                s.marker = 0;
                s.accuracy = -1;
                s.perfect = false;
                s.phase = 'done';
                return 'timeout';
            }
            return null;
        }
        return null;
    }

    function quality(s) {
        if (s.perfect) return { label: 'Perfect', kind: 'perfect' };
        var a = Math.abs(s.accuracy);
        if (a < 0.18) return { label: s.accuracy > 0 ? 'Slight push' : 'Slight pull', kind: 'good' };
        if (a < 0.45) return { label: s.accuracy > 0 ? 'Fade' : 'Draw', kind: 'ok' };
        return { label: s.accuracy > 0 ? 'Slice' : 'Hook', kind: 'bad' };
    }

    GOLF.swing = {
        POWER_SECONDS: POWER_SECONDS,
        ACCURACY_SECONDS: ACCURACY_SECONDS,
        SWEET_SPOT: SWEET_SPOT,
        create: create,
        reset: reset,
        begin: begin,
        release: release,
        strike: strike,
        tick: tick,
        quality: quality
    };

})(window.GOLF);
