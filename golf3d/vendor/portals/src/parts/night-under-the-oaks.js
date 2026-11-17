// THE NIGHT OAK: hero set piece for "night-under-the-oaks" (Where Night Spends the Day).
//
// WHAT IT IS  A 70 m oak whose shade is a piece of true night. One breathing, lobed ellipsoid (radius 75 m,
//   height 52 m) is drawn twice: back faces = the opaque star wall (2,600-odd hashed stars, Milky Way, meteors,
//   a 9 m hem of orange / rose / violet dusk, an alpha-cut exit arch 40 x 11 m at -Z); front faces = a blue veil
//   whose alpha is the analytic chord through the night, plus near stars. Inside: trunk with seven buttresses,
//   seven elbowed boughs (two rest an elbow on the lawn as exit gateposts), leaf tiers of cauliflower masses
//   clad in oak-leaf spray cards, the sunlit island of crown above the dome, a moon (real cratered sphere,
//   its lit face toward the viewer) lodged LOW, in the crook of a bough that elbows down to 5 m above the lawn
//   30 m out, with 60 hawk moths; a star pond on the exit line with the moon's glitter path and mist, eleven
//   hinds, three calves and a twelve-point stag asleep on its bank under the moon, an owl, a rope swing, ferns,
//   a fairy ring, 500 fireflies with pools of light on the grass, 700 motes in the sunset ring, stars leaking
//   downwind. A lawn disc (118 m, campion drifts, moon pool, leaf dapple under the oak) carries the
//   4 m sunset band and runs out into buttercup meadow with a dithered edge.
// ROUND 2  Leaf masses are unions of billows (lobeR in makeFoliage) with leaf-cut cores and fin sprays; bark is
//   fissured plates in (round the limb, arc length); the moon's prongs come round its flanks from behind; five
//   hinds and a calf sleep on an islet in the pond (uIsle, isleY), the rest along the far bank; the exit arch is cut
//   about the exit line (uExit) and throws a fan of gold on the sward (exitFan); far off, the wall and veil show a
//   few dozen stars on deep blue instead of thousands (farK).
// SPACE  Hero-local: trunk foot at the origin, +Y up, approach side +Z, exit arch at -Z. radius 78, height 70.
//   Keep the world's terrain flat (y = 0) within ~100 m, or pass opts.ground = false and shade your own
//   ground with NIGHT_LAW_GLSL.
// OPTS  palette (7 hex strings, brief order), detail 0.6..1 (thins leaf sprays, ferns, fireflies, motes,
//   moths, stray stars; never the oak, moon, pond or deer), ground (default true: the lawn disc).
// RETURNS (beyond the contract)
//   uniforms       shared by every material: uSunDir/uSunCol/uSkyCol (noon), uStarAmb/uMoonCol (night),
//                  uRampA/B/C (dusk), uDome (R, H, band half-width, breath amplitude), uWind, uMoon, uCamN.
//   lawGLSL/skyGLSL  the night law and the star function, to put the same line through the world's materials.
//   nightD(worldPos) signed metres outside the night (negative inside); n = 1 - smoothstep(-2, 2, d).
//   setProgress(u) 0..1 = the stag lifts his head (map journey u 0.72..0.76 onto it). If never called he
//                  lifts it when the viewer comes within ~25 m; his head then follows the viewer by itself.
//   setSun(dirWorld) noon key direction (default 68 degrees up, from +X +Z).
// ANCHORS (hero-local Vector3s)
//   portalSeat {position, facing}  centre of the 14 m ring, 6 m inside the band in the arch mouth; facing
//                  points at the arriving camera.   exitArch {center, halfWidth, height}.   gateposts [2].
//   crossing [4]   points along the middle of the sunset ring (fly them in order: noon to port, night to starboard).
//   flyThrough [..] ordered safe camera line: along the ring -> one right-hand quarter turn (24 m radius) under
//                  the boughs -> runStart -> 100 m dead straight (EXIT_BACK, 19 degrees off the arch axis): pond
//                  skim at 2.6 m with the hinds 6 m to port, the stag 7 m to port, the moon 9 m to port at
//                  y 8 (eye at 3.3: look up at it), past the fairy ring, between the gateposts to the portal.
//                  Stay under y 6 until z < -40 (boughs cross the straight at 10 m).   runStart: its start.
//   moon {position, radius, passAt, view}, pond {center, radius}, stag {position, head}, herd [], swingSeat,
//   fairyRing, owl, fork, approach (far front viewpoint), viewpoints {split, moon, pond, exit}: {from, lookAt}.
// COST  about 115k triangles, 13 draw calls, ~300 ms build, one 256 px canvas texture, no lights.
// LIGHTING  Self-lit: every material is a ShaderMaterial running the law below, so scene lights are ignored;
//   it only takes scene fog. Linear HDR out. Night values are tuned for exposure ~1.6 inside (1.0 outside);
//   bloom should catch only the moon's crescent (2.1), bright stars (to ~5), fireflies (4) and the dusk hem.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const DEF_PALETTE = ['#F2D95C', '#7DB34A', '#BFE3F5', '#0B1033', '#E9ECFF', '#F08A4B', '#2C4A2E'];
const DOME_R = 75, DOME_H = 52, BAND_W = 2;
const TAU = Math.PI * 2;
const col = (h) => new THREE.Color(h);
// place on the ground plan by compass angle a (0 = +Z front, +90 deg = +X) and distance r
const polar = (a, r, y = 0) => new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
// THE EXIT LINE. The last 100 m are one straight: over the star pond, past the stag, 9 m from the low moon,
// between the gateposts to the ring. EXIT_BACK points from the portal back along it (19 degrees off the arch axis).
const EXIT_BACK = new THREE.Vector3(-0.3277, 0, 0.9448);
const MOON_VIEW = new THREE.Vector3(-0.516, 0, -0.86);       // horizontal direction eye -> moon at the moon beat

// ------------------------------------------------------------------------------------------------
// THE LAW OF THE WORLD (GLSL). Every material of the hero includes this chunk; the world coder can reuse
// it verbatim (exported as NIGHT_LAW_GLSL) with the same uniforms (hero.uniforms).
//   nightD(p): signed distance-like value to the dome surface, lobed and breathing.  n = nightN(p): 0 noon, 1 night.
//   oakLaw(albedo, p, N, V): mix(noonLit, nightLit, n) + sunset ramp in the band.
export const NIGHT_LAW_GLSL = /* glsl */`
uniform float uTime;
uniform vec4 uDome;      // R, H, band half width, breath amplitude
uniform vec3 uMoon;      // moon centre, hero-local
uniform vec3 uSunDir;    // hero-local, normalised
uniform vec3 uSunCol;
uniform vec3 uSkyCol;
uniform vec3 uStarAmb;
uniform vec3 uMoonCol;
uniform vec3 uRampA;     // orange
uniform vec3 uRampB;     // rose
uniform vec3 uRampC;     // violet
uniform vec3 uCamL;      // camera position, hero-local
uniform vec4 uExit;      // exit arch: compass angle, half width m, height m
uniform vec2 uHem;       // dusk horizon: height m, power
float hemT(float h){ return pow(clamp(h / max(uHem.x, .1), 1e-4, 1.), uHem.y); }
float h11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float h31(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  float a = mix(mix(h31(i), h31(i + vec3(1., 0., 0.)), f.x), mix(h31(i + vec3(0., 1., 0.)), h31(i + vec3(1., 1., 0.)), f.x), f.y);
  float b = mix(mix(h31(i + vec3(0., 0., 1.)), h31(i + vec3(1., 0., 1.)), f.x), mix(h31(i + vec3(0., 1., 1.)), h31(i + vec3(1., 1., 1.)), f.x), f.y);
  return mix(a, b, f.z); }
float fbm2(vec2 p){ return vn2(p) * .5 + vn2(p * 2.03 + 7.1) * .3 + vn2(p * 4.1 + 3.7) * .2; }
float safeAng(vec2 v){ return atan(v.y, abs(v.x) < 1e-4 ? 1e-4 : v.x); }
float domeLobes(float a){ return sin(a * 3. + .7) * .5 + sin(a * 5. + 2.1) * .3 + sin(a * 8. + 4.) * .2; }
float domeBreath(float a){ return uDome.w * (sin(a * 2. + uTime * .79) * .55 + sin(a * 5. - uTime * .52 + 1.3) * .45); }
float domeScale(float a){ return 1. + .06 * domeLobes(a); }
float nightD(vec3 p){
  float a = safeAng(p.zx);
  vec3 q = vec3(p.x, p.y * uDome.x / uDome.y, p.z);
  return length(q) - uDome.x * domeScale(a) - domeBreath(a);
}
float nightN(vec3 p){ return 1. - smoothstep(-uDome.z, uDome.z, nightD(p)); }
vec3 duskRamp(float n){
  vec3 c = mix(uRampA, uRampB, smoothstep(.25, .5, n));
  return mix(c, uRampC, smoothstep(.5, .75, n));
}
// THE MIDNIGHT IS LIT FROM ITS REAL SOURCES. oakN = how far p is inside the Oak's own night (small trees'
// nights pass 0 and keep the older, even starlight). Sources: (1) a low blue starlight, (2) the moon in its
// fork: a key that falls with distance, an ivory pool near it and an ivory rim on whatever faces it,
// (3) the horizon of dusk: orange-rose on undersides and outward faces low down near the hem,
// (4) the arch of day: a fan of warm gold spilling in along the exit axis.
float exitFan(vec3 p, out vec3 Le){
  vec2 ea = vec2(sin(uExit.x), cos(uExit.x)), fa = vec2(sin(uExit.w), cos(uExit.w));   // arch axis; the flight's own line out
  vec2 E = ea * uDome.x, q = p.xz - E;
  float depth = max(-dot(q, fa), 0.), lat = abs(q.x * fa.y - q.y * fa.x);
  vec3 toE = vec3(E.x, uExit.z * .35, E.y) - p; Le = toE / max(length(toE), 1e-3);
  float w = uExit.y * .85 + depth * .42, low = smoothstep(2.6, .3, p.y);
  float wide = smoothstep(w, w * .25, lat) * exp(-depth / 34.) * smoothstep(uExit.z * 1.2 + depth * .45, uExit.z * .3, p.y);
  // on the sward the day lies as one fan of gold along the line of flight, from the ring's foot 50 m into the night,
  // and the grass either side of it stays moonlit blue
  float wp = max(uExit.y * .44 - depth * .1, 3.4);
  float path = smoothstep(wp, wp * .25, lat) * exp(-depth / 46.) * low;
  return wide * (1. - .72 * low) + path * 3.4;
}
vec3 nightLit(vec3 alb, vec3 p, vec3 N, vec3 V, float ao, float oakN){
  vec3 toM = uMoon - p; float dm = length(toM); vec3 Lm = toM / max(dm, 1e-3);
  float ndl = dot(N, Lm);
  vec3 albN = mix(alb, vec3(dot(alb, vec3(.3, .5, .2))) * 1.25, .5);
  float rim = 1. - max(dot(N, V), 0.); rim = rim * rim * rim;
  // the older even night (lesser trees): starlight ambient + a floored moon
  float fall0 = max(.35, 1. / (1. + dm * dm / 900.));
  vec3 flat0 = albN * (uStarAmb * (.7 + .3 * N.y) + uMoonCol * max(ndl * .7 + .3, 0.) * fall0) * (.45 + .55 * ao) + uStarAmb * rim * .3 * ao;
  // the Oak's midnight
  float fall = max(.045, 1. / (1. + dm * dm / 620.));
  float pool = smoothstep(17., 3., dm);
  float ml = max(ndl * .86 + .14, 0.);
  vec3 c = albN * uStarAmb * (.3 + .26 * N.y) * (.5 + .5 * ao);
  c += albN * uMoonCol * vec3(1.06, 1., .86) * ml * (fall * 1.5 + pool * 1.45) * (.4 + .6 * ao);
  c += uMoonCol * vec3(1.05, 1., .88) * rim * smoothstep(-.25, .45, ndl) * (.1 + 1.1 * fall + pool) * .55 * ao;
  c += uStarAmb * rim * .16;
  // dusk horizon: a low warm light arriving from outward and below
  float r = length(p.xz); vec2 rad = p.xz / max(r, 1e-3);
  float wd = smoothstep(.22, .92, r / uDome.x) * exp(-max(p.y, 0.) / 13.);
  wd *= .28 + .72 * smoothstep(.3, 1., uHem.y);          // a thin line of fire throws far less light than a full dusk
  float dl = max(dot(N, vec3(rad.x * .9, -.42, rad.y * .9)), 0.);
  c += mix(mix(uRampA, uRampB, .45), vec3(dot(uRampA, vec3(.3, .5, .2))), .3) * wd * (albN * (dl * 1.5 + .1) + rim * .22 * (.4 + dl)) * .4;
  // the arch of day
  vec3 Le; float fan = exitFan(p, Le);
  float el = .34 + .66 * max(dot(N, Le), 0.);
  c += uSunCol * vec3(1., .66, .27) * fan * (mix(albN, alb, .6) * el * .8 + rim * .5 * smoothstep(-.3, .3, dot(N, Le)) + .026);
  return mix(flat0, c, oakN);
}
// returns linear HDR colour. alb under ~0.8.
vec3 lawMix(vec3 alb, vec3 p, vec3 N, vec3 V, float ao, float n, vec3 night){
  float nl = max(dot(N, uSunDir), 0.);
  vec3 noon = alb * (uSunCol * nl * ao + uSkyCol * (.55 + .45 * N.y) * ao);
  float rim = 1. - max(dot(N, V), 0.); rim = rim * rim * rim;
  // band: a level warm light pointing outward from the trunk, so it rims whatever stands in it
  float band = 4. * n * (1. - n);
  vec2 rad = p.xz / max(length(p.xz), 1e-3);
  float bl = .55 + .45 * abs(dot(N.xz, rad));
  return mix(noon, night, n) + duskRamp(n) * band * bl * (.25 + alb * .9 + .35 * rim);
}
vec3 oakLaw(vec3 alb, vec3 p, vec3 N, vec3 V, float ao){
  float n = nightN(p);
  return lawMix(alb, p, N, V, ao, n, nightLit(alb, p, N, V, ao, 1.));
}
`;

