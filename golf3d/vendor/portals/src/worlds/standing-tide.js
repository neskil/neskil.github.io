// THE STANDING TIDE: a small moon passes so low over a turquoise sea that the water stands up under it
// in a clear hill 300 m high; a fishing fleet under orange sails climbs the slope toward the gap.
//
// WORLD SPACE = the hero's local space at arrival: the camera flies toward -Z, port (and the sun) is -X,
// sea level y 0, the portal hangs at (0, 320, 0). The hill and moon (the hero, src/parts/standing-tide.js)
// travel toward us along +Z from z = -528 to z = 0 as the flight goes from u 0 to 1. Everything the
// world adds (reef flat, village, lighthouse, stranded boats, birds) is anchored in world space and asks
// the hero's shared GLSL whether it is under the standing water (uHeroZ = the hill's current z).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeCloudField } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildHero, tideHeight, TIDE_GLSL, vertexNormalsInSlices } from '../parts/standing-tide.js';

const CZ0 = -528, Z0 = 1300, R0 = Z0 - CZ0;          // hill start z, camera start z, start distance to the axis
const BED = -2.6;

// ---- looks chosen by seed / requested hour -----------------------------------------------------------
// palette order: [moon stone, moon shade, turquoise, deep blue, sky aqua, white, sailcloth]
const HOURS = {
  day: { sunEl: 38, sunAz: -80, pal: ['#F1EBDD', '#9FB4CC', '#2FB7B0', '#0F5F9A', '#7FD0F2', '#FFFFFF', '#F28C3B'],
    sunC: [1.0, 0.95, 0.86], sky: { preset: 'day', zenith: '#4FB2EA', horizon: '#EDE8DC' }, fog: '#D6E6EF', fogK: 0.00031,
    post: { exposure: 0.96, bloom: { strength: 0.3, radius: 0.6, threshold: 0.93 }, grade: { saturation: 1.16, contrast: 1.13, tint: '#fffdf8', shadowTint: '#0a1830', vignette: 0.33, grain: 0.02 } } },
  golden: { sunEl: 12, sunAz: -76, pal: ['#F2DDB8', '#A7A2C2', '#4FBF9C', '#1C6A78', '#9CC4DA', '#FFF6E6', '#F28C3B'],
    sunC: [1.25, 0.86, 0.5], sky: { preset: 'goldenHour', zenith: '#7FB4D8', horizon: '#F6D9A6' }, fog: '#EBD6B4', fogK: 0.00034,
    post: { exposure: 1.0, bloom: { strength: 0.38, radius: 0.65, threshold: 0.92 }, grade: { saturation: 1.1, contrast: 1.06, tint: '#fff4e2', shadowTint: '#141a3a', vignette: 0.3, grain: 0.02 } } },
  dawn: { sunEl: 9, sunAz: -84, pal: ['#F4DCD6', '#A9A4CC', '#58BDB8', '#2A6C9E', '#A9C8E8', '#FFF4F2', '#F28C3B'],
    sunC: [1.15, 0.78, 0.7], sky: { preset: 'dawn', zenith: '#8FB6E2', horizon: '#F6CFC6' }, fog: '#EBCFD2', fogK: 0.00036,
    post: { exposure: 1.0, bloom: { strength: 0.36, radius: 0.65, threshold: 0.92 }, grade: { saturation: 1.06, contrast: 1.04, tint: '#fff2f0', shadowTint: '#181a40', vignette: 0.3, grain: 0.02 } } },
  night: { sunEl: 7, sunAz: -80, pal: ['#E9E6DC', '#5E7198', '#2A8E9C', '#0C3F78', '#3F6CA8', '#DCE6F4', '#E0803A'],
    sunC: [0.95, 0.9, 0.82], sky: { preset: 'blueHour', zenith: '#1E3C78', horizon: '#6E8FC0', bodies: [], stars: 0, milkyWay: 0 }, fog: '#5E7FB0', fogK: 0.00034,
    post: { exposure: 1.12, bloom: { strength: 0.42, radius: 0.7, threshold: 0.9 }, grade: { saturation: 1.08, contrast: 1.05, tint: '#eef2ff', shadowTint: '#0a1238', vignette: 0.32, grain: 0.025 } } },
};
const MOONS = {
  ivory: null,
  basalt: ['#A9A9A6', '#8C98AE'],
  rust: ['#DDA982', '#A49CB4'],
};

