// THE STANDING SLEEPERS: open tropical ocean, fourteen sperm whales asleep upright under a silver ceiling.
//
// MAP OF THIS FILE (in order)
//   1. MOODS            the seeded looks (hour): golden / noon / dawn / moon. Sky preset, sun height, water and
//                       deep colours, fog density, hero light, ray colour, exposure and grade all live in that table.
//                       WEATHER (chop / glass / squall), CEILING cast (weed / log / bare) and ESCORT (whitetip /
//                       silkies / manta) are picked in build() under "SEEDED CAST".
//   2. GLSL + builders  makeWeed (sargassum sprigs + mats), makeLog, makeCeilingVeil (window glow, sun halo, rain
//                       rings, and THE SEA FROM THE DEEP: the lit underside with its caustic web and the sun's spokes),
//                       makeShafts (light shafts, three classes), makeBackdrop (the ink below), makePortalHalo,
//                       makeRiser (rare event foam + blow).
//   3. build(ctx)
//        PATH           hero.anchors.flyThrough: the brief's 21 points, bent to face the eye  -> "PATH"
//        HERO           buildHero at the origin (its local space is the brief's)             -> "HERO"
//        SEA            kit sky (never drawn, it only lights the water) + Water.makeSea       -> "SEA"
//        FOG            one FogExp2; colour is reset every frame from depth in update()       -> "FOG"
//        CEILING        veil, weed or log, jack wheel, runners                                -> "CEILING"
//        LIGHT SHAFTS   kit underwater rays + this world's own makeShafts (ring, entry, pass, deep and henge sets in
//                       one call), each class faded by camera depth in update()             -> "LIGHT SHAFTS"
//        DRIFT          kit plankton, fx flakes (tumble), salps (bubble shape), marine snow, blowhole thread -> "DRIFT"
//        ESCORT         shark / silkies / manta crossing the gaze at u 0.55 with pilot fish, lit for depth -> "ESCORT"
//        RARE           a sleeper across the ring rises, blows and sinks (ctx.vary.rare)      -> "RARE"
//        THE WHEEL      big jacks circling the portal inside the ring, rainbow runners beside us down the pass, the
//                       calf's attendants; all drawn from `rx`, a second generator, so the first release's seeded
//                       draws are untouched                                                 -> "THE WHEEL IN THE HENGE"
//        POIS, PORTAL, POST (exposure, bloom, grade)                                          -> "POIS", "POST"
//        update()       order matters: hero progress -> sea -> fog override -> followers
//
// SCRIPTED MOMENTS (all keyed to the path u passed to update)
//   hero.setProgress(u)        gate fluke flex (u 0.10), eye opening (0.355-0.405), her roll (0.37-0.46),
//                              calf crossing (0.405-0.458: it is nose-first on her belly, broadside to us, at u 0.46)
//   escort cross               kit `cross` route centred on u 0.55 (ESCORT_U), laid in the gaze from a stand-in path
//   pois                       her (eye -> flank -> the live calf and the place it settles, u 0.33-0.53) then henge
//                              (under the flukes -> ring centre, 0.465-0.86: the portal stays out of the calf frame at 0.46)
//   halo.uniforms.uKindle      the portal's gold halo kindles over u 0.46-0.6 (the gaze reaches the henge at 0.5, so
//                              revealDistance is 104 m and the engine starts to open the portal at u 0.42)
//   veil.uniforms.uWin/uSpread/uShade  THE HENGE VIEW: from depth > 12 m (and on the whole final climb) the veil is a
//                              lit window reaching down behind the far sleepers; hero.setLight({ deep }) turns the pod to
//                              slate with gold caps; the near shaft sets fall to nothing by 38 m. uHalo: sun halo, fades with depth
//   veil.uniforms.uSea/uRays   THE SEA FROM THE DEEP: from 12-28 m down the window is the sea's lit underside (silver-blue,
//                              gold toward the sun, a drifting caustic web, the sun's spokes); hero.setLight({ rake }) keeps
//                              a warm flank on the pod and shafts.uKHenge lights the henge's own shafts (both in by 38 m)
//   riser.uniforms.uFoam/uBlow rare event: rise u 0.18-0.25, blow 0.25-0.28, sink to 0.36; sleeper.pivotY is moved
//   scene.fog.color            water blue near the ceiling -> deep blue at 46 m (depth, not u); the moon's water is set
//                              outright (MOODS.moon.fogTop / fogDeep / inkLin) and copied into the kit's volume colour
//   by depth, not u            the view from below 13-28 m: sargassum sprigs shrink away and the mats turn to soft olive
//                              shadows (weed.uDeepA), the entry's jack wheel thins away and is hidden (the henge has its own), a second
//                              snow field fades in (deepSnow), broad soft beams show in the band under the henge (veil uLift)
//
// SHADOW SIDES: MOODS[..].slate is the scene-linear colour each mood's grade shows as its slate (#16324A in the golden hour);
//   hero.setLight({ shade }) makes it the floor of every shadow side of the pod (see ssLight in the part).
import * as THREE from 'three';
import { makePath, clamp, smoothstep, makeRng, hashSeed } from '../kit/core.js';
import * as Water from '../kit/water.js';
import { makeSky } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/standing-sleepers.js';

const PALETTE = ['#F4B860', '#DDE8EC', '#1E6FA8', '#0A3458', '#03121F', '#3B4046', '#E9E4D8'];
const DUR = 50, ESCORT_U = 0.55;
// ten equal slots each, indexed by one seeded draw: golden 40%, dawn / noon / moon 20% each; weed 60%, log 20%, bare 20%
const HOUR_SLOTS = ['golden', 'golden', 'golden', 'dawn', 'dawn', 'golden', 'noon', 'noon', 'moon', 'moon'];
const CEILING_SLOTS = ['weed', 'weed', 'weed', 'weed', 'weed', 'log', 'weed', 'log', 'bare', 'bare'];
const SUN_AZ = 250.1;            // degrees, kit convention: the sun stands west-south-west, toward (-0.94, 0, 0.34)

// ---------------------------------------------------------------- 1. MOODS (hour)
// elev: sun (or moon) height in degrees; under water it refracts to asin(cos(elev) / 1.333) from the zenith.
// water / deep: fog colour near the ceiling and at 46 m. key..fade: hero.setLight. gain: fog brightness.
// win / warm / winK / shade: the ceiling veil seen from the deep (pewter glow, its sunward tint, strength, how much of the blue it replaces).
// slate: the scene-linear colour that this mood's exposure, tint and grade show as its deepFill hex (#16324A in the golden
//   hour): hero.setLight({ shade }) uses it as the floor of every shadow side, so none is crushed to navy by the tone map's toe.
// deepFog (optional): the hex the fog falls to at 46 m when `deep` itself would come out as one saturated channel.
// fogTop / fogDeep / inkLin (optional, scene-linear): the open water itself, set outright. The moon needs it: the kit's
//   night volume is a pure blue that the tone map shows as #000077 with red and green at zero, so its water is given as
//   the values this mood's exposure and grade show as moonlit indigo (#102A6C under the ceiling, #091A51 at 46 m, ink #061838).
// seaRays: strength of the sun's spokes on the ceiling seen from the deep. seaK: brightness of that ceiling. rake: the warm
//   flank the pod keeps from below. absorb: how much of the water's blue a shaft takes out behind it (gold stays gold).
const MOODS = {
  golden: { title: 'The Standing Sleepers', sky: { preset: 'goldenHour' }, elev: 24, sun: '#F4B860', fill: '#DDE8EC', deepFill: '#16324A',
    water: '#1E6FA8', deep: '#0A3458', ink: '#03121F', dens: 0.0128, gain: 1.2, key: 4.0, rim: 1.7, caustics: 1.5, fade: 13,
    ray: '#F4B860', rayK: 1.25, kitRays: 0.8, win: '#CFE1EC', warm: '#F4E3C0', winK: 0.36, haloK: 0.3, shade: 0.4, exposure: 1.06, tint: '#fff8ee', shadow: '#02101c', sat: 1.0, glowFrac: 0, slate: [0.0457, 0.0684, 0.1054], seaRays: 0.42, rake: 1.25, seaK: 1.0, absorb: 1.6 },
  noon: { title: 'The Standing Sleepers at Noon', sky: { preset: 'day' }, elev: 70, sun: '#FFF3D6', fill: '#DFF2F2', deepFill: '#123C52',
    water: '#1C8FB4', deep: '#0A4666', ink: '#031823', dens: 0.0118, gain: 0.92, key: 3.0, rim: 1.2, caustics: 2.2, fade: 17,
    ray: '#E6F6EC', rayK: 0.8, kitRays: 1.0, win: '#CDE8EC', warm: '#F2F4E4', winK: 0.34, haloK: 0.22, shade: 0.38, exposure: 1.0, tint: '#f4fffb', shadow: '#02141c', sat: 1.1, glowFrac: 0, slate: [0.0541, 0.0782, 0.1085], seaRays: 0.34, rake: 0.9, seaK: 1.05, absorb: 0.6 },
  dawn: { title: 'The Standing Sleepers at First Light', sky: { preset: 'dawn' }, elev: 7, sun: '#FF9F86', fill: '#D9D4EC', deepFill: '#221E52',
    water: '#3A60B0', deep: '#182466', ink: '#070722', dens: 0.0132, gain: 1.15, key: 3.4, rim: 2.0, caustics: 1.3, fade: 9,
    ray: '#FFA890', rayK: 1.3, kitRays: 0.7, win: '#DCD4E6', warm: '#FFD9C8', winK: 0.34, haloK: 0.34, shade: 0.42, exposure: 1.1, tint: '#fff4f4', shadow: '#080620', sat: 1.08, glowFrac: 0, slate: [0.0512, 0.0535, 0.1055], deepFog: '#3E4668', seaRays: 0.42, rake: 1.25, seaK: 0.95, absorb: 1.6 },
  moon: { title: 'The Standing Sleepers by Moonlight', sky: { preset: 'night' }, elev: 52, sun: '#C4D6F2', fill: '#9FB4CE', deepFill: '#0E2240',
    water: '#1C4A86', deep: '#0C2A5C', ink: '#030C1C', dens: 0.012, gain: 1.5, key: 1.9, rim: 2.2, caustics: 1.2, fade: 14,
    ray: '#BCD0F0', rayK: 0.9, kitRays: 0.9, win: '#B4C6DC', warm: '#D4DEEE', winK: 0.25, haloK: 0.3, shade: 0.3, exposure: 1.4, tint: '#eef4ff', shadow: '#01060f', sat: 0.96, glowFrac: 0.22, slate: [0.0376, 0.0443, 0.0623], seaRays: 0.26, rake: 0.6, seaK: 0.45, absorb: 0.5,
    fogTop: [0.0384, 0.0486, 0.1138], fogDeep: [0.037, 0.04, 0.08], inkLin: [0.037, 0.0415, 0.07] },
};

// ---------------------------------------------------------------- 2. GLSL + builders
const HASH = /* glsl */`
float slH(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
float slN(vec2 x){ vec2 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);
  return mix(mix(slH(i), slH(i + vec2(1.0, 0.0)), f.x), mix(slH(i + vec2(0.0, 1.0)), slH(i + vec2(1.0, 1.0)), f.x), f.y); }
float slF(vec2 p){ return slN(p)*0.55 + slN(p*2.13 + 3.7)*0.29 + slN(p*4.31 + 9.1)*0.16; }
`;
const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
const MAXC = 12;                 // ceiling clumps that ride the real waves (uniform array size)

