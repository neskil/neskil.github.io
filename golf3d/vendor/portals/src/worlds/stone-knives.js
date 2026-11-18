// THE FOREST OF KNIVES (stone-knives)
// A Madagascan tsingy travelled the way its sifakas travel it. World space is the hero's local space (the exit
// portal's foot on the canyon stream is the origin, we fly north = -Z, west and the evening sun are -X).
//   u 0.00-0.04  in from 6 m over a knife-edged crest: the whole sea of blades, the Cathedral dead ahead, the lead
//                sifaka hopping the crest below us
//   u 0.04-0.13  two long dropping leaps off the end of the crest, 13 m down among the blades; on the second the
//                lens looks down between two lit blades and a sifaka crosses the gap 7 m ahead (u 0.08)
//   u 0.13-0.33  six bounds from tip to tip down a street between blades that stand 12 to 15 m over the eye, their
//                crowns in the low sun and their bodies in violet shade; the lead sifaka one tip ahead turns to
//                face us on every landing, the troop leaps in relay on both hands; on the fourth bound (u 0.16-
//                0.19) the companion flies feet-first beside the lens with two more out on either hand; parrots
//                cross the strip of sky overhead (u 0.125); a gate of two cross-set blades (u 0.275). The street
//                is lived in: every few metres a ledge with a Pachypodium in flower, sifakas of its own that
//                leap between holds on the flanks on a loop of wall time, petals and dry leaves streaming past
//                the lens, swifts low between the blades, gusts of light on the crowns. Read from a few metres
//                the flanks are limestone in courses: razor crests with a lit edge, dark runnels that start afresh
//                in every bed, bedding slits with a lit lip, tafoni, grey and orange lichen, rust under the joints.
//                On a wide ledge in the view at u 0.16 stands a bottle tree (a Pachypodium twice the size of the rest).
//   u 0.225-0.34 the hawk (a harrier-hawk; at dawn a fish eagle, at blue hour an owl) comes over from behind, flares
//                7 m ahead of the lens (u 0.25) and glides nose-high 9 to 12 m ahead and a little below it (u 0.265-
//                0.32), then lifts away to the right over the lip; under it two sifakas drop from hold to hold (in
//                the air at u 0.305) and on toward the fissure; a sifaka leaps across the street 7 m ahead (u 0.34)
//   u 0.33-0.38  the troop cascades into the fissure; a last level bound to the lip
//   u 0.38-0.54  the plunge down the fissure between fluted, ferned walls (beds that step at master joints, honeycombed
//                patches, runnels cut deep and dark): the lead sifaka drops from one hanging fig root to the next
//                5 to 8 m ahead of the lens (u 0.39-0.55; on the last it clings in three-quarter profile at u 0.55,
//                then leaps up to the wall and is gone by u 0.57), the rest go down wall to wall further ahead,
//                clinging flank-on; seven vasa parrots come up at us (u 0.37), fill the slit (u 0.40) and part
//                round the lens (u 0.415); a sifaka dives wall to wall down the gaze 7 m ahead of the lens, in the
//                air at u 0.43, 0.455, 0.48 and 0.505. Beds stand out of the walls as ledges with ferns on them and
//                rootlets off their lips, and lianas hang from the walls past the lens. At dawn the fissure holds mist
//                in violet shade (no sun reaches it): thin beside the lens, deepening down the slot, and green where
//                the pocket shows through it from the lip on; we come out under it at u 0.47
//   u 0.54-0.68  pull-out through fig leaves into the emerald pocket: the pocket is lit (bounce off the walls, sky
//                strip, backlit leaves, emerald haze down the canyon), its shade sits near palette[5], not black;
//                the gold comes down the sunward (east) wall as a band above the shade
//   u 0.68-0.80  the canyon: lemurs on a limb (u 0.70), the bats' cave in the alcove on the right (a ragged solution
//                opening under a hooded, fluted lip of the wall's own stone, ferns and rootlets on it), its ribbon
//                of bats turning in a hairpin under the strip of sky (u 0.765) and passing overhead (u 0.79); the
//                boulders are tilted karren slabs with knife crests and runnels, dark and mossy at the foot. A waterfall
//                comes down the left wall in a thread from 33 m, breaks on a ledge and fans to the bank in spray (seen
//                ahead from u 0.70, whole at u 0.745-0.80, passed at u 0.83); ledges at three heights along both walls
//   u 0.80-0.89  the fossa on its fallen trunk: stands three-quarters on (u 0.836-0.856), turns and bolts for the
//                root plate (u 0.859-0.874, whole in the frame beside the portal at u 0.87), leaps down. Over it a
//                fallen blade lies wedged across the gorge (seen from u 0.80, passed under at u 0.90): five sifakas
//                sit along its crest against the strip of sky and a sixth leaps from one notch to the next
//   u 0.89-1.00  straight into the keyhole under the rock bridge, between columns of fig root that come down from
//                the Cathedral on both hands; a sifaka waiting on a root beside the portal
// Looks by seed (ctx.vary.hour is honoured): late gold (dry season), dawn (rose-gold sun flat on the top third of every
// face turned to it, a hard terminator down each blade, violet bodies; the mist a sea a few metres under the street, its
// billows lit on the sunward side, long shadows lying across it),
// blue hour under the risen full moon, and the first rains (storm sky, rainbow in the east, wet stone, green flush).
// Rare event (ctx.vary.rare): the right blade of the gate is cracked through: from u 0.228 its top 7 m leans out, breaks
// (dust at the break, u 0.24-0.25) and falls into the slot (gone by u 0.275, dust coming up beside the street ahead),
// six parrots flushed past the lens.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/stone-knives.js';

const PAL = ['#8C8F98', '#F6C469', '#463C68', '#E8C7A0', '#2FA45C', '#10312A', '#F4EEE2'];
const TAU = Math.PI * 2;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const C = (h) => new THREE.Color(h);

// ---------------------------------------------------------------------------------------------- the four looks
// sun: [elevation, azimuth] (kit convention: azimuth 0 = -Z, +90 = +X); null keeps the hero's own direction.
const LOOKS = {
  gold: {
    hour: 'gold', weather: 'dry', title: 'Forest of Knives',
    sky: { preset: 'goldenHour', zenith: '#2f5596', mid: '#8d92b6', horizon: '#eac49a', ground: '#b9997f', scatterColor: '#ffab58', scatter: 0.8, scatterPow: 3,
      sunColor: '#ffc880', sunIntensity: 12, sunSize: 1.6, clouds: { coverage: 0.3, lit: '#ffc690', shade: '#80699a', silver: 1.4, scale: 1.4 }, clouds2: { lit: '#ffdcb8', shade: '#b294a2', opacity: 0.3 } },
    moon: { elevation: 7, azimuth: 31, size: 2.3, color: '#ffe6c4', intensity: 0.8, glow: 0.2, phase: 1 },
    fog: '#d6ae90', fogD: 0.00055, haze: 0.0009,
    sun: ['#ffc272', 2.9], hemi: ['#9a90cc', '#4a3c55', 1.25],
    strip: [1.15, 0.98, 0.66], bounce: [0.06, 0.25, 0.16], pocketFog: '#2c9660', pocketD: 0.008, pocket: 1, deep: [0.125, 0.115, 0.18],
    leafy: false, exposure: 1.0, tint: '#fff5e8', shadowTint: '#14122c', portal: '#ffe9b8',
  },
  dawn: {
    hour: 'dawn', weather: 'dry', title: 'Forest of Knives at Dawn',
    sky: { preset: 'dawn', zenith: '#27488c', mid: '#8a8fc4', horizon: '#f4bfae', ground: '#d9c3c6', scatterColor: '#ffbe8c', scatter: 0.7, sunIntensity: 11,
      clouds: { coverage: 0.26, lit: '#ffd0c0', shade: '#6c6a98', scale: 1.3 } },
    sunDir: [10, 96], moon: null,
    fog: '#e3c6c2', fogD: 0.0007, haze: 0.001, mist: [20, 61, 0.07, 5], mistCol: [0.84, 0.63, 0.6], body: 0.6, bandLo: 66, term: 1, furLift: 1.35, furBand: 3,
    sun: ['#ffc8a4', 2.5], hemi: ['#96a0d8', '#5a5068', 1.3],
    strip: [1.05, 0.95, 0.9], bounce: [0.065, 0.25, 0.18], pocketFog: '#3a9a72', pocketD: 0.008, pocket: 1, deep: [0.128, 0.118, 0.182],
    leafy: false, exposure: 1.0, tint: '#fff4f0', shadowTint: '#141032', portal: '#ffe0d0',
  },
  blue: {
    hour: 'blue', weather: 'dry', title: 'Forest of Knives by Moonlight',
    sky: { preset: 'blueHour', zenith: '#070f34', mid: '#1a3684', horizon: '#5a6eb4', ground: '#2a3a70', scatterColor: '#f08a5c', scatter: 0.8, stars: 0.6,
      sunElevation: -5, sunAzimuth: -92, clouds: { coverage: 0.24, lit: '#7286c0', shade: '#1d2a56', scale: 1.4 } },
    sunDir: [17, 33], moon: { elevation: 17, azimuth: 33, size: 2.6, color: '#f4f0e4', intensity: 2.2, glow: 0.5, phase: 1 }, moonKey: true,
    fog: '#33437e', fogD: 0.0006, haze: 0.0011,
    sun: ['#a8bcff', 1.7], hemi: ['#5068c0', '#262c58', 1.9],
    strip: [0.5, 0.66, 1.05], bounce: [0.04, 0.2, 0.18], pocketFog: '#1e6866', pocketD: 0.0076, pocket: 0.9, deep: [0.075, 0.095, 0.175],
    leafy: false, exposure: 1.25, tint: '#eef2ff', shadowTint: '#0a1030', portal: '#cfe4ff',
  },
  rain: {
    hour: 'gold', weather: 'rain', title: 'Forest of Knives, First Rains',
    sky: { preset: 'goldenHour', zenith: '#27406e', mid: '#5c6488', horizon: '#d8b48c', ground: '#8f8478', scatterColor: '#ffb060', scatter: 0.9, scatterPow: 3,
      sunColor: '#ffcf8a', sunIntensity: 12, clouds: { coverage: 0.66, lit: '#f4c090', shade: '#3c3a5c', silver: 1.8, absorb: 2.1, scale: 1.2 }, clouds2: { lit: '#e8c8a8', shade: '#6a6480', opacity: 0.4 } },
    moon: null, rainbow: true,
    fog: '#a89a96', fogD: 0.0008, haze: 0.0012,
    sun: ['#ffc880', 2.8], hemi: ['#8088b8', '#3c3a4c', 1.2],
    strip: [0.95, 0.98, 0.8], bounce: [0.065, 0.27, 0.16], pocketFog: '#2f965e', pocketD: 0.0085, pocket: 1.1, deep: [0.115, 0.11, 0.17],
    leafy: true, exposure: 1.02, tint: '#fbf6ee', shadowTint: '#121226', portal: '#f2ffd8',
  },
};

// ---------------------------------------------------------------------------------------------- pocket shader
// One material for everything of ours in the forest pocket (and the few things we add on top).
//   aA = (kind, weight, phase, amplitude)   kind 0 stone (w = moss), 1 banana leaf, 2 fur, 3 leg, 4 tail, 5 head, 6 bark / stem (w = moss), 7 cave dark,
//        8 fern frond, 9 moss cushion, 10 fallen leaf / bracket fungus, 11 split heartwood
//   aB = pivot (legs, head) | (across -1..1, along 0..1, leaf id) for leaves | (around, along, 0) for bark
const POCKET_VERT = /* glsl */`
attribute vec3 color;
attribute vec4 aA;
attribute vec3 aB;
uniform float uTime;
uniform vec4 uWalk;
varying vec3 vW;
varying vec3 vN;
varying vec3 vC;
varying vec4 vA;
varying vec3 vB;
#include <fog_pars_vertex>
vec2 rot2(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(v.x * c - v.y * s, v.x * s + v.y * c); }
void main(){
  vec3 p = position; vec3 n = normal; float kind = aA.x; float sd = 0.0;
  mat4 mm = modelMatrix;
  #ifdef USE_INSTANCING
    mm = modelMatrix * instanceMatrix; sd = fract(instanceMatrix[3][0] * 0.37 + instanceMatrix[3][2] * 0.71);
  #endif
  if ((kind > 0.5 && kind < 1.5) || (kind > 7.5 && kind < 8.5)) {     // banana leaves and fern fronds stir
    float w = aA.y * aA.y;
    p += w * aA.w * vec3(sin(uTime * 1.3 + aA.z + sd * 30.0), 0.8 * sin(uTime * 1.9 + aA.z * 1.7 + sd * 17.0), cos(uTime * 1.1 + aA.z * 0.7));
  } else if (kind > 2.5 && kind < 3.5) {          // legs swing at the hip
    float a = uWalk.y * 0.62 * sin(uWalk.x + aA.z);
    p.yz = rot2(p.yz - aB.yz, a) + aB.yz; n.yz = rot2(n.yz, a);
    p.z += uWalk.y * aA.y * 0.06 * cos(uWalk.x + aA.z);
  } else if (kind > 3.5 && kind < 4.5) {          // tails: pendulums
    float w = aA.y * aA.y;
    p.x += w * aA.w * sin(uTime * 1.7 + sd * 40.0 + aA.z);
    p.z += w * aA.w * 0.35 * sin(uTime * 1.1 + sd * 23.0);
  } else if (kind > 4.5 && kind < 5.5) {          // heads look about (uWalk.z turns the fossa's head toward us)
    float a = 0.6 * sin(uTime * 0.7 + sd * 50.0) * smoothstep(0.3, 0.9, sin(uTime * 0.23 + sd * 31.0) * 0.5 + 0.5);
    #ifndef USE_INSTANCING
      a = a * (1.0 - uWalk.w) + uWalk.z * uWalk.w;        // the fossa (the one animal that is not instanced) turns its head to watch us
    #endif
    p.xz = rot2(p.xz - aB.xz, a) + aB.xz; n.xz = rot2(n.xz, a);
  }
  vec4 wp = mm * vec4(p, 1.0);
  vW = wp.xyz; vN = mat3(mm) * n; vC = color; vA = aA; vB = aB;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const POCKET_FRAG = /* glsl */`
