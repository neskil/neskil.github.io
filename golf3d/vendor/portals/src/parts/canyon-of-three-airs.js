// CANYON OF THREE AIRS: hero set piece = BILLOW FOUR, the curl on the rose/amber surface (S1).
//
// WHAT     A never-breaking curl of heavy amber gas under rose air, built as real rolled geometry: a back slope that
//          rises to the crest, a lip thrown forward over a barrel 100 m tall and wound up at its edge into a rolled
//          rim (1.75 turns in all, a curve of steadily tightening curvature so it can never cross itself), a steep
//          concave face running in under it, and calm aprons of S1 skin before and behind. Toward both ends the
//          curl unwinds and the barrel opens. On it: glitter wind-rows and pulses of denser gas that climb the face
//          and go over the lip (the roll turns in place), a cream meniscus on the rim, a sun-smeared luminous roof
//          inside the barrel, 160 filaments that arch off the lip, stretch, thin and are wound back in, 54
//          bell-floaters (40 as a herd on the face) each with a bright ring on the skin, and two smaller curls of
//          the train standing behind.
// FRAME    Origin = the calm S1 level (y 0) under the crest at mid-length. Crest line along X, lip thrown toward +Z
//          (front), train behind at -Z. Crest about y +115, rim hanging at y 45-75 about 95 m in front of the crest,
//          trough y -35 about 150 m in front. In the world: rotate so the crest line lies 50 degrees off the canyon
//          axis and put y 0 at the mean S1 height. radius 430 (viewer framing; true half-length 600), height 170.
// OPTS     palette   7 hex strings in the brief's order (rose, amber, teal, cream, plum, rust, deep teal)
//          detail    0.6-1: thins filaments (160 -> 128), the stray floaters (14 -> 0) and the train's mesh
//          height    crest to trough, default 150;  length  default 1200;  turns  default per seed 1.68-1.84
//          train     0-3 smaller curls behind (default 2);  floaters  count (default 54, 0 = none)
//          flowSpeed m/s the pattern travels round the roll (default 6)
//          sun       { direction: Vector3 toward the sun (hero-local), color: linear Color x intensity (about 0.9) }
// LIGHT    Unlit by scene lights: its ShaderMaterials take one key and one fill through hero.setSun(dir, color) and
//          hero.setFill(color) (call them every frame if the camera's layer re-colours the light; they are plain
//          uniforms). Default key (0.92, 0.77, 0.74) from (-0.6, 0.7, 0.4), fill rose x 0.5. Looks best with the sun
//          behind or beside the lip so the rim and the barrel roof glow. Scene fog is applied (fog chunks).
// PER SEED how tightly it is wound, lean and scallops of the lip, where it peaks and how long it tapers, the slant of
//          the crest line, amber hue, wind side of the filaments, herd position, spacing and size of the train.
// MOTION   update(dt, time): everything runs on world time in shaders (flow round the roll, swell of the aprons,
//          breathing lobes, twinkling glitter, filament life cycles of 13-26 s, bells pulsing once in 4 s, bobbing,
//          rings spreading). Nothing is keyed to arrival, so there is no setProgress. hero.keepBellsOff(line, gap, clear), awaited once by the world when its route is made, seats the floaters clear of the flown line (bellsOff, below).
// ANCHORS  (hero-local) flyThrough: 11 points along +X, the surf run: rim 21 m above and 13 m to starboard, the face
//          40-60 m below to port (the filaments cross this line: they are wisps, not obstacles); rimLine: the cream
//          rim at the same stations; faceLine: 11 points ON the face through the herd (fly 9-15 m off it for the
//          bells); herd; approach; dropIn; troughExit (the trough at the +X end, where to dive through the skin);
//          crest; core; axis; front; train (centres of the curls behind); extent { halfLength, back, front, crestY,
//          troughY }. Also hero.lipPoint(x, deg), hero.facePoint(x, u) and hero.swellAt(x, z, t) / SWELL_GLSL: the
//          aprons ride that swell and fade to alpha 0 at their outer edges (z = extent.back / front and the last
//          45 m in x), so a world S1 sheet using the same swell meets them without a step.
// COST     about 100k triangles, 8 draw calls (hero 2, train 2 each, filaments 1, bells 1), 5 programs, no textures,
//          no lights, about 170 ms of build in steps under 50 ms.
import * as THREE from 'three';
import { clamp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#F4B8C4', '#F0B254', '#2FA7A0', '#F7F1E6', '#5A3F52', '#C4472E', '#12494E'];
const TAU = Math.PI * 2;

// ---- the profile of the curl at one station along the roll -------------------------------------------------
// Returns two polylines in the (z, y) plane, each with arc length s increasing along the flow:
//   roll: back apron -> up the back -> over the crest -> lip -> spiral in to the core
//   face: front apron -> trough -> under the scroll -> up the inside of the back
// P = { R, zc, yc, turns, lean, tight, Zb, Zf, lobe }
function hermite(p0, m0, p1, m1, t) {
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * m1;
}
const TH0 = 30 * Math.PI / 180;               // slope of the back where the lip takes over
// The lip is a curve of steadily tightening curvature (so it can never cross itself): one broad arc thrown
// forward over the barrel, then a rolled rim wound up at its edge. psi = how far the tangent has turned.
function lipCurve(P, NS, zy, off) {
  const PSI = P.turns * TAU, r0 = 0.62 * P.R, full = P.turnsFull * TAU, SUB = 3;
  let z = P.zc, y = 1.55 * P.R;
  zy[off * 2] = z; zy[off * 2 + 1] = y;
  for (let j = 1; j < NS; j++) {
    for (let k = 0; k < SUB; k++) {
      const psi = ((j - 1 + (k + 0.5) / SUB) / (NS - 1)) * PSI, d = psi / 3.3161;      // 190 degrees
      const g = (0.26 + 0.1 * P.lobe) * (1 - 0.6 * psi / full) + (0.74 + 0.3 * P.lobe) * Math.exp(-d * d * d);
      const th = TH0 - psi, ds = r0 * g * PSI / ((NS - 1) * SUB);
      z += Math.cos(th) * ds * (1.3 + P.lean); y += Math.sin(th) * ds;
    }
    zy[(off + j) * 2] = z; zy[(off + j) * 2 + 1] = y;
  }
}
function rollProfile(P, NA, NS, zy) {        // NA apron points + NS lip points -> zy[2*(NA+NS)]
  lipCurve(P, NS, zy, NA);
  const az = zy[NA * 2], ay = zy[NA * 2 + 1], tz = Math.cos(TH0), ty = Math.sin(TH0);
  const z0 = -P.Zb, span = az - z0, m = span * 1.2;
  for (let j = 0; j < NA; j++) {
    const u = j / NA, t = Math.pow(u, 0.8);   // denser toward the roll
    zy[j * 2] = hermite(z0, m, az, tz * m * 0.9, t);
    zy[j * 2 + 1] = hermite(0, 0, ay, ty * m * 0.9, t);
  }
}
// Catmull-Rom through control points (z, y), uniform
function crom(c, t, out) {
  const n = c.length / 2 - 1, x = clamp(t, 0, 1) * n, i = Math.min(n - 1, Math.floor(x)), f = x - i;
  for (let k = 0; k < 2; k++) {
    const p0 = c[Math.max(0, i - 1) * 2 + k], p1 = c[i * 2 + k], p2 = c[(i + 1) * 2 + k], p3 = c[Math.min(n, i + 2) * 2 + k];
    out[k] = 0.5 * (2 * p1 + (p2 - p0) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (3 * p1 - p0 - 3 * p2 + p3) * f * f * f);
  }
  return out;
}
function faceProfile(P, NF, zy) {
  const R = P.R, zs = P.zc, tr = P.trough;
  const c = [
    P.Zf, 0,
    zs + Math.max(3.9 * R, P.Zf * 0.6), -0.1 * tr,
    zs + 2.9 * R, -0.55 * tr,
    zs + 2.1 * R, -0.95 * tr,
    zs + 1.35 * R, -0.9 * tr,
    zs + 0.72 * R, -0.12 * R,
    zs + 0.26 * R, 0.42 * R,
    zs - 0.03 * R, 0.84 * R,
    zs - 0.09 * R, 1.2 * R,
    zs - 0.04 * R, 1.46 * R,
    zs + 0.16 * R, 1.595 * R,
  ];
  const o = [0, 0];
  for (let j = 0; j < NF; j++) {
    const u = j / (NF - 1), t = u < 0.25 ? u * 1.2 : 0.3 + (u - 0.25) * (0.7 / 0.75);   // fewer points on the flat apron
    crom(c, t, o); zy[j * 2] = o[0]; zy[j * 2 + 1] = o[1];
  }
}

// ---- station parameters along the roll (per-seed character lives in G) -------------------------------------
function makeStations(ctx, G) {
  const N = ctx.noise, o = G.nOff;
  return function station(x, P = {}) {
    const e = G.L * 0.5 - Math.abs(x);
    const tp = smoothstep(0, G.taper * (x < 0 ? G.taperSkew : 2 - G.taperSkew), e);
    const big = N.n2(x / 150 + o, 3.1), mid = N.n2(x / 41 + o, 9.7), sl = N.n2(x / 290 + o, 17.3);
    P.tp = tp;
    P.R = G.R0 * (0.05 + 0.95 * tp) * (1 + 0.2 * big + 0.03 * mid) * (0.9 + 0.16 * Math.sin((x / G.L) * 5.1 + G.nOff)) * G.scale;
    P.zc = (24 * sl + 7 * N.n2(x / 70 + o, 23.9)) * G.scale + G.skew * x;
    P.yc = 0.72 * P.R;
    P.turnsFull = G.turns;
    const tu = smoothstep(0, G.taper * 1.9, e);            // toward its ends the curl unwinds: the barrel opens
    P.turns = (G.turns + 0.1 * N.n2(x / 210 + o, 31.3)) * (0.07 + 0.93 * tu * tu * (3 - 2 * tu));
    P.tight = 0.72 + 0.05 * N.n2(x / 120 + o, 41.9);
    P.lean = 0.22 + 0.1 * big;
    const rg = 1 - Math.abs(N.n2(x / 105 + o, 57.1) * 0.75 + N.n2(x / 37 + o, 77.7) * 0.25);
    P.lobe = 0.1 + 0.3 * rg * rg;                    // scalloped lip: tongues where filaments shed
    P.trough = 0.5 * P.R;
    P.Zb = G.Zb; P.Zf = G.Zf;
    return P;
  };
}

// ---- sweep the two profiles along X into one geometry with two groups (0 opaque roll, 1 blended aprons) -----
async function sweepBillow(ctx, G, station, NX, NA, NS, NF) {
  const NR = NA + NS, NJ = NR + NF, NV = (NX + 1) * NJ;
  const pos = new Float32Array(NV * 3), nor = new Float32Array(NV * 3), aM = new Float32Array(NV * 4), aSD = new Float32Array(NV * 2);
  const zr = new Float32Array(NR * 2), zf = new Float32Array(NF * 2), P = {};
  for (let i = 0; i <= NX; i++) {
    const x = -G.L / 2 + (i / NX) * G.L;
    station(x, P); rollProfile(P, NA, NS, zr); faceProfile(P, NF, zf);
    const xe = smoothstep(0, 45, G.L / 2 - Math.abs(x));
    // roll
    let s = 0, sAtSpiral = 0;
    for (let j = 1; j <= NA; j++) sAtSpiral += Math.hypot(zr[j * 2] - zr[j * 2 - 2], zr[j * 2 + 1] - zr[j * 2 - 1]);
    for (let j = 0; j < NR; j++) {
      const v = i * NJ + j;
      if (j > 0) s += Math.hypot(zr[j * 2] - zr[j * 2 - 2], zr[j * 2 + 1] - zr[j * 2 - 1]);
      pos[v * 3] = x; pos[v * 3 + 1] = zr[j * 2 + 1]; pos[v * 3 + 2] = zr[j * 2];
      const f = j < NA ? 0 : (j - NA) / (NS - 1);                        // 0 at the crest side .. 1 at the core
      const ang = f * P.turns * 360;                                 // degrees round the spiral
      aM[v * 4] = j < NA ? 1 - smoothstep(0.15, 0.7, j / NA) : 0;           // apron
      aM[v * 4 + 1] = j < NA ? smoothstep(0, 0.3, j / NA) * (j < NA * 0.72 ? xe : 1) : 1;   // edge alpha
      aM[v * 4 + 2] = Math.max(Math.exp(-Math.pow((ang - 205) / 75, 2)) * smoothstep(60, 150, P.turns * 360), j < NA ? 0 : 0.5 * Math.exp(-Math.pow((ang - 48) / 28, 2)), smoothstep(0.9, 1, f) * (1 - smoothstep(190, 330, P.turns * 360)));     // lip-ness: thin bright lip, front of the first turn
      aM[v * 4 + 3] = 1 - smoothstep(2, 12, Math.abs(j - NA - 2));              // pin: no ripple where the face tucks in under the crest
      aSD[v * 2] = s - sAtSpiral; aSD[v * 2 + 1] = smoothstep(290, 470, ang);
    }
    // face
    s = 0;
    for (let j = 0; j < NF; j++) {
      const v = i * NJ + NR + j, u = j / (NF - 1);
      if (j > 0) s += Math.hypot(zf[j * 2] - zf[j * 2 - 2], zf[j * 2 + 1] - zf[j * 2 - 1]);
      pos[v * 3] = x; pos[v * 3 + 1] = zf[j * 2 + 1]; pos[v * 3 + 2] = zf[j * 2];
      aM[v * 4] = 1 - smoothstep(0.08, 0.27, u);
      aM[v * 4 + 1] = smoothstep(0, 0.07, u) * (u < 0.2 ? xe : 1);
      aM[v * 4 + 2] = 0; aM[v * 4 + 3] = 2 + smoothstep(0.7, 0.95, u);      // 2 + pin marks the face (the roll keeps 0..1)
      aSD[v * 2] = s; aSD[v * 2 + 1] = smoothstep(0.62, 0.97, u) * 0.4;
    }
    if (i % 10 === 9) await ctx.yield();
  }
  // normals from the grid (dP/dj x dP/dx), flipped for the face so both point into the upper gas
  const gp = (i, j, k) => pos[(i * NJ + j) * 3 + k];
  for (let i = 0; i <= NX; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(NX, i + 1);
    for (let j = 0; j < NJ; j++) {
      const face = j >= NR, lo = face ? NR : 0, hi = face ? NJ - 1 : NR - 1;
      const j0 = Math.max(lo, j - 1), j1 = Math.min(hi, j + 1);
      const ax = gp(i, j1, 0) - gp(i, j0, 0), ay = gp(i, j1, 1) - gp(i, j0, 1), az = gp(i, j1, 2) - gp(i, j0, 2);
      const bx = gp(i1, j, 0) - gp(i0, j, 0), by = gp(i1, j, 1) - gp(i0, j, 1), bz = gp(i1, j, 2) - gp(i0, j, 2);
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      const l = Math.hypot(nx, ny, nz), sg = (face ? -1 : 1) / (l > 1e-9 ? l : 1);
      const v = (i * NJ + j) * 3;
      if (l > 1e-9) { nor[v] = nx * sg; nor[v + 1] = ny * sg; nor[v + 2] = nz * sg; } else { nor[v + 1] = 1; }
    }
    if (i % 16 === 15) await ctx.yield();
  }
  const solid = [], sheet = [];
  for (let i = 0; i < NX; i++) {
    for (let j = 0; j < NJ - 1; j++) {
      if (j === NR - 1) continue;
      const face = j >= NR, a = i * NJ + j, b = a + 1, c = a + NJ, d = c + 1;
      const tgt = Math.max(aM[a * 4], aM[b * 4]) > 1e-4 ? sheet : solid;
      if (face) tgt.push(a, c, b, b, c, d); else tgt.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aM', new THREE.BufferAttribute(aM, 4));
  g.setAttribute('aSD', new THREE.BufferAttribute(aSD, 2));
  g.setIndex(solid.concat(sheet));
  g.addGroup(0, solid.length, 0); g.addGroup(solid.length, sheet.length, 1);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 30, 0), Math.hypot(G.L / 2, Math.max(G.Zb, G.Zf)) + 60);
  return g;
}

// ---- shared GLSL ------------------------------------------------------------------------------------------
// SWELL: the slow swell of the S1 skin in the hero's local x, z (metres) and time. The world's S1 sheet should use
// the same three sines (after transforming into the hero's frame) so its skin meets these aprons without a step.
export const SWELL_GLSL = /* glsl */`
float c3aSwell(vec2 p, float t){
  return 2.2*sin(0.011*p.x+0.017*p.y+0.31*t)+1.4*sin(-0.023*p.x+0.009*p.y+0.43*t+1.3)+0.8*sin(0.017*p.x+0.041*p.y+0.6*t+4.1);
}`;
export function swellAt(x, z, t) {
  return 2.2 * Math.sin(0.011 * x + 0.017 * z + 0.31 * t) + 1.4 * Math.sin(-0.023 * x + 0.009 * z + 0.43 * t + 1.3) + 0.8 * Math.sin(0.017 * x + 0.041 * z + 0.6 * t + 4.1);
}
const NOISE_GLSL = /* glsl */`
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y); }
float fb(vec2 p){ return vn(p)*0.55+vn(p*2.13+7.7)*0.3+vn(p*4.31+3.1)*0.15; }
`;

// SKIN: what a calm gas surface carries when it is seen from above (needs h21 and vn): the slope of the slow swell, a
// drifting chop of mid and small swells, and cells of mineral scum whose walls are thin cream lines with here and
// there a small raft riding at a cell's heart. Nothing in it is stretched along one direction, so no view down any
// axis turns it into streaks.
export const SKIN_GLSL = /* glsl */`
vec2 c3aSwellG(vec2 p, float t){
  float a = cos(0.011*p.x+0.017*p.y+0.31*t), b = cos(-0.023*p.x+0.009*p.y+0.43*t+1.3), c = cos(0.017*p.x+0.041*p.y+0.6*t+4.1);
  return vec2(0.0242*a - 0.0322*b + 0.0136*c, 0.0374*a + 0.0126*b + 0.0328*c);
}
float c3aChop(vec2 p, float t, float fine){
  return 2.6*vn(p*0.021 + vec2(0.05*t, -0.03*t)) + 1.1*vn(p*0.058 + vec2(-0.07*t, 0.06*t) + 5.0) + 0.36*fine*vn(p*0.21 + vec2(0.13*t, 0.09*t) + 11.0);
}
// x = distance to the nearest cell wall (0 on the wall), y = hash of the cell, zw = offset to the cell's heart
vec4 c3aCells(vec2 p){
  vec2 ci = floor(p), cf = fract(p); float d1 = 8.0, d2 = 8.0, h1 = 0.0; vec2 o1 = vec2(0.0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)); float h = h21(ci + g);
    vec2 o = g + 0.04 + 0.92*vec2(h, fract(h*7.13 + 0.31)) - cf; float d = dot(o, o);
    if (d < d1) { d2 = d1; d1 = d; o1 = o; h1 = h; } else if (d < d2) { d2 = d; }
  }
  return vec4(sqrt(d2 + 1e-6) - sqrt(d1 + 1e-6), h1, o1);
}`;

const BILLOW_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aM; attribute vec2 aSD;
uniform float uTime; uniform float uRipple;
varying vec3 vW; varying vec3 vN; varying vec4 vM; varying vec3 vQ; varying float vH; varying float vCove;
${SWELL_GLSL}
void main(){
  vec3 p = position; vec3 n = normal;
  float ap = aM.x;
  float isFace = step(1.5, aM.w), pin = aM.w - 2.0*isFace;
  // aprons ride the swell; the roll breathes in long lobes that travel along it
  float sw = c3aSwell(p.xz, uTime);
  float lob = sin(p.x*0.021 + uTime*0.33 + aSD.x*0.012)*1.6 + sin(p.x*0.057 - uTime*0.47 + aSD.x*0.031)*0.7;
  p.y += sw * ap;
  p += n * lob * (1.0-ap) * uRipple * (1.0 - 0.6*aSD.y) * (1.0 - pin);
  vec4 wp = modelMatrix * vec4(p,1.0);
  vW = wp.xyz; vN = mat3(modelMatrix) * n; vM = aM; vQ = vec3(position.x, aSD.x, aSD.y); vH = position.y; vCove = isFace * pin;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const BILLOW_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform float uTime, uFlow, uSolid, uScale, uAlpha, uHideBack;
uniform vec3 uSunDir, uKey, uFill, uAmber, uRose, uCream, uPlum, uRust, uCeil;
varying vec3 vW; varying vec3 vN; varying vec4 vM; varying vec3 vQ; varying float vH; varying float vCove;
${NOISE_GLSL}
void main(){
  vec3 V = cameraPosition - vW; float vd = length(V); V /= max(vd, 1e-4);
  vec3 N = vN / max(length(vN), 1e-5);
  float front = gl_FrontFacing ? 1.0 : 0.0;
  if (front < 0.5) N = -N;
  float ap = clamp(vM.x, 0.0, 1.0), lip = clamp(vM.z, 0.0, 1.0), inner = clamp(vQ.z, 0.0, 1.0), edgeA = clamp(vM.y, 0.0, 1.0);   // held to their range: past a mesh edge a varying is extrapolated under multisampling
  // pattern space: x along the roll, s along the flow; everything slides toward and round the roll
  vec2 q = vec2(vQ.x, vQ.y - uFlow) / uScale;
  // soft satin wrinkles in the normal (cheap: slope of a stretched noise)
  float e = 1.5;
  float w0 = fb(q*vec2(0.045,0.016)), wx = fb((q+vec2(e,0.))*vec2(0.045,0.016)), wy = fb((q+vec2(0.,e*3.))*vec2(0.045,0.016));
  vec3 T = normalize(vec3(1.0,0.0,0.0) - N*N.x + vec3(1e-4,0.,0.));
  vec3 B = cross(N, T);
  N = N + (T*(w0-wx) + B*(w0-wy)*0.6) * 2.2; N /= max(length(N), 1e-4);
  vec3 L = uSunDir;
  float ndl = dot(N, L), ndv = max(dot(N, V), 0.0);
  float wrap = max(ndl*0.6+0.4, 0.0); wrap = wrap*wrap*(1.4 - 0.4*wrap);
  vec3 Hh = normalize(L + V + vec3(0.,1e-4,0.));
  float ndh = max(dot(N, Hh), 0.0), nh2 = ndh*ndh;
  float sheen = nh2*nh2*nh2 * 0.55 + pow(max(ndh, 1e-4), 60.0) * 0.5;      // a broad satin band, a small core
  float fr = 1.0 - ndv; fr = fr*fr*(0.35+0.65*fr);
  // body colour: honey gold, deeper and rosier in the troughs and inside the scroll
  float bands = fb(q*vec2(0.012,0.004) + 3.7);                   // long streaks of denser gas climbing the face
  float fine = fb(q*vec2(0.21,0.035));
  vec3 deep = mix(uAmber*vec3(0.62,0.42,0.34), uPlum, 0.22);
  float streak = fb(q*vec2(0.11,0.0065) + 1.3);
  float surge = fb(vec2(q.x*0.009, q.y*0.038) + 8.1);                 // pulses of denser gas carried up the face and over
  vec3 body = mix(deep, uAmber, clamp(0.12 + 0.6*smoothstep(-38.0, 70.0, vH) + (bands-0.5)*0.7 + (streak-0.5)*0.5 + (surge-0.5)*0.75 + (fine-0.5)*0.2, 0.0, 1.0));
  body = mix(body, body*body*vec3(1.9,1.7,1.5), ndv*ndv*0.45);          // glassy: looking straight in, the gas is deeper
  body = mix(body, uRust*0.9, smoothstep(0.62,0.9,bands)*0.22*(1.0-ap));
  // glitter: mineral scum gathered into wind-rows at three scales, cells twinkle; averaged before they alias
  float r1 = smoothstep(0.56,0.74, vn(vec2(q.x*0.021 + 0.5*vn(q*vec2(0.01,0.006)), q.y*0.011)));
  float r2 = smoothstep(0.55,0.78, vn(vec2(q.x*0.085 + 0.8*vn(q*vec2(0.02,0.011)), q.y*0.027 + 5.0)));
  float r3 = smoothstep(0.5,0.8, vn(vec2(q.x*0.36 + vn(q*vec2(0.05,0.03)), q.y*0.07 + 9.0)));
  float rows = clamp(r1*0.55 + r2*(0.35+0.45*r1) + r3*0.3*(0.4+r2), 0.0, 1.0);
  rows = clamp(rows + smoothstep(150.0, 250.0, vQ.x) * (0.28 + 0.45*r2 + 0.3*r3), 0.0, 1.0);   // toward the trough exit the rows crowd together: the slope there is a streaming skin
  vec2 gc = q*vec2(3.1,1.05); vec2 fwq = fwidth(gc);
  float aa = 1.0 - smoothstep(0.22, 0.55, max(fwq.x, fwq.y));
  vec2 ci = floor(gc), cf = fract(gc)-0.5; float hc = h21(ci);
  float tw = 0.5+0.5*sin(uTime*(1.5+hc*3.0) + hc*40.0 + dot(V.xz, vec2(23.0,13.0)));
  float dust = step(1.0 - 0.5*rows, hc) * (1.0 - smoothstep(0.1, 0.36, length(cf*vec2(1.0,0.7)))) * (0.25+0.75*tw*tw);
  // right under the lens the dust is drawn in a finer grain, so no fleck ever grows into a white oval
  float nearF = smoothstep(7.0, 26.0, vd);
  vec2 gcf = q*vec2(9.3,3.3), cff = fract(gcf)-0.5; float hf = h21(floor(gcf)+3.0);
  float dustF = step(1.0 - 0.5*rows, hf) * (1.0 - smoothstep(0.1, 0.36, length(cff*vec2(1.0,0.7)))) * (0.3+0.7*tw) * (1.0 - nearF) * smoothstep(2.0, 5.0, vd);
  dust = dust*nearF + dustF;
  vec2 gc2 = q*vec2(0.47,0.33); vec2 c2 = fract(gc2)-0.5; float h2 = h21(floor(gc2)+11.0);
  float aa2 = 1.0 - smoothstep(0.1, 0.3, max(fwq.x, fwq.y)*0.2);
  float coin = step(0.955 - 0.12*rows, h2) * (1.0 - smoothstep(0.05, 0.1, length(c2 + (vec2(h2, fract(h2*7.3))-0.5)*0.5)));
  float glit = mix(0.13*rows, dust*1.5, aa) * (0.3+0.7*rows) + coin*aa2*(0.7+0.9*tw);
  // light
  vec3 lit = body * (uKey*wrap + uFill*(0.5+0.5*N.y)*0.55 + uFill*0.18);
  lit += uKey * sheen * (0.35+0.65*front) * vec3(1.0,0.8,0.5) * 0.34;
  lit = mix(lit, uRose*(uFill*0.9+uKey*0.35), fr*0.27*front);       // the rose air mirrored at grazing angles
  lit += uCream*vec3(1.0,0.93,0.78) * glit * (uKey*(0.35+0.65*wrap) + uFill*0.3) * 0.9 * front;
  // thin places let the sun through: lip and crest glow hot gold against the light
  float thru = max(dot(-V, L), 0.0); thru = thru*thru;
  float thin = max(lip, 0.0); float thin4 = thin*thin; thin4 *= thin4;
  lit += uAmber*vec3(1.25,0.74,0.36) * uKey * (thin*0.3 + thin4*0.9) * (0.18 + 1.6*thru + 0.4*fr);
  float crest = smoothstep(0.991, 1.0, thin + (fine-0.5)*0.012);
  crest *= 1.0 - smoothstep(0.003, 0.009, fwidth(lip));               // the meniscus is a band of the last hundredth of the lip: where that is thinner than a pixel it is left out, never drawn as a dashed line
  lit += uCream * crest * (0.35 + 0.9*thru + 0.35*wrap);            // cream meniscus riding the lip
  // the amber side (back faces): from underneath the sheet is a luminous ceiling, the sun smeared through it
  float sOut = max(dot(-N, L)*0.7+0.3, 0.0);
  vec3 ceilc = mix(uAmber*vec3(1.45,0.98,0.6), uRose, 0.16) * (0.34 + 1.3*sOut) * uKey * 1.2;
  ceilc *= (0.6 + 0.5*bands + 0.4*surge) * (1.0 - 0.45*rows);
  float th8 = thru*thru; th8 *= th8; th8 *= th8;
  ceilc += uAmber*vec3(1.7,1.15,0.6) * uKey * (thru*0.55 + th8*th8*2.6);
  ceilc = mix(deep*(uKey*0.5+uFill*0.6), ceilc, 0.3+0.7*ndv);
  float bk0 = 1.0 - front;
  float rimg = (1.0-ndv)*(1.0-ndv);
  ceilc = mix(ceilc, ceilc + uAmber*vec3(1.5,1.0,0.55)*uKey*0.25*rimg, bk0);   // seen from inside the amber the billows are glowing vaults, never dark slabs
  ceilc += uCream * crest * 0.6;
  float bk = 1.0 - front;                                               // from below: streaming strands and drifting coin glitter
  ceilc *= mix(1.0, 0.52 + 0.55*streak + 0.5*(fine-0.5) + 0.25*r2 + 0.3*r3, bk);
  ceilc += uCream*vec3(1.0,0.93,0.78) * (glit*1.3 + coin*aa2*0.8) * uKey * 0.9 * bk;
  lit = mix(ceilc, lit, front * (1.0 - 0.9*clamp(vCove, 0.0, 1.0)));     // the top of the face turns over into the glowing roof
  // occlusion inside the scroll: warm umber-rose, never grey
  lit *= mix(vec3(1.0), vec3(0.5,0.34,0.36), inner);
  lit += uAmber*vec3(0.9,0.5,0.25)*inner*0.3*uKey;                          // the barrel is lit by its own glowing roof
  // camera inside the amber (uHideBack 1): the underside is drawn exactly as the world draws the calm skin from below, a
  // luminous streaked ceiling that depends on the view and the place, so vault, belly and calm skin are one unbroken ceiling
  float underC = uHideBack * (1.0 - front);
  float postMul = 1.0;                                                  // the broad wind-rows, laid on after the haze exactly as the world lays them on its ceiling
  if (uHideBack > 0.5) {
    float wr = vn(vec2(vW.x*0.0035 + 3.0 + uTime*0.012, vW.z*0.022)), wr2 = vn(vec2(vW.x*0.011 + uTime*0.03, vW.z*0.06) + 9.0);
    float rowsM = (1.0 - smoothstep(500.0, 1300.0, vd)) * (0.6*(wr - 0.5) + 0.35*(wr2 - 0.5) + 0.25*smoothstep(0.6, 0.85, wr));
    // far billows of the train hang below the skin lost in the haze: they carry the same rows, so they never cut a flat bar out of the ceiling
    postMul = 1.0 + rowsM * mix(smoothstep(250.0, 650.0, vd), 1.0, 1.0 - front);
  }
  if (underC > 0.5) {
    #ifdef USE_FOG
    vec3 fc = fogColor;
    #else
    vec3 fc = uAmber;
    #endif
    float winC = smoothstep(0.25, 0.75, abs(V.y));
    float rowsC = smoothstep(0.45, 0.8, vn(vec2(vW.x*0.012 + vW.z*0.004, vW.z*0.09 + 0.3*vn(vW.xz*0.02)) + vec2(uTime*0.02, uTime*0.22)));
    vec3 cc = mix(fc*0.7 + uCeil*0.3, uCeil*1.25, winC) + vec3(1.0,0.9,0.7) * th8 * 1.1 * (0.7 + 0.3*sin(uTime*1.7 + vW.x*0.05));
    cc += vec3(1.0,0.95,0.85) * rowsC * 0.22 * winC;
    cc *= 1.0 + 0.13*sin(uTime*1.4 + vW.x*0.08 + vW.z*0.05);
    cc *= 0.82 + 0.36*rowsC + 0.2*(vn(vW.xz*vec2(0.004,0.03) + 7.0) - 0.5);
    cc += vec3(1.0,0.95,0.85) * rowsC * 0.1;
    cc *= 1.0 + 0.11*sin(0.045*vW.x + 0.07*vW.z + uTime*0.9)*sin(0.02*vW.z - 0.03*vW.x + uTime*0.6);
    float det = 1.0 - smoothstep(50.0, 260.0, vd);                       // close to: strands, surges and coin glitter sliding past
    cc *= mix(1.0, 0.56 + 0.5*streak + 0.5*(surge - 0.5) + 0.5*(bands - 0.5) + 0.35*(fine - 0.5) + 0.2*r2, det);
    float stC = smoothstep(0.28, 0.72, 0.5*streak + 0.3*fine + 0.2*bands);
    cc *= mix(vec3(1.0), mix(vec3(0.5,0.4,0.37), vec3(1.02,1.0,0.96), stC), det * (0.4 + 0.6*winC));
    float nearC = 1.0 - smoothstep(8.0, 52.0, vd);
    float mic = vn(vec2(vW.x*0.45 + uTime*0.5, vW.z*3.6))*0.62 + vn(vec2(vW.x*1.2 + uTime*0.9, vW.z*9.0))*0.38;
    cc *= mix(vec3(1.0), mix(vec3(0.66,0.55,0.5), vec3(1.04,1.01,0.96), smoothstep(0.2, 0.8, mic)), nearC*0.85);
    cc += uCream*vec3(1.0,0.93,0.78) * (glit*1.1 + coin*aa2*0.9) * det * 0.7;
    // the same coin glitter the world's calm skin carries, cell for cell, so it drifts on across the vault
    vec2 qc = vW.xz*1.1 + vec2(uTime*0.3, 0.0), cfc = fract(qc) - 0.5; float hsc = h21(floor(qc));
    cc += vec3(1.0,0.95,0.85) * step(0.8, hsc) * (0.5 + 0.5*sin(uTime*(2.0 + 3.0*hsc) + hsc*40.0)) * (1.0 - smoothstep(40.0, 190.0, vd)) * (1.0 - smoothstep(0.02, 0.16, dot(cfc, cfc))) * 1.85;
    lit = mix(fc, cc, mix(0.8, 0.93, winC));
  }
  float alpha = 1.0;
  if (uSolid < 0.5) {
    float a0 = mix(0.5, 0.97, 1.0 - ndv*ndv);
    a0 = mix(a0, 0.38, 1.0-front);                                     // thin from below, so the apron never reads as a slab
    alpha = mix(1.0, a0, smoothstep(0.0, 0.6, ap)) * edgeA * uAlpha;
    alpha = mix(alpha, edgeA * uAlpha, underC);
    alpha = clamp(max(alpha, clamp(glit, 0.0, 1.0)*edgeA*uAlpha), 0.0, 1.0);
  }
  gl_FragColor = vec4(lit, alpha);
  #include <fog_fragment>
  gl_FragColor.rgb *= postMul;
}`;

// ---- filaments: wisps that peel off the lip, stream away, thin, and are wound back into the roll -------------
const FIL_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aC; attribute vec2 aR0; attribute vec4 aPar; attribute vec2 aUV; attribute vec3 aRnd;
uniform float uTime;
varying vec2 vUV; varying float vLife; varying float vSeed; varying vec3 vW; varying float vThin;
vec3 filPoint(float p, float tau){
  float rho = max(length(aR0), 1.0); vec2 rh = aR0 / rho;
  float grow = smoothstep(0.0, 0.5, tau), back = smoothstep(0.62, 1.0, tau);
  float len = aPar.x * grow * (1.0 - 0.55*back);
  float a = 1.25*tau + len*p/rho;                       // carried round with the flow, clockwise in (z, y)
  float flick = sin(p*5.0 - uTime*0.9 + aRnd.z*20.0) * (0.8 + 3.6*p);
  float lift = aRnd.x * aPar.x * sqrt(max(grow, 1e-6)) * (1.0-back) * (0.3*p + 0.7*sin(p*2.9)) + flick*grow*(1.0-back) + 0.8;
  float ca = cos(a), sa = sin(a);
  vec2 r = vec2(rh.x*ca + rh.y*sa, -rh.x*sa + rh.y*ca) * (rho + lift);
  float x = aC.x + aRnd.y * len * p * (0.5 + 0.7*p) + sin(p*3.1 + uTime*0.6 + aRnd.z*40.0) * 1.5 * p;
  return vec3(x, aC.y + r.y, aC.z + r.x);
}
void main(){
  float tau = fract(uTime / aPar.y + aPar.z);
  float p = aUV.x;
  vec3 a = filPoint(p, tau), b = filPoint(p + 0.04, tau);
  vec4 wa = modelMatrix * vec4(a, 1.0), wb = modelMatrix * vec4(b, 1.0);
  vec3 tg = wb.xyz - wa.xyz; tg /= max(length(tg), 1e-4);
  vec3 toCam = cameraPosition - wa.xyz; float dist = length(toCam); toCam /= max(dist, 1e-4);
  vec3 side = cross(tg, toCam); side /= max(length(side), 1e-4);
  float born = smoothstep(0.0, 0.1, tau), die = 1.0 - smoothstep(0.6, 0.98, tau);
  float w = aPar.w * (1.0 - 0.8*pow(max(p, 1e-4), 0.6)) * born * (0.25 + 0.75*die);
  w = min(w, dist * 0.016);                             // never a broad strip when one streams past the lens: a ribbon is at most 3 percent of the picture wide
  w = max(w, dist * 0.0011);
  wa.xyz += side * aUV.y * w;
  vUV = aUV; vLife = born * die; vThin = mix(1.0, 0.5, smoothstep(2.4, 6.0, aPar.w)); vSeed = aRnd.z; vW = wa.xyz;
  vec4 mvPosition = viewMatrix * wa;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FIL_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform float uTime; uniform vec3 uSunDir, uKey, uFill, uAmber, uCream;
varying vec2 vUV; varying float vLife; varying float vSeed; varying vec3 vW; varying float vThin;
${NOISE_GLSL}
void main(){
  // with multisampling a varying is extrapolated past the ribbon's edge (the pixel centre lies outside it): everything read from one is held to its range
  float ac = min(abs(vUV.y), 1.0), p = clamp(vUV.x, 0.0, 1.0);
  // a ribbon thinner than a couple of pixels has no profile left to resolve: it is drawn evenly, so it stays a line and never breaks into dots
  float hair = smoothstep(0.6, 1.6, fwidth(vUV.y));
  float core = mix(1.0 - ac*ac, 0.66, hair);
  float wisp = 0.55 + 0.45*vn(vec2(p*9.0 - uTime*0.35 + vSeed*31.0, clamp(vUV.y, -1.0, 1.0)*1.5 + vSeed*7.0));
  float alpha = clamp(core * wisp * clamp(vLife, 0.0, 1.0) * smoothstep(0.0, 0.08, p) * (1.0 - smoothstep(0.6, 1.0, p)) * 0.8 * clamp(vThin, 0.0, 1.0), 0.0, 1.0);
  vec3 V = normalize(cameraPosition - vW + vec3(0.,1e-4,0.));
  float thru = max(dot(-V, uSunDir), 0.0); thru *= thru;
  vec3 col = uAmber * (uKey*(0.7 + 1.5*thru) + uFill*0.5) * (0.75 + 0.5*core);
  col = mix(col, uCream * (uKey*(0.85 + 1.1*thru) + uFill*0.3), clamp(smoothstep(0.35, 0.9, ac) * 0.85 * (1.0 - hair) + 0.45*p + 0.15, 0.0, 1.0));   // cream skin on the edges, tips pale
  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}`;

// ---- bell-floaters: ribbed bell in the rose, frilled waist on the skin, ballast streamers in the amber ------
const BELL_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aInfo;                 // part (0 bell, 1 frill, 2 streamer, 3 ring on the skin), v along the part, angle
attribute vec4 aI; attribute vec3 aIN;  // per instance: phase, flow coordinate s, apron factor, spare; surface normal
uniform float uTime, uRipple;
varying vec3 vW; varying vec3 vN; varying vec3 vInfo; varying float vPulse; varying vec2 vL;
${SWELL_GLSL}
void main(){
  vec3 p = position; float part = aInfo.x, v = aInfo.y;
  float ph = uTime*1.5708 + aI.x*6.2832;
  float sp = 0.5+0.5*sin(ph); float pulse = sp*sp*sp;                 // one stroke in 4 s
  if (part < 0.5) { p.xz *= 1.0 - 0.17*pulse*smoothstep(0.2,1.0,v); p.y *= 1.0 + 0.12*pulse; }
  else if (part < 1.5) { p.y += sin(aInfo.z*7.0 + uTime*2.1 + aI.x*9.0)*0.09*v - 0.1*pulse*v; p.xz *= 1.0 - 0.12*pulse*v; }
  else if (part < 2.5) { float sw = v*v; p.x += sin(uTime*0.8 + aInfo.z*3.0 + aI.x*5.0 + v*3.0)*0.4*sw; p.z += cos(uTime*0.7 + aInfo.z*5.0 + v*2.6)*0.4*sw; p.xz *= 1.0 - 0.3*pulse*v; p.y *= 1.0 - 0.08*pulse; }
  vec4 ip = instanceMatrix * vec4(p, 1.0);
  float ix = instanceMatrix[3].x;
  float lob = sin(ix*0.021 + uTime*0.33 + aI.y*0.012)*1.6 + sin(ix*0.057 - uTime*0.47 + aI.y*0.031)*0.7;
  ip.xyz += aIN * lob * (1.0 - aI.z) * uRipple;
  ip.y += c3aSwell(instanceMatrix[3].xz, uTime) * aI.z;
  if (part < 2.5) ip.y += sin(uTime*0.7 + aI.x*17.0)*0.35 + 0.25*pulse;
  vec4 wp = modelMatrix * ip;
  vW = wp.xyz; vN = mat3(modelMatrix) * mat3(instanceMatrix) * normal; vInfo = aInfo; vPulse = pulse; vL = position.xz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BELL_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform float uTime; uniform vec3 uSunDir, uKey, uFill, uAmber, uRose, uCream, uPlum, uRust;
varying vec3 vW; varying vec3 vN; varying vec3 vInfo; varying float vPulse; varying vec2 vL;
void main(){
  float part = vInfo.x, v = clamp(vInfo.y, 0.0, 1.0);
  vec3 V = normalize(cameraPosition - vW + vec3(0.,1e-4,0.));
  vec3 N = vN / max(length(vN), 1e-5); if (!gl_FrontFacing) N = -N;
  float ndv = abs(dot(N, V)), fr = 1.0 - ndv;
  float wrap = max(dot(N, uSunDir)*0.55+0.45, 0.0);
  float thru = max(dot(-V, uSunDir), 0.0); thru *= thru;
  vec3 col; float alpha;
  if (part < 0.5) {
    float rib = abs(sin(vInfo.z*6.0)); rib = 1.0 - rib*rib*rib*rib;          // twelve dark ribs
    float ribl = smoothstep(0.75, 1.0, rib) * smoothstep(0.06, 0.3, v);
    vec3 base = mix(uCream, uRose, smoothstep(0.0, 0.5, v));
    base = mix(base, uPlum*1.1 + uRose*0.25, ribl*0.75);
    base = mix(base, uAmber*1.5, smoothstep(0.72, 1.0, v)*0.6);                // the amber shines up into the mouth
    col = base * (uKey*(wrap + 0.9*thru) + uFill*0.7) + uCream*uKey*fr*fr*0.55;
    col += uCream * uKey * (1.0 - smoothstep(0.0, 0.12, v)) * 0.5;
    alpha = clamp(0.42 + 0.5*fr + 0.35*ribl + 0.3*(1.0 - smoothstep(0.0,0.15,v)), 0.0, 0.96);
  } else if (part < 1.5) {
    col = uCream * (uKey*(0.6+0.7*wrap) + uFill*0.4) * (1.0 + 0.5*v); alpha = 0.92;
  } else if (part < 2.5) {
    col = mix(uAmber*1.2, uRust, v) * (uKey*(0.5+0.5*wrap) + uFill*0.3); alpha = 0.85 * (1.0 - v*0.5);
  } else {
    float r = length(vL);                                                     // bright ring on the skin, breathing out with each stroke
    float r0 = 1.25 + 0.5*vPulse, r1 = 1.9 + 1.0*fract(uTime*0.25);
    float ring = (1.0 - smoothstep(0.0, 0.14, abs(r - r0))) + 0.45*(1.0 - smoothstep(0.0, 0.2, abs(r - r1)))*(1.0 - smoothstep(2.2, 2.9, r));
    col = uCream * uKey * 1.1; alpha = clamp(ring, 0.0, 1.0) * 0.7;
    if (alpha < 0.03) discard;
  }
  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}`;

// one bell-floater, radius 1 at the waist (y 0): bell above, frill and skin ring at 0, twelve streamers below
function bellGeometry() {
  const P = [], N = [], I = [], X = [];
  const push = (x, y, z, nx, ny, nz, part, v, ang) => { P.push(x, y, z); const l = Math.hypot(nx, ny, nz) || 1; N.push(nx / l, ny / l, nz / l); I.push(part, v, ang); return P.length / 3 - 1; };
  const SEG = 24, RINGS = 7;
  // bell: a flattened dome with a pinched shoulder and a flared mouth, ribs pressed in
  for (let k = 0; k <= RINGS; k++) {
    const v = k / RINGS, a = v * Math.PI * 0.5;
    const r = Math.pow(Math.sin(a), 0.75) * (0.86 + 0.14 * smoothstep(0.75, 1, v)) , y = 0.05 + 1.05 * Math.pow(Math.cos(a), 0.9);
    for (let j = 0; j <= SEG; j++) {
      const ang = (j / SEG) * TAU, rr = r * (1 - 0.06 * Math.pow(Math.abs(Math.sin(ang * 6)), 0.5) * smoothstep(0.1, 0.5, v));
      push(Math.cos(ang) * rr, y, Math.sin(ang) * rr, Math.cos(ang) * Math.sin(a), Math.cos(a) * 0.9 + 0.1, Math.sin(ang) * Math.sin(a), 0, v, ang);
    }
  }
  for (let k = 0; k < RINGS; k++) for (let j = 0; j < SEG; j++) { const a = k * (SEG + 1) + j, b = a + SEG + 1; X.push(a, b, a + 1, a + 1, b, b + 1); }
  // frill: a scalloped collar on the density line
  let base = P.length / 3;
  for (let j = 0; j <= SEG * 2; j++) {
    const ang = (j / (SEG * 2)) * TAU, w = 1.32 + 0.1 * Math.cos(ang * 12);
    push(Math.cos(ang) * 0.92, 0.07, Math.sin(ang) * 0.92, 0, 1, 0, 1, 0, ang);
    push(Math.cos(ang) * w, 0.0 + 0.05 * Math.cos(ang * 12), Math.sin(ang) * w, 0, 1, 0, 1, 1, ang);
  }
  for (let j = 0; j < SEG * 2; j++) { const a = base + j * 2; X.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  // streamers: twelve tapering ribbons hanging from the waist
  for (let n = 0; n < 12; n++) {
    const ang = (n / 12) * TAU + 0.13, cx = Math.cos(ang), cz = Math.sin(ang), len = 1.7 + 0.9 * Math.abs(Math.sin(n * 2.4));
    base = P.length / 3;
    for (let k = 0; k <= 4; k++) {
      const v = k / 4, w = 0.09 * (1 - 0.7 * v), rr = 0.86 - 0.2 * v;
      push(cx * rr - cz * w, -v * len, cz * rr + cx * w, cx, 0.2, cz, 2, v, ang);
      push(cx * rr + cz * w, -v * len, cz * rr - cx * w, cx, 0.2, cz, 2, v, ang);
    }
    for (let k = 0; k < 4; k++) { const a = base + k * 2; X.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  // ring: a flat disc on the skin that the shader turns into bright rings
  base = P.length / 3;
  for (let j = 0; j <= 16; j++) { const ang = (j / 16) * TAU; push(Math.cos(ang) * 1.0, 0.03, Math.sin(ang) * 1.0, 0, 1, 0, 3, 0, ang); push(Math.cos(ang) * 3.0, 0.03, Math.sin(ang) * 3.0, 0, 1, 0, 3, 1, ang); }
  for (let j = 0; j < 16; j++) { const a = base + j * 2; X.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aInfo', new THREE.Float32BufferAttribute(I, 3)); g.setIndex(X);
  return g;
}

// ---- the hero ---------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const H = opts.height ?? 150, L = opts.length ?? 1200;
  // per-seed character: how tightly it is wound, how it leans, where it tapers, the hue of the amber
  const G = {
    L, R0: H * 0.47, scale: 1,
    turns: opts.turns ?? rng.range(1.68, 1.84),
    taper: rng.range(190, 300) * (L / 1200), taperSkew: rng.range(0.7, 1.3),
    skew: rng.range(-0.035, 0.035), nOff: rng.range(0, 400),
    Zb: 200, Zf: 330, wind: rng.sign(),
  };
  const hueJit = rng.range(-0.012, 0.012), flowSpeed = opts.flowSpeed ?? 6;
  const amber = pal[1].clone().offsetHSL(hueJit, 0, 0), rose = pal[0].clone(), cream = pal[3].clone(), plum = pal[4].clone(), rust = pal[5].clone();
  const station = makeStations(ctx, G);
  const root = new THREE.Group(); root.name = 'canyon-of-three-airs:billow-four';

  const sunDir = new THREE.Vector3(-0.6, 0.7, 0.4).normalize();
  if (opts.sun?.direction) sunDir.copy(opts.sun.direction).normalize();
  const shared = {
    uTime: { value: 0 }, uFlow: { value: 0 }, uRipple: { value: 1 }, uScale: { value: 1 }, uAlpha: { value: 1 }, uHideBack: { value: 0 },
    uSunDir: { value: sunDir },
    uKey: { value: opts.sun?.color ? opts.sun.color.clone() : new THREE.Color(0.92, 0.77, 0.74) },
    uFill: { value: rose.clone().multiplyScalar(0.5) },
    uAmber: { value: new THREE.Color(amber.r * 0.84, amber.g * 0.74, amber.b * 0.5) }, uRose: { value: rose }, uCeil: { value: rose.clone().lerp(pal[1], 0.3).multiplyScalar(1.2) }, uCream: { value: new THREE.Color('#FFF6E0') },
    uPlum: { value: plum }, uRust: { value: rust },
  };
  const billowMat = (solid) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, uSolid: { value: solid ? 1 : 0 } },
    vertexShader: BILLOW_VERT, fragmentShader: BILLOW_FRAG, fog: true, side: THREE.DoubleSide,
    transparent: !solid, depthWrite: solid,
  });
  const matSolid = billowMat(true), matSheet = billowMat(false);

  await ctx.yield();
  const NX = 160, NA = 14, NS = 88, NF = 38;
  const geo = await sweepBillow(ctx, G, station, NX, NA, NS, NF);
  await ctx.yield();
  const billow = new THREE.Mesh(geo, [matSolid, matSheet]);
  billow.frustumCulled = false; billow.renderOrder = 2;
  root.add(billow);
  let triangles = geo.index.count / 3;

  // lip line helper: the point on the lip where its tangent has turned `deg` degrees (0 crest, 120 falling front, 150-300 the rolled rim)
  const _P = {}, _zy = new Float32Array(NS * 2);
  function lipPoint(x, deg = 150, out = new THREE.Vector3()) {
    station(x, _P); lipCurve(_P, NS, _zy, 0);
    const j = clamp(Math.round(deg / (_P.turns * 360) * (NS - 1)), 0, NS - 1);
    return out.set(x, _zy[j * 2 + 1], _zy[j * 2]);
  }
  // ---- filaments ----
  await ctx.yield();
  {
    const NFIL = Math.round(160 * (0.5 + 0.5 * detail)), SEG = 18, vpf = (SEG + 1) * 2, frng = rng.fork('filaments');
    const aC = new Float32Array(NFIL * vpf * 3), aR0 = new Float32Array(NFIL * vpf * 2), aPar = new Float32Array(NFIL * vpf * 4);
    const aUV = new Float32Array(NFIL * vpf * 2), aRnd = new Float32Array(NFIL * vpf * 3), idx = [];
    for (let n = 0; n < NFIL; n++) {
      let x = 0;
      for (let k = 0; k < 8; k++) {                 // rejection: prefer the tongues of the lip, only where it has rolled
        x = frng.range(-0.5, 0.5) * L; station(x, _P);
        if (_P.turns > G.turns * 0.55 && frng() < 0.25 + 2.2 * (_P.lobe - 0.1)) break;
      }
      station(x, _P); lipCurve(_P, NS, _zy, 0);
      const deg = frng.range(72, 150), j = clamp(Math.round(deg / (_P.turns * 360) * (NS - 1)), 3, NS - 4);
      const bz = _zy[j * 2], by = _zy[j * 2 + 1], pz = _zy[j * 2 - 6], py = _zy[j * 2 - 5], qz = _zy[j * 2 + 6], qy = _zy[j * 2 + 7];
      // radius of curvature from three points (circumradius), centre to the right of the flow
      const a = Math.hypot(bz - pz, by - py), b = Math.hypot(qz - bz, qy - by), c = Math.hypot(qz - pz, qy - py);
      const area = Math.abs((bz - pz) * (qy - py) - (by - py) * (qz - pz)) * 0.5;
      const rho = clamp((a * b * c) / Math.max(4 * area, 1e-3), 6, 60);
      let tz = qz - pz, ty = qy - py; const tl = Math.hypot(tz, ty) || 1; tz /= tl; ty /= tl;
      const cz = bz + ty * rho, cy = by - tz * rho;
      const len = frng.range(24, 64) * (0.5 + 0.5 * _P.tp), period = frng.range(13, 26), phase = frng(), width = frng.chance(0.28) ? frng.range(3.5, 8) : frng.range(0.8, 2.4);
      const lift = frng.range(0.2, 0.7), drift = G.wind * frng.range(0.25, 1.0), seed = frng();
      for (let v = 0; v < vpf; v++) {
        const o = n * vpf + v, pp = Math.floor(v / 2) / SEG;
        aC[o * 3] = x; aC[o * 3 + 1] = cy; aC[o * 3 + 2] = cz;
        aR0[o * 2] = bz - cz; aR0[o * 2 + 1] = by - cy;
        aPar[o * 4] = len; aPar[o * 4 + 1] = period; aPar[o * 4 + 2] = phase; aPar[o * 4 + 3] = width;
        aUV[o * 2] = pp; aUV[o * 2 + 1] = v % 2 ? 1 : -1;
        aRnd[o * 3] = lift; aRnd[o * 3 + 1] = drift; aRnd[o * 3 + 2] = seed;
      }
      for (let k = 0; k < SEG; k++) { const o = n * vpf + k * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NFIL * vpf * 3), 3));
    fg.setAttribute('aC', new THREE.BufferAttribute(aC, 3)); fg.setAttribute('aR0', new THREE.BufferAttribute(aR0, 2));
    fg.setAttribute('aPar', new THREE.BufferAttribute(aPar, 4)); fg.setAttribute('aUV', new THREE.BufferAttribute(aUV, 2));
    fg.setAttribute('aRnd', new THREE.BufferAttribute(aRnd, 3)); fg.setIndex(idx);
    fg.boundingSphere = geo.boundingSphere.clone();
    const fm = new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: shared.uTime, uSunDir: shared.uSunDir, uKey: shared.uKey, uFill: shared.uFill, uAmber: shared.uAmber, uCream: shared.uCream },
      vertexShader: FIL_VERT, fragmentShader: FIL_FRAG, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    });
    const fil = new THREE.Mesh(fg, fm); fil.frustumCulled = false; fil.renderOrder = 4; root.add(fil);
    triangles += idx.length / 3;
  }
  // ---- bell-floaters riding the face (a herd) and the trough ahead of it ----
  await ctx.yield();
  const NB0 = opts.floaters ?? Math.round(40 + 14 * (detail - 0.6) / 0.4);     // the herd of 40 is never thinned
  const NBELL = NB0 > 0 ? NB0 + 3 : 0;                                         // and three riders on the slope by the trough exit
  const herdX = rng.range(-130, 130);
  // a point on the face at station x, u along the face profile (0 front apron .. 1 tucked under the crest)
  const _zf = new Float32Array(NF * 2);
  function facePoint(x, u, out = {}) {
    station(x, _P); faceProfile(_P, NF, _zf);
    const fj = clamp(u, 0, 0.999) * (NF - 1), j = Math.floor(fj), f = fj - j;
    let sAcc = 0;
    for (let k = 1; k <= j; k++) sAcc += Math.hypot(_zf[k * 2] - _zf[k * 2 - 2], _zf[k * 2 + 1] - _zf[k * 2 - 1]);
    const dz = _zf[j * 2 + 2] - _zf[j * 2], dy = _zf[j * 2 + 3] - _zf[j * 2 + 1], dl = Math.hypot(dz, dy) || 1;
    out.x = x; out.z = _zf[j * 2] + dz * f; out.y = _zf[j * 2 + 1] + dy * f; out.s = sAcc + dl * f;
    out.nz = dy / dl; out.ny = -dz / dl; out.apron = 1 - smoothstep(0.08, 0.27, u);
    return out;
  }
  // The height of the face sheet AS DRAWN above (x, z) at time t: the profile, the swell on its apron and the breathing
  // lobes, moved the way the vertex shader moves the mesh, between the two mesh stations either side of x.
  // NaN where the front of the face (apron, trough, the rise under the scroll) does not lie over that point.
  const _fz = new Float32Array(NF * 2), _hz = new Float32Array(NF), _hy = new Float32Array(NF), JF = Math.round(NF * 0.66);
  function stationFaceY(xs, z, t, rip) {
    station(xs, _P); faceProfile(_P, NF, _fz);
    let s = 0;
    for (let j = 0; j <= JF; j++) {
      const u = j / (NF - 1), j0 = Math.max(0, j - 1), j1 = j + 1;
      if (j > 0) s += Math.hypot(_fz[j * 2] - _fz[j * 2 - 2], _fz[j * 2 + 1] - _fz[j * 2 - 1]);
      const tz = _fz[j1 * 2] - _fz[j0 * 2], ty = _fz[j1 * 2 + 1] - _fz[j0 * 2 + 1], tl = Math.hypot(tz, ty) || 1;
      const ap = 1 - smoothstep(0.08, 0.27, u), pin = smoothstep(0.7, 0.95, u), sdy = smoothstep(0.62, 0.97, u) * 0.4;
      const lob = Math.sin(xs * 0.021 + t * 0.33 + s * 0.012) * 1.6 + Math.sin(xs * 0.057 - t * 0.47 + s * 0.031) * 0.7;
      const d = lob * (1 - ap) * rip * (1 - 0.6 * sdy) * (1 - pin);
      _hz[j] = _fz[j * 2] + (ty / tl) * d; _hy[j] = _fz[j * 2 + 1] + swellAt(xs, _fz[j * 2], t) * ap + (-tz / tl) * d;
    }
    for (let j = 0; j < JF; j++) {
      const z0 = _hz[j], z1 = _hz[j + 1];
      if ((z - z0) * (z - z1) <= 0 && z0 !== z1) return _hy[j] + (_hy[j + 1] - _hy[j]) * (z - z0) / (z1 - z0);
    }
    return NaN;
  }
  function faceHeight(x, z, t, rip = shared.uRipple.value) {      // rip 0 = the face at rest, without its breathing lobes
    const fi = (x + L / 2) / L * NX;
    if (!(fi >= 0 && fi <= NX)) return NaN;
    const i = Math.min(NX - 1, Math.floor(fi)), xa = -L / 2 + (i / NX) * L, xb = -L / 2 + ((i + 1) / NX) * L;
    const ya = stationFaceY(xa, z, t, rip), yb = stationFaceY(xb, z, t, rip);
    if (ya !== ya) return yb; if (yb !== yb) return ya;
    return ya + (yb - ya) * (fi - i);
  }
  let bellsOff = null;                                                         // made where the floaters are made: the law that keeps them off a route (hero.keepBellsOff)
  if (NBELL > 0) {
    const brng = rng.fork('bells'), bg = bellGeometry();
    const aI = new Float32Array(NBELL * 4), aIN = new Float32Array(NBELL * 3);
    const bm = new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared },
      vertexShader: BELL_VERT, fragmentShader: BELL_FRAG, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: true,
    });
    const bells = new THREE.InstancedMesh(bg, bm, NBELL);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(), pos = new THREE.Vector3(), sc = new THREE.Vector3(), fp = {};
    const yUp = new THREE.Vector3(0, 1, 0), qy = new THREE.Quaternion();
    const nHerd = Math.min(NBELL, 40);
    const dealt = [], at = [];                                                 // every floater as dealt (station x, place w up the face, radius r, turn, waist p), and where its waist stands now
    // seats floater i at w up the face of its own station: the lines that seated it before, as they were, so that it can be seated again
    const seat = (i, w) => {
      const d = dealt[i]; facePoint(d.x, w, fp);
      up.set(0, fp.ny, fp.nz).lerp(yUp, 0.62).normalize();
      q.setFromUnitVectors(yUp, up); qy.setFromAxisAngle(yUp, d.turn); q.multiply(qy);
      pos.set(fp.x, fp.y, fp.z).addScaledVector(up, 0.12 * d.r); sc.setScalar(d.r);
      m4.compose(pos, q, sc); bells.setMatrixAt(i, m4);
      aI[i * 4 + 1] = fp.s; aI[i * 4 + 2] = fp.apron;
      aIN[i * 3] = 0; aIN[i * 3 + 1] = fp.ny; aIN[i * 3 + 2] = fp.nz;
      at[i].copy(pos);
    };
    for (let i = 0; i < NBELL; i++) {
      if (i % 12 === 11) await ctx.yield();
      const herd = i < nHerd;
      let x = herd ? clamp(herdX + brng.gauss() * 120, -L * 0.36, L * 0.36) : brng.range(-0.42, 0.42) * L;
      let u = herd ? brng.range(0.37, 0.6) : brng.range(0.1, 0.33);
      let r = herd ? brng.range(1.5, 4) : brng.range(1.5, 3.2);
      if (i >= NBELL - 3) {
        // three riders on the bare slope where the surf line slides down to the trough exit: big bells close under the eye
        const k = i - (NBELL - 3); x = 256 + 25 * k; r = [3.9, 3.3, 4.3][k];
        const zt = lipPoint(190, 205).z - 13 + 16 * (x - 190) / 170 + [-15, 14, -13][k];
        let bd = 1e9; for (let j = 0; j <= 50; j++) { const uu = 0.12 + 0.48 * j / 50; facePoint(x, uu, fp); const d = Math.abs(fp.z - zt); if (d < bd) { bd = d; u = uu; } }
      }
      dealt.push({ x, w: u, r, turn: brng.range(0, TAU), p: null }); at.push(new THREE.Vector3());   // (the turn, the phase and the spare are drawn in the order they always were)
      seat(i, u); dealt[i].p = pos.clone();
      aI[i * 4] = brng(); aI[i * 4 + 3] = brng();
    }
    // THE FLOATERS LEAVE CLEAR AIR ROUND A ROUTE: geometry, decided once from where each floater's whole course lies. Nothing fades
    // or shrinks, no number is drawn, and a floater that passes where it was dealt is left exactly as dealt. Nothing is hidden but by the
    // last resort named below: a floater for which no seat of its stretch passes is left out (scale 0) for the whole visit.
    // A floater never rests (BELL_VERT carries it for ever), so the test is on its skin as drawn at its furthest reach, every sine at any value:
    //   BODY, the outline of dome, frill and streamers about its own axis, in radii (rho off the axis, h up it from the waist), the hollow
    //     filled: the streamers hang to 2.6 and sway to 1.21 off the axis there, 1.23 at 2.52 down; the frill's edge stands 1.42 out and
    //     flutters between -0.04 and 0.14; the dome at full stroke is 0.457 wide at 1.13 and 0.28 at 1.21, and tops at 1.1 * 1.12 = 1.232 (typed 1.235 below:
    //     0.003 radii to the safe side);
    //   its course: the breathing lobes carry it 1.6 + 0.7 = 2.3 m either way along the face's normal, times (1 - apron); the apron's swell
    //     2.2 + 1.4 + 0.8 = 4.4 m up or down, times apron; the bob and the stroke's lift from 0.35 m down to 0.6 m up (uRipple is 1);
    //   RING, the flat ring on the skin: bands are drawn out to 2.9 radii, 0.03 radii up the axis; it rides the lobes and the swell, not the bob.
    const BODY = [0, -2.6, 1.21, -2.6, 1.23, -2.52, 1.42, -0.04, 1.42, 0.14, 0.457, 1.13, 0.28, 1.21, 0, 1.235];
    const offBody = (rho, h) => {                                              // how far (rho, h) stands outside that outline, in radii; 0 inside it
      let inside = true, best = Infinity;
      for (let k = 0; k < BODY.length - 2; k += 2) {
        const ex = BODY[k + 2] - BODY[k], ey = BODY[k + 3] - BODY[k + 1], px = rho - BODY[k], py = h - BODY[k + 1];
        if (ex * py - ey * px < 0) inside = false;
        const t = clamp((px * ex + py * ey) / (ex * ex + ey * ey), 0, 1); best = Math.min(best, Math.hypot(px - ex * t, py - ey * t));
      }
      return inside ? 0 : best;
    };
    const offRing = (rho, h) => Math.hypot(Math.max(rho - 2.9, 0), h - 0.03);  // the same for the ring's disc
    // Is the place (dx, dy, dz) from the waist of the floater seated last `need` metres or more from the shape `off` (radius r) wherever
    // its course carries it inside the patch l - hl .. l + hl along the face's normal, m - hm .. m + hm straight up? A distance changes
    // by no more than the shift, so a patch whose middle stands `need` and both its half-widths off is clear whole; a patch whose middle
    // is nearer than `need` is not; any other is halved, down to FINE, where it counts as not clear. So the test is never thinner than
    // the true reach and at most FINE metres fatter.
    const FINE = 0.01;
    const roomy = (off, r, need, dx, dy, dz, l, hl, m, hm) => {
      const py = dy - l * fp.ny - m, pz = dz - l * fp.nz, h = py * up.y + pz * up.z;
      const d = r * off(Math.sqrt(Math.max(dx * dx + py * py + pz * pz - h * h, 0)) / r, h / r);
      if (d >= need + hl + hm) return true;
      if (d < need || hl + hm <= FINE) return false;
      if (hl > hm) return roomy(off, r, need, dx, dy, dz, l - hl / 2, hl / 2, m, hm) && roomy(off, r, need, dx, dy, dz, l + hl / 2, hl / 2, m, hm);
      return roomy(off, r, need, dx, dy, dz, l, hl, m - hm / 2, hm / 2) && roomy(off, r, need, dx, dy, dz, l, hl, m + hm / 2, hm / 2);
    };
    // `line` is the route as x, y, z at even steps of its length, `gap` the widest two neighbouring places of it stand apart, `clear` the
    // clear air to be left, in metres, between the whole line and every floater's BODY. Asked of the places, that is `clear` and
    // gap * gap / (4 * clear) more: between two places `gap` apart a line that far off a round-cornered solid comes at most
    // gap * gap / (8 * clear) nearer than at either, and the line's own bow between them is less than that again WHILE THE ROUTE TURNS NO
    // TIGHTER THAN A RADIUS OF `clear` (nothing here checks the route's turn) (0.008 m in all at 2 m and a quarter metre). The RING is paint on the skin and takes no such room, but may not be laid across the line: a ring is across
    // it if some place of the line stands within half a gap of the ring's disc somewhere on its course.
    // A floater that fails as dealt slides along the face profile of its own station to the nearest seat that passes, up the face before
    // down, in steps of SLIDE of the profile (0.2 to 1.2 m of face where the herd rides, up to 4 m on the flat apron), inside the stretch
    // floaters are dealt on (0.1 to 0.6): it keeps its station, radius, turn and phase and rides there for the whole visit. The stretch is
    // tried in four passes, the nearest seat first in each: (1) a seat passes if its body leaves the clear air, its ring does not lie across
    // the line and its dome stands in no neighbour's where the deal's did not (waist to waist nearer than the two radii together); (2) the
    // neighbours not asked; (3) the ring not asked, the neighbours asked; (4) the body alone. Only if no seat passes in any of the four is
    // the floater left out (scale 0). A floater that passes as dealt is never asked about its ring. Returns how many are not as dealt.
    // SLIDE: a five-hundredth of the profile, so that the nearest seat is found to about a metre of face where the herd rides; a smaller
    // step finds the same seats to a finer grain and costs more tries, a larger one slides a floater further than it need go.
    const SLIDE = 0.002;
    bellsOff = async (line, gap, clear) => {
      const need = clear + gap * gap / (4 * clear), cut = gap / 2;
      const free = (i, near, ringToo) => {                                     // floater i as seated this instant: its body `need` from every place of the line (and its ring not across it)?
        const r = dealt[i].r, drift = 2.3 * (1 - fp.apron), swell = 4.4 * fp.apron;
        for (const k of near) {
          const dx = line[k] - pos.x, dy = line[k + 1] - pos.y, dz = line[k + 2] - pos.z;
          if (Math.abs(dx) < 1.42 * r + need && !roomy(offBody, r, need, dx, dy, dz, 0, drift, 0.125, swell + 0.475)) return false;   // 0.125 and 0.475: the middle and the half width of the bob and lift, 0.35 m down to 0.6 m up
          if (ringToo && !roomy(offRing, r, cut, dx, dy, dz, 0, drift, 0, swell)) return false;
        }
        return true;
      };
      const crowds = (i) => {                                                  // does floater i, where it stands now, make a pair of domes the deal did not have?
        for (let j = 0; j < NBELL; j++) { const rr = dealt[i].r + dealt[j].r; if (j !== i && at[i].distanceTo(at[j]) < rr && dealt[i].p.distanceTo(dealt[j].p) >= rr) return true; }
        return false;
      };
      let moved = 0;
      for (let i = 0; i < NBELL; i++) {
        const d = dealt[i], near = [];                                         // the places of the line abreast of its station (nothing of it, ring and all, reaches further along x)
        for (let k = 0; k < line.length; k += 3) if (Math.abs(line[k] - d.x) < 2.9 * d.r + need) near.push(k);
        seat(i, d.w);
        if (free(i, near, false)) { if (i % 12 === 11) await ctx.yield(); continue; }   // passes as dealt: left exactly as dealt (the hand-back every twelfth floater is the deal's own, above)
        let ok = false;
        for (const [ringToo, alone] of [[true, true], [true, false], [false, true], [false, false]]) for (let k = 1; !ok && (d.w + SLIDE * k <= 0.6 || d.w - SLIDE * k >= 0.1); k++) {
          for (const w of [d.w + SLIDE * k, d.w - SLIDE * k]) if (!ok && w >= 0.1 && w <= 0.6) { seat(i, w); ok = free(i, near, ringToo) && !(alone && crowds(i)); }
          if (k % 32 === 0) await ctx.yield();                                 // (a hand-back inside a long slide, every 32 steps or 64 seats tried: the figure only keeps a piece of the build short and changes no seat)
        }
        if (!ok) { bells.setMatrixAt(i, m4.makeScale(0, 0, 0)); at[i].setScalar(Infinity); }   // the very last resort: no seat of the stretch passes in any of the four passes
        moved++;
        await ctx.yield();                                                     // a hand-back after every slide: it changes no seat
      }
      if (moved) { bells.instanceMatrix.needsUpdate = true; bg.attributes.aI.needsUpdate = true; bg.attributes.aIN.needsUpdate = true; }
      return moved;
    };
    bg.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4)); bg.setAttribute('aIN', new THREE.InstancedBufferAttribute(aIN, 3));
    bells.instanceMatrix.needsUpdate = true; bells.frustumCulled = false; bells.renderOrder = 3; root.add(bells);
    triangles += (bg.index.count / 3) * NBELL;
  }
  // ---- the train: smaller curls standing behind, each fainter in the pink (same shader, coarser sweep) ----
  const trainN = clamp(opts.train ?? 2, 0, 3), trainZ = [], trainInfo = [];
  {
    let z = 0, sc = 1;
    for (let k = 0; k < trainN; k++) {
      await ctx.yield();
      const s2 = sc * rng.range(0.74, 0.82);
      z -= 200 * sc + 330 * s2 + rng.range(4, 30); sc = s2;
      const G2 = { ...G, scale: sc, L: L * (0.96 - 0.06 * k), nOff: G.nOff + 91.7 * (k + 1), Zb: 200 * sc, Zf: 330 * sc, taper: G.taper * rng.range(0.8, 1.3), skew: G.skew + rng.range(-0.02, 0.02) };
      const g2 = await sweepBillow(ctx, G2, makeStations(ctx, G2), Math.round(72 * detail), 8, 46, 18);
      const m2 = new THREE.Mesh(g2, [matSolid, matSheet]);
      m2.position.set(rng.range(-40, 40), 0, z); m2.frustumCulled = false; m2.renderOrder = 1 - k * 0.1; root.add(m2);
      trainZ.push(z); trainInfo.push({ x: m2.position.x, z, scale: sc, length: G2.L }); triangles += g2.index.count / 3;
    }
  }
//@@PARTS@@

  // ---- anchors ----
  const anchors = {};
  {
    const v = (x, y, z) => new THREE.Vector3(x, y, z), rim = new THREE.Vector3(), fp = {};
    // surf line: travel along +X with the falling lip above and to starboard and the face below to port
    const fly = [], rimLine = [], faceLine = [];
    for (let i = 0; i <= 10; i++) {
      const x = -190 + 38 * i;
      lipPoint(x, 205, rim); rimLine.push(rim.clone());
      const cz = rim.z - 13;
      fly.push(v(x, Math.max(rim.y - 21, -20), cz));
    }
    for (let i = 0; i <= 10; i++) { facePoint(herdX - 200 + 40 * i, 0.47, fp); faceLine.push(v(fp.x, fp.y, fp.z)); }
    facePoint(herdX, 0.48, fp);
    anchors.flyThrough = fly;                      // ordered, +X; lip rim about 21 m above / 13 m to starboard, face 40-60 m below
    anchors.rimLine = rimLine;                     // the cream edge of the rolled lip at the same stations
    anchors.faceLine = faceLine;                   // points ON the face through the herd (keep the camera 9-15 m off it)
    anchors.herd = v(fp.x, fp.y, fp.z);            // centre of the bell-floater herd
    anchors.approach = v(-260, 150, 620);          // first sight from the rose: the whole curl, the train behind it
    anchors.dropIn = v(-320, 70, 150);             // where to come down onto the face before the surf line
    facePoint(L * 0.36, 0.4, fp);
    anchors.troughExit = v(fp.x, fp.y, fp.z);      // the trough at the +X end where the curl unwinds: dive through the skin here
    anchors.crest = lipPoint(0, 20);               // top of the roll
    anchors.core = lipPoint(0, 420);               // inside the rolled rim
    anchors.axis = v(1, 0, 0); anchors.front = v(0, 0, 1);
    anchors.train = trainZ.map((z) => v(0, 0, z));
    anchors.trainInfo = trainInfo;                 // { x, z, scale, length } of each smaller curl: its aprons span z - 200 scale .. z + 330 scale
    anchors.extent = { halfLength: L / 2, back: -G.Zb, front: G.Zf, crestY: 1.64 * G.R0, troughY: -0.5 * G.R0 };
  }

  // viewer framing (the orbit of src/worlds/_part.js); opts.view = 'cx,cy,cz,R,H' moves it for close looks (debug only)
  let center = new THREE.Vector3(0, 40, 20), radius = 430, height = 170;
  const dbg = opts.view ?? null;
  if (dbg) { const v = String(dbg).split(',').map(Number); if (v.length >= 5 && v.every(Number.isFinite)) { center = new THREE.Vector3(v[0], v[1], v[2]); radius = v[3]; height = v[4]; } }

  const hero = {
    object: root, radius, height, center, anchors, ground: false, groundY: -H * 0.25,
    triangles,
    swellAt, lipPoint,
    setSun(dir, color) { if (dir) sunDir.copy(dir).normalize(); if (color) shared.uKey.value.copy(color); },
    setFill(color) { shared.uFill.value.copy(color); },
    setUnder(v) { shared.uHideBack.value = v ? 1 : 0; },   // 1 while the camera is inside the amber: the underside is drawn as the world's luminous ceiling (a plain uniform)
    setCeil(color) { shared.uCeil.value.copy(color); },    // the colour of that ceiling (the world's skin seen from below)
    facePoint, faceHeight,
    async keepBellsOff(line, gap, clear) { return bellsOff ? bellsOff(line, gap, clear) : 0; },   // the world calls this once, when its route is laid (see where bellsOff is made); a part shown alone has no route and keeps its deal
    update(dt, time) {
      shared.uTime.value = time; shared.uFlow.value = time * flowSpeed;
    },
    dispose() {},
  };
  return hero;
}