// ---- sargassum: instanced sprigs (wiry stem, six saw-edged blades, four bladders) under noise-edged mats
function sprigGeometry(rng) {
  const pos = [], nor = [], uvw = [], idx = [];
  const v = (p, n, e, k, part, bv) => { pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); uvw.push(e, k, part, bv); return pos.length / 3 - 1; };
  const L = 0.62, SEG = 3, P = new THREE.Vector3(), T = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), N = new THREE.Vector3();
  const stemAt = (k, out) => out.set(0.09 * Math.sin(k * 3.1) + 0.05 * k, -L * k, 0.07 * Math.sin(k * 4.3 + 1.0));
  // stem: two crossed ribbons
  for (let c = 0; c < 2; c++) {
    const side = c === 0 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1), nn = c === 0 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
    const row = [];
    for (let i = 0; i <= SEG; i++) { const k = i / SEG, w = 0.011 * (1 - 0.5 * k); stemAt(k, P); row.push(v(P.clone().addScaledVector(side, -w), nn, 0, k, 0, k), v(P.clone().addScaledVector(side, w), nn, 0, k, 0, k)); }
    for (let i = 0; i < SEG; i++) { const a = row[i * 2], b = row[i * 2 + 1], c2 = row[i * 2 + 2], d = row[i * 2 + 3]; idx.push(a, c2, b, b, c2, d); }
  }
  // blades: folded diamonds splayed off the stem
  for (let j = 0; j < 6; j++) {
    const k = 0.14 + 0.15 * j + rng.range(-0.03, 0.03), ang = j * 2.4 + rng.range(-0.4, 0.4), len = rng.range(0.11, 0.17), wid = len * 0.2;
    stemAt(k, P); T.set(Math.cos(ang), rng.range(-0.75, -0.1), Math.sin(ang)).normalize();
    A.set(-T.z, 0, T.x).normalize(); N.crossVectors(T, A).normalize(); B.copy(P).addScaledVector(T, len);
    const mid = P.clone().addScaledVector(T, len * 0.45), k2 = Math.min(1, k + 0.12);
    const b0 = v(P, N, 0, k, 1, 0), ml = v(mid.clone().addScaledVector(A, -wid), N, -1, k2, 1, 0.45), mr = v(mid.clone().addScaledVector(A, wid), N, 1, k2, 1, 0.45);
    const cc = v(mid.clone().addScaledVector(N, wid * 0.35), N, 0, k2, 1, 0.45), tp = v(B, N, 0, k2, 1, 1);
    idx.push(b0, ml, cc, b0, cc, mr, ml, tp, cc, cc, tp, mr);
  }
  // bladders: small bipyramids on short stalks
  for (let j = 0; j < 4; j++) {
    const k = 0.2 + 0.2 * j + rng.range(-0.04, 0.04), ang = j * 1.9 + 0.8 + rng.range(-0.5, 0.5), r = rng.range(0.012, 0.017);
    stemAt(k, P); P.x += Math.cos(ang) * 0.035; P.z += Math.sin(ang) * 0.035; P.y += 0.012;
    const top = v(P.clone().add(new THREE.Vector3(0, r * 1.2, 0)), new THREE.Vector3(0, 1, 0), 0, k, 2, 0), bot = v(P.clone().add(new THREE.Vector3(0, -r * 1.2, 0)), new THREE.Vector3(0, -1, 0), 0, k, 2, 1);
    const ring = [];
    for (let q = 0; q < 3; q++) { const a = q * 2.094 + ang; N.set(Math.cos(a), 0, Math.sin(a)); ring.push(v(P.clone().addScaledVector(N, r), N, 1, k, 2, 0.5)); }
    for (let q = 0; q < 3; q++) { const a = ring[q], b = ring[(q + 1) % 3]; idx.push(top, a, b, bot, b, a); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aUvw', new THREE.Float32BufferAttribute(uvw, 4)); g.setIndex(idx);
  return g;
}
const WEED_VERT = /* glsl */`
attribute vec4 aUvw;     // edge (-1..1 across a blade), k (0 root .. 1 tip of the sprig), part (0 stem 1 blade 2 bladder), v along the blade
attribute vec4 aI;       // phase, tint, clump index, spare
uniform float uTime, uDeepA; uniform float uH[${MAXC}];
varying vec4 vUvw; varying vec3 vW; varying vec3 vN; varying float vTint;
#include <common>
#include <fog_pars_vertex>
void main(){
  // from far below a sprig is smaller than a pixel and only sparkles on the mat: it shrinks to nothing as the view deepens
  vec4 wp = modelMatrix*instanceMatrix*vec4(position*(1.0 - smoothstep(0.35, 0.9, uDeepA)), 1.0);
  float k = aUvw.y, ph = aI.x;
  wp.x += k*k*0.2*sin(uTime*0.9 + ph + wp.z*0.6) + k*0.045*sin(uTime*2.3 + ph*3.0);
  wp.z += k*k*0.16*sin(uTime*0.7 + ph*1.7 + wp.x*0.5);
  wp.y += uH[int(clamp(aI.z, 0.0, ${(MAXC - 1).toFixed(1)}))] + k*0.04*sin(uTime*1.3 + ph);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal); vUvw = aUvw; vTint = aI.y;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const WEED_FRAG = /* glsl */`
uniform vec3 uSunT, uSunCol, uFill; uniform float uKey, uDeepA;
varying vec4 vUvw; varying vec3 vW; varying vec3 vN; varying float vTint;
#include <common>
#include <fog_pars_fragment>
void main(){
  float part = vUvw.z, e = abs(vUvw.x);
  float blade = step(0.5, part)*(1.0 - step(1.5, part));
  if (blade > 0.5 && e > 0.72 + 0.28*abs(fract(vUvw.w*6.0)*2.0 - 1.0)) discard;      // saw edge
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
  if (dot(N, V) < 0.0) N = -N;
  vec3 alb = mix(vec3(0.085, 0.058, 0.012), vec3(0.16, 0.115, 0.022), vTint);
  alb = mix(alb, vec3(0.2, 0.15, 0.035), step(1.5, part));
  float ndl = abs(dot(N, uSunT));
  vec3 col = alb*(uFill*0.3 + uSunCol*(uKey*0.42*ndl));
  // the sun comes through thin edges honey-gold
  float tow = max(dot(-V, uSunT), 0.0);
  float thin = mix(0.25, 1.0, smoothstep(0.25, 0.9, e))*(0.4 + 0.6*blade) + 0.5*step(1.5, part);
  col += uSunCol*(uKey*0.085*thin*(0.35 + 1.65*tow*tow));
  col = mix(col, vec3(0.1, 0.085, 0.03)*uFill*0.5 + uSunCol*(0.05*thin), uDeepA*0.9);      // from far below: soft olive, never black speckle
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
const MAT_VERT = /* glsl */`
attribute vec3 aM;       // clump index, seed, density
uniform float uTime; uniform float uH[${MAXC}];
varying vec2 vUv2; varying vec3 vM; varying vec3 vW;
#include <common>
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix*vec4(position, 1.0);
  wp.y += uH[int(clamp(aM.x, 0.0, ${(MAXC - 1).toFixed(1)}))];
  vUv2 = uv*2.0 - 1.0; vM = aM; vW = wp.xyz;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const MAT_FRAG = /* glsl */`
uniform vec3 uSunT, uSunCol, uFill; uniform float uKey, uTime, uDeepA;
varying vec2 vUv2; varying vec3 vM; varying vec3 vW;
#include <common>
#include <fog_pars_fragment>
${HASH}
void main(){
  float r = dot(vUv2, vUv2);
  vec2 q = vW.xz*0.9 + vM.y*17.0 + 0.04*vec2(sin(uTime*0.5 + vW.z), cos(uTime*0.4 + vW.x));
  float n = slF(q)*0.7 + slN(q*5.5)*0.3;
  n = mix(n, slN(q*0.55)*0.62 + slN(q*1.3 + 3.7)*0.38, uDeepA);          // from below: broad soft shapes, nothing finer than a pixel
  float d = n*vM.z*1.9 - r*1.05 - 0.22;
  float a = smoothstep(0.0, mix(0.22, 0.5, uDeepA), d);
  if (a < 0.01) discard;
  vec3 V = normalize(cameraPosition - vW);
  float tow = max(dot(-V, uSunT), 0.0);
  float thick = smoothstep(0.02, 0.3, d);
  // (the heart of a mat is dark olive-brown, about #2A2410 on screen: the floor is the scene-linear value the grade shows as that)
  vec3 dark = vec3(0.05, 0.036, 0.009)*(uFill*0.45 + uSunCol*uKey*0.07)*2.0 + vec3(0.05, 0.046, 0.033)*(1.0 - uDeepA);
  vec3 edge = uSunCol*(uKey*0.075*(0.45 + 1.55*tow*tow)) + vec3(0.1, 0.07, 0.012)*uFill*0.4;
  vec3 col = mix(edge, dark, thick)*(0.8 + 0.4*slN(q*11.0)*(1.0 - uDeepA));
  // from far below the mat is a soft olive shadow on the window: a dark olive heart, thinning to honey where the sun comes
  // through its edge, with no outline (alpha and colour both run smoothly from the rim to the heart)
  float core = smoothstep(0.1, 0.5, d);
  vec3 deepCol = mix(uSunCol*0.2 + vec3(0.13, 0.1, 0.025)*uFill, vec3(0.12, 0.115, 0.05)*uFill, core);
  col = mix(col, deepCol, uDeepA);
  gl_FragColor = vec4(col, mix(a*0.94, smoothstep(0.0, 0.5, d)*mix(0.4, 0.72, core), uDeepA));
  #include <fog_fragment>
}`;
// clumps: [{ x, z, rx, rz, yaw, sprigs (share), dens }]. Every clump rides the real surface through uH[index].
function makeWeed(rng, clumps, o) {
  const group = new THREE.Group(); group.name = 'sargassum';
  const uH = { value: new Array(MAXC).fill(0) }, uTime = { value: 0 }, uDeepA = { value: 0 };
  const lightU = { uSunT: { value: o.sunT }, uSunCol: { value: o.sunCol }, uFill: { value: o.fill }, uKey: { value: o.key }, uTime, uH, uDeepA };
  const n = Math.min(clumps.length, MAXC);
  // sprigs
  const total = clumps.reduce((s, c) => s + (c.sprigs || 0), 0);
  if (total > 0 && o.count > 0) {
    const geo = sprigGeometry(rng.fork('sprig')), aI = new THREE.InstancedBufferAttribute(new Float32Array(o.count * 4), 4);
    geo.setAttribute('aI', aI);
    const mesh = new THREE.InstancedMesh(geo, new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), lightU), vertexShader: WEED_VERT, fragmentShader: WEED_FRAG, fog: true, side: THREE.DoubleSide }), o.count);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
    let k = 0;
    for (let c = 0; c < n; c++) {
      const C = clumps[c], num = c === n - 1 ? o.count - k : Math.min(o.count - k, Math.round(o.count * (C.sprigs || 0) / total));
      const cy = Math.cos(C.yaw || 0), sy = Math.sin(C.yaw || 0);
      for (let i = 0; i < num; i++, k++) {
        const a = rng.range(0, Math.PI * 2), r = Math.sqrt(rng()) * 0.92, lx = Math.cos(a) * r * C.rx, lz = Math.sin(a) * r * C.rz;
        const hang = rng.chance(0.16), sc = hang ? rng.range(1.5, 2.3) : rng.range(0.8, 1.6);
        p.set(C.x + lx * cy - lz * sy, -rng.range(0.03, 0.22), C.z + lx * sy + lz * cy);
        e.set(hang ? rng.range(-0.25, 0.25) : rng.range(-1.25, 1.25), rng.range(0, Math.PI * 2), hang ? rng.range(-0.25, 0.25) : rng.range(-1.25, 1.25), 'YXZ');
        mesh.setMatrixAt(k, m.compose(p, q.setFromEuler(e), s.set(sc, sc, sc)));
        aI.setXYZW(k, rng.range(0, 6.283), rng(), c, 0);
      }
    }
    mesh.count = k; mesh.frustumCulled = false; mesh.name = 'sargassum-sprigs'; group.add(mesh);
  }
  // mats: overlapping noise-edged quads
  const pos = [], uv = [], aM = [], idx = [];
  for (let c = 0; c < n; c++) {
    const C = clumps[c], cy = Math.cos(C.yaw || 0), sy = Math.sin(C.yaw || 0), reps = C.mats ?? 2;
    for (let j = 0; j < reps; j++) {
      const ox = rng.range(-0.3, 0.3) * C.rx, oz = rng.range(-0.3, 0.3) * C.rz, hx = C.rx * rng.range(1.15, 1.45), hz = C.rz * rng.range(1.15, 1.45), base = pos.length / 3, seed = rng();
      for (const [ux, uz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const lx = ox + ux * hx, lz = oz + uz * hz;
        pos.push(C.x + lx * cy - lz * sy, -0.05 - 0.02 * j, C.z + lx * sy + lz * cy); uv.push(ux * 0.5 + 0.5, uz * 0.5 + 0.5); aM.push(c, seed, C.dens ?? 1);
      }
      idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }
  if (pos.length) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aM', new THREE.Float32BufferAttribute(aM, 3)); g.setIndex(idx);
    const mats = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), lightU), vertexShader: MAT_VERT, fragmentShader: MAT_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    mats.frustumCulled = false; mats.renderOrder = 3; mats.name = 'sargassum-mats'; group.add(mats);
  }
  return { object: group, uH, uTime, uDeepA, clumps: clumps.slice(0, n) };
}

// ---- a drifting log (ceiling variant): waterlogged trunk with broken limbs, bark streaks and barnacles
const LOG_VERT = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec2 vUv2;
#include <common>
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix)*normal); vUv2 = uv;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const LOG_FRAG = /* glsl */`
uniform vec3 uSunT, uSunCol, uFill; uniform float uKey, uTime;
varying vec3 vW; varying vec3 vN; varying vec2 vUv2;
#include <common>
#include <fog_pars_fragment>
${HASH}
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
  float bark = slN(vec2(vUv2.x*5.0, vUv2.y*46.0 + 3.0*slN(vUv2*vec2(9.0, 4.0))));
  float crack = smoothstep(0.62, 0.9, 1.0 - abs(2.0*bark - 1.0));
  vec3 alb = mix(vec3(0.06, 0.045, 0.03), vec3(0.2, 0.15, 0.1), slF(vUv2*vec2(7.0, 3.0)))*(1.0 - 0.6*crack);
  vec2 bc = vUv2*vec2(60.0, 26.0); vec2 bi = floor(bc), bf = fract(bc) - 0.5;
  float barn = step(0.8, slH(bi))*(1.0 - smoothstep(0.18, 0.34, length(bf)))*smoothstep(0.3, 0.6, slN(vUv2*vec2(8.0, 5.0) + 4.0));
  alb = mix(alb, vec3(0.42, 0.4, 0.34), barn);
  float ca = slN(vW.xz*1.6 + vec2(uTime*0.5, -uTime*0.3)); ca = 1.0 - abs(2.0*ca - 1.0); ca *= ca*ca;
  float ndl = clamp(dot(N, uSunT)*0.8 + 0.2, 0.0, 1.0), up = clamp(0.5 - 0.5*N.y, 0.0, 1.0), fr = 1.0 - clamp(dot(N, V), 0.0, 1.0);
  vec3 col = alb*(uFill*(0.22 + 0.25*up) + uSunCol*(uKey*ndl*(0.5 + 1.2*ca))) + uSunCol*(uKey*0.12*fr*fr*fr*smoothstep(-0.2, 0.5, dot(N, uSunT)));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
function makeLog(rng, o) {
  const len = 7.5, RS = 40, SS = 16, pos = [], uv = [], idx = [];
  const rad = (t, a) => 0.34 * (1 - 0.35 * t) * (1 + 0.12 * Math.sin(a * 3 + t * 9) + 0.08 * Math.sin(a * 7 - t * 23) + 0.1 * Math.sin(t * 31)) * (0.25 + 0.75 * Math.min(1, Math.min(t, 1 - t) * 14));
  for (let i = 0; i <= RS; i++) for (let j = 0; j <= SS; j++) {
    const t = i / RS, a = (j / SS) * Math.PI * 2, r = rad(t, a);
    pos.push((t - 0.5) * len, Math.cos(a) * r + 0.12 * Math.sin(t * 3.4), Math.sin(a) * r + 0.2 * Math.sin(t * 2.2 + 1)); uv.push(j / SS, t);
  }
  for (let i = 0; i < RS; i++) for (let j = 0; j < SS; j++) { const a = i * (SS + 1) + j, b = a + 1, c = a + SS + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  // broken limbs
  for (let L = 0; L < 4; L++) {
    const t0 = rng.range(0.15, 0.8), ang = rng.range(0, 6.283), ll = rng.range(0.5, 1.4), base = pos.length / 3, LS = 6, LR = 7;
    const ox = (t0 - 0.5) * len, dir = new THREE.Vector3(rng.range(-0.5, 0.5), Math.cos(ang), Math.sin(ang)).normalize();
    const sA = new THREE.Vector3(1, 0, 0).cross(dir).normalize(), sB = new THREE.Vector3().crossVectors(dir, sA);
    for (let i = 0; i <= LS; i++) for (let j = 0; j <= LR; j++) {
      const t = i / LS, a = (j / LR) * Math.PI * 2, r = 0.1 * (1 - 0.6 * t) * (i === LS ? 0.3 : 1) * (1 + 0.2 * Math.sin(a * 2 + t * 6));
      const c = new THREE.Vector3(ox, 0.12 * Math.sin(t0 * 3.4), 0.2 * Math.sin(t0 * 2.2 + 1)).addScaledVector(dir, 0.2 + t * ll).addScaledVector(sA, Math.cos(a) * r).addScaledVector(sB, Math.sin(a) * r);
      pos.push(c.x, c.y, c.z); uv.push(j / LR, t0 + t * 0.1);
    }
    for (let i = 0; i < LS; i++) for (let j = 0; j < LR; j++) { const a = base + i * (LR + 1) + j, b = a + 1, c = a + LR + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const uTime = { value: 0 };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), { uSunT: { value: o.sunT }, uSunCol: { value: o.sunCol }, uFill: { value: o.fill }, uKey: { value: o.key }, uTime }), vertexShader: LOG_VERT, fragmentShader: LOG_FRAG, fog: true }));
  mesh.name = 'drift-log';
  return { object: mesh, uTime };
}

