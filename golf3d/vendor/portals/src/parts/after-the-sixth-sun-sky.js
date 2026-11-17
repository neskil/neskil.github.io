// AFTER THE SIXTH SUN: the sky. Six suns sinking on slanted tracks, the red one eaten by an unseen body, and the
// cluster that ignites when it is gone. Everything here is a pure function of where we are on the route, in METRES
// from the entry (m), so the same place on the flight always shows the same sky. The clock is hung on two places the
// world gives it: notchAt, the route metre where the first notch shows in the red sun, and goneAt, where its last
// thread goes. Before the notch the sky's keys are degrees of the sky's turn (18 by the notch); through the eclipse
// they are the sliver's thickness or the share of the eclipse gone; after the snap they are metres flown past it.
//   makeClock(opts)        sun positions, eclipse, sky colours and the four lights' values at m (no allocation per call)
//   makeSkyDome(clock, o)  the dome: gradient, six discs with glow and wash, the bite, the unresolved cluster glow,
//                          faint grain stars, the far city's glow; exports the GLSL of the night glow for the lake
//   makeStars(clock, o)    the resolved stars: one instanced draw of round sprites that arrive in a wave
//   makeLakeMirror(...)    the lake surface (mirror of the dome) and the stars' reflections laid on it
import * as THREE from 'three';

const D2R = Math.PI / 180;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
// azimuth 0 = the direction of travel (-Z), positive to the right (+X); elevation above the horizon; both in degrees
export const dirOf = (az, el, out = new THREE.Vector3()) => { const a = az * D2R, e = el * D2R, c = Math.cos(e); return out.set(Math.sin(a) * c, Math.sin(e), -Math.cos(a) * c); };
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };

export const SUN_COLORS = { blue: '#bcd4ff', white: '#fff6e8', gold: '#ffd27a', red: '#c2281c', star: '#b9c8ff' };

