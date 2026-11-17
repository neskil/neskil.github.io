// THE FLINCHING FOREST: a plateau forested crown to crown with spiral crimson plume-worms on ivory tubes,
// which screw down out of sight wherever a shadow touches them. Every cloud shadow crosses the land as a
// clearing of bare white pipes through a country of red, healing slowly behind.
//
// Conventions: +Z is ahead at entry, +X is on the LEFT of the entry view (so the brief's "west" is +X here:
// its coordinates are mirrored in x so that the Spire sits right of the bow and the sun on the left).
// THE ROUTE: one line, 1,100 m, with the Twin Spire ahead of the bow from the first frame to the last. In high (65 m over the crowns)
// so that the first picture holds cause and effect: one low cumulus and, under it, its shadow sliding across the quilt as a dark oval
// of bare pipes; the gaze drops onto it by u 0.08. Then down into a hollow of short pipes that small cloud shadows cross on the
// engine's own clock (the "train" in SHADE), so that at any moment there a line of sun and shade lies on the floor with open plumes
// on one side, bare pipes on the other and half-screwed ones between (the train is slow, 4.5 m/s, and its plumes take six seconds to
// wind down, so a band of several ranks is always part-way); up over the crowns to a wide view from 50 m above them while a flight
// of skysails crosses the bow, then a 300 m rising approach straight at the ring in the Spire's broad south face while the
// Follower's shade climbs it and the two great plumes screw down (mid-corkscrew when the ring is 145 m ahead). Nothing depends on a
// point of interest to keep the hero in frame. The brief's u values (written for an older, longer route) are rescaled with uo();
// the finale is keyed to the distance left to the ring with ud().
// ONE SHADOW FUNCTION: the GLSL chunk SHADE below (shade(xz, seed) -> (S, R)) is included by every forest
// shader; its sources (cloud ellipses, a mackerel lattice, skysail discs, the rare veil) are uniforms set from
// the path progress u; only the hollow's train of small shadows runs on the clock. shadeJS() is its line-for-line port for the CPU.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, heroKit } from '../parts/flinching-forest.js';

const TAU = Math.PI * 2;
const L_OLD = 1676;                    // length of the first route: its u values (the brief's) are rescaled by KU below
const NCL = 11, NDISC = 24;
// The hoop faces south (local +Z = world -Z): the whole second half of the flight runs straight at it.
const SPIRE = new THREE.Vector3(-40, 0, 1060), SPIRE_ROT = Math.PI;

// palettes in the brief's order: ivory, crimson (tips), coral (cores), gold, jade, teal, mint
const LOOKS = [
  { key: 'crimson', pal: ['#E4DCCB', '#D8283A', '#E66E58', '#F6C453', '#7FD1C2', '#17414A', '#DDF3EE'],
    zenith: '#4FB5A4', mid: '#7FD1C2', horizon: '#DDF3EE', fill: '#8FD6C8', sun: '#FFF4DA',
    sand: '#D6CCB6', pool: '#3FA890', cloudTop: '#FFF6E2', cloudBase: '#7FA69C', glowA: [0.95, 0.30, 0.09], glowB: [0.85, 0.07, 0.04] },
  { key: 'saffron', pal: ['#E9E1CF', '#C4237C', '#F0A030', '#FFE08A', '#B7A8E6', '#3A2A5E', '#EDE6FA'],
    wine: '#6A1048', zenith: '#8F7FD6', mid: '#B9ABE8', horizon: '#EFE7FA', fill: '#B4A6E8', sun: '#FFF0D2',
    sand: '#DCD0BC', pool: '#7C6CC8', cloudTop: '#FFF4E6', cloudBase: '#8C82B4', glowA: [1.0, 0.55, 0.10], glowB: [0.9, 0.10, 0.35] },
  { key: 'indigo', pal: ['#E8C6C0', '#6258DC', '#F4D9EF', '#FFD27A', '#F0CC8E', '#5A2E48', '#FBF1DC'],
    wine: '#6C68C4', zenith: '#DFAA60', mid: '#EFCB8C', horizon: '#FBEFD4', fill: '#DCC2D0', sun: '#FFF6E6',
    core: 0.55, sand: '#E6D2BE', pool: '#6E78B8', cloudTop: '#FFF8EA', cloudBase: '#94708C', glowA: [0.95, 0.85, 0.80], glowB: [0.50, 0.42, 1.0] },
];

// ---- the one shadow function (GLSL) ---------------------------------------------------------------------------
const SHADE = /* glsl */`
  uniform vec4 uClA[${NCL}];      // centre x, centre z, half-length along the wind, half-width across it
  uniform vec4 uClB[${NCL}];      // seed, speed m/s, heal time s, strength 0-1
  uniform vec4 uDisc[${NDISC}];   // skysail shadow: x, z, heading x, heading z (speed 14 m/s, radius 4 m)
  uniform vec4 uLat;              // mackerel lattice: cell length, cell width, offset along the wind, strength
  uniform vec2 uWindDir;
  uniform float uVeil;            // rare event: the whole plateau half-closes in one breath
  uniform vec4 uTr;               // the hollow's own train of small cloud shadows: cell length, cell width, offset along the wind (from the clock), strength
  uniform vec4 uTrSeg;            // the hollow's axis (a.xz, b.xz); the train lives within uTrRad of it
  uniform vec3 uTrRad;            // inner radius, outer radius, speed m/s
  float healF(float t) { t = clamp(t, 0., 1.); return clamp(t * t * (3. - 2. * t) + 0.09 * sin(9. * t) * (1. - t), 0., 1.); }
  // q: position in the source's frame (x downwind, y across). Returns (S mask, R).
  vec3 shadeSrc(vec2 q, float a, float b, float speed, float healT, float seed, float delay, float tclose, float soft, float lin) {
    float y = q.y / max(b, 1.);
    if (abs(y) >= 1.) return vec3(0.);
    float wob = 1. + 0.16 * sin(q.y * 0.031 + seed * 17.) + 0.08 * sin(q.y * 0.083 + seed * 5.);   // crosswind only: a rigid outline
    float e = sqrt(max(0., 1. - y * y)) * wob;
    float x = q.x / max(a, 1.);
    float k = a / max(speed, 1.);
    float tin = max(0., (e - x) * k - delay);
    float tout = max(0., (-e - x) * k - delay);
    float rc = clamp(tin / max(tclose, 0.05), 0., 1.);
    float R = mix(rc * rc * (3. - 2. * rc), rc, lin) * (1. - healF(tout / max(healT, 0.1))) * smoothstep(0., 0.3, e);
    float S = smoothstep(-soft, soft, min((e - abs(x)) * a, (1. - abs(y)) * b - soft));
    float px = (tin - tclose) / 1.5;
    return vec3(S, R, smoothstep(0., 0.25, px) * (1. - smoothstep(0.45, 1., px)) * smoothstep(0., 0.3, e));
  }
  vec3 shade(vec2 p, float seed) {
    float S = 0., R = 0., Pf = 0.;
    float delay = 0.15 * fract(seed * 7.31);
    vec2 wp = vec2(-uWindDir.y, uWindDir.x);
    for (int i = 0; i < ${NCL}; i++) {
      vec4 A = uClA[i], B = uClB[i];
      if (B.w <= 0.) continue;
      vec2 d = p - A.xy;
      vec3 r = shadeSrc(vec2(dot(d, uWindDir), dot(d, wp)), A.z, A.w, B.y, B.z, B.x, delay, 0.8, 4., 0.);
      S = max(S, r.x * B.w); R = max(R, r.y * B.w); Pf = max(Pf, r.z * B.w);
    }
    if (uLat.w > 0.) {
      vec2 q = vec2(dot(p, uWindDir) - uLat.z, dot(p, wp));
      float row = floor(q.y / uLat.y + 0.5);
      float qx = q.x + fract(row * 0.37) * uLat.x;
      float c0 = floor(qx / uLat.x + 0.5);
      for (int j = 0; j < 2; j++) {
        float c = c0 + float(j);
        float h = fract(sin(c * 12.9898 + row * 78.233) * 43758.5453);
        if (h < 0.22) continue;
        vec2 l = vec2(qx - (c + (h - 0.6) * 0.3) * uLat.x, q.y - (row + (fract(h * 9.7) - 0.5) * 0.25) * uLat.y);
        vec3 r = shadeSrc(l, uLat.x * (0.2 + 0.14 * fract(h * 5.3)), uLat.y * (0.3 + 0.12 * fract(h * 3.1)), 50., 3., h * 9., delay, 0.8, 5., 0.);
        S = max(S, r.x * uLat.w); R = max(R, r.y); Pf = max(Pf, r.z);
      }
    }
    if (uTr.w > 0.) {
      vec2 sd = uTrSeg.zw - uTrSeg.xy;
      float st = clamp(dot(p - uTrSeg.xy, sd) / max(dot(sd, sd), 1.), 0., 1.);
      if (length(p - uTrSeg.xy - sd * st) < uTrRad.y + 90.) {
        vec2 q = vec2(dot(p, uWindDir) - uTr.z, dot(p, wp));
        float row = floor(q.y / uTr.y + 0.5);
        float qx = q.x + fract(row * 0.37) * uTr.x;
        float c0 = floor(qx / uTr.x + 0.5);
        for (int j = 0; j < 2; j++) {
          float c = c0 + float(j);
          float h = fract(c * 0.618034 + row * 0.754878 + 0.31);      // exact in single precision, so every machine draws the same train
          vec2 cen = vec2((c + (h - 0.5) * 0.2) * uTr.x, (row + (fract(h * 9.7) - 0.5) * 0.2) * uTr.y);
          vec2 l = vec2(qx - cen.x, q.y - cen.y);
          // the cloud thins away as it drifts out of the hollow
          vec2 cw = uWindDir * (cen.x - fract(row * 0.37) * uTr.x + uTr.z) + wp * cen.y;
          float ct = clamp(dot(cw - uTrSeg.xy, sd) / max(dot(sd, sd), 1.), 0., 1.);
          float kk = (1. - smoothstep(uTrRad.x, uTrRad.x + 22., length(cw - uTrSeg.xy - sd * ct))) * uTr.w;
          if (kk <= 0.) continue;
          vec3 r = shadeSrc(l, uTr.x * (0.26 + 0.05 * fract(h * 5.3)), uTr.y * (0.38 + 0.07 * fract(h * 3.1)), uTrRad.z, 6.5, h * 9., delay * 13., 6., 1.1, 1.);
          S = max(S, r.x * kk); R = max(R, r.y * kk); Pf = max(Pf, r.z * kk);
        }
      }
    }
    for (int i = 0; i < ${NDISC}; i++) {
      vec4 D = uDisc[i];
      vec2 d = p - D.xy;
      if (dot(d, d) > 6400.) continue;
      vec3 r = shadeSrc(vec2(dot(d, D.zw), dot(d, vec2(-D.w, D.z))), 4.5, 4.5, 14., 4., 0.3, delay, 0.8, 4., 0.);
      S = max(S, r.x * 0.8); R = max(R, r.y); Pf = max(Pf, r.z * 0.6);
    }
    R = max(R, 0.45 * uVeil); S = max(S, 0.6 * uVeil);
    return vec3(0.85 * S, R, Pf);
  }
`;

// ---- the same function on the CPU (clouds only: enough for scripting, light and the cast) -----------------------
const healJS = (t) => { t = clamp(t, 0, 1); return clamp(t * t * (3 - 2 * t) + 0.09 * Math.sin(9 * t) * (1 - t), 0, 1); };
const edgeJS = (qy, b, seed) => {
  const y = qy / b; if (Math.abs(y) >= 1) return 0;
  return Math.sqrt(Math.max(0, 1 - y * y)) * (1 + 0.16 * Math.sin(qy * 0.031 + seed * 17) + 0.08 * Math.sin(qy * 0.083 + seed * 5));
};
function srcJS(qx, qy, a, b, speed, healT, seed, out) {
  out.S = 0; out.R = 0;
  const y = qy / b; if (Math.abs(y) >= 1) return out;
  const e = edgeJS(qy, b, seed), x = qx / a, k = a / speed;
  const tin = Math.max(0, (e - x) * k), tout = Math.max(0, (-e - x) * k);
  out.R = smoothstep(0, 0.8, tin) * (1 - healJS(tout / healT)) * smoothstep(0, 0.3, e);
  out.S = smoothstep(-4, 4, Math.min((e - Math.abs(x)) * a, (1 - Math.abs(y)) * b - 4));
  return out;
}

// gentle rolling of the plateau and its pools: the same closed forms are written in the ground shader
const groundY = (x, z) => 2.6 * Math.sin(x * 0.011 + 1.3) * Math.sin(z * 0.009 + 0.4) + 1.6 * Math.sin((x + z) * 0.023 + 2.0) - 1.5;
const poolF = (x, z) => Math.sin(x * 0.043 + 2.2 * Math.sin(z * 0.019 + 0.7)) * Math.sin(z * 0.037 + 1.7 + 1.8 * Math.sin(x * 0.015));
// glades (open sand, 60-90 m across) and lanes (winding strips a pipe or two wide) break the quilt into stands: order and depth from above
const gladeF = (x, z) => Math.sin(x * 0.0105 + 2.1 * Math.sin(z * 0.0061 + 1.3)) * Math.sin(z * 0.0092 + 1.7 * Math.sin(x * 0.0057 + 0.4));
const laneF = (x, z) => Math.min(Math.abs(Math.sin(x * 0.009 + 1.9 * Math.sin(z * 0.0052 + 0.8) + 0.7 * Math.sin(z * 0.013))) / 0.07, Math.abs(Math.sin(z * 0.0075 + 1.6 * Math.sin(x * 0.0048 + 2.0) + 0.5)) / 0.055);
const GROUND_GLSL = /* glsl */`
  float gladeF(vec2 p) { return sin(p.x * 0.0105 + 2.1 * sin(p.y * 0.0061 + 1.3)) * sin(p.y * 0.0092 + 1.7 * sin(p.x * 0.0057 + 0.4)); }
  float laneF(vec2 p) { return min(abs(sin(p.x * 0.009 + 1.9 * sin(p.y * 0.0052 + 0.8) + 0.7 * sin(p.y * 0.013))) / 0.07, abs(sin(p.y * 0.0075 + 1.6 * sin(p.x * 0.0048 + 2.0) + 0.5)) / 0.055); }
  float groundY(vec2 p) { return 2.6 * sin(p.x * 0.011 + 1.3) * sin(p.y * 0.009 + 0.4) + 1.6 * sin((p.x + p.y) * 0.023 + 2.0) - 1.5; }
  float poolF(vec2 p) { return sin(p.x * 0.043 + 2.2 * sin(p.y * 0.019 + 0.7)) * sin(p.y * 0.037 + 1.7 + 1.8 * sin(p.x * 0.015)); }
`;