// shared vertex prologue: lp = hero-local position, ln = hero-local normal (all meshes sit untransformed in the root)
const VERT_COMMON = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec3 vP; varying vec3 vN;
`;
const FRAG_COMMON = /* glsl */`
#include <common>
#include <fog_pars_fragment>
varying vec3 vP; varying vec3 vN;
` + NIGHT_LAW_GLSL;

function makeShared(pal) {
  // uniforms shared BY REFERENCE between every material of the hero
  return {
    uTime: { value: 0 },
    uDome: { value: new THREE.Vector4(DOME_R, DOME_H, BAND_W, 1.0) },
    uMoon: { value: new THREE.Vector3(0, 16, -22) },
    uSunDir: { value: new THREE.Vector3(0.28, 0.927, 0.25).normalize() },
    uSunCol: { value: col('#FFF6E0').multiplyScalar(1.05) },
    uSkyCol: { value: col(pal[2]).multiplyScalar(0.38) },
    uStarAmb: { value: col('#24347E').multiplyScalar(1.5) },
    uMoonCol: { value: col(pal[4]).multiplyScalar(0.4) },
    uRampA: { value: col(pal[5]).multiplyScalar(1.5) },
    uRampB: { value: col('#E8668A').multiplyScalar(1.35) },
    uRampC: { value: col('#6A4BC0').multiplyScalar(1.5) },
    uCamL: { value: new THREE.Vector3(0, 10, 200) },
    uCamN: { value: 0 },          // the camera's own n (0 outside, 1 inside), set in update()
    uPhase: { value: 0 },         // moon phase: 0 crescent .. 1 full, set by hero.setMoon()
    uProgress: { value: 0 },      // stag head lift 0..1, set by hero.setProgress()
    uExit: { value: new THREE.Vector4(Math.PI - 0.038, 23, 11.5, Math.atan2(-EXIT_BACK.x, -EXIT_BACK.z)) },
    uIsle: { value: new THREE.Vector4(0, 0, 9.5, 4.5) },      // the hinds' islet in the star pond: centre x, z, half length (along the exit line), half width
    uIsleDir: { value: new THREE.Vector2(EXIT_BACK.x, EXIT_BACK.z) }, // exit arch: compass angle, half width m, height m
    uPond: { value: new THREE.Vector4(0, 0, 15, 0) },        // pond centre x, z, radius
    uWind: { value: new THREE.Vector2(0.94, 0.34) },         // downwind direction on the ground plan (x, z), unit
    uHem: { value: new THREE.Vector2(9.5, 1) },              // dusk horizon: height in m, and a power (< 1 squeezes the fire into a thin line)
  };
}
function lawMaterial(shared, { vert, frag, uniforms = {}, ...rest }) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, ...uniforms },
    vertexShader: VERT_COMMON + vert, fragmentShader: FRAG_COMMON + frag, fog: true, ...rest,
  });
}

// ------------------------------------------------------------------------------------------------
// OAK SKELETON: swept tubes with parallel-transport frames, all written into one set of arrays.
function makeTubeSink() {
  const pos = [], nor = [], uv = [], idx = [], tan = [];
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), tmp = new THREE.Vector3();
  // pts: Vector3[], rad: number[] (same length), sides, shape(a, i) -> radius multiplier (buttresses), cap the tip
  function tube(pts, rad, sides, shape) {
    const base = pos.length / 3, n = pts.length;
    N.set(0, 0, 0); let len = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      T.subVectors(b, a).normalize();
      if (i === 0) { N.set(1, 0, 0); if (Math.abs(T.x) > 0.8) N.set(0, 0, 1); }
      N.addScaledVector(T, -N.dot(T)).normalize();
      B.crossVectors(T, N);
      if (i > 0) len += pts[i].distanceTo(pts[i - 1]);
      for (let s = 0; s <= sides; s++) {
        const ang = (s / sides) * TAU, c = Math.cos(ang), sn = Math.sin(ang);
        const r = rad[i] * (shape ? shape(ang, i, pts[i]) : 1);
        tmp.set(0, 0, 0).addScaledVector(N, c).addScaledVector(B, sn);
        pos.push(pts[i].x + tmp.x * r, pts[i].y + tmp.y * r, pts[i].z + tmp.z * r);
        nor.push(tmp.x, tmp.y, tmp.z);
        uv.push(s / sides, len); tan.push(T.x, T.y, T.z, r);
      }
    }
    const w = sides + 1;
    for (let i = 0; i < n - 1; i++) for (let s = 0; s < sides; s++) {
      const a = base + i * w + s, b = a + 1, c = a + w, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    // rounded tip cap
    const tip = pos.length / 3, e = pts[n - 1];
    pos.push(e.x + T.x * rad[n - 1] * 0.8, e.y + T.y * rad[n - 1] * 0.8, e.z + T.z * rad[n - 1] * 0.8);
    nor.push(T.x, T.y, T.z); uv.push(0.5, len + rad[n - 1]); tan.push(T.x, T.y, T.z, rad[n - 1] * 0.3);
    for (let s = 0; s < sides; s++) idx.push(base + (n - 1) * w + s, tip, base + (n - 1) * w + s + 1);
  }
  function geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('aT', new THREE.Float32BufferAttribute(tan, 4));
    g.setIndex(idx);
    return g;
  }
  return { tube, geometry, tris: () => idx.length / 3 };
}

// sample a tight Catmull-Rom through knots: sharp elbows stay sharp, the tube does not pinch
function sweep(knots, radii, step, tension = 0.18) {
  const curve = new THREE.CatmullRomCurve3(knots, false, 'catmullrom', tension);
  let L = 0; for (let i = 1; i < knots.length; i++) L += knots[i].distanceTo(knots[i - 1]);
  const n = Math.max(3, Math.round(L / step));
  const pts = [], rad = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n; pts.push(curve.getPoint(t));
    const f = t * (radii.length - 1), k = Math.min(radii.length - 2, Math.floor(f));
    rad.push(radii[k] + (radii[k + 1] - radii[k]) * (f - k));
  }
  return { pts, rad };
}

// Compass angles (degrees) of the seven boughs. 0 and 1 rest an elbow on the ground (the exit gateposts),
// 2 carries the moon. The rest are jittered per seed.
function planOak(rng) {
  const j = (d) => rng.range(-d, d);
  const boughs = [
    { a: -152, kind: 'ground', L: 76 }, { a: 152, kind: 'ground', L: 76 },
    { a: -120, kind: 'moon', L: rng.range(62, 70) },
    { a: -80 + j(5), kind: 'free', L: rng.range(62, 74) }, { a: -30 + j(6), kind: 'free', L: rng.range(60, 72) },
    { a: 26 + j(5), kind: 'free', L: rng.range(62, 74) }, { a: 100 + j(5), kind: 'free', L: rng.range(60, 72) },
  ];
  return boughs;
}

async function buildSkeleton(ctx, rng, sink, info) {
  const nodes = [];                        // {p, r} attach points for limbs
  const addNodes = (pts, rad, every = 2) => { for (let i = 1; i < pts.length; i += every) nodes.push({ p: pts[i], r: rad[i] }); };
  // --- trunk: 5 m thick, flaring to ~9 m in seven buttress roots that run out into the lawn
  const butN = 7, butPh = rng.range(0, TAU), butAmp = [];
  for (let i = 0; i < butN; i++) butAmp.push(rng.range(0.6, 1.25));
  const tp = [], tr = [];
  const lean = polar(rng.range(0, TAU), 1);
  for (let i = 0; i <= 15; i++) {
    const y = -1.2 + i * 0.85;
    tp.push(new THREE.Vector3(lean.x * y * 0.035 + Math.sin(y * 0.5) * 0.25, y, lean.z * y * 0.035 + Math.cos(y * 0.37) * 0.2));
    tr.push(2.45 + 0.5 * Math.max(0, (y - 7) / 4) + 0.25 * Math.sin(y * 1.3));
  }
  sink.tube(tp, tr, 36, (ang, i, p) => {
    const y = p.y, fl = Math.exp(-Math.max(0, y + 0.3) / 2.1);        // flare falls off with height
    const k = ((ang + butPh) / TAU) * butN, f = k - Math.floor(k), id = ((Math.floor(k) % butN) + butN) % butN;
    const ridge = Math.pow(Math.abs(Math.cos(f * Math.PI)), 2.4) * butAmp[id];
    return 1 + fl * (0.38 + 1.25 * ridge) + 0.045 * Math.sin(ang * 5 + y * 0.9) + 0.03 * Math.sin(ang * 11 - y * 1.7);
  });
  const fork = tp[tp.length - 3].clone();
  info.fork = fork;
  // --- seven boughs, almost level, sharp elbows
  info.boughs = [];
  for (const b of planOak(rng)) {
    await ctx.yield();
    const a = (b.a * Math.PI) / 180, side = polar(a + Math.PI / 2, 1);
    const kn = [], rr = [];
    const h0 = fork.y + rng.range(0.8, 1.5);
    kn.push(new THREE.Vector3(fork.x, h0 - 1.5, fork.z)); rr.push(1.25);
    kn.push(polar(a, 5.5, h0 + 0.8)); rr.push(1.15);
    let sgn = rng.chance(0.5) ? 1 : -1, r = 5.5;
    const thick = rng.range(0.82, 1.18);
    if (b.kind === 'ground') {
      // runs out level, elbows hard toward the exit, comes down to rest an elbow on the lawn 15 m to one
      // side of the exit axis (a gatepost), then climbs out through the dome's hem
      const sx = Math.sign(Math.sin(a));
      kn.push(polar(a, 20 + rng.range(-2, 2), h0 + 0.6)); rr.push(1.1 * thick);
      kn.push(polar(a + sx * 0.03, 39 + rng.range(-2, 2), h0 - 0.6 + rng.range(-0.4, 0.4))); rr.push(1.02 * thick);
      kn.push(new THREE.Vector3(sx * (18.5 + rng.range(-1, 1)), 5.2, -52)); rr.push(0.98 * thick);
      const g = new THREE.Vector3(sx * 15, 0.35, -62); kn.push(g); rr.push(0.98 * thick);
      kn.push(new THREE.Vector3(sx * (18.2 + rng.range(-1, 1.5)), 4.4, -64.6)); rr.push(0.74 * thick);
      const tip = new THREE.Vector3(sx * (23 + rng.range(-1, 2)), 11.5 + rng.range(0, 2), -60.5); kn.push(tip); rr.push(0.2);
      (info.tips = info.tips || []).push(tip);
      (info.gate = info.gate || []).push(g.clone());
    } else if (b.kind === 'moon') {
      // runs out level over the exit line, elbows hard down to a low crook 30 m out where the moon is lodged
      // (its ivory pools on the lawn, the pond bank and the stag), then climbs away to its leaves
      const lv = h0 + rng.range(0.2, 0.7);
      // it comes down on the trunk side of the disc as the flight sees it (fv = the viewer's right) and hooks under
      // the moon from there, so the limb grips the moon's flank and never crosses its face
      const fv = new THREE.Vector3(-MOON_VIEW.z, 0, MOON_VIEW.x);
      kn.push(polar(a, 14, lv + 0.7)); rr.push(1.05 * thick);
      kn.push(polar(a, 21.6, lv + 0.2).addScaledVector(fv, 2.6)); rr.push(0.98 * thick);
      kn.push(polar(a, 26.4, 8.7).addScaledVector(fv, 4.1)); rr.push(0.9 * thick);
      kn.push(polar(a, 29.3, 5.3).addScaledVector(fv, 2.9)); rr.push(0.86 * thick);
      kn.push(polar(a, 30.9, 4.5)); rr.push(0.84 * thick);
      kn.push(polar(a, 34.6, 5.4).addScaledVector(fv, -1.2)); rr.push(0.8 * thick);
      kn.push(polar(a, 41.5, 9.2).addScaledVector(side, sgn * 2.4)); rr.push(0.66 * thick);
      kn.push(polar(a, 51, 15).addScaledVector(side, -sgn * 2.2)); rr.push(0.5 * thick);
      kn.push(polar(a, b.L, 22.5).addScaledVector(side, sgn * 1.6)); rr.push(0.3 * thick);
    } else while (r < b.L - 6) {
      r += rng.range(9, 14); if (r > b.L - 4) r = b.L;
      const t = r / b.L; let y, off = sgn * rng.range(1.8, 4.6) * (0.4 + t);
      y = h0 + 0.2 + rng.range(-0.4, 0.4) + 0.5 * Math.sin(t * 5 + a) + 11 * Math.pow(Math.max(0, t - 0.62) / 0.38, 1.5);
      kn.push(polar(a, r, y).addScaledVector(side, off));
      rr.push(thick * THREE.MathUtils.lerp(1.02, 0.34, Math.pow(t, 1.25)));
      sgn = -sgn;
    }
    // the grounded and the moon boughs are seen from a few metres: their elbows are rounded (no pinched corner), the
    // limb is knuckled, and a grounded elbow sinks into the lawn among three short roots
    const near = b.kind !== 'free', sw = sweep(kn, rr, near ? 0.9 : 1.25, near ? 0.5 : 0.45);
    if (near) for (let i = 0; i < sw.rad.length; i++) sw.rad[i] *= 1 + 0.09 * Math.sin(i * 0.83 + a) + 0.06 * Math.sin(i * 2.1 + a * 3);
    sink.tube(sw.pts, sw.rad, near ? 16 : 12);
    if (b.kind === 'ground') {
      const g = info.gate[info.gate.length - 1];
      for (let k = 0; k < 3; k++) {
        const ra = a + 2.2 + k * 2.0, d1 = polar(ra, 1);
        const rs = sweep([g.clone().setY(0.9), g.clone().addScaledVector(d1, 1.3).setY(0.45), g.clone().addScaledVector(d1, 2.7).setY(0.05), g.clone().addScaledVector(d1, 3.8).setY(-0.5)], [0.5, 0.36, 0.22, 0.08], 0.6, 0.5);
        sink.tube(rs.pts, rs.rad, 8);
      }
    }
    addNodes(sw.pts, sw.rad, 3);
    info.boughs.push({ ...b, a, pts: sw.pts, rad: sw.rad });
  }
  return nodes;
}

// leader stems, the moon's fork, the limbs that carry the leaf tiers, and the list of leaf masses
async function buildCrown(ctx, rng, sink, nodes, info) {
  const fork = info.fork, blobs = [];
  // --- leader stems: the trunk divides at the first fork and climbs to hold the sunlit island
  const nLead = 4 + (rng.chance(0.5) ? 1 : 0), la0 = rng.range(0, TAU);
  for (let i = 0; i < nLead; i++) {
    const a = la0 + (i / nLead) * TAU + rng.range(-0.3, 0.3), top = rng.range(44, 58), out = rng.range(7, 17);
    const kn = [new THREE.Vector3(fork.x, fork.y - 2, fork.z)], rr = [1.25];
    const n = 4;
    for (let k = 1; k <= n; k++) {
      const t = k / n, wob = polar(a + 1.57, (k % 2 ? 1 : -1) * rng.range(1, 3.2) * t);
      kn.push(polar(a, out * Math.pow(t, 0.8) + (k === 1 ? 2.2 : 0), fork.y + (top - fork.y) * Math.pow(t, 0.9)).add(wob));
      rr.push(THREE.MathUtils.lerp(1.05, 0.22, Math.pow(t, 0.8)));
    }
    const sw = sweep(kn, rr, 2.2);
    sink.tube(sw.pts, sw.rad, 9);
    for (let k = 2; k < sw.pts.length; k += 2) nodes.push({ p: sw.pts[k], r: sw.rad[k] });
  }
  // --- the moon's fork: 22 m out along its bough, two prongs rise either side and grip the sphere
  const mb = info.boughs.find((b) => b.kind === 'moon');
  let mi = 0, lowY = 1e9;                                   // the seat is the bottom of the crook
  for (let k = 4; k < mb.pts.length - 2; k++) { const rk = Math.hypot(mb.pts[k].x, mb.pts[k].z); if (rk > 27 && rk < 36 && mb.pts[k].y < lowY) { lowY = mb.pts[k].y; mi = k; } }
  const seat = mb.pts[mi], mr = 3.0;
  const moon = new THREE.Vector3(seat.x, seat.y + mb.rad[mi] * 0.75 + mr, seat.z);
  info.moon = moon; info.moonR = mr; info.moonSeat = seat.clone();
  // the two prongs flank the disc as seen from the flight line (MOON_VIEW), so nothing crosses the moon's face
  // (fix round 4) the prongs stand east and west of the disc, which is its flank both from the exit line (MOON_VIEW) and
  // from the south lawn, where the flight turns to face the moon; their roots rise straight from the crook
  const along = polar(mb.a, 1), side = new THREE.Vector3(0.98, 0, -0.2);
  info.moonView = MOON_VIEW.clone();
  // Each prong leaves the crook BEHIND the moon as the flight sees it (pushed along MOON_VIEW), comes round the
  // flank and rises: from the flight line the disc is whole, with nothing dark crossing its lower limb.
  for (const s of [-1, 1]) {
    const at = (sd, bk, al, dy) => moon.clone().addScaledVector(side, s * sd).addScaledVector(MOON_VIEW, bk).addScaledVector(along, al).setY(moon.y + dy);
    const kn = [seat.clone().addScaledVector(MOON_VIEW, 0.3).setY(seat.y - 0.25),
      at(mr * 0.66, 0.25, 0, -mr * 0.8), at(mr + 0.12, 0.15, 0, -0.5), at(mr + 0.24, 0, 0.4, 1.7),
      at(mr + 2.2, 0, 2.5, 6.5), at(mr + 6.5, 0, 4 + rng.range(0, 3), 11.5)];
    const sw = sweep(kn, [0.3, 0.56, 0.5, 0.42, 0.3, 0.14], 0.7, 0.4);       // rooted inside the bough
    for (let i = 0; i < sw.rad.length; i++) { sw.rad[i] *= 1 + 0.2 * Math.sin(i * 1.3 + s) + 0.1 * Math.sin(i * 2.9 + 1.7 * s); sw.pts[i].y += 0.1 * Math.sin(i * 1.9 + s); }   // gnarled and knotted, not smooth horns
    sink.tube(sw.pts, sw.rad, 10);
    nodes.push({ p: sw.pts[sw.pts.length - 2], r: 0.25 });
  }
  // swing hangs from the same bough beyond the moon; the owl perches on the neighbouring free bough
  let si = mi; while (si < mb.pts.length - 2 && Math.hypot(mb.pts[si].x, mb.pts[si].z) < 40) si++;
  info.swingTop = mb.pts[si].clone(); info.swingAxis = along.clone(); info.swingR = mb.rad[si];
  const ob = info.boughs[3], oi = Math.min(ob.pts.length - 2, 12);
  info.perch = ob.pts[oi].clone().setY(ob.pts[oi].y + ob.rad[oi]); info.perchDir = polar(ob.a + 1.57, 1);
  // --- leaf tiers. Clusters of lobed masses in six storeys with sky between; each cluster gets its own limb.
  const tiers = [[27, 34, 58], [35, 15, 46], [42, 0, 27], [50.5, 0, 38], [58, 0, 29], [65.5, 0, 16]];
  const clusters = [];
  for (let ti = 0; ti < tiers.length; ti++) {
    const [ty, r0, r1] = tiers[ti], ring = ti >= 3 ? 11.5 : 16.5, ph = rng.range(0, TAU);
    for (let r = r1 - 5; r >= r0 - 2; r -= ring) {
      const rc = Math.max(r, 0.01), cnt = Math.max(1, Math.round((TAU * rc) / (ti >= 3 ? 12.5 : 17)));
      const rph = rng.range(0, TAU);
      for (let k = 0; k < cnt; k++) {
        if (ti < 3 && rng.chance(ti === 0 ? 0.06 : 0.14)) continue;    // sky gaps
        const a = rph + ph + (k / cnt) * TAU + rng.range(-0.12, 0.12);
        const rad = rc + rng.range(-3.5, 3.5), droop = ti === 0 ? -5.5 * THREE.MathUtils.smoothstep(rad, 52, 66) : 0;
        if (ti < 3 && ty + 6.5 > DOME_H * Math.sqrt(Math.max(0, 1 - Math.pow(rad / (DOME_R * 0.93), 2)))) continue;
        clusters.push({ c: polar(a, Math.max(0, rad), ty + rng.range(-1.6, 1.6) * (ti >= 3 ? 1.9 : 1) + droop), ti });
        if (rc < 1) break;
      }
    }
  }
  // the gateposts' tips end inside a heap of leaves (three masses each), so no bare limb end shows beside the arch
  for (const t of info.tips || []) blobs.push({ p: t.clone().setY(t.y + 0.5), s: 7.6, f: 0.72, seed: rng() }, { p: t.clone().add(new THREE.Vector3(Math.sign(t.x) * 4.6, 0.6, 3.2)), s: 6.0, f: 0.75, seed: rng() }, { p: t.clone().add(new THREE.Vector3(-Math.sign(t.x) * 3.2, 3.4, -1.5)), s: 5.4, f: 0.8, seed: rng() });
  await ctx.yield();
  let nc = 0;
  for (const cl of clusters) {
    if (nc++ % 16 === 15) await ctx.yield();
    const C = cl.c, rC = Math.hypot(C.x, C.z);
    // nearest lower attach point; limbs keep out of the flying corridor (r 26..47 below y 21)
    let best = null, bd = 1e9;
    for (const nd of nodes) {
      if (nd.p.y > C.y - 3.5) continue;
      const rn = Math.hypot(nd.p.x, nd.p.z);
      if (nd.p.y < 21 && rn > 25 && rn < 48) continue;
      const hd = Math.hypot(nd.p.x - C.x, nd.p.z - C.z), d = hd * 1.15 + (C.y - nd.p.y) * 0.45 - nd.r * 6;
      if (d < bd) { bd = d; best = nd; }
    }
    if (!best) continue;
    const p0 = best.p, upFirst = p0.y < 21 && rC > 24 && rC < 50;
    const k1 = new THREE.Vector3().lerpVectors(p0, C, upFirst ? 0.3 : 0.55);
    k1.y = p0.y + (C.y - p0.y) * (upFirst ? 0.8 : 0.3) + rng.range(-0.6, 0.6);
    k1.add(polar(rng.range(0, TAU), rng.range(0.5, 2.2)));
    const end = C.clone(); end.y -= 1.2;
    const r0 = Math.min(best.r * 0.62, 0.58), len = p0.distanceTo(C);
    // (fix round 4) a branch, not a rod: five knots that wander sideways off the straight line, thick where it leaves
    // the bough and tapering to a twig inside its leaves, with one side twig; its wobble comes from the cluster's own
    // place, so no draw of the shared rng moves
    const hsh = (i) => { const v = Math.sin(C.x * 12.9898 + C.z * 78.233 + C.y * 37.719 + i * 4.137) * 43758.5453; return v - Math.floor(v); };
    const span = new THREE.Vector3().subVectors(end, p0), perp = new THREE.Vector3(-span.z, 0, span.x);
    if (perp.lengthSq() < 1e-4) perp.set(1, 0, 0); perp.normalize();
    const bow = (t, i) => new THREE.Vector3().lerpVectors(k1, end, t).addScaledVector(perp, (hsh(i) - 0.5) * Math.min(4.2, len * 0.16)).setY(k1.y + (end.y - k1.y) * Math.pow(t, 0.8) + (hsh(i + 7) - 0.5) * 0.9);
    const kA = new THREE.Vector3().lerpVectors(p0, k1, 0.5).addScaledVector(perp, (hsh(1) - 0.5) * Math.min(2.4, len * 0.1)); kA.y += 0.25 * (k1.y - p0.y) * (upFirst ? 0.5 : -0.3);
    const kB = bow(0.4, 2), kC = bow(0.74, 3);
    const sw = sweep([p0.clone(), kA, k1, kB, kC, end], [r0 * 1.2, r0 * 0.95, r0 * 0.74, r0 * 0.52, r0 * 0.32, 0.09], Math.max(1.5, len / 11), 0.5);
    sink.tube(sw.pts, sw.rad, 6);
    { const tw = sweep([kB.clone(), kB.clone().lerp(C, 0.4).addScaledVector(perp, (hsh(4) < 0.5 ? -1 : 1) * (1.6 + 2 * hsh(5))).setY(kB.y + 1.2 + 1.5 * hsh(6)), C.clone().addScaledVector(perp, (hsh(4) < 0.5 ? -1 : 1) * (3 + 2.5 * hsh(8))).setY(C.y - 0.6)], [r0 * 0.36, r0 * 0.22, 0.06], 2.2, 0.5);
      sink.tube(tw.pts, tw.rad, 4); }
    for (let k = 3; k < sw.pts.length; k += 3) nodes.push({ p: sw.pts[k], r: sw.rad[k] });
    // the cauliflower: one big mass and 2-3 smaller lobes around and above it
    const nb = rng.int(2, 3) + (rng.chance(0.4) ? 1 : 0);
    const big = rng.range(5.2, 7.4);
    const isl = cl.ti >= 3;      // the sunlit island is rounder and heaped
    blobs.push({ p: C.clone(), s: big, f: isl ? rng.range(0.7, 0.88) : rng.range(0.52, 0.66), seed: rng() });
    if (isl) blobs.push({ p: C.clone().add(polar(rng.range(0, TAU), big * 0.3, big * rng.range(0.45, 0.65))), s: big * rng.range(0.6, 0.75), f: rng.range(0.75, 0.95), seed: rng() });
    for (let k = 0; k < nb; k++) {
      const s = rng.range(3.0, 5.2), a = rng.range(0, TAU);
      blobs.push({ p: C.clone().add(polar(a, big * rng.range(0.55, 0.95), rng.range(-0.4, 2.6) + (isl ? rng.range(-1.5, 2.5) : 0))), s: s * (isl ? 1.15 : 1), f: rng.range(0.6, 0.82) + (isl ? 0.1 : 0), seed: rng() });
    }
  }
  return blobs;
}

// ------------------------------------------------------------------------------------------------
// BARK: fissured plates (3D ridge noise stretched along the limb), lichen, moss on upper sides,
// a sliding wet glint toward the moon.
function makeBark(shared, geo, pal) {
  const mat = lawMaterial(shared, {
    uniforms: { uBarkA: { value: col('#3d3228') }, uBarkB: { value: col('#75695a') }, uLichen: { value: col('#9aa98a') }, uMoss: { value: col(pal[1]).lerp(col(pal[6]), 0.45) } },
    vert: /* glsl */`
      attribute vec4 aT; varying vec3 vT; varying vec3 vB;   // vB: place round the limb (0..1), metres along it, radius
      void main(){ vP = position; vN = normal; vT = aT.xyz; vB = vec3(uv, aT.w);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    frag: /* glsl */`
      uniform vec3 uBarkA, uBarkB, uLichen, uMoss; varying vec3 vT; varying vec3 vB;
      // OAK BARK. Long plates running along the limb, parted by deep fissures that join and split, with fine
      // cracks across them. The pattern lives in (round the limb, along the limb): the first is a circle in metres,
      // so it closes on itself, and the second is arc length, so nothing swirls where a limb bends.
      // plates: 3D cells stretched along the limb and cut by the limb's surface (edge = F2 - F1), so they close round
      // the limb with no seam and do not swirl where it bends. Eight neighbours are enough for jittered points.
      vec3 h33(vec3 p){ return fract(sin(vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)))) * 43758.5453); }
      vec2 plates(vec3 q){
        vec3 b = floor(q - .5); float f1 = 9., f2 = 9., id = 0.;
        for (int i = 0; i < 8; i++){
          float fi = float(i); vec3 c = b + vec3(mod(fi, 2.), mod(floor(fi * .5), 2.), floor(fi * .25));
          vec3 hh = h33(c), d = c + .15 + .7 * hh - q; float dd = dot(d, d);
          if (dd < f1) { f2 = f1; f1 = dd; id = hh.x; } else if (dd < f2) f2 = dd;
        }
        return vec2(sqrt(f2) - sqrt(f1), id);
      }
      // height of the bark at (round the limb 0..1, metres along it): x = relief 0..1, y = plate id, z = the long furrows
      vec3 barkH(vec2 ua, float rr){
        float th = ua.x * 6.2832;
        vec3 q = vec3(cos(th) * rr, sin(th) * rr, ua.y);
        vec3 w = q + (vec3(vn3(q * vec3(1.3, 1.3, .5) + 7.), vn3(q * vec3(1.3, 1.3, .5) + 19.), vn3(q * vec3(1.1, 1.1, .6) + 3.)) - .5) * .32;
        // long ridges a hand wide run along the limb between deep furrows; the plates cut them across here and there
        float fur = smoothstep(.1, .62, abs(2. * vn3(w * vec3(4.4, 4.4, .55)) - 1.) + .35 * (vn3(w * vec3(9., 9., 1.7) + 5.) - .5));
        vec2 pl = plates(w * vec3(4.6, 4.6, 1.15) + vec3(0., 0., .6 * vn3(w * vec3(3., 3., .4))));
        float plate = smoothstep(.02, .22, pl.x);
        float crk = smoothstep(.1, .34, abs(2. * vn3(w * vec3(3., 3., 7.) + 31.) - 1.) + .6 * pl.y);   // fine cracks across
        float hgt = fur * (.35 + .65 * plate) * (.72 + .28 * crk);
        return vec3(hgt * (.7 + .3 * pl.y) , pl.y, fur);
      }
      void main(){
        vec3 N = normalize(vN), T = vT / max(length(vT), 1e-4);
        float rr = max(vB.z, .08);
        vec3 q = vec3(cos(vB.x * 6.2832) * rr, sin(vB.x * 6.2832) * rr, vB.y * .3);   // for the broad tones below
        vec3 bh = barkH(vB.xy, rr); float h = bh.x;
        // relief from the height's own screen derivatives (taken here, outside any loop), faded with distance
        vec3 V = normalize(uCamL - vP); float dist = length(uCamL - vP);
        vec3 dpx = dFdx(vP), dpy = dFdy(vP); float hx = dFdx(h), hy = dFdy(h);
        vec3 gr = (dpx * hx + dpy * hy) / max(dot(dpx, dpx) + dot(dpy, dpy), 1e-7);
        gr -= N * dot(gr, N);
        N = normalize(N - clamp(gr * .07, -1.8, 1.8) * smoothstep(110., 22., dist));
        float big = fbm2(q.xz * .35 + q.y * .21);
        vec3 alb = mix(uBarkA * .1, mix(uBarkA, uBarkB, .1 + .45 * big + .3 * bh.y) * (.75 + .5 * h), smoothstep(.06, .5, h));
        float lich = smoothstep(.5, .7, vn3(vP * .55 + 11.) + .25 * bh.y - .1) * h;
        alb = mix(alb, uLichen * (.6 + .4 * vn3(vP * 6.)), lich * .7);
        float up = smoothstep(.12, .7, vN.y / max(length(vN), 1e-4) + (fbm2(vP.xz * .6) - .5) * .7);
        float foot = smoothstep(2.6, .2, vP.y) * smoothstep(.3, .75, vn3(vP * .8 + 3.));
        float mossK = clamp(up * 1.05 + foot * .7, 0., 1.) * (.45 + .55 * smoothstep(.0, .5, h + vn3(vP * 9.) * .5));
        alb = mix(alb, uMoss * (.5 + .6 * vn3(vP * 4.)) * (.75 + .5 * vn3(vP * 23.)), mossK);
        float ao = (.12 + .88 * smoothstep(.0, .6, h)) * smoothstep(-1.5, 2.5, vP.y);
        vec3 c = oakLaw(alb, vP, N, V, mix(.4, 1., ao));
        c *= mix(vec3(.2, .28, .56), vec3(1.), smoothstep(.02, .5, h));           // the cracks hold blue shadow
        { float nB = nightN(vP), dB = length(uMoon - vP);   // close under the moon the plates must still read: hold the cracks dark, knee the flood
          c *= mix(1., (.2 + .8 * smoothstep(.05, .6, h)) / (1. + 2.6 * dot(c, vec3(.3, .5, .2))), nB * smoothstep(21., 8., dB)); }
        // the moss keeps its green by moonlight; the plates' tops take a dry, broad sheen from the moon (no wet glint)
        float n = nightN(vP); vec3 Lm = normalize(uMoon - vP); float dm = length(uMoon - vP);
        float fallm = max(.08, 1. / (1. + dm * dm / 620.));
        c += n * mossK * uMoss * vec3(.7, 1.25, .8) * uMoonCol * (.1 + .5 * fallm) * (.4 + .6 * max(dot(N, Lm), 0.));
        float sh = max(dot(N, normalize(Lm + V + vec3(0., 1e-3, 0.))), 0.); sh *= sh;
        c += uMoonCol * vec3(1.05, 1., .86) * sh * n * (.5 * fallm) * smoothstep(.45, .9, h) * (1. - mossK) * .22 * smoothstep(7., 18., dm);
        c += n * uStarAmb * (alb * 1.4 + .05) * smoothstep(.3, .95, vN.y / max(length(vN), 1e-4)) * smoothstep(14., 60., dist) * 1.1;   // limbs far off keep a starlit upper side: round wood, not black wire
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; return m;
}

// procedural leaf-spray card: round-lobed oak leaves on a twig (alpha = leaf, red = per-leaf tone)
function makeLeafTexture(rng) {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d'); g.clearRect(0, 0, S, S);
  const leaf = (x, y, ang, len, tone) => {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.beginPath(); g.moveTo(0, 0);
    const n = 26, pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, env = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.7) * (0.55 + 0.45 * t);
      pts.push([t * len, len * 0.3 * env * (0.62 + 0.38 * Math.abs(Math.sin(t * Math.PI * 4.5)))]);
    }
    for (const p of pts) g.lineTo(p[0], p[1]);
    for (let i = n; i >= 0; i--) g.lineTo(pts[i][0], -pts[i][1]);
    g.closePath();
    const v = Math.round(255 * tone); g.fillStyle = `rgb(${v},${v},${v})`; g.fill();
    g.strokeStyle = `rgba(${Math.round(v * 0.6)},${Math.round(v * 0.6)},${Math.round(v * 0.6)},0.9)`; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(len * 0.95, 0); g.stroke();
    g.restore();
  };
  for (let i = 0; i < 40; i++) {
    const a = rng.range(0, TAU), r = Math.sqrt(rng()) * S * 0.36, len = rng.range(40, 58);
    const x = S / 2 + Math.cos(a) * r, y = S / 2 + Math.sin(a) * r;
    leaf(x - Math.cos(a) * len * 0.3, y - Math.sin(a) * len * 0.3, a + rng.range(-0.9, 0.9), len, rng.range(0.45, 1));
  }
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.anisotropy = 4; tex.needsUpdate = true; return tex;
}

// ------------------------------------------------------------------------------------------------
// FOLIAGE: one merged mesh. Each leaf mass is a flattened, lobed core (uv.x < 0 = solid) clad in
// leaf-spray cards (uv 0..1, alpha-tested) that give it its cauliflower outline. aC = mass centre + seed.
async function makeFoliage(ctx, rng, shared, blobs, pal, detail) {
  const icos = [0, 1, 2].map((dt) => { const g0 = mergeVertices(new THREE.IcosahedronGeometry(1, dt).deleteAttribute('normal').deleteAttribute('uv')); return { p: g0.getAttribute('position'), i: g0.index.array }; });
  const pos = [], nor = [], uv = [], aC = [], idx = [];
  const d = new THREE.Vector3(), n = new THREE.Vector3(), t1 = new THREE.Vector3(), t2 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  // THE CAULIFLOWER. A mass is the union of a core ball and 6-11 billows (balls set round it, heaped toward the top).
  // lobeR gives the union's radius along a unit direction and the normal of the billow that is hit there, so even
  // a coarse mesh shades and outlines as heaped round lobes, never as one egg.
  const lobeR = (v, subs, nOut) => {
    let best = 0.66, bx = v.x, by = v.y, bz = v.z;
    for (const c of subs) {
      const dc = v.x * c[0] + v.y * c[1] + v.z * c[2], disc = c[3] * c[3] - (c[4] - dc * dc);
      if (disc <= 0 || dc <= 0) continue;
      const t = dc + Math.sqrt(disc);
      if (t > best) { best = t; bx = v.x * t - c[0]; by = v.y * t - c[1]; bz = v.z * t - c[2]; }
    }
    if (nOut) nOut.set(bx, by, bz).normalize();
    return best;
  };
  let vi = 0, nb = 0;
  for (const b of blobs) {
    if (nb++ % 10 === 9) await ctx.yield();
    // rich = the masses the flight passes under (inside the night, below ~40 m): finer cores, three times the sprays
    const rich = b.p.y < 40, big = b.s > 5.2;
    const ico = icos[rich ? (big ? 2 : 1) : (big ? 1 : 0)], s = b.s * 0.8;
    const subs = [], nS = rich ? (big ? 11 : 7) : 6;
    for (let k = 0; k < nS; k++) {
      d.set(rng.gauss(), rng.gauss() * 0.8 + 0.2, rng.gauss()).normalize();
      const off = rng.range(0.5, 0.74), rho = rng.range(0.4, 0.56);
      subs.push([d.x * off, d.y * off, d.z * off, rho, off * off]);
    }
    for (let i = 0; i < ico.p.count; i++) {
      d.fromBufferAttribute(ico.p, i); const r = s * lobeR(d, subs, n);
      pos.push(b.p.x + d.x * r, b.p.y + d.y * r * b.f, b.p.z + d.z * r);
      n.y /= b.f; n.normalize(); nor.push(n.x, n.y, n.z);
      uv.push(-1, 0.5 + 0.5 * d.y); aC.push(b.p.x, b.p.y, b.p.z, b.seed);
    }
    for (let i = 0; i < ico.i.length; i++) idx.push(vi + ico.i[i]);
    vi += ico.p.count;
    const cards = Math.round((rich ? 22 + b.s * b.s * 1.5 : 10 + b.s * b.s * 0.7) * detail);
    for (let k = 0; k < cards; k++) {
      // random direction, biased away from the underside (rich masses also hang sprays below: seen from the lawn)
      d.set(rng.gauss(), rng.gauss() * (rich ? 1 : 0.85) + (rich ? 0 : 0.12), rng.gauss()).normalize();
      const fin = rng.chance(rich ? 0.55 : 0.4);
      const half = rng.range(1.25, 1.95) * (0.8 + b.s * 0.045) * (rich ? 1.12 : 1);
      // a fin stands out of the mass (its plane holds the radius), so it is seen whole on the outline; the rest lie on the surface
      const r = s * lobeR(d, subs, null) * rng.range(0.92, 1.06) + (fin ? half * 0.42 : 0.1);
      const cx = b.p.x + d.x * r, cy = b.p.y + d.y * r * b.f, cz = b.p.z + d.z * r;
      if (fin) {
        t1.set(rng.gauss(), rng.gauss(), rng.gauss()); n.crossVectors(d, t1);
        if (n.lengthSq() < 1e-4) n.set(d.z, 0, -d.x + 1e-3); n.normalize();
      } else n.set(d.x + rng.range(-0.5, 0.5), d.y / b.f + rng.range(-0.3, 0.6), d.z + rng.range(-0.5, 0.5)).normalize();
      t1.crossVectors(Math.abs(n.y) > 0.9 ? t2.set(1, 0, 0) : up, n).normalize(); t2.crossVectors(n, t1);
      const rot = rng.range(0, TAU), c = Math.cos(rot) * half, sn = Math.sin(rot) * half;
      const ax = t1.x * c + t2.x * sn, ay = t1.y * c + t2.y * sn, az = t1.z * c + t2.z * sn;
      const bx = -t1.x * sn + t2.x * c, by = -t1.y * sn + t2.y * c, bz = -t1.z * sn + t2.z * c;
      pos.push(cx - ax - bx, cy - ay - by, cz - az - bz, cx + ax - bx, cy + ay - by, cz + az - bz,
        cx + ax + bx, cy + ay + by, cz + az + bz, cx - ax + bx, cy - ay + by, cz - az + bz);
      // shading normal: the mass's own outward direction, so a spray is lit like the lobe it grows from
      if (fin) t1.set(d.x, d.y / b.f + 0.2, d.z).normalize(); else { t1.copy(n).lerp(d, 0.5); t1.y += 0.25; t1.normalize(); }
      const sd = b.seed + k * 0.013;
      for (let q = 0; q < 4; q++) { nor.push(t1.x, t1.y, t1.z); aC.push(b.p.x, b.p.y, b.p.z, sd); }
      uv.push(0, 0, 1, 0, 1, 1, 0, 1);
      idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3); vi += 4;
    }
  }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  await ctx.yield();
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aC', new THREE.Float32BufferAttribute(aC, 4));
  g.setIndex(idx);
  await ctx.yield();
  const mat = lawMaterial(shared, {
    side: THREE.DoubleSide,
    uniforms: { uMap: { value: makeLeafTexture(rng) }, uLeafA: { value: col(pal[6]).multiplyScalar(0.55) }, uLeafB: { value: col(pal[1]) }, uLeafC: { value: col(pal[1]).lerp(col(pal[0]), 0.38) } },
    vert: /* glsl */`
      uniform float uTime; attribute vec4 aC; varying vec2 vUv; varying vec4 vC;
      void main(){ vUv = uv; vC = aC; vN = normal;
        float sd = aC.w * 61.7, card = step(0., uv.x);
        vec3 p = position;
        // the whole mass stirs; sprays flutter on top of that
        vec3 sway = vec3(sin(uTime * .8 + sd), .45 * sin(uTime * 1.15 + sd * 1.7), cos(uTime * .66 + sd * 2.3));
        p += sway * (.16 + .1 * card) + normal * card * .1 * sin(uTime * 2.4 + sd * 9. + position.x * .9 + position.z * .7);
        vP = p;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    frag: /* glsl */`
      uniform sampler2D uMap; uniform vec3 uLeafA, uLeafB, uLeafC; varying vec2 vUv; varying vec4 vC;
      void main(){
        float tone = .6, core = step(vUv.x, -.5);
        vec3 N = normalize(vN), V = normalize(uCamL - vP);
        if (core < .5) { vec4 t = texture2D(uMap, vUv); if (t.a < .42) discard; tone = t.r; }
        else {
          // the core of a mass is leaves too: the same sprays laid over it by its dominant axis, cut away
          // toward the outline so no smooth edge is left, and dark between the sprays (depth inside the mass)
          vec3 rel0 = vP - vC.xyz, an = abs(N);
          vec2 tuv = an.y > max(an.x, an.z) ? rel0.xz : (an.x > an.z ? rel0.zy : rel0.xy);
          float lod = clamp(log2(max(length(uCamL - vP), 1.) / 14.), 0., 4.);
          vec4 t = textureLod(uMap, tuv * .23 + vC.w * 7.3, lod);
          vec4 t2 = textureLod(uMap, tuv.yx * .31 + vC.w * 3.1 + .37, lod);
          float a = max(t.a, t2.a * .9); tone = mix(.16, max(t.r * t.a, t2.r * t2.a * .8), smoothstep(.3, .6, a));
          if (a < .42 && abs(dot(N, V)) < .62) discard;
        }
        if (!gl_FrontFacing) N = -N;
        float hgt = clamp((vP.y - vC.y) / 5. + .5, 0., 1.);            // underside of a mass is darker
        float var = h11(vC.w * 7.3);
        vec3 alb = mix(uLeafA, mix(uLeafB, uLeafC, var * .6 + .25 * tone), tone * (.45 + .55 * hgt));
        alb *= 1. - .3 * core;
        float ao = .35 + .65 * smoothstep(.1, .85, hgt);
        float n = nightN(vP);
        // sprays are thin: light them from whichever side the light is on
        vec3 Nl = N; if (core < .5 && dot(Nl, mix(uSunDir, normalize(uMoon - vP), n)) < 0.) Nl = -Nl;
        vec3 c = oakLaw(alb, vP, Nl, V, ao);
        // leaves let a little noon through
        c += alb * uSunCol * .22 * (1. - n) * max(dot(-N, uSunDir), 0.) * (1. - core);
        // the low moon lights each mass from beneath: the side of a mass that faces it is ivory-green, and the
        // rest keeps a luminous blue floor, so tiers read as lobed shapes with lit edges, never as black cores
        vec3 toM = uMoon - vC.xyz; float dM = max(length(toM), 1e-3);
        vec3 rel = vP - vC.xyz;
        float face = dot(rel / max(length(rel), 1e-3), toM / dM);
        float mfall = 1. / (1. + dM * dM / 2600.);
        c += n * (alb * 2.6 + .015) * uMoonCol * vec3(1.05, 1., .85) * smoothstep(-.15, .9, face) * (.22 + .78 * mfall) * (.5 + .5 * tone);
        // each billow is rimmed by the moon where it turns away from the eye, and holds blue starlight in its hollows
        float rimL = 1. - abs(dot(N, V)); rimL *= rimL;
        c += n * uMoonCol * vec3(.9, 1.05, .9) * rimL * smoothstep(-.5, .5, dot(N, toM / dM)) * (.1 + .5 * mfall) * (.4 + .6 * tone);
        c += n * uStarAmb * (.07 + .11 * tone);
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}

// ------------------------------------------------------------------------------------------------
// THE NIGHT SKY FUNCTION (GLSL), shared by the star wall, the veil and the pond's reflection.
// dir: unit direction from the trunk foot, y >= 0. Stars live in a hashed grid over a hemi-octahedral map
// of the direction; each is a disc that never drops below ~1.5 pixels (it dims instead of shrinking).
export const NIGHT_SKY_GLSL = /* glsl */`
uniform vec3 uSkyLo;  // base night, zenith
uniform vec3 uSkyHi;  // luminous blue toward the hem
uniform vec3 uMilky;
uniform float uMeteorP;   // seconds between meteors
uniform float uStarPx;    // drawing buffer height / 450: star sizes are set in pixels of a 450-line picture
vec3 wheel(vec3 d){ float a = uTime * .02618; float c = cos(a), s = sin(a); return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z); }
// Stars are measured ON SCREEN: the offset from the fragment to its cell's star is taken through the screen
// derivatives of the sky direction (set by starPix), so every star is a round point of a set pixel size
// however obliquely the wall is seen and however the dome is squashed. Five magnitudes; the brightest of the
// coarse grid carry a four-point glint and a soft round glow. pix > 0 = no derivatives (the pond's mirror):
// the disc is then round in angle instead.
vec3 gSdx = vec3(0.), gSdy = vec3(0.);
vec3 starGrid(vec3 dir, float N, float sd, float pix){
  float l1 = abs(dir.x) + abs(dir.y) + abs(dir.z);
  vec2 e = dir.xz / max(l1, 1e-4); vec2 g = vec2(e.x + e.y, e.x - e.y) * N * .5;
  vec2 id = floor(g);
  float h = h21(id + sd), h2 = h21(id * 1.7 + sd + 3.1), h3 = h21(id + 9.7 + sd);
  vec2 u = (id + .24 + .52 * vec2(h2, h3)) / (N * .5);
  vec2 es = vec2(u.x + u.y, u.x - u.y) * .5;
  vec3 sdir = normalize(vec3(es.x, max(1. - abs(es.x) - abs(es.y), 0.) + 1e-4, es.y));
  vec3 dl = dir - sdir;
  float mag = floor(h * h * h * 5.) / 4.;                  // five magnitudes, the faint ones the most
  mag = mag * mag * .85 + .15 * h * h;
  float tw = .72 + .28 * sin(uTime * (1.2 + 3.5 * h3) + h2 * 60.);
  vec3 tint = mix(vec3(.72, .82, 1.), vec3(1., .9, .74), smoothstep(.55, .95, h2));
  if (pix > 0.) {
    float ra = (.0035 + .006 * mag) * pix / .05;
    return tint * smoothstep(ra, ra * .3, length(dl)) * (.22 + 5.5 * mag) * tw;
  }
  float a = dot(gSdx, gSdx), b = dot(gSdx, gSdy), c = dot(gSdy, gSdy), det = a * c - b * b;
  float p = dot(gSdx, dl), q = dot(gSdy, dl);
  vec2 s = vec2(c * p - b * q, a * q - b * p) / max(det, 1e-14);
  float px = max(uStarPx, .5), big = step(N, 25.);
  float r = px * (.8 + (.75 + .75 * big) * mag), d = length(s);
  float disc = smoothstep(r, r * .3, d);
  float I = .3 + 5.2 * mag;
  vec2 sa = abs(s) / px;
  float gl = big * step(.5, mag) * ((exp(-sa.x * .3) * exp(-sa.y * sa.y * 1.6) + exp(-sa.y * .3) * exp(-sa.x * sa.x * 1.6)) * .9 + exp(-d * d / (px * px * 22.)) * .3);
  return tint * (disc * I + gl) * tw * step(1e-14, det);
}
float starPix(vec3 dir, float N){ gSdx = dFdx(dir); gSdy = dFdy(dir); return 0.; }
vec3 milkyWay(vec3 d){
  vec3 m = normalize(vec3(.83, .24, .5));
  float x = dot(d, m), band = exp(-x * x * 9.), core = exp(-x * x * 70.);
  float n1 = vn3(d * 4.5 + 2.), n2 = vn3(d * 11. + 9.), n3 = vn3(d * 27. + 4.);
  float cloud = band * (.22 + 1.25 * n1 * n1) * (.5 + .5 * n2) + core * (.3 + .7 * n2) * .55;
  float lane = smoothstep(.13, .0, abs(x + (n1 - .5) * .26)) * smoothstep(.3, .65, vn3(d * 7. + 4.));
  vec3 c = uMilky * cloud * (.78 + .44 * n3) + vec3(1., .82, .62) * uMilky.g * core * n1 * .3;
  return c * (1. - .6 * lane);
}
vec3 meteor(vec3 dir){
  float T = uTime / max(uMeteorP, .5), k = floor(T), ph = fract(T) * max(uMeteorP, .5);
  float life = clamp(ph / .9, 0., 1.);
  vec3 a = normalize(vec3(h11(k) * 2. - 1., .35 + .55 * h11(k + .3), h11(k + .7) * 2. - 1.));
  vec3 v = normalize(vec3(h11(k + 1.3) - .5, -.35 - .3 * h11(k + 2.1), h11(k + 3.7) - .5));
  vec3 head = a + v * life * .5, pa = dir - head;
  float t = clamp(dot(pa, -v), 0., .22);
  float dd = length(pa + v * t);
  float w = .0035 + .0005 * 0.;
  return vec3(.85, .92, 1.) * 3.2 * exp(-dd * dd / (w * w)) * (1. - t / .22) * sin(life * 3.1416) * step(ph, .9);
}
// full sky colour for a direction (before the dusk hem)
vec3 nightSky(vec3 dir, float pixA, float pixB){
  vec3 w = wheel(dir);
  vec3 c = mix(uSkyHi, uSkyLo, smoothstep(.0, .75, dir.y));
  c += milkyWay(w);
  c += starGrid(w, 46., 0., pixA) + starGrid(w, 19., 17., pixB) * 1.6;
  c += meteor(dir);
  return c;
}
`;

function makeDome(shared, pal) {
  const geo = new THREE.SphereGeometry(1, 96, 28, 0, TAU, 0, Math.PI * 0.53);
  const skyU = { uSkyLo: { value: col(pal[3]).multiplyScalar(1.15) }, uSkyHi: { value: col('#1A2A6E').multiplyScalar(1.0) }, uMilky: { value: col('#AEB8F0').multiplyScalar(0.8) }, uMeteorP: { value: 6.3 }, uStarPx: { value: 1 } };
  const vert = /* glsl */`
    varying vec3 vU;
    void main(){ vU = normalize(position);
      float a = safeAng(vU.zx), rad = uDome.x * domeScale(a) + domeBreath(a);
      vec3 p = vec3(vU.x * rad, vU.y * rad * uDome.y / uDome.x, vU.z * rad);
      vP = p; vN = vU;
      vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`;
  const archGL = /* glsl */`
    // height of the lifted hem (the exit arch) above the grass at this point of the wall
    float archTop(vec3 p){
      float a = safeAng(p.zx) - uExit.x; a = atan(sin(a), cos(a));
      float s = a * uDome.x / uExit.y;
      return uExit.z * sqrt(max(1. - s * s, 0.));
    }`;
  const wall = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, ...skyU }, fog: true, side: THREE.BackSide,
    vertexShader: VERT_COMMON + NIGHT_LAW_GLSL + vert,
    fragmentShader: FRAG_COMMON + NIGHT_SKY_GLSL + archGL + /* glsl */`
      uniform float uCamN; varying vec3 vU;
      void main(){
        vec3 dir = normalize(vP * vec3(1., uDome.x / uDome.y, 1.));
        dir.y = abs(dir.y);
        float top = archTop(vP);
        float shim = (vn2(vec2(safeAng(vP.zx) * 60., uTime * .6)) - .5) * .9;
        float hy = vP.y - top + shim;
        if (hy < 0. && top > .05) discard;
        vec3 c = nightSky(dir, starPix(wheel(dir), 46.), starPix(wheel(dir), 19.));
        // from far across the meadow the thousands of stars would run together into pale glitter: there the wall is
        // deep blue with a few dozen separate stars, so the Oak stands as a piece of night on the bright field
        float farK = smoothstep(150., 460., length(vP - uCamL)) * (1. - uCamN);
        vec3 cFar = mix(uSkyHi * .6, uSkyLo, smoothstep(.0, .5, dir.y)) * .8 + starGrid(wheel(dir), 7., 41., 0.) * 1.3;
        c = mix(c, cFar, farK);
        // round the arch of day the sky is kept deep (no Milky Way behind the ring: it would wash to milk in its glow)
        float ea = safeAng(vP.zx) - uExit.x; ea = atan(sin(ea), cos(ea));
        float deep = (1. - smoothstep(.4, 1.05, abs(ea))) * (1. - smoothstep(20., 46., vP.y));
        vec3 cDeep = mix(uSkyHi * .5, uSkyLo * .8, smoothstep(.0, .5, dir.y)) + starGrid(wheel(dir), 19., 17., starPix(wheel(dir), 19.)) * 1.3 + starGrid(wheel(dir), 46., 0., starPix(wheel(dir), 46.)) * .8;
        c = mix(c, cDeep, deep * .9 * (1. - farK));
        // the horizon of dusk: orange at the grass, rose, violet, then night
        float t = hemT(max(hy, 0.));
        vec3 dusk = mix(mix(uRampA, uRampB, smoothstep(.0, .38, t)), uRampC, smoothstep(.3, .72, t));
        float dk = (1. - smoothstep(.45, 1., t));
        c = mix(c, dusk * (1.15 - .55 * t), dk);
        c += uRampA * 1.6 * smoothstep(1.4, 0., hy) * step(.05, top);    // the arch is edged with fire
        vec3 pre = c; gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
        gl_FragColor.rgb = mix(gl_FragColor.rgb, pre, max(uCamN, .55 + .3 * farK));     // night keeps its depth through the noon haze
      }`,
  });
  return { geo, wall, vert, archGL, skyU };
}

const FOG_FACTOR_GLSL = /* glsl */`
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

// front faces of the dome: the blue veil (alpha from the analytic chord through the night) + near stars
function makeVeil(shared, dome, pal) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, ...dome.skyU, uVeil: { value: col(pal[3]).lerp(col('#1A2A6E'), 0.45).multiplyScalar(1.5) }, uCamD: { value: 100 } },
    fog: true, side: THREE.FrontSide, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: VERT_COMMON + NIGHT_LAW_GLSL + dome.vert,
    fragmentShader: FRAG_COMMON + NIGHT_SKY_GLSL + dome.archGL + FOG_FACTOR_GLSL + /* glsl */`
      uniform vec3 uVeil; uniform float uCamD; varying vec3 vU;
      void main(){
        float top = archTop(vP);
        if (vP.y < top && top > .05) discard;
        vec3 sc = vec3(1., uDome.x / uDome.y, 1.);
        vec3 o = uCamL * sc, dv = (vP - uCamL) * sc; float dl = max(length(dv), 1e-3); vec3 d = dv / dl;
        float R = length(vP * sc);
        float b = dot(o, d), cc = dot(o, o) - R * R, sq = sqrt(max(b * b - cc, 0.));
        float t0 = max(-b - sq, 0.), t1 = -b + sq;
        if (d.y < -1e-4) t1 = min(t1, -o.y / d.y);
        float chord = max(t1 - t0, 0.);
        float vis = smoothstep(0., 10., uCamD);
        float a = .62 * smoothstep(0., 1., chord / (1.5 * uDome.x)) * vis;
        vec3 dir = normalize(vP * sc); dir.y = abs(dir.y);
        vec3 w = wheel(dir);
        vec3 st = starGrid(w, 30., 31., starPix(w, 30.)) * 1.2 + starGrid(w, 15., 5., starPix(w, 15.)) * 1.5;
        float farK = smoothstep(150., 460., length(vP - uCamL));
        st = st * (1. - .97 * farK) + starGrid(w, 5., 23., 0.) * 1.4 * farK;
        a = mix(a, min(a * 1.35, .86), farK);
        st *= smoothstep(.12, .45, abs(dot(normalize(vU * vec3(1., uDome.x / uDome.y, 1.)), -d)));
        // the skirt of dusk seen from outside
        float t = hemT(max(vP.y, 0.) * 1.19);
        vec3 dusk = mix(mix(uRampA, uRampB, smoothstep(.0, .4, t)), uRampC, smoothstep(.3, .8, t)) * (1. - t) * (1. - t) * .42;
        vec3 c = uVeil * a + (st * smoothstep(.02, .25, chord / uDome.x) + dusk) * vis;
        c = mix(c, fogColor * a, fogAmt() * (.45 - .25 * farK));
        gl_FragColor = vec4(c, a);
      }`,
  });
}

