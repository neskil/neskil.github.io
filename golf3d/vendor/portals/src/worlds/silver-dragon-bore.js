// THE SILVER DRAGON. Song-dynasty Hangzhou, mid-autumn: from a tide-rider's sampan we meet the Qiantang bore and
// surf it upstream to the city's water gate under the thirteen-eaved pagoda.
//
// The flight (hero space is world space: gate threshold at the origin, gate faces +Z, the bore runs toward -Z).
// planFlight() builds the line and the bore's timetable together:
//   opening   low and slow, downriver: a lit junk close on the bow's right, more at anchor beyond, fishing stakes and
//             gulls close by, a white thread across the horizon dead ahead; the eye goes forward in the boat (nothing of
//             her in the frame) while the thread grows
//   the wall arrives   a slow right-hand curve keeps us facing it as it grows into a glassy jade wall with a curling
//             lip that towers over the bow; a gaze point sits on the front until the crest takes us (three times over, so
//             that a steady camera, which takes a third of each, also keeps the wall across the frame) and runs down the
//             wall as it arrives, so it stands obliquely across the frame; a tide-rider comes down the face right in front
//             of the bow and the big lit junk rears on the face to his right, the lip thrown its furthest (uReach)
//   the catch a tight right-hand wheel: the wave lifts the sampan at the top of the turn and the pace lets go (1.25)
//   the surf  99 m diagonally across the face toward the wall, tide-riders in lanes of their own; the plume and a big
//             lantern-lit junk we pass close under stand ahead
//   the cutback   20 m short of the wall line we carve right through 118 degrees, down the face and out onto the calm
//             river, then run 75 m at 27 degrees to the front: the wall of water stands across the RIGHT half of the frame
//             for both cameras (the route does it, the gaze points only help), over a junk it is about to lift and a
//             rider; then left again through 125 degrees: a lit junk close on the right as the gaze comes round, a rider
//             of our own lane leading us 23 m ahead through the turn, gulls and a stake line inside it, then the wave on
//             our left again with a second junk right at its foot, which it lifts over us as we pass close under her
//   the wall  the wave catches us and we run in beside the fish-scale seawall, plume alongside over parasols, banners,
//             pavilions and kites
//   the gate  straight in. Along the last of the wall we climb onto the lip and ride it (eye level with the promenade, the
//             gate and the portal clear over the face, the white water heaped against the stone on our left); then the
//             wave runs ahead of us, piles into the gate arch a second before we do and pours through the portal, while
//             the sampan drops away under the eye
// The bore is not on a clock: its place is a table over u (a constant-speed run-in solved from the pace, then locked
// to the camera), so the wall lands on the same metre of the line whatever the frame rate or pace.
//
// Vehicle (ride: 'none'): a sampan bow at the bottom edge, two bamboo poles and red silk pennants at the far left and
// right. The poles, their spar, pennants and lanterns are a rig of their own that stays astern of the eye, out of the
// frame, for the first half of the flight (round the opening views they stood like the border of a pane): only the bow
// shows there. The rig comes into the frame for the gate, with the left pennant streaming in and the right one out.
// The eye moves in the boat: amidships as we set out and again as the wall towers over the bow and for the gate
// (bow, spar, poles, lanterns); right in the bow while the thread grows and from the first run across the face to the end
// of the seawall (nothing of the boat in the frame), so the stills of a visit are not all framed by the same prow.
// They follow the camera's yaw (from the bow: the boat's own course) but stay level, ride the real water under the camera, pitch with the face,
// flutter with speed and swing round with the wind as the boat turns. Hidden (sunk and shrunk) while u is 0; over the first
// fiftieth of the route it glides in from astern, under the eye, so the bow enters at the bottom edge and never surfaces.
//
// Reflections (one draw, REFL_*): the junks' sails by day, lamp light at dusk and by night (junk cabins, the lanterns of
// the wall, drifting lamps, the portal itself) lie on the calm water as broken streaks aimed at the camera of the frame.
//
// Looks by seed: jade afternoon / golden silt tide (low sun) / festival under the mid-autumn moon (lanterns, sky
// lanterns). ctx.vary.hour overrides the hour (day, golden, dawn, night). Inside one look the visits differ too: every
// junk is moved from its berth by seed and a few of the far ones are away, the cumulus are 7 to 14, the kites change
// colours. Rare: the crossing tide (a second oblique
// front, a taller plume) with a whole fleet of tide-riders on the face. That second wave is met before the bore (its
// meeting point with the bore is set by crossAt so that it sweeps under the eye while the wall is still 50 m off):
// the route carries the eye over its crest (the sampan stays low in the frame), it joins the bore to our right in a V, and
// after the catch its crest runs obliquely ahead of the bow until the two fronts close at the seawall.
// THE KIT'S FLOCKS, the cure of a fault in live (the owner's rule texts R, T and U): two of the five calls could come within 2.0 m of our line, both escorts, and both are laid anew by their own numbers (no keepClear, nothing added at the build). The egrets along our line (egrets-b; the line form, where maxSigma holds nothing): the species' own wander 0.4, 0.35, 0.4 written out and the course 7 m over our line (was 5.5). The gulls put up by the crest (a loose flock): spread 20, 3, 26 (live 20, 5, 26), wander 2, 1.2, 2, maxSigma 3 and the course 10.2 m over our line (was 3.4), so that the box of three scatters with the wander and the largest body stays 2.3 m clear of the line on every deal.
// The swifts round the pagoda pass and only have the species' own wander 9, 5, 8 written out, as the kit took it; the two crossing lines of egrets (egrets-a, egrets-c: the line form with the flamingos' own small wander) pass and are not touched.
// Least from the flown line on forty seeds, in the order of the calls: 2.60 (as live), 2.47 (live 1.00), 3.12 (as live), 35.32 (as live) and 3.07 m (live: touching, the eye too); from the eye the egrets along our line 21.03 and the gulls 3.32 m. The count rests on maxSigma in live's kit.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng } from '../kit/core.js';
import { makeSky, makeLightRig, makeCloudField } from '../kit/sky.js';
import * as S from '../kit/structures.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, BORE_GLSL } from '../parts/silver-dragon-bore.js';

const DEG = Math.PI / 180;
const C = (h) => new THREE.Color(h);

// ---------- looks ----------
const HOURS = {
  day: {
    sky: { preset: 'day', zenith: '#2a66bd', horizon: '#bdd4e7', horizonPow: 3.4, sunElevation: 35, sunAzimuth: 165, sunColor: '#fff4dc', scatter: 0.26,
      clouds: false, clouds2: false,      // (the brief's clear afternoon: the streak layer lay across the upper half of the frame as broad smeared ribbons)
      lightColor: '#fff1d6', lightIntensity: 3.1, ambientColor: '#9fb6e6', groundLight: '#56624e', ambientIntensity: 1.3 },
    hero: { sunColor: '#fff1d6', sunIntensity: 3.0, sky: [0.52, 0.59, 0.79], ground: [0.156, 0.175, 0.133], zenith: '#3f78c9', horizon: '#c4d9ec' },
    fog: '#bdd4e7', density: 0.0007, exposure: 1.0, lamp: 0, ridge: '#4d6f63', ridgeLit: '#7f9a78', haze: '#b6cde0', cloud: 1.34,
    grade: { saturation: 1.1, contrast: 1.06, tint: '#fffdf8', shadowTint: '#05101c' }, bloom: 0.34, portal: '#fff0c8', title: 'The Silver Dragon',
  },
  golden: {
    sky: { preset: 'goldenHour', zenith: '#2c3f86', horizon: '#f2b98a', sunElevation: 11, sunAzimuth: -50, sunColor: '#ffc27a',
      clouds: false, clouds2: { coverage: 0.16, stretch: 1, opacity: 0.25, scale: 0.9, lit: '#ffd0a0', shade: '#8a6a8c' },
      lightColor: '#ffb070', lightIntensity: 3.0, ambientColor: '#8f8cc8', groundLight: '#5a4640', ambientIntensity: 1.1 },
    hero: { sunColor: '#ffb070', sunIntensity: 2.8, sky: [0.46, 0.44, 0.6], ground: [0.09, 0.07, 0.07], zenith: '#2b3a7e', horizon: '#f0b080' },
    fog: '#e6b592', density: 0.00088, exposure: 1.04, lamp: 0.55, ridge: '#5b4a5a', ridgeLit: '#b07a5a', haze: '#e9b796', cloud: 1.34,
    grade: { saturation: 1.1, contrast: 1.07, tint: '#fff6ea', shadowTint: '#0a0a1e' }, bloom: 0.3, portal: '#ffd9a0', title: 'The Silver Dragon at Sundown',
  },
  dawn: {
    sky: { preset: 'dawn', zenith: '#3b5aa0', horizon: '#f4c2b0', sunElevation: 8, sunAzimuth: -50, sunColor: '#ffd0b0',
      clouds: false, clouds2: { coverage: 0.16, stretch: 1, opacity: 0.25, scale: 0.9, lit: '#ffd6cc', shade: '#8b7fa6' },
      lightColor: '#ffc2a2', lightIntensity: 2.8, ambientColor: '#9aa0d8', groundLight: '#54484a', ambientIntensity: 1.15 },
    hero: { sunColor: '#ffc2a2', sunIntensity: 2.6, sky: [0.46, 0.47, 0.64], ground: [0.09, 0.08, 0.09], zenith: '#3b5aa0', horizon: '#f2c4b6' },
    fog: '#eac4bc', density: 0.00095, exposure: 1.04, lamp: 0.5, ridge: '#5a5670', ridgeLit: '#b88a84', haze: '#ecc8c0', cloud: 1.34,
    grade: { saturation: 1.08, contrast: 1.05, tint: '#fff5f2', shadowTint: '#0a0c20' }, bloom: 0.3, portal: '#ffe0c8', title: 'The Silver Dragon at First Light',
  },
  night: {
    sky: { preset: 'night', zenith: '#040a1e', horizon: '#1c2c56', sunIntensity: 0, stars: 0.7, milkyWay: 0.3, milkyAngle: 115, milkyCore: '#9db0e0', clouds: false,
      clouds2: false, cloudLit: '#b4c2ea', cloudShade: '#34436f', cloudLightColor: '#e6edff',
      bodies: [{ elevation: 18, azimuth: -19, size: 4.5, color: '#fff3d8', color2: '#b9a678', texture: 0.9, phase: 1, intensity: 0.7, glow: 0.34, glowColor: '#bcd0ff', glowSize: 5 }],
      key: 0, lightColor: '#aec4ff', lightIntensity: 1.8, ambientColor: '#4a64ac', groundLight: '#28335a', ambientIntensity: 1.7, lightElevationMin: 16 },
    hero: { sunColor: '#c2d0fa', sunIntensity: 1.7, sky: [0.16, 0.21, 0.36], ground: [0.035, 0.04, 0.07], zenith: '#081030', horizon: '#29506f' },
    fog: '#131e3c', density: 0.00085, exposure: 1.45, lamp: 1, ridge: '#0a1226', ridgeLit: '#1c2a4c', haze: '#172446', cloud: 0.6,
    grade: { saturation: 1.1, contrast: 1.06, tint: '#fbf7f1', shadowTint: '#03061a' }, bloom: 0.44, portal: '#ffd28a', title: 'The Silver Dragon by Moonlight',
  },
};
const LOOKS = [{ hero: 'jade', hour: 'day' }, { hero: 'silt', hour: 'golden' }, { hero: 'festival', hour: 'night' }, { hero: 'festival', hour: 'day' }];

// ---------- a small flat-shaded geometry builder (boats, poles, far land) ----------
function makeGeo() {
  const P = [], K = []; let c = [1, 1, 1];
  const g = {
    col(col, k = 1) { c = [col.r * k, col.g * k, col.b * k]; return g; },
    tri(a, b, d) { P.push(a[0], a[1], a[2], b[0], b[1], b[2], d[0], d[1], d[2]); for (let i = 0; i < 3; i++) K.push(c[0], c[1], c[2]); return g; },
    quad(a, b, d, e) { return g.tri(a, b, d).tri(a, d, e); },
    box(x0, y0, z0, x1, y1, z1) {
      const v = (i) => [i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0];
      for (const f of [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]]) g.quad(v(f[0]), v(f[1]), v(f[2]), v(f[3]));
      return g;
    },
    // tapered tube from a to b
    tube(a, b, r0, r1 = r0, n = 5) {
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]) || 1, w = [d[0] / L, d[1] / L, d[2] / L];
      const up = Math.abs(w[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
      let s = [w[1] * up[2] - w[2] * up[1], w[2] * up[0] - w[0] * up[2], w[0] * up[1] - w[1] * up[0]]; const sl = Math.hypot(s[0], s[1], s[2]); s = [s[0] / sl, s[1] / sl, s[2] / sl];
      const t = [w[1] * s[2] - w[2] * s[1], w[2] * s[0] - w[0] * s[2], w[0] * s[1] - w[1] * s[0]];
      const ring = (p, r, k) => { const an = (k / n) * Math.PI * 2, ca = Math.cos(an) * r, sa = Math.sin(an) * r; return [p[0] + s[0] * ca + t[0] * sa, p[1] + s[1] * ca + t[1] * sa, p[2] + s[2] * ca + t[2] * sa]; };
      for (let k = 0; k < n; k++) g.quad(ring(a, r0, k), ring(a, r0, k + 1), ring(b, r1, k + 1), ring(b, r1, k));
      return g;
    },
    n() { return P.length / 3; },
    build() {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(K, 3));
      geo.computeVertexNormals(); return geo;
    },
  };
  return g;
}

// a sampan hull lofted along Z (bow toward -Z). o: z0 (stern end), z1 (bow tip), W half beam, y0 gunwale height amidships,
// rise (sheer at the bow), D depth, t0 (first station, 0..1: skip the stern), wood colours
function hullInto(g, o) {
  const N = o.n || 10, st = [], t0 = o.t0 || 0;
  for (let i = 0; i <= N; i++) {
    const t = lerp(t0, 1, i / N), z = lerp(o.z0, o.z1, t);
    const w = Math.max(o.W * Math.pow(Math.max(1 - Math.pow(t, 2.3), 0), 0.72) * (0.72 + 0.28 * smoothstep(0, 0.3, t)), 0.02);
    const gy = o.y0 + o.rise * Math.pow(t, 2.6) + (o.stern || 0) * Math.pow(1 - t, 3), ky = o.y0 - o.D + (o.D + o.rise * 0.55) * Math.pow(t, 3.4);
    st.push({ z, w, gy, ky, cy: lerp(ky, gy, 0.4) });
  }
  for (let i = 0; i < N; i++) {
    const a = st[i], b = st[i + 1], k = 0.9 + 0.16 * ((i * 7) % 3) / 2;
    for (const s of [-1, 1]) {
      g.col(o.hull, k); g.quad([s * a.w, a.gy, a.z], [s * b.w, b.gy, b.z], [s * b.w * 0.7, b.cy, b.z], [s * a.w * 0.7, a.cy, a.z]);            // topsides
      g.col(o.hull, k * 0.7); g.quad([s * a.w * 0.7, a.cy, a.z], [s * b.w * 0.7, b.cy, b.z], [0, b.ky, b.z], [0, a.ky, a.z]);                   // bottom
      g.col(o.rail, 1); g.quad([s * a.w, a.gy, a.z], [s * b.w, b.gy, b.z], [s * b.w * 0.86, b.gy + 0.015, b.z], [s * a.w * 0.86, a.gy + 0.015, a.z]);   // gunwale cap
      g.col(o.inner, k * 0.8); g.quad([s * a.w * 0.86, a.gy, a.z], [s * b.w * 0.86, b.gy, b.z], [s * b.w * 0.8, b.gy - o.well, b.z], [s * a.w * 0.8, a.gy - o.well, a.z]);
    }
    g.col(o.deck, 0.82 + 0.3 * ((i * 5) % 4) / 3); g.quad([-a.w * 0.8, a.gy - o.well, a.z], [a.w * 0.8, a.gy - o.well, a.z], [b.w * 0.8, b.gy - o.well, b.z], [-b.w * 0.8, b.gy - o.well, b.z]);
  }
  return st;
}

// ---------- silk: pennants that stream along a world-space direction (our own two, and the tide-riders') ----------
const SILK_VERT = /* glsl */`
attribute vec3 aBase; attribute vec3 aDim;      // hoist foot (local), (hoist height, length, side)
uniform float uPh, uBend, uAmp, uLift; uniform vec3 uDirL, uDirR;
varying vec3 vN; varying vec3 vW; varying vec3 vUv;
#include <fog_pars_vertex>
void main(){
  float a = position.x, v = position.y;
  vec3 dir = aDim.z < 0. ? uDirL : uDirR;
  mat4 M = modelMatrix;
  #ifdef USE_INSTANCING
  M = modelMatrix * instanceMatrix;
  #endif
  float hgt = aDim.x * mix(1., 0.42, a);
  float yv = aDim.x * 0.6 + (v - 0.6) * hgt;
  vec3 hp = (M * vec4(aBase + vec3(0., yv, 0.), 1.)).xyz;
  vec3 perp = normalize(cross(vec3(0., 1., 0.), dir) + vec3(1e-4, 0., 0.));
  float ph = a * 6.5 - uPh + aBase.x * 1.7 + v * 0.9, w = a * (0.3 + 0.7 * a);
  float wave = (sin(ph) * 0.17 + sin(ph * 2.3 + 1.7) * 0.06) * w * uAmp;
  float dw = (cos(ph) * 0.17 + cos(ph * 2.3 + 1.7) * 0.14) * 6.5 * w * uAmp;
  vec3 wp = hp + dir * (a * aDim.y) + perp * (wave * aDim.y * 0.55 + uBend * a * a)
    + vec3(0., (mix(-0.1 * a * a, 0.12 * a, uLift) + 0.045 * sin(ph * 1.3 + 2.) * w) * aDim.y, 0.);      // (our own pennants lift as they stream, the riders' droop)
  vN = normalize(perp - dir * dw * 0.55);
  vW = wp; vUv = vec3(a, v, dw);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SILK_FRAG = /* glsl */`