// ---- ceiling veil: one camera-following sheet a metre under the surface. Premultiplied: rgb is added, alpha darkens.
//      window glow (pewter, white-gold toward the sun; it widens from Snell's disc to the whole upper water as the camera
//      sinks, so from 46 m the henge stands against light), a soft halo round the refracted sun, rain rings in three sizes.
const VEIL_VERT = /* glsl */`
varying vec3 vW;
void main(){ vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`;
const VEIL_FRAG = /* glsl */`
uniform vec3 uSunT, uWinCol, uWarmCol, uSunCol, uRainDir, uFogCol, uCoolCol; uniform float uWin, uSpread, uHalo, uRain, uShade, uTime, uLift, uSea, uRays, uSeaK;
varying vec3 vW;
${HASH}
// the chop's caustic web: distance between the two nearest of a field of wandering points (0 on a cell edge)
float slWeb(vec2 p, float t){
  vec2 ic = floor(p), fc = fract(p); float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)); float h = slH(ic + g), h2 = slH(ic + g + 17.3);
    vec2 o = g + 0.5 + 0.46*vec2(cos(t*(0.6 + 0.8*h) + h*6.283), sin(t*(0.6 + 0.8*h2) + h2*6.283)) - fc;
    float d = dot(o, o);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return sqrt(d2) - sqrt(d1);
}
// one layer of rain rings: hashed cells, each with its own centre, final radius, rate and start, most cells empty
float slRings(vec2 p, float sc, float sd, float dist){
  vec2 g = p*sc + sd*11.3; vec2 id = floor(g), f = fract(g) - 0.5;
  float h = slH(id + sd*3.1), h2 = slH(id*1.7 + 5.3 + sd);
  float life = fract(uTime*(0.5 + 0.7*h2) + h*17.0);
  vec2 c = (vec2(slH(id + 3.1), slH(id + 7.7)) - 0.5)*0.4;
  float rr = length(f - c), w = sc*max(0.03 + 0.035*life, dist*0.003);
  float fade = (1.0 - life)*(1.0 - life);
  return (1.0 - smoothstep(0.0, w, abs(rr - 0.03 - (0.1 + 0.18*h2)*life)))*fade*step(0.6, h);
}
void main(){
  vec3 D = vW - cameraPosition; float dist = max(length(D), 1e-3); D /= dist;
  float cz = max(D.y, 0.0);
  // near the ceiling the glow keeps to Snell's window; from the deep (uSpread 1) it reaches down into the level haze,
  // so the far sleepers stand against light, not against fog
  // (uSpread 1: the glow feathers from 4 to 38 degrees of elevation, a quarter of the frame and more, its foot broken by slow
  //  noise so it has no limb; the sheet's own rim, 5 degrees up from 46 m, is faded out before it is reached)
  float foot = slF(vW.xz*0.006 + uTime*vec2(0.006, -0.004)) - 0.5;
  float win = smoothstep(mix(0.62, 0.07 + 0.16*foot, uSpread), mix(0.78, 0.62, uSpread), cz);
  float rimK = 1.0 - smoothstep(380.0, 505.0, length(vW.xz - cameraPosition.xz));
  // (both the glow's foot and the beams below end by 6 degrees of elevation, well inside the sheet's rim: no limb there either)
  float lowK = smoothstep(0.1, 0.24, cz);
  win *= mix(1.0, (0.35 + 0.65*win)*lowK, uSpread)*rimK;
  float sd = max(dot(D, uSunT), 0.0);
  float s2 = sd*sd, s4 = s2*s2, s8 = s4*s4, s32 = s8*s8*s8*s8;
  // a slow silver ripple so the glow reads as a ceiling and never as a flat gradient (gone before it is pixel-fine)
  float rip = 0.74 + 0.36*slF(vW.xz*0.13 + uTime*vec2(0.08, -0.055)) + 0.16*slN(vW.xz*0.5 - uTime*vec2(0.16, 0.11));
  rip = mix(1.0, rip, 1.0 - smoothstep(70.0, 170.0, dist));
  // the chop's light inside Snell's disc: soft bright lanes lying along the wind, drifting (no lines, nothing to alias)
  vec2 rw = vec2(vW.x*0.94 + vW.z*0.34, vW.z*0.94 - vW.x*0.34);
  float d1 = slN(rw*vec2(0.085, 0.4) + uTime*vec2(0.16, 0.05)), d2 = slN(rw*vec2(0.19, 0.9) - uTime*vec2(0.27, 0.08) + 3.7);
  float net = 0.75*smoothstep(0.42, 0.85, d1) + 0.5*smoothstep(0.5, 0.9, d2)*(1.0 - smoothstep(45.0, 95.0, dist));
  rip += 0.34*net*smoothstep(0.45, 0.8, cz)*(1.0 - smoothstep(80.0, 150.0, dist));
  // squall: a soft-edged half of the ceiling, darker, shaftless, stippled with expanding rain rings
  float sq = uRain*smoothstep(-6.0, 10.0, dot(vW.xz, uRainDir.xz) - uRainDir.y + 5.0*(slN(vW.xz*0.07) - 0.5));
  float fall = exp(-dist*0.012);
  // THE SEA FROM THE DEEP (uSea 1): not a pewter wash but the lit underside of the sea. Three things make it one:
  //  a key side (white-gold and brightest toward the sun, falling through silver-blue to steel blue on the far side),
  //  Snell's disc (the ceiling is darker outside it, behind a wobbling rim), and the chop's own light: a web of bright
  //  threads round dark cells at three sizes, each cell's corner wandering (each size is gone before it is pixel-fine).
  float g1 = smoothstep(0.02, 0.95, sd);
  // (the web lies along the wind, its cells longer than wide and bent by two sizes of slow swell; it gathers into bright
  //  fields and thins to almost nothing between them, and no thread is evenly lit along its length: a net it is not)
  vec2 wq = vec2(rw.x*0.6, rw.y) + 4.5*vec2(slN(rw*0.045 + uTime*0.03), slN(rw*0.045 + 7.3 - uTime*0.025)) + 1.2*vec2(slN(rw*0.21 - uTime*0.06), slN(rw*0.21 + 3.1 + uTime*0.05));
  float wa = slWeb(wq*0.2, uTime*0.55), wb = slWeb(wq*0.43 + 3.7, uTime*0.8 + 2.0), wc = slWeb(wq*1.05 + 9.1, uTime*1.1 + 5.0);
  wa = 0.7*exp(-8.0*wa) + 0.3*exp(-2.5*wa); wb = 0.7*exp(-7.0*wb) + 0.3*exp(-2.5*wb); wc = exp(-6.0*wc);
  float field = 0.2 + 0.8*smoothstep(0.3, 0.72, slF(rw*0.034 + uTime*vec2(0.012, -0.008)));
  float thread = 0.5 + 0.5*slN(wq*0.37 + uTime*vec2(0.09, 0.06));
  float lace = (wa*(1.0 - smoothstep(120.0, 240.0, dist)) + 0.7*wb*(1.0 - smoothstep(60.0, 120.0, dist))*thread + 0.6*wc*(1.0 - smoothstep(22.0, 46.0, dist)))*field*(0.45 + 0.55*thread);
  float snell = smoothstep(0.58, 0.7, cz + 0.07*(slN(vW.xz*0.05 + uTime*0.03) - 0.5));
  // silver-blue all over; the sun's side is not mixed toward cream (that muddies) but has gold light added over a thinner blue
  vec3 tone = mix(uCoolCol, mix(uCoolCol, uWinCol, 0.5), g1)*(1.0 - 0.78*s4);
  float seaK = (0.52 + 0.24*g1)*(0.58 + 0.42*snell)*(0.62 + lace*1.25*(0.4 + 0.6*snell));
  vec3 gold = mix(uWarmCol, uSunCol, 0.75)*((0.45*s4 + 0.4*s8)*(0.3 + 0.95*lace)*0.74);
  vec3 base = mix(mix(uWinCol, uWarmCol, clamp(s8*1.2, 0.0, 1.0))*uWin, (tone*seaK + gold)*uSeaK, uSea);
  vec3 col = base*(win*rip*(1.0 - 0.45*sq)) + uSunCol*(uHalo*(0.5*s8 + 0.9*s32 + 0.8*s4*net*smoothstep(0.04, 0.3, cz))*(1.0 - sq)*fall);
  // the sun's shafts seen from inside the water: spokes fanning from the sun's place on the ceiling (it stays out of
  // frame), strongest 10 to 60 degrees from it, wandering and never even. They run on down past the window's rim.
  vec3 f1 = normalize(cross(uSunT, vec3(0.0, 0.0, 1.0)) + vec3(1e-4, 0.0, 0.0)); vec3 f2 = cross(uSunT, f1);
  float qx = dot(D, f1), qy = dot(D, f2);
  float ps = atan(qy, qx + (abs(qx) + abs(qy) < 1e-5 ? 1e-4 : 0.0));
  float k1 = 0.5 + 0.5*sin(ps*11.0 + 1.3*sin(ps*4.0 + uTime*0.21) - uTime*0.17), k2 = 0.5 + 0.5*sin(ps*29.0 + uTime*0.33 + 2.0*sin(ps*7.0 - uTime*0.13));
  float spoke = k1*k1*k1*(0.55 + 0.45*k2);
  col += mix(uWarmCol, uSunCol, 0.45)*(uRays*spoke*smoothstep(0.03, 0.3, sqrt(max(1.0 - sd*sd, 0.0)))*smoothstep(0.1, 0.9, sd)*smoothstep(0.05, 0.3, cz)*rimK*(1.0 - 0.6*sq));
  // uLift (the view from the deep): the dark water under the glow carries two or three broad, soft beams, the sun's
  // light converging on the antisolar point below (the backdrop draws the same spokes under the level gaze; up here
  // the fogged underside of the sea hides the backdrop, so they are drawn on this sheet). Edges ten degrees soft.
  vec3 an = -uSunT; vec3 e1 = normalize(cross(an, vec3(0.0, 0.0, 1.0)) + vec3(1e-4, 0.0, 0.0)); vec3 e2 = cross(an, e1);
  float bx = dot(D, e1), by = dot(D, e2), ba = dot(D, an);
  float phi = atan(by, bx + (abs(bx) + abs(by) < 1e-5 ? 1e-4 : 0.0));
  float broad = 0.5 + 0.5*sin(phi*9.0 + 1.7*sin(uTime*0.23) + 0.6*sin(phi*3.0 - uTime*0.31)); broad *= broad;
  col += (uFogCol + vec3(0.012, 0.016, 0.02))*(uLift*1.1*broad*smoothstep(0.03, 0.5, sqrt(max(1.0 - ba*ba, 0.0)))*(1.0 - smoothstep(0.16, 0.56, cz))*lowK*rimK);
  float near = 1.0 - smoothstep(34.0, 80.0, dist);
  float ring = slRings(vW.xz, 0.8, 0.0, dist) + 0.8*slRings(vW.xz + 9.7, 0.37, 1.0, dist) + 0.6*slRings(vW.xz*mat2(0.8, -0.6, 0.6, 0.8), 1.7, 2.0, dist)*(1.0 - smoothstep(14.0, 40.0, dist));
  float stip = slN(vW.xz*3.1 + uTime*vec2(0.7, -0.5))*slN(vW.xz*0.9 - uTime*vec2(0.2, 0.3));
  float patchy = 0.35 + 0.65*smoothstep(0.3, 0.7, slN(vW.xz*0.21 + uTime*vec2(0.11, 0.07)));          // gusts: the rain is never even
  col += uWinCol*(sq*patchy*(0.34*min(ring, 1.0)*near + 0.1*stip*(1.0 - 0.6*near))*(0.35 + 0.65*cz)*exp(-dist*0.008));
  // (from the deep the veil stands in for the kit's own window, whose pale sky would wash the sea's colour out)
  gl_FragColor = vec4(col, clamp(0.3*sq*fall + mix(uShade, 0.86, uSea)*win*(1.0 - 0.5*sq*(1.0 - uSea)), 0.0, 0.9));
}`;
function makeCeilingVeil(o) {
  const g = new THREE.CircleGeometry(520, 64); g.rotateX(Math.PI / 2);
  const uniforms = { uSunT: { value: o.sunT }, uWinCol: { value: o.winCol }, uWarmCol: { value: o.warmCol }, uSunCol: { value: o.sunCol }, uRainDir: { value: new THREE.Vector3(0, 0, -1) },
    uWin: { value: 0 }, uSpread: { value: 0 }, uHalo: { value: 0 }, uRain: { value: 0 }, uShade: { value: 0 }, uTime: { value: 0 }, uLift: { value: 0 }, uFogCol: { value: o.fogCol }, uCoolCol: { value: o.coolCol }, uSea: { value: 0 }, uRays: { value: 0 }, uSeaK: { value: o.seaK ?? 1 } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: VEIL_VERT, fragmentShader: VEIL_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
  mesh.position.y = -1.0; mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.name = 'ceiling-veil';
  return { object: mesh, uniforms };
}

// ---- light shafts: every shaft of the world in one instanced call (see "LIGHT SHAFTS" in build for why not the kit's).
//      A shaft is a camera-facing ribbon from a point on the sea surface down the refracted sun line: brightest just
//      under the ceiling, dissolving with depth, hazed out with distance from the camera (the far ceiling is invisible in
//      the haze, so a far shaft's top must be too), and gone when the camera is inside it or looks straight along it.
const SHAFT_VERT = /* glsl */`
attribute vec3 aOrigin; attribute vec4 aParam; attribute vec4 aCol;     // surface point; width x, length m, phase, strength; rgb, class (0 near, 1 deep, 2 henge)
uniform vec3 uDir; uniform vec2 uWidth; uniform float uTime, uK, uKDeep, uKHenge;
varying vec2 vUv2; varying vec3 vPar; varying vec3 vCol; varying float vDist;
void main(){
  float s = uv.y, L = aParam.y;
  vec3 o = aOrigin + vec3(0.7*sin(uTime*0.11 + aParam.z*40.0), 0.0, 0.7*cos(uTime*0.09 + aParam.z*23.0));
  vec3 pc = o + uDir*(s*L);
  vec3 toCam = cameraPosition - pc; float dc = max(length(toCam), 1e-3);
  vec3 sd = cross(uDir, toCam); float sl = length(sd);
  vec3 side = sl > 1e-4 ? sd/sl : vec3(1.0, 0.0, 0.0);
  float w = mix(uWidth.x, uWidth.y, s)*aParam.x;
  float k = max(w, 0.006*dc);                                           // never thinner than a few pixels: widen and dim instead
  vec3 world = pc + side*((uv.x - 0.5)*2.0*k);
  vec3 oc = cameraPosition - o; float tt = clamp(dot(oc, uDir), 0.0, L); float dAxis = length(oc - uDir*tt);
  float wHere = mix(uWidth.x, uWidth.y, tt/L)*aParam.x;
  float along = abs(dot(uDir, toCam/dc));
  float fade = smoothstep(0.7*wHere, 3.0*wHere, dAxis)*(1.0 - smoothstep(0.8, 0.96, along))*(w/k);
  vDist = dc; vUv2 = uv; vPar = vec3(aParam.z, aParam.w*fade*(aCol.a < 0.5 ? uK : aCol.a < 1.5 ? uKDeep : uKHenge), step(1.5, aCol.a)); vCol = aCol.rgb;
  gl_Position = projectionMatrix*viewMatrix*vec4(world, 1.0);
}`;
const SHAFT_FRAG = /* glsl */`
uniform float uTime, uHaze, uAbs;
varying vec2 vUv2; varying vec3 vPar; varying vec3 vCol; varying float vDist;
${HASH}
void main(){
  float x = vUv2.x*2.0 - 1.0, s = vUv2.y, ph = vPar.x;
  float across = max(1.0 - x*x, 0.0); across *= across;
  float t1 = max(1.0 - s, 0.0);
  float along = (0.4 + 0.6*smoothstep(0.0, 0.12, s))*t1*sqrt(t1)*mix(t1, 1.0, vPar.z);       // lit from the ceiling down, no end at either end (the henge class reaches deeper)
  float n = slF(vec2(x*1.3 + ph*23.0, s*2.5 - uTime*0.07 + ph*7.0));
  float lobe = 0.72 + 0.28*sin(x*4.0 + ph*31.0 + 0.6*sin(uTime*0.2 + ph*9.0));
  float shimmer = 0.75 + 0.25*sin(uTime*(0.25 + ph*0.3) + ph*20.0);
  float body = across*along*(0.5 + 0.75*n)*lobe*shimmer*vPar.y*exp(-vDist/uHaze);
  // premultiplied: the shaft adds its light and takes a little of the water's blue from behind it, so a gold shaft is
  // gold in blue water and not lavender
  gl_FragColor = vec4(vCol*body, clamp(uAbs*body, 0.0, 0.75));
}`;
// sets: [{ rng, x, z, radius, count, reach (m of depth), width: [k0, k1], color, intensity, deep }]
function makeShafts(sets, o) {
  const n = sets.reduce((a, S) => a + S.count, 0), org = new Float32Array(n * 3), par = new Float32Array(n * 4), col = new Float32Array(n * 4), c = new THREE.Color();
  let k = 0;
  for (const S of sets) for (let i = 0; i < S.count; i++, k++) {
    const a = S.rng() * Math.PI * 2, r = Math.sqrt(S.rng()) * S.radius;
    org[k * 3] = S.x + Math.cos(a) * r; org[k * 3 + 1] = 0.5; org[k * 3 + 2] = S.z + Math.sin(a) * r;
    par[k * 4] = (0.5 + S.rng() * 1.1) * S.width; par[k * 4 + 1] = (S.reach / o.sy) * (0.65 + S.rng() * 0.35); par[k * 4 + 2] = S.rng(); par[k * 4 + 3] = 0.35 + S.rng() * 0.65;
    c.set(S.color).multiplyScalar(S.intensity); col[k * 4] = c.r; col[k * 4 + 1] = c.g; col[k * 4 + 2] = c.b; col[k * 4 + 3] = S.cls || 0;
  }
  const base = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.getAttribute('position')); g.setAttribute('uv', base.getAttribute('uv'));
  g.setAttribute('aOrigin', new THREE.InstancedBufferAttribute(org, 3)); g.setAttribute('aParam', new THREE.InstancedBufferAttribute(par, 4)); g.setAttribute('aCol', new THREE.InstancedBufferAttribute(col, 4));
  g.instanceCount = n;
  const uniforms = { uDir: { value: o.dir }, uWidth: { value: new THREE.Vector2(o.width[0], o.width[1]) }, uTime: { value: 0 }, uK: { value: 1 }, uKDeep: { value: 1 }, uKHenge: { value: 0 }, uHaze: { value: o.haze }, uAbs: { value: o.absorb ?? 0.4 } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
  mesh.frustumCulled = false; mesh.renderOrder = 4; mesh.name = 'light-shafts';
  return { object: mesh, uniforms };
}

// ---- backdrop: the water below the level gaze falls from the fog colour to ink (the sea has no floor)
function makeBackdrop(fogColor, ink, anti, beam) {
  const uniforms = { uFog: { value: fogColor }, uInk: { value: ink }, uTime: { value: 0 }, uAnti: { value: anti }, uBeam: { value: beam } };
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16), new THREE.ShaderMaterial({ uniforms, side: THREE.BackSide, depthWrite: false, depthTest: false,
    vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`uniform vec3 uFog, uInk, uAnti; uniform float uTime, uBeam; varying vec3 vD;
      void main(){ vec3 d = normalize(vD); float t = clamp(-d.y, 0.0, 1.0); float k = smoothstep(0.05, 1.0, t);
        vec3 col = mix(uFog, uInk, k*k*0.8);
        // the sun's beams seen from inside the water: wavering spokes that converge on the antisolar point below
        vec3 e1 = normalize(cross(uAnti, vec3(0.0, 0.0, 1.0)) + vec3(1e-4, 0.0, 0.0)); vec3 e2 = cross(uAnti, e1);
        float ca = dot(d, uAnti), x = dot(d, e1), y = dot(d, e2);
        float phi = atan(y, x + (abs(x) + abs(y) < 1e-5 ? 1e-4 : 0.0));
        float s = sin(phi*9.0 + 1.7*sin(uTime*0.23) + 0.6*sin(phi*3.0 - uTime*0.31))
                + 0.7*sin(phi*17.0 - uTime*0.47 + 1.3*sin(phi*5.0 + uTime*0.19)) + 0.5*sin(phi*31.0 + uTime*0.71);
        float beam = smoothstep(0.2, 1.9, s);
        float sa = sqrt(max(1.0 - ca*ca, 0.0));
        float fade = smoothstep(0.03, 0.4, sa)*smoothstep(-0.6, 0.5, ca)*smoothstep(0.0, 0.3, t + 0.1);
        col += uFog*(uBeam*beam*fade);
        gl_FragColor = vec4(col, 1.0); }` }));
  mesh.frustumCulled = false; mesh.renderOrder = -1; mesh.name = 'backdrop';
  return { object: mesh, uniforms };
}

