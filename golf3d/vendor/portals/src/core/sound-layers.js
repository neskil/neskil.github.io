// The sound layers of audio.js: what a world contains, made from noise, tones and timers (no audio files).
// Three things live here: the KIT (buffers made once and shared), a GROUP (every node and timer of one world, so that all of it can be
// stopped and disconnected when the world leaves), and the LAYERS and BEDS themselves. Each layer is quiet on purpose: it sits under the pad.
// Every buffer is made from a seeded generator, not Math.random: the level must not change from one page load to the next.
export const mulberry = (s) => () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const TAU = 6.283185307;

export function makeKit(ac, bus, verbIn) {
  const sr = ac.sampleRate, cache = {};
  const mono = (secs, rate = sr) => ac.createBuffer(1, Math.round(secs * rate), rate);
  // many short events written into a loop (they wrap round its end, so the loop has no seam)
  const scatter = (b, seed, count, one) => { const d = b.getChannelData(0), n = d.length, r = mulberry(seed); for (let k = 0; k < count; k++) one(d, n, Math.floor(r() * n), r); return b; };
  const make = {
    white() { const b = mono(3), d = b.getChannelData(0), r = mulberry(11); for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1; return b; },
    // pink noise (equal power per octave: what wind, water and rooms are made of); its end is faded into its beginning so the loop does not tick
    pink() {
      const X = 4096, b = mono(5), d = b.getChannelData(0), n = d.length, r = mulberry(12), raw = new Float32Array(n + X); let b0 = 0, b1 = 0, b2 = 0, s = 0;
      for (let i = 0; i < n + X; i++) { const w = r() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; raw[i] = b0 + b1 + b2 + w * 0.1848; }
      for (let i = 0; i < n; i++) { d[i] = i < X ? raw[i] * Math.sqrt(i / X) + raw[n + i] * Math.sqrt(1 - i / X) : raw[i]; s += d[i] * d[i]; }
      const g = 0.25 / Math.sqrt(s / n); for (let i = 0; i < n; i++) d[i] *= g; return b;
    },
    // a slow wandering value between -1 and 1 (nine sines of 0.4 to 6.6 Hz, whole turns in 16 s so it loops): played at speed 1 it is a
    // burble, at speed 0.03 a gust. It moves filters and gains; it is never heard itself.
    ctl() {
      const b = mono(16, 8000), d = b.getChannelData(0), n = d.length, r = mulberry(13); let pk = 0;
      for (let k = 0; k < 9; k++) { const cyc = 6 + Math.floor(r() * 100), ph = r() * TAU, a = 1 / Math.sqrt(1 + cyc / 20); for (let i = 0; i < n; i++) d[i] += a * Math.sin(TAU * cyc * i / n + ph); }
      for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(d[i])); for (let i = 0; i < n; i++) d[i] /= pk; return b;
    },
    // rain's grain: 275 single drops a second, each a few thousandths of a second of noise
    drops() { return scatter(mono(4), 14, 1100, (d, n, at, r) => { const a = 0.05 + 0.9 * Math.pow(r(), 2.5), len = Math.floor(sr * (0.0015 + 0.005 * r())); for (let i = 0; i < len; i++) d[(at + i) % n] += a * (r() * 2 - 1) * Math.exp(-4 * i / len); }); },
    // a fire's crackle: sharp ticks of uneven size, one in ten a pop with a note in it
    crackle() { return scatter(mono(7), 15, 120, (d, n, at, r) => { const big = r() < 0.1, a = big ? 0.35 + 0.25 * r() : 0.08 + 0.3 * r() * r(), len = Math.floor(sr * (big ? 0.012 : 0.001 + 0.004 * r())), f = 500 + 1500 * r(); for (let i = 0; i < len; i++) d[(at + i) % n] += a * Math.exp(-5 * i / len) * (big ? 0.7 * Math.sin(TAU * f * i / sr) + 0.5 * (r() * 2 - 1) : r() * 2 - 1); }); },
    // wheels over rail joints: one bar, two axles then two more (da-dum ... da-dum)
    rail() {
      const b = mono(1.16), d = b.getChannelData(0), n = d.length, r = mulberry(16);
      for (const [at, a] of [[0.02, 1], [0.135, 0.8], [0.5, 0.7], [0.615, 0.55]]) { const i0 = Math.floor(at * sr); for (let i = 0; i < sr * 0.12; i++) { const t = i / sr; d[(i0 + i) % n] += a * (0.55 * Math.sin(TAU * 210 * t) * Math.exp(-t / 0.022) + 0.4 * Math.sin(TAU * 470 * t) * Math.exp(-t / 0.014) + 0.3 * (r() * 2 - 1) * Math.exp(-t / 0.006)); } }
      return b;
    },
    // a far herd: 32 soft thuds a second, each a short low note with a tick on its front
    hooves() { return scatter(mono(6), 17, 190, (d, n, at, r) => { const a = 0.15 + 0.5 * r() * r(), f = 160 + 200 * r(), tau = 0.01 + 0.012 * r(); for (let i = 0; i < sr * 0.07; i++) { const t = i / sr; d[(at + i) % n] += a * (Math.sin(TAU * f * t) * Math.exp(-t / tau) + 0.8 * (r() * 2 - 1) * Math.exp(-t / 0.004)); } }); },
  };
  return { ac, bus, verbIn, buf: (name) => cache[name] || (cache[name] = make[name]()) };
}

