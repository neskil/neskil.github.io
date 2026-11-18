// The Sand Sea Drowns · 134 million years ago (deep-time crew).
// The Botucatu sand sea in the blue half-hour before dawn, as the first Parana-Etendeka sheet lavas pond between its
// dunes. We are the wind: in low over the lava of the west lake's fire-rimmed bay to a filament-coated theropod standing on
// its shore, up the windward flank at its side as it runs, along the winding knife crest behind it to where it stops and
// looks east, over the lip and OUT over the flood toward the dawn band, round in a wide turn past the islet, the spur
// and the ring, back west to the home ridge (its slip face a fluted wall lit from below, the saddle tongue hanging down
// it), low over the old prints that walk into the lava, past the tongue and a whaleback of inflating skin, and low up
// the spur's corridor among three of its kind running up it ahead of the flood, to a ring in the notch, the sand there raked
// rose-gold by the growing dawn.
// (Polish 2, see shots/fire-in-the-sand-sea/polish2-earlier-run/notes.md.)
// (Polish 4, shots/fire-in-the-sand-sea/polish1/notes.md: the glide stays high and crosses the long islet, a high turn, a witness on the lit
//  wall above the old trackway, a soft shadow under every theropod, fainter blown grains.)
// (Polish 5, shots/fire-in-the-sand-sea/polish2/notes.md: the air takes the colour of the sky behind it (rose haze under the dawn band,
//  blue to the north), a dawn band that is never a white-out, calm-night fume columns only where they read as plumes, the climb over
//  the bay wall a little higher.)
// (Polish k1, shots/fire-in-the-sand-sea/polish-k1-1/notes.md: nothing is timed to a review position any more: the two corridor walkers
//  walk in world space from seeded starts at their own steady paces, the twelve hoppers are met evenly over the whole climb, bounding
//  down the fall line past us; hopper prints and puffs are the animal's size; the avalanche under us shows its surges.)
// (Polish k1c, NOTES.md beside this source: the two walkers are three runners at the design's 9 m/s on either side of our line,
//  the spur is flown at the design's 22 m/s easing to 19, one gaze key follows the company, the shore-watcher is seated by the
//  bank's 4.3 m line, the hopper trails wander and the old trackway meanders.)
// (Step k1d, NOTES.md beside this source: the crest's orange rim draws (its uv statement had slid behind a comment), and three
//  windows that were typed as fractions of the route are metres of route from the places they follow. Mend 1: the rim is sand
//  in the air, lit by the lava and, looked through toward the dawn, by the dawn band, with a ragged top.)
// The hero part builds dunes, lava, toes, tongue, trackways and both animals; this file adds the sky and its stars,
// the fume over the lakes, the sand in the air (crest streamers, blown grains, the avalanche), the hoppers and their
// dotted trails, the seeded looks (hour, wind, cast, the damp hollow of scale-leaved shrubs) and the rare event
// (a whole slip face lets go and rafts away on the skin).
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeTheropod, makeRoute, makeTiming, theropodCycle, makeRunMarks } from '../parts/fire-in-the-sand-sea.js';

const TAU = Math.PI * 2;
// the three hours of the brief: [zenith, mid, horizon away from the dawn, ground, dawn band, stars, star density, milky way,
//   sky fill up (linear rgb), sky fill low gain, rake gain, lava gain, exposure, fog colour, fog density]
const HOURS = {
  blue: { zenith: '#1a2650', mid: '#3a4a7e', horizon: '#56648f', ground: '#141b33', band: '#F3C9A0', scatter: 0.28, stars: 0.42, starDensity: 0.22, milky: 0, bandGain: 1.15, sheen: 1.15, skin: 1.0,
    fume: '#7384ad', up: [0.155, 0.33, 1.0], low: 1.5, rake: 0.34, lava: 1.0, exposure: 1.0, fog: '#1d2644', fogD: 0.00016 },
  night: { zenith: '#070b1c', mid: '#121a3a', horizon: '#1d2a52', ground: '#080c1a', band: '#a07a86', scatter: 0.1, bandGain: 0.3, sheen: 1.0, skin: 1.0, stars: 1.0, starDensity: 1, milky: 0.55,
    fume: '#3d4a72', up: [0.11, 0.2, 0.66], low: 1.15, rake: 0.1, lava: 1.4, exposure: 1.2, fog: '#101730', fogD: 0.00014 },
  firstsun: { zenith: '#1b2748', mid: '#3d4a74', horizon: '#56608a', ground: '#141a30', band: '#FFD3A2', scatter: 0.45, bandGain: 1.5, sheen: 1.15, skin: 0.82, stars: 0.12, starDensity: 0.2, milky: 0,
    fume: '#9a96b4', up: [0.2, 0.37, 1.0], low: 1.7, rake: 0.5, lava: 0.9, exposure: 0.96, fog: '#28304f', fogD: 0.00017 },
};