// ---- portal halo: a soft gold corona round the exit that kindles as the henge comes into view
function makePortalHalo(color) {
  const uniforms = { uColor: { value: new THREE.Color(color) }, uKindle: { value: 0 }, uTime: { value: 0 } };
  const mesh = new THREE.Mesh(new THREE.RingGeometry(5.6, 12, 72, 1), new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`uniform vec3 uColor; uniform float uKindle, uTime; varying vec2 vP;
      ${HASH}
      void main(){ float r = length(vP); float a = atan(vP.y, vP.x + 1e-5);
        float x = max(r - 6.0, 0.0);
        float lick = slN(vec2(a*5.0 + uTime*0.3, r*0.9 - uTime*0.8))*0.6 + slN(vec2(a*13.0 - uTime*0.5, r*2.2 - uTime*1.6))*0.4;
        float glow = exp(-x*1.3)*0.3 + exp(-x*0.5)*0.14*(0.4 + 1.2*lick);
        glow *= smoothstep(5.6, 6.1, r)*(1.0 - smoothstep(10.0, 12.0, r));
        gl_FragColor = vec4(uColor*(glow*uKindle), 1.0); }` }));
  mesh.name = 'portal-halo'; mesh.renderOrder = 6;
  return { object: mesh, uniforms };
}