// the lawn: fine short sward under the oak running out into buttercup meadow; the sunset band lies on it
function makeLawn(shared, pal, R, withDisc) {
  // the lawn disc, and the islet in the star pond where the nearest hinds sleep: a low mound, its rim under water
  const I = shared.uIsle.value, parts = [], ip = [], ii = [], RN = 7, SN = 28;
  if (withDisc) { const g0 = new THREE.CircleGeometry(R, 96); g0.rotateX(-Math.PI / 2); g0.translate(0, 0.02, 0); parts.push(g0.deleteAttribute('normal').deleteAttribute('uv')); }
  ip.push(I.x, isleY(shared, I.x, I.y), I.y);
  for (let r = 1; r <= RN; r++) for (let k = 0; k < SN; k++) {
    const a = (k / SN) * TAU, u = (r / RN) * Math.cos(a) * I.z, v = (r / RN) * Math.sin(a) * I.w;
    const x = I.x + EXIT_BACK.x * u + EXIT_BACK.z * v, z = I.y + EXIT_BACK.z * u - EXIT_BACK.x * v;
    ip.push(x, isleY(shared, x, z), z);
    const a0 = 1 + (r - 1) * SN + k, a1 = 1 + (r - 1) * SN + ((k + 1) % SN);
    if (r === 1) ii.push(0, a1, a0); else ii.push(a0 - SN, a1, a0, a0 - SN, a1 - SN, a1);
  }
  const gi = new THREE.BufferGeometry(); gi.setAttribute('position', new THREE.Float32BufferAttribute(ip, 3)); gi.setIndex(ii); parts.push(gi);
  const g = parts.length > 1 ? mergeGeometries(parts) : gi;
  const mat = lawMaterial(shared, {
    side: THREE.DoubleSide,
    uniforms: { uGrassA: { value: col(pal[6]).lerp(col(pal[1]), 0.35) }, uGrassB: { value: col(pal[1]) }, uFlower: { value: col(pal[0]).multiplyScalar(0.92) }, uPale: { value: col(pal[4]) }, uEdge: { value: R } },
    vert: /* glsl */`
      void main(){ vP = position; vN = vec3(0., 1., 0.);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    frag: /* glsl */`
      uniform vec3 uGrassA, uGrassB, uFlower, uPale; uniform float uEdge; uniform vec4 uPond, uIsle; uniform vec2 uIsleDir;
      void main(){
        float r = length(vP.xz);
        if (h21(floor(gl_FragCoord.xy)) < smoothstep(uEdge - 16., uEdge - 1., r)) discard;
        float n = nightN(vP);
        vec2 p = vP.xz;
        // gusts cross the meadow as visible waves
        float gust = vn2(p * .045 + vec2(uTime * .22, uTime * .09)) * .6 + vn2(p * .17 + vec2(uTime * .5, 0.)) * .4;
        float blades = vn2(p * vec2(9., 3.1) + gust * 1.5) * .4 + vn2(p * 23.) * .35 + vn2(p * 61.) * .25;
        float patchy = fbm2(p * .08 + 3.);
        vec3 alb = mix(uGrassA, uGrassB, .2 + .35 * patchy + .45 * blades);
        // seed heads and buttercup drifts outside; under the oak the sward is short and the flowers are pale
        float meadow = smoothstep(uDome.x - 22., uDome.x - 4., r + (patchy - .5) * 18.);
        float drift = smoothstep(.42, .62, fbm2(p * .06 + 9.));
        vec2 cell = floor(p * 3.2), cf = fract(p * 3.2) - .5;
        float fh = h21(cell), dot1 = smoothstep(.2, .09, length(cf + (vec2(h21(cell + 3.), h21(cell + 7.)) - .5) * .5));
        float butter = step(1. - (.1 + .5 * drift) * meadow, fh) * dot1;
        alb = mix(alb, uFlower, butter * (1. - .65 * n));
        // under the oak: white campion in loose drifts and scattered daisies, heads 17 cm so they read from the air
        float driftN = smoothstep(.36, .68, fbm2(p * .085 + 21.));
        vec2 cell2 = floor(p * 2.3), cf2 = fract(p * 2.3) - .5;
        float dC = length(cf2 + (vec2(h21(cell2 + 3.), h21(cell2 + 7.)) - .5) * .5);
        float petals = .78 + .22 * cos(safeAng(cf2.yx + 1e-3) * 5. + h21(cell2) * 6.);
        float head = smoothstep(.2, .12, dC / petals) * step(1. - (.02 + .3 * driftN), h21(cell2 + 21.)) * (1. - meadow);
        float pale = max(step(.9, h21(cell + 21.)) * dot1 * (1. - meadow * .6), head);
        // fine blades, and the dapple of boughs and leaf tiers across the moonlight
        float fine = vn2(p * vec2(34., 10.) + gust * 2.) * .6 + vn2(p * vec2(11., 37.) + 5.) * .4;
        float tips = smoothstep(.5, .85, fine * .65 + blades * .35);
        vec3 toM = uMoon - vP; float dmn = length(toM), mpool = smoothstep(27., 6., dmn);
        float inN = n * (1. - meadow);
        float dap = smoothstep(.3, .7, fbm2(p * .17 + vec2(sin(uTime * .31), cos(uTime * .23)) * .12 + 40.));
        alb = mix(alb, alb * vec3(.7, 1.3, 1.12) * (.58 + .42 * dap) * (.82 + .5 * tips), inN);
        alb = mix(alb, uPale * .82, pale);
        alb *= mix(.8 + .4 * blades, .72 + .36 * gust, meadow);
        alb = mix(alb, vec3(.62, .58, .3), meadow * .35 * vn2(p * .9 + 4.) * (1. - n));        // straw only in the sun
        alb = mix(alb, uFlower, meadow * (.25 + .5 * drift) * (1. - .7 * n) * (.6 + .4 * blades));
        // roots and pond bank
        float ao = smoothstep(3., 11., r) * .45 + .55;
        float dp = length(p - uPond.xy) - uPond.z;
        vec2 qi = p - uIsle.xy;
        float de = length(vec2(dot(qi, uIsleDir) / uIsle.z, (qi.x * uIsleDir.y - qi.y * uIsleDir.x) / uIsle.w)) + (vn2(p * 1.3) - .5) * .1;
        float onIsle = 1. - smoothstep(.55, .76, de);
        // the night sward is blue-green in every season (no straw, no grey)
        float lum = dot(alb, vec3(.3, .5, .2));
        alb = mix(alb, mix(alb, lum * vec3(.5, 1.12, .92) * 1.3, .72), inN * (1. - pale));
        alb = mix(alb, vec3(.05, .07, .09), smoothstep(1.6, -.2, dp + (vn2(p * 1.3) - .5) * 1.2) * .8 * (1. - onIsle));
        vec3 N = normalize(vec3((blades - .5) * .5, 1., (gust - .5) * .5));
        vec3 V = normalize(uCamL - vP);
        vec3 c = oakLaw(alb, vP, N, V, ao);
        // blade tips rimmed ivory-blue toward the moon, strongest in its pool on the lawn
        c += inN * uMoonCol * vec3(.8, .93, 1.12) * tips * (.035 + .1 * mpool + .06 / (1. + dmn * dmn / 900.)) * (.5 + .5 * dap);
        c += uPale * pale * n * .2 * (.6 + .4 * sin(uTime * 1.7 + fh * 40.));   // campion and daisies glimmer
        // THE ARCH OF DAY spills a fan of gold over the first 20-30 m of sward, bright at the mouth, blades lit from behind
        vec3 Le; float fan = exitFan(vP, Le);
        float depth = max(uDome.x - dot(p, vec2(sin(uExit.x), cos(uExit.x))), 0.);
        float spill = fan * .55 * n;
        c = mix(c, c * vec3(.72, 1.06, 1.0), inN * (1. - clamp(spill, 0., 1.)));       // moonlit grass stays cool
        vec3 sunGrass = mix(mix(uGrassA, uGrassB, .35 + .4 * blades) * vec3(1., 1.05, .7), vec3(.5, .4, .15), .45);
        c = mix(c, c * .45, clamp(spill, 0., 1.));
        c += uSunCol * vec3(1.12, .7, .25) * clamp(spill, 0., 1.6) * (sunGrass * 1.25 + tips * .22 + pale * .25);
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}
// height of the islet's mound at a ground-plan point (0.5 m at its middle, under the water at its rim)
function isleY(shared, x, z) {
  const I = shared.uIsle.value, qx = x - I.x, qz = z - I.y;
  const u = (qx * EXIT_BACK.x + qz * EXIT_BACK.z) / I.z, v = (qx * EXIT_BACK.z - qz * EXIT_BACK.x) / I.w;
  return -0.3 + 0.82 * Math.pow(Math.max(0, 1 - u * u - v * v), 0.8);
}

// CPU copy of the law's nightD (for the camera's own n, the veil fade and the world coder)
function nightDcpu(p, time, dome) {
  const a = Math.atan2(p.x, Math.abs(p.z) < 1e-4 ? 1e-4 : p.z);
  const lob = Math.sin(a * 3 + 0.7) * 0.5 + Math.sin(a * 5 + 2.1) * 0.3 + Math.sin(a * 8 + 4) * 0.2;
  const br = dome.w * (Math.sin(a * 2 + time * 0.79) * 0.55 + Math.sin(a * 5 - time * 0.52 + 1.3) * 0.45);
  return Math.hypot(p.x, (p.y * dome.x) / dome.y, p.z) - dome.x * (1 + 0.06 * lob) - br;
}

// ================================================================================================
export async function buildHero(ctx, opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).slice();
  const detail = THREE.MathUtils.clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const rng = ctx.rng.fork ? ctx.rng.fork('night-oak') : ctx.rng;
  const root = new THREE.Group(); root.name = 'night-oak';
  const shared = makeShared(pal);
  const info = {};

  // --- the oak
  const sink = makeTubeSink();
  const nodes = await buildSkeleton(ctx, rng, sink, info);
  await ctx.yield();
  const blobs = await buildCrown(ctx, rng, sink, nodes, info);
  shared.uMoon.value.copy(info.moon);
  await ctx.yield();
  const barkGeo = sink.geometry();
  await ctx.yield();
  root.add(makeBark(shared, barkGeo, pal));
  await ctx.yield();
  const foliage = await makeFoliage(ctx, rng, shared, blobs, pal, detail); root.add(foliage);
  await ctx.yield();

  // --- ground, dome
  const pondC = polar((-62 * Math.PI) / 180, 30), pondR = 15;      // on the exit line, its near shore 15 m from the trunk
  shared.uPond.value.set(pondC.x, pondC.z, pondR, 0);
  // the islet: 5.5 m further along the exit line than the pond's middle and 7.8 m to port of it
  shared.uIsle.value.set(pondC.x - EXIT_BACK.x * 5.5 - EXIT_BACK.z * 7.8, pondC.z - EXIT_BACK.z * 5.5 + EXIT_BACK.x * 7.8, 9.5, 4.6);
  root.add(makeLawn(shared, pal, 118, opts.ground !== false));
  await ctx.yield();
  const dome = makeDome(shared, pal);
  const wall = new THREE.Mesh(dome.geo, dome.wall); wall.frustumCulled = false; wall.renderOrder = -0.5; root.add(wall);
  const veilMat = makeVeil(shared, dome, pal);
  const veil = new THREE.Mesh(dome.geo, veilMat); veil.frustumCulled = false; veil.renderOrder = 20; root.add(veil);
  await ctx.yield();

  info.moonTilt = rng.range(-0.5, 0.35);
  const extra = await buildExtras(ctx, rng, root, shared, info, pal, detail, { pondC, pondR, dome });

  const camL = new THREE.Vector3();
  let progress = 0;
  const hero = {
    object: root, radius: 78, height: 70, center: new THREE.Vector3(0, 24, 0),
    ground: true, groundY: 0,
    uniforms: shared, lawGLSL: NIGHT_LAW_GLSL, skyGLSL: NIGHT_SKY_GLSL,
    anchors: {},
    nightD(worldPos, time = shared.uTime.value) { return nightDcpu(root.worldToLocal(camL.copy(worldPos)), time, shared.uDome.value); },
    setProgress(u) { progress = THREE.MathUtils.clamp(u, 0, 1); },
    // 'crescent' (default), 'full' (brighter, wedged in the fork) or 'none' (a new moon lit by earthshine: a denser Milky Way, a meteor every 2 s)
    setMoon(kind) {
      shared.uPhase.value = kind === 'full' ? 1 : kind === 'none' ? -1 : 0;   // 'none' = new moon: earthshine and a hair of rim
      dome.skyU.uMilky.value.copy(col('#AEB8F0')).multiplyScalar(kind === 'none' ? 1.25 : kind === 'full' ? 0.5 : 0.8);
      dome.skyU.uMeteorP.value = kind === 'none' ? 2.1 : 6.3;
    },
    setSun(dirWorld) { shared.uSunDir.value.copy(dirWorld).transformDirection(root.matrixWorld.clone().invert()).normalize(); },
    update(dt, time, camera) {
      shared.uTime.value = time;
      root.updateWorldMatrix(true, false);
      camera.getWorldPosition(camL); root.worldToLocal(camL);
      shared.uCamL.value.copy(camL);
      const d = nightDcpu(camL, time, shared.uDome.value);
      shared.uCamN.value = 1 - THREE.MathUtils.smoothstep(d, -BAND_W, BAND_W);
      veilMat.uniforms.uCamD.value = d;
      const near = 1 - THREE.MathUtils.smoothstep(camL.distanceTo(info.stag.piv), 14, 30);
      const want = Math.max(progress, near), pv = shared.uProgress;
      pv.value += (want - pv.value) * Math.min(1, dt * 1.6);
      extra.update(dt, time, camera, camL);
    },
    dispose() { foliage.material.uniforms.uMap.value.dispose(); },
  };
  Object.assign(hero.anchors, extra.anchors);
  return hero;
}

// ------------------------------------------------------------------------------------------------
// THE MOON: a real sphere lodged in the fork. Crater relief from hashed cells, the crescent emissive,
// earthshine on the dark part. Its light direction follows the viewer so it is a crescent from every side.
function makeMoon(shared, info, pal) {
  const R = info.moonR, geo = new THREE.SphereGeometry(R, 48, 32); geo.translate(info.moon.x, info.moon.y, info.moon.z);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, uIvory: { value: col(pal[4]).lerp(col('#fff2cf'), 0.45) }, uEarth: { value: col('#2A3566') }, uTilt: { value: info.moonTilt } },
    fog: true,
    vertexShader: VERT_COMMON + /* glsl */`
      uniform vec3 uMoon;
      void main(){ vP = position; vN = normalize(position - uMoon);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FRAG_COMMON + /* glsl */`
      uniform vec3 uIvory, uEarth; uniform float uTilt, uPhase;
      float crater(vec3 q, float k){
        vec3 g = q * k, id = floor(g), f = fract(g) - .5;
        float h = h31(id), r = .16 + .2 * h31(id + 5.);
        float d = length(f - (vec3(h31(id + 1.), h31(id + 2.), h31(id + 3.)) - .5) * .3);
        float bowl = smoothstep(r, r * .35, d), rim = smoothstep(r * 1.5, r, d) * smoothstep(r * .6, r, d);
        return (rim * .35 - bowl) * step(.45, h);
      }
      float relief(vec3 q){ return crater(q, 1.1) * .5 + crater(q + 7.3, 2.3) * .3 + crater(q + 3.1, 5.2) * .16 + (vn3(q * 3.) - .5) * .12; }
      void main(){
        vec3 q = (vP - uMoon) * 1.25, N = normalize(vN);
        float h = relief(q), e = .05;
        vec3 g = vec3(relief(q + vec3(e, 0., 0.)) - h, relief(q + vec3(0., e, 0.)) - h, relief(q + vec3(0., 0., e)) - h) / e;
        g -= N * dot(g, N); vec3 Nb = normalize(N - g * .16);
        // crescent light: from behind and to one side of the moon as seen by this viewer
        vec3 view = normalize(uMoon - uCamL);
        vec3 right = cross(view, vec3(0., 1., 0.)); right = right / max(length(right), 1e-3);
        vec3 upv = cross(right, view);
        float ph = max(uPhase, 0.), nw = step(uPhase, -.5);
        // the lit face is turned toward the viewer (a fat waxing moon; full on some visits; new = earthshine and a hair of rim)
        vec3 L = normalize(view * mix(mix(-.8, -1., ph), -.62, nw) + (right * cos(uTilt) + upv * sin(uTilt)) * mix(mix(.6, .3, ph), .78, nw));   // no-moon visits: a slim bright crescent holding the old moon in its arms
        // craters are shadowed bowls on the lit face only: the dark limb stays smooth earthshine, nothing glints there
        float geo = smoothstep(-.1, .16, dot(N, L));
        // soft relief: a bowl's far wall catches the light and its near wall falls into shadow; no hard ring outlines
        float nl = max(dot(N, L), 0.), rel = dot(Nb, L) - dot(N, L);
        // seen from far off the moon is a lamp; as the eye comes near it becomes a place: the lit face eases down below
        // the bloom threshold, the seas deepen and the bowls fill with shadow, so at ten metres it is ivory, never white
        float nearK = 1. - smoothstep(13., 52., length(uCamL - uMoon));
        float lit = geo * (.62 + .38 * nl) * clamp(1. + mix(1.5, 2.6, nearK) * rel, mix(.5, .3, nearK), 1.22);
        float maria = smoothstep(.36, .7, fbm2(q.xy * .7 + q.z * .4));
        vec3 alb = uIvory * (.86 - mix(mix(.34, .56, nearK), .48, ph) * maria + h * mix(.2, .34, nearK)) * mix(1., .5 + .5 * max(dot(N, -view), 0.), ph);   // a full moon gets limb darkening and deeper seas
        vec3 c = alb * vec3(1., .94, .82) * lit * mix(1.5, 1.35, ph) * mix(1., .68, nearK) * (1. + .3 * nw) + uEarth * (.6 + .35 * max(dot(N, -view), 0.)) * (1. - geo) * (1. - .25 * maria) * (1. + 1.2 * nw);
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  const moon = new THREE.Mesh(geo, mat); moon.frustumCulled = false; moon.name = 'moon';
  // soft glow sprite, 14 m across, always facing the viewer
  const gg = new THREE.PlaneGeometry(19, 19);
  const gm = new THREE.ShaderMaterial({
    uniforms: { uMoon: shared.uMoon, uCamL: shared.uCamL, uCol: { value: col(pal[4]) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`uniform vec3 uMoon, uCamL; varying vec2 vUv; varying float vK;
      void main(){ vUv = uv * 2. - 1.; vK = mix(1., .4, 1. - smoothstep(13., 52., length(uCamL - uMoon))); vec4 mv = modelViewMatrix * vec4(uMoon, 1.); mv.xy += position.xy; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`uniform vec3 uCol; varying vec2 vUv; varying float vK;
      void main(){ float d = length(vUv); float a = smoothstep(1., .0, d); a = a * a * a; gl_FragColor = vec4(uCol * vec3(.92, .96, 1.08) * a * .5 * vK, 1.); }`,
  });
  const glow = new THREE.Mesh(gg, gm); glow.frustumCulled = false; glow.renderOrder = 21; glow.name = 'moon';
  return [moon, glow];
}

// ------------------------------------------------------------------------------------------------
// SPRITES (one draw call): fireflies under the oak, motes held in the sunset ring, stars leaking downwind.
// type 0 firefly: position = home. type 1 mote: position.x = radial offset from d = 0, .y = base height,
// aS.w = compass angle. type 2 stray star: position = unit direction on the dome, aS.w unused.
function makeSprites(rng, shared, pal, detail) {
  const nFly = Math.round(500 * detail), nMote = Math.round(700 * detail), nStar = Math.round(90 * detail), nPool = Math.round(nFly * 0.5), n = nFly + nMote + nStar + nPool;
  const pools = [];
  const pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), aS = new Float32Array(n * 16), idx = new Uint16Array(n * 6);
  const put = (i, x, y, z, seed, type, size, w) => {
    for (let q = 0; q < 4; q++) {
      pos.set([x, y, z], i * 12 + q * 3); uv.set([q === 1 || q === 2 ? 1 : 0, q >= 2 ? 1 : 0], i * 8 + q * 2);
      aS.set([seed, type, size, w], i * 16 + q * 4);
    }
    idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  };
  let i = 0;
  for (let k = 0; k < nFly; k++) {
    const a = rng.range(0, TAU), r = 6 + Math.pow(rng(), 0.7) * 64, p = polar(a, r, 0.4 + Math.pow(rng(), 2.2) * 9);
    const sd = rng();
    put(i++, p.x, p.y, p.z, sd, 0, rng.range(0.1, 0.17), 0);
    if (p.y < 3.2 && pools.length < nPool) pools.push([p.x, p.y, p.z, sd]);
  }
  for (let k = 0; k < nMote; k++) put(i++, rng.range(-2, 2), rng.range(0.05, 1.2), 0, rng(), 1, rng.range(0.06, 0.13), rng.range(0, TAU));
  for (let k = 0; k < nStar; k++) {
    const a = rng.range(0, TAU), el = rng.range(0.08, 1.2);
    put(i++, Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el), rng(), 2, rng.range(0.16, 0.3), 0);
  }
  for (const q of pools) put(i++, q[0], q[1], q[2], q[3], 3, 1.5, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aS', new THREE.BufferAttribute(aS, 4)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.setDrawRange(0, i * 6);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, uFly: { value: col('#D8F07A') }, uPx: { value: 400 } },
    fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: VERT_COMMON + NIGHT_LAW_GLSL + /* glsl */`
      attribute vec4 aS; uniform vec3 uFly; uniform float uPx; uniform vec2 uWind; varying vec2 vUv; varying vec3 vCol;
      void main(){
        float sd = aS.x, type = aS.y; vec3 p = position, c; float flat1 = 0.;
        if (type < .5 || type > 2.5) {
          p += vec3(sin(uTime * .31 + sd * 40.) + .5 * sin(uTime * .83 + sd * 13.), .45 * sin(uTime * .47 + sd * 71.), cos(uTime * .27 + sd * 29.) + .5 * cos(uTime * .71 + sd * 53.)) * 1.7;
          p.y = max(p.y, .25);
          float ph = fract(uTime * (.14 + .1 * h11(sd)) + sd * 7.);
          c = uFly * 4.2 * smoothstep(0., .22, ph) * smoothstep(.8, .35, ph) * nightN(p);
          if (type > 2.5) {                       // its pool of light on the grass, fading as the firefly climbs
            c *= .034 * smoothstep(4.2, .4, p.y); flat1 = 1.;
            p.y = .17; p.xz += (uv - .5) * 2. * aS.z * (1. + .25 * position.y);
          }
        } else if (type < 1.5) {
          float a = aS.w + .02 * sin(uTime * .2 + sd * 30.), life = fract(uTime * .07 * (.6 + h11(sd)) + sd);
          float rad = uDome.x * domeScale(a) + domeBreath(a) + position.x + sin(uTime * .6 + sd * 50.) * .4;
          p = vec3(sin(a) * rad, position.y + life * 3.2, cos(a) * rad);
          c = duskRamp(nightN(p)) * 2.6 * sin(life * 3.1416);
        } else {
          float per = 5. + 4. * h11(sd), t = fract(uTime / per + sd) * per;
          float a = safeAng(position.zx), rad = uDome.x * domeScale(a) + domeBreath(a);
          vec3 s0 = vec3(position.x * rad, position.y * rad * uDome.y / uDome.x, position.z * rad);
          float out1 = max(dot(normalize(position.xz + 1e-4), uWind), 0.);
          p = s0 + vec3(uWind.x, -.06, uWind.y) * t * 2.9 + vec3(0., sin(t * 2. + sd * 9.) * .3, 0.);
          c = vec3(.8, .88, 1.) * 4. * smoothstep(3., .6, t) * smoothstep(0., .25, t) * step(.2, out1);
        }
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        float px = aS.z * uPx / max(-mvPosition.z, .1), k = mix(max(1., 1.7 / max(px, 1e-3)), 1., flat1);
        mvPosition.xy += (uv - .5) * 2. * aS.z * k * (1. - flat1);
        float farS = smoothstep(130., 420., -mvPosition.z);
        vCol = c / (k * k) * min(k, 3. - 2. * farS) * (1. - .8 * farS); vUv = uv * 2. - 1.;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      ` + FOG_FACTOR_GLSL + /* glsl */`
      varying vec2 vUv; varying vec3 vCol;
      void main(){ float a = smoothstep(1., 0., length(vUv)); gl_FragColor = vec4(vCol * a * a * (1. - fogAmt()), 1.); }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 22; return m;
}

// hawk moths looping the moon in a loose halo. Each is two hinged wing cards cut to a wing outline (a long
// forewing and a short hindwing, barred) and a furry body; position = (span, kind, along-body), uv = wing space.
function makeMoths(rng, shared, pal, count) {
  const pos = [], aM = [], uv = [], idx = [];
  for (let i = 0; i < count; i++) {
    const sd = rng(), rad = rng.range(3.8, 7.6), tilt = rng.range(-0.9, 0.9), sp = rng.range(0.3, 0.8) * (rng.chance(0.5) ? 1 : -1);
    const S = rng.range(0.2, 0.31);                       // half span: big as hawk moths are in a dream
    for (const sg of [-1, 1]) {
      const b = pos.length / 3;
      pos.push(0, 0, S * 0.62, sg * S, 0, S * 0.62, sg * S, 0, -S * 0.5, 0, 0, -S * 0.5);
      uv.push(0, 1, 1, 1, 1, 0, 0, 0);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    const b = pos.length / 3, bw = S * 0.13;
    pos.push(-bw, 1, S * 0.5, bw, 1, S * 0.5, bw, 1, -S * 0.62, -bw, 1, -S * 0.62);
    uv.push(0, 1, 1, 1, 1, 0, 0, 0);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    for (let q = 0; q < 12; q++) aM.push(sd, rad, tilt, sp);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aM', new THREE.Float32BufferAttribute(aM, 4));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: shared.uTime, uMoon: shared.uMoon, uCamL: shared.uCamL, uCol: { value: col(pal[4]).lerp(col('#f5e6c0'), 0.5) } },
    fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      uniform float uTime; uniform vec3 uMoon, uCamL; attribute vec4 aM; varying float vSh; varying vec2 vL; varying float vBody;
      vec3 orbit(float th, vec4 m){
        float r = m.y * (1. + .22 * sin(th * 3. + m.x * 20.));
        float cy = cos(m.x * 6.283), sy = sin(m.x * 6.283), ct = cos(m.z), st = sin(m.z);
        vec3 q = vec3(cos(th) * r, sin(th * 2. + m.x * 9.) * .8, sin(th) * r);
        q = vec3(q.x, q.y * ct - q.z * st, q.y * st + q.z * ct);
        return uMoon + vec3(q.x * cy - q.z * sy, q.y, q.x * sy + q.z * cy);
      }
      void main(){
        float th = uTime * aM.w + aM.x * 6.283;
        vec3 c = orbit(th, aM), f = orbit(th + .05 * sign(aM.w), aM) - c; f = f / max(length(f), 1e-4);
        // wings spread across the line of sight, so the eye always sees both of them
        vec3 toC = uCamL - c; toC = toC / max(length(toC), 1e-3);
        vec3 rt = cross(f, toC); rt = rt / max(length(rt), 1e-3); vec3 up = cross(rt, f);
        float fl = .25 + .8 * sin(uTime * 17. + aM.x * 50.);
        vBody = position.y;
        vec3 p = c + f * position.z + (rt * cos(fl) * sign(position.x) + up * sin(fl)) * abs(position.x) * (1. - vBody) + rt * position.x * vBody;
        vSh = .7 + .3 * cos(fl); vL = uv;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uCol; varying float vSh; varying vec2 vL; varying float vBody;
      float lobe(float a, float c, float w){ float t = clamp((a - c) / w, -1., 1.); return sqrt(max(cos(t * 1.5708), 0.)); }
      void main(){
        vec3 c;
        if (vBody > .5) {
          // the body: a tapered spindle, dark with pale bands
          vec2 q = vL * 2. - 1.;
          float wd = (1. - q.y * q.y) * (.75 + .25 * q.y);
          if (abs(q.x) > wd) discard;
          c = mix(vec3(.16, .12, .11), uCol * .6, step(.6, fract(vL.y * 7.)) * step(vL.y, .6));
        } else {
          // wing outline in polar form from the root: a long swept forewing, a short round hindwing
          vec2 q = vec2(max(vL.x, 1e-4), vL.y - .45);
          float a = atan(q.y, q.x), r = length(q);
          float fore = 1.02 * lobe(a, .36, .62), hind = .6 * lobe(a, -.62, .75);
          float edge = max(fore, hind);
          if (r > edge) discard;
          float bars = .5 + .5 * sin(r * 26. - a * 3.);
          c = mix(uCol * .5, uCol * 1.05, smoothstep(.2, .8, bars));          // ivory wings barred with grey
          c = mix(c, vec3(.78, .3, .38), step(fore, hind) * smoothstep(.1, .35, r) * .75);   // the rosy hindwing
          c = mix(c, uCol * .3, smoothstep(.82, 1., r / max(edge, 1e-3)));     // dark margin
        }
        gl_FragColor = vec4(c * vSh * 1.15, 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}

// ------------------------------------------------------------------------------------------------
// THE STAR POND: reflects the view ray, meets the oak's ellipsoid analytically and evaluates the same
// sky function there; the moon is ray-traced as a sphere with the same crescent rule; a glitter path;
// two scrolling ripple fields and three moth-touch rings. Plus three sheets of creeping mist.
function makePond(shared, dome, info, pal, C, R) {
  const g = new THREE.CircleGeometry(R * 1.14, 64); g.rotateX(-Math.PI / 2); g.translate(C.x, 0.07, C.z);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, ...dome.skyU, uWater: { value: col('#070c26') }, uIvory: { value: col(pal[4]).lerp(col('#fff2cf'), 0.45) }, uTilt: { value: info.moonTilt }, uMoonR: { value: info.moonR } },
    fog: true,
    vertexShader: VERT_COMMON + /* glsl */`
      void main(){ vP = position; vN = vec3(0., 1., 0.);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FRAG_COMMON + NIGHT_SKY_GLSL + /* glsl */`
      uniform vec4 uPond; uniform vec3 uWater, uIvory; uniform float uTilt, uMoonR, uPhase;
      float wav(vec2 p){ return vn2(p * .8 + uTime * vec2(.13, .07)) * .6 + vn2(p * 2.1 - uTime * vec2(.1, .17)) * .4; }
      vec2 touch(vec2 p, float i){
        float per = 5.5 + i * 1.7, T = uTime / per + i * .37, k = floor(T), tau = fract(T) * per;
        vec2 c = uPond.xy + (vec2(h11(k + i * 3.1), h11(k * 1.3 + i * 7.7)) - .5) * uPond.z * 1.1;
        vec2 dv = p - c; float d = max(length(dv), 1e-3), front = tau * 1.5;
        float w = cos((d - front) * 4.5) * smoothstep(front + .4, front - .3, d) * smoothstep(front - 3.5, front - .5, d) * smoothstep(per, per * .3, tau);
        return dv / d * w;
      }
      void main(){
        vec2 p = vP.xz, pc = p - uPond.xy; float r = length(pc), ang = safeAng(pc);
        float shore = uPond.z * (1. + .07 * sin(ang * 3. + 1.) + .045 * sin(ang * 7. + 2.) + .012 * sin(ang * 31.));
        if (r > shore) discard;
        float e = .2, h0 = wav(p);
        vec2 gr = vec2(wav(p + vec2(e, 0.)) - h0, wav(p + vec2(0., e)) - h0) / e * .022;
        gr += (touch(p, 0.) + touch(p, 1.) + touch(p, 2.)) * .05;
        vec2 fine = (vec2(vn2(p * 7. + uTime * .5), vn2(p * 7. + 13. - uTime * .4)) - .5) * .028;
        vec3 N = normalize(vec3(-gr.x, 1., -gr.y));
        vec3 V = normalize(uCamL - vP);
        // the sky is mirrored by a calmer surface than the moon's path, so each star stays a point and the water is not a field of streaks
        vec3 Ns = normalize(vec3(-gr.x * .3, 1., -gr.y * .3));
        vec3 Rf = reflect(-V, Ns); Rf.y = abs(Rf.y) + .002; Rf = normalize(Rf);
        vec3 sc = vec3(1., uDome.x / uDome.y, 1.);
        vec3 o = vP * sc, d = normalize(Rf * sc); float b = dot(o, d), cc = dot(o, o) - uDome.x * uDome.x;
        vec3 hit = o + d * (-b + sqrt(max(b * b - cc, 0.)));
        vec3 dir = normalize(hit); dir.y = abs(dir.y);
        vec3 c = nightSky(dir, .07, .06) * 1.2 + starGrid(wheel(dir), 46., 0., .05) * 1.1 + starGrid(wheel(dir), 19., 17., .04) * 1.5;
        float t = hemT(max(hit.y / sc.y, 0.));
        vec3 dusk = mix(mix(uRampA, uRampB, smoothstep(.0, .38, t)), uRampC, smoothstep(.3, .72, t));
        c = mix(c, dusk * (1.1 - .5 * t), 1. - smoothstep(.45, 1., t));
        // the moon, lodged in its fork, as a traced sphere
        float md = 0.; vec3 oc = vP - uMoon; float bm = dot(oc, Rf), hm = bm * bm - (dot(oc, oc) - uMoonR * uMoonR);
        if (hm > 0. && bm < 0.) {
          vec3 nm = normalize(oc + Rf * (-bm - sqrt(hm)));
          vec3 right = cross(Rf, vec3(0., 1., 0.)); right = right / max(length(right), 1e-3); vec3 upv = cross(right, Rf);
          float ph = max(uPhase, 0.), nw = step(uPhase, -.5);
          vec3 L = normalize(Rf * mix(mix(-.8, -1., ph), -.62, nw) + (right * cos(uTilt) + upv * sin(uTilt)) * mix(mix(.6, .3, ph), .78, nw));
          float lit = smoothstep(-.1, .16, dot(nm, L));
          float mar = smoothstep(.36, .7, fbm2(vec2(dot(nm, right), dot(nm, upv)) * 2.2 + 5.));
          c = uIvory * vec3(1., .94, .82) * lit * (.9 - .4 * mar) + vec3(.027, .036, .13) * (1. - lit); md = lit;   // ivory with its seas, never white
        }
        // the moon's broken path
        vec3 Lm = normalize(uMoon - vP);
        vec3 N2 = normalize(vec3(-gr.x - fine.x, 1., -gr.y - fine.y));
        float s = max(dot(reflect(-V, N2), Lm), 0.);
        float s8 = s * s; s8 *= s8; s8 *= s8; float s64 = s8 * s8; s64 *= s64; s64 *= s64; float s512 = s64 * s64; s512 *= s512; s512 *= s512;
        c += uIvory * vec3(1., .93, .8) * (s512 * 2.6 + s64 * .32 + s8 * .04) * (1. - .85 * md);
        float nv = 1. - max(dot(V, N), 0.), fres = .3 + .7 * nv * nv * nv;
        c = mix(uWater, c, fres);
        c = mix(c, vec3(.012, .016, .04), smoothstep(shore - 1.1, shore, r) * .7);   // shallow margin
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  const pond = new THREE.Mesh(g, mat); pond.frustumCulled = false;
  // mist 0.3 m deep creeping off the water toward the deer
  const sheets = [];
  for (let i = 0; i < 3; i++) { const m = new THREE.CircleGeometry(R + 10, 40); m.rotateX(-Math.PI / 2); m.translate(C.x, 0.2 + i * 0.16, C.z); sheets.push(m); }
  const mg = mergeGeometries(sheets);
  const mm = lawMaterial(shared, {
    transparent: true, depthWrite: false, uniforms: { uR: { value: R + 10 } },
    vert: /* glsl */`
      void main(){ vP = position; vN = vec3(0., 1., 0.);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    frag: /* glsl */`
      uniform vec4 uPond; uniform float uR;
      void main(){
        vec2 p = vP.xz; float r = length(p - uPond.xy);
        float m = fbm2(p * .16 + vec2(uTime * .05, -uTime * .03) + vP.y * 3.) * fbm2(p * .43 - vec2(uTime * .08, uTime * .02) + 5.);
        // wisps, thickest along the bank and thin over the open water, so the pond keeps its stars
        float a = smoothstep(.16, .46, m) * smoothstep(uR, uR * .55, r) * smoothstep(.6, 4., length(uCamL - vP)) * .36 * (.3 + .7 * smoothstep(uPond.z * .55, uPond.z * 1.05, r));
        float dm = length(uMoon - vP);
        vec3 c = uStarAmb * .9 + uMoonCol * (.18 + .36 / (1. + dm * dm / 600.));
        gl_FragColor = vec4(c * .55, a * nightN(vP));
        #include <fog_fragment>
      }`,
  });
  const mist = new THREE.Mesh(mg, mm); mist.frustumCulled = false; mist.renderOrder = 5;
  return [pond, mist];
}

// ------------------------------------------------------------------------------------------------
// FAUNA: red deer asleep (hinds, calves, one stag with twelve points) and an owl, all one mesh.
// Bodies are lofted elliptical rings. aAnim = (breath weight, ear/tail flick weight, stag head weight, phase).
export function makeBodySink() {
  const pos = [], nor = [], colr = [], anim = [], idx = [];
  const T = new THREE.Vector3(), S = new THREE.Vector3(), U = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1), v = new THREE.Vector3();
  // pts: [x,y,z][], ra: dorsal-ventral radii, rb: lateral radii. col(i, sin a) -> [r,g,b]; an(i) -> [breath, flick, head]
  function loft(pts, ra, rb, sides, col, an, phase, ref = Z) {
    const P0 = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), sub = pts.length >= 4 && sides >= 6 ? 2 : 1;
    let P = P0;
    if (sub > 1) {
      const cv = new THREE.CatmullRomCurve3(P0, false, 'centripetal'), m = (P0.length - 1) * sub, A = [], Bb = []; P = [];
      for (let i = 0; i <= m; i++) {
        const f = i / sub, k = Math.min(P0.length - 2, Math.floor(f)), t = f - k, sm = t * t * (3 - 2 * t);
        P.push(i % sub === 0 ? P0[i / sub] : cv.getPoint(i / m)); A.push(ra[k] + (ra[k + 1] - ra[k]) * sm); Bb.push(rb[k] + (rb[k + 1] - rb[k]) * sm);
      }
      ra = A; rb = Bb; const c0 = col, a0 = an; col = (i, c) => c0(Math.round(i / sub), c); if (a0) an = (i) => { const x = a0(Math.floor(i / sub)), y = a0(Math.ceil(i / sub)); return [(x[0] + y[0]) / 2, (x[1] + y[1]) / 2, (x[2] + y[2]) / 2]; };
    }
    const base = pos.length / 3, n = P.length;
    for (let i = 0; i < n; i++) {
      T.subVectors(P[Math.min(n - 1, i + 1)], P[Math.max(0, i - 1)]).normalize();
      S.crossVectors(ref, T); if (S.lengthSq() < 1e-6) S.set(0, 1, 0); S.normalize(); U.crossVectors(T, S);
      const c3 = col(i, 0), a3 = an ? an(i) : [0, 0, 0];
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * TAU, c = Math.cos(a), sn = Math.sin(a);
        v.copy(P[i]).addScaledVector(S, c * ra[i]).addScaledVector(U, sn * rb[i]); pos.push(v.x, v.y, v.z);
        v.set(0, 0, 0).addScaledVector(S, c / Math.max(ra[i], 1e-3)).addScaledVector(U, sn / Math.max(rb[i], 1e-3)).normalize(); nor.push(v.x, v.y, v.z);
        const cc = col(i, c); colr.push(cc[0], cc[1], cc[2]); anim.push(a3[0], a3[1], a3[2], phase);
      }
      if (i === 0 || i === n - 1) {          // rounded end cap vertex
        const sg = i === 0 ? -1 : 1; v.copy(P[i]).addScaledVector(T, sg * Math.min(ra[i], rb[i]) * 0.7);
        pos.push(v.x, v.y, v.z); nor.push(T.x * sg, T.y * sg, T.z * sg); colr.push(c3[0], c3[1], c3[2]); anim.push(a3[0], a3[1], a3[2], phase);
      }
    }
    const ring = (i) => base + i * sides + (i > 0 ? 1 : 0);
    for (let i = 0; i < n - 1; i++) for (let s = 0; s < sides; s++) {
      const a = ring(i) + s, b = ring(i) + ((s + 1) % sides), c = ring(i + 1) + s, d = ring(i + 1) + ((s + 1) % sides);
      idx.push(a, c, b, b, c, d);
    }
    const c0 = base + sides, c1 = ring(n - 1) + sides;
    for (let s = 0; s < sides; s++) { idx.push(c0, base + s, base + ((s + 1) % sides)); idx.push(c1, ring(n - 1) + ((s + 1) % sides), ring(n - 1) + s); }
  }
  // flat two-sided blade (ears, feathers): quad strip root -> tip
  function blade(root, tip, side, w, col, an, phase) {
    const b = pos.length / 3, r = new THREE.Vector3(...root), t = new THREE.Vector3(...tip), sd = new THREE.Vector3(...side).normalize();
    const mid = r.clone().lerp(t, 0.45), nn = new THREE.Vector3().subVectors(t, r).cross(sd).normalize();
    for (const p of [r.clone().addScaledVector(sd, -w * 0.5), r.clone().addScaledVector(sd, w * 0.5), mid.clone().addScaledVector(sd, -w), mid.clone().addScaledVector(sd, w), t]) {
      pos.push(p.x, p.y, p.z); nor.push(nn.x, nn.y, nn.z); colr.push(col[0], col[1], col[2]);
      const k = p === t ? 1 : p.distanceTo(r) / Math.max(t.distanceTo(r), 1e-3); anim.push(an[0] * k, an[1] * k, an[2], phase);
    }
    idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2, b + 2, b + 3, b + 4);
  }
  // move everything added since `from` by matrix m (deer placement)
  function place(from, m) {
    const nm = new THREE.Matrix3().getNormalMatrix(m);
    for (let i = from; i < pos.length / 3; i++) {
      v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).applyMatrix4(m); pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
      v.set(nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]).applyMatrix3(nm).normalize(); nor[i * 3] = v.x; nor[i * 3 + 1] = v.y; nor[i * 3 + 2] = v.z;
    }
  }
  function geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setAttribute('aAnim', new THREE.Float32BufferAttribute(anim, 4));
    g.setIndex(idx); return g;
  }
  return { loft, blade, place, geometry, count: () => pos.length / 3 };
}

// one lying deer in its own frame: x forward, y up, z to its left, belly on y = 0. pose 0 head up,
// 1 head curled back along the flank, 2 chin on the grass; 'stag' adds antlers and the liftable neck.
async function addDeer(B, rng, pose, kind, ctx) {
  const calf = kind === 'calf', stag = kind === 'stag', ph = rng() * 0.999 + (calf ? 2 : 0);
  const red = calf ? [0.4, 0.21, 0.1] : stag ? [0.3, 0.16, 0.085] : [0.37, 0.17, 0.075];
  const pale = [0.5, 0.4, 0.27], dark = [0.09, 0.06, 0.045], cream = [0.62, 0.55, 0.42];
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // coat: darker along the spine, paler below (c = cos of ring angle, +1 = dorsal)
  const coat = (k) => (i, c) => mixc(mixc(red, pale, THREE.MathUtils.clamp(0.25 - c * 0.75, 0, 1)), dark, k * 0.5 + (c > 0.8 ? 0.18 : 0));
  // torso: rump -> hips -> barrel -> chest -> shoulder, rolled a little onto one side
  const tor = [[-0.78, 0.27, 0], [-0.62, 0.3, 0], [-0.4, 0.32, 0.02], [-0.05, 0.31, 0.03], [0.3, 0.32, 0.02], [0.52, 0.35, 0], [0.68, 0.4, 0]];
  B.loft(tor, [0.13, 0.25, 0.3, 0.31, 0.3, 0.26, 0.17], [0.12, 0.25, 0.31, 0.34, 0.31, 0.25, 0.15], 10,
    (i, c) => (i <= 1 && c > -0.2 ? cream : coat(0)(i, c)), (i) => [i >= 2 && i <= 4 ? 1 : i === 1 || i === 5 ? 0.4 : 0, 0, 0], ph);
  B.loft([[-0.86, 0.36, 0], [-0.98, 0.26, 0.02], [-1.03, 0.14, 0.03]], [0.035, 0.03, 0.012], [0.04, 0.035, 0.012], 5, () => mixc(cream, dark, 0.35), () => [0, 0.6, 0], ph);
  // folded legs
  for (const s of [-1, 1]) {
    B.loft([[0.5, 0.2, s * 0.2], [0.72, 0.13, s * 0.22], [0.9, 0.075, s * 0.2], [0.72, 0.05, s * 0.27], [0.5, 0.045, s * 0.3], [0.4, 0.04, s * 0.31]],
      [0.09, 0.065, 0.05, 0.04, 0.034, 0.04], [0.08, 0.06, 0.05, 0.036, 0.03, 0.036], 6, (i, c) => (i === 5 ? dark : coat(0.15)(i, c)), null, ph);
    B.loft([[-0.62, 0.22, s * 0.2], [-0.42, 0.2, s * 0.29], [-0.16, 0.12, s * 0.33], [-0.02, 0.065, s * 0.35], [-0.22, 0.045, s * 0.41], [-0.46, 0.04, s * 0.43], [-0.56, 0.04, s * 0.43]],
      [0.17, 0.19, 0.11, 0.055, 0.04, 0.034, 0.04], [0.09, 0.11, 0.075, 0.05, 0.036, 0.03, 0.036], 6, (i, c) => (i === 6 ? dark : coat(0.1)(i, c)), (i) => [i < 2 ? 0.5 : 0, 0, 0], ph);
  }
  await ctx.yield();
  // neck and head by pose (stag: built raised-forward; the shader lowers and lifts it about the neck base)
  const nk = stag ? [[0.6, 0.42, 0], [0.84, 0.6, 0], [1.0, 0.86, 0], [1.06, 1.08, 0]]
    : pose === 0 ? [[0.6, 0.42, 0], [0.76, 0.62, 0], [0.84, 0.84, 0.02], [0.86, 1.0, 0.03]]
      : pose === 1 ? [[0.6, 0.42, 0], [0.74, 0.56, 0.12], [0.62, 0.62, 0.3], [0.38, 0.56, 0.38]]
        : [[0.6, 0.4, 0], [0.82, 0.36, 0.03], [1.02, 0.26, 0.06], [1.16, 0.17, 0.08]];
  const hw = (t) => (stag ? [0, 0, t] : [0, 0, 0]);
  B.loft(nk, stag ? [0.2, 0.17, 0.13, 0.115] : [0.17, 0.125, 0.095, 0.085], stag ? [0.16, 0.14, 0.11, 0.1] : [0.14, 0.1, 0.08, 0.075], 8, coat(stag ? 0.3 : 0.05), (i) => hw(i / 3), ph);
  const e = nk[3], p = nk[2], fx = pose === 1 && !stag ? [-0.9, -0.25, 0.2] : pose === 2 && !stag ? [0.95, -0.25, 0.1] : [0.93, -0.36, 0];
  const fl = Math.hypot(...fx), f = fx.map((q) => q / fl), H = (d, up = 0, sd = 0) => [e[0] + f[0] * d - f[1] * up * 0 + (up ? 0 : 0), e[1] + f[1] * d + up, e[2] + f[2] * d + sd];
  B.loft([H(-0.07, 0.02), H(0.03, 0.03), H(0.14, 0.01), H(0.25, -0.01), H(0.33, -0.015)], [0.085, 0.1, 0.075, 0.052, 0.042], [0.075, 0.088, 0.06, 0.042, 0.036], 8,
    (i, c) => (i >= 4 ? dark : i === 3 ? mixc(coat(0)(i, c), dark, 0.35) : coat(0.05)(i, c)), () => hw(1), ph);
  for (const s of [-1, 1]) B.blade(H(-0.03, 0.07, s * 0.06), H(-0.13, 0.2, s * 0.2), [f[0], f[1] + 0.25, f[2]], 0.062, mixc(red, dark, 0.3), [0, 1, stag ? 1 : 0], ph + s * 0.13);
  if (stag) await ctx.yield();
  if (stag) for (const s of [-1, 1]) {
    // antlers: a beam sweeping up, back and out, then forward; brow, bez, trez and a crown of three
    const bone = [0.5, 0.4, 0.27], tipc = [0.72, 0.68, 0.58], A = (x, y, z) => [e[0] + x, e[1] + y, e[2] + s * z];
    const beam = [A(0.0, 0.08, 0.06), A(-0.08, 0.26, 0.15), A(-0.2, 0.5, 0.3), A(-0.22, 0.74, 0.42), A(-0.1, 0.95, 0.46), A(0.04, 1.08, 0.4)];
    B.loft(beam, [0.03, 0.028, 0.026, 0.023, 0.02, 0.012], [0.03, 0.028, 0.026, 0.023, 0.02, 0.012], 5, (i) => mixc(bone, tipc, i / 5), () => hw(1), ph);
    const tine = (b, d, l) => B.loft([beam[b], [beam[b][0] + d[0] * l * 0.5, beam[b][1] + d[1] * l * 0.4, beam[b][2] + s * d[2] * l * 0.5], [beam[b][0] + d[0] * l, beam[b][1] + d[1] * l, beam[b][2] + s * d[2] * l]],
      [0.02, 0.016, 0.006], [0.02, 0.016, 0.006], 4, (i) => mixc(bone, tipc, i / 2), () => hw(1), ph);
    tine(0, [0.8, 0.5, 0.1], 0.34); tine(1, [0.75, 0.6, 0.15], 0.3); tine(2, [0.7, 0.65, 0.1], 0.36);
    tine(4, [-0.5, 0.8, 0.2], 0.3); tine(4, [0.2, 0.9, -0.3], 0.26);
  }
  return ph;
}

async function makeFauna(ctx, rng, shared, info, pal, C, R) {
  const B = makeBodySink(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), yAxis = new THREE.Vector3(0, 1, 0);
  // the exit line crosses the pond; the herd lies along the bank to port of it, the nearest hind 6 m from the line
  const lineIn = Math.atan2(EXIT_BACK.x, EXIT_BACK.z), out = lineIn - 1.17;
  const spots = [], placeDeer = async (kind, pose, at, yaw, sc) => {
    const from = B.count(); await addDeer(B, rng, pose, kind, ctx); await ctx.yield();
    // deer frame x-forward -> hero: rotate so +x points along compass `yaw`
    q.setFromAxisAngle(yAxis, yaw - Math.PI / 2);
    m4.compose(at, q, new THREE.Vector3(sc, sc, sc * (rng.chance(0.5) ? 1 : -1)));
    B.place(from, m4); spots.push({ kind, at: at.clone(), yaw, sc }); return m4.clone();
  };
  // THE HERD. Five hinds and a calf sleep on the islet in the star pond, 5 to 10 m to port of the line (the flight
  // passes them at 6 m); six more hinds and two calves lie along the far bank between the islet and the stag, so
  // from the near shore the herd is one receding line that ends at the stag under the moon.
  const fwd = lineIn + Math.PI, I = shared.uIsle.value;
  const isleAt = (u, v) => { const x = I.x + EXIT_BACK.x * u + EXIT_BACK.z * v, z = I.y + EXIT_BACK.z * u - EXIT_BACK.x * v; return new THREE.Vector3(x, isleY(shared, x, z) - 0.03, z); };
  // u: metres back along the line from the islet's middle (+ = toward the arriving eye), v: metres toward the line
  const isle = [[5.6, 1.5, 0], [3.3, -0.9, 2], [1.0, 1.3, 0], [-1.6, -0.7, 1], [-4.2, 0.9, 0]];
  for (let i = 0; i < isle.length; i++) {
    await ctx.yield();
    const [u, v, pose] = isle[i], at = isleAt(u + rng.range(-0.3, 0.3), v + rng.range(-0.25, 0.25));
    // they lie across the islet, flank to the eye, heads toward the moon
    const yaw = fwd + rng.range(-0.5, 0.5) + (i === 3 ? 2.6 : 0);
    await placeDeer('hind', pose, at, yaw, rng.range(1.26, 1.38));
    if (i === 1) await placeDeer('calf', 1, isleAt(u - 1.3, v + 1.5), yaw + 0.4, 0.74);
  }
  const nB = 6;
  for (let i = 0; i < nB; i++) {
    await ctx.yield();
    const a = fwd + 0.72 + (i / (nB - 1)) * 0.82 + rng.range(-0.04, 0.04), d = R + 3.6 + rng.range(0, 1) + (i % 2) * rng.range(2, 4.5);
    const at = C.clone().add(polar(a, d)), yaw = a + Math.PI / 2 + rng.range(-0.8, 0.8) + (rng.chance(0.3) ? Math.PI : 0);
    await placeDeer('hind', i % 3 === 1 ? 1 : 0, at, yaw, rng.range(1.2, 1.36));
    if (i === 1 || i === 4) await placeDeer('calf', rng.chance(0.6) ? 1 : 2, at.clone().add(polar(yaw + 1.3 + rng.range(-0.3, 0.3), 1.3)), yaw + rng.range(-0.5, 0.5), rng.range(0.66, 0.76));
  }
  // the stag lies a little apart at the downstream end of the herd, facing back across the water
  // (where the line leaves the water, 7 m to port of it and 10 m this side of the low moon, which lights him)
  const sa = lineIn - 2.74, sAt = C.clone().add(polar(sa, R + 4)), sYaw = sa + Math.PI * 0.72, sSc = 1.52;
  await ctx.yield();
  const sm = await placeDeer('stag', 0, sAt, sYaw, sSc);
  info.stag = { at: sAt, yaw: sYaw, head: new THREE.Vector3(1.06, 1.1, 0).applyMatrix4(sm), piv: new THREE.Vector3(0.6, 0.42, 0).applyMatrix4(sm), axis: new THREE.Vector3(0, 0, 1).transformDirection(sm) };
  info.herd = spots;
  await ctx.yield();
  // the owl on its bough: upright body, round head with a pale heart face, folded wings, tail
  {
    const from = B.count(), ph = rng(), w = [0.74, 0.7, 0.58], bf = [0.6, 0.47, 0.28], X = new THREE.Vector3(1, 0, 0);
    B.loft([[0, 0.02, 0], [0, 0.14, -0.01], [0, 0.3, -0.02], [0, 0.4, 0]], [0.07, 0.115, 0.11, 0.08], [0.07, 0.12, 0.115, 0.08], 8, (i, c) => (c > 0.1 ? w : bf), () => [1, 0, 0], ph, X);
    B.loft([[0, 0.38, 0.0], [0, 0.47, 0.02], [0, 0.55, 0.02], [0, 0.6, 0.0]], [0.085, 0.115, 0.105, 0.05], [0.09, 0.125, 0.115, 0.05], 8, (i, c) => (c > 0.25 ? [0.8, 0.78, 0.7] : bf), null, ph, X);
    for (const s of [-1, 1]) { B.blade([s * 0.1, 0.36, -0.03], [s * 0.07, -0.06, -0.1], [0, 0.2, 1], 0.1, bf, [0, 0.25, 0], ph); B.blade([s * 0.035, 0.5, 0.118], [s * 0.035, 0.47, 0.125], [1, 0, 0], 0.022, [0.03, 0.02, 0.02], [0, 0, 0], ph); }
    B.blade([0, 0.08, -0.08], [0, -0.14, -0.14], [1, 0, 0], 0.07, bf, [0, 0.2, 0], ph);
    q.setFromAxisAngle(yAxis, Math.atan2(info.perchDir.x, info.perchDir.z));
    B.place(from, m4.compose(info.perch, q, new THREE.Vector3(1.5, 1.5, 1.5)));
  }
  const mat = lawMaterial(shared, {
    side: THREE.DoubleSide,
    uniforms: { uStagPiv: { value: info.stag.piv }, uStagAxis: { value: info.stag.axis }, uStagYaw: { value: 0 } },
    vert: /* glsl */`
      uniform float uTime, uProgress, uStagYaw; uniform vec3 uStagPiv, uStagAxis;
      attribute vec4 aAnim; attribute vec3 color; varying vec3 vCol; varying float vSpot;
      vec3 rot(vec3 v, vec3 k, float a){ float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1. - c); }
      void main(){
        vec3 p = position, n = normal; float ph = fract(aAnim.w);
        p += n * aAnim.x * .05 * sin(uTime * 1.5708 + ph * 6.283);           // flanks rise and fall every 4 s
        float fk = smoothstep(.86, 1., sin(uTime * .7 + ph * 40.)) * sin(uTime * 17. + ph * 9.);
        p += n * aAnim.y * .075 * fk;                                           // an ear, a tail
        if (aAnim.z > 0.) {
          float lift = uProgress * uProgress * (3. - 2. * uProgress), w = aAnim.z;
          float a = -(1. - lift) * .95 * w + .03 * w * sin(uTime * .9) * lift;
          vec3 q = rot(p - uStagPiv, uStagAxis, a); n = rot(n, uStagAxis, a);
          float yw = uStagYaw * w * w * lift;
          q = rot(q, vec3(0., 1., 0.), yw); n = rot(n, vec3(0., 1., 0.), yw); p = q + uStagPiv;
        }
        vP = p; vN = n; vCol = color; vSpot = step(1.5, aAnim.w);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    frag: /* glsl */`
      varying vec3 vCol; varying float vSpot;
      void main(){
        vec3 N = normalize(vN), V = normalize(uCamL - vP);
        if (dot(N, V) < 0.) N = -N;
        vec3 alb = vCol * (.82 + .36 * vn3(vP * vec3(26., 60., 26.)));
        alb = mix(alb, vec3(.62, .56, .44), vSpot * smoothstep(.7, .78, vn3(vP * 13.)) * smoothstep(.0, .5, N.y));
        vec3 c = oakLaw(alb * 1.25, vP, N, V, smoothstep(-.05, .4, vP.y) * .45 + .55);
        // no deer is a black cut-out: the pale moonlit sward throws light up into the coat, and the moon draws an
        // ivory line along backs, ears, muzzles and antlers (strongest on what faces the sky or the moon)
        float n = nightN(vP); vec3 toM = uMoon - vP; float dm = length(toM); vec3 Lm = toM / max(dm, 1e-3);
        float mf = max(.4, 1. / (1. + dm * dm / 900.));
        c += n * alb * uMoonCol * (.62 - .3 * N.y) * (.55 + .45 * mf);
        float Lc = dot(c, vec3(.3, .5, .2)); c = mix(c, alb / max(dot(alb, vec3(.3, .5, .2)), .02) * Lc / (1. + 2.4 * Lc), n);
        float rim = 1. - max(dot(N, V), 0.); rim *= rim;
        c += n * uMoonCol * vec3(1.05, 1., .88) * rim * (.3 + .7 * max(N.y, 0.) + .6 * smoothstep(-.4, .5, dot(N, Lm))) * (.5 + .9 * mf) * .4;
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(B.geometry(), mat); mesh.frustumCulled = false;
  return { mesh, mat };
}

// ------------------------------------------------------------------------------------------------
// UNDERSTORY + SWING (one mesh): polypody ferns along the bough tops, hart's-tongue ferns in the buttress
// roots, the fairy ring of pale fungi, and the rope swing. aK = (kind, weight, phase):
// kind 0 pinnate frond, 1 strap frond, 2 solid (fungi), 3 swing (pendulum about uSwingP / uSwingA).
async function makeUnderstory(ctx, rng, shared, info, pal, detail) {
  const pos = [], nor = [], uv = [], colr = [], aK = [], idx = [];
  const v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), sd = new THREE.Vector3(), nn = new THREE.Vector3();
  const frond = (base, dir, L, w, arch, kind, c, ph) => {
    const b = pos.length / 3; sd.crossVectors(up, dir).normalize();
    for (let i = 0; i <= 3; i++) {
      const t = i / 3, rise = Math.sin(t * 2.3) * arch * L;
      v.copy(base).addScaledVector(dir, L * t * (1 - 0.15 * t)).addScaledVector(up, rise);
      nn.copy(up).addScaledVector(dir, -Math.cos(t * 2.3) * arch * 1.5).normalize();
      for (const s of [-1, 1]) {
        pos.push(v.x + sd.x * s * w, v.y + sd.y * s * w, v.z + sd.z * s * w); nor.push(nn.x, nn.y, nn.z);
        uv.push(t, s * 0.5 + 0.5); colr.push(c.r, c.g, c.b); aK.push(kind, t * t, ph);
      }
      if (i < 3) idx.push(b + i * 2, b + i * 2 + 1, b + i * 2 + 2, b + i * 2 + 1, b + i * 2 + 3, b + i * 2 + 2);
    }
  };
  const fernA = col(pal[1]).lerp(col(pal[6]), 0.3), fernB = col(pal[1]).lerp(col(pal[0]), 0.25);
  const clump = (at, n, L, w, kind, spread) => {
    const ph = rng();
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + rng.range(-0.4, 0.4);
      frond(at, polar(a, 1), L * rng.range(0.7, 1.15), w, spread * rng.range(0.7, 1.2), kind, fernA.clone().lerp(fernB, rng()), ph);
    }
  };
  for (const b of info.boughs) { await ctx.yield(); for (let i = 4; i < b.pts.length - 2; i++) {
    const p = b.pts[i], r = Math.hypot(p.x, p.z);
    if (r > 56 || !rng.chance(0.62 * detail)) continue;
    if (p.distanceTo(info.moon) < info.moonR + 2.4) continue;                 // none against the moon's limb
    clump(new THREE.Vector3(p.x + rng.range(-0.3, 0.3), p.y + b.rad[i] * 0.88, p.z + rng.range(-0.3, 0.3)), rng.int(4, 6), rng.range(0.55, 0.95), 0.13, 0.42, 0, 0);
  } }
  await ctx.yield();
  for (let k = 0; k < Math.round(46 * detail); k++) {
    const a = rng.range(0, TAU), r = rng.range(4.6, 8.2);
    clump(polar(a, r, 0.02 + Math.max(0, 6.2 - r) * 0.22), rng.int(5, 7), rng.range(0.45, 0.7), 0.075, 0.75, 1, 0);
  }
  await ctx.yield();
  // fairy ring, 6 m across, beside the last straight
  const ringC = new THREE.Vector3(-2.5 + rng.range(-0.5, 0.5), 0, -41 + rng.range(-2, 2)), pale = col(pal[4]).lerp(col('#e8dcc0'), 0.5);
  info.fairyRing = ringC;
  for (let k = 0; k < 30; k++) {
    const a = (k / 30) * TAU + rng.range(-0.08, 0.08), c = ringC.clone().add(polar(a, 3 + rng.range(-0.18, 0.18)));
    const h = rng.range(0.3, 0.52), cr = rng.range(0.2, 0.34), ph = rng(), prof = [[0.028, 0], [0.022, h * 0.8], [cr, h * 0.78], [cr * 0.86, h * 0.95], [cr * 0.45, h * 1.1], [0.001, h * 1.13]];
    const b = pos.length / 3, S = 7;
    for (let i = 0; i < prof.length; i++) for (let s = 0; s < S; s++) {
      const an = (s / S) * TAU; pos.push(c.x + Math.cos(an) * prof[i][0], prof[i][1], c.z + Math.sin(an) * prof[i][0]);
      nn.set(Math.cos(an), i >= 3 ? 1.2 : i === 2 ? -0.8 : 0, Math.sin(an)).normalize(); nor.push(nn.x, nn.y, nn.z);
      uv.push(0, 0); const t = i >= 2 ? 1 : 0.8; colr.push(pale.r * t, pale.g * t, pale.b * t); aK.push(2, 0, ph);
      if (i < prof.length - 1) { const a0 = b + i * S + s, a1 = b + i * S + ((s + 1) % S); idx.push(a0, a0 + S, a1, a1, a0 + S, a1 + S); }
    }
  }
  // the rope swing: two ropes and a plank seat, a rigid pendulum under the moon's bough
  const top = info.swingTop.clone(); top.y -= info.swingR * 0.9;
  const ax = info.swingAxis, seatY = 0.95, hemp = col('#8a744e'), wood = col('#6b5136');
  for (const s of [-1, 1]) {
    const b = pos.length / 3, x0 = top.clone().addScaledVector(ax, s * 0.45);
    for (let i = 0; i <= 6; i++) for (let q = 0; q < 4; q++) {
      const an = (q / 4) * TAU + i * 0.9, y = THREE.MathUtils.lerp(top.y, seatY, i / 6);
      nn.set(Math.cos(an), 0, Math.sin(an)); pos.push(x0.x + nn.x * 0.028, y, x0.z + nn.z * 0.028); nor.push(nn.x, 0, nn.z);
      uv.push(0, 0); colr.push(hemp.r, hemp.g, hemp.b); aK.push(3, 1, 0);
      if (i < 6) { const a0 = b + i * 4 + q, a1 = b + i * 4 + ((q + 1) % 4); idx.push(a0, a0 + 4, a1, a1, a0 + 4, a1 + 4); }
    }
  }
  {
    const box = new THREE.BoxGeometry(1.25, 0.06, 0.3, 3, 1, 1).toNonIndexed(), bp = box.getAttribute('position'), bn = box.getAttribute('normal');
    const side = new THREE.Vector3().crossVectors(up, ax), b = pos.length / 3;
    for (let i = 0; i < bp.count; i++) {
      const sag = -0.035 * (1 - Math.pow(bp.getX(i) / 0.625, 2));
      v.copy(top).setY(seatY + bp.getY(i) + sag).addScaledVector(ax, bp.getX(i)).addScaledVector(side, bp.getZ(i)); pos.push(v.x, v.y, v.z);
      nn.set(0, 0, 0).addScaledVector(ax, bn.getX(i)).addScaledVector(side, bn.getZ(i)).setY(bn.getY(i)); nor.push(nn.x, nn.y, nn.z);
      uv.push(0, 0); const t = bn.getY(i) > 0.5 ? 1.15 : 0.8; colr.push(wood.r * t, wood.g * t, wood.b * t); aK.push(3, 0, 0); idx.push(b + i);
    }
  }
  info.swingSeat = top.clone().setY(seatY);
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(aK, 3)); g.setIndex(idx);
  const mat = lawMaterial(shared, {
    side: THREE.DoubleSide, uniforms: { uSwingP: { value: top }, uSwingA: { value: ax } },
    vert: /* glsl */`
      uniform float uTime; uniform vec3 uCamL, uSwingP, uSwingA; uniform vec2 uWind;
      attribute vec3 color, aK; varying vec3 vCol; varying vec2 vUv; varying float vKind;
      vec3 rot(vec3 v, vec3 k, float a){ float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1. - c); }
      void main(){
        vec3 p = position, n = normal;
        if (aK.x < 1.5) {                      // fronds nod in the breeze
          float s = sin(uTime * 1.3 + aK.z * 40. + position.x * .7) * .6 + sin(uTime * 2.9 + aK.z * 17.) * .4;
          p += (vec3(uWind.x, 0., uWind.y) * .07 + vec3(0., .035, 0.)) * s * aK.y;
        } else if (aK.x > 2.5) {               // the swing sways; ropes never go thinner than ~1.5 px
          p += n * aK.y * max(0., length(uCamL - p) * .0011 - .028);
          float a = .2 * sin(uTime * 1.02) + .03 * sin(uTime * 2.3);
          p = rot(p - uSwingP, uSwingA, a) + uSwingP; n = rot(n, uSwingA, a);
        }
        vP = p; vN = n; vCol = color; vUv = uv; vKind = aK.x;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    frag: /* glsl */`
      varying vec3 vCol; varying vec2 vUv; varying float vKind;
      void main(){
        vec3 alb = vCol;
        if (vKind < 1.5) {
          float u = vUv.x, env = sqrt(max(sin(3.1416 * pow(clamp(u, 0., 1.), .7)), 0.));
          float teeth = vKind < .5 ? mix(.1, 1., smoothstep(.2, .7, abs(sin(u * 34.)))) : .86 + .14 * sin(u * 24.);
          float e = abs(vUv.y - .5) * 2.;
          if (e > env * teeth + .06) discard;
          alb *= .7 + .5 * (1. - e) ;
        }
        vec3 N = normalize(vN), V = normalize(uCamL - vP);
        if (dot(N, V) < 0. && vKind > 1.5) N = -N;
        vec3 c = oakLaw(alb, vP, N, V, 1.);
        if (vKind < 1.5) { float nf = nightN(vP); c += alb * uMoonCol * vec3(.7, 1.1, .8) * .55 * nf; c /= 1. + 1.6 * nf * dot(c, vec3(.3, .5, .2)); }
        if (vKind > 1.5 && vKind < 2.5) c += vCol * .5 * nightN(vP);       // the fungi glimmer
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}

// everything that lives under the oak, and the anchors
async function buildExtras(ctx, rng, root, shared, info, pal, detail, { pondC, pondR, dome }) {
  for (const m of makeMoon(shared, info, pal)) root.add(m);
  await ctx.yield();
  root.add(makeMoths(rng, shared, pal, Math.round(60 * detail)));
  await ctx.yield();
  for (const m of makePond(shared, dome, info, pal, pondC, pondR)) root.add(m);
  await ctx.yield();
  const fauna = await makeFauna(ctx, rng, shared, info, pal, pondC, pondR); root.add(fauna.mesh);
  await ctx.yield();
  root.add(await makeUnderstory(ctx, rng, shared, info, pal, detail));
  await ctx.yield();
  const sprites = makeSprites(rng, shared, pal, detail); root.add(sprites);
  await ctx.yield();

  const D = shared.uDome.value;
  const hemR = (a) => D.x * (1 + 0.06 * (Math.sin(a * 3 + 0.7) * 0.5 + Math.sin(a * 5 + 2.1) * 0.3 + Math.sin(a * 8 + 4) * 0.2));
  const deg = Math.PI / 180, P = (a, r, y) => polar(a * deg, r, y), V = (x, y, z) => new THREE.Vector3(x, y, z);
  const portal = V(0, 7, -(hemR(Math.PI) - BAND_W - 6));
  const onLine = (d, y) => portal.clone().addScaledVector(EXIT_BACK, d).setY(y);
  const runStart = onLine(100, 2.7), facing = EXIT_BACK.clone();
  const crossing = [38, 28, 18, 8].map((a) => P(a, hemR(a * deg), 4));
  const M = info.moon, sk = pondC;
  // one right-hand quarter turn off the ring (radius 24 m) onto the exit line, then dead straight for 100 m
  const tc = runStart.clone().add(V(EXIT_BACK.z, 0, -EXIT_BACK.x).multiplyScalar(24)), arc = (deg1, y) => tc.clone().add(P(deg1, 24, 0)).setY(y);
  const flyThrough = [
    P(52, hemR(52 * deg) + 16, 5), ...crossing,                                   // along the middle of the sunset ring, night to starboard
    V(-3, 4, 72.5), V(-14, 3.8, 66.5), arc(-30, 3.5), arc(-60, 3.2), arc(-88, 3.0),   // bank right under the boughs; the arch of day comes into view
    runStart, onLine(85, 2.6), onLine(70, 2.6),                                   // skim the star pond; hinds to port, the stag ahead under the moon
    onLine(55, 3.4), onLine(40, 4.6), onLine(22, 6), portal.clone(),              // the moon 9 m to port, the fairy ring, between the gateposts
  ];
  const anchors = {
    portalSeat: { position: portal, facing },                 // centre of the 14 m ring; facing = toward the arriving camera
    exitArch: { center: P(180, hemR(Math.PI), 0), halfWidth: 20, height: 11 },
    gateposts: info.gate,                                     // the two grounded elbows, 30 m apart
    runStart, crossing, flyThrough,
    approach: P(8, 520, 3),                                   // far viewpoint: the dome on the meadow, front side
    moon: { position: M.clone(), radius: info.moonR, passAt: onLine(54.5, 3.5), view: onLine(62, 3.2) },
    pond: { center: V(pondC.x, 0.07, pondC.z), radius: pondR },
    stag: { position: info.stag.at.clone(), head: info.stag.head.clone() },   // head = eye height once lifted (poi)
    herd: info.herd.map((h) => h.at.clone()),
    swingSeat: info.swingSeat, fairyRing: info.fairyRing, owl: info.perch,
    trunk: V(0, 0, 0), fork: info.fork.clone(),
    viewpoints: {
      split: { from: crossing[1].clone(), lookAt: crossing[3].clone() },
      moon: { from: onLine(62, 3.2), lookAt: M.clone() },
      pond: { from: onLine(92, 2.6), lookAt: info.stag.head.clone() },
      exit: { from: runStart.clone(), lookAt: portal.clone() },
    },
  };
  const sYaw = info.stag.yaw, tmp = new THREE.Vector3(), size = new THREE.Vector2();
  return {
    anchors,
    update(dt, time, camera, camL) {
      // the stag's head follows the viewer once lifted
      tmp.subVectors(camL, info.stag.piv);
      let rel = Math.atan2(tmp.x, tmp.z) - sYaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel));
      const u = fauna.mat.uniforms.uStagYaw; u.value += (THREE.MathUtils.clamp(rel, -1.25, 1.25) - u.value) * Math.min(1, dt * 2.5);
      ctx.renderer.getDrawingBufferSize(size); dome.skyU.uStarPx.value = Math.max(1, size.y / 450);
      sprites.material.uniforms.uPx.value = camera.projectionMatrix.elements[5] * size.y * 0.5;
    },
  };
}