// ---------------------------------------------------------------- the clock
// opts: notchAt, goneAt, endAt (route metres of the first notch, of the snap and of the route's end), tremble (two phases of the last drop's
// unsteadiness, drawn by the world from a stream of that name), turn0 (degrees the sky has already turned at
// the entry: the viewer's later hours), swapPairs (the white pair low on the left and first to set, the blue pair in
// the middle), goldAz (where the golden sun starts, degrees), heartAz / heartEl (the cluster's heart), skyline(az, P)
// -> the elevation in degrees of the land's skyline seen from P toward az (the suns' light on the land ends when the
// ridge hides them).
export function makeClock(o = {}) {
  const swap = !!o.swapPairs, goldAz = o.goldAz ?? 16, skyline = o.skyline || (() => 0);
  const MN = o.notchAt ?? 420, MG = Math.max(MN + 60, o.goneAt ?? 700), turn0 = o.turn0 ?? 0, TREM = o.tremble || [0, 1.3];
  const turnOf = (m) => turn0 + (18 - turn0) * Math.max(0, m) / MN;      // degrees the sky has turned: 18 by the first notch
  const eclOf = (m) => (m - MN) / (MG - MN);                             // the share of the eclipse gone
  const low = { az: -22, el: 5 }, mid = { az: -6, el: 15 };
  const pb = swap ? mid : low, pw = swap ? low : mid;
  // six suns: az0, el0 at s = 0, colour, disc radius (deg), radiance of the disc, light slot (0 blue pair, 1 white pair / red, 2 gold)
  const SUNS = [
    { az: pb.az - 1.3, el: pb.el + 0.25, hex: SUN_COLORS.blue, disc: '#5f92ff', tint: [0.4, 0.62, 1.25], r: 0.8, rad: 4.2, kind: 0 },
    { az: pb.az + 1.3, el: pb.el - 0.25, hex: SUN_COLORS.blue, disc: '#5f92ff', tint: [0.4, 0.62, 1.25], r: 0.8, rad: 4.2, kind: 0 },
    { az: pw.az - 1.9, el: pw.el - 0.35, hex: SUN_COLORS.white, disc: '#fff4e2', tint: [1.1, 1.05, 0.95], r: 1.0, rad: 3.4, kind: 1 },
    { az: pw.az + 1.9, el: pw.el + 0.35, hex: SUN_COLORS.white, disc: '#fff4e2', tint: [1.1, 1.05, 0.95], r: 1.0, rad: 3.4, kind: 1 },
    { az: goldAz, el: 18, hex: SUN_COLORS.gold, disc: '#ffb030', tint: [1.45, 0.88, 0.3], r: 1.5, rad: 2.7, kind: 2 },
    { az: -12, el: 27, hex: SUN_COLORS.red, disc: '#e2260f', tint: [1.7, 0.3, 0.25], r: 1.8, rad: 2.6, kind: 3 },
  ];
  // one rotation of the whole sky: 18 degrees down by the first notch, 2 more by the end of the eclipse, on tracks slanted to the right
  const WN = (MG - MN) / 8;      // the turn slows over an eighth of the eclipse's length either side of the notch
  const sink = (m) => mix(turnOf(m), 18 + 2 * eclOf(m), sstep(MN - WN, MN + WN, m));
  const SLANT = 0.78;
  // the red sun keeps a flatter track of its own: it stands low enough at the start to be counted with the other five,
  // drifts to the right with the rest of the sky, and comes down only 5 degrees by the first notch (then 2 more)
  const redTrack = (m, o) => { const k = sink(Math.max(0, m)); o.az = SUNS[5].az + k * SLANT; o.el = SUNS[5].el - (Math.min(k, 18) * (5 / 18) + Math.max(k - 18, 0)); return o; };
  // THE STARS' COMING (fix round 3). Its one length, WAVE, is the stretch between two places of the world: from the road's first
  // bend at the ridge foot, where the thread goes (goneAt), to the place abreast of the road's first hairpin (fullAt), where the
  // route leaves the road's line for the dome: from there the dome is to stand against the whole sky, so there the night is full.
  // (It was 56 m, a twentieth of the brief's journey: a share of the flight turned into metres, withdrawn.) The book holds no
  // starless dark: the thread breaks and the Stars are there. So nothing stands between the snap and the first stars: the
  // brightest twentieth (some 1,500) are out over the whole sky in the time the eye takes to turn to it (the first fourteenth of the stretch,
  // about a third of a second); the rest of the stretch is halved: in its first half the rest crowd in all over the sky at once,
  // the brightest first and thickest toward the heart (the story's second or two); in its second half comes one further swell,
  // which the story gives when a torch near the watcher falls and goes out: a torch on the gallery drops as the swell begins. The
  // land's silver and the heart's light come up over the same stretch. The lamp is re-aimed at the heart as the first stars stand,
  // while it gives no light.
  const M_FULL = Math.max(MG + 20, o.fullAt ?? MG + 60), WAVE = M_FULL - MG;
  const M_FIRST = MG, M_WAVE = M_FIRST + WAVE / 14, M_SWAP = M_WAVE, M_SWELL = (M_WAVE + M_FULL) / 2;
  // The far city burns last: its first fire shows at the place where the city first comes in sight over the ridge (cityAt, the
  // brow), and the burning grows from there to the route's end (endAt), never level.
  const M_CITY = Math.max(M_FULL, o.cityAt ?? M_FULL + WAVE), M_END = Math.max(M_CITY + 1, o.endAt ?? M_CITY + 300);
  // what is left of the red disc: thickness of the lit sliver in degrees (3.6 = whole), and its share of the disc's area
  const thick = (m) => 3.6 * Math.pow(sat(1 - eclOf(m)), 1.35);
  const areaOf = (th) => { const h = sat(th / 3.6), c = 1 - 2 * h; return (Math.acos(Math.max(-1, Math.min(1, c))) - c * Math.sqrt(Math.max(0, 1 - c * c))) / Math.PI; };

  // sky colours as sums of what each sun gives (linear): all six = milky blue over cream, gold + red = amber, red alone = wine
  const Zr = lin('#2a0f24'), Hr = lin('#7a1f1a'), Zgr = lin('#4f5a78'), Hgr = lin('#b9783a'), Zall = lin('#5a86d2'), Hall = lin('#f1e6cf'), NIGHT = lin('#05040a');
  const sub = (a, b, k = 1) => a.map((v, i) => Math.max(0, (v - b[i]) * k));
  const ZEN = [sub(Zall, Zgr, 0.275), sub(Zall, Zgr, 0.275), sub(Zall, Zgr, 0.225), sub(Zall, Zgr, 0.225), sub(Zgr, Zr), Zr];
  const HOR = [sub(Hall, Hgr, 0.2), sub(Hall, Hgr, 0.2), sub(Hall, Hgr, 0.3), sub(Hall, Hgr, 0.3), sub(Hgr, Hr), Hr];
  const cols = SUNS.map((q) => new THREE.Color(q.hex)), discCols = SUNS.map((q) => new THREE.Color(q.disc));
  const starCol = new THREE.Color(SUN_COLORS.star), warm = new THREE.Color('#ff9a4a');

  const st = {
    m: 0, turn: 0, ecl: 0, notchAt: MN, goneAt: MG, waveAt: M_WAVE, swellAt: M_SWELL, nightAt: M_FULL, waveLen: WAVE, cityAt: M_CITY, city: 0, suns: SUNS.map((q, i) => ({ dir: new THREE.Vector3(), az: 0, el: 0, vis: 0, sky: 0, r: q.r, rad: q.rad, kind: q.kind, color: cols[i], tint: new THREE.Vector3().fromArray(q.tint), disc: new THREE.Color() })),
    thick: 3.6, frac: 1, bodyDir: new THREE.Vector3(), bodyR: 9, deathDir: new THREE.Vector3(), heartDir: dirOf(o.heartAz ?? 2, o.heartEl ?? 22),
    wave: -1, night: 0, dark: 0, first: 0, crowd: 0, swell: 0, aur: 0, hard: 0, dusk: 0, trem: 1, el5: 20, zen: new THREE.Color(), hor: new THREE.Color(), wind: 0.6,
    hemiSky: new THREE.Color(), hemiGround: new THREE.Color(),
    // the three directional lights: 0 the white pair, then the red sun, then the cluster's heart; 1 the golden sun; 2 the blue pair
    dir: [0, 1, 2].map(() => ({ dir: new THREE.Vector3(0, 1, 0), color: new THREE.Color(), el: 10 })),
    share: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector3()),      // each sun's share of the light on level ground, per channel (the tint of its shadow is 1 - share)
    cot: new Float32Array(6), away: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector2()),      // shadow length per metre of height, and its direction on the ground
  };
  { const q = redTrack(MG, {}); dirOf(q.az, q.el, st.deathDir); }
  st.eclAt = (f) => MN + f * (MG - MN);      // the route metre where the share f of the eclipse is gone
  const tmp = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), c3 = new THREE.Color();
  const P0 = new THREE.Vector3(0, 10, 300);

  st.at = (m, P = P0) => {
    const s = m, kf = turnOf(m), ecl = sat(eclOf(m));
    st.m = m; st.turn = kf; st.ecl = ecl;
    let zr = NIGHT[0], zg = NIGHT[1], zb = NIGHT[2], hr = NIGHT[0], hg = NIGHT[1], hb = NIGHT[2];
    st.thick = thick(s); st.frac = areaOf(st.thick);
    // the last drop of the sun is unsteady: it trembles before it goes (in metres flown, as everything of the sky is; the disc, its light and the
    // ember in the air tremble together; where its two beats stand is each visit's own: opts.tremble, two phases from a stream of that name)
    st.trem = 1 - 0.42 * (1 - sstep(0.02, 0.3, st.thick)) * (0.5 + 0.5 * Math.sin(m * 2.3 + TREM[0]) * Math.sin(m * 0.71 + TREM[1]));
    const redSky = Math.pow(st.frac, 0.42);
    for (let i = 0; i < 6; i++) {
      const q = SUNS[i], u = st.suns[i];
      if (i === 5) redTrack(s, u); else { u.el = q.el - kf; u.az = q.az + kf * SLANT; }
      dirOf(u.az, u.el, u.dir);
      u.sky = sstep(-5, 5, u.el) * (i === 5 ? redSky : 1);
      u.vis = sstep(-0.4, 2.6, u.el - skyline(u.az, P));
      zr += ZEN[i][0] * u.sky; zg += ZEN[i][1] * u.sky; zb += ZEN[i][2] * u.sky;
      hr += HOR[i][0] * u.sky; hg += HOR[i][1] * u.sky; hb += HOR[i][2] * u.sky;
      // the disc: its colour times its radiance, reddened and dimmed in the last degrees above the horizon
      const low2 = sstep(-1, 7, u.el);
      u.disc.copy(discCols[i]).lerp(warm, (1 - low2) * (i === 5 ? 0 : i < 2 ? 0.12 : 0.5)).multiplyScalar(u.rad * (i < 2 ? 0.8 + 0.2 * low2 : 0.5 + 0.5 * low2) * (i === 5 ? st.trem : 1));      // (the blue pair keeps its blue in the haze)
    }
    st.zen.setRGB(zr, zg, zb); st.hor.setRGB(hr, hg, hb);
    // the dark body: 9 degrees in radius, its centre below and to the right of the red sun, so the last thread is on the upper left limb
    const red = st.suns[5];
    right.crossVectors(red.dir, Y).normalize(); up.crossVectors(right, red.dir).normalize();
    const d = (st.bodyR - 1.8 + st.thick - Math.max(0, m - MG) * 0.0176) * D2R;      // (the dark body goes on across the sky, 1.76 degrees in every 100 m)
    st.bodyDir.copy(red.dir).multiplyScalar(Math.cos(d)).addScaledVector(right, Math.sin(d) * 0.72).addScaledVector(up, -Math.sin(d) * 0.694).normalize();
    // the dark second, then the wave of stars out of the place where the sun died (radians of sky reached)
    st.dark = 1 - sstep(0, 0.2, st.thick);
    // no star and no glow while any of the sun is left. At the snap itself the brightest twentieth, over the whole sky; then the crowd (every
    // star by its rank and its nearness to the heart, no front crossing the sky); then the swell. wave: what the stars' shader reads (below 0
    // before the crowd; 1.25 when every star is out; 1.75 when the swell is done). The land's silver comes up over the same length.
    st.first = sstep(M_FIRST, M_WAVE, m);
    { const x = (m - M_WAVE) / (M_FULL - M_WAVE); st.crowd = sat(x * 2); st.swell = sstep(0.5, 1, x); st.wave = x <= 0 ? x : 1.25 * Math.pow(st.crowd, 0.8) + 0.5 * st.swell; }
    st.night = sstep(M_WAVE, M_FULL, m);
    st.city = sstep(M_CITY, M_END, m);
    st.aur = Math.pow(st.frac, 0.3) * sstep(-2.5, 1.5, st.suns[5].el);      // the dying sun keeps a wine aureole to the last
    st.hard = 1 - sat(st.thick / 3.6);                                      // as the sliver thins its light comes from a narrower source
    // THE DUSK (fix round 3; round 2's red band round the horizon is withdrawn: that is an earthly eclipse). Until the thread goes it is dusk, not
    // night: as the sun is eaten past its half the eye opens to what light there is, and the air keeps a deep colour of its own (see daySky). The
    // dusk comes in as the lit share of the disc falls from 62 to 30 in a hundred, and it dies WITH the sliver, over its last hundredth of a degree
    // (the thread itself), as the land's light does: after the snap there is no red anywhere in the sky until the city burns.
    st.dusk = (1 - sstep(0.3, 0.62, st.frac)) * sstep(0, 0.01, st.thick);
    st.wind = 0.6 + 1.0 * sstep(0.15, 1, ecl);      // the cold wind rises with the eclipse

    // ---- the light on the land (after the eye's adaptation). Hemisphere: the sky's own hue at a strength that holds through the red stretch
    const day = (st.suns[0].sky + st.suns[1].sky + st.suns[2].sky + st.suns[3].sky + 2 * st.suns[4].sky) / 6;
    const T = mix(1.12, 1.55, sstep(0, 0.34, day)) * mix(1, 0.56, sstep(0, 1, ecl)), fl = 1 - sstep(0, 0.09, st.thick);      // the red fill goes down in value as the sliver thins, more than the sun's own light does: what faces the crescent stands out of what does not
    c3.setRGB((zr + hr) * 0.5, (zg + hg) * 0.5, (zb + hb) * 0.5); const mx = Math.max(c3.r, c3.g, c3.b, 1e-5);
    c3.multiplyScalar(T / mx);
    c3.r = Math.max(c3.r, 0.24 * T * (1 - day)); c3.g = Math.max(c3.g, 0.27 * T * (1 - day)); c3.b = Math.max(c3.b, 0.25 * T * (1 - day));      // some grey in the red fill, so value carries form
    c3.r = mix(c3.r, 0.3, fl); c3.g = mix(c3.g, 0.13, fl); c3.b = mix(c3.b, 0.15, fl);                                                           // the last second: the eye cannot follow
    { const dk = 0.6 * (1 - sstep(0.3, 0.62, st.frac)), v = Math.max(c3.r, c3.g, c3.b); c3.r = mix(c3.r, 0.3 * v, dk); c3.g = mix(c3.g, 0.24 * v, dk); c3.b = mix(c3.b, 0.5 * v, dk); }      // in the dusk the fill comes from the indigo air: what is turned from the sliver is not red
    c3.multiplyScalar(0.06 + 0.94 * sstep(0, 0.01, st.thick));      // and when the thread goes the land's light goes with it: as the last hundredth of a degree goes, the fill falls to almost nothing (the dark is an instant, not a held picture)
    const nk = 0.8 * st.night;      // starlight: silver, from everywhere
    st.hemiSky.setRGB(c3.r * (1 - st.night) + 0.72 * nk, c3.g * (1 - st.night) + 0.8 * nk, c3.b * (1 - st.night) + 1.0 * nk);
    st.hemiGround.copy(st.hemiSky).multiplyScalar(0.34 - 0.2 * st.night); st.hemiGround.r *= 1.12; st.hemiGround.b *= 0.82;      // (by starlight the land gives almost nothing back: what faces down is in shadow)
    // directional 2: the blue pair
    const A = st.dir[2], vb = (st.suns[0].vis + st.suns[1].vis) * 0.5;
    A.dir.copy(st.suns[0].dir).add(st.suns[1].dir).normalize(); A.color.copy(cols[0]).multiplyScalar(2.6 * vb); A.el = (st.suns[0].el + st.suns[1].el) * 0.5;
    // directional 1: the golden sun
    const C = st.dir[1], g = st.suns[4], gl = sstep(-1, 9, g.el);
    C.dir.copy(g.dir); C.color.copy(cols[4]).lerp(warm, (1 - gl) * 0.6).multiplyScalar(4.2 * g.vis * (0.45 + 0.55 * gl)); C.el = g.el;
    if (fill && st.night > 0) { C.dir.copy(fill); C.color.copy(starCol).multiplyScalar(0.62 * st.night); C.el = 40; }      // (the golden sun is long down: its light, at zero, becomes the clots' light)
    // directional 0: the white pair, then (re-aimed while it is at zero) the red sun, then the heart of the cluster
    const B = st.dir[0];
    // (the lamp changes hands at zero: the white pair's light is let go as the sky turns from 10 to 11.75 degrees, the red sun's comes in from 12 to 15)
    const whiteLamp = kf < 11.75, redLamp = !whiteLamp && m < M_SWAP;
    if (whiteLamp) {
      const vw = (st.suns[2].vis + st.suns[3].vis) * 0.5 * (1 - sstep(10, 11.75, kf));
      B.dir.copy(st.suns[2].dir).add(st.suns[3].dir).normalize(); B.color.copy(cols[2]).multiplyScalar(3.2 * vw); B.el = (st.suns[2].el + st.suns[3].el) * 0.5;
    } else if (redLamp) {
      const I = sstep(12, 15, kf) * mix(3.4, 2.7, sstep(0, 0.92, ecl)) * (1 - 0.2 * st.dusk) * st.trem * (1 - fl) * red.vis;      // (in the dusk the sky is never darker than the land it lights)
      B.dir.copy(red.dir); B.color.setRGB(0.6 * I, 0.085 * I, 0.06 * I); B.el = red.el;
    } else {
      B.dir.copy(st.heartDir); B.color.copy(starCol).multiplyScalar(1.0 * st.night); B.el = 22;
    }
    // shadows: for each sun, the direction its shadows run on the ground, their length per metre of height, and its share of the light there
    const hemiUp = st.hemiSky;
    let tr = hemiUp.r, tg = hemiUp.g, tb = hemiUp.b;
    const L = [B, C, A];
    for (let j = 0; j < 3; j++) { const sn = Math.pow(Math.max(0, L[j].dir.y), 0.55); tr += L[j].color.r * sn; tg += L[j].color.g * sn; tb += L[j].color.b * sn; }
    for (let i = 0; i < 6; i++) {
      const u = st.suns[i], kind = u.kind, sn = Math.pow(Math.sin(Math.max(u.el, 0.5) * D2R), 0.55) * 1.3;
      const h = Math.hypot(u.dir.x, u.dir.z) || 1; st.away[i].set(-u.dir.x / h, -u.dir.z / h);
      st.cot[i] = Math.min(24, 1 / Math.tan(Math.max(u.el, 2.4) * D2R));
      let lc = null, f = 0.62;
      if (kind === 0) lc = A.color; else if (kind === 2) { lc = C.color; f = 1; } else if (kind === 1 && whiteLamp) lc = B.color; else if (kind === 3 && redLamp) { lc = B.color; f = 1; }
      const fadeLow = sstep(0.3, 3.5, u.el);      // a sun on the horizon throws no shadow worth drawing
      if (!lc) st.share[i].set(0, 0, 0);
      else {
        const a = lc.r * sn * f / Math.max(tr, 1e-4), b = lc.g * sn * f / Math.max(tg, 1e-4), c = lc.b * sn * f / Math.max(tb, 1e-4), mean = (a + b + c) / 3, K = kind === 3 ? 0.7 : 1.85;
        st.share[i].set(sat((mean + (a - mean) * K) * 1.2) * 0.82, sat((mean + (b - mean) * K) * 1.2) * 0.82, sat((mean + (c - mean) * K) * 1.2) * 0.82).multiplyScalar(fadeLow * (kind === 3 ? 1 + 0.12 * st.hard : 1));
      }
    }
    st.el5 = Math.max(st.suns[5].el, 8);
    if (m >= M_SWAP) {      // the heart of the cluster is a light with a bearing: everything throws one long soft shadow away from it
      const hx = st.heartDir.x, hz = st.heartDir.z, hh = Math.hypot(hx, hz) || 1, sn = Math.pow(Math.max(st.heartDir.y, 0.05), 0.55) * 1.25;
      st.away[5].set(-hx / hh, -hz / hh); st.cot[5] = Math.min(24, hh / Math.max(st.heartDir.y, 0.05)); st.el5 = Math.asin(Math.min(1, Math.max(0.14, st.heartDir.y))) / D2R;
      st.share[5].set(sat(B.color.r * sn / Math.max(tr, 1e-4)), sat(B.color.g * sn / Math.max(tg, 1e-4)), sat(B.color.b * sn / Math.max(tb, 1e-4)));
    }
    return st;
  };
  // the bearing of the cluster's clots taken together: by night a weaker light comes from there, so the land has relief
  let fill = null;
  st.setFill = (dir) => { fill = dir.clone(); if (fill.y > 0.72) { const h = Math.hypot(fill.x, fill.z); if (h < 0.05) fill.set(-0.7, 0.7, 0.15); else { const k = Math.sqrt(1 - 0.72 * 0.72) / h; fill.set(fill.x * k, 0.72, fill.z * k); } } fill.y = Math.max(fill.y, 0.35); fill.normalize(); };
  // where the red sun stands at route metre m (for the gaze and the dome's first bearing; changes nothing)
  const _q = { az: 0, el: 0 };
  st.redDirAt = (m, out) => { redTrack(m, _q); return dirOf(_q.az, _q.el, out); };
  st.at(0);
  return st;
}

