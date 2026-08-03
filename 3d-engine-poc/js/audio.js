(function(window) {
    'use strict';

    window.Cargo3D = window.Cargo3D || {};

    let audioCtx = null;
    let masterGain = null;
    let isMuted = false;

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
                masterGain = audioCtx.createGain();
                masterGain.gain.value = 0.3; // Default 30% volume
                masterGain.connect(audioCtx.destination);
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    /**
     * Plays procedural metallic clunk sound when a container locks into place.
     */
    function playLockSound() {
        if (isMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.18);

        gain.gain.setValueAtTime(0.8, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start();
        osc.stop(ctx.currentTime + 0.22);
    }

    /**
     * Plays hydraulic pressure hiss when crane boom moves.
     */
    function playHydraulicSound() {
        if (isMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 3.0;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        noise.start();
    }

    /**
     * Plays diesel engine hum burst for vehicle driving.
     */
    function playEngineSound() {
        if (isMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(85, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start();
        osc.stop(ctx.currentTime + 0.16);
    }

    function toggleMute() {
        isMuted = !isMuted;
        if (masterGain) {
            masterGain.gain.value = isMuted ? 0 : 0.3;
        }
        return isMuted;
    }

    window.Cargo3D.Audio = {
        playLockSound: playLockSound,
        playHydraulicSound: playHydraulicSound,
        playEngineSound: playEngineSound,
        toggleMute: toggleMute,
        isMuted: function() { return isMuted; }
    };
})(window);
