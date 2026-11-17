// WHERE NIGHT SPENDS THE DAY  (night-under-the-oaks)
// A buttercup meadow at blazing noon. Night has not left: it waits under the trees. Every tree's shade is a
// lobed, breathing dome of true night with stars in it, ringed by a thin band of permanent sunset, and under
// the great oak (src/parts/night-under-the-oaks.js) lies a whole midnight with moon, pond and sleeping deer.
// World space == hero space: the oak's trunk foot is the origin, the flight arrives from +Z and leaves at -Z.
// One law runs through every material: n(p) = how deep in night the point is, colour = mix(noon, night, n)
// + the dusk ramp in the band. The hero supplies the oak's n; this file adds the lesser trees and the spill.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import { buildHero, makeBodySink, NIGHT_LAW_GLSL, NIGHT_SKY_GLSL } from '../parts/night-under-the-oaks.js';

const TAU = Math.PI * 2;
const NT = 14;                       // lesser-tree slots in the law (slot 13 is the rare spill's dome)
const col = (h) => new THREE.Color(h);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------------------------------------------
// THE LAW, extended to every tree. Slot i: uTrees[i] = (x, z, drip radius R, dome height H).
const WORLD_LAW_GLSL = NIGHT_LAW_GLSL + /* glsl */`
uniform vec4 uTrees[${NT}];
uniform float uTreeY[${NT}];
uniform vec2 uWind;
uniform float uGain;      // night-side eye adaptation (the camera's own n lifts it)
float treeRad(vec4 t, float a, float i){
  return t.z * (1. + .07 * sin(a * 3. + i * 1.7) + .045 * sin(a * 5. + i * 2.9)) + .35 * sin(a * 2. + uTime * .79 + i * 2.);
}
float treeD(vec3 p, vec4 t, float i){
  vec2 q = p.xz - t.xy;
  float a = safeAng(q.yx);
  return length(vec3(q.x, p.y * t.z / max(t.w, .1), q.y)) - treeRad(t, a, i);
}
float nightAll(vec3 p){
  float n = nightN(p);
  for (int i = 0; i < ${NT}; i++){
    vec4 t = uTrees[i];
    float w = .16 * t.z;
    n = max(n, step(1.5, t.z) * (1. - smoothstep(-w, w, treeD(p - vec3(0., uTreeY[i], 0.), t, float(i)))));   // a slot under 1.5 m is no night anywhere (as nightAt and the dome skin have it)
  }
  return n;
}
// oakLaw with n supplied (so n can come per vertex or from every tree)
vec3 lawN(vec3 alb, vec3 p, vec3 N, vec3 V, float ao, float n){
  // inside the Oak the midnight is lit from its sources (hero law); a lesser tree's night keeps its even starlight,
  // lifted once more by the eye's adaptation (the hero's uniforms already carry the gain once)
  float oakN = nightN(p);
  vec3 night = nightLit(alb, p, N, V, ao, oakN) * mix(uGain, 1., oakN);
  float nl = max(dot(N, uSunDir), 0.);
  vec3 noon = alb * (uSunCol * nl * ao + uSkyCol * (.55 + .45 * N.y) * ao);
  float rim = 1. - max(dot(N, V), 0.); rim = rim * rim * rim;
  float band = 4. * n * (1. - n);
  vec3 c = mix(noon, night, n);
  c += duskRamp(n) * band * (.3 + alb * .9 + .35 * rim);
  return c;
}
`;

// meadow relief: analytic so the CPU (path, placement) and the GPU (grass) agree. Flat within ~105 m of the oak.
const HEIGHT_GLSL = /* glsl */`
float groundH(vec2 p){
  float r = length(p);
  float m = smoothstep(108., 300., r);
  float h = sin(p.x * .0105 + 1.3) * sin(p.y * .0088 + 2.1) * 2.6 + sin(p.x * .021 - p.y * .017 + .6) * 1.1 + sin(p.y * .033 + p.x * .009) * .5;
  return h * m + smoothstep(520., 900., r) * 26. * smoothstep(520., 900., r);
}`;
function groundH(x, z) {
  const r = Math.hypot(x, z), m = sstep(108, 300, r), f = sstep(520, 900, r);
  const h = Math.sin(x * 0.0105 + 1.3) * Math.sin(z * 0.0088 + 2.1) * 2.6 + Math.sin(x * 0.021 - z * 0.017 + 0.6) * 1.1 + Math.sin(z * 0.033 + x * 0.009) * 0.5;
  return h * m + f * f * 26;
}

// ---------------------------------------------------------------------------------------------------
// VARIATIONS chosen by seed: season x moon x dusk ring (x lesser-tree count, blossom).
const SEASONS = {
  june: { name: 'Where Night Spends the Day', grassA: '#3F6A2A', grassB: '#86B648', flower: '#F2D95C', seed: '#D9CF8C', accent: '#C8553F',
    leafA: '#2F5A26', leafB: '#7DB34A', hanger: '#2C4A2E', zenith: '#4F9BE2', horizon: '#BFE3F5', fog: '#BFE3F5', flowerAmt: 1, mist: 0, snow: 0, leafDrop: 0,
    pal: ['#F2D95C', '#7DB34A', '#BFE3F5', '#0B1033', '#E9ECFF', '#F08A4B', '#2C4A2E'] },
  september: { name: 'Where Night Spends the Day: September', grassA: '#6E5A2A', grassB: '#C9A650', flower: '#E8C56A', seed: '#E9D9A0', accent: '#B5532C',
    leafA: '#7A3B1C', leafB: '#C8782E', hanger: '#5A4226', zenith: '#5E9AD4', horizon: '#E4DCC4', fog: '#E0D9C6', flowerAmt: 0.25, mist: 1, snow: 0, leafDrop: 1,
    pal: ['#E8C56A', '#B98A3A', '#D9E2E8', '#0B1033', '#E9ECFF', '#F08A4B', '#5A4226'] },
  frost: { name: 'Where Night Spends the Day: Hard Frost', grassA: '#8FA6A0', grassB: '#DDE9EC', flower: '#F4F8FF', seed: '#FFFFFF', accent: '#B9C9D9',
    leafA: '#5A5048', leafB: '#9A8E82', hanger: '#6E7C84', zenith: '#6FA6DC', horizon: '#E6EEF5', fog: '#DCE7F0', flowerAmt: 0.12, mist: 0.5, snow: 1, leafDrop: 0,
    pal: ['#EEF3F8', '#B9CBC6', '#D5E4F0', '#0B1033', '#E9ECFF', '#F08A4B', '#6E7C84'] },
};
const RINGS = {
  sunset: ['#F08A4B', '#E8668A', '#6A4BC0'],
  aurora: ['#D8E05A', '#4FD6A0', '#1E8FA8'],
  scarlet: ['#FF3B2A', '#C2264E', '#4E2A9E'],
};
function chooseLook(ctx) {
  const r = ctx.rng.fork ? ctx.rng.fork('look') : ctx.rng;
  const a = r(), b = r(), c = r(), d = r(), e = r();
  const hour = ctx.vary?.hour ?? 'any';
  let season = a < 0.12 || (a >= 0.56 && a < 0.8) ? 'september' : a < 0.56 ? 'june' : 'frost';
  if (hour === 'golden') season = 'september';
  let moon = b >= 0.6 ? 'crescent' : b >= 0.3 ? 'full' : 'none';
  if (hour === 'night') moon = 'none';             // the densest Milky Way for a viewer who asked for night
  const ring = c < 0.55 ? 'sunset' : c < 0.8 ? 'aurora' : 'scarlet';
  return { season, moon, ring, S: SEASONS[season], trees: 9 + Math.floor(d * 5), blossom: e < 0.34 && season === 'june',
    rare: !!ctx.vary?.rare, density: ctx.vary?.density ?? 1, detail: ctx.quality?.detail ?? 1 };
}

