// Alpenglow: the last minutes of sun on a great rock horn, from the back of a golden eagle.
// Axes: +X east, +Z south, y = 0 at the glacier under the face. The knife ridge runs through the origin
// (crest ~450 m) toward the horn's west ridge; the summit stands 2 km east at 1500 m.
// Beats (u): 0-0.11 north flank, gendarme + ibex on the axis | 0.11-0.19 over the crest through the ibex line, the horn revealed,
// bulls clash 0.16, vulture 0.157, serac cracks 0.185 | 0.19-0.33 the first stoop, off the crest toward the horn: the tower leans and
// breaks up 0.232-0.292 | 0.33-0.5 level over the
// tarn bench: the summit doubled in the tarn 0.34-0.37, then the whole face and the cloud in its couloirs | 0.5-0.78 over the lip and
// the long stoop beside the cloud: rock towers and an ibex ledge on the left (0.61) | 0.78-0.87 pull-out over crevasses, the ice cave
// and seracs (0.84-0.89), chamois
// | 0.87-1 larches, towers, portal.
// The horn wears a hanging glacier: an ice cliff across its western half at the shadow line, with the serac tower as its prow.
// The crest's south wall and the great face beside the stoops are a mesh of their own (jointed buttresses, gullies, snow ledges).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as T from '../kit/terrain.js';
import * as F from '../kit/fauna.js';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';
import { makeSky, makeCloudField } from '../kit/sky.js';
import { buildHero, HORN, HORN_NOISE_GLSL } from '../parts/alpenglow-horn.js';

const D2R = Math.PI / 180;
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

// the knife ridge: a straight crest through the origin toward azimuth 82; s along it, n across (south positive)
const RD = [Math.sin(82 * D2R), -Math.cos(82 * D2R)], RN = [-RD[1], RD[0]];
const SUMMIT = [1980, -278];
const TARN = { x: 330, z: 46.6, y: 295, r: 38 };
const END = [718.25, -35.5, 468.25];
const MOON = { az: 106, el: 18 };

// four hours of the same evening (hemisphere colours are for three.js lights; my own shaders take them / PI)
const LOOKS = {
  alpenglow: { sun: '#ff8a7c', sunK: 3.4, sunEl: 1.5, sunAz: 255, shadowY: 'serac', edge: 16, glowY: [900, 1500], hemiSky: '#a2c0ef', hemiGround: '#52668f', hemiI: 3.2, bounce: '#ff9a8a', bounceI: 1.7,
    sky: { zenith: '#1c2862', mid: '#a67a9e', horizon: '#3e5e96', ground: '#1b2740', horizonPow: 7, midPow: 3.2, scatterColor: '#ffa070', scatter: 0.5, stars: 0.2, sunColor: '#ff9a70', sunIntensity: 9 },
    cirrus: { lit: '#ff9c86', shade: '#7a6c9c' }, fog: '#3e5e96', fogD: 0.00035, exposure: 1.05, portal: '#bcd4ff', ember: 0, moon: 0, tint: '#fff4f6', shadowTint: '#30426a', sea: ['#9296ce', '#5868a8', '#2f3e76'] },
  amber: { sun: '#ffb468', sunK: 3.5, sunEl: 4, sunAz: 252, shadowY: [500, 640], edge: 16, glowY: [900, 1500], hemiSky: '#b4ccf2', hemiGround: '#46557c', hemiI: 3.3, bounce: '#ffc28a', bounceI: 2.4,
    sky: { zenith: '#34509e', mid: '#e2b096', horizon: '#5b7ab4', ground: '#243352', horizonPow: 8, midPow: 2.0, scatterColor: '#ffc27a', scatter: 0.6, stars: 0, sunColor: '#ffc080', sunIntensity: 10 },
    cirrus: { lit: '#ffd0a0', shade: '#8c8cb4' }, fog: '#5672a8', fogD: 0.00033, exposure: 1.0, portal: '#d6e4ff', ember: 0, moon: 0, tint: '#fff8ee', shadowTint: '#2e4064', sea: ['#a2a6d6', '#6676b2', '#384a82'] },
  // afterglow: the sun is gone and the top fifth of the horn is a dull ember, the warmest and brightest thing under a violet sky
  ember: { sun: '#ff6a3a', sunK: 1.5, sunEl: -3, sunAz: 258, shadowY: [3000, 3000], edge: 16, glowY: [980, 1440], hemiSky: '#9a9cec', hemiGround: '#3a3c74', hemiI: 2.5, bounce: '#b070a8', bounceI: 0.9,
    sky: { zenith: '#181c50', mid: '#6e4a8a', horizon: '#2c3c70', ground: '#141a38', horizonPow: 7, midPow: 2.0, scatterColor: '#ff7050', scatter: 0.5, stars: 0.55, sunIntensity: 0 },
    cirrus: { lit: '#d07484', shade: '#3c3c70' }, fog: '#2c3c70', fogD: 0.00035, exposure: 1.15, portal: '#c8c0ff', ember: 1.25, moon: 0, tint: '#f6f0ff', shadowTint: '#2c3a66', venus: true, sea: ['#7c7ab8', '#4e5496', '#2a2e60'] },
  // the blue hour, the full moon just up in the east-south-east: the very last rose-orange light still sits on the summit and the
  // upper face, everything under it is moonlit blue, and the high cirrus keeps a dusky rose
  // (the moon's own light is cold blue-white on rock and snow: the only warmth in this look is the glow on the summit)
  moon: { sun: '#ff9068', sunK: 2.9, sunEl: -2, sunAz: 258, shadowY: [980, 1110], shadowDrop: 150, edge: 60, glowY: [800, 1260], hemiSky: '#7f9ae0', hemiGround: '#2e3c6a', hemiI: 2.1, bounce: '#c4d2f4', bounceI: 2.5,
    heroBounce: '#d8c2e4', moonCol: '#cfdaf8', moonK: 0.6,
    sky: { zenith: '#070c26', mid: '#34295c', horizon: '#2a4180', ground: '#0a1024', horizonPow: 5, midPow: 2.4, scatterColor: '#c05a70', scatter: 0.5, stars: 0.9, sunIntensity: 0, milkyWay: 0.35 },
    cirrus: { lit: '#d68a9a', shade: '#3a4478' }, fog: '#1c2c5a', fogD: 0.00032, exposure: 1.25, portal: '#ffd9a8', ember: 0.3, moon: 1, tint: '#f2f2ff', shadowTint: '#1c2a52', sea: ['#94a8dc', '#465890', '#202c4e'] },
};