export default {
  id: 'flinching-forest',
  name: 'The Flinching Forest',
  category: 'alien',
  weirdness: 0.55,
  media: ['air', 'open'],
  async build(ctx) {
    const { rng, noise, renderer } = ctx;
    const vary = ctx.vary || {};
    const detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1);
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    const disposables = [];

    // ---- which visit is this: palette, hour, weather, cast ----------------------------------------------------
    const vr = rng.fork('clearing');
    const look = LOOKS[vr.int(0, 2)];
    const weather = vr.pick(['cumulus', 'cumulus', 'mackerel', 'three']);
    let lowSun = vr.chance(0.3);
    if (vary.hour === 'golden' || vary.hour === 'dawn') lowSun = true;
    if (vary.hour === 'day') lowSun = false;
    const spawning = vr.chance(0.3);
    const nFlightBirds = vr.pick([3, 6, 6, 9]);                    // skysails in each cruising flight (12 to 36 in all)
    const rare = !!vary.rare;
    const P = look.pal.map((h) => new THREE.Color(h));
    const C = (h) => new THREE.Color(h);
    const el = (lowSun ? 24 : 56) * Math.PI / 180;
    // on the left and a little ahead all the way (80 degrees left of the heading): every plume ahead is lit from behind
    const sunDir = new THREE.Vector3(0.985 * Math.cos(el), Math.sin(el), 0.17 * Math.cos(el)).normalize();
    const sunCol = C(look.sun).multiplyScalar(lowSun ? 1.12 : 1.15);
    if (lowSun) sunCol.multiply(new THREE.Color(1.0, 0.86, 0.66));
    const fillCol = C(look.fill).lerp(C('#ffffff'), 0.14).multiplyScalar(lowSun ? 0.62 : 0.7);
    const hazeCol = C(look.horizon).lerp(C(look.mid), 0.42);
    scene.fog = new THREE.FogExp2(hazeCol, 0.0007);              // half strength at 1,100 m
    scene.background = hazeCol.clone();
    const windDir = new THREE.Vector2(-0.8, 0.6), windPerp = new THREE.Vector2(-windDir.y, windDir.x);

    // ---- the path (from the brief's journey; the last legs come from the hero's anchors) ----------------------
    const toWorld = (v) => v.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), SPIRE_ROT).add(SPIRE);
    const sl = rng.range(0.8, 1.15) * rng.sign();                 // the slalom's hand changes with the seed
    const pts = [
      [0, 104, 0], [0, 103, 70], [1, 95, 140], [3, 74, 200], [5, 45, 258], [3 * sl, 25, 310],
      [-7 * sl, 21, 356], [6 * sl, 20.5, 404], [-6 * sl, 20.5, 452], [3 * sl, 21.5, 498],
      [6, 45, 546], [3, 60, 596], [-2, 76, 650], [-10, 88, 712], [-24, 84, 768],
      // the rising approach: 300 m straight at the ring, climbing the Spire's sunlit south face as it nears
      [-34, 74, 815], [-39, 67, 858], [-40, 75, 898], [-40, 104, 940], [-40, 128, 975], [-40, 144, 1002], [-40, 150, 1030], [-40, 150, 1060],
    ];
    await ctx.yield();
    const path = makePath(pts);
    await ctx.yield();
    const KU = L_OLD / path.length, DURATION = 46 / KU;          // old-route u -> u; DURATION is the clouds' clock for u 0..1
    const uo = (u) => u * KU;
    const ud = (d) => 1 - d / path.length;                      // u when the ring is d metres ahead
    const camAt = (u, out) => path.pointAt(u, out || new THREE.Vector3());
    // two pools laid where the clearing's flight passes: the sky mirrored in the lower frame
    const poolC = new THREE.Vector4();
    { const a = camAt(uo(0.252)), b = camAt(uo(0.284)); poolC.set(a.x + 11 * Math.sign(sl), a.z, b.x - 12 * Math.sign(sl), b.z); }
    const poolAt = (x, z) => { const ax = x - poolC.x, az = z - poolC.y, bx = x - poolC.z, bz = z - poolC.w;
      return Math.max(poolF(x, z), 0.95 * Math.max(Math.exp(-(ax * ax + az * az) / 1500), Math.exp(-(bx * bx + bz * bz) / 1100))); };
    await ctx.yield();

    // ---- the hero: the Twin Spire ------------------------------------------------------------------------------
    const hero = await buildHero(ctx, { palette: look.pal, detail, wine: look.wine, glowA: look.glowA, glowB: look.glowB, core: look.core, sunDir: sunDir.clone() });   // the piece shades with world-space normals, so it takes the world's sun as it is
    hero.object.position.copy(SPIRE); hero.object.position.y = groundY(SPIRE.x, SPIRE.z) - 0.6;
    hero.object.rotation.y = SPIRE_ROT;
    hero.uniforms.uSunCol.value.copy(sunCol); hero.uniforms.uFill.value.copy(fillCol);
    hero.uniforms.uWind.value.set(windDir.x, 0, windDir.y).applyAxisAngle(new THREE.Vector3(0, 1, 0), -SPIRE_ROT);
    hero.setFlinch(0, 0, 0, 0, 0);
    scene.add(hero.object);
    await ctx.yield();

    await ctx.yield();
    // ---- shadow sources: clouds in the wind frame (along, cross); positions are functions of T = u * 46 --------
    const along = (x, z) => x * windDir.x + z * windDir.y, cross = (x, z) => x * windPerp.x + z * windPerp.y;
    const clouds = [];
    const cr = rng.fork('clouds');
    {
      // the Follower: its front reaches the Spire's foot when the ring is 235 m ahead, and its tail has left by 60 m
      const sf = cr(), bf = 130, af = 110, Tf = ud(280) * DURATION;
      clouds.push({ a: af, b: bf, cy: cross(SPIRE.x, SPIRE.z) + cr.range(-30, 30) * 0.4, seed: sf, speed: 50, heal: 4, k: 1,
        cx0: along(SPIRE.x, SPIRE.z) - edgeJS(0, bf, sf) * af - 50 * Tf });
    }
    const tmpS = { S: 0, R: 0 };
    const cloudAt = (x, z, T, out, skip = -1) => {                 // S and R from the clouds at a world point
      let S = 0, R = 0; const ax = along(x, z), cy = cross(x, z);
      for (let i = 0; i < clouds.length; i++) {
        if (i === skip) continue;
        const c = clouds[i];
        srcJS(ax - (c.cx0 + c.speed * T), cy - c.cy, c.a, c.b, c.speed, c.heal, c.seed, tmpS);
        S = Math.max(S, tmpS.S * c.k); R = Math.max(R, tmpS.R);
      }
      out.S = S * 0.85; out.R = R; return out;
    };
    {
      // the first cloud: low and slow, it slides across the quilt from the left under the bow in the first seconds, a clearing
      // of bare pipes with a rim of half-shut plumes ahead of it and a wake reopening behind, its cumulus just above it
      // (under a low sun it rides lower and its shadow lies further right, so that cloud and shadow are still in one frame)
      const T0 = 0.08 * DURATION, ex = lowSun ? -70 : 0, ez = 300, sp = 22;
      clouds.push({ a: 85, b: 100, cy: cross(ex, ez), cx0: along(ex, ez) - sp * T0, seed: cr(), speed: sp, heal: 4, k: 1, alt: lowSun ? 90 : 124, entry: 1 });
    }
    {
      // lesser clouds: anywhere that leaves the sunny stretches of the flight (and the Spire, before its cue) alone
      const want = weather === 'cumulus' ? 5 : weather === 'three' ? 1 : 0;
      const probe = []; const pv = new THREE.Vector3();
      for (let u = 0; u <= 1; u += 0.012) { camAt(u, pv); probe.push([pv.x, pv.z, u * DURATION]); }
      for (let u = 0.3; u <= 1; u += 0.02) probe.push([SPIRE.x, SPIRE.z, u * DURATION]);
      // the hollow keeps to its own small shadows: no great wake of bare pipes in sun beside the line of flight there
      for (let u = 0.2; u <= 0.5; u += 0.012) { camAt(u, pv); probe.push([pv.x + 75, pv.z, u * DURATION], [pv.x - 75, pv.z, u * DURATION]); }
      const o = { S: 0, R: 0 };
      for (let n = 0, tries = 0; n < 3 && tries < 240; tries++) {
        const z = cr.range(470, 900), x = cr.sign() * cr.range(0.16, 0.5) * z + (lowSun ? -60 : 0), sp = cr.range(12, 20);
        const c = { a: cr.range(58, 92), b: cr.range(70, 112), seed: cr(), speed: sp, heal: 4, k: 1, cy: cross(x, z), cx0: along(x, z) - sp * 0.05 * DURATION, alt: lowSun ? cr.range(110, 150) : cr.range(140, 210) };
        let ok = true;
        // its cumulus never drifts between us and the Spire
        const off = c.alt / Math.max(sunDir.y, 0.2);
        for (let u = 0.1; u <= 1.001 && ok; u += 0.03) {
          camAt(u, pv); const ax = c.cx0 + sp * u * DURATION, qx = windDir.x * ax + windPerp.x * c.cy + sunDir.x * off, qz = windDir.y * ax + windPerp.y * c.cy + sunDir.z * off;
          const dx = SPIRE.x - pv.x, dz = SPIRE.z - pv.z, tt = clamp(((qx - pv.x) * dx + (qz - pv.z) * dz) / Math.max(dx * dx + dz * dz, 1), 0, 1.3);
          if (Math.hypot(qx - pv.x - dx * tt, qz - pv.z - dz * tt) < c.b + (u < 0.4 ? 50 : 110)) ok = false;
          if (Math.hypot(qx - pv.x, qz - pv.z) < c.b + 190) ok = false;                       // nor hangs over the lens as a blur
        }
        for (const q of clouds) { if (!q.alt) continue; const ax = q.cx0 + q.speed * 0.05 * DURATION; if (Math.hypot(ax - along(x, z), q.cy - c.cy) < 330) { ok = false; break; } }
        if (ok) for (const [px, pz, T] of probe) {
          srcJS(along(px, pz) - (c.cx0 + sp * T), cross(px, pz) - c.cy, c.a + 30, c.b + 30, sp, 4, c.seed, o);
          if (o.S > 0.01 || o.R > 0.01) { ok = false; break; }
        }
        if (ok) { clouds.push(c); n++; }
        if ((tries & 7) === 7) await ctx.yield();
      }
      await ctx.yield();
      for (let n = 0, tries = 0; n < want && tries < 300; tries++) {
        const big = weather === 'three';
        const c = { a: big ? cr.range(150, 190) : cr.range(60, 110), b: big ? cr.range(280, 340) : cr.range(70, 120), seed: cr(), speed: 50, heal: 4, k: 1,
          cy: cr.range(-750, 750), cx0: cr.range(-500, 1300) - 50 * cr.range(0, DURATION) };
        clouds.push(c);
        let ok = true; const me = clouds.length - 1;
        for (const [x, z, T] of probe) {
          srcJS(along(x, z) - (c.cx0 + 50 * T), cross(x, z) - c.cy, c.a + 30, c.b + 30, 50, 4, c.seed, o);
          if (o.S > 0.01 || o.R > 0.01) { ok = false; break; }
        }
        if (!ok) clouds.pop(); else n++;
        void me;
        if ((tries & 7) === 7) await ctx.yield();
      }
    }
    await ctx.yield();
    const lat = new THREE.Vector4(330, 250, 0, weather === 'mackerel' ? 1 : 0);
    // the hollow's train: small cloud shadows that cross the line of flight on the engine's clock, so that whenever we are
    // there some plumes are screwing down, some are unfurling, and a line of sun and shade lies across the floor
    const TRAIN_SPEED = 4.5, TRAIN_PHASE = 3276;      // the phase is chosen so that at world time 12 (the stills) every station in the hollow has a shade line in view
    const trainU = new THREE.Vector4(100, 130, TRAIN_PHASE, 1);

    // ---- uniforms shared by every forest shader ----------------------------------------------------------------
    const SU = {
      uClA: { value: Array.from({ length: NCL }, () => new THREE.Vector4(0, 0, 1, 1)) },
      uClB: { value: Array.from({ length: NCL }, () => new THREE.Vector4(0, 50, 4, 0)) },
      uDisc: { value: Array.from({ length: NDISC }, () => new THREE.Vector4(1e5, 1e5, 1, 0)) },
      uLat: { value: lat }, uWindDir: { value: windDir }, uVeil: { value: 0 },
      uTr: { value: trainU }, uTrSeg: { value: new THREE.Vector4(3, 225, 0, 440) }, uTrRad: { value: new THREE.Vector3(105, 165, TRAIN_SPEED) },
      uCamP: { value: new THREE.Vector3(0, 58, 0) }, uCamT: { value: new THREE.Vector3(0, 0, 1) }, uCamSpeed: { value: 31 },
      uTime: { value: 0 }, uSunDir: { value: sunDir }, uSunCol: { value: sunCol }, uFill: { value: fillCol }, uTeal: { value: P[5] },
      uShade: { value: 0 }, uRes: { value: new THREE.Vector2(800, 450) },
      uStand: { value: new THREE.Vector4(0, 0, 0, 1) }, uStandW: { value: windDir }, uGold: { value: P[3] },      // the streets' field (heroKit.STANDS): phases, strength; the wind constant
    };
    // the streets' three phases come from a stream of their own, made without a draw from any stream of the world or the part
    { const sd = ctx.core.makeRng(ctx.core.hashSeed('stands:' + ctx.seed)), s0 = sd.range(0, TAU), s1 = sd.range(0, TAU), s2 = sd.range(0, TAU); SU.uStand.value.set(s0, s1, s2, 1); }
    clouds.forEach((c, i) => { if (i < NCL) SU.uClB.value[i].set(c.seed, c.speed, c.heal, c.k); });
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const cloudPos = (c, T, out) => { const ax = c.cx0 + c.speed * T; return out.set(windDir.x * ax + windPerp.x * c.cy, 0, windDir.y * ax + windPerp.y * c.cy); };
    const srcV = new THREE.Vector3();
    const setSources = (T) => {
      const v = srcV;
      for (let i = 0; i < Math.min(NCL, clouds.length); i++) { const c = clouds[i]; cloudPos(c, T, v); SU.uClA.value[i].set(v.x, v.z, c.a, c.b); }
      lat.z = 50 * T;
    };
    const setTrain = (time) => { trainU.z = TRAIN_PHASE + TRAIN_SPEED * time; };
    setSources(0);

    // ---- where the 30,000 stand: a jittered hex grid, heights by stand ------------------------------------------
    const lr = rng.fork('layout');
    const segD = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az; const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1); return Math.hypot(x - ax - dx * t, z - az - dz * t); };
    const roughD = (x, z) => Math.min(segD(x, z, 0, 0, -4, 690), segD(x, z, -4, 690, SPIRE.x, SPIRE.z), Math.max(0, Math.hypot(x - SPIRE.x, z - SPIRE.z) - 110));
    const PITCH = 11.5 / Math.sqrt(clamp(density, 0.85, 1.1)), ROW = PITCH * 0.866, PC = [-35, 530], PR = 1180;
    const nearT = [], cardT = [];
    let rowI = 0;
    for (let z = PC[1] - PR; z <= PC[1] + PR; z += ROW, rowI++) {
      const half = Math.sqrt(Math.max(0, PR * PR - (z - PC[1]) * (z - PC[1])));
      for (let x0 = PC[0] - half + (rowI & 1) * PITCH * 0.5; x0 <= PC[0] + half; x0 += PITCH) {
        const x = x0 + lr.range(-2.4, 2.4), zz = z + lr.range(-2.4, 2.4);
        const dR = roughD(x, zz);
        // far stands are drawn by fewer, larger cards and at last by the ground's own paint
        const keep = dR < 170 ? 1 : dR < 520 ? lerp(1, 0.26, (dR - 170) / 350) : lerp(0.26, 0.1, clamp((dR - 520) / 300, 0, 1));
        const r = lr();
        if (dR > 860 || r > keep * (dR < 60 ? 1 : 0.55 + 0.45 * detail)) continue;
        { const ex = (x - SPIRE.x) / 74, ez = (zz - SPIRE.z) / 32; if (ex * ex + ez * ez < 1) continue; }
        if (poolAt(x, zz) > 0.84) continue;
        if (dR > 55 && (gladeF(x, zz) > 0.86 || laneF(x, zz) < 1)) continue;
        let d = dR, pu = 0, py = 400;
        if (dR < 215) { const n = path.nearestXZ(x, zz); d = n.dist; pu = n.u; py = n.y; }
        const h = noise.fbm2(x * 0.0042 + 7, zz * 0.0042, 3);
        let top = 38 + lerp(4, 22, smoothstep(50, 320, d)) * h + lr.range(-1.2, 1.2);
        if (d < 9.5) { if (py - 12 < 16) continue; top = Math.min(top, py - 12); }
        else if (d < 30 && pu > 0.47 && pu < ud(250)) top = Math.min(top, py - 9 + (d - 9.5) * 0.55);     // we skim the crowns: those beside the line of flight stand just below the eye, rosettes seen whole
        // the hollow: where the flight crosses the Bank's clearing the stand is of short pipes (their plumes as broad as any, so
        // the quilt is unbroken from above); once they shut, the eye runs over their lips to the red wall and the Spire
        const lowK = dR < 215 ? smoothstep(0.19, 0.24, pu) * (1 - smoothstep(uo(0.3), uo(0.336), pu)) * (1 - smoothstep(115, 205, d)) : 0;
        const topFull = top;
        if (lowK > 0) top = lerp(top, 8 + 11.5 * (0.5 + 0.5 * noise.n2(x * 0.08, zz * 0.08)) + 7 * smoothstep(55, 180, d), lowK);
        const Hp = clamp(topFull * 0.34, 4, 25) * lr.range(0.86, 1.1) * (1 - 0.25 * lowK), grow = 1 / Math.sqrt(keep);
        const t = { x, z: zz, y: groundY(x, zz), H: Math.max(2.5, top - 0.7 * Hp), R: clamp(topFull * 0.028, 0.6, 1.5) * lr.range(0.85, 1.2) * (1 - 0.15 * lowK),
          Hp, Rp: clamp(Hp * lr.range(0.42, 0.52), 2.5, 7.4) * grow, hand: lr.sign(), seed: lr(), hue: clamp(0.3 * lr() * lr() + 0.7 * (0.5 + 0.9 * noise.fbm2(x * 0.0065 + 31, zz * 0.0065 + 5, 2)), 0, 1), d, pu, grow };
        if (d < 56) nearT.push(t); else cardT.push(t);
      }
      await ctx.yield();
    }
    await ctx.yield();
    // mid tier: the nearest thousand to the path; the rest of the near band falls back to cards
    await ctx.yield();
    nearT.sort((p, q) => p.d - q.d);
    await ctx.yield();
    const NMID = Math.min(nearT.length, Math.round(725 * (0.7 + 0.3 * detail)));
    for (let i = NMID; i < nearT.length; i++) cardT.push(nearT[i]);
    const midT = nearT.slice(0, NMID);
    // six low stumps for the skysails to perch on, close to the line of flight at the far end of the clearing: lips just
    // below eye level, so the birds sit where the eye already is
    const perches = [];
    {
      // each perch is the nearest pipe moved to an exact place beside the line of flight: two a little ahead of each of the two
      // moments in the hollow (one to each side, clear of the pools), two between
      // each perch is the nearest pipe moved to an exact place in the picture: 31 and 47 m down the gaze from each of the two
      // moments in the hollow, a little to either side of it (inside the middle half of the frame), and two between
      const sg = Math.sign(sl), pp = new THREE.Vector3(), pa = new THREE.Vector3();
      for (const [uS, dist, side] of [[0.34, 31, sg], [0.34, 47, -sg], [0.43, 31, -sg], [0.43, 47, sg], [0.4, 30, sg], [0.3, 34, -sg]]) {
        camAt(uS, pp); camAt(uS + 22 / path.length, pa);
        let gx = pa.x - pp.x, gz = pa.z - pp.z; const gl = Math.hypot(gx, gz) || 1; gx /= gl; gz /= gl;
        let lat = dist * 0.14, wx = 0, wz = 0, n = null;
        for (let k = 0; k < 14; k++) { wx = pp.x + gx * dist + side * lat * gz; wz = pp.z + gz * dist - side * lat * gx; n = path.nearestXZ(wx, wz); if (n.dist >= 7.6) break; lat += 1.2; }
        let best = null, bd = 1e9;
        for (const t of midT) { if (t.perch) continue; const e = Math.hypot(t.x - wx, t.z - wz); if (e < bd) { bd = e; best = t; } }
        if (!best) continue;
        best.perch = 1; best.x = wx; best.z = wz; best.y = groundY(wx, wz); best.pu = n.u - 30 / path.length; best.d = n.dist;
        best.H = clamp(n.y - 6.5 - 1.5 * (perches.length % 2), 7, 18); best.Hp = 0.6; best.Rp = 0.4; best.R = 1.25; perches.push(best);
      }
    }
    // hero slots: plumes within 22 m of the path are promoted to full meshes as the camera nears them
    const heroCand = midT.map((t, i) => ({ t, i })).filter((e) => e.t.d < 22).sort((p, q) => p.t.pu - q.t.pu);
    await ctx.yield();

    await ctx.yield();
    // ---- plumes: the hero's own shader with the retraction replaced by shade(root) and the camera's capsule -----
    const wine = look.wine ? C(look.wine) : P[1].clone().multiplyScalar(0.34).lerp(C('#7A1426'), 0.6);
    const shadeVary = (src) => src.replace('uniform float uShade, uTime;', 'uniform float uTime; varying float uShade;');
    const RETRACT = /* glsl */`
      vec3 sr = shade(rootW.xz, seed);
      uShade = sr.x;
      float R = sr.y;
      vec3 cc = rootW + vec3(0., Hp * 0.5, 0.) - uCamP;
      float al = dot(cc, uCamT);
      float perp = length(cc - al * uCamT);
      float Rc = (1. - smoothstep(8., 11.5, perp)) * (1. - smoothstep(15., 30., al)) * (1. - healF(max(0., -al - 5.) / max(uCamSpeed, 1.) * 0.25));
      R = max(R, Rc);
      R = R * sqrt(max(R, 0.));      // the plume is about half its size when the retraction is half done: every stage is seen
    `;
    const pv0 = heroKit.PLUME_VERT;
    const plumeVert = (pv0.slice(0, pv0.indexOf('//<retraction>')) + RETRACT + pv0.slice(pv0.indexOf('//</retraction>')))
      .replace('varying vec3 vW;', SHADE + '\n  uniform vec3 uCamP, uCamT; uniform float uCamSpeed;\n  varying float uShade;\n  varying vec3 vW;')
      .replace('#include <fog_vertex>', 'if (iOrder.x > 0.5) gl_Position = vec4(0., 0., 2., 1.);\n    #include <fog_vertex>');
    const plumeFrag = shadeVary(heroKit.PLUME_FRAG);
    const plumeMat = () => new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...SU, uCoral: { value: P[2] }, uCrimson: { value: P[1] }, uWine: { value: wine }, uGold: { value: P[3] },
        uGlowA: { value: new THREE.Vector3(...look.glowA) }, uGlowB: { value: new THREE.Vector3(...look.glowB) },
        uTurns: { value: 3.5 }, uGreat: { value: 0 }, uLow: { value: 0.42 }, uSlopeLo: { value: 0.1 }, uRoot0: { value: 0.05 }, uSlopeHi: { value: 0.8 },
        uFil: { value: 90 }, uPin: { value: 26 }, uSpin: { value: 1 }, uFogK: { value: 1 }, uCore: { value: look.core ?? 0.2 },
        uFlinchT: { value: 0 }, uFlinchG: { value: new THREE.Vector2() }, uCamFlinch: { value: 0 } },
      vertexShader: plumeVert, fragmentShader: plumeFrag, side: THREE.DoubleSide, fog: true,
    });
    const fillPlume = (t, i, aRoot, aSize, aOrder) => {
      aRoot[i * 3] = t.x; aRoot[i * 3 + 1] = t.y + t.H - 0.4; aRoot[i * 3 + 2] = t.z;
      aSize[i * 4] = t.Hp; aSize[i * 4 + 1] = t.Rp; aSize[i * 4 + 2] = t.hand; aSize[i * 4 + 3] = t.seed;
      aOrder[i * 2] = 0; aOrder[i * 2 + 1] = t.hue;
    };
    const instAttr = (g, name, arr, n, dyn) => { const a = new THREE.InstancedBufferAttribute(arr, n); if (dyn) a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(name, a); return a; };
    await ctx.yield();
    // mid tier
    const midGeo = heroKit.plumeGeometry(8, 1, 3.5, 1);
    const mRoot = new Float32Array(NMID * 3), mSize = new Float32Array(NMID * 4), mOrder = new Float32Array(NMID * 2);
    midT.forEach((t, i) => fillPlume(t, i, mRoot, mSize, mOrder));
    instAttr(midGeo, 'iRoot', mRoot, 3); instAttr(midGeo, 'iSize', mSize, 4);
    const midOrderAttr = instAttr(midGeo, 'iOrder', mOrder, 2, true);
    midGeo.instanceCount = NMID;
    const midPlumes = new THREE.Mesh(midGeo, plumeMat()); midPlumes.frustumCulled = false; scene.add(midPlumes);
    await ctx.yield();
    // hero slots (re-filled as the camera travels)
    const NSLOT = 32;
    const slotGeo = heroKit.plumeGeometry(28, 4, 3.5, 4);
    const sRoot = new Float32Array(NSLOT * 3), sSize = new Float32Array(NSLOT * 4), sOrder = new Float32Array(NSLOT * 2);
    const slotAttrs = [instAttr(slotGeo, 'iRoot', sRoot, 3, true), instAttr(slotGeo, 'iSize', sSize, 4, true), instAttr(slotGeo, 'iOrder', sOrder, 2, true)];
    slotGeo.instanceCount = 0;
    const slotPlumes = new THREE.Mesh(slotGeo, plumeMat()); slotPlumes.frustumCulled = false; scene.add(slotPlumes);
    await ctx.yield();

    // ---- tubes: the hero's pipe shader, instanced and stretched to each animal's height -----------------------
    const H0 = 30;
    const tubeProbe = heroKit.makeTubeMaterial({}, P);
    const tubeFrag = shadeVary(tubeProbe.fragmentShader).replace('uniform float uOpen;', 'varying float uOpen;');
    tubeProbe.dispose();
    const tubeVert = /* glsl */`
      attribute vec3 aDat; attribute vec4 iT; attribute vec4 iT2; attribute vec2 iOrder;
      ${SHADE}
      varying vec3 vW, vN; varying vec2 vUv; varying vec3 vDat; varying float uShade, uOpen;
      #include <fog_pars_vertex>
      void main() {
        float H = iT.w, R = iT2.x;
        float y = position.y < ${H0 - 5}. ? position.y * (H - 5.) / ${H0 - 5}. : H - (${H0}. - position.y);
        y = position.y < 0.5 ? position.y : y;
        vec3 p = vec3(position.x * R, y, position.z * R) + iT.xyz;
        if (iOrder.x > 0.5) p = vec3(0.);
        vUv = vec2(uv.x, y); vDat = vec3(iT2.y, H, aDat.z);
        vec3 sr = shade(iT.xz, iT2.y); uShade = sr.x; uOpen = 1. - sr.y;
        vW = p; vN = normal;
        vec4 mvPosition = viewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`;
    const tubeMat = () => new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...SU, uIvory: { value: P[0] }, uGold: { value: P[3] }, uCoral: { value: P[2] } },
      vertexShader: tubeVert, fragmentShader: tubeFrag, fog: true,
    });
    const tr = rng.fork('tubes');
    const tubeGeo = (segs, lobes, prof) => {
      const sink = heroKit.makeSink();
      heroKit.lathe(sink, prof, segs, () => [0, 0], 0, H0, lobes);
      const g0 = heroKit.sinkToGeometry(sink), g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', g0.getAttribute('position')); g.setAttribute('normal', g0.getAttribute('normal'));
      g.setAttribute('uv', g0.getAttribute('uv')); g.setAttribute('aDat', g0.getAttribute('aDat')); g.setIndex(g0.getIndex());
      return g;
    };
    const fillTube = (t, i, aT, aT2) => {
      aT[i * 4] = t.x; aT[i * 4 + 1] = t.y; aT[i * 4 + 2] = t.z; aT[i * 4 + 3] = t.H;
      aT2[i * 4] = t.R; aT2[i * 4 + 1] = t.seed; aT2[i * 4 + 2] = 0; aT2[i * 4 + 3] = 0;
    };
    const midTubeGeo = tubeGeo(6, 3, [[-1.5, 1.4], [0.3, 1.32], [2.4, 0.98], [27.6, 1.04], [29.3, 1.25, 0.07], [30.15, 1.1, 0.18], [29.4, 0.84, 0.05], [27.6, 0.83], [27.59, 0.001]]);
    const mT = new Float32Array(NMID * 4), mT2 = new Float32Array(NMID * 4);
    for (let i = 0; i < midT.length; i++) { fillTube(midT[i], i, mT, mT2); if (i % 1000 === 999) await ctx.yield(); }
    instAttr(midTubeGeo, 'iT', mT, 4); instAttr(midTubeGeo, 'iT2', mT2, 4); midTubeGeo.setAttribute('iOrder', midOrderAttr);
    midTubeGeo.instanceCount = NMID;
    const midTubes = new THREE.Mesh(midTubeGeo, tubeMat()); midTubes.frustumCulled = false; scene.add(midTubes);
    await ctx.yield();
    const slotTubeGeo = tubeGeo(18, 6, heroKit.tubeProfile(tr, H0, 1, false));
    const sT = new Float32Array(NSLOT * 4), sT2 = new Float32Array(NSLOT * 4);
    slotAttrs.push(instAttr(slotTubeGeo, 'iT', sT, 4, true), instAttr(slotTubeGeo, 'iT2', sT2, 4, true));
    slotTubeGeo.setAttribute('iOrder', slotAttrs[2]);
    slotTubeGeo.instanceCount = 0;
    const slotTubes = new THREE.Mesh(slotTubeGeo, tubeMat()); slotTubes.frustumCulled = false; scene.add(slotTubes);

    // which animals hold the full-detail slots: those within 22 m of the path, from 25 m behind to 115 m ahead
    let slotSig = '', slotPrev = [];
    const slotPick = [];
    const fillSlots = (u) => {
      const u0 = u - 25 / path.length, u1 = u + 115 / path.length;
      slotPick.length = 0;
      for (let i = 0; i < heroCand.length; i++) { const e = heroCand[i]; if (e.t.pu < u0) continue; if (e.t.pu > u1) break; slotPick.push(e); }
      if (slotPick.length > NSLOT) { slotPick.sort((p, q) => p.t.d - q.t.d); slotPick.length = NSLOT; }
      let sig = ''; for (const e of slotPick) sig += e.i + ',';
      if (sig === slotSig) return;
      slotSig = sig;
      for (const e of slotPrev) mOrder[e.i * 2] = 0;
      slotPick.forEach((e, k) => { mOrder[e.i * 2] = 1; fillPlume(e.t, k, sRoot, sSize, sOrder); fillTube(e.t, k, sT, sT2); });
      slotPrev = slotPick.slice();
      midOrderAttr.needsUpdate = true; for (const a of slotAttrs) a.needsUpdate = true;
      slotGeo.instanceCount = slotPick.length; slotTubeGeo.instanceCount = slotPick.length;
    };
    fillSlots(0);
    await ctx.yield();

    // the young: finger-thin tubes and small pale plumes in the litter and round the pools of the clearing stretch
    {
      const yr = rng.fork('young'), nY = Math.round(3000 * detail * density), pv = new THREE.Vector3();
      for (let i = 0; i < nY; i++) {
        camAt(uo(yr.range(0.13, 0.42)), pv);
        const off = (2.5 + 70 * Math.pow(yr(), 1.6)) * yr.sign();
        let x = pv.x + off, z = pv.z + yr.range(-8, 8);
        if (i % 3 === 0) {       // a third of them stand in clusters in the rose mats that ring the two pools on the line of flight
          const second = (i / 3) & 1, ca = (((i / 3) | 0) % 7) * 0.9 + yr.gauss() * 0.16, cr2 = (second ? 14.2 : 16.4) + Math.abs(yr.gauss()) * 2.4;
          x = (second ? poolC.z : poolC.x) + Math.cos(ca) * cr2; z = (second ? poolC.w : poolC.y) + Math.sin(ca) * cr2;
        }
        if (poolAt(x, z) > 0.84) continue;
        const Hp = yr.range(0.6, 2.6);
        cardT.push({ x, z, y: groundY(x, z), H: Hp * yr.range(0.3, 0.6), Hp, Rp: Hp * yr.range(0.4, 0.5), hand: yr.sign(), seed: yr(), hue: 0.6 + 0.4 * yr() });
        if (i % 120 === 119) await ctx.yield();
      }
    }

    await ctx.yield();
    // ---- far plumes: one upright card each, tube and spiral drawn in the fragment shader; they squash, never fade
    const COMMON = shadeVary(heroKit.GLSL_COMMON);
    const quadGeo = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
    const NCARD = cardT.length;
    const cardGeo = quadGeo();
    const cA = new Float32Array(NCARD * 4), cB = new Float32Array(NCARD * 4);
    for (let i = 0; i < NCARD; i++) { const t = cardT[i]; cA[i * 4] = t.x; cA[i * 4 + 1] = t.y; cA[i * 4 + 2] = t.z; cA[i * 4 + 3] = t.H; cB[i * 4] = t.Hp; cB[i * 4 + 1] = t.Rp; cB[i * 4 + 2] = t.seed + (t.hand > 0 ? 2 : 0); cB[i * 4 + 3] = t.hue; if (i % 4000 === 3999) await ctx.yield(); }
    instAttr(cardGeo, 'iC', cA, 4); instAttr(cardGeo, 'iC2', cB, 4); cardGeo.instanceCount = NCARD;
    await ctx.yield();
    const cardMat = new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...SU, uIvory: { value: P[0] }, uCoral: { value: P[2] }, uCrimson: { value: P[1] }, uWine: { value: wine },
        uGlowA: { value: new THREE.Vector3(...look.glowA) }, uGlowB: { value: new THREE.Vector3(...look.glowB) }, uCore: { value: look.core ?? 0.2 } },
      fog: true,
      vertexShader: /* glsl */`
        attribute vec4 iC, iC2;
        ${SHADE}
        ${heroKit.STANDS}
        varying float vStand;
        varying vec2 vQ; varying vec4 vA, vB; varying vec3 vW, vRight; varying float uShade;
        #include <fog_pars_vertex>
        void main() {
          vec3 root = iC.xyz;
          float hand = step(1.5, iC2.z) * 2. - 1., seed = fract(iC2.z);
          vec3 sr = shade(root.xz, seed);
          vStand = standOf(root.xz);
          vec3 toC = cameraPosition - root; toC.y = 0.;
          toC /= max(length(toC), 1e-3);
          vec3 right = vec3(toC.z, 0., -toC.x);
          float W = iC2.y * 1.06, Ht = iC.w + iC2.x;
          vec3 top = root + vec3(0., iC.w + iC2.x * 0.72, 0.) - cameraPosition;
          float sinE = clamp(-top.y / max(length(top), 1.), 0., 1.);
          Ht += iC2.y * sinE;
          vQ = vec2(position.x * W, position.y * (Ht + 1.5) - 1.5);
          vec3 p = root + right * vQ.x + vec3(0., vQ.y, 0.);
          vA = vec4(iC.w, iC2.x, iC2.y, seed); vB = vec4(sr.y * sqrt(max(sr.y, 0.)), iC2.w, hand, sinE);
          uShade = sr.x; vW = p; vRight = right;
          vec4 mvPosition = viewMatrix * vec4(p, 1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        ${COMMON}
        uniform vec3 uIvory, uCoral, uCrimson, uWine, uGlowA, uGlowB; uniform float uCore;
        ${heroKit.STANDS}
        uniform vec3 uGold; varying float vStand;
        varying vec2 vQ; varying vec4 vA, vB; varying vec3 vW, vRight;
        #include <fog_pars_fragment>
        void main() {
          float H = vA.x, Hp = vA.y, Rp = vA.z, seed = vA.w, R = vB.x, hand = vB.z;
          float X = vQ.x, Y = vQ.y, sunK = 1. - uShade;
          vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.));
          vec3 fwd = vec3(-vRight.z, 0., vRight.x);
          vec3 col;
          float Rt = max((H + Hp < 6. ? 0.07 : clamp((H + Hp) * 0.028, 0.6, 1.6) * (1. + 0.3 * (1. - smoothstep(0., 2.5, Y)))), fwidth(X) * 0.9);
          float k = 1. - R;
          float xn = abs(X) / max(Rp * k, 0.05), yn = (Y - H + 3. * R) / max(Hp * k * k, 0.05);
          float ac = (yn - 0.05 - 0.28 * xn) / 0.62, a = clamp(ac, 0., 1.);
          float rad = mix(0.42, 1., a * (2. - a));
          float L = ac * 7. + step(0., X) * 0.5 + seed * 3. + hand * uTime * 0.14, lf = fract(L), lid = floor(L);
          float sn = xn / rad;
          float len = 0.78 + 0.22 * hash11(lid * 1.37 + seed * 91.) - 0.1 * hash11(floor(Y * 2.5) + lid * 7. + seed * 13.);
          bool plume = R < 0.97 && ac > 0. && ac < 1. && sn < len && lf < mix(1.05, 0.6, smoothstep(0.4, 0.95, sn));
          // seen from above, the funnel opens into a rosette
          float sinE = vB.w;
          vec2 e = vec2(X / max(Rp * k, 0.05), (Y - H + 3. * R - Hp * 0.72 * k * k) / max(Rp * k * sinE, 0.05));
          float er = length(e), ang = atan(e.y, abs(e.x) < 1e-5 ? 1e-5 : e.x) / 6.2831853;
          float lr = fract(ang * hand + er * 1.6 + seed + uTime * 0.025);
          bool ros = R < 0.97 && sinE > 0.06 && er < 0.82 + 0.18 * hash11(floor(ang * 40.) + seed * 31.);
          if (ros) { sn = er; a = 0.85; lf = 1. - smoothstep(0., 0.4, lr); lid = floor(ang * 40.); plume = true; }
          bool stalk = R < 0.97 && yn > -0.3 && yn < 0.7 && abs(X) < max(Rp * 0.05, fwidth(X) * 0.6);
          if (abs(X) < Rt && Y < H) {
            float nx = X / Rt;
            vec3 N = normalize(vRight * nx + fwd * sqrt(max(0., 1. - nx * nx)) + vec3(1e-4, 0.05, 1e-4));
            float ao = 0.62 + 0.38 * smoothstep(0.2, 0.98, Y / max(H, 1.));
            vec3 alb = uIvory * (0.86 + 0.1 * hash11(seed * 13.1)) * (0.94 + 0.06 * sin(Y * 1.9 + seed * 20.));
            vec3 lit = uSunCol * pipeKey(N) * sunK * mix(0.7, 1., ao) + pipeFill(N, uShade, smoothstep(0., 0.75, Y / max(H, 1.)), uCoral);
            lit += uCoral * 0.22 * k * smoothstep(H - 9., H, Y);
            float rimK = abs(nx); rimK *= rimK * rimK;
            lit += (uFill * 0.55 + uSunCol * 0.3 * max(dot(N.xz, uSunDir.xz / max(length(uSunDir.xz), 1e-4)), 0.)) * rimK * uShade * (0.45 + 0.55 * smoothstep(0., 0.75, Y / max(H, 1.)));
            float young = step(H + Hp, 6.);
            col = mix(alb, mix(uIvory, uCoral, 0.45) * 0.8, young) * lit * mix(1., 0.4, young * uShade / 0.85);
          } else if (plume || stalk) {
            vec3 alb = mix(uCoral * vec3(1., 1.3, 1.1), mix(uCrimson, uCoral, 0.18), smoothstep(uCore, 0.95, sn));
            alb = mix(alb, uWine * 1.6, smoothstep(0.78, 1., sn) * 0.75);
            alb *= 0.8 + 0.4 * hash11(lid * 0.77 + seed * 5.);
            alb = mix(alb * 1.1, alb * vec3(0.8, 0.6, 0.58), vB.y);
            alb = mix(alb, uGold * 0.8, step(0.5, -vStand) * (1. - smoothstep(0.35, 0.5, sn)));   // a spawning street: gold-hearted to mid-length
            vec3 N = normalize(vRight * (X / max(Rp, 0.1)) * 0.9 + fwd * 0.45 + vec3(1e-4, 0.75 - 0.9 * lf + (ros ? 1.2 : 0.), 1e-4));
            float ndl = dot(N, uSunDir), front = max(ndl, 0.), back = max(-ndl, 0.);
            float ao = mix(0.25, 1., smoothstep(0.03, 0.7, sn)) * mix(0.6, 1., a) * mix(1., 0.62, lf * lf);
            ao = mix(ao, mix(0.6, 1., a) * mix(1., 0.62, lf * lf), step(0.5, -vStand));          // and its heart is not occluded
            float vdl = max(dot(-V, uSunDir), 0.);
            vec3 glow = mix(uGlowA, uGlowB, smoothstep(0.15, 0.95, sn)) * (0.75 + 0.5 * hash11(lid * 0.77 + seed * 5.));
            vec3 trans = glow * (0.62 * back + 0.5 * vdl * vdl * vdl);
            float sunX = clamp(X / max(Rp * k, 0.05), -1., 1.) * dot(vRight.xz, uSunDir.xz / max(length(uSunDir.xz), 1e-4));     // +1 on the side turned to the sun
            float sideK = mix(0.5, 1.15, smoothstep(-0.7, 0.5, sunX));
            vec3 lit = uSunCol * sunK * (alb * (0.16 + 0.55 * front) * ao + trans * mix(0.5, 1., ao)) * sideK + alb * fillLight(N.y) * ao * 0.6 * mix(0.8, 1., sideK);
            col = mix(lit, uWine * (0.4 + 0.3 * sunK), clamp((1. - ao) * 0.6 + 0.3 * (1. - smoothstep(-0.9, -0.2, sunX)), 0., 1.));
            col = standTint(col, uCoral, uCrimson, uWine, step(0.5, vStand) * clamp(1. - 2. * uShade / 0.85, 0., 1.));   // an old street deepens what is drawn above toward wine, and has let go of it by half of a cloud's shade
            col.r = min(col.r, 0.9);
          } else discard;
          col = shadeMist(col, vW, uShade);
          gl_FragColor = vec4(min(col, vec3(0.9)), 1.);
          #include <fog_fragment>
        }`,
    });
    const cards = new THREE.Mesh(cardGeo, cardMat); cards.frustumCulled = false; scene.add(cards);
    await ctx.yield();

    // ---- the floor: shell-sand, windrows of fallen filaments, jade pools; far off it paints the canopy itself ----
    const gGeo = new THREE.PlaneGeometry(2700, 2700, 120, 120);
    await ctx.yield();
    gGeo.rotateX(-Math.PI / 2);
    await ctx.yield();
    { const gp = gGeo.attributes.position; for (let i = 0; i < gp.count; i++) { const x = gp.getX(i) + PC[0], z = gp.getZ(i) + PC[1]; gp.setXYZ(i, x, groundY(x, z), z); if (i % 800 === 799) await ctx.yield(); } }
    await ctx.yield();
    const groundMat = new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...SU, uSand: { value: C(look.sand) }, uCoral: { value: P[2] }, uCrimson: { value: P[1] }, uWine: { value: wine }, uIvory: { value: P[0] },
        uPool: { value: C(look.pool) }, uZen: { value: C(look.zenith) }, uHor: { value: C(look.horizon) }, uSpire: { value: new THREE.Vector2(SPIRE.x, SPIRE.z) },
        uCentre: { value: new THREE.Vector2(PC[0], PC[1]) }, uPoolC: { value: poolC } },
      fog: true,
      vertexShader: /* glsl */`
        varying vec3 vW;
        #include <fog_pars_vertex>
        void main() { vW = position; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        ${heroKit.GLSL_COMMON.replace('uniform float uShade, uTime;', 'uniform float uTime; float uShade;')}
        ${SHADE}
        ${GROUND_GLSL}
        ${heroKit.STANDS}
        uniform vec3 uGold;
        uniform vec3 uSand, uCoral, uCrimson, uWine, uIvory, uPool, uZen, uHor; uniform vec2 uSpire, uCentre; uniform vec4 uPoolC;
        varying vec3 vW;
        #include <fog_pars_fragment>
        float segD(vec2 p, vec2 a, vec2 b) { vec2 d = b - a; float t = clamp(dot(p - a, d) / max(dot(d, d), 1.), 0., 1.); return length(p - a - d * t); }
        void main() {
          vec2 p = vW.xz;
          if (length(p - uCentre) > 1235.) discard;
          vec3 sr = shade(p, 0.37);
          float S = sr.x, R = sr.y, sunK = 1. - S;
          uShade = S;
          float dist = length(cameraPosition - vW);
          float near = 1. - smoothstep(14., 40., dist), near2 = 1. - smoothstep(5., 24., dist);
          // sand: fine grain and short broken wind ripples under the bow; larger pale and tawny shapes beyond. It is the quiet
          // ground of the picture: a tone darker than the sunlit side of the pipes that stand on it
          float w1 = vnoise(p * 0.06), w2 = vnoise(p * 0.31 + 7.), w3 = vnoise(p * 0.021 + 3.);
          vec2 pw = vec2(dot(p, uWindDir), dot(p, vec2(-uWindDir.y, uWindDir.x)));
          float grain = (vnoise(p * 7.) * 0.6 + vnoise(p * 17. + 3.) * 0.4 - 0.5) * near2;
          float rip = sin(pw.x * 5.6 + w1 * 9. + w2 * 2.5 + 1.5 * vnoise(vec2(pw.x * 0.8, pw.y * 0.25))) * near * smoothstep(0.3, 0.55, vnoise(vec2(pw.x * 0.22, pw.y * 0.09) + 20.));
          float speck = smoothstep(0.74, 0.82, vnoise(p * 19. + 5.)) * near2;                 // broken filament ends and shell grit
          vec3 alb = uSand * (0.45 + 0.06 * w2 + 0.1 * (w3 - 0.5) + 0.09 * rip + 0.2 * grain) * (1. - 0.3 * speck);
          // windrows of fallen filaments: drifts drawn out along the wind with a crisp scalloped edge and a strand texture combed
          // downwind; bleached rose to straw, two steps paler than the living plumes, only the freshest strands in their colour
          float lit0 = vnoise(vec2(pw.x * 0.045, pw.y * 0.15) + 3.) * 0.58 + vnoise(vec2(pw.x * 0.13, pw.y * 0.4)) * 0.3 + vnoise(p * 0.9) * 0.12;
          float scal = (vnoise(vec2(pw.x * 0.55, pw.y * 1.9)) - 0.5) * 0.09 * (1. - smoothstep(30., 110., dist));
          float litter = smoothstep(0.575, 0.592, lit0 + scal);
          float bankEdge = smoothstep(0.535, 0.575, lit0 + scal) * (1. - litter);                 // the drift's shaded lee edge
          float sfw = fwidth(pw.y * 11.);
          float strand = mix(0.5, vnoise(vec2(pw.x * 0.5, pw.y * 11.)) * 0.65 + vnoise(vec2(pw.x * 1.3 + 9., pw.y * 27.)) * 0.35 * near, 1. - smoothstep(0.35, 1.1, sfw));
          float age = vnoise(p * 0.21 + 11.);
          vec3 lcol = mix(mix(uCoral, uSand, 0.6) * vec3(1., 0.9, 0.94), uSand * vec3(1.06, 0.98, 0.8), smoothstep(0.3, 0.75, age)) * (0.5 + 0.4 * strand);
          lcol = mix(lcol, mix(uCrimson, uCoral, 0.4) * 0.8, smoothstep(0.7, 0.8, strand) * (1. - smoothstep(0.2, 0.5, age)) * 0.7);
          alb = mix(alb, lcol, litter * 0.9) * (1. - 0.28 * bankEdge);
          vec3 N = normalize(vec3(uWindDir.x * 0.3 * rip * (1. - litter) + 0.25 * grain, 1., uWindDir.y * 0.3 * rip * (1. - litter)));
          vec3 col = alb * (uSunCol * sunK * max(dot(N, uSunDir), 0.) + fillLight(1.) * 0.95);
          // in a cloud's shadow the floor goes deep and cool, so that the pale lips of the pipes stand out of it; the drifts keep
          // a little of their red, and the tone is taken in large soft shapes, never ruled
          vec3 tn = mix(uTeal / max(max(uTeal.r, uTeal.g), max(uTeal.b, 1e-3)), vec3(0.5, 0.52, 1.), 0.42);
          float deep = 0.31 * min(1., 0.5 / max(dot(tn, vec3(0.2126, 0.7152, 0.0722)), 0.05));      // a green-heavy tone is taken deeper, so every look's floor is as dark
          col *= mix(vec3(1.), mix(vec3(1.), tn, 0.6 - 0.25 * litter) * deep * (0.92 + 0.22 * w3 + 0.3 * litter + 0.15 * rip), S / 0.85);
          // pools a hand deep with an uneven shore: wet sand, a rose algal mat, then water that is dark looked down into and
          // mirrors the sky and its clouds at a glancing angle
          vec2 pa = p - uPoolC.xy, pb = p - uPoolC.zw;
          float pf = max(poolF(p), 0.95 * max(exp(-dot(pa, pa) / 1500.), exp(-dot(pb, pb) / 1100.))) + 0.07 * (vnoise(p * 0.085 + 13.) - 0.5) + 0.02 * (w2 - 0.5);
          col *= 1. - 0.3 * smoothstep(0.76, 0.85, pf);
          float mat = smoothstep(0.72, 0.8, pf) * (1. - smoothstep(0.84, 0.865, pf));
          col = mix(col, mix(uCoral, uSand, 0.35) * vec3(1., 0.78, 0.86) * (uSunCol * sunK * 0.6 + fillLight(1.) * 0.75) * (0.75 + 0.4 * w2), mat * 0.75 * (0.35 + 0.65 * smoothstep(0.3, 0.6, vnoise(p * 0.4 + 31.))));
          float pool = smoothstep(0.85, 0.862, pf);
          if (pool > 0.) {
            vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.));
            vec2 q = p * 1.1 + vec2(uTime * 0.5, uTime * 0.31);
            vec2 cc = (floor(p / 8.) + 0.5) * 8. + 2.5 * (vec2(hash21(floor(p / 8.)), hash21(floor(p / 8.) + 7.3)) - 0.5);
            float rd = length(p - cc);
            float ring = sin(rd * 5. - uTime * 3.2 + hash21(floor(p / 8.) + 2.1) * 6.28) * exp(-rd * 0.45) * (1. - smoothstep(2.6, 3.4, rd));
            vec2 rdir = (p - cc) / max(rd, 1e-3);
            vec3 Nw = normalize(vec3((vnoise(q) - 0.5) * 0.14 + rdir.x * ring * 0.2, 1., (vnoise(q.yx + 9.) - 0.5) * 0.14 + rdir.y * ring * 0.2));
            vec3 Rf = reflect(-V, Nw);
            float fc = 1. - max(dot(V, Nw), 0.);
            float fr = 0.2 + 0.8 * fc * fc * fc;
            vec3 sky = mix(uHor, uZen, smoothstep(0., 0.7, Rf.y));
            vec2 sp = Rf.xz / max(Rf.y, 0.1) * 0.9 + p * 0.006 + uWindDir * uTime * 0.012;
            float cl = smoothstep(0.5, 0.7, vnoise(sp * 1.2) * 0.62 + vnoise(sp * 3.3 + 5.) * 0.38);
            sky = mix(sky, vec3(1., 0.985, 0.95) * (0.8 + 0.2 * sunK), cl * 0.9);
            vec2 vr = normalize(V.xz + vec2(1e-4)); float acr = dot(p, vec2(-vr.y, vr.x));
            float stem = smoothstep(0.52, 0.62, vnoise(vec2(acr * 0.42, 3.7))) * (1. - smoothstep(0.2, 0.5, Rf.y));
            vec3 wall = mix(mix(uCrimson, uWine, 0.5) * 0.42, uIvory * 0.5, stem) * (0.5 + 0.5 * sunK);
            sky = mix(sky, wall, (1. - smoothstep(0.24, 0.5, Rf.y + 0.08 * vnoise(vec2(acr * 0.3, 9.)))) * 0.85);
            float gl = pow(max(dot(Rf, uSunDir), 0.), 220.) * sunK;
            vec3 body = mix(uPool * 0.5, uPool * 0.2, smoothstep(0.86, 0.96, pf)) * (0.5 + 0.5 * sunK);
            vec3 wcol = mix(body, sky, fr) + uSunCol * gl * 5.;
            wcol = mix(wcol, vec3(0.95, 0.93, 0.88) * (0.5 + 0.5 * sunK), (1. - smoothstep(0.862, 0.872, pf)) * 0.7);           // a pale lapping edge
            col = mix(col, wcol, pool);
          }
          // shade under the open canopy is teal, never grey; in the hollow, where the pipes are short and stand apart, it is
          // only a dapple, so the sun lies on the floor between the plumes and the cloud shadows are drawn on it
          vec2 hs = uTrSeg.zw - uTrSeg.xy;
          float hk = 1. - smoothstep(70., 170., length(p - uTrSeg.xy - hs * clamp(dot(p - uTrSeg.xy, hs) / max(dot(hs, hs), 1.), 0., 1.)));
          float dap = smoothstep(0.42, 0.62, vnoise(p * 0.11 + 40.) * 0.7 + 0.3 * vnoise(p * 0.3 + 9.));
          float dP = min(min(segD(p, vec2(0.), vec2(-4., 690.)), segD(p, vec2(-4., 690.), uSpire)), max(0., length(p - uSpire) - 110.));
          float openK = max(smoothstep(0.83, 0.87, gladeF(p)), 1. - smoothstep(0.75, 1.2, laneF(p))) * smoothstep(48., 62., dP);
          float canopy = (1. - R) * (1. - pool * 0.6) * (1. - openK);
          col = mix(col, uTeal * 1.5 * (0.6 + 0.8 * sunK) + col * 0.22, canopy * 0.8 * (1. - hk));
          col *= mix(vec3(1.), mix(vec3(1.), tn, 0.3) * 0.8, canopy * hk * dap * sunK * smoothstep(40., 90., dist));
          // far off the plateau is painted with its own canopy: red, or ivory where a shadow has shut it
          float paint = smoothstep(150., 480., dP);
          float cell = vnoise(p * 0.19) * 0.6 + vnoise(p * 0.07 + 5.) * 0.4;
          vec3 red = mix(uCrimson, uCoral, 0.25 + 0.5 * cell) * (uSunCol * sunK * (0.42 + 0.3 * cell) + fillLight(1.) * 0.5);
          // the streets in the far paint, by the ground point: an old street lays the plumes' own tint on the paint (let go in a cloud's shade,
          // as theirs is); a spawning street's gold heart is a quarter of the crown
          float stS = standF(p) + 0.12 * (cell - 0.5); vec3 stLive = max(mix(uCrimson, uCoral, 0.25 + 0.5 * cell), vec3(1e-3));
          red = standTint(red, uCoral, uCrimson, uWine, smoothstep(0.75, 0.77, stS) * uStand.w * clamp(1. - 2. * S / 0.85, 0., 1.));
          red *= mix(vec3(1.), mix(stLive, uGold * 0.8, 0.25) / stLive, smoothstep(0.75, 0.77, -stS) * uStand.w);
          red = mix(uWine * (0.5 + 0.5 * sunK), red, 0.35 + 0.65 * smoothstep(380., 800., dP));
          vec3 bare = mix(uIvory, uSand, 0.4) * (uSunCol * sunK * 0.7 + fillLight(1.) * 0.9) * (0.8 + 0.2 * cell);
          vec3 glade = uSand * 0.62 * (uSunCol * sunK * 0.8 + fillLight(1.) * 0.9) * (0.9 + 0.2 * cell);
          col = mix(col, mix(mix(red, bare, R), glade, openK), paint);
          col = shadeMist(col, vW, S * (1. - paint) * 0.4);
          gl_FragColor = vec4(min(col, vec3(4.)), 1.);
          #include <fog_fragment>
        }`,
    });
    const ground = new THREE.Mesh(gGeo, groundMat); ground.frustumCulled = false; scene.add(ground);
    await ctx.yield();

    // ---- on the floor round every near pipe: a crescent of fallen filaments banked against its windward foot, and the cast
    //      shadow of its open plume, which shrinks away as the plume screws down (one shader, two meshes) ----------------
    {
      const decalMat = (kind) => new THREE.ShaderMaterial({
        uniforms: { ...fogU(), ...SU, uKind: { value: kind }, uSand: { value: C(look.sand) }, uCoral: { value: P[2] }, uCrimson: { value: P[1] } },
        fog: true, side: THREE.DoubleSide, depthWrite: kind === 0, transparent: kind === 1, blending: kind === 1 ? THREE.MultiplyBlending : THREE.NormalBlending,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        vertexShader: /* glsl */`
          attribute vec4 iT, iT2, iSize;
          ${SHADE}
          ${GROUND_GLSL}
          uniform float uKind; uniform vec3 uSunDir;
          varying vec2 vQ; varying vec4 vD; varying vec2 vP; varying float uShade;
          #include <fog_pars_vertex>
          void main() {
            vec2 q = vec2(position.x, position.y * 2. - 1.);
            vec3 sr = shade(iT.xz, iT2.y);
            vec2 c, ax, ay; float lift, kOpen = 1. - sr.y * sqrt(max(sr.y, 0.));
            if (uKind < 0.5) {
              float sz = iT2.x * (2.7 + 1.5 * fract(iT2.y * 31.)) + 0.6;
              c = iT.xz - uWindDir * iT2.x * 0.8; ay = uWindDir * sz; ax = vec2(-uWindDir.y, uWindDir.x) * sz; lift = 0.14;
              vD = vec4(iT2.y, iT2.x / sz, sz, 1.);
              if (iT.w + iSize.x < 6.) ax *= 0.;                 // the young have no drift
            } else {
              vec2 sxz = uSunDir.xz / max(uSunDir.y, 0.25);
              float hC = iT.w + iSize.x * 0.6 * kOpen * kOpen, rr = iSize.y * (0.2 + 0.8 * kOpen) * 1.1;
              vec2 sd = sxz / max(length(sxz), 1e-3);
              c = iT.xz - sxz * hC; ay = sd * rr * 1.25; ax = vec2(-sd.y, sd.x) * rr; lift = 0.08;
              vD = vec4(iT2.y, smoothstep(0.03, 0.3, kOpen), iSize.z, 1. - shade(c, 0.37).x / 0.85);
            }
            vec2 pxz = c + ax * q.x + ay * q.y;
            vec3 w = vec3(pxz.x, groundY(pxz) + lift, pxz.y);
            vQ = q; vP = pxz; uShade = shade(pxz, 0.37).x;
            vec4 mvPosition = viewMatrix * vec4(w, 1.);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          ${COMMON}
          uniform float uKind; uniform vec3 uSand, uCoral, uCrimson; uniform vec2 uWindDir;
          varying vec2 vQ; varying vec4 vD; varying vec2 vP;
          #include <fog_pars_fragment>
          void main() {
            vec3 tn = mix(uTeal / max(max(uTeal.r, uTeal.g), max(uTeal.b, 1e-3)), vec3(0.5, 0.52, 1.), 0.42);
            vec3 col;
            if (uKind < 0.5) {
              float seed = vD.x, y0 = vD.y * 0.8;
              float n = vnoise(vP * 1.7 + seed * 9.) - 0.5, r0 = length(vQ * vec2(1., 1.15) + vec2(0., 0.12));
              float horn = length(vQ - vec2(0., y0 + 0.62)) - 0.6;                       // the lee of the pipe is swept bare
              float m = min(0.86 + 0.24 * n - r0, horn + 0.12 * n);
              if (m < 0.) discard;
              float bank = 1. - smoothstep(0.0, 0.75, length(vQ - vec2(0., y0)));            // heaped highest against the foot
              vec2 pw = vec2(dot(vP, uWindDir), dot(vP, vec2(-uWindDir.y, uWindDir.x)));
              float strand = vnoise(vec2(pw.x * 0.6, pw.y * 12.)) * 0.6 + vnoise(vec2(pw.x * 1.5 + 5., pw.y * 30.)) * 0.4;
              strand = mix(0.5, strand, 1. - smoothstep(0.35, 1.1, fwidth(pw.y * 12.)));
              float age = vnoise(vP * 0.3 + seed * 20.);
              vec3 alb = mix(mix(uCoral, uSand, 0.5) * vec3(1., 0.88, 0.93), uSand * vec3(1.06, 0.98, 0.8), smoothstep(0.35, 0.8, age + 0.3 * (1. - bank))) * (0.5 + 0.4 * strand);
              alb = mix(alb, mix(uCrimson, uCoral, 0.35) * 0.85, smoothstep(0.62, 0.74, strand) * bank * 0.75);
              alb *= 1. - 0.35 * (1. - smoothstep(0., 0.07, m));                                  // a crisp shaded edge
              float S = uShade;
              col = alb * (uSunCol * (1. - S) * (0.62 + 0.3 * bank) + fillLight(1.) * 0.95);
              float deep = 0.31 * min(1., 0.5 / max(dot(tn, vec3(0.2126, 0.7152, 0.0722)), 0.05));
              col *= mix(vec3(1.), mix(vec3(1.), tn, 0.4) * deep * 1.35, S / 0.85);
              #ifdef USE_FOG
                col = mix(col, fogColor, 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth));
              #endif
            } else {
              float r = length(vQ), ang = atan(vQ.y, abs(vQ.x) < 1e-5 ? 1e-5 : vQ.x);
              float arm = 0.5 + 0.5 * sin(ang * vD.z * 2. + r * 9. + vD.x * 20. + uTime * 0.157 * vD.z);      // the spiral, turning
              float a = (1. - smoothstep(0.5, 0.96, r + 0.16 * arm)) * vD.y * vD.w * (0.72 + 0.28 * arm);
              col = mix(vec3(1.), mix(vec3(1.), tn, 0.45) * 0.42, a * (1. - uShade / 0.85));
            }
            gl_FragColor = vec4(col, 1.);
          }`,
      });
      for (const kind of [1, 0]) {
        const g = quadGeo();
        g.setAttribute('iT', midTubeGeo.getAttribute('iT')); g.setAttribute('iT2', midTubeGeo.getAttribute('iT2')); g.setAttribute('iSize', midGeo.getAttribute('iSize'));
        g.instanceCount = NMID;
        const m = new THREE.Mesh(g, decalMat(kind)); m.frustumCulled = false; m.renderOrder = kind ? 1 : 0; scene.add(m);
      }
    }
    await ctx.yield();

    // ---- snapped old tube sections lying like fallen columns, some standing as rings ---------------------------
    {
      const fr = rng.fork('fallen'), nF = Math.round(90 * detail), pv = new THREE.Vector3();
      const fGeo = new THREE.CylinderGeometry(1, 1, 1, 14, 1, true);
      const fMat = new THREE.ShaderMaterial({
        uniforms: { ...fogU(), ...SU, uIvory: { value: P[0] } }, side: THREE.DoubleSide, fog: true,
        vertexShader: /* glsl */`
          ${SHADE}
          varying vec3 vN, vW; varying vec2 vUv; varying float uShade, vLen;
          #include <fog_pars_vertex>
          void main() {
            vec4 w = instanceMatrix * vec4(position, 1.);
            vN = normalize(mat3(instanceMatrix) * normal + vec3(0., 1e-5, 0.)); vW = w.xyz; vUv = uv;
            vLen = length(instanceMatrix[1].xyz);
            uShade = shade(w.xz, 0.5).x;
            vec4 mvPosition = viewMatrix * w;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          ${COMMON}
          uniform vec3 uIvory; varying vec3 vN, vW; varying vec2 vUv; varying float vLen;
          #include <fog_pars_fragment>
          void main() {
            vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
            float inside = gl_FrontFacing ? 0. : 1.;
            N = mix(N, -N, inside);
            float rp = vUv.y * vLen / 0.4, rf = fract(rp);
            float rib = smoothstep(0., 0.18, rf) * (1. - smoothstep(0.18, 0.5, rf)) * (1. - smoothstep(0.3, 0.8, fwidth(rp)));
            vec3 alb = uIvory * (0.82 + 0.12 * rib + 0.08 * vnoise(vec2(vUv.x * 14., rp * 0.3)));
            alb = mix(alb, vec3(0.3, 0.52, 0.44), 0.35 * smoothstep(0.4, 0.9, vnoise(vec2(vUv.x * 9. + 3., rp * 0.2))) * (1. - smoothstep(-0.6, 0.2, N.y)));
            vec3 lit = uSunCol * (1. - uShade) * max(dot(N, uSunDir), 0.) * mix(1., 0.25, inside) + fillLight(N.y) * mix(1., 0.55, inside);
            vec3 col = mix(alb * lit, uTeal * (0.7 + 0.8 * fillLight(1.)), inside * 0.5);
            col = shadeMist(col, vW, uShade);
            gl_FragColor = vec4(min(col, vec3(0.95)), 1.);
            #include <fog_fragment>
          }`,
      });
      const fallen = new THREE.InstancedMesh(fGeo, fMat, nF); fallen.frustumCulled = false;
      const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();
      for (let i = 0; i < nF; i++) {
        camAt(uo(fr.range(0.12, 0.43)), pv);
        const x = pv.x + (5 + 42 * Math.pow(fr(), 1.4)) * fr.sign(), z = pv.z + fr.range(-10, 10), r = fr.range(0.55, 1.45);
        const ring = fr.chance(0.28), len = ring ? fr.range(0.6, 2.2) : fr.range(3, 9.5);
        if (ring) e4.set(fr.range(-0.12, 0.12), fr.range(0, TAU), fr.range(-0.12, 0.12));
        else e4.set(Math.PI / 2 + fr.range(-0.07, 0.07), 0, fr.range(0, TAU), 'ZXY');
        q4.setFromEuler(e4); s4.set(r, len, r);
        p4.set(x, groundY(x, z) + (ring ? len * 0.4 : r * 0.8), z);
        if (poolAt(x, z) > 0.8) p4.y = -60;
        fallen.setMatrixAt(i, m4.compose(p4, q4, s4));
      }
      scene.add(fallen);
    }

    await ctx.yield();
    // ---- sky: jade to milky mint, a small white-gold sun, combed cirrus (and the mackerel sky, when it is one) ----
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { uZen: { value: C(look.zenith) }, uMid: { value: C(look.mid) }, uHor: { value: C(look.horizon) }, uHaze: { value: hazeCol },
        uSunDir: SU.uSunDir, uSunCol: SU.uSunCol, uTime: SU.uTime, uWindDir: SU.uWindDir, uMack: { value: weather === 'mackerel' ? 1 : 0 }, uVeil: SU.uVeil,
        uCream: { value: C(look.cloudTop) }, uBase: { value: C(look.cloudBase) }, uBankSeed: { value: vr.range(1, 40) },
        uHead: { value: new THREE.Vector2(Math.sin(SPIRE_ROT + Math.PI), Math.cos(SPIRE_ROT + Math.PI)) } },
      side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
      vertexShader: /* glsl */`varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uZen, uMid, uHor, uHaze, uSunDir, uSunCol, uCream, uBase; uniform float uTime, uMack, uVeil, uBankSeed; uniform vec2 uWindDir, uHead;
        varying vec3 vD;
        float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
          return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
        void main() {
          vec3 d = normalize(vD + vec3(0., 1e-4, 0.));
          float e = d.y;
          vec3 col = mix(mix(uHor, uMid, 0.3), uMid, smoothstep(0.0, 0.24, e));
          col = mix(col, uZen, smoothstep(0.03, 0.42, e));
          col = mix(col, uZen * uZen * 1.05, 0.38 * smoothstep(0.3, 0.8, e));
          col = mix(col, uHaze, 1. - smoothstep(-0.12, 0.03, e));
          float sd = max(dot(d, uSunDir), 0.);
          // high cloud lives on a plane far above
          vec2 uvp = d.xz / max(e + 0.12, 0.05);
          vec2 q = vec2(dot(uvp, uWindDir), dot(uvp, vec2(-uWindDir.y, uWindDir.x)));
          float up = smoothstep(0.02, 0.3, e);
          vec2 qw = q + 0.35 * vec2(vn(q * 0.9), vn(q * 0.9 + 7.));
          float cir = vn(vec2(qw.x * 0.7 - uTime * 0.012, qw.y * 4.)) * vn(vec2(qw.x * 1.9 - uTime * 0.02, qw.y * 9. + 4.));
          cir = smoothstep(0.22, 0.7, cir) * vn(q * 0.7 + 3.) * 0.42 * (1. - smoothstep(2.5, 6., length(q)) * 0.7);
          vec2 m = q * 5.5 - vec2(uTime * 0.05, 0.);
          float mack = smoothstep(0.42, 0.8, vn(m) * 0.6 + 0.4 * vn(m * 2.3 + 9.)) * smoothstep(0.3, 0.6, vn(q * 1.1 + 20.)) * uMack;
          float hi = clamp(cir * (1. - uMack * 0.6) + mack * 0.8 + uVeil * 0.5 * (0.5 + 0.5 * vn(q * 2. + uTime * 0.03)), 0., 1.) * up;
          col = mix(col, uCream * (0.82 + 0.25 * sd * sd), hi);
          // a far bank of cumulus beyond the plateau's rim, where the last leg is heading: a calm jade-grey ground for the ring
          vec2 hz = d.xz / max(length(d.xz), 1e-4);
          float hd = dot(hz, uHead), lat = dot(hz, vec2(-uHead.y, uHead.x));
          float win = smoothstep(0.2, 0.8, hd);
          float sunSide = sign(dot(uSunDir.xz, vec2(-uHead.y, uHead.x)) + 1e-5);
          // heads: three sizes of rounded billow, each lobe with its own height; lit from the sun's side, dark-based
          float topE = -0.03, topL = -0.055;
          for (int i = 0; i < 3; i++) {
            float F = i == 0 ? 4.3 : i == 1 ? 10.1 : 23.9, A = i == 0 ? 0.15 : i == 1 ? 0.066 : 0.028;
            float xl = (lat + 0.11 * (vn(vec2(lat * 4.7 + uBankSeed, 9.5)) - 0.5)) * F + uBankSeed * (1. + float(i) * 1.7) + uTime * 0.0012 * float(i + 1), id = floor(xl), x = fract(xl) * 2. - 1.;
            float hh = 0.22 + 0.78 * h21(vec2(id, float(i) * 7. + floor(uBankSeed)));
            // each size is two interleaved rows of domes, so the heads overlap and there are no slots between them
            float x2 = fract(xl + 0.5) * 2. - 1., hh2 = 0.22 + 0.78 * h21(vec2(floor(xl + 0.5) + 31., float(i) * 7. + floor(uBankSeed)));
            float c1 = sqrt(max(0., 1. - x * x)) * hh, c2 = sqrt(max(0., 1. - x2 * x2)) * hh2 * 0.92;
            topE += win * A * max(c1, c2);
            if (i > 0) topL += win * A * 0.95 * max(c1, c2);
          }
          topE += win * (0.012 * (vn(vec2(lat * 70. + uBankSeed, 2.5)) - 0.5) + 0.02 * (vn(vec2(lat * 31. + uBankSeed, 7.5)) - 0.5));
          float bank = (1. - smoothstep(topE - 0.006, topE, e)) * smoothstep(0.0, 0.12, win);
          // the bank is cumulus: billows inside the silhouette, each lit on the shoulder turned to the sun and melting
          // into a flat darker base; the light is read from a billow field in bearing and elevation, so there is no vertical seam
          vec2 bp = vec2(lat * 6.5 + uBankSeed + uTime * 0.004, e * 27.);
          vec2 bs = bp + vec2(sunSide * 0.3, 0.26);
          float bil = vn(bp) * 0.56 + vn(bp * 2.3 + 5.) * 0.32 + vn(bp * 5.1 + 1.) * 0.12;
          float bil2 = vn(bs) * 0.56 + vn(bs * 2.3 + 5.) * 0.32 + vn(bs * 5.1 + 1.) * 0.12;
          float slope = clamp((bil - bil2) * 3.2 + 0.42, 0., 1.);
          float hK = clamp((e + 0.03) / max(topE + 0.03, 0.02), 0., 1.);                 // 0 at the foot, 1 at the head
          float rimL = smoothstep(topE - 0.03, topE - 0.004, e);                          // the crown of each head catches the sun
          float litK = clamp(smoothstep(0.3, 1., hK) * (0.3 + 0.75 * slope) + 0.25 * rimL * (0.4 + 0.6 * slope) + 0.22 * (slope - 0.5), 0., 1.);
          vec3 bcol = mix(uBase * mix(0.4, 0.6, hK) * (0.86 + 0.28 * bil), uCream * 0.7, litK);
          // a nearer, lower rank of smaller heads stands in front of the bank's dark base, and its foot runs down into the far canopy
          float hL = clamp((e + 0.1) / max(topL + 0.1, 0.02), 0., 1.);
          float litL = clamp(smoothstep(0.45, 1., hL) * (0.25 + 0.6 * slope) + 0.18 * (slope - 0.5), 0., 1.);
          vec3 lcol = mix(uBase * mix(0.5, 0.66, hL) * (0.88 + 0.24 * bil), uCream * 0.6, litL);
          bcol = mix(bcol, lcol, 1. - smoothstep(topL - 0.005, topL, e));
          bcol = mix(bcol, uHaze, 0.06 + 0.16 * (1. - smoothstep(-0.16, -0.03, e)));
          col = mix(col, bcol, bank);
          col += uSunCol * (0.16 * pow(sd, 24.) + 0.5 * pow(sd, 400.)) * (1. - 0.55 * uVeil);
          col += uSunCol * 26. * smoothstep(0.99965, 0.99985, sd) * (1. - 0.75 * uVeil);
          gl_FragColor = vec4(col, 1.);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(4200, 32, 20), skyMat);
    sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);

    await ctx.yield();
    // ---- cumulus: sprite clusters standing exactly up-sun of their shadows -----------------------------------
    const puffs = [];
    clouds.forEach((c, ci) => {
      if (ci >= NCL) return;
      const n = Math.round(clamp(c.a * c.b / 2600, 9, 56));
      for (let i = 0; i < n; i++) {
        const an = cr() * TAU, rr = Math.sqrt(cr()) * 0.82, size = clamp(Math.min(c.a, c.b) * cr.range(0.5, 0.9), 45, 150) * (1 - 0.4 * rr);
        puffs.push(ci, Math.cos(an) * rr * c.a, Math.sin(an) * rr * c.b, cr.range(0, 1) * size * 0.5 * (1 - rr), size, cr());
      }
    });
    const cloudGeo = quadGeo();
    const puffArr = new Float32Array(puffs);
    cloudGeo.setAttribute('iP', new THREE.InstancedBufferAttribute(puffArr.filter((_, k) => k % 6 < 3), 3));
    cloudGeo.setAttribute('iP2', new THREE.InstancedBufferAttribute(puffArr.filter((_, i) => i % 6 >= 3), 3));
    cloudGeo.instanceCount = puffs.length / 6;
    const cloudMat = new THREE.ShaderMaterial({
      uniforms: { uClA: SU.uClA, uWindDir: SU.uWindDir, uSunDir: SU.uSunDir, uSunCol: SU.uSunCol, uTime: SU.uTime, uTop: { value: C(look.cloudTop) }, uBase: { value: C(look.cloudBase) },
        uHaze: { value: hazeCol }, uAltC: { value: Array.from({ length: NCL }, (_, i) => clouds[i]?.alt ?? 500) } },
      transparent: true, depthWrite: false, fog: false,
      vertexShader: /* glsl */`
        attribute vec3 iP, iP2;
        uniform vec4 uClA[${NCL}]; uniform vec2 uWindDir; uniform vec3 uSunDir; uniform float uAltC[${NCL}], uTime;
        varying vec2 vQ, vL; varying vec3 vK;
        void main() {
          vec4 A = uClA[int(iP.x + 0.5)]; float uAlt = uAltC[int(iP.x + 0.5)];
          vec2 c = A.xy + uWindDir * iP.y + vec2(-uWindDir.y, uWindDir.x) * iP.z;
          vec3 w = vec3(c.x, 0., c.y) + uSunDir * (uAlt / max(uSunDir.y, 0.2)) + vec3(0., iP2.x, 0.);
          vec4 mv = viewMatrix * vec4(w, 1.);
          vec2 q = vec2(position.x, position.y * 2. - 1.);
          mv.xy += q * iP2.y * vec2(1., 0.72);
          vQ = q; vK = vec3(iP2.z, iP2.x / max(iP2.y, 1.), length(mv.xyz));
          vL = vec2((iP2.x + q.y * iP2.y * 0.72) / max(0.5 * min(A.z, A.w), 20.), dot(c - A.xy, uSunDir.xz) / max(max(A.z, A.w), 20.));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uTop, uBase, uHaze, uSunCol, uSunDir; uniform float uTime;
        varying vec2 vQ, vL; varying vec3 vK;
        float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
          return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
        void main() {
          vec2 s = vQ + vK.x * 31.;
          float n = vn(s * 1.6 + uTime * 0.02) * 0.6 + vn(s * 4.1 - uTime * 0.03) * 0.4;
          float d = length(vQ * vec2(1., 1.1 + 1.3 * step(vQ.y, 0.)));
          float a = 1. - smoothstep(0.52, 0.86, d + (n - 0.5) * 0.7);
          // one cloud, not a pile of puffs: its base is flat and in its own shade, its top and its sunward side are lit
          a *= smoothstep(-0.2, 0.02, vL.x + (n - 0.5) * 0.12);
          if (a < 0.01) discard;
          float bil = smoothstep(0.25, 0.8, n + 0.5 * vQ.y);
          float lift = clamp(smoothstep(0.02, 0.62, vL.x + 0.42 * vQ.y + (n - 0.5) * 0.4) * (0.5 + 0.5 * bil) + 0.35 * vL.y, 0., 1.);
          // under a low sun the base is lit warm from the side, never a dark smudge
          vec3 col = mix(mix(uBase * 0.62, mix(uBase, uTop * uSunCol, 0.3) * 0.76, 1. - smoothstep(0.35, 0.7, uSunDir.y)), uTop * uSunCol * 0.9, lift);
          float f = 1. - exp(-vK.z * vK.z * 2.4e-7);
          col = mix(col, uHaze, f * 0.7);
          gl_FragColor = vec4(col, a * (1. - f * 0.4));
        }`,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat); cloudMesh.frustumCulled = false; cloudMesh.renderOrder = -5; scene.add(cloudMesh);
    await ctx.yield();

    // ---- gold motes streaming on the wind (a box that wraps round the camera) ---------------------------------
    const nMote = Math.round((spawning ? 1100 : 620) * detail);
    const moteGeo = quadGeo(); const mArr = new Float32Array(nMote * 4); const mr = rng.fork('motes');
    for (let i = 0; i < nMote * 4; i++) mArr[i] = mr();
    instAttr(moteGeo, 'iM', mArr, 4); moteGeo.instanceCount = nMote;
    const moteMat = new THREE.ShaderMaterial({
      uniforms: { uTime: SU.uTime, uRes: SU.uRes, uWindDir: SU.uWindDir, uGold: { value: P[3] }, uK: { value: 1 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */`
        attribute vec4 iM; uniform float uTime, uK; uniform vec2 uRes, uWindDir;
        varying vec2 vQ; varying float vA;
        void main() {
          vec3 B = vec3(120., 56., 120.);
          vec3 b = iM.xyz * B + vec3(uWindDir.x, 0.05, uWindDir.y) * uTime * (5. + 3. * iM.w);
          b += vec3(sin(uTime * 0.7 + iM.w * 40.), sin(uTime * 0.9 + iM.w * 17.) * 0.7, cos(uTime * 0.6 + iM.w * 29.)) * 1.3;
          vec3 p = mod(b - cameraPosition + 0.5 * B, B) - 0.5 * B + cameraPosition;
          vec4 mv = viewMatrix * vec4(p, 1.);
          float dist = max(-mv.z, 0.1);
          float minW = dist * 3.2 / max(uRes.y * projectionMatrix[1][1], 1.);
          float size = max(0.09 + 0.07 * iM.w, minW);
          vQ = vec2(position.x, position.y * 2. - 1.);
          mv.xy += vQ * size;
          float tw = 0.5 + 0.5 * sin(uTime * (1.5 + 2.5 * iM.w) + iM.w * 60.);
          vA = uK * (0.35 + 0.65 * tw) * smoothstep(2., 7., dist) * (1. - smoothstep(42., 58., dist)) * min(1., (0.09 + 0.07 * iM.w) / size + 0.3);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uGold; varying vec2 vQ; varying float vA;
        void main() { float d = dot(vQ, vQ); float a = (1. - smoothstep(0.05, 1., d)) * vA; gl_FragColor = vec4(uGold * 3.4 * a, 1.); }`,
    });
    const motes = new THREE.Mesh(moteGeo, moteMat); motes.frustumCulled = false; motes.renderOrder = 6; scene.add(motes);

    await ctx.yield();
    // ---- fallen filaments skittering over the sand on the wind ---------------------------------------------
    const nWisp = Math.round(240 * detail);
    const wispGeo = quadGeo(); const wArr = new Float32Array(nWisp * 4);
    for (let i = 0; i < nWisp * 4; i++) wArr[i] = mr();
    instAttr(wispGeo, 'iM', wArr, 4); wispGeo.instanceCount = nWisp;
    const wispMat = new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...SU, uCrimson: { value: P[1] }, uCoral: { value: P[2] }, uSand: { value: C(look.sand) } }, side: THREE.DoubleSide, fog: true,
      vertexShader: /* glsl */`
        attribute vec4 iM;
        ${SHADE}
        ${GROUND_GLSL}
        uniform float uTime; uniform vec2 uRes; uniform vec3 uCrimson, uCoral, uSand;
        varying vec3 vC; varying float uShade;
        #include <fog_pars_vertex>
        void main() {
          vec2 B = vec2(110., 110.);
          float sp = 2.5 + 5. * iM.w, gust = 0.6 + 0.4 * sin(uTime * 0.5 + iM.z * 20.);
          vec2 b = iM.xy * B + uWindDir * (uTime * sp * gust + 4. * sin(uTime * 0.37 + iM.w * 30.));
          vec2 pxz = mod(b - cameraPosition.xz + 0.5 * B, B) - 0.5 * B + cameraPosition.xz;
          float hop = abs(sin(uTime * (1.3 + iM.z) + iM.w * 50.));
          vec3 c = vec3(pxz.x, groundY(pxz) + 0.12 + hop * hop * (0.3 + 1.6 * iM.z * iM.z), pxz.y);
          float ang = iM.w * 6.28 + uTime * (1.5 + 2. * iM.z) * (iM.z > 0.5 ? 1. : -1.);
          vec4 mvPosition = viewMatrix * vec4(c, 1.);
          float dist = max(-mvPosition.z, 0.1);
          float px = dist * 2. / max(uRes.y * projectionMatrix[1][1], 1.);
          vec2 q = vec2(position.x * (0.3 + 0.5 * iM.z), (position.y - 0.5) * max(0.05, 1.7 * px));
          mvPosition.xy += mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * q * (1. - smoothstep(60., 75., dist));
          vC = mix(uCrimson, mix(uCoral, uSand, 0.5), iM.w * iM.w);
          uShade = shade(pxz, iM.w).x;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        ${COMMON}
        varying vec3 vC;
        #include <fog_pars_fragment>
        void main() {
          gl_FragColor = vec4(min(vC * (uSunCol * (1. - uShade) * 0.75 + fillLight(1.) * 0.8), vec3(0.9)), 1.);
          #include <fog_fragment>
        }`,
    });
    const wisps = new THREE.Mesh(wispGeo, wispMat); wisps.frustumCulled = false; scene.add(wisps);

    await ctx.yield();
    // ---- every pipe puffs mist after its plume has gone down ------------------------------------------------------
    const mistGeo = quadGeo();
    mistGeo.setAttribute('iRoot', midGeo.getAttribute('iRoot')); mistGeo.setAttribute('iSize', midGeo.getAttribute('iSize'));
    mistGeo.instanceCount = NMID;
    const mistMat = new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...SU, uMint: { value: P[6] } }, transparent: true, depthWrite: false, fog: true,
      vertexShader: /* glsl */`
        attribute vec3 iRoot; attribute vec4 iSize;
        ${SHADE}
        uniform vec3 uCamP, uCamT; uniform float uCamSpeed, uTime;
        varying vec2 vQ; varying vec3 vA; varying float uShade;
        #include <fog_pars_vertex>
        void main() {
          float seed = iSize.w;
          vec3 sr = shade(iRoot.xz, seed);
          vec3 cc = iRoot + vec3(0., iSize.x * 0.5, 0.) - uCamP;
          float al = dot(cc, uCamT), perp = length(cc - al * uCamT);
          float tc = ((18. - al) / max(uCamSpeed, 1.) - 0.5) / 1.5;
          float puff = max(sr.z, (1. - smoothstep(8., 11.5, perp)) * smoothstep(0., 0.25, tc) * (1. - smoothstep(0.45, 1., tc)));
          float age = fract(uTime * 0.45 + seed * 7.);
          vec3 c = iRoot + vec3(0., 0.8 + age * 6.5, 0.) + vec3(uWindDir.x, 0., uWindDir.y) * age * age * 5.;
          float size = (0.9 + age * 2.3) * (0.8 + 0.5 * fract(seed * 13.));
          vQ = vec2(position.x, position.y * 2. - 1.);
          vec4 mvPosition = viewMatrix * vec4(c, 1.);
          mvPosition.xy += vQ * size * step(0.004, puff);
          // one small bright breath from a mouth whose plume has just gone down; never a veil in front of the lens
          vA = vec3(puff * sin(3.14159 * age) * smoothstep(9., 22., length(mvPosition.xyz)), seed, age); uShade = sr.x;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        ${COMMON}
        uniform vec3 uMint; varying vec2 vQ; varying vec3 vA;
        #include <fog_pars_fragment>
        void main() {
          float d = length(vQ);
          float n = vnoise(vQ * 2.2 + vA.y * 30. + vec2(0., -uTime * 0.3)) * 0.6 + vnoise(vQ * 5. + vA.y * 11.) * 0.4;
          float a = (1. - smoothstep(0.35, 0.95, d + (n - 0.5) * 0.5)) * vA.x * 0.62;
          if (a < 0.004) discard;
          vec3 col = uMint * (uSunCol * (1. - uShade) * (0.75 + 0.4 * n) + fillLight(0.6) * 1.35);
          gl_FragColor = vec4(col, a);
          #include <fog_fragment>
        }`,
    });
    const mist = new THREE.Mesh(mistGeo, mistMat); mist.frustumCulled = false; mist.renderOrder = 4; scene.add(mist);
    await ctx.yield();

    // ---- skysails: white gliders, a kite body, two pairs of long ribbed wings, a forked ribbon tail ---------------
    const NB = nFlightBirds * 2 + 12;                              // two cruising flights, six perched, six escorts
    const sPos = [], sK = [], sIdx = [], sNor = [];
    const sv = (x, y, z, part, t, v, nx = 0, ny = 1, nz = 0) => { sPos.push(x, y, z); sK.push(part, t, v); sNor.push(nx, ny, nz); return sPos.length / 3 - 1; };
    {
      // one animal: a plump spindle of a body with a neck and a rounded head, a keel under the belly, two pairs of pointed
      // batten-ribbed wings rooted inside it and a forked ribbon tail
      const prof = [[-2.3, 0.03], [-1.75, 0.27], [-1.0, 0.47], [-0.2, 0.61], [0.5, 0.65], [1.1, 0.53], [1.6, 0.35], [2.0, 0.41], [2.35, 0.45], [2.7, 0.31], [2.95, 0.03]];
      const NA = 8, rAt = (z) => { for (let i = 1; i < prof.length; i++) if (z <= prof[i][0]) { const a = prof[i - 1], b = prof[i]; return lerp(a[1], b[1], (z - a[0]) / (b[0] - a[0])); } return 0.03; };
      prof.forEach(([z, r], i) => {
        const a = prof[Math.max(0, i - 1)], b = prof[Math.min(prof.length - 1, i + 1)], sl0 = (b[1] - a[1]) / (b[0] - a[0]);
        for (let j = 0; j <= NA; j++) {
          const th = (j / NA) * TAU, c = Math.cos(th), s = Math.sin(th), nl = Math.hypot(c / 1.2, s / 0.85, sl0) || 1;
          sv(c * r * 1.2, s * r * 0.85 - 0.04, z, 0, i / (prof.length - 1), j / NA, c / 1.2 / nl, s / 0.85 / nl, -sl0 / nl);
        }
      });
      for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < NA; j++) { const p = i * (NA + 1) + j, q = p + NA + 1; sIdx.push(p, q, p + 1, p + 1, q, q + 1); }
      // the keel: a thin fin hanging under the belly
      { let prev = null;
        for (let i = 0; i <= 6; i++) {
          const s = i / 6, z = lerp(1.25, -1.7, s), yb = -0.85 * rAt(z) + 0.06, dep = 0.95 * Math.sin(Math.PI * Math.pow(s, 0.8)) * (1 - 0.3 * s);
          const a = sv(0, yb, z, 4, s, 0, 1, 0, 0), b = sv(0, yb - dep, z - 0.35 * dep, 4, s, 1, 1, 0, 0);
          if (prev) sIdx.push(prev[0], prev[1], a, a, prev[1], b);
          prev = [a, b];
        } }
      const wing = (side, part, z0, span, sweep, chord) => {
        let prev = null;
        for (let i = 0; i <= 8; i++) {
          const t = i / 8, x = side * (0.3 + t * span), zc = z0 + sweep * t, ch = chord * Math.pow(1 - t, 0.8) + 0.05;
          const a = sv(x, 0.05, zc + ch * 0.36, part, t, 0), b = sv(x, 0.05, zc - ch * 0.64, part, t, 1);
          if (prev) sIdx.push(prev[0], prev[1], a, a, prev[1], b);
          prev = [a, b];
        }
      };
      for (const s of [-1, 1]) { wing(s, 1, 0.75, 3.0, 0.55, 2.1); wing(s, 2, -0.8, 2.2, -1.15, 1.55); }
      for (const s of [-1, 1]) {
        let prev = null;
        for (let i = 0; i <= 10; i++) {
          const t = i / 10, x = s * (0.1 + 0.75 * t * t), z = -1.9 - t * 6, w = 0.3 * (1 - 0.65 * t) + 0.05;
          const a = sv(x - w, 0, z, 3, t, 0), b = sv(x + w, 0, z, 3, t, 1);
          if (prev) sIdx.push(prev[0], prev[1], a, a, prev[1], b);
          prev = [a, b];
        }
      }
    }
    const sailGeo = new THREE.InstancedBufferGeometry();
    sailGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3)); sailGeo.setAttribute('aK', new THREE.Float32BufferAttribute(sK, 3)); sailGeo.setAttribute('aN', new THREE.Float32BufferAttribute(sNor, 3)); sailGeo.setIndex(sIdx);
    const bM = new Float32Array(NB * 16), bX = new Float32Array(NB * 4);
    const bMAttr = new THREE.InstancedInterleavedBuffer(bM, 16); bMAttr.setUsage(THREE.DynamicDrawUsage);
    for (let k = 0; k < 4; k++) sailGeo.setAttribute('iM' + k, new THREE.InterleavedBufferAttribute(bMAttr, 4, k * 4));
    const bXAttr = instAttr(sailGeo, 'iX', bX, 4, true);
    sailGeo.instanceCount = NB;
    const sailMat = new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...SU, uWhite: { value: P[6] } }, side: THREE.DoubleSide, fog: true,
      vertexShader: /* glsl */`
        attribute vec3 aK, aN; attribute vec4 iM0, iM1, iM2, iM3, iX;
        ${SHADE}
        uniform float uTime;
        varying vec3 vK, vW, vN; varying float uShade; varying vec3 vUp;
        #include <fog_pars_vertex>
        void main() {
          mat4 M = mat4(iM0, iM1, iM2, iM3);
          float part = aK.x, t = aK.y, seed = iX.x, fold = iX.z;
          vec3 p = position;
          float ph = uTime * (2.1 + seed) + seed * 40.;
          if (part > 0.5 && part < 2.5) {
            float lag = part > 1.5 ? 1.1 : 0.;
            float flap = iX.y * sin(ph - lag - t * 1.4) * (0.25 + 0.75 * t) * t * (part > 1.5 ? 0.75 : 1.);
            float lift = 0.32 * t + 0.5 * t * t + flap;                                   // held in a shallow V: a light side and a shaded side at once
            p.y += mix(lift, (part > 1.5 ? 0.3 : 1.9) * t, fold) * abs(p.x) * 0.42;      // perched: the fore pair raised, the hind pair spread
            p.x *= mix(1. - 0.1 * flap * flap, 0.42, fold);
          } else if (part > 2.5 && part < 3.5) {
            p.y += t * (0.5 * sin(ph * 2.3 - t * 7.) * (0.3 + t) - 2.2 * t * fold);
            p.x += t * 0.35 * sin(ph * 1.7 - t * 5. + seed * 9.);
            p.z = mix(p.z, -1.9 - t * 2.5, fold);
          } else if (part < 0.5) {
            p.y += 0.05 * sin(ph - 0.6) * iX.y;                                           // the body rides the wing beat
          }
          vec4 w = M * vec4(p, 1.);
          vK = aK; vW = w.xyz; vUp = normalize(M[1].xyz + vec3(0., 1e-4, 0.));
          vN = mat3(M) * aN;
          uShade = shade(w.xz, seed).x;
          vec4 mvPosition = viewMatrix * w;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        ${COMMON}
        uniform vec3 uWhite; varying vec3 vK, vW, vUp, vN;
        #include <fog_pars_fragment>
        void main() {
          vec3 dx = dFdx(vW), dy = dFdy(vW);
          vec3 Ng = cross(dx, dy); Ng = Ng / max(length(Ng), 1e-9);
          vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.));
          float part = vK.x, t = vK.y, v = vK.z;
          float bodyK = 1. - step(0.5, part), wingK = step(0.5, part) * step(part, 2.5), tailK = step(2.5, part) * step(part, 3.5), keelK = step(3.5, part);
          // N faces the eye; topK says whether the eye sees the animal's upper side (near-white) or its underside (the shade colour)
          vec3 N; float topK;
          if (bodyK > 0.5) {
            N = normalize(vN + vec3(0., 1e-5, 0.)); topK = smoothstep(-0.3, 0.25, dot(N, vUp));
          } else {
            vec3 Nt = dot(Ng, vUp) < 0. ? -Ng : Ng;
            float see = dot(Nt, V); topK = step(0., see); N = see < 0. ? -Nt : Nt;
          }
          vec3 tn = uTeal / max(max(uTeal.r, uTeal.g), max(uTeal.b, 1e-3));
          vec3 under = mix(tn, uWhite, 0.74) * 0.78;
          // wings: six battens across each, a darker leading spar, dark tips
          float rc = t * 6.4 + 0.5 * v, rw = fwidth(rc);
          float rib = wingK * (1. - smoothstep(0.05, 0.05 + max(rw, 0.04), abs(fract(rc) - 0.5))) * (1. - smoothstep(0.35, 0.9, rw));
          float spar = wingK * (1. - smoothstep(0.0, 0.12, v));
          float tipK = wingK * smoothstep(0.66, 0.9, t + 0.12 * (v - 0.5));
          // body: a dark stripe down the back, a dark cap on the head, a pale throat
          float back = 1. - smoothstep(0.035, 0.085, abs(v - 0.25));
          float cap = smoothstep(0.76, 0.82, t) * smoothstep(-0.1, 0.35, dot(N, vUp));
          vec3 top = uWhite * 0.92;
          vec3 alb = mix(under, top, topK);
          alb = mix(alb, under * 0.62, wingK * max(tipK, max(spar * 0.6, rib * mix(0.75, 0.3, topK))));
          alb = mix(alb, under * 0.55, bodyK * max(back * 0.85 * step(t, 0.78), cap * 0.8));
          alb = mix(alb, under * 0.8, keelK);
          alb = mix(alb, mix(under * 0.9, top, 0.5 + 0.5 * sin(t * 19.)), tailK * 0.85);            // the ribbon tail is banded light and dark
          float sunK = 1. - 0.6 * uShade;        // they ride high: the shadow only half takes them
          float ndl = dot(N, uSunDir), front = max(ndl, 0.), backL = max(-ndl, 0.);
          vec3 lit = uSunCol * sunK * mix(0.1 + 0.9 * front, 0.4 + 0.6 * front, topK) * mix(1., 0.8, bodyK) + fillLightS(N.y, 0.) * mix(1.1, 0.9, topK) + uSunCol * 0.12 * (1. - topK);
          vec3 col = alb * lit;
          // the sun through the membrane: a warm glow on the side turned from it, the battens dark against it
          col += uSunCol * vec3(1., 0.8, 0.56) * sunK * backL * 0.5 * (wingK + 0.6 * tailK) * (1. - rib) * (1. - tipK) * mix(1., 0.55, topK);
          gl_FragColor = vec4(min(col * 1.08, vec3(1.1)), 1.);
          #include <fog_fragment>
        }`,
    });
    const sails = new THREE.Mesh(sailGeo, sailMat); sails.frustumCulled = false; scene.add(sails);
    await ctx.yield();

    await ctx.yield();
    // ---- the cast's choreography (all from u) -----------------------------------------------------------------------
    const UP = new THREE.Vector3(0, 1, 0), bm = new THREE.Matrix4(), bR = new THREE.Vector3(), bU = new THREE.Vector3(), bF = new THREE.Vector3(), bP = new THREE.Vector3();
    const tA = new THREE.Vector3(), tB = new THREE.Vector3(), tC = new THREE.Vector3(), tD = new THREE.Vector3();
    const br = rng.fork('birds'); const bSeed = Array.from({ length: NB }, () => br());
    const putBird = (i, pos, fwd, bank, scale, flap, fold) => {
      bF.copy(fwd).normalize(); bR.crossVectors(UP, bF); if (bR.lengthSq() < 1e-6) bR.set(1, 0, 0); bR.normalize();
      bU.crossVectors(bF, bR).multiplyScalar(Math.cos(bank)).addScaledVector(bR, Math.sin(bank)).normalize(); bR.crossVectors(bU, bF);
      bm.makeBasis(bR, bU, bF).scale(tC.set(scale, scale, scale)).setPosition(pos); bm.toArray(bM, i * 16);
      bX[i * 4] = bSeed[i]; bX[i * 4 + 1] = flap; bX[i * 4 + 2] = fold; bX[i * 4 + 3] = 0;
    };
    const h0 = new THREE.Vector3(-0.75, 0, 0.66).normalize(), h1 = new THREE.Vector3(-0.9, 0, 0.44).normalize();
    const cross1 = camAt(0.646), T1b = 0.61 * DURATION;
    const canopyTop = 38;
    // how far a bird flying along f must roll for its back to be turned to the camera (-1..1): they show us the white side
    const camNow = new THREE.Vector3();
    const towardCam = (pos, f) => { const cx = camNow.x - pos.x, cz = camNow.z - pos.z, l = Math.hypot(cx, cz) * Math.hypot(f.x, f.z); return l > 1e-3 ? (f.z * cx - f.x * cz) / l : 0; };
    const updateBirds = (u, time) => {
      const T = u * DURATION; let di = 0, bi = 0;
      path.pointAt(u, camNow);
      for (let f = 0; f < 2; f++) {
        const h = f ? h1 : h0;
        for (let j = 0; j < nFlightBirds; j++, bi++) {
          const sd = bSeed[bi];
          if (f === 0) bP.set(34, 64, 262).addScaledVector(h, 14 * T - 9 * j);      // the first flight crosses the first cloud's shadow, white on the dark clearing
          else bP.set(cross1.x, cross1.y - 15, cross1.z + 6).addScaledVector(h, 14 * (T - T1b) + 9 - Math.min(10, 58 / (nFlightBirds - 1)) * (j - (nFlightBirds - 1) * 0.5));      // the second flight crosses close ahead of the bow at u 0.61
          const lat = f ? (j & 1 ? 7 : -7) + (sd - 0.5) * 3 : (sd - 0.5) * 5;      // the crossing flight flies in two staggered files, so no two overlap
          bP.x += h.z * lat; bP.z -= h.x * lat;
          bP.y += Math.sin(time * 0.7 + sd * 20) * 0.8 + (f ? ((j % 3) - 1) * 3.4 : (sd - 0.5) * 3);
          putBird(bi, bP, h, 0.12 * Math.sin(time * 0.5 + sd * 30) + (f ? 0.5 * towardCam(bP, h) : 0), f ? 1.6 : 1.15, 0.55, 0);
          if (di < NDISC) { const k = (bP.y - canopyTop) / sunDir.y; SU.uDisc.value[di++].set(bP.x - sunDir.x * k, bP.z - sunDir.z * k, h.x, h.z); }
        }
      }
      for (; di < NDISC; di++) SU.uDisc.value[di].set(1e5, 1e5, 1, 0);
      // perched on bare lips in the clearing; they lift off when the sun comes back
      for (let j = 0; j < 6; j++, bi++) {
        const t = perches[j];
        if (!t) { putBird(bi, bP.set(0, -500, 0), h0, 0, 0.001, 0, 1); continue; }
        const lift = smoothstep(t.pu - 0.006, t.pu + 0.06, u), sd = bSeed[bi];        // each lifts off as we come up to it, and is up and away downwind before we pass its perch
        tA.set(windDir.x, 0, windDir.y).applyAxisAngle(UP, (sd - 0.5) * 1.6);
        bP.set(t.x, t.y + t.H + 2.1, t.z).addScaledVector(tA, 75 * lift * lift).addScaledVector(UP, 46 * lift * (2 - lift));
        // perched, the wings are held half open in a V (a cormorant drying itself), so the animal is read at once
        putBird(bi, bP, tB.copy(tA).addScaledVector(UP, 0.5 * lift * (1 - lift)), 0, 2.0, 0.25 + 1.05 * smoothstep(0, 0.2, lift), 0.55 * (1 - smoothstep(0, 0.12, lift)));
      }
      // six escorts on the last leg: three to a side, carving slow S-turns a little ahead of us so that their wings
      // tilt to the eye and read as kites, level with the ring; they peel away round the master pipes at the end
      const arrive = smoothstep(ud(230), ud(140), u), leave = smoothstep(ud(40), ud(6), u);
      const ringY = hero.object.position.y + 150;
      for (let j = 0; j < 6; j++, bi++) {
        // each keeps a station of its own beside the master pipes and wheels slowly there, so no two overlap and each shows
        // its light back and its shaded belly in turn
        const side = j & 1 ? 1 : -1, row = j >> 1;
        const ph = side * (time * 0.5 + row * TAU / 3) + j * 0.4;
        const out = 46 * (1 - arrive) * (1 - arrive) + 34 * leave * leave;
        tA.set(SPIRE.x + side * (22 + (row === 1 ? 6 : 0) + out), ringY + 8.5 * (1 - row) - 1 + 40 * (1 - arrive) * (1 - arrive) + 14 * leave, SPIRE.z - 9 + 5 * row);
        bP.set(tA.x + Math.cos(ph) * 2.8, tA.y + 1.2 * Math.sin(ph * 0.5 + j), tA.z + Math.sin(ph) * 6.5);
        tC.set(-Math.sin(ph) * side * 2.8, 0.3 * Math.cos(ph * 0.5 + j) * side, Math.cos(ph) * side * 6.5);
        putBird(bi, bP, tC, 0.35 * side * (j & 2 ? 1 : -1) + 0.25 * towardCam(bP, tC), arrive > 0.001 ? 1.8 : 0.001, 0.22, 0);
      }
      bMAttr.needsUpdate = true; bXAttr.needsUpdate = true;
    };
    updateBirds(0, 0);

    await ctx.yield();
    const plumeCentre = toWorld(new THREE.Vector3(0, 198, 0)), ringCentre = toWorld(new THREE.Vector3(0, 150, 0)), gazeAt = new THREE.Vector3(), gazeLow = new THREE.Vector3(), gazeFloor = new THREE.Vector3(), gazeEntry = new THREE.Vector3(), gazeDive = new THREE.Vector3(), entryCloud = clouds.find((c) => c.entry);
    const res = new THREE.Vector2(), camS = { S: 0, R: 0 }, cp = new THREE.Vector3(), ct = new THREE.Vector3();
    const duration = Math.round(path.length / 28);
    return {
      scene, path, duration,
      // linger in the hollow, where the plumes shut and unfurl round us
      pace: (u) => 1 - 0.26 * smoothstep(0.27, 0.34, u) * (1 - smoothstep(0.44, 0.52, u)),
      title: look.key === 'crimson' ? 'The Flinching Forest' : look.key === 'saffron' ? 'The Flinching Forest, Saffron Day' : 'The Flinching Forest, White Bloom',
      camera: { fov: 62, near: 0.3, far: 5000, lookAhead: 22, sway: 0.6, bank: 0.55 },
      pois: [
        { at: (time, u) => { cloudPos(entryCloud, Math.min(u, 0.1) * DURATION, gazeEntry); gazeEntry.x = gazeEntry.x * 0.5 + 6; gazeEntry.z += 25; gazeEntry.y = 0; return gazeEntry; }, from: 0.032, to: 0.17, weight: 0.6, fade: 0.27 },
        // down the dive the Spire stands whole at the top of the picture, the hollow below it
        { at: (time, u) => gazeDive.copy(ringCentre).setY(105), from: 0.115, to: 0.33, weight: 0.5, fade: 0.3 },
        // in the hollow the gaze dips a little, so the dark floor and its pools hold the lower two thirds of the frame
        { at: (time, u) => path.pointAt(Math.min(1, u + 70 / path.length), gazeFloor).setY(-8), from: 0.28, to: 0.6, weight: 0.3, fade: 0.2 },
        { at: (time, u) => gazeLow.copy(ringCentre).setY(lerp(150, 158, smoothstep(ud(340), ud(210), u))), from: uo(0.4), to: ud(170), weight: 0.55 },
        { at: (time, u) => gazeAt.copy(ringCentre).setY(lerp(lerp(150, 127, smoothstep(ud(255), ud(165), u)), ringCentre.y + 1, smoothstep(ud(160), ud(60), u))), from: ud(300), to: 0.975, weight: 0.8, fade: 0.14 },
      ],
      portal: { shape: 'circle', radius: 7, color: look.pal[6], glow: 1 },
      post: { exposure: 0.93, bloom: { strength: 0.32, radius: 0.6, threshold: 0.96 },
        grade: { saturation: 1.08, contrast: 1.1, tint: '#ffffff', shadowTint: '#06181a', vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none',
      style: 'none',
      update(dt, time, camera, u) {
        const T = u * DURATION;
        setSources(T); setTrain(time);
        SU.uTime.value = time;
        renderer.getDrawingBufferSize(res); SU.uRes.value.copy(res);
        path.pointAt(u, cp); path.tangentAt(u, ct);
        SU.uCamP.value.copy(cp); SU.uCamT.value.copy(ct);
        const veil = rare ? smoothstep(uo(0.425), uo(0.455), u) * (1 - smoothstep(uo(0.475), uo(0.515), u)) : 0;
        SU.uVeil.value = veil;
        fillSlots(u);
        updateBirds(u, time);
        // the Spire's cue: the Follower's shade climbs it, the terraces go white, then the two great plumes screw down
        const fade = 1 - 0.3 * smoothstep(0.975, 1, u);
        hero.setFlinch(smoothstep(ud(262), ud(168), u), 0.8 * smoothstep(ud(180), ud(108), u), 0.8 * smoothstep(ud(172), ud(100), u),
          smoothstep(ud(122), ud(92), u) * fade, smoothstep(ud(114), ud(84), u) * fade);
        // the shade is a front that climbs the Spire: its foot when the ring is 235 m ahead, the terraces by 118 m, where it
        // waits under the mouths while the great plumes, still sun-struck, screw down into it; then it lets go, as the
        // Follower passes, and the bare ring stands in returning sun
        hero.uniforms.uShade.value = veil > 0.01 ? 0.51 * veil : 0.78 * (1 - smoothstep(ud(116), ud(84), u));
        hero.uniforms.uShadeY.value = veil > 0.01 ? 400 : u < ud(165) ? lerp(-30, 138, smoothstep(ud(283), ud(165), u)) : lerp(138, 300, smoothstep(ud(140), ud(98), u));
        hero.uniforms.uRingGlow.value = smoothstep(ud(420), ud(300), u) * (1 - smoothstep(ud(170), ud(128), u));
        hero.update(dt, time, camera);
        cloudAt(cp.x, cp.z, T, camS);
        moteMat.uniforms.uK.value = (spawning ? 1.25 : 1) * (1 - 0.45 * Math.max(camS.S, 0.6 * veil));
        camera.getWorldPosition(sky.position);
      },
      dispose() { hero.dispose(); for (const d of disposables) d.dispose(); },
    };
  },
};
