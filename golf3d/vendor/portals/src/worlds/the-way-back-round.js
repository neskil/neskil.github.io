// THE SKY IS THE FAR SIDE (the-way-back-round)
// A universe so small that light goes all the way round it: one island, one enormous blossoming tree, and
// the pale thing filling the sky ahead is the back of that same island, mirrored, shrinking as we approach
// until we arrive where we left with everything on the other hand.
//
// The island SET (tree, rock, pavilion, skiff, petals, cranes, its far image and both reflections) is the
// hero in ../parts/the-way-back-round.js. This file lays the universe round it: the pearl dome (with the
// ghost of the next lap, and on a rare visit a second, paler Sky-Tree behind the first), the slate water
// with strider rings, rain and combed petal streaks, the line of fishing stakes that runs all the way
// round, petal rafts, ferns, irises, reeds and saplings on the rock, mist, finches, and the flight.
//
// AXES: +Z north (flight), EAST IS -X, y 0 = water. Island A at the origin, island B at z = +LAP, mirrored.
import * as THREE from 'three';
import { makePath, smoothstep, lerp, clamp } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero } from '../parts/the-way-back-round.js';

const LAP = 1600;
const TAU = Math.PI * 2;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const fract = (x) => x - Math.floor(x);

// seasons: [pearl, petal rim, white, slate, charcoal, gold (the sail), mint] + blossom throat, leaf, water
const SEASONS = {
  blossom: { name: 'blossom', pal: ['#EAF2F5', '#F6B8C8', '#FFFFFF', '#5C7F8A', '#2C3E46', '#E9C46A', '#A7D8D0'], throat: '#FFFFFF', leaf: null, leafAmt: 0, raft: '#F3C3CF', raft2: '#FFFFFF', lane: '#EE8FAB' },
  pear: { name: 'pear', pal: ['#EAF2F5', '#EEF3D6', '#FFFFFF', '#5C7F8A', '#2C3E46', '#C9CC62', '#A7D8D0'], throat: '#FFFFFF', leaf: '#86C24E', leafAmt: 0.42, raft: '#F2F4E6', raft2: '#B9D88E', lane: '#E9F2B4' },
  autumn: { name: 'autumn', pal: ['#EAF2F5', '#D8822E', '#FFFFFF', '#5C7F8A', '#25333B', '#E9C46A', '#A9C9A6'], throat: '#F0B648', leaf: '#9A3E22', leafAmt: 0.28, raft: '#D8822E', raft2: '#A8472A', lane: '#E0701E' },
};
// air: dome at the waterline, overhead, the far image's wash, fog density, light tint
const AIRS = {
  clear: { name: 'clear', low: '#EAF2F5', high: '#C9DCDD', wash: '#E2EAEE', fog: 0.00150, rain: 0, sky: '#EAF2F5' },
  rain: { name: 'rain', low: '#C9D5D9', high: '#9DB1B8', wash: '#A9B9BF', fog: 0.0023, rain: 1, sky: '#D0DCE0' },
  dusk: { name: 'dusk', low: '#EFD3D4', high: '#D6B9C6', wash: '#EFD6D0', fog: 0.00150, rain: 0, sky: '#EFD2D2' },
};

