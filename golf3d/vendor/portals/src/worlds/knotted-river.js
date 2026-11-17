// The River Tied in a Knot.
// A river with no banks hangs in the sky as a rope of glowing water tied in a trefoil knot two kilometres across;
// red-sailed boats sail all the way round it because down is always toward its middle. The flight (2.6 km): we arrive
// low on the crown of the low lobe's eastern strand among the boats and look up the river; lift off once, steeply, until
// the whole knot stands to the north; nose over and dive to below the bar (the strand that closes the knot's eye), its
// belly a ceiling of lit glass with boats hanging keel-up and a reed islet hanging as a garden; fly east beneath it to
// the East Crossing, climb beside our own strand where it stands like a wall, turn high in the eye, look down along
// the bar and come down onto its crown, sail it west under the western strand where it bridges the bar, and go on
// through the train of shed hoops to the Eyelet, the smallest, with the portal in it.
// Everything on the river is laid out by rules of the river, never for a moment of the flight: the fleet by the
// hero's one rule for boats (courses, the lane, berths), terns in rings fixed on strands, herons that fly curves
// fixed in the world when the route comes within reach of their islet. No water falls into the cloud sea: where two strands pass close, chains of droplet
// beads and mist arc slowly from one to the other; on the rare visit one rope of water, the Splice, joins them.
//
// World space is the hero's local space (the brief's metres): +Y up, we travel toward +Z, +X is starboard.
// Everything that lives on the river stands on the tube's own radial (hero.standMaterial); only the camera,
// the cloud sea and the sky know about world up.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, addHeron } from '../parts/knotted-river.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const DECK_Y = -750;

// ---------------------------------------------------------------------------------------------------
// looks: hour x weather. pal = [cloud/horizon, cream, water, deep water, glow, sail, zenith] for the hero.
// ---------------------------------------------------------------------------------------------------
const HOURS = {
  dawn: {
    pal: ['#F6C9A8', '#FBEEDC', '#2E8C8A', '#0F4C5C', '#7FD6C8', '#D9482B', '#6B7FB8'],
    az: 80, el: 9, sunCol: '#ffe2b8', sunI: 2.4, disc: 9, discSize: 1.25,
    zen: '#5f73b4', mid: '#f3dcc6', hor: '#f2bd97', haze: '#f4c7a4', lit: '#f6c9a2', shade: '#8f8fc4', bay: '#74779f',
    deckLit: '#f1bb95', deckShade: '#8a86b8', fog: '#eebf9f', fogD: 0.00031, k: 0.74, stars: 0,
    exposure: 1.0, bloom: [0.5, 0.7, 0.86], sat: 1.08, tint: '#fff6ee', shadowTint: '#0a0a1c', glow: 1, limb: 0.35, glowFar: 2.0, caust: [0.45, 0.6, 0.3], netK: 0.5, streak: 1.4,
  },
  day: {
    pal: ['#DCE9EE', '#FFFFFF', '#149FA8', '#07566E', '#78ECE0', '#D9482B', '#3C78C8'],
    az: 80, el: 31, sunCol: '#fff3df', sunI: 2.7, disc: 10, discSize: 1.0,
    zen: '#2f6ec4', mid: '#9fc8ea', hor: '#dbe9f0', haze: '#d6e6ef', lit: '#f4f4f0', shade: '#8ba2c6', bay: '#6f86ad',
    deckLit: '#f1f2ee', deckShade: '#8ea6c8', fog: '#cfe0ec', fogD: 0.00027, k: 0.7, stars: 0,
    exposure: 0.98, bloom: [0.42, 0.6, 0.9], sat: 1.1, tint: '#ffffff', shadowTint: '#04101c', glow: 1, limb: 0.35, glowFar: 1.8, caust: [0.45, 0.5, 0.3], netK: 0.5, streak: 1.4,
  },
  golden: {
    pal: ['#F2A27E', '#FDE0B8', '#1F6488', '#211E5A', '#6FD8DC', '#D9482B', '#7666B2'],     // violet-teal water, an aqua limb
    az: -100, el: 7, sunCol: '#ffbe84', sunI: 2.6, disc: 9, discSize: 1.3,
    zen: '#6a5cac', mid: '#f0c4a4', hor: '#f29a72', haze: '#f2a680', lit: '#f7a67a', shade: '#8a6cae', bay: '#6d5c98',
    deckLit: '#f39a70', deckShade: '#8468ac', fog: '#ec9f7c', fogD: 0.00033, k: 0.72, stars: 0,
    exposure: 1.0, bloom: [0.5, 0.7, 0.87], sat: 1.1, tint: '#fff2e6', shadowTint: '#120a22', glow: 0.85, limb: 0.7, glowFar: 2.2,
    farCore: '#342e96', caust: [0.45, 0.7, 0.3], netK: 0.5, streak: 1.4,
    refl: [0.42, 0.8], glitter: 0.75,      // the sunward faces graze the eye where we sail west into the low sun: less peach sky in them, seen through the water's own colour
  },
  night: {
    pal: ['#4A5884', '#A9BCE0', '#2C8A78', '#0B4048', '#86EBC0', '#58302E', '#0E1A40'],
    az: -22, el: 5.5, sunCol: '#cddcff', sunI: 1.5, disc: 5, discSize: 2.0,     // the moon stands ahead: in the knot's loops from the low lobe, in the west loop's window on the way out
    zen: '#1b2554', mid: '#2a3564', hor: '#414c74', haze: '#38446a', lit: '#a4b4d8', shade: '#1e2748', bay: '#2c3660',
    deckLit: '#9aa9ce', deckShade: '#1f2950', fog: '#2c3a66', fogD: 0.00028, k: 0.62, stars: 1,
    // the moon stands 30 degrees up, so every underside transmits: the glow is held down and the rim kept to the silhouette
    // the body is held down to deep jade and the light kept to the limb; moonAmb is the cool wrapped light on dark things
    exposure: 1.22, bloom: [0.5, 0.7, 0.86], sat: 1.05, tint: '#eef2ff', shadowTint: '#02040e', glow: 0.62, limb: 1, glowFar: 2.6,
    limbPale: 0.6, netK: 1, streak: 1.9, glitW: 1,     // moonlit limbs pale to silver; the bands of moonlight under a belly stand apart; current lines and the moon's road carry by moonlight alone
    body: 0.54, fill: 0.25, glitter: 3, caust: [0.2, 1.0, 0.5], moonAmb: [0.30, 0.38, 0.56], hazeAqua: 0.1, hazeD: 0.00036, lamp: 1, underLit: 1, puffShade: '#2b376a', puffTop: 0.8, deckLow: 0.52, deckRoll: 74, towShadow: 700,     // deckRoll: the cloud sea's rolls are turned to lie across the low moon's light
  },
};
const sunVec = (az, el) => new THREE.Vector3(Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), Math.cos(az * DEG) * Math.cos(el * DEG));

// ---------------------------------------------------------------------------------------------------
// the sky: gradient, sun or moon, the terraced cloud rampart beyond the knot with its shadowed bay,
// and the cloud sea 800 m below (ray-cast onto a plane, so it has true perspective and slides under us)
// ---------------------------------------------------------------------------------------------------
const DOME_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4;          // a pole vertex exactly beside a level camera
  gl_Position = p.xyww;
}`;
const DOME_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uNoise;
uniform float uTime, uMist, uStars, uDeckY, uDisc, uDiscCos, uRain, uGap, uLowK; uniform vec2 uRoll;
uniform vec3 uZen, uMid, uHor, uHaze, uLit, uShade, uBay, uSunDir, uSunCol, uDeckLit, uDeckShade;
varying vec3 vDir;
uniform vec4 uTow[4];             // the four placed cumulus towers: x, z, half-width, shadow length
// the shadow a tower lays on the deck, down-sun of it, and the shade round its foot
float towShade(vec2 p, vec4 tw, vec2 s2) {
  vec2 v = p - tw.xy; float al = dot(v, -s2), ac = dot(v, vec2(-s2.y, s2.x));
  float wd = tw.z * (1.0 + 0.3 * clamp(al / max(tw.w, 1.0), 0.0, 1.0));
  return (1.0 - smoothstep(0.5, 1.2, abs(ac) / max(wd, 1.0))) * smoothstep(-1.1 * tw.z, 0.2 * tw.z, al) * (1.0 - smoothstep(0.3 * tw.w, tw.w, al));
}
// one tier of the rampart: rgb = colour, a = cover
vec4 tier(float a, float e, float i, float hmax, float sideK, float bayA, float gap) {
  float k = 2.0 + i, u = a * 0.15915494;
  float n1 = texture2D(uNoise, vec2(u * k + 0.37 * i, 0.13 + 0.21 * i)).b;
  float n2 = texture2D(uNoise, vec2(u * k * 2.5 + 0.11 * i, 0.5 + 0.17 * i + uTime * 0.0004)).b;
  float n3 = texture2D(uNoise, vec2(u * k * 7.0 + 0.5 * i, 0.3 + 0.4 * i - uTime * 0.0006)).b;
  float lobes = sqrt(abs(2.0 * n2 - 1.0)), small = sqrt(abs(2.0 * n3 - 1.0));
  // in the bay the back wall stands tall and the nearer tiers drop away, so it reads as a deep shadowed cove
  float top = hmax * (0.45 + 0.75 * n1) * (1.0 + bayA * (i < 0.5 ? 0.3 : -0.5)) + 0.075 * lobes + 0.022 * small - 0.07;
  top = mix(top, min(top, 0.012 + 0.03 * n1 + 0.02 * lobes * n1 - 0.008 * i), gap);     // by night the wall opens in a pass where the low moon stands
  vec4 nb = texture2D(uNoise, vec2(u * k * 2.2 + i * 0.3 + uTime * 0.0003, e * k * 0.35 + i * 0.4));
  float cov = 1.0 - smoothstep(top - 0.003, top + 0.003, e);
  float depth = clamp((top - e) / 0.2, 0.0, 1.0);
  float lit = 0.5 + (nb.b - 0.5) * 0.7 - (nb.r - 0.5) * 1.5 * sideK - (nb.g - 0.5) * 0.5;
  lit = lit * (1.0 - 0.55 * depth) + 0.55 * (1.0 - smoothstep(0.0, 0.055, top - e));
  vec3 c = mix(uShade, uLit, clamp(lit, 0.0, 1.0));
  c = mix(c, uHaze, 0.46 - 0.12 * i);                       // far tiers sit deeper in the haze
  return vec4(c, cov);
}
void main() {
  vec3 d = normalize(vDir);
  float h = d.y, lxz = max(length(d.xz), 1e-4);
  float a = atan(d.x, d.z + (abs(d.x) + abs(d.z) < 1e-5 ? 1e-5 : 0.0));
  float e = asin(clamp(h, -1.0, 1.0));
  float sunA = atan(uSunDir.x, uSunDir.z + 1e-5);
  float sideK = sin(sunA - a);
  float cs = clamp(dot(d, uSunDir), -1.0, 1.0);
  // clear sky
  vec3 col = mix(uHor, uMid, smoothstep(0.0, 0.2, h));
  col = mix(col, uZen, smoothstep(0.1, 0.72, h));
  float warm = 0.5 + 0.5 * dot(d.xz / lxz, uSunDir.xz / max(length(uSunDir.xz), 1e-4));
  col += uSunCol * 0.035 * warm * warm * (1.0 - smoothstep(0.0, 0.45, h));
  if (uStars > 0.01) {
    vec3 sp = d * 110.0, sc = floor(sp), sf = fract(sp) - 0.5;
    float hsh = fract(sin(dot(sc, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    float tw = 0.7 + 0.3 * sin(uTime * (1.0 + hsh * 3.0) + hsh * 40.0);
    col += vec3(0.8, 0.88, 1.0) * step(0.972, hsh) * (1.0 - smoothstep(0.0, 0.34, length(sf))) * 1.6 * tw * uStars * smoothstep(0.02, 0.3, h);
  }
  float cs2 = max(cs, 0.0); float g8 = cs2 * cs2; g8 *= g8; g8 *= g8; float g64 = g8 * g8; g64 *= g64; g64 *= g64;
  col += uSunCol * (0.05 * g8 + 0.22 * g64 * g64) * (1.0 - 0.6 * uMist);
  col += uSunCol * uDisc * smoothstep(uDiscCos, uDiscCos + 0.00012, cs) * (1.0 - 0.85 * uMist);
  // the rampart: four tiers, tallest between azimuth -70 and +30, low heaps everywhere else
  float bump = 1.0 - smoothstep(0.5, 1.3, abs(a + 0.35));
  float hmax = mix(0.085, 0.4, bump);
  float cover = 0.0;
  float da = abs(a - sunA); da = min(da, 6.2831853 - da);
  float gap = uGap * (1.0 - smoothstep(0.16, 0.5, da));
  float bayA = 1.0 - smoothstep(0.27, 0.72, abs(a + 0.5236));
  vec4 t0 = tier(a, e, 0.0, hmax, sideK, bayA, gap); col = mix(col, t0.rgb, t0.a); cover = max(cover, t0.a);
  vec4 t1 = tier(a, e, 1.0, hmax * 0.78, sideK, bayA, gap); col = mix(col, t1.rgb, t1.a); cover = max(cover, t1.a);
  vec4 t2 = tier(a, e, 2.0, hmax * 0.56, sideK, bayA, gap); col = mix(col, t2.rgb, t2.a); cover = max(cover, t2.a);
  vec4 t3 = tier(a, e, 3.0, hmax * 0.36, sideK, bayA, gap); col = mix(col, t3.rgb, t3.a); cover = max(cover, t3.a);
  // the shadowed bay dead behind the portal (azimuth -30)
  float bayN = texture2D(uNoise, vec2(a * 0.8 + 0.2, e * 1.5 + 0.4)).b;
  float bayK = 1.0 - smoothstep(0.55, 0.98, length(vec2((a + 0.5236) / 0.7, (e - 0.05) / 0.5)) + (bayN - 0.5) * 0.4);     // a cove of shade with a ragged edge
  col = mix(col, uBay * (0.7 + 0.6 * dot(col, vec3(0.33))), bayK * cover * 0.9);
  col += uSunCol * 0.1 * g8 * cover;
  // the cloud sea
  {
    float t = (cameraPosition.y - uDeckY) / max(-h, 2e-3);
    vec2 q = cameraPosition.xz + d.xz * t + vec2(uTime * 6.0, 0.0);
    q = vec2(q.x * uRoll.x + q.y * uRoll.y, -q.x * uRoll.y + q.y * uRoll.x);          // the rolls lie across the light: a lit flank and a shadowed trough to every one
    // a deck of stratocumulus: rolls 300 m apart with round crests and creased troughs, bent by slow noise, swelling
    // and dying along their length, their flanks scalloped by billows. Nothing here repeats in under 900 m.
    vec2 qr = vec2(q.x * 0.8 - q.y * 0.6, q.x * 0.6 + q.y * 0.8);
    vec4 nA = texture2D(uNoise, q * 0.00021);
    vec4 nB = texture2D(uNoise, qr * vec2(0.00105, 0.00074) + 0.31);
    vec4 nC = texture2D(uNoise, q * vec2(0.00057, 0.00043) + nB.rg * 0.03 + 0.7);
    float dB = 2.0 * nB.b - 1.0, dC = 2.0 * nC.a - 1.0;
    float bB = sqrt(dB * dB + 0.05) - 0.12, bC = sqrt(dC * dC + 0.05) - 0.12;          // billows: round where they swell, and a rounded trough (never a crease) where two meet
    float r = (q.x + (nA.b - 0.5) * 460.0 + (nC.b - 0.5) * 120.0 + (bB - 0.4) * 80.0 + q.y * 0.22) / 300.0;      // the bend is kept under one roll's width per roll's width, so a roll bends and never closes on itself as a ring
    float keep = smoothstep(0.003, 0.02, 300.0 * (-h) / max(t, 1.0));      // rolls fade before they alias
    float fB = 1.0 - smoothstep(5000.0, 11000.0, t);
    float x = 2.0 * fract(r) - 1.0;
    float crest = 0.5 + 0.5 * cos(3.14159265 * x); crest = mix(crest, sqrt(max(crest, 1e-4)), 0.5);     // a broad soft crest, a soft rounded trough between rolls
    float amp = 0.3 + 0.7 * smoothstep(0.28, 0.62, nC.b);
    float H = mix(0.62, crest, keep) * mix(0.75, amp, keep) * (0.62 + 0.38 * mix(0.5, bB, fB)) + 0.26 * mix(0.5, bC, fB);
    // (the lean of a billow passes through zero where two billows meet, so their crease is a soft trough, never a drawn line)
    vec2 gB = clamp((nB.b - 0.5) * 7.0, -1.0, 1.0) * (nB.rg - 0.5);
    vec2 gC = clamp((nC.a - 0.5) * 7.0, -1.0, 1.0) * (nC.rg - 0.5);
    // which way the cloud top leans: down the roll's flank, and down the side of each billow
    vec2 lean = vec2(0.976, 0.215) * 1.5 * sin(3.14159265 * x) * amp * keep * 0.42          // (level on the crest and in the trough: no line where two rolls meet)
      - vec2(0.8 * gB.x + 0.6 * gB.y, -0.6 * gB.x + 0.8 * gB.y) * 1.9 * fB - gC * 0.9 * fB;
    vec2 s2 = uSunDir.xz / max(length(uSunDir.xz), 1e-4);
    vec2 s2r = vec2(s2.x * uRoll.x + s2.y * uRoll.y, -s2.x * uRoll.y + s2.y * uRoll.x);          // the light, in the rolls' own frame
    float low = (1.0 - 0.6 * clamp(uSunDir.y * 2.0, 0.0, 1.0)) * uLowK;
    float lit = 0.3 + 0.42 * smoothstep(0.1, 0.95, H) + dot(lean, s2r) * 0.6 * low;
    vec2 pw = cameraPosition.xz + d.xz * t + vec2(6.0 * min(uTime, 600.0), 0.0);          // the towers ride the same drift
    float shd = max(max(towShade(pw, uTow[0], s2), towShade(pw, uTow[1], s2)), max(towShade(pw, uTow[2], s2), towShade(pw, uTow[3], s2)));
    lit = clamp(lit * (1.0 - 0.45 * shd), 0.0, 1.0);
    vec3 dk = mix(uDeckShade, uDeckLit, lit);
    float wk = max(dot(d.xz / lxz, s2), 0.0); wk *= wk; wk *= wk; wk *= wk; wk *= wk; wk *= wk;
    dk += uSunCol * uDeckLit * (0.55 * wk * wk + 0.12 * wk) * smoothstep(0.3, 0.8, lit) * low * (1.0 - smoothstep(0.02, 0.5, -h));   // the light's road across the cloud tops
    dk = mix(dk, uDeckShade * 0.82, 0.62 * shd);
    dk = mix(dk, mix(uDeckShade, uBay, 0.6), bayK * 0.6 * (1.0 - smoothstep(0.03, 0.3, -h)));
    float fk = 1.0 - exp(-t * t / 1.5e8);
    dk = mix(dk, uHaze * (1.0 - 0.4 * bayA), fk);
    dk = mix(dk, uHaze * (0.93 + 0.1 * nB.b), uMist * 0.9);
    col = mix(dk, col, smoothstep(-0.012, 0.006, h));
  }
  col = mix(col, uHaze * (1.0 - 0.35 * bayA), 0.5 * exp(-abs(e) / 0.035) * (1.0 - 0.72 * bayA));                         // a band of glowing haze on the horizon
  vec3 pearl = mix(uHaze * 1.08, mix(uShade, uHaze, 0.45), smoothstep(-0.05, -0.75, h)) + uSunCol * 0.1 * g8;
  col = mix(col, pearl, uMist * (0.94 - 0.72 * smoothstep(0.04, 0.5, h)));
  col *= mix(vec3(1.0), vec3(0.74, 0.72, 0.84), uMist * bayA * (1.0 - smoothstep(0.1, 0.5, abs(e))));   // the bay still shows as a soft shadow in the pearl
  col = mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2))) * vec3(0.8, 0.86, 0.96), uRain * 0.7);
  gl_FragColor = vec4(col, 1.0);
}`;