export default {
  id: 'fire-in-the-sand-sea',
  name: 'The Sand Sea Drowns',
  category: 'prehistoric',
  media: ['air', 'open'],
  weirdness: 0.35,
  async build(ctx) {
    const rng = ctx.rng;
    const vary = ctx.vary || {};
    const detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1);
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---- the seeded look (drawn first, from a fork, so the hero's own draws stay as its artist saw them) ----
    const vr = rng.fork('look');
    const hourPick = vr();
    let hour = hourPick < 0.2 ? 'firstsun' : hourPick < 0.7 ? 'blue' : 'night';
    if (vary.hour === 'night') hour = 'night';
    else if (vary.hour === 'dawn' || vary.hour === 'golden' || vary.hour === 'day') hour = 'firstsun';
    const H = HOURS[hour];
    const calm = vr() < 0.3;                         // dead calm: no streamers, fume standing in straight columns
    const twoRunners = vr() < 0.4;                   // cast: one runner on the crest, or two 12 m apart
    const hollow = vr() < 1 / 6;                     // one look in six: a damp hollow of scale-leaved conifer shrubs
    const rare = !!vary.rare;                        // a whole slip face lets go at u 0.5
    const wind = calm ? 0.12 : lerp(0.75, 1.15, vr());

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(H.fog, H.fogD * 1.3);
    // (polish 5) the air takes the colour of the sky behind it: looking east the far ridges fade into the dusty rose under the dawn
    // band (they stood against it as hard dark-blue steps), looking north or west into the plain dark blue
    const fogBase = new THREE.Color(H.fog).lerp(new THREE.Color(H.horizon), 0.8), fogEast = new THREE.Color(hour === 'night' ? '#4a3f5e' : hour === 'firstsun' ? '#c39a92' : '#b08a8e');
    const time = { value: 0 };

    // ---- the hero: dunes, lava, toes, tongue, trackways, the two theropods ----
    const hero = await buildHero(ctx, { detail });
    scene.add(hero.object);
    const A = hero.anchors, L = hero.lights, hAt = hero.heightAt, dunes = hero.dunes;
    L.uSkyUp.value.setRGB(H.up[0], H.up[1], H.up[2]);
    L.uSkyLow.value.multiplyScalar(H.low / 1.5);
    L.uRakeCol.value.multiplyScalar(H.rake / 0.34); const rake0 = L.uRakeCol.value.clone();
    L.uLavaGain.value = H.lava;
    if (L.uWind) L.uWind.value = calm ? 0.85 : wind;        // even in the calm look a light air still creeps sand over the ripples, slowly
    if (L.uVeilSpeed) L.uVeilSpeed.value = calm ? 3.2 : 6.5;
    { const lu = hero.parts.lava.material.uniforms; lu.uZen.value.multiplyScalar(H.sheen); lu.uHor.value.multiplyScalar(H.sheen); lu.uSkin.value.multiplyScalar(H.skin); lu.uDawn.value.multiplyScalar(0.6 * H.bandGain); }
    if (L.uSunCol) L.uSunCol.value.set(hour === 'firstsun' ? '#ffb87a' : '#000000').multiplyScalar(1.5);
    await ctx.yield();

    // ---- sky: moonless, cloudless; peach band low in the east (+x), plain dark blue to the north for the portal ----
    const BAND_POW = 3.2;                            // how tightly the dawn band keeps to the dawn's side of the sky (the crest's fringe is lit through by the same lobe)
    const sky = makeSky({ rng, preset: 'blueHour', zenith: H.zenith, mid: H.mid, horizon: H.horizon, ground: H.ground,
      horizonPow: 5, midPow: 1.3, groundFalloff: 9,
      scatterColor: H.band, scatter: H.scatter, scatterPow: BAND_POW, scatterHigh: 0.0, scatterFall: 9,
      sunElevation: hour === 'firstsun' ? -1.5 : -5, sunAzimuth: 90, sunIntensity: 0, sunGlow: hour === 'firstsun' ? 0.5 : 0.22, sunColor: '#ffb98a',
      stars: H.stars, starDensity: H.starDensity, twinkle: 0.5, starColor: 0.4, milkyWay: H.milky, milkyAngle: 40,
      bodies: [], clouds: false, clouds2: false, fogColor: H.fog, bake: H.milky > 0, renderer: ctx.renderer });
    scene.add(sky.object);
    await ctx.yield();

    // ---- the flight: the artist's line on this seed's terrain ----
    const pts = await makeRoute(hero, () => ctx.yield());                                          // (the line itself is kept beside the hero: makeRoute in the part)
    const path = makePath(pts);
    const timing = makeTiming(hero, path);                                // the runner held ahead of us up the flank and along the crest, solved on this seed's path
    const seat = A.portalSeat.position;
    // where the marks of the route fall on this seed's path
    const uLip = path.nearestXZ(pts.marks.lip.x, pts.marks.lip.z).u, uShore = path.nearestXZ(pts.marks.shore.x, pts.marks.shore.z).u, uPrint = path.nearestXZ(pts.marks.print.x, pts.marks.print.z).u;
    const tableU = (x, X, Y) => { if (x <= X[0]) return Y[0]; for (let i = 1; i < X.length; i++) if (x <= X[i]) return lerp(Y[i - 1], Y[i], (x - X[i - 1]) / (X[i] - X[i - 1])); return Y[Y.length - 1]; };
    // linger behind the runner on the crest, hurry down the slip face, slow again along the shore to the last print
    // behind the runner at its own speed up the flank and along the crest, a held breath over the lip, quicker down the glide, slow past the last print
    // (polish 2: the flight is longer, out over the flood and back; the runner's legs keep their pace, the lake legs are flown faster)
    const uCrest = path.nearestXZ(A.crossing.x, A.crossing.z).u;
    const uTurn = path.nearestXZ(pts.marks.turn.x, pts.marks.turn.z).u, uCor = path.nearestXZ(seat.x - dunes.HD[0] * 160, seat.z - dunes.HD[1] * 160).u;
    const FLIGHT = { duration: 50 };
    const paceLake = (u) => 1.2 - 0.66 * (1 - smoothstep(uLip - 0.03, uLip + 0.04, u)) - 0.3 * smoothstep(uLip - 0.03, uLip + 0.02, u) * (1 - smoothstep(uLip + 0.03, uLip + 0.09, u))
      + 0.12 * smoothstep(uLip + 0.05, uLip + 0.1, u) * (1 - smoothstep(uTurn - 0.05, uTurn, u)) - 0.34 * smoothstep(uPrint - 0.06, uPrint - 0.02, u) * (1 - smoothstep(uPrint + 0.01, uPrint + 0.05, u));
    // (k1c) the corridor, in metres: dd back from the ring along our line (the final heading, 20 degrees east of north), lat to the right of it
    const HD = dunes.HD, RT = [0.94, 0.342];
    const corXZ = (dd, lat) => [seat.x - HD[0] * dd + RT[0] * lat, seat.z - HD[1] * dd + RT[1] * lat];
    const corH = (dd, lat) => { const q = corXZ(dd, lat); return hAt(q[0], q[1]); };
    const ddOf = (x, z) => -((x - seat.x) * HD[0] + (z - seat.z) * HD[1]);
    const uAtDD = (dd) => { const q = corXZ(dd, 0); return path.nearestXZ(q[0], q[1]).u; };
    // the bank above the spur's shore on a line `lat` from ours: coming down the corridor floor toward the flood, the last ground that is still 4.3 m above the lava
    const bankAt = (lat) => { let dd = 120; while (dd < 260 && corH(dd + 0.5, lat) >= 4.3) dd += 0.5; return dd; };
    const ddBank = bankAt(0);
    // (k1c) On the spur the wind does the design's own 22 m/s easing to 19 at the ring (journey, "u 0.815-1 ... 22 m/s easing to 19:
    // climb 12 degrees up the spur"). The flight is longer than the design's and was flown there at 26.5 easing to 23.9 m/s (a
    // slow-down between two fixed values of u); but the animals that now run up the spur do the design's true 9 m/s, and beside
    // them the design's true figures hold: we gain on each at 13 to 10 m a second, as the design has it, not at 17. The wind checks
    // over the last 45 m of lake and the bank (2 s: slow enough for the engine's own easing of speed to follow) and has its 22 m/s
    // from 5 m above the bank's 4.3 m line. spurK turns metres a second into the engine's pace units (it scales the whole pace so
    // that the flight lasts its duration): found by repeating the engine's own sum.
    const SPUR_V0 = 22, SPUR_V1 = 19, uSlack0 = uAtDD(ddBank + 45), uSlack1 = uAtDD(ddBank - 5);
    let spurK = 0.045;
    const pace = (u) => { const s = smoothstep(uSlack0, uSlack1, u); return s <= 0 ? paceLake(u) : lerp(paceLake(u), lerp(SPUR_V0, SPUR_V1, clamp((u - uSlack1) / (1 - uSlack1), 0, 1)) * spurK, s); };
    for (let it = 0; it < 8; it++) { let inv = 0, a = clamp(pace(0), 0.35, 2.5); for (let i = 1; i <= 64; i++) { const b = clamp(pace(i / 64), 0.35, 2.5); inv += 2 / (a + b); a = b; } spurK = FLIGHT.duration / (path.length * inv / 64); }
    // (k1c) the film's seconds at u: the engine's own reckoning (src/core/engine.js, makePace: the pace at 65 places, held to
    // 0.35..2.5 and scaled so the flight lasts its duration). Animals that run at a true speed take their place from it, so
    // each is where it would be at that moment of the film whatever u a picture is taken at.
    const secAt = (() => {
      const N = 64, p = new Float32Array(N + 1), M = 1024, T = new Float32Array(M + 1); let inv = 0;
      for (let i = 0; i <= N; i++) { const v = +pace(i / N); p[i] = Number.isFinite(v) ? clamp(v, 0.35, 2.5) : 1; }
      for (let i = 0; i < N; i++) inv += 2 / (p[i] + p[i + 1]);
      for (let j = 1; j <= M; j++) { const x = (j - 0.5) / M * N, i = Math.min(N - 1, Math.floor(x)); T[j] = T[j - 1] + FLIGHT.duration / M / ((p[i] + (p[i + 1] - p[i]) * (x - i)) * inv / N); }
      return (u) => { const x = clamp(u, 0, 1) * M, j = Math.min(M - 1, Math.floor(x)); return T[j] + (T[j + 1] - T[j]) * (x - j); };
    })();
    await ctx.yield();

    const updaters = [];       // (dt, t, camera, u, hu) => void
    const disposables = [];
    const res = new THREE.Vector2();
    const camPos = new THREE.Vector3(), camDir = new THREE.Vector3();
    const runnerAt = new THREE.Vector3().copy(A.runnerStand), runnerAim = runnerAt.clone(), rs = {}, runnerU = [hero.runner.uniforms];
    // ---- the dawn band: 6 degrees of peach low in the east, dusty rose above it, drawn on the far plane ----
    {
      const g = new THREE.CylinderGeometry(1, 1, 0.62, 48, 10, true, 0, Math.PI);      // the eastern half: +x
      g.translate(0, 0.25, 0);
      const m = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide, fog: false,
        uniforms: { uPeach: { value: new THREE.Color(H.band) }, uRose: { value: new THREE.Color('#B9788A') }, uGain: { value: H.bandGain } },
        vertexShader: /* glsl */`
          varying vec3 vDir;
          void main(){
            vDir = position;
            vec4 p = projectionMatrix * (viewMatrix * vec4(cameraPosition + position * 6000., 1.));
            if (abs(p.w) < 1e-4) p.w = 1e-4;
            gl_Position = p.xyww;
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uPeach, uRose; uniform float uGain;
          varying vec3 vDir;
          void main(){
            float el = degrees(atan(vDir.y, max(length(vDir.xz), 1e-4)));
            float az = max(vDir.x, 0.) / max(length(vDir.xz), 1e-4);
            float azW = az * az * (0.35 + 0.65 * az * az);
            float up = max(el, 0.), dn = max(-el, 0.);
            vec3 c = uPeach * 1.05 * exp(-up / 6.) + uRose * 0.5 * exp(-up / 13.) * (1. - exp(-up / 4.));   // (polish 5: peach, never a white-out behind the crest)
            c *= azW * exp(-dn / 1.2) * uGain * (1. - smoothstep(16., 31., up));
            gl_FragColor = vec4(c, 1.);
          }`,
      });
      const band = new THREE.Mesh(g, m); band.frustumCulled = false; band.renderOrder = -0.5; band.name = 'dawn-band';
      scene.add(band);
      updaters.push((dt, t, cam, u) => { m.uniforms.uGain.value = H.bandGain * (0.82 + 0.3 * u); });
    }
    await ctx.yield();
    // ---- sand smoking off the crests: stretched sprites pinned to the crest lines, blown east in gusts ----
    const GLSL_N = /* glsl */`
      float wh1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
      float wn1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(wh1(i), wh1(i + 1.), f); }
      float wh2(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float wn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(wh2(i), wh2(i + vec2(1., 0.)), f.x), mix(wh2(i + vec2(0., 1.)), wh2(i + vec2(1., 1.)), f.x), f.y); }
      float wfbm(vec2 p){ float s = 0.5 * wn2(p); p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.03 + 17.1; s += 0.25 * wn2(p); p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.01 + 5.3; s += 0.125 * wn2(p); return s * 1.143; }`;
    const fogU = () => THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
    const quad = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); return g; };
    const sandCol = new THREE.Color('#C98B6B'), paleCol = new THREE.Color('#E2B58C');
    {
      const sr = rng.fork('streamers');
      const nC = Math.round(1500 * detail * (0.8 + 0.2 * density)), nG = Math.round(520 * detail), n = nC + nG;     // (the low veils on the flanks are short soft wisps now: long ones read as smears in a still)
      const base = new Float32Array(n * 3), dir = new Float32Array(n * 4), seed = new Float32Array(n * 4);
      const gp = new THREE.Vector3();
      for (let i = nC; i < n; i++) {                                        // low veils racing up the windward flanks beside the flight
        const onSpur = sr() < 0.45, u = onSpur ? lerp(uCor - 0.03, 1.02, sr()) : lerp(-0.01, uLip + 0.03, sr());
        path.pointAt(u, gp);
        const dx = onSpur ? 0.42 : 0.985, dz = onSpur ? -0.9 : -0.17, lat = sr.range(-30, 30) + (onSpur ? 0 : -14);   // (on the home ridge they keep to the windward side)
        const x = Math.min(gp.x - dz * lat - dx * 6, onSpur ? 1e9 : dunes.crestX(gp.z + dx * lat) - 7), z = gp.z + dx * lat - dz * 6, y = hAt(x, z);
        base[i * 3] = x; base[i * 3 + 1] = y + 0.1; base[i * 3 + 2] = z;
        dir[i * 4] = dx; dir[i * 4 + 1] = (hAt(x + dx * 6, z + dz * 6) - y) / 6; dir[i * 4 + 2] = dz; dir[i * 4 + 3] = 0;
        seed[i * 4] = sr(); seed[i * 4 + 1] = lerp(0.45, 0.8, sr()); seed[i * 4 + 2] = lerp(2.5, 5, sr()); seed[i * 4 + 3] = lerp(0.3, 0.6, sr());
        if (i % 200 === 199) await ctx.yield();
      }
      for (let i = 0; i < nC; i++) {
        const k = sr();
        let x, y, z, dx = 0.985, dz = -0.17, far = 1;
        if (k < 0.62) { z = lerp(150, -215, sr()); x = dunes.crestX(z); y = hAt(x - 0.3, z); }                      // the home crest
        else if (k < 0.8) { const r = sr(); x = r < 0.25 ? lerp(156, 174, r * 4) : r < 0.5 ? lerp(206, 224, (r - 0.25) * 4) : lerp(70, 330, (r - 0.5) * 2); if (Math.abs(x - 190) < 16) x += x < 190 ? -18 : 18; /* half of them smoke off the two horns */ z = dunes.spurZ(x); y = hAt(x, z + 0.3); dx = 0.5; dz = -0.866;
          if (r < 0.5) { dx = 0.94; dz = -0.34; far = x < 190 ? 1.5 : 2.8; } }   // the horns' plumes blow east-north-east, across the view from the corridor   // the spur and its horns
        else if (k < 0.9) {                                                                                              // the islets' backs (polish 3: the new ones smoke too)
          const w = Math.floor(sr() * 5);
          if (w === 0) { z = dunes.ISLET.z + lerp(18, -17, sr()); x = dunes.ISLET.x; }
          else { const I = dunes.ISLETS[w - 1], t = lerp(-0.7, 0.7, sr()); x = I.x + I.ax[0] * t * I.L + I.lee[0] * (I.bow * t * t + 0.5); z = I.z + I.ax[1] * t * I.L + I.lee[1] * (I.bow * t * t + 0.5); }
          y = hAt(x, z); far = 0.7;
        }
        else {                                                                                                           // the next ridge east: big slow veils, seen from the crest
          z = lerp(350, -900, sr()); let bx = 760, by = -99;
          for (let q = 0; q < 26; q++) { const xx = 760 + q * 11, yy = hAt(xx, z); if (yy > by) { by = yy; bx = xx; } }
          x = bx; y = by; far = 4.5;
        }
        base[i * 3] = x; base[i * 3 + 1] = y; base[i * 3 + 2] = z; dir[i * 4] = dx; dir[i * 4 + 1] = 0; dir[i * 4 + 2] = dz; dir[i * 4 + 3] = 1;
        seed[i * 4] = sr(); seed[i * 4 + 1] = lerp(0.32, 0.6, sr()) / Math.sqrt(far); seed[i * 4 + 2] = lerp(2.2, 5.5, sr()) * far; seed[i * 4 + 3] = lerp(0.5, 1.2, sr()) * far;
        if (i % 300 === 299) await ctx.yield();
      }
      const g = quad();
      g.setAttribute('aBase', new THREE.InstancedBufferAttribute(base, 3)); g.setAttribute('aDir', new THREE.InstancedBufferAttribute(dir, 4)); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
      g.instanceCount = n;
      const m = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
        uniforms: Object.assign(fogU(), { uTime: time, uWind: { value: wind }, uSand: { value: paleCol.clone().lerp(sandCol, 0.4) }, uSkyUp: L.uSkyUp, uLavaLit: L.uLavaLit, uLavaGain: L.uLavaGain }),
        vertexShader: /* glsl */`
          attribute vec3 aBase; attribute vec4 aDir, aSeed;
          uniform float uTime, uWind; uniform vec3 uSand, uSkyUp, uLavaLit; uniform float uLavaGain;
          varying vec2 vUv; varying float vA; varying vec3 vCol; varying float vS;
          #include <common>
          #include <fog_pars_vertex>
          ${GLSL_N}
          void main(){
            float ph = uTime * aSeed.y + aSeed.x * 7.;
            float life = fract(ph), cyc = floor(ph);
            float h = wh1(cyc * 0.37 + aSeed.x * 91.7);
            vec3 wd = vec3(aDir.x, 0., aDir.z);
            float air = aDir.w;                                             // 1: flung off a crest, 0: hugging a windward flank
            float len = aSeed.z * (0.35 + 0.65 * uWind) * mix(0.5, 1., aDir.w);   // flank-hugging veils are short low wisps
            float travel = life * len * 3.4;
            vec3 c = aBase + wd * (travel - len * 0.25);
            c += vec3(-wd.z, 0., wd.x) * (h - 0.5) * 2.4 * life;
            c.y += 0.12 + aSeed.w * (0.5 + 1.1 * h) * life * (0.25 + 0.75 * air) - 0.011 * travel * travel * air + aDir.y * (travel - len * 0.25);
            vec3 toCam = cameraPosition - c; float dist = length(toCam);
            vec3 along = normalize(vec3(wd.x, aDir.y - 0.022 * travel * air, wd.z));
            vec3 across = normalize(cross(along, toCam / max(dist, 1e-3)) + vec3(0., 1e-4, 0.));
            float w = max(aSeed.w * (0.16 + 0.75 * life) * mix(1.1, 1., air), dist * 0.0012);
            vec3 p = c + along * (position.x - 0.5) * len * (0.7 + 0.9 * life) + across * position.y * w;
            float gust = smoothstep(0.3, 0.7, wn1(dot(aBase.xz, vec2(0.021, 0.027)) - uTime * 0.23) * 0.7 + 0.3 * wn1(dot(aBase.xz, vec2(0.11, 0.07)) + uTime * 0.5));
            vA = smoothstep(0., 0.12, life) * (1. - smoothstep(0.35, 1., life)) * (0.25 + 0.75 * gust) * max(uWind, 0.45 * (1. - air)) * mix(smoothstep(1.5, 5., dist), smoothstep(7., 26., dist), air) * mix(0.42, 1., air);   // (polish 2: sand flung off the crest thins out near the eye: close, it hung as pink puffs)
            float hl = max(c.y - (aBase.x < 20. ? 18. : 0.), 0.);
            float lava = (0.2 + 0.8 * smoothstep(0., 0.5, life)) * (exp(-hl / 26.) * 0.9 + 0.34) * (0.04 + 0.96 * air);   // (polish 4: sand flung off a high crest still takes the fire from below: seen against the night sky it was a row of dark beads)
            // (veils that hug a flank are lit like the flank they cross, a little paler; they used to read as dark dashes)
            float horn = step(0.93, wd.x) * step(wd.x, 0.95);              // the plumes of the two horns catch the warm low light
            vCol = uSand * (uSkyUp * mix(1.3, 0.62, air) + uLavaLit * uLavaGain * mix(0.3 * (exp(-hl / 13.) * 0.8 + exp(-hl / 2.4) * 0.5), lava * 1.9, air) + vec3(1., 0.56, 0.3) * 0.12 * horn);
            vA *= 1. - 0.6 * horn;
            vA *= 1. - 0.92 * smoothstep(0.55, 0.9, abs(dot(along, toCam / max(dist, 1e-3))));   // (polish 5) seen end-on a streamer is a faint breath: drawn, it stood on the skyline as a pale vertical streak                                         // (the horns' plumes are thin: bright, they read as pink flames beside the ring)
            vUv = position.xy; vS = aSeed.x * 37. + cyc;
            vec4 mvPosition = viewMatrix * vec4(p, 1.);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec2 vUv; varying float vA; varying vec3 vCol; varying float vS;
          #include <common>
          #include <fog_pars_fragment>
          ${GLSL_N}
          void main(){
            float e = 1. - vUv.y * vUv.y;
            float a = e * sqrt(max(e, 0.)) * smoothstep(0., 0.25, vUv.x) * (1. - vUv.x * vUv.x);
            a *= 0.45 + 0.75 * wn2(vec2(vUv.x * 5. + vS, vUv.y * 2.2 + vS * 0.3));
            gl_FragColor = vec4(vCol * 1.15, clamp(a * vA * 0.62, 0., 1.));
            #include <fog_fragment>
          }`,
      });
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 3; mesh.name = 'streamers';
      scene.add(mesh);
    }
    await ctx.yield();
    // ---- fume over the flooded hollows: soft upright sheets, blue-grey above, underlit orange. Windy: low drifting
    //      banks, so each far lake shows as a glowing stripe. Dead calm: the fume stands in straight columns. ----
    {
      const fr = rng.fork('fume');
      const nFar = Math.round(44 * detail), nNear = 0, n = nFar + nNear;      // (no sheets over the home lake: seen from the glide they hung in the air as ghosts)
      const pos = new Float32Array(n * 3), siz = new Float32Array(n * 2), seed = new Float32Array(n * 2);
      let i = 0, tries = 0;
      while (i < n && tries < 4000) {
        tries++;
        const near = i >= nFar;
        const x = near ? fr.range(-60, 520) : fr.range(-2700, 5200), z = near ? fr.range(-470, 140) : fr.range(-3400, 2200);
        const lvl = hero.levelAt(x, z);
        if (hAt(x, z) > lvl - 3) continue;                                  // only over lava
        const pd = path.nearestXZ(x, z).dist, d0 = Math.hypot(x - 60, z + 200);
        if (near ? pd < 34 : d0 < 520) continue;
        let w = near ? fr.range(46, 90) : 150 + d0 * 0.13, h = near ? fr.range(13, 20) : 20 + d0 * 0.012;
        // (polish 5) dead calm: the fume stands in columns, but only within 2.4 km, where a column is a plume a dozen pixels wide;
        // further off it lies in low banks as on a windy night (a far column was a pale tick standing on the skyline, an artefact)
        const col = calm && d0 < 2400 ? 1 : 0;
        if (col) { h = 105 + d0 * 0.05; w = 36 + d0 * 0.036; }
        pos[i * 3] = x; pos[i * 3 + 1] = lvl + 0.4; pos[i * 3 + 2] = z; siz[i * 2] = w; siz[i * 2 + 1] = h; seed[i * 2] = fr(); seed[i * 2 + 1] = col;
        i++;
        if (tries % 200 === 0) await ctx.yield();
      }
      const g = quad();
      g.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3)); g.setAttribute('aSize', new THREE.InstancedBufferAttribute(siz, 2)); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 2));
      g.instanceCount = i;
      const m = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
        uniforms: Object.assign(fogU(), { uTime: time, uCalm: { value: calm ? 1 : 0 }, uFume: { value: new THREE.Color(H.fume) }, uSkyUp: L.uSkyUp, uLava: L.uLava, uLavaGain: L.uLavaGain }),
        vertexShader: /* glsl */`
          attribute vec3 aPos; attribute vec2 aSize, aSeed;
          uniform float uTime, uCalm;
          varying vec2 vUv; varying float vA, vS, vC;
          #include <common>
          #include <fog_pars_vertex>
          void main(){
            vec3 c = aPos; vC = aSeed.y;
            c.x += sin(uTime * 0.07 + aSeed.x * 40.) * aSize.x * 0.12 * (1. - uCalm);
            vec2 tc = cameraPosition.xz - c.xz; float dist = length(tc);
            vec2 r = tc / max(dist, 1e-3);
            float sway = sin(uTime * 0.31 + aSeed.x * 17. + position.y * 1.3) * 0.02 * aSize.y * (0.3 + 0.7 * aSeed.y);   // a slow heat waver
            float yy = position.y * 0.5 + 0.5;
            vec3 p = c + vec3(r.y, 0., -r.x) * ((position.x - 0.5) * aSize.x + sway * yy) + vec3(0., yy * aSize.y, 0.);
            vA = smoothstep(aSize.x * 0.6, aSize.x * 1.6, dist);   // (over the home lake only a breath of it: the flood stays black from the crest)
            vUv = vec2(position.x, yy); vS = aSeed.x * 53.;
            vec4 mvPosition = viewMatrix * vec4(p, 1.);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform float uTime, uCalm, uLavaGain; uniform vec3 uFume, uSkyUp, uLava;
          varying vec2 vUv; varying float vA, vS, vC;
          #include <common>
          #include <fog_pars_fragment>
          ${GLSL_N}
          void main(){
            float x = vUv.x * 2. - 1., y = vUv.y, kC = clamp(vC, 0., 1.);
            vec2 q = mix(vec2(vUv.x * 3.2 + uTime * 0.018, y * 1.4), vec2(vUv.x * 1.6, y * 4.5 - uTime * 0.06), kC) + vS;
            float nz = wn2(q) * 0.62 + wn2(q * 2.3 + 7.) * 0.38;
            float side = 1. - x * x; side *= side;
            float prof = mix((1. - y) * (1. - y), (1. - y) * (0.35 + 0.65 * (1. - y)), kC) * smoothstep(0., 0.05, y);
            float a = side * prof * smoothstep(0.2, 0.75, nz + 0.35 * (1. - y)) * vA;
            float under = exp(-y * mix(4.5, 9., kC));
            vec3 col = uFume * (0.6 + 0.5 * nz) + uLava * under * (0.55 + 0.5 * nz) * uLavaGain;
            gl_FragColor = vec4(col, clamp(a * mix(0.34, 0.5, kC), 0., 1.));
            #include <fog_fragment>
          }`,
      });
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.name = 'fume';
      scene.add(mesh);
    }
    await ctx.yield();

    // ---- carried with the camera: the near box of blown grains (one group, hidden while seen through a portal) ----
    const rig = new THREE.Group(); rig.name = 'rig'; scene.add(rig);
    const grains = fx.makeParticles({ rng: rng.fork('grains'), preset: 'dust', time, count: Math.round(1100 * detail), box: [34, 7, 34],
      velocity: [11 * wind + 0.4, 0.15, -2.2 * wind], velocityRandom: [3 * wind + 0.3, 0.5, 1.2], turbulence: [0.5, 0.35, 0.4],
      size: [0.006, 0.012], colors: ['#d8b6a0', '#c9a590', '#e2c4ae'], intensity: 0.6, opacity: 0.05, additive: 0, twinkle: 0.1,
      mode: 'streak', shape: 'streak', stretch: 0.018, near: [2.2, 7] });   // (polish 4: fainter and never close to the lens: in a still the near ones were pale dashes on the sand)
    rig.add(grains.object);
    updaters.push((dt, t, cam, u) => { rig.visible = u > 0 && !ctx.through; grains.update(dt, t, cam); });
    await ctx.yield();
    // ---- the hoppers: twelve mouse-sized mammals bounding across the windward flank and our line on the climb (the brief's
    //      beat: the twelve cross as we climb the prints), each drawing its dotted paired trail behind it. Where each one is, is a
    //      function of u (0.4 m to a bound), so its prints never slide and the fan of trails lengthens.
    //      (polish k1) ONE seeded rule for all twelve: they are met one after another, evenly over the whole climb (from the bay's
    //      shore to the crest), each bounding down the slope past us within a metre and a half of our line; none is timed to a
    //      place of its own and none has an offset of its own. ----
    {
      const hr = rng.fork('hoppers');
      const NH = 12, HOP = 0.4, SPD = Math.round(0.0765 * path.length);
      const track = new Float32Array(NH * 4), plane = new Float32Array(NH * 4), misc = new Float32Array(NH * 2), wand = new Float32Array(NH * 4);
      // (k1c) no animal bounds a ruled line at a ruled step. Each trail wanders about its line (a swing of 0.27 to 0.8 m either way over 9
      // to 16 m with a quicker one of a third the size on it: its heading strays some 15 to 30 degrees) and its bounds are now longer,
      // now shorter (by up to a quarter, over half a dozen bounds). Both are laws of the distance s along its own line, the same
      // in the shader that places the animal and here where its landings are laid, so every landing is still under its feet.
      // The wander is nil where it crosses our line (s = 0: the brief's band 3 m wide). Drawn on a stream of its own.
      const hw = makeRng(hashSeed('fire-in-the-sand-sea:hopper-wander:' + (ctx.seed ?? 0)));
      const wOff = (i, s) => { const a = wand[i * 4], k = wand[i * 4 + 1], p1 = wand[i * 4 + 2], p2 = wand[i * 4 + 3]; return a * (Math.sin(k * s + p1) - Math.sin(p1)) + 0.3 * a * (Math.sin(2.7 * k * s + p2) - Math.sin(p2)); };
      const wSlope = (i, s) => { const a = wand[i * 4], k = wand[i * 4 + 1], p1 = wand[i * 4 + 2], p2 = wand[i * 4 + 3]; return a * k * Math.cos(k * s + p1) + 0.81 * a * k * Math.cos(2.7 * k * s + p2); };
      const wWarp = (i, s) => 0.16 * Math.sin(2.3 * s + wand[i * 4 + 2] * 3.1) + 0.08 * Math.sin(1.13 * s + wand[i * 4 + 3]);   // in bounds: the phase runs ahead or behind
      const dP = [], dUv = [], dRev = [], dIdx = [], dCen = [];
      const tp = new THREE.Vector3(), tt = new THREE.Vector3();
      // the climb on this seed's path: from where the line leaves the bay's skin for dry sand to the knife crest.
      // (k1d) In metres of route. The bay's shore: the first place, a hopper's bound (0.4 m) at a time from the start and no further
      // than the crest, where the sand under our line stands 0.6 m clear of the skin. Each hopper's line crosses ours AHEAD = 5 m
      // before us at the moment we come upon it. The first is come upon no nearer the shore than 12 m of route: its crossing is then
      // 17 m of route up the bay's wall from the fire's edge, 6 to 8 m above the skin with 10 to 14 m of dry slope below it (the
      // living animals keep to dry sand). The last is come upon AHEAD short of the crest: its crossing is no further on than the knife edge.
      const sCrest = uCrest * path.length, AHEAD = 5;
      let sSand = 0; while (sSand < sCrest) { path.pointAt(sSand / path.length, tp); if (hAt(tp.x, tp.z) > hero.levelAt(tp.x, tp.z) + 0.6) break; sSand += HOP; }
      const uH0 = (sSand + 12) / path.length, uH1 = (sCrest - AHEAD) / path.length;
      for (let i = 0; i < NH; i++) {
        const ui = lerp(uH0, uH1, (i + hr()) / NH);                           // where we come upon this one
        path.pointAt(ui + AHEAD / path.length, tp); path.tangentAt(ui + AHEAD / path.length, tt);
        const tl = Math.max(Math.hypot(tt.x, tt.z), 1e-4), rx = -tt.z / tl, rz = tt.x / tl;   // to the right of our heading (the gaze leans that way, toward the runner)
        // the brief's band, 3 m wide, on our line: each comes bounding DOWN the slope toward us and past, a little to one side or the
        // other, so the trail it has drawn lies up the fall line ahead of us and we fly along it (trails laid across our line were
        // each in the picture for a moment; laid down the slope, three or four of the twelve are always in it)
        const lat = (i % 2 ? 1 : -1) * hr.range(0.35, 1.5), ang = hr.range(-0.3, 0.3) + (lat > 0 ? -0.1 : 0.1);
        const ex = tp.x + rx * lat, ez = tp.z + rz * lat;
        const y0 = hAt(ex, ez), gx = (hAt(ex + 1, ez) - hAt(ex - 1, ez)) / 2, gz = (hAt(ex, ez + 1) - hAt(ex, ez - 1)) / 2;
        const fl = Math.max(Math.hypot(gx, gz), 1e-4), ca = Math.cos(ang), sa = Math.sin(ang), dx = (-gx * ca + gz * sa) / fl, dz = (-gz * ca - gx * sa) / fl;   // down the fall line, a few degrees off it
        const off = hr();
        { const lam = hw.range(9, 16); wand.set([lam * hw.range(0.03, 0.05), TAU / lam, hw.range(0, TAU), hw.range(0, TAU)], i * 4); }
        track.set([ex, ez, dx, dz], i * 4); plane.set([y0, gx, gz, ui], i * 4); misc.set([off, hr.range(1.4, 1.75) * 0.44], i * 2);   // brief, truth list: mouse-sized (body 0.1 m, tail 0.12 m); the model is 0.15 m at scale 1
        // its trail: a pair of prints at every landing, from far up the slope down to well past us
        const L = hr.range(13, 24), px = dz, pz = -dx;                         // (px, pz): across the track
        for (let n = Math.ceil((-34) / HOP); n * HOP < L; n++) {                // (polish k1: the trail is drawn further back up the slope: the prints are the animal's own size now and the fan must read as before)
          let s = -(n + off) * HOP; for (let it = 0; it < 4; it++) s = -(n + off + wWarp(i, s)) * HOP;   // where its feet come down for the n-th time (the shader's own phase law, solved for s)
          const wo = wOff(i, s), ws = wSlope(i, s), wl = Math.hypot(1, ws), hx = (dx + px * ws) / wl, hz = (dz + pz * ws) / wl;   // its place off the line and its heading there
          const cx = ex + dx * s + px * wo, cz = ez + dz * s + pz * wo;   // s < 0: up-slope of the meeting point (already printed)
          const b = dP.length / 3, rev = ui + s / SPD;
          for (const [a, c] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
            const x = cx + hx * c * 0.11 + hz * a * 0.09, z = cz + hz * c * 0.11 - hx * a * 0.09;   // (polish k1) a landing of a 0.1 m animal: its pair of prints, each about 3 by 6 cm and 5 cm apart, and behind them the pale splash of sand its feet threw
            dP.push(x, hAt(x, z) + 0.014, z); dUv.push(a, c); dRev.push(rev); dCen.push(cx, hAt(cx, cz) + 0.014, cz);
          }
          dIdx.push(b, b + 1, b + 2, b, b + 2, b + 3);
        }
        if (i % 3 === 2) await ctx.yield();
      }
      const uU = { value: 0 };
      // the animals
      const hg0 = buildHopperGeometry(), hg = new THREE.InstancedBufferGeometry();
      hg.index = hg0.index; for (const k of ['position', 'normal', 'color', 'aPart']) hg.setAttribute(k, hg0.getAttribute(k));
      hg.setAttribute('aTrack', new THREE.InstancedBufferAttribute(track, 4)); hg.setAttribute('aPlane', new THREE.InstancedBufferAttribute(plane, 4)); hg.setAttribute('aMisc', new THREE.InstancedBufferAttribute(misc, 2)); hg.setAttribute('aWand', new THREE.InstancedBufferAttribute(wand, 4));
      hg.instanceCount = NH; hg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      const HOP_GLSL = /* glsl */`
        attribute vec4 aTrack, aPlane, aWand; attribute vec2 aMisc;
        uniform float uU;
        float hopS(){ return ${SPD.toFixed(1)} * (uU - aPlane.w); }
        float hopWarp(float s){ return 0.16 * sin(2.3 * s + aWand.z * 3.1) + 0.08 * sin(1.13 * s + aWand.w); }
        float hopPhase(float s){ return (s + 400.) / ${HOP.toFixed(2)} + aMisc.x + hopWarp(s); }
        float hopLanding(float n){ float s = (n - aMisc.x) * ${HOP.toFixed(2)} - 400.; for (int k = 0; k < 4; k++) s = (n - aMisc.x - hopWarp(s)) * ${HOP.toFixed(2)} - 400.; return s; }   // where phase n falls
        float hopOff(float s){ return aWand.x * (sin(aWand.y * s + aWand.z) - sin(aWand.z)) + 0.3 * aWand.x * (sin(2.7 * aWand.y * s + aWand.w) - sin(aWand.w)); }
        float hopSlope(float s){ return aWand.x * aWand.y * cos(aWand.y * s + aWand.z) + 0.81 * aWand.x * aWand.y * cos(2.7 * aWand.y * s + aWand.w); }
        vec3 hopGround(float s){ vec2 q = aTrack.xy + aTrack.zw * s + vec2(aTrack.w, -aTrack.z) * hopOff(s); return vec3(q.x, aPlane.x + aPlane.y * (q.x - aTrack.x) + aPlane.z * (q.y - aTrack.y), q.y); }`;
      const hm = new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide,
        uniforms: Object.assign(fogU(), { uU, uTime: time, uSkyUp: L.uSkyUp, uSkyLow: L.uSkyLow, uRakeDir: L.uRakeDir, uRakeCol: L.uRakeCol, uLavaLit: L.uLavaLit }),
        vertexShader: /* glsl */`
          attribute vec3 color; attribute vec2 aPart;
          uniform float uTime;
          varying vec3 vCol; varying vec3 vN;
          #include <common>
          #include <fog_pars_vertex>
          ${HOP_GLSL}
          vec2 rot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(v.x * c - v.y * s, v.x * s + v.y * c); }
          void main(){
            float s = hopS(), ph = hopPhase(s), f = fract(ph);
            vec3 p = position, n = normal;
            float part = aPart.x;
            if (part > 0.5 && part < 1.5) { p.yz -= vec2(0.04, -0.012); p.yz = rot(p.yz, -1.0 * sin(6.2832 * f) - 0.25); p.yz += vec2(0.04, -0.012); }   // hind foot: kicks back, tucks, reaches
            if (part > 1.5 && part < 2.5) { p.y += aPart.y * aPart.y * 0.045 * sin(6.2832 * f + 1.2); p.x += aPart.y * 0.012 * sin(uTime * 3. + aMisc.x * 40.); } // tail counter-swings
            if (part > 2.5 && part < 3.5) { p.z -= (p.y - 0.09) * 0.5 * (0.5 + 0.5 * sin(6.2832 * f)); }                                                      // ears lay back in the leap
            float pitch = 0.42 * cos(3.1416 * f);                                    // nose up at take-off, down into the landing
            p.yz -= vec2(0.05, 0.); p.yz = rot(p.yz, pitch); n.yz = rot(n.yz, pitch); p.yz += vec2(0.05, 0.);
            p.y *= 1. - 0.18 * (1. - smoothstep(0., 0.14, f)) ;                      // squash on landing
            vec3 g = hopGround(s);
            // (k1c, thin-line rule, as its landings have) the maker of a trail keeps about two pixels at range: beyond 15 m it is drawn
            // larger, up to three times at 46 m, so the head of every fresh trail has its animal
            float grow = clamp(length(cameraPosition - g) * 0.065, 1., 3.);
            p *= aMisc.y * grow;
            vec2 hd = normalize(aTrack.zw + vec2(aTrack.w, -aTrack.z) * hopSlope(s));
            vec3 fw = vec3(hd.x, 0., hd.y), rt = vec3(hd.y, 0., -hd.x);
            vec3 w = g + rt * p.x + vec3(0., p.y + 0.15 * grow * 4. * f * (1. - f), 0.) + fw * p.z;
            vN = normalize(rt * n.x + vec3(0., n.y, 0.) + fw * n.z); vCol = color;
            vec4 mvPosition = viewMatrix * vec4(w, 1.);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uSkyUp, uSkyLow, uRakeDir, uRakeCol, uLavaLit;
          varying vec3 vCol; varying vec3 vN;
          #include <common>
          #include <fog_pars_fragment>
          void main(){
            vec3 n = normalize(vN);
            vec3 col = vCol * (mix(uSkyLow, uSkyUp, n.y * 0.5 + 0.5) * 1.45 + uRakeCol * 2.6 * max(dot(n, uRakeDir), 0.));
            col += vCol * uLavaLit * 0.75 * max(dot(n, vec3(-0.5, 0.1, 0.86)), 0.);     // the bay's fire, from behind and below
            gl_FragColor = vec4(col, 1.);
            #include <fog_fragment>
          }`,
      });
      const hoppers = new THREE.Mesh(hg, hm); hoppers.frustumCulled = false; hoppers.name = 'hoppers'; scene.add(hoppers);
      disposables.push(hg0);
      // the trails: paired prints with a pale crescent of kicked sand, revealed as each animal passes
      const dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.Float32BufferAttribute(dP, 3)); dg.setAttribute('uv', new THREE.Float32BufferAttribute(dUv, 2)); dg.setAttribute('aRev', new THREE.Float32BufferAttribute(dRev, 1)); dg.setAttribute('aCen', new THREE.Float32BufferAttribute(dCen, 3));
      dg.setIndex(dIdx);
      const dm = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        uniforms: Object.assign(fogU(), { uU, uSand: { value: sandCol }, uSkyUp: L.uSkyUp, uSkyLow: L.uSkyLow }),
        vertexShader: /* glsl */`
          attribute float aRev; attribute vec3 aCen; uniform float uU;
          varying vec2 vUv; varying float vShow, vD;
          #include <common>
          #include <fog_pars_vertex>
          void main(){
            vUv = uv; vShow = step(aRev, uU) * (0.55 + 0.45 * (1. - smoothstep(0., 0.12, uU - aRev)));
            float dC = length(cameraPosition - aCen);
            float grow = clamp(dC * 0.0065 / 0.1, 1., 3.);                  // (thin-line rule) a landing keeps about a pixel and a half at range
            vec4 mvPosition = viewMatrix * vec4(aCen + (position - aCen) * grow, 1.);
            vD = -mvPosition.z;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uSand, uSkyUp, uSkyLow;
          varying vec2 vUv; varying float vShow, vD;
          #include <common>
          #include <fog_pars_fragment>
          void main(){
            vec2 q = vec2(abs(vUv.x) - 0.27, vUv.y - 0.3);
            float d = length(q / vec2(0.19, 0.3));
            float pit = 1. - smoothstep(0.55, 1., d);
            float rim = (1. - smoothstep(0.25, 1., length(vec2(vUv.x, vUv.y + 0.4) / vec2(0.85, 0.5)))) * (1. - pit);
            float a = max(pit * 0.92, rim * 0.72) * vShow * (1. - smoothstep(45., 90., vD));
            vec3 col = mix(uSand * uSkyUp * 1.55, uSand * uSkyLow * 0.14, pit);
            gl_FragColor = vec4(col, a);
            #include <fog_fragment>
          }`,
      });
      const trails = new THREE.Mesh(dg, dm); trails.name = 'hopper-trails'; trails.renderOrder = 1; scene.add(trails);
      // a puff at each of the last two landings of every hopper
      const pg = quad();
      const rep2 = (a, n) => { const o = new Float32Array(a.length * 2); o.set(a); o.set(a, a.length); return new THREE.InstancedBufferAttribute(o, n); };
      pg.setAttribute('aTrack', rep2(track, 4)); pg.setAttribute('aPlane', rep2(plane, 4)); pg.setAttribute('aMisc', rep2(misc, 2)); pg.setAttribute('aWand', rep2(wand, 4));
      const kk = new Float32Array(NH * 2); kk.fill(1, NH); pg.setAttribute('aK', new THREE.InstancedBufferAttribute(kk, 1)); pg.instanceCount = NH * 2;
      const pm = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, fog: true,
        uniforms: Object.assign(fogU(), { uU, uSand: { value: paleCol }, uSkyUp: L.uSkyUp }),
        vertexShader: /* glsl */`
          attribute float aK;
          varying vec2 vUv; varying float vA;
          #include <common>
          #include <fog_pars_vertex>
          ${HOP_GLSL}
          void main(){
            float s = hopS(), ph = hopPhase(s), n = floor(ph) - aK, age = ph - n;
            vec3 g = hopGround(hopLanding(n));
            float size = 0.05 + 0.055 * age;                                   // (polish k1) the brief's puff: 0.2 m across when it is fullest
            vUv = vec2(position.x * 2. - 1., position.y); vA = (1. - age * 0.5) * (1. - age * 0.5) * smoothstep(0., 0.1, age);
            vec4 mvPosition = viewMatrix * vec4(g + vec3(0., 0.02 + 0.05 * age, 0.), 1.);
            mvPosition.xy += vUv * size;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uSand, uSkyUp;
          varying vec2 vUv; varying float vA;
          #include <common>
          #include <fog_pars_fragment>
          void main(){
            float r = dot(vUv, vUv), a = max(1. - r, 0.); a *= a;
            gl_FragColor = vec4(uSand * uSkyUp * 1.3, a * vA * 0.6);
            #include <fog_fragment>
          }`,
      });
      const hpuffs = new THREE.Mesh(pg, pm); hpuffs.frustumCulled = false; hpuffs.renderOrder = 3; hpuffs.name = 'hopper-puffs'; scene.add(hpuffs);
      updaters.push((dt, t, cam, u) => { uU.value = u; });
    }
    await ctx.yield();
    // ---- sliding sand: the avalanche that starts under us at the lip (u 0.39) and runs down the slip face with us,
    //      and, on a rare visit, a whole slip face 200 m wide that lets go at u 0.5 and rafts away on the skin.
    //      A sheet of flowing lobes just over the sand (s = metres down the flow, v = -1..1 across) and billows of dust. ----
    const slideMat = (o) => new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      uniforms: Object.assign(fogU(), { uTime: time, uFront: { value: -50 }, uShore: { value: o.shore }, uScroll: { value: o.scroll }, uRaft: { value: o.raft ? 1 : 0 }, uPale: { value: sandCol.clone().lerp(paleCol, 0.5) },
        uSkyUp: L.uSkyUp, uSkyLow: L.uSkyLow, uLavaLit: L.uLavaLit, uLavaGain: L.uLavaGain, uRakeCol: L.uRakeCol, uSunCol: L.uSunCol, uSunY: L.uSunY }),
      vertexShader: /* glsl */`
        attribute vec2 aSV; attribute float aW;
        varying vec2 vSV; varying float vW, vY, vD;
        #include <common>
        #include <fog_pars_vertex>
        void main(){
          vSV = aSV; vW = aW; vY = position.y;
          vec4 mvPosition = viewMatrix * vec4(position, 1.);
          vD = -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uFront, uShore, uScroll, uLavaGain, uRaft, uSunY; uniform vec3 uPale, uSkyUp, uSkyLow, uLavaLit, uRakeCol, uSunCol;
        varying vec2 vSV; varying float vW, vY, vD;
        #include <common>
        #include <fog_pars_fragment>
        ${GLSL_N}
        void main(){
          float s = vSV.x, v = vSV.y, x = v * vW;
          float flow = s - uTime * uScroll;
          float onLava = smoothstep(uShore - 1., uShore + 5., s) * uRaft;
          // the toe: rounded lobes rolling ahead of the sheet
          float lobe = abs(sin(x * 0.19 + wn2(vec2(x * 0.07, 3.)) * 4.));
          float front = uFront - lobe * 9. - wn2(vec2(x * 0.4, 4.)) * 3.;
          float behind = 1. - smoothstep(front - 1.5, front, s);
          float side = 1. - smoothstep(0.3 + 0.3 * wn2(vec2(s * 0.05, 9.)), 1., abs(v));
          // the moving sand: soft threads of grains and slow surges, no hard edges
          float thread = wn2(vec2(x * 6.5 + wn2(vec2(x * 0.7, flow * 0.1)) * 1.5, flow * 0.11));     // threads of grains a hand wide
          float band = wfbm(vec2(x * 1.6, flow * 0.07));
          float wv = 0.5 + 0.5 * sin(flow * 1.35 + wfbm(vec2(x * 0.22, flow * 0.07)) * 8.);            // roll waves 4-5 m apart, bowed and broken
          // (polish k1) each surge is a wedge of sliding sand: it thickens and pales toward its nose, which is a sharp lobed front lying
          // across the fall line, with the face in its shade just below it (even soft bands read as pale smudges on the wall)
          float tvS = fract((flow * 1.35 + wfbm(vec2(x * 0.22, flow * 0.07)) * 8.) / 6.2832 + 0.35 * wn2(vec2(x * 0.45, 7.)));
          float crest = tvS * tvS * (1. - smoothstep(0.93, 0.99, tvS)), trough = (1. - smoothstep(0., 0.09, tvS)) * 1.2;
          float spark = smoothstep(0.86, 0.97, wn2(vec2(x * 9., flow * 2.6)));
          float lip = smoothstep(front - 7., front - 0.5, s) * behind;
          float nearF = 1. - smoothstep(0.75, 1., abs(v));
          float fine = sin(flow * 10.5 + x * 0.9 + band * 9.) * (1. - smoothstep(5., 26., vD));           // small ripples riding the sheet, close to the eye
          float tone = 0.98 + 0.12 * (thread - 0.5) + 0.2 * (band - 0.5) + 0.55 * crest - 0.3 * trough + 0.25 * spark + 0.05 * fine + 0.22 * lip - 0.16 * (1. - nearF);
          // out on the skin the sheet rides away as a raft and breaks into floes
          float far = smoothstep(uShore + 20., uShore + 300., s);
          float fl = wfbm(vec2(x * 0.045 + uTime * 0.01, (s - uTime * 0.6) * 0.045));
          float floe = smoothstep(0.34 + 0.2 * far, 0.39 + 0.2 * far, fl);
          float crk = wfbm(vec2(x * 0.11 + 7., (s - uTime * 0.6) * 0.11));
          floe *= smoothstep(0.02, 0.085 + 0.06 * far, abs(crk - 0.5)) * smoothstep(0.015, 0.07, abs(wfbm(vec2(x * 0.05 + 31., (s - uTime * 0.6) * 0.05 + 9.)) - 0.5));                   // cracks open as it rides away
          // on the face the sheet pours in separate tongues a few metres wide, the face showing between them
          float finger = mix(smoothstep(0.42, 0.7, wn2(vec2(x * 0.13 + 2., s * 0.012)) + 0.25 * lip), 1., uRaft);
          float faceK = 1. - onLava;
          float a = behind * side * smoothstep(0., 5., s) * mix(finger * (0.2 + 0.8 * crest + 0.45 * lip) + 0.5 * trough * finger, floe * 0.95, onLava);   // (polish k1: the sheet's body is a breath over the face; its surge noses and their shade are the picture. As one pale sheet it lay on the wall as a pane with an outline)
          a *= mix(smoothstep(0.15, 1.1, vY), 1., uRaft);
          float hA = max(vY, 0.);
          // lit exactly like the slip face it rides on (sky, the low rake from the east, first sun on the heights, lava from below)
                    vec3 light = mix(uSkyLow, uSkyUp, 0.92) * (1. + 0.7 * onLava) * mix(vec3(1.), vec3(0.66, 0.78, 1.06), faceK) + (uRakeCol * 0.67 + uSunCol * 0.78 * smoothstep(uSunY, uSunY + 7., vY)) * faceK + uLavaLit * (exp(-hA / 13.) * 0.8 + exp(-hA / 2.4) * 0.5) * uLavaGain * (1. - 0.45 * onLava);
          vec3 col = uPale * tone * light * mix(1., 1.6 * (0.5 + 0.5 * smoothstep(0.44 + 0.3 * far, 0.58 + 0.3 * far, fl)), onLava);
          gl_FragColor = vec4(col, a);
          #include <fog_fragment>
        }`,
    });
    // build one slide from a centre line: at(k 0..1) -> [x, z, halfWidth, onLava]
    async function makeSlide(nS, nV, at, dustN, sr, o) {
      const P = [], SV = [], W = [], I = [];
      const dP = [], dD = [], dS = [];
      let s = 0, px = 0, pz = 0, shore = 1e9;
      for (let i = 0; i <= nS; i++) {
        const [x, z, hw, lava] = at(i / nS, 0);
        if (i) s += Math.hypot(x - px, z - pz); px = x; pz = z;
        if (lava && shore > 1e8) shore = s;
        for (let j = 0; j <= nV; j++) {
          const v = (j / nV) * 2 - 1, [wx, wz] = at(i / nS, v);
          const y = Math.max(hAt(wx, wz) + 0.2, hero.levelAt(wx, wz) + (o.raft ? 0.75 : 0.12));
          P.push(wx, y, wz); SV.push(s, v); W.push(hw);
          if (i < nS && j < nV) { const a = i * (nV + 1) + j, b = a + nV + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
        }
        if (i % 12 === 11) await ctx.yield();
      }
      for (let i = 0; i < dustN; i++) {
        const k = Math.pow(sr(), 0.8) * (o.dustTo || 1), v = sr.range(-0.8, 0.8), [wx, wz] = at(k, v), [x2, z2] = at(Math.min(1, k + 0.01), v);
        let tx = x2 - wx, tz = z2 - wz; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        const wy = Math.max(hAt(wx, wz), hero.levelAt(wx, wz) + 0.6);
        const wy2 = Math.max(hAt(wx + tx * 2, wz + tz * 2), hero.levelAt(wx, wz) + 0.6);
        dP.push(wx, wy, wz); dD.push(tx, (wy2 - wy) / 2, tz); dS.push(k * 1, sr(), sr.range(0.7, 1.5), 0);
      }
      const total = s;
      for (let i = 0; i < dustN; i++) dS[i * 4] *= total;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aSV', new THREE.Float32BufferAttribute(SV, 2)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 1)); g.setIndex(I);
      const m = slideMat({ shore: Math.min(shore, total + 50), scroll: o.scroll, raft: o.raft });
      const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 1; mesh.name = o.name; scene.add(mesh);
      return { mesh, front: m.uniforms.uFront, total, shore, dP, dD, dS };
    }
    const perp = (cx, cz, tx, tz, v, hw) => [cx - tz * v * hw, cz + tx * v * hw];
    const tq = new THREE.Vector3(), tq2 = new THREE.Vector3();
    // (a) the avalanche under us: a widening tongue along the line of flight, lip to shore and 25 m out onto the skin
    //     (it lies on the lee side only: no vertex is to windward of the knife edge, so the sheet never bridges the crest)
    const mk = pts.marks, aDir = new THREE.Vector2(mk.slide.x - mk.lip.x, mk.slide.z - mk.lip.z), aLen = aDir.length() + 26; aDir.normalize();
    const slideA = await makeSlide(64, 12, (k, v) => {
      const hw = 21 + 15 * smoothstep(0, 0.8, k), cx = mk.lip.x + 2.8 + aDir.x * aLen * k, cz = mk.lip.z + aDir.y * aLen * k;
      const [x, z] = perp(cx, cz, aDir.x, aDir.y, v, hw);
      return [Math.max(x, dunes.crestX(z) + 0.9), z, hw, hAt(cx, cz) < 0.2];
    }, Math.round(480 * detail), rng.fork('slideA'), { name: 'avalanche', scroll: 5.5, dustTo: 0.9 });
    await ctx.yield();
    // (b) rare: the whole home slip face around our descent, 200 m wide, lets go as we tip over the lip, runs out
    //     onto the lake and rafts away as a pale continent of sand
    const ZC = -108, HWB = 96;
    const slideB = rare ? await makeSlide(60, 44, (k, v) => {
      const z = ZC + v * HWB, xc = dunes.crestX(z) + 1.2, xs = dunes.shore(xc + 150, z, xc + 12, z, 0)[0];
      const x = k < 0.45 ? lerp(xc, xs, k / 0.45) : xs + ((k - 0.45) / 0.55) * 120;
      const kk = Math.max(0, (k - 0.45) / 0.55);                              // out on the skin the raft is carried north with the creep, past the foot of the tongue
      return [x, z - 110 * smoothstep(0.06, 0.4, kk) - 40 * kk + 0.3 * v * HWB * kk, HWB, k >= 0.45];   // (clear of the tongue's foot and the last print, which lie within 20 m of the shore)
    }, Math.round(520 * detail), rng.fork('slideB'), { name: 'slip-face-slide', scroll: 7, dustTo: 0.45, raft: true }) : null;
    await ctx.yield();
    {
      // dust billowing off the moving sand
      const all = [slideA, slideB].filter(Boolean), n = all.reduce((a, s) => a + s.dS.length / 4, 0);
      const p0 = new Float32Array(n * 3), dd = new Float32Array(n * 3), ss = new Float32Array(n * 4);
      let o = 0;
      all.forEach((s, w) => { p0.set(s.dP, o * 3); dd.set(s.dD, o * 3); ss.set(s.dS, o * 4); for (let i = 0; i < s.dS.length / 4; i++) ss[(o + i) * 4 + 3] = w; o += s.dS.length / 4; });
      const g = quad();
      g.setAttribute('aP0', new THREE.InstancedBufferAttribute(p0, 3)); g.setAttribute('aDir', new THREE.InstancedBufferAttribute(dd, 3)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(ss, 4)); g.instanceCount = n;
      const fronts = new THREE.Vector2(-50, -50), sLip = uLip * path.length;   // sLip: metres of route to the lip
      const m = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, fog: true,
        uniforms: Object.assign(fogU(), { uTime: time, uFronts: { value: fronts }, uPale: { value: paleCol }, uSkyUp: L.uSkyUp, uLavaLit: L.uLavaLit, uLavaGain: L.uLavaGain }),
        vertexShader: /* glsl */`
          attribute vec3 aP0, aDir; attribute vec4 aS;
          uniform float uTime; uniform vec2 uFronts;
          varying vec2 vUv; varying float vA, vS; varying vec3 vCol;
          uniform vec3 uPale, uSkyUp, uLavaLit; uniform float uLavaGain;
          #include <common>
          #include <fog_pars_vertex>
          void main(){
            float big = aS.w, front = mix(uFronts.x, uFronts.y, big);
            float act = smoothstep(aS.x - 6., aS.x + 5., front) * (1. - smoothstep(aS.x + mix(45., 400., big), aS.x + mix(110., 900., big), front));
            float life = fract(uTime * (0.45 - 0.2 * big) * aS.z + aS.y * 9.);
            float sc = aS.z * (1. + 2.4 * big);
            vec3 c = aP0 + aDir * life * 6. * sc + vec3(0., (0.25 + 2.3 * life * life) * sc, 0.);
            float size = (0.9 + 2.8 * life) * sc;
            vUv = vec2(position.x * 2. - 1., position.y);
            vec4 mvPosition = viewMatrix * vec4(c, 1.);
            float dist = -mvPosition.z;
            vA = act * sin(3.1416 * life) * smoothstep(2., 9., dist) * mix(0.05, 0.13, big);
            mvPosition.xy += vUv * size * vec2(1.5, 0.75);
            float hA = max(c.y, 0.);
            vCol = uPale * (uSkyUp * 0.7 + uLavaLit * (exp(-hA / 14.) * 0.75 + 0.06) * uLavaGain);
            vS = aS.y * 31.;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec2 vUv; varying float vA, vS; varying vec3 vCol;
          #include <common>
          #include <fog_pars_fragment>
          ${GLSL_N}
          void main(){
            float r = dot(vUv, vUv), a = max(1. - r, 0.);
            a = a * a * (0.55 + 0.6 * wn2(vUv * 1.7 + vS));
            gl_FragColor = vec4(vCol * (0.85 + 0.3 * vUv.y), clamp(a * vA, 0., 1.));
            #include <fog_fragment>
          }`,
      });
      const dust = new THREE.Mesh(g, m); dust.frustumCulled = false; dust.renderOrder = 3; dust.name = 'slide-dust'; scene.add(dust);
      updaters.push((dt, t, cam, u) => {
        // (polish k1) it lets go as we come up to the lip, so the face is already running when we tip over it. (k1d) In metres of route:
        // it lets go when the lip is 45 m ahead of us and its nose runs half as fast again as we fly, so that as we tip over the lip the
        // nose is 67 m down the face, three quarters of the way to the shore (84 to 89 m), and it reaches the lava under us on the way down
        const fa = (u * path.length - (sLip - 45)) * 1.5;
        slideA.front.value = fa; fronts.x = fa;
        // rare: the face lets go as we near the lip and its raft is out on the lake, ahead of us, all the way down and along the shore
        if (slideB) { const fb = tableU(u, [uLip - 0.05, uLip + 0.005, uLip + 0.06, uShore + 0.05], [-20, 62, 168, slideB.total + 10]); slideB.front.value = fb; fronts.y = fb; }
      });
    }
    await ctx.yield();
    // ---- the crest's orange rim: lava light caught in the sand smoking off the knife edge, seen from the dark side ----
    //      (k1d) The fringe is a sheet, and blown sand is not: where the crest winds, a stretch of the sheet is seen along its own
    //      length, folded over itself, and its folds and its two ends stood on the skyline as a small lit box with a hard side. So,
    //      by the sheet's own shader and the same along the whole crest: seen along the crest's run it thins out by the law the
    //      streamers of this crest already have (all of it while the line of sight is more than 57 degrees off the crest's run,
    //      nothing within 26 degrees of it), and it is at full strength where the crest smokes (the streamers are pinned from
    //      z 150 to z -215) and thins to nothing over 40 m beyond that to the south and over the 31 m of its taper to the north.
    //      (k1d, mend 1) The fringe is sand in the air and is drawn as such. It hides a part of the sky behind it (up to nine
    //      tenths where it is densest) and is lit as the sand flung off this crest is lit (the streamers' law above): by the sky
    //      fill, by the lava from below (the gain polish 2 chose, untouched) and by the dawn, which comes THROUGH it: blown sand
    //      is brightest looked through toward the light. The dawn's share is the hour's own band (the sky's scatter amount times
    //      the band colour's brightness: an eighth of the blue hour's at night) with the lobe the sky draws that band with
    //      (BAND_POW about the dawn's direction): so from the bay, against the pale band, the rim is orange, and from the lake
    //      it is the lava's alone, as it was. Its top is blown sand, not a ruled edge: the height the glow reaches differs from
    //      metre to metre along the crest (0.45 to 1 of the sheet, drifting). Near the eye it thins out (22 to 70 m, polish 2's
    //      law, kept: with the streamers' 7 to 26 m the sheet lay over the flank as a rose pane from 20 m below the crest).
    //      No term reads the route's fraction, the seed or the clock's phase.
    {
      const P = [], UV = [], AL = [], I = [];
      let k = 0;
      const tn = new THREE.Vector3();
      for (let z = 190; z >= -236; z -= 2.5, k++) {
        const x = dunes.crestX(z), y = hAt(x - 0.3, z), sad = smoothstep(-236, -205, z);
        P.push(x + 0.5, y - 0.25, z, x + 1.6, y + 3.0 * sad + 0.3, z);   // (polish 2: a low fringe; the tall sheet stood up as a lit box where the crest winds) (mend 1: its wisps reach 3.3 m and stand 2.5 m in the mean, where the ruled sheet stood 2.7 m)
        UV.push(z, 0, z, 1);                                              // (k1d) back as code: it had slid behind the comment above, the rim had no uv and never drew
        // the crest's run here (the direction the sheet is long in)
        tn.set(dunes.crestX(z - 2.5) - dunes.crestX(z + 2.5), hAt(dunes.crestX(z - 2.5) - 0.3, z - 2.5) - hAt(dunes.crestX(z + 2.5) - 0.3, z + 2.5), -5).normalize();
        AL.push(tn.x, tn.y, tn.z, tn.x, tn.y, tn.z);
        if (k) { const a = (k - 1) * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aAlong', new THREE.Float32BufferAttribute(AL, 3)); g.setIndex(I);
      const bc = new THREE.Color(H.band), bandLum = 0.2126 * bc.r + 0.7152 * bc.g + 0.0722 * bc.b, DAWN_K = 14;   // (mend 1) the band's brightness this hour; one number for every hour, wind and seed
      const m = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.NormalBlending, premultipliedAlpha: true, side: THREE.DoubleSide, fog: false,   // (mend 1) its light is added and the sand itself hides a part of the sky behind it
        uniforms: { uTime: time, uLavaLit: L.uLavaLit, uGain: { value: (calm ? 0.62 : 0.65 + 0.5 * wind) * H.lava * 0.55 },   // (polish 2: thinner; where the crest winds this sheet is seen face-on and must stay a breath of glow, never a lit wall)
          uDawn: { value: DAWN_K * H.scatter * bandLum }, uDawnDir: { value: sky.sunDirection.clone().normalize() }, uBandPow: { value: BAND_POW },
          uSand: { value: paleCol.clone().lerp(sandCol, 0.4) }, uSkyUp: L.uSkyUp },   // (mend 1) the dawn's light through the veil; the streamers' sand colour and the sky fill
        vertexShader: /* glsl */`
          attribute vec3 aAlong;
          uniform vec3 uDawnDir;
          varying vec2 vUv; varying float vD, vF, vS;
          void main(){
            vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.), mv = viewMatrix * wp; vD = length(mv.xyz);
            vec3 sight = (cameraPosition - wp.xyz) / max(length(cameraPosition - wp.xyz), 1e-3);
            vF = abs(dot(normalize(mat3(modelMatrix) * aAlong), sight));   // 1: seen along the crest's run, 0: square across it
            vS = 0.5 - 0.5 * dot(sight, uDawnDir);                         // the sky's own 'side': 1 looking through the veil straight at the dawn, 0 with the dawn behind us
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`
          uniform float uTime, uGain, uDawn, uBandPow; uniform vec3 uLavaLit, uSand, uSkyUp;
          varying vec2 vUv; varying float vD, vF, vS;
          ${GLSL_N}
          void main(){
            float v = clamp(vUv.y, 0., 1.), z = clamp(vUv.x, -236., 190.);
            float n = wn2(vec2(z * 0.21 + uTime * 0.5, v * 2.4 - uTime * 0.7)) * 0.6 + wn2(vec2(z * 0.05 - uTime * 0.08, 3.)) * 0.6;
            float top = 0.45 + 0.55 * clamp(wn2(vec2(z * 0.33 - uTime * 0.6, 7.)) * 0.6 + wn2(vec2(z * 0.9 - uTime * 0.9, 11.)) * 0.5, 0., 1.);   // how high the glow reaches here: 0.45 to 1 of the sheet
            float vv = clamp(v / top, 0., 1.);
            float a = (1. - vv) * (1. - vv) * smoothstep(0., 0.06, v) * (0.35 + 0.9 * n) * smoothstep(22., 70., clamp(vD, 0., 1e5));
            a *= (1. - smoothstep(0.55, 0.9, clamp(vF, 0., 1.))) * smoothstep(-236., -205., z) * (1. - smoothstep(150., 190., z));
            float o = clamp(a * 2., 0., 0.9);                                // how much of the sky behind it the sand hides
            gl_FragColor = vec4(uSand * uSkyUp * 0.62 * o + uLavaLit * a * (uGain + uDawn * pow(clamp(vS, 0., 1.), uBandPow)), o);
          }`,
      });
      const rim = new THREE.Mesh(g, m); rim.name = 'crest-rim'; rim.renderOrder = 2; scene.add(rim);
    }
    await ctx.yield();

    // ---- cast: on some visits a second runner, 12 m further along the crest, runs ahead of the first ----
    let runner2 = null;
    const castStates = [rs, { x: A.twin.x, z: A.twin.z, yaw: Math.atan2(-0.7666, -0.6429) }];      // every theropod's place and heading, for the soft shadows under them
    if (twoRunners) {
      runner2 = makeTheropod(hero.runner.mesh.geometry, ['#C98B6B', '#E2B58C', '#2B3350', '#121A33', '#18110F', '#F3C9A0', '#FF6A1F'], L, { name: 'runner2', pale: 0.16, hue: 0.01 });
      runnerU.push(runner2.uniforms);
      scene.add(runner2.mesh);
      const q = {}, st = {}; castStates.push(st);
      const foot = (sg) => hAt(st.x + Math.cos(st.yaw) * 0.118 * sg, st.z - Math.sin(st.yaw) * 0.118 * sg) - st.y;
      updaters.push((dt, t) => {
        hero.script.at(rs.s + 9, q);
        const run = smoothstep(0.05, 1.2, rs.speed), yawRun = q.yaw < 0 ? q.yaw + TAU : q.yaw;
        st.x = q.x; st.z = q.z; st.y = hAt(q.x, q.z); st.yaw = lerp(Math.PI * 0.2, yawRun, Math.max(run, smoothstep(1, 12, rs.s))) - (rs.turn || 0) * Math.PI * 0.38;
        st.speed = rs.speed; st.phase = rs.phase + 0.37; st.time = t + 2.1; st.alert = rs.alert || 0;
        st.look = (1 - run) * (rs.s > 1 ? 0.3 : 0.35) * Math.sin(t * 0.7 + 1.3);
        st.groundL = foot(1); st.groundR = foot(-1);
        runner2.pose(st);
      });
    }
    await ctx.yield();

    // ---- (k1c) the spur's company. Three more of its kind stand on the scoured corridor floor above the bank where the flood
    //      laps the spur. As the wind (we) comes in off the lake the hindmost takes fright and all three turn and RUN up the spur
    //      toward the notch, away from the flood: the design's own run (9 m/s, 1.7 m footfalls planted without sliding, neck
    //      forward, tail level, a puff and a three-toed print at every footfall), in our direction, on lines a few metres to either
    //      side of ours. We climb the spur at the design's 22 m/s easing to 19 and gain on each at 13 to 10 m a second; once
    //      passed, each slows and stops (the design's words for the runner on the crest). A fourth stands on the brow of the bank
    //      to our right, broadside, looking east over the flood (polish 3), and the pale one stands by the ring (the hero part).
    //      Five animals on 150 m of sand: a scattered few. Every place is a place in the world (metres along the corridor) and
    //      every moment follows from one relation (how far off we are when they bolt); nothing here knows a value of u. ----
    const cr = makeRng((Math.imul(Number(ctx.seed) | 0, 0x9E3779B1) ^ 0x51ed27) >>> 0);       // (the corridor cast's own stream: no draw of the world's rng moves)
    // the flight against the corridor, from the last print on (after it we head for the spur): where we are and when, every 0.0005 of u
    const NT = Math.ceil((1 - uPrint) / 0.0005), cU = new Float32Array(NT + 1), cX = new Float32Array(NT + 1), cZ = new Float32Array(NT + 1), cD = new Float32Array(NT + 1), cT = new Float32Array(NT + 1);
    for (let i = 0; i <= NT; i++) {
      const uu = uPrint + (1 - uPrint) * i / NT; path.pointAt(uu, tq);
      cU[i] = uu; cX[i] = tq.x; cZ[i] = tq.z; cD[i] = ddOf(tq.x, tq.z); cT[i] = secAt(uu);
      if (i % 220 === 219) await ctx.yield();
    }
    const iAtDD = (dd) => { let i = 0; while (i < NT && cD[i] > dd) i++; return i; };          // the first moment we are within dd of the ring
    const tAtDD = (dd) => { const i = iAtDD(dd); if (i <= 0 || i >= NT || cD[i - 1] <= cD[i]) return cT[i]; return lerp(cT[i - 1], cT[i], (cD[i - 1] - dd) / (cD[i - 1] - cD[i])); };   // ... and when
    const RUN_V = 9, BRAKE_S = 2.5, BRAKE_M = RUN_V * BRAKE_S * 0.5;                          // the design's run; 2.5 s and 11.25 m to stop (the hero's own figures)
    const ddTwin = ddOf(A.twin.x, A.twin.z), ddStop = ddTwin + 4;          // no runner runs on past the pale one: each is at a stand 4 m short of its place at the latest
    // the shore-watcher: on the brow of the bank on its own line, 3 to 9 m beyond the 4.3 m line (the bank is about 10 m from foot to
    // brow and reaches 4.3 m some 4 m below the brow: so from just under the brow to 5 m back on the level floor)
    const watcher = { name: 'shore-watcher', lat: 5.6, pale: 0.12, hue: 0.004, ph: 0.7, pos: new THREE.Vector3() };
    watcher.dd = bankAt(watcher.lat) - cr.range(3, 9);
    // The three runners (mend 1): where along the corridor we overtake each is DRAWN, phase and spacing both, with no fixed
    // relation to any place of the flight. The floor a runner can be overtaken on at a run is a stretch of the world:
    //   its lower end (aHi) lies RUNUP = 12 m up the corridor from where the hindmost stood on the brow of the bank: it has its
    //   9 m/s from 6 m, so by 12 m it has made three or four footfalls at full stride and has a line of prints behind it;
    //   its upper end (cLo) lies where a runner braking for the pale one is down to half its run: 0.09375 x 9 m/s x 2.5 s = 2.1 m
    //   short of ddStop by the braking law (a runner may slow "short of the twin's place"; none is passed at less than a run's half).
    // That floor (about 111 m) is cut into three equal stretches, one runner's each, and ONE draw (the phase) says how far along
    // its own stretch each of them is overtaken: anywhere from its near end to its far end. So over the seeds every metre of the
    // floor is as likely an overtaking place as every other (replayed: a level count from the bank to the pale one), and in any
    // one film the three come about a stretch apart. Each of the two outer runners then has a draw of its own that moves it up
    // to SWAY = 0.15 of a stretch nearer to or farther from the middle one (turned back at the ends of its own stretch, which
    // leaves every place of the stretch equally likely): so the spacing is drawn too, 0.85 to 1.15 of a stretch (31 to 43 m of
    // floor between overtakings, 17 to 24 m of sand between two running animals). 0.15: at 1.15 of a stretch the next runner is
    // within 20 m of the lens 0.9 s after the one before slid off the frame's edge (the job's bar is a second), and at 0.85 two
    // runners are still farther apart than the design's own pair ("two running 12 m apart").
    const RUNUP = 12, SWAY = 0.15, turnBack = (x) => (x < 0 ? -x : x > 1 ? 2 - x : x);
    const runners = [];
    for (let k = 0; k < 3; k++) {
      // lines 4.7 to 6.2 m from ours, on alternate sides, the hindmost and the foremost on the left (away from the watcher and from the
      // pale one, who stand to the right). 4.7 m: its line may wander 0.7 m, so no runner is ever nearer our line than the job's 4 m
      // (and no point of an animal 1.3 m tall comes inside 3.5 m of a lens 2.2 to 3.3 m over the floor); beyond about 6 m it reaches
      // the edge of a 94 degree picture while still 7 m off and is never large
      runners.push({ name: 'spur-runner-' + 'abc'[k], draw: cr(), lat: (k % 2 ? 1 : -1) * cr.range(4.7, 6.2), wph: cr.range(0, TAU), pale: [0.05, 0.2, 0.1][k], hue: [0.006, -0.008, 0.002][k], pos: new THREE.Vector3() });
    }
    // The hindmost stands on the brow of the bank on its own line, across the corridor from the watcher and by the same rule (3 to
    // 9 m beyond the 4.3 m line, drawn).
    runners[0].start = bankAt(runners[0].lat) - cr.range(3, 9);
    {
      const aHi = runners[0].start - RUNUP, cLo = ddStop + 0.09375 * RUN_V * BRAKE_S, STRETCH = (aHi - cLo) / 3, ph = runners[1].draw;
      runners[0].pass = aHi - STRETCH * turnBack(ph + SWAY * (2 * runners[0].draw - 1));
      runners[1].pass = aHi - STRETCH * (1 + ph);
      runners[2].pass = aHi - STRETCH * (2 + turnBack(ph + SWAY * (2 * runners[2].draw - 1)));
    }
    await ctx.yield();
    // the run: the hero's own start (two walking steps, then up to 9 m/s by 1.6 s); distance and stride phase against run seconds,
    // integrated once (stride length is tied to speed, so no foot slides)
    const goV = (t) => 1.6 * smoothstep(0, 0.2, t) + (RUN_V - 1.6) * smoothstep(0.6, 1.6, t);
    const runTable = (tDec) => {                                              // -> distance S and stride phase PH at every 60th of a second; it brakes from tDec
      const speed = (t) => Math.max(0, goV(t) - RUN_V * smoothstep(tDec, tDec + BRAKE_S, t));
      const N = Math.ceil((Math.min(tDec, 40) + BRAKE_S + 0.1) * 60), S = new Float32Array(N + 1), PH = new Float32Array(N + 1);
      for (let i = 1; i <= N; i++) { const v = speed((i - 0.5) / 60); S[i] = S[i - 1] + v / 60; PH[i] = PH[i - 1] + v / 60 / theropodCycle(v); }
      return { N, S, PH, speed, sAt: (t) => { const f = clamp(t * 60, 0, N), i = Math.min(N - 1, Math.floor(f)); return lerp(S[i], S[i + 1], f - i); } };
    };
    // All three bolt at one moment: when the wind is still so far off that the hindmost, at the design's run, has covered the
    // ground from its standing place to its overtaking place just as we draw level with it. Where the other two stood follows
    // from the same moment and the same run: as far down the corridor from its overtaking place as each runs before we reach it
    // (so they stand, and run, 17 to 24 m from one to the next).
    const T0 = runTable(40);
    let tBolt = tAtDD(runners[0].pass); { const D = runners[0].start - runners[0].pass; let t = 0; while (t < 30 && T0.sAt(t) < D) t += 1 / 120; tBolt -= t; }
    let iBolt = 0; while (iBolt < NT && cT[iBolt] < tBolt) iBolt++;
    for (let k = 1; k < 3; k++) runners[k].start = runners[k].pass + T0.sAt(tAtDD(runners[k].pass) - tBolt);
    await ctx.yield();
    for (const R of runners) {
      // it brakes in time to stop short of the pale one's rise; and once we have passed it, it slows and stops (the design's words).
      // Where we draw level with it is a consequence, found on this seed's path.
      let T = runTable(40), tLine = 40; { let t = 0; while (t < 40 && R.start - T.sAt(t) > ddStop + BRAKE_M) t += 1 / 60; tLine = t; }
      T = runTable(tLine);
      let iPass = iBolt; while (iPass < NT && cD[iPass] > R.start - T.sAt(cT[iPass] - tBolt)) iPass++;
      R.uAbeam = cU[iPass]; R.tDec = Math.min(cT[iPass] - tBolt + 0.3, tLine); R.waits = cT[iPass] - tBolt > tLine;
      if (R.tDec < tLine) T = runTable(R.tDec);
      const { N, S, PH, speed } = T;
      // its line: `lat` from ours, wandering a hand's breadth (0.35 m over 44 m): no animal runs a ruled line
      const latAt = (s) => R.lat + 0.35 * (Math.sin(s / 7 + R.wph) - Math.sin(R.wph));
      R.place = (t, o) => {                                                    // t: its run seconds (0 until they bolt) -> its place, heading, speed and stride
        const f = clamp(t * 60, 0, N), i = Math.min(N - 1, Math.floor(f)), k = f - i, s = lerp(S[i], S[i + 1], k);
        const q = corXZ(R.start - s, latAt(s)), dl = 0.05 * Math.cos(s / 7 + R.wph), yawRun = Math.atan2(HD[0] + RT[0] * dl, HD[1] + RT[1] * dl);
        o.x = q[0]; o.z = q[1]; o.y = hAt(q[0], q[1]); o.s = s; o.phase = lerp(PH[i], PH[i + 1], k); o.speed = speed(clamp(t, 0, N / 60));
        o.yaw = yawRun + Math.sign(R.lat) * 0.4 * Math.PI * (1 - smoothstep(0, 0.95, t));   // standing, it is turned to look back over the flood; it turns away in its first two steps
        return o;
      };
      R.st = R.place(0, {}); castStates.push(R.st);
      // every footfall of its run: { n (even = left foot), t, v } and the animal's place and heading then
      R.feet = []; const fs = {};
      for (let i = 1, n = 1; i <= N; i++) while (PH[i] >= n * 0.5) { const k = (n * 0.5 - PH[i - 1]) / Math.max(1e-6, PH[i] - PH[i - 1]), t = (i - 1 + k) / 60; R.place(t, fs); R.feet.push({ n, t, v: speed(t), x: fs.x, z: fs.z, yaw: fs.yaw }); n++; }
      await ctx.yield();
    }
    const spurMarks = makeRunMarks(dunes, ['#C98B6B', '#E2B58C', '#2B3350', '#121A33', '#18110F', '#F3C9A0', '#FF6A1F'], L, runners.map((R) => R.feet), cr);
    scene.add(spurMarks.prints, spurMarks.puffs);
    await ctx.yield();
    for (const W of [...runners, watcher]) {
      const animal = makeTheropod(hero.runner.mesh.geometry, ['#C98B6B', '#E2B58C', '#2B3350', '#121A33', '#18110F', '#F3C9A0', '#FF6A1F'], L, { name: W.name, pale: W.pale, hue: W.hue });
      animal.uniforms.uLavaDir.value.set(-0.25, -0.7, 0.66).normalize(); animal.uniforms.uLavaI.value = 0.55;
      scene.add(animal.mesh);
      const k = runners.indexOf(W), st = k < 0 ? (W.st = {}) : W.st; if (k < 0) castStates.push(st);
      const foot = (sg) => hAt(st.x + Math.cos(st.yaw) * 0.118 * sg, st.z - Math.sin(st.yaw) * 0.118 * sg) - st.y;
      if (k < 0) { const q = corXZ(W.dd, W.lat); st.x = q[0]; st.z = q[1]; st.y = hAt(q[0], q[1]); st.yaw = Math.atan2(0.94, 0.342) + 0.35; st.speed = 0; st.phase = W.ph; st.alert = 0; W.pos.set(st.x, st.y + 0.8, st.z); }
      updaters.push((dt, t, cam, u) => {
        if (k >= 0) {
          const tr = Math.max(0, secAt(u) - tBolt); W.place(tr, st);
          const calmK = 1 - smoothstep(0.1, 1.5, st.speed);
          st.time = t + 4.2 + k * 2.9; st.alert = smoothstep(0, 0.4, tr); st.look = calmK * 0.3 * Math.sin(t * 0.45 + 0.8 + k * 2.1);
          spurMarks.set(k, st.phase, tr); W.pos.set(st.x, st.y + 0.8, st.z);
        } else { st.time = t + 4.2 + W.ph * 7; st.look = 0.3 * Math.sin(t * 0.45 + 0.8 + W.ph * 5); }
        st.groundL = foot(1); st.groundR = foot(-1);
        animal.pose(st);
      });
      await ctx.yield();
    }
    // The gaze on the spur goes with the company: ONE key for the whole approach (gaze is the flight), whose aim is found afresh at
    // every place from where the animals then are. Each animal ahead draws the eye by its nearness alone: not at all beyond 60 m
    // (there it stands a fortieth of the picture's height), fully from 12 m (a tenth of it), and it is let go between 3 m ahead of
    // us and 1 m behind: 3 m ahead and 5 m to the side it is 59 degrees off our heading, outside the 47 degree half-width of the
    // picture, and is held whole only by turning; past abeam no turn could hold it. Our own heading counts as one such pull
    // and a near animal as four, so the eye is at most 0.9 x 4/5 = 0.72 toward it (replayed: never more than 39 degrees off the heading) and comes
    // back to the line of flight and the next animal as each is passed. The aim blends directions, not places, so a far animal
    // never outweighs a near one, and no key begins or ends at an animal: nothing swings back.
    const gP = new THREE.Vector3(), gT = new THREE.Vector3(), gV = new THREE.Vector3(), gA = new THREE.Vector3(), gOut = new THREE.Vector3(), gS = {};
    const company = [...runners.map((R) => (tr) => R.place(tr, gS)), () => watcher.st, () => A.twin];
    const companyAim = (t, u) => {
      path.pointAt(u, gP); path.tangentAt(u, gT).normalize();
      const tr = Math.max(0, secAt(u) - tBolt);
      gA.copy(gT);
      for (const c of company) {
        const o = c(tr); gV.set(o.x - gP.x, o.y + 0.8 - gP.y, o.z - gP.z);
        const ahead = gV.dot(gT), d = Math.max(gV.length(), 1e-3);
        gA.addScaledVector(gV, 4 * smoothstep(60, 12, ahead) * smoothstep(-1, 3, ahead) / d);
      }
      // (mend 1) ... but never so far round that the ring leaves the picture: the aim is held within TURN = 38 degrees of the line of flight
      // (with the key's weight 0.9 the picture then turns 34 degrees at most; the ring, 14 m across and never nearer than 35 m while
      // an animal still draws the eye, reaches 11.4 degrees to the side: 45.6 of the 47 degree half-picture). A soft limit: turns
      // under 30 degrees are left as they were (changed by less than 2 in 100), larger ones close on 38.
      gA.normalize();
      const ca = clamp(gA.dot(gT), -1, 1), ang = Math.acos(ca);
      if (ang > 1e-4) {
        const TURN = 38 * Math.PI / 180, r = ang / TURN, r2 = r * r, r4 = r2 * r2, lim = ang / Math.sqrt(Math.sqrt(Math.sqrt(1 + r4 * r4)));
        gV.copy(gA).addScaledVector(gT, -ca).normalize(); gA.copy(gT).multiplyScalar(Math.cos(lim)).addScaledVector(gV, Math.sin(lim));
      }
      return gOut.copy(gP).addScaledVector(gA, 20);
    };
    const uCompany = uAtDD(watcher.dd + 70);                                  // the key comes in from where the first of them, the watcher on the bank, is 70 m ahead
    // (k1d) ... and ends one breadth of the ring (two radii, 14 m of route) short of the ring: the pale one, the last of the company,
    // is by then 15 m behind us and there is nothing left beside the ring to look at
    const uCompanyEnd = 1 - 2 * A.portalSeat.radius / path.length;
    await ctx.yield();

    // ---- (polish 4) the witness: one more of its kind stands on the dry sand of the lit slip face, four metres above the
    //      flood, at the end of its own fresh line of prints down the face, looking at the old trackway that walks into the
    //      lava. We come in toward it from the lake and pass it 9 m off. It never moves from dry sand. ----
    {
      const lp = A.lastPrint, st = { x: lp.x - 5.2, z: lp.z + 6.4, yaw: Math.PI - 0.35, speed: 0, phase: 0.3, alert: 0 };
      st.y = hAt(st.x, st.z);
      const wit = makeTheropod(hero.runner.mesh.geometry, ['#C98B6B', '#E2B58C', '#2B3350', '#121A33', '#18110F', '#F3C9A0', '#FF6A1F'], L, { name: 'witness', pale: 0.1, hue: -0.004 });
      wit.uniforms.uLavaDir.value.set(0.72, -0.6, -0.3).normalize(); wit.uniforms.uLavaI.value = 0.95;
      scene.add(wit.mesh); castStates.push(st);
      const foot = (sg) => hAt(st.x + Math.cos(st.yaw) * 0.118 * sg, st.z - Math.sin(st.yaw) * 0.118 * sg) - st.y;
      st.groundL = foot(1); st.groundR = foot(-1);
      updaters.push((dt, t) => { st.time = t + 2.7; st.look = 0.22 + 0.3 * Math.sin(t * 0.5 + 2.1); wit.pose(st); });
    }
    await ctx.yield();
    // ---- (polish 4) a soft shadow on the sand under every theropod (the sky is the light: what it leaves under a body is a
    //      pool of darker blue), so each stands ON the dune instead of being laid over it ----
    {
      const sg = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
      const sm = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
        vertexShader: /* glsl */`
          varying vec2 vQ;
          void main(){ vQ = position.xz * 2.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          varying vec2 vQ;
          void main(){
            // a body's pool (round, under the hips and chest) and the long thin shade of neck and tail
            float body = 1. - smoothstep(0.1, 1., length((vQ - vec2(0., 0.08)) / vec2(0.95, 0.42)));
            float tail = 1. - smoothstep(0.2, 1., length(vQ / vec2(0.34, 1.)));
            float a = clamp(body * body * 0.62 + tail * tail * 0.3, 0., 0.7);
            gl_FragColor = vec4(mix(vec3(1.), vec3(0.3, 0.33, 0.48), a), 1.);
          }`,
      });
      const nrm = new THREE.Vector3(), fw = new THREE.Vector3(), rt = new THREE.Vector3(), mb = new THREE.Matrix4();
      const shadows = castStates.map((st, i) => { const m = new THREE.Mesh(sg, sm); m.name = 'shadow-' + i; m.renderOrder = 2; m.frustumCulled = false; m.scale.set(1.25, 1, 2.9); scene.add(m); return m; });
      updaters.push(() => {
        for (let i = 0; i < shadows.length; i++) {
          const st = castStates[i], m = shadows[i];
          if (!(st.x === st.x) || st.yaw === undefined) { m.position.set(0, -500, 0); continue; }
          dunes.normal(st.x, st.z, nrm); fw.set(Math.sin(st.yaw), 0, Math.cos(st.yaw));
          rt.crossVectors(nrm, fw).normalize(); fw.crossVectors(rt, nrm);
          m.quaternion.setFromRotationMatrix(mb.makeBasis(rt, nrm, fw));
          m.position.set(st.x - fw.x * 0.15, hAt(st.x, st.z) + 0.03, st.z - fw.z * 0.15).addScaledVector(nrm, 0.02);
        }
      });
    }
    await ctx.yield();

    // ---- one look in six: a damp hollow beside the entry slope with twenty knee-high scale-leaved conifer shrubs
    //      (cheirolepid scrub: jointed cord-like shoots, no flowers, no broad leaves) ----
    if (hollow) {
      const br = rng.fork('shrubs');
      const P = [], N = [], C = [], W = [], I = [];
      const cA = new THREE.Color('#6f8f76'), cB = new THREE.Color('#a8bf9a'), cW = new THREE.Color('#6a564c'), tc = new THREE.Color();
      const shoot = (bx, by, bz, dx, dy, dz, len, r, depth) => {             // a tapering jointed shoot of 4 sides, bending upward
        const segs = 4, b0 = P.length / 3; let x = bx, y = by, z = bz;
        for (let j = 0; j <= segs; j++) {
          const t = j / segs, rr = r * (1 - 0.75 * t) * (j % 2 ? 1.25 : 1), ux = dx, uy = dy + t * 0.6, uz = dz, ul = Math.hypot(ux, uy, uz);
          for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + depth, cx = Math.cos(a), cz = Math.sin(a); P.push(x + cx * rr, y, z + cz * rr); N.push(cx, 0.3, cz);
            tc.copy(depth ? cA : cW).lerp(depth ? cB : cA, t); C.push(tc.r, tc.g, tc.b); W.push(Math.max(0, y)); }
          if (j < segs) { for (let i = 0; i < 4; i++) { const a = b0 + j * 4 + i, b = b0 + j * 4 + (i + 1) % 4; I.push(a, a + 4, b, b, a + 4, b + 4); }
            x += ux / ul * len / segs; y += uy / ul * len / segs; z += uz / ul * len / segs; }
          if (depth < 1 && j > 0 && j < segs) for (let q = 0; q < 2; q++) { const a = br.range(0, TAU); shoot(x, y, z, Math.cos(a) * 0.8 + dx * 0.5, 0.5, Math.sin(a) * 0.8 + dz * 0.5, len * 0.45, r * 0.6, depth + 1); }
        }
      };
      for (let i = 0; i < 11; i++) { const a = (i / 11) * TAU + br.range(-0.3, 0.3), sp = br.range(0.35, 0.95); shoot(0, 0, 0, Math.cos(a) * sp, 1, Math.sin(a) * sp, br.range(0.38, 0.62), 0.022, 0); }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); sg.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); sg.setAttribute('aW', new THREE.Float32BufferAttribute(W, 1)); sg.setIndex(I);
      const sm = new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide,
        uniforms: Object.assign(fogU(), { uTime: time, uWind: { value: wind }, uSkyUp: L.uSkyUp, uSkyLow: L.uSkyLow, uRakeDir: L.uRakeDir, uRakeCol: L.uRakeCol }),
        vertexShader: /* glsl */`
          attribute vec3 color; attribute float aW; uniform float uTime, uWind;
          varying vec3 vCol; varying vec3 vN;
          #include <common>
          #include <fog_pars_vertex>
          void main(){
            vec4 w = instanceMatrix * vec4(position, 1.);
            float sw = aW * aW * (0.5 + uWind) * 0.22;
            w.x += sw * (0.6 + 0.4 * sin(uTime * 2.3 + w.z * 1.7 + w.x)) ; w.z += sw * 0.3 * sin(uTime * 1.7 + w.x * 2.1);
            vN = normalize(mat3(instanceMatrix) * normal); vCol = color;
            vec4 mvPosition = viewMatrix * w;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uSkyUp, uSkyLow, uRakeDir, uRakeCol;
          varying vec3 vCol; varying vec3 vN;
          #include <common>
          #include <fog_pars_fragment>
          void main(){
            vec3 n = normalize(vN);
            vec3 col = vCol * (mix(uSkyLow, uSkyUp, n.y * 0.5 + 0.5) * 1.5 + uRakeCol * 2.5 * max(dot(n, uRakeDir), 0.));
            gl_FragColor = vec4(col, 1.);
            #include <fog_fragment>
          }`,
      });
      const shrubs = new THREE.InstancedMesh(sg, sm, 20); shrubs.name = 'scale-leaved-shrubs'; shrubs.frustumCulled = false;
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), T = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < 20; i++) {
        const a = br.range(0, TAU), r = Math.sqrt(br()) * 10, x = -98 + Math.cos(a) * r * 1.5, z = 17 + Math.sin(a) * r * 0.7 + 3, sc = br.range(0.95, 1.7);
        T.set(x, hAt(x, z) - 0.03, z); Q.setFromAxisAngle(Y, br.range(0, TAU)); S.set(sc, sc * br.range(0.85, 1.15), sc);
        shrubs.setMatrixAt(i, M.compose(T, Q, S));
      }
      scene.add(shrubs);
    }
    await ctx.yield();
    //@@PARTS@@

    hero.setProgress(0); hero.update(0, 0, null);
    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: FLIGHT.duration, pace,
      title: 'The Sand Sea Drowns · 134 million years ago',
      ride: 'none', companion: 'none',
      camera: { fov: 62, near: 0.3, far: 14000, lookAhead: 16, sway: 0.5, bank: 0.08, nearThrough: 0.3 },   // (we come in 4.6 m over the west lake's skin, which runs on behind the entry)
      pois: [
        { at: () => runnerAim, from: 0.0, to: uLip - 0.012, weight: 0.9 },
        { at: new THREE.Vector3(125, 4, -300), from: uLip - 0.01, to: uLip + 0.1, weight: 0.85 },   // out over the lip: the whole flood, the next ridge an island in it, the dawn band beyond
        { at: new THREE.Vector3(dunes.ISLETS[0].x + 6, 7, dunes.ISLETS[0].z), from: uTurn - 0.062, to: uTurn - 0.008, weight: 0.5 },   // (polish 4) crossing the long islet's low end: its knife crest and its ring of fire stay in the picture
        { at: A.tongueLip.clone().lerp(A.tongueFoot, 0.5).setY(12), from: uTurn + 0.045, to: uShore - 0.01, weight: 0.8 },      // back toward the home ridge: its slip face a lit wall, the tongue hanging down it
        { at: A.lastPrint.clone().setY(0.3), from: uShore - 0.005, to: uPrint - 0.012, weight: 0.62 },   // the old trackway walking into the lava
        { at: A.tongueLip.clone().lerp(A.tongueFoot, 0.6).setY(7), from: uPrint - 0.012, to: uPrint + 0.045, weight: 0.78 },   // the tongue of slow glowing cloth, 20 m off on the left
        { at: A.whaleback.clone().setY(1.5), from: uPrint + 0.045, to: uPrint + 0.1, weight: 0.4 },
        // (k1c) the company on the spur: see companyAim (one key from 70 m short of the watcher on the bank to one breadth of the ring short of the ring)
        { at: companyAim, from: uCompany, to: uCompanyEnd, weight: 0.9, fade: 0.15 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#CFE0FF', glow: 0.42, revealDistance: 260 },
      post: { exposure: H.exposure, bloom: { strength: 0.7, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.05, contrast: 1.1, tint: '#fff4ea', shadowTint: '#060a1c', vignette: 0.25, grain: 0.03 } },
      update(dt, t, camera, u) {
        time.value = t;
        const hu = timing.heroProgress(u), tr = timing.runTime(u);
        hero.setProgress(hu); hero.setRunTime(tr); hero.update(dt, t, camera);
        hero.script.stateAt(tr, rs); runnerAt.set(rs.x, rs.y + 0.9, rs.z);
        // (polish 5) on the bay's side wall the gaze is held a little above the runner, so the crest and the sky stay in the picture
        { const k = smoothstep(0.035, 0.07, u) * (1 - smoothstep(0.1, 0.15, u)); runnerAim.set(rs.x, rs.y + 0.9 + 0.5 * k, rs.z); }
        // the lava's light on the runner: from the bay behind and below it at the start, from the east lake once it is on the crest
        { const sJ = hero.script.sJoin, k0 = 1 - smoothstep(4, 40, rs.s), kb = 1 - smoothstep(sJ - 40, sJ - 4, rs.s);   // k0: beside the bay; kb: on the flank, the west lake behind and below it
          for (const ru of runnerU) { ru.uLavaDir.value.set(lerp(0.62, lerp(-0.85, -0.25, k0), kb), lerp(-0.78, -0.42, kb), lerp(0.05, lerp(0.3, 0.83, k0), kb)).normalize(); ru.uLavaI.value = lerp(0.6, lerp(0.5, 1.1, k0), kb); } }
        // (polish 2) the dawn's own light grows through the flight, and on the spur, open to the east, it rakes the sand:
        // east-leaning faces and the animals' flanks take rose-gold, west-leaning ones stay blue
        L.uRakeCol.value.copy(rake0).multiplyScalar(1 + 0.35 * u + 1.2 * smoothstep(uCor - 0.08, uCor + 0.04, u));
        camera.getWorldPosition(camPos); camera.getWorldDirection(camDir);
        { const e = Math.max(camDir.x, 0) / Math.max(Math.hypot(camDir.x, camDir.z), 1e-3); scene.fog.color.copy(fogBase).lerp(fogEast, 0.85 * e * Math.sqrt(e)); }
        ctx.renderer.getDrawingBufferSize(res);
        sky.update(dt, t, camera);
        for (let i = 0; i < updaters.length; i++) updaters[i](dt, t, camera, u, hu);
      },
      dispose() { sky.dispose(); for (const d of disposables) d.dispose(); },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// A hopper: a mouse-sized ricochetal mammal known only from its paired prints. Model space: +z forward, y up,
// ground y 0, metres. Egg body, wedge head with big ears and a dark eye bead, long hind feet under a round thigh,
// tiny forelimbs held to the chest, a long tail with a dark tuft. aPart = (part, weight): 0 body, 1 hind leg
// (swings about the hip), 2 tail (weight grows to the tip), 3 ear, 4 head.
// ---------------------------------------------------------------------------------------------
function buildHopperGeometry() {
  const P = [], N = [], C = [], A = [], I = [];
  const buff = new THREE.Color('#B98A6E'), pale = new THREE.Color('#F3C9A0'), dark = new THREE.Color('#2a1c1a'), pink = new THREE.Color('#c99a8c'), tmp = new THREE.Color();
  // an ellipsoid with a taper along z (front narrower when taper > 0), counter-shaded unless a flat colour is given
  function blob(cx, cy, cz, rx, ry, rz, o = {}) {
    const lon = o.lon || 7, lat = o.lat || 5, base = P.length / 3, rot = o.pitch || 0, cr = Math.cos(rot), sr = Math.sin(rot);
    for (let j = 0; j <= lat; j++) {
      const v = j / lat, th = v * Math.PI, zz = Math.cos(th), rr = Math.sin(th);
      const tp = 1 - (o.taper || 0) * zz * 0.5;
      for (let i = 0; i <= lon; i++) {
        const ph = (i / lon) * TAU, nx = Math.cos(ph) * rr, ny = Math.sin(ph) * rr;
        let x = nx * rx * tp, y = ny * ry * tp, z = zz * rz;
        const y2 = y * cr - z * sr, z2 = y * sr + z * cr;                // pitch about x
        P.push(cx + x, cy + y2, cz + z2);
        const n = new THREE.Vector3(nx / rx, (ny * cr) / ry - (zz * sr) / rz, (ny * sr) / ry + (zz * cr) / rz).normalize();
        N.push(n.x, n.y, n.z);
        if (o.color) tmp.copy(o.color); else tmp.copy(pale).lerp(buff, smoothstep(-0.35, 0.3, n.y)).multiplyScalar(0.9 + 0.1 * Math.sin(i * 2.1 + j * 1.3));
        C.push(tmp.r, tmp.g, tmp.b);
        A.push(o.part || 0, o.weight != null ? o.weight : (o.part === 2 ? clamp((cz - z2 * 1 - 0.05) / -0.14, 0, 1) : 1));
      }
    }
    for (let j = 0; j < lat; j++) for (let i = 0; i < lon; i++) { const a = base + j * (lon + 1) + i, b = a + lon + 1; I.push(a, a + 1, b, a + 1, b + 1, b); }
  }
  blob(0, 0.058, -0.004, 0.031, 0.034, 0.056, { taper: 0.35, lon: 8, lat: 6, pitch: -0.18 });                    // body, haunches heavier than the chest
  blob(0, 0.079, 0.058, 0.02, 0.021, 0.03, { taper: 0.75, part: 4, lon: 8, lat: 5, pitch: 0.12 });              // wedge head
  blob(0, 0.071, 0.088, 0.005, 0.005, 0.005, { color: pink, part: 4, lon: 4, lat: 3 });                           // nose
  for (const s of [-1, 1]) {
    blob(s * 0.016, 0.111, 0.044, 0.013, 0.024, 0.0045, { part: 3, lon: 6, lat: 4, pitch: -0.35, color: s < 0 ? buff : buff });   // big upright ears
    blob(s * 0.016, 0.111, 0.0475, 0.008, 0.017, 0.002, { part: 3, lon: 5, lat: 3, pitch: -0.35, color: pink });
    blob(s * 0.0185, 0.084, 0.066, 0.0062, 0.0062, 0.0062, { color: dark, part: 4, lon: 5, lat: 3 });             // eye bead
    blob(s * 0.027, 0.045, -0.012, 0.013, 0.025, 0.024, { part: 0, lon: 6, lat: 4 });                             // thigh
    blob(s * 0.023, 0.009, 0.012, 0.007, 0.006, 0.036, { part: 1, lon: 5, lat: 4, color: pale });                 // long hind foot
    blob(s * 0.012, 0.041, 0.047, 0.004, 0.012, 0.004, { part: 0, lon: 4, lat: 3, color: pale, pitch: 0.5 });     // forelimb, tucked
  }
  // tail: a thin tube curving back and up, dark tuft at the tip
  const rings = 7, sides = 5, tb = P.length / 3;
  for (let j = 0; j <= rings; j++) {
    const t = j / rings, z = -0.052 - t * 0.135, y = 0.05 + t * t * 0.05, r = lerp(0.0055, 0.003, t);
    for (let i = 0; i <= sides; i++) { const ph = (i / sides) * TAU, nx = Math.cos(ph), ny = Math.sin(ph); P.push(nx * r, y + ny * r, z); N.push(nx, ny, 0); tmp.copy(buff).lerp(dark, smoothstep(0.7, 0.9, t)); C.push(tmp.r, tmp.g, tmp.b); A.push(2, t); }
  }
  for (let j = 0; j < rings; j++) for (let i = 0; i < sides; i++) { const a = tb + j * (sides + 1) + i, b = a + sides + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
  blob(0, 0.101, -0.195, 0.008, 0.009, 0.021, { color: dark, part: 2, weight: 1, lon: 5, lat: 4, pitch: -0.5 });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(A, 2));
  g.setIndex(I);
  return g;
}
