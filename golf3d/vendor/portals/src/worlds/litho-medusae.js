// THE PLATE OF MEDUSAE (litho-medusae). A natural-history chromolithograph of about 1900 come alive at plankton
// scale: sage-ivory paper in every direction, four flat inks switched on or off by crayon grain, a sepia key line,
// every off-axis organism a mirrored pair living a beat apart. The flight threads a glass radiolarian the size of
// a house and ends up the axis of the great medusa (src/parts/litho-medusae.js), into its mouth.
//
// MAP OF THIS FILE (in order)
//   1. GLSL        CREATURE_* (every instanced body: lattice struts, shells, comb jellies, larvae, small medusae,
//                  siphonophore bells, ephyrae), HAIR_* (world-space ribbons kept 1.6 px wide: axopodia with algae
//                  beads, tentilla, stems), QUAD_* (billboards: diatoms, Ceratium, and the far line-only ghosts),
//                  PAGE_* (the sheet: tone sinking downward, fibre tooth, the night ground), RESERVE_FRAG and
//                  GLASS_RES_* (night only: paper reserved under the hero's tints and the great shell's disc).
//                  All of it is the hero's style: LITHO_VERT / LITHO_FRAG / styleMaterial and the hero's uniforms.
//   2. Builder     parametric grids -> one merged geometry per kind (aK kind + animation weights, aD dark / register
//                  coordinate / line counts, aB hexagon-pore barycentrics + phase delay, aPv pulse pivot).
//   3. Organisms   combGeo, larvaGeo, radGeo, siphoGeo, hydroGeo, ephyraGeo, strutGeo, nodeGeo, goldberg().
//   4. build()     EDITION AND CAST (seeded moods: search "SEEDED") -> PATH (search "PATH": centre line in the
//                  brief's (d, y), world z = 433 - d, sway in the points) -> hero placement (search "HERO") ->
//                  page -> great radiolarian -> THE AVENUE (search "AVENUE": the staged proscenium of great chains,
//                  great comb jellies and the gate medusae down the sink, u 0.45-0.72) -> company (seeded; nudged
//                  out of the avenue; last, the hand-staged opening pair: search "the opening") -> hair -> specks
//                  and ghosts (chain diatoms keep small and deep: QUAD_VERT) -> rare swarm -> night reserves -> pois, pace,
//                  post (search "POST": flat 1, no bloom, no grade; there is no scene fog: ink fades to paper by
//                  distance in lmFinish, uFade 250..450 m) -> update().
// SCRIPTED MOMENTS (all keyed to u)
//   hero stones      hero.setProgress(u) / setInks: uInk (green, rose, ochre) prints over u 0.385-0.5
//   the closing rim  hero.setPulseClock: the clock is steered so a contraction peaks at u 0.925 (uPulse)
//   register         per-organism: CREATURE/HAIR/QUAD vertex shaders print the stones by camera distance (uReg)
//   rare swarm       ephyrae instance matrices are a function of u (0.45-0.7)
//   the avenue       staged from the path itself: each pair stands 26 m ahead of the lens at u 0.5 / 0.55 / 0.6 /
//                    0.65 / 0.7 (stageAt), the Venus girdles (girdle cast) face the lens at u 0.47
// AMBIENT (time): uTime, uSeedT / uSeedF (grain re-seeded 4 times a second, each seed melting into the next),
//   instance matrices of the movers.
// NIGHT  the company prints opaque (which reserves it out of the green ground); only the hero's tints and the
//   great shell's glass (front faces only, so the ground shows from inside the shell) take a reserve pass.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import { buildHero, LITHO_VERT, LITHO_FRAG, styleMaterial } from '../parts/litho-medusae.js';

const TAU = Math.PI * 2;
const PALETTE = ['#E4E7D3', '#3A2A1E', '#C9627C', '#5E9E90', '#C8973A', '#3F6F66'];