// ---- rare event dressing: the foam ring where a brow breaks the ceiling and the white burst of the blow, from below
function makeRiser() {
  const uniforms = { uFoam: { value: 0 }, uBlow: { value: 0 }, uTime: { value: 0 }, uCol: { value: new THREE.Color('#E9F2F4') } };
  const g = new THREE.PlaneGeometry(26, 26); g.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`uniform vec3 uCol; uniform float uFoam, uBlow, uTime; varying vec2 vP;
      ${HASH}
      void main(){ float r = length(vP); float a = atan(vP.y, vP.x + 1e-5);
        float n = slF(vec2(a*2.2, r*0.7 - uTime*0.6))*0.7 + slN(vP*2.6 + uTime*0.4)*0.3;
        float R = 2.2 + 7.5*uFoam;
        float cut = smoothstep(0.42, 0.6, n)*(0.55 + 0.9*smoothstep(0.4, 0.75, slN(vP*4.3 + uTime*vec2(0.3, -0.2))));     // breaks the foam into lace
        float hollow = smoothstep(1.2, 2.4, r);                                                                        // the dark brow in the middle
        float ring = exp(-abs(r - R)*(1.5 - 0.6*uFoam))*cut*sin(3.1416*clamp(uFoam, 0.0, 1.0));
        float spokes = smoothstep(0.5, 0.9, slN(vec2(a*7.0, r*0.5 - uTime*0.9)))*exp(-abs(r - R*0.6)*0.7)*sin(3.1416*clamp(uFoam, 0.0, 1.0));
        float lace = smoothstep(0.55, 0.8, slN(vP*1.4 - uTime*0.2))*exp(-r*0.22)*uFoam*(1.0 - uFoam)*2.0;
        float burst = exp(-r*r/(3.0 + 30.0*uBlow))*uBlow*(0.3 + 1.1*cut);
        float edge = 1.0 - smoothstep(10.0, 13.0, r);
        gl_FragColor = vec4(uCol*((ring*0.95 + spokes*0.3 + lace*0.5 + burst*0.75)*hollow*edge), 1.0); }` }));
  mesh.frustumCulled = false; mesh.renderOrder = 5; mesh.name = 'riser-foam';
  return { object: mesh, uniforms };
}