// ---------------------------------------------------------------- the cluster: its layout (shared by the dome, the stars and the lake)
// heart: the densest part, where the red sun died; seven clots strung on two arcs through the zenith; three dust lanes.
export function makeCluster(rng, clock, o = {}) {
  const heart = clock.heartDir.clone(), clots = [], lanes = [];
  const side = new THREE.Vector3().crossVectors(heart, new THREE.Vector3(0, 1, 0)).normalize();
  // two arcs from low on either side of the heart, over the zenith, to behind the camera
  for (let i = 0; i < 7; i++) {
    const arc = i % 2, t = 0.16 + 0.7 * ((i >> 1) + rng() * 0.6) / 3.6, tilt = (arc ? 1 : -1) * (0.38 + 0.2 * rng());
    const a = t * Math.PI;      // 0 = toward the heart's bearing on the horizon, pi = behind
    const f = new THREE.Vector3(heart.x, 0, heart.z).normalize();
    const d = new THREE.Vector3().copy(f).multiplyScalar(Math.cos(a)).addScaledVector(new THREE.Vector3(0, 1, 0), Math.sin(a) * Math.cos(tilt)).addScaledVector(side, Math.sin(a) * Math.sin(tilt)).normalize();
    const sig = (1.5 + 1.5 * rng()) * D2R;      // clots 3 to 6 degrees across
    clots.push({ dir: d, sigma: sig, amp: 0.3 + 0.35 * rng() });
  }
  for (let i = 0; i < 3; i++) {
    // a lane lies along a great circle: its plane's normal is near the horizon, so the lane climbs over the sky; the first one cuts the heart off-centre
    const az = (i === 0 ? 0.42 : i === 1 ? -0.95 : 1.9) + (rng() - 0.5) * 0.5, el = (rng() - 0.5) * 0.5;
    const n = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
    const off = i === 0 ? 0.07 + 0.05 * rng() : 0;
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(heart.x, 0, heart.z).normalize());
    n.applyQuaternion(q);
    lanes.push({ n, phase: rng() * 6.283, off });
  }
  const warmth = o.warmth ?? 0.3;
  // The lane mask, the same in JavaScript (stars are thinned by it) as in GLSL (the glow is cut by it). A lane is a river of dust, not a ruled band:
  // it keeps near a great circle (the plane of normal n) but wanders up to a sixth of a radian either side of it, swells and pinches out along its
  // length so that it lies in separate dark clouds, and its sides are soft (a gaussian across, no plateau). s is the place along the lane.
  for (const L of lanes) { L.e1 = new THREE.Vector3().crossVectors(L.n, new THREE.Vector3(0, 1, 0)).normalize(); L.e2 = new THREE.Vector3().crossVectors(L.n, L.e1); }
  const laneAt = (d) => {
    let m = 1;
    for (const L of lanes) {
      const ph = L.phase, s = Math.atan2(d.dot(L.e2), d.dot(L.e1) + 1e-5), h = d.dot(L.n) - L.off;
      const w = 0.15 * Math.sin(2 * s + ph) + 0.09 * Math.sin(5 * s + ph * 1.7) + 0.04 * Math.sin(11 * s + ph * 2.3) + 0.015 * Math.sin(23 * s + ph * 0.7);
      const g = 0.5 + 0.5 * Math.sin(3 * s + ph * 2.1), wd = 0.012 + 0.05 * g * g;
      const str = 0.72 * sstep(-0.6, 0.5, Math.sin(4 * s + ph * 3));
      const x = (h + w) / wd;
      m *= 1 - str * Math.exp(-Math.min(x * x, 40));
    }
    return m;
  };
  const fill = new THREE.Vector3(); for (const c of clots) fill.addScaledVector(c.dir, c.amp * c.sigma * c.sigma); fill.normalize(); clock.setFill(fill);
  return { heart, clots, lanes, warmth, laneAt };
}

