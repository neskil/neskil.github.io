// Generative ambient sound: a slow pad, a bed (wind, water, room tone, or the still hum of space), sparse bells, and up to three
// layers chosen by what the world contains (rain, surf, birds ...: sound-layers.js; which world gets what: sound-table.js, made from
// design/sound.json). Re-tuned for every world and crossed at equal power at each portal. Off until the viewer turns it on, and
// nothing of this is loaded before that.
import { SOUND } from './sound-table.js';
import { makeKit, makeGroup, BEDS, LAYERS, mulberry } from './sound-layers.js';

const SCALES = {
  pentatonic: [0, 2, 4, 7, 9], lydian: [0, 2, 4, 6, 7, 9, 11], major: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10],
  minor: [0, 2, 3, 5, 7, 8, 10], wholetone: [0, 2, 4, 6, 8, 10], phrygian: [0, 1, 4, 5, 7, 8, 10], octatonic: [0, 2, 3, 5, 6, 8, 9, 11],
  ancient: [0, 3, 5, 7, 10],
};
// One preset per kind of place. gain (dB) evens out their loudness: measured by tools/soundtest.mjs, change it there and here together.
const PRESET = {
  wilderness: { scale: 'pentatonic', bed: 'wind', bright: 0.5, gain: 0 }, ocean: { scale: 'lydian', bed: 'water', bright: 0.45, gain: 0 },
  sky: { scale: 'lydian', bed: 'wind', bright: 0.7, gain: 0 }, city: { scale: 'dorian', bed: 'room', bright: 0.4, gain: 0 },
  interior: { scale: 'major', bed: 'room', bright: 0.35, gain: 0 }, domestic: { scale: 'pentatonic', bed: 'room', bright: 0.4, gain: 0 },
  alien: { scale: 'wholetone', bed: 'wind', bright: 0.55, gain: 0 }, bizarre: { scale: 'octatonic', bed: 'none', bright: 0.6, gain: 0 },
  prehistoric: { scale: 'ancient', bed: 'wind', bright: 0.42, gain: 0 },   // deep time: an open, older chord and a darker pad (these worlds used to fall back to wilderness)
  // the antechamber: a quiet neutral bed (root, fifth and octave: no third, so neither glad nor sad), no bells, no air
  between: { scale: 'pentatonic', bed: 'none', bright: 0.25, gain: -4, bells: 0, chord: [[0, 0.6], [12, 1], [19, 0.6], [24, 0.3]] },
};
// What level 1 of a layer or a bed means, as a gain. Set from tools/soundtest.mjs --only layers so that a long layer at level 1 sits
// 5 to 10 LU under the pad on a laptop speaker (fire, rail and herd, which are all peaks, about 14; a row's usual 0.5 is 6 dB lower
// still), a bed 12 to 14 LU under it, and the loudest moment of a single event (thunder, a bell, a chime, a drip) 4 to 14 dB under
// the pad's own level. To make one layer louder everywhere change its number here; to change one world, change its row.
const LEVEL = {
  rain: 0.18, surf: 0.46, falls: 0.35, stream: 0.4, wind: 0.64, thinwind: 0.36, fire: 0.2, insects: 0.14, crowd: 0.28, rail: 0.18, underwater: 0.28, hum: 0.1, herd: 0.2,
  birds: 0.09, thunder: 0.45, drips: 0.27, chimes: 0.18, bell: 0.2, ice: 0.33,
  bed: { wind: 0.31, water: 0.28, room: 0.32, still: 0.1 },
};
const ROOTS = [0, 2, 3, 5, 7, 8, 10], C3 = 130.81, XFADE = 2.4;   // a world's key: one of seven roots from C3 up, chosen by its seed
const dbToGain = (db) => Math.pow(10, db / 20);
// a table row is text: "rain:0.6 thunder:0.5 bed:none" (at most three layers, each with a level; bed replaces the preset's bed)
function parseRow(row) {
  const out = { layers: [] };
  for (const tok of String(row || '').split(/[\s,]+/)) { const [k, v] = tok.split(':'); if (!k) continue; if (k === 'bed') out.bed = v; else if (LAYERS[k] && out.layers.length < 3) out.layers.push([k, v === undefined ? 0.7 : Number(v)]); }
  return out;
}