// ------------------------------------------------------------------ 1. GLSL
// Every instanced body. Mirror twins: aI.x = -1 flips world x (and the normal); the twin lives 0.5 s behind.
const CREATURE_VERT = /* glsl */`
attribute vec4 aK, aD, aB, aI; attribute vec3 aPv;
uniform vec3 uReg; uniform float uForce;
varying vec3 vRest, vN, vWp, vInk, vBy; varying vec2 vUv; varying vec4 vK, vD;
void main() {
  float sg = aI.x < 0.0 ? -1.0 : 1.0;
  float t = uTime - (sg < 0.0 ? 0.5 : 0.0);
  float rate = aI.z, ph = aI.y;
  vec3 p = position;
  float bt = lmBeat(t * rate + ph - aB.w);                         // pulse: toward the pivot
  p = mix(p, aPv, aK.z * bt);
  float rw = fract(t * rate + ph + aB.w);                          // rowing: a fast power stroke, a slow return
  float jerk = smoothstep(0.0, 0.16, rw) * (1.0 - smoothstep(0.16, 0.9, rw));
  p.z -= aK.y * jerk; p.y += aK.y * 0.35 * jerk;
  float a = t * (1.1 + rate) + ph * 6.283 + aB.w * 6.283;          // wave: tails, tentacles, curtains
  p.x += aK.w * sin(a); p.z += aK.w * 0.7 * cos(a * 0.83 + 1.3);
  mat4 im = modelMatrix * instanceMatrix;
  vec4 wp = im * vec4(p, 1.0);
  vec3 n = mat3(im) * normal;
  vec3 o = im[3].xyz;
  wp.x *= sg; n.x *= sg; o.x *= sg;
  float d = length(o - cameraPosition);
  vInk = max(vec3(uForce), 1.0 - smoothstep(uReg - 30.0, uReg, vec3(d)));
  vRest = position + vec3(3.7, 1.3, 5.1) * aI.w;
  vN = n; vWp = wp.xyz; vUv = uv; vK = aK; vD = aD; vBy = aB.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

// kind (aK.x): 0 rose flesh with the shade ink in its folds, 1 sea-green glass, 2 ochre, 3 sepia (eyes).
const CREATURE_FRAG = /* glsl */`
uniform float uSeed, uFres, uSil, uSh, uNightK, uTime;
varying vec3 vRest, vN, vWp, vInk, vBy; varying vec2 vUv; varying vec4 vK, vD;
void main() {
  float w = lmLineW(vRest);
  float lattice = step(0.5, vBy.z);                                // hexagonal pores cut from the barycentrics
  vec3 b = vec3(vBy.xy, 1.0 - vBy.x - vBy.y);
  float hi = max(b.x, max(b.y, b.z)), lo = min(b.x, min(b.y, b.z)), e = hi - (1.0 - hi - lo);
  float fe = max(fwidth(e), 1e-5), bw = max(vD.z, 1.1 * fe);       // bars never thinner than about 2 px
  bool cut = lattice > 0.5 && e > bw;                              // the pores are decided here and cut after the silhouette line: a derivative taken after a discard is not defined
  float hexLine = lattice * lmLine((bw - e) / fe, w * 0.8) * step(2.4 * fe, vD.z);
  float fu = max(fwidth(vUv.x), 1e-6), fvy = max(fwidth(vUv.y), 1e-6);
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)), V = normalize(cameraPosition - vWp + vec3(0.0, 1e-5, 0.0));
  // surface ribbons flagged aB.z = 0.25 (the comb rows of the great glass comb jellies) carry the body's outward
  // normal: on the far side of the body they print at 30%, so eight fine rows read, not sixteen straps
  float farK = mix(1.0, mix(0.3, 1.0, smoothstep(-0.1, 0.4, dot(N, V))), step(0.1, vBy.z) * (1.0 - lattice));
  if (dot(N, V) < 0.0) N = -N;
  float ndv = abs(dot(N, V));
  float foot = lmFoot(vRest), g = lmGrain(vRest, foot, uSeed), g2 = lmGrainB(vRest + 23.7, foot, uSeed + 7.0);
  float shade = 0.5 - 0.5 * dot(N, uLight);
  float f1 = max(1.0 - ndv, 0.0), kind = vK.x;
  float tone = vD.x + uSh * smoothstep(0.35, 0.92, shade) + uFres * f1 * sqrt(f1);
  float rG = lmReg(vInk.x, vD.y, g), rR = lmReg(vInk.y, vD.y, g2), rO = lmReg(vInk.z, vD.y, g);
  vec3 m = vec3(1.0);
  if (kind < 0.5) {
    m = mix(m, m * lmMul(uRose), lmOn(tone, g) * rR);
    m = mix(m, m * lmMul(uShade), lmOn(min((tone - 0.72) * 2.4, 0.6), g2) * rG);
  } else if (kind < 1.5) {
    float tg = tone + 0.18 - 0.3 * uNightK;
    m = mix(m, m * lmMul(uGreen), lmOn(tg, g) * rG);
    m = mix(m, lmMul(uDeep), lmOn(min((tg - 0.78) * 2.2, 0.6), g2) * rG);
  } else if (kind < 2.5) {
    m = mix(m, m * lmMul(uOchre), lmOn(0.6 + 0.45 * tone, g) * rO * farK);
  } else {
    m = mix(m, lmMul(uSepia), lmOn(0.55 + 0.5 * tone, g));
  }
  float line = lmLine(ndv / max(fwidth(ndv), 1e-4), w * 0.9) * uSil;
  if (cut) discard;                                                // the pores (decided above): no derivative is taken below this line
  line = max(line, hexLine);
  float lu = vD.z * (1.0 - lattice), lv = vD.w;
  {                                                                // meridians: canals, flutes, strut edges
    float l1 = max(lu, 1.0), a = abs(fract(vUv.x * l1 + 0.5) - 0.5) / (l1 * fu);
    line = max(line, step(0.5, lu) * lmLine(a, w * 0.7) * mix(step(0.35, fract(vUv.y * 9.0)), 1.0, smoothstep(0.45, 0.7, shade)) * 0.85 * smoothstep(2.0, 4.5, 1.0 / (l1 * fu)));
  }
  {                                                                // rings: segments, comb plates (the plates travel)
    float scroll = step(1.5, kind) * step(kind, 2.5) * uTime * 1.6;
    float l2 = max(lv, 1.0), fv = l2 * fvy;
    float r = abs(fract(vUv.y * l2 - scroll) - 0.5) / fv;
    line = max(line, step(0.5, lv) * lmLine(r, w * 0.6) * smoothstep(2.5, 5.0, 1.0 / fv) * 0.8);
  }
  gl_FragColor = lmFinish(m, line * farK, length(cameraPosition - vWp));
}`;

// World-space ribbons that never fall under 1.6 px. aH = (s 0..1, side, phase, half width m),
// aG = (kind: 0 hair, 1 hair with algae beads, 2 rose tentacle, 3 green stem; wave amplitude; reel; mirror sign).
const HAIR_VERT = /* glsl */`
attribute vec3 aRoot, aDir; attribute vec4 aH, aG;
uniform float uViewH; uniform vec3 uReg;
varying vec3 vWp, vInk; varying float vS, vSide, vWpx, vCov, vKind, vPh, vHw, vT;
vec3 hairC(float s, vec3 e1, vec3 e2, float L) {
  float reel = 1.0 - aG.z * (0.5 + 0.5 * sin(uTime * 0.45 + aH.z * 3.0));
  float sr = s * reel, a = sr * L * 0.33 - uTime * 0.9 + aH.z, amp = aG.y * sr * L;
  return aRoot + aDir * sr + (e1 * sin(a) + e2 * cos(a * 0.77 + 1.9)) * amp + e1 * amp * 0.7 * sin(sr * 2.3 - uTime * 0.31 + aH.z * 2.0);
}
void main() {
  float sg = aG.w < 0.0 ? -1.0 : 1.0, L = max(length(aDir), 1e-3);
  vec3 dm = aDir * vec3(sg, 1.0, 1.0);                             // wave axes built on the unmirrored twin
  vec3 e1 = cross(dm, vec3(0.31, 0.2, 0.93)); e1 = e1 / max(length(e1), 1e-4);
  vec3 e2 = cross(dm, e1); e2 = e2 / max(length(e2), 1e-4);
  e1.x *= sg; e2.x *= sg;
  vec3 c = hairC(aH.x, e1, e2, L), c2 = hairC(aH.x + 0.02, e1, e2, L);
  vec3 toCam = cameraPosition - c; float dist = max(length(toCam), 0.01);
  vec3 sd = cross(c2 - c, toCam); sd = sd / max(length(sd), 1e-5);
  float pxm = 2.0 / (projectionMatrix[1][1] * max(uViewH, 1.0)) * dist;
  float hw0 = aH.w * (1.0 - 0.55 * aH.x), hw = max(hw0, 0.8 * pxm);
  vec3 wp = c + sd * aH.y * hw;
  vS = aH.x * L; vSide = aH.y; vWpx = hw / pxm; vCov = hw0 / hw; vKind = aG.x; vPh = aH.z; vHw = hw; vT = aH.x;
  vWp = wp; vInk = 1.0 - smoothstep(uReg - 30.0, uReg, vec3(length(aRoot - cameraPosition)));
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;

const HAIR_FRAG = /* glsl */`
uniform float uTime;
varying vec3 vWp, vInk; varying float vS, vSide, vWpx, vCov, vKind, vPh, vHw, vT;
void main() {
  float e = abs(vSide), w = uPx;
  vec3 rest = vec3(vSide * vHw + vPh * 9.0, vS, vPh * 4.0);
  float foot = lmFoot(rest), g = lmGrain(rest, foot, 3.0);
  float thin = 1.0 - smoothstep(1.2, 3.0, vWpx);
  float cov = mix(1.0, clamp(vCov, 0.3, 1.0), thin);
  vec3 m = vec3(1.0); float line = 0.0;
  if (vKind < 1.5) {
    line = max(lmLine(e * vWpx, 0.7 * w), thin) * (1.0 - 0.5 * vT);            // the hair, paler toward its tip
    float bs = (fract(vS * 0.3 - uTime * 0.16 + vPh) - 0.5) / 0.3;             // metres from the nearest bead
    float bd = length(vec2(bs, vSide * vHw)), br = vHw * 0.85;
    float bead = (1.0 - smoothstep(br - 0.02, br + 0.02, bd)) * step(0.5, vKind) * (1.0 - thin);
    m = mix(m, lmMul(uOchre), bead * lmReg(vInk.z, 0.1, g) * lmOn(0.8, g));
    line = max(line * (1.0 - bead), bead * lmLine(abs(bd - br) * vWpx / max(vHw, 1e-4), 0.6 * w));
  } else if (vKind < 2.5) {
    m = mix(m, m * lmMul(uRose), lmOn(0.2 + 0.6 * smoothstep(-0.4, 0.9, vSide), g) * lmReg(vInk.y, 0.1 + 0.6 * vT, g));
    line = lmLine((1.0 - e) * vWpx, 0.7 * w) * (1.0 - thin) + thin * 0.75;
    float kn = abs(fract(vS * 0.9 + vPh) - 0.5) / 0.9;                         // stinging knots
    line = max(line, lmLine(kn * vWpx / max(vHw, 1e-4), 0.6 * w) * (1.0 - thin) * 0.7);
  } else {
    m = mix(m, m * lmMul(uGreen), lmOn(0.35 + 0.55 * smoothstep(-0.4, 0.9, vSide), g) * lmReg(vInk.x, 0.1, g));
    line = lmLine((1.0 - e) * vWpx, 0.75 * w) * (1.0 - thin) + thin * 0.8;
  }
  m = mix(vec3(1.0), m, cov); line *= cov;
  gl_FragColor = lmFinish(m, clamp(line, 0.0, 1.0), length(cameraPosition - vWp));
}`;

// Billboards. aP = (x, y, z, half size m), aQ = (shape, phase, mirror sign, ink 0 green / 1 ochre).
// shapes 0 pill-box diatom, 1 pennate, 2 Triceratium, 3 chain, 4 Ceratium; 5 ghost medusa, 6 ghost radiolarian,
// 7 ghost comb jelly (line only, standing far off; they do not drift).
const QUAD_VERT = /* glsl */`
attribute vec4 aP, aQ;
uniform float uViewH; uniform vec3 uReg;
varying vec2 vQ; varying vec4 vI; varying vec3 vWp, vInk; varying float vCov, vSize;
void main() {
  float sg = aQ.z < 0.0 ? -1.0 : 1.0, ghost = step(4.5, aQ.x), live = 1.0 - ghost;
  float t = uTime - (sg < 0.0 ? 0.5 : 0.0);
  vec3 c = aP.xyz;
  float fr = fract(aQ.y * 7.31 + t * (0.004 + 0.006 * aQ.y));                  // specks rise slowly through a 70 m band
  c.y += live * (fr - 0.5) * 70.0;
  c.x += live * sin(t * 0.3 + aQ.y * 40.0) * 0.5; c.z += live * cos(t * 0.23 + aQ.y * 31.0) * 0.5;
  c.x *= sg;
  float fadeW = mix(1.0, smoothstep(0.0, 0.06, fr) * (1.0 - smoothstep(0.94, 1.0, fr)), live);
  float dist = max(length(cameraPosition - c), 0.01);
  float pxm = 2.0 / (projectionMatrix[1][1] * max(uViewH, 1.0)) * dist;
  float sz = max(aP.w, 1.3 * pxm);
  vCov = clamp(aP.w / sz, 0.0, 1.0);
  sz *= fadeW * mix(1.0, smoothstep(1.2, 3.2, dist) * (1.0 - smoothstep(55.0, 110.0, dist)), live);                    // nothing smears across the lens
  sz *= mix(1.0, smoothstep(5.0, 12.0, dist), step(2.5, aQ.x) * step(aQ.x, 3.5));                                  // chains stay small type, deep in the page
  float a = live * (t * (0.25 + 0.5 * aQ.y) + aQ.y * 80.0);
  float k = mix(1.0, 0.45 + 0.55 * abs(sin(t * 0.37 * (0.6 + aQ.y) + aQ.y * 50.0)), live * step(0.5, aQ.x) * step(aQ.x, 3.5));
  vec2 q = position.xy * vec2(1.0, k);
  vec2 r = vec2(q.x * cos(a) - q.y * sin(a), q.x * sin(a) + q.y * cos(a)); r.x *= sg;
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 wp = c + (right * r.x + up * r.y) * sz;
  vQ = position.xy; vI = aQ; vWp = wp; vSize = aP.w;
  vInk = 1.0 - smoothstep(uReg - 30.0, uReg, vec3(dist));
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;

const QUAD_FRAG = /* glsl */`
uniform float uNightK, uTime;
varying vec2 vQ; varying vec4 vI; varying vec3 vWp, vInk; varying float vCov, vSize;
float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0)); }
void main() {
  vec2 q = vQ; float shape = vI.x, w = uPx;
  float fq = max(length(fwidth(q)) * 0.7071, 1e-5), pxs = 1.0 / fq;            // quad units per pixel; half size in px
  float dist = length(cameraPosition - vWp);
  float r = length(q), ang = atan(q.y, q.x + 1e-5);
  if (shape > 4.5) {                                                           // ---- ghosts: line only
    float dl = 9.0, t = uTime * 0.5 + vI.y * 20.0, ax = abs(q.x);
    if (shape < 5.5) {
      float bp = fract(uTime * 0.2 + vI.y * 3.0), bt = smoothstep(0.0, 0.24, bp) * (1.0 - smoothstep(0.24, 1.0, bp)), rx = 0.42 * (1.0 - 0.12 * bt), cy = 0.55;
      vec2 e = (q - vec2(0.0, cy)) / vec2(rx, 0.3);
      if (q.y > cy) dl = abs(length(e) - 1.0) * 0.3;
      float rim = cy - 0.035 * abs(sin(q.x * 44.0));
      if (ax < rx) dl = min(dl, abs(q.y - rim));
      float under = step(q.y, cy);
      float wv = 0.035 * sin(q.y * 16.0 + t) * (cy - q.y);
      float yy = clamp((q.y + 0.35) / 0.6, 0.0, 1.0);                          // arms end at y = -0.35
      dl = min(dl, mix(9.0, min(abs(ax - 0.06 - wv), abs(ax - 0.17 - wv * 1.3)), under * step(-0.35, q.y)));
      float sp = (cy - q.y) * 0.1;
      dl = min(dl, mix(9.0, min(abs(ax - 0.27 - sp - wv * 0.6), abs(ax - 0.37 - sp * 1.6 + wv * 0.5)), under * step(-0.96, q.y)));
    } else if (shape < 6.5) {
      float a2 = ang + uTime * 0.03 * (vI.y - 0.5);
      dl = min(min(abs(r - 0.36), abs(r - 0.31)), abs(r - 0.13));
      float rk = a2 * 16.0 / 6.2832 + 0.5, rl = 0.5 + 0.45 * lmHash(vec3(floor(rk), floor(vI.y * 50.0), 2.0));
      float ray = abs(fract(rk) - 0.5) * (6.2832 / 16.0) * r;
      if (r > 0.36 && r < rl) dl = min(dl, ray);
      float hx = abs(fract(a2 * 24.0 / 6.2832) - 0.5) * (6.2832 / 24.0) * r;
      if (r > 0.13 && r < 0.31) dl = min(dl, hx + step(0.5, fract(r * 34.0)) * 9.0);
    } else {
      vec2 e = q / vec2(0.3, 0.52); float le = length(e);
      dl = abs(le - 1.0) * 0.3;
      float cu = sqrt(max(1.0 - (q.y / 0.52) * (q.y / 0.52), 0.0));
      float rows = min(abs(ax - 0.1 * cu), abs(ax - 0.22 * cu)) + step(0.55, fract(q.y * 22.0 - uTime * 0.4)) * 9.0;
      if (le < 1.0) dl = min(dl, rows);
      dl = min(dl, mix(9.0, abs(ax - 0.05 - 0.02 * sin(q.y * 20.0 + t)), step(q.y, -0.5) * step(-0.95, q.y)));
    }
    float gl = lmLine(dl / fq, 0.5 * w) * 0.8;
    if (gl < 0.03) discard;                                                    // made here: a billboard is ghost or not as a whole, and no derivative is taken below on this path
    gl_FragColor = lmFinish(vec3(1.0), gl, dist);
    return;
  }
  float d = 1.0, inner = 9.0, seta = 9.0, setaK = 0.0, core = 0.0, chain = 0.0;             // ---- diatoms and dinoflagellates
  if (shape < 0.5) {
    d = r - 0.9; inner = abs(r - 0.48);
    if (r > 0.5) inner = min(inner, abs(fract(ang * 14.0 / 6.2832) - 0.5) * (6.2832 / 14.0) * r);
  } else if (shape < 1.5) {
    float x2 = 1.0 - q.x * q.x / 0.9025, h = 0.36 * sqrt(max(x2, 0.0)) * max(x2, 0.0);
    d = abs(q.y) - h + step(x2, 0.0);
    inner = min(abs(q.y), abs(fract(q.x * 6.0) - 0.5) / 6.0 + step(abs(q.y), 0.05) * 9.0);
  } else if (shape < 2.5) {
    d = max(q.y * -1.0, max(dot(q, vec2(0.866, 0.5)), dot(q, vec2(-0.866, 0.5)))) - 0.44 - 0.1 * cos(ang * 3.0 + 1.5708);
    inner = min(abs(r - 0.2), abs(d + 0.16));
  } else if (shape < 3.5) {
    // a Chaetoceros chain: five rounded glass cells on a gentle arch, a girdle band and a grain-dark chloroplast in
    // each, and hair-fine setae crossing out from every junction
    vec2 p = vec2(q.x, q.y + 0.2 * (q.x * q.x - 0.4));
    float cl = (fract(p.x / 0.38 + 0.5) - 0.5) * 0.38, jx = abs(fract(p.x / 0.38) - 0.5) * 0.38, ay = abs(p.y);
    vec2 bx = abs(vec2(cl, p.y)) - vec2(0.105, 0.15);
    d = max(length(max(bx, 0.0)) + min(max(bx.x, bx.y), 0.0) - 0.07, abs(p.x) - 0.95);
    inner = abs(abs(cl) - 0.045);
    core = 1.0 - smoothstep(0.04, 0.12, length(vec2(cl, p.y)));
    seta = abs(jx - 0.45 * max(ay - 0.2, 0.0)) + step(ay, 0.2) * 9.0;
    setaK = 1.0 - smoothstep(0.45, 0.92, ay);
    chain = 1.0;
  } else {
    vec2 p = vec2(abs(q.x), q.y);
    d = min(length(q - vec2(0.0, -0.12)) - 0.25, sdSeg(q, vec2(0.0, -0.1), vec2(0.0, 0.92)) - 0.085 * (1.0 - 0.6 * smoothstep(0.1, 0.9, q.y)));
    d = min(d, min(sdSeg(p, vec2(0.1, -0.25), vec2(0.5, -0.62)) - 0.075, sdSeg(p, vec2(0.5, -0.62), vec2(0.8, -0.1)) - 0.05));
    inner = abs(q.y + 0.1) + step(0.24, abs(q.x)) * 9.0;
  }
  float hairL = lmLine(seta / fq, 0.45 * w) * smoothstep(9.0, 18.0, pxs) * 0.6 * setaK, inside = step(d, 0.0);
  bool cut = inside < 0.5 && hairL < 0.03;                                     // the outline is decided here and cut after the grain: a derivative taken after a discard is not defined
  vec3 rest = vec3(q * vSize, vI.y * 37.0);
  float foot = lmFoot(rest), g = lmGrain(rest, foot, vI.y * 11.0);
  if (cut) discard;                                                            // the outline (decided above): no derivative is taken below this line
  float tone = 0.42 + 0.4 * (0.5 - 0.5 * dot(q, uLight.xy)) + 0.25 * smoothstep(-0.3, 0.0, d);
  tone = mix(tone, 0.1 + 0.2 * (0.5 - 0.5 * dot(q, uLight.xy)) + 0.7 * core + 0.3 * smoothstep(-0.06, 0.0, d), chain);
  float isO = step(0.5, vI.w);
  vec3 ink = mix(mix(lmMul(uGreen), vec3(1.0), uNightK), lmMul(uOchre), isO);
  vec3 m = mix(vec3(1.0), ink, lmOn(tone, g) * lmReg(mix(vInk.x, vInk.z, isO), 0.2, g) * inside);
  float line = lmLine(-d / fq, 1.0 * w) * inside;
  line = max(line, lmLine(inner / fq, 0.55 * w) * smoothstep(7.0, 14.0, pxs) * 0.8 * inside);
  line = max(line, hairL * (1.0 - inside));
  float cov = mix(0.45, 1.0, vCov);
  m = mix(vec3(1.0), m, cov); line *= cov * mix(0.5, 1.0, smoothstep(2.0, 6.0, pxs)) * (1.0 - 0.35 * step(2.5, shape) * step(shape, 3.5));
  gl_FragColor = lmFinish(m, line, dist);
}`;

// The sheet. Sage-ivory in every direction, sinking evenly straight down; a fibre tooth fixed to the screen.
// Night edition: a flat sea-green tint stone below a soft grain edge at mid-frame.
const PAGE_VERT = /* glsl */`
varying vec3 vDir;
void main() { vDir = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p; }`;
const PAGE_FRAG = /* glsl */`
uniform vec3 uPaperLow; uniform float uNight;
varying vec3 vDir;
void main() {
  vec3 d = vDir / max(length(vDir), 1e-4);
  vec3 col = mix(uPaperLow, uPaper, smoothstep(-0.9, 0.1, d.y));
  vec2 f = gl_FragCoord.xy / max(uPx, 0.25);
  float n = lmVn(vec3(f.x * 0.55, f.y * 0.9, 1.0)) * 0.6 + lmVn(vec3(f.x * 0.09, f.y * 1.7, 5.0)) * 0.4;
  float gg = clamp((mix(lmVn(vec3(f * 0.62, 3.0)), lmVn(vec3(f * 0.27, 9.0)), 0.35) - 0.5) * 1.9 + 0.5, 0.0, 1.0);
  float ground = lmOn(clamp((0.61 - f.y / 450.0) / 0.22, 0.0, 1.0), gg) * uNight;
  col *= mix(vec3(1.0), lmMul(uGreen), ground);
  col *= 1.0 + (n - 0.5) * 0.03;
  gl_FragColor = vec4(col, 1.0);
}`;
// Night only: tints are overprints, so each tinted body of the hero first reserves its own paper out of the green
// ground (the company is simply printed opaque at night, which reserves it without a second pass).
const RESERVE_FRAG = /* glsl */`
uniform vec3 uPaper;
void main() { gl_FragColor = vec4(uPaper, 1.0); }`;
// The great shell's glass reserves its disc only as seen from OUTSIDE (front faces of a plain sphere, the two pores
// cut as clean circles under their collars): from inside, the green ground runs unbroken behind the far net.
const GLASS_RES_VERT = /* glsl */`
varying vec3 vDirL;
void main() { vDirL = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const GLASS_RES_FRAG = /* glsl */`
uniform vec3 uPaper, uPa, uPb; uniform float uPc;
varying vec3 vDirL;
void main() {
  vec3 n = vDirL / max(length(vDirL), 1e-4);
  if (max(dot(n, uPa), dot(n, uPb)) > uPc) discard;
  gl_FragColor = vec4(uPaper, 1.0);
}`;

// ------------------------------------------------------------------ 2. Builder: parametric grids merged into one geometry
// fn(u, v, out) writes a point; options may be numbers or functions of (u, v):
//   kind, dark (local darkness 0..1), body (register sweep coordinate 0..1), lu / lv (meridian / ring line counts),
//   row / pulse / wave (animation weights), delay (phase delay), pivot ([x,y,z] or fn(point)) for the pulse,
//   far: true for a ribbon lying on a glass body (aB.z = 0.25: it prints faint where the body's far side carries it).
// LOADING: grid() and lattice() only note a piece down. build(y) makes the pieces in the order they were noted and
// hands the page back (y is () => ctx.yield()) after every piece and every thirty or so vertices of a large one, so
// no organism holds the page for long. Nothing here draws a random number, so the cuts cannot change the result.
// The work itself stays in plain methods (_rows, _faces, _shell): a loop written inside an async function runs slower.
class Builder {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.k = []; this.d = []; this.b = []; this.pv = []; this.idx = []; this.n = 0; this.jobs = []; }
  grid(nu, nv, fn, o = {}) { this.jobs.push({ nu, nv, fn, o, P: [0, 0, 0], A: [0, 0, 0], C: [0, 0, 0] }); return this; }
  // a geodesic sphere whose hexagonal pores are cut in the fragment shader (bar = half width of the bars)
  lattice(radius, detail, o = {}) { this.jobs.push({ radius, detail, o }); return this; }
  // the vertices of rows i0 .. i1 - 1 of a grid
  _rows(job, i0, i1) {
    const { nu, nv, fn, o, P, A, C } = job, e = 2e-3;
    const val = (x, u, v) => (typeof x === 'function' ? x(u, v) : (x ?? 0));
    for (let i = i0; i < i1; i++) for (let j = 0; j <= nu; j++) {
      const u = j / nu, v = i / nv, vc = Math.min(0.994, Math.max(0.006, v));
      fn(u + e, vc, A); fn(u - e, vc, C); const ax = A[0] - C[0], ay = A[1] - C[1], az = A[2] - C[2];
      fn(u, vc + e, A); fn(u, vc - e, C); const bx = A[0] - C[0], by = A[1] - C[1], bz = A[2] - C[2];
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = Math.hypot(nx, ny, nz);
      if (l > 1e-12) { nx /= l; ny /= l; nz /= l; } else { nx = 0; ny = 1; nz = 0; }
      fn(u, v, P);
      this.pos.push(P[0], P[1], P[2]); this.nor.push(nx, ny, nz); this.uv.push(u, v);
      this.k.push(o.kind ?? 0, val(o.row, u, v), val(o.pulse, u, v), val(o.wave, u, v));
      this.d.push(val(o.dark, u, v), val(o.body, u, v), o.lu ?? 0, o.lv ?? 0);
      this.b.push(0, 0, o.far ? 0.25 : 0, val(o.delay, u, v));
      const pv = o.pivot ? (typeof o.pivot === 'function' ? o.pivot(P) : o.pivot) : P;
      this.pv.push(pv[0], pv[1], pv[2]);
    }
  }
  // the faces of a grid whose vertices are all in
  _faces(job) {
    const { nu, nv, o } = job, v0 = this.n, row = nu + 1;
    for (let i = 0; i < nv; i++) for (let j = 0; j < nu; j++) {
      const a = v0 + i * row + j, b = a + 1, c = a + row, d = c + 1;
      if (o.cull && o.cull(this.pos[a * 3], this.pos[a * 3 + 1], this.pos[a * 3 + 2])) continue;
      this.idx.push(a, c, b, b, c, d);
    }
    this.n += row * (nv + 1);
  }
  // corners i0 .. i1 - 1 of a lattice (p: the corners of the geodesic sphere, three to a triangle)
  _shell(p, o, i0, i1) {
    const c = o.center || [0, 0, 0];
    for (let i = i0; i < i1; i++) {
      const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2], l = Math.hypot(x, y, z) || 1;
      this.pos.push(x + c[0], y + c[1], z + c[2]); this.nor.push(x / l, y / l, z / l); this.uv.push(0, 0);
      this.k.push(o.kind ?? 1, 0, o.pulse ?? 0, 0); this.d.push(o.dark ?? 0.2, o.body ?? 0.3, o.bar ?? 0.16, 0);
      this.b.push(i % 3 === 0 ? 1 : 0, i % 3 === 1 ? 1 : 0, 1, 0); this.pv.push(c[0], c[1], c[2]);
      this.idx.push(this.n + i);
    }
  }
  async build(y) {
    for (const job of this.jobs) {
      if (job.fn) {
        const every = Math.max(1, Math.round(32 / (job.nu + 1)));
        for (let i = 0; i <= job.nv; i += every) { this._rows(job, i, Math.min(job.nv + 1, i + every)); await y(); }
        this._faces(job);
      } else {
        const p = await icoPoints(job.radius, job.detail, y), n = p.length / 3;
        for (let i = 0; i < n; i += 96) { this._shell(p, job.o, i, Math.min(n, i + 96)); await y(); }
        this.n += n;
      }
      await y();
    }
    this.jobs.length = 0;
    const g = new THREE.BufferGeometry(), f = (a, n) => new THREE.BufferAttribute(new Float32Array(a), n);
    g.setAttribute('position', f(this.pos, 3)); g.setAttribute('normal', f(this.nor, 3)); g.setAttribute('uv', f(this.uv, 2));
    await y();
    g.setAttribute('aK', f(this.k, 4)); g.setAttribute('aD', f(this.d, 4)); g.setAttribute('aB', f(this.b, 4)); g.setAttribute('aPv', f(this.pv, 3));
    g.setIndex(new THREE.BufferAttribute(this.n < 65536 ? new Uint16Array(this.idx) : new Uint32Array(this.idx), 1));
    return g;
  }
}
// LOADING: the corners of new THREE.IcosahedronGeometry(radius, detail), triangle after triangle, exactly as that
// geometry's position array holds them (the library's own sums in the library's order, with the library's vectors,
// rounded to 32 bits the same way), but without its uvs and normals, and one face of the icosahedron per step: the
// library call takes several milliseconds the first time and cannot hand the page back half way. y is () => ctx.yield().
async function icoPoints(radius, detail, y) {
  const t = (1 + Math.sqrt(5)) / 2, cols = detail + 1;
  const V = [-1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, 0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1];
  const F = [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1];
  const out = new Float32Array(F.length * cols * cols * 3), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), w = new THREE.Vector3();
  let q = 0;
  const push = (p) => { w.x = p.x; w.y = p.y; w.z = p.z; w.normalize().multiplyScalar(radius); out[q++] = w.x; out[q++] = w.y; out[q++] = w.z; };
  const face = (f) => {
    a.set(V[F[f] * 3], V[F[f] * 3 + 1], V[F[f] * 3 + 2]); b.set(V[F[f + 1] * 3], V[F[f + 1] * 3 + 1], V[F[f + 1] * 3 + 2]); c.set(V[F[f + 2] * 3], V[F[f + 2] * 3 + 1], V[F[f + 2] * 3 + 2]);
    const v = [];
    for (let i = 0; i <= cols; i++) {
      v[i] = [];
      const aj = a.clone().lerp(c, i / cols), bj = b.clone().lerp(c, i / cols), rows = cols - i;
      for (let j = 0; j <= rows; j++) v[i][j] = j === 0 && i === cols ? aj : aj.clone().lerp(bj, j / rows);
    }
    for (let i = 0; i < cols; i++) for (let j = 0; j < 2 * (cols - i) - 1; j++) {
      const k = Math.floor(j / 2);
      if (j % 2 === 0) { push(v[i][k + 1]); push(v[i + 1][k]); push(v[i][k]); }
      else { push(v[i][k + 1]); push(v[i + 1][k + 1]); push(v[i + 1][k]); }
    }
  };
  for (let f = 0; f < F.length; f += 3) { face(f); await y(); }
  return out;
}
const blob = (c, r) => (u, v, o) => { const a = u * TAU, b = v * Math.PI, s = Math.sin(b); o[0] = c[0] + r[0] * s * Math.cos(a); o[1] = c[1] + r[1] * Math.cos(b); o[2] = c[2] + r[2] * s * Math.sin(a); };
// a tube along a smooth curve through pts; rad(v) is its radius, sq flattens the section
function tube(pts, rad, sq = 1) {
  const P = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), c = new THREE.CatmullRomCurve3(P, false, 'centripetal');
  const dir = P[P.length - 1].clone().sub(P[0]).normalize();
  const ref = Math.abs(dir.y) > 0.8 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), T = new THREE.Vector3(), C = new THREE.Vector3();
  return (u, v, o) => {
    const vv = Math.min(1, Math.max(0, v)); c.getPoint(vv, C); c.getTangent(vv, T);
    X.crossVectors(T, ref).normalize(); Y.crossVectors(T, X);
    const a = u * TAU, r = rad(vv), ca = Math.cos(a) * r, sa = Math.sin(a) * r * sq;
    o[0] = C.x + X.x * ca + Y.x * sa; o[1] = C.y + X.y * ca + Y.y * sa; o[2] = C.z + X.z * ca + Y.z * sa;
  };
}