function makeNoiseTexture(rng) {
  const N = 256, data = new Uint8Array(N * N * 4);
  for (let i = 0; i < data.length; i++) data[i] = Math.floor(rng() * 256);
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true;
  return tex;
}

// GLSL of the unresolved cluster: vec3 nightGlow(vec3 dir) in linear HDR, already cut by the wave of ignition
export const SKY_NIGHT_GLSL = /* glsl */`
uniform sampler2D tSkyNoise;
uniform vec3 uHeart, uDeath;
uniform vec4 uClot[7];      // direction, 1 / sigma^2
uniform float uClotA[7];
uniform vec4 uLane[3];      // plane normal, phase
uniform float uLaneOff[3];
uniform vec4 uNightP;       // night amount, how much of the unresolved glow is out, time, warmth
vec2 skyUv(vec3 d){ return d.xz / (1.3 + d.y); }
float skyLanes(vec3 d){
  float m = 1.0;
  for (int i = 0; i < 3; i++) {
    vec3 n = uLane[i].xyz; float ph = uLane[i].w;
    vec3 e1 = normalize(cross(n, vec3(0.0, 1.0, 0.0)) + vec3(1e-5, 0.0, 0.0)), e2 = cross(n, e1);
    float s = atan(dot(d, e2), dot(d, e1) + 1e-5), h = dot(d, n) - uLaneOff[i];
    float w = 0.15*sin(2.0*s + ph) + 0.09*sin(5.0*s + ph*1.7) + 0.04*sin(11.0*s + ph*2.3) + 0.015*sin(23.0*s + ph*0.7);
    float g = 0.5 + 0.5*sin(3.0*s + ph*2.1), wd = 0.012 + 0.05*g*g;
    float str = 0.72*smoothstep(-0.6, 0.5, sin(4.0*s + ph*3.0));
    float x = (h + w)/wd;
    m *= 1.0 - str*exp(-min(x*x, 40.0));
  }
  return m;
}
float skyWave(vec3 d){ return clamp(uNightP.y, 0.0, 1.0); }      // (the unresolved glow comes over the whole sky at once: a share with the crowd, the rest with the swell)
vec3 nightGlow(vec3 d){
  float ah = acos(clamp(dot(d, uHeart), -1.0, 1.0));
  float heart = 0.24*exp(-ah*ah/0.05) + 0.11*exp(-ah*ah/0.3) + 0.06*exp(-ah/0.6) + 0.04*exp(-ah/1.2);
  float clots = 0.0;
  for (int i = 0; i < 7; i++) { float c = max(1.0 - dot(d, uClot[i].xyz), 0.0); clots += uClotA[i]*exp(-c*uClot[i].w); }
  vec2 p = skyUv(d);
  vec4 t1 = texture2D(tSkyNoise, p*0.21 + 0.13), t2 = texture2D(tSkyNoise, p*0.62 + 0.41), t3 = texture2D(tSkyNoise, p*1.7), t4 = texture2D(tSkyNoise, p*4.6 + 0.7);
  float n1 = t1.r, n2 = t2.g, n3 = t3.b, n4 = t4.a;
  float lane = skyLanes(d + 0.05*(vec3(n2, n1, n2) - 0.5));
  float knots = smoothstep(0.3, 0.8, n2*0.55 + n3*0.45);                      // knots and voids inside the glow: it is stars, not a lamp
  float g = (0.55 + 0.5*n1)*(0.45 + 1.15*knots)*(0.8 + 0.4*n4);
  float I = (0.03 + heart + clots*0.8)*g*mix(0.1, 1.0, lane);
  // its colour: fields of blue-white suns, of golden ones, here and there of red ones
  float gold = clamp(smoothstep(0.38, 0.72, t1.g*0.6 + t3.r*0.4)*(0.45 + uNightP.w), 0.0, 1.0), rose = smoothstep(0.6, 0.86, t2.b)*0.55;
  vec3 col = mix(mix(vec3(0.5, 0.64, 1.0), vec3(1.0, 0.8, 0.52), gold), vec3(1.0, 0.56, 0.48), rose);
  return col*I*uNightP.x*skyWave(d)*smoothstep(-0.02, 0.1, d.y);
}`;

export function nightUniforms(rng, clock, cluster) {
  return {
    tSkyNoise: { value: makeNoiseTexture(rng) }, uHeart: { value: cluster.heart }, uDeath: { value: clock.deathDir },
    uClot: { value: cluster.clots.map((c) => new THREE.Vector4(c.dir.x, c.dir.y, c.dir.z, 1 / (c.sigma * c.sigma))) }, uClotA: { value: cluster.clots.map((c) => c.amp) },
    uLane: { value: cluster.lanes.map((l) => new THREE.Vector4(l.n.x, l.n.y, l.n.z, l.phase)) }, uLaneOff: { value: cluster.lanes.map((l) => l.off) },
    uNightP: { value: new THREE.Vector4(0, -1, 0, cluster.warmth) },
  };
}

// GLSL of the day sky without the discs (the dome and the lake's mirror both use it)
export const SKY_DAY_GLSL = /* glsl */`
uniform vec3 uZen, uHor;
uniform vec3 uSunDir[6];
uniform vec3 uSunCol[6];
uniform vec4 uSunP[6];      // disc radius (radians), tight glow, wash, sky weight
uniform vec3 uSunTint[6];
uniform float uAur;          // the dying sun's wine aureole
uniform vec4 uLit;           // the red sun's lit part: the direction of its middle, and its half thickness (radians)
uniform vec4 uDusk;          // the dusk: how much of it; the city's bearing (x, z); the sliver's tremble
vec3 daySky(vec3 d){
  float y = clamp(d.y, 0.0, 1.0), t = pow(1.0 - y, 4.4);
  vec3 col = mix(uZen*(1.0 - 0.3*y), uHor, t);
  for (int i = 0; i < 6; i++) {
    float ang = acos(clamp(dot(d, uSunDir[i]), -1.0, 1.0)), r = uSunP[i].x;
    float wash = uSunP[i].z*(1.1*exp(-ang/0.075) + 0.55*exp(-ang/0.2) + 0.22*exp(-ang/0.5))*(0.45 + 0.55*t);
    col = mix(col, col*uSunTint[i], clamp(wash, 0.0, 0.92));               // each sun stains its side of the sky with its own hue
    if (i == 5) {      // the red sun's glare belongs to what is left of it: it is centred on the sliver and shrinks with it (no ghost of the whole disc)
      float al = acos(clamp(dot(d, uLit.xyz), -1.0, 1.0));
      col += uSunCol[i]*(uSunP[i].y*(exp(-al/(uLit.w*1.5 + 0.004)) + 0.11*exp(-al/0.06) + 0.045*exp(-al/0.32)));
      col += vec3(0.5, 0.03, 0.035)*(uAur*(0.42*exp(-al/0.13) + 0.26*exp(-al/0.5))*(0.35 + 0.65*t));
    } else col += uSunCol[i]*(uSunP[i].y*(exp(-ang/(r*1.5 + 0.004)) + 0.11*exp(-ang/0.06)));
  }
  if (uDusk.x > 0.001) {
    // THE DUSK: the air keeps a colour of its own, a floor under the failing sky. Overhead a deep wine-indigo, never black; a WIDE ember glow in
    // the air on the sun's side that thins with the angle from the sliver (light in the air: no ring, no rays, and the sun no larger); a low dull
    // red under the sliver and a little to either side of its bearing, gone well before the city's; and the city's side dark first.
    float al = acos(clamp(dot(d, uLit.xyz), -1.0, 1.0));
    vec2 hd = d.xz/max(length(d.xz), 1e-4), hs = uLit.xz/max(length(uLit.xz), 1e-4);
    float ha = acos(clamp(dot(hd, hs), -1.0, 1.0)), hc = acos(clamp(dot(hd, uDusk.yz), -1.0, 1.0));
    vec3 air = vec3(0.036, 0.021, 0.07)*(0.72 + 0.28*y)
      + vec3(0.42, 0.064, 0.03)*(uDusk.w*(0.5*exp(-al/0.36) + 0.2*exp(-al/0.85)))
      + vec3(0.3, 0.04, 0.02)*(uDusk.w*exp(-min(ha*ha/0.16, 40.0))*exp(-y/0.09));
    air *= 1.0 - 0.78*exp(-min(hc*hc/0.3, 40.0))*exp(-y/0.35);
    col = mix(col, max(col, air), uDusk.x);
  }
  return col;
}`;