export default {
  id: 'the-way-back-round',
  name: 'The Sky Is the Far Side',
  category: 'bizarre',
  weirdness: 1,
  media: ['air', 'water'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    // ---- this visit ----
    const season = SEASONS[rng.pick(['blossom', 'blossom', 'pear', 'autumn'])];
    let airKey = rng.pick(['clear', 'clear', 'rain', 'dusk']);
    if (vary.hour === 'day') airKey = airKey === 'dusk' ? 'clear' : airKey;
    if (vary.hour === 'golden' || vary.hour === 'dawn' || vary.hour === 'night') airKey = 'dusk';
    const air = AIRS[airKey];
    const bigS = rng.pick([24, 24, 14, 36]);
    const birds = airKey === 'dusk' ? rng.pick(['egret', 'crane']) : rng.pick(['crane', 'crane', 'crane']);   // white egrets only against the rose dome
    const rare = !!vary.rare;
    const pal = season.pal.slice(); pal[0] = air.sky;
    const C = (h) => new THREE.Color(h);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(C(air.low), air.fog);
    await ctx.yield();

    // ---- the island set, its far image and reflections ----
    const hero = await buildHero(ctx, { palette: pal, detail, lap: LAP, bigS, water: false, birds, wash: 0.42,
      petalB: season.throat, leaf: season.leaf, leafAmount: season.leafAmt });
    scene.add(hero.object);
    hero.uniforms.uWashCol.value.set(air.wash);
    const A = hero.anchors, hAt = hero.heightAt;
    await ctx.yield();

    // ---- the flight: out under the crown, up over open water, down, and in under the same boughs ----
    const seat = A.portalSeat.position;
    // Out through the root arch (the one that holds the ring on island B) and under the crown, low over the
    // open water so that stakes, petal rafts and the inverted giant fill the lower frame, then a swing out to
    // port so the pavilion and the gold sail stand beside the ring as we come in, and a straight run to it.
    const pts = [
      ...A.flyOut.map((p, i) => [p.x, p.y + (i === 0 ? 1 : i === 1 ? 1.5 : i === 2 ? 0.5 : 0), p.z]),
      [-6, 22.5, 420], [-1, 17, 600], [3, 14, 780], [8, 12.6, 930], [14, 11.8, 1065], [19, 11.5, 1170],
      [30, 11.5, 1280], [41, 11, 1370], [38, 10.5, 1430], [30.5, 10, 1478], [26.6, 9.7, 1503],
      [seat.x, seat.y + 0.3, seat.z - 30], [seat.x, seat.y, seat.z],
    ];
    const path = makePath(pts);
    // the cranes' way home: they leave the island to meet us at u 0.66, turn about us to port at u 0.7 and
    // fly in ahead of us, a little to port, until they come down in the southern shallows
    {
      const cc = hero.craneCourse(), keys = [], way = [], L = path.length;
      const add = (k, v) => { keys.push(k); way.push(v); };
      // the rise: out of the shallows and up along our own line, 34 m ahead of the lens (the last bird 17 m),
      // climbing through the middle of the frame against the far trunk, then peeling away east
      const lead = (u, ahead, stbd, up) => { const q = path.pointAt(clamp(u + ahead / L, 0, 1), V3()); return V3(q.x - stbd, q.y + up, q.z); };
      add(0.075, cc.at(cc.keys[0], V3()));
      add(0.088, lead(0.088, 36, 8, 0)); add(0.102, lead(0.102, 31, -4, 7.5)); add(0.117, lead(0.117, 31, -12, 10.5)); add(0.132, lead(0.132, 40, -10, 13));
      add(0.149, lead(0.149, 54, 16, 14)); add(0.168, lead(0.168, 60, 50, 15));
      // round the east of the island and low across the water south of its tip at u 0.25: in the mirrored giant
      // that is twenty set metres in front of the lens, so the giant cranes cross ahead of us against the trunk
      add(0.19, V3(-106, 30, 190)); add(0.21, V3(-104, 22, 40)); add(0.228, V3(-62, 11, -62)); add(0.25, V3(0, 8, -82)); add(0.272, V3(62, 12, -60));
      add(0.30, V3(100, 26, 20));
      for (const k of cc.keys) if (k > 0.33 && k < 0.5) add(k, cc.at(k, V3()));
      for (let i = keys.length - 1; i >= 0 && keys[i] > 0.38; i--) { keys.pop(); way.pop(); }
      // ...then they leave the island and come out over the water to meet us, wheel about off our port bow at
      // u 0.44 and fly in beside us all the way to the southern shallows. Their places are given from the lens in
      // the far image's own set metres (ahead along our course, to port, above), so while the image is still
      // shrinking they are giants far off that hold their size in the frame, and from u 0.68 they are birds
      const toSet = (u, ahead, port, up) => {
        const q = path.pointAt(u, V3()), im = hero.imageAt(u, q.z), w = path.pointAt(clamp(u + ahead * im.S / L, 0, 1), V3());
        return V3(-w.x / im.S - port, q.y / im.S + up, (w.z - im.z) / im.S);
      };
      add(0.405, toSet(0.405, 150, 40, 12));
      add(0.44, toSet(0.44, 17, 11, -0.4)); add(0.47, toSet(0.47, 16, 10.5, -0.8)); add(0.50, toSet(0.50, 16, 10.5, -1)); add(0.53, toSet(0.53, 16, 10.5, -1)); add(0.56, toSet(0.56, 16, 10.5, -1.2)); add(0.60, toSet(0.60, 18, 10.5, -1.2));
      add(0.64, toSet(0.64, 26, 10.5, -1.2)); add(0.68, toSet(0.68, 35, 10, -1.2));
      for (const k of [0.72, 0.76, 0.80, 0.84]) add(k, toSet(k, 36, 9.5, -1.2));
      add(0.88, toSet(0.88, 36, 11, -2.5));
      add(0.93, V3(-36, 1, -68));
      hero.setCraneCourse(keys, way);
    }
    // ---- the dome: even pearl, nowhere for a sun to be. It also carries the ghosts: the next lap's tree
    // in the last tenth, and on a rare visit a second, paler Sky-Tree twice the size behind the first ----
    const NOISE = /* glsl */`
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y); }
`;
    const deep = C(season.pal[4]).multiplyScalar(0.92);
    const domeU = {
      uLow: { value: C(air.low) }, uHigh: { value: C(air.high) }, uDeep: { value: deep.clone().lerp(C(air.low), 0.12) },
      uTree: { value: C(season.pal[3]).lerp(C(season.pal[1]), 0.22).lerp(C(air.high), 0.2) }, uTime: { value: 0 },
      uCrown: { value: C(season.pal[1]).lerp(C(season.leaf || season.pal[1]), 0.5).multiplyScalar(0.8).lerp(C(air.high), 0.2) },
      uA: { value: 80 }, uOff: { value: new THREE.Vector2() }, uRare: { value: 0 }, uGhost: { value: 0 }, uRk: { value: 2 },
    };
    const dome = new THREE.Mesh(new THREE.SphereGeometry(8000, 48, 24), new THREE.ShaderMaterial({
      uniforms: domeU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
      vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: NOISE + /* glsl */`
uniform vec3 uLow, uHigh, uDeep, uTree, uCrown; uniform float uTime, uA, uRare, uGhost, uRk; uniform vec2 uOff; varying vec3 vD;
// a blossom tree in set metres (x across, y up): flared trunk, ragged cauliflower crown. x = cover, y = trunk
float lobe(vec2 s, vec2 c, vec2 r, float n){ return smoothstep(1.03, 0.93, length((s - c) / r) + n); }
vec2 tree(vec2 s){
  // cauliflower edges: big lobes, then scallops, drifting a very little
  float n = (vnoise(s * 0.045 + 3.) - 0.5) * 0.2 + (vnoise(s * 0.13 + uTime * 0.01) - 0.5) * 0.16 + (vnoise(s * 0.37 + 7.) - 0.5) * 0.09;
  // two tiers and a top, as the real crown has, and under them a ragged hem of hanging blossom
  float hem = 5. * sin(s.x * 0.33) * sin(s.x * 0.071 + 1.);
  float low = max(lobe(s, vec2(0., 54. + hem * 0.4), vec2(64., 21.), n), max(lobe(s, vec2(-47., 45. + hem), vec2(23., 14.), n), lobe(s, vec2(48., 47. + hem), vec2(22., 14.), n)));
  float high = max(lobe(s, vec2(6., 88.), vec2(40., 19.), n), lobe(s, vec2(-5., 108.), vec2(22., 12.), n));
  float gar = smoothstep(0.5, 0.64, vnoise(vec2(s.x * 0.5, 1.7))) * smoothstep(24. + 10. * vnoise(vec2(s.x * 0.23, 9.)), 33., s.y) * step(s.y, 46.) * smoothstep(66., 54., abs(s.x));
  float crown = max(max(low, high), gar * 0.85);
  // the notch between the tiers, where the boughs show
  float w = 5.5 + 12. * exp(-max(s.y, 0.) / 6.);
  float trunk = smoothstep(w + 0.8, w - 0.8, abs(s.x + 2. * sin(s.y * 0.05))) * step(0., s.y) * smoothstep(100., 80., s.y);
  float bough = smoothstep(3.6, 1.6, abs(s.y - 33. - abs(s.x) * 0.5 - 3. * sin(s.x * 0.12))) * smoothstep(52., 34., abs(s.x));
  bough = max(bough, smoothstep(2.6, 1.2, abs(s.y - 62. - abs(s.x - 3.) * 0.75)) * smoothstep(34., 20., abs(s.x - 3.)));
  // a root arch standing in the shallows on one flank, and the low back of the rock
  vec2 ac = (s - vec2(-30., 0.5)) / vec2(11., 15.);
  float arch = smoothstep(0.16, 0.08, abs(length(ac) - 1.)) * step(0., s.y);
  float rock = smoothstep(0.5, -0.5, s.y - 5. * exp(-s.x * s.x / 2600.) + (n - 0.2) * 4.) * step(0., s.y);
  float wood = max(max(trunk, bough), max(arch, rock * 0.8));
  float skin = 0.8 + 0.2 * smoothstep(0.3, 0.7, vnoise(s * 0.07 + 9.));
  return vec2(max(crown * skin, wood), wood * (1. - crown * 0.75));
}
void main(){
  vec3 d = normalize(vD + vec3(0., 1e-3, 0.));
  vec3 col = mix(uLow, uHigh, smoothstep(0.0, 0.85, d.y));
  // under the horizon the dome is the sky again, upside down, going to slate straight down: the water sheet
  // lies over it nearly clear at a glance, so the reflected tree stands in a reflected sky
  vec3 mir = mix(uLow, uHigh, smoothstep(0.0, 0.85, -d.y)) * 0.9;
  col = mix(col, mix(mir, uDeep, smoothstep(0.1, 0.5, -d.y)), smoothstep(0.0, -0.012, d.y));
  float fwd = smoothstep(0.08, 0.3, d.z) * smoothstep(-0.01, 0.02, d.y);
  vec2 dir = d.xy / max(d.z, 0.05);
  if (uRare > 0.002) {                      // two laps of light: twice the size, paler still, and off to starboard
    // of the first, so its trunk, a bough and a tier of its crown stand clear of the nearer tree; mirrored in the sea
    float fw2 = smoothstep(0.08, 0.3, d.z) * mix(0.5, 1., smoothstep(-0.004, 0.004, d.y)) * smoothstep(0.0, 0.012, abs(d.y));
    vec2 t = tree((vec2(-1., 1.) * (vec2(dir.x, abs(dir.y)) * uA + uOff) - vec2(74., 0.)) / uRk);
    col = mix(col, uCrown, fw2 * uRare * 0.78 * t.x * (1. - t.y));
    col = mix(col, uTree, fw2 * uRare * 0.7 * t.y);
  }
  if (uGhost > 0.002) {                     // the next time round, already waiting
    vec2 t = tree(dir * 86. + vec2(26., 10.));
    col = mix(col, uTree, fwd * uGhost * (0.1 * t.x + 0.05 * t.y));
  }
  gl_FragColor = vec4(col, 1.);
}`,
    }));
    dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);
    await ctx.yield();
    // ---- the water: one transparent sheet over the reflections. Slate straight down, the dome at a glance;
    // strider rings, rain, and fallen petals combed into long curved streaks by a current we never see ----
    const HU = hero.uniforms;
    // the island's height baked for the water, which softens its own shore: x -60..60, z -80..220, about 1 m a texel
    const HT = { nx: 128, nz: 320 }, htData = new Uint8Array(HT.nx * HT.nz * 4);
    for (let j = 0; j < HT.nz; j++) {
      for (let i = 0; i < HT.nx; i++) {
        const v = Math.round(clamp((hAt(-60 + 120 * (i + 0.5) / HT.nx, -80 + 300 * (j + 0.5) / HT.nz) + 3) / 13, 0, 1) * 255), o = (j * HT.nx + i) * 4;
        htData[o] = htData[o + 1] = htData[o + 2] = v; htData[o + 3] = 255;
      }
      if (j % 32 === 31) await ctx.yield();
    }
    const heightTex = new THREE.DataTexture(htData, HT.nx, HT.nz, THREE.RGBAFormat);
    heightTex.magFilter = heightTex.minFilter = THREE.LinearFilter; heightTex.generateMipmaps = false; heightTex.colorSpace = THREE.NoColorSpace; heightTex.needsUpdate = true;
    const waterU = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
      uDeep: { value: deep }, uLow: { value: C(air.low) }, uHigh: { value: C(air.high) },
      uRaft: { value: C(season.raft) }, uRaft2: { value: C(season.raft2) }, uTime: HU.uTime,
      uRain: { value: air.rain }, uShade: HU.uShade, uB: { value: 0 }, uPetals: { value: clamp(density, 0.7, 1.3) },
      uLane: { value: C(season.lane) }, uHt: { value: heightTex }, uShore: { value: 1 },
    });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(18000, 18000, 96, 96), new THREE.ShaderMaterial({
      uniforms: waterU, transparent: true, depthWrite: false, fog: true,
      vertexShader: /* glsl */`#include <fog_pars_vertex>
varying vec3 vW;
void main(){ vW = (modelMatrix * vec4(position, 1.)).xyz; vec4 mvPosition = viewMatrix * vec4(vW, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
      fragmentShader: NOISE + /* glsl */`#include <fog_pars_fragment>
uniform vec3 uDeep, uLow, uHigh, uRaft, uRaft2, uLane; uniform float uTime, uRain, uB, uPetals, uShore; uniform vec4 uShade[12]; uniform sampler2D uHt; varying vec3 vW;
// petal lanes: four long rafts combed along our course by a current we never see. They wander and braid, so
// from the air they are curved streaks that sweep from under the lens away toward the island
float lanes(vec2 p){
  float z = p.y, n = (vnoise(p * 0.035 + 3.) - 0.5) * 8. + (vnoise(p * 0.19 + 8.) - 0.5) * 3.2, acc = 0.;
  float mid = -10. + (z - 400.) * 0.045;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float c = mid + (fi - 1.5) * 36. + 16. * sin(z * (0.0118 + 0.0021 * fi) + fi * 2.4) + 5. * sin(z * 0.031 + fi * 1.7);
    float wd = 3.4 + 1.8 * sin(z * 0.017 + fi * 4.1);
    float gap = 0.6 + 0.4 * smoothstep(0.2, 0.6, vnoise(vec2(z * 0.009 + fi * 13., fi * 7.)));
    acc = max(acc, smoothstep(wd * 1.25, 0., abs(p.x - c) + n) * gap);
  }
  return acc * smoothstep(210., 300., z) * (1. - smoothstep(1500., 1560., z));
}
// one family of rings: cells of size c, a drop every per seconds in a share of them, growing to rmax
float rings(vec2 p, float c, float per, float rmax, float share, float wid){
  vec2 g = p / c, id = floor(g); float h = hash21(id), h2 = hash21(id + 31.7);
  vec2 o = (id + 0.25 + 0.5 * vec2(h, h2)) * c;
  float age = fract(uTime / per + h * 7.), r = length(p - o);
  float k = smoothstep(wid, 0., abs(r - age * rmax)) + 0.5 * smoothstep(wid, 0., abs(r - age * rmax * 0.6));
  return k * (1. - age) * (1. - age) * step(1. - share, h2);
}
void main(){
  vec3 v = cameraPosition - vW; float dist = length(v); v /= max(dist, 1e-3);
  vec2 p = vW.xz; float near = 1. - smoothstep(60., 260., dist);
  float r1 = vnoise(p * 0.3 + uTime * vec2(0.11, 0.07)), r2 = vnoise(p * 1.9 - uTime * vec2(0.23, 0.15));
  float r3 = vnoise(vec2(p.x * 0.05 + uTime * 0.05, p.y * 0.4 - uTime * 0.3));
  float rip = (r1 - 0.5) + 0.45 * (r2 - 0.5) * near + 0.8 * (r3 - 0.5);
  float ring = rings(p, 9., 5., 3.4, 0.5, 0.16) * near + rings(p + 4.3, 5., 3.6, 2.2, 0.35, 0.12) * near;
  ring += uRain * (rings(p, 1.1, 1.3, 0.55, 1., 0.07) + rings(p + 0.6, 0.7, 0.9, 0.34, 0.8, 0.05)) * (1. - smoothstep(30., 150., dist));
  ring += uRain * 0.8 * rings(p + 2.1, 3.4, 1.5, 1.7, 0.9, 0.3) * smoothstep(20., 70., dist) * (1. - smoothstep(160., 420., dist));
  // rain takes the mirror off the sea: a matte, stippled skin out to the middle distance, in drifting squalls
  float squall = uRain * (0.45 + 0.55 * vnoise(p * 0.013 + uTime * vec2(0.05, 0.11)));
  float stip = step(0.74, vnoise(vec2(p.x * 2.3, p.y * 0.55) + uTime * vec2(1.3, 2.9))) * smoothstep(12., 80., dist) * (1. - smoothstep(280., 620., dist)) * squall;
  float f = 1. - clamp(abs(v.y) + rip * 0.15 + ring * 0.16 + squall * 0.045, 0., 1.); f = f * f * f;
  // the island's own height, baked: its shallows take the mirror off too, so the shore is soft
  vec2 hq = vec2(mix(p.x, -p.x, uB), p.y - uB * ${LAP.toFixed(1)});
  float hI = mix(-3., texture2D(uHt, clamp((hq - vec2(-60., -80.)) / vec2(120., 300.), 0., 1.)).r * 13. - 3., uShore);
  float shal = smoothstep(-2.55, 0.1, hI + (r2 - 0.5) * 0.6 + (r1 - 0.5) * 0.5), rim = smoothstep(-1.5, -0.85, hI + (r1 - 0.5) * 0.7) * (1. - smoothstep(-0.4, -0.12, hI));
  // the tree's shade lies on the water too (island A, or island B once we are across)
  vec3 q = vec3(mix(p.x, -p.x, uB), 0., p.y - uB * ${LAP.toFixed(1)}); float o = 0.;
  for (int i = 0; i < 12; i++) { vec4 s = uShade[i]; vec2 dd = (q.xz - s.xz) / max(s.w, 1.); o += smoothstep(-2., 14., s.y) * exp(-dot(dd, dd) * 1.5); }
  float shade = mix(1., 0.5, clamp(o * 0.85, 0., 1.));
  vec3 skyc = mix(uLow, uHigh, 0.25) * 0.9;
  vec3 col = mix(uDeep * (0.8 + 0.3 * r1 + 0.25 * r3), skyc, f) + ring * 0.12 * uLow + uRain * 0.03 * uLow * (1. - near) + stip * 0.085 * uLow;
  float alpha = mix(0.62, 0.2, f) + ring * 0.12 + (r3 - 0.5) * 0.3 + (r1 - 0.5) * 0.12 + stip * 0.2 + squall * 0.1;   // ripples break the mirror
  // wet shallows: darker, less clear, so the rock goes under without an edge
  col = mix(col, mix(uDeep, skyc, 0.3) * (0.62 + 0.3 * r2) + skyc * 0.12 * f, shal * shal * 0.5); alpha = mix(alpha, 0.94, shal * shal);
  // petals: streaks along a slow warped current, each petal an oval in its own 0.4 m cell
  // (the current wanders: streaks lie across our course at an angle and bend, never straight down it)
  vec2 w = p + 26. * vec2(vnoise(p * 0.011), vnoise(p * 0.011 + 7.3)) + 110. * vec2(vnoise(p * 0.0034 + 2.), vnoise(p * 0.0034 + 9.1));
  w = vec2(0.86 * w.x + 0.51 * w.y, -0.51 * w.x + 0.86 * w.y);
  float band = vnoise(vec2(w.x * 0.075, w.y * 0.0065) + 5.) * 0.65 + vnoise(vec2(w.x * 0.21, w.y * 0.017) + 11.) * 0.35;
  float isl = exp(-length(vec2(p.x, min(p.y + 40., 0.) + max(p.y - 180., 0.)) * vec2(1., 0.6)) / 150.) + exp(-length(vec2(p.x, min(p.y - 1540., 0.) + max(p.y - 1780., 0.)) * vec2(1., 0.6)) / 150.);
  float lane = lanes(p);
  float amt = (max(smoothstep(0.44, 0.66, band - 0.12 * isl) * 0.5, lane) + 0.035 + 0.22 * isl + rim * (0.35 + 0.6 * r1)) * uPetals;
  vec2 g = (p + 1.6 * vec2(vnoise(p * 0.37 + uTime * 0.02), vnoise(p * 0.37 + 3.1)) + 0.5 * vec2(vnoise(p * 1.3), vnoise(p * 1.3 + 8.))) / 0.42, id = floor(g), fr = fract(g) - 0.5;
  float h = hash21(id); fr += (vec2(hash21(id + 3.), hash21(id + 9.)) - 0.5) * 0.5;
  float a = h * 6.283 + uTime * 0.12 * (h - 0.5), ca = cos(a), sa = sin(a);
  vec2 e = vec2(ca * fr.x + sa * fr.y, -sa * fr.x + ca * fr.y) * vec2(1., 1.5 + 0.8 * fract(h * 5.7));
  float one = smoothstep(0.3, 0.22, length(e) * (0.8 + 0.6 * fract(h * 11.3))) * step(fract(h * 17.3), amt);
  float fw = max(fwidth(g.x), fwidth(g.y)), blur = smoothstep(0.3, 1.1, fw);
  float cover = mix(one, min(amt * (0.62 + 0.42 * vnoise(p * vec2(0.33, 0.12) + 4.)), 0.88), blur);     // rafts in clumps, not paint
  vec3 pc = mix(uRaft, uRaft2, step(0.62, fract(h * 7.3)) * (1. - blur) + 0.3 * blur) * (0.74 + 0.2 * fract(h * 3.1)) * uLow;
  pc = mix(pc, uLane * (0.8 + 0.25 * r1) * uLow, blur * 0.85 + 0.25 * (1. - blur) * step(fract(h * 23.7), 0.5));    // massed petals show their colour
  // the pearl comes and goes on the slow swell: dapples of sky that drift
  float dap = vnoise(vec2(p.x * 0.045, p.y * 0.2) + uTime * vec2(0.08, 0.3)) * vnoise(vec2(p.x * 0.1, p.y * 0.46) - uTime * vec2(0.12, 0.36));
  float dk = smoothstep(0.16, 0.62, dap) * (1. - smoothstep(250., 700., dist));
  col = mix(col, skyc, dk * 0.24); alpha += dk * 0.05;
  // cat's paws: far off, where the water is a mirror, a breath of air shows as a darker band crossing it
  float gust = smoothstep(0.42, 0.68, vnoise(vec2(p.x * 0.011 + uTime * 0.1, p.y * 0.028 - uTime * 0.36)) * 0.7 + 0.3 * vnoise(p * 0.09 + uTime * vec2(0.3, -0.5)));
  float gk = gust * (0.35 + 0.65 * f) * smoothstep(40., 160., dist) * (1. - smoothstep(800., 1500., dist));
  col = mix(col, uDeep * 1.1, gk * 0.85); alpha += gk * 0.36;
  col = mix(col, pc, cover); alpha = mix(alpha, 0.96, cover);
  col *= shade;
  gl_FragColor = vec4(col, clamp(alpha, 0., 1.));
  #include <fog_fragment>
}`,
    }));
    water.rotation.x = -Math.PI / 2; water.position.set(0, 0, LAP / 2); water.renderOrder = 2; water.frustumCulled = false; scene.add(water);
    await ctx.yield();
    // ---- what grows on the set: ferns, irises, reeds, blossoming saplings and the hanging garlands of the
    // crown's underside. One merged geometry drawn by island A and by the far image (so the giant has them
    // too, mirrored). kinds: 0 fern frond, 1 iris, 2 reeds, 3 blossom spray (billboard), 5 sapling stem ----
    const G = { pos: [], q: [], k: [], idx: [], n: 0 };
    const vert = (x, y, z, qu, qv, half, seed, kind, sway, tone, cell) => { G.pos.push(x, y, z); G.q.push(qu, qv, half, seed); G.k.push(kind, sway, tone, cell); return G.n++; };
    // a ribbon standing on a spine of points; `side` is the half-width direction, sway grows with v
    const ribbon = (spine, side, halfW, seed, kind, sway, tone) => {
      const base = G.n, m = spine.length - 1;
      for (let i = 0; i <= m; i++) {
        const p = spine[i], v = i / m;
        vert(p.x - side.x * halfW, p.y - side.y * halfW, p.z - side.z * halfW, -0.5, v, 0, seed, kind, sway * v * v, tone, 0);
        vert(p.x + side.x * halfW, p.y + side.y * halfW, p.z + side.z * halfW, 0.5, v, 0, seed, kind, sway * v * v, tone, 0);
      }
      for (let i = 0; i < m; i++) { const a = base + i * 2; G.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    };
    const card = (x, y, z, half, seed, sway, tone, cell) => {
      const a = vert(x, y, z, -0.5, 0, half, seed, 3, sway, tone, cell); vert(x, y, z, 0.5, 0, half, seed, 3, sway, tone, cell);
      vert(x, y, z, 0.5, 1, half, seed, 3, sway, tone, cell); vert(x, y, z, -0.5, 1, half, seed, 3, sway, tone, cell);
      G.idx.push(a, a + 1, a + 2, a, a + 2, a + 3);
    };
    // clear of the flight on both islands (island B is the set mirrored, 1,600 m north)
    const clearOf = (x, y, z, r) => path.distanceTo(x, y, z) > r && path.distanceTo(-x, y, z + LAP) > r;
    const builtAt = (x, z) => Math.hypot(x - A.pavilion.x, z - A.pavilion.z) < 7.5 || Math.hypot(x - A.jetty.x, z - A.jetty.z) < 4;
    const grow = rng.fork ? rng.fork('growths') : rng;
    const sideV = V3(), sp = [V3(), V3(), V3(), V3()];

    // ferns: rosettes of arching fronds, thickest under the tree and in the hollows
    const nFern = Math.round(1250 * detail * clamp(density, 0.8, 1.2));
    for (let i = 0, made = 0, tries = 0; made < nFern && tries < nFern * 12; tries++) {
      const nearTree = grow() < 0.6, ang = grow() * TAU, rr = nearTree ? 9 + grow() * 40 : 0;
      const x = nearTree ? Math.cos(ang) * rr * 0.8 : grow.range(-40, 40), z = nearTree ? Math.sin(ang) * rr : grow.range(-60, 200);
      const h = hAt(x, z); if (h < 0.7 || Math.hypot(x, z) < 8.5 || builtAt(x, z)) continue;
      if (!clearOf(x, h + 1.2, z, 6.3)) continue;
      const big = grow.range(0.8, 1.7) * (nearTree ? 1.15 : 0.9), fronds = 5 + (grow() < 0.5 ? 1 : 0), a0 = grow() * TAU, tone = grow();
      for (let f = 0; f < fronds; f++) {
        const a = a0 + (f / fronds) * TAU + grow.range(-0.3, 0.3), dx = Math.cos(a), dz = Math.sin(a), L = big * grow.range(0.8, 1.15), lift = grow.range(0.55, 0.9);
        sp[0].set(x, h - 0.05, z); sp[1].set(x + dx * L * 0.3, h + L * 0.42 * lift, z + dz * L * 0.3);
        sp[2].set(x + dx * L * 0.68, h + L * 0.56 * lift, z + dz * L * 0.68); sp[3].set(x + dx * L, h + L * 0.36 * lift, z + dz * L);
        sideV.set(-dz, 0.12, dx);
        ribbon(sp, sideV, L * 0.2, grow(), 0, 0.22, tone);
      }
      made++; if (made % 120 === 0) await ctx.yield();
    }
    await ctx.yield();
    // irises along the shore, reeds standing in the shallows
    const shore = (want, lo, hi, fn) => {
      for (let made = 0, tries = 0; made < want && tries < want * 40; tries++) {
        const z = grow.range(-66, 206), x = grow.range(-48, 48), h = hAt(x, z);
        if (h < lo || h > hi || builtAt(x, z) || !clearOf(x, Math.max(h, 0) + 1.5, z, 6.5)) continue;
        fn(x, Math.max(h, -0.6), z); made++;
      }
    };
    shore(Math.round(300 * detail), 0.2, 1.1, (x, h, z) => {
      const a = grow() * TAU, H = grow.range(0.8, 1.2);
      sp[0].set(x, h - 0.05, z); sp[1].set(x, h + H * 0.5, z); sp[2].set(x, h + H, z);
      sideV.set(Math.cos(a), 0, Math.sin(a)); ribbon(sp.slice(0, 3), sideV, 0.34, grow(), 1, 0.1, grow());
    });
    await ctx.yield();
    shore(Math.round(520 * detail), -0.75, 0.12, (x, h, z) => {
      for (let b = 0; b < 2; b++) {
        const a = grow() * TAU, H = grow.range(1.5, 2.7), lean = grow.range(-0.25, 0.25);
        sp[0].set(x, h - 0.1, z); sp[1].set(x + lean * 0.3, h + H * 0.5, z); sp[2].set(x + lean, h + H, z + lean * 0.5);
        sideV.set(Math.cos(a), 0, Math.sin(a)); ribbon(sp.slice(0, 3), sideV, 0.55, grow(), 2, 0.35, grow());
      }
    });
    await ctx.yield();
    // blossoming saplings along the northern tail: each a small tree, a forked dark stem that carries several
    // separate airy sprays (kind 4: small cards that keep their flowers and gaps, so the mist shows through)
    const stick = (a, b, w, seed) => {
      sp[0].copy(a); sp[1].lerpVectors(a, b, 0.5); sp[1].y += 0.06 * a.distanceTo(b); sp[2].copy(b);
      sideV.set(1, 0, 0); ribbon(sp.slice(0, 3), sideV, w, seed, 5, 0.3, 0); sideV.set(0, 0, 1); ribbon(sp.slice(0, 3), sideV, w, seed, 5, 0.3, 0);
    };
    const sA = V3(), sB = V3(), sC = V3();
    for (let i = 0, tries = 0; i < 14 && tries < 600; tries++) {
      const z = grow.range(96, 196), x = grow.range(-30, 30), h = hAt(x, z), H = grow.range(3.2, 6.2);
      if (h < 1.0 || builtAt(x, z) || !clearOf(x, h + H * 0.7, z, 6.5 + H * 0.55)) continue;
      const lean = grow.range(-0.5, 0.5), a0 = grow() * TAU, w0 = 0.07 + H * 0.012, forks = 3 + (grow() < 0.6 ? 1 : 0);
      sA.set(x, h - 0.1, z); sB.set(x + lean * 0.35, h + H * 0.42, z + lean * 0.2); stick(sA, sB, w0, grow());
      for (let f = 0; f < forks; f++) {
        const a = a0 + (f / forks) * TAU + grow.range(-0.4, 0.4), out = H * grow.range(0.3, 0.5), top = H * (f === 0 ? 1 : grow.range(0.62, 0.92));
        sC.set(sB.x + Math.cos(a) * out, h + top, sB.z + Math.sin(a) * out); stick(sB, sC, w0 * 0.55, grow());
        const n = 8 + Math.round(grow() * 3);
        for (let j = 0; j < n; j++) {
          const t = grow(), r = H * 0.2 * Math.sqrt(grow()), b = grow() * TAU;
          card(lerp(sB.x, sC.x, 0.72 + 0.34 * t) + Math.cos(b) * r, lerp(sB.y, sC.y, 0.72 + 0.34 * t) + grow.range(-0.25, 0.3) * H * 0.1, lerp(sB.z, sC.z, 0.72 + 0.34 * t) + Math.sin(b) * r,
            grow.range(0.42, 0.68) * (0.75 + H * 0.07), grow(), 0.2, 0.5 + 0.5 * t, Math.floor(grow() * 4));
          for (let v = 1; v <= 4; v++) G.k[(G.n - v) * 4] = 4;
        }
      }
      i++;
    }
    await ctx.yield();
    // cushion-moss mounds and half-sunk boulders: low domes that give the rock a broken skyline and something
    // for ferns and petals to gather against. kind 6; aQ.xy carries the dome's normal, tone its height 0..1,
    // aK.y is 1 on a boulder (lumpy, faceted, lichened, mossed only on its cap) and 0 on a moss cushion
    const rosette = (x, z, big, lift0) => {
      const h = hAt(x, z); if (h < 0.5 || !clearOf(x, h + 1.2, z, 6.3)) return;
      const fronds = 5, a0 = grow() * TAU, tone = grow();
      for (let f = 0; f < fronds; f++) {
        const a = a0 + (f / fronds) * TAU + grow.range(-0.3, 0.3), dx = Math.cos(a), dz = Math.sin(a), L = big * grow.range(0.8, 1.15), lift = lift0 * grow.range(0.8, 1.1);
        sp[0].set(x, h - 0.05, z); sp[1].set(x + dx * L * 0.3, h + L * 0.42 * lift, z + dz * L * 0.3);
        sp[2].set(x + dx * L * 0.68, h + L * 0.56 * lift, z + dz * L * 0.68); sp[3].set(x + dx * L, h + L * 0.36 * lift, z + dz * L);
        sideV.set(-dz, 0.12, dx); ribbon(sp, sideV, L * 0.2, grow(), 0, 0.22, tone);
      }
    };
    const nMound = Math.round(200 * Math.max(detail, 0.75)), n3 = ctx.noise.n3;
    for (let i = 0, tries = 0; i < nMound && tries < nMound * 14; tries++) {
      const under = grow() < 0.4, ang = grow() * TAU, rr = 10 + grow() * 34;
      const x = under ? Math.cos(ang) * rr * 0.85 : grow.range(-34, 34), z = under ? Math.sin(ang) * rr : grow.range(-55, 196);
      const h = hAt(x, z), R = grow.range(0.7, 2.3) * (grow() < 0.15 ? 1.6 : 1), Hh = R * grow.range(0.45, 0.8);
      if (h < 0.5 || Math.hypot(x, z) < 11 || builtAt(x, z) || !clearOf(x, h + Hh * 1.3, z, 6.4 + R * 1.3)) continue;
      const base = G.n, seed = grow(), sx = grow.range(0.8, 1.25), rot = grow() * TAU, cr = Math.cos(rot), sr = Math.sin(rot);
      const rocky = R > 1.15 && fract(seed * 7.3) > 0.45 ? 1 : 0, SEG = rocky ? 13 : 10, ROW = rocky ? 5 : 4, lump = rocky ? 0.3 : 0.1, so = seed * 91;
      for (let r = 0; r <= ROW; r++) {
        const el = (r / ROW) * Math.PI * 0.5, ce = Math.cos(el), se = Math.sin(el);
        for (let j = 0; j < SEG; j++) {
          const a = (j / SEG) * TAU, dxn = Math.cos(a) * ce, dzn = Math.sin(a) * ce;
          const wob = 1 + lump * (n3(dxn * 1.3 + so, se * 1.3, dzn * 1.3) + 0.5 * n3(dxn * 3.1, se * 3.1 + so, dzn * 3.1)) + (rocky ? 0.12 * Math.sign(n3(dxn * 0.9, so, dzn * 0.9)) : 0);
          const lx = dxn * R * sx * wob, lz = dzn * R / sx * wob, wx = lx * cr - lz * sr, wz = lx * sr + lz * cr;
          const nl = Math.hypot(wx / R, se, wz / R) || 1;
          vert(x + wx, h - 0.25 + se * Hh * wob + (r === 0 ? -0.6 : 0), z + wz, wx / R / nl, wz / R / nl, 0, seed, 6, rocky, r / ROW, se / nl);   // cell slot = normal.y
        }
      }
      for (let r = 0; r < ROW; r++) for (let j = 0; j < SEG; j++) { const a = base + r * SEG + j, b = base + r * SEG + (j + 1) % SEG; G.idx.push(a, b, a + SEG, b, b + SEG, a + SEG); }
      // ferns lean against the bigger ones
      if (R > 1.1) for (let f = 0, nf = rocky ? 3 : 2; f < nf; f++) { const fa = grow() * TAU; rosette(x + Math.cos(fa) * R * 1.05, z + Math.sin(fa) * R * 1.05, grow.range(0.9, 1.5), 0.85); }
      i++; if (i % 50 === 0) await ctx.yield();
    }
    await ctx.yield();
    // garlands: ropes of blossom hanging from the great boughs, the ceiling we enter and leave under
    const shades = HU.uShade.value.filter((s) => s.y > 0), nStrand = Math.round(340 * detail);
    for (let i = 0, tries = 0; i < nStrand && tries < nStrand * 10; tries++) {
      const s = shades[Math.floor(grow() * shades.length)], whole = s === shades[0];
      const a = grow() * TAU, r = Math.sqrt(grow()) * s.w * (whole ? 1.15 : 0.8);
      const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r, rt = Math.hypot(x, z);
      if (rt < 13 || rt > 60) continue;
      const top = whole ? 31 + grow() * 7 + (rt < 30 ? 6 : 0) : Math.max(s.y - 3 - grow() * 5, 29);
      const len = grow.range(7, 17), floor = Math.max(hAt(x, z), 0) + 9, big = grow.range(0.75, 1.15), seed = grow();
      let y = top, k = 0;
      while (y > top - len && y > floor && k < 16) {
        const taper = 1 - 0.5 * (top - y) / len, half = big * taper;
        if (!clearOf(x, y, z, 7.2 + half)) break;
        card(x + grow.range(-0.3, 0.3), y, z + grow.range(-0.3, 0.3), half, seed, (top - y) / 17, 0.5 + 0.5 * grow(), Math.floor(grow() * 4));
        y -= half * 0.95; k++;
      }
      if (k > 0) i++;
      if (i % 40 === 0) await ctx.yield();
    }
    await ctx.yield();
    const growGeo = new THREE.BufferGeometry();
    growGeo.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3));
    growGeo.setAttribute('aQ', new THREE.Float32BufferAttribute(G.q, 4));
    growGeo.setAttribute('aK', new THREE.Float32BufferAttribute(G.k, 4));
    growGeo.setIndex(G.idx);
    await ctx.yield();
    const atlas = hero.groups.A.children.find((m) => m.name === 'blossom').material.uniforms.uAtlas.value;
    const GROW_V = hero.glsl.COMMON + hero.glsl.FOG_V + /* glsl */`
attribute vec4 aQ, aK; uniform float uScale; varying vec3 vP; varying vec4 vQ, vK;
void main(){
  vec3 p = position; float sw = aK.y, ph = uTime * 1.25 + aQ.w * 6.283 + p.x * 0.21 + p.z * 0.17;
  if (aK.x > 2.5 && aK.x < 3.5) {      // hanging sprays ride their bough and swing a little below it
    p += swayOf(p); p.xz += sw * vec2(sin(ph * 0.55), cos(ph * 0.43 + 1.)) * 0.8; p.y += 0.06 * sin(ph * 2.1);
  } else p.xz += sw * vec2(sin(ph), cos(ph * 0.83)) * 0.16 + sw * sin(uTime * 0.7 + p.x * 0.05) * vec2(0.12, 0.05);
  vP = p; vQ = aQ; vK = aK;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  mvPosition.xy += vec2(aQ.x, aQ.y - 0.5) * 2. * aQ.z * uScale;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
    const GROW_F = hero.glsl.COMMON + hero.glsl.FOG_F + /* glsl */`
uniform sampler2D uAtlas; uniform vec3 uPetalA, uPetalB; uniform vec4 uLeaf, uFern;
varying vec3 vP; varying vec4 vQ, vK;
void main(){
  float kind = vK.x, u = vQ.x * 2., v = vQ.y, tone = vK.z, seed = vQ.w, a = 1.;
  vec3 col;
  float shadeK = 0.8;
  // the atlas is read before any branch, so its derivatives are defined on every path
  vec2 uv = (vec2(mod(vK.w, 2.), floor(vK.w * 0.5)) + vec2(vQ.x + 0.5, vQ.y)) * 0.5;
  float texels = fwidth(uv.x) * 1024.;
  vec4 t = texture2D(uAtlas, uv);
  vec3 nFlat = normalize(cross(dFdx(vP), dFdy(vP)) + vec3(0., 1e-6, 0.)); if (nFlat.y < 0.) nFlat = -nFlat;   // facets, for boulders
  if (kind < 0.5) {                    // fern frond: a tapering blade cut into pinnae, pale midrib
    float env = smoothstep(0., 0.1, v) * (1. - v * v), saw = abs(fract(v * 15. + seed) - 0.5) * 2.;
    float w = env * (0.22 + 0.78 * saw);
    a = step(abs(u), max(w, 0.07 * (1. - v)));
    col = mix(vec3(0.085, 0.2, 0.12), mix(vec3(0.3, 0.5, 0.26), uMint * 0.7, 0.35), 0.25 + 0.5 * tone + 0.25 * abs(u));
    col = mix(col, uFern.rgb, uFern.a * (0.5 + 0.5 * tone));
    col *= 0.75 + 0.5 * v; col = mix(col, col * 1.5, smoothstep(0.09, 0.0, abs(u)));
  } else if (kind < 1.5) {             // iris: three sword leaves and one pale flower with a gold throat
    float bu = u * 1.5, lean = 0.5 * v * v;
    float b1 = abs(bu - lean) , b2 = abs(bu + 0.8 + lean * 0.8), b3 = abs(bu - 0.8 + lean * 0.3);
    float wl = 0.2 * (1. - v / 0.78), leaf = step(min(b1, min(b2, b3)), wl) * step(v, 0.78);
    vec2 d = vec2(u + 0.1, (v - 0.84) * 3.4);
    float fall = min(length((d - vec2(-0.42, -0.1)) * vec2(1.6, 2.6)), length((d - vec2(0.42, -0.1)) * vec2(1.6, 2.6)));
    float fl = step(min(fall, length((d - vec2(0., 0.16)) * vec2(2.6, 1.7))), 0.5) * step(0.3, tone);
    float stem = step(abs(u + 0.1), 0.045) * step(v, 0.84) * step(0.3, tone);
    a = max(max(leaf, fl), stem);
    col = mix(vec3(0.13, 0.27, 0.17), vec3(0.3, 0.46, 0.3), v);
    vec3 pet = mix(uPearl * 0.86, vec3(0.62, 0.6, 0.86), 0.25 + 0.3 * tone);
    col = mix(col, mix(pet, uGold * 0.7, smoothstep(0.3, 0.0, length(d))), fl);
  } else if (kind < 2.5) {             // reeds: a few leaning blades, dark seed heads
    float g = u * 1.6 + seed * 5., id = floor(g), f = fract(g), h = hash21(vec2(id, seed * 91.));
    float top = 0.55 + 0.45 * h, c = 0.5 + 0.3 * (h - 0.5) + 0.22 * sin(v * 2.2 + h * 6.);
    float wb = 0.1 * (1. - 0.8 * v / top) + 0.09 * smoothstep(0.8, 0.9, v / top) * step(0.5, h);
    a = step(abs(f - c), wb) * step(v, top);
    col = mix(vec3(0.16, 0.25, 0.2), vec3(0.5, 0.56, 0.38), v / top);
    col = mix(col, vec3(0.2, 0.15, 0.11), smoothstep(0.8, 0.86, v / top) * step(0.5, h));
    col = mix(col, uFern.rgb * 1.2, uFern.a * 0.6);
    shadeK = 0.6;
  } else if (kind < 4.5) {             // a spray of blossom from the set's own atlas (kind 4: a sapling's, kept open)
    float airy = step(3.5, kind);
    float soft = clamp(max((texels - mix(1.8, 9., airy)) / mix(3.5, 26., airy), uWash * 1.5), 0., 1.);
    vec2 qc = vec2(vQ.x, vQ.y - 0.5);
    float disc = smoothstep(1.0, 0.62, length(qc) * 2. + (vnoise(qc * 5. + seed * 30.) - 0.5) * 0.5);
    disc *= mix(1., smoothstep(0.26, 0.4, vnoise(qc * 6.5 + seed * 50.)), airy);
    a = mix(t.a, disc, soft);
    float mott = vnoise(qc * 9. + seed * 20.), tn = mix(t.r, 0.25 + 0.6 * mott, soft), depth = mix(mix(0.55, 1., t.b), 0.74 + 0.26 * mott, soft);
    col = mix(uPetalA * 0.86, uPetalB * 0.8, tn * tn * 0.85 + 0.1);
    col = mix(col, uGold * 0.62, t.g * (1. - soft) * 0.75);
    col = mix(col, uLeaf.rgb * (0.6 + 0.5 * mott), step(0.001, uLeaf.a) * mix(step(t.b, 0.62), smoothstep(0.45, 0.6, mott), soft) * min(uLeaf.a * 2.6, 1.));
    // lit from the pearl all round and glowing where the light comes through
    col *= depth * mix(0.66, 1.0, tone) * mix(0.86, 1.06, vQ.y) * 1.02;
    col = mix(col, uPetalA * 0.82 * depth, 0.3);
    shadeK = 0.22;
  } else if (kind > 5.5) {             // a cushion-moss mound or a mossed boulder
    float c3 = vnoise(vP.xz * 21. + vP.y * 9.);
    vec3 nn = normalize(vec3(vQ.x, vK.w + 0.02, vQ.y) + (vec3(c3, 0., vnoise(vP.zx * 19. + 4.)) - vec3(0.5, 0., 0.5)) * 0.35);   // cushions, not plastic
    float bld = vK.y; nn = normalize(mix(nn, nFlat, bld * 0.8));
    float c1 = vnoise(vP.xz * 2.6 + seed * 9.), c2 = vnoise(vP.xz * 9. + vP.y * 5.), bare = smoothstep(0.55, 0.75, mix(fract(seed * 7.3), 0.92, bld) + 0.35 * c1 - mix(0.5, 0.62, bld) * nn.y);
    vec3 moss = mix(vec3(0.12, 0.22, 0.11), mix(vec3(0.27, 0.42, 0.2), uMint * 0.66, 0.3 + 0.5 * fract(seed * 3.7)), smoothstep(0.2, 0.75, c1) * (0.7 + 0.3 * c2));
    vec3 rock = mix(uSlate * 0.5, mix(uSlate, uPearl, 0.35) * 0.72, c1) * (0.75 + 0.5 * c2);     // pale lichened stone, never a dark hole
    // a boulder is stone: strata, pale lichen in blots, a few ochre crusts; moss only where it lies flat
    rock *= mix(1., 0.82 + 0.36 * smoothstep(0.35, 0.65, fract(vP.y * 1.9 + c1 * 1.4 + seed * 5.)), bld);
    rock = mix(rock, mix(uMint, uPearl, 0.5) * 0.66, smoothstep(0.5, 0.64, vnoise(vP.xz * 2.7 + vP.y * 3.1 + seed * 40.)) * 0.75 * bld);
    rock = mix(rock, uGold * 0.55, step(0.83, vnoise(vP.xz * 6.1 + vP.y * 5.3 + 9.)) * 0.6 * bld);
    col = mix(moss, rock, bare);
    vec2 pcell = vP.xz * 5., pf = fract(pcell) - 0.5; float ph6 = hash21(floor(pcell));
    col *= 0.78 + 0.44 * c3;
    col = mix(col, mix(uPink, uWhite, 0.4) * 0.8, step(0.9, ph6) * step(length(pf * vec2(1., 1.8) + (ph6 - 0.95) * 3.), 0.3) * smoothstep(0.5, 0.9, nn.y) * 0.9);      // a few fallen petals
    col *= mix(uBounce, uSky, clamp(nn.y * 0.6 + 0.4, 0., 1.)) / max(mix(uBounce, uSky, 0.8), vec3(1e-3)) * (0.74 + 0.4 * smoothstep(0.0, 0.6, tone));   // round, dark at the foot
    shadeK = 0.85;
  } else {                             // sapling stem
    col = mix(uChar, vec3(0.2, 0.17, 0.15), 0.5) * (0.9 + 0.6 * vnoise(vec2(u * 3., v * 30.)));
  }
  if (a < 0.5) discard;
  col *= mix(uBounce, uSky, 0.8) * mix(1., canopy(vP), shadeK);
  if (kind < 2.5) col *= mix(0.55, 1., smoothstep(0., 0.5, v));          // rooted in their own shade
  if (kind > 2.5 && kind < 4.5) col = lessWash(col, 0.62);
${hero.glsl.FINISH_Y}}`;
    const fernTint = season.name === 'autumn' ? new THREE.Vector4(0.42, 0.25, 0.1, 0.55) : new THREE.Vector4(0, 0, 0, 0);
    for (const name of ['A', 'FAR']) {
      const m = new THREE.Mesh(growGeo, hero.makeSetMaterial(name, GROW_V, GROW_F, { side: THREE.DoubleSide, a2c: true,
        uniforms: { uAtlas: { value: atlas }, uFern: { value: fernTint } } }));
      m.name = 'growths'; m.frustumCulled = false; hero.groups[name].add(m);
      await ctx.yield();
    }
    /*GROW-F*/
    /*GROWTHS*/
    // ---- the fishing stakes: pairs of poles with a float line between, from the north tip all the way
    // round to the south tip (which is the same tip), 9 m to starboard of the flight ----
    const SK = { pos: [], col: [], side: [], bob: [], idx: [], n: 0 };
    const sv = (x, y, z, c, sx, sz, w, bob, ph) => { SK.pos.push(x, y, z); SK.col.push(c.r, c.g, c.b); SK.side.push(sx, sz, w); SK.bob.push(bob, ph); return SK.n++; };
    const poleC = C(season.pal[4]).lerp(C('#6b5a48'), 0.45), poleTop = poleC.clone().lerp(C(air.low), 0.35), lineC = C('#cfc7b4'), floatA = C('#f2efe6'), floatB = C(season.pal[4]).multiplyScalar(1.4);
    const pole = (x, z, lx, lz, H, r) => {
      const base = SK.n, rows = [[-3.2, poleC, r * 1.1], [0.0, poleC.clone().multiplyScalar(0.55), r * 1.05], [0.5, poleC, r], [H, poleTop, r * 0.7]];
      for (const [y, c, rr] of rows) for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU; sv(x + Math.cos(a) * rr + lx * y, y, z + Math.sin(a) * rr + lz * y, c, Math.cos(a), Math.sin(a), 0.5, 0, 0); }
      for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < 6; j++) { const a = base + i * 6 + j, b = base + i * 6 + (j + 1) % 6; SK.idx.push(a, b, a + 6, b, b + 6, a + 6); }
    };
    const stakeRng = rng.fork('stakes'), pp = V3(), tt = V3(), stakePts = [];
    // (spaced a fortieth of the course apart, so that the pair we are passing is where the eye wants it)
    const stakeGap = path.length * 0.025, stake0 = path.length * 0.6 + 30;
    for (let d = stake0 - Math.floor((stake0 - 250) / stakeGap) * stakeGap; d < path.length - 62; d += stakeGap) {
      path.posAtDist(d, pp); path.tangentAtDist(d, tt);
      const tl = Math.hypot(tt.x, tt.z) || 1, tx = tt.x / tl, tz = tt.z / tl, cx = pp.x - tz * 9, cz = pp.z + tx * 9;   // starboard = -x going north
      if (hAt(cx, cz) > -1.5 || hAt(-cx, cz - LAP) > -1.5) continue;
      const half = stakeRng.range(5.5, 7.5), x0 = cx - tx * half, z0 = cz - tz * half, x1 = cx + tx * half, z1 = cz + tz * half;
      pole(x0, z0, stakeRng.range(-0.05, 0.05), stakeRng.range(-0.05, 0.05), stakeRng.range(3.7, 4.5), 0.15);
      pole(x1, z1, stakeRng.range(-0.05, 0.05), stakeRng.range(-0.05, 0.05), stakeRng.range(3.7, 4.5), 0.15);
      stakePts.push([cx, cz]); if (stakePts.length % 8 === 0) await ctx.yield();
      // the float line: tied a little above the water at each pole, lying on it between
      const base = SK.n, N = 14, ph = stakeRng() * TAU;
      for (let i = 0; i <= N; i++) {
        const t = i / N, e = Math.abs(2 * t - 1), y = 0.04 + 0.9 * e * e * e * e, bob = 1 - e * e;
        const x = lerp(x0, x1, t), z = lerp(z0, z1, t) ;
        sv(x, y, z, lineC, -tz, tx, 0.035, bob, ph + t * 9); sv(x, y, z, lineC, tz, -tx, 0.035, bob, ph + t * 9);
        if (i < N) { const a = base + i * 2; SK.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      for (let f = 1; f < 8; f++) {          // floats: little double cones riding the ripples
        const t = f / 8, x = lerp(x0, x1, t), z = lerp(z0, z1, t), c = f % 2 ? floatA : floatB, b0 = SK.n, bob = 1 - Math.abs(2 * t - 1) ** 2, fp = ph + t * 9;
        const top = sv(x, 0.3, z, c, 0, 0, 0, bob, fp), bot = sv(x, -0.14, z, c.clone().multiplyScalar(0.5), 0, 0, 0, bob, fp);
        for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU; sv(x + Math.cos(a) * 0.2, 0.08, z + Math.sin(a) * 0.2, c, Math.cos(a), Math.sin(a), 0.5, bob, fp); }
        for (let j = 0; j < 6; j++) { const a = b0 + 2 + j, b = b0 + 2 + (j + 1) % 6; SK.idx.push(top, b, a, bot, a, b); }
      }
    }
    const stakeGeo = new THREE.BufferGeometry();
    stakeGeo.setAttribute('position', new THREE.Float32BufferAttribute(SK.pos, 3)); stakeGeo.setAttribute('color', new THREE.Float32BufferAttribute(SK.col, 3));
    stakeGeo.setAttribute('aSide', new THREE.Float32BufferAttribute(SK.side, 3)); stakeGeo.setAttribute('aBob', new THREE.Float32BufferAttribute(SK.bob, 2));
    stakeGeo.setIndex(SK.idx);
    const stakeU = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), { uTime: HU.uTime, uSky: HU.uSky, uBounce: HU.uBounce, uRes: HU.uRes });
    const stakes = new THREE.Mesh(stakeGeo, new THREE.ShaderMaterial({
      uniforms: stakeU, fog: true, side: THREE.DoubleSide,
      vertexShader: /* glsl */`#include <fog_pars_vertex>
attribute vec3 color, aSide; attribute vec2 aBob; uniform float uTime; uniform vec2 uRes; varying vec3 vC; varying float vUp, vY;
void main(){
  vec3 p = position; p.y += aBob.x * 0.05 * sin(uTime * 1.7 + aBob.y);
  vec4 mv0 = modelViewMatrix * vec4(p, 1.);
  // poles and lines never thinner than about 1.6 pixels: widen along their own outward direction
  float px = 2. / (projectionMatrix[1][1] * uRes.y) * max(-mv0.z, 0.1) * 1.6;
  p.xz += aSide.xy * (aSide.z > 0.25 ? max(px * 0.5 - 0.12, 0.) : max(aSide.z, px * 0.5));
  vC = color; vUp = aSide.z > 0.25 ? 0.6 : 1.; vY = p.y;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
      fragmentShader: /* glsl */`#include <fog_pars_fragment>
uniform vec3 uSky, uBounce; varying vec3 vC; varying float vUp, vY;
void main(){
  vec3 col = vC * mix(uBounce, uSky, vUp) * (vY < 0. ? 0.75 : 1.);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`,
    }));
    stakes.frustumCulled = false; stakes.renderOrder = 1; scene.add(stakes);
    await ctx.yield();
    // ---- air: mist crawling at the waterline, rain on a wet visit, finches flicking through the boughs ----
    const kitTime = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    const mist = set.add(fx.makeMist({ rng: rng.fork('mist'), time: kitTime, count: Math.round(64 * detail), area: [1100, 3, 1100], center: [0, 2.2, 0], size: [70, 170],
      color: air.low, opacity: air.rain ? 0.28 : 0.22, drift: [1.4, 0, 0.6], flatten: 0.13, follow: true }));
    await ctx.yield();
    const drift = set.add(fx.makeParticles({ rng: rng.fork('drift'), preset: season.name === 'autumn' ? 'leaves' : 'petals', time: kitTime,
      count: Math.round(900 * detail), box: [50, 34, 50], colors: [season.raft, season.raft2, season.pal[1]], velocity: [0.5, -1.1, 0.25], size: [0.2, 0.36],
      lightDir: [0, 1, 0], intensity: 1.25 }));
    await ctx.yield();
    let rain = null;
    if (air.rain) {
      rain = set.add(fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time: kitTime, count: Math.round(5200 * detail), color: '#f4f8f9', opacity: 0.62, velocity: [6.5, -16, 2.5] }));
      await ctx.yield();
    }
    const fauna = F.makeFauna(scene, { light: { sunDir: [0.2, 1, 0.1], sunColor: air.sky, sunIntensity: 0.9, sky: air.sky, skyIntensity: 1.5, ground: season.pal[3], groundIntensity: 0.8 } });
    const finchCol = { body: '#D9A93C', belly: '#F0D488', wingC: '#3A3A36', tip: '#1E2224', head: '#C8962E', tailC: '#2C2F30' };
    const nFinch = Math.max(12, Math.round(30 * detail));
    for (const [cx, cz, dir] of [[-22, 6, 1], [22, LAP - 58, -1]]) {
      fauna.add(F.makeFlock({ rng: rng.fork('finch' + dir), species: 'swifts', count: nFinch, size: 1.3, speed: 9, center: [cx, 17, cz], radius: 12, height: 4, wobble: 0.6,
        direction: dir, spread: [9, 4, 12], wander: [4, 2.5, 4, 0.9], flap: 9, glide: 0.25, palette: finchCol }), { always: true });
      await ctx.yield();
    }
    // ---- mist banks: low sheets lying on the water across our course, each with its own reflection, at a dozen
    // distances between the islands. The near one crosses in front of the far tree's reflection, the far ones
    // veil its foot, so the island stands above a haze line and the crossing has a middle distance ----
    const MB = { pos: [], q: [], s: [], idx: [], n: 0 }, mrng = rng.fork('banks'), mp = V3(), mt = V3();
    for (let d = 640, k = 0; d < path.length - 95; d += mrng.range(78, 112), k++) {
      path.posAtDist(d, mp); path.tangentAtDist(d, mt);
      const tl = Math.hypot(mt.x, mt.z) || 1, sx = mt.z / tl, sz = -mt.x / tl, off = (k % 2 ? 1 : -1) * mrng.range(30, 150);
      const W = mrng.range(340, 640), H = mrng.range(4.5, 7.5) + 6 * smoothstep(1330, 1450, mp.z), seed = mrng(), yaw = mrng.range(-0.2, 0.2);
      const cx = mp.x + sx * off, cz = mp.z + sz * off, ax = sx * Math.cos(yaw) - sz * Math.sin(yaw), az = sx * Math.sin(yaw) + sz * Math.cos(yaw);
      const base = MB.n;
      for (const [qu, qv] of [[-0.5, -0.45], [0.5, -0.45], [0.5, 1], [-0.5, 1]]) {
        MB.pos.push(cx + ax * qu * W, qv * H, cz + az * qu * W); MB.q.push(qu, qv); MB.s.push(W, seed, ax, az); MB.n++;
      }
      MB.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    const bankGeo = new THREE.BufferGeometry();
    bankGeo.setAttribute('position', new THREE.Float32BufferAttribute(MB.pos, 3)); bankGeo.setAttribute('aQ', new THREE.Float32BufferAttribute(MB.q, 2));
    bankGeo.setAttribute('aS', new THREE.Float32BufferAttribute(MB.s, 4)); bankGeo.setIndex(MB.idx);
    const bankU = { uTime: HU.uTime, uCol: { value: C(air.low).lerp(C('#ffffff'), 0.35) }, uOp: { value: air.rain ? 0.76 : 0.7 } };
    const banks = new THREE.Mesh(bankGeo, new THREE.ShaderMaterial({
      uniforms: bankU, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`attribute vec2 aQ; attribute vec4 aS; uniform float uTime; varying vec2 vQ; varying vec3 vS; varying float vDist;
void main(){
  vec3 p = position; p.xz += aS.zw * 14. * sin(uTime * 0.05 + aS.y * 40.);          // the banks creep along themselves
  vQ = aQ; vS = vec3(aS.x, aS.y, p.y);
  vec4 mv = modelViewMatrix * vec4(p, 1.); vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`,
      fragmentShader: NOISE + /* glsl */`uniform vec3 uCol; uniform float uTime, uOp; varying vec2 vQ; varying vec3 vS; varying float vDist;
void main(){
  float v = vQ.y < 0. ? -vQ.y / 0.5 : vQ.y, x = vQ.x * vS.x;
  float n = vnoise(vec2(x * 0.011 + vS.y * 31. + uTime * 0.035, v * 1.3 + vS.y * 9.)) * 0.6 + vnoise(vec2(x * 0.034 - uTime * 0.05, v * 3.1 + vS.y * 17.)) * 0.4;
  float top = 0.4 + 0.58 * n;                                                   // a ragged top: it stands taller in places
  float prof = 1. - clamp(v / max(top, 0.05), 0., 1.); prof = prof * prof * (3. - 2. * prof);
  float ends = smoothstep(0.5, 0.16, abs(vQ.x) + (n - 0.5) * 0.12);
  float a = uOp * prof * ends * (0.62 + 0.38 * smoothstep(0.3, 0.7, n)) * smoothstep(30., 170., vDist);     // (continuous across the waterline: its foot is never a line)
  gl_FragColor = vec4(uCol * (0.97 + 0.05 * n), a);
}`,
    }));
    banks.frustumCulled = false; banks.renderOrder = 3; scene.add(banks);
    await ctx.yield();
    /*WORLD-PARTS*/

    const tmp = V3(), tmp2 = V3(), camP = V3(), size = new THREE.Vector2();
    return {
      scene, path, duration: 44,
      pace: (u) => lerp(lerp(0.52, 1.42, smoothstep(0.05, 0.24, u)), 0.86, smoothstep(0.6, 0.76, u)),
      camera: { fov: 62, near: 0.5, far: 9000, lookAhead: 30, sway: 0.5, bank: 0.6 },
      pois: [
        { at: () => tmp.set(0, 46 * hero.state.S, hero.state.farZ), from: 0.07, to: 0.6, weight: 0.5 },
        // across the open water the gaze drops to the sea and swings a little to port, so the island stands right
        // of centre over its long reflection, the cranes fly in the port half and the water fills the lower frame
        { at: () => { const D = Math.max(hero.state.farZ - camP.z, 60); return tmp2.set(0.3 * D, -0.2 * D, hero.state.farZ); }, from: 0.34, to: 0.88, weight: 0.55, fade: 0.25 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#BFF3E6', glow: 1, revealDistance: 560 },
      post: { exposure: 1.0, bloom: { strength: 0.25, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 0.95, contrast: 1.04, tint: '#ffffff', shadowTint: '#0b1215', vignette: 0.15, grain: 0 } },
      ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        hero.setProgress(u);
        hero.update(dt, time, camera);
        camera.getWorldPosition(camP);
        const st = hero.state;
        dome.position.copy(camP);
        domeU.uTime.value = time; domeU.uA.value = st.a; domeU.uOff.value.set(camP.x / st.S, camP.y / st.S);
        domeU.uRare.value = rare ? smoothstep(0.02, 0.1, u) * (1 - smoothstep(0.62, 0.8, u)) : 0;
        domeU.uGhost.value = smoothstep(0.86, 0.95, u);
        domeU.uRk.value = lerp(1.3, 2, smoothstep(0.2, 0.38, u));   // it comes to its full size, twice the first, as that one draws down the sky
        waterU.uB.value = u < 0.3 ? 0 : 1; waterU.uShore.value = u < 0.3 ? 1 : smoothstep(0.66, 0.69, u);
        kitTime.value = time; set.update(dt, time, camera); fauna.update(dt, time, camera, u);
        /*WORLD-UPDATE*/
      },
      dispose() { hero.dispose(); },
    };
  },
};
