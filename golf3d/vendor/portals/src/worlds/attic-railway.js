// THE ATTIC LINE. A footplate ride round a tinplate model railway on a table in a vast attic:
// hill tunnel (a mouse in the headlamp) -> the night town at window height, an oncoming local
// train, the level crossing and the station -> the girder bridge over the mirror lake (Ferris wheel
// doubled in the glass, a pale disc beside it) -> out past the table's edge on a tall matchstick
// trestle, where the attic is revealed (moon shaft, oculus, rafters, light-animals, rocking horse,
// the cat) -> up the papier-mache mountain (src/parts/attic-railway.js) and into the summit arch.
//
// World space = "table space": 1 unit = 1 toy centimetre, origin at the centre of the table top,
// +X east (toward the oculus gable), +Z south, floorboards at y = -80. The hero mountain stands at
// (330, 0, 100) turned 90 degrees, and everything that shares its materials is baked into HERO-LOCAL
// space and parented to hero.object, because the hero's light block works in that space.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import { buildHero, Batch, makeTrack } from '../parts/attic-railway.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';

const TAU = Math.PI * 2;
const PAL = ['#0B0E1A', '#3A2A1E', '#2A3C66', '#DCE6F7', '#FFC857', '#B5202A', '#4F6B3A'];
const C = (h) => new THREE.Color(h);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const FLOOR_Y = -80, SPEED = 37, EYE_UP = 13.8, EYE_LEFT = 4.3, LOCO_D = 3, EYE_BORE = 11.4;   // the driver's eye: leaning out past the cab's left edge and a little above its roof, the engine's centre 3 ahead, so only the smokebox, funnel and red flank show low in the frame
const TB = { x0: -450, x1: 450, z0: -250, z1: 250 };                       // table top
const AT = { x0: -700, x1: 700, zc: 40, half: 400, knee: 70, ridge: 320 };  // attic shell (table-space heights)
const roofY = (z) => AT.knee + (AT.half - Math.abs(z - AT.zc)) * (AT.ridge - AT.knee) / AT.half;
const OCULUS = V3(698, 175, 40), OC_R = 45;
const HERO_POS = V3(330, 0, 100);
const LAKE = { x: -21, z: 72, a: 74, b: 72, rot: Math.atan2(-62, 150) };   // ellipse, long axis along the bridge
const lakeR = (x, z) => { const dx = x - LAKE.x, dz = z - LAKE.z, c = Math.cos(LAKE.rot), s = Math.sin(LAKE.rot); return Math.hypot((dx * c + dz * s) / LAKE.a, (-dx * s + dz * c) / LAKE.b); };
const WHEEL = V3(-30, 0, -13), LAMP = V3(318, 24, 348), CAT = V3(246, 15, 350), MILL = V3(408, 9, -86), MILL_ST = 352;

// looks chosen per visit: sky in the oculus, shaft colour, ambient, fog, bulb gain, grade
const LOOKS = {
  midnight: { fill: 1.3, moon: '#DCE6F7', moonI: 1.3, amb: '#36466e', ambK: 4.3, fog: '#0B0E1A', glow: 1.0, exposure: 1.12, sky: ['#060a1c', '#182a58'], disc: '#eef3ff', discI: 5.0, shaft: 1.5, dust: ['#dce6f7', '#9fb4e6', '#ffffff'], tint: '#f3f6ff', shadow: '#050816', warm: '#FFC857' },
  afternoon: { fill: 1.3, moon: '#FFD9A0', moonI: 1.7, amb: '#6b6a80', ambK: 2.6, fog: '#1b1814', glow: 0.5, exposure: 0.95, sky: ['#f0b060', '#ffe6b0'], disc: '#fff2c8', discI: 0.0, shaft: 1.6, dust: ['#ffd9a0', '#ffc070', '#fff0d0'], tint: '#fff2e0', shadow: '#1a1420', warm: '#FFC857' },
  predawn: { fill: 1.6, moon: '#A9C2F4', moonI: 1.15, amb: '#3a5a92', ambK: 3.3, fog: '#0d1526', glow: 0.9, exposure: 1.15, sky: ['#2b4a8c', '#e9a6a0'], disc: '#e8eeff', discI: 2.2, shaft: 0.8, dust: ['#bcd0ff', '#8fa8e6', '#f0d0d8'], tint: '#eef2ff', shadow: '#06102a', warm: '#FFC857' },
  storm: { fill: 1.3, moon: '#AEBBD6', moonI: 1.0, amb: '#27365a', ambK: 3.8, fog: '#090c15', glow: 1.15, exposure: 1.2, sky: ['#0a0e18', '#27324a'], disc: '#c8d4ee', discI: 0.0, shaft: 0.7, dust: ['#aebbd6', '#8090b8', '#dfe8ff'], tint: '#eaf0ff', shadow: '#04060e', warm: '#FFC857' },
};

const LOOKX = {
  midnight: { gabA: '#31477e', gabB: '#5f77b8', gabI: 0.5, lamp: 1.0, mtn: 1.5 },
  afternoon: { gabA: '#ffb060', gabB: '#ffe2a8', gabI: 1.3, lamp: 0.5, mtn: 1.0 },
  predawn: { gabA: '#ff8f9a', gabB: '#4f78d8', gabI: 1.25, lamp: 0.8, mtn: 1.1 },
  storm: { gabA: '#2a3550', gabB: '#56688f', gabI: 0.4, lamp: 1.1, mtn: 1.05 },
};

// ---------------------------------------------------------------- shaders of the dim "real" attic
const ATTIC_VERT = /* glsl */`
attribute vec3 aFx;                 // emissive, cloth amount, grain amount
uniform float uTime;
varying vec3 vCol, vN, vL, vFx;
#include <fog_pars_vertex>
void main() {
  vec4 lp = vec4(position, 1.0); vec3 n = normal;
  #ifdef USE_INSTANCING
    lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
  #endif
  vCol = color; vN = n; vL = lp.xyz; vFx = aFx;
  // dust sheets breathe in the draught: a slow billow that grows away from the floor (shading keeps the rest position)
  lp.xyz += n * aFx.y * 1.6 * sin(uTime * 0.8 + lp.y * 0.07 + lp.x * 0.045 + lp.z * 0.03) * smoothstep(-78.0, -30.0, lp.y);
  vec4 mvPosition = modelViewMatrix * lp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const atticFrag = (LIGHT) => /* glsl */`