uniform vec3 uTopCol, uBounce, uCam, uSunDir, uSunCol, uPortalCol;
uniform float uTime, uBandLo;
varying vec3 vW;
varying vec3 vN;
varying vec3 vC;
varying vec4 vA;
varying vec3 vB;
#include <fog_pars_fragment>
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y);
}
float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n3(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(h3(i), h3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 0.0)), h3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y);
  float b = mix(mix(h3(i + vec3(0.0, 0.0, 1.0)), h3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 1.0)), h3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y);
  return mix(a, b, f.z);
}
void main(){
  float kind = vA.x;
  vec3 toC = uCam - vW; float dist = length(toC); vec3 V = toC / max(dist, 1e-3);
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  if (!gl_FrontFacing) N = -N;
  vec3 alb = vC; float leaf = 0.0; float soft = 0.0;
  float nearK = 1.0 - smoothstep(10.0, 34.0, dist);
  // bark relief: ridges between furrows running along the limb. The height is worked out for every fragment, so its screen derivatives are defined everywhere.
  // (vA.z of a bark vertex: the number of ridge pairs round the limb when its mesh carries the same ridges, else 0)
  float bkW = vA.z > 0.5 ? 0.9 * sin(vB.y * 1.1 + vB.x * 6.2832) : 1.3 * vn(vec2(vB.x * 3.0 + 1.0, vB.y * 0.8));
  float bkPh = vB.x * 6.2832 * (vA.z > 0.5 ? vA.z : 4.0) + bkW + 0.6 * sin(vB.y * 2.3);
  float bkAA = 1.0 - smoothstep(0.3, 1.0, fwidth(bkPh));                       // a ridge narrower than a few pixels is not drawn at all: no wicker on a far limb
  float bkF = mix(0.6, abs(sin(bkPh)), bkAA);
  float bkH = smoothstep(0.0, 0.6, bkF) + 0.3 * vn(vec2(vB.x * 11.0, vB.y * 1.6)) * bkAA;
  vec3 dpx = dFdx(vW), dpy = dFdy(vW); float bhx = dFdx(bkH), bhy = dFdy(bkH);
  if (kind > 0.5 && kind < 1.5) {
    float t = vB.y, ax = abs(vB.x), id = vB.z;
    float cell = floor(t * 13.0 + id * 7.3), fr = fract(t * 13.0 + id * 7.3);
    float torn = step(fr, 0.11) * step(h2(vec2(cell, id + 0.5)), 0.6) * step(0.22 + 0.6 * h2(vec2(cell, id)), ax);
    if (torn > 0.5 && dist < 34.0) discard;
    alb = mix(alb * 1.5 + vec3(0.04, 0.07, 0.0), alb, smoothstep(0.03, 0.1, ax));
    alb *= 0.92 + 0.08 * sin(t * 70.0) * (1.0 - smoothstep(10.0, 26.0, dist));
    alb *= 0.8 + 0.4 * vn(vec2(ax * 3.0 + id, t * 5.0));
    leaf = 1.0;
  } else if (kind < 0.5) {                        // limestone blocks: the same grain on every face, runnels down the steep ones, moss caps with a crisp edge
    float n1 = n3(vW * 0.9), n2 = n3(vW * 3.7 + 5.0), n3v = n3(vW * 14.0);
    float steep = 1.0 - smoothstep(0.3, 0.75, abs(N.y));
    vec2 rdir = normalize(vec2(-N.z, N.x) + vec2(1e-4, 0.0));                  // runnels fall straight down every steep face
    float run = abs(sin(dot(vW.xz, rdir) * 8.0 + 3.0 * n1 + 1.5 * n2));
    alb *= (0.66 + 0.6 * n1) * (0.8 + 0.4 * n2) * mix(1.0, 0.86 + 0.28 * n3v, nearK);
    alb *= mix(1.0, 0.38 + 0.62 * smoothstep(0.0, 0.5, run), steep * (0.5 + 0.5 * nearK));
    alb *= 1.0 - 0.45 * smoothstep(0.62, 0.7, n3(vW * vec3(0.7, 2.6, 0.7) + 9.0)) * steep;     // bedding cracks
    float moss = smoothstep(0.44, 0.5, N.y * 0.7 + 0.45 * n1 + 0.14 * n2 - 0.24) * vA.w;
    alb = mix(alb, mix(vec3(0.03, 0.085, 0.03), vec3(0.11, 0.2, 0.05), n2) * (0.7 + 0.6 * n3v), moss * 0.95);
    soft = moss;
  } else if (kind > 5.5 && kind < 6.5) {          // bark: raised ridges between deep dark furrows running along the limb, moss on its upper side only
    float g = vn(vec2(vB.x * 5.0, vB.y * 1.6)), g2 = vn(vec2(vB.x * 9.0, vB.y * 2.1));          // grain stretched along the limb
    float fine = bkAA * (1.0 - smoothstep(9.0, 24.0, dist));
    alb *= (0.62 + 0.6 * g) * mix(1.0, 0.8 + 0.4 * g2, fine) * (mix(0.42, 0.22, step(0.5, vA.z)) + mix(0.58, 0.78, step(0.5, vA.z)) * smoothstep(0.08, 0.6, bkF));   // a plain limb's furrows are shallow
    alb *= 1.0 - 0.35 * fine * smoothstep(0.6, 0.66, vn(vec2(vB.x * 9.0, vB.y * 3.3 + 7.0)));         // cross cracks
    float moss = smoothstep(0.62, 0.74, N.y * 0.72 + 0.34 * g - 0.08) * vA.w;
    vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
    vec3 grad = (bhx * r1 + bhy * r2) * (det < 0.0 ? -1.0 : 1.0) / max(abs(det), 1e-7);
    float gl = length(grad);
    N = normalize(N - grad * (min(gl, 40.0) / max(gl, 1e-4)) * 0.06 * nearK * bkAA * (1.0 - moss));
    alb = mix(alb, mix(vec3(0.035, 0.1, 0.035), vec3(0.13, 0.23, 0.055), g2) * (0.7 + 0.5 * g), moss * 0.92);
    soft = moss;
  } else if (kind > 7.5 && kind < 8.5) {          // fern fronds: the outline and the gaps between the pinnae are cut here
    float t = vB.y, ax = abs(vB.x);
    float w = sin(3.1416 * clamp(t * 0.9 + 0.08, 0.0, 1.0));
    float pin = fract(t * 21.0 - ax * 2.4 + vB.z * 3.7);
    if (ax > w * (pin < 0.3 && dist < 26.0 ? 0.1 : 1.0)) discard;
    alb *= (0.8 + 0.5 * (1.0 - smoothstep(0.0, 0.14, ax))) * (0.75 + 0.5 * t);
    leaf = 0.7;
  } else if (kind > 8.5 && kind < 9.5) {          // moss cushions
    alb *= (0.55 + 0.9 * n3(vW * 21.0)) * (0.8 + 0.4 * n3(vW * 5.0));
    soft = 1.0;
  } else if (kind > 9.5 && kind < 11.5) {         // fallen leaves, bracket fungi, split heartwood: matt, with the grain of the thing
    alb *= 0.8 + 0.4 * vn(vec2(vB.x * 9.0, vB.y * 9.0));
    if (kind > 10.5) alb *= 0.72 + 0.28 * smoothstep(0.2, 0.5, abs(sin(vB.y * 40.0 + 3.0 * vn(vec2(vB.x * 4.0, vB.y * 4.0)))));
  } else if (kind < 6.5) {                        // fur
    alb *= 0.82 + 0.36 * vn(vW.xy * 37.0 + vW.z * 29.0);
  }
  float up = N.y * 0.5 + 0.5;
  float isFur = kind > 1.5 && kind < 5.5 ? 1.0 : 0.0;
  float furK = mix(0.75, 1.0, isFur);                      // stone, bark and leaves sit down in the shade; the animals catch the strip of sky
  vec3 light = uTopCol * furK * (0.22 + 0.98 * up * up) + uBounce * (0.6 + 0.5 * (1.0 - up));
  float sunVis = smoothstep(uBandLo - 4.0, uBandLo + 5.0, vW.y);
  light += uSunCol * sunVis * max(dot(N, uSunDir), 0.0);
  vec3 toP = vec3(0.0, 4.5, 0.0) - vW; float dP = length(toP);
  float pl = (1.0 - smoothstep(30.0, 80.0, dP)) / (1.0 + dP * dP * mix(0.012, 0.0035, isFur)) * (0.3 + 0.7 * max(dot(N, toP / max(dP, 1e-3)), 0.0));
  light += uPortalCol * pl;
  vec3 col = alb * light;
  float fr1 = 1.0 - max(dot(N, V), 0.0);
  col += (uTopCol * (0.25 + 0.75 * up) + uSunCol * sunVis * 0.4 + uPortalCol * pl) * fr1 * fr1 * fr1 * mix(0.2, 0.55, max(isFur, soft * 0.6));
  col += leaf * alb * uTopCol * vec3(0.9, 1.25, 0.35) * 0.8 * (1.0 - smoothstep(-0.7, 0.1, N.y));
  if (kind > 6.5 && kind < 7.5) col = vC * (uBounce + uTopCol * 0.25);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// The vasa parrots of the plunge: our own birds, flown by the script in update() (one instance each), wings beaten here.
//   aW = (0 body | 1 wing, side -1 | 1, distance out along the wing 0..1, 0)   aPh = (phase, beats per second)
const BIRD_VERT = /* glsl */`
attribute vec3 color;
attribute vec4 aW;
attribute vec2 aPh;
uniform float uTime;
varying vec3 vW;
varying vec3 vN;
varying vec3 vC;
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal;
  if (aW.x > 0.5) {                                // the wing turns about the shoulder; the outer half lags and folds on the upstroke
    float ph = uTime * aPh.y * 6.2832 + aPh.x, gl = aW.w;                                // aW.w = 1: a glider (the hawk), wings held in a shallow V and rocking
    float a = mix(0.15 + 0.95 * sin(ph), 0.13 + 0.1 * sin(ph), gl) * aW.y, a2 = a + mix(0.25 + 0.55 * sin(ph - 1.1), 0.1 + 0.07 * sin(ph - 1.1), gl) * aW.y * smoothstep(0.45, 0.6, aW.z);
    float ang = mix(a, a2, smoothstep(0.4, 0.65, aW.z));
    float c = cos(ang), s = sin(ang), sx = 0.09 * aW.y;
    vec2 q = vec2(p.x - sx, p.y - 0.04);
    p.x = sx + q.x * c - q.y * s; p.y = 0.04 + q.x * s + q.y * c;
    n.xy = vec2(n.x * c - n.y * s, n.x * s + n.y * c);
  }
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vW = wp.xyz; vN = mat3(modelMatrix * instanceMatrix) * n; vC = color;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BIRD_FRAG = /* glsl */`
uniform vec3 uTopCol, uBounce, uCam, uSunDir, uSunCol;
varying vec3 vW;
varying vec3 vN;
varying vec3 vC;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  if (!gl_FrontFacing) N = -N;
  vec3 toC = uCam - vW; vec3 V = toC / max(length(toC), 1e-3);
  float up = N.y * 0.5 + 0.5, fr = 1.0 - max(dot(N, V), 0.0);
  vec3 col = vC * (uTopCol * (0.25 + 0.9 * up * up) + uBounce * 0.7);
  col += vC * uSunCol * (0.3 + 0.7 * max(dot(N, uSunDir), 0.0) + 0.3 * fr * fr);   // the hawk, out in the low sun (black for the parrots of the fissure)
  col += uTopCol * 0.12 * fr * fr * fr * up * clamp(1.0 - 4.0 * dot(uSunCol, vec3(0.333)), 0.0, 1.0);                                             // a thin rim from the strip of sky on dark feathers
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// Rootlet curtains: hanging threads drawn as camera-facing ribbons that never get thinner than ~1.6 pixels.
const ROOTLET_VERT = /* glsl */`
attribute vec3 aNext;      // a point further down the strand
attribute vec3 aR;         // side (-1 | 1), weight 0 (top) .. 1 (tip), phase
uniform float uTime;
uniform vec2 uRes;
varying float vT;
#include <fog_pars_vertex>
vec3 swayed(vec3 p, float w, float ph){
  float k = w * w;
  return p + vec3(sin(uTime * 0.9 + ph + p.y * 0.21), 0.0, cos(uTime * 0.7 + ph * 1.3 + p.y * 0.17)) * k * 0.55;
}
void main(){
  vec3 p = swayed(position, aR.y, aR.z), q = swayed(aNext, min(aR.y + 0.12, 1.0), aR.z);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  vec4 c0 = projectionMatrix * mvPosition, c1 = projectionMatrix * modelViewMatrix * vec4(q, 1.0);
  vec2 d = (c1.xy / max(abs(c1.w), 1e-3) - c0.xy / max(abs(c0.w), 1e-3)) * uRes;
  d = d / max(length(d), 1e-4);
  float halfPx = max(0.016 * (1.0 - 0.6 * aR.y) * projectionMatrix[1][1] * uRes.y * 0.5 / max(c0.w, 0.05), 0.8);
  halfPx = min(halfPx, 5.0);
  c0.xy += vec2(-d.y, d.x) * aR.x * halfPx * 2.0 / uRes * c0.w;
  vT = aR.y;
  gl_Position = c0;
  #include <fog_vertex>
}`;
const ROOTLET_FRAG = /* glsl */`
uniform vec3 uTopCol, uBounce;
varying float vT;
#include <fog_pars_fragment>
void main(){
  vec3 col = mix(vec3(0.075, 0.055, 0.04), vec3(0.15, 0.12, 0.07), vT) * (uTopCol * 0.5 + uBounce * 0.9);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// The stream's surface detail, laid just over the hero's stream: drip and strider rings, floating leaves,
// sliding glints and the portal's light on the water. Premultiplied alpha.
const WATER_VERT = /* glsl */`
attribute vec2 aW;         // (metres across, metres along the stream)
varying vec2 vS;
varying vec3 vP;
#include <fog_pars_vertex>
void main(){
  vS = aW; vP = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WATER_FRAG = /* glsl */`
uniform float uTime;
uniform vec3 uStrip, uPortal, uLeafA, uLeafB, uBounce;
varying vec2 vS;
varying vec3 vP;
#include <fog_pars_fragment>
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y);
}
float rings(vec2 q, float k){
  float cell = floor(q.y / 2.7 + k * 0.5);
  vec2 c = vec2((h2(vec2(cell, k)) - 0.5) * 3.2, (cell + 0.5 - k * 0.5 + (h2(vec2(cell, k + 3.0)) - 0.5) * 0.4) * 2.7);
  float ph = fract(uTime * (0.22 + 0.2 * h2(vec2(cell, k + 5.0))) + h2(vec2(cell, k + 7.0)));
  float r = length(q - c), R = ph * 1.25;
  float w = 0.035 + 0.05 * ph;
  return ((1.0 - smoothstep(0.0, w, abs(r - R))) + 0.6 * (1.0 - smoothstep(0.0, w, abs(r - R * 0.55)))) * (1.0 - ph) * (1.0 - ph);
}
void main(){
  float lat = vS.x, s = vS.y;
  float edge = 1.0 - smoothstep(1.5, 2.6, abs(lat) + 0.5 * vn(vec2(s * 0.3, 2.0)));
  float flow = s - uTime * 0.7;
  vec3 col = vec3(0.0); float a = 0.0;
  float rg = rings(vec2(lat, s), 0.0) + rings(vec2(lat, s), 1.0);
  col += uStrip * rg * 0.55; a += rg * 0.5;
  float sp = vn(vec2(lat * 2.6, flow * 0.9)) * vn(vec2(lat * 6.0 + 3.0, flow * 2.3 - uTime * 0.5));
  float glint = smoothstep(0.36, 0.62, sp);
  col += uStrip * glint * 0.26; a += glint * 0.2;
  float dP = length(vP.xz);
  float wobP = (vn(vec2(s * 0.13, uTime * 0.22)) - 0.5) * 1.7 + 0.25 * sin(s * 0.9 - uTime * 1.6);
  float rp = vn(vec2(lat * 2.4, s * 0.8 - uTime * 1.3)) * vn(vec2(lat * 5.5 + 3.0, s * 2.1 - uTime * 2.2));
  float pl = (1.0 - smoothstep(8.0, 160.0, dP)) * (1.0 - smoothstep(0.2, 0.85, abs(lat + wobP))) * smoothstep(0.1, 0.38, rp);
  col += uPortal * pl * 1.1; a += pl * 0.3;
  float cell = floor(flow / 1.7);
  vec2 lc = vec2((h2(vec2(cell, 11.0)) - 0.5) * 3.4 + 0.25 * sin(uTime * 0.6 + cell), (cell + 0.3 + 0.4 * h2(vec2(cell, 13.0))) * 1.7);
  vec2 l = vec2(lat, flow) - lc;
  float an = h2(vec2(cell, 17.0)) * 6.283 + uTime * 0.25 * (h2(vec2(cell, 19.0)) - 0.5);
  l = vec2(l.x * cos(an) - l.y * sin(an), l.x * sin(an) + l.y * cos(an));
  float lf = (1.0 - smoothstep(0.75, 1.0, length(l / vec2(0.11, 0.24)))) * step(h2(vec2(cell, 23.0)), 0.7);
  vec3 lcol = mix(uLeafA, uLeafB, h2(vec2(cell, 29.0))) * (uStrip * 0.55 + uBounce * 0.8) * (0.75 + 0.5 * (1.0 - smoothstep(0.0, 0.03, abs(l.x))));
  col = mix(col, lcol, lf); a = max(a, lf);
  a = clamp(a, 0.0, 1.0) * edge; col *= edge;
  #ifdef USE_FOG
    float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    col = mix(col, fogColor * a, ff);
  #endif
  gl_FragColor = vec4(col, a);
}`;

// The waterfall: threads of falling water (ribbons turned to the lens), the spray where they break (soft discs) and the
// runnel that carries the water over the bank to the stream. It stands in the shade of the wall: lit by the strip of sky only.
//   aR = (across -1..1, metres fallen, half width, 0) for a thread | (corner x, corner y, radius, 1) for spray | (across, metres along, 0, 2) for the runnel
const FALL_VERT = /* glsl */`
attribute vec4 aR;
attribute float aS;
uniform float uTime;
varying vec4 vR;
varying float vS;
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  float mode = aR.w;
  if (mode < 0.5) {
    vec3 toC = cameraPosition - p;
    vec3 sd = normalize(cross(vec3(0.0, 1.0, 0.0), toC) + vec3(1e-5, 0.0, 0.0));
    p += sd * aR.x * aR.z;
  }
  vec4 mvPosition = viewMatrix * vec4(p, 1.0);
  if (mode > 0.5 && mode < 1.5) {
    float g = 1.0 + 0.22 * sin(uTime * 0.9 + aS * 6.0);
    mvPosition.xy += aR.xy * aR.z * g;
    mvPosition.y += aR.z * 0.22 * sin(uTime * 0.55 + aS * 9.0);
  }
  vR = aR; vS = aS;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FALL_FRAG = /* glsl */`
uniform float uTime;
uniform vec3 uCol;
varying vec4 vR;
varying float vS;
#include <fog_pars_fragment>
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main(){
  float mode = vR.w, a = 0.0;
  vec3 col = uCol;
  if (mode < 0.5) {
    // the water gathers speed as it falls: the streaks stretch and run faster lower down
    float x = vR.x, sp = sqrt(max(vR.y, 0.0) + 0.6);
    float st = 0.6 * vn(vec2(x * 3.0 + vS * 17.0, sp * 5.5 - uTime * 2.6)) + 0.4 * vn(vec2(x * 7.0 + vS * 5.0, sp * 13.0 - uTime * 5.5));
    float edge = 1.0 - smoothstep(0.3, 1.0, abs(x));
    a = edge * smoothstep(0.26, 0.6, st + 0.28 * edge) * 0.94;
    col *= 0.72 + 0.55 * st;
  } else if (mode < 1.5) {
    float r2 = dot(vR.xy, vR.xy);
    a = exp(-r2 * 3.0) * (1.0 - smoothstep(0.7, 1.0, r2)) * 0.3 * (0.65 + 0.35 * vn(vR.xy * 2.5 + vec2(vS * 9.0, uTime * 0.45)));
  } else {
    float x = vR.x, st = vn(vec2(x * 2.5 + vS, vR.y * 1.4 - uTime * 1.7));
    a = (1.0 - smoothstep(0.45, 1.0, abs(x))) * (0.32 + 0.5 * smoothstep(0.4, 0.75, st));
    col *= 0.5 + 0.6 * st;
  }
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------- geometry helpers
class PG {
  constructor() { this.p = []; this.c = []; this.a = []; this.b = []; this.idx = []; this.n = 0; }
  v(x, y, z, col, a, b) { this.p.push(x, y, z); this.c.push(col[0], col[1], col[2]); this.a.push(a[0], a[1], a[2], a[3]); this.b.push(b[0], b[1], b[2]); return this.n++; }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  get tris() { return this.idx.length / 3; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aA', new THREE.Float32BufferAttribute(this.a, 4));
    g.setAttribute('aB', new THREE.Float32BufferAttribute(this.b, 3));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeVertexNormals();
    return g;
  }
}
const fnOf = (x) => (typeof x === 'function' ? x : () => x);
const _d = new THREE.Vector3(), _b1 = new THREE.Vector3(), _b2 = new THREE.Vector3(), _ref = new THREE.Vector3();
// tapered tube through points; rad(i) -> r | [rx, ry]; col, a, b: arrays or (i, k, along) -> array
function tube(G, pts, rad, sides, col, a, b) {
  const start = G.n, cf = fnOf(col), af = fnOf(a), bf = b ? fnOf(b) : null;
  let along = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i) along += pts[i].distanceTo(pts[i - 1]);
    _d.subVectors(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
    _ref.set(Math.abs(_d.y) > 0.9 ? 1 : 0, Math.abs(_d.y) > 0.9 ? 0 : 1, 0);
    _b1.crossVectors(_d, _ref).normalize(); _b2.crossVectors(_d, _b1).normalize();
    const r = rad(i), rx = Array.isArray(r) ? r[0] : r, ry = Array.isArray(r) ? r[1] : r;
    for (let k = 0; k < sides; k++) {
      const an = (k / sides) * TAU, ca = Math.cos(an) * rx, sa = Math.sin(an) * ry;
      G.v(pts[i].x + _b1.x * ca + _b2.x * sa, pts[i].y + _b1.y * ca + _b2.y * sa, pts[i].z + _b1.z * ca + _b2.z * sa,
        cf(i, k, along), af(i, k, along), bf ? bf(i, k, along) : [k / sides, along, 0]);
    }
  }
  for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < sides; k++) {
    const p = start + i * sides + k, q = start + i * sides + ((k + 1) % sides);
    G.quad(p, q, q + sides, p + sides);
  }
}
// ellipsoid; disp(dx, dy, dz) -> radial factor (boulders)
function blob(G, c, r, col, a, b, seg = 8, rings = 6, disp = null) {
  const start = G.n, cf = fnOf(col);
  for (let j = 0; j <= rings; j++) {
    const ph = (j / rings) * Math.PI, sp = Math.sin(ph), cp = Math.cos(ph);
    for (let k = 0; k < seg; k++) {
      const th = (k / seg) * TAU, dx = sp * Math.cos(th), dz = sp * Math.sin(th), f = disp ? disp(dx, cp, dz) : 1;
      G.v(c[0] + dx * r[0] * f, c[1] + cp * r[1] * f, c[2] + dz * r[2] * f, cf(dx, cp, dz), a, b);
    }
  }
  for (let j = 0; j < rings; j++) for (let k = 0; k < seg; k++) {
    const p = start + j * seg + k, q = start + j * seg + ((k + 1) % seg);
    G.quad(p, q, q + seg, p + seg);
  }
}
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// a tube with a doubled seam, so the (around, along) coordinates of the bark never wrap; rad(i, k) may bulge with the angle
function seamTube(G, pts, rad, sides, col, a) {
  const start = G.n, cf = fnOf(col), af = fnOf(a), W = sides + 1;
  let along = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i) along += pts[i].distanceTo(pts[i - 1]);
    _d.subVectors(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
    _ref.set(Math.abs(_d.y) > 0.9 ? 1 : 0, Math.abs(_d.y) > 0.9 ? 0 : 1, 0);
    _b1.crossVectors(_d, _ref).normalize(); _b2.crossVectors(_d, _b1).normalize();
    for (let k = 0; k <= sides; k++) {
      const an = (k / sides) * TAU, r = rad(i, k % sides), ca = Math.cos(an) * r, sa = Math.sin(an) * r;
      G.v(pts[i].x + _b1.x * ca + _b2.x * sa, pts[i].y + _b1.y * ca + _b2.y * sa, pts[i].z + _b1.z * ca + _b2.z * sa, cf(i, k % sides, along), af(i, k % sides, along), [k / sides, along, 0]);
    }
  }
  for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < sides; k++) { const p = start + i * W + k; G.quad(p, p + 1, p + 1 + W, p + W); }
}

// A limestone block as the tsingy breaks: one bed, fallen and tilted, its top cut into knife-edged karren crests with runnels
// between them, its sides battered and broken by a ledge, dark and mossy at the foot. Every facet keeps its own corners so the
// edges stay sharp; the shader gives the grain, the runnels and the moss. c = centre of the foot, R = radius, H = height.
function karren(G, c, R, H, rnd, layers = 3, moss = 1, n = 9) {
  const tone = 0.75 + 0.4 * rnd(), strike = rnd() * TAU, cs = Math.cos(strike), sn = Math.sin(strike);
  const NV = n >= 9 ? 7 : n >= 7 ? 5 : 3, NU = n >= 9 ? 5 : n >= 7 ? 4 : 3;       // lines across the strike (runnel, crest, runnel ...) and points along each
  const rx = R * (1.0 + 0.35 * rnd()), rz = R * (0.62 + 0.25 * rnd());            // the slab is long along its strike
  const dipU = (rnd() - 0.5) * 0.5, dipV = (0.18 + 0.28 * rnd()) * (rnd() < 0.5 ? -1 : 1);   // the bed lies tilted 10 to 25 degrees
  const amp = (0.34 + 0.22 * rnd()) * R, A = [0, 0, 0, moss], B = [0, 0, 0], y0 = c.y - 0.2 * H, hBody = H * 0.8;
  const at = (u, v, y) => [c.x + u * cs - v * sn, y, c.z + u * sn + v * cs];
  const face = (p, q, r) => { const a = G.v(p[0], p[1], p[2], p[3], A, B), b = G.v(q[0], q[1], q[2], q[3], A, B), cc = G.v(r[0], r[1], r[2], r[3], A, B); G.tri(a, b, cc); };
  const grey = (s) => [0.19 * s, 0.19 * s, 0.216 * s];
  const P = [];
  for (let j = 0; j < NV; j++) {
    const vv = -1 + (2 * j) / (NV - 1), isCrest = j % 2 === 1, half = Math.sqrt(Math.max(0.1, 1 - vv * vv * 0.85)), row = [];
    const cAmp = isCrest ? amp * (0.6 + 0.4 * rnd()) : 0, vj = vv * rz * 0.78 + (isCrest ? (rnd() - 0.5) * 0.22 * rz : 0), ph = rnd() * TAU;
    for (let i = 0; i < NU; i++) {
      const uu = -1 + (2 * i) / (NU - 1), u = uu * rx * 0.74 * half + (rnd() - 0.5) * 0.12 * rx;
      const y = y0 + hBody + u * dipU + vj * dipV + cAmp * (1 - 0.55 * uu * uu) * (0.72 + 0.28 * Math.sin(uu * 4 + ph));
      row.push([...at(u, vj, y), grey(tone * (isCrest ? 1.15 : 0.66) * (0.9 + 0.2 * rnd()))]);
    }
    P.push(row);
  }
  for (let j = 0; j < NV - 1; j++) for (let i = 0; i < NU - 1; i++) { const a = P[j][i], b = P[j][i + 1], d = P[j + 1][i], e = P[j + 1][i + 1]; if ((i + j) & 1) { face(a, d, e); face(a, e, b); } else { face(a, d, b); face(b, d, e); } }
  // the sides: from the rim of the top out to a ledge, and from the ledge down into the ground
  const rim = [];
  for (let i = 0; i < NU; i++) rim.push(P[0][i]);
  for (let j = 1; j < NV; j++) rim.push(P[j][NU - 1]);
  for (let i = NU - 2; i >= 0; i--) rim.push(P[NV - 1][i]);
  for (let j = NV - 2; j >= 1; j--) rim.push(P[j][0]);
  const mid = [], foot = [];
  for (const q of rim) {
    const dx = q[0] - c.x, dz = q[2] - c.z, k1 = 1.1 + 0.14 * rnd(), k2 = 1.3 + 0.16 * rnd(), yb = y0 + hBody * (0.42 + 0.2 * rnd()), s = tone * (0.8 + 0.3 * rnd());
    mid.push([c.x + dx * k1, Math.min(yb, q[1] - 0.05 * R), c.z + dz * k1, grey(s)]);
    foot.push([c.x + dx * k2, y0, c.z + dz * k2, [0.05 * s, 0.075 * s, 0.055 * s]]);
  }
  for (let k = 0; k < rim.length; k++) {
    const k2 = (k + 1) % rim.length, s = tone * (0.75 + 0.3 * rnd()), top1 = [rim[k][0], rim[k][1], rim[k][2], grey(s)], top2 = [rim[k2][0], rim[k2][1], rim[k2][2], grey(s)];
    face(top1, top2, mid[k2]); face(top1, mid[k2], mid[k]); face(mid[k], mid[k2], foot[k2]); face(mid[k], foot[k2], foot[k]);
  }
  if (layers >= 3) karren(G, { x: c.x - sn * R * 1.0, y: c.y, z: c.z + cs * R * 1.0 }, R * 0.55, H * 0.55, rnd, 1, moss, 7);   // a smaller piece leaning beside it
  return y0 + hBody + 0.3 * amp;                           // about the height of the middle of its top
}

// a clump of ferns on a pad of moss, for instancing on ledges, logs and stones (local: root at the origin, growing along +Y);
// the fronds are plain strips, their outline and pinnae are cut in the fragment shader (kind 8)
function fernClumpGeometry(rnd, fronds = 5, pad = true) {
  const G = new PG(), NS = 4;
  if (pad) blob(G, [0, 0, 0], [0.42, 0.07, 0.38], (x, y, z) => { const s = 0.7 + 0.5 * Math.abs(Math.sin(x * 9 + z * 7)); return [0.03 * s, 0.08 * s, 0.028 * s]; }, [9, 0, 0, 0], [0, 0, 0], 6, 3);
  for (let f = 0; f < fronds; f++) {
    const az = (f / fronds) * TAU + rnd() * 0.8, L = 0.55 + 0.45 * rnd(), W = 0.14 * L + 0.03, e0 = 0.9 + 0.5 * rnd(), droop = 1.5 + 0.9 * rnd(), ph = rnd() * TAU;
    const hx = Math.cos(az), hz = Math.sin(az), sx = -hz, sz = hx, sh = 0.75 + 0.5 * rnd(), col = f % 2 ? [0.065 * sh, 0.19 * sh, 0.055 * sh] : [0.105 * sh, 0.24 * sh, 0.06 * sh];
    const start = G.n; let px = hx * 0.05, py = 0.04, pz = hz * 0.05;
    for (let i = 0; i <= NS; i++) {
      const t = i / NS, ang = e0 - droop * t * t;
      if (i) { px += (L / NS) * Math.cos(ang) * hx; py += (L / NS) * Math.sin(ang); pz += (L / NS) * Math.cos(ang) * hz; }
      for (const u of [-1, 0, 1]) G.v(px + sx * W * u, py - Math.abs(u) * W * 0.25, pz + sz * W * u, col, [8, t, ph, 0.05 + 0.05 * L], [u, t, f + rnd()]);
    }
    for (let i = 0; i < NS; i++) for (let k = 0; k < 2; k++) { const a = start + i * 3 + k; G.quad(a, a + 1, a + 4, a + 3); }
  }
  return G.build();
}

