// CargoLander - Web Audio API Synthesizer
class CargoAudioController {
    constructor() {
        this.ctx = null;
        this.thrusterNode = null;
        this.thrusterFilter = null;
        this.thrusterGain = null;
        this.warningInterval = null;
        this.warningOsc = null;
        this.isWarningPlaying = false;
        this.muted = true;

        // Settings & Music
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.musicOsc1 = null;
        this.musicOsc2 = null;
        this.musicFilter = null;
        this.musicLfo = null;
        this.musicLfoGain = null;
        this.musicGain = null;
    }

    init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return;
        }

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.setupThruster();
            this.setupMusic();
        } catch (e) {
            console.warn("Web Audio API is not supported in this browser", e);
        }
    }

    setupThruster() {
        if (!this.ctx) return;

        // Create white noise buffer
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        // Noise source
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        // Bandpass filter to make it sound like rumbling thrust
        this.thrusterFilter = this.ctx.createBiquadFilter();
        this.thrusterFilter.type = 'bandpass';
        this.thrusterFilter.frequency.value = 100;
        this.thrusterFilter.Q.value = 3.0;

        // Gain node for volume
        this.thrusterGain = this.ctx.createGain();
        this.thrusterGain.gain.value = 0;

        // Connect
        noise.connect(this.thrusterFilter);
        this.thrusterFilter.connect(this.thrusterGain);
        this.thrusterGain.connect(this.ctx.destination);

        // Start noise loop
        noise.start(0);
        this.thrusterNode = noise;
    }

    setThruster(intensity) {
        if (this.muted) return;
        this.init(); // Ensure initialized on first interaction
        if (!this.ctx) return;

        if (this.thrusterGain && this.thrusterFilter) {
            const targetGain = intensity * 0.15 * this.sfxVolume;
            const targetFreq = 80 + intensity * 250; // Pitch rises with thrust
            
            const now = this.ctx.currentTime;
            this.thrusterGain.gain.setTargetAtTime(targetGain, now, 0.05);
            this.thrusterFilter.frequency.setTargetAtTime(targetFreq, now, 0.05);
        }
    }

    playLoad() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        
        // High-pitched synth chime (rising fifth)
        this.playTone(523.25, 0.08, 0.15, now); // C5
        this.playTone(783.99, 0.08, 0.15, now + 0.08); // G5
    }

    playUnload() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        
        // Downward chime
        this.playTone(783.99, 0.08, 0.15, now); // G5
        this.playTone(523.25, 0.08, 0.15, now + 0.08); // C5
    }

    playCollision(impactSpeed) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const volume = Math.min(impactSpeed / 15, 1.0) * 0.4 * this.sfxVolume;
        if (volume < 0.02) return;

        // Synthesize a crash: low noise burst combined with a low frequency sine wave
        try {
            // Low oscillator thud
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
            
            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);

            // High friction crash noise
            const noiseOsc = this.ctx.createOscillator();
            const noiseGain = this.ctx.createGain();
            noiseOsc.type = 'sawtooth';
            noiseOsc.frequency.setValueAtTime(120, now);
            noiseOsc.frequency.linearRampToValueAtTime(40, now + 0.15);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, now);

            noiseGain.gain.setValueAtTime(volume * 0.5, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

            noiseOsc.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noiseOsc.start(now);
            noiseOsc.stop(now + 0.2);
        } catch (e) {
            console.error("Collision audio failed", e);
        }
    }

    playCrash() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Big explosion sound
        try {
            // Noise burst
            const bufferSize = this.ctx.sampleRate * 1.5;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(50, now + 1.2);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.6 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
            noise.stop(now + 1.5);

            // Rumble osc
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(80, now);
            osc.frequency.linearRampToValueAtTime(20, now + 1.0);

            oscGain.gain.setValueAtTime(0.5 * this.sfxVolume, now);
            oscGain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

            osc.connect(oscGain);
            oscGain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 1.0);
        } catch (e) {
            console.error("Explosion audio failed", e);
        }
    }

    setWarning(active) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        if (active && !this.isWarningPlaying) {
            this.isWarningPlaying = true;
            this.startWarningBeeps();
        } else if (!active && this.isWarningPlaying) {
            this.isWarningPlaying = false;
            this.stopWarningBeeps();
        }
    }

    startWarningBeeps() {
        if (this.warningInterval) return;

        const playBeep = () => {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            this.playTone(880, 0.1, 0.1, now); // Short high A beep
        };

        playBeep();
        this.warningInterval = setInterval(playBeep, 800);
    }

    stopWarningBeeps() {
        if (this.warningInterval) {
            clearInterval(this.warningInterval);
            this.warningInterval = null;
        }
    }

    playRadarPing() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        this.playTone(660, 0.06, 0.07, now);
        this.playTone(440, 0.08, 0.05, now + 0.07);
    }

    playSuccess() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Happy little victory arpeggio: C4, E4, G4, C5
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
            this.playTone(freq, 0.12, 0.2, now + idx * 0.08);
        });
    }

    playTone(frequency, duration, volume, time) {
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, time);

            gain.gain.setValueAtTime(volume * this.sfxVolume, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(time);
            osc.stop(time + duration + 0.1);
        } catch (e) {
            console.error("Tone playback failed", e);
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.setThruster(0);
            this.stopWarningBeeps();
            this.isWarningPlaying = false;
            if (this.musicGain && this.ctx) {
                this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
            }
        } else {
            this.init();
            if (this.musicGain && this.ctx) {
                this.musicGain.gain.setTargetAtTime(this.musicVolume * 0.1, this.ctx.currentTime, 0.1);
            }
        }
        return this.muted;
    }

    setMuted(muted) {
        this.muted = muted;
        if (muted) {
            this.setThruster(0);
            this.stopWarningBeeps();
            this.isWarningPlaying = false;
            if (this.musicGain && this.ctx) {
                this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
            }
        } else {
            this.init();
            if (this.musicGain && this.ctx) {
                this.musicGain.gain.setTargetAtTime(this.musicVolume * 0.1, this.ctx.currentTime, 0.1);
            }
        }
        return this.muted;
    }

    setMusicVolume(volume) {
        this.musicVolume = volume;
        if (this.ctx && this.musicGain && !this.muted) {
            this.musicGain.gain.setTargetAtTime(volume * 0.1, this.ctx.currentTime, 0.1);
        }
    }

    setSFXVolume(volume) {
        this.sfxVolume = volume;
    }

    setupMusic() {
        if (!this.ctx) return;

        try {
            // Create main gain node for music
            this.musicGain = this.ctx.createGain();
            // Start at 0 if muted, otherwise scale by musicVolume
            const initialVolume = this.muted ? 0 : this.musicVolume * 0.1;
            this.musicGain.gain.setValueAtTime(initialVolume, this.ctx.currentTime);

            // Lowpass filter for warm space drone
            this.musicFilter = this.ctx.createBiquadFilter();
            this.musicFilter.type = 'lowpass';
            this.musicFilter.frequency.setValueAtTime(250, this.ctx.currentTime);
            this.musicFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

            // First oscillator (drone fundamental, e.g., C2 = 65.41 Hz)
            this.musicOsc1 = this.ctx.createOscillator();
            this.musicOsc1.type = 'sawtooth';
            this.musicOsc1.frequency.setValueAtTime(65.41, this.ctx.currentTime); // C2

            // Second oscillator (drone fifth, detuned, e.g., G2 = 98.00 Hz)
            this.musicOsc2 = this.ctx.createOscillator();
            this.musicOsc2.type = 'triangle';
            this.musicOsc2.frequency.setValueAtTime(98.00, this.ctx.currentTime); // G2
            this.musicOsc2.detune.setValueAtTime(10, this.ctx.currentTime); // 10 cents detuned

            // LFO to slowly sweep the filter frequency (pulsing space feel)
            this.musicLfo = this.ctx.createOscillator();
            this.musicLfo.type = 'sine';
            this.musicLfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // very slow: 0.08 Hz

            this.musicLfoGain = this.ctx.createGain();
            this.musicLfoGain.gain.setValueAtTime(80, this.ctx.currentTime); // modulate filter frequency by +/- 80 Hz

            // Connections:
            this.musicLfo.connect(this.musicLfoGain);
            this.musicLfoGain.connect(this.musicFilter.frequency);

            this.musicOsc1.connect(this.musicFilter);
            this.musicOsc2.connect(this.musicFilter);
            this.musicFilter.connect(this.musicGain);
            this.musicGain.connect(this.ctx.destination);

            // Start everything
            this.musicOsc1.start(0);
            this.musicOsc2.start(0);
            this.musicLfo.start(0);
        } catch (e) {
            console.error("Failed to setup ambient music drone", e);
        }
    }
}

// Global audio singleton
const CargoAudio = new CargoAudioController();