// ---------------------------------------------------------------- 3. the world
export default {
  id: 'standing-sleepers',
  name: 'The Standing Sleepers',
  category: 'ocean',
  weirdness: 0.05,
  media: ['underwater'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();

    // ================================================================= SEEDED CAST (each from its own fork)
    const hour = vary.hour || 'any', mr = rng.fork('mood')();
    const moodId = hour === 'golden' ? 'golden' : hour === 'day' ? 'noon' : hour === 'dawn' ? 'dawn' : hour === 'night' ? 'moon'
      : HOUR_SLOTS[Math.min(9, Math.floor(mr * 10))];
    const M = MOODS[moodId];
    const wr = rng.fork('weather')(), weather = wr < 0.45 ? 'chop' : wr < 0.66 ? 'glass' : 'squall';
    const cr = rng.fork('ceiling')(), ceiling = CEILING_SLOTS[Math.min(9, Math.floor(cr * 10))];
    const er = rng.fork('escort')(), escort = er < 0.5 ? 'whitetip' : er < 0.78 ? 'silkies' : 'manta';
    const castR = rng.fork('cast');
    const count = castR.pick([14, 14, 14, 12, 16, 13, 15, 11, 10]), headDown = castR.pick([2, 2, 2, 1, 3, 1, 0]), calves = castR.chance(0.28) ? 2 : 1;
    const rare = !!vary.rare;
    // a second generator for everything added after the first release, so none of the original seeded draws moves
    const rx = makeRng(hashSeed(ctx.seed + ':sleepers-2'));

    // ================================================================= SEA LIGHT (the kit sky is never drawn: it lights the water)
    const sky = makeSky(moodId === 'moon'
      ? { rng: rng.fork('sky'), preset: 'night', bodyOverrides: { 0: { elevation: M.elev, azimuth: SUN_AZ } }, clouds: { coverage: 0.28, softness: 0.3 } }
      : { rng: rng.fork('sky'), ...M.sky, sunElevation: M.elev, sunAzimuth: SUN_AZ, clouds: { coverage: weather === 'squall' ? 0.5 : 0.2, softness: 0.3 } });
    const L = Water.waterLight(sky);
    // the key light as it stands under water (refracted): unit vector TOWARD the sun
    const sunT = new THREE.Vector3();
    { const S = L.sunDir, h = Math.max(1e-4, Math.hypot(S.x, S.z)), sinT = Math.min(0.749, h / 1.333), cosT = Math.sqrt(1 - sinT * sinT);
      if (h < 0.02) sunT.set(-0.94 * 0.05, 1, 0.34 * 0.05).normalize(); else sunT.set((S.x / h) * sinT, cosT, (S.z / h) * sinT).normalize(); }
    const sunCol = new THREE.Color(M.sun), fillCol = new THREE.Color(M.fill), waterCol = new THREE.Color(M.water), deepCol = new THREE.Color(M.deep), deepFogCol = new THREE.Color(M.deepFog || M.deep);

    // ================================================================= HERO (local space == the brief's: at the origin)
    const hero = await buildHero(ctx, { palette: PALETTE, count, headDown, calves, sunDir: sunT, flexAt: 0.10, eyeAt: [0.355, 0.405], rollAt: [0.37, 0.46], calfAt: [0.405, 0.458] });
    hero.setLight({ sunDir: sunT, sunColor: sunCol, key: M.key, rim: M.rim, caustics: M.caustics, fadeDepth: M.fade,
      fill: fillCol.clone().multiplyScalar(moodId === 'moon' ? 0.8 : 1.15),
      deepFill: new THREE.Color(M.deepFill).multiplyScalar(12).add(new THREE.Color(0.1, 0.11, 0.12)), shade: new THREE.Color(M.slate[0], M.slate[1], M.slate[2]) });
    scene.add(hero.object);
    const A = hero.anchors;
    await ctx.yield();

    // ================================================================= PATH (the brief's 21 points with the eye pass tightened in the part; 179 m, last 40 m straight at 54 degrees)
    const path = makePath(A.flyThrough);

    // ================================================================= FOG (colour is reset from depth every frame in update)
    scene.fog = new THREE.FogExp2(waterCol.clone(), M.dens);
    scene.background = waterCol.clone();
    const hemi = new THREE.HemisphereLight(fillCol, deepCol, 0.9), keyLight = new THREE.DirectionalLight(sunCol, 1.5);
    keyLight.position.copy(sunT).multiplyScalar(60); scene.add(hemi, keyLight);

    // ================================================================= SEA (real ceiling with Snell's window, kit rays, plankton, one bubble thread)
    const blow = A.whales[3] ? A.whales[3].top : new THREE.Vector3(-3, -9, 30);
    const chop = weather === 'glass' ? { preset: 'calm', height: 0.07, detail: 0.3 } : weather === 'squall' ? { preset: 'breeze', height: 0.4, foam: 0 } : { preset: 'breeze', height: 0.28, foam: 0 };
    const sea = Water.makeSea({ rng: rng.fork('sea'), light: L, level: 0,
      ocean: { ...chop, radius: 520, windAngle: 0.35 },
      underwater: { water: M.water, deep: M.deep, fogDensity: M.dens, floorY: -70, sunDisc: 0.2, rayIntensity: M.kitRays * (weather === 'squall' ? 0.55 : 1),
        rays: { count: Math.round(56 * detail), range: 150, length: weather === 'glass' ? 60 : 46, width: weather === 'glass' ? 1.7 : 2.2 },
        particles: { count: Math.round(900 * detail * density), range: 36, size: 0.03, color: '#FFF1D0', glowColor: '#4FB4FF', glowFraction: M.glowFrac, glowIntensity: 2.4 },
        bubbles: false } });
    scene.add(sea.object);
    const backdrop = makeBackdrop(new THREE.Color(), M.inkLin ? new THREE.Color(M.inkLin[0], M.inkLin[1], M.inkLin[2]) : new THREE.Color(M.ink), sunT.clone().negate(), weather === 'squall' ? 0.3 : 0.45); scene.add(backdrop.object);
    await ctx.yield();

    // ================================================================= CEILING (veil, weed or log, jack wheel, runners)
    const veil = makeCeilingVeil({ sunT, winCol: new THREE.Color(M.win), warmCol: new THREE.Color(M.warm), sunCol, fogCol: scene.fog.color, coolCol: new THREE.Color(M.water).lerp(new THREE.Color(M.win), moodId === 'moon' ? 0.3 : 0.15), seaK: M.seaK }); scene.add(veil.object);
    if (weather === 'squall') { veil.uniforms.uRain.value = 1; veil.uniforms.uRainDir.value.set(0.25, 4, -0.968); }
    const weedLight = { sunT, sunCol, fill: fillCol, key: M.key * (moodId === 'moon' ? 0.7 : 1) };
    const wrr = rng.fork('weed'), clumps = [];
    let log = null;
    if (ceiling === 'weed') {
      for (const x of [59, 50, 41, 32, 23]) clumps.push({ x: x + wrr.range(-1.5, 1.5), z: 17.6 + 0.07 * (x - 40) + wrr.range(-0.8, 0.8), rx: wrr.range(4.4, 5.6), rz: wrr.range(1.7, 2.3), yaw: 0.07 + wrr.range(-0.12, 0.12), sprigs: 1.2, mats: 3, dens: 1 });
      for (const x of [63, 51, 39, 27]) clumps.push({ x: x + wrr.range(-1.5, 1.5), z: 29 + 0.07 * (x - 40) + wrr.range(-0.8, 0.8), rx: wrr.range(4.6, 6), rz: wrr.range(1.6, 2.2), yaw: 0.07 + wrr.range(-0.12, 0.12), sprigs: 0.8, mats: 3, dens: 1 });
      clumps.push({ x: 17, z: 42, rx: 2.2, rz: 1.6, yaw: wrr.range(0, 3), sprigs: 0.3, mats: 2, dens: 0.9 }, { x: 44, z: -4, rx: 2.6, rz: 1.5, yaw: wrr.range(0, 3), sprigs: 0.3, mats: 2, dens: 0.9 },
        { x: -9, z: 46, rx: 3, rz: 1.8, yaw: wrr.range(0, 3), sprigs: 0.25, mats: 2, dens: 0.9 });
    } else if (ceiling === 'log') {
      clumps.push({ x: 40, z: 19.6, rx: 3.3, rz: 0.75, yaw: 0.3, sprigs: 1, mats: 2, dens: 0.85 }, { x: 27, z: 27, rx: 2.4, rz: 1.5, yaw: 1, sprigs: 0.5, mats: 2, dens: 0.9 });
      log = makeLog(wrr, weedLight); log.object.position.set(40, -0.12, 19.6); log.object.rotation.y = -0.3; scene.add(log.object);
    }
    const weed = clumps.length ? makeWeed(wrr, clumps, { ...weedLight, count: Math.round((ceiling === 'weed' ? 820 : 240) * detail * density) }) : null;
    if (weed) scene.add(weed.object);
    await ctx.yield();

    const faunaLight = { sunDir: sunT.clone(), sunColor: M.sun, sunIntensity: moodId === 'moon' ? 1.6 : 2.5, sky: M.fill, skyIntensity: 1.1, ground: M.deep, groundIntensity: 1.0 };
    const fauna = F.makeFauna(scene, { light: faunaLight });
    // the jack wheel: 900 horse-eye jacks turning as one under the ceiling, ahead-right of the entry
    const jacks = fauna.add(F.makeFishSchool({ rng: rng.fork('jacks'), species: 'sardines', count: Math.round(900 * Math.min(1, density) * (0.5 + 0.5 * detail)), size: 2.25, lod: 'low', light: { ...faunaLight, sunColor: '#FFF4E2', sky: '#DDE8EC', skyIntensity: 1.5 },
      center: [37, -3.5, 7.5], radius: 1.2, height: 0.3, spread: [3.5, 1.55], spin: 0.8, top: '#51636B', belly: '#F2F6F6', fin: '#C9B25A' }));
    // from the deep the wheel is a shoal of dark specks on the window, not a disc of bright dots: its light is dimmed in update()
    const jackU = jacks && jacks.uniforms && jacks.uniforms.uSunColor && jacks.uniforms.uSkyColor && jacks.uniforms.uGroundColor
      ? [jacks.uniforms.uSunColor, jacks.uniforms.uSkyColor, jacks.uniforms.uGroundColor].map((un) => ({ un, base: un.value.clone() })) : [];
    const jackGeo = jacks && jacks.geometry && jacks.geometry.isInstancedBufferGeometry ? jacks.geometry : null, jackN = jacks ? jacks.count : 0;
    // rainbow runners and juvenile jacks sheltering under the weed (or the log)
    fauna.add(F.makeFishSchool({ rng: rng.fork('runners'), species: 'mackerel', count: 22, size: 0.8, light: faunaLight, center: [39, -1.9, 26.5], radius: 4.5, height: 0.4, spread: [1.5, 0.5, 7], speed: 1.5,
      top: '#2B6FA0', belly: '#F0E08C', fin: '#E8C84A' }));

    // ================================================================= LIGHT SHAFTS (fx: gold through the ring and over the entry)
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    // WORKAROUND (kit): fx.makeGodRays gives every shaft a hard start and fades it in over its first tenth, so under a
    // ceiling a shaft reads as a plank: with its source at the surface the top is a soft cut hanging 4 m down in the
    // water; with the source lifted clear of the surface it is a hard cut on the far ceiling, which the haze hides, so the
    // cut floats in mid-water. Lengthening the shaft to soften the top trips the kit's end-on fade (it is keyed to the
    // shaft's midpoint). The shafts are therefore this world's own (makeShafts): lit from the ceiling down, hazed with
    // distance, thinned with camera depth in update() so none is seen as a slab from under the henge.
    const lean = Math.min(1.2, Math.hypot(sunT.x, sunT.z) / Math.max(0.3, sunT.y)), sy = Math.max(0.6, sunT.y);
    const ringZ = weather === 'squall' ? 16 : 6, ringR = weather === 'squall' ? 22 : 30, glassK = weather === 'glass' ? 0.68 : 1;
    const mx = A.matriarch.axis.x, mz = A.matriarch.axis.y, shaftCol = new THREE.Color(M.ray);
    const shaftSet = (label, cx, cz, back, o, r = rng) => ({ rng: r.fork(label), x: cx + sunT.x * lean * back, z: cz + sunT.z * lean * back, color: shaftCol, ...o });
    const shafts = makeShafts([
      shaftSet('rays-ring', 0, ringZ, 14, { radius: ringR, count: 16, reach: 44, width: 1.25 * glassK, intensity: 0.52 * M.rayK }),
      shaftSet('rays-entry', 30, 21, 6, { radius: 15, count: 10, reach: 36, width: 1.0 * glassK, intensity: 0.8 * M.rayK }),
      shaftSet('rays-pass', mx - 5, mz - 1, 12, { radius: 12, count: 9, reach: 42, width: 1.05, intensity: 0.56 * M.rayK }),
      shaftSet('rays-deep', -8, 34, 30, { radius: 30, count: 10, reach: 64, width: 2.0, color: shaftCol.clone().lerp(new THREE.Color(M.fill), 0.6), intensity: 0.2 * M.rayK, cls: 1 }),
      // the henge's own: broad shafts that stand in the ring between us and the far sleepers, lit only for the view from below
      shaftSet('rays-henge', 0, weather === 'squall' ? 12 : 4, 20, { radius: 27, count: 14, reach: 58, width: 1.7, color: shaftCol.clone().lerp(new THREE.Color(M.warm), 0.35), intensity: 0.5 * M.rayK, cls: 2 }, rx),
    ], { dir: new THREE.Vector3(-sunT.x, -sunT.y, -sunT.z), sy, width: [0.8, 2.7], haze: 48, absorb: M.absorb });
    scene.add(shafts.object);

    // ================================================================= DRIFT (flakes of shed skin tumbling, salps, marine snow; at night blue sparks and glowing kit plankton)
    set.add(fx.makeParticles({ rng: rng.fork('flakes'), preset: 'ash', time, count: Math.round(500 * detail * density), box: [26, 18, 26], velocity: [0.05, -0.07, 0.03], velocityRandom: [0.07, 0.05, 0.07],
      turbulence: [0.25, 0.15, 0.4], size: [0.018, 0.06], colors: ['#E9E4D8', '#CFC8B6', '#F4E2B8'], lightDir: [sunT.x, sunT.y, sunT.z], near: [0.4, 1.6] }));
    set.add(fx.makeParticles({ rng: rng.fork('salps'), preset: 'bubbles', time, count: Math.round((ceiling === 'bare' ? 170 : 110) * detail * density), box: [34, 22, 34], velocity: [0.05, 0.012, 0.03], velocityRandom: [0.05, 0.03, 0.05],
      turbulence: [0.2, 0.1, 0.3], size: [0.05, 0.13], near: [0.5, 2] }));
    // marine snow: the lit drift that keeps the deep half of the flight alive
    set.add(fx.makeParticles({ rng: rng.fork('snow'), preset: 'dust', time, count: Math.round(800 * detail * density), opacity: 0.7, box: [32, 24, 32], velocity: [0.05, -0.09, 0.03], velocityRandom: [0.08, 0.06, 0.08],
      turbulence: [0.35, 0.25, 0.45], size: [0.025, 0.085], colors: ['#DDE8EC', '#FFF1D0', '#BCD3E2'], near: [0.5, 2] }));
    // a second, brighter field for the deep half only (faded in below 26 m in update): the dark water under the henge is never empty
    const deepSnow = fx.makeParticles({ rng: rng.fork('snow-deep'), preset: 'dust', time, count: Math.round(700 * detail * density), opacity: 0.95, intensity: 1.5, box: [40, 26, 40], velocity: [0.04, -0.08, 0.03], velocityRandom: [0.07, 0.05, 0.07],
      turbulence: [0.3, 0.2, 0.4], size: [0.03, 0.11], colors: ['#DDE8EC', '#FFF1D0', '#C8DCEA'], near: [0.6, 2.4] });
    deepSnow.setOpacity(0); set.add(deepSnow);
    // the bubble thread from one blowhole: a few bright bubbles in a column half a metre wide (the kit's vent column is
    // 3 m wide and reads as a disc of dots when seen end-on from below)
    set.add(fx.makeParticles({ rng: rng.fork('thread'), preset: 'bubbles', time, follow: false, center: [blow.x - 0.4, blow.y * 0.5, blow.z + 0.3], box: [0.45, Math.max(2, -blow.y - 0.6), 0.45],
      count: 14, size: [0.05, 0.12], velocity: [0, 0.5, 0], velocityRandom: [0.03, 0.15, 0.03], turbulence: [0.12, 0.05, 0.12] }));
    if (moodId === 'moon') {       // full-moon night: blue sparks of bioluminescence where the calf swims and where the gate flukes flex
      const cp = A.calfRoute[A.calfRoute.length - 1], sparkCols = ['#4FB4FF', '#7FD8FF', '#3C7CFF'];
      set.add(fx.makeParticles({ rng: rng.fork('sparks'), preset: 'plankton', time, follow: false, center: [cp.x, cp.y - 1, cp.z], box: [14, 12, 14], count: Math.round(380 * detail), colors: sparkCols, size: [0.04, 0.1], intensity: 3 }));
      set.add(fx.makeParticles({ rng: rng.fork('sparks2'), preset: 'plankton', time, follow: false, center: [A.gate.a.x, A.gate.a.y - 1, A.gate.a.z], box: [9, 6, 9], count: Math.round(200 * detail), colors: sparkCols, size: [0.04, 0.1], intensity: 3 }));
    }
    await ctx.yield();

    // ================================================================= ESCORT (crosses the camera's right side, going the other way, at u 0.6)
    // The kit's `cross` lays its route from a path position and tangent. The camera is looking up at the henge here, not
    // along its own path, so the route is laid from a stand-in path: one point in the gaze (7 m out, right of centre at
    // u 0.55) and one heading (against our travel, across the frame from lower right to upper left).
    const escAt = new THREE.Vector3(-13.5, -27.0, 36.0), escDir = new THREE.Vector3(-0.96, 0, -0.28).normalize();
    const escPath = (dOut) => ({ length: 1, posAtDist: (d, out) => out.copy(escAt).addScaledVector(escDir, -dOut), tangentAtDist: (d, out) => out.copy(escDir) });
    const cross = { path: escPath(0), u: ESCORT_U, lead: 0, angle: 0, side: 1, offset: 0, height: 0, bow: 0, rise: 3, span: 64, duration: DUR };
    // at 28 m the gold has gone: the escort is lit blue-silver from above, with the deep as its bounce
    // (fauna.add relights whatever it is given with the group's light unless it is passed one: pass it there)
    // (fins are flat vertical fans: with a near-vertical key and the deep as bounce they came out as black cut-outs, so the
    //  key leans further toward the sun and the sky and bounce are stronger and bluer)
    const deepLight = { sunDir: new THREE.Vector3(sunT.x * 0.8, 1, sunT.z * 0.8).normalize(), sunColor: '#' + new THREE.Color(M.sun).lerp(new THREE.Color(M.fill), 0.6).lerp(new THREE.Color(M.water), 0.45).getHexString(),
      sunIntensity: moodId === 'moon' ? 1.3 : 1.7, sky: '#' + new THREE.Color(M.fill).lerp(new THREE.Color(M.water), 0.45).getHexString(), skyIntensity: 1.6,
      ground: '#' + new THREE.Color(M.deep).lerp(new THREE.Color(M.water), 0.5).lerp(new THREE.Color(M.fill), 0.45).getHexString(), groundIntensity: 3.0 };       // lower fins and undersides face down: a tone under the body, never black
    let lead = null;
    if (escort === 'whitetip') {
      lead = fauna.add(F.makeShark({ rng: rng.fork('whitetip'), length: 2.8, speed: 1.9, light: deepLight, top: '#5C6C7A', belly: '#E6EEF2', fin: '#F2F6F6', cross }), { light: deepLight });
      fauna.add(F.makeFishSchool({ rng: rng.fork('pilots'), species: 'mackerel', count: 5, size: 0.72, light: deepLight, spread: [0.55, 0.35, 0.8], speed: 1.9, wander: [0.12, 0.1, 0.12, 1.4],
        top: '#1E242A', belly: '#DCE4E8', fin: '#E8ECEE', cross: { ...cross, u: ESCORT_U - 0.02, height: 0.3 } }), { light: deepLight });
    } else if (escort === 'silkies') {
      lead = fauna.add(F.makeShark({ rng: rng.fork('silkies'), count: 3, length: 2.5, speed: 2.1, spread: [2.2, 1.6, 5], light: deepLight, top: '#586878', belly: '#DDE8EE', fin: '#93A3B0', cross: { ...cross, path: escPath(1.5) } }), { light: deepLight });
    } else {
      // (it crosses beside the portal, a little under its sight line, with a pale belly and grey head fins)
      lead = fauna.add(F.makeMantaRay({ rng: rng.fork('manta'), span: 2.7, speed: 1.6, light: deepLight, top: '#46566A', belly: '#D5E0E8', fin: '#8496A6', cross: { ...cross, path: escPath(-5), height: -1.2 } }), { light: deepLight });
    }

    // ================================================================= RARE (ctx.vary.rare): a sleeper across the ring wakes, rises, blows and sinks
    let riser = null;
    if (rare) {
      let best = null, bd = 1e9;
      for (const w of hero.sleepers) { if (w.headDown || w.role !== 'sleeper') continue; const d = Math.hypot(w.x + 30, w.z + 2); if (d < bd) { bd = d; best = w; } }
      if (best) {
        const foam = makeRiser(); foam.object.position.set(best.x, -0.1, best.z); scene.add(foam.object);
        const col = fx.makeParticles({ rng: rng.fork('blow'), preset: 'bubbles', time, follow: false, center: [best.x, -6.5, best.z], box: [3.0, 13, 3.0], count: 280, size: [0.07, 0.26], intensity: 2.2 });
        col.setOpacity(0); set.add(col);
        riser = { w: best, base: best.pivotY, lift: best.top + 0.35, foam, col, top: new THREE.Vector3(best.x, -4, best.z) };
      }
    }

    // ================================================================= THE WHEEL IN THE HENGE, AND COMPANY (all from rx)
    // The jack wheel of the entry cannot be read from 40 m down (nine hundred half-metre fish are pixel dashes), so it is
    // hidden from below (update) and the henge has its own: big jacks, a metre long, streaming nose to tail round a loop
    // 25 m wide that circles the portal. From under the henge it is a turning ring of fish between
    // the portal and the standing sleepers, never across the portal; the camera climbs through its middle. Its high side
    // passes 7 m from the path where we cross the ring at u 0.2-0.3, so the first half has fish going by as well.
    // (the loop's plane leans 20 degrees from the last straight toward where the camera rounds the matriarch's flukes, and
    //  sits 5 m in front of the portal: from every camera position after u 0.46 the portal is seen through the middle of the
    //  ring, at least 6 degrees clear of the fish)
    const hN = new THREE.Vector3(-0.2517, -0.582, 0.7733).normalize(), hE = new THREE.Vector3().crossVectors(hN, new THREE.Vector3(0, 1, 0)).normalize(), hF = new THREE.Vector3().crossVectors(hN, hE);
    const hC = A.portalSeat.position.clone().addScaledVector(hN, 5);
    const wheelPts = [], w1 = rx.range(0, 6.283), w2 = rx.range(0, 6.283);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2, r = 12.6 + 0.9 * Math.sin(a * 2 + w1) + 0.5 * Math.sin(a * 3 + w2), q = hC.clone().addScaledVector(hE, Math.cos(a) * r).addScaledVector(hF, Math.sin(a) * r).addScaledVector(hN, 0.9 * Math.sin(a * 3 + w1));
      wheelPts.push([q.x, q.y, q.z]);
    }
    // lit for the view from below: a pale key from the sun's side so flanks flash as they turn, strong bounce so no fish is a black dash
    const wheelLight = { sunDir: new THREE.Vector3(sunT.x * 1.3, 0.55, sunT.z * 1.3).normalize(), sunColor: '#' + new THREE.Color(M.sun).lerp(new THREE.Color(M.fill), 0.35).getHexString(), sunIntensity: moodId === 'moon' ? 1.2 : 1.6,
      sky: '#' + new THREE.Color(M.fill).lerp(new THREE.Color(M.water), 0.3).getHexString(), skyIntensity: 1.1, ground: '#' + new THREE.Color(M.water).lerp(new THREE.Color(M.fill), 0.4).getHexString(), groundIntensity: 1.4 };
    fauna.add(F.makeFishSchool({ rng: rx.fork('wheel'), species: 'mackerel', count: Math.round(190 * Math.min(1.15, density) * (0.6 + 0.4 * detail)), size: 2.4, speed: 1.9, lod: 'mid', light: wheelLight,
      spread: [2.2, 1.7, 54], wander: [0.3, 0.3, 0.3, 0.6], route: wheelPts, closed: true, start: rx(), top: '#5A6E7C', belly: '#B4C2CC', fin: '#C9B25A', spec: 2.6 }), { light: wheelLight, always: true });
    // rainbow runners that keep us company down the pass (u 0.29-0.47), out in the open water on our right (with the steady
    // camera, which looks down the path and not at her, they are what fills the frame beside the calf)
    fauna.add(F.makeFishSchool({ rng: rx.fork('company'), species: 'mackerel', count: 9, size: 1.5, speed: 3.6, light: faunaLight, spread: [1.9, 1.2, 4.5], wander: [0.3, 0.25, 0.3, 1.1],
      top: '#2B6FA0', belly: '#E4E2BC', fin: '#E8C84A', along: { path, side: 3.4, up: -0.8, lead: 8, from: 0.28, to: 0.47, drift: 1.2 } }), { light: faunaLight });
    // the calf's own attendants: a dozen young pilot fish idling round it wherever it goes (a pond school whose centre is moved in update)
    const attendLight = { ...wheelLight, skyIntensity: 2.2, groundIntensity: 2.4 };       // they are seen from every side, mostly from the shade: lit all round
    const pilots = fauna.add(F.makeFishSchool({ rng: rx.fork('attend'), species: 'mackerel', form: 'pond', count: 10, size: 1.3, speed: 0.9, light: attendLight, spread: [2.3, 0.9], center: [A.calfRoute[0].x, A.calfRoute[0].y, A.calfRoute[0].z],
      top: '#93A096', belly: '#F2E6A8', fin: '#E8C84A' }), { light: attendLight, always: true });
    const pilotC = pilots && pilots.uniforms && pilots.uniforms.uCenter ? pilots.uniforms.uCenter.value : null, pilotV = new THREE.Vector3();
    await ctx.yield();

    // ================================================================= PORTAL DRESSING (the altar of the henge)
    const halo = makePortalHalo('#FFD890');
    halo.object.position.copy(A.portalSeat.position).addScaledVector(A.portalSeat.normal, -0.15);
    halo.object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), A.portalSeat.normal);
    scene.add(halo.object);

    // ================================================================= POIS (two, each with a target that travels with u, so the gaze never snaps)
    //   her: the eye (to u 0.41), then down her wrinkled flank to the calf as it comes round her and noses her belly: the
    //        target is halfway between the live calf and the place on her belly where it settles (0.458), so both stay in frame
    //   henge: out under her flukes and her neighbour's (0.50, where the escort crosses), then up to the middle of the ring (0.63 on)
    const eyeV = new THREE.Vector3(), herV = new THREE.Vector3(), hengeV = new THREE.Vector3();
    const calfV = new THREE.Vector3(), calfRestV = A.calfRoute[A.calfRoute.length - 1].clone(); calfRestV.y -= 0.5;
    const underV = new THREE.Vector3(-9, -21, 27), ringV = new THREE.Vector3(0, -7, -3);
    const pois = [
      { at: (tm, uu) => herV.copy(hero.eyeWorld(eyeV)).lerp(hero.calfWorld(calfV).lerp(calfRestV, 0.5), smoothstep(0.41, 0.445, uu)), from: 0.33, to: 0.53, weight: 0.95, fade: 0.25 },
      { at: (tm, uu) => hengeV.copy(underV).lerp(ringV, smoothstep(0.5, 0.63, uu)), from: 0.465, to: 0.86, weight: 0.96, fade: 0.11 },
    ];
    if (riser) pois.push({ at: riser.top, from: 0.19, to: 0.31, weight: 0.4 });

    const fogTop = new THREE.Color(), fogDeep = new THREE.Color(), _pd = new THREE.Vector3(), _cd = new THREE.Vector3(), camP = new THREE.Vector3();
    let portalGroup = null;
    const findPortal = (sc) => { for (const c of sc.children) { let hit = false; c.traverse((o) => { if (o.material && o.material.uniforms && o.material.uniforms.uReveal && o.material.uniforms.uNear) hit = true; }); if (hit) return c; } return null; };
    return {
      scene, path, duration: DUR, title: M.title,
      camera: { fov: 58, near: 0.3, far: 600, lookAhead: 9, sway: 0.3, bank: 0.4 },
      pois,
      portal: { shape: 'circle', radius: 6, color: '#FFE7B0', glow: 1, revealDistance: 104, tilt: true },
      // ================================================================= POST (exposure, bloom and grade per mood)
      post: { exposure: M.exposure, bloom: { strength: 0.35, radius: 0.6, threshold: 0.95 },
        grade: { saturation: M.sat, contrast: 1.05, tint: M.tint, shadowTint: M.shadow, vignette: 0.35, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update(dt, time_, camera, u) {
        const t = time_; time.value = t;
        camera.getWorldPosition(camP);          // never camera.position: behind a portal the matrix is set directly
        // staged: the rare riser moves its sleeper before the pod lays out its matrices
        if (riser) {
          const up = smoothstep(0.18, 0.25, u) * (1 - smoothstep(0.285, 0.36, u));
          riser.w.pivotY = riser.base + riser.lift * up;
          riser.foam.uniforms.uTime.value = t;
          riser.foam.uniforms.uFoam.value = clamp((u - 0.235) / 0.11, 0, 1);
          riser.foam.uniforms.uBlow.value = smoothstep(0.243, 0.258, u) * (1 - smoothstep(0.27, 0.315, u));
          riser.col.setOpacity(smoothstep(0.235, 0.26, u) * (1 - smoothstep(0.4, 0.47, u)));
          riser.top.y = -Math.max(1.5, riser.w.top * (1 - up));
        }
        hero.setProgress(u); hero.update(dt, t, camera);
        // WORKAROUND: the engine adds its portal to this scene unfogged and visible from the first frame, so from the entry
        // it glares through 55 m of water as a tilted ellipse. Keep it dark until the matriarch pass, and switch it on
        // while it is far outside the frame (it then opens with the halo as the gaze lifts to the henge at u 0.5).
        if (!portalGroup) portalGroup = findPortal(scene);
        if (portalGroup) {
          portalGroup.visible = u >= 0.42;       // at u 0.42 the gaze is on her flank, 85 degrees away from the ring's centre
        }
        // sea, then the FOG override: water blue under the ceiling, deep blue at 46 m
        sea.update(dt, t, camera, scene);
        const depth = clamp(-camP.y, 0, 60), kd = smoothstep(9, 46, depth) * 0.85;
        const vol = sea.underwater.volumeColor, kv = vol.g / Math.max(1e-4, waterCol.g);
        fogTop.copy(vol).multiplyScalar(M.gain); fogDeep.copy(deepFogCol).multiplyScalar(kv * M.gain * 1.5);
        if (M.fogTop) { fogTop.setRGB(M.fogTop[0], M.fogTop[1], M.fogTop[2]); fogDeep.setRGB(M.fogDeep[0], M.fogDeep[1], M.fogDeep[2]); }
        scene.fog.color.copy(fogTop).lerp(fogDeep, kd); scene.fog.density = M.dens;
        // (moon) the kit's own volume colour also paints the mirror outside Snell's window and the far underside of the sea:
        // it is the same Color object the ocean reads, and the kit resets it every update, so it is set here each frame
        if (M.fogTop) vol.copy(scene.fog.color);
        if (scene.background && scene.background.isColor) scene.background.copy(scene.fog.color);
        backdrop.uniforms.uFog.value.copy(scene.fog.color); backdrop.uniforms.uTime.value = t; backdrop.object.position.copy(camP);
        veil.uniforms.uLift.value = smoothstep(26, 42, depth) * (1 - smoothstep(0.74, 0.84, u)); deepSnow.setOpacity(smoothstep(22, 36, depth));
        // ceiling veil: the window glows more the deeper we are, the sun halo fades
        veil.object.position.x = camP.x; veil.object.position.z = camP.z;
        veil.uniforms.uTime.value = t;
        // THE HENGE VIEW: with depth (and all the way up the final climb) the veil becomes a luminous pewter window that
        // reaches down behind the far sleepers, the pod turns to slate with gold caps, and the shafts thin away.
        const climb = smoothstep(0.7, 0.8, u), viewK = Math.max(smoothstep(12, 40, depth), 0.8 * climb);
        veil.uniforms.uWin.value = M.winK * viewK;
        veil.uniforms.uSpread.value = Math.max(smoothstep(16, 42, depth), 0.85 * climb);
        veil.uniforms.uHalo.value = M.haloK * (1 - 0.7 * smoothstep(8, 40, depth));
        veil.uniforms.uShade.value = M.shade * viewK * (1 + 0.45 * climb);
        const deepView = Math.max(smoothstep(24, 40, depth), climb);
        // the sea from the deep: the veil's lit, rippling underside with the sun's spokes, the pod raked warm from the sun's
        // side, and the henge's own broad shafts standing in the ring (all in by 38 m, held up the whole climb)
        const seaView = Math.max(smoothstep(20, 38, depth), climb), wet = weather === 'squall' ? 0.6 : 1;
        const veilSea = Math.max(smoothstep(12, 28, depth), climb);       // the ceiling itself turns sooner: from 20 m down any look up finds it lit
        veil.uniforms.uSea.value = veilSea; veil.uniforms.uRays.value = M.seaRays * veilSea * wet * (1 - 0.5 * smoothstep(0.9, 0.99, u));
        hero.setLight({ deep: deepView, rake: M.rake * seaView });
        const shaftK = (1 - smoothstep(24, 38, depth)) * (1 - 0.75 * smoothstep(0.62, 0.7, u));
        shafts.uniforms.uTime.value = t; shafts.uniforms.uK.value = shaftK; shafts.uniforms.uKDeep.value = Math.max(shaftK * (1 - smoothstep(0.56, 0.64, u)), 0.3 * seaView * (1 - smoothstep(0.72, 0.8, u)));
        shafts.uniforms.uKHenge.value = seaView * wet * (1 - smoothstep(0.86, 0.97, u));
        if (sea.underwater.rays) sea.underwater.rays.material.uniforms.uRayColor.value.multiplyScalar(0.12 + 0.88 * shaftK);   // the kit resets this colour every update
        const jackDeep = Math.max(smoothstep(13, 28, depth), climb), jackK = 1 - 0.88 * jackDeep;
        for (const j of jackU) j.un.value.copy(j.base).multiplyScalar(jackK);
        // ... and nine hundred half-metre fish 50 m up are a disc of pixel-sized dashes: as the view deepens the wheel
        // thins away (the gaze is on the matriarch while it does)
        if (jackGeo) jackGeo.instanceCount = Math.max(1, Math.round(jackN * (1 - 0.97 * jackDeep)));
        if (weed) { weed.uDeepA.value = Math.max(smoothstep(10, 26, depth), climb); weed.uTime.value = t; const H = weed.uH.value; for (let i = 0; i < weed.clumps.length; i++) H[i] = sea.heightAt(weed.clumps[i].x, weed.clumps[i].z, t); }
        if (log) { log.uTime.value = t; log.object.position.y = sea.heightAt(40, 19.6, t) - 0.14; log.object.rotation.x = 0.12 * Math.sin(t * 0.31); log.object.rotation.z = 0.03 * Math.sin(t * 0.43 + 1); }
        if (pilotC) {       // the calf's attendants hold a place just off its far side and below, never between it and us
          hero.calfWorld(pilotV); pilotC.set(pilotV.x - 0.6, pilotV.y - 1.5, pilotV.z + 1.3);
          if (pilots.bounds && pilots.bounds.center) pilots.bounds.center.copy(pilotC);
        }
        fauna.update(dt, t, camera, u);
        // ... and from far below the last of the wheel is put away altogether: the henge has its own fish (see THE WHEEL)
        if (jacks && jacks.object && jackDeep > 0.9) jacks.object.visible = false;
        set.update(dt, t, camera);
        halo.uniforms.uTime.value = t;
        halo.uniforms.uKindle.value = smoothstep(0.46, 0.6, u) * (1 - 0.6 * smoothstep(0.76, 0.92, u)) * (0.8 + 0.2 * Math.sin(t * 1.7));
      },
      dispose() {
        sky.object.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
        if (sky.dispose) sky.dispose();
      },
    };
  },
};