// cumulus towers standing up out of the cloud sea: camera-facing lobes of very different sizes (broad base lobes,
// a heaped body, buds on the body, crumbs on the buds). aC = (centre, radius), aD = (seed, height in the tower 0..1,
// phase, how far toward the sun this lobe sits in its tower -1..1), aE = edge softness (1 base .. 0 crisp bud)
const PUFF_VERT = /* glsl */ `
attribute vec4 aC; attribute vec4 aD; attribute float aE;
uniform float uTime; uniform vec3 uSunDir;
varying vec2 vUv; varying vec3 vSunV; varying float vSeed, vFog, vH, vSunward, vSoft, vTop;
void main() {
  float r = aC.w * (1.0 + 0.045 * sin(uTime * 0.23 + aD.z));
  vec3 c = aC.xyz + vec3(-6.0 * min(uTime, 600.0), aC.w * 0.035 * sin(uTime * 0.17 + aD.z * 1.7), 0.0);
  vec4 mv = viewMatrix * vec4(c, 1.0);
  mv.xy += position.xy * r;
  gl_Position = projectionMatrix * mv;
  vUv = position.xy; vSeed = aD.x; vH = aD.y; vSunward = aD.w; vSoft = aE;
  vSunV = mat3(viewMatrix) * uSunDir;
  float dist = length(mv.xyz);
  vFog = 1.0 - exp(-dist * dist / 3.2e7);
  vTop = clamp((cameraPosition.y - c.y) / max(dist, 1.0), 0.0, 1.0);          // how steeply the head is seen from above
}`;
const PUFF_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uNoise; uniform float uTime, uMist, uTopLit;
uniform vec3 uLit, uShade, uHaze, uSunCol;
varying vec2 vUv; varying vec3 vSunV; varying float vSeed, vFog, vH, vSunward, vSoft, vTop;
void main() {
  float r2 = dot(vUv, vUv);
  if (r2 > 1.0) discard;
  vec2 sd = vec2(vSeed * 3.1, vSeed * 7.7);
  vec4 n1 = texture2D(uNoise, vUv * 0.2 + sd + uTime * 0.0011);
  vec4 n2 = texture2D(uNoise, vUv * 0.52 + sd.yx * 1.7 - uTime * 0.0018);
  // billows: round where they swell, creased where they meet. They push the lobe's edge in and out, so the outline
  // is ragged cauliflower and no two lobes are the same disc
  vec4 n3 = texture2D(uNoise, vUv * 1.25 + sd * 0.7);
  float b1 = abs(2.0 * n1.b - 1.0), b2 = abs(2.0 * n2.b - 1.0), b3 = abs(2.0 * n3.b - 1.0);
  float rad = min(0.55 + 0.27 * b1 + 0.14 * b2 + 0.07 * b3, 1.0);
  float body = rad * rad - r2;
  float alpha = smoothstep(0.0, mix(0.05, 0.3, vSoft), body);
  alpha *= 1.0 - smoothstep(-0.05, -0.6, vUv.y) * (1.0 - vH) * 0.85 * vSoft;   // base lobes melt into the deck
  vec2 gr = (n1.b < 0.5 ? -1.0 : 1.0) * (n1.rg - 0.5) * 2.0 + (n2.b < 0.5 ? -1.0 : 1.0) * (n2.rg - 0.5) * 1.3 + (n3.b < 0.5 ? -1.0 : 1.0) * (n3.rg - 0.5) * 0.6;
  // the lobe is only gently domed: the relief comes from the billows and from where the lobe sits in its tower,
  // so a tower reads as one heaped mass with a sun side and a lee side, not as a pile of balls
  vec3 n = normalize(vec3(vUv * 0.6 / rad - gr, sqrt(max(1.0 - r2 / (rad * rad), 0.0)) * 0.7 + 0.5));
  float lit = 0.36 + 0.46 * dot(n, vSunV) + 0.1 * n.y + 0.56 * vSunward;
  lit += 0.22 * (b1 - 0.45) + 0.12 * (b2 - 0.4);                              // creases hold shadow
  lit += uTopLit * (0.2 + 0.8 * smoothstep(-0.35, 0.85, n.y)) * (0.55 + 0.9 * b1);   // light from the sky overhead rounds every billow when the moon is low behind the heads
  lit += vTop * (0.16 + 0.34 * n.z) * (0.6 + 0.6 * b1);                       // seen from above, what faces the lens is a cloud top under the open sky: lit, its creases shaded
  lit *= 0.45 + 0.55 * smoothstep(0.0, 0.45, vH + 0.2 * vUv.y + 0.5 * vTop);   // a broad darker base (seen from the side)
  lit = smoothstep(0.06, 0.94, lit);
  // a lining of light on the sunward lobes when the sun is beyond the tower (never a ring round every lobe)
  float rim = (1.0 - smoothstep(0.0, 0.28, body)) * max(-vSunV.z, 0.0) * smoothstep(0.3, 0.9, vSunward) * (1.0 - vSoft);
  vec3 col = mix(uShade * 0.8, uLit, lit) + uSunCol * 0.05 * lit * lit + uLit * uSunCol * 0.4 * rim;
  col = mix(col, uHaze, clamp(vFog, 0.0, 1.0));
  gl_FragColor = vec4(col, alpha * (1.0 - 0.15 * vFog) * (1.0 - 0.45 * uMist));
}`;

// ---------------------------------------------------------------------------------------------------
// things that live on the river's own radial (RADIAL = hero.radialGLSL, SKY = hero.skyGLSL)
// ---------------------------------------------------------------------------------------------------
// terns: aA = (s, theta0, height above the water, scale), aB = (rad/s on the journey clock, rad/s on time, phase, m/s along)
const birdVert = (RADIAL) => /* glsl */ `
attribute vec3 color; attribute vec2 aW;
#ifndef FREE
attribute vec4 aA; attribute vec4 aB;
#endif
uniform float uClock, uTime, uFlapRate, uFlapAmp;
varying vec3 vN, vCol, vWPos; varying float vWing;
${RADIAL}
#include <fog_pars_vertex>
void main() {
#ifdef FREE
  float ph = float(gl_InstanceID) * 1.7 + 0.3, scl = 1.0;
#else
  float ph = aB.z, scl = aA.w;
#endif
  vec3 p = position * scl, n = normal;
  float beat = sin(uTime * (6.5 + fract(ph * 3.3) * 2.0) * uFlapRate + ph * 9.0 - aW.x * 0.9);
  float glide = smoothstep(0.5, 0.9, sin(uTime * 0.37 + ph * 5.0)) * step(0.9, uFlapRate);
  float ang = (uFlapAmp * beat * (1.0 - 0.85 * glide) + 0.14) * aW.x;
  float ca = cos(ang), sa = sin(ang), sg = position.x < 0.0 ? -1.0 : 1.0, ax = abs(p.x);
  p = vec3(sg * ax * ca, p.y + ax * sa, p.z);
  n = vec3(n.x * ca - sg * n.y * sa, n.y * ca + sg * n.x * sa, n.z);
  float bank = 0.3 * sin(uTime * 0.53 + ph * 2.0) * step(0.9, uFlapRate), cb = cos(bank), sb = sin(bank);
  p.xy = vec2(p.x * cb - p.y * sb, p.x * sb + p.y * cb); n.xy = vec2(n.x * cb - n.y * sb, n.x * sb + n.y * cb);
#ifdef FREE
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vec3 wn = mat3(modelMatrix) * mat3(instanceMatrix) * n;
#else
  float keyed = abs(aB.x) > 1e-5 ? 1.0 : 0.0;                 // birds staged on the journey clock keep their place at a given u
  float th = aA.y + aB.x * uClock + aB.y * uTime;
  float s = aA.x + aB.w * mix(uTime, uClock, keyed) + (2.5 - 2.0 * keyed) * sin(uTime * 0.23 + ph * 4.0);
  float vt = (aB.x + aB.y) * (uTubeR + aA.z);
  float yaw = atan(vt, aB.w + (abs(vt) + abs(aB.w) < 1e-4 ? 1.0 : 0.0));
  float hh = aA.z + (1.3 - 0.9 * keyed) * sin(uTime * 0.7 + ph * 3.0);
  vec3 C, T, R, Fw, S; radialBasis(s, th, yaw, C, T, R, Fw, S);
  vec4 wp = modelMatrix * vec4(C + R * (uTubeR + hh + p.y) + S * p.x + Fw * p.z, 1.0);
  vec3 wn = mat3(modelMatrix) * (S * n.x + R * n.y + Fw * n.z);
#endif
  vN = wn; vCol = color; vWPos = wp.xyz; vWing = aW.x;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const birdFrag = (SKY) => /* glsl */ `
precision highp float;
uniform vec3 uBirdTint; uniform float uBirdFloor;
varying vec3 vN, vCol, vWPos; varying float vWing;
${SKY}
#include <fog_pars_fragment>
void main() {
  vec3 V = normalize(cameraPosition - vWPos + vec3(0.0, 1e-5, 0.0));
  vec3 n = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 nf = dot(n, V) < 0.0 ? -n : n;
  float ndl = max(dot(nf, uSunDir), 0.0), back = max(dot(-nf, uSunDir), 0.0) * step(0.02, vWing);
  vec3 col = vCol * uBirdTint * (skyAmbient(nf) * 0.95 + uSunCol * (ndl * 0.42 + back * 0.3) + uBirdFloor * vec3(0.78, 0.84, 1.0));   // (by night a white bird keeps a floor of sky-glow: never a dark cut-out)
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// leaping fish: aA = (s, theta, heading, scale), aB = (period s, phase, arc length m, arc height m)
const fishVert = (RADIAL) => /* glsl */ `
attribute vec3 color; attribute vec4 aA; attribute vec4 aB;
uniform float uTime;
varying vec3 vN, vCol, vWPos, vUp;
${RADIAL}
#include <fog_pars_vertex>
void main() {
  float cyc = uTime / aB.x + aB.y, k = floor(cyc), p = fract(cyc), air = 0.3;
  float hsh = fract(sin(k * 12.9898 + aB.y * 78.233) * 43758.5453);
  float q = clamp(p / air, 0.0, 1.0);
  float s = aA.x + (hsh - 0.5) * 26.0, th = aA.y + (fract(hsh * 7.3) - 0.5) * 0.2;
  vec3 C, T, R, Fw, S; radialBasis(s, th, aA.z, C, T, R, Fw, S);
  float h = aB.w * 4.0 * q * (1.0 - q) - 0.5;
  float slope = aB.w * 4.0 * (1.0 - 2.0 * q) / max(aB.z, 0.1);
  float il = inversesqrt(1.0 + slope * slope), cp = il, sp = slope * il;
  vec3 m = position * aA.w * (p < air ? 1.0 : 0.0);
  m.x += 0.1 * aA.w * sin(uTime * 19.0 + position.z * 5.0 + aB.y * 30.0) * (0.5 - position.z);
  vec3 pr = vec3(m.x, m.y * cp + m.z * sp, m.z * cp - m.y * sp);
  vec3 nr = vec3(normal.x, normal.y * cp + normal.z * sp, normal.z * cp - normal.y * sp);
  vec4 wp = modelMatrix * vec4(C + R * (uTubeR + h + pr.y) + Fw * (aB.z * (q - 0.5) + pr.z) + S * pr.x, 1.0);
  vN = mat3(modelMatrix) * (S * nr.x + R * nr.y + Fw * nr.z); vCol = color; vWPos = wp.xyz; vUp = mat3(modelMatrix) * R;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const fishFrag = (SKY) => /* glsl */ `
precision highp float;
varying vec3 vN, vCol, vWPos, vUp;
${SKY}
#include <fog_pars_fragment>
void main() {
  vec3 V = normalize(cameraPosition - vWPos + vec3(0.0, 1e-5, 0.0));
  vec3 n = normalize(vN + vec3(0.0, 1e-5, 0.0));
  if (dot(n, V) < 0.0) n = -n;
  float ndl = max(dot(n, uSunDir), 0.0);
  vec3 hv = normalize(V + uSunDir + vec3(0.0, 1e-5, 0.0));
  float sp = max(dot(n, hv), 0.0); float s8 = sp * sp; s8 *= s8; s8 *= s8; float s32 = s8 * s8; s32 *= s32;
  vec3 col = vCol * (skyAmbient(n) * 0.9 + uSunCol * ndl * 0.5) + uSunCol * (s32 * 1.6 + s8 * 0.12) + skyCol(reflect(-V, n)) * 0.18;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// drifting beads of water (they add) and cooking smoke (it blends): premultiplied sprites that travel P0 -> P1
const MOTE_VERT = /* glsl */ `
attribute vec3 aP0; attribute vec3 aP1; attribute vec4 aS;     // aS = (size m, kind 0 bead / 1 smoke, phase, rate)
uniform float uTime, uPixAng; uniform vec3 uSunDir;
varying vec2 vUv; varying vec4 vS; varying float vLife, vDim, vSunK, vP;
#include <fog_pars_vertex>
void main() {
  float p = fract(aS.z + uTime * aS.w);
  vec3 d = aP1 - aP0;
  vec3 pos = mix(aP0, aP1, p);
  float wob = aS.y > 0.5 ? 0.6 + 2.2 * p : 0.5;
  pos += vec3(sin(uTime * 0.37 + aS.z * 40.0), sin(uTime * 0.29 + aS.z * 23.0), cos(uTime * 0.23 + aS.z * 31.0)) * wob;
  vec4 wc = modelMatrix * vec4(pos, 1.0);
  float dist = distance(cameraPosition, wc.xyz);
  float size = aS.x * (aS.y > 0.5 ? 0.45 + 1.6 * p : 1.0), minS = dist * uPixAng * 1.3;
  vDim = aS.y > 0.5 ? smoothstep(4.0, 12.0, dist) : min(1.0, (size * size) / max(minS * minS, 1e-6)) * smoothstep(1.5, 5.0, dist);
  size = max(size, aS.y > 0.5 ? size : minS);
  vec4 mvPosition = viewMatrix * wc;
  mvPosition.xy += position.xy * size;
  gl_Position = projectionMatrix * mvPosition;
  vUv = position.xy; vS = aS; vP = p;
  vLife = smoothstep(0.0, 0.12, p) * (1.0 - smoothstep(aS.y > 0.5 ? 0.45 : 0.86, 1.0, p));
  vSunK = max(dot(normalize(wc.xyz - cameraPosition + vec3(0.0, 1e-4, 0.0)), uSunDir), 0.0);
  #include <fog_vertex>
}`;
const MOTE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uNoise; uniform float uTime;
uniform vec3 uSunCol, uPeach, uCream, uLilac, uAqua;
varying vec2 vUv; varying vec4 vS; varying float vLife, vDim, vSunK, vP;
#include <fog_pars_fragment>
void main() {
  float r2 = dot(vUv, vUv);
  vec2 q = vUv * 0.5 + 0.5;
  float n1 = texture2D(uNoise, q * 0.5 + vec2(vS.z * 5.0, vS.z - uTime * 0.02)).b;
  if (r2 > 1.0) discard;
  vec3 col; float alpha;
  if (vS.y < 0.5) {
    float core = exp(-r2 * 5.5), spark = exp(-r2 * 40.0);
    float tw = 0.7 + 0.3 * sin(uTime * 1.3 + vS.z * 60.0);
    col = (mix(uAqua, uCream, 0.3 + 0.4 * fract(vS.z * 9.7)) * core * 0.9 + uCream * uSunCol * spark * (0.7 + 2.0 * vSunK)) * tw * vLife * vDim;
    alpha = 0.0;
  } else {
    float soft = (1.0 - r2); soft *= soft;
    alpha = soft * smoothstep(0.25, 0.75, n1) * 0.42 * vLife * vDim;
    col = mix(uLilac * 0.7, mix(uPeach, uCream, 0.6), 0.45 + 0.4 * n1 + 0.3 * vSunK) * 0.85 * alpha;
  }
  float keep = 1.0;
#ifdef USE_FOG
  #ifdef FOG_EXP2
  keep = exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
  keep = 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#endif
  gl_FragColor = vec4(col * keep, alpha * keep);
}`;

// rain that falls inward toward a strand from every side: aA = (place along the window 0..1, theta, phase, speed m/s)
const rainVert = (RADIAL) => /* glsl */ `
attribute vec4 aA;
uniform float uTime, uPixAng, uCamS, uWin, uHmax;
varying float vA; varying vec2 vUv;
${RADIAL}
void main() {
  float so = fract(aA.x - uCamS / uWin + 0.5) - 0.5;
  float fall = fract(aA.z + uTime * aA.w / uHmax);
  float h = uHmax * (1.0 - fall) * (1.0 - fall * 0.2);
  vec3 C, T, R, Fw, S; radialBasis(uCamS + so * uWin, aA.y, 0.0, C, T, R, Fw, S);
  float len = 3.0 + aA.w * 0.14;
  vec4 wc = modelMatrix * vec4(C + R * (uTubeR + h + position.y * len) + T * position.y * 0.5, 1.0);
  vec3 toC = wc.xyz - cameraPosition; float dist = length(toC);
  vec3 side = normalize(cross(mat3(modelMatrix) * R, toC) + vec3(1e-5, 0.0, 0.0));
  float hw = max(0.014, dist * uPixAng * 0.7);
  wc.xyz += side * position.x * hw;
  vA = min(1.0, 0.014 / hw * 2.5) * smoothstep(0.0, 0.06, fall) * (1.0 - smoothstep(0.92, 1.0, fall)) * smoothstep(1.0, 4.0, dist) * (1.0 - smoothstep(0.4, 0.5, abs(so)));
  vUv = position.xy;
  gl_Position = projectionMatrix * viewMatrix * wc;
}`;
const RAIN_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uRainCol;
varying float vA; varying vec2 vUv;
void main() {
  float a = vA * (1.0 - abs(vUv.x)) * smoothstep(0.0, 0.3, vUv.y) * (1.0 - smoothstep(0.6, 1.0, vUv.y));
  gl_FragColor = vec4(uRainCol * a * 0.55, a * 0.55);
}`;

// ---------------------------------------------------------------------------------------------------
// meshes
// ---------------------------------------------------------------------------------------------------
// a tern (or, dark and narrow, a swift): model +z forward, x along the span (1 m), aW = (0..1 along the wing, 0)
function birdGeometry(swift, lite) {
  const P = [], N = [], C = [], W = [], col = new THREE.Color();
  const rgb = (h) => { col.set(h); return [col.r, col.g, col.b]; };
  const WHITE = rgb(swift ? '#4a4452' : '#e9e9e4'), GREY = rgb(swift ? '#3a3542' : '#c3cad2'), CAP = rgb('#101216'), TIP = rgb(swift ? '#2a2630' : '#5a606a'), BILL = rgb(swift ? '#222' : '#d2502a');
  const tri = (a, b, c, ca, cb = ca, cc = ca, wa = 0, wb = 0, wc = 0) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    for (const [p, cl, w] of [[a, ca, wa], [b, cb, wb], [c, cc, wc]]) { P.push(...p); N.push(nx, ny, nz); C.push(...cl); W.push(w, 0); }
  };
  // a sea bird, about 1 m across the wings: a spindle body (white below, grey back, a black cap over head and nape), a red
  // bill, long narrow wings bent at the wrist with darker tips and a white trailing edge, a forked tail with streamers
  if (lite) {
    // the same bird for rings that are never near the route's line (none of their circles comes within 13 m of it): a
    // four-sided spindle with the cap, the bill, a tail and three-triangle wings, 26 triangles
    const rg = [[0.085, 0.05], [-0.04, 0.052]].map(([z, r]) => [[0, r * 1.05, z], [r * 0.9, -r * 0.1, z], [0, -r * 0.95, z], [-r * 0.9, -r * 0.1, z]]);
    const nose = [0, 0.004, 0.215], tail = [0, 0.012, -0.2];
    for (let k = 0; k < 4; k++) {
      const k1 = (k + 1) % 4, top = k === 0 || k === 3;
      tri(nose, rg[0][k], rg[0][k1], top ? CAP : WHITE);
      tri(rg[0][k], rg[1][k], rg[1][k1], top ? GREY : WHITE); tri(rg[0][k], rg[1][k1], rg[0][k1], top ? GREY : WHITE);
      tri(rg[1][k], tail, rg[1][k1], top ? GREY : WHITE);
    }
    tri([0.014, 0.004, 0.2], [-0.014, 0.004, 0.2], [0, -0.006, 0.305], BILL);
    for (const sx of [1, -1]) tri([0, 0.01, -0.14], [sx * 0.032, 0.01, -0.19], [sx * 0.09, 0.012, -0.43], WHITE, WHITE, GREY);
    const sw = swift ? 0.8 : 1, EDGE = swift ? GREY : WHITE;
    for (const sx of [1, -1]) {
      const r0 = [sx * 0.035, 0.022, 0.11], r1 = [sx * 0.035, 0.02, -0.075 * sw], m0 = [sx * 0.38, 0.03, 0.06], m1 = [sx * 0.36, 0.027, -0.075 * sw], tp = [sx * 0.53, 0.016, -0.18];
      tri(r0, m0, m1, GREY, GREY, TIP, 0.06, 0.76, 0.76); tri(r0, m1, r1, GREY, TIP, EDGE, 0.06, 0.76, 0.06); tri(m0, tp, m1, TIP, TIP, TIP, 0.76, 1, 0.76);
    }
  } else {
    const ringAt = (z, r, yo) => [[0, r * 1.05 + yo, z], [r * 0.9, r * 0.35 + yo, z], [r * 0.75, -r * 0.6 + yo, z], [0, -r * 0.95 + yo, z], [-r * 0.75, -r * 0.6 + yo, z], [-r * 0.9, r * 0.35 + yo, z]];
    const rings = [[0.165, 0.03, 0.006], [0.085, 0.05, 0], [-0.04, 0.052, 0], [-0.15, 0.026, 0.004]].map(([z, r, yo]) => ringAt(z, r, yo));
    const nose = [0, 0.004, 0.215], tail = [0, 0.012, -0.2];
    for (let k = 0; k < 6; k++) {
      const k1 = (k + 1) % 6, top = k === 0 || k === 5, belly = k === 2 || k === 3;
      tri(nose, rings[0][k], rings[0][k1], top ? CAP : WHITE);
      for (let i = 0; i < 3; i++) {
        const c = top ? (i === 0 ? CAP : GREY) : belly ? WHITE : i === 0 ? WHITE : swift ? GREY : WHITE;
        tri(rings[i][k], rings[i + 1][k], rings[i + 1][k1], c); tri(rings[i][k], rings[i + 1][k1], rings[i][k1], c);
      }
      tri(rings[3][k], tail, rings[3][k1], top ? GREY : WHITE);
    }
    tri([0.014, 0.004, 0.2], [-0.014, 0.004, 0.2], [0, -0.006, 0.305], BILL); tri([0, 0.018, 0.2], [0, -0.012, 0.2], [0, -0.005, 0.305], BILL);
    for (const sx of [1, -1]) tri([0, 0.01, -0.14], [sx * 0.032, 0.01, -0.19], [sx * 0.09, 0.012, -0.43], WHITE, WHITE, GREY);     // tail streamers
    tri([0, 0.01, -0.14], [0.032, 0.01, -0.19], [-0.032, 0.01, -0.19], WHITE);
    const sw = swift ? 0.8 : 1, EDGE = swift ? GREY : WHITE;
    for (const sx of [1, -1]) {
      const r0 = [sx * 0.035, 0.022, 0.11], r1 = [sx * 0.035, 0.02, -0.075 * sw], w0 = [sx * 0.23, 0.04, 0.155], w1 = [sx * 0.22, 0.034, -0.03 * sw];
      const m0 = [sx * 0.38, 0.03, 0.06], m1 = [sx * 0.36, 0.027, -0.075 * sw], tp = [sx * 0.53, 0.016, -0.18];
      tri(r0, w0, w1, GREY, GREY, EDGE, 0.06, 0.46, 0.46); tri(r0, w1, r1, GREY, EDGE, EDGE, 0.06, 0.46, 0.06);
      tri(w0, m0, m1, GREY, GREY, TIP, 0.46, 0.76, 0.76); tri(w0, m1, w1, GREY, TIP, EDGE, 0.46, 0.76, 0.46);
      tri(m0, tp, m1, TIP, TIP, TIP, 0.76, 1, 0.76);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 2));
  return g;
}

// a heron (or egret) in flight, 2.1 m across: neck tucked, dagger bill, legs trailing. Same attributes as the tern
function heronGeometry(white) {
  const P = [], N = [], C = [], W = [], col = new THREE.Color();
  const rgb = (h) => { col.set(h); return [col.r, col.g, col.b]; };
  const BODY = rgb(white ? '#eeeee8' : '#aab2b8'), BELLY = rgb(white ? '#f6f6f0' : '#d9dcdc'), COV = rgb(white ? '#e6e6e0' : '#8e99a4'), FLIGHT = rgb(white ? '#d2d2cc' : '#3f4955');
  const BILL = rgb('#dcae3a'), LEG = rgb(white ? '#2c2c2a' : '#6f6245'), CAP = rgb(white ? '#eeeee8' : '#23272d');
  const tri = (a, b, c, ca, cb = ca, cc = ca, wa = 0, wb = 0, wc = 0) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    for (const [p, cl, w] of [[a, ca, wa], [b, cb, wb], [c, cc, wc]]) { P.push(...p); N.push(nx, ny, nz); C.push(...cl); W.push(w, 0); }
  };
  // body, tucked neck and head as a chain of diamonds
  const st = [[0.78, 0.0, 0.03, 0.03], [0.66, 0.02, 0.05, 0.055], [0.52, 0.07, 0.05, 0.05], [0.4, 0.06, 0.08, 0.09], [0.2, 0.0, 0.12, 0.13], [-0.15, -0.01, 0.11, 0.11], [-0.42, 0.01, 0.03, 0.03]];
  const ring = (q) => [[0, q[1] + q[3], q[0]], [q[2], q[1], q[0]], [0, q[1] - q[3], q[0]], [-q[2], q[1], q[0]]];
  for (let j = 0; j < st.length - 1; j++) {
    const A = ring(st[j]), B = ring(st[j + 1]);
    for (let k = 0; k < 4; k++) { const k1 = (k + 1) % 4, top = k === 0 || k === 3, c = j < 1 ? (top ? CAP : BODY) : top ? BODY : BELLY; tri(A[k], B[k], B[k1], c); tri(A[k], B[k1], A[k1], c); }
  }
  tri([0.014, 0.01, 0.78], [-0.014, 0.01, 0.78], [0, -0.01, 1.04], BILL); tri([0, 0.03, 0.78], [0, -0.012, 0.78], [0, -0.01, 1.04], BILL);
  for (const sx of [1, -1]) {
    tri([sx * 0.03, -0.03, -0.38], [sx * 0.05, -0.05, -0.4], [sx * 0.035, -0.06, -1.12], LEG);
    const r0 = [sx * 0.09, 0.05, 0.32], r1 = [sx * 0.09, 0.04, -0.2], e0 = [sx * 0.5, 0.07, 0.36], e1 = [sx * 0.5, 0.05, -0.17], f0 = [sx * 0.86, 0.06, 0.28], f1 = [sx * 0.84, 0.05, -0.16], t0 = [sx * 1.05, 0.05, 0.12], t1 = [sx * 1.0, 0.05, -0.12];
    tri(r0, e0, e1, COV, COV, FLIGHT, 0.08, 0.47, 0.47); tri(r0, e1, r1, COV, FLIGHT, COV, 0.08, 0.47, 0.08);
    tri(e0, f0, f1, COV, COV, FLIGHT, 0.47, 0.82, 0.82); tri(e0, f1, e1, COV, FLIGHT, FLIGHT, 0.47, 0.82, 0.47);
    tri(f0, t0, t1, FLIGHT, FLIGHT, FLIGHT, 0.82, 1, 1); tri(f0, t1, f1, FLIGHT, FLIGHT, FLIGHT, 0.82, 1, 0.82);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 2));
  return g;
}

// a silver fish 1 m long, nose toward +z
function fishGeometry() {
  const P = [], N = [], C = [], col = new THREE.Color();
  const rgb = (h) => { col.set(h); return [col.r, col.g, col.b]; };
  const BACK = rgb('#4c5f70'), SIDE = rgb('#c4ccd0'), BELLY = rgb('#e6e6e0'), FIN = rgb('#6f7f8c');
  const tri = (a, b, c, ca, cb, cc) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
    for (const [p, cl] of [[a, ca], [b, cb], [c, cc]]) { P.push(...p); N.push(nx / l, ny / l, nz / l); C.push(...cl); }
  };
  const rings = [[0.24, 0.05, 0.085], [-0.1, 0.055, 0.1], [-0.36, 0.02, 0.04]].map(([z, rx, ry]) => [[0, ry, z], [rx, 0, z], [0, -ry, z], [-rx, 0, z]]);
  const cc = [BACK, SIDE, BELLY, SIDE], nose = [0, 0, 0.5];
  for (let k = 0; k < 4; k++) {
    const k1 = (k + 1) % 4;
    tri(nose, rings[0][k], rings[0][k1], SIDE, cc[k], cc[k1]);
    for (let j = 0; j < 2; j++) { tri(rings[j][k], rings[j + 1][k], rings[j + 1][k1], cc[k], cc[k], cc[k1]); tri(rings[j][k], rings[j + 1][k1], rings[j][k1], cc[k], cc[k1], cc[k1]); }
  }
  tri([0, 0, -0.34], [0, 0.15, -0.52], [0, -0.15, -0.52], SIDE, FIN, FIN);
  tri([0, 0.09, 0.02], [0, 0.17, -0.12], [0, 0.085, -0.2], BACK, FIN, BACK);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  return g;
}

// a stilt hut on a reed islet: local +z is its door side. full = false gives the far version
function addHut(b, rng, hx, hz, face, full, cloth, cream) {
  const cs = Math.cos(face), sn = Math.sin(face);
  const q = (x, y, z) => [hx + x * cs + z * sn, y, hz - x * sn + z * cs];
  const obox = (x0, x1, y0, y1, z0, z1, c) => {
    const Pt = (i) => q(i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0);
    for (const f of [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]]) b.quad(Pt(f[0]), Pt(f[1]), Pt(f[2]), Pt(f[3]), c);
  };
  const REED = ['#b8a068', '#aa945c', '#c4ae74', '#a08a56'], THATCH = ['#d0b468', '#c0a45a', '#dcc278', '#b4984e'], WOOD = '#6a5238', DARK = '#2a2119';
  const FY = 1.7, WY = 3.45, RY = 5.3;
  if (!full) {
    obox(-1.7, 1.7, 0.3, FY, -1.3, 1.3, b.rgb('#3a3026', 0.1));
    obox(-1.7, 1.7, FY, WY, -1.4, 1.4, b.rgb(rng.pick(REED), 0.08));
    for (const sz of [1, -1]) b.quad(q(-2.1, WY - 0.2, sz * 2.0), q(2.1, WY - 0.2, sz * 2.0), q(2.1, RY, 0), q(-2.1, RY, 0), b.rgb(rng.pick(THATCH), 0.08));
    for (const sx of [1, -1]) b.tri(q(sx * 1.7, WY, -1.4), q(sx * 1.7, WY, 1.4), q(sx * 1.7, RY - 0.1, 0), b.rgb(REED[1], 0.08));
    b.quad(q(2.5, 2.5, -0.7), q(2.5, 2.5, 0.9), q(2.5, 1.3, 0.9), q(2.5, 1.3, -0.7), b.rgb(cloth, 0.05).map((x) => x * 0.9), [2, 0, 0, 0], [2, 1, 0, 0], [2, 1, 1, 1], [2, 0, 1, 1]);
    return;
  }
  for (const x of [-1.5, 0, 1.5]) for (const z of [-1.2, 2.0]) b.spar(q(x + rng.range(-0.08, 0.08), 0.1, z), q(x, FY, z), 0.08, 0.07, 4, b.rgb(WOOD, 0.15));
  obox(-1.9, 1.9, FY - 0.1, FY + 0.04, -1.5, 2.3, b.rgb('#8a7355', 0.1));
  for (let i = 0; i < 6; i++) { const x0 = -1.9 + i * 0.633; b.quad(q(x0 + 0.03, FY + 0.05, 1.4), q(x0 + 0.6, FY + 0.05, 1.4), q(x0 + 0.6, FY + 0.05, 2.3), q(x0 + 0.03, FY + 0.05, 2.3), b.rgb('#97805e', 0.14)); }
  // reed-panel walls in strips, a dark doorway
  for (const sz of [1, -1]) for (let i = 0; i < 6; i++) {
    const x0 = -1.7 + i * 0.5667, x1 = x0 + 0.5667, door = sz > 0 && (i === 2 || i === 3);
    b.quad(q(x0, door ? 3.0 : FY, sz * 1.4), q(x1, door ? 3.0 : FY, sz * 1.4), q(x1, WY, sz * 1.4), q(x0, WY, sz * 1.4), b.rgb(rng.pick(REED), 0.07));
    if (door) b.quad(q(x0, FY, 1.36), q(x1, FY, 1.36), q(x1, 3.0, 1.36), q(x0, 3.0, 1.36), b.rgb(DARK, 0.1));
  }
  for (const sx of [1, -1]) {
    for (let i = 0; i < 4; i++) { const z0 = -1.4 + i * 0.7; b.quad(q(sx * 1.7, FY, z0), q(sx * 1.7, FY, z0 + 0.7), q(sx * 1.7, WY, z0 + 0.7), q(sx * 1.7, WY, z0), b.rgb(rng.pick(REED), 0.07)); }
    b.tri(q(sx * 1.7, WY, -1.4), q(sx * 1.7, WY, 1.4), q(sx * 1.7, RY - 0.15, 0), b.rgb(REED[3], 0.08));
    b.quad(q(sx * 1.72, 2.5, -0.35), q(sx * 1.72, 2.5, 0.35), q(sx * 1.72, 3.05, 0.35), q(sx * 1.72, 3.05, -0.35), b.rgb(DARK, 0.1));
  }
  // thatch: two shaggy courses a side, overhanging
  for (const sz of [1, -1]) for (let i = 0; i < 5; i++) {
    const x0 = -2.15 + i * 0.86, x1 = x0 + 0.86, j0 = rng.range(-0.08, 0.08), j1 = rng.range(-0.08, 0.08);
    b.quad(q(x0, WY - 0.32 + j0, sz * 2.05), q(x1, WY - 0.32 + j1, sz * 2.05), q(x1, 4.3, sz * 1.02), q(x0, 4.3, sz * 1.02), b.rgb(rng.pick(THATCH), 0.07).map((x) => x * 0.86));
    b.quad(q(x0, 4.22 + j1, sz * 1.16), q(x1, 4.22 + j0, sz * 1.16), q(x1, RY, 0), q(x0, RY, 0), b.rgb(rng.pick(THATCH), 0.07));
  }
  b.spar(q(-2.3, RY + 0.03, 0), q(2.3, RY + 0.03, 0), 0.1, 0.1, 4, b.rgb('#7a6234', 0.1), true);
  // ladder
  for (const x of [0.62, 1.12]) b.spar(q(x, 0.1, 3.25), q(x, FY + 0.5, 2.25), 0.04, 0.04, 3, b.rgb(WOOD, 0.1));
  for (let i = 1; i <= 4; i++) { const t = i / 5; b.spar(q(0.62, 0.1 + t * 1.6, 3.25 - t * 0.95), q(1.12, 0.1 + t * 1.6, 3.25 - t * 0.95), 0.03, 0.03, 3, b.rgb(WOOD, 0.1)); }
  // drying rack of cloth beside the hut
  const rx = 2.75, ry = 2.7;
  b.spar(q(rx, 0.15, -1.0), q(rx, ry + 0.15, -1.0), 0.05, 0.04, 3, b.rgb(WOOD, 0.1)); b.spar(q(rx, 0.15, 1.7), q(rx, ry + 0.15, 1.7), 0.05, 0.04, 3, b.rgb(WOOD, 0.1));
  b.ribbon(q(rx, ry, -1.0), q(rx, ry, 1.7), 0.02, b.rgb('#3b3028'));
  const cl = [[-0.85, 0.75, 1.5, cloth], [0.0, 0.7, 1.15, cream], [0.85, 0.8, 1.7, cloth]];
  for (const [z, w, hgt, hex] of cl) {
    const c = b.rgb(hex, 0.06).map((x) => x * 0.88), z0 = 0.35 + z - w / 2, z1 = z0 + w;
    b.quad(q(rx, ry, z0), q(rx, ry, z1), q(rx, ry - hgt, z1), q(rx, ry - hgt, z0), c, [2, 0, 0, 0], [2, 1, 0, 0], [2, 1, 1, 1], [2, 0, 1, 1]);
  }
  // moss and roots hanging under the floor
  for (let i = 0; i < 6; i++) {
    const x = rng.range(-1.7, 1.7), z = rng.range(-1.3, 2.1), l = rng.range(0.5, 1.1), c = b.rgb(rng.pick(['#3f5e36', '#4a6a3a', '#5a5a34']), 0.1);
    b.tri(q(x - 0.1, FY - 0.1, z), q(x + 0.1, FY - 0.1, z), q(x, FY - 0.1 - l, z), c, [4, 0, 0, 0], [4, 0, 0, 0], [4, 0, 0, 0.25]);
  }
}

// a moored skiff, 4.4 m
function addSkiff(b, rng, hx, hz, face, y0 = 0.02) {
  const cs = Math.cos(face), sn = Math.sin(face), q = (x, y, z) => [hx + x * cs + z * sn, y0 + y, hz - x * sn + z * cs];
  const st = [-2.2, -1.3, -0.3, 0.7, 1.6, 2.2].map((z) => { const k = z / 2.25, w = 0.62 * Math.pow(Math.max(0, 1 - k * k), 0.6) + 0.02; return { z, w, sh: 0.4 + 0.24 * k * k, ke: -0.08 + 0.36 * k * k * k * k }; });
  for (let i = 0; i < st.length - 1; i++) for (const sx of [1, -1]) {
    const A = st[i], B = st[i + 1];
    b.quad(q(0, A.ke, A.z), q(0, B.ke, B.z), q(sx * B.w * 0.85, (B.ke + B.sh) / 2, B.z), q(sx * A.w * 0.85, (A.ke + A.sh) / 2, A.z), b.rgb('#3a2c25', 0.15));
    b.quad(q(sx * A.w * 0.85, (A.ke + A.sh) / 2, A.z), q(sx * B.w * 0.85, (B.ke + B.sh) / 2, B.z), q(sx * B.w, B.sh, B.z), q(sx * A.w, A.sh, A.z), b.rgb('#b9ad98', 0.06));
  }
  for (const z of [-0.9, 0.6]) b.quad(q(-0.55, 0.3, z - 0.12), q(0.55, 0.3, z - 0.12), q(0.55, 0.3, z + 0.12), q(-0.55, 0.3, z + 0.12), b.rgb('#8a6a4a', 0.1));
}

// a reed islet 30 m across: mound, reeds with plumes, four stilt huts round a deck, a skiff, float-leaves at the rim.
// Local x/z lie on the water (the shader wraps them round the girth), y is the islet's own up.
// o = { tufts, full, herons, white, cloth, cream, garden, plume }
function buildIslet(b, rng, o) {
  const K4 = (w) => [4, 0, 0, w], RN = 20, rad = [];
  for (let k = 0; k < RN; k++) rad.push(11 + 4.5 * rng());
  const FR = [0, 0.3, 0.55, 0.75, 0.9, 1.0], lump = FR.map(() => rad.map(() => rng()));
  const mp = (k, j) => { const a = ((k % RN) / RN) * TAU, f = FR[j], r = rad[k % RN] * f; return [Math.cos(a) * r, j === 5 ? -0.15 : 0.5 * (1 - f * f) + 0.1 + 0.22 * lump[j][k % RN], Math.sin(a) * r]; };
  const matCols = ['#7c7648', '#867e4c', '#74764a', '#807850'], wet = ['#506248', '#58684a'];
  const mn = (p) => b.norm([p[0] * 0.05, 1, p[2] * 0.05]);
  for (let k = 0; k < RN; k++) for (let j = 0; j < 5; j++) {
    const c = b.rgb(rng.pick(j >= 3 ? wet : matCols), 0.06), p0 = mp(k, j), p1 = mp(k, j + 1), p2 = mp(k + 1, j + 1), p3 = mp(k + 1, j);
    if (j === 0) { const z = [0, 0.75, 0]; b.tri(z, p1, p2, c, undefined, undefined, undefined, [mn(z), mn(p1), mn(p2)]); continue; }
    b.tri(p0, p1, p2, c, undefined, undefined, undefined, [mn(p0), mn(p1), mn(p2)]); b.tri(p0, p2, p3, c, undefined, undefined, undefined, [mn(p0), mn(p2), mn(p3)]);
  }
  // four huts facing a shared deck
  const huts = [], a0 = rng() * TAU;
  for (let i = 0; i < 4; i++) {
    const a = a0 + (i * TAU) / 4 + rng.range(-0.12, 0.12), r = 6.6, hx = Math.cos(a) * r, hz = Math.sin(a) * r;
    huts.push([hx, hz]);
    addHut(b, rng, hx, hz, Math.atan2(-Math.cos(a), -Math.sin(a)), o.full, o.cloth, o.cream);
    if (o.full) {
      const ux = -Math.cos(a), uz = -Math.sin(a), px = -uz, pz = ux, w = 0.45, y = 1.66, c = b.rgb('#93805e', 0.1);
      const P = (d, sgn) => [hx + ux * d + px * w * sgn, y, hz + uz * d + pz * w * sgn];
      b.quad(P(2.3, -1), P(2.3, 1), P(5.2, 1), P(5.2, -1), c);
      b.spar([hx + ux * 3.7, 0.1, hz + uz * 3.7], [hx + ux * 3.7, y, hz + uz * 3.7], 0.06, 0.06, 3, b.rgb('#6a5238', 0.1));
    }
  }
  if (o.full) {
    b.spar([0, 1.56, 0], [0, 1.68, 0], 2.1, 2.1, 8, b.rgb('#8a7355', 0.08), true);
    for (let i = 0; i < 4; i++) { const a = a0 + 0.785 + (i * TAU) / 4; b.spar([Math.cos(a) * 1.6, 0.1, Math.sin(a) * 1.6], [Math.cos(a) * 1.6, 1.56, Math.sin(a) * 1.6], 0.08, 0.07, 4, b.rgb('#6a5238', 0.1)); }
    // a basket and a net heap on the deck
    b.spar([0.5, 1.68, -0.4], [0.5, 2.15, -0.4], 0.26, 0.36, 7, b.rgb('#b08a4e', 0.1)); b.spar([-0.6, 1.68, 0.5], [-0.6, 1.95, 0.5], 0.6, 0.4, 8, b.rgb('#47686a', 0.1), true);
    const sa = a0 + 0.6; addSkiff(b, rng, Math.cos(sa) * 14.2, Math.sin(sa) * 14.2, sa + 0.4);
    b.ribbon([Math.cos(sa) * 14.2, 0.4, Math.sin(sa) * 14.2], [Math.cos(sa) * 10.5, 0.5, Math.sin(sa) * 10.5], 0.02, b.rgb('#3b3028'));
  }
  // float-leaves with white cup flowers moored round the rim
  for (let i = 0; i < (o.full ? 18 : 6); i++) {
    const a = rng() * TAU, rk = rad[Math.floor((a / TAU) * RN) % RN] + rng.range(0.4, 3.4), x = Math.cos(a) * rk, z = Math.sin(a) * rk, lr = rng.range(0.42, 0.66);
    b.spar([x, 0.02, z], [x, 0.06, z], lr, lr * 0.96, 7, b.rgb(rng.pick(['#3a6236', '#46703c', '#34583a']), 0.08), true, K4(0.02));
    if (rng.chance(0.5)) b.spar([x + 0.1, 0.06, z], [x + 0.1, 0.3, z], 0.05, 0.17, 5, b.rgb('#a9a99c', 0.05), false, K4(0.02), K4(0.04));
  }
  // herons on the port rim (local -x), in a glade of short turf
  const hs = [[-10.6, -4.2, -1.9, 1.05, 1], [-9.2, -1.4, -1.2, 0.95, 0.3], [-11.2, 1.3, -2.2, 1.0, 0.8], [-9.6, 3.6, -1.5, 0.9, 0.1]].slice(0, o.herons || 0);
  for (const hp of hs) addHeron(b, hp[0], hp[1], hp[2], hp[3] * 1.15, hp[4], 0.42, o.white);
  // reeds in tufts
  const wide = o.full ? 1 : 3.2;
  for (let i = 0; i < o.tufts; i++) {
    const skirt = i >= o.tufts * 0.7, a = rng() * TAU, rk = rad[Math.floor((a / TAU) * RN) % RN];
    const r = skirt ? rk * rng.range(0.82, 1.0) : Math.sqrt(rng()) * (rk - 1.5), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (huts.some((h) => Math.hypot(h[0] - x, h[1] - z) < 2.5) || Math.hypot(x, z) < 2.4) continue;
    const glade = hs.length > 0 && x < -7.2 && Math.abs(z) < 6.5;
    if (glade && hs.some((hp) => Math.hypot(hp[0] - x, hp[1] - z) < 0.9)) continue;
    const y0 = 0.45 * (1 - (r / 14) ** 2) + 0.15, hT = glade ? rng.range(0.3, 0.7) : skirt ? rng.range(0.9, 1.9) : rng.range(2.2, 3.8), nb = !o.full ? 3 : skirt || glade ? 4 : 5 + (rng() < 0.4 ? 1 : 0);
    const foot = b.rgb(rng.pick(['#3f6a2a', '#4a7630', '#547a2e']), 0.1), tip = b.rgb(rng.pick(['#c2b050', '#cdb85a', '#b4aa48']), 0.1);
    const mid = [(foot[0] * 1.3 + tip[0]) / 2.1, (foot[1] * 1.5 + tip[1]) / 2.1, (foot[2] * 1.3 + tip[2]) / 2.1];
    for (let q = 0; q < nb; q++) {
      const h = hT * rng.range(0.7, 1), ya = rng() * Math.PI, w = rng.range(0.06, 0.1) * wide, dx = Math.cos(ya) * w, dz = Math.sin(ya) * w;
      const la = rng() * TAU, ll = rng.range(0.15, 0.3) * h, lx = Math.cos(la) * ll, lz = Math.sin(la) * ll, bx = x + rng.range(-0.25, 0.25) * wide, bz = z + rng.range(-0.25, 0.25) * wide;
      const m = [bx + lx * 0.35, y0 + h * 0.58, bz + lz * 0.35], t = [bx + lx, y0 + h, bz + lz], wm = 0.33 * (h / 3), wt = h / 3;
      b.quad([bx - dx, y0, bz - dz], [bx + dx, y0, bz + dz], [m[0] + dx * 0.75, m[1], m[2] + dz * 0.75], [m[0] - dx * 0.75, m[1], m[2] - dz * 0.75], foot, K4(0), K4(0), K4(wm), K4(wm));
      b.tri([m[0] - dx * 0.75, m[1], m[2] - dz * 0.75], [m[0] + dx * 0.75, m[1], m[2] + dz * 0.75], t, mid, K4(wm), K4(wm), K4(wt));
      if (q === 0 && !skirt && !glade && rng.chance(o.garden ? 0.8 : 0.45)) {
        const c = b.rgb(o.plume, 0.08), pw = (o.garden ? 0.16 : 0.07) * wide, ph = o.garden ? 0.4 : 0.7;
        b.quad([t[0], t[1] - 0.1, t[2]], [t[0] + pw, t[1] + ph * 0.36, t[2] + pw], [t[0] + lx * 0.12, t[1] + ph, t[2] + lz * 0.12], [t[0] - pw, t[1] + ph * 0.36, t[2] - pw], c, K4(wt), K4(wt * 1.1), K4(wt * 1.25), K4(wt * 1.1));
      }
    }
  }
}

// a string of round float-leaves with white cup flowers, about 18 m long, lying along local z
function buildRaft(b, rng, n) {
  const K4 = (w) => [4, 0, 0, w], GREEN = ['#5c9e44', '#6aae4a', '#4f9248', '#7ab850', '#48884c'];
  let z = -n * 0.75, x = 0;
  for (let i = 0; i < n; i++) {
    z += rng.range(1.0, 2.0); x = x * 0.75 + rng.range(-0.9, 0.9);
    const r = rng.range(0.45, 0.72), c = b.rgb(rng.pick(GREEN), 0.1), c2 = c.map((v) => v * 1.25), w = rng.range(0.03, 0.07), a0 = rng() * TAU, m = K4(w);
    for (let k = 0; k < 7; k++) {
      const a = a0 + (k * TAU) / 7.6, a1 = a + TAU / 7.6;
      b.tri([x, 0.05, z], [x + Math.cos(a1) * r, 0.1, z + Math.sin(a1) * r], [x + Math.cos(a) * r, 0.1, z + Math.sin(a) * r], k & 1 ? c : c2, m, m, m);
    }
    if (rng.chance(0.42)) {
      const fx = x + rng.range(-0.15, 0.15), fz = z + rng.range(-0.15, 0.15), wc = b.rgb('#f2efe4', 0.04), pr = rng.range(0.26, 0.36);
      for (let k = 0; k < 5; k++) {
        const a = (k * TAU) / 5 + a0;
        b.tri([fx + Math.cos(a - 0.6) * 0.07, 0.11, fz + Math.sin(a - 0.6) * 0.07], [fx + Math.cos(a + 0.6) * 0.07, 0.11, fz + Math.sin(a + 0.6) * 0.07], [fx + Math.cos(a) * pr, 0.36, fz + Math.sin(a) * pr], wc, m, m, m);
      }
      b.spar([fx, 0.1, fz], [fx, 0.2, fz], 0.05, 0.03, 4, b.rgb('#d9a83a', 0.05), true, m);
    }
  }
}

// ---------------------------------------------------------------------------------------------------
// the world
// ---------------------------------------------------------------------------------------------------
export default {
  id: 'knotted-river',
  name: 'The River Tied in a Knot',
  category: 'bizarre',
  weirdness: 0.9,
  media: ['air', 'open', 'water'],

  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, V3 = THREE.Vector3, col = (h) => new THREE.Color(h);
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    const DURATION = 46;
    const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

    // ---- the look of this visit: hour, weather, cast ----
    const lookRoll = rng(), wxRoll = rng(), birdRoll = rng(), gardenRoll = rng(), egretRoll = rng();
    const hour = HOURS[vary.hour] ? vary.hour : lookRoll < 0.22 ? 'night' : lookRoll < 0.48 ? 'golden' : lookRoll < 0.6 ? 'day' : 'dawn';
    let weather = wxRoll < 0.6 ? 'clear' : wxRoll < 0.82 ? 'mist' : 'rain';
    if (hour === 'night' || (hour === 'golden' && weather === 'rain')) weather = 'clear';
    const H = HOURS[hour], mist = weather === 'mist' ? 1 : 0, rain = weather === 'rain' ? 1 : 0;
    const swifts = birdRoll > 0.72 && hour !== 'night', garden = gardenRoll > 0.7, egrets = egretRoll > 0.6;
    const sun = sunVec(H.az, H.el);
    const sunI = H.sunI * (mist ? 0.55 : rain ? 0.6 : 1);

    const scene = new THREE.Scene();
    const fogCol = col(H.fog); if (mist) fogCol.lerp(col(H.mid), 0.45); if (rain) fogCol.lerp(col('#9aa4b4'), 0.45);
    scene.fog = new THREE.FogExp2(fogCol, H.fogD * (mist ? 2.3 : rain ? 1.8 : 1));
    scene.background = fogCol.clone();

    // ---- the hero: the knot, the Crossing, the fleet, the Eyelet ----
    const hero = await buildHero(ctx, { palette: H.pal, detail, sunDir: sun.toArray(), sunColor: H.sunCol, sunIntensity: sunI, duration: DURATION, glow: H.glow, glowFar: H.glowFar ?? 1, limbTight: H.limb,
      body: H.body ?? 1, farCore: H.farCore, caust: H.caust, fill: H.fill ?? 1, glitter: H.glitter ?? 1, refl: H.refl, lamp: H.lamp ?? 0, underLit: H.underLit ?? 0, density, streak: H.streak ?? 1, glitterWide: H.glitW ?? 0, limbPale: H.limbPale ?? 0, netContrast: H.netK ?? 0, moonAmb: H.moonAmb ? new THREE.Color().fromArray(H.moonAmb) : null });
    scene.add(hero.object);
    const U = hero.uniforms, R0 = hero.tubeRadius, A = hero.anchors;
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    await ctx.yield();

    // ---- the path: the hero's route (anchors.flyThrough) ----
    const path = makePath(A.flyThrough);
    const portalPos = new V3().fromArray(A.portalSeat.position);
    const pathDir = path.tangentAt(1, new V3());
    // ---- the gaze: one continuous look carried through five subjects, a key only where the subject changes ----
    // on the water among the boats, looking up the river; the whole knot standing to the north; the bar and its hanging fleet
    // (first from the dive, nose down, its fleet hanging over the cloud sea, then from beneath its belly); the eye of the
    // knot; and from the turn high in the eye on, the way out: the bar running down to the rings, the portal's light at its end.
    // A key is [share of the flight, what is looked at]: a world point, ['d', azimuth, elevation] (a direction held from wherever
    // the lens is), or null (down the route). Between keys the look is carried by a spline through them, so it never comes to rest.
    // No share is typed: each is the place on the route's line where its subject is taken up, found below by measuring the line
    // against the world in 3 m steps; and each thing looked at is a place of the hero's own geometry.
    const RP = A.portalSeat.position, _gf = {};
    const upRiver = hero.place(A.entryS + 330, hero.crownTheta(A.entryS + 330), 0).position.toArray();          // (the river's crown 330 m up from where we arrive: the look lies along the water and its boats)
    // (the route's highest point is its turn in the eye; from there it is followed in 3 m steps to where it is first within 20 m of the water)
    const CL = []; for (let s = 0; s < hero.length; s += 10) CL.push(hero.frameAt(s, {}).C.clone());
    const waterDist = (p) => { let m = 1e18; for (const c of CL) m = Math.min(m, c.distanceToSquared(p)); return Math.sqrt(m) - R0; };
    await ctx.yield();
    let dTop = 0, dDown = 0; { const q = new V3(); let yTop = -1e9; for (let d = 0; d <= path.length; d += 3) if (path.posAtDist(d, q).y > yTop) { yTop = q.y; dTop = d; } for (dDown = dTop; dDown < path.length && waterDist(path.posAtDist(dDown, q)) > 20; dDown += 3); }
    // The places on the route's line (metres flown) that the keys, and the pace's slow passages below, are hung on:
    //   dUnder  where it passes closest beneath the bar, and dBridge, beneath the bridge at the Crossing (the hero's own two measures)
    //   dCrest  the top of the lift: its highest point before it goes under the bar
    //   dOff    where it leaves the water: the first place it is more than 20 m clear of the river it arrived on (the measure dDown uses, above)
    //   dLow    the bottom of the dive, where it goes in under the bar's belly: its lowest point between the lift's top and dUnder
    //   dSteep  where the dive between those two is steepest
    //   dRings  where it enters the rings: the place on it nearest the middle of the first shed hoop it comes to
    //   (and dTop, its turn high in the eye, found above)
    const dUnder = A.under.u * path.length, dBridge = A.bridge.u * path.length;
    let dOff = 0, dCrest = 0, dLow = 0, dSteep = 0, dRings = path.length; {
      const q = new V3(), c = new V3(); let yHi = -1e9, yLo = 1e9, fall = 1e9;
      for (let d = 0; d <= dUnder; d += 3) if (path.posAtDist(d, q).y > yHi) { yHi = q.y; dCrest = d; }
      while (dOff < path.length && waterDist(path.posAtDist(dOff, q)) <= 20) dOff += 3;
      yLo = 1e9; for (let d = dCrest; d <= dUnder; d += 3) if (path.posAtDist(d, q).y < yLo) { yLo = q.y; dLow = d; }
      for (let d = dCrest; d <= dLow; d += 3) if (path.tangentAtDist(d, q).y < fall) { fall = q.y; dSteep = d; }
      for (const h of A.hoops) { let m = 1e18, dN = 0; c.fromArray(h.centre); for (let d = 0; d <= path.length; d += 3) { const e = path.posAtDist(d, q).distanceToSquared(c); if (e < m) { m = e; dN = d; } } dRings = Math.min(dRings, dN); }
    }
    // What is looked at: the river's crown ahead (upRiver); the knot's centre, the middle of all its water; the bar's belly, where
    // its fleet hangs, at the bar's middle (midway along the river between the under-pass and the Crossing); the eye's centre (the
    // hero's landmark); the portal's seat. A held direction is the bearing of such a place from the key's own place on the route:
    // of the bar's belly from where the dive is steepest and again from the dive's bottom, of the eye's centre from the
    // under-pass.
    const knotC = new V3(); for (const c of CL) knotC.add(c); knotC.multiplyScalar(1 / CL.length);
    const sBar = (A.under.s + A.crossing.lowerS - hero.length) / 2, barBelly = hero.place(sBar, hero.crownTheta(sBar) + Math.PI, 0).position;
    const share = (d) => d / path.length, held = (d, p) => { const v = new V3().copy(p).sub(path.posAtDist(d, new V3())); return ['d', Math.atan2(v.x, v.z) / DEG, Math.asin(v.y / v.length()) / DEG]; };
    const GK = [[0, null], [share(dOff), upRiver], [share(dCrest), knotC.toArray()], [share(dSteep), held(dSteep, barBelly)], [share(dLow), held(dLow, barBelly)], [share(dUnder), held(dUnder, new V3().fromArray(A.landmarks.eye))], [share(dTop), RP], [share(dRings), RP], [1, null]];
    const AHEAD = clamp(path.length * 0.05, 8, 40), _g0 = new V3(), _g1 = new V3(), _gk = [new V3(), new V3(), new V3(), new V3()];
    const keyDir = (i, out) => {
      const k = GK[clamp(i, 0, GK.length - 1)][1];
      if (!k) return out.copy(_g1);
      if (k[0] === 'd') return out.set(Math.sin(k[1] * DEG) * Math.cos(k[2] * DEG), Math.sin(k[2] * DEG), Math.cos(k[1] * DEG) * Math.cos(k[2] * DEG));
      return out.set(k[0], k[1], k[2]).sub(_g0).normalize();
    };
    const keyU = (i) => GK[clamp(i, 0, GK.length - 1)][0];
    const gazeDirAt = (u, out) => {
      const d = clamp(u, 0, 1) * path.length; path.posAtDist(d, _g0); path.posAtDist(d + AHEAD, _g1); _g1.sub(_g0).normalize();
      let k = 1; while (k < GK.length - 1 && GK[k][0] < u) k++;
      const u1 = keyU(k - 1), u2 = keyU(k), du = Math.max(1e-6, u2 - u1), f = clamp((u - u1) / du, 0, 1), f2 = f * f, f3 = f2 * f;
      const [p0, p1, p2, p3] = _gk; keyDir(k - 2, p0); keyDir(k - 1, p1); keyDir(k, p2); keyDir(k + 1, p3);
      // a Hermite span with tangents taken across the neighbouring keys: direction and its rate are both continuous at a key
      const m1 = du / Math.max(1e-6, u2 - keyU(k - 2)), m2 = du / Math.max(1e-6, keyU(k + 1) - u1);
      const h00 = 2 * f3 - 3 * f2 + 1, h10 = f3 - 2 * f2 + f, h01 = -2 * f3 + 3 * f2, h11 = f3 - f2;
      out.set(0, 0, 0).addScaledVector(p1, h00 - h11 * m2).addScaledVector(p2, h01 + h10 * m1).addScaledVector(p0, -h10 * m1).addScaledVector(p3, h11 * m2);
      if (out.lengthSq() < 1e-6) out.copy(p1);
      return out.normalize();
    };

    // the strand nearest the route (arc length along the river), tabled every 12 m of route: the route leaves our strand, crosses the low
    // lobe's hole, goes under its western strand and flies out over the west loop's bottom strand
    const _f = {}, _p = new V3(), _pl = {}, _pl2 = {};
    const sNear = (p) => { let m = 1e18, bi = 0; for (let i = 0; i < CL.length; i++) { const d = CL[i].distanceToSquared(p); if (d < m) { m = d; bi = i; } }
      let bs = bi * 10; for (let s = bi * 10 - 9; s < bi * 10 + 10; s++) { const d = hero.frameAt(s, _f).C.distanceToSquared(p); if (d < m) { m = d; bs = s; } } return bs; };
    const NS = Math.ceil(path.length / 12), camS = new Float32Array(NS + 1);
    for (let i = 0; i <= NS; i++) { camS[i] = sNear(path.posAtDist(Math.min(path.length, i * 12), _p)); if ((i & 31) === 31) await ctx.yield(); }
    const sAtU = (u) => camS[Math.round(clamp(u, 0, 1) * NS)];
    const sEntry = A.entryS, sUnder = A.under.s, sArm = A.arm.s;
    await ctx.yield();
    const STEP = 3, pathSamples = []; for (let d = 0; d <= path.length; d += STEP) pathSamples.push(path.posAtDist(d));          // the route's line, a point every 3 m
    const pathDist = (p) => { let m = 1e18; for (const q of pathSamples) m = Math.min(m, q.distanceToSquared(p)); return Math.sqrt(m); };
    const upS = A.crossing.upperS, crossPos = new V3().fromArray(A.crossing.position);
    await ctx.yield();

    // ---- sky dome ----
    const domeU = {
      uNoise: U.uNoise, uTime: U.uTime, uMist: { value: mist }, uRain: { value: rain }, uStars: { value: H.stars }, uDeckY: { value: DECK_Y },
      uGap: { value: hour === 'night' ? 1 : 0 }, uLowK: { value: H.deckLow ?? 1 }, uRoll: { value: new THREE.Vector2(Math.cos((H.deckRoll ?? 0) * DEG), Math.sin((H.deckRoll ?? 0) * DEG)) }, uDisc: { value: H.disc }, uDiscCos: { value: Math.cos(H.discSize * DEG) },
      uZen: { value: col(H.zen).multiplyScalar(H.k) }, uMid: { value: col(H.mid).multiplyScalar(H.k) }, uHor: { value: col(H.hor).multiplyScalar(H.k) }, uHaze: { value: col(H.haze).multiplyScalar(H.k) },
      uLit: { value: col(H.lit).multiplyScalar(H.k) }, uShade: { value: col(H.shade).multiplyScalar(H.k * 0.8) }, uBay: { value: col(H.bay).multiplyScalar(H.k * 0.5) },
      uDeckLit: { value: col(H.deckLit).multiplyScalar(H.k * 0.95) }, uDeckShade: { value: col(H.deckShade).multiplyScalar(H.k * 0.74) },
      uSunDir: U.uSunDir, uSunCol: { value: col(H.sunCol) }, uTow: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
    };
    const dome = new THREE.Mesh(new THREE.SphereGeometry(10, 40, 24), new THREE.ShaderMaterial({ vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, uniforms: domeU, side: THREE.BackSide, depthWrite: false, fog: false }));
    dome.frustumCulled = false; dome.renderOrder = -10; dome.name = 'sky'; scene.add(dome);
    // the fog takes the horizon's colour so far strands sink into the same air
    scene.fog.color.copy(domeU.uHaze.value); if (rain) scene.fog.color.lerp(col('#7f8894'), 0.4); scene.background.copy(scene.fog.color);
    // (dark water under a bright peach haze goes beige: the haze is taken half-way to the water's own glow colour, so far loops stay water)
    U.uHaze.value.copy(scene.fog.color).lerp(U.uAqua.value, H.hazeAqua ?? 0.55); U.uHazeK.value.set((H.hazeD ?? 0.00018) * (mist ? 1.5 : rain ? 1.3 : 1), 0.75);     // the water's own distance haze

    // ---- cumulus heads standing out of the cloud sea ----
    const puffU = { uNoise: U.uNoise, uTime: U.uTime, uSunDir: U.uSunDir, uMist: domeU.uMist, uLit: domeU.uLit, uShade: H.puffShade ? { value: col(H.puffShade) } : domeU.uShade, uTopLit: { value: H.puffTop ?? 0 }, uHaze: domeU.uHaze, uSunCol: domeU.uSunCol };
    {
      const prng = rng.fork('puffs'), list = [], sx = sun.x / Math.max(1e-3, Math.hypot(sun.x, sun.z)), sz = sun.z / Math.max(1e-3, Math.hypot(sun.x, sun.z));
      // one tower: half-width w, top at y = top. rich towers get more buds
      const tower = (cx, cz, w, top, rich) => {
        const h = top - DECK_Y, body = [], buds = [];
        const put = (x, y, z, r, soft, into) => { const L = [x, y, z, r, prng(), clamp((y - DECK_Y) / h, 0, 1), prng() * TAU, clamp(((x - cx) * sx + (z - cz) * sz) / w, -1, 1), soft]; list.push(L); if (into) into.push(L); };
        const nb = rich ? 7 : 4, nm = rich ? 12 : 6, nt = Math.round((rich ? 34 : 12) * (0.6 + 0.4 * detail)), nc = Math.round((rich ? 26 : 6) * (0.6 + 0.4 * detail));
        for (let i = 0; i < nb; i++) { const a = ((i + prng()) / nb) * TAU, d = w * prng.range(0.3, 0.72), r = w * prng.range(0.42, 0.62); put(cx + Math.cos(a) * d, DECK_Y + r * 0.25, cz + Math.sin(a) * d * 0.8, r, 1); }
        for (let i = 0; i < nm; i++) { const t = (i + 0.5) / nm, a = prng() * TAU, d = w * (1 - 0.55 * t) * prng.range(0.05, 0.8), r = w * prng.range(0.3, 0.45) * (1 - 0.3 * t); put(cx + Math.cos(a) * d, DECK_Y + h * (0.25 + 0.6 * t) - r * 0.4, cz + Math.sin(a) * d * 0.8, r, 0.3, body); }
        for (let i = 0; i < nt; i++) { const q = prng.pick(body), a = prng() * TAU, el = prng.range(0.05, 1.35), r = q[3] * prng.range(0.28, 0.5), d = q[3] * 0.85; put(q[0] + Math.cos(a) * Math.cos(el) * d, q[1] + Math.sin(el) * d, q[2] + Math.sin(a) * Math.cos(el) * d * 0.6, r, 0.12, buds); }
        for (let i = 0; i < nc && buds.length; i++) { const q = prng.pick(buds), a = prng() * TAU, el = prng.range(0.0, 1.3), r = q[3] * prng.range(0.34, 0.6), d = q[3] * 0.85; put(q[0] + Math.cos(a) * Math.cos(el) * d, q[1] + Math.sin(el) * d, q[2] + Math.sin(a) * Math.cos(el) * d * 0.6, r, 0); }
      };
      // the four great heads, of clearly different sizes, far out to the north; they ride the same 6 m/s drift as the deck
      // and are the ones that lay a shadow on it
      const placed = [[330, 2260, 450, -80], [-1400, 1935, 300, -250], [-2850, 3853, 380, -140], [707, 6024, 430, -150]];
      for (const [x, z, w, top] of placed) tower(x, z, w, top, true);
      const tanEl = Math.max(0.12, sun.y / Math.max(1e-3, Math.hypot(sun.x, sun.z)));
      // (by a low moon the shadows are held short: long dark lanes across a night deck read as smears, not as shade)
      domeU.uTow.value = placed.map(([x, z, w, top]) => new THREE.Vector4(x, z, w * 1.05, Math.min(H.towShadow ?? 2800, (top - DECK_Y) / tanEl)));
      const nHead = Math.max(16, Math.round(30 * detail));
      for (let i = 0, tries = 0; i < nHead && tries < 300; tries++) {
        const ang = prng.range(-2.4, 2.4), dist = prng.range(600, 4400), cx = 200 + Math.sin(ang) * dist, cz = 700 + Math.cos(ang) * dist * 1.1;
        const big = prng() < 0.25, w = big ? prng.range(190, 300) : prng.range(80, 170), top = big ? prng.range(-360, -230) : prng.range(-560, -400);
        if (placed.some((q) => Math.hypot(q[0] - cx, q[1] - cz) < 2.2 * (q[2] + w))) continue;
        tower(cx, cz, w, top, big); i++;
      }
      list.sort((a, b) => b[2] - a[2]);
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const aC = new Float32Array(list.length * 4), aD = new Float32Array(list.length * 4), aE = new Float32Array(list.length);
      list.forEach((p, i) => { aC.set([p[0], p[1], p[2], p[3]], i * 4); aD.set([p[4], p[5], p[6], p[7]], i * 4); aE[i] = p[8]; });
      g.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4)); g.setAttribute('aD', new THREE.InstancedBufferAttribute(aD, 4)); g.setAttribute('aE', new THREE.InstancedBufferAttribute(aE, 1)); g.instanceCount = list.length;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: PUFF_VERT, fragmentShader: PUFF_FRAG, uniforms: puffU, transparent: true, depthWrite: false, fog: false }));
      m.frustumCulled = false; m.renderOrder = -5; m.name = 'cumulus'; scene.add(m);
    }
    await ctx.yield();

    // ---- reed islets with stilt huts ----
    // The islets of our stretch float (or hang, as gardens) at the hero's berths: places drawn on the river by its own rule,
    // which the fleet's courses keep clear of. The far ones are drawn anywhere on the river away from the route.
    const clothHex = H.pal[5];
    const plume = garden ? '#d2452c' : '#e2d6b4';
    const irng = rng.fork('islets'), taken = [];
    const mkIslet = (s, th, yaw, scale = 1) => ({ s, th, yaw, scale, mir: 1, vs: 0, vth: 0, phase: irng() * TAU, seed: irng() });
    taken.push(hero.place(A.under.islet.s, A.under.islet.th, 0).position.clone());          // the hero's own islet on the bar's belly
    const thDown = (s) => hero.crownTheta(s) + Math.PI;
    // the herons' islet: of the berths that stand upright on a crown, the one the route passes nearest
    let heronBerth = null;
    for (const b of A.berths) if (!heronBerth || b.upY - b.d / 60 > heronBerth.upY - heronBerth.d / 60) heronBerth = b;
    const heronIslet = heronBerth ? mkIslet(heronBerth.s, heronBerth.th, 0) : null;
    const nearList = [], farList = [];
    for (const b of A.berths) { taken.push(hero.place(b.s, b.th, 0).position.clone()); if (b !== heronBerth) nearList.push(mkIslet(b.s, b.th, irng() * TAU, irng.range(0.9, 1.08))); }
    await ctx.yield();
    const nFar = Math.round(27 * density * (0.6 + 0.4 * detail));
    for (let tries = 0; farList.length < nFar && tries < 400; tries++) {
      const s = irng() * hero.length, th = irng() * TAU, p = hero.place(s, th, 0, _pl).position;
      if (pathDist(p) < 130 || taken.some((t) => t.distanceTo(p) < 60)) continue;
      farList.push(mkIslet(s, th, irng() * TAU, irng.range(0.95, 1.5))); taken.push(p.clone());
      if ((tries & 15) === 15) await ctx.yield();
    }
    await ctx.yield();
    const wrapMat = hero.standMaterial({ WRAP: 1 });
    const isletOpts = { cloth: clothHex, cream: H.pal[1], garden, plume, white: egrets };
    if (heronIslet) { const b = hero.builder(); buildIslet(b, irng, { ...isletOpts, tufts: Math.round(250 * (0.7 + 0.3 * detail)), full: true, herons: 3 }); await ctx.yield(); const g = b.geometry(); await ctx.yield(); hero.add(hero.instanced(g, [heronIslet]), wrapMat, 3, 'heron-islet'); }
    await ctx.yield();
    { const b = hero.builder(); buildIslet(b, irng, { ...isletOpts, tufts: Math.round(230 * (0.7 + 0.3 * detail)), full: true, herons: 2 }); await ctx.yield(); const g = b.geometry(); await ctx.yield(); hero.add(hero.instanced(g, nearList), wrapMat, 3, 'islets'); }
    await ctx.yield();
    { const b = hero.builder(); buildIslet(b, irng, { ...isletOpts, tufts: 46, full: false, herons: 0 }); hero.add(hero.instanced(b.geometry(), farList), wrapMat, 3, 'far-islets'); }
    await ctx.yield();

    // ---- strings of float-leaves drifting on the current ----
    {
      const lrng = rng.fork('leaves'), rafts = [], b = hero.builder(); buildRaft(b, lrng, 12);
      const nearIslets = [heronIslet, ...nearList].filter(Boolean).map((i) => hero.place(i.s, i.th, 0).position.clone());
      const want = Math.round(190 * density * detail);
      for (let tries = 0; rafts.length < want && tries < 5000; tries++) {
        if ((tries & 255) === 255) await ctx.yield();
        const s = lrng() * hero.length, th = lrng() * TAU, far = lrng() < 0.03;          // drawn anywhere on the river, kept where the water lies near the route's line (a few anywhere)
        if (!far && pathDist(hero.place(s, th, 0, _pl).position) > 95) continue;
        const p = hero.place(s, th, 0, _pl).position;
        if (nearIslets.some((q) => q.distanceToSquared(p) < 19 * 19)) continue;
        rafts.push({ s, th, yaw: lrng.range(-0.35, 0.35) + (lrng.chance(0.5) ? Math.PI : 0), scale: lrng.range(0.9, 1.5), mir: lrng.sign(), vs: lrng.range(0.5, 1.1), vth: 0, phase: lrng() * TAU, seed: lrng() });
      }
      const raftMat = hero.standMaterial({ WRAP: 1 }); raftMat.uniforms.uFarShrink.value = 1;
      hero.add(hero.instanced(b.geometry(), rafts), raftMat, 3, 'float-leaves');
    }
    await ctx.yield();

    // ---- terns (or swifts) orbiting the strands in rings like bracelets ----
    const birdU = { ...fogU(), ...U, uBirdTint: { value: col(hour === 'night' ? '#b4c2e2' : '#ffffff') }, uFlapRate: { value: 1 }, uFlapAmp: { value: 0.8 }, uBirdFloor: { value: hour === 'night' ? 0.5 : 0 } };
    const birdGeo = birdGeometry(swifts);
    const birdMat = (defines, uni) => new THREE.ShaderMaterial({ vertexShader: birdVert(hero.radialGLSL), fragmentShader: birdFrag(hero.skyGLSL), uniforms: uni || birdU, fog: true, side: THREE.DoubleSide, defines: defines || {} });
    {
      const trng = rng.fork('terns'), birds = [];
      const add = (s, th, h, sc, wc, wt, vs = 0) => birds.push(s, th, h, sc, wc, wt, trng() * TAU, vs);
      // every ring is fixed on its strand and turns round it like a bracelet. One ring of 30 is the one we cross (the design's
      // beat): it turns round the bar where the route, coming down along it, is first within 20 m of the water. Its circle
      // passes RING_UNDER = 7 m beneath the route's line (the design's 6-8 m: a margin in space, the birds scattered a metre
      // either way), and it turns on the journey's clock, as the boats sail
      {
        const RING_UNDER = 7, pX = path.posAtDist(dDown, new V3()), sX = sNear(pX), hX = Math.max(7, hero.frameAt(sX, _f).C.distanceTo(pX) - R0 - RING_UNDER), w = 0.12 * trng.sign(), t0 = trng() * TAU;
        for (let i = 0; i < 30; i++) add(sX + trng.range(-3, 3), t0 + (i / 30) * TAU + trng.range(-0.05, 0.05), hX + trng.range(-1, 1), 1.6, w, 0);
      }
      // no other ring's circle comes within 13 m of the route's line
      const ringClear = (s, hm) => {
        const f = hero.frameAt(s, _f);
        for (const p of pathSamples) { const ax = _p.subVectors(p, f.C).dot(f.T); if (Math.abs(ax) > 11) continue; const rad = Math.sqrt(Math.max(0, _p.lengthSq() - ax * ax)); if (Math.abs(rad - R0 - hm) < 13) return false; }
        return true;
      };
      // the other rings: each one's place along the river is a draw from the terns' stream
      const nRing = Math.max(12, Math.round(19 * (0.6 + 0.4 * detail)));
      for (let r = 0, tries = 0; r < nRing && tries < 200; tries++) {
        const s = trng() * hero.length, hm = trng.range(14, 30);
        if (!ringClear(s, hm)) continue;
        const w = trng.sign() * trng.range(0.09, 0.15), n = 30, t0 = trng() * TAU;
        for (let i = 0; i < n; i++) add(s + trng.range(-4, 4), t0 + (i / n) * TAU + trng.range(-0.06, 0.06), hm + trng.range(-2.5, 2.5), trng.range(1.25, 1.7), 0, w);
        r++;
      }
      const ternMat = birdMat(), liteGeo = birdGeometry(swifts, true);
      const ring = (geo, from, to, name) => {
        const n = to - from, g = new THREE.InstancedBufferGeometry();
        for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]);
        const aA = new Float32Array(n * 4), aB = new Float32Array(n * 4);
        for (let i = 0; i < n; i++) { const o = (from + i) * 8; aA.set(birds.slice(o, o + 4), i * 4); aB.set(birds.slice(o + 4, o + 8), i * 4); }
        g.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); g.instanceCount = n;
        hero.add(g, ternMat, 3, name);
      };
      ring(birdGeo, 0, 30, 'tern-ring'); ring(liteGeo, 30, birds.length / 8, 'terns');          // the ring we cross is drawn in full
    }
    // nine more circle the Eyelet
    const hoopBirds = new THREE.InstancedMesh(birdGeo, birdMat({ FREE: 1 }, { ...birdU, uBirdTint: { value: col(hour === 'night' ? '#d2dcf4' : '#ffffff') } }), 9);
    hoopBirds.frustumCulled = false; hoopBirds.renderOrder = 3; hoopBirds.name = 'eyelet-terns'; scene.add(hoopBirds);
    const hoopE1 = new V3().crossVectors(pathDir, new V3(0, 1, 0)).normalize(), hoopE2 = new V3().crossVectors(hoopE1, pathDir).normalize();
    const erng = ctx.core.makeRng(ctx.core.hashSeed('knotted-river-eyelet-terns:' + ctx.seed)), eyeletPh0 = erng() * TAU, eyeletPh = []; for (let i = 0; i < 9; i++) eyeletPh.push([erng() * TAU, erng() * TAU, erng() * TAU]);          // where the nine are in their round, and each one's own sway, from a stream of their own
    await ctx.yield();

    // ---- silver fish leaping beside the skim ----
    {
      const frng = rng.fork('fish'), n = Math.round(300 * detail), g = new THREE.InstancedBufferGeometry(), fg = fishGeometry();
      for (const k in fg.attributes) g.setAttribute(k, fg.attributes[k]);
      const aA = new Float32Array(n * 4), aB = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        const s = sEntry + frng.range(-25, 170), side = frng.sign() * (i % 3 === 0 ? frng.range(3, 10) : frng.range(8, 34));
        aA.set([s, hero.crownTheta(s) + side / R0, (frng.chance(0.5) ? 0 : Math.PI) + frng.range(-0.7, 0.7), frng.range(0.85, 1.35)], i * 4);
        aB.set([frng.range(3.2, 8), frng(), frng.range(2.6, 5.2), frng.range(1.0, 2.7)], i * 4);
      }
      g.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); g.instanceCount = n;
      hero.add(g, new THREE.ShaderMaterial({ vertexShader: fishVert(hero.radialGLSL), fragmentShader: fishFrag(hero.skyGLSL), uniforms: { ...fogU(), ...U }, fog: true, side: THREE.DoubleSide }), 3, 'leaping-fish');
    }

    // ---- six herons lift off their islet as the route comes up on it ----
    // Each flies a curve fixed in the world: from its standing place on the islet's rim up the islet's own radial, then away
    // along and round the strand on a heading and a climb drawn from the herons' stream (they leave together, fanned a
    // little). No point of a curve is read from the route. A bird's place on its curve is driven by the metres flown since
    // the route's line first came within HERON_REACH of the islet: 130 m, just outside the berths' own rule (every islet of
    // our stretch lies within 125 m of the line), so the herons of whichever islet they stand on are flushed. A bird flies
    // HERON_K metres for each metre we fly (a heron's 14 m/s against our 57), each leaves a wingbeat after the one before
    // (9 m of our flight), and every curve keeps HERON_CLEAR metres from the route's line.
    const HN = 6, HSCALE = 1.25, HERON_REACH = 130, HERON_K = 0.25, HERON_CLEAR = 12, heronCurves = [], heronLen = [], heronLag = [];
    const heronMesh = new THREE.InstancedMesh(heronGeometry(egrets), birdMat({ FREE: 1 }, { ...birdU, uFlapRate: { value: 0.5 }, uFlapAmp: { value: 0.62 } }), HN);
    heronMesh.frustumCulled = false; heronMesh.renderOrder = 3; heronMesh.name = 'herons'; scene.add(heronMesh);
    let dLift = 1e9; const heronUp = new V3(0, 1, 0);
    if (heronIslet) {
      const hrng = rng.fork('herons'), iP = hero.place(heronIslet.s, heronIslet.th, 0, _pl).position.clone(); heronUp.copy(_pl.up);
      let dN = 1e9, iN = 0, iIn = -1;
      for (let i = 0; i < pathSamples.length; i++) { const d = pathSamples[i].distanceTo(iP); if (d < dN) { dN = d; iN = i; } if (iIn < 0 && d < HERON_REACH) iIn = i; }
      dLift = (iIn >= 0 ? iIn : iN) * STEP;
      const a0 = hrng() * TAU;          // the heading they leave on, over the water: any way along and round the strand
      for (let i = 0; i < HN; i++) {
        const lx = -hrng.range(8.5, 11.5), lz = -5 + i * 2 + hrng.range(-0.6, 0.6), s0 = heronIslet.s + lz, th0 = heronIslet.th - lx / R0;
        let curve = null;
        for (let tries = 0; tries < 40 && !curve; tries++) {
          const al = a0 + hrng.range(-0.4, 0.4), climb = hrng.range(0.14, 0.3), ca = Math.cos(al), sa = Math.sin(al);
          const pts = [hero.place(s0, th0, 1.2).position.clone(), hero.place(s0, th0, 4.5).position.clone()];
          for (const D of [14, 36, 70, 115, 170, 235]) { const h = 6 + climb * D + hrng.range(-1.5, 1.5); pts.push(hero.place(s0 + D * ca, th0 + (D * sa) / (R0 + h), h).position.clone()); }
          const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5); let ok = true;
          for (const q of c.getSpacedPoints(80)) if (pathDist(q) < HERON_CLEAR) { ok = false; break; }
          if (ok) curve = c;
          if ((tries & 3) === 3) await ctx.yield();
        }
        heronCurves.push(curve); heronLen.push(curve ? curve.getLength() : 0); heronLag.push(i * 9 + hrng.range(0, 6));
        await ctx.yield();
      }
    }
    const hA = new V3(), hB = new V3(), hX = new V3(), hY = new V3(), hZ = new V3(), hM = new THREE.Matrix4(), hS = new V3();
    const updateHerons = (u) => {
      const flown = u * path.length - dLift;
      for (let i = 0; i < HN; i++) {
        const c = heronCurves[i], m = c ? (flown - heronLag[i]) * HERON_K : -1;
        if (!c || m <= 0 || m >= heronLen[i]) { heronMesh.setMatrixAt(i, hM.makeScale(0, 0, 0)); continue; }
        const t = m / heronLen[i]; c.getPointAt(t, hA); c.getTangentAt(t, hZ); c.getTangentAt(Math.min(1, t + 3 / heronLen[i]), hB);
        hX.crossVectors(heronUp, hZ); if (hX.lengthSq() < 1e-4) hX.set(1, 0, 0); hX.normalize(); hY.crossVectors(hZ, hX);
        // wings bank by the turn of the bird's own curve
        const roll = clamp((hB.sub(hZ).dot(hX) / 3) * 30, -0.6, 0.6), cr = Math.cos(roll), sr = Math.sin(roll);
        hB.copy(hX).multiplyScalar(cr).addScaledVector(hY, -sr); hY.multiplyScalar(cr).addScaledVector(hX, sr); hX.copy(hB);
        const sc = HSCALE * Math.min(1, m / 2) * Math.min(1, (heronLen[i] - m) / 8);
        heronMesh.setMatrixAt(i, hM.makeBasis(hX, hY, hZ).scale(hS.set(sc, sc, sc)).setPosition(hA));
      }
      heronMesh.instanceMatrix.needsUpdate = true;
    };
    await ctx.yield();

    // ---- cooking smoke rising off every hut's own roof (the droplet beads all sail the hero's arcs between strands that pass close) ----
    {
      const mrng = rng.fork('motes'), P0 = [], P1 = [], S = [];
      const smoky = [heronIslet, ...nearList].filter(Boolean);
      for (const it of smoky) for (let hI = 0; hI < 2; hI++) {
        const ds = mrng.range(-7, 7), dth = mrng.range(-7, 7) / R0, a = hero.place(it.s + ds, it.th + dth, 5.6, _pl), b = hero.place(it.s + ds + mrng.range(-8, 8), it.th + dth, mrng.range(24, 34), _pl2);
        const nP = Math.round(7 * (0.6 + 0.4 * detail)), rate = 1 / mrng.range(8, 12), ph = mrng();
        for (let j = 0; j < nP; j++) { P0.push(a.position.x, a.position.y, a.position.z); P1.push(b.position.x, b.position.y, b.position.z); S.push(mrng.range(1.5, 2.3), 1, ph + j / nP, rate); }
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aP0', new THREE.InstancedBufferAttribute(new Float32Array(P0), 3)); g.setAttribute('aP1', new THREE.InstancedBufferAttribute(new Float32Array(P1), 3));
      g.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(S), 4)); g.instanceCount = S.length / 4;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: MOTE_VERT, fragmentShader: MOTE_FRAG, uniforms: { ...fogU(), ...U }, fog: true, transparent: true, depthWrite: false,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
      m.frustumCulled = false; m.renderOrder = 7; m.name = 'smoke'; scene.add(m);
    }
    // ---- rain that falls inward toward the strand from every side ----
    if (rain) {
      const rrng = rng.fork('rain');
      const mk = (n, win, hmax, s0, th0, spread) => {
        const g = new THREE.InstancedBufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
        const a = new Float32Array(n * 4);
        for (let i = 0; i < n; i++) a.set([rrng(), spread ? rrng.gauss() * spread : rrng() * TAU, rrng(), rrng.range(26, 42)], i * 4);          // (no spread: anywhere round the girth)
        g.setAttribute('aA', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = n;
        const mat = new THREE.ShaderMaterial({ vertexShader: rainVert(hero.radialGLSL).replace('aA.y, 0.0, C', 'aA.y + uThC, 0.0, C').replace('uniform float uTime,', 'uniform float uThC, uTime,'), fragmentShader: RAIN_FRAG,
          uniforms: { uFrames: U.uFrames, uLen: U.uLen, uTubeR: U.uTubeR, uTime: U.uTime, uPixAng: U.uPixAng, uCamS: { value: s0 }, uThC: { value: th0 }, uWin: { value: win }, uHmax: { value: hmax }, uRainCol: { value: col('#cfe0ee').multiplyScalar(0.8) } },
          transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
        const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 8; m.name = 'rain'; scene.add(m); return mat;
      };
      // the sleeve round every strand: streaks dealt anywhere along the whole river and anywhere round its girth, each falling where
      // it was dealt. Its window is the river's whole loop, so it has no ends to fade, and nothing of it slides or turns
      { const sleeve = mk(Math.round(23600 * detail), hero.length, 46, hero.length / 2, 0, 0); sleeve.vertexShader = sleeve.vertexShader.replace(' * (1.0 - smoothstep(0.4, 0.5, abs(so)))', ''); }
      mk(Math.round(2200 * detail), 300, 60, upS, hero.thetaToward(upS, crossPos), 0.9);
    }

    // ---- rare: the Splice, a rope of water twisting across the gap, fish swimming up it, a skiff poled along it ----
    let splice = null;
    if (vary.rare) {
      // The rope hangs 25 m to port of the route's line where the route passes beneath the western strand (the Crossing):
      // it leaves the bar and joins the bridge's belly at the places on each nearest that point
      const dB = A.bridge.u * path.length, srng = rng.fork('splice'), tC = path.tangentAtDist(dB, new V3()), left = new V3(-tC.z, 0, tC.x).normalize();
      const Q = path.posAtDist(dB, new V3()).addScaledVector(left, 25);
      const nearestOn = (s0) => { let best = 1e18, bs = s0; for (let s = s0 - 90; s <= s0 + 90; s += 2) { const d = hero.frameAt(s, _f).C.distanceToSquared(Q); if (d < best) { best = d; bs = s; } } return hero.place(bs, hero.thetaToward(bs, Q), -1.5).position.clone(); };
      const A0 = nearestOn(A.crossing.lowerS), B0 = nearestOn(upS), axis = B0.clone().sub(A0), L0 = axis.length(), ax = axis.clone().normalize();
      const e1 = new V3().crossVectors(ax, tC).normalize(), e2 = new V3().crossVectors(ax, e1).normalize();
      const centre = (t, out) => { const ph = 2.6 * Math.PI * t + 0.5, k = Math.sin(Math.PI * t), r = 9 * k * k; return out.copy(A0).addScaledVector(axis, t).addScaledVector(e1, Math.cos(ph) * r).addScaledVector(e2, Math.sin(ph) * r); };
      const radius = (t) => 2 + 5 * (Math.exp((-t * L0) / 4.5) + Math.exp((-(1 - t) * L0) / 4.5));        // 4 m thick, flaring where it joins each river
      const NR = 110, NV = 14, C = [], T = [], N = [], Bn = [], Rr = [], cum = [0];
      for (let i = 0; i <= NR; i++) C.push(centre(i / NR, new V3()));
      for (let i = 0; i <= NR; i++) { T.push(C[Math.min(NR, i + 1)].clone().sub(C[Math.max(0, i - 1)]).normalize()); Rr.push(radius(i / NR)); if (i) cum.push(cum[i - 1] + C[i].distanceTo(C[i - 1])); }
      let n0 = e1.clone();
      for (let i = 0; i <= NR; i++) { n0.addScaledVector(T[i], -n0.dot(T[i])).normalize(); N.push(n0.clone()); Bn.push(new V3().crossVectors(T[i], n0)); }
      const len = cum[NR], pos = [], nor = [], tan = [], st = [], idx = [];
      for (let i = 0; i <= NR; i++) for (let j = 0; j <= NV; j++) {
        const a = (j / NV) * TAU + cum[i] * 0.09, cx = Math.cos(a), sx = Math.sin(a), rx = N[i].x * cx + Bn[i].x * sx, ry = N[i].y * cx + Bn[i].y * sx, rz = N[i].z * cx + Bn[i].z * sx;
        pos.push(C[i].x + rx * Rr[i], C[i].y + ry * Rr[i], C[i].z + rz * Rr[i]); nor.push(rx, ry, rz); tan.push(T[i].x, T[i].y, T[i].z); st.push(cum[i], (j / NV) * TAU);
      }
      for (let i = 0; i < NR; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + 1, c = a + NV + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aT', new THREE.Float32BufferAttribute(tan, 3)); g.setAttribute('aST', new THREE.Float32BufferAttribute(st, 2)); g.setIndex(idx);
      const rope = new THREE.Mesh(g, hero.waterMaterial(len, { radius: 2, glow: 1.9, flow: 1.6, tiles: 3, ripple: 0.6, bulge: 0.18 }));
      rope.frustumCulled = false; rope.renderOrder = 1; rope.name = 'splice'; scene.add(rope);
      // things that ride it are lit like everything else here
      const freeMat = (spec) => new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...U, uSpec: { value: spec } },
        vertexShader: /* glsl */ `
attribute vec3 color; varying vec3 vN, vCol, vWPos;
#include <fog_pars_vertex>
void main() {
#ifdef USE_INSTANCING
  mat4 im = instanceMatrix;
#else
  mat4 im = mat4(1.0);
#endif
  vec4 wp = modelMatrix * im * vec4(position, 1.0);
  vN = mat3(modelMatrix) * mat3(im) * normal; vCol = color; vWPos = wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
        fragmentShader: /* glsl */ `
precision highp float; uniform float uSpec; varying vec3 vN, vCol, vWPos;
${hero.skyGLSL}
#include <fog_pars_fragment>
void main() {
  vec3 V = normalize(cameraPosition - vWPos + vec3(0.0, 1e-5, 0.0)), n = normalize(vN + vec3(0.0, 1e-5, 0.0));
  if (dot(n, V) < 0.0) n = -n;
  float sp = max(dot(n, normalize(V + uSunDir + vec3(0.0, 1e-5, 0.0))), 0.0); float s8 = sp * sp; s8 *= s8; s8 *= s8; float s32 = s8 * s8; s32 *= s32;
  vec3 col = vCol * (skyAmbient(n) + uSunCol * max(dot(n, uSunDir), 0.0) * 0.7) + uSunCol * s32 * uSpec;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}` });
      const nFish = 18, fishes = new THREE.InstancedMesh(fishGeometry(), freeMat(1.4), nFish); fishes.frustumCulled = false; fishes.renderOrder = 3; fishes.name = 'splice-fish'; scene.add(fishes);
      const fph = []; for (let i = 0; i < nFish; i++) fph.push([srng(), srng() * TAU, srng.range(0.03, 0.05), srng.range(1.0, 1.5)]);
      const sb = hero.builder(); addSkiff(sb, srng, 0, 0, 0, 0);
      sb.spar([0, 0.3, -1.25], [0, 1.45, -1.3], 0.2, 0.13, 6, sb.rgb('#b9a47c', 0.05), true);            // the poler: a tunic,
      sb.spar([0, 1.45, -1.3], [0, 1.68, -1.3], 0.1, 0.1, 6, sb.rgb('#8a6248', 0.05), true);             // a head
      sb.spar([0, 1.6, -1.3], [0, 1.86, -1.3], 0.44, 0.03, 9, sb.rgb('#d8bf7c', 0.05), true);            // and a wide hat
      sb.spar([0.3, 2.9, -0.75], [0.62, -1.9, -1.9], 0.035, 0.03, 4, sb.rgb('#7a5c40', 0.05));           // the pole
      sb.spar([0.15, 1.2, -1.15], [0.36, 1.3, -1.0], 0.05, 0.045, 4, sb.rgb('#b9a47c', 0.05));
      sb.spar([-0.1, 0.3, 0.5], [-0.1, 0.72, 0.5], 0.24, 0.33, 7, sb.rgb('#b08a4e', 0.1)); sb.spar([-0.1, 0.66, 0.5], [-0.1, 0.8, 0.5], 0.3, 0.1, 7, sb.rgb(clothHex, 0.06), true);
      sb.spar([0.12, 0.3, 1.3], [0.12, 0.5, 1.3], 0.3, 0.2, 7, sb.rgb('#47686a', 0.1), true);
      const skiff = new THREE.Mesh(sb.geometry(), freeMat(0)); skiff.frustumCulled = false; skiff.renderOrder = 3; skiff.name = 'splice-skiff'; scene.add(skiff);
      const m4 = new THREE.Matrix4(), X = new V3(), Y = new V3(), Z = new V3(), O = new V3(), sc3 = new V3();
      const skiffAng = srng() * TAU, skiffPh = srng() * TAU;          // the skiff stands on the rope's own radial, at an angle drawn once; where it is in its passage up and down the rope, likewise
      const at = (t, ang, lift, sgn, scale, out) => {
        const x = clamp(t, 0, 1) * NR, i = Math.min(NR - 1, Math.floor(x)), f = x - i;
        O.copy(C[i]).lerp(C[i + 1], f); Z.copy(T[i]).lerp(T[i + 1], f).normalize().multiplyScalar(sgn);
        Y.copy(N[i]).multiplyScalar(Math.cos(ang)).addScaledVector(Bn[i], Math.sin(ang));
        X.crossVectors(Y, Z).normalize();
        O.addScaledVector(Y, Rr[i] + (Rr[i + 1] - Rr[i]) * f + lift);
        return out.makeBasis(X, Y, Z).scale(sc3.set(scale, scale, scale)).setPosition(O);
      };
      splice = (time) => {
        for (let i = 0; i < nFish; i++) { const [p0, a, v, sc] = fph[i], t = 0.06 + 0.88 * ((p0 + time * v) % 1); at(t, a + t * 5, 0.1, 1, sc, m4); fishes.setMatrixAt(i, m4); }
        fishes.instanceMatrix.needsUpdate = true;
        at(0.47 + 0.2 * Math.sin(time * 0.1 + skiffPh), skiffAng, 0.02, 1, 1.35, skiff.matrix); skiff.matrixAutoUpdate = false; skiff.matrixWorldNeedsUpdate = true;
      };
    }
    await ctx.yield();

    // ---- per-frame ----
    const bScale = new V3(3.4, 3.4, 3.4), bm = new THREE.Matrix4(), bx = new V3(), by = new V3(), bz = new V3(), bp = new V3();
    const update = (dt, time, camera, u) => {
      hero.setProgress(u || 0);
      hero.update(dt, time, camera);
      updateHerons(u || 0);
      for (let i = 0; i < 9; i++) {
        const e = eyeletPh[i], a = time * 0.5 + eyeletPh0 + (i * TAU) / 9 + 0.35 * Math.sin(time * 0.21 + e[0]), r = 13.6 + 0.9 * Math.sin(time * 0.6 + e[1]);
        by.copy(hoopE1).multiplyScalar(Math.cos(a)).addScaledVector(hoopE2, Math.sin(a));           // outward from the hoop's middle
        bz.copy(hoopE1).multiplyScalar(-Math.sin(a)).addScaledVector(hoopE2, Math.cos(a));          // its way round the hoop
        // a tern is turned by its own flight: body along its way, wings across it, its back leaned from world up toward
        // the middle of its turn (6.8 m/s round 13.6 m: a third of its weight)
        bx.set(0, 1, 0).addScaledVector(by, -0.35); bx.addScaledVector(bz, -bx.dot(bz));
        if (bx.lengthSq() < 0.01) bx.copy(by).negate();
        bx.normalize(); bp.crossVectors(bx, bz);                                                     // back, then wings
        bm.makeBasis(bp, bx, bz).scale(bScale);
        bp.copy(portalPos).addScaledVector(by, r).addScaledVector(pathDir, -1.5 + 1.6 * Math.sin(time * 0.43 + e[2]));
        bm.setPosition(bp); hoopBirds.setMatrixAt(i, bm);
      }
      hoopBirds.instanceMatrix.needsUpdate = true;
      if (splice) splice(time);
      hero.eyelet.uniforms.uOffD.value.x = -((time * 0.042) % 1);          // the Eyelet's current lines stream round it at 3 m/s
    };

    // The gaze is one pull over the whole flight, weight 0.9 (never more, and no second pull beside it): its target is worked
    // out from u inside its own function, the look carried through the keys above, one subject at a time.
    const poiHold = new V3(), _gz = new V3();
    const gazeNow = (u, out) => { gazeDirAt(u, _gz); return out.copy(path.posAtDist(clamp(u, 0, 1) * path.length, _g0)).addScaledVector(_gz, 1000); };
    const bell01 = (x, a, b) => { const w = (b - a) * 0.35; return sstep(a, a + w, x) * (1 - sstep(b - w, b, x)); };
    const post = {
      exposure: H.exposure * (mist ? 0.96 : 1),
      bloom: { strength: H.bloom[0] * (mist ? 0.8 : 1), radius: H.bloom[1], threshold: H.bloom[2] },
      grade: { saturation: H.sat * (mist ? 0.9 : rain ? 0.88 : 1), contrast: 1.05, tint: H.tint, shadowTint: H.shadowTint, vignette: 0.3, grain: 0.02, aberration: 0 },
    };
    return {
      scene, path, duration: DURATION,
      // three slow passages, each at a subject: the knot seen whole, the bar's belly with its hanging fleet, the rings; the rest is flown through.
      // Their bounds are the gaze's own places on the route: from where it leaves the water, over the lift's top, to where the dive is steepest;
      // from the dive's bottom, where it goes in under the bar, to where it passes closest beneath it; and easing from the bridge to the first hoop, held to the portal
      pace: (u) => 1.1 - 0.36 * bell01(u, share(dOff), share(dSteep)) - 0.3 * bell01(u, share(dLow), share(dUnder)) - 0.16 * sstep(share(dBridge), share(dRings), u),
      camera: { fov: 62, near: 0.5, far: 9000, sway: 0.2, bank: 0 },
      pois: [
        { at: (time, u) => gazeNow(u, poiHold), from: -1, to: 2, weight: 0.9 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#FBEEDC', glow: 1, revealDistance: 500, tilt: true },
      post, ride: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