export function createAudio(opt = {}) {
  const AC = window.AudioContext || window.webkitAudioContext, ac = new AC(), sr = ac.sampleRate;
  const mute = new Set(opt.mute || []);   // the test tool listens to one part at a time: 'pad', 'bed', 'bells', 'layers'
  // ---- the way out: everything -> on/off -> limiter -> ceiling -> speakers ----
  const bus = ac.createGain(), master = ac.createGain(); master.gain.value = 0; bus.gain.value = 0.89 * (opt.drive || 1);   // 0.89: one decibel of room under the limiter; drive: the test tool pushes it
  // The limiter holds a loud moment (a bell on a wave on a crossing) down. The browser's compressor adds a make-up gain of its own
  // (0.6 of what it would take off a full-scale signal): `trim` takes exactly that back, so below the threshold nothing is changed.
  const comp = ac.createDynamicsCompressor(), TH = -6, RATIO = 12;   // a world's own peaks stay near -7 dBFS: in ordinary running the limiter does nothing
  comp.threshold.value = TH; comp.knee.value = 0; comp.ratio.value = RATIO; comp.attack.value = 0.003; comp.release.value = 0.25;
  const trim = ac.createGain(); trim.gain.value = opt.noLimiter ? 1 : dbToGain(0.6 * TH * (1 - 1 / RATIO));
  // The ceiling: a curve no sample can pass. Straight up to -6 dBFS, then bending over to end at -4.4 dBFS however hard it is driven
  // (between samples a hard-driven wave still rises about a decibel above that: the room up to -3 is for it).
  const clip = ac.createWaveShaper(), N = 4097, curve = new Float32Array(N);
  for (let i = 0; i < N; i++) { const x = (i / (N - 1)) * 2 - 1, a = Math.abs(x); curve[i] = Math.sign(x) * (a <= 0.5 ? a : 0.5 + 0.1 * Math.tanh((a - 0.5) / 0.1)); }
  clip.curve = curve;
  bus.connect(master); master.connect(comp); comp.connect(trim); trim.connect(clip); clip.connect(ac.destination);
  // ---- reverb: a seeded impulse (the old one was Math.random, so level and left/right balance changed with every page load), growing
  // darker as it dies; what is sent to it is high-passed, so the low end stays dry and steady ----
  const len = Math.floor(sr * 3.2), imp = ac.createBuffer(2, len, sr), rnd = mulberry(7);
  for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); let lp = 0; for (let i = 0; i < len; i++) { const t = i / len; lp += (0.8 - 0.65 * t) * (rnd() * 2 - 1 - lp); d[i] = lp * Math.exp(-7.5 * t) * (1 - t) * Math.min(1, i / (sr * 0.012)); } }
  const verbIn = ac.createGain(), verbHp = ac.createBiquadFilter(), verb = ac.createConvolver(), wet = ac.createGain();
  verbHp.type = 'highpass'; verbHp.frequency.value = 250; verb.buffer = imp; wet.gain.value = 0.5;
  verbIn.connect(verbHp); verbHp.connect(verb); verb.connect(wet); wet.connect(bus);
  const K = makeKit(ac, bus, verbIn);
  // the pad's voice: a soft reed (each overtone weaker than the last, the even ones weaker still), so a note at 150 Hz is still heard on a speaker that starts at 200
  const im = new Float32Array(13); for (let n = 1; n <= 12; n++) im[n] = (n % 2 ? 1 : 0.55) / Math.pow(n, 1.5);
  const wave = ac.createPeriodicWave(new Float32Array(13), im);

  let on = false, cur = null, group = null, offTimer = 0;

  // what a world sounds like: the preset of its kind of place, its key from its seed, its row of the table, and its own `audio` field last
  function config(W) {
    const d = W.def || {}, custom = (W.world && W.world.audio) || {};
    const base = d.antechamber ? PRESET.between : PRESET[d.category] || PRESET[d.placeKind] || PRESET.wilderness;
    const row = parseRow(d.antechamber ? '' : custom.layers !== undefined ? custom.layers : SOUND[d.id]);
    const c = { bells: 1, ...base, root: ROOTS[((W.seed >>> 0) >>> 3) % ROOTS.length], layers: row.layers };
    if (row.bed) c.bed = row.bed; else if ((d.media || []).includes('space') && !d.antechamber) c.bed = 'still';   // space has no wind
    if ((d.weirdness ?? 0) > 0.8 && !custom.scale && !d.antechamber) c.scale = ((W.seed >>> 0) & 1) ? 'octatonic' : 'wholetone';
    for (const k of ['scale', 'bed', 'bright', 'root', 'bells']) if (custom[k] !== undefined) c[k] = custom[k];
    c.sc = SCALES[c.scale] || SCALES.pentatonic; c.hz = (semi) => C3 * Math.pow(2, (c.root + semi) / 12);
    return c;
  }
  // the pad: five notes of the world's scale between 130 and 1050 Hz (the old one put its weight at 55 to 98 Hz, where small speakers
  // play nothing). Each note is two reeds a fraction of a hertz apart (a slow turning, not a beat), swelling on its own slow clock.
  function pad(G, c) {
    const sc = c.sc, lp = G.filter('lowpass', 500 + 1900 * c.bright, 0.5), o = G.gain(0.075 * dbToGain(c.gain + (5 - c.root) * 0.08));   // low keys lose a little on a small speaker: evened out
    const fifth = sc[Math.min(4, sc.length - 1)], PAN = [0, -0.4, 0.4, 0.25, -0.3];   // the 'fifth' of the two strange scales is a tritone or an augmented fifth: kept, but as a colour under the rest
    let chord = c.chord || [[0, 0.75], [fifth, fifth === 6 || fifth === 8 ? 0.4 : 0.65], [12, 0.6], [12 + sc[2 % sc.length], 0.65], [24 + sc[1], 0.5]];
    if (!c.chord) { const k = Math.sqrt(2.0175 / chord.reduce((p, v) => p + v[1] * v[1], 0)); chord = chord.map(([semi, a]) => [semi, a * k]); }   // the same power whatever the chord
    G.mod(G.osc('sine', 0.04 + 0.04 * Math.random()), 120 + 500 * c.bright, lp.frequency);   // the brightness breathes, a turn every 12 to 25 s
    chord.forEach(([semi, amp], i) => {
      const f = c.hz(semi), v = G.gain(amp);
      G.mod(G.osc('sine', 0.03 + 0.07 * Math.random()), amp * 0.45, v.gain);
      G.chain(G.osc(wave, f), v); G.chain(G.osc(wave, f + 0.1 + 0.3 * Math.random()), v);
      G.chain(v, G.pan(PAN[i % 5]), lp);   // fixed places, so the balance is the same on every page load
    });
    G.chain(G.osc('sine', c.hz(-12)), G.gain(0.4), o);   // a quiet low end, for speakers that have one
    G.chain(lp, o); G.out(o, 0.45);
  }
  // sparse bells in the world's scale: one every 7 to 22 s (the old ones came every 2 to 7)
  function bells(G, c) {
    const o = G.gain(0.1 * dbToGain(c.gain)); G.out(o, 1);
    G.every(7 / c.bells, 22 / c.bells, (t) => {
      const f = c.hz(24 + c.sc[Math.floor(Math.random() * c.sc.length)] + (Math.random() < 0.3 ? 12 : 0)), s = G.tone('sine', f, t, t + 4.1), s2 = G.tone('sine', f * 2.76, t, t + 4.1), e2 = G.env(0.18), e = G.env(), p = G.spot(Math.random() - 0.5);
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.5 + 0.5 * Math.random(), t + 0.02); e.gain.exponentialRampToValueAtTime(0.0005, t + 4);
      s.connect(e); G.chain(s2, e2, e, p, o); G.shot(t + 4.1, s, s2, e2, e, p);
    }, 3 + 8 * Math.random());
  }
  function build(c) {
    const G = makeGroup(K);
    if (!mute.has('pad')) pad(G, c);
    if (!mute.has('bells') && c.bells > 0) bells(G, c);
    if (!mute.has('bed') && BEDS[c.bed]) BEDS[c.bed](G, LEVEL.bed[c.bed] * dbToGain(c.gain), c);
    if (!mute.has('layers')) for (const [name, lv] of c.layers) LAYERS[name](G, LEVEL[name] * lv, c);
    return G;
  }
  // a world change: the old world falls as a cosine while the new one rises as a sine, so their power adds up to the same all the way (no hole)
  function swap() {
    if (!cur) return;
    const t = ac.currentTime, old = group, G = build(config(cur)); group = G;
    if (!old) { G.fade.gain.value = 1; G.fadeW.gain.value = 1; return; }
    for (const [a, b] of [[old.fade, G.fade], [old.fadeW, G.fadeW]]) {
      const v0 = a.gain.value; a.gain.cancelScheduledValues(t); a.gain.setValueAtTime(v0, t); b.gain.setValueAtTime(0, t);
      for (let i = 1; i <= 8; i++) { const x = (i / 8) * Math.PI / 2, at = t + XFADE * i / 8; a.gain.linearRampToValueAtTime(v0 * Math.cos(x), at); b.gain.linearRampToValueAtTime(Math.sin(x), at); }
    }
    setTimeout(() => old.dispose(), (XFADE + 0.2) * 1000);
  }

  return {
    // the button: on is heard within a quarter of a second (the world's sound starts at full and only this gain rises); off ends everything
    // this world had running and puts the context to sleep
    toggle() {
      on = !on; const t = ac.currentTime; clearTimeout(offTimer);
      master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(on ? 1 : 0, t + (on ? 0.25 : 0.4));
      if (on) { ac.resume(); if (!group) swap(); }
      else offTimer = setTimeout(() => { if (on) return; if (group) group.dispose(); group = null; try { const p = ac.suspend(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }, 600);
      return on;
    },
    // called at every world, and by the button with the world on screen (the antechamber too: its def.antechamber is true)
    world(W) { if (!W || !W.def || (W === cur && group)) return; cur = W; if (on) swap(); },
  };
}