// a greater vasa parrot: charcoal, broad wings (1.7 m across), a long square tail and a pale bill. Local: head +Z, wings along X.
function vasaGeometry() {
  const P = [], Cc = [], Wt = [], I = []; let n = 0;
  const v = (x, y, z, c, w) => { P.push(x, y, z); Cc.push(c[0], c[1], c[2]); Wt.push(w[0], w[1], w[2], 0); return n++; };
  const body = [0.05, 0.048, 0.055], dark = [0.03, 0.028, 0.034], bill = [0.6, 0.57, 0.5], wingC = [0.062, 0.058, 0.07], B0 = [0, 0, 0];
  const rings = [[-0.3, 0.012, 0], [-0.2, 0.05, 0], [-0.05, 0.085, 0.005], [0.08, 0.09, 0.01], [0.17, 0.07, 0.03], [0.24, 0.062, 0.045], [0.3, 0.036, 0.035], [0.335, 0.008, 0.02]];
  rings.forEach(([z, r, y], j) => { for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; v(Math.cos(a) * r, y + Math.sin(a) * r * 0.9, z, j >= 6 ? bill : j % 2 ? body : dark, B0); } });
  for (let j = 0; j < rings.length - 1; j++) for (let k = 0; k < 6; k++) { const a = j * 6 + k, b = j * 6 + ((k + 1) % 6); I.push(a, b, b + 6, a, b + 6, a + 6); }
  { const a = v(-0.04, 0.0, -0.2, dark, B0), b = v(0.04, 0.0, -0.2, dark, B0), c = v(0.13, -0.01, -0.58, dark, B0), d = v(-0.13, -0.01, -0.58, dark, B0); I.push(a, b, c, a, c, d); }   // the tail
  for (const s of [-1, 1]) {                                 // wings: four stations from the shoulder to the tip, leading and trailing edge
    const st = [[0.09, 0.12, -0.17], [0.34, 0.14, -0.17], [0.6, 0.1, -0.2], [0.85, -0.02, -0.16]], base = n;
    st.forEach(([x, zl, zt], j) => { const w = [1, s, (x - 0.09) / 0.76]; v(s * x, 0.04, zl, j === 3 ? dark : wingC, w); v(s * x, 0.035, zt, dark, w); });
    for (let j = 0; j < 3; j++) { const a = base + j * 2; I.push(a, a + 2, a + 3, a, a + 3, a + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(Wt, 4));
  g.setIndex(I); g.computeVertexNormals();
  return g;
}

// the harrier-hawk (a fish eagle at dawn, an owl by moonlight): broad fingered wings 2 m across, a fanned tail. Local: head +Z, wings along X; it glides (aW.w = 1).
function hawkGeometry(c) {
  const P = [], Cc = [], Wt = [], I = []; let n = 0;
  const v = (x, y, z, col, w) => { P.push(x, y, z); Cc.push(col[0], col[1], col[2]); Wt.push(w[0], w[1], w[2], w[3] || 0); return n++; };
  const B0 = [0, 0, 0, 1];
  const rings = [[-0.34, 0.02, 0.0, c.tailC], [-0.24, 0.06, 0.0, c.body], [-0.08, 0.095, 0.005, c.body], [0.08, 0.1, 0.01, c.body], [0.2, 0.08, 0.025, c.body], [0.28, 0.062, 0.04, c.head], [0.345, 0.052, 0.046, c.head], [0.39, 0.03, 0.036, c.beak], [0.428, 0.01, 0.012, c.tip]];
  rings.forEach(([z, r, y, col]) => { for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, sa = Math.sin(a); v(Math.cos(a) * r, y + sa * r * 0.85, z, sa < -0.3 && col === c.body ? c.belly : col, B0); } });
  for (let j = 0; j < rings.length - 1; j++) for (let k = 0; k < 8; k++) { const a = j * 8 + k, b = j * 8 + ((k + 1) % 8); I.push(a, b, b + 8, a, b + 8, a + 8); }
  { const st = [[-0.26, 0.05, c.tailC], [-0.48, 0.13, c.band], [-0.62, 0.19, c.tailC], [-0.72, 0.22, c.band]], base = n;       // the tail: a fan with a pale band
    st.forEach(([z, w, col]) => { v(-w, 0.0, z, col, B0); v(0, 0.012, z, col, B0); v(w, 0.0, z, col, B0); });
    for (let j = 0; j < 3; j++) for (let k = 0; k < 2; k++) { const a = base + j * 3 + k; I.push(a, a + 1, a + 4, a, a + 4, a + 3); } }
  for (const s of [-1, 1]) {                                 // wings: five stations from the shoulder out, then five spread primaries
    const st = [[0.09, 0.16, -0.2], [0.3, 0.2, -0.22], [0.55, 0.18, -0.23], [0.76, 0.12, -0.21], [0.86, 0.05, -0.18]], base = n, W = (x) => [1, s, (x - 0.09) / 0.93, 1];
    st.forEach(([x, zl, zt], j) => { const w = W(x); v(s * x, 0.045, zl, j > 3 ? c.tip : j > 2 ? c.trail : c.wingC, w); v(s * x, 0.05, (zl + zt) / 2, j > 3 ? c.tip : c.wingC, w); v(s * x, 0.04, zt, j > 3 ? c.tip : c.trail, w); });
    for (let j = 0; j < 4; j++) for (let k = 0; k < 2; k++) { const a = base + j * 3 + k; I.push(a, a + 3, a + 4, a, a + 4, a + 1); }
    for (let f = 0; f < 5; f++) { const z0 = 0.05 - f * 0.052, x1 = 1.02 - 0.035 * Math.abs(f - 1.2), z1 = 0.1 - f * 0.085; const a = v(s * 0.84, 0.045, z0 + 0.022, c.tip, W(0.84)), b = v(s * 0.84, 0.045, z0 - 0.042, c.tip, W(0.84)), t = v(s * x1, 0.05, z1, c.tip, W(x1)); I.push(a, b, t); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(Wt, 4));
  g.setIndex(I); g.computeVertexNormals();
  return g;
}

// a wild banana: pseudostem and 7-9 arching, torn leaves (kind 1; tears are cut in the fragment shader)
function banana(G, base, yaw, sc, rng, id0) {
  const H = rng.range(1.9, 2.8) * sc, lean = rng.range(-0.2, 0.2), stem = [];
  for (let i = 0; i <= 4; i++) stem.push(V3(base.x + lean * (i / 4) ** 2, base.y - 0.3 + (H + 0.3) * (i / 4), base.z));
  tube(G, stem, (i) => (0.2 - 0.022 * i) * sc, 7, (i, k) => { const s = 0.8 + 0.25 * ((k * 3 + i) % 4) / 4; return [0.2 * s, 0.27 * s, 0.1 * s]; }, [6, 0, 0, 0.3]);
  const top = stem[4], n = rng.int(7, 9);
  for (let l = 0; l < n; l++) {
    const az = yaw + l * 2.4 + rng.range(-0.4, 0.4), L = rng.range(2.5, 3.5) * sc, W = rng.range(0.36, 0.5) * sc;
    const young = l / (n - 1), e0 = lerp(0.5, 1.35, young), droop = lerp(2.1, 1.0, young) * rng.range(0.85, 1.15);
    const hx = Math.cos(az), hz = Math.sin(az), sx = -hz, sz = hx, id = id0 + l, ph = rng.range(0, 6.28);
    const sh = rng.range(0.8, 1.15), colr = [lerp(0.2, 0.1, young) * sh, lerp(0.36, 0.44, young) * sh, 0.09 * sh];
    const start = G.n, NS = 9; let px = top.x, py = top.y - 0.1, pz = top.z;
    for (let i = 0; i <= NS; i++) {
      const t = i / NS, ang = e0 - droop * t * t;
      if (i) { px += (L / NS) * Math.cos(ang) * hx; py += (L / NS) * Math.sin(ang); pz += (L / NS) * Math.cos(ang) * hz; }
      const w = t < 0.12 ? 0.035 * sc : W * Math.pow(Math.sin(Math.PI * Math.min(1, (t - 0.12) / 0.88 * 0.94 + 0.06)), 0.6);
      const amp = 0.07 + 0.09 * sc;
      for (const u of [-1, 0, 1]) G.v(px + sx * w * u, py - Math.abs(u) * w * 0.3, pz + sz * w * u, colr, [1, t, ph, amp], [u, t, id]);
    }
    for (let i = 0; i < NS; i++) for (let k = 0; k < 2; k++) { const a = start + i * 3 + k; G.quad(a, a + 1, a + 4, a + 3); }
  }
}

// a red-fronted brown lemur sitting on a limb (local: seat at y = 0, facing +Z), tail hanging as a pendulum
function lemurGeometry() {
  const G = new PG(), body = [0.2, 0.115, 0.06], head = [0.4, 0.13, 0.04], dark = [0.02, 0.016, 0.014], tailC = [0.12, 0.07, 0.04], pale = [0.5, 0.42, 0.32];
  const A = [2, 0, 0, 0], HP = [0, 0.5, 0.02], HA = [5, 0, 0, 0];
  blob(G, [0, 0.26, 0], [0.13, 0.26, 0.15], (x, y, z) => (z > 0.5 ? pale : body), A, [0, 0, 0], 8, 6);
  for (const s of [-1, 1]) {
    blob(G, [s * 0.115, 0.1, 0.07], [0.075, 0.11, 0.14], body, A, [0, 0, 0], 6, 4);
    tube(G, [V3(s * 0.11, 0.38, 0.07), V3(s * 0.13, 0.25, 0.15), V3(s * 0.09, 0.12, 0.2)], (i) => 0.04 - i * 0.006, 5, body, A, [0, 0, 0]);
    blob(G, [s * 0.075, 0.635, 0.02], [0.03, 0.035, 0.02], head, HA, HP, 5, 3);
  }
  blob(G, [0, 0.56, 0.05], [0.088, 0.082, 0.098], (x, y, z) => (y > 0.25 ? head : z > 0.2 ? pale : body), HA, HP, 8, 6);
  blob(G, [0, 0.535, 0.14], [0.04, 0.035, 0.062], dark, HA, HP, 6, 4);
  const tl = []; for (let i = 0; i <= 8; i++) tl.push(V3(0, 0.07 - 0.11 * i, -0.13 - 0.05 * Math.sin(i * 0.5)));
  tube(G, tl, (i) => 0.045 - 0.0012 * i, 5, tailC, (i) => [4, i / 8, 0, 0.2], [0, 0, 0]);
  return G.build();
}

// a fossa (local: feet at y = 0, nose +Z): long low body, short legs, a tail as long as the animal
function fossaGeometry() {
  const G = new PG(), coat = [0.33, 0.125, 0.045], belly = [0.5, 0.26, 0.12], dark = [0.05, 0.025, 0.015], back = [0.17, 0.065, 0.028];
  const A = [2, 0, 0, 0], HP = [0, 0.42, 0.5], HA = [5, 0, 0, 0];
  const sp = [V3(0, 0.33, -0.5), V3(0, 0.36, -0.42), V3(0, 0.375, -0.2), V3(0, 0.365, 0.05), V3(0, 0.37, 0.28), V3(0, 0.4, 0.42), V3(0, 0.43, 0.52)];
  const rr = [[0.03, 0.03], [0.09, 0.1], [0.1, 0.115], [0.098, 0.11], [0.105, 0.12], [0.085, 0.09], [0.06, 0.062]];
  tube(G, sp, (i) => rr[i], 8, (i, k) => (k === 6 ? back : k >= 1 && k <= 3 ? belly : coat), A, [0, 0, 0]);     // (ring corner 6 is the spine, 1 to 3 the underside)
  blob(G, [0, 0.445, 0.6], [0.064, 0.06, 0.09], coat, HA, HP, 7, 5);
  blob(G, [0, 0.425, 0.69], [0.036, 0.032, 0.055], (x, y, z) => (z > 0.6 ? dark : belly), HA, HP, 6, 4);
  for (const s of [-1, 1]) blob(G, [s * 0.05, 0.505, 0.585], [0.028, 0.032, 0.014], coat, HA, HP, 5, 3);
  const legs = [[-1, 0.3, 0], [1, 0.3, Math.PI], [-1, -0.36, Math.PI], [1, -0.36, 0]];
  for (const [s, z, ph] of legs) {
    const pts = [V3(s * 0.08, 0.34, z), V3(s * 0.085, 0.18, z + (z > 0 ? -0.02 : 0.03)), V3(s * 0.085, 0.03, z + 0.01), V3(s * 0.085, 0.0, z + 0.06)];
    tube(G, pts, (i) => [0.05, 0.042, 0.03, 0.026][i], 5, (i) => (i > 1 ? belly : coat), (i) => [3, i / 3, ph, 0], [0, 0.31, z]);
  }
  const tl = []; for (let i = 0; i <= 9; i++) { const t = i / 9; tl.push(V3(0, 0.36 - 0.12 * Math.sin(t * 3.0) + 0.34 * t * t, -0.46 - 0.8 * t)); }
  tube(G, tl, (i) => 0.042 - 0.0018 * i, 5, coat, (i) => [4, i / 9, 1.3, 0.07], [0, 0, 0]);
  return G.build();
}

// ============================================================================================== the world
export default {
  id: 'stone-knives',
  name: 'Forest of Knives',
  category: 'wilderness',
  weirdness: 0.2,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = vary.density ?? 1, noise = ctx.noise;
    const xr = ctx.core.makeRng(((ctx.seed | 0) * 2654435761 + 97) >>> 0);   // a generator of its own for the later additions: nothing they draw moves the rest of the world
    // ---- which look (first draw from the seed), the viewer's hour wish first
    const lr = rng.fork('look')();
    let lookId = lr < 0.26 ? 'gold' : lr < 0.46 ? 'dawn' : lr < 0.56 ? 'blue' : lr < 0.8 ? 'rain' : 'gold';
    if (vary.hour === 'dawn') lookId = 'dawn'; else if (vary.hour === 'golden') lookId = 'gold'; else if (vary.hour === 'night') lookId = 'blue'; else if (vary.hour === 'day') lookId = 'rain';
    const LK = LOOKS[lookId], rare = !!vary.rare;
    const dirOf = (el, az) => { const e = (el * Math.PI) / 180, a = (az * Math.PI) / 180; return V3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); };

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(C(LK.fog), LK.fogD);

    // ---- the hero: blade field, Cathedral, fissure, canyon, the troop
    const hero = await buildHero(ctx, { palette: PAL, hour: LK.hour, weather: LK.weather, haze: LK.haze, pocket: LK.pocket, troop: Math.round(24 * dens), towerHeight: 138, rare, ...(ctx.heroOpts || {}),
      ...(LK.sunDir ? { sunDir: dirOf(LK.sunDir[0], LK.sunDir[1]) } : {}) });
    scene.add(hero.object);
    const A = hero.anchors, HU = hero.uniforms, sunV = A.sunDir.clone().normalize(), TOP = hero.top, cl = hero.centreline;
    HU.uSize.value = 1.5;                                   // the animals half as large again as life so they read at 8-14 m
    HU.uDeepFill.value.setRGB(LK.deep[0], LK.deep[1], LK.deep[2]);
    if (LK.bandLo) HU.uBandLo.value = LK.bandLo;            // dawn: the low sun reaches only the crowns
    const skyBase = HU.uSky.value.clone(), bandBase = HU.uBandLo.value;
    // down in the fissure the strip of sky is the only light: grey-violet, not the saturated violet of the open tops
    const skyFis = (() => { const l = (skyBase.r + skyBase.g + skyBase.b) / 3; return skyBase.clone().lerp(new THREE.Color(l * 1.03, l * 0.98, l * 1.26), 0.6).multiplyScalar(2.0); })();
    if (LK.body) { skyFis.multiplyScalar(0.74); skyBase.multiplyScalar(LK.body); skyBase.b *= 1.12; HU.uSky.value.copy(skyBase); HU.uFurLift.value = LK.furLift; HU.uFurBand.value = LK.furBand; }   // dawn: the blade bodies stand dark out of the bright mist; the animals keep their light
    if (lookId === 'dawn') HU.uSunCol.value.setRGB(2.7, 1.25, 0.62);
    if (LK.term && HU.uTerm) HU.uTerm.value = LK.term;     // dawn: the sun lies flat on the faces turned to it, a hard terminator down every blade             // dawn: a low rose-gold sun on the crowns of the blades, their bodies in violet shade
    HU.uFurKey.value = { gold: 1, dawn: 0.95, blue: 0.6, rain: 0.9 }[lookId];
    HU.uPortalCol.value.set(LK.portal).multiplyScalar(0.9); HU.uPocketAir.value = 0.3; HU.uFogTop.value = 0.32;
    if (LK.mist) { HU.uMist.value.set(LK.mist[0], LK.mist[1], LK.mist[2], LK.mist[3]); HU.uMistCol.value.setRGB(LK.mistCol[0], LK.mistCol[1], LK.mistCol[2]); }
    await ctx.yield();

    // ---- the path: the hero's fly-through line (crest, two dropping leaps and seven bounds down the street, the dive, the canyon, the keyhole)
    const fly = A.flyThrough.map((p) => p.clone());
    const path = makePath(fly, { samples: 720 });
    await ctx.yield();
    const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3();
    const uNear = (p, from) => {                             // path fraction nearest to a control point, searching forward
      let best = 1e12, bu = from;
      for (let i = Math.floor(from * 2400); i <= 2400; i++) { path.pointAt(i / 2400, tmpV); const d = tmpV.distanceToSquared(p); if (d < best) { best = d; bu = i / 2400; } else if (best < 1 && d > best + 900) break; }
      return bu;
    };
    // the troop's script runs on its own clock T (seconds); TU maps path fraction to T through the landings
    const TL = hero.landingTimes, TU = [[0, 0]], uLand = [];
    const NL = A.landings.length - 1;                          // the last landing is the lip of the fissure
    { let from = 0; for (let k = 0; k <= NL; k++) { from = uNear(fly[3 + 2 * k], from); uLand.push(from); TU.push([from, TL[k]]); } }
    const uLip = uLand[NL], uBottom = uNear(fly[7 + 2 * NL], uLip);
    await ctx.yield();
    TU.push([uBottom, 23.5], [A.timing.uOut, A.timing.tOut], [0.9, 36.2], [1, 40]);   // the lens keeps its diving speed out along the floor until the lead animal has left its last root
    const tOf = (u) => {
      if (u <= 0) return 0;
      for (let i = 1; i < TU.length; i++) if (u <= TU[i][0]) { const a = TU[i - 1], b = TU[i]; return a[1] + ((b[1] - a[1]) * (u - a[0])) / Math.max(1e-6, b[0] - a[0]); }
      return 40;
    };
    const uOfT = (T) => { for (let i = 1; i < TU.length; i++) if (T <= TU[i][1]) { const a = TU[i - 1], b = TU[i]; return a[0] + ((b[0] - a[0]) * (T - a[1])) / Math.max(1e-6, b[1] - a[1]); } return 1; };
    const pace = (u) => { const a = Math.max(0, u - 0.035), b = Math.min(1, u + 0.035); return (b - a) / Math.max(1e-4, (tOf(b) - tOf(a)) / 40); };
    // flowers that would stand in the flight line are taken off their crests
    hero.parts.plantList.forEach((it, i) => { if (path.distanceTo(it.x, it.y + 1.6 * (it.sy || 1), it.z) < 2.3 || path.distanceTo(it.x, it.y + 2.9 * (it.sy || 1), it.z) < 2.0) hero.hidePlant(i); });

    // and those that would stand over the lead animal in the opening frames (u 0 to 0.02), in front of it or close behind: it is seen whole, clear of any plant
    { const cam = new THREE.Vector3(), an = new THREE.Vector3(), pl = new THREE.Vector3();
      for (const uu of [0.003, 0.01, 0.017]) {
        path.pointAt(uu, cam); const stt = hero._lab.evaluate(0, tOf(uu), 0); an.set(stt.x, stt.y + 0.6, stt.z).sub(cam); const dA = an.length(); an.normalize();
        hero.parts.plantList.forEach((it, i) => { pl.set(it.x, it.y + 1.5 * (it.sy || 1), it.z).sub(cam); const dP = pl.length(); if (dP < dA + 14 && pl.normalize().dot(an) > Math.cos(0.09 + 1.9 / Math.max(2, dP))) hero.hidePlant(i); });
      } }
    // canyon frame helpers: s = metres along the hero's fissure / canyon centreline, lat > 0 = right (east)
    const clI = (s) => cl[Math.max(0, Math.min(cl.length - 1, Math.round(s / 1.5)))];
    const at = (s, lat, y, out = new THREE.Vector3()) => { const c = clI(s); return out.set(c.x + c.nx * lat, y, c.z + c.nz * lat); };
    const clNear = (x, z) => { let bi = 0, bd = 1e12; for (let i = 0; i < cl.length; i++) { const d = (cl[i].x - x) ** 2 + (cl[i].z - z) ** 2; if (d < bd) { bd = d; bi = i; } } return cl[bi]; };
    const sOfU = (u) => { path.pointAt(u, tmpV); return clNear(tmpV.x, tmpV.z).s; };
    const sPortal = clNear(0, 0).s;
    const pathYatS = (s) => { const c = clI(s); return path.nearestXZ(c.x, c.z).y; };
    const clNear4 = (x, z) => { let bi = 0, bd = 1e12; for (let i = 0; i < cl.length; i += 4) { const d = (cl[i].x - x) ** 2 + (cl[i].z - z) ** 2; if (d < bd) { bd = d; bi = i; } } return cl[bi]; };
    const floorY = (x, z) => { const c = clNear4(x, z), lat = Math.abs((x - c.x) * c.nx + (z - c.z) * c.nz); return -0.2 + (0.9 * Math.min(lat, c.hw + 2.5)) / (c.hw + 2.5); };
    await ctx.yield();

    // ---- sky, light, fog
    const moonDir = LK.moon ? dirOf(LK.moon.elevation, LK.moon.azimuth) : null;
    const sky = makeSky({ rng, ...LK.sky, ...(LK.moonKey ? {} : { sunDirection: sunV }), bodies: LK.moon ? [{ texture: 0.7, ...LK.moon }] : [], ...(LK.moonKey ? { key: 0 } : {}),
      bake: true, renderer: ctx.renderer });
    scene.add(sky.object);
    const hemi = new THREE.HemisphereLight(C(LK.hemi[0]), C(LK.hemi[1]), LK.hemi[2]);
    const sunL = new THREE.DirectionalLight(C(LK.sun[0]), LK.sun[1]);
    sunL.position.copy(sunV).multiplyScalar(400);
    scene.add(hemi, sunL, sunL.target);
    const stripC = new THREE.Color(LK.strip[0], LK.strip[1], LK.strip[2]), bounceC = new THREE.Color(LK.bounce[0], LK.bounce[1], LK.bounce[2]);
    const LT = {                                             // top of the world / the pocket: light and air
      hemiA: hemi.color.clone(), hemiB: stripC.clone().lerp(bounceC.clone().multiplyScalar(2.6), 0.32), gndA: hemi.groundColor.clone(), gndB: bounceC.clone().multiplyScalar(2.6).add(new THREE.Color(0.012, 0.02, 0.06)),
      hemiIA: LK.hemi[2], hemiIB: 1.9, sunA: sunL.color.clone(), sunB: stripC.clone(), sunIA: LK.sun[1], sunIB: 2.0, dirB: V3(0.14, 1, 0.08).normalize(),
      fogA: C(LK.fog), fogB: C(LK.pocketFog), mistC: LK.mist ? new THREE.Color(LK.mistCol[0], LK.mistCol[1], LK.mistCol[2]).multiplyScalar(0.9) : null,
      mistS: new THREE.Color(0.21, 0.15, 0.32), mistG: C(LK.pocketFog).multiplyScalar(0.85).add(new THREE.Color(0.02, 0.02, 0.03)),      // the mist down in the slot: in shade, violet; green where it thins over the pocket
    };
    const time = { value: 0 };
    const pocketU = {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uWalk: { value: new THREE.Vector4(0, 0, 0, 0) }, uTopCol: { value: stripC.clone() }, uBounce: { value: bounceC.clone().multiplyScalar(1.35).add(new THREE.Color(0.004, 0.01, 0.03)) },
      uCam: HU.uCam, uSunDir: { value: sunV }, uSunCol: HU.uSunCol, uBandLo: HU.uBandLo, uPortalCol: HU.uPortalCol,
    };
    const pocketMat = new THREE.ShaderMaterial({ uniforms: pocketU, vertexShader: POCKET_VERT, fragmentShader: POCKET_FRAG, fog: true, side: THREE.DoubleSide });
    const wind = flora.makeWind({ direction: [0.7, -0.5], strength: 0.8 });
    await ctx.yield();

    // ---- on the stone: baobabs wedged in the slot mouths, bare and silver (in leaf after the first rains)
    const treeOpts = { wind, ambient: 1.45, leafAmbient: 1.4, backlight: 1.0, detail: 0.6, barkBump: 1 };
    await flora.prepareLeafTexture(treeOpts, ctx.yield);     // the leaf atlas, drawn in short steps
    const treeMat = flora.windMaterial(treeOpts);
    const updaters = [];
    await ctx.yield();
    const iTop0 = scene.children.length;
    {
      const tr = rng.fork('trees'), bark = LK.hour === 'blue' ? '#8d93b0' : '#a9a5ac', leafP = { leaf: '#5fae3c', leafLight: '#a8e060', leafDark: '#2c6a2c' };
      const dead = (h, d) => flora.deadTreeGeometry({ rng: tr, height: h, detail: d, bark, barkDark: '#4a4258' });
      const variants = [LK.leafy ? flora.baobabGeometry({ rng: tr, height: 14, detail: 1, bark, barkDark: '#4a4258', ...leafP }) : dead(14, 1)];
      await ctx.yield();
      variants.push(dead(12, 1));
      await ctx.yield();
      variants.push(LK.leafy ? flora.baobabGeometry({ rng: tr, height: 15, detail: 0, bark, barkDark: '#4a4258', ...leafP }) : dead(15, 0));
      await ctx.yield();
      const pts = [], want = Math.round(26 * dens), fins = hero.midFins.slice();
      tr.shuffle(fins);
      for (const f of fins) {
        if (pts.length >= want) break;
        const nu = path.nearestXZ(f.x, f.z);
        if (nu.u > uLip + 0.01 || nu.dist < 17 || nu.dist > 90 || !tr.chance(1 - nu.dist / 120)) continue;
        const near = nu.dist < 42;
        pts.push({ x: f.x + tr.range(-0.5, 0.5), y: TOP + f.y - tr.range(9, 12), z: f.z + tr.range(-0.5, 0.5), s: tr.range(0.7, 1.05), rot: tr.range(0, TAU), d: nu.dist, u: 0.2, v: near ? (tr.chance(0.5) ? 0 : 1) : (tr.chance(0.6) ? 2 : 1) });
      }
      await ctx.yield();
      if (pts.length) { const trees = flora.makeScatter({ rng: tr, points: pts, variants, material: treeMat, tint: 0.1, hue: 0.02, sink: 0, tilt: 0.1 }); scene.add(trees.object); updaters.push(trees); }
    }
    const iTop1 = scene.children.length;
    await ctx.yield();

    // ---- wildlife of the tops: swifts (bats at blue hour), vasa parrots, the harrier-hawk
    const topLight = { sunDir: sunV, sunColor: LK.sun[0], sunIntensity: LK.sun[1], sky: LK.hemi[0], skyIntensity: LK.hemi[2] * 1.1, ground: LK.hemi[1], groundIntensity: 0.9 };
    const pocketLight = { sunDir: LT.dirB, sunColor: stripC, sunIntensity: 1.5, sky: LT.hemiB, skyIntensity: 1.5, ground: LT.gndB, groundIntensity: 1.0 };
    const fauna = F.makeFauna(scene, { light: topLight }), DUR = 40;
    const uShear = uOfT(tOf(0.25) - 1.0);                      // the rare event: a blade top shears off just past the sixth landing
    const night = LK.hour === 'blue';
    fauna.add(F.makeFlock({ rng: rng.fork('swifts'), species: night ? 'bats' : 'swifts', count: Math.round((night ? 90 : 46) * dens), size: night ? 2.0 : 1.9, spread: night ? [18, 6, 60] : [34, 8, 40],
      along: { path, side: -3, up: 21, lead: 46, from: -0.04, to: uLip + 0.04 } }));       // over the crowns of the blades, in the strip of sky above the street
    await ctx.yield();
    const VASA = { body: '#2c2a30', belly: '#3b3940', wingC: '#35333b', trail: '#27252d', tip: '#1a181e', head: '#2f2d35', tailC: '#232127', beak: '#d8d2c4' };
    fauna.add(F.makeFlock({ rng: rng.fork('vasa1'), species: 'parrots', count: Math.round(7 * dens), size: 1.5, speed: 13, spread: [10, 3, 14], ...VASA,
      cross: { path, u: rare ? uShear + 0.03 : 0.125, lead: 44, angle: 62, side: -1, height: 18, span: 240, duration: DUR } }));
    await ctx.yield();
    const HAWKS = {
      gold: { body: '#b4b8c2', belly: '#d8dadf', wingC: '#a4a9b4', trail: '#2c2c33', tip: '#141418', head: '#c9cbd0', tailC: '#34343c', beak: '#f0c040' },
      rain: { body: '#b4b8c2', belly: '#d8dadf', wingC: '#a4a9b4', trail: '#2c2c33', tip: '#141418', head: '#c9cbd0', tailC: '#34343c', beak: '#f0c040' },
      dawn: { body: '#7a4426', belly: '#f1ece2', wingC: '#2e2622', trail: '#241e1c', tip: '#181414', head: '#f4f0e6', tailC: '#f1ece2', beak: '#f0c040' },   // a fish eagle from the gorge
      blue: { body: '#cdbb9c', belly: '#efe6d4', wingC: '#b89e7c', trail: '#8a7458', tip: '#5a4a3a', head: '#f0e8d8', tailC: '#c8b08c', beak: '#d8c8a0' },   // a red owl out early
    };
    rng.fork('hawk');                                        // (the hawk is our own bird now, built with the parrots of the plunge; the draw keeps the rest of the world as it was)
    await ctx.yield();

    // ---- air: dry leaves and petals torn over the edges, gold dust; in the pocket green motes and sifting leaves
    const set = fx.fxGroup(); scene.add(set.object);
    const dust1 = night ? '#9fb4ff' : '#ffd9a0';
    const pTopLeaves = set.add(fx.makeParticles({ rng: rng.fork('p1'), preset: 'leaves', time, count: Math.round(900 * detail), box: [40, 22, 40], size: [0.1, 0.22], colors: ['#f0e4c8', '#d0a868', '#8a6a48'], lightDir: sunV.toArray() }));
    await ctx.yield();
    const pTopDust = set.add(fx.makeParticles({ rng: rng.fork('p2'), preset: 'dust', time, count: Math.round(1300 * detail), box: [40, 24, 40], colors: [dust1, '#fff0d0', dust1] }));
    await ctx.yield();
    const pMotes = set.add(fx.makeParticles({ rng: rng.fork('p3'), preset: 'dust', time, count: Math.round(1500 * detail), box: [36, 22, 36], colors: night ? ['#9fd0ff', '#c8f0e0', '#7fb0e0'] : ['#e8ffb0', '#fff0c0', '#b0f0a0'] }));
    await ctx.yield();
    const pFall = set.add(fx.makeParticles({ rng: rng.fork('p4'), preset: 'leaves', time, count: Math.round(300 * detail), box: [30, 24, 30], colors: ['#7ac050', '#c8b040', '#3f8a3a'], lightDir: [0.1, 1, 0.1] }));
    await ctx.yield();
    const pRain = LK.weather === 'rain' ? set.add(fx.makeParticles({ rng: rng.fork('p5'), preset: 'rain', time, count: Math.round(3200 * detail), colors: ['#d8dcec', '#fff0d8', '#b8c4e0'] })) : null;
    if (LK.rainbow) set.add(fx.makeRainbow({ sunDir: sunV.toArray(), intensity: 0.2, width: 1.2 }));
    // the stream down the street: petals and dry leaves torn off the ledges, sailing down the slit close past the lens; a party of swifts low between the blades
    const pStream = set.add(fx.makeParticles({ rng: xr.fork('p6'), preset: 'petals', time, count: Math.round(380 * detail), box: [18, 14, 30], size: [0.13, 0.28], velocity: [0.9, -1.5, 2.2], velocityRandom: [0.9, 0.6, 1.2], turbulence: [1.1, 0.5, 0.9],
      colors: night ? ['#c8d4ff', '#9fb0e8', '#7888c0'] : ['#fff6e6', '#f2dcb0', '#d8b070'], lightDir: sunV.toArray(), near: [2.5, 6.5] }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: xr.fork('swifts2'), species: night ? 'bats' : 'swifts', count: Math.round(14 * dens), size: 0.85, spread: [6, 4, 26], along: { path, side: 0, up: 4.5, lead: 27, from: 0.03, to: uLip + 0.02 } }));
    await ctx.yield();
    pMotes.setOpacity(0); pFall.setOpacity(0);
    await ctx.yield();

    // ============================================================================ the forest pocket
    const iPk0 = scene.children.length;                     // everything added from here to iPk1 lives down in the pocket
    const floraMat = flora.windMaterial({ wind, map: treeMat.map, ambient: 1.35, leafAmbient: 1.25, backlight: 1.6, backlightTint: '#c8ff8a' });
    const fr = rng.fork('pocket');
    const uCanyon = uBottom + 0.02, sEnd = cl[cl.length - 1].s;
    // where things stand along the canyon (metres along the centreline)
    const sLem1 = sOfU(0.714), sLem2 = sOfU(0.80), sFos = sOfU(0.86), cav = A.cave, sC = cav.s, cC = clI(sC);
    // the lens's lines of sight to the portal from where it first shows to the keyhole: nothing tall may stand in them
    const sightPts = []; for (let uu = 0.735; uu <= 0.9; uu += 0.011) { path.pointAt(uu, tmpV); sightPts.push(tmpV.x, tmpV.z); }
    const sightDist = (x, z) => {
      let best = 1e9;
      for (let i = 0; i < sightPts.length; i += 2) { const ax = sightPts[i], az = sightPts[i + 1], L2 = ax * ax + az * az, t = Math.max(0, Math.min(1, ((x - ax) * -ax + (z - az) * -az) / L2)), d = Math.hypot(x - ax * (1 - t), z - az * (1 - t)); if (d < best) best = d; }
      return best;
    };
    // the fossa's fallen trunk: its broken end propped on a block near the right wall, its root plate on the ground nearer the stream
    const logA = at(sFos + 3, 7.0, 3.1), logB = at(sFos + 17, 4.5, 1.75), logMid = logA.clone().lerp(logB, 0.5), logLen = logA.distanceTo(logB), logDir = logB.clone().sub(logA).normalize();
    const nearLog = (x, z) => { const t = Math.max(-0.15, Math.min(1.15, ((x - logA.x) * logDir.x + (z - logA.z) * logDir.z) / logLen)); return Math.hypot(x - (logA.x + logDir.x * logLen * t), z - (logA.z + logDir.z * logLen * t)); };
    const figTrunks = [];
    {
      // fig crowns over the canyon, rooted against the walls
      const leaf = { leaf: '#2f7a40', leafLight: '#86c862', leafDark: '#1a4a34', bark: '#5a4636', barkDark: '#2a2018' };
      const figs = [flora.oakGeometry({ rng: fr, height: 20, detail: 1, fullness: 1.15, ...leaf })];
      await ctx.yield();
      figs.push(flora.oakGeometry({ rng: fr, height: 16, detail: 1, fullness: 1.2, ...leaf }));
      await ctx.yield();
      const pts = [];
      let side = fr.chance(0.5) ? 1 : -1;
      for (let s = 104 + fr.range(0, 6); s < sPortal - 62; s += fr.range(13, 19)) {
        const c = clI(s), lat = side * (c.hw - fr.range(1.2, 2.2)); side = -side;
        if (Math.abs(lat) < 6.4 || (lat > 0 && (Math.abs(s - sC) < 26 || (s > sFos - 14 && s < sFos + 26))) || (lat < 0 && (Math.abs(s - sLem1) < 13 || Math.abs(s - sLem2) < 11))) continue;   // no trunk behind the lemurs, in the alcove or on the fossa's bank
        const p = at(s, lat, 0.3);
        if (sightDist(p.x, p.z) < (s > sPortal - 150 ? 9.5 : 4.5)) continue;
        pts.push({ x: p.x, y: p.y, z: p.z, s: fr.range(1.0, 1.28), rot: fr.range(0, TAU), d: 7, u: 0.5, v: pts.length % 2 });
        figTrunks.push({ x: p.x, z: p.z, s, lat, sc: pts[pts.length - 1].s });
      }
      const forest = flora.makeScatter({ rng: fr, points: pts, variants: figs, material: floraMat, tint: 0.12, hue: 0.03, sink: 0.01, tilt: 0.08 });
      scene.add(forest.object); updaters.push(forest);
      await ctx.yield();
      // leaf masses: on the fissure walls where we pull out, under the fig limbs further on; none within four metres of the lens
      const bushes = [flora.bushGeometry({ rng: fr, size: 1.7, detail: 1, ...leaf }), flora.bushGeometry({ rng: fr, size: 1.4, detail: 1, ...leaf, leaf: '#356f38' })];
      await ctx.yield();
      const bR = Math.max(1.2, bushes[0].userData.radius || 1.5), bp = [];
      const addBush = (s, lat, y, margin = 4.2, maxS = 2.4) => {            // leaf masses keep their whole crown `margin` metres clear of the flight line
        const p = at(s, lat, y), dP = Math.min(path.distanceTo(p.x, p.y + bR * 0.6, p.z), path.distanceTo(p.x, p.y, p.z)), sc = Math.min(maxS, (dP - margin) / (bR * 1.25));
        if (sc < 0.7) return;
        bp.push({ x: p.x, y: p.y, z: p.z, s: sc * fr.range(0.8, 1), rot: fr.range(0, TAU), d: dP, u: 0.5, v: bp.length % 2 });
      };
      for (let s = 62; s < 150; s += fr.range(2.4, 4)) { const c = clI(s), sd = fr.chance(0.5) ? 1 : -1; addBush(s, sd * (c.hw + 0.2), pathYatS(s) + fr.range(-4, 7)); }
      for (let s = 104; s < 168; s += fr.range(3, 5.5)) addBush(s, fr.range(-6.5, 6.5), pathYatS(s) + fr.range(8.5, 12), 6.0, 1.7);
      var lemurBush = addBush;
      var bushPts = bp, bushVars = bushes;
    }
    await ctx.yield();

    // ---- our own geometry in one mesh: stilt roots, bananas, limestone blocks, the fallen trunk, the lemurs' limbs, the cave, roots, litter
    let S = new PG();
    const barkC = (i, k) => { const s = 0.8 + 0.3 * (((k * 5 + i * 3) % 7) / 7); return [0.2 * s, 0.155 * s, 0.11 * s]; };
    const kr = fr.fork('karren'), rk = () => kr();
    const blocks = [];                                       // { x, z, r, top } of the larger blocks (ferns sit on and against them)
    let KG = S;
    // the geometry goes to the card in pieces of about 12,000 corners, so no single step of the build is long
    const flushS = () => { if (!S.n) return; const m = new THREE.Mesh(S.build(), pocketMat); m.frustumCulled = false; scene.add(m); S = new PG(); KG = S; };
    const block = (x, z, R, H, layers = 3, moss = 1) => { const y = floorY(x, z), top = karren(KG, V3(x, y, z), R, H, rk, layers, moss, R > 1.2 ? 9 : 7); if (R > 0.8) blocks.push({ x, z, r: R, top }); return top; };
    const clearOf = (s, lat, r) => Math.abs(lat) - r > 2.7 && !(Math.abs(s - sPortal) < 9 && Math.abs(lat) < 7.6 + r);
    // blocks fallen from the walls: one large with a couple of small ones against it, all the way down both banks
    for (let s = 84; s < sEnd - 6; s += kr.range(3.2, 6.2)) {
      const c = clI(s), sd = kr.chance(0.5) ? 1 : -1, R = kr.range(0.8, 1.7), lat = sd * kr.range(3.6 + R, Math.max(3.8 + R, c.hw + hero.notch(s, 2) * (sd > 0 ? 1 : 0) + 0.6));
      const p = at(s, lat, 0);
      if (!clearOf(s, lat, R) || nearLog(p.x, p.z) < R + 1.2) continue;
      block(p.x, p.z, R, R * kr.range(0.9, 1.5), R > 1.25 ? 3 : 2);
      const n = kr.int(1, 3);
      for (let k = 0; k < n; k++) { const a = kr.range(0, TAU), d = R * kr.range(0.9, 1.5), r2 = kr.range(0.3, 0.6), x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d, c2 = clNear4(x, z), l2 = (x - c2.x) * c2.nx + (z - c2.z) * c2.nz;
        if (Math.abs(l2) - r2 > 2.6 && nearLog(x, z) > r2 + 0.9) block(x, z, r2, r2 * kr.range(0.8, 1.3), 2, 0.8); }
      if (S.n > 12000) { await ctx.yield(); flushS(); }
      if ((blocks.length & 3) === 3) await ctx.yield();
    }
    // small stones along the water's edge and over the banks
    for (let k = 0; k < Math.round(150 * detail); k++) {
      const s = kr.range(80, sEnd - 4), c = clI(s), lat = (kr.chance(0.5) ? 1 : -1) * (kr.chance(0.45) ? kr.range(2.7, 3.6) : kr.range(3.2, c.hw + 1)), r = kr.range(0.16, 0.38), p = at(s, lat, 0);
      if (!clearOf(s, lat, r) || nearLog(p.x, p.z) < 0.9) continue;
      karren(S, V3(p.x, floorY(p.x, p.z), p.z), r, r * kr.range(0.7, 1.2), rk, 1, 0.7, 6);
      if (k % 16 === 15) await ctx.yield();
      if (S.n > 12000) { flushS(); await ctx.yield(); }
    }
    await ctx.yield();
    // screw pines on stilt roots, wild bananas
    const palmPts = [], banPts = [];
    { let sd = fr.chance(0.5) ? 1 : -1;
      for (let s = 122 + fr.range(0, 10); s < sPortal - 34; s += fr.range(20, 30)) {
        const c = clI(s); if (c.hw < 8) continue;
        if (s > sPortal - 96) sd = -1;
        const p = at(s, sd * fr.range(6.3, 7.4), 0), y = floorY(p.x, p.z), sc = fr.range(0.85, 1.15), a0 = fr.range(0, TAU); sd = -sd;
        if (sightDist(p.x, p.z) < 4 || nearLog(p.x, p.z) < 3) continue;
        palmPts.push({ x: p.x, y: y + 1.0 * sc, z: p.z, s: sc, rot: fr.range(0, TAU), d: 6.5, u: 0.5, v: palmPts.length % 2 });
        for (let k = 0; k < 8; k++) {                       // stilt roots
          const a = a0 + (k / 8) * TAU + fr.range(-0.2, 0.2), R = fr.range(0.9, 1.5) * sc, h = fr.range(1.3, 2.0) * sc;
          tube(S, [V3(p.x, y + h, p.z), V3(p.x + Math.cos(a) * R * 0.45, y + h * 0.55, p.z + Math.sin(a) * R * 0.45), V3(p.x + Math.cos(a) * R, y - 0.15, p.z + Math.sin(a) * R)], (i) => 0.085 - 0.012 * i, 5, barkC, [6, 0, 0, 0.6]);
        }
      } }
    { let sd = fr.chance(0.5) ? 1 : -1, id = 0;
      for (let s = 108 + fr.range(0, 6); s < sPortal - 20; s += fr.range(10, 16) / Math.sqrt(dens)) {
        const c = clI(s); if (c.hw < 7.6) continue;
        if (s > sPortal - 96) sd = -1;
        const p = at(s, sd * fr.range(5.6, Math.min(7.3, c.hw - 1)), 0); sd = fr.chance(0.75) ? -sd : sd;
        if (sightDist(p.x, p.z) < 3.5 || nearLog(p.x, p.z) < 3.2) continue;
        banana(S, V3(p.x, floorY(p.x, p.z), p.z), fr.range(0, TAU), fr.range(0.85, 1.25), fr, id); id += 11; banPts.push(p);
      } }
    await ctx.yield();
    flushS();
    await ctx.yield();

    // ---- the fallen trunk (seen from u 0.84): pale bark in ridges, a broken end with split heartwood, branch stubs, moss, bracket fungi, a root plate
    let S2 = new PG(); KG = S2;
    const flushS2 = () => { if (!S2.n) return; const m = new THREE.Mesh(S2.build(), pocketMat); m.frustumCulled = false; scene.add(m); S2 = new PG(); KG = S2; };
    const logR = (e) => 0.5 + 0.14 * e, logSide = V3(-logDir.z, 0, logDir.x).normalize(), logUp = new THREE.Vector3().crossVectors(logSide, logDir).normalize();
    if (logUp.y < 0) { logUp.negate(); logSide.negate(); }
    const logAt = (e, out = new THREE.Vector3()) => out.copy(logA).addScaledVector(logDir, logLen * e);
    // buttress ridges and hollows round the trunk (up to a third of its radius), swellings along it
    const LNP = 17, lumpA = (an) => 1 + (0.16 * Math.sin(2 * an + 0.5) + 0.1 * Math.sin(3 * an + 2.2) + 0.06 * Math.sin(7 * an + 1)) * (1 - 0.45 * Math.max(0, -Math.sin(an)));
    const bulge = (i) => 1 + 0.07 * Math.sin(i * 0.9 + 1) + 0.04 * Math.sin(i * 2.3);
    const logTop = (e, out = new THREE.Vector3()) => logAt(e, out).addScaledVector(logUp, logR(e) * lumpA(-Math.PI / 2 + 0.02 * e * (LNP - 1)) * bulge(e * (LNP - 1)) - 0.03);
    { const cL = clNear4(logMid.x, logMid.z), flank = logSide.clone(); if (flank.x * cL.nx + flank.z * cL.nz > 0) flank.negate();      // the flank turned to the stream (and the lens)
      const lr2 = fr.fork('log'), pale = (i, k) => { const s = 0.82 + 0.3 * (((k * 5 + i * 3) % 7) / 7); return [0.5 * s, 0.37 * s, 0.27 * s]; };
      const pts = [], NP = LNP, LS = 36, dL = logLen / (LNP - 1);
      const ridge = (i, k) => { const fx = k / LS, al = i * dL, F = Math.abs(Math.sin(fx * TAU * 4.5 + 0.9 * Math.sin(al * 1.1 + fx * TAU) + 0.6 * Math.sin(al * 2.3))); return 1 + 0.085 * (sstep(0, 0.6, F) - 0.6); };   // the shader's bark ridges, in the mesh
      for (let i = 0; i < NP; i++) pts.push(logAt(i / (NP - 1)));
      seamTube(S2, pts, (i, k) => (logR(i / (NP - 1)) + (i === NP - 1 ? 0.22 : i === NP - 2 ? 0.1 : 0)) * lumpA((k / LS) * TAU + 0.02 * i) * bulge(i) * ridge(i, k), LS, pale, [6, 0, 4.5, 0.75]);
      await ctx.yield();
      // the broken end: a cap of heartwood and long splinters
      const heart = [0.6, 0.43, 0.25], heartD = [0.4, 0.26, 0.14], HA = [11, 0, 0, 0];
      { const c0 = S2.v(logA.x - logDir.x * 0.12, logA.y - logDir.y * 0.12, logA.z - logDir.z * 0.12, heartD, HA, [0.5, 0.5, 0]), ring = S2.n;
        for (let k = 0; k < LS; k++) { const a = (k / LS) * TAU, r = logR(0) * lumpA(-a) * bulge(0) * 0.98; S2.v(logA.x + (logSide.x * Math.cos(a) + logUp.x * Math.sin(a)) * r, logA.y + (logSide.y * Math.cos(a) + logUp.y * Math.sin(a)) * r, logA.z + (logSide.z * Math.cos(a) + logUp.z * Math.sin(a)) * r, heart, HA, [0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a), 0]); }
        for (let k = 0; k < LS; k++) S2.tri(c0, ring + k, ring + ((k + 1) % LS));
        for (let k = 0; k < 9; k++) {
          const a = lr2.range(0, TAU), r = logR(0) * lr2.range(0.45, 0.98), L = lr2.range(0.35, 1.25), w = lr2.range(0.07, 0.15), ca = Math.cos(a), sa = Math.sin(a);
          const bx = logA.x + (logSide.x * ca + logUp.x * sa) * r, by = logA.y + (logSide.y * ca + logUp.y * sa) * r, bz = logA.z + (logSide.z * ca + logUp.z * sa) * r, tx = -logSide.x * sa + logUp.x * ca, ty = -logSide.y * sa + logUp.y * ca, tz = -logSide.z * sa + logUp.z * ca;
          const p = S2.v(bx - tx * w, by - ty * w, bz - tz * w, heartD, HA, [0, 0, 0]), q = S2.v(bx + tx * w, by + ty * w, bz + tz * w, heart, HA, [0.2, 0, 0]), t = S2.v(bx - logDir.x * L, by - logDir.y * L + 0.08 * L, bz - logDir.z * L, heart, HA, [0.1, L, 0]);
          S2.tri(p, q, t);
        } }
      // branch stubs, snapped short
      for (const [e, a, L] of [[0.1, 0.35, 1.5], [0.24, -1.25, 0.9], [0.47, 1.3, 1.2], [0.63, -1.1, 0.7], [0.82, 1.2, 1.0]]) {
        const b = logAt(e), dir = logUp.clone().multiplyScalar(Math.cos(a)).addScaledVector(logSide, Math.sin(a)).addScaledVector(logDir, 0.35).normalize(), r0 = lr2.range(0.13, 0.19);
        seamTube(S2, [b.clone().addScaledVector(dir, logR(e) * 0.6), b.clone().addScaledVector(dir, logR(e) + L * 0.5).add(V3(0, 0.05, 0)), b.clone().addScaledVector(dir, logR(e) + L).add(V3(0, 0.16, 0))], (i) => r0 * (1 - 0.18 * i), 6, pale, [6, 0, 0, 0.5]);
        const tip = b.clone().addScaledVector(dir, logR(e) + L + 0.02).add(V3(0, 0.16, 0)), c0 = S2.v(tip.x, tip.y, tip.z, heart, HA, [0.5, 0.5, 0]), ring = S2.n - 1 - 7;   // the last ring of the stub closes on a point of heartwood
        for (let k = 0; k < 6; k++) S2.tri(c0, ring + k, ring + k + 1);
      }
      await ctx.yield();
      // moss cushions along the top, bracket fungi down the flank
      for (const [e, o] of [[0.05, 0.1], [0.19, -0.2], [0.52, 0.28], [0.68, -0.25], [0.9, 0.1], [0.98, -0.3]]) { const p = logTop(e).addScaledVector(logSide, o); blob(S2, [p.x, p.y - 0.03, p.z], [lr2.range(0.3, 0.5), 0.13, lr2.range(0.24, 0.36)], (x, y, z) => { const s = 0.7 + 0.5 * Math.abs(Math.sin(x * 7 + z * 5)); return [0.05 * s, 0.14 * s, 0.035 * s]; }, [9, 0, 0, 0], [0, 0, 0], 8, 4); }
      for (let k = 0; k < 9; k++) {
        const e = [0.14, 0.2, 0.3, 0.33, 0.44, 0.56, 0.6, 0.74, 0.86][k], R = lr2.range(0.2, 0.4), c = logAt(e).addScaledVector(flank, logR(e) * 0.93).addScaledVector(logUp, lr2.range(-0.22, 0.3));
        const top = [0.62, 0.44, 0.2], rim = [0.8, 0.7, 0.5], under = [0.3, 0.2, 0.1], FA = [10, 0, 0, 0];
        const c0 = S2.v(c.x, c.y + 0.03, c.z, top, FA, [0, 0, 0]), c1 = S2.v(c.x, c.y - 0.09, c.z, under, FA, [0, 0, 0]), ring = S2.n;
        for (let j = 0; j <= 6; j++) { const a = (j / 6) * Math.PI, x = c.x + (logDir.x * Math.cos(a) + flank.x * Math.sin(a)) * R, z = c.z + (logDir.z * Math.cos(a) + flank.z * Math.sin(a)) * R, y = c.y + logDir.y * Math.cos(a) * R; S2.v(x, y, z, rim, FA, [j / 6, 1, 0]); S2.v(x, y - 0.035, z, under, FA, [j / 6, 1, 0]); }
        for (let j = 0; j < 6; j++) { const a = ring + j * 2; S2.tri(c0, a, a + 2); S2.tri(c1, a + 3, a + 1); S2.quad(a, a + 1, a + 3, a + 2); }
      }
      // the root plate: a wall of earth and roots torn out of the ground, turned to the stream
      { const c = logAt(1.02), R = 1.55, earth = [0.15, 0.11, 0.075], earthL = [0.24, 0.18, 0.12], EA = [6, 0, 0, 0.45], N = 14;
        const pt = (a, r, o) => [c.x + (logSide.x * Math.cos(a) + logUp.x * Math.sin(a)) * r + logDir.x * o, c.y + (logSide.y * Math.cos(a) + logUp.y * Math.sin(a)) * r + logDir.y * o, c.z + (logSide.z * Math.cos(a) + logUp.z * Math.sin(a)) * r + logDir.z * o];
        const f0 = S2.v(...pt(0, 0, 0.5), earthL, EA, [0.5, 0, 0]), b0 = S2.v(...pt(0, 0, -0.1), earth, EA, [0.5, 0, 0]), ring = S2.n;
        for (let k = 0; k <= N; k++) { const a = (k / N) * TAU, w = 1 + 0.22 * Math.sin(k * 2.9) + 0.12 * Math.sin(k * 5.3 + 1); S2.v(...pt(a, R * 0.55 * w, 0.42), earthL, EA, [k / N, 0.5, 0]); S2.v(...pt(a, R * w, 0.12 + 0.12 * Math.sin(k * 1.9)), earth, EA, [k / N, 1, 0]); S2.v(...pt(a, R * 0.7 * w, -0.2), earth, EA, [k / N, 1.4, 0]); }
        for (let k = 0; k < N; k++) { const a = ring + k * 3, b = a + 3; S2.tri(f0, a, b); S2.quad(a, a + 1, b + 1, b); S2.quad(a + 1, a + 2, b + 2, b + 1); S2.tri(b0, b + 2, a + 2); }
        for (let k = 0; k < 11; k++) {                       // roots standing out of it, the lower ones still in the ground
          const a = (k / 11) * TAU + lr2.range(-0.2, 0.2), L = lr2.range(1.0, 2.3), r0 = lr2.range(0.1, 0.2), p0 = V3(...pt(a, R * 0.3, 0.42)), p1 = V3(...pt(a, R * 0.8, 0.5 + lr2.range(0, 0.3))), p2 = V3(...pt(a + lr2.range(-0.25, 0.25), R * 0.8 + L * 0.6, 0.55 + lr2.range(-0.2, 0.5))), p3 = V3(...pt(a + lr2.range(-0.4, 0.4), R * 0.8 + L, 0.5 + lr2.range(-0.3, 0.8)));
          for (const p of [p2, p3]) p.y = Math.max(p.y, floorY(p.x, p.z) - 0.1);
          seamTube(S2, [p0, p1, p2, p3], (i) => r0 * [1.2, 1, 0.6, 0.25][i], 5, (i, kk) => { const s = 0.8 + 0.3 * ((kk * 3 + i) % 4) / 4; return [0.3 * s, 0.25 * s, 0.19 * s]; }, [6, 0, 0, 0.2]);
        } }
      await ctx.yield();
      // the blocks it fell across
      const top1 = block(logA.x + flank.x * 0.3, logA.z + flank.z * 0.3, 1.9, 2.5, 3), m = logAt(0.56), top2 = block(m.x - flank.x * 0.5, m.z - flank.z * 0.5, 1.45, 1.9, 3);
      const q = logAt(0.3); block(q.x + flank.x * 1.7, q.z + flank.z * 1.7, 0.75, 0.9, 2); block(q.x + flank.x * 2.5 + logDir.x * 1.5, q.z + flank.z * 2.5 + logDir.z * 1.5, 0.42, 0.5, 2, 0.8);
      void top1; void top2;
    }
    await ctx.yield();
    // two fig limbs reaching out from the left wall with lemurs on them (seen from u 0.70 and 0.78)
    const lemurSeats = [];
    for (const [s, n] of [[sLem1, 4], [sLem2, 2]]) {
      const c = clI(s), pts = [];
      for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push(at(s + 1.2 * t * t, -(c.hw + 0.8) + (c.hw - 2.1) * t, 7.0 - 1.3 * t + 0.5 * Math.sin(t * Math.PI))); }
      seamTube(S2, pts, (i) => 0.36 - 0.035 * i, 8, barkC, [6, 0, 0, 1]);
      for (let k = 0; k < n; k++) {
        const t = 0.94 - k * 0.17, f = t * 5, i = Math.min(4, Math.floor(f)), q = pts[i].clone().lerp(pts[i + 1], f - i);
        lemurSeats.push({ p: q.add(V3(0, 0.36 - 0.035 * f - 0.03, 0)), yaw: Math.atan2(-c.tx, -c.tz) + fr.range(-0.5, 0.5) });
      }
      lemurBush(s + 0.5, -(c.hw - 0.6), 7.4, 2.3); lemurBush(s - 1.5, -(c.hw - 1.5), 8.2, 2.3);
    }
    // the cave the bats pour from: a dark mouth in the face of the alcove on the right wall, turned up the canyon toward us
    let caveC; const caveDrips = [], caveFerns = [];           // rootlets hanging from the cave's lip, ferns on its sill and brow (built further on)
    { const i0 = Math.round(sC / 1.5); let iF = i0;
      for (let i = i0 - 3; i <= i0 + 3; i++) if (hero.wallOff(i, 1, 7) < hero.wallOff(i - 1, 1, 7) - 2) { iF = i; break; }
      const oIn = hero.wallOff(iF, 1, 7), oOut = hero.wallOff(iF - 1, 1, 7), cF = cl[iF - 1], sF = cF.s + 0.25, latC = (oIn + oOut) / 2 + 0.2, hwid = Math.min(2.3, (oOut - oIn) * 0.36), hh = 2.7, yC = 7.3;
      caveC = at(sF, latC, yC);
      const nrm = V3(-cF.tx, 0, -cF.tz), rgt = V3(cF.nx, 0, cF.nz), dk = [0.012, 0.02, 0.022], dk2 = [0.05, 0.065, 0.07], NR = 24, CA = [7, 0, 0, 0];
      // a solution cave: a ragged opening, taller than wide and drawn up to a point, under an overhanging fluted lip of the wall's own stone
      const rimAt = (a, f) => { const top = Math.max(0, Math.sin(a)), bot = Math.max(0, -Math.sin(a));
        return [Math.cos(a) * hwid * f * (1 + 0.17 * Math.sin(a * 3 + 0.7) + 0.09 * Math.sin(a * 7 + 2)) * (1 - 0.3 * top * top) * (1 + 0.12 * bot), Math.sin(a) * hh * f * (1 + 0.12 * Math.sin(a * 2 + 1.3) + 0.08 * Math.sin(a * 5)) * (1 + 0.2 * top * top * top) * (1 - 0.18 * bot)]; };
      const cv = S2.v(caveC.x - nrm.x * 0.3, caveC.y - 0.3, caveC.z - nrm.z * 0.3, dk, CA, [0, 0, 0]), ring = S2.n;
      for (let k = 0; k < NR; k++) { const a = (k / NR) * TAU; for (const [f, col, o] of [[0.7, dk, 0.0], [1.04, dk2, 0.14]]) { const r = rimAt(a, f); S2.v(caveC.x + rgt.x * r[0] + nrm.x * o, caveC.y + r[1], caveC.z + rgt.z * r[0] + nrm.z * o, col, CA, [0, 0, 0]); } }
      for (let k = 0; k < NR; k++) { const a = ring + k * 2, b = ring + ((k + 1) % NR) * 2; S2.tri(cv, a, b); S2.quad(a, a + 1, b + 1, b); }
      // the lip, in the hero's stone so the wall's flutes, joints and moss carry across it: it stands furthest out over the top of the
      // mouth, least at the sides, and makes a sill below
      { const eMin = -(latC - oIn) + 0.08, eMax = oOut - latC + 1.2;                     // the lip stays on the alcove's return face
        const P = [], Cc = [], AX = [], I = [], ROWS = [[1.0, 0.1, 0.34, 0], [1.07, 1.0, 0.95, 0.22], [1.5, 0.62, 0.82, 0], [2.25, -1.3, 0.78, 0]];     // [radius factor, share of the overhang, shade, droop]
        for (let k = 0; k <= NR; k++) {
          const a = ((k % NR) / NR) * TAU, top = Math.max(0, Math.sin(a)), bot = Math.max(0, -Math.sin(a));
          const out = 0.3 + 1.25 * Math.pow(top, 1.5) + 0.75 * bot * bot + 0.28 * Math.abs(Math.sin(a * 5.5 + 1));
          const jag = 1 - 0.2 * Math.abs(Math.sin(a * 9 + 0.5)) * top;
          for (const [f, o, sh, droop] of ROWS) {
            const r = rimAt(a, f * (o === 1.0 ? jag : 1)), oo = o < 0 ? o : o * out, e = Math.max(eMin, Math.min(eMax, r[0])), y = caveC.y + r[1] - droop * top * (0.6 + 0.4 * Math.abs(Math.sin(a * 7)));
            P.push(caveC.x + rgt.x * e + nrm.x * oo, y, caveC.z + rgt.z * e + nrm.z * oo); Cc.push(sh, sh, sh); AX.push(700 + e, 0, 0, 1000);
          }
          if (k < NR && k % 2 === 0 && top > 0.35) { const r = rimAt(a, 1.07 * jag); caveDrips.push({ x: caveC.x + rgt.x * r[0] + nrm.x * out * 0.95, y: caveC.y + r[1] - 0.22 * top, z: caveC.z + rgt.z * r[0] + nrm.z * out * 0.95, len: fr.range(0.7, 2.3) }); }
          if (k < NR && (bot > 0.75 || (top > 0.8 && k % 2))) { const r = rimAt(a, 1.3); caveFerns.push({ p: V3(caveC.x + rgt.x * r[0] + nrm.x * out * 0.75, caveC.y + r[1] + (bot > 0 ? 0.1 : 0.25), caveC.z + rgt.z * r[0] + nrm.z * out * 0.75), sc: fr.range(0.9, 1.4) }); }
        }
        const W = ROWS.length;
        for (let k = 0; k < NR; k++) for (let j = 0; j < W - 1; j++) { const p0 = k * W + j, q0 = p0 + W; I.push(p0, q0, q0 + 1, p0, q0 + 1, p0 + 1); }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('aAux', new THREE.Float32BufferAttribute(AX, 4));
        g.setIndex(I); g.computeVertexNormals();
        const m = new THREE.Mesh(g, hero.rockMaterial); m.frustumCulled = false; scene.add(m);
      }
    }
    await ctx.yield();
    // fig roots snaking over the banks toward the water
    for (const f of figTrunks) {
      const c = clNear4(f.x, f.z), sg = f.lat > 0 ? -1 : 1;
      for (let k = 0; k < 5; k++) {
        const a = Math.atan2(c.nz * sg, c.nx * sg) + (k - 2) * 0.55 + fr.range(-0.2, 0.2), L = fr.range(3, 6.5), r0 = fr.range(0.13, 0.22) * f.sc, wig = fr.range(0, TAU), pts = [];
        for (let i = 0; i <= 7; i++) {
          const t = i / 7, d = 0.35 + L * t, w = 0.45 * Math.sin(t * 5 + wig) * t, x = f.x + Math.cos(a) * d - Math.sin(a) * w, z = f.z + Math.sin(a) * d + Math.cos(a) * w, c2 = clNear4(x, z);
          if (Math.abs((x - c2.x) * c2.nx + (z - c2.z) * c2.nz) < 2.9) break;
          pts.push(V3(x, floorY(x, z) + (i === 0 ? 0.9 : r0 * (1 - t) * 0.7 - 0.02 * t), z));
        }
        if (pts.length > 2) seamTube(S2, pts, (i) => r0 * (1.5 - 1.25 * (i / 7)), 5, barkC, [6, 0, 0, 0.7]);
      }
    }
    await ctx.yield();
    flushS2();
    await ctx.yield();
    // leaf litter over the banks from the water to the foot of the walls
    { const lt = fr.fork('litter'), cols = [[0.5, 0.36, 0.12], [0.27, 0.16, 0.075], [0.42, 0.21, 0.075], [0.17, 0.3, 0.08], [0.56, 0.45, 0.2], [0.2, 0.12, 0.06]], LA = [10, 0, 0, 0], N = Math.round(4600 * detail);
      for (let k = 0; k < N; k++) {
        const s = lt.range(78, sEnd - 2), c = clI(s), lat = (lt.chance(0.5) ? 1 : -1) * lt.range(2.3, c.hw + 1.8), x = c.x + c.nx * lat, z = c.z + c.nz * lat, y = floorY(x, z) + 0.035 + lt.range(0, 0.03);
        const a = lt.range(0, TAU), L = lt.range(0.13, 0.25), w = L * lt.range(0.4, 0.6), ca = Math.cos(a), sa = Math.sin(a), col = cols[lt.int(0, cols.length - 1)], tl = lt.range(-0.05, 0.05);
        const p = S2.v(x + ca * L, y + tl, z + sa * L, col, LA, [0.5, 1, 0]), q = S2.v(x - sa * w, y + 0.02, z + ca * w, col, LA, [1, 0.5, 0]), r = S2.v(x - ca * L, y - tl, z - sa * L, col, LA, [0.5, 0, 0]), t = S2.v(x + sa * w, y, z - ca * w, col, LA, [0, 0.5, 0]);
        S2.quad(p, q, r, t);
        if ((k & 511) === 511) await ctx.yield();
        if (S2.n > 12000) { flushS2(); await ctx.yield(); }
      } }
    flushS2();
    await ctx.yield();
    // the foot of the fissure, where the dive bottoms out (u 0.50-0.56): leaf litter and small stones here too, so the floor under the lens is never bare
    { const lt = xr.fork('litter0'), cols = [[0.5, 0.36, 0.12], [0.27, 0.16, 0.075], [0.42, 0.21, 0.075], [0.17, 0.3, 0.08], [0.56, 0.45, 0.2], [0.2, 0.12, 0.06]], LA = [10, 0, 0, 0], N = Math.round(1500 * detail);
      for (let k = 0; k < N; k++) {
        const s = lt.range(40, 86), c = clI(s), lat = (lt.chance(0.5) ? 1 : -1) * lt.range(2.2, c.hw + 1.8), x = c.x + c.nx * lat, z = c.z + c.nz * lat, y = floorY(x, z) + 0.035 + lt.range(0, 0.03);
        const a = lt.range(0, TAU), L = lt.range(0.13, 0.25), w = L * lt.range(0.4, 0.6), ca = Math.cos(a), sa = Math.sin(a), col = cols[lt.int(0, cols.length - 1)], tl = lt.range(-0.05, 0.05);
        const p = S2.v(x + ca * L, y + tl, z + sa * L, col, LA, [0.5, 1, 0]), q = S2.v(x - sa * w, y + 0.02, z + ca * w, col, LA, [1, 0.5, 0]), r = S2.v(x - ca * L, y - tl, z - sa * L, col, LA, [0.5, 0, 0]), t = S2.v(x + sa * w, y, z - ca * w, col, LA, [0, 0.5, 0]);
        S2.quad(p, q, r, t);
        if ((k & 511) === 511) await ctx.yield();
      }
      const rk0 = () => lt();
      for (let k = 0; k < 46; k++) {
        const s = lt.range(44, 86), c = clI(s), big = k < 9, r = big ? lt.range(0.5, 0.95) : lt.range(0.16, 0.4), lat = (lt.chance(0.5) ? 1 : -1) * lt.range(3.0 + r, Math.max(3.2 + r, c.hw + 0.4)), p = at(s, lat, 0);
        if (path.distanceTo(p.x, 1.2, p.z) < 2.6 + r) continue;
        karren(S2, V3(p.x, floorY(p.x, p.z), p.z), r, r * lt.range(0.8, 1.3), rk0, big ? 2 : 1, 0.9, big ? 7 : 6);
        if (k % 12 === 11) await ctx.yield();
      } }
    flushS2();
    await ctx.yield();

    // ---- beds that stand proud of the fissure and canyon walls as real ledges (the hero's own stone, so its courses, runnels and moss carry over
    // them), with ferns on them and rootlets off their lips; then lianas down the fissure, the waterfall, the root columns of the keyhole
    const ledgeFerns = [], ledgeDrips = [], farObjs = [];
    const xr6 = ctx.core.makeRng(((ctx.seed | 0) * 2246822519 + 613) >>> 0);   // this round's additions draw from a generator of their own: nothing before them moves
    const clF = (s) => { const f = Math.max(0, Math.min(cl.length - 1.001, s / 1.5)), i = Math.floor(f), t = f - i, a = cl[i], b = cl[i + 1]; return { x: lerp(a.x, b.x, t), z: lerp(a.z, b.z, t), nx: lerp(a.nx, b.nx, t), nz: lerp(a.nz, b.nz, t), tx: lerp(a.tx, b.tx, t), tz: lerp(a.tz, b.tz, t) }; };
    const wallF = (s, sd, y) => { const f = Math.max(0, Math.min(cl.length - 1.001, s / 1.5)), i = Math.floor(f); return lerp(hero.wallOff(i, sd, y), hero.wallOff(i + 1, sd, y), f - i); };
    // where the waterfall comes down the left wall: 18 to 27 m beyond the lens at u 0.79, wherever the bank in front of it is most open
    const sFall = (() => {
      const s79 = sOfU(0.79), left = [];
      for (const p of [...palmPts, ...banPts, ...figTrunks]) { const c = clNear4(p.x, p.z); if ((p.x - c.x) * c.nx + (p.z - c.z) * c.nz < 0) left.push(c.s); }
      let best = s79 + 22, bd = -1;
      for (let s = s79 + 18; s <= s79 + 27; s += 1) { let d = 1e9; for (const q of left) d = Math.min(d, q < s ? (s - q) * 0.6 : q - s); if (Math.abs(s - sLem2) < 6) d = 0; if (d > bd) { bd = d; best = s; } }
      return best;
    })();
    // the holds the troop uses and the lemurs' seats: no ledge is laid through an animal
    const keepPts = [];
    for (const an of hero._lab.troop) { if (an.home && an.home.p && an.home.p.y < 63) keepPts.push(an.home.p); for (const e of an.ev || []) { if (e.a && e.a.y < 63) keepPts.push(e.a); if (e.b && e.b.y < 63) keepPts.push(e.b); } }
    for (const st of lemurSeats) keepPts.push(st.p);
    const nearKeep = (x, y, z, r) => { for (const q of keepPts) { const dx = q.x - x, dy = q.y - y, dz = q.z - z; if (dx * dx + dy * dy + dz * dz < r * r) return true; } return false; };
    await ctx.yield();
    {
      const LG = { P: [], Nn: [], Cc: [], AX: [], I: [], n: 0 };
      // one ledge: a bed L metres long standing D metres out of the wall with a lip H metres deep, tapering into the wall at both ends, its edge ragged
      const ledge = (s0, sd, y0, L, D, H, rnd, force = false) => {
        const n = Math.max(5, Math.round(L / 0.75)), ph = rnd() * TAU, dip = (rnd() - 0.5) * 0.06, rows = [];
        for (let k = 0; k <= n; k++) {
          const t = k / n, s = s0 + L * t, c = clF(s), y = y0 + dip * L * (t - 0.5) + 0.08 * Math.sin(t * L * 0.9 + ph);
          const end = Math.sqrt(Math.min(1, (Math.min(t, 1 - t) * L) / 1.4)), rag = 0.74 + 0.26 * Math.sin(t * L * 1.9 + ph) * Math.sin(t * L * 0.83 + 2 * ph);
          const d = D * end * rag, h = Math.max(0.05, H * end * (0.75 + 0.25 * rag)), o = Math.min(wallF(s, sd, y), wallF(s, sd, y - h)) - d;
          const x = c.x + c.nx * o * sd, z = c.z + c.nz * o * sd;
          if (!force && (path.distanceTo(x, y, z) < 2.7 || nearKeep(x, y, z, 2.1))) return false;
          rows.push({ c, s, y, d, h, o, x, z });
        }
        // (wall flag 2: a ledge; 3: a ledge on the wall that faces away from the sun, which the wall itself keeps in shade)
        const b0 = LG.n, cm = rows[rows.length >> 1].c, flag = -(cm.nx * sunV.x + cm.nz * sunV.z) * sd > 0.05 ? 2 : 3;
        for (const r of rows) {
          const c = r.c, ix = -c.nx * sd, iz = -c.nz * sd, oT = wallF(r.s, sd, r.y) + 0.4, yR = r.y - r.h - 1.15 * r.d - 0.2, oR = wallF(r.s, sd, yR) + 0.4, yL = r.y - 0.03 - 0.07 * r.d;
          const put = (o, y, nx, ny, nz, sh) => { LG.P.push(c.x + c.nx * o * sd, y, c.z + c.nz * o * sd); LG.Nn.push(nx, ny, nz); LG.Cc.push(sh, sh, sh); LG.AX.push(r.s, 0, flag, 1000); LG.n++; };
          put(oT, r.y + 0.03, ix * 0.12, 0.99, iz * 0.12, 1.0); put(r.o, yL, ix * 0.12, 0.99, iz * 0.12, 1.06);
          put(r.o, yL, ix, 0.1, iz, 1.1); put(r.o + 0.05, yL - r.h, ix, -0.1, iz, 0.92);
          put(r.o + 0.05, yL - r.h, ix * 0.55, -0.83, iz * 0.55, 0.5); put(oR, yR, ix * 0.55, -0.83, iz * 0.55, 0.36);
        }
        for (let k = 0; k < n; k++) for (let j = 0; j < 3; j++) { const a = b0 + k * 6 + j * 2, b = a + 6; LG.I.push(a, b, b + 1, a, b + 1, a + 1); }
        for (let k = 1; k < n; k++) {
          const r = rows[k];
          if (r.d > 0.45 && rnd() < 0.2) { const o = r.o + r.d * (0.35 + 0.3 * rnd()); ledgeFerns.push({ p: V3(r.c.x + r.c.nx * o * sd, r.y - 0.02, r.c.z + r.c.nz * o * sd), sc: 0.55 + 0.5 * rnd() }); }
          if (r.d > 0.4 && rnd() < 0.34) ledgeDrips.push({ x: r.x, y: r.y - r.h * 0.6, z: r.z, len: 0.8 + 2.6 * rnd(), ph: rnd() * TAU });
        }
        return true;
      };
      const lg = xr6.fork('ledges'), R = () => lg(), sArch = A.arch ? A.arch.s : -999;
      // down the fissure, where the dive looks along them end-on
      let made = 0;
      for (let k = 0; k < 56 && made < 22; k++) {
        const s0 = 8 + ((k % 28) / 28) * 70 + lg.range(0, 2.4), sd = (k % 2 ? 1 : -1) * (lg.chance(0.8) ? 1 : -1), L = lg.range(4, 10.5), yP = pathYatS(s0 + L / 2);
        const y0 = Math.max(2.8, Math.min(60, yP + lg.range(-15, 6.5))), D = lg.range(0.55, 1.15), H = lg.range(0.45, 0.9);
        if (ledge(s0, sd, y0, L, D, H, R)) made++;
        if ((k & 3) === 3) await ctx.yield();
      }
      // the ledge the waterfall breaks on, then the canyon walls at three heights (none in the bats' alcove, behind the lemurs or under the fallen blade)
      ledge(sFall - 2.7, -1, 12.6, 5.4, 1.3, 0.8, R, true);
      let made2 = 0;
      for (let k = 0; k < 64 && made2 < 26; k++) {
        const L = lg.range(9, 24), s0 = lg.range(92, sPortal - 32 - L), sd = lg.chance(0.5) ? 1 : -1, band = k % 3, y0 = band === 0 ? lg.range(6.6, 9.6) : band === 1 ? lg.range(12, 18) : lg.range(22, 32);
        const D = lg.range(0.7, 1.5), H = lg.range(0.55, 1.1), sm = s0 + L / 2, hl = L / 2;
        if ((k & 3) === 3) await ctx.yield();
        if (sd > 0 && s0 + L > sC - 38 && s0 < sC + 6) continue;
        if (sd < 0 && Math.abs(sm - sFall) < hl + 4.5) continue;
        if (Math.abs(sm - sArch) < hl + 5 && y0 > 6 && y0 < 20) continue;
        if (sd < 0 && y0 < 12 && (Math.abs(sm - sLem1) < hl + 5 || Math.abs(sm - sLem2) < hl + 5)) continue;
        if (ledge(s0, sd, y0, L, D, H, R)) made2++;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(LG.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(LG.Nn, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(LG.Cc, 3)); g.setAttribute('aAux', new THREE.Float32BufferAttribute(LG.AX, 4));
      g.setIndex(LG.n > 65535 ? new THREE.Uint32BufferAttribute(LG.I, 1) : new THREE.Uint16BufferAttribute(LG.I, 1));
      const m = new THREE.Mesh(g, hero.rockMaterial); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();
    let S3 = new PG();
    const barkR = (i, k) => { const s = 0.8 + 0.3 * (((k * 5 + i * 3) % 7) / 7); return [0.31 * s, 0.26 * s, 0.2 * s]; };      // the pale bark of fig roots
    // lianas down the fissure: each leaves the wall high up, hangs three or four metres out from the flight line and goes back to the wall far below, so the
    // dive passes between them and they run past the lens toward the floor
    { const lv = xr6.fork('lianas');
      for (let k = 0; k < 13; k++) {
        const s = 11 + k * 4.2 + lv.range(0, 2.4), sd = k % 2 ? 1 : -1, c = clF(s), yP = pathYatS(s), yT = Math.min(67, yP + lv.range(9, 17)), len = Math.min(yT - 1.2, lv.range(16, 30));
        const wo = wallF(s, sd, yP), hang = Math.min(wo - 0.9, lv.range(2.8, 4.0)), ph = lv.range(0, TAU), r0 = lv.range(0.045, 0.085), pts = [];
        let ok = hang > 2.5;
        for (let i = 0; i <= 10 && ok; i++) {
          const t = i / 10, y = yT - len * t, out = sstep(0, 0.16, t) * (1 - sstep(0.78, 1, t)), lat = sd * lerp(Math.min(wallF(s, sd, y), wo + 1) - 0.1, hang, out), al = 0.5 * Math.sin(t * 4 + ph) * out;
          const p = V3(c.x + c.nx * lat + c.tx * al, y, c.z + c.nz * lat + c.tz * al);
          if (path.distanceTo(p.x, p.y, p.z) < 2.3) ok = false;
          pts.push(p);
        }
        if (ok) seamTube(S3, pts, (i) => r0 * (1 + 0.5 * Math.abs(Math.sin(i * 1.7 + ph))), 5, barkC, [6, 0, 0, 0.5]);
        if ((k & 3) === 3) await ctx.yield();
      } }
    await ctx.yield();
    // the waterfall (seen ahead from u 0.70, beside the lens at u 0.79-0.81): a thread down the left wall from 33 m, breaking on a ledge at 12 m and
    // fanning to the foot of the wall in spray; a runnel takes the water over the bank to the stream
    {
      const wr = xr6.fork('fall'), sd = -1, FP = [], FR = [], FS = [], FI = []; let fn = 0;
      const wpt = (ds, o, y) => { const c = clF(sFall + ds); return V3(c.x + c.nx * o * sd, y, c.z + c.nz * o * sd); };
      const thread = (pts, hw, v0, ph) => {
        const b0 = fn; let v = v0;
        for (let i = 0; i < pts.length; i++) { if (i) v += pts[i].distanceTo(pts[i - 1]); for (const sx of [-1, 1]) { FP.push(pts[i].x, pts[i].y, pts[i].z); FR.push(sx, v, hw(i / (pts.length - 1)), 0); FS.push(ph); fn++; } }
        for (let i = 0; i < pts.length - 1; i++) { const a = b0 + i * 2; FI.push(a, a + 1, a + 3, a, a + 3, a + 2); }
      };
      const puff = (p, r, ph) => { const b0 = fn; for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { FP.push(p.x, p.y, p.z); FR.push(cx, cy, r, 1); FS.push(ph); fn++; } FI.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3); };
      const yTop = 33, yLed = 12.65, oLip = wallF(sFall, sd, 12.6) - 1.3, oTop = (ds) => wallF(sFall + ds, sd, yTop);
      for (const [ds, y0, w0, w1] of [[0, yTop, 0.1, 0.42], [0.55, 30.5, 0.06, 0.2], [-0.5, 27.5, 0.06, 0.22]]) {
        const pts = [], ph = wr.range(0, 1);
        for (let i = 0; i <= 12; i++) { const t = i / 12, y = lerp(y0, yLed, t), f = (yTop - y) / (yTop - yLed); pts.push(wpt(ds + 0.12 * Math.sin(t * 5 + ph * 6), Math.max(oLip + 0.25, Math.min(oTop(ds), wallF(sFall + ds, sd, y)) - 0.3 - 0.6 * f * f), y)); }
        thread(pts, (t) => lerp(w0, w1, t), yTop - y0, ph);
      }
      const oFootAt = (y, t) => Math.min(oLip - 0.1, wallF(sFall, sd, y) - 0.35) - 0.9 * t;
      for (let k = 0; k < 4; k++) {
        const pts = [], ph = wr.range(0, 1);
        for (let i = 0; i <= 9; i++) { const t = i / 9, y = lerp(yLed - 0.2, 0.45, t * (0.6 + 0.4 * t)); pts.push(wpt((k - 1.5) * (0.5 + 0.95 * t), oFootAt(y, t), y)); }
        thread(pts, (t) => lerp(0.2, 0.5, t), yTop - yLed, ph);
      }
      for (let k = 0; k < 4; k++) puff(wpt(wr.range(-0.9, 0.9), oLip + wr.range(0.2, 0.8), yLed + wr.range(0.3, 1.0)), wr.range(0.9, 1.5), wr.range(0, 1));
      const oFoot = oFootAt(0.45, 1);
      for (let k = 0; k < 8; k++) puff(wpt(wr.range(-2.2, 2.2), oFoot + wr.range(-0.9, 0.5), wr.range(0.5, 2.3)), wr.range(1.3, 2.4), wr.range(0, 1));
      // the runnel over the bank
      { const b0 = fn, NR = 8;
        for (let i = 0; i <= NR; i++) {
          const t = i / NR, o = lerp(oFoot + 0.2, 2.7, t), ds = 1.9 * t + 0.6 * Math.sin(t * 3.4), c = clF(sFall + ds), hwid = lerp(0.75, 0.5, t);
          for (const ax of [-1, 0, 1]) { const x = c.x + c.nx * o * sd + c.tx * ax * hwid, z = c.z + c.nz * o * sd + c.tz * ax * hwid; FP.push(x, floorY(x, z) + 0.07, z); FR.push(ax, -o, 0, 2); FS.push(3.7); fn++; }
        }
        for (let i = 0; i < NR; i++) for (let j = 0; j < 2; j++) { const a = b0 + i * 3 + j; FI.push(a, a + 3, a + 4, a, a + 4, a + 1); } }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(FP, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(FR, 4)); g.setAttribute('aS', new THREE.Float32BufferAttribute(FS, 1)); g.setIndex(FI);
      const lum = (stripC.r + stripC.g + stripC.b) / 3;
      const fall = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: FALL_VERT, fragmentShader: FALL_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uCol: { value: new THREE.Color(0.66 * lum, 0.72 * lum, 0.8 * lum) } } }));
      fall.frustumCulled = false; fall.renderOrder = 3; scene.add(fall);
      // blocks in the spray at its foot, ferns on either hand
      const rkW = () => wr();
      for (const [ds, o, R] of [[-1.7, 0.5, 0.95], [1.6, 0.3, 0.75], [0.4, -1.3, 0.45], [-0.6, 1.3, 0.6], [2.6, -0.6, 0.4]]) { const p = wpt(ds, oFoot + o, 0); karren(S3, V3(p.x, floorY(p.x, p.z), p.z), R, R * wr.range(0.9, 1.4), rkW, R > 0.7 ? 2 : 1, 1, R > 0.7 ? 8 : 6); }
      for (const [ds, o] of [[-3.0, 0.6], [-2.4, -0.7], [3.1, 0.4], [2.6, -1.0], [3.8, -0.2], [-3.7, -0.4]]) { const p = wpt(ds, oFoot + o, 0); p.y = floorY(p.x, p.z) - 0.02; ledgeFerns.push({ p, sc: wr.range(1.1, 1.7) }); }
    }
    await ctx.yield();
    // the keyhole: columns of fig root coming down from the Cathedral on both hands, so the ring stands framed between them (u 0.87-1.0);
    // none stands in a line of sight to the portal
    { const rc = xr6.fork('columns');
      for (const [back, side] of [[6.5, -1], [7.5, 1], [13.5, 1], [15, -1], [21, -1], [22.5, 1], [29.5, 1], [31, -1]]) {
        const s = sPortal - back, c = clF(s), wo = wallF(s, side, 3), minLat = back < 10 ? 7.9 : 6.4, ph = rc.range(0, TAU), r0 = rc.range(0.3, 0.42), yT = rc.range(22, 27), jit = rc.range(0, 1.2);
        let lat = Math.min(wo - 0.9, back < 10 ? 8.6 : 7.4 + jit);
        while (lat < wo - 0.5 && sightDist(c.x + c.nx * lat * side, c.z + c.nz * lat * side) < 5.2) lat += 0.4;
        if (lat < minLat || sightDist(c.x + c.nx * lat * side, c.z + c.nz * lat * side) < 5.2) continue;
        const bx = c.x + c.nx * lat * side, bz = c.z + c.nz * lat * side, yF = floorY(bx, bz) - 0.25, oT = wallF(s, side, yT) + 0.2, NPT = 8, pts = [];
        for (let i = 0; i <= NPT; i++) { const t = i / NPT, l = lerp(oT, lat, sstep(0, 0.32, t)) * side, al = 0.3 * Math.sin(t * 3 + ph); pts.push(V3(c.x + c.nx * l + c.tx * al, lerp(yT, yF, t), c.z + c.nz * l + c.tz * al)); }
        seamTube(S3, pts, (i, k) => r0 * (1 + 0.9 * Math.pow(i / NPT, 5)) * (1 + 0.17 * Math.sin((k / 9) * TAU * 3 + i * 0.8 + ph)), 9, barkR, [6, 0, 0, 0.8]);
        for (let j = 0; j < 2; j++) {                        // two thinner roots wound round it, splayed out as props at the foot
          const a0 = ph + j * 2.6, r1 = rc.range(0.1, 0.15), tw = rc.range(1.6, 2.6) * (j ? -1 : 1), reach = rc.range(1.1, 1.9), q = [];
          for (let i = 0; i <= 7; i++) { const t = 0.12 + 0.88 * (i / 7), f = t * NPT, i0 = Math.min(NPT - 1, Math.floor(f)), p = pts[i0].clone().lerp(pts[i0 + 1], f - i0), an = a0 + tw * t * 3, rad = r0 * 1.15 + reach * Math.pow(t, 6);
            q.push(p.add(V3(Math.cos(an) * rad, t > 0.97 ? -0.15 : 0, Math.sin(an) * rad))); }
          seamTube(S3, q, (i) => r1 * (1 + 0.4 * (i / 7)), 5, barkR, [6, 0, 0, 0.6]);
        }
        ledgeFerns.push({ p: V3(bx - c.nx * side * 0.9, floorY(bx - c.nx * side * 0.9, bz - c.nz * side * 0.9) - 0.02, bz - c.nz * side * 0.9), sc: rc.range(1.0, 1.5) });
        await ctx.yield();
      } }
    // rootlets off the underside of the fallen blade
    if (A.arch) for (const p of A.arch.foot) for (let j = 0; j < 2; j++) ledgeDrips.push({ x: p.x + xr6.range(-0.7, 0.7), y: p.y + 0.1, z: p.z + xr6.range(-0.7, 0.7), len: xr6.range(1.4, 4.2), ph: xr6.range(0, TAU) });
    if (S3.n) { const m = new THREE.Mesh(S3.build(), pocketMat); m.frustumCulled = false; scene.add(m); }
    await ctx.yield();

    // ---- ferns on pads of moss: on the ledges of the fissure walls, at the foot of the canyon walls, against blocks and along the trunk
    {
      const fg = fr.fork('ferns2'), geo = fernClumpGeometry(() => fg(), 5, false), list = [], qy = new THREE.Quaternion(), q2 = new THREE.Quaternion(), Yv = V3(0, 1, 0), dirV = new THREE.Vector3(), pw = new THREE.Vector3(), m4 = new THREE.Matrix4(), s3 = new THREE.Vector3();
      const put = (p, dir, sc) => { qy.setFromAxisAngle(Yv, fg.range(0, TAU)); q2.setFromUnitVectors(Yv, dir).multiply(qy); list.push(m4.compose(p, q2, s3.set(sc, sc * fg.range(0.85, 1.2), sc)).clone()); };
      // the fissure walls where we plunge and pull out, and the canyon walls beyond, thinning with height
      let fk = 0;
      for (let s = 7; s < sEnd - 8; s += s < 100 ? fg.range(0.3, 0.6) : fg.range(1.6, 3.2)) {
        if ((++fk & 63) === 0) await ctx.yield();
        const sd = fg.chance(0.5) ? 1 : -1, i = s / 1.5, c = clI(s), yP = pathYatS(s), y = s < 100 ? yP + fg.range(-9, 8) : fg.range(1.5, 13);
        if (y < 1) continue;
        hero.wallAt(i, sd, y, pw, 0.1);
        const o0 = hero.wallOff(i, sd, y + 0.6), o1 = hero.wallOff(i, sd, y - 0.6), slope = (o1 - o0) / 1.2;      // > 0 where the wall leans back (a ledge)
        if (path.distanceTo(pw.x, pw.y, pw.z) < 2.6) continue;
        dirV.set(-c.nx * sd * 0.75, 0.66 + Math.max(-0.3, Math.min(0.5, slope)), -c.nz * sd * 0.75).normalize();
        put(pw, dirV, fg.range(0.6, 1.15) * (s < 100 ? 1 : 1.25));
      }
      await ctx.yield();
      // the foot of the walls and the banks
      for (let k = 0; k < Math.round(230 * dens); k++) {
        const s = fg.range(84, sEnd - 3), c = clI(s), sd = fg.chance(0.5) ? 1 : -1, wo = hero.wallOff(s / 1.5, sd, 1), lat = sd * (fg.chance(0.5) ? wo - fg.range(0.2, 1.3) : fg.range(3.1, wo - 0.5));
        if (!clearOf(s, lat, 0.6)) continue;
        at(s, lat, 0, pw); pw.y = floorY(pw.x, pw.z) - 0.02;
        put(pw, dirV.set(fg.range(-0.15, 0.15), 1, fg.range(-0.15, 0.15)).normalize(), fg.range(0.9, 1.7));
      }
      // against and on the blocks
      for (const b of blocks) {
        const n = fg.int(1, 3);
        for (let k = 0; k < n; k++) { const a = fg.range(0, TAU), d = b.r * fg.range(0.95, 1.2); pw.set(b.x + Math.cos(a) * d, 0, b.z + Math.sin(a) * d); const c2 = clNear4(pw.x, pw.z); if (Math.abs((pw.x - c2.x) * c2.nx + (pw.z - c2.z) * c2.nz) < 3) continue; pw.y = floorY(pw.x, pw.z); put(pw, dirV.set(Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3).normalize(), fg.range(0.9, 1.5)); }
        if (fg.chance(0.45)) { pw.set(b.x + fg.range(-0.2, 0.2) * b.r, b.top - 0.12, b.z + fg.range(-0.2, 0.2) * b.r); put(pw, Yv, fg.range(0.6, 0.95)); }
      }
      // along the trunk: at its foot on the stream side, and one on the root plate
      for (const e of [0.12, 0.27, 0.4, 0.5, 0.64, 0.78, 0.92]) { logAt(e, pw); const c2 = clNear4(pw.x, pw.z), sg = (pw.x - c2.x) * c2.nx + (pw.z - c2.z) * c2.nz > 0 ? -1 : 1; pw.x += c2.nx * sg * (logR(e) + 0.5 + fg.range(0, 0.7)); pw.z += c2.nz * sg * (logR(e) + 0.5 + fg.range(0, 0.7)); pw.y = floorY(pw.x, pw.z); put(pw, Yv, fg.range(1.0, 1.6)); }
      logAt(1.03, pw).addScaledVector(logUp, 1.5); put(pw, Yv, 0.9);
      for (const f of caveFerns) put(f.p, Yv, f.sc);
      { const f0 = xr.fork('ferns0');                          // and on the banks at the foot of the fissure
        for (let k = 0; k < Math.round(70 * dens); k++) {
          const s = f0.range(42, 86), c = clI(s), sd = f0.chance(0.5) ? 1 : -1, wo = hero.wallOff(s / 1.5, sd, 1), lat = sd * (f0.chance(0.6) ? wo - f0.range(0.2, 1.2) : f0.range(3.0, Math.max(3.1, wo - 0.4)));
          at(s, lat, 0, pw); pw.y = floorY(pw.x, pw.z) - 0.02;
          if (path.distanceTo(pw.x, pw.y + 0.5, pw.z) < 2.7) continue;
          put(pw, dirV.set(f0.range(-0.15, 0.15), 1, f0.range(-0.15, 0.15)).normalize(), f0.range(0.9, 1.6));
        } }
      for (const f of ledgeFerns) put(f.p, Yv, f.sc);          // on the new ledges, at the foot of the waterfall and of the root columns
      // two meshes: the ferns of the fissure and of the canyon's mouth, which the dive looks down on, and those further along the canyon, which are not drawn until
      // the lens is down in the fissure and the tops are put away (so the two halves of the world are never both drawn in full)
      const nearL = [], farL = [];
      for (const mm of list) { const e = mm.elements; (clNear4(e[12], e[14]).s < 138 ? nearL : farL).push(mm); }
      for (const [L, far] of [[nearL, false], [farL, true]]) {
        if (!L.length) continue;
        const ferns = new THREE.InstancedMesh(geo, pocketMat, L.length);
        L.forEach((mm, i) => ferns.setMatrixAt(i, mm));
        ferns.instanceMatrix.needsUpdate = true; ferns.frustumCulled = false; scene.add(ferns);
        if (far) farObjs.push(ferns);
      }
    }
    await ctx.yield();

    // plants from the kit: leaf masses, screw pines, ferns and ground cover on the banks
    {
      const bush = flora.makeScatter({ rng: fr, points: bushPts, variants: bushVars, material: floraMat, tint: 0.14, hue: 0.04, sink: 0.05, tilt: 0.5 });
      scene.add(bush.object); updaters.push(bush);
      if (palmPts.length) {
        const pl = { leaf: '#2f7a40', leafLight: '#78c868', leafDark: '#123c2a', bark: '#4a4034' };
        const palms = flora.makeScatter({ rng: fr, points: palmPts, material: floraMat, tint: 0.1, sink: 0, tilt: 0.12,
          variants: [flora.palmGeometry({ rng: fr, height: 5.5, fronds: 15, curve: 0.25, coconuts: false, ...pl }), flora.palmGeometry({ rng: fr, height: 4.4, fronds: 13, curve: 0.5, coconuts: false, ...pl })] });
        scene.add(palms.object); updaters.push(palms);
      }
      await ctx.yield();
      const ferns = flora.makeFerns({ rng: fr.fork('ferns'), path, uRange: [uCanyon, 0.992], radius: 9.6, corridor: 2.9, count: Math.round(420 * dens * detail), heightAt: floorY, material: floraMat, scale: [0.8, 1.7], chunks: 2,
        density: (x, z) => (nearLog(x, z) < 1.3 ? 0 : 1), colors: ['#5f9a62', '#3f7a50', '#86b070'] });
      scene.add(ferns.object); updaters.push(ferns);
      await ctx.yield();
      // ground cover in three stretches (each its own build step)
      const gU = [uCanyon, uCanyon + (0.99 - uCanyon) / 3, uCanyon + (2 * (0.99 - uCanyon)) / 3, 0.99];
      for (let g = 0; g < 3; g++) {
        const grass = await flora.makeGrassAsync({ rng: fr.fork('grass' + g), path, uRange: [gU[g], gU[g + 1]], radius: 9.8, bias: 1.2, count: Math.round(2700 * detail * dens), heightAt: floorY, wind, map: treeMat.map,
          root: '#0a2a22', tip: '#2e8048', dryAmount: 0, flowers: 0, density: (x, z, lat) => (lat > 2.6 ? 0.4 + 0.6 * sstep(-0.35, 0.25, noise.n2(x * 0.16, z * 0.16)) : 0), fade: [42, 60], chunks: 1, height: [0.45, 0.95], width: [1.0, 1.7],
          materialOptions: { ambient: 1.0, leafAmbient: 1.0, wrap: 0.5, backlight: 0.8 } }, ctx.yield);
        scene.add(grass.object); updaters.push(grass);
        await ctx.yield();
      }
      { // the same ground cover at the foot of the fissure (from where the dive begins to level, u 0.49)
        const u0 = uBottom - 0.055, grass = await flora.makeGrassAsync({ rng: xr.fork('grass0'), path, uRange: [u0, uCanyon + 0.004], radius: 9, bias: 1.2, count: Math.round(1700 * detail * dens), heightAt: floorY, wind, map: treeMat.map,
          root: '#0a2a22', tip: '#2e8048', dryAmount: 0, flowers: 0, density: (x, z, lat) => (lat > 2.6 ? 0.5 + 0.5 * sstep(-0.35, 0.25, noise.n2(x * 0.16, z * 0.16)) : 0), fade: [42, 60], chunks: 1, height: [0.45, 0.95], width: [1.0, 1.7],
          materialOptions: { ambient: 1.0, leafAmbient: 1.0, wrap: 0.5, backlight: 0.8 } }, ctx.yield);
        scene.add(grass.object); updaters.push(grass);
        await ctx.yield();
        const ferns0 = flora.makeFerns({ rng: xr.fork('fernsK'), path, uRange: [u0, uCanyon], radius: 8.5, corridor: 2.9, count: Math.round(90 * dens * detail), heightAt: floorY, material: floraMat, scale: [0.8, 1.6], chunks: 1, colors: ['#5f9a62', '#3f7a50', '#86b070'] });
        scene.add(ferns0.object); updaters.push(ferns0);
        await ctx.yield();
      }
    }
    await ctx.yield();

    // the lemurs and the fossa
    const lemurs = new THREE.InstancedMesh(lemurGeometry(), pocketMat, lemurSeats.length);
    { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s3 = V3(1.65, 1.65, 1.65);
      lemurSeats.forEach((st, i) => { e.set(0, st.yaw, 0); q.setFromEuler(e); lemurs.setMatrixAt(i, m.compose(st.p, q, s3)); });
      lemurs.instanceMatrix.needsUpdate = true; lemurs.frustumCulled = false; scene.add(lemurs); }
    await ctx.yield();
    const fossa = new THREE.Mesh(fossaGeometry(), pocketMat); fossa.scale.setScalar(1.8); fossa.frustumCulled = false; scene.add(fossa);
    const iPk1 = scene.children.length;
    // its script, by path fraction: it comes down the trunk toward us, stands three-quarters on and watches, then turns and bolts for the root plate and leaps down
    const FOS = { e0: 0.36, uIn: 0.79, uStand: 0.836, uTurn: 0.856, uRun: 0.859, uLeap: 0.874, uDown: 0.887, yawA: Math.atan2(-logDir.x, -logDir.z), p: new THREE.Vector3(), q: new THREE.Vector3(), flank: new THREE.Vector3() };
    { const cL = clNear4(logMid.x, logMid.z); FOS.flank.copy(logSide); if (FOS.flank.x * cL.nx + FOS.flank.z * cL.nz > 0) FOS.flank.negate(); }
    const fossaAt = (u, camP) => {
      const eIn = lerp(0.8, FOS.e0, sstep(FOS.uIn, FOS.uStand, u)), run = sstep(FOS.uRun, FOS.uLeap, u), j = Math.max(0, Math.min(1, (u - FOS.uLeap) / (FOS.uDown - FOS.uLeap)));
      const e = lerp(eIn, 0.85, run) + 0.22 * j;
      logTop(Math.min(e, 0.9), FOS.p);
      if (j > 0) { FOS.p.addScaledVector(logDir, (e - Math.min(e, 0.9)) * logLen).addScaledVector(FOS.flank, 2.6 * j); const gy = floorY(FOS.p.x, FOS.p.z); FOS.p.y = lerp(FOS.p.y, gy, j) + 3.2 * j * (1 - j); }
      fossa.position.copy(FOS.p);
      const yaw = FOS.yawA + Math.PI * sstep(FOS.uTurn, FOS.uRun + 0.002, u) - 0.5 * Math.sin(Math.PI * j);
      fossa.rotation.set(-0.5 * Math.sin(Math.PI * j) * (j < 0.5 ? -0.6 : 1), yaw, 0);
      // legs: a walk in, still while it watches, a gallop out; the head keeps turned to the lens while it stands
      const moving = Math.max(4 * sstep(FOS.uIn, FOS.uStand, u) * (1 - sstep(FOS.uIn, FOS.uStand, u)), sstep(FOS.uTurn, FOS.uRun, u) * (1 - j));
      const hx = Math.sin(yaw), hz = Math.cos(yaw), tx = camP.x - FOS.p.x, tz = camP.z - FOS.p.z, turn = Math.max(-1.15, Math.min(1.15, Math.atan2(hz * tx - hx * tz, hx * tx + hz * tz)));
      pocketU.uWalk.value.set(e * logLen * 7.5, Math.min(1, 0.1 + moving), turn, 1 - 0.8 * run);
    };

    // the vasa parrots of the plunge: seven dark birds that come up the fissure at us and burst past the lens
    const NB = 7, NBF = rare ? 6 : 0, birdGeo = vasaGeometry();                        // seven for the plunge, six more that the falling blade flushes on a rare visit
    { const ph = new Float32Array((NB + NBF) * 2), br = rng.fork('vasa3'); for (let i = 0; i < NB; i++) { ph[i * 2] = br.range(0, TAU); ph[i * 2 + 1] = br.range(3.6, 4.6); } for (let i = NB; i < NB + NBF; i++) { ph[i * 2] = i * 1.7; ph[i * 2 + 1] = 4.2 + 0.2 * (i % 3); } birdGeo.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 2)); }
    const birdMat = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uTopCol: pocketU.uTopCol, uBounce: pocketU.uBounce, uCam: HU.uCam, uSunDir: { value: sunV }, uSunCol: { value: new THREE.Color(0, 0, 0) } }, vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, fog: true, side: THREE.DoubleSide });
    const birds = new THREE.InstancedMesh(birdGeo, birdMat, NB + NBF); birds.frustumCulled = false; scene.add(birds);
    const BIRD = { off: new Float32Array([-1.6, 1.5, 0, 1.5, -1.6, 0.9, -0.9, -2.0, 1.8, 1.9, 1.7, 2.6, 0.3, 2.2, 3.4, -2.0, -1.4, 4.3, 1.0, -2.3, 5.1]), gap: [[0.358, 44], [0.372, 34], [0.398, 12], [0.408, 7], [0.414, 3.2], [0.423, -7], [0.48, -46]],
      m: new THREE.Matrix4(), p: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), f: new THREE.Vector3(), r: new THREE.Vector3(), up: new THREE.Vector3(), r2: new THREE.Vector3(), up2: new THREE.Vector3(), Y: V3(0, 1, 0), size: 1.5 };
    const birdsAt = (u, t) => {
      const G = BIRD.gap; let gap = 0, on = u > G[0][0] && u < G[G.length - 1][0];
      if (on) for (let i = 1; i < G.length; i++) if (u <= G[i][0]) { gap = lerp(G[i - 1][1], G[i][1], (u - G[i - 1][0]) / (G[i][0] - G[i - 1][0])); break; }
      const PLn = path.length, du = u * PLn;
      for (let i = 0; i < NB; i++) {
        const d = du + gap + BIRD.off[i * 3 + 2];
        if (!on || d < 2 || d > PLn - 4) { BIRD.m.makeScale(0, 0, 0); birds.setMatrixAt(i, BIRD.m); continue; }
        path.posAtDist(d, BIRD.p); path.posAtDist(d + 1.5, BIRD.a); path.posAtDist(d - 1.5, BIRD.b);
        BIRD.f.subVectors(BIRD.b, BIRD.a).normalize();
        BIRD.r.crossVectors(BIRD.Y, BIRD.f); if (BIRD.r.lengthSq() < 1e-4) BIRD.r.set(1, 0, 0); BIRD.r.normalize();
        BIRD.up.crossVectors(BIRD.f, BIRD.r).normalize();
        { const pc = 0.8, ps = 0.6; BIRD.a.copy(BIRD.f).multiplyScalar(pc).addScaledVector(BIRD.up, ps); BIRD.up.multiplyScalar(pc).addScaledVector(BIRD.f, -ps); BIRD.f.copy(BIRD.a); }   // climbing hard: bodies pitched up, the backs of the wings turned to us
        const roll = 0.55 * Math.sin(t * 1.3 + i * 2.1) + (i % 2 ? 0.25 : -0.25), cr = Math.cos(roll) * BIRD.size, sr = Math.sin(roll) * BIRD.size;
        const veer = 1 + 1.4 * (1 - sstep(2, 12, Math.abs(d - du)));                  // they part round the lens as they reach it: none passes within 3.4 m
        BIRD.p.addScaledVector(BIRD.r, BIRD.off[i * 3] + 0.25 * Math.sin(t * 2.1 + i)).addScaledVector(BIRD.up, BIRD.off[i * 3 + 1] * veer + 0.2 * Math.sin(t * 2.7 + i * 1.7));
        BIRD.r2.copy(BIRD.r).multiplyScalar(cr).addScaledVector(BIRD.up, sr); BIRD.up2.copy(BIRD.up).multiplyScalar(cr).addScaledVector(BIRD.r, -sr);
        BIRD.f.multiplyScalar(BIRD.size);
        BIRD.m.makeBasis(BIRD.r2, BIRD.up2, BIRD.f).setPosition(BIRD.p);
        birds.setMatrixAt(i, BIRD.m);
      }
      birds.instanceMatrix.needsUpdate = true;
    };
    // the flushed parrots: out of the slot beside the falling blade, up the street toward us and past the lens on its left, a little over it
    const flushAt = (tau, t) => {
      if (!NBF || !shear) return;
      path.pointAt(0.247, BIRD.a);
      for (let i = 0; i < NBF; i++) {
        const tt = tau - 0.2 - i * 0.27;
        if (tt <= 0 || tt > 5) { BIRD.m.makeScale(0, 0, 0); birds.setMatrixAt(NB + i, BIRD.m); continue; }
        BIRD.b.copy(BIRD.a).addScaledVector(BIRD.Y, 2.4 + 0.5 * (i % 3)); BIRD.b.x += A.entry.direction.z * (2.6 + 0.9 * (i % 2)); BIRD.b.z -= A.entry.direction.x * (2.6 + 0.9 * (i % 2));     // a point 3 m to the left of the line
        BIRD.f.subVectors(BIRD.b, shear.start).normalize();
        BIRD.p.copy(shear.start).addScaledVector(BIRD.f, 13 * tt); BIRD.p.y += Math.max(0, 13 * tt - 24) * 0.35 + 0.25 * Math.sin(t * 2.7 + i * 1.7);
        BIRD.r.crossVectors(BIRD.Y, BIRD.f).normalize(); BIRD.up.crossVectors(BIRD.f, BIRD.r).normalize();
        const roll = 0.4 * Math.sin(t * 1.3 + i * 2.1), cr = Math.cos(roll) * BIRD.size, sr = Math.sin(roll) * BIRD.size;
        BIRD.r2.copy(BIRD.r).multiplyScalar(cr).addScaledVector(BIRD.up, sr); BIRD.up2.copy(BIRD.up).multiplyScalar(cr).addScaledVector(BIRD.r, -sr); BIRD.f.multiplyScalar(BIRD.size);
        BIRD.m.makeBasis(BIRD.r2, BIRD.up2, BIRD.f).setPosition(BIRD.p); birds.setMatrixAt(NB + i, BIRD.m);
      }
      birds.instanceMatrix.needsUpdate = true;
    };
    for (let i = 0; i < NBF; i++) { BIRD.m.makeScale(0, 0, 0); birds.setMatrixAt(NB + i, BIRD.m); }
    birdsAt(0, 0);
    await ctx.yield();
    // the harrier-hawk: our own bird, flown by path fraction. It comes over from behind-left as we pass the gate, drops into the street and glides
    // down it 12 m ahead of the lens a little over eye height (u 0.297-0.333), wings rocking, then lifts away over the fissure
    const hawkCol = {}; { const hc = HAWKS[lookId]; for (const k of Object.keys(hc)) hawkCol[k] = C(hc[k]).toArray(); hawkCol.band = hawkCol.belly; }
    const hawkGeo = hawkGeometry(hawkCol); hawkGeo.setAttribute('aPh', new THREE.InstancedBufferAttribute(new Float32Array([1.3, 0.3]), 2));
    const hawkMat = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uTopCol: { value: C(LK.hemi[0]).multiplyScalar(LK.hemi[2] * 0.8) }, uBounce: { value: C(LK.hemi[1]).multiplyScalar(0.9) }, uCam: HU.uCam,
      uSunDir: { value: sunV }, uSunCol: { value: C(LK.sun[0]).multiplyScalar(LK.sun[1] * 0.45) } }, vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, fog: true, side: THREE.DoubleSide });
    const hawkMesh = new THREE.InstancedMesh(hawkGeo, hawkMat, 1); hawkMesh.frustumCulled = false; scene.add(hawkMesh);
    // keys: [path fraction, metres ahead of the lens, metres over the flight line, metres to the right of it]
    const HK = { keys: [[0.2, -22, 11, -7], [0.225, -3, 6.5, -2.2], [0.234, 3.5, 3.2, -1.2], [0.242, 6.4, 1.6, 0.6], [0.25, 7.4, 1.2, 1.7], [0.265, 8.8, 0.3, 1.2], [0.283, 10.2, -0.7, 0.2], [0.299, 9.8, -0.8, -1.0], [0.305, 9.6, -1.1, -1.0], [0.318, 10.4, -1.2, -0.2], [0.328, 12.5, 0.8, 2.6], [0.34, 21, 5.5, 8], [0.37, 50, 16, 16], [0.4, 95, 32, 30]],
      size: 1.6, a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), f: new THREE.Vector3(), r: new THREE.Vector3(), up: new THREE.Vector3(), r2: new THREE.Vector3(), up2: new THREE.Vector3(), q0: new THREE.Vector3(), q1: new THREE.Vector3(), m: new THREE.Matrix4(), Y: V3(0, 1, 0) };
    const hawkKey = (u, col) => {                            // the keys joined by a smooth curve (Catmull-Rom over path fraction)
      const K = HK.keys; let i = 1; while (i < K.length - 1 && u > K[i][0]) i++;
      const k0 = K[i - 1], k1 = K[i], km = K[Math.max(0, i - 2)], kp = K[Math.min(K.length - 1, i + 1)], du = k1[0] - k0[0], x = Math.max(0, Math.min(1, (u - k0[0]) / du));
      const m0 = ((k1[col] - km[col]) / Math.max(1e-6, k1[0] - km[0])) * du, m1 = ((kp[col] - k0[col]) / Math.max(1e-6, kp[0] - k0[0])) * du, x2 = x * x, x3 = x2 * x;
      return (2 * x3 - 3 * x2 + 1) * k0[col] + (x3 - 2 * x2 + x) * m0 + (-2 * x3 + 3 * x2) * k1[col] + (x3 - x2) * m1;
    };
    const PLen = path.length;
    const hawkPos = (u, out) => {
      const d = Math.max(7, Math.min(PLen - 7, u * PLen + hawkKey(u, 1)));
      path.posAtDist(d - 6, HK.a); path.posAtDist(d, HK.b); path.posAtDist(d + 6, HK.c);
      out.copy(HK.a).add(HK.b).add(HK.c).multiplyScalar(1 / 3);                      // the bounds of the flight line smoothed away: the bird glides
      HK.f.subVectors(HK.c, HK.a).setY(0).normalize(); HK.r.crossVectors(HK.f, HK.Y).normalize();
      return out.addScaledVector(HK.Y, hawkKey(u, 2)).addScaledVector(HK.r, hawkKey(u, 3));
    };
    const hawkAt = (u, t) => {
      if (u < 0.2005 || u > 0.399) { HK.m.makeScale(0, 0, 0); hawkMesh.setMatrixAt(0, HK.m); hawkMesh.instanceMatrix.needsUpdate = true; return; }
      hawkPos(u - 0.003, HK.q0); hawkPos(u + 0.003, HK.q1); hawkPos(u, hawkP);
      HK.f.subVectors(HK.q1, HK.q0).normalize();
      HK.r.crossVectors(HK.Y, HK.f); if (HK.r.lengthSq() < 1e-4) HK.r.set(1, 0, 0); HK.r.normalize(); HK.up.crossVectors(HK.f, HK.r).normalize();
      hawkP.addScaledVector(HK.Y, 0.22 * Math.sin(t * 0.9)).addScaledVector(HK.r, 0.3 * Math.sin(t * 0.63 + 1));
      { const fl = 0.227 + 0.7 * sstep(0.234, 0.246, u) * (1 - sstep(0.255, 0.272, u)), cf = Math.cos(fl), sf = Math.sin(fl);   // and as it drops into the street ahead of us it flares, wings and tail spread to the lens
        HK.q0.copy(HK.f); HK.f.multiplyScalar(cf).addScaledVector(HK.up, sf); HK.up.multiplyScalar(cf).addScaledVector(HK.q0, -sf); }   // it rides nose-high on the air of the slot, back and wings open to the lens behind
      const roll = 0.3 * Math.sin((u - 0.287) * 150) + 0.12 * Math.sin(t * 0.8) + 0.06 * Math.sin(t * 1.9 + 2), cr = Math.cos(roll) * HK.size, sr = Math.sin(roll) * HK.size;
      HK.r2.copy(HK.r).multiplyScalar(cr).addScaledVector(HK.up, sr); HK.up2.copy(HK.up).multiplyScalar(cr).addScaledVector(HK.r, -sr); HK.f.multiplyScalar(HK.size);
      HK.m.makeBasis(HK.r2, HK.up2, HK.f).setPosition(hawkP); hawkMesh.setMatrixAt(0, HK.m); hawkMesh.instanceMatrix.needsUpdate = true;
    };

    // rootlet curtains down the fissure walls, in the keyhole and off the bridge
    const rootU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uRes: { value: new THREE.Vector2(800, 450) }, uTopCol: pocketU.uTopCol, uBounce: pocketU.uBounce };
    {
      const P = [], NX = [], R = [], I = []; let n = 0; const rr = rng.fork('rootlets'), NS = 8;
      const strand = (x, yTop, z, len, ph) => {
        const base = n, wob = (t) => [0.16 * Math.sin(t * 3.1 + ph) + 0.06 * Math.sin(t * 11 + ph * 2.3), 0.16 * Math.cos(t * 2.3 + ph * 1.7) + 0.06 * Math.cos(t * 9 + ph)];
        for (let i = 0; i <= NS; i++) {
          const t = i / NS, t2 = t + 1 / NS, w = wob(t), w2 = wob(t2);
          for (const sd of [-1, 1]) { P.push(x + w[0], yTop - len * t, z + w[1]); NX.push(x + w2[0], yTop - len * t2, z + w2[1]); R.push(sd, t, ph); n++; }
        }
        for (let i = 0; i < NS; i++) { const a = base + i * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); }
      };
      const curtain = (c, lat, yTop, len, cnt) => { for (let k = 0; k < cnt; k++) { const al = (k - cnt / 2) * 0.28 + rr.range(-0.08, 0.08); strand(c.x + c.nx * lat + c.tx * al, yTop + rr.range(-0.6, 0.6), c.z + c.nz * lat + c.tz * al, len * rr.range(0.6, 1), rr.range(0, 6.28)); } };
      for (let s = 10; s < 82; s += rr.range(2.2, 4.2)) for (const sd of [-1, 1]) { if (!rr.chance(0.5)) continue; const c = clI(s); curtain(c, sd * (c.hw - 0.36 - rr.range(0, 0.12)), pathYatS(s) + rr.range(2.5, 9), rr.range(3.5, 9), rr.int(4, 8)); }
      for (let s = sPortal - 36; s < sPortal - 4; s += rr.range(2.5, 4.5)) for (const sd of [-1, 1]) { if (!rr.chance(0.7)) continue; const c = clI(s); curtain(c, sd * (c.hw - 0.5), rr.range(16, 24), rr.range(8, 14), rr.int(5, 8)); }
      for (const d of caveDrips) strand(d.x, d.y, d.z, d.len, rr.range(0, 6.28));
      const bc = A.bridge.center, bs = A.bridge.span;
      for (let k = 0; k < 9; k++) { const l = (k % 2 ? 1 : -1) * rr.range(8.6, 16), cnt = rr.int(4, 7); for (let j = 0; j < cnt; j++) strand(bc.x + bs.x * (l + j * 0.3) + rr.range(-0.8, 0.8), 26, bc.z + bs.z * (l + j * 0.3) + rr.range(-0.8, 0.8), rr.range(5, 11), rr.range(0, 6.28)); }
      for (const d of ledgeDrips) strand(d.x, d.y, d.z, d.len, d.ph);          // off the lips of the new ledges and the underside of the fallen blade
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aNext', new THREE.Float32BufferAttribute(NX, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(R, 3));
      g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: rootU, vertexShader: ROOTLET_VERT, fragmentShader: ROOTLET_FRAG, fog: true, side: THREE.DoubleSide }));
      m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();
    // the stream's surface: rings, floating leaves, glints, the portal's light
    {
      const P = [], W = [], I = []; let rows = 0;
      for (let i = Math.round(58 / 1.5); i < cl.length; i++) { const c = cl[i]; for (const lat of [-2.8, 0, 2.8]) { P.push(c.x + c.nx * lat, 0.07, c.z + c.nz * lat); W.push(lat, c.s); } rows++; }
      for (let i = 0; i < rows - 1; i++) for (let k = 0; k < 2; k++) { const a = i * 3 + k; I.push(a, a + 3, a + 4, a, a + 4, a + 1); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 2)); g.setIndex(I);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, fog: true, transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uStrip: { value: stripC.clone() }, uPortal: { value: C(LK.portal) }, uLeafA: { value: C('#b8a03c') }, uLeafB: { value: C('#4f8a2c') }, uBounce: pocketU.uBounce } }));
      m.frustumCulled = false; m.renderOrder = 2; scene.add(m);
    }
    await ctx.yield();

    // wildlife of the pocket: bats pouring from the cave and down the canyon, sunset moths, shafts of sky light
    {
      // out of the mouth toward us, round in a hairpin low over the stream under the strip of sky, and away down the canyon;
      // three groups a third of a lap apart, so some of the ribbon is always in the hairpin
      const BATC = { body: '#17120f', belly: '#1e1713', wingC: '#1b1512', trail: '#130f0c', tip: '#0d0a09', head: '#17120f', tailC: '#130f0c' };
      const cn = A.cave.normal, route = [caveC.clone().addScaledVector(cn, -3), caveC.clone().addScaledVector(cn, 5).add(V3(0, 0.3, 0)), at(sC - 9, cC.hw - 4, 9), at(sC - 13, 1, 9.6), at(sC - 9, -5, 10.4), at(sC + 3, -5.5, 11.5), at(sC + 22, -2.5, 13), at(sC + 50, 0, 14), at(sC + 78, 1.5, 15)];
      const pts = route.map((p) => [p.x, p.y, p.z]);
      let rl = 0; for (let i = 1; i < route.length; i++) rl += route[i].distanceTo(route[i - 1]);
      for (const st of [0, 0.417, 0.833]) { fauna.add(F.makeFlock({ rng: rng.fork('bats' + st), species: 'bats', count: 90, size: 2.0, speed: 10, form: 'stream', spread: [3.2, 2.2, rl * 0.55], route: pts, closed: false, start: st, ...BATC }), { light: pocketLight, range: 130 }); await ctx.yield(); }
      // and the ones already under the rock bridge, going out over the portal
      const r2 = [at(sPortal - 46, -2, 13), at(sPortal - 20, 1, 15), at(sPortal - 6, 0, 16.5), at(sPortal + 12, 0.5, 18.5), at(sEnd - 3, 2, 24)].map((p) => [p.x, p.y, p.z]);
      for (const st of [0, 0.62]) { fauna.add(F.makeFlock({ rng: rng.fork('batsP' + st), species: 'bats', count: 40, size: 2.2, speed: 9, form: 'stream', spread: [4, 2.6, 55], route: r2, closed: false, start: st, ...BATC }), { light: pocketLight, range: 130 }); await ctx.yield(); }
      fauna.add(F.makeButterflies({ rng: rng.fork('moths'), shape: 'swallowtail', count: Math.round(30 * dens), size: 3.2, path, uFrom: uCanyon + 0.01, uTo: 0.98, clear: 2.2, spread: 7, lift: [-3, 3.5],
        varieties: [['#0c0c10', '#2fd080'], ['#101014', '#e08a3a'], ['#0a0a0e', '#58e0a0'], ['#14100c', '#d0a040']] }), { light: pocketLight });
      for (const uu of [0.64, 0.79]) { const p = at(sOfU(uu), fr.range(-2, 2), 42); set.add(fx.makeGodRays({ rng: rng.fork('rays' + uu), time, position: [p.x, p.y, p.z], direction: [0.12, -1, 0.06], radius: 6, count: Math.round(8 * detail), length: 44, width: [0.7, 2.6], color: stripC, intensity: 0.2 })); }
    }
    await ctx.yield();

    // ---- rare: the right-hand blade of the gate (cross-set, 20 m ahead of the lens at u 0.24) loses its top 7.6 m: it leans out over the slot, turning
    // about its outer foot with its broad face to us, slides off and falls ricocheting; dust at the break, a plume out of the slot, parrots flushed past us
    let shear = null;
    if (rare && A.shear) {
      const SH = A.shear, cy = Math.cos(SH.yaw), sy = Math.sin(SH.yaw), yCut = SH.yCut, HX = 3.0, ed = A.entry.direction, rt = V3(-ed.z, 0, ed.x);
      const stump = hero.makeFin({ len: 7.8, y0: 16, y1: yCut + 0.8, tTop: 0.55, tBase: 5.4, nA: 14, rows: [0, 0.02, 0.06, 0.2, 0.45, 1], toothDepth: 0.8, toothVar: 0.5, endDrop: 3.2, toothStep: 2, grow: 0.25, flute: 0.8, bow: 0 },
        (x, y, z) => [SH.x + x * cy + z * sy, y, SH.z - x * sy + z * cy]);
      const sm = new THREE.Mesh(stump.geometry, hero.rockMaterial); sm.frustumCulled = false; scene.add(sm);
      await ctx.yield();
      const TR = [0, 0.05, 0.14, 0.35, 0.7, 1], top = hero.makeFin({ len: 6.6, y0: 0, y1: 7.6, tTop: 0.12, tBase: 1.5, nA: 12, rows: TR, toothDepth: 2.2, toothVar: 1.2, endDrop: 4.2, toothStep: 2, grow: 0.22, flute: 0.8, bow: 0.15 });
      { // the broken underside of the loose top: the lens between the feet of its two flanks, closed
        const g = top.geometry, pa = g.attributes.position, W = 13, n0 = pa.count, r0 = (TR.length - 1) * W, r1 = TR.length * W + r0, P = Array.from(pa.array), Cc = Array.from(g.attributes.color.array), AX = Array.from(g.attributes.aAux.array), I = Array.from(g.index.array);
        for (let i = 0; i < W; i++) for (const b of [r0, r1]) { P.push(pa.getX(b + i), pa.getY(b + i), pa.getZ(b + i)); Cc.push(0.5, 0.5, 0.5); AX.push(pa.getX(b + i) * 3 + pa.getZ(b + i) * 7, 0, 0, 1000); }
        for (let i = 0; i < W - 1; i++) { const a = n0 + i * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); }
        const g2 = new THREE.BufferGeometry();
        g2.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g2.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g2.setAttribute('aAux', new THREE.Float32BufferAttribute(AX, 4)); g2.setIndex(I); g2.computeVertexNormals();
        top.geometry = g2; g.dispose();
      }
      const pivot = new THREE.Group(); pivot.position.set(SH.x, yCut - 0.35, SH.z); pivot.rotation.y = SH.yaw;
      const hinge = new THREE.Group(); hinge.position.set(HX, 0, 0); pivot.add(hinge);                  // the outer foot of the loose top: it turns about this corner
      const piece = new THREE.Mesh(top.geometry, hero.rockMaterial); piece.frustumCulled = false; piece.position.set(-HX, 0, 0); hinge.add(piece); scene.add(pivot);
      const dustO = { rng: xr.fork('dust'), time, color: '#cdb9a2', colorTop: '#e8dac6', shadowColor: '#7c6c86', sunDir: sunV.toArray(), sunColor: LK.sun[0], wind: [0.5, 0, 0.25] };
      const plume = set.add(fx.makeSmokeColumn({ ...dustO, position: [SH.x - rt.x * 2 + ed.x * 8, yCut - 10, SH.z - rt.z * 2 + ed.z * 8], height: 22, radius: [1.0, 3.3], size: [2.4, 7.5], count: 46, opacity: 0.5, rate: 0.17 }));   // the dust the fall drives along the slot comes up beside the street ahead of us
      const puff = set.add(fx.makeSmokeColumn({ ...dustO, position: [SH.x + rt.x * 1.2, yCut - 1.2, SH.z + rt.z * 1.2], height: 8, radius: [0.8, 3.4], size: [1.6, 4.6], count: 22, opacity: 0.62, rate: 0.32 }));
      plume.object.visible = false; puff.object.visible = false;
      shear = { pivot, hinge, piece, plume, puff, yCut, HX, T0: tOf(0.228), start: V3(SH.x + rt.x * 2, yCut - 6, SH.z + rt.z * 2) };
    }

    await sky.prewarm(ctx.renderer, null, scene);

    const camP = new THREE.Vector3(), res = new THREE.Vector2(), hawkP = new THREE.Vector3(), shP = new THREE.Vector3();
    const pocketObjs = scene.children.slice(iPk0, iPk1).filter((o) => !o.isLight && !farObjs.includes(o)), topObjs = [...hero.parts.blades, hero.parts.far, hero.parts.plants, ...scene.children.slice(iTop0, iTop1)].filter((o) => o && !o.isLight);
    let pocketOn = true, topOn = true, farOn = true;
    // the animals on the fallen blade are the last of the troop: they are left out of the draw until the lens is in the canyon
    const sifGeo = hero.parts.sifakas.geometry, nTroop = hero.troopCount, nArch = A.arch && A.arch.animals.length && A.arch.animals.every((i) => i >= nTroop - A.arch.animals.length) ? A.arch.animals.length : 0;
    const mistT = new THREE.Color();
    const PROBE = { fossa, logTop, pocketObjs, topObjs, hero, tOf, uOfT, uLand, uLip, uBottom, sOfU, at, clI, sPortal, lookId, A, hawkP, shearP: () => (shear ? shear.piece.getWorldPosition(new THREE.Vector3()) : null) };
    const fog = scene.fog, seat0 = lemurSeats[0] ? lemurSeats[0].p : V3(0, 6, 0);
    return {
      scene, path, duration: DUR, pace, title: LK.title, ride: 'none',
      camera: { fov: 62, near: 0.15, far: 3200, lookAhead: 26, sway: 0.25, bank: 0 },
      pois: [
        { at: V3(0, 108, 0), from: 0, to: 0.30, weight: 0.55 },                        // the Cathedral, on the axis from the first frame
        { at: A.landings[1].clone().add(V3(0, 1.2, 0)), from: 0.062, to: 0.096, weight: 0.42 },   // down between the two lit blades, onto the second landing and the animals leaping the gap
        { at: seat0, from: 0.63, to: 0.74, weight: 0.3 },                             // the lemurs on their limb
        { at: caveC.clone().add(V3(0, 1.5, 0)), from: 0.7, to: 0.8, weight: 0.2 },      // the bats' cave
        { at: logTop(0.5).add(V3(0, 0.5, 0)), from: 0.815, to: 0.885, weight: 0.3 },    // the fossa on its trunk
      ],
      portal: { shape: 'circle', radius: 7, color: LK.portal, glow: 1, revealDistance: 190 },
      post: { exposure: LK.exposure, bloom: { strength: 0.36, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.1, contrast: 1.0, tint: LK.tint, shadowTint: LK.shadowTint, vignette: 0.3, grain: 0.02, aberration: 0 } },
      update(dt, t, camera, u) {
        time.value = t;
        camP.setFromMatrixPosition(camera.matrixWorld);
        const T = tOf(u || 0);
        hero.setProgress(T / 40);
        // our own shadow leaping along the lit faces, and the hawk's
        hero.setShadow(1, shP.copy(camP).setY(camP.y - 0.45), u < uLip + 0.02 ? 0.5 : 0);
        hawkAt(u || 0, t);
        hero.setShadow(0, hawkP, u > 0.215 && u < 0.39 ? 1.6 : 0);
        // light and air: the gold top of the world, the emerald pocket (and the dawn mist between them)
        const k = sstep(60, 30, camP.y);
        hemi.color.copy(LT.hemiA).lerp(LT.hemiB, k); hemi.groundColor.copy(LT.gndA).lerp(LT.gndB, k); hemi.intensity = lerp(LT.hemiIA, LT.hemiIB, k);
        sunL.color.copy(LT.sunA).lerp(LT.sunB, k); sunL.intensity = lerp(LT.sunIA, LT.sunIB, k);
        sunL.position.copy(sunV).lerp(LT.dirB, k).normalize().multiplyScalar(400);
        fog.color.copy(LT.fogA).lerp(LT.fogB, k); fog.density = lerp(LK.fogD, LK.pocketD, k);
        if (LT.mistC) {
          const uu = u || 0, m = Math.max(0, Math.min(1, (camP.y - LK.mist[0]) / LK.mist[3], (LK.mist[1] - camP.y) / LK.mist[3])), thin = sstep(66, 59, camP.y);
          // from the lip on we look down a slot that no sun reaches. Its mist is violet shade, not the lit sea: thin beside the lens so the walls stay crisp, deepening
          // with distance, and going over to the green of the pocket as we sink through it
          const mm = Math.max(m, camP.y > 50 ? sstep(uLip - 0.016, uLip + 0.006, uu) : 0), sink = sstep(58, 24, camP.y);
          mistT.copy(LT.mistS).lerp(LT.mistG, 0.6 * sink);
          fog.color.lerp(mistT, mm); fog.density = lerp(fog.density, lerp(0.0085, 0.0075, sink), mm);
          HU.uMist.value.z = LK.mist[2] * (1 - 0.8 * thin);                        // inside the fissure the sea thins enough to read the blades and the animals through it
          HU.uMistSlot.value.set(mistT.r, mistT.g, mistT.b, 0.011 * sstep(uLip - 0.034, uLip - 0.01, uu));   // the walls, roots and floor of the slot under that mist (the hero's stone)
        }
        // (at dawn the blade bodies are kept dark; the walls of the slot take the fissure's light from the moment the lens tips over the lip and nothing but the slot is in view)
        const tip = LK.body ? sstep(-0.4, -0.66, -camera.matrixWorld.elements[9]) * sstep(uLip - 0.03, uLip - 0.005, u || 0) * sstep(40, 55, camP.y) : 0;
        HU.uSky.value.copy(skyBase).lerp(skyFis, Math.max(sstep(65.5, 57, camP.y), tip)).multiplyScalar(1 + 0.55 * sstep(64, 50, camP.y) * sstep(5, 20, camP.y));
        HU.uBandLo.value = lerp(bandBase, lerp(19, 5, sstep(30, 62, Math.hypot(camP.x, camP.z))), sstep(44, 20, camP.y));   // seen from the canyon floor the gold comes down the sunward wall in a band above the shade; it lifts off the keyhole as we near the ring
        pTopLeaves.setOpacity(1 - k); pTopDust.setOpacity(1 - k); pStream.setOpacity(1 - k); pMotes.setOpacity(k); pFall.setOpacity(k);
        if (pRain) pRain.setOpacity(1 - 0.75 * k);
        if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(res); rootU.uRes.value.copy(res); }
        { const pOn = (u || 0) > 0.33, tOn = (u || 0) < 0.43;    // meshes only (never a light): the pocket from the tops, the street from the canyon floor
          if (pOn !== pocketOn) { pocketOn = pOn; for (const o of pocketObjs) o.visible = pOn; }
          if (tOn !== topOn) { topOn = tOn; for (const o of topObjs) o.visible = tOn; }
          const fOn = (u || 0) > 0.435;
          if (fOn !== farOn) { farOn = fOn; for (const o of farObjs) o.visible = fOn; }
          if (nArch) sifGeo.instanceCount = (u || 0) > 0.58 ? nTroop : nTroop - nArch; }
        fossaAt(u || 0, camP);
        birdsAt(u || 0, t);
        if (shear) {
          const tau = T - shear.T0, H = shear.hinge;
          if (tau <= 0) { shear.piece.visible = true; H.position.set(shear.HX, 0, 0); H.rotation.set(0, 0, 0); shear.plume.object.visible = false; shear.puff.object.visible = false; }
          else {
            const lean = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, tau / 1.5)), f = Math.max(0, tau - 0.95), fall = 4.6 * f * f;
            const lat = 1.1 * f + (fall > 12 ? 1.6 * Math.abs(((fall / 9) % 2) - 1) : 0);            // it ricochets between the walls on the way down
            H.position.set(shear.HX + lat, -fall, 0.5 * f); H.rotation.set(0.2 * lean + 0.2 * f, 0.12 * f, -(0.72 * lean + 0.36 * f));
            shear.piece.visible = fall < 62;
            shear.puff.object.visible = tau < 5.5; shear.plume.object.visible = tau > 1.1 && u < uLip + 0.05;
            shear.plume.uniforms.uHeight.value = 3 + 19 * sstep(1.0, 2.5, tau);
          }
          flushAt(tau, t);
        }
        sky.update(dt, t, camera); hero.update(dt, t, camera);
        fauna.update(dt, t, camera, u);
        for (const o of updaters) o.update(dt, t, camera);
        set.update(dt, t, camera);
      },
      dispose() { sky.dispose(); },
      _probe() { return PROBE; },
    };
  },
};