export default {
  id: 'alpenglow-horn',
  name: 'Alpenglow',
  category: 'wilderness',
  weirdness: 0.05,
  media: ['air', 'open', 'snow'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const detail = ctx.quality?.detail ?? 1, dens = vary.density ?? 1;
    // ---------- which evening is it ----------
    const pick = rng.fork('rose'), r0 = pick();
    const lookId = vary.hour === 'day' ? 'amber' : vary.hour === 'dawn' ? 'ember' : vary.hour === 'night' ? 'moon' : vary.hour === 'golden' ? 'alpenglow'
      : r0 < 0.46 ? 'alpenglow' : r0 < 0.64 ? 'amber' : r0 < 0.82 ? 'ember' : 'moon';
    const L = LOOKS[lookId], r1 = pick();
    const weather = r1 < 0.52 ? 'clear' : r1 < 0.78 ? 'foehn' : 'sea';
    const winter = pick() < 0.24, swapCast = pick() < 0.2, ravens = pick() < 0.35, rare = !!vary.rare;
    const scene = new THREE.Scene();
    const disposables = [];

    // ---------- the flight ----------
    // over the crest, a first stoop down its south wall, level across the tarn bench toward the horn, over the bench's lip and the long
    // stoop to the glacier, then down the ice to the notch
    const path = makePath([
      [-197.2, 438, 4], [-140, 438, -8.5], [-92, 441, -11], [-45, 449, -5.5], [-8, 455.5, 0.6], [16.3, 458, 3.3], [40, 459.3, 2.7], [74, 455, 14],
      [104, 434, 32], [140, 390, 55], [165, 350, 72], [190, 334, 80], [240, 330, 78], [300, 327, 68], [360, 326, 64], [402, 324, 72], [428, 316, 96],
      [450, 262, 138], [473, 180, 182], [494, 100, 220], [512, 42, 250], [531, 10, 275], [556, -1, 302], [590, -8, 338], [636, -18, 385], [682, -29, 432], END,
    ]);
    // where the eye rests, as azimuth / elevation keyed to u: one poi built from it steers the gaze the whole way (the horn over the
    // crest and in the first stoop, down into the tarn, up the face, then the cloud and the glacier)
    const GAZE = [[0.045, 85, 3], [0.075, 85, 13], [0.102, 86, 18], [0.128, 66, 15], [0.157, 55, 14], [0.183, 72, 12], [0.215, 80, 10], [0.25, 81, 8], [0.29, 86, 0], [0.335, 92, -11], [0.365, 92, -15],
      [0.395, 90, 8], [0.47, 97, 5], [0.505, 106, -4], [0.535, 120, -13], [0.6, 130, -24], [0.685, 116, -6], [0.75, 122, -5], [0.8, 130, -3], [0.88, 135, -4]];
    const GW = 0.85, gazeP = new THREE.Vector3(), gazeC = new THREE.Vector3(), gazeA = new THREE.Vector3();
    const gazeAt = (time, u) => { let k = 0; while (k < GAZE.length - 2 && u > GAZE[k + 1][0]) k++;
      const a = GAZE[k], b = GAZE[k + 1], t = sstep(a[0], b[0], u), az = mix(a[1], b[1], t) * D2R, el = mix(a[2], b[2], t) * D2R;
      // the engine blends this poi with the look-ahead along the path; aim past the wanted direction by just enough to land on it
      const d = u * path.length; path.posAtDist(d, gazeC); path.posAtDist(Math.min(path.length, d + 36), gazeA); gazeA.sub(gazeC).normalize();
      gazeP.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
      const c = gazeP.dot(gazeA), lam = (1 - GW) * c + Math.sqrt(Math.max(0, (1 - GW) * (1 - GW) * (c * c - 1) + GW * GW));
      return gazeP.multiplyScalar(lam).addScaledVector(gazeA, -(1 - GW)).normalize().multiplyScalar(600).add(gazeC); };

    // a rock spur that falls beside the long stoop, 16 m off our left wing and well under it; the aiguilles that stand on it are what streak past
    const RIBU = [0.555, 0.755], RIB = []; { const P = new THREE.Vector3(), Tn = new THREE.Vector3();
      for (let i = 0; i <= 16; i++) { const u = mix(RIBU[0], RIBU[1], i / 16); path.pointAt(u, P); path.tangentAt(u, Tn); const hl = Math.hypot(Tn.x, Tn.z) || 1; RIB.push([P.x + (Tn.z / hl) * 16, P.z - (Tn.x / hl) * 16, P.y - 18, u]); } }
    const ribOut = { d: 0, y: 0, f: 0 };
    const ribAt = (x, z) => { let best = 1e9, by = 0, bf = 0;
      if (x < RIB[0][0] - 60 || x > RIB[16][0] + 60 || z < RIB[0][1] - 60 || z > RIB[16][1] + 60) { ribOut.d = 1e9; return ribOut; }
      for (let i = 0; i < 16; i++) { const a = RIB[i], b = RIB[i + 1], ex = b[0] - a[0], ez = b[1] - a[1], t = sat(((x - a[0]) * ex + (z - a[1]) * ez) / (ex * ex + ez * ez)), dx = x - a[0] - ex * t, dz = z - a[1] - ez * t, d = dx * dx + dz * dz;
        if (d < best) { best = d; by = mix(a[2], b[2], t); bf = (i + t) / 16; } }
      ribOut.d = Math.sqrt(best); ribOut.y = by; ribOut.f = bf; return ribOut; };
    await ctx.yield();

    // ---------- sky, light, air ----------
    const sunDir = new THREE.Vector3(Math.sin(L.sunAz * D2R) * Math.cos(L.sunEl * D2R), Math.sin(Math.max(L.sunEl, 1.5) * D2R), -Math.cos(L.sunAz * D2R) * Math.cos(L.sunEl * D2R)).normalize();
    const moonDir = new THREE.Vector3(Math.sin(MOON.az * D2R) * Math.cos(MOON.el * D2R), Math.sin(MOON.el * D2R), -Math.cos(MOON.az * D2R) * Math.cos(MOON.el * D2R));
    const sky = makeSky({ rng, preset: lookId === 'moon' ? 'night' : 'sunset', ...L.sky, sunElevation: L.sunEl, sunAzimuth: L.sunAz,
      bodies: L.venus ? [{ elevation: 13, azimuth: 122, size: 0.22, color: '#fff6e0', intensity: 9, glow: 1.2, glowSize: 5, phase: 1 }]
        : L.moon ? [{ elevation: MOON.el, azimuth: MOON.az, size: 2.3, color: '#ffe6c2', color2: '#d8b890', texture: 0.55, intensity: 3.2, glow: 0.8, glowColor: '#ffd9b0', glowSize: 4.5, phase: 1, horizonFade: 0.3 }] : [],
      clouds: false, clouds2: false, key: 'sun', lightning: 0, aurora: 0, nebula: 0, bake: !!L.venus || lookId === 'moon', bakeSize: 256, renderer: ctx.renderer });
    scene.add(sky.object);
    await ctx.yield();
    // high cirrus, my own: one soft layer far overhead, combed along the wind, feathered at every edge and still holding the light
    // (drawn on the far plane around whichever camera renders it, behind everything)
    const cirrus = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      uniforms: { uTime: { value: 0 }, uLit: { value: new THREE.Color(L.cirrus.lit) }, uShade: { value: new THREE.Color(L.cirrus.shade) }, uCov: { value: weather === 'foehn' ? 0.56 : 0.46 }, uGain: { value: L.moon ? 0.62 : lookId === 'ember' ? 0.75 : 1 } },
      vertexShader: /* glsl */`varying vec3 vD;
        void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + position * 100., 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`uniform vec3 uLit, uShade; uniform float uTime, uCov, uGain; varying vec3 vD;
        ${HORN_NOISE_GLSL}
        void main(){ vec3 d = normalize(vD + vec3(0., 1e-4, 0.)); if (d.y < .012) discard;
          vec2 p = d.xz / (d.y + .17);                                                   // a flat sheet, drawn in toward the horizon
          vec2 q = vec2(dot(p, vec2(.72, -.69)), dot(p, vec2(.69, .72)));                // along the wind, across it
          q.x -= uTime * .0035;
          float big = fb(vec3(q * vec2(.3, .72) + 3.1, 1.));                             // where the streaks gather
          vec2 qq = q + (fb(vec3(q * .7, 4.)) - .5) * vec2(1.1, .6);                     // warped, so nothing runs ruler-straight
          float fib = fb(vec3(qq * vec2(.8, 3.4), 7.)) * .62 + fb(vec3(qq * vec2(2.1, 10.), 2.)) * .38;   // combed fibres
          float dens = smoothstep(1. - uCov, 1.5 - uCov, big * .66 + fib * .5) * smoothstep(.012, .2, d.y);
          float thick = smoothstep(.3, 1., dens);
          vec3 col = mix(uLit, uShade, thick * .5) * (.82 + .36 * fib) * uGain;
          gl_FragColor = vec4(col, dens * .8); }` }));
    cirrus.frustumCulled = false; cirrus.renderOrder = -0.5; scene.add(cirrus);
    await ctx.yield();
    const fogColor = new THREE.Color(L.fog);
    scene.fog = new THREE.FogExp2(fogColor, L.fogD);
    const hemi = new THREE.HemisphereLight(new THREE.Color(L.hemiSky), new THREE.Color(L.hemiGround), L.hemiI);
    scene.add(hemi);
    // the second light: the lit wall itself (a rose lamp high in the east); by moonlight it is the moon
    const EG = L.moon ? 1.9 : lookId === 'ember' ? 1.5 : 1.25;      // the bird's own light: in the dim looks it must still read
    const lampDir = L.moon ? moonDir.clone() : new THREE.Vector3(SUMMIT[0] - 500, 1150, SUMMIT[1] - 150).normalize();
    const lamp = new THREE.DirectionalLight(new THREE.Color(L.bounce), L.bounceI);
    lamp.position.copy(lampDir).multiplyScalar(800); scene.add(lamp); scene.add(lamp.target);
    // the same light for my own shaders
    const PI = Math.PI, cHS = new THREE.Color(L.hemiSky), cHG = new THREE.Color(L.hemiGround), cB = new THREE.Color(L.bounce), cS = new THREE.Color(L.sun);
    const LU = {
      uSky: { value: new THREE.Vector3(cHS.r, cHS.g, cHS.b).multiplyScalar(L.hemiI / PI) }, uGround: { value: new THREE.Vector3(cHG.r, cHG.g, cHG.b).multiplyScalar(L.hemiI / PI) },
      uLampDir: { value: lampDir.clone() }, uLamp: { value: new THREE.Vector3(cB.r, cB.g, cB.b).multiplyScalar(L.bounceI / PI) }, uTime: { value: 0 },
    };
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    await ctx.yield();

    // ---------- the land: knife ridge, tarn bench, glacier, rock bar ----------
    const mtn = T.mountains({ noise, height: 320, scale: 640, ridge: 0.6, base: 0 });
    const glacierY = (x, z) => 12 + 0.037 * (x - 392) - 0.2672 * (z - 170);
    const AX = [Math.SQRT1_2, Math.SQRT1_2];   // the final heading (135): a along it from the portal, b across
    const info = { glacier: 0, bar: 0, bench: 0, va: 0, tongue: 0, bm: 0, wd: 0 };
    const SPURS = [[520, 1, 120], [860, -1, 150], [1210, 1, 175]];   // [metres down the valley, side, height]
    const stair = (d, S) => { const t = d / S, i = Math.floor(t), f = t - i; return (i + mix(f, sstep(0.1, 0.9, f), 0.75)) * S; };
    const baseHeight = (x, z, out, raw) => {
      const s = x * RD[0] + z * RD[1], n = x * RN[0] + z * RN[1];
      const crest = 450 + 9 * noise.n2(s * 0.011, 3.3) + 4 * noise.n2(s * 0.05, 9.1) + 240 * sstep(520, 1300, s) - 80 * sstep(-250, -900, s);
      const rn = (noise.ridged2(x * 0.0085 + 4, z * 0.0085 - 2, 3) - 0.45) * 30 + noise.n2(x * 0.03, z * 0.03) * 5;
      let h, bench = 0;
      if (n < 0) {
        const a = -n; h = crest - Math.min(a * 1.6, 14 + (a - 9) * 0.25) - Math.max(0, a - 64) * 1.2 + rn * sstep(60, 110, a) + 1.5 * noise.n2(x * 0.06, z * 0.06);
        h = T.smax(h, -150 + (a > 150 ? mtn(x, z) * 0.55 * sstep(150, 600, a) : 0), 50);
        // (the north flank never meets the glacier or the valley: done)
        if (out) { out.glacier = 0; out.bar = 0; out.bench = 0; out.va = 0; out.tongue = 0; out.bm = 0; out.wd = 0; }
        return raw ? h : mix(-270, h, sstep(0, 150, Math.min(x + 760, 1700 - x, z + 760, 1560 - z)));
      } else {
        const mb = sstep(-110, -30, s) * (1 - sstep(400, 480, s)), rw = rn * sstep(4, 30, n);
        const direct = crest - n * 2.0 + rw;
        h = direct;
        if (mb > 0) {
        const benchL = 297 + 1.6 * noise.n2(x * 0.05, z * 0.05) + 1.2 * noise.n2(x * 0.13, z * 0.13);
        const td = Math.hypot(x - TARN.x, z - TARN.z), bowl = -6 * (1 - sstep(TARN.r * 0.45, TARN.r * 1.12, td));
        // both walls are broken cliffs: risers and snow ledges (st), buttresses and gullies down the fall line (but)
        const dn = n + 5 * noise.n2(x * 0.021 + 3, z * 0.021), lip = 134 + 5 * noise.n2(s * 0.02, 7.7);
        const but = Math.pow(1 - Math.abs(Math.sin(s * 0.058 + 1.6 * noise.n2(s * 0.006 + 2, n * 0.004))), 1.6) - 0.35;
        const wall1 = crest - Math.max(0, dn - 1.2) * 2.6 + rw * 0.4;                                   // (a plain slope: its buttresses, gullies and ledges are the wall mesh that lies on it)
        const dl = Math.max(0, dn - lip), wall2 = 297 - (dl < 13 ? dl * 5 : 65 + stair((dl - 13) * 2.2, 24)) + (but * 13 + rw * 0.5) * sstep(lip + 6, lip + 30, n);   // a 65 m cliff under the lip, then a broken face
        const bp = T.smax(wall1, T.smin(benchL + bowl, wall2, 6), 8);
        h = mix(direct, bp, mb); bench = mb * sstep(54, 62, n) * (1 - sstep(lip - 12, lip - 2, n)); }
        const rb = ribAt(x, z);
        if (rb.d < 60) { const endK = sstep(0, 0.14, rb.f) * (1 - sstep(0.84, 1, rb.f)), teeth = 3.2 * noise.n2(x * 0.09, z * 0.09) + 2 * noise.n2(x * 0.23, z * 0.23);
          h = T.smax(h, rb.y - (1 - endK) * 70 - rb.d * 2.5 + teeth * sstep(22, 4, rb.d), 4); }
      }
      // the glacier fills the cirque; a rock bar with a medial moraine crosses it at the portal
      let g = glacierY(x, z) + 2.2 * noise.n2(x * 0.012, z * 0.012) + 1.1 * Math.sin((x * 0.5 + z * 0.86) * 0.11 + noise.n2(x * 0.01, z * 0.01) * 3);
      const a = (x - END[0]) * AX[0] + (z - END[2]) * AX[1], b = -(x - END[0]) * AX[1] + (z - END[2]) * AX[0];
      const barK = Math.abs(a + 6) > 170 ? 0 : Math.exp(-((a + 6) * (a + 6)) / (44 * 44)) * (0.65 + 0.35 * noise.n2(x * 0.02 + 7, z * 0.02));
      const mor = a < -260 || a > 30 || Math.abs(b - 30) > 70 ? 0 : Math.exp(-((b - 30) * (b - 30)) / (17 * 17)) * sstep(-260, -150, a) * (1 - sstep(-30, 30, a)) * (0.7 + 0.3 * noise.n2(x * 0.04, z * 0.04 + 5));
      const bar = Math.max(barK, mor * 0.55);
      if (bar > 0) g += (barK * 15 + mor * 7 + bar * 2.5 * noise.n2(x * 0.09, z * 0.09)) * (1 - 0.45 * Math.exp(-(b * b) / 225));
      // below the bar an icefall, then the glacier's tongue runs out down a valley whose floor levels at -150 m; the valley
      // meanders, so its spurs overlap; a south wall closes the cirque (va: 0 on the glacier, 1 in the valley; bm: metres off its axis)
      const va = sstep(40, 420, a), bm = b - 130 * Math.sin(a * 0.0046 + 0.5) * sstep(180, 620, a);
      const tongue = Math.exp(-(bm * bm) / (100 * 100)) * va * (1 - sstep(560, 860, a));
      g = mix(g, -150 - 0.03 * Math.max(0, a - 420), va) + 15 * tongue;
      const side = bm > 0 ? 1 : sstep(300, 640, a), wd = Math.max(0, Math.abs(bm) - (bm > 0 ? mix(340, 125, va) : 125));
      let wall = 0;
      if (side > 0 && wd > 0) {   // a glacial trough: a cliff band off the ice, a snow shoulder, then a face of buttresses and gullies down the fall line
        const ribs = Math.pow(1 - Math.abs(Math.sin(a * 0.033 + 2.4 * noise.n2(a * 0.004 + 5, bm * 0.003) + wd * 0.005)), 1.5) - 0.4;
        wall = (150 * sstep(0, 130, wd) + 0.3 * Math.max(0, wd - 100) + 90 * sstep(230, 420, wd) + ribs * 36 * sstep(15, 110, wd) + mtn(x * 0.9 + 800, z * 0.9 - 300) * 0.6 * sstep(60, 520, wd) + rn * 0.8 * sstep(20, 160, wd)) * side; }
      if (a > 150) for (const sp of SPURS) { const da = (a - sp[0]) / 125; if (da > -3 && da < 3) wall += sp[2] * Math.exp(-da * da) * sstep(-70, 260, sp[1] * bm); }
      g += wall; if (a > 1050) g += 330 * sstep(1050, 1460, a) * (0.7 + 0.3 * noise.n2(x * 0.004, z * 0.004));   // the valley turns away behind a last high spur
      const far = sstep(500, 1200, Math.hypot(x - 450, z - 250)) * (1 - side);
      if (far > 0) g += far * mtn(x * 0.9 + 800, z * 0.9 - 300) * 0.5 * sstep(-0.2, 0.6, noise.n2(x * 0.0012, z * 0.0012) + 0.2);
      // the land ends out of sight: it falls away behind its own last crests, well inside the edge of the mesh
      const edge = raw ? 1 : sstep(0, 150, Math.min(x + 760, 1700 - x, z + 760, 1560 - z)), hh = mix(-270, n < 0 ? h : T.smax(h, g, 22), edge);
      if (out) { const on = n < 0 ? 0 : sstep(-6, 10, g - h); out.glacier = on * (1 - sstep(0.15, 0.55, bar)) * (1 - sstep(120, 260, a)); out.bar = on * bar; out.bench = bench; out.va = on * va; out.tongue = on * tongue; out.bm = bm; out.wd = wd * side; }
      return hh;
    };
    const ySnow = winter ? -200 : -10, HR = [-250, 700];
    const cRub = new THREE.Color('#85828e'), cRust = new THREE.Color('#7a3a26'), cStraw = new THREE.Color('#9a8658'), cIce = new THREE.Color('#aebfdc'), cBlue = new THREE.Color('#7fa3cc'), cSnowG = new THREE.Color('#c3d0e6'), cFor = new THREE.Color('#263a3a'), cGold = new THREE.Color('#a8791e'), cMor = new THREE.Color('#4a4854');
    const snowAt = (x, z, h, ny) => sstep(0.6, 0.78, ny + 0.2 * noise.n2(x * 0.021 + 11, z * 0.021 - 5)) * sstep(ySnow - 50, ySnow + 50, h + 45 * noise.n2(x * 0.006 - 3, z * 0.006 + 8) + 18 * noise.n2(x * 0.05, z * 0.05));
    // the same masks as baseHeight gives, for colouring alone: found from the finished height, without rebuilding the rock under it
    const colourInfo = (x, z, hh, out) => {
      const n = x * RN[0] + z * RN[1]; out.glacier = out.bar = out.va = out.tongue = out.bm = out.wd = 0; if (n < 0) return;
      const a = (x - END[0]) * AX[0] + (z - END[2]) * AX[1], b = -(x - END[0]) * AX[1] + (z - END[2]) * AX[0];
      const barK = Math.abs(a + 6) > 170 ? 0 : Math.exp(-((a + 6) * (a + 6)) / (44 * 44)) * (0.65 + 0.35 * noise.n2(x * 0.02 + 7, z * 0.02));
      const mor = a < -260 || a > 30 || Math.abs(b - 30) > 70 ? 0 : Math.exp(-((b - 30) * (b - 30)) / (17 * 17)) * sstep(-260, -150, a) * (1 - sstep(-30, 30, a)) * (0.7 + 0.3 * noise.n2(x * 0.04, z * 0.04 + 5));
      const bar = Math.max(barK, mor * 0.55), va = sstep(40, 420, a), bm = b - 130 * Math.sin(a * 0.0046 + 0.5) * sstep(180, 620, a), tongue = Math.exp(-(bm * bm) / (100 * 100)) * va * (1 - sstep(560, 860, a));
      const side = bm > 0 ? 1 : sstep(300, 640, a), wd = Math.max(0, Math.abs(bm) - (bm > 0 ? mix(340, 125, va) : 125)); let on = 1;
      if (a < 300 && !(side > 0 && wd > 0)) { let g = glacierY(x, z) + 2.2 * noise.n2(x * 0.012, z * 0.012) + 1.1 * Math.sin((x * 0.5 + z * 0.86) * 0.11 + noise.n2(x * 0.01, z * 0.01) * 3);
        if (bar > 0) g += (barK * 15 + mor * 7 + bar * 2.5 * noise.n2(x * 0.09, z * 0.09)) * (1 - 0.45 * Math.exp(-(b * b) / 225));
        g = mix(g, -150 - 0.03 * Math.max(0, a - 420), va) + 15 * tongue; on = 1 - sstep(1.6, 8.9, hh - g); }
      out.glacier = on * (1 - sstep(0.15, 0.55, bar)) * (1 - sstep(120, 260, a)); out.bar = on * bar; out.va = on * va; out.tongue = on * tongue; out.bm = bm; out.wd = wd * side; };
    const groundColor = (x, z, h, ny, out) => {
      colourInfo(x, z, h, info);
      const n1 = noise.n2(x * 0.021 + 11, z * 0.021 - 5), n2 = noise.n2(x * 0.11, z * 0.11), n3 = noise.n2(x * 0.006 - 3, z * 0.006 + 8);
      out.copy(cRub).multiplyScalar(0.9 + 0.14 * n2);
      const veg = sstep(0.25, 0.6, n1 * 0.7 + 0.5 * n2) * (winter ? 0.2 : 1) * sstep(0.6, 0.85, ny);
      out.lerp(cRust, veg * 0.6); out.lerp(cStraw, sstep(0.3, 0.7, n2 - n1 * 0.6) * 0.45 * sstep(0.6, 0.85, ny));
      _c.copy(cSnowG).multiplyScalar(0.94 + 0.06 * n2); out.lerp(_c, snowAt(x, z, h, ny));
      if (info.glacier > 0) {
        const bands = 0.5 + 0.5 * Math.sin((x * 0.5 + z * 0.86) * 0.11 + n3 * 5);
        _c.copy(cIce).lerp(cSnowG, sstep(0.2, 0.8, n3 * 0.5 + 0.5)).lerp(cBlue, sstep(0.72, 0.98, bands) * 0.5).multiplyScalar(0.92 + 0.08 * n2);
        out.lerp(_c, info.glacier);
      }
      if (info.va > 0.02) {   // the valley under the bar: dark forest with the last gold in it on the lower slopes, grey outwash, the tongue with its moraine stripes
        const low = sstep(-20, -80, h) * info.va, forest = low * sstep(0.5, 0.8, ny) * sstep(10, 60, info.wd) * (winter ? 0.35 : 1);
        _c.copy(cFor).lerp(cGold, sstep(0.15, 0.6, n2 * 0.6 + n1 * 0.5) * (winter ? 0.1 : 0.42)).multiplyScalar(0.85 + 0.3 * n2); out.lerp(_c, forest * 0.85);
        const mo = sstep(0.8, 0.97, Math.abs(Math.sin(info.bm * 0.04 + 0.7 + 0.3 * n1)));
        _c.copy(cIce).lerp(cSnowG, sstep(0.2, 0.8, n3 * 0.5 + 0.5)).multiplyScalar(0.9 + 0.1 * n2).lerp(cMor, mo * 0.8); out.lerp(_c, sstep(0.25, 0.6, info.tongue));
      }
      return out;
    };
    const _c = new THREE.Color();
    await ctx.yield();
    const terrain = await T.makeTerrainAsync({
      rng, noise, path, height: (x, z) => baseHeight(x, z), bounds: [-760, -760, 1700, 1560], biome: 'alpine', color: groundColor, heightRange: HR,
      palette: { rock: '#9c9aaa', rockB: '#7c7a8c', rockSlope: [0.58, 0.78], strata: 0.5, strataScale: 11, snow: null,
        patch: '#dfe6f4', patchAmount: 0.22, tufts: 0, pebbles: 0.5, cracks: 0.05, ripples: 0.9, rippleLength: 2.2, lee: 0.3, drift: 0.9, wind: [0.75, -0.66], clouds: 0, sparkle: 0.6 },
      corridor: { clearance: 7, width: 9, slope: 3.0, maxSlope: 3.0, rough: 0.08, smooth: 5 }, ao: 0.3, cell: 3, near: 34, maxTriangles: 74000, skirt: 60, focus: [[END[0] + AX[0] * 330, END[2] + AX[1] * 330, 3], [END[0] + AX[0] * 640, END[2] + AX[1] * 640, 4.5]],
    }, ctx.yield);
    scene.add(terrain.object);
    await ctx.yield();
    const groundAt = (x, z) => terrain.surfaceAt(x, z);

    // ---------- the hero: horn, banner, serac and avalanche ----------
    const TIMING = { crack: 0.185, fall: 0.232, hit: 0.292, foot: 0.52 };
    const hero = await buildHero(ctx, {
      look: { sunDir, sunCol: [cS.r * L.sunK, cS.g * L.sunK, cS.b * L.sunK], sky: LU.uSky.value, ground: LU.uGround.value, bounce: lin(L.heroBounce || L.bounce, 0.5), shadowY: L.shadowY, moon: 0, ember: L.ember,
        edge: L.edge, glowY: L.glowY, shadowDrop: L.shadowDrop ?? (L.shadowY === 'serac' ? 'low' : 0), moonDir: [moonDir.x, moonDir.y, moonDir.z], moonCol: L.moon ? lin(L.moonCol, L.moonK) : [0, 0, 0] },
      timing: TIMING,
      floorAt: (lx, lz) => baseHeight(lx + SUMMIT[0], lz + SUMMIT[1], null, true), rare, foehn: weather === 'foehn', detail,
    });
    hero.object.position.set(SUMMIT[0], 0, SUMMIT[1]); scene.add(hero.object);
    const HU = hero.uniforms;   // uShadowY, uSunDir, uSunCol live here
    await ctx.yield();
    // ---------- the walls: the crest's south wall over the bench and the great face that runs on toward the horn are a mesh of their own,
    // laid on the land: buttresses 37 m apart standing proud of dark gullies, each split into columns along its joints, every column
    // stepping down in its own risers and ledges (the ledges hold the snow), and thin sloughs of snow pouring down a few of the gullies ----------
    const wrng = ctx.core.makeRng(ctx.core.hashSeed('wall:' + ctx.seed)), W0 = wrng() * 97;     // (a stream of its own: nothing else is re-rolled)
    const hsh = (a) => { const v = Math.sin(a * 127.1 + W0) * 43758.5453; return v - Math.floor(v); };
    {
      // three stretches: the wall over the bench, the great face (as far as the horn's own rock), and the spur beside the long stoop
      const wallMask = (s, n, x, z) => Math.max(sstep(56, 80, s) * (1 - sstep(452, 480, s)) * sstep(3, 13, n) * (1 - sstep(60, 70, n)),
        sstep(396, 426, s) * (1 - sstep(1000, 1084, s)) * sstep(3, 15, n) * (1 - sstep(214, 238, n)), n > 190 && s > 400 && s < 640 ? sstep(60, 44, ribAt(x, z).d) : 0);
      const WP = 37, wInfo = { rib: 0, tint: 0, gid: 0, ao: 1 };
      // metres the wall stands above the land at (s, n); also fills wInfo for the shader
      const relief = (s, n, slope) => {
        const sp = s + 13 * noise.n2(s * 0.007 + 31, n * 0.011) + 5 * noise.n2(s * 0.03, n * 0.04 + 9) + 0.12 * n, t = sp / WP, bi = Math.floor(t), f = t - bi;   // fall lines lean and wander
        const h1 = hsh(bi), h2 = hsh(bi + 0.37), h3 = hsh(bi + 0.71), wG = 0.13 + 0.09 * h2, edge = Math.min(f, 1 - f);
        const rib = sstep(wG * 0.3, wG * 1.1, edge), A = 12 + 12 * h1 + 5 * noise.n2(sp * 0.004, n * 0.012);        // how proud this buttress stands
        // the buttress is two or three columns: each stands in or out a little, and steps down in its own risers
        const nc = 2 + (h3 > 0.45 ? 1 : 0), cf = sat((f - wG) / (1 - 2 * wG)) * nc, ci = Math.min(nc - 1, Math.floor(cf)), cq = cf - ci, hc = hsh(bi * 7.13 + ci * 1.7 + 3), hd = hsh(bi * 3.71 + ci * 2.3 + 11);
        const joint = sstep(0, 0.14, Math.min(cq, 1 - cq)) + (ci === 0 && cq < 0.5 ? 1 : 0) + (ci === nc - 1 && cq > 0.5 ? 1 : 0);
        const S = 9 + 7 * hc, nn = n + hd * S + (cq - 0.5) * 3.2 * (hc - 0.5), q = nn / S, qf = q - Math.floor(q);            // ledges dip a little across the column
        const step = (qf - sstep(0.26, 0.74, qf)) * S * slope * 0.9;                                                // a level ledge, then a riser of 20 to 30 m
        const r = 1.1 + rib * (A + (hc - 0.5) * 8 + step) - (1 - Math.min(1, joint)) * 3.2 * rib + 6 * noise.n2(s * 0.012 + 5, n * 0.02) + 1.4 * noise.n2(s * 0.13, n * 0.13);
        wInfo.rib = rib; wInfo.tint = hc; wInfo.gid = hsh(Math.round(t) * 1.31 + 7); wInfo.ao = (0.42 + 0.58 * rib) * (0.7 + 0.3 * Math.min(1, joint)) * (0.82 + 0.18 * sstep(0.1, 0.5, qf));
        return Math.max(0.9, r);
      };
      const sC = [], nR = []; for (let s = 56; s < 1088;) { sC.push(s); s += s < 600 ? 3.5 : Math.min(9, 3.5 + (s - 600) * 0.03); } for (let n = 2; n < 372; n += 2.6) nR.push(n);
      const NS_ = sC.length, NN_ = nR.length, pos = new Float32Array(NS_ * NN_ * 3), aw = new Float32Array(NS_ * NN_ * 4), mk = new Float32Array(NS_ * NN_), idx = [];
      for (let i = 0, k = 0; i < NS_; i++) {
        for (let j = 0; j < NN_; j++, k++) { const s = sC[i], n = nR[j], x = s * RD[0] + n * RN[0], z = s * RD[1] + n * RN[1], m = wallMask(s, n, x, z); let y = -400, mm = 0;
          if (m > 0) { const slope = Math.hypot(baseHeight(x - 3, z) - baseHeight(x + 3, z), baseHeight(x, z - 3) - baseHeight(x, z + 3)) / 6, gy = groundAt(x, z); mm = m * sstep(0.85, 1.5, slope);
            const d3 = path.distanceTo(x, gy, z), r = Math.min(relief(s, n, Math.min(2.8, Math.max(1.6, slope))), Math.max(0.9, (d3 - 10) * 0.6));
            y = gy + mix(-1.6, r, mm); aw[k * 4] = wInfo.rib; aw[k * 4 + 1] = wInfo.tint; aw[k * 4 + 2] = wInfo.gid; aw[k * 4 + 3] = mix(1, wInfo.ao, sstep(0.2, 0.8, mm)); }
          pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; mk[k] = mm; }
        if ((i & 1) === 1) await ctx.yield();
      }
      for (let i = 0; i < NS_ - 1; i++) for (let j = 0; j < NN_ - 1; j++) { const a = i * NN_ + j, b = a + NN_, c = a + 1, d = b + 1;
        if (Math.max(mk[a], mk[b], mk[c], mk[d]) < 0.02 || Math.min(pos[a * 3 + 1], pos[b * 3 + 1], pos[c * 3 + 1], pos[d * 3 + 1]) < -300) continue;
        if (((i + j) & 1) === 0) idx.push(a, c, b, b, c, d); else idx.push(a, c, d, a, d, b); }
      await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aW', new THREE.BufferAttribute(aw, 4)); g.setIndex(idx); g.computeVertexNormals();
      await ctx.yield();
      const wallMat = new THREE.ShaderMaterial({ fog: true, uniforms: { ...fogU(), ...LU, uSunDir: HU.uSunDir, uSunCol: HU.uSunCol, uShadowY: HU.uShadowY, uEdge: HU.uEdge, uWinter: { value: winter ? 1 : 0 } },
        vertexShader: /* glsl */`attribute vec4 aW; varying vec3 vW, vN; varying vec4 vA;
          #include <fog_pars_vertex>
          void main(){ vA = aW; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform vec3 uSky, uGround, uLampDir, uLamp, uSunDir, uSunCol; uniform float uShadowY, uEdge, uTime, uWinter; varying vec3 vW, vN; varying vec4 vA;
          #include <fog_pars_fragment>
          ${HORN_NOISE_GLSL}
          void main(){
            vec3 fc = cross(dFdx(vW), dFdy(vW)); vec3 Nf = fc / max(length(fc), 1e-6); if (Nf.y < 0.) Nf = -Nf;      // the facet: split rock, crisp edges
            vec3 Ns = normalize(vN);
            float dist = length(vW - cameraPosition), near = 1. - smoothstep(50., 240., dist);
            float n1 = fb(vW * .043), n2 = fb(vW * vec3(.17, .05, .17) + 7.), n3 = vn(vW * .8) * near + .5 * (1. - near);   // n2 runs in streaks down the wall
            vec3 N = normalize(mix(Ns, Nf, .72) + (vec3(vn(vW * .29 + 3.), vn(vW * .29 + 11.), vn(vW * .29 + 19.)) - .5) * .45);
            vec3 rock = mix(vec3(.1, .095, .125), vec3(.31, .285, .32), clamp(n1 * .55 + vA.y * .5, 0., 1.)) * (.72 + .56 * n2) * (.84 + .32 * n3);
            rock *= .8 + .2 * smoothstep(.0, .22, abs(fract(vW.y * .085 + n1 * 2.6 + vA.y * 3.) - .5)) * near + .2 * (1. - near);   // beds, close to
            // snow lies on every ledge and gentle facet, lodges in the cracks, and thins toward the gullies' beds
            float up = mix(Ns.y, Nf.y, .55) + (n1 - .5) * .28 + (n2 - .5) * .16 + uWinter * .16;
            float snow = smoothstep(.6, .76, up) * (.35 + .65 * smoothstep(.1, .6, vA.x));
            snow = max(snow, smoothstep(.62, .8, n2 + (Ns.y - .4) * .5) * .5);
            vec3 alb = mix(rock, vec3(.57, .65, .81) * (.9 + .2 * n3), snow);
            float hemi = N.y * .5 + .5, lit = smoothstep(uShadowY - uEdge, uShadowY + uEdge, vW.y + (n1 - .5) * uEdge);
            vec3 light = mix(uGround, uSky, hemi) * vA.w + uLamp * max(dot(N, uLampDir), 0.) * (.3 + .7 * vA.w) + uSunCol * (max(dot(N, uSunDir), 0.) * .85 + .1) * lit;
            vec3 col = alb * light;
            // a slough: a thread of snow pouring down the bed of a gully, in pulses
            float run = step(.7, vA.z) * (1. - smoothstep(.12, .5, vA.x)) * smoothstep(.3, .52, fb(vec3(vW.xz * .045, vW.y * .034 + uTime * .5)) + .12 * sin(vW.y * .21 + uTime * 2.3));
            col = mix(col, vec3(.8, .86, .97) * (uSky * 1.05 + uLamp * .55), run * .85);
            gl_FragColor = vec4(col, 1.);
            #include <fog_fragment>
          }` });
      const wall = new THREE.Mesh(g, wallMat); wall.frustumCulled = false; scene.add(wall);
    }
    await ctx.yield();
    let rangeMat;
    // ---------- far ranges: three smooth, hazy rings of other four-thousanders, fixed in the world; only their highest tips still
    // hold the light, and their feet stand in the haze (they also close every gap under the horizon) ----------
    {
      const nz = ctx.core.makeNoise(rng.fork('ranges').int(1, 1e9)), N = 560, pos = [], av = [], idx = [];
      [[2700, 240, 760, 0.5], [3500, 380, 1060, 0.68], [4350, 480, 1330, 0.84]].forEach(([R, h0, h1, haze], k) => { const base = pos.length / 3;
        for (let i = 0; i <= N; i++) { const th = (i / N) * Math.PI * 2, cx = Math.cos(th), sz = Math.sin(th);
          const rid = nz.ridged2(cx * 2.3 + k * 7.1, sz * 2.3 - k * 3.3, 4), big = 0.5 + 0.5 * nz.n2(cx * 1.1 + 20 + k, sz * 1.1), sis = k === 2 ? Math.max(0, 1 - Math.abs(th - 0.534) / 0.2) : 0, top = Math.max(mix(h0, h1, sat(0.1 + 0.9 * rid * (0.4 + 0.6 * big))), 1180 * sis * (0.94 + 0.06 * rid));
          for (const v of [0, 1]) { pos.push(500 + cx * R, v ? top : -900, 300 + sz * R); av.push(top, haze, (i / N) * R * 0.0105, k); }
          if (i < N) { const q = base + i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); } } });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aV', new THREE.Float32BufferAttribute(av, 4)); g.setIndex(idx);
      const skyH = new THREE.Color(L.sky.horizon), gnd = new THREE.Color(L.sky.ground);
      const m = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { uSky: LU.uSky, uShadowY: HU.uShadowY, uSunCol: HU.uSunCol, uMoon: HU.uMoon, uEmber: HU.uEmber, uTime: LU.uTime, uVeil: { value: 0 }, uVeilC: { value: new THREE.Color(L.moon ? '#5a6890' : '#b79ab8').lerp(fogColor, 0.5) }, uHaze: { value: skyH.clone().lerp(fogColor, 0.35) }, uDeep: { value: gnd.clone().lerp(skyH, 0.45) } },
        vertexShader: /* glsl */`attribute vec4 aV; varying vec3 vW; varying vec4 vA;
          void main(){ vA = aV; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`uniform vec3 uSky, uSunCol, uHaze, uDeep, uVeilC; uniform float uShadowY, uMoon, uEmber, uTime, uVeil; varying vec3 vW; varying vec4 vA;
          ${HORN_NOISE_GLSL}
          void main(){ float s = vA.z, k = vA.w;
            // the skyline is cut finer than the mesh, and inside each ring two nearer, lower ridges stand in front of the main one
            float cr = vA.x - 44. * abs(2. * vn(vec3(s * 5., k * 9., 1.)) - 1.) - 20. * abs(2. * vn(vec3(s * 17., k * 5., 2.)) - 1.) - 8. * vn(vec3(s * 53., 0., 3.));
            if (vW.y > cr) discard;
            float H = vA.x + 150.;
            float h2 = H * (.5 + .2 * vn(vec3(s * 1.7 + 9., k * 3., 5.))) * (1. - .4 * abs(2. * vn(vec3(s * 4.1, k * 7., 7.)) - 1.)) - 150. - 10. * vn(vec3(s * 31., 1., k));
            float h3 = H * (.26 + .14 * vn(vec3(s * 2.3 + 4., k * 5., 8.))) * (1. - .4 * abs(2. * vn(vec3(s * 6.3, k * 2., 6.)) - 1.)) - 150. - 8. * vn(vec3(s * 37., 2., k));
            float f2 = 1. - smoothstep(h2 - 3., h2 + 3., vW.y), f3 = 1. - smoothstep(h3 - 3., h3 + 3., vW.y);
            float topY = mix(mix(cr, h2, f2), h3, f3);                                                   // the crest of the ridge this fragment belongs to
            float r = clamp((vW.y + 150.) / max(topY + 150., 1.), 0., 1.);
            float n = fb(vec3(s * 6. + vW.y * .004, vW.y * .011, k * 9. + f2 * 3. + f3 * 5.));
            float snow = smoothstep(.5, .85, r + (n - .5) * .6) * (1. - .5 * f2);
            vec3 alb = mix(vec3(.12, .13, .19) * (.7 + .6 * n), vec3(.4, .45, .58), snow);
            float sy = max(uShadowY, 900.), lit = smoothstep(sy - 520., sy - 330., vW.y + (n - .5) * 120.);
            vec3 col = alb * (uSky * (.8 + .3 * n) + uSunCol * (.62 * lit * (.5 + n) + uEmber * .3 * smoothstep(900., 1330., vW.y + (n - .5) * 200.)));
            float hz = clamp(vA.y - .1 * f2 - .1 * f3 + (1. - vA.y) * .8 * (1. - r) * (1. - r), 0., 1.);     // distance; every ridge stands in the haze of the valley behind the one in front
            col = mix(col, uHaze, hz * (1. - .6 * lit * snow));                                            // (the lit snow of a far summit burns through the haze)
            float low = 1. - smoothstep(-300., 20., vW.y), bands = fb(vec3(s * 2.2 + uTime * .004, vW.y * .02, k * 3.));   // valley fog in drifting strata under them all
            float b2 = fb(vec3(s * 7. + uTime * .006, vW.y * .05, k * 5.));
            col = mix(col, mix(uDeep * .85, uHaze * 1.12, smoothstep(.25, .75, bands * .65 + b2 * .35)), low * (.6 + .35 * bands));
            col = mix(col, uVeilC, uVeil);
            gl_FragColor = vec4(col, 1.); }` });
      rangeMat = m; const ranges = new THREE.Mesh(g, m); ranges.frustumCulled = false; scene.add(ranges);
    }
    await ctx.yield();
    // ---------- low mist in the valley bottom, in every weather: two drifting sheets whose shores follow the land ----------
    {
      const MX0 = 625, MZ0 = 405, MW = 1160, MD = 1240, HN = 48, data = new Uint8Array(HN * HN);
      for (let j = 0; j < HN; j++) { for (let i = 0; i < HN; i++) data[j * HN + i] = 255 * sat((baseHeight(MX0 + (i + 0.5) / HN * MW, MZ0 + (j + 0.5) / HN * MD) + 170) / 120); if ((j & 7) === 7) await ctx.yield(); }
      const tH = new THREE.DataTexture(data, HN, HN, THREE.RedFormat); tH.magFilter = tH.minFilter = THREE.LinearFilter; tH.needsUpdate = true;
      const pos = [], uv = [], lay = [], idx = [];
      [[-116, 0], [-103, 1]].forEach(([y, k]) => { const q = pos.length / 3; pos.push(MX0, y, MZ0, MX0 + MW, y, MZ0, MX0, y, MZ0 + MD, MX0 + MW, y, MZ0 + MD); uv.push(0, 0, 1, 0, 0, 1, 1, 1); lay.push(k, k, k, k); idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aL', new THREE.Float32BufferAttribute(lay, 1)); g.setIndex(idx);
      const m = new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...fogU(), uTime: LU.uTime, uSky: LU.uSky, uLamp: LU.uLamp, tH: { value: tH } },
        vertexShader: /* glsl */`attribute float aL; varying vec2 vUv; varying vec3 vW; varying float vL;
          #include <fog_pars_vertex>
          void main(){ vUv = uv; vL = aL; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform sampler2D tH; uniform float uTime; uniform vec3 uSky, uLamp; varying vec2 vUv; varying vec3 vW; varying float vL;
          #include <fog_pars_fragment>
          ${HORN_NOISE_GLSL}
          void main(){ float h = texture2D(tH, vUv).r * 120. - 170., thick = vW.y - h;
            vec2 e = min(vUv, 1. - vUv); float edge = smoothstep(0., .1, e.x) * smoothstep(0., .1, e.y);
            float n = fb(vec3(vW.xz * .0042 + uTime * vec2(.011, -.007) * (1. + vL), vL * 3.7 + uTime * .012)) * .72 + fb(vec3(vW.xz * .013 - uTime * vec2(.02, .013), vL * 5.1)) * .28;
            float a = smoothstep(1., 30., thick) * edge * smoothstep(.3, .78, n + .22 * smoothstep(20., 60., thick)) * .6 * smoothstep(20., 110., cameraPosition.y - vW.y);
            vec3 col = vec3(.5, .54, .66) * (uSky * (.8 + .6 * n) + uLamp * .3);
            gl_FragColor = vec4(col, a);
            #include <fog_fragment>
          }` });
      const mist = new THREE.Mesh(g, m); mist.renderOrder = 1.5; mist.frustumCulled = false; mist.visible = weather !== 'sea'; scene.add(mist);   // (the cloud sea lies over it)
    }
    await ctx.yield();

    // ---------- the tarn: black water that holds the horn upside down (analytic mirror of the pyramid) ----------
    {
      const NR = 14, NA = 40, pos = [], dep = [], idx = [], R = TARN.r * 1.35;
      for (let i = 0; i <= NR; i++) for (let j = 0; j < NA; j++) { const r = R * Math.sqrt(i / NR), a = (j / NA) * Math.PI * 2, x = TARN.x + Math.cos(a) * r, z = TARN.z + Math.sin(a) * r; pos.push(x, TARN.y, z); dep.push(TARN.y - groundAt(x, z)); }
      for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * NA + j, b = i * NA + (j + 1) % NA, c = a + NA, d = b + NA; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aDepth', new THREE.Float32BufferAttribute(dep, 1)); g.setIndex(idx);
      const fn = HORN.faceAz.map((az) => new THREE.Vector2(Math.sin(az * D2R), -Math.cos(az * D2R)));
      const zen = new THREE.Color(L.sky.zenith), midc = new THREE.Color(L.sky.mid), hor = new THREE.Color(L.sky.horizon);
      const tarnMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,   // (the polar disc winds downward)
        uniforms: { ...fogU(), uTime: LU.uTime, uSky: LU.uSky, uShadowY: HU.uShadowY, uSunCol: HU.uSunCol, uSunDir: HU.uSunDir, uMoon: HU.uMoon, uEmber: HU.uEmber, uFN: { value: fn }, uFR: { value: HORN.faceR },
          uSummit: { value: new THREE.Vector3(SUMMIT[0], HORN.H, SUMMIT[1]) }, uZen: { value: zen }, uMid: { value: midc }, uHor: { value: hor }, uFrozen: { value: winter ? 1 : 0 }, uShiver: { value: 0 }, uTarn: { value: new THREE.Vector2(TARN.x, TARN.z) }, uTarnR: { value: TARN.r }, uEdge: HU.uEdge, uGlowY: HU.uGlowY, uFogD: { value: L.fogD }, uEye: { value: (() => { const dx = SUMMIT[0] - TARN.x, dz = SUMMIT[1] - TARN.z, l = Math.hypot(dx, dz); return new THREE.Vector3(TARN.x - dx / l * (TARN.r + 34), TARN.y + 30, TARN.z - dz / l * (TARN.r + 34)); })() } },
        vertexShader: /* glsl */`attribute float aDepth; varying vec3 vW; varying float vD;
          #include <fog_pars_vertex>
          void main(){ vW = position; vD = aDepth; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform float uTime, uShadowY, uFrozen, uShiver, uMoon, uEmber, uFogD, uTarnR, uEdge; uniform vec2 uTarn, uGlowY; uniform vec3 uSky, uSunCol, uSunDir, uSummit, uZen, uMid, uHor, uEye; uniform vec2 uFN[4]; uniform float uFR[4];
          varying vec3 vW; varying float vD;
          #include <fog_pars_fragment>
          ${HORN_NOISE_GLSL}
          float hornY(vec2 p){ vec2 q = p - uSummit.xz; float d = max(max(dot(q, uFN[0]) / uFR[0], dot(q, uFN[1]) / uFR[1]), max(dot(q, uFN[2]) / uFR[2], dot(q, uFN[3]) / uFR[3]));
            return uSummit.y * pow(max(1. - d, 0.), 1.22); }
          void main(){
            vec3 V = normalize(vW - uEye), Vc = normalize(vW - cameraPosition);
            // cat's paws: patches of fine ripples that wander; then the whole surface shivers when the blast arrives
            float paw = smoothstep(.45, .7, vn(vec3(vW.xz * .05 + uTime * vec2(.05, .02), uTime * .05))) * (1. - uFrozen);
            float mid = 1. - smoothstep(.5, .95, length(vW.xz - uTarn) / uTarnR);                    // (the middle stays a mirror: cat's paws and the shiver break only the edges)
            float dC = length(vW - cameraPosition), amp = (.005 + (.022 * paw + .034 * uShiver) * (1. - .8 * mid)) * (1. - .85 * uFrozen) / (1. + dC * .006);
            vec3 rp = vec3(vW.xz * vec2(.5, .22) + uTime * vec2(.12, .05), uTime * .7);
            vec2 gr = vec2(vn(rp) - vn(rp + vec3(.35, 0., 0.)), vn(rp) - vn(rp + vec3(0., .35, 0.)));
            vec3 N = normalize(vec3(gr.x * amp * 6., 1., gr.y * amp * 6.));
            vec3 R = reflect(V, N); R.y = abs(R.y) + .02; R = normalize(R);
            // the sky it mirrors
            float e = R.y; vec3 sky = mix(uMid * .16 + uZen * .12, uZen * .34, smoothstep(.0, .5, e));   // black water: the sky in it is deep slate-violet
            // the horn: march the mirrored ray against the pyramid
            float t = 200., hit = 0.; vec3 p = vW;
            for (int i = 0; i < 22; i++) { p = vW + R * t; if (p.y < hornY(p.xz)) { hit = 1.; break; } t *= 1.14; }
            if (hit > .5) {
              float t0 = t / 1.14, t1 = t;
              for (int i = 0; i < 4; i++) { float tm = .5 * (t0 + t1); p = vW + R * tm; if (p.y < hornY(p.xz)) t1 = tm; else t0 = tm; }
              float n = fb(p * .006), lit = smoothstep(uShadowY - uEdge - 4., uShadowY + uEdge + 4., p.y + (n - .5) * 30.);
              float snow = smoothstep(.5, .75, fb(p * .0023 + 5.));
              vec3 alb = mix(vec3(.26, .21, .2) * (.6 + .8 * n), vec3(.6, .64, .72), snow);
              vec3 hc = alb * (uSunCol * .8 * lit + uSky * .8 + uSunCol * uEmber * smoothstep(uGlowY.x, uGlowY.y, p.y) * .7);
              sky = mix(hc * (1.35 + .1 * lit), uHor * .3, (1. - exp(-uFogD * uFogD * t1 * t1)) * (1. - .6 * lit));   // (the lit summit is the brightest, most saturated thing in the water)
            }
            float cosT = clamp(dot(-Vc, N), 0., 1.), fres = mix(.82, 1., pow(1. - cosT, 3.)) * (1. - .55 * uFrozen);
            vec3 body = mix(vec3(.004, .008, .016), vec3(.02, .05, .08), (1. - smoothstep(0., 1.2, vD)));
            vec3 col = mix(body, sky, fres);
            // frozen in December: grey-blue ice, cracks, wind-packed snow
            float cr = (1. - smoothstep(.0, .06, abs(vn(vec3(vW.xz * .13, 3.)) - .5))) * .5 + (1. - smoothstep(.0, .03, abs(vn(vec3(vW.xz * .41, 7.)) - .5))) * .3;
            vec3 icec = mix(vec3(.2, .3, .42), vec3(.55, .62, .74), smoothstep(.45, .7, fb(vec3(vW.xz * .06, 1.)))) * uSky * 2.2 + cr * uSky * .5;
            col = mix(col, col * .45 + icec, uFrozen);
            float rim = (1. - smoothstep(.05, .5, vD));                                   // a thin ice rim along the shore
            col = mix(col, vec3(.55, .62, .74) * uSky * 2., rim * .7);
            gl_FragColor = vec4(col, smoothstep(.0, .22, vD) * (1. - smoothstep(uTarnR - 1., uTarnR + 3., length(vW.xz - uTarn))));
            #include <fog_fragment>
          }`,
      });
      const tarn = new THREE.Mesh(g, tarnMat); tarn.renderOrder = 1; scene.add(tarn);
      scene.userData.tarnMat = tarnMat;
    }
    await ctx.yield();

    // ---------- the glacier under the pull-out: wind-carved snow and snow snakes (a draped overlay), then fields of crevasses ----------
    let iceMat;
    {
      // the glacier's surface along the last 40% of the flight, 165 m to either side, drawn a second time: the terrain's own triangles
      // (so the overlay lies exactly on the ground), with a shader that carves them into wind ridges and sastrugi throwing blue
      // shadows away from the rose wall, and runs snow snakes down the ice ahead of the avalanche's wind
      const tp = terrain.geometry.attributes.position.array, ti = terrain.geometry.index.array, nV = tp.length / 3, NK = 40, HALF = 165, trk = new Float32Array((NK + 1) * 2), P = new THREE.Vector3();
      let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
      for (let k = 0; k <= NK; k++) { path.pointAt(mix(0.7, 0.975, k / NK), P); trk[k * 2] = P.x; trk[k * 2 + 1] = P.z; bx0 = Math.min(bx0, P.x - HALF); bx1 = Math.max(bx1, P.x + HALF); bz0 = Math.min(bz0, P.z - HALF); bz1 = Math.max(bz1, P.z + HALF); }
      const stripAt = (x, z) => { if (x < bx0 || x > bx1 || z < bz0 || z > bz1) return 0; let best = 1e12, bt = 0;   // 1 inside the strip, fading to 0 at its sides and ends
        for (let k = 0; k < NK; k++) { const ax = trk[k * 2], az = trk[k * 2 + 1], ex = trk[k * 2 + 2] - ax, ez = trk[k * 2 + 3] - az, t = sat(((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez)), dx = x - ax - ex * t, dz = z - az - ez * t, d = dx * dx + dz * dz; if (d < best) { best = d; bt = (k + t) / NK; } }
        return sstep(HALF, HALF - 40, Math.sqrt(best)) * sstep(0, 0.07, bt) * sstep(1, 0.93, bt); };
      const gAll = new Float32Array(nV).fill(-1), map = new Int32Array(nV).fill(-1), pos = [], gl = [], idx = [];
      const gOf = (v) => { if (gAll[v] < 0) { const x = tp[v * 3], z = tp[v * 3 + 2], f = stripAt(x, z); let gv = 0; if (f > 0) { colourInfo(x, z, tp[v * 3 + 1], info); gv = info.glacier * f; } gAll[v] = gv; } return gAll[v]; };
      for (let t = 0; t < ti.length; t += 3) { const a = ti[t], b = ti[t + 1], c = ti[t + 2];
        if (gOf(a) + gOf(b) + gOf(c) > 0.01) for (const v of [a, b, c]) { if (map[v] < 0) { map[v] = pos.length / 3; pos.push(tp[v * 3], tp[v * 3 + 1] + 0.03, tp[v * 3 + 2]); gl.push(gAll[v]); } idx.push(map[v]); }
        if ((t & 8191) === 8190) await ctx.yield(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aG', new THREE.Float32BufferAttribute(gl, 1)); g.setIndex(idx);
      const lxz = new THREE.Vector2(lampDir.x, lampDir.z).normalize();
      iceMat = new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -3,
        uniforms: { ...fogU(), uSky: LU.uSky, uLamp: LU.uLamp, uTime: LU.uTime, uL: { value: new THREE.Vector2(lxz.x * 0.75 - lxz.y * 0.66, lxz.x * 0.66 + lxz.y * 0.75) }, uSnake: { value: 0.7 } },
        vertexShader: /* glsl */`attribute float aG; varying vec3 vW; varying float vG;
          #include <fog_pars_vertex>
          void main(){ vG = aG; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform vec3 uSky, uLamp; uniform vec2 uL; uniform float uTime, uSnake; varying vec3 vW; varying float vG;
          #include <fog_pars_fragment>
          ${HORN_NOISE_GLSL}
          float ridge(vec2 q){ return smoothstep(.45, .55, fb(vec3(q, 0.))); }
          void main(){
            vec2 p = vec2(dot(vW.xz, vec2(.75, -.66)), dot(vW.xz, vec2(.66, .75)));          // along the wind, across it
            float dist = length(vW - cameraPosition), kb = 1. - smoothstep(420., 950., dist), ks = 1. - smoothstep(45., 150., dist);
            // whalebacks 50 m long and 10 m apart, sastrugi 14 m long and 3 m apart: plateaus with steep edges. A point is in shade when
            // the snow a few metres toward the light stands higher than it does, and lit when it is the higher
            vec2 qb = p * vec2(.02, .1), qs = p * vec2(.07, .34) + 7.3;
            float hb = ridge(qb), db = ridge(qb + uL * vec2(.02, .1) * 5.5) - hb;
            float hs = ridge(qs), ds = (ridge(qs + uL * vec2(.07, .34) * 1.3) - hs) * ks;
            float d = db * kb + ds * .7;
            float sh = clamp(d, 0., 1.), hl = clamp(-d, 0., 1.);
            // snow snakes: long sinuous ribbons of drift racing down the ice (toward the notch), each a braid of finer threads, each with
            // its own blue shadow beside it
            vec2 f = vec2(dot(vW.xz, vec2(.7071, .7071)), dot(vW.xz, vec2(-.7071, .7071)));
            float wob = f.y + 7. * sin(f.x * .021 + f.y * .013) + 3. * sin(f.x * .057 + 1.7), sl = (f.x - uTime * 9.) * .0035, kn = uSnake * (1. - smoothstep(260., 600., dist));
            float lane = vn(vec3(wob * .06, sl, 4.)), lane2 = vn(vec3((wob + 2.4) * .06, sl, 4.));
            float body = vn(vec3((f.x - uTime * 31.) * .016, wob * .3, 2.)) * .6 + vn(vec3((f.x - uTime * 47.) * .06, wob * .9, 9.)) * .4;
            float snake = smoothstep(.64, .73, lane) * (.45 + .55 * smoothstep(.3, .6, body)) * kn;          // (the crest of each lane: a long tapered ribbon)
            float snSh = smoothstep(.64, .73, lane2) * (1. - snake) * .55 * kn;
            vec3 shade = vec3(.2, .31, .6) * uSky, lit = vec3(.9, .9, .96) * (uSky * 1.15 + uLamp * .9), drift = vec3(1., 1., 1.) * (uSky * 1.42 + uLamp * .7);
            float hollow = (1. - hb) * .2 * kb;                                                  // the hollows between the whalebacks lie a little bluer
            float dark = sh * .6 + hollow + snSh, a = clamp(dark + hl * .5, 0., .8);
            vec3 col = mix(shade, lit, hl * .5 / max(hl * .5 + dark, 1e-3));
            snake *= .8 * (.5 + .5 * smoothstep(10., 70., dist));                                  // (right under us a snake is thin drift, not a white sheet)
            col = mix(col, drift, snake); a = max(a, snake) * vG;
            gl_FragColor = vec4(col, a);
            #include <fog_fragment>
          }` });
      const ice = new THREE.Mesh(g, iceMat); ice.renderOrder = 0.5; ice.frustumCulled = false; scene.add(ice);
    }
    await ctx.yield();
    {
      // crevasses stand in sets: four to six parallel slots across the flow, en echelon, each with its own outline (blunt or pinched
      // ends, a kink), pale raised lips, blue walls banded with the ice's layers and sagging snow bridges; a parallax shader gives the depth
      const crng = rng.fork('crev'), pos = [], uv = [], ax = [], sd = [], idx = [], NSEG = 12, keepOut = 0.3 + 0.5 * (1 - detail), P = new THREE.Vector3(), Tn = new THREE.Vector3();
      const cl = new Float32Array((NSEG + 1) * 5), LANES = [-118, -84, -52, 14, 44, 76, 110];   // metres off the flight line (the runners' strip, 4 to 21 m to the left, stays whole)
      // the field is laid out on a jittered grid, so no stretch of the pull-out is left bare; it thins toward the rock bar (the approach stays clean)
      for (let iu = 0; iu < 13 * 7; iu++) {
        const u = 0.705 + Math.floor(iu / 7) * 0.0185 + crng.range(-0.006, 0.006), lat = LANES[iu % 7] + crng.range(-9, 9), skip = crng() < keepOut + 0.5 * sstep(0.9, 0.95, u); path.pointAt(u, P); path.tangentAt(u, Tn);
        if ((iu % 7) === 6) await ctx.yield();
        if (skip) continue;
        const hl = Math.hypot(Tn.x, Tn.z) || 1, tx = Tn.x / hl, tz = Tn.z / hl, cx = P.x - tz * lat, cz = P.z + tx * lat; baseHeight(cx, cz, info); if (info.glacier < 0.85) continue;
        const ang = 2.36 + noise.n2(cx * 0.004, cz * 0.004) * 0.55 + crng.range(-0.12, 0.12), dx = Math.cos(ang), dz = Math.sin(ang), n = 4 + Math.floor(crng() * 2.99), gap = crng.range(5.5, 9.5);
        for (let k = 0; k < n; k++) {
          const off = (k - (n - 1) / 2) * gap * crng.range(0.85, 1.15), slip = crng.range(-9, 9), sx0 = cx - dz * off + dx * slip, sz0 = cz + dx * off + dz * slip;
          const len = crng.range(20, 62), half = crng.range(0.7, 2.1) * (len < 30 ? 0.7 : 1), fK = crng.range(0.3, 0.7), dA = crng() < 0.55 ? crng.range(-0.34, 0.34) : 0, endA = crng() < 0.65, endB = crng() < 0.65, seed = crng() * 40, bow = crng.range(-0.1, 0.1);
          // the centre line (a straight run, a kink, a slight bow), and which stretch of it lies clear of the runners' strip
          let run0 = 0, run1 = -1, r0 = 0;
          for (let i = 0; i <= NSEG; i++) { const f = i / NSEG, s = (f - 0.5) * len, sk = (fK - 0.5) * len, a2 = ang + bow * (f - 0.5);
            let x = sx0 + Math.cos(a2) * Math.min(s, sk), z = sz0 + Math.sin(a2) * Math.min(s, sk); if (s > sk) { x += Math.cos(a2 + dA) * (s - sk); z += Math.sin(a2 + dA) * (s - sk); }
            const aa = s > sk ? a2 + dA : a2, l2 = -(x - P.x) * tz + (z - P.z) * tx, clear = !(l2 > -21 && l2 < -4);
            cl[i * 5] = x; cl[i * 5 + 1] = z; cl[i * 5 + 2] = -Math.sin(aa); cl[i * 5 + 3] = Math.cos(aa); cl[i * 5 + 4] = clear ? 1 : 0;
            if (!clear) r0 = i + 1; else if (i - r0 > run1 - run0) { run0 = r0; run1 = i; } }
          if (run1 - run0 < 5) continue;
          baseHeight(cl[run0 * 5], cl[run0 * 5 + 1], info); if (info.glacier < 0.6) continue; baseHeight(cl[run1 * 5], cl[run1 * 5 + 1], info); if (info.glacier < 0.6) continue;
          const base = pos.length / 3, nS = run1 - run0, cut0 = run0 > 0, cut1 = run1 < NSEG; let ok = true;
          for (let i = run0; i <= run1 && ok; i++) { const f = (i - run0) / nS, x = cl[i * 5], z = cl[i * 5 + 1], nx = cl[i * 5 + 2], nz = cl[i * 5 + 3];
            const e0 = endA || cut0 ? Math.pow(Math.min(1, f / 0.07), 0.4) : Math.pow(sstep(0, 0.5, f), 0.8), e1 = endB || cut1 ? Math.pow(Math.min(1, (1 - f) / 0.07), 0.4) : Math.pow(sstep(0, 0.5, 1 - f), 0.8);
            const wf = half * Math.max(0.05, e0 * e1) * (0.8 + 0.3 * noise.n2(x * 0.11 + seed, z * 0.11)), tot = wf * 1.3 + 1.0;       // slot, then a lip a metre wide
            for (const s2 of [-1, 1]) { const px = x + nx * tot * s2, pz = z + nz * tot * s2, y = groundAt(px, pz); if (!(y > -200)) ok = false; pos.push(px, y + 0.2, pz); uv.push(f, s2); ax.push(nx, nz, tot, len * nS / NSEG); sd.push(seed, wf / tot); }
            if (i < run1) { const q = base + (i - run0) * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } }
          if (!ok) { pos.length = base * 3; uv.length = base * 2; ax.length = base * 4; sd.length = base * 2; while (idx.length && idx[idx.length - 1] >= base) idx.length -= 6; continue; }
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('aAx', new THREE.Float32BufferAttribute(ax, 4)); g.setAttribute('aS', new THREE.Float32BufferAttribute(sd, 2)); g.setIndex(idx);
      const lxz = new THREE.Vector2(lampDir.x, lampDir.z).normalize();
      const m = new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6, uniforms: { ...fogU(), uSky: LU.uSky, uLamp: LU.uLamp, uLxz: { value: lxz } },
        vertexShader: /* glsl */`attribute vec4 aAx; attribute vec2 aS; varying vec2 vUv; varying vec3 vW; varying vec4 vA; varying vec2 vS;
          #include <fog_pars_vertex>
          void main(){ vUv = uv; vA = aAx; vS = aS; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform vec3 uSky, uLamp; uniform vec2 uLxz; varying vec2 vUv; varying vec3 vW; varying vec4 vA; varying vec2 vS;
          #include <fog_pars_fragment>
          ${HORN_NOISE_GLSL}
          void main(){ float f = vUv.x, v = vUv.y, m = f * vA.w;                 // m = metres along the slot
            float px = 2. / max(fwidth(v), 1e-4);                                // width of the ribbon in pixels (thin slots fade instead of crawling)
            float n1 = vn(vec3(m * .5, vS.x, 0.)), n2 = vn(vec3(m * 1.9, vS.x, 3.));
            float sf = clamp(vS.y * (.78 + .34 * n1 + .12 * n2), .02, .9), av = abs(v);   // ragged lips: |v| < sf is the slot
            float hw = vA.z * sf, across = v * vA.z;                                // half width of the slot and where we are across it, in metres
            vec3 V = normalize(vW - cameraPosition); float da = dot(V.xz, vA.xy), dd = max(-V.y, .02);
            float depth = max(hw - across * sign(da), 0.) * dd / max(abs(da), .03);    // how far down the far wall the eye lands
            float lay = (.8 + .2 * sin(depth * 2.4 + n1 * 5.)) * (.72 + .5 * vn(vec3(m * .7, depth * .8, vS.x)));     // the ice's layers, fluted down the wall
            vec3 wall = mix(vec3(.01, .022, .065), vec3(.07, .15, .29), (.3 + .7 * exp(-depth * .8)) * mix(.42, 1., smoothstep(.12, .5, dd))) * (uSky * 1.5 + uLamp * .08) * lay;   // (seen from low down a slot is a dark gap)
            wall *= .72 + .28 * smoothstep(0., .5, (sf - av) * vA.z);              // a dark line under the overhanging lip
            float bridge = smoothstep(.66, .73, vn(vec3(m * .085 + vS.x * 7., 1.3, vS.x)));   // snow bridges, sagging in the middle
            vec3 br = vec3(.74, .8, .93) * (uSky * 1.1 + uLamp * .3) * (.8 + .2 * smoothstep(0., sf, av));
            vec3 inner = mix(wall, br, bridge);
            // the lip: a raised rim of wind-packed snow, bright where it faces the rose wall, in blue shade on its far side
            float lt = clamp((av - sf) / max(1. - sf, .05), 0., 1.), side = sign(v) * dot(vA.xy, uLxz);
            float lipA = (1. - smoothstep(.2, 1., lt)) * (.6 + .25 * n2);
            vec3 lipC = mix(vec3(.42, .52, .78) * uSky * 1.05, vec3(.86, .89, .97) * (uSky * 1.08 + uLamp * .6), smoothstep(-.7, .5, side + (1. - lt) * .4));
            float inside = 1. - smoothstep(sf - .03, sf + .03, av);
            vec3 col = mix(lipC, inner, inside);
            float al = max(inside, lipA * .92) * smoothstep(.0, .025, f) * (1. - smoothstep(.975, 1., f)) * clamp((px - 1.5) * .5, 0., 1.);
            gl_FragColor = vec4(col, al);
            #include <fog_fragment>
          }` });
      const crev = new THREE.Mesh(g, m); crev.renderOrder = 0.6; scene.add(crev);
    }
    await ctx.yield();

    // ---------- rock: pedestals and gendarmes on the crest, the stoop's ribs, the two towers, boulders ----------
    const rrng = rng.fork('rock');
    const rockMat = T.makeRockMaterial({ terrain, top: winter ? '#c6d2e8' : '#b4c1da', topAmount: winter ? 0.9 : 0.7, topSlope: [0.5, 0.82], contact: [0.5, 0, 0], strata: 0.3 });
    const RC = { color: '#7c7882', colorB: '#56525e' };
    const crestXZ = (s, n = 0) => [s * RD[0] + n * RN[0], s * RD[1] + n * RN[1]], ridgeYaw0 = Math.atan2(RD[0], RD[1]);
    const parts = [], stands = [], tops = [];   // stands: tops an animal can stand on { x, y, z, s }; tops: every crag's summit (spindrift)
    const mR = new THREE.Matrix4(), qR = new THREE.Quaternion(), eR = new THREE.Euler(), pR = new THREE.Vector3(), sR = new THREE.Vector3(1, 1, 1);
    // a crag: one tall faceted block with two or three smaller ones leaning on its foot (h = height above ground, r = radius)
    const addCrag = (x, z, h, r, o = {}) => {
      const gy = o.base ?? groundAt(x, z), sy = (h + 3.5) / (2 * r), det = o.detail ?? 3;
      const g = T.rockGeometry({ rng: rrng, kind: 'rock', radius: r, detail: det, squash: [1, sy, o.flat ? 1 : 0.86], taper: o.taper ?? (o.flat ? 0.12 : 0.62), cuts: o.flat ? 7 : 11, roughness: 0.3, lumps: 0.32, ...(o.col || RC) });
      const yaw = rrng.range(0, 6.28), lean = o.flat || o.stand ? 0 : rrng.range(-0.07, 0.07);
      qR.setFromEuler(eR.set(lean, yaw, lean * 0.6)); mR.compose(pR.set(x, gy + h * 0.5 - 1.75, z), qR, sR); parts.push({ g, m: mR.clone() });
      // summit of the transformed block (and, for a stand, the top over its middle)
      const a = g.attributes.position; let top = -1e9, mid = -1e9;
      for (let i = 0; i < a.count; i++) { pR.fromBufferAttribute(a, i).applyMatrix4(mR); if (pR.y > top) top = pR.y; if (Math.hypot(pR.x - x, pR.z - z) < (o.flat ? r * 0.3 : 0.8) && pR.y > mid) mid = pR.y; }
      if (o.cap !== undefined) {   // a stand: level at y = cap over a disc wide enough for hooves; outside it the top breaks down in bevels and notches
        g.applyMatrix4(mR); mR.identity(); parts[parts.length - 1].m = mR.clone(); const cy = gy + h * 0.5 - 1.75, R1 = o.capR ?? 2.1;
        for (let i = 0; i < a.count; i++) { const vx = a.getX(i) - x, vz = a.getZ(i) - z, vy = a.getY(i), rr = Math.hypot(vx, vz);
          if (rr < R1) { if (vy > cy) a.setY(i, o.cap); }
          else { const lim = o.cap - (rr - R1) * 0.7 + 0.8 * noise.n2(a.getX(i) * 0.8, a.getZ(i) * 0.8) - 0.7 * Math.max(0, Math.sin(Math.atan2(vz, vx) * 3 + x)); if (vy > lim) a.setY(i, Math.min(o.cap, lim)); } }
        g.computeVertexNormals(); top = mid = o.cap; }
      tops.push([x, top, z]); if (o.stand) stands.push({ x, y: mid, z, s: o.stand });
      for (let k = 0, n = o.solo ? 0 : 2; k < n; k++) { const an = rrng.range(0, 6.28), rr = r * rrng.range(0.42, 0.62), d = r * rrng.range(0.75, 1.05), bx = x + Math.cos(an) * d, bz = z + Math.sin(an) * d;
        if (path.distanceTo(bx, groundAt(bx, bz) + rr, bz) < rr * 1.6 + 6.5) continue;
        const gb = T.rockGeometry({ rng: rrng, kind: 'rock', radius: rr, detail: 2, squash: [1, rrng.range(1.2, 2.0), 0.9], taper: 0.4, cuts: 8, roughness: 0.3, ...RC });
        qR.setFromEuler(eR.set(rrng.range(-0.3, 0.3), rrng.range(0, 6.28), rrng.range(-0.3, 0.3))); mR.compose(pR.set(bx, groundAt(bx, bz) + rr * 0.5, bz), qR, sR); parts.push({ g: gb, m: mR.clone() }); }
    };
    // the ibex rampart: a row of level-topped stands on the crest, left of the flight line from u 0.17 to 0.21, their tops just above
    // the eye line so that every animal on them stands on the skyline (s, n, cap above 458, radius, tag)
    const RAMP = [[19.6, -4.2, 0.6, 2.4, 'r0'], [23.2, -3.4, 2.2, 2.9, 'clash'], [26.4, -3.5, 2.2, 3.0, 'clash2'], [30.0, -4.6, 1.0, 2.3, 'r1'], [33.4, -3.3, 3.2, 2.6, 'r2'], [37.6, -4.0, 5.0, 2.2, 'r3'], [41.8, -2.9, 2.9, 2.9, 'r4']];
    for (const [s, n, c, hh, r] of [[18.2, -6.2, 3.4, 9, 2.0], [21.6, -6.6, 4.6, 10, 1.7], [34.6, -6.3, 6.0, 12, 1.9], [38, -6.6, 5.2, 10, 1.7], [41.6, -5.2, 4.4, 9, 1.9], [21.4, -1.4, -0.8, 12, 1.4], [28, -1.3, -0.4, 12, 1.5], [34.6, -1.1, 0.2, 13, 1.4], [16.6, -2.4, 0.2, 12, 1.7], [19.6, 0.4, -3.6, 9, 1.7], [24.8, 0.2, -2.6, 10, 1.9], [30.6, 0.6, -4.2, 9, 1.8], [36.8, 0.5, -3.0, 10, 1.8], [41.5, 0.2, -1.8, 11, 1.7], [22.4, 1.9, -6.4, 7, 1.5], [27.6, 2.0, -5.6, 8, 1.6], [33.6, 2.3, -7.0, 7, 1.5], [39.4, 2.4, -6.0, 7, 1.5]]) {
      const [x, z] = crestXZ(s, n); addCrag(x, z, hh, r, { detail: 2, solo: true, base: 458 + c - hh, taper: 0.7 }); await ctx.yield(); }
    for (const [s, n, c, r, tag] of RAMP) { const [x, z] = crestXZ(s, n), cap = 458 + c;     // a level-topped block on a broader plinth: two rocks, so neither is stretched
      addCrag(x, z, 6.6, r, { stand: tag, cap, detail: 3, taper: 0.3, base: cap - 5 }); await ctx.yield(); addCrag(x + 0.12, z + 0.9, cap - 3.4 - groundAt(x, z), r * 1.28, { detail: 2, solo: true, taper: 0.25 }); await ctx.yield(); }
    { const [x, z] = crestXZ(-41, -1.9); addCrag(x, z, 452.8 - groundAt(x, z), 3.6, { stand: 'bull', cap: 451, capR: 1.5, taper: 0.45 }); await ctx.yield(); }       // right of the path before the gap (u 0.12)
    const PALE = { color: '#9a98a8', colorB: '#727080' };
    const gend = [[72, 15], [-72, 19], [96, 12, 1], [-104, 14, 1], [132, 28], [-140, 18], [176, 14, 1], [-176, 22], [224, 25], [278, 16, 1], [340, 22], [-218, 13, 1], [-262, 20], [420, 26], [505, 20]];
    for (const [s, h, flat] of gend) { if (!flat) continue; const [x, z] = crestXZ(s + rrng.range(-4, 4), rrng.range(-1, 2)), hh = h * rrng.range(0.9, 1.15);      // level-topped blocks: stands for the ibex
      addCrag(x, z, hh, 5, { flat: true, stand: 'top', detail: Math.abs(s) > 110 ? 2 : 3, col: PALE }); await ctx.yield(); }
    await ctx.yield();
    // jointed rock: a bundle of columns split along vertical joints; every column is a stack of blocks, each tapering, each stepping in
    // on a ledge and sitting a little askew on the one below, under a tilted faceted head: flat faces, crisp edges, ledges that hold the
    // snow (own geometry; the kit's rocks are rounded). o.sq = [x, z, k] flattens the bundle along a direction (slabs and fins)
    const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nn = new THREE.Vector3(), LIGHT = { color: '#aeacbc', colorB: '#8a8898' }, CRAG = { color: '#9a98a8', colorB: '#727080', blockH: 7.5, sideH: [0.45, 0.92] };
    const prismBundle = (cx, cz, gy, H, R, n, o = {}) => {
      const P = [], N = [], C = [], ca = new THREE.Color(o.color || RC.color), cb = new THREE.Color(o.colorB || RC.colorB), cc = new THREE.Color(), sq = o.sq;
      const tri = (a, b, c, k) => { e1.subVectors(b, a); e2.subVectors(c, a); nn.crossVectors(e1, e2).normalize(); for (const v of [a, b, c]) { P.push(v.x, v.y, v.z); N.push(nn.x, nn.y, nn.z); C.push(cc.r * k, cc.g * k, cc.b * k); } };
      for (let q = 0; q < n; q++) {
        const an = q === 0 ? 0 : (q / (n - 1)) * 6.283 + rrng.range(-0.4, 0.4), d = q === 0 ? 0 : R * rrng.range(0.5, 0.82); let px = Math.cos(an) * d, pz = Math.sin(an) * d;
        if (sq) { const c = (px * sq[0] + pz * sq[1]) * (1 - sq[2]); px -= c * sq[0]; pz -= c * sq[1]; } px += cx; pz += cz;
        const r = R * (q === 0 ? rrng.range(0.62, 0.78) : rrng.range(0.34, 0.54)), h = H * (q === 0 ? 1 : o.sideH ? rrng.range(o.sideH[0], o.sideH[1]) : rrng.range(0.3, 0.8)), base = Math.min(gy, groundAt(px, pz)) - 3, top = gy + h;
        const lx = rrng.range(-0.04, 0.04) + (o.lean ? o.lean[0] : 0), lz = rrng.range(-0.04, 0.04) + (o.lean ? o.lean[1] : 0);
        const ring = (f, sc, a, ox, oz, rr) => { const y = base + (top - base) * f, row = [], ns = rr.length;
          for (let i = 0; i < ns; i++) { const ang = a + (i / ns) * 6.283; let vx = Math.cos(ang) * rr[i] * sc, vz = Math.sin(ang) * rr[i] * sc;
            if (sq) { const c = (vx * sq[0] + vz * sq[1]) * (1 - sq[2]); vx -= c * sq[0]; vz -= c * sq[1]; }
            row.push(new THREE.Vector3(px + ox + vx + lx * (y - base), y, pz + oz + vz + lz * (y - base))); }
          return row; };
        const nb = Math.max(1, Math.min(6, Math.round(h / (o.blockH || 11) + rrng.range(-0.4, 0.4)))), stp = Math.pow(0.4, 1 / nb), wts = []; let acc = 0, f = 0, sc = 1.12, ox = 0, oz = 0; const apex = new THREE.Vector3();
        for (let b = 0; b < nb; b++) { wts.push(rrng.range(0.7, 1.3) * (1 + 0.5 * (nb - b))); acc += wts[b]; }      // the lower blocks are the taller
        for (let b = 0; b < nb; b++) {   // one block: its own section and its own turn, a tapering prism under a low faceted cap (the ledge)
          const f1 = b === nb - 1 ? 1 : f + wts[b] / acc, ns = 4 + Math.floor(rrng() * 2.99), a0 = rrng.range(0, 6.28), rr = [], s1 = sc * Math.sqrt(stp) * rrng.range(0.96, 1.04), lastB = b === nb - 1;
          for (let i = 0; i < ns; i++) rr.push(r * rrng.range(0.8, 1.2));
          const lo = ring(Math.max(0, f - 0.03), sc, a0, ox, oz, rr), hi = ring(f1, s1, a0 + rrng.range(-0.08, 0.08), ox, oz, rr), kb = 0.88 + 0.24 * rrng(), rt = r * s1;
          for (let i = 0; i < ns; i++) { const j = (i + 1) % ns, kk = kb * (0.9 + 0.2 * rrng()); cc.copy(ca).lerp(cb, rrng()); tri(lo[i], hi[i], lo[j], kk); tri(lo[j], hi[i], hi[j], kk); }
          apex.set(0, 0, 0); for (const v of hi) apex.add(v); apex.multiplyScalar(1 / ns).add(e1.set(rrng.range(-0.4, 0.4) * rt, rt * (lastB ? rrng.range(0.3, 0.9) : rrng.range(0.06, 0.22)), rrng.range(-0.4, 0.4) * rt));
          const ap = apex.clone(); for (let i = 0; i < ns; i++) { cc.copy(ca).lerp(cb, rrng()); tri(hi[i], ap, hi[(i + 1) % ns], 0.95 + 0.2 * rrng()); }
          f = f1; sc = s1 * Math.sqrt(stp) * rrng.range(0.9, 1.06); ox += rrng.range(-0.2, 0.2) * r * sc; oz += rrng.range(-0.2, 0.2) * r * sc; }
        if (q === 0 && !o.noTop) tops.push([apex.x, apex.y, apex.z]);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      mR.identity(); (o.into || parts).push({ g, m: mR.clone() }); };
    // an aiguille: a cluster of leaning spires, no two alike. Each is a crooked many-sided shaft whose corners wander as it rises;
    // here and there one side steps in on a small ledge (snow lies there), the shaft narrows to a blade and ends in an off-centre point,
    // and the lesser spires beside it give the tower a split, uneven head. o.stand = y of a level top for an animal (then no point)
    const aiguille = (cx, cz, gy, H, R, o = {}) => {
      const P = [], N = [], C = [], ca = new THREE.Color(o.color || CRAG.color), cb = new THREE.Color(o.colorB || CRAG.colorB), cc = new THREE.Color(), nsp = o.spires ?? 5, cen = new THREE.Vector3();
      const tri = (a, b, c, k) => { e1.subVectors(b, a); e2.subVectors(c, a); nn.crossVectors(e1, e2); if (nn.lengthSq() < 1e-8) return; nn.normalize(); for (const v of [a, b, c]) { P.push(v.x, v.y, v.z); N.push(nn.x, nn.y, nn.z); C.push(cc.r * k, cc.g * k, cc.b * k); } };
      for (let q = 0; q < nsp; q++) {
        const an = (q / Math.max(1, nsp - 1)) * 6.283 + wrng.range(-0.5, 0.5), d = q === 0 ? 0 : R * wrng.range(0.5, 0.82); let dx = Math.cos(an), dz = Math.sin(an);
        if (o.away && q) { const c = dx * o.away[0] + dz * o.away[1]; if (c < 0) { dx -= 2 * c * o.away[0]; dz -= 2 * c * o.away[1]; } }   // (o.away: every lesser spire stands on that side, so an opening beside the tower stays clear)
        const px = cx + dx * d, pz = cz + dz * d;
        const r = R * (q === 0 ? wrng.range(0.6, 0.72) : wrng.range(0.4, 0.58)), h = H * (q === 0 ? 1 : wrng.range(0.28, 0.72)), base = Math.min(gy, groundAt(px, pz)) - 3, top = gy + h, bl = wrng.range(0, 3.1416);
        const flat = q === 0 && o.stand !== undefined, ns = 5 + Math.floor(wrng() * 2.99), K = Math.max(4, Math.round(h / 5.2));
        const lx = (o.lean ? o.lean[0] : 0) + wrng.range(-0.035, 0.035) + (q ? dx * 0.07 : 0), lz = (o.lean ? o.lean[1] : 0) + wrng.range(-0.035, 0.035) + (q ? dz * 0.07 : 0);   // the lesser spires splay outward
        const rad = [], ang = [], mul = []; for (let i = 0; i < ns; i++) { rad.push(wrng.range(0.72, 1.3)); ang.push(((i + wrng.range(-0.28, 0.28)) / ns) * 6.283); mul.push(1); }
        let ox = 0, oz = 0;
        const ring = (f, tgt, dy = 0) => { const y = base + (top - base) * f + dy, row = [];
          for (let i = 0; i < ns; i++) { const k = rad[i] * r * tgt * mul[i] * (flat ? 1 : 1 - (o.blade ?? 0.5) * sstep(o.blade ? 0.2 : 0.45, 1, f) * Math.abs(Math.sin(ang[i] - bl)));   // toward its head the shaft thins to a blade
            row.push(new THREE.Vector3(px + ox + Math.cos(ang[i]) * k + lx * (y - base), y + (f > 0 && f < 1 ? wrng.range(-0.9, 0.9) : 0), pz + oz + Math.sin(ang[i]) * k + lz * (y - base))); }
          return row; };
        const band = (lo, hi, kb) => { for (let i = 0; i < ns; i++) { const j = (i + 1) % ns, kk = kb * (0.86 + 0.28 * wrng()); cc.copy(ca).lerp(cb, wrng()); tri(lo[i], hi[i], lo[j], kk); tri(lo[j], hi[i], hi[j], kk); } };
        const taper = (f) => 1.16 * (1 - 0.26 * f) * (1 - (flat ? 0.08 : 0.72) * sstep(0.6, 1, f));
        let prev = ring(0, taper(0));
        for (let k = 1; k <= K; k++) {
          const f = k === K ? 1 : (k + wrng.range(-0.28, 0.28)) / K;
          for (let i = 0; i < ns; i++) mul[i] = mix(mul[i], 1.04, 0.22) * wrng.range(0.84, 1.16);
          ox += wrng.range(-0.2, 0.2) * r; oz += wrng.range(-0.2, 0.2) * r;
          const cur = ring(f, taper(f)); band(prev, cur, 0.86 + 0.24 * wrng()); prev = cur;
          if (k < K && wrng() < 0.78) {   // a ledge: two or three neighbouring corners step in
            const i0 = Math.floor(wrng() * ns), w = 2 + (wrng() < 0.5 ? 1 : 0); for (let j = 0; j < w; j++) mul[(i0 + j) % ns] *= wrng.range(0.42, 0.7);
            const led = ring(f, taper(f), 0.25); band(prev, led, 1.08); prev = led; }
        }
        cen.set(0, 0, 0); for (const v of prev) cen.add(v); cen.multiplyScalar(1 / ns);
        if (flat) { for (const v of prev) v.y = o.stand; cen.y = o.stand; }                                        // a level top
        else cen.add(e1.set(wrng.range(-0.5, 0.5) * r * 0.3, r * wrng.range(0.5, 1.1), wrng.range(-0.5, 0.5) * r * 0.3));   // or a point, off centre
        const ap = cen.clone(); for (let i = 0; i < ns; i++) { cc.copy(ca).lerp(cb, wrng()); tri(prev[i], ap, prev[(i + 1) % ns], 0.95 + 0.2 * wrng()); }
        if (q === 0 && !o.noTop) tops.push([ap.x, ap.y, ap.z]);
        if (flat) stands.push({ x: ap.x, y: o.stand, z: ap.z, s: o.tag });
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      mR.identity(); (o.into || parts).push({ g, m: mR.clone() }); };
    // on the entry axis, 150 m ahead: a dark gendarme standing off the north flank with a great bull on its head. Seen through the portal
    // before ours it stands in the middle of the picture, black against the lit rock and ice of the horn; the path bears right of it
    // (the entry looks 5 degrees left of the summit) and passes 24 m clear
    { const ax = path.startTangent, hl = Math.hypot(ax.x, ax.z) || 1, gx = path.start.x + ax.x / hl * 150, gz = path.start.z + ax.z / hl * 150, gy = groundAt(gx, gz);
      aiguille(gx, gz, gy, 476 - gy, 6.4, { stand: 476, tag: 'axis', color: '#4a4854', colorB: '#2e2c38', spires: 5, noTop: true }); await ctx.yield(); }
    // the crest's gendarmes: towers of the same jointed rock as the fins beside them, each rooted in the crest
    for (const [s, h, flat] of gend) { if (flat) continue; const [x, z] = crestXZ(s + rrng.range(-4, 4), rrng.range(-1, 2) - (s === 72 || s === 132 ? 11 : 0)), hh = h * rrng.range(0.9, 1.15);   // (two stand north of the crest, clear of the line of sight to the serac band)
      prismBundle(x, z, groundAt(x, z), hh, Math.max(2.6, h * 0.2), 5, CRAG); await ctx.yield(); }
    // the spur beside the long stoop carries four rock towers; each head stands level with us a moment before we fall past its flank.
    // Between the first two, a pillar with a level top, 11 m off the wing: the ledge where three ibex stand as we fall past (u 0.61)
    { const P = new THREE.Vector3(), Tn = new THREE.Vector3();
      for (const uk of [0.585, 0.652, 0.742]) { const fi = (uk - RIBU[0]) / ((RIBU[1] - RIBU[0]) / 16), i = Math.min(15, Math.floor(fi)), t = fi - i, x = mix(RIB[i][0], RIB[i + 1][0], t), z = mix(RIB[i][1], RIB[i + 1][1], t);
        const gy = groundAt(x, z), H = Math.max(18, Math.min(64, path.pointAt(uk - 0.03, P).y - 2 + rrng.range(-2, 2) - gy));
        prismBundle(x, z, gy, H, Math.min(6.6, Math.max(4.8, H / 7)), 7, { ...CRAG, into: [], noTop: true }); await ctx.yield(); }      // (discarded: it only keeps the rock stream where it was)
      // the towers themselves: ragged aiguilles 31 m off the left wing, their heads below the eye line, so that they stand in the left of
      // the picture against the cloud and never across the glacier ahead
      for (const [uk, lat, drop] of [[0.578, 33, 18], [0.652, 31, 11]]) { path.pointAt(uk, P); path.tangentAt(uk, Tn); const hl = Math.hypot(Tn.x, Tn.z) || 1, x = P.x + (Tn.z / hl) * lat, z = P.z - (Tn.x / hl) * lat, gy = groundAt(x, z);
        const H = Math.max(24, Math.min(92, path.pointAt(uk - 0.03, P).y - drop - gy)); aiguille(x, z, gy, H, Math.min(10.5, Math.max(6.4, H / 7.8)), { lean: [(Tn.z / hl) * 0.07, -(Tn.x / hl) * 0.07] }); await ctx.yield(); }   // (they lean away from the flight line)
      path.pointAt(0.6214, P); path.tangentAt(0.6214, Tn); const hl = Math.hypot(Tn.x, Tn.z) || 1, lx = P.x + (Tn.z / hl) * 11.5, lz = P.z - (Tn.x / hl) * 11.5, cap = path.pointAt(0.61, P).y - 3.2, gy = groundAt(lx, lz);
      prismBundle(lx + 0.4, lz - 0.3, gy, cap - 2.6 - gy, 4.4, 6, { ...CRAG, noTop: true, sideH: [0.55, 0.96] }); await ctx.yield();
      addCrag(lx, lz, 6.6, 3.1, { stand: 'ledge', cap, capR: 2.5, detail: 3, taper: 0.3, base: cap - 5, solo: true, col: PALE }); await ctx.yield(); }
    // broken cliffs on the crest's south wall and under the bench's lip: buttresses of columns standing proud of the wall (no level
    // tiers), a second rank of slimmer pillars between them, and fallen blocks along the wall's foot on the bench
    { const buttress = (s, n, len, hgt) => { const nb = Math.max(2, Math.round(len / 22));
        for (let k = 0; k < nb; k++) { const [x, z] = crestXZ(s + ((k + rrng.range(-0.3, 0.3)) / nb - 0.5) * len, n + rrng.range(-3, 5)), gy = groundAt(x, z), R = rrng.range(5.5, 8.5), h = hgt * rrng.range(0.45, 0.85);
          if (path.distanceTo(x, gy + h * 0.5, z) < R * 1.3 + 9 || path.distanceTo(x, gy + h, z) < R * 1.3 + 9) continue;   // the corridor stays clear
          prismBundle(x, z, gy, h, R, 4, { lean: [-RN[0] * 0.08, -RN[1] * 0.08], noTop: k > 0, ...LIGHT }); } };
      for (const [n, s0, s1] of [[17, 110, 430]]) for (let s = s0 + rrng.range(0, 30); s < s1; s += rrng.range(62, 84)) { buttress(s, n + rrng.range(-4, 4), rrng.range(52, 76), rrng.range(32, 46)); await ctx.yield(); }   // (below this rank the wall mesh carries the rock)
      for (let s = 110, k = 0; s < 430; s += rrng.range(18, 34), k++) { const [x, z] = crestXZ(s, rrng.range(63, 78)), gy = groundAt(x, z), R = rrng.range(1.8, 3.4);
        if (Math.hypot(x - TARN.x, z - TARN.z) > TARN.r + 8) prismBundle(x, z, gy, R * rrng.range(1.2, 2.6), R, 3, { lean: [rrng.range(-0.25, 0.25), rrng.range(-0.25, 0.25)], noTop: true, ...CRAG });
        if ((k & 3) === 3) await ctx.yield(); } }
    // the knife ridge ahead of the crest crossing: fins and flakes of split rock standing along the arete, snow in the cracks between them
    for (let s = 54, k = 0; s < 345; s += rrng.range(4.5, 8), k++) { const [x, z] = crestXZ(s, rrng.range(-2.2, 4.5)), gy = groundAt(x, z), R = rrng.range(1.8, 3.6), h = R * rrng.range(1.0, 2.2);
      if (path.distanceTo(x, gy + h * 0.6, z) < R * 1.3 + 6.5) continue;
      prismBundle(x, z, gy, h, R, s < 190 ? 3 : 2, { lean: [rrng.range(-0.22, 0.22), rrng.range(-0.22, 0.22)], noTop: true, sq: [RN[0], RN[1], 0.42], ...LIGHT }); if ((k & 7) === 7) await ctx.yield(); }
    await ctx.yield();
    // the two towers of the notch, 16 m apart, and broken teeth along the rock bar
    for (const sd of [-1, 1]) { const b = sd * 15.6, x = END[0] - AX[0] * 2 - AX[1] * b, z = END[2] - AX[1] * 2 + AX[0] * b; prismBundle(x, z, groundAt(x, z), 35 + sd * 2.5, 5.6, 7, { ...CRAG, into: [], noTop: true });      // (discarded: it only keeps the rock stream where it was)
      await ctx.yield();
      // two ragged needles: each leans a little away from the gap, a split pointed head, its lesser spires on the outer side
      aiguille(x, z, groundAt(x, z), 38.5 + sd * 3.5, 5.8, { spires: 4, away: [-AX[1] * sd, AX[0] * sd], lean: [-AX[1] * sd * 0.05 + AX[0] * 0.03 * sd, AX[0] * sd * 0.05 + AX[1] * 0.03 * sd] }); await ctx.yield(); }
    for (const [a, b, h, r] of [[-8, 36, 15, 5], [4, -39, 19, 5.5], [-20, 60, 10, 5], [10, -66, 12, 5.5], [-5, 90, 16, 6], [14, -100, 9, 5], [-30, -130, 14, 6], [0, 134, 11, 6]]) {
      const x = END[0] + AX[0] * a - AX[1] * b, z = END[2] + AX[1] * a + AX[0] * b; addCrag(x, z, h, r, { detail: 2 }); await ctx.yield(); }
    { const half = parts.length >> 1; scene.add(new THREE.Mesh(T.mergeRocks(parts.slice(0, half)), rockMat)); await ctx.yield(); scene.add(new THREE.Mesh(T.mergeRocks(parts.slice(half)), rockMat)); }
    for (const p of parts) p.g.dispose();
    await ctx.yield();
    // ---------- seracs: a pressure ridge of blue ice beside the pull-out, 34 to 48 m off the left wing, the chamois bounding along its
    // foot; at its upstream end an ice cave opens toward us as we come down ----------
    {
      const iceParts = [], ICE = { color: '#c4d8ea', colorB: '#8fb4d6', blockH: 6.5, sideH: [0.5, 0.95] }, P = new THREE.Vector3(), Tn = new THREE.Vector3(), srng = rng.fork('serac');
      const at = (u, lat) => { path.pointAt(u, P); path.tangentAt(u, Tn); const hl = Math.hypot(Tn.x, Tn.z) || 1; return [P.x - (Tn.z / hl) * lat, P.z + (Tn.x / hl) * lat]; };
      for (let k = 0; k < 16; k++) { const u = 0.836 + k * 0.0036 + srng.range(-0.001, 0.001), lat = -(33 + srng.range(0, 14)), R = srng.range(3.4, 5.6), H = srng.range(9, 16) + (k < 4 ? 4 : 0);
        if (k < 3) continue;                                                               // (the gap where the cave's mouth stands)
        const [x, z] = at(u, lat), gy = groundAt(x, z), hl = Math.hypot(Tn.x, Tn.z) || 1, tx = Tn.x / hl, tz = Tn.z / hl, lean = [srng.range(-0.2, 0.2) * 1.5, srng.range(-0.2, 0.2) * 1.5];
        prismBundle(x, z, gy, H, R, 6, { ...ICE, into: [], noTop: true, lean });                                       // (discarded: it only keeps the rock stream where it was)
        // leaning blades and wedges of ice with sheared, pointed heads; every fourth has a blade toppled against its neighbour
        aiguille(x, z, gy, H * 1.2, R * 0.98, { color: ICE.color, colorB: ICE.colorB, into: iceParts, noTop: true, spires: 3 + (k & 1), blade: 0.72, lean });
        if (k % 4 === 1) { const sg = k & 2 ? 1 : -1; aiguille(x - tx * sg * R * 1.9, z - tz * sg * R * 1.9, gy, H * 0.95, R * 0.7, { color: ICE.color, colorB: ICE.colorB, into: iceParts, noTop: true, spires: 1, blade: 0.72, lean: [tx * sg * 0.7, tz * sg * 0.7] }); }
        if ((k & 3) === 3) await ctx.yield(); }
      // the cave: an arched tunnel of ice 15 m deep, its mouth turned toward the line we come down; outside it is one more serac
      const [cx, cz] = at(0.84, -30), cy = groundAt(cx, cz) - 0.8; path.pointAt(0.785, P); const mx0 = P.x - cx, mz0 = P.z - cz, ml = Math.hypot(mx0, mz0) || 1, mx = mx0 / ml, mz = mz0 / ml;   // m: out of the mouth
      const NJ = 7, NI = 11, ring = (j, a, b, jit) => { const t = j / (NJ - 1), sc = 1 - 0.6 * t * t, row = [];
        for (let i = 0; i < NI; i++) { const ph = Math.PI * i / (NI - 1), lx = Math.cos(ph) * a * sc * (1 + srng.range(-jit, jit)), ly = Math.sin(ph) * b * sc * (1 + srng.range(-jit, jit)) + 1.2 * t, d = 1.5 - t * 15 + srng.range(-0.4, 0.4);
          row.push(new THREE.Vector3(cx + mx * d - mz * lx + 2.2 * t * t * mz, cy + ly, cz + mz * d + mx * lx - 2.2 * t * t * mx)); }
        return row; };
      const inR = [], outR = []; for (let j = 0; j < NJ; j++) { inR.push(ring(j, 6.2, 9, 0.07)); outR.push(ring(j, 10, 12.6, 0.12)); }
      const iP = [], iN = [], iC = [], cP = [], cT = [], cc = new THREE.Color(), ca = new THREE.Color(ICE.color), cb = new THREE.Color(ICE.colorB);
      const triI = (a, b, c) => { e1.subVectors(b, a); e2.subVectors(c, a); nn.crossVectors(e1, e2).normalize(); if (nn.y < -0.2) nn.negate(); cc.copy(ca).lerp(cb, srng()); const k = 0.85 + 0.3 * srng();
        for (const v of [a, b, c]) { iP.push(v.x, v.y, v.z); iN.push(nn.x, nn.y, nn.z); iC.push(cc.r * k, cc.g * k, cc.b * k); } };
      for (let j = 0; j < NJ - 1; j++) for (let i = 0; i < NI - 1; i++) {
        triI(outR[j][i], outR[j + 1][i], outR[j][i + 1]); triI(outR[j][i + 1], outR[j + 1][i], outR[j + 1][i + 1]);
        for (const [a, b, c, ta, tb, tc] of [[inR[j][i], inR[j][i + 1], inR[j + 1][i], j, j, j + 1], [inR[j][i + 1], inR[j + 1][i + 1], inR[j + 1][i], j, j + 1, j + 1]]) { cP.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); cT.push(ta / (NJ - 1), tb / (NJ - 1), tc / (NJ - 1)); } }
      for (let i = 0; i < NI - 1; i++) { triI(inR[0][i], outR[0][i], inR[0][i + 1]); triI(inR[0][i + 1], outR[0][i], outR[0][i + 1]); }      // the thick rim of the mouth
      { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(iP, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(iN, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(iC, 3)); mR.identity(); iceParts.push({ g, m: mR.clone() }); }
      await ctx.yield();
      const seracMat = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...LU },
        vertexShader: /* glsl */`attribute vec3 color; varying vec3 vN, vW, vC;
          #include <fog_pars_vertex>
          void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vC = color; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform vec3 uSky, uGround, uLampDir, uLamp; varying vec3 vN, vW, vC;
          #include <fog_pars_fragment>
          ${HORN_NOISE_GLSL}
          void main(){ vec3 N = normalize(vN), V = normalize(cameraPosition - vW); if (dot(N, V) < 0.) N = -N;
            float n = vn(vW * .33), n2 = vn(vW * 1.4), beds = .8 + .2 * sin(vW.y * 2.1 + n * 5.);                      // the ice's layers
            float cap = smoothstep(.5, .8, N.y + (n2 - .5) * .3);                                                    // snow on every ledge and head
            vec3 light = mix(uGround * 1.3, uSky * 1.2, N.y * .5 + .5) + uLamp * max(dot(N, uLampDir), 0.) * .9;
            float fres = pow(1. - max(dot(N, V), 0.), 2.);
            vec3 ice = vC * beds * (.78 + .44 * n2);
            vec3 col = ice * light + ice * vec3(.1, .3, .52) * (.2 + .8 * fres) * (uSky.b * .6 + .03);             // light held inside the ice
            col = mix(col, vec3(.8, .85, .95) * (uSky * 1.15 + uLamp * .6), cap);
            gl_FragColor = vec4(col, 1.);
            #include <fog_fragment>
          }` });
      scene.add(new THREE.Mesh(T.mergeRocks(iceParts), seracMat)); for (const q of iceParts) q.g.dispose();
      await ctx.yield();
      const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cP, 3)); cg.setAttribute('aT', new THREE.Float32BufferAttribute(cT, 1));
      scene.add(new THREE.Mesh(cg, new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), uSky: LU.uSky },
        vertexShader: /* glsl */`attribute float aT; varying float vT; varying vec3 vW;
          #include <fog_pars_vertex>
          void main(){ vT = aT; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform vec3 uSky; varying float vT; varying vec3 vW;
          #include <fog_pars_fragment>
          ${HORN_NOISE_GLSL}
          void main(){ float sc = vn(vW * .8) * .6 + vn(vW * 2.3) * .4;                                              // scalloped walls
            vec3 col = mix(vec3(.24, .56, .95), vec3(.01, .035, .12), pow(clamp(vT, 0., 1.), .55)) * (.7 + .6 * sc) * (uSky.b * .62 + .05);
            gl_FragColor = vec4(col, 1.);
            #include <fog_fragment>
          }` })));
    }
    await ctx.yield();
    // boulders: bench, moraine and rock bar, crest rubble
    const spots = T.scatter({ rng: rrng, terrain, path, count: Math.round(104 * (0.6 + 0.4 * detail)), band: [9, 120], clearance: 8, scale: [0.6, 3.4], slope: [0.5, 1],
      density: (x, z) => { baseHeight(x, z, info); return Math.max(info.bar, info.bench * 0.8, info.glacier * 0.06, (x * RN[0] + z * RN[1]) < 0 ? 0.5 : 0); } });
    await ctx.yield();
    const bGeo = T.rockGeometry({ rng: rrng, kind: 'boulder', detail: 2, ...RC });
    await ctx.yield();
    const bLod = T.rockGeometry({ rng: rrng, kind: 'boulder', detail: 1, ...RC });
    await ctx.yield();
    const boulders = T.makeInstances(bGeo, rockMat, spots, { lod: bLod, path, lodRatio: 30 });
    scene.add(boulders.object);
    await ctx.yield();
    terrain.addContact(spots);
    await ctx.yield();
    terrain.addContact(tops.map((t) => [t[0], t[2], 6]), { strength: 0.4 });
    await ctx.yield();

    // ---------- ibex and chamois: own build (lofted bodies, swept ribbed horns), animated in the vertex shader ----------
    const animalGeometry = (o) => {
      const P = [], C = [], W = [], V = [], I = [], col = new THREE.Color(), tA = new THREE.Vector3(), sA = new THREE.Vector3(), uA = new THREE.Vector3(), q = new THREE.Vector3();
      // a tube through rings [x, y, z, rx, ry, colour]; w = [head, leg sign, flick, leg phase], piv = pivot of the part
      const tube = (rings, sides, w, piv, capA = true, capB = true) => {
        const base = P.length / 3, n = rings.length;
        for (let i = 0; i < n; i++) {
          const a = rings[Math.max(0, i - 1)], b = rings[Math.min(n - 1, i + 1)], r = rings[i];
          tA.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); sA.set(1, 0, 0); if (Math.abs(tA.x) > 0.9) sA.set(0, 0, 1);
          uA.crossVectors(tA, sA).normalize(); sA.crossVectors(uA, tA).normalize(); col.set(r[5]);
          for (let j = 0; j < sides; j++) { const an = (j / sides) * Math.PI * 2; q.set(r[0], r[1], r[2]).addScaledVector(sA, Math.cos(an) * r[3]).addScaledVector(uA, Math.sin(an) * r[4]);
            const shade = 0.82 + 0.18 * Math.sin(an) * (uA.y > 0 ? 1 : -1); P.push(q.x, q.y, q.z); C.push(col.r * shade, col.g * shade, col.b * shade); W.push(w[0], w[1], w[2], w[3]); V.push(piv[0], piv[1], piv[2]); }
        }
        for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) { const a = base + i * sides + j, b = base + i * sides + (j + 1) % sides, c = a + sides, d = b + sides; I.push(a, b, c, b, d, c); }
        for (const [on, ri] of [[capA, 0], [capB, n - 1]]) if (on) { const r = rings[ri], k = P.length / 3; col.set(r[5]); P.push(r[0], r[1], r[2]); C.push(col.r, col.g, col.b); W.push(w[0], w[1], w[2], w[3]); V.push(piv[0], piv[1], piv[2]);
          for (let j = 0; j < sides; j++) { const a = base + ri * sides + j, b = base + ri * sides + (j + 1) % sides; if (ri === 0) I.push(k, b, a); else I.push(k, a, b); } }
      };
      const coat = o.coat, belly = o.belly, dark = o.dark, horn = o.horn, pale = o.pale;
      // body: rump, haunch, barrel, chest, shoulder
      tube([[0, 0.72, -0.56, 0.1, 0.12, coat], [0, 0.71, -0.44, 0.2, 0.22, pale], [0, 0.66, -0.2, 0.235, 0.265, coat], [0, 0.63, 0.08, 0.25, 0.3, belly], [0, 0.66, 0.32, 0.235, 0.3, coat], [0, 0.74, 0.5, 0.15, 0.2, coat]], 10, [0, 0, 0, 0], [0, 0, 0]);
      const NP = [0, 0.8, 0.42];   // neck pivot
      tube([[0, 0.76, 0.42, 0.14, 0.17, coat], [0, 0.92, 0.52, 0.11, 0.13, coat], [0, 1.06, 0.6, 0.095, 0.1, coat]], 8, [0.6, 0, 0, 0], NP, false, false);
      tube([[0, 1.1, 0.56, 0.085, 0.1, coat], [0, 1.13, 0.66, 0.095, 0.1, o.face], [0, 1.06, 0.82, 0.065, 0.07, o.face], [0, 1.0, 0.94, 0.042, 0.045, dark]], 8, [1, 0, 0, 0], NP);
      for (const sx of [-1, 1]) {
        tube([[sx * 0.09, 1.16, 0.6, 0.02, 0.035, coat], [sx * 0.2, 1.2, 0.56, 0.012, 0.03, dark]], 4, [1, 0, sx, 0], NP);           // ears
        // horns: bulls carry long ribbed scimitars; nannies, kids and chamois short ones (chamois hooked at the tip)
        const hr = [], HL = o.hornLen, nr = o.hook ? 7 : Math.max(5, Math.round(6 + HL * 9));
        for (let i = 0; i <= nr; i++) { const t = i / nr, rib = o.hook ? 1 : 1 + 0.22 * (i % 2);
          let y, z; if (o.hook) { const h = sstep(0.6, 1, t); y = 1.18 + HL * (t - 0.35 * h * h); z = 0.62 + 0.03 * t - HL * 0.42 * h * h; } else { y = 1.17 + HL * 0.6 * Math.sin(1.8 * t); z = 0.63 - HL * 0.62 * (1 - Math.cos(1.8 * t)) - 0.04 * t; }
          const r = (o.hook ? 0.022 : 0.05) * (1 - 0.82 * t) * rib + 0.006; hr.push([sx * (0.045 + (o.hook ? 0.05 : 0.2 * HL) * t * t), y, z, r, r * 1.15, horn]); }
        tube(hr, 6, [1, 0, 0, 0], NP, false, true);
        // legs: shoulder / hip, knee or hock, fetlock, hoof
        for (const [z0, sign, ph, kz] of [[0.36, 1, sx > 0 ? 0 : 0.5, 0.03], [-0.4, -1, sx > 0 ? 0.5 : 0, -0.07]]) {
          const piv = [0, 0.62, z0], x = sx * 0.125;
          tube([[x, 0.66, z0, 0.085, 0.1, coat], [x, 0.4, z0 + kz, 0.05, 0.055, o.leg], [x, 0.33, z0 + kz, 0.04, 0.045, o.leg], [x * 0.95, 0.09, z0 + kz * 0.3, 0.03, 0.033, o.leg], [x * 0.95, 0.05, z0 + kz * 0.3 + 0.01, 0.042, 0.048, dark], [x * 0.95, 0, z0 + kz * 0.3 + 0.02, 0.04, 0.05, dark]], 6, [0, sign, 0, ph], piv, false, true);
        }
      }
      if (o.beard) tube([[0, 1.0, 0.84, 0.03, 0.035, dark], [0, 0.86, 0.82, 0.006, 0.008, dark]], 5, [1, 0, 0.5, 0], NP, false, true);
      tube([[0, 0.78, -0.56, 0.035, 0.04, dark], [0, 0.74, -0.68, 0.015, 0.02, dark]], 5, [0, 0, 1, 0], [0, 0.76, -0.56], false, true);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 4)); g.setAttribute('aPiv', new THREE.Float32BufferAttribute(V, 3)); g.setIndex(I); g.computeVertexNormals();
      return g;
    };
    const animalMat = () => new THREE.ShaderMaterial({
      fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...LU, uAlert: { value: 0 } },
      vertexShader: /* glsl */`
        attribute vec3 color; attribute vec4 aW; attribute vec3 aPiv; attribute vec4 aI;
        uniform float uTime, uAlert; varying vec3 vN, vW, vC;
        #include <fog_pars_vertex>
        vec3 rotX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c); }
        vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c); }
        void main(){
          vec3 p = position, n = normal; float ph = aI.x * 6.283;
          // legs swing from shoulder and hip; front and hind pairs opposed
          float la = aW.y * aI.w * sin(aI.y + aW.w * 6.283 * step(aI.w, .5));
          p = aPiv + rotX(p - aPiv, la * abs(aW.y)); n = rotX(n, la * abs(aW.y));
          // head and neck: look about, nod, and snap round to the crack
          float look = aI.z * (1. - uAlert) + sin(uTime * .45 + ph) * .38 * smoothstep(-.2, .6, sin(uTime * .17 + ph * 1.7)) * (1. - uAlert) + uAlert * aI.z * 1.6;
          float nod = .12 * sin(uTime * .6 + ph * 2.3) - .1 * uAlert;
          vec3 hp = rotX(rotY(p - aPiv, look * aW.x), nod * aW.x) + aPiv; n = mix(n, rotX(rotY(n, look * aW.x), nod * aW.x), step(.001, aW.x)); p = mix(p, hp, step(.001, aW.x));
          // ears and tail flick now and then
          float fl = smoothstep(.75, 1., sin(uTime * 1.3 + ph * 5.)) * sin(uTime * 17. + ph);
          p.x += aW.z * .035 * fl; p.y += abs(aW.z) * .02 * fl;
          vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n); vC = color;
          vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSky, uGround, uLampDir, uLamp; varying vec3 vN, vW, vC;
        #include <fog_pars_fragment>
        void main(){ vec3 N = normalize(vN), V = normalize(cameraPosition - vW); if (dot(N, V) < 0.) N = -N;
          vec3 light = mix(uGround, uSky, N.y * .5 + .5) * .9 + uLamp * max(dot(N, uLampDir), 0.) * 1.3;
          float rim = pow(1. - max(dot(N, V), 0.), 3.);
          vec3 col = vC * light + (uSky * .22 * (N.y * .5 + .5) + uLamp * .3 * max(dot(N, uLampDir) + .3, 0.)) * rim;   // a rim on every animal
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }`,
    });
    const IBEX = { coat: '#3a2a20', belly: '#57463a', pale: '#4a392c', face: '#2c2019', leg: '#241a15', dark: '#120d0b', horn: '#3c342e' };
    const gBull = animalGeometry({ ...IBEX, hornLen: 0.92, beard: true });
    await ctx.yield();
    const gNanny = animalGeometry({ ...IBEX, coat: '#4a372a', hornLen: 0.3, beard: false });
    await ctx.yield();
    const gCham = animalGeometry({ coat: '#1f1815', belly: '#2a211c', pale: '#3c3028', face: '#8a7a64', leg: '#100c0a', dark: '#0c0908', horn: '#0b0908', hornLen: 0.26, hook: true, beard: false });
    await ctx.yield();
    const herdMesh = (geom, list, mat) => {
      const g = geom.clone(), n = Math.max(1, list.length), aI = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4); aI.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aI', aI);
      const mesh = new THREE.InstancedMesh(g, mat, n); mesh.count = list.length; mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      list.forEach((a, i) => { a.i = i; a.mesh = mesh; a.aI = aI; aI.setXYZW(i, a.phase, 0, a.head || 0, 0); setAnimal(a, a.x, a.y, a.z, a.yaw, 0, 0); });
      scene.add(mesh); return mesh;
    };
    const mA = new THREE.Matrix4(), mB = new THREE.Matrix4(), eA = new THREE.Euler(), vS = new THREE.Vector3();
    // place one animal: yaw about y, pitch about its hind hooves (rearing), lunge along its own heading
    const setAnimal = (a, x, y, z, yaw, pitch, lunge) => {
      const zh = -0.4 * a.scale;
      mA.makeRotationFromEuler(eA.set(0, yaw, 0)); mA.setPosition(x, y, z);
      mB.makeTranslation(0, 0, zh + lunge); mA.multiply(mB); mB.makeRotationX(-pitch); mA.multiply(mB); mB.makeTranslation(0, 0, -zh); mA.multiply(mB);
      mA.scale(vS.setScalar(a.scale)); a.mesh.setMatrixAt(a.i, mA); a.mesh.instanceMatrix.needsUpdate = true;
    };
    const arng = rng.fork('animals'), ridgeYaw = Math.atan2(RD[0], RD[1]);
    const nIbex = Math.max(14, Math.min(26, Math.round(20 * dens)));
    const seracW = hero.anchors.seracBand.clone().add(hero.object.position);
    const headTo = (x, z, yaw) => { let d = Math.atan2(seracW.x - x, seracW.z - z) - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.max(-0.7, Math.min(0.7, d / 1.6)); };
    const bulls = [], nannies = [], clashers = [], walkers = [];
    const mk = (x, y, z, yaw, bull, scale) => { const a = { x, y, z, yaw, scale, phase: arng(), head: headTo(x, z, yaw) }; (bull ? bulls : nannies).push(a); return a; };
    const crossYaw = Math.atan2(RN[0], RN[1]);
    // on the rampart: every animal stands on the level top of its own stand (ds along the crest, dn toward the flight line)
    const onStand = (tag, ds, dn, yaw, bull, scale) => { const st = stands.find((q) => q.s === tag); return mk(st.x + RD[0] * ds + RN[0] * dn, st.y - 0.03, st.z + RD[1] * ds + RN[1] * dn, yaw, bull, scale); };
    for (const c of [onStand('clash', 0.15, 0.8, ridgeYaw, true, 1.15), onStand('clash2', -0.15, 0.8, ridgeYaw + Math.PI, true, 1.24)]) { c.head = 0; c.bout = 0; clashers.push(c); }   // the two bulls face each other along the crest
    onStand('r0', -0.7, 1.3, ridgeYaw + Math.PI - 0.5, false, 0.86); onStand('r0', 0.9, -0.3, ridgeYaw + 0.3, true, 1.1);
    onStand('r1', -0.2, 1.1, ridgeYaw + Math.PI + 0.25, true, 1.14); onStand('r2', 0, 1.0, ridgeYaw - 0.2, true, 1.12); onStand('r3', -0.2, 1.0, ridgeYaw + Math.PI - 0.3, true, 1.18);
    onStand('r4', -0.5, 1.0, ridgeYaw + 0.4, false, 0.86); onStand('r4', 0.9, -0.4, ridgeYaw + Math.PI, false, 0.56);
    onStand('bull', 0, 0, crossYaw + 0.25, true, 1.1);
    onStand('ledge', 0.5, 0.2, ridgeYaw + 1.9, true, 1.2); onStand('ledge', -0.9, -0.5, ridgeYaw + 2.6, false, 0.9); onStand('ledge', -0.2, 1.3, ridgeYaw + 1.2, false, 0.58);   // the three on the ledge by the long stoop
    { const [x, z] = crestXZ(-30, 1.2); mk(x, groundAt(x, z) - 0.06, z, crossYaw + Math.PI - 0.4, false, 0.8); }
    for (const st of stands) if (st.s === 'top') mk(st.x + arng.range(-0.6, 0.6), st.y - 0.15, st.z + arng.range(-0.6, 0.6), ridgeYaw + arng.range(-1.2, 1.2) + (arng() < 0.5 ? Math.PI : 0), arng() < 0.65, arng.range(0.86, 0.95));
    for (let k = 0; k < 2; k++) { const a = mk(0, 0, 0, ridgeYaw, k === 0, k ? 0.8 : 0.9); a.s0 = 47 + k * 2.2; a.walk = k; walkers.push(a); }
    if (winter) for (const sd of [-1, 1]) { const [x, z] = crestXZ(87 + 1.45 * sd, 0.5); const a = mk(x, groundAt(x, z) - 0.05, z, ridgeYaw + (sd > 0 ? Math.PI : 0), true, 0.92); a.head = 0; a.bout = 0.03; clashers.push(a); }
    for (const s of arng.shuffle([-29, -53, -59, -86, -95, -124, -136, 84, 91, 122, 131, 170, 186, 228, 246, 292, -180, -228, 62, 108])) {
      if (bulls.length + nannies.length >= nIbex) break;
      if (winter && s > 80 && s < 95) continue;
      const [x, z] = crestXZ(s + arng.range(-1.5, 1.5), arng.range(-0.4, 0.8)), bull = arng() < 0.45, kid = !bull && arng() < 0.35;
      mk(x, groundAt(x, z) - 0.06, z, ridgeYaw + arng.range(-0.9, 0.9) + (arng() < 0.5 ? Math.PI : 0), bull, kid ? 0.55 : bull ? arng.range(0.86, 0.96) : arng.range(0.74, 0.82));
    }
    { const st = stands.find((q) => q.s === 'axis'); bulls.push({ x: st.x, y: st.y - 0.05, z: st.z, yaw: crossYaw + 0.3, scale: 3, phase: 0.37, head: 0.35 }); }   // the great bull on the needle, broadside to the entry
    await ctx.yield();
    const ridgeMat = animalMat();
    const ridgeMeshes = swapCast ? [herdMesh(gCham, bulls, ridgeMat), herdMesh(gCham, nannies, ridgeMat)] : [herdMesh(gBull, bulls, ridgeMat), herdMesh(gNanny, nannies, ridgeMat)];
    // fourteen runners bounding down the glacier's edge, away from the blast (dark on pale snow)
    const runners = [], runMat = animalMat();
    for (let i = 0; i < 14; i++) runners.push({ x: 0, y: -999, z: 0, yaw: 0, scale: (swapCast ? 1.5 : arng.range(1.95, 2.25)) * (i % 5 === 4 ? 0.7 : 1), phase: arng(), head: 0, off: 4 + i * 3.6 + arng.range(-1.2, 1.2), lat: -(13.5 + (i % 3) * 2.6 + arng.range(-0.6, 0.6)), v: arng.range(7.2, 9.6) });
    herdMesh(swapCast ? gBull : gCham, runners, runMat);
    gBull.dispose(); gNanny.dispose(); gCham.dispose();
    const rP = new THREE.Vector3(), rT = new THREE.Vector3();
    const poseAnimals = (time, u) => {
      ridgeMat.uniforms.uAlert.value = sstep(hero.timing.crack - 0.002, hero.timing.crack + 0.01, u) * (1 - sstep(0.23, 0.29, u));
      for (const a of clashers) {   // rear, hang, drop and clash at u 0.17 (0.20 for the December pair), then spar
        const uu = u - a.bout, f1 = sstep(0.085, 0.128, uu), f2 = sstep(0.158, 0.168, uu), f3 = sstep(0.168, 0.196, uu);
        const pitch = (0.82 + 0.05 * Math.sin(time * 2.6 + a.phase * 6)) * f1 * (1 - f2) - 0.18 * f2 * (1 - f3) + 0.1 * f3 * Math.max(0, Math.sin(time * 0.9 + a.bout * 40));
        setAnimal(a, a.x, a.y, a.z, a.yaw, pitch, (0.46 * f2 * (1 - 0.6 * f3)) * a.scale);
        a.aI.setXYZW(a.i, a.phase, Math.asin(Math.max(-1, Math.min(1, -pitch / 0.95))), 0, 0.95); a.aI.needsUpdate = true;
      }
      for (const a of walkers) {    // two walking the crest: stride locked to distance, they slow, turn and come back
        const ph = time * 0.11 + a.walk * 0.6, s = a.s0 + 5.2 - 5.2 * Math.cos(ph), vel = Math.sin(ph), [x, z] = crestXZ(s, 0.3);
        setAnimal(a, x, groundAt(x, z) - 0.05, z, ridgeYaw + Math.PI * sstep(0.12, -0.12, vel), 0, 0);
        a.aI.setXYZW(a.i, a.phase, s / (0.3 * a.scale), 0, 0.42 * Math.min(1, Math.abs(vel) * 3)); a.aI.needsUpdate = true;
      }
      for (const a of runners) {    // ballistic 4 m bounds, keyed to u so that we overtake them at 0.86
        const arc = 0.87 * path.length + a.off + a.v * 40 * (u - 0.86), uu = Math.min(0.985, Math.max(0.795, arc / path.length));
        path.pointAt(uu, rP); path.tangentAt(uu, rT); const hl = Math.hypot(rT.x, rT.z) || 1, x = rP.x - (rT.z / hl) * a.lat, z = rP.z + (rT.x / hl) * a.lat;
        const b = arc / 4 + a.phase, ph = b - Math.floor(b), hop = Math.sin(Math.PI * ph);
        setAnimal(a, x, groundAt(x, z) + 0.75 * hop * a.scale, z, Math.atan2(rT.x, rT.z) + 0.25 * Math.sin(a.phase * 20 + arc * 0.05), 0.3 * Math.cos(Math.PI * ph), 0);
        a.aI.setXYZW(a.i, a.phase, ph * 6.283 + 1.2, 0, 0.8); a.aI.needsUpdate = true;
      }
    };
    await ctx.yield();

    // ---------- our mount: a golden eagle, the whole bird, flying the path just ahead of and below the eye (bird space: origin between
    // the shoulders, -Z ahead, +Y up). It is seen from behind and above, small and whole in the bottom fifth of the frame: head and gold
    // nape, the tawny bar across each wing, seven fingered primaries a side, the fanned tail. Wings beat slowly on the lift, shut to a
    // teardrop in the stoops and are thrown wide at the pull-out. Lit by the sky fill with only a breath of the lamp.
    const eagle = new THREE.Group(); eagle.visible = false; scene.add(eagle);
    const EAGLE_LIGHT = /* glsl */`
      vec3 eagleLight(vec3 N, vec3 V, vec3 uSky, vec3 uGround, vec3 uLampDir, vec3 uLamp){
        vec3 L = mix(uGround * 1.3, uSky, N.y * .5 + .5) * 1.8 + uLamp * max(dot(N, uLampDir), 0.) * .55;
        return mix(L, vec3(dot(L, vec3(.3, .5, .2))), .6); }`;
    // feather cards: aF = (feather id, 0..1 along, -1..1 across, barring; -1 = a hackle: pale margins, dark shaft streak)
    // (aTh = how far round the fan a hand feather stands: uClose swings each one back onto the leading primary, so the hand shuts like a fan)
    const uTrem = { value: 1 };
    const mkFeatherMat = () => new THREE.ShaderMaterial({
      fog: false, side: THREE.DoubleSide, uniforms: { ...LU, uTrem, uDim: { value: EG }, uClose: { value: 0 } },
      vertexShader: /* glsl */`attribute vec3 color; attribute vec4 aF; attribute float aTh; uniform float uTime, uTrem, uClose; varying vec3 vN, vW, vC; varying vec4 vF;
        void main(){ vec3 p = position, n = normal; float k = aF.y * aF.y;
          float a = aTh * uClose, c = cos(a), s = sin(a);
          p = vec3(p.x * c + p.z * s, p.y - abs(aTh) * uClose * .035, -p.x * s + p.z * c); n = vec3(n.x * c + n.z * s, n.y, -n.x * s + n.z * c);   // (closed, each feather lies a little under the one before)
          p += n * (sin(uTime * 13. + aF.x * 9.) * .009 * uTrem + sin(uTime * 2.1 + aF.x * 3.) * .03) * k * (aF.w < -.5 ? .25 : 1.);   // feathers tremble and flex toward their tips
          vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n); vC = color; vF = aF;
          gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */`uniform vec3 uSky, uGround, uLampDir, uLamp; uniform float uDim; varying vec3 vN, vW, vC; varying vec4 vF;
        ${EAGLE_LIGHT}
        void main(){ vec3 N = normalize(vN), V = normalize(cameraPosition - vW); if (dot(N, V) < 0.) N = -N;
          float x = abs(vF.z), t = vF.y, hk = step(vF.w, -.5), bw = max(vF.w, 0.);
          float shaft = (1. - smoothstep(.02, .1, x)) * smoothstep(.0, .1, t) * (1. - .6 * t);                 // the pale shaft
          float vane = (1. - .38 * x * x) * mix(.82, 1., step(0., vF.z));                                       // vanes darken to their edges; the leading vane is the darker
          float bars = 1. - bw * .3 * smoothstep(.25, .75, sin(t * 30. + vF.x * 2.3) * .5 + .5) * smoothstep(.1, .3, t) * (1. - smoothstep(.7, .9, t));
          float barb = .93 + .07 * sin(t * 90. + x * 26.);                                                     // fine barbs
          vec3 col = vC * vane * bars * barb * mix(1., 1.25, smoothstep(.75, 1., x) * (1. - bw));              // contour feathers have a pale fringe
          col += vec3(.42, .34, .24) * shaft * .16;
          vec3 hc = vC * mix(.74, 1.08, smoothstep(.05, .7, x)) * mix(.8, 1.08, smoothstep(.15, .95, t)) * (.92 + .16 * fract(vF.x * .618));       // a hackle: dark streak down the middle, pale gold margins and tip
          col = mix(col, hc, hk);
          float rim = pow(1. - max(dot(N, V), 0.), 3.);
          gl_FragColor = vec4((col * eagleLight(N, V, uSky, uGround, uLampDir, uLamp) + uSky * (.05 + .1 * bw) * rim) * uDim, 1.); }`,
    });
    const eagleMat = mkFeatherMat(), handMat = mkFeatherMat();
    // lofted body surfaces wear a coat of overlapping contour feathers drawn in the shader: aUV = (metres around, metres along, contrast 0..1; 0 = bare)
    const mkCoatMat = () => new THREE.ShaderMaterial({
      fog: false, side: THREE.DoubleSide, uniforms: { ...LU, uDim: { value: EG } },
      vertexShader: /* glsl */`attribute vec3 color; attribute vec3 aUV; attribute vec3 aT; varying vec3 vN, vW, vC, vT; varying vec3 vUV;
        void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vT = mat3(modelMatrix) * aT; vC = color; vUV = aUV;
          gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */`uniform vec3 uSky, uGround, uLampDir, uLamp; uniform float uDim; varying vec3 vN, vW, vC, vT; varying vec3 vUV;
        ${EAGLE_LIGHT}
        float h2(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
        void main(){ vec3 N = normalize(vN), V = normalize(cameraPosition - vW); if (dot(N, V) < 0.) N = -N;
          vec2 g = vUV.xy * vec2(26., 15.); float row = floor(g.y); g.x += .5 * mod(row, 2.);
          float f = fract(g.y), x = abs(fract(g.x) - .5) * 2., tip = 1. - .62 * x * x, on = step(f, tip);
          float hsh = h2(vec2(floor(g.x) + 7. * (1. - on), row + (1. - on)));
          float fringe = smoothstep(tip - .42, tip - .1, f), line = smoothstep(tip - .08, tip, f);
          float shaft = (1. - smoothstep(.03, .12, x)) * (.2 + .8 * f);
          float lum = mix(.55, (.66 + .46 * fringe) * (1. - .5 * line) + .16 * shaft, on) * (.84 + .32 * hsh);       // under a tip: the next feather's root, in shade
          N = normalize(N + normalize(vT + vec3(1e-5)) * (.5 - f) * .55 * on * vUV.z);                             // each feather is a small shingle
          vec3 col = vC * mix(1., lum, vUV.z);
          float rim = pow(1. - max(dot(N, V), 0.), 3.);
          gl_FragColor = vec4((col * eagleLight(N, V, uSky, uGround, uLampDir, uLamp) + uSky * .05 * rim) * uDim, 1.); }`,
    });
    const coatMat = mkCoatMat(), armMat = mkCoatMat();
    const FT = [0, 0.13, 0.28, 0.44, 0.58, 0.71, 0.82, 0.91, 0.965, 1];   // stations along a feather: closer toward the tip, which comes to a point
    const featherGeo = () => { const P = [], C = [], Fa = [], Th = [], I = [], col = new THREE.Color(), a = new THREE.Vector3(), b = new THREE.Vector3(), n = new THREE.Vector3(), p = new THREE.Vector3();
      return { P, C, Fa, I,
        // one feather: from base along dir, vane across `side` (the broad trailing vane lies toward +side); cols = [root, mid, tip]; notch
        // narrows the outer half (fingered primaries); notch < 0 makes a lancet (a hackle: symmetric, pointed). mir = -1 for a feather of
        // the left wing, whose side vector is the right wing's mirrored: its upper face stays up. th = its place round the fan (hands)
        add(base, dir, side, len, wid, cols, id, notch = 0, camber = 0.06, bars = 0, mir = 1, th = 0) {
          const k0 = P.length / 3, NS = FT.length - 1, lan = notch < 0; a.copy(dir).normalize(); b.copy(side).addScaledVector(a, -side.dot(a)).normalize(); n.crossVectors(b, a).normalize().multiplyScalar(mir);
          for (let i = 0; i <= NS; i++) { const t = FT[i], w = lan ? wid * (0.55 + 0.45 * sstep(0, 0.3, t)) * (1 - 0.8 * sstep(0.45, 1, t))
            : wid * (0.45 + 0.55 * sstep(0, 0.18, t)) * (1 - notch * sstep(0.36, 0.56, t)) * (1 - 0.96 * Math.pow(sstep(0.7, 1, t), 1.7));
            for (let j = -1; j <= 1; j++) { p.copy(base).addScaledVector(a, t * len).addScaledVector(b, j * w * 0.5 * (lan ? 1 : j < 0 ? 0.55 : 1.45)).addScaledVector(n, camber * len * t * t - (j === 0 ? 0 : lan ? 0.004 : 0.012));
              col.set(cols[0]).lerp(_c.set(cols[1]), sstep(0, 0.45, t)).lerp(_c.set(cols[2]), sstep(0.5, 1, t));
              P.push(p.x, p.y, p.z); C.push(col.r, col.g, col.b); Fa.push(id, t, j, bars); Th.push(th); } }
          for (let i = 0; i < NS; i++) for (let j = 0; j < 2; j++) { const q = k0 + i * 3 + j; I.push(q, q + 1, q + 3, q + 1, q + 4, q + 3); } },
        build() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(Fa, 4)); g.setAttribute('aTh', new THREE.Float32BufferAttribute(Th, 1)); g.setIndex(I); g.computeVertexNormals(); return g; } }; };
    // a lofted surface through rings [z, yc, rx, ry, colour on top, colour at the sides (optional), x centre (optional)]; arc = half angle
    // covered (PI = closed tube); flag = feather contrast (0 bare); sq < 1 squares the section (a flat crown)
    const loftGeo = (rings, sides, arc, flag = 1, sq = 1, pat = 1) => { const P = [], C = [], UV = [], Tn = [], I = [], col = new THREE.Color(); let along = 0;
      for (let i = 0; i < rings.length; i++) { const r = rings[i], q = rings[Math.max(0, i - 1)], nx = rings[Math.min(rings.length - 1, i + 1)]; if (i) along += Math.hypot(r[0] - q[0], r[1] - q[1]);
        const tz = nx[0] - q[0], ty = nx[1] - q[1], tl = Math.hypot(tz, ty) || 1;
        for (let j = 0; j <= sides; j++) { const an = (j / sides * 2 - 1) * arc, s0 = Math.sin(an), c0 = Math.cos(an), s = Math.sign(s0) * Math.pow(Math.abs(s0), sq), c = Math.sign(c0) * Math.pow(Math.abs(c0), sq), k = 0.9 + 0.1 * c0;
          P.push((r[6] || 0) + s * r[2], r[1] + c * r[3], r[0]); Tn.push(0, ty / tl, tz / tl);
          col.set(r[4]); if (r[5]) col.lerp(_c.set(r[5]), sstep(0.3, 0.85, Math.abs(s0)));
          C.push(col.r * k, col.g * k, col.b * k); UV.push(an * (r[2] + r[3]) * 0.5 * pat, along * pat, flag); } }
      for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < sides; j++) { const q = i * (sides + 1) + j; I.push(q, q + 1, q + sides + 1, q + 1, q + sides + 2, q + sides + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(UV, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(Tn, 3)); g.setIndex(I); g.computeVertexNormals(); return g; };
    const erng = rng.fork('eagle'), V3 = (x, y, z) => new THREE.Vector3(x, y, z), UPV = V3(0, 1, 0);
    const BRN = ['#221810', '#1e1610', '#120d09'], PRIM = ['#6a5640', '#4a3a2a', '#261c14'], COV = ['#46341f', '#33251a', '#1f1710'], MED = ['#4c3a26', '#5e4a30', '#77603e'], SCAP = ['#3a2b1d', '#46351f', '#6a5234'];
    const GOLD = ['#5e4728', '#9a7842', '#c9a86c'], TAW = ['#54402a', '#7e6238', '#a88a58'], CROWN = ['#3a2a1c', '#57422a', '#8a6e44'];
    const eMesh = (g, m, parent = eagle) => { const o = new THREE.Mesh(g, m); o.frustumCulled = false; o.renderOrder = 5; parent.add(o); return o; };
    // the upper wing from shoulder to wrist as ONE surface (arm space: shoulder at origin, wrist at (0,0,-1), trailing edge toward sx*X):
    // a rolled leading edge, lesser coverts, the tawny bar of the median coverts, dark greater coverts; the feathers are drawn by coatMat
    const wingGeo = (sx) => { const P = [], C = [], UV = [], Tn = [], I = [], col = new THREE.Color(), NSp = 10, vs = [-0.05, 0, 0.07, 0.16, 0.3, 0.48, 0.7, 0.92], NC = vs.length;
      for (let i = 0; i <= NSp; i++) { const t = i / NSp, z = 0.14 - 1.17 * t, chord = mix(0.98, 0.62, t) * (1 - 0.45 * sstep(0.86, 1, t));
        for (let j = 0; j < NC; j++) { const v = vs[j], vv = Math.max(0, v), y = v < 0 ? -0.07 : 0.075 * Math.sin(Math.PI * Math.pow(vv, 0.45)) - 0.05 * vv - 0.02;
          P.push(sx * (-0.11 + chord * vv + (v < 0 ? 0.03 : 0)), y, z); Tn.push(sx, 0, 0);
          col.set('#3d2d1f').lerp(_c.set('#7c6240'), sstep(0.13, 0.2, vv) * (1 - sstep(0.3, 0.4, vv)) * 0.8).lerp(_c.set('#2c2016'), sstep(0.34, 0.5, vv)).lerp(_c.set('#1e1610'), sstep(0.62, 0.8, vv));
          C.push(col.r, col.g, col.b); UV.push(t * 0.6, vv * chord * 0.42, v < 0 ? 0 : 1); } }   // (large covert feathers: the rows read from the eye)
      for (let i = 0; i < NSp; i++) for (let j = 0; j < NC - 1; j++) { const q = i * NC + j; I.push(q, q + 1, q + NC, q + 1, q + NC + 1, q + NC); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(UV, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(Tn, 3)); g.setIndex(I); g.computeVertexNormals(); return g; };
    // the hand: seven fingered primaries fanned from the carpal joint, the leading one nearly straight ahead, each next one further round
    // and twisted a little more toward the eye, with daylight between their notched outer halves; two rows of primary coverts over the roots
    const hands = [], arms = [];
    const PL = [1.42, 1.56, 1.6, 1.56, 1.47, 1.36, 1.22, 1.1, 1.0, 0.92], PTH = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1.0, 1.16, 1.32, 1.48];
    for (const sx of [1, -1]) {   // (the left wing is the right wing mirrored: positions, directions and side vectors all change the sign of x)
      const G = featherGeo(), TH0 = 0.1;
      for (let i = 0; i < 10; i++) { const th = PTH[i], tw = 0.15 + 0.05 * i;
        G.add(V3(sx * 0.03 * i, -0.008 * i, 0.035 * i), V3(sx * Math.sin(th), 0.05 + 0.012 * i, -Math.cos(th)), V3(sx * Math.cos(th), -tw, Math.sin(th)), PL[i], 0.23, PRIM, sx * 7 + i, i < 6 ? 0.42 : 0.1, 0.07, 0.7, sx, sx * (th - TH0)); }
      for (let r = 0; r < 2; r++) for (let i = 0; i < 11; i++) { const th = 0.02 + i * 0.135 + 0.05 * r;
        G.add(V3(sx * (0.03 * i - 0.06), 0.025 + 0.02 * r, 0.03 * i - 0.03 + 0.03 * r), V3(sx * Math.sin(th), 0.03 + 0.02 * r, -Math.cos(th)), V3(sx * Math.cos(th), -0.2, Math.sin(th)), (r ? 0.3 : 0.56) + erng.range(-0.04, 0.04), r ? 0.16 : 0.2, r ? SCAP : COV, sx * 20 + r * 12 + i, 0, 0.06, r ? 0 : 0.25, sx, sx * (th - TH0)); }
      hands.push(eMesh(G.build(), handMat));
      await ctx.yield();
      const arm = new THREE.Group(); eagle.add(arm); arms.push(arm);
      eMesh(loftGeo([[0.06, -0.03, 0.13, 0.08, '#2e2118'], [-0.25, -0.02, 0.12, 0.072, '#33251a'], [-0.6, -0.008, 0.1, 0.062, '#3a2b1d'], [-0.9, 0, 0.088, 0.056, '#46341f'], [-1.0, -0.004, 0.078, 0.052, '#4c3a24'], [-1.05, -0.012, 0.05, 0.036, '#4c3a24'], [-1.068, -0.02, 0.008, 0.006, '#46341f']], 12, Math.PI, 0.85), armMat, arm);
      eMesh(wingGeo(sx), armMat, arm);
      const A = featherGeo();   // secondaries: one overlapping row carrying the surface out to a scalloped trailing edge
      for (let i = 0; i < 11; i++) { const t = (i + 0.5) / 11, chord = mix(0.98, 0.62, t); A.add(V3(sx * (-0.11 + chord * 0.52), -0.012, 0.12 - 1.1 * t), V3(sx * 0.985, -0.06, 0.1), V3(0, 0.06, 1), chord * 0.56, 0.2, BRN, sx * 90 + i, 0, 0.03, 0.5, sx); }
      eMesh(A.build(), handMat, arm);
      await ctx.yield();
    }
    // the body: one loft from the nape to the root of the tail (gold at the head, umber on the back), wearing rows of feathers
    const BODY = [[-0.86, 0.03, 0.05, 0.05, '#8a6a3c'], [-0.8, 0.032, 0.075, 0.07, '#8a6a3c'], [-0.7, 0.03, 0.1, 0.085, '#84663a'], [-0.58, 0.025, 0.14, 0.105, '#74582f'], [-0.44, 0.02, 0.2, 0.13, '#5e472a'], [-0.28, 0.012, 0.27, 0.155, '#4c3a26'],
      [-0.05, 0, 0.31, 0.17, '#42311f'], [0.2, -0.008, 0.29, 0.165, '#3c2c1d'], [0.45, -0.015, 0.24, 0.145, '#38291b'], [0.7, -0.02, 0.17, 0.11, '#33251a'], [0.92, -0.025, 0.1, 0.06, '#2e2118'], [1.0, -0.03, 0.04, 0.02, '#2e2118']];
    eMesh(loftGeo(BODY, 20, Math.PI, 0.8), coatMat);
    await ctx.yield();
    const ringAt = (z) => { let k = 0; while (k < BODY.length - 2 && z > BODY[k + 1][0]) k++; const a = BODY[k], b = BODY[k + 1], t = sat((z - a[0]) / (b[0] - a[0])); return [mix(a[1], b[1], t), mix(a[2], b[2], t), mix(a[3], b[3], t)]; };
    // a row of feathers lying back along a lofted surface: n cards round the top (half angle `arc`), root at z, on ring radii (yc, rx, ry)
    const rowOn = (G, ring, z, n, arc, len, wid, cols, id, lancet, lift, bars, sq = 1) => { const [yc, rx, ry] = ring(z), [yc2, rx2, ry2] = ring(z + 0.1);
      for (let i = 0; i < n; i++) { const an = ((i + 0.5 + erng.range(-0.18, 0.18)) / n - 0.5) * 2 * arc, s = Math.sign(Math.sin(an)) * Math.pow(Math.abs(Math.sin(an)), sq), c = Math.sign(Math.cos(an)) * Math.pow(Math.abs(Math.cos(an)), sq);
        G.add(V3(s * rx * 1.02, yc + c * ry * 1.02, z + erng.range(-0.012, 0.012)), V3(s * (rx2 - rx) * 10, (yc2 - yc) * 10 + c * (ry2 - ry) * 10 + lift, 1), V3(c, -s, 0), len * erng.range(0.88, 1.12), wid, typeof cols === 'function' ? cols(Math.abs(an) / arc) : cols, id + i, lancet ? -1 : 0, lancet ? 0.012 : 0.04, bars); } };
    { const Bc = featherGeo();
      // hackles: six rows of lanceolate feathers, each overlapping the next: gold at the nape, tawny toward the shoulders
      [[-0.84, 9, 0.11, 0.032, GOLD], [-0.78, 10, 0.13, 0.038, GOLD], [-0.71, 11, 0.15, 0.046, GOLD], [-0.63, 12, 0.17, 0.056, TAW], [-0.54, 13, 0.19, 0.068, TAW], [-0.44, 14, 0.2, 0.082, MED]].forEach(([z, n, len, wid, cols], r) => rowOn(Bc, ringAt, z, n, 1.3 + 0.05 * r, len, wid, cols, 300 + r * 20, true, 0.02, -1));
      await ctx.yield();
      [-0.33, -0.19, -0.03, 0.15].forEach((z, r) => rowOn(Bc, ringAt, z, 11 + Math.min(2, r), 1.3, 0.25, 0.14, r ? SCAP : MED, 500 + r * 14, false, -0.02, 0.3));   // mantle and scapulars: the broad dark shoulders
      [0.34, 0.52, 0.7].forEach((z, r) => rowOn(Bc, ringAt, z, 9 - r, 1.25, 0.26, 0.13, r ? BRN : SCAP, 560 + r * 14, false, -0.02, 0.3));                              // rump and upper tail coverts
      await ctx.yield();
      eMesh(Bc.build(), eagleMat); }
    await ctx.yield();
    // the tail: twelve broad dark feathers fanned from its root (uClose < 0 spreads the fan, > 0 shuts it)
    const tailMat = mkFeatherMat();
    { const Tg = featherGeo(), TAIL = ['#3c2e22', '#2c2118', '#17110c'];
      for (let i = 0; i < 12; i++) { const ph = ((i + 0.5) / 12 - 0.5) * 0.9, sg = ph < 0 ? -1 : 1;
        Tg.add(V3(Math.sin(ph) * 0.09, -0.012 * Math.abs(i - 5.5), 0.02 * Math.cos(ph)), V3(Math.sin(ph), -0.02, Math.cos(ph)), V3(sg * Math.cos(ph), -0.1, -sg * Math.sin(ph)), 1.02 - 0.12 * Math.abs(ph), 0.2, TAIL, 600 + i, 0, 0.03, 0.55, -sg, -ph); }
      const tail = eMesh(Tg.build(), tailMat); tail.position.set(0, -0.035, 0.84); }
    await ctx.yield();
    // the head turns on the nape (headPivot): a flat crown, umber down the middle, pale brow ridges that make its front wide, gold
    // hackles lying back over the nape, a yellow cere and a black hook that show past the skull whenever it turns
    const headPivot = new THREE.Group(); headPivot.position.set(0, 0.05, -0.84); headPivot.scale.setScalar(1.45); eagle.add(headPivot);
    { const SK = [[-0.172, -0.03, 0.026, 0.024, '#33261a', '#4a3a26'], [-0.15, -0.016, 0.047, 0.035, '#3a2b1d', '#6a5434'], [-0.118, -0.004, 0.064, 0.043, '#46341f', '#a08250'], [-0.07, 0.003, 0.068, 0.049, '#4a3826', '#a48652'], [-0.02, 0.002, 0.067, 0.052, '#5a452c', '#a88a54'], [0.025, -0.006, 0.066, 0.053, '#7a6038', '#a88a54'], [0.07, -0.02, 0.07, 0.056, '#8c6c3c', '#9a7c48']];
      eMesh(loftGeo(SK, 18, Math.PI, 0.45, 0.72, 1.6), coatMat, headPivot);
      await ctx.yield();
      for (const sx of [-1, 1]) eMesh(loftGeo([[-0.168, -0.004, 0.006, 0.004, '#8a6e44', null, sx * 0.03], [-0.14, 0.012, 0.02, 0.011, '#c4aa78', null, sx * 0.046], [-0.1, 0.018, 0.022, 0.012, '#c8ae7c', null, sx * 0.05], [-0.06, 0.014, 0.016, 0.008, '#a88a54', null, sx * 0.048], [-0.035, 0.008, 0.004, 0.003, '#8a6e44', null, sx * 0.044]], 8, Math.PI, 0), coatMat, headPivot);   // brow ridges
      // the bill: yellow cere, then the black hook curving down past the tip (bare, not feathered)
      eMesh(loftGeo([[-0.165, -0.03, 0.027, 0.024, '#d2a01c'], [-0.2, -0.031, 0.025, 0.023, '#d8a61e'], [-0.218, -0.033, 0.022, 0.021, '#4a3c1c'], [-0.25, -0.04, 0.017, 0.018, '#15120f'], [-0.274, -0.055, 0.011, 0.013, '#0c0b0a'], [-0.284, -0.078, 0.005, 0.007, '#0c0b0a'], [-0.279, -0.096, 0.001, 0.001, '#0c0b0a']], 9, Math.PI, 0), coatMat, headPivot);
      await ctx.yield();
      const Hc = featherGeo(), skAt = (z) => { let k = 0; while (k < SK.length - 2 && z > SK[k + 1][0]) k++; const a = SK[k], b = SK[k + 1], t = sat((z - a[0]) / (b[0] - a[0])); return [mix(a[1], b[1], t), mix(a[2], b[2], t), mix(a[3], b[3], t)]; };
      [[0.0, 10, 0.1, 0.034], [0.045, 11, 0.115, 0.038]].forEach(([z, n, len, wid], r) => rowOn(Hc, skAt, z, n, 1.3, len, wid, r ? GOLD : (k) => (k < 0.4 ? CROWN : GOLD), 200 + r * 12, true, 0.015, -1, 0.72));   // the nape only: the crown stays flat and dark
      eMesh(Hc.build(), eagleMat, headPivot); }
    const NEGZ = new THREE.Vector3(0, 0, -1), XAX = new THREE.Vector3(1, 0, 0), qPath = new THREE.Quaternion(), qAdj = new THREE.Quaternion(), mLook = new THREE.Matrix4(), eT = new THREE.Vector3(), eT2 = new THREE.Vector3(), eO = new THREE.Vector3(), wristV = new THREE.Vector3(), shV = new THREE.Vector3();
    const camP = new THREE.Vector3(), camQ = new THREE.Quaternion(), camS = new THREE.Vector3();
    const bump = (u, a, b, c, d) => sstep(a, b, u) * (1 - sstep(c, d, u));
    const wOpen = new THREE.Vector3(), wShut = new THREE.Vector3(), qRoll = new THREE.Quaternion(), ZAX = new THREE.Vector3(0, 0, 1), eE = new THREE.Euler(), S_E = 0.8;
    eagle.scale.setScalar(S_E);
    const poseEagle = (time, u, camera) => {
      eagle.visible = u > 0; if (!eagle.visible) return;      // (seen through the previous portal u is exactly 0: no bird in that picture)
      const pres = sstep(0, 0.012, u);
      camera.matrixWorld.decompose(camP, camQ, camS);
      path.tangentAt(u, eT); path.tangentAt(Math.min(1, u + 0.03), eT2);
      // the bird flies the path while the eye may rest elsewhere: where the path points, seen from the camera
      eO.copy(eT).applyQuaternion(qAdj.copy(camQ).invert());
      const relYaw = Math.max(-0.5, Math.min(0.5, Math.atan2(eO.x, -eO.z))), relDown = sat(-Math.asin(Math.max(-1, Math.min(1, eO.y))) / 0.7);
      const pe = camera.projectionMatrix.elements, tanV = 1 / pe[5], tanH = 1 / pe[0];
      // the stoops shut the wings (fold follows the dive angle); as the pull-out flattens they are thrown open again and brake (flare)
      const pitch = Math.asin(Math.max(-1, Math.min(1, -eT.y))), fold = 0.35 * sstep(0.42, 0.85, pitch), flare = 0.3 * bump(u, 0.775, 0.8, 0.83, 0.9) * (1 - fold), turn = Math.max(-0.35, Math.min(0.35, eT.z * eT2.x - eT.x * eT2.z));
      // whatever the frame's shape, the whole bird sits in its bottom fifth, wingtips well inside the picture: a narrow frame sets it further off
      const D = Math.max(6.6, 2.5 * S_E / (0.4 * tanH)), yc = -(0.725 - 0.035 * fold) * tanV * D;
      eagle.position.set(0.22 * Math.sin(time * 0.37) + 0.5 * relYaw, yc + 0.06 * Math.sin(time * 0.9) - (1 - pres) * 3.4, -D).applyQuaternion(camQ).add(camP);
      eagle.quaternion.copy(camQ).multiply(qAdj.setFromEuler(eE.set(-0.1 + 0.46 * relDown, -0.6 * relYaw, turn * 1.1 + 0.04 * Math.sin(time * 0.53), 'YXZ')));
      uTrem.value = 1 + 2.5 * fold + 1.5 * flare;
      // a slow wingbeat on the lift and on the run-in (deep, about 0.4 Hz), a soar between; the down-stroke leads, the fingers lag and flex
      const beat = (1 - fold) * (1 - 0.7 * flare) * (0.3 + 0.7 * (1 - bump(u, 0.11, 0.14, 0.5, 0.53)) * (1 - 0.6 * sstep(0.86, 0.95, u))), ph = time * 2.5, st = Math.sin(ph), lag = Math.sin(ph - 0.9);
      const hf = sstep(0, 0.6, fold);
      handMat.uniforms.uClose.value = 0.86 * hf - 0.14 * flare; handMat.uniforms.uDim.value = EG * (1 - 0.1 * fold); armMat.uniforms.uDim.value = EG * (1 - 0.1 * fold);
      tailMat.uniforms.uClose.value = 0.55 * fold - 0.75 * flare - 0.12 * Math.abs(turn) * 3;
      hands.forEach((hand, k) => { const sx = k ? -1 : 1, arm = arms[k];
        // open: the hand lies out along the wing, its fingers fanned from a little ahead of square to well behind it. Stoop: the wrists
        // are drawn in to the shoulders and the hands, shut like fans, swing right back to lie along the flanks, tips over the tail: the
        // bird becomes one dark teardrop. Flare: wrists up and forward, fingers spread and flexed
        wOpen.set(sx * (1.1 + 0.04 * flare), 0.06 + 0.2 * beat * st + 0.16 * flare, -0.5 - 0.12 * flare); wShut.set(sx * 0.5, 0.05, -0.4);
        wristV.lerpVectors(wOpen, wShut, fold); hand.position.copy(wristV);
        hand.rotation.set(0.12 * beat * lag + 0.2 * flare - 0.05 * hf, -sx * mix(1.3 - 0.18 * flare, 2.98, hf), sx * (0.1 * beat * lag + 0.14 * flare), 'YXZ');
        shV.set(sx * 0.26, 0.02, -0.3); arm.position.copy(shV); arm.quaternion.setFromUnitVectors(NEGZ, eO.copy(wristV).sub(shV).normalize()).multiply(qRoll.setFromAxisAngle(ZAX, -sx * 0.2 * fold));
        arm.scale.set(mix(1, 0.7, fold), 1, shV.distanceTo(wristV)); });
      // the head looks where the story is: right to the bull on his pedestal, left to the horn and the falling tower, left again to the
      // cloud in the long stoop and to the chamois; it turns into banks and never quite keeps still
      const yaw = -0.5 * bump(u, 0.072, 0.09, 0.11, 0.128) + 0.5 * bump(u, 0.136, 0.17, 0.24, 0.3) + 0.45 * bump(u, 0.55, 0.6, 0.74, 0.8) + 0.4 * bump(u, 0.83, 0.85, 0.89, 0.92);
      headPivot.rotation.set(0.08 * fold - 0.06 * Math.abs(yaw), yaw - turn * 1.6 + 0.12 * Math.sin(time * 0.31) * sstep(0.2, 0.9, Math.sin(time * 0.13 + 2)), turn * 0.6 - yaw * 0.12, 'YXZ');
    };
    await ctx.yield();

    // ---------- flora: gold larches and a few arolla pines on the rock bar, straw sedge by the path ----------
    const frng = rng.fork('flora'), wind = flora.makeWind({ direction: [0.75, -0.66], strength: 1.25, gustiness: 0.7 });
    const fmatOptions = { wind, backlight: 0.6, backlightTint: '#ffd884', ambient: 2.0, leafAmbient: winter ? 1.7 : 2.3 };
    await flora.prepareLeafTexture(fmatOptions, ctx.yield);
    const fmat = flora.windMaterial(fmatOptions);
    await ctx.yield();
    const larchPal = winter ? { leaf: '#6e5236', leafLight: '#93714a', leafDark: '#3a2a1c', snow: 0.75 } : lookId === 'moon' ? { leaf: '#9a8446', leafLight: '#c2ad6c', leafDark: '#5c4a22', snow: 0 } : { leaf: '#eaa726', leafLight: '#ffd45e', leafDark: '#a2600f', snow: 0 };
    const larch = (h, d) => flora.coniferGeometry({ rng: frng, height: h, detail: d, slim: 1.12, droop: 0.72, bark: '#5c4a3c', barkDark: '#34281f', ...larchPal });
    const arolla = (h, d) => flora.coniferGeometry({ rng: frng, height: h, detail: d, slim: 1.05, droop: 0.9, leaf: '#1f3d2c', leafLight: '#4c6e4e', leafDark: '#0e2018', snow: winter ? 0.8 : 0.1 });
    const larchDensity = (x, z) => { colourInfo(x, z, groundAt(x, z), info); const a = (x - END[0]) * AX[0] + (z - END[2]) * AX[1]; return Math.max(info.bar * 1.3, sstep(-90, -20, a) * (1 - info.glacier) * (1 - sstep(140, 260, a))); };
    const trees = [], farTrees = [];   // near shapes first, then the far ones, in the order the scatter is given them
    for (const d of [2, 1]) for (const [kind, h] of [[larch, 15], [larch, 11.5], [larch, 13], [arolla, 10]]) { (d === 2 ? trees : farTrees).push(kind(h, d)); await ctx.yield(); }
    const forest = flora.makeScatter({ rng: frng, path, heightAt: groundAt, material: fmat, variants: trees, farVariants: farTrees, farDistance: 15,
      count: Math.round(136 * Math.min(1.15, dens) * (0.6 + 0.4 * detail)), radius: 190, corridor: 9.5, uRange: [0.8, 1], spacing: 3.1, scale: [0.75, 1.15], density: larchDensity, falloff: 0.25, groundShadow: { sunDir: lampDir, strength: 0.42 } });
    scene.add(forest.object);
    await ctx.yield();
    const grass = await flora.makeGrassAsync({ rng: frng, path, heightAt: groundAt, wind, map: fmat.map, count: Math.round(2600 * detail), radius: 24, bias: 2.0, chunks: 5, fade: [55, 85], flowers: 0, height: [0.3, 0.7], width: [0.7, 1.3],
      root: '#7a6a3e', tip: '#dcc072', dry: '#a8743a', dryAmount: 0.15,
      density: (x, z, lat, u) => { if ((u > 0.19 && u < 0.3) || (u > 0.51 && u < 0.8)) return 0; const y = groundAt(x, z); colourInfo(x, z, y, info); return (1 - info.glacier) * sstep(0.75, 0.95, 1 - snowAt(x, z, y, 0.9)) * (u > 0.8 ? 0.5 : 1) * (0.3 + 0.7 * sstep(-0.3, 0.4, noise.n2(x * 0.08, z * 0.08))); } }, ctx.yield);
    scene.add(grass.object);
    await ctx.yield();

    // ---------- ground cover close to the path: straw sedge tussocks standing out of the snow, rust-red bilberry mats on the rock ----------
    let coverMat;
    {
      const grng = rng.fork('cover'), col = new THREE.Color(), tP = [], tC = [], tK = [], tI = [];
      for (let bl = 0; bl < 9; bl++) {   // a tussock: nine blades arching out of one root
        const an = (bl / 9) * 6.283 + grng.range(-0.3, 0.3), lean = grng.range(0.25, 0.95), len = grng.range(0.5, 0.9), dx = Math.cos(an), dz = Math.sin(an), k0 = tP.length / 3;
        for (let i = 0; i <= 2; i++) { const t = i / 2, r = 0.05 + lean * len * t * (0.5 + 0.5 * t), y = len * t * (1 - 0.3 * lean * t), w = 0.055 * (1 - t);
          col.set('#5a4c2e').lerp(_c.set(bl % 3 ? '#c4a862' : '#dcc690'), t);
          if (i < 2) { tP.push(dx * r - dz * w, y, dz * r + dx * w, dx * r + dz * w, y, dz * r - dx * w); tC.push(col.r, col.g, col.b, col.r, col.g, col.b); tK.push(t * t, t * t); }
          else { tP.push(dx * r, y, dz * r); tC.push(col.r, col.g, col.b); tK.push(1); } }
        tI.push(k0, k0 + 1, k0 + 2, k0 + 1, k0 + 3, k0 + 2, k0 + 2, k0 + 3, k0 + 4); }
      const mP = [0, 0.2, 0], mC = [], mK = [0], mI = [];                                    // a mat: a low cushion with a ragged rim
      col.set(winter ? '#4a3630' : '#5e3022'); mC.push(col.r, col.g, col.b);
      for (let rg = 0; rg < 2; rg++) for (let i = 0; i < 8; i++) { const an = (i / 8) * 6.283 + rg * 0.39, r = (rg ? 1 : 0.55) * grng.range(0.8, 1.2); mP.push(Math.cos(an) * r, rg ? -0.04 : 0.16 * grng.range(0.7, 1.2), Math.sin(an) * r);
        col.set(winter ? '#4a3630' : ['#56281c', '#6a3a22', '#44241a', '#54402a'][(i + rg) % 4]); mC.push(col.r, col.g, col.b); mK.push(0); }
      for (let i = 0; i < 8; i++) { const a = 1 + i, b = 1 + (i + 1) % 8, c = 9 + i, d = 9 + (i + 1) % 8; mI.push(0, b, a, a, b, c, b, d, c); }
      const geo = (P, C, K, I) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 1)); g.setIndex(I); return g; };
      coverMat = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...LU, uGust: { value: 1 } },
        vertexShader: /* glsl */`attribute vec3 color; attribute float aK; uniform float uTime, uGust; varying vec3 vC, vW;
          #include <fog_pars_vertex>
          void main(){ vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); float ph = wp.x * .35 + wp.z * .27;
            wp.xz += vec2(.75, -.66) * (sin(uTime * 2.3 + ph) * .07 + sin(uTime * 5.3 + ph * 2.3) * .03 + .05) * aK * uGust;       // the wind lays the blades over and shakes them
            vW = wp.xyz; vC = color * (.8 + .4 * fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453));
            vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform vec3 uSky, uGround, uLamp; varying vec3 vC, vW;
          #include <fog_pars_fragment>
          ${HORN_NOISE_GLSL}
          void main(){ vec3 col = vC * (.72 + .5 * vn(vW * 3.1)) * (uSky * .8 + uGround * .35 + uLamp * .4);
            gl_FragColor = vec4(col, 1.);
            #include <fog_fragment>
          }` });
      const nT = Math.round(520 * detail), nM = 1, tuss = new THREE.InstancedMesh(geo(tP, tC, tK, tI), coverMat, nT), mats = new THREE.InstancedMesh(geo(mP, mC, mK, mI), coverMat, nM);
      const P = new THREE.Vector3(), Tn = new THREE.Vector3(), Nn = new THREE.Vector3(), q0 = new THREE.Quaternion();
      let kT = 0, kM = 0;
      for (let tries = 0; tries < 9000 && (kT < nT || kM < nM); tries++) {
        const pk = grng(), u = pk < 0.45 ? grng.range(0.0, 0.185) : pk < 0.7 ? grng.range(0.31, 0.5) : grng.range(0.82, 0.995), r = grng(), lat = (grng() < 0.5 ? -1 : 1) * (3.5 + 24 * r * r);
        path.pointAt(u, P); path.tangentAt(u, Tn); const hl = Math.hypot(Tn.x, Tn.z) || 1, x = P.x - (Tn.z / hl) * lat, z = P.z + (Tn.x / hl) * lat, gy = groundAt(x, z), sc = grng.range(0.75, 1.6), yaw = grng.range(0, 6.28), isMat = false;
        if ((tries & 127) === 127) await ctx.yield();
        if (P.y - gy < 3 || P.y - gy > 42 || Math.hypot(x - TARN.x, z - TARN.z) < TARN.r + 2) continue;
        terrain.surfaceNormalAt(x, z, Nn); baseHeight(x, z, info); if (info.glacier > 0.3) continue;
        if (isMat) { if (kM >= nM || Nn.y < 0.45 || snowAt(x, z, gy, Nn.y) > 0.25) continue; qR.setFromUnitVectors(UPV, Nn).multiply(q0.setFromAxisAngle(UPV, yaw)); mR.compose(pR.set(x, gy + 0.02, z), qR, sR.set(sc * 0.72, sc * 0.6, sc * 0.72)); mats.setMatrixAt(kM++, mR); }
        else { if (kT >= nT || Nn.y < 0.6) continue; qR.setFromAxisAngle(UPV, yaw); mR.compose(pR.set(x, gy - 0.04, z), qR, sR.setScalar(sc)); tuss.setMatrixAt(kT++, mR); }
      }
      sR.set(1, 1, 1); tuss.count = kT; mats.count = kM; tuss.frustumCulled = mats.frustumCulled = false; scene.add(tuss, mats);
    }
    await ctx.yield();

    // ---------- birds: alpine choughs on the ridge lift, one bearded vulture (or a raven pair) across the face ----------
    const DUR = 44;
    const fauna = F.makeFauna(scene, { light: { sunDir: lampDir, sunColor: L.bounce, sunIntensity: L.bounceI * 0.6, sky: L.hemiSky, skyIntensity: L.hemiI * 0.45, ground: L.hemiGround, groundIntensity: L.hemiI * 0.45 } });
    const CH = { species: 'crows', body: '#0d0d12', belly: '#0d0d12', wingC: '#09090c', tip: '#050507', beak: '#f0bd28', legC: '#d8452a', head: '#0d0d12', tailC: '#08080b', size: 1.55, rim: 0.6 };
    const nCh = Math.max(40, Math.min(80, Math.round(60 * dens))), brng = rng.fork('birds');
    fauna.add(F.makeFlock({ rng: brng, ...CH, count: Math.round(nCh * 0.3), center: [-20, 462, -4], radius: 38, height: 9, spread: [24, 9, 24], wander: [5, 3, 5, 0.5], speed: 9 }));       // tumbling over the gap
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: brng, ...CH, count: 7, spread: [5, 2.5, 10], along: { path, side: -5.5, up: 1.2, lead: 11, from: -0.02, to: 0.128, drift: 4 } }));                                // beside us on the lift
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: brng, ...CH, count: 6, spread: [5, 2.5, 9], along: { path, side: 6, up: -0.5, lead: 16, from: -0.02, to: 0.22, drift: 5 } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: brng, ...CH, count: 6, spread: [6, 3, 10], along: { path, side: -8, up: 2.5, lead: 24, from: 0.31, to: 0.5, drift: 5 } }));       // with us across the bench
    await ctx.yield();
    // overtaken in the stoop: three small parties diving at half our speed; each is 6 m off, in the middle of the picture, as we catch it
    // (an escort route driven by a slowed u: u0 is where we draw level)
    const overtaken = [];
    for (const [u0, n, lead, side, up] of [[0.585, 5, 10.5, -2.88, 5.3], [0.65, 6, 19, -3.65, 13.2], [0.715, 5, 13, -1.42, 8.0]]) {
      const f = F.makeFlock({ rng: brng, ...CH, count: n, size: 0.95, spread: [3.4, 1.3, 0.6], wander: [0.2, 0.2, 0.2, 0.7], speed: 24, light: fauna.light, along: { path, side, up, lead, from: u0 - 0.07, to: u0 + 0.07, drift: 1.5 } });
      scene.add(f.object); overtaken.push({ f, u0 }); await ctx.yield(); }
    fauna.add(F.makeFlock({ rng: brng, ...CH, count: Math.round(nCh * 0.14), spread: [4, 3, 12], along: { path, side: 0.5, up: 2.2, lead: 24, from: 0.84, to: 1.12, drift: 3 } }));                 // funnelling through the notch
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: brng, ...CH, count: Math.round(nCh * 0.2), center: [END[0] - 8, END[1] + 24, END[2] - 10], radius: 26, height: 8, spread: [16, 7, 16], speed: 9 }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: brng, ...CH, count: 8, center: [TARN.x + 8, TARN.y + 13, TARN.z - 8], radius: 30, height: 5, spread: [16, 5, 16], wander: [5, 3, 5, 0.5], speed: 10 }));   // wheeling over the tarn
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: brng, ...CH, count: 8, size: 2.2, spread: [12, 5, 6], wander: [3, 2, 3, 0.6], speed: 9, along: { path, side: -9.5, up: 8.5, lead: 26, from: 0.157, to: 0.3, drift: 2 } }));     // wheeling ahead of the crest, on the line of the gaze as the stoop begins
    await ctx.yield();
    if (ravens) fauna.add(F.makeFlock({ rng: brng, ...CH, beak: '#141414', legC: '#141414', count: 2, size: 3.4, spacing: 3, form: 'line', glide: 0.6, speed: 12, cross: { path, u: 0.157, lead: 23, angle: 72, side: -1, height: 0.5, span: 230, offset: -7, duration: DUR } }));
    else fauna.add(F.makeFlock({ rng: brng, species: 'eagles', count: 1, form: 'loose', spread: [0, 0, 0], wander: [0.6, 0.4, 0.6, 0.2], size: 4.3, glide: 1, amp: 0.12, speed: 11, body: '#3b3029', belly: '#c98c4c', wingC: '#2b2622', head: '#e9d9b6', tailC: '#241f1c', rim: 0.6,
      cross: { path, u: 0.157, lead: 23, angle: 72, side: -1, height: 0.5, span: 240, offset: -7, duration: DUR } }));
    await ctx.yield();

    // ---------- air: spindrift off every crest, blown snow, falling needles, the powder that overtakes us ----------
    const fxs = fx.fxGroup(); scene.add(fxs.object);
    const tU = LU.uTime, WV = [7.5, 0.2, -6.6];
    fxs.add(fx.makeParticles({ rng: rng.fork('snow'), preset: 'snow', time: tU, count: Math.round(1500 * detail), box: [70, 44, 70], velocity: [WV[0], -0.6, WV[2]], velocityRandom: [2, 0.6, 2], turbulence: [1.6, 0.6, 0.4], size: [0.03, 0.09], colors: ['#c9d8f4', '#e9eefa', '#ffd9d2'], opacity: 0.75 }));
    await ctx.yield();
    const needles = fxs.add(fx.makeParticles({ rng: rng.fork('needles'), preset: 'leaves', time: tU, count: Math.round((winter ? 120 : 620) * detail), follow: false, center: [END[0] - 40, END[1] + 6, END[2] - 40], box: [200, 46, 200], velocity: [2.6, -1.6, -2.2],
      size: [0.07, 0.16], colors: ['#f0b030', '#ffd060', '#c8841c'], opacity: 0.95 }));
    await ctx.yield();
    const powder = fxs.add(fx.makeParticles({ rng: rng.fork('powder'), preset: 'snow', time: tU, count: Math.round(2200 * detail), box: [56, 34, 56], velocity: [AX[0] * 46, -0.5, AX[1] * 46], velocityRandom: [5, 2, 5], turbulence: [3, 1.5, 0.7], mode: 'streak', stretch: 0.03, size: [0.05, 0.16],
      colors: ['#dfe6f6', '#ffd6d0', '#b9c8ea'], opacity: 0.85 }));
    powder.setOpacity(0);
    await ctx.yield();
    {   // spindrift plumes: soft ribbons streaming downwind from gendarme tops, crest and towers
      const pos = [], uv = [], sd = [], dr = [], gw = [], idx = [], srng = rng.fork('spin'), wdir = new THREE.Vector3(WV[0], 1.2, WV[2]).normalize();
      const upV = new THREE.Vector3(0, 1, 0), alongV = new THREE.Vector3(RD[0], 0, RD[1]);
      const plume = (x, y, z, len, hgt, dir = wdir, side = upV, gnd = 0) => { const b = pos.length / 3, NS = 8, s0 = srng() * 10 + (dir === wdir ? gnd : 100);   // (+100 marks a slough: fainter; +20 snow smoking off the ground)
        for (let i = 0; i <= NS; i++) { const t = i / NS, w = hgt * (0.25 + 0.75 * t); for (const v of [0, 1]) { const o = (v - 0.35) * w; const bow = dir === wdir ? len * 0.14 * t * t : 0; pos.push(x + dir.x * len * t + side.x * o, y + dir.y * len * t + side.y * o + bow, z + dir.z * len * t + side.z * o); uv.push(t, v); sd.push(s0); dr.push(dir.x, dir.y, dir.z); gw.push(w, len * t); } if (i < NS) { const k = b + i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } } };
      for (const tp of tops) plume(tp[0], tp[1] - 0.6, tp[2], srng.range(30, 58), srng.range(7, 12.5));
      for (let s = 110; s < 450; s += srng.range(16, 30)) { const [x, z] = crestXZ(s, srng() < 0.6 ? 121 : srng.range(50, 112)); plume(x, groundAt(x, z) + 0.4, z, srng.range(16, 30), srng.range(3, 6.5), wdir, upV, 20); }   // snow smoking off the bench and its lip
      // sloughs: snow pouring down the two walls of the stoop (down the fall line, a metre off the rock)
      for (const [n0, n1, k, sA, sB] of [[136, 146, 5, 190, 400], [152, 205, 2.2, 200, 390]]) { const fall = new THREE.Vector3(RN[0] / k, -1, RN[1] / k).normalize();
        for (let s = sA; s < sB; s += srng.range(48, 84)) { const [x, z] = crestXZ(s, srng.range(n0, n1)); plume(x + RN[0] * 1.2, groundAt(x, z) + 0.6, z + RN[1] * 1.2, srng.range(40, 70), srng.range(3.2, 6), fall, alongV); } }
      for (let s = -240; s < 520; s += srng.range(13, 24)) { const [x, z] = crestXZ(s, srng.range(-1, 1)); plume(x, groundAt(x, z) + 0.3, z, srng.range(14, 28), srng.range(3, 6) * 1.25, wdir, upV, 20); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aS', new THREE.Float32BufferAttribute(sd, 1)); g.setAttribute('aDir', new THREE.Float32BufferAttribute(dr, 3)); g.setAttribute('aG', new THREE.Float32BufferAttribute(gw, 2)); g.setIndex(idx);
      const m = new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        uniforms: { ...fogU(), uTime: tU, uSky: LU.uSky, uLamp: LU.uLamp },
        // each streamer is a torn thread inside its ribbon: it leaves the rock as a line, wanders and widens downwind and breaks into
        // fibres. Far off, the ribbon is drawn larger (so a streamer holds 2 to 3% of the picture's height and never thins to a wire);
        // it fades when near (never a white patch over the view) and when seen along its own length (never a blob)
        vertexShader: /* glsl */`attribute float aS; attribute vec3 aDir; attribute vec2 aG; uniform float uTime; varying vec2 vUv; varying float vS, vNear, vFar;
          #include <fog_pars_vertex>
          void main(){ vUv = uv; vS = aS; vec3 p = position; float dist = distance(cameraPosition, position), pl = 1. - step(15., aS), gnd = step(15., aS) * (1. - step(50., aS));
            p.y += (uv.y - .35) * aG.x * (clamp(dist / 125., .7, 1.) + 2.6 * smoothstep(130., 320., dist) - 1.) * pl; p += aDir * aG.y * (clamp(dist / 200., 1., 1.8) - 1.) * pl;
            p.y += sin(uv.x * 5. - uTime * 2.2 + aS) * 1.6 * uv.x;
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
            vec3 toCam = normalize(cameraPosition - p);
            vNear = smoothstep(22., 95., dist) * smoothstep(.22, .62, length(cross(toCam, aDir)));
            vFar = mix(1., .75, smoothstep(260., 700., dist)) * (1. - gnd * smoothstep(100., 240., dist));   // (the smoke off the crest shows only close by: seen along the crest it would pile into a patch)
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform float uTime; uniform vec3 uSky, uLamp; varying vec2 vUv; varying float vS, vNear, vFar;
          #include <fog_pars_fragment>
          ${HORN_NOISE_GLSL}
          void main(){ float s = vUv.x, v = vUv.y * 2. - 1., slough = step(50., vS);
            float wander = fb(vec3(s * 3.2 - uTime * 1.3, vS, uTime * .15)) - .5, fib = fb(vec3(s * 8. - uTime * 2.4, vUv.y * 5., vS * 3.1));   // torn into fibres along the wind
            float w = mix(.4, .8, s), d = abs(v + .3 - wander * 1.1 * s) / w;
            float a = (1. - smoothstep(.15, 1., d)) * (1. - smoothstep(.8, 1., abs(v))) * smoothstep(0., .05, s) * (1. - smoothstep(.4, .96, s)) * smoothstep(.38, .66, fib + .26 * (1. - s)) * mix(.5, .4, slough) * vNear * vFar;
            vec3 col = vec3(.84, .89, 1.) * (uSky * 1.4 + uLamp * .65 * (1. - .8 * slough));
            col /= 1. + max(max(col.r, max(col.g, col.b)) - .66, 0.) * 1.5;
            #ifdef USE_FOG
            col = mix(col, fogColor, (1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth)) * .6);
            #endif
            gl_FragColor = vec4(col * a, a); }` });
      const sp = new THREE.Mesh(g, m); sp.renderOrder = 2; sp.frustumCulled = false; scene.add(sp);
    }
    await ctx.yield();
    // a cloud sea (one of the weathers): a level deck that floods the trough wall to wall from just under the rock bar, so the spurs,
    // the two towers and the larch tops stand out of it dark. It lies below the shadow line: blue-lavender, lit only from above by the
    // rose wall, so its own colours are given (the sky's sunset colours would turn it orange); the rose is a rim on its crests
    const sea = weather === 'sea' ? makeCloudField({ rng, mode: 'sea', altitude: -76, relief: 17, towers: 0, spacing: 96, opacity: 0.94, silver: 0.7, hazeColor: L.fog,
      sunDirection: [lampDir.x, lampDir.y, lampDir.z], sunColor: [cB.r * 0.5, cB.g * 0.5, cB.b * 0.5], litColor: L.sea[0], shadeColor: L.sea[1], bottomColor: L.sea[2] }) : null;
    if (sea) scene.add(sea.object);
    await ctx.yield();

    // ---------- gaze, post, frame loop ----------
    const fogBase = fogColor.clone(), fogDust = new THREE.Color(L.moon ? '#5a6890' : '#b79ab8');
    const tarnMat = scene.userData.tarnMat; delete scene.userData.tarnMat;
    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: DUR, ride: 'none', companion: 'none',
      // the brief's speeds: slow on the lift and slowest hanging over the crest, the first stoop quick, a long look from the bench,
      // the long stoop fast, easing through the pull-out to the notch
      pace: (u) => 0.6 - 0.18 * sstep(0.09, 0.13, u) + 0.68 * sstep(0.185, 0.25, u) - 0.4 * sstep(0.3, 0.36, u) + 0.95 * sstep(0.49, 0.57, u) - 0.45 * sstep(0.74, 0.82, u) - 0.2 * sstep(0.84, 0.9, u),
      camera: { fov: 62, near: 0.3, far: 5700, lookAhead: 36, sway: 0.8, bank: 1 },
      pois: [
        { at: gazeAt, from: 0.03, to: 0.93, weight: GW, fade: 0.05 },
      ],
      portal: { shape: 'circle', radius: 7, color: L.portal, glow: 1, revealDistance: 300 },
      post: { exposure: L.exposure, bloom: { strength: 0.38, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 1.1, contrast: 1.0, tint: L.tint, shadowTint: L.shadowTint, vignette: 0.2, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        LU.uTime.value = time;
        hero.setU(u); hero.update(dt, time, camera);
        sky.update(dt, time, camera); terrain.update(dt, time); boulders.update(dt, time);
        const blast = sstep(0.87, 0.97, u); cirrus.material.uniforms.uTime.value = time;
        wind.set({ strength: 1.25 + 1.9 * blast }); coverMat.uniforms.uGust.value = 1 + 2.2 * blast; iceMat.uniforms.uSnake.value = 0.75 + 0.25 * sstep(0.72, 0.84, u);
        forest.update(dt, time, camera); grass.update(dt, time, camera);
        fauna.update(dt, time, camera, u);
        for (const o of overtaken) { o.f.object.visible = Math.abs(u - o.u0) < 0.12; if (o.f.object.visible) o.f.update(dt, time, camera, o.u0 + (u - o.u0) * 0.5); }
        poseAnimals(time, u); poseEagle(time, u, camera);
        tarnMat.uniforms.uShiver.value = sstep(0.3, 0.36, u);
        powder.setOpacity(Math.max(blast * (rare ? 1 : 0.75), 0.34 * bump(u, 0.185, 0.215, 0.31, 0.335), 0.3 * bump(u, 0.52, 0.56, 0.76, 0.8))); needles.setOpacity(0.55 + 0.45 * blast);
        // the dust that overtakes us on the moraine (on the rare evening the whole cirque runs and it becomes a haze)
        const haze = rare ? sstep(0.82, 0.97, u) : 0.25 * blast;
        scene.fog.density = L.fogD * (1 + (rare ? 9 + 11 * sstep(0.88, 0.97, u) : 5) * haze); rangeMat.uniforms.uVeil.value = rare ? 0.8 * haze : 0; scene.fog.color.copy(fogBase).lerp(fogDust, haze * 0.4);
        fxs.update(dt, time, camera);
        if (sea) sea.update(dt, time, camera);
      },
      dispose() { sky.dispose(); hero.dispose(); for (const d of disposables) d.dispose(); },
    };
  },
};
