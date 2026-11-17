// The Same Minute: a closed loop in time. The route crosses itself, and another of us is always 0.42 of the
// journey ahead and behind, so one instant at the diamond is lived twice, once from each side.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, buildDressing, buildCountry, routePoints, makeNearest, planAt, railY, CLOUD_GLSL, CAST_GLSL, GAP, DIAMOND, BACK } from '../parts/the-same-minute.js';

const FOG_PARS = /* glsl */`
uniform vec3 uFogColor; uniform float uFogDensity;
vec3 withFog(vec3 c, float d) { float f = 1.0 - exp(-uFogDensity * uFogDensity * d * d); return mix(c, uFogColor, clamp(f, 0.0, 1.0)); }`;
const LIGHT_PARS = /* glsl */`
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uGndCol; uniform vec3 uShadowTone;
vec3 lightOn(vec3 n) { return uSunCol * max(dot(n, uSunDir), 0.0) + mix(uGndCol, uSkyCol, 0.5 + 0.5 * n.y); }`;

export default {
  id: 'the-same-minute',
  name: 'The Same Minute',
  category: 'bizarre',
  weirdness: 0.6,
  media: ['rail', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, q = ctx.quality || { detail: 1 };
    const detail = q.detail ?? 1;
    // ---- the three variations (the constants 0.42 and 30 m, the flat pace and the single red never change)
    const rHour = rng(), rHand = rng(), rWind = rng();
    const evening = vary.hour === 'golden' ? true : (vary.hour === 'day' || vary.hour === 'dawn') ? false : rHour < 0.36;   // THE HOUR
    const mirror = rHand < 0.5 ? 1 : -1;                                                                                   // THE HAND
    const onshore = rWind < 0.34;                                                                                          // THE WIND
    const rare = !!vary.rare;                                                                                              // lost balloons never fade
    const pal = {
      turf: evening ? '#8FA63C' : '#5FA044', tip: evening ? '#B2C862' : '#9CCB66',
      deep: evening ? '#4F8638' : '#3F8A42', straw: evening ? '#B6BC68' : '#A8C06C',
      chalk: onshore ? '#E4E2D8' : '#F4F1E6', chalkMean: onshore ? '#DBD9CF' : '#EDEAE0',
      cream: '#F2E6C8', roof: '#E3D3A8', brass: '#B88A3A', red: '#E0241B', white: '#F4F1E6',
      steam: evening ? '#FFF4E2' : '#FFFFFF', steamShade: evening ? '#C9B9A8' : '#B9CBD6',
      sea: evening ? '#3F7396' : '#3F82AE', haze: evening ? '#EFDDBE' : '#C9DDE6', zenith: evening ? '#3E74BC' : '#3C7FCC',
    };
    const scene = new THREE.Scene();
    const fogColor = new THREE.Color(pal.haze), FOGD = 0.0015;   // haze pales the far turf into the sea
    scene.fog = new THREE.FogExp2(fogColor, FOGD);

    // ---- one key, one fill. Nothing relights: the same light at both crossings is part of the proof.
    // A low key rakes the down: 30 degrees in the morning, 16 in the evening (every car then lays a shadow 4.4 times its height).
    const el = (evening ? 16 : 30) * Math.PI / 180;
    // The evening key comes level across both legs from the same side as the morning's (the brief's south-west put it behind
    // the earlier self at the second crossing: a grey tram, and shadows pointing at the lens, too foreshortened to read).
    // From here every shadow lies long ACROSS the view at both crossings and the earlier self stands sunlit cream.
    const hz = evening ? new THREE.Vector2(0.995, 0.02) : new THREE.Vector2(0.99, -0.12);   // a touch uphill of level: the earlier self's bows catch it too
    hz.normalize();
    const sunDir = new THREE.Vector3(hz.x * Math.cos(el) * mirror, Math.sin(el), hz.y * Math.cos(el));
    const keyCol = new THREE.Color(evening ? '#FFB872' : '#FFF0D2'), keyI = evening ? 3.9 : 3.3;
    const key = new THREE.DirectionalLight(keyCol, keyI); key.position.copy(sunDir).multiplyScalar(100); scene.add(key, key.target);
    const HEMI = evening ? 0.92 : 1.1;   // shade stays blue-green, never black, but it is shade: the key models the hill
    const hemi = new THREE.HemisphereLight(evening ? '#A9C2E0' : '#9CC7E8', evening ? '#9CA860' : '#7FA85A', HEMI); scene.add(hemi);
    const light = {
      uSunDir: { value: sunDir }, uSunCol: { value: keyCol.clone().multiplyScalar(keyI / Math.PI) },
      uSkyCol: { value: new THREE.Color('#9CC7E8').multiplyScalar(HEMI * 0.85 / Math.PI) }, uGndCol: { value: new THREE.Color(evening ? '#9CA860' : '#7FA85A').multiplyScalar(HEMI * 0.85 / Math.PI) },
      uShadowTone: { value: new THREE.Color('#2F5F4A') },
    };
    // cast shadows are drawn by the surfaces they fall on (CAST_GLSL in the part): the four other cars, the hut, the thorn
    const cast = {
      uCars: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, -999, 0, 0)) }, uStill: { value: [new THREE.Vector4(0, 0, 1, 0), new THREE.Vector4(0, 0, 1, 0)] },
      // the evening's shadows are 4.4 times as long as their casters are tall, measured on the turf (which climbs the way the light travels)
      uCast: { value: new THREE.Vector4(-sunDir.x / Math.cos(el), -sunDir.z / Math.cos(el), evening ? 4.4 : 1 / Math.tan(el), 1) },
      uGate: { value: new THREE.Vector4(0, 9999, 0, 9999) }, uGatePost: { value: new THREE.Vector4(0, 9999, 0, 9999) },
    };
    const fog = { uFogColor: { value: fogColor }, uFogDensity: { value: FOGD } };
    const uTime = { value: 0 };

    // ---- the line, and the ground carved to it
    const path = makePath(routePoints(mirror));
    await ctx.yield();
    const nearest = makeNearest(mirror);
    const KN = { x: 0, z: DIAMOND.knollZ, h: 8.5, r: 16 };
    const BZ = [[-520, 30], [-420, 62], [-330, 88], [-250, 99], [-131, 84.5], [0, 45.2], [150, 24], [200, 19.4], [332, 6.5], [400, 6.5]];   // the down runs low to the cliff's lip, so the sea shows over it
    const base = (z) => {
      z = Math.max(-519, Math.min(399, z));
      let i = 0; while (i < BZ.length - 2 && z > BZ[i + 1][0]) i++;
      const a = BZ[i], b = BZ[i + 1], t = (z - a[0]) / (b[0] - a[0]);
      const m0 = i > 0 ? (b[1] - BZ[i - 1][1]) / (b[0] - BZ[i - 1][0]) : (b[1] - a[1]) / (b[0] - a[0]);
      const m1 = i < BZ.length - 2 ? (BZ[i + 2][1] - a[1]) / (BZ[i + 2][0] - a[0]) : (b[1] - a[1]) / (b[0] - a[0]);
      const d = b[0] - a[0], t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * a[1] + (t3 - 2 * t2 + t) * d * m0 + (-2 * t3 + 3 * t2) * b[1] + (t3 - t2) * d * m1;
    };
    const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    let lastRail = 99;
    const heightAt = (x, z) => {
      let h = base(z) - 0.00011 * x * x + 1.6 * ctx.noise.fbm2(x * 0.006 + 7, z * 0.006, 3);
      const dk = Math.hypot(x - KN.x, z - KN.z); h += KN.h * Math.exp(-(dk * dk) / (2 * KN.r * KN.r));
      const n = nearest(x, z); lastRail = n.dist;
      // the down is folded: dry combes and rounded spurs running down the fall line either side of the figure, so the low
      // key has flanks to light and hollows to leave in blue-green shade. They die away toward the line (sight lines stay clear).
      const away = sstep(26, 150, n.dist) * (1 - 0.6 * sstep(150, 300, z)), xs = x + 0.22 * z + 26 * Math.sin(z * 0.011 + 1.0);
      h += away * (7.5 * Math.sin(xs * 0.0262 + 0.6) * (0.75 + 0.25 * Math.sin(z * 0.009 + 2.0)) + 3.2 * Math.sin(xs * 0.057 + z * 0.012 + 2.4) + 2.2 * ctx.noise.fbm2(x * 0.017 + 3, z * 0.017 + 9, 2));
      h = h + (Math.min(n.y, n.low) - 0.42 - h) * (1 - sstep(5.5, 36, n.dist));
      h = Math.max(h, 4.5);
      const edge = Math.min(332 - z, 372 - Math.abs(x));
      return -7 + (h + 7) * sstep(-3, 9, edge);
    };
    await ctx.yield();

    // 8 bit noise (no float textures): r fine, g mottle, b broad
    const NT = 256, nd = new Uint8Array(NT * NT * 4), nr = rng.fork('noise');
    for (let i = 0; i < NT * NT; i++) {
      nd[i * 4] = (nr() * 255) | 0; nd[i * 4 + 1] = (nr() * 255) | 0; nd[i * 4 + 2] = (nr() * 255) | 0; nd[i * 4 + 3] = 255;
      if (i % 4096 === 0) await ctx.yield();
    }
    const noiseTex = new THREE.DataTexture(nd, NT, NT, THREE.RGBAFormat, THREE.UnsignedByteType);
    noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping; noiseTex.magFilter = THREE.LinearFilter; noiseTex.minFilter = THREE.LinearMipmapLinearFilter;
    noiseTex.generateMipmaps = true; noiseTex.anisotropy = 8; noiseTex.needsUpdate = true;

    // one heightfield, 160 x 180, built in bands
    const NX = 160, NZ = 180, X0 = -400, X1 = 400, Z0 = -330, Z1 = 345;
    const hs = new Float32Array((NX + 1) * (NZ + 1)), trail = new Float32Array((NX + 1) * (NZ + 1)), tpos = new Float32Array((NX + 1) * (NZ + 1) * 3), tnor = new Float32Array((NX + 1) * (NZ + 1) * 3), thol = new Float32Array((NX + 1) * (NZ + 1));
    for (let j = 0; j <= NZ; j++) {
      const z = Z0 + ((Z1 - Z0) * j) / NZ;
      for (let i = 0; i <= NX; i++) {
        const x = X0 + ((X1 - X0) * i) / NX, k = j * (NX + 1) + i, h = heightAt(x, z);
        hs[k] = h; trail[k] = lastRail; tpos[k * 3] = x; tpos[k * 3 + 1] = h; tpos[k * 3 + 2] = z;
      }
      await ctx.yield();
    }
    const dxs = (X1 - X0) / NX, dzs = (Z1 - Z0) / NZ, tidx = new Uint32Array(NX * NZ * 6);
    for (let j = 0; j <= NZ; j++) {
      for (let i = 0; i <= NX; i++) {
        const k = j * (NX + 1) + i;
        const hl = hs[j * (NX + 1) + Math.max(i - 1, 0)], hr = hs[j * (NX + 1) + Math.min(i + 1, NX)];
        const hu = hs[Math.max(j - 1, 0) * (NX + 1) + i], hd = hs[Math.min(j + 1, NZ) * (NX + 1) + i];
        const nx = -(hr - hl) / (2 * dxs), nz = -(hd - hu) / (2 * dzs), l = Math.hypot(nx, 1, nz);
        tnor[k * 3] = nx / l; tnor[k * 3 + 1] = 1 / l; tnor[k * 3 + 2] = nz / l;
        const W4 = 4, a4 = hs[j * (NX + 1) + Math.max(i - W4, 0)] + hs[j * (NX + 1) + Math.min(i + W4, NX)] + hs[Math.max(j - W4, 0) * (NX + 1) + i] + hs[Math.min(j + W4, NZ) * (NX + 1) + i];
        thol[k] = Math.max(-1, Math.min(1, (a4 - 4 * hs[k]) / 3.2));          // above 0 in a hollow, below on a crest
        if (i < NX && j < NZ) { const o = (j * NX + i) * 6, a = k, b = k + 1, c = k + NX + 1, d = k + NX + 2; tidx[o] = a; tidx[o + 1] = c; tidx[o + 2] = b; tidx[o + 3] = b; tidx[o + 4] = c; tidx[o + 5] = d; }
      }
      if (j % 12 === 11) await ctx.yield();
    }
    const tgeo = new THREE.BufferGeometry();
    tgeo.setAttribute('position', new THREE.BufferAttribute(tpos, 3)); tgeo.setAttribute('normal', new THREE.BufferAttribute(tnor, 3)); tgeo.setIndex(new THREE.BufferAttribute(tidx, 1)); tgeo.setAttribute('aRail', new THREE.BufferAttribute(trail, 1)); tgeo.setAttribute('aHollow', new THREE.BufferAttribute(thol, 1));
    // ---- the sward's colour and light, shared by the turf (per fragment) and the grass blades (per tuft), so a cloud
    // shadow, a tram's shadow, the lee of a spur and a silver gust fall on ground and blades alike
    const ringP = planAt(840, mirror), ringQ = planAt(839, mirror), ringD = { x: ringP.x - ringQ.x, z: ringP.z - ringQ.z };
    const TG = 1;       // the morning key is whiter and higher: the same turf must not go neon under it
    const sward = {
      ...light, ...fog, ...cast, uTime, uNoise: { value: noiseTex }, uTurf: { value: new THREE.Color(pal.turf).multiplyScalar(TG) }, uTip: { value: new THREE.Color(pal.tip).multiplyScalar(TG) },
      uDeep: { value: new THREE.Color(pal.deep).multiplyScalar(TG) }, uStraw: { value: new THREE.Color(pal.straw).multiplyScalar(TG) }, uWind: { value: onshore ? 1.5 : 1.0 }, uWet: { value: onshore ? 1 : 0 },
      uRelief: { value: 2.4 }, uShade: { value: new THREE.Color(evening ? '#A0DCD6' : '#E0F0E6') }, uAmb: { value: evening ? 1.3 : 1.25 }, uDesat: { value: evening ? 0.10 : 0.12 }, uWrap: { value: evening ? 0.22 : 0.02 },
      uRing: { value: new THREE.Vector4(ringP.x, ringP.z, ringD.x, ringD.z) }, uHand: { value: mirror }, uSilver: { value: new THREE.Color(evening ? '#D8D890' : '#BFE28C') }, uSheen: { value: evening ? 0.18 : 0.13 }, uLift: { value: new THREE.Color(0.060, 0.050, 0.070).multiplyScalar(evening ? 0.62 : 0.6) }, uKeyWhite: { value: evening ? 0.62 : 0 },
    };
    const SWARD_GLSL = /* glsl */`
      ${FOG_PARS}
      ${LIGHT_PARS}
      ${CLOUD_GLSL}
      ${CAST_GLSL}
      uniform sampler2D uNoise; uniform vec3 uTurf; uniform vec3 uTip; uniform vec3 uDeep; uniform vec3 uStraw; uniform vec3 uShade; uniform vec3 uSilver;
      uniform float uTime; uniform float uWind; uniform float uWet; uniform float uRelief; uniform float uAmb; uniform float uDesat; uniform float uWrap; uniform float uHand; uniform float uSheen; uniform vec3 uLift; uniform float uKeyWhite; uniform vec4 uRing;
      // silver gusts running through the tips (long across the slope, short along it)
      float windBand(vec2 p) {
        float g1 = textureLod(uNoise, vec2(p.x * 0.00035 + 0.3, p.y * 0.0011 + uTime * 0.0105 * uWind), 0.0).g;
        float g2 = textureLod(uNoise, vec2(p.x * 0.0009, p.y * 0.0029 + uTime * 0.021 * uWind) + 0.5, 0.0).b;
        return smoothstep(0.44, 0.72, g1) * 0.75 + smoothstep(0.50, 0.80, g2) * 0.5;
      }
      // the broad colour of the down: pale dry crests, deep green hollows, sheep-cropped patches and long drifts
      vec3 swardBase(vec2 p, float hollow, out float lush) {
        float patch1 = textureLod(uNoise, p * 0.0031 + 0.2, 0.0).g, patch2 = textureLod(uNoise, p * 0.00115, 0.0).b, drift = textureLod(uNoise, p * vec2(0.00042, 0.00027) + 0.5, 0.0).r;
        lush = clamp(0.5 + (patch1 - 0.5) * 0.7 + (patch2 - 0.5) * 1.3 + (drift - 0.5) * 1.0 + hollow * 0.45, 0.0, 1.0);
        vec3 c = mix(mix(uTurf, uStraw, 0.55), uTurf, smoothstep(0.08, 0.46, lush));
        c = mix(c, uDeep, smoothstep(0.52, 0.95, lush));
        return mix(c, vec3(dot(c, vec3(0.3, 0.55, 0.15))) * vec3(1.04, 1.0, 0.86), uDesat) * (1.0 - 0.12 * uWet);
      }
      // light on the sward: the key on a relief-steepened normal (a painter's modelling of the hill), cloud and cast
      // shadow taken out of the key only, and a cool blue-green fill that owns the shade. sun is how much key arrives.
      vec3 swardLight(vec3 n, vec3 micro, vec3 w, float hollow, out float sun, out vec3 sheen) {
        // only the shape of the hill is steepened; tussocks and blades tip the normal by their true amount (or a lee slope breaks into blotches)
        vec3 ne = normalize(normalize(vec3(n.x * uRelief, max(n.y, 0.05), n.z * uRelief)) + micro);
        float ndl = clamp(dot(ne, uSunDir) * 1.25 + uWrap, 0.0, 1.0);
        vec2 rq = w.xz - uRing.xy; float along = dot(rq, uRing.zw), across = dot(rq, vec2(-uRing.w, uRing.z));
        // a still pool of cloud shade lies on the turf behind the ring, so the ring glows against something darker than itself.
        // It is lopsided: it stops short of the first metres of the entry leg, which cross behind the ring 50 m off.
        float acm = across * uHand;
        float pool = smoothstep(-10.0, 14.0, along) * (1.0 - smoothstep(120.0, 220.0, along)) * smoothstep(-12.0, 6.0, acm) * (1.0 - smoothstep(55.0, 95.0, acm));
        float cs = max(cloudShade(w.xz, uTime), pool * 0.95);
        float cst = castShade(w);
        sun = ndl * (1.0 - 0.84 * cs) * (1.0 - 0.96 * cst);
        vec3 amb = mix(uGndCol, uSkyCol, 0.5 + 0.5 * ne.y) * uAmb * (1.0 - 0.32 * clamp(hollow, 0.0, 1.0)) * (1.0 - 0.10 * cs) * (1.0 - 0.30 * cst);
        float shadeK = 1.0 - smoothstep(0.0, 0.55, sun);
        // waxy blades carry the sky, and shade is lifted toward the brief's blue-green #2F5F4A: never black, never a dead teal
        sheen = uSkyCol * (0.02 + uSheen * shadeK) + uLift * shadeK;
        vec3 keyC = mix(uSunCol, vec3(dot(uSunCol, vec3(0.3, 0.5, 0.2))), uKeyWhite);   // grass answers a gold key with gold-green, not mustard
        return keyC * sun + amb * mix(vec3(1.0), uShade, shadeK);
      }`;
    const turfMat = new THREE.ShaderMaterial({
      uniforms: { ...sward, uChalk: { value: new THREE.Color(pal.chalk).multiplyScalar(0.8) } },
      vertexShader: /* glsl */`
        attribute float aRail; attribute float aHollow;
        varying vec3 vW; varying vec3 vN; varying float vDist; varying float vRail; varying float vHollow;
        void main() { vW = position; vN = normal; vRail = aRail; vHollow = aHollow; vec4 mv = viewMatrix * vec4(position, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`
        ${SWARD_GLSL}
        uniform vec3 uChalk;
        varying vec3 vW; varying vec3 vN; varying float vDist; varying float vRail; varying float vHollow;
        void main() {
          vec2 p = vW.xz;
          // every scale of detail leaves before it is smaller than a pixel is deep at this grazing angle: fine grain by 40 m,
          // tussocks by 72 m, mottle by 150 m; beyond that the down is broad clean tones (crest, hollow, cloud shadow, gust)
          float close = 1.0 - smoothstep(8.0, 40.0, vDist), near = 1.0 - smoothstep(14.0, 55.0, vDist), mid = 1.0 - smoothstep(30.0, 72.0, vDist), far = 1.0 - smoothstep(60.0, 150.0, vDist);
          float lush; vec3 c = swardBase(p, vHollow, lush);
          float patch1 = texture2D(uNoise, p * 0.0031 + 0.2).g;
          float fine = texture2D(uNoise, p * vec2(0.33, 0.21) + 0.23).g, fine2 = texture2D(uNoise, p * vec2(0.17, 0.29) + 0.71).r;
          float blade = texture2D(uNoise, p * vec2(0.115, 0.071)).r;
          float tuss = texture2D(uNoise, p * vec2(0.027, 0.019) + 0.61).b, tuss2 = texture2D(uNoise, p * 0.0094 + 0.13).r;
          float grain = smoothstep(0.30, 0.70, fine) * 0.55 + smoothstep(0.32, 0.68, fine2) * 0.45;
          float wave = windBand(p) * (1.0 - 0.5 * smoothstep(300.0, 700.0, vDist));
          float tip = clamp(0.30 + (blade - 0.5) * 0.9 * near + (tuss - 0.5) * 0.45 * mid + (tuss2 - 0.5) * 0.3 * far + wave * 0.55 - (lush - 0.5) * 0.3, 0.0, 1.0);
          c = mix(c, uTip, tip * 0.52);
          // under the blades the ground is the dark between their roots; where the blades have sunk away it is the sward's mean
          float under = (1.0 - smoothstep(20.0, 44.0, vDist)) * (1.0 - smoothstep(21.0, 26.0, vRail));
          c *= mix(1.0, 0.62 + 0.62 * grain, close) * (1.0 - 0.16 * under);
          c *= 0.92 + 0.16 * mix(0.5, tuss, mid);
          vec3 micro = vec3((tuss - 0.5) * 0.14 * mid + (blade - 0.5) * 0.22 * near, 0.0, (tuss2 - 0.5) * 0.10 * far + (fine2 - 0.5) * 0.24 * near);
          // the verge: dry pale grass and chalk crumbs beside the bed, where the ballast has spilled
          float verge = 1.0 - smoothstep(2.2, 7.0, vRail + (patch1 - 0.5) * 3.0);
          c = mix(c, uStraw * (0.8 + 0.4 * fine), verge * 0.35);
          float crumb = smoothstep(0.80, 0.86, texture2D(uNoise, p * 0.23 + 0.13).g) * (1.0 - smoothstep(1.6, 5.0, vRail + (tuss - 0.5) * 2.0)) * near;
          c = mix(c, uChalk * 1.05, crumb * 0.9);
          c += uSilver * wave * 0.16;                                                                // the silver of turned blades
          // bare chalk where the down breaks off into the cliff
          float steep = 1.0 - smoothstep(0.55, 0.80, vN.y / max(length(vN), 1e-3));
          c = mix(c, uChalk * (0.80 + 0.35 * patch1) * (0.9 + 0.2 * blade), steep);
          float lip = smoothstep(318.0, 327.0, vW.z + (patch1 - 0.5) * 9.0 + (tuss - 0.5) * 3.0 * mid);
          c = mix(c, uChalk * 1.15, lip * 0.85);                                                     // the lip of the cliff: turf worn back to bright chalk
          float sun; vec3 sheen; vec3 lit = swardLight(normalize(vN), micro, vW, vHollow, sun, sheen);
          gl_FragColor = vec4(withFog(c * lit + sheen * (1.0 - steep), vDist), 1.0);
        }`,
    });
    const turf = new THREE.Mesh(tgeo, turfMat); turf.frustumCulled = false; scene.add(turf);
    await ctx.yield();
    const gridH = (x, z) => {
      const fx = Math.max(0, Math.min(NX - 1e-3, (x - X0) / dxs)), fz = Math.max(0, Math.min(NZ - 1e-3, (z - Z0) / dzs));
      const i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j, k = j * (NX + 1) + i;
      return (hs[k] * (1 - a) + hs[k + 1] * a) * (1 - b) + (hs[k + NX + 1] * (1 - a) + hs[k + NX + 2] * a) * b;
    };
    // a cheap "is this within 2.4 m of a rail" test for the grass: rail samples every metre, hashed into 4 m cells
    const GW = 1600, GH = 1350, occ = new Uint8Array(GW * GH), ro = { x: 0, z: 0 };       // half-metre cells over the whole down
    for (let i = 0; i <= (840 + BACK) * 2; i++) {
      planAt(-BACK + i * 0.5, mirror, ro);
      const cx = Math.floor((ro.x - X0) * 2), cz = Math.floor((ro.z - Z0) * 2);
      for (let dz = -5; dz <= 5; dz++) for (let dx = -5; dx <= 5; dx++) {
        const gx = cx + dx, gz = cz + dz; if (gx < 0 || gz < 0 || gx >= GW || gz >= GH) continue;
        const ex = X0 + (gx + 0.5) * 0.5 - ro.x, ez = Z0 + (gz + 0.5) * 0.5 - ro.z; if (ex * ex + ez * ez < 5.8) occ[gz * GW + gx] = 1;
      }
      if (i % 400 === 399) await ctx.yield();
    }
    const offRail = (x, z) => {
      const gx = Math.floor((x - X0) * 2), gz = Math.floor((z - Z0) * 2);
      return gx < 0 || gz < 0 || gx >= GW || gz >= GH ? 1 : 1 - occ[gz * GW + gx];
    };
    await ctx.yield();
    // ---- the grass: the world's own fine blades (the kit's leaf cards read as lettuce on a chalk down). A tuft is four
    // pale-tipped blades fanned from one root; each is one triangle that always turns its width to the eye, is never
    // under a pixel and a half wide, and is coloured and lit by the same functions as the ground under it, so cloud shade,
    // cast shadows and the silver gusts run through blades and turf as one sward. Tufts stand fifteen to the square metre
    // within 13 m of the line (no ground shows between them from the lens), thin to a third by 24 m, and each sinks into
    // the turf at its own distance between 20 and 46 m, so the sward has no edge.
    const NBL = 4, tuftPos = new Float32Array(NBL * 9), tuftTip = new Float32Array(NBL * 9), tuftK = new Float32Array(NBL * 6);
    {
      const gr = rng.fork('tuft');
      for (let b = 0; b < NBL; b++) {
        const az = (b / NBL) * 6.283 + gr.range(-0.4, 0.4), r0 = gr.range(0.02, 0.09), lean = gr.range(0.10, 0.42), hgt = b === 0 ? 1 : gr.range(0.6, 0.95);
        for (let v = 0; v < 3; v++) {
          const o = (b * 3 + v) * 3;
          tuftPos[o] = Math.cos(az) * r0; tuftPos[o + 1] = 0; tuftPos[o + 2] = Math.sin(az) * r0;
          tuftTip[o] = Math.cos(az) * lean; tuftTip[o + 1] = hgt; tuftTip[o + 2] = Math.sin(az) * lean;
          tuftK[(b * 3 + v) * 2] = v === 2 ? 1 : 0; tuftK[(b * 3 + v) * 2 + 1] = v === 0 ? -1 : v === 1 ? 1 : 0;
        }
      }
    }
    const grassMat = new THREE.ShaderMaterial({
      uniforms: { ...sward },
      vertexShader: /* glsl */`
        ${SWARD_GLSL}
        attribute vec3 aTip; attribute vec2 aK; attribute vec3 aPos; attribute vec4 aRnd; attribute vec4 aGnd;
        varying vec3 vCol; varying float vDist;
        void main() {
          float yaw = aRnd.x * 6.283, cy = cos(yaw), sy = sin(yaw), t = aK.x;
          vec3 toCam = cameraPosition - aPos; float dist = length(toCam);
          vec2 p = aPos.xz;
          float hollow = aGnd.z;
          float lush; vec3 base = swardBase(p, hollow, lush);
          // long in the lush drifts and hollows, cropped short on the dry crests; one tuft in seven is a tussock
          float sc = (0.50 + 0.75 * aRnd.y * aRnd.y) * (0.80 + 0.5 * lush) * (aRnd.z > 0.86 ? 1.5 : 1.0);
          float f0 = mix(20.0, 34.0, aRnd.w);
          float sink = 1.0 - smoothstep(f0, f0 + 12.0, dist);
          vec3 b = vec3(position.x * cy - position.z * sy, 0.0, position.x * sy + position.z * cy) * sc;
          vec3 tp = vec3(aTip.x * cy - aTip.z * sy, aTip.y * sink, aTip.x * sy + aTip.z * cy) * sc * 0.36;
          float wave = windBand(p);
          float sway = sin(uTime * 2.1 + aRnd.w * 6.283 + p.x * 0.31) * 0.035 + sin(uTime * 3.3 + aRnd.w * 17.0) * 0.015;
          tp.xz += vec2(0.15, -0.8) * (sway + 0.13 * wave) * uWind * sc;         // the gusts lay the tips over, uphill
          vec3 root = aPos + b;
          vec3 wp = root + tp * t;
          vec2 sd = vec2(toCam.z, -toCam.x) / max(length(toCam.xz), 1e-3);
          wp.xz += sd * aK.y * max(0.031 * sc, 0.0017 * dist) * (1.0 - t);
          // colour: the ground's own, dark at the root, pale at the tip (their mean over a blade is the ground's mean, so
          // the sward does not change tone where the blades sink away); the light is the ground's light at the root
          vec3 n = normalize(vec3(aGnd.x * 2.0, 1.0, aGnd.y * 2.0));
          float sun; vec3 sheen; vec3 lit = swardLight(n, vec3(0.0), aPos, hollow, sun, sheen);
          float tone = 0.90 + 0.22 * aRnd.y;
          vec3 tipC = mix(base, mix(uTip, uStraw, 0.10 + 0.25 * aRnd.z), 0.50) * (1.24 + 0.30 * wave) * tone;
          vec3 rootC = base * mix(0.95, 0.66, sink) * tone;
          // A blade that has all but sunk away is a sliver under a pixel tall: with antialiasing its colour is read off the
          // sliver's edge and a root-to-tip gradient runs away to black or white specks. So the gradient sinks with the blade.
          float te = t * smoothstep(0.0, 0.6, sink);
          vCol = mix(rootC, tipC, te) * (lit + uSunCol * sun * 0.14 * te) + sheen * (0.55 + 0.35 * te) + uSilver * wave * 0.16 * te;   // tips take a little light through them
          vec4 mv = viewMatrix * vec4(wp, 1.0); vDist = length(mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        ${FOG_PARS}
        varying vec3 vCol; varying float vDist;
        void main() { gl_FragColor = vec4(withFog(clamp(vCol, vec3(0.0), vec3(3.0)), vDist), 1.0); }`,
      side: THREE.DoubleSide,
    });
    // tufts are sown in 16 m squares of ground (not along the line, which would sow the diamond twice); a square is drawn
    // only while it is in front of the lens and within reach of the sinking distance
    const CELL = 16, RAD = 24, DENS = 15 * detail * Math.min(1.15, vary.density || 1), grassCells = [], gRng = rng.fork('grass');
    const latAt = (x, z) => {
      const fx = Math.max(0, Math.min(NX - 1e-3, (x - X0) / dxs)), fz = Math.max(0, Math.min(NZ - 1e-3, (z - Z0) / dzs));
      const i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j, k = j * (NX + 1) + i;
      return (trail[k] * (1 - a) + trail[k + 1] * a) * (1 - b) + (trail[k + NX + 1] * (1 - a) + trail[k + NX + 2] * a) * b;
    };
    {
      const PER = Math.round(DENS * CELL * CELL), tp = new Float32Array(PER * 3), tr = new Uint8Array(PER * 4), tg = new Int8Array(PER * 4);
      const q8 = (v) => Math.max(-127, Math.min(127, Math.round(v * 127)));
      let work = 0;
      for (let cz0 = Z0; cz0 < 322; cz0 += CELL) for (let cx0 = X0; cx0 < X1; cx0 += CELL) {
        const lc = latAt(cx0 + CELL / 2, cz0 + CELL / 2);
        if (lc > RAD + CELL * 0.75) continue;
        // wholly inside the dense band: no need to ask each tuft how far it is from the line
        const inner = lc < 13 && latAt(cx0, cz0) < 13 && latAt(cx0 + CELL, cz0) < 13 && latAt(cx0, cz0 + CELL) < 13 && latAt(cx0 + CELL, cz0 + CELL) < 13;
        let n = 0, sy = 0;
        for (let k = 0; k < PER; k++) {
          if (++work % 700 === 0) await ctx.yield();
          const x = cx0 + gRng() * CELL, z = cz0 + gRng() * CELL, r1 = gRng(), r2 = gRng(), r3 = gRng(), r4 = gRng();
          const lat = inner ? 0 : latAt(x, z), keep = lat < 13 ? 1 : lat > RAD ? 0 : 1 - 0.7 * (lat - 13) / (RAD - 13);
          if (r1 > keep || z > 322 || !offRail(x, z)) continue;
          const y = gridH(x, z), fx = Math.max(0, Math.min(NX - 1, Math.floor((x - X0) / dxs))), fz = Math.max(0, Math.min(NZ - 1, Math.floor((z - Z0) / dzs))), kk = fz * (NX + 1) + fx;
          tp[n * 3] = x; tp[n * 3 + 1] = y - 0.02; tp[n * 3 + 2] = z; sy += y;
          tr[n * 4] = (r1 * 9973 % 1) * 255; tr[n * 4 + 1] = r2 * 255; tr[n * 4 + 2] = r3 * 255; tr[n * 4 + 3] = r4 * 255;
          const ny = Math.max(tnor[kk * 3 + 1], 0.2);
          tg[n * 4] = q8(tnor[kk * 3] / ny / 2); tg[n * 4 + 1] = q8(tnor[kk * 3 + 2] / ny / 2); tg[n * 4 + 2] = q8(thol[kk]); tg[n * 4 + 3] = 0;
          n++;
        }
        if (n < 8) continue;
        await ctx.yield();
        const g = new THREE.InstancedBufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(tuftPos, 3)); g.setAttribute('aTip', new THREE.BufferAttribute(tuftTip, 3)); g.setAttribute('aK', new THREE.BufferAttribute(tuftK, 2));
        g.setAttribute('aPos', new THREE.InstancedBufferAttribute(tp.slice(0, n * 3), 3)); g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(tr.slice(0, n * 4), 4, true)); g.setAttribute('aGnd', new THREE.InstancedBufferAttribute(tg.slice(0, n * 4), 4, true));
        g.instanceCount = n;
        const mesh = new THREE.Mesh(g, grassMat); mesh.frustumCulled = false; scene.add(mesh);
        grassCells.push({ mesh, s: new THREE.Sphere(new THREE.Vector3(cx0 + CELL / 2, sy / n, cz0 + CELL / 2), CELL * 0.75 + 2) });
        await ctx.yield();
      }
    }
    const GRASS_REACH = 46 + CELL * 0.75, frustum = new THREE.Frustum(), pv = new THREE.Matrix4();
    await ctx.yield();

    // the sea: one plane, a slow glitter band toward the sun
    const seaMat = new THREE.ShaderMaterial({
      uniforms: { ...light, ...fog, uTime, uNoise: { value: noiseTex }, uSea: { value: new THREE.Color(pal.sea) }, uSkyRef: { value: new THREE.Color(evening ? '#7FA2C8' : '#7FB2DC').multiplyScalar(0.8) } },
      vertexShader: /* glsl */`varying vec3 vW;
        void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        ${FOG_PARS}
        ${LIGHT_PARS}
        ${CLOUD_GLSL}
        uniform sampler2D uNoise; uniform vec3 uSea; uniform vec3 uSkyRef; uniform float uTime;
        varying vec3 vW;
        void main() {
          if (abs(vW.x) < 364.0 && vW.z < 324.0) discard;                                   // no water under the hill
          vec3 v = cameraPosition - vW; float vDist = length(v); v = v / max(vDist, 1e-3);   // the plane is two huge triangles: distance per fragment
          vec2 p = vW.xz;
          float a = texture2D(uNoise, p * 0.021 + vec2(uTime * 0.011, uTime * 0.006)).r, b = texture2D(uNoise, p * 0.033 - vec2(uTime * 0.008, -uTime * 0.012)).g;
          float swell = texture2D(uNoise, p * vec2(0.0011, 0.0034) + vec2(0.0, uTime * 0.004)).b;
          float lines = smoothstep(0.55, 0.9, texture2D(uNoise, p * vec2(0.0007, 0.0105) + vec2(0.0, -uTime * 0.0035)).r) * (1.0 - smoothstep(200.0, 1200.0, vDist));
          vec3 nw = normalize(vec3((a - 0.5) * 0.10 + (swell - 0.5) * 0.05, 1.0, (b - 0.5) * 0.10));
          vec3 r = reflect(-v, nw);
          float lobe = max(dot(r, uSunDir), 0.0); float l2 = lobe * lobe; float l4 = l2 * l2; float l16 = l4 * l4; l16 = l16 * l16;
          float sparkle = smoothstep(0.42, 0.72, a * b * 2.0);
          float fres = 1.0 - max(v.y, 0.0); fres = fres * fres; fres = fres * fres;
          vec3 c = mix(uSea * (0.52 + 0.16 * swell + 0.12 * lines), uSkyRef, 0.06 + 0.36 * fres);          // a band of deep blue, paler only at the very horizon
          // shallows: over the chalk shelf under the land the water is a pale green-blue, scalloped by the swell, with slow
          // threads of foam near the foot of the cliff; deep blue beyond. (Kept darker than any plume standing before it.)
          float shoreD = max(vW.z - 326.0, abs(vW.x) - 366.0);
          float shelf = 1.0 - smoothstep(18.0, 210.0, shoreD + (swell - 0.5) * 110.0 + (a - 0.5) * 24.0);
          c = mix(c, vec3(0.085, 0.40, 0.43) * (0.82 + 0.36 * b), shelf * 0.66);
          float foam = smoothstep(0.60, 0.80, texture2D(uNoise, vec2(p.x * 0.0037 + shoreD * 0.0009, shoreD * 0.021 - uTime * 0.016)).r) * (1.0 - smoothstep(4.0, 46.0, shoreD));
          c = mix(c, vec3(0.62, 0.74, 0.74), foam * 0.42);
          float l64 = l16 * l16; l64 = l64 * l64;
          c += uSunCol * (0.03 * l16 + 0.22 * l64 + 1.6 * l64 * sparkle + 0.35 * l16 * sparkle * sparkle);  // the slow glitter band under the sun
          c *= 1.0 - 0.30 * cloudShade(p * 0.6 + 300.0, uTime * 0.5);                                   // cloud shadows lie on the water too
          gl_FragColor = vec4(withFog(c, vDist * 0.12), 1.0);
        }`,
    });
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(7000, 7000).rotateX(-Math.PI / 2), seaMat); sea.position.set(0, 0, 300); sea.frustumCulled = false; scene.add(sea);
    await ctx.yield();

    // sky: a dome from zenith blue to haze at the sea line, no sun disc. Below the horizon it is painted turf, so the
    // part of the previous portal's opening that looks under our ground shows hill and not a blank.
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { uZenith: { value: new THREE.Color(pal.zenith) }, uHaze: { value: fogColor }, uUnder: { value: new THREE.Color(pal.turf).multiplyScalar(0.40) },
        uMid: { value: new THREE.Color(evening ? '#6A9CD8' : '#64A5E6') }, uCirrus: { value: new THREE.Color(evening ? '#FFE7C4' : '#FFFFFF') },
        uSunDir: light.uSunDir, uSunCol: light.uSunCol, uNoise: { value: noiseTex }, uTime, uWarm: { value: evening ? 1 : 0 } },
      vertexShader: /* glsl */`varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uZenith; uniform vec3 uHaze; uniform vec3 uUnder; uniform vec3 uMid; uniform vec3 uCirrus; uniform vec3 uSunDir; uniform vec3 uSunCol;
        uniform sampler2D uNoise; uniform float uTime; uniform float uWarm; varying vec3 vDir;
        void main() {
          vec3 d = vDir / max(length(vDir), 1e-3);
          float h = clamp(d.y, 0.0, 1.0);
          float k = 1.0 - h; float k2 = k * k;
          vec3 c = mix(uZenith, uMid, k2 * k * (0.75 + 0.25 * k));  // deep overhead and still blue at fifteen degrees; milky only toward the sea line
          float k8 = k2 * k2; k8 = k8 * k8;
          float k16 = k8 * k8; c = mix(c, uHaze, k16 * k16 * 0.36 + k16 * 0.10);
          c = mix(c, vec3(1.0, 0.75, 0.47) * 0.92, uWarm * (k16 * 0.62 + k8 * 0.16));   // the evening: the low sky is gold, the blue only overhead                        // blue down to six degrees; the haze is the last few
          float s = max(dot(d, uSunDir), 0.0); float s2 = s * s; float s8 = s2 * s2; s8 = s8 * s8;
          c += uSunCol * (0.035 * s2 + 0.10 * s8 * s8);             // the warmth round an unseen sun: no disc
          // mares' tails, very high and very slow: the upper sky is never one flat tone, and nothing here competes with a plume
          vec2 q = d.xz / (h + 0.22);
          float c1 = texture2D(uNoise, q * vec2(0.035, 0.105) + vec2(uTime * 0.0006, 0.31)).r;
          float c2 = texture2D(uNoise, q * vec2(0.011, 0.047) + vec2(0.4, uTime * 0.0004)).g;
          float c3 = texture2D(uNoise, q * vec2(0.12, 0.31) + 0.7).b;
          float cir = smoothstep(0.52, 0.86, c1 * 0.55 + c2 * 0.65 + c3 * 0.12 - 0.08) * smoothstep(0.10, 0.42, h) * (1.0 - 0.6 * smoothstep(0.75, 1.0, h));
          c = mix(c, uCirrus * (0.86 + 0.14 * s2), cir * 0.17);
          // a low bank of cumulus standing along the sea horizon (the seaward half of the sky only): the far layer of every downhill view
          vec2 hq = d.xz / max(length(d.xz), 1e-3);
          float az = hq.x * 1.6;                                    // roughly the bearing, across the seaward half
          float hump = (0.5 + 0.5 * sin(az * 3.1 + 0.7)) * (0.55 + 0.45 * sin(az * 7.3 + 2.0));
          float top = 0.010 + 0.030 * hump + (0.012 * abs(sin(az * 19.0 + 1.3)) + 0.006 * abs(sin(az * 47.0 + 0.4)) + 0.003 * abs(sin(az * 113.0))) * (0.4 + 0.6 * hump);   // heaped, round-topped
          float bank = (1.0 - smoothstep(top - 0.006, top + 0.001, d.y)) * smoothstep(-0.003, 0.012, d.y) * smoothstep(-0.2, 0.3, hq.y);
          vec3 bb = mix(uHaze, uMid, 0.7) * 0.94; vec3 bc = mix(bb, uCirrus, clamp(d.y / max(top, 1e-3), 0.0, 1.0) * 0.6);   // blue-grey under, lit above: dimmer than any plume, darker than chalk
          c = mix(c, bc, bank * 0.75);
          c = mix(c, uUnder, 1.0 - smoothstep(-0.09, -0.035, d.y));
          gl_FragColor = vec4(c, 1.0);
        }`,
      side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), skyMat); sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);

    // flat-bottomed cumulus over the sea, drifting at 3 m/s: each a heap of lit puffs on one level base
    const NCL = Math.round(17 - 12 * (1 - detail)), PER = 26, NFAR = 8, cr = rng.fork('clouds');
    const cps = new Float32Array(NCL * PER * 4), ctone = new Float32Array(NCL * PER * 3);
    for (let c = 0; c < NCL; c++) {
      // Five stand far out over the sea and do not wander (at 2.5 km a 3 m/s drift cannot be seen in one visit): two of them
      // stands 20 degrees to one side of the direction the lens faces at the second crossing (the side away from the doves and our
      // own balloon) and the next 62 to the other, so the earlier
      // self's plume, both balloons and the doves have clear blue behind them (and so has the third car's plume, seen from the hairpin).
      // The rest ring the down and drift; the ones behind the brow ride high, so a far tram's plume on the skyline has blue behind it.
      let cx, cz, cy, sc;
      if (c < NFAR) {   // the last three stand over the bay the exit leg runs down to
        const ph = [20, -62, -96, 60, -130, -40, -80, -114][c] * mirror * Math.PI / 180 + cr.range(-0.03, 0.03), gx = -0.42 * mirror, gz = 0.91, cd = cr.range(2400, 2520);
        cx = (gx * Math.cos(ph) - gz * Math.sin(ph)) * cd; cz = (gx * Math.sin(ph) + gz * Math.cos(ph)) * cd; cy = cr.range(270, 310); sc = cr.range(1.35, 1.6);
      } else {
        const NR = Math.max(NCL - NFAR, 1), ca = Math.PI * (1.05 + 0.90 * (c - NFAR + cr.range(0.2, 0.8)) / NR), cd = cr.range(900, 1700);   // the landward half only: the seaward sky belongs to the five
        cx = Math.cos(ca) * cd; cz = Math.sin(ca) * cd * (Math.sin(ca) < 0 ? 0.8 : 1); cy = cr.range(250, 400); sc = cr.range(0.8, 1.5);
        if (cz < 250) cy = Math.max(cy, 40 + 0.50 * Math.hypot(cx, cz - 173));
      }
      for (let k = 0; k < PER; k++) {
        const o = (c * PER + k) * 4, a = cr.range(-1, 1), up = cr() * (1 - a * a), j1 = cr.range(-20, 20), j2 = cr.range(-50, 50);
        const big = k < 16 ? 1 : 0.55;                              // sixteen that make the mass, ten small ones that break its outline
        const lift = k < 16 ? up : Math.min(1, up * 1.25 + 0.15);
        cps[o] = cx + a * 150 * sc + j1; cps[o + 1] = cy + lift * 78 * sc; cps[o + 2] = cz + j2 * sc;
        cps[o + 3] = (58 + 46 * (1 - Math.abs(a))) * sc * (1 - 0.35 * up) * big;
        const t = (c * PER + k) * 3; ctone[t] = 0.80 + 0.20 * lift; ctone[t + 1] = (cy - cps[o + 1]) / Math.max(cps[o + 3], 1); ctone[t + 2] = (k * 0.37 + c * 0.11) % 1;
      }
    }
    await ctx.yield();
    const cgeo = new THREE.InstancedBufferGeometry(); { const qd = new THREE.PlaneGeometry(2, 2); cgeo.index = qd.index; cgeo.setAttribute('position', qd.attributes.position); }
    cgeo.setAttribute('aPS', new THREE.InstancedBufferAttribute(cps, 4)); cgeo.setAttribute('aTone', new THREE.InstancedBufferAttribute(ctone, 3)); cgeo.instanceCount = NCL * PER;
    const sunView = new THREE.Vector3();
    const cloudMat = new THREE.ShaderMaterial({
      uniforms: { ...fog, uTime, uNoise: { value: noiseTex }, uSunView: { value: sunView },
        uLit: { value: new THREE.Color(evening ? '#FFF0DC' : '#FFFFFF').multiplyScalar(0.95) }, uBase: { value: new THREE.Color(evening ? '#A9B4CC' : '#A3BCD6').multiplyScalar(0.85) },
        uRim: { value: new THREE.Color(evening ? '#FFC98A' : '#FFF6E2') } },
      vertexShader: /* glsl */`
        attribute vec4 aPS; attribute vec3 aTone; uniform float uTime;
        varying vec2 vUv; varying vec3 vTone; varying float vDist;
        void main() {
          vUv = position.xy; vTone = aTone;
          vec3 c = aPS.xyz; if (dot(c.xz, c.xz) < 2050.0 * 2050.0) c.x = mod(c.x + 3.0 * uTime + 1800.0, 3600.0) - 1800.0;   // the far heaps over the sea stand still
          vec4 mv = viewMatrix * vec4(c, 1.0);
          mv.xy += position.xy * aPS.w;
          vDist = length(mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        ${FOG_PARS}
        uniform vec3 uLit; uniform vec3 uBase; uniform vec3 uRim; uniform vec3 uSunView; uniform sampler2D uNoise; uniform float uTime;
        varying vec2 vUv; varying vec3 vTone; varying float vDist;
        void main() {
          float r2 = dot(vUv, vUv); if (r2 > 1.0) discard;
          float z = sqrt(max(1.0 - r2, 0.0));
          vec2 nq = vUv * 0.21 + vTone.z * 7.0 + vec2(uTime * 0.002, 0.0);
          float er = texture2D(uNoise, nq).r * 0.6 + texture2D(uNoise, nq * 2.7 + 0.3).g * 0.4;      // a curdled edge, not a disc
          float a = smoothstep(0.0, 0.42, z * z + (er - 0.5) * 0.5) * smoothstep(vTone.y - 0.10, vTone.y + 0.16, vUv.y);   // the flat bottom, at the heap's base
          vec3 n = vec3(vUv, z);
          float key = clamp(dot(n, uSunView) * 0.32 + 0.5, 0.0, 1.0);
          float up = clamp(0.5 + 0.5 * vUv.y, 0.0, 1.0);
          vec3 c = mix(uBase, uLit, clamp(key * 0.55 + up * 0.45 + vTone.x - 0.72 + (er - 0.5) * 0.3, 0.0, 1.0)) * vTone.x;
          c += uRim * 0.10 * key * key * (1.0 - z);
          gl_FragColor = vec4(withFog(c, vDist * 0.20), a * 0.94);
        }`,
      transparent: true, depthWrite: false,
    });
    const clouds = new THREE.Mesh(cgeo, cloudMat); clouds.frustumCulled = false; clouds.renderOrder = -5; scene.add(clouds);
    await ctx.yield();

    // the thorn on the knoll: one wind-bent hawthorn leaning seaward, the landmark that says the top loop is one place
    const thorn = new THREE.Group();
    {
      const lean = onshore ? -1 : 1, tr = rng.fork('thorn');
      const pos = [], col = [], nor = [], cA = new THREE.Color(), v = new THREE.Vector3(), nn = new THREE.Vector3();
      const add = (geo, m4, c0, c1, lumpy) => {            // append a piece with a bottom-to-top colour ramp and lumpy vertices
        const g = geo.index ? geo.toNonIndexed() : geo; g.applyMatrix4(m4); g.computeVertexNormals();
        const P = g.attributes.position, N = g.attributes.normal;
        for (let i = 0; i < P.count; i++) {
          v.fromBufferAttribute(P, i); nn.fromBufferAttribute(N, i);
          if (lumpy) { const d = ctx.noise.fbm2(v.x * 1.7 + v.y * 0.9, v.z * 1.7 - v.y * 0.6, 2) * lumpy; v.x += nn.x * d; v.y += nn.y * d * 0.5; v.z += nn.z * d; }
          const t = Math.max(0, Math.min(1, 0.5 + 0.5 * nn.y + (lumpy ? ctx.noise.fbm2(v.x * 3.1, v.z * 3.1 + v.y, 2) * 0.35 : 0)));
          cA.set(c0).lerp(_c2.set(c1), t);
          // the may is out: drifts of cream blossom along the sunlit top of the crown
          if (lumpy >= 0.5 && nn.y > -0.3 && ctx.noise.fbm2(v.x * 4.3 + 7.0, v.z * 4.3 - v.y * 2.0, 2) > -0.08) cA.lerp(_c2.set('#fbf8ec'), 0.9);
          pos.push(v.x, v.y, v.z); nor.push(nn.x, nn.y, nn.z); col.push(cA.r, cA.g, cA.b);
        }
        g.dispose();
      };
      const _c2 = new THREE.Color(), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
      const place = (x, y, z, rx, ry, rz, sx, sy, sz) => M.compose(new THREE.Vector3(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
      // a twisted trunk, bent by fifty years of one wind, and three boughs reaching the same way
      const trunk = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0.1, 0.9, 0.1 * lean), new THREE.Vector3(-0.08, 1.8, 0.5 * lean), new THREE.Vector3(0.05, 2.5, 1.3 * lean), new THREE.Vector3(0, 3.0, 2.3 * lean)]);
      add(new THREE.TubeGeometry(trunk, 14, 0.2, 7), place(0, 0, 0, 0, 0, 0, 1, 1, 1), '#2e2a22', '#6a5c48', 0.06);
      add(new THREE.CylinderGeometry(0.2, 0.38, 0.6, 7), place(0, 0.0, 0, 0, 0, 0, 1, 1, 1), '#2e2a22', '#5a4e3c', 0.08);
      for (const [y0, dx, len] of [[1.7, 0.7, 2.3], [2.2, -0.8, 2.0], [2.6, 0.25, 2.6]]) {
        const br = new THREE.CatmullRomCurve3([new THREE.Vector3(0, y0, 0.5 * lean), new THREE.Vector3(dx * 0.6, y0 + 0.7, (0.5 + len * 0.45) * lean), new THREE.Vector3(dx, y0 + 0.95, (0.5 + len) * lean)]);
        add(new THREE.TubeGeometry(br, 8, 0.085, 5), place(0, 0, 0, 0, 0, 0, 1, 1, 1), '#2e2a22', '#6a5c48', 0.03);
      }
      await ctx.yield();
      // the crown: a wedge of clipped leaf streaming seaward, dark under, sunlit over
      const NB = 15;
      for (let i = 0; i < NB; i++) {
        const t = i / (NB - 1), r = (1.25 - 0.55 * t) * tr.range(0.8, 1.1);
        add(new THREE.IcosahedronGeometry(r, 2), place(tr.range(-0.9, 0.9) * (1 - 0.5 * t), 3.25 + tr.range(-0.25, 0.4) + 0.35 * Math.sin(t * 3.1), (0.6 + 3.9 * t + tr.range(-0.3, 0.3)) * lean, 0, tr.range(0, 3), 0, 1.15, 0.6, 1.35),
          evening ? '#2a4a22' : '#1f4f2a', evening ? '#7f9a3a' : '#5f9a3e', 0.5);
        if (i % 3 === 2) await ctx.yield();
      }
      const tg = new THREE.BufferGeometry();
      tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); tg.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nor), 3)); tg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
      thorn.add(new THREE.Mesh(tg, new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color(evening ? '#1c2410' : '#12260f') })));   // its shade is green, never black
      thorn.position.set(KN.x, heightAt(KN.x, KN.z) - 0.1, KN.z); thorn.scale.setScalar(1.45);   // the landmark of the top loop, drawn larger than life like the cars
    }
    scene.add(thorn);
    cast.uStill.value[1].set(thorn.position.x, thorn.position.z + (onshore ? -4.0 : 4.0), 5.0, 9.1);
    await ctx.yield();

    await ctx.yield();
    // the avenue to the ring: white posts in the gate arm's own livery, 7 m either side of the last straight, growing toward the ring
    {
      const pg = [], addBox = (w, h, d, hex, y) => { const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); g.translate(0, y, 0); const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); pg.push(g); };
      addBox(0.26, 1.0, 0.26, pal.white, 0.5); addBox(0.27, 0.18, 0.27, '#1b1b1b', 0.72); addBox(0.34, 0.06, 0.34, '#6C7A84', 1.03);
      let n = 0; for (const g of pg) n += g.attributes.position.count;
      const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3); let o = 0;
      for (const g of pg) { P.set(g.attributes.position.array, o); N.set(g.attributes.normal.array, o); C.set(g.attributes.color.array, o); o += g.attributes.position.count * 3; g.dispose(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3));
      const NP = 9, posts = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color(pal.white).multiplyScalar(0.12) }), NP * 2);
      const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(ringD.x, ringD.z)), a = { x: 0, z: 0 };
      for (let i = 0; i < NP; i++) for (let sd = 0; sd < 2; sd++) {
        const sm = 840 - 3 - i * 6.5, sg = sd ? 1 : -1, hgt = 1.9 - 0.11 * i; planAt(sm, mirror, a);
        const x = a.x - ringD.z * 7 * sg, z = a.z + ringD.x * 7 * sg;
        m4.compose(new THREE.Vector3(x, heightAt(x, z) - 0.05, z), qq, new THREE.Vector3(1, hgt, 1)); posts.setMatrixAt(i * 2 + sd, m4);
      }
      posts.frustumCulled = false; scene.add(posts);
    }
    await ctx.yield();

    // ---- the device: one car drawn five times, the event E(e), our own carried balloon
    const hero = await buildHero(ctx, { path, mirror, pal, light, fog, heightAt, wind: onshore ? -1 : 1, rare, detail, time: uTime, cast, chalkGain: evening ? 2.1 : 1.45, carGlow: evening ? 0.42 : 0.3, hutGlow: evening ? 0.32 : 0.17 });
    scene.add(hero.object);
    await ctx.yield();
    // ---- the dressing of the down: poles and wires, flowers, may and gorse, sheep, the far headlands, stacks, lighthouse, sails
    const darken = (x, z, r) => {                       // the turf under a bush lies in its shade (the sward reads aHollow)
      const i0 = Math.round((x - X0) / dxs), j0 = Math.round((z - Z0) / dzs), ri = Math.max(1, Math.round(r / dxs)), rj = Math.max(1, Math.round(r / dzs));
      for (let j = j0 - rj; j <= j0 + rj; j++) for (let i = i0 - ri; i <= i0 + ri; i++) if (i >= 0 && j >= 0 && i <= NX && j <= NZ) thol[j * (NX + 1) + i] = Math.max(thol[j * (NX + 1) + i], 0.85);
    };
    const dress = await buildDressing(ctx, { mirror, pal, light, fog, time: uTime, groundAt: gridH, latAt, castDir: cast.uCast.value, detail, evening, wind: onshore ? -1 : 1, darken });
    tgeo.attributes.aHollow.needsUpdate = true;
    scene.add(dress.object);
    await ctx.yield();
    // ---- the country round the line: the harbour village and its mill, the mole and its luggers, field walls, trees, gulls, petals
    const country = await buildCountry(ctx, { mirror, pal, light, fog, time: uTime, groundAt: gridH, latAt, castDir: cast.uCast.value, detail, evening, wind: onshore ? -1 : 1, darken, thorn: thorn.position });
    tgeo.attributes.aHollow.needsUpdate = true;
    scene.add(country.object);
    await ctx.yield();

    const thornTop = thorn.position.clone().add(new THREE.Vector3(0, 3.5, 0));
    // The top loop: the gaze goes to the knoll, a little above our own height, so the whole thorn stands on its knoll left of
    // our balloon (which rides in the right of the frame) on either hand: the two hands aim at different points for that.
    const thornAim = thornTop.clone();
    const figure = new THREE.Vector3(8 * mirror, 34, 70);          // the middle of the whole white figure, seen from the top loop
    const poiA = new THREE.Vector3(), poiB = new THREE.Vector3(), poiC = new THREE.Vector3(), hutAim = hero.state.hut.clone();
    const pois = [
      // the stranger, coming down the second leg; as it nears the diamond the gaze eases toward the hut side, so the hut stands
      // whole in the frame and the dove fan opens in clear sky beside the plume (the same on either hand: away from nothing we carry)
      { at: (time, u) => { hero.carAt(GAP, Math.min(u, 0.1905), poiA); const t = Math.max(0, Math.min(1, (u - 0.14) / 0.04)); return poiA.lerp(hutAim, 0.7 * t * t * (3 - 2 * t)); }, from: 0.05, to: 0.215, weight: 0.5, fade: 0.3 },
      { at: (time, u) => { path.pointAt(Math.min(Math.max(u, 0), 1), thornAim); thornAim.set(mirror > 0 ? thorn.position.x - 4 : 16.6, thornAim.y + 8, thorn.position.z + (mirror > 0 ? 0 : 17.6)); return thornAim; }, from: 0.235, to: 0.375, weight: 0.8, fade: 0.3 },
      { at: figure, from: 0.355, to: 0.535, weight: 0.75, fade: 0.25 },   // over the knoll and its thorn to the sea, then the wide shot: the plan from above
      { at: (time, u) => hero.carAt(-GAP, u, poiB), from: 0.50, to: 0.66, weight: 0.8, fade: 0.2 },             // our earlier self, climbing the entry leg
      // the hairpin sweeps the gaze along the foot of the hill to the hoop; the third car rolls out of it at u 0.79 and the gaze
      // goes with it: up the run-in, behind the ring, and on up the hill beside the ring
      { at: (time, u) => { hero.carAt(-2 * GAP, u, poiC); poiC.y += 9; return poiC; }, from: 0.70, to: 0.955, weight: 0.8, fade: 0.25 },
    ];
    const camPos = new THREE.Vector3(), m3 = new THREE.Matrix3();
    return {
      scene, path, duration: 44, pace: () => 1, title: 'The Same Minute',
      camera: { fov: 42, near: 0.3, far: 4000, lookAhead: 22, sway: 0.4, bank: 0.3 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#FFF6E0', glow: 1 },
      post: { exposure: 1, bloom: { strength: 0.25, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 1.06, contrast: 1.03, vignette: 0.2, grain: 0.02 } },
      ride: 'none', companion: 'none', style: 'none',
      carried: hero.carried,
      update(dt, time, camera, u) {
        uTime.value = time;
        camera.getWorldPosition(camPos); sky.position.copy(camPos);
        thorn.rotation.x = Math.sin(time * 1.3) * 0.012; thorn.rotation.z = Math.sin(time * 0.9 + 1) * 0.01;
        pv.copy(camera.matrixWorld).invert().premultiply(camera.projectionMatrix); frustum.setFromProjectionMatrix(pv);
        for (const ch of grassCells) ch.mesh.visible = ch.s.center.distanceTo(camPos) < GRASS_REACH && frustum.intersectsSphere(ch.s);
        hero.update(dt, time, camera, u);
        dress.update(time, camera);
        country.update(time, camera);
        sunView.copy(sunDir).applyMatrix3(m3.setFromMatrix4(camera.matrixWorld).transpose()).normalize();
      },
      dispose() { hero.dispose(); dress.dispose(); country.dispose(); },
    };
  },
};
