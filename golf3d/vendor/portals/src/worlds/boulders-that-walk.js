// THE WALKING BOULDERS · 30,000 years ago. The glacial Pampas on a midwinter morning, flown as a burrowing owl:
// a field of frost-white boulders among silver pampas plumes that turn out to be sleeping glyptodonts, a ground sloth
// reared into a thorn tree against the sun, then a shallow lagoon skinned with ice where a dozen more already wade.
// Entry heading is north (-Z); the sun stands in the north-east, 50 degrees right of it and 11 degrees up.
// Weather by seed: hoar frost (default), a grey still day after light snow, a dry windy day without frost.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makePath } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import { buildHero, buildSlothTree, makeGlyptodonts, makeShared, buildGlyptodontGeometryAsync, makeShadows, makeFrostFx,
  makeSilhouetteMaterial, buildAlgarroboGeometry, makeAnimalMaterial } from '../parts/boulders-that-walk.js';

const TAU = Math.PI * 2;
const DUR = 48;
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// the three weathers: palette (the hero's seven: frost, shadow blue, horn, straw, plume, dark, accent), sky and light
const WEATHER = {
  frost: {
    pal: ['#DDE6EA', '#8FA3C4', '#6B5B4B', '#C9B48A', '#F3E3C3', '#2F3B45', '#F29A4B'],
    sunEl: 11, sunAz: 50, zenith: '#5E86B8', mid: '#7F9CC0', horizon: '#8AA5C8', scatter: '#EADFCB', scatterAmt: 0.85,
    sun: '#FFCC90', key: 4.0, hemi: 1.02, hemiSky: '#9DB8EC', hemiGround: '#8C8478', fog: '#D6DDE6', fogD: 0.0011,
    frostAmt: 1, ground: ['#7A6850', '#C2DEF0'], frostAlb: 0.97, frostCover: 0.77, thatch: '#A69870', sward: 0.0, shadow: [0.46, 0.55, 0.79], shadowOp: 0.9, cirrus: 0.34,
    straw: '#C9B48A', plume: '#F3E3C3', rime: 0.75, wind: 0.6, water: '#6F8FB8', exposure: 0.86, fill: 1.12,
  },
  snow: {
    pal: ['#E6EAEE', '#8E9DB8', '#6B5B4B', '#B79A66', '#E6D8BC', '#2F3B45', '#F0BE78'],
    sunEl: 14, sunAz: 50, zenith: '#5F6E88', mid: '#8796AE', horizon: '#C2C0B8', scatter: '#F4DCA8', scatterAmt: 0.8,
    sun: '#FFE4BC', key: 2.35, hemi: 1.1, hemiSky: '#B2BFD6', hemiGround: '#968E84', fog: '#C4C9D2', fogD: 0.0019,
    frostAmt: 1, ground: ['#7A6C5C', '#E2E7EE'], frostCover: 0.73, thatch: '#8E7E62', sward: -0.08, shadow: [0.58, 0.65, 0.82], shadowOp: 0.72, cirrus: 0,
    straw: '#B79A66', plume: '#E6D8BC', rime: 0.3, wind: 0.25, water: '#7F8DA2', exposure: 0.86, fill: 0.85,
  },
  wind: {
    pal: ['#CDB994', '#9AA3B4', '#6B5B4B', '#C7A56A', '#EFD9AE', '#33382F', '#F29A4B'],
    sunEl: 19, sunAz: 47, zenith: '#5B84B4', mid: '#8FA6BC', horizon: '#C9C0A8', scatter: '#F0DDB4', scatterAmt: 0.85,
    sun: '#FFDCAE', key: 3.5, hemi: 0.9, hemiSky: '#A9BAD4', hemiGround: '#9A8E78', fog: '#D9CFB4', fogD: 0.0019,
    frostAmt: 0.5, ground: ['#7E7264', '#B9AD98'], frostCover: 0.36, thatch: '#C09A58', sward: 0.1, shadow: [0.55, 0.58, 0.70], shadowOp: 0.8, cirrus: 0.5,
    straw: '#C7A56A', plume: '#EFD9AE', rime: 0, wind: 1.6, water: '#6C8AA8', exposure: 0.84, fill: 0.85,
  },
};

// pace(u): hurry in, linger through the rise and beside the sloth, hurry over the lagoon, ease to 1 at the ring
const pace = (u) => 1.3 - 0.6 * smoothstep(0.09, 0.15, u) + 0.1 * smoothstep(0.32, 0.38, u) + 0.5 * smoothstep(0.52, 0.6, u)
  - 0.2 * smoothstep(0.80, 0.88, u) - 0.1 * smoothstep(0.90, 0.99, u);