// One world's sound: every node and timer is made through this, and dispose() ends all of it.
export function makeGroup(K) {
  const ac = K.ac, nodes = [], srcs = [], timers = new Set(); let shots = [], dead = false;
  const reg = (n) => (nodes.push(n), n);
  const fade = reg(ac.createGain()), fadeW = reg(ac.createGain());   // the same fade twice: the direct sound and what goes to the reverb
  fade.gain.value = 0; fadeW.gain.value = 0; fade.connect(K.bus); fadeW.connect(K.verbIn);
  const sweep = () => { const now = ac.currentTime; shots = shots.filter((s) => { if (s.end > now) return true; for (const n of s.list) n.disconnect(); return false; }); };
  const G = {
    ac, K, fade, fadeW,
    gain(v) { const g = reg(ac.createGain()); g.gain.value = v; return g; },
    filter(type, f, q, db) { const b = reg(ac.createBiquadFilter()); b.type = type; b.frequency.value = f; if (q !== undefined) b.Q.value = q; if (db !== undefined) b.gain.value = db; return b; },
    osc(type, f) { const o = reg(ac.createOscillator()); if (typeof type === 'string') o.type = type; else o.setPeriodicWave(type); o.frequency.value = f; o.start(); srcs.push(o); return o; },
    noise(name, rate = 1) { const s = reg(ac.createBufferSource()); s.buffer = K.buf(name); s.loop = true; s.playbackRate.value = rate; s.start(0, Math.random() * s.buffer.duration); srcs.push(s); return s; },
    pan(v) { if (!ac.createStereoPanner) return G.gain(1); const p = reg(ac.createStereoPanner()); p.pan.value = v; return p; },
    chain(...a) { for (let i = 0; i < a.length - 1; i++) a[i].connect(a[i + 1]); return a[a.length - 1]; },
    ctl(rate) { return G.noise('ctl', rate); },                                                  // the wandering value, at a speed
    mod(src, depth, param) { const g = G.gain(depth); src.connect(g); g.connect(param); return src; },   // lets it move a filter or a gain
    out(node, wet = 0) { node.connect(fade); if (wet) G.chain(node, G.gain(wet), fadeW); return node; },
    // fn(t) again and again, lo to hi seconds apart, until the world leaves
    every(lo, hi, fn, first = lo + Math.random() * (hi - lo)) {
      const go = (secs) => { const id = setTimeout(() => { timers.delete(id); if (dead) return; sweep(); fn(ac.currentTime + 0.06); go(lo + Math.random() * (hi - lo)); }, secs * 1000); timers.add(id); };
      go(first);
    },
    // nodes of one short event (a chirp, a drip): they end by themselves at tEnd and are disconnected at the next event after that
    shot(tEnd, ...list) { shots.push({ end: tEnd + 0.05, list }); return list[0]; },
    tone(type, f, t0, t1) { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.start(t0); o.stop(t1); return o; },
    env(v = 0) { const g = ac.createGain(); g.gain.value = v; return g; },
    spot(v) { if (!ac.createStereoPanner) return ac.createGain(); const p = ac.createStereoPanner(); p.pan.value = v; return p; },
    dispose() {
      if (dead) return; dead = true; for (const id of timers) clearTimeout(id); timers.clear();
      for (const s of srcs) { try { s.stop(); } catch (e) {} }
      for (const s of shots) for (const n of s.list) { try { if (n.stop) n.stop(); } catch (e) {} n.disconnect(); }
      for (const n of nodes) n.disconnect(); shots = []; nodes.length = 0; srcs.length = 0;
    },
  };
  return G;
}