export default {
  id: 'standing-tide',
  name: 'The Standing Tide',
  category: 'alien',
  weirdness: 0.7,
  media: ['air', 'water', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    // looks: independent cycles of the seed, so two visits are related but rarely the same
    const sd = Math.abs(Math.floor(Number(ctx.seed) || 0));
    const hourKey = ({ day: 'day', golden: 'golden', dawn: 'dawn', night: 'night' })[vary.hour] || ['day', 'golden', 'dawn', 'day', 'golden'][sd % 5];
    const H = HOURS[hourKey];
    let weather = ['trade', 'squall', 'calm', 'calm', 'calm', 'trade', 'squall'][sd % 7];
    if (hourKey === 'dawn') weather = 'calm';                          // rose dawn is mirror calm
    const moonKey = ['ivory', 'basalt', 'rust'][sd % 3];
    const sailKey = ['orange', 'orange', 'saffron', 'orange', 'white', 'orange', 'orange', 'saffron', 'white', 'orange', 'saffron'][sd % 11];
    const sail = sailKey === 'saffron' ? '#F2B53B' : '#F28C3B';
    const flat = ['blacksand', 'seagrass', 'coral', 'coral'][sd % 4];
    const rare = !!vary.rare;
    const pal = H.pal.slice(); pal[6] = sail;
    if (MOONS[moonKey]) { pal[0] = '#' + new THREE.Color(MOONS[moonKey][0]).lerp(new THREE.Color(H.pal[0]), 0.15).getHexString(); }
    const L = { hourKey, weather, moonKey, flat, rare, detail, density, pal, H };

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(H.fog, H.fogK);
    const sky = makeSky({ rng, ...H.sky, sunElevation: H.sunEl, sunAzimuth: H.sunAz, clouds: false, clouds2: false, bake: hourKey === 'night', renderer: ctx.renderer });
    scene.add(sky.object);
    const sunDir = sky.sunDirection.clone().normalize();
    await ctx.yield();

    // ---- the hero: hill, moon, fleet, shoals, beads -------------------------------------------------
    const hero = await buildHero(ctx, { palette: pal, detail, bed: false, kelp: true, sun: sunDir, progress: 0,
      boats: Math.round(THREE.MathUtils.clamp(38 * density, 24, 48)) });
    hero.uniforms.SUNC.value.fromArray(H.sunC); hero.uniforms.uSailW.value = sailKey === 'white' ? 1 : 0; hero.uniforms.uWind.value = weather === 'trade' ? 1 : weather === 'squall' ? 0.35 : 0;
    scene.add(hero.object);
    await ctx.yield();

    // ---- the path: solved from the tide's height. s = 0..1 is the hill's travel, u is arc length -------
    const flyY = (r) => {
      if (r < 430) {
        const ay = tideHeight(430) + 5.5;
        return Math.max(ay + (320 - ay) * (430 - r) / 430, tideHeight(r) + 6.5);
      }
      const a = 4.5, b = tideHeight(r) + 5.5, k = 1.2;               // smooth max of "level over the flat" and "5.5 m over the water"
      return Math.log(Math.exp(a / k) + Math.exp(Math.min(b, 400) / k)) * k;
    };
    const NS = 56, pts = [], cum = [0];
    for (let i = 0; i <= NS; i++) {
      const s = i / NS; pts.push([0, i < 6 ? 4.5 : flyY(R0 * (1 - s)), Z0 * (1 - s)]);
      if (i) cum.push(cum[i - 1] + Math.hypot(pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    }
    const path = makePath(pts);
    await ctx.yield();
    const sOfU = (u) => {                                             // arc-length fraction -> hill travel
      const d = THREE.MathUtils.clamp(u, 0, 1) * cum[NS]; let i = 1;
      while (i < NS && cum[i] < d) i++;
      return (i - 1 + (d - cum[i - 1]) / Math.max(cum[i] - cum[i - 1], 1e-6)) / NS;
    };
    const uOfS = (s) => { const x = THREE.MathUtils.clamp(s, 0, 1) * NS, i = Math.min(NS - 1, Math.floor(x)); return (cum[i] + (cum[i + 1] - cum[i]) * (x - i)) / cum[NS]; };
    const uHeroZ = { value: CZ0 };
    const rcBoat = R0 * (1 - sOfU(0.61));                              // the camera's distance from the axis when it meets the keyed boat
    const W = { ctx, scene, hero, path, L, rng, sky, sunDir, uHeroZ, sOfU, uOfS, updates: [], disposables: [], flyY };
    W.mk = makeWorldMaterialFactory(W);
    await ctx.yield();

    // ---- fair-weather cumulus lower than the summit ---------------------------------------------------
    const clouds = makeCloudField({ rng, sky, count: Math.round(24 * detail), altitude: 190, altitudeJitter: 50, size: [110, 250], height: 0.5, puffs: 22,
      center: [0, 0, 300], extent: [3800, 3400], wind: [2.2, 0, 1.2], opacity: 0.86,
      filter: (x, y, z, w) => Math.abs(x) > 140 + w * 0.6 && Math.hypot(x, z - CZ0 * 0.5) > 520 });
    scene.add(clouds.object);
    await ctx.yield();
    // a bank beyond the hill whose tops fill the lower corners of the last frames
    const clouds2 = makeCloudField({ rng: ctx.core.makeRng(sd * 7919 + 13), noiseTexture: clouds.noiseTexture, sky, count: Math.round(9 * detail), altitude: 215, altitudeJitter: 22, size: [150, 260], height: 0.5, puffs: 20,
      center: [0, 0, -640], extent: [1500, 520], wind: [2.2, 0, 1.2], opacity: 0.86, filter: (x) => Math.abs(x) > 150 });
    scene.add(clouds2.object);
    await ctx.yield();
    // a few low cumulus between the flat and the hill, off the course: from the entry they cross in front of the
    // hill's shoulders, so it reads as kilometres away
    const clouds3 = makeCloudField({ rng: ctx.core.makeRng(sd * 4409 + 29), noiseTexture: clouds.noiseTexture, sky, count: 5, altitude: 150, altitudeJitter: 30, size: [120, 210], height: 0.5, puffs: 20,
      center: [0, 0, 420], extent: [1300, 420], wind: [2.2, 0, 1.2], opacity: 0.86, filter: (x) => Math.abs(x) > 230 && Math.abs(x) < 640 });
    scene.add(clouds3.object);
    await ctx.yield();

    W.bedH = makeBedHeight(W);
    await makeFlat(W);
    await ctx.yield();
    await makeReefLife(W);
    await ctx.yield();
    await makeGrassAndFans(W);
    await ctx.yield();
    makeStranded(W);
    await ctx.yield();
    await makeLighthouse(W);
    await ctx.yield();
    await makeVillage(W);
    await ctx.yield();
    await makeBirds(W);
    await ctx.yield();
    makeSmoke(W);
    await ctx.yield();
    if (rare) makeRareRope(W);
    await ctx.yield();
    if (weather === 'squall') await makeSquall(W);
    await ctx.yield();
    // BUILD-STEPS (appended below as the world grows)

    const update = (dt, time, camera, u) => {
      const s = sOfU(u || 0), cz = CZ0 * (1 - s);
      hero.object.position.z = cz; uHeroZ.value = cz;
      hero.setProgress(s); hero.update(dt, time, camera);
      const uu = u || 0, rc = R0 * (1 - s), sm = THREE.MathUtils.smoothstep;
      // the 14 m shoal turns just ahead under the glass round u 0.55, then a tide-ray glides with us until u 0.62
      // ... and both come back under the lens for the last climb (the shoal from u 0.7, the ray from u 0.76)
      hero.uniforms.uBall.value = Math.max(150, rc - (36 + 80 * (1 - sm(uu, 0.44, 0.52)) - 80 * sm(uu, 0.575, 0.62) + 122 * sm(uu, 0.66, 0.75)));
      hero.uniforms.uRay0.value = Math.max(150, rc - (27 + 70 * (1 - sm(uu, 0.55, 0.59)) - 60 * sm(uu, 0.625, 0.66) + 90 * sm(uu, 0.72, 0.79)));
      // one heeled outrigger on the starboard tack is overtaken at u 0.6-0.62: 37 m ahead at 0.60, 23 m at 0.61, 10.5 m abeam
      hero.uniforms.uB0.value.set(rcBoat - 23 + 45 * (0.61 - uu), Math.max(5.5, 10.5 - 55 * (0.61 - uu)), 0);
      sky.update(dt, time, camera); clouds.update(dt, time, camera); clouds2.update(dt, time, camera); clouds3.update(dt, time, camera);
      for (const f of W.updates) f(dt, time, camera, u || 0, s);
    };
    await ctx.yield();
    update(0, 0, null, 0);
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    const gazeA = new THREE.Vector3(), gazeB = new THREE.Vector3();
    return {
      scene, path, duration: 44,
      // linger where the shoal, the ray and the nearest sail are; make it up over the flat and on the last climb
      pace: (u) => 1.06 - 0.38 * THREE.MathUtils.smoothstep(u, 0.5, 0.57) * (1 - THREE.MathUtils.smoothstep(u, 0.62, 0.7)),
      camera: { fov: 62, near: 0.4, far: 5200, lookAhead: 50, sway: 0.5, bank: 0.4 },
      pois: [
        { at: (time, u) => gazeA.set(0, 200, CZ0 * (1 - sOfU(u))), from: 0.0, to: 0.2, weight: 0.3 },
        { at: (time, u) => { path.pointAt(u, gazeB); return gazeB.set(gazeB.x + 120, gazeB.y + 30, gazeB.z - 190); }, from: 0.47, to: 0.64, weight: 0.5 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#FFE9C4', glow: 1, revealDistance: 500, tilt: true },
      post: H.post,
      ride: 'none',
      update,
      dispose() { hero.dispose(); sky.dispose?.(); for (const d of W.disposables) d.dispose(); },
    };
  },
};

// ------------------------------------------------------------------------------------------------------
// World materials: the hero's shared GLSL (tideH, underwater, lit, moonShade, caustic, skyCol, moonRay)
// with positions brought into the hero's moving frame. Vertex code must define `vec3 wp` (world position).
// ------------------------------------------------------------------------------------------------------
const W_VERT = /* glsl */`
#include <fog_pars_vertex>
uniform float uHeroZ;
varying vec3 vLp; varying vec3 vCam; varying vec3 vWp;
`;
const W_VEND = /* glsl */`
  vWp = wp; vLp = wp - vec3(0., 0., uHeroZ); vCam = cameraPosition - vec3(0., 0., uHeroZ);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
`;
const W_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform float uHeroZ;
varying vec3 vLp; varying vec3 vCam; varying vec3 vWp;
vec3 fogMix(vec3 c){
#ifdef USE_FOG
  float f = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  return mix(c, fogColor, f);
#else
  return c;
#endif
}
`;
function makeWorldMaterialFactory(W) {
  const SH = W.hero.uniforms, BASE = ['uTime', 'uSun', 'uQuiv', 'SUNC', 'uSailW', 'uWind', 'cIvory', 'cSlate', 'cTurq', 'cDeep', 'cAqua', 'cWhite', 'cOrange'];
  return (vs, fs, extra = {}, uni = {}) => {
    const u = THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    for (const k of BASE) u[k] = SH[k];
    u.uHeroZ = W.uHeroZ; Object.assign(u, uni);
    return new THREE.ShaderMaterial({ uniforms: u, vertexShader: TIDE_GLSL + W_VERT + vs, fragmentShader: TIDE_GLSL + W_FRAG + fs, fog: true, ...extra });
  };
}

// ------------------------------------------------------------------------------------------------------
// The drained reef flat: one tensor grid, fine along the corridor, with real relief (channels, hollows
// that hold sky-mirror pools, low mounds). Dry and wet outside the hill, caustic-lit and blue inside it.
// ------------------------------------------------------------------------------------------------------
function makeBedHeight(W) {
  const n = W.ctx.noise, sm = THREE.MathUtils.smoothstep;
  return (x, z) => {
    const ch = sm(n.fbm2(x * 0.0052 + 3.1, z * 0.0052, 3), 0.1, 0.42);            // drained channels
    const hollow = sm(n.n2(x * 0.031 + 7, z * 0.031), 0.15, 0.6);                  // tide pools
    const mound = sm(n.n2(x * 0.017 - 9, z * 0.017 + 4), 0.2, 0.75) * (1 - ch);
    let h = -2.2 * ch - 0.55 * hollow * (1 - ch) + 1.5 * mound + 0.12 * n.n2(x * 0.19, z * 0.19);
    const ax = Math.abs(x);                                                       // the corridor stays low
    if (ax < 14) h = Math.min(h, 0.2 + 1.3 * sm(ax, 5, 14));
    const wpool = sm(1 - Math.hypot((x + 6) / 11, (z - 1209) / 18), 0, 0.45);          // the waders' pool, just to port of the course
    h += (-0.44 - h) * wpool;
    return BED + h;
  };
}
async function makeFlat(W) {
  const { L } = W, bedH = W.bedH;
  const xs = [0], zs = [];
  for (let x = 1.7; x < 70; x += 1.7) xs.push(x);
  for (let x = 70, d = 2.2; x < 5300; d *= 1.32, x += d) xs.push(x);
  const X = [...xs.slice(1).reverse().map((v) => -v), ...xs];
  for (let z = 1345; z > 870; z -= 2.9) zs.push(z);
  const Z = [];
  for (let z = 1345, d = 3.6; z < 5400; d *= 1.4, z += d) Z.unshift(z + d);
  Z.push(...zs);
  for (let z = 870, d = 3.6; z > -5600; d *= 1.3, z -= d) Z.push(z - d);
  const nx = X.length, nz = Z.length, pos = new Float32Array(nx * nz * 3), aH = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) { if (j % 8 === 7) await W.ctx.yield();                             // 27k vertices of relief: hand frames back
   for (let i = 0; i < nx; i++) {
    const k = j * nx + i, x = X[i], z = Z[j];
    const cell = Math.max(i ? X[i] - X[i - 1] : 2, j ? Math.abs(Z[j] - Z[j - 1]) : 3);
    const fade = THREE.MathUtils.clamp(1.15 - cell / 14, 0, 1);
    const h = BED + (bedH(x, z) - BED) * fade;
    pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; aH[k] = fade > 0 ? h - BED : 9;
  } }
  await W.ctx.yield();
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6); let o = 0;
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[o++] = a; idx[o++] = b; idx[o++] = c; idx[o++] = b; idx[o++] = d; idx[o++] = c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aH', new THREE.BufferAttribute(aH, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  await W.ctx.yield();
  await vertexNormalsInSlices(g, () => W.ctx.yield());
  await W.ctx.yield();
  const sand = L.flat === 'blacksand' ? new THREE.Vector3(0.1, 0.1, 0.108) : new THREE.Vector3(0.6, 0.5, 0.34);
  const mat = W.mk(/* glsl */`
    attribute float aH; varying float vH; varying vec3 vN;
    void main(){ vec3 wp = position; vH = aH; vN = normal; ${W_VEND} }`, /* glsl */`
    varying float vH; varying vec3 vN; uniform vec3 uSand; uniform float uGrass, uSheen;
    void main(){
      vec3 toC = vCam - vLp; float dist = length(toC); vec3 V = toC / max(dist, 1e-3);
      vec2 w = vWp.xz; float r = length(vLp.xz);
      float near = 1. / (1. + dist / 45.), geo = step(vH, 8.);
      float h = mix(0., vH, geo);
      float big = fbm(w * .012);
      float chF = smoothstep(.56, .7, fbm(w * .0055 + 3.1));                       // far pattern where the mesh is flat
      float chan = mix(chF, smoothstep(-.5, -1.6, h), geo);
      // sand ripple marks: two sets, each living only in its own patches (a few metres across), with a wandering
      // direction and wavelength so the crests bunch, fork and die out; faded before they fall under ~3 pixels a wave
      // (direction and wavelength wander through the warp alone: scaling a world coordinate by a varying factor
      // would turn the marks into a fine chirp)
      vec2 wq = w + (vec2(fbm(w * .09), fbm(w * .09 + 7.3)) - .5) * 6.5 + (vec2(vn(w * .33 + 2.), vn(w * .33 + 9.)) - .5) * .9;
      vec2 d1 = vec2(.8, .6), d2 = vec2(.34, -.94);
      float ph1 = dot(wq, d1) * 7.2, ph2 = dot(wq, d2) * 10.2;
      float m1 = smoothstep(.43, .6, vn(w * .17 + 2.) * .62 + fbm(w * .045) * .38);
      float m2 = smoothstep(.45, .62, vn(w * .21 + 40.) * .62 + fbm(w * .05 + 9.) * .38) * (1. - m1);
      m1 *= smoothstep(2.5, 1., fwidth(ph1)); m2 *= smoothstep(2.5, 1., fwidth(ph2));
      float rp = sin(ph1) * m1 + sin(ph2) * m2 * .7;
      float ra = 1. - 1.5 * uSheen;                                              // a glossy bed shows them through the sheen instead
      vec3 n = normalize(vN + vec3(d1.x, 0., d1.y) * (cos(ph1) * .3 * m1 * ra) + vec3(d2.x, 0., d2.y) * (cos(ph2) * .24 * m2 * ra));
      vec3 alb = uSand * (.86 + .26 * big + .15 * rp) * (.9 + .2 * vn(w * 2.7));
      alb = mix(alb, uSand * .6 + cTurq * .1, chan * .6);
      vec2 sc = w * 2.1, si = floor(sc); float sh1 = h21(si);                        // shells and pebbles
      alb = mix(alb, mix(vec3(.75, .7, .62), vec3(.2, .19, .2), step(.5, h21(si + 5.))), smoothstep(.27, .17, length((fract(sc) - .5 - (vec2(sh1, h21(si + 2.)) - .5) * .4) * vec2(1., 1.5 + sh1))) * step(.935, sh1) * min(near * 1.6, 1.) * (1. - .45 * step(.01, uSheen)));
      // coral crust and weed on the mounds, seagrass in the meadows
      float crust = smoothstep(.35, 1.1, h) * geo + (1. - geo) * smoothstep(.62, .8, fbm(w * .017 + 4.));
      vec3 crustC = mix(vec3(.42, .3, .26), vec3(.5, .46, .3), vn(w * .7)) * (.5 + .7 * vn(w * 3.1));
      alb = mix(alb, crustC, crust * .75);
      float meadow = smoothstep(.61 - uGrass, .75 - uGrass, fbm(w * .021 + 11.)) * (1. - chan) * (1. - crust);
      alb = mix(alb, vec3(.07, .2, .12) + cTurq * .08, meadow * .8 * (.5 + .5 * vn(w * vec2(1.1, 3.4))));
      float depth = tideH(vLp.xz) - vLp.y;
      float wet = smoothstep(2100., 1450., r);
      alb *= mix(.72, 1.12, smoothstep(-.7, .9, h + (big - .5) * .8));                    // soaked hollows darker than the drying crests
      vec3 col = lit(alb * mix(1., .6, wet), n, vLp);
      if (r < 1400. && depth > 0.) {
        col = underwater(col, vLp, V);
      } else {
        // pools: water stands in the hollows at a fixed level; channels keep a deeper turquoise run
        float lvl = -.16 + .05 * big;
        float pd = mix(chF * .5, (lvl - h), geo);                                  // depth of standing water
        float pool = smoothstep(0., .06, pd);
        vec2 rs = (vec2(vn(w * 1.3 + uTime * .5), vn(w * 1.3 - uTime * .4 + 5.)) - .5) * (.07 + .1 * near);
        rs += (vec2(vn(w * 6. + uTime * 1.1), vn(w * 6. - uTime * .9)) - .5) * .09 * near;
        vec3 Nw = normalize(mix(n, vec3(0., 1., 0.), pool) + vec3(rs.x, 0., rs.y) * pool);
        vec3 R = reflect(-V, Nw); R.y = abs(R.y) + .02; R = normalize(R);
        float fres = .04 + .96 * pow(1. - clamp(dot(Nw, V), 0., 1.), 5.);
        vec4 mr = moonRay(vLp, R);
        vec3 refl = mix(skyCol(R), mr.rgb * .5 + cSlate * .1, mr.a);          // the moon lies in the pools as a dark soft shape
        vec3 poolBody = mix(col, cTurq * .5 * (.6 + .5 * moonShade(vLp)), 1. - exp(-pd * 1.4));
        col = mix(col, poolBody, pool);
        // rivulets draining toward the hill off the mounds
        vec2 dirn = vLp.xz / max(r, 1.);
        float rv = vn(vec2(dot(w, vec2(-dirn.y, dirn.x)) * 1.5 + 1.2 * vn(w * .2), dot(w, dirn) * .045 + uTime * .7));
        float riv = smoothstep(.76, .9, rv) * wet * (1. - pool) * smoothstep(.3, .6, fbm(w * .03 + 5.));   // threads, in a few runs
        float sheen = max(pool * (.5 + .5 * fres), wet * (fres * (.34 + .5 * riv) + uSheen * (.2 + 1.5 * fres + .17 * rp * (.45 + fres) + .3 * (big - .5) + .2 * (m1 + m2) * (.3 + fres))));
        sheen = clamp(sheen, 0., .92);
        col = mix(col, refl, sheen);
        col = mix(col, refl * 1.08, riv * .5);
        float edge = smoothstep(.0, .04, pd) * smoothstep(.12, .04, pd);           // bright wet rim of each pool
        col *= 1. - .3 * smoothstep(-.22, 0., pd) * (1. - pool);                    // darker soaked sand round each pool
        col += cIvory * .1 * edge;
        float sp = pow(max(dot(R, uSun), 0.), 260.) * moonShade(vLp);
        col += SUNC * sp * 6. * max(pool, wet * .35);
      }
      gl_FragColor = vec4(fogMix(col), 1.);
    }`, {}, { uSand: { value: sand }, uGrass: { value: L.flat === 'seagrass' ? 0.16 : 0.0 }, uSheen: { value: L.flat === 'blacksand' ? 0.3 : 0.0 } });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = -0.5;
  W.scene.add(m);
  return m;
}

// ------------------------------------------------------------------------------------------------------
// Reef life on the flat: coral heads (brain and table), sea fans, seagrass lying combed toward the hill
// while dry and standing up to sway once the water covers it.
// ------------------------------------------------------------------------------------------------------
async function scatterFlat(W, rng, count, accept) {
  const out = [];
  for (let i = 0, tries = 0; out.length < count && tries < count * 30; tries++) {
    if (tries % 256 === 255) await W.ctx.yield();
    const side = rng() < 0.5 ? -1 : 1, ax = 4.5 + Math.pow(rng(), 1.7) * 120, x = side * ax, z = 862 + rng() * 475;
    const y = W.bedH(x, z);
    if (accept && !accept(x, y, z, rng)) continue;
    out.push([x, y, z]); i++;
  }
  return out;
}
async function makeReefLife(W) {
  const { L, scene } = W, rng = W.rng.fork('reef'), k = L.detail * (0.8 + 0.2 * L.density);
  const dummy = new THREE.Object3D(), col = new THREE.Color();
  // ---- coral heads ----
  const nC = Math.round((L.flat === 'coral' ? 700 : 420) * k);
  const spots = await scatterFlat(W, rng, nC, (x, y, z, r) => (y - BED > 0.1 || r() < 0.25) && !(Math.abs(x) < 7 && y - BED > -0.5) && (W.ctx.noise.n2(x * 0.07 + 50, z * 0.07 + 13) > 0.05 || r() < 0.08));   // heads stand in groups, bare sand between
  await W.ctx.yield();
  const cg = new THREE.IcosahedronGeometry(1, 1);
  const corals = new THREE.InstancedMesh(cg, null, spots.length), aC = new Float32Array(spots.length * 4);
  const tones = ['#D9C9A8', '#B98E78', '#9A8A9C', '#C7B078', '#8FA69C', '#E4DCC8', '#A9786E', '#CDBB96'];
  spots.forEach((p, i) => {
    const table = rng() < 0.28, s = table ? rng.range(0.9, 2.3) : rng.range(0.45, 1.5) * (Math.abs(p[0]) < 10 ? 0.6 : 1);
    dummy.position.set(p[0], p[1] + (table ? s * 0.42 : s * 0.25), p[2]);
    dummy.scale.set(s, table ? s * 0.2 : s * rng.range(0.55, 0.8), s * rng.range(0.8, 1.15));
    dummy.rotation.set(rng.range(-0.15, 0.15), rng() * 6.28, rng.range(-0.15, 0.15)); dummy.updateMatrix();
    corals.setMatrixAt(i, dummy.matrix);
    col.set(rng.pick(tones)).multiplyScalar(rng.range(0.55, 0.85));
    aC.set([col.r, col.g, col.b, table ? -rng() - 0.01 : rng() + 0.01], i * 4);
  });
  cg.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4));
  await W.ctx.yield();
  corals.material = W.mk(/* glsl */`
    attribute vec4 aC; varying vec3 vN; varying vec4 vC; varying vec3 vO;
    void main(){
      vec3 q = position; float sd = abs(aC.w) * 31.;
      float lump = vn(q.xz * 2.6 + sd) * vn(q.yx * 3.1 + sd * 1.7);
      q *= 1. + (aC.w > 0. ? .34 * lump - .08 : .1 * lump);
      if (aC.w < 0.) q.y -= .9 * (q.x * q.x + q.z * q.z) * .35 * step(q.y, 0.);     // table coral: dished underside
      vec3 wp = (modelMatrix * instanceMatrix * vec4(q, 1.)).xyz;
      mat3 im = mat3(instanceMatrix); vec3 s2 = vec3(dot(im[0], im[0]), dot(im[1], im[1]), dot(im[2], im[2]));
      vN = normalize(im * (normal / max(s2, vec3(1e-4))));
      vC = aC; vO = position * (1.2 + abs(aC.w)) + sd;
      ${W_VEND} }`, /* glsl */`
    varying vec3 vN; varying vec4 vC; varying vec3 vO;
    void main(){
      vec3 V = normalize(vCam - vLp), n = normalize(vN);
      // brain-coral meanders (heads) or radial plates (tables)
      float a = vn(vO.xz * 5. + vO.y * 3.), b = vn(vO.zy * 5.3 + 4.);
      float mz = abs(sin((a * 2.2 + b * 1.7 + vO.y * .8) * 9.));
      float groove = vC.w > 0. ? smoothstep(.0, .5, mz) : smoothstep(.1, .5, abs(sin(length(vO.xz - abs(vC.w) * 31.) * 9. + a * 3.)));
      vec3 alb = vC.rgb * (.5 + .62 * groove) * (.75 + .5 * vn(vO.xy * 11.));
      alb = mix(alb, vec3(.12, .2, .13), smoothstep(.1, -.5, n.y) * .6);                    // weed under the lip
      float depth = tideH(vLp.xz) - vLp.y, dry = step(depth, 0.);
      vec3 col = lit(alb * mix(1., .72, dry), n, vLp);
      col *= .55 + .45 * smoothstep(-.6, .5, n.y);                                         // contact shade
      // wet: sky sheen and thin rivulets running down the flanks
      float fres = pow(1. - max(dot(n, V), 0.), 4.);
      vec3 R = reflect(-V, n); R.y = abs(R.y);
      float riv = smoothstep(.7, .92, vn(vec2(atan(n.z + 1e-4, n.x + 2e-4) * 7., vWp.y * 2.5 + uTime * 1.6)));
      col = mix(col, skyCol(R), dry * (fres * .6 + riv * .22));
      col += SUNC * pow(max(dot(R, uSun), 0.), 60.) * (.5 + 1.5 * riv) * dry * moonShade(vLp);
      col = underwater(col, vLp, V);
      gl_FragColor = vec4(fogMix(col), 1.);
    }`);
  corals.frustumCulled = false; scene.add(corals);
  return { spots };
}
async function makeGrassAndFans(W) {
  const { L, scene } = W, rng = W.rng.fork('grass'), k = L.detail * (0.75 + 0.25 * L.density), n = W.ctx.noise;
  // ---- seagrass tufts: 3 blades, 2 segments each ----
  const bp = [], bi = [];
  for (let b = 0; b < 3; b++) for (let r = 0; r < 3; r++) { const t = r / 2; bp.push(-1, t, b, 1, t, b); if (r < 2) { const o = b * 6 + r * 2; bi.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); } }
  const nT = Math.round((L.flat === 'seagrass' ? 4200 : 2800) * k);
  const pts = await scatterFlat(W, rng, nT, (x, y, z, r) => y - BED < 0.5 && y - BED > -1.3 && (n.fbm2(x * 0.02 + 11, z * 0.02, 2) > (L.flat === 'seagrass' ? -0.25 : 0.0) || r() < 0.12) && (n.n2(x * 0.11 + 31, z * 0.11 - 7) > 0.2 || r() < 0.04));   // tufts in clumps, bare wet sand between
  await W.ctx.yield();
  const aG = new Float32Array(pts.length * 4), aS = new Float32Array(pts.length * 2);
  pts.forEach((p, i) => { aG.set([p[0], p[1], p[2], rng()], i * 4); aS.set([rng.range(1.1, 2.3), rng() * 6.28], i * 2); });
  const gg = new THREE.InstancedBufferGeometry();
  gg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); gg.setIndex(bi);
  gg.setAttribute('aG', new THREE.InstancedBufferAttribute(aG, 4)); gg.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 2));
  gg.instanceCount = pts.length;
  await W.ctx.yield();
  const gmat = W.mk(/* glsl */`
    attribute vec4 aG; attribute vec2 aS; varying vec3 vT;
    void main(){
      float t = position.y, sd = aG.w * 40. + position.z * 2.1, len = aS.x * (.75 + .25 * fract(sd * .37));
      vec3 root = aG.xyz; vec3 rl = root - vec3(0., 0., uHeroZ);
      float wetK = smoothstep(.0, 1.3, tideH(rl.xz) - root.y);
      float ya = aS.y + position.z * 2.4;
      vec2 comb = normalize(-rl.xz + vec2(cos(ya), sin(ya)) * 300.);                 // dry: combed toward the hill, fanned a little
      vec3 lie = vec3(comb.x, 0., comb.y) * (len * t) + vec3(0., .05 + .16 * len * sin(t * 2.6), 0.);
      vec2 sw = vec2(sin(uTime * 1.3 + sd + root.x * .3), cos(uTime * 1.1 + sd * 1.3 + root.z * .3)) * .32 * t * t;
      vec3 stand = vec3(sw.x + cos(ya) * .25 * t, len * t * .8, sw.y + sin(ya) * .25 * t) - vec3(comb.x, 0., comb.y) * (.35 * t * t * len);
      vec3 off = mix(lie, stand, wetK);
      vec3 sideV = normalize(vec3(-comb.y, 0., comb.x) + vec3(cos(ya), 0., sin(ya)) * .6);
      vec3 wp = root + off + sideV * position.x * .07 * (1. - t * .8) * (1. + distance(cameraPosition, root) * .012);
      wp.y += sin(uTime * 2.3 + sd) * .015 * t * (1. - wetK);
      vT = vec3(t, fract(sd * .71), wetK);
      ${W_VEND} }`, /* glsl */`
    varying vec3 vT;
    void main(){
      vec3 V = normalize(vCam - vLp);
      vec3 alb = mix(vec3(.03, .085, .05), vec3(.1, .2, .08), vT.x) * (.7 + .6 * vT.y);
      vec3 col = alb * (SUNC * .75 * moonShade(vLp) + cAqua * .4);
      col += SUNC * .25 * pow(vT.x, 3.) * (1. - vT.z) * moonShade(vLp);                 // wet glint on the laid blades
      col = underwater(col, vLp, V);
      gl_FragColor = vec4(fogMix(col), 1.);
    }`, { side: THREE.DoubleSide });
  const grass = new THREE.Mesh(gg, gmat); grass.frustumCulled = false; scene.add(grass);
  await W.ctx.yield();
  // ---- sea fans: lace drawn in the fragment shader ----
  const nF = Math.round(230 * k), fpts = await scatterFlat(W, rng, nF, (x, y, z) => y - BED > -0.4 && Math.abs(x) > 6);
  await W.ctx.yield();
  const fg = new THREE.InstancedBufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute([-0.6, 0, 0, 0.6, 0, 0, -0.6, 1, 0, 0.6, 1, 0], 3)); fg.setIndex([0, 1, 2, 1, 3, 2]);
  const fG = new Float32Array(fpts.length * 4), fS = new Float32Array(fpts.length * 4);
  fpts.forEach((p, i) => { fG.set([p[0], p[1] - 0.05, p[2], rng()], i * 4); fS.set([rng.range(0.9, 2.4), rng() * 6.28, rng(), rng()], i * 4); });
  fg.setAttribute('aG', new THREE.InstancedBufferAttribute(fG, 4)); fg.setAttribute('aS', new THREE.InstancedBufferAttribute(fS, 4));
  fg.instanceCount = fpts.length;
  const fmat = W.mk(/* glsl */`
    attribute vec4 aG; attribute vec4 aS; varying vec2 vQ; varying vec3 vK;
    void main(){
      vec3 root = aG.xyz; float sd = aG.w * 50.;
      float wetK = smoothstep(0., 1.5, tideH(root.xz - vec2(0., uHeroZ)) - root.y);
      float sway = sin(uTime * (1.1 + aS.z) + sd) * mix(.03, .16, wetK) * position.y * position.y;
      vec3 ax = vec3(cos(aS.y), 0., sin(aS.y));
      vec3 wp = root + (ax * (position.x + sway) + vec3(0., position.y, 0.) + vec3(-ax.z, 0., ax.x) * sway * .6) * aS.x;
      vQ = position.xy; vK = vec3(aS.z, aS.w, sd);
      ${W_VEND} }`, /* glsl */`
    varying vec2 vQ; varying vec3 vK;
    void main(){
      float rad = length(vQ), ang = atan(vQ.x, vQ.y + 1e-3);
      float wob = vn(vec2(ang * 3. + vK.z, rad * 4.));
      float rib = abs(sin(ang * (11. + 6. * vK.x) + wob * 2.4 * rad));
      float web = abs(sin(rad * 34. + wob * 5.));
      float lace = max(smoothstep(.34, .12, rib), smoothstep(.3, .1, web) * .8);
      float shape = smoothstep(.98, .86, rad + .1 * vn(vec2(ang * 5., vK.z))) * smoothstep(.62, .5, abs(ang)) * smoothstep(.03, .1, rad);
      float stem = smoothstep(.05, .02, abs(vQ.x)) * step(vQ.y, .3);
      if (max(lace * shape, stem) < .4) discard;
      vec3 V = normalize(vCam - vLp);
      vec3 alb = mix(mix(vec3(.5, .24, .46), vec3(.74, .62, .5), step(.6, vK.y)), vec3(.62, .3, .34), step(.85, vK.y)) * (.6 + .5 * rad);
      vec3 col = alb * (SUNC * .8 * moonShade(vLp) + cAqua * .42);
      col = underwater(col, vLp, V);
      gl_FragColor = vec4(fogMix(col), 1.);
    }`, { side: THREE.DoubleSide });
  const fans = new THREE.Mesh(fg, fmat); fans.frustumCulled = false; scene.add(fans);
}

// ------------------------------------------------------------------------------------------------------
// Eight boats stranded on the flat, leaning on their bilges with the sail half brailed up to the yard.
// When the glass lip reaches one it floats, rights itself and rides the swell. Slack anchor ropes are
// ribbons laid over the sand.
// ------------------------------------------------------------------------------------------------------
const STRANDED = [[14.5, 1228, 0.5], [-25, 1216, -0.9], [42, 1186, 2.4], [-13, 1130, 0.2], [13.5, 1048, -0.6], [-52, 1080, 1.4], [-17, 968, 2.9], [16, 925, 0.4]];
function makeStranded(W) {
  const { scene, hero } = W, rng = W.rng.fork('stranded'), n = STRANDED.length;
  const g = new THREE.InstancedBufferGeometry(), src = hero.boatGeometry;
  for (const k of ['position', 'normal', 'color', 'aPart', 'uv']) g.setAttribute(k, src.attributes[k]);
  if (src.index) g.setIndex(src.index);
  const aB = new Float32Array(n * 4), aB2 = new Float32Array(n * 4), rope = [];
  STRANDED.forEach(([x, z, yaw], i) => {
    const by = W.bedH(x, z), lean = rng.range(0.27, 0.42) * (i % 2 ? 1 : -1);
    aB.set([x, z, yaw, lean], i * 4); aB2.set([by, rng(), rng.range(0.9, 1.08), rng.range(0.4, 0.62)], i * 4);
    rope.push([x + Math.cos(yaw) * 5.4, by + 1.2, z - Math.sin(yaw) * 5.4, x + Math.cos(yaw + 0.5) * rng.range(13, 19), z - Math.sin(yaw + 0.5) * rng.range(13, 19)]);
  });
  g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); g.setAttribute('aB2', new THREE.InstancedBufferAttribute(aB2, 4));
  g.instanceCount = n;
  const mat = W.mk(/* glsl */`
    attribute vec4 aB; attribute vec4 aB2; attribute float aPart; attribute vec3 color;
    varying vec3 vN; varying vec3 vCol; varying vec3 vPu;
    void main(){
      float sd = aB2.y * 40.;
      vec2 lxz = aB.xy - vec2(0., uHeroZ);
      float sy = surfY(lxz), depth = sy - aB2.x, fl = smoothstep(.45, 1.5, depth);
      float lean = aB.w * (1. - fl) + .05 * sin(uTime * .9 + sd) * fl, pitch = .03 * sin(uTime * .7 + sd * 2.) * fl;
      vec3 q = position, nn = normal;
      if (aPart > .5 && aPart < 1.5) {                                   // sail: brailed up to the yard, the bunt hanging in scallops
        float br = aB2.w * (1. - .0 * fl), up = (1. - uv.y);
        q.y += up * br * 8.2; q.z = q.z * .5 + sin(uv.x * 15.7) * .22 * up * br + sin(uv.y * 9. - uTime * 3. + sd) * .05 * uv.x;
        q.z += sin(uTime * 1.4 + sd + uv.x * 3.) * .12 * up;
      } else if (aPart > 1.5 && aPart < 2.5) {                           // pennant lifts toward the moon
        q.z += sin(uv.x * 5. - uTime * 7. + sd) * .25 * uv.x; q.y += uv.x * (.9 + .2 * sin(uTime * 3. + sd));
      } else if (aPart > 2.5) { q.y += sin(uTime * 3. + q.x * 2. + sd) * .04; }
      q *= aB2.z;
      float cl = cos(lean), sl = sin(lean), cp = cos(pitch), sp = sin(pitch), cy = cos(aB.z), syw = sin(aB.z);
      vec3 a = vec3(q.x, q.y * cl - q.z * sl, q.y * sl + q.z * cl), na = vec3(nn.x, nn.y * cl - nn.z * sl, nn.y * sl + nn.z * cl);
      a = vec3(a.x * cp - a.y * sp, a.x * sp + a.y * cp, a.z); na = vec3(na.x * cp - na.y * sp, na.x * sp + na.y * cp, na.z);
      vec3 b = vec3(a.x * cy + a.z * syw, a.y, -a.x * syw + a.z * cy);
      vN = vec3(na.x * cy + na.z * syw, na.y, -na.x * syw + na.z * cy);
      float baseY = max(aB2.x + .42 * cl, sy + .12 + .06 * sin(uTime * 1.3 + sd));
      vec3 wp = vec3(aB.x, baseY, aB.y) + b;
      vCol = color; vPu = vec3(aPart, uv);
      ${W_VEND} }`, /* glsl */`
    varying vec3 vN; varying vec3 vCol; varying vec3 vPu;
    void main(){
      vec3 V = normalize(vCam - vLp), n = normalize(vN);
      if (dot(n, V) < 0.) n = -n;
      vec3 alb = vCol;
      if (vPu.x > .5 && vPu.x < 1.5) {
        alb = mix(alb, cWhite * .7, uSailW * (1. - step(2., vPu.z * 6.) * step(vPu.z * 6., 3.)));
        float bt = abs(fract(vPu.z * 6. + .5) - .5); alb *= mix(.5, 1., smoothstep(.015, .045, bt));
        float seam = abs(fract(vPu.y * 6. + .5) - .5); alb *= mix(.8, 1., smoothstep(.008, .03, seam));
        alb *= .86 + .28 * vn(vPu.yz * vec2(26., 44.));
      } else if (vPu.x < .5) {
        alb *= .8 + .3 * vn(vWp.xy * 3.) ;                                                  // weathered planks
        alb *= mix(.62, 1., smoothstep(-.4, .5, vWp.y - (-2.6)));                           // dark wet bottom
      }
      vec3 col = lit(alb, n, vLp);
      if (vPu.x > .5) col += alb * SUNC * .55 * max(dot(-n, uSun), 0.) * moonShade(vLp);
      col = underwater(col, vLp, V);
      gl_FragColor = vec4(fogMix(col), 1.);
    }`, { side: THREE.DoubleSide });
  const boats = new THREE.Mesh(g, mat); boats.frustumCulled = false; scene.add(boats);
  // slack anchor ropes: ribbons draped over the sand
  const rp = [], ri = [], NR = 14;
  rope.forEach(([x0, y0, z0, x1, z1], r) => {
    for (let k = 0; k <= NR; k++) {
      const t = k / NR, x = x0 + (x1 - x0) * t + Math.sin(t * 7 + r) * 0.9 * t, z = z0 + (z1 - z0) * t + Math.cos(t * 5 + r * 2) * 0.9 * t;
      const y = Math.max(W.bedH(x, z) + 0.07, y0 - t * 9), dx = (z1 - z0), dz = -(x1 - x0), l = Math.hypot(dx, dz) || 1, o = rp.length / 3;
      rp.push(x - dx / l * 0.07, y, z - dz / l * 0.07, x + dx / l * 0.07, y + 0.05, z + dz / l * 0.07);
      if (k < NR) ri.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
    }
  });
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setIndex(ri);
  const rmat = W.mk(/* glsl */`void main(){ vec3 wp = position; ${W_VEND} }`, /* glsl */`
    void main(){ vec3 col = vec3(.34, .3, .24) * (SUNC * .7 * moonShade(vLp) + cAqua * .4) * (.8 + .4 * step(.5, fract(vWp.x * 3. + vWp.z * 3.)));
      col = underwater(col, vLp, normalize(vCam - vLp)); gl_FragColor = vec4(fogMix(col), 1.); }`, { side: THREE.DoubleSide });
  const ropes = new THREE.Mesh(rg, rmat); ropes.frustumCulled = false; scene.add(ropes);
}

// ------------------------------------------------------------------------------------------------------
// Small geometry kit for the built things: paint a primitive with a colour and a part id, then merge.
// ------------------------------------------------------------------------------------------------------
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
function paint(geo, color, part = 0, pos = null, rot = null, scl = null) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  if (pos || rot || scl) {
    _e.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0); _q.setFromEuler(_e);
    _m4.compose(_v.set(pos ? pos[0] : 0, pos ? pos[1] : 0, pos ? pos[2] : 0), _q, _s.set(scl ? scl[0] : 1, scl ? scl[1] : 1, scl ? scl[2] : 1));
    g.applyMatrix4(_m4);
  }
  const n = g.attributes.position.count, c = new Float32Array(n * 3), p = new Float32Array(n), col = new THREE.Color(color);
  for (let i = 0; i < n; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; p[i] = part; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setAttribute('aPart', new THREE.BufferAttribute(p, 1));
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color', 'aPart'].includes(k)) g.deleteAttribute(k);
  return g;
}
function mergeParts(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry(), sizes = { position: 3, normal: 3, uv: 2, color: 3, aPart: 1 };
  for (const k of Object.keys(sizes)) {
    const arr = new Float32Array(n * sizes[k]); let o = 0;
    for (const g of list) { arr.set(g.attributes[k].array, o); o += g.attributes[k].array.length; }
    out.setAttribute(k, new THREE.BufferAttribute(arr, sizes[k]));
  }
  for (const g of list) g.dispose();
  return out;
}
// a ribbon strip along points (array of [x,y,z]) with a width function; uv.x runs along it, uv.y across
function ribbon(points, widthAt, side = [1, 0, 0]) {
  const pos = [], uv = [], n = points.length;
  const row = (i) => { const p = points[i], w = widthAt(i / (n - 1)) * 0.5; return [[p[0] - side[0] * w, p[1] - side[1] * w, p[2] - side[2] * w], [p[0] + side[0] * w, p[1] + side[1] * w, p[2] + side[2] * w]]; };
  for (let i = 0; i < n - 1; i++) {
    const a = row(i), b = row(i + 1), t0 = i / (n - 1), t1 = (i + 1) / (n - 1);
    pos.push(...a[0], ...a[1], ...b[0], ...a[1], ...b[1], ...b[0]); uv.push(t0, 0, t0, 1, t1, 0, t0, 1, t1, 1, t1, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------------------------------------------
// The lighthouse: a white tower 38 m tall on a rock 34 m to port, slate gallery, glinting lantern glass
// (unlit), an iron stair that normally ends in water, five palms whose fronds lift toward the moon and
// ribbons of weed hanging dripping from the rock.     parts: 1 rock 2 tower 3 slate 4 glass 5 iron
//                                                            6 trunk 7 frond 8 weed
// ------------------------------------------------------------------------------------------------------
const LH = { x: -34, z: 980 };
async function makeLighthouse(W) {
  const rng = W.rng.fork('lighthouse'), n = W.ctx.noise, parts = [], X = LH.x, Z = LH.z, top = 1.6;
  const rock = mergeVertices(new THREE.IcosahedronGeometry(1, 3).deleteAttribute('normal').deleteAttribute('uv')), rp = rock.attributes.position;
  await W.ctx.yield();
  for (let i = 0; i < rp.count; i++) {
    const x = rp.getX(i), y = rp.getY(i), z = rp.getZ(i), k = 1 + 0.22 * n.n3(x * 1.6, y * 1.6, z * 1.6) + 0.1 * n.n3(x * 4, y * 4, z * 4);
    rp.setXYZ(i, x * k * 12.5, Math.min(y * k * 5.2, 4.3 + 0.25 * n.n2(x * 5, z * 5)), z * k * 10.5);
  }
  await W.ctx.yield();
  rock.computeVertexNormals();
  parts.push(paint(rock, '#6f6a62', 1, [X, BED + 0.4, Z]));
  await W.ctx.yield();
  const prof = [[3.5, 0], [3.3, 1.2], [3.05, 6], [2.75, 16], [2.5, 26], [2.42, 29]].map(([r, y]) => new THREE.Vector2(r, y));
  parts.push(paint(new THREE.LatheGeometry(prof, 28), '#c9c6bd', 2, [X, top, Z]));
  parts.push(paint(new THREE.CylinderGeometry(3.45, 2.9, 0.55, 20), '#5f7694', 3, [X, top + 29.2, Z]));
  parts.push(paint(new THREE.CylinderGeometry(3.4, 3.4, 1.15, 20, 1, true), '#5f7694', 3.5, [X, top + 30.05, Z]));
  parts.push(paint(new THREE.CylinderGeometry(1.85, 1.85, 3.5, 16, 1, true), '#31505c', 4, [X, top + 31.2, Z]));
  parts.push(paint(new THREE.ConeGeometry(2.5, 2.3, 16), '#566c8a', 3, [X, top + 34.1, Z]));
  parts.push(paint(new THREE.SphereGeometry(0.42, 8, 6), '#566c8a', 3, [X, top + 35.5, Z]));
  parts.push(paint(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 5), '#3a4048', 5, [X, top + 36.4, Z]));
  await W.ctx.yield();
  for (let i = 0; i < 16; i++) {                                         // the iron stair, down the rock toward the channel
    if (i % 4 === 3) await W.ctx.yield();
    const t = i / 15, a = 0.25 + t * 1.1, r = 4.2 + t * 7.5, y = top + 0.9 - t * 5.4;
    parts.push(paint(new THREE.BoxGeometry(1.5, 0.09, 0.5), '#2f343b', 5, [X + Math.cos(a) * r, y, Z + Math.sin(a) * r], [0, -a, 0]));
    if (i % 3 === 0) parts.push(paint(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 4), '#2f343b', 5, [X + Math.cos(a) * r + Math.sin(a) * 0.7, y + 0.55, Z + Math.sin(a) * r - Math.cos(a) * 0.7]));
  }
  for (let p = 0; p < 5; p++) {                                          // palms
    await W.ctx.yield();
    const a = [0.9, 2.2, 2.9, 4.3, 5.4][p], r = rng.range(5.2, 8.2), bx = X + Math.cos(a) * r, bz = Z + Math.sin(a) * r, h = rng.range(8, 12.5);
    const lx = Math.cos(a) * rng.range(1.5, 3.2), lz = Math.sin(a) * rng.range(1.5, 3.2), by = BED + 3.3 - (r - 5) * 0.55;
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(bx, by, bz), new THREE.Vector3(bx + lx * 0.5, by + h * 0.45, bz + lz * 0.5), new THREE.Vector3(bx + lx, by + h, bz + lz)]);
    const trunk = new THREE.TubeGeometry(curve, 7, 0.24, 6, false);
    parts.push(paint(trunk, '#6b5a47', 6));
    const cx = bx + lx, cy = by + h, cz = bz + lz;
    for (let f = 0; f < 11; f++) {
      if (f % 4 === 0) await W.ctx.yield();
      const fa = f / 11 * 6.283 + rng() * 0.4, len = rng.range(3.4, 4.8), droop = rng.range(-0.1, 0.5), pts = [];
      for (let k = 0; k <= 5; k++) { const t = k / 5, o = len * t; pts.push([cx + Math.cos(fa) * o, cy + 0.3 + o * (0.75 - droop) - t * t * len * 0.35, cz + Math.sin(fa) * o]); }
      const fr = paint(ribbon(pts, (t) => 1.5 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1)) + 0.1, [-Math.sin(fa), 0, Math.cos(fa)]), '#3f6a2c', 7 + (f % 5) * 0.01 + p * 0.002);
      parts.push(fr);
    }
  }
  for (let w = 0; w < 26; w++) {                                         // weed hanging from the rock's shoulders
    if (w % 4 === 0) await W.ctx.yield();
    const a = rng() * 6.283, r = rng.range(0.75, 0.98), x = X + Math.cos(a) * 12 * r, z = Z + Math.sin(a) * 10 * r, y0 = BED + 0.4 + 5 * Math.sqrt(Math.max(0, 1 - r * r)) * 0.8, len = rng.range(1.2, 3);
    const pts = []; for (let k = 0; k <= 3; k++) pts.push([x + Math.cos(a) * k * 0.12, y0 - len * k / 3, z + Math.sin(a) * k * 0.12]);
    parts.push(paint(ribbon(pts, (t) => 0.45 * (1 - t * 0.6), [-Math.sin(a), 0, Math.cos(a)]), '#2c4a2a', 8 + rng() * 0.4));
  }
  await W.ctx.yield();
  const g = mergeParts(parts);
  await W.ctx.yield();
  const m = new THREE.Mesh(g, makeBuiltMaterial(W)); m.frustumCulled = false; W.scene.add(m);
}

// One material for everything built (lighthouse, palms, village). The part id picks the surface.
//  1 rock 2 tower 3 slate 3.5 railing 4 glass 5 iron 6 trunk 7 frond 8 weed | 10 wood 11 thatch 12 cloth
//  13 ladder 14 canoe 15 drying rack
function makeBuiltMaterial(W) {
  return W.mk(/* glsl */`
    attribute float aPart; attribute vec3 color;
    varying vec3 vN; varying vec3 vCol; varying vec3 vPu;
    void main(){
      vec3 q = position, nn = normal; float sd = fract(aPart) * 100.;
    #ifdef USE_INSTANCING
      q = (instanceMatrix * vec4(q, 1.)).xyz; nn = mat3(instanceMatrix) * nn; sd += instanceMatrix[3].x * .37 + instanceMatrix[3].z * .11;
    #endif
      vec3 wp = (modelMatrix * vec4(q, 1.)).xyz;
      float t = uv.x;
      if (aPart > 6.5 && aPart < 7.5) {                                  // fronds lift toward the moon and shiver
        wp.y += t * t * (.9 + .5 * sin(uTime * 1.2 + sd * 6.)) + t * .12 * sin(uTime * 5.3 + sd * 9. + t * 6.);
        wp.xz += t * t * .3 * vec2(sin(uTime * .9 + sd * 4.), cos(uTime * 1.1 + sd * 5.));
      } else if ((aPart > 7.5 && aPart < 8.5) || (aPart > 15.5 && aPart < 16.5)) {   // hanging weed sways and drips
        wp.xz += t * t * .22 * vec2(sin(uTime * 1.6 + sd * 7.), cos(uTime * 1.3 + sd * 3.));
      } else if (aPart > 11.5 && aPart < 12.5) {                         // laundry drawn upward, flapping
        wp.y += t * (.25 + .2 * sin(uTime * 2.1 + sd * 5.)) + t * .1 * sin(uTime * 7. + sd * 8. + t * 9.);
        wp.xz += t * .22 * vec2(sin(uTime * 3.1 + sd * 6. + t * 5.), cos(uTime * 2.7 + sd * 2. + t * 4.));
      }
      vN = nn; vCol = color; vPu = vec3(aPart, uv);
      ${W_VEND} }`, /* glsl */`
    varying vec3 vN; varying vec3 vCol; varying vec3 vPu;
    void main(){
      vec3 V = normalize(vCam - vLp), n = normalize(vN); float p = vPu.x; vec2 uv = vPu.yz;
      if (dot(n, V) < 0.) n = -n;
      vec3 alb = vCol; float gloss = 0., thin = 0.;
      float depth = tideH(vLp.xz) - vLp.y, dry = step(depth, 0.);
      if (p < 1.5) {                                                      // rock: strata, lichen, a dark weedy tide line
        float st = vn(vec2(vWp.y * 3.2 + vn(vWp.xz * .4) * 3., vWp.x * .2)), tl = smoothstep(.3, -1.2, vWp.y);
        alb *= .62 + .5 * st + .3 * vn(vWp.xz * 1.7);
        alb = mix(alb, vec3(.5, .52, .36), smoothstep(.62, .8, vn(vWp.xz * .9 + 3.)) * smoothstep(.2, .8, n.y) * .5);
        alb = mix(alb, vec3(.07, .12, .08) + .08 * st, tl * .85); gloss = .25 + .5 * tl;
      } else if (p < 2.5) {                                               // tower: white paint, rain streaks, door, small panes
        float a = uv.x, h = uv.y * 29.;
        alb *= .9 + .12 * vn(vec2(a * 60., h * .35)) - .1 * smoothstep(3., 0., h);
        float win = 0.;
        for (int i = 0; i < 3; i++) { float wy = 9. + float(i) * 7.5, wa = .25 + .09 * float(i); win = max(win, smoothstep(.014, .009, abs(fract(a - wa + .5) - .5)) * smoothstep(.75, .6, abs(h - wy))); }
        float door = smoothstep(.022, .018, abs(a - .22)) * smoothstep(3.4, 3.2, h);
        alb = mix(alb, vec3(.07, .1, .14), win); alb = mix(alb, vec3(.2, .3, .42), door);
        alb = mix(alb, vec3(.33, .43, .56), smoothstep(.25, .1, abs(h - 28.4)));
        gloss = .08 + .5 * win;
      } else if (p < 3.25) { gloss = .3; alb *= .85 + .3 * vn(vWp.xy * 2.); }
      else if (p < 3.75) { vec2 g = fract(vec2(uv.x * 40., uv.y)); if (g.x > .16 && uv.y < .86 && uv.y > .1) discard; gloss = .3; }
      else if (p < 4.5) { float mull = step(.86, fract(uv.x * 8.)); alb = mix(vec3(.1, .2, .24), vec3(.33, .43, .56), mull); gloss = 1. - .7 * mull; }
      else if (p < 5.5) { alb *= .8 + .4 * vn(vWp.xz * 6.); gloss = .35; }
      else if (p < 6.5) { alb *= .7 + .45 * step(.5, fract(vWp.y * 2.3 + vn(vWp.xz * 2.))); }
      else if (p < 7.5) {                                                 // frond: a midrib and combed leaflets
        float w = abs(uv.y - .5) * 2., lf = abs(fract(uv.x * 15. - w * 1.6) - .5);
        if (w > .07 && (lf > .3 || w > 1. - uv.x * uv.x * .5)) discard;
        alb *= .75 + .7 * w; thin = .6;
      } else if (p < 8.5 || (p > 15.5 && p < 16.5)) { alb *= .7 + .6 * vn(vec2(uv.x * 9., uv.y * 3. + vWp.x)); gloss = .5; thin = .3;
        if (abs(uv.y - .5) > .5 - .22 * vn(vec2(uv.x * 7., vWp.z))) discard; }
      else if (p < 10.5) { alb *= (.72 + .36 * vn(vec2(vWp.y * 5.5, dot(vWp.xz, vec2(.31, .29))))) * (.8 + .3 * step(.1, fract(vWp.y * 2.6))); gloss = .1 * dry; alb *= mix(.6, 1., smoothstep(-1.4, .6, vWp.y)); }
      else if (p < 11.5) { float s = vn(vec2(dot(vWp.xz, vec2(2.3, 1.7)), vWp.y * .8)); alb *= .7 + .45 * s; alb *= .9 + .14 * smoothstep(.3, .7, fract(vWp.y * 1.4)); }
      else if (p < 12.5) { alb *= .86 + .2 * vn(uv * vec2(5., 14.)); thin = .7; }
      else if (p < 13.5) { if (abs(uv.y - .5) < .38 && fract(uv.x * 9.) > .2) discard; }
      else if (p < 14.5) { alb *= .75 + .4 * vn(vWp.xz * 4.); gloss = .2; }
      else if (p < 15.5) { vec2 g = fract(uv * vec2(7., 3.)); if (g.x > .12 && g.y > .14 && !(g.y > .3 && g.x > .3 && g.x < .86)) discard; alb = mix(alb, vec3(.5, .52, .5), step(.3, g.y) * step(.3, g.x)); }
      float nlB = max(dot(n, uSun), 0.) * moonShade(vLp);                                  // warm bounce off the sand in the shadows
      vec3 ambB = mix(cSlate * .45, mix(cAqua, cIvory, .55) * .5, n.y * .5 + .5) + cIvory * .16 * (1. - n.y * .5) * dry;
      vec3 col = alb * (SUNC * nlB + ambB);
      col += alb * SUNC * thin * .6 * max(dot(-n, uSun), 0.) * moonShade(vLp);
      vec3 R = reflect(-V, n);
      float fres = pow(1. - max(dot(n, V), 0.), 4.);
      col = mix(col, skyCol(vec3(R.x, abs(R.y), R.z)), gloss * (.12 + .7 * fres) * dry);
      col += SUNC * pow(max(dot(R, uSun), 0.), 90.) * gloss * 5. * moonShade(vLp) * dry;
      col = underwater(col, vLp, V);
      gl_FragColor = vec4(fogMix(col), 1.);
    }`, { side: THREE.DoubleSide });
}

// ------------------------------------------------------------------------------------------------------
// The stilt village: 22 thatched houses on 6 m stilts to starboard, plank walkways, ladders that now end
// 3 m above the mud, fish-drying racks, laundry drawn upward, canoes hanging from their painters, weed.
// ------------------------------------------------------------------------------------------------------
async function makeVillage(W) {
  const rng = W.rng.fork('village'), parts = [];
  const wood = '#b9a384', pale = '#c2ad8a', dark = '#84705a', thatch = '#b89c68';
  for (const [x, z] of [[-3, -2.6], [3, -2.6], [-3, 2.6], [3, 2.6], [0, -2.6], [0, 2.6]]) parts.push(paint(new THREE.CylinderGeometry(0.13, 0.17, 7.4, 5), dark, 10, [x, 3.3, z], [0, 0, x * 0.012]));
  parts.push(paint(new THREE.BoxGeometry(0.1, 0.1, 7.6), dark, 10, [-3, 3.2, 0], [0.85, 0, 0]));
  parts.push(paint(new THREE.BoxGeometry(0.1, 0.1, 7.6), dark, 10, [3, 3.2, 0], [-0.85, 0, 0]));
  parts.push(paint(new THREE.BoxGeometry(7.2, 0.2, 6.2), pale, 10, [0, 6.1, 0]));
  parts.push(paint(new THREE.BoxGeometry(5.0, 2.3, 4.0), wood, 10, [-0.6, 7.35, -0.4]));
  parts.push(paint(new THREE.PlaneGeometry(0.9, 1.7), '#1c1a18', 10, [0.6, 7.1, 1.62]));                     // doorway
  parts.push(paint(new THREE.ConeGeometry(4.6, 2.9, 4, 2), thatch, 11, [-0.6, 9.9, -0.4], [0, Math.PI / 4, 0], [1, 1, 0.86]));
  parts.push(paint(new THREE.CylinderGeometry(0.16, 0.2, 1.1, 5), dark, 10, [-2.0, 10.3, -1.0]));           // smoke pipe
  parts.push(paint(new THREE.BoxGeometry(9.5, 0.12, 1.15), pale, 10, [8.3, 6.05, 0.4]));                     // walkway to the neighbour
  await W.ctx.yield();
  for (const x of [6.5, 11.5]) for (const z of [-0.1, 0.9]) parts.push(paint(new THREE.CylinderGeometry(0.09, 0.11, 6.6, 4), dark, 10, [x, 2.8, z]));
  parts.push(paint(new THREE.PlaneGeometry(3.1, 0.62), pale, 13, [-1.8, 4.5, 3.13], [0, 0, Math.PI / 2]));    // ladder, ends in mid air
  parts.push(paint(new THREE.PlaneGeometry(3.2, 1.7), pale, 15, [1.6, 7.15, -3.0]));                          // fish-drying rack
  for (let i = 0; i < 6; i++) {                                                                              // laundry on a line over the walkway
    const x = 5.2 + i * 1.15 + rng.range(-0.2, 0.2), h = rng.range(0.9, 1.5), c = ['#d9d6cc', '#7f93b4', '#3fa7a2', '#c9c6bd', '#9fb4cc', '#e4dccb'][i];
    parts.push(paint(ribbon([[x, 7.75, 1.0], [x + 0.1, 7.75 + h * 0.5, 1.1], [x + 0.25, 7.75 + h, 1.3]], () => 0.75, [1, 0, 0]), c, 12 + rng() * 0.4));
  }
  parts.push(paint(new THREE.BoxGeometry(7.6, 0.04, 0.04), '#5d5548', 10, [8, 7.75, 1.0]));
  for (const x of [4.3, 11.7]) parts.push(paint(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 4), dark, 10, [x, 6.95, 1.0]));
  parts.push(paint(new THREE.SphereGeometry(1, 7, 4), '#7d6a52', 14, [2.2, 2.7, 3.0], [0, 0.3, 1.15], [2.5, 0.34, 0.5]));   // canoe hanging nose-up
  parts.push(paint(new THREE.BoxGeometry(0.05, 1.5, 0.05), '#5d5548', 10, [3.0, 5.3, 3.0]));
  for (let i = 0; i < 6; i++) {                                                                              // weed on the stilts
    const sx = [-3, 3, 0][i % 3], sz = i < 3 ? -2.6 : 2.6, y0 = rng.range(1.6, 2.6), len = rng.range(1.0, 1.9), a = rng() * 6.28;
    parts.push(paint(ribbon([[sx + 0.16, y0, sz], [sx + 0.2, y0 - len * 0.5, sz + 0.05], [sx + 0.22, y0 - len, sz + 0.1]], (t) => 0.5 * (1 - t * 0.5), [Math.cos(a), 0, Math.sin(a)]), '#2c4a2a', 16 + rng() * 0.4));
  }
  await W.ctx.yield();
  const g = mergeParts(parts);
  const spots = [];
  for (let row = 0; row < 3; row++) for (let i = 0; i < 8 && spots.length < 22; i++) {
    const x = [22, 39, 57][row] + rng.range(-2.5, 3.5) + (row === 2 ? rng.range(0, 8) : 0), z = 1016 + i * 12.2 + rng.range(-2, 2) + row * 3.5;
    if (row === 1 && i === 3) continue;                               // a gap: the open water between the rows
    spots.push([x, z, (rng() < 0.75 ? Math.PI / 2 : -Math.PI / 2) + rng.range(-0.12, 0.12) + (rng() < 0.2 ? Math.PI / 2 : 0), rng.range(0.9, 1.12)]);
  }
  const mesh = new THREE.InstancedMesh(g, makeBuiltMaterial(W), spots.length), d = new THREE.Object3D();
  spots.forEach(([x, z, yaw, s], i) => {
    d.position.set(x, Math.min(W.bedH(x, z), W.bedH(x + 3, z + 3), W.bedH(x - 3, z - 3)) - 0.35, z); d.rotation.set(0, yaw, 0); d.scale.set(s, 1, s); d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
  });
  mesh.frustumCulled = false; W.scene.add(mesh);
  W.village = spots;
}

// ------------------------------------------------------------------------------------------------------
// Birds: stilt-legged waders picking over the pools (fourteen beside the path at the entry, and a party
// that lifts off as we pass), gulls round the lighthouse and over the slope, nine keeping pace with the
// lens on the climb.
// ------------------------------------------------------------------------------------------------------
async function makeBirds(W) {
  const { L, scene, path, sunDir } = W, rng = W.rng.fork('birds'), H = L.H;
  const sunC = new THREE.Color().setRGB(H.sunC[0], H.sunC[1], H.sunC[2]);
  const light = { sunDir, sunColor: sunC, sunIntensity: L.hourKey === 'night' ? 1.3 : 2.3, sky: new THREE.Color(H.pal[4]), skyIntensity: 0.95, ground: new THREE.Color(H.pal[2]), groundIntensity: 0.6 };
  const fauna = F.makeFauna(scene, { light, rng });
  await W.ctx.yield();
  const pelican = L.density > 1.12;                                     // some mornings it is a line of heavier birds
  const near = [];
  // a loose line across the pool, 13-24 m ahead of the lens at u 0.05 and 2.5-10 m to port, then a few stragglers behind
  for (let i = 0; i < 14; i++) {
    const jz = rng.range(-0.7, 0.7), jx = rng.range(-0.35, 0.35);
    const x = i < 10 ? -9.2 + i * 0.8 + jx : -11 + (i - 10) * 2.3 + jx, z = i < 10 ? 1218.5 - i * 1.05 + jz + (i % 2) * 1.6 : 1203 - (i - 10) * 2.2 + jz;
    near.push([x, W.bedH(x, z), z]);
  }
  const wcol = { body: '#ecece6', belly: '#f4f4f0', wing: '#d9d9d2', neckC: '#f0f0ea', cap: '#f0f0ea', beakC: '#2a2a30', legC: '#2e2a2c' };
  fauna.add(F.makeWaders({ rng, species: pelican ? 'heron' : 'egret', count: near.length, positions: near, size: 2.1, active: 0.8, heightAt: W.bedH, level: BED - 0.25, ...wcol }), { always: true });
  await W.ctx.yield();
  const far = [];
  for (let i = 0, t = 0; far.length < Math.round(46 * L.detail) && t < 900; t++) {
    const x = rng.range(-95, 95), z = rng.range(900, 1290), y = W.bedH(x, z);
    if (Math.abs(x) < 12 || y - BED > 0.1 || y - BED < -1.2) continue;
    far.push([x, y, z]);
  }
  fauna.add(F.makeWaders({ rng, species: 'egret', count: far.length, positions: far, size: 1.3, heightAt: W.bedH, level: BED - 0.25, ...wcol }));
  await W.ctx.yield();
  // the party that lifts off the flat as we pass, climbing toward the hill
  const fcol = { body: '#ecece6', belly: '#f4f4f0', wingC: '#e6e6e0', tip: '#17171b', trail: '#17171b', neckC: '#ecece6', head: '#ecece6', beak: '#33333a', legC: '#3a3436' };
  fauna.add(F.makeFlock({ rng, species: 'flamingos', count: 9, size: 0.85, form: 'loose', spread: [7, 2.5, 12], speed: 13,
    cross: { path, u: 0.085, lead: 21, angle: 18, side: -1, height: 0.5, span: 180, rise: 15, offset: -6, duration: 44 }, ...fcol }), { always: true });
  await W.ctx.yield();
  // nine gulls keep pace on the climb, 6 m off the lens to starboard
  fauna.add(F.makeFlock({ rng, species: 'gulls', count: 9, size: 1.15, spread: [2.6, 1.3, 5], along: { path, side: 4.2, up: 0.6, lead: 6.5, from: 0.46, to: 0.72, drift: 1.5 } }), { always: true });
  await W.ctx.yield();
  const g = (count, center, radius) => fauna.add(F.makeFlock({ rng, species: 'gulls', count: Math.max(4, Math.round(count * L.detail)), size: 1.15, center, radius, height: radius * 0.25 }), { range: 2600 });
  g(22, [-40, 30, 995], 46);
  await W.ctx.yield();
  g(26, [320, 150, 560], 95);
  await W.ctx.yield();
  g(26, [-250, 205, 330], 85);
  await W.ctx.yield();
  g(18, [70, 22, 1130], 60);
  W.updates.push((dt, time, camera, u) => fauna.update(dt, time, camera, u));
}

// ------------------------------------------------------------------------------------------------------
// RARE EVENT: at u 0.86 the peak and the sheet from the lowest crater meet, and for four seconds a single
// twisting rope of water 80 m tall joins sea and moon, bowed 30 m to port of the path, fish swimming up
// it, before it parts into beads. It rides with the hill (child of the hero object).
// ------------------------------------------------------------------------------------------------------
function makeRareRope(W) {
  const { hero } = W, V = (x, y, z) => new THREE.Vector3(x, y, z);
  const curve = new THREE.CatmullRomCurve3([V(0, 296, 0), V(-9, 305, 1), V(-22, 319, 3), V(-30, 340, 5), V(-28, 360, 3), V(-18, 377, 1), V(-8, 388, 0), V(-3, 394, 0)], false, 'centripetal');
  const g = new THREE.TubeGeometry(curve, 96, 1, 12, false);
  const uGrow = { value: 0 }, uBreak = { value: 0 };
  const SH = hero.uniforms, uni = THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  for (const k of ['uTime', 'uSun', 'uQuiv', 'SUNC', 'uSailW', 'uWind', 'cIvory', 'cSlate', 'cTurq', 'cDeep', 'cAqua', 'cWhite', 'cOrange']) uni[k] = SH[k];
  uni.uGrow = uGrow; uni.uBreak = uBreak;
  const rope = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: uni, fog: true, transparent: true, depthWrite: true,
    vertexShader: TIDE_GLSL + /* glsl */`
    #include <fog_pars_vertex>
    uniform float uGrow, uBreak; varying vec2 vUv; varying vec3 vN; varying vec3 vP; varying vec3 vC; varying float vR;
    void main(){
      float t = uv.x, a = uv.y * 6.2832;
      // the two fronts: the peak climbing, the sheet reaching down; they meet at t = 0.55
      float lo = smoothstep(uGrow * .56 + .001, uGrow * .56 - .12, t), hi = smoothstep(1. - uGrow * .46 - .001, 1. - uGrow * .46 + .12, t);
      float alive = max(lo, hi);
      float tw = sin(a * 2. + t * 34. - uTime * 2.2), strand = .78 + .3 * tw;
      float rad = (3.6 + 3.4 * exp(-t * 9.) + 4.4 * exp(-(1. - t) * 7.) + .5 * sin(t * 19. - uTime * 1.7)) * strand * alive;
      float bead = .5 + .5 * sin(t * 58. + uTime * 1.2);
      rad *= mix(1., smoothstep(.25, .8, bead) * 1.5, uBreak) * (1. - smoothstep(.6, 1., uBreak));
      vec3 c = position - normal;                                                  // centre line (tube radius 1)
      c.xz += vec2(sin(t * 9. + uTime * .8), cos(t * 7. - uTime * .7)) * 1.6 * sin(t * 3.1416) + uQuiv.xy * (1. - t);
      c.y += uBreak * uBreak * 26. * t;                                            // the beads go up, faster and faster
      vec3 lp = c + normal * rad;
      vUv = uv; vN = normalize(normal + vec3(0., .5 * cos(a * 2. + t * 34. - uTime * 2.2), 0.)); vP = lp; vR = rad;
      vC = (cameraPosition - modelMatrix[3].xyz);
      vec4 mvPosition = modelViewMatrix * vec4(lp, 1.);
      gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`,
    fragmentShader: TIDE_GLSL + /* glsl */`
    #include <fog_pars_fragment>
    uniform float uGrow, uBreak; varying vec2 vUv; varying vec3 vN; varying vec3 vP; varying vec3 vC; varying float vR;
    void main(){
      if (vR < .06) discard;
      vec3 V = normalize(vC - vP), n = normalize(vN);
      float nv = max(dot(n, V), 0.), fres = pow(1. - nv, 3.);
      vec3 R = reflect(-V, n), Rf = refract(-V, n, .75);
      vec3 body = mix(cTurq * .9, cDeep * 1.05, nv * nv) * (.55 + .5 * max(dot(n, uSun), 0.));
      body = mix(body, skyCol(vec3(-Rf.x, abs(Rf.y), -Rf.z)), .16);                 // a lens: the far sky, upside down
      float t = vUv.x, a = vUv.y;
      float streak = vn(vec2(a * 14., t * 60. - uTime * 3.)); body += cAqua * .25 * smoothstep(.55, .9, streak);
      // fish swimming up it: silver dashes in cells that climb
      vec2 fc = vec2(a * 7., t * 46. - uTime * 2.6), fi = floor(fc), ff = fract(fc) - .5; float fh = h21(fi);
      float fish = smoothstep(.12, .04, abs(ff.x - (fh - .5) * .5 + .08 * sin(ff.y * 9. + uTime * 9.))) * smoothstep(.42, .2, abs(ff.y)) * step(.5, fh);
      body = mix(body, cWhite * (.5 + .7 * h21(fi + 3.)), fish * (1. - fres) * (1. - uBreak));
      vec3 col = mix(body, skyCol(vec3(R.x, abs(R.y), R.z)) * 1.05 + cWhite * .25, fres * fres * .9);
      col += SUNC * pow(max(dot(R, uSun), 0.), 70.) * 5.;
      #ifdef USE_FOG
      col = mix(col, fogColor, 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth));
      #endif
      gl_FragColor = vec4(col, .93);
    }` }));
  rope.frustumCulled = false; rope.renderOrder = 5; rope.visible = false;
  hero.object.add(rope);
  const sm = THREE.MathUtils.smoothstep;
  W.updates.push((dt, time, camera, u) => {
    uGrow.value = sm(u, 0.74, 0.86); uBreak.value = sm(u, 0.945, 0.995);
    rope.visible = u > 0.735;
  });
}

// ------------------------------------------------------------------------------------------------------
// Soft ribbons: chimney smoke drawn upward toward the moon, and (squall weather) one dark cloud whose
// rain shaft bends toward the moon instead of reaching the sea.
// ------------------------------------------------------------------------------------------------------
function softRibbonMaterial(W, color, alpha, speed, streaks) {
  return W.mk(/* glsl */`
    varying vec2 vUv;
    void main(){ vec3 wp = position; vUv = uv;
      wp.xz += uv.x * uv.x * ${streaks ? '6.' : '1.2'} * vec2(sin(uTime * .5 + position.y * .05), cos(uTime * .4 + position.y * .04));
      ${W_VEND} }`, /* glsl */`
    varying vec2 vUv; uniform vec3 uCol; uniform vec3 uPar;
    void main(){
      float t = vUv.x, w = abs(vUv.y - .5) * 2.;
      float nz = ${streaks ? 'vn(vec2(vUv.y * 46., t * 5. - uTime * uPar.y)) * .7 + vn(vec2(vUv.y * 13., t * 2.5 - uTime * uPar.y * .7)) * .5' : 'vn(vec2(vUv.y * 2.5 + 3., t * 5. - uTime * uPar.y)) * .8 + vn(vec2(vUv.y * 6., t * 11. - uTime * uPar.y * 1.4)) * .4'};
      float a = uPar.x * smoothstep(1., ${streaks ? '.25' : '.1'}, w + (nz - .5) * .7) * smoothstep(0., .08, t) * smoothstep(1., ${streaks ? '.6' : '.3'}, t) * (.35 + .9 * nz);
      vec3 col = uCol * (SUNC * (.55 + .45 * moonShade(vLp)) + cAqua * .35);
      gl_FragColor = vec4(fogMix(col), clamp(a, 0., 1.));
    }`, { transparent: true, depthWrite: false, side: THREE.DoubleSide }, { uCol: { value: new THREE.Color(color) }, uPar: { value: new THREE.Vector3(alpha, speed, 0) } });
}
function makeSmoke(W) {
  const parts = [], rng = W.rng.fork('smoke');
  for (let i = 0; i < W.village.length; i += 3) {
    const [x, z] = W.village[i], y0 = BED + 10.6, pts = [], dx = -x / Math.hypot(x, z - CZ0) , dz = -(z - CZ0) / Math.hypot(x, z - CZ0);
    const lean = rng.range(0.5, 1.1);
    for (let k = 0; k <= 9; k++) { const t = k / 9, h = 17 * t; pts.push([x - 1.2 + dx * h * h * 0.03 * lean, y0 + h, z + dz * h * h * 0.03 * lean]); }
    parts.push(ribbon(pts, (t) => 0.5 + 3.2 * t, [-dz, 0, dx]));
  }
  if (!parts.length) return;
  for (const g of parts) { g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3)); g.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count), 1)); }
  const m = new THREE.Mesh(mergeParts(parts), softRibbonMaterial(W, '#d8d4cc', 0.42, 0.55, false));
  m.frustumCulled = false; m.renderOrder = 6; W.scene.add(m);
}
async function makeSquall(W) {
  const { sky, scene, rng } = W, cx = 820, cz = 300, base = 235;
  const dark = makeCloudField({ rng, sky, at: [[cx, base, cz, 440], [cx + 210, base + 20, cz - 160, 320], [cx - 60, base + 10, cz + 170, 260]], puffs: 34, height: 0.62, opacity: 0.92,
    litColor: '#aeb6c4', shadeColor: '#56607a', bottomColor: '#3e4862', wind: [-1.5, 0, 1.0] });
  scene.add(dark.object);
  W.updates.push((dt, time, camera) => dark.update(dt, time, camera));
  await W.ctx.yield();
  // the rain shaft: falls, then hooks inward and upward toward the moon and thins away
  const parts = [], ax = -cx, az = (CZ0 * 0.45) - cz, al = Math.hypot(ax, az), ix = ax / al, iz = az / al;
  for (const [off, wid] of [[0, 190], [70, 130], [-80, 150]]) {
    const pts = [];
    for (let k = 0; k <= 16; k++) { const t = k / 16, inw = 270 * Math.pow(t, 2.4); pts.push([cx - iz * off + ix * inw, base + 10 - 300 * t + 190 * t * t * t, cz + ix * off + iz * inw]); }
    const g = ribbon(pts, () => wid, [-iz, 0, ix]);
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3)); g.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count), 1));
    parts.push(g);
  }
  const m = new THREE.Mesh(mergeParts(parts), softRibbonMaterial(W, '#7f8ca6', 0.5, 0.9, true));
  m.frustumCulled = false; m.renderOrder = 6; scene.add(m);
}