export default {
  id: 'boulders-that-walk',
  name: 'The Walking Boulders',
  category: 'prehistoric',
  weirdness: 0.5,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();

    // ---- what this visit is ------------------------------------------------------------------------------------
    const vr = rng.fork('visit');
    const wRoll = vr();
    const weather = wRoll < 0.46 ? 'frost' : wRoll < 0.73 ? 'snow' : 'wind';
    const W = { ...WEATHER[weather] };
    const nDoedField = vr.int(3, 5), nDoedLagoon = vr.int(2, 5);            // with the patch's one or two: 6 to 12 in all
    const slothYoung = vr.chance(0.4), toxodon = vr.chance(0.4), rare = !!vary.rare;
    if (vary.hour === 'dawn' && weather !== 'snow') { W.sunEl = 7; W.sun = '#FFCE96'; W.key *= 0.92; }
    if (vary.hour === 'day' && weather === 'frost') { W.sunEl = 15; }
    const pal = W.pal;
    const sunAz = W.sunAz * Math.PI / 180, sunEl = W.sunEl * Math.PI / 180;
    const sunDir = new THREE.Vector3(Math.sin(sunAz) * Math.cos(sunEl), Math.sin(sunEl), -Math.cos(sunAz) * Math.cos(sunEl)).normalize();

    // ---- the route: 400 m. North through the field, 20 degrees right past the tree, 75 left over the lagoon ----------
    const AX = -0.819, AZ = -0.574;                  // the last straight: heading 55 degrees left of north
    const S0x = 28.1, S0z = -253.1;                       // where the straight begins
    const along = (d, y) => [S0x + AX * d, y, S0z + AZ * d];
    const WATER = -1.3;
    const path = makePath([
      // straight in; lean right round the first riser (84 m); swing left and fly north-west down the file of walkers, side-lit;
      // then north-east, straight at the sun and the tree, past the sloth, and a wide left turn down to the lagoon
      [0, 6.4, 0], [0, 5.9, -10], [-0.3, 3.7, -22], [-1.3, 1.95, -32.5], [-2.1, 1.5, -39.5], [-0.9, 1.52, -50], [0.8, 1.66, -59.5], [1.0, 1.72, -66], [0.3, 1.58, -73.5], [-0.9, 1.6, -78.5], [0.4, 1.7, -85], [3.4, 1.62, -93], [6.0, 1.42, -101], [6.5, 1.3, -112],
      [2, 1.36, -122.5], [-6, 1.45, -131.5], [-14, 1.45, -140.5], [-19.5, 1.45, -151.5], [-19, 1.55, -164.5], [-12, 2.0, -177], [-3, 2.2, -191], [5, 2.4, -204.5],
      [12.8, 2.5, -217.5], [21.5, 2.6, -230.5], [26.5, 2.55, -243], [23.5, 2.3, -255],
      along(12, 1.7), along(36, 0.62), along(52, 0.38), along(84, 0.5), along(98, 1.4), along(112, 3.0), along(126, 4.3), along(146, 5.6), along(170, 6.8),
    ]);
    const timeTab = new Float32Array(129);
    { let acc = 0; for (let i = 1; i <= 128; i++) { acc += 1 / (128 * pace((i - 0.5) / 128)); timeTab[i] = acc; }
      for (let i = 1; i <= 128; i++) timeTab[i] *= DUR / acc; }
    const timeOfU = (u) => { const f = clamp(u, 0, 1) * 128, i = Math.min(127, Math.floor(f)); return lerp(timeTab[i], timeTab[i + 1], f - i); };

    // ---- the land: level silt, a bank down to the lagoon, a grassy spit, pale dunes behind --------------------------
    const stToWorld = (s, t) => [S0x + AX * s - AZ * t, S0z + AZ * s + AX * t];
    const lagoonST = (x, z) => [(x - S0x) * AX + (z - S0z) * AZ, (x - S0x) * -AZ + (z - S0z) * AX];
    const waterDepthAt = (x, z) => {                 // > 0 inside the lagoon: metres from the nearest bank
      const [s, t] = lagoonST(x, z), at = Math.abs(t);
      const near = 15 + 7 * noise.n2(t * 0.012, 3.1) + 3 * noise.n2(t * 0.05, 9.7);
      const far = 107 + 6 * noise.n2(t * 0.02, 5.3) + 5.5 * noise.n2(t * 0.085, 2.9) + 2.2 * noise.n2(t * 0.27, 6.1) + 170 * smoothstep(26, 85, at + 8 * noise.n2(s * 0.03, 1.7));
      return Math.min(s - near, far - s, 265 - at + 20 * noise.n2(s * 0.01, 7.7));
    };
    // how far a place is from the route (to 5 m): the land within 30 m of it stays level, for animals and long shadows lie on y = 0
    const routeXZ = []; { const v = new THREE.Vector3(); for (let i = 0; i <= 84; i++) { path.pointAt(i / 84, v); routeXZ.push(v.x, v.z); } }
    const routeDist = (x, z) => { let m = 1e9; for (let i = 0; i < routeXZ.length; i += 2) { const dx = x - routeXZ[i], dz = z - routeXZ[i + 1], q = dx * dx + dz * dz; if (q < m) m = q; } return Math.sqrt(m); };
    // the spit is the toe of a low dune: it climbs 2.6 m from the far bank to the ring, which stands in its grass (the route climbs with it)
    const SLOPE = { s0: 112, s1: 166, H: 2.6, tw: 20 };
    const riseU = { uRiseA: { value: new THREE.Vector4(S0x, S0z, AX, AZ) }, uRiseB: { value: new THREE.Vector4(SLOPE.s0, SLOPE.s1, SLOPE.H, SLOPE.tw) } };
    const heightAt = (x, z) => {
      const d = waterDepthAt(x, z), [s, t] = lagoonST(x, z);
      let h = -1.72 * smoothstep(-7, 5, d);
      h += SLOPE.H * smoothstep(SLOPE.s0, SLOPE.s1, s) * (1 - smoothstep(SLOPE.tw, SLOPE.tw + 26, Math.abs(t))) * (1 - smoothstep(-9, -3, d));
      // dunes of wind-blown silt all round the field, their crests lying across the wind: a skyline with lit faces and blue lees
      const dn = routeDist(x, z), duneK = smoothstep(30, 105, dn) * (1 - smoothstep(-36, -10, d));
      if (duneK > 0) { const a = x * 0.932 + z * 0.362, b = -x * 0.362 + z * 0.932;
        const crest = noise.n2(a * 0.017 + 0.7 * noise.n2(b * 0.006, 4.4), b * 0.0052);
        h += duneK * (0.8 + 4.2 * smoothstep(-0.45, 0.75, crest) + 1.3 * noise.fbm2(x * 0.021, z * 0.021, 2)) * (0.55 + 1.25 * smoothstep(70, 240, dn)); }
      h += smoothstep(330, 520, s) * (14 + 8 * noise.n2(x * 0.004, z * 0.004) + 2.5 * noise.n2(x * 0.02, z * 0.02)) * (1 - smoothstep(560, 760, s) * 0.6);
      return h;
    };
    await ctx.yield();

    // ---- sky, light, air ---------------------------------------------------------------------------------------
    const groundTone = new THREE.Color(...mix3(lin(W.ground[0]), lin(W.ground[1], 0.80), W.frostCover));
    const sky = makeSky({
      rng, preset: weather === 'snow' ? 'overcast' : 'day', zenith: W.zenith, mid: W.mid, horizon: W.horizon, ground: groundTone,
      horizonPow: 5, scatterColor: W.scatter, scatter: W.scatterAmt, scatterPow: weather === 'snow' ? 5 : 3.2, scatterHigh: 0.06,
      sunElevation: W.sunEl, sunAzimuth: W.sunAz, sunColor: W.sun, sunSize: 0.9, sunIntensity: weather === 'snow' ? 5 : 9,
      sunGlow: weather === 'snow' ? 0.5 : 0.6, sunGlowTight: 0.6,
      clouds: weather === 'snow' ? { coverage: 0.6, softness: 0.42, scale: 1.25, opacity: 0.92, lit: '#EAE4D6', shade: '#586274', wind: [0.003, 0.001] } : false,
      clouds2: W.cirrus > 0 ? { coverage: W.cirrus, stretch: 1, scale: 1.3, opacity: 0.7, softness: 0.5, lit: '#F4EEE2', shade: '#B9C6DA', wind: [0.014, 0.004] } : false,
      fogColor: W.fog, lightElevationMin: 5,
    });
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(W.fog, W.fogD);
    const sun = new THREE.DirectionalLight(W.sun, W.key); sun.position.copy(sunDir).multiplyScalar(100);
    const hemi = new THREE.HemisphereLight(W.hemiSky, W.hemiGround, W.hemi);
    scene.add(sun, sun.target, hemi);
    const uTime = { value: 0 };
    await ctx.yield();

    // ---- the ground: one plane in lagoon-aligned coordinates, fine across the banks, frost and crack shader -----------
    // fine across the banks and the crossing, coarser over the field's dunes and the far water, growing to the horizon
    const axis = (parts, far, grow) => { const a = [parts[0][0]];
      for (const [lo, hi, step] of parts) { const n = Math.max(1, Math.round((hi - lo) / step)); for (let k = 1; k <= n; k++) a.push(lo + (hi - lo) * k / n); }
      let st = parts[parts.length - 1][2], v = a[a.length - 1]; while (v < far) { st *= grow; v += st; a.push(v); }
      st = parts[0][2]; v = a[0]; while (v > -far) { st *= grow; v -= st; a.unshift(v); }
      return a; };
    const gS = axis([[-196, -12, 6.0], [-12, 130, 3.45], [130, 300, 5.6]], 1500, 1.3), gT = axis([[-310, -124, 7.5], [-124, -60, 6.4], [-60, 60, 4.2], [60, 124, 6.4]], 1300, 1.3);
    const ground = await (async () => {
      const ns = gS.length, nt = gT.length, P = new Float32Array(ns * nt * 3), I = [];
      for (let j = 0; j < nt; j++) for (let i = 0; i < ns; i++) {
        if (i === 0 && j % 8 === 7) await ctx.yield();
        const s = gS[i], t = gT[j], x = S0x + AX * s - AZ * t, z = S0z + AZ * s + AX * t, k = (j * ns + i) * 3;
        P[k] = x; P[k + 1] = heightAt(x, z) - 2.6 * smoothstep(1.5, 5, waterDepthAt(x, z)); P[k + 2] = z;   // the drawn bed lies deep, so reflections have room under the surface
      }
      for (let j = 0; j < nt - 1; j++) for (let i = 0; i < ns - 1; i++) { const a = j * ns + i, b = a + 1, c = a + ns + 1, d = a + ns; I.push(a, c, b, a, d, c); }
      await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
      await ctx.yield();
      const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92, metalness: 0 });
      const uni = { uTime, uSilt: { value: new THREE.Color(W.ground[0]) }, uFrost: { value: new THREE.Color(W.ground[1]).lerp(new THREE.Color(0.86, 0.87, 0.88), weather === 'frost' ? 0.45 : 0).multiplyScalar(W.frostAlb ?? 0.84) },
        uCover: { value: W.frostCover }, uThatch: { value: new THREE.Color(W.thatch).lerp(new THREE.Color(0.30, 0.30, 0.30), 0.22).multiplyScalar(1.0) }, uThatchD: { value: new THREE.Color(W.thatch).lerp(new THREE.Color(0.30, 0.30, 0.30), 0.45).multiplyScalar(0.68) }, uSward: { value: W.sward }, uWater: { value: WATER }, uSpark: { value: W.rime > 0 ? 1 : 0 }, uSunW: { value: sunDir.clone() } };
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, uni);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.)).xyz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', /* glsl */`#include <common>
          varying vec3 vWp; uniform float uTime, uCover, uWater, uSpark, uSward; uniform vec3 uSilt, uFrost, uSunW, uThatch, uThatchD; float gBump, gFrostK; vec3 gGlint; vec2 gTilt, gQ;
          float gh21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          // the same for fine layers: the lattice is wrapped so that the hash keeps its precision far from the origin
          float ghF(vec2 i){ i = mod(i, 289.); return fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453); }
          float gvnF(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
            return mix(mix(ghF(i), ghF(i + vec2(1., 0.)), f.x), mix(ghF(i + vec2(0., 1.)), ghF(i + vec2(1., 1.)), f.x), f.y); }
          float gvn(vec2 p){ return gvnF(p); }
          const mat2 gR1 = mat2(0.8, 0.6, -0.6, 0.8), gR2 = mat2(0.28, 0.96, -0.96, 0.28);      // each octave turned, so no grid shows
          float gfb(vec2 p){ return gvn(p) * 0.52 + gvn(gR1 * p * 2.07 + 5.3) * 0.31 + gvn(gR2 * p * 4.3 + 1.7) * 0.17; }
          // where last summer's bunch grass lies in mats and where the frost lies open: the same sum of bent waves the world places its tussocks by
          float gSward(vec2 p, float fw){ float k = 1. - smoothstep(1.2, 4., fw);
            float a = sin(p.x * 0.34 + 1.9 * sin(p.y * 0.151 + 1.0) + 0.6), b = sin(p.y * 0.41 + 1.6 * sin(p.x * 0.187 + 2.0) + 2.1);
            float c = sin((p.x * 0.8 - p.y * 0.6) * 0.93 + 1.3 * sin((p.x * 0.6 + p.y * 0.8) * 0.37)), d = sin((p.x * 0.6 + p.y * 0.8) * 1.57 + 1.5 * sin((p.x * 0.8 - p.y * 0.6) * 0.53 + 1.));
            return 0.5 + 0.17 * a + 0.17 * b + (0.13 * c + 0.09 * d) * k; }
          float gHill(vec2 p){ return gfb(gR1 * p * 0.075) + 0.30 * gvn(gR2 * p * 0.27); }
          // frost-heaved silt: distance to the nearest crack of a field of polygons
          float gcrack(vec2 p){ vec2 ip = floor(p), fp = fract(p); float d1 = 8., d2 = 8.;
            for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = vec2(float(i), float(j));
              vec2 q = o + vec2(gh21(ip + o), gh21(ip + o + 17.3)) - fp; float d = dot(q, q);
              if (d < d1) { d2 = d1; d1 = d; gQ = q; } else if (d < d2) d2 = d; }
            return sqrt(d2) - sqrt(d1); }`)
          .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
          { vec2 p = vWp.xz; vec2 fwp = fwidth(p); vec2 dpx = dFdx(p), dpy = dFdy(p);
            // metres of ground under one pixel, by the footprint's AREA (a grazing view stretches it one way only: fading by its long side wiped all near detail)
            float fw = min(max(fwp.x, fwp.y), 1.5 * sqrt(abs(dpx.x * dpy.y - dpx.y * dpy.x)) + 0.004);
            float nearK = 1. - smoothstep(0.05, 0.22, fw), closeK = 1. - smoothstep(0.008, 0.03, fw), midK = 1. - smoothstep(0.3, 1.1, fw);
            float big = gfb(p * 0.019 + 3.);
            float mid = mix(0.5, gfb(gR1 * p * 0.37 + 3.), midK);
            float fine = mix(0.5, gfb(gR2 * p * 3.3), 1. - smoothstep(0.012, 0.045, fw)), grit = mix(0.5, gvn(gR1 * p * 23.), 1. - smoothstep(0.004, 0.012, fw));
            // swales of dead bunch-grass thatch, tawny under the hoar, between cleaner frost: the plain has bands of tone to the horizon
            float hh = gHill(p), drift = mix(0.5, gfb(gR2 * p * 0.11 + 7.), 1. - smoothstep(1.5, 6., fw));
            float tc = gcrack(p * 3.1 + 0.9 * vec2(gvn(p * 2.1), gvn(p * 2.1 + 4.)));            // tussock clumps a foot across
            vec2 tq = gQ + vec2(0.9, 0.35) * 0.13; float fwM = max(fwp.x, fwp.y), fwC = mix(fw, fwM, 0.75), tcK = 1. - smoothstep(0.02, 0.085, fwC), tuss = mix(0.5, smoothstep(0.0, 0.62, tc), tcK);
            float midE = mix(0.5, mid, 1. - smoothstep(0.08, 0.35, fwM));
            float tArg = (midE - 0.5) * 0.3 + (big - 0.5) * 0.3 + (drift - 0.5) * 0.2 + uSward;
            float eW = clamp(0.014 + 0.22 * fwM, 0.02, 0.10); vec2 sunH = uSunW.xz / max(length(uSunW.xz), 1e-3);
            float sw0 = gSward(p, fw) + tArg, swS = gSward(p + sunH * 0.5, fw) + tArg, swF = gSward(p + sunH * 1.3, fw) + tArg;
            // the edge of a mat is a ragged line of tussocks with frost lying between them, never a smooth contour
            float streak = mix(0.5, gvn(gR1 * p * 6.3), 1. - smoothstep(0.03, 0.12, fwC));
            float rag = ((gfb(gR1 * p * 1.15 + 5.) - 0.5) * 0.30 + (gvn(gR2 * p * 4.9 + 2.) - 0.5) * 0.10 + (streak - 0.5) * 0.06) * (1. - smoothstep(0.12, 0.7, fwM));
            float eT = clamp(0.008 + 0.22 * fwM, 0.012, 0.10);
            float thatch = smoothstep(0.49 - eT, 0.49 + eT, sw0 + rag);
            // a mat stands a hand high: its sunward edge is lit straw, and it lays blue shade on the frost behind it
            float edgeK = 1. - smoothstep(0.5, 2.5, fwM);
            float matLit = thatch * (1. - smoothstep(0.47 - eW, 0.47 + eW, swS)) * edgeK;
            float matShade = (1. - thatch) * max(smoothstep(0.49 - eW, 0.49 + eW, swS), 0.6 * smoothstep(0.50 - eW, 0.50 + eW, swF)) * edgeK;
            // the blades themselves, laid over by the wind: fine light and dark threads across the mats
            vec2 bw = p + 0.5 * vec2(gvn(gR2 * p * 2.3), gvn(gR1 * p * 2.3 + 5.));      // warped, so the lattice of the noise never shows as a weave
            float blade = mix(0.5, 0.5 * gvnF(gR1 * bw * vec2(19., 11.)) + 0.5 * gvnF(gR2 * bw * vec2(12., 23.) + 7.), 1. - smoothstep(0.008, 0.035, fwC));
            // bare frozen silt: small places among the tufts, their edges feathered with crystals
            float patchN = mix(0.5, gfb(gR2 * p * 0.55 + 11.), 1. - smoothstep(0.5, 2.2, fw));
            float tAc = dot(p, vec2(0.707, -0.707)) + 9. * gvn(p * 0.035 + 2.) + 2.2 * gvn(p * 0.13), tCell = floor(tAc / 13.), tD = abs(fract(tAc / 13.) - 0.5) * 13.;
            float trail = (1. - smoothstep(0.35, 0.95 + 0.5 * mid, tD)) * step(0.45, gh21(vec2(tCell, 7.))) * smoothstep(0.25, 0.5, gvn(p * 0.02 + tCell)) * (1. - smoothstep(1.2, 4.0, fw));
            float cover = uCover + (patchN - 0.5) * 1.55 + (mid - 0.5) * 0.25 + (fine - 0.5) * 0.5 * nearK - 0.62 * trail * (0.6 + 0.8 * fine);
            float fr = smoothstep(0.24, 0.50, cover); fr = max(fr, uSpark * (0.66 - 0.5 * trail));       // on a frost morning bare silt shows only as greyer frost and along the trails: never a dark hole
            float ck = gcrack(p * 2.1 + 0.9 * vec2(gvn(p * 0.8), gvn(p * 0.8 + 9.)));
            float crack = (1. - smoothstep(0.02, 0.08, ck)) * (1. - smoothstep(0.012, 0.05, fw)) * (1. - 0.92 * fr);
            vec3 silt = mix(uSilt, uFrost, 0.34 + 0.24 * fine) * (0.80 + 0.30 * mid + 0.12 * (grit - 0.5)) * (1. - 0.13 * crack);
            vec3 frost = uFrost * (0.90 + 0.10 * mid + 0.10 * (fine - 0.5) + 0.10 * (grit - 0.5));
            thatch *= 1. - 0.75 * trail;
            vec3 sward = mix(uThatchD, uThatch, clamp(0.45 + 0.10 * (streak - 0.5) + 0.5 * (mid - 0.5) + 0.3 * (big - 0.5), 0., 1.)) * (0.96 + 0.10 * (fine - 0.5));
            sward = mix(sward, uFrost * 0.94, uSpark * 0.34 * smoothstep(0.55, 0.9, blade + (fine - 0.5) * 0.6));      // rime along the blade tops
            // the mats are made of tussocks: round clumps a foot across with dark gaps between, so the near ground is cobbled, not smeared
            // each tussock from above is a whorl of blades laid over by the wind, their outer ends rimed: fibres, not cobbles
            float tr = length(tq), fib = mix(0.5, gvnF(vec2(atan(tq.y, abs(tq.x) < 1e-5 ? 1e-5 : tq.x) * 4.5 + 6. * gvn(p * 1.3), tr * 5. + 3.)), tcK);
            sward *= (0.82 + 0.40 * fib) * (0.86 + 0.20 * tuss);
            sward = mix(sward, uFrost * 0.92, uSpark * 0.5 * smoothstep(0.52, 0.86, fib) * smoothstep(0.08, 0.3, tr) * tcK);
            sward *= 1. + 0.55 * matLit;
            // frost: a wind crust in scallops, greyer where it is thin, and blue where a mat shades it
            float crust = mix(0.5, gvn(vec2(dot(p, vec2(0.93, 0.36)) * 2.4 + 2.5 * gvn(p * 0.4), dot(p, vec2(-0.36, 0.93)) * 0.9)), 1. - smoothstep(0.12, 0.5, fw));
            frost *= 0.84 + 0.30 * crust; frost = mix(frost * vec3(0.84, 0.91, 1.03), frost, smoothstep(0.25, 0.7, crust));
            { vec2 ps = p + sunH * 0.24;         // raised plates of crust with a crisp edge, each laying a thin blue shade away from the sun
              float crS = mix(0.5, gvn(vec2(dot(ps, vec2(0.93, 0.36)) * 2.4 + 2.5 * gvn(ps * 0.4), dot(ps, vec2(-0.36, 0.93)) * 0.9)), 1. - smoothstep(0.12, 0.5, fw));
              float eS = 0.03 + 0.5 * fw, sas = smoothstep(0.52 - eS, 0.52 + eS, crust), sasS = smoothstep(0.52 - eS, 0.52 + eS, crS);
              frost *= mix(0.88, 1.08, sas); frost *= mix(vec3(1.), vec3(0.52, 0.64, 0.93), clamp(sasS - sas, 0., 1.)); }
            frost *= mix(vec3(1.), vec3(0.50, 0.62, 0.90), matShade * 0.85);
            frost = mix(frost, sward, thatch);
            vec3 c = mix(silt, frost, fr) * (0.84 + 0.24 * smoothstep(0.35, 0.95, hh)) * (1. - 0.2 * trail);
            // the bank: wet dark silt at the waterline, olive mud below it
            float wet = 1. - smoothstep(uWater + 0.05, uWater + 0.55, vWp.y);
            c = mix(c, uSilt * vec3(0.34, 0.36, 0.38) * (0.7 + 0.6 * mid), wet * 0.92);
            diffuseColor.rgb = c; gBump = ((fine * 0.5 + grit * 0.5 + mid * 0.4) * (1. - 0.65 * thatch) + (tuss * 0.25 + fib * 0.3 + blade * 0.2) * thatch + crust * 0.5 * (1. - thatch)) * nearK; gFrostK = fr * (1. - wet);
            // hummocks the eye reads by their light: the low sun rakes them, the far sides lie in blue shade
            float h0 = hh, flat_ = 1. - smoothstep(uWater + 0.5, uWater + 1.1, vWp.y);
            gTilt = -vec2(gHill(p + vec2(0.7, 0.)) - h0, gHill(p + vec2(0., 0.7)) - h0) * (2.4 * (1. - smoothstep(2.0, 9.0, fw)))
              - vec2(0.93, 0.36) * cos(dot(p, vec2(0.93, 0.36)) * 1.15 + 5.0 * gvn(p * 0.11 + 2.)) * (0.35 + 0.65 * gvn(p * 0.05 + 8.)) * 0.10 * (1. - smoothstep(0.25, 1.4, fw))
              - vec2(0.93, 0.36) * cos(dot(p, vec2(0.93, 0.36)) * 5.2 + 3.0 * gvn(p * 0.45)) * (0.5 + 0.5 * gvn(p * 0.17 + 5.)) * 0.22 * (1. - smoothstep(0.03, 0.14, fw)) * fr * smoothstep(0.30, 0.56, gvn(p * 0.09 + 5.));
            gTilt *= (1. - flat_ * 0.8) * (1. - wet) * (1. - 0.6 * thatch);
            gTilt /= max(1., length(gTilt) / 0.4);          // a lee side is blue shade, never a black hole: the low sun still grazes it
            vec2 gc = floor(p * 31.); float hs = gh21(gc), tw = sin(uTime * (0.6 + hs) + hs * 60.);
            gGlint = uFrost * uSpark * smoothstep(0.962, 1., hs) * smoothstep(0.5, 1., tw) * fr * (1. - wet) * 1.8 * closeK; }`)
          .replace('#include <normal_fragment_maps>', /* glsl */`#include <normal_fragment_maps>
          // hoar crystals stand up and catch a low sun that flat ground would miss: lean the shading normal toward it
          normal = normalize(normal + (viewMatrix * vec4(uSunW * (0.16 + 0.17 * gFrostK) + vec3(gTilt.x, 0., gTilt.y), 0.)).xyz);
          { vec3 sp = -vViewPosition; vec2 dH = vec2(dFdx(gBump), dFdy(gBump)) * 0.05; vec3 sX = dFdx(sp), sY = dFdy(sp);
            vec3 R1 = cross(sY, normal), R2 = cross(normal, sX); float fDet = dot(sX, R1);
            vec3 pert = dH.x * R1 + dH.y * R2; pert *= min(1., 0.4 * abs(fDet) / max(length(pert), 1e-9));      // a clump's side leans, it never turns its back on the sun: no black bars at arm's length
            vec3 nn = abs(fDet) * normal - sign(fDet) * pert; if (dot(nn, nn) > 1e-14) normal = normalize(nn); }`)
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += gGlint;');
      };
      mat.customProgramCacheKey = () => 'btw-world-ground';
      const m = new THREE.Mesh(g, mat); m.name = 'btw-land'; m.frustumCulled = false; return m;
    })();
    scene.add(ground);
    await ctx.yield();

    // ---- the far sierras: the old low ranges of the Pampas (Tandilia, Ventania), bare rock and scree, no snow: two blue
    // silhouettes beyond the plain, their sunward faces warm. Drawn in the colour of their distance (no fog on them)
    {
      const P = [], C = [], I = []; let v = 0;
      const haze = new THREE.Color(W.horizon), shade = new THREE.Color(weather === 'wind' ? '#6f7890' : '#4a629a'), lit = new THREE.Color(weather === 'snow' ? '#8f8c90' : '#b98e68');
      const c3 = new THREE.Color();
      for (const [R, H, hz, off, base] of [[2500, 235, weather === 'snow' ? 0.70 : 0.30, 1.7, 0.2], [1560, 105, weather === 'snow' ? 0.5 : 0.12, 8.3, 0.0]]) {
        const N = 300, hAt = (i) => { const a = i / N * TAU, cx = Math.cos(a) * 2.2, cz = Math.sin(a) * 2.2;
          const range = smoothstep(-0.25, 0.5, noise.n2(cx * 0.9 + off, cz * 0.9 - off));          // where a range stands and where the plain runs on
          const rid = smoothstep(-0.7, 0.6, noise.n2(cx * 2.3 + off, cz * 2.3)), jag = noise.n2(cx * 6 + off, cz * 6) * 0.3 + noise.n2(cx * 15, cz * 15 + off) * 0.1;
          const toSun = (Math.cos(a) * sunDir.x + Math.sin(a) * sunDir.z) / Math.hypot(sunDir.x, sunDir.z);       // keep the range low under the sun itself
          return H * Math.max(0.03, (base + range * (0.42 + 0.58 * Math.pow(rid, 0.7)) + 0.14 * jag * range) * (1 - 0.5 * smoothstep(0.2, 0.9, toSun))); };
        for (let i = 0; i <= N; i++) {
          const a = i / N * TAU, x = Math.cos(a) * R - 20, z = Math.sin(a) * R - 200, h = hAt(i), slope = (hAt(i + 1) - hAt(i - 1)) / (H * 0.06);
          // a face whose crest falls away toward the sun's side takes the light; the other lies in blue shade
          const tx = -Math.sin(a), tz = Math.cos(a), sunAlong = tx * sunDir.x + tz * sunDir.z, k = clamp(0.5 - slope * sunAlong * 0.9 + 0.25 * noise.n2(i * 0.31, off), 0, 1);
          for (const [y, kk, hk] of [[-30, 0.35, 1], [h * 0.45, k * 0.7, 0.55], [h, k, 0]]) {
            c3.copy(shade).lerp(lit, kk * 0.8).lerp(haze, clamp(hz + 0.42 * hk, 0, 0.94));
            P.push(x, y, z); C.push(c3.r, c3.g, c3.b); v++; }
          if (i > 0) { const b = v - 6; I.push(b, b + 3, b + 4, b, b + 4, b + 1, b + 1, b + 4, b + 5, b + 1, b + 5, b + 2); }
        }
        await ctx.yield();
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }));
      m.name = 'btw-sierras'; m.frustumCulled = false; m.renderOrder = -0.5; scene.add(m);
    }
    await ctx.yield();

    // ---- THE FIELD GETS UP: the first riser 76 m in, the artist's patch of sleepers just beyond it, the file and 17 more ------
    const L = path.length, HZ = -96;
    const _p = new THREE.Vector3(), _t = new THREE.Vector3();
    const pathFrame = (u) => { path.pointAt(u, _p); path.tangentAt(u, _t); const l = Math.hypot(_t.x, _t.z) || 1; return { x: _p.x, y: _p.y, z: _p.z, tx: _t.x / l, tz: _t.z / l, rx: -_t.z / l, rz: _t.x / l }; };
    const fr = rng.fork('field');
    // each sleeper wakes while the camera is still well short of it, so it is up, or nearly, when we reach it; never in a row
    const wakeFor = (x, z, lo = 0.166) => { const n = path.nearestXZ(x, z); return clamp(n.u - (fr.range(13, 46) + n.dist * 0.5) / L, lo, 0.335); };
    // THE FIRST RISER, the dome the owl lands on. The route aims a little left of it and swerves left round its head, so for the
    // two seconds before the pass it lies near the direction of travel (the steady camera keeps it too). It wakes at u 0.149 and
    // takes 0.031 of the route (1.9 s at the speed there): half up when it is 4.5 m ahead (u 0.165), seen three-quarter side-on,
    // nose pointing left across our route: hind legs unfolding on the right, tail lifting behind, head swinging out on the left
    const WAKE0 = 0.1465, RISE0 = 0.031;
    const FIRST = { x: 2.25, z: -76.0 };
    const FIRST_H = (() => { const c = pathFrame(0.165), vx = FIRST.x - c.x, vz = FIRST.z - c.z, l = Math.hypot(vx, vz) || 1, ux = vx / l, uz = vz / l, k = Math.cos(0.36), q = Math.sin(0.36);
      return Math.atan2(uz * k - ux * q, -ux * k - uz * q); })();        // left of the line of sight, turned 20 degrees toward us
    // one that sleeps on, 2.3 m to our right just after it, and two that stand up ahead-left as we pass the first
    const EXTRA = [{ x: -2.7, z: -81.2, never: true, heading: 2.5 }, { x: -3.6, z: -87.4, wakeU: 0.1585, heading: 2.2 }, { x: -6.4, z: -90.6, wakeU: 0.163, heading: -2.6 }];
    // where the walker we pass close at u 0.25 beds down and plods: no sleeper of the patch may lie in its way
    const NEARW = (() => { const f = pathFrame(0.2597), x = f.x - f.rx * 2.7, z = f.z - f.rz * 2.7; return [[x, z], [x + 2.2, z + 2.2], [x - 3, z - 3]]; })();
    const hero = await buildHero(ctx, {
      palette: pal, detail, sunDir, groundPatch: false, sloth: false, duration: DUR, timeOfU, fill: W.fill, count: 8,
      wakeOf: (x, z, i) => (i === 0 ? WAKE0 : wakeFor(x, z + HZ, 0.162)),
      first: { x: FIRST.x, z: FIRST.z - HZ, heading: FIRST_H, riseU: RISE0 },
      clear: (x, z) => path.nearestXZ(x, z + HZ).dist < 2.7 || Math.hypot(x - FIRST.x, z + HZ - FIRST.z) < 6.2 && path.nearestXZ(x, z + HZ).u < 0.175 || EXTRA.some((q) => Math.hypot(q.x - x, q.z - z - HZ) < 5) || NEARW.some((q) => Math.hypot(q[0] - x, q[1] - z - HZ) < 5),
    });
    hero.object.position.set(0, 0, HZ);
    scene.add(hero.object);
    const shared = hero.herds[0].shared;
    shared.uFrost.value.set(pal[0]).multiplyScalar(weather === 'wind' ? 0.8 : 0.9); shared.uCap.value = weather === 'snow' ? 1 : 0;
    shared.uFill.value.set('#98A4BE').multiplyScalar(W.fill * 1.12);        // open shadow sides: sky from above, warm frost-light from the ground
    const shadowMeshes = [];
    hero.object.traverse((o) => { if (o.name === 'btw-shadows') shadowMeshes.push(o); });
    await ctx.yield();

    const NW = -Math.PI * 0.75;
    const spots = [];                                    // { x, z, kind, near, slot }
    const taken = (x, z, gap) => spots.some((q) => Math.hypot(q.x - x, q.z - z) < gap);
    const inPatch = (x, z) => Math.abs(x) < 16 && z < HZ + 17 && z > HZ - 18;
    // the sloth stands 16.5 m from where the camera is at u 0.45, on the bearing of the sun (50 degrees right of north), side-on,
    // facing its tree; the trunk is 4.2 m further to the right. So the claws hook the bough straight under the sun's disc.
    const VIEW = { x: Math.sin(50 * Math.PI / 180), z: -Math.cos(50 * Math.PI / 180) }, C45 = pathFrame(0.45);
    const C44 = pathFrame(0.44), slothAt = new THREE.Vector3(C44.x + VIEW.x * 12.2, 0, C44.z + VIEW.z * 12.2);
    const treeAt = new THREE.Vector3(slothAt.x - VIEW.z * 4.2, 0, slothAt.z + VIEW.x * 4.2);
    const mkSlot = (x, z, o = {}) => ({ x, z, heading: fr() * TAU, scale: fr.range(0.88, 1.08), wakeU: wakeFor(x, z), walkHeading: NW + fr.range(-0.22, 0.22), walkFromU: 0.24, speed: 0.8 * fr.range(0.9, 1.08), ...o });
    // the entry picture: the nearest boulder 2 m left and 7 m ahead, a dozen more behind it (these we pass before any wakes)
    // we come in at shell height and weave between them: one 2.4 m to the left and one 2.7 m to the right in the first seconds,
    // then one dead ahead that the route leans left round (u 0.08) and one it leans right round (u 0.13): looked at closely before any stands
    const ENTRY = [[-2.6, -19.5, 0.75, 1.12], [3.2, -23.5, -2.3, 1.06], [0.2, -40.5, -0.6, 1.12], [-1.8, -56.5, 1.15, 1.08], [-4.8, -41, 2.4, 1.0], [4.6, -29, 0.4, 1.0], [-7.5, -23, -1.2, 1], [9.5, -33, 2.0, 1], [4.0, -51.5, -2.6, 1.02], [-7.0, -50, 0.3, 1]];
    for (const [x, z, h, sc] of ENTRY) spots.push({ x, z, kind: 'g', entry: true, slot: mkSlot(x, z, { wakeU: fr.range(0.2, 0.33), heading: h, scale: sc }) });
    spots[1].slot.tuck = 1;
    for (const q of EXTRA) spots.push({ x: q.x, z: q.z, kind: 'g', extra: true, slot: mkSlot(q.x, q.z, { heading: q.heading, scale: 1.08, ...(q.never ? { never: true } : { wakeU: q.wakeU }) }) });
    // the Doedicurus that crosses our nose at u 0.375, right to left, whole in frame 4 m ahead, club level behind it: its
    // bed is worked back from where it must be then (it has been walking since it stood)
    const RISE = 1.8 / DUR, dirOf = (h) => [Math.sin(h), Math.cos(h)];
    const bedFor = (x, z, wh, speed, wakeU, uSeen, walkFromU = 0.2) => { const d = speed * Math.max(0, timeOfU(uSeen) - timeOfU(Math.max(wakeU + RISE, walkFromU))), [dx, dz] = dirOf(wh); return [x - dx * d, z - dz * d]; };
    { const f = pathFrame(0.375 + 4.4 / L), wh = Math.atan2(-f.rx, -f.rz) + 0.12, [x, z] = bedFor(f.x - f.rx * 1.7, f.z - f.rz * 1.7, wh, 0.86, 0.262, 0.375);
      spots.push({ x, z, kind: 'd', cross: true, slot: mkSlot(x, z, { wakeU: 0.262, walkFromU: 0.2, heading: wh, walkHeading: wh, speed: 0.86, scale: 1.1 }) }); }
    // THE FILE: eight that were first up, plodding north-west beside the route where it runs north-west too (u 0.27 to 0.36):
    // we overtake them at 3 to 4 m, left and right in turn, the low sun full on their right flanks
    [[0.276, -6.6], [0.279, 3.1], [0.293, -3.0], [0.301, 3.5], [0.313, -3.1], [0.318, 3.3], [0.329, -5.6], [0.337, 6.2], [0.3725, -3.6], [0.355, 3.4], [0.2597, -2.7]].forEach(([uP, lat], k) => {
      const f = pathFrame(uP), wh = NW + fr.range(-0.14, 0.14) + (k === 10 ? 0.5 : 0), speed = 0.8 * fr.range(0.92, 1.06), wakeU = Math.max(0.156, uP - 0.085 - 0.03 * fr());
      const [x, z] = bedFor(f.x + f.rx * lat, f.z + f.rz * lat, wh, speed, wakeU, uP - 0.012);
      spots.push({ x, z, kind: k === 3 ? 'd' : 'g', file: Math.abs(lat) < 5, slot: mkSlot(x, z, { wakeU, walkFromU: 0.2, heading: wh, walkHeading: wh, speed, scale: (k === 3 ? 1.1 : 1) * fr.range(0.94, 1.08) }) });
    });
    { const f = pathFrame(0.34 + 4.3 / L), x = f.x - f.rx * 2.3, z = f.z - f.rz * 2.3, c0 = pathFrame(0.34), h = Math.atan2(c0.x - x, c0.z - z) - 0.5;
      spots.push({ x, z, kind: 'g', file: true, stander: true, slot: mkSlot(x, z, { wakeU: 0.2, heading: h, walkHeading: h, speed: 0, scale: 1.14 }) }); }
    // the rare event: two bulls head to tail, a gap of ground between the shells, 4.5 m left of the route and 7 m ahead of where
    // we are at u 0.385, knocking their clubs on each other's flanks. Their line lies at 55 degrees to our line of sight, so both
    // are whole in the left half of the frame and each club is seen in outline
    if (rare) { const cam = pathFrame(0.385), cx = cam.x + cam.tx * 7.2 - cam.rx * 4.5, cz = cam.z + cam.tz * 7.2 - cam.rz * 4.5, h = Math.atan2(cx - cam.x, cz - cam.z) + 0.96,
        ox = Math.cos(h) * 1.25 + Math.sin(h) * 1.2, oz = -Math.sin(h) * 1.25 + Math.cos(h) * 1.2;
      spots.push({ x: cx + ox, z: cz + oz, kind: 'd', slot: { x: cx + ox, z: cz + oz, heading: h, scale: 1.12, awake: true, speed: 0, tuck: -2 } },
        { x: cx - ox, z: cz - oz, kind: 'd', slot: { x: cx - ox, z: cz - oz, heading: h + Math.PI, scale: 1.08, awake: true, speed: 0, tuck: -2 } }); }
    let doedLeft = nDoedField - 1, neverLeft = 2;
    const want = 17;
    for (let tries = 0, made = 0; made < want && tries < 3000; tries++) {
      const u = fr.range(0.2, 0.46), side = fr() < 0.5 ? -1 : 1, lat = side * (3.0 + Math.pow(fr(), 1.35) * 15), f = pathFrame(u);
      const x = f.x + f.rx * lat, z = f.z + f.rz * lat, n = path.nearestXZ(x, z);
      if (n.dist < 2.8 || inPatch(x, z) || taken(x, z, 5.4) || Math.hypot(x - treeAt.x, z - treeAt.z) < 13 || Math.hypot(x - slothAt.x, z - slothAt.z) < 9 || (u > 0.38 && lat > 0) || waterDepthAt(x, z) > -14) continue;
      const kind = doedLeft > 0 && n.dist > 4 ? 'd' : 'g'; if (kind === 'd') doedLeft--;
      const slot = mkSlot(x, z); if (kind === 'd') slot.scale *= 1.07;
      if (neverLeft > 0 && n.u > 0.27 && n.u < 0.4 && n.dist > 3.5 && n.dist < 9 && kind === 'g') { slot.never = true; neverLeft--; }
      spots.push({ x, z, kind, slot }); made++;
    }
    for (const q of spots) { const n = path.nearestXZ(q.x, q.z); q.near = (n.dist < 3.8 && n.u > 0.13) || !!q.cross || !!q.file || (!!q.extra && !!q.slot.never) || q.slot.tuck === -2; q.grp = n.u < 0.13 ? 0 : n.u < 0.3 ? 1 : 2; }
    for (let i = 0; i < 4; i++) spots[i].near = true;
    const yf = () => ctx.yield();
    const geoLoG = await buildGlyptodontGeometryAsync(fr, { kind: 'glyptodon', lod: 0.5, palette: pal }, yf);
    await ctx.yield();
    const geoLoD = await buildGlyptodontGeometryAsync(fr, { kind: 'doedicurus', lod: 0.5, palette: pal }, yf);
    await ctx.yield();
    const geoHiG = hero.herds[0].mesh.geometry, geoHiD = hero.herds[1].mesh.geometry;
    const baseOf = (g) => { const b = new THREE.BufferGeometry(); b.setIndex(g.index); for (const k of ['position', 'normal', 'color', 'aBone', 'aPivot', 'aShell']) b.setAttribute(k, g.attributes[k]); return b; };
    const herds = [], fieldAnimals = [];
    const addHerd = (kind, geometry, list, material) => {
      if (!list.length) return null;
      const h = makeGlyptodonts(ctx, { kind: kind === 'd' ? 'doedicurus' : 'glyptodon', slots: list.map((q) => q.slot), palette: pal, shared, duration: DUR, timeOfU, geometry: baseOf(geometry), rng: fr,
        material: material || hero.herds[kind === 'd' ? 1 : 0].mesh.material });
      scene.add(h.mesh); herds.push(h);
      return h;
    };
    const groupHerds = [[], [], []];                      // boulders of the entry, of the middle of the field, and of its far end: each dropped once well behind us
    for (const grp of [0, 1, 2]) for (const [kind, near, geo] of [['g', true, geoHiG], ['d', true, geoHiD], ['g', false, geoLoG], ['d', false, geoLoD]]) {
      const list = spots.filter((q) => q.kind === kind && q.near === near && q.grp === grp), h = addHerd(kind, geo, list);
      if (h) { list.forEach((q, i) => { q.s = h.state(i); fieldAnimals.push({ herd: h, i, s: q.s, kind }); }); groupHerds[grp].push(h); }
      await ctx.yield();
    }
    const fieldShadows = makeShadows(fieldAnimals.length, sunDir); scene.add(fieldShadows.mesh); shadowMeshes.push(fieldShadows.mesh);
    const fieldFx = makeFrostFx(ctx, { animals: fieldAnimals, detail, pal, sunDir, shared }); scene.add(fieldFx.mesh);
    await ctx.yield();

    // ---- THE SECOND SURPRISE: the Megatherium reared into the lone algarrobo, between us and the sun -------------------
    const st = await buildSlothTree(ctx, { shared, sunDir, palette: pal, detail, duration: DUR, timeOfU, pullAtU: 0.45 });
    // side-on to us as we come: the sloth to the left of the trunk, facing it, the hooked bough between them under the sun
    st.object.position.copy(treeAt); st.object.rotation.y = Math.atan2(-VIEW.z, VIEW.x);
    scene.add(st.object);
    const UP = new THREE.Vector3(0, 1, 0);
    // a half-grown young, when there is one, stands a body-width further out along the same line: sky between the two outlines
    const youngAt = new THREE.Vector3(slothAt.x + VIEW.z * 3.3 - VIEW.x * 0.8, 0, slothAt.z - VIEW.x * 3.3 - VIEW.z * 0.8);
    let young = null;
    if (slothYoung) {
      const poseY = new THREE.Vector4(0.62, 0, 0, 0);
      young = new THREE.Mesh(st.sloth.geometry, makeSilhouetteMaterial(shared, 'sloth', poseY, sunDir, pal[6]));
      young.scale.setScalar(0.5); young.position.set(-0.8, 0, st.slothAt.z - 3.3); young.rotation.y = 0.12; young.name = 'btw-megatherium-young';
      st.object.add(young);
    }
    const treeShadows = makeShadows(3, sunDir); scene.add(treeShadows.mesh); shadowMeshes.push(treeShadows.mesh);
    treeShadows.set(0, slothAt.x, slothAt.z, 3.6, 1.3); treeShadows.set(1, treeAt.x, treeAt.z, 3.2, 0.42);
    treeShadows.set(2, youngAt.x, youngAt.z, slothYoung ? 2.0 : -0.8, slothYoung ? 0.8 : 0); treeShadows.commit();
    for (const m of shadowMeshes) { m.material.uniforms.uMul.value.set(W.shadow[0], W.shadow[1], W.shadow[2]); m.material.uniforms.uOpacity.value = W.shadowOp; }
    { const cs = makeShadows(1, sunDir, 0.045); cs.set(0, treeAt.x, treeAt.z, 7.6, 3.4); cs.commit(); scene.add(cs.mesh);
      cs.mesh.material.uniforms.uMul.value.set(W.shadow[0], W.shadow[1], W.shadow[2]); cs.mesh.material.uniforms.uOpacity.value = W.shadowOp * 0.36; }
    await ctx.yield();

    // ---- PLANTS: pampas grass fountains with plumed canes, frosted bunch grass between; all shivering in one wind ------
    const pr = rng.fork('plants');
    const straw = lin(W.straw), plumeC = lin(W.plume, 0.86), rimeC = lin(W.ground[1], 0.84), darkC = lin('#5b4a34');
    const clumpGeometry = (hi) => {
      const P = [], C = [], N = [], X = [], I = []; let v = 0;
      const put = (p, c, n, fx) => { P.push(p[0], p[1], p[2]); C.push(c[0], c[1], c[2]); N.push(n[0], n[1], n[2]); X.push(fx[0], fx[1], fx[2]); return v++; };
      const NB = hi ? 13 : 8, NS = hi ? 3 : 2;
      for (let b = 0; b < NB; b++) {                         // arching saw-edged blades
        const az = (b + pr()) / NB * TAU, dx = Math.sin(az), dz = Math.cos(az), r = pr.range(0.8, 1.3), h = pr.range(1.0, 1.6), w0 = hi ? 0.06 : 0.1;
        const tone = mix3(straw, darkC, pr() * 0.35); let prev = null;
        for (let k = 0; k <= NS; k++) {
          const t = k / NS, y = h * 1.32 * (2.2 * t - 1.6 * t * t), rr = 0.08 + r * Math.pow(t, 1.15), w = w0 * (1 - 0.82 * t);
          const c = mix3(mix3(darkC, tone, smoothstep(0, 0.4, t)), rimeC, W.rime * (0.25 + 0.5 * t)), n = [dx * 0.45, 0.9, dz * 0.45];
          const a = put([dx * rr - dz * w, y, dz * rr + dx * w], c, n, [t * t, 0.25 * t, 0]), bb = put([dx * rr + dz * w, y, dz * rr - dx * w], c, n, [t * t, 0.25 * t, 0]);
          if (prev) I.push(prev[0], prev[1], bb, prev[0], bb, a);
          prev = [a, bb];
        }
      }
      const NP = hi ? pr.int(5, 8) : 4;
      for (let q = 0; q < NP; q++) {                         // stiff canes, each with a feathery plume that the camera always sees flat on
        const az = pr() * TAU, lean = pr.range(0.12, 0.5), H = pr.range(2.0, 3.0), dx = Math.sin(az), dz = Math.cos(az);
        const top = [dx * lean, H - 0.62, dz * lean], n = [dx * 0.3, 0.95, dz * 0.3], cane = mix3(straw, darkC, 0.25);
        const a = put([0, 0.2, 0], cane, n, [0, 0, -0.018]), b = put([0, 0.2, 0], cane, n, [0, 0, 0.018]), c = put(top, cane, n, [0.5, 0.1, -0.012]), d = put(top, cane, n, [0.5, 0.1, 0.012]);
        I.push(a, b, d, a, d, c);
        const sh = [[0, 0.012], [0.28, 0.075], [0.66, 0.06], [1, 0.0]], bend = pr.range(0.12, 0.4); let prev = null;
        for (let k = 0; k < sh.length; k++) {
          const t = sh[k][0], w = sh[k][1] * (hi ? 1 : 1.25), p = [top[0] + dx * (0.05 + bend * t * t) * 1.2, top[1] + 0.8 * t - 0.3 * bend * t * t, top[2] + dz * (0.05 + bend * t * t) * 1.2];
          const cc = mix3(plumeC, rimeC, W.rime * 0.45), g = 0.75 + 0.25 * t;
          if (k === sh.length - 1) { const e = put(p, cc, n, [1, g, 0]); I.push(prev[0], prev[1], e); }
          else { const e = put(p, mix3(cc, darkC, 0.25), n, [0.5 + 0.5 * t, g * 0.6, -w]), f = put(p, cc, n, [0.5 + 0.5 * t, g, w]); if (prev) I.push(prev[0], prev[1], f, prev[0], f, e); prev = [e, f]; }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aFx', new THREE.Float32BufferAttribute(X, 3)); g.setIndex(I);
      return g;
    };
    const uWind = { value: W.wind }, uAccent = { value: new THREE.Color(pal[6]) }, uSunW = { value: sunDir.clone() };
    const plantMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0, side: THREE.DoubleSide });
    plantMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { uTime, uWind, uAccent, uSunW });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', /* glsl */`#include <common>
        attribute vec3 aFx; attribute vec4 iP; attribute vec4 iR; uniform float uTime, uWind; varying float vGlow; varying vec3 vWorldP;`)
        .replace('#include <beginnormal_vertex>', /* glsl */`float cr = cos(iR.x), sr = sin(iR.x);
          vec3 objectNormal = vec3(normal.x * cr + normal.z * sr, normal.y, normal.z * cr - normal.x * sr);`)
        .replace('#include <begin_vertex>', /* glsl */`vec3 lp = position * iP.w * vec3(1., iR.z, 1.);
          vec3 transformed = vec3(lp.x * cr + lp.z * sr, lp.y, lp.z * cr - lp.x * sr) + iP.xyz;
          float ph = iR.y * 6.2831853, gust = 0.6 + 0.4 * sin(uTime * 0.35 + iP.x * 0.045 + iP.z * 0.03);
          vec2 sway = vec2(-0.9, -0.35) * (0.22 * sin(uTime * 1.25 + ph + iP.x * 0.13) + 0.07 * sin(uTime * 3.1 + ph * 3. + position.y * 2.)) * (0.5 + 0.5 * uWind) * gust
            + vec2(-0.9, -0.35) * 0.16 * (uWind - 0.6) * gust;
          transformed.xz += sway * aFx.x * iP.w;
          vec3 toC = cameraPosition - transformed; vec2 sd = normalize(vec2(toC.z, -toC.x) + vec2(1e-5, 0.));
          transformed.xz += sd * aFx.z * iP.w * (1. + 0.02 * length(toC));
          vGlow = aFx.y; vWorldP = transformed;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uAccent, uSunW; varying float vGlow; varying vec3 vWorldP;')
        .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
          if (vGlow > 0.42) { vec2 fp = vec2(vWorldP.x * 53. + vWorldP.z * 31., vWorldP.y * 17.); vec2 fi = floor(fp);
            float fh = fract(sin(dot(fi, vec2(12.9898, 78.233))) * 43758.5453);
            if (fh < 0.34 * (1. - smoothstep(14., 40., length(vWorldP - cameraPosition)))) discard; }`)
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize((viewMatrix * vec4(normalize(vec3(0., 1., 0.) + uSunW * 0.55), 0.)).xyz);')
        .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
          { vec3 tv = vWorldP - cameraPosition; float back = max(dot(tv / max(length(tv), 1e-3), normalize(uSunW)), 0.); back *= back * back;
            totalEmissiveRadiance += (uAccent * 1.5 + diffuseColor.rgb * 0.8) * back * vGlow + diffuseColor.rgb * vGlow * 0.10; }`);
    };
    plantMat.customProgramCacheKey = () => 'btw-world-plants';
    const instanced = (base, list) => {
      const g = new THREE.InstancedBufferGeometry(); g.setIndex(base.index); for (const k of ['position', 'color', 'normal', 'aFx']) g.setAttribute(k, base.attributes[k]);
      const A = new Float32Array(list.length * 4), B = new Float32Array(list.length * 4); let cx = 0, cz = 0;
      list.forEach((q, i) => { A.set([q.x, q.y, q.z, q.s], i * 4); B.set([q.rot, q.ph, q.tall, 0], i * 4); cx += q.x / list.length; cz += q.z / list.length; });
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iR', new THREE.InstancedBufferAttribute(B, 4)); g.instanceCount = list.length;
      let r = 0; for (const q of list) r = Math.max(r, Math.hypot(q.x - cx, q.z - cz));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, 1, cz), r + 6);
      return g;
    };
    // where clumps stand: 3 to 6 m apart, clear of the route, of every sleeper and of the water
    const NCH = 5, clumpChunks = Array.from({ length: NCH }, () => ({ near: [], far: [] })), cell = new Map(), ckey = (x, z) => Math.floor(x / 5) + ':' + Math.floor(z / 5);
    // the herd on the spit: [s along the last straight, t right of it, kind, scale, heading off the route's]: a loose file climbing
    // either side of the route right up to the ring, two half-grown young among them
    const SPIT = [[119.5, -5.8, 'g', 1.16, -0.12], [123.5, 6.4, 'd', 1.18, 0.3], [132, -6.6, 'g', 1.1, 0.2], [131.5, -9.2, 'g', 0.62, 0.2], [137.5, 6.6, 'g', 1.14, -0.2], [139.5, -7.4, 'g', 1.08, 0.05],
      // the rest have reached the ring and stand about its foot, wide of the route: none leaves the frame at arm's length on the approach
      [159.5, -6.6, 'd', 1.22, -0.1], [160.5, 6.4, 'g', 1.2, 0.1], [158, 9.0, 'g', 0.64, 0.2], [165.5, -6.9, 'g', 1.14, -0.1], [166, -11.4, 'g', 1.12, -0.3], [162, -9.8, 'g', 0.62, -0.2], [168.5, 16.4, 'g', 1.08, 0.3], [169, -14.2, 'g', 1.04, -0.5], [171.5, 9.8, 'd', 1.1, 0.3]];
    const allDomes = hero.anchors.wake.map((q) => ({ x: q.x, z: q.z + HZ })).concat(spots, SPIT.map(([sA, t]) => { const [x, z] = stToWorld(sA + 0.6, t); return { x, z }; }));
    const sightLine = (x, z) => { const ax = pathFrame(0.405), dx = slothAt.x - ax.x, dz = slothAt.z - ax.z, l2 = dx * dx + dz * dz, t = clamp(((x - ax.x) * dx + (z - ax.z) * dz) / l2, 0, 1.25); return Math.hypot(x - ax.x - dx * t, z - ax.z - dz * t); };
    const talaXZ = stToWorld(163, 10.8);                 // where the tala stands at the foot of the ring: no clump in its trunk
    const nClump = Math.round(1010 * detail * (0.5 + 0.5 * dens));
    for (let tries = 0, made = 0; made < nClump && tries < nClump * 6; tries++) {
      const u = pr.range(-0.1, 1.06), f = pathFrame(u), lat = (pr() < 0.5 ? -1 : 1) * (3.0 + Math.pow(pr(), 1.9) * 74), x = f.x + f.rx * lat, z = f.z + f.rz * lat;
      const n = path.nearestXZ(x, z), thin = pr(); if (n.dist < 3.0 || (u > 0.9 && n.dist < 7.5) || (u < 0.78 && thin > 0.62 + 0.38 * smoothstep(4, 16, n.dist))) continue;
      if (waterDepthAt(x, z) > -7.5 || Math.hypot(x - treeAt.x, z - treeAt.z) < 7.5 || Math.hypot(x, z) < 7 || Math.hypot(x - talaXZ[0], z - talaXZ[1]) < 4) continue;   // and none in the lens at the entry
      const kx = Math.floor(x / 5), kz = Math.floor(z / 5), gap = 3 + 2.4 * pr(); let ok = true;
      for (let a = -1; a <= 1 && ok; a++) for (let b = -1; b <= 1 && ok; b++) for (const q of cell.get((kx + a) + ':' + (kz + b)) || []) if (Math.hypot(q.x - x, q.z - z) < gap) { ok = false; break; }
      if (!ok || allDomes.some((q) => Math.hypot(q.x - x, q.z - z) < 3.6) || (Math.hypot(x - FIRST.x, z - FIRST.z) < 7.5 && n.u < 0.178) || sightLine(x, z) < 4.2 || Math.hypot(x - slothAt.x, z - slothAt.z) < 7.5 || Math.hypot(x - youngAt.x, z - youngAt.z) < 4) continue;   // nothing between us and the first riser, or us and the sloth
      const q = { x, y: heightAt(x, z) - 0.03, z, s: pr.range(0.8, 1.2), rot: pr() * TAU, ph: pr(), tall: pr.range(0.85, 1.15), d: n.dist };
      if (!cell.has(ckey(x, z))) cell.set(ckey(x, z), []); cell.get(ckey(x, z)).push(q);
      const ch = clumpChunks[clamp(Math.floor(clamp(n.u, 0, 0.999) * NCH), 0, NCH - 1)]; if (n.dist >= (n.u > 0.48 && n.u < 0.68 ? 4.4 : 3.6)) (n.dist < 11 ? ch.near : ch.far).push(q); made++;   // none so near that it fills a corner of the lens, least of all inside the turn
      if (tries % 80 === 79) await ctx.yield();
    }
    for (const [x, z, sc] of [[4.6, -9.5, 1.15], [-5.2, -7.5, 1.0], [7.4, -25.5, 1.1], [-4.6, -30, 1.05], [3.9, -44, 1.2], [-4.9, -47, 0.95], [5.0, -62, 1.1], [-5.6, -63, 1.0], [7.5, -15, 0.9], [-8.5, -16, 1.0]])   // beside the entry weave
      clumpChunks[0].near.push({ x, y: -0.03, z, s: sc, rot: pr() * TAU, ph: pr(), tall: pr.range(0.95, 1.15), d: 4 });
    for (let k = 0; k < 34; k++) {                         // an avenue of plumes down the spit toward the ring
      const sd = k % 2 ? 1 : -1, [x, z] = stToWorld(113 + k * 1.55 + pr.range(-1, 1), sd * (6.4 + pr.range(0, 4.6) + (k > 26 ? 2.5 : 0)));
      if (waterDepthAt(x, z) > -6.5 || allDomes.some((q) => Math.hypot(q.x - x, q.z - z) < 3.4) || Math.hypot(x - talaXZ[0], z - talaXZ[1]) < 4) continue;
      clumpChunks[NCH - 1].near.push({ x, y: heightAt(x, z) - 0.03, z, s: pr.range(0.85, 1.15), rot: pr() * TAU, ph: pr(), tall: pr.range(0.8, 1.05), d: 5 });
    }
    await ctx.yield();
    const clumpHi = [clumpGeometry(true), clumpGeometry(true)], clumpLo = clumpGeometry(false);
    const plantMeshes = [];
    for (let c = 0; c < NCH; c++) {
      const ch = clumpChunks[c];
      for (const [list, base] of [[ch.near, clumpHi[c % 2]], [ch.far, clumpLo]]) {
        if (!list.length) continue;
        const m = new THREE.Mesh(instanced(base, list), plantMat); m.name = 'btw-pampas'; scene.add(m); plantMeshes.push(m);
      }
      const all = ch.near.concat(ch.far);
      if (all.length) {                                     // each clump lays its own long blue shadow
        const sh = makeShadows(all.length, sunDir, 0.035 + (c === NCH - 1 ? 0.03 : 0), riseU); all.forEach((q, i) => sh.set(i, q.x, q.z, 1.25 * q.s, 0.95 * q.s)); sh.commit();
        sh.mesh.material.uniforms.uMul.value.set(W.shadow[0], W.shadow[1], W.shadow[2]); sh.mesh.material.uniforms.uOpacity.value = W.shadowOp * 0.8;
        sh.mesh.geometry.boundingSphere = plantMeshes[plantMeshes.length - 1].geometry.boundingSphere.clone(); sh.mesh.geometry.boundingSphere.radius += 12;
        sh.mesh.frustumCulled = true; scene.add(sh.mesh);
      }
      await ctx.yield();
    }

    // bunch grass: 0.3 m tufts a pace apart, every blade furred with hoar, bare frozen silt between
    // near the route each tuft is a bunch of a dozen fine blades with white tips; further off, five broader ones
    const swardAt = (x, z) => { const a = Math.sin(x * 0.34 + 1.9 * Math.sin(z * 0.151 + 1.0) + 0.6), b = Math.sin(z * 0.41 + 1.6 * Math.sin(x * 0.187 + 2.0) + 2.1);
      const c = Math.sin((x * 0.8 - z * 0.6) * 0.93 + 1.3 * Math.sin((x * 0.6 + z * 0.8) * 0.37)), d = Math.sin((x * 0.6 + z * 0.8) * 1.57 + 1.5 * Math.sin((x * 0.8 - z * 0.6) * 0.53 + 1));
      return 0.5 + 0.17 * a + 0.17 * b + 0.13 * c + 0.09 * d + W.sward; };
    const tuftMeshes = [], NT = 10;
    const tuftGeometry = (fine, tus = false) => {              // tus: a knee-high tussock, the dead straw of last summer, rimed at the tips
      const P = [], C = [], N = [], X = [], I = []; let v = 0; const nb = tus ? 11 : fine ? 9 : 5;
      for (let b = 0; b < nb; b++) {
        const a = pr() * TAU, dx = Math.sin(a), dz = Math.cos(a), lean = pr.range(0.04, 0.26) * (tus ? 1.7 : 1), h = pr.range(0.18, 0.44) * (fine && b < 3 ? 1.25 : 1) * (tus ? 1.45 : 1), w = tus ? 0.012 : fine ? 0.0105 : 0.03, o = pr() * (tus ? 0.2 : fine ? 0.10 : 0.07);
        const a2 = a + pr.range(-1.2, 1.2), ox = Math.sin(a2) * o, oz = Math.cos(a2) * o;
        const c0 = mix3(darkC, straw, 0.25 + 0.4 * pr()), c1 = mix3(straw, rimeC, Math.min(1, W.rime * (tus ? 0.55 + 0.5 * pr() : 1.05 + 0.3 * pr())));
        P.push(ox - dz * w, 0, oz + dx * w, ox + dz * w, 0, oz - dx * w, ox + dx * lean, h, oz + dz * lean);
        C.push(...c0, ...c0, ...c1); N.push(0, 1, 0, 0, 1, 0, 0, 1, 0); X.push(0, 0, 0, 0, 0, 0, 1, 0.04, 0); I.push(v, v + 1, v + 2); v += 3;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aFx', new THREE.Float32BufferAttribute(X, 3)); g.setIndex(I);
      return g;
    };
    {
      const chunks = Array.from({ length: NT }, () => [[], [], []]), nT = Math.round(12500 * detail * (0.6 + 0.4 * dens));
      for (let i = 0; i < nT; i++) {
        const u = pr.range(-0.1, 1.04), f = pathFrame(u), lat = (pr() < 0.5 ? -1 : 1) * (0.3 + pr() * pr() * 38), x = f.x + f.rx * lat, z = f.z + f.rz * lat;
        const s = pr.range(0.7, 1.4), ph = pr(), rot = pr() * TAU, tall = pr.range(0.8, 1.3);
        if (i % 200 === 199) await ctx.yield();
        const wd = waterDepthAt(x, z); if (i % 4 === 3 || wd > 1.5 || allDomes.some((q) => Math.hypot(q.x - x, q.z - z) < 1.75)) continue;
        const sw = swardAt(x, z); if (sw < 0.44 && ph > 0.8) continue;                // sparse on the open frost, thick in the mats
        chunks[clamp(Math.floor(clamp(u, 0, 0.999) * NT), 0, NT - 1)][sw > 0.5 && Math.abs(lat) > 1.9 && Math.abs(lat) < 26 && ph < 0.9 ? 2 : Math.abs(lat) < 7.5 ? 0 : 1].push({ x, y: heightAt(x, z) - 0.01, z, s, rot, ph, tall });
      }
      // (polish) the open frost the camera grazes is not left bare: more rimed tufts stand in it beside the route, each with its
      // own shadow; none from u 0.1 to 0.26, where the patch of sleepers already fills the budget
      { const x2 = ctx.core.makeRng('btw-polish2:' + ctx.seed), nX = Math.round(6200 * detail * (0.6 + 0.4 * dens));
        for (let i = 0; i < nX; i++) {
          const early = i % 7 === 0, u = early ? x2.range(-0.06, 0.1) : x2.range(0.26, 1.02), f = pathFrame(u), lat = (x2() < 0.5 ? -1 : 1) * (0.5 + Math.pow(x2(), 1.6) * 6.5), x = f.x + f.rx * lat, z = f.z + f.rz * lat;
          const s = x2.range(0.7, 1.35), ph = x2(), rot = x2() * TAU, tall = x2.range(0.8, 1.3);
          if (i % 200 === 199) await ctx.yield();
          if (swardAt(x, z) > 0.47 || waterDepthAt(x, z) > -0.5 || allDomes.some((q) => Math.hypot(q.x - x, q.z - z) < 1.75)) continue;
          chunks[clamp(Math.floor(clamp(u, 0, 0.999) * NT), 0, NT - 1)][0].push({ x, y: heightAt(x, z) - 0.01, z, s, rot, ph, tall });
        } }
      const bases = [[tuftGeometry(true), tuftGeometry(true), tuftGeometry(true)], [tuftGeometry(false), tuftGeometry(false)], [tuftGeometry(true, true), tuftGeometry(true, true)]];
      for (let c = 0; c < NT; c++) for (const k of [0, 1, 2]) { const list = chunks[c][k]; await ctx.yield(); if (list.length) { const m = new THREE.Mesh(instanced(bases[k][c % bases[k].length], list), plantMat); m.name = 'btw-tufts'; m.userData.c = c; scene.add(m); plantMeshes.push(m); tuftMeshes.push(m); } }
      // every tuft and tussock lays its own thin blue shadow away from the low sun: the frost between them is raked with them
      const kS = Math.hypot(sunDir.x, sunDir.z) / Math.max(0.05, sunDir.y) / 5.1, sdir = new THREE.Vector2(-sunDir.x, -sunDir.z).normalize();
      const tsMat = new THREE.ShaderMaterial({
        uniforms: { uDir: { value: sdir }, uMul: { value: new THREE.Vector3(W.shadow[0], W.shadow[1], W.shadow[2]) }, uOpacity: { value: W.shadowOp * 0.92 } },
        vertexShader: /* glsl */`attribute vec4 iS; uniform vec2 uDir; varying vec2 vQ;
          void main(){ vQ = position.xz; vec2 side = vec2(-uDir.y, uDir.x); float len = iS.w;
            vec2 q = iS.xz + uDir * (position.x * len - 0.05) + side * position.z * (0.10 + 0.045 * len);
            gl_Position = projectionMatrix * viewMatrix * vec4(q.x, iS.y + 0.03, q.y, 1.); }`,
        fragmentShader: /* glsl */`uniform vec3 uMul; uniform float uOpacity; varying vec2 vQ;
          void main(){ float x = clamp(vQ.x, 0., 1.), e = abs(vQ.y) / max(1. - 0.72 * x, 0.05);
            float comb = 0.72 + 0.28 * step(0.42, fract(vQ.y * 2.6 + x * 1.3));           // a bunch of blades, not a slab
            float a = (1. - smoothstep(0.62, 0.95, e)) * (1. - smoothstep(0.55, 1.0, x)) * mix(1., comb, smoothstep(0.15, 0.5, x)) * uOpacity;
            gl_FragColor = vec4(mix(vec3(1.), uMul, clamp(a, 0., 1.)), 1.); }`,
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.MultiplyBlending, premultipliedAlpha: true,
      });
      for (let c = 0; c < NT; c++) {
        const list = chunks[c][0].map((q) => [q, 1.5]).concat(chunks[c][2].map((q) => [q, 2.3]), chunks[c][1].map((q) => [q, 1.7])); if (!list.length) continue;
        const sg = new THREE.InstancedBufferGeometry();
        sg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -1, 1, 0, -1, 1, 0, 1, 0, 0, 1], 3)); sg.setIndex([0, 2, 1, 0, 3, 2]);
        const S = new Float32Array(list.length * 4); list.forEach(([q, k], i) => S.set([q.x, q.y, q.z, k * q.s * q.tall * kS], i * 4));
        sg.setAttribute('iS', new THREE.InstancedBufferAttribute(S, 4)); sg.instanceCount = list.length;
        const sm = new THREE.Mesh(sg, tsMat); sm.name = 'btw-tuft-shadows'; sm.frustumCulled = false; sm.renderOrder = 1; sm.userData.c = c; scene.add(sm); tuftMeshes.push(sm);
        await ctx.yield();
      }
    }
    await ctx.yield();

    // ---- THE NEAR GROUND (polish): what the camera grazes is made of blades, not of a texture. The tawny mats are carpeted
    // with low straw tussocks (bent blades, rimed tips) thickest beside the route; every sleeper lies in a pressed bed: a dark
    // thawed oval under and round the shell, a wreath of flattened straw laid outward. All of it from one separate random stream
    const xr = ctx.core.makeRng('btw-polish:' + ctx.seed);
    {
      const matGeometry = () => {                           // a low clump half a metre across: eight bent blades
        const P = [], C = [], N = [], X = [], I = []; let v = 0;
        for (let b = 0; b < 9; b++) {
          const a = (b + xr()) / 9 * TAU, dx = Math.sin(a), dz = Math.cos(a), o = 0.05 + 0.2 * xr(), lean = 0.16 + 0.3 * xr(), h = 0.13 + 0.26 * xr(), w = 0.011 + 0.007 * xr();
          const ox = dx * o, oz = dz * o, c0 = mix3(darkC, straw, 0.15 + 0.3 * xr()), c1 = mix3(mix3(darkC, straw, 0.8), rimeC, Math.min(1, W.rime * (0.6 + 0.7 * xr())));
          P.push(ox - dz * w, 0, oz + dx * w, ox + dz * w, 0, oz - dx * w, ox + dx * lean, h, oz + dz * lean);
          C.push(...c0, ...c0, ...c1); N.push(0, 1, 0, 0, 1, 0, 0, 1, 0); X.push(0, 0, 0, 0, 0, 0, 1, 0.05, 0); I.push(v, v + 1, v + 2); v += 3;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aFx', new THREE.Float32BufferAttribute(X, 3)); g.setIndex(I);
        return g;
      };
      const chunks = Array.from({ length: NT }, () => []), nC = Math.round(10500 * detail * (0.6 + 0.4 * dens));
      for (let i = 0; i < nC; i++) {
        const u = xr.range(-0.06, 1.02), f = pathFrame(u), lat = (xr() < 0.5 ? -1 : 1) * (1.9 + Math.pow(xr(), 2.2) * 13), x = f.x + f.rx * lat, z = f.z + f.rz * lat;
        const s = xr.range(0.8, 1.5), ph = xr(), rot = xr() * TAU, tall = xr.range(0.7, 1.35);
        if (i % 80 === 79) await ctx.yield();
        const onFrost = swardAt(x, z) < 0.5; if ((onFrost && ph > 0.2) || waterDepthAt(x, z) > -1 || allDomes.some((q) => Math.hypot(q.x - x, q.z - z) < 1.9)) continue;
        chunks[clamp(Math.floor(clamp(u, 0, 0.999) * NT), 0, NT - 1)].push({ x, y: heightAt(x, z) - 0.01, z, s: onFrost ? s * 0.6 : s, rot, ph, tall });
      }
      const bases = [matGeometry(), matGeometry(), matGeometry()];
      for (let c = 0; c < NT; c++) { const list = chunks[c]; await ctx.yield(); if (!list.length) continue;
        const m = new THREE.Mesh(instanced(bases[c % 3], list), plantMat); m.name = 'btw-carpet'; m.userData.c = c; scene.add(m); plantMeshes.push(m); tuftMeshes.push(m); }
    }
    await ctx.yield();
    const beds = [];                                          // { x, z, r, h }: where each sleeper lies
    hero.animals.forEach((a) => beds.push({ x: a.s.x0, z: a.s.z0 + HZ, r: a.s.scale, h: a.s.h0 }));
    for (const q of spots) if (!q.slot.awake) beds.push({ x: q.x, z: q.z, r: q.slot.scale ?? 1, h: q.slot.heading ?? 0 });
    {
      // the wreath: straw pressed flat and outward round the rim (the shell is 1.5 m wide and 2 m long)
      const P = [], C = [], N = [], X = [], I = []; let v = 0;
      for (let b = 0; b < 64; b++) {
        const a = (b + xr()) / 64 * TAU, dx = Math.sin(a), dz = Math.cos(a), r0 = 0.70 + 0.2 * Math.abs(dz) + 0.22 * xr(), len = 0.16 + 0.26 * xr(), w = 0.022 + 0.014 * xr(), tw = xr.range(-1.35, 1.35);
        const ex = dx * Math.cos(tw) + dz * Math.sin(tw), ez = dz * Math.cos(tw) - dx * Math.sin(tw);
        const c0 = mix3(darkC, straw, 0.15 + 0.25 * xr()), c1 = mix3(mix3(darkC, straw, 0.5), rimeC, Math.min(1, W.rime * (0.15 + 0.45 * xr())));
        const bx = dx * r0 * 0.8, bz = dz * r0 * 1.05;
        P.push(bx - ez * w, 0.02, bz + ex * w, bx + ez * w, 0.02, bz - ex * w, bx + ex * len, 0.03 + 0.07 * xr(), bz + ez * len);
        C.push(...c0, ...c0, ...c1); N.push(0, 1, 0, 0, 1, 0, 0, 1, 0); X.push(0, 0, 0, 0, 0, 0, 0.3, 0.0, 0); I.push(v, v + 1, v + 2); v += 3;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aFx', new THREE.Float32BufferAttribute(X, 3)); g.setIndex(I);
      const m = new THREE.Mesh(instanced(g, beds.map((q) => ({ x: q.x, y: 0, z: q.z, s: q.r * 1.04, rot: q.h, ph: 0.3, tall: 1 }))), plantMat);
      m.name = 'btw-bed-straw'; m.frustumCulled = false; scene.add(m); plantMeshes.push(m);
      // the thawed oval: the ground darkened under and round the shell, ragged at its edge (multiplied onto the ground like the shadows)
      const dg = new THREE.InstancedBufferGeometry();
      dg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], 3)); dg.setIndex([0, 2, 1, 0, 3, 2]);
      const S = new Float32Array(beds.length * 4); beds.forEach((q, i) => S.set([q.x, q.z, q.r, q.h], i * 4));
      dg.setAttribute('iS', new THREE.InstancedBufferAttribute(S, 4)); dg.instanceCount = beds.length;
      const dm = new THREE.ShaderMaterial({
        uniforms: { uMul: { value: new THREE.Vector3(0.80, 0.75, 0.70) } },
        vertexShader: /* glsl */`attribute vec4 iS; varying vec2 vQ; varying vec2 vW;
          void main(){ vQ = position.xz * vec2(1.5, 1.85); float c = cos(iS.w), s = sin(iS.w); vec2 l = vQ * iS.z;
            vec2 w = iS.xy + vec2(l.x * c + l.y * s, l.y * c - l.x * s); vW = w;
            gl_Position = projectionMatrix * viewMatrix * vec4(w.x, 0.022, w.y, 1.); }`,
        fragmentShader: /* glsl */`uniform vec3 uMul; varying vec2 vQ; varying vec2 vW;
          float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
            return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
          void main(){ float e = length(vQ / vec2(1.02, 1.36)) + 0.22 * (vn(vW * 3.1) - 0.5) + 0.10 * (vn(vW * 9.) - 0.5);
            float a = (1. - smoothstep(0.82, 1.06, e)) * (0.82 + 0.18 * vn(vW * 14.));
            gl_FragColor = vec4(mix(vec3(1.), uMul, clamp(a, 0., 1.)), 1.); }`,
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.MultiplyBlending, premultipliedAlpha: true,
      });
      const bm = new THREE.Mesh(dg, dm); bm.name = 'btw-beds'; bm.frustumCulled = false; bm.renderOrder = 0.6; scene.add(bm);
    }
    await ctx.yield();

    // bulrush along both banks, frozen in: spears and a few dark heads, in clumps
    {
      const P = [], C = [], N = [], X = [], I = []; let v = 0; const reed = lin('#c9ad72'), reedD = lin('#7d6840'), head = lin('#57402a');
      for (let b = 0; b < 15; b++) {
        const a = pr() * TAU, r = pr() * 0.6, x = Math.sin(a) * r, z = Math.cos(a) * r, h = pr.range(1.1, 2.3), lean = pr.range(-0.75, 0.75) * (0.4 + 0.6 * pr()), w = 0.021;
        const c1 = mix3(reed, rimeC, W.rime * 0.5);
        P.push(x, 0, z, x, 0, z, x + lean, h, z + lean * 0.5); C.push(...reedD, ...reedD, ...c1); N.push(0, 1, 0, 0, 1, 0, 0, 1, 0); X.push(0, 0, -w, 0, 0, w, 0.8, 0.1, 0); I.push(v, v + 1, v + 2); v += 3;
        if (b < 2) { const y0 = h * 0.80, y1 = h * 0.93, xa = x + lean * 0.8, za = z + lean * 0.4, xb = x + lean * 0.96, zb = z + lean * 0.48;
          P.push(xa, y0, za, xa, y0, za, xb, y1, zb, xb, y1, zb); for (let k = 0; k < 4; k++) { C.push(...head); N.push(0, 1, 0); }
          X.push(0.6, 0, -0.024, 0.6, 0, 0.024, 0.75, 0, -0.024, 0.75, 0, 0.024); I.push(v, v + 1, v + 3, v, v + 3, v + 2); v += 4; }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aFx', new THREE.Float32BufferAttribute(X, 3)); g.setIndex(I);
      const list = [], nR = Math.round(420 * detail);
      for (let i = 0; i < nR * 8 && list.length < nR; i++) {
        const u = pr.range(0.5, 0.97), f = pathFrame(u), lat = (pr() < 0.5 ? -1 : 1) * (2.6 + Math.pow(pr(), 1.3) * 70), x = f.x + f.rx * lat, z = f.z + f.rz * lat, wd = waterDepthAt(x, z);
        if (wd < -2.2 || wd > 3.2 + 4 * noise.n2(x * 0.08, z * 0.08) || path.nearestXZ(x, z).dist < (u > 0.8 ? 6 : 2.6)) continue;
        list.push({ x, y: Math.max(heightAt(x, z), WATER - 0.1), z, s: pr.range(0.8, 1.25), rot: pr() * TAU, ph: pr(), tall: pr.range(0.8, 1.2) });
        if (list.length % 100 === 99) await ctx.yield();
      }
      if (list.length) { const m = new THREE.Mesh(instanced(g, list), plantMat); m.name = 'btw-reeds'; scene.add(m); plantMeshes.push(m); }
    }
    await ctx.yield();

    // the tala at the foot of the ring: leaning, a dense spiny tangle, one long bough dark across the ring's lower right
    const endP = new THREE.Vector3(...along(170, 6.8)), RX = -AZ, RZ = AX;
    const tala = new THREE.Group(); tala.name = 'btw-tala'; let fieldTree = null;
    {
      const tg = await buildAlgarroboGeometry(ctx, pr, [-3.4, 3.5, 0.4], true, { bark: '#7a6450', rime: '#e6edf2' });
      const tm = new THREE.Mesh(tg, makeSilhouetteMaterial(shared, 'tree', new THREE.Vector4(0, 0, 0, 0), sunDir, pal[6]));
      tm.rotation.z = 0.13; tm.scale.set(1.0, 1.04, 1.0); tala.add(tm);
      tala.position.set(endP.x + RX * 10.8 - AX * 7, 0, endP.z + RZ * 10.8 - AZ * 7); tala.position.y = heightAt(tala.position.x, tala.position.z) - 0.1; tala.rotation.y = Math.atan2(0.819, 0.574);
      scene.add(tala);
      const sh = makeShadows(1, sunDir, 0.08, riseU); sh.set(0, tala.position.x, tala.position.z, 6, 3.2); sh.commit();
      sh.mesh.material.uniforms.uMul.value.set(W.shadow[0], W.shadow[1], W.shadow[2]); sh.mesh.material.uniforms.uOpacity.value = W.shadowOp * 0.5; scene.add(sh.mesh);
      if (weather === 'wind') { tm.material.color.set('#d9c7a6'); st.tree.material.color.set('#d9c7a6'); }
      // a second thorn tree out on the field, 23 m left of where the file walks: a landmark in the middle distance for the first third
      const f2 = pathFrame(0.275), fx = f2.x - f2.rx * 23, fz = f2.z - f2.rz * 23;
      fieldTree = new THREE.Mesh(tg, tm.material); fieldTree.name = 'btw-tala-field'; fieldTree.position.set(fx, heightAt(fx, fz) - 0.1, fz); fieldTree.rotation.set(0, 2.2, -0.1); fieldTree.scale.set(0.86, 0.8, 0.86);
      scene.add(fieldTree);
      const sh2 = makeShadows(1, sunDir, 0.04); sh2.set(0, fx, fz, 4.6, 2.4); sh2.commit();
      sh2.mesh.material.uniforms.uMul.value.set(W.shadow[0], W.shadow[1], W.shadow[2]); sh2.mesh.material.uniforms.uOpacity.value = W.shadowOp * 0.5; scene.add(sh2.mesh);
    }
    await ctx.yield();

    // ---- THE LAGOON: twelve early risers already wading, doubled in still water, skim ice broken into plates round them ----
    const lr = rng.fork('lagoon');
    const waders = [], WADE = 0.2;                  // how far the feet stand below the surface: a hand's breadth of leg shows under the rim
    {
      // [s along the crossing, t right of it, heading off the route's (+ = turned left), kind, scale]. The route passes BETWEEN them at
      // shell height: a pair side-on 3.5 m either side where we are at u 0.69, another pair at u 0.735, and at the far end two old
      // Doedicurus bulls as gateposts, heads toward the ring and turned in, so each is seen broadside with its club level over the water
      const hR = Math.atan2(AX, AZ);
      const table = [[88.0, -4.0, -0.42, 'd', 1.2], [89.2, 4.1, 0.42, 'd', 1.17], [44.4, -3.4, -1.02, 'g', 1.08], [45.6, 3.6, 1.78, 'g', 1.1],
        [60.5, -4.3, -1.3, 'g', 1.04], [62.4, 4.7, 1.95, 'g', 1.0], [51, -9.5, -0.35, 'g', 1], [56.5, 8.6, 1.2, 'g', 1], [67.5, -9.6, 2.4, 'g', 1], [80, 8.4, -0.7, 'g', 1],
        [46, 15, 0.4, 'g', 1], [60, -18, -1.9, 'g', 1], [95, 19, 2.9, 'g', 1]];
      const pick = lr.shuffle([6, 7, 8, 9, 10, 11, 12]).slice(0, nDoedLagoon - 2); for (const i of pick) table[i][3] = 'd';
      table.forEach(([s0, t, rel, kind, sc], i) => {
        let s = s0, x = 0, z = 0;
        for (let k = 0; k < 24; k++) { [x, z] = stToWorld(s, t); if (waterDepthAt(x, z) > 4.5) break; s += s0 > 60 ? -2 : 2; }
        const far = i >= 6, walks = far && lr() < 0.4, h = hR + rel + (far ? lr.range(-0.5, 0.5) : 0);
        waders.push({ x, z, kind, cls: i < 6 ? 0 : 1, slot: { x, y: WATER - WADE, z, heading: h, walkHeading: h + lr.range(-0.4, 0.4), scale: (kind === 'd' && far ? 1.07 : 1) * sc * (far ? lr.range(0.92, 1.08) : 1), awake: true, wet: 1, speed: walks ? 0.2 : 0, tuck: i < 2 ? (t < 0 ? 3 : -3) : undefined } });
      });
    }
    const outGoers = [[103.5, -5.4, 0.3, 1.12], [105.5, 6.0, -0.35, 1.06]].map(([s0, t, rel, sc]) => { let s = s0, x = 0, z = 0;
      for (let k = 0; k < 16; k++) { [x, z] = stToWorld(s, t); if (waterDepthAt(x, z) > 2.6) break; s -= 1; }
      const h = Math.atan2(AX, AZ) + rel; return { x, z, kind: 'g', cls: 4, slot: { x, y: WATER - WADE, z, heading: h, walkHeading: h, scale: sc, awake: true, wet: 1, speed: 0 } }; });
    // four more that were up before the rest, plodding down to the water across our turn at the tree (u 0.50 to 0.54)
    { const hd = Math.atan2(AX, AZ), tGo = timeOfU(0.3);
      [[0.5125, 6.0, 'g'], [0.5335, -3.0, 'd'], [0.549, 3.3, 'g'], [0.574, 3.6, 'g'], [0.489, -3.1, 'g', 1.06], [0.500, 3.4, 'g', 1.1], [0.523, -5.8, 'g', 0.62], [0.561, -3.5, 'g', 1.04], [0.584, -4.1, 'd', 1.08], [0.597, 4.7, 'g', 1.0], [0.553, 5.9, 'g', 0.6]].forEach(([u, lat, kind, sc0]) => {
        const f = pathFrame(u), back = 0.8 * (timeOfU(u) - tGo), x = f.x + f.rx * lat - AX * back, z = f.z + f.rz * lat - AZ * back;
        waders.push({ x, z, kind, cls: 2, slot: { x, y: 0, z, heading: hd + lr.range(-0.1, 0.1), walkHeading: hd + lr.range(-0.12, 0.12), scale: sc0 ? sc0 : (kind === 'd' ? 1.07 : 1) * lr.range(0.94, 1.08), awake: true, wet: 0, speed: 0.8, walkFromU: 0.3 } });
      }); }
    // and one that has drunk and turned back from the water's edge: we meet it three-quarter face-on at the bank (u 0.61)
    { const f = pathFrame(0.647), x = f.x + f.rx * 3.3, z = f.z + f.rz * 3.3, h = Math.atan2(-f.rx - f.tx * 0.25, -f.rz - f.tz * 0.25);
      waders.push({ x, z, kind: 'g', cls: 2, slot: { x, y: Math.max(heightAt(x, z), WATER - WADE), z, heading: h, walkHeading: h, scale: 1.12, awake: true, wet: 0.6, speed: 0 } }); }
    { const hd = Math.atan2(AX, AZ);
      // a loose file climbing the spit either side of the route, right up to the ring; two half-grown young among them
      SPIT.forEach(([sA, t, kind, sc, dh]) => {
        const [x, z] = stToWorld(sA, t), [x1, z1] = stToWorld(sA + 1.2 * Math.cos(dh), t - 1.2 * Math.sin(dh));
        waders.push({ x, z, kind, cls: 3, slot: { x, y: Math.max(heightAt(x1, z1), 0), z, heading: hd + dh, walkHeading: hd + dh, scale: sc, awake: true, wet: sA < 140 ? 0.9 : 0.4, speed: 0.2, walkFromU: 0.6 } });
      }); }
    const uMirror = { value: new THREE.Vector4(0, 0, 0, WADE) };
    // three sets: the six we fly between (full model and a full mirror image once we are over the water, the low model before),
    // the far ones (low model and low mirror), and the four on land (full model, no mirror)
    const wadeHi = [], wadeLo = [], wadeFar = [], wadeLand = [], wadeSpit = [], wadeSpitLo = [], landStates = [], mirrors = [], mirrorsFar = [], wadeAnimals = [], mirrorMat = {};
    const mirrorOf = (kind, geometry) => {
      mirrorMat[kind] = mirrorMat[kind] || makeAnimalMaterial(shared, kind === 'd' ? 'doedicurus' : 'glyptodon', { uMirror }); mirrorMat[kind].transparent = true;
      const mm = new THREE.Mesh(geometry, mirrorMat[kind]);
      mm.scale.y = -1; mm.position.y = 2 * WATER; mm.frustumCulled = false; mm.renderOrder = 3; mm.visible = false; mm.name = 'btw-reflection'; scene.add(mm); return mm;
    };
    for (const kind of ['g', 'd']) {
      const near = waders.filter((q) => q.kind === kind && q.cls === 0), far = waders.filter((q) => q.kind === kind && q.cls === 1), land = waders.filter((q) => q.kind === kind && q.cls === 2);
      const geoHi = kind === 'd' ? geoHiD : geoHiG, geoLo = kind === 'd' ? geoLoD : geoLoG;
      const hi = addHerd(kind, geoHi, near), lo = addHerd(kind, geoLo, near), fl = addHerd(kind, geoLo, far), ld = addHerd(kind, geoHi, land);
      if (hi) { wadeHi.push(hi); wadeLo.push(lo); hi.mesh.visible = false; near.forEach((q, i) => wadeAnimals.push(hi.state(i))); mirrors.push(mirrorOf(kind, hi.mesh.geometry)); }
      if (fl) { wadeFar.push(fl); far.forEach((q, i) => wadeAnimals.push(fl.state(i))); mirrorsFar.push(mirrorOf(kind, fl.mesh.geometry)); }
      if (ld) { wadeLand.push(ld); ld.mesh.visible = false; land.forEach((q, i) => { wadeAnimals.push(ld.state(i)); landStates.push(ld.state(i)); }); }
      const spit = waders.filter((q) => q.kind === kind && q.cls === 3), sp = addHerd(kind, geoHi, spit), spLo = addHerd(kind, geoLo, spit);
      if (sp) { wadeSpit.push(sp); wadeSpitLo.push(spLo); sp.mesh.visible = false; spLo.mesh.visible = false; spit.forEach((q, i) => landStates.push(sp.state(i))); }
      await ctx.yield();
    }
    const outHerd = addHerd('g', geoHiG, outGoers); outHerd.mesh.visible = false; outGoers.forEach((q, i) => wadeAnimals.push(outHerd.state(i)));
    const outMirror = mirrorOf('g', outHerd.mesh.geometry);
    const landShadows = makeShadows(landStates.length, sunDir, 0.07, riseU); scene.add(landShadows.mesh);
    landShadows.mesh.material.uniforms.uMul.value.set(W.shadow[0], W.shadow[1], W.shadow[2]); landShadows.mesh.material.uniforms.uOpacity.value = W.shadowOp;
    const uWade = { value: wadeAnimals.map(() => new THREE.Vector4(0, 0, 3, 0)) };
    const NW_ = wadeAnimals.length;
    const water = await (async () => {
      const ns = gS.length, nt = gT.length, P = [], D = [], I = [], id = new Int32Array(ns * nt).fill(-1); let v = 0;
      const dAt = new Float32Array(ns * nt);
      for (let j = 0; j < nt; j++) { if (j % 12 === 11) await ctx.yield(); for (let i = 0; i < ns; i++) { const [x, z] = stToWorld(gS[i], gT[j]); dAt[j * ns + i] = waterDepthAt(x, z); } }
      await ctx.yield();
      const vert = (i, j) => { const k = j * ns + i; if (id[k] < 0) { const [x, z] = stToWorld(gS[i], gT[j]); P.push(x, WATER, z); D.push(dAt[k]); id[k] = v++; } return id[k]; };
      for (let j = 0; j < nt - 1; j++) for (let i = 0; i < ns - 1; i++) {
        if (Math.max(dAt[j * ns + i], dAt[j * ns + i + 1], dAt[(j + 1) * ns + i], dAt[(j + 1) * ns + i + 1]) < -3) continue;
        const a = vert(i, j), b = vert(i + 1, j), c = vert(i + 1, j + 1), d = vert(i, j + 1); I.push(a, c, b, a, d, c);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 1)); g.setIndex(I);
      const cA = (x, y, z) => sky.colorAt(new THREE.Vector3(x, y, z).normalize(), new THREE.Color());
      const mat = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
          uHor: { value: cA(AX, 0.05, AZ) }, uZen: { value: cA(AX * 0.4, 0.9, AZ * 0.4) }, uHorSun: { value: cA(sunDir.x, 0.05, sunDir.z) }, uSun: { value: sunDir.clone() },
          uSunCol: { value: new THREE.Color(W.sun) }, uDeep: { value: new THREE.Color(W.water).multiplyScalar(0.22) }, uIceCol: { value: new THREE.Color(W.ground[1]).multiplyScalar(0.72) },
          uShade: { value: new THREE.Color(W.hemiSky).multiplyScalar(0.42) }, uIce: { value: weather === 'wind' ? 0.0 : 1.0 }, uIceW: { value: weather === 'snow' ? 24 : 12 }, uCirrus: { value: weather === 'snow' ? 0.16 : 0.5 },
          uBank: { value: new THREE.Color(W.straw).multiplyScalar(0.5) }, uBed: { value: new THREE.Color(W.ground[0]).multiplyScalar(0.2) }, uGust: { value: weather === 'wind' ? 1 : 0.3 } }]),
        vertexShader: /* glsl */`attribute float aD; varying vec3 vWp; varying float vD;
          #include <fog_pars_vertex>
          void main(){ vWp = (modelMatrix * vec4(position, 1.)).xyz; vD = aD; vec4 mvPosition = viewMatrix * vec4(vWp, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform vec3 uHor, uZen, uHorSun, uSun, uSunCol, uDeep, uIceCol, uShade, uBank, uBed; uniform float uTime, uIce, uIceW, uCirrus, uGust, uSwanA; uniform vec4 uSwan; uniform vec4 uWade[${NW_}];
          varying vec3 vWp; varying float vD;
          #include <fog_pars_fragment>
          float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
            return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
          float gD1;
          vec3 plates(vec2 p){ vec2 ip = floor(p), fp = fract(p); float d1 = 8., d2 = 8.; vec2 best = vec2(0.);
            for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = vec2(float(i), float(j));
              vec2 q = o + vec2(h21(ip + o), h21(ip + o + 17.3)) - fp; float d = dot(q, q);
              if (d < d1) { d2 = d1; d1 = d; best = ip + o; } else if (d < d2) d2 = d; }
            gD1 = sqrt(d1); return vec3(sqrt(d2) - sqrt(d1), h21(best + 3.7), h21(best + 11.1)); }
          vec3 skyAt(vec3 r){ float up = max(r.y, 1e-4); vec2 h = r.xz / max(length(r.xz), 1e-4), s = uSun.xz / max(length(uSun.xz), 1e-4);
            float toSun = max(dot(h, s), 0.); vec3 hor = mix(uHor, uHorSun, toSun * toSun * toSun);
            vec2 cu = r.xz / (up + 0.22);
            float ci = vn(cu * vec2(0.9, 2.6) + 3.) * 0.6 + vn(cu * vec2(2.1, 6.) + 9.) * 0.4;
            vec3 c = mix(hor, uZen, pow(up, 0.62)) + uCirrus * smoothstep(0.48, 0.74, ci) * smoothstep(0.04, 0.22, up)
              + uSunCol * (2.5 * pow(max(dot(r, normalize(uSun)), 0.), 600.) + 0.25 * pow(max(dot(r, normalize(uSun)), 0.), 40.));
            // the far bank mirrored: a tawny band of reeds and plumes under the horizon's image, ragged along its edge
            float top = 0.028 + 0.030 * vn(h * 23. + 5.) + 0.014 * vn(h * 71.);
            return mix(c, uBank * (0.75 + 0.35 * vn(h * 23. + 2.)), 0.85 * (1. - smoothstep(top * 0.55, top, r.y))); }
          void main(){
            vec2 p = vWp.xz; vec3 V = cameraPosition - vWp; float dist = max(length(V), 1e-3); V /= dist;
            float hole = 0., halo = 0., crest = 0.; vec2 ring = vec2(0.);
            for (int i = 0; i < ${NW_}; i++) { vec2 d = p - uWade[i].xy; float r = max(length(d), 1e-3);
              hole = max(hole, 1. - smoothstep(uWade[i].z * 0.56, uWade[i].z, r));
              halo = max(halo, smoothstep(uWade[i].z * 0.40, uWade[i].z * 0.58, r) * (1. - smoothstep(uWade[i].z * 0.85, uWade[i].z * 1.35, r)));
              float rw = sin(r * 5.2 - uTime * 2.3 + float(i) * 1.7) * exp(-min(r, 40.) * 0.30) * smoothstep(0.7, 1.5, r) * (0.6 + uWade[i].w);
              ring += d / r * rw; crest += max(rw, 0.) * max(rw, 0.); }
            float vd = clamp(vD, -40., 400.);
            float edge = uIceW + 7. * (vn(p * 0.07) - 0.5) + 2.5 * (vn(p * 0.5) - 0.5);
            float ice = (1. - smoothstep(edge - 0.5, edge + 0.5, vd)) * uIce;
            float broken = max(hole, smoothstep(edge - 6., edge - 0.5, vd));
            vec3 pl = plates(p * 1.7 + 0.6 * vec2(vn(p * 0.9), vn(p * 0.9 + 7.)));
            float ex = min(pl.x, (0.44 + 0.26 * pl.z - gD1) * 1.3);          // distance in from the floe's rounded edge
            float present = step(broken * 1.05 - 0.2, pl.y), gap = smoothstep(0.02, 0.14 + 0.22 * broken, mix(pl.x, ex, smoothstep(0.3, 0.8, broken)));
            // loose plates: rafts drifting in the open water and a ring of broken skin round every wader
            float raft = smoothstep(0.60, 0.74, vn(p * 0.085 + 11.) * 0.7 + vn(p * 0.31 + 3.) * 0.3);
            float looseK = 0.0 * (halo + raft);
            float bob = sin(uTime * (0.6 + pl.z) + pl.y * 40.) * max(broken, 1.6 * looseK);
            float farK = 1. - smoothstep(24., 80., dist);
            ice *= mix(1., present * gap, smoothstep(0.22, 0.7, broken) * farK);
            float loose = 0.97 * uIce * (1. - smoothstep(70., 150., dist)) * 0. * step(0.997 - looseK, pl.y) * smoothstep(edge, edge + 4., vd) * (1. - hole);
            ice = max(ice, loose * smoothstep(0.0, 0.07, ex));
            // which way a floe's edge faces (toward the sun, toward us): from the slope of the distance to its edge
            vec2 dpx = dFdx(p), dpy = dFdy(p), gE = vec2(dFdx(ex), dFdy(ex)); float det = dpx.x * dpy.y - dpx.y * dpy.x;
            vec2 gw = vec2(dpy.y * gE.x - dpx.y * gE.y, dpx.x * gE.y - dpy.x * gE.x) * (det < 0. ? -1. : 1.); gw /= max(length(gw), 1e-5);
            vec2 sH = uSun.xz / max(length(uSun.xz), 1e-4), vH = V.xz / max(length(V.xz), 1e-4);
            float sunSide = dot(-gw, sH), nearSide = dot(-gw, vH), nearK = 1. - smoothstep(30., 70., dist);
            float seam = (1. - smoothstep(0.03, 0.16, ex)) * (1. - smoothstep(14., 50., dist));
            vec2 wv = vec2(vn(p * 1.9 + uTime * vec2(0.5, 0.22)) - 0.5, vn(p * 1.9 + 9. - uTime * vec2(0.22, 0.45)) - 0.5) * 0.085
              + vec2(vn(p * 5.3 - uTime * vec2(0.7, 0.3)) - 0.5, vn(p * 5.3 + 4. + uTime * vec2(0.3, 0.8)) - 0.5) * 0.04 * (1. - smoothstep(20., 60., dist)) + ring * 0.13;
            // cat's-paws: patches the wind has ruffled, drifting down-wind
            float gust = smoothstep(0.52, 0.72, vn(p * vec2(0.05, 0.11) + uTime * vec2(0.05, 0.02) + 4.)) * uGust;
            wv += vec2(vn(p * 3.1 + uTime * vec2(1.1, 0.4)) - 0.5, vn(p * 3.1 + 5. + uTime * vec2(0.4, 1.0)) - 0.5) * 0.16 * gust;
            wv *= 0.25 + 0.75 * farK;
            vec3 Nw = normalize(vec3(wv.x, 1., wv.y)), Ni = normalize(vec3((pl.y - 0.5) * 0.05 * bob + 0.012 * sin(uTime * 1.3 + pl.y * 31.), 1., (pl.z - 0.5) * 0.05 * bob + 0.012 * sin(uTime * 1.1 + pl.z * 27.)));
            vec3 N = normalize(mix(Nw, Ni, ice));
            float fres = 0.03 + 0.97 * pow(1. - clamp(dot(N, V), 0., 1.), 5.);
            vec3 refl = skyAt(reflect(-V, N));
            // looking down near us the water is shallow: the silt bed and its cracks show through, mottled
            vec3 pb = plates(p * 0.55 + 3.); float bedN = vn(p * 0.6 + 2.) * 0.6 + vn(p * 2.3) * 0.4;
            vec3 body = uDeep * (0.75 + 0.5 * bedN) + uBed * (0.35 + 0.9 * bedN) * smoothstep(0.02, 0.10, pb.x) * (1. - smoothstep(6., 30., dist));
            vec3 wcol = mix(body, refl, clamp(fres + 0.34, 0., 1.)) + (uHor * 0.30 + 0.04) * min(crest, 1.) * (1. - smoothstep(25., 60., dist));
            float rimeN = vn(p * 0.9 + 3.) * 0.6 + vn(p * 4.7) * 0.4;
            vec3 icol = uIceCol * (0.50 + 0.50 * smoothstep(0.25, 0.8, rimeN)) * (uSunCol * (0.55 + 3.0 * max(dot(Ni, normalize(uSun)), 0.)) + uShade * 1.6) * (0.60 + 0.80 * seam) * (0.66 + 0.68 * vn(p * 17.) * vn(p * 41. + 3.) * 2.) * (0.8 + 0.4 * pl.y);   // a raised rim of rime round every floe
            float lk = smoothstep(edge - 0.5, edge + 0.5, vd);                      // 1 on a loose floe in open water, 0 on the skin by the bank
            icol = mix(icol * mix(1., 1.3, lk), refl, mix(0.26 * (1. - seam) + fres * 0.5, 0.06 * (1. - seam) + fres * 0.14, lk));
            // a floe has an edge and a thickness: its rim is lit on the sun's side and blue on the other, the edge toward us shows
            // a band of green-blue ice under the rim, and the still water in front of it carries the rim's pale image
            float rimK = (1. - smoothstep(0.03, 0.22, ex)) * nearK;
            icol *= 1. + rimK * (1.0 * max(sunSide, 0.) - 0.5 * max(-sunSide, 0.));
            float wall = (1. - smoothstep(0.02, 0.11, ex)) * smoothstep(0.15, 0.7, nearSide) * nearK;
            icol = mix(icol, uDeep * 1.6 + vec3(0.015, 0.06, 0.08), wall * 0.85);
            float mirr = loose * smoothstep(-0.20, -0.03, ex) * (1. - smoothstep(-0.03, 0.0, ex)) * smoothstep(0.1, 0.6, nearSide) * nearK;
            wcol = mix(wcol, uIceCol * (uSunCol * 0.9 + uShade * 1.4) * 0.8, 0.42 * mirr * (1. - ice));
            vec3 col = mix(wcol, icol, ice);
            { vec2 q = p - uSwan.xy; float al = dot(q, uSwan.zw), ac = dot(q, vec2(-uSwan.w, uSwan.z)), behind = clamp(uSwanA - al, -50., 200.);   // the swans' feet
              float on = smoothstep(-90., -80., al) * (1. - smoothstep(-34., -26., al)) * smoothstep(-0.5, 1.5, behind) * (1. - smoothstep(30., 62., behind)) * (1. - smoothstep(2.6, 4.2, abs(ac)));
              vec2 cp = vec2(al * 0.9, ac * 1.3), ci = floor(cp), cf = fract(cp) - 0.5 - (vec2(h21(ci + 1.3), h21(ci + 7.1)) - 0.5) * 0.5;
              float rr = 0.07 + 0.012 * max(behind, 0.), dd = length(cf);
              float mark = step(0.4, h21(ci + 3.9)) * (1. - smoothstep(0.03, 0.09, abs(dd - rr))) + (1. - smoothstep(0.0, 0.08, dd)) * (1. - smoothstep(0., 6., behind));
              col = mix(col, vec3(0.85, 0.88, 0.92), clamp(mark, 0., 1.) * on * (1. - ice) * 0.85); }
            float a = mix(mix(0.30, 0.98, smoothstep(-0.2, 2.2, vd)) + fres * 0.5, 0.98, ice);
            gl_FragColor = vec4(clamp(col, 0., 40.), clamp(a, 0., 1.) * smoothstep(-1.2, -0.2, vd));
            #include <fog_fragment>
          }`,
        transparent: true, depthWrite: false, fog: true,
      });
      mat.uniforms.uTime = uTime; mat.uniforms.uWade = uWade;
      const m = new THREE.Mesh(g, mat); m.name = 'btw-lagoon'; m.renderOrder = 2; m.frustumCulled = false; return m;
    })();
    scene.add(water);
    await ctx.yield();
    { const c = water.material.uniforms.uZen.value, dp = water.material.uniforms.uDeep.value; uMirror.value.set(dp.r * 1.25 + c.r * 0.08, dp.g * 1.25 + c.g * 0.08, dp.b * 1.25 + c.b * 0.08, WADE); }   // the water's own dark tone

    const U_SWAN = 0.782;   // the swans run across our front when we are not quite half way over (u 0.735)
    // their line over the water (the same one the flock is given below): white slaps and spreading rings are drawn along it behind the runners
    const SWAN_LEAD = 12, SWAN_SPEED = 11, swanLine = (() => { const P = path.posAtDist(U_SWAN * L + SWAN_LEAD, new THREE.Vector3()), T = path.tangentAtDist(U_SWAN * L + SWAN_LEAD, new THREE.Vector3()); T.y = 0; T.normalize();
      const ang = 84 * Math.PI / 180, dx = T.x * Math.cos(ang) + T.z * Math.sin(ang), dz = T.z * Math.cos(ang) - T.x * Math.sin(ang); return { x: P.x, y: P.y, z: P.z, dx, dz }; })();
    water.material.uniforms.uSwan = { value: new THREE.Vector4(swanLine.x, swanLine.z, swanLine.dx, swanLine.dz) }; water.material.uniforms.uSwanA = { value: -999 };
    // ---- THE FAR CAST: guanacos trotting across the steppe, Macrauchenia (or Toxodon) drinking at the shore, swans --------
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene, { sunColor: '#FFEEDC', sunIntensity: W.key * 0.72 }) });
    const landY = (x, z) => Math.max(heightAt(x, z), WATER - 0.5);
    {
      const HP = F.HERD_PRESETS;
      const guanaco = { ...HP.antelope, h: 1.1, bodyLen: 1.0, width: 0.27, depth: 0.4, neckLen: 0.7, neckAng: 72, neck: [0.12, 0.075], headLen: 0.26, headPitch: 12, ears: 0.14, horns: 0, tail: 0.14, tailType: 'scut',
        coat: '#A8744A', belly: '#EDE5D6', legs: '#B8946E', sock: '#E6DAC6', accent: '#5a4a40', pattern: 'none', varieties: 0, speed: 2.4, stride: 1.0 };
      const f = pathFrame(0.26);
      fauna.add(F.makeHerd({ rng: lr, preset: guanaco, count: Math.round(26 * (0.6 + 0.4 * detail)), mode: 'migrate', heightAt: landY, spread: [16, 60],
        route: [[f.x - 190, 0, f.z + 120], [f.x - 112, 0, f.z + 30], [f.x - 86, 0, f.z - 40], [f.x - 104, 0, f.z - 120], [f.x - 180, 0, f.z - 190]], closed: false, start: 0.2, speed: 2.4, fill: 0.5 }), { always: true });
      await ctx.yield();
      const [sx, sz] = stToWorld(19, -35);
      if (toxodon) {
        const tox = { ...HP.bison, h: 1.5, bodyLen: 1.3, width: 0.62, depth: 0.74, hip: 0.96, leg: [0.12, 0.09, 0.08], neckLen: 0.2, neckAng: 2, neck: [0.36, 0.3], headLen: 0.44, headR: 0.2, headPitch: 34, ears: 0.05, tail: 0.18, horns: 0, hump: 0.08, graze: 0.5,
          coat: '#7d6a58', belly: '#6a5a4c', legs: '#6e5e50', sock: '#5e5046', accent: '#5a4a40', pattern: 'none' };
        fauna.add(F.makeHerd({ rng: lr, preset: tox, count: 4, center: [sx, 0, sz], radius: 10, heightAt: landY, path, clear: 24, fill: 0.5, pause: 0.3 }), { always: true });
      } else {
        const mac = { ...HP.horse, h: 1.8, bodyLen: 1.08, width: 0.36, depth: 0.52, hip: 0.97, leg: [0.085, 0.055, 0.045], neckLen: 0.9, neckAng: 66, neck: [0.22, 0.13], neckArch: 0.1, headLen: 0.34, headR: 0.11, headPitch: 24, ears: 0.06, tail: 0.14, tailType: 'scut', mane: 0, graze: 1.35,
          coat: '#A58C68', belly: '#E2D6BE', legs: '#9A8262', sock: '#8a7458', accent: '#5e5042', pattern: 'none', tints: ['#ffffff', '#ece4d8', '#dcd0c0'], sizes: [1, 0.92, 0.96, 0.7, 0.88] };
        fauna.add(F.makeHerd({ rng: lr, preset: mac, count: 12, center: [sx, 0, sz], radius: 12, heightAt: landY, path, clear: 24, fill: 0.5, pause: 0.34 }), { always: true });
      }
      await ctx.yield();
    }
    await ctx.yield();
    // ---- BLACK-NECKED SWANS (polish: built here as birds; the kit's flock of reshaped flamingos read as white streaks). A string
    // of them runs on the water far to our right, lifts, and crosses our front climbing, above the backs of the gatepost bulls:
    // white bodies, black necks held straight out, a red knob on the bill, broad wings beating from the shoulder
    const swans = (() => {
      const P = [], C = [], Wd = [], I = []; let v = 0;
      const white = lin('#F2F1EC'), shade = lin('#B9C4D6'), black = lin('#17171b'), red = lin('#C8402C'), grey = lin('#8E97A6'), foot = lin('#3a3134');
      const ring = (z, y, rx, ry, c, n = 7) => { const b = v; for (let i = 0; i < n; i++) { const a = i / n * TAU; P.push(Math.sin(a) * rx, y - Math.cos(a) * ry, z); const k = 0.5 - 0.5 * Math.cos(a); C.push(...mix3(mix3(c, shade, c === white ? 0.6 : 0), c, k)); Wd.push(0); v++; } return b; };
      const skin = (a, b, n = 7) => { for (let i = 0; i < n; i++) { const j = (i + 1) % n; I.push(a + i, b + i, b + j, a + i, b + j, a + j); } };
      const loft = (rows, n = 7) => { let prev = -1; for (const r of rows) { const cur = ring(r[0], r[1], r[2], r[3], r[4], n); if (prev >= 0) skin(prev, cur, n); prev = cur; } };
      // body: a full breast, tapering to the tail; neck straight out, black from a third of its length; a small head, bill and knob
      loft([[-0.42, 0.02, 0.012, 0.012, white], [-0.30, 0.01, 0.085, 0.07, white], [-0.10, 0, 0.135, 0.115, white], [0.10, 0, 0.14, 0.12, white], [0.26, 0.015, 0.10, 0.09, white], [0.36, 0.035, 0.05, 0.05, white],
        [0.50, 0.05, 0.036, 0.036, white], [0.56, 0.055, 0.034, 0.034, black], [0.84, 0.075, 0.030, 0.030, black], [0.90, 0.085, 0.046, 0.044, black], [0.955, 0.082, 0.040, 0.036, black], [0.97, 0.088, 0.030, 0.034, red], [1.00, 0.078, 0.024, 0.016, grey], [1.06, 0.07, 0.012, 0.006, grey]]);
      for (const sx of [-1, 1]) {
        // wing: three panels from the shoulder; aW is the signed distance out along the span (the shader bends it there)
        const span = [0, 0.30, 0.58, 0.82], lead = [0.20, 0.17, 0.10, -0.02], chord = [0.30, 0.29, 0.24, 0.06];
        const b = v; for (let k = 0; k < 4; k++) { const x = sx * (0.09 + span[k]); P.push(x, 0.05, lead[k], x, 0.05, lead[k] - chord[k]); C.push(...white, ...mix3(white, shade, 0.45 + 0.2 * k)); Wd.push(sx * span[k], sx * span[k]); v += 2; }
        for (let k = 0; k < 3; k++) { const a = b + k * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); }
        const f = v; P.push(sx * 0.05, -0.09, -0.22, sx * 0.09, -0.10, -0.22, sx * 0.07, -0.16, -0.40); C.push(...foot, ...foot, ...foot); Wd.push(0, 0, 0); I.push(f, f + 1, f + 2); v += 3;   // a foot trailing
      }
      const n = Math.max(12, Math.round(22 * (0.5 + 0.5 * detail))), g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(Wd, 1)); g.setIndex(I);
      g.computeVertexNormals();
      const S = new Float32Array(n * 4); for (let i = 0; i < n; i++) S.set([i * 2.5 + xr.range(-0.6, 0.6) + (i > n * 0.55 ? 5 : 0), xr.range(-1.5, 1.5) + 0.35 * (i % 3), xr(), xr.range(0.92, 1.1)], i * 4);
      g.setAttribute('iS', new THREE.InstancedBufferAttribute(S, 4)); g.instanceCount = n;
      const uni = { uTime, uAlong: { value: -999 }, uLineA: { value: new THREE.Vector4(swanLine.x, swanLine.z, swanLine.dx, swanLine.dz) }, uLineB: { value: new THREE.Vector2(WATER, 7.4) } };
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, side: THREE.DoubleSide });
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, uni);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', /* glsl */`#include <common>
          attribute float aW; attribute vec4 iS; uniform float uTime, uAlong; uniform vec4 uLineA; uniform vec2 uLineB;
          vec3 swanAt(vec3 p){ float al = uAlong - iS.x, k = smoothstep(-36., 24., al), air = smoothstep(0.015, 0.14, k);
            float d = abs(aW), sg = sign(aW), beat = sin(uTime * mix(17., 12., air) + iS.z * 40.), ang = (beat * mix(0.85, 0.6, air) + 0.12) * (0.55 + 1.1 * d);
            if (d > 0.) { p.x = sg * (0.09 + d * cos(ang)); p.y += d * sin(ang); }
            float pit = 0.30 * air * (1. - smoothstep(0.75, 1., k)) + 0.05; float cp = cos(pit), sp = sin(pit);
            p = vec3(p.x, p.y * cp + p.z * sp, p.z * cp - p.y * sp) * (0.96 * iS.w);
            vec2 D = uLineA.zw, Pp = vec2(D.y, -D.x); float e = exp(-max(al, 0.) / 14.), aD = al > 0. ? 14. * (1. - e) : al;
            vec2 hd = normalize(D * e - Pp * (1. - e)), sdv = vec2(hd.y, -hd.x);
            vec2 xz = uLineA.xy + D * aD + Pp * (iS.y - (max(al, 0.) - max(aD, 0.))) + hd * p.z + sdv * p.x;
            float y = uLineB.x + 0.22 + uLineB.y * k * sqrt(k) + 0.10 * air * sin(uTime * 1.7 + iS.z * 20.) + 0.04 * (1. - air) * beat;
            return vec3(xz.x, y + p.y, xz.y); }`)
          .replace('#include <begin_vertex>', 'vec3 transformed = swanAt(position);');
        sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * vec3(0.20, 0.24, 0.32);');
      };
      mat.customProgramCacheKey = () => 'btw-world-swans';
      const m = new THREE.Mesh(g, mat); m.name = 'btw-swans'; m.frustumCulled = false; scene.add(m);
      return { mesh: m, uni };
    })();
    await ctx.yield();

    // breath: one puff of vapour per animal every four seconds, lit gold against the sun
    const breathers = hero.animals.map((a) => ({ s: a.s, ox: 0, oz: HZ })).concat(fieldAnimals.map((a) => ({ s: a.s, ox: 0, oz: 0 })), wadeAnimals.map((s) => ({ s, ox: 0, oz: 0 })));
    const breath = (() => {
      const n = breathers.length, g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const A = new Float32Array(n * 4), B = new Float32Array(n), aA = new THREE.InstancedBufferAttribute(A, 4).setUsage(THREE.DynamicDrawUsage), aB = new THREE.InstancedBufferAttribute(B, 1).setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('sA', aA); g.setAttribute('sB', aB); g.instanceCount = n;
      const mat = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uSun: { value: sunDir.clone() }, uLit: { value: new THREE.Color(pal[4]).multiplyScalar(0.8) }, uAccent: { value: new THREE.Color(pal[6]) } }]),
        vertexShader: /* glsl */`attribute vec4 sA; attribute float sB; uniform vec3 uSun; varying vec2 vUv; varying vec2 vFx;
          #include <fog_pars_vertex>
          void main(){ vec4 mvPosition = viewMatrix * vec4(sA.xyz, 1.); mvPosition.xy += position.xy * sA.w; gl_Position = projectionMatrix * mvPosition;
            vec3 tv = sA.xyz - cameraPosition; float back = max(dot(tv / max(length(tv), 1e-3), normalize(uSun)), 0.); vUv = position.xy; vFx = vec2(sB, back * back * back);
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform vec3 uLit, uAccent; varying vec2 vUv; varying vec2 vFx;
          #include <fog_pars_fragment>
          void main(){ float r = dot(vUv, vUv); if (r > 1.) discard; float soft = (1. - r) * (1. - r);
            gl_FragColor = vec4(uLit + uAccent * vFx.y * 1.6, vFx.x * soft);
            #include <fog_fragment>
          }`,
        transparent: true, depthWrite: false, fog: true,
      });
      const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4; mesh.name = 'btw-breath';
      const amt = weather === 'wind' ? 0.16 : 0.3;
      return { mesh, update(time) {
        for (let i = 0; i < n; i++) {
          const b = breathers[i], s = b.s, age = (time + i * 1.37) % 4, k = s.rise >= 1 && age < 1.5 ? 1 : 0, sc = s.scale, hd = 1.36 * sc + 0.35 * age;
          A[i * 4] = s.x + b.ox + Math.sin(s.h) * hd - 0.25 * age * age * W.wind; A[i * 4 + 1] = (s.y0 ?? 0) + 0.62 * sc + 0.22 * age; A[i * 4 + 2] = s.z + b.oz + Math.cos(s.h) * hd;
          A[i * 4 + 3] = k * (0.10 + 0.34 * age); B[i] = k * amt * smoothstep(0, 0.2, age) * (1 - age / 1.5);
        }
        aA.needsUpdate = true; aB.needsUpdate = true;
      } };
    })();
    scene.add(breath.mesh);
    await ctx.yield();
    const duelDust = (() => {
      const bulls = spots.filter((q) => q.slot.tuck === -2 && q.s).map((q) => q.s), per = 6, n = Math.max(1, bulls.length * per), g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', breath.mesh.geometry.attributes.position); g.setIndex(breath.mesh.geometry.index);
      const A = new Float32Array(n * 4), B = new Float32Array(n), aA = new THREE.InstancedBufferAttribute(A, 4).setUsage(THREE.DynamicDrawUsage), aB = new THREE.InstancedBufferAttribute(B, 1).setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('sA', aA); g.setAttribute('sB', aB); g.instanceCount = n;
      const mesh = new THREE.Mesh(g, breath.mesh.material); mesh.frustumCulled = false; mesh.renderOrder = 4; mesh.name = 'btw-duel-dust'; mesh.visible = bulls.length > 0;
      return { mesh, update(time) {
        bulls.forEach((s, b) => {
          // the club is at its furthest when sin(phase) = 1; the puff is born there and drifts up and down-wind for 1.6 s
          const ph = time * 1.15 + Math.floor(s.seed * 2) * Math.PI, age = (((ph - Math.PI / 2) % TAU) + TAU) % TAU / 1.15, sc = s.scale;
          const lx = -1.36 * sc, lz = -2.3 * sc, hx = s.x + lx * Math.cos(s.h) + lz * Math.sin(s.h), hz = s.z - lx * Math.sin(s.h) + lz * Math.cos(s.h);
          for (let k = 0; k < per; k++) { const i = b * per + k, a = k * 2.4 + b, on = age < 1.6 ? 1 : 0, gr = 0.14 + 0.5 * age * (0.7 + 0.1 * k);
            A[i * 4] = hx + Math.sin(a) * gr * 0.7 - 0.3 * age * W.wind; A[i * 4 + 1] = 0.5 * sc + 0.16 * Math.cos(a * 1.7) + (0.25 + 0.06 * k) * age; A[i * 4 + 2] = hz + Math.cos(a) * gr * 0.7;
            A[i * 4 + 3] = on * (0.12 + 0.3 * age); B[i] = on * 0.42 * smoothstep(0, 0.12, age) * (1 - age / 1.6); }
        });
        aA.needsUpdate = true; aB.needsUpdate = true;
      } };
    })();
    scene.add(duelDust.mesh);

    // ---- THE OWLS: our mate (a burrowing owl, 0.23 m tall) flying 2-3 m ahead; we ourselves are not in the picture ----
    const featherGeo = (o) => {            // tiny vertex builder shared by both: ellipsoids and flat feathers; aW = signed span from the shoulder
      const P = [], C = [], W_ = [], I = []; let v = 0;
      const api = {
        ball(c, r, colFn, nu = 9, nv = 7) { const b = v;
          for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const th = i / nu * TAU, ph = j / nv * Math.PI, n = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)];
            P.push(c[0] + n[0] * r[0], c[1] + n[1] * r[1], c[2] + n[2] * r[2]); C.push(...colFn(n)); W_.push(0); v++; }
          for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = b + j * (nu + 1) + i, d = a + nu + 1; I.push(a, a + 1, d + 1, a, d + 1, d); } },
        quad(p0, p1, p2, p3, c0, c1, w0, w1) { P.push(...p0, ...p1, ...p2, ...p3); C.push(...c0, ...c0, ...c1, ...c1); W_.push(w0, w0, w1, w1); I.push(v, v + 1, v + 2, v, v + 2, v + 3); v += 4; },
        build() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
          g.setAttribute('aW', new THREE.Float32BufferAttribute(W_, 1)); g.setIndex(I); g.computeVertexNormals(); return g; },
      };
      o(api); return api.build();
    };
    const owlBrown = lin('#87755E'), owlBuff = lin('#D9C6A0'), owlWhite = lin('#EDE6D6'), owlDark = lin('#4a3a2a');
    const uOwl = { value: new THREE.Vector2(0, 0) };     // x flap angle, y fold
    const owlMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide });
    owlMat.onBeforeCompile = (sh) => {
      sh.uniforms.uOwl = uOwl;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aW; uniform vec2 uOwl;')
        .replace('#include <begin_vertex>', /* glsl */`#include <begin_vertex>
          { float d = abs(aW), sg = sign(aW), ang = mix(uOwl.x * (0.55 + 2.2 * d), -1.25, uOwl.y), k = mix(1., 0.45, uOwl.y);
            if (d > 0.) { transformed.x = sg * (0.045 + d * k * cos(ang)); transformed.y += d * k * sin(ang); transformed.z -= d * uOwl.y * 0.25; } }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * 0.12;');
    };
    owlMat.customProgramCacheKey = () => 'btw-world-owl';
    const owl = new THREE.Mesh(featherGeo((g) => {
      const spot = (n) => { const s = Math.sin(n[0] * 19 + n[1] * 7) * Math.sin(n[2] * 17 + n[1] * 11); return n[1] < -0.25 ? mix3(owlBuff, owlBrown, s > 0.3 ? 0.6 : 0) : mix3(owlBrown, owlWhite, s > 0.55 ? 0.8 : 0); };
      g.ball([0, 0, -0.02], [0.068, 0.062, 0.11], spot);                                  // body, carried level in flight
      g.ball([0, 0.026, 0.098], [0.06, 0.056, 0.056], (n) => (n[2] > 0.35 && n[1] > 0.05 ? owlWhite : n[2] > 0.5 ? owlBuff : spot(n)));   // round head, white brows, no ear tufts
      for (const sx of [-1, 1]) { g.ball([sx * 0.022, 0.03, 0.137], [0.012, 0.012, 0.008], () => [0.9, 0.62, 0.05], 6, 4); g.ball([sx * 0.022, 0.03, 0.143], [0.005, 0.005, 0.004], () => [0.02, 0.02, 0.02], 5, 3); }
      g.ball([0, 0.012, 0.142], [0.008, 0.012, 0.012], () => owlBuff, 5, 3);               // bill
      for (const sx of [-1, 1]) {                                                          // wings: inner panel and five fingered primaries, barred
        // one broad rounded wing, brown above and darker to the tip, a pale bar across the coverts: a bird's wing, not a striped ribbon
        for (let k = 0; k < 6; k++) { const d0 = k * 0.045, d1 = d0 + 0.046, t0 = k / 6, t1 = (k + 1) / 6, le = (t) => 0.075 - 0.03 * t - 0.07 * t * t, ch = (t) => 0.17 * (1 - 0.55 * t * t);
          const c0 = mix3(owlBrown, owlDark, 0.15 + 0.55 * t0), c1 = mix3(owlBrown, owlDark, 0.15 + 0.55 * t1), cm0 = mix3(c0, owlBuff, 0.55), cm1 = mix3(c1, owlBuff, 0.55);
          const x0 = sx * (0.045 + d0), x1 = sx * (0.045 + d1), m0 = le(t0) - ch(t0) * 0.45, m1 = le(t1) - ch(t1) * 0.45;
          g.quad([x0, 0.02, le(t0)], [x0, 0.02, m0], [x1, 0.02, m1], [x1, 0.02, le(t1)], c0, c1, sx * d0, sx * d1);
          g.quad([x0, 0.02, m0], [x0, 0.02, m0 - 0.022], [x1, 0.02, m1 - 0.022], [x1, 0.02, m1], cm0, cm1, sx * d0, sx * d1);
          g.quad([x0, 0.02, m0 - 0.022], [x0, 0.02, le(t0) - ch(t0)], [x1, 0.02, le(t1) - ch(t1)], [x1, 0.02, m1 - 0.022], c0, c1, sx * d0, sx * d1); }
        g.quad([sx * 0.016, -0.05, 0.0], [sx * 0.024, -0.05, 0.0], [sx * 0.026, -0.05, -0.2], [sx * 0.018, -0.05, -0.2], owlBuff, owlBuff, 0, 0);   // long bare legs, trailing
      }
      g.quad([-0.035, 0.01, -0.11], [0.035, 0.01, -0.11], [0.045, 0.0, -0.175], [-0.045, 0.0, -0.175], owlBrown, owlBuff, 0, 0);   // short tail
    }), owlMat);
    owl.name = 'btw-owl'; owl.frustumCulled = false; owl.scale.setScalar(1.35); scene.add(owl);
    await ctx.yield();
    // what is carried with the camera: one group, empty now. Our own wingtips read in stills as wedges cut by the frame edge,
    // so we are an owl by our mate flying ahead and by the height we fly at; anything added here is hidden through a portal
    const rider = new THREE.Group(); rider.name = 'btw-rider'; rider.visible = false; scene.add(rider);
    await ctx.yield();

    // ---- the air: ice dust drifting through the light (silt streaming on the windy day, a few flakes after snow) --------
    const air = (() => {
      const n = Math.round((weather === 'wind' ? 900 : 600) * detail), P = new Float32Array(n * 3), S = new Float32Array(n);
      for (let i = 0; i < n; i++) { P[i * 3] = pr(); P[i * 3 + 1] = pr(); P[i * 3 + 2] = pr(); S[i] = pr(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aS', new THREE.BufferAttribute(S, 1));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime, uPx: { value: 450 }, uDrift: { value: new THREE.Vector3(-0.9, 0, -0.35).multiplyScalar(weather === 'wind' ? 5.5 : weather === 'snow' ? 0.2 : 0.6) }, uFall: { value: weather === 'wind' ? 0.05 : 0.22 },
          uSun: { value: sunDir.clone() }, uLit: { value: new THREE.Color(weather === 'wind' ? W.ground[1] : pal[4]).multiplyScalar(weather === 'wind' ? 0.75 : 1.0) }, uAccent: { value: new THREE.Color(pal[6]) },
          uSize: { value: weather === 'wind' ? 0.05 : weather === 'snow' ? 0.035 : 0.022 }, uAmt: { value: weather === 'wind' ? 0.55 : 0.8 } },
        vertexShader: /* glsl */`attribute float aS; uniform float uTime, uPx, uFall, uSize; uniform vec3 uDrift, uSun; varying vec2 vFx;
          void main(){ vec3 box = vec3(36., 6.5, 36.);
            vec3 q = position * box + uDrift * uTime * (0.7 + 0.6 * aS); q.y -= uTime * uFall * (0.5 + aS);
            q.x += 0.4 * sin(uTime * 0.6 + aS * 40.); q.z += 0.4 * cos(uTime * 0.5 + aS * 31.);
            vec3 w = vec3(cameraPosition.x, 0., cameraPosition.z) + vec3(mod(q.x - cameraPosition.x, box.x) - 0.5 * box.x, mod(q.y, box.y) + 0.1, mod(q.z - cameraPosition.z, box.z) - 0.5 * box.z);
            vec4 mv = viewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mv; float d = max(-mv.z, 0.05);
            gl_PointSize = clamp(uSize * (0.6 + 0.8 * aS) * uPx / d, 1.0, 22.);
            vec3 tv = w - cameraPosition; float back = max(dot(tv / max(length(tv), 1e-3), normalize(uSun)), 0.);
            float tw = 0.5 + 0.5 * sin(uTime * (0.6 + aS) + aS * 50.);
            vFx = vec2(smoothstep(0.7, 2.2, d) * (1. - smoothstep(11., 17., d)) * (0.35 + 0.65 * tw), back * back * back); }`,
        fragmentShader: /* glsl */`uniform vec3 uLit, uAccent; uniform float uAmt; varying vec2 vFx;
          void main(){ vec2 c = gl_PointCoord - 0.5; float r = dot(c, c) * 4.; if (r > 1.) discard;
            gl_FragColor = vec4(uLit * (0.8 + 0.6 * vFx.y) + uAccent * vFx.y * 2.2, (1. - r) * vFx.x * uAmt); }`,
        transparent: true, depthWrite: false,
      });
      const m = new THREE.Points(g, mat); m.frustumCulled = false; m.renderOrder = 6; m.name = 'btw-air'; return m;
    })();
    scene.add(air);
    await ctx.yield();

    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);
    await ctx.yield();

    // ---- the flight ---------------------------------------------------------------------------------------------
    // our mate keeps to one side of what we are looking at: right of the entry boulders, left of the file, right over the water
    const OWL_SIDE = (u) => 1.7 - 3.3 * smoothstep(0.17, 0.24, u) + 3.4 * smoothstep(0.44, 0.52, u) - 3.0 * smoothstep(0.82, 0.88, u);
    const landing = hero.anchors.owlLanding.clone().add(new THREE.Vector3(0, 0.02, HZ));
    const firstAt = hero.anchors.firstRiser.clone().add(new THREE.Vector3(0, 0.9, HZ));
    const crosser = spots.find((q) => q.cross), stander = spots.find((q) => q.stander), duelAt = rare ? new THREE.Vector3(spots.find((q) => q.slot.tuck === -2).x, 1.0, spots.find((q) => q.slot.tuck === -2).z) : null;
    const talaPerch = new THREE.Vector3(tala.position.x - RX * 2.2, tala.position.y + 5.7, tala.position.z - RZ * 2.6);
    const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _size = new THREE.Vector2(), _poi = new THREE.Vector3();
    const [macX, macZ] = stToWorld(19, -33);
    const uBank = path.nearestXZ(...stToWorld(15, 0)).u, uFar = path.nearestXZ(...stToWorld(107, 0)).u;
    const pois = [
      { at: firstAt, from: 0.095, to: 0.178, fade: 0.22, weight: 0.78 },
      { at: new THREE.Vector3(stander.x, 0.8, stander.z), from: 0.305, to: 0.35, weight: 0.6 },
      { at: () => _poi.set(crosser.s.x, 0.9, crosser.s.z), from: 0.352, to: 0.385, weight: 0.5 },
      { at: new THREE.Vector3(slothAt.x * 0.55 + treeAt.x * 0.45, 3.3, slothAt.z * 0.55 + treeAt.z * 0.45), from: 0.385, to: 0.47, fade: 0.25, weight: 0.95 },
      { at: new THREE.Vector3(macX, 0.5, macZ), from: uBank - 0.075, to: uBank - 0.005, weight: 0.3 },
    ];
    if (duelAt) pois.splice(2, 1, { at: duelAt, from: 0.352, to: 0.4, weight: 0.4 });
    const update = (dt, time, camera, u) => {
      uTime.value = time;
      sky.update(dt, time, camera);
      hero.setProgress(u); hero.update(dt, time, camera);
      for (const h of herds) { h.setProgress(u); h.update(dt, time); }
      for (let i = 0; i < fieldAnimals.length; i++) { const s = fieldAnimals[i].s, e = smoothstep(0.05, 0.9, s.rise); fieldShadows.set(i, s.x, s.z, (1.12 + 0.36 * e) * s.scale, (0.95 - 0.1 * e) * s.scale); }
      fieldShadows.commit(); fieldFx.update(dt, time, camera);
      st.setProgress(u); st.update(dt, time);
      // the field is drawn until it is well behind us; the waders change to their full models while we look at the sloth
      const fieldOn = u < 0.56, close = u > 0.47;
      hero.object.visible = u < 0.26;                                  // the patch is behind us once we have swung north-west st.object.visible = u < uBank + 0.1;
      for (const h of groupHerds[0]) h.mesh.visible = u < 0.135; for (const h of groupHerds[1]) h.mesh.visible = u < 0.385; for (const h of groupHerds[2]) h.mesh.visible = fieldOn && u > 0.125; tala.visible = u > 0.4; fieldTree.visible = u < 0.42;
      const over = u > 0.6;                                          // on the turn down to the water: the six we fly between get their full models and mirror images
      wadeHi.forEach((h, i) => { const on = over && u < (h.kind === 'glyptodon' ? 0.815 : 0.87); h.mesh.visible = on; mirrors[i].visible = on; }); for (const h of wadeLo) h.mesh.visible = !over && u > 0.26;
      outHerd.mesh.visible = outMirror.visible = u > 0.7 && u < 0.9;
      for (const h of wadeFar) h.mesh.visible = u > 0.26; for (const m of mirrorsFar) m.visible = close; for (const h of wadeLand) h.mesh.visible = u > 0.42 && u < 0.635; for (const h of wadeSpit) h.mesh.visible = u > 0.8; for (const h of wadeSpitLo) h.mesh.visible = u > 0.64 && u <= 0.8;
      for (let i = 0; i < landStates.length; i++) { const q = landStates[i], on = (q.y0 ?? 0) > -0.12 ? 1 : 0; landShadows.set(i, q.x, q.z, 1.48 * q.scale * on, 0.85 * q.scale * on); }
      landShadows.commit();
      for (let i = 0; i < wadeAnimals.length; i++) { const s = wadeAnimals[i]; uWade.value[i].set(s.x, s.z, 4.7 * s.scale, s.moving ? 1 : 0); }
      for (const m of tuftMeshes) m.visible = (m.userData.c + 1) / NT > u - 0.045 && m.userData.c / NT < u + 0.17;      // tufts 150 m off are under a pixel
      fauna.update(dt, time, camera, u); water.material.uniforms.uSwanA.value = (u - U_SWAN) * SWAN_SPEED * DUR;
      swans.uni.uAlong.value = (u - U_SWAN) * SWAN_SPEED * DUR + 9; swans.mesh.visible = u > 0.55;
      breath.update(time); if (duelDust.mesh.visible) duelDust.update(time);
      ctx.renderer.getDrawingBufferSize(_size); air.material.uniforms.uPx.value = _size.y;

      // our mate: ahead of us, down onto the first boulder at u 0.146, off again as it heaves, and at the end up to the tala
      const d = u * L, kLand = smoothstep(0.105, 0.14, u) * (1 - smoothstep(0.151, 0.161, u)), kEnd = smoothstep(0.87, 0.94, u);
      const lead = 4.4 + 1.0 * smoothstep(0.2, 0.3, u) + 5.5 * smoothstep(0.5, 0.56, u) * (1 - smoothstep(0.64, 0.7, u)) + 0.25 * Math.sin(time * 0.7);
      path.posAtDist(d + lead, _a); path.tangentAtDist(d + lead, _b);
      const rx = -_b.z, rz = _b.x, side = OWL_SIDE(u) + 0.2 * Math.sin(time * 0.43), flapOn = smoothstep(-0.25, 0.15, Math.sin(time * 2.1 + 0.6));
      _a.x += rx * side; _a.z += rz * side; _a.y += -0.62 + 1.25 * smoothstep(0.17, 0.22, u) * (1 - smoothstep(0.4, 0.46, u)) + 0.07 * Math.sin(time * 1.9) + 1.5 * Math.sin(Math.PI * clamp((u - 0.151) / 0.04, 0, 1));
      _a.lerp(landing, kLand).lerp(talaPerch, kEnd);
      const perched = Math.max(smoothstep(0.985, 1, kLand), smoothstep(0.985, 1, kEnd));
      owl.position.copy(_a);
      owl.rotation.set(-1.05 * perched, Math.atan2(_b.x, _b.z) + Math.PI * perched * 0.85, 0, 'YXZ');
      uOwl.value.set((Math.sin(time * 34) * 0.5 * (0.25 + 0.75 * flapOn) + 0.3) * (1 - perched), perched);

      // what is carried with the camera: one group, hidden while this world is only a picture in the last world's portal
      rider.visible = u > 0 && !ctx.through;
      camera.matrixWorld.decompose(_c, _q, _s); rider.position.copy(_c); rider.quaternion.copy(_q);
    };

    return {
      scene, path, duration: DUR, pace,
      title: 'The Walking Boulders · 30,000 years ago',
      camera: { fov: 62, near: 0.25, nearThrough: 0.3, far: 3200, lookAhead: 12, sway: 0.5, bank: 0.16 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#FFCB8C', glow: 1, revealDistance: 190 },
      post: { exposure: W.exposure, bloom: { strength: 0.3, radius: 0.55, threshold: 0.95 },
        grade: { saturation: weather === 'snow' ? 1.08 : 1.1, contrast: 1.1, tint: weather === 'snow' ? '#f4f6fa' : '#fff8ee', shadowTint: '#060a16', vignette: 0.26, grain: 0.018 } },
      ride: 'none', companion: 'none',
      update,
      dispose() { sky.dispose?.(); geoLoG.dispose(); geoLoD.dispose(); clumpLo.dispose(); clumpHi[0].dispose(); clumpHi[1].dispose(); },
    };
  },
};