// ---------------------------------------------------------------- the dome
const DOME_VS = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix*vec4(mat3(viewMatrix)*position, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;
const DOME_FS = /* glsl */`
${SKY_NIGHT_GLSL}
${SKY_DAY_GLSL}
varying vec3 vDir;
uniform vec4 uBody;         // the dark body: direction, radius (radians)
uniform vec4 uCity;         // bearing x, z; strength; flicker
uniform float uAA, uCirrus, uBead;
uniform vec4 uCloud;        // low cloud: how much, where its field lies (x, z), how much of it is left
float sH(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.x); }
void main(){
  vec3 d = normalize(vDir);
  float y = d.y;
  vec3 col = daySky(d);
  float above = smoothstep(-0.012, 0.0, y);
  vec3 lit = vec3(0.0); float discAll = 0.0;
  for (int i = 0; i < 6; i++) {
    float ang = acos(clamp(dot(d, uSunDir[i]), -1.0, 1.0)), r = uSunP[i].x;
    float disc = 1.0 - smoothstep(r - uAA, r + uAA, ang);
    disc *= 0.62 + 0.38*sqrt(max(1.0 - ang*ang/(r*r), 0.0));                 // a darker limb: the disc reads as a ball
    if (i == 5) {      // the unseen body's limb has heights and hollows: when the thread is thin enough its light is left only in the hollows, as beads
      vec3 bx = normalize(cross(uBody.xyz, vec3(0.0, 1.0, 0.0))), by = cross(bx, uBody.xyz);
      float la = atan(dot(d, by), dot(d, bx) + 1e-5), rough = 0.5 + 0.5*sin(la*131.0 + 1.7)*sin(la*47.0 + 0.4);
      float ab = acos(clamp(dot(d, uBody.xyz), -1.0, 1.0)) - uBead*0.0032*rough;
      disc *= smoothstep(uBody.w - uAA, uBody.w + uAA, ab);
    }
    col = mix(col, uSunCol[i], disc*above); discAll = max(discAll, disc);    // the disc stands in place of the sky, so its own colour reads
    lit += uSunCol[i]*(uSunP[i].w*exp(-ang/0.8));
  }
  vec2 p = skyUv(d);
  if (uCirrus > 0.001) {      // thin high cirrus that takes each sun's colour
    vec2 q = vec2(p.x*0.83 + p.y*0.56, -p.x*0.56 + p.y*0.83);      // long streaks combed on a slant by the high wind
    float c1 = texture2D(tSkyNoise, vec2(q.x*0.046 + uNightP.z*0.00035, q.y*0.3)).g;      // (fix round 3, D3: shorter streaks, fewer, broken by gaps: mares' tails, not arcs ruled across the whole sky)
    float c2 = texture2D(tSkyNoise, vec2(q.x*0.055 + 0.3 + uNightP.z*0.0006, q.y*0.83 + 0.7)).r;
    float c3 = texture2D(tSkyNoise, vec2(q.x*0.0085 + 0.11, q.y*0.07) + 0.5).b;      // where there is any at all
    float brk = texture2D(tSkyNoise, q*0.11 + 0.23).r;
    float ci = smoothstep(0.72, 1.16, c1*0.62 + c2*0.3 + c3*0.6)*smoothstep(0.42, 0.7, brk)*smoothstep(0.04, 0.34, y)*uCirrus;
    col = mix(col, uHor*0.8 + uZen*0.35 + lit*0.1, ci*0.42);
  }
  if (uCloud.w > 0.001) {      // fair-weather cloud low over the far plain on every afternoon: a level field of flat-based heaps seen from below, drifting with
    // the wind, lit by whatever suns are up; it never stands before a sun's disc, and it goes with the red light as the cirrus does
    vec2 cq = d.xz/max(y + 0.07, 0.05)*0.5 + uCloud.yz + vec2(uNightP.z*0.004, uNightP.z*0.0015);
    float k1 = texture2D(tSkyNoise, cq*vec2(0.024, 0.034)).r, k2 = texture2D(tSkyNoise, cq*vec2(0.07, 0.1) + 0.37).g, k3 = texture2D(tSkyNoise, cq*0.33 + 0.11).b;
    float cov = k1*0.6 + k2*0.3 + k3*0.14, th = 0.7 - 0.12*uCloud.x;
    float cl = smoothstep(th, th + 0.13, cov)*smoothstep(0.012, 0.06, y)*(1.0 - smoothstep(0.12, 0.3, y))*uCloud.w*(1.0 - discAll);
    vec3 cc = (uHor*0.8 + uZen*0.3 + lit*0.2)*(0.7 + 0.5*smoothstep(th + 0.02, th + 0.3, cov + 0.12*k3));
    { float al = acos(clamp(dot(d, uLit.xyz), -1.0, 1.0)); cc += vec3(0.34, 0.05, 0.028)*(uDusk.x*uDusk.w*0.55*exp(-al/0.7)); }      // in the dusk the low cloud takes the ember's colour from underneath
    col = mix(col, cc, cl*0.82);
  }
  // the cluster: unresolved glow and a dust of faint points that thickens where the glow is strong
  if (uNightP.x > 0.001) {
    vec3 g = nightGlow(d);
    col += g;
    vec2 sp = p*118.0, ci = floor(sp), cf = fract(sp) - 0.5;
    float h = sH(ci);
    vec2 off = (vec2(sH(ci + 7.1), sH(ci + 3.7)) - 0.5)*0.56;
    float star = smoothstep(0.5, 1.0, h)*exp(-dot(cf - off, cf - off)*52.0);
    float tw = 0.8 + 0.2*sin(uNightP.z*(2.0 + 4.0*h) + h*40.0);
    col += (vec3(0.6, 0.72, 1.0)*0.2 + g*5.0)*(star*tw*uNightP.x*skyWave(d)*smoothstep(-0.01, 0.12, y));
  }
  // the far city burning: a crimson glow low on one bearing
  if (uCity.z > 0.001) {
    vec2 hd = d.xz/max(length(d.xz), 1e-4);
    float da = acos(clamp(dot(hd, uCity.xy), -1.0, 1.0));
    float yy = max(y, 0.0), r2 = da*da + yy*yy*1.5, w = 0.004 + 0.013*uCity.z;      // (the glow widens and climbs as the fire spreads through the town)
    float gl = 0.9*exp(-r2/w) + 0.5*exp(-r2/(w*8.0)) + 0.2*exp(-sqrt(max(r2, 0.0))/0.28);
    col += vec3(0.85, 0.1, 0.03)*(gl*uCity.z*uCity.w*0.7);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export function makeSkyDome(rng, clock, cluster, o = {}) {
  const U = {
    ...nightUniforms(rng, clock, cluster),
    uZen: { value: clock.zen }, uHor: { value: clock.hor },
    uSunDir: { value: clock.suns.map((s) => s.dir) }, uSunCol: { value: clock.suns.map((s) => s.disc) },
    uSunP: { value: clock.suns.map((s) => new THREE.Vector4(s.r * D2R, 0.2, 0.03, 1)) }, uSunTint: { value: clock.suns.map((s) => s.tint) },
    uBody: { value: new THREE.Vector4(0.3, 0.3, -0.9, 9 * D2R) }, uCity: { value: new THREE.Vector4(0.5, -0.86, 0, 1) },
    uAA: { value: 0.002 }, uCloud: { value: new THREE.Vector4(o.cloud?.amount ?? 0, o.cloud?.ox ?? 0, o.cloud?.oz ?? 0, 0) }, uCirrus: { value: 0 }, uAur: { value: 0 }, uDusk: { value: new THREE.Vector4(0, 0.5, -0.86, 1) }, uBead: { value: 0 }, uLit: { value: new THREE.Vector4(0, 1, 0, 0.03) },
  };
  const geo = new THREE.SphereGeometry(1, 48, 24);
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: DOME_VS, fragmentShader: DOME_FS, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false });
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = -10; mesh.frustumCulled = false;
  const cirrus = o.cirrus ?? 0;
  const _e = new THREE.Vector3();
  return {
    object: mesh, uniforms: U,
    // st: the clock's state; pxAngle: the angle one pixel covers (radians); time: world clock
    update(st, pxAngle, time) {
      for (let i = 0; i < 6; i++) {
        const s = st.suns[i], P = U.uSunP.value[i], w = i === 5 ? st.frac : 1, up = sstep(-2.5, 1.5, s.el);
        P.y = 0.22 * (i === 5 ? Math.max(Math.sqrt(w), 0.4 * sstep(0, 0.05, st.thick)) : 1) * up; P.z = (i === 5 ? 0.42 : i === 4 ? 0.62 : i < 2 ? 0.6 : 0.25) * Math.pow(w, 0.7) * sstep(-7, 1.5, s.el); P.w = s.sky;
      }
      U.uBody.value.set(st.bodyDir.x, st.bodyDir.y, st.bodyDir.z, st.bodyR * D2R);
      { const sun = st.suns[5].dir, b = st.bodyDir, k = sun.dot(b), off = (1.8 - st.thick * 0.5) * D2R;      // the middle of the sliver: off the disc's centre, away from the dark body
        _e.copy(sun).addScaledVector(b, -k); const el = _e.length(); if (el > 1e-5) _e.multiplyScalar(Math.tan(off) / el); else _e.set(0, 0, 0);
        _e.add(sun).normalize(); U.uLit.value.set(_e.x, _e.y, _e.z, Math.max(st.thick, 0.02) * 0.5 * D2R); }
      U.uAA.value = Math.max(pxAngle * 0.75, 1e-4);
      U.uNightP.value.x = st.night; U.uNightP.value.y = 0.4 * st.crowd + 0.6 * st.swell; U.uNightP.value.z = time; U.uAur.value = st.aur; U.uDusk.value.set(st.dusk, U.uCity.value.x, U.uCity.value.y, st.trem); U.uBead.value = 1 - sstep(0.15, 0.6, st.thick);
      U.uCirrus.value = cirrus * (1 - sstep(0.3, 0.92, st.ecl));      // the high cloud goes with the red light
      U.uCloud.value.w = (o.cloud ? 1 : 0) * (1 - sstep(0.3, 0.92, st.ecl));      // and so does the low cloud
    },
  };
}

// ---------------------------------------------------------------- the resolved stars
const STAR_VS = (mirror, landGLSL) => /* glsl */`
${mirror ? landGLSL : ''}
attribute vec3 aDir, aCol;
attribute vec4 aP;          // half size (px at the reference height), phase, twinkle, big
attribute float aRank;      // 0 the brightest .. 1 the faintest
uniform float uFirst;       // how far down the ranks the stars have come out in the first moment after the snap, before the wave
uniform vec3 uDeath;
uniform vec4 uStarP;        // how far the stars have come (0 none .. 1.25 all out .. 1.75 after the swell), time, px scale, least half size (px)
uniform vec2 uRes;
uniform vec4 uLake;         // level, strength, -, -
varying vec2 vQ; varying vec3 vCol; varying float vBig;
void main(){
  float ang = acos(clamp(dot(aDir, uDeath), -1.0, 1.0));
  // all over the sky at once: a star comes out by its rank (the brightest first), sooner the nearer it stands to where the sun died (so the sky is
  // thickest toward the heart from the first), each a little early or late; no front crosses the sky and nothing grows from one spot
  float t = (uStarP.x - aRank*(0.45 + 0.55*(1.0 - exp(-min(ang*ang/0.7, 40.0)))) - 0.12*fract(aP.y*13.7 + aRank*5.3))/0.1;
  float sw = clamp((uStarP.x - 1.25)/0.5, 0.0, 1.0);                          // the swell: when the torch falls the Stars seem nearer
  float on = max(smoothstep(0.0, 1.0, t), 0.85*smoothstep(0.0, 0.004, uFirst - aRank));
  float over = 1.0 + 0.5*exp(-(t - 1.3)*(t - 1.3)*1.4)*smoothstep(0.0, 1.0, t);                 // each star overshoots and settles
  float lowk = 1.0 + 1.5*(1.0 - smoothstep(0.02, 0.4, aDir.y));               // more twinkle near the horizon
  float tw = 1.0 + min(aP.z*lowk, 0.45)*sin(uStarP.y*(1.5 + 5.0*fract(aP.y*7.31)) + aP.y*43.0);
  float amp = on*over*tw*mix(1.0, 0.62 + 0.38*sw, smoothstep(0.02, 0.1, aRank))*smoothstep(-0.005, 0.07, aDir.y);      // (the brightest stand at their full value from the first; it is the crowd that deepens)
  float hp = max(uStarP.w, aP.x*uStarP.z*mix(0.45, 1.0, smoothstep(0.0, 1.6, t)));
  vec2 q = position.xy;
${mirror ? `
  vec3 cam = cameraPosition; float hy = max(cam.y - uLake.x, 0.5);
  float tt = hy/max(aDir.y, 0.012);
  vec3 P = cam + vec3(aDir.x, -aDir.y, aDir.z)*tt;
  // This is WATER, not a second sky. (1) Water mirrors a low star well and a high one poorly: the higher the star, the steeper we look down at its
  // image and the less of it comes back, so the images near the far shore are the bright ones and the water under us is dark. (2) The cold wind
  // ruffles the lake in drifting patches, and there the images are scattered. (3) Over the shallows by the shore nothing mirrors. (4) Ripples draw
  // every image out into a streak toward the eye.
  float ruf = sin(P.x*0.011 + uStarP.y*0.021 + 1.3*sin(P.z*0.007 - uStarP.y*0.013))*sin(P.z*0.0083 + uStarP.y*0.017 + 1.1*sin(P.x*0.0061)) + 0.25*sin(P.x*0.037 - P.z*0.029 + uStarP.y*0.05);
  float calm = smoothstep(-0.25, 0.35, ruf);
  float rp = (0.3 + 0.004*tt)*(2.2 - 1.2*calm);
  P.xz += vec2(sin(P.z*0.37 + uStarP.y*1.7 + aP.y*20.0), cos(P.x*0.31 + uStarP.y*1.3 + aP.y*33.0))*rp;
  P.y = uLake.x;
  float gr = 1.0 - clamp(aDir.y, 0.0, 1.0);
  amp *= uLake.y*(0.14 + 0.66*gr*gr*gr)*(0.3 + 0.7*calm)*smoothstep(0.25, 4.2, uLake.x - landH(P.xz))*(1.0 - smoothstep(3500.0, 5500.0, tt));
  vec4 c = projectionMatrix*viewMatrix*vec4(P, 1.0);
  if (abs(c.w) < 1e-4) c.w = 1e-4;
  // the ripples draw each image out 4.6 times its width ALONG THE WATER, toward the eye's place (not along the picture's upright): the place one
  // metre nearer the eye on the water is projected too, and the image is built along the line between the two
  vec2 toEye = cam.xz - P.xz; toEye /= max(length(toEye), 1e-3);
  vec4 c2 = projectionMatrix*viewMatrix*vec4(P + vec3(toEye.x, 0.0, toEye.y), 1.0);
  if (abs(c2.w) < 1e-4) c2.w = 1e-4;
  vec2 ax = (c2.xy/c2.w - c.xy/c.w)*uRes; float axl = length(ax);
  ax = axl > 1e-4 ? ax/axl : vec2(0.0, -1.0);
  c.xy += (vec2(ax.y, -ax.x)*q.x + ax*(q.y*4.6))*(hp*0.62*2.0*c.w*step(0.002, amp))/uRes;      // (across, then along: the card keeps its facing)
` : `
  vec4 c = projectionMatrix*vec4(mat3(viewMatrix)*aDir, 1.0);
  if (abs(c.w) < 1e-4) c.w = 1e-4;
  c.xy += q*hp*2.0/uRes*c.w*step(0.002, amp);
  c.z = c.w;
`}
  gl_Position = c; vQ = position.xy; vCol = aCol*amp; vBig = aP.w;
}`;
const STAR_FS = /* glsl */`
varying vec2 vQ; varying vec3 vCol; varying float vBig;
void main(){
  float r2 = clamp(dot(vQ, vQ), 0.0, 4.0), r = sqrt(r2);
  float small = max(exp(-r2*4.2) - 0.015, 0.0);
  float big = exp(-r2*26.0) + 0.085*pow(max(1.0 - r, 0.0), 2.6);
  gl_FragColor = vec4(vCol*mix(small, big, vBig), 1.0);
}`;

export async function makeStars(rng, clock, cluster, o = {}) {
  const N = o.count ?? 30000, NM = o.mirror ?? 6000, landGLSL = o.landGLSL || 'float landH(vec2 p){ return -9.0; }';
  const dirs = new Float32Array(N * 3), cols = new Float32Array(N * 3), ps = new Float32Array(N * 4), mag = new Float32Array(N);
  const heart = cluster.heart, right = new THREE.Vector3().crossVectors(heart, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(right, heart).normalize();
  const d = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), Yv = new THREE.Vector3(0, 1, 0);
  const around = (r, c, sig, out) => {
    a.crossVectors(c, Yv); if (a.lengthSq() < 1e-6) a.set(1, 0, 0); a.normalize(); b.crossVectors(a, c).normalize();
    // (its two gaussian draws are its offset in radians of arc: the distance on the sky is their length, unclamped, so the fall-off has no edge)
    const gx = r.gauss() * sig, gy = r.gauss() * sig, rho = Math.hypot(gx, gy), k = rho > 1e-6 ? Math.sin(rho) / rho : 1;
    return out.copy(c).multiplyScalar(Math.cos(rho)).addScaledVector(a, gx * k).addScaledVector(b, gy * k).normalize();
  };
  let cw = 0; for (const c of cluster.clots) cw += c.amp * c.sigma * c.sigma;
  const blue = o.blue ?? 0.55;      // the colour mix: more blue-white or more golden
  const PAL = [[new THREE.Color('#b4ccff'), blue], [new THREE.Color('#fff3e2'), 0.2], [new THREE.Color('#ffcf86'), (1 - blue - 0.2) * 0.5], [new THREE.Color('#ff9468'), (1 - blue - 0.2) * 0.3], [new THREE.Color('#ff6f5e'), (1 - blue - 0.2) * 0.2]];
  // Three populations from the stars' own stream (the heart, the clots, the whole vault: 45, 20 and 35 in a hundred), four fifths of all the stars; then
  // a fourth, from a stream of its own and appended after them: a wide fall-off round the heart (36 degrees), so the blaze has no edge.
  let n = 0;
  const deal = async (r, upto, wide) => {
    let guard = 0;
    while (n < upto && guard++ < N * 6) {
      if ((guard & 4095) === 0 && o.yieldFn) await o.yieldFn();
      if (wide) around(r, heart, 36 * D2R, d);
      else { const pop = r();
        if (pop < 0.45) around(r, heart, (r() < 0.3 ? 6 : 14) * D2R, d);
        else if (pop < 0.65) { let pick = r() * cw, c = cluster.clots[0]; for (const q of cluster.clots) { pick -= q.amp * q.sigma * q.sigma; if (pick <= 0) { c = q; break; } } around(r, c.dir, c.sigma * 1.1, d); }
        else { const y = -0.04 + 1.04 * r(), ph = r() * 6.2832, rr = Math.sqrt(Math.max(0, 1 - y * y)); d.set(Math.cos(ph) * rr, y, Math.sin(ph) * rr); } }
      const lane = r(), m = Math.pow(r(), 7), colPick = r(), ph1 = r(), tw1 = r();      // (a star takes all its draws before the horizon and the lanes are asked; brightness on a power law: most are faint)
      if (d.y < -0.04 || lane > 0.08 + 0.92 * cluster.laneAt(d)) continue;      // below the land; thinned by the dust lanes
      dirs[n * 3] = d.x; dirs[n * 3 + 1] = d.y; dirs[n * 3 + 2] = d.z; mag[n] = m;
      let pc = colPick, col = PAL[0][0]; for (const q of PAL) { pc -= q[1]; if (pc <= 0) { col = q[0]; break; } }
      const hd = Math.acos(Math.max(-1, Math.min(1, d.dot(heart)))), I = (0.2 + 2.6 * Math.sqrt(m)) * (1 - 0.55 * Math.exp(-hd * hd / 0.06));      // where they crowd each is fainter: the heart keeps its grain
      cols[n * 3] = col.r * I; cols[n * 3 + 1] = col.g * I; cols[n * 3 + 2] = col.b * I;
      ps[n * 4] = 0.9 + 0.9 * Math.sqrt(m); ps[n * 4 + 1] = ph1; ps[n * 4 + 2] = 0.1 + 0.15 * tw1; ps[n * 4 + 3] = 0;
      n++;
    }
  };
  await deal(rng, o.wide ? Math.round(N * 0.8) : N, false);
  if (o.wide) await deal(o.wide, N, true);
  // the 250 brightest: three times larger, with a soft round halo
  const order = Array.from({ length: n }, (_, i) => i).sort((i, j) => mag[j] - mag[i]);
  for (let k = 0; k < Math.min(o.bright ?? 250, n); k++) {
    const i = order[k], g = 1.0 + 0.7 * (1 - k / 250);
    ps[i * 4] *= 3; ps[i * 4 + 3] = 1; cols[i * 3] *= g; cols[i * 3 + 1] *= g; cols[i * 3 + 2] *= g;
  }
  const rank = new Float32Array(n); order.forEach((i, k) => { rank[i] = k / Math.max(1, n - 1); });
  const quad = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), idx = [0, 1, 2, 0, 2, 3];
  const U = { uFirst: { value: 0 }, uDeath: { value: clock.deathDir }, uStarP: { value: new THREE.Vector4(-1, 0, 1, 1.05) }, uRes: { value: new THREE.Vector2(800, 450) }, uLake: { value: new THREE.Vector4(o.lakeY ?? 0, 0.6, 0, 0) } };
  const build = (count, pick, mirror) => {
    const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(quad, 3)); g.setIndex(idx);
    let D = dirs, C = cols, P = ps, R = rank;
    if (pick) { D = new Float32Array(count * 3); C = new Float32Array(count * 3); P = new Float32Array(count * 4); R = new Float32Array(count); pick.forEach((i, k) => { R[k] = rank[i]; D.set(dirs.subarray(i * 3, i * 3 + 3), k * 3); C.set(cols.subarray(i * 3, i * 3 + 3), k * 3); P.set(ps.subarray(i * 4, i * 4 + 4), k * 4); }); }
    g.setAttribute('aDir', new THREE.InstancedBufferAttribute(D.subarray(0, count * 3), 3)); g.setAttribute('aCol', new THREE.InstancedBufferAttribute(C.subarray(0, count * 3), 3)); g.setAttribute('aP', new THREE.InstancedBufferAttribute(P.subarray(0, count * 4), 4)); g.setAttribute('aRank', new THREE.InstancedBufferAttribute(R.subarray(0, count), 1));
    g.instanceCount = count;
    const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader: STAR_VS(mirror, landGLSL), fragmentShader: STAR_FS, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, fog: false });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = mirror ? -3 : -5;
    return mesh;
  };
  const stars = build(n, null, false);
  // the reflections: the brightest, and a share of the rest that stand high enough to fall on the lake
  const pick = []; for (let k = 0; k < n && pick.length < NM; k++) { const i = order[k]; if (dirs[i * 3 + 1] > 0.02 && dirs[i * 3 + 2] < 0.2) pick.push(i); }
  const mirror = build(pick.length, pick, true);
  return {
    object: stars, mirror, uniforms: U, count: n,
    update(st, time, renderer, size) {
      U.uStarP.value.x = st.wave; U.uStarP.value.y = time; U.uFirst.value = 0.05 * st.first;      // (the brightest twentieth, some 1,500: out over the whole sky as the thread goes)
      if (renderer) { renderer.getDrawingBufferSize(size); U.uRes.value.copy(size); U.uStarP.value.z = Math.pow(Math.max(size.y, 200) / 450, 0.62); }
      U.uLake.value.y = 0.6 * st.night;
      const lit = st.first > 0; stars.geometry.instanceCount = lit ? n : 0; mirror.geometry.instanceCount = lit ? pick.length : 0;
    },
  };
}

// ---------------------------------------------------------------- the lake: a mirror of the dome
const LAKE_VS = /* glsl */`
varying vec3 vW;
void main(){ vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const LAKE_FS = (landGLSL) => /* glsl */`
${landGLSL}
${SKY_NIGHT_GLSL}
${SKY_DAY_GLSL}
varying vec3 vW;
uniform vec3 uFogCol, uWater;
uniform vec4 uCity;
uniform float uFogDen, uLakeY;
float sH2(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.x); }
void main(){
  vec3 V = vW - cameraPosition; float dist = length(V); V /= max(dist, 1e-3);
  vec2 q = vW.xz; float tt = uNightP.z;
  vec2 n1 = texture2D(tSkyNoise, q*0.011 + vec2(tt*0.011, tt*0.006)).rg - 0.5;
  vec2 n2 = texture2D(tSkyNoise, q*0.043 - vec2(tt*0.021, -tt*0.015)).gb - 0.5;
  float k = 1.0/(1.0 + dist*0.0016);
  // cat's-paws: the cold wind ruffles the lake in drifting patches, and there the mirror breaks into a shimmer
  float paw = smoothstep(0.42, 0.7, texture2D(tSkyNoise, q*0.0019 + vec2(tt*0.0016, tt*0.0006)).r*0.65 + texture2D(tSkyNoise, q*0.0061 + vec2(tt*0.004, -tt*0.0011)).g*0.35);
  vec2 n3 = texture2D(tSkyNoise, q*0.13 + vec2(tt*0.05, tt*0.031)).rb - 0.5;
  k *= 1.0 + 1.6*paw;
  // ripple rings: here and there a fish rises, and a ring widens from the place and dies (one place in each 70 m of water, on the world's clock)
  vec2 rc = floor(q/70.0), rf = fract(q/70.0) - 0.5; float rh = sH2(rc);
  vec2 ro = rf - (vec2(sH2(rc + 3.7), sH2(rc + 9.1)) - 0.5)*0.5; float rr = length(ro)*70.0, age = fract(tt*0.09 + rh*7.0);
  float ring = sin((rr - age*24.0)*1.3)*exp(-abs(rr - age*24.0)*0.22)*(1.0 - age)*step(0.5, rh);
  vec2 rdir = ro/max(length(ro), 1e-3);
  vec3 N = normalize(vec3((n1.x*0.11 + n2.x*0.07)*k + n3.x*0.16*paw + rdir.x*ring*0.22, 1.0, (n1.y*0.11 + n2.y*0.07)*k + n3.y*0.16*paw + rdir.y*ring*0.22));
  vec3 R = reflect(V, N); R.y = abs(R.y) + 0.004; R = normalize(R);
  vec3 sky = daySky(R);
  sky += nightGlow(R)*0.72;                                                 // (water gives back less than it is shown)
  vec2 hd = R.xz/max(length(R.xz), 1e-4);
  float da = acos(clamp(dot(hd, uCity.xy), -1.0, 1.0));
  float sk = texture2D(tSkyNoise, vec2(da*7.0, dist*0.0045 - tt*0.035)).r*0.6 + texture2D(tSkyNoise, vec2(da*19.0 + 0.3, dist*0.011 - tt*0.06)).g*0.4;
  float streak = smoothstep(0.42, 0.78, sk)*(0.75 + 0.25*sin(tt*3.1 + sk*20.0));
  sky += vec3(0.85, 0.1, 0.03)*(exp(-da*da/(0.0025 + 0.005*uCity.z))*exp(-R.y/0.2)*streak*uCity.z*uCity.w*1.7);      // the fire's road on the water
  float fres = 0.05 + 0.95*pow(1.0 - clamp(-V.y, 0.0, 1.0), 4.0);
  vec3 col = mix(uWater*(uZen + uHor), sky, fres);
  float depth = uLakeY - landH(q);
  float a = smoothstep(0.0, 0.6, depth);
  col *= 0.4 + 0.6*smoothstep(0.3, 4.4, depth);                           // the shallows by the shore are dark: mud and weed show through
  float f = 1.0 - exp(-uFogDen*uFogDen*dist*dist);
  col = mix(col, uFogCol, clamp(f, 0.0, 1.0));
  gl_FragColor = vec4(col, a);
}`;

export function makeLakeMirror(dome, o = {}) {
  const b = o.bounds || [-1800, -2700, 2600, -470], lakeY = o.lakeY ?? 0;
  const g = new THREE.PlaneGeometry(b[2] - b[0], b[3] - b[1], 8, 8); g.rotateX(-Math.PI / 2); g.translate((b[0] + b[2]) / 2, lakeY, (b[1] + b[3]) / 2);
  const D = dome.uniforms;
  const U = { tSkyNoise: D.tSkyNoise, uHeart: D.uHeart, uDeath: D.uDeath, uClot: D.uClot, uClotA: D.uClotA, uLane: D.uLane, uLaneOff: D.uLaneOff, uNightP: D.uNightP,
    uZen: D.uZen, uHor: D.uHor, uSunDir: D.uSunDir, uSunCol: D.uSunCol, uSunP: D.uSunP, uSunTint: D.uSunTint, uCity: D.uCity, uAur: D.uAur, uDusk: D.uDusk, uLit: D.uLit,
    uFogCol: { value: o.fogColor || new THREE.Color() }, uFogDen: { value: o.fogDensity ?? 0.00035 }, uWater: { value: new THREE.Color(0.05, 0.07, 0.09) }, uLakeY: { value: lakeY } };
  const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader: LAKE_VS, fragmentShader: LAKE_FS(o.landGLSL || 'float landH(vec2 p){ return -9.0; }'), transparent: true, depthWrite: false, fog: false });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = -4;
  return { object: mesh, uniforms: U };
}