varying vec3 vCol, vN, vL, vFx;
uniform sampler2D uCookie;
uniform vec3 uLampP, uOcL, uGabA, uGabB; uniform float uCookieI, uCookieRot, uLampI, uFill, uGabI, uWash, uPre, uDust;
uniform vec3 uFairyP, uFairyQ, uFairyR, uFairyS, uFairyD; uniform float uFairyI; uniform vec4 uLant[6];
#include <fog_pars_fragment>
${LIGHT}
void main() {
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  float cloth = vFx.y;
  // boards: per-board tone and a dark joint; the cloth gets soft mottling and fold shadows instead
  float bc = abs(N.y) > 0.9 ? vL.x / 13.0 : vL.y / 10.0;
  float bid = floor(bc), bf = fract(bc);
  float joint = smoothstep(0.0, 0.035, bf) * smoothstep(1.0, 0.965, bf);
  float grain = vnoise(vL * vec3(0.9, 0.9, 0.035) + bid * 7.3) * 0.6 + 0.4 * vnoise(vL * 0.11);
  vec3 wood = vCol * (0.62 + 0.3 * hash13(vec3(bid, 3.0, 7.0)) + 0.34 * grain) * mix(1.0, 0.45 + 0.55 * joint, vFx.z);
  wood *= 1.0 - 0.2 * vFx.z * smoothstep(0.45, 0.9, vnoise(vL * vec3(0.05, 0.007, 0.05) + 3.0));                            // old water stains
  // dust sheets: long hanging folds with dark creases between them, and a shadowed, scalloped hem at the floor
  float fold = smoothstep(0.12, 0.88, vnoise(vL * vec3(0.21, 0.02, 0.21)) * 0.7 + 0.3 * vnoise(vL * vec3(0.55, 0.05, 0.55) + 9.0));
  float crease = (0.7 + 0.3 * smoothstep(0.0, 0.3, fold)) * (0.88 + 0.24 * vnoise(vL * vec3(0.8, 0.1, 0.8) + 5.0));      // and the finer wrinkles of old linen
  float hem = smoothstep(-64.0, -75.0, vL.y + 6.0 * vnoise(vec3(vL.x * 0.13, 0.0, vL.z * 0.13)));
  vec3 sheet = vCol * (0.84 + 0.12 * fold) * mix(1.0, crease, 0.3) * (0.9 + 0.14 * vnoise(vL * 1.7)) * (1.0 - 0.55 * hem);    // the folds themselves are in the cloth's shape; this is only its weave and wear
  wood = mix(wood, vec3(0.0400, 0.0262, 0.0172) * (dot(wood, vec3(0.3, 0.5, 0.2)) / 0.026), 0.65);      // old dry timber: nearly monochrome umber
  vec3 alb = mix(wood, sheet, cloth);
  alb = mix(alb, vec3(dot(alb, vec3(0.3, 0.5, 0.2))) * vec3(1.08, 1.0, 0.88), uDust * (1.0 - cloth));           // dust greys the timber, most of all in warm daylight
  vec3 Vv = normalize(uCamL - vL);
  vec3 c = atticLight(alb, N, vL, 0.0, 0.0) * uPre + vCol * (vFx.x < 0.0 ? -vFx.x * uFairyI : vFx.x) * uGlow + alb * (mix(uAmb, vec3(dot(uAmb, vec3(0.3, 0.5, 0.2))), 0.45) * 0.4 + uMoonCol * uMoonI * 0.03) * uFill;
  // moon-coloured rim: rafter undersides and edges, the tops and folds of the dust sheets
  float rimA = pow(1.0 - clamp(dot(N, Vv), 0.0, 1.0), 3.0);
  c += alb * uMoonCol * uFill * (0.42 * rimA + cloth * 0.3 * clamp(N.y, 0.0, 1.0) + (0.16 + 0.3 * cloth) * clamp(dot(N, uMoonDir), 0.0, 1.0));
  c *= mix(1.0, 0.5 + 0.85 * clamp(dot(N, normalize(uMoonDir + vec3(0.0, 0.5, 0.0))) * 0.5 + 0.5, 0.0, 1.0), cloth);       // each fold has a side toward the window and a side away from it
  // what the round window throws on its own gable and the nearest rafters: the sky's own gradient
  { vec3 od = vL - uOcL; float o2 = dot(od, od);
    c += alb * mix(uGabA, uGabB, smoothstep(-70.0, 80.0, od.y)) * uGabI * (1.0 + 2.5 * uFlash) * (0.25 + 0.75 * clamp(dot(N, -od * inversesqrt(o2 + 1.0)) + 0.55, 0.0, 1.0)) * 9000.0 / (9000.0 + o2); }
  // the carousel night-lamp: a turning cylindrical cookie of four animals, gold on umber
  vec3 d = vL - uLampP; float hd = length(d.xz) + 1.0, dist = length(d);
  // two parades: twelve animals in a band just above the lamp's horizon, eight more the other way round up on the roof
  float cang = atan(d.z, abs(d.x) < 1e-4 ? 1e-4 : d.x) / 6.2831853, el = d.y / hd;
  vec2 cuv = vec2(cang * 3.0 + uCookieRot, el * 1.9 + 0.25);
  float a = texture2D(uCookie, cuv).r * step(0.0, cuv.y) * step(cuv.y, 1.0);
  vec2 cuv2 = vec2(-cang * 2.0 + uCookieRot * 1.4 + 0.37, (el - 0.62) * 1.05);
  a += texture2D(uCookie, cuv2).r * step(0.0, cuv2.y) * step(cuv2.y, 1.0);
  float face = clamp(dot(N, -d / dist) * 0.75 + 0.35, 0.0, 1.0);
  a *= mix(0.25, 1.0, max(clamp(vFx.z, 0.0, 1.0), cloth));                       // whole animals on the boards and the sheets, only a ghost of them on the rafters in front
  vec3 albG = mix(alb, vec3(dot(alb, vec3(0.3, 0.5, 0.2))) * vec3(1.15, 1.0, 0.8), 0.6);          // gold stays gold on umber, not red
  float aS = 0.25 * (texture2D(uCookie, cuv + vec2(0.006, 0.02)).r + texture2D(uCookie, cuv - vec2(0.006, 0.02)).r + texture2D(uCookie, cuv + vec2(-0.006, 0.02)).r + texture2D(uCookie, cuv + vec2(0.006, -0.02)).r) * step(0.0, cuv.y) * step(cuv.y, 1.0);
  aS += 0.25 * (texture2D(uCookie, cuv2 + vec2(0.005, 0.016)).r + texture2D(uCookie, cuv2 - vec2(0.005, 0.016)).r + texture2D(uCookie, cuv2 + vec2(-0.005, 0.016)).r + texture2D(uCookie, cuv2 + vec2(0.005, -0.016)).r) * step(0.0, cuv2.y) * step(cuv2.y, 1.0);
  float aK = mix(0.25, 1.0, max(clamp(vFx.z, 0.0, 1.0), cloth));
  c += albG * mix(uWarm, vec3(1.0, 0.82, 0.5), 0.5) * face * uLampI * 0.9 / (1.0 + dist * dist * 0.0012);
  // the light-animals are LIGHT, not boards: lantern gold with a soft bleeding edge, a grain of the shade's paper in them, and a slow breathing of the flame
  vec3 cook = (albG * 2.2 + vec3(0.02, 0.012, 0.004)) * mix(vec3(1.0, 0.63, 0.24), vec3(0.8, 0.42, 0.11), cloth) * face * uCookieI * (a * 2.7 + aS * aK * 1.2) * (0.86 + 0.14 * vnoise(vL * 0.35 + uTime * 0.6)) / (1.0 + dist * dist * 0.000012);
  // the summit arch throws its gold up onto the rafters and boards above it: the way out, seen from anywhere in the attic
  { vec3 pl = uPortalP - vL; float p2 = dot(pl, pl), pf = p2 / 12000.0;
    c += albG * uPortalCol * uWash * (0.6 + 0.4 * uPortalI) * clamp(dot(N, pl * inversesqrt(p2 + 1.0)) * 0.6 + 0.4, 0.0, 1.0) * (1.0 / (1.0 + pf * pf) + 0.55 / (1.0 + p2 / 40000.0)); }
  c = mix(c, vec3(dot(c, vec3(0.3, 0.5, 0.2))) * vec3(1.03, 1.0, 0.95), 0.4 * cloth);          // dusty linen takes little colour from the light
  c += cook;
  // strings of fairy lights along the two long purlins: their colours wash the boards and rafters beside them
  { vec3 fa = vL - uFairyP; float xs = dot(fa, uFairyD); fa -= uFairyD * xs; float f2 = dot(fa, fa);
    vec3 fb = vL - uFairyQ; fb -= uFairyD * dot(fb, uFairyD); float g2 = dot(fb, fb);
    vec3 fr = vL - uFairyR; fr -= uFairyD * dot(fr, uFairyD); float r2 = dot(fr, fr);
    vec3 fs = vL - uFairyS; fs -= uFairyD * dot(fs, uFairyD); float s2 = dot(fs, fs);
    vec3 fc = mix(vec3(1.0, 0.7, 0.34), 0.5 + 0.5 * cos(6.2831853 * (xs / 150.0 + vec3(0.0, 0.33, 0.67))), 0.5);
    c += (alb + 0.002) * fc * uFairyI * ((0.3 + 0.7 * clamp(dot(N, -fa * inversesqrt(f2 + 1.0)) * 0.6 + 0.4, 0.0, 1.0)) * 800.0 / (800.0 + f2) + (0.3 + 0.7 * clamp(dot(N, -fb * inversesqrt(g2 + 1.0)) * 0.6 + 0.4, 0.0, 1.0)) * 800.0 / (800.0 + g2)
      + (0.3 + 0.7 * clamp(dot(N, -fr * inversesqrt(r2 + 1.0)) * 0.6 + 0.4, 0.0, 1.0)) * 600.0 / (600.0 + r2) + (0.3 + 0.7 * clamp(dot(N, -fs * inversesqrt(s2 + 1.0)) * 0.6 + 0.4, 0.0, 1.0)) * 600.0 / (600.0 + s2)); }
  // paper lanterns standing about the floor: warm pools on the boards and the hems of the sheets
  for (int i = 0; i < 6; i++) { vec3 ll = uLant[i].xyz - vL; float l2 = dot(ll, ll);
    c += (albG * 3.0 + 0.004) * vec3(1.0, 0.64, 0.28) * uFairyI * uLant[i].w * clamp(dot(N, ll * inversesqrt(l2 + 1.0)) * 0.7 + 0.3, 0.0, 1.0) / (1.0 + l2 * 0.0007); }
  gl_FragColor = vec4(c, 1.0);
  #include <fog_fragment>
}`;
// the cat (or owl): a dark body with a moonlit rim, breathing and flicking its tail in the vertex shader
const CAT_VERT = /* glsl */`
attribute vec3 aFx;                 // breathe weight, tail weight, tail phase
uniform vec3 uCatC; uniform float uTime;
varying vec3 vN, vL;
#include <fog_pars_vertex>
void main() {
  vec4 lp = vec4(position, 1.0); vec3 n = normal;
  float br = sin(uTime * 1.5708);
  lp.xyz += (lp.xyz - uCatC) * vec3(0.045, 0.085, 0.06) * br * aFx.x;
  float fl = pow(max(0.0, sin(uTime * 0.9 + 1.0)), 6.0) + 0.35 * sin(uTime * 2.3);
  lp.x += aFx.y * 2.6 * fl * sin(aFx.z * 2.0 - uTime * 5.0) ; lp.z += aFx.y * 1.2 * sin(uTime * 1.3 + aFx.z);
  #ifdef USE_INSTANCING
    lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
  #endif
  vN = n; vL = lp.xyz;
  vec4 mvPosition = modelViewMatrix * lp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const catFrag = (LIGHT) => /* glsl */`
varying vec3 vN, vL;
#include <fog_pars_fragment>
${LIGHT}
void main() {
  vec3 N = normalize(vN), V = normalize(uCamL - vL);
  float fur = 0.75 + 0.5 * vnoise(vL * vec3(0.5, 1.6, 0.5));
  float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.5) * clamp(dot(N, uMoonDir) * 0.6 + 0.62, 0.0, 1.0);
  vec3 c = vec3(0.012, 0.011, 0.012) * fur + uAmb * 0.012 + uMoonCol * (0.2 + 0.2 * uMoonI) * rim * fur + uWarm * 0.03 * clamp(dot(N, vec3(0.7, 0.2, 0.0)) , 0.0, 1.0);
  c += vec3(0.72, 0.82, 1.0) * uFlash * 0.05 * (0.4 + 0.6 * clamp(N.y, 0.0, 1.0));
  gl_FragColor = vec4(c, 1.0);
  #include <fog_fragment>
}`;
const FLAT_VERT = /* glsl */`
varying vec3 vL; varying vec2 vUv;
#include <fog_pars_vertex>
void main() { vL = position; vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// dark mirror glass: the oculus is reflected analytically (the "pale disc that nothing yet explains")
const lakeFrag = (LIGHT) => /* glsl */`
varying vec3 vL; varying vec2 vUv;
uniform vec3 uOcP, uOcN, uOcA, uOcCol, uFogC;
#include <fog_pars_fragment>
${LIGHT}
void main() {
  vec3 V = normalize(vL - uCamL);
  vec3 R = reflect(V, normalize(vec3(0.004 * sin(vL.x * 0.9 + uTime * 0.7), 1.0, 0.004 * sin(vL.z * 1.1 - uTime * 0.6))));
  float t = dot(uOcP - vL, uOcN) / max(dot(R, uOcN), 1e-4);
  vec3 q = vL + R * t - uOcP; float rr = length(q);
  float disc = (1.0 - smoothstep(24.5, 26.5, rr)) * step(0.0, t);
  float bars = smoothstep(1.4, 2.4, abs(q.y)) * smoothstep(1.4, 2.4, abs(dot(q, uOcA)));
  float fres = pow(1.0 - clamp(-V.y, 0.0, 1.0), 3.0);
  // glass, not a hole: a sheen of the attic's own air that grows toward grazing, slow ripples in it, and the mirror world showing through
  float rip = 0.75 + 0.5 * vnoise(vec3(vL.x * 0.09 + uTime * 0.12, uTime * 0.07, vL.z * 0.09 - uTime * 0.1));
  float gl = smoothstep(0.6, 0.92, vnoise(vec3(vL.x * 0.45 + uTime * 0.3, uTime * 0.22, vL.z * 0.45 - uTime * 0.17)));          // small moving glints: water, not a hole
  vec3 c = uFogC * (0.4 + 0.8 * fres) + (uAmb * 0.2 + uMoonCol * 0.11) * (0.3 + 0.7 * fres) * rip * rip + (uMoonCol * 0.22 + uWarm * 0.1) * gl * fres + min(uOcCol, vec3(1.15)) * disc * (0.12 + 0.88 * bars) * (0.5 + 0.5 * fres) * (1.0 + 2.0 * uFlash);
  float edge = smoothstep(1.0, 0.93, length(vUv * 2.0 - 1.0));
  gl_FragColor = vec4(c, clamp(0.46 - 0.2 * fres + 0.5 * disc, 0.0, 1.0) * edge);
  #include <fog_fragment>
}`;
// the round window: sky, moon, clouds, rain and lightning behind its glazing bars
const OCULUS_FRAG = /* glsl */`
varying vec3 vL; varying vec2 vUv;
uniform vec3 uSkyA, uSkyB, uDisc; uniform float uDiscI, uRain, uCloud, uTime, uFlash, uGain;
float h21(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec2 p = vUv * 2.0 - 1.0; float r = length(p); if (r > 1.0) discard;
  vec3 c = mix(uSkyB, uSkyA, smoothstep(-0.9, 0.8, p.y));
  vec2 mp = p - vec2(0.18, 0.2); float mr = length(mp);
  float moon = 1.0 - smoothstep(0.40, 0.43, mr);
  float maria = 0.78 + 0.22 * vn(mp * 7.0 + 3.0) - 0.16 * smoothstep(0.5, 0.75, vn(mp * 3.2 + 11.0));
  c += uDisc * uDiscI * (moon * maria + 0.16 * exp(-mr * mr * 5.0));
  float cl = vn(p * 2.2 + vec2(uTime * 0.11, 0.0)) * 0.6 + 0.4 * vn(p * 5.0 + vec2(uTime * 0.19, 3.0));
  c = mix(c, c * 0.35 + uSkyB * 0.4, uCloud * smoothstep(0.35, 0.75, cl));
  float streak = smoothstep(0.72, 0.95, vn(vec2(p.x * 34.0 + 0.6 * sin(p.y * 3.0), p.y * 2.6 + uTime * 2.4))) * (0.5 + 0.5 * vn(vec2(p.x * 9.0, p.y * 1.3 + uTime * 0.9)));
  c += uRain * streak * (uSkyB * 1.6 + 0.05) + uFlash * vec3(2.6, 2.9, 3.6) * (0.5 + 0.5 * cl);
  c *= 1.0 - 0.35 * smoothstep(0.82, 1.0, r);
  gl_FragColor = vec4(c * uGain, 1.0);
}`;
const shaftFrag = (LIGHT, FOGFADE) => /* glsl */`
varying vec3 vL; varying vec2 vUv;
uniform float uVis, uWet;
#include <fog_pars_fragment>
${LIGHT}
void main() {
  vec3 ax = vL - uShaftP; float along = dot(ax, uMoonDir); vec3 rad = ax - uMoonDir * along;
  vec3 N = normalize(rad), V = normalize(uCamL - vL);
  float f = abs(dot(N, V));
  float streak = vnoise(vec3(rad.y * 0.07, dot(rad, cross(uMoonDir, vec3(0.0, 1.0, 0.0))) * 0.07, along * 0.006 + uTime * 0.03)) * 0.7 + 0.3 * vnoise(vL * 0.2 + uTime * 0.05);
  float fade = smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
  // wet glass: the shadows of running drops crawl down the beam
  float wet = vnoise(vec3(dot(rad, cross(uMoonDir, vec3(0.0, 1.0, 0.0))) * 0.42, rad.y * 0.05 + uTime * 0.55, along * 0.004));
  streak *= mix(1.0, 0.25 + 1.5 * smoothstep(0.35, 0.7, wet), uWet);
  ${FOGFADE}
  gl_FragColor = vec4(uMoonCol * (uMoonI + 2.0 * uFlash) * 0.085 * uVis * pow(f, 1.5) * (0.5 + 0.95 * streak) * fade * (1.0 - 0.35 * fogF), 1.0);
}`;

// four animals of light for the night-lamp's shade (white = light), wrapped once round the lamp
function cookieTexture() {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256;
  const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 256); g.fillStyle = '#fff';
  const el = (x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); };
  const leg = (x, y, w, h, lean = 0) => { g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x + w / 2, y); g.lineTo(x + w / 2 + lean, y + h); g.lineTo(x - w / 2 + lean, y + h); g.fill(); };
  const base = 196;
  { const x = 128;                                                                       // horse
    el(x, base - 78, 52, 24); leg(x - 36, base - 70, 11, 70, -8); leg(x - 22, base - 70, 11, 70, 6); leg(x + 26, base - 70, 11, 70, -6); leg(x + 40, base - 70, 11, 70, 10);
    el(x + 50, base - 106, 14, 34, 0.55); el(x + 74, base - 128, 22, 11, 0.35); leg(x + 58, base - 150, 6, 14); el(x - 56, base - 62, 7, 30, 0.25); }
  { const x = 384;                                                                       // elephant
    el(x, base - 84, 66, 44); leg(x - 44, base - 60, 20, 60); leg(x - 14, base - 60, 20, 60); leg(x + 22, base - 60, 20, 60); leg(x + 48, base - 60, 20, 60);
    el(x + 62, base - 104, 30, 28); el(x + 40, base - 108, 18, 30, -0.2); el(x + 92, base - 66, 8, 44, -0.12); el(x + 98, base - 26, 12, 6); el(x - 66, base - 80, 4, 26, 0.2); }
  { const x = 640;                                                                       // giraffe
    el(x, base - 96, 44, 22, -0.12); leg(x - 30, base - 90, 9, 90, -4); leg(x - 18, base - 90, 9, 90, 3); leg(x + 20, base - 96, 9, 96, -3); leg(x + 32, base - 96, 9, 96, 5);
    el(x + 46, base - 142, 10, 52, 0.42); el(x + 72, base - 188, 18, 8, 0.25); leg(x + 62, base - 204, 4, 12); leg(x + 70, base - 204, 4, 12); el(x - 46, base - 84, 4, 24, 0.3); }
  { const x = 896;                                                                       // hare
    el(x, base - 34, 40, 28, -0.15); el(x - 26, base - 22, 22, 22); el(x + 34, base - 62, 18, 15); el(x + 30, base - 100, 6, 30, -0.12); el(x + 42, base - 98, 6, 30, 0.2);
    leg(x + 22, base - 20, 9, 20, 6); el(x - 10, base - 4, 30, 6); el(x - 48, base - 34, 9, 9); }
  for (let i = 0; i < 26; i++) el(20 + i * 40 + (i % 2) * 9, 232 + (i % 3) * 3, 3.2, 3.2);    // a dotted border of pin-holes
  for (let i = 0; i < 13; i++) el(40 + i * 80, 18, 2.6, 2.6);
  const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter;
  return t;
}

export default {
  id: 'attic-railway',
  name: 'The Attic Line',
  category: 'interior',
  media: ['rail', 'tiny', 'interior'],
  weirdness: 0.15,
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const density = clamp(vary.density ?? 1, 0.7, 1.3), detail = ctx.quality?.detail ?? 1;   // detail thins what is plentiful (grass, scenery trees, dust) on phones
    // ------------------------------------------------------------ what kind of night is it
    const vr = rng.fork('look');
    let lookId = vr.pick(['midnight', 'midnight', 'predawn', 'storm']);   // the seed chooses among the nights (the lead's note: a cold moon shaft over warm lamps); the dusty-gold afternoon comes when the viewer asks for day
    if (vary.hour === 'night') lookId = vr.chance(0.5) ? 'midnight' : 'storm';
    else if (vary.hour === 'day' || vary.hour === 'golden') lookId = 'afternoon';
    else if (vary.hour === 'dawn') lookId = 'predawn';
    const look = LOOKS[lookId], lx = LOOKX[lookId];
    const rare = !!vary.rare;
    vr.chance(0.5); const winter = false;   // (the draw is kept so every later draw stays where it was) the winter dressing is gone: the snow belongs to shaken-globe, this town is always green flock
    const airship = rare ? 'zeppelin' : vr.pick(['zeppelin', 'biplane']);
    const sitter = rare ? 'cat' : vr.pick(['cat', 'owl']);
    const livery = vr.pick(['#B5202A', '#2c7a3e', '#2440b0']);          // the local that meets us wears the express livery of the night

    // a second generator for this round's additions, so that every draw of the released world stays where it was
    let _sd = 0; { const t = String(ctx.seed ?? 1) + ':attic-more'; for (let i = 0; i < t.length; i++) _sd = (Math.imul(_sd, 31) + t.charCodeAt(i)) >>> 0; }
    const r2 = (a = 0, b = 1) => { _sd = (Math.imul(_sd, 1664525) + 1013904223) >>> 0; return a + (b - a) * (_sd / 4294967296); };
    const XR = { range: r2, pick: (a) => a[Math.floor(r2() * a.length)], chance: (p) => r2() < p, int: (a, b) => a + Math.floor(r2() * (b - a + 1)) };
    const scene = new THREE.Scene();
    scene.background = C(look.fog);
    scene.fog = new THREE.FogExp2(look.fog, 0.00128);

    // ------------------------------------------------------------ frames
    const H2T = new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(HERO_POS), T2H = H2T.clone().invert();
    const toH = (v) => v.applyMatrix4(T2H);

    // ------------------------------------------------------------ our line, from the hill tunnel to the hero's lead-in trestle
    // the hero's lead-in trestle starts here (same construction as the part: tangent to its helix start)
    const hp0 = (a) => { const t = (a - 3.92699082) / 6.54498469, r = lerp(85, 50, t); return V3(r * Math.cos(a), lerp(30, 125, t), -r * Math.sin(a)); };
    const leadT = hp0(3.92699082 + 0.01).sub(hp0(3.92699082)).setY(0).normalize(), lead0 = hp0(3.92699082).addScaledVector(leadT, -64).applyMatrix4(H2T);
    leadT.transformDirection(H2T);
    const ctrl = [[-447, 6, 140], [-400, 6, 140], [-350, 6, 140], [-285, 6, 140], [-200, 6, 140], [-142, 6.4, 139], [-116, 8.5, 131], [-90, 12, 118], [-15, 12, 87], [60, 12, 56],
      [95, 13, 46], [128, 15, 54], [150, 18, 82], [160, 21, 125], [158, 25, 180], [160, 28, 228], [176, 30, 266], [205, 30, 286], [232, 30, 290], [262, 30, 282], [290, 30, 261], [317, 30, 233]]
      .map((p) => V3(p[0], p[1], p[2]));
    ctrl.push(lead0.clone(), lead0.clone().addScaledVector(leadT, 32));
    const preCurve = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
    const rawPre = []; { const n = ctrl.length - 1, m = 1100; for (let i = 0; i <= m; i++) rawPre.push(preCurve.getPoint((i / m) * (n - 1) / n)); }
    const pre = makeTrack(rawPre, false), preLen = pre.length;
    const sOfX = (x) => { let i = 0; while (i < pre.n - 1 && pre.pts[i].x < x) i++; return i; };   // valid while the line runs east
    const S_MOUTH = sOfX(-350), S_CROSS = sOfX(-285), S_STATION = sOfX(-200), S_BR0 = sOfX(-90), S_BR1 = sOfX(60);
    let S_EDGE = -1, S_APEX = S_BR1, S_BACK = S_BR1;                 // leaves the table, southmost point, back over the table
    for (let i = S_BR1; i < pre.n; i++) { const p = pre.pts[i]; if (p.z > TB.z1) { if (S_EDGE < 0) S_EDGE = i; S_BACK = i; } if (p.z > pre.pts[S_APEX].z) S_APEX = i; }

    // the down line: a closed oval through the town, with a local train that meets us head-on
    const LOOP_Y = 6, rawLoop = [];
    { const x0 = -335, x1 = -105, z0 = 40, z1 = 126, r = 34;
      const arc = (cx, cz, a0) => { for (let k = 1; k <= 24; k++) { const a = a0 + (k / 24) * Math.PI / 2; rawLoop.push(V3(cx + r * Math.cos(a), LOOP_Y, cz + r * Math.sin(a))); } };
      const line = (ax, az, bx, bz) => { const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 4); for (let k = 0; k <= n; k++) rawLoop.push(V3(lerp(ax, bx, k / n), LOOP_Y, lerp(az, bz, k / n))); };
      line(x1 - r, z1, x0 + r, z1); arc(x0 + r, z1 - r, Math.PI / 2); line(x0, z1 - r, x0, z0 + r); arc(x0 + r, z0 + r, Math.PI);
      line(x0 + r, z0, x1 - r, z0); arc(x1 - r, z0 + r, -Math.PI / 2); line(x1, z0 + r, x1, z1 - r); arc(x1 - r, z1 - r, 0); }
    const loop = makeTrack(rawLoop, true);
    let tw = 0;                                                       // the world's story clock: u * duration once we move
    const T_MEET = sOfX(-215) / SPEED;
    const localTrain = {
      track: { closed: true, length: loop.length, at: (s, out, tan) => { loop.at(s, out, tan); out.applyMatrix4(T2H); if (tan) tan.transformDirection(T2H); return out; } },
      dir: 1, kinds: ['loco', 'coach', 'coach', 'coach'], livery: C(livery), s: () => 98 + 27 * (tw - T_MEET),
    };
    await ctx.yield();

    // ------------------------------------------------------------ the hero mountain
    const hero = await buildHero(ctx, {
      palette: PAL, shaft: false, portalFill: false, express: true, expressKinds: ['loco'], dust: true, moonIntensity: look.moonI,
      moonTarget: OCULUS.clone().applyMatrix4(T2H), extraTrains: [localTrain], preLength: preLen, goods: { at: S_APEX - 20 - preLen, angle: 2.6 },   // the goods train rounds the south-west foot, facing the trestle, during the reveal
      preAt: (s, out) => pre.at(preLen + s, out).applyMatrix4(T2H),
    });
    hero.object.applyMatrix4(H2T); hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    const K = hero.kit, U = K.U, TL = hero.track.length, TOTAL = preLen + TL;
    hero.setMoon(null, look.moon, look.moonI);
    U.uAmb.value.set(look.amb).multiplyScalar(look.ambK); U.uGlow.value = look.glow; U.uWarm.value.set(look.warm);
    U.uPortalCol.value.set('#ffd9a0');
    const moonDirT = U.uMoonDir.value.clone().transformDirection(H2T), shaftPT = U.uShaftP.value.clone().applyMatrix4(H2T);
    await ctx.yield();

    // centre line of the whole ride in table space: s = units from the tunnel end
    const _t0 = V3(0, 0, 0), _t1 = V3(0, 0, 0), _t2 = V3(0, 0, 0), _t3 = V3(0, 0, 0), UP = V3(0, 1, 0);
    const cl = (s, out, tan) => {
      if (s < preLen) return pre.at(Math.max(0, s), out, tan);
      hero.track.at(Math.min(s - preLen, TL - 0.02), out, tan); out.applyMatrix4(H2T); if (tan) tan.transformDirection(H2T); return out;
    };

    // ------------------------------------------------------------ the camera path: the driver's eye, left of the centre line, the boiler below and to the right
    const seatT = hero.anchors.portalSeat.position.clone().applyMatrix4(H2T);
    const eyePts = [], cum = [0], STEP = 10, S0 = S_MOUTH - 39;       // the eye starts a little inside the bore, the mouth already half the frame high
    const openAt = (s) => smoothstep(S_MOUTH - 4, S_MOUTH + 46, s) * (1 - smoothstep(preLen + hero.tunnel.s0 - 30, preLen + hero.tunnel.s0 - 3, s) * (1 - smoothstep(preLen + hero.tunnel.s1 + 2, preLen + hero.tunnel.s1 + 34, s)));
    const onMtnAt = (s) => smoothstep(preLen + 20, preLen + 90, s);
    for (let s = S0; s < TOTAL - 4; s += STEP) {
      cl(s, _t0, _t1); _t2.crossVectors(_t1, UP).normalize();
      const k = 1 - smoothstep(TOTAL - 56, TOTAL - 18, s);            // by then our engine has run ahead into the arch
      const side = -1 + 2 * smoothstep(preLen - 64, preLen + 8, s);   // on the mountain the driver crosses the footplate to the open side of the helix: the rock wall is on the left there
      // in the open the driver leans out and stands tall (the engine stays low in the frame); inside the two bores he ducks back in under the arch.
      // On the helix the upper turn's bents stand close outside the rail, so he keeps nearer the cab there, and stands higher: the gaze goes down to the table from there
      const open = openAt(s), onMtn = onMtnAt(s);
      eyePts.push(_t0.clone().addScaledVector(_t2, lerp(2.8, lerp(EYE_LEFT, 3.0, onMtn), open) * side * k).setY(_t0.y + lerp(7, lerp(s > preLen ? 13.4 : EYE_BORE, lerp(EYE_UP, 16, onMtn), open), k)));
    }
    eyePts.push(seatT.clone());
    for (let i = 1; i < eyePts.length; i++) cum.push(cum[i - 1] + eyePts[i].distanceTo(eyePts[i - 1]));
    const path = makePath(eyePts, { samples: 720 });
    const duration = Math.round(path.length / SPEED * 10) / 10;
    const cumT = cum[cum.length - 1];
    const uOfS = (s) => { const f = clamp((s - S0) / STEP, 0, cum.length - 1.001), i = Math.floor(f); return lerp(cum[i], cum[i + 1], f - i) / cumT; };
    const sOfU = (u) => { const d = clamp(u, 0, 1) * cumT; let lo = 0, hi = cum.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= d) lo = m; else hi = m; } return Math.min(TOTAL, S0 + (lo + (d - cum[lo]) / Math.max(1e-6, cum[hi] - cum[lo])) * STEP); };

    // ------------------------------------------------------------ builders shared by everything tin
    const B = new Batch();          // static tin props of the layout
    const BW = new Batch();         // tin things that are doubled in the lake (bridge, shore lamps)
    const A = new Batch();          // the dim real attic: shell, furniture, table
    const G = K.G, M = new THREE.Matrix4(), M2 = new THREE.Matrix4(), _e = new THREE.Euler(), _q4 = new THREE.Quaternion(), _s3 = V3(1, 1, 1);
    const va = V3(0, 0, 0), vb = V3(0, 0, 0), vc = V3(0, 0, 0), vd = V3(0, 0, 0);
    const [cAir, cUmber, cShadow, cMoon, cGold, cRed, cFlock] = PAL.map(C);
    const goldHDR = cGold.clone().multiplyScalar(3.6), cBlack = C('#16161a'), cBrass = C('#c9973a'), cRail = C('#3b3a3a'), cGlint = C('#77736e'), cSleeper = cUmber.clone().multiplyScalar(1.3), cSleepers = [1.0, 0.82, 1.18, 0.92, 1.08].map((k) => cUmber.clone().lerp(C('#6a5a4a'), 0.25).multiplyScalar(1.3 * k));
    const cTimber = [C('#7a5532'), C('#684526'), C('#8a6540'), C('#5a3c22')], cStone = [C('#7d7466'), C('#8f8472'), C('#6c645a'), C('#9d917b')], cSoot = C('#1c1815');
    const cSnow = C('#cfd8ea'), cWhite = C('#e9e4d6');
    const bulbs = [], lakeBulbs = [];
    let bRng = rng;
    const addBulb = (x, y, z, col, size, kind = 0, phase = bRng.range(0, TAU), list = bulbs) => list.push({ x, y, z, c: col, size, kind, phase, speed: bRng.range(0.6, 1.4) });
    const rb = (bat, P, x, y, z, sx, sy, sz, rx, rz, col, e = 0, gloss = 0.5, tint = 0) => {
      M2.compose(va.set(x, y, z), _q4.setFromEuler(_e.set(rx, 0, rz)), vb.set(sx, sy, sz)); if (P) M2.premultiply(P); bat.add(G.box, M2, col, e, tint, gloss);
    };
    const atY = (x, y, z, yaw, sc = 1) => new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, yaw), V3(sc, sc, sc));
    const frameOf = (tr, s, m) => { tr.at(s, _t0, _t1); _t2.crossVectors(UP, _t1).normalize(); _t3.crossVectors(_t1, _t2).normalize(); return m.makeBasis(_t2, _t3, _t1).setPosition(_t0); };   // x = left, z = ahead

    async function layTrack(tr, s0, s1) {
      for (let s = s0; s < s1 - 1; s += 2) {
        if ((s & 63) === 62) await ctx.yield();
        if (((s - s0) / 2) % 2 === 0) for (const sd of [-1, 1]) {
          tr.at(s, _t0, _t1); _t2.crossVectors(UP, _t1).normalize(); vc.copy(_t0).addScaledVector(_t2, sd * 2).setY(_t0.y - 0.22);
          tr.at(Math.min(s + 4.1, s1), _t0, _t1); _t2.crossVectors(UP, _t1).normalize(); vd.copy(_t0).addScaledVector(_t2, sd * 2).setY(_t0.y - 0.22);
          B.beam(vc, vd, 0.3, cRail, null, 0.4); vc.y += 0.17; vd.y += 0.17; B.beam(vc, vd, 0.1, cGlint, null, 0.6);
        }
        frameOf(tr, s + 1, M); B.box(0, -0.6, 0, 5.4, 0.36, 0.95, (s / 2) % 7 === 3 ? cTimber[3] : cSleepers[((s / 2) * 3 + ((s / 2) >> 2)) % 5], 0, 0, 0.1, M);
      }
    }
    await layTrack(pre, 0, preLen); await ctx.yield(); await layTrack(loop, 0, loop.length);
    await ctx.yield();

    // the hill tunnel: an arch section swept from the dark end to the mouth, a keystone mouth and wing walls
    {
      const prof = [[-7, -0.75], [7, -0.75], [7, 10]];
      for (let k = 1; k <= 8; k++) { const a = (k / 8) * Math.PI; prof.push([7 * Math.cos(a), 10 + 7 * Math.sin(a)]); }
      prof.push([-7, -0.75]);
      const np = prof.length, base = B.nv; let rings = 0;
      for (let s = 0; s <= S_MOUTH + 2; s += 3, rings++) {
        frameOf(pre, Math.min(s, S_MOUTH + 2), M); const rib = rings % 3 === 0 ? 1.7 : 1.0;
        for (let k = 0; k < np; k++) {
          const [u, v] = prof[k]; va.set(u, v, 0).applyMatrix4(M); B.p.push(va.x, va.y, va.z);
          const fl = k === 0 || k === 1 || k === np - 1;
          va.set(fl ? 0 : -u, fl ? 1 : -(v - 8) * 0.6, 0).normalize().transformDirection(M); B.n.push(va.x, va.y, va.z);
          const cc = fl ? cSleeper : cStone[(rings + k) % 4]; const kk = fl ? 1.0 : (rings % 2 ? 0.62 : 0.9) * (k % 2 ? 1.0 : 0.86); B.c.push(cc.r * kk, cc.g * kk, cc.b * kk); B.f.push(0, 0, 0);
        }
      }
      B.nv += rings * np;
      for (let r = 0; r < rings - 1; r++) for (let k = 0; k < np - 1; k++) { const a = base + r * np + k, b = a + 1, c = a + np, d = c + 1; B.i.push(a, c, b, b, c, d); }
      frameOf(pre, S_MOUTH + 2, M); M.multiply(M2.makeRotationY(Math.PI)); K.buildArch(B, M, 7, 10);
      frameOf(pre, S_MOUTH + 2, M);
      for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) B.box(sd * (13.5 + k * 7), 9 - k * 3.2, -1.6 - k * 0.5, 7.2, 20 - k * 6.4, 3, cStone[(k + (sd > 0 ? 1 : 0)) % 4], 0, 0, 0.4, M);
      B.box(0, 23.5, -1.8, 24, 5, 3.2, cStone[0], 0, 0, 0.4, M);
      B.box(-7.2, 0.6, -4.5, 0.5, 2.6, 2.4, cSoot, 0, 0, 0, M);                                  // the mouse hole (right of travel)
      B.box(0, -1.12, 5, 15, 0.4, 12, C('#5d564d'), 0, 0, 0.1, M);                                // ballast apron under the mouth
      // the landscape mesh may not stand inside the bore or in the arch: the shell material cuts this straight section out
      pre.at(0, va); pre.at(S_MOUTH + 9, vb); K.mtnMat.uniforms.uCutA.value.copy(va).applyMatrix4(T2H); K.mtnMat.uniforms.uCutB.value.copy(vb).applyMatrix4(T2H);
    }

    await ctx.yield();
    // the girder bridge over the lake (a low pony truss, so the view stays open) and its two piers
    {
      const cG = C('#46545c'), cG2 = C('#5b6a70'), bay = 10, n = Math.floor((S_BR1 - S_BR0) / bay);
      for (let k = 0; k <= n; k++) {
        const s = S_BR0 + k * bay; frameOf(pre, s, M);
        for (const sd of [-1, 1]) {
          BW.box(sd * 6.3, 0.05, 0, 0.2, 1.8, 0.2, cG, 0, 0, 1.2, M); BW.box(sd * 6.45, -1.7, 0, 0.3, 1.7, 0.9, cG2, 0, 0, 1.2, M);
          if (k < n) { BW.box(sd * 6.3, -1.7, bay / 2, 0.36, 1.7, bay, cG, 0, 0, 1.0, M); BW.box(sd * 6.3, -0.82, bay / 2, 0.7, 0.2, bay, cG2, 0, 0, 1.4, M); BW.box(sd * 6.3, -2.58, bay / 2, 0.8, 0.22, bay, cG2, 0, 0, 1.0, M);
            BW.box(sd * 6.3, 0.95, bay / 2, 0.16, 0.16, bay, cG2, 0, 0, 1.4, M); }
        }
        BW.box(0, -1.3, 0, 13, 0.5, 0.7, cG2, 0, 0, 0.6, M);
        if (k % 4 === 2) { BW.cyl(-7.0, 1.6, 0, 0.2, 0.2, 2.6, cBlack, 'y', 0, 0, 1.2, M, G.cyl6); BW.box(-7.0, 3.3, 0, 0.8, 0.9, 0.8, cGold, 5, 0, 0, M);       // low parapet lamps on the south side, out of the view of the wheel
          va.set(-7.0, 3.3, 0).applyMatrix4(M); addBulb(va.x, va.y, va.z, goldHDR, 2.1, 0, rng.range(0, TAU), lakeBulbs); }
      }
      for (const f of [0.3, 0.7]) { frameOf(pre, lerp(S_BR0, S_BR1, f), M); BW.box(0, -7.3, 0, 9, 11.4, 5, cStone[1], 0, 0, 0.4, M); BW.box(0, -1.9, 0, 10.5, 0.8, 6, cStone[3], 0, 0, 0.6, M); }
      for (const s of [S_BR0 - 1, S_BR1 + 1]) { frameOf(pre, s, M); B.box(0, -5.5, 0, 15, 9, 4, cStone[0], 0, 0, 0.4, M); }
    }
    await ctx.yield();

    // ------------------------------------------------------------ the table landscape: height field
    const inTable = (x, z, m = 0) => x > TB.x0 + m && x < TB.x1 - m && z > TB.z0 + m && z < TB.z1 - m;
    const nOff = rng.range(0, 300), hillK = rng.range(0.8, 1.2);
    const trkS = [], avoid = [];                                      // x, z, railY of samples that shape the ground / must stay clear
    for (let s = S_MOUTH + 3; s < S_BR0 - 2; s += 3) { const p = pre.pts[s]; trkS.push(p.x, p.z, p.y); }
    for (let s = 0; s < loop.n; s += 3) { const p = loop.pts[s]; trkS.push(p.x, p.z, p.y); }
    for (let s = 0; s < pre.n; s += 4) { const p = pre.pts[s]; avoid.push(p.x, p.z); }
    for (let s = 0; s < loop.n; s += 4) { const p = loop.pts[s]; avoid.push(p.x, p.z); }
    const distTrack = (x, z) => { let m = 1e9; for (let i = 0; i < avoid.length; i += 2) { const dx = x - avoid[i], dz = z - avoid[i + 1], d = dx * dx + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };
    const westHill = (x, z) => 52 * (1 - smoothstep(0.5, 1, Math.hypot((x + 425) / 95, (z - 140) / 90)));
    let lastTrackD = 99;
    function gAt(x, z) {
      let h = 0.7 + 0.9 * noise.fbm2(x * 0.012 + nOff, z * 0.012, 3);
      const north = smoothstep(18, -70, z) * (1 - smoothstep(40, 20, Math.hypot(x - WHEEL.x, z - WHEEL.z)) * 0.9);
      h += 26 * hillK * Math.max(0, noise.fbm2(x * 0.0065 + nOff, z * 0.0065 + 5, 3) + 0.18) * north;
      h += 30 * (1 - smoothstep(0.3, 1, Math.hypot((x + 390) / 120, (z + 110) / 130)));
      h += westHill(x, z);
      h += 9 * Math.max(0, noise.fbm2(x * 0.011 + 40, z * 0.011 + nOff, 2)) * smoothstep(60, 150, x) * smoothstep(60, -10, z);
      h = lerp(h, 9, 1 - smoothstep(9, 30, Math.hypot(x - MILL.x, z - MILL.z)));                         // the windmill's knoll
      h = lerp(h, 2.2, (1 - smoothstep(13, 32, Math.abs(x - MILL_ST))) * smoothstep(-34, -52, z));       // Mill Street runs north in a shallow valley
      h = lerp(Math.min(h, 0.6), h, smoothstep(0, 26, Math.min(z - TB.z0, TB.z1 - z, TB.x1 - x)));      // hills die away at the open edges
      h = lerp(0.25, h, smoothstep(112, 137, Math.hypot(x - HERO_POS.x, z - HERO_POS.z)));
      h = lerp(-1.4, h, smoothstep(0.98, 1.3, lakeR(x, z)));
      let dn = 1e9, ty = 0;
      for (let i = 0; i < trkS.length; i += 3) { const dx = x - trkS[i], dz = z - trkS[i + 1], d = dx * dx + dz * dz; if (d < dn) { dn = d; ty = trkS[i + 2]; } }
      dn = Math.sqrt(dn); lastTrackD = dn;
      if (dn < 11) h = lerp(h, ty - 0.8, 1 - smoothstep(4.6, 11, dn));
      return h;
    }

    // ------------------------------------------------------------ the tall matchstick trestle (table -> floorboards -> table)
    {
      let prev = null;
      for (let s = S_BR1 + 6; s < preLen - 1; s += 9) {
        pre.at(s, _t0, _t1); _t2.crossVectors(UP, _t1).normalize(); const P = _t0.clone(), L = _t2.clone(), y = P.y - 0.8, col = rng.pick(cTimber);
        const feet = [];
        for (const sd of [-1, 1]) {
          let lat = 3.3, g = 0;
          for (let it = 0; it < 3; it++) { va.copy(P).addScaledVector(L, sd * lat); g = inTable(va.x, va.z, 3) ? gAt(va.x, va.z) : FLOOR_Y; lat = 3.3 + 0.1 * Math.max(0.5, y - g); }
          feet.push({ sd, lat, g: g - 0.4, h: Math.max(0.5, y - g) });
        }
        const top = [], foot = [];
        for (const f of feet) {
          const a = P.clone().addScaledVector(L, f.sd * 3.3).setY(y), b = P.clone().addScaledVector(L, f.sd * f.lat).setY(f.g);
          B.beam(a, b, f.h > 60 ? 1.15 : 0.85, col); top.push(a); foot.push(b); B.box(b.x, b.y + 0.5, b.z, 2.4, 1.0, 2.4, cStone[2], 0, 0, 0.1);
        }
        const hMin = Math.min(feet[0].h, feet[1].h), tiers = Math.min(9, Math.floor(hMin / (hMin > 60 ? 11 : 6.5)));
        let pa = top[0], pb = top[1];
        for (let k = 1; k <= tiers; k++) {
          const f = k / (tiers + 0.35) * (hMin / feet[0].h), g2 = k / (tiers + 0.35) * (hMin / feet[1].h);
          const qa = top[0].clone().lerp(foot[0], f), qb = top[1].clone().lerp(foot[1], g2);
          B.beam(qa, qb, 0.55, col); B.beam(pa, qb, 0.4, col); B.beam(pb, qa, 0.4, col);
          if (prev && prev.tier[k] && hMin > 30 && k % 2 === 0) { B.beam(prev.tier[k][0], qa, 0.45, cTimber[1]); B.beam(prev.tier[k][1], qb, 0.45, cTimber[1]); }
          pa = qa; pb = qb; (feet.tier || (feet.tier = []))[k] = [qa, qb];
        }
        va.copy(P).addScaledVector(L, -4.3).setY(y); vb.copy(P).addScaledVector(L, 4.3).setY(y); B.beam(va, vb, 0.8, col);
        if (prev) {
          for (const sd of [-2, 2]) { va.copy(prev.P).addScaledVector(prev.L, sd).setY(prev.y + 0.05); vb.copy(P).addScaledVector(L, sd).setY(y + 0.05); B.beam(va, vb, 0.6, cTimber[1]); }
          va.copy(prev.P).addScaledVector(prev.L, -4.2).setY(prev.y + 2.6); vb.copy(P).addScaledVector(L, -4.2).setY(y + 2.6); B.beam(va, vb, 0.26, cTimber[2]);
        }
        va.copy(P).addScaledVector(L, -4.2).setY(y); vb.copy(va).setY(y + 2.7); B.beam(va, vb, 0.3, cTimber[2]);
        prev = { P, L, y, tier: feet.tier || [] };
        await ctx.yield();
      }
    }
    await ctx.yield();

    // ------------------------------------------------------------ the town: tin houses with printed gold windows
    const cWall = ['#d9c08a', '#b4553f', '#8fa573', '#5d7499', '#c98a4a', '#d8cdb4', '#a8483a', '#7f9a8a'].map(C), cRoofs = [cRed.clone(), C('#7d2a22'), C('#3a5a94'), C('#3d5a35'), C('#6a4a3a')];
    const winCols = ['#FFC857', '#ffd98a', '#ffb347', '#ffe9b8'].map(C);
    const taken = [];                                                 // x, z, radius of things already standing
    const free = (x, z, r) => { for (let i = 0; i < taken.length; i += 3) if (Math.hypot(x - taken[i], z - taken[i + 1]) < r + taken[i + 2]) return false; return true; };
    let hr = rng.fork('town');
    function house(x, z, yaw, kind) {
      const y = gAt(x, z) - 0.3, P = atY(x, y, z, yaw, 1), wall = hr.pick(cWall), roofC = winter ? hr.pick(cRoofs).clone().lerp(cSnow, 0.82) : hr.pick(cRoofs);
      let w = hr.range(8, 10), h = hr.range(5.6, 7), d = hr.range(7, 8.5), floors = 1, along = false;
      if (kind === 1) { w = hr.range(7, 8.5); h = hr.range(10, 12.5); floors = 2; along = true; }
      else if (kind === 2) { w = hr.range(10, 12); h = 6.6; along = true; }
      else if (kind === 3) { w = 9; h = 12; d = 15; }
      else if (kind === 4) { w = hr.range(14, 17); h = 9.5; d = 9; floors = 2; along = true; }
      B.box(0, h / 2, 0, w, h, d, wall, 0, 0, 1, P); B.box(0, 0.3, 0, w + 0.5, 0.6, d + 0.5, cStone[2], 0, 0, 0.3, P);
      const span = along ? d : w, rh = span * (kind === 3 ? 0.62 : 0.44), ang = Math.atan2(rh, span / 2), sl = Math.hypot(span / 2 + 0.7, rh + 0.5);
      for (const sd of [-1, 1]) {
        if (along) rb(B, P, 0, h + rh / 2 + 0.1, sd * (span / 4 + 0.2), w + 1.1, 0.42, sl, sd * ang, 0, roofC, 0, 1.4);
        else rb(B, P, sd * (span / 4 + 0.2), h + rh / 2 + 0.1, 0, sl, 0.42, d + 1.1, 0, -sd * ang, roofC, 0, 1.4);
      }
      if (along) B.box(0, h + rh * 0.42, 0, w - 0.1, rh * 0.84, d * 0.5, wall, 0, 0, 1, P); else B.box(0, h + rh * 0.42, 0, w * 0.5, rh * 0.84, d - 0.1, wall, 0, 0, 1, P);
      B.box(along ? w * 0.28 : 1.9, h + rh * 0.9, along ? 0.8 : -1.2, 1.0, 2.6, 1.0, cStone[0], 0, 0, 0.4, P);
      const lit = () => (hr.chance(0.8) ? hr.range(3.6, 5.6) : 0.2), wc = hr.pick(winCols), n = Math.max(2, Math.floor(w / 3.1));
      for (let f = 0; f < floors; f++) for (const side of [-1, 1]) for (let k = 0; k < n; k++) {
        const wx = (k - (n - 1) / 2) * (w / n), wy = 2.6 + f * (h - 3.2) / Math.max(1, floors - 0.4) + (floors === 1 ? 0.5 : 0);
        if (f === 0 && side > 0 && k === 0 && kind !== 2) { B.box(wx, 1.7, d / 2 + 0.05, 1.4, 2.8, 0.1, roofC.clone().multiplyScalar(0.6), 0, 0, 1, P); continue; }
        if (kind === 2 && f === 0 && side > 0) { if (k === 0) { B.box(0, 2.4, d / 2 + 0.05, w * 0.7, 2.6, 0.1, wc, 5.2, 0, 0, P); rb(B, P, 0, 4.5, d / 2 + 1.0, w * 0.8, 0.2, 2.2, 0.45, 0, k % 2 ? cWhite : cRed, 0, 1.2); } continue; }
        B.box(wx, wy, side * (d / 2 + 0.04), 1.25, kind === 3 ? 4.4 : 1.6, 0.1, wc, lit(), 0, 0, P);
      }
      for (const sx of [-1, 1]) B.box(sx * (w / 2 + 0.04), 2.8, 0, 0.1, 1.6, 1.5, wc, lit(), 0, 0, P);
      if (kind === 3) { B.box(0, 17, d / 2 - 2.5, 5, 34, 5, wall, 0, 0, 1, P); B.cyl(0, 43.5, d / 2 - 2.5, 3.7, 3.7, 19, roofC, 'y', 0, 0, 1.4, P, G.cone); B.cyl(0, 58, d / 2 - 2.5, 2.03, 2.03, 10, roofC, 'y', 0, 0, 1.4, P, G.cone); B.cyl(0, 65.5, d / 2 - 2.5, 1.1, 1.1, 5, roofC, 'y', 0, 0, 1.4, P, G.cone); B.box(0, 21, d / 2 + 0.05, 1.8, 1.8, 0.1, C('#fff1c8'), 4, 0, 0, P);
        for (const [ox, oz, sw, sd2] of [[0, 2.55, 1.5, 0.1], [0, -2.55, 1.5, 0.1], [2.55, 0, 0.1, 1.5], [-2.55, 0, 0.1, 1.5]]) { B.box(ox, 29.5, d / 2 - 2.5 + oz, sw, 4.2, sd2, winCols[1], 4.8, 0, 0, P); B.box(ox, 11, d / 2 - 2.5 + oz, sw, 3.2, sd2, winCols[0], 3.6, 0, 0, P); }
        va.set(0, 29.5, d / 2 + 0.6).applyMatrix4(P); addBulb(va.x, va.y, va.z, cGold.clone().multiplyScalar(2.2), 3.6); va.set(0, 68.6, d / 2 - 2.5).applyMatrix4(P); addBulb(va.x, va.y, va.z, C('#fff1c8').multiplyScalar(4), 2.2); }
      va.set(0.6, 2.8, d / 2 + 1.6).applyMatrix4(P); addBulb(va.x, va.y, va.z, cGold.clone().multiplyScalar(1.5), 2.6);
      taken.push(x, z, Math.max(w, d) * 0.62);
    }
    function lamp(x, z, bat = B, list = bulbs) {
      const y = gAt(x, z) - 0.2; bat.cyl(x, y + 4, z, 0.2, 0.2, 8, cBlack, 'y', 0, 0, 1.2, null, G.cyl6); bat.cyl(x, y + 0.4, z, 0.5, 0.5, 0.8, cBlack, 'y', 0, 0, 1.2, null, G.cyl6);
      bat.box(x, y + 8.5, z, 0.9, 1.1, 0.9, cGold, 5, 0, 0); bat.cyl(x, y + 9.3, z, 0.75, 0.75, 0.3, cBlack, 'y', 0, 0, 1.2, null, G.cone);
      addBulb(x, y + 8.5, z, goldHDR, 2.6, 0, bRng.range(0, TAU), list); taken.push(x, z, 1);
    }
    const wavers = [], STN = { x: -200, y: 0 };
    const ROAD_X = -285, PARK = { x: -183, z: 86, r: 15 };
    const rows = [[162, Math.PI], [184, 0], [206, Math.PI], [228, 0], [108, 0], [86, Math.PI], [62, 0]];   // z, which way the front door looks
    taken.push(-200, 162, 44, PARK.x, PARK.z, PARK.r + 3, MILL.x, MILL.z, 13, -203, 94, 18, -140, 227, 15, -131, 10, 27);   // station, park, mill, and now the clock tower's market square, the gasholder, the orchard
    for (const [rz, yaw] of rows) {
      const northRow = rz < 126, xa = northRow ? -318 : -336, xb = northRow ? -124 : -130;
      for (let x = xa + hr.range(0, 6); x < xb; x += hr.range(12.5, 16) / Math.sqrt(density)) {
        const z = rz + hr.range(-1.5, 1.5);
        if (Math.abs(x - ROAD_X) < 11 || westHill(x, z) > 2 || distTrack(x, z) < 12.5 || !free(x, z, 6) || lakeR(x, z) < 1.35 || !inTable(x, z, 9)) continue;
        house(x, z, yaw + hr.range(-0.06, 0.06), hr.pick([0, 0, 1, 1, 1, 2, 4]));
      }
      await ctx.yield();
    }
    house(-150, 197, Math.PI / 2, 3);                                                         // the church
    const tk0 = taken.length; for (let z = -46; z > -240; z -= 12) taken.push(MILL_ST, z, 14); const tk1 = taken.length;   // keep Mill Street's ground free of farms
    for (let k = 0, tries = 0; k < Math.round(54 * density) && tries < 900; tries++) {       // farms and cottages out in the flock hills
      const x = hr.range(TB.x0 + 14, TB.x1 - 14), z = hr.range(TB.z0 + 14, TB.z1 - 14);
      if ((z > 30 && x < -95) || Math.hypot(x - MILL.x, z - MILL.z) < 46 || lakeR(x, z) < 1.4 || distTrack(x, z) < (x > 40 ? 34 : 14) || Math.hypot(x - HERO_POS.x, z - HERO_POS.z) < 132 || Math.hypot(x - WHEEL.x, z - WHEEL.z) < 34 || !free(x, z, 9)) continue;
      if (Math.abs(gAt(x + 4, z) - gAt(x - 4, z)) > 3.5 || Math.abs(gAt(x, z + 4) - gAt(x, z - 4)) > 3.5) continue;
      house(x, z, hr.range(0, TAU), hr.pick([0, 0, 0, 1])); k++;
      if ((k & 3) === 0) await ctx.yield();
    }
    for (const sz of [173, 217, 97]) for (let x = -330; x < -118; x += 27) { const lx = x + hr.range(-3, 3); if (Math.abs(lx - ROAD_X) > 8 && distTrack(lx, sz) > 16 && free(lx, sz, 2) && westHill(lx, sz) < 1) lamp(lx, sz + (sz === 97 ? 0 : 4.5)); }
    lamp(PARK.x, PARK.z);
    await ctx.yield();

    // the station (canopy 60 long on the right-hand side), the level crossing and its flashing lamps
    {
      const sx = -200, py = pre.pts[S_STATION].y; STN.y = py;
      B.box(sx, py - 0.5, 153.5, 72, 1.6, 10, cStone[1], 0, 0, 0.4); B.box(sx, py + 0.36, 148.9, 72, 0.14, 0.7, cWhite, 0, 0, 0.6);
      rb(B, null, sx, py + 11.6, 153.5, 60, 0.4, 11, -0.07, 0, winter ? cSnow : C('#3d5a35'), 0, 1.5);
      B.box(sx, py + 10.9, 148.2, 60, 0.9, 0.2, C('#e8d9ae'), 0, 0, 1);
      for (let k = 0; k < 7; k++) { const x = sx - 27 + k * 9; B.cyl(x, py + 6, 154.5, 0.28, 0.28, 11, cRed, 'y', 0, 0, 1.6, null, G.cyl6);
        if (k % 2 === 0) { B.box(x + 4.5, py + 10, 152, 0.8, 0.9, 0.8, cGold, 5, 0, 0); addBulb(x + 4.5, py + 9.8, 152, goldHDR, 2.8); } }
      for (const bx of [-14, 10]) { B.box(sx + bx, py + 1.2, 156.5, 5, 0.3, 1.4, cTimber[0], 0, 0, 0.5); B.box(sx + bx, py + 2.0, 157.2, 5, 1.3, 0.2, cTimber[0], 0, 0, 0.5); }
      await ctx.yield(); house(sx + 4, 167, Math.PI, 4); await ctx.yield();
      for (const bx of [-22, 22]) {                                  // name boards
        for (const px of [-4, 4]) B.cyl(sx + bx + px, py + 3.2, 157.6, 0.18, 0.18, 5.6, cBlack, 'y', 0, 0, 1.2, null, G.cyl6);
        B.box(sx + bx, py + 5.4, 157.6, 10, 2.0, 0.25, C('#e8dcb8'), 0, 0, 1.3); B.box(sx + bx, py + 5.4, 157.45, 8.6, 0.9, 0.1, C('#22386a'), 0, 0, 0.6); B.box(sx + bx, py + 6.5, 157.6, 10.4, 0.25, 0.4, cRed, 0, 0, 1.4);
      }
      B.beam(va.set(sx - 29.6, py + 10.45, 147.6), vb.set(sx + 29.6, py + 10.45, 147.6), 0.14, cBlack);                // the bunting's string along the canopy's edge
      const figC = ['#a8483a', '#2a4a8a', '#d9c08a', '#3d5a35', '#5d7499', '#7a4a2a', '#c98a4a'].map(C), lugC = ['#7a4a30', '#3a5248', '#a8743a', '#5a4a3a'].map(C);
      for (let k = 0; k < 11; k++) {                                 // tin passengers on their tab stands, and their luggage
        const fx2 = sx - 30 + k * 6 + hr.range(-1.6, 1.6), fz = hr.range(151, 156), sc = hr.range(0.9, 1.1), col = hr.pick(figC);
        B.cyl(fx2, py + 0.38, fz, 0.7, 0.7, 0.16, cBlack, 'y', 0, 0, 1.2, null, G.cyl6);
        const col2 = figC[(k * 3 + 1) % 7].clone().lerp(cWhite, k % 2 ? 0.3 : 0), hat = k % 3 ? cBlack : col.clone().multiplyScalar(0.55), b0 = py + 0.4;
        B.cyl(fx2, b0 + 0.85 * sc, fz, 0.66, 0.66, 1.7 * sc, col, 'y', 0, 0, 1.5, null, G.cone);                    // the coat's skirt
        B.cyl(fx2, b0 + 2.1 * sc, fz, 0.44, 0.36, 1.0 * sc, col2, 'y', 0, 0, 1.5, null, G.cyl6);                   // jacket in a second colour
        const waves = k === 3 || k === 8; if (waves) wavers.push({ x: fx2, y: b0 + 2.4 * sc, z: fz, sc, col: col2.clone().multiplyScalar(0.8), ph: k });
        for (const sd of [-1, 1]) if (!(waves && sd < 0)) B.box(fx2 + sd * 0.52, b0 + 1.95 * sc, fz, 0.17, 1.0 * sc, 0.22, col2.clone().multiplyScalar(0.8), 0, 0, 1.2);
        M2.compose(va.set(fx2, b0 + 2.95 * sc, fz), _q4.identity(), vb.set(0.37, 0.4, 0.37)); B.add(G.blob, M2, C('#e6b89a'), 0, 0, 0.8);
        B.cyl(fx2, b0 + 3.27 * sc, fz, 0.52, 0.52, 0.08, hat, 'y', 0, 0, 1, null, G.cyl6); B.cyl(fx2, b0 + 3.45 * sc, fz, 0.3, 0.3, 0.3, hat, 'y', 0, 0, 1, null, G.cyl6);
        if (k % 3 === 1) { B.box(fx2 + 1.5, py + 0.75, fz + 0.4, 1.5, 0.9, 0.9, hr.pick(lugC), 0, 0, 1.2); B.box(fx2 + 1.6, py + 1.45, fz + 0.4, 1.0, 0.55, 0.7, hr.pick(lugC), 0, 0, 1.2); }
      }
      B.box(sx + 31, py + 1.0, 156.6, 3.4, 1.5, 2.0, lugC[0], 0, 0, 1.2); B.box(sx + 31.3, py + 2.15, 156.6, 2.4, 0.9, 1.6, lugC[1], 0, 0, 1.2); B.box(sx + 27.8, py + 0.8, 156.8, 1.6, 1.1, 1.3, lugC[2], 0, 0, 1.2);
      for (const lz of [130, 150]) lamp(-340, lz);                   // the gold dots that fill the tunnel mouth
      lamp(-322, 130.5); lamp(-322, 149.5); lamp(-305, 149.5);
      if (winter) for (let k = 0; k <= 16; k++) {                    // a string of coloured bulbs under the canopy
        const t = k / 16, x = sx - 29 + t * 58, y = py + 9.6 - 1.6 * Math.sin(((t * 4) % 1) * Math.PI), col = ['#ff3a2a', '#3aff6a', '#3a7aff', '#ffc02a', '#ff5ad0'][k % 5];
        addBulb(x, y, 149.2, C(col).multiplyScalar(3.4), 1.9); B.box(x, y, 149.2, 0.5, 0.6, 0.5, C(col), 4, 0, 0);
        if (k) B.beam(va.set(x, y + 0.3, 149.2), vb.set(sx - 29 + ((k - 1) / 16) * 58, py + 9.9 - 1.6 * Math.sin((((k - 1) / 4) % 1) * Math.PI), 149.2), 0.16, cBlack);
      }
      for (const gz of [150.5, 116]) for (const sd of [-1, 1]) {
        const gx = ROAD_X + sd * 7.5, gy = gAt(gx, gz);
        B.cyl(gx, gy + 3.2, gz, 0.3, 0.3, 6.4, cWhite, 'y', 0, 0, 1.2, null, G.cyl6); B.box(gx, gy + 6.6, gz, 2.6, 1.3, 0.5, cBlack, 0, 0, 1);
        for (const lx of [-0.75, 0.75]) addBulb(gx + lx, gy + 6.6, gz + (gz > 130 ? -0.5 : 0.5), C('#ff2a1c').multiplyScalar(4.5), 2.3, 3, lx > 0 ? 0 : Math.PI);
        for (let k = 0; k < 4; k++) B.box(gx - sd * (1.2 + k * 1.7), gy + 3.0, gz, 1.7, 0.6, 0.3, k % 2 ? cRed : cWhite, 0, 0, 1.3);
      }
      taken.push(ROAD_X, 150, 9, ROAD_X, 116, 9);
    }
    await ctx.yield();
    // ------------------------------------------------------------ the tall lit things of a model town: what stands up into the dark above the roofs
    const FEST = ['#ff4a36', '#ffc02a', '#4ae07a', '#4a8cff', '#ff6ad0', '#fff0c4'].map((h) => C(h).multiplyScalar(3.2));
    const festoon = (ax, ay, az, bx, by, bz, n, sag, k0 = 0) => {            // a wire with coloured bulbs hanging in a shallow curve
      let px = ax, py = ay, pz = az;
      for (let k = 1; k <= n + 1; k++) {
        const t = k / (n + 1), x = lerp(ax, bx, t), y = lerp(ay, by, t) - sag * Math.sin(t * Math.PI), z = lerp(az, bz, t);
        B.beam(va.set(px, py, pz), vb.set(x, y, z), 0.16, cBlack); px = x; py = y; pz = z;
        if (k <= n) { const c = FEST[(k0 + k) % 6]; addBulb(x, y - 0.3, z, c, 1.7, 0, r2(0, TAU)); B.box(x, y - 0.3, z, 0.42, 0.5, 0.42, c, 1.2, 0, 0); }
      }
    };
    const CLK = { x: -203, z: 94, y: 0 };
    {
      const cCream = C('#a89c84'), y = gAt(CLK.x, CLK.z) - 0.3, P = atY(CLK.x, y, CLK.z, 0, 0.84), face = C('#fff1c8'); CLK.y = y;
      B.box(0, 3, 0, 9.4, 6, 9.4, cStone[1], 0, 0, 0.4, P); B.box(0, 20.5, 0, 6.6, 29, 6.6, cCream, 0, 0, 0.6, P); B.box(0, 35.3, 0, 7.8, 0.8, 7.8, cStone[3], 0, 0, 0.6, P);
      B.box(0, 39.4, 0, 7.4, 7.4, 7.4, cStone[1], 0, 0, 0.5, P); B.box(0, 43.5, 0, 8.2, 0.8, 8.2, cStone[3], 0, 0, 0.6, P); B.box(0, 47, 0, 5.6, 6.4, 5.6, cCream, 0, 0, 1, P);
      B.cyl(0, 54.6, 0, 4.6, 4.6, 9, cRed, 'y', 0, 0, 1.4, P, G.cone); B.cyl(0, 61.6, 0, 2.5, 2.5, 5, cRed, 'y', 0, 0, 1.4, P, G.cone); B.cyl(0, 65.4, 0, 0.18, 0.18, 2.8, cBrass, 'y', 0, 0, 2, P, G.cyl6);
      for (let q = 0; q < 4; q++) {
        const Q = P.clone().multiply(M2.makeRotationY(q * Math.PI / 2));
        B.cyl(0, 39.4, 3.76, 2.8, 2.8, 0.14, face, 'z', 2.4, 0, 0, Q); B.cyl(0, 39.4, 3.7, 3.2, 3.2, 0.1, cBrass, 'z', 0, 0, 2, Q);
        rb(B, Q, 0.55, 40.1, 3.9, 0.34, 2.0, 0.08, 0, -0.7, cBlack, 0, 0); rb(B, Q, -0.3, 40.3, 3.9, 0.3, 2.5, 0.08, 0, 0.25, cBlack, 0, 0);
        B.box(0, 47.2, 2.84, 1.7, 3.4, 0.1, winCols[2], 4.6, 0, 0, Q);
        for (const wy of [10, 18, 26]) B.box(0, wy, 3.34, 1.3, 2.4, 0.1, winCols[q % 4], q === 1 && wy === 18 ? 0.2 : 3.0, 0, 0, Q);
        B.box(0, 2.6, 4.74, 2.2, 3.6, 0.1, q === 0 ? cTimber[1] : cStone[2], 0, 0, 0.6, Q);
        va.set(0, 39.4, 4.6).applyMatrix4(Q); addBulb(va.x, va.y, va.z, C('#fff1c8').multiplyScalar(1.5), 3.0, 0, r2(0, TAU));
      }
      addBulb(CLK.x, y + 67 * 0.84, CLK.z, C('#ff3a2a').multiplyScalar(4), 2.4, 3, 0);
      // the market round its foot: striped stalls, each under its own bulb
      for (let k = 0; k < 7; k++) {
        const a = 0.5 + k * 0.82, rr = 13.5, x = CLK.x + Math.cos(a) * rr, z = CLK.z + Math.sin(a) * rr, Q = atY(x, gAt(x, z) - 0.2, z, Math.atan2(CLK.x - x, CLK.z - z) + Math.PI, 1), c1 = [cRed, C('#2a66d8'), C('#2c7a3e'), C('#e8b020')][k % 4];
        B.box(0, 1.3, 0, 4.6, 2.2, 2.4, cTimber[k % 3], 0, 0, 0.5, Q); B.box(0, 2.7, 0.2, 4.2, 0.7, 1.8, [C('#e8862a'), C('#d8402e'), C('#9ac040'), C('#f0d060')][k % 4], 0.5, 0, 0.6, Q);
        for (const sx of [-2.2, 2.2]) B.cyl(sx, 2.9, 1.3, 0.12, 0.12, 5.8, cWhite, 'y', 0, 0, 1, Q, G.cyl6);
        for (let q = 0; q < 6; q++) rb(B, Q, -2.1 + q * 0.84, 5.8, 0.5, 0.84, 0.16, 3.4, 0.42, 0, q % 2 ? cWhite : c1, 0, 1.2);
        va.set(0, 4.7, 0.9).applyMatrix4(Q); addBulb(va.x, va.y, va.z, goldHDR, 2.3, 0, r2(0, TAU));
      }
    }
    await ctx.yield();
    {                                                                // the gasholder at the south-east end of the town
      const gx = -140, gz = 227, y = gAt(gx, gz) - 0.3, P = atY(gx, y, gz, 0, 1), cTank = C('#55685e');
      B.cyl(0, 2, 0, 12.4, 12.4, 4, cStone[0], 'y', 0, 0, 0.4, P); B.cyl(0, 11.5, 0, 11, 11, 15, cTank, 'y', 0, 0, 1.4, P); B.cyl(0, 19.4, 0, 11.2, 11.2, 0.8, cBrass, 'y', 0, 0, 2, P);
      M.compose(va.set(0, 19.6, 0), _q4.identity(), vb.set(11, 3.2, 11)).premultiply(P); B.add(G.dome, M, cTank.clone().multiplyScalar(1.15), 0, 0, 1.6);
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * TAU, a1 = ((k + 1) / 10) * TAU, cx = Math.cos(a) * 12.6, cz = Math.sin(a) * 12.6;
        B.cyl(cx, 14, cz, 0.3, 0.3, 28, cBlack, 'y', 0, 0, 1.2, P, G.cyl6);
        for (const hy of [12, 27.6]) B.beam(va.set(cx, hy, cz).applyMatrix4(P), vb.set(Math.cos(a1) * 12.6, hy, Math.sin(a1) * 12.6).applyMatrix4(P), 0.3, cBlack, null, 1.2);
        B.beam(va.set(cx, 12, cz).applyMatrix4(P), vb.set(Math.cos(a1) * 12.6, 27.6, Math.sin(a1) * 12.6).applyMatrix4(P), 0.2, cBlack, null, 1.2);
        va.set(cx, 28.6, cz).applyMatrix4(P); addBulb(va.x, va.y, va.z, k % 5 === 0 ? C('#ff3a2a').multiplyScalar(4) : goldHDR, k % 5 === 0 ? 2.4 : 1.9, k % 5 === 0 ? 3 : 0, k * 1.3);
      }
      for (const wy of [6, 11, 16]) for (let k = 0; k < 5; k++) { const a = 1.9 + k * 0.5; B.box(Math.cos(a) * 11.05, wy, Math.sin(a) * 11.05, 0.9, 1.5, 0.9, winCols[k % 4], 3.6, 0, 0, P, -a); }
    }
    {                                                                // the signal gantry over both lines east of the station, and the festoon poles beside the down line
      const sg = sOfX(-150); frameOf(pre, sg, M); const P = M.clone(), cG = C('#3a4248');
      for (const lx of [-9.5, 21]) { for (const dz of [-0.9, 0.9]) B.cyl(lx, 13.5, dz, 0.3, 0.3, 30, cG, 'y', 0, 0, 1.2, P, G.cyl6); for (let k = 0; k < 6; k++) B.beam(va.set(lx, -1 + k * 5, k % 2 ? 0.9 : -0.9).applyMatrix4(P), vb.set(lx, 4 + k * 5, k % 2 ? -0.9 : 0.9).applyMatrix4(P), 0.2, cG, null, 1.2); }
      for (const hy of [26, 28.6]) B.box(5.75, hy, 0, 31, 0.36, 0.36, cG, 0, 0, 1.2, P);
      for (let k = 0; k < 10; k++) B.beam(va.set(-9.5 + k * 3.05, k % 2 ? 26 : 28.6, 0).applyMatrix4(P), vb.set(-9.5 + (k + 1) * 3.05, k % 2 ? 28.6 : 26, 0).applyMatrix4(P), 0.2, cG, null, 1.2);
      [[0, '#2cff7a'], [14, '#ff2a1c'], [7, '#ffb020']].forEach(([lx, hc], k) => {
        B.box(lx, 23.6, 0, 1.5, 3.4, 1.0, cBlack, 0, 0, 1, P); B.box(lx, 25.6, 0, 0.3, 1.2, 0.3, cG, 0, 0, 1, P); rb(B, P, lx + 1.9, 24.6, 0, 3.6, 0.9, 0.2, 0, k === 0 ? -0.6 : 0, k % 2 ? cRed : C('#e8b020'), 0, 1.3);
        va.set(lx, 23.2, -0.7).applyMatrix4(P); addBulb(va.x, va.y, va.z, C(hc).multiplyScalar(4.2), 2.6, 0, r2(0, TAU));
      });
      for (const lx of [-6, 3.5, 10.5, 18]) { va.set(lx, 29.4, 0).applyMatrix4(P); addBulb(va.x, va.y, va.z, goldHDR, 1.8, 0, r2(0, TAU)); B.box(lx, 29.3, 0, 0.5, 0.6, 0.5, cGold, 4, 0, 0, P); }
      taken.push(V3(21, 0, 0).applyMatrix4(P).x, V3(21, 0, 0).applyMatrix4(P).z, 2, V3(-9.5, 0, 0).applyMatrix4(P).x, V3(-9.5, 0, 0).applyMatrix4(P).z, 2);
      const pz = 119.2, xs = [-333, -303, -273, -243, -213, -183, -153];
      xs.forEach((x, k) => {
        const g = gAt(x, pz) - 0.2; B.cyl(x, g + 8.2, pz, 0.24, 0.24, 16.4, cTimber[3], 'y', 0, 0, 0.4, null, G.cyl6); B.box(x, g + 15.4, pz, 0.34, 0.34, 3.4, cTimber[3], 0, 0, 0.4); B.box(x, g + 14.2, pz, 0.3, 0.3, 2.4, cTimber[3], 0, 0, 0.4);
        for (const dz of [-1.5, 1.5]) B.box(x, g + 15.8, pz + dz, 0.3, 0.5, 0.3, cWhite, 0, 0, 1.4);
        if (k) { const g0 = gAt(xs[k - 1], pz) - 0.2; festoon(xs[k - 1], g0 + 15.2, pz, x, g + 15.2, pz, 6, 2.6, k); B.beam(va.set(xs[k - 1], g0 + 16, pz + 1.5), vb.set(x, g + 16, pz + 1.5), 0.14, cBlack); }
        taken.push(x, pz, 1);
      });
    }
    await ctx.yield();
    for (const [sz, x0, x1] of [[173, -333, -128], [97, -318, -126]]) {      // strings of bulbs zigzag across the two shopping streets
      let prev = null, k = 0;
      for (let x = x0; x <= x1; x += 20, k++) {
        const z = sz + (k % 2 ? 4.5 : -4.5), g = gAt(x, z) - 0.2;
        if (free(x, z, 0.8)) { B.cyl(x, g + 6.6, z, 0.2, 0.2, 13.2, cBlack, 'y', 0, 0, 1.2, null, G.cyl6); B.cyl(x, g + 13.4, z, 0.5, 0.5, 0.5, cBrass, 'y', 0, 0, 2, null, G.cyl6); }
        if (prev && Math.hypot((prev[0] + x) / 2 - CLK.x, sz - CLK.z) > 14) festoon(prev[0], prev[1], prev[2], x, g + 13, z, 5, 1.8, k);
        prev = [x, g + 13, z];
      }
      await ctx.yield();
    }
    // the mill hamlet in the north-east corner, under the round window: what the east side of the helix looks down on
    const millAx = V3(-0.12, 0, 1).normalize(), millHub = V3(0, 0, 0);
    {
      const y = gAt(MILL.x, MILL.z) - 0.2, cTower = C('#e6dcc2'), cCap = winter ? cSnow : cRed;
      const P = atY(MILL.x, y, MILL.z, Math.atan2(millAx.x, millAx.z), 1.4);                                       // +z = toward the line
      B.cyl(0, 1.6, 0, 6.4, 6.4, 3.2, cStone[1], 'y', 0, 0, 0.4, P); B.cyl(0, 12, 0, 5.4, 5.4, 18, cTower, 'y', 0, 0, 1, P, G.cone);
      B.cyl(0, 3.5, 0, 6.9, 6.9, 0.35, cTimber[0], 'y', 0, 0, 0.5, P);                                             // the gallery
      for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; B.box(Math.cos(a) * 6.7, 4.4, Math.sin(a) * 6.7, 0.22, 1.6, 0.22, cTimber[2], 0, 0, 0.5, P); }
      M.compose(va.set(0, 20.6, 0), _q4.identity(), vb.set(3.7, 3.4, 3.7)).premultiply(P); B.add(G.dome, M, cCap, 0, 0, 1.5);
      B.cyl(0, 20.9, 0, 3.9, 3.9, 0.5, cTimber[3], 'y', 0, 0, 0.6, P);
      B.box(0, 2.6, 5.0, 1.8, 3.4, 0.6, cTimber[1], 0, 0, 1, P);
      for (const [wx, wy, wz] of [[0, 9, 4.25], [0, 15, 3.5], [3.9, 7, 1.6], [-3.6, 12, 1.2]]) B.box(wx, wy, wz, wx ? 0.3 : 1.3, 1.7, wx ? 1.3 : 0.3, winCols[0], 4.6, 0, 0, P);
      B.cyl(0, 19.2, 3.4, 0.5, 0.5, 4.4, cBlack, 'z', 0, 0, 1.2, P, G.cyl6);                                        // the windshaft
      millHub.set(0, 19.2, 5.5).applyMatrix4(P);
      va.set(1.6, 3.2, 6.6).applyMatrix4(P); addBulb(va.x, va.y, va.z, goldHDR, 2.8);
      for (let k = 0; k < 9; k++) {
        const a = 0.4 + k * 0.7 + hr.range(-0.15, 0.15), r = hr.range(23, 40), x = MILL.x + Math.cos(a) * r, z = MILL.z + Math.sin(a) * r;
        if (inTable(x, z, 10) && free(x, z, 6)) house(x, z, Math.atan2(MILL.x - x, MILL.z - z) + hr.range(-0.3, 0.3), hr.pick([0, 0, 1, 2]));
      }
      for (const a of [0.3, 1.5, 2.7, 3.9, 5.2]) { const x = MILL.x + Math.cos(a) * 15, z = MILL.z + Math.sin(a) * 15; if (free(x, z, 1.5)) lamp(x, z); }
    }

    await ctx.yield();
    // Mill Street: the north-east quarter that the helix looks down on. Two rows of tin houses face each other across a lit road
    {
      const hr0 = hr, tk = taken.splice(tk0, tk1 - tk0); hr = XR; bRng = XR;
      for (let z = -53, k = 0; z > -234; z -= r2(12.6, 14.4), k++) {
        for (const sd of [-1, 1]) { const zz = z + sd * 3 + r2(-1, 1), x = MILL_ST + sd * r2(10.5, 12); if (free(x, zz, 5.5)) house(x, zz, sd * -Math.PI / 2 + r2(-0.05, 0.05), XR.pick([0, 1, 1, 1, 2, 4])); }
        await ctx.yield();
      }
      for (let z = -50, k = 0; z > -238; z -= 20, k++) lamp(MILL_ST + (k % 2 ? 5.3 : -5.3), z);
      for (const sd of [-1, 1]) {                                    // a striped barrier with two flashing lamps where the road ends at the mountain's foot
        const gx = MILL_ST + sd * 3.4, gz = -43, gy = gAt(gx, gz);
        B.cyl(gx, gy + 2.2, gz, 0.3, 0.3, 4.4, cWhite, 'y', 0, 0, 1.2, null, G.cyl6); B.box(gx, gy + 4.7, gz, 1.5, 1.1, 0.5, cBlack, 0, 0, 1);
        addBulb(gx, gy + 4.7, gz - 0.5, C('#ff2a1c').multiplyScalar(4.5), 2.3, 3, sd > 0 ? 0 : Math.PI);
        for (let k = 0; k < 2; k++) B.box(gx - sd * (1.1 + k * 1.6), gy + 2.6, gz, 1.6, 0.6, 0.3, k % 2 ? cRed : cWhite, 0, 0, 1.3);
      }
      hr = hr0; bRng = rng; taken.push(...tk);
    }
    await ctx.yield();
    // the Ferris wheel's stand on the far shore, reeds of bristle at the water's edge, the lake pit that holds the mirror world
    {
      const wy = gAt(WHEEL.x, WHEEL.z); WHEEL.y = wy;
      frameOf(pre, (S_BR0 + S_BR1) / 2, M); const ax = V3(1, 0, 0).transformDirection(M), al = V3(0, 0, 1).transformDirection(M);   // axle direction, along the shore
      for (const sd of [-1, 1]) for (const fw of [-1, 1]) {
        va.copy(WHEEL).addScaledVector(ax, sd * 3.4).setY(wy + 24.5); vb.copy(WHEEL).addScaledVector(ax, sd * 5).addScaledVector(al, fw * 11).setY(wy);
        BW.beam(va, vb, 0.8, C('#c33a2e'), null, 1.4);
      }
      va.copy(WHEEL).addScaledVector(ax, -4).setY(wy + 24.5); vb.copy(WHEEL).addScaledVector(ax, 4).setY(wy + 24.5); BW.beam(va, vb, 1.3, cBrass, null, 2);
      BW.box(WHEEL.x, wy + 0.5, WHEEL.z, 26, 1, 26, cStone[2], 0, 0, 0.3);
      taken.push(WHEEL.x, WHEEL.z, 20);
      for (let k = 0; k < 130; k++) {
        const a = rng.range(0, TAU), rr = rng.range(1.0, 1.1), c = Math.cos(LAKE.rot), s = Math.sin(LAKE.rot), ex = LAKE.a * rr * Math.cos(a), ez = LAKE.b * rr * Math.sin(a);
        const x = LAKE.x + ex * c - ez * s, z = LAKE.z + ex * s + ez * c; if (distTrack(x, z) < 8) continue;
        va.set(x, -0.5, z); vb.set(x + rng.range(-0.8, 0.8), rng.range(3, 6.5), z + rng.range(-0.8, 0.8)); BW.beam(va, vb, 0.22, C(rng.chance(0.3) ? '#8a7a3a' : '#3c5a30'), null, 0.2);
      }
      const pit = new THREE.CylinderGeometry(1, 1, 1, 40, 1, false);
      M.compose(V3(LAKE.x, -34, LAKE.z), _q4.setFromAxisAngle(UP, -LAKE.rot), V3(-LAKE.a * 1.12, 68, LAKE.b * 1.72));   // wide enough to hold the mirror image of the wheel on the far shore B.add(pit, M, cAir.clone().multiplyScalar(0.5), 0, 0, 0); pit.dispose();
    }
    await ctx.yield();

    const LY = 0.3;                                                   // lake glass level
    // ------------------------------------------------------------ the lake's own life (all of it doubled in the glass): shore lamps, moored boats with lanterns, lit girders, flower beds, hedges
    const lakeXZ = (a, rr, out) => { const c = Math.cos(LAKE.rot), s = Math.sin(LAKE.rot), ex = LAKE.a * rr * Math.cos(a), ez = LAKE.b * rr * Math.sin(a); return out.set(LAKE.x + ex * c - ez * s, 0, LAKE.z + ex * s + ez * c); };
    {
      for (let k = 0; k < 13; k++) { lakeXZ(0.25 + k * (TAU / 13), 1.13, vc); if (distTrack(vc.x, vc.z) > 11 && Math.hypot(vc.x - WHEEL.x, vc.z - WHEEL.z) > 17) lamp(vc.x, vc.z, BW, lakeBulbs); }
      const hullC = ['#b5202a', '#2a66d8', '#e8d9ae', '#2c7a3e'].map(C);
      [[1.1, 0.62, 0.4], [2.3, 0.7, 1.9], [3.5, 0.55, -0.6], [4.4, 0.8, 2.6], [5.6, 0.5, 1.2], [0.2, 0.3, 0.9]].forEach(([a, rr, yaw], k) => {          // rowing boats and a little paddle steamer at their moorings
        lakeXZ(a, rr, vc); if (distTrack(vc.x, vc.z) < 12) return;
        const P = atY(vc.x, LY, vc.z, yaw, k === 5 ? 1.5 : 1), hc = hullC[k % 4];
        M.compose(va.set(0, 0.5, 0), _q4.identity(), vb.set(1.5, 0.9, 3.6)).premultiply(P); BW.add(G.blob, M, hc, 0, 0, 1.6);
        BW.box(0, 1.15, 0, 2.5, 0.22, 6.0, cWhite, 0, 0, 1.4, P); BW.box(0, 1.3, -0.4, 1.9, 0.3, 0.5, cTimber[0], 0, 0, 0.6, P);
        if (k === 5) { BW.box(0, 2.0, 0.2, 1.9, 1.5, 3.0, cWhite, 0, 0, 1.4, P); BW.cyl(0, 3.6, 0.8, 0.4, 0.4, 2.2, cRed, 'y', 0, 0, 1.6, P, G.cyl6); for (const sd of [-1, 1]) for (let q = 0; q < 3; q++) BW.box(sd * 0.97, 2.1, -0.7 + q * 0.9, 0.06, 0.6, 0.5, cGold, 4.4, 0, 0, P); }
        BW.cyl(0, 2.9, 2.4, 0.07, 0.07, 3.4, cBlack, 'y', 0, 0, 1.2, P, G.cyl6); BW.box(0, 4.4, 2.4, 0.5, 0.6, 0.5, cGold, 5, 0, 0, P);
        va.set(0, 4.4, 2.4).applyMatrix4(P); addBulb(va.x, va.y, va.z, k % 2 ? C('#ff8a3a').multiplyScalar(3.4) : goldHDR, 2.3, 0, r2(0, TAU), lakeBulbs);
      });
      { const cSand = C('#a8946a'), base = B.nv, NS = 72;                       // a smooth rim of sand where the glass meets the flock (the ground mesh is too coarse to draw that line)
        for (let k = 0; k <= NS; k++) for (const rr of [1.012, 1.16]) { lakeXZ((k / NS) * TAU, rr, vc); B.p.push(vc.x, LY + (rr > 1.1 ? 0.5 : 0.04), vc.z); B.n.push(0, 1, 0); const kk = 0.8 + 0.2 * ((k * 7) % 5) / 4; B.c.push(cSand.r * kk, cSand.g * kk, cSand.b * kk); B.f.push(0, 0, 0.1); }
        B.nv += (NS + 1) * 2; for (let k = 0; k < NS; k++) { const a = base + k * 2; B.i.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); } }
      const bay = 10, n = Math.floor((S_BR1 - S_BR0) / bay);                   // a small bulb on every girder post, both sides
      for (let k = 0; k <= n; k++) { frameOf(pre, S_BR0 + k * bay, M); for (const sd of [-1, 1]) { if (sd < 0 && k % 4 === 2) continue; va.set(sd * 6.3, 1.25, 0).applyMatrix4(M); addBulb(va.x, va.y, va.z, C(k % 2 ? '#ffd98a' : '#ffb347').multiplyScalar(3), 1.5, 0, r2(0, TAU), lakeBulbs); BW.box(sd * 6.3, 1.2, 0, 0.4, 0.45, 0.4, cGold, 4, 0, 0, M); } }
      // flower beds: the station forecourt, the park, the lake shore under the wheel; and clipped hedges round the park and along the platform's back
      const petal = ['#ff5a6a', '#ffd040', '#ff8ad0', '#f4f0e0', '#c060ff', '#ff7a2a'].map(C);
      const bed = (x, z, w, d, yaw) => { const y = gAt(x, z), P = atY(x, y, z, yaw, 1); B.box(0, 0.25, 0, w, 0.5, d, C('#3a2a1c'), 0, 0, 0.1, P);
        for (let q = 0, nq = Math.round(w * d * 0.55); q < nq; q++) { M.compose(va.set(r2(-0.45, 0.45) * w, 0.75 + r2(0, 0.3), r2(-0.4, 0.4) * d), _q4.identity(), vb.set(0.42, 0.5, 0.42)).premultiply(P); B.add(G.cyl6, M, petal[(((q + Math.floor(x)) % 6) + 6) % 6], 0.25, 0, 0.6); } };
      for (let k = 0; k < 6; k++) bed(-228 + k * 11, 160.8, 6.5, 1.6, 0);
      for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + 0.5; bed(PARK.x + Math.cos(a) * 5.6, PARK.z + Math.sin(a) * 5, 3.6, 1.8, -a); }
      for (let k = 0; k < 7; k++) { lakeXZ(4.15 + k * 0.17, 1.2, vc); bed(vc.x, vc.z, 5, 2, -LAKE.rot + 0.2 * k); }
      const cHedge = [C('#3f6a34'), C('#356030'), C('#4a7a3a')];
      for (let k = 0; k < 14; k++) { if (k % 7 === 3) continue; const a = (k / 14) * TAU, x = PARK.x + Math.cos(a) * (PARK.r + 1.5), z = PARK.z + Math.sin(a) * (PARK.r - 0.5); B.box(x, gAt(x, z) + 0.9, z, 7.2, 2.2, 1.5, cHedge[k % 3], 0, 0, 0.15, null, -a + Math.PI / 2); }
      for (let x = -236; x < -166; x += 7) if (Math.abs(x + 196) > 14) B.box(x + 3.5, pre.pts[S_STATION].y + 1.2, 159.4, 7, 2.0, 1.2, cHedge[Math.abs(Math.round(x / 7)) % 3], 0, 0, 0.15);
    }
    await ctx.yield();
    // ------------------------------------------------------------ ground mesh (flock, roads, ballast, shore)
    {
      const NX = 144, NZ = 80, nv = (NX + 1) * (NZ + 1), gp = new Float32Array(nv * 3), gc = new Float32Array(nv * 3), gm = new Float32Array(nv * 3), lr = new Float32Array(nv);
      const fl = [cFlock.clone(), cFlock.clone().lerp(C('#8a8a3c'), 0.45), cFlock.clone().multiplyScalar(0.62), cFlock.clone().lerp(C('#2f5a3a'), 0.5)];
      const cRoad = C('#4c4a50'), cBallast = C('#6f675c'), cSand = C('#b8a070'), cRock = cUmber.clone().lerp(C('#8a7a68'), 0.55), col = new THREE.Color();
      const gl = bulbs.concat(lakeBulbs), nb = gl.length, bx = new Float32Array(nb), by = new Float32Array(nb), bz = new Float32Array(nb);   // every lamp lays its pool of light on the flock
      gl.forEach((b, i) => { bx[i] = b.x; by[i] = b.y; bz[i] = b.z; });
      const CS = 34, cw = Math.ceil((TB.x1 - TB.x0) / CS) + 2, ch = Math.ceil((TB.z1 - TB.z0) / CS) + 2, cellOf = (x, z) => clamp(Math.floor((x - TB.x0) / CS) + 1, 0, cw - 1) + cw * clamp(Math.floor((z - TB.z0) / CS) + 1, 0, ch - 1), cellsB = Array.from({ length: cw * ch }, () => []);
      for (let k = 0; k < nb; k++) if (bx[k] > TB.x0 - CS && bx[k] < TB.x1 + CS && bz[k] > TB.z0 - CS && bz[k] < TB.z1 + CS) cellsB[cellOf(bx[k], bz[k])].push(k);
      for (let j = 0; j <= NZ; j++) {
        for (let i = 0; i <= NX; i++) {
          const x = lerp(TB.x0, TB.x1, i / NX), z = lerp(TB.z0, TB.z1, j / NZ), o = (j * (NX + 1) + i) * 3, h = gAt(x, z), td = lastTrackD, rl = lakeR(x, z);
          gp[o] = x; gp[o + 1] = h; gp[o + 2] = z; lr[o / 3] = rl;
          const n1 = noise.fbm2(x * 0.03 + 11, z * 0.03 + nOff, 3), n2 = noise.n2(x * 0.09, z * 0.09 + nOff);
          col.copy(n2 > 0.3 ? fl[1] : n1 < -0.25 ? fl[2] : n1 > 0.3 ? fl[3] : fl[0]); let flock = 1, snow = winter ? 0.95 : 0;
          const road = (Math.abs(x - MILL_ST) < 4.4 && z < -45 && z > -241) || (Math.abs(x - ROAD_X) < 4.6 && z > 46 && z < 238) || ((Math.abs(z - 173) < 4 || Math.abs(z - 217) < 4) && x > -340 && x < -110) || (Math.abs(z - 97) < 3.6 && x > -322 && x < -122);
          const rocky = smoothstep(26, 44, h + 8 * n1) * 0.8;
          col.lerp(cRock, rocky); flock *= 1 - rocky;
          if (road && westHill(x, z) < 1) { col.copy(cRoad); flock = 0; snow *= 0.4; }
          if (td < 5.4) { col.copy(cBallast).multiplyScalar(0.85 + 0.3 * n2); flock = 0; snow *= 0.12; }
          if (rl < 1.2) { col.lerp(cSand, smoothstep(1.2, 1.08, rl)); flock *= smoothstep(1.08, 1.2, rl); snow *= smoothstep(1.05, 1.2, rl); col.multiplyScalar(lerp(0.03, 1, smoothstep(0.99, 1.035, rl))); }   // the bed under the glass is dark, so the coarse edge of the mesh does not show through the water
          let w = 0;
          { const c0 = cellOf(x, z), ci = c0 % cw, cj = (c0 - ci) / cw;
            for (let jj = Math.max(0, cj - 1); jj <= Math.min(ch - 1, cj + 1); jj++) for (let ii = Math.max(0, ci - 1); ii <= Math.min(cw - 1, ci + 1); ii++) { const cb = cellsB[jj * cw + ii];
              for (let q = 0; q < cb.length; q++) { const k = cb[q], dx = x - bx[k], dz = z - bz[k]; if (dx > 34 || dx < -34 || dz > 34 || dz < -34) continue; const dy = h - by[k], d2 = dx * dx + dy * dy + dz * dz; w += 0.9 / (1 + d2 * 0.02); } } }
          gc[o] = col.r; gc[o + 1] = col.g; gc[o + 2] = col.b; gm[o] = snow; gm[o + 1] = flock; gm[o + 2] = Math.min(w, 1.2);
          if (i === 48 || i === 96) await ctx.yield();
        }
        await ctx.yield();
      }
      const idx = [];
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
        const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
        if (Math.max(lr[a], lr[b], lr[c], lr[d]) < 0.985) continue;
        idx.push(a, c, b, b, c, d);
      }
      const gg = new THREE.BufferGeometry();
      await ctx.yield();
      gg.setAttribute('position', new THREE.BufferAttribute(gp, 3)); gg.setIndex(idx); await ctx.yield(); gg.computeVertexNormals(); await ctx.yield();
      gg.setAttribute('color', new THREE.BufferAttribute(gc, 3)); gg.setAttribute('aMat', new THREE.BufferAttribute(gm, 3));
      gg.applyMatrix4(T2H); await ctx.yield();
      const ground = new THREE.Mesh(gg, K.mtnMat); ground.name = 'table-landscape'; ground.frustumCulled = false; hero.object.add(ground);
    }
    await ctx.yield();

    // ------------------------------------------------------------ lichen and sponge trees, blossom trees in the park
    {
      const want = Math.round(340 * density * detail), more = Math.round(64 * density), trees = new THREE.InstancedMesh(K.treeGeo, K.tinMat, want + more + 10 + 30), tc = new THREE.Color(), tr = rng.fork('trees');
      const lich = [cFlock.clone().multiplyScalar(1.5), cFlock.clone().lerp(C('#9aa04a'), 0.6).multiplyScalar(1.3), cFlock.clone().lerp(C('#2f5a3a'), 0.6), C('#a8743a'), C('#7e8f4a')];
      const frost = (c) => (winter ? c.lerp(cSnow, 0.55) : c);
      let nt = 0;
      const put = (x, z, sc, c) => {
        const yaw = tr.range(0, TAU), ys = tr.range(0.85, 1.25), dT = distTrack(x, z);
        if (dT < 12.5) return;                                         // nothing bushy right beside the driver's eye
        if (dT < 40) sc = Math.min(sc, 0.95);
        M.compose(va.set(x, gAt(x, z) - 0.2, z), _q4.setFromAxisAngle(UP, yaw), vb.set(sc, sc * ys, sc)).premultiply(T2H); trees.setMatrixAt(nt, M); trees.setColorAt(nt, c); nt++;
      };
      for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU + 0.3; put(PARK.x + Math.cos(a) * 10.5, PARK.z + Math.sin(a) * 9, tr.range(0.8, 1.05), tc.set(k % 3 ? '#ff9fc0' : '#ffe6ee').multiplyScalar(tr.range(0.8, 1.1))); }
      { const t0 = taken.length; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const x = -151 + i * 9.5 + (j % 2) * 3, z = -8 + j * 8.4; put(x, z, 0.8 + 0.25 * ((i * 3 + j * 5) % 4) / 3, tc.set((i + j) % 3 ? '#ffb0cc' : '#fff0f4').multiplyScalar(0.85 + 0.1 * ((i + 2 * j) % 3))); } }   // the orchard in blossom, in rows
      for (let tries = 0; tries < 900 && nt < want; tries++) {
        const cx = tr.range(TB.x0 + 8, TB.x1 - 8), cz = tr.range(TB.z0 + 8, TB.z1 - 8), cc = tr.pick(lich), m = tr.int(2, 6);
        for (let k = 0; k < m && nt < want; k++) {
          const x = cx + tr.range(-7, 7), z = cz + tr.range(-7, 7);
          if (!inTable(x, z, 5) || lakeR(x, z) < 1.14 || distTrack(x, z) < 9.5 || Math.hypot(x - HERO_POS.x, z - HERO_POS.z) < 123 || !free(x, z, 2.6)) continue;
          if (Math.abs(x - ROAD_X) < 7 || ((Math.abs(z - 173) < 6 || Math.abs(z - 217) < 6 || Math.abs(z - 97) < 6) && x > -340 && x < -110)) continue;
          put(x, z, tr.range(0.75, 1.35), frost(tc.copy(cc)).multiplyScalar(tr.range(0.75, 1.15)));
        }
        if ((tries & 7) === 7) await ctx.yield();
      }
      for (let k = 0, tries = 0; k < more && tries < 500; tries++) {                              // sponge trees crowding the foot of the trestle approach
        const sp = pre.pts[Math.floor(tr.range(S_BR1 + 8, S_EDGE - 4))], a = tr.range(0, TAU), rr = tr.range(11, 34), x = sp.x + Math.cos(a) * rr, z = sp.z + Math.sin(a) * rr;
        if (!inTable(x, z, 5) || lakeR(x, z) < 1.14 || distTrack(x, z) < 9.5 || Math.hypot(x - HERO_POS.x, z - HERO_POS.z) < 123 || !free(x, z, 2.6)) continue;
        put(x, z, tr.range(0.8, 1.5), frost(tc.copy(tr.pick(lich))).multiplyScalar(tr.range(0.75, 1.15))); k++;
        if ((tries & 15) === 15) await ctx.yield();
      }
      trees.count = Math.min(nt, want + more + 40); trees.instanceMatrix.needsUpdate = true; trees.instanceColor.needsUpdate = true; trees.frustumCulled = false; trees.name = 'layout-trees'; hero.object.add(trees);
    }
    await ctx.yield();
    // clumps of bristle grass standing out of the flock (and out of the snow in winter)
    {
      const TG = new Batch(), blade = new THREE.ConeGeometry(1, 1, 3, 1, true), gr = rng.fork('grass'); blade.translate(0, 0.5, 0);
      for (let b = 0; b < 6; b++) { const a = b * 1.047 + 0.31 * b * b, ln = 0.22 + 0.13 * (b % 3); M.compose(va.set(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3), _q4.setFromEuler(_e.set(Math.sin(a) * ln, 0, -Math.cos(a) * ln)), vb.set(0.15, 2.1 + 0.6 * (b % 3), 0.15)); TG.add(blade, M, C('#ffffff'), 0, 1, 0); }
      blade.dispose();
      const nG = Math.round(1000 * density * detail), tufts = new THREE.InstancedMesh(TG.build(), K.tinMat, nG), gc = new THREE.Color();
      const gcols = ['#b8a258', '#8f9a4a', '#6f7f3a', '#c9b878', '#55703a'].map((h) => (winter ? C(h).lerp(cSnow, 0.3) : C(h)));
      let ng = 0;
      for (let tries = 0; tries < 700 && ng < nG; tries++) {
        let cx, cz;
        if (tries % 3 === 0) { const sp = pre.pts[Math.floor(gr.range(S_BR1 - 40, S_EDGE - 4))], a = gr.range(0, TAU), rr = gr.range(8, 60); cx = sp.x + Math.cos(a) * rr; cz = sp.z + Math.sin(a) * rr; }
        else { cx = gr.range(TB.x0 + 8, TB.x1 - 8); cz = gr.range(TB.z0 + 8, TB.z1 - 8); }
        const m = gr.int(3, 7), col = gr.pick(gcols);
        if (!inTable(cx, cz, 6) || lakeR(cx, cz) < 1.2 || distTrack(cx, cz) < 7 || Math.hypot(cx - HERO_POS.x, cz - HERO_POS.z) < 121 || westHill(cx, cz) > 30) continue;
        if (Math.abs(cx - ROAD_X) < 7 || ((Math.abs(cz - 173) < 6 || Math.abs(cz - 217) < 6 || Math.abs(cz - 97) < 6) && cx > -340 && cx < -110)) continue;
        for (let k = 0; k < m && ng < nG; k++) {
          const x = cx + gr.range(-4, 4), z = cz + gr.range(-4, 4), sc = gr.range(0.7, 1.5);
          if (!free(x, z, 1.2)) continue;
          M.compose(va.set(x, gAt(x, z) - 0.15, z), _q4.setFromAxisAngle(UP, gr.range(0, TAU)), vb.set(sc, sc * gr.range(0.8, 1.3), sc)).premultiply(T2H);
          tufts.setMatrixAt(ng, M); tufts.setColorAt(ng, gc.copy(col).multiplyScalar(gr.range(0.7, 1.15))); ng++;
        }
        if ((tries & 15) === 15) await ctx.yield();
      }
      tufts.count = ng; tufts.instanceMatrix.needsUpdate = true; if (tufts.instanceColor) tufts.instanceColor.needsUpdate = true; tufts.frustumCulled = false; tufts.name = 'bristle-grass'; hero.object.add(tufts);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the attic: floorboards, roof, rafters, gables, the oculus
    const cWoodA = C('#8a6a50'), cWoodB = C('#7a6048'), cWoodC = C('#6e563f'), cSheet = C('#8d887c');
    const pivot = V3(HERO_POS.x, roofY(HERO_POS.z) - 8, HERO_POS.z);            // where the airship's thread is tied
    {
      const L = AT.x1 - AT.x0 + 8, ang = Math.atan2(AT.ridge - AT.knee, AT.half), sl = Math.hypot(AT.ridge - AT.knee, AT.half) + 6;
      A.box(0, FLOOR_Y - 2, AT.zc, L, 4, AT.half * 2 + 8, cWoodC, 0, 0, 1);
      for (const sd of [-1, 1]) {
        rb(A, null, 0, (AT.knee + AT.ridge) / 2 + 2, AT.zc + sd * AT.half / 2, L, 3, sl, sd * ang, 0, cWoodB, 0, 1);
        A.box(0, (FLOOR_Y + AT.knee) / 2, AT.zc + sd * (AT.half + 1.5), L, AT.knee - FLOOR_Y, 3, cWoodB, 0, 0, 1);
        for (const d of [200, 322]) A.box(0, roofY(AT.zc + d) - 7, AT.zc + sd * d, L, 7, 7, cWoodA, 0, 0, 0);
        A.box(sd * (AT.x1 + 2), (FLOOR_Y + AT.ridge) / 2, AT.zc, 3, AT.ridge - FLOOR_Y, AT.half * 2, cWoodB, 0, 0, 1);
      }
      A.box(0, AT.ridge - 6, AT.zc, L, 9, 7, cWoodA, 0, 0, 0);
      for (let x = AT.x0 + 40; x < AT.x1; x += 60) {
        for (const sd of [-1, 1]) A.beam(va.set(x, AT.knee - 4, AT.zc + sd * (AT.half - 3)), vb.set(x, AT.ridge - 7, AT.zc), 8, cWoodA, null, 0);
        const cy = 232; A.beam(va.set(x, cy, AT.zc - 139), vb.set(x, cy, AT.zc + 139), 7, cWoodA, null, 0);
        A.beam(va.set(x, cy, AT.zc), vb.set(x, AT.ridge - 8, AT.zc), 5, cWoodA, null, 0);
      }
      const torus = new THREE.TorusGeometry(OC_R + 3, 4.5, 8, 40);
      A.add(torus, M.makeRotationY(Math.PI / 2).setPosition(OCULUS.x - 1, OCULUS.y, OCULUS.z), cWoodA, 0, 0, 0); torus.dispose();
      A.box(OCULUS.x - 1.5, OCULUS.y, OCULUS.z, 2.4, OC_R * 2, 3.4, cWoodC, 0, 0, 0); A.box(OCULUS.x - 1.5, OCULUS.y, OCULUS.z, 2.4, 3.4, OC_R * 2, cWoodC, 0, 0, 0);
      for (let k = 0; k < 170; k++) {                                 // nail holes in the roof that pass for stars
        const x = rng.range(AT.x0 + 20, AT.x1 - 20), d = rng.range(-AT.half + 30, AT.half - 30);
        addBulb(x, roofY(AT.zc + d) - 2.5, AT.zc + d, C(look.disc).multiplyScalar(rng.range(1.2, 3.2)), rng.range(0.5, 1.1));
      }
      // the table itself
      for (const sd of [-1, 1]) { A.box(0, -6.5, sd * (TB.z1 + 1.6), 906, 15, 3.2, cWoodA, 0, 0, 1); A.box(sd * (TB.x1 + 1.6), -6.5, 0, 3.2, 15, 500, cWoodA, 0, 0, 1); }
      for (const lx of [-410, 0, 410]) for (const lz of [-215, 215]) { A.box(lx, -47, lz, 24, 66, 24, cWoodC, 0, 0, 0); A.box(lx, FLOOR_Y + 5, lz, 32, 10, 32, cWoodC, 0, 0, 0); }
      for (const lz of [-215, 215]) A.box(0, -52, lz, 800, 12, 8, cWoodC, 0, 0, 0);
    }

    await ctx.yield();
    // dust-sheeted furniture: noise-draped lumps, plus trunks, the grandfather clock and the dressmaker's dummy
    const fr = rng.fork('furniture');
    async function sheeted(x, z, w, h, d, yaw) {
      // a sheet thrown over furniture: the cloth hangs in deep folds that widen toward the floor, sags between the
      // high points (a chair back, a cornice, a finial) and pools out in a scalloped hem
      let g = new THREE.BoxGeometry(w, h, d, 20, 10, 14);
      { const g0 = g, P0 = g0.attributes.position, I0 = g0.index.array, map = new Map(), remap = new Uint32Array(P0.count), out = []; let nw = 0;    // welded, so the folds shade as one cloth
        for (let i = 0; i < P0.count; i++) { const x = P0.getX(i), y = P0.getY(i), z = P0.getZ(i), key = (Math.round((x / w + 0.5) * 20) * 64 + Math.round((y / h + 0.5) * 10)) * 64 + Math.round((z / d + 0.5) * 14); let j = map.get(key); if (j === undefined) { j = nw++; map.set(key, j); out.push(x, y, z); } remap[i] = j; }
        const idx = new Uint32Array(I0.length); for (let i = 0; i < I0.length; i++) idx[i] = remap[I0[i]];
        g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g0.dispose(); }
      await ctx.yield();
      const P = g.attributes.position, ph = fr.range(0, 50), k1 = fr.int(5, 9);
      const pkA = [fr.range(-0.36, -0.2) * w, fr.range(-0.3, 0.3) * d, fr.range(0.05, 0.11) * h], pkB = [fr.range(0.2, 0.36) * w, fr.range(-0.3, 0.3) * d, fr.range(0.0, 0.08) * h];
      for (let i = 0; i < P.count; i++) {
        let px = P.getX(i), py = P.getY(i) + h / 2, pz = P.getZ(i); const t = clamp(py / h, 0, 1), a = Math.atan2(pz / d, px / w);
        const per = (Math.abs(px) / w > Math.abs(pz) / d ? pz : px) * 0.12 + (px > 0 ? 3 : 0) + (pz > 0 ? 7 : 0);      // distance round the outline
        const hang = Math.pow(1 - t, 0.7) * smoothstep(1, 0.86, t);
        const foldA = (5.5 * Math.sin(per * 1.6 + ph + 0.7 * noise.n2(per * 0.4 + ph, py * 0.012)) + 1.0 * noise.n3(px * 0.07 + ph, py * 0.02, pz * 0.07)) * hang;   // long hanging flutes, not lumps
        let k = 1 + 0.22 * Math.pow(1 - t, 1.5) + 0.07 * Math.sin(a * k1 + ph) * (1 - t) + 0.05 * noise.n3(px * 0.03 + ph, py * 0.02, pz * 0.03);
        if (t > 0.78) k *= 1 - 0.16 * Math.pow((t - 0.78) / 0.22, 2);
        const rl = Math.hypot(px, pz) + 1e-3; k += foldA / rl;
        px *= k; pz *= k; py -= h * 0.05 * (0.5 + 0.5 * noise.n2(px * 0.025 + ph, pz * 0.025)) * smoothstep(0.6, 1, t) * (1 - Math.min(1, Math.hypot(px / w, pz / d) * 1.6));
        const up = smoothstep(0.55, 1, t);
        py += up * (pkA[2] * Math.exp(-((px - pkA[0]) ** 2 + (pz - pkA[1]) ** 2) / (w * w * 0.012 + 60)) + pkB[2] * Math.exp(-((px - pkB[0]) ** 2 + (pz - pkB[1]) ** 2) / (w * w * 0.012 + 60)));
        P.setXYZ(i, px, py, pz);
        if ((i & 511) === 511) await ctx.yield();
      }
      await ctx.yield(); g.computeVertexNormals(); await ctx.yield(); A.add(g, atY(x, FLOOR_Y, z, yaw, 1), cSheet.clone().multiplyScalar(fr.range(0.8, 1.1)), 0, 1, 0); g.dispose();
    }
    const tWard = (-560 - shaftPT.x) / moonDirT.x, wardP = shaftPT.clone().addScaledVector(moonDirT, tWard);
    await sheeted(-578, wardP.z, 64, 205, 128, fr.range(-0.08, 0.08));                                   // the wardrobe where the moon pools
    const lumps = [[-610, 40, 96, 118, 74], [-525, -160, 74, 98, 74], [-640, -90, 112, 168, 62], [420, -322, 124, 96, 52], [655, -200, 104, 212, 72], [612, 252, 92, 178, 82], [505, 335, 132, 106, 72], [-255, 352, 152, 88, 70], [-430, 345, 82, 150, 70], [-90, -325, 90, 70, 50]];
    await ctx.yield();
    for (const l of fr.shuffle(lumps).slice(0, 7 + fr.int(0, 3))) { await sheeted(l[0] + fr.range(-18, 18), l[1], l[2] * fr.range(0.85, 1.15), l[3] * fr.range(0.9, 1.08), l[4], fr.range(-0.3, 0.3)); await ctx.yield(); }
    const cTrunk = [C('#7a4a30'), C('#5a4a3a'), C('#3a5248')];
    const trunk = (x, y0, z, w, h, d, yaw, c) => {
      const P = atY(x, y0, z, yaw, 1); A.box(0, h / 2, 0, w, h, d, c, 0, 0, 0.4, P); A.box(0, h * 0.72, 0, w + 1.2, 1.6, d + 1.2, c.clone().multiplyScalar(0.6), 0, 0, 0, P);
      for (const sx of [-0.3, 0.3]) A.box(sx * w, h / 2, 0, 4, h + 1, d + 1, C('#6a5030'), 0, 0, 0, P);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const sy of [0.04, 0.96]) A.box(sx * w / 2, sy * h, sz * d / 2, 5, 5, 5, cBrass.clone().multiplyScalar(0.7), 0, 0, 0, P);
    };
    trunk(250, FLOOR_Y, 368, 124, 50, 74, 0.06, cTrunk[0]); trunk(246, FLOOR_Y + 50, 364, 98, 45, 62, -0.08, cTrunk[1]);
    trunk(LAMP.x, FLOOR_Y, LAMP.z + 4, 72, 80, 58, 0.2, cTrunk[2]); trunk(160, FLOOR_Y, 392, 90, 40, 60, -0.3, cTrunk[1]);
    {                                                              // against the east gable, under the round window: a ladder, stacked trunks, old picture frames
      for (const sd of [-1, 1]) A.beam(va.set(628, FLOOR_Y, -52 + sd * 11), vb.set(697, 118, -52 + sd * 11), 4.2, cWoodA, null, 0);
      for (let k = 1; k <= 12; k++) { const f = k / 13; A.beam(va.set(lerp(628, 697, f), lerp(FLOOR_Y, 118, f), -63), vb.set(lerp(628, 697, f), lerp(FLOOR_Y, 118, f), -41), 2.6, cWoodB, null, 0); }
      trunk(650, FLOOR_Y, -116, 62, 44, 92, Math.PI / 2 + 0.06, cTrunk[0]); trunk(655, FLOOR_Y + 44, -112, 50, 36, 72, Math.PI / 2 - 0.1, cTrunk[2]); trunk(652, FLOOR_Y + 80, -118, 38, 28, 50, Math.PI / 2 + 0.2, cTrunk[1]);
      const gilt = C('#8a6a2c'), canv = ['#2e2a26', '#3a3028', '#28303a'].map(C);
      [[150, 96, 70], [176, 74, 56], [199, 58, 42], [-176, 110, 76]].forEach(([fz, fh, fw], k) => {
        const P = new THREE.Matrix4().makeRotationZ(-0.2 - 0.03 * k).setPosition(688 - k * 5 - fh * 0.1, FLOOR_Y, fz);
        A.box(0, fh / 2, 0, 3.4, fh, fw, gilt, 0, 0, 0, P); A.box(-1.9, fh / 2, 0, 0.6, fh - 12, fw - 12, canv[k % 3], 0, 0, 0.4, P);
      });
    }
    // ------------------------------------------------------------ the attic's own lights: somebody strung the Christmas lights along the purlins and the collar ties and left
    // paper lanterns standing about the floor. All of it is dark until the trestle (uFairyI and the points' own glow follow the reveal), so the town's black sky keeps its secret.
    let _sF = 0x51f15e;
    const r3 = (a = 0, b = 1) => { _sF = (Math.imul(_sF, 1664525) + 1013904223) >>> 0; return a + (b - a) * (_sF / 4294967296); };   // its own little generator: nothing else's draws move
    const fairy = [], FAIRY = ['#ff5a3c', '#ffc23a', '#58e088', '#5a9cff', '#ff78d0', '#fff0c4'].map((h) => C(h).multiplyScalar(3.0)), cWire = C('#0c0a09');
    const fBulb = (x, y, z, c, size) => fairy.push({ x, y, z, c, size, kind: 0, phase: r3(0, TAU), speed: r3(0.6, 1.4) });
    const swag = (ax, ay, az, bx, by, bz, n, sag, k0, size = 4.4, wire = true) => {       // a wire hanging between two fixings with n coloured bulbs on it
      let px = ax, py = ay, pz = az;
      for (let k = 1; k <= n + 1; k++) {
        const t = k / (n + 1), x = lerp(ax, bx, t), y = lerp(ay, by, t) - sag * Math.sin(t * Math.PI), z = lerp(az, bz, t);
        if (wire && (k % 2 === 0 || k === n + 1)) { A.beam(va.set(px, py, pz), vb.set(x, y, z), 0.6, cWire, null, 0); px = x; py = y; pz = z; }
        if (k <= n) fBulb(x, y - 1.4, z, FAIRY[(k0 + k) % 6], size * r3(0.85, 1.15));
      }
    };
    const PUR_Y = roofY(AT.zc + 200) - 12, LOW_Y = roofY(AT.zc + 322) - 12, lantL = [];
    {
      let k0 = 0;
      for (let x = AT.x0 + 40; x < AT.x1 - 60; x += 60, k0 += 3) {
        for (const sd of [-1, 1]) swag(x, PUR_Y, AT.zc + sd * 200, x + 60, PUR_Y, AT.zc + sd * 200, detail < 0.8 ? 3 : 5, 9 + 3 * r3(), k0 + (sd > 0 ? 2 : 0));   // along both long purlins
        for (const sd of [-1, 1]) swag(x, LOW_Y, AT.zc + sd * 322, x + 60, LOW_Y, AT.zc + sd * 322, detail < 0.8 ? 3 : 4, 7 + 3 * r3(), k0 + (sd > 0 ? 4 : 1), 4.4, false);                // and the low ones along the eaves
        if (((x - AT.x0 - 40) / 60) % 2 === 1 || x > 150) swag(x, 228, AT.zc - 136, x, 228, AT.zc + 136, detail < 0.8 ? 7 : 11, 16 + 6 * r3(), k0 + 1, 4.8);      // across the collar ties: every tie over the mountain, every other one down the room
      }
      for (let k = 0; k < 30; k++) { const a = k / 30 * TAU; fBulb(OCULUS.x - 7, OCULUS.y + Math.sin(a) * (OC_R + 11), OCULUS.z + Math.cos(a) * (OC_R + 11), FAIRY[k % 6], 5.2); }   // a garland round the moon window
      // lanterns on the floorboards: a tin storm lantern with a paper body, and two little coloured ones beside it
      const cTin = C('#2a2622'), paper = ['#ffb347', '#ff6a4a', '#7ad0ff', '#ffd98a', '#8ae07a'].map(C);
      const lantern = (x, z, h, c, e) => {
        const w = h * 0.5; A.box(x, FLOOR_Y + h * 0.06, z, w * 1.2, h * 0.12, w * 1.2, cTin, 0, 0, 0); A.box(x, FLOOR_Y + h * 0.5, z, w, h * 0.76, w, c, -e, 0, 0);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) A.box(x + sx * w * 0.52, FLOOR_Y + h * 0.5, z + sz * w * 0.52, w * 0.09, h * 0.8, w * 0.09, cTin, 0, 0, 0);
        for (const f of [0.3, 0.5, 0.7]) A.box(x, FLOOR_Y + h * f, z, w * 1.06, h * 0.025, w * 1.06, cTin, 0, 0, 0);
        A.box(x, FLOOR_Y + h * 0.92, z, w * 1.3, h * 0.08, w * 1.3, cTin, 0, 0, 0); A.box(x, FLOOR_Y + h * 1.0, z, w * 0.6, h * 0.1, w * 0.6, cTin, 0, 0, 0);
        fBulb(x, FLOOR_Y + h * 0.55, z, c.clone().multiplyScalar(2.6), h * 0.36);
      };
      // [x, z, pool strength]: off the table's east edge below the mill, under the moon window, before the dolls' house, the north floor by the dummy, south by the clock and the trunks
      for (const [x, z, w] of [[520, -215, 1.0], [592, -40, 0.9], [556, 216, 1.0], [300, -338, 0.9], [112, 338, 0.9]]) {
        lantern(x, z, 34, paper[0], 2.4); lantern(x + 26, z + 14, 20, paper[1 + lantL.length % 4], 2.0); lantern(x - 12, z + 27, 15, paper[1 + (lantL.length + 2) % 4], 2.0);
        lantL.push(new THREE.Vector4(x + 4, FLOOR_Y + 24, z + 8, w));
      }
    }
    await ctx.yield();
    {                                                              // the dolls' house against the east gable, south of the round window: somebody left its lamps burning
      const P = atY(652, FLOOR_Y, 112, -Math.PI / 2, 1), cBrick = C('#7c3f36'), cTrim = C('#b9b09c'), cSlate = C('#3c4352'), wc = ['#ffc65a', '#ffd98a', '#ffb347', '#ffe2a8'].map(C);
      A.box(0, 4, 0, 168, 8, 76, cWoodC, 0, 0, 0.4, P); A.box(0, 84, 0, 152, 152, 62, cBrick, 0, 0, 0.5, P); A.box(0, 162, 0, 160, 5, 70, cTrim, 0, 0, 0, P);
      for (const [w, h, d, y] of [[150, 16, 60, 172], [124, 12, 44, 186]]) A.box(0, y, 0, w, h, d, cSlate, 0, 0, 0.3, P);
      for (const cx of [-52, 52]) { A.box(cx, 198, 0, 13, 22, 13, cBrick, 0, 0, 0.5, P); A.box(cx, 210, 0, 16, 3, 16, cTrim, 0, 0, 0, P); }
      for (let f = 0; f < 4; f++) {
        const wy = 30 + f * 36; A.box(0, wy - 15, 31.6, 152, 2.2, 2, cTrim, 0, 0, 0, P);
        for (let k = 0; k < 5; k++) {
          const wx = -58 + k * 29; if (f === 0 && k === 2) continue;
          const lit = r2() < 0.74, c = wc[(f * 3 + k) % 4];
          A.box(wx, wy, 31.3, 15, 21, 0.8, c, lit ? 2.3 : 0.06, 0, 0, P); A.box(wx, wy, 31.9, 1.1, 21, 0.6, cTrim, 0, 0, 0, P); A.box(wx, wy + 1, 31.9, 15, 1.1, 0.6, cTrim, 0, 0, 0, P); A.box(wx, wy - 11.6, 32.4, 19, 2, 3, cTrim, 0, 0, 0, P);
          if (lit && (f + k) % 2 === 0) { va.set(wx, wy, 33.5).applyMatrix4(P); addBulb(va.x, va.y, va.z, c.clone().multiplyScalar(1.6), 6.5, 0, r2(0, TAU)); }
        }
      }
      A.box(0, 24, 31.6, 17, 32, 1.4, C('#24382c'), 0, 0, 0.3, P); A.box(0, 44, 31.8, 17, 7, 1, wc[1], 2.6, 0, 0, P); A.box(0, 6, 36, 30, 4, 10, cTrim, 0, 0, 0, P);
      for (const sx of [-12, 12]) A.cyl(sx, 26, 36, 2, 2, 40, cTrim, 'y', 0, 0, 0, P, G.cyl6);
      A.box(0, 48, 36, 32, 4, 10, cTrim, 0, 0, 0, P); va.set(0, 40, 40).applyMatrix4(P); addBulb(va.x, va.y, va.z, goldHDR, 7, 0, r2(0, TAU));
      for (let k = 0; k < 3; k++) { A.box(-30 + k * 30, 180, 23, 12, 13, 3, cSlate, 0, 0, 0.3, P); A.box(-30 + k * 30, 180, 24.7, 7, 8, 0.6, wc[k], k === 1 ? 0.06 : 2.2, 0, 0, P); }
      await ctx.yield();
      // its paint (printed tin over the wooden carcass, lit by the lanterns standing before it): brick courses above a cream ground floor, quoins, green shutters,
      // window boxes in flower, a red door under a balcony, ivy up one corner, people at the windows, fairy lights under the eaves and down the corners
      {
        const pe = 0.42, cBr = C('#9a4a3c'), cCream = C('#d8c9a4'), cShut = ['#3f7a52', '#3a5f9a', '#3f7a52', '#8a3a44'].map(C), cFl = ['#ff6a8a', '#ffd04a', '#ff5a3c', '#f4f0ff', '#c070ff'].map(C), cIvy = ['#4F6B3A', '#3d5a30', '#5f8040'].map(C);
        B.box(0, 99.5, 31.05, 152, 121, 0.3, cBr, pe, 0, 1.0, P); B.box(0, 23.5, 31.05, 152, 31, 0.3, cCream, pe * 0.8, 0, 0.3, P);
        for (let k = 0; k < 5; k++) B.box(0, 12 + k * 6, 31.25, 152, 0.7, 0.2, cCream.clone().multiplyScalar(0.55), pe * 0.5, 0, 0, P);                      // rusticated joints
        for (const sx of [-1, 1]) for (let k = 0; k < 19; k++) B.box(sx * (74.5 - (k & 1 ? 1.5 : 0)), 12 + k * 8, 31.4, k & 1 ? 6 : 9, 6.4, 0.8, cCream, pe, 0, 0.3, P);   // quoins
        for (let f = 0; f < 4; f++) for (let k = 0; k < 5; k++) {
          const wx = -58 + k * 29, wy = 30 + f * 36; if (f === 0 && k === 2) continue;
          for (const sx of [-1, 1]) { B.box(wx + sx * 10.2, wy, 31.7, 4.6, 21, 0.7, cShut[f], pe, 0, 0.3, P); }
          B.box(wx, wy - 12.6, 34.4, 17, 3, 3.4, C('#6a4a30'), pe * 0.6, 0, 0.3, P);
          for (let q = 0; q < 5; q++) B.box(wx - 6.4 + q * 3.2, wy - 10.4 + (q & 1), 34.6, 2.4, 2.4, 2.6, q % 3 === 1 ? cIvy[q % 3] : cFl[(f * 2 + k + q) % 5], q % 3 === 1 ? pe : 1.1, 0, 0, P);
          if ((f * 5 + k * 3) % 4 === 1) { B.box(wx - 2, wy - 5.5, 32.0, 4.6, 9.5, 0.3, cSoot, 0, 0, 0, P); B.box(wx - 2, wy + 1, 32.0, 3.4, 3.6, 0.3, cSoot, 0, 0, 0, P); }       // somebody at the window
          if ((f * 5 + k * 3) % 7 === 3) { B.box(wx + 3, wy - 7.5, 32.0, 6, 5.5, 0.3, cSoot, 0, 0, 0, P); B.box(wx + 5.4, wy - 3.6, 32.0, 1.2, 2.6, 0.3, cSoot, 0, 0, 0, P); B.box(wx + 1.2, wy - 3.6, 32.0, 1.2, 2.6, 0.3, cSoot, 0, 0, 0, P); }   // and a cat
        }
        B.box(0, 22, 32.5, 13, 28, 0.7, C('#b5202a'), 0.7, 0, 0.3, P); B.box(4, 21, 33, 1.3, 1.3, 0.6, cBrass, 1.4, 0, 2, P);                               // the red front door
        B.box(0, 51.5, 38, 46, 2, 13, cCream, pe, 0, 0.3, P); B.box(0, 59, 44, 46, 1.2, 1, cCream, pe, 0, 0.3, P);                                           // the balcony over the porch
        for (let k = 0; k <= 10; k++) B.box(-22.5 + k * 4.5, 55.5, 44, 1, 7, 1, cCream, pe, 0, 0.3, P);
        for (const sx of [-1, 1]) { B.box(sx * 22.5, 55.5, 38, 1, 7, 12, cCream, pe, 0, 0.3, P); B.box(sx * 17, 56.5, 40, 6, 6, 6, cIvy[0], pe, 0, 0, P); B.box(sx * 17, 61, 40, 4, 4, 4, cFl[sx > 0 ? 0 : 1], 1.1, 0, 0, P); }
        for (let k = 0; k < 26; k++) { const t = k / 25, x = -74 + 20 * Math.sin(t * 2.4) * t + 5 * Math.sin(k * 2.1), y = 10 + t * 142, s = 5 + 4 * Math.abs(Math.sin(k * 1.7)); B.box(x, y, 31.9 + (k % 3) * 0.5, s * 1.5, s, 1.2, cIvy[k % 3], pe * 0.9, 0, 0, P); }   // ivy up the north corner
        for (const sx of [-1, 1]) { B.cyl(sx * 40, 16, 50, 1, 1, 26, cBlack, 'y', 0, 0, 1, P, G.cyl6); B.box(sx * 40, 31, 50, 4, 5, 4, cGold, 4, 0, 0, P); va.set(sx * 40, 31, 52).applyMatrix4(P); fBulb(va.x, va.y, va.z, goldHDR, 6);       // two street lamps and two clipped bays on the plinth
          B.cyl(sx * 62, 11, 46, 3, 3, 6, C('#8a4a30'), 'y', pe, 0, 0.3, P, G.cyl6); B.box(sx * 62, 22, 46, 9, 16, 9, cIvy[1], pe, 0, 0, P); B.box(sx * 62, 32, 46, 6, 6, 6, cIvy[2], pe, 0, 0, P); }
        B.box(0, 8.3, 20, 166, 0.6, 74, C('#4F6B3A'), pe * 0.7, 0, 0, P);                                                                                   // a flocked lawn on the plinth
        B.box(0, 194.5, 0, 126, 1.6, 4, C('#b5202a'), pe, 0, 0.3, P); for (let k = 0; k < 9; k++) B.box(-56 + k * 14, 197, 0, 2, 4, 2, cGold, 1.5, 0, 2, P);        // ridge cresting
        for (const cx of [-52, 52]) for (const sx of [-3.5, 3.5]) B.cyl(cx + sx, 215, 0, 2.2, 2.2, 7, C('#b0583c'), 'y', pe, 0, 0.3, P, G.cyl6);            // chimney pots
        for (let k = 0; k < 21; k++) { const t = k / 20; va.set(-78 + t * 156, 158 - 5 * Math.abs(Math.sin(t * Math.PI * 4)), 36).applyMatrix4(P); fBulb(va.x, va.y, va.z, FAIRY[k % 6], 3.4); }   // fairy lights under the eaves
        for (const sx of [-1, 1]) for (let k = 0; k < 9; k++) { va.set(sx * 79, 14 + k * 16, 34).applyMatrix4(P); fBulb(va.x, va.y, va.z, FAIRY[(k + (sx > 0 ? 3 : 0)) % 6], 3.0); }
      }
    }
    await ctx.yield();
    {                                                              // the nursery's things left out on the boards under the moon window: a faded rug, a parade of skittle soldiers, their drum
      const RP = atY(540, FLOOR_Y, 24, 0.08, 1), rugC = [C('#7a2a2a'), C('#c9b48a'), C('#2a3c66'), C('#8a3a2a'), C('#c9973a')];
      [[170, 118], [154, 102], [146, 94], [112, 60], [104, 52]].forEach(([w, d], k) => A.box(0, 0.3 + k * 0.12, 0, w, 0.5, d, rugC[k], -0.1, 0.6, 0, RP));
      for (let k = 0; k < 7; k++) for (const sz of [-1, 1]) A.box(-54 + k * 18, 1.0, sz * 37, 9, 0.4, 9, rugC[k & 1 ? 4 : 1], -0.16, 0.6, 0, RP, Math.PI / 4);      // a row of lozenges down each long side
      for (const sx of [-1, 1]) for (let k = 0; k < 20; k++) A.box(sx * 88, 0.3, -56 + k * 5.9, 7, 0.4, 1.6, rugC[1], -0.1, 0.6, 0, RP);                          // the fringe
      const cCoat = C('#b5202a'), cTrou = C('#22305a'), cSkin = C('#e2b48e'), se = 0.34;
      const soldier = (x, z, yaw, h) => {
        const P = atY(x, FLOOR_Y + 0.9, z, yaw, h / 30);
        B.cyl(0, 1, 0, 5.4, 5.4, 2, cBlack, 'y', 0, 0, 1, P, G.cyl6); B.cyl(0, 6.5, 0, 3.6, 3.6, 9, cTrou, 'y', se, 0, 0.3, P, G.cyl6); B.cyl(0, 16.5, 0, 4.6, 4.6, 11, cCoat, 'y', se, 0, 0.3, P, G.cyl6);
        B.box(0, 12.2, 0, 9.6, 1.4, 9.6, cWhite, se, 0, 0.3, P); rb(B, P, 0, 17.4, 4.3, 7.4, 1.2, 0.5, 0, 0.78, cWhite, se, 0.3); rb(B, P, 0, 17.4, 4.3, 7.4, 1.2, 0.5, 0, -0.78, cWhite, se, 0.3);   // belt and cross-straps
        for (const sx of [-1, 1]) { B.box(sx * 5.4, 16, 0, 2, 9, 2.6, cCoat, se, 0, 0.3, P); B.box(sx * 5.4, 21.6, 0, 3.4, 1.4, 3.6, cGold, 1.2, 0, 2, P); }
        B.box(0, 24.6, 0, 5.4, 5.2, 5.4, cSkin, se, 0, 0.3, P); B.cyl(0, 30.4, 0, 3.2, 3.2, 6.4, cBlack, 'y', 0.02, 0, 1, P, G.cyl6); B.box(0, 28, 2.2, 6, 0.8, 3.6, cBlack, 0, 0, 1, P); B.box(0, 35.2, 0, 1.6, 3.6, 1.6, cGold, 1.6, 0, 2, P);
        B.box(4.6, 19, 3.4, 0.8, 24, 0.8, cBrass, 0.4, 0, 2, P);                                                                                               // a musket at the slope
      };
      for (let k = 0; k < 9; k++) { const r = Math.abs(k - 4); soldier(520 + r * 13, 30 + (k - 4) * 15, -Math.PI / 2 + (k - 4) * 0.05, k === 4 ? 40 : 32); }
      const DP = atY(536, FLOOR_Y + 0.9, -34, 0.3, 1);
      B.cyl(0, 9, 0, 15, 15, 16, cCoat, 'y', se, 0, 0.3, DP); for (const y of [1, 17]) B.cyl(0, y, 0, 15.8, 15.8, 2, cGold, 'y', 1.0, 0, 2, DP); B.cyl(0, 18.2, 0, 14.2, 14.2, 0.5, cWhite, 'y', se, 0, 0, DP);
      for (let k = 0; k < 12; k++) { const a0 = k / 12 * TAU, a1 = (k + 1) / 12 * TAU, y0 = k & 1 ? 16 : 2, y1 = k & 1 ? 2 : 16; B.beam(va.set(Math.cos(a0) * 15.3, y0, Math.sin(a0) * 15.3).applyMatrix4(DP), vb.set(Math.cos(a1) * 15.3, y1, Math.sin(a1) * 15.3).applyMatrix4(DP), 0.7, cWhite, null, 0); }
      rb(B, DP, -3, 19.6, 2, 0.9, 16, 0.9, 1.5, 0.3, cTimber[2], se, 0.3); rb(B, DP, 4, 19.6, -2, 0.9, 16, 0.9, 1.5, -0.4, cTimber[2], se, 0.3);
    }
    await ctx.yield();
    const CLOCK = V3(34, FLOOR_Y, 318);
    { const P = atY(CLOCK.x, CLOCK.y, CLOCK.z, Math.PI, 1), cw = C('#5a3824');                    // faces north, toward the table
      A.box(0, 22, 0, 48, 44, 32, cw, 0, 0, 0.5, P); A.box(0, 100, 0, 34, 114, 24, cw, 0, 0, 0.5, P); A.box(0, 182, 0, 50, 52, 32, cw, 0, 0, 0.5, P); A.box(0, 211, 0, 56, 6, 36, cw.clone().multiplyScalar(0.7), 0, 0, 0, P);
      A.box(0, 100, 12.2, 20, 92, 0.6, C('#120c08'), 0, 0, 0, P);
      const face = new THREE.CylinderGeometry(19, 19, 1, 28); A.add(face, P.clone().multiply(M.makeRotationX(Math.PI / 2).setPosition(0, 182, 16.4)), C('#7c7260'), 0.02, 0, 0); face.dispose();
      A.box(0, 188, 17.2, 1.6, 14, 0.5, cBlack, 0, 0, 0, P); rb(A, P, 4, 184, 17.2, 1.6, 10, 0.5, 0, -1.1, cBlack, 0, 0); }
    { const x = 196, z = -314, P = atY(x, FLOOR_Y, z, 0.4, 1), prof = [[0.1, 0], [15, 2], [17, 16], [13, 30], [15, 44], [20, 56], [17, 66], [8, 70], [6, 78], [0.1, 79]].map((p) => new THREE.Vector2(p[0], p[1]));
      const torso = new THREE.LatheGeometry(prof, 14); A.add(torso, P.clone().multiply(M.makeScale(1, 1, 0.72).setPosition(0, 72, 0)), cSheet.clone().multiplyScalar(0.9), 0, 1, 0); torso.dispose();
      A.cyl(0, 36, 0, 2, 2, 72, cWoodC, 'y', 0, 0, 0, P, G.cyl6); for (let k = 0; k < 3; k++) { const a = k * TAU / 3; A.beam(va.set(0, 14, 0).applyMatrix4(P), vb.set(Math.cos(a) * 22, 0, Math.sin(a) * 22).applyMatrix4(P), 3, cWoodC, null, 0); } }
    await ctx.yield();

    // ------------------------------------------------------------ signals beside our line (left of travel): red until we come
    const signals = [S_MOUTH + 34, S_BR0 - 26, S_EDGE - 36].map((s) => {
      frameOf(pre, s, M); va.set(8.8, 0, 0).applyMatrix4(M); const g = inTable(va.x, va.z) ? Math.max(gAt(va.x, va.z), va.y - 9) : va.y - 0.8, x = va.x, z = va.z;
      B.cyl(x, g + 5, z, 0.22, 0.3, 10, cStone[3], 'y', 0, 0, 1.2, null, G.cyl6); B.box(x, g + 9.2, z, 1.3, 2.6, 0.9, cBlack, 0, 0, 1);
      return { s, x, yR: g + 9.8, yG: g + 8.6, z };
    });
    // the night-lamp on its trunk: brass foot, glowing core (the pierced shade turns round it)
    B.cyl(LAMP.x, 3, LAMP.z, 8, 8, 6, cBrass, 'y', 0, 0, 2); B.cyl(LAMP.x, 22, LAMP.z, 5.2, 5.2, 30, cGold, 'y', 3.4, 0, 0);
    addBulb(LAMP.x, LAMP.y, LAMP.z, cGold.clone().multiplyScalar(3.2), 9);

    // ------------------------------------------------------------ materials and the static meshes
    const mk = K.mkMat, cookie = cookieTexture();
    const lampL = LAMP.clone().applyMatrix4(T2H);
    const AU = { uCookie: { value: cookie }, uLampP: { value: lampL }, uCookieI: { value: 0 }, uCookieRot: { value: 0 }, uWash: { value: 1 }, uPre: { value: 0.12 }, uDust: { value: lookId === 'afternoon' ? 0.5 : lookId === 'predawn' ? 0.3 : 0.2 }, uLampI: { value: 0.6 }, uFill: { value: look.fill },
      uOcL: { value: OCULUS.clone().setX(OCULUS.x - 30).applyMatrix4(T2H) }, uGabA: { value: C(lx.gabA) }, uGabB: { value: C(lx.gabB) }, uGabI: { value: lx.gabI },
      uFairyP: { value: V3(0, PUR_Y - 6, AT.zc - 200).applyMatrix4(T2H) }, uFairyQ: { value: V3(0, PUR_Y - 6, AT.zc + 200).applyMatrix4(T2H) }, uFairyR: { value: V3(0, LOW_Y - 6, AT.zc - 322).applyMatrix4(T2H) }, uFairyS: { value: V3(0, LOW_Y - 6, AT.zc + 322).applyMatrix4(T2H) }, uFairyD: { value: V3(1, 0, 0).transformDirection(T2H) }, uFairyI: { value: 0 },
      uLant: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, -900, 0, 0)) } };
    const atticMat = mk(ATTIC_VERT, atticFrag(K.GLSL_LIGHT), AU, { vertexColors: true });
    // batch -> geometry in hero-local space, in slices (nothing here is frustum culled, so no bounds are needed)
    const bake = async (bat) => {
      const g = await bat.buildAsync(ctx), P = g.attributes.position.array, N = g.attributes.normal.array, e = T2H.elements;
      for (let i = 0; i < P.length; i += 3) {
        const x = P[i], y = P[i + 1], z = P[i + 2], nx = N[i], ny = N[i + 1], nz = N[i + 2];
        P[i] = e[0] * x + e[4] * y + e[8] * z + e[12]; P[i + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; P[i + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
        N[i] = e[0] * nx + e[4] * ny + e[8] * nz; N[i + 1] = e[1] * nx + e[5] * ny + e[9] * nz; N[i + 2] = e[2] * nx + e[6] * ny + e[10] * nz;
        if (i % 15000 === 14997) await ctx.yield();
      }
      return g;
    };
    const addH = (o, name, order) => { o.name = name; o.frustumCulled = false; if (order !== undefined) o.renderOrder = order; hero.object.add(o); return o; };
    await ctx.yield();
    addH(new THREE.Mesh(await bake(B), K.tinMat), 'layout-tin');
    await ctx.yield();
    addH(new THREE.Mesh(await bake(A), atticMat), 'attic-shell');
    await ctx.yield();
    const MIR = new THREE.Matrix4().makeScale(1, -1, 1).setPosition(0, 2 * LY, 0);
    const mirrored = (o, name) => { addH(o, name); o.matrixAutoUpdate = false; o.matrix.copy(MIR); return o; };
    const lakeGeo = await bake(BW);
    addH(new THREE.Mesh(lakeGeo, K.tinMat), 'lake-side-tin'); mirrored(new THREE.Mesh(lakeGeo, K.tinMat), 'lake-side-mirror');
    await ctx.yield();

    // one Points draw per group of bulbs (the hero's bulb shader): static bulbs first, then live ones
    function makePoints(list, nDyn, extra, order = 5) {
      const n = list.length + nDyn, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), par = new Float32Array(n * 4);
      list.forEach((b, i) => { va.set(b.x, b.y, b.z).applyMatrix4(T2H); pos.set([va.x, va.y, va.z], i * 3); col.set([b.c.r, b.c.g, b.c.b], i * 3); par.set([b.size, b.kind, b.phase, b.speed], i * 4); });
      for (let i = list.length; i < n; i++) pos[i * 3 + 1] = -900;
      const g = new THREE.BufferGeometry(), pa = new THREE.BufferAttribute(pos, 3); if (nDyn) pa.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('position', pa); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('aPar', new THREE.BufferAttribute(par, 4));
      const pts = new THREE.Points(g, mk(K.PTS_VERT, K.PTS_FRAG, extra || {}, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      const base = list.length;
      return { pts, pa, base,
        def(i, c, size, kind = 0, phase = 0) { const o = base + i; col.set([c.r, c.g, c.b], o * 3); par.set([size, kind, phase, 1], o * 4); },
        set(i, x, y, z) { va.set(x, y, z).applyMatrix4(T2H); const o = (base + i) * 3; pos[o] = va.x; pos[o + 1] = va.y; pos[o + 2] = va.z; },
        hide(i) { pos[(base + i) * 3 + 1] = -900; } };
    }
    // silver dust all the way down the shaft, from the oculus to the wardrobe
    const shaftLen = OCULUS.distanceTo(wardP) + 30, dustList = [];
    { const e1 = V3(0, 0, 0).crossVectors(moonDirT, UP).normalize(), e2 = V3(0, 0, 0).crossVectors(moonDirT, e1), dc = C(look.moon).multiplyScalar(3.2);
      for (let k = 0; k < Math.round(2200 * density * detail); k++) {
        const t = rng.range(tWard - 20, tWard + shaftLen - 40), a = rng.range(0, TAU), rr = OC_R * Math.sqrt(rng()) * 0.97;
        va.copy(shaftPT).addScaledVector(moonDirT, t).addScaledVector(e1, Math.cos(a) * rr).addScaledVector(e2, Math.sin(a) * rr);
        if (va.y < 2 && inTable(va.x, va.z)) continue;
        dustList.push({ x: va.x, y: va.y, z: va.z, c: dc, size: rng.range(0.45, 1.05), kind: 1, phase: rng.range(0, TAU), speed: rng.range(0.25, 0.8) });
      } }
    const shaftVis = { value: 0.3 }, dustMoonI = { value: 0.3 };
    const N_CARS = Math.round(5 * density) + 2, N_DYN = N_CARS + 19;
    await ctx.yield();
    const ptsMain = makePoints(bulbs, N_DYN); addH(ptsMain.pts, 'layout-bulbs', 5);
    const ptsDust = makePoints(dustList, 0, { uMoonI: dustMoonI }); addH(ptsDust.pts, 'shaft-dust', 5);
    const ptsLake = makePoints(lakeBulbs, 16); addH(ptsLake.pts, 'lake-bulbs', 5);
    const ptsLakeM = new THREE.Points(ptsLake.pts.geometry, ptsLake.pts.material); mirrored(ptsLakeM, 'lake-bulbs-mirror'); ptsLakeM.renderOrder = 0.5;
    const DI = { car: 0, zep: N_CARS, sig: N_CARS + 1, eye: N_CARS + 7, pend: N_CARS + 8, eye2: N_CARS + 9, slamp: N_CARS + 12, scar: N_CARS + 13, bal: N_CARS + 15 };
    for (let k = 0; k < 4; k++) ptsMain.def(DI.bal + k, C('#ffb040').multiplyScalar(4.5), 4.2);
    ptsMain.def(DI.slamp, C('#FFC857').multiplyScalar(3.4), 2.8); for (let k = 0; k < 2; k++) ptsMain.def(DI.scar + k, C('#fff0c4').multiplyScalar(4), 2.4);
    for (let k = 0; k < N_CARS; k++) ptsMain.def(DI.car + k, C('#fff0c4').multiplyScalar(4), 2.4);
    ptsMain.def(DI.zep, C(airship === 'zeppelin' ? '#ff4030' : '#40ff80').multiplyScalar(6), 3.2, 3, 0);
    signals.forEach((sg, k) => { ptsMain.def(DI.sig + k * 2, C('#ff2a1c').multiplyScalar(4), 2.4); ptsMain.def(DI.sig + k * 2 + 1, C('#2cff7a').multiplyScalar(4), 2.4); });
    const eyeC = sitter === 'cat' ? C('#b8ff4a') : C('#ffb030');
    ptsMain.def(DI.eye, eyeC.clone().multiplyScalar(3), 3.4); ptsMain.def(DI.eye2, eyeC.clone().multiplyScalar(3), 3.4); ptsMain.def(DI.pend, C('#ffe9b0').multiplyScalar(4), 2.2);
    for (let k = 0; k < 16; k++) ptsLake.def(k, C(['#FFC857', '#ff5a4a', '#FFC857', '#6ab0ff'][k % 4]).multiplyScalar(4.5), 2.5);

    // the lake glass, the moon shaft, the oculus pane
    {
      const g = new THREE.CircleGeometry(1, 56); g.rotateX(-Math.PI / 2); g.scale(LAKE.a * 1.07, 1, LAKE.b * 1.07); g.rotateY(-LAKE.rot); g.translate(LAKE.x, LY, LAKE.z); g.applyMatrix4(T2H);
      const lakeU = { uOcP: { value: V3(55, 98, -34).applyMatrix4(T2H) }, uOcN: { value: V3(0.5, 0, -0.866).normalize().transformDirection(T2H) }, uOcA: { value: V3(0.866, 0, 0.5).normalize().transformDirection(T2H) },   // the window's double, laid in the glass beside the wheel's
        uOcCol: { value: C(look.disc).multiplyScalar(lookId === 'afternoon' ? 1.6 : lookId === 'storm' ? 0.35 : 1.25) }, uFogC: { value: C(look.fog) } };
      addH(new THREE.Mesh(g, mk(FLAT_VERT, lakeFrag(K.GLSL_LIGHT), lakeU, { transparent: true, depthWrite: false })), 'lake-glass', 1);
      const sg = new THREE.CylinderGeometry(OC_R, OC_R, shaftLen, 44, 1, true);
      M.compose(wardP.clone().addScaledVector(moonDirT, shaftLen / 2 - 15), _q4.setFromUnitVectors(UP, moonDirT), _s3.set(1, 1, 1)); sg.applyMatrix4(M); sg.applyMatrix4(T2H);
      addH(new THREE.Mesh(sg, mk(FLAT_VERT, shaftFrag(K.GLSL_LIGHT, K.GLSL_FOGFADE), { uVis: shaftVis, uWet: { value: lookId === 'storm' ? 1 : 0 } }, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })), 'moon-shaft', 3);
    }
    const OU = { uSkyA: { value: C(look.sky[0]) }, uSkyB: { value: C(look.sky[1]) }, uDisc: { value: C(look.disc) }, uDiscI: { value: look.discI }, uTime: { value: 0 }, uFlash: { value: 0 },
      uRain: { value: lookId === 'storm' ? 1 : 0 }, uCloud: { value: lookId === 'storm' ? 1 : lookId === 'predawn' ? 0.35 : lookId === 'afternoon' ? 0.2 : 0.12 }, uGain: { value: lookId === 'afternoon' ? 1.35 : lookId === 'predawn' ? 1.4 : 0.8 } };
    {
      const pane = new THREE.Mesh(new THREE.CircleGeometry(OC_R + 1, 48), new THREE.ShaderMaterial({ uniforms: OU, vertexShader: FLAT_VERT, fragmentShader: OCULUS_FRAG, fog: false }));
      pane.rotation.y = -Math.PI / 2; pane.position.set(OCULUS.x - 0.4, OCULUS.y, OCULUS.z); pane.name = 'oculus'; scene.add(pane);
    }
    await ctx.yield();

    // ------------------------------------------------------------ things that move (tin: one-instance InstancedMeshes in hero-local space)
    const dyn = (bat, mat, name, count = 1) => { const im = new THREE.InstancedMesh(bat.build(), mat, count); const w = new THREE.Color(1, 1, 1); for (let i = 0; i < count; i++) { im.setMatrixAt(i, M.identity()); im.setColorAt(i, w); } im.instanceColor.needsUpdate = true; return addH(im, name); };
    const setI = (im, i, m) => { M2.multiplyMatrices(T2H, m); im.setMatrixAt(i, M2); im.instanceMatrix.needsUpdate = true; };
    await ctx.yield();
    // the tin carousel on the floorboards under the moon window (it turns; the night-lamp's animals are its shadows' cousins)
    const CARO = V3(545, FLOOR_Y, -305), caroB = new Batch();
    {
      const cR = C('#b5202a'), cCr = C('#e6dcc0'), cBl = C('#2f5fae'), hc = ['#f4efe2', '#2a2622', '#c98a3a', '#f4efe2', '#8a8f9a', '#5a3824', '#f4efe2', '#c98a3a'].map(C);
      caroB.cyl(0, 2.5, 0, 35, 35, 5, cR, 'y', 0.25, 0, 0.3); caroB.cyl(0, 5.4, 0, 33, 33, 0.8, cCr, 'y', 0.2, 0, 0.3); caroB.cyl(0, 26, 0, 7, 7, 42, cCr, 'y', 0.2, 0, 0.3);
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; caroB.box(Math.sin(a) * 7.1, 26, Math.cos(a) * 7.1, 4.2, 30, 0.6, cGold, 2.4, 0, 0, null, a); }          // mirror panels on the drum
      const cone = new THREE.ConeGeometry(38, 14, 12); caroB.add(cone, M.makeTranslation(0, 54, 0), cR, 0.3, 0, 0.3); cone.dispose();
      for (let k = 0; k < 12; k++) { const a = (k + 0.5) / 12 * TAU, a2 = k / 12 * TAU;
        caroB.box(Math.sin(a) * 36.4, 44.6, Math.cos(a) * 36.4, 19.4, 5.6, 0.8, k & 1 ? cCr : cBl, 0.35, 0, 0.3, null, a);                                          // the valance
        caroB.box(Math.sin(a2) * 37.4, 42.6, Math.cos(a2) * 37.4, 2.6, 2.6, 2.6, k % 3 ? goldHDR : C('#ff6a4a').multiplyScalar(3), 1.0, 0, 0, null, a2);              // bulbs round the rim
        caroB.beam(va.set(0, 60.6, 0), vb.set(Math.sin(a2) * 37.6, 47.6, Math.cos(a2) * 37.6), 1.1, cCr, null, 0.3);                                                 // cream ribs on the red canopy
        caroB.box(Math.sin(a2) * 34.6, 5.6, Math.cos(a2) * 34.6, 1.8, 1.8, 1.8, goldHDR, 1.0, 0, 0, null, a2); }
      caroB.box(0, 63, 0, 5, 5, 5, cGold, 2.6, 0, 2, null, 0.6); caroB.box(0, 68, 0, 0.8, 8, 0.8, cBrass, 0.6, 0, 2); caroB.box(3, 70.5, 0, 6, 3, 0.4, cR, 0.6, 0, 0.3);
      for (let k = 0; k < 8; k++) {                                                                                                                              // eight gallopers on brass poles
        const a = k / 8 * TAU, P = new THREE.Matrix4().makeRotationY(a + Math.PI / 2).setPosition(Math.sin(a) * 24, 10 + (k & 1 ? 7 : 0), Math.cos(a) * 24), c = hc[k];
        caroB.cyl(Math.sin(a) * 24, 26, Math.cos(a) * 24, 0.7, 0.7, 42, cBrass, 'y', 0.5, 0, 2);
        caroB.box(0, 8, 0, 4.4, 5.2, 12, c, 0.3, 0, 0.3, P); rb(caroB, P, 0, 12.6, 5.6, 3.2, 8, 3.6, 0.6, 0, c, 0.3, 0.3); caroB.box(0, 15.6, 9.2, 3, 3.4, 6, c, 0.3, 0, 0.3, P);
        for (const sz of [-4.4, 4.4]) for (const sx of [-1.4, 1.4]) rb(caroB, P, sx, 3.2, sz + (sz > 0 ? 1.6 : -1.6), 1.2, 6.4, 1.2, sz > 0 ? -0.5 : 0.5, 0, c, 0.3, 0.3);
        rb(caroB, P, 0, 8.4, -7.6, 1.4, 6, 1.4, -0.7, 0, c.clone().multiplyScalar(0.6), 0.3, 0.3); caroB.box(0, 11, 0, 4.8, 1, 5, k & 1 ? cBl : cR, 0.5, 0, 0.3, P);
      }
    }
    await ctx.yield();
    const carousel = dyn(caroB, K.tinMat, 'carousel');
    await ctx.yield();
    // a humming top spinning on the boards beside the drum (it leans, precesses and wanders a hand's breadth)
    const TOP = V3(498, FLOOR_Y, -70), topB = new Batch();
    { const cn = new THREE.ConeGeometry(13, 17, 12); topB.add(cn, M.makeRotationX(Math.PI).setPosition(0, 8.5, 0), C('#2f5fae'), 0.35, 0, 0.3); cn.dispose();
      topB.cyl(0, 18.5, 0, 13, 13, 3, cGold, 'y', 1.2, 0, 2); const c2 = new THREE.ConeGeometry(13, 8, 12); topB.add(c2, M.makeTranslation(0, 24, 0), C('#b5202a'), 0.35, 0, 0.3); c2.dispose();
      topB.cyl(0, 31, 0, 1.2, 1.2, 9, cBrass, 'y', 0.6, 0, 2, null, G.cyl6); topB.box(0, 36, 0, 3.4, 2.4, 3.4, cGold, 1.6, 0, 2);
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; topB.box(Math.sin(a) * 12.6, 18.5, Math.cos(a) * 12.6, 3, 2.2, 1.4, k & 1 ? C('#fff0c4').multiplyScalar(3) : C('#ff6a4a').multiplyScalar(2.6), 1.0, 0, 0, null, a); } }
    const spinTop = dyn(topB, K.tinMat, 'humming-top');
    lantL.push(new THREE.Vector4(CARO.x, FLOOR_Y + 62, CARO.z, 2.4));
    lantL.forEach((v, i) => { va.set(v.x, v.y, v.z).applyMatrix4(T2H); AU.uLant.value[i].set(va.x, va.y, va.z, v.w); });
    const fairyGlow = { value: 0 }, fairyK = lookId === 'afternoon' ? 0.55 : 1;
    const ptsFairy = makePoints(fairy, 0, { uGlow: fairyGlow }); addH(ptsFairy.pts, 'attic-fairy-lights', 5);
    await ctx.yield();
    // Ferris wheel (axle = local x) and its double in the lake
    const WR = 20.5, wheelHub = V3(WHEEL.x, WHEEL.y + 24.5, WHEEL.z), wheelAx = V3(0, 0, 0), wheelAl = V3(0, 0, 0);
    { frameOf(pre, (S_BR0 + S_BR1) / 2, M); wheelAx.set(1, 0, 0).transformDirection(M); wheelAl.set(0, 0, 1).transformDirection(M); }
    const WB = new Batch();
    for (let k = 0; k < 16; k++) {
      const a0 = (k / 16) * TAU, a1 = ((k + 1) / 16) * TAU, gc = [cRed, C('#2a66d8'), C('#e8b020'), C('#2c7a3e')][k % 4];
      for (const sx of [-2.6, 2.6]) {
        WB.beam(va.set(sx, Math.cos(a0) * WR, Math.sin(a0) * WR), vb.set(sx, Math.cos(a1) * WR, Math.sin(a1) * WR), 0.7, cWhite, null, 1.4);
        WB.beam(va.set(sx, 0, 0), vb.set(sx, Math.cos(a0) * WR, Math.sin(a0) * WR), 0.6, cBrass, null, 1.6);
        WB.beam(va.set(sx, Math.cos(a0) * WR * 0.55, Math.sin(a0) * WR * 0.55), vb.set(sx, Math.cos(a1) * WR * 0.55, Math.sin(a1) * WR * 0.55), 0.55, cWhite, null, 1.2);
      }
      WB.box(0, Math.cos(a0) * (WR - 1.6), Math.sin(a0) * (WR - 1.6), 4.4, 2.6, 2.8, gc, 0, 0, 1.5); WB.box(0, Math.cos(a0) * (WR - 0.9), Math.sin(a0) * (WR - 0.9), 4.6, 0.5, 1.4, cGold, 3.5, 0, 0);
      { const am = (a0 + a1) / 2; for (const sx of [-2.9, 2.9]) { M.makeRotationX(am).setPosition(sx, Math.cos(am) * (WR + 0.2), Math.sin(am) * (WR + 0.2)); M.multiply(M2.makeScale(0.5, 0.5, 2.4)); WB.add(G.box, M, k % 2 ? cGold : C('#ffe9b8'), 2.6, 0, 0); } }
    }
    WB.cyl(0, 0, 0, 2.2, 2.2, 6.4, cBrass, 'x', 0, 0, 2);
    const wheel = dyn(WB, K.tinMat, 'ferris-wheel'), wheelM = new THREE.InstancedMesh(wheel.geometry, K.tinMat, 1); mirrored(wheelM, 'ferris-wheel-mirror');
    await ctx.yield();
    // clockwork cars: a few wait at the crossing, the rest drive round the town block
    const CB = new Batch(), WHT = C('#ffffff');
    CB.box(0, 1.7, 0, 3.4, 1.9, 7.2, WHT, 0, 1, 1.6); CB.box(0, 3.3, -0.5, 3.0, 1.6, 3.6, WHT, 0, 0.8, 1.6);
    for (const sd of [-1, 1]) { CB.box(sd * 1.52, 3.4, -0.5, 0.06, 1.0, 2.8, cGold, 3.2, 0, 0); CB.box(sd * 1.0, 1.9, 3.62, 0.8, 0.6, 0.1, C('#fff1c8'), 6, 0, 0); CB.box(sd * 1.1, 1.9, -3.62, 0.6, 0.5, 0.1, C('#ff2a1c'), 3, 0, 0);
      for (const z of [-2.2, 2.2]) CB.cyl(sd * 1.6, 0.85, z, 0.85, 0.85, 0.5, cBlack, 'x', 0, 0, 1.2); }
    CB.cyl(0, 4.5, -2.6, 0.5, 0.5, 0.5, cBrass, 'y', 0, 0, 2, null, G.cyl6);                       // the clockwork key
    const N_WAIT = 4, N_ST = 2, cars = dyn(CB, K.tinMat, 'clockwork-cars', N_CARS + N_WAIT + N_ST);
    { const cc = ['#c8302a', '#2a5ac8', '#e8b020', '#2c8a4e', '#e8e0d0', '#7a3a9a', '#20a0a0'].map(C); for (let i = 0; i < N_CARS + N_WAIT; i++) cars.setColorAt(i, rng.pick(cc)); for (let i = 0; i < N_ST; i++) cars.setColorAt(N_CARS + N_WAIT + i, cc[(i * 3 + 1) % 7]); cars.instanceColor.needsUpdate = true; }
    const waitSpots = [[ROAD_X + 2.2, 158, Math.PI], [ROAD_X + 2.2, 168, Math.PI], [ROAD_X - 2.2, 108.5, 0], [ROAD_X - 2.2, 98, 0]];
    const blockC = [[ROAD_X + 2.3, 175.2], [-119, 175.2], [-119, 214.8], [ROAD_X + 2.3, 214.8]], blockL = 2 * ((-119 - ROAD_X - 2.3) + 39.6);
    const blockAt = (d, out) => { d = ((d % blockL) + blockL) % blockL; for (let k = 0; k < 4; k++) { const a = blockC[k], b = blockC[(k + 1) % 4], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= L) { out.set(lerp(a[0], b[0], d / L), 0, lerp(a[1], b[1], d / L)); return Math.atan2(b[0] - a[0], b[1] - a[1]); } d -= L; } return 0; };
    const stC = [[MILL_ST + 2.2, -52], [MILL_ST + 2.2, -232], [MILL_ST - 2.2, -232], [MILL_ST - 2.2, -52]], stL = 2 * (180 + 4.4);   // two more cars up and down Mill Street
    const stAt = (d, out) => { d = ((d % stL) + stL) % stL; for (let k = 0; k < 4; k++) { const a = stC[k], b = stC[(k + 1) % 4], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= L) { out.set(lerp(a[0], b[0], d / L), 0, lerp(a[1], b[1], d / L)); return Math.atan2(b[0] - a[0], b[1] - a[1]); } d -= L; } return 0; };
    const carPh = Array.from({ length: N_CARS }, (_, i) => (i / N_CARS) * blockL + rng.range(-12, 12)), carSp = Array.from({ length: N_CARS }, () => rng.range(9, 13));
    // airship on its thread (or a tin biplane), the unit box for threads and rods
    const ZB = new Batch();
    if (airship === 'zeppelin') {
      const hull = new THREE.SphereGeometry(1, 16, 10); ZB.add(hull, M.makeScale(3.9, 3.9, 12.5), C('#c9ced6'), 0, 0, 1.8); hull.dispose();
      for (const z of [-5, 0, 5]) ZB.cyl(0, 0, z, 3.75 * Math.sqrt(1 - (z / 12.5) ** 2) + 0.12, 3.75 * Math.sqrt(1 - (z / 12.5) ** 2) + 0.12, 0.7, cRed, 'z', 0, 0, 1.8, null, G.cyl);
      ZB.box(0, -4.6, 1, 2.2, 1.6, 6.5, C('#e8d9ae'), 0, 0, 1.4); for (const sd of [-1, 1]) ZB.box(sd * 1.12, -4.5, 1, 0.06, 0.8, 5.2, cGold, 4, 0, 0);
      ZB.box(0, 0, -10.4, 0.3, 7.5, 3.6, cRed, 0, 0, 1.4); ZB.box(0, 0, -10.4, 7.5, 0.3, 3.6, cRed, 0, 0, 1.4); ZB.cyl(0, -4.6, -2.8, 1.5, 1.5, 0.15, cBrass, 'z', 0.4, 0, 2);
    } else {
      ZB.cyl(0, 0, 0, 1.5, 1.5, 15, C('#2c7a3e'), 'z', 0, 0, 1.8); ZB.box(0, 1.9, 2.5, 22, 0.3, 3.6, C('#e8d9ae'), 0, 0, 1.5); ZB.box(0, -1.5, 2.5, 20, 0.3, 3.4, C('#e8d9ae'), 0, 0, 1.5);
      for (const sd of [-1, 1]) { ZB.box(sd * 7.5, 0.2, 2.5, 0.25, 3.3, 0.25, cBrass, 0, 0, 2); ZB.cyl(sd * 2.4, -3.2, 3, 1.1, 1.1, 0.5, cBlack, 'x', 0, 0, 1.2); }
      ZB.box(0, 0.4, -6.9, 7, 0.25, 2.4, cRed, 0, 0, 1.5); ZB.box(0, 1.6, -7, 0.25, 2.6, 2.2, cRed, 0, 0, 1.5); ZB.cyl(0, 0, 7.8, 3.4, 3.4, 0.12, C('#d8d0b8'), 'z', 0.5, 0, 2); ZB.cyl(0, 0, 7.6, 0.7, 0.7, 0.8, cBrass, 'z', 0, 0, 2);
    }
    const zep = dyn(ZB, K.tinMat, 'airship');
    const UB = new Batch(); UB.box(0, 0, 0, 1, 1, 1, WHT, 0, 1, 0.6);
    const N_PEN = 20, SK = { pen: 3, arm: 3 + N_PEN, lamp: 5 + N_PEN, teth: 7 + N_PEN }, sticks = dyn(UB, K.tinMat, 'thread-pendulum-bunting', 7 + N_PEN + 4);
    sticks.setColorAt(0, C('#8a8a80')); sticks.setColorAt(1, cBrass); sticks.setColorAt(2, C('#e0b050'));
    { const pc = ['#d8402e', '#e8d9ae', '#2a66d8', '#e8b020', '#2c7a3e'].map(C); for (let k = 0; k < N_PEN; k++) sticks.setColorAt(SK.pen + k, pc[k % 5]); }
    wavers.forEach((w, k) => sticks.setColorAt(SK.arm + k, w.col)); sticks.setColorAt(SK.lamp, cBlack); sticks.setColorAt(SK.lamp + 1, C('#f2d28a'));
    for (let k = 0; k < 4; k++) sticks.setColorAt(SK.teth + k, C('#8a8a80'));
    sticks.instanceColor.needsUpdate = true;
    // the night-lamp's pierced shade
    const SB = new Batch();
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU, P = atY(Math.cos(a) * 9.6, 0, Math.sin(a) * 9.6, -a + Math.PI / 2, 1); SB.box(0, 0, 0, 3.6, 26, 0.4, C(k % 2 ? '#7a2a22' : '#2a3a6a'), 0, 0, 1.6, P); SB.box(0, 9.5, 0, 5.2, 2.2, 0.5, cBrass, 0, 0, 2, P); SB.box(0, -9.5, 0, 5.2, 2.2, 0.5, cBrass, 0, 0, 2, P); }
    SB.cyl(0, 15.5, 0, 10.4, 10.4, 5, cBrass, 'y', 0, 0, 2, null, G.cone); SB.cyl(0, 19, 0, 1.2, 1.2, 3, cBrass, 'y', 0, 0, 2, null, G.cyl6);
    const shade = dyn(SB, K.tinMat, 'night-lamp-shade');
    const LB = new Batch(), cSail = C('#e8dcc0');
    LB.cyl(0, 0, 0, 1.0, 1.0, 1.4, cBrass, 'z', 0, 0, 2, null, G.cyl6);
    for (let k = 0; k < 4; k++) {
      const P = new THREE.Matrix4().makeRotationZ(k * Math.PI / 2);
      LB.box(0, 7.2, 0, 0.34, 14.4, 0.34, cTimber[1], 0, 0, 0.4, P); LB.box(1.25, 8.6, 0.05, 2.3, 10.6, 0.1, cSail, 0, 0, 0.6, P);
      for (let q = 0; q < 6; q++) LB.box(1.25, 3.6 + q * 2.0, -0.08, 2.5, 0.16, 0.16, cTimber[2], 0, 0, 0.4, P);
      LB.box(2.45, 8.6, -0.08, 0.16, 10.6, 0.16, cTimber[2], 0, 0, 0.4, P);
    }
    const sails = dyn(LB, K.tinMat, 'windmill-sails');
    await ctx.yield();

    // paper-lantern balloons tethered over the town and the hills (each glows from its burner), swans on the lake, toy rockets
    const BAL = [[-262, 64, 84], [-128, 70, 60], [20, 80, -130], [-150, 70, -60]].map((p) => V3(p[0], p[1], p[2])), N_BAL = BAL.length;
    const balG = BAL.map((p) => gAt(p.x, p.z));
    let balloons, swans, swansM;
    {
      const BL = new Batch(), sp = new THREE.SphereGeometry(1, 16, 12), cCream = C('#fff0cc');
      BL.add(sp, M.makeScale(11, 12.5, 11), WHT, 0.75, 1, 1.5);
      for (const by of [-6, -1.5, 3, 7.5]) { const rr = 11.06 * Math.sqrt(1 - (by / 12.5) ** 2); BL.cyl(0, by, 0, rr, rr, 1.5, cCream, 'y', 1.1, 0, 1.4, null, G.cyl24 || G.cyl); }
      BL.cyl(0, -12.6, 0, 3.3, 3.3, 2.6, cCream, 'y', 0.8, 0, 1.4); BL.box(0, -15.6, 0, 1.0, 1.0, 1.0, C('#ffb040'), 6, 0, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) BL.beam(va.set(sx * 2.7, -13.2, sz * 2.7), vb.set(sx * 1.7, -19.4, sz * 1.7), 0.14, cBlack);
      BL.box(0, -20.6, 0, 3.8, 2.6, 3.8, cTimber[0], 0, 0, 0.5); BL.box(0, -19.3, 0, 4.1, 0.4, 4.1, cTimber[2], 0, 0, 0.5);
      sp.dispose(); balloons = dyn(BL, K.tinMat, 'lantern-balloons', N_BAL);
      ['#e8503a', '#f0b030', '#4a86e8', '#e86aa8'].forEach((h, k) => { if (k < N_BAL) balloons.setColorAt(k, C(h)); }); balloons.instanceColor.needsUpdate = true;
      const SW = new Batch(), cSwan = C('#f2f0e8');
      M.compose(va.set(0, 0.7, 0), _q4.identity(), vb.set(1.15, 0.85, 2.1)); SW.add(G.blob, M, cSwan, 0.06, 0, 0.8);
      M.compose(va.set(0, 1.25, -1.9), _q4.setFromEuler(_e.set(-0.5, 0, 0)), vb.set(0.7, 0.3, 1.0)); SW.add(G.blob, M, cSwan, 0.06, 0, 0.8);
      SW.beam(va.set(0, 1.1, 1.5), vb.set(0, 2.9, 2.0), 0.42, cSwan, null, 0.8); SW.beam(va.set(0, 2.8, 1.95), vb.set(0, 3.2, 2.6), 0.4, cSwan, null, 0.8);
      M.compose(va.set(0, 3.25, 2.75), _q4.identity(), vb.set(0.34, 0.32, 0.5)); SW.add(G.blob, M, cSwan, 0.06, 0, 0.8); SW.box(0, 3.15, 3.3, 0.18, 0.16, 0.5, C('#f08020'), 0.3, 0, 0.6);
      swans = dyn(SW, K.tinMat, 'swans', 6); swansM = new THREE.InstancedMesh(swans.geometry, K.tinMat, 6); swansM.instanceMatrix = swans.instanceMatrix; mirrored(swansM, 'swans-mirror');
    }
    const swanC = [[3.5, 0.3, 7], [4.1, 0.62, 9], [5.2, 0.6, 8], [5.9, 0.36, 6], [4.7, 0.3, 5], [2.9, 0.6, 7]].map(([a, rr, r]) => { lakeXZ(a, rr, vc);
      const nx = -62 / 162.31, nz = -150 / 162.31, d = (vc.x + 90) * nx + (vc.z - 118) * nz;              // north of the girder bridge the rings keep clear of it, so no swan slides under the lens and is cut by the frame
      if (d >= 0 && d < r + 42) { vc.x += (r + 42 - d) * nx; vc.z += (r + 42 - d) * nz; }
      { const tx = 150 / 162.31, tz = -62 / 162.31, t = (vc.x - WHEEL.x) * tx + (vc.z - WHEEL.z) * tz;      // and of the wheel's double: no swan paddles across the reflection's hub
        if (d >= 0 && Math.abs(t) < r + 14) { vc.x += (-(r + 14) - t) * tx; vc.z += (-(r + 14) - t) * tz; } }
      return [vc.x, vc.z, r]; });
    const N_FW = 5, FW_N = 34, FW_P = 3.6, fwSites = [[-238, 78, 52], [-64, 88, -84], [84, 84, -50], [-178, 72, 222], [-330, 70, 196]];
    const ptsFire = makePoints([], N_FW * (FW_N + 1)); addH(ptsFire.pts, 'toy-rockets', 5);
    const fwDir = [], fwLife = [];
    { const fc = ['#ff5a40', '#ffd060', '#6ac0ff', '#8aff8a', '#ff8ae0'];
      for (let b = 0; b < N_FW; b++) { for (let i = 0; i < FW_N; i++) ptsFire.def(b * (FW_N + 1) + i, C(i % 5 === 0 ? '#fff4d8' : fc[b]).multiplyScalar(i % 5 === 0 ? 4.5 : 3.6), 1.5 + 0.5 * (i % 3), 0, i * 1.7 + b); ptsFire.def(b * (FW_N + 1) + FW_N, C('#ffe0a0').multiplyScalar(4), 1.8, 0, b); }
      for (let i = 0; i < FW_N; i++) { const y = 1 - (2 * (i + 0.5)) / FW_N, rr = Math.sqrt(1 - y * y), a = i * 2.39996; fwDir.push(rr * Math.cos(a), y, rr * Math.sin(a)); fwLife.push(1.0 + 0.9 * ((i * 0.618) % 1)); } }
    await ctx.yield();
    // ------------------------------------------------------------ the sitter: a cat curled on the top trunk, or an owl on a purlin
    const SPH = new THREE.SphereGeometry(1, 18, 12);
    const blob = (bat, x, y, z, sx, sy, sz, a = 0, b = 0, c = 0, rz = 0, col = cBlack) => { M.compose(va.set(x, y, z), _q4.setFromEuler(_e.set(0, 0, rz)), vb.set(sx, sy, sz)); bat.add(SPH, M, col, a, b, c); };
    const OWL = V3(262, roofY(362) - 3.5, 361), SIT = sitter === 'cat' ? V3(CAT.x + 8, CAT.y + 11, CAT.z - 4) : V3(OWL.x, OWL.y + 20, OWL.z);
    const catU = { uCatC: { value: V3(CAT.x, CAT.y + 6, CAT.z + 4).applyMatrix4(T2H) } };
    const catMat = mk(CAT_VERT, catFrag(K.GLSL_LIGHT), catU, {});
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeC.clone().multiplyScalar(2.6), fog: false, side: THREE.DoubleSide });
    const eyes = new THREE.Group(); eyes.name = 'eyes'; scene.add(eyes);
    let owlHead = null, paw = null;
    if (sitter === 'cat') {
      const CT = new Batch(), x = CAT.x, y = CAT.y, z = CAT.z;
      blob(CT, x, y + 9.5, z + 4, 21, 10, 13.5, 1); blob(CT, x - 11, y + 10.5, z + 6, 12.5, 11.2, 12.5, 0.8); blob(CT, x + 12, y + 9, z + 2, 10.5, 9.2, 11, 0.7);
      blob(CT, x + 19, y + 8.3, z - 7, 7.6, 6.8, 7.4, 0.15); blob(CT, x + 12, y + 2.6, z - 9.5, 7, 2.6, 3.4, 0.1);
      for (const ex of [15.6, 22.4]) { M.compose(va.set(x + ex, y + 15.6, z - 8), _q4.setFromEuler(_e.set(0, 0, (ex - 19) * 0.07)), vb.set(2.7, 5.4, 2.2)); CT.add(G.cone, M, cBlack, 0.1, 0, 0); }
      for (let k = 0; k <= 30; k++) { const t = k / 30, r = lerp(2.9, 1.7, t); blob(CT, x - 22 + 31 * t, y + 3 - Math.max(0, t - 0.66) * 26, z - 8 - 10 * Math.sin(t * Math.PI * 0.5) - Math.max(0, t - 0.66) * 6, r * 1.6, r, r, 0, t * t, t * 4); }
      addH(new THREE.Mesh(await bake(CT), catMat), 'cat');
      const slit = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.9), eyeMat); slit.position.set(x + 19.5, y + 9.8, z - 14.5); slit.rotation.y = Math.PI; eyes.add(slit);
      if (rare) { const PW = new Batch(); blob(PW, 0, 8, 0, 2.7, 9, 2.7); blob(PW, 0, 17, -0.8, 3.3, 2.6, 3.6); paw = new THREE.InstancedMesh(PW.build(), catMat, 1); addH(paw, 'paw'); paw.setMatrixAt(0, M.makeScale(0, 0, 0)); }
    } else {
      const OB = new Batch(), x = OWL.x, y = OWL.y, z = OWL.z;
      blob(OB, x, y + 14, z, 9.6, 14.5, 9, 1); blob(OB, x, y + 1.5, z + 2.5, 5, 3, 7, 0.2); catU.uCatC.value.set(x, y + 10, z).applyMatrix4(T2H);
      addH(new THREE.Mesh(await bake(OB), catMat), 'owl');
      const OH = new Batch(); blob(OH, 0, 0, 0, 7.8, 6.6, 7.2);
      for (const sd of [-1, 1]) { M.compose(va.set(sd * 4.6, 6.4, 0), _q4.setFromEuler(_e.set(0, 0, -sd * 0.45)), vb.set(1.9, 4.4, 1.6)); OH.add(G.cone, M, cBlack, 0, 0, 0); }
      owlHead = new THREE.InstancedMesh(OH.build(), catMat, 1); addH(owlHead, 'owl-head');
      for (const sd of [-1, 1]) { const e = new THREE.Mesh(new THREE.CircleGeometry(1.75, 14), eyeMat); e.position.set(sd * 2.9, 0.9, -7.05); e.rotation.y = Math.PI; eyes.add(e); }
      eyes.position.set(x, y + 30, z);
    }
    eyes.visible = false;

    await ctx.yield();
    // the mouse in the tunnel (dark, warm-rimmed, ears glowing through) and its tall shadow on the wall
    const MB = new Batch(), cFur = C('#0b0806'), cEar = C('#3a241d');
    blob(MB, 0, 2.1, -0.4, 2.2, 2.1, 3.3, 0, 0, 0, 0, cFur); blob(MB, 0, 2.5, -2.2, 2.5, 2.3, 2.3, 0, 0, 0, 0, cFur); blob(MB, 0, 2.2, 3.3, 1.5, 1.45, 2.3, 0, 0, 0, 0, cFur); blob(MB, 0, 1.8, 5.5, 0.5, 0.5, 0.6, 0, 0, 0, 0, cEar);
    for (const sd of [-1, 1]) { blob(MB, sd * 1.75, 4.5, 2.5, 1.55, 1.6, 0.22, 0, 0, 0, 0, cEar); blob(MB, sd * 1.0, 0.5, 1.6, 0.5, 0.5, 0.9, 0, 0, 0, 0, cEar); blob(MB, sd * 1.3, 0.5, -2.4, 0.55, 0.5, 1.2, 0, 0, 0, 0, cEar); }
    { const tail = new THREE.BoxGeometry(1, 1, 1, 1, 1, 16); MB.add(tail, M.compose(va.set(0, 1.6, -9.0), _q4.identity(), vb.set(0.5, 0.2, 9.8)), cEar, 0, 0, 0); tail.dispose(); }   // one ribbon of a tail, tapered and waved in the vertex shader
    const mouseU = { uTime: { value: 0 }, uRim: { value: C('#ffb060').multiplyScalar(lookId === 'afternoon' ? 1.1 : 1.6) } };
    const mouse = new THREE.Mesh(MB.build(), new THREE.ShaderMaterial({ uniforms: mouseU, vertexColors: true, vertexShader: /* glsl */`
      uniform float uTime; varying vec3 vC, vN, vV;
      void main() { vec3 p = position; float tl = max(0.0, -p.z - 4.0);
        p.x *= mix(1.0, 0.25, clamp(tl / 9.8, 0.0, 1.0)); p.x += sin(uTime * 13.0 + p.z * 0.4) * tl * 0.08; p.y += 0.022 * tl * tl;
        vec4 mv = modelViewMatrix * vec4(p, 1.0); vC = color; vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`, fragmentShader: /* glsl */`
      uniform vec3 uRim; varying vec3 vC, vN, vV;
      void main() { float f = 1.0 - clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0);
        gl_FragColor = vec4(vC * (0.05 + 0.07 * uRim) + uRim * (0.2 * f * f * f * f + 0.004), 1.0); }` }));
    const MS = new Batch(), flat = (y, z, ry, rz2) => blob(MS, 0, y, z, 0.03, ry, rz2);
    flat(2.1, -0.4, 2.1, 3.3); flat(2.5, -2.2, 2.3, 2.3); flat(2.2, 3.3, 1.45, 2.3); flat(1.8, 5.4, 0.5, 0.7); flat(4.6, 2.0, 1.5, 1.25); flat(4.9, 3.6, 1.3, 1.1);
    for (let k = 0; k < 12; k++) flat(1.5 + 0.03 * k * k, -4.4 - k * 0.8, lerp(0.34, 0.14, k / 11), 0.6);
    const mouseSh = new THREE.Mesh(MS.build(), new THREE.MeshBasicMaterial({ color: '#0a0503', transparent: true, opacity: 0.62, depthWrite: false, fog: false }));
    for (const m of [mouse, mouseSh]) { m.matrixAutoUpdate = false; m.frustumCulled = false; scene.add(m); }

    // the summit announces itself: a soft column of gold light standing over the keystone arch, dust rising in it
    const beaconU = { uTime: { value: 0 }, uI: { value: 0.3 }, uBase: { value: seatT.clone().setY(seatT.y + 9) }, uCol: { value: C('#ffcf7a').lerp(C(look.moon), 0.5) } };
    { const g = new THREE.PlaneGeometry(2, 1, 1, 24); g.translate(0, 0.5, 0);
      const bm = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: beaconU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, vertexShader: /* glsl */`
        uniform vec3 uBase; varying vec2 vQ; varying vec3 vW;
        void main() { vQ = position.xy; vec3 base = uBase + vec3(0.0, position.y * 176.0, 0.0);
          vec3 toC = cameraPosition - base; toC.y = 0.0; float l = max(length(toC), 1e-3);
          vec3 side = vec3(toC.z, 0.0, -toC.x) / l;
          vW = base + side * position.x * mix(10.0, 26.0, position.y);
          gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`, fragmentShader: /* glsl */`
        uniform float uTime, uI; uniform vec3 uCol; varying vec2 vQ; varying vec3 vW;
        float h21(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
        float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
        void main() { float x = vQ.x, y = vQ.y;
          float core = exp(-x * x * 9.0) + 0.45 * exp(-x * x * 2.2);
          float rise = 0.55 + 0.45 * vn(vec2(x * 5.0, y * 9.0 - uTime * 0.5)) + 0.35 * vn(vec2(x * 13.0 + 4.0, y * 26.0 - uTime * 1.1));
          float fall = pow(1.0 - y, 1.6) * smoothstep(0.0, 0.03, y) * (1.0 - smoothstep(0.82, 1.0, abs(x)));
          gl_FragColor = vec4(uCol * uI * core * rise * fall, 1.0); }` }));
      bm.frustumCulled = false; bm.renderOrder = 4; bm.name = 'summit-beacon'; scene.add(bm); }

    await ctx.yield();
    // the rocking horse north of the table (painted wood, in the attic's own light)
    const HB = new Batch(), cDapple = C('#c2beb2'), cDark = C('#2a2420');
    for (const sd of [-1, 1]) {
      for (let k = 0; k < 8; k++) { const a0 = -0.66 + (k / 8) * 1.32, a1 = -0.66 + ((k + 1) / 8) * 1.32; HB.beam(va.set(Math.sin(a0) * 92, 94 - Math.cos(a0) * 92, sd * 17), vb.set(Math.sin(a1) * 92, 94 - Math.cos(a1) * 92, sd * 17), 5, C('#7a2a22'), null, 0); }
      for (const fx2 of [-1, 1]) HB.beam(va.set(fx2 * 22, 64, sd * 9), vb.set(fx2 * 40, 12, sd * 17), 6.5, cDapple, null, 0);
      M.compose(va.set(49, 122, sd * 4), _q4.setFromEuler(_e.set(0, 0, -0.3)), vb.set(2.4, 6, 2)); HB.add(G.cone, M, cDapple, 0, 0, 0);
    }
    for (const bx of [-40, 0, 40]) HB.box(bx, 94 - Math.cos(bx / 92) * 92 + 2, 0, 5, 3, 36, C('#7a2a22'), 0, 0, 0);
    blob(HB, 0, 74, 0, 34, 19, 15, 0, 0, 0, 0, cDapple); blob(HB, 30, 94, 0, 11, 23, 10, 0, 0, 0, -0.55, cDapple); blob(HB, 46, 110, 0, 15.5, 8.5, 7.5, 0, 0, 0, -0.42, cDapple);
    blob(HB, -2, 92, 0, 13, 5, 15.6, 0, 0, 0, 0, cRed); HB.beam(va.set(26, 112, 0), vb.set(14, 88, 0), 5, cDark, null, 0); HB.beam(va.set(-33, 82, 0), vb.set(-48, 48, 0), 7, cDark, null, 0);
    const horse = dyn(HB, atticMat, 'rocking-horse'), HORSE = V3(-130 + rng.range(-40, 40), FLOOR_Y, -316), horseYaw = rng.range(-0.3, 0.5);
    SPH.dispose();
    await ctx.yield();

    // ------------------------------------------------------------ kit life: drifting dust round the eye, moths at the lamp, birds at the window
    const amb = fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', count: Math.round(620 * density * detail), box: [110, 70, 110], size: [0.1, 0.3], additive: 1, near: [5, 18], colors: look.dust.map((h, i) => '#' + C(h).lerp(C(i === 1 ? '#8a7a66' : '#9a948a'), 0.55).getHexString()) });
    scene.add(amb.object);
    await ctx.yield();
    let moths = null, birds = null;
    try { moths = F.makeMoths({ rng: rng.fork('moths'), count: 6, positions: [[LAMP.x, LAMP.y + 8, LAMP.z]], jitter: 6, size: 42, roam: [18, 11, 1.4, 0.07], selfLit: 2.4, light: 'night' }); scene.add(moths.object); } catch (e) { moths = null; }
    await ctx.yield();
    if (lookId === 'predawn') {
      try { birds = F.makeFlock({ rng: rng.fork('birds'), species: 'swifts', count: 9, size: 34, speed: 44, spread: [26, 14, 40], wander: [6, 4, 6, 0.7], closed: true, light: 'night',
        route: [[672, 150, -30], [676, 180, 40], [672, 200, 112], [600, 262, 130], [540, 276, 40], [600, 252, -50]] }); scene.add(birds.object); } catch (e) { birds = null; }
    }
    await ctx.yield();

    // ------------------------------------------------------------ story beats, as places along the line
    const S_ZEP = preLen + 44, ZEP_W = 0.33;
    cl(S_ZEP, _t0, _t1); _t1.setY(0).normalize(); _t2.subVectors(OCULUS, _t0).setY(0).normalize();
    _t0.addScaledVector(_t1.multiplyScalar(0.58).addScaledVector(_t2, 0.42).normalize(), 92).setY(_t0.y + EYE_UP + 24);   // between the way ahead and the moon, a little above the eye
    const zepPhi0 = Math.atan2(-(_t0.z - HERO_POS.z), _t0.x - HERO_POS.x), zepR = Math.hypot(_t0.x - HERO_POS.x, _t0.z - HERO_POS.z), zepY = _t0.y;
    const tOf = (s) => uOfS(s) * duration;
    const T_ZEP = tOf(S_ZEP), T_EYE = tOf(S_APEX - 62), T_BAT = T_EYE + 1.7, T_REVEAL = tOf(S_EDGE + 20);
    const stormOff = rng.range(0, 6);
    const pulse = (x) => (x < 0 ? 0 : smoothstep(0, 0.1, x) * Math.exp(-Math.max(0, x - 0.1) / 0.24));
    const hover = V3(CAT.x + 12, CAT.y + 31, CAT.z - 30), zp = V3(0, 0, 0), zt = V3(0, 0, 0), zl = V3(0, 0, 0), MZ = new THREE.Matrix4(), MT = new THREE.Matrix4();
    const camP = V3(0, 0, 0);

    waitSpots.forEach((w, i) => { MZ.makeRotationY(w[2]).setPosition(w[0], gAt(w[0], w[1]) + 0.1, w[1]); setI(cars, N_CARS + i, MZ); });
    const blockH = []; for (let d = 0; d < blockL; d += 3) { blockAt(d, zp); blockH.push(gAt(zp.x, zp.z) + 0.1); }
    const stH = []; for (let d = 0; d < stL; d += 3) { stAt(d, zp); stH.push(gAt(zp.x, zp.z) + 0.1); }
    const tunA0 = preLen + hero.tunnel.s0, tunB0 = preLen + hero.tunnel.s1;
    const headI = lookId === 'afternoon' ? 0.55 : 0.95, cookieK = lookId === 'afternoon' ? 0.75 : 1.4, washK = lookId === 'afternoon' ? 0.7 : 1.0;
    const pendP = V3(CLOCK.x, FLOOR_Y + 150, CLOCK.z - 13.4);
    const preFill = lookId === 'afternoon' || lookId === 'predawn' ? 0.55 : 0.3, preGlow = lookId === 'afternoon' ? 1.5 : lookId === 'predawn' ? 1.3 : 1;   // before the reveal the town sparkles against the dark
    let headYaw = 0;

    function update(dt, time, camera, u) {
      const uu = u || 0, s = sOfU(uu); tw = uu * duration;
      hero.setProgress((s - preLen) / TL);
      // our own engine under the eye: it draws up from behind as we leave the first tunnel, and on the summit it runs ahead of us into the arch.
      // The blue engine keeps half a turn ahead until the last bore, where we close on its tail lamp; it runs into the light first.
      const dOut = smoothstep(TOTAL - 150, TOTAL - 46, s), locoD = lerp(-32, LOCO_D, smoothstep(S0, S0 + 46, s)) + 56 * dOut - 4 * onMtnAt(s) * openAt(s);   // on the helix the driver stands further forward over the boiler: only the smokebox and funnel show below the view of the table
      const blueOff = lerp(lerp(215, 196, smoothstep(preLen + 40, tunA0, s)), 128, smoothstep(tunA0 - 110, tunB0 - 10, s)) + 73 * dOut;
      hero.setRide(locoD + 13, blueOff, !ctx.through, 15);   // the smoke lifts clear over the driver's head
      // our headlamp cone over whatever it meets
      cl(Math.min(s + Math.max(locoD + 13.6, 13), TOTAL - 1), _t0, _t1);   // (while the engine is still drawing up from behind, the lamp's light already runs ahead of the eye)
      va.copy(_t0).setY(_t0.y + 7.9).applyMatrix4(T2H); const inHB = s > preLen + hero.tunnel.s0 - 42 && s < preLen + hero.tunnel.s1 + 2, inBore = s < S_MOUTH || inHB, fa = inBore ? 0.24 : 0.07;   // an oil lamp: it wavers, most visibly on tunnel walls
      U.uHeadP.value.set(va.x, va.y, va.z, headI * (inHB ? 1.5 : inBore ? 2.6 : 1) * (1 - fa + fa * Math.sin(time * 9.5) * Math.sin(time * 3.1 + 1.0))); U.uHeadD.value.copy(_t1).transformDirection(T2H);
      // lightning (storm nights): two eased strokes every 6.5 s, and one as the attic is revealed
      let fl = 0;
      if (lookId === 'storm') { const ph = (time + stormOff) % 6.5; fl = Math.min(1, pulse(ph - 1) + 0.7 * pulse(ph - 1.5) + pulse(tw - T_REVEAL) + 0.6 * pulse(tw - T_REVEAL - 0.5)) * 1.5; }
      U.uFlash.value = fl; OU.uFlash.value = fl; OU.uTime.value = time;
      // the reveal: shaft and dust come up as the line leaves the lake, the light-animals as it leaves the table
      const rev = smoothstep(S_BR1 - 40, S_BR1 + 100, s);
      shaftVis.value = look.shaft * lerp(0.07, 1, rev); dustMoonI.value = look.moonI * lerp(0.2, 1, rev);
      const ck = smoothstep(S_BR1 + 20, S_BR1 + 110, s) * (1 - 0.55 * smoothstep(preLen + 30, preLen + 230, s));
      AU.uFill.value = look.fill * lerp(0.2, 1, rev); AU.uPre.value = lerp(0.2, 1, rev);   // before the reveal the roof is only the faintest umber above the town: a room sensed, not read U.uMtnFill.value = lx.mtn * lerp(preFill, 1, rev); AU.uGabI.value = lx.gabI * lerp(0.25, 1, rev);
      amb.setOpacity(lerp(0.3, 0.55, rev)); mouseU.uTime.value = time; beaconU.uTime.value = time;
      AU.uCookieI.value = ck * cookieK; AU.uCookieRot.value = time * 0.03; AU.uWash.value = washK * lerp(0.05, 1, rev); AU.uLampI.value = (0.55 + 0.08 * Math.sin(time * 9) * Math.sin(time * 2.3)) * lx.lamp * lerp(0.15, 1, rev);
      { const fv = smoothstep(S_BR1 + 10, S_BR1 + 120, s) * fairyK; AU.uFairyI.value = fv * (0.92 + 0.08 * Math.sin(time * 1.7)); fairyGlow.value = look.glow * fv; }   // the Christmas lights come on with the reveal
      const adapt = smoothstep(TOTAL - 270, TOTAL - 110, s);
      U.uMoonI.value = look.moonI * lerp(1, 0.48, adapt); U.uGlow.value = look.glow * lerp(1, 0.7, adapt) * lerp(preGlow, 1, rev);   // the eye adapts as we climb into the shaft
      hero.update(dt, time, camera);
      beaconU.uI.value = (0.42 + 0.05 * Math.sin(time * 1.7)) * lerp(0.45, 1, rev) * (1 - 0.6 * smoothstep(TOTAL - 150, TOTAL - 40, s)) * (lookId === 'afternoon' ? 0.7 : 1) * (0.8 + 0.25 * U.uPortalI.value);
      U.uPortalI.value *= lerp(0.4, 0.9, smoothstep(preLen - 120, preLen + 80, s));
      camP.setFromMatrixPosition(camera.matrixWorld);

      // Ferris wheel, its double in the glass, the bulbs on its rim
      const wa = time * 0.32;
      MZ.makeBasis(wheelAx, UP, wheelAl).setPosition(wheelHub); MZ.multiply(MT.makeRotationX(wa)); setI(wheel, 0, MZ); wheelM.setMatrixAt(0, M2); wheelM.instanceMatrix.needsUpdate = true;
      for (let k = 0; k < 16; k++) { const a = wa + (k / 16) * TAU, cy = Math.cos(a) * WR, cz = Math.sin(a) * WR; ptsLake.set(k, wheelHub.x + wheelAx.x * 3.4 + wheelAl.x * cz, wheelHub.y + cy, wheelHub.z + wheelAx.z * 3.4 + wheelAl.z * cz); }
      ptsLake.pa.needsUpdate = true;
      // clockwork cars round the block
      for (let i = 0; i < N_CARS; i++) {
        const d = carPh[i] + time * carSp[i], yaw = blockAt(d, zp), y = blockH[Math.floor((((d % blockL) + blockL) % blockL) / 3) % blockH.length];
        MZ.makeRotationY(yaw).setPosition(zp.x, y, zp.z); setI(cars, i, MZ); ptsMain.set(DI.car + i, zp.x + Math.sin(yaw) * 4.3, y + 2.2, zp.z + Math.cos(yaw) * 4.3);
      }
      for (let i = 0; i < N_ST; i++) {
        const d = (((i * stL * 0.5 + 40 + time * 10.5) % stL) + stL) % stL, yaw = stAt(d, zp), y = stH[Math.floor(d / 3) % stH.length];
        MZ.makeRotationY(yaw).setPosition(zp.x, y, zp.z); setI(cars, N_CARS + N_WAIT + i, MZ); ptsMain.set(DI.scar + i, zp.x + Math.sin(yaw) * 4.3, y + 2.2, zp.z + Math.cos(yaw) * 4.3);
      }
      // the airship circling the mountain on its thread; on rare nights the cat bats it away
      const phi = zepPhi0 + ZEP_W * (tw - T_ZEP) + (uu > 0 ? 0 : time * 0.2), R = zepR + 3 * Math.sin(time * 0.7);
      zp.set(HERO_POS.x + R * Math.cos(phi), zepY + 2 * Math.sin(time * 0.9), HERO_POS.z - R * Math.sin(phi)); zt.set(-Math.sin(phi), 0, -Math.cos(phi));
      let spin = 0, wild = false;
      if (rare) {
        const d = tw - T_BAT;
        if (d < 0) { zp.set(hover.x + 3 * Math.sin(time * 0.5), hover.y + 1.5 * Math.sin(time * 0.8), hover.z + 2 * Math.sin(time * 0.37)); zt.set(1, 0, 0); }
        else { const k = smoothstep(0, 4.5, d); vc.copy(hover); vc.y += 34 * Math.sin(k * Math.PI); vd.copy(zp); zp.lerpVectors(vc, vd, k); spin = 24 * (1 - Math.exp(-d * 0.7)); wild = d < 7; }
      }
      MZ.makeRotationY(Math.atan2(zt.x, zt.z) + spin); MZ.multiply(MT.makeRotationZ(0.09 * Math.sin(time * 1.1) + (wild ? 0.5 * Math.sin(time * 6) : 0))); MZ.setPosition(zp); setI(zep, 0, MZ);
      if (wild && Math.floor(time * 5) % 2) ptsMain.hide(DI.zep); else ptsMain.set(DI.zep, zp.x, zp.y - 6.4, zp.z);
      zl.subVectors(pivot, vc.copy(zp).setY(zp.y + 3.5)); const tl = zl.length(); zl.divideScalar(tl);
      MZ.compose(vd.copy(vc).addScaledVector(zl, tl / 2), _q4.setFromUnitVectors(UP, zl), _s3.set(0.45, tl, 0.45)); setI(sticks, 0, MZ);
      // grandfather clock pendulum, catching a glint as it passes the middle
      const pa = 0.2 * Math.sin(time * Math.PI);
      MZ.makeRotationZ(pa).setPosition(pendP.x + Math.sin(pa) * 39, pendP.y - Math.cos(pa) * 39, pendP.z); MZ.multiply(MT.makeScale(1.3, 78, 1.3)); setI(sticks, 1, MZ);
      vc.set(pendP.x + Math.sin(pa) * 80, pendP.y - Math.cos(pa) * 80, pendP.z);
      MZ.makeRotationZ(pa).setPosition(vc); MZ.multiply(MT.makeScale(10, 10, 1.8)); setI(sticks, 2, MZ);
      if (Math.abs(pa) < 0.06) ptsMain.set(DI.pend, vc.x, vc.y, vc.z - 1.4); else ptsMain.hide(DI.pend);
      // the station's own life: bunting lifting in the draught of the trains, a lamp swinging under the canopy, two passengers waving
      for (let k = 0; k < N_PEN; k++) {
        const fl = 0.35 * Math.sin(time * 2.6 + k * 0.9) + 0.25 * Math.sin(time * 4.3 + k * 2.1);
        MZ.makeRotationX(fl).setPosition(STN.x - 28.5 + k * 3, STN.y + 10.45, 147.6); MZ.multiply(MT.makeTranslation(0, -0.85, 0)); MZ.multiply(MT.makeScale(1.5, 1.6, 0.08)); setI(sticks, SK.pen + k, MZ);
      }
      for (let k = 0; k < 2; k++) {
        const w = wavers[k]; if (!w) { MZ.makeScale(0, 0, 0); setI(sticks, SK.arm + k, MZ); continue; }
        MZ.makeRotationX(2.5 + 0.55 * Math.sin(time * 6.5 + w.ph)).setPosition(w.x - 0.52, w.y, w.z); MZ.multiply(MT.makeTranslation(0, -0.5 * w.sc, 0)); MZ.multiply(MT.makeScale(0.17, 1.0 * w.sc, 0.22)); setI(sticks, SK.arm + k, MZ);
      }
      { const la = 0.22 * Math.sin(time * 1.9), lx0 = STN.x + 2, ly0 = STN.y + 11.2, lz0 = 150.6;
        MZ.makeRotationX(la).setPosition(lx0, ly0, lz0); MZ.multiply(MT.makeTranslation(0, -1.3, 0)); MZ.multiply(MT.makeScale(0.1, 2.6, 0.1)); setI(sticks, SK.lamp, MZ);
        MZ.makeRotationX(la).setPosition(lx0, ly0, lz0); MZ.multiply(MT.makeTranslation(0, -3.0, 0)); MZ.multiply(MT.makeScale(0.9, 1.1, 0.9)); setI(sticks, SK.lamp + 1, MZ);
        ptsMain.set(DI.slamp, lx0, ly0 - 3.0 * Math.cos(la), lz0 - 3.0 * Math.sin(la) - 0.6); }
      // lantern balloons swaying on their tethers, each with its burner's glow
      for (let k = 0; k < N_BAL; k++) {
        const p = BAL[k], bx = p.x + 3.2 * Math.sin(time * 0.4 + k * 1.7), by = p.y + 1.6 * Math.sin(time * 0.63 + k * 2.3), bz = p.z + 3.2 * Math.cos(time * 0.33 + k);
        MZ.makeRotationZ(0.05 * Math.sin(time * 0.4 + k * 1.7 + 1.2)).setPosition(bx, by, bz); setI(balloons, k, MZ); ptsMain.set(DI.bal + k, bx, by - 15.6, bz);
        vc.set(bx, by - 21.9, bz); vd.set(p.x, balG[k], p.z); zl.subVectors(vd, vc); const tl2 = zl.length(); zl.divideScalar(tl2);
        MZ.compose(vd.copy(vc).addScaledVector(zl, tl2 / 2), _q4.setFromUnitVectors(UP, zl), _s3.set(0.3, tl2, 0.3)); setI(sticks, SK.teth + k, MZ);
      }
      // swans gliding in slow rings (the mirror shares their matrices)
      for (let k = 0; k < 6; k++) { const c = swanC[k], d = k % 2 ? -1 : 1, a = d * time * (0.9 / c[2]) + k * 1.9; MZ.makeRotationY(Math.atan2(-d * Math.sin(a), d * Math.cos(a))).setPosition(c[0] + Math.cos(a) * c[2], LY - 0.1 + 0.06 * Math.sin(time * 2 + k), c[1] + Math.sin(a) * c[2]); MZ.multiply(MT.makeScale(1.25, 1.25, 1.25)); setI(swans, k, MZ); }
      // toy rockets: one climbing spark, then a ring of sparks that spreads, sinks and goes out one by one
      for (let b = 0; b < N_FW; b++) {
        const st = fwSites[b], tau = (((time + b * (FW_P / N_FW) * 2.1) % FW_P) + FW_P) % FW_P, o = b * (FW_N + 1), te = tau - 0.8;
        if (tau < 0.8) { const f = tau / 0.8; ptsFire.set(o + FW_N, st[0], lerp(8, st[1], 1 - (1 - f) * (1 - f)), st[2]); } else ptsFire.hide(o + FW_N);
        for (let i = 0; i < FW_N; i++) {
          if (te < 0 || te > fwLife[i]) { ptsFire.hide(o + i); continue; }
          const R = 21 * (1 - Math.exp(-2.4 * te));
          ptsFire.set(o + i, st[0] + fwDir[i * 3] * R, st[1] + fwDir[i * 3 + 1] * R - 2.6 * te * te, st[2] + fwDir[i * 3 + 2] * R);
        }
      }
      ptsFire.pa.needsUpdate = true;
      // rocking horse, lamp shade
      const ha = 0.05 * Math.sin(time * 1.15);
      MZ.makeRotationY(horseYaw).setPosition(HORSE); MZ.multiply(MT.makeTranslation(-92 * ha, 94, 0)); MZ.multiply(MT.makeRotationZ(ha)); MZ.multiply(MT.makeTranslation(0, -94, 0)); setI(horse, 0, MZ);
      MZ.makeRotationY(-time * 0.176).setPosition(LAMP); setI(shade, 0, MZ);
      MZ.makeRotationY(time * 0.42).setPosition(CARO); MZ.multiply(MT.makeScale(1.4, 1.4, 1.4)); setI(carousel, 0, MZ);
      MZ.makeRotationY(time * 0.7).setPosition(TOP.x + 9 * Math.cos(time * 0.23), TOP.y, TOP.z + 9 * Math.sin(time * 0.31)); MZ.multiply(MT.makeRotationZ(0.13 + 0.04 * Math.sin(time * 0.9))); MZ.multiply(MT.makeRotationY(time * 9)); setI(spinTop, 0, MZ);
      MZ.makeRotationY(Math.atan2(millAx.x, millAx.z)).setPosition(millHub); MZ.multiply(MT.makeRotationZ(time * 0.55)); MZ.multiply(MT.makeScale(1.4, 1.4, 1.4)); setI(sails, 0, MZ);
      // the sitter's eye(s): open as we come abeam, follow the train for three seconds, close
      const de = tw - T_EYE, open = smoothstep(0, 0.45, de) * (1 - smoothstep(3.0, 3.6, de));
      eyes.visible = open > 0.01;
      if (sitter === 'cat') {
        const slit = eyes.children[0], bx = CAT.x + 19.5;
        slit.scale.y = Math.max(0.02, open * (0.8 + 0.2 * Math.sin(time * 2.2))); slit.position.x = bx + clamp((camP.x - bx) / 60, -1, 1) * 1.1;
        if (open > 0.25) ptsMain.set(DI.eye, slit.position.x, slit.position.y, slit.position.z - 0.6); else ptsMain.hide(DI.eye);
        if (paw) {
          const d = tw - T_BAT, up = smoothstep(-0.8, -0.15, d) * (1 - smoothstep(0.6, 1.5, d)), sw = smoothstep(-0.15, 0.12, d);
          MZ.makeRotationX(-(0.2 + 1.05 * sw)).setPosition(CAT.x + 15, CAT.y + 5, CAT.z - 11); MZ.multiply(MT.makeScale(1, Math.max(0.001, up) * 1.9, 1)); setI(paw, 0, MZ);
        }
      } else {
        const target = open > 0.05 ? Math.atan2(-(camP.x - OWL.x), -(camP.z - OWL.z)) : 0.9 * Math.sin(time * 0.45);
        headYaw += (target - headYaw) * Math.min(1, dt * 4);
        MZ.makeRotationY(headYaw).setPosition(OWL.x, OWL.y + 30, OWL.z); setI(owlHead, 0, MZ);
        eyes.rotation.y = headYaw; eyes.scale.y = Math.max(0.02, open);
        for (let k = 0; k < 2; k++) { vc.set(k ? 2.9 : -2.9, 0.9, -7.6).applyAxisAngle(UP, headYaw); if (open > 0.25) ptsMain.set(k ? DI.eye2 : DI.eye, OWL.x + vc.x, OWL.y + 30 + vc.y, OWL.z + vc.z); else ptsMain.hide(k ? DI.eye2 : DI.eye); }
      }
      // the mouse running ahead in the headlamp, veering into its hole at the mouth
      const inTun = s < S_MOUTH + 10; mouse.visible = inTun; mouseSh.visible = inTun;
      if (inTun) {
        const sm = Math.min(s + 13 + 1.5 * Math.sin(time * 2.1), S_MOUTH - 3), v = smoothstep(S_MOUTH - 25, S_MOUTH - 4, sm), sc = 1 - 0.9 * smoothstep(0.75, 1, v);
        frameOf(pre, sm, MZ); MZ.multiply(MT.makeTranslation(lerp(-4.9, -6.7, v), -0.75 + 0.4 * Math.abs(Math.sin(time * 17)), 0)); MZ.multiply(MT.makeRotationY(-0.9 * Math.sin(v * Math.PI)));
        MZ.multiply(MT.makeScale(sc * 0.6, sc * 0.6 * (1 + 0.12 * Math.sin(time * 34)), sc * 0.6)); mouse.matrix.copy(MZ);
        const near = 1 + 0.9 * smoothstep(S_MOUTH - 40, S_MOUTH - 12, s);                      // the shadow grows up the wall as the lamp closes on the mouse
        frameOf(pre, Math.min(sm + 11, S_MOUTH), MZ); MZ.multiply(MT.makeTranslation(6.85, -0.6 + 0.5 * Math.abs(Math.sin(time * 17)), 0)); MZ.multiply(MT.makeScale(1, 2.1 * near * sc, 1.5 * sc)); mouseSh.matrix.copy(MZ);
        mouseSh.visible = sm + 11 < S_MOUTH - 1;
      }
      // signals drop from red to green as we approach
      for (let k = 0; k < signals.length; k++) { const sg = signals[k], green = s > sg.s - 150; ptsMain.set(DI.sig + k * 2 + (green ? 1 : 0), sg.x, green ? sg.yG : sg.yR, sg.z + 0.6); ptsMain.hide(DI.sig + k * 2 + (green ? 0 : 1)); }
      ptsMain.pa.needsUpdate = true;
      amb.update(dt, time, camera); if (moths) moths.update(dt, time, camera, uu); if (birds) birds.update(dt, time, camera, uu);
    }
    update(0, 0, { matrixWorld: new THREE.Matrix4().setPosition(eyePts[0]) }, 0);

    const summitT = hero.anchors.summit.clone().applyMatrix4(H2T);
    const tunA = preLen + hero.tunnel.s0, tunB = preLen + hero.tunnel.s1;
    cl(Math.min(tunB + 22, TOTAL - 1), _t0, _t1); const boreExit = _t0.clone().setY(_t0.y + 7);
    cl(tunA + 3, _t0, _t1); _t2.crossVectors(_t1, UP).normalize(); const mouthP = _t0.clone().addScaledVector(_t2, 11).setY(_t0.y + 9);   // the open-side jamb of the summit bore's mouth
    // the reveal's gaze: first up the west face to the summit horn in the shaft, then (from the trestle, where the round window clears the mountain) summit, shaft and oculus together
    const REV_A = summitT.clone().lerp(OCULUS, 0.1).setY(96), REV_B = summitT.clone().lerp(OCULUS, 0.42).setY(150), revP = V3(0, 0, 0);
    const uRA = uOfS(S_EDGE - 120), uRB = uOfS(S_EDGE - 10);
    // the helix's gaze: out of the open side and down (the mill hamlet, the goods train below, the attic floor), swinging round to the lake, the wheel and the town
    const TABLE = V3(-120, 0, -50), gzP = V3(0, 0, 0), gzT = V3(0, 0, 0), gzR = V3(0, 0, 0), uT0 = uOfS(preLen + 205), uT1 = uOfS(preLen + 258), uG0 = uOfS(preLen + 70), uG1 = uOfS(preLen + 175);
    const helixGaze = (time, u) => {
      cl(sOfU(u), gzP, gzT); gzT.setY(0).normalize(); gzR.crossVectors(gzT, UP);
      const k = smoothstep(uG0, uG1, u);                                   // first down the line to the mill hamlet, then out to the side
      gzP.addScaledVector(gzT, 215).addScaledVector(gzR, lerp(40, 168, k)).setY(gzP.y - lerp(42, 66, k));
      return gzP.lerp(TABLE, smoothstep(uT0, uT1, u));
    };
    const pois = [
      { at: V3(WHEEL.x, 5, WHEEL.z), from: uOfS(S_BR0 - 80), to: uOfS(S_BR1 + 4), weight: 0.86 },                       // the whole wheel and its double in the glass
      { at: (time, u) => revP.lerpVectors(REV_A, REV_B, smoothstep(uRA, uRB, u)), from: uOfS(S_BR1 - 30), to: uOfS(preLen + 6), weight: 0.78, fade: 0.2 },   // the reveal, held
      { at: SIT, from: uOfS(S_APEX - 70), to: uOfS(S_APEX + 45), weight: sitter === 'cat' ? 0.4 : 0.26 },                // a glance at the sitter as its eye opens
      { at: V3(655, 60, 205), from: uOfS(preLen - 74), to: uOfS(preLen + 104), weight: 0.8, fade: 0.3 },   // onto the mountain: out of the open side to the east gable (the lit dolls' house under the moon window, the airship before it), the rock face left behind the shoulder           // onto the mountain: a glance at the moon window, the airship hanging before it
      { at: helixGaze, from: uOfS(preLen + 56), to: uOfS(tunA - 16), weight: 0.62, fade: 0.14 },                          // then down across the table
      { at: mouthP, from: uOfS(tunA - 62), to: uOfS(tunA + 1), weight: 0.66, fade: 0.3 },      // the gaze comes round to the stone mouth well before it, keeping to its open side: the arch and its garland in the middle, the table still beside it
      { at: boreExit, from: uOfS(tunA - 14), to: uOfS(tunB + 4), weight: 0.55, fade: 0.3 },   // the gaze comes round to the stone mouth well before it: the bore is entered looking down its string of coloured bulbs, not at its jamb
      { at: OCULUS.clone().setY(OCULUS.y - 16), from: uOfS(tunB - 4), to: uOfS(TOTAL - 118), weight: 0.42 },             // out of the bore, up into the shaft: the moon ahead through the silver dust
      { at: seatT.clone(), from: uOfS(tunB + 30), to: uOfS(TOTAL - 150), weight: 0.35 },                                 // the lit arch already pulls the eye, the blue engine's tail lamp running toward it
      { at: seatT.clone(), from: uOfS(TOTAL - 160), to: 1, weight: 0.75, fade: 0.2 },                                    // round the last curve: the lit arch, and nothing else, to the end
    ];
    // linger where the pictures are (the reveal from the trestle, the table from the north side of the helix); move on through the links
    const pace = (u) => 1 - 0.24 * bell(u, 0.43, 0.6, 0.35) + 0.16 * bell(u, 0.6, 0.72, 0.35) - 0.3 * bell(u, 0.72, 0.81, 0.35) + 0.2 * bell(u, 0.8, 0.87, 0.35);
    const titles = { midnight: 'The Attic Line', afternoon: 'The Attic Line, Late Afternoon', predawn: 'The Attic Line Before Dawn', storm: 'The Attic Line, Storm Night' };

    return {
      scene, path, duration, pace, title: titles[lookId],
      ride: 'none', style: 'none',            // the world carries its own engine under the camera
      camera: { fov: 62, near: 0.3, far: 2600, lookAhead: 24, sway: 0.35, bank: 0.3 },
      pois,
      portal: { shape: 'arch', width: 14, height: 15.5, color: '#ffd9a0', glow: 0.55, revealDistance: 380 },
      post: { exposure: look.exposure, bloom: { strength: 0.55, radius: 0.7, threshold: 0.9 },
        grade: { saturation: lookId === 'afternoon' ? 0.96 : 1.1, contrast: 1.07, tint: look.tint, shadowTint: look.shadow, vignette: 0.42, grain: 0.03, aberration: 0 } },
      update,
      dispose() { cookie.dispose(); hero.dispose?.(); },
    };
  },
};