// ------------------------------------------------------------------ 3. Organisms (metres; +Y up, swimmers face +Z)
// Each takes y = () => ctx.yield() first and returns the promise of its geometry (Builder.build makes it in steps).
// comb jellies: 'lobate' 5 m (hi: the glass cast for the great ones of the avenue, shown at 3 times the size: a bare-paper
// body, eight hair-fine ochre comb rows as surface ribbons, the far-side ones printed faint, a slim pharynx),
// 'gooseberry' 3.4 m (its two tentacles are hairs), 'girdle' a 40 m Venus-girdle ribbon along Z
function combGeo(y, cast, hi = false) {
  const B = new Builder();
  if (cast === 'girdle') {
    // a glass band lying in the XZ plane (it faces +Y): bare paper with rose only toward its two edges, a midline
    // canal, an ochre comb row along each edge whose plates travel, and a travelling S of two wavelengths (the wave
    // moves it in X, in its own plane, so the S shows when the band faces the lens)
    const tap = (v) => Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(2 * v - 1), 5)));
    const hw = (v) => 0.8 * tap(v) * (1 + 0.07 * Math.sin((v * 2 - 1) * 18));
    const wv = (u, v) => 0.5 + 2.5 * Math.abs(2 * v - 1), dl = (u, v) => v * 2, bd = (u, v) => Math.abs(2 * v - 1);
    B.grid(8, 96, (u, v, o) => { const t = 2 * u - 1; o[0] = t * hw(v); o[1] = 0.24 * (1 - t * t) * tap(v); o[2] = (v * 2 - 1) * 20; },
      { kind: 0, dark: (u) => 0.01 + 0.5 * Math.pow(Math.abs(2 * u - 1), 4), body: bd, wave: wv, delay: dl, lu: 2 });
    for (const sd of [-1, 1]) B.grid(3, 96, (u, v, o) => { const a = u * TAU, t = tap(v); o[0] = sd * (hw(v) + 0.03) + 0.14 * Math.cos(a) * t; o[1] = 0.14 * Math.sin(a) * t; o[2] = (v * 2 - 1) * 20; },
      { kind: 2, dark: 0.3, body: bd, wave: wv, delay: dl, lv: 130 });
    B.grid(10, 6, blob([0, 0.1, 0], [0.62, 0.36, 0.9]), { kind: 0, dark: 0.35, lu: 8, wave: 0.5, delay: 1 });
    B.grid(6, 4, blob([0, 0.3, 0], [0.3, 0.26, 0.3]), { kind: 2, dark: 0.4, wave: 0.5, delay: 1 });
    return B.build(y);
  }
  const goose = cast === 'gooseberry', L = goose ? 1.7 : 2.5, R = goose ? 1.5 : 1.3, nv = hi ? 22 : 14;
  const prof = (v) => Math.pow(Math.max(0, Math.sin(Math.PI * v)), goose ? 0.5 : 0.62) * (goose ? 1 : 0.78 + 0.44 * v);
  B.grid(hi ? 36 : 24, nv, (u, v, o) => { const a = u * TAU, r = R * prof(v) * (1 + 0.06 * Math.cos(8 * a)); o[0] = r * Math.cos(a); o[1] = L * Math.cos(Math.PI * v); o[2] = r * Math.sin(a); },
    { kind: 0, dark: hi ? -0.12 : 0, body: (u, v) => v });   // hi: glass. Bare paper, a breath of rose only at the limb
  for (let k = 0; k < 8; k++) {                           // eight comb rows: ochre ridges whose plates run pole to pole
    const a = k / 8 * TAU, pts = [];
    if (hi) {                                             // the great ones: hair-fine ribbons lying on the body (far: faint on its far side)
      B.grid(1, 30, (u, v, o) => {
        const vv = 0.07 + 0.8 * v, r = R * prof(vv) * 1.07 + 0.03, aa = a + (2 * u - 1) * 0.062 * (0.35 + 0.65 * Math.sin(Math.PI * v)) / Math.max(r, 0.25);
        o[0] = r * Math.cos(aa); o[1] = L * Math.cos(Math.PI * vv); o[2] = r * Math.sin(aa);
      }, { kind: 2, dark: 0.1, body: (u, v) => v, lv: 36, far: true });
      continue;
    }
    for (let i = 0; i <= 8; i++) { const v = 0.07 + 0.8 * i / 8, r = R * prof(v) * 1.07 + 0.03; pts.push([r * Math.cos(a), L * Math.cos(Math.PI * v), r * Math.sin(a)]); }
    B.grid(3, nv, tube(pts, (v) => 0.14 * (0.45 + 0.55 * Math.sin(Math.PI * v))), { kind: 2, dark: 0.25, body: (u, v) => v, lv: hi ? 24 : 30 });
  }
  B.grid(8, 6, tube([[0, L * 0.8, 0], [0, 0, 0], [0, -L * 0.85, 0]], hi ? (v) => 0.06 + 0.05 * v : (v) => 0.2 + 0.25 * v, 0.4), { kind: 0, dark: hi ? 0.2 : 0.75, body: (u, v) => v });   // the pharynx (hi: slim, tapering)
  B.grid(6, 4, blob([0, L + 0.05, 0], [0.17, 0.17, 0.17]), { kind: 2, dark: 0.4 });
  if (!goose) for (const s of [-1, 1]) B.grid(hi ? 14 : 10, hi ? 9 : 7, blob(hi ? [s * 0.85, -L * 1.06, 0] : [s * 0.8, -L * 0.98, 0], hi ? [0.68, 1.25, 1.0] : [0.75, 1.0, 1.05]), { kind: 0, dark: hi ? 0.04 : 0.12, body: 0.9, wave: 0.07, delay: s * 0.2, lu: hi ? 6 : 0 });
  else for (const s of [-1, 1]) B.grid(5, 3, tube([[s * 0.5, -0.2, 0], [s * 1.2, -0.9, 0], [s * 1.6, -1.6, 0]], (v) => 0.14 - 0.06 * v), { kind: 0, dark: 0.6 });
  if (hi) {                                               // the great ones: four waving auricles round the mouth, two ochre funnel canals
    for (let k = 0; k < 4; k++) {
      const sx = k < 2 ? 1 : -1, sz = k % 2 ? 1 : -1;
      B.grid(4, 6, tube([[sx * 0.5, -L * 0.62, sz * 0.75], [sx * 0.7, -L * 0.9, sz * 1.15], [sx * 0.55, -L * 1.22, sz * 1.3]], (v) => 0.13 * (1 - 0.6 * v), 0.5),
        { kind: 0, dark: 0.3, body: 0.95, lv: 9, wave: (u, v) => 0.14 * v, delay: (u, v) => 0.4 * v + k * 0.25 });
    }
    for (const sz of [-1, 1]) B.grid(4, 6, tube([[0, L * 0.72, sz * 0.12], [0, L * 0.35, sz * 0.5], [0, -L * 0.2, sz * 0.62]], (v) => 0.032, 1), { kind: 2, dark: 0.15, body: (u, v) => v });
  }
  return B.build(y);
}