// ---------------------------------------------------------------- the river's glitter: the suns' roads of light on moving water
const GLIT_FS = (landGLSL) => /* glsl */`
${landGLSL}
${SKY_NIGHT_GLSL}
varying vec3 vW;
uniform vec3 uSunDir[6];
uniform vec3 uSunCol[6];
uniform vec4 uSunP[6];
uniform float uFogDen, uLevel;
void main(){
  vec2 q = vW.xz;
  float a = smoothstep(0.05, 0.55, uLevel - landH(q));
  vec3 V = vW - cameraPosition; float dist = length(V); V /= max(dist, 1e-3);
  float tt = uNightP.z;
  vec2 n1 = texture2D(tSkyNoise, q*vec2(0.0031, 0.0052) + vec2(-tt*0.0041, tt*0.0006)).rg - 0.5;
  vec2 n2 = texture2D(tSkyNoise, q*vec2(0.011, 0.017) + vec2(-tt*0.011, -tt*0.0017)).gb - 0.5;
  vec2 n3 = texture2D(tSkyNoise, q*vec2(0.037, 0.051) + vec2(-tt*0.03, tt*0.004)).br - 0.5;
  vec3 N = normalize(vec3(n1.x*0.2 + n2.x*0.3 + n3.x*0.22, 1.0, n1.y*0.2 + n2.y*0.3 + n3.y*0.22));
  vec3 R = reflect(V, N); R.y = abs(R.y) + 0.002; R = normalize(R);
  vec3 col = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float r = uSunP[i].x*1.5 + 0.014;
    float spark = smoothstep(cos(r*2.4), cos(r*0.7), dot(R, uSunDir[i]));
    col += uSunCol[i]*(spark*min(uSunP[i].y*7.0, 1.0));
  }
  // loose glints either side of each road: single facets that catch a sun for a moment as the water runs
  float g1 = texture2D(tSkyNoise, q*vec2(0.0075, 0.013) + vec2(-tt*0.016, tt*0.003)).r, g2 = texture2D(tSkyNoise, q*vec2(0.0043, 0.0085) + vec2(-tt*0.0105, -tt*0.004)).g;
  float glint = smoothstep(0.5, 0.8, g1*g2*2.0);
  vec2 vh = V.xz/max(length(V.xz), 1e-4);
  for (int i = 0; i < 6; i++) {
    vec2 sh = uSunDir[i].xz/max(length(uSunDir[i].xz), 1e-4);
    float toward = max(dot(vh, sh), 0.0);
    col += uSunCol[i]*(glint*(0.25 + 0.75*toward*toward)*0.55*min(uSunP[i].y*7.0, 1.0));
  }
  col += nightGlow(R)*1.3;
  float fres = 0.3 + 0.7*pow(1.0 - clamp(-V.y, 0.0, 1.0), 3.0);
  gl_FragColor = vec4(col*(fres*a*exp(-uFogDen*uFogDen*dist*dist)), 1.0);
}`;
export function makeGlitter(dome, o = {}) {
  const b = o.bounds || [-900, -80, 900, 8], y = o.level ?? -1.1;
  const g = new THREE.PlaneGeometry(b[2] - b[0], b[3] - b[1], 1, 1); g.rotateX(-Math.PI / 2); g.translate((b[0] + b[2]) / 2, y + 0.06, (b[1] + b[3]) / 2);
  const D = dome.uniforms;
  const U = { tSkyNoise: D.tSkyNoise, uHeart: D.uHeart, uDeath: D.uDeath, uClot: D.uClot, uClotA: D.uClotA, uLane: D.uLane, uLaneOff: D.uLaneOff, uNightP: D.uNightP,
    uSunDir: D.uSunDir, uSunCol: D.uSunCol, uSunP: D.uSunP, uFogDen: { value: o.fogDensity ?? 0.00035 }, uLevel: { value: y } };
  const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader: LAKE_VS, fragmentShader: GLIT_FS(o.landGLSL || 'float landH(vec2 p){ return -9.0; }'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 2;
  return { object: mesh, uniforms: U };
}
