// THE RUNNING WALL - Chauvet's animals gallop along a torch-lit cave wall, off its edge into daylight and across a
// limestone gorge drawn in the same four pigments (bare cream rock, charcoal, yellow ochre, red ochre), ridden flat
// out on a painted horse to an arch ringed with red hands.
//
// Layout (x = right / north, -z = forward / west, y up). The path is ~745 m:
//   0-96 m     the painted hall (32 m wide), two great bulls on the neck walls, the gallery (12 m) flaring to the mouth
//   96-150 m   the mouth, the painted fin on the right (33 m) and the scree apron (14 m down); the pack bursts out at u 0.12-0.16
//   150-480 m  the grass terrace under the running wall: on the right, 88 m off, a bedded limestone wall whose massive bed
//              carries six painted giants (20 m animals that run along the rock beside us). Stallion at our right knee
//              (u 0.25-0.36: 4.2 m off, 5.3 m ahead, so the steady camera holds him whole; two gaze pulls on him, see pois)
//              with the pack crowding in round us (u 0.28-0.37); the stag crossing (u 0.395); the aurochs bulls come up
//              close on the left (u 0.41-0.46); a swerve round the two sparring rhinos (u 0.47); three stray bison at our
//              right knee (u 0.50-0.54); the mammoth file on the bench against the ice (u 0.52-0.6)
//   480-610 m  the ramp: the stallion wheels the pack across our front toward the prow, a headland the left wall throws out
//              with two more giants on its flank (u 0.59-0.68); the lion passes on the left (u 0.66); bison pour off the
//              bench and the lead bull runs at our right knee to the river (u 0.68-0.9)
//   610-745 m  gravel bar, shallows (the arch and the gate mirrored in them) and the Pont d'Arc with its red hands; the
//              portal stands in the opening
// Everything is shaded with the hero's pigment recipe (PIGMENT_GLSL + one grain texture): no lights, no blending.
// Seeded looks: hour (late morning / golden / night = the engraved look), weather (clear / loess storm / first
// snow), cast (horses, aurochs or deer run with us; a second lion; herd sizes by density), and the rare stencil.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell, makeRng, hashSeed } from '../kit/core.js';
import { buildHero, PIGMENT_GLSL, makeGrainTexture, Fig, addLeg } from '../parts/running-wall.js';

const PALETTE = ['#E9DFC8', '#F7F2E6', '#BBA988', '#2B2623', '#D29B3E', '#A8432A'];
const TAU = Math.PI * 2, EYE = 2.3, CAVE_Y = 8.3, FLOOR = CAVE_Y - EYE, WATER = -26, BAR = -25.78;
const ss = smoothstep;

// ---------------------------------------------------------------------------------------------------------
// More of Chauvet's cast, built with the hero's figure kit (profile tubes; +X nose, +Y up).
// ---------------------------------------------------------------------------------------------------------
const legs4 = (f, F, H, L3, zf, zh, thick, dark) => {
  addLeg(f, 3, F[0], F[1], F[2], F[3], L3, zf, thick, false, dark); addLeg(f, 4, F[0], F[1], F[2], F[3], L3, -zf, thick, false, dark);
  addLeg(f, 5, H[0], H[1], H[2], H[3], L3, zh, thick, true, dark); addLeg(f, 6, H[0], H[1], H[2], H[3], L3, -zh, thick, true, dark);
};
const eye = (f, x, y, z, r) => {
  const pts = []; for (let i = 0; i <= 6; i++) pts.push([x + Math.cos(i / 6 * TAU) * r, y + Math.sin(i / 6 * TAU) * r * 0.7]);
  for (const sg of [1, -1]) f.sheet([x, y], pts, { z: sg * z, paint: [0, 1, 0], bone: 1, param: () => 0.9, edge: 0 });
};

function buildBison() {
  const f = new Fig();
  const trunk = [[-1.45, 1.25, 0.05, 0.04], [-1.38, 1.22, 0.24, 0.18], [-1.1, 1.2, 0.38, 0.28], [-0.6, 1.2, 0.44, 0.33], [-0.1, 1.25, 0.52, 0.38],
    [0.36, 1.42, 0.74, 0.42], [0.72, 1.52, 0.82, 0.4], [1.0, 1.32, 0.54, 0.3], [1.15, 1.2, 0.25, 0.16]];
  f.tube(trunk, { sides: 8, bone: 0, paint: (t, ca) => [0.85 - 0.12 * ss(0.45, 0.8, t), Math.max(0.92 * ss(0.4, 0.6, t) * ss(-0.1, 0.55, ca), 0.62 * ss(0.1, -0.9, ca)), 0] });
  const neck = [[0.8, 1.25, 0.5, 0.26], [1.15, 1.15, 0.42, 0.23], [1.42, 1.0, 0.33, 0.19], [1.62, 0.85, 0.24, 0.15], [1.78, 0.7, 0.16, 0.11], [1.86, 0.6, 0.07, 0.06]];
  f.tube(neck, { sides: 8, bone: 1, ghost: true, param: (t) => ss(0, 0.6, t), paint: (t, ca) => [0.82, Math.max(0.9 * ss(0.5, 0.9, ca) * ss(0.85, 0.35, t), 0.88 * ss(0.82, 0.96, t)), 0] });
  for (const sg of [1, -1]) {
    f.tube([[1.33, 1.27, 0.07, 0.06], [1.35, 1.47, 0.066, 0.055], [1.44, 1.65, 0.052, 0.042], [1.6, 1.77, 0.032, 0.026], [1.73, 1.8, 0.012, 0.012]],
      { sides: 5, bone: 1, ghost: true, param: () => 0.7, zBow: (t) => sg * (0.14 + 0.16 * Math.sin(Math.PI * t * 0.8)), paint: () => [0, 1, 0], edgeBias: -0.01 });
    f.sheet([1.5, 0.62], [[1.3, 0.78], [1.72, 0.66], [1.6, 0.36], [1.42, 0.3], [1.3, 0.78]], { z: sg * 0.03, paint: [0, 1, 0], bone: 1, ghost: true, param: () => 0.9, edge: 0.04 });
  }
  f.tube([[-1.4, 1.35, 0.045, 0.03], [-1.56, 1.25, 0.035, 0.025], [-1.68, 0.95, 0.03, 0.02], [-1.72, 0.7, 0.055, 0.03], [-1.74, 0.55, 0.015, 0.012]],
    { sides: 5, bone: 2, flat: true, param: (t) => t, paint: () => [0, 1, 0] });
  const F = [0.72, 1.0, 0.48, 0.42], H = [-1.0, 1.05, 0.5, 0.44];
  legs4(f, F, H, 0.2, 0.17, 0.17, 1.25, 0.85);
  return { ...f.build(), fore: F, hind: H, L3: 0.2, gait: [1.45, 0.42, 0.06, 0.06], neck: [0.85, 1.25, 0.07, 1.15], height: 2.2, len: 3.3, stride: 6.4,
    coat: (r) => ({ ochre: 0.75 + 0.3 * r(), fill: 0.22 + 0.2 * r(), red: 0, antler: 1 }) };
}

function buildRhino() {
  const f = new Fig();
  const trunk = [[-1.7, 1.2, 0.05, 0.04], [-1.6, 1.18, 0.3, 0.22], [-1.25, 1.15, 0.5, 0.36], [-0.6, 1.12, 0.55, 0.42], [0, 1.1, 0.56, 0.43],
    [0.55, 1.24, 0.68, 0.43], [0.95, 1.36, 0.68, 0.39], [1.3, 1.24, 0.46, 0.28], [1.45, 1.15, 0.2, 0.14]];
  // Chauvet's rhinos wear a black band round the belly
  f.tube(trunk, { sides: 8, bone: 0, paint: (t, ca) => [0.7 + 0.3 * ca, 0.9 * ss(0.36, 0.44, t) * ss(0.6, 0.52, t) + 0.5 * ss(0.2, -0.9, ca), 0] });
  const head = [[1.1, 1.2, 0.46, 0.26], [1.5, 1.05, 0.37, 0.22], [1.85, 0.85, 0.29, 0.18], [2.15, 0.68, 0.23, 0.15], [2.35, 0.58, 0.17, 0.12], [2.45, 0.52, 0.08, 0.07]];
  f.tube(head, { sides: 8, bone: 1, ghost: true, param: (t) => ss(0, 0.5, t), paint: (t, ca) => [0.6 + 0.3 * ca, 0.75 * ss(0.6, 0.95, t), 0] });
  f.tube([[2.24, 0.7, 0.14, 0.05], [2.46, 0.98, 0.115, 0.04], [2.74, 1.28, 0.085, 0.032], [3.06, 1.56, 0.055, 0.024], [3.36, 1.76, 0.018, 0.014]], { sides: 6, bone: 1, ghost: true, param: () => 1, paint: () => [0, 1, 0], edgeBias: -0.02 });
  f.tube([[2.0, 0.92, 0.08, 0.04], [2.06, 1.1, 0.05, 0.03], [2.12, 1.24, 0.015, 0.012]], { sides: 5, bone: 1, ghost: true, param: () => 1, paint: () => [0, 1, 0], edgeBias: -0.02 });
  for (const sg of [1, -1]) f.sheet([1.5, 1.42], [[1.46, 1.3], [1.6, 1.34], [1.5 + 0.03 * sg, 1.6], [1.46, 1.3]], { z: sg * 0.16, paint: [0, 1, 0], bone: 1, ghost: true, param: () => 0.6, edge: 0 });
  eye(f, 1.92, 0.98, 0.17, 0.03);
  const F = [1.0, 1.0, 0.46, 0.4], H = [-1.15, 1.02, 0.48, 0.42];
  legs4(f, F, H, 0.2, 0.22, 0.22, 1.5, 0.6);
  return { ...f.build(), fore: F, hind: H, L3: 0.2, gait: [1.2, 0.25, 0.02, 0.05], gaitOff: [0, 0.5, 0.75, 0.25], neck: [1.2, 1.2, 0.3, 1.1], height: 1.95, len: 4.2, stride: 2.8, noGhost: false };
}

function buildMammoth() {
  const f = new Fig();
  const trunk = [[-1.9, 1.8, 0.06, 0.05], [-1.8, 1.75, 0.5, 0.36], [-1.4, 1.8, 0.8, 0.58], [-0.7, 1.95, 0.95, 0.7], [0, 2.1, 1.05, 0.75],
    [0.7, 2.25, 1.05, 0.72], [1.2, 2.25, 0.9, 0.6], [1.5, 2.2, 0.6, 0.4], [1.65, 2.2, 0.2, 0.15]];
  // long hair: red-brown wash above, a charcoal skirt below
  f.tube(trunk, { sides: 8, bone: 0, paint: (t, ca) => [0.95 - 0.25 * ca, 0.3 + 0.55 * ss(0.1, -0.85, ca), 0] });
  const head = [[1.25, 2.6, 0.7, 0.5], [1.6, 2.85, 0.62, 0.45], [1.92, 2.8, 0.52, 0.4], [2.15, 2.45, 0.42, 0.32], [2.28, 2.05, 0.3, 0.24]];
  f.tube(head, { sides: 8, bone: 1, ghost: true, openEnd: true, param: (t) => ss(0, 0.6, t), paint: (t, ca) => [0.9, 0.35 + 0.35 * ss(0.3, 1, ca), 0] });
  f.tube([[2.28, 2.1, 0.3, 0.2], [2.4, 1.6, 0.24, 0.17], [2.45, 1.1, 0.19, 0.14], [2.42, 0.65, 0.15, 0.11], [2.3, 0.3, 0.11, 0.09], [2.12, 0.14, 0.08, 0.07]],
    { sides: 6, bone: 2, param: (t) => t, paint: (t, ca) => [0.7, 0.5 + 0.3 * ca, 0] });
  for (const sg of [1, -1]) {
    f.tube([[2.12, 2.0, 0.1, 0.09], [2.42, 1.5, 0.095, 0.085], [2.82, 1.22, 0.085, 0.075], [3.2, 1.4, 0.06, 0.055], [3.36, 1.82, 0.035, 0.03], [3.26, 2.12, 0.012, 0.012]],
      { sides: 6, bone: 1, ghost: true, param: () => 0.8, zBow: (t) => sg * (0.3 + 0.42 * Math.sin(Math.PI * t * 0.75)), paint: () => [0.08, 0.05, 0], edgeBias: -0.01 });
    f.sheet([1.5, 2.55], [[1.42, 2.8], [1.62, 2.72], [1.6, 2.4], [1.46, 2.25], [1.38, 2.5], [1.42, 2.8]], { z: sg * 0.47, paint: [0.4, 0.75, 0], bone: 1, param: () => 0.6, edge: 0.05 });
  }
  eye(f, 1.98, 2.62, 0.4, 0.04);
  f.tube([[-1.84, 2.05, 0.06, 0.04], [-1.98, 1.8, 0.05, 0.035], [-2.02, 1.45, 0.07, 0.035], [-2.02, 1.25, 0.02, 0.015]], { sides: 5, bone: 0, flat: true, paint: () => [0, 1, 0] });
  const F = [1.05, 1.75, 0.8, 0.7], H = [-1.2, 1.6, 0.75, 0.62];
  legs4(f, F, H, 0.3, 0.36, 0.34, 2.0, 0.55);
  return { ...f.build(), fore: F, hind: H, L3: 0.3, gait: [1.7, 0.3, 0.03, 0.015], gaitOff: [0, 0.5, 0.75, 0.25], neck: [1.3, 2.5, 0.045, 2.0], tail: [0, 0.03, 0, 0.3],
    height: 3.5, len: 5.2, stride: 3.4 };
}

// the cave lion of Chauvet: maneless, low and long, the head carried forward below the line of the back, a long
// tail with a dark tuft; pale ochre with a charcoal contour only, so nobody takes it for a horse. It bounds:
// forelegs together, hind legs together.
function buildLion() {
  const f = new Fig();
  const trunk = [[-1.5, 0.98, 0.05, 0.04], [-1.42, 0.97, 0.2, 0.15], [-1.12, 0.98, 0.31, 0.22], [-0.6, 0.93, 0.29, 0.21], [-0.05, 0.9, 0.3, 0.22],
    [0.5, 0.95, 0.35, 0.24], [0.9, 1.01, 0.37, 0.24], [1.15, 1.02, 0.3, 0.2], [1.3, 1.0, 0.14, 0.1]];
  f.tube(trunk, { sides: 8, bone: 0, paint: (t, ca) => [0.8 + 0.3 * ca, 0.34 * ss(0.35, -0.85, ca), 0] });
  // neck and head: level, thick, a square muzzle with a dark nose and chin
  const neck = [[1.0, 1.05, 0.32, 0.19], [1.35, 1.07, 0.27, 0.17], [1.62, 1.06, 0.24, 0.16], [1.82, 1.04, 0.22, 0.15], [2.0, 0.98, 0.17, 0.12], [2.12, 0.93, 0.13, 0.1], [2.18, 0.9, 0.06, 0.05]];
  f.tube(neck, { sides: 8, bone: 1, ghost: true, param: (t) => ss(0, 0.6, t), paint: (t, ca) => [0.88, 0.85 * ss(0.86, 0.99, t) + 0.3 * ss(0.5, 1.0, t) * ss(0.2, -0.7, ca), 0] });
  for (const sg of [1, -1]) {
    f.sheet([1.7, 1.3], [[1.6, 1.24], [1.78, 1.25], [1.76, 1.36], [1.66, 1.39], [1.6, 1.24]], { z: sg * 0.12, paint: [0, 1, 0], bone: 1, ghost: true, param: () => 0.8, edge: 0 });   // round ear
    for (let k = 0; k < 3; k++) f.sheet([2.02, 0.93 - k * 0.02], [[2.0 - k * 0.03, 0.96 - k * 0.035], [2.03 - k * 0.03, 0.96 - k * 0.035], [2.03 - k * 0.03, 0.93 - k * 0.035], [2.0 - k * 0.03, 0.96 - k * 0.035]], { z: sg * 0.125, paint: [0, 1, 0], bone: 1, param: () => 0.9, edge: 0 });   // whisker spots
  }
  eye(f, 1.9, 1.1, 0.13, 0.028);
  // the long tail, carried low and out behind, with a charcoal tuft
  f.tube([[-1.44, 1.02, 0.065, 0.045], [-1.8, 0.86, 0.055, 0.04], [-2.2, 0.66, 0.05, 0.035], [-2.6, 0.58, 0.045, 0.035], [-2.9, 0.62, 0.075, 0.045], [-3.08, 0.68, 0.02, 0.015]],
    { sides: 5, bone: 2, flat: true, param: (t) => t, paint: (t) => [0.5 * (1 - ss(0.7, 0.85, t)), 0.25 + ss(0.68, 0.84, t), 0] });
  const F = [0.9, 0.9, 0.42, 0.36], H = [-1.12, 0.92, 0.45, 0.38];
  legs4(f, F, H, 0.14, 0.13, 0.14, 1.3, 0.12);
  return { ...f.build(), fore: F, hind: H, L3: 0.14, gait: [1.5, 0.42, 0.11, 0.12], gaitOff: [0.5, 0.58, 0, 0.08], neck: [1.05, 1.05, 0.05, 0.95], tail: [0.08, 0.07, 0.0, 0.03], height: 1.4, len: 4.0, stride: 6.2 };
}

function buildIbex() {
  const f = new Fig();
  const trunk = [[-0.7, 0.75, 0.04, 0.03], [-0.65, 0.74, 0.15, 0.11], [-0.4, 0.74, 0.22, 0.16], [0, 0.73, 0.24, 0.17], [0.35, 0.77, 0.25, 0.16], [0.55, 0.8, 0.18, 0.12], [0.65, 0.8, 0.08, 0.06]];
  f.tube(trunk, { sides: 6, bone: 0, paint: (t, ca) => [0.7, 0.55 + 0.3 * ss(0.2, -0.8, ca), 0] });
  const neck = [[0.45, 0.85, 0.18, 0.1], [0.62, 1.05, 0.12, 0.08], [0.75, 1.2, 0.1, 0.07], [0.9, 1.17, 0.08, 0.06], [1.02, 1.1, 0.05, 0.04]];
  f.tube(neck, { sides: 6, bone: 1, param: (t) => ss(0, 0.6, t), paint: () => [0.5, 0.8, 0] });
  for (const sg of [1, -1]) f.tube([[0.72, 1.28, 0.04, 0.03], [0.66, 1.52, 0.04, 0.03], [0.48, 1.7, 0.035, 0.025], [0.25, 1.7, 0.025, 0.02], [0.1, 1.55, 0.01, 0.01]],
    { sides: 4, bone: 1, param: () => 1, z: sg * 0.06, paint: () => [0, 1, 0], edgeBias: -0.02 });
  const F = [0.42, 0.72, 0.34, 0.3], H = [-0.48, 0.73, 0.35, 0.31];
  legs4(f, F, H, 0.14, 0.09, 0.09, 0.8, 0.8);
  return { ...f.build(), fore: F, hind: H, L3: 0.14, gait: [0.8, 0.16, 0.01, 0.01], gaitOff: [0, 0.5, 0.75, 0.25], neck: [0.5, 0.9, 0.08, 0.8], tail: [0, 0, 0, 0], height: 1.7, len: 1.7, stride: 1.5 };
}

// ---------------------------------------------------------------------------------------------------------
// Shaders. Everything is the hero's pigment recipe: bare rock = the grain, every pigment through rwDab.
// ---------------------------------------------------------------------------------------------------------
const ROCK_VERT = /* glsl */`
attribute vec4 aRock;
varying vec3 vW, vN;
varying vec4 vRock;
#include <fog_pars_vertex>
void main(){
  vec4 lp = vec4(position, 1.0); vec3 ln = normal;
  #ifdef USE_INSTANCING
  lp = instanceMatrix * lp; ln = mat3(instanceMatrix) * ln;
  #endif
  vec4 wp = modelMatrix * lp;
  vW = wp.xyz; vRock = aRock;
  vN = normalize(mat3(modelMatrix) * ln + vec3(0.0, 1e-5, 0.0));
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const GROUND_VERT = /* glsl */`
attribute vec4 aRock;
attribute float aTrail;
varying vec3 vW, vN;
varying vec4 vRock;
varying float vTrail;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz; vRock = aRock; vTrail = aTrail;
  vN = normalize(mat3(modelMatrix) * normal + vec3(0.0, 1e-5, 0.0));
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG_HEAD = /* glsl */`
${PIGMENT_GLSL}
varying vec3 vW, vN;
varying vec4 vRock;
#include <fog_pars_fragment>
float rwHash(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
vec4 rwTri(vec3 p, vec3 w){ return rwGrain2(p.zy) * w.x + rwGrain2(p.xz) * w.y + rwGrain2(p.xy) * w.z; }
float rwDash(vec2 p, float cell, float len, float wid, float keep, float wag, out float kind){
  vec2 c = p / cell, id = floor(c), f = fract(c) - 0.5;
  float hd = rwHash(id), ang = (hd - 0.5) * 1.5 + 1.25 + wag;
  vec2 dv = vec2(cos(ang), sin(ang)) * len, o = (vec2(fract(hd * 13.7), fract(hd * 5.1)) - 0.5) * 0.36;
  kind = fract(hd * 3.3);
  return (1.0 - smoothstep(wid, wid * 2.4, rwSeg(f, o - dv, o + dv, 0.0))) * step(keep, hd);
}
// a hoof print: an open crescent
float rwArc(vec2 p, float cell, float keep, out float kind){
  vec2 c = p / cell, id = floor(c), f = fract(c) - 0.5;
  float hd = rwHash(id + 7.0), a = hd * 6.2831853;
  kind = fract(hd * 4.7);
  vec2 q = f - (vec2(fract(hd * 13.7), fract(hd * 5.1)) - 0.5) * 0.3;
  float ring = abs(length(q) - 0.2);
  return (1.0 - smoothstep(0.035, 0.08, ring)) * smoothstep(-0.06, 0.1, dot(q, vec2(cos(a), sin(a)))) * step(keep, hd);
}
// skid marks: long scuffs that all run one way (p = metres along and across that way)
float rwSkid(vec2 p, out float kind){
  vec2 c = vec2(p.x / 1.7, p.y / 0.46), id = floor(c), f = fract(c) - 0.5;
  float hd = rwHash(id + 31.0);
  kind = fract(hd * 7.7);
  vec2 q = vec2(f.x * 1.7, (f.y + (hd - 0.5) * 0.3) * 0.46);
  float len = 0.34 + 0.44 * fract(hd * 5.3);
  float d = rwSeg(q, vec2(-len, 0.0), vec2(len, (fract(hd * 3.1) - 0.5) * 0.16), 0.0);
  return (1.0 - smoothstep(0.035, 0.1, d)) * step(0.35, hd);
}
`;