uniform vec3 uCol, uHem, uSunDir, uSunCol, uAmb;
varying vec3 vN; varying vec3 vW; varying vec3 vUv;
#include <fog_pars_fragment>
void main(){
  if (vUv.x > 0.7 && abs(vUv.y - 0.6) < (vUv.x - 0.7) * 1.25) discard;          // a swallow tail
  vec3 n = normalize(vN), vd = normalize(cameraPosition - vW);
  float nl = dot(n, uSunDir), thru = dot(n, vd) * nl < 0. ? 0.72 : 1.;       // seen from the shaded side the silk still glows
  float lit = (abs(nl) * 0.7 + 0.3) * thru;
  float hem = smoothstep(0.86, 0.93, abs(vUv.y * 2. - 1.)) * step(vUv.x, 0.9) + 1. - smoothstep(0.02, 0.045, vUv.x);
  vec3 alb = mix(uCol, uHem, hem * 0.85) * clamp(1. - 0.2 * vUv.z, 0.6, 1.3);   // folds
  float sheen = pow(max(1. - abs(dot(n, vd)), 0.), 3.);
  vec3 col = alb * (uAmb + uSunCol * lit) + uSunCol * sheen * 0.07;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
function silkGeometry(flags, nu = 10, nv = 4) {     // flags: [{ base: [x,y,z], H, L, side }]
  const pos = [], base = [], dim = [];
  for (const f of flags) for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
    for (const [u, v] of [[u0, v0], [u1, v0], [u1, v1], [u0, v0], [u1, v1], [u0, v1]]) { pos.push(u, v, 0); base.push(f.base[0], f.base[1], f.base[2]); dim.push(f.H, f.L, f.side); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aBase', new THREE.Float32BufferAttribute(base, 3)); g.setAttribute('aDim', new THREE.Float32BufferAttribute(dim, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}
function silkMaterial(U, extra) {
  return new THREE.ShaderMaterial({ vertexShader: SILK_VERT, fragmentShader: SILK_FRAG, side: THREE.DoubleSide, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uPh: { value: 0 }, uSunDir: U.uSunDir, uSunCol: U.uSunCol, uAmb: U.uAmb, uCol: U.uCol, uHem: U.uHem, ...extra } });
}

// ---------- kites over the promenade: diamond, tail and string in one instanced draw ----------
const KITE_VERT = /* glsl */`
attribute vec3 iPos, iBase, iCol; attribute vec2 iPar; attribute float aPart;
uniform float uTime, uPix; uniform vec2 uWind;
varying vec3 vCol; varying vec2 vShade;
#include <fog_pars_vertex>
void main(){
  float ph = iPar.y, sz = iPar.x;
  vec3 K = iPos + vec3(sin(uTime * 0.31 + ph) * 7., sin(uTime * 0.47 + ph * 1.7) * 4., cos(uTime * 0.23 + ph * 2.3) * 6.);
  vec3 fw = normalize(vec3(uWind.x, 0., uWind.y)), rt = normalize(cross(vec3(0., 1., 0.), fw));
  vec3 up = normalize(vec3(0., 0.8, 0.) + fw * 0.6);
  rt = normalize(rt + up * sin(uTime * 1.7 + ph * 5.) * 0.12);
  vec3 wp; vCol = iCol; vShade = vec2(1., 0.);
  if (aPart < 0.5) {
    wp = K + (rt * position.x + up * position.y) * sz;
    vShade.x = 0.72 + 0.28 * step(0., position.x * (position.y - 0.25));
  } else if (aPart < 1.5) {
    float t = position.x, L = sz * 7.;
    wp = K - up * sz + fw * (t * L * 0.5) - vec3(0., t * L * 0.8, 0.) + rt * (sin(t * 9. - uTime * 4. + ph) * 0.35 * t * sz + position.y * 0.16 * sz);
    vShade.x = 0.75 + 0.25 * step(0.5, fract(t * 6.));
  } else if (aPart > 2.5) {      // a paper lamp slung under the kite
    wp = K - up * sz * 1.45 + (rt * position.x + up * position.y) * max(sz * 0.3, 0.75);
    vShade = vec2(1., 2.);
  } else {
    float t = position.x;
    vec3 p = mix(K - up * sz * 0.2, iBase, t); p.y -= sin(t * 3.14159) * distance(K, iBase) * 0.07;
    vec3 toC = cameraPosition - p; float dist = length(toC);
    vec3 side = normalize(cross(normalize(iBase - K + vec3(0., 1e-3, 0.)), toC / max(dist, 1e-3)) + vec3(0., 1e-3, 0.));
    wp = p + side * position.y * max(0.01, dist * uPix) * mix(0.45, 0.8, t);      // a thread, finer toward the kite
    vCol = vec3(0.4, 0.39, 0.37); vShade = vec2(1., 1.);
  }
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const KITE_FRAG = /* glsl */`
uniform vec3 uSunCol, uAmb, uHaze, uKLamp; uniform float uGlow;
varying vec3 vCol; varying vec2 vShade;
#include <fog_pars_fragment>
void main(){
  vec3 col = vCol * vShade.x * (uAmb * 1.3 + uSunCol * 0.62 + vec3(1., 0.62, 0.3) * uGlow);      // (uGlow: the town's lantern light on the paper)
  float lampK = step(1.5, vShade.y);
  gl_FragColor = vec4(mix(mix(col, uHaze, 0.72 * min(vShade.y, 1.)), uKLamp, lampK), 1.);                   // strings sit half-way into the haze; the lamp is its own light
  #include <fog_fragment>
}`;
function kiteGeometry(list) {     // list: [{ pos: [x,y,z], base: [x,y,z], size, phase, col: Color }]
  const pos = [], part = [], v = (x, y, p) => { pos.push(x, y, 0); part.push(p); };
  v(0, 1, 0); v(-0.62, 0.25, 0); v(0.62, 0.25, 0); v(-0.62, 0.25, 0); v(0, -1, 0); v(0.62, 0.25, 0);
  for (const [p, n] of [[1, 10], [2, 12]]) for (let i = 0; i < n; i++) {
    const a = i / n, b = (i + 1) / n;
    v(a, -1, p); v(b, -1, p); v(b, 1, p); v(a, -1, p); v(b, 1, p); v(a, 1, p);
  }
  v(0, 0.55, 3); v(-0.38, 0.2, 3); v(0.38, 0.2, 3); v(-0.38, 0.2, 3); v(-0.38, -0.3, 3); v(0.38, -0.3, 3); v(-0.38, 0.2, 3); v(0.38, -0.3, 3); v(0.38, 0.2, 3);
  v(-0.38, -0.3, 3); v(0, -0.6, 3); v(0.38, -0.3, 3);      // the lamp (a small lozenge of paper)
  const g = new THREE.InstancedBufferGeometry(), n = list.length;
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  const iPos = new Float32Array(n * 3), iBase = new Float32Array(n * 3), iCol = new Float32Array(n * 3), iPar = new Float32Array(n * 2);
  list.forEach((k, i) => { iPos.set(k.pos, i * 3); iBase.set(k.base, i * 3); iCol.set([k.col.r, k.col.g, k.col.b], i * 3); iPar.set([k.size, k.phase], i * 2); });
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3)); g.setAttribute('iBase', new THREE.InstancedBufferAttribute(iBase, 3));
  g.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCol, 3)); g.setAttribute('iPar', new THREE.InstancedBufferAttribute(iPar, 2));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

const WOOD = { hull: C('#7a5234'), rail: C('#8a6238'), inner: C('#6e4a2e'), deck: C('#9a7448'), bamboo: C('#b9a45e'), node: C('#7d6a36'), red: C('#b52e25'), gold: C('#d9a441') };

// our own sampan, in boat space: the eye at the origin, bow toward -Z. Only the foredeck, the stem, a bamboo spar
// across the bow and the two pennant poles at its ends ever reach the frame.
function buildVehicleGeometry(dk = 1, rig = false) {      // dk: how light the deck and the painted bow board are (under a low sun they would outshine the river); rig: the spar and the two poles alone (a mesh of their own: they are kept out of the frame for the first half of the flight)
  const g = makeGeo();
  if (rig) return buildRigInto(g).build();
  const st = hullInto(g, { z0: 1.2, z1: -4.25, t0: 0.12, W: 0.88, y0: -1.7, rise: 0.27, D: 0.5, well: 0.13, n: 12, hull: WOOD.hull, rail: WOOD.rail, inner: WOOD.inner, deck: WOOD.deck.clone().multiplyScalar(dk) });
  const tip = st[st.length - 1], a = st[st.length - 3], b = st[st.length - 2];
  // the painted bow board, the stem head with its red cloth, a thwart, a coil of rope
  g.col(WOOD.red, dk).quad([-a.w * 0.78, a.gy - 0.11, a.z], [a.w * 0.78, a.gy - 0.11, a.z], [b.w * 0.78, b.gy - 0.11, b.z], [-b.w * 0.78, b.gy - 0.11, b.z]);
  g.col(WOOD.gold, dk).quad([-b.w * 0.78, b.gy - 0.1, b.z], [b.w * 0.78, b.gy - 0.1, b.z], [0.02, tip.gy - 0.1, tip.z], [-0.02, tip.gy - 0.1, tip.z]);
  g.col(WOOD.hull, 0.8).box(-0.055, tip.gy - 0.2, tip.z - 0.06, 0.055, tip.gy + 0.1, tip.z + 0.1);
  g.col(WOOD.red, 1.15).box(-0.075, tip.gy - 0.02, tip.z - 0.08, 0.075, tip.gy + 0.06, tip.z + 0.12);
  const m = st[6]; g.col(WOOD.rail, 0.85).box(-m.w * 0.84, m.gy - 0.06, m.z - 0.09, m.w * 0.84, m.gy + 0.015, m.z + 0.09);
  for (let k = 0; k < 8; k++) { const a0 = (k / 8) * Math.PI * 2, a1 = ((k + 1) / 8) * Math.PI * 2, cx = 0.22, cz = -3.05, cy = a.gy - 0.07;
    g.col(C('#b8a070'), 0.8 + 0.25 * (k % 2)).tube([cx + Math.cos(a0) * 0.17, cy, cz + Math.sin(a0) * 0.17], [cx + Math.cos(a1) * 0.17, cy, cz + Math.sin(a1) * 0.17], 0.035, 0.035, 4); }
  return g.build();
}
function buildRigInto(g) {
  // bamboo spar and the two poles, with their nodes
  g.col(WOOD.bamboo, 0.9).tube([-2.62, -1.8, -2.5], [2.62, -1.8, -2.5], 0.045, 0.045, 5);
  for (const s of [-1, 1]) {
    const p0 = [s * 2.56, -1.95, -2.5], p1 = [s * 2.68, 2.5, -2.56];
    g.col(WOOD.bamboo, 1).tube(p0, p1, 0.042, 0.028, 6);
    for (let k = 1; k < 10; k++) { const t = k / 10, q = [lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t), lerp(p0[2], p1[2], t)], r = lerp(0.05, 0.036, t);
      g.col(WOOD.node, 1).tube([q[0], q[1] - 0.012, q[2]], [q[0], q[1] + 0.012, q[2]], r, r, 6); }
    g.col(WOOD.red, 0.9).tube([s * 2.56, -1.85, -2.5], [s * 2.56, -1.75, -2.5], 0.07, 0.07, 5);      // lashing
  }
  return g;
}
function buildLanternGeometry() {     // one small paper lantern on each pole (boat space)
  const g = makeGeo();
  for (const s of [-1, 1]) {
    const x = s * 2.47, y = -0.86, z = -2.5;
    g.col(C('#ffffff'), 1).tube([x, y - 0.085, z], [x, y, z], 0.045, 0.07, 6).tube([x, y, z], [x, y + 0.085, z], 0.07, 0.045, 6);
    g.col(C('#1a100a'), 0.1).tube([x, y + 0.085, z], [x, y + 0.105, z], 0.05, 0.05, 6).tube([x, y - 0.105, z], [x, y - 0.085, z], 0.05, 0.05, 6);
    g.tube([x, y + 0.1, z], [s * 2.575, y + 0.3, z], 0.007, 0.007, 3);
  }
  return g.build();
}
// a tide-rider: a small sampan and its rider, knees bent, leaning into the face with both hands on the flag pole
// (origin at the waterline, bow toward -Z)
function buildRiderGeometry() {
  const g = makeGeo(), skin = C('#b98558'), cloth = C('#28303e'), tunic = C('#e6dfcc'), straw = C('#c9b47a');
  hullInto(g, { z0: 2.3, z1: -3.0, W: 0.56, y0: 0.4, rise: 0.32, stern: 0.14, D: 0.52, well: 0.1, n: 8, hull: WOOD.hull, rail: WOOD.rail, inner: WOOD.inner, deck: WOOD.deck });
  const hip = [0, 1.0, 0.66], chest = [0.03, 1.5, 0.36], head = [0.05, 1.7, 0.24];
  for (const [sx, fz, kz] of [[-1, 0.2, 0.3], [1, 1.02, 0.86]]) {                       // a wide stance, front knee bent
    g.col(cloth, 1).tube([sx * 0.2, 0.31, fz], [sx * 0.21, 0.68, kz], 0.06, 0.085, 5).tube([sx * 0.21, 0.68, kz], [sx * 0.09, 1.0, hip[2]], 0.085, 0.115, 5);
    g.col(skin, 0.9).tube([sx * 0.2, 0.3, fz - 0.14], [sx * 0.2, 0.33, fz + 0.06], 0.05, 0.05, 4);
  }
  g.col(tunic, 1).tube(hip, chest, 0.17, 0.2, 6).tube(chest, [0.04, 1.6, 0.3], 0.2, 0.09, 6);
  g.col(WOOD.red, 1).tube([0, 0.97, 0.68], [0, 1.09, 0.61], 0.185, 0.185, 6);              // sash
  g.col(skin, 1).tube([0.04, 1.6, 0.3], head, 0.06, 0.1, 5).tube(head, [0.055, 1.86, 0.2], 0.1, 0.085, 5);
  g.col(straw, 1).tube([0.055, 1.83, 0.2], [0.06, 2.03, 0.19], 0.37, 0.02, 8);              // conical hat
  const pole0 = [0.42, 0.32, 0.26], pole1 = [0.5, 3.5, 0.12], at = (t) => [lerp(pole0[0], pole1[0], t), lerp(pole0[1], pole1[1], t), lerp(pole0[2], pole1[2], t)];
  for (const [sx, t, ez] of [[1, 0.4, 0.14], [-1, 0.3, 0.06]]) {                            // both arms to the pole
    const sh = [chest[0] + sx * 0.2, 1.52, chest[2]], el = [chest[0] + sx * 0.3 + 0.1, 1.3, ez], hand = at(t);
    g.col(tunic, 0.92).tube(sh, el, 0.065, 0.055, 4); g.col(skin, 1).tube(el, hand, 0.05, 0.045, 4);
  }
  g.col(WOOD.bamboo, 1).tube(pole0, pole1, 0.04, 0.03, 5);
  return g.build();
}

// a fishing sampan at anchor: a mat awning amidships, a man at the sculling oar in the stern, a paper lantern on a pole in the bow
// (origin at the waterline, bow toward -Z; paper: the colour of the lantern)
function buildSampanGeometry(paper) {
  const g = makeGeo(), skin = C('#b98558'), cloth = C('#2b3442'), tunic = C('#d9d2bd'), straw = C('#c9b47a'), mat = C('#a8925a'), dark = C('#1c1410');
  hullInto(g, { z0: 2.9, z1: -3.6, W: 0.84, y0: 0.44, rise: 0.4, stern: 0.2, D: 0.58, well: 0.1, n: 9, hull: WOOD.hull, rail: WOOD.rail, inner: WOOD.inner, deck: WOOD.deck });
  const N = 6, z0 = -0.7, z1 = 1.3, R = 0.76, H0 = 0.42, ap = (a, z) => [Math.cos(a) * R, H0 + Math.sin(a) * 0.9, z];
  for (let k = 0; k < N; k++) {
    const a0 = (Math.PI * k) / N, a1 = (Math.PI * (k + 1)) / N;
    g.col(mat, 0.72 + 0.34 * ((k * 3) % 4) / 3).quad(ap(a0, z0), ap(a1, z0), ap(a1, z1), ap(a0, z1));
    g.col(dark, 1).tri([0, H0, z1 - 0.05], ap(a0, z1 - 0.05), ap(a1, z1 - 0.05)).tri([0, H0, z0 + 0.05], ap(a1, z0 + 0.05), ap(a0, z0 + 0.05));
  }
  for (const z of [z0, (z0 + z1) / 2, z1]) for (let k = 0; k < N; k++) g.col(WOOD.bamboo, 0.8).tube(ap((Math.PI * k) / N, z), ap((Math.PI * (k + 1)) / N, z), 0.03, 0.03, 3);
  const hip = [0.04, 1.14, 2.2], chest = [0.02, 1.64, 2.04], head = [0.01, 1.84, 1.96];
  for (const [sx, fz] of [[-1, 2.02], [1, 2.42]]) g.col(cloth, 1).tube([sx * 0.17, 0.4, fz], [sx * 0.1, 1.14, hip[2]], 0.065, 0.11, 5);
  g.col(tunic, 1).tube(hip, chest, 0.17, 0.2, 6).tube(chest, [0.02, 1.74, 2.0], 0.2, 0.09, 6);
  g.col(skin, 1).tube([0.02, 1.74, 2.0], head, 0.06, 0.1, 5).tube(head, [0.01, 2.0, 1.92], 0.1, 0.085, 5);
  g.col(straw, 1).tube([0.01, 1.97, 1.92], [0.01, 2.17, 1.91], 0.37, 0.02, 8);
  const oar0 = [0.42, 1.5, 1.72], oar1 = [0.95, -0.55, 4.6], oat = (t) => [lerp(oar0[0], oar1[0], t), lerp(oar0[1], oar1[1], t), lerp(oar0[2], oar1[2], t)];
  g.col(WOOD.bamboo, 0.85).tube(oar0, oar1, 0.035, 0.06, 5);
  for (const [sx, t] of [[1, 0.06], [-1, 0.16]]) { const sh = [chest[0] + sx * 0.2, 1.56, chest[2]], hand = oat(t); g.col(tunic, 0.92).tube(sh, [lerp(sh[0], hand[0], 0.5) + 0.06, 1.38, lerp(sh[2], hand[2], 0.5)], 0.06, 0.05, 4); g.col(skin, 1).tube([lerp(sh[0], hand[0], 0.5) + 0.06, 1.38, lerp(sh[2], hand[2], 0.5)], hand, 0.045, 0.04, 4); }
  // a basket and a coil forward of the awning, the lamp pole in the bow
  g.col(straw, 0.8).tube([-0.2, 0.34, -1.5], [-0.2, 0.7, -1.5], 0.24, 0.3, 6);
  const top = [0.06, 2.3, -2.86];
  g.col(WOOD.bamboo, 1).tube([0, 0.4, -2.55], top, 0.04, 0.026, 5).tube(top, [0.06, 2.24, -2.5], 0.02, 0.02, 3);
  const lx = 0.06, ly = 1.92, lz = -2.5;
  g.col(paper, 1).tube([lx, ly - 0.17, lz], [lx, ly, lz], 0.09, 0.15, 6).tube([lx, ly, lz], [lx, ly + 0.17, lz], 0.15, 0.09, 6);
  g.col(dark, 1).tube([lx, ly + 0.17, lz], [lx, ly + 0.32, lz], 0.03, 0.012, 3).tube([lx, ly - 0.22, lz], [lx, ly - 0.17, lz], 0.06, 0.09, 5);
  return g.build();
}

// far hills as hazed cards (no fog: their haze is baked in), with two small pagodas on the city's ridge
async function buildRidges(noise, specs, pal, ctx) {
  const g = makeGeo(), col = new THREE.Color(), haze = pal.haze;
  for (const r of specs) {
    await ctx.yield();
    const curve = new THREE.CatmullRomCurve3(r.pts.map((p) => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
    const n = Math.max(10, Math.round(curve.getLength() / 75)), rows = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, p = curve.getPointAt(t), env = Math.pow(Math.sin(Math.PI * t), 0.42);
      const f = clamp(0.5 + 0.5 * noise.fbm2(p.x * 0.0012 + r.seed, p.z * 0.0012 - r.seed, 4), 0, 1), j = noise.n2(p.x * 0.006 + r.seed, p.z * 0.006);
      rows.push({ x: p.x, z: p.z, top: r.base + r.H * env * (0.28 + 0.72 * f) * (1 + 0.07 * j) });
    }
    for (let i = 0; i < n; i++) {
      const a = rows[i], b = rows[i + 1], lit = clamp(0.5 + (b.top - a.top) * 0.02 * r.sun, 0, 1);
      const mid = (q) => r.base + (q.top - r.base) * 0.4;
      col.copy(pal.ridge).lerp(pal.ridgeLit, lit).lerp(haze, r.haze); g.col(col).quad([a.x, mid(a), a.z], [b.x, mid(b), b.z], [b.x, b.top, b.z], [a.x, a.top, a.z]);
      col.copy(pal.ridge).lerp(pal.ridgeLit, lit * 0.6).lerp(haze, Math.min(1, r.haze + 0.2)); g.col(col).quad([a.x, r.base, a.z], [b.x, r.base, b.z], [b.x, mid(b), b.z], [a.x, mid(a), a.z]);
    }
    for (const k of r.pagodas || []) {
      const q = rows[Math.round(k * n)], H = 52; col.copy(pal.ridge).multiplyScalar(0.6).lerp(haze, r.haze * 0.85); g.col(col);
      for (let s = 0; s < 7; s++) { const y0 = q.top - 4 + (s / 7) * H, y1 = y0 + H / 7, w0 = 7.5 - s * 0.7, w1 = w0 - 0.5, e = w0 + 2.6;
        g.quad([q.x + 3, y0, q.z - w0], [q.x + 3, y0, q.z + w0], [q.x + 3, y1 - 1.6, q.z + w1], [q.x + 3, y1 - 1.6, q.z - w1]);
        g.quad([q.x + 3, y1 - 1.6, q.z - e], [q.x + 3, y1 - 1.6, q.z + e], [q.x + 3, y1, q.z + w1], [q.x + 3, y1, q.z - w1]); }
      g.quad([q.x + 3, q.top - 4 + H, q.z - 0.7], [q.x + 3, q.top - 4 + H, q.z + 0.7], [q.x + 3, q.top + H + 12, q.z + 0.1], [q.x + 3, q.top + H + 12, q.z - 0.1]);
    }
  }
  return g.build();
}

// ---------- the city behind the seawall: tiled roofs climbing a low hill, halls, small pagodas, trees (one draw) ----------
// Song-dynasty Hangzhou stands behind its dyke. From the river only what rises above the parapet can be seen, so the town climbs
// a hillside that begins 50 m behind the wall (brought over from stage c9, where a reader found it fits the brief; with lit
// windows on the walls for the lantern hours: `win`, a second small geometry): terraces of grey-tiled houses with plastered walls, a few big halls under green
// and ochre glazed roofs, three small pagodas along the crest, gold and green trees between. o: metres behind the wall line.
function cityHill(noise) {
  const crest = (z) => (40 + 20 * noise.n2(z * 0.0035, 3.7) + 9 * noise.n2(z * 0.011, 9.1)) * lerp(0.45, 1, smoothstep(30, 330, z)) * (1 - smoothstep(1050, 1420, z));
  return (z, o) => 3.6 + crest(z) * smoothstep(48, 300 + 50 * noise.n2(z * 0.006, 1.3), o) * (1 - 0.55 * smoothstep(340, 760, o)) + 2.2 * noise.n2(z * 0.02, o * 0.02) * smoothstep(60, 140, o);
}
async function buildCity(noise, rng, wall, ctx, density = 1, win = null) {
  const g = makeGeo(), wr = win ? makeRng(40507) : null, lampA = C('#ffb45e'), lampB = C('#ffd08a'), hill = cityHill(noise), col = new THREE.Color(), q3 = new THREE.Vector3();
  const at = (z, o, y) => { wall.pointAt(z, -o, y, q3); return [q3.x, q3.y, q3.z]; };
  const grass = C('#5d7440'), turf = C('#7d8a4a'), earth = C('#8a7a58');
  // the hillside
  const os = [48, 80, 120, 165, 215, 270, 330, 420, 560, 760], NZ = 38, zAt = (j) => (1300 * j) / NZ;
  let prev = os.map((o) => at(zAt(0), o, hill(zAt(0), o)));
  for (let j = 1; j <= NZ; j++) {
    const z = zAt(j), cur = os.map((o) => at(z, o, hill(z, o)));
    for (let i = 0; i < os.length - 1; i++) {
      col.copy(grass).lerp(turf, 0.5 + 0.5 * noise.n2(z * 0.01, os[i] * 0.02)).lerp(earth, i < 6 ? 0.25 : 0).multiplyScalar(0.86 + 0.2 * ((j * 7 + i * 3) % 5) / 4);
      g.col(col).quad(prev[i], cur[i], cur[i + 1], prev[i + 1]);
    }
    prev = cur;
    if (j % 12 === 11) await ctx.yield();
  }
  await ctx.yield();
  // a gabled house (or a hall with a second, smaller roof over it) at (z, o), its ridge along the wall or across it
  const tiles = [C('#4a5a5c'), C('#56666a'), C('#3f4d50'), C('#5e6a66'), C('#6b6f68')], glazed = [C('#2f6a58'), C('#b8892e'), C('#3a6f7a')], walls = [C('#e3d4b2'), C('#d9c7a0'), C('#cdbb98'), C('#b9a888')], lacq = C('#9c3024');
  const house = (z, o, w, l, h, ry, roofC, wallC, k) => {
    const y0 = hill(z, o) - 0.4, c = at(z, o, y0), cs = Math.cos(ry), sn = Math.sin(ry), q = (x, y, zz) => [c[0] + x * cs + zz * sn, c[1] + y, c[2] - x * sn + zz * cs];
    g.col(wallC, k);
    g.quad(q(-w, 0, -l), q(w, 0, -l), q(w, h, -l), q(-w, h, -l)).quad(q(w, 0, l), q(-w, 0, l), q(-w, h, l), q(w, h, l));
    g.col(wallC, k * 0.86).quad(q(-w, 0, l), q(-w, 0, -l), q(-w, h, -l), q(-w, h, l)).quad(q(w, 0, -l), q(w, 0, l), q(w, h, l), q(w, h, -l));
    const e = 0.7, rh = w * 0.62;
    g.col(roofC, k).quad(q(-w - e, h - 0.25, -l - e), q(-w - e, h - 0.25, l + e), q(0, h + rh, l + e * 0.4), q(0, h + rh, -l - e * 0.4));
    g.col(roofC, k * 0.8).quad(q(w + e, h - 0.25, l + e), q(w + e, h - 0.25, -l - e), q(0, h + rh, -l - e * 0.4), q(0, h + rh, l + e * 0.4));
    g.col(wallC, k * 0.92).tri(q(-w, h, l), q(w, h, l), q(0, h + rh, l)).tri(q(w, h, -l), q(-w, h, -l), q(0, h + rh, -l));
    if (win) {      // lit windows: a few on each long wall, one in each gable (most of them alight)
      const ww = 0.5 + 0.12 * w, wh = Math.min(0.62 * ww + 0.5, h * 0.4), y1 = h * 0.58;
      for (const sx of [-1, 1]) for (let j = -1; j <= 1; j++) { if (wr() > 0.62) continue; const zz = j * l * 0.56, x = sx * (w + 0.07); win.col(wr() < 0.7 ? lampA : lampB, 0.7 + 0.6 * wr()).quad(q(x, y1 - wh, zz - sx * ww), q(x, y1 - wh, zz + sx * ww), q(x, y1 + wh, zz + sx * ww), q(x, y1 + wh, zz - sx * ww)); }
      for (const sz of [-1, 1]) { if (wr() > 0.5) continue; const zz = sz * (l + 0.07); win.col(lampA, 0.7 + 0.6 * wr()).quad(q(sz * ww, y1 - wh, zz), q(-sz * ww, y1 - wh, zz), q(-sz * ww, y1 + wh, zz), q(sz * ww, y1 + wh, zz)); }
    }
    return [c, h + rh, q];
  };
  const nH = Math.round(560 * lerp(0.85, 1.1, clamp(density - 0.7, 0, 0.6) / 0.6));
  for (let i = 0; i < nH; i++) {
    const z = 6 + 1180 * Math.pow(rng(), 1.15), o = 56 + 300 * Math.pow(rng(), 1.25), big = 1 + o / 420, w = rng.range(2.6, 4.6) * big, l = rng.range(4.5, 9) * big, h = rng.range(2.8, 4.4) * big;
    const ry = -Math.asin(clamp(0.1045 + z / 2865, -1, 1)) + (rng() < 0.6 ? Math.PI / 2 : 0) + rng.range(-0.14, 0.14), k = rng.range(0.82, 1.12), t = rng(), wc = walls[Math.floor(rng() * walls.length)];
    house(z, o, w, l, h, ry, tiles[Math.floor(t * tiles.length)], wc, k);
    if (i % 90 === 89) await ctx.yield();
  }
  await ctx.yield();
  // halls: two roofs, red columns under the eaves
  for (let i = 0; i < 16; i++) {
    const z = 40 + 1050 * ((i + rng()) / 16), o = rng.range(120, 300), w = rng.range(7, 10), l = rng.range(11, 16), ry = -Math.asin(clamp(0.1045 + z / 2865, -1, 1)) + Math.PI / 2 + rng.range(-0.1, 0.1), gc = glazed[i % glazed.length], k = rng.range(0.9, 1.1);
    const [c, top, q] = house(z, o, w, l, 6.5, ry, gc, lacq, k);
    g.col(walls[0], k).box(c[0] - 2.2, c[1] + top - 1.2, c[2] - 2.2, c[0] + 2.2, c[1] + top + 2.4, c[2] + 2.2);
    const w2 = w * 0.62, l2 = l * 0.62, y2 = top + 2.2, rh = w2 * 0.6;
    g.col(gc, k * 1.05).quad(q(-w2, y2, -l2), q(-w2, y2, l2), q(0, y2 + rh, l2 * 0.6), q(0, y2 + rh, -l2 * 0.6)).tri(q(-w2, y2, l2), q(w2, y2, l2), q(0, y2 + rh, l2 * 0.6));
    g.col(gc, k * 0.8).quad(q(w2, y2, l2), q(w2, y2, -l2), q(0, y2 + rh, -l2 * 0.6), q(0, y2 + rh, l2 * 0.6)).tri(q(w2, y2, -l2), q(-w2, y2, -l2), q(0, y2 + rh, -l2 * 0.6));
    if (i % 6 === 5) await ctx.yield();
  }
  // three small pagodas along the crest (square, seven roofs), well away from the bluff's own
  for (const [z, o] of [[330, 250], [640, 290], [930, 240]]) {
    const y0 = hill(z, o) - 0.5, c = at(z + rng.range(-30, 30), o, y0), H = rng.range(26, 32);
    for (let s = 0; s < 7; s++) {
      const ya = c[1] + (s / 7) * H, yb = ya + H / 7, w0 = 3.6 - s * 0.36, e = w0 + 1.5;
      g.col(walls[1], 0.95).box(c[0] - w0, ya, c[2] - w0, c[0] + w0, yb - 1.1, c[2] + w0);
      g.col(tiles[s % 2], 0.9);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const px = dz, pz = dx;      // four roof skirts
        g.quad([c[0] + dx * e - px * e, yb - 1.5, c[2] + dz * e - pz * e], [c[0] + dx * e + px * e, yb - 1.5, c[2] + dz * e + pz * e], [c[0] + dx * (w0 - 0.4) + px * (w0 - 0.4), yb, c[2] + dz * (w0 - 0.4) + pz * (w0 - 0.4)], [c[0] + dx * (w0 - 0.4) - px * (w0 - 0.4), yb, c[2] + dz * (w0 - 0.4) - pz * (w0 - 0.4)]); }
    }
    g.col(WOOD.gold, 1).tube([c[0], c[1] + H, c[2]], [c[0], c[1] + H + 6, c[2]], 0.5, 0.06, 5);
  }
  await ctx.yield();
  // trees between the roofs: gold ginkgo, amber, a few green
  const gold = C('#e6b422'), amber = C('#d98a1c'), green = C('#5f7a3a'), pine = C('#3f5a34');
  const nT = Math.round(420 * lerp(0.85, 1.1, clamp(density - 0.7, 0, 0.6) / 0.6));
  for (let i = 0; i < nT; i++) {
    const z = 4 + 1250 * Math.pow(rng(), 1.1), o = 50 + 380 * Math.pow(rng(), 1.3), r = rng.range(2.6, 5.2) * (1 + o / 600), hh = r * rng.range(1.1, 1.6), t = rng(), k = rng.range(0.78, 1.12), tw = rng.range(0, 6.28);
    col.copy(gold).lerp(amber, rng.range(0.1, 0.7)); if (t > 0.72) col.copy(green).lerp(gold, rng.range(0, 0.3)); if (t > 0.93) col.copy(pine);
    const c = at(z, o, hill(z, o) + r * 0.55), P = (j, rr, y) => [c[0] + Math.cos(tw + j * 1.2566) * rr, c[1] + y, c[2] + Math.sin(tw + j * 1.2566) * rr];
    for (let j = 0; j < 5; j++) {
      g.col(col, k * (0.78 + 0.34 * ((j * 3) % 5) / 4)).tri(P(j, r, 0), P(j + 1, r, 0), [c[0], c[1] + hh, c[2]]);
      g.col(col, k * 0.62).tri(P(j + 1, r, 0), P(j, r, 0), [c[0], c[1] - r * 0.55, c[2]]);
    }
    if (i % 120 === 119) await ctx.yield();
  }
  await ctx.yield();
  return { geo: g.build(), hill };
}

// ---------- the cloud field's noise texture, made in slices ----------
// The same texture as the kit's own cloud noise (makeNoiseTexture in src/kit/sky.js): two channels of four-octave tileable
// value noise and two shifted copies. Built here so that the work can be cut up with yields (inside the kit it is one step
// of 30 to 50 ms).
function cloudNoiseTexture(size = 256) {
  const tex = new THREE.DataTexture(new Uint8Array(size * size * 4), size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace;
  return tex;
}
async function fillCloudNoise(tex, rng, ctx) {
  const size = tex.image.width, data = tex.image.data, N = size * size, f = [new Float32Array(N), new Float32Array(N)];
  const ix0 = new Int32Array(size), ix1 = new Int32Array(size), wx = new Float32Array(size);
  for (let ch = 0; ch < 2; ch++) {
    const acc = f[ch];
    for (let o = 0, per = ch ? 16 : 4, amp = 0.5; o < 4; o++, per *= 2, amp *= 0.55) {
      const lat = new Float32Array(per * per); for (let i = 0; i < lat.length; i++) lat[i] = rng();
      for (let x = 0; x < size; x++) { const fx = x / size * per, i = Math.floor(fx), t = fx - i; ix0[x] = i % per; ix1[x] = (i + 1) % per; wx[x] = t * t * (3 - 2 * t); }
      for (let y = 0; y < size; y++) {
        const r0 = ix0[y] * per, r1 = ix1[y] * per, wy = wx[y];
        for (let x = 0, p = y * size; x < size; x++, p++) {
          const a = lat[r0 + ix0[x]], b = lat[r0 + ix1[x]], c = lat[r1 + ix0[x]], d = lat[r1 + ix1[x]], w = wx[x];
          acc[p] += amp * (a + (b - a) * w + (c + (d - c) * w - a - (b - a) * w) * wy);
        }
        if ((y & 15) === 15) await ctx.yield();
      }
      await ctx.yield();
    }
  }
  const norm = 0.5 * (1 + 0.55 + 0.55 ** 2 + 0.55 ** 3), m = size - 1;
  const px = (v) => Math.max(0, Math.min(255, ((v / norm - 0.5) * 1.75 + 0.5) * 255));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const p = y * size + x, s = ((y + 89) & m) * size + ((x + 151) & m), s2 = ((y + 33) & m) * size + ((x + 201) & m);
      data[p * 4] = px(f[0][p]); data[p * 4 + 1] = px(f[1][p]); data[p * 4 + 2] = px(f[0][s]); data[p * 4 + 3] = px(f[0][s2]);
    }
    if ((y & 15) === 15) await ctx.yield();
  }
  tex.needsUpdate = true;
}

// ---------- things on the calm river at the opening: fishing stakes, float lines, resting gulls, drifting ginkgo leaves ----------
// One draw. Everything that floats rides the hero's own water (the bore lifts it and the crest swallows it); the stakes stand
// in the river bed and are simply overrun.
const FLOAT_VERT = /* glsl */`
attribute vec4 aPiv;                 // the thing's own centre (x, z), a phase, how it sits (-1 fixed in the bed, else how much it rocks)
attribute vec3 color;
uniform vec3 uSunDir, uSunCol, uAmb;
varying vec3 vCol;
#include <fog_pars_vertex>
${BORE_GLSL}
void main(){
  vec3 q = position - vec3(aPiv.x, 0., aPiv.y), nr = normal;
  float y = 0., keep = 1.;
  if (aPiv.w >= 0.) {
    float d = aPiv.x - wallX(aPiv.y), s = aPiv.y - zFront(d);
    y = boreH(s, d) + 0.045 * sin(uTime * 1.7 + aPiv.z) + 0.03 * sin(uTime * 2.9 + aPiv.z * 2.3);
    keep = 1. - smoothstep(-0.5, 2.5, s);
    float tl = aPiv.w * (0.1 * sin(uTime * 1.3 + aPiv.z * 1.7) + clamp((boreH(s + 0.6, d) - boreH(s - 0.6, d)) * 0.6, -0.9, 0.9)), c = cos(tl), sn = sin(tl);
    q = vec3(q.x, q.y * c - q.z * sn, q.y * sn + q.z * c); nr = vec3(nr.x, nr.y * c - nr.z * sn, nr.y * sn + nr.z * c);
  } else q.x += 0.03 * q.y * sin(uTime * 1.1 + aPiv.z);
  vec3 wp = vec3(aPiv.x, y, aPiv.y) + q * keep;
  float ndl = max(dot(normalize(nr), uSunDir), 0.);
  vCol = color * (uAmb * (1.1 + 0.5 * nr.y) + uSunCol * ndl);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FLOAT_FRAG = /* glsl */`
varying vec3 vCol;
#include <fog_pars_fragment>
void main(){
  gl_FragColor = vec4(vCol, 1.);
  #include <fog_fragment>
}`;
// ex, ez: the entry point; the view is toward +Z, so +X is the left of the frame. path, junks: the route and the anchored
// junks, for the second half (the same things strung along the surf, on the calm water the face is about to take)
async function buildFlotsam(rng, ex, ez, leafCol, path, junks, ctx, fan, uc, boats = []) {
  const g = makeGeo(), piv = [], mark = (x, z, ph, w) => { while (piv.length / 4 < g.n()) piv.push(x, z, ph, w); };
  const bamboo = WOOD.bamboo, gourd = C('#c99a4e'), white = C('#f2efe6'), grey = C('#9aa3ad'), dark = C('#2a2c30'), beak = C('#e0a23a');
  // a line of fishing stakes with gourd floats strung between them (ok: a test a stake or float must pass to be built)
  const stakeLine = (x0, z0, x1, z1, ok) => {
    const L = Math.hypot(x1 - x0, z1 - z0), ns = Math.max(2, Math.round(L / 8));
    for (let i = 0; i <= ns; i++) {
      const x = lerp(x0, x1, i / ns) + rng.range(-0.4, 0.4), z = lerp(z0, z1, i / ns) + rng.range(-0.4, 0.4), h = rng.range(1.9, 3.3), lx = rng.range(-0.25, 0.25), lz = rng.range(-0.25, 0.25);
      const k = rng.range(0.6, 0.95), ph = rng.range(0, 6.28);
      if (ok && !ok(x, z)) continue;
      g.col(bamboo, k).tube([x, -0.8, z], [x + lx, h, z + lz], 0.06, 0.04, 5);
      if (i % 2 === 0) { g.col(WOOD.red, 1); g.quad([x + lx, h - 0.1, z + lz], [x + lx + 0.5, h - 0.2, z + lz + 0.25], [x + lx + 0.5, h - 0.5, z + lz + 0.25], [x + lx, h - 0.45, z + lz]); }
      mark(x, z, ph, -1);
    }
    const nf = Math.round(L / 1.5);
    for (let i = 1; i < nf; i++) {
      const x = lerp(x0, x1, i / nf) + rng.range(-0.15, 0.15), z = lerp(z0, z1, i / nf) + rng.range(-0.15, 0.15), r = rng.range(0.13, 0.2);
      const k = rng.range(0.75, 1.1), ph = rng.range(0, 6.28);
      if (ok && !ok(x, z)) continue;
      g.col(gourd, k).tube([x, -0.08, z], [x, 0.1, z], r * 0.7, r, 5).tube([x, 0.1, z], [x, 0.3, z], r, r * 0.25, 5);
      mark(x, z, ph, 0.5);
    }
  };
  // a gull resting on the water
  const gull = (x, z, ok = true) => {
    const a = rng.range(0, 6.28), ca = Math.cos(a), sa = Math.sin(a), k = rng.range(0.85, 1.2), ph = rng.range(0, 6.28);
    if (!ok) return;
    const P = (f, y, sd = 0) => [x + (ca * f - sa * sd) * k, y * k, z + (sa * f + ca * sd) * k];
    g.col(white, 1).tube(P(-0.26, 0.1), P(0.02, 0.08), 0.03, 0.115, 5).tube(P(0.02, 0.08), P(0.2, 0.12), 0.115, 0.07, 5).tube(P(0.17, 0.12), P(0.23, 0.3), 0.055, 0.05, 4);
    g.col(grey, 1).tube(P(-0.3, 0.16), P(0.08, 0.2), 0.02, 0.085, 4);
    g.col(dark, 1).tube(P(-0.36, 0.15), P(-0.26, 0.17), 0.012, 0.03, 3);
    g.col(beak, 1).tube(P(0.25, 0.3), P(0.34, 0.28), 0.02, 0.006, 3);
    mark(x, z, ph, 0.35);
  };
  // a gold ginkgo leaf lying on the water, face up (wound so that its normal points at the sky)
  const leaf = (x, z, r) => {
    const a = rng.range(0, 6.28), c0 = Math.cos(a) * r * 0.6, s0 = Math.sin(a) * r * 0.6;
    g.col(leafCol, rng.range(0.7, 1.15)).quad([x - c0, 0.035, z - s0], [x + c0 * 0.45 - s0 * 0.95, 0.035, z + s0 * 0.45 + c0 * 0.95], [x + c0, 0.035, z + s0], [x + c0 * 0.45 + s0 * 0.95, 0.035, z + s0 * 0.45 - c0 * 0.95]);
    mark(x, z, rng.range(0, 6.28), 0.2);
  };
  // the opening: three stake lines, gulls, leaves drifting down from the bluff in windrows
  for (const [x0, z0, x1, z1] of [[ex - 12, ez + 14, ex - 40, ez + 46], [ex + 8.5, ez + 27, ex + 33, ez + 55], [ex + 16, ez + 84, ex + 44, ez + 110]]) { stakeLine(x0, z0, x1, z1, null); await ctx.yield(); }      // (the yields are safe: this stream of random numbers is this function's own)
  for (let i = 0; i < 17; i++) { const x = ex + (i % 2 ? -1 : 1) * rng.range(4.5, 26), z = ez + rng.range(9, 84); gull(x, z); }
  await ctx.yield();
  for (let i = 0; i < 90; i++) {
    const row = i % 3, t = rng(); let x = ex + [-6, 5.5, -17][row] + (t - 0.5) * [8, 9, 14][row] + rng.range(-1, 1); const z = ez + 6 + t * 70 + rng.range(-3, 3), a0 = rng.range(0, 6.28), r = rng.range(0.16, 0.3);
    if (z - ez < 16 && Math.abs(x - ex) < 5) x = ex + (x < ex ? -1 : 1) * (5 + Math.abs(x - ex) * 0.6);      // none under the bow at the very start
    const c0 = Math.cos(a0) * r * 0.6, s0 = Math.sin(a0) * r * 0.6;
    g.col(leafCol, rng.range(0.7, 1.15)).quad([x - c0, 0.035, z - s0], [x + c0 * 0.45 - s0 * 0.95, 0.035, z + s0 * 0.45 + c0 * 0.95], [x + c0, 0.035, z + s0], [x + c0 * 0.45 + s0 * 0.95, 0.035, z + s0 * 0.45 - c0 * 0.95]);
    mark(x, z, rng.range(0, 6.28), 0.2);
  }
  await ctx.yield();
  // the surf: everything here lies to the right of our line (the river side), 7 to 40 m off
  const tp = new THREE.Vector3(), tt = new THREE.Vector3();
  const at = (u, r) => { path.pointAt(u, tp); path.tangentAt(u, tt); const l = Math.hypot(tt.x, tt.z) || 1; return [tp.x - (tt.z / l) * r, tp.z + (tt.x / l) * r]; };
  const free = (x, z) => path.nearestXZ(x, z).dist > 6.5 && !junks.some((j) => Math.hypot(j[0] - x, j[2] - z) < 13) && !boats.some((b) => Math.hypot(b.x - x, b.z - z) < 4.5);      // (boats: the sampans, which nothing is strung through)
  for (const [u0, r0, u1, r1] of [[uc[0] - 0.014, 12, uc[0] + 0.016, 30], [uc[1] + 0.017, -14, uc[2] - 0.011, -34], [uc[3] + 0.063, 12, uc[3] + 0.123, 34], [uc[4] - 0.001, 26, uc[4] + 0.034, 13]]) { const a = at(u0, r0), b = at(u1, r1); stakeLine(a[0], a[1], b[0], b[1], free); await ctx.yield(); }
  for (let k = 0; k < 9; k++) {                                         // rafts of gulls
    const c = at(0.27 + 0.064 * k + rng.range(-0.012, 0.012), rng.range(9, 34)), n = rng.int(4, 8);
    for (let i = 0; i < n; i++) { const x = c[0] + rng.range(-3.5, 3.5), z = c[1] + rng.range(-3.5, 3.5); gull(x, z, free(x, z)); }
    if (k % 3 === 2) await ctx.yield();
  }
  for (let i = 0; i < 240; i++) {                                       // windrows of leaves, thicker toward the bluff
    const row = i % 3, u = 0.25 + 0.6 * Math.pow(rng(), 0.7), c = at(u, [7.5, 12.5, 20][row] - 4 * smoothstep(0.74, 0.78, u) + rng.range(-1.7, 1.7) + 3 * Math.sin(u * 40 + row * 2));      // (nearer the line along the last of the wall, where the calm water beside the wave lay bare)
    leaf(c[0], c[1], rng.range(0.2, 0.36));
    if (i % 80 === 79) await ctx.yield();
  }
  await ctx.yield();
  // the cutback: a stake line, rafts of gulls and leaves on the calm water it runs out onto, between our line and the wave
  if (fan) {
    const fp = (al, lat) => [fan.x + fan.dx * al + fan.dz * lat, fan.z + fan.dz * al - fan.dx * lat];      // (lat: metres to the left of the run, the calm side; the wave is 4 m off on the right)
    { const a = fp(18, 9), b = fp(54, 30); stakeLine(a[0], a[1], b[0], b[1], free); }
    for (let k = 0; k < 5; k++) { const al = 10 + 22 * k + rng.range(-6, 6), c = fp(al, 7 + al * rng.range(0.03, 0.42)), n = rng.int(4, 7); for (let i = 0; i < n; i++) { const x = c[0] + rng.range(-3.5, 3.5), z = c[1] + rng.range(-3.5, 3.5); gull(x, z, free(x, z)); } }
    for (let i = 0; i < 80; i++) { const al = 4 + 110 * rng(), c = fp(al, 5 + al * rng.range(0, 0.7)); leaf(c[0], c[1], rng.range(0.2, 0.36)); }
    await ctx.yield();
  }
  // the second carve: a stake line and two rafts of gulls on the inside of the turn, where the gaze swings across open water
  // (built last, so everything above is where it was)
  { const a = at(uc[2] + 0.02, -9), b = at(uc[2] + 0.07, -19); stakeLine(a[0], a[1], b[0], b[1], free); }
  for (const [du, r] of [[0.034, 8], [0.06, -8.5]]) { const c = at(uc[2] + du, r), n = rng.int(5, 8); for (let i = 0; i < n; i++) { const x = c[0] + rng.range(-3, 3), z = c[1] + rng.range(-3, 3); gull(x, z, free(x, z)); } }
  await ctx.yield();
  const geo = g.build();
  geo.setAttribute('aPiv', new THREE.Float32BufferAttribute(piv, 4));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(ex, 0, ez + 60), 900);
  return geo;
}

// ---------- reflections lying on the calm water: sails by day, lamp light at dusk and by night ----------
// One draw. Each reflection is a quad that runs from the foot of its thing toward whoever is looking (the camera of the
// frame), as far as the mirror image of the thing reaches at that eye height, and the fragment works out which height of the
// thing is mirrored at each point: so the image stands under its thing in every view, through the portal too. Ripples cut it
// into sliding bands. Nothing shows where the bore has broken the mirror. Lamp light is added, a sail is laid over
// (premultiplied alpha lets one material do both).
const REFL_VERT = /* glsl */`
attribute vec4 aBase;     // foot x, foot z, the height that is mirrored, half width
attribute vec4 aCol;      // colour; mode (0 lamp light, 1 a sail)
varying vec4 vK; varying vec4 vC; varying vec3 vM;
#include <fog_pars_vertex>
${BORE_GLSL}
void main(){
  vec2 toC = cameraPosition.xz - aBase.xy; float D = max(length(toC), 1.); vec2 dir = toC / D;
  float e = max(cameraPosition.y, 0.6), H = aBase.z;
  float rMax = min(D * H / (e + H), max(D - 4., 0.));
  float r = position.y * rMax, pers = max(D - r, 3.) / D;
  vec2 gp = aBase.xy + dir * r + vec2(-dir.y, dir.x) * (position.x * aBase.w * pers);
  float sB = aBase.y - zFront(aBase.x - wallX(aBase.y)), sG = gp.y - zFront(gp.x - wallX(gp.y));
  vK = vec4(position.x, r, D, e); vC = aCol;
  vM = vec3(H, 1. - smoothstep(-11., -6.5, max(sB, sG)), position.z);
  vec4 mvPosition = viewMatrix * vec4(gp.x, 0.09, gp.y, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const REFL_FRAG = /* glsl */`
uniform float uTime;
varying vec4 vK; varying vec4 vC; varying vec3 vM;
#include <fog_pars_fragment>
void main(){
  float a = vK.x, r = vK.y, D = vK.z, H = max(vM.x, 0.1), ph = vM.z;
  float hh = vK.w * r / max(D - r, 0.5), v = clamp(hh / H, 0., 1.);            // the height whose image lies here
  float fine = 1. / (1. + D * 0.012);                                            // far away the bands are finer than a pixel
  float band = sin(hh * 5.3 + uTime * 2.6 + ph) * sin(hh * 2.1 - uTime * 1.5 + ph * 2.) * fine;
  float wob = a + (0.2 * sin(hh * 3.1 + uTime * 1.9 + ph) + 0.1 * sin(hh * 7.7 - uTime * 2.7 + ph * 3.)) * (0.3 + v) * fine;
  float ends = (1. - smoothstep(0.72, 1., v)) * smoothstep(0., 0.04, v) * vM.y, al;
  if (vC.a > 0.5) {                  // a sail: dark red laid on the water, breaking up toward its head
    al = (1. - smoothstep(0.5, 1., abs(wob) * (0.8 + 0.5 * v))) * ends * (0.62 + 0.38 * band) * mix(0.8, 0.3, v) * (1. - smoothstep(230., 360., D));
    gl_FragColor = vec4(vC.rgb * al, al);
  } else {                           // lamp light: a streak, brightest where the lamp's own image lies
    float pk = v - 0.44;
    float bl = sin(hh * 2.9 + uTime * 2.6 + ph) * sin(hh * 1.3 - uTime * 1.5 + ph * 2.) + 0.5 * sin(hh * 0.7 + a * 2.5 + ph * 5.);
    al = (1. - smoothstep(0.1, 1., abs(wob) * (1. + 1.3 * v))) * ends * (0.25 + 0.75 * exp(-pk * pk * 10.)) * (0.1 + 0.9 * smoothstep(-0.45, 0.55, bl));
    gl_FragColor = vec4(vC.rgb * al, 0.);
  }
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float ff = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float ff = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor * gl_FragColor.a, ff);
  #endif
}`;
function reflGeometry(list) {     // list: [{ x, z, H, w, col: Color, k (brightness), mode, ph }]
  const pos = [], base = [], col = [];
  for (const q of list) for (const [a, v] of [[-1, 0], [1, 0], [1, 1], [-1, 0], [1, 1], [-1, 1]]) {
    pos.push(a, v, q.ph); base.push(q.x, q.z, q.H, q.w); col.push(q.col.r * q.k, q.col.g * q.k, q.col.b * q.k, q.mode);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aBase', new THREE.Float32BufferAttribute(base, 4)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

// <flight>
// The route and the bore's timetable. Entry (heading +Z, downriver, straight at the bore) -> a tight right-hand wheel of
// radius R, during which the wall arrives -> a diagonal 55 degrees off the bore's own heading -> 23 m off the seawall ->
// 75 m straight into the gate. From the lock (the end of the wheel) on, the bore stands where the camera needs it (the eye
// rides the crest); before it, the front runs in at a steady real speed, worked out from pace(u), so that it reaches the
// bow at the top of the wheel while the gaze is still held on it.
async function planFlight(hero, duration, tick) {
  const JZ = 523, DIAG = 99, K0 = 20, TURN = 118, ALONG = 75;      // the wall point the first diagonal aims at; how far short of it the cutback starts; how far it carves round; how long it runs along the front
  const A = hero.anchors, wall = A.wall, tp = new THREE.Vector3(), LFACE = 5;
  const dg = [Math.sin(55 * DEG), Math.cos(55 * DEG)], R = 36, R0 = 100, A0 = 32, LEG = 62, J0 = wall.pointAt(JZ, 27, 0);
  const Ax = J0.x + DIAG * dg[0], Az = J0.z + DIAG * dg[1], Cx = Ax + R * dg[1], Cz = Az - R * dg[0];
  // the wheel opens wide: its first A0 degrees are an arc of radius R0 about (Dx, Dz) that runs into the tight one, so the bow
  // (and a steady camera's gaze) still points at the wall when it is a few boat lengths off
  const Dx = Cx - (R0 - R) * Math.cos(A0 * DEG), Dz = Cz - (R0 - R) * Math.sin(A0 * DEG), EX = Dx + R0, EZ = Dz - LEG;
  const xz = [[EX, EZ], [EX, EZ + LEG * 0.34], [EX, EZ + LEG * 0.67]];
  for (let a = 0; a < A0 - 1; a += A0 / 3) xz.push([Dx + R0 * Math.cos(a * DEG), Dz + R0 * Math.sin(a * DEG)]);
  for (let a = A0; a <= 125.5; a += (125 - A0) / 4) xz.push([Cx + R * Math.cos(a * DEG), Cz + R * Math.sin(a * DEG)]);
  for (const k of [DIAG - (DIAG - K0) / 3, DIAG - 2 * (DIAG - K0) / 3]) xz.push([J0.x + k * dg[0], J0.z + k * dg[1]]);
  // the cutback. 36 m short of the wall line the sampan carves right, down the face and out onto the calm river ahead of the
  // wave (the gate, the pagoda and the light swing across the bow), runs along in front of the wall of water (the face, its
  // riders and the junks it lifts stand to the RIGHT now), carves back left, is caught again and runs in to the seawall.
  // A turtle lays the points: arcs of radius R and a given turn, straights between them.
  const cut = [], STEP = 14;
  let tx = J0.x + K0 * dg[0], tz = J0.z + K0 * dg[1], phi = Math.atan2(-dg[1], -dg[0]);
  const mark = () => cut.push([tx, tz]);
  const arc = (Rr, deg, sign) => { const n = Math.max(2, Math.round(Rr * deg * DEG / STEP)), da = deg * DEG / n, ch = 2 * Rr * Math.sin(da / 2); for (let i = 0; i < n; i++) { phi += sign * da / 2; tx += ch * Math.cos(phi); tz += ch * Math.sin(phi); phi += sign * da / 2; xz.push([tx, tz]); } };
  const line = (L) => { const n = Math.max(1, Math.round(L / STEP)); for (let i = 0; i < n; i++) { tx += (L / n) * Math.cos(phi); tz += (L / n) * Math.sin(phi); xz.push([tx, tz]); } };
  xz.push([tx, tz]); mark();
  arc(40, TURN, 1); mark(); line(ALONG); mark(); arc(46, TURN + 7, -1); mark();
  // the run-in is as long as it takes to come out of the last right-hand arc 23 m off the wall
  { const sv = [tx, tz, phi, xz.length], offAt = (L) => { tx = sv[0]; tz = sv[1]; phi = sv[2]; xz.length = sv[3]; line(L); arc(42, 48, 1); return tx - wall.xAt(tz); };
    let lo = 5, hi = 420; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (offAt(m) > 23.6) lo = m; else hi = m; } offAt(lo); }
  mark();
  for (let z = tz - 38; z > 128; z -= 40) { const p = wall.pointAt(z, lerp(20, 23, clamp((z - 150) / 60, 0, 1)), 0); xz.push([p.x, p.z]); }
  { const p = wall.pointAt(115, 16.5, 0); xz.push([p.x, p.z]); }
  xz.push([0.6, 72], [0, 48], [0, 22], [A.portalSeat.position.x, A.portalSeat.position.z]);
  const NT = 512;
  const lookup = (tab, u) => { const f = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(f)); return tab[i] + (tab[i + 1] - tab[i]) * (f - i); };
  const flat = makePath(xz.map(([x, z]) => [x, 2.3, z]));
  // landmarks along the route (taken on the level route: the finished one differs by a few parts in ten thousand)
  const uW = flat.nearestXZ(EX, Dz).u, uTop = flat.nearestXZ(Cx, Cz + R).u, uA = flat.nearestXZ(Ax, Az).u;
  const uC = cut.map(([x, z]) => flat.nearestXZ(x, z).u), uJ = uC[4];      // the cutback: carve right from uC[0] to uC[1], the run along the front to uC[2], carve left to uC[3], the run-in to uC[4] (the wall)
  // Where we ride (metres behind the crest; negative is down the face). The catch takes us 2 m below the lip; then we drop
  // lower on the face so that the lip towers over our left shoulder; the cutback runs out 8.4 m ahead of the crest, onto the
  // calm river in front of the toe, and the wave catches us again as we carve back. Along the last of the seawall it lifts us
  // onto its lip (the promenade's parasols and lanterns at eye height on the left, the face falling away to the calm basin on
  // the right) and carries us there to within 80 m of the gate; then it runs ahead and breaks into the arch a second before we do.
  const sOff = (u) => -2 - 1.4 * smoothstep(uA + 0.015, uA + 0.07, u) * (1 - 0.6 * smoothstep(uC[3], uC[4] + 0.02, u))
    - 5.0 * smoothstep(uC[0], uC[1] - 0.012, u) * (1 - smoothstep(uC[2] + 0.005, uC[3] + 0.03, u)) + 3.6 * smoothstep(0.8, 0.875, u) + 26 * smoothstep(0.915, 1, u);
  // linger facing the thread, sprint through the wheel to match the wave, run fast across the face, ease through the cutback and along the wall
  // (and linger along the front of the wave, where it stands across the frame)
  const pace = (u) => lerp(lerp(lerp(lerp(0.42, 1.25, smoothstep(uW + 0.1 * (uTop - uW), uA + 0.015, u)), 0.82, smoothstep(uC[0] + 0.02, uC[1] + 0.01, u)), 1.1, smoothstep(uC[2], uC[3], u)), 0.93, smoothstep(uJ - 0.06, uJ + 0.05, u));
  let kp = 0; for (let i = 0; i < 64; i++) kp += 2 / (clamp(pace(i / 64), 0.35, 2.5) + clamp(pace((i + 1) / 64), 0.35, 2.5)); kp /= 64;
  const secPerU = (u) => duration / (kp * clamp(pace(u), 0.35, 2.5));      // the engine's own arithmetic (makePace)
  const makeTable = async (path) => {
    const tab = new Float32Array(NT + 1), iL = Math.round((uA + 0.004) * NT), uL = iL / NT;
    hero.setBore(0);
    for (let i = 0; i <= NT; i++) { const u = i / NT; path.pointAt(u, tp); tab[i] = tp.z - sOff(u) - hero.frontZ(tp.x, tp.z); if (i % 32 === 31) await tick(); }
    const vLock = Math.abs((tab[iL + 6] - tab[iL]) / (6 / NT)) / secPerU(uL + 3 / NT), z0 = path.pointAt(0, tp).z + 318;
    const wgt = (u) => smoothstep(uL - 0.03, uL, u);
    let Aw = 0, Bw = 0; for (let i = 0; i < iL; i++) { const u = (i + 0.5) / NT, dt = secPerU(u) / NT; Aw += (1 - wgt(u)) * dt; Bw += wgt(u) * dt; }
    const v0 = clamp((z0 - tab[iL] - vLock * Bw) / Aw, 9, 30);
    for (let i = iL - 1; i >= 0; i--) { const u = (i + 0.5) / NT; tab[i] = tab[i + 1] + lerp(v0, vLock, wgt(u)) * secPerU(u) / NT; }
    for (let i = 1; i <= NT; i++) tab[i] = Math.min(tab[i], tab[i - 1]);
    // where the toe and the crest reach the camera
    let uToe = uL, uCrest = uL;
    for (let i = iL; i >= 0; i--) { const u = i / NT; path.pointAt(u, tp); const sc = tp.z - (tab[i] + hero.frontZ(tp.x, tp.z)); if (sc > -2.3) uCrest = u; if (sc > -LFACE) uToe = u; else break; }
    return { tab, uL, uToe, uCrest, v0, vLock };
  };
  await tick();
  const t1 = await makeTable(flat);
  await tick();
  // the eye: low over the calm river while the wall comes (1.85 m), then 2.3 m over whatever water the bore has put under it
  const M = 240, ys = new Float32Array(M + 1), raw = new Float32Array(M + 1), pts = [];
  const eyeAt = (u) => lerp(1.85, 2.3, smoothstep(t1.uToe - 0.004, t1.uL + 0.02, u));
  // (the rare crossing ridge is narrow and sweeps past faster than the route is sampled: look for it between the samples too,
  // one whole step either side, so the eye is carried over it)
  const subs = hero.rare ? [-1, -0.875, -0.75, -0.625, -0.5, -0.375, -0.25, -0.125, 0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1] : [-0.5, 0, 0.5];
  for (let i = 0; i <= M; i++) {
    const u = i / M; let hmax = -1e9;
    for (const du of subs) { const uu = clamp(u + du / M, 0, 1); flat.pointAt(uu, tp); hero.setBore(lookup(t1.tab, uu)); hmax = Math.max(hmax, hero.heightAt(tp.x, tp.z, 0)); if (du === 0) pts.push([tp.x, 0, tp.z]); }
    raw[i] = hmax; ys[i] = hmax + eyeAt(u);
    if (i % 20 === 19) await tick();
  }
  { const iE = Math.round(0.86 * M); for (let i = iE + 1; i <= M; i++) ys[i] = Math.max(ys[i], ys[iE]); }      // the wave outruns us at the end: the eye does not follow it down
  const blur = (w) => { const o = Float32Array.from(ys); for (let i = 0; i <= M; i++) { let s = 0, q = 0; for (let k = -w; k <= w; k++) { const j = clamp(i + k, 0, M), g = w + 1 - Math.abs(k); s += o[j] * g; q += g; } ys[i] = s / q; } };
  blur(3); blur(3);
  // never let the water reach the eye. Over the rare crossing ridge it is the eye that is carried up (a full 2.3 m clear of
  // the crest, over two samples either side so that the heave stays smooth after the blur), not the sampan toward the lens
  // (only until the bore's own toe: on the face the rare flight keeps its 1.6 m, as close to the water as it was)
  const ridgeK = (u) => (hero.rare ? 1 - smoothstep(t1.uToe - 0.012, t1.uToe + 0.012, u) : 0);
  for (let i = 0; i <= M; i++) {
    const rk = ridgeK(i / M); let r = raw[i];
    if (rk > 0.5) for (let k = -2; k <= 2; k++) r = Math.max(r, raw[clamp(i + k, 0, M)]);
    ys[i] = Math.max(ys[i], r + (hero.rare ? lerp(1.6, 2.3, rk) : 1.15));
  }
  blur(1);
  if (hero.rare) blur(2);
  for (let i = 0; i <= M; i++) ys[i] = Math.max(ys[i], raw[i] + (hero.rare ? lerp(1.45, 2.15, ridgeK(i / M)) : 1.0));
  for (let i = 0; i <= M; i++) { const u = i / M; pts[i][1] = lerp(i < 5 ? ys[0] : ys[i], A.portalSeat.position.y, smoothstep(0.87, 0.975, u)); }
  await tick();
  const path = makePath(pts);
  await tick();
  const t2 = await makeTable(path);
  return { path, xz, R, LEG, EX, EZ, Cx, Cz, Ax, Az, J0, K0, dg, tab: t2.tab, boreAt: (u) => lookup(t2.tab, u), sOff, pace, kp, uW, uTop, uA, uJ, uC, uL: t2.uL, uToe: t2.uToe, uCrest: t2.uCrest, v0: t2.v0, vLock: t2.vLock };
}
// Where the gaze goes (points of interest). Every point that must hold a steady camera too is given several times over: a
// sweeping camera is saturated by the first two, a steady one takes about a third of each and so comes most of the way.
function flightPois(hero, FL, rare) {
  const A = hero.anchors, wall = A.wall, HU = hero.uniforms, { path, boreAt, uA, uJ, uC, uToe, uCrest } = FL;
  const frontV = new THREE.Vector3(), faceV = new THREE.Vector3(), leftV = new THREE.Vector3(), plumeV = new THREE.Vector3();
  // (when the rare crossing tide runs, the gaze is drawn a few metres toward the point where the two fronts meet as they close)
  const wallPoi = (time, u) => {
    const uu = Math.min(u, uCrest); path.pointAt(uu, frontV); hero.setBore(boreAt(uu)); frontV.x -= 5 + 9 * smoothstep(0.12, 0.16, u);      // (as the wall arrives the gaze runs down it to the right: it stands obliquely across the frame, with its riders and the junk it is taking)
    if (rare) { const xm = wall.xAt(HU.uBoreZ.value) + HU.uCrossD.value; frontV.x += clamp(xm - frontV.x, -8, 8) * smoothstep(0.1, 0.14, u) * (1 - smoothstep(uToe - 0.02, uToe, u)); }
    frontV.z = hero.frontZ(frontV.x, frontV.z) - 2; frontV.y = 2.6; hero.setBore(boreAt(u)); return frontV;
  };
  // the cutback: a point on the crest down the front on the river side, far along at first (the wave runs away to the right of
  // the frame with its riders and the junk it lifts), then close by (the gaze turns into the face and the wall of water
  // stands across the whole frame)
  const facePoi = (time, u) => {
    path.pointAt(u, faceV); hero.setBore(boreAt(u));
    faceV.x += lerp(105, 17, smoothstep(uC[1] + 0.005, uC[2] - 0.008, u)); faceV.z = hero.frontZ(faceV.x, faceV.z) - 1; faceV.y = lerp(3.4, 4.4, smoothstep(uC[1] + 0.01, uC[2] - 0.005, u)); return faceV;
  };
  // caught again: the gaze runs along the face toward the wall, where the plume stands
  const leftPoi = (time, u) => { path.pointAt(u, leftV); hero.setBore(boreAt(u)); leftV.x -= 46; leftV.z = hero.frontZ(leftV.x, leftV.z) - 3; leftV.y = 3.2; return leftV; };
  const head = [A.pagodaBase.x * 0.6, 46, A.pagodaBase.z];
  return [
    // the wall itself, held in the gaze while the boat wheels under us, let go as the toe reaches the bow
    ...[0, 1, 2].map(() => ({ at: wallPoi, from: -0.06, to: uCrest + 0.012, weight: 1, fade: (uCrest + 0.012 - uToe + 0.012) / (uCrest + 0.072) })),
    { at: [A.pagodaTip.x, 70, A.pagodaTip.z], from: uCrest, to: uA + 0.085, weight: 0.3, fade: 0.3 },
    ...[0, 1, 2, 3, 4, 5].map(() => ({ at: facePoi, from: uC[0] + 0.03, to: uC[2] + 0.04, weight: 0.8, fade: 0.2 })),
    ...[0, 1].map(() => ({ at: leftPoi, from: uC[3] - 0.045, to: uC[3] + 0.075, weight: 0.45, fade: 0.3 })),
    // the run-in: the gaze goes a little right, to the headland and its pagoda, so the face beside us does not fill the frame; then to the plume
    { at: head, from: uC[3] + 0.05, to: uJ + 0.03, weight: 0.35, fade: 0.35 },
    { at: (time, u) => { hero.setBore(boreAt(u)); hero.plumeAt(plumeV); plumeV.y = 13; return plumeV; }, from: uJ - 0.05, to: 0.82, weight: 0.2, fade: 0.25 },      // (the plume's place is worked out here from u, as the other gaze points do: the bore stands where this u puts it, which is also what update() sets)
    { at: head, from: 0.8, to: 1, weight: 0.3, fade: 0.25 },
  ];
}
// </flight>

export default {
  id: 'silver-dragon-bore',
  name: 'The Silver Dragon',
  category: 'city',
  weirdness: 0.12,
  media: ['water', 'air'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const vr = rng.fork('sdb-look'), lr = vr(), cumN = 7 + Math.floor(vr() * 8), kiteShift = Math.floor(vr() * 8);      // (also by seed: how many cumulus, which kites)
    const pick = LOOKS[lr < 0.36 ? 0 : lr < 0.66 ? 1 : lr < 0.88 ? 2 : 3];
    const hourId = HOURS[vary.hour] ? vary.hour : pick.hour, Hh = HOURS[hourId], night = hourId === 'night';
    const rare = !!vary.rare, density = clamp(vary.density ?? 1, 0.7, 1.3), duration = 50, lowSun = hourId === 'golden' || hourId === 'dawn', mood = clamp(vary.mood ?? 0.5, 0, 1);      // (mood: which way the wind leans, how thick the haze is, how many of the far junks are away)
    const scene = new THREE.Scene(), T = { value: 0 };
    await ctx.yield();

    // ----- sky, light, fog -----
    // (no bake for the night dome: in the kit it is one step of 90 to 105 ms here, and the moon and the faint milky way are cheap enough drawn live)
    const sky = makeSky({ rng, ...Hh.sky, ground: Hh.fog, renderer: ctx.renderer, bake: false });
    await ctx.yield();
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(C(Hh.fog), Hh.density * lerp(0.85, 1.2, mood));
    await ctx.yield();
    const rig = makeLightRig(sky, { bounce: night ? 0.35 : 0.55, ambient: night ? 1 : 1.1 }); scene.add(rig.object);
    const SUN = sky.lightDirection.clone().normalize();
    await ctx.yield();

    // ----- the hero: river, bore, seawall, gate, bluff, pagoda -----
    const hero = await buildHero(ctx, { look: pick.hero, hour: hourId, rare, density, land: false, boreZ: 900, crossAt: 536, sprayNear: [20, 120], light: { ...Hh.hero, sunDir: [SUN.x, SUN.y, SUN.z] } });
    scene.add(hero.object);
    const A = hero.anchors, wall = A.wall, ZE = wall.zEnd;
    await ctx.yield();

    // ----- the flight (see planFlight) -----
    const FL = await planFlight(hero, duration, () => ctx.yield());
    const { path, boreAt, uA, uJ, uC, uToe, uCrest, R, Cx, Cz, J0, dg } = FL, tp = new THREE.Vector3(), tg0 = new THREE.Vector3();
    const EX = FL.EX, EZ = FL.EZ;                                       // the entry point; the opening looks toward +Z
    hero.setBore(boreAt(0));
    await ctx.yield();

    // ----- shared uniforms for this world's own shaders -----
    const sunCol = C(Hh.hero.sunColor).multiplyScalar(Hh.hero.sunIntensity / Math.PI), amb = new THREE.Color().setRGB(Hh.hero.sky[0], Hh.hero.sky[1], Hh.hero.sky[2]).multiplyScalar(0.75 / Math.PI);
    amb.r += Hh.hero.ground[0] * 0.5; amb.g += Hh.hero.ground[1] * 0.5; amb.b += Hh.hero.ground[2] * 0.5;
    const WIND = new THREE.Vector3(-0.24, 0, -0.97).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), (mood - 0.5) * 40 * DEG);
    hero.uniforms.uWind.value.set(WIND.x, WIND.z);
    const U = { uTime: T, uSunDir: { value: SUN }, uSunCol: { value: sunCol }, uAmb: { value: amb }, uCol: { value: C('#c0281e') }, uHem: { value: C('#e0b040') } };

    // ----- far land: the bank behind the dyke, the city on its hillside, hills, two pagodas on the city's ridge -----
    let cityHillAt = null, winGeoLate = null;
    {
      const g = makeGeo(), grass = C('#58703d'), far = C('#7f8f58'), roofs = C('#5d6660'), col = new THREE.Color();
      const offs = [3, 0, -12, -44, -70, -300, -1200, -3400];
      const row = (z) => offs.map((o, i) => {
        const inWall = z >= 0 && z <= ZE, y = inWall ? [4.2, 4.2, 4.2, 4.2, 3.6, 3.5, 4, 7][i] : z < 0 ? [-3, 5, 8.6, 6, 4, 3.5, 4, 7][i] : [-3, 0.8, 2.5, 3.5, 3.5, 3.5, 4, 7][i];
        return inWall ? wall.pointAt(z, Math.min(o, -44), y).toArray() : [wall.xAt(z) + o, y, z];
      });
      const zs = [];
      for (const [from, to, step] of [[-1800, -40, 220], [-40, 0, 40], [0, ZE, ZE / 26], [ZE, ZE + 60, 60], [ZE + 60, 4200, 280]]) { const n = Math.max(1, Math.round((to - from) / step)); for (let i = zs.length ? 1 : 0; i <= n; i++) zs.push(from + ((to - from) * i) / n); }
      let prev = row(zs[0]);
      for (let j = 1; j < zs.length; j++) {
        const cur = row(zs[j]);
        for (let i = 0; i < offs.length - 1; i++) {
          col.copy(i > 3 ? far : grass).lerp(roofs, i === 4 ? 0.5 : 0).multiplyScalar(0.9 + 0.2 * ((j * 7 + i * 3) % 5) / 4);
          g.col(col).quad(prev[i], cur[i], cur[i + 1], prev[i + 1]);
        }
        prev = cur;
      }
      const bank = new THREE.Mesh(g.build(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); bank.name = 'bank'; scene.add(bank);
      await ctx.yield();
      // the city behind the seawall on its hillside (round 10; its own random stream: nothing else moves), windows alight at the lantern hours
      const winGeo = Hh.lamp > 0 ? makeGeo() : null;
      const city = await buildCity(ctx.noise, makeRng(((ctx.seed ?? 1) ^ 0x2f6e11) >>> 0), wall, ctx, density, winGeo);
      await ctx.yield();
      const town = new THREE.Mesh(city.geo, bank.material); town.name = 'hill-town'; scene.add(town); cityHillAt = city.hill;
      await ctx.yield();
      winGeoLate = winGeo;      // (the mesh is made further down, once the lanterns set adrift on the river have been added to it)
      const pal = { ridge: C(Hh.ridge), ridgeLit: C(Hh.ridgeLit), haze: C(Hh.haze) }, sx = SUN.x > 0 ? 1 : -1;
      const ridgeGeo = await buildRidges(ctx.noise, [
        { pts: [[-1250, -2300], [-1350, -1300], [-1150, -350], [-1050, 500], [-850, 1350], [-520, 2200], [-250, 3200]], H: 190, base: 2, haze: 0.36, seed: 3.1, sun: -sx, pagodas: [0.36, 0.58] },
        { pts: [[-2500, -3400], [-2700, -1600], [-2450, 0], [-2100, 1600], [-1500, 3300]], H: 320, base: 0, haze: 0.62, seed: 7.7, sun: -sx },
        { pts: [[-1700, -1950], [-700, -2150], [250, -2350], [1200, -2550], [2300, -2450], [3500, -2000]], H: 230, base: 0, haze: 0.42, seed: 11.3, sun: sx },
        { pts: [[-3400, -3700], [-1200, -4000], [1000, -4250], [3200, -4000], [5400, -3200]], H: 400, base: 0, haze: 0.68, seed: 17.9, sun: sx },
        { pts: [[5300, -2700], [5750, -900], [5900, 1000], [5650, 3000]], H: 150, base: 0, haze: 0.86, seed: 23.3, sun: sx },
        { pts: [[1900, 4300], [3100, 4700], [4400, 4500]], H: 90, base: 0, haze: 0.9, seed: 29.1, sun: sx },
      ], pal, ctx);
      await ctx.yield();
      const ridges = new THREE.Mesh(ridgeGeo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }));
      ridges.name = 'ridges'; scene.add(ridges);
    }
    await ctx.yield();

    // ----- junks at anchor (they rear as the front reaches them) and far sails under way -----
    const HT = (x, z, t) => hero.heightAt(x, z, t);
    // a junk is four times as long as the face is deep: as the crest goes under her she is seated deeper in it (her hull
    // ploughs the lip), or bow and rudder would hang clear of the water
    const HTJ = (x, z, t) => { const s = z - hero.frontZ(x, z); return hero.heightAt(x, z, t) - 1.25 * Math.exp(-s * s / 45); };
    await ctx.yield();
    const mats = S.makeMaterials({ night: Hh.lamp >= 1 ? 0.9 : Math.max(Hh.lamp * 0.6, 0.25), streetY: 0, nightFill: Hh.lamp >= 1 ? [0.1, 0.13, 0.22] : Hh.lamp > 0 ? [1.3, 0.95, 0.75] : [2.7, 2.4, 2.1] });
    await ctx.yield();
    mats.setSky({ top: Hh.hero.zenith, horizon: Hh.hero.horizon, sun: Hh.hero.sunColor, sunDir: [SUN.x, SUN.y, SUN.z] });
    await ctx.yield();
    const jr = rng.fork('junks'), junkAt = [], junkH = [];
    const lf = [-dg[1], dg[0]];                                       // left of the diagonal
    // (round 12: tried and taken out again: moving every junk that is moored nearer than 24 m or 34 m to the route straight out from
    // it. She was smaller as she left the frame but stood at its edge for twice as long, and the junk the wall takes in front of
    // us as we wheel was no longer there. The berths are as they were.)
    const addJunk = (x, z, h, hr = jr) => {      // (hr: the random stream a heading is drawn from when none is given)
      const q = path.nearestXZ(x, z);
      if (q.dist > 15) { junkAt.push([x, 0, z]); junkH.push(h ?? -Math.PI / 2 + hr.range(-0.3, 0.3)); }
    };
    // Every visit finds the fleet moored differently: each junk is shifted from its berth by seed (the composed ones a
    // little, the far ones a lot) and a few of the far ones are away. None closer than 28 m to another.
    const jit = (r) => jr.range(-r, r), apart = (x, z) => !junkAt.some((j) => Math.hypot(j[0] - x, j[2] - z) < 28);
    // the opening: a junk at anchor close by on the right as we set out and one further off on the left, turned to show their
    // sails; then, in front of the coming wall, one a little left of where we look and one far off that the wall takes first
    addJunk(EX - 17 + jit(1.2), EZ + 60 + jit(3), -Math.PI / 2 - 0.75 + jit(0.2)); addJunk(EX + 40 + jit(5), EZ + 150 + jit(8), -Math.PI / 2 + 0.6 + jit(0.25));
    addJunk(Cx + 54 + jit(4), Cz + R + 21 + jit(4), Math.PI / 2 - 0.3 + jit(0.2));
    addJunk(Cx + 9 + jit(5), Cz + R + 74 + jit(8), -Math.PI / 2 + 0.2 + jit(0.3));
    // and the one the wall takes right in front of us as we wheel, bow to the wave: when the wall towers over our own bow her sails stand over its lip
    // (she lies 36 m down the wall to the right of the bow, where the gaze is drawn as the wall arrives: at that moment the face is
    // under her, her bow in the lip and her stern at the toe, and she is seen whole from the calm side, not as a sail over the crest)
    const iFocal = junkAt.length; addJunk(Cx - 34 + jit(0.6), Cz + R + 4.5 + jit(0.6), Math.PI / 2 - 0.45 + jit(0.2));
    const focal = junkAt.length > iFocal ? { x: junkAt[iFocal][0], z: junkAt[iFocal][2], h: junkH[iFocal] } : null;
    // one at anchor ahead and to the right of the first run across the face (on the moon's side of the bow), one on the calm
    // water the cutback swings across, one close on the right of the run back to the wall
    addJunk(J0.x + (FL.K0 - 5) * dg[0] + 19.3 * dg[1] + jit(1), J0.z + (FL.K0 - 5) * dg[1] - 19.3 * dg[0] + jit(1), -Math.PI / 2 + 0.5 + jit(0.2));
    // (a place said from a landmark of the cutback: from where the route's own landmark k lies, uC[k] with nothing added or taken,
    // al metres on along our heading there and rt metres to the right of it)
    const mark = (k, al, rt) => { path.pointAt(uC[k], tp); path.tangentAt(uC[k], tg0); const l = Math.hypot(tg0.x, tg0.z) || 1; return [tp.x + (tg0.x / l) * al - (tg0.z / l) * rt, tp.z + (tg0.z / l) * al + (tg0.x / l) * rt]; };
    // the one the cutback swings across lies outside the second carve: a junk's length (19 m) short of the place where the carve
    // ends and 28 m to the river side of our heading there (the gap the junks keep)
    { const c = mark(3, -19, 28); addJunk(c[0] + jit(2), c[1] + jit(3), -Math.PI / 2 - 0.5 + jit(0.2)); }
    // the one on the right of the run back to the wall lies half-way between the place where the second carve ends and the place
    // where we come to the wall (two landmarks of the route), a junk's length (19 m) to the river side of our line there
    { const a = path.pointAt(uC[3], new THREE.Vector3()), b = path.pointAt(uC[4], new THREE.Vector3()), q = path.nearestXZ((a.x + b.x) / 2, (a.z + b.z) / 2);
      path.pointAt(q.u, tp); path.tangentAt(q.u, tg0); const l = Math.hypot(tg0.x, tg0.z) || 1;
      addJunk(tp.x - (tg0.z / l) * 19 + jit(0.8), tp.z + (tg0.x / l) * 19 + jit(0.8), -Math.PI / 2 + 0.35 + jit(0.15)); }
    // two junks moored where the cutback runs along the front of the wave: the crest takes each of them as we look at her. Each
    // berth is said from a landmark of the route itself (the place where the first carve ends, the place where the second begins):
    // 30 m down the front from our line there and 1 m behind the crest line as it stands when we are there, the same for both
    // (the crest is under her)
    // (round 10: the second of these berths is the great junk's, see below. A third junk of this run is moored 110 m down the front
    // from our line at that same landmark, or 14 m to either side of that if a junk lies there; the crest takes her with the great junk)
    const BJ = { S: 1.35, A: null, B: null };
    for (const [k, along, behind, great] of [[1, 30, 1, 0], [2, 30, 1, 1]]) {
      path.pointAt(uC[k], tp); hero.setBore(boreAt(uC[k]));
      const x = tp.x + along, z = hero.frontZ(x, tp.z) + behind;
      if (!great) { if (apart(x, z)) addJunk(x, z, Math.PI / 2 - 0.4 + jit(0.15)); continue; }
      const al = [110, 96, 124].find((a) => apart(tp.x + a, hero.frontZ(tp.x + a, tp.z) + 1));
      if (al) addJunk(tp.x + al, hero.frontZ(tp.x + al, tp.z) + 1, Math.PI / 2 - 0.4 + ctx.core.makeRng(ctx.core.hashSeed('junk-110:' + ctx.seed)).range(-0.15, 0.15));      // (her heading from a stream of her own: whether she finds a berth shifts no other draw)
      // the great junk's berth: on the front's own line as the bore's timetable has it when we are at this landmark of the route
      let xa = x; for (let k = 0; k < 3 && junkAt.some((j) => Math.hypot(j[0] - xa, j[2] - z) < 34); k++) xa += 14;
      BJ.A = { x: xa, z: hero.frontZ(xa, tp.z) + 1, h: Math.PI / 2 - 0.4 };
    }
    // The far junks, out on the river and along the seawall, have a random stream of their own, made from their name and the seed.
    // They are dealt anew here, once: where each lies within her 14 m, which of them are away, every heading. No draw is made any
    // more only to keep them as they were. (The two hull builds below fork from the fleet's stream after this point, so the hulls
    // are dealt anew with them.)
    const fj = ctx.core.makeRng(ctx.core.hashSeed('far-junks:' + ctx.seed)), fjit = (r) => fj.range(-r, r);
    for (const [dx, dz] of [[112, 215], [-60, 250], [70, 400], [-110, 120], [-165, 200], [150, 60]]) { const x = Cx + dx + fjit(14), z = Cz + dz + fjit(14), away = fj() < lerp(0.1, 0.45, mood); if (!away && apart(x, z)) addJunk(x, z, undefined, fj); }
    for (const [z0, off0, far] of [[335, 50, 0], [262, 56, 0], [190, 49, 0], [138, 66, 0], [300, 120, 1], [215, 150, 1], [90, 130, 1]]) {
      const p = wall.pointAt(z0 + fjit(14), off0 + (far ? fjit(14) : fj.range(0, 14)), 0), away = fj() < lerp(0.12, 0.5, mood) * far;
      if (!away && apart(p.x, p.z)) addJunk(p.x, p.z, undefined, fj);
    }
    // one more at anchor where the first carve of the cutback swings the gaze off the wave and across open water: she stands
    // 50 m down the line of sight at the middle of the carve, broadside on (added last and without a random draw, so every
    // other junk is where it was)
    { const um = uC[0] + 0.45 * (uC[1] - uC[0]); path.pointAt(um, tp); path.tangentAt(um + 0.008, tg0); const l = Math.hypot(tg0.x, tg0.z) || 1, x = tp.x + (tg0.x / l) * 50, z = tp.z + (tg0.z / l) * 50; if (apart(x, z)) addJunk(x, z, Math.PI / 2 - 0.6); }
    // and two for the second carve, where we swing away from the wave over open water: one close on the right as the gaze comes
    // round (35 m down the line at the start of the carve), one inside the turn that the wave takes beside us as it catches us
    // again (both added last and without a random draw)
    { const u2 = uC[2] + 0.029; path.pointAt(u2, tp); path.tangentAt(u2, tg0); const l = Math.hypot(tg0.x, tg0.z) || 1, x = tp.x + (tg0.x / l) * 35 - (tg0.z / l) * 8, z = tp.z + (tg0.z / l) * 35 + (tg0.x / l) * 8; if (apart(x, z)) addJunk(x, z, Math.PI / 2 - 0.6); }
    // (round 11: this last berth has a junk of its own, cream-sailed, of ordinary size, placed by update() like the great junk: see below.
    // In round 10 the great junk herself was moved here once we had carved away from her; with the steady camera she appeared from nothing.)
    // (her berth is said from the place where the second carve ends, a landmark of the route: a junk's length (19 m) on along our
    // heading there and a junk's length to the wall side of it)
    { const c = mark(3, 19, -19); if (apart(c[0], c[1])) BJ.B = { x: c[0], z: c[1], h: Math.PI / 2 - 0.25 }; }
    hero.setBore(boreAt(0));
    // two builds of one variant each (alternate junks): one kit call for both was a 32 ms step
    const junks = [];
    for (let k = 0; k < 2; k++) {
      const jb = S.makeBoats({ rng: jr.fork('hull' + k), types: ['junk'], variants: 1, positions: junkAt.filter((_, i) => (i & 1) === k), headings: junkH.filter((_, i) => (i & 1) === k), heightAt: HTJ, moving: false, lit: Hh.lamp > 0 ? 1 : 0.2, mats,
        palette: { hull: k ? '#7c5436' : '#6f4a30', wood: '#5a3c28' } });
      scene.add(jb.object); junks.push(jb);
      await ctx.yield();
    }
    // ----- the great junk (round 10) -----
    // One large lit junk, a third longer than the rest, saffron sails, lanterns strung from stem to mastheads to stern. She is at
    // anchor 30 m down the front of the wave as we run along its foot: the crest takes her bow first and she rears up the face as
    // we look at her (u 0.41 to 0.45). She stays at that berth for the whole flight. One mesh, placed by update(): the kit's fleet
    // rides the river on four soundings and hardly pitches on a face 5 m deep, she is given her own.
    const bigJ = S.makeBoats({ rng: ctx.core.makeRng(ctx.core.hashSeed('great-junk:' + ctx.seed)), types: ['junk'], variants: 1, positions: [[0, 0, 0]], headings: [0], moving: false, lit: Hh.lamp > 0 ? 1.5 : 0.25, mats,
      palette: { hull: '#7a4a2c', wood: '#5e3e28', sail: '#d9a233', trim: '#c8382a', cabin: '#8a3a28', inner: Hh.lamp > 0 ? '#8a6a44' : '#5a4630' } });      // (by day no lamp light gilds her hull, and her well is in shade)
    bigJ.object.matrixAutoUpdate = false; bigJ.object.name = 'great-junk'; scene.add(bigJ.object);
    await ctx.yield();
    {
      const g = makeGeo(), white = C('#ffffff'), cap = C('#1a100a');
      const lines = [[[9.3, 3.5], [4.56, 11.9], 8, 0.5], [[4.56, 11.9], [-2.28, 14.9], 6, 0.7], [[-2.28, 14.9], [-9.4, 5.8], 11, 0.9]];
      for (const [a, b, n, sag] of lines) for (let i = 1; i <= n; i++) {
        const t = i / (n + 1), x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t) - sag * 4 * t * (1 - t) - 0.3, zz = 0.5 * Math.sin(i * 2.4 + a[0]) * 0.3, r = i % 3 === 0 ? 0.2 : 0.16;
        g.col(white, 1).tube([x, y - 0.2, zz], [x, y, zz], r * 0.55, r, 6).tube([x, y, zz], [x, y + 0.2, zz], r, r * 0.55, 6);
        g.col(cap, 0.1).tube([x, y + 0.2, zz], [x, y + 0.26, zz], r * 0.6, r * 0.6, 4);
      }
      const festoon = new THREE.Mesh(g.build(), new THREE.MeshBasicMaterial({ vertexColors: true, color: Hh.lamp > 0 ? C('#ffb45e').multiplyScalar(0.25 + 3.4 * Hh.lamp) : C('#c8382a').multiplyScalar(0.9) }));
      festoon.name = 'great-junk-lanterns'; festoon.frustumCulled = false; bigJ.object.add(festoon);
    }
    if (!BJ.A) { BJ.A = BJ.B || { x: Cx + 300, z: Cz + 300, h: Math.PI / 2 }; BJ.B = null; }
    // the junk of the second berth, on the wall side of our line, where the wave lifts her over us as it catches us again: an
    // ordinary junk under cream sails, rearing up the face on her own soundings as the great junk does (the last draw from jr)
    let berthJ = null;
    if (BJ.B) {
      // (round 12: this build holds two hulls, the second is the ferry's, see below: one build for both keeps the draw calls down.
      // The kit draws for its boats one after the other, so the first is as she was.)
      berthJ = S.makeBoats({ rng: ctx.core.makeRng(ctx.core.hashSeed('berth-junk:' + ctx.seed)), types: ['junk'], variants: 1, positions: [[0, 0, 0], [0, 0, 0]], headings: [0, 0], moving: false, lit: Hh.lamp > 0 ? 1 : 0.2, mats,
        palette: { hull: '#6a4630', wood: '#5a3c28', sail: '#e2d6b6' } });
      berthJ.object.matrixAutoUpdate = false; berthJ.object.name = 'berth-junk'; scene.add(berthJ.object);
      await ctx.yield();
    }
    await ctx.yield();
    // ----- a lit junk under way before the bore (round 12) -----
    // She lies at anchor 110 m off the seawall and 165 m up river from the gate until the far front is within 260 m of her; then
    // she runs before it, slantwise across the open water toward the landing by the gate, and lies 64 m off the wall there when
    // it piles in. Her place along her lane is a function of where the front stands (river geometry alone): from our line along
    // the wall she is under way on the water between us and the gate. She is the sister of the junk at the second berth (cream
    // sails, the same build); only where there is no second berth has she a build of her own.
    const FY = { zA: 165, zB: 62, off: 0, q: { x: 0, z: 0, h: 0 }, st: { ph: 4.4, sink: 0 }, v: new THREE.Vector3() };
    const ferryAt = (z, out) => wall.pointAt(z, FY.off + lerp(64, 110, smoothstep(FY.zB, FY.zA, z)), 0, out);
    for (let k = 0; k < 4 && junkAt.some((j) => { for (let z = FY.zB; z <= FY.zA; z += 8) { ferryAt(z, FY.v); if (Math.hypot(j[0] - FY.v.x, j[2] - FY.v.z) < 24) return true; } return false; }); k++) FY.off += 14;      // (her lane lies clear of every junk at anchor)
    let ferry = null;
    if (!berthJ) {
      ferry = S.makeBoats({ rng: makeRng(((ctx.seed ?? 1) ^ 0x4d2f6b) >>> 0), types: ['junk'], variants: 1, positions: [[0, 0, 0]], headings: [0], moving: false, lit: Hh.lamp > 0 ? 1 : 0.2, mats,
        palette: { hull: '#6a4630', wood: '#5a3c28', sail: '#e2d6b6' } });
      ferry.object.matrixAutoUpdate = false; ferry.object.name = 'ferry-junk'; scene.add(ferry.object);
    }
    const berthI = berthJ ? berthJ.boats[0] : null, ferryI = berthJ ? berthJ.boats[1] : ferry.boats[0];
    const putJ = (bt, M) => { bt.fleet.mesh.setMatrixAt(bt.idx, M); bt.fleet.mesh.instanceMatrix.needsUpdate = true; if (bt.fleet.rigMesh) { bt.fleet.rigMesh.setMatrixAt(bt.idx, M); bt.fleet.rigMesh.instanceMatrix.needsUpdate = true; } };
    await ctx.yield();
    // every junk of the fleet at anchor is placed by update() on her own soundings too (see rideM): the kit seats a boat on four
    // points and lets the crest pass through her hull
    const fleetJ = [];
    for (const jb of junks) for (const bt of jb.boats) fleetJ.push({ x: bt.x, z: bt.z, h: bt.h, mesh: bt.fleet.mesh, rig: bt.fleet.rigMesh || null, idx: bt.idx, ph: bt.ph, sink: 0 });
    // white water leaps along every hull at anchor while the lip is under it (and far off it is drawn large: a junk the far line takes is seen to be taken)
    hero.setHulls([...junkAt.map((j, i) => [j[0], j[2], junkH[i], 8.5]), [BJ.A.x, BJ.A.z, BJ.A.h, 11.5], ...(BJ.B ? [[BJ.B.x, BJ.B.z, BJ.B.h, 8.5]] : [])]);
    await ctx.yield();
    const fr = rng.fork('sails'), farAt = [], farH = [];
    for (let i = 0; i < 9; i++) { const z = fr.range(-500, 1700), x = wall.xAt(z) + fr.range(560, 1700); farAt.push([x, 0, z]); farH.push(fr.range(0, Math.PI * 2)); }
    const sails = S.makeBoats({ rng: fr, types: ['junk'], variants: 1, positions: farAt, headings: farH, heightAt: HT, speed: 2.4, lit: 1, mats });
    scene.add(sails.object);
    await ctx.yield();

    // ----- egrets fleeing the bore, birds round the pagoda -----
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    const egret = { body: '#f6f3ec', belly: '#ffffff', wingC: '#f3f0e8', tip: '#e6e2d8', trail: '#ece9e0', head: '#f6f3ee', neckC: '#f4f1ea', tailC: '#efece4', beak: '#e0b040', legC: '#23262b', neck: 0.42, legs: 0.9 };
    fauna.add(F.makeFlock({ rng: rng.fork('egrets-a'), species: 'flamingos', count: Math.round(13 * density), size: 2.3, palette: egret, spacing: 3.4,
      cross: { path, u: 0.055, lead: 40, angle: 170, side: 1, height: 7.5, span: 560, offset: 9, rise: 5, duration } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('egrets-b'), species: 'flamingos', count: Math.round(9 * density), size: 2.2, palette: egret, spacing: 3.2, wander: [0.4, 0.35, 0.4, 0.45],
      along: { path, side: 15, up: 7, lead: 62, from: uA - 0.01, to: 0.86, drift: 10 } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('egrets-c'), species: 'flamingos', count: 7, size: 2.2, palette: egret, spacing: 3.2,
      cross: { path, u: uA + 0.07, lead: 75, angle: 28, side: -1, height: 9, span: 520, offset: -22, rise: 8, duration } }));
    fauna.add(F.makeFlock({ rng: rng.fork('swifts'), species: 'swifts', count: Math.round(34 * detail), center: [A.pagodaBase.x, 78, A.pagodaBase.z], radius: 46, height: 14, wander: [9, 5, 8, 0.7] }));
    // gulls put up by the crest: a loose flock low over the wave on our left hand, for the whole of the run out along its front
    // and the carve back (from the first carve to the end of the second: the flight's own landmarks). An rng of their own.
    fauna.add(F.makeFlock({ rng: makeRng(((ctx.seed ?? 1) ^ 0x2e71c5) >>> 0), species: 'gulls', count: Math.round(16 * (0.6 + 0.4 * detail)), size: 1.7, spread: [20, 3, 26], wander: [2, 1.2, 2, 0.35], maxSigma: 3,
      along: { path, side: -9, up: 10.2, lead: 30, from: uC[0], to: uC[3], drift: 6 } }));      // (the cure: the flock now flies some 10 m over our line and no longer about it)
    await ctx.yield();

    // ----- tide-riders on the face (a whole fleet when the rare crossing tide runs) -----
    // Every rider has a lane of its own. Across the face they are strung out toward the wall (to the left of the bow); along
    // the wall two stay between us and the masonry, the rest of that file drops back over the crest and the fleet's other
    // half comes up on the river side. No two lanes are closer than 4 m, and neighbours ride at different heights on the face.
    const rr = rng.fork('riders'), riders = [];
    // (a lane: metres along the front from our line on the open river, the same along the wall, how far ahead of the crest, whether
    // it stays for the wall; then, for the two toward the wall, how far ahead of the crest along the wall (one low and near, one high
    // and far, so that they never ride one over the other) and how far to the river side they wait for the wave before the catch)
    const lanes = [[-18, -6.5, -4.0, 1, -4.1, 33.7], [-33, -16, -3.4, 1, -2.3], [15, 7.5, -3.1, 1], [52, 12.5, -4.0, 1], [66, 17.5, -2.7, 1], [-50, -15, -3.3, 0], [-68, -19, -2.6, 0], [-90, -23, -2.9, 0], [84, 23, -3.4, 1]];      // (the river-side lanes keep clear of the two junks the cutback passes)      // (all below the pitching lip)
    const NR = rare ? lanes.length : 5;      // (three of the five ride on the river side: in the cutback they are on the face ahead of us)
    for (let i = 0; i < NR; i++) riders.push({ offD: lanes[i][0] + rr.range(-2, 2), offW: lanes[i][1], s: lanes[i][2], stay: lanes[i][3], sW: lanes[i][4] ?? lanes[i][2], pre: lanes[i][5] ?? 0, rate: rr.range(0.3, 0.55), ph: rr.range(0, 6.28), sc: rr.range(0.92, 1.1) });
    const boatMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.82, metalness: 0, side: THREE.DoubleSide, emissive: C(Hh.hero.horizon).multiplyScalar(night ? 0.05 : lowSun ? 0.04 : 0.1) });
    // the riders toward the wall do not follow our cutback: across it they hold a straight line from where we leave the face to
    // where we reach the wall, so we carve away from them and are among them again at the wall
    const fleetA = path.pointAt(uC[0], new THREE.Vector3()), fleetB = path.pointAt(uC[4], new THREE.Vector3());
    const yawAt = (uu) => { path.tangentAt(uu, tg0); return Math.atan2(-tg0.x, -tg0.z); }, fleetYawA = yawAt(uC[0] - 0.004), fleetYawB = yawAt(uC[4] + 0.004);
    const riderMesh = new THREE.InstancedMesh(buildRiderGeometry(), boatMat, NR); riderMesh.frustumCulled = false; riderMesh.name = 'tide-riders'; scene.add(riderMesh);
    const riderSilk = silkMaterial(U, { uBend: { value: 0 }, uAmp: { value: 1.1 }, uLift: { value: 0 }, uDirL: { value: WIND.clone() }, uDirR: { value: new THREE.Vector3(-0.1, 0, -1).normalize() } });
    const riderFlags = new THREE.InstancedMesh(silkGeometry([{ base: [0.5, 2.3, 0.12], H: 1.1, L: 1.9, side: 1 }], 8, 3), riderSilk, NR); riderFlags.frustumCulled = false; riderFlags.name = 'rider-flags'; scene.add(riderFlags);
    await ctx.yield();

    // ----- our own sampan: bow, spar, poles, pennants, lanterns (placed from the camera every frame) -----
    const veh = new THREE.Mesh(buildVehicleGeometry(lowSun ? 0.72 : 1), boatMat); veh.name = 'sampan'; veh.frustumCulled = false; veh.matrixAutoUpdate = false; scene.add(veh);
    const ownSilk = silkMaterial(U, { uBend: { value: 0 }, uAmp: { value: 0.8 }, uLift: { value: 1 }, uDirL: { value: new THREE.Vector3(0, 0, 1) }, uDirR: { value: new THREE.Vector3(0, 0, 1) } });
    // (the poles, their pennants and lanterns are a rig of their own: for the first half of the flight it is kept astern of the
    // eye, out of the frame, or the two poles and the spar stood round the opening views like the border of a pane)
    const rigMesh = new THREE.Mesh(buildVehicleGeometry(1, true), boatMat); rigMesh.name = 'sampan-rig'; rigMesh.frustumCulled = false; rigMesh.matrixAutoUpdate = false; scene.add(rigMesh);
    const flags = new THREE.Mesh(silkGeometry([{ base: [-2.61, 1.15, -2.53], H: 0.6, L: 0.92, side: -1 }, { base: [2.62, 1.15, -2.53], H: 0.6, L: 0.92, side: 1 }], 12, 4), ownSilk);
    flags.name = 'pennants'; flags.frustumCulled = false; flags.matrixAutoUpdate = false; scene.add(flags);
    const bowSilk = silkMaterial(U, { uBend: ownSilk.uniforms.uBend, uAmp: ownSilk.uniforms.uAmp, uLift: { value: 1 }, uDirL: ownSilk.uniforms.uDirL, uDirR: { value: new THREE.Vector3(0, 0, 1) } });
    const bowCloth = new THREE.Mesh(silkGeometry([{ base: [0, -1.5, -4.33], H: 0.14, L: 0.55, side: 1 }], 12, 4), bowSilk);
    bowCloth.name = 'bow-cloth'; bowCloth.frustumCulled = false; bowCloth.matrixAutoUpdate = false; scene.add(bowCloth);
    const lampCol = C('#ffb45e').multiplyScalar(0.25 + 3.2 * Hh.lamp);
    if (Hh.lamp === 0) lampCol.set('#c8382a').multiplyScalar(0.9);
    const lanterns = new THREE.Mesh(buildLanternGeometry(), new THREE.MeshBasicMaterial({ vertexColors: true, color: lampCol })); lanterns.name = 'sampan-lanterns'; lanterns.frustumCulled = false; lanterns.matrixAutoUpdate = false; scene.add(lanterns);
    await ctx.yield();

    // ----- kites over the promenade -----
    const kr = rng.fork('kites'), kiteList = [], kcols = ['#c0281e', '#e0b040', '#f1ead8', '#2f8f86', '#c0281e', '#e9772c', '#f1ead8', '#31508c', '#7a3a8c', '#e0b040', '#3f9a4a'];
    const NK = Math.round(13 * (0.6 + 0.4 * detail));
    for (let i = 0; i < NK; i++) {
      const z = 40 + 640 * Math.pow((i + kr()) / NK, 1.3), b = wall.pointAt(z, -kr.range(5, 15), 10.3), d = kr.range(22, 60), h = kr.range(24, 72);
      const nearG = 1 - smoothstep(300, 420, z);      // (none over the last of our line, where only their tails hung cut off into the top corner of the frame; the next ones up the wall fly further over the town)
      const kite = { base: [b.x, b.y, b.z], pos: [b.x + WIND.x * d - kr.range(0, 20) - 40 * nearG, b.y + h * (1 - 0.2 * nearG), b.z + WIND.z * d], size: kr.range(1.7, 3.3), phase: kr.range(0, 6.28), col: C(kcols[(i * (1 + (kiteShift % 3)) + kiteShift) % kcols.length]) };
      if (z > 300) kiteList.push(kite);
    }
    // and over the last 300 m of wall before the gate (round 10): big festival kites, flown low over the roofs just behind the
    // promenade, so that from our line they hang over the wall ahead and leave the frame by its side, behind the plume, never as
    // a tail cut off in its top corner
    const NK2 = Math.round(9 * (0.6 + 0.4 * detail));
    for (let i = 0; i < NK2; i++) {
      const z = 44 + 262 * ((i + kr()) / NK2), b = wall.pointAt(z, -kr.range(6, 17), 10.3), q = wall.pointAt(z, -kr.range(22, 52), 10.3 + kr.range(12, 24)), d = kr.range(4, 14);
      kiteList.push({ base: [b.x, b.y, b.z], pos: [q.x + WIND.x * d, q.y, q.z + WIND.z * d], size: kr.range(3, 4.8), phase: kr.range(0, 6.28), col: C(kcols[(i * (2 + (kiteShift % 3)) + kiteShift + 3) % kcols.length]) });
    }
    const KU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: T, uPix: { value: 0.002 }, uWind: { value: new THREE.Vector2(WIND.x, WIND.z) }, uSunCol: U.uSunCol, uAmb: U.uAmb, uHaze: { value: C(Hh.fog) }, uGlow: { value: night ? 0.62 : 0.1 * Hh.lamp },
      uKLamp: { value: Hh.lamp > 0 ? C('#ffb45e').multiplyScalar(0.6 + 3.6 * Hh.lamp) : C('#c8382a').multiply(sunCol.clone().multiplyScalar(0.6).add(amb)) } };      // (by night a lamp under every kite, and the town's light on its paper: under the moon alone they could not be made out)
    const kites = new THREE.Mesh(kiteGeometry(kiteList), new THREE.ShaderMaterial({ vertexShader: KITE_VERT, fragmentShader: KITE_FRAG, uniforms: KU, side: THREE.DoubleSide, fog: true }));
    kites.name = 'kites'; kites.frustumCulled = false; scene.add(kites);
    await ctx.yield();

    // ----- the calm river at the opening: stakes and float lines, resting gulls, drifting leaves -----
    if (focal) { hero.uniforms.uBurst.value.set(focal.x, focal.z, Math.cos(focal.h) * 8.5, Math.sin(focal.h) * 8.5); hero.uniforms.uBurstK.value = 1; }      // white water bursts along her hull as the lip goes under her
    const HU = hero.uniforms, boreU = { uTime: HU.uTime, uBoreZ: HU.uBoreZ, uLead: HU.uLead, uPlume: HU.uPlume, uSeed: HU.uSeed, uRare: HU.uRare, uCrossD: HU.uCrossD };
    // (FAN: where the cutback runs out in front of the wave, and which way)
    path.pointAt(uC[1], tp); path.tangentAt(0.5 * (uC[1] + uC[2]), tg0);
    const FAN = { x: tp.x, z: tp.z, dx: tg0.x / (Math.hypot(tg0.x, tg0.z) || 1), dz: tg0.z / (Math.hypot(tg0.x, tg0.z) || 1) };
    // ----- fishing sampans at anchor, a lamp in every bow (round 12) -----
    // Small lit boats on the water the eye looks across: by the entry, on the calm river the cutback runs out onto (the left of the
    // frame while the wave stands on the right), inside the second carve, on the river side of the run-in and of the seawall, in
    // the basin before the gate. Each is placed by the geometry of the route (so many metres along and off a stretch of it, never
    // nearer than 13 m), clear of every junk and of the ferry's lane; each rides the river on her own soundings and is lifted
    // over the bore, never hidden. One instanced draw, a random stream of its own.
    const sr = makeRng(((ctx.seed ?? 1) ^ 0x6c3a59) >>> 0), sampans = [];
    // (the line of the run out in front of the wave: the straight line from the place where the first carve ends to the place where
    // the second begins, two landmarks of the route. runPt: the point al metres along it from the first, on past the second too,
    // and lat metres to its left, the calm side)
    const runA = path.pointAt(uC[1], new THREE.Vector3()), runB = path.pointAt(uC[2], new THREE.Vector3()), runL = Math.hypot(runB.x - runA.x, runB.z - runA.z) || 1;
    const runPt = (al, lat) => { const dx = (runB.x - runA.x) / runL, dz = (runB.z - runA.z) / runL; return [runA.x + dx * al + dz * lat, runA.z + dz * al - dx * lat]; };
    const addSampan = (x, z, hd) => {
      const q = path.nearestXZ(x, z);
      if (q.dist < 13) { path.pointAt(q.u, tp); const k = 13 / Math.max(q.dist, 0.5); x = tp.x + (x - tp.x) * k; z = tp.z + (z - tp.z) * k; }
      if (z > -5 && z < ZE && x - wall.xAt(z) < 12) return;                                          // (not against the stone)
      if (z > FY.zB - 16 && z < FY.zA + 25 && Math.abs(x - ferryAt(clamp(z, FY.zB, FY.zA), FY.v).x) < 9.5) return;      // (not in the ferry's lane)
      if (z < 0 && x < 200) return;
      if (junkAt.some((j) => Math.hypot(j[0] - x, j[2] - z) < 17) || sampans.some((b) => Math.hypot(b.x - x, b.z - z) < 9)) return;
      if (Math.hypot(BJ.A.x - x, BJ.A.z - z) < 22 || (BJ.B && Math.hypot(BJ.B.x - x, BJ.B.z - z) < 17)) return;
      sampans.push({ x, z, yaw: hd + sr.range(-0.6, 0.6), ph: sr.range(0, 6.28), sc: sr.range(0.96, 1.14) });
    };
    {
      const fp = (al, lat) => [FAN.x + FAN.dx * al + FAN.dz * lat, FAN.z + FAN.dz * al - FAN.dx * lat], fanYaw = Math.atan2(-FAN.dx, -FAN.dz);
      for (const [dx, dz, hd] of [[8, 50, 2.6], [-9, 33, 0.4], [21, 70, 3.5], [3, 112, 2.2], [16, 152, 4.1], [-22, 96, 1.2]]) addSampan(EX + dx, EZ + dz, hd);
      for (const [al, lat] of [[-8, 15], [16, 10], [40, 24], [62, 11.5], [86, 28], [112, 15], [30, 44], [95, 50], [-30, 30]]) { const c = fp(al, lat); addSampan(c[0], c[1], fanYaw + 1.2); }
      // From here on each berth but four is a mooring at even metres along a line of the river or of the seawall, wherever that
      // falls along the flight (the four: the one half-way inside the second carve and the three typed places in the basin, each
      // said at its line); a mooring in a junk's swing is not taken. (The sampans from here on are dealt anew once: which moorings are
      // free, and with that each one's turn, bob and size from their stream.)
      // By the second carve: one inside it, half-way between the place where it begins and the place where it ends (two landmarks
      // of the route); and outside it 35 and 70 m on from the place where it begins, along our heading there (the line we leave as we
      // carve away), 13 m to its right, the least a sampan keeps from a line of ours. (35 m: the gap the junks keep and a sampan's length more.)
      { const e = path.pointAt(uC[3], new THREE.Vector3()); addSampan((runB.x + e.x) / 2, (runB.z + e.z) / 2, 0.8); }
      for (let k = 1; k <= 2; k++) { const c = mark(2, 35 * k, 13); addSampan(c[0], c[1], 0.8); }
      // On the river side of the run back to the wall: 35 and 70 m on from the place where the second carve ends, along our heading
      // there, 20 m to its right (as far off as the sampans on the wave's side of the run along the front lie from its line, below).
      for (let k = 1; k <= 2; k++) { const c = mark(3, 35 * k, 20); addSampan(c[0], c[1], 5.2); }
      // Off the seawall: one in the middle of every 35 m of wall, counted toward the gate from the place where our line comes to the
      // wall, in the file of the junks moored off this wall (50 m off the stone, every other one a sampan's length further out).
      { const zW = path.pointAt(uJ, tp).z; for (let k = 0; k < 6; k++) { const p = wall.pointAt(zW - 35 * (k + 0.5), 50 + 7 * (k % 2), 0, FY.v); addSampan(p.x, p.z, 3.9 + k); } }
      for (const [x, z] of [[15.5, 60], [44, 108], [56, 76]]) addSampan(x, z, 2.4);
      // and along the whole of the run out in front of the wave: ten moorings, one at every 15 m of its line (two sampan lengths and
      // room to swing), from the place where the run begins on past the place where it ends, 135 m in all. Two on the wave's side, 20 m off
      // the line (midway between the lanes two riders of our company keep there, some 12 and 30 m off it), then one on the calm
      // side, 13 m off it (the least a sampan keeps from a line of ours).
      for (let k = 0; k < 10; k++) { const c = runPt(15 * k, k % 3 === 2 ? 13 : -20); addSampan(c[0], c[1], 1.2 + k); }
    }
    const NS = sampans.length, lampLit = Hh.lamp > 0;
    const sampanMesh = new THREE.InstancedMesh(buildSampanGeometry(lampLit ? C('#ffe2b0') : C('#c8382a')), boatMat, Math.max(NS, 1)); sampanMesh.count = NS; sampanMesh.frustumCulled = false; sampanMesh.name = 'sampans'; scene.add(sampanMesh);
    await ctx.yield();
    const flotsamGeo = await buildFlotsam(rng.fork('flotsam'), EX, EZ, C('#e6b422'), path, junkAt, ctx, FAN, uC, sampans);
    await ctx.yield();
    const flotsam = new THREE.Mesh(flotsamGeo, new THREE.ShaderMaterial({ vertexShader: FLOAT_VERT, fragmentShader: FLOAT_FRAG, side: THREE.DoubleSide, fog: true,
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...boreU, uSunDir: U.uSunDir, uSunCol: U.uSunCol, uAmb: U.uAmb } }));
    flotsam.name = 'flotsam'; flotsam.frustumCulled = false; scene.add(flotsam);
    await ctx.yield();

    // ----- lantern light along the wall (golden hour, dawn, night), sky lanterns under the moon; reflections on the river -----
    const set = fx.fxGroup(); scene.add(set.object);
    let sGlow = null, sBase = 0;
    const lampCandL = [0, 0, 0];      // (x, z, strength) of every lamp whose light can lie on the face of the wave; the first is the great junk's, kept up to date in update()
    const refl = [], warm = C('#ffab52'), rightOf = (u, r) => { path.pointAt(u, tp); path.tangentAt(u, tg0); const l = Math.hypot(tg0.x, tg0.z) || 1; return [tp.x - (tg0.z / l) * r, tp.z + (tg0.x / l) * r]; };
    if (!night) {      // the junks' red sails mirrored on the calm water
      const sailLit = C('#a8322a').multiply(sunCol.clone().multiplyScalar(0.55).add(amb.clone().multiplyScalar(1.1)));
      junkAt.forEach(([x, , z], i) => refl.push({ x, z, H: 13.5, w: 3.6, col: sailLit, k: 0.8, mode: 1, ph: i * 2.399 }));
    }
    if (Hh.lamp > 0) {
      // cabin lamps on the junks, and their light lying on the water
      const jp = [], lr2 = rng.fork('lamp-streaks');
      for (const [x, , z] of junkAt) {
        if (Math.hypot(x - EX, z - EZ) > 620) continue;
        jp.push([x, 2.6, z]);
        refl.push({ x, z, H: 6.4, w: 1.5, col: warm, k: 0.3 + 0.8 * Hh.lamp, mode: 0, ph: lr2.range(0, 6.28) });
        lampCandL.push(x, z, 1);
      }
      refl.push({ x: BJ.A.x - Math.cos(BJ.A.h) * 9, z: BJ.A.z - Math.sin(BJ.A.h) * 9, H: 9, w: 2.1, col: warm, k: 0.4 + 0.9 * Hh.lamp, mode: 0, ph: 4.1 });      // the great junk's cabin lights
      if (BJ.B) { jp.push([BJ.B.x, 2.6, BJ.B.z]); refl.push({ x: BJ.B.x, z: BJ.B.z, H: 6.4, w: 1.5, col: warm, k: 0.3 + 0.8 * Hh.lamp, mode: 0, ph: 2.7 }); lampCandL.push(BJ.B.x, BJ.B.z, 1); }      // and the lamp of the junk at the second berth, as every fleet junk has
      // (the sampans' bow lamps and the ferry's stern lamp are in this set too, after the junks' and smaller: carried with the boats in update())
      sBase = jp.length; for (const b of sampans) jp.push([b.x, 2, b.z]); jp.push([0, -50, 0]);
      sGlow = set.add(fx.makeGlows({ positions: jp, color: '#ffb056', size: 3.2, sizeJitter: 0.3, intensity: 1.2 + 1.6 * Hh.lamp, flicker: 0.3, time: T, rng: rng.fork('junk-glows') }));
      for (let i = 0; i <= NS; i++) sGlow.setSize(sBase + i, i < NS ? 0.5 : 0.62);
      await ctx.yield();
      // the sampans' bow lamps and their light on the water (the glows are carried with the boats in update(); the last is the ferry's stern lamp)
      for (const b of sampans) { refl.push({ x: b.x, z: b.z, H: 4.6, w: 0.75, col: warm, k: 0.25 + 0.55 * Hh.lamp, mode: 0, ph: b.ph }); lampCandL.push(b.x, b.z, 0.6); }
    }
    if (Hh.lamp > 0) {
      const gp = [];
      if (night) {      // festival lamps set adrift on the river: a fan of them at the opening, more down the surf on the river side
        const wl = rng.fork('water-lamps'), wp = [], lampC = C('#ffb866');
        for (let i = 0; i < 60; i++) { const t = wl(); wp.push([EX + (wl() - 0.5) * (26 + 170 * t) + (i % 2 ? 11 : -11), 0.3, EZ + 16 + 260 * t * t]); }
        for (let i = 0; i < 46; i++) { const q = rightOf(0.25 + 0.57 * wl(), 9 + 36 * wl()); wp.push([q[0], 0.3, q[1]]); }
        // and a drift of them on the calm water the cutback runs out onto, between our line and the wall of water
        for (let i = 0; i < 60; i++) { const al = -20 + 150 * wl(), lat = 5 + (al + 30) * 1.1 * wl(), x = FAN.x + FAN.dx * al + FAN.dz * lat, z = FAN.z + FAN.dz * al - FAN.dx * lat; if (path.nearestXZ(x, z).dist > 4.5) wp.push([x, 0.3, z]); }
        // (round 12) and more of them along the whole of that run: a band of the river astride its line (see runPt), from the place
        // where the run begins to 110 m past the place where it ends (as far again as the last junk of this run is moored down the
        // front), 30 m to either hand. A stream of their own, as before; they are dealt anew once: a raft now takes two draws, not three.
        { const wr = makeRng(((ctx.seed ?? 1) ^ 0x51b2e9) >>> 0);
          for (let i = 0; i < 46; i++) { const c = runPt(wr() * (runL + 110), 30 - 60 * wr()); if (path.nearestXZ(c[0], c[1]).dist > 4.5) wp.push([c[0], 0.3, c[1]]); } }
        wp.forEach((q, i) => { refl.push({ x: q[0], z: q[2], H: 3.1, w: 0.42, col: lampC, k: 0.6, mode: 0, ph: i * 1.7 }); lampCandL.push(q[0], q[2], 0.42); });
        // each of them is a paper lantern on a little raft (round 12: the glows alone were lights with no source)
        if (winGeoLate) { const paper = C('#ffc27a'), raft = C('#3a1a12');
          wp.forEach((q, i) => { const x = q[0], z = q[2], r = 0.17 + 0.05 * ((i * 7) % 5) / 4;
            winGeoLate.col(raft, 0.06).tube([x, 0.02, z], [x, 0.09, z], r * 2.4, r * 2.2, 6);
            winGeoLate.col(paper, 0.8).tube([x, 0.09, z], [x, 0.3, z], r * 0.8, r, 6).tube([x, 0.3, z], [x, 0.5, z], r, r * 0.6, 6); });
          await ctx.yield(); }
        set.add(fx.makeGlows({ positions: wp, color: '#ffb866', size: 1.05, sizeJitter: 0.35, intensity: 2.6, flicker: 0.35, time: T, rng: rng.fork('water-glows') }));
      }
      for (let z = 12; z < 900; z += z < 300 ? 9 : 16) {
        const p = wall.pointAt(z, -2.4, 11.7); gp.push([p.x, p.y, p.z]);
        const f = wall.pointAt(z, 3.5, 0); refl.push({ x: f.x, z: f.z, H: 15 + 11 * Math.abs(Math.sin(z * 1.31)), w: 3.1, col: warm, k: (0.07 + 0.2 * Hh.lamp) * (0.6 + 0.6 * Math.abs(Math.sin(z * 0.77))), mode: 0, ph: z * 0.37 });
      }
      for (const sx of [-1, 1]) refl.push({ x: sx * 9.5, z: 4, H: 10, w: 1.2, col: warm, k: 0.25 + 0.5 * Hh.lamp, mode: 0, ph: 2 + sx });
      for (let i = 0; i < 8; i++) { const an = (i / 8) * Math.PI * 2; gp.push([A.pagodaBase.x + Math.cos(an) * 15, A.pagodaBase.y + 4, A.pagodaBase.z + Math.sin(an) * 15]); }
      gp.push([-9, 17.5, 1.2], [9, 17.5, 1.2], [-9.5, 4.5, 2.2], [9.5, 4.5, 2.2]);
      if (cityHillAt) { const tr = makeRng(((ctx.seed ?? 1) ^ 0x77c1d3) >>> 0); for (let i = 0; i < 110; i++) { const z = 10 + 1100 * Math.pow(tr(), 1.15), o = 60 + 280 * Math.pow(tr(), 1.2), q = wall.pointAt(z, -o, cityHillAt(z, o) + 3.2); gp.push([q.x, q.y, q.z]); } }      // lamps in the town, for the far view
      set.add(fx.makeGlows({ positions: gp, color: '#ffb056', size: 2.4, sizeJitter: 0.3, intensity: 0.9 + 1.5 * Hh.lamp, flicker: 0.25, time: T, rng: rng.fork('glows') }));
      await ctx.yield();
    }
    if (night) {
      set.add(fx.makeLanterns({ rng: rng.fork('sky-lanterns'), time: T, count: Math.round(110 * (0.6 + 0.4 * detail)), center: [-90, 70, 170], area: [420, 120, 760], floor: 16, rise: 1.3, size: 1.7, wind: [-0.3, 0, -1.2], intensity: 2.2 }));
      await ctx.yield();
      // a second flight of them over the opening view, let go from the junks
      set.add(fx.makeLanterns({ rng: rng.fork('sky-lanterns-2'), time: T, count: Math.round(64 * (0.6 + 0.4 * detail)), center: [EX, 46, EZ + 250], area: [330, 76, 340], floor: 9, rise: 1.2, size: 1.8, wind: [-0.3, 0, -1.2], intensity: 2.3 }));
      await ctx.yield();
    }
    if (winGeoLate) { const wm = new THREE.Mesh(winGeoLate.build(), new THREE.MeshBasicMaterial({ vertexColors: true, color: C('#ffffff').multiplyScalar(0.9 + 1.7 * Hh.lamp), side: THREE.DoubleSide })); wm.name = 'town-windows'; scene.add(wm); await ctx.yield(); }
    refl.push({ x: 0, z: 1.5, H: 24, w: 5.2, col: C(Hh.portal), k: night ? 0.42 : 0.3, mode: 0, ph: 1.3 });      // the portal's own light on the water before the gate
    {
      const rm = new THREE.Mesh(reflGeometry(refl), new THREE.ShaderMaterial({ vertexShader: REFL_VERT, fragmentShader: REFL_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, fog: true,
        side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...boreU } }));
      rm.name = 'reflections'; rm.frustumCulled = false; rm.renderOrder = 1; scene.add(rm);
      await ctx.yield();
    }
    // spindrift round the camera once the wave has us
    const spin = set.add(fx.makeParticles({ rng: rng.fork('spindrift'), preset: 'snow', count: Math.round(1500 * (0.5 + 0.5 * detail)), box: [46, hourId === 'day' ? 2.2 : 13, 46], velocity: [-2.5, hourId === 'day' ? -0.3 : 0.5, -10], velocityRandom: [3.5, 1.8, 5],
      turbulence: [1.4, 0.7, 0.9], size: hourId === 'day' ? [0.02, 0.05] : night ? [0.03, 0.095] : [0.022, 0.06], near: night ? [0.5, 3] : [2.5, 7], colors: night ? ['#9fb4e6', '#c9d6f6', '#8094c8'] : hourId === 'day' ? ['#ffffff', '#eef7f4', '#dff0ea'] : ['#fff0dc', '#ffe2c0', '#ffffff'],
      intensity: night ? 0.55 : 1.05, opacity: hourId === 'day' ? 0.45 : 0.85, additive: 0.25, shape: 'disc', time: T }));
    spin.setOpacity(0);
    await ctx.yield();
    // fair-weather cumulus far out over the estuary and behind the hills. The field is handed an empty noise texture, and
    // the noise is filled in afterwards in slices from the field's own random stream, at the point where the kit would
    // have drawn it: the same texels without the long step.
    let cloudRng = null;
    const cloudSrc = rng.fork('clouds'), cloudNoise = cloudNoiseTexture();
    const clouds = makeCloudField({ rng: { fork: (label) => (cloudRng = cloudSrc.fork(label)) }, sky, count: Math.round(cumN * Hh.cloud), altitude: 430, altitudeJitter: 120, size: [520, 1150], puffs: 40, center: [300, 0, 500], extent: [9000, 9000],
      filter: (x, y, z) => { if (Math.hypot(x - 250, z - 350) <= 2100) return false; if (!night) return true; let da = Math.atan2(x - 150, 300 - z) + 19 * DEG; if (da > Math.PI) da -= 2 * Math.PI; return Math.abs(da) > 44 * DEG; }, wind: [-1.2, 0, -6], fogFade: 0.35, noiseTexture: cloudNoise });      // (by night: rounded moonlit clouds all round the horizon, none near the moon and the gate under it)
    scene.add(clouds.object);
    await ctx.yield();
    await fillCloudNoise(cloudNoise, cloudRng || cloudSrc, ctx);
    await ctx.yield();

    HU.uLampC.value.copy(warm).multiplyScalar(0.7 * Hh.lamp); HU.uLampP.value.copy(warm).multiplyScalar(night ? 0.55 : 0.16 * Hh.lamp);
    const lampCand = new Float32Array(lampCandL), lampN = Hh.lamp > 0 ? lampCand.length / 3 : 0, selS = new Float32Array(8), selI = new Int32Array(8), LR = HU.uLampR.value;
    const E2 = new THREE.Euler(0, 0, 0, 'YZX'), bjA = { ph: 0, sink: 0.3 }, bjB = { ph: 2.3, sink: 0.3 }, SND = new Float32Array(7), MJ = new THREE.Matrix4();

    // A junk rides the river on soundings of her own, at berth bq (x, z, heading), at scale k: seven along her keel and one on
    // each beam. She pitches to the water under her bow and her stern, heels to the water on her beams, and is lifted so that
    // nowhere along her keel does the river stand more than 0.7 m over her waterline: the face takes her bow first, she rears up
    // it, tops the crest with her forefoot in the air and slides off its back, and no part of the wave shows through her hull.
    // Her place is a function of the river alone (nothing is eased from frame to frame: an eased hull lagged behind a face that
    // rises five metres in a third of a second, and sank into it). Returns how far her berth lies ahead of the front.
    const rideM = (out, bq, st, k, time) => {
      const L = 19 * k, ch = Math.cos(bq.h), sh = Math.sin(bq.h), sJ = bq.z - hero.frontZ(bq.x, bq.z);
      let sum = 0;
      for (let j = 0; j < 7; j++) { const t = (j - 3) * 0.145 * L; sum += (SND[j] = HT(bq.x + ch * t, bq.z + sh * t, time)); }
      const pitch = clamp(Math.atan2((SND[6] + SND[5] - SND[0] - SND[1]) * 0.5, 0.725 * L), -0.3, 0.5), sp = Math.sin(pitch);
      const roll = clamp(Math.atan2(HT(bq.x - sh * 2.4 * k, bq.z + ch * 2.4 * k, time) - HT(bq.x + sh * 2.4 * k, bq.z - ch * 2.4 * k, time), 4.8 * k) * 0.7, -0.28, 0.28);
      let top = -1e9;
      for (let j = 0; j < 7; j++) top = Math.max(top, SND[j] - (j - 3) * 0.145 * L * sp);
      const y = Math.max(sum / 7, top - 0.7 * k) - st.sink;
      E2.set(-roll + 0.03 * Math.sin(time * 0.8 + 1 + st.ph) + 0.02 * Math.sin(time * 1.7 + st.ph), -bq.h, pitch + 0.015 * Math.sin(time * 1.1 + st.ph));
      out.compose(V.set(bq.x, y, bq.z), Q.setFromEuler(E2), Sc.set(k, k, k));
      return sJ;
    };

    // ----- every frame -----
    const cp = new THREE.Vector3(), tg = new THREE.Vector3(), camPos = new THREE.Vector3(), fwd = new THREE.Vector3(), last = new THREE.Vector3(), plumeV = new THREE.Vector3(), frontV = new THREE.Vector3(), faceV = new THREE.Vector3();
    const Mx = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, 'YXZ'), V = new THREE.Vector3(), Sc = new THREE.Vector3(), buf = new THREE.Vector2();
    const uDirL = ownSilk.uniforms.uDirL.value, uDirR = ownSilk.uniforms.uDirR.value, OS = ownSilk.uniforms, PI2 = Math.PI * 2;
    let have = false, lastYaw = 0, speedS = 0, turnS = 0, boatDy = 0, pitchS = 0, rollS = 0, flut = 0;
    const RID = HU.uRid.value;
    function update(dt, time, camera, u) {
      T.value = time;
      hero.setBore(boreAt(u));                                            // the bore stands where this u puts it
      HU.uReach.value = smoothstep(0.1, 0.13, u) * (1 - smoothstep(uToe - 0.006, uCrest, u));      // as the wall arrives its lip pitches right out over the face in front of us
      hero.update(dt, time, camera);
      sky.update(dt, time, camera); rig.update(dt, time, camera); clouds.update(dt, time, camera);
      mats.update(dt, time); sails.update(dt, time);      // (the fleet at anchor is placed below, junk by junk)
      fauna.update(dt, time, camera, u);
      spin.setOpacity(smoothstep(uToe - 0.03, uCrest + 0.01, u) * (1 - 0.5 * smoothstep(0.9, 1, u)));
      set.update(dt, time, camera);
      ctx.renderer.getDrawingBufferSize(buf);
      KU.uPix.value = 1.1 / (Math.max(camera.projectionMatrix.elements[5], 0.1) * Math.max(buf.y, 1));

      // tide-riders, each in its own lane on the face, carving a little up and down it
      const wallK = smoothstep(uJ - 0.05, uJ + 0.07, u), outK = 1 - smoothstep(0.93, 0.96, u), ur = Math.max(u, uA);      // (they leave once the wave has run ahead of us and hides its own face)
      path.pointAt(ur, cp); path.tangentAt(ur, tg);
      let ryaw = Math.atan2(-tg.x, -tg.z);
      const ownX = cp.x, ownZ = cp.z, ownYaw = ryaw;      // (the riders on the river side are our own company: they carve with us and never cross our line)
      if (ur > uC[0] && ur < uC[4]) { const ft = (ur - uC[0]) / (uC[4] - uC[0]); cp.lerpVectors(fleetA, fleetB, ft); ryaw = lerp(fleetYawA, fleetYawB, smoothstep(0, 1, ft)); }
      const wide = 42 * (1 - smoothstep(uA - 0.015, uA + 0.035, u));     // until we are on the wave ourselves the river-side riders keep well clear of our line
      // Our own company (the river-side lanes) changes sides twice. Along the front of the wave they are ahead of us on the face;
      // as we carve back they kick out over the crest and drop in again ahead of us on the wall side, so that the run back to the
      // wall has riders on the face in front of the bow too; before the wall they go over once more and come up on the river side.
      const fl0 = smoothstep(uC[2] + 0.02, uC[3] - 0.035, u), back = smoothstep(uJ - 0.085, uJ - 0.055, u), flip = fl0 * (1 - back);
      const over2 = smoothstep(uJ - 0.115, uJ - 0.09, u) * (1 - smoothstep(uJ - 0.05, uJ - 0.025, u)), over = Math.max(4 * fl0 * (1 - fl0), over2);
      const wallHere = wall.xAt(cp.z);
      // Before the catch the two riders toward the wall wait further to the river side: as the wall towers over our bow one of
      // them comes down its face right in front of us, and they carve away toward the wall as we wheel onto the wave.
      const preK = 1 - smoothstep(0.15, uA + 0.012, u);
      // The first of our own company does not kick out over the crest as we carve back: he runs out onto the calm water with us and
      // leads us through the turn, 23 m ahead and a little inside it, until the wave takes us both again.
      const lead2 = smoothstep(uC[2] + 0.004, uC[2] + 0.04, u) * (1 - smoothstep(uC[3] - 0.03, uC[3] + 0.012, u));
      if (lead2 > 0) { const ul = Math.min(u + 0.024, 1); path.pointAt(ul, plumeV); path.tangentAt(ul, frontV); }
      for (let i = 0; i < NR; i++) {
        const r = riders[i], own = r.offD > 0, gone = r.stay ? 0 : wallK, ov = own ? (i === 2 ? over2 : over) : 0;
        let x = (own ? ownX : cp.x) + lerp(own ? r.offD * (1 - 2 * flip) : r.offD, r.offW, wallK) + (own ? wide : r.pre * preK);
        if (!own) x = Math.max(x, wallHere + 8 + 1.5 * (i % 4));      // (the file toward the wall never rides into the masonry)
        const s = lerp(r.s, r.sW, wallK) + 0.5 * Math.sin(time * r.rate + r.ph) + 9 * gone + 10 * ov;
        let z = hero.frontZ(x, own ? ownZ : cp.z) + s, yw = (own ? ownYaw : ryaw) + 0.12 * Math.sin(time * r.rate * 1.7 + r.ph);
        if (i === 2 && lead2 > 0) {
          const l = Math.hypot(frontV.x, frontV.z) || 1; let dyw2 = Math.atan2(-frontV.x, -frontV.z) - yw; if (dyw2 > Math.PI) dyw2 -= PI2; else if (dyw2 < -Math.PI) dyw2 += PI2;
          x = lerp(x, plumeV.x + (frontV.z / l) * 5, lead2); z = lerp(z, plumeV.z - (frontV.x / l) * 5, lead2); yw += dyw2 * lead2;
        }
        const y = HT(x, z, time), yb = HT(x, z - 2.2, time), ya = HT(x, z + 2.0, time), k = r.sc * outK * (1 - gone) * (1 - smoothstep(0.35, 0.75, ov));
        // (he heels to the water under his beams: on the flank of the heap against the seawall a level hull hung half in the air, keel to the eye)
        const cyw = Math.cos(yw) * 0.8, syw = Math.sin(yw) * 0.8, heelR = clamp(Math.atan2(HT(x + cyw, z - syw, time) - HT(x - cyw, z + syw, time), 1.6) * 0.7, -0.42, 0.42);
        E.set(clamp(Math.atan2(yb - ya, 4.2) * 0.7, -0.5, 0.5), yw, heelR + 0.07 * Math.sin(time * 1.9 + r.ph));
        Mx.compose(V.set(x, y + 0.05, z), Q.setFromEuler(E), Sc.set(k, k, k));
        riderMesh.setMatrixAt(i, Mx); riderFlags.setMatrixAt(i, Mx);
        // (the two toward the wall keep to a pocket of the wave: within 20 m of the stone the lip does not come down over a rider)
        if (i < 2) { const dR = x - wall.xAt(z), kR = (1 - smoothstep(20, 45, dR)) * Math.min(k, 1); if (i === 0) { RID.x = dR; RID.y = kR; } else { RID.z = dR; RID.w = kR; } }
      }
      riderMesh.instanceMatrix.needsUpdate = true; riderFlags.instanceMatrix.needsUpdate = true;
      riderSilk.uniforms.uPh.value = time * 11;

      // the great junk at her berth and the cream-sailed junk at the second one, each for the whole flight. Each rides the river on
      // her own soundings: the bow is taken first and she rears up the face, tops the crest and slides off its back.
      {
        const sA = rideM(bigJ.object.matrix, BJ.A, bjA, BJ.S, time), cA = Math.cos(BJ.A.h), sAh = Math.sin(BJ.A.h);
        bigJ.object.matrixWorldNeedsUpdate = true;
        let sB = 1e6;
        if (berthI) { sB = rideM(MJ, BJ.B, bjB, 1, time); putJ(berthI, MJ); }
        // the fleet at anchor: every junk on her own soundings
        for (let i = 0; i < fleetJ.length; i++) { const f = fleetJ[i]; rideM(MJ, f, f, 1, time); f.mesh.setMatrixAt(f.idx, MJ); if (f.rig) f.rig.setMatrixAt(f.idx, MJ); }
        for (let k = 0; k < junks.length; k++) for (const c of junks[k].object.children) if (c.isInstancedMesh) c.instanceMatrix.needsUpdate = true;
        // the ferry: at anchor until the far front is within 260 m of her, then under way before it along the wall to her berth by
        // the gate (her place along her lane is a function of where the front stands)
        {
          const bz = HU.uBoreZ.value, t = clamp((FY.zA + 260 - bz) / 280, 0, 1), zf = lerp(FY.zA, FY.zB, t * t * (3 - 2 * t));
          ferryAt(zf, FY.v); FY.q.x = FY.v.x; FY.q.z = FY.v.z; ferryAt(zf + 2, FY.v); const ax = FY.v.x, az = FY.v.z; ferryAt(Math.max(zf - 2, 0), FY.v);
          FY.q.h = Math.atan2(FY.v.z - az, FY.v.x - ax);
          rideM(MJ, FY.q, FY.st, 1, time); putJ(ferryI, MJ);
          if (sGlow) { V.set(-8.6, 4.4, 0).applyMatrix4(MJ); sGlow.setPosition(sBase + NS, V.x, V.y, V.z); }
        }
        // the sampans: each on three soundings of her own, her lamp carried with her
        for (let i = 0; i < NS; i++) {
          const b = sampans[i], cy = Math.cos(b.yaw), sy = Math.sin(b.yaw), hb = HT(b.x - sy * 2.6, b.z - cy * 2.6, time), hs = HT(b.x + sy * 2.2, b.z + cy * 2.2, time), hm = HT(b.x, b.z, time);
          const pt = clamp(Math.atan2(hb - hs, 4.8), -0.45, 0.6), yb = Math.max((hb + hs + 2 * hm) / 4, Math.max(hb - 2.6 * Math.sin(pt), hm, hs + 2.2 * Math.sin(pt)) - 0.25);
          E.set(pt + 0.04 * Math.sin(time * 1.3 + b.ph), b.yaw + 0.05 * Math.sin(time * 0.37 + b.ph), 0.06 * Math.sin(time * 1.7 + b.ph * 2));
          Mx.compose(V.set(b.x, yb + 0.03 * Math.sin(time * 1.1 + b.ph), b.z), Q.setFromEuler(E), Sc.set(b.sc, b.sc, b.sc));
          sampanMesh.setMatrixAt(i, Mx);
          if (sGlow) { V.set(0.06, 1.92, -2.5).applyMatrix4(Mx); sGlow.setPosition(sBase + i, V.x, V.y, V.z); }
        }
        sampanMesh.instanceMatrix.needsUpdate = true;
        lampCand[0] = BJ.A.x - cA * 9; lampCand[1] = BJ.A.z - sAh * 9; lampCand[2] = sA < -2 ? 1.3 : 0;
        // white water bursts along the hull the lip is under: of the junk the wall takes as it arrives and these two, whichever the
        // front is nearest (a rule in space: the front is far from all three when it changes over)
        const sF = focal ? Math.abs(focal.z - hero.frontZ(focal.x, focal.z)) : 1e9;
        if (sF < Math.abs(sA) && sF < Math.abs(sB)) HU.uBurst.value.set(focal.x, focal.z, Math.cos(focal.h) * 8.5, Math.sin(focal.h) * 8.5);
        else if (Math.abs(sB) < Math.abs(sA)) HU.uBurst.value.set(BJ.B.x, BJ.B.z, Math.cos(BJ.B.h) * 8.5, Math.sin(BJ.B.h) * 8.5);
        else HU.uBurst.value.set(BJ.A.x, BJ.A.z, cA * 11.5, sAh * 11.5);
        HU.uBurstK.value = 1;
      }

      // our sampan: the camera's place and yaw, but level; it sits on the real water, pitches with the face,
      // leans into the turn and shivers with speed. While u is 0 (seen through a portal) it is sunk and shrunk away.
      camPos.setFromMatrixPosition(camera.matrixWorld); fwd.set(0, 0, -1).transformDirection(camera.matrixWorld);
      const fl = Math.hypot(fwd.x, fwd.z) || 1, hx = fwd.x / fl, hz = fwd.z / fl, yaw = Math.atan2(-hx, -hz);
      if (have && dt > 1e-4) {
        const sp = Math.hypot(camPos.x - last.x, camPos.z - last.z) / dt; let dy = yaw - lastYaw; if (dy > Math.PI) dy -= PI2; else if (dy < -Math.PI) dy += PI2;
        if (sp < 90) { const k = Math.min(1, dt * 3); speedS += (sp - speedS) * k; turnS += (clamp(-dy / dt, -0.8, 0.8) - turnS) * k; }
      }
      have = true; last.copy(camPos); lastYaw = yaw;
      // lamp light on the face of the wave: the eight lamps nearest the eye among those the wall is about to take
      if (lampN) {
        for (let j = 0; j < 8; j++) selS[j] = 1e9;
        for (let i = 0; i < lampN; i++) {
          const lx = lampCand[i * 3], lz = lampCand[i * 3 + 1], lk = lampCand[i * 3 + 2], dxc = Math.abs(lx - camPos.x);
          if (lk <= 0 || dxc > 95) continue;
          const ah = hero.frontZ(lx, lz) - lz; if (ah < -3 || ah > 70) continue;
          const sc = ah * 0.7 + dxc - lk * 25; if (sc >= selS[7]) continue;
          let j = 7; while (j > 0 && selS[j - 1] > sc) { selS[j] = selS[j - 1]; selI[j] = selI[j - 1]; j--; }
          selS[j] = sc; selI[j] = i;
        }
        for (let j = 0; j < 8; j++) { if (selS[j] < 1e8) { const i = selI[j] * 3; LR[j].set(lampCand[i], lampCand[i + 1], lampCand[i + 2] * (1 - smoothstep(65, 95, Math.abs(lampCand[i] - camPos.x))), 0); } else LR[j].set(0, -1e5, 0, 0); }
      }
      const pres = u > 0 ? smoothstep(0, 0.02, u) : 0, k5 = dt > 0 ? Math.min(1, dt * 5) : 1;
      // Where the eye stands in the sampan. At the opening and the catch amidships: bow, spar, both poles and their lanterns frame
      // the view. On the face it moves forward (only the bow is left, the poles stand behind the eye); for the wave seen whole and
      // through the cutback it stands right in the bow (nothing of the boat in the frame); the bow comes back as we carve home
      // and the whole rig for the wall and the gate. From the bow the sampan no longer turns with the gaze: she points down
      // her own course, so the stem swings across the bottom of the frame as we look round.
      // (The stages: the whole rig as we set out; right forward while the wall comes, so that nothing stands between the eye and
      // it; back amidships as it towers over the bow and lifts us; then in the bow, with nothing of the boat in the frame, from
      // the first run across the face to the end of the wall; the whole rig for the gate.)
      const stand = 3.1 * smoothstep(0.04, 0.072, u) * (1 - smoothstep(0.1, 0.135, u)) + 3.2 * smoothstep(uA + 0.02, uA + 0.06, u) * (1 - smoothstep(0.875, 0.915, u));
      path.tangentAt(u, tg);
      let dyw = Math.atan2(-tg.x, -tg.z) - yaw; if (dyw > Math.PI) dyw -= PI2; else if (dyw < -Math.PI) dyw += PI2;
      const yawB = yaw + clamp(dyw, -0.2, 0.2) * smoothstep(0.3, 1, stand), bx = -Math.sin(yawB), bz = -Math.cos(yawB);
      const hC = HT(camPos.x, camPos.z, time), hB = HT(camPos.x + hx * 3.4, camPos.z + hz * 3.4, time), hS = HT(camPos.x - hx * 1.5, camPos.z - hz * 1.5, time);
      // heeled by the face, but only half as far while the face is right at the pole (or the left pole and pennant are buried in it)
      const heel = lerp(0.16, 0.08, smoothstep(uToe - 0.012, uToe, u) * (1 - smoothstep(uCrest + 0.02, uCrest + 0.07, u)));
      rollS += (clamp(Math.atan2(HT(camPos.x + hz * 0.9, camPos.z - hx * 0.9, time) - HT(camPos.x - hz * 0.9, camPos.z + hx * 0.9, time), 1.8) * 0.3, -heel, heel) - rollS) * k5;
      // (over the rare crossing ridge the eye is carried up by the route: the sampan must not be lifted toward the lens there)
      const calmK = rare ? 1 - smoothstep(uToe - 0.012, uToe + 0.004, u) : 0;
      // (as the wave runs ahead at the very end the sampan stays on the water and drops out of the frame under the eye: held up, only
      // her stem head showed, a red knob at the bottom edge)
      boatDy += (clamp(hC + 2.42 - camPos.y, lerp(-0.5, -4.5, smoothstep(0.945, 0.985, u)), lerp(1.25, 0.3, calmK)) - boatDy) * k5;
      pitchS += (clamp(Math.atan2(hB - hS, 4.9) * 0.45, -0.05, lerp(0.17, 0.1, calmK)) - pitchS) * k5;
      const sk = clamp(speedS / 26, 0, 1.3), tremble = 0.006 * sk * Math.sin(time * 33) + 0.004 * sk * Math.sin(time * 47 + 1.3), sc = u > 0 ? 1 : 0.001, astern = u > 0 ? (1 - pres) * 3.5 + stand : 0;      // while u is 0 (seen through a portal) it is sunk and shrunk away; then it glides in from astern, under the eye
      E.set(pitchS + 0.012 * Math.sin(time * 1.1) + tremble * 0.6, yawB, 0.02 * Math.sin(time * 1.3) + 0.012 * Math.sin(time * 2.9 + 1) - turnS * 0.35 - rollS);
      Mx.compose(V.set(camPos.x - bx * astern, camPos.y + boatDy + 0.03 * Math.sin(time * 0.9) + tremble - (u > 0 ? 0 : 5), camPos.z - bz * astern), Q.setFromEuler(E), Sc.set(sc, sc, sc));
      veh.matrix.copy(Mx); bowCloth.matrix.copy(Mx);
      // (the rig stands 9 m astern, behind the eye, until the middle of the flight; it is moved up while the eye is in the bow and
      // the poles are behind it anyway, so it comes into the frame for the gate as the eye goes aft, as before)
      const rigBack = astern + (u > 0 ? 9 * (1 - smoothstep(0.45, 0.55, u) + smoothstep(0.95, 0.985, u)) : 0);      // (and astern again as she drops away)
      Mx.setPosition(camPos.x - bx * rigBack, V.y, camPos.z - bz * rigBack);
      rigMesh.matrix.copy(Mx); flags.matrix.copy(Mx); lanterns.matrix.copy(Mx);
      veh.matrixWorldNeedsUpdate = true; bowCloth.matrixWorldNeedsUpdate = true; rigMesh.matrixWorldNeedsUpdate = true; flags.matrixWorldNeedsUpdate = true; lanterns.matrixWorldNeedsUpdate = true;
      // the pennants stream with the wind that drives the tide upriver: astern while we face it, forward once we run with it
      // (running with it they stream forward and a little inward from the poles, whole in the frame; as the eye goes forward in
      // the boat they swing out and back, out of the frame, and facing the wind they stream straight out from the poles, off the frame)
      const wz = -(WIND.x * bx + WIND.z * bz), th = lerp(lerp(-8 * DEG, 118 * DEG, smoothstep(0.12, 0.6, stand)), 96 * DEG, smoothstep(-0.45, 0.45, wz)), sn = Math.sin(th), cs = Math.cos(th), cy = Math.cos(yawB), sy = Math.sin(yawB);
      uDirL.set(-sn * cy - cs * sy, 0, sn * sy - cs * cy);
      // (for the gate only the left pennant streams into the frame: the right one streams out and astern, so the two are not a
      // pair of red slabs in the top corners, and the lantern row of the right landing is clear)
      const thR = u > 0.5 ? Math.max(th, 150 * DEG) : th, snR = Math.sin(thR), csR = Math.cos(thR);
      uDirR.set(snR * cy - csR * sy, 0, -snR * sy - csR * cy); bowSilk.uniforms.uDirR.value.set(sn * cy - cs * sy, 0, -sn * sy - cs * cy); bowSilk.uniforms.uPh.value = flut + time * 0.5;
      flut += dt * (6 + 0.3 * speedS); if (flut > 6283) flut -= 6283;
      OS.uPh.value = flut + time * 0.5; OS.uAmp.value = 0.65 + 0.4 * sk; OS.uBend.value = turnS * 2.4;
    }
    { const c0 = new THREE.PerspectiveCamera(62, ctx.aspect || 1.78, 0.3, 9000); path.pointAt(0, c0.position); c0.lookAt(path.pointAt(0.03, tp)); c0.updateMatrixWorld(); update(0, 0, c0, 0); have = false; }
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration,
      pace: FL.pace,
      title: Hh.title + (rare ? ': the Crossing Tide' : ''),
      ride: 'none',
      camera: { fov: 62, near: 0.3, nearThrough: 0.3, far: 9000, lookAhead: 18, sway: 0.8, bank: 0.25 },      // (nearThrough: the path starts 1.85 m over the river, lower than the opening is tall; the river runs on behind the entry and the sampan is hidden while u is 0)
      pois: flightPois(hero, FL, rare),
      portal: { shape: 'arch', width: A.portalSeat.width, height: A.portalSeat.height, color: Hh.portal, glow: 1.1 },
      post: {
        exposure: Hh.exposure,
        bloom: { strength: Hh.bloom, radius: 0.65, threshold: 0.95 },
        grade: { saturation: Hh.grade.saturation, contrast: Hh.grade.contrast, tint: Hh.grade.tint, shadowTint: Hh.grade.shadowTint, vignette: 0.3, grain: 0.022, aberration: 0 },
      },
      update,
      dispose() { sky.dispose?.(); hero.dispose?.(); },
    };
  },
};