// ---------- beds: the air of a kind of place, always on, very quiet ----------
// (G, level, c): c is the world's tuning (c.hz(semitones above the root), c.sc the scale).
export const BEDS = {
  wind(G, g) { const e = G.gain(0.5), o = G.gain(g); G.chain(G.noise('pink'), G.filter('bandpass', 620, 0.6), e, o); G.mod(G.ctl(0.017), 0.22, e.gain); G.out(o, 0.1); },
  water(G, g) { const e = G.gain(0.5), o = G.gain(g), lp = G.filter('lowpass', 1500, 0.5), c = G.ctl(0.022); G.chain(G.noise('pink'), G.filter('highpass', 180, 0.5), lp, e, o); G.mod(c, 0.28, e.gain); G.mod(c, 500, lp.frequency); G.out(o, 0.1); },
  // room tone: the old one sat under 160 Hz, where a laptop plays nothing; this one is the soft mid hush of a closed space
  room(G, g) { const o = G.gain(g * 0.5); G.chain(G.noise('pink', 0.8), G.filter('bandpass', 330, 0.5), o); G.out(o, 0.25); },
  // space: no air to move. Three still tones on the world's own root, almost without movement.
  still(G, g, c) { const o = G.gain(g * 0.5); for (const [semi, a, d] of [[12, 0.5, 0], [19, 0.28, 0.07], [24, 0.2, 0.05]]) G.chain(G.osc('sine', c.hz(semi) + d), G.gain(a), o); G.out(o, 0.2); },
};