// larvae, about 2.5 m: crab 'zoea', sea-urchin 'pluteus', 'copepod'
function larvaGeo(y, cast) {
  const B = new Builder(), tap = (r0, k) => (v) => r0 * (1 - k * v);
  if (cast === 'pluteus') {
    B.grid(12, 8, (u, v, o) => { const a = u * TAU, r = 0.58 * Math.pow(v, 0.7) * (1 + 0.1 * Math.cos(4 * a)) + 0.02; o[0] = r * Math.cos(a); o[1] = -1.0 + 1.05 * v; o[2] = r * Math.sin(a); },
      { kind: 0, dark: (u, v) => 0.3 * (1 - v), lu: 4, body: (u, v) => 1 - v, row: (u, v) => 0.05 * v });
    B.grid(8, 5, blob([0, -0.4, 0], [0.24, 0.32, 0.24]), { kind: 2, dark: 0.5 });
    for (let k = 0; k < 8; k++) {
      const a = (k + 0.5) / 8 * TAU, c = Math.cos(a), s = Math.sin(a), len = k % 2 ? 1.5 : 1.15;
      B.grid(4, 6, tube([[c * 0.5, -0.05, s * 0.5], [c * 0.72, len * 0.5, s * 0.72], [c * 0.95, len, s * 0.95]], tap(0.085, 0.6)),
        { kind: 0, dark: 0.4, lu: 1, lv: 7, body: 0.5, row: (u, v) => 0.05 + 0.16 * v * v, delay: (k % 2) * 0.12 });
      B.grid(4, 3, blob([c * 0.96, len + 0.04, s * 0.96], [0.07, 0.09, 0.07]), { kind: 2, dark: 0.4, row: 0.21, delay: (k % 2) * 0.12 });
    }
    return B.build(y);
  }
  if (cast === 'copepod') {
    B.grid(10, 9, tube([[0, 0, 1.15], [0, 0.03, 0.35], [0, 0, -0.5]], (v) => 0.42 * Math.pow(Math.sin(Math.PI * (0.1 + 0.82 * v)), 0.7)), { kind: 0, dark: 0.12, lv: 6, body: (u, v) => v * 0.5 });
    B.grid(6, 5, tube([[0, 0, -0.45], [0, -0.05, -1.0], [0, 0, -1.4]], tap(0.13, 0.4)), { kind: 0, dark: 0.35, lv: 4, body: 0.6, wave: (u, v) => 0.07 * v, delay: (u, v) => v * 0.3 });
    B.grid(5, 3, blob([0, 0.14, 1.02], [0.1, 0.1, 0.1]), { kind: 3 });
    for (const s of [-1, 1]) {
      B.grid(4, 8, tube([[s * 0.2, 0.05, 0.92], [s * 0.85, 0.12, 0.8], [s * 1.6, 0.16, 0.5]], tap(0.06, 0.6)), { kind: 0, dark: 0.45, lv: 14, body: 0.4, row: (u, v) => 0.6 * v * v });
      B.grid(4, 3, tube([[s * 0.06, 0, -1.4], [s * 0.3, 0, -1.95]], tap(0.04, 0.5)), { kind: 0, dark: 0.5, wave: 0.07, delay: 0.3 });
      B.grid(6, 4, blob([s * 0.24, -0.06, -0.92], [0.15, 0.15, 0.3]), { kind: 2, dark: 0.45 });
      for (let j = 0; j < 4; j++) B.grid(3, 3, tube([[s * 0.16, -0.25, 0.55 - j * 0.24], [s * 0.3, -0.75, 0.6 - j * 0.24]], tap(0.045, 0.5)), { kind: 0, dark: 0.5, row: (u, v) => 0.3 * v, delay: j * 0.12 });
    }
    return B.build(y);
  }
  B.grid(12, 9, tube([[0, 0.05, 0.64], [0, 0.1, 0.1], [0, 0, -0.47]], (v) => 0.52 * Math.pow(Math.sin(Math.PI * (0.12 + 0.8 * v)), 0.7)), { kind: 0, dark: 0.1, body: (u, v) => v * 0.5 });
  B.grid(5, 6, tube([[0, 0.35, -0.05], [0, 1.0, -0.3], [0, 1.6, -0.78]], tap(0.1, 0.85)), { kind: 0, dark: 0.45, lu: 1, body: 0.4 });      // dorsal spine
  B.grid(5, 6, tube([[0, -0.05, 0.6], [0, -0.62, 0.86], [0, -1.2, 0.8]], tap(0.1, 0.85)), { kind: 0, dark: 0.45, lu: 1, body: 0.4 });     // rostral spine
  B.grid(6, 7, tube([[0, -0.1, -0.45], [0, -0.45, -0.9], [0, -0.95, -0.95], [0, -1.3, -0.6]], tap(0.16, 0.45)),
    { kind: 0, dark: 0.3, lv: 6, body: (u, v) => 0.5 + 0.5 * v, wave: (u, v) => 0.1 * v * v, delay: (u, v) => v * 0.3 });                  // abdomen
  for (const s of [-1, 1]) {
    B.grid(8, 6, blob([s * 0.37, 0.08, 0.42], [0.2, 0.2, 0.2]), { kind: 3, lu: 6, lv: 5 });                                                // faceted eye
    B.grid(4, 3, blob([s * 0.3, 0.32, -0.1], [0.1, 0.07, 0.12]), { kind: 2, dark: 0.4 });
    B.grid(3, 3, tube([[0, -1.3, -0.6], [s * 0.24, -1.62, -0.35]], tap(0.05, 0.6)), { kind: 0, dark: 0.5, wave: 0.1, delay: 0.3 });        // telson fork
    for (let j = 0; j < 2; j++) {                                                                                                          // rowing legs
      const z = 0.22 - j * 0.32;
      B.grid(4, 6, tube([[s * 0.3, -0.3, z], [s * 0.78, -0.75, z + 0.1], [s * 1.02, -1.28, z - 0.1]], tap(0.075, 0.45)), { kind: 0, dark: 0.4, lv: 5, body: 0.7, row: (u, v) => 0.6 * v * v, delay: j * 0.15 });
      B.grid(5, 3, blob([s * 1.04, -1.4, z - 0.12], [0.05, 0.24, 0.17]), { kind: 0, dark: 0.15, lu: 5, row: 0.6, delay: j * 0.15 });
    }
  }
  return B.build(y);
}

// spined radiolarian of unit radius: lattice shell, rose capsule, glass spines
function radGeo(y, spines) {
  const B = new Builder();
  B.lattice(1, 3, { kind: 1, dark: 0.16, bar: 0.17 });
  B.grid(10, 7, blob([0, 0, 0], [0.44, 0.44, 0.44]), { kind: 0, dark: 0.5, pulse: 0.12, pivot: [0, 0, 0] });
  for (let i = 0; i < spines; i++) {
    const y = 1 - 2 * (i + 0.5) / spines, r = Math.sqrt(1 - y * y), a = i * 2.39996, len = 1.9 + 0.7 * ((i * 7) % 5) / 4;
    const d = [r * Math.cos(a), y, r * Math.sin(a)];
    B.grid(3, 3, tube([d.map((x) => x * 0.45), d, d.map((x) => x * len)], (v) => 0.075 * (1 - 0.72 * v)), { kind: 1, dark: 0.55, lu: 1 });
  }
  return B.build(y);
}