// the land: terrace, scree, bench, cliffs, gravel, ice.  aRock = (grass, ice, gravel, river wet)
const GROUND_FRAG = /* glsl */`
${FRAG_HEAD}
uniform float uCloud, uGlow;
uniform vec4 uRC;            // where the rhinos spar (x, z) and the axis they shove along (x, z)
varying float vTrail;
void main(){
  vec3 n = normalize(vN + vec3(0.0, 1e-4, 0.0));
  vec3 w = abs(n); w *= w; w /= (w.x + w.y + w.z + 1e-4);
  vec4 gr = rwTri(vW, w);
  float h = gr.r, hs = rwTri(vW + uSun * 0.022, w).r;
  vec4 mac = texture2D(uGrain, vW.xz * 0.0037 + 0.21);
  vec4 mid = texture2D(uGrain, vW.xz * 0.023);
  float cloud = texture2D(uGrain, (vW.xz + vec2(0.0, -uTime * 4.0)) * 0.0011 + 0.4).g;
  float gate = texture2D(uGrain, vec2((vW.x + vW.z) * 0.013, vW.y * 0.09) + 0.6).b;
  float streak = texture2D(uGrain, vec2((vW.x - vW.z) * 0.019, vW.y * 0.004) + 0.15).g;
  float dist = distance(vW, cameraPosition);
  float grass = vRock.x, ice = vRock.y, gravel = vRock.z;
  float steep = 1.0 - smoothstep(0.5, 0.8, n.y);
  vec3 rock = rwRock(h, gr.g) * (0.9 + 0.2 * mac.g);
  vec3 col = rock;
  // ice: calcite white, drawn with a few charcoal crevasse strokes
  vec3 iceCol = mix(uPale, vec3(0.9), 0.5) * (0.74 + 0.16 * h);
  col = mix(col, iceCol, ice);
  float flat1 = (1.0 - steep) * (1.0 - ice);
  // the steppe is a yellow-ochre wash, patchy, and the gust bands run through it as a darker ripple
  float gust = sin(dot(vW.xz, vec2(0.05, 0.11)) - uTime * 1.7) * 0.5 + sin(dot(vW.xz, vec2(-0.13, 0.04)) - uTime * 2.6) * 0.25;
  col = mix(col, uOchre * (0.6 + 0.3 * h), rwDab(grass * (0.52 + 0.75 * mid.g + 0.13 * gust) + (mac.g - 0.5) * 0.32, h, 0.2) * 0.6 * flat1);
  col = mix(col, mix(uOchre, uShade, 0.5) * 0.7, rwDab(grass * (smoothstep(0.42, 0.75, mac.b) * 0.7 - 0.14 * gust), h, 0.25) * 0.32 * flat1);
  // grass signs: charcoal and ochre dashes; a fine layer beyond the real tufts round the eye, a coarse one for the middle
  // distance that thins to ochre before it can turn to speckle
  float k1, k2, k3;
  float d1 = rwDash(vW.xz, 0.5, 0.3, 0.02, 0.2 + 0.5 * (1.0 - mid.g), gust * 0.5, k1) * (0.55 + 0.45 * smoothstep(9.0, 21.0, dist)) * smoothstep(2.0, 6.0, dist) * (1.0 - smoothstep(30.0, 64.0, dist));
  float d2 = rwDash(vW.xz + 7.3, 1.9, 0.3, 0.014 + dist * 0.00012, 0.3, gust * 0.3, k2) * (1.0 - smoothstep(80.0, 170.0, dist));
  float dd = max(d1, d2) * grass * flat1, kk = d1 > d2 ? k1 : k2;
  col = mix(col, mix(uChar * mix(1.25, 0.6, uEngr), uOchre * 0.8, step(0.55 - 0.3 * smoothstep(40.0, 120.0, dist), kk)), rwDab(dd * 0.95, h, 0.15) * 0.9);
  col = mix(col, vec3(0.86, 0.87, 0.85), uSnow * smoothstep(0.6, 0.34, h) * (0.45 + 0.55 * mac.g) * flat1 * 0.85);   // first snow lies white in the hollows of the grain, over the grass signs
  // gravel and scree: pebble dots
  float k4;
  float d3 = max(rwDash(vW.xz + 3.1, 0.46, 0.05, 0.085, 0.22, 0.0, k3) * (1.0 - smoothstep(20.0, 48.0, dist)), rwDash(vW.xz + 11.7, 1.7, 0.07, 0.075, 0.35, 0.0, k4) * (1.0 - smoothstep(70.0, 160.0, dist)));
  vec3 ink = mix(uChar * 1.6, uShade * 1.6, uEngr);
  col = mix(col, mix(ink, uRock * 0.42, step(0.4, k3)), rwDab(d3 * gravel * flat1 * 0.85, h, 0.15) * 0.8);
  col = mix(col, uShade, rwDab(gravel * (mid.b - 0.42) * 1.6 * flat1, h, 0.2) * 0.22);
  // cobbles: a charcoal crescent with a pale stone laid over it toward the sun, so each one stands up
  float k5, k6;
  float near1 = 1.0 - smoothstep(34.0, 80.0, dist);
  float cb = rwDash(vW.xz + 5.7, 1.05, 0.03, 0.17, 0.42, 0.0, k5) * near1;
  float ct = rwDash(vW.xz + 5.7 + uSun.xz * 0.07, 1.05, 0.03, 0.13, 0.42, 0.0, k6) * near1;
  float gz = gravel * flat1;
  col = mix(col, ink, rwDab(cb * gz * 0.9, h, 0.12) * 0.85);
  col = mix(col, rock * (1.08 + 0.2 * k6), ct * gz * 0.92);
  // drift lines: the strand marks the river leaves, wavering along the level of the bar; flood ochre between them
  float lvl = (vW.y - (${WATER}.0)) * 3.4 + mid.g * 1.3 + mac.b * 0.8;
  float dl = abs(fract(lvl) - 0.5), wetz = 1.0 - smoothstep(1.4, 2.6, vW.y - (${WATER}.0));
  float fwl = max(fwidth(lvl), 1e-4);
  float drift = (1.0 - smoothstep(0.03 + fwl, 0.07 + fwl * 1.5, dl)) * gz * wetz * (0.5 + 0.5 * step(0.4, gate));
  col = mix(col, uChar * 1.7, rwDab(drift * 0.85, h, 0.2) * 0.62 * (1.0 - smoothstep(60.0, 150.0, dist)));
  col = mix(col, uOchre * 0.8, rwDab(gz * wetz * smoothstep(0.55, 0.8, streak) * 0.8, h, 0.25) * 0.3);
  // the trail: churned red-ochre earth and hoof marks where the herd runs
  float k7;
  float hoof = rwDash(vW.xz + 1.9, 0.74, 0.05, 0.05, 0.56, gr.b * 3.0, k7) * (1.0 - smoothstep(24.0, 55.0, dist));
  float tr = vTrail * (1.0 - ice);
  col = mix(col, mix(uShade, uOchre * 0.5, 0.45), rwDab(tr * (0.22 + 0.8 * mid.g) - 0.1, h, 0.2) * 0.26);   // trodden earth
  col = mix(col, uRed * 0.85, rwDab(tr * (0.2 + 0.75 * mid.b) * (0.55 + 0.6 * gr.b) - 0.14, h, 0.14) * 0.34);
  col = mix(col, mix(uShade * 0.8, uRed * 0.7, step(0.6, k7)), rwDab(hoof * tr * 0.95, h, 0.12) * 0.8);
  // hoof prints: open crescents, plain under our own hooves and lost in the grain a little way off
  float k12;
  float print = rwArc(vW.xz + 6.3, 0.66, 0.42, k12) * (1.0 - smoothstep(14.0, 34.0, dist));
  col = mix(col, mix(ink * 0.8, uRed * 0.62, step(0.74, k12)), rwDab(print * tr * 0.95, h, 0.13) * 0.72);
  // the rhinos' ground: a scuffed ring where the two shove each other back and forth. Dark trodden earth, thrown
  // red-ochre turf, charcoal hoof crescents, long skids along their axis, and the grass round it trampled flat
  vec2 rq = vW.xz - uRC.xy;
  vec2 ra = vec2(dot(rq, uRC.zw), rq.x * uRC.w - rq.y * uRC.z);   // along the way they shove, and across it
  float rr = length(vec2(ra.x * 0.82, ra.y * 1.2)) + (gr.g - 0.5) * 3.4 + (mid.g - 0.5) * 1.6 + (gr.b - 0.5) * 0.8;
  float churn = (1.0 - smoothstep(4.4, 6.6, rr)) * flat1, core = 1.0 - smoothstep(1.0, 5.5, rr);
  float k8, k9, k10, k11;
  float arcs = rwArc(vW.xz + 2.7, 1.05, 0.25, k8), skid = rwSkid(ra, k9) * (1.0 - smoothstep(1.6, 4.2, abs(ra.y)));
  float flatg = rwDash(vW.xz + 4.4, 0.43, 0.36, 0.024, 0.22, 0.0, k10) * smoothstep(3.4, 5.2, rr) * (1.0 - smoothstep(7.5, 11.0, rr)) * flat1;
  float clod = rwDash(vW.xz + 9.1, 0.37, 0.04, 0.1, 0.5, 0.0, k11);
  col = mix(col, mix(uShade, uOchre * 0.45, 0.3), rwDab(churn * (0.25 + 0.4 * core + 0.75 * mid.b) - 0.08, h, 0.2) * 0.42);
  col = mix(col, uRed * 0.86, rwDab(churn * smoothstep(0.38, 0.72, gr.g * 0.6 + mac.b * 0.4 + 0.25 * core) * (0.5 + 0.7 * gr.b) - 0.06, h, 0.14) * 0.5);
  col = mix(col, mix(uRed * 0.8, ink, step(0.4, k11)), rwDab(clod * churn * 0.95, h, 0.12) * 0.85);
  col = mix(col, ink, rwDab(skid * churn * 0.97, h, 0.13) * 0.85);
  col = mix(col, mix(ink, uRed * 0.72, step(0.8, k8)), rwDab(arcs * churn * 0.97, h, 0.12) * 0.9);
  col = mix(col, mix(uOchre * 0.82, mix(uChar * 1.3, uShade, uEngr), step(0.7, k10)), rwDab(flatg * 0.95, h, 0.15) * 0.85);
  // the water's edge: a charcoal bank line
  float bank = 1.0 - smoothstep(0.05, 0.13, abs(vW.y - (${WATER}.0) - 0.06));
  col = mix(col, uChar * 1.5, rwDab(bank * vRock.w * 0.95, h, 0.2) * 0.75);
  // cliffs: bedding strokes, ochre weeping, and the drawn shade on faces turned from the sun
  float by = vW.y / 6.5 + (mac.g - 0.5) * 1.6 + (vW.x - vW.z) * 0.004;
  float bl = abs(fract(by) - 0.5);
  float crack = (1.0 - smoothstep(0.03, 0.1, bl)) * smoothstep(0.34, 0.6, gate) * steep;
  col = mix(col, mix(uOchre * 0.8, iceCol * 0.7, ice), rwDab(streak * 0.9 * steep, h, 0.25) * 0.36);
  float sh = smoothstep(0.2, -0.55, dot(n, uSun)) * max(steep, 0.4);
  col = mix(col, uShade, rwDab(sh * 0.85 + (gr.b - 0.5) * 0.3, h, 0.25) * 0.55);
  col *= 1.0 + uGlow * 0.22 * steep * smoothstep(0.0, 0.7, dot(n, uSun));   // golden hour: the low sun whitens the faces turned to it
  col = mix(col, uChar * 1.5, rwDab(crack * 0.92, h, 0.2) * 0.72);
  col = mix(col, uShade, rwDab(smoothstep(0.5, 0.15, fract(by + 0.5)) * 0.45 * steep, h, 0.25) * 0.3);
  // the shade of the smudge clouds, crossing the land
  col = mix(col, uShade, rwDab(smoothstep(0.55, 0.75, cloud) * 0.7 * uCloud + (gr.b - 0.5) * 0.2, h, 0.3) * 0.34 * uCloud);
  // wet margin of the river
  col = mix(col, uShade, vRock.w * 0.3);
  col = mix(rock, col, mix(1.0, 0.4, smoothstep(0.0, uFade, dist)));
  col *= 1.0 + rwRake(h, hs);
  col += rwSpark(gr, vW);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// rock that is built, not heightfield: the cave shell, the arch, stones.  aRock = (paint zone, cave, kind, arc metres)
// kind 0 wall or stone, 1 cave floor, 2 the arch face (big red hands ring the opening)
const ROCK_FRAG = /* glsl */`
${FRAG_HEAD}
void main(){
  vec3 n = normalize(vN + vec3(0.0, 1e-4, 0.0));
  vec3 w = abs(n); w *= w; w /= (w.x + w.y + w.z + 1e-4);
  vec4 gr = rwTri(vW, w);
  float h = gr.r, hs = rwTri(vW + uSun * 0.022, w).r;
  vec2 wu = vec2(vRock.w, vW.y);
  float kind = vRock.z, arch = step(1.5, kind), floorK = step(0.5, kind) * (1.0 - arch), stalK = step(kind, -0.5);   // kind -1: a stalagmite, w = the height of its foot
  float bed = texture2D(uGrain, vec2(vW.y * 0.13 + gr.g * 0.1, 0.31 + vRock.w * 0.004)).b;
  float zone = texture2D(uGrain, wu * 0.021 + 0.5).g;
  float zone2 = texture2D(uGrain, wu * 0.017 + vec2(0.13, 0.71)).g;
  float wipe = texture2D(uGrain, vec2(wu.x * 0.31, wu.y * 0.035) + 0.2).b;
  float gate = texture2D(uGrain, vec2(wu.x * 0.043, wu.y * 0.37) + 0.6).b;
  vec4 fl = texture2D(uGrain, (vW.xz + vec2(0.0, vRock.x * floorK)) * 0.06 + 0.3);
  vec3 col = rwRock(h, gr.g);
  float wall = 1.0 - floorK, fz = vRock.x * wall;
  col = mix(col, uOchre * 0.85, rwDab(bed * 0.75 * wall, h, 0.22) * 0.3);
  float sh = smoothstep(0.12, -0.6, dot(n, uSun)) * (1.0 - vRock.y);
  col = mix(col, uShade, rwDab(sh * 0.85 + (gr.b - 0.5) * 0.35, h, 0.25) * 0.55);
  float bs = mix(1.3, 3.4, arch);
  float by = vW.y / bs + (zone - 0.5) * 1.7 + vRock.w * 0.012;
  float bl = abs(fract(by) - 0.5), rockOnly = wall * (1.0 - fz * (1.0 - arch)) * step(0.5, vRock.w) * (1.0 - stalK);
  rockOnly *= 1.0 - smoothstep(0.55, 0.85, abs(n.y)) * (1.0 - arch);
  float crack = (1.0 - smoothstep(0.02, 0.07, bl)) * smoothstep(0.38, 0.6, gate) * rockOnly;
  col = mix(col, uChar * 1.5, rwDab(crack * 0.9, h, 0.14) * 0.7);
  col = mix(col, uShade, rwDab(smoothstep(0.5, 0.2, fract(by + 0.5)) * 0.42 * rockOnly, h, 0.25) * 0.3);
  // a stalagmite is drawn like the animals: ochre drip bands round it, a smudge where it stands, a charcoal contour
  float sBand = texture2D(uGrain, vec2(0.37 + gr.g * 0.04, vW.y * 0.55 + vRock.w * 0.13)).b;
  float sRim = 1.0 - abs(dot(n, normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0))));
  col = mix(col, uOchre * 0.8, rwDab(smoothstep(0.5, 0.68, sBand) * 0.9 * stalK, h, 0.2) * 0.5);
  col = mix(col, uShade, rwDab((1.0 - smoothstep(0.05, 0.75, abs(vW.y - vRock.w))) * 0.9 * stalK, h, 0.25) * 0.6);
  col = mix(col, uChar * 1.5, rwDab(smoothstep(0.6, 0.86, sRim) * 0.95 * stalK, h, 0.14) * 0.8);
  // the painted wall: palm-dot panels, hand stencils, torch wipes
  float hs2 = mix(1.0, 2.6, arch);
  vec2 c = wu / (0.3 * hs2), id = floor(c), f = fract(c) - 0.5;
  float hd = rwHash(id);
  float dotm = (1.0 - smoothstep(0.24, 0.33, length(f + (vec2(hd, fract(hd * 7.3)) - 0.5) * 0.25))) * step(0.42, hd);
  float red = dotm * smoothstep(0.7, 0.76, zone) * step(fract(hd * 9.1), 0.82);
  vec2 cs = vec2(1.05, 0.85) * hs2;
  vec2 c2 = (wu + vec2(0.0, 0.3)) / cs, id2 = floor(c2), f2 = (fract(c2) - 0.5) * cs;
  float hh = rwHash(id2 + 17.0), ha = (hh - 0.5) * 1.1;
  vec2 hp = vec2(f2.x * cos(ha) - f2.y * sin(ha), f2.x * sin(ha) + f2.y * cos(ha)) / (0.36 * hs2);
  hp.x *= fract(hh * 5.7) > 0.5 ? 1.0 : -1.0;
  float d = rwHand(hp);
  float keep = mix(step(hh, 0.6) * smoothstep(0.5, 0.58, zone2) * step(1.0, id2.y) * step(id2.y, 3.0), step(hh, 0.86), arch);
  float hand = step(0.0, d) * (1.0 - smoothstep(0.02, 0.5 + 0.1 * sin(uTime * 1.7 + hh * 40.0), d)) * keep;
  red = max(red * (1.0 - arch * 0.4), hand * (0.6 + 0.6 * gr.a));
  col = mix(col, uRed, rwDab(red * fz, h, 0.16) * 0.9);
  vec3 ink = mix(uChar * 1.5, uShade * 1.6, uEngr);   // engraved (night): stains and scatter stay dark, only lines are scraped pale
  col = mix(col, ink, rwDab(smoothstep(0.78, 0.98, wipe) * 0.6 * fz * (1.0 - arch), h, 0.2) * 0.45);
  // cave floor: trodden clay, charcoal scatter, bear wallows
  col = mix(col, uShade, rwDab((fl.g - 0.35) * 1.5 * floorK, h, 0.25) * 0.35);
  col = mix(col, ink, rwDab(smoothstep(0.93, 0.99, fl.a) * floorK + smoothstep(0.75, 0.9, fl.b) * 0.7 * floorK, h, 0.12) * 0.75);
  float dist = distance(vW, cameraPosition);
  col = mix(rwRock(h, gr.g), col, mix(1.0, 0.45, smoothstep(0.0, uFade, dist)));
  col *= 1.0 + rwRake(h, hs);
  col += rwSpark(gr, vW);
  col = rwCave(col, vW, vRock.y);
  vec2 e1 = vW.xz - uHearth.xz, e2 = vW.xz - vec2(0.5 - uHearth.x, uHearth.z - 3.0);
  float emb = (exp(-dot(e1, e1) / 0.5) + exp(-dot(e2, e2) / 0.5)) * floorK * uHearth.w;
  col += vec3(2.6, 0.75, 0.12) * emb * smoothstep(0.35, 0.8, gr.r + 0.25 * sin(uTime * 2.3 + gr.a * 30.0)) + vec3(0.5, 0.1, 0.02) * emb;
  vec3 tm = uMouth.xyz - vW, tt = vW - uTorch.xyz;
  tt.z *= mix(1.0, uTorchBack, step(0.0, tt.z));
  float mlK = exp(-length(tm) / max(uMouth.w, 1.0)), tlK = uTorch.w * exp(-dot(tt, tt) / max(uTorchR, 1.0));
  float back = dot(n, tm / max(length(tm), 1e-3));
  col *= mix(1.0, mix(0.2, 1.0, smoothstep(-0.6, 0.05, back)), vRock.y * mlK / (mlK + tlK + 0.02));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// the gorge walls: limestone in beds. aRock = (bed number + height within the bed, painted panel, hollow, metres along the wall)
// Every joint between two beds is a real ledge and is drawn as a charcoal line broken along its length; under each ledge a
// smudge, down from it ochre weeping and dark water streaks; upright joints; drawn shade in the clefts and on faces turned
// from the sun. The painted panel carries big red hands and palm dots between the running giants.
const CLIFF_FRAG = /* glsl */`
${FRAG_HEAD}
uniform float uGlow;
void main(){
  vec3 n = normalize(vN + vec3(0.0, 1e-4, 0.0));
  if (dot(n, cameraPosition - vW) < 0.0) n = -n;
  vec3 w = abs(n); w *= w; w /= (w.x + w.y + w.z + 1e-4);
  vec4 gr = rwTri(vW * 0.45, w);
  float h = gr.r, hs = rwTri(vW * 0.45 + uSun * 0.03, w).r;
  vec2 wu = vec2(vRock.w, vW.y);
  float bedp = vRock.x, bi = floor(bedp + 0.5), bl = floor(bedp), bf = fract(bedp), bj = min(bf, 1.0 - bf);
  float fwb = min(fwidth(bedp), 0.2);
  vec4 mac = texture2D(uGrain, wu * 0.0045 + 0.3);
  float gate = texture2D(uGrain, vec2(wu.x * 0.021, bi * 0.37 + 0.1)).b;
  float streak = texture2D(uGrain, vec2(wu.x * 0.035, wu.y * 0.0045) + 0.15).g;
  float streak2 = texture2D(uGrain, vec2(wu.x * 0.09, wu.y * 0.011) + 0.6).b;
  float vjn = texture2D(uGrain, vec2(wu.x * 0.028 + (streak - 0.5) * 0.012, wu.y * 0.0016 + 0.05)).r;
  float zone = texture2D(uGrain, wu * 0.0031 + 0.5).g, zone2 = texture2D(uGrain, wu * 0.0027 + vec2(0.13, 0.71)).g;
  float dist = distance(vW, cameraPosition);
  vec3 rock = rwRock(h, gr.g) * (0.8 + 0.2 * mac.g), col = rock;
  col = mix(col, uOchre * 0.82, (0.14 + 0.14 * rwHash(vec2(bl, 3.0)) + 0.24 * smoothstep(0.4, 0.7, zone)) * (1.0 - 0.6 * vRock.y));
  col = mix(col, uOchre * 0.85, rwDab(smoothstep(0.45, 0.8, streak) * (0.35 + 0.65 * smoothstep(1.0, 0.25, bf)), h, 0.25) * 0.42);
  col = mix(col, uOchre * 0.78, rwDab((mac.b - 0.4) * 1.5, h, 0.25) * 0.22);
  col = mix(col, mix(uShade, uOchre * 0.5, 0.3), rwDab(smoothstep(0.7, 0.92, streak2) * 0.85, h, 0.2) * 0.36);
  // the beds above the painted one stand in a drawn shade of their own, so the crown is a clear step darker than the sky;
  // the painted bed carries a thin ground of yellow ochre under its animals
  float above = smoothstep(4.0, 4.5, bedp);
  col = mix(col, mix(uShade, uOchre * 0.55, 0.4), rwDab(above * (0.46 + 0.5 * mac.g) + (gr.b - 0.5) * 0.3, h, 0.25) * 0.5);
  col = mix(col, uOchre * 0.9, rwDab(vRock.y * (0.3 + 0.5 * zone), h, 0.25) * 0.3);
  float sh = max(smoothstep(0.15, -0.55, dot(n, uSun)) * 0.8, vRock.z);
  col = mix(col, uShade, rwDab(sh * 0.85 + (gr.b - 0.5) * 0.3, h, 0.25) * 0.5);
  col *= 1.0 + uGlow * 0.22 * smoothstep(0.0, 0.7, dot(n, uSun));
  col = mix(col, uShade, rwDab(smoothstep(0.66, 1.0, bf) * 0.7, h, 0.25) * 0.42 * (1.0 - 0.5 * vRock.y));
  float jl = (1.0 - smoothstep(0.02 + fwb, 0.05 + fwb * 1.6, bj)) * smoothstep(0.3, 0.46, gate);
  float vj = (1.0 - smoothstep(0.006, 0.02, abs(vjn - 0.5))) * smoothstep(0.42, 0.6, zone2) * (1.0 - vRock.y) * (1.0 - smoothstep(140.0, 420.0, dist));
  col = mix(col, uChar * 1.5, rwDab(max(jl, vj * 0.8) * 0.92, h, 0.16) * 0.74);
  // the painted panel
  float hs2 = 5.5;
  vec2 c = wu / (0.3 * hs2), id = floor(c), f = fract(c) - 0.5;
  float hd = rwHash(id);
  float dotm = (1.0 - smoothstep(0.24, 0.33, length(f + (vec2(hd, fract(hd * 7.3)) - 0.5) * 0.25))) * step(0.42, hd);
  float red = dotm * smoothstep(0.66, 0.72, zone) * step(fract(hd * 9.1), 0.82);
  vec2 cs = vec2(1.05, 0.85) * hs2;
  vec2 c2 = (wu + vec2(0.0, 0.3)) / cs, id2 = floor(c2), f2 = (fract(c2) - 0.5) * cs;
  float hh = rwHash(id2 + 17.0), ha = (hh - 0.5) * 1.1;
  vec2 hp = vec2(f2.x * cos(ha) - f2.y * sin(ha), f2.x * sin(ha) + f2.y * cos(ha)) / (0.36 * hs2);
  hp.x *= fract(hh * 5.7) > 0.5 ? 1.0 : -1.0;
  float d = rwHand(hp);
  float hand = step(0.0, d) * (1.0 - smoothstep(0.02, 0.5 + 0.1 * sin(uTime * 1.7 + hh * 40.0), d)) * step(hh, 0.5) * smoothstep(0.54, 0.62, zone2);
  red = max(red, hand * (0.6 + 0.6 * gr.a));
  col = mix(col, uRed, rwDab(red * vRock.y * step(0.1, bj), h, 0.16) * 0.85);
  col = mix(rock * 0.94, col, mix(1.0, 0.66, smoothstep(0.0, uFade * 0.55, dist)));
  col *= 1.0 + rwRake(h, hs);
  col += rwSpark(gr, vW);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// the sky is rock: the same grain on a vault, paler to the sun, ochre along the horizon, and six finger smudges of
// charcoal: each one a long stroke laid level with the horizon, pressed hard at one end and trailing thin at the other
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 mv = viewMatrix * vec4(position + cameraPosition, 1.0);
  gl_Position = projectionMatrix * mv;
  if (abs(gl_Position.w) < 1e-4) gl_Position.w = 1e-4;
  gl_Position.z = gl_Position.w * 0.99999;
}`;
const SKY_FRAG = /* glsl */`
${PIGMENT_GLSL}
uniform vec4 uStencil;      // amount, sweep 0..1, hand fade, -
uniform vec3 uHandDir, uHaze, uIceDir;
uniform vec4 uSkyK;         // horizon wash, cloud amount, plume, moon
uniform vec4 uSkyG;         // golden wash, how charcoal the smudges are, how high the horizon wash reaches, -
uniform vec4 uStreak[6];    // azimuth, elevation, half length, half thickness (radians)
uniform vec4 uDisc;         // the painted sun: direction (xyz) and radius (radians)
uniform vec4 uDiscK;        // how much of it is drawn, moon (night: a scraped ring), halo, -
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir + vec3(0.0, 1e-5, 0.0));
  float up = max(d.y, 0.0);
  vec2 p = d.xz / (up * 0.9 + 0.3) * 26.0;
  vec4 gr = rwGrain2(p);
  float h = gr.r, hs = rwGrain2(p + uSun.xz * 0.06).r;
  vec2 cp = d.xz / (up + 0.16);
  float cl2 = texture2D(uGrain, vec2(cp.x * 0.5, cp.y * 0.11 - uTime * 0.007) + 0.5).b;
  vec2 dz = d.xz + vec2(0.0, step(dot(d.xz, d.xz), 1e-8) * 1e-3);
  float az = atan(dz.x, -dz.y), el = asin(clamp(d.y, -1.0, 1.0)), ce = cos(el);
  float strk = texture2D(uGrain, vec2(az * 0.31831, el * 7.0 + 0.2)).b;   // the grain drawn out along the stroke
  float pl = texture2D(uGrain, vec2(atan(d.x, -d.z + 1e-4) * 0.9 - uTime * 0.012, d.y * 3.0)).g;
  vec3 col = rwRock(h, gr.g);
  float sa = max(dot(d, uSun), 0.0);
  float s2 = sa * sa; s2 *= s2;
  col = mix(col, uPale * 0.82, s2 * s2 * 0.75);
  // golden hour: the whole vault is washed pale gold, palest on the sun's side
  vec2 dh = d.xz / max(length(d.xz), 1e-3), sh2 = uSun.xz / max(length(uSun.xz), 1e-3);
  float sunSide = dot(dh, sh2) * 0.5 + 0.5;
  col *= 1.0 + uSkyG.x * (0.2 * sunSide * sunSide - 0.03);
  float hz = 1.0 - smoothstep(0.0, uSkyG.z, d.y);
  col = mix(col, uOchre * (0.75 + 0.2 * h), rwDab(hz * uSkyK.x + (gr.g - 0.5) * 0.3, h, 0.22) * 0.5);
  // the painted sun: a great red-ochre disc standing on the horizon at the valley's end, drawn as the painters would:
  // rubbed on round and round with a dry pad so it breaks on the grain, a darker rim where the pad was pressed, a ring of
  // bare rock, then a band of yellow ochre blown round it. At night the same sign is a moon scraped out as a pale ring.
  vec3 sd = d - uDisc.xyz;
  float sr = length(sd) / max(uDisc.w, 1e-3) + (cl2 - 0.5) * 0.07 + (gr.b - 0.5) * 0.05;
  float sang = atan(sd.y, dot(sd, vec3(1.0, 0.0, 0.0)) + step(dot(sd, sd), 1e-10) * 1e-4);
  float rub = texture2D(uGrain, vec2(sang * 0.42 + sr * 0.35, sr * 1.7) + 0.27).b;      // the pad's strokes run round the disc
  float inD = 1.0 - smoothstep(0.97, 1.03, sr);
  float halo = smoothstep(1.2, 1.34, sr) * (1.0 - smoothstep(1.5, 1.86, sr));
  float halo2 = smoothstep(2.02, 2.1, sr) * (1.0 - smoothstep(2.14, 2.3, sr));
  float day = uDiscK.x * (1.0 - uDiscK.y), moon = uDiscK.x * uDiscK.y;
  col = mix(col, uOchre * (0.82 + 0.2 * h), rwDab((halo * (0.62 + 0.5 * rub) + halo2 * 0.5 * step(0.45, rub)) * uDiscK.z + (gr.g - 0.5) * 0.25 * halo, h, 0.2) * 0.8 * day);
  vec3 sunCol = mix(uRed * (1.0 + 0.3 * h), mix(uRed * 0.5, uChar * 1.3, 0.3), smoothstep(0.74, 0.95, sr + (rub - 0.5) * 0.2));
  sunCol = mix(sunCol, uRed * 0.62, smoothstep(0.55, 0.75, rub) * 0.5);
  col = mix(col, sunCol, rwDab(inD * (0.78 + 0.3 * rub + 0.2 * smoothstep(0.7, 1.0, sr)), h, 0.13) * 0.95 * day);
  float mring = (1.0 - smoothstep(0.035, 0.07, abs(sr - 0.95))) + 0.5 * inD * smoothstep(0.6, 0.72, rub);
  col = mix(col, uChar * 1.5, rwDab(mring * 0.9, h, 0.14) * 0.8 * moon);
  // the smudge clouds
  // each is a finger dragged level along the rock: laid on thick where it was pressed, running dry in streaks toward the tail
  float wobS = (cl2 - 0.5) * 0.55 + (gr.b - 0.5) * 0.35, smudge = 0.0;
  for (int i = 0; i < 6; i++) {
    vec4 st = uStreak[i];
    float da = mod(az - st.x - uTime * 0.0035 + 3.14159265, 6.2831853) - 3.14159265;
    float x = da * ce / max(st.z, 1e-3), tail = smoothstep(-0.85, 1.0, x);
    float y = (el - st.y + 0.045 * x * x - 0.012 * sin(x * 5.0 + st.x * 7.0)) / max(st.w * (1.0 - 0.45 * tail), 1e-3);
    float bx = 1.0 - smoothstep(0.84, 1.0, abs(x) + wobS * 0.12), by = 1.0 - smoothstep(0.45, 1.0, abs(y) + wobS * 0.6);
    float fing = 0.5 + 0.5 * cos(y * 6.5 + st.x * 3.0);
    smudge = max(smudge, bx * by * (1.0 - 0.62 * tail) * (0.6 + 0.75 * strk + 0.2 * fing));
  }
  smudge *= smoothstep(0.03, 0.11, d.y);
  col = mix(col, mix(uShade, uChar * 1.7, uSkyG.y), rwDab(smudge * 0.9 * uSkyK.y + (gr.b - 0.5) * 0.3, h, 0.22) * 0.66);
  // loess streaming off the ice
  float pd = max(dot(normalize(vec3(d.x, 0.0, d.z) + vec3(1e-5, 0.0, 0.0)), uIceDir), 0.0);
  float plume = pd * pd * pd * smoothstep(0.02, 0.07, d.y) * (1.0 - smoothstep(0.1, 0.34, d.y)) * uSkyK.z;
  col = mix(col, uOchre * 0.85, rwDab(plume * (0.5 + 0.8 * pl), h, 0.2) * 0.6);
  // the rare stencil: red ochre blown across the sky from the left, one vast hand left bare
  vec3 hr = normalize(cross(uHandDir, vec3(0.0, 1.0, 0.0)) + vec3(1e-5, 0.0, 0.0)), hu = cross(hr, uHandDir);
  vec2 q = vec2(dot(d, hr), dot(d, hu)) / 0.72;
  float front = step(0.0, dot(d, uHandDir));
  float hd = rwHand(q * vec2(-1.0, 1.0));
  float sweep = smoothstep(1.6 - uStencil.y * 4.4, 2.4 - uStencil.y * 4.4, -q.x);
  float spray = uStencil.x * sweep * (0.34 + 0.75 * exp(-max(hd, 0.0) * 1.6) * front) * smoothstep(-0.05, 0.12, d.y);
  spray *= mix(1.0, smoothstep(-0.02, 0.05, hd), front * uStencil.z) * mix(1.0, smoothstep(1.12, 1.4, sr), uDiscK.x);   // the sun keeps a ring of bare rock round it
  col = mix(col, uRed * 1.05, rwDab(spray + (gr.a - 0.5) * 0.5 * step(0.01, spray), h, 0.18) * 0.92);
  col *= 1.0 + rwRake(h, hs) * 0.8;
  // the sun: a bare bright patch; at night a pale scraped moon
  float disc = smoothstep(0.9972, 0.9988, sa + (gr.b - 0.5) * 0.0012);
  col = mix(col, mix(uPale * 1.9, uPale * 1.3, uSkyK.w), disc);
  col += uPale * 0.25 * s2 * s2 * s2 * (1.0 - uSkyK.w);
  col = mix(col, uHaze, (1.0 - smoothstep(-0.02, 0.1, d.y)) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}`;