// ---------- layers that run all the time ----------
export const LAYERS = {
  // a steady hiss above 1.4 kHz, and the grain that makes it rain and not a hiss: single drops, the same loop twice at two speeds so the pattern never lines up
  rain(G, g) {
    const o = G.gain(g);
    G.chain(G.noise('pink'), G.filter('highpass', 1400, 0.5), G.filter('lowpass', 7000, 0.5), G.gain(1.1), o);
    G.chain(G.noise('drops'), G.filter('highpass', 2200, 0.7), G.pan(-0.5), G.gain(1.2), o);
    G.chain(G.noise('drops', 0.81), G.filter('bandpass', 950, 0.8), G.pan(0.5), G.gain(0.8), o);
    G.out(o, 0.2);
  },
  // one wave every 6.5 to 11 s: a swell, the break (brighter, with foam), a long wash back
  surf(G, g) {
    const lp = G.filter('lowpass', 480, 0.4), e = G.gain(0.14), foam = G.gain(0), o = G.gain(g);
    G.chain(G.noise('pink'), G.filter('highpass', 150, 0.5), lp, e, o); G.chain(G.noise('white'), G.filter('highpass', 3200, 0.5), foam, o);
    G.every(6.5, 11, (t) => {
      const k = 0.6 + 0.4 * Math.random();
      e.gain.setTargetAtTime(k, t, 0.9); e.gain.setTargetAtTime(0.14, t + 2.2, 2.4);
      lp.frequency.setTargetAtTime(800 + 2600 * k, t, 0.8); lp.frequency.setTargetAtTime(480, t + 2, 2.6);
      foam.gain.setTargetAtTime(0.1 * k, t + 1.2, 0.5); foam.gain.setTargetAtTime(0, t + 2.4, 1.6);
    }, 0.3);
    G.out(o, 0.12);
  },
  // falling water: wide, bright and steady, with a quick unsteady shimmer and some weight under it
  falls(G, g) {
    const o = G.gain(g), sh = G.gain(0.3);
    G.chain(G.noise('white'), G.filter('bandpass', 1200, 0.35), G.filter('highpass', 260, 0.5), sh, o); G.mod(G.ctl(1.4), 0.08, sh.gain);
    G.chain(G.noise('pink', 0.7), G.filter('lowpass', 420, 0.5), G.gain(0.9), o);
    G.out(o, 0.2);
  },
  // a brook: four narrow bands of noise whose pitch and loudness jump about several times a second (the burble)
  stream(G, g) {
    const o = G.gain(g), n = G.noise('white');
    for (const [f, q, a, r] of [[820, 9, 1, 0.9], [1450, 11, 0.8, 1.3], [2500, 12, 0.6, 1.7], [3900, 9, 0.35, 2.3]]) {
      const bp = G.filter('bandpass', f, q), v = G.gain(a); G.chain(n, bp, v, o); G.mod(G.ctl(r), f * 0.3, bp.frequency); G.mod(G.ctl(r * 1.31), a * 0.7, v.gain);
    }
    G.chain(n, G.filter('highpass', 5000, 0.5), G.gain(0.05), o);
    G.out(o, 0.15);
  },
  // gusts: loudness and pitch rise together, slowly, with a quicker buffeting on top
  wind(G, g) {
    const bp = G.filter('bandpass', 520, 1.1), e = G.gain(0.75), o = G.gain(g), c = G.ctl(0.02);
    G.chain(G.noise('pink'), bp, e, o); G.mod(c, 0.6, e.gain); G.mod(c, 260, bp.frequency); G.mod(G.ctl(0.11), 0.14, e.gain);
    G.out(o, 0.1);
  },
  // the high thin wind of ridges, snow and wires: a narrow whistle that slides
  thinwind(G, g) {
    const o = G.gain(g), n = G.noise('white');
    for (const [f, q, a, r] of [[2500, 7, 1, 0.035], [4000, 10, 0.5, 0.05]]) { const bp = G.filter('bandpass', f, q), e = G.gain(a * 0.55), c = G.ctl(r); G.chain(n, bp, e, o); G.mod(c, a * 0.45, e.gain); G.mod(c, f * 0.25, bp.frequency); G.mod(G.ctl(r * 6), f * 0.08, bp.frequency); }
    G.out(o, 0.2);
  },
  // crackle (two speeds of one loop) over the soft flutter of the flames
  fire(G, g) {
    const o = G.gain(g), roar = G.gain(0.7);
    G.chain(G.noise('crackle'), G.filter('highpass', 900, 0.5), G.pan(-0.3), G.gain(1.6), o); G.chain(G.noise('crackle', 0.77), G.filter('bandpass', 1800, 0.6), G.pan(0.3), G.gain(1.6), o);
    G.chain(G.noise('pink', 0.6), G.filter('bandpass', 450, 0.5), roar, o); G.mod(G.ctl(0.9), 0.2, roar.gain);
    G.out(o, 0.1);
  },
  // night insects: two crickets (a high tone switched about thirty times a second, in bursts with rests between) and the steady field behind them
  insects(G, g) {
    const o = G.gain(g);
    for (const [f, pulse, chirp, pan, a] of [[4300, 31, 1.9, -0.55, 1], [4750, 27, 2.3, 0.5, 0.8]]) {
      const am = G.gain(0.5), g1 = G.gain(0.5), g2 = G.gain(0.5), ch = G.osc('sine', chirp);
      G.mod(G.osc('sine', pulse), 0.5, am.gain); G.mod(ch, 0.5, g1.gain); G.mod(ch, 0.5, g2.gain);   // the burst is the slow wave squared: shorter than the rest between
      G.chain(G.osc('sine', f), am, g1, g2, G.pan(pan), G.gain(a * 0.5), o);
    }
    const dr = G.gain(0.06); G.mod(G.osc('sine', 57), 0.05, dr.gain); G.chain(G.osc('sine', 5600), dr, o);
    G.out(o, 0.15);
  },
  // a crowd far off: three bands of noise where the vowels of speech lie, each rising and falling at the pace of syllables, and two faint voices among them
  crowd(G, g) {
    const o = G.gain(g), n = G.noise('pink');
    for (const [f, q, a, r] of [[480, 1.6, 1, 0.55], [900, 2, 0.8, 0.7], [1650, 2.4, 0.45, 0.9]]) { const bp = G.filter('bandpass', f, q), v = G.gain(a * 1.2); G.chain(n, bp, v, o); G.mod(G.ctl(r), a * 0.7, v.gain); G.mod(G.ctl(r * 0.6), f * 0.22, bp.frequency); }
    for (const [f, vf, pan] of [[128, 650, -0.5], [187, 920, 0.5]]) { const s = G.osc('sawtooth', f), bp = G.filter('bandpass', vf, 2.5), v = G.gain(0.1); G.chain(s, bp, v, G.pan(pan), o); G.mod(G.ctl(0.3), f * 0.14, s.frequency); G.mod(G.ctl(0.8), 0.1, v.gain); G.mod(G.ctl(0.45), vf * 0.4, bp.frequency); }
    G.out(o, 0.35);
  },
  // the joints under the wheels and the rolling between them
  rail(G, g) {
    const o = G.gain(g), roll = G.gain(0.5);
    G.chain(G.noise('rail'), G.filter('lowpass', 2600, 0.5), G.filter('highpass', 170, 0.5), G.gain(1.2), o);
    G.chain(G.noise('pink', 0.8), G.filter('bandpass', 340, 0.8), roll, o); G.mod(G.ctl(0.3), 0.15, roll.gain);
    G.out(o, 0.12);
  },
  // under water: the muffled press of it, slowly shifting, and now and then a few bubbles going up
  underwater(G, g) {
    const lp = G.filter('lowpass', 430, 2.5), b = G.gain(0.9), o = G.gain(g);
    G.chain(G.noise('pink', 0.6), lp, b, o); G.mod(G.ctl(0.03), 140, lp.frequency); G.mod(G.ctl(0.05), 0.3, b.gain);
    G.every(1.5, 6, (t) => {
      const n = 2 + Math.floor(Math.random() * 5), s = G.tone('sine', 400, t, t + n * 0.2 + 0.2), e = G.env(), p = G.spot(Math.random() * 1.4 - 0.7); let a = t;
      for (let i = 0; i < n; i++) { const f = 330 + 520 * Math.random(), v = 0.25 + 0.4 * Math.random(); s.frequency.setValueAtTime(f, a); s.frequency.exponentialRampToValueAtTime(f * 1.9, a + 0.09); e.gain.setValueAtTime(0, a); e.gain.linearRampToValueAtTime(v, a + 0.008); e.gain.linearRampToValueAtTime(0, a + 0.1); a += 0.11 + 0.09 * Math.random(); }
      G.chain(s, e, p, o); G.shot(a + 0.2, s, e, p);
    }, 1);
    G.out(o, 0.3);
  },
  // a deep machine: the hum sits an octave under the world's root, so it is in tune with the pad; what a small speaker carries is its harmonics and a faint whirr
  hum(G, g, c) {
    const o = G.gain(g), lp = G.filter('lowpass', 900, 0.7), f = c.hz(-12);
    for (const [m, a] of [[1, 0.5], [1.006, 0.5], [2.003, 0.25]]) G.chain(G.osc('sawtooth', f * m), G.gain(a), lp);
    G.chain(lp, G.filter('peaking', f * 5, 2, 8), o); G.chain(G.noise('white'), G.filter('bandpass', 2400, 3), G.gain(0.1), o);
    G.out(o, 0.1);
  },
  // far hooves: the thud loop twice at two speeds, coming nearer and going
  herd(G, g) {
    const o = G.gain(g), e = G.gain(0.7);
    G.chain(G.noise('hooves'), G.filter('lowpass', 1800, 0.5), e, o); G.chain(G.noise('hooves', 0.83), G.filter('lowpass', 1300, 0.5), e); G.mod(G.ctl(0.025), 0.4, e.gain);
    G.out(o, 0.2);
  },
};