// siphonophore, 60 m, hanging from y = 0: a float, fourteen swimming bells firing in sequence, a stem of feeding
// polyps under glass bracts. Each bell is a real cup opening outward and down (rim ring, four canals, its rim
// squeezing shut on the beat); hi: the finer cast for the great chains of the avenue, an ochre oil drop in each bell.
function siphoGeo(y, hi = false) {
  const B = new Builder(), sway = (y) => 0.5 * (y / 60) * (y / 60), dl = (y) => -y / 60 * 1.3;
  B.grid(8, 5, blob([0, 0.7, 0], [0.45, 0.85, 0.45]), { kind: 2, dark: 0.3 });
  for (let i = 0; i < 14; i++) {
    const s = i % 2 ? 1 : -1, zo = i % 4 < 2 ? 0.25 : -0.25, c = [s * 0.82, -0.8 - i * 1.02, zo];
    const ax = [s * 0.8, -0.56, zo * 0.8], al = Math.hypot(ax[0], ax[1], ax[2]); ax[0] /= al; ax[1] /= al; ax[2] /= al;   // the way the mouth of the bell points
    const e1 = [-ax[1], ax[0], 0], l1 = Math.hypot(e1[0], e1[1]) || 1; e1[0] /= l1; e1[1] /= l1;
    const e2 = [ax[1] * e1[2] - ax[2] * e1[1], ax[2] * e1[0] - ax[0] * e1[2], ax[0] * e1[1] - ax[1] * e1[0]];
    B.grid(hi ? 12 : 8, hi ? 7 : 5, (u, v, o) => {
      const a = u * TAU, th = 0.04 + v * 2.25, r = 0.86 * Math.sin(th) * (1 + 0.04 * Math.cos(4 * a) * v), h = -0.74 * Math.cos(th) - 0.1, ca = Math.cos(a) * r, sa = Math.sin(a) * r;
      o[0] = c[0] + ax[0] * h + e1[0] * ca + e2[0] * sa; o[1] = c[1] + ax[1] * h + e1[1] * ca + e2[1] * sa; o[2] = c[2] + ax[2] * h + e1[2] * ca + e2[2] * sa;
    }, { kind: 0, dark: (u, v) => 0.02 + 0.3 * v * v * v, body: i / 40, lu: 4, lv: 1.5, pulse: (u, v) => 0.34 * v * v, pivot: c, delay: i / 14 });
    if (hi) B.grid(5, 3, blob([c[0] - ax[0] * 0.42, c[1] - ax[1] * 0.42, c[2] - ax[2] * 0.42], [0.17, 0.17, 0.17]), { kind: 2, dark: 0.4 });
  }
  B.grid(3, 40, tube([[0, 0.2, 0], [0, -30, 0], [0, -60, 0]], () => 0.13), { kind: 1, dark: 0.4, body: (u, v) => v, wave: (u, v) => sway(60 * v), delay: (u, v) => 1.3 * v });
  for (let j = 0; j < 18; j++) {
    const y = -16.5 - j * 2.4, s = j % 2 ? 1 : -1, z = (j % 3 - 1) * 0.3, o = { body: 0.3 + 0.7 * (-y / 60), wave: sway(y), delay: dl(y) };
    B.grid(5, 4, tube([[0, y, 0], [s * 0.5, y - 0.7, z], [s * 0.65, y - 1.7, z]], (v) => 0.1 + 0.3 * Math.sin(Math.PI * v)), { kind: 0, dark: 0.5, ...o });
    B.grid(4, 3, blob([s * 0.66, y - 1.78, z], [0.15, 0.17, 0.15]), { kind: 2, dark: 0.4, ...o });
    B.grid(6, 4, blob([-s * 0.62, y + 0.4, -z], [0.62, 0.45, 0.13]), { kind: 0, dark: 0.04, lu: 3, ...o });
  }
  return B.build(y);
}

// small medusa of unit radius: bell with four canals, manubrium, four ochre gonads, eight tentacles.
// hi: the finer cast for the gate pair (shown 9 m across beside the hero): a scalloped rim, a slim pale manubrium
// ending in four lip lobes, and sixteen hair-thin tentacles trailing in a curve with a wave running down them.
function hydroGeo(y, hi = false) {
  const B = new Builder(), axis = (P) => [0, P[1], 0];
  B.grid(hi ? 32 : 20, hi ? 12 : 9, (u, v, o) => { const a = u * TAU, th = 0.02 + v * 1.9, r = Math.sin(th) * (1 + 0.035 * Math.cos(4 * a) * v + (hi ? 0.035 * Math.cos(16 * a) * v * v * v : 0)); o[0] = r * Math.cos(a); o[1] = 0.85 * Math.cos(th) + 0.1; o[2] = r * Math.sin(a); },
    { kind: 0, dark: (u, v) => (hi ? 0.24 : 0.3) * v * v * v, body: (u, v) => v * 0.6, pulse: (u, v) => 0.3 * v * v, pivot: axis, lu: 4 });
  B.grid(hi ? 8 : 6, hi ? 7 : 5, tube([[0, 0.9, 0], [0, 0.2, 0], [0, -0.4, 0]], hi ? (v) => 0.11 - 0.05 * Math.sin(Math.PI * v) + 0.09 * v * v : (v) => 0.17 - 0.1 * Math.sin(Math.PI * v) + 0.08 * v * v), { kind: 0, dark: hi ? 0.4 : 0.8, body: 0.3, lu: hi ? 4 : 0 });
  if (hi) for (let k = 0; k < 4; k++) { const a = (k + 0.5) / 4 * TAU; B.grid(5, 4, blob([0.15 * Math.cos(a), -0.47, 0.15 * Math.sin(a)], [0.1, 0.17, 0.1]), { kind: 0, dark: 0.3, body: 0.4, wave: 0.03, delay: k * 0.25 }); }
  for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; B.grid(6, 4, blob([0.54 * Math.cos(a), 0.7, 0.54 * Math.sin(a)], [0.14, 0.1, 0.14]), { kind: 2, dark: 0.4, body: 0.3, pulse: 0.12, pivot: axis }); }
  const nT = hi ? 16 : 8;
  for (let k = 0; k < nT; k++) {
    const a = (k + 0.5) / nT * TAU, c = Math.cos(a), s = Math.sin(a), ln = hi ? 1 + 0.3 * ((k * 5) % 3) / 2 : 1;
    if (hi) B.grid(3, 12, tube([[0.94 * c, -0.19, 0.94 * s], [1.12 * c, -1.3 * ln, 1.12 * s], [1.0 * c, -2.9 * ln, 1.0 * s]], (v) => 0.034 * (1 - 0.55 * v)),
      { kind: 0, dark: 0.5, body: (u, v) => 0.6 + 0.4 * v, wave: (u, v) => 0.3 * v * v, delay: (u, v) => v * 1.3 + k * 0.13, pulse: (u, v) => 0.3 * (1 - v), pivot: axis });
    else B.grid(3, 6, tube([[0.94 * c, -0.19, 0.94 * s], [1.05 * c, -1.2, 1.05 * s], [1.0 * c, -2.4, 1.0 * s]], (v) => 0.06 * (1 - 0.6 * v)),
      { kind: 0, dark: 0.5, body: (u, v) => 0.6 + 0.4 * v, wave: (u, v) => 0.22 * v * v, delay: (u, v) => v * 0.5 + k * 0.13, pulse: (u, v) => 0.3 * (1 - v), pivot: axis });
  }
  return B.build(y);
}

// ephyra (the rare swarm): an eight-armed star 1.5 m across whose arms fold with each beat
function ephyraGeo(y) {
  const B = new Builder();
  // a shallow cone cut into a star: 4 columns per arm so both the tips and the deep notches are sampled; paper-faced
  // (lv 1.5 draws the key line round the rim and a ring round the ochre dot; rose gathers only toward the rim)
  B.grid(32, 1, (u, v, o) => { const a = u * TAU, lobe = Math.pow(Math.abs(Math.cos(4 * a)), 1.5), r = 0.75 * v * (0.2 + 0.8 * lobe); o[0] = r * Math.cos(a); o[1] = 0.26 * (1 - v) - 0.1 * v * lobe; o[2] = r * Math.sin(a); },
    { kind: 0, dark: (u, v) => 0.42 * v, body: (u, v) => v, lv: 1.5, pulse: (u, v) => 0.4 * v * v, pivot: [0, -0.7, 0] });
  B.grid(5, 3, blob([0, 0.2, 0], [0.13, 0.08, 0.13]), { kind: 2, dark: 0.4 });
  return B.build(y);
}

// the great shell's parts: a strut of triangular section flared at both ends (z 0..1), and a knuckle with a thorn (+Y out)
function strutGeo(y) {
  return new Builder().grid(3, 6, (u, v, o) => { const a = u * TAU + Math.PI / 2, f = 2 * v - 1, r = 0.52 * (1 + 1.1 * f * f * f * f); o[0] = r * Math.cos(a); o[1] = r * Math.sin(a); o[2] = v; }, { kind: 1, dark: 0.36, lu: 3, body: 0.2 }).build(y);
}
function nodeGeo(y, thorn) {
  const B = new Builder();
  B.grid(8, 5, blob([0, 0, 0], [0.98, 0.78, 0.98]), { kind: 1, dark: 0.44, body: 0.2, lu: 6, lv: 3 });
  B.grid(4, 3, tube([[0, 0.5, 0], [0, 0.5 + thorn * 0.5, 0], [0, 0.5 + thorn, 0]], (v) => 0.24 * Math.pow(1 - v, 1.2) + 0.03), { kind: 1, dark: 0.5, body: 0.3, lu: 2 });
  return B.build(y);
}

// Goldberg lattice: the dual of a geodesic icosahedron. cells = geodesic vertices (hexagons, 12 pentagons),
// nodes = triangle centres, struts = pairs of triangles sharing an edge (va, vb are the two cells a strut divides).
async function goldberg(y, detail) {
  const p = await icoPoints(1, detail, y), map = new Map(), verts = [], tris = [];
  const id = (i) => {
    const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2], key = Math.round(x * 2e3) + ',' + Math.round(y * 2e3) + ',' + Math.round(z * 2e3);
    let k = map.get(key); if (k === undefined) { k = verts.length; verts.push(new THREE.Vector3(x, y, z).normalize()); map.set(key, k); } return k;
  };
  for (let i = 0; i < p.length / 3; i += 3) { tris.push([id(i), id(i + 1), id(i + 2)]); if (i % 120 === 117) await y(); }
  await y();
  const nbr = verts.map(() => new Set()), edges = new Map(), struts = [];
  tris.forEach((t, ti) => {
    for (let e = 0; e < 3; e++) {
      const a = t[e], b = t[(e + 1) % 3], key = a < b ? a + '_' + b : b + '_' + a;
      nbr[a].add(b); nbr[b].add(a);
      const o = edges.get(key); if (o === undefined) edges.set(key, ti); else struts.push([o, ti, a, b]);
    }
  });
  return { verts, tris, nbr, struts };
}

// ------------------------------------------------------------------ 4. The world
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _s = new THREE.Vector3();
const _size = new THREE.Vector2(), X_AXIS = new THREE.Vector3(1, 0, 0), Y_AXIS = new THREE.Vector3(0, 1, 0);

