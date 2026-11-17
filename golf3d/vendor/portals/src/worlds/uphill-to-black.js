// UPHILL TO BLACK: strapped to the shoulder of a rocket from a tropical pad to the black above the weather.
// The path is a level, dead-straight 600 m line; the rocket is posed around whichever camera is passed to update()
// (camera -> mount(u) -> hull -> trajectory(u) -> Earth) and the Earth is scaled about the lens so that it is never
// more than a few kilometres away while looking exactly as it would at true scale.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, makeRng, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, buildOrbit } from '../parts/uphill-to-black.js';

const TAU = Math.PI * 2, RE = 6371000, PADH = 8, DEG = Math.PI / 180, BARW = 150, NECK = 58, NISL = 46;
const STORM = [230000, 150000, -330000, -1250000];     // two spiral weather systems, metres from the pad
const PALETTE = ['#1F7FD6', '#2FC4B8', '#F3F1EA', '#E9DDB8', '#0F3D30', '#03040A', '#FF9A2E'];

// monotone cubic through keys [[t, v], ...] (no overshoot, smooth speed)
function curve(keys) {
  const n = keys.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    if (t >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0; while (t > keys[i + 1][0]) i++;
    const h = keys[i + 1][0] - keys[i][0], s = (t - keys[i][0]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * keys[i][1] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * keys[i + 1][1] + (s3 - s2) * h * m[i + 1];
  };
}
// the flight, by seconds (seconds = u * 40): altitude and downrange in metres, lean in degrees from vertical
const altAt = curve([[0, 0], [2, 0], [5, 80], [8, 900], [9, 1200], [12.5, 6000], [15, 11000], [18, 30000], [22, 80000], [40, 150000]]);
const downAt = curve([[0, 0], [5, 0], [9, 250], [12.5, 2600], [15, 8000], [18, 30000], [22, 90000], [27, 170000], [40, 420000]]);
const leanAt = curve([[0, 0], [5, 0], [10, 25], [15, 50], [20, 62], [24.5, 64], [27.2, 85], [40, 87]]);

const GLSL_N = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + vec2(17.3, 9.1); a *= .5; } return s * 1.07; }
`;
// air between the lens and a point of the Earth (both in Earth-frame metres)
const GLSL_AIR = /* glsl */`
uniform vec3 uCamE, uZen, uHor; uniform float uAlt, uHaze, uHzHi;
vec3 aerial(vec3 col, vec3 pE){
  vec3 dv = uCamE - pE; float s = length(dv);
  vec3 up = normalize(vec3(pE.x, pE.y + ${RE}., pE.z));
  float x = max(uAlt, 1.) / 10000., col0 = 1. - exp(-x);
  float mu = clamp(dot(up, dv / max(s, 1.)), 0., 1.), g = 1. - mu;
  float g2 = g * g, g8 = g2 * g2 * g2 * g2;
  float tau = max(s / 10000. * min(col0 / x, 1.) * uHzHi, col0 * g8 * g8 * 40.);
  float hz = 1. - exp(-tau * uHaze);
  return mix(col, mix(uZen * 1.15, uHor, .4 + .6 * (1. - exp(-tau * .14))), hz);
}
`;
// one cloud deck seen from above: dk = (cell size m, coverage, stretch, drift m/s)
const GLSL_CLOUD = /* glsl */`
// size of a pixel on the ground: at a grazing view the footprint is a long sliver, and blurring by its length smears
// the whole Earth; take mostly its geometric mean so coasts and cloud stay crisp out to the limb
float footpr(vec2 g){ vec2 dx = dFdx(g), dy = dFdy(g); return mix(sqrt(abs(dx.x * dy.y - dx.y * dy.x)), max(length(dx), length(dy)), .1) + .01; }
float cloudN(vec2 g, vec4 dk, float t, float fp){
  vec2 p = g / dk.x; p.x *= dk.z; p.x += t * dk.w / dk.x;
  float k1 = 1. - clamp(fp / (dk.x * .4), 0., 1.), k2 = 1. - clamp(fp / (dk.x * 3.), 0., 1.);
  float k0 = 1. - clamp(fp / (dk.x * .03), 0., 1.);
  return .5 + (fbm(p) - .5) * .9 * k1 + (fbm(p * .16 + 3.7) - .5) * .9 * k2 + (fbm(p * 7.3 + 1.7) - .5) * .2 * k0;
}
float storm1(vec2 q, float R, float t, float sgn){
  float r = length(q) / R; if (r > 1.6) return 0.;
  float a = atan(q.y, q.x + step(length(q), 1e-3)) * sgn;
  float n = fbm(q / (R * .16) + 4.) - .5;
  float arm = sin(a * 2. + log(max(r, .02)) * 5.2 - t * .02 + n * 2.6) * .5 + .5;
  float body = (1. - smoothstep(.1, 1.3, r)) * (.22 + .78 * arm * arm) + (1. - smoothstep(.06, .34, r)) * .5 + n * .42;
  return smoothstep(.4, .6, body) * smoothstep(.03, .07, r) * (1. - smoothstep(1.2, 1.55, r));
}
uniform vec3 uCyc;      // a third, smaller system beside the line of flight: (x, z, radius) in metres
// a young cyclone seen from above the weather: a clear eye in a bright central overcast, feeder bands trailing out in an open
// spiral, every band torn into cells so that it is cloud and never a drawn shape
float cyc1(vec2 q, float R, float t){
  float r = length(q) / R; if (r > 1.55) return 0.;
  float a = atan(q.y, q.x + step(length(q), 1e-3));
  float n = fbm(q / (R * .13) + 4.) - .5, n2 = fbm(q / (R * .034) + 9.) - .5;
  float sp = a + log(max(r, .03)) * 3.1 - t * .03 + n * 1.5;
  float arm = .5 + .5 * sin(sp * 2.), band = .5 + .5 * sin(sp * 6. + n2 * 3. + 1.3), streak = .5 + .5 * sin(sp * 17. + n2 * 9.);
  float fall = 1. - smoothstep(.45, 1.45, r), core = 1. - smoothstep(.12, .42, r);
  float body = core * .85 + fall * (arm * arm * (.35 + .65 * band) + .2 * band * arm) + n * .2 + n2 * .3 * smoothstep(.1, .5, r);
  float m = smoothstep(.36, .7, body) * smoothstep(.06, .115, r + n2 * .05) * (1. - smoothstep(1.1, 1.5, r));
  // thin between the bands and along their grain, thick in the central overcast: the sea shows through the gaps
  return m * mix(.5 + .5 * streak * (.6 + .8 * (n2 + .5)), 1., core * .7);
}
float stormA(vec2 g, float t){
  return max(max(storm1(g - vec2(${STORM[0]}., ${STORM[1]}.), 190e3, t, 1.), storm1(g - vec2(${STORM[2]}., ${STORM[3]}.), 330e3, t, -1.)), cyc1(g - uCyc.xy, uCyc.z, t));
}
// density of a deck before its threshold. Far below the lens the deck's own cells are smaller than a pixel: there the
// same field carries on at the scales an orbit sees (cloud streets, cells, frontal bands), so it never melts to a blur
float cloudD(vec2 g, vec4 dk, float t, float fp){
  float big = vn(g / 70e3 + dk.x * .001) * .55 + .45 * vn(g / 300e3 + 3. + dk.x * .002);
  float lg = max(smoothstep(dk.x * 5., dk.x * 45., length(g)), step(1500., dk.x));
  float ko = smoothstep(dk.x * .25, dk.x * 1.5, fp), od = 0.;
  if (ko > 0.) {
    vec2 gd = g + vec2(t * dk.w, 0.);
    float f1 = fbm(gd / 26e3 + dk.x * .01);
    od = (f1 - .5) * (1. - smoothstep(12e3, 40e3, fp)) + (fbm(gd / 6e3 + f1 * 1.6 + 2.) - .5) * .55 * (1. - smoothstep(2.5e3, 8e3, fp))
      + (fbm(gd / 1400. + 9.) - .5) * .3 * (1. - smoothstep(600., 2000., fp));
    od *= ko;
  }
  return cloudN(g, dk, t, fp) + (big - .5) * .9 * lg - .13 * (1. - lg) + od * lg;
}
float cloudA(vec2 g, vec4 dk, float t, float fp){
  float thr = 1.08 - dk.y;
  return smoothstep(thr - .07, thr + .1, cloudD(g, dk, t, fp));
}
`;

const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return new THREE.Color(c.r * k, c.g * k, c.b * k); };
function box(w, h, d, x, y, z, c, ry = 0, rx = 0, rz = 0) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); g.deleteAttribute('uv');
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1)));
  return tint(g, c);
}
function tint(g, c) {
  if (g.index) { const o = g.toNonIndexed(); g.dispose(); g = o; }
  if (g.attributes.uv) g.deleteAttribute('uv');
  const n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
const merge = (parts) => { const g = mergeGeometries(parts); parts.forEach((p) => p.dispose()); return g; };

// spherical cap centred on the pad: rings spaced exponentially out to 2600 km; aG = ground coordinates in metres
function capGeometry(h, rings = 72, segs = 96) {
  const R = RE + h, pos = [], aG = [], idx = [];
  for (let i = 0; i < rings; i++) {
    const d = i === 0 ? 0 : 30 * Math.pow(2.6e6 / 30, (i - 1) / (rings - 2)), ph = d / RE;
    for (let j = 0; j <= segs; j++) {
      const a = (j / segs) * TAU, c = Math.cos(a), s = Math.sin(a);
      pos.push(R * Math.sin(ph) * c, R * Math.cos(ph) - RE, R * Math.sin(ph) * s); aG.push(d * c, d * s);
    }
  }
  for (let i = 0; i < rings - 1; i++) for (let j = 0; j < segs; j++) { const a = i * (segs + 1) + j, b = a + 1, c = a + segs + 1, e = c + 1; idx.push(a, b, c, b, e, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aG', new THREE.Float32BufferAttribute(aG, 2)); g.setIndex(idx);
  return g;
}

export default {
  id: 'uphill-to-black',
  name: 'Uphill to Black',
  category: 'sky',
  media: ['air', 'space'],
  weirdness: 0.05,
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---------- what this visit is ----------
    const hour = vary.hour === 'night' ? 'night' : vary.hour === 'dawn' || vary.hour === 'golden' ? 'dawn' : vary.hour === 'day' ? 'day'
      : rng.pick(['day', 'dawn', 'night', 'day', 'day', 'dawn']);
    const weather = rng.pick(['three', 'three', 'one', 'wall', 'fog']);
    const coast = rng.pick(['atoll', 'mangrove', 'mangrove', 'desert']);
    const flamingos = rng.chance(0.3), heavy = !!vary.rare, rollSign = rng.sign(), panSign = rng.sign();
    const night = hour === 'night', dawn = hour === 'dawn';
    const P = PALETTE, fire = lin(P[6]);
    const L = {
      day: { zen: lin(P[0]), hor: lin('#d4e9f2'), horSun: lin('#e6f2f4'), sunCol: new THREE.Color(1, 0.98, 0.94), sunAmt: 1, amb: new THREE.Color(0.16, 0.22, 0.28), el: 72, key: 3.1, keyCol: '#ffffff', starK: 420, cloud: lin('#f3f1ea', 0.92), hemi: 0.9 },
      dawn: { zen: lin('#14285c'), hor: lin('#e9b9a8'), horSun: lin('#ffc9a0', 1.25), sunCol: new THREE.Color(1, 0.74, 0.62), sunAmt: 0.2, amb: new THREE.Color(0.13, 0.19, 0.33), el: 6, key: 2.9, keyCol: '#ffd6c4', starK: 60, cloud: lin('#f6cfc4', 0.9), hemi: 0.95 },
      night: { zen: lin('#070c1f'), hor: lin('#13233f'), horSun: lin('#182a4a'), sunCol: new THREE.Color(0.55, 0.68, 1), sunAmt: 0.2, amb: new THREE.Color(0.02, 0.032, 0.066), el: 50, key: 0.6, keyCol: '#9db8ff', starK: 1.2, cloud: lin('#8fa3c8', 0.2), hemi: 0.12 },
    }[hour];
    const sunE = new THREE.Vector3(-rollSign * Math.cos(L.el * DEG), Math.sin(L.el * DEG), 0.25 * Math.cos(L.el * DEG)).normalize();   // towards the sun, Earth frame

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(P[5]);
    const path = makePath([[0, 0, 0], [0, 0, -200], [0, 0, -400], [0, 0, -600]]);
    await ctx.yield();
    const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, L.hemi); scene.add(hemi);
    const key = new THREE.DirectionalLight(L.keyCol, L.key); scene.add(key, key.target);
    const glow = new THREE.DirectionalLight(fire, 0); scene.add(glow, glow.target);     // the fire lighting the hull from aft

    // shared uniforms
    const AIR = { uCamE: { value: new THREE.Vector3() }, uZen: { value: L.zen.clone() }, uHor: { value: L.hor.clone() }, uAlt: { value: 60 }, uHaze: { value: night ? 0.12 : 0.24 }, uHzHi: { value: 1 } };
    const uTime = { value: 0 }, uSunE = { value: sunE }, uSunCol = { value: L.sunCol }, uSunAmt = { value: L.sunAmt }, uAmb = { value: L.amb };
    const uCyc = { value: new THREE.Vector3(panSign * 100e3, 26e3, 72e3) }, uFire = { value: fire }, uThr = { value: 0 }, uHeadG = { value: new THREE.Vector2() }, uSunView = { value: new THREE.Vector3(0, 1, 0) }, uSunV = { value: new THREE.Vector4(0, 1, 0, 0) };
    // cloud decks: [altitude m, cell m, coverage, stretch, drift]
    const deckDefs = [[1200, 900, 0.4, 0.45, 9], [6000, 2600, 0.42, 1, 14], [11000, 9000, 0.34, 0.22, 30]];
    const decks = (weather === 'one' ? [deckDefs[rng.int(0, 1)]] : weather === 'wall' ? [deckDefs[1], deckDefs[2]] : deckDefs).map((d) => d.slice());
    if (weather === 'fog') decks.unshift([46, 240, 0.93, 1, 2.5]);
    decks.forEach((d) => { d[2] = clamp(d[2] * (0.85 + 0.3 * rng()) * (d[0] < 100 ? 1 : dens), 0.2, 0.95); });
    const timeAtAlt = (h) => { let a = 2, b = 40; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (altAt(m) + PADH + 56 < h) a = m; else b = m; } return a; };
    decks.forEach((d) => { d.t = d[0] < 100 ? -99 : timeAtAlt(d[0]); });
    const shadowDeck = decks.find((d) => d[0] > 100) || deckDefs[0];
    const uDeck0 = { value: new THREE.Vector4(shadowDeck[1], shadowDeck[2], shadowDeck[3], shadowDeck[4]) }, uDeck0H = { value: shadowDeck[0] }, uDeck0On = { value: night ? 0.3 : 1 };

    // ---------- sky: one analytic dome driven by altitude; stars live in the Earth frame ----------
    const SKY = { uHorK: { value: 0.12 }, uW2E: { value: new THREE.Matrix3() }, uUpE: { value: new THREE.Vector3(0, 1, 0) }, uHorSun: { value: L.horSun }, uStarK: { value: L.starK }, uSunV, uMoonE: { value: new THREE.Vector3(0, 0.3, -1).normalize() }, uPre: { value: 0 }, uMW: { value: new THREE.Vector3(-0.86, 0.5, 0.1).normalize() } };
    const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 5), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false,
      uniforms: { ...SKY, uZen: AIR.uZen, uHor: AIR.uHor, uAlt: AIR.uAlt, uSunE, uTime },
      vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        uniform mat3 uW2E; uniform vec3 uUpE, uZen, uHor, uHorSun, uSunE, uMoonE, uMW; uniform vec4 uSunV; uniform float uAlt, uStarK, uTime, uHorK, uPre; varying vec3 vD;
        float h31(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
        float n31(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
          return mix(mix(mix(h31(i), h31(i + vec3(1., 0., 0.)), f.x), mix(h31(i + vec3(0., 1., 0.)), h31(i + vec3(1., 1., 0.)), f.x), f.y),
                     mix(mix(h31(i + vec3(0., 0., 1.)), h31(i + vec3(1., 0., 1.)), f.x), mix(h31(i + vec3(0., 1., 1.)), h31(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
        // one layer of stars on a grid of cells: sc cells per radian, keep = share of cells that hold a star, r0 = radius in cells.
        // A star smaller than a pixel is drawn a pixel wide and dimmed by the same area, so the field neither sparkles nor vanishes.
        vec4 starL(vec3 d, float sc, float keep, float r0, float px){
          vec3 p = d * sc, c = floor(p), f = fract(p) - .5; float hs = h31(c + sc);
          if (hs > keep) return vec4(0.);
          float rr = max(r0, px * sc * .75), k = r0 / rr, m = hs / max(keep, 1e-4);
          float a = (1. - smoothstep(rr * .35, rr, length(f - (vec3(h31(c + 7.), h31(c + 13.), h31(c + 23.)) - .5) * (1. - 2. * min(rr, .4))))) * k * k;
          float hc = fract(hs * 91.7 + sc);
          vec3 tint = mix(vec3(.66, .8, 1.), vec3(1., .95, .84), smoothstep(.25, .7, hc)); tint = mix(tint, vec3(1., .62, .36), step(.9, hc));
          return vec4(tint * a * (.35 + 2.4 * m * m * m), a);
        }
        void main(){
          vec3 d = uW2E * normalize(vD); float px = length(fwidth(d));
          float mu = dot(d, uUpE), r = ${RE}. + uAlt;
          float ht = r * sqrt(max(1. - mu * mu, 0.)) - ${RE}.;
          float hmin = mu > 0. ? uAlt : max(ht, 0.);
          float tau = exp(-hmin / 10000.) / (max(mu, 0.) + .028);
          vec3 hd = d - uUpE * mu, sh = uSunE - uUpE * dot(uSunE, uUpE);
          float sa = dot(normalize(hd + vec3(1e-5, 0., 0.)), normalize(sh + vec3(0., 0., 1e-5)));
          vec3 hor = mix(uHor, uHorSun, pow(max(sa, 0.), 3.));
          vec3 col = mix(uZen, hor, 1. - exp(-tau * uHorK)) * (1. - exp(-tau * 3.));
          vec3 p = d * 85., c = floor(p), f = fract(p) - .5;
          float hs = h31(c), tw = .55 + .45 * sin(uTime * (2. + 5. * hs) + hs * 50.);
          float st = (1. - smoothstep(.02, .16, length(f - (vec3(h31(c + 7.), h31(c + 13.), h31(c + 23.)) - .5) * .6))) * step(.86, hs);
          // the low sun of the orbital leg: disc and glare, and the air's layers lit orange to blue along the limb
          float sdv = max(dot(d, uSunV.xyz), 1e-4), s4 = sdv * sdv * sdv * sdv, lay = clamp(ht / 70000., 0., 1.);
          vec3 layC = mix(mix(vec3(1., .26, .04), vec3(1., .7, .3), smoothstep(.02, .16, lay)), vec3(.3, .58, 1.), smoothstep(.14, .4, lay));
          vec3 sunC = vec3(1., .95, .88) * uSunV.w;
          vec3 sx3 = normalize(cross(uSunV.xyz, uUpE) + vec3(1e-5, 0., 0.)), sy3 = cross(sx3, uSunV.xyz);
          float sa3 = atan(dot(d, sy3), dot(d, sx3) + 1e-6), ray = pow(abs(cos(sa3 * 3. + .4)), 60.) + .6 * pow(abs(cos(sa3 * 3. + 1.3)), 200.);
          float glare = pow(sdv, 1500.) * 5. + pow(sdv, 240.) * 1.3 + ray * pow(sdv, 300.) * 3.;
          // the moon: a lit ball with maria, hung over the limb
          float moon = 0.;
          vec3 mx = normalize(cross(uMoonE, vec3(0., 1., 0.)) + vec3(1e-5, 0., 0.)), my = cross(mx, uMoonE);
          vec2 mq = vec2(dot(d, mx), dot(d, my)) / .07; float mr = dot(mq, mq);
          if (mr < 1. && dot(d, uMoonE) > 0.) {
            vec3 mn = mx * mq.x + my * mq.y - uMoonE * sqrt(max(1. - mr, 0.));
            vec3 mp = floor(mn * 5. + 9.); float mar = mix(h31(mp), h31(floor(mn * 11. + 3.)), .4) * .5 + .5 * h31(floor(mn * 2.3 + 5.));
            float ml = max(dot(mn, normalize(uSunV.xyz + vec3(0., .5, 0.))), 0.);
            col = vec3(.8, .78, .72) * (.55 + .45 * smoothstep(.25, .6, mar)) * (ml * 1.25 + .012) * (1. - .35 * mr) * (1. - exp(-12. * exp(-tau * .5)));
            moon = 1.;
          }
          float seen = exp(-tau * uStarK) * (1. - moon) / (1. + glare * uSunV.w * 3.);
          col += vec3(.8, .88, 1.) * st * tw * (.8 + 6. * pow(fract(hs * 37.), 4.)) * seen;
          // the sky above the weather: stars of several magnitudes, a few with colour, crowding into the faint band of the Milky Way
          float seen2 = exp(-tau * uStarK * .3) * (1. - moon) / (1. + glare * uSunV.w * 3.);     // the faint field comes out as the sky drains
          if (seen2 > .004) {
            float lat = dot(d, uMW), mw = exp(-lat * lat / .035);
            float dust = n31(d * 7. + 3.) * .6 + n31(d * 19. + 11.) * .4, lane = smoothstep(.3, .62, dust) * (1. - .75 * smoothstep(.5, .7, n31(d * 11. + 40.)) * exp(-lat * lat / .006));
            vec3 sf = starL(d, 150., .1 + .22 * mw * lane, .11, px).rgb * 1.5 + starL(d, 310., .07 + .5 * mw * lane, .14, px).rgb * .9 + starL(d + .37, 520., .03 + .6 * mw * lane, .2, px).rgb * .55;
            // where the band's stars are finer than a pixel their light is still there: a faint grainy river, split by dust lanes
            sf += vec3(.72, .8, 1.) * (mw * lane * .06 + exp(-lat * lat / .14) * .007) * (.75 + .5 * h31(floor(d * 700.))) * smoothstep(.0002, .002, px);
            col += sf * seen2 * (.75 + .25 * tw);
          }
          // sunrise on the way: the air's layers light up along the limb well before the disc, wider and brighter as it comes
          float lim = max(uSunV.w * 1.3, uPre);
          col += layC * exp(-max(ht, 0.) / 19000.) * step(0., ht) * (sdv * sdv * .28 * uPre + s4 * sdv * 1.4 + s4 * s4 * s4 * s4 * 12.) * step(mu, 0.) * lim;
          col += sunC * (smoothstep(.99988, .99996, sdv) * 12. + glare);
          gl_FragColor = vec4(col, 1.);
        }`,
    }));
    dome.frustumCulled = false; dome.renderOrder = -10; scene.add(dome);
    await ctx.yield();

    // ---------- the Earth: everything in metres around the pad, scaled about the lens each frame ----------
    const earth = new THREE.Group(); earth.matrixAutoUpdate = false; scene.add(earth);
    const ring = coast === 'atoll' ? new THREE.Vector4(3200, BARW, 270, 3.3) : new THREE.Vector4(44000, BARW, 5200, 0.27);
    const EARTH = {
      ...AIR, uCyc, uTime, uSunE, uSunCol, uSunAmt, uAmb, uDeck0, uDeck0H, uDeck0On, uFire, uThr, uHeadG,
      uRing: { value: ring }, uArcEnd: { value: coast === 'atoll' ? 3.3 : 2.8 }, uDesert: { value: coast === 'desert' ? 1 : 0 }, uAtoll: { value: coast === 'atoll' ? 1 : 0 },
      uNight: { value: night ? 1 : 0 }, uColT: { value: 0 }, uSeedV: { value: new THREE.Vector2(rng.range(0, 60), rng.range(0, 60)) },
      uDeep: { value: lin('#0a3f86', 0.55) }, uTurq: { value: lin(P[1], 0.85) }, uShal: { value: lin('#bfeede', 0.8) }, uSand: { value: lin(coast === 'desert' ? '#d9b27e' : P[3], 0.78) },
      uVeg: { value: lin(P[4], 1.15) }, uVeg2: { value: lin('#2f6b3a', 0.9) }, uDry: { value: lin(coast === 'desert' ? '#b67838' : '#9a8454', 0.75) },
      uDelta: { value: new THREE.Vector2(rng.range(-90e3, -40e3), 78e3) }, uOchre: { value: lin('#bf9a52', 0.8) }, uRedE: { value: lin('#a2602f', 0.8) }, uSunV,
      uIsl: { value: Array.from({ length: NISL }, () => new THREE.Vector3(0, 0, 0)) },
    };
    await ctx.yield();
    const earthMat = new THREE.ShaderMaterial({
      uniforms: EARTH, fog: false,
      vertexShader: /* glsl */`attribute vec2 aG; varying vec2 vG; varying vec3 vE;
        void main(){ vG = aG; vE = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uSunAmt, uArcEnd, uDesert, uAtoll, uNight, uColT, uDeck0H, uDeck0On, uThr;
        uniform vec3 uSunE, uSunCol, uAmb, uDeep, uTurq, uShal, uSand, uVeg, uVeg2, uDry, uFire, uOchre, uRedE; uniform vec4 uSunV;
        uniform vec4 uRing, uDeck0; uniform vec2 uDelta, uSeedV, uHeadG; uniform vec3 uIsl[${NISL}];
        varying vec2 vG; varying vec3 vE;
        ${GLSL_N}
        ${GLSL_AIR}
        ${GLSL_CLOUD}
        // signed metres from the shore (land > 0): sandbar on a hooked peninsula (or an atoll ring) in a round gulf
        float landF(vec2 g, out float lagoon){
          float dist = length(g), n = 0.;
          n += 32e3 * (vn(g / 200e3 + uSeedV) - .5) * clamp(dist / 120e3, 0., 1.);
          n += 12e3 * (vn(g / 60e3 + uSeedV + 7.7) - .5) * clamp(dist / 40e3, 0., 1.);
          n += 4e3 * (vn(g / 18e3 + uSeedV + 1.3) - .5) * clamp(dist / 14e3, 0., 1.);
          n += 1100. * (vn(g / 5e3 + uSeedV + 5.9) - .5) * clamp(dist / 5e3, 0., 1.);
          n += 300. * (vn(g / 1500. + uSeedV + 2.2) - .5) * clamp(dist / 1800., 0., 1.);
          n += 90. * (vn(g / 400. + uSeedV + 8.4) - .5) * clamp((dist - 250.) / 500., 0., 1.);
          n += 22. * (vn(g / 90. + uSeedV + 4.4) - .5) * clamp((dist - 200.) / 300., 0., 1.);
          vec2 q = g - vec2(0., uRing.x);
          float rq = length(q), al = atan(q.x, -q.y + step(rq, 1e-3));
          float w = uRing.y + (uRing.z - uRing.y) * smoothstep(.03, .6, mix(al, abs(al), uAtoll));
          w = mix(${NECK}., w, smoothstep(50., 520., dist));        // the pad stands on a narrow neck: surf both sides
          float arc = smoothstep(-uRing.w, -uRing.w * .6, al) * (1. - smoothstep(uArcEnd, uArcEnd + .15, al));
          arc = mix(arc, 1. - smoothstep(2.55, 3., abs(al)), uAtoll);       // the atoll's pass lies opposite the pad, the same from both sides
          arc *= mix(1., smoothstep(.3, .45, vn(vec2(cos(al), sin(al)) * 2.2 + 3. + uSeedV) + exp(-al * al * 9.)), uAtoll);
          float dP = w * arc - abs(rq - uRing.x) - (1. - arc) * 300.;
          float dM = length(g - vec2(0., -250e3)) - 330e3;
          lagoon = 1. - smoothstep(.8, 1.02, rq / uRing.x);
          float e = max(dP, dM) + n;
          float bi = (vn(g / 3000. + uSeedV + 11.3) - .64) * 6000. - abs(rq - uRing.x - 4500.) * .6 - 3000. * (1. - clamp(dist / 4000. - .6, 0., 1.));
          return max(e, bi);
        }
        float hgt(vec2 g){
          float rd = 1. - abs(2. * vn(g / 130e3 + uSeedV + 21.) - 1.), rd2 = 1. - abs(2. * vn(g / 38e3 + uSeedV + 5.) - 1.);
          return rd * rd * .62 + rd2 * .3 * rd + .16 * vn(g / 11e3 + 3.);
        }
        void main(){
          float lag; float e = landF(vG, lag);
          float fp = footpr(vG);
          vec3 up = normalize(vec3(vE.x, vE.y + ${RE}., vE.z));
          vec3 V = normalize(uCamE - vE);
          // sea: depth colour, sand banks, seagrass, reef rings, the delta's stain
          float sh = exp(min(e, 0.) / (160. + min(fp, 900.) * 3.));
          // shoals run in bars and channels parallel to the shore; fine banks melt into big ones with distance
          float kf = 1. - smoothstep(60., 400., fp), als = dot(vG, vec2(.6, .8)), rqm = abs(length(vG - vec2(0., uRing.x)) - uRing.x);
          float bFine = mix(fbm(vG / 700. + uSeedV + 2.), fbm(vec2(rqm / 620., als / 1700.) + uSeedV), .45);
          float bBig = vn(vec2(rqm / 5200., als / 17000.) + uSeedV) * .6 + .4 * vn(vG / 9000. + uSeedV);
          float bank = mix(bBig, bFine * .75 + bBig * .25, kf);
          float dk = clamp(sh + lag * smoothstep(.38, .78, bank) * .5 + (1. - lag) * exp(min(e, 0.) / 9000.) * smoothstep(.52, .8, bank) * .6, 0., 1.);
          vec3 sea = mix(uDeep, uTurq, smoothstep(0., .7, dk)); sea = mix(sea, uShal, smoothstep(.72, 1., dk));
          float sg = smoothstep(.55, .7, vn(vG / 160. + 31.)) * smoothstep(.3, .6, dk) * (1. - smoothstep(.8, 1., dk)) / (1. + fp * .01);
          sea *= 1. - .45 * sg;
          vec2 rc = vG / 7000., ri = floor(rc), rf = fract(rc) - .5; float hh = h21(ri + 5.);
          float rl = length(rf + (vec2(h21(ri), h21(ri + 9.)) - .5) * .4) + (vn(vG / 900. + 7.) - .5) * .11 + (vn(vG / 2600. + 3.) - .5) * .12, rad = .12 + .2 * hh;
          float rmask = step(.8, hh) * clamp(length(vG) / 9000. - 1., 0., 1.) * step(e, -1500.) * (1. - smoothstep(50e3, 100e3, length(vG))) * (1. - smoothstep(700., 2600., fp));
          float rsoft = .05 + fp / 7000.;
          sea = mix(sea, mix(uTurq, uShal, .25 + .35 * vn(vG / 1500.)), (1. - smoothstep(rad - .1 - rsoft, rad + rsoft, rl)) * rmask * .8);
          vec2 dq = (vG - uDelta) / 60e3; float dl = length(dq);
          sea = mix(sea, vec3(.36, .27, .1), (1. - smoothstep(.15, 1., dl)) * (.45 + .55 * fbm(dq * 5. + vec2(0., -dl * 3.))) * .75);
          sea *= .9 + .2 * vn(vG / (3. + fp * 2.) + vec2(uTime * .5, uTime * .23));
          float surfZone = smoothstep(-60., -4., e) * (1. - smoothstep(-2., 3., e));
          float sl = sin(e * .2 + uTime * 1.5 + 5. * vn(vG / 70.));
          float foam = surfZone * smoothstep(.5, .95, sl) * (.45 + .55 * vn(vG / 7. + uTime * .2)) / (1. + fp * .2);
          foam += (1. - smoothstep(0., 5. + fp * 1.3, abs(e + 2.))) * .6 / (1. + fp * .0015);
          // land: beach, mangrove green, dry interior, tidal creeks
          // the mainland is a real place: green lowlands, ochre savanna, red earth, a mountain spine with lit and shaded flanks, rivers
          float veg = fbm(vG / 900. + 13.) * .6 + .4 * vn(vG / 60e3 + 2.);
          vec3 land = mix(uVeg, uVeg2, smoothstep(.3, .7, veg));
          float inl = smoothstep(4e3, 60e3, e);
          vec2 sdr = normalize(uSunE.xz + vec2(1e-5, 0.));
          float h0 = hgt(vG), h1 = hgt(vG + sdr * 5e3);
          float mtn = smoothstep(.42, .8, h0) * inl, relf = clamp((h0 - h1) * 7., -1., 1.) * inl;
          float orb = smoothstep(150., 1500., fp), fz = fbm(vG / 8e3 + 5.) - .5;      // from orbit: provinces with edges, not washes
          float dryK = smoothstep(.42 + .1 * orb, .7 - .1 * orb, vn(vG / 150e3 + 9. + uSeedV) + .3 * vn(vG / 20e3) - .1 * h0 + .07 * fz * orb);
          vec3 savanna = mix(uOchre, uRedE, smoothstep(.45 + .06 * orb, .75 - .06 * orb, vn(vG / 45e3 + 17.) + (.25 - .1 * orb) * fbm(vG / 9e3)));
          land = mix(land, mix(vec3(.11, .23, .05), vec3(.035, .13, .04), fbm(vG / 14e3 + 5.)), max(inl * .85, smoothstep(60., 600., fp) * .7));
          land = mix(land, savanna, max(uDesert * (1. - .55 * smoothstep(60e3, 220e3, e)), dryK) * (.55 + .45 * inl));
          land = mix(land, mix(uDry, uOchre * 1.1, smoothstep(40., 700., fp)), uDesert * (1. - smoothstep(2e3, 30e3, e)));
          land = mix(land, mix(vec3(.3, .25, .2), vec3(.62, .6, .56), smoothstep(.7, .95, h0)), mtn * .85);
          land *= 1. + .55 * relf;
          // from orbit the land is dark beside the cloud and carved: ridge lines lit on the sunward side, dendritic valleys, mottled cover
          float rA = fbm(vG / 24e3 + uSeedV + 40.), rB = fbm((vG + sdr * 2500.) / 24e3 + uSeedV + 40.);
          float rdg = 1. - abs(2. * rA - 1.), rdgB = 1. - abs(2. * rB - 1.), lk = orb * smoothstep(500., 6000., e);
          land *= 1. + lk * (clamp((rdg - rdgB) * 8., -.5, .7) + .5 * fz - .3 * smoothstep(.82, .97, rdg) - .3 * (1. - smoothstep(0., .045, abs(fz))) * (1. - smoothstep(1500., 5000., fp)) - .3);
          land *= mix(1., .78 + .4 * (sin(vG.x * .02 + vG.y * .035 + 6. * vn(vG / 800.)) * .5 + .5), uDesert * (1. - smoothstep(2., 30., fp)));
          float ck = abs(fbm(vG / 2600. + 40.) - .5);
          land = mix(land, uTurq * .55, (1. - smoothstep(0., .014 + fp * 2e-5, ck)) * (1. - smoothstep(500., 9000., e)) * smoothstep(60., 200., e) * (1. - uDesert) * (1. - .8 * orb));
          float rv = abs(vn(vG / 70e3 + 60. + uSeedV) + .45 * vn(vG / 21e3 + 3.) - .72);
          float rvw = .012 + .02 * (1. - smoothstep(5e3, 90e3, e)) + min(fp, 1200.) * 1.4e-5;
          land = mix(land, mix(uDeep * 1.3, uTurq * .7, .35 * (1. - orb)), (1. - smoothstep(rvw * .5, rvw, rv)) * smoothstep(300., 2500., e) * (1. - mtn * .7));
          land = mix(land, uVeg * 1.5, (1. - smoothstep(rvw, rvw * 4., rv)) * .6 * smoothstep(300., 2500., e) * (1. - mtn));
          float fpb = min(fp, 60.) + .12 * min(fp, 1200.);       // the beach stays a rim: from height the land is its own colour, not sand
          land = mix(uSand, land, smoothstep(22. + fpb, 80. + fpb * 3., e) * mix(1., mix(.4, .9, smoothstep(30., 400., fp)), uAtoll));
          land = mix(land, uSand * (.78 + .26 * vn(vG / 45. + 3.)), (1. - smoothstep(1500., 7000., length(vG))) * mix(.95, .7, smoothstep(.5, .7, vn(vG / 130. + uSeedV))) * smoothstep(20., 60., e));
          // wind ripples and tyre tracks in the sand near the pad
          float nearK = (1. - smoothstep(1.2, 4., fp)) * (1. - smoothstep(500., 900., length(vG)));
          land *= 1. + nearK * (.1 * sin(dot(vG, vec2(.9, .45)) * 1.5 + 5. * vn(vG / 13.)) * vn(vG / 31. + 5.) - .05);
          float trk = abs(abs(vG.y - 10. * vn(vec2(vG.x / 80., 2.)) + 6.) - 17.);
          land *= 1. - .22 * nearK * (1. - smoothstep(.3, .9 + fp, abs(trk - 1.1))) * step(40., abs(vG.x));
          land *= .9 + .2 * vn(vG / (6. + fp * 3.)) / (1. + fp * .004);
          float isSea = 1. - smoothstep(-1. - fp * .3, 1. + fp * .3, e);
          vec3 col = mix(land, sea, isSea);
          // mangrove islets: dark green on a pale apron of root shadow, so the crowns stand on something
          if (dot(vG, vG) < 4.2e7) {
            float isl = -1.;
            for (int i = 0; i < ${NISL}; i++) { vec3 it = uIsl[i]; isl = max(isl, 1. - length(vG - it.xy) / max(it.z, 1.)); }
            isl += (vn(vG / 70. + 9.) - .5) * .7 + (vn(vG / 24.) - .5) * .3 + (vn(vG / 7.) - .5) * .12 / (1. + fp * .1);
            float isf = fp * .012;
            col = mix(col, uShal * .9, smoothstep(-.5 - isf, -.04, isl) * isSea * .7 / (1. + fp * .12));
            col = mix(col, mix(uVeg * 1.5, uVeg2 * .8, vn(vG / 17. + 4.)) * (.75 + .5 * vn(vG / (5. + fp))), smoothstep(-.02 - isf, .1 + isf, isl));
          }
          col = mix(col, vec3(.86), clamp(foam, 0., 1.));
          // shadows of the first cloud deck and of the exhaust column
          vec2 sx = uSunE.xz / max(uSunE.y, .2);
          float shade = 1. - .5 * uDeck0On * cloudA(vG + sx * uDeck0H, uDeck0, uTime, fp);
          shade *= 1. - .5 * stormA(vG + sx * 9000., uTime);
          vec2 sd = normalize(-uSunE.xz + vec2(1e-5, 0.)); float along = dot(vG, sd), len = uColT * length(sx);
          float perp = abs(dot(vG, vec2(-sd.y, sd.x)) + 40. * sin(along * .004) + .06 * along * sin(along * .0011));
          float cw = 70. + along * .05 + fp;
          shade *= 1. - .65 * (1. - smoothstep(cw * .35, cw, perp)) * step(0., along) * (1. - smoothstep(len * .9, len + 1., along));
          vec3 lit = col * (uSunCol * uSunAmt * shade + uAmb);
          // sun glint, fire glow on the ground, town lights at night
          vec3 N = normalize(up + .07 * vec3(vn(vG / (4. + fp) + uTime * .6) - .5, 0., vn(vG / (4. + fp) + 7. - uTime * .5) - .5));
          float sp = pow(max(dot(reflect(-V, N), uSunE), 0.), 80.), sp2 = pow(max(dot(reflect(-V, up), uSunE), 0.), 10.);
          lit += isSea * uSunCol * uSunAmt * shade * (sp * 3. + sp2 * .22);
          float spv = max(dot(reflect(-V, N), uSunV.xyz), 0.); spv *= spv; spv *= spv; spv *= spv;
          lit += isSea * vec3(1., .62, .3) * uSunV.w * (spv * spv * 2.2 + spv * .25);
          float hd = length(vG - uHeadG);
          float gr = 110. + uAlt * .3; lit += col * uFire * uThr * ((1.5 * exp(-hd * hd / (gr * gr)) + 6. * exp(-hd * hd / 2500.)) / (1. + uAlt * .012));
          vec2 tc = vG / 650., ti = floor(tc); float th = h21(ti + 2.);
          float band = smoothstep(0., 250., e) * (1. - smoothstep(1500., 7000., e)) * smoothstep(.45, .7, vn(vG / 12e3 + 50.)) * (.25 + .75 * smoothstep(.4, .75, vn(vG / 3500. + 9.)));
          float dotl = (1. - smoothstep(0., .1 + fp / 650., length(fract(tc) - .5 - (vec2(h21(ti + 3.), h21(ti + 8.)) - .5) * .7))) * step(.5, th);
          lit += uNight * band * vec3(.75, .9, 1.) * mix(dotl * 5., .2 + 1.6 * pow(vn(vG / (fp * 2.5)), 3.), clamp(fp / 400., 0., 1.)) * (.8 + .2 * sin(uTime * 3. + th * 40.));
          // from height at night: cities strung along the coasts and rivers; and the first low sun of the orbital leg on whatever faces it
          float cl = uNight * step(0., e) * (exp(-e / 25e3) * .8 + .6 * (1. - smoothstep(rvw, rvw * 7., rv))) * smoothstep(.3, .62, vn(vG / 30e3 + 70. + uSeedV)) * smoothstep(.5, .78, vn(vG / 6e3 + 31.)) * smoothstep(30., 300., fp);
          vec2 cc = vG / 2500.; float cdot = (1. - smoothstep(0., .3 + fp / 2500., length(fract(cc) - .5 - (vec2(h21(floor(cc) + 4.), h21(floor(cc) + 14.)) - .5) * .6))) * step(.4, h21(floor(cc) + 11.));
          lit += vec3(1., .7, .36) * cl * mix(cdot * 4., .6, clamp(fp / 2500., 0., 1.)) * (.85 + .15 * sin(uTime * 2. + vG.x * .01));
          lit += col * vec3(1., .66, .4) * uSunV.w * mix(.3, 1.6, uNight) * smoothstep(-.03, .22, dot(up, uSunV.xyz)) * shade;
          gl_FragColor = vec4(aerial(lit, vE), 1.);
        }`,
    });
    const ground = new THREE.Mesh(capGeometry(0), earthMat); ground.frustumCulled = false; earth.add(ground);
    await ctx.yield();

    // cloud decks as shells seen from above (the camera only ever looks down at them)
    const shells = decks.map((d, i) => {
      const U = { ...AIR, uCyc, uTime, uSunE, uFire, uThr, uHeadG, uDk: { value: new THREE.Vector4(d[1], d[2], d[3], d[4]) }, uFade: { value: 0 }, uLit: { value: L.cloud }, uShade: { value: L.cloud.clone().multiply(new THREE.Color(0.42, 0.5, 0.7)) }, uLantern: { value: night ? 1.6 : dawn ? 0.7 : 0.4 }, uH: { value: d[0] }, uStorm: { value: i === decks.length - 1 ? 1 : 0 }, uGlory: { value: night ? 0 : dawn ? 0.6 : 1 }, uSunV, uPierce: { value: new THREE.Vector2(0, -downAt(Math.max(d.t, 0))) } };
      const m = new THREE.Mesh(capGeometry(d[0], 40, 64), new THREE.ShaderMaterial({
        uniforms: U, transparent: true, depthWrite: false, fog: false,
        vertexShader: /* glsl */`attribute vec2 aG; varying vec2 vG; varying vec3 vE;
          void main(){ vG = aG; vE = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          uniform float uTime, uFade, uThr, uLantern, uH, uStorm, uGlory; uniform vec2 uPierce; uniform vec3 uSunE, uFire, uLit, uShade; uniform vec4 uDk, uSunV; uniform vec2 uHeadG;
          varying vec2 vG; varying vec3 vE;
          ${GLSL_N}
          ${GLSL_AIR}
          ${GLSL_CLOUD}
          float gs(float x){ return exp(-x * x); }
          void main(){
            float fp = footpr(vG);
            vec2 sd = normalize(uSunE.xz + vec2(1e-5, 0.));
            float thr = 1.08 - uDk.y, d0 = cloudD(vG, uDk, uTime, fp), a0 = smoothstep(thr - .07, thr + .1, d0), stm = uStorm > 0. ? stormA(vG, uTime) : 0.;
            a0 *= smoothstep(.9, 2.1, length(vG - uCyc.xy) / uCyc.z);      // the decks' own cloud stands back from the cyclone: the spiral is seen whole on open sea
            float a = max(a0, stm * uStorm) * uFade;
            if (a < .004) discard;
            float rel = clamp((d0 - cloudD(vG + sd * max(uDk.x * .22, fp * 1.6), uDk, uTime, fp)) * 5. + .52, 0., 1.);
            if (stm > a0) rel = clamp(mix(rel, (stm - stormA(vG + sd * 14e3, uTime)) * 1.6 + .62 + .25 * (fbm(vG / 9e3) - .5), .8), 0., 1.);
            // thick cloud is white on its sunward shoulders, blue in the hollows, thin at its ragged edge
            vec3 col = mix(uShade, uLit, rel * (.5 + .5 * a)) * (.86 + .2 * smoothstep(.3, 1., a));
            // on the deck below us: our own shadow in a glory at the antisolar point, and the smoke column's pencil shadow leading to it
            float gk = uGlory * step(uH + 60., uAlt) * a;
            vec3 vr = normalize(vE - uCamE + vec3(0., 1e-3, 0.)); float ang = acos(clamp(dot(vr, -uSunE), -1., 1.));
            col += (vec3(gs((ang - .092) / .013), gs((ang - .078) / .013), gs((ang - .064) / .013)) * .6 + vec3(gs((ang - .165) / .018), gs((ang - .148) / .018), gs((ang - .13) / .018)) * .22 + gs(ang / .035) * .3) * gk;
            col *= 1. - .7 * gs(ang / .012) * gk;
            vec2 sB = uHeadG - uSunE.xz / max(uSunE.y, .2) * max(uAlt - uH, 0.), pa = vG - uPierce, ba = sB - uPierce;
            float hh = clamp(dot(pa, ba) / max(dot(ba, ba), 1.), 0., 1.), dl = length(pa - ba * hh + 60. * sin(hh * 9.) * vec2(-ba.y, ba.x) / max(length(ba), 1.)), lw = mix(300., 45., hh);
            col *= 1. - .42 * (1. - smoothstep(lw * .35, lw, dl)) * gk * smoothstep(0., .04, hh);
            float fs = max(dot(vr, uSunV.xyz), 0.), fs2 = fs * fs; fs2 *= fs2;
            col += vec3(1., .58, .26) * uSunV.w * (fs2 * fs2 * .9 + fs2 * fs2 * fs2 * fs2 * 2.) * (.35 + .65 * rel);
            float hd = length(vG - uHeadG), rg = 600. + abs(uAlt - uH) * .5;
            col += uFire * uThr * uLantern * exp(-hd * hd / (rg * rg)) * (.6 + .4 * rel) / (1. + abs(uAlt - uH) * 2e-4);
            gl_FragColor = vec4(aerial(col, vE), a * .96);
          }`,
      }));
      m.frustumCulled = false; m.renderOrder = 1 + i; m.visible = false; earth.add(m);
      return { mesh: m, U, h: d[0], t: d.t, d4: d[4] };
    });
    await ctx.yield();

    // ---------- the pad: tower, mount, trench, lightning towers and wires, tanks, hangars, causeway ----------
    const rho0 = rollSign * 30 * DEG;                       // hull roll on the pad; the roll program turns it to 0
    const cConc = new THREE.Color(0.25, 0.25, 0.245), cDark = new THREE.Color(0.035, 0.035, 0.04), cSteel = new THREE.Color(0.17, 0.19, 0.22), cGrey = new THREE.Color(0.36, 0.38, 0.4);
    const cWhite = new THREE.Color(0.7, 0.7, 0.68), cRoad = new THREE.Color(0.3, 0.3, 0.29), cRoof = new THREE.Color(0.6, 0.63, 0.64);
    const seg = (a, b, th, c) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz);
      return box(len, th, th, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, c, Math.atan2(-dz, dx), 0, Math.asin(dy / len));
    };
    const shOff = [clamp(sunE.x / Math.max(sunE.y, 0.3), -1, 1) * 4, clamp(sunE.z / Math.max(sunE.y, 0.3), -1, 1) * 4];   // where a 12 m high thing drops its shadow
    const st = [], cSand = new THREE.Color(0.4, 0.37, 0.27), cShadow = new THREE.Color(0.1, 0.1, 0.1), cPaint = new THREE.Color(0.74, 0.74, 0.72), cPylon = new THREE.Color(0.2, 0.22, 0.25);
    const TANKZ = -36, DISH = [-150, -30], C0 = [75, 8];      // tank farm row, tracking dish, where the causeway leaves the bar
    // apron: ten concrete slabs round a scorched heart, cut by the flame trench that runs out to the water on both sides
    for (let i = 0; i < 10; i++) { const k = 0.2 + 0.07 * ((i * 7) % 10) / 10; st.push(tint(new THREE.CylinderGeometry(28, 29, 0.7, 5, 1, false, (i / 10) * TAU, TAU / 10), new THREE.Color(k, k, k * 0.97)).translate(0, 0.35, 0)); }
    st.push(tint(new THREE.CylinderGeometry(13, 13, 0.1, 20), new THREE.Color(0.11, 0.105, 0.1)).translate(0, 0.74, 0));
    st.push(box(13, 0.3, 126, 0, 0.82, 0, cDark), box(1.3, 1.5, 126, 7.1, 1.0, 0, cConc), box(1.3, 1.5, 126, -7.1, 1.0, 0, cConc));
    for (let i = 0; i < 16; i++) {                            // scorch streaks fanning from the trench, painted hold-down ring
      const a = (i / 16) * TAU + 0.35 * Math.sin(i * 2.4), r0 = 12 + (i % 3) * 2, len = 9 + (i * 5) % 7;
      st.push(box(1.1 + (i % 4) * 0.5, 0.06, len, Math.sin(a) * (r0 + len / 2), 0.76, Math.cos(a) * (r0 + len / 2), new THREE.Color(0.1, 0.095, 0.09), a));
    }
    for (let i = 0; i < 24; i++) { if (i % 12 === 0) continue; const a = (i / 24) * TAU; st.push(box(0.5, 0.06, 3.1, Math.sin(a) * 21, 0.78, Math.cos(a) * 21, cPaint, a + Math.PI / 2)); }
    for (const sx of [-1, 1]) for (let j = 0; j < 4; j++) st.push(box(3.2, 0.06, 0.9, sx * (10.6 + (j % 2) * 0.01), 0.79, -5.4 + j * 3.6, j % 2 ? cDark : cPaint, sx * 0.5));
    await ctx.yield();
    // launch mount, deluge mains along the trench with their nozzles, the deluge water tower
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) st.push(box(1.3, 7, 1.3, sx * 3.6, 3.9, sz * 3.6, cGrey));
    for (const s of [-1, 1]) st.push(box(9.4, 1, 1.5, 0, 7.5, s * 3.9, cGrey), box(1.5, 1, 9.4, s * 3.9, 7.5, 0, cGrey));
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; st.push(box(0.5, 2.2, 0.5, Math.cos(a) * 9, 1.6, Math.sin(a) * 9, cGrey)); }
    for (const sx of [-1, 1]) {
      st.push(box(0.7, 0.7, 70, sx * 8.6, 1.5, 0, cPaint));
      for (let j = -4; j <= 4; j++) st.push(box(1.6, 0.5, 0.5, sx * 7.7, 2.0, j * 7.5, cGrey));
      st.push(tint(new THREE.CylinderGeometry(0.9, 1.1, 3.4, 8), cPaint).translate(sx * 11, 2.2, 11), tint(new THREE.CylinderGeometry(0.9, 1.1, 3.4, 8), cPaint).translate(sx * 11, 2.2, -11));
    }
    st.push(tint(new THREE.CylinderGeometry(5.5, 5.5, 7, 14), cPaint).translate(-40, 33, 22), tint(new THREE.CylinderGeometry(5.5, 0.8, 4, 14), cPaint).translate(-40, 27.5, 22), box(1.4, 26, 1.4, -40, 13, 22, cGrey), box(0.7, 0.7, 30, -40, 1.2, 8, cPaint));
    for (let j = 0; j < 4; j++) st.push(seg([-40 + Math.cos(j * TAU / 4 + 0.8) * 7, 0.5, 22 + Math.sin(j * TAU / 4 + 0.8) * 7], [-40 + Math.cos(j * TAU / 4 + 0.8) * 4.6, 29.5, 22 + Math.sin(j * TAU / 4 + 0.8) * 4.6], 0.6, cGrey));
    st.push(tint(new THREE.CylinderGeometry(6.5, 6.5, 0.06, 14), cShadow).translate(-40 - shOff[0] * 2.4, 0.78, 22 - shOff[1] * 2.4));
    await ctx.yield();
    // four lattice lightning towers on footings, strung with catenary wires
    const ltop = [];
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const X0 = sx * 45, Z0 = sz * 41, LH = 92, leg = (c, y) => [X0 + c[0] * (3.6 - 3.2 * y / LH), y, Z0 + c[1] * (3.6 - 3.2 * y / LH)], c4 = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      st.push(box(9.5, 0.8, 9.5, X0, 0.4, Z0, cConc), box(0.35, 12, 0.35, X0, LH + 6, Z0, cPaint)); ltop.push([X0, LH + 11, Z0]);
      for (let k = 0; k < 4; k++) {
        st.push(seg(leg(c4[k], 0.6), leg(c4[k], LH), 0.5, cPylon));
        for (let y = 0; y < LH - 1; y += 11.5) {
          const y1 = Math.min(LH, y + 11.5), up = (k + y / 11.5) % 2 < 1;
          st.push(seg(leg(c4[k], up ? y + 0.6 : y1), leg(c4[(k + 1) % 4], up ? y1 : y + 0.6), 0.3, cPylon));
          st.push(seg(leg(c4[k], y1), leg(c4[(k + 1) % 4], y1), 0.3, y1 > LH - 24 ? cPaint : cPylon));
        }
      }
    }
    await ctx.yield();
    for (let k = 0; k < 4; k++) {                             // catenary wires as ribbons
      const a = ltop[k], b = ltop[(k + 1) % 4]; let prev = a;
      for (let i = 1; i <= 10; i++) { const t = i / 10, p = [lerp(a[0], b[0], t), a[1] - 12 * Math.sin(t * Math.PI), lerp(a[2], b[2], t)]; st.push(seg(prev, p, 0.32, cGrey)); prev = p; }
    }
    await ctx.yield();
    // tank farm on a berm, with pipe runs to the mount
    st.push(box(84, 1.6, 30, 87, 0.8, TANKZ, cSand), box(88, 0.7, 0.7, 60, 1.3, TANKZ + 17.5, cPaint), box(0.7, 0.7, 12, 16.4, 1.3, TANKZ + 23.5, cPaint), box(88, 0.5, 0.5, 60, 1.2, TANKZ + 19, cGrey));
    for (let i = 0; i < 3; i++) {
      const x = 62 + i * 25, z = TANKZ;
      st.push(tint(new THREE.SphereGeometry(9, 16, 10), cWhite).translate(x, 12.6, z), tint(new THREE.CylinderGeometry(9.6, 9.6, 0.06, 16), cShadow).translate(x - shOff[0], 1.64, z - shOff[1]));
      st.push(tint(new THREE.TorusGeometry(9.05, 0.25, 4, 20).rotateX(Math.PI / 2), cGrey).translate(x, 12.6, z), box(0.6, 0.6, 17, x, 1.9, z + 9, cPaint), box(1.2, 9.5, 1.2, x, 21.5, z, cGrey));
      for (let j = 0; j < 4; j++) st.push(box(0.8, 9, 0.8, x + Math.cos(j * TAU / 4 + 0.6) * 6.5, 5.6, z + Math.sin(j * TAU / 4 + 0.6) * 6.5, cGrey));
    }
    st.push(box(316, 0.5, 14, 188, 0.4, 0, cRoad), box(300, 0.06, 0.4, 196, 0.68, 0, cPaint), box(40, 0.5, 9, 75, 0.4, 5, cRoad));
    const nHang = rng.int(5, 8);
    for (let i = 0; i < nHang; i++) {
      const x = 300 + i * rng.range(55, 75), z = (i % 2 ? 1 : -1) * (36 + (rng.range(55, 110) - 55) * 0.4), w = rng.range(40, 70), h = rng.range(14, 30), d = 24 + (rng.range(30, 50) - 30) * 0.6;
      st.push(box(w, h, d, x, h / 2, z, cWhite), box(w + 2, 1.2, d + 2, x, h + 0.6, z, cRoof), box(w * 0.5, h * 0.7, 0.6, x, h * 0.35, z + d / 2 + 0.2, cGrey), box(w * 0.9, 0.5, 1.4, x, h + 1.4, z, cGrey));
    }
    await ctx.yield();
    // the causeway across the lagoon: kerbs, edge lines and a centre line
    const czA = 0.22 * rollSign, cdir = [Math.sin(czA), Math.cos(czA)], cw0 = 12, cLen = coast === 'atoll' ? 1500 : 3000;
    const cpt = (d, sd) => [C0[0] + cdir[0] * d + cdir[1] * sd, C0[1] + cdir[1] * d - cdir[0] * sd];
    const cmid = cpt(cw0 + cLen / 2, 0);
    st.push(box(16, 2.6, cLen, cmid[0], 0.9, cmid[1], cRoad, czA), box(0.4, 0.08, cLen, cmid[0], 2.22, cmid[1], cPaint, czA));
    for (const sd of [-1, 1]) { const k = cpt(cw0 + cLen / 2, sd * 8.4), e = cpt(cw0 + cLen / 2, sd * 6.6); st.push(box(1.2, 3.1, cLen, k[0], 1.0, k[1], cConc, czA), box(0.3, 0.08, cLen, e[0], 2.22, e[1], cPaint, czA)); }
    const standAt = cpt(1150, 40), standB = cpt(1150, 32);
    st.push(box(26, 3, 90, standAt[0], 1.2, standAt[1], cConc, czA), box(8, 9, 70, standB[0], 5, standB[1], cWhite, czA));
    st.push(box(5, 12, 5, DISH[0], 6, DISH[1], cWhite), box(11, 0.8, 11, DISH[0], 0.4, DISH[1], cConc));               // dish pedestal
    await ctx.yield();
    const padMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    padMat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', 'varying vec3 vOb, vON;\n#include <common>').replace('#include <begin_vertex>', '#include <begin_vertex>\n vOb = position; vON = normal;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `varying vec3 vOb, vON;
        float ph21(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
        float pvn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(ph21(i), ph21(i + vec2(1., 0.)), f.x), mix(ph21(i + vec2(0., 1.)), ph21(i + vec2(1., 1.)), f.x), f.y); }
        #include <common>`).replace('#include <color_fragment>', `#include <color_fragment>
        { vec3 an = abs(vON); vec2 pp = an.y > .6 ? vOb.xz : an.x > an.z ? vOb.zy : vOb.xy;
          float fw = length(fwidth(pp)) + 1e-4;
          vec2 gq = abs(fract(pp / 4. + .5) - .5) * 4.;
          float joint = 1. - smoothstep(.03 + fw * .5, .07 + fw * 1.5, min(gq.x, gq.y));
          float stn = pvn(pp * .35) * .6 + pvn(pp * 1.9) * .4;
          diffuseColor.rgb *= (.74 + .46 * stn) * (1. - .5 * joint / (1. + fw * 2.));
          diffuseColor.rgb *= 1. - (1. - an.y) * .3 * pvn(vec2(pp.x * 2.5, pp.y * .13)); }`);
    };
    const padMesh = new THREE.Mesh(merge(st), padMat); earth.add(padMesh);
    await ctx.yield();
    // the lattice tower with its mast, turned to the side the hull shows it on the pad; swing arms on a pivot
    const towerG = new THREE.Group(); towerG.rotation.y = rho0; earth.add(towerG);
    const tw = [], TX = -17.5, TH = 88;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tw.push(box(0.7, TH, 0.7, TX + sx * 4, TH / 2, sz * 4, cSteel));
    for (let y = 0; y < TH; y += 8) {
      const c4 = [[-4, -4], [4, -4], [4, 4], [-4, 4]];
      for (let k = 0; k < 4; k++) {
        const a = c4[k], b = c4[(k + 1) % 4], up = (k + y / 8) % 2 < 1;
        tw.push(seg([TX + a[0], y + 8, a[1]], [TX + b[0], y + 8, b[1]], 0.4, cSteel));
        tw.push(seg([TX + a[0], up ? y : y + 8, a[1]], [TX + b[0], up ? y + 8 : y, b[1]], 0.3, cSteel));
      }
      if (y % 16 === 0) tw.push(box(7.6, 0.3, 7.6, TX, y + 8.2, 0, cGrey));
    }
    tw.push(box(0.5, 26, 0.5, TX, TH + 13, 0, cWhite), box(9.4, 0.5, 9.4, TX, TH + 0.4, 0, cGrey));
    await ctx.yield();
    towerG.add(new THREE.Mesh(merge(tw), padMat));
    await ctx.yield();
    const arms = new THREE.Group(); arms.position.set(TX + 4, 0, 4); towerG.add(arms);
    arms.add(new THREE.Mesh(merge([box(11.2, 2.2, 1.6, 5.6, 36, -3.2, cGrey), box(11.2, 1.2, 1.2, 5.6, 54, -3.2, cGrey), box(1.6, 3, 2.4, 10.6, 36, -3.2, cWhite), box(1.2, 1.8, 1.8, 10.8, 54, -3.2, cWhite), box(11.2, 0.25, 0.25, 5.6, 55.4, -2.6, cSteel), box(11.2, 0.25, 0.25, 5.6, 55.4, -3.8, cSteel)]), padMat));
    const dish = new THREE.Group(); dish.position.set(DISH[0], 13, DISH[1]); earth.add(dish);
    const dpts = []; for (let i = 0; i <= 8; i++) { const r = (i / 8) * 8; dpts.push(new THREE.Vector2(r, r * r * 0.045)); }
    const dishMat = new THREE.MeshLambertMaterial({ color: cWhite, side: THREE.DoubleSide });
    const dishMesh = new THREE.Mesh(new THREE.LatheGeometry(dpts, 20).rotateX(Math.PI / 2), dishMat); dish.add(dishMesh);
    dishMesh.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5, 5).rotateX(Math.PI / 2).translate(0, 0, 2.5), dishMat));
    await ctx.yield();

    // ---------- flora: mangrove crowns (or atoll groves, desert scrub) and causeway palms, thrashing in the blast ----------
    const uBlast = { value: 0 }, uShrink = { value: 1 };
    const floraMat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
    floraMat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime; sh.uniforms.uBlast = uBlast; sh.uniforms.uShrink = uShrink;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', 'uniform float uTime, uBlast, uShrink;\n#include <common>').replace('#include <begin_vertex>', `#include <begin_vertex>
        { vec3 ip = instanceMatrix[3].xyz; float ph = ip.x * .37 + ip.z * .53, dd = length(ip.xz);
          float amp = (.05 + uBlast * 1.1 * exp(-dd / 700.)) * max(position.y, 0.) * .35;
          transformed.x += amp * (sin(uTime * (1.3 + 6. * uBlast) + ph) + .5 * sin(uTime * 3.7 + ph * 1.7));
          transformed.z += amp * cos(uTime * (1.1 + 5. * uBlast) + ph * 1.3);
          transformed.xz += normalize(ip.xz + vec2(1e-3, 0.)) * uBlast * exp(-dd / 700.) * max(position.y, 0.) * .5;
          transformed *= uShrink; }`);
    };
    const crownGeo = new THREE.IcosahedronGeometry(1, 0); crownGeo.scale(1, 0.55, 1).translate(0, 0.4, 0);
    const nCrown = Math.round((coast === 'mangrove' ? 5000 : coast === 'atoll' ? 1800 : 700) * dens * detail);
    const crowns = new THREE.InstancedMesh(crownGeo, floraMat, nCrown);
    const fr = rng.fork('flora'), _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
    const islets = []; for (let i = 0; i < 46; i++) islets.push([fr.range(-3600, 3600), fr.range(380, 3400), fr.range(35, 170)]);
    const offRoad = (x, z) => Math.abs((x - C0[0]) * cdir[1] - (z - C0[1]) * cdir[0]) > 16 || (x - C0[0]) * cdir[0] + (z - C0[1]) * cdir[1] < 0;
    const vegC = lin(P[4], 2.8), vegC2 = lin('#3a8048', 1.1), scrub = lin('#5a5a30', 0.7);
    let nc = 0;
    for (let i = 0; i < nCrown * 3 && nc < nCrown; i++) {
      let x, z, r;
      if (coast === 'mangrove') {
        if (fr.chance(0.86)) { const it = islets[Math.floor(Math.pow(fr(), 1.3) * islets.length)], a = fr() * TAU, d = Math.sqrt(fr()) * it[2]; x = it[0] + Math.cos(a) * d; z = it[1] + Math.sin(a) * d; }
        else { x = fr.range(-3800, 3800); z = BARW - 85 + (fr.range(215, 300) - 215) * 1.3; if (Math.abs(x) < 420) continue; }
        r = fr.range(4, 9);
      } else if (coast === 'atoll') { const a = fr.range(-3.1, 3.1), d = 3200 + fr.range(-150, 150); x = Math.sin(a) * d; z = 3200 - Math.cos(a) * d; r = fr.range(4, 8); if (Math.hypot(x, z) < 330) continue; }
      else { x = fr.range(-4200, 4200); z = fr.range(-240, 240) * 0.5; r = fr.range(1.5, 3.2); if (Math.abs(x) < 480) continue; }
      if (!offRoad(x, z)) continue;
      crowns.setMatrixAt(nc, _m4.compose(_v.set(x, coast === 'desert' ? 0 : 1.5, z), _q.setFromAxisAngle(_s.set(0, 1, 0), fr() * TAU), _s.set(r, r * fr.range(0.8, 1.3), r)));
      crowns.setColorAt(nc, coast === 'desert' ? _c.copy(scrub).multiplyScalar(fr.range(0.7, 1.2)) : _c.copy(vegC).lerp(vegC2, fr() * 0.6).multiplyScalar(fr.range(0.75, 1.2)));
      nc++;
      if ((i & 255) === 0) await ctx.yield();
    }
    crowns.count = nc; crowns.frustumCulled = false; earth.add(crowns);
    if (coast === 'mangrove') islets.forEach((it, i) => EARTH.uIsl.value[i].set(it[0], it[1], it[2] * 1.12));
    const palmParts = [box(0.5, 9, 0.5, 0.3, 4.5, 0, new THREE.Color(0.3, 0.24, 0.17), 0, 0, -0.06)];
    for (let i = 0; i < 12; i++) {
      const g = new THREE.PlaneGeometry(0.8, 5.4, 1, 3); const p = g.attributes.position, dr = 2.4 + 1.6 * ((i * 5) % 4) / 3;
      for (let j = 0; j < p.count; j++) { const t = (p.getY(j) + 2.7) / 5.4; p.setXYZ(j, p.getX(j) * (1 - 0.85 * t), 1.5 * t - (dr + 1.4) * t * t, t * (4.6 + (i % 3) * 0.5)); }
      g.rotateY((i / 12) * TAU + 0.3 + 0.2 * Math.sin(i * 3.1)).translate(0.55, 9, 0); g.computeVertexNormals(); palmParts.push(tint(g, lin('#2c5a22', 0.6 + 0.25 * ((i * 7) % 3) / 2)));
    }
    await ctx.yield();
    const nPalm = Math.round((cLen - 60) / 24) * 2;
    const palmMat = floraMat.clone(); palmMat.vertexColors = true; palmMat.onBeforeCompile = floraMat.onBeforeCompile;
    const palms = new THREE.InstancedMesh(merge(palmParts), palmMat, nPalm);
    for (let i = 0; i < nPalm; i++) {
      const d = cw0 + 44 + Math.floor(i / 2) * 24 + fr.range(-4, 4), sd = (i % 2 ? 1 : -1) * 11.5, s = fr.range(0.9, 1.5);
      const pp = cpt(d, sd);
      palms.setMatrixAt(i, _m4.compose(_v.set(pp[0], 1.8, pp[1]), _q.setFromAxisAngle(_s.set(0, 1, 0), fr() * TAU), _s.set(s, s, s)));
    }
    palms.frustumCulled = false; earth.add(palms);
    await ctx.yield();

    // ---------- soft puffs: steam walls (keyed to the flight clock), tank vents (looping), a cumulus wall ----------
    const tr = makeRng(String(ctx.seed) + ':towers');      // a private stream: the new pieces draw nothing from ctx.rng
    const puffLit = night ? lin('#93a0bd', 0.12) : dawn ? lin('#aab4d6', 0.5) : lin('#f3f1ea', 0.8);
    function makePuffs(list, o) {
      const n = list.length, g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const aP = new Float32Array(n * 3), aV = new Float32Array(n * 3), aS = new Float32Array(n * 4);
      list.forEach((e, i) => { aP.set(e.p, i * 3); aV.set(e.v || [0, 0, 0], i * 3); aS.set([e.s0, e.grow || 0, e.t0 || 0, (o.rng || rng)()], i * 4); });
      g.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 3)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(aV, 3)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4));
      g.instanceCount = n;
      const U = { ...AIR, uTime, uFire, uThr, uClock: { value: 0 }, uLoop: { value: o.loop || 0 }, uLife: { value: o.life || 1e9 }, uDrag: { value: o.drag || 0.4 }, uRise: { value: o.rise || 0 },
        uLit: { value: o.lit || puffLit }, uShade: { value: (o.lit || puffLit).clone().multiply(new THREE.Color(0.5, 0.58, 0.72)) }, uOp: { value: o.opacity ?? 0.8 }, uGlowK: { value: o.glow ?? 0 }, uSunView, uBall: { value: o.ball ?? 0 } };
      if (o.shade) U.uShade.value = o.shade;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: U, transparent: true, depthWrite: false, fog: false,
        vertexShader: /* glsl */`
          attribute vec3 aP, aV; attribute vec4 aS; uniform float uClock, uLoop, uLife, uDrag, uRise, uGlowK;
          varying vec2 vQ; varying float vA, vSeed, vGl; varying vec3 vE;
          void main(){
            float age = uClock - aS.z; if (uLoop > 0.) age = mod(age + 1000. * uLoop, uLoop);
            float on = step(0., age); age = max(age, 0.);
            vec3 c = aP + aV * (1. - exp(-age * uDrag)) / uDrag + vec3(0., uRise * age, 0.);
            float sz = aS.x + aS.y * sqrt(age), end = uLoop > 0. ? uLoop : uLife;
            vA = on * smoothstep(0., .35, age) * (1. - smoothstep(end * .6, end, age));
            vQ = position.xy; vSeed = aS.w; vE = c; vGl = uGlowK * exp(-length(c.xz) / 110.);
            vec4 mv = modelViewMatrix * vec4(c, 1.);
            mv.xy += position.xy * sz * length(modelMatrix[0].xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`
          uniform float uTime, uOp, uThr, uBall; uniform vec3 uLit, uShade, uFire, uSunView; varying vec2 vQ; varying float vA, vSeed, vGl; varying vec3 vE;
          ${GLSL_N}
          ${GLSL_AIR}
          void main(){
            float r = length(vQ), n = vn(vQ * 2.3 + vSeed * 40. + uTime * .13), n2 = vn(vQ * 5.5 + vSeed * 17. - uTime * .2);
            float a = vA * (1. - smoothstep(.3 + .3 * n + .2 * uBall, 1. - .08 * uBall, r + .25 * n2)) * uOp;
            if (a < .004) discard;
            float lt = .55 + .45 * vQ.y;
            if (uBall > 0.) { vec3 bn = vec3(vQ, sqrt(max(1. - r * r, 0.))); lt = mix(lt, clamp(dot(bn, uSunView) * .8 + .4 + .4 * (n2 - .5), 0., 1.), uBall); }
            vec3 col = mix(uShade, uLit, clamp(lt + .3 * (n - .5), 0., 1.)) + uFire * uThr * vGl;
            col = mix(col, uShade * .8, uBall * .35 * smoothstep(.1, .6, r) * (1. - lt));
            gl_FragColor = vec4(aerial(col, vE), a);
          }`,
      }));
      if (o.additive) m.material.blending = THREE.AdditiveBlending;
      m.frustumCulled = false; m.renderOrder = o.order ?? 2; earth.add(m);
      return { mesh: m, U };
    }
    const sr = rng.fork('steam'), steamList = [], zx = (a) => [a[2], a[1], a[0]];     // the trench runs along z
    for (let i = 0; i < Math.round(150 * detail); i++) {
      const sx = i % 2 ? 1 : -1, sp = sr.range(40, 95);
      steamList.push({ p: zx([sx * sr.range(4, 16), sr.range(1, 5), sr.range(-5, 5)]), v: zx([sx * sp, sr.range(4, 16), sr.range(-16, 16)]), s0: sr.range(4, 8), grow: sr.range(10, 19), t0: -2.6 + Math.pow(sr(), 1.5) * 8.4 });
    }
    const steam = makePuffs(steamList, { life: 16, drag: 0.45, rise: 2.2, opacity: 0.72, glow: night ? 2.2 : 0.7, order: 3 });
    await ctx.yield();
    const ringList = [];
    for (let i = 0; i < Math.round(76 * detail); i++) {
      const a = (i / 76) * TAU * 5.03 + tr.range(-0.2, 0.2), sp = tr.range(18, 52);
      ringList.push({ p: [Math.cos(a) * tr.range(5, 12), tr.range(1, 6), Math.sin(a) * tr.range(5, 12)], v: [Math.cos(a) * sp, tr.range(5, 22), Math.sin(a) * sp], s0: tr.range(3, 6), grow: tr.range(7, 12), t0: 1.2 + Math.pow(tr(), 1.4) * 4.6 });
    }
    const steamRing = makePuffs(ringList, { life: 15, drag: 0.6, rise: 3.5, opacity: 0.9, glow: night ? 2.4 : 0.6, order: 3, ball: 1, rng: tr });
    await ctx.yield();
    const ventList = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 9; j++) ventList.push({ p: [62 + i * 25, 26.5, TANKZ], v: [sr.range(8, 14), sr.range(3, 6), sr.range(-3, 3)], s0: 1.2, grow: sr.range(3, 5), t0: j * 0.5 + i * 0.17 });
    for (let j = 0; j < 12; j++) ventList.push({ p: [1.9, PADH + 30 + (j % 3) * 9, (j % 2 ? 1 : -1) * 0.6], v: [sr.range(5, 9), sr.range(-2.5, -1), sr.range(-2, 2)], s0: 0.5, grow: sr.range(1.6, 2.6), t0: j * 0.37 });
    const vents = makePuffs(ventList, { loop: 4.5, drag: 0.5, opacity: 0.5 });
    await ctx.yield();
    const fireList = [];
    for (let i = 0; i < 64; i++) { const sx = i % 2 ? 1 : -1; fireList.push({ p: zx([sx * sr.range(3, 9), sr.range(1, 2.5), sr.range(-3.5, 3.5)]), v: zx([sx * sr.range(70, 150), sr.range(0, 9), sr.range(-7, 7)]), s0: sr.range(2.5, 4), grow: sr.range(5, 9), t0: (i / 64) * 0.9 }); }
    const fireP = makePuffs(fireList, { loop: 0.9, drag: 1.3, opacity: 0, lit: new THREE.Color(2.6, 1.25, 0.4), shade: new THREE.Color(1.5, 0.45, 0.1), additive: true, order: 4 });
    let wall = null;
    if (weather === 'wall') {
      const wl = [], wx = -rollSign * rng.range(2500, 4500), wz = rng.range(4500, 6500);
      for (let i = 0; i < 150; i++) {
        const h = 900 + Math.pow(sr(), 0.8) * 7200, k = h / 8100, spread = 900 + 1400 * (1 - k) + 2600 * smoothstep(0.82, 1, k), a = sr() * TAU, d = Math.sqrt(sr()) * spread;
        wl.push({ p: [wx + Math.cos(a) * d * 1.8, h, wz + Math.sin(a) * d], s0: sr.range(600, 1150), t0: -5 });
      }
      wl.sort((a, b) => a.p[1] - b.p[1]);
      wall = makePuffs(wl, { lit: L.cloud, opacity: 0.95, order: 4 });
    }
    await ctx.yield();
    // cumulus towers standing up through the first deck all round the climb-out (clear of the line of flight):
    // between the decks we rise among them, sunlit on one side and blue on the other
    const twl = [], nTow = weather === 'fog' ? 9 : 13;
    for (let i = 0; i < nTow; i++) {
      const a = (i / nTow) * TAU + tr.range(-0.2, 0.2), d = i % 3 === 0 ? tr.range(950, 1500) : tr.range(2300, 6200);
      let tx = Math.sin(a) * d, tz = Math.cos(a) * d * 0.9 + (i % 3 === 0 ? 500 : 600);
      if (tz < 150 && Math.abs(tx) < 2200) { if (i % 3 === 0) tz = 300 - tz * 0.6; else tx = (tx < 0 ? -1 : 1) * (2200 + Math.abs(tx)); }
      const top = 1900 + tr() * 2600 * (d / 6200 + 0.35), n = 10 + Math.round(8 * detail), lx = tr.range(-0.2, 0.2), lz = tr.range(-0.2, 0.2);
      for (let j = 0; j < n; j++) {
        const k = j / (n - 1), h = lerp(1150, top, Math.pow(k, 0.85)), wide = lerp(1, 0.42, k) + 0.3 * Math.exp(-(((k - 0.85) / 0.14) ** 2)), sz = (430 + 260 * tr()) * wide * (0.7 + 0.5 * d / 6200);
        twl.push({ p: [tx + (h - 1150) * lx + tr.range(-1, 1) * sz * 0.8, h, tz + (h - 1150) * lz + tr.range(-1, 1) * sz * 0.8], s0: sz, t0: -5 });
      }
    }
    twl.sort((a, b) => a.p[1] - b.p[1]);
    const towers = makePuffs(twl, { lit: L.cloud.clone().multiplyScalar(1.06), shade: L.cloud.clone().multiply(new THREE.Color(0.36, 0.47, 0.74)), opacity: 0.97, order: 1.5, ball: 1, rng: tr });
    await ctx.yield();
    // a ring of great cumulonimbus far out over the gulf (9 to 27 km from the pad, clear of the line of flight, tops at 7 to 12 km):
    // on the horizon between the decks, level with us in the middle air, then sculpted towers standing on the map far below
    const fq = makeRng(String(ctx.seed) + ':far'), fwl = [], nFar = 9;
    for (let i = 0; i < nFar; i++) {
      const a = ((i + 0.5) / nFar) * TAU + fq.range(-0.22, 0.22), d = fq.range(9000, 27000);
      let tx = Math.sin(a) * d, tz = Math.cos(a) * d;
      if (tz < 2000 && Math.abs(tx) < 6500) tx = (tx < 0 ? -1 : 1) * (6500 + Math.abs(tx) * 0.8);       // the corridor downrange stays open
      const top = fq.range(7000, 12500), n = 11 + Math.round(7 * detail), lx = fq.range(-0.18, 0.18), lz = fq.range(-0.18, 0.18), girth = fq.range(0.8, 1.25);
      for (let j = 0; j < n; j++) {
        const k = j / (n - 1), h = lerp(1300, top, Math.pow(k, 0.8)), wide = lerp(1.15, 0.5, k) + 0.75 * Math.exp(-(((k - 0.93) / 0.1) ** 2)), sz = (1150 + 650 * fq()) * wide * girth;
        fwl.push({ p: [tx + (h - 1300) * lx + fq.range(-1, 1) * sz * 0.7, h, tz + (h - 1300) * lz + fq.range(-1, 1) * sz * 0.7], s0: sz, t0: -5 });
      }
    }
    fwl.sort((a, b) => a.p[1] - b.p[1]);
    const farTowers = makePuffs(fwl, { lit: L.cloud.clone().multiplyScalar(1.06), shade: L.cloud.clone().multiply(new THREE.Color(0.36, 0.47, 0.74)), opacity: 0.97, order: 1.6, ball: 1, rng: fq });
    await ctx.yield();
    // ---------- the exhaust column left standing on the pad, sheared by the winds ----------
    const hullPos = (t, out) => { const ph = downAt(t) / RE, r = RE + altAt(t) + PADH; return out.set(0, r * Math.cos(ph) - RE, -r * Math.sin(ph)); };
    const NR = 110, NS = 14, cC = [], cT = [], cA = [], cI = [], _hp = new THREE.Vector3();
    for (let i = 0; i <= NR; i++) {
      const t = 5.2 + 16.9 * Math.pow(i / NR, 1.1); hullPos(t, _hp);
      for (let j = 0; j <= NS; j++) { cC.push(_hp.x, _hp.y, _hp.z); cT.push(t); cA.push((j / NS) * TAU); }
    }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + 1, c = a + NS + 1, d = c + 1; cI.push(a, c, b, b, c, d); }
    const colGeo = new THREE.BufferGeometry();
    colGeo.setAttribute('position', new THREE.Float32BufferAttribute(cC, 3)); colGeo.setAttribute('aT', new THREE.Float32BufferAttribute(cT, 1)); colGeo.setAttribute('aAng', new THREE.Float32BufferAttribute(cA, 1)); colGeo.setIndex(cI);
    const COL = { ...AIR, uTime, uSunE, uFire, uThr, uT: { value: 0 }, uHead: { value: new THREE.Vector3() }, uLit: { value: puffLit }, uShade: { value: puffLit.clone().multiply(new THREE.Color(0.45, 0.52, 0.66)) } };
    const column = new THREE.Mesh(colGeo, new THREE.ShaderMaterial({
      uniforms: COL, fog: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute float aT, aAng; uniform float uT, uTime; uniform vec3 uHead; varying vec3 vN, vE; varying float vAge, vAng, vT;
        ${GLSL_N}
        void main(){
          float age = uT - aT; vec3 c = position; float rad = 1.5;
          if (age < 0.) c = uHead;
          else {
            rad = min(10. + 40. * sqrt(age) * (1. + position.y / 6000.), 5200.) * smoothstep(0., 3.6, age);
            float ly = log2(1. + max(position.y, 0.) / 150.) * 2.1;      // the winds shear it into a zigzag whose reach grows with height
            c.xz += ((vec2(vn(vec2(ly, 3.)), vn(vec2(ly, 11.))) - .5) + .4 * (vec2(vn(vec2(ly * 2.7, 5.)), vn(vec2(ly * 2.7, 17.))) - .5)) * min(age * 90., position.y * .42 + 8.);
            rad *= .75 + .6 * vn(vec2(ly * 1.7, 23.));
            rad *= 1. + .28 * (vn(vec2(aAng * 1.4 + aT * 4., aT * 6. + uTime * .05)) - .5);
          }
          vN = vec3(cos(aAng), 0., sin(aAng)); vAge = age; vAng = aAng; vT = aT;
          vE = c + vN * rad;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(vE, 1.);
        }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uThr; uniform vec3 uSunE, uLit, uShade, uFire; varying vec3 vN, vE; varying float vAge, vAng, vT;
        ${GLSL_N}
        ${GLSL_AIR}
        void main(){
          float l = max(dot(normalize(vN), normalize(vec3(uSunE.x, 0., uSunE.z) + vec3(1e-4, 0., 0.))), 0.) * .7 + .3;
          float b = vn(vec2(vAng * 3., vT * 14. - uTime * .1)) * .6 + .4 * vn(vec2(vAng * 8., vT * 40.));
          vec3 col = mix(uShade, uLit, clamp(l * (.8 + .3 * b), 0., 1.));
          col = mix(col, uFire * (1.1 + .9 * b), min(uThr * 1.3, 1.) * exp(-max(vAge, 0.) * .9));       // the young smoke glows from inside
          gl_FragColor = vec4(aerial(col, vE), 1.);
        }`,
    }));
    column.frustumCulled = false; earth.add(column);
    await ctx.yield();

    // ---------- birds: egrets (or flamingos) and frigatebirds bursting from the islets, a file of pelicans on the surf ----------
    const nBird = Math.round(300 * detail * dens), nPel = 12, nNear = 44, nB = nBird + nPel + nNear, bO = new Float32Array(nB * 3), bD = new Float32Array(nB * 4), bC = new Float32Array(nB * 3);
    const br = rng.fork('birds'), near = coast === 'mangrove' ? islets.filter((it) => Math.hypot(it[0], it[1]) < 2600) : [];
    const cEgret = flamingos ? new THREE.Color(0.85, 0.36, 0.42) : new THREE.Color(0.9, 0.9, 0.88), cFrig = new THREE.Color(0.03, 0.03, 0.035);
    for (let i = 0; i < nBird; i++) {
      let x, z;
      if (near.length && br.chance(0.8)) { const it = near[br.int(0, near.length - 1)]; x = it[0] + br.range(-1, 1) * it[2]; z = it[1] + br.range(-1, 1) * it[2]; }
      else { const a = br.range(0.15, Math.PI - 0.15), d = br.range(260, 1500); x = Math.cos(a) * d; z = Math.sin(a) * d * (coast === 'mangrove' ? 1 : br.sign() * 0.3); }
      bO.set([x, 4, z], i * 3);
      const away = Math.atan2(z, x) + br.range(-0.9, 0.9);
      bD.set([away, br.range(9, 17), i % 3 === 0 ? -200 - br() * 80 : 0.15 + Math.hypot(x, z) / 340 * 0.25 + br.range(0, 1.6), br()], i * 4);
      const c = br.chance(0.72) ? cEgret : cFrig; bC.set([c.r, c.g, c.b], i * 3);
    }
    for (let i = 0; i < nPel; i++) { const k = nBird + i; bO.set([-900 - i * 11, 5 + (i % 2), -(BARW + 18) - (i % 3) * 2], k * 3); bD.set([0, 13, -1000, br()], k * 4); bC.set([0.5, 0.45, 0.38], k * 3); }
    for (let i = 0; i < nNear; i++) {          // the ones that roost on the steel: off the tower, the masts and the tanks at ignition, past the lens
      const k = nBird + nPel + i, w = i % 4; let x, y, z;
      if (w < 2) { x = TX * Math.cos(rho0) + tr.range(-5, 5); z = -TX * Math.sin(rho0) + tr.range(-5, 5); y = tr.range(34, 90); }
      else if (w === 2) { x = (tr.sign()) * 45 + tr.range(-3, 3); z = (tr.sign()) * 41 + tr.range(-3, 3); y = tr.range(40, 96); }
      else { x = 62 + 25 * (i % 3) + tr.range(-8, 8); z = TANKZ + tr.range(-8, 8); y = 22; }
      bO.set([x, y - 30, z], k * 3); bD.set([Math.atan2(z, x) + tr.range(-1.2, 1.2), tr.range(13, 22), 100.5 + tr() * 2.2, tr() * 0.35], k * 4);
      const c = i % 5 === 0 ? cFrig : cEgret; bC.set([c.r, c.g, c.b], k * 3);
    }
    const birdGeo = new THREE.InstancedBufferGeometry();
    birdGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.3, 0, 0, -0.3, -1, 0, -0.1, 0, 0, 0.3, 1, 0, -0.1, 0, 0, -0.3, 0.12, 0, 0.55, -0.12, 0, 0.55, 0, 0, -0.55], 3));
    birdGeo.setAttribute('aO', new THREE.InstancedBufferAttribute(bO, 3)); birdGeo.setAttribute('aD', new THREE.InstancedBufferAttribute(bD, 4)); birdGeo.setAttribute('aC', new THREE.InstancedBufferAttribute(bC, 3));
    birdGeo.instanceCount = nB;
    const BIRD = { uTime, uClock: { value: 0 }, uLight: { value: new THREE.Color().copy(L.sunCol).multiplyScalar(L.sunAmt).add(L.amb).multiplyScalar(1.1) }, uFire, uThr };
    const birds = new THREE.Mesh(birdGeo, new THREE.ShaderMaterial({
      uniforms: BIRD, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`
        attribute vec3 aO, aC; attribute vec4 aD; uniform float uTime, uClock; varying vec3 vC;
        void main(){
          float nearF = step(50., aD.z);
          float tt = aD.z < -500. ? mod(uTime, 140.) : max(uClock - aD.z + 100. * nearF, 0.);
          float wh = aD.z < -500. ? 0. : 1.;
          float hd = aD.x + wh * .7 * sin(tt * .35 + aD.w * 20.);
          vec2 dir = vec2(cos(hd), sin(hd));
          float go = aD.y * tt;
          vec3 c = aO + vec3(dir.x * go, wh * (30. + 50. * aD.w) * (1. - exp(-tt * .35)) + sin(uTime * .9 + aD.w * 30.) * 1.5, dir.y * go);
          c.xz += wh * vec2(-dir.y, dir.x) * sin(tt * .5 + aD.w * 40.) * 22.;
          float fl = sin(uTime * (7. + 4. * aD.w) + aD.w * 50.) * step(.001, tt);
          vec3 p = position * mix(2.6, 1., nearF); p.y += abs(position.x) * fl * 1.5;
          vec3 w = c + vec3(p.x * dir.y + p.z * dir.x, p.y, -p.x * dir.x + p.z * dir.y);
          vC = aC * (.8 + .2 * fl);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(w, 1.);
        }`,
      fragmentShader: /* glsl */`uniform vec3 uLight, uFire; uniform float uThr; varying vec3 vC; void main(){ gl_FragColor = vec4(vC * (uLight + uFire * uThr * .15), 1.); }`,
    }));
    birds.frustumCulled = false; earth.add(birds);
    await ctx.yield();

    await ctx.yield();
    // ---------- boats with wakes, travelling the edge of the exclusion zone ----------
    const wakeC = new THREE.Color(0.8, 0.86, 0.86);
    const boatGeo = merge([box(18, 2.4, 5, 0, 1, 0, cWhite), box(6, 2.6, 3.6, -1, 3.3, 0, cRoof), box(5, 0.5, 3, 7.5, 2.3, 0, cGrey),
      box(90, 0.12, 2.2, -53, 0.2, 7, wakeC, 0.13), box(90, 0.12, 2.2, -53, 0.2, -7, wakeC, -0.13), box(46, 0.12, 3.2, -31, 0.22, 0, wakeC)]);
    const nBoat = Math.round(14 * dens), boats = new THREE.InstancedMesh(boatGeo, padMat, nBoat), boatD = [];
    for (let i = 0; i < nBoat; i++) boatD.push({ x: rng.range(-2600, 2600), z: -rng.range(620, 1500) * (i % 5 === 4 ? -2.4 : 1), v: rng.range(5, 11) * rng.sign() });
    boats.frustumCulled = false; earth.add(boats);
    const placeBoats = (time) => {
      for (let i = 0; i < nBoat; i++) {
        const b = boatD[i], x = ((b.x + b.v * time + 2600) % 5200 + 5200) % 5200 - 2600;
        boats.setMatrixAt(i, _m4.compose(_v.set(x, Math.sin(time * 1.3 + i) * 0.25, b.z), _q.setFromAxisAngle(_s.set(0, 1, 0), b.v > 0 ? 0 : Math.PI), _s.set(1, 1, 1)));
      }
      boats.instanceMatrix.needsUpdate = true;
    };
    placeBoats(0);

    // ---------- the vehicle ----------
    const hero = await buildHero(ctx, { palette: P });
    const hull = hero.object; hull.matrixAutoUpdate = false; scene.add(hull);
    await ctx.yield();
    // cloud wisps and vapour streaking aft past the pod (hull frame)
    const nW = Math.round(90 * detail), wS = new Float32Array(nW * 4); for (let i = 0; i < nW * 4; i++) wS[i] = rng();
    const wGeo = new THREE.InstancedBufferGeometry();
    wGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); wGeo.setIndex([0, 1, 2, 0, 2, 3]);
    wGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(wS, 4)); wGeo.instanceCount = nW;
    const WISP = { uRun: { value: 0 }, uAmt: { value: 0 }, uThin: { value: 1 }, uBright: { value: 1 }, uCol: { value: night ? lin('#8fa0c0', 0.25) : dawn ? lin('#f0d2cc', 0.8) : new THREE.Color(0.86, 0.88, 0.9) } };
    const wisps = new THREE.Mesh(wGeo, new THREE.ShaderMaterial({
      uniforms: WISP, transparent: true, depthWrite: false, fog: false,
      vertexShader: /* glsl */`
        attribute vec4 aSeed; uniform float uRun, uAmt, uThin; varying vec2 vQ; varying float vA;
        void main(){
          float y = 112. - mod(aSeed.y * 100. + uRun * (.7 + .6 * aSeed.w), 100.);
          float ang = aSeed.x * 6.2832, rad = 3.4 + aSeed.z * aSeed.z * 11.;
          vec3 cv = (modelViewMatrix * vec4(sin(ang) * rad, y, cos(ang) * rad, 1.)).xyz;
          vec3 ax = normalize((modelViewMatrix * vec4(0., 1., 0., 0.)).xyz);
          vec3 sd = normalize(cross(ax, cv) + vec3(1e-5, 0., 0.));
          vec3 p = cv + ax * position.y * (5. + 12. * aSeed.w) * (.3 + .7 * uThin) + sd * position.x * (.5 + 1.3 * aSeed.z) * uThin;
          vQ = position.xy; vA = step(aSeed.w, uAmt * 1.2) * min(uAmt, 1.) * smoothstep(12., 30., y) * (1. - smoothstep(95., 112., y)) * smoothstep(.8, 2.5, -cv.z);
          gl_Position = projectionMatrix * vec4(p, 1.);
        }`,
      fragmentShader: /* glsl */`uniform vec3 uCol; uniform float uBright; varying vec2 vQ; varying float vA;
        void main(){ float a = min(vA * (1. - vQ.x * vQ.x) * (1. - vQ.y * vQ.y) * .5 * uBright, 1.); if (a < .004) discard; gl_FragColor = vec4(uCol * (.7 + .3 * uBright), a); }`,
    }));
    wisps.frustumCulled = false; wisps.renderOrder = 3; wisps.visible = false; hull.add(wisps);
    // after staging: ice crystals drifting alongside in a box that wraps round the lens, twinkling in the sun
    const nX = Math.round(440 * detail), xS = new Float32Array(nX * 4); for (let i = 0; i < nX * 4; i++) xS[i] = rng();
    const xGeo = new THREE.BufferGeometry();
    xGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nX * 3), 3)); xGeo.setAttribute('aSeed', new THREE.BufferAttribute(xS, 4));
    const CRY = { uTime, uAmt: { value: 0 }, uPx: hero.uniforms.uPx, uCamL: { value: new THREE.Vector3() } };
    const crystals = new THREE.Points(xGeo, new THREE.ShaderMaterial({
      uniforms: CRY, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */`
        attribute vec4 aSeed; uniform float uTime, uAmt, uPx; uniform vec3 uCamL; varying float vA;
        void main(){
          vec3 h = fract(aSeed.xyz * vec3(7.31, 3.17, 5.71) + aSeed.w);
          vec3 p0 = aSeed.xyz * 18. + (h - .5) * uTime * vec3(.5, .8, .5) + vec3(0., -uTime * .45, 0.);
          p0 += .25 * vec3(sin(uTime * .6 + aSeed.w * 40.), cos(uTime * .5 + aSeed.x * 40.), sin(uTime * .7 + aSeed.y * 40.));
          vec3 p = mod(p0 - uCamL + 9., 18.) - 9. + uCamL;
          vec4 mv = modelViewMatrix * vec4(p, 1.);
          float dist = max(-mv.z, .05) / max(length(modelMatrix[1].xyz), 1e-4);
          float s = sin(uTime * (1.5 + 6. * aSeed.w) + aSeed.z * 60.) * .5 + .5, tw = s * s * s * s;
          vA = uAmt * (.45 + 2.6 * tw) * smoothstep(.5, 1.6, dist) * (1. - smoothstep(6.5, 9., dist));
          gl_PointSize = clamp(uPx * (.012 + .03 * h.x) / dist, 1.6, uPx * .014);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`varying float vA;
        void main(){ vec2 c = gl_PointCoord - .5; float d = dot(c, c) * 4.; float a = 1. - smoothstep(0., 1., d); gl_FragColor = vec4(vec3(.82, .92, 1.) * 2.6 * vA * a * a, 1.); }`,
    }));
    crystals.frustumCulled = false; crystals.renderOrder = 5; crystals.visible = false; hull.add(crystals);
    // ignition: sheets of frost crack off the tanks and tumble past the lens at arm's length (hull frame, keyed to the flight clock)
    const nSh = Math.round(300 * detail), shS = new Float32Array(nSh * 4); for (let i = 0; i < nSh * 4; i++) shS[i] = tr();
    const shGeo = new THREE.InstancedBufferGeometry();
    shGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); shGeo.setIndex([0, 1, 2, 0, 2, 3]);
    shGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(shS, 4)); shGeo.instanceCount = nSh;
    const SHEET = { uClock: { value: 0 }, uDim: { value: 1 }, uShare: { value: 1 }, uG: { value: 7 }, uTime, uSunView, uLit: { value: night ? new THREE.Color(0.1, 0.12, 0.2) : dawn ? new THREE.Color(0.6, 0.6, 0.75) : new THREE.Color(0.95, 0.97, 1) }, uFire, uThr };
    const sheets = new THREE.Mesh(shGeo, new THREE.ShaderMaterial({
      uniforms: SHEET, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`
        attribute vec4 aSeed; uniform float uClock, uShare, uG; varying vec2 vQ; varying float vSeed, vOn; varying vec3 vNv;
        void main(){
          float t0 = .1 + aSeed.x * aSeed.x * 4.4, age = uClock - t0; vOn = step(0., age) * step(age, 3.4) * step(fract(aSeed.w * 5.3 + aSeed.y * 3.1), uShare); age = clamp(age, 0., 3.4);
          float ang = (aSeed.y < .5 ? -1. : 1.) * (.7 + abs(aSeed.y - .5) * 2.3), rad = 2.05 + (.8 + 4.2 * aSeed.w) * age, y = 57.4 - aSeed.z * aSeed.z * 22. - (2.5 + 3. * aSeed.w) * age - uG * age * age;
          vec3 c = vec3(sin(ang) * rad, y, cos(ang) * rad);
          float f7 = fract(aSeed.w * 7.3), sz = (.07 + .25 * f7 * f7) * (1. - .6 * smoothstep(2.2, 3.4, age));
          float a1 = aSeed.x * 40. + age * (2.5 + 5. * aSeed.z), a2 = aSeed.y * 30. + age * (1.5 + 4. * aSeed.w);
          vec3 ex = vec3(cos(a1), sin(a1) * sin(a2), sin(a1) * cos(a2)), ey = vec3(0., cos(a2), -sin(a2));
          vec3 p = c + (ex * position.x * (1.1 + 1.3 * fract(aSeed.z * 13.7)) + ey * position.y) * sz * vOn;
          vQ = position.xy; vSeed = aSeed.z * 31. + aSeed.x * 17.; vNv = normalize(normalMatrix * cross(ex, ey) + vec3(0., 0., 1e-5));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSunView, uLit, uFire; uniform float uThr, uTime, uDim; varying vec2 vQ; varying float vSeed, vOn; varying vec3 vNv;
        ${GLSL_N}
        void main(){
          if (vOn < .5) discard;
          // a shard of tank frost: a ragged splinter, blue in its body, white where rime clings, cracked, glinting as it turns
          float ng = 3. + floor(fract(vSeed * .37) * 3.), sg = 6.2832 / ng, a = atan(vQ.y, vQ.x + 1e-5) + vSeed;
          float k = floor(a / sg), dp = cos(3.14159 / ng) / max(cos(a - (k + .5) * sg), .2) * (.45 + .5 * h21(vec2(k + ng, vSeed)));
          float rr = length(vQ) / dp + (vn(vQ * 5. + vSeed) - .5) * .5;
          if (rr > 1.) discard;
          float nl = abs(dot(normalize(vNv), uSunView));
          float rime = smoothstep(.35, .7, vn(vQ * 9. + vSeed * 3.)), crack = 1. - smoothstep(0., .06, abs(vn(vQ * 3.5 + vSeed) - .5));
          vec3 col = mix(vec3(.2, .42, .8), vec3(.62, .8, 1.), nl) * uLit * (.55 + .45 * rime);
          col = mix(col, uLit, .55 * rime * (.3 + .7 * nl));
          col += uLit * (.5 * crack + .5 * smoothstep(.75, 1., rr) + 3. * pow(nl, 30.)) + uFire * uThr * .3;
          gl_FragColor = vec4(col * uDim, 1.);
        }`,
    }));
    sheets.frustumCulled = false; hull.add(sheets);

    await ctx.yield();
    // the orbital leg's sights: a station crossing between us and the Earth, and a wheel of ice round the exit
    const orbit = await buildOrbit(ctx, { rng: makeRng(String(ctx.seed) + ':orbit'), uTime, uPx: hero.uniforms.uPx, iceR0: 9.8, iceR1: 27 });
    hull.add(orbit.station); orbit.ice.position.set(0, 0, -600); scene.add(orbit.ice);
    if (night) orbit.SU.uShine.value.multiplyScalar(0.6);
    await ctx.yield();
    // rare event: the heavy variant, two side boosters that let go together and fall away as a mirrored pair
    let sides = null;
    if (heavy) {
      const hw = hero.variant.livery === 'steel' ? new THREE.Color(0.44, 0.46, 0.49) : new THREE.Color(0.66, 0.66, 0.64);
      const pts = [[0.9, 0], [1.55, 1.2], [1.6, 2.2], [1.6, 38], [1.2, 42], [0.5, 45.5], [0, 46.2]].map((p) => new THREE.Vector2(p[0], p[1]));
      const bodyG = merge([tint(new THREE.LatheGeometry(pts, 28), hw), tint(new THREE.CylinderGeometry(1.62, 1.62, 3, 28, 1, true), cDark).translate(0, 30, 0), box(0.5, 1.2, 1.2, -1.7, 34, 0, cGrey), box(0.5, 1.2, 1.2, -1.7, 8, 0, cGrey)]);
      const sMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0 });
      const flame = new THREE.CylinderGeometry(1, 0.08, 1, 20, 12, true).translate(0, -0.5, 0);
      const fMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
        uniforms: { uTime: hero.uniforms.uTime, uPress: hero.uniforms.uPress, uThrottle: hero.uniforms.uThrottle, uFire },
        vertexShader: /* glsl */`uniform float uPress, uThrottle, uTime; varying float vT; varying vec3 vNv, vPv;
          void main(){ float t = -position.y, ex = pow(clamp(1. - uPress, 0., 1.), 1.5);
            float r = mix(.95 * (1. + .5 * sin(t * 3.1416)) * sqrt(max(1. - t, 1e-4)), .9 + 60. * t, ex) * (1. + .06 * sin(uTime * 31. + t * 12.));
            vec3 p = vec3(normalize(position.xz + vec2(1e-5, 0.)) * r, -t * mix(70., 420., ex) * (.1 + .9 * uThrottle)).xzy;
            vT = t; vec4 mv = modelViewMatrix * vec4(p, 1.); vPv = mv.xyz; vNv = normalize(normalMatrix * vec3(position.x, 0., position.z) + vec3(0., 0., 1e-5));
            gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`uniform float uPress, uThrottle; uniform vec3 uFire; varying float vT; varying vec3 vNv, vPv;
          void main(){ float ex = pow(clamp(1. - uPress, 0., 1.), 1.5), f = abs(dot(normalize(vNv), normalize(-vPv + vec3(0., 0., 1e-5))));
            vec3 col = mix(mix(vec3(1.6, 1.3, .85), uFire * .6, smoothstep(0., .6, vT)), vec3(.2, .2, .32), ex);
            gl_FragColor = vec4(col * (.35 + .65 * smoothstep(0., .4, f)) * (1. - vT) * smoothstep(0., .08, uThrottle) * 1.2, 1.); }`,
      });
      sides = [-1, 1].map((sx) => {
        const g = new THREE.Group(), m = new THREE.Mesh(bodyG, sMat), f = new THREE.Mesh(flame, fMat), gl = hero.makeNozzleGlow(0.62);
        if (sx < 0) m.rotation.y = Math.PI; f.frustumCulled = false; f.renderOrder = 4; g.add(m, f, gl); hull.add(g); g.position.set(sx * 3.5, 1, 0);
        return { g, f, gl, sx };
      });
    }
    // white-outs inside the cloud decks and the one staging flash: a full-frame veil with the fire glowing through
    const OVER = { uW: { value: 0 }, uFlash: { value: 0 }, uGp: { value: new THREE.Vector2() }, uAspect: { value: ctx.aspect || 1.78 }, uThr, uFire,
      uCol: { value: night ? new THREE.Color(0.035, 0.04, 0.06) : dawn ? new THREE.Color(0.62, 0.56, 0.6) : new THREE.Color(0.86, 0.87, 0.88) }, uLantern: { value: night ? 2.4 : 1.1 } };
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: OVER, transparent: true, depthTest: false, depthWrite: false, fog: false, premultipliedAlpha: true,
      vertexShader: /* glsl */`varying vec2 vP; void main(){ vP = position.xy; gl_Position = vec4(position.xy, 0., 1.); }`,
      fragmentShader: /* glsl */`uniform float uW, uFlash, uAspect, uThr, uLantern; uniform vec2 uGp; uniform vec3 uCol, uFire; varying vec2 vP;
        void main(){ vec2 d = (vP - uGp) * vec2(uAspect, 1.); float g = exp(-dot(d, d) * 2.2) * uThr * uLantern;
          vec3 col = uCol * (1. + .25 * g) + uFire * g * .55;
          gl_FragColor = vec4(col * uW + vec3(.9, .95, 1.) * uFlash, uW); }`,
    }));
    veil.frustumCulled = false; veil.renderOrder = 60; veil.visible = false; scene.add(veil);
    // THE PASS THROUGH A DECK. Not a blank card: torn masses of cloud racing aft past the stack, drawn BEHIND the hull (a screen
    // quad at 75 m, depth-tested, so the bands, the rivets and the fire are never covered), streaming in towards the vanishing
    // point at the engines, lit on the sun's side and blue-grey in the hollows. One rule for every deck, weather and seed, by
    // time relative to the deck's own crossing (x = t - d.t): tatters from x = -1.1, at most about half the frame at x = 0,
    // gone by x = 0.8 as the deck's top falls away below. The kind follows the deck's altitude: cumulus low, stratus sheets
    // in the middle air, ice-thin cirrus streaks high.
    const PASS = { uA: { value: 0 }, uPhase: { value: 0 }, uGp: OVER.uGp, uAspect: OVER.uAspect, uThr, uFire, uLantern: OVER.uLantern, uZ: { value: 0 }, uKind: { value: new THREE.Vector3(1, 0, 0) }, uSeed: { value: 0 },
      uSunS: { value: new THREE.Vector2(0.7, 0.7) }, uLit: { value: L.cloud.clone().multiplyScalar(1.04) }, uShade: { value: L.cloud.clone().multiply(new THREE.Color(0.4, 0.5, 0.72)) } };
    const pass = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: PASS, transparent: true, depthTest: true, depthWrite: false, fog: false, premultipliedAlpha: true,
      vertexShader: /* glsl */`uniform float uZ; varying vec2 vP; void main(){ vP = position.xy; gl_Position = vec4(position.xy, uZ, 1.); }`,
      fragmentShader: /* glsl */`uniform float uA, uPhase, uAspect, uThr, uLantern, uSeed; uniform vec2 uGp, uSunS; uniform vec3 uKind, uLit, uShade, uFire; varying vec2 vP;
        float h31(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
        float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
          return mix(mix(mix(h31(i), h31(i + vec3(1., 0., 0.)), f.x), mix(h31(i + vec3(0., 1., 0.)), h31(i + vec3(1., 1., 0.)), f.x), f.y),
                     mix(mix(h31(i + vec3(0., 0., 1.)), h31(i + vec3(1., 0., 1.)), f.x), mix(h31(i + vec3(0., 1., 1.)), h31(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
        // cloud density in tunnel coordinates round the vanishing point: everything streams inwards and shrinks as it recedes aft
        float dens(vec2 d, float kA, float kZ){
          float r = max(length(d), 1e-3), lr = log(r); vec2 dir = d / r; float z = lr * kZ + uPhase;
          // sheets and streaks are never true rings or rays: the field is sheared round the axis, more the thinner the cloud
          float w = (uKind.y + .45 * uKind.z) * (.55 * sin(lr * 1.9 + uPhase * .35 + uSeed) + .9 * (vn3(vec3(dir * 1.3, z * .5 + uSeed)) - .5));
          dir = vec2(dir.x * cos(w) - dir.y * sin(w), dir.x * sin(w) + dir.y * cos(w));
          vec3 q = vec3(dir * kA, z) + uSeed;
          float n = vn3(q) * .5 + vn3(q * 2.03 + 7.1) * .27 + vn3(q * 4.1 + 3.3) * .15 + vn3(q * 8.3 + 1.7) * .08;
          return n;
        }
        void main(){
          vec2 d = (vP - uGp) * vec2(uAspect, 1.); float r = length(d);
          float kA = dot(uKind, vec3(1.5, 1.15, 4.2)), kZ = dot(uKind, vec3(1.25, 1.7, .8));
          float n = dens(d, kA, kZ), n2 = dens(d + uSunS * (.05 + .1 * r), kA, kZ);
          float thr = mix(.74, .505, uA) + dot(uKind, vec3(0., .035, .075)), soft = dot(uKind, vec3(.1, .1, .08));
          float a = smoothstep(thr - soft * .4, thr + soft, n) * dot(uKind, vec3(.93, .86, .66));
          a *= smoothstep(.03, .3, r);                                   // what has receded to the engines is the deck itself
          float haze = uA * uA * (.03 + .05 * vn3(vec3(d * 1.3, uPhase * .3)));
          float rel = clamp((n - n2) * dot(uKind, vec3(7., 5., 4.)) + .55, 0., 1.);
          float side = clamp(.5 + .45 * dot(d, uSunS), 0., 1.);
          vec3 col = mix(uShade * (.82 + .3 * side), uLit, smoothstep(.3, .92, rel * (.6 + .4 * a) + .22 * side));
          col *= .9 + .16 * smoothstep(thr, thr + .25, n);
          float g = exp(-r * r * 2.2) * uThr * uLantern;                 // the fire lights the cloud from inside
          col = col * (1. + .25 * g) + uFire * g * .55;
          float al = max(a, haze);
          gl_FragColor = vec4(col * al, al);
        }`,
    }));
    pass.frustumCulled = false; pass.renderOrder = 4.5; pass.visible = false; scene.add(pass);
    const passAmt = (x) => (x < 0 ? Math.pow(smoothstep(-1.1, -0.04, x), 1.6) : 1 - smoothstep(0.08, 0.7, x));
    decks.forEach((d, i) => { const h = d[0], cu = 1 - smoothstep(2500, 4500, h), ci = smoothstep(8000, 10000, h); d.kind = [cu, 1 - cu - ci, ci]; d.sd = 3.1 + i * 7.7; });
    await ctx.yield();

    // ---------- the rig: camera -> mount(u) -> hull -> trajectory(u) -> Earth ----------
    const A = hero.anchors, c12 = Math.cos(12 * DEG), s12 = Math.sin(12 * DEG);
    const qAft = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, s12, c12), new THREE.Vector3(0, c12, -s12)));
    const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1), ONE = new THREE.Vector3(1, 1, 1);
    const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), mM = new THREE.Matrix4(), mT = new THREE.Matrix4(), mCamE = new THREE.Matrix4(), mI = new THREE.Matrix4(), mS = new THREE.Matrix4();
    const upE = new THREE.Vector3(), fE = new THREE.Vector3(), ax = new THREE.Vector3(), nz = new THREE.Vector3(), xx = new THREE.Vector3(), O = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
    const camE = new THREE.Vector3(), camW = new THREE.Vector3(), qC = new THREE.Quaternion(), e4 = new THREE.Vector4();
    const deckPulse = (x) => (x < 0 ? smoothstep(-0.3, 0, x) : 1 - smoothstep(0.12, 0.52, x));
    const zenDim = new THREE.Color(0.012, 0.016, 0.03), bounce = lin(P[1], 0.9), earthshine = new THREE.Color(0.16, 0.26, 0.5), skyLight = new THREE.Color(0.55, 0.72, 1);
    let runAcc = 0, exitPortal = null;
    const limbBlue = new THREE.Color(0.3, 0.55, 1), mV = new THREE.Matrix4(), deckBoost = (h) => (h < 100 ? 1 : h < 3000 ? 13 : h < 8000 ? 18 : 20);
    const sunWarm = new THREE.Color(1, 0.74, 0.46), camF = new THREE.Vector3(0, c12, -s12), camU = new THREE.Vector3(0, s12, c12), mSt = new THREE.Matrix4(), mR = new THREE.Matrix4();
    const eul = new THREE.Euler(), sunH = new THREE.Vector3(), dnH = new THREE.Vector3(), pS = new THREE.Vector3(), HIDE = new THREE.Matrix4().makeScale(1e-5, 1e-5, 1e-5).setPosition(0, -4000, 0);
    const swingAt = curve([[0, 0], [10, 0], [14.2, 0.44], [17.6, 0.58], [21.2, 0.1], [24.4, -0.4], [25.4, -0.4], [40, -0.4]]);
    const LATE = 80 * DEG, SUN_AZ = 28 * DEG, MOON_AZ = 36 * DEG;
    const STG_X = -panSign, engCold = new THREE.Color(0.72, 0.84, 1);
    const own = new Set(scene.children);

    function update(dt, time, camera, u) {
      const t = clamp(u, 0, 1) * 40;
      uTime.value = time;
      // the vehicle's own state
      hero.setProgress(u);
      const ts = t - 22.6, stg = ts <= 0 ? 0 : Math.pow(clamp(ts / 5, 0, 1), 0.8);
      hero.setStaging(stg);
      // STAGING AS A PICTURE: the spent booster does not shoot away to a dot. It slides out of the sleeve, hangs close behind us
      // with its fins unfolding and turns slowly broadside against the planet in its own glitter, until the pan leaves it behind.
      if (ts > 0 && t <= 27.2) {
        const b = hero.parts.booster, d = 2.6 * ts + 3 * ts * ts, kd = smoothstep(1.5, 10, d), ang = 0.42 * Math.pow(ts, 1.5);
        b.position.set(STG_X * 0.3 * d * kd, 20 - d, 0.48 * d * kd);
        b.rotation.set(0.85 * ang, 0.3 * ang * STG_X, STG_X * 0.55 * ang);
        hero.uniforms.uDrift.value.set(b.position.x, b.position.y - 20, b.position.z);
      }
      let cg = 0, W = 0, near = 0;
      let pd = null, px = 0;
      for (const d of decks) { if (d.t < 0) continue; const x = t - d.t, pa = passAmt(x); cg += Math.exp(-(((x - 0.1) / 0.5) ** 2)); if (pa > W) { W = pa; pd = d; px = x; } near += Math.exp(-((x / 1.2) ** 2)); }
      hero.setCloudGlow(0.7 * Math.min(1, cg) * (pd ? 1 - 0.5 * pd.kind[2] : 1));     // ice-thin cirrus lights up less than a wall of cumulus
      if (t < 2) hero.setThrottle(Math.max(hero.state.throttle, 0.45 + 0.04 * Math.sin(time * 9)));   // already lit when seen through the portal
      if (dawn) uSunAmt.value = lerp(L.sunAmt, 0.8, smoothstep(1200, 20000, altAt(t)));
      const thr = hero.state.throttle, maxQ = hero.state.vapour;
      if (sides) for (const s of sides) {
        const d = 22 * stg + 1500 * Math.pow(stg, 1.6), ang = Math.pow(stg, 1.15) * 13;
        s.g.position.set(s.sx * (3.5 + 0.5 * d), 1 - d * 0.92, 0.3 * d * smoothstep(5, 70, d)); s.g.rotation.set(-ang * 0.5, 0, s.sx * ang);
        s.g.visible = stg < 0.999; s.f.visible = s.gl.visible = thr > 0.002;
      }
      // trajectory: hull pose in the Earth frame
      const lean = leanAt(t) * DEG, ph = downAt(t) / RE, roll = rho0 * (1 - smoothstep(5, 9, t)) + LATE * smoothstep(28.2, 39.4, t);
      upE.set(0, Math.cos(ph), -Math.sin(ph)); fE.set(0, -Math.sin(ph), -Math.cos(ph));
      ax.copy(upE).multiplyScalar(Math.cos(lean)).addScaledVector(fE, Math.sin(lean));
      nz.copy(upE).multiplyScalar(Math.sin(lean)).addScaledVector(fE, -Math.cos(lean));
      xx.crossVectors(ax, nz);
      tmp.copy(nz).multiplyScalar(Math.cos(roll)).addScaledVector(xx, Math.sin(roll));
      tmp2.copy(xx).multiplyScalar(Math.cos(roll)).addScaledVector(nz, -Math.sin(roll));
      hullPos(t, O);
      mT.makeBasis(tmp2, ax, tmp).setPosition(O);
      // the orbital sun stands low ahead and to one side, climbing over the limb; the moon hangs on the other side
      const dip = Math.acos(RE / (RE + Math.max(altAt(t), 1))), sEl = -dip + (-3.2 + 5.6 * smoothstep(28.6, 34.5, t)) * DEG, sW = smoothstep(27.0, 30.5, t);
      uSunV.value.set(-Math.sin(SUN_AZ) * Math.cos(sEl), 0, 0, sW); tmp.copy(fE).multiplyScalar(Math.cos(SUN_AZ) * Math.cos(sEl)).addScaledVector(upE, Math.sin(sEl));
      uSunV.value.x += tmp.x; uSunV.value.y = tmp.y; uSunV.value.z = tmp.z;
      SKY.uPre.value = smoothstep(23.4, 28.6, t) * (night ? 0.7 : 1);
      const mEl = -dip + 14 * DEG; SKY.uMoonE.value.copy(fE).multiplyScalar(Math.cos(MOON_AZ) * Math.cos(mEl)).addScaledVector(upE, Math.sin(mEl)); SKY.uMoonE.value.x += Math.sin(MOON_AZ) * Math.cos(mEl);
      // mount: aft view, the one pan about the skin normal, then forward and rolled so the Earth sits below-left
      const pan = smoothstep(25, 27.2, t), shake = thr * (0.003 + 0.0055 * maxQ) * smoothstep(1.2, 3, t);
      const wan = 0.011 * smoothstep(22.6, 25, t);        // coasting: the stack drifts slowly in attitude, nothing is ever still
      // the gaze swings slowly off the nose through the climb above the weather, so the hull runs to one lower corner, then the other
      const sw = swingAt(t) * (1 - pan);
      q.setFromAxisAngle(Z, panSign * (Math.PI * pan + sw)).multiply(qAft);
      // through the pan the view dips towards the skin, so the hull's curve stays along the bottom of the frame
      q.multiply(q2.setFromAxisAngle(X, -12 * DEG * pan - 7 * DEG * smoothstep(29.5, 38, t) - 10 * DEG * Math.sin(Math.PI * pan) + shake * Math.sin(time * 69.1) * Math.sin(time * 7.3 + 1) + wan * Math.sin(time * 0.9 + 1)));
      q.multiply(q2.setFromAxisAngle(Z, 25 * DEG * pan - panSign * 0.3 * sw + shake * 0.7 * Math.sin(time * 61.7 + 2) + wan * 0.8 * Math.sin(time * 0.7)));
      q.multiply(q2.setFromAxisAngle(Y, shake * 0.8 * Math.sin(time * 75.4 + 4) + wan * Math.sin(time * 1.1 + 2)));
      // Seen through a portal the engine clips everything nearer than the opening. Scaling the whole world about the
      // lens leaves the picture exactly as it is, so the opening shows the docked first frame: grow the world until
      // its nearest part clears the opening (up to 200 times), stand back for whatever is left, dock as the viewer arrives.
      const sN = clamp(camera.near / 0.25, 1, 200), stand = Math.max(0, camera.near - 0.25 * sN);
      mM.compose(A.pod, q, ONE);
      mCamE.multiplyMatrices(mT, mM);
      camE.setFromMatrixPosition(mCamE);
      const camAlt = Math.max(1, Math.sqrt(camE.x * camE.x + (camE.y + RE) * (camE.y + RE) + camE.z * camE.z) - RE);
      const k = Math.max(1, camAlt / 1200);
      const C = camera.matrixWorld;
      mV.makeTranslation(0, 0, -stand).premultiply(C);
      hull.matrix.multiplyMatrices(mV, mS.makeScale(sN, sN, sN)).multiply(mI.copy(mM).invert()); hull.matrixWorldNeedsUpdate = true;
      earth.matrix.multiplyMatrices(mV, mS.makeScale(sN / k, sN / k, sN / k)).multiply(mI.copy(mCamE).invert()); earth.matrixWorldNeedsUpdate = true;
      // sky and air
      C.decompose(camW, qC, tmp);
      SKY.uW2E.value.setFromMatrix4(mI.copy(C).invert().premultiply(mCamE));
      SKY.uUpE.value.set(camE.x, camE.y + RE, camE.z).normalize();
      AIR.uCamE.value.copy(camE); AIR.uAlt.value = camAlt;
      // lights follow the lens: hard key from behind it, the fire from aft, sky above and the sea's bounce below
      key.position.copy(tmp.set(-0.3, 0.62, 0.72).applyQuaternion(qC).multiplyScalar(50).add(camW)); key.target.position.copy(camW);
      const hi = smoothstep(20000, 45000, camAlt);        // above the weather: harder key, black shadows, earthshine
      key.intensity = L.key * (dawn ? lerp(0.1, 1, smoothstep(1200, 3800, camAlt)) : 1) * (1 + (night ? 0.6 : 0.45) * hi);
      tmp.copy(ax).multiplyScalar(-1).addScaledVector(nz, 0.5).transformDirection(earth.matrix);
      const sunK = t > 26.5 ? uSunV.value.w : 0;         // after cut-off the same lamp is the low sun raking the foil and the hull
      if (sunK > 0) tmp.set(uSunV.value.x, uSunV.value.y, uSunV.value.z).transformDirection(earth.matrix);
      // between staging and the low sun the same lamp is the upper stage's engine lighting the booster it has just left
      // (from ahead, cold), so the booster is never a black shape on the night side
      const eng = stg > 0 && t <= 26.5 ? smoothstep(22.7, 23.4, t) * (1 - smoothstep(25.6, 26.5, t)) : 0;
      if (eng > 0) tmp.copy(ax).addScaledVector(nz, 0.45).transformDirection(earth.matrix);
      glow.color.copy(t > 26.5 ? sunWarm : eng > 0 ? engCold : fire);
      glow.position.copy(tmp).multiplyScalar(50).add(camW); glow.target.position.copy(camW);
      glow.intensity = sunK * (night ? 3.2 : 2.6) + thr * (night ? 2.6 : dawn ? 1.7 : 1.3) * (1 + 1.5 * hero.state.cloud) * (0.85 + 0.15 * Math.sin(time * 37) * Math.sin(time * 23.1 + 1)) * (stg > 0 ? 0 : 1) + eng * (night ? 2.6 : dawn ? 1.1 : 0.3);
      const skyK = Math.exp(-camAlt / 12000);
      hemi.position.copy(tmp.copy(SKY.uUpE.value).transformDirection(earth.matrix));
      hemi.color.copy(zenDim).lerp(skyLight, skyK * (night ? 0.3 : 1));
      hemi.groundColor.copy(bounce).lerp(earthshine, smoothstep(1500, 30000, camAlt)).multiplyScalar((night ? 0.15 : dawn ? 0.55 + 0.45 * smoothstep(1200, 9000, camAlt) : 1) * (1 + 0.6 * hi));
      hero.setRimGlint(hi * (night ? 0.25 : 1));
      // earthlight and the true sun on the vehicle's own paint (view space): the glint slides along the hull as the stack leans and the gaze swings
      dnH.copy(SKY.uUpE.value).negate().transformDirection(earth.matrix).transformDirection(camera.matrixWorldInverse);
      if (sunK > 0.5) sunH.set(uSunV.value.x, uSunV.value.y, uSunV.value.z); else sunH.copy(sunE);
      sunH.transformDirection(earth.matrix).transformDirection(camera.matrixWorldInverse);
      hero.setSpaceLight(dnH, hi * (night ? 0.5 : 0.85), sunH, (night ? 0.25 : dawn ? 0.6 : 0.8) * smoothstep(9000, 26000, camAlt) * (t > 26.5 ? Math.max(sunK, 0.35) : 1));
      // the station: it comes up out of the distance on the Earth side, crosses under the line of flight and falls behind
      if (t > 24.4 && u < 1) {
        const s = t - 34.8;
        const sh = Math.max(0, s + 1.2), sp = Math.max(0, s);
        pS.copy(A.pod).addScaledVector(camF, 92 + 9 * s * s - 19 * sp * sp).addScaledVector(X, -44 + 30 * (s - 0.5 * sh * sh)).addScaledVector(camU, -6 - 10 * s + 3 * sh * sh);
        mSt.makeBasis(X, camU, tmp.copy(camF).negate()).multiply(mR.makeRotationFromEuler(eul.set(1.0, 0.35 + 0.05 * s, 0.3))).setPosition(pS);
        orbit.station.matrix.copy(mSt);
        mR.multiplyMatrices(mT, mSt).invert();
        orbit.SU.uSunL.value.set(uSunV.value.x, uSunV.value.y, uSunV.value.z).transformDirection(mR);
        orbit.SU.uEarthL.value.copy(upE).negate().transformDirection(mR);
        orbit.SU.uCamL.value.copy(A.pod).applyMatrix4(mR.copy(mSt).invert());
      } else orbit.station.matrix.copy(HIDE);
      orbit.station.matrixWorldNeedsUpdate = true;
      orbit.IU.uAmt.value = smoothstep(26.3, 29.5, t);
      // the spent booster, seen once more after the pan: small, tumbling, falling away over the curve of the Earth
      if (t > 27.2 && t < 34.5 && u < 1) {
        const s = t - 28, b = hero.parts.booster;
        b.visible = true;
        b.position.copy(A.pod).addScaledVector(camF, 270 + 50 * s + 25 * Math.max(s, 0) ** 2).addScaledVector(X, -55 - 8 * s).addScaledVector(camU, -3 - 10 * s);
        b.rotation.set(t * 0.8, t * 0.23, t * 0.5);
      }
      AIR.uHzHi.value = lerp(1, 0.3, smoothstep(4000, 26000, camAlt));
      SKY.uStarK.value = L.starK * lerp(1, 0.12, smoothstep(30000, 60000, camAlt));     // the stars come out as the sky drains, not all at once at staging
      SKY.uHorK.value = lerp(0.12, 0.05, hi); AIR.uHor.value.copy(L.hor).lerp(limbBlue, (night ? 0 : dawn ? 0.35 : 0.75) * smoothstep(9000, 32000, camAlt)).multiplyScalar(1 - 0.18 * hi);
      uShrink.value = 1 - smoothstep(1300, 2600, camAlt);
      // the ground set and its life
      const low = camAlt < 9000;
      padMesh.visible = towerG.visible = dish.visible = crowns.visible = palms.visible = birds.visible = boats.visible = steam.mesh.visible = steamRing.mesh.visible = low;
      vents.mesh.visible = low && t < 9; vents.U.uOp.value = 0.5 * (1 - smoothstep(2.2, 6, t));
      if (wall) wall.mesh.visible = camAlt < 60000;
      uSunView.value.copy(sunE).transformDirection(earth.matrix).transformDirection(camera.matrixWorldInverse);
      fireP.U.uOp.value = 0.9 * Math.min(1, thr * 2.2) * (1 - smoothstep(40, 380, altAt(t))); fireP.mesh.visible = low && fireP.U.uOp.value > 0.01;
      const pk = 1 + 0.9 * hero.state.pressure; hero.parts.plume.scale.set(pk, 1, pk);
      if (low) {
        placeBoats(time);
        arms.rotation.y = 1.25 * smoothstep(0.4, 1.9, t);
        tmp.copy(O).sub(dish.position).normalize(); dish.quaternion.setFromUnitVectors(Z, tmp);
        steam.U.uClock.value = t; steamRing.U.uClock.value = t; vents.U.uClock.value = time; BIRD.uClock.value = t; fireP.U.uClock.value = time;
      }
      uBlast.value = thr * (1 - smoothstep(300, 2600, camAlt));
      uThr.value = thr * (night ? 1 : dawn ? 0.8 : 0.7);
      uHeadG.value.set(0, -downAt(t));
      COL.uT.value = t; hullPos(Math.min(t, 22.1), COL.uHead.value); EARTH.uColT.value = altAt(Math.min(t, 22));
      column.visible = t > 5.3;
      // once a deck is below us it slides the way a world seen from a rocket does (switched inside its own white-out)
      for (const s of shells) { const f = s.t < 0 ? 1 : smoothstep(s.t + 0.05, s.t + 0.5, t); s.U.uFade.value = f; s.mesh.visible = f > 0.002; s.U.uDk.value.w = s.d4 * (s.t > 0 && t > s.t + 0.03 ? deckBoost(s.h) : 1); }
      uDeck0.value.w = shadowDeck[4] * (shadowDeck.t > 0 && t > shadowDeck.t + 0.03 ? deckBoost(shadowDeck[0]) : 1);
      // wisps, white-out, flash
      runAcc = (runAcc + Math.min(dt, 0.1) * 260 * smoothstep(3, 13, t)) % 100000;
      WISP.uRun.value = (time * 40 + runAcc) % 100000;
      const hiW = smoothstep(14000, 20000, camAlt);
      let wa = Math.min(1, near + 0.8 * maxQ + 0.14 * smoothstep(800, 1500, camAlt) * (1 - smoothstep(11000, 16000, camAlt)));
      wa = t > 22.3 ? 0 : Math.max(wa, 0.35 * thr * smoothstep(3, 7, t));       // near matter streaks past the whole way up: cloud, then ice
      WISP.uAmt.value = wa; wisps.visible = wa > 0.01; WISP.uThin.value = lerp(1, 0.12, hiW); WISP.uBright.value = lerp(1, 1.5, hiW);
      // the frost goes on coming off in episodes all the way up (4.5 s of shedding in every 7.9 s): whipped aft by the slipstream
      // in the air, drifting off slowly in vacuum. Ignition (t < 8) is exactly as it was.
      SHEET.uClock.value = t < 8 ? t : (t - 8) % 7.9; SHEET.uShare.value = t < 8 ? 1 : 0.7;
      SHEET.uDim.value = night ? 1 - 0.6 * smoothstep(8, 9, t) * (1 - uSunV.value.w) : 1;     // on the night side the flakes are lit by the fire, then by earthshine only, until the sun comes over the limb
      SHEET.uG.value = t < 8 ? 7 : lerp(7 + 11 * smoothstep(8, 13, t), 0.12, smoothstep(22.1, 23.3, t));
      if (t > 13.5 && t < 22.2) hero.setShed(lerp(0.55, 0.95, smoothstep(13.5, 17, t)));
      CRY.uAmt.value = smoothstep(22.7, 24.2, t); CRY.uCamL.value.copy(A.pod); crystals.visible = CRY.uAmt.value > 0.004;
      OVER.uFlash.value = hero.flash * 0.05; hero.uniforms.uFlash.value = hero.flash * 0.08;     // one eased flash; the hull and the booster stay readable through it
      veil.visible = OVER.uFlash.value > 0.003;
      PASS.uA.value = u > 0 && pd ? W : 0; pass.visible = PASS.uA.value > 0.003;
      if (pass.visible) {
        const pe = camera.projectionMatrix.elements, D = 75 * sN;
        PASS.uZ.value = clamp((pe[10] * -D + pe[14]) / D, -1, 0.99999);
        PASS.uPhase.value = px * 2.3 + time * 0.06; PASS.uKind.value.fromArray(pd.kind); PASS.uSeed.value = pd.sd;
        const sl = Math.hypot(uSunView.value.x, uSunView.value.y);
        PASS.uSunS.value.set(uSunView.value.x, uSunView.value.y).multiplyScalar(sl > 1e-4 ? 1 / sl : 0);
      }
      if (veil.visible || pass.visible) {
        e4.set(0, -40, 0, 1).applyMatrix4(hull.matrix).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
        const w = Math.max(Math.abs(e4.w), 1e-3); OVER.uGp.value.set(clamp(e4.x / w, -2, 2), clamp(e4.y / w, -2, 2)); OVER.uAspect.value = camera.aspect || 1.78;
      }
      // the engine's exit portal sits dead ahead on the straight path: keep it out of the aft view until the pan.
      // Only an object the engine added after build, at the path's end, is taken for it; if none is found nothing is hidden.
      if (!exitPortal && u > 0) for (const c of scene.children) if (!own.has(c) && !c.isLight && !c.matrixAutoUpdate && Math.abs(c.matrix.elements[14] + 600) < 1 && Math.abs(c.matrix.elements[12]) < 1 && Math.abs(c.matrix.elements[13]) < 1) { exitPortal = c; break; }
      if (exitPortal) exitPortal.visible = t > 26.3 || u >= 1;
      hero.update(dt, time, camera);
    }

    return {
      scene, path, duration: 40, ride: 'none', companion: 'none',
      camera: { fov: 75, near: 0.25, far: 60000, lookAhead: 30, sway: 0, bank: 0 },
      pois: [],
      portal: { shape: 'circle', radius: 9, color: '#BFE9FF', glow: 1, revealDistance: 200 },
      post: { exposure: night ? 1.05 : 1, bloom: { strength: night ? 0.6 : 0.42, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.08, contrast: 1.06, tint: '#ffffff', shadowTint: night ? '#02040a' : '#000308', vignette: 0.22, grain: 0.015, aberration: 0 } },
      update,
      dispose() { hero.dispose?.(); },
    };
  },
};