// ---------- layers made of single events at random times ----------
Object.assign(LAYERS, {
  // birds by day: one phrase every few seconds, from one of three singers (a trill, a two-note call, a falling whistle), each time somewhere else
  birds(G, g) {
    const o = G.gain(g); G.out(o, 0.5);
    G.every(2.5, 9, (t) => {
      const kind = Math.floor(Math.random() * 3), f0 = 2300 + 2300 * Math.random(), v = 0.3 + 0.7 * Math.random();
      const n = kind === 0 ? 3 + Math.floor(Math.random() * 6) : 2 + Math.floor(Math.random() * 3), len = [0.05, 0.13, 0.17][kind], step = [0.085, 0.21, 0.3][kind];
      const s = G.tone('sine', f0, t, t + n * step + 0.1), e = G.env(), p = G.spot(Math.random() * 1.6 - 0.8);
      for (let i = 0; i < n; i++) {
        const a = t + i * step, fa = f0 * (kind === 0 ? 1 : kind === 1 ? (i % 2 ? 1 : 1.19) : 1.4 - 0.05 * i), fb = fa * (kind === 0 ? 1.25 : kind === 1 ? 0.97 : 0.68);
        s.frequency.setValueAtTime(fa, a); s.frequency.exponentialRampToValueAtTime(fb, a + len);
        e.gain.setValueAtTime(0, a); e.gain.linearRampToValueAtTime(v, a + 0.012); e.gain.linearRampToValueAtTime(0, a + len);
      }
      G.chain(s, e, p, o); G.shot(t + n * step + 0.1, s, e, p);
    }, 1 + 2 * Math.random());
  },
  // thunder far off, 14 to 40 s apart: a soft first clap, then a few swells dying away. It cannot answer the world's flashes (the worlds do not say when they flash).
  thunder(G, g) {
    const lp = G.filter('lowpass', 300, 0.5), e = G.gain(0), o = G.gain(g);
    G.chain(G.noise('pink', 0.5), lp, e, o); G.out(o, 0.5);
    G.every(14, 40, (t) => {
      const k = 0.5 + 0.5 * Math.random(), n = 3 + Math.floor(Math.random() * 3); let a = t;
      lp.frequency.cancelScheduledValues(t); lp.frequency.setValueAtTime(1400, t); lp.frequency.exponentialRampToValueAtTime(260, t + 4.5);   // the clap is bright enough for a small speaker, the roll is not
      e.gain.cancelScheduledValues(t); e.gain.setValueAtTime(0, t);
      for (let i = 0; i < n; i++) { const pk = k * (1 - i / (n + 1)) * (0.6 + 0.4 * Math.random()); e.gain.linearRampToValueAtTime(pk, a + 0.15 + 0.2 * Math.random()); a += 0.8 + 1.1 * Math.random(); e.gain.linearRampToValueAtTime(pk * 0.35, a); }
      e.gain.linearRampToValueAtTime(0, a + 3);
    }, 4 + 9 * Math.random());
  },
  // drips: the short rising note of a drop closing over, sent mostly to the reverb (a drip is heard by the room it falls in)
  drips(G, g) {
    const o = G.gain(g); G.out(o, 1.2);
    G.every(0.7, 4.5, (t) => {
      const f = 700 + 1100 * Math.random(), s = G.tone('sine', f, t, t + 0.25), e = G.env(), p = G.spot(Math.random() * 1.4 - 0.7);
      s.frequency.setValueAtTime(f, t); s.frequency.exponentialRampToValueAtTime(f * 1.7, t + 0.05);
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.25 + 0.5 * Math.random(), t + 0.004); e.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      G.chain(s, e, p, o); G.shot(t + 0.25, s, e, p);
    }, 0.5 + Math.random());
  },
  // wind chimes: one to four small high strokes, in the world's own scale, with the uneven overtone that makes metal
  chimes(G, g, c) {
    const o = G.gain(g); G.out(o, 0.6);
    G.every(4, 13, (t) => {
      const n = 1 + Math.floor(Math.random() * 4), p = G.spot(Math.random() * 1.2 - 0.6), list = [p]; let a = t;
      for (let i = 0; i < n; i++) {
        const f = c.hz(36 + c.sc[Math.floor(Math.random() * c.sc.length)]), s = G.tone('sine', f, a, a + 2.1), s2 = G.tone('sine', f * 2.76, a, a + 2.1), e2 = G.env(0.25), e = G.env();
        e.gain.setValueAtTime(0, a); e.gain.linearRampToValueAtTime(0.2 + 0.25 * Math.random(), a + 0.003); e.gain.exponentialRampToValueAtTime(0.0005, a + 2);
        s.connect(e); G.chain(s2, e2, e, p); list.push(s, s2, e2, e); a += 0.12 + 0.3 * Math.random();
      }
      p.connect(o); G.shot(a + 2.1, ...list);
    }, 2 + 3 * Math.random());
  },
  // a far bell tolling, 11 to 26 s apart, on the world's root: five partials of a cast bell, the high ones dying first
  bell(G, g, c) {
    const o = G.gain(g); G.out(o, 0.7);
    G.every(11, 26, (t) => {
      const f = c.hz(12), e = G.env(), list = [e];
      for (const [m, a, d] of [[0.5, 0.35, 7], [1, 1, 6], [1.19, 0.6, 4], [1.5, 0.35, 3], [2, 0.5, 2.4], [2.67, 0.22, 1.4]]) { const s = G.tone('sine', f * m, t, t + d + 0.1), pg = G.env(); pg.gain.setValueAtTime(a * 0.3, t); pg.gain.exponentialRampToValueAtTime(0.0003, t + d); G.chain(s, pg, e); list.push(s, pg); }
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(1, t + 0.006);
      e.connect(o); G.shot(t + 7.2, ...list);
    }, 3 + 6 * Math.random());
  },
  // ice: either the long falling note of a crack running across a frozen lake, or a creak (a run of dry ticks closing up)
  ice(G, g) {
    const o = G.gain(g); G.out(o, 0.7);
    G.every(5, 16, (t) => {
      const e = G.env(), p = G.spot(Math.random() * 1.4 - 0.7);
      if (Math.random() < 0.4) {
        const f = 1700 + 900 * Math.random(), s = G.tone('sine', f, t, t + 0.6);
        s.frequency.setValueAtTime(f, t); s.frequency.exponentialRampToValueAtTime(280, t + 0.38);
        e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.5, t + 0.005); e.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        G.chain(s, e, p, o); G.shot(t + 0.6, s, e, p);
      } else {
        const s = G.ac.createBufferSource(), bp = G.ac.createBiquadFilter(), n = 5 + Math.floor(Math.random() * 10); let a = t, gap = 0.05 + 0.05 * Math.random();
        s.buffer = G.K.buf('white'); s.loop = true; bp.type = 'bandpass'; bp.frequency.value = 1200 + 1500 * Math.random(); bp.Q.value = 12;
        e.gain.setValueAtTime(0, t); for (let i = 0; i < n; i++) { e.gain.setValueAtTime(2.5 * (0.5 + 0.5 * Math.random()), a); e.gain.exponentialRampToValueAtTime(0.001, a + 0.014); a += gap; gap *= 0.9; }
        s.start(t); s.stop(a + 0.1); G.chain(s, bp, e, p, o); G.shot(a + 0.1, s, bp, e, p);
      }
    }, 2 + 4 * Math.random());
  },
});