export default {
  id: 'litho-medusae',
  name: 'The Plate of Medusae',
  category: 'ocean',
  weirdness: 0.4,
  media: ['underwater', 'tiny'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;

    // ---- SEEDED: the edition (which pull of the plate), the hero's species, the shell cast and the company cast.
    // Every seeded choice is drawn here, before the first yield; the builders below use their own forks.
    const pick = rng.fork('edition');
    const hourPick = pick.pick(['golden', 'day', 'day', 'dawn', 'day', 'golden', 'night', 'day']);
    const hour = ['dawn', 'day', 'golden', 'night'].includes(vary.hour) ? vary.hour : hourPick;
    const species = pick.pick(['chrysaora', 'pelagia', 'cyanea', 'chrysaora']);
    const shellCast = pick.pick(['actinomma', 'star', 'aulonia', 'actinomma']);
    const combCast = pick.pick(['lobate', 'gooseberry', 'girdle']);
    const larvaCast = pick.pick(['zoea', 'pluteus', 'copepod']);
    const period = 4 + 2 * clamp(vary.mood ?? 0.5, 0, 1);
    const castRng = rng.fork('cast'), speckRng = rng.fork('specks'), hairRng = rng.fork('hair'), rareRng = rng.fork('rare');
    const night = hour === 'night' ? 1 : 0;
    const palette = PALETTE.slice();
    if (hour === 'golden') palette[2] = '#B9506E';                       // the warm pull: a deeper rose, ochre carries the shade
    if (night) palette[5] = '#33564C';                                   // the knocked-out ground: the stomach goes sepia-dense

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(palette[0]);
    // LOADING: the hand-back given to every builder below. No builder draws a random number, and the seeded loops
    // further down draw only from this world's own forks (castRng, hairRng, speckRng, rareRng), which nothing else
    // touches, so a hand-back between two passes of a loop cannot change the order of any draw.
    const pause = () => ctx.yield();

    // ---- HERO: the great medusa. Its local z = 433 - d and local y = y + 232, so it stands at (0, -232, 0)
    // and the mouth (the portal seat) comes to world (0, 58, 0).
    const hero = await buildHero(ctx, { palette, species, period, shadeInk: hour === 'golden' ? palette[4] : undefined, page: false });
    hero.object.position.set(0, -232, 0);
    scene.add(hero.object);
    const U = hero.uniforms;
    await ctx.yield();

    const uViewH = { value: 450 }, uNightK = { value: night };
    const uReg = { value: hour === 'dawn' ? new THREE.Vector3(120, 90, 60) : new THREE.Vector3(220, 180, 140) };
    const creatureMat = (o) => styleMaterial(U, { tint: !!o.tint, side: THREE.DoubleSide, vertex: CREATURE_VERT, fragment: CREATURE_FRAG,
      uniforms: { uReg, uNightK, uForce: { value: o.force ?? 0 }, uSeed: { value: o.seed ?? 0 }, uFres: { value: o.fres ?? 0.3 }, uSil: { value: o.sil ?? 1 }, uSh: { value: o.sh ?? 0.5 } } });
    // an instanced kind: list = [{ sign, phase, rate, seed }]; matrices are written by the caller or by the movers
    const inst = (geo, mat, n, order) => {
      const mesh = new THREE.InstancedMesh(geo, mat, n); mesh.frustumCulled = false; mesh.renderOrder = order;
      const aI = new Float32Array(n * 4); geo.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4));
      scene.add(mesh);
      return { mesh, aI, set(i, sign, phase, rate, seed) { aI[i * 4] = sign; aI[i * 4 + 1] = phase; aI[i * 4 + 2] = rate; aI[i * 4 + 3] = seed; } };
    };

    // ---- PATH. Centre line in the brief's (d, y): level to d 190, a 7.3 degree sink, a 45 m pull-up, then 60 m dead
    // straight up the hero's axis (65 degrees) to the mouth. World z = 433 - d. The sway (6 m, 168 m period, held under
    // 1.5 m through the shell and gone by d 335) is in the points, so camera sway and bank are 0.
    const mouth = hero.anchors.mouth.clone().add(hero.object.position), ax = hero.anchors.axis;
    const E = [433 - mouth.z, mouth.y], dirE = [-ax.z, ax.y];
    const F = [E[0] - 60 * dirE[0], E[1] - 60 * dirE[1]];                 // where the straight climb begins
    const RARC = 45, Cc = [F[0] - RARC * dirE[1], F[1] + RARC * dirE[0]], aEnd = Math.atan2(dirE[1], dirE[0]);
    let al = 0.128, S = [0, 0];                                           // sink angle and the point where the pull-up starts
    for (let i = 0; i < 8; i++) { S = [Cc[0] - RARC * Math.sin(al), Cc[1] - RARC * Math.cos(al)]; al = Math.atan2(-S[1], S[0] - 190); }
    const lineY = (d) => (d <= 190 ? 0 : d <= S[0] ? -(d - 190) * Math.tan(al) : d < F[0] ? Cc[1] - Math.sqrt(Math.max(0, RARC * RARC - (d - Cc[0]) ** 2)) : F[1] + (d - F[0]) * dirE[1] / dirE[0]);
    const swayX = (d) => 6 * (1 - 0.8 * smoothstep(105, 140, d) * (1 - smoothstep(200, 235, d))) * (1 - smoothstep(290, 335, d)) * Math.cos(TAU * d / 168);
    const pts = [];
    for (let d = 0; d < 186; d += 12) pts.push([swayX(d), 0, 433 - d]);
    pts.push([swayX(190), -0.2, 433 - 190]);
    for (let d = 206; d < S[0] - 8; d += 16) pts.push([swayX(d), lineY(d), 433 - d]);
    for (let i = 0; i <= 8; i++) { const th = -al + (aEnd + al) * i / 8, d = Cc[0] + RARC * Math.sin(th); pts.push([swayX(d), Cc[1] - RARC * Math.cos(th), 433 - d]); }
    for (let i = 1; i <= 3; i++) pts.push([0, F[1] + 20 * i * dirE[1], 433 - (F[0] + 20 * i * dirE[0])]);
    await ctx.yield();
    const path = makePath(pts);
    await ctx.yield();
    const clearOf = (x, y, z, r) => path.distanceTo(x, y, z) > r + 7 && path.distanceTo(-x, y, z) > r + 7;

    // ---- PAGE: the sheet in every direction (drawn first, no depth)
    const pageMat = styleMaterial(U, { side: THREE.BackSide, depthTest: false, vertex: PAGE_VERT, fragment: PAGE_FRAG,
      uniforms: { uPaperLow: { value: new THREE.Color('#D8DDC6') }, uNight: { value: night } } });
    pageMat.depthWrite = false;
    await ctx.yield();
    const page = new THREE.Mesh(new THREE.IcosahedronGeometry(1500, 2), pageMat);
    page.frustumCulled = false; page.renderOrder = -1; scene.add(page);

    // world-space hair ribbons (axopodia, tentilla, stems, gooseberry tentacles), filled in as the cast is placed
    const hair = { root: [], dir: [], h: [], g: [], idx: [], n: 0 };
    const addHair = (r, d, segs, hw, kind, amp, reel, phase, sign) => {
      for (let i = 0; i <= segs; i++) for (let j = 0; j < 2; j++) {
        hair.root.push(r[0] * sign, r[1], r[2]); hair.dir.push(d[0] * sign, d[1], d[2]);
        hair.h.push(i / segs, j * 2 - 1, phase - (sign < 0 ? 0.45 : 0), hw); hair.g.push(kind, amp, reel, sign);
      }
      for (let i = 0; i < segs; i++) { const a = hair.n + i * 2; hair.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      hair.n += (segs + 1) * 2;
    };
    const hairPair = (r, d, segs, hw, kind, amp, reel) => { const ph = hairRng.range(0, TAU); addHair(r, d, segs, hw, kind, amp, reel, ph, 1); addHair(r, d, segs, hw, kind, amp, reel, ph, -1); };

    // ---- THE GREAT RADIOLARIAN: a Goldberg lattice 40 m across at d 170. Two six-sided cells on the mirror plane,
    // about 119 degrees apart, are opened (with their rings) as the pores; the lattice is turned about x so both
    // sit at path height, and the centre drops so the path runs pore to pore 10 m above it.
    await ctx.yield();
    const G = await goldberg(pause, 3), SR = 20;
    await ctx.yield();
    const onPlane = G.verts.map((v, i) => i).filter((i) => Math.abs(G.verts[i].x) < 1e-4 && G.nbr[i].size === 6);
    let best = [onPlane[0], onPlane[1], 9];
    for (const a of onPlane) for (const b of onPlane) { const err = Math.abs(G.verts[a].angleTo(G.verts[b]) - 2.08); if (a !== b && err < best[2]) best = [a, b, err]; }
    const va = G.verts[best[0]], vb = G.verts[best[1]], bis = va.clone().add(vb).normalize();
    const rotM = new THREE.Matrix4().makeRotationX(Math.atan2(-bis.z, bis.y));
    G.verts.forEach((v) => v.applyMatrix4(rotM));
    const poreH = SR * Math.cos(va.angleTo(vb) / 2), shellC = new THREE.Vector3(0, -poreH, 433 - 170);
    const pore = new Set([best[0], ...G.nbr[best[0]], best[1], ...G.nbr[best[1]]]);
    const nearPore = (v, c) => v.dot(va) > c || v.dot(vb) > c;
    const nodeP = G.tris.map((t) => new THREE.Vector3().add(G.verts[t[0]]).add(G.verts[t[1]]).add(G.verts[t[2]]).normalize());
    await ctx.yield();
    const shellMat = creatureMat({ force: 1, seed: 11, fres: 0.25 });
    const struts = G.struts.filter((s) => !(pore.has(s[2]) && pore.has(s[3])));
    const strutI = inst(await strutGeo(pause), shellMat, struts.length, 0);
    const placeStrut = (s, i) => {
      const A = _v.copy(nodeP[s[0]]).multiplyScalar(SR), B = _v2.copy(nodeP[s[1]]).multiplyScalar(SR);
      const z = B.clone().sub(A), L = z.length(); z.normalize();
      const y = A.clone().add(B).normalize(), x = new THREE.Vector3().crossVectors(y, z).normalize(); y.crossVectors(z, x);
      const th = pore.has(s[2]) !== pore.has(s[3]) ? 1.32 : 1.15;          // the collar round each pore is stouter
      _m4.makeBasis(x.multiplyScalar(th), y.multiplyScalar(th), z.multiplyScalar(L)).setPosition(A.add(shellC));
      strutI.mesh.setMatrixAt(i, _m4); strutI.set(i, 1, 0, 0, i * 0.37);
    };
    for (let i = 0; i < struts.length; i++) { placeStrut(struts[i], i); if (i % 60 === 59) await ctx.yield(); }   // (no scratch vector is held across a hand-back)
    await ctx.yield();
    const nodes = []; G.tris.forEach((t, i) => { if (!(pore.has(t[0]) && pore.has(t[1]) && pore.has(t[2]))) nodes.push(i); });
    const nodeI = inst(await nodeGeo(pause, shellCast === 'aulonia' ? 2.8 : 1.7), shellMat, nodes.length, 0);
    const placeNode = (ti, i) => {
      const y = nodeP[ti], x = _v.crossVectors(y, Math.abs(y.y) > 0.9 ? X_AXIS : Y_AXIS).normalize().clone(), z = new THREE.Vector3().crossVectors(x, y);
      const t = G.tris[ti], sc = (pore.has(t[0]) || pore.has(t[1]) || pore.has(t[2])) ? 1.14 : 1;
      _m4.makeBasis(x.multiplyScalar(sc), y.clone().multiplyScalar(sc), z.multiplyScalar(sc)).setPosition(_v2.copy(y).multiplyScalar(SR).add(shellC));
      nodeI.mesh.setMatrixAt(i, _m4); nodeI.set(i, 1, 0, 0, i * 0.61);
      // axopodia: hair-fine rays with algae beads streaming out along them (mirrored pairs, away from the pores)
      if (y.x > 0.12 && !nearPore(y, 0.74) && hairRng() < 0.5) { const L = hairRng.range(9, 17), r = _v3.copy(y).multiplyScalar(SR + 1).add(shellC); hairPair([r.x, r.y, r.z], [y.x * L, y.y * L, y.z * L], 8, 0.2, 1, 0.05, 0); }
    };
    for (let i = 0; i < nodes.length; i++) { placeNode(nodes[i], i); if (i % 40 === 39) await ctx.yield(); }
    await ctx.yield();
    // the core: inner lattice shell, the breathing rose capsule, the spines of this cast
    {
      const B = new Builder();
      B.lattice(3.5, 2, { kind: 1, dark: 0.25, bar: 0.2 });
      if (shellCast === 'aulonia') B.lattice(5.9, 2, { kind: 1, dark: 0.2, bar: 0.15 });
      B.grid(16, 10, blob([0, 0, 0], [2.3, 2.3, 2.3]), { kind: 0, dark: 0.5, pulse: 0.1, pivot: [0, 0, 0], lu: 8 });
      let dirs = [];
      // (the level pair leans down and away into the page: no spine lies dead level across the frame)
      if (shellCast === 'actinomma') dirs = [[0.88, -0.24, -0.41], [-0.88, -0.24, -0.41], [0.766, 0.643, 0], [-0.766, 0.643, 0], [0.766, -0.643, 0], [-0.766, -0.643, 0]].map((d) => new THREE.Vector3(...d).normalize());
      else if (shellCast === 'star') {
        const ig = new THREE.IcosahedronGeometry(1, 0), p = ig.attributes.position.array;
        for (let i = 0; i < 20; i++) dirs.push(new THREE.Vector3(p[i * 9] + p[i * 9 + 3] + p[i * 9 + 6], p[i * 9 + 1] + p[i * 9 + 4] + p[i * 9 + 7], p[i * 9 + 2] + p[i * 9 + 5] + p[i * 9 + 8]).normalize().applyMatrix4(rotM));
        ig.dispose();
      }
      const len0 = shellCast === 'star' ? 36 : 50, r0 = shellCast === 'star' ? 0.6 : 0.95;                 // stout at the shell, tapering to a point
      for (const d of dirs) {
        const len = Math.abs(d.z) > 0.2 && shellCast === 'actinomma' ? 46 : len0;
        let ok = true;                                                    // a spine never comes within 8 m of the flight line
        for (let r = 3; r <= len; r += 1) if (Math.hypot(d.x * r, d.y * r - poreH) < 8) ok = false;
        if (!ok) continue;
        B.grid(6, 16, tube([[d.x * 3.3, d.y * 3.3, d.z * 3.3], [d.x * len * 0.5, d.y * len * 0.5, d.z * len * 0.5], [d.x * len, d.y * len, d.z * len]], (v) => r0 * Math.pow(1 - 0.94 * v, 1.25) * (1 + 0.5 * Math.exp(-((v * len - SR) ** 2) / 6))),
          { kind: 1, dark: 0.42, lu: 6, body: 0.2 });
      }
      await ctx.yield();
      const coreI = inst(await B.build(pause), shellMat, 1, 0);
      coreI.mesh.setMatrixAt(0, _m4.makeTranslation(shellC.x, shellC.y, shellC.z)); coreI.set(0, 1, 0, 0.22, 5);
      await ctx.yield();
      // the glass: a tint sphere that prints green only toward its limb and on its shade side
      const gl = await new Builder().grid(40, 26, blob([0, 0, 0], [SR - 0.5, SR - 0.5, SR - 0.5]), { kind: 1, dark: -0.3, body: 0.2,
        cull: (x, y, z) => { _v.set(x, y, z).normalize(); return nearPore(_v, 0.86); } }).build(pause);
      await ctx.yield();
      const glassI = inst(gl, creatureMat({ tint: true, force: 1, seed: 17, fres: 0.8, sil: 0.5, sh: 0.3 }), 1, 1);
      glassI.mesh.setMatrixAt(0, _m4.makeTranslation(shellC.x, shellC.y, shellC.z)); glassI.set(0, 1, 0, 0, 9);
    }
    await ctx.yield();

    // ---- THE AVENUE (staged by hand, mirrored): four pairs of great forms stand either side of the lane down the
    // sink, each 26 m ahead of the lens at u 0.5, 0.55, 0.6 and 0.65, so the medusa is seen through a proscenium the
    // whole way: a great siphonophore chain (its column of bells 26 m tall), a great comb jelly (17 m), a chain, a comb
    // jelly, and last (26 m ahead at u 0.7) a pair of great hydromedusae 9 m across, hopping with each pulse: small
    // echoes of the hero as its gate. The later pairs stand behind the nearer ones as the middle distance. In the girdle cast the two Venus
    // girdles rise diagonally toward the medusa in front of the first chain. The seeded company keeps its own
    // draws and is only nudged outward where it would stand inside one of these.
    const avenue = [], CHAIN_S = 1.8, GREAT_S = 3.0, GATE_S = 4.6;
    const stageAt = (u, ahead, x, dy) => { const c = path.pointAt(u, _v); return [x, c.y + dy, c.z - ahead]; };
    const chainSpots = [stageAt(0.5, 26, 18, 13), stageAt(0.6, 26, 19.5, 17)];
    const greatSpots = [stageAt(0.55, 26, 17.5, 2), stageAt(0.65, 26, 18, 7)];
    for (const p of chainSpots) for (const dy of [0, -14, -28, -44, -62, -80, -98]) avenue.push([p[0], p[1] + dy, p[2], 7]);
    const gateSpot = stageAt(0.7, 26, 19, 9);
    for (const p of greatSpots) avenue.push([p[0], p[1] - 1.5, p[2], 11]);
    avenue.push([gateSpot[0], gateSpot[1] - 4, gateSpot[2], 11]);
    let girdleM = null;
    if (combCast === 'girdle') {
      const c = path.pointAt(0.47, new THREE.Vector3()); c.x = 0;
      const P = new THREE.Vector3(24, c.y + 3, c.z - 34), Z = new THREE.Vector3(0.2, 0.62, -0.76).normalize();
      const Y = c.clone().sub(P); Y.addScaledVector(Z, -Y.dot(Z)).normalize();                  // the band faces the lens at u 0.47
      girdleM = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(Y, Z), Y, Z).setPosition(P);
      for (let k = -2; k <= 2; k++) avenue.push([P.x + Z.x * 9 * k, P.y + Z.y * 9 * k, P.z + Z.z * 9 * k, 5]);
    }
    await ctx.yield();
    const nudge = (x, y, z, r, tall) => {
      const hit = (yy, rr) => avenue.some((a) => Math.hypot(a[0] - x, a[1] - yy, a[2] - z) < a[3] + rr + 2);
      for (let k = 0; k < 8 && (hit(y, r) || (tall && (hit(y - 30, 9) || hit(y - 55, 9)))); k++) x += 7;
      return [x, y, z];
    };

    // ---- COMPANY: mirrored pairs. One InstancedMesh per kind holds both twins (aI.x = -1 mirrors in the shader);
    // the movers write one matrix per twin each frame, the left twin half a second behind the right.
    const placed = [], movers = [];
    const freeSpot = (r, dLo, dHi, xLo, xHi, yLo, yHi) => {
      for (let k = 0; k < 80; k++) {
        const d = castRng.range(dLo, dHi), x = castRng.range(xLo, xHi) + r, y = lineY(Math.min(d, 395)) + castRng.range(yLo, yHi), z = 433 - d;
        if (!clearOf(x, y, z, r + 3)) continue;
        if (Math.hypot(x, y - shellC.y, z - shellC.z) < r + 42) continue;         // clear of the great shell and its spines
        if (d > 300 && x < 26 + r) continue;                                       // nothing between the lens and the mouth
        if (d > 350 && x < 48 + r) continue;                                       // nor inside the medusa's own curtains
        if (placed.some((p) => Math.hypot(p[0] - x, p[1] - y, p[2] - z) < p[3] + r + 3)) continue;
        placed.push([x, y, z, r]); return nudge(x, y, z, r);
      }
      return null;
    };
    const lateSpot = (r) => freeSpot(r, 325, 448, 48, 88, -25, 85);                 // flanking the approach to the medusa
    const randQuat = (tilt) => new THREE.Quaternion().setFromEuler(new THREE.Euler(castRng.range(-tilt, tilt), castRng.range(0, TAU), castRng.range(-tilt, tilt)));
    const addPair = (I, i, pos, quat, scale, kind, phase, rate, o = {}) => {
      I.set(i, 1, phase, rate, i * 0.73); I.set(i + 1, -1, phase, rate, i * 0.73);
      movers.push({ I, i, pos: new THREE.Vector3(pos[0], pos[1], pos[2]), quat, scale, kind, phase, rate, ...o });
    };
    const pairs = (n) => Math.max(2, Math.round(n * density));

    // comb jellies (or sea gooseberries, or a pair of Venus girdles with lobate company); one pair is staged at d 240
    const combSpot = [13, lineY(240) + 0.6, 433 - 240]; placed.push([...combSpot, 3]);
    const nComb = pairs(6), combGlass = creatureMat({ tint: !night, seed: 2, fres: 0.55, sh: 0.3 });
    await ctx.yield();
    const combI = inst(await combGeo(pause, combCast === 'girdle' ? 'lobate' : combCast), combGlass, nComb * 2, 3);
    await ctx.yield();
    const gooseHair = (p, s) => {
      for (const sx of [-1, 1]) {
        const r = [p[0] + sx * 1.6 * s, p[1] - 1.6 * s, p[2]], d = [sx * 3.5, -11, 1.5];
        hairPair(r, d, 22, 0.1, 2, 0.05, 0.35);
        for (let b = 1; b <= 7; b++) { const f = b / 8; hairPair([r[0] + d[0] * f, r[1] + d[1] * f, r[2] + d[2] * f], [sx * 1.4, -1.3, 0.5], 4, 0.05, 0, 0.1, 0.35); }
      }
    };
    for (let k = 0; k < nComb; k++) {
      await ctx.yield();
      const staged = k === 0 && combCast !== 'girdle';
      const p = staged ? combSpot : freeSpot(3, 30, 400, 11, 60, -30, 30); if (!p) { combI.mesh.setMatrixAt(k * 2, _m4.makeScale(0, 0, 0)); combI.mesh.setMatrixAt(k * 2 + 1, _m4); continue; }
      const s = staged ? 1 : castRng.range(0.8, 1.25), q = staged ? new THREE.Quaternion().setFromEuler(new THREE.Euler(0.25, 0.4, -0.3)) : randQuat(0.7), ph = castRng();
      if (combCast === 'gooseberry') {                                             // gooseberries hang still and fish with two tentacles
        combI.set(k * 2, 1, ph, 0.3, k); combI.set(k * 2 + 1, -1, ph, 0.3, k);
        _m4.compose(_v.set(p[0], p[1], p[2]), _q.identity(), _s.setScalar(s)); combI.mesh.setMatrixAt(k * 2, _m4); combI.mesh.setMatrixAt(k * 2 + 1, _m4);
        gooseHair(p, s);
      } else addPair(combI, k * 2, p, q, s, 3, ph, 0.3);
    }
    if (girdleM) {
      await ctx.yield();
      const gI = inst(await combGeo(pause, 'girdle'), combGlass, 2, 3);
      gI.set(0, 1, 0.2, 0.25, 3); gI.set(1, -1, 0.2, 0.25, 3);
      gI.mesh.setMatrixAt(0, girdleM); gI.mesh.setMatrixAt(1, girdleM);
    }
    await ctx.yield();
    // the great comb jellies of the avenue: the finer cast, 17 m tall, turning slowly
    const greatI = inst(await combGeo(pause, 'lobate', true), creatureMat({ tint: !night, seed: 3, fres: 0.55, sh: 0.3 }), greatSpots.length * 2, 3);
    await ctx.yield();
    greatSpots.forEach((p, k) => addPair(greatI, k * 2, p, new THREE.Quaternion().setFromEuler(new THREE.Euler(k ? -0.16 : 0.2, k ? 2.1 : 0.5, k ? 0.28 : -0.25)), GREAT_S, 3, 0.3 + 0.37 * k, 0.3));
    await ctx.yield();

    // larvae: crab zoea, pluteus or copepods; one pair rows past 9 m off at d 100
    await ctx.yield();
    const nLarva = pairs(5), larvaI = inst(await larvaGeo(pause, larvaCast), creatureMat({ seed: 4, fres: 0.3 }), nLarva * 2, 0);
    await ctx.yield();
    const larvaSpot = [12, 0.4, 433 - 100]; placed.push([...larvaSpot, 2]);
    for (let k = 0; k < nLarva; k++) {
      await ctx.yield();
      const p = k === 0 ? larvaSpot : ((k === 3 ? lateSpot(2) : freeSpot(2, 25, 380, 9, 40, -18, 18)) || [70 + k * 9, 30, 200]);
      const q = k === 0 ? new THREE.Quaternion().setFromEuler(new THREE.Euler(larvaCast === 'pluteus' ? 0.3 : -0.15, -0.5, 0.1)) : randQuat(0.5);
      addPair(larvaI, k * 2, p, q, k === 0 ? 1 : castRng.range(0.8, 1.2), 2, castRng(), castRng.range(0.9, 1.4), { fwd: new THREE.Vector3(0, 0, 1).applyQuaternion(q), wob: k === 0 ? 0.35 : 1.2 });
    }
    await ctx.yield();

    // small spined radiolarians, 4-12 m across, turning slowly (the mirrored twin counter-turns)
    await ctx.yield();
    const nRad = pairs(14), radI = inst(await radGeo(pause, 14), creatureMat({ seed: 6, fres: 0.25 }), nRad * 2 + 2, 0);
    await ctx.yield();
    for (let k = 0; k < nRad; k++) {
      await ctx.yield();
      const s = castRng.range(2, 6) * (k < 4 ? 0.7 : 1), p = (k % 4 === 1 ? lateSpot(s * 2.4) : freeSpot(s * 2.4, 20, 430, 10, 95, -55, 55)) || [120 + k * 20, 60, 100];
      addPair(radI, k * 2, p, randQuat(3), s, 0, castRng(), 0.25, { axis: new THREE.Vector3(castRng.range(-1, 1), castRng.range(0.3, 1), castRng.range(-1, 1)).normalize(), spin: castRng.range(0.08, 0.22) });
    }
    await ctx.yield();

    // siphonophores: 60 m chains hanging still, bells firing in sequence, tentilla (hairs) reeling in and out
    await ctx.yield();
    const nSipho = pairs(4), siphoI = inst(await siphoGeo(pause, false), creatureMat({ tint: !night, seed: 8, fres: 0.5, sh: 0.3 }), nSipho * 2, 3);
    await ctx.yield();
    for (let k = 0; k < nSipho; k++) {
      await ctx.yield();
      const p0 = freeSpot(5, 70 + k * 30, 180 + k * 60, 22, 62, 22, 40) || [80 + k * 15, 35, 250 - k * 40], p = nudge(p0[0], p0[1], p0[2], 5, true), ph = castRng();
      placed.push([p[0], p[1] - 30, p[2], 9], [p[0], p[1] - 55, p[2], 9]);
      siphoI.set(k * 2, 1, ph, 0.7, k); siphoI.set(k * 2 + 1, -1, ph, 0.7, k);
      _m4.makeTranslation(p[0], p[1], p[2]); siphoI.mesh.setMatrixAt(k * 2, _m4); siphoI.mesh.setMatrixAt(k * 2 + 1, _m4);
      for (let j = 0; j < 18; j++) { const y = -16.5 - j * 2.4, s = j % 2 ? 1 : -1; hairPair([p[0] + s * 0.66, p[1] + y - 1.9, p[2] + (j % 3 - 1) * 0.3], [s * 0.6, -hairRng.range(5, 9), 0.3], 10, 0.07, 2, 0.05, 0.45); }
    }
    await ctx.yield();

    // the great chains of the avenue: the finer cast at 1.8 times the size, hanging still; their tentilla are hairs
    await ctx.yield();
    const chainI = inst(await siphoGeo(pause, true), creatureMat({ tint: !night, seed: 9, fres: 0.5, sh: 0.3 }), chainSpots.length * 2, 3);
    await ctx.yield();
    for (let k = 0; k < chainSpots.length; k++) {
      await ctx.yield();
      const p = chainSpots[k], ph = 0.15 + 0.45 * k;
      chainI.set(k * 2, 1, ph, 0.7, k + 4); chainI.set(k * 2 + 1, -1, ph, 0.7, k + 4);
      _m4.compose(_v.set(p[0], p[1], p[2]), _q.identity(), _s.setScalar(CHAIN_S)); chainI.mesh.setMatrixAt(k * 2, _m4); chainI.mesh.setMatrixAt(k * 2 + 1, _m4);
      for (let j = 0; j < 18; j++) { const y = -16.5 - j * 2.4, sd = j % 2 ? 1 : -1; hairPair([p[0] + sd * 0.66 * CHAIN_S, p[1] + (y - 1.9) * CHAIN_S, p[2] + (j % 3 - 1) * 0.3 * CHAIN_S], [sd * 0.6 * CHAIN_S, -(6 + (j * 7 % 5) * 0.9) * CHAIN_S, 0.3 * CHAIN_S], 12, 0.07 * CHAIN_S, 2, 0.05, 0.45); }
    }
    await ctx.yield();

    // small medusae, 2-4 m across, pulsing every 1.5-3 s and hopping with each stroke
    await ctx.yield();
    const nHydro = pairs(15), hydroI = inst(await hydroGeo(pause), creatureMat({ tint: !night, seed: 10, fres: 0.6, sh: 0.3 }), nHydro * 2, 3);
    await ctx.yield();
    for (let k = 0; k < nHydro; k++) {
      await ctx.yield();
      const s = castRng.range(1, 2), p = (k % 3 === 1 ? lateSpot(s * 1.6) : freeSpot(s * 1.6, 15, 410, 8, 55, -28, 28)) || [90 + k * 8, -40, 150], q = randQuat(0.6);
      addPair(hydroI, k * 2, p, q, s, 1, castRng(), castRng.range(0.34, 0.66), { up: new THREE.Vector3(0, 1, 0).applyQuaternion(q) });
    }
    await ctx.yield();
    const gateI = inst(await hydroGeo(pause, true), creatureMat({ tint: !night, seed: 13, fres: 0.6, sh: 0.3 }), 2, 3);   // the gate pair: the finer cast
    { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.22, 0.4, -0.2)); addPair(gateI, 0, gateSpot, q, GATE_S, 1, 0.2, 0.3, { up: new THREE.Vector3(0, 1, 0).applyQuaternion(q) }); }
    await ctx.yield();
    // the opening: one more pair of spined radiolarians stands close to the lens for the first second and a half (the
    // path starts 6 m right of the plane with the gaze swung left, so the twins frame the first view at about 70% of
    // its half width either side, the right-hand one nearer and larger: 21 m off, half the frame height tip to tip),
    // and both are out of frame by u 0.05, spine tips included (their spines keep 6 m from the flight line). Staged
    // by hand, no seeded draw: the first of four spots that no seeded organism already stands in.
    {
      const spots = [[16.6, 3.5, 405], [17, -5, 404], [17.4, 8, 403], [16.6, 0, 402]];
      const p = spots.find((c) => !placed.some((o) => Math.hypot(o[0] - c[0], o[1] - c[1], o[2] - c[2]) < o[3] + 9.5)) || spots[0];
      addPair(radI, nRad * 2, p, new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, 0.9, -0.3)), 2.8, 0, 0.37, 0.25, { axis: new THREE.Vector3(0.35, 0.9, 0.25).normalize(), spin: 0.13 });
    }
    await ctx.yield();

    // ---- HAIR mesh
    {
      const g = new THREE.BufferGeometry(), f = (a, n) => new THREE.BufferAttribute(new Float32Array(a), n);
      g.setAttribute('position', f(hair.root, 3)); g.setAttribute('aRoot', f(hair.root, 3)); g.setAttribute('aDir', f(hair.dir, 3));
      await ctx.yield();
      g.setAttribute('aH', f(hair.h, 4)); g.setAttribute('aG', f(hair.g, 4));
      await ctx.yield();
      g.setIndex(hair.idx);
      await ctx.yield();
      const m = new THREE.Mesh(g, styleMaterial(U, { tint: true, side: THREE.DoubleSide, vertex: HAIR_VERT, fragment: HAIR_FRAG, uniforms: { uViewH, uReg } }));
      m.frustumCulled = false; m.renderOrder = 4; scene.add(m);
    }
    await ctx.yield();

    // ---- SPECKS AND GHOSTS: diatoms and Ceratium as the plate's small type, dense round the flight line; then three
    // ghost layers of line-only organisms standing 350-500, 600-800 and 1,000-1,400 m off.
    {
      const nSpeck = Math.round(3000 * detail * density), ghostN = [8, 9, 9], nGhost = 26, n = (nSpeck + nGhost) * 2;
      const aP = new Float32Array(n * 4), aQ = new Float32Array(n * 4);
      let k = 0;
      const put = (x, y, z, size, shape, ph, ink) => { for (const sg of [1, -1]) { aP.set([x, y, z, size], k * 4); aQ.set([shape, ph, sg, ink], k * 4); k++; } };
      for (let i = 0; i < nSpeck; i++) {
        const d = speckRng.range(-15, 398), r = 3 + 44 * Math.pow(speckRng(), 1.7), th = speckRng.range(0, TAU), t = speckRng();
        const shape = t < 0.3 ? 0 : t < 0.55 ? 1 : t < 0.7 ? 2 : t < 0.9 ? 3 : 4;
        const size = shape === 4 ? speckRng.range(0.5, 0.8) : speckRng.range(0.1, 0.33) * (shape === 3 ? 1.5 : 1);
        put(Math.abs(r * Math.cos(th)), lineY(Math.max(0, d)) + r * Math.sin(th), 433 - d, size, shape, speckRng(), speckRng() < (shape === 4 ? 0.5 : 0.3) ? 1 : 0);
        if (i % 100 === 99) await ctx.yield();
      }
      const rr = [[350, 500], [600, 800], [1000, 1400]], hs = [[28, 50], [45, 80], [80, 140]];
      for (let L = 0; L < 3; L++) for (let i = 0; i < ghostN[L]; i++) {
        const R = speckRng.range(rr[L][0], rr[L][1]), th = speckRng.range(-0.6, 1.4), d = (i % 3 === 0 ? 433 + R * speckRng.range(-0.1, 0.5) : R * speckRng.range(1.2, 2.4));
        put(R * Math.cos(th), R * Math.sin(th), 433 - d, speckRng.range(hs[L][0], hs[L][1]), 5 + (i + L) % 3, speckRng(), 0);
      }
      await ctx.yield();
      const g = new THREE.PlaneGeometry(2, 2);
      g.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4)); g.setAttribute('aQ', new THREE.InstancedBufferAttribute(aQ, 4));
      const m = new THREE.InstancedMesh(g, styleMaterial(U, { side: THREE.DoubleSide, vertex: QUAD_VERT, fragment: QUAD_FRAG, uniforms: { uViewH, uReg, uNightK } }), n);
      m.frustumCulled = false; m.renderOrder = 1; scene.add(m);
    }
    await ctx.yield();

    // ---- RARE: a swarm of 300 ephyrae streams across the lane in two mirrored sprays while u runs 0.45 -> 0.7
    let swarm = null;
    if (rare) {
      const n = 150, I = inst(await ephyraGeo(pause), creatureMat({ tint: !night, seed: 12, fres: 0.2, sh: 0.1, sil: 0.6 }), n * 2, 3), items = [];
      for (let i = 0; i < n; i++) {
        const d = rareRng.range(240, 352), up = rareRng() < 0.62;
        items.push({ d, A: 55 + rareRng.range(0, 25), y: lineY(d) + (up ? rareRng.range(8, 17) : -rareRng.range(8, 14)), rise: rareRng.range(8, 24) * (up ? 1 : -0.4), z: 433 - d + rareRng.range(-5, 5),
          q: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 + rareRng.range(-0.5, 0.5), rareRng.range(0, TAU), rareRng.range(-0.5, 0.5))), s: rareRng.range(1.55, 1.95), ph: rareRng() });   // each star turned toward the lens (its axis back along the flight line)
        I.set(i * 2, 1, items[i].ph, 2, i); I.set(i * 2 + 1, -1, items[i].ph, 2, i);
        if (i % 50 === 49) await ctx.yield();
      }
      swarm = { I, items };
    }
    await ctx.yield();

    // ---- NIGHT: the hero's tinted bodies (bell, arms, tentacles) first reserve their paper, and the great shell's
    // glass reserves its disc from outside only; the company is printed opaque at night, which reserves it for free.
    if (night) {
      const resMat = (m) => new THREE.ShaderMaterial({ uniforms: m.uniforms, vertexShader: m.vertexShader, fragmentShader: RESERVE_FRAG, side: m.side, depthWrite: false });
      let cs = 0, cn = 0;                                                  // mean angular radius of the two pore collars
      for (const st of G.struts) if (pore.has(st[2]) !== pore.has(st[3])) for (const ti of [st[0], st[1]]) { cs += Math.max(nodeP[ti].dot(va), nodeP[ti].dot(vb)); cn++; }
      await ctx.yield();
      const gres = new THREE.Mesh(new THREE.SphereGeometry(SR - 0.5, 44, 28), new THREE.ShaderMaterial({ vertexShader: GLASS_RES_VERT, fragmentShader: GLASS_RES_FRAG, side: THREE.FrontSide, depthWrite: false,
        uniforms: { uPaper: U.uPaper, uPa: { value: va.clone() }, uPb: { value: vb.clone() }, uPc: { value: cs / Math.max(cn, 1) } } }));
      gres.position.copy(shellC); gres.frustumCulled = false; gres.renderOrder = -0.5; scene.add(gres);
      await ctx.yield();
      const tints = []; hero.object.traverse((o) => { if (o.isMesh && o.material.transparent) tints.push(o); });
      for (const o of tints) { const t = new THREE.Mesh(o.geometry, resMat(o.material)); t.frustumCulled = false; t.renderOrder = -0.5; o.parent.add(t); }
    }
    await ctx.yield();

    // ---- per-frame motion of the pairs (time) and of the rare swarm (u)
    const frac = (x) => x - Math.floor(x), movingI = [combI, greatI, larvaI, radI, hydroI, gateI];
    const moveAll = (time, u) => {
      for (const m of movers) {
        for (let j = 0; j < 2; j++) {
          const t = time - j * 0.5;
          _v.copy(m.pos); _q.copy(m.quat);
          if (m.kind === 0) { _q.setFromAxisAngle(m.axis, t * m.spin).multiply(m.quat); _v.y += Math.sin(t * 0.21 + m.phase * 9) * 0.8; }
          else if (m.kind === 1) _v.addScaledVector(m.up, m.scale * 0.55 * Math.sin(TAU * (t * m.rate + m.phase) - 1.3));
          else if (m.kind === 2) {
            const ph = frac(t * m.rate + m.phase), jk = smoothstep(0, 0.16, ph) * (1 - smoothstep(0.16, 0.9, ph));
            _v.addScaledVector(m.fwd, 0.5 * jk); _v.x += Math.sin(t * 0.17 + m.phase * 7) * m.wob; _v.y += Math.cos(t * 0.13 + m.phase * 5) * 0.75 * m.wob;
          } else { _q.multiply(_q2.setFromAxisAngle(Y_AXIS, t * 0.12 + m.phase * 6)); _v.y += Math.sin(t * 0.19 + m.phase * 6); _v.z += Math.cos(t * 0.11 + m.phase * 4) * 1.2; }
          m.I.mesh.setMatrixAt(m.i + j, _m4.compose(_v, _q, _s.setScalar(m.scale)));
        }
      }
      for (const I of movingI) I.mesh.instanceMatrix.needsUpdate = true;
      if (swarm) {
        const dCam = u * path.length;
        for (let i = 0; i < swarm.items.length; i++) {
          const e = swarm.items[i], p = clamp((dCam - (e.d - 62)) / 74, 0, 1), s = e.s * smoothstep(0, 0.06, p) * (1 - smoothstep(0.94, 1, p));
          _v.set(lerp(-e.A, e.A, p), e.y + (p - 0.5) * e.rise + Math.sin(time * 0.7 + e.ph * 20) * 0.6, e.z);
          _m4.compose(_v, e.q, _s.setScalar(s)); swarm.I.mesh.setMatrixAt(i * 2, _m4); swarm.I.mesh.setMatrixAt(i * 2 + 1, _m4);
        }
        swarm.I.mesh.instanceMatrix.needsUpdate = true;
      }
    };
    moveAll(0, 0);
    await ctx.yield();

    // ---- the pulse clock: wall time, steered a little (never more than 22%) so that one contraction closes the rim
    // round the lens at u 0.925 whatever the flight speed; it keeps beating while the camera is held or parked.
    let corr = 0;
    const steer = (dt, time, u) => {
      if (u > 0.02 && u < 0.93) {
        let e = ((time + corr + (0.925 - u) * 40) / period - 0.24) % 1; if (e < 0) e += 1; if (e > 0.5) e -= 1;
        corr -= clamp(e * period * 0.6, -0.22, 0.22) * Math.min(dt, 0.1);
      }
      hero.setPulseClock(time + corr);
    };
    const ss = (u, a, b) => smoothstep(a, b, u);

    // ---- POIS: hold the shell while the path sways, glance at the rowing larva, lift to the medusa at the reveal,
    // then rest on the mouth so the portal is in view for the last third.
    const pois = [
      { at: shellC.clone().add(new THREE.Vector3(0, 7, 0)), from: 0.02, to: 0.3, weight: 0.3 },
      { at: new THREE.Vector3(-larvaSpot[0], larvaSpot[1], larvaSpot[2]), from: 0.12, to: 0.215, weight: 0.4 },
      { at: mouth.clone().add(new THREE.Vector3(0, -16, 0)), from: 0.37, to: 0.62, weight: 0.4 },
      { at: mouth.clone(), from: 0.55, to: 0.93, weight: 0.6 },
    ];

    return {
      scene, path, duration: 40,
      // a held breath inside the shell and under the lappets, a quicker glide down the sink between them
      pace: (u) => 1 - 0.14 * bell(u, 0.3, 0.42, 0.4) + 0.1 * bell(u, 0.48, 0.7, 0.4) - 0.28 * bell(u, 0.72, 0.9, 0.35),
      camera: { fov: 62, near: 0.3, far: 4000, sway: 0, bank: 0 },
      pois,
      portal: { shape: 'circle', radius: 4.5, tilt: true, revealDistance: 160, color: '#F4F1DC', glow: 0.7 },
      // POST: exact inks. No tone map, no bloom, no grade; there is no fog (ink fades to paper in the materials).
      post: { exposure: 1, flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        if (hour === 'dawn') hero.setInks(ss(u, 0.66, 0.74), ss(u, 0.4, 0.46), ss(u, 0.76, 0.84));   // the first proof: rose in one sweep
        else hero.setProgress(u);
        steer(dt, time, u);
        hero.update(dt, time, camera);
        uViewH.value = ctx.renderer ? ctx.renderer.getDrawingBufferSize(_size).y : 450;
        moveAll(time, u);
      },
      dispose() { hero.dispose(); },
    };
  },
};