// grass: brush-dab blades in clumps. Each blade is a tapered ribbon of three triangles (widest at the foot, drawn to a point)
// that leans and ripples in the gust bands; the paint breaks toward the tip. One program draws two meshes:
//   uWrap 1  the carpet round the eye: clumps of five blades in a square that wraps round uCtr, stood on the ground
//            with a height table (uHt: r = ground height, g = grass mask, b = how tall it grows there, 1 m texels read with texelFetch)
//   uWrap 0  the middle distance: fixed tufts of two blades, which shrink away before they can turn to speckle
const GRASS_VERT = /* glsl */`
uniform float uTime, uWrap, uBox, uEngr;
uniform vec3 uCtr;
uniform sampler2D uHt;
uniform vec4 uHtBox;        // x0, z0, columns, rows
attribute vec4 iP, iQ;      // (x or 0..1, y, z or 0..1, length)  (seed, kind, rot, lean)
varying vec4 vK;            // kind, seed, distance, height along the blade
varying vec2 vUV;
varying float vGust;
#include <fog_pars_vertex>
vec3 rwHt(vec2 xz){
  vec2 f = clamp(xz - uHtBox.xy, vec2(0.0), uHtBox.zw - 1.001);
  vec2 i = floor(f), w = f - i;
  ivec2 c = ivec2(i);
  vec3 a = texelFetch(uHt, c, 0).rgb, b = texelFetch(uHt, c + ivec2(1, 0), 0).rgb;
  vec3 e = texelFetch(uHt, c + ivec2(0, 1), 0).rgb, d = texelFetch(uHt, c + ivec2(1, 1), 0).rgb;
  return mix(mix(a, b, w.x), mix(e, d, w.x), w.y);
}
void main(){
  float b = position.z, t = position.y;
  float hb = fract(sin(iQ.x * 91.7 + b * 17.3) * 437.585), hb2 = fract(hb * 7.13 + 0.37);
  vec3 base = iP.xyz; float keep = 1.0, tall = 1.0;
  if (uWrap > 0.5) {
    vec2 rel = fract((iP.xz * uBox - uCtr.xz) / uBox) - 0.5;
    vec2 xz = uCtr.xz + rel * uBox;
    vec3 hm = rwHt(xz);
    keep = (1.0 - smoothstep(0.76, 0.98, max(abs(rel.x), abs(rel.y)) * 2.0)) * smoothstep(iQ.x * 0.86, iQ.x * 0.86 + 0.14, hm.y);
    base = vec3(xz.x, hm.x - 0.02, xz.y); tall = hm.z;
  }
  float rot = iQ.z + b * 1.257 + hb * 1.6;
  vec3 rd = vec3(cos(rot), 0.0, sin(rot));
  base += rd * ((0.04 + 0.15 * hb2) * step(0.5, b));
  float d0 = distance(base, cameraPosition);
  keep *= mix(1.0 - smoothstep(110.0, 175.0, d0), 1.0, uWrap);
  float len = iP.w * (0.6 + 0.62 * hb) * keep * tall;
  float gust = sin(dot(base.xz, vec2(0.05, 0.11)) - uTime * 1.7) * 0.5 + sin(dot(base.xz, vec2(-0.13, 0.04)) - uTime * 2.6) * 0.25;
  float flut = sin(uTime * (4.5 + 3.0 * hb) + iQ.x * 40.0 + b * 2.1) * 0.07;
  vec3 lean = vec3(0.25, 0.0, 0.95) * (0.36 + 0.62 * gust + flut) + rd * (iQ.w + 0.3 * hb2);
  vec3 dir = normalize(vec3(0.0, 1.0, 0.0) + lean * 0.55);
  vec3 p = base + dir * (t * len) + lean * (t * t * 0.6 * len) - vec3(0.0, t * t * 0.16 * len * dot(lean, lean), 0.0);
  vec3 vd = p - cameraPosition; float dist = max(length(vd), 0.01);
  vec3 side = normalize(cross(dir, vd / dist) + vec3(1e-5, 0.0, 0.0));
  float wd = max(0.015 + 0.027 * iP.w, dist * 0.0012) * mix(1.0, 0.74, step(0.25, t)) * mix(1.0, 0.58, uEngr * (1.0 - smoothstep(18.0, 30.0, dist)));   // engraved: a scratch, not a brush stroke
  p += side * (position.x * wd);
  float kind = iQ.y;
  if (hb2 > 0.74) kind = kind < 0.5 ? 1.0 : (kind < 1.5 ? 0.0 : kind);   // a dark blade in an ochre clump, an ochre one in a dark clump
  vK = vec4(kind, iQ.x + b * 0.173, dist, t); vUV = vec2(position.x, t * len); vGust = gust;
  vec4 mvPosition = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  if (keep < 0.03) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  #include <fog_vertex>
}`;
const GRASS_FRAG = /* glsl */`
${PIGMENT_GLSL}
varying vec4 vK;
varying vec2 vUV;
varying float vGust;
#include <fog_pars_fragment>
void main(){
  // the grain stretched along the stroke: the brush runs dry in streaks and toward the point
  vec4 g = texture2D(uGrain, vec2(vUV.x * 0.03 + vK.y * 0.37, vUV.y * 0.8 + vK.y * 3.1));
  float t = vK.w;
  if (rwDab(0.98 - 0.52 * t, g.r * 0.55 + g.b * 0.45, 0.1) < 0.5) discard;
  vec3 ink = uChar * mix(1.35, 0.46, uEngr);
  vec3 col = vK.x < 0.5 ? ink : (vK.x < 1.5 ? uOchre * (0.6 + 0.34 * g.r) : (vK.x < 2.5 ? uRed * 0.92 : mix(mix(uOchre, uPale, 0.34) * 0.78, ink * 0.9, uEngr)));
  // every blade stands in its own shade at the foot and catches the light at the tip; the gust bands show as a sheen
  col = mix(mix(uShade, ink, 0.45), col, smoothstep(0.0, 0.34, t)) * (0.9 + 0.26 * t + 0.16 * vGust);
  col = mix(rwRock(0.6, 0.5), col, mix(0.95, 0.45, smoothstep(0.0, uFade, vK.z)));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// plant signs: dwarf birch (red), willow and wormwood (ochre), juniper tufts, fishbone pines; two crossed cards each
const SIGN_VERT = /* glsl */`
uniform float uTime;
attribute vec4 iP, iQ;      // (x, y, z, height)  (kind, seed, rot, half width / height)
varying vec2 vUV;
varying vec3 vK;
#include <fog_pars_vertex>
void main(){
  float rot = iQ.z + position.z * 1.5708, hgt = iP.w;
  vec3 ax = vec3(cos(rot), 0.0, sin(rot));
  float y = position.y, sway = sin(uTime * (2.2 + iQ.y * 2.0) + iQ.y * 40.0) * 0.035 + sin(uTime * 7.0 + iQ.y * 90.0) * 0.012;
  vec3 p = iP.xyz + ax * (position.x * iQ.w * hgt) + vec3(0.0, y * hgt, 0.0) + vec3(0.3, 0.0, 0.95) * (sway * y * y * hgt * (iQ.x > 2.5 ? 0.35 : 1.0));
  vUV = vec2(position.x * iQ.w, y); vK = vec3(iQ.x, iQ.y, distance(p, cameraPosition));
  vec4 mvPosition = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SIGN_FRAG = /* glsl */`
${PIGMENT_GLSL}
varying vec2 vUV;
varying vec3 vK;
#include <fog_pars_fragment>
void main(){
  float fw = max(fwidth(vUV.y), 1e-4);
  vec4 g = texture2D(uGrain, vUV * (vK.x > 2.5 ? 1.3 : 0.4) + vK.y * 3.0);
  float kind = vK.x, sd = vK.y, y = vUV.y;
  float x = vUV.x + (sd - 0.5) * 0.3 * y * y, ax = abs(x);
  vec2 q = vec2(ax, y);
  float d, rib = 1.0;
  if (kind < 1.5) {          // branch sign
    d = rwSeg(vec2(x, y), vec2(0.0), vec2(0.0, 0.92), 0.0);
    d = min(d, rwSeg(q, vec2(0.0, 0.2), vec2(0.42, 0.62), 0.0));
    d = min(d, rwSeg(q, vec2(0.0, 0.45), vec2(0.3, 0.84), 0.0));
    d = min(d, rwSeg(q, vec2(0.0, 0.68), vec2(0.16, 0.97), 0.0));
    d = min(d, rwSeg(q, vec2(0.24, 0.44), vec2(0.46, 0.5), 0.0));
  } else if (kind < 2.5) {   // tuft sign
    d = rwSeg(q, vec2(0.0), vec2(0.03, 0.95), 0.0);
    d = min(d, rwSeg(q, vec2(0.0), vec2(0.3, 0.86), 0.0));
    d = min(d, rwSeg(q, vec2(0.0), vec2(0.52, 0.62), 0.0));
    d = min(d, rwSeg(q, vec2(0.0), vec2(0.6, 0.3), 0.0));
  } else {                   // fishbone pine
    d = rwSeg(vec2(x, y), vec2(0.0), vec2(0.0, 0.98), 0.0) - 0.006;
    float ry = fract(y * 9.0) - 0.62 + ax * 2.6;
    float ext = 0.05 + 0.27 * (1.0 - y) * smoothstep(0.2, 0.34, y);
    rib = max(abs(ry) / 9.0 * 0.36, ax - ext);
  }
  float lw = max(kind > 2.5 ? 0.011 : (kind > 1.5 ? 0.024 : 0.042), 1.3 * fw);
  float a = 1.0 - smoothstep(lw - fw * 0.6, lw + fw * 0.6, d);
  float lr = min(lw, 0.019);
  a = max(a, 1.0 - smoothstep(lr - min(fw, 0.012) * 0.6, lr + min(fw, 0.012) * 0.6, rib));
  if (rwDab(a * (0.95 - (kind > 2.5 ? 0.0 : (kind > 1.5 ? 0.5 : 0.34)) * smoothstep(20.0, 85.0, vK.z)), g.r, 0.1) < 0.5) discard;
  vec3 col = kind < 0.5 ? uRed : (kind < 1.5 ? uOchre * 0.88 : uChar * mix(1.25, 0.42, uEngr));
  col = mix(rwRock(0.6, 0.5), col, mix(0.95, 0.5, smoothstep(0.0, uFade, vK.z)));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// dabs in the air: red dots drifting like pollen (0), motes in the gallery (1), splashes (2), snow or loess (3)
const DOT_VERT = /* glsl */`
uniform float uTime, uPx, uAir;
uniform vec4 uEmit[8];
attribute vec4 iP, iQ;      // (0..1 cube position)  (kind, seed, size, -)
varying vec2 vQ;
varying vec4 vK;
#include <fog_pars_vertex>
void main(){
  float kind = iQ.x, sd = iQ.y, vis = 1.0;
  vec3 c = cameraPosition, p;
  if (kind < 0.5) {
    vec3 box = vec3(110.0, 26.0, 110.0);
    vec3 q = iP.xyz * box + vec3(sin(uTime * 0.3 + sd * 30.0) * 1.5, sin(uTime * 0.23 + sd * 50.0) * 1.2 + uTime * 0.12, uTime * 1.1);
    p = c + (fract((q - c) / box) - 0.5) * box;
    vis = step(p.z, -104.0);
  } else if (kind < 1.5) {
    vec3 box = vec3(26.0, 8.0, 44.0);
    vec3 q = iP.xyz * box + vec3(sin(uTime * 0.21 + sd * 30.0), sin(uTime * 0.17 + sd * 50.0) * 0.6 - uTime * 0.03, cos(uTime * 0.19 + sd * 20.0)) * 0.7;
    p = c + (fract((q - c) / box) - 0.5) * box;
    vis = step(-99.0, p.z);
  } else if (kind < 2.5) {
    vec4 e = uEmit[int(min(floor(iP.x * 8.0), 7.0))];
    float t = fract(uTime * 1.5 + sd * 3.0), a = iP.y * 6.2832;
    vec3 v = vec3(cos(a) * 2.0 * iP.z, 2.6 + 3.6 * iP.z, sin(a) * 2.0 * iP.z);
    p = e.xyz + v * t * 0.6 + vec3(0.0, -4.9 * t * t * 0.36 + 0.05, 0.0);
    vis = e.w * (1.0 - t * 0.6);
  } else {
    vec3 box = vec3(70.0, 34.0, 70.0);
    vec3 q = iP.xyz * box + vec3(uTime * 0.6 + sin(uTime * 0.7 + sd * 30.0) * 0.6, -uTime * uAir, uTime * 2.2);
    p = c + (fract((q - c) / box) - 0.5) * box;
    vis = step(p.z, -100.0);
  }
  vec4 mvPosition = viewMatrix * vec4(p, 1.0);
  float dist = max(-mvPosition.z, 0.05);
  float sz = clamp(max(iQ.z, dist * uPx * 1.1), 0.0, dist * uPx * 10.0);
  mvPosition.xy += position.xy * sz;
  vQ = position.xy; vK = vec4(kind, sd, vis, dist); 
  gl_Position = projectionMatrix * mvPosition;
  if (vis < 0.05 || dist < 0.7) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  #include <fog_vertex>
}`;
const DOT_FRAG = /* glsl */`
${PIGMENT_GLSL}
uniform vec3 uAirCol, uSplash;
varying vec2 vQ;
varying vec4 vK;
#include <fog_pars_fragment>
void main(){
  float n = texture2D(uGrain, vQ * 0.13 + vK.y * vec2(3.7, 5.1)).b;
  float r = length(vQ) + (n - 0.5) * 0.5;
  if (r > 0.85 * mix(0.6, 1.0, vK.z)) discard;
  vec3 col;
  if (vK.x < 0.5) col = uRed * 0.95;
  else if (vK.x < 1.5) col = uTorchCol * uPale * (0.05 + 1.0 * uTorch.w * exp(-vK.w * vK.w / 70.0)) + uPale * 0.25 * exp(-distance(cameraPosition, uMouth.xyz) / 40.0);
  else if (vK.x < 2.5) col = mix(uSplash, uSplash * 0.35, step(0.7, fract(vK.y * 7.3)) * step(uSplash.b * 2.5, uSplash.r));   // red turf has dark clods among it
  else col = uAirCol;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// choughs and the owl: two flapping wings and a body, placed from JS
const BIRD_VERT = /* glsl */`
uniform float uTime;
attribute vec4 iP, iQ;      // (x, y, z, scale)  (heading, phase, kind, flap)
varying vec3 vK, vB;
#include <fog_pars_vertex>
void main(){
  float a = sin(uTime * iQ.w + iQ.y) * (iQ.z > 0.5 ? 0.5 : 0.8) + (iQ.z > 0.5 ? 0.2 : 0.12);
  float span = abs(position.x), sgn = sign(position.x);
  vec3 F = vec3(sin(iQ.x), 0.0, cos(iQ.x)), R = vec3(F.z, 0.0, -F.x);
  vec3 lp = R * (sgn * span * cos(a * min(span * 1.6, 1.0))) + vec3(0.0, span * sin(a) + position.y, 0.0) + F * position.z;
  vec3 p = iP.xyz + lp * iP.w;
  vK = vec3(iQ.z, span, position.z); vB = position;
  vec4 mvPosition = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  if (iP.w < 0.01) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  #include <fog_vertex>
}`;
const BIRD_FRAG = /* glsl */`
${PIGMENT_GLSL}
varying vec3 vK, vB;
#include <fog_pars_fragment>
void main(){
  vec4 g = texture2D(uGrain, vB.xz * 0.55 + vB.y * 0.3);
  vec3 col = uChar * 1.15;
  if (vK.x > 0.5) {   // the eagle owl: mottled ochre, soft charcoal bars across the broad wings, a pale face with two dark eyes, ear tufts
    float wing = smoothstep(0.2, 0.3, vK.y);
    float bar = smoothstep(0.42, 0.62, abs(fract(vK.y * 3.2 + g.b * 0.35 + vB.z * 0.6) - 0.5) * 2.0);
    col = mix(uOchre * (0.55 + 0.4 * g.r), uShade, (0.25 + 0.5 * bar * wing) * (0.6 + 0.5 * g.g));
    col = mix(col, uChar * 1.4, smoothstep(0.82, 0.98, vK.y) * 0.8 + smoothstep(-0.22, -0.36, vB.z) * wing * 0.5);
    float face = (1.0 - wing) * smoothstep(0.3, 0.38, vB.z);
    col = mix(col, uRock * 0.9, face * 0.8);
    vec2 e = vec2(abs(vB.x) - 0.065, vB.y - 0.075);
    col = mix(col, uChar, face * (1.0 - smoothstep(0.03, 0.045, length(e))));
    col = mix(col, uChar * 1.2, smoothstep(0.2, 0.24, vB.y) * (1.0 - wing));
  }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// the river: shallows, drawn in signs. We look down through it at the bed all the way across (wet clay, ochre silt, cobbles
// as a charcoal crescent with a pale stone laid over it, wavering a little with the ripples), a thin wash of shade where it
// deepens mid-stream. The water itself is only marks: long charcoal flow lines that run with the current, a few pale ones
// beside them; short white splash dashes thrown out round the feet of each horse and two wake chevrons trailing behind
// it; the rock of the arch mirrored as a dark wash and the light of the gate as a column of short ochre dabs laid across
// the stream, no wider than the gate looks. No white anywhere else.   aRock = (s, q, -, -)
const RIVER_FRAG = /* glsl */`
${FRAG_HEAD}
uniform vec4 uEmit[8];
uniform vec2 uFwd;
uniform vec4 uGate;          // the portal (x, z) and the heading through it (x, z)
uniform vec3 uGateCol;
// one long brush stroke per cell, laid along x (the current), thinning toward its ends
float rwFlow(vec2 p, vec2 cell, float keep, float wy, out float kind){
  float row = floor(p.y / cell.y);
  float x = p.x / cell.x + rwHash(vec2(row, 5.0)) * 7.0;
  float id = floor(x), fx = (fract(x) - 0.5) * cell.x, fy = (fract(p.y / cell.y) - 0.5) * cell.y;
  float hd = rwHash(vec2(id, row * 1.7 + 3.0));
  kind = fract(hd * 3.3);
  float len = cell.x * (0.17 + 0.25 * fract(hd * 5.3));
  float yy = fy - (fract(hd * 13.7) - 0.5) * cell.y * 0.5 - 0.05 * sin(fx * 1.9 + hd * 6.0);
  float d = length(vec2(max(abs(fx) - len, 0.0), yy));
  float w = wy * (1.0 - 0.55 * smoothstep(len * 0.4, len, abs(fx)));
  return (1.0 - smoothstep(w, w * 2.2, d)) * step(keep, hd);
}
void main(){
  vec4 gr = rwGrain2(vW.xz);
  float h = gr.r, s = vRock.x, q = vRock.y, aq = abs(q), ym = q * 13.5;
  float sp = uTime * 3.2 * (1.0 - 0.45 * q * q);
  float fwy = max(fwidth(ym), 1e-4);
  vec4 fg2 = texture2D(uGrain, vec2((s + sp * 1.4) * 0.11, q * 1.3) + 0.4);
  vec2 bp = vW.xz + (fg2.rg - 0.5) * 0.14;
  vec4 bedN = texture2D(uGrain, bp * 0.023);
  vec4 bedM = texture2D(uGrain, bp * 0.0063 + 0.37);
  vec2 gp = vW.xz - uGate.xy;
  float ga = -dot(gp, uGate.zw), gxs = gp.x * uGate.w - gp.y * uGate.z, gx = abs(gxs);
  float rip = texture2D(uGrain, vec2(gx * 0.05, (ga + uTime * 1.6) * 0.21) + 0.33).b;
  float gcell = (ga - uTime * 0.7) / 1.5, fwg = max(fwidth(gcell), 1e-4);
  float dist = distance(vW, cameraPosition);
  float near1 = 1.0 - smoothstep(34.0, 90.0, dist), mid1 = 1.0 - smoothstep(70.0, 190.0, dist);
  float k1, k2, k3, k4, k6, k7;
  float cb = rwDash(bp + 5.7, 1.05, 0.03, 0.17, 0.3, 0.0, k1), ct = rwDash(bp + 5.7 + uSun.xz * 0.07, 1.05, 0.03, 0.13, 0.3, 0.0, k2);
  float cb2 = rwDash(bp * 0.42 + 2.3, 1.05, 0.03, 0.2, 0.52, 0.0, k4), ct2 = rwDash(bp * 0.42 + 2.3 + uSun.xz * 0.035, 1.05, 0.03, 0.155, 0.52, 0.0, k4);
  float pb = rwDash(bp + 3.1, 0.46, 0.05, 0.085, 0.3, 0.0, k3);
  float f1 = rwFlow(vec2(s + sp, ym), vec2(7.0, 0.56), 0.46, max(0.022, fwy * 0.8), k6) * (1.0 - smoothstep(45.0, 110.0, dist));
  float f2 = rwFlow(vec2(s + sp * 1.2 + 31.0, ym + 3.7), vec2(17.0, 1.5), 0.4, max(0.04, fwy * 0.8), k7) * (1.0 - smoothstep(170.0, 420.0, dist));
  float depth = 1.0 - smoothstep(0.3, 1.0, aq);
  vec3 rock = rwRock(h, gr.g), ink = mix(uChar * 1.6, uShade * 1.3, uEngr);
  // the bed
  vec3 bed = mix(rock * 0.95, uShade, 0.2);
  bed = mix(bed, uOchre * 0.62, 0.18 + 0.4 * smoothstep(0.4, 0.75, bedN.g));
  bed = mix(bed, uShade, rwDab((bedM.b - 0.42) * 1.7, h, 0.25) * 0.34);
  bed = mix(bed, ink, rwDab(max(max(cb * 0.9, cb2 * 0.9 * mid1), pb * 0.6 * step(k3, 0.45)) * max(near1, cb2 * mid1), h, 0.14) * 0.72);
  bed = mix(bed, rock * 1.06, max(ct * near1, ct2 * mid1) * 0.88);
  vec3 col = mix(bed, mix(bed, uShade, 0.55), depth * (0.22 + 0.2 * bedM.g));
  col = mix(col, uShade, smoothstep(0.55, 1.0, aq) * 0.3);
  // mirrored: a dark wash under the rock of the arch, and the light of the gate as short ochre dabs laid across the stream
  float archR = (1.0 - smoothstep(4.0, 30.0 + 10.0 * rip, ga)) * smoothstep(-6.0, 2.0, ga) * (1.0 - smoothstep(26.0, 34.0, gx)) * smoothstep(7.5, 10.0, gx + 3.0 * (rip - 0.5));
  col = mix(col, mix(uShade, uOchre * 0.5, 0.35) * 0.9, archR * 0.5);
  float gid = floor(gcell), gf = abs(fract(gcell) - 0.5), gh = rwHash(vec2(gid, 3.7));
  float hw = (0.3 + 0.7 * gh) * clamp(dist * 0.1, 0.22, 2.0);
  float gdx = abs(gxs - (fract(gh * 7.1) - 0.5) * hw * 0.9);
  float thick = max(0.13, fwg * 0.9);
  float dab = (1.0 - smoothstep(hw * 0.6, hw, gdx)) * (1.0 - smoothstep(thick, thick * 1.6, gf)) * step(0.22, gh);
  float gfar = smoothstep(0.3, 0.7, fwg);                       // far down the stream the dabs close up into one thin broken line
  dab = mix(dab, (1.0 - smoothstep(0.5, 1.1, gx)) * smoothstep(0.35, 0.6, rip), gfar);
  dab *= smoothstep(0.0, 5.0, ga) * (1.0 - smoothstep(70.0, 150.0, ga));
  col = mix(col, uGateCol * mix(1.0, 0.5, uEngr), rwDab(dab * 0.95, h, 0.2) * 0.85);
  // flow lines: charcoal, a few pale
  float fl = max(f1, f2), fk = f1 > f2 ? k6 : k7;
  col = mix(col, mix(uChar * 1.6, uPale * 0.9, step(0.8, fk)), rwDab(fl * 0.92, h, 0.16) * mix(0.7, 0.45, uEngr));
  // splash dashes round the feet, two wake chevrons behind
  float wake = 0.0, tk = floor(uTime * 6.0);
  for (int i = 0; i < 8; i++) {
    vec2 rel = vW.xz - uEmit[i].xz;
    float a = dot(rel, uFwd), ab = abs(rel.x * uFwd.y - rel.y * uFwd.x), r = length(rel);
    float own = i == 0 ? 0.36 : 1.0;                             // our own wake is short: it must not ring the mount
    float v1 = abs(ab + a * 0.6), v2 = abs(ab + (a + 2.4 * own) * 0.6);
    float w = (1.0 - smoothstep(0.035, 0.09, v1)) * smoothstep(-3.3 * own, -2.5 * own, a) * (1.0 - step(-0.3, a));
    w += (1.0 - smoothstep(0.03, 0.08, v2)) * smoothstep(-5.4 * own, -4.4 * own, a) * (1.0 - step(-2.4 * own - 0.35, a));
    float sc = atan(rel.y, rel.x + step(r, 1e-4) * 1e-3) * 1.5915 + float(i) * 0.37 + tk * 0.21;
    float sd = rwHash(vec2(floor(sc), float(i) * 3.0 + tk));
    float dsh = (1.0 - smoothstep(0.1, 0.2, abs(fract(sc) - 0.5))) * step(0.35, sd) * smoothstep(0.28, 0.4, r) * (1.0 - smoothstep(0.5 + 0.45 * sd, 0.6 + 0.5 * sd, r));
    wake = max(wake, max(clamp(w, 0.0, 1.0), dsh) * uEmit[i].w);
  }
  col = mix(col, uPale * 0.98, rwDab(wake * 0.95, h, 0.15) * 0.92);
  float tw = smoothstep(0.955, 1.0, fg2.a) * smoothstep(0.5, 0.8, bedN.b) * depth;
  col += uPale * tw * 1.5;
  col *= 1.0 + rwRake(h, rwGrain2(vW.xz + uSun.xz * 0.022).r) * 0.5;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// our mount (ears, forelock, stiff mane, neck) and the pine torch.  aRock = (charcoal, ochre, kind, param)
// kind 0 horse, 1 brand, 2 flame card, 3 smoke dab
const MOUNT_VERT = /* glsl */`
uniform float uTime, uFlame;
attribute vec4 aRock;
varying vec3 vW, vL, vN;
varying vec4 vRock;
varying vec2 vQ;
#include <fog_pars_vertex>
void main(){
  vec3 lp = position; vQ = uv; vRock = aRock;
  if (aRock.z > 2.5) {       // smoke: dabs that rise and stream back over the left shoulder
    float age = fract(uTime * 0.55 + aRock.w);
    lp += vec3(sin(aRock.w * 40.0 + age * 5.0) * 0.12 * age - 0.25 * age, 0.25 + 1.5 * age, 2.6 * age * age + 0.3 * age);
    lp.xy += (uv - 0.5) * (0.12 + 0.5 * age) * uFlame;
    vRock.w = age;
  } else if (aRock.z > 1.5) { lp.xy += (uv - vec2(0.5, 0.0)) * vec2(0.26, 0.5) * uFlame; }
  vL = position;
  vec4 wp = modelMatrix * vec4(lp, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal + vec3(0.0, 1e-5, 0.0));
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const MOUNT_FRAG = /* glsl */`
${PIGMENT_GLSL}
uniform float uCaveK, uFlame;
uniform vec3 uInk;
varying vec3 vW, vL, vN;
varying vec4 vRock;
varying vec2 vQ;
#include <fog_pars_fragment>
void main(){
  vec4 gr = rwGrain2(vL.xz * 1.3 + vL.y * 0.7);
  float n1 = texture2D(uGrain, vec2(vQ.x * 0.22 + 0.3, vQ.y * 0.17 - uTime * 0.5)).b;
  float n2 = texture2D(uGrain, vec2(vQ.x * 0.45, vQ.y * 0.38 - uTime * 1.05)).r;
  vec4 sm = texture2D(uGrain, (vQ - 0.5) * 0.12 + vRock.w * vec2(3.1, 7.7));
  float h = gr.r, kind = vRock.z;
  vec3 col;
  if (kind > 2.5) {
    vec2 q = (vQ - 0.5) * 2.0;
    float v = (1.0 - length(q)) * (1.0 - vRock.w) * smoothstep(0.0, 0.08, vRock.w);
    if (sm.a * 0.55 + sm.b * 0.45 < 0.95 - 0.8 * v) discard;
    col = uInk * (1.8 + 1.4 * sm.r);
    col = rwCave(col, vW, uCaveK * 0.7);
  } else if (kind > 1.5) {
    float wv = 1.0 - vQ.y;
    float shape = wv * (1.0 - smoothstep(0.0, 0.42 * wv + 0.07, abs(vQ.x - 0.5 + (n1 - 0.5) * 0.5 * vQ.y)));
    float v = shape * 1.5 + (n2 - 0.5) * 0.65;
    if (v < 0.4) discard;
    col = mix(vec3(1.05, 0.15, 0.05), vec3(3.0, 1.45, 0.22), smoothstep(0.4, 0.85, v));
    col = mix(col, vec3(4.0, 2.9, 1.2), smoothstep(0.95, 1.35, v)) * max(uTorch.w, 0.6);
  } else {
    vec3 n = normalize(vN + vec3(0.0, 1e-4, 0.0));
    col = rwRock(h, gr.g);
    col = mix(col, uOchre * (0.6 + 0.3 * h), rwDab(vRock.y, h, 0.14) * 0.9);
    col = mix(col, uInk * (1.0 + 0.5 * smoothstep(0.2, 0.9, n.y)), rwDab(vRock.x, h, 0.12) * 0.96);
    float rim = 1.0 - abs(dot(n, normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0))));
    col = mix(col, uChar, smoothstep(0.84, 0.96, rim + (gr.b - 0.5) * 0.12) * uEngr * 0.85);
    col = rwCave(col, vW, uCaveK);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
const quadGeo = () => new THREE.PlaneGeometry(2, 2);
function instGeo(base, n, attrs, dynamic) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (const k in attrs) { const a = new THREE.InstancedBufferAttribute(attrs[k], 4); if (dynamic) a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(k, a); }
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}
// smooth interpolation through [key, value] pairs (keys descending or ascending)
const curve1 = (c) => (v) => {
  const asc = c[0][0] < c[c.length - 1][0];
  for (let i = 0; i < c.length - 1; i++) {
    const a = c[i], b = c[i + 1];
    if (asc ? v <= b[0] : v >= b[0]) return lerp(a[1], b[1], ss(a[0], b[0], v));
  }
  return c[c.length - 1][1];
};

export default {
  id: 'running-wall',
  name: 'The Running Wall',
  category: 'prehistoric',
  weirdness: 0.45,
  media: ['air'],
  async build(ctx) {
    const { rng, noise } = ctx;
    const xr = makeRng(hashSeed('running-wall-more:' + ctx.seed));   // for what later rounds added: it moves none of the first draws
    const xq = makeRng(hashSeed('running-wall-third:' + ctx.seed));  // and for what the third round added
    const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const scene = new THREE.Scene();

    // ---- the seeded look -----------------------------------------------------------------------------
    const vr = rng.fork('look');
    const hk = vr(), wk = vr(), ck = vr(), lk = vr();
    const hour = vary.hour === 'night' ? 'night' : (vary.hour === 'golden' || vary.hour === 'dawn') ? 'golden' : vary.hour === 'day' ? 'morning'
      : hk < 0.45 ? 'morning' : hk < 0.8 ? 'golden' : 'night';
    const weather = wk < 0.25 ? "snow" : wk < 0.5 ? "clear" : wk < 0.75 ? (hour === "night" ? "snow" : "loess") : "clear";
    const escort = ck < 0.6 ? 0 : ck < 0.8 ? 1 : 2, twoLions = lk < 0.4;
    const dens = clamp(((vary.density ?? 1) - 0.7) / 0.6, 0, 1);
    const nHorses = Math.round(lerp(30, 48, dens)), nBison = Math.round(lerp(20, 40, dens));
    const rare = !!vary.rare;
    const sunDir = (hour === 'golden' ? new THREE.Vector3(-0.62, 0.3, 0.72) : hour === 'night' ? new THREE.Vector3(-0.8, 0.5, 0.33) : new THREE.Vector3(-0.646, 0.616, 0.45)).normalize();

    // ---- the path --------------------------------------------------------------------------------------
    const E = new THREE.Vector3(0.3827, 0, -0.9239), R = new THREE.Vector3(0.9239, 0, 0.3827);   // final heading and its right
    const PE = new THREE.Vector3(50, -23.5, -735);
    const swerve = rng.range(7, 9);
    // the cave sits 14 m above the terrace: from the mouth the whole valley lies below us and the scree drops away under the hooves
    const path = makePath([[0, CAVE_Y, 0], [0, CAVE_Y, -44], [0, CAVE_Y, -84], [0, CAVE_Y - 0.1, -96], [0, 6.9, -107], [0, 3.6, -122], [0, -0.4, -138], [0, -3.6, -153], [0, -5.3, -167], [0, -5.7, -182],
      [0, -5.7, -230], [0.5, -5.7, -290], [-swerve * 0.5, -5.7, -322], [-swerve, -5.7, -350], [-swerve * 0.72, -5.7, -380], [0, -5.7, -420], [2, -5.7, -455], [2.5, -5.9, -482],
      [3.5, -10.5, -520], [5, -16.5, -565], [7.5, -21.8, -605], [11, -23.4, -632], [20.2, -23.5, -662.9], [34.7, -23.5, -698], [PE.x, PE.y, PE.z]], { samples: 480 });
    const L = path.length, MOUTH_U = 96.2 / L, dM = MOUTH_U * L;
    const GH = 6, MH = 9.5, FLARE = 40, FIN = 33, FINH = 6.8;   // gallery and mouth half widths (the hero's wall lines); the painted fin runs FIN metres beyond the mouth
    // path position by z (the path never turns back)
    const NZ = 740, PX = new Float32Array(NZ + 1), PY = new Float32Array(NZ + 1), PD = new Float32Array(NZ + 1);
    await ctx.yield();
    {
      const p = new THREE.Vector3(); let pz = 0, px = 0, py = CAVE_Y, pd = 0, zi = 0;
      for (let i = 0; i <= 3000; i++) {
        const d = (i / 3000) * L; path.posAtDist(d, p);
        while (zi <= NZ && -p.z >= zi) { const f = pz === -p.z ? 0 : (zi - pz) / (-p.z - pz); PX[zi] = lerp(px, p.x, f); PY[zi] = lerp(py, p.y, f); PD[zi] = lerp(pd, d, f); zi++; }
        pz = -p.z; px = p.x; py = p.y; pd = d;
      }
      for (; zi <= NZ; zi++) { PX[zi] = PE.x + (-zi - PE.z) * (E.x / E.z); PY[zi] = PE.y; PD[zi] = L + (zi + PE.z) / -E.z; }
    }
    const pxAt = (z) => { if (z >= 0) return 0; if (z <= -NZ) return PE.x + (z - PE.z) * (E.x / E.z); const f = -z, i = Math.floor(f); return lerp(PX[i], PX[i + 1], f - i); };
    const pyAt = (z) => { if (z >= 0) return CAVE_Y; if (z <= -NZ) return PE.y; const f = -z, i = Math.floor(f); return lerp(PY[i], PY[i + 1], f - i); };
    const pdAt = (z) => { if (z >= 0) return -z; if (z <= -NZ) return L + (-z - 735) / 0.9239; const f = -z, i = Math.floor(f); return lerp(PD[i], PD[i + 1], f - i); };

    await ctx.yield();
    // where the rhinos spar: 8 m right of the path at u 0.472, their axis square to the sight line from the eye at u 0.46
    const RC = new THREE.Vector3(); let RAX = 1, RAZ = 0;
    {
      const p = path.posAtDist(0.472 * L, new THREE.Vector3()), t = path.tangentAtDist(0.472 * L, new THREE.Vector3()), l = Math.hypot(t.x, t.z) || 1;
      RC.set(p.x - (t.z / l) * 8.0, 0, p.z + (t.x / l) * 8.0);
      const c = path.posAtDist(0.46 * L, new THREE.Vector3()), sx = RC.x - c.x, sz = RC.z - c.z, sl = Math.hypot(sx, sz) || 1;
      RAX = -sz / sl; RAZ = sx / sl;
    }

    // ---- the land ----------------------------------------------------------------------------------------
    const rivC = curve1([[300, -178], [-380, -178], [-480, -150], [-560, -95], [-620, -42], [-664, 2]]);
    const riverX = (z) => lerp(rivC(z), pxAt(z), ss(-640, -692, z));
    const riverDist = (x, z) => { const sl = (riverX(z - 3) - riverX(z + 3)) / 6; return Math.abs(x - riverX(z)) / Math.sqrt(1 + sl * sl); };
    const benchX = curve1([[100, 30], [-290, 30], [-390, 18.5], [-520, 19], [-600, 62], [-700, 120], [-900, 200]]);
    // the left wall stands far off across the plain, but below the ramp it throws a prow out toward the river: a headland whose
    // up-valley flank faces us as we come down, and carries the second painted panel (two more giants, see prowHerd)
    const prowAt = (z) => { const f = clamp((-560 - z) / 70, 0, 1), g = clamp((z + 704) / 74, 0, 1); return z > -630 ? 0.55 * f + 0.45 * f * f * (3 - 2 * f) : Math.pow(g, 1.25); };   // a pointed nose at z -630
    const gullyP = (z) => ss(0.5, 0.8, noise.n2(z * 0.085, 12.3));
    const cliffL = (z) => -255 + 34 * noise.n2(z * 0.006, 1.7) + 12 * noise.n2(z * 0.03, 5.1) - ss(-640, -900, z) * 120 + 154 * prowAt(z) + 7 * noise.n2(z * 0.06, 4.4) * ss(0, 0.3, prowAt(z)) * (1 - ss(0.8, 1, prowAt(z)));
    const lineL = (z) => { const i = (70 - z) / 5, i0 = Math.floor(i); return lerp(cliffL(70 - 5 * i0), cliffL(65 - 5 * i0), i - i0); };   // the wall as it is built: straight between its 5 m columns
    const dipL = (z) => 0.012 * (z + 400) + 1.6 * noise.n2(z * 0.009, 8.8);
    const PANEL_L = [20, 46], panelL = (z) => ss(-570, -578, z) * (1 - ss(-605, -611, z));
    // the gorge walls are built rock (see "the gorge walls"), not heightfield. The right-hand one stands close, 88 m off the
    // path from the foot of the scree to z -440, sunlit, with one massive smooth bed (y 13 to 38) that carries the wall herd;
    // there it turns the corner into the side valley the ice closes. The left-hand one stands across the river, in its own shade.
    // From z -282 the wall steps in to 52 m and towers to 95 m: the Great Panel. Its flank faces us as we come down the terrace
    // (u 0.2-0.36), its long face is passed close on the right (u 0.4-0.6), and both carry animals 20 m tall (see the wall herd).
    const GPX = 36, gpIn = (z) => ss(-282, -332, z), gpB = (z) => ss(-268, -296, z) * (1 - ss(-444, -458, z));
    const wallR = (z) => { const c = Math.max(0, -438 - z); return 34 + 54 * ss(-100, -195, z) + 5 * noise.n2(z * 0.008, 9.1) * ss(-150, -230, z) * (1 - 0.75 * gpIn(z)) - GPX * gpIn(z) + 1.5 * c * c / (c + 30); };
    const gullyAt = (z, k) => ss(0.5, 0.78, noise.n2(z * 0.021 + k * 3.7, 3.1 + k));                       // clefts that run down the face and notch the skyline
    const panelAt = (z) => ss(-152, -172, z) * (1 - ss(-448, -462, z));
    const P0 = (z) => lerp(13, 4, gpB(z)), P1 = (z) => lerp(38, 50, gpB(z));   // the painted bed: its foot and its top
    const topR = (z) => Math.max(lerp(40, 57, ss(-110, -200, z)) + 8 * noise.fbm2(z * 0.011, 2.2, 3) + 7 * (1 - Math.abs(noise.n2(z * 0.026, 6.6))) ** 2 - 3 + 8 * bell(z, -470, -425, 0.4) - 11 * gullyAt(z, 0) * (1 - bell(z, -480, -420, 0.3)) + 36 * ss(-262, -318, z) * (1 - ss(-452, -515, z)), (P1(z) + 3.5) * panelAt(z));
    const topL = (z) => { const pk = prowAt(z);
      const far = 104 + 30 * noise.n2(z * 0.004, 0.4) + 16 * noise.fbm2(z * 0.012, 5.5, 3) + 12 * (1 - Math.abs(noise.n2(z * 0.019, 1.6))) ** 2 - 5 - 20 * gullyAt(z, 1);
      // the prow: a humped crown that runs down to the plain at the nose as a ridge, so the beds end against a slope, not a cut
      const crag = lerp(67 + 11 * noise.fbm2(z * 0.05, 5.5, 3) + 8 * (1 - Math.abs(noise.n2(z * 0.04, 1.6))) ** 2 - 6 * gullyP(z), -6, bell(z, -662, -609, 0.45));
      return Math.max(lerp(far, crag, ss(0, 0.45, pk)), (PANEL_L[1] + 9) * panelL(z)); };
    const ICE = { x: 900, z: -1450, nx: -0.587, nz: 0.809, half: 800, h: 215 };
    const iceAt = (x, z) => {
      const dx = x - ICE.x, dz = z - ICE.z, across = dx * ICE.nz - dz * ICE.nx, into = -(dx * ICE.nx + dz * ICE.nz);
      return ss(-10, 55, into + 30 * noise.n2(across * 0.004, 3.3)) * (1 - ss(ICE.half - 160, ICE.half + 60, Math.abs(across)));
    };
    const spurH = (rag, aq) => (30 + 9 * rag + ss(60, 220, aq) * 30) * ss(26, 44, aq);   // the rock spur the arch pierces: its height above the bar
    const bluffS = (aq) => lerp(-2.6, -15, ss(30, 54, aq)) - 8 * ss(90, 170, aq);          // where the built face of its two bluffs stands (metres along the exit heading from the gate)
    const heightRaw = (x, z) => {
      const px = pxAt(z), lat = x - px, al = Math.abs(lat);
      const f = pyAt(z < -470 ? Math.min(z + Math.max(0, lat - 12) * 1.3, -470) : z) - EYE;
      const und = noise.fbm2(x * 0.012, z * 0.012, 3) * 2.4 * ss(8, 70, al) + noise.n2(x * 0.07, z * 0.07) * 0.22 * ss(3, 12, al);
      const xb = benchX(z) + 2.2 * noise.n2(z * 0.03, 3.3) + 0.7 * noise.n2(z * 0.11, 8.3);
      let h = f + und + 3.0 * ss(xb, xb + 4.5, x) + Math.max(0, x - xb - 4.5) * 0.045;
      // valley sides: talus, then the cliff up to a plateau
      const cl = cliffL(z), cr = wallR(z), rag = noise.fbm2(x * 0.02, z * 0.02, 3);
      const gI = gpIn(z) * (1 - ss(-440, -470, z));   // under the Great Panel the talus is short and low
      const pk = prowAt(z), tl = ss(cl + lerp(115, 42, pk), cl, x), tr = ss(cr - lerp(44, 24, gI), cr + 2, x);
      h += tl * tl * lerp(24, 15, pk) + tr * tr * lerp(9, 5, gI);
      // behind each wall the plateau, a little under its crown (never seen from the valley)
      if (x < cl - 5) h = lerp(h, topL(z) - 16, ss(cl - 5, cl - 34, x)); else if (x > cr + 5) h = lerp(h, topR(z) - 15, ss(cr + 5, cr + 32, x));
      // the river trench and its gravel bar
      const rd = riverDist(x, z);
      h = lerp(BAR + 0.5 * noise.n2(x * 0.05, z * 0.05) * ss(13, 20, rd), h, ss(20, 58, rd));
      // the rock spur the arch pierces
      const s = (x - PE.x) * E.x + (z - PE.z) * E.z, q = (x - PE.x) * R.x + (z - PE.z) * R.z, aq = Math.abs(q);
      // (its up-valley side is cut off short: the two bluffs that flank the arch are built rock and stand in front of it)
      const gent = 40 + ss(60, 200, aq) * 60, face = ss(250, 330, aq), fs = bluffS(aq), e0 = Math.max(4 - (fs + 15), 0.5), e1 = Math.max(4 - (fs + 10.5), e0 + 2);
      const spur = spurH(rag, aq) * (1 - (s < 4 ? ss(lerp(e0, 9, face), lerp(e1, gent, face), 4 - s) : ss(9, gent, s - 4)));
      const led = spur < 4.5 ? spur : 4.5 + (Math.floor((spur - 4.5) / 5.6) + ss(0.5, 0.92, (spur - 4.5) / 5.6 - Math.floor((spur - 4.5) / 5.6)) + 0.1 * ((spur - 4.5) / 5.6 % 1)) * 5.6;
      h = Math.max(h, BAR + led + 0.5 * noise.n2(x * 0.11, z * 0.11) * ss(2, 8, spur));
      // far country: a closing plateau to the west, ice in the side valley
      const far = ss(-1180, -1420, z + x * 0.25) * (1 - ss(250, 520, x - (z + 1200) * -0.3)) * lerp(0.16, 1, ss(170, 340, Math.abs(x + 10)));   // the valley runs on west through a gap, and the painted sun stands in it
      h += far * Math.max(0, 170 + 60 * noise.n2(x * 0.003, z * 0.003) + 20 * rag - h);
      h += ss(600, 1500, x) * 40;
      const ice = iceAt(x, z);
      h += ice * Math.max(0, ICE.h + 26 * noise.n2(x * 0.006, z * 0.006) - h);
      // exact ground under the hooves along the path, then the river bed
      h = lerp(pyAt(z) - EYE, h, ss(3, 14, al)) - 0.5 * ss(-97, -95.5, z);
      h -= 0.62 * (1 - ss(6.5, 12.5, rd));
      return h;
    };
    const grassRaw = (x, z, h, rd) => {
      const scree = ss(-150, -180, z) * (1 - 0.72 * ss(-476, -520, z + Math.max(0, x - pxAt(z) - 12) * 1.3));
      return clamp(scree * ss(20, 44, rd) * (1 - ss(60, 140, h + 8)), 0, 1) * (0.55 + 0.45 * ss(-0.5, 0.3, noise.n2(x * 0.02, z * 0.02))) * ss(5.2, 8.6, Math.hypot(x - RC.x, z - RC.z));
    };
    // round the sparring rhinos the grass is grazed and trodden short (under knee height out to 13 m), so their legs stay clear
    const rcShort = (x, z) => lerp(0.4, 1, ss(8.5, 13.5, Math.hypot(x - RC.x, z - RC.z)));
    await ctx.yield();

    // a world-aligned grid, fine round the path and coarse far away; heights are cached for everything that stands on it
    const xs = [], zs = [];
    { let x = -46; for (; x <= 72; x += 2) xs.push(x);
      let st = 2; while (x < 560) { st = Math.min(st * 1.22, x < 150 ? 9 : 17); xs.push(x); x += st; }
      while (x < 2300) { st *= 1.4; xs.push(x); x += st; }
      x = -48; st = 2; const neg = [];
      while (x > -500) { neg.push(x); st = Math.min(st * 1.22, x > -110 ? 9 : 17); x -= st; }
      while (x > -1500) { neg.push(x); st *= 1.4; x -= st; }
      xs.unshift(...neg.reverse());
      let z = -94; st = 3.2;
      while (z > -800) { zs.push(z); z -= st; }
      while (z > -2700) { zs.push(z); st *= 1.22; z -= st; }
    }
    const NX = xs.length, NR = zs.length, HG = new Float32Array(NX * NR);
    const tPos = new Float32Array(NX * NR * 3), tRock = new Float32Array(NX * NR * 4), tTrail = new Float32Array(NX * NR);
    for (let j = 0, k = 0; j < NR; j++) {
      for (let i = 0; i < NX; i++, k++) {
        const x = xs[i], z = zs[j], h = heightRaw(x, z), rd = riverDist(x, z);
        HG[k] = h; tPos[k * 3] = x; tPos[k * 3 + 1] = h; tPos[k * 3 + 2] = z;
        const ice = iceAt(x, z), g = grassRaw(x, z, h, rd);
        const gravel = Math.max(1 - ss(16, 40, rd), ss(-198, -170, z) * (1 - ss(40, 90, Math.abs(x - pxAt(z)))), ss(-480, -530, z) * (1 - ss(30, 70, Math.abs(x - pxAt(z))))) * (1 - g);
        tTrail[k] = (1 - ss(2.2, 9.5, Math.abs(x - pxAt(z)))) * ss(-98, -106, z) * ss(9, 13, rd);
        tRock[k * 4] = g; tRock[k * 4 + 1] = ice; tRock[k * 4 + 2] = clamp(gravel, 0, 1); tRock[k * 4 + 3] = (1 - ss(10.5, 15, rd));
      }
      if (j % 3 === 2) await ctx.yield();   // three rows of the grid a step
    }
    const findI = (arr, v, asc) => { let lo = 0, hi = arr.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (asc ? arr[m] <= v : arr[m] >= v) lo = m; else hi = m; } return lo; };
    const groundAt = (x, z) => {
      const i = findI(xs, clamp(x, xs[0], xs[NX - 1]), true), j = findI(zs, clamp(z, zs[NR - 1], zs[0]), false);
      const fx = clamp((x - xs[i]) / (xs[i + 1] - xs[i]), 0, 1), fz = clamp((z - zs[j]) / (zs[j + 1] - zs[j]), 0, 1);
      const a = j * NX + i, b = a + NX;
      return lerp(lerp(HG[a], HG[a + 1], fx), lerp(HG[b], HG[b + 1], fx), fz);
    };
    const dustAt = (x, z) => ss(11, 15, riverDist(x, z));
    await ctx.yield();
    {
      const idx = new Uint32Array((NX - 1) * (NR - 1) * 6);
      for (let j = 0, o = 0; j < NR - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1; idx[o++] = a; idx[o++] = b; idx[o++] = c; idx[o++] = b; idx[o++] = d; idx[o++] = c; }
      await ctx.yield();
      var terrainGeo = new THREE.BufferGeometry();
      terrainGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3)); terrainGeo.setAttribute('aRock', new THREE.BufferAttribute(tRock, 4)); terrainGeo.setAttribute('aTrail', new THREE.BufferAttribute(tTrail, 1));
      terrainGeo.setIndex(new THREE.BufferAttribute(idx, 1)); await ctx.yield();
      // vertex normals by hand (what computeVertexNormals does), a slice of the grid at a time so no step is long
      const nrm = new Float32Array(tPos.length);
      for (let t = 0; t < idx.length; t += 3) {
        const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
        const ux = tPos[c] - tPos[b], uy = tPos[c + 1] - tPos[b + 1], uz = tPos[c + 2] - tPos[b + 2], vx = tPos[a] - tPos[b], vy = tPos[a + 1] - tPos[b + 1], vz = tPos[a + 2] - tPos[b + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        nrm[a] += nx; nrm[a + 1] += ny; nrm[a + 2] += nz; nrm[b] += nx; nrm[b + 1] += ny; nrm[b + 2] += nz; nrm[c] += nx; nrm[c + 1] += ny; nrm[c + 2] += nz;
        if (t % 36000 === 35997) await ctx.yield();
      }
      await ctx.yield();
      for (let v = 0; v < nrm.length; v += 3) { const l = Math.hypot(nrm[v], nrm[v + 1], nrm[v + 2]) || 1; nrm[v] /= l; nrm[v + 1] /= l; nrm[v + 2] /= l; }
      terrainGeo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    }
    await ctx.yield();

    // the path by distance, as tables (the hero and every actor sample it tens of thousands of times)
    const ND = Math.ceil(L) + 1, DX = new Float32Array(ND + 1), DY = new Float32Array(ND + 1), DZ = new Float32Array(ND + 1);
    { const p = new THREE.Vector3(); for (let i = 0; i <= ND; i++) { path.posAtDist(Math.min(i, L), p); DX[i] = p.x; DY[i] = p.y; DZ[i] = p.z; } }
    const T0 = path.startTangent, T1 = path.endTangent;
    const fastPos = (d, out = new THREE.Vector3()) => {
      if (d <= 0) return out.copy(path.start).addScaledVector(T0, d);
      if (d >= L - 1) return path.posAtDist(d, out);
      const i = Math.floor(d), f = d - i;
      return out.set(lerp(DX[i], DX[i + 1], f), lerp(DY[i], DY[i + 1], f), lerp(DZ[i], DZ[i + 1], f));
    };
    const fastTan = (d, out = new THREE.Vector3()) => {
      if (d <= 0) return out.copy(T0);
      if (d >= L - 1.5) return out.copy(T1);
      const i = Math.max(Math.round(d), 1);
      return out.set(DX[i + 1] - DX[i - 1], DY[i + 1] - DY[i - 1], DZ[i + 1] - DZ[i - 1]).normalize();
    };
    const fpath = { ...path, posAtDist: fastPos, tangentAtDist: fastTan };
    const P3 = new THREE.Vector3(), T3 = new THREE.Vector3();
    const side = (d, lat, fwd = 0, out = new THREE.Vector3()) => {     // a point beside the path, on the ground
      fastPos(d, P3); fastTan(d, T3); const l = Math.hypot(T3.x, T3.z) || 1;
      out.set(P3.x - (T3.z / l) * lat + (T3.x / l) * fwd, 0, P3.z + (T3.x / l) * lat + (T3.z / l) * fwd);
      out.y = groundAt(out.x, out.z); return out;
    };

    // ---- the cast the world scripts itself (figures of the hero's kind, on tracks baked on the ground) ------
    const SP = { horse: 0, aurochs: 1, deer: 2, bison: 3, rhino: 4, mammoth: 5, lion: 6, ibex: 7 };
    const bisonS = buildBison(), rhinoS = buildRhino(), mammothS = buildMammoth(), lionS = buildLion(), ibexS = buildIbex();
    mammothS.noGhost = true; ibexS.noGhost = true; bisonS.noGhost = true;
    await ctx.yield();
    const ar = rng.fork('actors'), actors = [], tmpA = new THREE.Vector3();
    const fade = (t, a, b) => ss(0, a, t) * (1 - ss(1 - b, 1, t));
    const laneTrack = (d0, d1, latFn, a = 0.04, b = 0.04) => (t) => {
      const d = lerp(d0, d1, t); side(d, latFn(d), 0, tmpA);
      return [tmpA.x, tmpA.y, tmpA.z, 1, 0, fade(t, a, b), dustAt(tmpA.x, tmpA.z)];
    };
    const lineTrack = (ax, az, bx, bz, a = 0.04, b = 0.04, dust = 1) => (t) => {
      const x = lerp(ax, bx, t), z = lerp(az, bz, t);
      return [x, groundAt(x, z), z, 1, 0, fade(t, a, b), dust * dustAt(x, z)];
    };
    const add = (o) => { actors.push(o); return o; };
    // the giant deer: hinds first, the stag last and nearest, across our front from left to right at u 0.37
    const deer = [];
    {
      const dC = 0.395 * L + 9; fastPos(dC, P3); fastTan(dC, T3);
      const cx = P3.x, cz = P3.z, dx = -T3.z * 0.866 + T3.x * 0.5, dz = T3.x * 0.866 + T3.z * 0.5;
      const nD = 5 + Math.round(dens * 2);
      for (let i = 0; i < nD; i++) {
        const lead = i === 0 ? 0 : 9 + i * 7.5 + ar.range(-2, 2), off = i === 0 ? 0 : ar.range(-3, 3);
        const ox = cx - dz * off * 0.3 + T3.x * off, oz = cz + dx * off * 0.3 + T3.z * off;
        deer.push(add({ sp: SP.deer, sample: lineTrack(ox - dx * 70, oz - dz * 70, ox + dx * 95, oz + dz * 95, 0.06, 0.08), len: 165, lead,
          scale: i === 0 ? 1.18 : ar.range(0.82, 0.95), ochre: ar.range(0.8, 1.1), antler: i === 0 ? 1 : 0, red: i === 2 ? 1 : 0 }));
      }
    }
    // two woolly rhinos sparring horn to horn, 8 m to the right of the swerve; they stand square to the eye at u 0.46.
    // Each track runs 14 m straight through the meeting point so the head never reaches a track end.
    const rhinos = [];
    for (const sg of [-1, 1]) rhinos.push(add({ sp: SP.rhino, sample: lineTrack(RC.x + sg * RAX * 11.1, RC.z + sg * RAZ * 11.1, RC.x - sg * RAX * 2.9, RC.z - sg * RAZ * 2.9, 0.001, 0.001, 1), sg, scale: 1.32, ochre: 0.8, stride: 2.8 }));
    // aurochs on the left: black bulls we come up on and pass, the nearest four close in and ahead at u 0.36-0.45
    const aurochs = [], AUR = [[-4.0, 10, 13, 1.34], [-4.7, 14.5, 17, 1.25], [-8.6, 11, 12, 1.25], [-7.3, 19.5, 15.5, 1.2]];   // [lane, metres ahead at u 0.43, surge, scale]: big black bulls close on our left
    for (let i = 0; i < 10; i++) {
      const lat = i < 4 ? AUR[i][0] : -(12.5 + (i - 4) * 2.7 + ar.range(-0.6, 0.6)), ph = ar() * TAU;
      aurochs.push(add({ sp: SP.aurochs, sample: laneTrack(200, 650, (d) => lat + 0.5 * Math.sin(d / 23 + ph)), ahead: i < 4 ? AUR[i][1] : 7 + ((i * 7) % 10) * 3.3 + ar.range(0, 2),
        ochre: 0.6, fill: ar.range(0.78, 0.94), scale: i < 4 ? AUR[i][3] : ar.range(0.95, 1.08), surge: i < 4 ? AUR[i][2] : -1 }));
    }
    // the mammoth file along the edge of the bench, trunk to tail
    const mammoths = [];
    for (let i = 0; i < 15; i++) {
      const mr2 = i < 12 ? ar : xr, calf = i === 5 || i === 9 || i === 13, ph = mr2() * TAU;
      mammoths.push(add({ sp: SP.mammoth, sample: (t) => { const z = lerp(-330, -610, t), x = benchX(z) + 5.4 + 0.4 * Math.sin(z / 17 + ph); return [x, groundAt(x, z), z, 1, 0, fade(t, 0.05, 0.05), 0.25]; },
        k: i, scale: calf ? 0.6 : mr2.range(1.02, 1.18), ochre: mr2.range(0.8, 1.05), fill: calf ? 0.1 : mr2.range(0.15, 0.4), stride: 3.6 * (calf ? 0.6 : 1), ...(i < 12 ? {} : { gaitPh: xr(), seed: xr() }) }));
    }
    // two great bulls painted on the converging walls of the neck, running for the daylight: the frieze as the
    // portal shows it from outside, and the first thing the torch finds
    const bulls = [];
    // (not at night: scraped white at that size they would be a scribble)
    if (hour !== 'night') for (const sg of [-1, 1]) bulls.push(add({ sp: SP.aurochs, sg, t: 0.5, scale: 2.35, ochre: sg > 0 ? 0.95 : 0.3, fill: sg > 0 ? 0.03 : 0.78, stride: 6, gaitPh: 0.2 + 0.3 * sg, seed: 0.4 + 0.2 * sg,
      sample: (t) => { const d = lerp(26, 50, t); return [sg * (lerp(16, GH, ss(28, 42, d)) - 0.04), FLOOR + 1.1, -d, 0, 1, 1, 0]; } }));
    // the bison stampede: along the bench top, off it just ahead of the lead mammoth, down the ramp on our right;
    // the first five run close (7 to 13 m off the knee, 10 to 20 m ahead) so the humps read against the bare ramp
    const bison = [], BIS = [[5.2, 8.5], [8.5, 29], [6.2, 17.5], [12, 42], [13.5, -1]];   // [lane, metres ahead]: an echelon, so the lead bull stands clear of the rest
    const benchLat = (d) => { const i = clamp(Math.round(d), 0, ND); return benchX(DZ[i]) - DX[i]; };
    const benchRoom = (d) => { const i = clamp(Math.round(d), 0, ND); return clamp((wallR(DZ[i]) - benchX(DZ[i]) - 26) / 30, 0.15, 1); };   // how much of the bench top is free between the mammoths and the wall's foot
    for (let i = 0; i < nBison; i++) {
      const top = 14 + ar.range(0, 30), merge = i < 5 ? BIS[i][0] : 15 + ar.range(0, 24), out = ar.range(20, 60), ph = ar() * TAU;
      bison.push(add({ sp: SP.bison, sample: laneTrack(250, 725, (d) => lerp(benchLat(d) + 14 + (top - 14) * benchRoom(d), merge, ss(492, 536, d)) + out * ss(662, 725, d) + 0.7 * Math.sin(d / 19 + ph), 0.05, 0.05),
        ahead: i < 5 ? BIS[i][1] : 14 + ar.range(0, 44), ...bisonS.coat(ar), scale: i === 0 ? 1.28 : i < 5 ? 1.14 : ar.range(0.92, 1.1) }));
    }
    // the cave lion, low and long, bounding on the left flank
    const lions = [];
    for (let i = 0; i < (twoLions ? 2 : 1); i++) lions.push(add({ sp: SP.lion, sample: laneTrack(430, 700, (d) => -(5.6 + i * 3.6 + 9.5 * ss(604, 650, d)) + 0.3 * Math.sin(d / 15 + i)), back: i * 7, scale: 1.36 - i * 0.12, ochre: 0.55, fill: 0 }));
    // ibex stepping along the crown of the arch
    const archTop = (X) => 27 + 2.5 * noise.n2(X * 0.07, 1.3) - 5 * ss(21, 31, Math.abs(X));
    const ibex = [];
    for (let i = 0; i < 5; i++) ibex.push(add({ sp: SP.ibex, sample: (t) => { const X = lerp(-25, 25, t); return [PE.x + R.x * X + E.x * 5, WATER + archTop(X) - 0.15, PE.z + R.z * X + E.z * 5, 1, 0, fade(t, 0.08, 0.08), 0]; },
      k: i, scale: ar.range(0.9, 1.1), ochre: 0.7, fill: 0.5, stride: 1.5 }));

    // the outrunners: animals in silhouette pouring out across the daylight of the mouth, as the hall and the previous
    // world's portal see it. They cross just outside the lip (left to right from behind the jamb, right to left from the
    // foot of the fin), turn away down the scree and dissolve below the lip. Forced perspective: 2.3 times life while
    // the eye is 96 m off, life-size by the time it is near; all are gone before the pack bursts out.
    const outrun = [];
    {
      const OUT = [[SP.aurochs, 1], [SP.deer, -1], [SP.horse, 1], [SP.aurochs, -1], [SP.horse, 1], [SP.deer, 1], [SP.horse, -1]];
      for (let i = 0; i < OUT.length; i++) {
        const [sp, sg] = OUT[i], j1 = xr.range(-1, 1), j2 = xr.range(-1, 1);
        const A = sg > 0 ? [-15, 5.8 + j1] : [8.3, 6.2 + j1], B = sg > 0 ? [7 + j2, 7.2 + j1] : [-8.5 + j2, 7.4 + j1], C = sg > 0 ? [2.5 + j2, 30] : [-6 + j2, 31];
        outrun.push(add({ sp, sg, scale: 1, s0: sp === SP.horse ? 1.12 : 1, ochre: 0.3, fill: 0.9, antler: 1, red: 0, gaitPh: xr(), seed: xr(), v: xr.range(0.2, 0.25), ph: (i + xr() * 0.5) / OUT.length,
          sample: (t) => {
            const a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t, x = a * A[0] + b * B[0] + c * C[0], z = -(dM + a * A[1] + b * B[1] + c * C[1]);
            return [x, groundAt(x, z), z, 1, 0, fade(t, 0.07, 0.14), 0.6];
          } }));
      }
    }

    // stray bison on the terrace: three bulls come up from behind on our right as the rhinos fall away, the first until his
    // shoulder and horn fill the right of the frame (u 0.52), and drop back again as the pack wheels
    const x4 = makeRng(hashSeed('running-wall-fourth:' + ctx.seed));   // for what the fourth round added
    const strays = [], STRAY = [[6.5, 2.9, 1.3], [10.8, -4.0, 1.12], [14.6, -10, 1.16]];   // [lane, metres ahead at the closest, scale]
    for (let i = 0; i < 3; i++) strays.push(add({ sp: SP.bison, sample: laneTrack(366, 600, (d) => STRAY[i][0] + 0.25 * Math.sin(d / 17 + i * 2)), peak: STRAY[i][1], scale: STRAY[i][2],
      ochre: 0.8 + 0.25 * x4(), fill: 0.1 + 0.1 * x4(), red: 0, antler: 1, gaitPh: x4(), seed: x4() }));

    // the wall herd: giants painted on the massive bed of the right-hand wall. Three of 13 m stand on the far stretch; as we come
    // off the scree they run on ahead of us along the rock and are gone, nose to tail, before the corner where the wall steps in (never
    // abeam of us, where the top of the picture would cut them). Five of 15 to 20 m cover the Great Panel: a black bull and a
    // horse on its flank, which faces us down the terrace, then a rhino, a bull in red outline and a black horse along the face
    // we pass close under; each runs some 30 m along the rock while we pass, legs cycling, its feet on the foot of the painted bed.
    // [species, scale, ochre, fill, red line, z at rest, then: metres ahead of us it runs | metres it runs, from u, to u]
    const giants = [], GIANT = [[SP.horse, 7.0, 1.0, 0, 0, -184, 54], [SP.aurochs, 6.6, 0.4, 0.86, 0, -208, 78], [SP.rhino, 6.0, 0.85, 0, 1, -230, 100],
      [SP.aurochs, 9.3, 0.35, 0.86, 0, -297, 30, 0.2, 0.6], [SP.horse, 9.3, 1.0, 0, 0, -324, 30, 0.2, 0.6], [SP.rhino, 7.4, 0.85, 0, 0, -353, 30, 0.2, 0.6],
      [SP.aurochs, 8.9, 0.3, 0.04, 1, -384, 30, 0.2, 0.6], [SP.horse, 9.5, 0.3, 0.8, 0, -410, 27, 0.2, 0.6]];
    for (let i = 0; i < GIANT.length; i++) {
      const [sp, scale, ochre, fill, red, z0, run, u0, u1] = GIANT[i], zEnd = i < 3 ? -276 : -456;
      giants.push(add({ sp, k: i, z0, run, u0, u1, zEnd, scale, ochre, fill: hour === 'night' ? Math.max(fill, 0.8) : fill, red, antler: 1, stride: scale * 2.6, gaitPh: x4(), seed: x4(),
        sample: (t) => { const z = lerp(-150, zEnd, t); return [wallR(z) - 0.5 - 0.1 * i, P0(z) + 1.7 - 0.7 * gpB(z), z, 0, 0, fade(t, 0.03, 0.05) * (i < 3 ? 1 - ss(0.7, 0.82, t) : 1), 0]; } }));
    }
    // and two on the flank of the prow, which faces us down the ramp: the herd wheels under them
    const prowHerd = [], PROW = [[SP.horse, 12.5, 0.95, 0, 0, 0.72], [SP.aurochs, 12.5, 0.3, 0.86, 0, 0.28]];
    for (let i = 0; i < PROW.length; i++) {
      const [sp, scale, ochre, fill, red, t0] = PROW[i];
      prowHerd.push(add({ sp, k: i, t0, scale, ochre, fill: hour === 'night' ? Math.max(fill, 0.8) : fill, red, antler: 1, stride: 36, gaitPh: x4(), seed: x4(),
        sample: (t) => { const z = lerp(-574, -610, t); return [lineL(z) + 1.7, PANEL_L[0] + dipL(z) + 1.8, z, 0, 0, fade(t, 0.03, 0.05), 0]; } }));
    }

    // ---- the hero: the herd that leaves the wall ------------------------------------------------------
    // The pack: the stallion and five escorts peel at the mouth and hold close ahead of us down the scree (the burst);
    // every other right-hand figure stays paint along the fin and peels off its end. Lanes bulge smoothly round the
    // rhinos, tuck in under the mammoths, stand off outside the bison and the lion, then funnel through the arch.
    const PACK = [[5.2, 6.6], [2.6, 7.9], [6.6, 10.6], [2.3, 10.2], [6.2, 13.5], [3.4, 15.5]];   // [lane, metres ahead] at the burst
    const KNEE = [0, 14.5, 8.5, 0, 0, 19], KLANE = [0, 4.2, 12, 0, 0, 9];                         // the loose herd at our knee after the burst: [metres ahead], [lane]
    const SLAT = 4.2, SCLOSE = 5.3;                                                             // the stallion's closest pass: metres off the knee, metres ahead (whole in the steady camera's frame, nose to tail)
    const MID = [8.6, 13.5, 12.5, 0, 0, 17.5], MLANE = [5.2, 2.7, 8.8, 0, 0, 6.6];                // after the rhinos (u 0.47-0.60): [metres ahead], [lane]; the knee itself is left to the stray bison
    const CROWD = [0, 9.6, 8.8, 0, 0, 1.9], CLANE = [0, 2.5, 8.6, 0, 0, 6.9];                     // the crowd that closes round the stallion (u 0.29-0.37): one inside him, one beyond, one at our knee
    // the wheel (u 0.59-0.66): at the head of the ramp the stallion swings the pack across our front, right to left, and they
    // run the ramp on our left. [where each starts to turn, path metres], [lane after it, left of us], [metres ahead on the ramp]
    const WD = [455, 458, 462, 0, 0, 466], WLANE = [-4.5, -15.5, 15.5, 0, 0, -9.5], WRAMP = [36, 13, 24, 0, 0, 44];   // (the third stays on the right, outside the bison)
    const FINAL = [15, 20, 14, 11, 17, 26];                                                        // metres ahead on the run in to the arch: far enough ahead to frame it from both sides
    const LLANE = [0, 0, 0, 4.5, 6.4, 0], LRAMP = [0, 0, 0, 6.4, 9.6, 0];                         // the two left-hand pack horses close in on our left at the foot of the ramp (u 0.75-0.86)
    await ctx.yield();
    const grain = await makeGrainTexture(rng.fork('grain'), ctx);
    const hero = await buildHero(ctx, {
      path: fpath, palette: PALETTE, hour, weather, sunDir: sunDir.toArray(), grainTexture: grain, mouthU: MOUTH_U, eye: EYE,
      heightAt: groundAt, dustAt, horses: nHorses, frieze: 44, friezeScale: 1.55, escort, species: [bisonS, rhinoS, mammothS, lionS, ibexS], actors,
      cave: { galleryHalf: GH, mouthHalf: MH, flare: FLARE, finHalf: FINH, finLen: FIN }, portalClear: 7.5, stallionLat: 5.2, stallionScale: 1.27,
      sides: { 1: 1, 2: 1, 3: -1, 4: -1, 5: 1 },
      peelFn: (an) => (!an.loop && an.idx <= 5 ? -15 : an.side > 0 ? FIN : 0),   // the pack leaves the wall inside the mouth and bursts out in relief
      laneFn: (d, sd, lane, an) => {
        let l = lane;
        const pack = !an.loop && an.idx <= 5;
        if (an.idx === 0) l = lerp(5.2, SLAT, ss(168, 198, d) * (1 - ss(274, 298, d)));                       // the stallion rides at our right knee, closest at u 0.26-0.36
        else if (pack) l = lerp(PACK[an.idx][0], KLANE[an.idx] || l, ss(dM + 44, dM + 104, d));
        else if (sd > 0 && d < dM + FIN + 30) l = Math.max(l, 12);                                              // off the fin, clear of the pack
        if (pack && CLANE[an.idx]) l = lerp(l, CLANE[an.idx], ss(204, 238, d) * (1 - ss(278, 294, d)));            // the crowd round the stallion
        const k = clamp(lane, 5, 40) - 5, fun = 7.6 + k * 0.088;
        if (sd < 0) {
          l = Math.max(l, lerp(l, 13.5 + k * 0.6, ss(232, 268, d) * (1 - ss(640, 672, d))));                    // room for the aurochs, then the lion
          if (pack) l = lerp(l, LLANE[an.idx], ss(600, 632, d));                                                // close on our left down the last of the ramp
          return lerp(l, fun, ss(L - 112, L - 56, d));
        }
        l = lerp(l, 19.5 + k * 0.2, ss(292, 326, d) * (1 - ss(352, 380, d)));                                   // wide round the sparring rhinos, and straight back in
        if (pack) {
          l = lerp(l, MLANE[an.idx], ss(356, 380, d));                                                          // the pack fills the right of the frame again by u 0.50
          l = lerp(l, WLANE[an.idx], ss(WD[an.idx], WD[an.idx] + 27, d));                                       // the wheel: across our front to the left
          return lerp(l, Math.sign(WLANE[an.idx]) * (fun + 1.6 + (an.idx % 3) * 1.5), ss(L - 112, L - 56, d));                             // and through the arch on that side
        }
        l = lerp(l, 5.5 + k * 0.27, ss(396, 428, d) * (1 - ss(468, 500, d)));                                   // inside the bench, under the mammoths
        l = lerp(l, 24 + k * 0.3, ss(474, 508, d) * (1 - ss(636, 668, d)));                                     // outside the bison
        return lerp(l, fun, ss(L - 112, L - 56, d));                                                            // the funnel through the arch
      },
    });
    scene.add(hero.object);
    const U = hero.uniforms;
    const escorts = hero.animals.filter((a) => !a.ext && !a.loop);
    for (const a of escorts) a.along0 = a.along;
    for (let i = 1; i <= 5; i++) hero.rescale(escorts[i], escorts[i].side > 0 ? 1.17 : 1.12);   // the pack runs close: a little over life
    // the one that is still half paint on the fin's broken edge at u 0.16: the right-hand escort highest on the wall
    const peeler = escorts.filter((a) => a.idx > 5 && a.side > 0).sort((a, b) => b.wallY - a.wallY)[0] || null;
    const lateCast = hero.object.children.filter((c) => /^rw-(body|ghost)-[3-7]$/.test(c.name));
    const bisonMesh = hero.object.children.filter((c) => c.name === 'rw-body-3');   // bison, rhinos, mammoths, lion, ibex: nothing of them shows from the cave
    await ctx.yield();

    // ---- look: palette tweaks for hour and weather (the hero has set the shared pigment uniforms) -------
    const fogCol = new THREE.Color().copy(U.uRock.value).multiplyScalar(0.8);
    let fogD = 0.00022, exposure = 1.0;
    const skyK = new THREE.Vector4(0.8, 0.88, 0.8, 0), skyG = new THREE.Vector4(0, 0.4, 0.33, 0), airCol = new THREE.Color(0.9, 0.9, 0.87);
    // the vault's own rock: by day the land's; at golden hour a pale gold wash, lighter than the brown it would otherwise dry to
    const skyRock = U.uRock.value.clone(), skyPale = U.uPale.value.clone();
    if (hour === 'golden') {
      fogCol.lerp(new THREE.Color(PALETTE[4]), 0.42); skyK.set(1.7, 1, 0.7, 0); skyG.set(1, 0.6, 0.42, 0); exposure = 1.04; fogD = 0.0005;
      skyRock.setRGB(1.0, 0.75, 0.36); skyPale.setRGB(0.97, 0.82, 0.52);
    }
    if (hour === 'night') { skyK.set(0.35, 0.7, 0.4, 1); skyG.y = 0; exposure = 1.55; fogD = 0.0003; }
    if (weather === 'loess') { fogCol.lerp(new THREE.Color(PALETTE[4]), 0.38).multiplyScalar(0.95); fogD = 0.0036; skyK.x += 0.5; skyK.z = 1.6; airCol.set(PALETTE[4]).multiplyScalar(0.85); U.uFade.value = 420; }
    if (weather === 'snow') { fogD = hour === 'night' ? 0.0007 : 0.0011; fogCol.lerp(new THREE.Color(0.8, 0.8, 0.78), hour === 'night' ? 0.1 : 0.4); U.uSnow.value = 1; }
    scene.fog = new THREE.FogExp2(fogCol, fogD);
    scene.background = fogCol.clone();
    U.uTorchR.value = 330; U.uMouth.value.w = 58; U.uTorchBack.value = 0.16; U.uGlim.value = 0.76;
    U.uHearth.value.set(-7.6, FLOOR + 0.5, -33.5, 0.95);   // two ember beds at the neck of the gallery light the friezes that converge on the mouth
    if (hour === 'night') {   // engraved: pale scraped lines, the wash a mid clay so outlines stay outlines
      const clay = new THREE.Color(PALETTE[2]);
      U.uOchre.value.copy(clay).multiplyScalar(0.46); U.uChar.value.set(PALETTE[1]).multiplyScalar(0.46); U.uSnow.value = Math.min(U.uSnow.value, 0.4);
    }
    U.uDark.value.set(0.14, 0.105, 0.078).multiplyScalar(hour === 'night' ? 0.88 : 1);
    const baseU = () => ({ ...fogU(), ...U });
    const uCaveK = { value: 1 }, uFlame = { value: 1 }, uPx = { value: 0.003 };
    const emit = []; for (let i = 0; i < 8; i++) emit.push(new THREE.Vector4(0, -1000, 0, 0));
    const uEmit = { value: emit };
    const splashCol = new THREE.Color(), turfCol = new THREE.Color();   // the splash dabs: thrown red turf at the rhinos, calcite-pale water at the river

    const terrain = new THREE.Mesh(terrainGeo, new THREE.ShaderMaterial({ vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG, fog: true,
      uniforms: { ...baseU(), uCloud: { value: weather === 'loess' ? 0.4 : hour === 'night' ? 0.5 : 1 }, uGlow: { value: hour === 'golden' ? 1 : 0 },
        uRC: { value: new THREE.Vector4(RC.x, RC.z, RAX, RAZ) } } }));
    terrain.frustumCulled = false; scene.add(terrain);

    const iceDir = new THREE.Vector3(ICE.x, 0, ICE.z + 420).normalize();
    // six smudge clouds round the sky, low and high by turns, so that any view holds two or three
    const streaks = [];
    { const a0 = xq() * TAU;
      for (let i = 0; i < 6; i++) streaks.push(new THREE.Vector4(a0 + (i + xq.range(-0.22, 0.22)) * TAU / 6, (i % 2 ? xq.range(0.31, 0.4) : xq.range(0.2, 0.27)), xq.range(0.5, 0.82), xq.range(0.024, 0.036) * (i % 2 ? 1.15 : 1)));
      // one long smudge is laid across the sky over the arch (its pressed end toward the sun); any other that would lie in the
      // same quarter is lifted clear of it and of the sun
      streaks[0].set(0.5, 0.3, 0.48, 0.036);
      for (let i = 1; i < 6; i++) { const da = Math.atan2(Math.sin(streaks[i].x), Math.cos(streaks[i].x)); if (Math.abs(da) < streaks[i].z + 0.3) streaks[i].y = Math.max(streaks[i].y, 0.37 + 0.03 * (i % 2)); } }
    // the painted sun stands on the horizon dead ahead of the cave mouth, at the far end of the valley (see the gap in the far plateau)
    const SUN_EL = 0.115, SUN_R = 0.132;
    const skyU = { ...U, uRock: { value: skyRock }, uPale: { value: skyPale }, uStencil: { value: new THREE.Vector4(0, 0, 0, 0) }, uHandDir: { value: new THREE.Vector3(0.5, 0.36, -0.8).normalize() },
      uHaze: { value: fogCol.clone() }, uIceDir: { value: iceDir }, uSkyK: { value: skyK }, uSkyG: { value: skyG }, uStreak: { value: streaks },
      uDisc: { value: new THREE.Vector4(0, Math.sin(SUN_EL), -Math.cos(SUN_EL), SUN_R) }, uDiscK: { value: new THREE.Vector4(weather === 'loess' ? 0.85 : 1, hour === 'night' ? 1 : 0, 1, 0) } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(100, 40, 20), new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, uniforms: skyU, side: THREE.BackSide, depthWrite: false }));
    sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);

    // ---- built rock: an accumulator of rings and grids ---------------------------------------------------
    class Acc {
      constructor() { this.p = []; this.r = []; this.i = []; this.uv = []; }
      v(x, y, z, a = 0, b = 0, c = 0, d = 0, u = 0, w = 0) { this.p.push(x, y, z); this.r.push(a, b, c, d); this.uv.push(u, w); return this.p.length / 3 - 1; }
      grid(rows, closed, flip) {
        for (let r = 0; r < rows.length - 1; r++) {
          const A = rows[r], B = rows[r + 1], n = A.length;
          for (let j = 0; j < (closed ? n : n - 1); j++) {
            const a = A[j], b = A[(j + 1) % n], c = B[j], d = B[(j + 1) % n];
            if (flip) this.i.push(a, b, c, b, d, c); else this.i.push(a, c, b, b, c, d);
          }
        }
      }
      // a lathe (stalagmite, ear, torch) along +Y from (x, y, z); prof(t) -> radius, bend(t) -> [dx, dz]
      lathe(x, y, z, H, sides, rings, prof, attr, bend, sx = 1) {
        const rows = [];
        for (let k = 0; k <= rings; k++) {
          const t = k / rings, rad = prof(t), bd = bend ? bend(t) : [0, 0], row = [];
          for (let j = 0; j < sides; j++) { const a = j / sides * TAU; row.push(this.v(x + bd[0] + Math.cos(a) * rad * sx, y + t * H, z + bd[1] + Math.sin(a) * rad, ...attr)); }
          rows.push(row);
        }
        this.grid(rows, true, H < 0);
      }
      blob(x, y, z, rx, ry, rz, seed, amp, attr, segs = 9) {
        const rows = [];
        for (let k = 0; k <= segs; k++) {
          const ph = Math.PI * k / segs, row = [];
          for (let j = 0; j <= segs + 2; j++) {
            const th = TAU * j / (segs + 2), dx = Math.sin(ph) * Math.cos(th), dy = Math.cos(ph), dz = Math.sin(ph) * Math.sin(th);
            const m = 1 + amp * noise.fbm3(dx * 1.4 + seed, dy * 1.4, dz * 1.4, 3) + amp * 0.6 * Math.abs(dx) * dx * dx;
            row.push(this.v(x + dx * rx * m, y + dy * ry * m, z + dz * rz * m, ...attr));
          }
          rows.push(row);
        }
        this.grid(rows, false, true);
      }
      geo() {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('aRock', new THREE.Float32BufferAttribute(this.r, 4));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
        g.setIndex(this.i); g.computeVertexNormals(); return g;
      }
    }
    const rockMat = new THREE.ShaderMaterial({ vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, fog: true, uniforms: baseU() });

    // ---- the cave: hall, gallery, mouth; walls smooth and vertical exactly on the hero's wall lines ------
    // The hall runs on 80 m behind the entry point: the camera of the previous world's portal stands back there.
    {
      const cave = new Acc(), cr = rng.fork('cave');
      const halfW = (d) => lerp(lerp(16, GH, ss(28, 42, d)), MH, ss(dM - FLARE, dM, d));
      const ceilH = (d) => lerp(lerp(14, 7.5, ss(24, 42, d)), 11.5, ss(dM - FLARE, dM, d));
      const ring = (d, hw, Hc, cK, wallK, lean) => {
        const y0 = pyAt(-d) - EYE, z = -d, ids = [];
        for (let j = 0; j <= 8; j++) {
          const lat = -hw + 2 * hw * j / 8, al = Math.abs(lat);
          const wl = noise.n2(lat * 0.25, d * 0.25) * 0.22 * ss(2.5, 5.5, al) * (1 - ss(hw - 2.5, hw - 0.5, al)) * wallK;
          ids.push(cave.v(lat, y0 + wl - (1 - wallK) * 0.45, z, 0, cK, 1, d + 600));
        }
        for (const y of [0, 1.7, 3.4, 5.2]) ids.push(cave.v(hw + lean * y / 5.2, y0 + y, z, wallK, cK, 0, d + 120));
        for (let i = 1; i <= 9; i++) {
          const th = Math.PI * i / 10, c = Math.cos(th), s = Math.pow(Math.sin(th), 0.75);
          const rough = noise.fbm3(c * hw * 0.12, d * 0.09, 3.3, 3), drape = Math.abs(noise.n3(c * hw * 0.2, d * 0.16, 9.1));
          const top = (Hc - 5.2 + lean * 1.5) * s * (1 + 0.22 * rough) - drape * Math.min(1.6, (Hc - 5.2) * 0.3) * s;
          ids.push(cave.v((hw + lean) * c * (1 + 0.04 * rough * wallK), y0 + 5.2 + Math.max(top, 0.15 * s), z, 0, cK, 0, d + 260));
        }
        for (const y of [5.2, 3.4, 1.7, 0]) ids.push(cave.v(-hw - lean * y / 5.2, y0 + y, z, wallK, cK, 0, d + 420));
        return ids;
      };
      const rows = [], nR = Math.round((dM + 17) / 2.05);
      for (let d = -80; d < -17.5; d += 4.5) rows.push(ring(d, 16, 14, 1, 1, 0));
      for (let k = 0; k <= nR; k++) { const d = lerp(-17, dM, k / nR); rows.push(ring(d, halfW(d), ceilH(d), 1, 1, 0)); }
      rows.push(ring(dM + 1.2, MH + 1.5, 13.5, 0.7, 0, 1), ring(dM + 2.6, MH + 5, 18, 0.35, 0, 3), ring(dM + 4.4, 27, 40, 0, 0, 9));
      cave.grid(rows, true, true);
      // the threshold apron. A portal's lower third looks under the floor at the entry plane (the eye rides 2.3 m up,
      // the opening reaches 7 m down, and the engine clips everything on the near side of that plane), so the floor is
      // carried on down there as a steep face painted with the same trodden clay at a false depth. Never seen from inside.
      {
        const ap = [];
        for (const [dy, dz] of [[0.03, 0.12], [1.2, 0.7], [3.0, 1.8], [5.6, 3.2], [9.5, 5.0]]) {
          const row = [];
          for (let j = 0; j <= 12; j++) { const x = -18 + 36 * j / 12; row.push(cave.v(x, FLOOR - dy, -dz, dy * 1.7 + dz, 1, 1, 600)); }
          ap.push(row);
        }
        cave.grid(ap, false, false);
      }
      const cc = cave.v(0, FLOOR + 6, 80, 0, 1, 0, 400);
      for (let j = 0; j < rows[0].length; j++) cave.i.push(cc, rows[0][(j + 1) % rows[0].length], rows[0][j]);
      await ctx.yield();
      // stalagmites, stalactites, the bear skull on its block
      const stal = (x, z, Rr, H, up, sides = 7) => {
        if (up && Math.abs(x) < 6) H = Math.min(H, 2.6);   // nothing by the path stands taller than a horse
        const ph = cr() * 9, y0 = up ? pyAt(z) - EYE - 0.1 : FLOOR + 5.2 + (ceilH(-z) - 5.2) * Math.pow(Math.max(1 - (x / halfW(-z)) ** 2, 0.02), 0.375) + 0.5;
        cave.lathe(x, y0, z, up ? H : -H, sides, sides + 1, (t) => Rr * Math.pow(1 - t * 0.97, 0.62) * (1 + 0.2 * Math.sin(t * 11 + ph) + 0.08 * Math.sin(t * 29 + ph * 2)) + 0.015, [0, 1, -1, y0],
          (t) => [0.25 * Rr * Math.sin(t * 5 + ph), 0.25 * Rr * Math.cos(t * 4 + ph)]);
      };
      for (let i = 0; i < 22; i++) {
        const d = cr.range(1, 34), lat = cr.sign() * cr.range(5.6, 13);
        if (halfW(d) - Math.abs(lat) < 2.6) continue;
        stal(lat, -d, cr.range(0.3, 0.75), cr.range(1.2, 3.8), true);
      }
      for (let i = 0; i < 9; i++) stal(cr.sign() * cr.range(8, 13.5), cr.range(6, 70), cr.range(0.35, 0.8), cr.range(1.4, 4.2), true);   // the rear hall, off the portal's cone
      await ctx.yield();
      // two tall ones stand in the neck of the gallery: from the entry (and through a portal) they cut dark into the daylight almond
      stal(-3.6, -44, 0.78, 5.4, true, 10); stal(3.8, -50, 0.7, 4.7, true, 10); stal(-4.6, -40.5, 0.5, 2.5, true, 9); stal(4.7, -46, 0.45, 2.0, true, 9); stal(-6.3, -31, 0.7, 3.6, true, 9); stal(6.6, -34, 0.6, 3.0, true, 9);
      for (let i = 0; i < 12; i++) { const d = cr.range(52, 90); stal(cr.sign() * (halfW(d) - 0.5), -d, cr.range(0.17, 0.28), cr.range(0.5, 1.3), true); }
      for (let i = 0; i < 14; i++) stal(cr.range(-11, 11), -cr.range(-6, 27), cr.range(0.25, 0.6), cr.range(1, 3.2), false);
      // teeth: stalactites over the gallery's entrance and along the lintel of the mouth, dark against the day
      for (const [x, d, r, h] of [[-3.4, 43, 0.34, 2.3], [-1.8, 45.5, 0.3, 2.9], [0.4, 47, 0.24, 1.6], [2.2, 44, 0.34, 2.6], [3.7, 47.5, 0.28, 1.9], [-6.6, dM - 3, 0.45, 3.2], [-3.4, dM - 2, 0.34, 2.2], [2.0, dM - 2.5, 0.38, 2.7], [5.4, dM - 2, 0.46, 3.4], [7.6, dM - 3.5, 0.34, 2.2]]) stal(x, -d, r, h, false, 8);
      await ctx.yield();
      const bx = -6.2, bz = -15;
      cave.blob(bx, FLOOR + 0.45, bz, 1.25, 0.72, 0.95, 3.1, 0.3, [0, 1, 0, 0], 10);
      cave.blob(bx + 0.1, FLOOR + 1.24, bz, 0.2, 0.17, 0.3, 7.7, 0.08, [0, 1, 0, 0], 7);            // cranium
      cave.blob(bx + 0.1, FLOOR + 1.17, bz - 0.36, 0.13, 0.1, 0.22, 4.2, 0.05, [0, 1, 0, 0], 6);    // muzzle
      // the painted fin: the right-hand wall runs on down the scree for FIN metres and the herd peels off its broken end
      {
        const rowsF = [], nF = 16;
        for (let k = 0; k <= nF + 2; k++) {
          const f = Math.min(k, nF) / nF, d = dM + 0.6 + (FIN - 0.4) * f + Math.max(0, k - nF) * 1.2;
          const endK = k <= nF ? 1 : k === nF + 1 ? 0.42 : 0;
          const FX = lerp(MH, FINH, ss(dM, dM + FIN, d));
          const g0 = groundAt(FX, -d), g1 = groundAt(FX + 7, -d), yb = g0 - 0.8;
          const H = (lerp(11.5, 6.0, Math.pow(f, 0.7)) + 0.7 * noise.n2(d * 0.3, 4.4)) * endK + 0.8;
          const rg = (a) => noise.n2(d * 0.21 + a * 7.1, a * 3.3), row = [];
          for (const q of [0, 0.2, 0.4, 0.6, 0.8, 1]) row.push(cave.v(FX, yb + H * q, -d, endK > 0.9 ? 1 : 0.5, 0, 0, d + 120));
          row.push(cave.v(FX + 0.8 + 0.3 * rg(1), yb + H + (0.5 + 0.3 * rg(2)) * endK, -d, 0, 0, 0, d + 260));
          row.push(cave.v(FX + 2.3 + 0.7 * rg(3), yb + H * 0.95 + 0.6 * rg(4) * endK, -d, 0, 0, 0, d + 260));
          row.push(cave.v(FX + 3.7 + 0.8 * rg(5), yb + H * 0.6 + 0.5 * rg(6) * endK, -d, 0, 0, 0, d + 260));
          row.push(cave.v(FX + 5.3 + 0.9 * rg(7), lerp(g1, yb + H, 0.16) - 0.3, -d, 0, 0, 0, d + 260));
          row.push(cave.v(FX + 7, g1 - 1.0, -d, 0, 0, 0, d + 260));
          rowsF.push(row);
        }
        cave.grid(rowsF, false, true);
      }
      await ctx.yield();
      // the same program with its own snow switch: first snow does not fall inside the cave
      const caveMat = new THREE.ShaderMaterial({ vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, fog: true, uniforms: { ...baseU(), uSnow: { value: 0 } } });
      const caveGeo = cave.geo(); await ctx.yield();
      const mesh = new THREE.Mesh(caveGeo, caveMat); mesh.name = 'cave'; scene.add(mesh);
    }
    await ctx.yield();

    // ---- the Pont d'Arc: a wall of rock across the river with the opening the portal stands in ---------
    {
      const arch = new Acc();
      const AW = 31, AI = 12, AH = 15.5, AD = 10, NT = 60, KR = 9;
      const W3 = (X, Y, Z) => [PE.x + R.x * X + E.x * (Z + 4), WATER + Y, PE.z + R.z * X + E.z * (Z + 4)];
      const inner = (t) => { if (t < 0.2) return [-AI, lerp(-3, 8, t / 0.2)]; if (t > 0.8) return [AI, lerp(8, -3, (t - 0.8) / 0.2)]; const th = Math.PI * (1 - (t - 0.2) / 0.6); return [AI * Math.cos(th), 8 + (AH - 8) * Math.sin(th)]; };
      const outer = (t) => {
        if (t < 0.2) return [-AW, lerp(-3, 13, t / 0.2)]; if (t > 0.8) return [AW, lerp(13, -3, (t - 0.8) / 0.2)];
        const th = Math.PI * (1 - (t - 0.2) / 0.6), c = Math.cos(th), X = AW * Math.sign(c) * Math.pow(Math.abs(c), 0.4);
        return [X, 13 + (archTop(X) - 13) * Math.pow(Math.max(Math.sin(th), 0), 0.4)];
      };
      const bump = (X, Y, f) => (0.4 + noise.fbm2(X * 0.09 + 3, Y * 0.13, 3) * 1.5 + 0.8 * noise.n2(Math.floor(Y / 3.4) * 7.3, 2.1) + 0.5 * noise.n2(X * 0.4, Y * 0.5)) * ss(0, 0.3, f);
      const front = [], back = [], zf = [];
      for (let k = 0; k <= KR; k++) {
        const f = k / KR, rf = [], rb = [];
        for (let j = 0; j <= NT; j++) {
          const t = j / NT, a = inner(t), b = outer(t), X = lerp(a[0], b[0], f), Y = lerp(a[1], b[1], f), bm = bump(X, Y, f);
          rf.push(arch.v(...W3(X, Y, -AD / 2 - bm), (1 - ss(0.3, 0.52, f)) * ss(0.2, 1.2, Y), 0, 2, X + 100));
          rb.push(arch.v(...W3(X, Y, AD / 2 + bm), 0, 0, 0, X + 100));
          if (k === KR) zf.push(-AD / 2 - bm);
        }
        front.push(rf); back.push(rb);
      }
      arch.grid(front, false, true); arch.grid(back, false, false);
      const tun = [], cap = [];
      for (let m = 0; m <= 4; m++) { const row = []; for (let j = 0; j <= NT; j++) { const a = inner(j / NT), g = 1 + 0.035 * noise.n2(j * 0.4, m * 0.9) * Math.sin(Math.PI * m / 4); row.push(arch.v(...W3(a[0] * g, a[1] * (a[1] > 0 ? g : 1), lerp(-AD / 2, AD / 2, m / 4)), 0, 0.5, 0, 1)); } tun.push(row); }
      for (let m = 0; m <= 2; m++) { const row = []; for (let j = 0; j <= NT; j++) { const b = outer(j / NT); row.push(arch.v(...W3(b[0], b[1] + 0.6 * Math.sin(Math.PI * m / 2), lerp(zf[j], -zf[j], m / 2)), 0, 0, 0, b[0] + 100)); } cap.push(row); }
      arch.grid(tun, false, false); arch.grid(cap, false, true);
      const mesh = new THREE.Mesh(arch.geo(), rockMat); mesh.name = 'arch'; scene.add(mesh);
    }

    await ctx.yield();

    // ---- the gorge walls ------------------------------------------------------------------------------------
    // Each is a wall of beds along a line: [bottom, top, set back from the line, how much of the buttress-and-cleft relief it
    // takes]. A bed overhangs a little at its top and the next one starts further back, so every joint is a ledge; clefts cut
    // the upper beds and notch the crown, which is cut off at top(z) so the skyline is towers and gaps.
    {
      const wall = new Acc();
      const build = async (line, dir, top, bedsAt, z0, z1, stepAt, k, dipAt, panel, pf, gulAt, amp) => {
        const cols = []; let s = 0, px = line(z0), pz = z0, c = 0;
        for (let z = z0; z > z1; z -= stepAt(z), c++) {
          const x0 = line(z); s += Math.hypot(x0 - px, z - pz); px = x0; pz = z;
          const foot = groundAt(x0 + dir * 1.5, z) - 3, tp = Math.max(top(z) + 1.6 * noise.n2(z * 0.05, 4.4 + k), foot + 8);
          const gul = gulAt(z), pm = pf(z), dp = dipAt(z), col = [], am = amp(z), beds = bedsAt(z);
          const wob = (j) => (j === panel || j === panel + 1 ? 0 : 1.7 * noise.n2(s * 0.02, j * 7.1 + k));   // the beds thicken and thin along the wall; the painted one keeps its lines
          let off = 0;
          for (let b = 0; b < beds.length; b++) {
            const bd = beds[b], isPanel = b === panel, rk = isPanel ? bd[3] * (1 - pm) + 0.55 * (1 - pm) : bd[3];
            const but = 1 - Math.abs(noise.n2(s * 0.043 + b * 0.21, 7.7 + k * 5 + b * 0.37)), fine = noise.n2(s * 0.16, b * 3.3 + k);
            off = bd[2] + rk * am * (but * 3.4 - 1.2 + 0.7 * fine - gul * 6.5 * ss(0, 2, b));
            const ya = clamp(bd[0] + dp + wob(b), foot, tp), yb = clamp(bd[1] + dp + wob(b + 1), foot, tp), ao = clamp(rk * gul * 0.95, 0, 1);
            col.push(wall.v(x0 + dir * off, ya, z, b, pm * (isPanel ? 1 : 0), ao, s));
            col.push(wall.v(x0 + dir * (off + 0.25 + 0.8 * rk), yb, z, b + 1, pm * (isPanel ? 1 : 0), ao, s));
          }
          col.push(wall.v(x0 + dir * (off - 7), tp - 3.5, z, 8.5, 0, 0, s));
          col.push(wall.v(x0 + dir * (off - 20), tp - 18, z, 8.5, 0, 0, s));
          cols.push(col);
          if ((c & 15) === 15) await ctx.yield();
        }
        wall.grid(cols, false, dir < 0);
      };
      const BR = (z) => { const g = gpB(z), p0 = P0(z), p1 = P1(z), a = lerp(6, 1.5, g), b = lerp(45, 60, g), c = lerp(54, 71, g), d = lerp(64, 84, g);
        return [[-60, -2, 2.6, 0.35], [-2, a, 1.6, 0.3], [a, p0, 0.7, 0.15], [p0, p1, 0, 0], [p1, b, -1.8, 0.6], [b, c, -3.6, 0.9], [c, d, -5.6, 1], [d, lerp(84, 114, g), -7.8, 1]]; };
      const BL = [[-60, -12, 4.5, 0.5], [-12, 4, 3, 0.6], [4, PANEL_L[0], 1.5, 0.8], [PANEL_L[0], PANEL_L[1], 0, 0.9], [PANEL_L[1], 60, -2.6, 1], [60, 76, -5.2, 1], [76, 98, -8, 1], [98, 150, -11.5, 1]];
      await build(wallR, -1, topR, BR, -98, -900, (z) => (z > -480 ? 4 : z > -620 ? 7 : 14), 0, () => 0, 3, panelAt, (z) => gullyAt(z, 0), () => 1);
      await ctx.yield();
      await build(cliffL, 1, topL, () => BL, 70, -1130, (z) => (z > -705 ? 5 : 9), 1, dipL, 3, panelL, (z) => Math.max(gullyAt(z, 1) * (1 - prowAt(z)), gullyP(z) * prowAt(z)), (z) => 1 + 1.3 * prowAt(z));
      await ctx.yield();
      // the two bluffs the arch stands between: the up-valley face of the spur, in the same beds (every joint a ledge, clefts,
      // ochre weeping) and wholly in a drawn shade, so that they are a clear step darker than the sky and the pale arch face
      // with its red hands stands out between them. They swing forward from the arch face and run on to the valley walls.
      {
        const BB = [[-6, 3.5, 2.4, 0.3], [3.5, 10, 1.3, 0.5], [10, 18, 0.2, 0.7], [18, 27, -1.4, 0.9], [27, 37, -3.2, 1], [37, 48, -5.2, 1], [48, 62, -7.4, 1], [62, 82, -9.8, 1]];
        for (const sg of [-1, 1]) {
          const cols = [];
          for (let q = 27, c = 0; q < 336; q += q < 150 ? 4 : 7, c++) {
            const bx = PE.x + R.x * sg * q, bz = PE.z + R.z * sg * q, sf = bluffS(q);
            const P = (sv) => [bx + E.x * sv, bz + E.z * sv];
            const cr = P(-2), rag = noise.fbm2(cr[0] * 0.02, cr[1] * 0.02, 3), gul = ss(0.5, 0.78, noise.n2(q * 0.024 + sg * 3.7, 13.1)) * ss(40, 60, q);
            const tp = WATER + Math.max(lerp(21.5, 0, ss(30, 48, q)), spurH(rag, q)) + 2.4 + (9 * (1 - Math.abs(noise.n2(q * 0.031, 7.6 + sg))) ** 2 * (0.35 + 0.65 * ss(-0.3, 0.5, noise.n2(q * 0.011, 2.2 + sg))) + 1.5 * noise.n2(q * 0.09, 4.4 + sg)) * ss(30, 50, q) - 2.4 * gul;
            const ft = P(sf - 2.5), foot = groundAt(ft[0], ft[1]) - 3, col = [], arc = 700 + sg * 300 + q;
            const wob = (j) => 1.5 * noise.n2(q * 0.02, j * 7.1 + sg * 3);
            let off = 0;
            for (let b = 0; b < BB.length; b++) {
              const bd = BB[b], rk = bd[3];
              const but = 1 - Math.abs(noise.n2(q * 0.043 + b * 0.21, 17.7 + sg * 5 + b * 0.37)), fine = noise.n2(q * 0.16, b * 3.3 + sg * 2);
              off = (bd[2] + rk * (but * 3.4 - 1.2 + 0.7 * fine - gul * 5.5 * ss(0, 2, b))) * ss(27, 40, q);
              const ya = clamp(WATER + bd[0] + wob(b), foot, tp), yb = clamp(WATER + bd[1] + wob(b + 1), foot, tp), ao = clamp(0.36 + rk * gul * 0.6, 0, 1);
              const a = P(sf - off), t = P(sf - off - 0.25 - 0.8 * rk);
              col.push(wall.v(a[0], ya, a[1], b + 5, 0, ao, arc)); col.push(wall.v(t[0], yb, t[1], b + 6, 0, ao, arc));
            }
            const k1 = P(sf - off + 6), k2 = P(sf - off + 22);
            col.push(wall.v(k1[0], tp - 2, k1[1], 13.5, 0, 0.3, arc)); col.push(wall.v(k2[0], tp - 16, k2[1], 13.5, 0, 0.3, arc));
            cols.push(col);
            if ((c & 15) === 15) await ctx.yield();
          }
          wall.grid(cols, false, sg > 0);
          await ctx.yield();
        }
      }
      const geo = wall.geo(); await ctx.yield();
      const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: ROCK_VERT, fragmentShader: CLIFF_FRAG, fog: true, side: THREE.DoubleSide,
        uniforms: { ...baseU(), uGlow: { value: hour === 'golden' ? 1 : 0 } } }));
      mesh.frustumCulled = false; mesh.name = 'walls'; scene.add(mesh);
    }
    await ctx.yield();

    // ---- the river --------------------------------------------------------------------------------------
    {
      const riv = new Acc(), rows = []; let sAcc = 0, lx = riverX(120), lz = 120;
      for (let z = 120; z >= -1262; z -= 6) {
        const x = riverX(z), sl = (riverX(z - 3) - riverX(z + 3)) / 6, n = Math.sqrt(1 + sl * sl), row = [];
        sAcc += Math.hypot(x - lx, z - lz); lx = x; lz = z;
        for (const q of [-1, -0.5, 0, 0.5, 1]) row.push(riv.v(x + q * 13.5 / n, WATER, z + q * 13.5 * sl / n, sAcc, q, 0, 0));
        rows.push(row);
      }
      riv.grid(rows, false, true);
      const mesh = new THREE.Mesh(riv.geo(), new THREE.ShaderMaterial({ vertexShader: ROCK_VERT, fragmentShader: RIVER_FRAG, fog: true,
        uniforms: { ...baseU(), uEmit, uFwd: { value: new THREE.Vector2(E.x, E.z) }, uGate: { value: new THREE.Vector4(PE.x, PE.z, E.x, E.z) },
          uGateCol: { value: hour === 'night' ? U.uChar.value.clone().multiplyScalar(1.5) : new THREE.Color(PALETTE[4]).multiplyScalar(1.2) } } }));
      mesh.name = 'river'; scene.add(mesh);
    }
    await ctx.yield();

    // ---- stones on the scree, the ramp and the gravel bar ------------------------------------------------
    const sr = rng.fork('scatter'), tmpS = new THREE.Vector3();
    {
      const g0 = new THREE.IcosahedronGeometry(1, 1), p = g0.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 0.78 + 0.34 * noise.fbm3(x * 1.3 + 5, y * 1.3, z * 1.3, 2) + 0.12 * Math.sign(x) * x * x;
        p.setXYZ(i, x * k * 1.2, y * k * 0.7, z * k);
      }
      g0.computeVertexNormals(); g0.setAttribute('aRock', new THREE.BufferAttribute(new Float32Array(p.count * 4), 4));
      const n = Math.round(240 * (0.6 + 0.4 * detail)), stones = new THREE.InstancedMesh(g0, rockMat, n);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        const zone = sr(), s = 0.13 + 0.62 * Math.pow(sr(), 3);
        const d = zone < 0.24 ? sr.range(99, 190) : zone < 0.62 ? sr.range(478, 628) : sr.range(600, 706);
        side(d, sr.sign() * (2.4 + s * 7 + 38 * Math.pow(sr(), 2.0)), 0, tmpS);
        m.compose(tmpS.setY(tmpS.y + s * 0.18), q.setFromEuler(e.set(sr.range(-0.3, 0.3), sr() * TAU, sr.range(-0.3, 0.3))), sc.set(s * sr.range(0.8, 1.3), s * sr.range(0.7, 1.1), s * sr.range(0.8, 1.3)));
        stones.setMatrixAt(i, m);
      }
      stones.instanceMatrix.needsUpdate = true; stones.name = 'stones'; scene.add(stones);
      await ctx.yield();
      // cobbles under the hooves: many small ones close to the path on the scree, the ramp and the gravel bar
      const g1 = new THREE.IcosahedronGeometry(1, 0), p1 = g1.attributes.position;
      for (let i = 0; i < p1.count; i++) { const x = p1.getX(i), y = p1.getY(i), z = p1.getZ(i), k = 0.8 + 0.3 * noise.n3(x * 1.7 + 2, y * 1.7, z * 1.7); p1.setXYZ(i, x * k * 1.25, y * k * 0.62, z * k); }
      g1.computeVertexNormals(); g1.setAttribute('aRock', new THREE.BufferAttribute(new Float32Array(p1.count * 4), 4));
      const n1 = Math.round(800 * (0.5 + 0.5 * detail)), cobbles = new THREE.InstancedMesh(g1, rockMat, n1);
      for (let i = 0; i < n1; i++) {
        const sz = 0.07 + 0.3 * Math.pow(sr(), 2.2), dd = sr() < 0.33 ? sr.range(99, 196) : sr.range(476, 708);
        side(dd, sr.sign() * (1.3 + sz * 4 + 13 * Math.pow(sr(), 1.3)), 0, tmpS);
        m.compose(tmpS.setY(tmpS.y + sz * 0.12), q.setFromEuler(e.set(sr.range(-0.4, 0.4), sr() * TAU, sr.range(-0.4, 0.4))), sc.set(sz * sr.range(0.8, 1.4), sz * sr.range(0.6, 1.1), sz * sr.range(0.8, 1.3)));
        cobbles.setMatrixAt(i, m);
      }
      cobbles.instanceMatrix.needsUpdate = true; cobbles.name = 'cobbles'; scene.add(cobbles);
    }
    await ctx.yield();

    // ---- the steppe grass: a carpet of brush-dab clumps that wraps round the eye, and fixed tufts for the middle distance
    const uCtr = { value: new THREE.Vector3(0, 0, 1000) };
    {
      // the ground under the carpet as a table (1 m texels): r height, g how much grass (the land's own mask, a bare
      // trail under our hooves, bare ground where the bison and the lion run)
      const HX0 = -36, HZ0 = -744, HNX = 114, HNZ = 652, hData = new Float32Array(HNX * HNZ * 4);
      for (let j = 0; j < HNZ; j++) {
        const z = HZ0 + j, pxz = pxAt(z), dz = pdAt(z);
        for (let i = 0; i < HNX; i++) {
          const x = HX0 + i, h = groundAt(x, z), lat = x - pxz, o = (j * HNX + i) * 4;
          let g = 0;
          if (i > 0 && j > 0 && i < HNX - 1 && j < HNZ - 1 && z < -146) {
            g = Math.min(1, grassRaw(x, z, h, riverDist(x, z)) * (1 + 1.1 * ss(-480, -525, z))) * ss(0.7, 2.1, Math.abs(lat));
            if (Math.abs(z - RC.z) < 16) g = Math.max(g, 0.85 * ss(4.6, 6.2, Math.hypot(x - RC.x, z - RC.z)) * (1 - ss(8, 10, Math.hypot(x - RC.x, z - RC.z))) * ss(0.7, 2.1, Math.abs(lat)));   // the trodden ring is thick with short grass
            if (dz > 480 && dz < 672) g *= 1 - ss(480, 492, dz) * (1 - ss(660, 672, dz)) * Math.max(ss(4.2, 5.4, lat) * (1 - ss(17, 19, lat)), ss(-3.6, -4.4, lat) * (1 - ss(-7.4, -8.4, lat)));
          }
          hData[o] = h; hData[o + 1] = g; hData[o + 2] = rcShort(x, z);
        }
        if ((j & 7) === 7) await ctx.yield();   // eight rows a step
      }
      const htTex = new THREE.DataTexture(hData, HNX, HNZ, THREE.RGBAFormat, THREE.FloatType);
      htTex.magFilter = htTex.minFilter = THREE.NearestFilter; htTex.generateMipmaps = false; htTex.needsUpdate = true;
      const bladeGeo = (nb) => {
        const pp = [], ii = [];
        for (let b = 0; b < nb; b++) { const o = b * 5; pp.push(-1, 0, b, 1, 0, b, -1, 0.5, b, 1, 0.5, b, 0, 1, b); ii.push(o, o + 1, o + 2, o + 1, o + 3, o + 2, o + 2, o + 3, o + 4); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); g.setIndex(ii); return g;
      };
      const kindOf = (r) => (r < 0.55 ? 1 : r < 0.84 ? 0 : r < 0.955 ? 3 : 2);   // ochre, charcoal, pale straw, a little red
      const gU = (wrap) => ({ ...baseU(), uWrap: { value: wrap }, uBox: { value: 40 }, uCtr, uHt: { value: htTex }, uHtBox: { value: new THREE.Vector4(HX0, HZ0, HNX, HNZ) } });
      await ctx.yield();
      // the carpet: clumps of five
      const nA = Math.round(2900 * detail * (0.9 + 0.2 * dens)), aP = new Float32Array(nA * 4), aQ = new Float32Array(nA * 4);
      for (let i = 0; i < nA; i++) {
        aP.set([xr(), 0, xr(), xr.range(0.34, 0.7)], i * 4); aQ.set([xr(), kindOf(xr()), xr() * TAU, xr.range(0.04, 0.3)], i * 4);
        if ((i & 1023) === 1023) await ctx.yield();
      }
      const carpet = new THREE.Mesh(instGeo(bladeGeo(5), nA, { iP: aP, iQ: aQ }),
        new THREE.ShaderMaterial({ vertexShader: GRASS_VERT, fragmentShader: GRASS_FRAG, fog: true, side: THREE.DoubleSide, uniforms: gU(1) }));
      carpet.frustumCulled = false; carpet.name = 'grass-carpet'; scene.add(carpet);
      await ctx.yield();
      // the middle distance: tufts of two
      const nRing = Math.round(300 * detail), want = Math.round(3900 * detail * (0.9 + 0.2 * dens)), iP = new Float32Array((want + nRing) * 4), iQ = new Float32Array((want + nRing) * 4);
      let n = 0;
      for (let tries = 0; n < want && tries < want * 3; tries++) {
        if ((tries & 1023) === 1023) await ctx.yield();
        side(xr.range(104, 668), xr.sign() * (1.6 + 62 * Math.pow(xr(), 1.5)), 0, tmpS);
        const g = grassRaw(tmpS.x, tmpS.z, tmpS.y, riverDist(tmpS.x, tmpS.z));
        if (xr() > 0.12 * dustAt(tmpS.x, tmpS.z) + g) continue;
        iP.set([tmpS.x, tmpS.y - 0.03, tmpS.z, xr.range(0.32, 0.66) * (0.8 + 0.4 * g) * rcShort(tmpS.x, tmpS.z)], n * 4);
        iQ.set([xr(), kindOf(xr()), xr() * TAU, xr.range(0.05, 0.35)], n * 4); n++;
      }
      // a ring of short tufts, flattened outward, round the rhinos' churned ground: all under knee height
      for (let i = 0; i < nRing; i++) {
        const a = xq() * TAU, r = 5.4 + 5.2 * Math.pow(xq(), 1.4), x = RC.x + Math.cos(a) * r, z = RC.z + Math.sin(a) * r;
        if (Math.abs(x - pxAt(z)) < 1.5) { xq(); xq(); xq(); xq(); continue; }
        iP.set([x, groundAt(x, z) - 0.02, z, xq.range(0.17, 0.27)], n * 4);
        iQ.set([xq(), kindOf(xq()), a + xq.range(-0.5, 0.5), 0.45], n * 4); n++;
      }
      const mesh = new THREE.Mesh(instGeo(bladeGeo(2), n, { iP: iP.subarray(0, n * 4), iQ: iQ.subarray(0, n * 4) }),
        new THREE.ShaderMaterial({ vertexShader: GRASS_VERT, fragmentShader: GRASS_FRAG, fog: true, side: THREE.DoubleSide, uniforms: gU(0) }));
      mesh.frustumCulled = false; mesh.name = 'grass'; scene.add(mesh);
    }
    await ctx.yield();

    // ---- plant signs: dwarf birch, willow, juniper, fishbone pines -----------------------------------------
    {
      const nearWant = Math.round(560 * detail), want = Math.round(2500 * detail) + nearWant, iP = new Float32Array(want * 4), iQ = new Float32Array(want * 4);
      let n = 0;
      // close to the path: willow and birch signs down the ramp and along the gravel bar, juniper tufts on the scree
      for (let tries = 0; n < nearWant && tries < nearWant * 4; tries++) {
        if ((tries & 511) === 511) await ctx.yield();
        const onScree = sr() < 0.24, kr = sr(), kind = onScree ? (kr < 0.75 ? 2 : 1) : kr < 0.48 ? 1 : kr < 0.84 ? 0 : 2;
        const sd = onScree ? sr.range(100, 194) : sr.range(484, 702), sl = sr.sign() * (3.3 + 11 * Math.pow(sr(), 1.2));
        if (!onScree && sd < 668 && ((sl > 5 && sl < 17.5) || (sl < -4.3 && sl > -7.6))) continue;   // bare ground under the bison and the lion
        side(sd, sl, 0, tmpS);
        if (riverDist(tmpS.x, tmpS.z) < 10.8) continue;
        const hgt = kind === 0 ? sr.range(0.42, 0.72) : kind === 1 ? sr.range(0.36, 0.6) : sr.range(0.75, 1.25);
        iP.set([tmpS.x, tmpS.y - hgt * 0.04, tmpS.z, hgt], n * 4); iQ.set([kind, sr(), sr() * TAU, kind === 2 ? 0.66 : 0.52], n * 4); n++;
      }
      for (let tries = 0; n < want && tries < want * 3; tries++) {
        if ((tries & 511) === 511) await ctx.yield();
        const kr = sr(), kind = kr < 0.4 ? 0 : kr < 0.76 ? 1 : kr < 0.88 ? 2 : 3, where = sr();
        let x, z, minLat = 3.2;
        if (kind === 3) {
          minLat = 14; z = -sr.range(100, 900);
          if (where < 0.3) x = Math.min(cliffL(z) + sr.range(15, 80), pxAt(z) - 26); else if (where < 0.6) x = wallR(z) - sr.range(4, 15) - Math.max(0, -470 - z) * 0.2 * sr();   // at the foot of the wall, under the painted bed
          else if (where < 0.93) { z = -sr.range(440, 640); x = Math.min(benchX(z) + sr.range(22, 95), wallR(z) - 8); }   // and where the side valley opens, behind the mammoths
          else { const X = sr.sign() * sr.range(34, 90); let Z = sr.range(-34, 30); if (Z > -26 && Z < 0) Z = Z < -13 ? Z - 13 : Z + 14; if (Z < 0) Z -= 8 * ss(90, 170, Math.abs(X)); x = PE.x + R.x * X + E.x * Z; z = PE.z + R.z * X + E.z * Z; }
        } else if (kind === 2) { minLat = 5; side(where < 0.5 ? sr.range(98, 192) : sr.range(480, 650), sr.sign() * (5 + 55 * Math.pow(sr(), 1.4)), 0, tmpS); x = tmpS.x; z = tmpS.z; }
        else if (where < 0.42) { z = -sr.range(150, 570); x = benchX(z) + sr.range(-10, 3.5); }
        else if (where < 0.66) { z = -sr.range(150, 665); x = riverX(z) + sr.sign() * sr.range(16, 44); }
        else { side(sr.range(150, 610), sr.sign() * (3.2 + 80 * Math.pow(sr(), 1.5)), 0, tmpS); x = tmpS.x; z = tmpS.z; }
        if (Math.abs(x - pxAt(z)) < minLat || riverDist(x, z) < 13 || iceAt(x, z) > 0.02) continue;
        if (kind < 3 && z < -488 && z > -662) { const lt = x - pxAt(z); if ((lt > 5 && lt < 17.5) || (lt < -4.3 && lt > -7.6)) continue; }
        if (kind === 3 && z < -190 && z > -640 && Math.abs(x - PE.x * (-z - 100) / (-PE.z - 100)) < 17) continue;   // keep the sight line from the mouth to the arch open
        if (kind === 3 && z < -270 && z > -456 && x > benchX(z) + 16) continue;                                        // and the foot of the Great Panel bare: its animals stand on it
        const y = groundAt(x, z);
        if (kind < 3 && Math.abs(groundAt(x + 1.5, z) - y) > 1.6) continue;
        const hgt = kind === 0 ? sr.range(0.5, 0.78) : kind === 1 ? sr.range(0.4, 0.62) : kind === 2 ? sr.range(0.95, 1.4) : sr.range(7.5, 10.5);
        iP.set([x, y - hgt * 0.04, z, hgt], n * 4); iQ.set([kind, sr(), sr() * TAU, kind === 3 ? 0.34 : kind === 2 ? 0.66 : 0.52], n * 4); n++;
      }
      const base = new THREE.BufferGeometry(), pp = [], ii = [];
      for (let b = 0; b < 2; b++) { pp.push(-1, 0, b, 1, 0, b, -1, 1, b, 1, 1, b); ii.push(b * 4, b * 4 + 1, b * 4 + 2, b * 4 + 1, b * 4 + 3, b * 4 + 2); }
      base.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); base.setIndex(ii);
      const mesh = new THREE.Mesh(instGeo(base, n, { iP: iP.subarray(0, n * 4), iQ: iQ.subarray(0, n * 4) }),
        new THREE.ShaderMaterial({ vertexShader: SIGN_VERT, fragmentShader: SIGN_FRAG, fog: true, side: THREE.DoubleSide, uniforms: baseU() }));
      mesh.frustumCulled = false; mesh.name = 'signs'; scene.add(mesh);
    }
    await ctx.yield();

    // ---- dabs in the air ------------------------------------------------------------------------------------
    {
      const nRed = Math.round(3000 * detail), nMote = Math.round(520 * detail), nSpl = 152, nAir = weather === 'clear' ? 0 : Math.round((weather === 'snow' ? 1500 : 900) * detail);
      const n = nRed + nMote + nSpl + nAir, iP = new Float32Array(n * 4), iQ = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        const kind = i < nRed ? 0 : i < nRed + nMote ? 1 : i < nRed + nMote + nSpl ? 2 : 3;
        iP.set([sr(), sr(), sr(), 0], i * 4);
        iQ.set([kind, sr(), kind === 0 ? sr.range(0.045, 0.11) : kind === 1 ? sr.range(0.018, 0.045) : kind === 2 ? sr.range(0.05, 0.115) : weather === 'snow' ? sr.range(0.05, 0.09) : sr.range(0.03, 0.08), 0], i * 4);
      }
      const mesh = new THREE.Mesh(instGeo(quadGeo(), n, { iP, iQ }), new THREE.ShaderMaterial({ vertexShader: DOT_VERT, fragmentShader: DOT_FRAG, fog: true,
        uniforms: { ...baseU(), uPx, uEmit, uAir: { value: weather === 'snow' ? 1.6 : 0.25 }, uAirCol: { value: airCol }, uSplash: { value: splashCol } } }));
      mesh.frustumCulled = false; mesh.name = 'dots'; scene.add(mesh);
    }
    await ctx.yield();

    // ---- choughs at the arch, and the eagle owl ---------------------------------------------------------------
    const NB = 15, bP = new Float32Array(NB * 4), bQ = new Float32Array(NB * 4), birds = [], oP = new Float32Array([0, -1000, 0, 0]), oQ = new Float32Array([0, 0.7, 1, 4.2]);
    {
      const base = new THREE.BufferGeometry();
      base.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.2, 0, 0, -0.24, 0.55, 0, 0.16, 0.5, 0, -0.2, 1, 0, -0.02, 0.96, 0, -0.2,
        0, 0, 0.2, 0, 0, -0.24, -0.55, 0, 0.16, -0.5, 0, -0.2, -1, 0, -0.02, -0.96, 0, -0.2, 0, 0.02, 0.42, 0.09, 0, 0, -0.09, 0, 0, 0, 0, -0.5, 0.13, 0, -0.62, -0.13, 0, -0.62,
        0, 0.2, 0.1, 0, -0.2, 0.1, 0.0001, 0, 0.3, 0.16, 0, 0.1, -0.16, 0, 0.1], 3));
      base.setIndex([0, 2, 1, 1, 2, 3, 2, 4, 3, 3, 4, 5, 6, 7, 8, 7, 9, 8, 8, 9, 10, 9, 11, 10, 12, 13, 14, 13, 15, 14, 15, 16, 17, 18, 21, 19, 18, 19, 22, 18, 20, 21, 18, 22, 20]);
      for (let i = 0; i < NB; i++) {
        birds.push({ r: sr.range(10, 30), h: sr.range(3, 16), w: sr.range(0.25, 0.5) * sr.sign(), ph: sr() * TAU, bob: sr.range(1, 4) });
        bQ.set([0, sr() * TAU, 0, sr.range(8, 11)], i * 4); bP.set([0, -1000, 0, i === 0 ? 0 : sr.range(1.0, 1.5)], i * 4);
      }
      var birdGeo = instGeo(base, NB, { iP: bP, iQ: bQ }, true);
      const op = [], oi = [], V = (x, y, z) => { op.push(x, y, z); return op.length / 3 - 1; };
      for (const sg of [1, -1]) {
        const le = [], te = [], NS = 7;
        for (let k = 0; k <= NS; k++) { const sp = 0.1 + 0.9 * k / NS, tip = Math.pow(Math.max(1 - sp, 0), 0.45); le.push(V(sg * sp, 0, 0.2 - 0.07 * sp * sp - 0.2 * (1 - tip))); te.push(V(sg * sp, 0, -0.36 + 0.1 * sp * sp * sp + 0.26 * (1 - tip))); }
        for (let k = 0; k < NS; k++) { if (sg > 0) oi.push(le[k], te[k], le[k + 1], le[k + 1], te[k], te[k + 1]); else oi.push(le[k], le[k + 1], te[k], le[k + 1], te[k + 1], te[k]); }
      }
      const ball = (cx, cy, cz, rx, ry, rz, nu, nv) => {
        const rows = [];
        for (let i = 0; i <= nv; i++) { const ph = Math.PI * i / nv, row = []; for (let j = 0; j < nu; j++) { const th = TAU * j / nu; row.push(V(cx + rx * Math.sin(ph) * Math.cos(th), cy + ry * Math.sin(ph) * Math.sin(th), cz + rz * Math.cos(ph))); } rows.push(row); }
        for (let i = 0; i < nv; i++) for (let j = 0; j < nu; j++) { const a = rows[i][j], b = rows[i][(j + 1) % nu], c = rows[i + 1][j], d = rows[i + 1][(j + 1) % nu]; oi.push(a, c, b, b, c, d); }
      };
      ball(0, -0.02, -0.04, 0.15, 0.15, 0.32, 8, 6);      // body
      ball(0, 0.06, 0.3, 0.165, 0.16, 0.15, 9, 6);        // the big round head
      for (const sg of [1, -1]) { const a = V(sg * 0.07, 0.19, 0.3), b = V(sg * 0.14, 0.17, 0.27), c = V(sg * 0.17, 0.36, 0.25); oi.push(a, b, c); }   // ear tufts
      { const a = V(0, 0, -0.3), b = V(0.17, 0, -0.56), c = V(-0.17, 0, -0.56), d = V(0, 0.01, -0.6); oi.push(a, b, d, a, d, c); }                      // tail fan
      const og = new THREE.BufferGeometry(); og.setAttribute('position', new THREE.Float32BufferAttribute(op, 3)); og.setIndex(oi);
      var owlGeo = instGeo(og, 1, { iP: oP, iQ: oQ }, true);
      const mesh = new THREE.Mesh(birdGeo, new THREE.ShaderMaterial({ vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, fog: true, side: THREE.DoubleSide, uniforms: baseU() }));
      mesh.frustumCulled = false; mesh.name = 'birds'; scene.add(mesh);
      const owl = new THREE.Mesh(owlGeo, mesh.material); owl.frustumCulled = false; owl.name = 'owl'; scene.add(owl);
    }
    await ctx.yield();

    // ---- our mount (ride space: eye at the origin, -Z ahead) and the pine torch -----------------------------
    const mount = new THREE.Group(), torch = new THREE.Group();
    const TIP = new THREE.Vector3(-0.95, -0.2, -1.3);
    {
      const mm = new Acc(), mr = rng.fork('mount'), HORSE = [0.93, 0.2, 0, 0], MANE = [1, 0, 0, 0];
      // neck and poll: rings across X, running forward and up to the ears
      const st = [[-1.62, -0.2, 0.2, 0.3], [-1.42, -0.75, 0.17, 0.27], [-1.22, -1.25, 0.14, 0.23], [-1.07, -1.65, 0.12, 0.19], [-1.0, -1.9, 0.115, 0.15], [-1.04, -2.08, 0.1, 0.12], [-1.16, -2.28, 0.085, 0.1]];
      const rows = st.map(([y, z, rx, ry]) => { const row = []; for (let j = 0; j < 8; j++) { const a = j / 8 * TAU; row.push(mm.v(Math.cos(a) * rx, y + Math.sin(a) * ry, z, ...HORSE)); } return row; });
      mm.grid(rows, true, false);
      // the stiff mane: a comb of blunt tufts along the crest, and the forelock between the ears
      for (let i = 0; i < 13; i++) {
        const f = i / 12, y = lerp(-1.19, -0.86, Math.pow(f, 0.8)), z = lerp(-0.85, -1.84, f), h = mr.range(0.12, 0.17);
        mm.lathe(mr.range(-0.012, 0.012), y, z, h, 5, 2, (t) => 0.05 * (1 - t * 0.8), MANE, (t) => [0, -0.03 * t], 0.8);
      }
      for (let i = 0; i < 4; i++) mm.lathe((i - 1.5) * 0.035, -0.9, -1.98 - 0.02 * (i % 2), 0.1, 5, 2, (t) => 0.035 * (1 - t * 0.7), MANE, (t) => [0, -0.16 * t - 0.1 * t * t], 1);
      for (const sg of [-1, 1]) mm.lathe(sg * 0.095, -0.93, -1.93, 0.27, 6, 4, (t) => 0.012 + 0.052 * Math.sin(Math.PI * Math.min(t * 0.8 + 0.22, 1)), [0.9, 0.5 * 0.6, 0, 0], (t) => [sg * 0.06 * t, -0.05 * t], 0.62);
      const mMat = new THREE.ShaderMaterial({ vertexShader: MOUNT_VERT, fragmentShader: MOUNT_FRAG, fog: true, side: THREE.DoubleSide, uniforms: { ...baseU(), uCaveK, uFlame, uInk: { value: hour === 'night' ? new THREE.Color(PALETTE[2]).multiplyScalar(0.1) : U.uChar.value } } });
      const horse = new THREE.Mesh(mm.geo(), mMat); horse.frustumCulled = false; mount.add(horse);
      const tt = new Acc();
      tt.lathe(0, -0.62, 0, 0.62, 6, 3, (t) => 0.024 + 0.012 * t, [1, 0.3, 1, 0], (t) => [0.1 * (1 - t) * -1, 0.4 * (1 - t)]);
      const card = (kind, w) => { const a = tt.v(0, 0, 0, 0, 0, kind, w, 0, 0), b = tt.v(0, 0, 0, 0, 0, kind, w, 1, 0), c = tt.v(0, 0, 0, 0, 0, kind, w, 0, 1), d = tt.v(0, 0, 0, 0, 0, kind, w, 1, 1); tt.i.push(a, b, c, b, d, c); };
      for (let i = 0; i < 11; i++) card(3, (i + mr() * 0.6) / 11);
      card(2, 0);
      const tm = new THREE.Mesh(tt.geo(), mMat); tm.frustumCulled = false; torch.add(tm); torch.position.copy(TIP); mount.add(torch);
      mount.name = 'mount'; scene.add(mount);
    }

    // ---- the flight ------------------------------------------------------------------------------------------
    const poiA = new THREE.Vector3(), poiS = new THREE.Vector3(), poiB = new THREE.Vector3(), poiP = new THREE.Vector3(), poiW = new THREE.Vector3(), poiK = new THREE.Vector3(), poiV = new THREE.Vector3(PE.x, WATER + 19, PE.z), poiC = new THREE.Vector3().copy(PE).setY(PE.y + 3), poiR = new THREE.Vector3(RC.x, groundAt(RC.x, RC.z) + 1.3, RC.z);
    const poiPr = new THREE.Vector3(lineL(-598), 22, -598);
    const pois = [
      // the stallion at our right knee, from the moment the herd unrolls off the rock until the stag crosses
      { at: () => { hero.runnerAt(0, poiA); poiA.y += 2.6; return poiA; }, from: 0.09, to: 0.215, weight: 0.46, fade: 0.25 },
      { at: poiV, from: 0.125, to: 0.235, weight: 0.5 },                                                               // down the scree the eye is lifted to the valley and the far arch, not the ground
      { at: () => { hero.runnerAt(0, poiS); poiS.y += 1.85; return poiS; }, from: 0.165, to: 0.4, weight: 0.9, fade: 0.2 },
      // the same again: two pulls leave the ordinary camera where one strong pull would, and give the steady camera (a third of each) half the turn, enough to hold him whole
      { at: () => { hero.runnerAt(0, poiS); poiS.y += 1.85; return poiS; }, from: 0.19, to: 0.4, weight: 0.65, fade: 0.22 },
      { at: poiR, from: 0.414, to: 0.487, weight: 0.85 },                                                               // the sparring rhinos: let go as we pass them, never looked back at
      { at: poiR, from: 0.419, to: 0.487, weight: 0.5 },                                                              // (and again, for the steady camera)
      { at: () => { hero.runnerAt(0, poiP); poiP.y += 1.6; return poiP; }, from: 0.462, to: 0.6, weight: 0.5, fade: 0.25 },   // the pack surging back past our knee
      { at: (t, u) => { side(u * L + 22, 23, 0, poiB); poiB.y += 3.2; return poiB; }, from: 0.49, to: 0.577, weight: 0.72 },   // the mammoth file against the ice
      { at: (t, u) => { side(u * L + 22, 23, 0, poiB); poiB.y += 3.2; return poiB; }, from: 0.525, to: 0.628, weight: 0.4, fade: 0.4 },         // ...let go of slowly, so the turn to the prow is one long pan
      { at: poiPr, from: 0.562, to: 0.715, weight: 0.34, fade: 0.37 },                                                              // the prow and its giants, the herd wheeling under them
      { at: () => { hero.runnerAt(0, poiW); poiW.y += 1.5; return poiW; }, from: 0.583, to: 0.705, weight: 0.26, fade: 0.4 },              // the stallion wheeling the pack across our front
      { at: () => hero.actorAt(bison[0], poiK).setY(poiK.y + 1.6), from: 0.665, to: 0.84, weight: 0.27 },                                     // the lead bull of the stampede at our right knee
      { at: poiC, from: 0.7, to: 0.92, weight: 0.3 },                                                                   // the arch, with the bison right and the lion left of it
    ];
    const buf = new THREE.Vector2(), tq = new THREE.Vector3(), tl = new THREE.Vector3(), tr = new THREE.Vector3(), tf = new THREE.Vector3();
    const owlS = new THREE.Vector3().copy(PE).addScaledVector(R, -4).addScaledVector(E, 2).setY(PE.y + 8.5);
    const owlE = new THREE.Vector3().copy(PE).addScaledVector(R, -4.6).addScaledVector(E, -62).setY(PE.y + 2.6);
    const crown = new THREE.Vector3().copy(PE).addScaledVector(E, 4).setY(WATER + 30);
    const wetD = new Float32Array(8), wetX = new Float32Array(8), wetZ = new Float32Array(8), camW = new THREE.Vector3();

    const update = (dt, time, camera, u) => {
      const d = u * L;
      // scripted cast, all keyed to u
      for (const a of deer) a.t = clamp((70 + a.lead + (u - 0.395) * L * 0.9) / 165, 0, 1);
      for (const a of rhinos) a.t = 0.515 + 0.04 * Math.sin(time * 1.3) + 0.008 * Math.sin(time * 3.1 + a.sg);
      const aOff = 46 * (1 - ss(0.27, 0.39, u)) - 8 * ss(0.39, 0.46, u) - 70 * ss(0.455, 0.57, u);
      for (const a of bulls) a.t = 0.44 + 0.01 * Math.sin(time * 0.3 + a.sg);
      // the four near bulls gallop on ahead of us again once the rhinos are behind (so the left of the frame is never empty), and fall back before the lion comes
      const aSurge = ss(0.455, 0.5, u), aBack = ss(0.56, 0.66, u), aOff4 = 46 * (1 - ss(0.3, 0.428, u)) - 8 * ss(0.44, 0.47, u);
      for (const a of aurochs) a.t = clamp((d + a.ahead + (a.surge > 0 ? aOff4 + a.surge * aSurge - (70 + a.surge) * aBack : aOff) - 200) / 450, 0, 1);
      for (const a of mammoths) a.t = clamp((122 - 6.4 * a.k + 0.08 * d) / 280, 0, 1);
      // the outrunners loop across the daylight of the mouth while the eye is deep in the hall; as it nears they are swept down the scree and dissolve
      const oSweep = ss(0.05, 0.115, u), oScale = lerp(2.3, 1, ss(0.015, 0.095, u));
      for (const a of outrun) { const x = time * a.v + a.ph; a.t = Math.max(x - Math.floor(x), oSweep); hero.rescale(a, oScale * a.s0); }
      for (const a of bison) a.t = clamp((d + a.ahead + (52 + a.ahead * 0.8 - a.ahead) * (1 - ss(0.52, 0.66, u)) - (a.ahead + 34) * ss(0.9, 0.96, u) - 250) / 475, 0, 1);
      for (const a of lions) a.t = clamp((d - 25 + 40 * ss(0.6, 0.675, u) - 46 * ss(0.885, 0.95, u) - a.back - 430) / 270, 0, 1);
      for (const a of prowHerd) a.t = a.t0 + 0.09 * ss(0.5, 0.72, u);
      const camZ = fastPos(d, tq).z;
      for (const a of giants) a.t = a.k < 3 ? clamp((-150 - Math.min(a.z0, camZ - a.run)) / (-150 - a.zEnd), 0, 1) : clamp((-150 - a.z0 + a.run * clamp((u - a.u0) / (a.u1 - a.u0), 0, 1)) / 306, 0, 1);
      for (const a of strays) a.t = clamp((d + lerp(-8, a.peak, ss(0.492, 0.518, u)) - (a.peak + 9) * ss(0.528, 0.56, u) - 366) / 234, 0, 1);
      // the pack holds close ahead of us down the scree, then spreads to its own places; the stallion stays at the knee
      const kb = 1 - ss(0.185, 0.27, u), kr = ss(0.6, 0.68, u), kf = ss(0.86, 0.93, u);   // the burst; the ramp; the run in to the arch
      const crowd = ss(0.272, 0.322, u) * (1 - ss(0.362, 0.392, u));             // the pack closes round the stallion
      const crowd5 = ss(0.262, 0.335, u) * (1 - ss(0.362, 0.392, u));            // (the one that drops back to our knee takes longer over it)
      const shy = ss(0.375, 0.445, u) * (1 - ss(0.462, 0.5, u));                 // the herd drops back and swings wide of the sparring rhinos, then surges past our knee again
      const km = ss(0.45, 0.5, u);                                               // the pack in formation in front of the mammoth file, until the stallion wheels it across our front
      const kl = ss(0.785, 0.85, u);                                              // the two on our left come up beside us as the lion falls away
      for (let i = 1; i <= 5; i++) {
        const e = escorts[i];
        e.along = lerp(lerp(e.side > 0 ? lerp(lerp(lerp(lerp(KNEE[i], CROWD[i], i === 5 ? crowd5 : crowd), MID[i], km), -3 - i, shy), WRAMP[i], kr) : lerp(e.along0, LRAMP[i], kl), FINAL[i], kf), PACK[i][1], kb);
      }
      // the stallion: 6.6 m ahead in the burst, closing to 5.3 m ahead at 4.2 m off the knee (u 0.26-0.36), out to 7.5 for the stag, then leading the pack back and round
      const sA = lerp(lerp(SCLOSE, 7.5, ss(0.335, 0.39, u)), MID[0], km);
      escorts[0].along = lerp(lerp(lerp(sA - 9.5 * shy, WRAMP[0], kr), FINAL[0], kf), PACK[0][1], 1 - ss(0.17, 0.25, u));
      if (peeler) { peeler.along = lerp(peeler.along0, dM + FIN + 1.4 - 0.16 * L, 1 - ss(0.19, 0.27, u)); peeler.wig = ss(0.19, 0.27, u); }
      for (let i = 0; i <= 5; i++) escorts[i].wig = (1 - 0.85 * kb) * (1 - 0.75 * Math.max(crowd, bell(u, 0.56, 0.7, 0.2), kl));
      escorts[0].wig *= 1 - 0.7 * bell(u, 0.2, 0.42, 0.2);   // he holds his place through the close pass
      for (const a of ibex) { const x = time / 110 + a.k / 5; a.t = x - Math.floor(x); }
      for (const m of lateCast) m.visible = u > 0.1;
      for (const m of bisonMesh) m.visible = u > 0.22;
      hero.setProgress(u);
      hero.update(dt, time, camera);

      // travel frame at the eye
      fastPos(d, tq); fastTan(d, tf);
      const hl = Math.hypot(tf.x, tf.z) || 1; tr.set(-tf.z / hl, 0, tf.x / hl);
      // the torch: a pool of light that rides with us, flung left at the mouth
      const k = ss(0.122, 0.172, u);
      tl.copy(tq).addScaledVector(tr, -3.0 - 4 * k + 0.4 * Math.sin(time * 2.3)).addScaledVector(tf, 3.0 + 0.4 * Math.cos(time * 1.7)); tl.y += -0.9 + 1.2 * Math.sin(Math.PI * k);
      hero.setTorch(tl, 1 - k);
      // through the previous portal (u exactly 0) the whole hall is warm; once inside, the light draws in within half a second to a
      // pool round the brand on the lower left (floor, near wall and the nearest paintings), and the daylight reaches only the last of the gallery: the dark, then the gasp
      const wide = (1 - ss(0, 0.012, u)) ** 2;
      U.uTorchR.value = lerp(27, 60, ss(0.085, 0.125, u)) + 286 * wide; U.uMouth.value.w = 22 - 13 * bell(u, 0.035, 0.118, 0.35) + 36 * wide;
      U.uHearth.value.w = 0.95 * (1 + 0.08 * Math.sin(time * 2.9) + 0.05 * Math.sin(time * 7.3));
      U.uTorch.value.w *= 1 + 0.13 * Math.sin(time * 3.1);
      uCaveK.value = 1 - ss(dM - 8, dM + 5, d);
      uFlame.value = 1 - ss(0.8, 1, k);
      torch.visible = k < 0.999;
      torch.position.set(TIP.x - 4.5 * k, TIP.y + 1.5 * Math.sin(Math.PI * k * 0.9) - 1.8 * k * k, TIP.z - 1.2 * k);
      torch.rotation.z = k * 5.5;
      // the mount: ears, forelock and mane at the bottom of the frame, nodding once a stride
      const stride = d / 8.4 * TAU;
      // seen through the previous portal (u exactly 0) the horse is hidden (it is only a neck and ears, built to be seen from the saddle) and its
      // place, which the splashes read, is the entry point
      if (u > 0) mount.position.setFromMatrixPosition(camera.matrixWorld); else mount.position.copy(path.start);
      mount.visible = u > 0;
      const cx = mount.position.x, cz = mount.position.z;
      // on a tall, narrow screen the view opens downward: the horse is carried lower so the ears keep to the foot of the frame
      // (the ears keep to the foot of the frame, under an eighth of it; the head nods with the stride, swings a little from side
      // to side every other stride and is tossed now and then, so it is never in the same place twice)
      const toss = Math.max(0, Math.sin(d / 61 + 0.8)) ** 6;
      mount.position.y += 0.035 * Math.sin(stride + 1) - 0.3 + 0.1 * toss - 0.62 * clamp((Math.tan((camera.fov || 62) * Math.PI / 360) - 0.62) / 0.39, 0, 1);
      mount.rotation.set(Math.asin(clamp(tf.y, -1, 1)) + 0.05 * Math.sin(stride) + 0.012 * Math.sin(time * 2.3) + 0.05 * toss,
        Math.atan2(-tf.x, -tf.z) + 0.075 * Math.sin(stride * 0.5 + 0.6) + 0.05 * Math.sin(d / 37 + 2.0) + 0.012 * Math.sin(time * 1.3), 0.035 * Math.sin(stride * 0.5 + 2.1), 'YXZ');

      // the grass carpet wraps round a point a little ahead of the eye
      camera.getWorldPosition(camW); uCtr.value.set(camW.x + tf.x / hl * 12, 0, camW.z + tf.z / hl * 12);

      ctx.renderer.getDrawingBufferSize(buf);
      uPx.value = 2 * Math.tan((camera.fov || 62) * Math.PI / 360) / Math.max(buf.y, 1);

      // splashes and wakes: us and the nearest horses that are in the water
      emit[0].set(cx + tf.x * 4.2, WATER, cz + tf.z * 4.2, groundAt(cx, cz) < WATER - 0.1 ? 1 : 0);
      let nw = 0;
      if (d > L - 170) for (let i = 0; i < nHorses; i++) {
        hero.runnerAt(i, tq); if (tq.y >= WATER - 0.1) continue;
        const dd = Math.hypot(tq.x - cx, tq.z - cz); if (dd > 90) continue;
        let j = Math.min(nw, 6); if (nw === 7 && dd >= wetD[6]) continue;
        while (j > 0 && wetD[j - 1] > dd) { wetD[j] = wetD[j - 1]; wetX[j] = wetX[j - 1]; wetZ[j] = wetZ[j - 1]; j--; }
        wetD[j] = dd; wetX[j] = tq.x; wetZ[j] = tq.z; if (nw < 7) nw++;
      }
      for (let i = 1; i < 8; i++) { if (i <= nw) emit[i].set(wetX[i - 1], WATER, wetZ[i - 1], 1); else emit[i].set(0, -1000, 0, 0); }
      // long before the river the same dabs are the turf the rhinos throw up, at their fore and hind feet
      const turf = ss(0.3, 0.36, u) * (1 - ss(0.5, 0.56, u));
      turfCol.copy(U.uRed.value).multiplyScalar(0.9);
      splashCol.copy(U.uPale.value).multiplyScalar(0.98).lerp(turfCol, 1 - ss(0.56, 0.62, u));
      if (turf > 0.01) for (let i = 0; i < 2; i++) {
        const a = rhinos[i]; hero.actorAt(a, tq);
        emit[1 + i * 2].set(tq.x - a.sg * RAX * 1.5, tq.y + 0.05, tq.z - a.sg * RAZ * 1.5, turf);
        emit[2 + i * 2].set(tq.x + a.sg * RAX * 1.4, tq.y + 0.05, tq.z + a.sg * RAZ * 1.4, turf * 0.8);
      }

      // choughs wheeling over the arch; the owl drops out of it as we come in
      const ko = ss(0.91, 1, u);
      oP[0] = lerp(owlS.x, owlE.x, ko); oP[1] = lerp(owlS.y, owlE.y, ko) - Math.sin(Math.PI * ko) * 1.2; oP[2] = lerp(owlS.z, owlE.z, ko); oP[3] = u > 0.9 ? 1.7 : 0;
      oQ[0] = Math.atan2(-E.x, -E.z); owlGeo.attributes.iP.needsUpdate = true; owlGeo.attributes.iQ.needsUpdate = true;
      for (let i = 1; i < NB; i++) {
        const b = birds[i], an = time * b.w + b.ph, c = Math.cos(an), s = Math.sin(an);
        bP[i * 4] = crown.x + c * b.r; bP[i * 4 + 1] = crown.y + b.h + Math.sin(time * 0.6 + b.ph) * b.bob; bP[i * 4 + 2] = crown.z + s * b.r * 0.7;
        bQ[i * 4] = Math.atan2(-s * b.w, c * 0.7 * b.w);
      }
      birdGeo.attributes.iP.needsUpdate = true; birdGeo.attributes.iQ.needsUpdate = true;

      // the rare stencil: red ochre blown across the sky, one vast hand left bare
      if (rare) skyU.uStencil.value.set(ss(0.5, 0.52, u) * (1 - ss(0.6, 0.66, u)), ss(0.5, 0.56, u), 1, 0);
    };

    return {
      scene, path, duration: 40,
      // a canter in the dark hall, a little held at the burst, the stallion's closest pass and the mammoth file; a gallop between
      pace: (u) => 1.1 - 0.3 * (1 - ss(0.085, 0.17, u)) - 0.1 * bell(u, 0.24, 0.37, 0.3) - 0.1 * bell(u, 0.47, 0.7, 0.3) - 0.1 * ss(0.86, 0.95, u),
      title: weather === 'loess' ? 'The Running Wall, loess storm' : weather === 'snow' ? 'The Running Wall, first snow' : hour === 'night' ? 'The Running Wall, engraved' : 'The Running Wall',
      camera: { fov: 62, near: 0.3, far: 5200, lookAhead: 30, sway: 0.8, bank: 0.6 },
      pois,
      // dewash 0: the kit's take-back of our glow goes below zero where the next world is dark (47 negative pixels at the arch); our bloom is too faint to wash the opening
      portal: { shape: 'circle', radius: 6, color: '#F0B060', glow: 1, revealDistance: 300, dewash: 0 },
      post: { exposure, bloom: { strength: 0.3, radius: 0.5, threshold: 1.0 },
        grade: { saturation: 1.06, contrast: 1.05, tint: '#ffffff', shadowTint: '#140c06', vignette: 0.3, grain: 0.03, aberration: 0 } },
      ride: 'none', style: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