// ---------------------------------------------------------------------------------------------------
// materials that obey the law
const VERT_HEAD = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec3 vP; varying vec3 vN;
`;
const FRAG_HEAD = /* glsl */`
#include <common>
#include <fog_pars_fragment>
varying vec3 vP; varying vec3 vN;
` + WORLD_LAW_GLSL;
function lawMat(W, { vert, frag, uniforms = {}, ...rest }) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...W.U, ...uniforms },
    vertexShader: VERT_HEAD + WORLD_LAW_GLSL + vert, fragmentShader: FRAG_HEAD + frag, fog: true, ...rest,
  });
}

// meadow colour shared by the ground and (per vertex) the tufts, so both carry the same drifts
const MEADOW_GLSL = /* glsl */`
uniform vec3 uGrassA, uGrassB, uFlower, uSeed, uAccent; uniform float uFlowerAmt; uniform vec2 uPicXZ;
float gustAt(vec2 p){ return vn2(p * .028 + vec2(uTime * .21, uTime * .08)) * .62 + vn2(p * .11 + vec2(uTime * .47, uTime * .13)) * .38; }
float driftAt(vec2 p){ return smoothstep(.36, .62, fbm2(p * .045 + 9.)); }
`;

function makeGround(W) {
  const S = W.look.S;
  const g = new THREE.PlaneGeometry(2400, 2400, 110, 110); g.rotateX(-Math.PI / 2);
  const mat = lawMat(W, {
    uniforms: { uHanger: { value: col(S.hanger) }, uFrost: { value: S.snow }, uPath: W.uPath },
    vert: HEIGHT_GLSL + /* glsl */`
      void main(){ vec3 p = position;
        p.y = groundH(p.xz) - .45 * (1. - smoothstep(98., 106., length(p.xz)));
        vP = p; vN = vec3(0., 1., 0.);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    frag: MEADOW_GLSL + HEIGHT_GLSL + PATH_GLSL + /* glsl */`
      uniform vec3 uHanger; uniform float uFrost;
      void main(){
        vec2 p = vP.xz; float r = length(p);
        float dist = length(uCamL - vP);
        float near = smoothstep(110., 18., dist);
        float n = nightAll(vP);
        float gust = gustAt(p);
        float patchy = fbm2(p * .06 + 3.);
        float blades = vn2(p * vec2(9., 3.1) + gust * 1.5) * .4 + vn2(p * 23.) * .35 + vn2(p * 61.) * .25;
        blades = mix(.5, blades, near);
        vec3 alb = mix(uGrassA, uGrassB, .22 + .33 * patchy + .45 * blades);
        alb *= (.66 + .5 * gust) * mix(.8 + .4 * fbm2(p * .019 + 60.), 1., near);   // gust waves cross the meadow, seen to the horizon
        alb = mix(alb, uSeed * .62, .3 * vn2(p * .9 + 4.) + .12);  // pale seed heads
        alb = mix(alb, uAccent * .55, smoothstep(.55, .8, fbm2(p * .09 + 31.)) * .3);   // sorrel haze
        float drift = driftAt(p);
        vec2 cell = floor(p * 3.4), cf = fract(p * 3.4) - .5;
        float fh = h21(cell);
        float dot1 = smoothstep(.24, .1, length(cf + (vec2(h21(cell + 3.), h21(cell + 7.)) - .5) * .5));
        float mown = (1. - smoothstep(.6, 1.25, pathD(p))) * smoothstep(96., 110., r);
        alb = mix(alb, mix(uGrassA, uGrassB, .8) * (.8 + .35 * blades), mown * .9);
        float cover = (.06 + .62 * drift) * uFlowerAmt * (1. - mown);
        float butter = mix(cover * .85, step(1. - cover, fh) * dot1, near);
        alb = mix(alb, uFlower * (1. - .3 * n), clamp(butter + cover * .3, 0., 1.) * (1. - .55 * n));
        float daisy = step(.93, h21(cell + 21.)) * dot1 * near;
        alb = mix(alb, vec3(.86, .88, .84), daisy);
        alb = mix(alb, vec3(.84, .9, .95), uFrost * (.35 + .4 * blades));
        // the far hanger
        float hang = smoothstep(560., 760., r + (fbm2(p * .012) - .5) * 160.);
        alb = mix(alb, uHanger * (.55 + .7 * vn2(p * .05)), hang);
        float e = 6.;
        vec3 N = normalize(vec3(groundH(p - vec2(e, 0.)) - groundH(p + vec2(e, 0.)), 2. * e, groundH(p - vec2(0., e)) - groundH(p + vec2(0., e))));
        N = normalize(N + vec3((blades - .5) * .5, 0., (gust - .5) * .5) * near);
        vec3 V = normalize(uCamL - vP);
        vec3 c = lawN(alb, vP, N, V, 1., n);
        c += vec3(.75, .8, 1.) * daisy * n * .22 * uGain * (.6 + .4 * sin(uTime * 1.7 + fh * 40.));   // daisies glimmer in the night
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  mat.uniforms.uGrassA = W.MU.uGrassA; mat.uniforms.uGrassB = W.MU.uGrassB; mat.uniforms.uFlower = W.MU.uFlower;
  mat.uniforms.uSeed = W.MU.uSeed; mat.uniforms.uAccent = W.MU.uAccent; mat.uniforms.uFlowerAmt = W.MU.uFlowerAmt; mat.uniforms.uPicXZ = W.MU.uPicXZ;
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}

// the beech hanger: a far wall of crowns that closes the bowl, deep in haze
function makeHanger(W) {
  const seg = 220, pos = [], idx = [], rnd = W.rng.fork('hanger');
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * TAU, r = 905 + Math.sin(a * 3 + 1) * 40 + Math.sin(a * 7) * 18;
    const top = 30 + 22 * W.noise.fbm2(Math.cos(a) * 9, Math.sin(a) * 9, 3) + rnd.range(-3, 3) + 9 * Math.abs(Math.sin(i * 1.3));
    const y0 = groundH(Math.sin(a) * r, Math.cos(a) * r) - 8;
    pos.push(Math.sin(a) * r, y0, Math.cos(a) * r, Math.sin(a) * (r + 30), y0 + 8 + top, Math.cos(a) * (r + 30));
    if (i < seg) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const mat = lawMat(W, {
    uniforms: { uHanger: { value: col(W.look.S.hanger) } }, side: THREE.DoubleSide,
    vert: /* glsl */`void main(){ vP = position; vN = vec3(0., 1., 0.);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`,
    frag: /* glsl */`uniform vec3 uHanger;
      void main(){
        float a = safeAng(vP.zx) * 140.;
        float crowns = vn2(vec2(a, vP.y * .09)) * .6 + vn2(vec2(a * 2.7, vP.y * .23 + 4.)) * .4;
        vec3 alb = uHanger * (.5 + .9 * crowns) * (.6 + .012 * vP.y);
        vec3 c = alb * (uSunCol * .55 + uSkyCol * 1.2);
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}

// distance to the mown footpath (a polyline sampled from the flight line)
const NP = 18;
const PATH_GLSL = /* glsl */`
uniform vec2 uPath[${NP}];
float pathD(vec2 p){
  float d = 1e4;
  for (int i = 0; i < ${NP - 1}; i++){
    vec2 a = uPath[i], ab = uPath[i + 1] - a;
    float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-3), 0., 1.);
    d = min(d, length(p - a - ab * t));
  }
  return d;
}`;

// grass tufts: instanced crossed cards, wrapped in a window that travels with the camera, bent by the gust field
function makeTufts(W, count, win, ahead, wide, tall, cards = 3) {
  const rnd = W.rng.fork('tufts' + win);
  const card = new THREE.PlaneGeometry(1, 1, 1, 2); card.translate(0, 0.5, 0);
  const base = mergeGeometries(cards === 3 ? [card, card.clone().rotateY(TAU / 6), card.clone().rotateY(TAU / 3)] : [card, card.clone().rotateY(TAU / 4)]);
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv;
  const aI = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { aI[i * 4] = rnd() * win; aI[i * 4 + 1] = rnd() * win; aI[i * 4 + 2] = rnd(); aI[i * 4 + 3] = rnd(); }
  g.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4)); g.instanceCount = count;
  const mat = lawMat(W, {
    uniforms: { ...W.MU, uWin: { value: win }, uCen: W.cen[ahead], uSize: { value: new THREE.Vector2(wide, tall) }, uPond: W.hero.uniforms.uPond, uPath: W.uPath },
    side: THREE.DoubleSide,
    vert: MEADOW_GLSL + HEIGHT_GLSL + PATH_GLSL + /* glsl */`
      attribute vec4 aI; uniform float uWin; uniform vec2 uCen, uSize; uniform vec4 uPond;
      varying vec2 vUv; varying vec3 vC; varying vec3 vCf; varying float vK; varying float vFl;
      void main(){
        vec2 w = mod(aI.xy - uCen + uWin * .5, uWin) - uWin * .5;
        vec2 b = uCen + w;
        float edge = 1. - smoothstep(.36, .5, length(w) / uWin);
        float gy = groundH(b);
        vec3 bp = vec3(b.x, gy + .3, b.y);
        float n = nightAll(bp), oakIn = nightN(bp);
        float r = length(b);
        float keep = edge * smoothstep(15., 17.5, length(b - uPond.xy)) * smoothstep(6., 10., r);
        keep *= smoothstep(1.5, 2.5, length(b - uPicXZ));                // the picnic's trampled patch
        float mown = smoothstep(.5, 1.3, pathD(b));
        float h = uSize.y * (.6 + .6 * aI.z) * mix(1., .6, oakIn) * mix(.22, 1., mown) * keep;
        float ca = cos(aI.w * 6.2832), sa = sin(aI.w * 6.2832);
        float wd = uSize.x * clamp(h / uSize.y * 1.3, .4, 1.) * mix(1., 1.45, oakIn);
        vec3 lp = vec3(position.x * wd, position.y * h, position.z * wd);
        lp.xz = vec2(ca * lp.x - sa * lp.z, sa * lp.x + ca * lp.z);
        float gust = gustAt(b);
        float bend = (gust - .35) * .75 + .06 * sin(uTime * 3.1 + aI.z * 40. + b.x);
        vec3 p = vec3(b.x, gy + .1, b.y) + lp;
        p.xz += uWind * bend * position.y * position.y * h;
        p.y -= abs(bend) * .25 * position.y * position.y * h;
        vP = p; vUv = uv; vK = aI.z;
        vec3 alb = mix(uGrassA, uGrassB, .25 + .5 * uv.y + .25 * aI.w) * (.74 + .5 * gust);
        alb = mix(alb, vec3(.5, .46, .16), .4 * aI.w * aI.z);
        alb = mix(alb, uSeed * .8, smoothstep(.6, 1., uv.y) * step(.45, aI.z) * mown);
        // under the Oak the sward is blue-green in every season (September's straw would go grey-beige by moonlight)
        alb = mix(alb, mix(alb * vec3(.7, 1.3, 1.12), dot(alb, vec3(.3, .5, .2)) * vec3(.5, 1.12, .92) * 1.3, .72), oakIn);
        vec3 N = normalize(vec3(uWind.x * bend, 1., uWind.y * bend) + uSunDir * .35);
        vN = N;
        vC = lawN(alb, p, N, normalize(uCamL - p), mix(mix(.3 + .7 * uv.y, .8 + .2 * uv.y, step(1., uSize.x)), 1., n * .5), n) * (1. + .5 * n * uv.y);
        vC *= mix(vec3(1.), vec3(.84, 1.02, 1.1), oakIn);
        // under the Oak the blades are rimmed ivory-blue toward the moon, brightest in its pool on the lawn
        float dmn = length(uMoon - p), mpool = smoothstep(27., 6., dmn);
        vC += oakIn * uMoonCol * vec3(.8, .93, 1.12) * uv.y * uv.y * (.02 + .08 * mpool + .05 / (1. + dmn * dmn / 900.)) * (.6 + .8 * aI.z);
        // the sward keeps its deep blue-green to the last (no grey as the eye adapts toward the arch), and where the
        // arch's fan of day lies on it each blade is sunlit grass again, lit from behind, with a bright gold tip
        vec3 Le; float fk = clamp(exitFan(p, Le) * .55, 0., 1.) * oakIn;
        float l0 = dot(vC, vec3(.3, .5, .2)); vC = mix(vC, mix(vec3(l0), vC, 1.6) * vec3(.74, 1.02, .9) / (1. + 1.4 * l0), oakIn * (1. - fk));
        vec3 sunAlb = mix(mix(uGrassA, uGrassB, .3 + .5 * uv.y) * vec3(1., 1.05, .7), vec3(.5, .4, .15), .45);
        vC = mix(vC, vC * .35 + uSunCol * vec3(1.12, .72, .26) * sunAlb * (.4 + 1.5 * uv.y * uv.y), fk);
        vCf = lawN(uFlower, p, N, normalize(uCamL - p), 1., n);
        vFl = (.12 + .8 * driftAt(b)) * uFlowerAmt * mown * (1. - oakIn);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        if (h < .02) gl_Position = vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    frag: /* glsl */`
      varying vec2 vUv; varying vec3 vC; varying vec3 vCf; varying float vK; varying float vFl;
      void main(){
        // five tapering blades per card, some of them carrying a buttercup
        float x = vUv.x * 5. + vK * 3.;
        float bl = abs(fract(x) - .5) * 2.;
        float len = .55 + .45 * h11(floor(x) + vK * 17.);
        float head = step(h11(floor(x) + vK * 5. + 5.), vFl) * step(length(vec2((fract(x) - .5) * .2, vUv.y - len + .07)), .062);
        if (head < .5 && (vUv.y > len || bl > (1. - vUv.y / len) * .9 + .04)) discard;
        vec3 c = mix(vC * (.75 + .5 * h11(floor(x) + 3.)), vCf * (.85 + .3 * h11(floor(x) + 9.)), head);
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}

// flowers: buttercups in drifts, ox-eye daisies, sorrel spikes; small billboards riding the same gusts
function makeFlowers(W, count, win, ahead) {
  const rnd = W.rng.fork('flowers');
  const g = new THREE.InstancedBufferGeometry(); const q = new THREE.PlaneGeometry(1, 1);
  g.index = q.index; g.attributes.position = q.attributes.position; g.attributes.uv = q.attributes.uv;
  const aI = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { aI[i * 4] = rnd() * win; aI[i * 4 + 1] = rnd() * win; aI[i * 4 + 2] = rnd(); aI[i * 4 + 3] = rnd(); }
  g.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4)); g.instanceCount = count;
  const mat = lawMat(W, {
    uniforms: { ...W.MU, uWin: { value: win }, uCen: W.cen[ahead], uPond: W.hero.uniforms.uPond, uPath: W.uPath },
    side: THREE.DoubleSide,
    vert: MEADOW_GLSL + HEIGHT_GLSL + PATH_GLSL + /* glsl */`
      attribute vec4 aI; uniform float uWin; uniform vec2 uCen; uniform vec4 uPond;
      varying vec2 vUv; varying vec3 vC; varying vec3 vE; varying float vKind;
      void main(){
        vec2 w = mod(aI.xy - uCen + uWin * .5, uWin) - uWin * .5;
        vec2 b = uCen + w;
        float edge = 1. - smoothstep(.36, .5, length(w) / uWin);
        float gy = groundH(b);
        vec3 bp = vec3(b.x, gy + .5, b.y);
        float n = nightAll(bp), oakIn = nightN(bp);
        float kind = aI.w < .72 ? 0. : (aI.w < .9 ? 1. : 2.);         // buttercup, daisy, sorrel
        float drift = driftAt(b);
        float want = kind < .5 ? (.3 + .7 * drift) * uFlowerAmt : (kind < 1.5 ? .22 + .2 * uFlowerAmt : .5);
        float driftN = smoothstep(.36, .68, fbm2(b * .085 + 21.));
        want = mix(want, kind > 1.5 ? .1 : (kind > .5 ? .1 + .5 * driftN : .02 + .42 * driftN * driftN), oakIn);
        float keep = edge * step(aI.z, want * 1.25) * smoothstep(15.5, 18., length(b - uPond.xy)) * smoothstep(7., 11., length(b));
        keep *= smoothstep(.6, 1.4, pathD(b)) * smoothstep(1.5, 2.4, length(b - uPicXZ));
        float gust = gustAt(b);
        float hgt = (.55 + .4 * h11(aI.z * 91.)) * mix(1., .5, oakIn);
        float sz = (kind < .5 ? .15 : (kind < 1.5 ? .2 : .13)) * (.8 + .5 * h11(aI.w * 53.)) * keep;
        sz *= kind < .5 ? mix(1. - .45 * n, .95, oakIn) : 1.;                       // buttercups close for the night; campion opens
        vec3 c0 = vec3(b.x, gy + .1 + hgt, b.y);
        c0.xz += uWind * ((gust - .35) * .5 + .05 * sin(uTime * 3.3 + aI.z * 50.)) * hgt;
        vec4 mv = modelViewMatrix * vec4(c0, 1.);
        vec2 q = position.xy * sz; if (kind > 1.5) q.y *= 2.6;
        mv.xy += q;
        vP = c0; vUv = uv; vKind = kind; vN = vec3(0., 1., 0.);
        vec3 alb = kind < .5 ? mix(uFlower, vec3(.7, .73, .74), oakIn) : (kind < 1.5 ? vec3(.82, .84, .8) * (1. - .2 * oakIn) : uAccent * .8);
        vC = lawN(alb, c0, normalize(vec3(0., 1., 0.) + uSunDir * .5), normalize(uCamL - c0), 1., n);
        vE = vec3(.7, .78, 1.) * uGain * (.6 + .4 * sin(uTime * 1.7 + aI.z * 40.)) * (kind < .5 ? oakIn * .16 : (kind < 1.5 ? n * .2 : 0.));
        vec4 mvPosition = mv; gl_Position = projectionMatrix * mv;
        if (sz < .01) gl_Position = vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    frag: /* glsl */`
      varying vec2 vUv; varying vec3 vC; varying vec3 vE; varying float vKind;
      void main(){
        vec2 d = vUv - .5; float r = length(d) * 2.;
        float a = safeAng(d);
        vec3 c = vC;
        if (vKind < .5) { if (r > .72 + .28 * cos(a * 5.)) discard; c *= .8 + .35 * r; c += vE; }
        else if (vKind < 1.5) { if (r > .6 + .4 * abs(cos(a * 6.))) discard; c = mix(vC * vec3(1., .8, .25), vC, smoothstep(.22, .3, r)) + vE; }
        else { if (abs(d.x) > .16 * (1. - vUv.y) + .04 || h21(floor(vUv * vec2(3., 14.))) < .3) discard; }
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}

// ---------------------------------------------------------------------------------------------------
// LESSER TREES: hawthorns, field maples, one ash. Each owns a small night (slot in uTrees).
const KINDS = {
  hawthorn: { h: 8, R: 10, H: 7, trunk: 0.32, blobs: 9, spread: 4.2, blob: [1.5, 2.6] },
  maple: { h: 14, R: 13, H: 10, trunk: 0.5, blobs: 13, spread: 6.0, blob: [2.2, 3.8] },
  ash: { h: 22, R: 16, H: 13, trunk: 0.7, blobs: 17, spread: 7.5, blob: [2.6, 4.6] },
};
function placeTrees(W, path, ringU) {
  const rnd = W.rng.fork('trees'), out = [];
  const add = (x, z, kind, s = rnd.range(0.9, 1.12)) => out.push({ x, z, kind, ...KINDS[kind], y: groundH(x, z), s });
  const side = (d, off) => { const p = path.posAtDist(d), t = path.tangentAtDist(d); return [p.x + -t.z * off, p.z + t.x * off]; };  // off > 0 = starboard
  // the old thorn: a big hawthorn 66 m in, its pocket of night whole in the first view; the flight passes 5 m from its stem
  add(...side(W.dThorn, 5.2), 'hawthorn', 1.9);
  add(...side(212, 46), 'maple');                            // the swallows' maple, to starboard of the open run (hidden behind the thorn's night in the first view)
  add(...side(122, 74), 'ash');
  const e0 = path.posAtDist(0), h0 = path.tangentAtDist(0);
  let guard = 0;
  while (out.length < Math.min(W.look.trees, NT - 2) && guard++ < 500) {
    const d = rnd.range(-40, path.length * ringU + 40), off = (rnd() < 0.5 ? -1 : 1) * rnd.range(34, 240);
    const [x, z] = side(Math.max(0, d), off), kind = rnd() < 0.55 ? 'hawthorn' : 'maple', K = KINDS[kind];
    if (Math.hypot(x, z) < 150 + K.R) continue;
    // the first view holds the thorn's night and, far off to port, the Oak's: no other dome stands in it or overlaps them
    { const dx = x - e0.x, dz = z - e0.z, dl = Math.hypot(dx, dz); if (dl < 520 && (dx * h0.x + dz * h0.z) / dl > 0.64) continue; }
    if (path.nearestXZ(x, z).dist < K.R + 16) continue;
    if (out.some((t) => Math.hypot(t.x - x, t.z - z) < t.R + K.R + 14)) continue;
    add(x, z, kind);
  }
  return out.slice(0, NT - 2);
}

async function makeTrees(W, ctx) {
  const rnd = W.rng.fork('treegeo'), parts = [];
  const push = (g, kind, tree) => {
    const n = g.attributes.position.count, k = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { k[i * 2] = kind; k[i * 2 + 1] = tree; }
    g.setAttribute('aK', new THREE.BufferAttribute(k, 2)); g.deleteAttribute('uv'); parts.push(g.index ? g.toNonIndexed() : g);
  };
  // a limb is a bent, tapering, knuckled tube (never a straight stick): it bows sideways, twists, and swells at its foot
  const _d = new THREE.Vector3(), _s = new THREE.Vector3(), _u = new THREE.Vector3(), _c = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), XA = new THREE.Vector3(1, 0, 0);
  const limb = (a, b, r0, r1, ti, flare = 0) => {
    _d.subVectors(b, a); const L = _d.length(); _d.normalize();
    _s.crossVectors(_d, Math.abs(_d.y) > 0.9 ? XA : UP).normalize(); _u.crossVectors(_d, _s);
    const nr = 9, ns = Math.max(4, Math.round(L / 0.55)), pos = [], idx = [], ph = a.x * 1.7 + a.z * 2.3 + a.y;
    for (let j = 0; j <= ns; j++) {
      const t = j / ns, bow = Math.sin(t * Math.PI) * L * 0.07, r = (r0 + (r1 - r0) * t) * (1 + flare * Math.exp(-t * 7)) * (1 + 0.13 * Math.sin(t * 9 + ph));
      _c.copy(a).addScaledVector(_d, t * L).addScaledVector(_s, bow * Math.sin(ph) + 0.35 * r0 * Math.sin(t * 7 + ph * 2)).addScaledVector(_u, bow * Math.cos(ph) + 0.35 * r0 * Math.sin(t * 5.3 + ph));
      for (let k = 0; k < nr; k++) {
        const an = (k / nr) * TAU, tw = an + t * 2.2 + ph, rr = r * (1 + 0.2 * Math.sin(tw * 3) + 0.09 * Math.sin(tw * 5 + 1.3) + flare * 0.5 * Math.exp(-t * 9) * Math.pow(Math.abs(Math.sin(an * 2.5 + ph)), 3));
        pos.push(_c.x + (_s.x * Math.cos(an) + _u.x * Math.sin(an)) * rr, _c.y + (_s.y * Math.cos(an) + _u.y * Math.sin(an)) * rr, _c.z + (_s.z * Math.cos(an) + _u.z * Math.sin(an)) * rr);
      }
      if (j < ns) for (let k = 0; k < nr; k++) { const p0 = j * nr + k, p1 = j * nr + ((k + 1) % nr); idx.push(p0, p0 + nr, p1, p1, p0 + nr, p1 + nr); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    push(g, 0, ti);
  };
  W.blobs = [];
  const ico = [2, 1].map((d) => mergeVertices(new THREE.IcosahedronGeometry(1, d).deleteAttribute('normal').deleteAttribute('uv')));   // near trees finer, far ones coarse under their sprays
  for (let ti = 0; ti < W.trees.length; ti++) {
    const t = W.trees[ti];
    await ctx.yield();
    const base = new THREE.Vector3(t.x, t.y - 0.3, t.z), h = t.h * t.s;
    const lean = new THREE.Vector3(rnd.range(-0.6, 0.6), 0, rnd.range(-0.6, 0.6));
    const fork = base.clone().add(new THREE.Vector3(lean.x, h * 0.34, lean.z));
    const tk = t.trunk * Math.max(1, t.s);
    limb(base, fork, tk * 1.5, tk * 0.85, ti, 0.9);
    await ctx.yield();
    const nb = t.kind === 'hawthorn' ? 4 : 5, tips = [];
    for (let i = 0; i < nb; i++) {
      const a = (i / nb) * TAU + rnd.range(-0.4, 0.4), out = t.spread * Math.max(1, t.s) * rnd.range(0.55, 0.95);
      const tip = fork.clone().add(new THREE.Vector3(Math.sin(a) * out, h * rnd.range(0.22, 0.5), Math.cos(a) * out));
      const mid = fork.clone().lerp(tip, 0.5).add(new THREE.Vector3(0, h * 0.06, 0));
      limb(fork.clone().setY(fork.y - tk * 0.5), mid, tk * 0.66, tk * 0.44, ti); limb(mid, tip, tk * 0.44, tk * 0.15, ti); tips.push(tip);
    }
    await ctx.yield();
    for (let i = 0; i < t.blobs; i++) {
      if (i === 5) await ctx.yield();
      const tip = tips[i % tips.length], r = rnd.range(t.blob[0], t.blob[1]) * t.s;
      const c = tip.clone().add(new THREE.Vector3(rnd.range(-1, 1), rnd.range(-0.3, 1.1), rnd.range(-1, 1)).multiplyScalar(r * 0.75));
      if (i >= tips.length) c.lerp(new THREE.Vector3(t.x, base.y + h * rnd.range(0.62, 0.92), t.z), rnd.range(0.2, 0.7));
      c.y = Math.max(c.y, t.y + 2.2 + r * 0.72);              // the browse line: the night beneath is open to view
      W.blobs.push({ c: c.clone(), r, ti, haw: t.kind === 'hawthorn' });
      const g = ico[ti < 3 ? 0 : 1].clone(), p = g.attributes.position, ph = rnd() * 9;
      for (let j = 0; j < p.count; j++) {
        const x = p.getX(j), y = p.getY(j), z = p.getZ(j);
        const lump = 1 + 0.2 * Math.sin(x * 4.1 + ph) * Math.sin(y * 3.7 + ph * 2) * Math.sin(z * 4.5 - ph) + 0.1 * Math.sin(x * 9 + z * 7 + ph);
        p.setXYZ(j, c.x + x * r * lump * 0.86, c.y + y * r * 0.74 * lump * (y < 0 ? 0.62 : 1) * 0.86, c.z + z * r * lump * 0.86);
      }
      g.computeVertexNormals(); push(g, t.kind === 'hawthorn' ? 2 : 1, ti);
    }
  }
  await ctx.yield();
  const geo = mergeGeometries(parts); parts.forEach((g) => g.dispose());
  await ctx.yield();
  const S = W.look.S;
  const mat = lawMat(W, {
    uniforms: { uLeafA: { value: col(S.leafA) }, uLeafB: { value: col(S.leafB) }, uBlossom: { value: W.look.blossom ? 1 : 0 }, uBare: { value: S.snow } }, side: THREE.DoubleSide,
    vert: /* glsl */`
      attribute vec2 aK; varying vec2 vK;
      void main(){ vec3 p = position; vK = aK;
        float sway = sin(uTime * 1.3 + p.x * .3 + p.z * .2) * .5 + sin(uTime * 2.9 + p.z * .9) * .2;
        p.xz += uWind * sway * (aK.x > .5 ? .16 : .03) * smoothstep(1., 9., p.y);
        vP = p; vN = normal;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    frag: /* glsl */`
      uniform vec3 uLeafA, uLeafB; uniform float uBlossom, uBare; varying vec2 vK;
      void main(){
        vec3 N = normalize(vN), V = normalize(uCamL - vP);
        float ndv = abs(dot(N, V)), back = gl_FrontFacing ? 1. : .45;
        vec3 alb; float ao = 1., rid = 0.;
        if (vK.x > .5) {
          float f = vn3(vP * 2.3 + uTime * .12) * .55 + vn3(vP * 6.5) * .45;
          if (f < .3 + smoothstep(.6, .0, ndv) * .5 + uBare * .25) discard;      // ragged, leafy edges; a frosted tree is half bare
          alb = mix(uLeafA, uLeafB, smoothstep(.25, .8, f) * (.5 + .5 * N.y));
          alb = mix(alb, vec3(.86, .8, .82), uBlossom * step(1.5, vK.x) * step(.5, vn3(vP * 9.)) * .85);
          alb = mix(alb, vec3(.8, .86, .9), uBare * .6);
          ao = (.4 + .6 * smoothstep(.3, .8, f)) * back;
          N = normalize(N + (vec3(vn3(vP * 5.), vn3(vP * 5. + 7.), vn3(vP * 5. + 13.)) - .5) * .9);
        } else {
          // ridged bark: plates between deep cracks, twisting round the limb; the ridges catch the light
          vec4 tr = uTrees[int(vK.y + .5)];
          vec2 ob = vP.xz - tr.xy; float tw = vP.y * .16;
          vec3 bq3 = vec3(ob.x * cos(tw) - ob.y * sin(tw), vP.y * .17, ob.x * sin(tw) + ob.y * cos(tw)) * 3.4;
          vec2 bq = bq3.xz + bq3.y;
          float r1 = abs(vn3(bq3) - .5) * 2., r2 = abs(vn3(bq3 * vec3(2.7, 4.5, 2.7) + 7.) - .5) * 2.;
          rid = smoothstep(.04, .34, r1) * (.55 + .45 * smoothstep(.0, .3, r2));
          vec3 dpx = dFdx(vP), dpy = dFdy(vP); float hx = dFdx(rid), hy = dFdy(rid);
          vec3 gr = (dpx * hx + dpy * hy) / max(dot(dpx, dpx) + dot(dpy, dpy), 1e-6);
          N = normalize(N - clamp(gr * .12, -1.1, 1.1));
          alb = mix(vec3(.014, .012, .012), mix(vec3(.085, .07, .056), vec3(.15, .13, .105), vn2(bq * 2.)), rid);
          alb = mix(alb, vec3(.16, .23, .1), smoothstep(.5, .85, vn2(bq * .9 + 3.)) * smoothstep(.1, .7, N.y + .35) * .6);   // moss
          ao = .25 + .75 * rid;
        }
        float nn = nightAll(vP);
        vec3 c = lawN(alb, vP, N, V, ao, nn);
        if (vK.x > .5) c += uMoonCol * alb * nn * uGain * 1.6 * smoothstep(.62, .9, vn3(vP * 7. + 3.)) * back;   // leaves catching starlight
        else {
          // in its night the wood is lit by its own stars from above and by the dusk hem from outside
          vec4 tr = uTrees[int(vK.y + .5)]; vec2 ow = vP.xz - tr.xy; ow = ow / max(length(ow), 1e-3);
          float hgt = clamp((vP.y - uTreeY[int(vK.y + .5)]) / max(tr.w, 1.), 0., 1.);
          float rimv = 1. - max(dot(N, V), 0.);
          c += nn * uGain * (vec3(.4, .47, .78) * (alb * .55 + .004) * (.35 + .65 * max(N.y * .6 + .4, 0.)) + vec3(.5, .62, 1.) * rid * rimv * rimv * .05);
          float out1 = max(dot(N.xz, ow), 0.);
          c += nn * uGain * uRampA * (alb * 1.3 + .02) * out1 * out1 * (1. - hgt) * (1. - hgt) * .8;
        }
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; return m;
}

// leaf sprays on the lesser trees: cards of a dozen small leaves each, standing out of every leaf mass so that no
// crown has a smooth or faceted outline and stars show through the gaps (the thorn by the line gets the most)
async function makeTreeLeaves(W, ctx) {
  const rnd = W.rng.fork('treeleaf'), pos = [], uv = [], nor = [], aK = [];
  const d = new THREE.Vector3(), nn = new THREE.Vector3(), s1 = new THREE.Vector3(), s2 = new THREE.Vector3(), c = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  let done = 0;
  for (const b of W.blobs) {
    if (done > 700) { done = 0; await ctx.yield(); }
    const n = Math.round((b.haw ? 44 : 34) * W.look.detail * (b.ti === 0 ? 3 : 1));
    done += n;
    for (let i = 0; i < n; i++) {
      const y = rnd.range(-0.75, 1), a = rnd() * TAU, q = Math.sqrt(Math.max(0, 1 - y * y));
      d.set(Math.cos(a) * q, y, Math.sin(a) * q);
      const rr = b.r * rnd.range(0.7, 1.02);
      c.set(b.c.x + d.x * rr, b.c.y + d.y * rr * 0.74 * (y < 0 ? 0.62 : 1), b.c.z + d.z * rr);
      nn.set(d.x + rnd.range(-0.7, 0.7), d.y + rnd.range(-0.7, 0.7), d.z + rnd.range(-0.7, 0.7)).normalize();
      s1.crossVectors(nn, UP); if (s1.lengthSq() < 1e-4) s1.set(1, 0, 0); s1.normalize(); s2.crossVectors(s1, nn);
      const tw = rnd() * TAU, cw = Math.cos(tw), sw = Math.sin(tw), sz = (b.haw ? 0.62 : 0.85) * rnd.range(0.75, 1.3) * (b.ti === 0 ? 1.5 : 1), h = rnd();
      for (const [ux, uy] of [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]]) {
        const x = (ux - 0.5) * 2 * sz, yv = (uy - 0.5) * 2 * sz, X = x * cw - yv * sw, Y = x * sw + yv * cw;
        pos.push(c.x + s1.x * X + s2.x * Y, c.y + s1.y * X + s2.y * Y, c.z + s1.z * X + s2.z * Y);
        uv.push(ux, uy); nor.push(nn.x, nn.y, nn.z); aK.push(h, b.ti, b.haw ? 1 : 0);
      }
    }
  }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(aK, 3));
  await ctx.yield();
  const S = W.look.S;
  const mat = lawMat(W, {
    uniforms: { uLeafA: { value: col(S.leafA) }, uLeafB: { value: col(S.leafB) }, uBlossom: { value: W.look.blossom ? 1 : 0 }, uBare: { value: S.snow } }, side: THREE.DoubleSide,
    vert: /* glsl */`
      attribute vec3 aK; varying vec3 vK; varying vec2 vUv;
      void main(){ vec3 p = position; vK = aK; vUv = uv;
        float sway = sin(uTime * 1.3 + p.x * .3 + p.z * .2) * .5 + sin(uTime * 2.9 + p.z * .9 + aK.x * 20.) * .3;
        p.xz += uWind * sway * .2 * smoothstep(1., 9., p.y); p.y += .05 * sin(uTime * 2.3 + aK.x * 40.);
        vP = p; vN = normal;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    frag: /* glsl */`
      uniform vec3 uLeafA, uLeafB; uniform float uBlossom, uBare; varying vec3 vK; varying vec2 vUv;
      void main(){
        vec2 g = vUv * vec2(3., 4.), id = floor(g), f = fract(g) - .5;
        float h = h21(id + vK.x * 37.), h2 = h21(id + 5. + vK.x * 11.);
        float ca = cos(h * 6.2832), sa = sin(h * 6.2832);
        vec2 q = vec2(ca * f.x - sa * f.y, sa * f.x + ca * f.y);
        float dd = q.x * q.x / .19 + q.y * q.y / .045;
        if (dd > 1. || h2 < .2 + uBare * .45) discard;
        vec3 N = normalize(vN), V = normalize(uCamL - vP); if (dot(N, V) < 0.) N = -N;
        N = normalize(N + vec3(h - .5, .3, h2 - .5) * .7);
        vec3 alb = mix(uLeafA, uLeafB, .25 + .75 * h2) * (.8 + .4 * (1. - dd)) * (1. - .35 * smoothstep(.03, .0, abs(q.y)));
        alb = mix(alb, vec3(.9, .84, .86), uBlossom * vK.z * step(.62, h));
        alb = mix(alb, vec3(.8, .86, .9), uBare * .6);
        float nn = nightAll(vP);
        vec3 c = lawN(alb, vP, N, V, .55 + .45 * h2, nn);
        c += (1. - nn) * alb * uSunCol * .45 * max(dot(-N, uSunDir), 0.);                 // sun through the leaf
        c += nn * uGain * (alb * vec3(.4, .55, 1.1) * .9 + uMoonCol * alb * 1.2 * step(.8, h));   // starlit, a few leaves glinting
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}

// the small nights: one hemisphere per slot, shaped in the vertex shader by the law's own radius function,
// drawn twice like the oak's: back faces = star wall, front faces = blue chord veil with near stars.
const FOGAMT_GLSL = /* glsl */`
float fogAmt(){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      return smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #else
    return 0.;
  #endif
}`;
function makeSmallDomes(W) {
  const parts = [];
  for (let i = 0; i < NT; i++) {
    const g = new THREE.SphereGeometry(1, 36, 10, 0, TAU, 0, Math.PI * 0.5).toNonIndexed();
    g.setAttribute('aIdx', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(i), 1));
    g.deleteAttribute('uv'); g.deleteAttribute('normal'); parts.push(g);
  }
  const geo = mergeGeometries(parts); parts.forEach((g) => g.dispose());
  const pal = W.look.S.pal;
  const skyU = { uSkyLo: { value: col(pal[3]).multiplyScalar(1.7) }, uSkyHi: { value: col('#1A2A6E').multiplyScalar(1.35) }, uMilky: { value: col('#AEB8F0').multiplyScalar(W.look.moon === 'none' ? 1.1 : 0.7) }, uMeteorP: { value: W.look.moon === 'none' ? 2.1 : 6.3 }, uStarPx: W.starPx };
  const vert = HEIGHT_GLSL + /* glsl */`
    attribute float aIdx; varying vec3 vU; varying vec4 vT; varying float vI; varying float vBase;
    void main(){ vU = normalize(position);
      vec4 t = uTrees[int(aIdx + .5)]; vT = t; vI = aIdx;
      float a = safeAng(vU.zx), rad = treeRad(t, a, aIdx);
      float gy = uTreeY[int(aIdx + .5)] - .5; vBase = gy;
      vec3 p = vec3(t.x + vU.x * rad, gy + vU.y * (rad * t.w / t.z + .5), t.y + vU.z * rad);
      vP = p; vN = vU;
      vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
      if (t.z < 1.5) gl_Position = vec4(2., 2., 2., 1.);
      #include <fog_vertex>
    }`;
  const fragHead = FRAG_HEAD + NIGHT_SKY_GLSL + FOGAMT_GLSL + /* glsl */`
    varying vec3 vU; varying vec4 vT; varying float vI; varying float vBase;`;
  const uniforms = () => ({ ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...W.U, ...skyU });
  const wall = new THREE.ShaderMaterial({
    uniforms: uniforms(), fog: true, side: THREE.BackSide, vertexShader: VERT_HEAD + WORLD_LAW_GLSL + vert,
    fragmentShader: fragHead + /* glsl */`
      void main(){
        vec3 dir = normalize(vU * vec3(1., 1., 1.)); dir.y = abs(dir.y);
        vec3 w = wheel(dir);
        vec3 c = nightSky(dir, starPix(w, 46.), starPix(w, 19.));
        float cut = .2 * vT.w + .25 * (vn2(vec2(safeAng(vU.zx) * 30., uTime * .6)) - .5);
        float hy = vP.y - vBase - .5 - cut;
        if (hy < 0.) discard;
        float t = pow(clamp(hy / (.26 * vT.w + 1.), 1e-4, 1.), uHem.y);
        vec3 dusk = mix(mix(uRampA, uRampB, smoothstep(.0, .38, t)), uRampC, smoothstep(.3, .72, t));
        c = mix(c, dusk * (1.15 - .55 * t), 1. - smoothstep(.45, 1., t));
        float camIn = 1. - smoothstep(-2., 2., treeD(uCamL - vec3(0., vBase, 0.), vT, vI));
        // far off a small dome is a pool of deep blue with a handful of stars, not a heap of glitter
        float farK = smoothstep(2.2, 6., length(vP - uCamL) / max(vT.z, 1.)) * (1. - camIn);
        float keep = 1. - smoothstep(.45, 1., t);
        vec3 cFar = mix(mix(uSkyHi, uSkyLo, smoothstep(.0, .75, dir.y)) * .62 + starGrid(w, 4., 41., 0.) * 1.2, c, keep);
        c = mix(c, cFar, farK);
        c *= mix(1., uGain, camIn);
        vec3 pre = c; gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
        gl_FragColor.rgb = mix(gl_FragColor.rgb, pre, max(camIn, .55));
      }`,
  });
  const veil = new THREE.ShaderMaterial({
    uniforms: { ...uniforms(), uVeil: { value: col(pal[3]).lerp(col('#1A2A6E'), 0.45).multiplyScalar(1.5) } },
    fog: true, side: THREE.FrontSide, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: VERT_HEAD + WORLD_LAW_GLSL + vert,
    fragmentShader: fragHead + /* glsl */`
      uniform vec3 uVeil;
      void main(){
        float k = vT.z / max(vT.w, .1);
        vec3 sc = vec3(1., k, 1.), cen = vec3(vT.x, vBase, vT.y);
        vec3 o = (uCamL - cen) * sc, dv = (vP - uCamL) * sc; float dl = max(length(dv), 1e-3); vec3 d = dv / dl;
        float R = length((vP - cen) * sc);
        float b = dot(o, d), cc = dot(o, o) - R * R, sq = sqrt(max(b * b - cc, 0.));
        float t0 = max(-b - sq, 0.), t1 = -b + sq;
        if (d.y < -1e-4) t1 = min(t1, -o.y / d.y);
        float chord = max(t1 - t0, 0.);
        float camD = treeD(uCamL - vec3(0., vBase, 0.), vT, vI);
        float vis = smoothstep(0., 6., camD);
        float a = .7 * smoothstep(0., 1., chord / (1.3 * vT.z)) * vis;
        vec3 dir = normalize(vU); dir.y = abs(dir.y);
        vec3 w = wheel(dir);
        vec3 st = starGrid(w, 30., 31., starPix(w, 30.)) * 1.2 + starGrid(w, 15., 5., starPix(w, 15.)) * 1.5;
        float farK = smoothstep(2.2, 6., length(vP - uCamL) / max(vT.z, 1.));
        st = st * (1. - .97 * farK) + starGrid(w, 3., 23., 0.) * 1.3 * farK;
        st *= smoothstep(.12, .45, abs(dot(normalize(vU * vec3(1., k, 1.)), -d)));
        float t = pow(clamp((vP.y - vBase - .5) / (.2 * vT.w + 1.), 1e-4, 1.), uHem.y);
        vec3 dusk = mix(mix(uRampA, uRampB, smoothstep(.0, .4, t)), uRampC, smoothstep(.3, .8, t)) * (1. - t) * (1. - t) * .5;
        vec3 c = uVeil * a + (st * smoothstep(.02, .25, chord / vT.z) + dusk) * vis;
        c = mix(c, fogColor * a, fogAmt() * (.45 - .25 * farK));
        gl_FragColor = vec4(c, a);
      }`,
  });
  const mw = new THREE.Mesh(geo, wall); mw.frustumCulled = false; mw.renderOrder = -0.4;
  const mv = new THREE.Mesh(geo, veil); mv.frustumCulled = false; mv.renderOrder = 21;
  return [mw, mv];
}

// fireflies in every small night, stars leaking downwind and melting, snow that falls only inside the nights,
// and the spill's own swarm (slot NT-1). Positions are stored relative to the slot so they follow a moving night.
function makeSprites(W) {
  const rnd = W.rng.fork('sprites'), L = W.look, pos = [], aS = [], aT = [];
  const put = (slot, type, n) => {
    for (let i = 0; i < n; i++) {
      const a = rnd() * TAU, r = type === 1 ? 1 : Math.sqrt(rnd()) * 0.86;
      pos.push(Math.sin(a) * r, type === 1 ? rnd.range(0.1, 0.5) : rnd.range(0.05, 0.6), Math.cos(a) * r);
      aS.push(rnd(), rnd(), rnd()); aT.push(slot, type);
    }
  };
  for (let s = 0; s < NT; s++) {
    const spill = s === NT - 1;
    if (s === NT - 2) { put(s, 0, 5); put(s, 1, 3); continue; }      // slot NT-2 rides at the walking hind's heels with a radius of 1.3 m: under 1.5 m it is no night, so these eight points are never lit
    if (!spill && s >= W.trees.length) continue;
    put(s, 0, Math.round((spill ? 260 : 40) * L.detail));
    put(s, 1, Math.round((spill ? 30 : 9) * L.detail));
    if (L.S.snow > 0) put(s, 2, Math.round((spill ? 200 : 70) * L.detail));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 2));
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...W.U, uPx: W.uPx, uFly: { value: col('#D8F07A') } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: WORLD_LAW_GLSL + /* glsl */`
      attribute vec3 aS; attribute vec2 aT; uniform float uPx; uniform vec3 uFly;
      varying vec3 vCol;
      void main(){
        int si = int(aT.x + .5); vec4 t = uTrees[si]; float gy = uTreeY[si];
        vec3 p; float size = .1; vec3 c = vec3(0.);
        if (aT.y < .5) {                 // firefly: wanders, pulses slowly out of step
          p = vec3(t.x + position.x * t.z, gy + .4 + position.y * t.w, t.y + position.z * t.z);
          p += vec3(sin(uTime * (.3 + aS.x * .4) + aS.y * 40.), sin(uTime * (.5 + aS.y * .3) + aS.z * 30.) * .5, cos(uTime * (.35 + aS.z * .4) + aS.x * 50.)) * 1.2;
          float pulse = .5 + .5 * sin(uTime * (.7 + aS.x * .9) + aS.z * 60.);
          c = uFly * 4. * pulse * pulse * nightAll(p); size = .11 + .07 * aS.y;
        } else if (aT.y < 1.5) {         // a star leaks from the hem, drifts 6 to 10 m downwind and melts in 3 s
          float cyc = 5. + 4. * aS.x, ph = fract(uTime / cyc + aS.y), age = ph * cyc;
          float a = safeAng(position.zx), rad = treeRad(t, a, aT.x) * .97;
          p = vec3(t.x + position.x * rad, gy + position.y * t.w * 1.2, t.y + position.z * rad);
          p.xz += uWind * age * 2.8; p.y += sin(age * 1.7 + aS.z * 9.) * .4 + age * .15;
          float life = smoothstep(0., .4, age) * (1. - smoothstep(1.2, 3.2, age));
          c = vec3(.8, .88, 1.) * 5. * life * (.75 + .25 * sin(uTime * 6. + aS.z * 70.)); size = .13 + .1 * aS.z;
        } else {                         // snow that falls only inside the night
          float fall = fract(aS.x - uTime * (.05 + .03 * aS.y));
          p = vec3(t.x + position.x * t.z + sin(uTime * .7 + aS.z * 20.) * .6, gy + fall * t.w * .9, t.y + position.z * t.z);
          c = vec3(.75, .82, 1.) * 1.1 * nightAll(p); size = .07 + .05 * aS.z;
        }
        c *= step(1.5, t.z);
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        float px = size * uPx / max(-mv.z, .1), k = max(1., 1.8 / max(px, 1e-3));
        gl_PointSize = px * k * 2.4; vCol = c / (k * k) * (1. - .9 * smoothstep(45., 200., -mv.z));   // far nights are blue pools, not glitter
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol;
      void main(){ vec2 d = gl_PointCoord - .5; float r = length(d) * 2.;
        float a = exp(-r * r * 7.) * (1. - smoothstep(.8, 1., r));
        gl_FragColor = vec4(vCol * a, 1.);
      }`,
  });
  const m = new THREE.Points(g, mat); m.frustumCulled = false; m.renderOrder = 22; return m;
}

// ---------------------------------------------------------------------------------------------------
// FLIERS: one flapping-wing material for larks, swallows, owls and butterflies (n per vertex: they change sides too)
function wingGeo(kind) {
  const P = [], Wt = [], Tn = [];
  const tri = (a, b, c, w = 1, tint = 0) => { for (const v of [a, b, c]) { P.push(v[0], v[1], v[2]); Wt.push(Math.abs(v[0]) * w); Tn.push(tint); } };
  const body = (w, h, l) => { const n = [0, 0, l], t = [0, 0, -l], ring = [[w, 0, 0], [0, h, 0], [-w, 0, 0], [0, -h, 0]];
    for (let i = 0; i < 4; i++) { const a = ring[i], b = ring[(i + 1) % 4]; P.push(...n, ...a, ...b, ...t, ...b, ...a); for (let k = 0; k < 6; k++) { Wt.push(0); Tn.push(0); } } };
  // a round-headed body: rings of 8 along z
  const lathe = (rings) => { for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < 8; k++) {
    const a0 = (k / 8) * TAU, a1 = ((k + 1) / 8) * TAU, [z0, r0] = rings[i], [z1, r1] = rings[i + 1];
    const A = [Math.cos(a0) * r0, Math.sin(a0) * r0 * 0.9, z0], B = [Math.cos(a1) * r0, Math.sin(a1) * r0 * 0.9, z0], C = [Math.cos(a0) * r1, Math.sin(a0) * r1 * 0.9, z1], D = [Math.cos(a1) * r1, Math.sin(a1) * r1 * 0.9, z1];
    P.push(...A, ...B, ...C, ...B, ...D, ...C); for (let q = 0; q < 6; q++) { Wt.push(0); Tn.push(0); } } };
  for (const s of [1, -1]) {
    if (kind === 'swallow') { tri([0.05 * s, 0, 0.16], [0.5 * s, 0, 0.05], [0.05 * s, 0, -0.1]); tri([0.5 * s, 0, 0.05], [s, 0, -0.42], [0.05 * s, 0, -0.1]); tri([0, 0, -0.3], [0.2 * s, 0, -0.85], [0.03 * s, 0, -0.45]); }
    else if (kind === 'owl') {
      // broad rounded wings in twelve strips with a scalloped trailing edge (the tips of the flight feathers)
      const lead = (x) => 0.2 - 0.13 * x * x, trail = (x, i) => lead(x) - 0.46 * (1 - 0.58 * x * x * x) + (i % 2 ? 0.05 : 0);
      for (let i = 0; i < 12; i++) {
        const x0 = 0.07 + (0.93 * i) / 12, x1 = 0.07 + (0.93 * (i + 1)) / 12, xm = (x0 + x1) / 2;
        const A = [x0 * s, 0, lead(x0)], Bv = [x1 * s, 0, lead(x1)], C = [x1 * s, 0, trail(x1, 1)], D = [x0 * s, 0, trail(x0, 1)], E = [xm * s, 0, trail(xm, 0) - 0.015];
        tri(A, Bv, C); tri(A, C, E); tri(A, E, D);
      }
      tri([0, 0, -0.36], [0.17 * s, 0, -0.62], [0, 0, -0.68]); tri([0, 0, -0.36], [0.09 * s, 0, -0.3], [0.17 * s, 0, -0.62]);
    }
    else if (kind === 'lark') { tri([0.05 * s, 0, 0.18], [0.6 * s, 0, 0.12], [0.05 * s, 0, -0.16]); tri([0.6 * s, 0, 0.12], [s, 0, -0.12], [0.05 * s, 0, -0.16]); tri([0, 0, -0.3], [0.12 * s, 0, -0.62], [0, 0, -0.6]); }
    else { tri([0.02 * s, 0, 0.05], [0.9 * s, 0, 0.75], [s, 0, 0.1]); tri([0.02 * s, 0, 0.05], [s, 0, 0.1], [0.5 * s, 0, -0.1]); tri([0.02 * s, 0, 0], [0.7 * s, 0, -0.15], [0.55 * s, 0, -0.7]); }
  }
  if (kind === 'owl') {
    lathe([[0.37, 0.05], [0.34, 0.15], [0.27, 0.2], [0.17, 0.21], [0.07, 0.18], [-0.04, 0.17], [-0.2, 0.15], [-0.36, 0.1], [-0.47, 0.02]]);
    // the pale heart of the face, two dark eyes and the bill
    const fz = 0.385, hr = (a) => 0.185 * (1 - 0.22 * Math.pow(Math.max(0, Math.sin(a)), 8)) * (0.85 + 0.15 * Math.abs(Math.cos(a)));
    for (let k = 0; k < 14; k++) { const a0 = (k / 14) * TAU, a1 = ((k + 1) / 14) * TAU; tri([0, 0, fz + 0.02], [Math.cos(a0) * hr(a0), Math.sin(a0) * hr(a0) * 1.05, fz - 0.04], [Math.cos(a1) * hr(a1), Math.sin(a1) * hr(a1) * 1.05, fz - 0.04], 0, 0.22); }
    for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) { const a0 = (k / 6) * TAU, a1 = ((k + 1) / 6) * TAU, ex = sx * 0.068, ey = 0.03, er = 0.032;
      tri([ex, ey, fz + 0.012], [ex + Math.cos(a0) * er, ey + Math.sin(a0) * er, fz + 0.008], [ex + Math.cos(a1) * er, ey + Math.sin(a1) * er, fz + 0.008], 0, -0.94); }
    tri([-0.02, -0.02, fz + 0.016], [0.02, -0.02, fz + 0.016], [0, -0.085, fz + 0.03], 0, -0.45);
  } else if (kind === 'butterfly') body(0.03, 0.03, 0.3); else body(0.07, 0.06, 0.3);
  while (Tn.length < Wt.length) Tn.push(0);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(Wt, 1)); g.setAttribute('aT', new THREE.Float32BufferAttribute(Tn, 1));
  return g;
}
function makeFlierMaterial(W) {
  return lawMat(W, {
    side: THREE.DoubleSide,
    vert: /* glsl */`
      attribute float aW; attribute float aT; attribute vec4 aF; attribute vec3 aC; varying vec3 vC;
      void main(){
        // aF: flap speed, amplitude, phase, glide (0 = always flapping .. 1 = long glides)
        float ph = uTime * aF.x + aF.z * 6.2832;
        float beat = sin(ph) * mix(1., smoothstep(-.2, .6, sin(ph * .11 + aF.z * 9.)), aF.w);
        float ang = beat * aF.y * aW + .15 * aW;
        vec3 lp = position; float sx = sign(lp.x);
        lp.y += abs(lp.x) * sin(ang); lp.x = sx * abs(lp.x) * cos(ang);
        vec4 wp = modelMatrix * instanceMatrix * vec4(lp, 1.);
        vec3 p = wp.xyz; vP = p;
        vec3 ln = aW > .01 ? vec3(-sx * sin(ang), 1., 0.) : vec3(position.xy, .02) + vec3(0., .001, 0.);
        vec3 N = normalize(mat3(modelMatrix * instanceMatrix) * ln); vN = N;
        float n = nightAll(p);
        vec3 alb = aC * (aW > .01 ? (.82 + .18 * sin(aW * 30.)) * (1. - .3 * aW * aW) : .85) * (1. + aT);
        vec3 c = lawN(alb, p, N, normalize(uCamL - p), 1., n) + lawN(alb, p, -N, normalize(uCamL - p), 1., n) * (aW > .01 ? .5 : .25);
        c += alb * alb * alb * vec3(.8, .75, .64) * 1.05 * n * (.6 + .4 * N.y);                        // pale wings glimmer in the night
        vC = c;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    frag: /* glsl */`varying vec3 vC;
      void main(){ gl_FragColor = vec4(vC, 1.);
        #include <fog_fragment>
      }`,
  });
}
function makeFlock(W, mat, kind, specs) {
  const g = wingGeo(kind), n = specs.length;
  const aF = new Float32Array(n * 4), aC = new Float32Array(n * 3);
  specs.forEach((s, i) => { aF.set(s.flap, i * 4); const c = col(s.color); aC.set([c.r, c.g, c.b], i * 3); });
  g.setAttribute('aF', new THREE.InstancedBufferAttribute(aF, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 3));
  const m = new THREE.InstancedMesh(g, mat, n); m.frustumCulled = false;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1), E = new THREE.Euler(), dir = new THREE.Vector3();
  // set(i, position, span, bankHint): heading follows the motion between frames (falls back to the given heading)
  m.userData.set = (i, p, span, heading, roll = 0) => {
    if (heading && heading.lengthSq() > 1e-10) dir.copy(heading).normalize(); else dir.set(0, 0, 1);
    const yaw = Math.atan2(dir.x, dir.z), pitch = -Math.asin(Math.max(-0.9, Math.min(0.9, dir.y)));
    E.set(pitch, yaw, roll, 'YXZ'); Q.setFromEuler(E); S.set(span * 0.5, span * 0.5, span * 0.5);
    M.compose(p, Q, S); m.setMatrixAt(i, M);
  };
  return m;
}

// ---------------------------------------------------------------------------------------------------
// HINDS ON THEIR FEET (instanced): one walks in the open meadow, a red deer in the sun like the grass round her, a calf
// at her heel; one stands on the Oak's threshold, half in noon and half in night. Frame: x forward, y up.
// aAnim = (breath, ear flick, leg weight, leg id + .5): legs swing about the hip by the distance walked (uWalk).
function makeHinds(W, n) {
  const B = makeBodySink(), red = [0.42, 0.2, 0.09], pale = [0.56, 0.45, 0.3], dark = [0.09, 0.06, 0.045], cream = [0.66, 0.59, 0.46];
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const coat = (k) => (i, c) => mixc(mixc(red, pale, Math.min(1, Math.max(0, 0.25 - c * 0.75))), dark, k * 0.5 + (c > 0.8 ? 0.16 : 0));
  B.loft([[-0.66, 1.0, 0], [-0.5, 1.03, 0], [-0.15, 1.0, 0], [0.22, 0.96, 0], [0.48, 0.98, 0], [0.66, 1.08, 0]], [0.13, 0.25, 0.28, 0.32, 0.31, 0.2], [0.11, 0.21, 0.24, 0.25, 0.22, 0.15], 10,
    (i, c) => (i <= 1 && c > -0.3 ? cream : coat(0)(i, c)), (i) => [i >= 2 && i <= 3 ? 1 : 0.3, 0, 0], 4.5);
  B.loft([[-0.74, 1.08, 0], [-0.86, 0.98, 0], [-0.9, 0.84, 0]], [0.035, 0.03, 0.012], [0.04, 0.035, 0.012], 5, () => mixc(cream, dark, 0.35), () => [0, 0.6, 0], 4.5);
  const nk = [[0.54, 1.1, 0], [0.72, 1.3, 0], [0.84, 1.47, 0], [0.9, 1.6, 0]];
  B.loft(nk, [0.23, 0.165, 0.12, 0.1], [0.165, 0.12, 0.095, 0.085], 8, coat(0.05), null, 4.5);
  const e = nk[3], f = [0.93, -0.36, 0], H = (d, up = 0, sd = 0) => [e[0] + f[0] * d, e[1] + f[1] * d + up, e[2] + sd];
  B.loft([H(-0.07, 0.02), H(0.03, 0.03), H(0.14, 0.01), H(0.25, -0.01), H(0.33, -0.015)], [0.085, 0.1, 0.075, 0.052, 0.042], [0.075, 0.088, 0.06, 0.042, 0.036], 8,
    (i, c) => (i >= 4 ? dark : i === 3 ? mixc(coat(0)(i, c), dark, 0.35) : coat(0.05)(i, c)), null, 4.5);
  for (const s of [-1, 1]) B.blade(H(-0.03, 0.07, s * 0.06), H(-0.13, 0.22, s * 0.2), [f[0], f[1] + 0.25, 0], 0.07, mixc(red, dark, 0.3), [0, 1, 0], 4.5 + s * 0.13);
  // legs: hind-left 0, fore-left 1, hind-right 2, fore-right 3 (a walk: each leg a quarter cycle after the last)
  const legs = [[-1, 1, 0], [1, 1, 1], [-1, -1, 2], [1, -1, 3]];
  for (const [fore, sd, id] of legs) {
    const z = sd * 0.13, P = fore > 0 ? [[0.46, 0.98, z], [0.5, 0.56, z], [0.47, 0.14, z], [0.5, 0.02, z]] : [[-0.5, 0.98, z], [-0.64, 0.56, z], [-0.52, 0.16, z], [-0.5, 0.02, z]];
    B.loft(P, fore > 0 ? [0.1, 0.05, 0.034, 0.04] : [0.15, 0.06, 0.034, 0.04], fore > 0 ? [0.08, 0.045, 0.03, 0.036] : [0.1, 0.05, 0.03, 0.036], 6,
      (i, c) => (i >= 3 ? dark : coat(0.15)(i, c)), (i) => [0, 0, Math.min(1, i / 3), 0], id + 0.5, new THREE.Vector3(1, 0, 0));
  }
  const base = B.geometry(), g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k of ['position', 'normal', 'color', 'aAnim']) g.setAttribute(k, base.attributes[k]);
  const aGo = new Float32Array(n * 2); g.setAttribute('aGo', new THREE.InstancedBufferAttribute(aGo, 2));
  const mat = lawMat(W, {
    side: THREE.DoubleSide, uniforms: { uWalk: { value: 0 } },
    vert: /* glsl */`
      attribute vec4 aAnim; attribute vec3 color; attribute vec2 aGo; uniform float uWalk; varying vec3 vCol; varying vec2 vCl;
      void main(){
        vec3 p = position; vCl = vec2(position.x + .12 * sin(uTime * 1.2 + position.y * 6.), aGo.y); float leg = floor(aAnim.w), ph = (uWalk + aGo.x) * aGo.y + leg * 1.5708;
        float k = aAnim.z * aGo.y;
        p.x += sin(ph) * .27 * k; p.y += max(cos(ph), 0.) * .1 * k * aAnim.z;
        p.y += .014 * sin((uWalk + aGo.x) * 2.) * aGo.y * (1. - aAnim.z);
        p += normal * aAnim.x * .02 * sin(uTime * 1.6 + aGo.x);
        float fk = smoothstep(.8, 1., sin(uTime * .9 + aGo.x * 7. + fract(aAnim.w) * 20.)) * sin(uTime * 15.);
        p += normal * aAnim.y * .06 * fk;
        vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.);
        vP = wp.xyz; vN = normalize(mat3(modelMatrix * instanceMatrix) * normal); vCol = color;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    frag: /* glsl */`varying vec3 vCol; varying vec2 vCl;
      void main(){
        vec3 N = normalize(vN), V = normalize(uCamL - vP);
        if (dot(N, V) < 0.) N = -N;
        vec3 alb = vCol * (.84 + .32 * vn3(vP * vec3(26., 60., 26.)));
        // an animal's night is the night of the place it stands in, as for everything else: n comes from position only
        float n = nightAll(vP);
        vec3 c = lawN(alb * mix(.62, .8, n), vP, N, V, .6 + .4 * smoothstep(-.3, .5, N.y), n);
        float rim = 1. - max(dot(N, V), 0.); rim *= rim;
        c += n * uGain * (alb * vec3(.6, .62, .8) * .16 + vec3(.5, .62, .95) * rim * (.2 + .5 * max(N.y, 0.)));   // never a black cut-out in her night
        c += (1. - n) * uSunCol * alb * rim * .25 * max(dot(N, uSunDir) + .4, 0.);                               // a sunlit edge to the coat
        float b4 = 4. * n * (1. - n), Lc = dot(c, vec3(.3, .5, .2));
        c = mix(c, alb / max(dot(alb, vec3(.3, .5, .2)), .02) * Lc, .5 * b4);                                    // in the dusk band she keeps her red coat
        { float nn = nightAll(vP), Ln = dot(c, vec3(.3, .5, .2)); vec3 Lm = normalize(uMoon - vP + vec3(0., 1e-3, 0.));   // by night she keeps her red coat, rimmed ivory toward the moon
          c = mix(c, alb / max(dot(alb, vec3(.3, .5, .2)), .02) * Ln / (1. + 2.8 * Ln), nn * .85);
          c += nn * uMoonCol * vec3(1.05, 1., .88) * rim * (.25 + .6 * max(N.y, 0.) + .6 * smoothstep(-.4, .5, dot(N, Lm))) * .34; }
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.InstancedMesh(g, mat, n); m.frustumCulled = false;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), Yx = new THREE.Vector3(0, 1, 0);
  // set(i, foot position, heading (dx, dz), scale, phase, moving)
  m.userData.set = (i, p, dx, dz, sc, phase, go) => {
    Q.setFromAxisAngle(Yx, Math.atan2(-dz, dx)); S.set(sc, sc, sc); M.compose(p, Q, S); m.setMatrixAt(i, M);
    aGo[i * 2] = phase; aGo[i * 2 + 1] = go;
  };
  m.userData.mat = mat;
  return m;
}

// ---------------------------------------------------------------------------------------------------
// PEOPLE ARE ONLY IMPLIED: a split-chestnut fence with a kissing gate at the entry, a forgotten picnic on the ring
async function makeProps(W, path, ctx) {
  await ctx.yield();
  const rnd = W.rng.fork('props'), parts = [], group = new THREE.Group();
  const box = (w, h, d, x, y, z, ry = 0, rz = 0) => { const g = new THREE.BoxGeometry(w, h, d, 1, 2, 1); g.rotateZ(rz); g.rotateY(ry); g.translate(x, y, z); parts.push(g); };
  // fence across the entry, 16 m in, with a 7 m gap where the footpath goes through
  const p0 = path.posAtDist(24), t0 = path.tangentAtDist(24), rx = -t0.z, rz = t0.x, yaw = Math.atan2(rx, rz);
  for (const s of [-1, 1]) {
    let prev = null;
    for (let k = 0; k < 46; k++) {
      const off = s * (3.6 + k * 2.5), x = p0.x + rx * off + t0.x * Math.sin(k * 0.21) * 1.5, z = p0.z + rz * off + t0.z * Math.sin(k * 0.21) * 1.5, y = groundH(x, z);
      box(0.17, 1.4 + rnd.range(-0.1, 0.1), 0.15, x, y + 0.6, z, yaw + rnd.range(-0.3, 0.3), rnd.range(-0.06, 0.06));
      if (prev) for (const h of [0.45, 0.95]) {
        const dx = x - prev.x, dz = z - prev.z, L = Math.hypot(dx, dz);
        box(L + 0.3, 0.12, 0.06, (x + prev.x) / 2, (y + prev.y) / 2 + h + rnd.range(-0.03, 0.03), (z + prev.z) / 2, Math.atan2(-dz, dx), Math.atan2(y - prev.y, L));
      }
      prev = { x, y, z };
    }
    // the kissing gate's hoop and the open gate leaf
    for (let k = 0; k < 5; k++) { const a = (k / 4) * Math.PI * 0.9, off = s * 3.6; box(0.1, 1.3, 0.1, p0.x + rx * off + t0.x * (0.4 + Math.sin(a) * 1.5) - rx * s * (1 - Math.cos(a)) * 0.8, groundH(p0.x, p0.z) + 0.6, p0.z + rz * off + t0.z * (0.4 + Math.sin(a) * 1.5) - rz * s * (1 - Math.cos(a)) * 0.8, yaw); }
  }
  await ctx.yield();
  // rooks on the fence by the gate: glossy blue-black, bare pale bills; they sit in the noon and watch the nights
  const rook = (x, y, z, ry, sc) => {
    const put = (g, r, tx, ty, tz, rx = 0) => { g.rotateX(rx); g.translate(tx, ty, tz); g.scale(sc, sc, sc); g.rotateY(ry); g.translate(x, y, z); g.userData.r = r; parts.push(g); };
    const body = new THREE.SphereGeometry(1, 10, 8); body.scale(0.115, 0.125, 0.23); put(body, 1, 0, 0.17, 0, -0.5);
    put(new THREE.SphereGeometry(0.075, 9, 7), 1, 0, 0.345, 0.15);
    const bill = new THREE.ConeGeometry(0.03, 0.14, 6); put(bill, 2, 0, 0.33, 0.265, 1.75);
    put(new THREE.BoxGeometry(0.1, 0.018, 0.24), 1, 0, 0.06, -0.25, 0.42);
    for (const sx of [-1, 1]) { const wg = new THREE.SphereGeometry(1, 8, 6); wg.scale(0.035, 0.09, 0.2); put(wg, 1, sx * 0.105, 0.17, -0.03, -0.55); }
    for (const sx of [-1, 1]) put(new THREE.BoxGeometry(0.014, 0.1, 0.014), 2, sx * 0.04, 0.03, 0.02);
  };
  for (const [s, k, sc] of [[-1, 1, 1.25], [-1, 2, 1.1], [1, 1, 1.2], [1, 3, 1.15], [-1, 4, 1.1]]) {
    const off = s * (3.6 + k * 2.5), x = p0.x + rx * off + t0.x * Math.sin(k * 0.21) * 1.5, z = p0.z + rz * off + t0.z * Math.sin(k * 0.21) * 1.5;
    rook(x, groundH(x, z) + 1.3, z, yaw + Math.PI + s * 0.5 + rnd.range(-0.9, 0.9), sc);
  }
  await ctx.yield();
  // the picnic: basket and two enamel mugs, on the sunset ring beside the flight line
  const pc = W.picnic;
  const basket = new THREE.CylinderGeometry(0.3, 0.24, 0.3, 12, 3); basket.scale(1.35, 1, 1); basket.translate(pc.x - 0.75, 0.27, pc.z - 0.75); parts.push(basket);
  const handle = new THREE.TorusGeometry(0.3, 0.025, 5, 14, Math.PI); handle.translate(pc.x - 0.75, 0.42, pc.z - 0.75); parts.push(handle);
  for (const [dx, dz] of [[0.35, 0.1], [0.1, 0.5]]) { const mug = new THREE.CylinderGeometry(0.055, 0.05, 0.11, 10); mug.translate(pc.x + dx, 0.19, pc.z + dz); parts.push(mug); }
  await ctx.yield();
  const geo = mergeGeometries(parts.map((g) => { const n = g.index ? g.toNonIndexed() : g.clone(); n.deleteAttribute('uv'); n.setAttribute('aR', new THREE.BufferAttribute(new Float32Array(n.attributes.position.count).fill(g.userData.r || 0), 1)); g.dispose(); return n; }));
  const solidVert = /* glsl */`void main(){ vP = position; vN = normal;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`;
  const wood = lawMat(W, { uniforms: { uPic: { value: new THREE.Vector2(pc.x, pc.z) } }, vert: 'attribute float aR; varying float vR;\n' + solidVert.replace('vP = position;', 'vP = position; vR = aR;'),
    frag: /* glsl */`uniform vec2 uPic; varying float vR;
      void main(){ vec3 N = normalize(vN), V = normalize(uCamL - vP);
        float g = vn2(vec2(vP.x * 3. + vP.z * 3., vP.y * 26.)) * .5 + vn2(vP.xz * 40. + vP.y * 9.) * .5;
        vec3 alb = mix(vec3(.3, .25, .19), vec3(.62, .57, .47), g);                       // weathered chestnut
        float nearPic = step(length(vP.xz - uPic), 3.);
        float weave = step(.5, fract(vP.y * 18. + step(.5, fract(safeAng(vP.xz - uPic + vec2(.75)) * 4.)) * .5));
        alb = mix(alb, mix(vec3(.5, .36, .18), vec3(.74, .58, .32), weave), nearPic);       // wicker
        alb = mix(alb, vec3(.82, .86, .9), nearPic * step(length(vP.xz - uPic + vec2(.75)), .01) );
        alb = mix(alb, mix(vec3(.016, .018, .034), vec3(.5, .47, .4), step(1.5, vR)), step(.5, vR));   // rook: blue-black, pale bill
        vec3 c = lawN(alb, vP, N, V, .6 + .4 * g, nightAll(vP));
        float rk = step(.5, vR) * (1. - step(1.5, vR)), sh = max(dot(N, normalize(uSunDir + V + vec3(0., 1e-3, 0.))), 0.); sh *= sh; sh *= sh;
        c += rk * vec3(.22, .26, .5) * (sh * sh * .9 + .12 * (1. - max(dot(N, V), 0.))) * (1. - nightAll(vP));   // the gloss on a rook's back
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }` });
  const solid = new THREE.Mesh(geo, wood); solid.frustumCulled = false; group.add(solid);
  await ctx.yield();
  // the cream cloth, pinned at one corner by the basket, flapping half in noon and half in night
  const cg = new THREE.PlaneGeometry(2, 2, 16, 16); cg.rotateX(-Math.PI / 2);
  const cloth = lawMat(W, { side: THREE.DoubleSide, uniforms: { uPic: { value: new THREE.Vector3(pc.x, 0.16, pc.z) } },
    vert: /* glsl */`uniform vec3 uPic; varying vec2 vUv;
      void main(){ vUv = uv; vec3 lp = position;
        float free = clamp(length(lp.xz - vec2(-.75, -.75)) / 2.4, 0., 1.);           // 0 at the pinned corner
        float lift = free * free;
        float w1 = sin(uTime * 3.1 + lp.x * 2.6 + lp.z * 1.9), w2 = sin(uTime * 5.3 - lp.x * 4.1 + lp.z * 3.3);
        float gust = .5 + .5 * sin(uTime * .9 + 1.);
        lp.y += lift * (.16 + .42 * gust + .22 * w1 * (.4 + gust) + .07 * w2) + .03 * sin(lp.x * 5.) * sin(lp.z * 6.);
        vec3 p = lp + uPic; vP = p;
        vN = normalize(vec3(-lift * cos(uTime * 3.1 + lp.x * 2.6 + lp.z * 1.9) * .5, 1., -lift * cos(uTime * 5.3 - lp.x * 4.1 + lp.z * 3.3) * .3));
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    frag: /* glsl */`varying vec2 vUv;
      void main(){ vec3 N = normalize(vN), V = normalize(uCamL - vP); if (!gl_FrontFacing) N = -N;
        vec2 q = vUv * 9.;
        float chk = step(.5, fract(q.x)) + step(.5, fract(q.y));
        vec3 alb = mix(vec3(.78, .74, .62), vec3(.7, .3, .26), chk * .22) * (.9 + .1 * vn2(vUv * 60.));   // cream, faint red check
        vec3 c = lawN(alb, vP, N, V, 1., nightAll(vP));
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }` });
  const cm = new THREE.Mesh(cg, cloth); cm.frustumCulled = false; group.add(cm);
  return group;
}

// ===================================================================================================
export default {
  id: 'night-under-the-oaks',
  name: 'Where Night Spends the Day',
  category: 'bizarre',
  weirdness: 0.9,
  media: ['open', 'air'],
  async build(ctx) {
    const look = chooseLook(ctx), S = look.S;
    const scene = new THREE.Scene();
    const hero = await buildHero(ctx, { palette: S.pal, detail: look.detail });
    hero.object.position.y = 0.1;                       // the lawn disc sits clear of the meadow beneath it
    scene.add(hero.object);
    const HU = hero.uniforms, A = hero.anchors;
    // the dusk ring of this visit, and the moon
    const ring = RINGS[look.ring].map((h, i) => col(h).multiplyScalar((look.ring === 'scarlet' ? [1.3, 0.8, 0.9] : [1.5, 1.35, 1.5])[i]));
    if (look.ring === 'scarlet') HU.uHem.value.set(8.5, 0.34);     // the fire squeezed into the lowest half metre, violet above
    HU.uRampA.value.copy(ring[0]); HU.uRampB.value.copy(ring[1]); HU.uRampC.value.copy(ring[2]);
    hero.setMoon?.(look.moon);
    const moonK = look.moon === 'full' ? 1.55 : look.moon === 'none' ? 0.5 : 1;
    const base = { amb: HU.uStarAmb.value.clone().multiplyScalar(look.moon === 'none' ? 1.25 : 1), moon: HU.uMoonCol.value.clone().multiplyScalar(moonK) };
    await ctx.yield();

    // ---- the flight (fix round 3: more of it inside the midnight, and no two neighbouring views alike)
    // OUTSIDE, 38 percent: in from the south-east with the sun behind. The old thorn's pocket of night stands
    // whole 50 m ahead of the gate and the line goes through it 5 m from the stem (the owl); then low over the
    // buttercups past a hind and her calf walking in the sun (they take their night from the place they stand in); then
    // up to 12 m for the whole Night Oak, dead ahead; then down and to port along the wall of night, which curves
    // away to starboard, to a hind standing on the threshold. INSIDE, 62 percent: one and a third right-hand turns
    // round the trunk. First low and spiralling in (the first sight of the midnight, the trunk and pond from 25 m,
    // the moon in its crook from the trunk's side at 11 m), then up through the gap between two boughs and round
    // the front at 16 m above their mossed tops, down to the quarter turn of the set piece and its dead-straight
    // 100 m over the pond to the ring in the arch of day.
    const deg = Math.PI / 180, PC = (a, r, y) => new THREE.Vector3(Math.sin(a * deg) * r, y, Math.cos(a * deg) * r);
    const pts = [];
    {
      const hH = PC(135, 1, 0).multiplyScalar(-1), n = 10, len = 19.1, turn = 36 * deg, back = [];
      let p = PC(135, 150, 0); back.push(p.clone());
      for (let i = 1; i <= n; i++) {
        const th = (turn * (i - 0.5)) / n, c = Math.cos(th), sn = Math.sin(th);
        p = p.clone().addScaledVector(new THREE.Vector3(hH.x * c - hH.z * sn, 0, hH.z * c + hH.x * sn), -len); back.push(p.clone());
      }
      back.reverse();
      const lift = [3.2, 3.2, 3.2, 3.4, 3.3, 2.6, 2.3, 3, 5.5, 8.5, 9.5];
      back.forEach((q, i) => pts.push(q.setY(groundH(q.x, q.z) + lift[i])));
    }
    const SPIRAL = [[134.5, 128, 7.5], [134, 106, 6], [132.5, 90, 5], [130, 84, 4.6], [124, 81.5, 4.4], [117, 80, 4.3], [110, 79, 4.2], [104, 78, 4.2], [95, 71.5, 4]];
    for (const [a, r, y] of SPIRAL) pts.push(PC(a, r, y));
    // INSIDE (fix round 4): low and level all the way, so the ring of dusk is a level horizon in every view. In from the
    // east toward the trunk (the whole midnight), round the front lawn past two hinds standing against the moon, down
    // to the pond's north-east shore and low over the water to the stag under the moon in its crook; under the moon
    // bough on the trunk's side, a turn on the south lawn to face the moon from 16 m with the stag, pond and herd
    // beyond it; back north past the stag and over the water, two hinds and a calf in the campion with the moon full
    // on them; then round the pond's head, the gaze held on the water, onto the exit line.
    const INSIDE = [[62, 6, 4], [54, 24, 4], [43, 41, 3.6], [26, 55, 2], [7, 56, 1.8], [-6, 43, 2.3], [-12, 28, 2.8], [-16.5, 14, 2.4], [-19, 2, 2.5], [-19, -9, 3.3], [-15, -21, 3.9],
      [-8.5, -31.5, 4], [-11.5, -39.5, 3.6], [-19, -40, 3.4], [-25.5, -34.5, 3.6], [-22, -25.5, 3.6], [-17.5, -15, 3.4], [-18.5, -3, 2.8], [-17, 10, 2.5], [-13, 22, 2.1], [-11.5, 35, 1.5],
      [-15, 47, 2.3], [-23, 56, 4.2], [-34, 52, 5], [-36.8, 41.5, 4.8]];
    for (const [x, z, y] of INSIDE) pts.push(new THREE.Vector3(x, y, z));
    const tailY = [4.2, 3.6, 3.0, 3.4, 4.6, 6, 7];
    A.flyThrough.slice(10).forEach((p, i) => pts.push(p.clone().setY(tailY[i])));
    const run = A.runStart.clone();
    await ctx.yield();
    const path = makePath(pts);
    const Lp = path.length;
    await ctx.yield();
    const uAt = (v) => path.nearestXZ(v.x, v.z).u;
    const portalP = A.portalSeat.position, uLine = (v) => 1 - (v.x - portalP.x) * A.portalSeat.facing.x / Lp - (v.z - portalP.z) * A.portalSeat.facing.z / Lp;
    const hemR = (a) => { const r = a * deg; return 75 * (1 + 0.06 * (Math.sin(r * 3 + 0.7) * 0.5 + Math.sin(r * 5 + 2.1) * 0.3 + Math.sin(r * 8 + 4) * 0.2)); };
    const crossP = PC(101, hemR(101), 0);
    const uRing = uAt(crossP), uMoon = uLine(A.moon.view), uMoonPass = uLine(A.moon.passAt), uStag = uLine(A.stag.position), uRun = uLine(run);
    const dThorn = 76, uHaw = (dThorn - 8) / Lp, uHero = 190 / Lp, dHind = 129, uHind = (dHind - 7) / Lp;
    const uOf = (a, r) => uAt(PC(a, r, 0));

    // ---- shared uniforms of the world's own materials
    const trees = [];
    const U = { ...HU, uTrees: { value: [] }, uTreeY: { value: new Array(NT).fill(0) }, uGain: { value: 1 } };
    for (let i = 0; i < NT; i++) U.uTrees.value.push(new THREE.Vector4(9e4 + i * 500, 9e4, 1, 1));
    const MU = { uGrassA: { value: col(S.grassA) }, uGrassB: { value: col(S.grassB) }, uFlower: { value: col(S.flower).multiplyScalar(0.92) },
      uSeed: { value: col(S.seed) }, uAccent: { value: col(S.accent) }, uFlowerAmt: { value: S.flowerAmt }, uPicXZ: { value: new THREE.Vector2() } };
    const uPath = { value: [] };
    for (let i = 0; i < NP; i++) { const p = path.posAtDist(-50 + ((uRing * Lp + 30) * i) / (NP - 1)); uPath.value.push(new THREE.Vector2(p.x, p.z)); }
    const cross = PC(94, hemR(94), 0), cr = Math.hypot(cross.x, cross.z);
    const W = { rng: ctx.rng, noise: ctx.noise, look, hero, U, MU, uPath, trees, dThorn, uPx: { value: 400 }, starPx: { value: 1 },
      cen: { near: { value: new THREE.Vector2() }, far: { value: new THREE.Vector2() } },
      picnic: { x: (cross.x / cr) * (cr + 1.3), z: (cross.z / cr) * (cr + 1.3) } };
    MU.uPicXZ.value.set(W.picnic.x, W.picnic.z);
    await ctx.yield();
    for (const t of placeTrees(W, path, uRing)) trees.push(t);
    await ctx.yield();
    trees.forEach((t, i) => { U.uTrees.value[i].set(t.x, t.z, t.R * t.s, t.H * t.s); U.uTreeY.value[i] = t.y; });

    // ---- sky and haze
    const sky = makeSky({ rng: ctx.rng, preset: 'day', zenith: S.zenith, horizon: S.horizon, sunElevation: 68, sunAzimuth: 132, sunSize: 1.1,
      clouds: { coverage: 0.34, softness: 0.2, scale: 1.25, wind: [0.016, 0.006] }, clouds2: false });
    scene.add(sky.object);
    const fogDay = col(S.fog), fogNight = col('#1A2A6E').multiplyScalar(0.8);
    scene.fog = new THREE.FogExp2(fogDay.clone(), 0.0012);
    hero.setSun(sky.sunDirection);
    await ctx.yield();

    // ---- meadow
    const dens = look.detail * Math.min(1.08, Math.max(0.86, look.density));
    scene.add(makeGround(W)); await ctx.yield();
    scene.add(makeHanger(W)); await ctx.yield();
    scene.add(makeTufts(W, Math.round(8300 * dens), 46, 'near', 0.7, 0.72)); await ctx.yield();
    scene.add(makeTufts(W, Math.round(5300 * dens), 130, 'far', 1.7, 0.95, 2)); await ctx.yield();
    scene.add(makeFlowers(W, Math.round(9000 * dens), 52, 'near')); await ctx.yield();
    scene.add(await makeTrees(W, ctx)); await ctx.yield();
    scene.add(await makeTreeLeaves(W, ctx)); await ctx.yield();
    await ctx.yield();
    for (const m of makeSmallDomes(W)) { scene.add(m); await ctx.yield(); }
    await ctx.yield();
    scene.add(makeSprites(W)); await ctx.yield();
    scene.add(await makeProps(W, path, ctx)); await ctx.yield();
    const hinds = makeHinds(W, 9); scene.add(hinds); await ctx.yield();

    // ---- fliers
    const fr = ctx.rng.fork('fliers'), fmat = makeFlierMaterial(W);
    const larks = makeFlock(W, fmat, 'lark', [0, 1].map(() => ({ flap: [27, 0.95, fr(), 0], color: '#9A7B50' })));
    const swallows = makeFlock(W, fmat, 'swallow', Array.from({ length: 8 }, () => ({ flap: [17, 0.85, fr(), 0.7], color: '#27356A' })));
    const owl = makeFlock(W, fmat, 'owl', [{ flap: [5.2, 0.8, 0.2, 0.15], color: '#F3ECDD' }, { flap: [4.6, 0.8, 0.55, 0.15], color: '#F3ECDD' }]);
    const nb = Math.round(40 * look.detail);
    const bflies = makeFlock(W, fmat, 'butterfly', Array.from({ length: nb }, () => ({ flap: [12 + fr() * 5, 1.15, fr(), 0], color: fr() < 0.55 ? '#F6F3E8' : '#A8703A' })));
    scene.add(larks, swallows, owl, bflies);
    await ctx.yield();
    await ctx.yield();
    const right = (d, out) => { const t = path.tangentAtDist(d); return out.set(-t.z, 0, t.x).normalize(); };
    const bfBase = Array.from({ length: nb }, () => { const d = fr.range(8, uRing * Lp - 20), p = path.posAtDist(d), r = right(d, new THREE.Vector3()), o = (fr() < 0.5 ? -1 : 1) * fr.range(2.2, 9);
      return { p: new THREE.Vector3(p.x + r.x * o, groundH(p.x + r.x * o, p.z + r.z * o) + fr.range(0.9, 2.3), p.z + r.z * o), ph: fr() * 40 }; });
    const bfAt = (b, t, out) => out.set(b.p.x + Math.sin(t * 0.7 + b.ph) * 1.4 + Math.sin(t * 1.9 + b.ph) * 0.4, b.p.y + Math.sin(t * 2.3 + b.ph * 2) * 0.4, b.p.z + Math.cos(t * 0.6 + b.ph) * 1.4);
    const larkD = [30, 104];
    const dX = 136, mp = trees[1];
    const sw = { X: path.posAtDist(dX), r: right(dX, new THREE.Vector3()), M: new THREE.Vector3(mp.x, mp.y + 3.2, mp.z) };
    sw.S = sw.X.clone().addScaledVector(sw.r, -34).setY(sw.X.y + 2); sw.F = sw.M.clone().add(sw.M.clone().sub(sw.X).setY(0).normalize().multiplyScalar(40)).setY(sw.M.y + 5);
    const swCurve = new THREE.CatmullRomCurve3([sw.S, sw.X, sw.M, sw.F], false, 'centripetal');
    const uSw = (dX - 6 - 60 * (1 / 3 - 0.34 + 3.5 * 0.022)) / Lp;   // the LAST of the eight is at our line (the curve's second point, a third of the way along it) when we are 6 m short of it: the design's '6 m ahead' is the nearest bird's, so none crosses at the lens
    const swOff = Array.from({ length: 8 }, (_, i) => ({ s: (i - 3.5) * 0.022, a: fr() * TAU, lat: fr.range(-1.3, 1.3), y: fr.range(-0.7, 0.7) }));
    const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), v4 = new THREE.Vector3(), buf = new THREE.Vector2();
    function swallowPos(i, time, u, out) {
      const o = swOff[i], s = 0.34 + ((u - uSw) * Lp) / 60 + o.s, sc = Math.min(1, Math.max(0, s));
      swCurve.getPoint(sc, out);
      const away = 1 - sstep(-0.25, 0.02, s) * (1 - sstep(0.98, 1.25, s)), a = time * 1.1 + o.a;   // hawking loops when not on the run
      out.x += o.lat * sw.r.x + Math.sin(a) * 9 * away; out.z += o.lat * sw.r.z + Math.cos(a) * 9 * away * 0.7;
      out.y += o.y + Math.sin(time * 2.3 + o.a) * (0.3 + away); return out;
    }
    // the barn owl comes head-on through the hawthorn's night and passes 2 m to port, a little below the eye
    const owlFar = path.posAtDist(dThorn + 5).addScaledVector(right(dThorn + 5, new THREE.Vector3()), -1), owlNear = path.posAtDist(dThorn - 9).addScaledVector(right(dThorn - 9, new THREE.Vector3()), -1.7);
    const thorn = trees[0], thornTop = new THREE.Vector3(thorn.x, thorn.y + 9.5, thorn.z);
    function owlPos(u, time, out) {
      const s = Math.min(3, Math.max(-1.5, (u * Lp - (dThorn - 27)) / 12));
      out.lerpVectors(owlFar, owlNear, s).setY(owlFar.y + 0.75 - 0.45 * sstep(0, 1, s) + 0.9 * sstep(1.1, 3, s) + Math.sin(time * 5.2) * 0.06);
      // before the eye arrives it quarters its night round the stem, so the pocket of midnight is seen with its owl in it
      const k = 1 - sstep(dThorn - 44, dThorn - 30, u * Lp), a = time * 0.55 + 2.2;
      if (k > 0) { out.x += (thorn.x + Math.sin(a) * 7.5 - out.x) * k; out.z += (thorn.z + Math.cos(a) * 7.5 - out.z) * k; out.y += (thorn.y + 4.6 + Math.sin(time * 0.9) * 0.5 - out.y) * k; }
      return out;
    }
    const camNsmall = (p, time) => {
      let n = 0;
      for (let i = 0; i < NT; i++) {
        const t = U.uTrees.value[i]; if (t.z < 1.5) continue;
        const qx = p.x - t.x, qz = p.z - t.y, a = Math.atan2(qx, Math.abs(qz) < 1e-4 ? 1e-4 : qz);
        const rad = t.z * (1 + 0.07 * Math.sin(a * 3 + i * 1.7) + 0.045 * Math.sin(a * 5 + i * 2.9)) + 0.35 * Math.sin(a * 2 + time * 0.79 + i * 2);
        const d = Math.hypot(qx, ((p.y - U.uTreeY.value[i]) * t.z) / Math.max(t.w, 0.1), qz) - rad, w = 0.16 * t.z;
        n = Math.max(n, 1 - sstep(-w, w, d));
      }
      return n;
    };
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);
    await ctx.yield();

    // u of a way-point by its place in space (the line passes over the front lawn twice, at two heights)
    const u3 = (v) => { let best = 0, bd = 1e9; for (let i = 0; i <= 800; i++) { const d = path.posAtDist((i / 800) * Lp, v4).distanceToSquared(v); if (d < bd) { bd = d; best = i; } } return best / 800; };
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const uP2 = u3(V3(26, 2, 55)), uPond = u3(V3(-16.5, 2.4, 14)), uMS = u3(V3(-25.5, 3.6, -34.5)), uB = u3(V3(-11.5, 1.5, 35));
    const hindAt = new THREE.Vector3(), threshAt = PC(127, hemR(127) + 0.5, 1.3);
    // the walker's track: parallel to the line, 3.6 m to starboard; she walks 7 cm for every metre the eye flies
    const hTrack = { p: path.posAtDist(dHind - 4), d: path.tangentAtDist(dHind).setY(0).normalize() };
    { const r = right(dHind - 4, new THREE.Vector3()); hTrack.p.addScaledVector(r, 2.8); hTrack.r = r.clone(); }
    const shred = U.uTrees.value[NT - 2];
    function placeHinds(u) {
      const w = Math.max(0, u * Lp - (dHind - 60)) * 0.07;
      v1.copy(hTrack.p).addScaledVector(hTrack.d, w); v1.y = groundH(v1.x, v1.z) + 0.02;
      hinds.userData.set(0, v1, hTrack.d.x, hTrack.d.z, 1.12, 0, 1);
      hindAt.copy(v1).setY(v1.y + 1.25);
      shred.set(v1.x - hTrack.d.x * 0.75, v1.z - hTrack.d.z * 0.75, 1.3, 1.3); U.uTreeY.value[NT - 2] = v1.y;
      v2.copy(v1).addScaledVector(hTrack.d, -1.7).addScaledVector(hTrack.r, 0.9); v2.y = groundH(v2.x, v2.z) + 0.02;
      hinds.userData.set(1, v2, hTrack.d.x, hTrack.d.z, 0.64, 2.1, 1);
      hinds.userData.mat.uniforms.uWalk.value = w * (TAU / 1.3);
      hinds.instanceMatrix.needsUpdate = true; hinds.geometry.attributes.aGo.needsUpdate = true;
    }
    { const hd = PC(182, 1, 0); v1.set(threshAt.x, 0.12, threshAt.z); hinds.userData.set(2, v1, hd.x, hd.z, 1.18, 1.3, 0); }
    const standAt = V3(11.5, 1.6, 48.6), standB = V3(-8.8, 1.4, 41.5), owl2At = V3(-26, 6, -22), moonLow = A.moon.position.clone(); moonLow.y -= 1.4;
    // two hinds and a calf stand in the campion on the front lawn, heads up, between the eye and the moon
    { v1.set(11.2, 0.12, 49.6); hinds.userData.set(3, v1, 0.69, -0.73, 1.15, 0.7, 0); v1.set(14.6, 0.12, 47.2); hinds.userData.set(4, v1, 0.8, -0.6, 1.08, 2.9, 0);
      v1.set(10.2, 0.12, 47.4); hinds.userData.set(5, v1, 0.6, -0.8, 0.62, 4.1, 0);
      // and three more north of the pond, met on the way back with the moon behind the eye
      v1.set(-9.5, 0.12, 39.5); hinds.userData.set(6, v1, -0.97, -0.24, 1.16, 5.2, 0); v1.set(-6.6, 0.12, 42.2); hinds.userData.set(7, v1, -0.9, 0.44, 1.1, 1.7, 0);
      v1.set(-10.6, 0.12, 42.6); hinds.userData.set(8, v1, -0.99, 0.1, 0.64, 3.3, 0); }
    // the second barn owl hunts the east lawn: it flies a little ahead of the eye and to port, the moon full on it
    // the second barn owl leaves the moon's side as the eye turns to face it and comes head-on, passing to port
    const owlA = A.moon.position.clone().add(V3(3.6, -1.4, -1)), owlB = V3(-20.1, 4.1, -36.5);
    function owl2Pos(u, time, out) {
      const t = Math.min(3.4, Math.max(-0.6, 0.4 + 0.04 * (u - uMS) * Lp));
      out.lerpVectors(owlA, owlB, t); out.y += 0.14 * Math.sin(time * 0.8) + 2.5 * Math.max(0, t - 1) * Math.max(0, t - 1);
      return out;
    }
    placeHinds(0);
    // ---- third small polish (p3): LIFE IN THE DAYLIGHT MEADOW BETWEEN THE BEATS. The lines from here to the end of the hinds in the sun are ADDED
    // to live; each of the two blocks is switched by one word here.
    const P3 = { rise: true, graze: true };
    // a place in plan against the walker's line (live's hTrack, the straight line she walks from her start; her calf keeps 0.9 m to starboard
    // of her and 1.7 m behind): true where the place lies ahead of her start and within 'port' m to port or 'star' m to starboard of the line.
    const onWalk = (x, z, port, star) => { const qx = x - hTrack.p.x, qz = z - hTrack.p.z, al = qx * hTrack.d.x + qz * hTrack.d.z, sd = qz * hTrack.d.x - qx * hTrack.d.z; return al > -4 && sd > -port && sd < star; };
    // what a body stands on: the Oak's lawn (its face, where live sets its standing hinds) or the meadow's ground
    const floorY = (x, z) => (Math.hypot(x, z) < 118 ? 0.12 : groundH(x, z) + 0.02);
    // THE LARK-RISE (the design's own cast: 'skylarks that rise singing from the grass 3 m from the path', 'larks climbing and hovering').
    // Along the open run, from 140 m of the mown path to 244.5 m of it, a skylark keeps a station every 5.5 m, 3 m from the path in plan, to
    // port and to starboard by turns (to port where the walker's line passes within reach of the starboard station). Each sings a round of
    // its own by the clock alone: up from the grass, a hover at a height of its own over its own grass, down again, a rest low over the grass. The round's
    // length (16 to 25 s), its start and the height (4 to 12 m) go by the count; no stream deals anything; nothing reads u or the height
    // of the flight. The 3 m in plan keeps every one clear of the eye at every height.
    const riseAt = [];
    if (P3.rise) for (let d = 140, i = 0; d <= 245; d += 5.5, i++) {
      const p = path.posAtDist(d), r = right(d, new THREE.Vector3()), s = i % 2 && !onWalk(p.x + r.x * 3, p.z + r.z * 3, 2, 3) ? 1 : -1, x = p.x + r.x * 3 * s, z = p.z + r.z * 3 * s;
      riseAt.push({ x, z, g: floorY(x, z), top: 4 + 8 * ((i * 0.755) % 1), T: 16 + 9 * ((i * 0.618 + 0.3) % 1), ph: (i * 0.381) % 1 });
    }
    const rise = riseAt.length ? makeFlock(W, fmat, 'lark', riseAt.map((b, i) => ({ flap: [27, 0.95, (i * 0.618) % 1, 0], color: '#9A7B50' }))) : null;
    if (rise) scene.add(rise);
    // HINDS IN THE SUN (the lead's amendment of the design, 8 Oct 2026, in the brief). Ten hinds and a calf graze in the buttercups beside
    // the mown path, between places of the meadow: dA is 15 m of path past the walker's start (she and her calf walk under 13 m of it
    // while the eye can see them), dL is where the path comes onto the Oak's lawn, dB is 12 m of path short of the hind on the Oak's
    // threshold. Three outliers stand at the quarter points between dA and dL; the herd of seven keeps to the lawn, one to each
    // seventh of dL to dB; the calf stands at the seventh hind's flank. Each place goes by the count and by the meadow: sides by turns,
    // from the count, 5.6 to 8 m from the path before any step onto the lawn; each heading turned 2.4 rad on from the last; sizes 1.05 to 1.15; two heads in three
    // down in the flowers. A place must be FREE: off the walker's line and her calf's; 6 m outside the Oak's night; 12 m from the hind
    // on the threshold, who stands alone; her spine 2.4 m from every butterfly's point (live's butterflies keep within 1.8 m of their own points on each axis,
    // which the seed deals, so the hinds' sides and distances differ from seed to seed and with the number of butterflies); 1 m clear
    // of every lark's column; 4.2 m from every hind already standing. If a place is not free she takes the next of the count's places
    // (the other side, then 2 m on, 2 m back, 4 m on, 4 m back along the path), up to twenty; one with no free place is left out. Each stands on what
    // is under her. They take their night from the place they stand in, like every other body here; none walks, none is moved by u,
    // and the clock moves only her breath, her ears and her tail, each hind on a phase of her own.
    const graze = P3.graze ? [makeHinds(W, 7), makeHinds(W, 4)] : null;   // heads down; heads up
    if (graze) {
      // no live line is changed for them: the seven with heads down share one copy of the hind's mesh, its neck and head swung down about
      // the shoulder once, at build (eased in along the neck)
      { const A = graze[0].geometry.attributes, ca = Math.cos(-1.36), sa = Math.sin(-1.36);
        for (let i = 0; i < A.position.count; i++) {
          const qx = A.position.getX(i) - 0.5, qy = A.position.getY(i) - 1.05, nx = A.normal.getX(i), ny = A.normal.getY(i);
          const w = sstep(0.02, 0.3, qx * 0.58 + qy * 0.81), c = 1 + (ca - 1) * w, s = sa * w;
          A.position.setXY(i, 0.5 + qx * c - qy * s, 1.05 + qx * s + qy * c); A.normal.setXY(i, nx * c - ny * s, nx * s + ny * c);
        } }
      let nd = 0, nu = 0;
      // a place: metres of path and metres to starboard (minus is port); one that would straddle the lawn's rim steps onto the lawn
      const place = (d, off, out) => {
        const p = path.posAtDist(d), r = right(d, v2); out.set(p.x + r.x * off, 0, p.z + r.z * off);
        const rr = Math.hypot(out.x, out.z); if (Math.abs(rr - 118) < 2.5) out.multiplyScalar(115.5 / rr);
        out.y = floorY(out.x, out.z); return out;
      };
      // free(her place, her heading, her size): her body is taken as her spine (1.1 m behind her feet to 1.5 m before them, by her size) with 0.35 m round it
      const stood = [];
      const free = (q, a, sc) => {
        const hx = Math.cos(a), hz = Math.sin(a);
        const gap = (x, z) => { const px = x - q.x, pz = z - q.z, al = Math.min(1.5 * sc, Math.max(-1.1 * sc, px * hx + pz * hz)); return Math.hypot(px - hx * al, pz - hz * al) - 0.35 * sc; };
        return !onWalk(q.x, q.z, 3.2, 4.2) && Math.hypot(q.x, q.z) - hemR(Math.atan2(q.x, q.z) / deg) > 6 && Math.hypot(q.x - threshAt.x, q.z - threshAt.z) > 12
          && bfBase.every((b) => gap(b.p.x, b.p.z) > 2.4) && riseAt.every((b) => gap(b.x, b.z) > 1.55) && stood.every((s) => Math.hypot(q.x - s.x, q.z - s.z) > 4.2);
      };
      const stand = (q, a, sc, down, ph) => (down ? graze[0] : graze[1]).userData.set(down ? nd++ : nu++, q, Math.cos(a), Math.sin(a), sc, ph, 0);
      const dA = uAt(hTrack.p) * Lp + 15, dB = uAt(threshAt) * Lp - 12;
      let dL = dA; while (dL < dB && Math.hypot(path.posAtDist(dL, v1).x, v1.z) > 118) dL += 0.5;
      for (let j = 0; j < 10; j++) {
        const d0 = j < 3 ? dA + (dL - dA) * (j + 1) / 4 : dL + (dB - dL) * (j - 2.5) / 7, sc = 1.05 + 0.1 * ((j * 0.381) % 1);
        let k = 0, a = 0;
        for (; k < 20; k++) {
          const d = d0 + [0, 2, -2, 4, -4][k >> 2], t = path.tangentAtDist(d); a = Math.atan2(t.z, t.x) + j * 2.4;
          if (free(place(d, ((j + k) % 2 ? -1 : 1) * (5.6 + 2.4 * (((j + k * 3) * 0.618) % 1)), v1), a, sc)) break;
        }
        if (k === 20) continue;
        stand(v1, a, sc, j % 3 !== 1, j * 1.7);
        if (j === 6) for (const s of [1, -1]) {   // her calf at her flank, 1.6 m off, on the first free side
          v3.set(v1.x - Math.sin(a) * 1.6 * s, 0, v1.z + Math.cos(a) * 1.6 * s); v3.y = floorY(v3.x, v3.z);
          if (Math.abs(Math.hypot(v3.x, v3.z) - 118) > 2.5 && free(v3, a + 0.4, 0.62)) { stand(v3, a + 0.4, 0.62, false, 9.3); stood.push(v3.clone()); break; }
        }
        stood.push(v1.clone());
      }
      graze[0].count = nd; graze[1].count = nu;
      for (const m of graze) { m.instanceMatrix.needsUpdate = true; m.geometry.attributes.aGo.needsUpdate = true; scene.add(m); }
    }
    let gainU = 0; let gain = 1;
    const camW = new THREE.Vector3();
    const bellU = (c, w, u) => { const t = Math.max(0, 1 - Math.abs(u - c) / w); return t * t * (3 - 2 * t); };
    return {
      scene, path, duration: Math.round(Lp / 16), title: S.name,
      // linger at the thorn, the hind, the whole Oak, the threshold, the moon from the trunk's side, and the pond
      pace: (u) => 1.18 - 0.22 * bellU(uHaw, 0.035, u) - 0.25 * bellU(uHind, 0.035, u) - 0.3 * bellU(uHero, 0.05, u) - 0.28 * bellU(uRing - 0.015, 0.05, u)
        - 0.25 * bellU(uP2 + 0.02, 0.04, u) - 0.3 * bellU(uPond + 0.015, 0.05, u) - 0.38 * bellU(uMS - 0.012, 0.045, u) - 0.25 * bellU(uB + 0.012, 0.04, u)
        - 0.45 * sstep(uRun - 0.06, uRun, u) * (1 - sstep(uMoonPass + 0.005, uMoonPass + 0.05, u)) - 0.2 * sstep(uMoonPass + 0.005, uMoonPass + 0.05, u),
      camera: { fov: 62, near: 0.3, far: 2400, lookAhead: 22, bank: 0, nearThrough: 0.3 },
      pois: [
        { at: thornTop, from: 0.045, to: 0.105, weight: 0.42, fade: 0.35 },                                        // inside the thorn's night: the whole old tree, crown and all
        { at: () => hindAt, from: uHind - 0.05, to: uHind + 0.03, weight: 0.4, fade: 0.3 },
        { at: [0, 30, 0], from: uHero - 0.06, to: uHero + 0.045, weight: 0.7, fade: 0.3 },
        { at: threshAt, from: uRing - 0.085, to: uRing - 0.012, weight: 0.5, fade: 0.3 },
        { at: [-6, 15, -3], from: uRing - 0.005, to: uP2 - 0.03, weight: 0.8, fade: 0.22 },                       // from inside its edge: the whole midnight, trunk, moon and pond, on a level horizon
        { at: standAt, from: uP2 - 0.035, to: uP2 + 0.05, weight: 0.6, fade: 0.3 },                               // two hinds standing in the campion against the moon
        { at: [-27.5, 5.2, -9.5], from: uPond - 0.045, to: uPond + 0.035, weight: 0.75, fade: 0.3 },             // low over the star pond: the stag under the moon in its crook
        { at: moonLow, from: uMS - 0.04, to: uMS + 0.014, weight: 0.8, fade: 0.36 },                               // turned to face the moon from the south: the stag, the pond and the herd beyond it
        { at: standB, from: uB - 0.045, to: uB + 0.03, weight: 0.75, fade: 0.3 },                                 // two hinds and a calf in the campion, the moon full on them
        { at: [-27, 1, 6], from: uB + 0.034, to: uRun - 0.03, weight: 0.8, fade: 0.3 },                           // round the pond's head with the eye on the water
        // on the exit line the gaze goes to the arch of day and stays near it; the stag and the moon sit on the inside of that view
        { at: portalP.clone().setY(5), from: uRun - 0.036, to: uMoon - 0.02, weight: 0.55, fade: 0.25 },
        { at: A.stag.head.clone(), from: uStag - 0.045, to: uStag - 0.006, weight: 0.3 },
        { at: A.moon.position.clone(), from: uMoon - 0.022, to: uMoonPass + 0.004, weight: 0.42, fade: 0.25 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#FFE7A8', glow: 1, revealDistance: 240, blendDistance: 30 },
      post: { exposure: 1.0, bloom: { strength: 0.5, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.08, contrast: 1.03, tint: '#ffffff', shadowTint: '#0a1030', vignette: 0.28, grain: 0.02, aberration: 0 } },
      ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        const cp = camera.getWorldPosition(camW);
        // eye adaptation and haze follow the camera's own n
        const camN = Math.max(1 - sstep(-2, 2, hero.nightD(cp, time)), camNsmall(cp, time));
        // the eye opens further where the moon is far (under the boughs, high in the fork, coming down to the pond)
        const lift = sstep(uRing, uRing + 0.03, u) * (1 - sstep(uPond - 0.05, uPond, u)) + 0.5 * sstep(uB - 0.045, uB - 0.01, u) * (1 - sstep(uRun - 0.05, uRun, u));
        const want = 1 + (0.06 + 0.8 * lift) * camN * (1 - 0.45 * sstep(uMoonPass + 0.01, 1, u));
        gain += (want - gain) * Math.min(1, dt * 2.5); if (dt > 0.5 || Math.abs(u - gainU) > 0.02) gain = want;   // a still shows what the flight shows
        gainU = u;
        U.uGain.value = gain;
        HU.uStarAmb.value.copy(base.amb).multiplyScalar(gain); HU.uMoonCol.value.copy(base.moon).multiplyScalar(gain);
        const fn = camN * (1 - 0.7 * sstep(uMoonPass, 0.995, u));
        scene.fog.color.copy(fogDay).lerp(fogNight, fn); scene.fog.density = 0.0012 + (0.0022 + 0.003 * S.mist) * fn;
        hero.setProgress(sstep(uStag - 0.075, uStag - 0.03, u));
        // the rare event: a cloud shadow crosses the meadow and night spills out to fill it
        const spill = U.uTrees.value[NT - 1];
        if (look.rare) {
          const uA = 84 / Lp, uB = 180 / Lp, sp = (u - uA) / (uB - uA);     // drained again before the held hero shot
          const R = 46 * sstep(0, 0.22, sp) * (1 - sstep(0.8, 1, sp));
          const d = uA * Lp + 34 + Math.min(1, Math.max(0, sp)) * (uB - uA) * Lp * 0.8;
          path.posAtDist(d, v1); right(d, v2);
          // it lies to starboard and the flight skirts its sunset edge, so the Oak stays in view to port
          const lat = R * 0.9 + 3.5 - 5 * Math.sin(Math.min(1, Math.max(0, sp)) * Math.PI);
          spill.set(v1.x + v2.x * lat, v1.z + v2.z * lat, Math.max(1, R), Math.max(1, R * 0.4));
          U.uTreeY.value[NT - 1] = groundH(spill.x, spill.y);
        }
        placeHinds(u);
        hero.update(dt, time, camera);
        HU.uProgress.value = sstep(uStag - 0.075, uStag - 0.03, u);          // the stag's head is keyed to the place, not to elapsed frames
        sky.update(dt, time, camera);
        // grass windows travel ahead of the eye
        camera.getWorldDirection(v1); v1.y = 0; if (v1.lengthSq() < 1e-6) v1.set(0, 0, -1); v1.normalize();
        W.cen.near.value.set(cp.x + v1.x * 17, cp.z + v1.z * 17); W.cen.far.value.set(cp.x + v1.x * 48, cp.z + v1.z * 48);
        ctx.renderer.getDrawingBufferSize(buf); W.uPx.value = camera.projectionMatrix.elements[5] * buf.y * 0.5; W.starPx.value = Math.max(1, buf.y / 450);
        // larks rise singing from the grass 3 m to port as the eye arrives
        for (let i = 0; i < 2; i++) {
          const d = larkD[i], u0 = d / Lp, k1 = sstep(u0 - 0.04, u0 - 0.008, u), k2 = sstep(u0 - 0.008, u0 + 0.05, u);
          path.posAtDist(d, v1); right(d, v2);
          const a = time * 1.6 + i * 2, y = groundH(v1.x, v1.z) + 0.6 + 2.9 * k1 + 10 * k2 + Math.sin(time * 3.1 + i) * 0.12;
          v3.set(v1.x - v2.x * 2.4 + Math.cos(a) * 0.4, y, v1.z - v2.z * 2.4 + Math.sin(a) * 0.4);
          v4.set(-Math.sin(a), 0.6 + 1.2 * k2, Math.cos(a));
          larks.userData.set(i, v3, 0.5, v4);
        }
        larks.instanceMatrix.needsUpdate = true;
        const du = (0.05 * 17.5) / Lp;
        for (let i = 0; i < 8; i++) { swallowPos(i, time, u, v1); swallowPos(i, time + 0.05, u + du, v2); swallows.userData.set(i, v1, 0.56, v2.sub(v1), -0.95 + 0.35 * Math.sin(time * 1.7 + i)); }   // banked, so the eye sees the whole wing
        swallows.instanceMatrix.needsUpdate = true;
        owlPos(u, time, v1); owlPos(u + du, time + 0.05, v2); owl.userData.set(0, v1, 1.9, v2.sub(v1), 0.12);
        owl2Pos(u, time, owl2At); owl2Pos(u + du, time + 0.05, v2); owl.userData.set(1, owl2At, 2.1, v2.sub(owl2At), 0.1); owl.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < nb; i++) {
          bfAt(bfBase[i], time, v1); bfAt(bfBase[i], time + 0.05, v2).sub(v1);
          bflies.userData.set(i, v1, 0.11, v2);
        }
        bflies.instanceMatrix.needsUpdate = true;
        // p3: the lark-rise. Each lark's round goes by the clock alone: up from the grass in its first fifth, a hover at its own height for half of it, down again, a rest
        if (rise) {
          for (let i = 0; i < riseAt.length; i++) {
            const b = riseAt[i], s = (time / b.T + b.ph) % 1, up = sstep(0, 0.2, s), dn = sstep(0.7, 0.86, s), a = time * 1.6 + i * 2;
            v3.set(b.x + Math.cos(a) * 0.3, b.g + 0.6 + (b.top - 0.6) * up * (1 - dn) + Math.sin(time * 3.1 + i) * 0.12, b.z + Math.sin(a) * 0.3);
            v4.set(-Math.sin(a), 0.35 + 5 * up * (1 - up) - 3 * dn * (1 - dn), Math.cos(a));
            rise.userData.set(i, v3, 0.5, v4);
          }
          rise.instanceMatrix.needsUpdate = true;
        }
      },
      dispose() { hero.dispose(); sky.dispose?.(); },
    };
  },
};
